// Config storage utility - uses localStorage for small JSON config data
// Large binary files (models, videos) go to R2

const CONFIG_KEY = 'building-viewer-config'

// Marker Types
export type MarkerType = 'info' | 'hotspot' | 'link' | 'gallery'

// Marker Sizes
export type MarkerSize = 'small' | 'medium' | 'large'

// Animation Types
export type MarkerAnimation = 'pulse' | 'bounce' | 'rotate' | 'glow' | 'none'

// Marker Icon Types
export type MarkerIcon =
  | 'skull'
  | 'fire'
  | 'scroll'
  | 'candle'
  | 'lotus'
  | 'om'
  | 'eye'
  | 'moon'
  | 'star'
  | 'crystal'
  | 'potion'
  | 'book'
  | 'key'
  | 'compass'
  | 'none'

// Marker Group
export interface MarkerGroup {
  id: string
  name: string
  color: string
  visible: boolean
}

export interface MarkerConfig {
  id: string
  position: [number, number, number]
  title: string
  description?: string

  // Type-specific content
  type: MarkerType
  videoUrl?: string
  videoKey?: string // R2 object key for uploaded video
  linkUrl?: string // For link type
  galleryImages?: string[] // For gallery type

  // Styling
  color?: string
  size?: MarkerSize
  icon?: MarkerIcon // Predefined icon type
  customIconUrl?: string // Custom icon URL (legacy)

  // Animation
  animation?: MarkerAnimation
  animationSpeed?: number // 0.5 - 2.0
  glowIntensity?: number // 0 - 1
  animateOnHover?: boolean // Only animate on hover vs always

  // Grouping
  groupId?: string

  // Tour
  tourOrder?: number // Order in guided tour
  connectedTo?: string[] // IDs of connected markers
}

export interface BuildingConfig {
  title?: string // Display title for the viewer
  modelUrl: string
  modelKey?: string // R2 object key for uploaded model
  scale: number
  position: [number, number, number]
  rotation: [number, number, number]
  markers: MarkerConfig[]
  markerGroups?: MarkerGroup[]
}

export function saveConfig(config: BuildingConfig): void {
  localStorage.setItem(CONFIG_KEY, JSON.stringify(config))
}

// Hardcoded values that should always be used
const HARDCODED_MODEL_URL = 'https://pub-d91108a6d61c4699bbf1f5aa4cbe6572.r2.dev/models/building.glb'
const HARDCODED_VIDEO_URL = 'https://pub-d91108a6d61c4699bbf1f5aa4cbe6572.r2.dev/videos/sacred-video.mp4'

// Default icons for known marker IDs
const DEFAULT_MARKER_ICONS: Record<string, MarkerIcon> = {
  lobby: 'compass',
  office: 'book',
  rooftop: 'star',
}

export function loadConfig(): BuildingConfig | null {
  const data = localStorage.getItem(CONFIG_KEY)
  if (!data) return null

  const config = JSON.parse(data) as BuildingConfig
  // Always override with hardcoded values
  config.modelUrl = HARDCODED_MODEL_URL
  // Update all marker videos to use hardcoded video and add default icons if missing
  config.markers = config.markers.map(m => ({
    ...m,
    videoUrl: HARDCODED_VIDEO_URL,
    icon: m.icon || DEFAULT_MARKER_ICONS[m.id] || 'compass',
  }))
  return config
}

export function clearConfig(): void {
  localStorage.removeItem(CONFIG_KEY)
}

export function exportConfig(config: BuildingConfig): void {
  const blob = new Blob([JSON.stringify(config, null, 2)], { type: 'application/json' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = 'building-config.json'
  a.click()
  URL.revokeObjectURL(url)
}

export async function importConfig(file: File): Promise<BuildingConfig> {
  const text = await file.text()
  return JSON.parse(text)
}
