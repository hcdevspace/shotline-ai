// ExportButton — triggers the JSZip export of all non-rejected photos.
// Shows a loading spinner while the ZIP is being generated.
// Calls exportPhotos() from utils/zipExport.ts.

"use client";

import { useState } from "react";
import { Photo } from "@/lib/types";
import { exportPhotos } from "@/utils/zipExport";

interface Props {
  photos: Photo[];
  exportCount: number;  // precomputed non-reject count for the label
}

export default function ExportButton({ photos, exportCount }: Props) {
  const [isExporting, setIsExporting] = useState(false);

  async function handleExport() {
    setIsExporting(true);
    try {
      await exportPhotos(photos);
    } finally {
      setIsExporting(false);
    }
  }

  return (
    <button
      onClick={handleExport}
      disabled={isExporting || exportCount === 0}
      className="px-5 py-2.5 bg-[var(--accent)] hover:bg-[var(--accent-hover)] disabled:opacity-50 disabled:cursor-not-allowed text-white text-sm font-medium rounded-lg transition-colors flex items-center gap-2"
    >
      {isExporting ? (
        <>
          <span className="inline-block w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
          Packaging…
        </>
      ) : (
        <>
          ↓ Download {exportCount} Photos
        </>
      )}
    </button>
  );
}
