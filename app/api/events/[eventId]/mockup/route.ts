import { auth } from "@/lib/auth";
import prisma from "@/lib/db/prisma";
import { uploadToStorage } from "@/lib/services/supabaseStorage";
import { NextRequest, NextResponse } from "next/server";

export async function POST(
  req: NextRequest,
  { params }: { params: { eventId: string } }
) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const eventId = params.eventId;
    const { dataUrl } = await req.json();

    if (!dataUrl) {
      return NextResponse.json(
        { error: "Missing dataUrl" },
        { status: 400 }
      );
    }

    // Verify user owns this event's organizer account
    const event = await prisma.event.findFirst({
      where: { id: eventId },
      include: { organizer: { include: { user: true } } },
    });

    if (!event) {
      return NextResponse.json({ error: "Event not found" }, { status: 404 });
    }

    if (event.organizer.user.id !== session.user.id) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    // Convert data URL to buffer
    const base64 = dataUrl.replace(/^data:image\/png;base64,/, "");
    const buffer = Buffer.from(base64, "base64");

    // Upload to storage
    const path = `mockups/${eventId}/${Date.now()}.png`;
    const { url: publicUrl } = await uploadToStorage(path, buffer, "image/png");

    // Save URL to database
    const updated = await prisma.event.update({
      where: { id: eventId },
      data: { mockupImageUrl: publicUrl },
    });

    return NextResponse.json({
      success: true,
      mockupImageUrl: publicUrl,
      event: updated,
    });
  } catch (error) {
    console.error("Mockup upload error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
