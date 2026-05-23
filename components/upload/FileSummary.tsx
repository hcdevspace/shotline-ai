// FileSummary — shows a count and thumbnail strip of staged files
// after the user selects images in the DropZone.
// Rendered below the DropZone before the user clicks "Analyze".
// Thumbnail URLs come from URL.createObjectURL on the File objects.

interface Props {
  count: number;
  previewUrls: string[];   // first 6 preview object URLs
}

export default function FileSummary({ count, previewUrls }: Props) {
  if (count === 0) return null;

  return (
    <div className="mt-5 text-center">
      <p className="text-[var(--text-secondary)] text-sm mb-3">
        <span className="text-white font-semibold">{count}</span> photos ready to analyze
      </p>

      {/* Thumbnail strip */}
      <div className="flex justify-center gap-2 flex-wrap">
        {previewUrls.slice(0, 6).map((url, i) => (
          <img
            key={i}
            src={url}
            alt=""
            className="w-12 h-12 rounded-lg object-cover border border-[var(--border)]"
          />
        ))}
        {count > 6 && (
          <div className="w-12 h-12 rounded-lg bg-[var(--surface-raised)] border border-[var(--border)] flex items-center justify-center">
            <span className="text-[var(--text-secondary)] text-xs">+{count - 6}</span>
          </div>
        )}
      </div>
    </div>
  );
}
