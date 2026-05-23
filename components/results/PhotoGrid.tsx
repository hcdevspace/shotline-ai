// PhotoGrid — renders filtered PhotoCards in a responsive masonry-style grid.
// Reads from the Zustand store, applies the active FilterBar tier filter,
// and passes the override callback down to each PhotoCard.
// Will also handle empty-state messaging per tier.

"use client";

import { Photo, Tier, getFinalTier } from "@/lib/types";
import PhotoCard from "./PhotoCard";

interface Props {
  photos: Photo[];
  activeFilter: Tier | "all";
  onOverride: (id: string, tier: Tier) => void;
}

export default function PhotoGrid({ photos, activeFilter, onOverride }: Props) {
  const visible = activeFilter === "all"
    ? photos
    : photos.filter((p) => getFinalTier(p) === activeFilter);

  if (visible.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-24 text-[var(--text-secondary)]">
        <span className="text-4xl mb-3">🔍</span>
        <p className="text-sm">No photos in this tier</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3">
      {visible.map((photo) => (
        <PhotoCard key={photo.id} photo={photo} onOverride={onOverride} />
      ))}
    </div>
  );
}
