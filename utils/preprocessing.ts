// Client-side image preprocessing — pure Canvas API, no native deps.
// Runs before AI calls to annotate images with sharpness, brightness,
// and cluster membership. Never rejects — only annotates.
// All functions are wrapped in try/catch; failures return safe defaults.

import { UploadedImage } from "@/hooks/useUpload";

// ─── Output type ──────────────────────────────────────────────────────────────

export interface PreprocessedImage extends UploadedImage {
  sharpness: number;      // 0–100 (higher = sharper)
  brightness: number;     // 0–255 average luminance
  likely_blurry: boolean; // sharpness < BLUR_THRESHOLD
  likely_dark: boolean;   // brightness < DARK_THRESHOLD
  likely_bright: boolean; // brightness > BRIGHT_THRESHOLD
  cluster_id: string;     // UUID shared by near-duplicate images
}

// ─── Thresholds ───────────────────────────────────────────────────────────────

const BLUR_THRESHOLD   = 25;   // sharpness score 0–100
const DARK_THRESHOLD   = 40;   // luminance 0–255
const BRIGHT_THRESHOLD = 220;  // luminance 0–255
const ANALYSIS_SIZE    = 100;  // canvas size for pixel analysis (center crop)
const CLUSTER_SIZE_TOL = 2048; // ±2KB tolerance for file-size grouping

// ─── Single-image pixel analysis ─────────────────────────────────────────────

interface PixelMetrics {
  sharpness: number;   // 0–100
  brightness: number;  // 0–255
}

// Draws the center 50% of the image into a 100×100 canvas, then computes:
//   • Laplacian variance for sharpness (single pass via Welford's algorithm)
//   • Average luminance for brightness (same pass)
async function analyzeImage(img: UploadedImage): Promise<PixelMetrics> {
  return new Promise((resolve) => {
    try {
      const image = new Image();

      image.onload = () => {
        try {
          const canvas = document.createElement("canvas");
          canvas.width  = ANALYSIS_SIZE;
          canvas.height = ANALYSIS_SIZE;
          const ctx = canvas.getContext("2d");

          if (!ctx) {
            resolve({ sharpness: 50, brightness: 128 });
            return;
          }

          // Center 50% crop — avoids unrepresentative edges
          const srcW = img.width  * 0.5;
          const srcH = img.height * 0.5;
          const srcX = img.width  * 0.25;
          const srcY = img.height * 0.25;

          ctx.drawImage(image, srcX, srcY, srcW, srcH, 0, 0, ANALYSIS_SIZE, ANALYSIS_SIZE);

          const { data } = ctx.getImageData(0, 0, ANALYSIS_SIZE, ANALYSIS_SIZE);
          const W = ANALYSIS_SIZE;
          const H = ANALYSIS_SIZE;

          // Convert RGBA to grayscale luminance values (BT.601)
          const gray = new Float32Array(W * H);
          let brightnessSum = 0;
          for (let i = 0; i < W * H; i++) {
            const r = data[i * 4];
            const g = data[i * 4 + 1];
            const b = data[i * 4 + 2];
            const lum = 0.299 * r + 0.587 * g + 0.114 * b;
            gray[i] = lum;
            brightnessSum += lum;
          }
          const brightness = brightnessSum / (W * H);

          // Laplacian variance via Welford's algorithm (skips 1-pixel border)
          // Laplacian kernel: center×4 - top - bottom - left - right
          let mean = 0;
          let M2   = 0;
          let count = 0;

          for (let y = 1; y < H - 1; y++) {
            for (let x = 1; x < W - 1; x++) {
              const lap =
                4 * gray[y * W + x] -
                gray[(y - 1) * W + x] -
                gray[(y + 1) * W + x] -
                gray[y * W + (x - 1)] -
                gray[y * W + (x + 1)];

              count++;
              const delta = lap - mean;
              mean  += delta / count;
              M2    += delta * (lap - mean);
            }
          }

          const variance  = count > 1 ? M2 / (count - 1) : 0;
          // Normalize: sqrt(variance) / sqrt(800) * 100, clamped 0–100
          // sqrt(800) ≈ 28.28 is a practical ceiling for sharp phone photos
          const sharpness = Math.min(100, (Math.sqrt(variance) / Math.sqrt(800)) * 100);

          resolve({ sharpness, brightness });
        } catch {
          resolve({ sharpness: 50, brightness: 128 });
        }
      };

      image.onerror = () => resolve({ sharpness: 50, brightness: 128 });
      image.src = img.base64;
    } catch {
      resolve({ sharpness: 50, brightness: 128 });
    }
  });
}

