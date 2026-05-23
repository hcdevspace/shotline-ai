"use client";

// PhotoGrid — responsive card grid for the Results page.
// Applies both tier filter and optional tag filter.
// Three distinct empty states: no-tag-match, no-tier-match, truly-empty.

import { useRouter } from "next/navigation";
import { Photo, Tier, getFinalTier } from "@/lib/types";
import PhotoCard from "./PhotoCard";

interface Props {
  photos: Photo[];
  activeFilter: Tier | "all";
  onOverride: (id: string, tier: Tier) => void;
  activeTagFilter?: string | null;
  onTagClick?: (tag: string) => void;
}

export default function PhotoGrid({
  photos,
  activeFilter,
  onOverride,
  activeTagFilter,
  onTagClick,
}: Props) {
  const router = useRouter();

  // Apply tier filter first, then tag filter
  const tierFiltered =
    activeFilter === "all"
      ? photos
      : photos.filter((p) => getFinalTier(p) === activeFilter);

  const visible = activeTagFilter
    ? tierFiltered.filter((p) =>
        (p.analysisResult?.tags ?? []).includes(activeTagFilter)
      )
    : tierFiltered;

  // ── Empty states ────────────────────────────────────────────────────────────

  if (photos.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-24 gap-5">
        <div className="w-14 h-14 rounded-xl bg-surface border border-edge flex items-center justify-center">
          <svg
            width="22" height="22"
            viewBox="0 0 24 24"
            fill="none" stroke="#555555"
            strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"
          >
            <rect x="3" y="3" width="18" height="18" rx="2" />
            <circle cx="8.5" cy="8.5" r="1.5" />
            <polyline points="21 15 16 10 5 21" />
          </svg>
        </div>
        <div className="text-center">
          <p className="text-mid text-[14px] mb-1">No results yet</p>
          <p className="text-lo text-[12px]">Upload photos and run analysis to see your curated library.</p>
        </div>
        <button
          onClick={() => router.push("/upload")}
          className="mt-2 px-5 py-2 rounded-lg border border-edge text-[12px] font-semibold text-mid
                     hover:border-accent/40 hover:text-accent transition-colors duration-150"
        >
          Try uploading again →
        </button>
      </div>
    );
  }

  if (visible.length === 0 && activeTagFilter) {
    return (
      <div className="flex flex-col items-center justify-center py-20 gap-4">
        <div className="w-12 h-12 rounded-xl bg-surface border border-edge flex items-center justify-center">
          <svg
            width="18" height="18"
            viewBox="0 0 24 24"
            fill="none" stroke="#555555"
            strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"
          >
            <circle cx="11" cy="11" r="8" />
            <line x1="21" y1="21" x2="16.65" y2="16.65" />
          </svg>
        </div>
        <div className="text-center">
          <p className="text-mid text-[14px] mb-1">
            No photos tagged{" "}
            <span className="text-accent font-semibold">"{activeTagFilter}"</span>
          </p>
          <p className="text-lo text-[12px]">Try a different tag or clear the tag filter.</p>
        </div>
      </div>
    );
  }

  if (visible.length === 0) {
    const label = activeFilter === "all" ? "photos" : `${activeFilter} photos`;
    return (
      <div className="flex flex-col items-center justify-center py-20 gap-4">
        <div className="w-12 h-12 rounded-xl bg-surface border border-edge flex items-center justify-center">
          <svg
            width="18" height="18"
            viewBox="0 0 24 24"
            fill="none" stroke="#555555"
            strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"
          >
            <circle cx="11" cy="11" r="8" />
            <line x1="21" y1="21" x2="16.65" y2="16.65" />
          </svg>
        </div>
        <p className="text-mid text-[14px]">No {label} match this filter</p>
      </div>
    );
  }

  // ── Grid ────────────────────────────────────────────────────────────────────

  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3">
      {visible.map((photo, index) => (
        <PhotoCard
          key={photo.id}
          photo={photo}
          index={index}
          onOverride={onOverride}
          activeTagFilter={activeTagFilter}
          onTagClick={onTagClick}
        />
      ))}
    </div>
  );
}
