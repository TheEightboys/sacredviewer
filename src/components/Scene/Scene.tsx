import { Suspense, useRef, useCallback } from 'react'
import { Canvas } from '@react-three/fiber'
import { OrbitControls, Environment } from '@react-three/drei'
import { BuildingModel } from './BuildingModel'
import { Markers } from './Markers'
import { useAdminStore } from '../../store/useAdminStore'

function Lighting() {
  return (
    <>
      <ambientLight intensity={0.5} />
      <directionalLight
        position={[10, 10, 5]}
        intensity={1}
        castShadow
        shadow-mapSize={[1024, 1024]}
      />
    </>
  )
}

function CameraControls() {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const controlsRef = useRef<any>(null)
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  const handleStart = useCallback(() => {
    // User started interacting - stop auto-rotate
    if (controlsRef.current) {
      controlsRef.current.autoRotate = false
    }
    // Clear any pending resume timeout
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current)
      timeoutRef.current = null
    }
  }, [])

  const handleEnd = useCallback(() => {
    // User stopped interacting - resume auto-rotate after 3 seconds
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current)
    }
    timeoutRef.current = setTimeout(() => {
      if (controlsRef.current) {
        controlsRef.current.autoRotate = true
      }
    }, 3000)
  }, [])

  return (
    <OrbitControls
      ref={controlsRef}
      enablePan={true}
      enableZoom={true}
      enableRotate={true}
      minDistance={2}
      maxDistance={20}
      autoRotate={true}
      autoRotateSpeed={0.5}
      onStart={handleStart}
      onEnd={handleEnd}
    />
  )
}

export function Scene() {
  const isEditMode = useAdminStore((state) => state.isEditMode)

  return (
    <Canvas
      shadows
      dpr={[1, 2]}
      performance={{ min: 0.5 }}
      camera={{ position: [5, 5, 5], fov: 50 }}
      className={`h-full w-full ${isEditMode ? 'cursor-crosshair' : ''}`}
    >
      <Suspense fallback={null}>
        <Lighting />
        <BuildingModel />
        <Markers />
        <Environment preset="city" />
        <CameraControls />
      </Suspense>
    </Canvas>
  )
}
