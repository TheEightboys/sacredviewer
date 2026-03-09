import { create } from 'zustand'
import { MarkerConfig } from '../utils/configStorage'

interface MarkerPlacementState {
  // Preview position when hovering over model
  previewPosition: [number, number, number] | null
  setPreviewPosition: (pos: [number, number, number] | null) => void

  // New marker being created
  newMarker: MarkerConfig | null
  newMarkerPosition: [number, number, number] | null
  startNewMarker: (position: [number, number, number]) => void
  clearNewMarker: () => void

  // Marker being edited
  editingMarkerId: string | null
  setEditingMarkerId: (id: string | null) => void

  // Marker being dragged
  draggingMarkerId: string | null
  setDraggingMarkerId: (id: string | null) => void
}

export const useMarkerPlacementStore = create<MarkerPlacementState>((set) => ({
  previewPosition: null,
  setPreviewPosition: (pos) => set({ previewPosition: pos }),

  newMarker: null,
  newMarkerPosition: null,
  startNewMarker: (position) => {
    const markerId = `marker-${Date.now()}`
    set({
      newMarker: {
        id: markerId,
        position,
        title: '',
        description: '',
        type: 'info',
        color: '#3b82f6',
        size: 'medium',
        animation: 'pulse',
        animationSpeed: 1,
        glowIntensity: 0.5,
      },
      newMarkerPosition: position,
      previewPosition: null,
    })
  },
  clearNewMarker: () => set({ newMarker: null, newMarkerPosition: null }),

  editingMarkerId: null,
  setEditingMarkerId: (id) => set({ editingMarkerId: id }),

  draggingMarkerId: null,
  setDraggingMarkerId: (id) => set({ draggingMarkerId: id }),
}))
