// ScoreBadge — shows the numeric AI score (0–100) on a PhotoCard.
// Color interpolates from red (low) to green (high) so quality is
// scannable at a glance without reading the number.

interface Props {
  score: number;
}

function scoreColor(score: number): string {
  if (score >= 85) return "text-emerald-300";
  if (score >= 60) return "text-sky-300";
  if (score >= 40) return "text-amber-300";
  return "text-red-400";
}

export default function ScoreBadge({ score }: Props) {
  return (
    <span className={`text-xs font-bold tabular-nums ${scoreColor(score)}`}>
      {score}
    </span>
  );
}
