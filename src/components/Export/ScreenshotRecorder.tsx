import { useState, useCallback, useRef, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useExportStore } from '../../store/useExportStore'

interface ScreenshotRecorderProps {
  canvasRef: React.RefObject<HTMLCanvasElement | null>
}

export function ScreenshotRecorder({ canvasRef }: ScreenshotRecorderProps) {
  const [showMenu, setShowMenu] = useState(false)
  const [screenshotTaken, setScreenshotTaken] = useState(false)
  const [recordingTime, setRecordingTime] = useState(0)

  const { isRecording, startRecording, stopRecording } = useExportStore()
  const recordingTimerRef = useRef<number | null>(null)

  // Update recording time
  useEffect(() => {
    if (isRecording) {
      const startTime = Date.now()
      recordingTimerRef.current = window.setInterval(() => {
        setRecordingTime(Math.floor((Date.now() - startTime) / 1000))
      }, 1000)
    } else {
      if (recordingTimerRef.current) {
        clearInterval(recordingTimerRef.current)
        recordingTimerRef.current = null
      }
      setRecordingTime(0)
    }

    return () => {
      if (recordingTimerRef.current) {
        clearInterval(recordingTimerRef.current)
      }
    }
  }, [isRecording])

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`
  }

  const takeScreenshot = useCallback(
    (highRes: boolean = false) => {
      // Find the canvas element from the Three.js scene
      const canvas = canvasRef.current || document.querySelector('canvas')
      if (!canvas) {
        console.error('Canvas not found')
        return
      }

      // Get the current canvas content
      let imageData: string

      if (highRes) {
        // For high-res, we'll capture at 2x resolution
        const scale = 2
        const tempCanvas = document.createElement('canvas')
        tempCanvas.width = canvas.width * scale
        tempCanvas.height = canvas.height * scale
        const ctx = tempCanvas.getContext('2d')
        if (ctx) {
          ctx.scale(scale, scale)
          ctx.drawImage(canvas, 0, 0)
          imageData = tempCanvas.toDataURL('image/png', 1.0)
        } else {
          imageData = canvas.toDataURL('image/png', 1.0)
        }
      } else {
        imageData = canvas.toDataURL('image/png', 1.0)
      }

      // Download the image
      const link = document.createElement('a')
      link.download = `building-viewer-${highRes ? 'hires-' : ''}${Date.now()}.png`
      link.href = imageData
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)

      // Show feedback
      setScreenshotTaken(true)
      setTimeout(() => setScreenshotTaken(false), 2000)
      setShowMenu(false)
    },
    [canvasRef]
  )

  const handleStartRecording = useCallback(async () => {
    const canvas = canvasRef.current || document.querySelector('canvas')
    if (!canvas) {
      console.error('Canvas not found')
      return
    }

    try {
      await startRecording(canvas as HTMLCanvasElement)
      setShowMenu(false)
    } catch (error) {
      console.error('Failed to start recording:', error)
      alert('Failed to start recording. Your browser may not support this feature.')
    }
  }, [canvasRef, startRecording])

  const handleStopRecording = useCallback(async () => {
    const blob = await stopRecording()
    if (blob) {
      // Download the video
      const url = URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.download = `building-viewer-recording-${Date.now()}.webm`
      link.href = url
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      URL.revokeObjectURL(url)
    }
  }, [stopRecording])

  return (
    <div className="relative">
      {/* Recording Indicator */}
      <AnimatePresence>
        {isRecording && (
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 20 }}
            className="absolute -left-32 top-1/2 flex -translate-y-1/2 items-center gap-2 rounded-lg bg-red-600 px-3 py-1.5 text-sm text-white shadow-lg"
          >
            <div className="h-2 w-2 animate-pulse rounded-full bg-white" />
            <span className="font-mono">{formatTime(recordingTime)}</span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Main Button */}
      <motion.button
        onClick={() => (isRecording ? handleStopRecording() : setShowMenu(!showMenu))}
        className={`flex h-8 w-8 items-center justify-center rounded-lg transition-colors ${
          isRecording
            ? 'bg-red-600 text-white hover:bg-red-500'
            : 'bg-black/40 text-white/70 backdrop-blur-sm hover:bg-black/50 hover:text-white'
        }`}
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        title={isRecording ? 'Stop Recording' : 'Screenshot & Recording'}
      >
        {isRecording ? (
          <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 24 24">
            <rect x="6" y="6" width="12" height="12" rx="1" />
          </svg>
        ) : (
          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z"
            />
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M15 13a3 3 0 11-6 0 3 3 0 016 0z"
            />
          </svg>
        )}
      </motion.button>

      {/* Screenshot Success Indicator */}
      <AnimatePresence>
        {screenshotTaken && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="absolute right-0 top-full mt-2 whitespace-nowrap rounded-lg bg-green-600 px-3 py-1.5 text-sm text-white shadow-lg"
          >
            Screenshot saved!
          </motion.div>
        )}
      </AnimatePresence>

      {/* Dropdown Menu */}
      <AnimatePresence>
        {showMenu && !isRecording && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="absolute right-0 top-full z-50 mt-2 w-56 overflow-hidden rounded-lg bg-slate-900/95 shadow-xl backdrop-blur-sm"
          >
            <div className="p-2">
              <p className="mb-2 px-3 text-xs font-semibold uppercase tracking-wider text-slate-500">
                Screenshot
              </p>
              <button
                onClick={() => takeScreenshot(false)}
                className="flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm text-slate-300 transition-colors hover:bg-slate-800 hover:text-white"
              >
                <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
                  />
                </svg>
                Normal Resolution
              </button>
              <button
                onClick={() => takeScreenshot(true)}
                className="flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm text-slate-300 transition-colors hover:bg-slate-800 hover:text-white"
              >
                <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0zM10 7v3m0 0v3m0-3h3m-3 0H7"
                  />
                </svg>
                High Resolution (2x)
              </button>
            </div>

            <div className="border-t border-slate-700 p-2">
              <p className="mb-2 px-3 text-xs font-semibold uppercase tracking-wider text-slate-500">
                Video Recording
              </p>
              <button
                onClick={handleStartRecording}
                className="flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm text-slate-300 transition-colors hover:bg-slate-800 hover:text-white"
              >
                <svg className="h-4 w-4 text-red-400" fill="currentColor" viewBox="0 0 24 24">
                  <circle cx="12" cy="12" r="8" />
                </svg>
                Start Recording
              </button>
              <p className="px-3 py-1 text-xs text-slate-500">
                Records your screen interaction as a video
              </p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
