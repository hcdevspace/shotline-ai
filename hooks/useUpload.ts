"use client";

// useUpload — manages the full client-side upload pipeline.
// Accepts FileList or File[], filters to accepted image types,
// compresses each image to max 1024px via Canvas API, and stores
// the results in local React state. Navigation is left to the page.

import { useState, useCallback } from "react";

// ─── Types ────────────────────────────────────────────────────────────────────

export interface UploadedImage {
  id: string;
  filename: string;
  file: File;         // kept for ZIP export and Zustand Photo conversion
  base64: string;     // data URL — compressed JPEG, usable as <img src>
  width: number;      // post-compression dimensions
  height: number;
  fileSize: number;   // original file size in bytes
  status: "pending";
}

// ─── Constants ────────────────────────────────────────────────────────────────

const ACCEPTED_TYPES = new Set([
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/heic",
  "image/heif",
]);
const MAX_DIM = 1024;
const JPEG_QUALITY = 0.85;
const CHUNK_SIZE = 8; // images processed in parallel per batch

// ─── Compression ─────────────────────────────────────────────────────────────

async function compressImage(file: File): Promise<UploadedImage | null> {
  return new Promise((resolve) => {
    const objectUrl = URL.createObjectURL(file);
    const img = new Image();

    img.onload = () => {
      URL.revokeObjectURL(objectUrl);

      let w = img.naturalWidth;
      let h = img.naturalHeight;

      // Downscale while preserving aspect ratio
      if (w > MAX_DIM || h > MAX_DIM) {
        const ratio = MAX_DIM / Math.max(w, h);
        w = Math.round(w * ratio);
        h = Math.round(h * ratio);
      }

      const canvas = document.createElement("canvas");
      canvas.width = w;
      canvas.height = h;
      const ctx = canvas.getContext("2d");

      if (!ctx) {
        resolve(null);
        return;
      }

      ctx.drawImage(img, 0, 0, w, h);
      const base64 = canvas.toDataURL("image/jpeg", JPEG_QUALITY);

      resolve({
        id: crypto.randomUUID(),
        filename: file.name,
        file,
        base64,
        width: w,
        height: h,
        fileSize: file.size,
        status: "pending",
      });
    };

    img.onerror = () => {
      URL.revokeObjectURL(objectUrl);
      resolve(null); // silently skip undecodable files
    };

    img.src = objectUrl;
  });
}

function isAccepted(file: File): boolean {
  return (
    ACCEPTED_TYPES.has(file.type) ||
    /\.(heic|heif)$/i.test(file.name)
  );
}

// ─── Demo image generation ────────────────────────────────────────────────────
// 12 images with pre-verified filenames that hash to a good tier distribution:
//   BEST: IMG_4824, IMG_5301
//   KEEP: IMG_5031, DSC_0405, IMG_5050, RAW_0012
//   UNCERTAIN: IMG_4935, IMG_5100, DSC_0100
//   REJECT: IMG_4823, DSC_0291, DSC_0318
//
// Canvas rendering varies by type so preprocessing annotates them correctly:
//   normal → grid+text → sharp, well-lit
//   dark   → near-black bg → likely_dark
//   flat   → solid color, no edges → sharpness≈0 → likely_blurry
//   bright → near-white bg → likely_bright

type DemoType = "normal" | "dark" | "flat" | "bright";

const DEMO_SPECS: { filename: string; label: string; bg: string; type: DemoType }[] = [
  { filename: "IMG_4824.jpg", label: "Travel",         bg: "#1E40AF", type: "normal" },
  { filename: "IMG_5301.jpg", label: "Portrait",       bg: "#B45309", type: "normal" },
  { filename: "IMG_5031.jpg", label: "Landscape",      bg: "#15803D", type: "normal" },
  { filename: "DSC_0405.jpg", label: "Group Photo",    bg: "#6D28D9", type: "normal" },
  { filename: "IMG_5050.jpg", label: "Street",         bg: "#A16207", type: "normal" },
  { filename: "RAW_0012.jpg", label: "Architecture",   bg: "#374151", type: "normal" },
  { filename: "IMG_4935.jpg", label: "Night Shot",     bg: "#050810", type: "dark"   },
  { filename: "IMG_5100.jpg", label: "Action",         bg: "#1C3461", type: "dark"   },
  { filename: "DSC_0100.jpg", label: "Indoor",         bg: "#1C0A00", type: "dark"   },
  { filename: "IMG_4823.jpg", label: "Blurry",         bg: "#1E3A5F", type: "flat"   },
  { filename: "DSC_0291.jpg", label: "Near-Duplicate", bg: "#1E3F9E", type: "normal" },
  { filename: "DSC_0318.jpg", label: "Overexposed",    bg: "#FEFCE8", type: "bright" },
];

