// Upload page — the entry point of ShotlineAI.
// Will host the DropZone component for folder/file selection,
// validate file types, enforce the 10–200 image limit,
// and trigger navigation to /processing once files are staged.

export default function UploadPage() {
  return (
    <div className="flex flex-col items-center justify-center min-h-[calc(100vh-56px)] px-4">
      <div className="text-center mb-10">
        <h1 className="text-4xl font-bold text-white mb-3">
          Curate Your Best Shots
        </h1>
        <p className="text-[var(--text-secondary)] text-lg max-w-md mx-auto">
          Upload a folder of photos. AI will rank, tag, and clean your library
          in seconds.
        </p>
      </div>

      {/* DropZone will replace this placeholder */}
      <div className="w-full max-w-xl border-2 border-dashed border-[var(--border)] rounded-2xl p-16 flex flex-col items-center gap-4 hover:border-[var(--accent)] transition-colors cursor-pointer">
        <div className="text-5xl">📁</div>
        <p className="text-[var(--text-secondary)] text-sm text-center">
          Drag &amp; drop a folder, or click to select images
        </p>
        <p className="text-xs text-[var(--text-secondary)] opacity-60">
          JPG, PNG, WEBP · 10–200 images
        </p>
      </div>

      <p className="mt-6 text-xs text-[var(--text-secondary)] opacity-50">
        Photos never leave your device — processing is done securely
      </p>
    </div>
  );
}
