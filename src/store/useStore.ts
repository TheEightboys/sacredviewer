import { create } from 'zustand'
import { useAdminStore } from './useAdminStore'

interface AppState {
  selectedMarker: string | null
  setSelectedMarker: (id: string | null) => void
  selectNextMarker: () => void
  selectPrevMarker: () => void
  isLoading: boolean
  setIsLoading: (loading: boolean) => void
}

// Helper to get marker IDs from admin store
const getMarkerIds = () => useAdminStore.getState().config.markers.map((m) => m.id)

export const useStore = create<AppState>((set, get) => ({
  selectedMarker: null,
  setSelectedMarker: (id) => set({ selectedMarker: id }),

  selectNextMarker: () => {
    const { selectedMarker } = get()
    const markerIds = getMarkerIds()
    if (selectedMarker === null) {
      // Select first marker if none selected
      set({ selectedMarker: markerIds[0] ?? null })
    } else {
      const currentIndex = markerIds.indexOf(selectedMarker)
      const nextIndex = (currentIndex + 1) % markerIds.length
      set({ selectedMarker: markerIds[nextIndex] ?? null })
    }
  },

  selectPrevMarker: () => {
    const { selectedMarker } = get()
    const markerIds = getMarkerIds()
    if (selectedMarker === null) {
      // Select last marker if none selected
      set({ selectedMarker: markerIds[markerIds.length - 1] ?? null })
    } else {
      const currentIndex = markerIds.indexOf(selectedMarker)
      const prevIndex = (currentIndex - 1 + markerIds.length) % markerIds.length
      set({ selectedMarker: markerIds[prevIndex] ?? null })
    }
  },

  isLoading: true,
  setIsLoading: (loading) => set({ isLoading: loading }),
}))
