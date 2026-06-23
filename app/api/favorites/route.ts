import { NextRequest, NextResponse } from "next/server";
import {
  addFavorite,
  removeFavorite,
  getUserFavorites,
} from "@/lib/services/photoService";
import { getUserIdFromRequest } from "@/lib/utils/auth";
import { z } from "zod";

const favoriteSchema = z.object({
  photoId: z.string().min(1),
});

/**
 * GET /api/favorites - Get user favorites
 */
export async function GET(request: NextRequest) {
  try {
    const userId = getUserIdFromRequest(request);
    if (!userId) {
      return NextResponse.json(
        { error: "Not authenticated" },
        { status: 401 }
      );
    }

    const favorites = await getUserFavorites(userId);

    return NextResponse.json({ favorites });
  } catch (error) {
    console.error(error);
    return NextResponse.json(
      { error: "Failed to get favorites" },
      { status: 500 }
    );
  }
}

/**
 * POST /api/favorites - Add favorite
 */
export async function POST(request: NextRequest) {
  try {
    const userId = getUserIdFromRequest(request);
    if (!userId) {
      return NextResponse.json(
        { error: "Not authenticated" },
        { status: 401 }
      );
    }

    const body = await request.json();
    const validated = favoriteSchema.parse(body);

    await addFavorite(userId, validated.photoId);

    return NextResponse.json({ success: true }, { status: 201 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Validation failed" },
        { status: 400 }
      );
    }

    const message = error instanceof Error ? error.message : "Failed";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

/**
 * DELETE /api/favorites - Remove favorite
 */
export async function DELETE(request: NextRequest) {
  try {
    const userId = getUserIdFromRequest(request);
    if (!userId) {
      return NextResponse.json(
        { error: "Not authenticated" },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(request.url);
    const photoId = searchParams.get("photoId");

    if (!photoId) {
      return NextResponse.json(
        { error: "photoId required" },
        { status: 400 }
      );
    }

    await removeFavorite(userId, photoId);

    return NextResponse.json({ success: true });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
