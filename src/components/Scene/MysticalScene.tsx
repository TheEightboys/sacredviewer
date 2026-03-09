import { useRef, useCallback, Suspense, useState, useMemo, useEffect } from 'react'
import { Canvas, useThree } from '@react-three/fiber'
import { OrbitControls, Bounds, Stars, GradientTexture } from '@react-three/drei'
import * as THREE from 'three'
import { BuildingModel, modelBoundsStore } from './BuildingModel'
import { MysticalMarker } from './MysticalMarker'
import { MarkerConnections } from './MarkerConnections'
import { MarkerEditPopup } from './MarkerEditPopup'
import { FpsCounter } from './FpsCounter'
import { GoldenPedestal } from './GoldenPedestal'
import { AtmosphericEffects } from './AtmosphericEffects'
import { useAdminStore } from '../../store/useAdminStore'
import { useMarkerPlacementStore } from '../../store/useMarkerPlacementStore'
import { useViewerStore } from '../../store/useViewerStore'
import { usePerformanceStore } from '../../store/usePerformanceStore'
import { useStore } from '../../store/useStore'
import { MarkerConfig } from '../../utils/configStorage'

// Beautiful gradient sky sphere - dusk/mystical blue theme
function SkyBackground() {
  const { scene } = useThree()

  useEffect(() => {
    // Set scene background color as fallback
    scene.background = new THREE.Color('#1a2040')
  }, [scene])

  return (
    <mesh scale={[-1, 1, 1]}>
      <sphereGeometry args={[100, 32, 32]} />
      <meshBasicMaterial side={THREE.BackSide}>
        <GradientTexture
          stops={[0, 0.15, 0.3, 0.5, 0.7, 0.85, 1]}
          colors={[
            '#0a1525',   // Deep navy at bottom
            '#152540',   // Dark blue
            '#1e3a5f',   // Medium blue
            '#2d5a7a',   // Sky blue
            '#4a7a9a',   // Light sky blue
            '#6a9ab8',   // Soft blue
            '#8ab4cc',   // Pale blue at top
          ]}
        />
      </meshBasicMaterial>
    </mesh>
  )
}

// Mystical ambient lighting - blue atmosphere with warm golden accents
function MysticalLighting() {
  const shadowQuality = usePerformanceStore((state) => state.shadowQuality)

  const shadowMapSize = useMemo(() => {
    switch (shadowQuality) {
      case 'low': return 512
      case 'medium': return 1024
      case 'high': return 2048
      default: return 0
    }
  }, [shadowQuality])

  const castShadow = shadowQuality !== 'off'

  return (
    <>
      {/* Main ambient - soft blue-white for natural feel */}
      <ambientLight intensity={0.6} color="#d4e4f0" />

      {/* Key light - warm sunlight from above */}
      <directionalLight
        position={[10, 15, 5]}
        intensity={1.3}
        color="#fff5e6"
        castShadow={castShadow}
        shadow-mapSize={castShadow ? [shadowMapSize, shadowMapSize] : undefined}
      />

      {/* Fill light - soft blue sky light */}
      <directionalLight
        position={[-10, 8, -10]}
        intensity={0.5}
        color="#8bb8d8"
      />

      {/* Back light - cool blue for atmosphere */}
      <directionalLight
        position={[0, 5, -15]}
        intensity={0.35}
        color="#7aa8c8"
      />

      {/* Rim light - warm golden accent for contrast */}
      <directionalLight
        position={[0, -5, 10]}
        intensity={0.4}
        color="#d4a853"
      />

      {/* Point light at center for mystical golden glow */}
      <pointLight
        position={[0, 2, 0]}
        intensity={0.7}
        color="#d4a853"
        distance={15}
        decay={2}
      />

      {/* Blue accent lights for atmosphere */}
      <pointLight
        position={[-8, 6, 8]}
        intensity={0.25}
        color="#6a9fc8"
        distance={20}
        decay={2}
      />
      <pointLight
        position={[8, 6, -8]}
        intensity={0.25}
        color="#5a8fb8"
        distance={20}
        decay={2}
      />
    </>
  )
}

// Camera controller - shifts view left when marker selected so model stays visible
interface CameraControllerProps {
  controlsRef: React.MutableRefObject<unknown>
}

