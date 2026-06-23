import prisma from "@/lib/db/prisma";

export interface DetectedBibNumber {
  number: string;
  confidence: number;
}

/**
 * OCR Service — extracts athlete bib numbers from the photo filename.
 *
 * Real local extraction: parses digit groups embedded in the filename
 * (e.g. "corrida-atleta-023.jpg" -> "023"). Deterministic, testable, and
 * tied to the actual file. For production-grade pixel OCR, swap this
 * function for Google Vision / AWS Textract (see DEPLOY.md) — the rest of
 * the pipeline (DB linking, search) stays unchanged.
 */
export function detectBibNumbers(fileName: string): DetectedBibNumber[] {
  // Strip extension, find every 1-4 digit run
  const base = fileName.replace(/\.[^.]+$/, "");
  const matches = base.match(/\d{1,4}/g) || [];

  // Normalize to 3-digit zero-padded, dedupe, ignore runs > 4 digits (timestamps)
  const seen = new Set<string>();
  const detected: DetectedBibNumber[] = [];

  for (const raw of matches) {
    if (raw.length > 4) continue;
    const number = raw.padStart(3, "0").slice(-4);
    if (seen.has(number)) continue;
    seen.add(number);
    detected.push({ number, confidence: 1 });
  }

  return detected;
}

/**
 * Process photo OCR: detect bib numbers, ensure BibNumber rows exist,
 * and create real PhotoBib links so athletes can search by dorsal.
 */
export async function processPhotoOCR(
  photoId: string,
  eventId: string,
  fileName: string
) {
  try {
    const detected = detectBibNumbers(fileName);

    if (detected.length === 0) {
      await prisma.photo.update({
        where: { id: photoId },
        data: {
          detectedBibNumbers: JSON.stringify([]),
          bibMetadata: { extracted_numbers: [], method: "filename_ocr" },
        },
      });
      return { success: true, detected: 0, numbers: [] };
    }

    for (const bib of detected) {
      // Ensure BibNumber row exists for this event+number
      const bibNumber = await prisma.bibNumber.upsert({
        where: { eventId_number: { eventId, number: bib.number } },
        update: {},
        create: {
          eventId,
          number: bib.number,
          metadata: { source: "ocr", confidence: bib.confidence },
        },
      });

      // Real link photo <-> bib
      await prisma.photoBib.upsert({
        where: {
          photoId_bibNumberId: { photoId, bibNumberId: bibNumber.id },
        },
        update: { confidence: bib.confidence },
        create: {
          photoId,
          bibNumberId: bibNumber.id,
          number: bib.number,
          confidence: bib.confidence,
        },
      });
    }

    await prisma.photo.update({
      where: { id: photoId },
      data: {
        detectedBibNumbers: JSON.stringify(detected),
        bibMetadata: {
          extracted_numbers: detected.map((b) => b.number),
          detected_at: new Date().toISOString(),
          method: "filename_ocr",
        },
      },
    });

    return {
      success: true,
      detected: detected.length,
      numbers: detected.map((b) => b.number),
    };
  } catch (error) {
    console.error("OCR processing error:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "OCR processing failed",
    };
  }
}

/**
 * Get all bib numbers for event
 */
export async function getEventBibNumbers(eventId: string) {
  return prisma.bibNumber.findMany({
    where: { eventId },
    orderBy: { number: "asc" },
  });
}

/**
 * Search photos by bib number — exact match via real PhotoBib join.
 */
export async function searchPhotosByBibNumber(
  eventId: string,
  bibNumber: string
) {
  const normalized = bibNumber.trim().padStart(3, "0").slice(-4);

  const photos = await prisma.photo.findMany({
    where: {
      eventId,
      status: "AVAILABLE",
      photoBibs: { some: { number: normalized } },
    },
    include: { photographer: true },
    orderBy: { createdAt: "desc" },
  });

  return photos;
}

/**
 * Update bib numbers for a photo (manual correction) — rewrites real links.
 */
export async function updatePhotoBibNumbers(
  photoId: string,
  bibNumbers: string[]
) {
  const photo = await prisma.photo.findUnique({
    where: { id: photoId },
    include: { event: true },
  });

  if (!photo) {
    throw new Error("Photo not found");
  }

  const normalized = Array.from(
    new Set(bibNumbers.map((n) => n.trim().padStart(3, "0").slice(-4)))
  );

  // Clear existing links, rebuild from manual input
  await prisma.photoBib.deleteMany({ where: { photoId } });

  for (const number of normalized) {
    const bibNumber = await prisma.bibNumber.upsert({
      where: { eventId_number: { eventId: photo.eventId, number } },
      update: {},
      create: {
        eventId: photo.eventId,
        number,
        metadata: { source: "manual_edit", photoId },
      },
    });

    await prisma.photoBib.create({
      data: {
        photoId,
        bibNumberId: bibNumber.id,
        number,
        confidence: 1,
      },
    });
  }

  await prisma.photo.update({
    where: { id: photoId },
    data: {
      detectedBibNumbers: JSON.stringify(
        normalized.map((n) => ({ number: n, confidence: 1 }))
      ),
      bibMetadata: {
        extracted_numbers: normalized,
        last_modified: new Date().toISOString(),
        method: "manual_edit",
      },
    },
  });

  return { success: true, numbers: normalized };
}
