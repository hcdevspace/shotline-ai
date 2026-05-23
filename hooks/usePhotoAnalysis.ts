// usePhotoAnalysis hook — orchestrates the full analysis pipeline.
// Called once when ProcessingPage mounts.
// Step 1: runs preprocessImage() on each photo, marks clientFiltered rejects.
// Step 2: collects surviving photos, resizes them, sends to analysisService
//         in batches of BATCH_SIZE, and patches each Photo in the store as
//         results arrive.
// Navigates to /results when all batches are complete.
// Works identically in mock mode — analysisService handles the routing.

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { usePhotoStore } from "@/lib/store";

const BATCH_SIZE = 5;
const BATCH_DELAY_MS = 400; // pause between batches to respect rate limits

export function usePhotoAnalysis() {
  const router = useRouter();
  const { photos, setStatus, updatePhoto, incrementProcessed } = usePhotoStore();

  useEffect(() => {
    if (photos.length === 0) {
      // Guard: if store is empty (e.g. direct navigation), redirect home
      router.replace("/upload");
      return;
    }

    async function runPipeline() {
      setStatus("preprocessing");

      // TODO: Phase 1 — client preprocessing
      // for (const photo of photos) {
      //   const reason = await preprocessImage(photo.file);
      //   if (reason) updatePhoto(photo.id, { clientFiltered: true, clientFilterReason: reason });
      // }

      setStatus("analyzing");

      // TODO: Phase 2 — batched AI analysis
      // const surviving = photos.filter((p) => !p.clientFiltered);
      // for (let i = 0; i < surviving.length; i += BATCH_SIZE) {
      //   const batch = surviving.slice(i, i + BATCH_SIZE);
      //   const inputs = await Promise.all(batch.map(async (p) => {
      //     const { base64, mimeType } = await resizeToBase64(p.file);
      //     return { id: p.id, filename: p.file.name, base64, mimeType };
      //   }));
      //   const results = await analyzeBatch(inputs);
      //   results.forEach((r) => {
      //     updatePhoto(r.id, { analysisResult: r });
      //     incrementProcessed();
      //   });
      //   if (i + BATCH_SIZE < surviving.length) await delay(BATCH_DELAY_MS);
      // }

      setStatus("done");
      router.push("/results");
    }

    runPipeline();
  }, []); // runs once on mount

  return {
    total: photos.length,
    processed: usePhotoStore((s) => s.processedCount),
    status: usePhotoStore((s) => s.status),
  };
}

function delay(ms: number) {
  return new Promise((res) => setTimeout(res, ms));
}
