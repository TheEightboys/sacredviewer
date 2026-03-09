import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useViewerStore } from '../../store/useViewerStore'

export function CameraControlsPanel() {
  const [isExpanded, setIsExpanded] = useState(false)
  const {
    autoRotate,
    setAutoRotate,
    autoRotateSpeed,
    setAutoRotateSpeed,
    reduceMotion,
    setReduceMotion,
  } = useViewerStore()

  return (
    <div className="relative">
      {/* Toggle Button */}
      <motion.button
        onClick={() => setIsExpanded(!isExpanded)}
        className={`flex h-8 w-8 items-center justify-center rounded-lg transition-colors ${
          isExpanded
            ? 'bg-blue-500 text-white'
            : 'bg-black/40 text-white/70 backdrop-blur-sm hover:bg-black/50 hover:text-white'
        }`}
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        title="Camera Settings"
      >
        <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
        </svg>
      </motion.button>

      {/* Panel - Opens downward on top-right position */}
      <AnimatePresence>
        {isExpanded && (
          <motion.div
            initial={{ opacity: 0, y: -10, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -10, scale: 0.95 }}
            className="absolute right-0 top-full z-50 mt-2 w-56 rounded-lg bg-slate-900/95 p-3 shadow-xl backdrop-blur-sm"
          >
            <h3 className="mb-3 text-xs font-semibold uppercase tracking-wider text-slate-400">
              Camera Settings
            </h3>

            {/* Auto Rotate */}
            <div className="space-y-3">
              <label className="flex items-center justify-between">
                <span className="text-sm text-slate-300">Auto Rotate</span>
                <button
                  onClick={() => setAutoRotate(!autoRotate)}
                  className={`relative h-5 w-9 rounded-full transition-colors ${
                    autoRotate ? 'bg-blue-500' : 'bg-slate-600'
                  }`}
                >
                  <motion.div
                    className="absolute top-0.5 h-4 w-4 rounded-full bg-white shadow"
                    animate={{ left: autoRotate ? '1.125rem' : '0.125rem' }}
                    transition={{ type: 'spring', stiffness: 500, damping: 30 }}
                  />
                </button>
              </label>

              {/* Rotate Speed */}
              <div className={autoRotate ? '' : 'opacity-50'}>
                <div className="mb-1 flex items-center justify-between text-sm">
                  <span className="text-slate-400">Speed</span>
                  <span className="font-mono text-slate-300">{autoRotateSpeed.toFixed(1)}x</span>
                </div>
                <input
                  type="range"
                  min="0.1"
                  max="2"
                  step="0.1"
                  value={autoRotateSpeed}
                  onChange={(e) => setAutoRotateSpeed(parseFloat(e.target.value))}
                  disabled={!autoRotate}
                  className="w-full accent-blue-500"
                />
              </div>

              <div className="my-2 h-px bg-slate-700" />

              {/* Reduce Motion */}
              <label className="flex items-center justify-between">
                <span className="text-sm text-slate-300">Reduce Motion</span>
                <button
                  onClick={() => setReduceMotion(!reduceMotion)}
                  className={`relative h-5 w-9 rounded-full transition-colors ${
                    reduceMotion ? 'bg-blue-500' : 'bg-slate-600'
                  }`}
                >
                  <motion.div
                    className="absolute top-0.5 h-4 w-4 rounded-full bg-white shadow"
                    animate={{ left: reduceMotion ? '1.125rem' : '0.125rem' }}
                    transition={{ type: 'spring', stiffness: 500, damping: 30 }}
                  />
                </button>
              </label>
            </div>

            {/* Keyboard Hint */}
            <div className="mt-3 rounded bg-slate-800/50 p-2 text-xs text-slate-500">
              <p>Press <kbd className="rounded bg-slate-700 px-1">R</kbd> to toggle rotation</p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
