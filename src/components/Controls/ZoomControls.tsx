import { motion } from 'framer-motion'

interface ZoomControlsProps {
  onZoomIn: () => void
  onZoomOut: () => void
  onReset: () => void
  onFit: () => void
  zoomLevel: number
}

export function ZoomControls({
  onZoomIn,
  onZoomOut,
  onReset,
  onFit,
  zoomLevel,
}: ZoomControlsProps) {
  return (
    <motion.div
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      className="flex flex-col gap-1 rounded-lg bg-black/40 p-1 backdrop-blur-sm"
    >
      {/* Zoom In */}
      <button
        onClick={onZoomIn}
        className="flex h-8 w-8 items-center justify-center rounded text-white/70 transition-colors hover:bg-white/10 hover:text-white"
        title="Zoom In (+)"
      >
        <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
        </svg>
      </button>

      {/* Zoom Level */}
      <div className="flex h-8 w-8 items-center justify-center text-xs text-white/50">
        {Math.round(zoomLevel * 100)}%
      </div>

      {/* Zoom Out */}
      <button
        onClick={onZoomOut}
        className="flex h-8 w-8 items-center justify-center rounded text-white/70 transition-colors hover:bg-white/10 hover:text-white"
        title="Zoom Out (-)"
      >
        <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 12H4" />
        </svg>
      </button>

      <div className="my-1 h-px bg-white/20" />

      {/* Reset View */}
      <button
        onClick={onReset}
        className="flex h-8 w-8 items-center justify-center rounded text-white/70 transition-colors hover:bg-white/10 hover:text-white"
        title="Reset View (Home)"
      >
        <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
        </svg>
      </button>

      {/* Fit to Screen */}
      <button
        onClick={onFit}
        className="flex h-8 w-8 items-center justify-center rounded text-white/70 transition-colors hover:bg-white/10 hover:text-white"
        title="Fit to Screen (F)"
      >
        <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 8V4m0 0h4M4 4l5 5m11-1V4m0 0h-4m4 0l-5 5M4 16v4m0 0h4m-4 0l5-5m11 5l-5-5m5 5v-4m0 4h-4" />
        </svg>
      </button>
    </motion.div>
  )
}
