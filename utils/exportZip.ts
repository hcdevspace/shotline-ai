// ZIP export — packages photos into a folder-per-tier archive and downloads it
// entirely in the browser. No server or filesystem involvement.
//
// Folder structure:
//   ShotlineAI_Export/
//   ├── Best/        ← always included
//   ├── Keep/        ← always included
//   ├── Uncertain/   ← included when opts.includeUncertain
//   └── Rejected/    ← included when opts.includeRejected
//
// Source order of preference:
//   1. photo.file.arrayBuffer()   — original quality + format, exact filename
//   2. photo.previewUrl (base64)  — compressed JPEG fallback (iOS Safari / stale ref)

import JSZip from "jszip";
import { Photo, Tier, getFinalTier } from "@/lib/types";

// ─── Types ────────────────────────────────────────────────────────────────────

export interface ExportOptions {
  includeUncertain: boolean;
  includeRejected:  boolean;
}

// ─── Internal helpers ─────────────────────────────────────────────────────────

const FOLDER: Record<Tier, string> = {
  best:      "Best",
  keep:      "Keep",
  uncertain: "Uncertain",
  reject:    "Rejected",
};

function stripDataUrlPrefix(s: string): string {
  const i = s.indexOf(",");
  return i !== -1 ? s.slice(i + 1) : s;
}

function triggerDownload(blob: Blob, filename: string): void {
  const url  = URL.createObjectURL(blob);
  const a    = document.createElement("a");
  a.href     = url;
  a.download = filename;
  // Must be in the DOM for Firefox
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  // Revoke after a tick so Safari has time to start the download
  setTimeout(() => URL.revokeObjectURL(url), 250);
}

// ─── Public export function ───────────────────────────────────────────────────

export async function exportZip(
  photos: Photo[],
  opts:   ExportOptions
): Promise<void> {
  // Determine which tiers go in this archive
  const included = new Set<Tier>(["best", "keep"]);
  if (opts.includeUncertain) included.add("uncertain");
  if (opts.includeRejected)  included.add("reject");

  const toExport = photos.filter((p) => included.has(getFinalTier(p)));
  if (toExport.length === 0) return;

  const zip = new JSZip();

  for (const photo of toExport) {
    const tier   = getFinalTier(photo);
    const path   = `ShotlineAI_Export/${FOLDER[tier]}/${photo.file.name}`;

    try {
      // Prefer original File — preserves format (HEIC, PNG, WebP) and quality
      const buffer = await photo.file.arrayBuffer();
      zip.file(path, buffer);
    } catch {
      // File reference has gone stale (iOS Safari after page refresh)
      // Fall back to the compressed JPEG preview stored as base64
      zip.file(path, stripDataUrlPrefix(photo.previewUrl), { base64: true });
    }
  }

  const blob = await zip.generateAsync({
    type:               "blob",
    compression:        "DEFLATE",
    compressionOptions: { level: 6 },
  });

  triggerDownload(blob, "ShotlineAI_Export.zip");
}
