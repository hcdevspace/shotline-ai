// FileSummary — compact thumbnail strip shown after files are staged.
// Displays the first 6 preview thumbnails plus an overflow count badge.

interface Props {
  count: number;
  previewUrls: string[];
}

export default function FileSummary({ count, previewUrls }: Props) {
  if (count === 0) return null;

  return (
    <div className="mt-6 text-center">
      <p className="text-mid text-[13px] mb-4">
        <span className="text-hi font-semibold">{count}</span> photos staged
      </p>

      <div className="flex justify-center gap-1.5 flex-wrap">
        {previewUrls.slice(0, 6).map((url, i) => (
          <img
            key={i}
            src={url}
            alt=""
            className="w-11 h-11 rounded-lg object-cover border border-edge"
          />
        ))}
        {count > 6 && (
          <div className="w-11 h-11 rounded-lg bg-elevated border border-edge flex items-center justify-center">
            <span className="text-mid text-[11px] font-semibold">+{count - 6}</span>
          </div>
        )}
      </div>
    </div>
  );
}
