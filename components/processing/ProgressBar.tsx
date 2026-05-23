// ProgressBar — 4px accent-filled track showing overall analysis progress.
// Width transitions smoothly on each update (500ms ease-out).
// Shows "N of total" count and a right-aligned percentage.

interface Props {
  current: number;
  total: number;
}

export default function ProgressBar({ current, total }: Props) {
  const pct = total > 0 ? Math.round((current / total) * 100) : 0;

  return (
    <div className="w-full">
      {/* Track */}
      <div className="w-full bg-edge rounded-full h-[4px] overflow-hidden">
        <div
          className="bg-accent h-full rounded-full transition-all duration-500 ease-out"
          style={{ width: `${pct}%` }}
        />
      </div>

      {/* Labels */}
      <div className="flex items-center justify-between mt-3">
        <p className="text-[13px] text-mid">
          <span className="text-hi font-semibold tabular-nums">{current}</span>
          {" "}of{" "}
          <span className="tabular-nums">{total}</span> analyzed
        </p>
        <p className="font-mono text-[11px] text-lo tabular-nums">{pct}%</p>
      </div>
    </div>
  );
}
