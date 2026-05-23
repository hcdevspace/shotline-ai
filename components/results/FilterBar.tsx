// FilterBar — pill buttons to show/hide each tier in the results grid.
// Maintains an active set of visible tiers and calls onFilterChange
// when the user toggles one. "All" clears the filter.

"use client";

import { Tier } from "@/lib/types";

const TIERS: Array<{ value: Tier | "all"; label: string; color: string }> = [
  { value: "all",       label: "All",       color: "text-white" },
  { value: "best",      label: "Best",      color: "text-violet-300" },
  { value: "keep",      label: "Keep",      color: "text-emerald-300" },
  { value: "uncertain", label: "Uncertain", color: "text-amber-300" },
  { value: "reject",    label: "Reject",    color: "text-red-400" },
];

interface Props {
  active: Tier | "all";
  counts: Record<Tier, number>;
  onChange: (tier: Tier | "all") => void;
}

export default function FilterBar({ active, counts, onChange }: Props) {
  const total = Object.values(counts).reduce((a, b) => a + b, 0);

  return (
    <div className="flex gap-2 flex-wrap">
      {TIERS.map(({ value, label, color }) => {
        const count = value === "all" ? total : counts[value as Tier];
        const isActive = active === value;
        return (
          <button
            key={value}
            onClick={() => onChange(value)}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all
              ${isActive
                ? "bg-[var(--surface-raised)] border border-[var(--accent)] " + color
                : "bg-[var(--surface)] border border-[var(--border)] text-[var(--text-secondary)] hover:border-[var(--accent)]/40"}
            `}
          >
            {label}
            <span className="ml-1.5 opacity-60">{count}</span>
          </button>
        );
      })}
    </div>
  );
}
