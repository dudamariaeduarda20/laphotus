import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/db/prisma";

export async function GET(req: NextRequest) {
  try {
    const query = req.nextUrl.searchParams.get("q")?.toLowerCase() || "";

    const locations = await prisma.event.findMany({
      where: {
        location: {
          not: null,
        },
        ...(query && {
          location: {
            contains: query,
            mode: "insensitive",
          },
        }),
      },
      distinct: ["location"],
      select: {
        location: true,
      },
      orderBy: {
        location: "asc",
      },
      take: 10,
    });

    return NextResponse.json({
      locations: locations
        .map((e) => e.location)
        .filter((l): l is string => l !== null),
    });
  } catch (err) {
    console.error("GET /api/events/locations error:", err);
    return NextResponse.json(
      { error: "Failed to fetch locations" },
      { status: 500 }
    );
  }
}
