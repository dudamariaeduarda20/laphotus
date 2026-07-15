import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/db/prisma";
import { composeWatermarkedImage } from "@/lib/services/watermarkService";

export const runtime = "nodejs";

// Fixed presets (not arbitrary width/height) so this route can't be abused
// to render a near-original-resolution copy — see lib/services/watermarkService.ts.
const SIZES = {
  thumb: { width: 480, height: 360 },
  detail: { width: 1200, height: 800 },
} as const;

type SizeKey = keyof typeof SIZES;

/**
 * GET /api/photos/[id]/preview?size=thumb|detail
 *
 * The ONLY image source the public gallery grid and photo detail page are
 * allowed to use. Always returns a real, pixel-baked watermark — never the
 * original file (that only comes from the paid-download flow after a
 * COMPLETED order is verified). See lib/services/watermarkService.ts.
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const { searchParams } = new URL(request.url);
  const sizeParam = searchParams.get("size");
  const size: SizeKey = sizeParam === "thumb" ? "thumb" : "detail";
  const { width, height } = SIZES[size];

  const photo = await prisma.photo.findUnique({
    where: { id },
    select: { key: true },
  });

  const buffer = await composeWatermarkedImage(photo?.key, width, height);

  return new NextResponse(new Uint8Array(buffer), {
    status: 200,
    headers: {
      "Content-Type": "image/jpeg",
      // Public preview never changes for a given photo+size — safe to cache
      // aggressively at the edge instead of recomposing on every view.
      "Cache-Control": "public, max-age=3600, s-maxage=86400, stale-while-revalidate=604800",
    },
  });
}
