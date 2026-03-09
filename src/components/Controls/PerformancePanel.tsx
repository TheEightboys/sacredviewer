import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { usePerformanceStore, QualityPreset } from '../../store/usePerformanceStore'
import { FpsDisplay } from '../Scene/FpsCounter'

const QUALITY_LABELS: Record<QualityPreset, { label: string; description: string }> = {
  low: { label: 'Low', description: 'Best performance, lower quality' },
  medium: { label: 'Medium', description: 'Balanced performance and quality' },
  high: { label: 'High', description: 'Better quality, more GPU usage' },
  ultra: { label: 'Ultra', description: 'Maximum quality, high GPU usage' },
}

export function PerformancePanel() {
  const [isExpanded, setIsExpanded] = useState(false)
  const [showAdvanced, setShowAdvanced] = useState(false)

  const {
    qualityPreset,
    setQualityPreset,
    shadowQuality,
    setShadowQuality,
    showFps,
    setShowFps,
    deviceCapability,
    detectDeviceCapability,
    applyAutoSettings,
    autoDetected,
    antialias,
    setAntialias,
    lodEnabled,
    setLodEnabled,
  } = usePerformanceStore()

  // Detect device capability on mount
  useEffect(() => {
    if (!deviceCapability) {
      detectDeviceCapability()
    }
  }, [deviceCapability, detectDeviceCapability])

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
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M13 10V3L4 14h7v7l9-11h-7z"
          />
        </svg>
        <span className="hidden sm:inline">Performance</span>
        {showFps && <FpsDisplay />}
      </motion.button>

      {/* Panel */}
      <AnimatePresence>
        {isExpanded && (
          <motion.div
            initial={{ opacity: 0, y: -10, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -10, scale: 0.95 }}
            className="absolute right-0 top-full z-50 mt-2 w-72 rounded-lg bg-slate-900/95 p-4 shadow-xl backdrop-blur-sm"
          >
            {/* Device Info */}
            {deviceCapability && (
              <div className="mb-3 rounded-lg bg-slate-800/50 p-2 text-xs">
                <div className="flex items-center justify-between">
                  <span className="text-slate-400">Detected:</span>
                  <span className={`font-medium ${
                    deviceCapability.tier === 'high' ? 'text-green-400' :
                    deviceCapability.tier === 'medium' ? 'text-yellow-400' : 'text-red-400'
                  }`}>
                    {deviceCapability.tier.charAt(0).toUpperCase() + deviceCapability.tier.slice(1)}-end device
                  </span>
                </div>
                <div className="mt-1 truncate text-slate-500" title={deviceCapability.gpu}>
                  {deviceCapability.gpu.slice(0, 35)}{deviceCapability.gpu.length > 35 ? '...' : ''}
                </div>
              </div>
            )}

            {/* Auto-detect Button */}
            <button
              onClick={applyAutoSettings}
              className="mb-3 flex w-full items-center justify-center gap-2 rounded-lg bg-blue-600/20 px-3 py-2 text-sm text-blue-400 transition-colors hover:bg-blue-600/30"
            >
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
              {autoDetected ? 'Re-detect & Apply' : 'Auto-detect Settings'}
            </button>

            {/* Quality Presets */}
            <div className="mb-4">
              <label className="mb-2 block text-xs font-medium uppercase text-slate-500">
                Quality Preset
              </label>
              <div className="grid grid-cols-4 gap-1">
                {(Object.keys(QUALITY_LABELS) as QualityPreset[]).map((preset) => (
                  <button
                    key={preset}
                    onClick={() => setQualityPreset(preset)}
                    className={`rounded px-2 py-1.5 text-xs font-medium transition-colors ${
                      qualityPreset === preset
                        ? 'bg-blue-500 text-white'
                        : 'bg-slate-800 text-slate-400 hover:bg-slate-700 hover:text-white'
                    }`}
                    title={QUALITY_LABELS[preset].description}
                  >
                    {QUALITY_LABELS[preset].label}
                  </button>
                ))}
              </div>
              <p className="mt-1 text-xs text-slate-500">
                {QUALITY_LABELS[qualityPreset].description}
              </p>
            </div>

            {/* Shadow Quality */}
            <div className="mb-4">
              <label className="mb-2 block text-xs font-medium uppercase text-slate-500">
                Shadows
              </label>
              <div className="grid grid-cols-4 gap-1">
                {(['off', 'low', 'medium', 'high'] as const).map((quality) => (
                  <button
                    key={quality}
                    onClick={() => setShadowQuality(quality)}
                    className={`rounded px-2 py-1.5 text-xs font-medium capitalize transition-colors ${
                      shadowQuality === quality
                        ? 'bg-blue-500 text-white'
                        : 'bg-slate-800 text-slate-400 hover:bg-slate-700 hover:text-white'
                    }`}
                  >
                    {quality}
                  </button>
                ))}
              </div>
            </div>

            {/* Toggle Options */}
            <div className="mb-4 space-y-2">
              <label className="flex items-center justify-between">
                <span className="text-sm text-slate-300">Show FPS Counter</span>
                <button
                  onClick={() => setShowFps(!showFps)}
                  className={`relative h-5 w-9 rounded-full transition-colors ${
                    showFps ? 'bg-blue-500' : 'bg-slate-700'
                  }`}
                >
                  <div
                    className={`absolute top-0.5 h-4 w-4 rounded-full bg-white transition-transform ${
                      showFps ? 'translate-x-4' : 'translate-x-0.5'
                    }`}
                  />
                </button>
              </label>

              <label className="flex items-center justify-between">
                <span className="text-sm text-slate-300">Anti-aliasing</span>
                <button
                  onClick={() => setAntialias(!antialias)}
                  className={`relative h-5 w-9 rounded-full transition-colors ${
                    antialias ? 'bg-blue-500' : 'bg-slate-700'
                  }`}
                >
                  <div
                    className={`absolute top-0.5 h-4 w-4 rounded-full bg-white transition-transform ${
                      antialias ? 'translate-x-4' : 'translate-x-0.5'
                    }`}
                  />
                </button>
              </label>

              <label className="flex items-center justify-between">
                <span className="text-sm text-slate-300">Level of Detail (LOD)</span>
                <button
                  onClick={() => setLodEnabled(!lodEnabled)}
                  className={`relative h-5 w-9 rounded-full transition-colors ${
                    lodEnabled ? 'bg-blue-500' : 'bg-slate-700'
                  }`}
                >
                  <div
                    className={`absolute top-0.5 h-4 w-4 rounded-full bg-white transition-transform ${
                      lodEnabled ? 'translate-x-4' : 'translate-x-0.5'
                    }`}
                  />
                </button>
              </label>
            </div>

            {/* Advanced Toggle */}
            <button
              onClick={() => setShowAdvanced(!showAdvanced)}
              className="flex w-full items-center justify-between border-t border-slate-700 pt-3 text-xs text-slate-400 hover:text-white"
            >
              <span>Advanced Options</span>
              <svg
                className={`h-4 w-4 transition-transform ${showAdvanced ? 'rotate-180' : ''}`}
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </button>

            {/* Advanced Options */}
            <AnimatePresence>
              {showAdvanced && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: 'auto', opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  className="overflow-hidden"
                >
                  <div className="mt-3 space-y-3 text-xs text-slate-400">
                    <div>
                      <div className="mb-1">Cores: {deviceCapability?.cores || 'N/A'}</div>
                      <div>Memory: {deviceCapability?.memory || 'N/A'} GB</div>
                    </div>
                    <p className="text-slate-500">
                      Performance settings are saved locally and will be restored on your next visit.
                    </p>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
