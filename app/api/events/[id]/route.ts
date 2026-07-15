import { NextRequest, NextResponse } from "next/server";
import {
  getEventById,
  updateEvent,
  deleteEvent,
  getEventStats,
} from "@/lib/services/eventService";
import { getUserIdFromRequest, requireRole } from "@/lib/utils/auth";
import { UserRole } from "@/lib/types";
import { z } from "zod";

const updateEventSchema = z.object({
  title: z.string().min(3).optional(),
  description: z.string().optional(),
  date: z.string().datetime().optional(),
  location: z.string().optional(),
  sport: z.string().min(2).optional(),
  banner: z.string().url().optional(),
  status: z.enum(["active", "finished", "archived"]).optional(),
});

/**
 * GET /api/events/[id] - Get event details
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const event = await getEventById((await params).id);

    if (!event) {
      return NextResponse.json({ error: "Event not found" }, { status: 404 });
    }

    const stats = await getEventStats((await params).id);

    return NextResponse.json({ event, stats });
  } catch (error) {
    console.error(error);
    return NextResponse.json(
      { error: "Failed to get event" },
      { status: 500 }
    );
  }
}

/**
 * PUT /api/events/[id] - Update event
 */
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const userId = getUserIdFromRequest(request);
    if (!userId) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }

    const body = await request.json();
    const validated = updateEventSchema.parse(body);

    const data: any = {};
    if (validated.title) data.title = validated.title;
    if (validated.description) data.description = validated.description;
    if (validated.date) data.date = new Date(validated.date);
    if (validated.location) data.location = validated.location;
    if (validated.sport) data.sport = validated.sport;
    if (validated.banner) data.banner = validated.banner;
    if (validated.status) data.status = validated.status;

    const event = await updateEvent((await params).id, userId, data);

    return NextResponse.json({ event });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Validation failed", details: error.issues },
        { status: 400 }
      );
    }

    const message = error instanceof Error ? error.message : "Update failed";

    if (message === "Not authorized") {
      return NextResponse.json({ error: message }, { status: 403 });
    }

    return NextResponse.json({ error: message }, { status: 500 });
  }
}

/**
 * DELETE /api/events/[id] - Delete event
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const userId = getUserIdFromRequest(request);
    if (!userId) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }

    // Apaga de verdade só se o evento nunca teve fotos; senão arquiva
    // (preserva fotos + encomendas já pagas — ver deleteEvent).
    const result = await deleteEvent((await params).id, userId);

    return NextResponse.json({ ok: true, ...result });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Delete failed";

    if (message === "Not authorized") {
      return NextResponse.json({ error: message }, { status: 403 });
    }
    if (message === "Event not found") {
      return NextResponse.json({ error: message }, { status: 404 });
    }

    return NextResponse.json({ error: message }, { status: 500 });
  }
}
