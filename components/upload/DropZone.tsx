// DropZone — the primary file input on the Upload page.
// Supports drag-and-drop (dragover/drop events) and folder selection
// via <input webkitdirectory>. Passes the FileList to useUpload().handleFiles.
// Shows validation errors inline. Animates the border on drag-hover.
// Will be wired to useUpload hook when hooks are fully implemented.

"use client";

import { useRef, useState } from "react";

interface Props {
  onFiles?: (files: FileList) => void;
}

export default function DropZone({ onFiles }: Props) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function handleDrop(e: React.DragEvent) {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files.length > 0) {
      setError(null);
      onFiles?.(e.dataTransfer.files);
    }
  }

  function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    if (e.target.files && e.target.files.length > 0) {
      setError(null);
      onFiles?.(e.target.files);
    }
  }

  return (
    <div className="w-full max-w-xl">
      <div
        onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
        onDragLeave={() => setIsDragging(false)}
        onDrop={handleDrop}
        onClick={() => inputRef.current?.click()}
        className={`
          border-2 border-dashed rounded-2xl p-16 flex flex-col items-center gap-4
          cursor-pointer transition-all duration-200
          ${isDragging
            ? "border-[var(--accent)] bg-[var(--accent)]/5 scale-[1.01]"
            : "border-[var(--border)] hover:border-[var(--accent)]/60 bg-[var(--surface)]"}
        `}
      >
        <div className="text-5xl select-none">{isDragging ? "📂" : "📁"}</div>
        <div className="text-center">
          <p className="text-white text-sm font-medium">
            Drop a folder here, or click to browse
          </p>
          <p className="text-[var(--text-secondary)] text-xs mt-1">
            JPG · PNG · WEBP &nbsp;·&nbsp; 10–200 images
          </p>
        </div>
      </div>

      {error && (
        <p className="mt-3 text-sm text-red-400 text-center">{error}</p>
      )}

      {/* Folder input — hidden, triggered by click on the zone above */}
      <input
        ref={inputRef}
        type="file"
        multiple
        // @ts-expect-error — webkitdirectory is non-standard but widely supported
        webkitdirectory=""
        accept="image/jpeg,image/png,image/webp"
        className="hidden"
        onChange={handleChange}
      />
    </div>
  );
}
