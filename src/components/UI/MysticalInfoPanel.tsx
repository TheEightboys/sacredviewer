import { motion } from 'framer-motion'
import { useStore } from '../../store/useStore'
import { useAdminStore } from '../../store/useAdminStore'
import { VideoPlayer } from './VideoPlayer'

export function MysticalInfoPanel() {
  const selectedMarker = useStore((state) => state.selectedMarker)
  const markers = useAdminStore((state) => state.config.markers)

  const marker = markers.find((m) => m.id === selectedMarker)

  if (!marker) return null

  const hasVideo = marker.videoUrl && marker.videoUrl.length > 0

  return (
    <div className="relative flex h-full flex-col">

      {/* Content - no cards, just floating content */}
      <div className="relative z-10 flex h-full flex-col p-4 pt-16">
        {/* Scrollable content - title is now in center header */}
        <div className="flex-1 overflow-y-auto">
          {/* Video - no card, just the player */}
          {hasVideo && (
            <motion.div
              className="mb-4 overflow-hidden rounded-lg"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
            >
              <VideoPlayer />
            </motion.div>
          )}

          {/* Description - plain text */}
          {marker.description && (
            <motion.p
              className="font-elegant text-base leading-relaxed md:text-lg"
              style={{ color: '#e8dcc4' }}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
            >
              {marker.description}
            </motion.p>
          )}

          {/* Link - minimal style */}
          {marker.linkUrl && (
            <motion.a
              href={marker.linkUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-4 inline-flex items-center gap-2"
              style={{ color: '#c9a227' }}
              whileHover={{ scale: 1.02 }}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" />
                <polyline points="15 3 21 3 21 9" />
                <line x1="10" y1="14" x2="21" y2="3" />
              </svg>
              <span className="text-sm underline">{marker.linkUrl}</span>
            </motion.a>
          )}
        </div>
      </div>
    </div>
  )
}
