// Processing page — orchestrates the two-phase analysis pipeline.
// Phase 1: client-side preprocessing (blur/brightness detection via canvas).
// Phase 2: AI analysis via /api/analyze in batches of 5.
// Renders StepIndicator, ProgressBar, and a LiveGrid showing
// thumbnails updating in real-time as tiers are assigned.
// Navigates to /results when all batches are complete.

export default function ProcessingPage() {
  return (
    <div className="flex flex-col items-center justify-center min-h-[calc(100vh-56px)] px-4">
      <div className="w-full max-w-lg text-center">
        <h2 className="text-2xl font-semibold text-white mb-2">
          Analyzing your photos
        </h2>
        <p className="text-[var(--text-secondary)] text-sm mb-10">
          This usually takes 15–30 seconds
        </p>

        {/* StepIndicator will replace this */}
        <div className="flex justify-center gap-8 mb-8">
          {["Preprocessing", "AI Analysis", "Done"].map((step, i) => (
            <div key={step} className="flex flex-col items-center gap-1">
              <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold
                ${i === 0 ? "bg-[var(--accent)] text-white" : "bg-[var(--surface-raised)] text-[var(--text-secondary)]"}`}>
                {i + 1}
              </div>
              <span className="text-xs text-[var(--text-secondary)]">{step}</span>
            </div>
          ))}
        </div>

        {/* ProgressBar will replace this */}
        <div className="w-full bg-[var(--surface-raised)] rounded-full h-2 mb-3">
          <div
            className="bg-[var(--accent)] h-2 rounded-full transition-all duration-500"
            style={{ width: "35%" }}
          />
        </div>
        <p className="text-sm text-[var(--text-secondary)]">
          <span className="text-white font-medium">21</span> / 60 photos analyzed
        </p>
      </div>
    </div>
  );
}
