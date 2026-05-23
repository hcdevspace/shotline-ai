// Analysis service — the single decision point between mock and real AI.
// Checks NEXT_PUBLIC_MOCK_MODE at runtime and routes to either:
//   - mockAnalyzeBatch (utils/mockData.ts) — deterministic fake results
//   - POST /api/analyze — real Gemini call via the server route
// No other file in the app should make this decision.

import { AnalysisResult } from "@/lib/types";
import { mockAnalyzeBatch } from "./mockData";

const IS_MOCK = process.env.NEXT_PUBLIC_MOCK_MODE === "true";

export interface ServiceImageInput {
  id: string;
  filename: string;
  base64: string;
  mimeType: string;
}

export async function analyzeBatch(
  images: ServiceImageInput[]
): Promise<AnalysisResult[]> {
  if (IS_MOCK) {
    return mockAnalyzeBatch(images.map((img) => ({ id: img.id, filename: img.filename })));
  }

  // Real path: call the Next.js API route (keeps API key server-side)
  const res = await fetch("/api/analyze", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      images: images.map(({ id, base64, mimeType }) => ({ id, base64, mimeType })),
    }),
  });

  if (!res.ok) {
    throw new Error(`/api/analyze responded with ${res.status}`);
  }

  const data = await res.json();
  return data.results as AnalysisResult[];
}
