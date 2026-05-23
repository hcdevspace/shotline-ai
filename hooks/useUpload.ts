// useUpload hook — handles file selection from the DropZone.
// Validates file types (image/jpeg, image/png, image/webp) and count (10–200).
// Creates preview URLs via URL.createObjectURL and builds the initial Photo[]
// array with id, file, previewUrl, and clientFiltered=false.
// Writes the photo array into the Zustand store and returns navigation helpers.

import { useCallback } from "react";
import { useRouter } from "next/navigation";
import { usePhotoStore } from "@/lib/store";
import { Photo } from "@/lib/types";

const ACCEPTED_TYPES = ["image/jpeg", "image/png", "image/webp"];
const MIN_FILES = 10;
const MAX_FILES = 200;

export interface UploadValidationError {
  type: "too_few" | "too_many" | "invalid_type";
  message: string;
}

export function useUpload() {
  const router = useRouter();
  const { setPhotos, reset } = usePhotoStore();

  const handleFiles = useCallback(
    (files: FileList | File[]): UploadValidationError | null => {
      const arr = Array.from(files).filter((f) => ACCEPTED_TYPES.includes(f.type));

      if (arr.length < MIN_FILES) {
        return { type: "too_few", message: `Please select at least ${MIN_FILES} images.` };
      }
      if (arr.length > MAX_FILES) {
        return { type: "too_many", message: `Maximum ${MAX_FILES} images. You selected ${arr.length}.` };
      }

      // TODO: build real Photo[] and write to store
      // const photos: Photo[] = arr.map((file) => ({
      //   id: crypto.randomUUID(),
      //   file,
      //   previewUrl: URL.createObjectURL(file),
      //   clientFiltered: false,
      // }));
      // reset();
      // setPhotos(photos);
      // router.push("/processing");

      console.log(`[useUpload] Accepted ${arr.length} files — store wiring TODO`);
      router.push("/processing");
      return null;
    },
    [router, setPhotos, reset]
  );

  return { handleFiles };
}
