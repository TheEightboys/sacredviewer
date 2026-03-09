import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useRingStore } from '../Scene/GoldenPedestal'

export function RingControlPanel() {
  const [isOpen, setIsOpen] = useState(false)
  const [isMobile, setIsMobile] = useState(false)
  const { radius, yPosition, enabled, rotationSpeed, setRadius, setYPosition, setEnabled, setRotationSpeed } = useRingStore()

  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768 || 'ontouchstart' in window)
    }
    checkMobile()
    window.addEventListener('resize', checkMobile)
    return () => window.removeEventListener('resize', checkMobile)
  }, [])

  return (
    <div className={`fixed z-50 ${isMobile ? 'bottom-2 left-2' : 'bottom-4 left-4'}`}>
      {/* Toggle Button - smaller on mobile */}
      <motion.button
        onClick={() => setIsOpen(!isOpen)}
        className={`flex items-center gap-2 rounded-full font-medium ${isMobile ? 'px-3 py-1.5 text-xs' : 'px-4 py-2 text-sm'}`}
        style={{
          background: 'rgba(20, 20, 25, 0.9)',
          border: '1px solid rgba(212, 168, 83, 0.5)',
          color: '#d4a853',
          backdropFilter: 'blur(10px)',
        }}
        whileHover={{ scale: 1.05, borderColor: '#d4a853' }}
        whileTap={{ scale: 0.95 }}
      >
        <svg width={isMobile ? '14' : '16'} height={isMobile ? '14' : '16'} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <circle cx="12" cy="12" r="10" />
          <circle cx="12" cy="12" r="6" />
          <circle cx="12" cy="12" r="2" />
        </svg>
        {!isMobile && 'Ring Settings'}
      </motion.button>

      {/* Control Panel */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 10, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 10, scale: 0.95 }}
            className={`absolute left-0 rounded-lg ${isMobile ? 'bottom-10 w-56 p-3' : 'bottom-12 w-72 p-4'}`}
            style={{
              background: 'rgba(15, 15, 20, 0.95)',
              border: '1px solid rgba(212, 168, 83, 0.3)',
              backdropFilter: 'blur(10px)',
            }}
          >
            <h3
              className={`font-semibold uppercase tracking-wider ${isMobile ? 'mb-3 text-xs' : 'mb-4 text-sm'}`}
              style={{ color: '#d4a853' }}
            >
              Ring Controls
            </h3>

            {/* Enable/Disable Toggle */}
            <div className={`flex items-center justify-between ${isMobile ? 'mb-3' : 'mb-4'}`}>
              <span className={`text-gray-300 ${isMobile ? 'text-xs' : 'text-sm'}`}>Show Ring</span>
              <button
                onClick={() => setEnabled(!enabled)}
                className="relative h-6 w-11 rounded-full transition-colors"
                style={{
                  background: enabled ? 'rgba(212, 168, 83, 0.6)' : 'rgba(100, 100, 100, 0.4)',
                }}
              >
                <motion.div
                  className="absolute top-1 h-4 w-4 rounded-full bg-white"
                  animate={{ left: enabled ? '24px' : '4px' }}
                  transition={{ type: 'spring', stiffness: 500, damping: 30 }}
                />
              </button>
            </div>

            {/* Radius Slider */}
            <div className={isMobile ? 'mb-3' : 'mb-4'}>
              <div className={`flex items-center justify-between ${isMobile ? 'mb-1' : 'mb-2'}`}>
                <span className={`text-gray-300 ${isMobile ? 'text-xs' : 'text-sm'}`}>Ring Size</span>
                <span className={`font-mono ${isMobile ? 'text-xs' : 'text-sm'}`} style={{ color: '#d4a853' }}>
                  {radius.toFixed(1)}
                </span>
              </div>
              <input
                type="range"
                min="1"
                max="15"
                step="0.1"
                value={radius}
                onChange={(e) => setRadius(parseFloat(e.target.value))}
                className="h-2 w-full cursor-pointer appearance-none rounded-full"
                style={{
                  background: `linear-gradient(to right, #d4a853 0%, #d4a853 ${((radius - 1) / 14) * 100}%, rgba(100,100,100,0.4) ${((radius - 1) / 14) * 100}%, rgba(100,100,100,0.4) 100%)`,
                }}
              />
            </div>

            {/* Y Position Slider */}
            <div className={isMobile ? 'mb-3' : 'mb-4'}>
              <div className={`flex items-center justify-between ${isMobile ? 'mb-1' : 'mb-2'}`}>
                <span className={`text-gray-300 ${isMobile ? 'text-xs' : 'text-sm'}`}>Height</span>
                <span className={`font-mono ${isMobile ? 'text-xs' : 'text-sm'}`} style={{ color: '#d4a853' }}>
                  {yPosition.toFixed(1)}
                </span>
              </div>
              <input
                type="range"
                min="-10"
                max="5"
                step="0.1"
                value={yPosition}
                onChange={(e) => setYPosition(parseFloat(e.target.value))}
                className="h-2 w-full cursor-pointer appearance-none rounded-full"
                style={{
                  background: `linear-gradient(to right, #d4a853 0%, #d4a853 ${((yPosition + 10) / 15) * 100}%, rgba(100,100,100,0.4) ${((yPosition + 10) / 15) * 100}%, rgba(100,100,100,0.4) 100%)`,
                }}
              />
            </div>

            {/* Rotation Speed Slider */}
            <div className={isMobile ? 'mb-3' : 'mb-4'}>
              <div className={`flex items-center justify-between ${isMobile ? 'mb-1' : 'mb-2'}`}>
                <span className={`text-gray-300 ${isMobile ? 'text-xs' : 'text-sm'}`}>Rotation</span>
                <span className={`font-mono ${isMobile ? 'text-xs' : 'text-sm'}`} style={{ color: '#d4a853' }}>
                  {rotationSpeed.toFixed(1)}x
                </span>
              </div>
              <input
                type="range"
                min="0"
                max="2"
                step="0.1"
                value={rotationSpeed}
                onChange={(e) => setRotationSpeed(parseFloat(e.target.value))}
                className="h-2 w-full cursor-pointer appearance-none rounded-full"
                style={{
                  background: `linear-gradient(to right, #d4a853 0%, #d4a853 ${(rotationSpeed / 2) * 100}%, rgba(100,100,100,0.4) ${(rotationSpeed / 2) * 100}%, rgba(100,100,100,0.4) 100%)`,
                }}
              />
            </div>

            {/* Quick Presets */}
            <div className={`border-t border-gray-700 ${isMobile ? 'mt-3 pt-3' : 'mt-4 pt-4'}`}>
              <span className={`block uppercase tracking-wider text-gray-400 ${isMobile ? 'mb-1.5 text-[10px]' : 'mb-2 text-xs'}`}>
                Presets
              </span>
              <div className="flex gap-2">
                <button
                  onClick={() => {
                    setRadius(3)
                    setYPosition(-2)
                    setRotationSpeed(0.3)
                  }}
                  className={`flex-1 rounded transition-colors ${isMobile ? 'px-1.5 py-1 text-[10px]' : 'px-2 py-1.5 text-xs'}`}
                  style={{
                    background: 'rgba(212, 168, 83, 0.1)',
                    border: '1px solid rgba(212, 168, 83, 0.3)',
                    color: '#d4a853',
                  }}
                >
                  S
                </button>
                <button
                  onClick={() => {
                    setRadius(5.5)
                    setYPosition(-3.2)
                    setRotationSpeed(0.5)
                  }}
                  className={`flex-1 rounded transition-colors ${isMobile ? 'px-1.5 py-1 text-[10px]' : 'px-2 py-1.5 text-xs'}`}
                  style={{
                    background: 'rgba(212, 168, 83, 0.1)',
                    border: '1px solid rgba(212, 168, 83, 0.3)',
                    color: '#d4a853',
                  }}
                >
                  M
                </button>
                <button
                  onClick={() => {
                    setRadius(8)
                    setYPosition(-4)
                    setRotationSpeed(0.8)
                  }}
                  className={`flex-1 rounded transition-colors ${isMobile ? 'px-1.5 py-1 text-[10px]' : 'px-2 py-1.5 text-xs'}`}
                  style={{
                    background: 'rgba(212, 168, 83, 0.1)',
                    border: '1px solid rgba(212, 168, 83, 0.3)',
                    color: '#d4a853',
                  }}
                >
                  L
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
