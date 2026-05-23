"use client";

// ExportButton — self-contained export panel.
// Owns the "include uncertain / rejected" toggle state.
// Derives the live export count from toggle state so it stays accurate.
// Calls exportZip(photos, options) — no file-system, pure browser.

import { useState, useMemo } from "react";
import { Photo, getFinalTier } from "@/lib/types";
import { exportZip } from "@/utils/exportZip";

// ─── Toggle ───────────────────────────────────────────────────────────────────

interface ToggleProps {
  label:    string;
  count:    number;
  checked:  boolean;
  onChange: (v: boolean) => void;
}

function Toggle({ label, count, checked, onChange }: ToggleProps) {
  return (
    <label className="flex items-center gap-2 cursor-pointer select-none group">
      {/* Track */}
      <button
        role="switch"
        aria-checked={checked}
        onClick={() => onChange(!checked)}
        className={[
          "relative w-7 h-[14px] rounded-full shrink-0",
          "transition-colors duration-200 ease-out",
          checked ? "bg-accent/70" : "bg-edge",
        ].join(" ")}
      >
        {/* Thumb */}
        <span
          className={[
            "absolute top-[2px] w-[10px] h-[10px] rounded-full bg-canvas",
            "transition-all duration-200 ease-out",
            checked ? "left-[14px]" : "left-[2px]",
          ].join(" ")}
        />
      </button>

      <span
        className={[
          "text-[11px] transition-colors duration-150",
          checked ? "text-mid" : "text-lo",
        ].join(" ")}
      >
        {label}
      </span>

      <span className="font-mono text-[10px] text-lo tabular-nums">
        ({count})
      </span>
    </label>
  );
}

// ─── Export button ────────────────────────────────────────────────────────────

interface Props {
  photos: Photo[];
}

export default function ExportButton({ photos }: Props) {
  const [includeUncertain, setIncludeUncertain] = useState(true);
  const [includeRejected,  setIncludeRejected]  = useState(false);
  const [isExporting,      setIsExporting]       = useState(false);

  // Live tier counts
  const counts = useMemo(() => {
    const c = { best: 0, keep: 0, uncertain: 0, reject: 0 };
    for (const p of photos) c[getFinalTier(p)]++;
    return c;
  }, [photos]);

  const exportCount =
    counts.best +
    counts.keep +
    (includeUncertain ? counts.uncertain : 0) +
    (includeRejected  ? counts.reject    : 0);

  async function handleExport() {
    if (isExporting || exportCount === 0) return;
    setIsExporting(true);
    try {
      await exportZip(photos, { includeUncertain, includeRejected });
    } finally {
      setIsExporting(false);
    }
  }

  return (
    <div className="flex flex-col items-end gap-2.5 shrink-0">

      {/* Toggles */}
      <div className="flex items-center gap-5">
        <Toggle
          label="Include Uncertain"
          count={counts.uncertain}
          checked={includeUncertain}
          onChange={setIncludeUncertain}
        />
        <Toggle
          label="Include Rejected"
          count={counts.reject}
          checked={includeRejected}
          onChange={setIncludeRejected}
        />
      </div>

      {/* Primary download button */}
      <button
        onClick={handleExport}
        disabled={isExporting || exportCount === 0}
        className={[
          "flex items-center gap-2 px-5 py-2.5 rounded-lg",
          "text-canvas text-[13px] font-bold tracking-[-0.01em]",
          "transition-all duration-150 ease-out",
          isExporting || exportCount === 0
            ? "bg-accent/40 cursor-not-allowed"
            : "bg-accent hover:bg-accent-dim hover:scale-[1.02] active:scale-[0.98]",
        ].join(" ")}
      >
        {isExporting ? (
          <>
            {/* Spinner */}
            <span
              className="w-[13px] h-[13px] rounded-full border-2 border-canvas/30 border-t-canvas animate-spin shrink-0"
              aria-hidden="true"
            />
            Preparing ZIP…
          </>
        ) : (
          <>
            {/* Download arrow */}
            <svg
              width="13" height="13"
              viewBox="0 0 24 24"
              fill="none" stroke="currentColor"
              strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"
              aria-hidden="true"
            >
              <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
              <polyline points="7 10 12 15 17 10" />
              <line x1="12" y1="15" x2="12" y2="3" />
            </svg>
            Download {exportCount} Photos
          </>
        )}
      </button>
    </div>
  );
}
