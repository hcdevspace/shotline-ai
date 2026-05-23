// Zustand store — single in-memory state for the entire session.
// Persists photo data across page navigations (Upload → Processing → Results).
// No localStorage/IndexedDB: photos are sensitive and cleared on tab close.

import { create } from "zustand";
import { Photo, Tier } from "./types";

export type ProcessingStatus = "idle" | "preprocessing" | "analyzing" | "done" | "error";

interface PhotoStore {
  photos: Photo[];
  status: ProcessingStatus;
  processedCount: number;   // photos that have received an AI result
  demoMode: boolean;        // true when API failed and local mock data was used

  setPhotos:          (photos: Photo[]) => void;
  setStatus:          (status: ProcessingStatus) => void;
  updatePhoto:        (id: string, patch: Partial<Photo>) => void;
  setUserTier:        (id: string, tier: Tier) => void;
  incrementProcessed: () => void;
  setDemoMode:        (v: boolean) => void;
  reset:              () => void;
}

export const usePhotoStore = create<PhotoStore>((set) => ({
  photos:         [],
  status:         "idle",
  processedCount: 0,
  demoMode:       false,

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

  setDemoMode: (v) => set({ demoMode: v }),

  reset: () => set({ photos: [], status: "idle", processedCount: 0, demoMode: false }),
}));
