// Gemini API client — server-side only (/api/analyze route).
// Sends up to 5 images per call with inline base64 data.
// Returns raw Gemini output shape (not mapped to AnalysisResult).
// Retries once on JSON parse failure before returning per-image fallbacks.

import { GoogleGenerativeAI } from "@google/generative-ai";
import { SYSTEM_PROMPT, buildOpeningText, buildImageLabel, buildClosingText } from "./prompts";

// ─── Public types ─────────────────────────────────────────────────────────────

export interface GeminiImageInput {
  id: string;
  filename: string;
  base64: string;          // raw base64 — no data:... prefix
  mimeType: string;
  likely_blurry?: boolean;
  likely_dark?: boolean;
}

export interface GeminiRawResult {
  id: string;
  decision: "best" | "keep" | "uncertain" | "reject";
  confidence: number;      // 0–100
  quality_tags: string[];
  organization_tags: string[];
  caption: string;
  reasoning: string;
}

export function fallbackResult(id: string): GeminiRawResult {
  return {
    id,
    decision: "keep",
    confidence: 50,
    quality_tags: [],
    organization_tags: [],
    caption: "",
    reasoning: "Analysis unavailable",
  };
}

// ─── Model factory ────────────────────────────────────────────────────────────

function getModel() {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) throw new Error("GEMINI_API_KEY environment variable is not set");

  const genAI = new GoogleGenerativeAI(apiKey);
  return genAI.getGenerativeModel({
    model: "gemini-1.5-flash",
    systemInstruction: SYSTEM_PROMPT,
    generationConfig: {
      temperature: 0.2,
      responseMimeType: "application/json",
      maxOutputTokens: 1500,
    },
  });
}

// ─── Single API call ──────────────────────────────────────────────────────────

// eslint-disable-next-line @typescript-eslint/no-explicit-any
async function callModel(images: GeminiImageInput[]): Promise<string> {
  const model = getModel();
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const parts: any[] = [{ text: buildOpeningText(images.length) }];

  for (let i = 0; i < images.length; i++) {
    const img = images[i];
    const hints: string[] = [];
    if (img.likely_blurry) hints.push("likely blurry");
    if (img.likely_dark)   hints.push("likely underexposed");

    parts.push({ text: buildImageLabel(i, img.id, hints) });
    parts.push({ inlineData: { mimeType: img.mimeType, data: img.base64 } });
  }

  parts.push({ text: buildClosingText(images.length) });

  const response = await model.generateContent(parts);
  return response.response.text();
}

// ─── Response parsing ─────────────────────────────────────────────────────────

// Returns null if the text cannot be parsed into a valid results array.
// Strips ``` fences before attempting JSON.parse.
function tryParse(
  raw: string,
  images: GeminiImageInput[]
): GeminiRawResult[] | null {
  // Strip markdown code fences Gemini occasionally wraps around JSON
  const cleaned = raw
    .trim()
    .replace(/^```(?:json)?\s*/i, "")
    .replace(/\s*```\s*$/, "");

  let parsed: { results?: unknown[] };

  try {
    parsed = JSON.parse(cleaned);
  } catch {
    // Last-resort: extract the outermost JSON object
    const match = cleaned.match(/\{[\s\S]*\}/);
    if (!match) return null;
    try {
      parsed = JSON.parse(match[0]);
    } catch {
      return null;
    }
  }

  if (!Array.isArray(parsed?.results) || parsed.results.length === 0) return null;

  // Build id → result map; unknown or malformed entries get fallbacks
  const byId = new Map<string, GeminiRawResult>();
  for (const r of parsed.results) {
    const validated = validateResult(r);
    if (validated) byId.set(validated.id, validated);
  }

  return images.map((img) => byId.get(img.id) ?? fallbackResult(img.id));
}

function validateResult(r: unknown): GeminiRawResult | null {
  if (!r || typeof r !== "object") return null;
  const o = r as Record<string, unknown>;
  if (typeof o.id !== "string" || !o.id) return null;

  const VALID = ["best", "keep", "uncertain", "reject"] as const;
  const decision: GeminiRawResult["decision"] = VALID.includes(
    o.decision as (typeof VALID)[number]
  )
    ? (o.decision as GeminiRawResult["decision"])
    : "keep";

  return {
    id: o.id,
    decision,
    confidence:
      typeof o.confidence === "number"
        ? Math.min(100, Math.max(0, Math.round(o.confidence)))
        : 50,
    quality_tags: Array.isArray(o.quality_tags)
      ? (o.quality_tags as unknown[]).filter((t): t is string => typeof t === "string")
      : [],
    organization_tags: Array.isArray(o.organization_tags)
      ? (o.organization_tags as unknown[]).filter((t): t is string => typeof t === "string")
      : [],
    caption:   typeof o.caption   === "string" ? o.caption   : "",
    reasoning: typeof o.reasoning === "string" ? o.reasoning : "",
  };
}

// ─── Public entry point ───────────────────────────────────────────────────────

export async function analyzeBatch(
  images: GeminiImageInput[]
): Promise<GeminiRawResult[]> {
  if (images.length === 0) return [];
  if (images.length > 5) {
    throw new Error(`analyzeBatch: max 5 images per call, got ${images.length}`);
  }

  // First attempt
  let raw: string;
  try {
    raw = await callModel(images);
  } catch (err) {
    console.error("[gemini] API call failed:", err);
    return images.map((img) => fallbackResult(img.id));
  }

  const first = tryParse(raw, images);
  if (first) return first;

  // Retry once on bad JSON
  console.warn("[gemini] parse failed on first attempt — retrying");
  try {
    raw = await callModel(images);
  } catch (err) {
    console.error("[gemini] retry failed:", err);
    return images.map((img) => fallbackResult(img.id));
  }

  return tryParse(raw, images) ?? images.map((img) => fallbackResult(img.id));
}
