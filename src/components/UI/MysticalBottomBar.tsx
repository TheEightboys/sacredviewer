import { motion } from 'framer-motion'
import { useAdminStore } from '../../store/useAdminStore'
import { useStore } from '../../store/useStore'

interface MysticalBottomBarProps {
  onActionClick?: () => void
  actionLabel?: string
}

export function MysticalBottomBar({ onActionClick, actionLabel = 'Resume Quest' }: MysticalBottomBarProps) {
  const markers = useAdminStore((state) => state.config.markers)
  const selectedMarker = useStore((state) => state.selectedMarker)
  const setSelectedMarker = useStore((state) => state.setSelectedMarker)

  const currentIndex = markers.findIndex((m) => m.id === selectedMarker)
  const totalMarkers = markers.length

  const handleExplore = () => {
    if (onActionClick) {
      onActionClick()
    } else if (markers.length > 0) {
      const nextIndex = currentIndex < 0 ? 0 : (currentIndex + 1) % markers.length
      const marker = markers[nextIndex]
      if (marker) setSelectedMarker(marker.id)
    }
  }

  return (
    <div
      className="flex items-center justify-between px-3 py-2 md:px-6 md:py-3"
      style={{
        background: 'linear-gradient(to top, rgba(10, 10, 15, 0.98), rgba(10, 10, 15, 0.85))',
      }}
    >
      {/* Left side - Stats badges */}
      <div className="flex items-center gap-2">
        {/* Coin/marker count badge */}
        <motion.div
          className="flex items-center gap-1.5 rounded-md px-2 py-1 md:px-3 md:py-1.5"
          style={{
            background: 'linear-gradient(135deg, rgba(139, 69, 19, 0.6) 0%, rgba(101, 67, 33, 0.6) 100%)',
            border: '1px solid rgba(201, 162, 39, 0.4)',
          }}
        >
          <div
            className="flex h-5 w-5 items-center justify-center rounded-full md:h-6 md:w-6"
            style={{
              background: 'radial-gradient(circle, #c9a227 0%, #8b6914 100%)',
              boxShadow: '0 0 8px rgba(201, 162, 39, 0.5)',
            }}
          >
            <span className="text-xs" style={{ color: '#0a0a0f' }}>⬡</span>
          </div>
          <span className="text-xs font-medium md:text-sm" style={{ color: '#c9a227' }}>
            {totalMarkers}
          </span>
        </motion.div>

        {/* Date badge */}
        <motion.div
          className="hidden items-center gap-1.5 rounded-md px-2 py-1 md:flex md:px-3 md:py-1.5"
          style={{
            background: 'linear-gradient(135deg, rgba(139, 41, 66, 0.5) 0%, rgba(101, 33, 50, 0.5) 100%)',
            border: '1px solid rgba(139, 41, 66, 0.4)',
          }}
        >
          <span className="text-xs" style={{ color: '#e8a0b0' }}>
            {new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
          </span>
        </motion.div>
      </div>

      {/* Center - World Pass text */}
      <motion.div
        className="hidden items-center rounded-md px-3 py-1.5 md:flex"
        style={{
          background: 'rgba(201, 162, 39, 0.1)',
          border: '1px solid rgba(201, 162, 39, 0.3)',
        }}
        whileHover={{ background: 'rgba(201, 162, 39, 0.15)' }}
      >
        <span className="text-xs font-medium tracking-wide" style={{ color: '#c9a227' }}>
          World Pass Available!
        </span>
      </motion.div>

      {/* Right side - Action button */}
      <motion.button
        onClick={handleExplore}
        className="font-mystical flex items-center gap-2 rounded-lg px-4 py-2 text-xs uppercase tracking-wider md:px-6 md:py-2.5 md:text-sm"
        style={{
          background: 'linear-gradient(180deg, rgba(0, 128, 128, 0.5) 0%, rgba(0, 100, 100, 0.6) 100%)',
          border: '2px solid rgba(0, 180, 180, 0.7)',
          color: '#7dd3c0',
          boxShadow: '0 0 15px rgba(0, 180, 180, 0.3), inset 0 1px 0 rgba(255, 255, 255, 0.1)',
        }}
        whileHover={{
          scale: 1.02,
          boxShadow: '0 0 25px rgba(0, 180, 180, 0.5), inset 0 1px 0 rgba(255, 255, 255, 0.2)',
        }}
        whileTap={{ scale: 0.98 }}
      >
        <span>{actionLabel}</span>
      </motion.button>
    </div>
  )
}
