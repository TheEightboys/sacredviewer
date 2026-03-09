import { useRef, useCallback, Suspense, useState, useMemo, useEffect } from 'react'
import { Canvas } from '@react-three/fiber'
import { OrbitControls, Environment, Bounds } from '@react-three/drei'
import * as THREE from 'three'
import { BuildingModel, modelBoundsStore } from './BuildingModel'
import { Markers } from './Markers'
import { MarkerConnections } from './MarkerConnections'
import { MarkerOverlays } from './MarkerOverlays'
import { MarkerEditPopup } from './MarkerEditPopup'
import { FpsCounter } from './FpsCounter'
import { SceneOverlay } from '../Controls'
import { TourPlayer, PresentationMode } from '../Tour'
import { useAdminStore } from '../../store/useAdminStore'
import { useMarkerPlacementStore } from '../../store/useMarkerPlacementStore'
import { useViewerStore, CameraView } from '../../store/useViewerStore'
import { usePerformanceStore } from '../../store/usePerformanceStore'
import { useTourStore, TransitionType } from '../../store/useTourStore'
import { useTourCamera } from '../../hooks/useTourCamera'
import { MarkerConfig } from '../../utils/configStorage'

function Lighting() {
  const highContrast = useViewerStore((state) => state.highContrast)
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
      <ambientLight intensity={highContrast ? 0.8 : 0.5} />
      <directionalLight
        position={[10, 10, 5]}
        intensity={highContrast ? 1.5 : 1}
        castShadow={castShadow}
        shadow-mapSize={castShadow ? [shadowMapSize, shadowMapSize] : undefined}
      />
      {highContrast && (
        <directionalLight position={[-10, 10, -5]} intensity={0.5} />
      )}
    </>
  )
}

interface CameraControllerProps {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  controlsRef: React.MutableRefObject<any>
}

function CameraController({ controlsRef }: CameraControllerProps) {
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const { autoRotate, autoRotateSpeed, reduceMotion } = useViewerStore()
  const [distances, setDistances] = useState({ min: 0.1, max: 1000 })

  // Update distances based on model size
  useEffect(() => {
    const updateDistances = () => {
      if (modelBoundsStore.size) {
        const maxDim = Math.max(
          modelBoundsStore.size.x,
          modelBoundsStore.size.y,
          modelBoundsStore.size.z
        )
        // Min distance: very close for details
        // Max distance: 10x model size for full view with plenty of margin
        setDistances({
          min: Math.max(0.1, maxDim * 0.05),
          max: Math.max(1000, maxDim * 10)
        })
      }
    }

    updateDistances()
    const unsubscribe = modelBoundsStore.subscribe(updateDistances)
    return () => { unsubscribe() }
  }, [])

  const handleStart = useCallback(() => {
    if (controlsRef.current) {
      controlsRef.current.autoRotate = false
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
      if (controlsRef.current && autoRotate) {
        controlsRef.current.autoRotate = true
      }
    }, 3000)
  }, [controlsRef, autoRotate])

  return (
    <OrbitControls
      ref={controlsRef}
      enablePan={true}
      enableZoom={true}
      enableRotate={true}
      minDistance={distances.min}
      maxDistance={distances.max}
      autoRotate={autoRotate}
      autoRotateSpeed={autoRotateSpeed}
      enableDamping={!reduceMotion}
      dampingFactor={0.05}
      onStart={handleStart}
      onEnd={handleEnd}
    />
  )
}

