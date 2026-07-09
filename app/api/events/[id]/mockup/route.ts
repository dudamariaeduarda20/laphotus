import prisma from "@/lib/db/prisma";
import { uploadToStorage } from "@/lib/services/supabaseStorage";
import { requireRole } from "@/lib/utils/auth";
import { UserRole } from "@/lib/types";
import { NextRequest, NextResponse } from "next/server";

export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const user = await requireRole(req, [UserRole.ADMIN]);

    const eventId = params.id;
    const { dataUrl } = await req.json();

    if (!dataUrl) {
      return NextResponse.json({ error: "Missing dataUrl" }, { status: 400 });
    }

    const event = await prisma.event.findUnique({ where: { id: eventId } });
    if (!event) {
      return NextResponse.json({ error: "Event not found" }, { status: 404 });
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

    // Audit trail: who edited the mockup and when
    await prisma.auditLog.create({
      data: {
        userId: user.id,
        action: "mockup_updated",
        resource: "event",
        resourceId: eventId,
        changes: { mockupImageUrl: publicUrl },
      },
    });

    return NextResponse.json({
      success: true,
      mockupImageUrl: publicUrl,
      editedBy: user.name,
      editedAt: updated.updatedAt,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Internal server error";
    const status = message === "Unauthorized" ? 401 : message === "Forbidden" ? 403 : 500;
    return NextResponse.json({ error: message }, { status });
  }
}
