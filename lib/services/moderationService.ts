import prisma from "@/lib/db/prisma";
import { PhotoStatus } from "@/lib/types";
import { sendModerationDecisionEmail } from "./emailService";

// ==================== EVENTS ====================

export async function listEventsForModeration(status?: string) {
  return prisma.event.findMany({
    where: status ? { status } : undefined,
    include: {
      organizer: { include: { user: { select: { name: true, email: true } } } },
      _count: { select: { photos: true } },
    },
    orderBy: { createdAt: "desc" },
  });
}

export async function approveEvent(eventId: string, adminId: string) {
  const event = await prisma.event.update({
    where: { id: eventId },
    data: { status: "active" },
    include: { organizer: { include: { user: true } } },
  });

  await prisma.auditLog.create({
    data: {
      userId: adminId,
      action: "event_approved",
      resource: "event",
      resourceId: eventId,
    },
  });

  const emailResult = await sendModerationDecisionEmail({
    to: event.organizer.user.email,
    recipientName: event.organizer.user.name,
    itemType: "evento",
    itemName: event.title,
    approved: true,
  });

  return { event, emailResult };
}

export async function rejectEvent(eventId: string, adminId: string, reason: string) {
  const event = await prisma.event.update({
    where: { id: eventId },
    data: { status: "archived" },
    include: { organizer: { include: { user: true } } },
  });

  await prisma.auditLog.create({
    data: {
      userId: adminId,
      action: "event_rejected",
      resource: "event",
      resourceId: eventId,
      changes: { reason },
    },
  });

  const emailResult = await sendModerationDecisionEmail({
    to: event.organizer.user.email,
    recipientName: event.organizer.user.name,
    itemType: "evento",
    itemName: event.title,
    approved: false,
    reason,
  });

  return { event, emailResult };
}

// ==================== PHOTOS ====================
// Nota: fotos vão ao ar automaticamente no upload (sem gate de pré-aprovação).
// Esta moderação atua sobre fotos já publicadas: "aprovar" confirma AVAILABLE,
// "rejeitar" arquiva (ARCHIVED) — nunca apaga, preserva histórico de vendas.

export async function listPhotosForModeration(status?: string) {
  return prisma.photo.findMany({
    where: status ? { status: status as PhotoStatus } : undefined,
    include: {
      event: { select: { title: true } },
      photographer: { include: { user: { select: { name: true, email: true } } } },
      _count: { select: { reports: true } },
    },
    orderBy: { createdAt: "desc" },
    take: 100,
  });
}

export async function approvePhoto(photoId: string, adminId: string) {
  const photo = await prisma.photo.update({
    where: { id: photoId },
    data: { status: PhotoStatus.AVAILABLE },
    include: { photographer: { include: { user: true } } },
  });

  await prisma.auditLog.create({
    data: {
      userId: adminId,
      action: "photo_approved",
      resource: "photo",
      resourceId: photoId,
    },
  });

  const emailResult = await sendModerationDecisionEmail({
    to: photo.photographer.user.email,
    recipientName: photo.photographer.user.name,
    itemType: "foto",
    itemName: photo.name,
    approved: true,
  });

  return { photo, emailResult };
}

export async function rejectPhoto(photoId: string, adminId: string, reason: string) {
  const photo = await prisma.photo.update({
    where: { id: photoId },
    data: { status: PhotoStatus.ARCHIVED },
    include: { photographer: { include: { user: true } } },
  });

  await prisma.auditLog.create({
    data: {
      userId: adminId,
      action: "photo_rejected",
      resource: "photo",
      resourceId: photoId,
      changes: { reason },
    },
  });

  const emailResult = await sendModerationDecisionEmail({
    to: photo.photographer.user.email,
    recipientName: photo.photographer.user.name,
    itemType: "foto",
    itemName: photo.name,
    approved: false,
    reason,
  });

  return { photo, emailResult };
}

// ==================== REPORTS ====================

export async function listReports(status?: string) {
  return prisma.report.findMany({
    where: status ? { status } : undefined,
    include: {
      photo: {
        select: {
          id: true,
          name: true,
          status: true,
          photographer: { include: { user: { select: { id: true, name: true, banned: true } } } },
        },
      },
      reporter: { select: { id: true, name: true, email: true } },
    },
    orderBy: { createdAt: "desc" },
  });
}

export async function resolveReport(reportId: string, adminId: string) {
  const report = await prisma.report.update({
    where: { id: reportId },
    data: { status: "resolved", resolvedAt: new Date() },
  });

  await prisma.auditLog.create({
    data: {
      userId: adminId,
      action: "report_resolved",
      resource: "report",
      resourceId: reportId,
    },
  });

  return report;
}

// ==================== BAN ====================
// Ban só bloqueia login (User.banned) — não apaga nem arquiva conteúdo
// automaticamente, evita destruir histórico ligado a pedidos pagos.

export async function banUser(userId: string, adminId: string) {
  const user = await prisma.user.update({
    where: { id: userId },
    data: { banned: true },
  });

  await prisma.auditLog.create({
    data: {
      userId: adminId,
      action: "user_banned",
      resource: "user",
      resourceId: userId,
    },
  });

  return user;
}

export async function unbanUser(userId: string, adminId: string) {
  const user = await prisma.user.update({
    where: { id: userId },
    data: { banned: false },
  });

  await prisma.auditLog.create({
    data: {
      userId: adminId,
      action: "user_unbanned",
      resource: "user",
      resourceId: userId,
    },
  });

  return user;
}
