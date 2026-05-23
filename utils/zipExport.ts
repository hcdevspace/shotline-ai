// ZIP export utility — packages all non-rejected photos into a downloadable archive.
// Uses JSZip (to be installed) to build a flat ZIP in the browser.
// Called by the ExportButton component on the Results page.
// Filenames are preserved from the original File objects.

import { Photo, getFinalTier } from "@/lib/types";

// TODO: install jszip and uncomment
// import JSZip from "jszip";
// import { saveAs } from "file-saver";  // or use URL.createObjectURL

export async function exportPhotos(photos: Photo[]): Promise<void> {
  const toExport = photos.filter((p) => getFinalTier(p) !== "reject");

  if (toExport.length === 0) {
    alert("No photos to export — all photos have been rejected.");
    return;
  }

  // TODO: implement real JSZip export
  // const zip = new JSZip();
  // for (const photo of toExport) {
  //   const buffer = await photo.file.arrayBuffer();
  //   zip.file(photo.file.name, buffer);
  // }
  // const blob = await zip.generateAsync({ type: "blob" });
  // saveAs(blob, "shotlineai-export.zip");

  console.log(`[zipExport] Would export ${toExport.length} photos (JSZip not yet wired up)`);
}
