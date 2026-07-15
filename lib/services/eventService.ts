import prisma from "@/lib/db/prisma";
import { UserRole } from "@/lib/types";
import { generateEventCover } from "@/lib/server/generateEventCover";

/**
 * Create event (ORGANIZER, PHOTOGRAPHER, ADMIN only)
 */
export async function createEvent(
  organizerId: string,
  title: string,
  description: string | null,
  date: Date,
  location: string | null,
  sport: string,
  banner?: string | null
) {
  // Generate default cover if none provided
  let coverUrl = banner || null;
  if (!banner) {
    try {
      coverUrl = await generateEventCover({
        eventName: title,
        date,
        location: location || "Local não especificado",
      });
    } catch (error) {
      console.error("Failed to generate event cover:", error);
      // Fallback to static default
      coverUrl = "/images/default-event-cover.jpg";
    }
  }

  const event = await prisma.event.create({
    data: {
      organizerId,
      title,
      description,
      date,
      location,
      sport,
      banner: coverUrl,
      status: "active",
    },
    include: { organizer: true },
  });

  return event;
}

/**
 * Get event by ID
 */
export async function getEventById(eventId: string) {
  const event = await prisma.event.findUnique({
    where: { id: eventId },
    include: {
      organizer: true,
      photos: {
        include: { photographer: true },
        orderBy: { createdAt: "desc" },
        take: 50,
      },
    },
  });

  return event;
}

/**
 * List events (public)
 */
export async function listEvents(
  sport?: string,
  search?: string,
  limit: number = 20,
  offset: number = 0,
  from?: Date,
  to?: Date,
  location?: string
) {
  const where: any = {
    status: "active",
  };

  if (sport) {
    where.sport = sport;
  }

  if (location) {
    where.location = {
      equals: location,
      mode: "insensitive",
    };
  }

  if (search) {
    where.OR = [
      { title: { contains: search, mode: "insensitive" } },
      { description: { contains: search, mode: "insensitive" } },
      { location: { contains: search, mode: "insensitive" } },
    ];
  }

  // Filtro por intervalo de datas (busca avançada da home)
  if (from || to) {
    where.date = {};
    if (from) where.date.gte = from;
    if (to) where.date.lte = to;
  }

  const events = await prisma.event.findMany({
    where,
    include: {
      organizer: true,
      photos: {
        take: 3, // Thumbnail photos
      },
    },
    orderBy: { date: "desc" },
    take: limit,
    skip: offset,
  });

  const total = await prisma.event.count({ where });

  return { events, total };
}

/**
 * Get user's events (organizer/photographer)
 */
export async function getUserEvents(userId: string) {
  const user = await prisma.user.findUnique({
    where: { id: userId },
  });

  if (!user) throw new Error("User not found");

  // If organizer or admin, get organized events
  if (user.role === UserRole.ORGANIZER || user.role === UserRole.ADMIN) {
    const organizer = await prisma.organizer.findUnique({
      where: { userId },
    });

    if (!organizer) throw new Error("Organizer profile not found");

    return prisma.event.findMany({
      where: { organizerId: organizer.id },
      include: {
        organizer: true,
        photos: { take: 1 },
        _count: { select: { photos: true } },
      },
      orderBy: { createdAt: "desc" },
    });
  }

  // If photographer, get events where they have photos
  if (user.role === UserRole.PHOTOGRAPHER) {
    const photographer = await prisma.photographer.findUnique({
      where: { userId },
    });

    if (!photographer) throw new Error("Photographer profile not found");

    return prisma.event.findMany({
      where: {
        photos: {
          some: { photographerId: photographer.id },
        },
      },
      include: {
        organizer: true,
        photos: {
          where: { photographerId: photographer.id },
        },
      },
      orderBy: { createdAt: "desc" },
    });
  }

  throw new Error("User role cannot manage events");
}

/**
 * Update event
 */
export async function updateEvent(
  eventId: string,
  userId: string,
  data: {
    title?: string;
    description?: string | null;
    date?: Date;
    location?: string | null;
    sport?: string;
    banner?: string | null;
    status?: string;
  }
) {
  const event = await prisma.event.findUnique({
    where: { id: eventId },
    include: { organizer: true },
  });

  if (!event) {
    throw new Error("Event not found");
  }

  // Check authorization (organizer or admin)
  const user = await prisma.user.findUnique({
    where: { id: userId },
    include: { organizer: true },
  });

  if (!user) throw new Error("User not found");

  // Only event organizer or admin can edit
  if (
    user.role !== UserRole.ADMIN &&
    user.organizer?.id !== event.organizerId
  ) {
    throw new Error("Not authorized");
  }

  const updated = await prisma.event.update({
    where: { id: eventId },
    data,
    include: { organizer: true },
  });

  return updated;
}

/**
 * Delete event
 */
export async function deleteEvent(eventId: string, userId: string) {
  const event = await prisma.event.findUnique({
    where: { id: eventId },
    include: { organizer: true },
  });

  if (!event) {
    throw new Error("Event not found");
  }

  // Check authorization
  const user = await prisma.user.findUnique({
    where: { id: userId },
    include: { organizer: true },
  });

  if (!user) throw new Error("User not found");

  if (
    user.role !== UserRole.ADMIN &&
    user.organizer?.id !== event.organizerId
  ) {
    throw new Error("Not authorized");
  }

  // Never hard-delete an event that already has photos — Photo has
  // onDelete: Cascade on Event, so a hard delete would wipe every photo
  // (and, transitively, any paid OrderItem for them). Archive instead.
  const photoCount = await prisma.photo.count({ where: { eventId } });
  if (photoCount > 0) {
    await prisma.event.update({
      where: { id: eventId },
      data: { status: "archived" },
    });
    return { success: true, archived: true };
  }

  await prisma.event.delete({
    where: { id: eventId },
  });

  return { success: true, archived: false };
}

/**
 * Get event stats (photos count, etc)
 */
export async function getEventStats(eventId: string) {
  const event = await prisma.event.findUnique({
    where: { id: eventId },
  });

  if (!event) throw new Error("Event not found");

  const photoCount = await prisma.photo.count({
    where: { eventId },
  });

  const photographers = await prisma.photo.findMany({
    where: { eventId },
    select: { photographerId: true },
    distinct: ["photographerId"],
  });

  return {
    photoCount,
    photographerCount: photographers.length,
    eventDate: event.date,
    location: event.location,
  };
}
