"use client";

// usePhotoAnalysis — owns the full analysis pipeline.
// Phase 1 (preprocessing): Laplacian blur + brightness + cluster grouping.
// Phase 2 (analyzing): serial sub-batches of ≤5 images → /api/analyze.
// If the API call for a batch fails entirely, falls back to local mock data
// and sets demoMode=true in the store (shown as a banner on /results).
// Navigates to /results when all batches complete.

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { usePhotoStore } from "@/lib/store";
import { preprocessImages, PreprocessedImage } from "@/utils/preprocessing";
import { analyzeCluster } from "@/utils/analysisService";
import { mockAnalyzeBatch } from "@/utils/mockData";

// ─── Status messages ──────────────────────────────────────────────────────────

const PREPROCESS_MSG  = "Grouping similar photos...";
const ANALYZE_MSGS    = [
  "Detecting blurry shots...",
  "Finding the best moments...",
  "Generating captions...",
  "Almost done...",
];

function getAnalyzeMsg(batchIndex: number, isLast: boolean): string {
  if (isLast) return "Almost done...";
  return ANALYZE_MSGS[batchIndex % (ANALYZE_MSGS.length - 1)];
}

// ─── Sub-batch builder ────────────────────────────────────────────────────────

const SUB_BATCH_SIZE = 5;

interface SubBatch {
  cluster_id: string;
  images: PreprocessedImage[];
}

function buildSubBatches(preprocessed: PreprocessedImage[]): SubBatch[] {
  const clusterMap = new Map<string, PreprocessedImage[]>();
  for (const img of preprocessed) {
    if (!clusterMap.has(img.cluster_id)) clusterMap.set(img.cluster_id, []);
    clusterMap.get(img.cluster_id)!.push(img);
  }

  const batches: SubBatch[] = [];
  for (const [cluster_id, imgs] of clusterMap) {
    for (let i = 0; i < imgs.length; i += SUB_BATCH_SIZE) {
      batches.push({ cluster_id, images: imgs.slice(i, i + SUB_BATCH_SIZE) });
    }
  }
  return batches;
}

// ─── Hook ─────────────────────────────────────────────────────────────────────

export function usePhotoAnalysis() {
  const router = useRouter();
  const {
    photos,
    setStatus,
    updatePhoto,
    incrementProcessed,
    setDemoMode,
  } = usePhotoStore();

  const [currentBatch,  setCurrentBatch]  = useState(0);
  const [totalBatches,  setTotalBatches]  = useState(0);
  const [statusMessage, setStatusMessage] = useState(PREPROCESS_MSG);

  useEffect(() => {
    // cancelled flag prevents double-execution in React Strict Mode (dev only),
    // where effects are intentionally mounted → unmounted → remounted.
    let cancelled = false;

    if (photos.length === 0) {
      router.replace("/upload");
      return;
    }

    async function runPipeline() {
      // ── Phase 1: preprocessing ─────────────────────────────────────────────
      setStatus("preprocessing");
      setStatusMessage(PREPROCESS_MSG);

      const uploadedInputs = photos.map((p) => ({
        id:       p.id,
        filename: p.file.name,
        file:     p.file,
        base64:   p.previewUrl,
        width:    0,
        height:   0,
        fileSize: p.file.size,
        status:   "pending" as const,
      }));

      let preprocessed: PreprocessedImage[];
      try {
        preprocessed = await preprocessImages(uploadedInputs);
      } catch {
        preprocessed = uploadedInputs.map((img) => ({
          ...img,
          sharpness:     50,
          brightness:    128,
          likely_blurry: false,
          likely_dark:   false,
          likely_bright: false,
          cluster_id:    crypto.randomUUID(),
        }));
      }

      if (cancelled) return;

      // Annotate clientFiltered (advisory only — AI still sees every image)
      for (const pre of preprocessed) {
        if (pre.likely_blurry) {
          updatePhoto(pre.id, { clientFiltered: true, clientFilterReason: "blurry" });
        } else if (pre.likely_dark) {
          updatePhoto(pre.id, { clientFiltered: true, clientFilterReason: "too_dark" });
        } else if (pre.likely_bright) {
          updatePhoto(pre.id, { clientFiltered: true, clientFilterReason: "overexposed" });
        }
      }

      // ── Phase 2: AI analysis ───────────────────────────────────────────────
      setStatus("analyzing");

      const subBatches = buildSubBatches(preprocessed);
      setTotalBatches(subBatches.length);

      let anyBatchFailed = false;

      for (let i = 0; i < subBatches.length; i++) {
        if (cancelled) return;

        const batchNum = i + 1;
        const isLast   = batchNum === subBatches.length;

        setCurrentBatch(batchNum);
        setStatusMessage(getAnalyzeMsg(i, isLast));

        const { cluster_id, images } = subBatches[i];
        const clusterInput = {
          cluster_id,
          images: images.map((img) => ({
            id:            img.id,
            filename:      img.filename,
            base64:        img.base64,
            likely_blurry: img.likely_blurry,
            likely_dark:   img.likely_dark,
          })),
        };

        try {
          const results = await analyzeCluster(clusterInput);
          if (cancelled) return;
          for (const r of results) {
            updatePhoto(r.id, { analysisResult: r });
            incrementProcessed();
          }
        } catch (err) {
          console.error(`[usePhotoAnalysis] batch ${batchNum} failed, using mock:`, err);
          anyBatchFailed = true;

          const mockResults = await mockAnalyzeBatch(
            images.map((img) => ({ id: img.id, filename: img.filename }))
          );
          if (cancelled) return;
          for (const r of mockResults) {
            updatePhoto(r.id, { analysisResult: r });
            incrementProcessed();
          }
        }
      }

      if (cancelled) return;
      if (anyBatchFailed) setDemoMode(true);

      setStatus("done");
      router.push("/results");
    }

    runPipeline();
    return () => { cancelled = true; };
  }, []); // eslint-disable-line react-hooks/exhaustive-deps — intentionally once on mount

  const processedRaw = usePhotoStore((s) => s.processedCount);
  const status       = usePhotoStore((s) => s.status);
  const processed    = Math.min(processedRaw, photos.length);

  return {
    total:     photos.length,
    processed,
    status,
    currentBatch,
    totalBatches,
    statusMessage,
  };
}
