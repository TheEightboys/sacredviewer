import { motion, AnimatePresence } from 'framer-motion'
import { useStore } from '../../store/useStore'

// ── Om symbol with gentle pulse ──
function OmSymbol() {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.8 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 1, ease: 'easeOut' }}
    >
      <svg width="52" height="52" viewBox="0 0 100 100" fill="none">
        <defs>
          <linearGradient id="omGrad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#f0d78c" />
            <stop offset="50%" stopColor="#d4a853" />
            <stop offset="100%" stopColor="#8b6914" />
          </linearGradient>
        </defs>
        <text
          x="50" y="72" textAnchor="middle"
          fill="url(#omGrad)" fontSize="60" fontFamily="serif"
          style={{ filter: 'drop-shadow(0 0 10px rgba(212,168,83,0.4))' }}
        >
          ॐ
        </text>
      </svg>
    </motion.div>
  )
}

// ── Temple outline — uses CSS stroke-draw for silky smoothness ──
function TempleSilhouette() {
  const mainTemple = 'M 70 175 L 70 115 L 55 115 L 62 95 L 58 95 L 65 75 L 62 75 L 70 50 L 75 35 L 80 25 L 85 20 L 90 25 L 95 35 L 100 50 L 108 75 L 105 75 L 112 95 L 108 95 L 115 115 L 100 115 L 100 175 Z'
  const leftTower = 'M 30 175 L 30 135 L 22 135 L 28 118 L 25 118 L 32 102 L 35 92 L 38 102 L 45 118 L 42 118 L 48 135 L 40 135 L 40 175 Z'
  const rightTower = 'M 130 175 L 130 135 L 122 135 L 128 118 L 125 118 L 132 102 L 135 92 L 138 102 L 145 118 L 142 118 L 148 135 L 140 135 L 140 175 Z'

  return (
    <svg width="170" height="185" viewBox="0 0 170 185" fill="none" className="preloader-temple">
      <defs>
        <filter id="glow">
          <feGaussianBlur stdDeviation="2" result="blur" />
          <feMerge><feMergeNode in="blur" /><feMergeNode in="SourceGraphic" /></feMerge>
        </filter>
      </defs>

      <path d={mainTemple} stroke="#d4a853" strokeWidth="1.2" fill="rgba(212,168,83,0.03)"
        filter="url(#glow)" className="temple-draw" style={{ '--d': '0s' } as any} />
      <path d={leftTower} stroke="rgba(212,168,83,0.7)" strokeWidth="1" fill="rgba(212,168,83,0.02)"
        filter="url(#glow)" className="temple-draw" style={{ '--d': '0.4s' } as any} />
      <path d={rightTower} stroke="rgba(212,168,83,0.7)" strokeWidth="1" fill="rgba(212,168,83,0.02)"
        filter="url(#glow)" className="temple-draw" style={{ '--d': '0.4s' } as any} />

      {/* Base */}
      <line x1="15" y1="176" x2="155" y2="176" stroke="#d4a853" strokeWidth="1.5"
        className="temple-draw" style={{ '--d': '0.8s' } as any} />

      {/* Door */}
      <rect x="78" y="148" width="14" height="27" rx="7" stroke="#d4a853" strokeWidth="0.8"
        fill="rgba(212,168,83,0.05)" className="temple-draw" style={{ '--d': '1.2s' } as any} />

      {/* Kalash */}
      <circle cx="85" cy="16" r="3" stroke="#d4a853" strokeWidth="1" fill="rgba(212,168,83,0.2)"
        className="temple-draw" style={{ '--d': '1.4s' } as any} />

      {/* Flag pole + flag */}
      <line x1="85" y1="13" x2="85" y2="5" stroke="#d4a853" strokeWidth="0.8"
        className="temple-draw" style={{ '--d': '1.6s' } as any} />
      <path d="M 85 5 L 92 7.5 L 85 10" stroke="#d4a853" strokeWidth="0.6"
        fill="rgba(212,168,83,0.15)" className="temple-draw" style={{ '--d': '1.7s' } as any} />
    </svg>
  )
}

