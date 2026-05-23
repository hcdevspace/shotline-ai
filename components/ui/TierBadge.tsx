// TierBadge — color-coded pill showing the confidence tier of a photo.
// Used on PhotoCard and in the results summary header.
// Colors are intentionally distinct for rapid visual scanning:
//   best=purple, keep=green, uncertain=amber, reject=red

import { Tier } from "@/lib/types";

const TIER_STYLES: Record<Tier, { bg: string; text: string; label: string }> = {
  best:      { bg: "bg-violet-500/20", text: "text-violet-300",  label: "Best" },
  keep:      { bg: "bg-emerald-500/20", text: "text-emerald-300", label: "Keep" },
  uncertain: { bg: "bg-amber-500/20",  text: "text-amber-300",   label: "Uncertain" },
  reject:    { bg: "bg-red-500/20",    text: "text-red-400",     label: "Reject" },
};

interface Props {
  tier: Tier;
  size?: "sm" | "md";
}

export default function TierBadge({ tier, size = "md" }: Props) {
  const { bg, text, label } = TIER_STYLES[tier];
  const padding = size === "sm" ? "px-1.5 py-0.5 text-[10px]" : "px-2.5 py-1 text-xs";

  return (
    <span className={`${bg} ${text} ${padding} rounded-full font-semibold tracking-wide`}>
      {label}
    </span>
  );
}