export function generateDemoImages(): UploadedImage[] {
  return DEMO_SPECS.map((spec) => {
    const W = 800;
    const H = 600;
    const canvas = document.createElement("canvas");
    canvas.width  = W;
    canvas.height = H;
    const ctx = canvas.getContext("2d")!;

    ctx.fillStyle = spec.bg;
    ctx.fillRect(0, 0, W, H);

    if (spec.type === "normal") {
      // Grid lines create edges → detected as sharp by Laplacian variance
      ctx.strokeStyle = "rgba(255,255,255,0.08)";
      ctx.lineWidth = 1;
      for (let x = 0; x <= W; x += 80) {
        ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, H); ctx.stroke();
      }
      for (let y = 0; y <= H; y += 60) {
        ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(W, y); ctx.stroke();
      }
      ctx.textAlign    = "center";
      ctx.textBaseline = "middle";
      ctx.fillStyle    = "rgba(255,255,255,0.50)";
      ctx.font         = "bold 28px system-ui, sans-serif";
      ctx.fillText(spec.label, W / 2, H / 2 - 14);
      ctx.font      = "12px monospace";
      ctx.fillStyle = "rgba(255,255,255,0.25)";
      ctx.fillText(spec.filename, W / 2, H / 2 + 16);
    } else if (spec.type === "dark") {
      // Very dark bg → brightness ≈ 15–25 → likely_dark
      ctx.fillStyle = "rgba(255,255,255,0.06)";
      ctx.font         = "bold 22px system-ui, sans-serif";
      ctx.textAlign    = "center";
      ctx.textBaseline = "middle";
      ctx.fillText(spec.label, W / 2, H / 2);
    } else if (spec.type === "flat") {
      // Solid color, no edges → Laplacian variance ≈ 0 → likely_blurry
      // (intentionally blank — the "photo" is completely blurred)
    } else if (spec.type === "bright") {
      // Near-white → brightness ≈ 245 → likely_bright
      ctx.fillStyle = "rgba(0,0,0,0.08)";
      ctx.font         = "bold 22px system-ui, sans-serif";
      ctx.textAlign    = "center";
      ctx.textBaseline = "middle";
      ctx.fillText(spec.label, W / 2, H / 2);
    }

    const base64 = canvas.toDataURL("image/jpeg", JPEG_QUALITY);

    // Build a real File so the ZIP export works (needs arrayBuffer())
    const raw = atob(base64.split(",")[1]);
    const buf = new Uint8Array(raw.length);
    for (let j = 0; j < raw.length; j++) buf[j] = raw.charCodeAt(j);
    const blob = new Blob([buf], { type: "image/jpeg" });
    const file = new File([blob], spec.filename, { type: "image/jpeg" });

    return {
      id:       crypto.randomUUID(),
      filename: spec.filename,
      file,
      base64,
      width:    W,
      height:   H,
      fileSize: blob.size,
      status:   "pending" as const,
    };
  });
}

// ─── Hook ─────────────────────────────────────────────────────────────────────

export function useUpload() {
  const [images, setImages] = useState<UploadedImage[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [progress, setProgress] = useState(0); // 0–100

  const addFiles = useCallback(async (files: FileList | File[]) => {
    const arr = Array.from(files).filter(isAccepted);
    if (arr.length === 0) return;

    setIsProcessing(true);
    setProgress(0);

    let done = 0;

    for (let i = 0; i < arr.length; i += CHUNK_SIZE) {
      const chunk = arr.slice(i, i + CHUNK_SIZE);
      const results = await Promise.all(chunk.map(compressImage));
      const valid = results.filter((r): r is UploadedImage => r !== null);

      done += chunk.length;
      setProgress(Math.round((done / arr.length) * 100));

      if (valid.length > 0) {
        setImages((prev) => {
          // Deduplicate by filename — prevents double-adding the same file
          const seen = new Set(prev.map((p) => p.filename));
          return [...prev, ...valid.filter((v) => !seen.has(v.filename))];
        });
      }
    }

    setIsProcessing(false);
  }, []);

  const clear = useCallback(() => {
    setImages([]);
    setProgress(0);
  }, []);

  const loadDemo = useCallback(() => {
    // Synchronous — canvas operations don't need async
    const demos = generateDemoImages();
    setImages(demos);
    setProgress(0);
  }, []);

  return { images, isProcessing, progress, addFiles, clear, loadDemo };
}
