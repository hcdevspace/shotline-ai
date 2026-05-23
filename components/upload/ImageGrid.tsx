// ImageGrid — responsive thumbnail grid shown on the Upload page after staging.
// Thumbnails target ~120px via auto-fill grid. Stagger animation resets per
// batch of 10 so newly appended chunks animate naturally without long delays.
// Hover reveals the filename in a dim overlay.

import { UploadedImage } from "@/hooks/useUpload";

interface Props {
  images: UploadedImage[];
}

export default function ImageGrid({ images }: Props) {
  if (images.length === 0) return null;

  return (
    <div
      className="w-full"
      style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(110px, 1fr))", gap: "8px" }}
    >
      {images.map((img, i) => (
        <div
          key={img.id}
          title={img.filename}
          className="group relative aspect-square rounded-lg overflow-hidden border border-edge bg-elevated animate-card-in"
          style={{
            // Stagger resets every 10 items so new batches feel snappy
            animationDelay: `${(i % 10) * 30}ms`,
            animationFillMode: "both",
          }}
        >
          <img
            src={img.base64}
            alt={img.filename}
            className="w-full h-full object-cover"
          />

          {/* Filename overlay on hover */}
          <div className="absolute inset-0 bg-canvas/75 opacity-0 group-hover:opacity-100 transition-opacity duration-150 flex items-end p-1.5">
            <span className="text-[9px] font-mono text-mid leading-none truncate w-full">
              {img.filename}
            </span>
          </div>
        </div>
      ))}
    </div>
  );
}
