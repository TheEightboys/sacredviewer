import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useViewerStore } from '../../store/useViewerStore'

export function ModelDisplayControls() {
  const [isExpanded, setIsExpanded] = useState(false)
  const {
    wireframe,
    setWireframe,
    transparent,
    setTransparent,
    highContrast,
    setHighContrast,
  } = useViewerStore()

  return (
    <div className="relative">
      {/* Toggle Button */}
      <motion.button
        onClick={() => setIsExpanded(!isExpanded)}
        className={`flex h-8 w-8 items-center justify-center rounded-lg transition-colors ${
          isExpanded || wireframe || transparent
            ? 'bg-blue-500 text-white'
            : 'bg-black/40 text-white/70 backdrop-blur-sm hover:bg-black/50 hover:text-white'
        }`}
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        title="Display Options"
      >
        <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
        </svg>
      </motion.button>

      {/* Panel - Opens downward on top-right position */}
      <AnimatePresence>
        {isExpanded && (
          <motion.div
            initial={{ opacity: 0, y: -10, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -10, scale: 0.95 }}
            className="absolute right-0 top-full z-50 mt-2 w-52 rounded-lg bg-slate-900/95 p-3 shadow-xl backdrop-blur-sm"
          >
            <h3 className="mb-3 text-xs font-semibold uppercase tracking-wider text-slate-400">
              Display Options
            </h3>

            <div className="space-y-2">
              {/* Wireframe */}
              <button
                onClick={() => setWireframe(!wireframe)}
                className={`flex w-full items-center gap-3 rounded-lg p-2 text-left transition-colors ${
                  wireframe ? 'bg-blue-500/20 text-blue-400' : 'text-slate-300 hover:bg-slate-800'
                }`}
              >
                <div className={`flex h-6 w-6 items-center justify-center rounded ${wireframe ? 'bg-blue-500' : 'bg-slate-700'}`}>
                  <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 5a1 1 0 011-1h14a1 1 0 011 1v2a1 1 0 01-1 1H5a1 1 0 01-1-1V5zM4 13a1 1 0 011-1h6a1 1 0 011 1v6a1 1 0 01-1 1H5a1 1 0 01-1-1v-6zM16 13a1 1 0 011-1h2a1 1 0 011 1v6a1 1 0 01-1 1h-2a1 1 0 01-1-1v-6z" />
                  </svg>
                </div>
                <div>
                  <p className="text-sm font-medium">Wireframe</p>
                  <p className="text-xs text-slate-500">Show mesh edges</p>
                </div>
              </button>

              {/* Transparent / X-Ray */}
              <button
                onClick={() => setTransparent(!transparent)}
                className={`flex w-full items-center gap-3 rounded-lg p-2 text-left transition-colors ${
                  transparent ? 'bg-blue-500/20 text-blue-400' : 'text-slate-300 hover:bg-slate-800'
                }`}
              >
                <div className={`flex h-6 w-6 items-center justify-center rounded ${transparent ? 'bg-blue-500' : 'bg-slate-700'}`}>
                  <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                  </svg>
                </div>
                <div>
                  <p className="text-sm font-medium">X-Ray Mode</p>
                  <p className="text-xs text-slate-500">See through model</p>
                </div>
              </button>

              {/* High Contrast */}
              <button
                onClick={() => setHighContrast(!highContrast)}
                className={`flex w-full items-center gap-3 rounded-lg p-2 text-left transition-colors ${
                  highContrast ? 'bg-blue-500/20 text-blue-400' : 'text-slate-300 hover:bg-slate-800'
                }`}
              >
                <div className={`flex h-6 w-6 items-center justify-center rounded ${highContrast ? 'bg-blue-500' : 'bg-slate-700'}`}>
                  <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" />
                  </svg>
                </div>
                <div>
                  <p className="text-sm font-medium">High Contrast</p>
                  <p className="text-xs text-slate-500">Better visibility</p>
                </div>
              </button>
            </div>

            {/* Keyboard Hints */}
            <div className="mt-3 space-y-1 rounded bg-slate-800/50 p-2 text-xs text-slate-500">
              <p><kbd className="rounded bg-slate-700 px-1">W</kbd> Wireframe</p>
              <p><kbd className="rounded bg-slate-700 px-1">X</kbd> X-Ray mode</p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