function CameraController({ controlsRef }: CameraControllerProps) {
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const { autoRotate, reduceMotion } = useViewerStore()
  const [distances, setDistances] = useState({ min: 0.1, max: 1000 })
  const selectedMarker = useStore((state) => state.selectedMarker)
  const { camera } = useThree()

  // Update distances based on model size
  useEffect(() => {
    const updateDistances = () => {
      if (modelBoundsStore.size) {
        const maxDim = Math.max(
          modelBoundsStore.size.x,
          modelBoundsStore.size.y,
          modelBoundsStore.size.z
        )
        setDistances({
          min: Math.max(0.5, maxDim * 0.3),
          max: Math.max(1000, maxDim * 10)
        })
      }
    }

    updateDistances()
    const unsubscribe = modelBoundsStore.subscribe(updateDistances)
    return () => { unsubscribe() }
  }, [])

  // Use camera view offset to shift the rendered view when marker is selected
  // Desktop: model on left, video on right
  // Mobile: model on top, video on bottom
  useEffect(() => {
    const perspCam = camera as THREE.PerspectiveCamera
    const isMobile = window.innerWidth < 768

    if (selectedMarker) {
      const width = window.innerWidth
      const height = window.innerHeight

      if (isMobile) {
        // Mobile: Shift view down so model appears on top
        // Offset Y by 20% of height to shift view down (model appears top 60%)
        perspCam.setViewOffset(width, height, 0, height * 0.2, width, height)
      } else {
        // Desktop: Shift view right so model appears on left
        // Offset X by 25% of width to shift view right (model appears left)
        perspCam.setViewOffset(width, height, width * 0.25, 0, width, height)
      }
    } else {
      // Clear view offset - centered view
      perspCam.clearViewOffset()
    }
    perspCam.updateProjectionMatrix()
  }, [selectedMarker, camera])

  // Update view offset on resize
  useEffect(() => {
    const handleResize = () => {
      const perspCam = camera as THREE.PerspectiveCamera
      const isMobile = window.innerWidth < 768

      if (selectedMarker) {
        const width = window.innerWidth
        const height = window.innerHeight

        if (isMobile) {
          perspCam.setViewOffset(width, height, 0, height * 0.2, width, height)
        } else {
          perspCam.setViewOffset(width, height, width * 0.25, 0, width, height)
        }
        perspCam.updateProjectionMatrix()
      }
    }

    window.addEventListener('resize', handleResize)
    return () => window.removeEventListener('resize', handleResize)
  }, [selectedMarker, camera])


  const handleStart = useCallback(() => {
    const controls = controlsRef.current as { autoRotate: boolean } | null
    if (controls) {
      controls.autoRotate = false
    }
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current)
      timeoutRef.current = null
    }
  }, [controlsRef])

  const handleEnd = useCallback(() => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current)
    }
    timeoutRef.current = setTimeout(() => {
      const controls = controlsRef.current as { autoRotate: boolean } | null
      if (controls && autoRotate) {
        controls.autoRotate = true
      }
    }, 3000)
  }, [controlsRef, autoRotate])

  return (
    <OrbitControls
      ref={controlsRef as React.MutableRefObject<null>}
      enablePan={false}
      enableZoom={true}
      enableRotate={true}
      minDistance={distances.min}
      maxDistance={distances.max}
      zoomSpeed={0.5}
      autoRotate={autoRotate}
      autoRotateSpeed={2}
      enableDamping={!reduceMotion}
      dampingFactor={0.05}
      // Limit vertical rotation - prevent viewing from bottom
      // minPolarAngle = 0 (top view), maxPolarAngle = Math.PI/2 (side view)
      // Setting max to ~80 degrees prevents seeing the bottom
      minPolarAngle={Math.PI * 0.1}  // ~18 degrees from top
      maxPolarAngle={Math.PI * 0.55} // ~81 degrees - just above horizontal, can't see bottom
      onStart={handleStart}
      onEnd={handleEnd}
    />
  )
}

// Markers container
function MysticalMarkers() {
  const markers = useAdminStore((state) => state.config.markers)

  return (
    <>
      {markers.map((marker) => (
        <MysticalMarker key={marker.id} marker={marker} />
      ))}
    </>
  )
}

