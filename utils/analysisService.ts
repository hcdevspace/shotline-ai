// Analysis service — thin HTTP wrapper around POST /api/analyze.
// Accepts a single pre-formed cluster, sends it as { clusters: [cluster] },
// and maps the raw API response (decision/confidence/quality_tags/…) to
// the AnalysisResult shape used everywhere else in the app.
// Does NOT know about mock mode — that decision lives in the API route.

import { AnalysisResult, Tier } from "@/lib/types";

// ─── Types ────────────────────────────────────────────────────────────────────

export interface ClusterInput {
  cluster_id: string;
  images: Array<{
    id: string;
    filename: string;
    base64: string;
    likely_blurry?: boolean;
    likely_dark?: boolean;
  }>;
}

interface RawResult {
  id: string;
  decision: "best" | "keep" | "uncertain" | "reject";
  confidence: number;        // 0–100 (integer from Gemini)
  quality_tags: string[];
  organization_tags: string[];
  caption: string;
  reasoning: string;
}

// ─── Mapping ──────────────────────────────────────────────────────────────────

function mapRaw(r: RawResult): AnalysisResult {
  const score = Math.min(100, Math.max(0, Math.round(r.confidence ?? 50)));
  return {
    id:         r.id,
    score,
    tier:       (r.decision ?? "uncertain") as Tier,
    tags:       [...(r.quality_tags ?? []), ...(r.organization_tags ?? [])],
    caption:    r.caption   ?? "",
    confidence: score / 100,
    reasoning:  r.reasoning ?? "",
  };
}

// ─── Public API ───────────────────────────────────────────────────────────────

export async function analyzeCluster(
  cluster: ClusterInput
): Promise<AnalysisResult[]> {
  const res = await fetch("/api/analyze", {
    method:  "POST",
    headers: { "Content-Type": "application/json" },
    body:    JSON.stringify({ clusters: [cluster] }),
  });

  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(`/api/analyze ${res.status}: ${text}`);
  }

  const data: { results: RawResult[] } = await res.json();
  return data.results.map(mapRaw);
}
