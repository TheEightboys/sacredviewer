import { create } from 'zustand'
import { useStore } from './useStore'

export type TransitionType = 'fly' | 'fade' | 'instant' | 'orbit'

export interface TourStop {
  markerId: string
  duration: number // seconds to stay at this stop
  transition: TransitionType
  narrationUrl?: string
  autoPlayVideo: boolean
  cameraDistance?: number // custom zoom distance
  cameraAngle?: [number, number] // azimuth, polar angles
}

export interface TourConfig {
  id: string
  name: string
  description?: string
  stops: TourStop[]
  loop: boolean
  autoStart: boolean
  showProgress: boolean
  transitionDuration: number // ms for camera transitions
}

interface TourState {
  // Tour configs
  tours: TourConfig[]
  activeTourId: string | null

  // Playback state
  isPlaying: boolean
  isPaused: boolean
  currentStopIndex: number
  stopProgress: number // 0-1 progress within current stop
  isTransitioning: boolean

  // Presentation mode
  presentationMode: boolean
  showLaserPointer: boolean
  laserPosition: { x: number; y: number } | null

  // Timer
  showTimer: boolean
  timerDuration: number // seconds
  timerRemaining: number

  // Actions - Tour management
  createTour: (name: string) => TourConfig
  updateTour: (id: string, updates: Partial<TourConfig>) => void
  deleteTour: (id: string) => void
  duplicateTour: (id: string) => TourConfig | null

  // Actions - Tour stops
  addStop: (tourId: string, markerId: string) => void
  updateStop: (tourId: string, stopIndex: number, updates: Partial<TourStop>) => void
  removeStop: (tourId: string, stopIndex: number) => void
  reorderStops: (tourId: string, fromIndex: number, toIndex: number) => void

  // Actions - Playback
  setActiveTour: (tourId: string | null) => void
  play: () => void
  pause: () => void
  stop: () => void
  nextStop: () => void
  prevStop: () => void
  goToStop: (index: number) => void
  setStopProgress: (progress: number) => void
  setIsTransitioning: (transitioning: boolean) => void

  // Actions - Presentation
  enterPresentationMode: () => void
  exitPresentationMode: () => void
  toggleLaserPointer: () => void
  setLaserPosition: (pos: { x: number; y: number } | null) => void

  // Actions - Timer
  setShowTimer: (show: boolean) => void
  setTimerDuration: (seconds: number) => void
  setTimerRemaining: (seconds: number) => void

  // Getters
  getActiveTour: () => TourConfig | null
  getCurrentStop: () => TourStop | null
  getTourMarkers: () => string[]
}

const DEFAULT_STOP: Omit<TourStop, 'markerId'> = {
  duration: 5,
  transition: 'fly',
  autoPlayVideo: true,
}

const STORAGE_KEY = 'building-viewer-tours'

function loadTours(): TourConfig[] {
  try {
    const data = localStorage.getItem(STORAGE_KEY)
    return data ? JSON.parse(data) : []
  } catch {
    return []
  }
}

function saveTours(tours: TourConfig[]) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(tours))
}

