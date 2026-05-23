// POST /api/analyze
//
// Input:  { clusters: Array<{ cluster_id, images: [] }> }
// Output: { results: Array<GeminiRawResult> }
//
// Clusters are processed serially. Each cluster is split into sub-batches
// of at most 5 images, each sub-batch = one Gemini call.
// If NEXT_PUBLIC_MOCK_MODE=true, all Gemini calls are skipped and deterministic
// mock results are returned after a 1.5 s simulated delay.
//
// The API key never leaves the server — clients call this route only.

import { NextRequest, NextResponse } from "next/server";
import { analyzeBatch, GeminiImageInput, GeminiRawResult, fallbackResult } from "@/lib/gemini";

const IS_MOCK   = process.env.NEXT_PUBLIC_MOCK_MODE === "true";
const BATCH_MAX = 5;

// ─── Request types ────────────────────────────────────────────────────────────

interface IncomingImage {
  id: string;
  filename: string;
  base64: string;
  likely_blurry?: boolean;
  likely_dark?: boolean;
}

interface IncomingCluster {
  cluster_id: string;
  images: IncomingImage[];
}

// ─── Base64 helpers ───────────────────────────────────────────────────────────

function stripDataUrlPrefix(s: string): string {
  const i = s.indexOf(",");
  return i !== -1 ? s.slice(i + 1) : s;
}

function mimeFromDataUrl(s: string): string {
  const m = s.match(/^data:([^;]+);/);
  return m ? m[1] : "image/jpeg";
}

function toGeminiInput(img: IncomingImage): GeminiImageInput {
  const isDataUrl = img.base64.startsWith("data:");
  return {
    id:            img.id,
    filename:      img.filename,
    base64:        isDataUrl ? stripDataUrlPrefix(img.base64) : img.base64,
    mimeType:      isDataUrl ? mimeFromDataUrl(img.base64)    : "image/jpeg",
    likely_blurry: img.likely_blurry,
    likely_dark:   img.likely_dark,
  };
}

// ─── Chunking ─────────────────────────────────────────────────────────────────

function chunk<T>(arr: T[], size: number): T[][] {
  const out: T[][] = [];
  for (let i = 0; i < arr.length; i += size) out.push(arr.slice(i, i + size));
  return out;
}

// ─── Mock data ────────────────────────────────────────────────────────────────

type Decision = GeminiRawResult["decision"];

const MOCK_POOL: Decision[]                  = ["best", "keep", "keep", "uncertain", "reject"];
const MOCK_RANGES: Record<Decision, [number, number]> = {
  best:      [81, 96],
  keep:      [52, 79],
  uncertain: [31, 49],
  reject:    [ 4, 28],
};
const MOCK_QTAGS: Record<Decision, string[][]> = {
  best:      [["sharp", "good-lighting", "well-composed"], ["sharp", "well-composed"]],
  keep:      [["sharp", "good-lighting"], ["well-composed", "noisy"]],
  uncertain: [["blurry", "underexposed"], ["motion-blur"]],
  reject:    [["motion-blur", "blurry"], ["underexposed"], ["duplicate", "blurry"]],
};
const MOCK_OTAGS: Record<Decision, string[][]> = {
  best:      [["portrait", "candid"], ["travel", "nature"]],
  keep:      [["candid", "group-photo"], ["travel"]],
  uncertain: [["candid"], ["portrait", "selfie"]],
  reject:    [["candid"], ["portrait"]],
};
const MOCK_CAPTIONS: Record<Decision, string[]> = {
  best: [
    "Golden afternoon light catches every detail in this perfectly timed, razor-sharp frame.",
    "Strong leading lines draw the eye straight to a well-lit, confident subject.",
    "Natural light sculpts the scene beautifully, with every element placed with intention.",
  ],
  keep: [
    "A genuine moment captured with solid exposure and mostly sharp focus throughout.",
    "Good framing and warm ambient light carry this image despite minor softness.",
    "The composition holds up well even with a touch of noise in the shadows.",
  ],
  uncertain: [
    "An interesting subject partially lost to motion blur and flat lighting.",
    "The moment is there but soft focus across the frame makes it borderline.",
    "Awkward crop clips the subject at the edge with no clear compositional intent.",
  ],
  reject: [
    "Heavy motion blur smears across the entire frame, leaving no recoverable detail.",
    "Severe underexposure buries the subject in shadow with no visible highlight structure.",
    "A washed-out duplicate of a cleaner version that appears elsewhere in this batch.",
    "Blown highlights erase all subject detail in a frame with no recoverable tones.",
  ],
};
const MOCK_REASONING: Record<Decision, string[]> = {
  best: [
    "Tack-sharp focus on the subject and intentional composition make this the clear standout.",
    "Exceptional ambient light and a decisive moment separate this from every other image.",
    "Strong compositional structure with no technical weaknesses — this earns the single best-pick slot.",
  ],
  keep: [
    "Minor softness on secondary elements prevents a Best score, but the core subject is solid.",
    "Slight highlight clipping doesn't undermine the overall quality of the framing.",
    "Sensor noise in shadow areas is noticeable at full size, but composition and exposure are otherwise good.",
  ],
  uncertain: [
    "Noticeable camera shake affects subject sharpness — usable only at small sizes.",
    "Backlit exposure leaves the subject at least one stop underexposed with limited recovery headroom.",
    "The frame crops the primary subject at an unintentional boundary, making composition unclear.",
  ],
  reject: [
    "Severe motion blur renders every element in the frame unrecognizable — nothing to recover.",
    "Extreme underexposure with no highlight structure means digital recovery is not viable.",
    "This is a near-duplicate of a sharper image in the batch and scores near zero by the duplicate rule.",
    "Total highlight clipping across the subject eliminates all usable tonal information.",
  ],
};

