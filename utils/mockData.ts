// Mock data generator — produces structurally identical output to the real
// Gemini API response. Used when NEXT_PUBLIC_MOCK_MODE=true.
// Results are deterministic: the same filename always receives the same tier,
// so the demo is consistent across reruns.
// Adds a simulated delay so the processing UI animates naturally.

import { AnalysisResult, Tier } from "@/lib/types";

const TIERS: Tier[] = ["best", "keep", "keep", "uncertain", "reject"];

const MOCK_CAPTIONS: Record<Tier, string[]> = {
  best: [
    "A perfectly exposed shot with excellent composition and sharp focus.",
    "Vibrant colors and strong leading lines make this a standout image.",
    "Beautiful natural lighting highlights the subject with great clarity.",
  ],
  keep: [
    "A solid photo with good exposure and reasonable sharpness.",
    "Nice framing with minor depth-of-field inconsistency.",
    "Well-composed with slight overexposure in highlights.",
  ],
  uncertain: [
    "Slightly soft focus — may be usable depending on intended size.",
    "Borderline exposure makes this difficult to assess definitively.",
    "Subject is partially cropped; composition intent is unclear.",
  ],
  reject: [
    "Significant motion blur renders this photo unusable.",
    "Severe underexposure with irrecoverable shadow detail loss.",
    "Out of focus with no recoverable sharpness at any crop level.",
  ],
};

const MOCK_TAGS: Record<Tier, string[][]> = {
  best: [
    ["sharp", "well_lit", "portrait", "natural_light"],
    ["vivid", "landscape", "golden_hour", "composed"],
  ],
  keep: [
    ["good_exposure", "indoor", "candid"],
    ["slight_blur", "outdoor", "group"],
  ],
  uncertain: [
    ["soft_focus", "backlit"],
    ["cropped", "low_light"],
  ],
  reject: [
    ["motion_blur", "unusable"],
    ["underexposed", "dark"],
  ],
};

// Simple deterministic hash so same filename → same result
function hashString(str: string): number {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = (hash * 31 + str.charCodeAt(i)) >>> 0;
  }
  return hash;
}

function pickByHash<T>(arr: T[], hash: number): T {
  return arr[hash % arr.length];
}

export function generateMockResult(id: string, filename: string): AnalysisResult {
  const hash = hashString(filename);
  const tier = pickByHash(TIERS, hash);

  const scoreRanges: Record<Tier, [number, number]> = {
    best: [85, 99],
    keep: [62, 84],
    uncertain: [40, 61],
    reject: [5, 39],
  };

  const [min, max] = scoreRanges[tier];
  const score = min + (hash % (max - min + 1));

  return {
    id,
    score,
    tier,
    tags: pickByHash(MOCK_TAGS[tier], hash >> 4),
    caption: pickByHash(MOCK_CAPTIONS[tier], hash >> 8),
    confidence: Math.round((0.65 + (hash % 30) / 100) * 100) / 100,
  };
}

// Simulates async AI call with a realistic delay
export async function mockAnalyzeBatch(
  images: Array<{ id: string; filename: string }>
): Promise<AnalysisResult[]> {
  await new Promise((res) => setTimeout(res, 1200 + Math.random() * 600));
  return images.map(({ id, filename }) => generateMockResult(id, filename));
}
