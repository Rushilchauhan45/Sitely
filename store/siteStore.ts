// ============================================================
// 🏪 SITE STORE — Zustand state for site management
// ============================================================

import { create } from 'zustand';
import type { Site, Worker, Material, PhotoGroup, SitePhoto } from '../lib/types';

interface SiteState {
  // Current active site
  currentSite: Site | null;
  sites: Site[];
  workers: Worker[];
  materials: Material[];
  photoGroups: PhotoGroup[];
  photos: SitePhoto[];

  // Loading states
  isLoadingSites: boolean;
  isLoadingWorkers: boolean;
  isLoadingMaterials: boolean;

  // Actions
  setCurrentSite: (site: Site | null) => void;
  setSites: (sites: Site[]) => void;
  addSite: (site: Site) => void;
  removeSite: (siteId: string) => void;
  setWorkers: (workers: Worker[]) => void;
  addWorker: (worker: Worker) => void;
  removeWorker: (workerId: string) => void;
  setMaterials: (materials: Material[]) => void;
  addMaterial: (material: Material) => void;
  setPhotoGroups: (groups: PhotoGroup[]) => void;
  setPhotos: (photos: SitePhoto[]) => void;
  setLoadingSites: (loading: boolean) => void;
  setLoadingWorkers: (loading: boolean) => void;
  setLoadingMaterials: (loading: boolean) => void;
  reset: () => void;
}

const initialState = {
  currentSite: null,
  sites: [],
  workers: [],
  materials: [],
  photoGroups: [],
  photos: [],
  isLoadingSites: false,
  isLoadingWorkers: false,
  isLoadingMaterials: false,
};

export const useSiteStore = create<SiteState>((set) => ({
  ...initialState,

  setCurrentSite: (currentSite) => set({ currentSite }),

  setSites: (sites) => set({ sites }),

  addSite: (site) =>
    set((state) => ({
      sites: [site, ...state.sites],
    })),

  removeSite: (siteId) =>
    set((state) => ({
      sites: state.sites.filter((s) => s.id !== siteId),
    })),

  setWorkers: (workers) => set({ workers }),

  addWorker: (worker) =>
    set((state) => ({
      workers: [...state.workers, worker],
    })),

  removeWorker: (workerId) =>
    set((state) => ({
      workers: state.workers.filter((w) => w.id !== workerId),
    })),

  setMaterials: (materials) => set({ materials }),

  addMaterial: (material) =>
    set((state) => ({
      materials: [...state.materials, material],
    })),

  setPhotoGroups: (photoGroups) => set({ photoGroups }),

  setPhotos: (photos) => set({ photos }),

  setLoadingSites: (isLoadingSites) => set({ isLoadingSites }),
  setLoadingWorkers: (isLoadingWorkers) => set({ isLoadingWorkers }),
  setLoadingMaterials: (isLoadingMaterials) => set({ isLoadingMaterials }),

  reset: () => set(initialState),
}));
