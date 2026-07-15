import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/db/prisma";
import { composeWatermarkedImage } from "@/lib/services/watermarkService";

export const runtime = "nodejs";

const OG_WIDTH = 1200;
const OG_HEIGHT = 630;

/**
 * GET /api/photos/[id]/og-image
 *
 * Real, server-side watermarked preview for social-share crawlers
 * (Facebook/WhatsApp/etc. fetch og:image directly — they never render CSS,
 * so a client-side overlay watermark would be invisible to them). See
 * lib/services/watermarkService.ts for the shared composition logic also
 * used by /api/photos/[id]/preview (detail page + gallery grid).
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  const photo = await prisma.photo.findUnique({
    where: { id },
    select: { key: true },
  });

  const buffer = await composeWatermarkedImage(photo?.key, OG_WIDTH, OG_HEIGHT);

  return new NextResponse(new Uint8Array(buffer), {
    status: 200,
    headers: {
      "Content-Type": "image/jpeg",
      "Cache-Control": "public, max-age=3600, s-maxage=86400",
    },
  });
}
