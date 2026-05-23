// Zustand store — the single in-memory state for the entire session.
// Persists photo data across page navigations (Upload → Processing → Results).
// No localStorage/IndexedDB: photos are sensitive and cleared on tab close.
// Will be imported by useUpload and usePhotoAnalysis hooks.

import { create } from "zustand";
import { Photo, Tier } from "./types";

type ProcessingStatus = "idle" | "preprocessing" | "analyzing" | "done" | "error";

interface PhotoStore {
  photos: Photo[];
  status: ProcessingStatus;
  processedCount: number;   // how many have received AI results

  // Actions
  setPhotos: (photos: Photo[]) => void;
  setStatus: (status: ProcessingStatus) => void;
  updatePhoto: (id: string, patch: Partial<Photo>) => void;
  setUserTier: (id: string, tier: Tier) => void;
  incrementProcessed: () => void;
  reset: () => void;
}

export const usePhotoStore = create<PhotoStore>((set) => ({
  photos: [],
  status: "idle",
  processedCount: 0,

  setPhotos: (photos) => set({ photos }),

  setStatus: (status) => set({ status }),

  updatePhoto: (id, patch) =>
    set((state) => ({
      photos: state.photos.map((p) => (p.id === id ? { ...p, ...patch } : p)),
    })),

  setUserTier: (id, tier) =>
    set((state) => ({
      photos: state.photos.map((p) => (p.id === id ? { ...p, userTier: tier } : p)),
    })),

  incrementProcessed: () =>
    set((state) => ({ processedCount: state.processedCount + 1 })),

  reset: () => set({ photos: [], status: "idle", processedCount: 0 }),
}));
