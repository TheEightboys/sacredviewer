import { useRef, useState, useEffect, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useStore } from '../../store/useStore'
import { useAdminStore } from '../../store/useAdminStore'

function formatTime(seconds: number): string {
  const mins = Math.floor(seconds / 60)
  const secs = Math.floor(seconds % 60)
  return `${mins}:${secs.toString().padStart(2, '0')}`
}

function Placeholder() {
  return (
    <motion.div
      key="placeholder"
      initial={{ opacity: 0, x: 50 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: 50 }}
      transition={{ duration: 0.4, ease: 'easeOut' }}
      className="flex h-full items-center justify-center"
    >
      <div className="text-center text-white">
        <motion.div
          className="mb-4 text-6xl"
          animate={{ scale: [1, 1.1, 1] }}
          transition={{ duration: 2, repeat: Infinity }}
        >
          <svg className="mx-auto h-16 w-16 text-slate-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        </motion.div>
        <h2 className="text-xl font-semibold">Video Player</h2>
        <p className="mt-2 text-slate-400">Click a marker to play video</p>
      </div>
    </motion.div>
  )
}

function LoadingSpinner() {
  return (
    <div className="absolute inset-0 flex items-center justify-center bg-black/50">
      <motion.div
        className="h-12 w-12 rounded-full border-4 border-slate-600 border-t-blue-500"
        animate={{ rotate: 360 }}
        transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
      />
    </div>
  )
}

interface VideoContentProps {
  markerId: string
}

