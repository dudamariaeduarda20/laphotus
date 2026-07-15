import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/db/prisma";
import { getUserIdFromRequest } from "@/lib/utils/auth";

export async function GET(req: NextRequest) {
  const userId = getUserIdFromRequest(req);
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const conversations = await prisma.conversation.findMany({
    where: {
      OR: [
        { initiatorId: userId },
        { participantId: userId },
      ],
    },
    include: {
      initiator: { select: { id: true, name: true, avatar: true } },
      participant: { select: { id: true, name: true, avatar: true } },
      photo: { select: { id: true, name: true } },
      event: { select: { id: true, title: true } },
      messages: {
        take: -1,
        orderBy: { createdAt: "desc" },
      },
    },
    orderBy: { lastMessageAt: "desc" },
  });

  return NextResponse.json({ conversations });
}

export async function POST(req: NextRequest) {
  const userId = getUserIdFromRequest(req);
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { participantId, photoId, eventId } = await req.json();

  if (!participantId || (!photoId && !eventId)) {
    return NextResponse.json(
      { error: "participantId + photoId or eventId required" },
      { status: 400 }
    );
  }

  if (photoId && eventId) {
    return NextResponse.json(
      { error: "Either photoId or eventId, not both" },
      { status: 400 }
    );
  }

  try {
    const conversation = await prisma.conversation.upsert({
      where: photoId
        ? {
            initiatorId_participantId_photoId: {
              initiatorId: userId,
              participantId,
              photoId,
            },
          }
        : {
            initiatorId_participantId_eventId: {
              initiatorId: userId,
              participantId,
              eventId: eventId!,
            },
          },
      create: {
        initiatorId: userId,
        participantId,
        photoId: photoId || null,
        eventId: eventId || null,
      },
      update: {},
      include: {
        initiator: { select: { id: true, name: true, avatar: true } },
        participant: { select: { id: true, name: true, avatar: true } },
        photo: { select: { id: true, name: true } },
        event: { select: { id: true, title: true } },
      },
    });

    return NextResponse.json(conversation, { status: 201 });
  } catch (err) {
    console.error("POST /conversations:", err);
    return NextResponse.json(
      { error: "Failed to create conversation" },
      { status: 500 }
    );
  }
}
