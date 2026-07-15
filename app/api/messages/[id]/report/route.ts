import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/db/prisma";
import { getUserIdFromRequest } from "@/lib/utils/auth";

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: messageId } = await params;
  const userId = getUserIdFromRequest(req);
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const { reason } = await req.json();

  if (!reason?.trim()) {
    return NextResponse.json({ error: "Reason required" }, { status: 400 });
  }

  const message = await prisma.message.findUnique({
    where: { id: messageId },
  });

  if (!message) {
    return NextResponse.json({ error: "Message not found" }, { status: 404 });
  }

  try {
    const report = await prisma.messageReport.create({
      data: {
        messageId,
        reporterId: userId,
        reason: reason.trim(),
      },
    });

    return NextResponse.json(report, { status: 201 });
  } catch (err) {
    console.error("POST /messages/[id]/report:", err);
    return NextResponse.json(
      { error: "Failed to report message" },
      { status: 500 }
    );
  }
}