function VideoContent({ markerId }: VideoContentProps) {
  const videoRef = useRef<HTMLVideoElement>(null)
  const containerRef = useRef<HTMLDivElement>(null)
  const [isPlaying, setIsPlaying] = useState(true)
  const [isLoading, setIsLoading] = useState(true)
  const [progress, setProgress] = useState(0)
  const [currentTime, setCurrentTime] = useState(0)
  const [duration, setDuration] = useState(0)
  const [volume, setVolume] = useState(1)
  const [isMuted, setIsMuted] = useState(true)
  const [isFullscreen, setIsFullscreen] = useState(false)
  const [showControls, setShowControls] = useState(true)
  const controlsTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  const markers = useAdminStore((state) => state.config.markers)
  const marker = markers.find((m) => m.id === markerId)

  // Auto-hide controls
  const resetControlsTimeout = useCallback(() => {
    if (controlsTimeoutRef.current) {
      clearTimeout(controlsTimeoutRef.current)
    }
    setShowControls(true)
    if (isPlaying) {
      controlsTimeoutRef.current = setTimeout(() => {
        setShowControls(false)
      }, 3000)
    }
  }, [isPlaying])

  useEffect(() => {
    const video = videoRef.current
    if (video) {
      setIsLoading(true)
      video.load()
    }
  }, [markerId])

  useEffect(() => {
    return () => {
      if (controlsTimeoutRef.current) {
        clearTimeout(controlsTimeoutRef.current)
      }
    }
  }, [])

  // Fullscreen change listener
  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement)
    }
    document.addEventListener('fullscreenchange', handleFullscreenChange)
    return () => document.removeEventListener('fullscreenchange', handleFullscreenChange)
  }, [])

  const handleTimeUpdate = () => {
    const video = videoRef.current
    if (video && video.duration) {
      setCurrentTime(video.currentTime)
      setProgress((video.currentTime / video.duration) * 100)
    }
  }

  const handleLoadedMetadata = () => {
    const video = videoRef.current
    if (video) {
      setDuration(video.duration)
    }
  }

  const handleCanPlay = () => {
    setIsLoading(false)
  }

  const handleWaiting = () => {
    setIsLoading(true)
  }

  const handlePlaying = () => {
    setIsLoading(false)
    setIsPlaying(true)
    resetControlsTimeout()
  }

  const togglePlayPause = () => {
    const video = videoRef.current
    if (video) {
      if (isPlaying) {
        video.pause()
      } else {
        video.play()
      }
      setIsPlaying(!isPlaying)
    }
  }

  const handleProgressClick = (e: React.MouseEvent<HTMLDivElement>) => {
    const video = videoRef.current
    if (video && video.duration) {
      const rect = e.currentTarget.getBoundingClientRect()
      const clickX = e.clientX - rect.left
      const newTime = (clickX / rect.width) * video.duration
      video.currentTime = newTime
    }
  }

  const handleVolumeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const video = videoRef.current
    const newVolume = parseFloat(e.target.value)
    setVolume(newVolume)
    if (video) {
      video.volume = newVolume
      setIsMuted(newVolume === 0)
    }
  }

  const toggleMute = () => {
    const video = videoRef.current
    if (video) {
      if (isMuted) {
        video.volume = volume || 1
        video.muted = false
        setIsMuted(false)
      } else {
        video.muted = true
        setIsMuted(true)
      }
    }
  }

  const toggleFullscreen = async () => {
    if (!containerRef.current) return

    if (isFullscreen) {
      await document.exitFullscreen()
    } else {
      await containerRef.current.requestFullscreen()
    }
  }

  const togglePictureInPicture = async () => {
    const video = videoRef.current
    if (!video) return

    try {
      if (document.pictureInPictureElement) {
        await document.exitPictureInPicture()
      } else {
        await video.requestPictureInPicture()
      }
    } catch {
      // PiP not supported or failed
    }
  }

  const skip = (seconds: number) => {
    const video = videoRef.current
    if (video) {
      video.currentTime = Math.max(0, Math.min(video.duration, video.currentTime + seconds))
    }
  }

  if (!marker) return null

  const hasVideo = !!marker.videoUrl

  return (
    <motion.div
      key={markerId}
      initial={{ opacity: 0, x: 50 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -50 }}
      transition={{ duration: 0.4, ease: 'easeOut' }}
      className="flex h-full flex-col p-3 sm:p-6"
    >
      {/* Header */}
      <div className="mb-2 sm:mb-4">
        <h2 className="text-lg font-bold text-white sm:text-2xl">{marker.title}</h2>
        {marker.description && (
          <p className="mt-0.5 text-sm text-slate-400 sm:mt-1 sm:text-base">{marker.description}</p>
        )}
      </div>

      {/* Video Container */}
      <div
        ref={containerRef}
        className="group relative flex-1 overflow-hidden rounded-lg bg-black"
        onMouseMove={resetControlsTimeout}
        onMouseLeave={() => isPlaying && setShowControls(false)}
      >
        {hasVideo ? (
          <>
            <video
              ref={videoRef}
              src={marker.videoUrl}
              className="h-full w-full object-contain"
              data-html2canvas-ignore
              onClick={togglePlayPause}
              onTimeUpdate={handleTimeUpdate}
              onLoadedMetadata={handleLoadedMetadata}
              onCanPlay={handleCanPlay}
              onWaiting={handleWaiting}
              onPlaying={handlePlaying}
              onPlay={() => setIsPlaying(true)}
              onPause={() => { setIsPlaying(false); setShowControls(true) }}
              onEnded={() => { setIsPlaying(false); setShowControls(true) }}
              autoPlay
              muted
              loop
              playsInline
              preload="auto"
            />

            {/* Loading Spinner */}
            {isLoading && <LoadingSpinner />}

            {/* Play Button Overlay */}
            {!isPlaying && !isLoading && (
              <button
                onClick={togglePlayPause}
                className="absolute inset-0 flex items-center justify-center bg-black/30 transition-opacity hover:bg-black/40"
              >
                <div className="flex h-16 w-16 items-center justify-center rounded-full bg-white/20 text-white backdrop-blur-sm">
                  <svg className="h-8 w-8 translate-x-0.5" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M8 5v14l11-7z" />
                  </svg>
                </div>
              </button>
            )}

            {/* Controls Overlay */}
            <AnimatePresence>
              {showControls && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/80 to-transparent p-2 sm:p-4"
                >
                  {/* Progress Bar */}
                  <div
                    className="mb-2 h-1 cursor-pointer rounded-full bg-white/30 sm:mb-3"
                    onClick={handleProgressClick}
                  >
                    <div
                      className="h-full rounded-full bg-blue-500"
                      style={{ width: `${progress}%` }}
                    />
                  </div>

                  {/* Control Buttons */}
                  <div className="flex items-center gap-1 sm:gap-2">
                    {/* Play/Pause */}
                    <button
                      onClick={togglePlayPause}
                      className="p-1 text-white transition-colors hover:text-blue-400 sm:p-1.5"
                    >
                      {isPlaying ? (
                        <svg className="h-4 w-4 sm:h-5 sm:w-5" fill="currentColor" viewBox="0 0 24 24">
                          <path d="M6 4h4v16H6V4zm8 0h4v16h-4V4z" />
                        </svg>
                      ) : (
                        <svg className="h-4 w-4 sm:h-5 sm:w-5" fill="currentColor" viewBox="0 0 24 24">
                          <path d="M8 5v14l11-7z" />
                        </svg>
                      )}
                    </button>

                    {/* Skip Back */}
                    <button
                      onClick={() => skip(-10)}
                      className="p-1 text-white transition-colors hover:text-blue-400 sm:p-1.5"
                      title="Skip back 10s"
                    >
                      <svg className="h-3.5 w-3.5 sm:h-4 sm:w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12.066 11.2a1 1 0 000 1.6l5.334 4A1 1 0 0019 16V8a1 1 0 00-1.6-.8l-5.333 4zM4.066 11.2a1 1 0 000 1.6l5.334 4A1 1 0 0011 16V8a1 1 0 00-1.6-.8l-5.334 4z" />
                      </svg>
                    </button>

                    {/* Skip Forward */}
                    <button
                      onClick={() => skip(10)}
                      className="p-1 text-white transition-colors hover:text-blue-400 sm:p-1.5"
                      title="Skip forward 10s"
                    >
                      <svg className="h-3.5 w-3.5 sm:h-4 sm:w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11.933 12.8a1 1 0 000-1.6L6.6 7.2A1 1 0 005 8v8a1 1 0 001.6.8l5.333-4zM19.933 12.8a1 1 0 000-1.6l-5.333-4A1 1 0 0013 8v8a1 1 0 001.6.8l5.333-4z" />
                      </svg>
                    </button>

                    {/* Time */}
                    <span className="ml-1 whitespace-nowrap text-[10px] text-slate-300 sm:ml-2 sm:text-xs">
                      {formatTime(currentTime)} / {formatTime(duration)}
                    </span>

                    <div className="flex-1" />

                    {/* Volume — hidden on very small screens, mute button always visible */}
                    <div className="flex items-center gap-0.5 sm:gap-1">
                      <button
                        onClick={toggleMute}
                        className="p-1 text-white transition-colors hover:text-blue-400 sm:p-1.5"
                      >
                        {isMuted || volume === 0 ? (
                          <svg className="h-3.5 w-3.5 sm:h-4 sm:w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z" />
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2" />
                          </svg>
                        ) : (
                          <svg className="h-3.5 w-3.5 sm:h-4 sm:w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.536 8.464a5 5 0 010 7.072m2.828-9.9a9 9 0 010 12.728M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z" />
                          </svg>
                        )}
                      </button>
                      <input
                        type="range"
                        min="0"
                        max="1"
                        step="0.1"
                        value={isMuted ? 0 : volume}
                        onChange={handleVolumeChange}
                        className="hidden h-1 w-16 cursor-pointer accent-blue-500 sm:block"
                      />
                    </div>

                    {/* Picture in Picture — hidden on mobile */}
                    {'pictureInPictureEnabled' in document && (
                      <button
                        onClick={togglePictureInPicture}
                        className="hidden p-1 text-white transition-colors hover:text-blue-400 sm:block sm:p-1.5"
                        title="Picture in Picture"
                      >
                        <svg className="h-3.5 w-3.5 sm:h-4 sm:w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6a2 2 0 012-2h12a2 2 0 012 2v6a2 2 0 01-2 2h-3v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4a2 2 0 012-2h3V6z" />
                        </svg>
                      </button>
                    )}

                    {/* Fullscreen */}
                    <button
                      onClick={toggleFullscreen}
                      className="p-1 text-white transition-colors hover:text-blue-400 sm:p-1.5"
                      title="Fullscreen"
                    >
                      {isFullscreen ? (
                        <svg className="h-3.5 w-3.5 sm:h-4 sm:w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 9V4.5M9 9H4.5M9 9L3.75 3.75M9 15v4.5M9 15H4.5M9 15l-5.25 5.25M15 9h4.5M15 9V4.5M15 9l5.25-5.25M15 15h4.5M15 15v4.5m0-4.5l5.25 5.25" />
                        </svg>
                      ) : (
                        <svg className="h-3.5 w-3.5 sm:h-4 sm:w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 8V4m0 0h4M4 4l5 5m11-1V4m0 0h-4m4 0l-5 5M4 16v4m0 0h4m-4 0l5-5m11 5l-5-5m5 5v-4m0 4h-4" />
                        </svg>
                      )}
                    </button>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </>
        ) : (
          <div className="flex h-full items-center justify-center">
            <div className="text-center text-slate-500">
              <svg className="mx-auto mb-2 h-12 w-12" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
              </svg>
              <p>No video assigned</p>
            </div>
          </div>
        )}
      </div>
    </motion.div>
  )
}

export function VideoPlayer() {
  const selectedMarker = useStore((state) => state.selectedMarker)

  return (
    <div className="h-full w-full">
      <AnimatePresence mode="wait">
        {selectedMarker ? (
          <VideoContent markerId={selectedMarker} />
        ) : (
          <Placeholder />
        )}
      </AnimatePresence>
    </div>
  )
}
