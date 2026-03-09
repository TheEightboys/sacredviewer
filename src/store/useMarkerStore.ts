import { create } from 'zustand'
import { useAdminStore } from './useAdminStore'
import { MarkerGroup } from '../utils/configStorage'

interface MarkerStoreState {
  // Group visibility
  hiddenGroups: Set<string>
  toggleGroupVisibility: (groupId: string) => void
  isGroupVisible: (groupId: string) => boolean

  // Group filter
  activeGroupFilter: string | null
  setActiveGroupFilter: (groupId: string | null) => void

  // Tour mode
  tourMode: boolean
  tourIndex: number
  setTourMode: (enabled: boolean) => void
  nextTourMarker: () => void
  prevTourMarker: () => void
  goToTourMarker: (index: number) => void
  getTourMarkers: () => string[]

  // Connections
  showConnections: boolean
  setShowConnections: (show: boolean) => void

  // Groups management
  addGroup: (group: MarkerGroup) => void
  updateGroup: (id: string, updates: Partial<MarkerGroup>) => void
  removeGroup: (id: string) => void
  getGroups: () => MarkerGroup[]
}

export const useMarkerStore = create<MarkerStoreState>((set, get) => ({
  // Group visibility
  hiddenGroups: new Set(),
  toggleGroupVisibility: (groupId) => {
    set((state) => {
      const newHidden = new Set(state.hiddenGroups)
      if (newHidden.has(groupId)) {
        newHidden.delete(groupId)
      } else {
        newHidden.add(groupId)
      }
      return { hiddenGroups: newHidden }
    })
  },
  isGroupVisible: (groupId) => {
    return !get().hiddenGroups.has(groupId)
  },

  // Group filter
  activeGroupFilter: null,
  setActiveGroupFilter: (groupId) => set({ activeGroupFilter: groupId }),

  // Tour mode
  tourMode: false,
  tourIndex: 0,
  setTourMode: (enabled) => set({ tourMode: enabled, tourIndex: 0 }),
  nextTourMarker: () => {
    const { tourIndex, getTourMarkers } = get()
    const markers = getTourMarkers()
    if (markers.length === 0) return
    const nextIndex = (tourIndex + 1) % markers.length
    set({ tourIndex: nextIndex })
  },
  prevTourMarker: () => {
    const { tourIndex, getTourMarkers } = get()
    const markers = getTourMarkers()
    if (markers.length === 0) return
    const prevIndex = (tourIndex - 1 + markers.length) % markers.length
    set({ tourIndex: prevIndex })
  },
  goToTourMarker: (index) => set({ tourIndex: index }),
  getTourMarkers: () => {
    const config = useAdminStore.getState().config
    return config.markers
      .filter((m) => m.tourOrder !== undefined)
      .sort((a, b) => (a.tourOrder || 0) - (b.tourOrder || 0))
      .map((m) => m.id)
  },

  // Connections
  showConnections: true,
  setShowConnections: (show) => set({ showConnections: show }),

  // Groups management
  addGroup: (group) => {
    const adminStore = useAdminStore.getState()
    const config = adminStore.config
    adminStore.setConfig({
      ...config,
      markerGroups: [...(config.markerGroups || []), group],
    })
  },
  updateGroup: (id, updates) => {
    const adminStore = useAdminStore.getState()
    const config = adminStore.config
    adminStore.setConfig({
      ...config,
      markerGroups: (config.markerGroups || []).map((g) =>
        g.id === id ? { ...g, ...updates } : g
      ),
    })
  },
  removeGroup: (id) => {
    const adminStore = useAdminStore.getState()
    const config = adminStore.config
    adminStore.setConfig({
      ...config,
      markerGroups: (config.markerGroups || []).filter((g) => g.id !== id),
      // Remove group from markers
      markers: config.markers.map((m) =>
        m.groupId === id ? { ...m, groupId: undefined } : m
      ),
    })
  },
  getGroups: () => {
    return useAdminStore.getState().config.markerGroups || []
  },
}))
