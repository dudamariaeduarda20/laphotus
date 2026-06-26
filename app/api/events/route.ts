import { NextRequest, NextResponse } from "next/server";
import { createEvent, listEvents } from "@/lib/services/eventService";
import { getUserIdFromRequest, requireRole } from "@/lib/utils/auth";
import { UserRole } from "@/lib/types";
import { z } from "zod";
import prisma from "@/lib/db/prisma";

const createEventSchema = z.object({
  title: z.string().min(3),
  description: z.string().optional(),
  date: z.string().datetime(),
  location: z.string().optional(),
  sport: z.string().min(2),
  banner: z.string().url().optional(),
});

/**
 * GET /api/events - List events (public)
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const sport = searchParams.get("sport") || undefined;
    const search = searchParams.get("search") || undefined;
    const limit = Math.min(parseInt(searchParams.get("limit") || "20"), 100);
    const offset = parseInt(searchParams.get("offset") || "0");
    const fromRaw = searchParams.get("from");
    const toRaw = searchParams.get("to");
    const from = fromRaw ? new Date(fromRaw) : undefined;
    const to = toRaw ? new Date(toRaw) : undefined;

    const { events, total } = await listEvents(
      sport,
      search,
      limit,
      offset,
      from && !isNaN(from.getTime()) ? from : undefined,
      to && !isNaN(to.getTime()) ? to : undefined
    );

    return NextResponse.json({ events, total, limit, offset });
  } catch (error) {
    console.error(error);
    return NextResponse.json(
      { error: "Failed to list events" },
      { status: 500 }
    );
  }
}

/**
 * POST /api/events - Create event (ORGANIZER, PHOTOGRAPHER, ADMIN)
 */
export async function POST(request: NextRequest) {
  try {
    // Check auth
    const user = await requireRole(request, [
      UserRole.ORGANIZER,
      UserRole.PHOTOGRAPHER,
      UserRole.ADMIN,
    ]);

    // Parse body
    const body = await request.json();
    const validated = createEventSchema.parse(body);

    // Get organizer ID
    let organizerId: string;

    if (user.role === UserRole.ORGANIZER) {
      const organizer = await prisma.organizer.findUnique({
        where: { userId: user.id },
      });
      if (!organizer) throw new Error("Organizer profile not found");
      organizerId = organizer.id;
    } else if (user.role === UserRole.PHOTOGRAPHER) {
      // Photographers need to associate with organizer
      const organizer = await prisma.organizer.findFirst({
        take: 1,
      });
      if (!organizer) throw new Error("No organizers in system");
      organizerId = organizer.id;
    } else {
      // Admin can create events for any organizer
      const organizer = await prisma.organizer.findFirst({
        take: 1,
      });
      if (!organizer) throw new Error("No organizers in system");
      organizerId = organizer.id;
    }

    const event = await createEvent(
      organizerId,
      validated.title,
      validated.description || null,
      new Date(validated.date),
      validated.location || null,
      validated.sport,
      validated.banner
    );

    return NextResponse.json(event, { status: 201 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Validation failed", details: error.issues },
        { status: 400 }
      );
    }

    const message = error instanceof Error ? error.message : "Create failed";

    if (message === "Unauthorized") {
      return NextResponse.json({ error: message }, { status: 401 });
    }

    return NextResponse.json({ error: message }, { status: 500 });
  }
}