// ── Smooth CSS progress bar ──
function ProgressBar({ progress }: { progress: number }) {
  return (
    <div className="relative w-56 sm:w-64 mx-auto">
      <div className="h-[2px] w-full overflow-hidden" style={{ background: 'rgba(212,168,83,0.1)' }}>
        <div
          className="h-full"
          style={{
            width: `${progress}%`,
            background: 'linear-gradient(90deg, rgba(212,168,83,0.3), #d4a853, #f0d78c)',
            boxShadow: '0 0 8px rgba(212,168,83,0.35)',
            transition: 'width 0.5s cubic-bezier(0.4, 0, 0.2, 1)',
          }}
        />
      </div>
      <div className="absolute -top-[3px] -left-1">
        <div className="w-2 h-2 rotate-45" style={{ background: '#d4a853', boxShadow: '0 0 4px rgba(212,168,83,0.4)' }} />
      </div>
      <div className="absolute -top-[3px] -right-1">
        <div className="w-2 h-2 rotate-45" style={{ background: progress >= 100 ? '#d4a853' : 'rgba(212,168,83,0.2)', transition: 'background 0.4s' }} />
      </div>
      <p
        className="text-center mt-2.5 font-mystical text-[11px] tracking-[0.3em] uppercase"
        style={{ color: 'rgba(212,168,83,0.5)' }}
      >
        {progress}%
      </p>
    </div>
  )
}

// ── Main Preloader ──
export function TemplePreloader() {
  const isLoading = useStore((s) => s.isLoading)
  const loadingProgress = useStore((s) => s.loadingProgress)
  const loadingPhase = useStore((s) => s.loadingPhase)

  return (
    <AnimatePresence>
      {isLoading && (
        <motion.div
          className="fixed inset-0 z-[200] flex flex-col items-center justify-center overflow-hidden"
          style={{ background: 'radial-gradient(ellipse at center 40%, #162d4a 0%, #0e1b2e 45%, #080f1a 100%)' }}
          initial={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.7, ease: [0.4, 0, 0.2, 1] }}
        >
          {/* CSS-only mandala rings for 60fps smoothness */}
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
            <div className="preloader-ring preloader-ring-1" />
            <div className="preloader-ring preloader-ring-2" />
            <div className="preloader-ring preloader-ring-3" />
          </div>

          {/* Subtle radial glow */}
          <div className="absolute preloader-glow" style={{
            width: 300, height: 300,
            background: 'radial-gradient(circle, rgba(212,168,83,0.06) 0%, transparent 70%)',
            left: '50%', top: '44%', transform: 'translate(-50%, -50%)',
          }} />

          {/* Temple + Om */}
          <div className="relative z-10 flex flex-col items-center">
            <OmSymbol />
            <div className="mt-1"><TempleSilhouette /></div>
          </div>

          {/* Phase text + progress */}
          <motion.div
            className="relative z-10 mt-5 flex flex-col items-center gap-3"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.3, duration: 0.5 }}
          >
            <AnimatePresence mode="wait">
              <motion.h2
                className="font-mystical text-sm sm:text-base md:text-lg tracking-wider text-center px-6"
                style={{ color: '#d4a853', textShadow: '0 0 14px rgba(212,168,83,0.3)' }}
                key={loadingPhase}
                initial={{ opacity: 0, y: 4 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -4 }}
                transition={{ duration: 0.3 }}
              >
                {loadingPhase}
              </motion.h2>
            </AnimatePresence>

            <ProgressBar progress={loadingProgress} />

            <div className="flex items-center gap-3 mt-1">
              <div className="w-10 h-[1px]" style={{ background: 'linear-gradient(90deg, transparent, rgba(212,168,83,0.3))' }} />
              <p className="font-elegant text-xs italic tracking-wide" style={{ color: 'rgba(212,168,83,0.35)' }}>
                श्री राम मंदिर
              </p>
              <div className="w-10 h-[1px]" style={{ background: 'linear-gradient(270deg, transparent, rgba(212,168,83,0.3))' }} />
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
