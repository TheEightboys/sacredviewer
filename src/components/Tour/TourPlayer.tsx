import { useEffect, useRef, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useTourStore } from '../../store/useTourStore'
import { useAdminStore } from '../../store/useAdminStore'

interface TourPlayerProps {
  onNavigateToMarker: (markerId: string, transition: string, duration: number) => void
}

export function TourPlayer({ onNavigateToMarker }: TourPlayerProps) {
  const {
    isPlaying,
    isPaused,
    currentStopIndex,
    stopProgress,
    presentationMode,
    getActiveTour,
    getCurrentStop,
    play,
    pause,
    stop,
    nextStop,
    prevStop,
    goToStop,
    setStopProgress,
    setIsTransitioning,
  } = useTourStore()

  const markers = useAdminStore((state) => state.config.markers)
  const tour = getActiveTour()
  const currentStop = getCurrentStop()

  const timerRef = useRef<number | null>(null)
  const lastTimeRef = useRef<number>(0)

  // Get marker title
  const getMarkerTitle = useCallback(
    (markerId: string) => {
      return markers.find((m) => m.id === markerId)?.title || 'Untitled'
    },
    [markers]
  )

  // Navigate to marker when stop changes
  useEffect(() => {
    if (!currentStop || !tour) return

    const marker = markers.find((m) => m.id === currentStop.markerId)
    if (marker) {
      setIsTransitioning(true)
      onNavigateToMarker(currentStop.markerId, currentStop.transition, tour.transitionDuration)

      // Wait for transition to complete
      const transitionTimer = setTimeout(() => {
        setIsTransitioning(false)
      }, tour.transitionDuration)

      return () => clearTimeout(transitionTimer)
    }
  }, [currentStop?.markerId, tour?.transitionDuration])

  // Progress timer
  useEffect(() => {
    if (!isPlaying || isPaused || !currentStop) {
      if (timerRef.current) {
        cancelAnimationFrame(timerRef.current)
        timerRef.current = null
      }
      return
    }

    const duration = currentStop.duration * 1000 // Convert to ms

    const animate = (timestamp: number) => {
      if (!lastTimeRef.current) {
        lastTimeRef.current = timestamp
      }

      const elapsed = timestamp - lastTimeRef.current
      const newProgress = stopProgress + elapsed / duration

      if (newProgress >= 1) {
        setStopProgress(0)
        lastTimeRef.current = 0
        nextStop()
      } else {
        setStopProgress(newProgress)
        lastTimeRef.current = timestamp
        timerRef.current = requestAnimationFrame(animate)
      }
    }

    timerRef.current = requestAnimationFrame(animate)

    return () => {
      if (timerRef.current) {
        cancelAnimationFrame(timerRef.current)
      }
    }
  }, [isPlaying, isPaused, currentStop, stopProgress, nextStop, setStopProgress])

  // Reset timer when stop changes
  useEffect(() => {
    lastTimeRef.current = 0
  }, [currentStopIndex])

  // Keyboard controls
  useEffect(() => {
    if (!tour) return

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === ' ') {
        e.preventDefault()
        if (isPlaying && !isPaused) {
          pause()
        } else {
          play()
        }
      } else if (e.key === 'ArrowRight' || e.key === 'ArrowDown') {
        e.preventDefault()
        nextStop()
      } else if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') {
        e.preventDefault()
        prevStop()
      } else if (e.key === 'Escape') {
        e.preventDefault()
        stop()
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [tour, isPlaying, isPaused, play, pause, nextStop, prevStop, stop])

  if (!tour) return null

  const totalStops = tour.stops.length

  // Calculate total progress
  const totalProgress = totalStops > 0 ? (currentStopIndex + stopProgress) / totalStops : 0

  return (
    <AnimatePresence>
      {tour && (
        <motion.div
          initial={{ opacity: 0, y: 50 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 50 }}
          className={`fixed z-50 ${
            presentationMode
              ? 'bottom-8 left-1/2 -translate-x-1/2'
              : 'bottom-4 left-1/2 w-[calc(100%-2rem)] max-w-2xl -translate-x-1/2 sm:w-auto'
          }`}
        >
          <div
            className={`rounded-2xl shadow-2xl backdrop-blur-md ${
              presentationMode
                ? 'bg-black/80 px-8 py-6'
                : 'bg-slate-900/95 px-4 py-4 sm:px-6'
            }`}
          >
            {/* Tour Title & Progress */}
            <div className="mb-3 flex items-center justify-between gap-4">
              <div className="min-w-0 flex-1">
                <h3
                  className={`truncate font-semibold text-white ${
                    presentationMode ? 'text-xl' : 'text-sm sm:text-base'
                  }`}
                >
                  {tour.name}
                </h3>
                {currentStop && (
                  <p
                    className={`truncate text-slate-400 ${
                      presentationMode ? 'text-base' : 'text-xs sm:text-sm'
                    }`}
                  >
                    {getMarkerTitle(currentStop.markerId)}
                  </p>
                )}
              </div>
              <div className="text-right">
                <span
                  className={`font-medium text-white ${
                    presentationMode ? 'text-lg' : 'text-sm'
                  }`}
                >
                  {currentStopIndex + 1}
                </span>
                <span
                  className={`text-slate-500 ${presentationMode ? 'text-lg' : 'text-sm'}`}
                >
                  {' '}
                  / {totalStops}
                </span>
              </div>
            </div>

            {/* Progress Bar */}
            {tour.showProgress && (
              <div className="mb-4">
                <div className="relative h-1.5 overflow-hidden rounded-full bg-slate-700">
                  {/* Total Progress */}
                  <motion.div
                    className="absolute inset-y-0 left-0 rounded-full bg-emerald-500"
                    style={{ width: `${totalProgress * 100}%` }}
                    transition={{ duration: 0.1 }}
                  />
                  {/* Stop markers */}
                  <div className="absolute inset-0 flex">
                    {tour.stops.map((_, index) => (
                      <button
                        key={index}
                        onClick={() => goToStop(index)}
                        className="relative flex-1 transition-colors"
                        title={`Go to stop ${index + 1}`}
                      >
                        <div
                          className={`absolute right-0 top-1/2 h-3 w-0.5 -translate-y-1/2 transition-colors ${
                            index < totalStops - 1 ? 'bg-slate-600' : 'bg-transparent'
                          }`}
                        />
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* Controls */}
            <div className="flex items-center justify-center gap-2 sm:gap-3">
              {/* Previous */}
              <motion.button
                onClick={prevStop}
                className={`flex items-center justify-center rounded-full bg-slate-700 text-white transition-colors hover:bg-slate-600 ${
                  presentationMode ? 'h-12 w-12' : 'h-9 w-9 sm:h-10 sm:w-10'
                }`}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                disabled={totalStops <= 1}
              >
                <svg
                  className={presentationMode ? 'h-6 w-6' : 'h-4 w-4 sm:h-5 sm:w-5'}
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M15 19l-7-7 7-7"
                  />
                </svg>
              </motion.button>

              {/* Play/Pause */}
              <motion.button
                onClick={() => (isPlaying && !isPaused ? pause() : play())}
                className={`flex items-center justify-center rounded-full bg-emerald-600 text-white transition-colors hover:bg-emerald-500 ${
                  presentationMode ? 'h-16 w-16' : 'h-11 w-11 sm:h-12 sm:w-12'
                }`}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                {isPlaying && !isPaused ? (
                  <svg
                    className={presentationMode ? 'h-8 w-8' : 'h-5 w-5 sm:h-6 sm:w-6'}
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M10 9v6m4-6v6"
                    />
                  </svg>
                ) : (
                  <svg
                    className={presentationMode ? 'h-8 w-8' : 'h-5 w-5 sm:h-6 sm:w-6'}
                    fill="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path d="M8 5v14l11-7z" />
                  </svg>
                )}
              </motion.button>

              {/* Next */}
              <motion.button
                onClick={nextStop}
                className={`flex items-center justify-center rounded-full bg-slate-700 text-white transition-colors hover:bg-slate-600 ${
                  presentationMode ? 'h-12 w-12' : 'h-9 w-9 sm:h-10 sm:w-10'
                }`}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                disabled={totalStops <= 1}
              >
                <svg
                  className={presentationMode ? 'h-6 w-6' : 'h-4 w-4 sm:h-5 sm:w-5'}
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9 5l7 7-7 7"
                  />
                </svg>
              </motion.button>

              {/* Stop Button */}
              <motion.button
                onClick={stop}
                className={`ml-2 flex items-center justify-center rounded-full bg-slate-700 text-slate-400 transition-colors hover:bg-red-600/20 hover:text-red-400 ${
                  presentationMode ? 'h-10 w-10' : 'h-8 w-8'
                }`}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                title="Stop tour"
              >
                <svg
                  className={presentationMode ? 'h-5 w-5' : 'h-4 w-4'}
                  fill="currentColor"
                  viewBox="0 0 24 24"
                >
                  <rect x="6" y="6" width="12" height="12" rx="1" />
                </svg>
              </motion.button>
            </div>

            {/* Stop Dots */}
            {!presentationMode && totalStops <= 10 && (
              <div className="mt-3 flex justify-center gap-1.5">
                {tour.stops.map((_, index) => (
                  <motion.button
                    key={index}
                    onClick={() => goToStop(index)}
                    className={`h-2 w-2 rounded-full transition-colors ${
                      index === currentStopIndex
                        ? 'bg-emerald-500'
                        : index < currentStopIndex
                          ? 'bg-emerald-500/50'
                          : 'bg-slate-600 hover:bg-slate-500'
                    }`}
                    whileHover={{ scale: 1.3 }}
                    whileTap={{ scale: 0.9 }}
                  />
                ))}
              </div>
            )}

            {/* Keyboard Hint */}
            <div className="mt-3 hidden text-center text-xs text-slate-500 sm:block">
              <kbd className="rounded bg-slate-800 px-1.5 py-0.5">Space</kbd> Play/Pause
              {' | '}
              <kbd className="rounded bg-slate-800 px-1.5 py-0.5">Arrow Keys</kbd> Navigate
              {' | '}
              <kbd className="rounded bg-slate-800 px-1.5 py-0.5">Esc</kbd> Stop
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
