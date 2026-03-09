import { ReactNode, useMemo, useEffect, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useStore } from '../../store/useStore'
import { useAdminStore } from '../../store/useAdminStore'

interface MysticalLayoutProps {
  children: ReactNode
  title?: string
  infoPanel?: ReactNode
}

// Synchronous initial check so first render uses correct layout
function getDeviceInfo() {
  if (typeof window === 'undefined') return { orientation: 'landscape' as const, isMobile: false }
  const isPortrait = window.innerHeight > window.innerWidth
  const mobile = window.innerWidth < 768 || (window.innerWidth < 900 && 'ontouchstart' in window)
  return { orientation: (isPortrait ? 'portrait' : 'landscape') as 'portrait' | 'landscape', isMobile: mobile }
}

// Hook to detect device orientation and type
function useDeviceOrientation() {
  const [state, setState] = useState(getDeviceInfo)

  useEffect(() => {
    const update = () => setState(getDeviceInfo())
    window.addEventListener('resize', update)
    window.addEventListener('orientationchange', update)
    return () => {
      window.removeEventListener('resize', update)
      window.removeEventListener('orientationchange', update)
    }
  }, [])

  return state
}

// Rotate device prompt for portrait mode - dismissible banner at top
function RotateDevicePrompt({ onDismiss }: { onDismiss: () => void }) {
  return (
    <motion.div
      className="fixed left-0 right-0 top-0 z-[100] flex items-center justify-between px-4 py-3"
      style={{ background: 'rgba(10, 10, 15, 0.95)', borderBottom: '1px solid rgba(212, 168, 83, 0.3)' }}
      initial={{ opacity: 0, y: -50 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -50 }}
    >
      <div className="flex items-center gap-3">
        {/* Rotating phone icon */}
        <motion.div
          animate={{ rotate: [0, 90, 90, 0] }}
          transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
          style={{ color: '#d4a853' }}
        >
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
            <rect x="5" y="2" width="14" height="20" rx="2" />
            <line x1="12" y1="18" x2="12" y2="18.01" strokeWidth="2" strokeLinecap="round" />
          </svg>
        </motion.div>

        <p
          className="text-sm"
          style={{ color: '#d4a853' }}
        >
          Rotate for best experience
        </p>
      </div>

      <button
        onClick={onDismiss}
        className="rounded-full p-1"
        style={{ color: '#8b8b99' }}
      >
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <line x1="18" y1="6" x2="6" y2="18" />
          <line x1="6" y1="6" x2="18" y2="18" />
        </svg>
      </button>
    </motion.div>
  )
}

// Atmospheric particles - subtle floating dust
function AtmosphericParticles() {
  const particles = useMemo(() => {
    return Array.from({ length: 20 }, (_, i) => ({
      id: i,
      x: Math.random() * 100,
      y: Math.random() * 100,
      size: Math.random() * 2 + 1,
      delay: Math.random() * 5,
      duration: Math.random() * 10 + 15,
    }))
  }, [])

  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden">
      {particles.map((p) => (
        <motion.div
          key={p.id}
          className="absolute rounded-full"
          style={{
            left: `${p.x}%`,
            top: `${p.y}%`,
            width: p.size,
            height: p.size,
            background: 'radial-gradient(circle, rgba(201, 162, 39, 0.3) 0%, transparent 70%)',
          }}
          animate={{
            y: [0, -15, -30, -15, 0],
            opacity: [0.1, 0.3, 0.2, 0.3, 0.1],
          }}
          transition={{
            duration: p.duration,
            delay: p.delay,
            repeat: Infinity,
            ease: 'easeInOut',
          }}
        />
      ))}
    </div>
  )
}

// Atmospheric mist/fog layers - blue theme
function MistLayers() {
  return (
    <>
      {/* Bottom gradient with dark blue tint */}
      <div
        className="pointer-events-none absolute inset-x-0 bottom-0 h-1/3"
        style={{
          background: 'linear-gradient(to top, rgba(10, 20, 35, 0.9) 0%, rgba(20, 35, 55, 0.6) 40%, transparent 100%)',
        }}
      />
      {/* Top atmosphere with soft blue glow */}
      <div
        className="pointer-events-none absolute inset-x-0 top-0 h-32"
        style={{
          background: 'linear-gradient(to bottom, rgba(100, 150, 190, 0.15) 0%, transparent 100%)',
        }}
      />
      {/* Vignette with blue tint */}
      <div
        className="pointer-events-none absolute inset-0"
        style={{
          background: 'radial-gradient(ellipse at center 40%, transparent 40%, rgba(10, 20, 40, 0.4) 100%)',
        }}
      />
    </>
  )
}

