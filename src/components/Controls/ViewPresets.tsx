import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useViewerStore, PRESET_VIEWS, CameraView } from '../../store/useViewerStore'

interface ViewPresetsProps {
  onSelectView: (view: CameraView) => void
}

export function ViewPresets({ onSelectView }: ViewPresetsProps) {
  const [isExpanded, setIsExpanded] = useState(false)
  const { currentView, setCurrentView } = useViewerStore()

  const handleSelectView = (key: string, view: CameraView) => {
    setCurrentView(key)
    onSelectView(view)
    setIsExpanded(false)
  }

  return (
    <div className="relative">
      {/* Toggle Button */}
      <motion.button
        onClick={() => setIsExpanded(!isExpanded)}
        className={`flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
          isExpanded
            ? 'bg-blue-500 text-white'
            : 'bg-black/40 text-white/70 backdrop-blur-sm hover:bg-black/50 hover:text-white'
        }`}
        whileHover={{ scale: 1.02 }}
        whileTap={{ scale: 0.98 }}
      >
        <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
        </svg>
        <span className="hidden sm:inline">Views</span>
        <svg
          className={`h-3 w-3 transition-transform ${isExpanded ? 'rotate-180' : ''}`}
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </motion.button>

      {/* Dropdown - Opens downward, positioned left on mobile */}
      <AnimatePresence>
        {isExpanded && (
          <motion.div
            initial={{ opacity: 0, y: -10, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -10, scale: 0.95 }}
            className="absolute left-0 top-full z-50 mt-2 w-48 rounded-lg bg-slate-900/95 p-2 shadow-xl backdrop-blur-sm"
          >
            {/* Preset Views */}
            <div>
              <p className="px-2 py-1 text-xs font-medium uppercase text-slate-500">
                Preset Views
              </p>
              <div className="grid grid-cols-2 gap-1">
                {Object.entries(PRESET_VIEWS).map(([key, view]) => (
                  <button
                    key={key}
                    onClick={() => handleSelectView(key, view)}
                    className={`rounded px-2 py-1.5 text-left text-xs transition-colors ${
                      currentView === key
                        ? 'bg-blue-500 text-white'
                        : 'text-slate-300 hover:bg-slate-800'
                    }`}
                  >
                    {view.name}
                  </button>
                ))}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