export function SceneContainer() {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const controlsRef = useRef<any>(null)
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null)
  const [canvasElement, setCanvasElement] = useState<HTMLCanvasElement | null>(null)

  const isEditMode = useAdminStore((state) => state.isEditMode)
  const markers = useAdminStore((state) => state.config.markers)
  const addMarker = useAdminStore((state) => state.addMarker)
  const updateMarker = useAdminStore((state) => state.updateMarker)
  const removeMarker = useAdminStore((state) => state.removeMarker)
  const { reduceMotion } = useViewerStore()
  const { presentationMode, getActiveTour, getCurrentStop } = useTourStore()

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

  // Handlers for marker editing
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

  // Tour camera controls
  const { navigateToMarker } = useTourCamera({ controlsRef, cameraRef })

  const animateCamera = useCallback(
    (targetPos: THREE.Vector3, targetLookAt: THREE.Vector3) => {
      if (!controlsRef.current || !cameraRef.current) return

      const camera = cameraRef.current
      const controls = controlsRef.current

      if (reduceMotion) {
        // Instant transition
        camera.position.copy(targetPos)
        controls.target.copy(targetLookAt)
        controls.update()
      } else {
        // Smooth animation
        const startPos = camera.position.clone()
        const startTarget = controls.target.clone()
        const duration = 800
        const startTime = performance.now()

        const animate = () => {
          const elapsed = performance.now() - startTime
          const progress = Math.min(elapsed / duration, 1)
          // Ease out cubic
          const eased = 1 - Math.pow(1 - progress, 3)

          camera.position.lerpVectors(startPos, targetPos, eased)
          controls.target.lerpVectors(startTarget, targetLookAt, eased)
          controls.update()

          if (progress < 1) {
            requestAnimationFrame(animate)
          }
        }
        animate()
      }
    },
    [reduceMotion]
  )

  const handleSelectView = useCallback(
    (view: CameraView) => {
      animateCamera(
        new THREE.Vector3(...view.position),
        new THREE.Vector3(...view.target)
      )
    },
    [animateCamera]
  )

  // Handle tour navigation to marker
  const handleNavigateToMarker = useCallback(
    (markerId: string, transition: string, duration: number) => {
      const marker = markers.find((m) => m.id === markerId)
      if (!marker) return

      const currentStop = getCurrentStop()
      navigateToMarker(
        { position: marker.position },
        transition as TransitionType,
        duration,
        {
          distance: currentStop?.cameraDistance ?? 5,
          angle: currentStop?.cameraAngle,
        }
      )
    },
    [markers, navigateToMarker, getCurrentStop]
  )

  const activeTour = getActiveTour()

  const { pixelRatio, shadowQuality, antialias, showFps } = usePerformanceStore()

  // Calculate shadow setting for Canvas
  const shadowsEnabled = shadowQuality !== 'off'

  return (
    <div className="relative h-full w-full">
      <Canvas
        shadows={shadowsEnabled}
        dpr={[1, pixelRatio]}
        performance={{ min: 0.5 }}
        camera={{ position: [5, 5, 5], fov: 50 }}
        gl={{ antialias }}
        className={`h-full w-full ${isEditMode ? 'cursor-crosshair' : ''}`}
        onCreated={({ camera, gl }) => {
          cameraRef.current = camera as THREE.PerspectiveCamera
          setCanvasElement(gl.domElement)
        }}
      >
        <Suspense fallback={null}>
          <Lighting />
          <Bounds fit observe margin={1.5}>
            <BuildingModel />
          </Bounds>
          <Markers />
          <MarkerConnections />
          <Environment preset="city" />
          <CameraController controlsRef={controlsRef} />
          {showFps && <FpsCounter />}
        </Suspense>
      </Canvas>

      <SceneOverlay onSelectView={handleSelectView} />

      {/* Tour Player */}
      {activeTour && activeTour.stops.length > 0 && (
        <TourPlayer onNavigateToMarker={handleNavigateToMarker} />
      )}

      {/* Presentation Mode Overlay */}
      {presentationMode && <PresentationMode />}

      {/* Marker Tooltips - rendered outside Canvas */}
      <MarkerOverlays camera={cameraRef.current} domElement={canvasElement} />

      {/* Marker Edit Popups - rendered outside Canvas to avoid R3F namespace errors */}
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
