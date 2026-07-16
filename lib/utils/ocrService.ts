import Tesseract from "tesseract.js";

// Singleton worker instance (cached in memory)
let workerInstance: Tesseract.Worker | null = null;
let initPromise: Promise<Tesseract.Worker> | null = null;

async function getWorker(): Promise<Tesseract.Worker> {
  if (workerInstance) return workerInstance;
  if (initPromise) return initPromise;

  initPromise = (async () => {
    workerInstance = await Tesseract.createWorker("eng", 1, {
      workerPath: "https://cdn.jsdelivr.net/npm/tesseract.js@5/dist/worker.min.js",
    });
    return workerInstance;
  })();

  return initPromise;
}

// Extract numbers from OCR text (bib numbers are typically 1-4 digits)
function extractBibNumbers(text: string): string[] {
  // Split by newlines/spaces, find digit sequences
  const matches = text.match(/\b\d{1,4}\b/g) || [];
  // Filter to reasonable bib numbers (1-999, exclude year-like 2024+)
  return matches.filter((n) => {
    const num = parseInt(n, 10);
    return num >= 1 && num <= 999;
  });
}

// Find largest/most prominent text block (likely bib zone)
function findLargestBlock(
  blocks: Tesseract.Block[]
): Tesseract.Block | null {
  if (!blocks || blocks.length === 0) return null;
  // Sort by confidence + size (bbox area)
  return blocks.reduce((best, block) => {
    const blockArea = (block.bbox?.x1 ?? 0 - (block.bbox?.x0 ?? 0)) *
      (block.bbox?.y1 ?? 0 - (block.bbox?.y0 ?? 0));
    const bestArea = (best.bbox?.x1 ?? 0 - (best.bbox?.x0 ?? 0)) *
      (best.bbox?.y1 ?? 0 - (best.bbox?.y0 ?? 0));
    const blockScore = (block.confidence ?? 0) * blockArea;
    const bestScore = (best.confidence ?? 0) * bestArea;
    return blockScore > bestScore ? block : best;
  });
}

export interface OCRResult {
  detected: boolean;
  number: string | null;
  confidence: number;
  rawText: string;
  allNumbers: string[];
}

/**
 * detectBibNumber: run OCR on image → extract bib number
 *
 * Returns:
 * - detected: true if confident match found
 * - number: extracted bib number (1-3 digits) or null
 * - confidence: 0-1 score (Tesseract avg confidence)
 * - rawText: full OCR output (for debugging)
 * - allNumbers: all 1-4 digit numbers found
 */
export async function detectBibNumber(imageBlob: Blob): Promise<OCRResult> {
  try {
    const worker = await getWorker();
    const result = await worker.recognize(imageBlob);

    const text = result.data.text || "";
    const allNumbers = extractBibNumbers(text);
    const confidence = result.data.confidence / 100; // Convert to 0-1

    // Pick first/largest number if multiple found
    const detected = allNumbers.length > 0 && confidence > 0.4;
    const number = detected ? allNumbers[0] : null;

    console.log(
      `[ocr] detected=${detected} number=${number} confidence=${confidence.toFixed(2)} text="${text.slice(0, 50)}..."`
    );

    return {
      detected,
      number,
      confidence,
      rawText: text,
      allNumbers,
    };
  } catch (err) {
    console.error("[ocr] error:", err);
    return {
      detected: false,
      number: null,
      confidence: 0,
      rawText: "",
      allNumbers: [],
    };
  }
}

export async function terminateWorker() {
  if (workerInstance) {
    await workerInstance.terminate();
    workerInstance = null;
    initPromise = null;
  }
}
