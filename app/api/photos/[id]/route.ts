import { NextRequest, NextResponse } from "next/server";
import {
  getPhotoById,
  updatePhoto,
  deletePhoto,
  addFavorite,
  removeFavorite,
} from "@/lib/services/photoService";
import { getUserIdFromRequest } from "@/lib/utils/auth";
import { PhotoStatus } from "@/lib/types";
import { z } from "zod";

// Photographers can only toggle visibility (AVAILABLE/ARCHIVED) — UPLOADING and
// PROCESSING are internal pipeline states, not settable through this endpoint.
const updateSchema = z.object({
  name: z.string().optional(),
  price: z.number().min(0).optional(),
  isPremium: z.boolean().optional(),
  status: z.enum([PhotoStatus.AVAILABLE, PhotoStatus.ARCHIVED]).optional(),
});

/**
 * GET /api/photos/[id]
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const photo = await getPhotoById((await params).id);

    if (!photo) {
      return NextResponse.json(
        { error: "Photo not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({ photo });
  } catch (error) {
    console.error(error);
    return NextResponse.json(
      { error: "Failed to get photo" },
      { status: 500 }
    );
  }
}

/**
 * PUT /api/photos/[id]
 */
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const userId = getUserIdFromRequest(request);
    if (!userId) {
      return NextResponse.json(
        { error: "Not authenticated" },
        { status: 401 }
      );
    }

    const body = await request.json();
    const validated = updateSchema.parse(body);

    const photo = await updatePhoto((await params).id, userId, validated);

    return NextResponse.json(photo);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Validation failed" },
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
 * DELETE /api/photos/[id]
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const userId = getUserIdFromRequest(request);
    if (!userId) {
      return NextResponse.json(
        { error: "Not authenticated" },
        { status: 401 }
      );
    }

    const result = await deletePhoto((await params).id, userId);

    return NextResponse.json(result);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Delete failed";

    if (message === "Not authorized") {
      return NextResponse.json({ error: message }, { status: 403 });
    }

    return NextResponse.json({ error: message }, { status: 500 });
  }
}
