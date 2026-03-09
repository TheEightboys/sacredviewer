import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useTourStore } from '../../store/useTourStore'
import { useAdminStore } from '../../store/useAdminStore'
import { TourEditor, TourShare } from '../Tour'

interface TourControlsProps {
  onStartTour?: () => void
}

export function TourControls({ onStartTour }: TourControlsProps) {
  const [showDropdown, setShowDropdown] = useState(false)
  const [showEditor, setShowEditor] = useState(false)
  const [showShare, setShowShare] = useState(false)

  const {
    tours,
    activeTourId,
    isPlaying,
    setActiveTour,
    play,
    stop,
    enterPresentationMode,
  } = useTourStore()

  const isEditMode = useAdminStore((state) => state.isEditMode)

  const activeTour = tours.find((t) => t.id === activeTourId)
  const hasStops = activeTour && activeTour.stops.length > 0

  const handleStartTour = (tourId: string) => {
    setActiveTour(tourId)
    setShowDropdown(false)
    onStartTour?.()
    // Small delay to ensure tour is set before playing
    setTimeout(() => play(), 100)
  }

  const handleStopTour = () => {
    stop()
    setActiveTour(null)
  }

  const handlePresentationMode = () => {
    if (activeTour && hasStops) {
      enterPresentationMode()
      if (!isPlaying) {
        play()
      }
    }
  }

  if (tours.length === 0 && !isEditMode) return null

  return (
    <>
      <div className="relative">
        {/* Main Tour Button */}
        <motion.button
          onClick={() => setShowDropdown(!showDropdown)}
          className={`flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
            isPlaying
              ? 'bg-emerald-500 text-white'
              : 'bg-black/40 text-white/70 backdrop-blur-sm hover:bg-black/50 hover:text-white'
          }`}
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          title="Tour Mode"
        >
          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7"
            />
          </svg>
          <span className="hidden sm:inline">
            {isPlaying ? 'Playing' : activeTour ? activeTour.name : 'Tours'}
          </span>
          <svg
            className={`h-3 w-3 transition-transform ${showDropdown ? 'rotate-180' : ''}`}
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </motion.button>

        {/* Dropdown Menu */}
        <AnimatePresence>
          {showDropdown && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="absolute left-0 top-full z-50 mt-2 min-w-[200px] overflow-hidden rounded-lg bg-slate-900/95 shadow-xl backdrop-blur-sm"
            >
              {/* Active Tour Section */}
              {isPlaying && activeTour && (
                <div className="border-b border-slate-700 p-3">
                  <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-slate-500">
                    Now Playing
                  </p>
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium text-white">{activeTour.name}</span>
                    <button
                      onClick={handleStopTour}
                      className="rounded bg-red-600/20 px-2 py-1 text-xs text-red-400 hover:bg-red-600/30"
                    >
                      Stop
                    </button>
                  </div>
                </div>
              )}

              {/* Available Tours */}
              {tours.length > 0 && (
                <div className="max-h-60 overflow-y-auto p-2">
                  <p className="mb-2 px-2 text-xs font-semibold uppercase tracking-wider text-slate-500">
                    Tours
                  </p>
                  {tours.map((tour) => (
                    <button
                      key={tour.id}
                      onClick={() => handleStartTour(tour.id)}
                      disabled={tour.stops.length === 0}
                      className={`flex w-full items-center justify-between rounded-lg px-3 py-2 text-left text-sm transition-colors ${
                        activeTourId === tour.id
                          ? 'bg-emerald-600/20 text-emerald-400'
                          : tour.stops.length === 0
                            ? 'cursor-not-allowed text-slate-500'
                            : 'text-slate-300 hover:bg-slate-800 hover:text-white'
                      }`}
                    >
                      <span className="truncate">{tour.name}</span>
                      <span className="ml-2 shrink-0 text-xs opacity-60">
                        {tour.stops.length} stops
                      </span>
                    </button>
                  ))}
                </div>
              )}

              {tours.length === 0 && (
                <div className="p-4 text-center text-sm text-slate-500">
                  No tours created yet
                </div>
              )}

              {/* Actions */}
              <div className="border-t border-slate-700 p-2">
                {/* Presentation Mode */}
                {hasStops && (
                  <button
                    onClick={handlePresentationMode}
                    className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-sm text-slate-300 transition-colors hover:bg-slate-800 hover:text-white"
                  >
                    <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
                      />
                    </svg>
                    Presentation Mode
                  </button>
                )}

                {/* Share */}
                {tours.length > 0 && (
                  <button
                    onClick={() => {
                      setShowDropdown(false)
                      setShowShare(true)
                    }}
                    className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-sm text-slate-300 transition-colors hover:bg-slate-800 hover:text-white"
                  >
                    <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z"
                      />
                    </svg>
                    Share Tour
                  </button>
                )}

                {/* Edit Tours (Admin only) */}
                {isEditMode && (
                  <button
                    onClick={() => {
                      setShowDropdown(false)
                      setShowEditor(true)
                    }}
                    className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-sm text-blue-400 transition-colors hover:bg-blue-600/20"
                  >
                    <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
                      />
                    </svg>
                    Edit Tours
                  </button>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Modals */}
      <AnimatePresence>
        {showEditor && <TourEditor onClose={() => setShowEditor(false)} />}
        {showShare && <TourShare onClose={() => setShowShare(false)} />}
      </AnimatePresence>
    </>
  )
}
