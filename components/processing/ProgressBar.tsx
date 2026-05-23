// ProgressBar — shows analyzed / total count with a smooth animated fill.
// Receives current (processed so far) and total (surviving photos) as props.
// Transitions the bar width with CSS for smooth live updates.

interface Props {
  current: number;
  total: number;
}

export default function ProgressBar({ current, total }: Props) {
  const pct = total > 0 ? Math.round((current / total) * 100) : 0;

  return (
    <div className="w-full">
      <div className="w-full bg-[var(--surface-raised)] rounded-full h-2 overflow-hidden">
        <div
          className="bg-[var(--accent)] h-2 rounded-full transition-all duration-500 ease-out"
          style={{ width: `${pct}%` }}
        />
      </div>
      <p className="text-sm text-[var(--text-secondary)] mt-2 text-center">
        <span className="text-white font-medium">{current}</span> / {total} photos analyzed
      </p>
    </div>
  );
}
