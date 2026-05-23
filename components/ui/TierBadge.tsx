// TierBadge — small uppercase pill labeling the confidence tier.
// Background is a 15% opacity tint of the tier color.
// Spec: 11px, font-weight 600, uppercase, letter-spacing 0.08em, border-radius 4px.

import { Tier } from "@/lib/types";

const TIER_CONFIG: Record<Tier, { bg: string; color: string; label: string }> = {
  best:      { bg: "rgba(74,  222, 128, 0.15)", color: "#4ADE80", label: "BEST" },
  keep:      { bg: "rgba(250, 204,  21, 0.15)", color: "#FACC15", label: "KEEP" },
  uncertain: { bg: "rgba(251, 146,  60, 0.15)", color: "#FB923C", label: "UNCERTAIN" },
  reject:    { bg: "rgba(248, 113, 113, 0.15)", color: "#F87171", label: "REJECT" },
};

interface Props {
  tier: Tier;
  size?: "sm" | "md";
}

export default function TierBadge({ tier, size = "md" }: Props) {
  const { bg, color, label } = TIER_CONFIG[tier];
  return (
    <span
      className={`
        inline-block rounded font-semibold uppercase tracking-[0.08em] leading-none
        ${size === "sm" ? "text-[10px] px-1.5 py-[3px]" : "text-[11px] px-2 py-[4px]"}
      `}
      style={{ backgroundColor: bg, color }}
    >
      {label}
    </span>
  );
}