function hashStr(s: string): number {
  let h = 0;
  for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) >>> 0;
  return h;
}

function pick<T>(arr: T[], h: number): T {
  return arr[h % arr.length];
}

function buildMockResult(img: IncomingImage): GeminiRawResult {
  const h        = hashStr(img.filename);
  const decision = pick(MOCK_POOL, h);
  const [min, max] = MOCK_RANGES[decision];
  return {
    id:                img.id,
    decision,
    confidence:        min + (h % (max - min + 1)),
    quality_tags:      pick(MOCK_QTAGS[decision],     h >> 4),
    organization_tags: pick(MOCK_OTAGS[decision],     h >> 8),
    caption:           pick(MOCK_CAPTIONS[decision],  h >> 12),
    reasoning:         pick(MOCK_REASONING[decision], h >> 16),
  };
}

// ─── Route handler ────────────────────────────────────────────────────────────

export async function POST(req: NextRequest) {
  let body: { clusters?: IncomingCluster[] };

  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const { clusters } = body;

  if (!Array.isArray(clusters) || clusters.length === 0) {
    return NextResponse.json({ error: "clusters array is required" }, { status: 400 });
  }

  const allImages = clusters.flatMap((c) => Array.isArray(c.images) ? c.images : []);

  if (allImages.length === 0) {
    return NextResponse.json({ error: "No images provided in clusters" }, { status: 400 });
  }

  // ── Mock mode ──────────────────────────────────────────────────────────────
  if (IS_MOCK) {
    await new Promise((res) => setTimeout(res, 1500 + Math.random() * 500));
    return NextResponse.json({ results: allImages.map(buildMockResult) });
  }

  // ── Real mode: serial cluster → serial sub-batch processing ───────────────
  const results: GeminiRawResult[] = [];

  for (const cluster of clusters) {
    const images = Array.isArray(cluster.images) ? cluster.images : [];
    if (images.length === 0) continue;

    for (const subBatch of chunk(images, BATCH_MAX)) {
      const inputs: GeminiImageInput[] = subBatch.map(toGeminiInput);

      try {
        const batchResults = await analyzeBatch(inputs);
        results.push(...batchResults);
      } catch (err) {
        // analyzeBatch handles its own errors internally and shouldn't throw,
        // but guard here so one bad cluster never aborts the whole request.
        console.error("[/api/analyze] Unexpected batch error:", err);
        results.push(...subBatch.map((img) => fallbackResult(img.id)));
      }
    }
  }

  return NextResponse.json({ results });
}
