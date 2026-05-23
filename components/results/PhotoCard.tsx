"use client";

// PhotoCard — full results tile.
// Stagger-animates on mount (delay = index × 40 ms).
// Thumbnail: hover reveals caption overlay + image scales.
// Best tier: "★ AI Pick" badge.
// Confidence bar: animates 0→final width, shows score % to the right.
// Tag pills: clickable to filter grid; quality and org tags styled differently.
// Uncertain tier: "Keep ✓" / "Reject ✗" override buttons.

import { Photo, getFinalTier, Tier } from "@/lib/types";
import TierBadge from "@/components/ui/TierBadge";
import ScoreBadge from "@/components/ui/ScoreBadge";

// ─── Constants ────────────────────────────────────────────────────────────────

const TIER_COLOR: Record<Tier, string> = {
  best:      "#4ADE80",
  keep:      "#FACC15",
  uncertain: "#FB923C",
  reject:    "#F87171",
};

// Tags defined in lib/prompts.ts — used to distinguish type for styling
const QUALITY_TAG_SET = new Set([
  "sharp", "blurry", "overexposed", "underexposed", "good-lighting",
  "noisy", "motion-blur", "well-composed", "cropped-badly", "duplicate",
]);

// ─── Types ────────────────────────────────────────────────────────────────────

interface Props {
  photo: Photo;
  index?: number;
  onOverride?: (id: string, tier: Tier) => void;
  activeTagFilter?: string | null;
  onTagClick?: (tag: string) => void;
}

// ─── Component ────────────────────────────────────────────────────────────────

export default function PhotoCard({
  photo,
  index = 0,
  onOverride,
  activeTagFilter,
  onTagClick,
}: Props) {
  const finalTier = getFinalTier(photo);
  const result    = photo.analysisResult;
  const color     = TIER_COLOR[finalTier];
  const score     = result?.score ?? 0;

  return (
    <div
      className="group relative bg-surface rounded-xl border border-edge overflow-hidden
                 hover:border-[#383838] hover:z-10
                 transition-colors duration-150 ease-out
                 animate-card-in"
      style={{
        animationDelay:    `${index * 40}ms`,
        animationFillMode: "both",
      }}
    >
      {/* ── Thumbnail ──────────────────────────────────────────────────────── */}
      <div className="relative aspect-square overflow-hidden bg-elevated">
        <img
          src={photo.previewUrl}
          alt={result?.caption ?? photo.file.name}
          className="w-full h-full object-cover
                     group-hover:scale-[1.05] transition-transform duration-300 ease-out"
        />

        {/* Top badge row: TierBadge left, ScoreBadge right */}
        <div className="absolute top-2 left-2 right-2 flex items-start justify-between">
          <TierBadge tier={finalTier} size="sm" />
          {result && <ScoreBadge score={score} />}
        </div>

        {/* "★ AI Pick" badge — Best tier only */}
        {finalTier === "best" && (
          <div className="absolute bottom-2 left-2">
            <span
              className="flex items-center gap-0.5 px-1.5 py-0.5 rounded
                         text-[9px] font-bold uppercase tracking-[0.07em] leading-none
                         text-canvas bg-accent"
            >
              ★ AI Pick
            </span>
          </div>
        )}

        {/* Caption overlay — slides in on hover */}
        {result?.caption && (
          <div
            className="absolute inset-0 flex items-end p-2.5
                       bg-canvas/[0.83]
                       opacity-0 group-hover:opacity-100
                       transition-opacity duration-200 ease-out"
          >
            <p className="text-[11px] text-hi leading-snug line-clamp-4">
              {result.caption}
            </p>
          </div>
        )}
      </div>

      {/* ── Info panel ─────────────────────────────────────────────────────── */}
      {result && (
        <div className="p-3">

          {/* Confidence bar + score % */}
          <div className="flex items-center gap-2 mb-2.5">
            <div className="flex-1 bg-edge rounded-full h-[3px] overflow-hidden">
              <div
                className="h-full rounded-full animate-bar"
                style={{ width: `${score}%`, backgroundColor: color }}
              />
            </div>
            <span
              className="text-[10px] font-mono font-semibold tabular-nums shrink-0 w-[28px] text-right"
              style={{ color }}
            >
              {score}%
            </span>
          </div>

          {/* Tag pills */}
          {result.tags.length > 0 && (
            <div className="flex flex-wrap gap-1 mb-2.5">
              {result.tags.slice(0, 4).map((tag) => {
                const isActive   = activeTagFilter === tag;
                const isQuality  = QUALITY_TAG_SET.has(tag);
                return (
                  <button
                    key={tag}
                    onClick={() => onTagClick?.(tag)}
                    className={[
                      "text-[10px] px-2 py-0.5 rounded border",
                      "transition-colors duration-150 cursor-pointer",
                      isActive
                        ? "bg-accent/10 border-accent/40 text-accent"
                        : isQuality
                        ? "border-edge text-lo hover:border-keep/50 hover:text-keep"
                        : "border-edge text-mid hover:border-accent/40 hover:text-accent",
                    ].join(" ")}
                  >
                    {tag}
                  </button>
                );
              })}
            </div>
          )}

          {/* Override buttons — Uncertain tier only */}
          {finalTier === "uncertain" && onOverride && (
            <div className="flex gap-1.5">
              <button
                onClick={() => onOverride(photo.id, "keep")}
                className="flex-1 py-1.5 text-[11px] font-semibold uppercase tracking-[0.06em] rounded-md
                           bg-best/10 text-best border border-best/20
                           hover:bg-best/20 transition-colors duration-150"
              >
                Keep ✓
              </button>
              <button
                onClick={() => onOverride(photo.id, "reject")}
                className="flex-1 py-1.5 text-[11px] font-semibold uppercase tracking-[0.06em] rounded-md
                           bg-reject/10 text-reject border border-reject/20
                           hover:bg-reject/20 transition-colors duration-150"
              >
                Reject ✗
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
