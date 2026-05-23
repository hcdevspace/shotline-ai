// Core type definitions shared across the entire application.
// All components, hooks, utils, and API routes import from here.
// The Photo type is the single source of truth for image state.

export type Tier = "best" | "keep" | "uncertain" | "reject";

export type ClientFilterReason = "blurry" | "too_dark" | "overexposed" | "too_small";

// The shape returned by /api/analyze (and identically by mockData.ts)
export interface AnalysisResult {
  id: string;
  score: number;          // 0–100
  tier: Tier;
  tags: string[];         // quality_tags + organization_tags merged
  caption: string;        // one sentence, present tense, social-media ready
  confidence: number;     // 0.0–1.0 (score / 100)
  reasoning: string;      // one sentence: primary factor driving the score
}

// Full photo object living in the Zustand store
export interface Photo {
  id: string;
  file: File;
  previewUrl: string;     // URL.createObjectURL(file)

  // Set after client-side preprocessing
  clientFiltered: boolean;
  clientFilterReason?: ClientFilterReason;

  // Set after AI analysis (undefined while pending)
  analysisResult?: AnalysisResult;

  // Set when user overrides the AI decision
  userTier?: Tier;
}

// Derived helper — always use this to determine the displayed/exported tier
export function getFinalTier(photo: Photo): Tier {
  if (photo.userTier) return photo.userTier;
  if (photo.analysisResult) return photo.analysisResult.tier;
  if (photo.clientFiltered) return "reject";
  return "uncertain";
}

// Batch payload sent to /api/analyze
export interface AnalyzeBatchRequest {
  images: Array<{
    id: string;
    base64: string;
    mimeType: string;
  }>;
}

export interface AnalyzeBatchResponse {
  results: AnalysisResult[];
}
