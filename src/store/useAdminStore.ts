import { create } from 'zustand'
import {
  BuildingConfig,
  MarkerConfig,
  saveConfig,
  loadConfig,
} from '../utils/configStorage'
import { buildingConfig as defaultBuildingConfig } from '../config/buildingConfig'

const HARDCODED_MODEL_URL = 'https://pub-d91108a6d61c4699bbf1f5aa4cbe6572.r2.dev/models/building.glb'
const HARDCODED_VIDEO_URL = 'https://pub-d91108a6d61c4699bbf1f5aa4cbe6572.r2.dev/videos/sacred-video.mp4'

// Map marker IDs to appropriate mystical icons
const MARKER_ICON_MAP: Record<string, 'skull' | 'fire' | 'scroll' | 'candle' | 'lotus' | 'om' | 'eye' | 'moon' | 'star' | 'crystal' | 'potion' | 'book' | 'key' | 'compass'> = {
  lobby: 'compass',
  office: 'book',
  rooftop: 'star',
}

const DEFAULT_CONFIG: BuildingConfig = {
  modelUrl: HARDCODED_MODEL_URL,
  modelKey: undefined,
  scale: 1,
  position: [0, 0, 0],
  rotation: [0, 0, 0],
  markers: defaultBuildingConfig.markers.map((m) => ({
    id: m.id,
    position: m.position,
    title: m.title,
    description: m.description,
    videoUrl: HARDCODED_VIDEO_URL,
    type: 'info' as const,
    icon: MARKER_ICON_MAP[m.id] || 'compass',
  })),
}

interface AdminState {
  isEditMode: boolean
  toggleEditMode: () => void
  setEditMode: (enabled: boolean) => void

  config: BuildingConfig
  setConfig: (config: BuildingConfig) => void
  updateConfig: (partial: Partial<BuildingConfig>) => void

  // Model controls
  setModelUrl: (url: string, key?: string) => void
  setScale: (scale: number) => void
  setPosition: (position: [number, number, number]) => void
  setRotation: (rotation: [number, number, number]) => void

  // Marker controls
  addMarker: (marker: MarkerConfig) => void
  updateMarker: (id: string, updates: Partial<MarkerConfig>) => void
  removeMarker: (id: string) => void

  // Persistence
  saveToStorage: () => void
  loadFromStorage: () => void
  resetToDefault: () => void
}

export const useAdminStore = create<AdminState>((set, get) => ({
  isEditMode: false,
  toggleEditMode: () => set((state) => ({ isEditMode: !state.isEditMode })),
  setEditMode: (enabled) => set({ isEditMode: enabled }),

  config: loadConfig() || DEFAULT_CONFIG,
  setConfig: (config) => {
    set({ config })
    saveConfig(config)
  },
  updateConfig: (partial) => {
    const newConfig = { ...get().config, ...partial }
    set({ config: newConfig })
    saveConfig(newConfig)
  },

  // Model controls
  setModelUrl: (url, key) => {
    const { updateConfig } = get()
    updateConfig({ modelUrl: url, modelKey: key })
  },
  setScale: (scale) => {
    const { updateConfig } = get()
    updateConfig({ scale })
  },
  setPosition: (position) => {
    const { updateConfig } = get()
    updateConfig({ position })
  },
  setRotation: (rotation) => {
    const { updateConfig } = get()
    updateConfig({ rotation })
  },

  // Marker controls
  addMarker: (marker) => {
    const { config, updateConfig } = get()
    updateConfig({ markers: [...config.markers, marker] })
  },
  updateMarker: (id, updates) => {
    const { config, updateConfig } = get()
    const markers = config.markers.map((m) =>
      m.id === id ? { ...m, ...updates } : m
    )
    updateConfig({ markers })
  },
  removeMarker: (id) => {
    const { config, updateConfig } = get()
    const markers = config.markers.filter((m) => m.id !== id)
    updateConfig({ markers })
  },

  // Persistence
  saveToStorage: () => {
    const { config } = get()
    saveConfig(config)
  },
  loadFromStorage: () => {
    const loaded = loadConfig()
    if (loaded) {
      set({ config: loaded })
    }
  },
  resetToDefault: () => {
    set({ config: DEFAULT_CONFIG })
    saveConfig(DEFAULT_CONFIG)
  },
}))
