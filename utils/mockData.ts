// Mock data generator — produces output structurally identical to the real
// Gemini API response. Used when NEXT_PUBLIC_MOCK_MODE=true.
// Tags use the exact taxonomy strings from lib/prompts.ts.
// Captions are present-tense, social-media ready (no "a photo of").
// Results are deterministic: same filename → same tier across reruns.

import { AnalysisResult, Tier } from "@/lib/types";

// ─── Content pools ────────────────────────────────────────────────────────────
// Tags must exactly match the approved taxonomy in lib/prompts.ts

const MOCK_QUALITY_TAGS: Record<Tier, string[][]> = {
  best: [
    ["sharp", "good-lighting", "well-composed"],
    ["sharp", "well-composed"],
    ["good-lighting", "sharp"],
  ],
  keep: [
    ["sharp", "good-lighting"],
    ["blurry", "good-lighting"],
    ["well-composed", "noisy"],
  ],
  uncertain: [
    ["blurry", "underexposed"],
    ["motion-blur"],
    ["cropped-badly", "noisy"],
  ],
  reject: [
    ["motion-blur", "blurry"],
    ["underexposed"],
    ["overexposed", "cropped-badly"],
    ["duplicate", "blurry"],
  ],
};

const MOCK_ORG_TAGS: Record<Tier, string[][]> = {
  best:      [["portrait", "candid"], ["travel", "nature"], ["event", "candid"]],
  keep:      [["candid", "group-photo"], ["travel"], ["portrait"]],
  uncertain: [["candid"], ["portrait", "selfie"], ["screenshot"]],
  reject:    [["candid"], ["portrait"], ["travel"], ["event"]],
};

const MOCK_CAPTIONS: Record<Tier, string[]> = {
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

const MOCK_REASONING: Record<Tier, string[]> = {
  best: [
    "Tack-sharp focus on the subject, natural exposure, and intentional composition make this the clear standout in the cluster.",
    "Exceptional ambient light and a decisive moment separate this from every other image in the batch.",
    "Strong compositional structure with no technical weaknesses — this earns the single best-pick slot.",
  ],
  keep: [
    "Minor motion blur on secondary elements softens the image just enough to prevent a Best score, but the core subject is solid.",
    "Slight highlight clipping in the upper right doesn't undermine the overall quality of the framing.",
    "Sensor noise in shadow areas is noticeable at full size, but the composition and exposure are otherwise good.",
  ],
  uncertain: [
    "Noticeable camera shake affects subject sharpness across the frame — usable only at small sizes.",
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

// ─── Deterministic hash ───────────────────────────────────────────────────────

function hashString(str: string): number {
  let h = 0;
  for (let i = 0; i < str.length; i++) {
    h = (h * 31 + str.charCodeAt(i)) >>> 0;
  }
  return h;
}

function pickByHash<T>(arr: T[], hash: number): T {
  return arr[hash % arr.length];
}

// ─── Tier distribution ────────────────────────────────────────────────────────
// Roughly: 1 best, 2 keep, 1 uncertain, 1 reject per 5 images
const TIER_POOL: Tier[] = ["best", "keep", "keep", "uncertain", "reject"];

const SCORE_RANGE: Record<Tier, [number, number]> = {
  best:      [81, 96],
  keep:      [52, 79],
  uncertain: [31, 49],
  reject:    [4,  28],
};

// ─── Generator ───────────────────────────────────────────────────────────────

export function generateMockResult(id: string, filename: string): AnalysisResult {
  const hash = hashString(filename);
  const tier = pickByHash(TIER_POOL, hash);
  const [min, max] = SCORE_RANGE[tier];
  const score = min + (hash % (max - min + 1));

  const qualityTags = pickByHash(MOCK_QUALITY_TAGS[tier], hash >> 4);
  const orgTags     = pickByHash(MOCK_ORG_TAGS[tier],     hash >> 8);

  return {
    id,
    score,
    tier,
    tags: [...qualityTags, ...orgTags],
    caption:    pickByHash(MOCK_CAPTIONS[tier],  hash >> 12),
    confidence: score / 100,
    reasoning:  pickByHash(MOCK_REASONING[tier], hash >> 16),
  };
}

// Simulates async AI latency so the processing UI animates naturally
export async function mockAnalyzeBatch(
  images: Array<{ id: string; filename: string }>
): Promise<AnalysisResult[]> {
  await new Promise((res) => setTimeout(res, 1100 + Math.random() * 700));
  return images.map(({ id, filename }) => generateMockResult(id, filename));
}
