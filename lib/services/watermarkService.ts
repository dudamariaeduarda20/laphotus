import { createCanvas, loadImage, registerFont, CanvasRenderingContext2D } from "canvas";
import path from "path";
import { getWatermarkSpec } from "./watermarkContent";

const WATERMARK_FONT = "LaphotusWatermark";

// node-canvas has no system fonts to fall back on in Vercel's serverless
// runtime — without registering one explicitly, text renders as empty
// tofu boxes. Registered once per cold start (module scope), not per request.
let fontRegistered = false;
function ensureFontRegistered() {
  if (fontRegistered) return;
  registerFont(path.join(process.cwd(), "assets/fonts/DejaVuSans-Bold.ttf"), {
    family: WATERMARK_FONT,
  });
  fontRegistered = true;
}

/**
 * Resolves a Photo.key into a URL `canvas`'s loadImage can actually fetch.
 * Never returns a value for keys with no known-public location — callers
 * fall back to a plain background rather than risk loading something
 * unintended.
 */
export function resolveFetchableUrl(key: string | null | undefined): string | null {
  if (!key) return null;
  if (key.startsWith("http://") || key.startsWith("https://")) return key;
  if (key.startsWith("uploads/")) {
    const base = process.env.NEXT_PUBLIC_URL || "http://localhost:3000";
    return `${base}/${key}`;
  }
  // Legacy/seed S3 keys with no public URL — nothing safe to fetch here.
  return null;
}

/**
 * Composes a watermarked JPEG at the given dimensions from a photo's source
 * key. This is the ONLY code path allowed to produce a public-facing image
 * for a photo — it always bakes the watermark into the pixels, so it's safe
 * to serve to anonymous/crawler requests. The unwatermarked original is
 * served exclusively by the paid-download flow (/api/download/*), which
 * validates a COMPLETED order before returning a signed URL.
 */
export async function composeWatermarkedImage(
  key: string | null | undefined,
  width: number,
  height: number
): Promise<Buffer> {
  ensureFontRegistered();

  const canvas = createCanvas(width, height);
  const ctx = canvas.getContext("2d");

  // Background fallback in case the source image can't be loaded
  ctx.fillStyle = "#1a1a1a";
  ctx.fillRect(0, 0, width, height);

  const sourceUrl = resolveFetchableUrl(key);
  if (sourceUrl) {
    try {
      const image = await loadImage(sourceUrl);
      // Cover-fit the source image into the target canvas
      const scale = Math.max(width / image.width, height / image.height);
      const drawW = image.width * scale;
      const drawH = image.height * scale;
      const dx = (width - drawW) / 2;
      const dy = (height - drawH) / 2;
      ctx.drawImage(image, dx, dy, drawW, drawH);
    } catch (err) {
      console.error("[watermarkService] Falha ao carregar imagem de origem:", err);
      // Falls through to plain dark background — never leaks a broken/raw URL
    }
  }

  drawWatermark(ctx, width, height);

  return canvas.toBuffer("image/jpeg", { quality: 0.85 });
}

function drawWatermark(ctx: CanvasRenderingContext2D, width: number, height: number) {
  const spec = getWatermarkSpec();
  const fontScale = Math.max(0.5, Math.min(width, height) / 700);

  ctx.save();
  ctx.globalAlpha = 0.35;
  ctx.fillStyle = "#ffffff";
  ctx.font = `bold ${Math.round(48 * fontScale)}px "${WATERMARK_FONT}"`;
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";

  ctx.translate(width / 2, height / 2);
  ctx.rotate((-20 * Math.PI) / 180);

  // Repeat diagonally so cropping/overlay by the social platform can't remove it
  const step = Math.round(140 * fontScale);
  for (let y = -height; y <= height; y += step) {
    ctx.fillText(spec.diagonalLabel, 0, y);
  }
  ctx.restore();

  // Bottom-left brand mark, always legible regardless of source image
  const chipHeight = Math.round(56 * fontScale);
  const chipWidth = Math.round(260 * fontScale);
  ctx.save();
  ctx.globalAlpha = 0.9;
  ctx.fillStyle = "#09419b";
  ctx.fillRect(0, height - chipHeight, chipWidth, chipHeight);
  ctx.fillStyle = "#ffffff";
  ctx.font = `bold ${Math.round(22 * fontScale)}px "${WATERMARK_FONT}"`;
  ctx.textAlign = "left";
  ctx.textBaseline = "middle";
  ctx.fillText(spec.brandChipLabel, Math.round(16 * fontScale), height - chipHeight / 2);
  ctx.restore();
}
