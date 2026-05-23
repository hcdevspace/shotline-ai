// LiveGrid — thumbnail mosaic that lights up as AI results arrive.
// Border color transitions from neutral #2A2A2A to the tier color.
// Images fade from 30% → 100% opacity once analyzed.

import { Photo, getFinalTier } from "@/lib/types";

const TIER_COLOR: Record<string, string> = {
  best:      "#4ADE80",
  keep:      "#FACC15",
  uncertain: "#FB923C",
  reject:    "#F87171",
  pending:   "#2A2A2A",
};

interface Props {
  photos: Photo[];
}

export default function LiveGrid({ photos }: Props) {
  return (
    <div className="grid grid-cols-8 sm:grid-cols-10 md:grid-cols-12 gap-1 mt-8 max-h-36 overflow-y-auto">
      {photos.map((photo) => {
        const tier = photo.analysisResult ? getFinalTier(photo) : "pending";
        return (
          <div
            key={photo.id}
            className="aspect-square rounded overflow-hidden transition-all duration-300 ease-out"
            style={{
              border: `1.5px solid ${TIER_COLOR[tier]}`,
            }}
          >
            <img
              src={photo.previewUrl}
              alt=""
              className={`
                w-full h-full object-cover transition-opacity duration-300
                ${tier === "pending" ? "opacity-30" : "opacity-100"}
              `}
            />
          </div>
        );
      })}
    </div>
  );
}
