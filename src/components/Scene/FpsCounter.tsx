import { useRef, useEffect } from 'react'
import { useFrame } from '@react-three/fiber'

// Simple pub/sub for FPS updates without causing React re-renders
const fpsListeners = new Set<(fps: number) => void>()
let currentFps = 60

export function subscribeFps(listener: (fps: number) => void) {
  fpsListeners.add(listener)
  // Immediately call with current value
  listener(currentFps)
  return () => fpsListeners.delete(listener)
}

export function getFps() {
  return currentFps
}

export function FpsCounter() {
  const frameCount = useRef(0)
  const lastTime = useRef(performance.now())

  useFrame(() => {
    frameCount.current++
    const now = performance.now()
    const elapsed = now - lastTime.current

    if (elapsed >= 1000) {
      currentFps = Math.round((frameCount.current * 1000) / elapsed)
      // Notify listeners without causing React state updates
      fpsListeners.forEach(listener => listener(currentFps))
      frameCount.current = 0
      lastTime.current = now
    }
  })

  return null
}

// Separate overlay component that displays FPS outside the canvas
export function FpsDisplay() {
  const displayRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const unsubscribe = subscribeFps((fps) => {
      if (displayRef.current) {
        displayRef.current.textContent = `${fps} FPS`
        // Update color based on FPS
        if (fps < 30) {
          displayRef.current.className = 'font-mono text-xs text-red-400'
        } else if (fps < 50) {
          displayRef.current.className = 'font-mono text-xs text-yellow-400'
        } else {
          displayRef.current.className = 'font-mono text-xs text-green-400'
        }
      }
    })
    return () => { unsubscribe() }
  }, [])

  return (
    <div
      ref={displayRef}
      className="font-mono text-xs text-green-400"
    >
      60 FPS
    </div>
  )
}