// Loading overlay - "Entering Sacred Viewer..."
function LoadingOverlay() {
  return (
    <motion.div
      className="absolute inset-0 z-50 flex items-center justify-center"
      style={{ background: 'linear-gradient(to bottom, #1e3a5f 0%, #152540 50%, #0a1525 100%)' }}
      initial={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.8, ease: 'easeOut' }}
    >
      <div className="text-center">
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
        >
          <h2
            className="font-mystical text-2xl font-semibold tracking-wider md:text-3xl"
            style={{
              color: '#c9a227',
              textShadow: '0 0 20px rgba(201, 162, 39, 0.5)',
              fontStyle: 'italic',
            }}
          >
            Entering sacred viewer&hellip;
          </h2>
        </motion.div>

        {/* Animated dots / pulse indicator */}
        <motion.div
          className="mx-auto mt-6 flex justify-center gap-2"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3 }}
        >
          {[0, 1, 2].map((i) => (
            <motion.div
              key={i}
              className="h-2 w-2 rounded-full"
              style={{ background: '#c9a227' }}
              animate={{ opacity: [0.3, 1, 0.3], scale: [0.8, 1.2, 0.8] }}
              transition={{ duration: 1.2, repeat: Infinity, delay: i * 0.2, ease: 'easeInOut' }}
            />
          ))}
        </motion.div>
      </div>
    </motion.div>
  )
}

export function MysticalLayout({ children, title = 'Sacred Viewer', infoPanel }: MysticalLayoutProps) {
  const selectedMarker = useStore((state) => state.selectedMarker)
  const isLoading = useStore((state) => state.isLoading)
  const markers = useAdminStore((state) => state.config.markers)
  const { orientation, isMobile } = useDeviceOrientation()
  const [dismissedRotatePrompt, setDismissedRotatePrompt] = useState(false)

  // Get selected marker title for center heading
  const selectedMarkerData = markers.find((m) => m.id === selectedMarker)

  // Show rotate prompt on mobile portrait (unless dismissed)
  const showRotatePrompt = isMobile && orientation === 'portrait' && !dismissedRotatePrompt

  // Reset dismissed state when orientation changes to landscape
  useEffect(() => {
    if (orientation === 'landscape') {
      setDismissedRotatePrompt(false)
    }
  }, [orientation])

  return (
    <div className="relative h-full w-full overflow-hidden" style={{ background: 'linear-gradient(to bottom, #1e3a5f 0%, #152540 50%, #0a1525 100%)' }}>
      {/* Rotate device prompt for mobile portrait - dismissible banner */}
      <AnimatePresence>
        {showRotatePrompt && <RotateDevicePrompt onDismiss={() => setDismissedRotatePrompt(true)} />}
      </AnimatePresence>

      {/* Full screen 3D Scene - always covers entire screen */}
      <div className="absolute inset-0">
        {children}

        {/* Atmospheric effects overlay */}
        <AtmosphericParticles />
        <MistLayers />
      </div>

      {/* Video panel overlay - Desktop: right side, Mobile: bottom */}
      {infoPanel && (
        <motion.div
          className="absolute z-20"
          style={
            isMobile
              ? { bottom: 0, left: 0, right: 0, height: '40%' }
              : { top: 0, right: 0, bottom: 0, width: '45%' }
          }
          initial={isMobile ? { y: '100%' } : { x: '100%' }}
          animate={isMobile ? { y: 0 } : { x: 0 }}
          transition={{ type: 'spring', damping: 25, stiffness: 200 }}
        >
          {infoPanel}
        </motion.div>
      )}

      {/* Center title - shows app title or marker title when selected */}
      <motion.div
        className="pointer-events-none absolute left-1/2 top-4 z-40 -translate-x-1/2 md:top-6"
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3, duration: 0.6 }}
      >
        <h1
          className={`font-mystical text-center font-semibold tracking-wider ${isMobile ? 'text-lg' : 'text-2xl md:text-3xl lg:text-4xl'}`}
          style={{
            color: '#c9a227',
            textShadow: '0 0 20px rgba(201, 162, 39, 0.5), 0 2px 10px rgba(0,0,0,0.5)',
            fontStyle: 'italic',
          }}
        >
          {selectedMarkerData ? selectedMarkerData.title : title}
        </h1>
      </motion.div>

      {/* Loading overlay - shows "Entering sacred viewer..." until first model is ready */}
      <AnimatePresence>
        {isLoading && <LoadingOverlay />}
      </AnimatePresence>
    </div>
  )
}
