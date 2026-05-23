"use client";

// DropZone — primary file input.
// Default (compact=false): full centered zone with icon + format hints.
// Compact (compact=true): slim horizontal strip used when images are already staged.
//
// Folder drag-and-drop uses DataTransferItem.webkitGetAsEntry() so the browser
// reads directory contents recursively instead of ignoring the folder entirely.
// Plain file drops and the <input webkitdirectory> click path are unchanged.

import { useRef, useState } from "react";

interface Props {
  onFiles?: (files: FileList | File[]) => void;
  compact?: boolean;
}

// ─── File System API helpers ──────────────────────────────────────────────────

async function readEntry(entry: FileSystemEntry): Promise<File[]> {
  if (entry.isFile) {
    return new Promise<File[]>((resolve) => {
      (entry as FileSystemFileEntry).file(
        (f) => resolve([f]),
        ()  => resolve([]),
      );
    });
  }

  if (entry.isDirectory) {
    const reader = (entry as FileSystemDirectoryEntry).createReader();
    const allEntries: FileSystemEntry[] = [];

    // readEntries returns ≤100 entries per call — loop until empty
    let batch: FileSystemEntry[];
    do {
      batch = await new Promise<FileSystemEntry[]>((resolve, reject) =>
        reader.readEntries(resolve, reject),
      );
      allEntries.push(...batch);
    } while (batch.length > 0);

    const nested = await Promise.all(allEntries.map(readEntry));
    return nested.flat();
  }

  return [];
}

async function getDroppedFiles(dt: DataTransfer): Promise<File[]> {
  // Prefer the File System API — required for folder drops
  if (dt.items?.length > 0) {
    const entries: FileSystemEntry[] = [];
    for (let i = 0; i < dt.items.length; i++) {
      const entry = dt.items[i].webkitGetAsEntry?.();
      if (entry) entries.push(entry);
    }
    if (entries.length > 0) {
      const nested = await Promise.all(entries.map(readEntry));
      return nested.flat();
    }
  }

  // Fallback: plain files dropped (no folder)
  return Array.from(dt.files);
}

// ─── Component ────────────────────────────────────────────────────────────────

export default function DropZone({ onFiles, compact = false }: Props) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [isDragging, setIsDragging] = useState(false);

  async function handleDrop(e: React.DragEvent) {
    e.preventDefault();
    setIsDragging(false);
    const files = await getDroppedFiles(e.dataTransfer);
    if (files.length > 0) onFiles?.(files);
  }

  function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    if (e.target.files && e.target.files.length > 0) onFiles?.(e.target.files);
  }

  // ── Compact variant ──────────────────────────────────────────────────────────
  if (compact) {
    return (
      <div
        onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
        onDragLeave={() => setIsDragging(false)}
        onDrop={handleDrop}
        onClick={() => inputRef.current?.click()}
        className={`
          w-full border border-dashed rounded-xl px-5 py-3
          flex items-center gap-3 cursor-pointer select-none
          transition-all duration-150 ease-out
          ${isDragging
            ? "border-accent bg-accent/[0.03]"
            : "border-edge hover:border-accent/40 bg-surface"}
        `}
      >
        <svg
          width="16" height="16"
          viewBox="0 0 24 24"
          fill="none" stroke="currentColor"
          strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"
          className={isDragging ? "text-accent" : "text-mid"}
        >
          <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
          <polyline points="17 8 12 3 7 8" />
          <line x1="12" y1="3" x2="12" y2="15" />
        </svg>
        <span className="text-[13px] text-mid">
          {isDragging ? "Release to add" : "Drop more photos, or"}{" "}
          <span className="text-accent">browse</span>
        </span>
        <input
          ref={inputRef}
          type="file"
          multiple
          // @ts-expect-error webkitdirectory is non-standard
          webkitdirectory=""
          accept="image/jpeg,image/png,image/webp,image/heic"
          className="hidden"
          onChange={handleChange}
        />
      </div>
    );
  }

  // ── Full variant ─────────────────────────────────────────────────────────────
  return (
    <div className="w-full max-w-xl">
      <div
        onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
        onDragLeave={() => setIsDragging(false)}
        onDrop={handleDrop}
        onClick={() => inputRef.current?.click()}
        className={`
          border-2 border-dashed rounded-xl px-12 py-10
          flex flex-col items-center gap-4
          cursor-pointer select-none
          transition-all duration-150 ease-out
          ${isDragging
            ? "border-accent bg-accent/[0.03] scale-[1.01]"
            : "border-edge bg-surface hover:border-accent/35 hover:bg-elevated"}
        `}
      >
        <div className={`transition-colors duration-150 ${isDragging ? "text-accent" : "text-mid"}`}>
          <svg
            width="36" height="36"
            viewBox="0 0 24 24"
            fill="none" stroke="currentColor"
            strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"
          >
            <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
            <polyline points="17 8 12 3 7 8" />
            <line x1="12" y1="3" x2="12" y2="15" />
          </svg>
        </div>

        <div className="text-center">
          <p className="text-hi text-[14px] font-semibold tracking-[-0.01em] mb-1">
            {isDragging ? "Release to stage files" : "Drop a folder here"}
          </p>
          <p className="text-mid text-[13px]">
            or <span className="text-accent">click to browse</span>
          </p>
        </div>

        <div className="flex items-center gap-2.5 text-lo text-[11px] font-semibold uppercase tracking-[0.07em]">
          {["JPG", "PNG", "WEBP", "HEIC"].map((fmt, i) => (
            <span key={fmt} className="flex items-center gap-2.5">
              {i > 0 && <span className="w-1 h-1 rounded-full bg-lo" />}
              {fmt}
            </span>
          ))}
        </div>
      </div>

      <input
        ref={inputRef}
        type="file"
        multiple
        // @ts-expect-error webkitdirectory is non-standard
        webkitdirectory=""
        accept="image/jpeg,image/png,image/webp,image/heic"
        className="hidden"
        onChange={handleChange}
      />
    </div>
  );
}
