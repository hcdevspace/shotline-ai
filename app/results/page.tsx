"use client";

// Results page — review and export.
// Stats Hero replaces the old one-liner stats bar.
// Tag filter state lives here; passed through PhotoGrid → PhotoCard.

import { useState, useMemo, useEffect } from "react";
import { useRouter } from "next/navigation";
import { usePhotoStore } from "@/lib/store";
import { Tier, getFinalTier } from "@/lib/types";
import FilterBar from "@/components/results/FilterBar";
import PhotoGrid from "@/components/results/PhotoGrid";
import ExportButton from "@/components/results/ExportButton";

// ─── Stat box ─────────────────────────────────────────────────────────────────

function StatBox({ value, label, color }: { value: number; label: string; color: string }) {
  return (
    <div className="flex flex-col items-center gap-1.5 py-1">
      <span
        className="text-[34px] sm:text-[40px] font-bold tabular-nums leading-none tracking-[-0.04em] animate-card-in"
        style={{ color }}
      >
        {value}
      </span>
      <span className="text-[9px] sm:text-[10px] font-semibold uppercase tracking-[0.1em] text-lo text-center">
        {label}
      </span>
    </div>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function ResultsPage() {
  const router  = useRouter();
  const { photos, setUserTier, demoMode } = usePhotoStore();
  const [activeFilter,    setActiveFilter]    = useState<Tier | "all">("all");
  const [activeTagFilter, setActiveTagFilter] = useState<string | null>(null);

  useEffect(() => {
    document.title = "ShotlineAI — Your Results";
  }, []);

  useEffect(() => {
    if (photos.length === 0) router.replace("/upload");
  }, [photos.length, router]);

  if (photos.length === 0) return null;

  // Derive live counts
  const counts = useMemo<Record<Tier, number>>(() => {
    const c = { best: 0, keep: 0, uncertain: 0, reject: 0 };
    for (const p of photos) c[getFinalTier(p)]++;
    return c;
  }, [photos]);

  const minutesSaved = Math.max(1, Math.round(photos.length / 5));

  function handleTagClick(tag: string) {
    setActiveTagFilter((prev) => (prev === tag ? null : tag));
  }

  return (
    <div className="max-w-[1200px] mx-auto px-6 py-8 animate-page-in">

      {/* Demo mode banner */}
      {demoMode && (
        <div className="flex items-center gap-2.5 mb-6 px-4 py-3 rounded-lg border border-uncertain/30 bg-uncertain/[0.06]">
          <span className="w-1.5 h-1.5 rounded-full bg-uncertain shrink-0" />
          <p className="text-[12px] text-uncertain">
            Demo mode active — showing sample results because the analysis API was unreachable.
          </p>
        </div>
      )}

      {/* ── Stats Hero ────────────────────────────────────────────────────── */}
      <div className="bg-surface border border-edge rounded-xl p-5 sm:p-6 mb-8">
        <div className="grid grid-cols-5 gap-2 sm:gap-4">
          <StatBox value={photos.length}    label="Uploaded"   color="#F5F5F5" />
          <StatBox value={counts.best}      label="Best Picks" color="#4ADE80" />
          <StatBox value={counts.keep}      label="Kept"       color="#FACC15" />
          <StatBox value={counts.uncertain} label="Uncertain"  color="#FB923C" />
          <StatBox value={counts.reject}    label="Rejected"   color="#F87171" />
        </div>

        <div className="border-t border-edge mt-5 pt-4 text-center">
          <p className="text-[12px] text-lo">
            Saved approximately{" "}
            <span className="text-accent font-semibold">~{minutesSaved} min</span>
            {" "}vs. manually reviewing every shot
          </p>
        </div>
      </div>

      {/* ── Header row ────────────────────────────────────────────────────── */}
      <div className="flex items-center justify-between gap-6 mb-6">
        <h1 className="text-[26px] font-bold text-hi tracking-[-0.03em]">
          Your Curated Library
        </h1>
        <ExportButton photos={photos} />
      </div>

      {/* ── Filter row ────────────────────────────────────────────────────── */}
      <div className="flex flex-wrap items-center gap-3 mb-6">
        <FilterBar
          active={activeFilter}
          counts={counts}
          onChange={(tier) => {
            setActiveFilter(tier);
            setActiveTagFilter(null); // clear tag filter on tier change
          }}
        />

        {/* Active tag filter chip + clear button */}
        {activeTagFilter && (
          <div className="flex items-center gap-2 ml-auto">
            <span className="flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-accent/10 border border-accent/30">
              <span className="text-[10px] font-semibold uppercase tracking-[0.07em] text-accent">
                {activeTagFilter}
              </span>
            </span>
            <button
              onClick={() => setActiveTagFilter(null)}
              className="text-[11px] font-semibold text-lo hover:text-mid transition-colors duration-150 underline underline-offset-2"
            >
              Clear
            </button>
          </div>
        )}
      </div>

      {/* ── Photo grid ────────────────────────────────────────────────────── */}
      <PhotoGrid
        photos={photos}
        activeFilter={activeFilter}
        onOverride={(id, tier) => setUserTier(id, tier)}
        activeTagFilter={activeTagFilter}
        onTagClick={handleTagClick}
      />
    </div>
  );
}
