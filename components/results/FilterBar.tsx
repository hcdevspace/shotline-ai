// FilterBar — tier filter pills for the results grid.
// Active pill: surface bg + accent border + tier-colored text.
// Inactive: canvas bg + edge border + mid text, hover brightens.
// Labels are uppercase 11px with count in monospace.

"use client";

import { Tier } from "@/lib/types";

const OPTIONS: Array<{ value: Tier | "all"; label: string; activeColor: string }> = [
  { value: "all",       label: "All",       activeColor: "#F5F5F5" },
  { value: "best",      label: "Best",      activeColor: "#4ADE80" },
  { value: "keep",      label: "Keep",      activeColor: "#FACC15" },
  { value: "uncertain", label: "Uncertain", activeColor: "#FB923C" },
  { value: "reject",    label: "Reject",    activeColor: "#F87171" },
];

interface Props {
  active: Tier | "all";
  counts: Record<Tier, number>;
  onChange: (tier: Tier | "all") => void;
}

export default function FilterBar({ active, counts, onChange }: Props) {
  const total = (Object.values(counts) as number[]).reduce((a, b) => a + b, 0);

  return (
    <div className="flex gap-2 flex-wrap">
      {OPTIONS.map(({ value, label, activeColor }) => {
        const count = value === "all" ? total : counts[value as Tier];
        const isActive = active === value;

        return (
          <button
            key={value}
            onClick={() => onChange(value)}
            className={`
              px-3 py-1.5 rounded-md text-[11px] font-semibold uppercase tracking-[0.07em]
              border transition-all duration-150 ease-out
              ${isActive
                ? "bg-surface border-accent/35"
                : "bg-canvas border-edge text-mid hover:text-hi hover:border-[#383838]"}
            `}
            style={isActive ? { color: activeColor } : undefined}
          >
            {label}
            <span className="ml-1.5 font-mono font-normal opacity-50">{count}</span>
          </button>
        );
      })}
    </div>
  );
}
