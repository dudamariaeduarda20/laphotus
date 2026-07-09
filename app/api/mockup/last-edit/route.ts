import prisma from "@/lib/db/prisma";
import { NextResponse } from "next/server";

/**
 * Public, read-only: who last edited the hero camera mockup and when.
 * No auth required — this is display-only info shown to every visitor.
 */
export async function GET() {
  const lastEdit = await prisma.auditLog.findFirst({
    where: { action: "mockup_updated" },
    orderBy: { createdAt: "desc" },
    include: { user: true },
  });

  if (!lastEdit) {
    return NextResponse.json({ adminName: null, updatedAt: null });
  }

  return NextResponse.json({
    adminName: lastEdit.user?.name ?? "Admin",
    updatedAt: lastEdit.createdAt,
  });
}
