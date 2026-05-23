// Results page — the main review and export interface.
// Reads analyzed photos from the Zustand store and renders them
// grouped by confidence tier: Best / Keep / Uncertain / Reject.
// Supports per-image tier overrides on Uncertain photos.
// ExportButton triggers JSZip to package all non-rejected photos for download.

export default function ResultsPage() {
  const mockSummary = { best: 12, keep: 28, uncertain: 9, reject: 11 };

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-white">Your Curated Library</h1>
          <p className="text-[var(--text-secondary)] text-sm mt-1">
            {mockSummary.best + mockSummary.keep} photos selected ·{" "}
            {mockSummary.uncertain} need review ·{" "}
            {mockSummary.reject} rejected
          </p>
        </div>

        {/* ExportButton placeholder */}
        <button className="px-5 py-2.5 bg-[var(--accent)] hover:bg-[var(--accent-hover)] text-white text-sm font-medium rounded-lg transition-colors">
          Download Selected
        </button>
      </div>

      {/* FilterBar placeholder */}
      <div className="flex gap-2 mb-8">
        {(["All", "Best", "Keep", "Uncertain", "Reject"] as const).map((label) => (
          <button
            key={label}
            className="px-3 py-1.5 text-xs font-medium rounded-md bg-[var(--surface-raised)] text-[var(--text-secondary)] hover:text-white transition-colors"
          >
            {label}
          </button>
        ))}
      </div>

      {/* PhotoGrid placeholder */}
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
        {Array.from({ length: 20 }).map((_, i) => (
          <div
            key={i}
            className="aspect-square bg-[var(--surface-raised)] rounded-xl border border-[var(--border)] flex items-center justify-center"
          >
            <span className="text-xs text-[var(--text-secondary)]">Photo {i + 1}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