export const useTourStore = create<TourState>((set, get) => ({
  // Initial state
  tours: loadTours(),
  activeTourId: null,
  isPlaying: false,
  isPaused: false,
  currentStopIndex: 0,
  stopProgress: 0,
  isTransitioning: false,
  presentationMode: false,
  showLaserPointer: false,
  laserPosition: null,
  showTimer: false,
  timerDuration: 300, // 5 minutes default
  timerRemaining: 300,

  // Tour management
  createTour: (name) => {
    const newTour: TourConfig = {
      id: `tour-${Date.now()}`,
      name,
      stops: [],
      loop: false,
      autoStart: false,
      showProgress: true,
      transitionDuration: 1500,
    }
    const tours = [...get().tours, newTour]
    set({ tours })
    saveTours(tours)
    return newTour
  },

  updateTour: (id, updates) => {
    const tours = get().tours.map((t) =>
      t.id === id ? { ...t, ...updates } : t
    )
    set({ tours })
    saveTours(tours)
  },

  deleteTour: (id) => {
    const tours = get().tours.filter((t) => t.id !== id)
    set({ tours, activeTourId: get().activeTourId === id ? null : get().activeTourId })
    saveTours(tours)
  },

  duplicateTour: (id) => {
    const tour = get().tours.find((t) => t.id === id)
    if (!tour) return null

    const newTour: TourConfig = {
      ...tour,
      id: `tour-${Date.now()}`,
      name: `${tour.name} (Copy)`,
    }
    const tours = [...get().tours, newTour]
    set({ tours })
    saveTours(tours)
    return newTour
  },

  // Tour stops
  addStop: (tourId, markerId) => {
    const tours = get().tours.map((t) => {
      if (t.id !== tourId) return t
      return {
        ...t,
        stops: [...t.stops, { ...DEFAULT_STOP, markerId }],
      }
    })
    set({ tours })
    saveTours(tours)
  },

  updateStop: (tourId, stopIndex, updates) => {
    const tours = get().tours.map((t) => {
      if (t.id !== tourId) return t
      return {
        ...t,
        stops: t.stops.map((s, i) => (i === stopIndex ? { ...s, ...updates } : s)),
      }
    })
    set({ tours })
    saveTours(tours)
  },

  removeStop: (tourId, stopIndex) => {
    const tours = get().tours.map((t) => {
      if (t.id !== tourId) return t
      return {
        ...t,
        stops: t.stops.filter((_, i) => i !== stopIndex),
      }
    })
    set({ tours })
    saveTours(tours)
  },

  reorderStops: (tourId, fromIndex, toIndex) => {
    const tours = get().tours.map((t) => {
      if (t.id !== tourId) return t
      const stops = [...t.stops]
      const [removed] = stops.splice(fromIndex, 1)
      if (removed) {
        stops.splice(toIndex, 0, removed)
      }
      return { ...t, stops }
    })
    set({ tours })
    saveTours(tours)
  },

  // Playback
  setActiveTour: (tourId) => {
    set({
      activeTourId: tourId,
      currentStopIndex: 0,
      stopProgress: 0,
      isPlaying: false,
      isPaused: false,
    })
  },

  play: () => {
    const tour = get().getActiveTour()
    if (!tour || tour.stops.length === 0) return

    set({ isPlaying: true, isPaused: false })

    // Select first marker
    const firstStop = tour.stops[0]
    if (firstStop) {
      useStore.getState().setSelectedMarker(firstStop.markerId)
    }
  },

  pause: () => set({ isPaused: true }),

  stop: () => {
    set({
      isPlaying: false,
      isPaused: false,
      currentStopIndex: 0,
      stopProgress: 0,
    })
    useStore.getState().setSelectedMarker(null)
  },

  nextStop: () => {
    const tour = get().getActiveTour()
    if (!tour) return

    const { currentStopIndex } = get()
    const nextIndex = currentStopIndex + 1

    if (nextIndex >= tour.stops.length) {
      if (tour.loop) {
        set({ currentStopIndex: 0, stopProgress: 0 })
        const firstStop = tour.stops[0]
        if (firstStop) {
          useStore.getState().setSelectedMarker(firstStop.markerId)
        }
      } else {
        get().stop()
      }
    } else {
      set({ currentStopIndex: nextIndex, stopProgress: 0 })
      const nextStop = tour.stops[nextIndex]
      if (nextStop) {
        useStore.getState().setSelectedMarker(nextStop.markerId)
      }
    }
  },

  prevStop: () => {
    const tour = get().getActiveTour()
    if (!tour) return

    const { currentStopIndex } = get()
    const prevIndex = currentStopIndex - 1

    if (prevIndex < 0) {
      if (tour.loop) {
        const lastIndex = tour.stops.length - 1
        set({ currentStopIndex: lastIndex, stopProgress: 0 })
        const lastStop = tour.stops[lastIndex]
        if (lastStop) {
          useStore.getState().setSelectedMarker(lastStop.markerId)
        }
      }
    } else {
      set({ currentStopIndex: prevIndex, stopProgress: 0 })
      const prevStopData = tour.stops[prevIndex]
      if (prevStopData) {
        useStore.getState().setSelectedMarker(prevStopData.markerId)
      }
    }
  },

  goToStop: (index) => {
    const tour = get().getActiveTour()
    if (!tour || index < 0 || index >= tour.stops.length) return

    set({ currentStopIndex: index, stopProgress: 0 })
    const stop = tour.stops[index]
    if (stop) {
      useStore.getState().setSelectedMarker(stop.markerId)
    }
  },

  setStopProgress: (progress) => set({ stopProgress: progress }),
  setIsTransitioning: (transitioning) => set({ isTransitioning: transitioning }),

  // Presentation
  enterPresentationMode: () => {
    set({ presentationMode: true })
    // Request fullscreen
    document.documentElement.requestFullscreen?.()
  },

  exitPresentationMode: () => {
    set({ presentationMode: false, showLaserPointer: false, laserPosition: null })
    document.exitFullscreen?.()
  },

  toggleLaserPointer: () => set((state) => ({ showLaserPointer: !state.showLaserPointer })),
  setLaserPosition: (pos) => set({ laserPosition: pos }),

  // Timer
  setShowTimer: (show) => set({ showTimer: show }),
  setTimerDuration: (seconds) => set({ timerDuration: seconds, timerRemaining: seconds }),
  setTimerRemaining: (seconds) => set({ timerRemaining: seconds }),

  // Getters
  getActiveTour: () => {
    const { tours, activeTourId } = get()
    return tours.find((t) => t.id === activeTourId) || null
  },

  getCurrentStop: () => {
    const tour = get().getActiveTour()
    if (!tour) return null
    return tour.stops[get().currentStopIndex] || null
  },

  getTourMarkers: () => {
    const tour = get().getActiveTour()
    if (!tour) return []
    return tour.stops.map((s) => s.markerId)
  },
}))
