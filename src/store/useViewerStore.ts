import { create } from 'zustand'

export interface CameraView {
  name: string
  position: [number, number, number]
  target: [number, number, number]
}

export const PRESET_VIEWS: Record<string, CameraView> = {
  front: { name: 'Front', position: [0, 2, 8], target: [0, 0, 0] },
  back: { name: 'Back', position: [0, 2, -8], target: [0, 0, 0] },
  left: { name: 'Left', position: [-8, 2, 0], target: [0, 0, 0] },
  right: { name: 'Right', position: [8, 2, 0], target: [0, 0, 0] },
  top: { name: 'Top', position: [0, 10, 0.01], target: [0, 0, 0] },
  isometric: { name: 'Isometric', position: [5, 5, 5], target: [0, 0, 0] },
}

interface ViewerState {
  // Camera
  autoRotate: boolean
  autoRotateSpeed: number
  setAutoRotate: (enabled: boolean) => void
  setAutoRotateSpeed: (speed: number) => void

  // Zoom
  zoomLevel: number
  setZoomLevel: (level: number) => void

  // Display modes
  wireframe: boolean
  setWireframe: (enabled: boolean) => void
  transparent: boolean
  setTransparent: (enabled: boolean) => void

  // View
  currentView: string | null
  setCurrentView: (view: string | null) => void
  customViews: CameraView[]
  addCustomView: (view: CameraView) => void
  removeCustomView: (name: string) => void

  // Accessibility
  reduceMotion: boolean
  setReduceMotion: (enabled: boolean) => void
  highContrast: boolean
  setHighContrast: (enabled: boolean) => void

  // Help
  showShortcuts: boolean
  setShowShortcuts: (show: boolean) => void
}

export const useViewerStore = create<ViewerState>((set, get) => ({
  // Camera
  autoRotate: true,
  autoRotateSpeed: 0.5,
  setAutoRotate: (enabled) => set({ autoRotate: enabled }),
  setAutoRotateSpeed: (speed) => set({ autoRotateSpeed: speed }),

  // Zoom
  zoomLevel: 1,
  setZoomLevel: (level) => set({ zoomLevel: Math.max(0.1, Math.min(3, level)) }),

  // Display modes
  wireframe: false,
  setWireframe: (enabled) => set({ wireframe: enabled }),
  transparent: false,
  setTransparent: (enabled) => set({ transparent: enabled }),

  // View
  currentView: 'isometric',
  setCurrentView: (view) => set({ currentView: view }),
  customViews: [],
  addCustomView: (view) => {
    const { customViews } = get()
    set({ customViews: [...customViews, view] })
  },
  removeCustomView: (name) => {
    const { customViews } = get()
    set({ customViews: customViews.filter((v) => v.name !== name) })
  },

  // Accessibility
  reduceMotion: false,
  setReduceMotion: (enabled) => set({ reduceMotion: enabled }),
  highContrast: false,
  setHighContrast: (enabled) => set({ highContrast: enabled }),

  // Help
  showShortcuts: false,
  setShowShortcuts: (show) => set({ showShortcuts: show }),
}))
