// AI analysis client — server-side only (/api/analyze route).
// Uses OpenAI GPT-4o vision to rank, tag, and caption each image batch.
// Exports the same interface as before so the route and hooks are unchanged.

import OpenAI from "openai";
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
    decision:          "keep",
    confidence:        50,
    quality_tags:      [],
    organization_tags: [],
    caption:           "",
    reasoning:         "Analysis unavailable",
  };
}

// Short proxy IDs sent to the model instead of full UUIDs.
const proxyId = (i: number) => `img_${i + 1}`;

// ─── Client factory ───────────────────────────────────────────────────────────

function getClient(): OpenAI {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) throw new Error("OPENAI_API_KEY environment variable is not set");
  return new OpenAI({ apiKey });
}

// ─── Single API call ──────────────────────────────────────────────────────────

async function callModel(images: GeminiImageInput[]): Promise<string> {
  const client = getClient();

  // Build the user message: opening text + interleaved image+label pairs + closing schema
  const content: OpenAI.Chat.ChatCompletionContentPart[] = [];

  content.push({ type: "text", text: buildOpeningText(images.length) });

  for (let i = 0; i < images.length; i++) {
    const img = images[i];
    const hints: string[] = [];
    if (img.likely_blurry) hints.push("likely blurry");
    if (img.likely_dark)   hints.push("likely underexposed");

    content.push({ type: "text", text: buildImageLabel(i, proxyId(i), hints) });
    content.push({
      type:      "image_url",
      image_url: {
        url:    `data:${img.mimeType};base64,${img.base64}`,
        detail: "auto", // "high" for large images, "low" for small — lets model judge blur/exposure properly
      },
    });
  }

  content.push({ type: "text", text: buildClosingText(images.length) });

  const response = await client.chat.completions.create({
    model:       "gpt-4o",  // best vision quality — mini is too conservative on scores
    max_tokens:  4096,
    temperature: 0.4,
    response_format: { type: "json_object" },
    messages: [
      { role: "system", content: SYSTEM_PROMPT },
      { role: "user",   content },
    ],
  });

  return response.choices[0]?.message?.content ?? "";
}

// ─── Response parsing ─────────────────────────────────────────────────────────

function tryParse(
  raw: string,
  images: GeminiImageInput[]
): GeminiRawResult[] | null {
  const cleaned = raw.trim()
    .replace(/^```(?:json)?\s*/i, "")
    .replace(/\s*```\s*$/, "");

  let parsed: unknown;
  try {
    parsed = JSON.parse(cleaned);
  } catch {
    const objMatch = cleaned.match(/\{[\s\S]*\}/);
    const arrMatch = cleaned.match(/\[[\s\S]*\]/);
    const fragment = objMatch ?? arrMatch;
    if (!fragment) return null;
    try { parsed = JSON.parse(fragment[0]); } catch { return null; }
  }

  // Accept { results: [...] }, a bare array, or any object whose first array value is the list
  let resultsArr: unknown[];
  if (Array.isArray(parsed)) {
    resultsArr = parsed;
  } else if (parsed && typeof parsed === "object") {
    const obj = parsed as Record<string, unknown>;
    if (Array.isArray(obj.results)) {
      resultsArr = obj.results;
    } else {
      const first = Object.values(obj).find(Array.isArray) as unknown[] | undefined;
      resultsArr = first ?? [];
    }
  } else {
    resultsArr = [];
  }

  if (resultsArr.length === 0) return null;

  const validated = resultsArr.map(validateResult);

  const byId = new Map<string, GeminiRawResult>();
  for (const r of validated) {
    if (r) byId.set(r.id, r);
  }

  const positional = validated.filter((r): r is GeminiRawResult => r !== null);

  return images.map((img, i) => {
    const match =
      byId.get(proxyId(i)) ??
      byId.get(img.id) ??
      (positional.length === images.length ? positional[i] : undefined);
    return match ? { ...match, id: img.id } : fallbackResult(img.id);
  });
}

function validateResult(r: unknown): GeminiRawResult | null {
  if (!r || typeof r !== "object") return null;
  const o = r as Record<string, unknown>;

  const rawId = o.id;
  const id = typeof rawId === "string" ? rawId
            : typeof rawId === "number" ? String(rawId)
            : null;
  if (!id) return null;

  const VALID = ["best", "keep", "uncertain", "reject"] as const;
  const decision: GeminiRawResult["decision"] = VALID.includes(o.decision as typeof VALID[number])
    ? (o.decision as GeminiRawResult["decision"])
    : "keep";

  return {
    id,
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

// ─── Rate-limit helpers ───────────────────────────────────────────────────────

function retryDelayMs(err: unknown): number | null {
  // OpenAI rate-limit errors expose a retryAfter header value
  const e = err as Record<string, unknown>;
  if (typeof e?.headers === "object") {
    const after = (e.headers as Record<string, string>)["retry-after"];
    if (after) return (parseInt(after, 10) + 2) * 1000;
  }
  return null;
}

function is429(err: unknown): boolean {
  return (err as Record<string, unknown>)?.status === 429 ||
    String(err).includes("429");
}

// ─── Public entry point ───────────────────────────────────────────────────────

export async function analyzeBatch(
  images: GeminiImageInput[]
): Promise<GeminiRawResult[]> {
  if (images.length === 0) return [];
  if (images.length > 5) {
    throw new Error(`analyzeBatch: max 5 images per call, got ${images.length}`);
  }

  let raw: string;
  try {
    raw = await callModel(images);
    console.log("[openai] raw response (first 400 chars):", raw.slice(0, 400));
  } catch (err) {
    if (is429(err)) {
      const wait = retryDelayMs(err) ?? 60_000;
      console.warn(`[openai] rate-limited — waiting ${wait / 1000}s then retrying`);
      await new Promise((r) => setTimeout(r, wait));
      try {
        raw = await callModel(images);
      } catch (err2) {
        console.error("[openai] retry after rate-limit failed:", err2);
        return images.map((img) => fallbackResult(img.id));
      }
    } else {
      console.error("[openai] API call failed:", err);
      return images.map((img) => fallbackResult(img.id));
    }
  }

  const first = tryParse(raw, images);
  if (first) {
    console.log("[openai] parsed OK, returning", first.length, "results");
    return first;
  }

  // Retry once on bad JSON
  console.warn("[openai] parse failed — retrying. Response was:", raw);
  try {
    raw = await callModel(images);
  } catch (err) {
    console.error("[openai] JSON-retry call failed:", err);
    return images.map((img) => fallbackResult(img.id));
  }

  const second = tryParse(raw, images);
  if (!second) console.error("[openai] parse failed on retry. Response:", raw);
  return second ?? images.map((img) => fallbackResult(img.id));
}