// ─── Duplicate clustering ─────────────────────────────────────────────────────

class UnionFind {
  private parent: number[];
  private rank: number[];

  constructor(n: number) {
    this.parent = Array.from({ length: n }, (_, i) => i);
    this.rank   = new Array(n).fill(0);
  }

  find(x: number): number {
    // Iterative path compression — avoids call stack overflow on large batches
    let root = x;
    while (this.parent[root] !== root) root = this.parent[root];
    while (this.parent[x] !== root) {
      const next = this.parent[x];
      this.parent[x] = root;
      x = next;
    }
    return root;
  }

  union(a: number, b: number): void {
    const ra = this.find(a);
    const rb = this.find(b);
    if (ra === rb) return;
    if (this.rank[ra] < this.rank[rb]) {
      this.parent[ra] = rb;
    } else if (this.rank[ra] > this.rank[rb]) {
      this.parent[rb] = ra;
    } else {
      this.parent[rb] = ra;
      this.rank[ra]++;
    }
  }
}

// Extracts the leading integer from a filename, e.g. "IMG_0042.jpg" → 42.
// Returns -1 if no numeric prefix is found.
function extractFileNumber(filename: string): number {
  const match = filename.match(/(\d+)/);
  return match ? parseInt(match[1], 10) : -1;
}

// Groups images by file size (±2KB) AND sequential filenames (number diff ≤ 2).
// Returns a cluster UUID per image index.
function computeClusters(images: UploadedImage[]): string[] {
  const uf = new UnionFind(images.length);

  for (let i = 0; i < images.length; i++) {
    for (let j = i + 1; j < images.length; j++) {
      const sizeSimilar =
        Math.abs(images[i].fileSize - images[j].fileSize) <= CLUSTER_SIZE_TOL;

      const numI = extractFileNumber(images[i].filename);
      const numJ = extractFileNumber(images[j].filename);
      const seqSimilar =
        numI !== -1 && numJ !== -1 && Math.abs(numI - numJ) <= 2;

      if (sizeSimilar && seqSimilar) {
        uf.union(i, j);
      }
    }
  }

  // Generate a stable UUID per root node so all cluster members share it
  const rootToId = new Map<number, string>();
  return images.map((_, i) => {
    const root = uf.find(i);
    if (!rootToId.has(root)) rootToId.set(root, crypto.randomUUID());
    return rootToId.get(root)!;
  });
}

// ─── Main entry point ─────────────────────────────────────────────────────────

export async function preprocessImages(
  images: UploadedImage[]
): Promise<PreprocessedImage[]> {
  if (images.length === 0) return [];

  // Pixel analysis runs in parallel across all images
  const metrics = await Promise.all(
    images.map((img) =>
      analyzeImage(img).catch(() => ({ sharpness: 50, brightness: 128 }))
    )
  );

  // Clustering is synchronous (pure index math)
  let clusterIds: string[];
  try {
    clusterIds = computeClusters(images);
  } catch {
    clusterIds = images.map(() => crypto.randomUUID());
  }

  return images.map((img, i) => ({
    ...img,
    sharpness:     metrics[i].sharpness,
    brightness:    metrics[i].brightness,
    likely_blurry: metrics[i].sharpness  < BLUR_THRESHOLD,
    likely_dark:   metrics[i].brightness < DARK_THRESHOLD,
    likely_bright: metrics[i].brightness > BRIGHT_THRESHOLD,
    cluster_id:    clusterIds[i],
  }));
}
