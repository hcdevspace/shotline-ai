// ScoreBadge — numeric 0–100 quality score in monospace, tier-colored.
// Derives color from score range so it always matches the tier badge beside it.

interface Props {
  score: number;
}

function scoreColor(s: number): string {
  if (s >= 85) return "#4ADE80";
  if (s >= 60) return "#FACC15";
  if (s >= 40) return "#FB923C";
  return "#F87171";
}

export default function ScoreBadge({ score }: Props) {
  return (
    <span
      className="font-mono text-[11px] font-semibold tabular-nums leading-none"
      style={{ color: scoreColor(score) }}
    >
      {score}
    </span>
  );
}
