// API route: POST /api/analyze
// Receives a batch of up to 5 base64-encoded images from the client.
// Forwards them to Gemini 1.5 Flash with a structured scoring prompt.
// Returns a JSON array of { id, score, tier, tags, caption, confidence }
// matching the AnalysisResult type in lib/types.ts.
// The API key is kept server-side only — never exposed to the browser.

import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  // TODO: parse request body
  // TODO: call geminiClient.analyzeBatch(images) from lib/gemini.ts
  // TODO: return structured results

  const body = await req.json();

  // Placeholder response mirroring the real response shape
  const placeholder = (body.images ?? []).map((img: { id: string }) => ({
    id: img.id,
    score: 75,
    tier: "keep",
    tags: ["placeholder"],
    caption: "AI analysis not yet implemented.",
    confidence: 0.8,
  }));

  return NextResponse.json({ results: placeholder });
}
