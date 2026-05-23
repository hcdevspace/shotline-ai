// Client-side image preprocessing using the Canvas API.
// Runs before any AI call to cheaply filter obvious rejects.
// Checks: blur (Laplacian variance), brightness (average luminance),
// and minimum resolution. Returns a ClientFilterReason or null if the
// image passes. Processes one image at a time to avoid blocking the main thread.

import { ClientFilterReason } from "@/lib/types";

// Thresholds — tuned for typical phone/camera photos
const MIN_BLUR_VARIANCE = 80;       // lower = blurrier
const MIN_BRIGHTNESS = 25;          // 0–255 scale
const MAX_BRIGHTNESS = 230;         // 0–255 scale
const MIN_DIMENSION = 200;          // pixels (shortest side)

// TODO: implement real Laplacian blur detection via canvas pixel sampling
// TODO: implement brightness check via averaging all pixel luminance values

export async function preprocessImage(
  file: File
): Promise<ClientFilterReason | null> {
  // Placeholder: always passes preprocessing
  // Will be replaced with real canvas-based detection
  return null;
}

// Resize a File to max `maxDim` pixels on the longest side,
// returning a base64 string ready to send to /api/analyze.
// Reduces payload size ~10x vs. sending full-resolution images.
export async function resizeToBase64(
  file: File,
  maxDim = 768
): Promise<{ base64: string; mimeType: string }> {
  // TODO: implement via HTMLCanvasElement + drawImage + toDataURL
  // Placeholder returns empty string so API route can be wired up
  return { base64: "", mimeType: file.type };
}
