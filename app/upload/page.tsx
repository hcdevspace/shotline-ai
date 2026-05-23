"use client";

// Upload page — entry point of ShotlineAI.
// Manages two visual states:
//   - Empty: centered hero + full DropZone
//   - Loaded: compact header + image grid + action bar
// On "Analyze Photos": converts UploadedImage[] → Photo[] in the Zustand store,
// then navigates to /processing.

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useUpload, generateDemoImages } from "@/hooks/useUpload";
import { usePhotoStore } from "@/lib/store";
import DropZone from "@/components/upload/DropZone";
import ImageGrid from "@/components/upload/ImageGrid";

export default function UploadPage() {
  const router = useRouter();
  const { images, isProcessing, progress, addFiles, clear } = useUpload();
  const { setPhotos, reset } = usePhotoStore();

  useEffect(() => {
    document.title = "ShotlineAI — Curate Your Best Shots";
  }, []);

  const hasImages = images.length > 0;

  function handleAnalyze() {
    if (images.length === 0 || isProcessing) return;

    // Convert UploadedImage[] → Photo[] and hand off to the Zustand store.
    // previewUrl reuses the base64 data URL — works directly as <img src>.
    const photos = images.map((img) => ({
      id: img.id,
      file: img.file,
      previewUrl: img.base64,
      clientFiltered: false,
    }));

    reset();
    setPhotos(photos);
    router.push("/processing");
  }

  function handleDemoMode() {
    const demos = generateDemoImages();
    const photos = demos.map((img) => ({
      id: img.id,
      file: img.file,
      previewUrl: img.base64,
      clientFiltered: false,
    }));
    reset();
    setPhotos(photos);
    router.push("/processing");
  }

  // ── Empty state ─────────────────────────────────────────────────────────────
  if (!hasImages) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[calc(100vh-56px)] px-6 py-10 animate-page-in">
        {/* Hero */}
        <div className="text-center mb-6 max-w-[480px]">
          <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-accent mb-5">
            AI Photo Curation
          </p>
          <h1 className="text-[44px] font-bold text-hi leading-[1.08] tracking-[-0.03em] mb-5">
            Surface your<br />best shots.
          </h1>
          <p className="text-mid text-[15px] leading-relaxed">
            Upload a folder. AI ranks, tags, and captions every image — then
            hands you the controls to finalize your library.
          </p>
        </div>

        {/* 3-step onboarding guide */}
        <div className="flex items-start gap-0 mb-6 w-full max-w-[480px]">
          <OnboardingStep
            num="1"
            title="Upload photos"
            desc="Drag in a folder or pick individual shots"
          />
          <OnboardingConnector />
          <OnboardingStep
            num="2"
            title="AI curates"
            desc="Ranked, tagged, and captioned automatically"
          />
          <OnboardingConnector />
          <OnboardingStep
            num="3"
            title="Download library"
            desc="Export your cleaned collection as a ZIP"
          />
        </div>

        {/* Drop zone */}
        <DropZone onFiles={addFiles} />

        {/* Processing state while first images compress */}
        {isProcessing && (
          <div className="mt-5 flex items-center gap-2.5 text-mid text-[13px]">
            <span className="w-4 h-4 border-2 border-edge border-t-accent rounded-full animate-spin" />
            Compressing… {progress}%
          </div>
        )}

        {/* CTAs */}
        <div className="mt-8 flex flex-col items-center gap-3">
          <button
            onClick={handleAnalyze}
            disabled
            className="flex items-center gap-2 px-6 py-3 rounded-lg bg-accent text-canvas text-[13px] font-bold opacity-30 cursor-not-allowed"
          >
            Analyze Photos
            <ArrowRight />
          </button>

          <button
            onClick={handleDemoMode}
            className="flex items-center gap-1.5 text-[13px] font-semibold text-mid hover:text-accent transition-colors duration-150 ease-out"
          >
            <span className="text-[10px] px-1.5 py-0.5 rounded border border-edge text-lo font-mono uppercase tracking-wide">
              demo
            </span>
            Try Demo Mode →
          </button>
        </div>

        <p className="mt-8 text-[12px] text-lo text-center">
          Photos stay in your browser — nothing is uploaded to our servers
        </p>
      </div>
    );
  }

  // ── Loaded state ─────────────────────────────────────────────────────────────
  return (
    <div className="max-w-[1200px] mx-auto px-6 py-8">
      {/* Status bar */}
      <div className="flex items-center justify-between gap-4 mb-6">
        <div className="flex items-center gap-3">
          <h1 className="text-[22px] font-bold text-hi tracking-[-0.03em]">
            {images.length} photos staged
          </h1>
          {isProcessing && (
            <span className="flex items-center gap-1.5 text-[12px] text-mid">
              <span className="w-3.5 h-3.5 border-2 border-edge border-t-accent rounded-full animate-spin" />
              Adding… {progress}%
            </span>
          )}
        </div>

        {/* Action cluster */}
        <div className="flex items-center gap-2 shrink-0">
          <button
            onClick={clear}
            className="px-4 py-2 rounded-lg border border-edge text-[13px] text-mid hover:text-hi hover:border-[#383838] transition-all duration-150"
          >
            Clear all
          </button>

          <button
            onClick={handleDemoMode}
            className="px-4 py-2 rounded-lg border border-edge text-[13px] text-mid hover:text-hi hover:border-[#383838] transition-all duration-150"
          >
            Load demo
          </button>

          <button
            onClick={handleAnalyze}
            disabled={isProcessing}
            className="flex items-center gap-2 px-6 py-2.5 rounded-lg bg-accent hover:bg-accent-dim disabled:opacity-50 disabled:cursor-not-allowed text-canvas text-[13px] font-bold tracking-[-0.01em] transition-all duration-150 ease-out hover:scale-[1.02] active:scale-[0.98]"
          >
            Analyze Photos
            <ArrowRight />
          </button>
        </div>
      </div>

      {/* Add-more compact drop zone */}
      <div className="mb-6">
        <DropZone onFiles={addFiles} compact />
      </div>

      {/* Image grid */}
      <ImageGrid images={images} />

      {/* Footer note */}
      <p className="mt-8 text-[12px] text-lo text-center">
        Photos stay in your browser — nothing is uploaded to our servers
      </p>
    </div>
  );
}

function ArrowRight() {
  return (
    <svg
      width="13" height="13"
      viewBox="0 0 24 24"
      fill="none" stroke="currentColor"
      strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"
    >
      <line x1="5" y1="12" x2="19" y2="12" />
      <polyline points="12 5 19 12 12 19" />
    </svg>
  );
}

function OnboardingStep({ num, title, desc }: { num: string; title: string; desc: string }) {
  return (
    <div className="flex flex-col items-center text-center flex-1 gap-2 px-2">
      <div className="w-7 h-7 rounded-full border border-accent/40 flex items-center justify-center text-[11px] font-bold text-accent shrink-0">
        {num}
      </div>
      <p className="text-[12px] font-semibold text-hi leading-tight">{title}</p>
      <p className="text-[11px] text-lo leading-snug">{desc}</p>
    </div>
  );
}

function OnboardingConnector() {
  return (
    <div className="flex items-start pt-3.5 shrink-0">
      <div className="w-8 h-px bg-edge mt-0.5" />
    </div>
  );
}