export function MysticalScene() {
  const controlsRef = useRef<unknown>(null)
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null)

  const isEditMode = useAdminStore((state) => state.isEditMode)
  const markers = useAdminStore((state) => state.config.markers)
  const addMarker = useAdminStore((state) => state.addMarker)
  const updateMarker = useAdminStore((state) => state.updateMarker)
  const removeMarker = useAdminStore((state) => state.removeMarker)

  // Marker placement state
  const newMarker = useMarkerPlacementStore((state) => state.newMarker)
  const newMarkerPosition = useMarkerPlacementStore((state) => state.newMarkerPosition)
  const clearNewMarker = useMarkerPlacementStore((state) => state.clearNewMarker)
  const editingMarkerId = useMarkerPlacementStore((state) => state.editingMarkerId)
  const setEditingMarkerId = useMarkerPlacementStore((state) => state.setEditingMarkerId)

  // Get the marker being edited
  const editingMarker = useMemo(() => {
    if (!editingMarkerId) return null
    return markers.find((m) => m.id === editingMarkerId) || null
  }, [editingMarkerId, markers])

  // Handlers
  const handleSaveNewMarker = useCallback((marker: MarkerConfig) => {
    addMarker(marker)
    clearNewMarker()
  }, [addMarker, clearNewMarker])

  const handleCancelNewMarker = useCallback(() => {
    clearNewMarker()
  }, [clearNewMarker])

  const handleSaveEditMarker = useCallback((marker: MarkerConfig) => {
    updateMarker(marker.id, marker)
    setEditingMarkerId(null)
  }, [updateMarker, setEditingMarkerId])

  const handleDeleteMarker = useCallback(() => {
    if (editingMarkerId) {
      removeMarker(editingMarkerId)
      setEditingMarkerId(null)
    }
  }, [editingMarkerId, removeMarker, setEditingMarkerId])

  const handleCancelEditMarker = useCallback(() => {
    setEditingMarkerId(null)
  }, [setEditingMarkerId])

  const { pixelRatio, shadowQuality, antialias, showFps } = usePerformanceStore()
  const shadowsEnabled = shadowQuality !== 'off'

  return (
    <div className="relative h-full w-full">
      <Canvas
        shadows={shadowsEnabled}
        dpr={[1, pixelRatio]}
        performance={{ min: 0.5 }}
        camera={{ position: [8, 6, 8], fov: 100 }}
        gl={{ antialias, alpha: true, preserveDrawingBuffer: true }}
        className={`h-full w-full ${isEditMode ? 'cursor-crosshair' : ''}`}
        style={{ background: 'transparent' }}
        onCreated={({ camera }) => {
          cameraRef.current = camera as THREE.PerspectiveCamera
        }}
      >
        <Suspense fallback={null}>
          {/* Colorful gradient sky background */}
          <SkyBackground />

          {/* Stars with color saturation for mystical feel */}
          <Stars
            radius={100}
            depth={50}
            count={3000}
            factor={4}
            saturation={0.8}
            fade
            speed={0.3}
          />

          {/* Blue-tinted fog for depth */}
          <fog attach="fog" args={['#1a2540', 20, 60]} />

          <MysticalLighting />

          {/* Atmospheric effects - rain, clouds, particles */}
          <AtmosphericEffects
            enableRain={true}
            enableClouds={true}
            enableParticles={true}
            rainCount={500}
            particleCount={60}
          />

          <Bounds fit observe margin={1.0}>
            <BuildingModel />
            {/* Markers inside Bounds so they move with the model */}
            <MysticalMarkers />
            <MarkerConnections />
          </Bounds>

          {/* Golden ring pedestal - position controlled via RingControlPanel */}
          <GoldenPedestal />

          <CameraController controlsRef={controlsRef} />
          {showFps && <FpsCounter />}
        </Suspense>
      </Canvas>

      {/* Marker Edit Popups */}
      {isEditMode && newMarker && newMarkerPosition && (
        <MarkerEditPopup
          marker={newMarker}
          position={newMarkerPosition}
          onSave={handleSaveNewMarker}
          onCancel={handleCancelNewMarker}
          isNew
        />
      )}

      {isEditMode && editingMarker && (
        <MarkerEditPopup
          marker={editingMarker}
          position={editingMarker.position}
          onSave={handleSaveEditMarker}
          onDelete={handleDeleteMarker}
          onCancel={handleCancelEditMarker}
        />
      )}
    </div>
  )
}
