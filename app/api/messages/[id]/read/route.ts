import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/db/prisma";
import { getUserIdFromRequest } from "@/lib/utils/auth";

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: messageId } = await params;
  const userId = getUserIdFromRequest(req);
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const message = await prisma.message.findUnique({
    where: { id: messageId },
    include: { conversation: true },
  });

  if (!message) {
    return NextResponse.json({ error: "Message not found" }, { status: 404 });
  }

  const isRecipient =
    message.conversation.initiatorId === userId ||
    message.conversation.participantId === userId;

  if (!isRecipient) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  try {
    const updated = await prisma.message.update({
      where: { id: messageId },
      data: {
        read: true,
        readAt: new Date(),
      },
      include: {
        sender: { select: { id: true, name: true, avatar: true } },
      },
    });

    return NextResponse.json(updated);
  } catch (err) {
    console.error("PATCH /messages/[id]/read:", err);
    return NextResponse.json(
      { error: "Failed to mark message as read" },
      { status: 500 }
    );
  }
}
