// LiveGrid — thumbnail grid that updates in real-time during analysis.
// Each cell shows the photo thumbnail with a colored border that
// transitions from neutral → tier color as results arrive.
// Gives the impression of photos "lighting up" as AI processes them.

import { Photo, getFinalTier } from "@/lib/types";

const TIER_BORDER: Record<string, string> = {
  best:      "border-violet-500",
  keep:      "border-emerald-500",
  uncertain: "border-amber-400",
  reject:    "border-red-500",
  pending:   "border-[var(--border)]",
};

interface Props {
  photos: Photo[];
}

export default function LiveGrid({ photos }: Props) {
  return (
    <div className="grid grid-cols-6 sm:grid-cols-8 md:grid-cols-10 gap-1.5 mt-6 max-h-48 overflow-y-auto">
      {photos.map((photo) => {
        const tier = photo.analysisResult ? getFinalTier(photo) : "pending";
        return (
          <div
            key={photo.id}
            className={`aspect-square rounded-md border-2 overflow-hidden transition-all duration-300 ${TIER_BORDER[tier]}`}
          >
            <img
              src={photo.previewUrl}
              alt=""
              className={`w-full h-full object-cover transition-opacity duration-300 ${tier === "pending" ? "opacity-40" : "opacity-100"}`}
            />
          </div>
        );
      })}
    </div>
  );
}
