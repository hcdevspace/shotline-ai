// Gemini API client — server-side only (used inside /api/analyze route).
// Wraps the @google/generative-ai SDK and constructs the scoring prompt.
// Returns structured AnalysisResult[] parsed from Gemini's JSON response.
// Never import this file in client components — it reads process.env.GEMINI_API_KEY.

import { AnalysisResult, Tier } from "./types";

// TODO: install @google/generative-ai and uncomment
// import { GoogleGenerativeAI } from "@google/generative-ai";

const SCORING_PROMPT = `
You are a professional photo curator. Analyze each image and respond with a JSON array.
For each image return exactly:
{
  "id": "<provided id>",
  "score": <integer 0-100>,
  "tier": <"best"|"keep"|"uncertain"|"reject">,
  "tags": [<up to 5 short descriptive tags>],
  "caption": "<one sentence describing the photo>",
  "confidence": <float 0.0-1.0>
}

Scoring guide:
- best (85–100): sharp, well-lit, compelling composition
- keep (60–84): good photo with minor flaws
- uncertain (40–59): usable but questionable quality
- reject (0–39): blurry, poorly exposed, or technically failed

Return only the JSON array, no other text.
`.trim();

export interface GeminiImageInput {
  id: string;
  base64: string;
  mimeType: string;
}

export async function analyzeBatch(
  images: GeminiImageInput[]
): Promise<AnalysisResult[]> {
  // TODO: implement real Gemini call
  // const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);
  // const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
  // const parts = images.flatMap(img => [
  //   { text: `Image id: ${img.id}` },
  //   { inlineData: { mimeType: img.mimeType, data: img.base64 } }
  // ]);
  // parts.push({ text: SCORING_PROMPT });
  // const result = await model.generateContent(parts);
  // const json = result.response.text().replace(/```json|```/g, "").trim();
  // return JSON.parse(json) as AnalysisResult[];

  throw new Error("Gemini client not yet implemented — use mock mode");
}
