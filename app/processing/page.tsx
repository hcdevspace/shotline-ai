"use client";

// Processing page — live pipeline view with animated spinner and rotating messages.
// Messages rotate every 2 s while the "analyzing" phase is active.
// Batch counter ("Analyzing batch X of Y…") stays pinned above the spinner.
// 30-second timeout shows a cancel option.

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { usePhotoAnalysis } from "@/hooks/usePhotoAnalysis";
import { usePhotoStore } from "@/lib/store";
import StepIndicator, { Step } from "@/components/processing/StepIndicator";
import ProgressBar from "@/components/processing/ProgressBar";
import type { ProcessingStatus } from "@/lib/store";

// ─── Rotating messages ────────────────────────────────────────────────────────

const ROTATE_MSGS = [
  "Grouping similar photos...",
  "Detecting blurry and dark shots...",
  "Finding your best moments...",
  "Ranking photos by quality...",
  "Generating social captions...",
  "Almost done — finalizing your Shotline...",
];

// ─── Step builder ─────────────────────────────────────────────────────────────

function buildSteps(status: ProcessingStatus): Step[] {
  return [
    {
      label: "Preprocess",
      state: status === "preprocessing" ? "active"
           : ["analyzing", "done"].includes(status) ? "done"
           : "pending",
    },
    {
      label: "AI Analysis",
      state: status === "analyzing" ? "active"
           : status === "done"      ? "done"
           : "pending",
    },
    {
      label: "Complete",
      state: status === "done" ? "active" : "pending",
    },
  ];
}

// ─── Page ─────────────────────────────────────────────────────────────────────

const TIMEOUT_MS = 30_000;

export default function ProcessingPage() {
  const router = useRouter();
  const { reset } = usePhotoStore();
  const { total, processed, status } = usePhotoAnalysis();

  // Rotate display message every 2 s during analysis
  const [rotIdx, setRotIdx] = useState(0);
  const [elapsed, setElapsed] = useState(0);

  useEffect(() => {
    document.title = "ShotlineAI — Analyzing Photos...";
  }, []);

  useEffect(() => {
    if (status !== "analyzing") return;
    const id = setInterval(() => {
      setRotIdx((i) => (i + 1) % ROTATE_MSGS.length);
    }, 2000);
    return () => clearInterval(id);
  }, [status]);

  // Elapsed-time counter — resets when analysis starts
  useEffect(() => {
    if (status === "done" || status === "idle") return;
    setElapsed(0);
    const id = setInterval(() => setElapsed((s) => s + 1), 1000);
    return () => clearInterval(id);
  }, [status]);

  function handleCancel() {
    reset();
    router.push("/upload");
  }

  const steps      = buildSteps(status);
  const displayMsg = status === "analyzing" ? ROTATE_MSGS[rotIdx] : ROTATE_MSGS[0];

  return (
    <div className="flex flex-col items-center justify-center min-h-[calc(100vh-56px)] px-6">
      <div className="w-full max-w-md">

        {/* Spinner */}
        <div className="flex justify-center mb-10">
          <div
            className="w-10 h-10 rounded-full border-[3px] border-edge border-t-accent animate-spin"
            aria-hidden="true"
          />
        </div>

        {/* Heading */}
        <div className="text-center mb-10">
          <h2 className="text-[28px] font-bold text-hi tracking-[-0.03em] mb-3">
            Analyzing your photos
          </h2>

          {/* Photo counter — same scale as the progress bar */}
          {status === "analyzing" && total > 0 && (
            <p className="text-[15px] font-semibold text-hi mb-1.5">
              Photo{" "}
              <span className="text-accent tabular-nums">
                {Math.min(processed + 1, total)}
              </span>
              {" "}of{" "}
              <span className="tabular-nums">{total}</span>
            </p>
          )}

          {/* Rotating sub-message — key triggers re-mount for fade animation */}
          <p
            key={displayMsg}
            className="text-[13px] text-mid animate-page-in"
          >
            {displayMsg}
          </p>
        </div>

        {/* Step indicator */}
        <StepIndicator steps={steps} />

        {/* Progress bar */}
        <ProgressBar current={processed} total={total} />

        {/* Timeout message */}
        {elapsed >= TIMEOUT_MS / 1000 && status !== "done" && (
          <div className="mt-8 text-center animate-page-in">
            <p className="text-[13px] text-mid mb-3">
              Taking longer than expected…
            </p>
            <button
              onClick={handleCancel}
              className="px-5 py-2 rounded-lg border border-edge text-[13px] text-mid hover:text-hi hover:border-[#383838] transition-all duration-150 active:scale-[0.97]"
            >
              Cancel and go back
            </button>
          </div>
        )}

        {/* Dev/demo skip link */}
        <div className="text-center mt-10">
          <a
            href="/results"
            className="text-[12px] text-lo hover:text-mid transition-colors duration-150 underline underline-offset-2"
          >
            Skip to results →
          </a>
        </div>
      </div>
    </div>
  );
}
