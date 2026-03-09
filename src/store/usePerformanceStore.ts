import { create } from 'zustand'
import { persist } from 'zustand/middleware'

export type QualityPreset = 'low' | 'medium' | 'high' | 'ultra'

export interface PerformanceSettings {
  // Quality preset
  qualityPreset: QualityPreset

  // Individual settings
  pixelRatio: number
  shadowQuality: 'off' | 'low' | 'medium' | 'high'
  textureResolution: 'low' | 'medium' | 'high'
  antialias: boolean

  // LOD settings
  lodEnabled: boolean
  lodDistance: number

  // Progressive loading
  progressiveLoading: boolean

  // Debug
  showFps: boolean
}

interface DeviceCapability {
  tier: 'low' | 'medium' | 'high'
  gpu: string
  cores: number
  memory: number
}

interface PerformanceState extends PerformanceSettings {
  // Device info
  deviceCapability: DeviceCapability | null
  autoDetected: boolean

  // Actions
  setQualityPreset: (preset: QualityPreset) => void
  setPixelRatio: (ratio: number) => void
  setShadowQuality: (quality: 'off' | 'low' | 'medium' | 'high') => void
  setTextureResolution: (resolution: 'low' | 'medium' | 'high') => void
  setAntialias: (enabled: boolean) => void
  setLodEnabled: (enabled: boolean) => void
  setLodDistance: (distance: number) => void
  setProgressiveLoading: (enabled: boolean) => void
  setShowFps: (show: boolean) => void

  // Auto-detect
  detectDeviceCapability: () => void
  applyAutoSettings: () => void
}

const QUALITY_PRESETS: Record<QualityPreset, Omit<PerformanceSettings, 'qualityPreset' | 'showFps'>> = {
  low: {
    pixelRatio: 1,
    shadowQuality: 'off',
    textureResolution: 'low',
    antialias: false,
    lodEnabled: true,
    lodDistance: 5,
    progressiveLoading: true,
  },
  medium: {
    pixelRatio: 1.5,
    shadowQuality: 'low',
    textureResolution: 'medium',
    antialias: true,
    lodEnabled: true,
    lodDistance: 10,
    progressiveLoading: true,
  },
  high: {
    pixelRatio: 2,
    shadowQuality: 'medium',
    textureResolution: 'high',
    antialias: true,
    lodEnabled: true,
    lodDistance: 20,
    progressiveLoading: false,
  },
  ultra: {
    pixelRatio: 2,
    shadowQuality: 'high',
    textureResolution: 'high',
    antialias: true,
    lodEnabled: false,
    lodDistance: 50,
    progressiveLoading: false,
  },
}

function detectGPUTier(): DeviceCapability {
  const canvas = document.createElement('canvas')
  const gl = canvas.getContext('webgl') || canvas.getContext('experimental-webgl')

  let gpu = 'Unknown'
  if (gl) {
    const debugInfo = (gl as WebGLRenderingContext).getExtension('WEBGL_debug_renderer_info')
    if (debugInfo) {
      gpu = (gl as WebGLRenderingContext).getParameter(debugInfo.UNMASKED_RENDERER_WEBGL) || 'Unknown'
    }
  }

  const cores = navigator.hardwareConcurrency || 4
  const memory = (navigator as Navigator & { deviceMemory?: number }).deviceMemory || 4

  // Determine tier based on hardware
  let tier: 'low' | 'medium' | 'high' = 'medium'

  // Check for low-end indicators
  const isLowEnd =
    cores <= 2 ||
    memory <= 2 ||
    /Mali|Adreno [23]|PowerVR|Intel HD [45]/i.test(gpu)

  // Check for high-end indicators
  const isHighEnd =
    cores >= 8 &&
    memory >= 8 &&
    /RTX|RX [567]|Radeon Pro|Apple M[123]|NVIDIA.*[34]0[678]0/i.test(gpu)

  if (isLowEnd) tier = 'low'
  else if (isHighEnd) tier = 'high'

  return { tier, gpu, cores, memory }
}

export const usePerformanceStore = create<PerformanceState>()(
  persist(
    (set, get) => ({
      // Default settings (medium)
      qualityPreset: 'medium',
      pixelRatio: 1.5,
      shadowQuality: 'medium',
      textureResolution: 'medium',
      antialias: true,
      lodEnabled: true,
      lodDistance: 10,
      progressiveLoading: true,
      showFps: false,

      // Device info
      deviceCapability: null,
      autoDetected: false,

      // Actions
      setQualityPreset: (preset) => {
        const settings = QUALITY_PRESETS[preset]
        set({
          qualityPreset: preset,
          ...settings,
        })
      },

      setPixelRatio: (ratio) => set({ pixelRatio: ratio }),
      setShadowQuality: (quality) => set({ shadowQuality: quality }),
      setTextureResolution: (resolution) => set({ textureResolution: resolution }),
      setAntialias: (enabled) => set({ antialias: enabled }),
      setLodEnabled: (enabled) => set({ lodEnabled: enabled }),
      setLodDistance: (distance) => set({ lodDistance: distance }),
      setProgressiveLoading: (enabled) => set({ progressiveLoading: enabled }),
      setShowFps: (show) => set({ showFps: show }),

      detectDeviceCapability: () => {
        const capability = detectGPUTier()
        set({ deviceCapability: capability })
      },

      applyAutoSettings: () => {
        const { deviceCapability } = get()
        if (!deviceCapability) {
          get().detectDeviceCapability()
        }

        const capability = get().deviceCapability
        if (capability) {
          const presetMap: Record<string, QualityPreset> = {
            low: 'low',
            medium: 'medium',
            high: 'high',
          }
          const preset = presetMap[capability.tier] || 'medium'
          get().setQualityPreset(preset)
          set({ autoDetected: true })
        }
      },
    }),
    {
      name: 'performance-settings',
      partialize: (state) => ({
        qualityPreset: state.qualityPreset,
        pixelRatio: state.pixelRatio,
        shadowQuality: state.shadowQuality,
        textureResolution: state.textureResolution,
        antialias: state.antialias,
        lodEnabled: state.lodEnabled,
        lodDistance: state.lodDistance,
        progressiveLoading: state.progressiveLoading,
        showFps: state.showFps,
        autoDetected: state.autoDetected,
      }),
    }
  )
)
