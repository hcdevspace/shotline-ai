// PhotoCard — individual photo tile on the Results page.
// Shows thumbnail, TierBadge, ScoreBadge, caption, and tag chips.
// For Uncertain photos, renders "Keep" / "Reject" override buttons.
// Clicking the thumbnail opens a full-size preview (to be implemented).

"use client";

import { Photo, getFinalTier, Tier } from "@/lib/types";
import TierBadge from "@/components/ui/TierBadge";
import ScoreBadge from "@/components/ui/ScoreBadge";

interface Props {
  photo: Photo;
  onOverride?: (id: string, tier: Tier) => void;
}

export default function PhotoCard({ photo, onOverride }: Props) {
  const finalTier = getFinalTier(photo);
  const result = photo.analysisResult;

  return (
    <div className="group relative bg-[var(--surface)] rounded-xl border border-[var(--border)] overflow-hidden hover:border-[var(--accent)]/40 transition-all duration-200">
      {/* Thumbnail */}
      <div className="relative aspect-square overflow-hidden bg-[var(--surface-raised)]">
        <img
          src={photo.previewUrl}
          alt={result?.caption ?? photo.file.name}
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
        />

        {/* Badges overlay (top row) */}
        <div className="absolute top-2 left-2 right-2 flex items-start justify-between">
          <TierBadge tier={finalTier} size="sm" />
          {result && <ScoreBadge score={result.score} />}
        </div>
      </div>

      {/* Info */}
      {result && (
        <div className="p-2.5">
          <p className="text-xs text-[var(--text-secondary)] line-clamp-2 leading-relaxed">
            {result.caption}
          </p>

          {/* Tags */}
          <div className="flex flex-wrap gap-1 mt-1.5">
            {result.tags.slice(0, 3).map((tag) => (
              <span key={tag} className="text-[10px] px-1.5 py-0.5 bg-[var(--surface-raised)] text-[var(--text-secondary)] rounded">
                {tag}
              </span>
            ))}
          </div>

          {/* Override buttons — only shown for uncertain tier */}
          {finalTier === "uncertain" && onOverride && (
            <div className="flex gap-1.5 mt-2.5">
              <button
                onClick={() => onOverride(photo.id, "keep")}
                className="flex-1 py-1 text-xs rounded-md bg-emerald-600/20 text-emerald-400 hover:bg-emerald-600/40 transition-colors"
              >
                Keep
              </button>
              <button
                onClick={() => onOverride(photo.id, "reject")}
                className="flex-1 py-1 text-xs rounded-md bg-red-600/20 text-red-400 hover:bg-red-600/40 transition-colors"
              >
                Reject
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
