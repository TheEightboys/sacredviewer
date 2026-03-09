import { useEffect, useRef, useCallback, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useTourStore } from '../../store/useTourStore'

export function PresentationMode() {
  const {
    presentationMode,
    showLaserPointer,
    laserPosition,
    showTimer,
    timerDuration,
    timerRemaining,
    exitPresentationMode,
    toggleLaserPointer,
    setLaserPosition,
    setShowTimer,
    setTimerDuration,
    setTimerRemaining,
  } = useTourStore()

  const [showControls, setShowControls] = useState(false)
  const [isTimerRunning, setIsTimerRunning] = useState(false)
  const timerIntervalRef = useRef<number | null>(null)
  const hideControlsTimeoutRef = useRef<number | null>(null)

  // Handle mouse movement for laser pointer
  const handleMouseMove = useCallback(
    (e: MouseEvent) => {
      if (showLaserPointer) {
        setLaserPosition({ x: e.clientX, y: e.clientY })
      }

      // Show controls briefly when mouse moves
      setShowControls(true)
      if (hideControlsTimeoutRef.current) {
        clearTimeout(hideControlsTimeoutRef.current)
      }
      hideControlsTimeoutRef.current = window.setTimeout(() => {
        setShowControls(false)
      }, 3000)
    },
    [showLaserPointer, setLaserPosition]
  )

  // Timer functionality
  useEffect(() => {
    if (!showTimer || !isTimerRunning) {
      if (timerIntervalRef.current) {
        clearInterval(timerIntervalRef.current)
        timerIntervalRef.current = null
      }
      return
    }

    timerIntervalRef.current = window.setInterval(() => {
      setTimerRemaining(Math.max(0, timerRemaining - 1))
      if (timerRemaining <= 1) {
        setIsTimerRunning(false)
      }
    }, 1000)

    return () => {
      if (timerIntervalRef.current) {
        clearInterval(timerIntervalRef.current)
      }
    }
  }, [showTimer, isTimerRunning, timerRemaining, setTimerRemaining])

  // Handle keyboard shortcuts
  useEffect(() => {
    if (!presentationMode) return

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        exitPresentationMode()
      } else if (e.key === 'l' || e.key === 'L') {
        toggleLaserPointer()
      } else if (e.key === 't' || e.key === 'T') {
        setShowTimer(!showTimer)
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [presentationMode, showTimer, exitPresentationMode, toggleLaserPointer, setShowTimer])

  // Mouse move listener
  useEffect(() => {
    if (!presentationMode) return

    window.addEventListener('mousemove', handleMouseMove)
    return () => window.removeEventListener('mousemove', handleMouseMove)
  }, [presentationMode, handleMouseMove])

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (timerIntervalRef.current) {
        clearInterval(timerIntervalRef.current)
      }
      if (hideControlsTimeoutRef.current) {
        clearTimeout(hideControlsTimeoutRef.current)
      }
    }
  }, [])

  // Format time as MM:SS
  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`
  }

  // Timer presets
  const timerPresets = [
    { label: '5 min', value: 300 },
    { label: '10 min', value: 600 },
    { label: '15 min', value: 900 },
    { label: '30 min', value: 1800 },
  ]

  if (!presentationMode) return null

  return (
    <>
      {/* Laser Pointer */}
      <AnimatePresence>
        {showLaserPointer && laserPosition && (
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            exit={{ scale: 0 }}
            className="pointer-events-none fixed z-[100]"
            style={{
              left: laserPosition.x,
              top: laserPosition.y,
              transform: 'translate(-50%, -50%)',
            }}
          >
            <div className="relative">
              {/* Outer glow */}
              <div className="absolute -inset-2 rounded-full bg-red-500/30 blur-md" />
              {/* Inner dot */}
              <div className="h-4 w-4 rounded-full bg-red-500 shadow-lg shadow-red-500/50" />
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Timer Display */}
      <AnimatePresence>
        {showTimer && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="fixed right-8 top-8 z-50"
          >
            <div className="rounded-xl bg-black/80 px-6 py-4 shadow-2xl backdrop-blur-sm">
              <div
                className={`text-center text-4xl font-mono font-bold ${
                  timerRemaining <= 60 ? 'text-red-500' : 'text-white'
                }`}
              >
                {formatTime(timerRemaining)}
              </div>
              <div className="mt-2 flex gap-2">
                <button
                  onClick={() => setIsTimerRunning(!isTimerRunning)}
                  className={`flex-1 rounded px-2 py-1 text-xs font-medium transition-colors ${
                    isTimerRunning
                      ? 'bg-red-600 text-white hover:bg-red-500'
                      : 'bg-emerald-600 text-white hover:bg-emerald-500'
                  }`}
                >
                  {isTimerRunning ? 'Pause' : 'Start'}
                </button>
                <button
                  onClick={() => {
                    setIsTimerRunning(false)
                    setTimerRemaining(timerDuration)
                  }}
                  className="rounded bg-slate-600 px-2 py-1 text-xs font-medium text-white hover:bg-slate-500"
                >
                  Reset
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Presentation Controls */}
      <AnimatePresence>
        {showControls && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 20 }}
            className="fixed left-8 top-8 z-50"
          >
            <div className="flex flex-col gap-2 rounded-xl bg-black/80 p-4 shadow-2xl backdrop-blur-sm">
              <h3 className="mb-2 text-xs font-semibold uppercase tracking-wider text-slate-400">
                Presentation Controls
              </h3>

              {/* Laser Pointer Toggle */}
              <button
                onClick={toggleLaserPointer}
                className={`flex items-center gap-3 rounded-lg px-3 py-2 text-sm transition-colors ${
                  showLaserPointer
                    ? 'bg-red-600 text-white'
                    : 'bg-slate-700 text-slate-300 hover:bg-slate-600'
                }`}
              >
                <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 24 24">
                  <circle cx="12" cy="12" r="3" />
                  <path d="M12 2v4M12 18v4M2 12h4M18 12h4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83" />
                </svg>
                <span>Laser Pointer</span>
                <kbd className="ml-auto rounded bg-black/50 px-1.5 py-0.5 text-xs">L</kbd>
              </button>

              {/* Timer Toggle */}
              <button
                onClick={() => setShowTimer(!showTimer)}
                className={`flex items-center gap-3 rounded-lg px-3 py-2 text-sm transition-colors ${
                  showTimer
                    ? 'bg-blue-600 text-white'
                    : 'bg-slate-700 text-slate-300 hover:bg-slate-600'
                }`}
              >
                <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
                <span>Timer</span>
                <kbd className="ml-auto rounded bg-black/50 px-1.5 py-0.5 text-xs">T</kbd>
              </button>

              {/* Timer Duration Presets */}
              {showTimer && (
                <div className="mt-2 border-t border-slate-700 pt-2">
                  <p className="mb-2 text-xs text-slate-400">Set Duration:</p>
                  <div className="grid grid-cols-2 gap-1">
                    {timerPresets.map((preset) => (
                      <button
                        key={preset.value}
                        onClick={() => {
                          setTimerDuration(preset.value)
                          setIsTimerRunning(false)
                        }}
                        className={`rounded px-2 py-1 text-xs transition-colors ${
                          timerDuration === preset.value
                            ? 'bg-blue-600 text-white'
                            : 'bg-slate-700 text-slate-300 hover:bg-slate-600'
                        }`}
                      >
                        {preset.label}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Exit Button */}
              <button
                onClick={exitPresentationMode}
                className="mt-2 flex items-center gap-3 rounded-lg bg-slate-700 px-3 py-2 text-sm text-slate-300 transition-colors hover:bg-red-600 hover:text-white"
              >
                <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M6 18L18 6M6 6l12 12"
                  />
                </svg>
                <span>Exit Presentation</span>
                <kbd className="ml-auto rounded bg-black/50 px-1.5 py-0.5 text-xs">Esc</kbd>
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Keyboard Hint (shows when controls hidden) */}
      <AnimatePresence>
        {!showControls && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ delay: 0.5 }}
            className="fixed bottom-4 left-4 z-50 text-xs text-white/30"
          >
            Move mouse to show controls
          </motion.div>
        )}
      </AnimatePresence>
    </>
  )
}
