/**
 * What the watermark says/shows — kept separate from watermarkService.ts
 * (the pixel-composition logic) so a future image-based watermark (the
 * final brand art, once supplied) can replace this without touching how
 * canvases are drawn or how sizes/caching work.
 *
 * Current placeholder: repeating diagonal text + a bottom-left brand chip.
 */
export interface WatermarkSpec {
  diagonalLabel: string;
  brandChipLabel: string;
}

export function getWatermarkSpec(): WatermarkSpec {
  return {
    diagonalLabel: "LAPHOTUS · PREVIEW",
    brandChipLabel: "LAPHOTUS",
  };
}
