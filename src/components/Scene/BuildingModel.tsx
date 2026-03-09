import { useMemo, useCallback, useEffect, useRef, useState } from 'react'
import { Center, useBounds } from '@react-three/drei'
import { useSpring, animated } from '@react-spring/three'
import { ThreeEvent, useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import { DRACOLoader } from 'three/examples/jsm/loaders/DRACOLoader.js'
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js'
import { useAdminStore } from '../../store/useAdminStore'
import { useMarkerPlacementStore } from '../../store/useMarkerPlacementStore'
import { useViewerStore } from '../../store/useViewerStore'
import { useStore } from '../../store/useStore'

// Bundled preview model (~930 KB, loads instantly from same origin)
const PREVIEW_MODEL_PATH = '/models/building-preview.glb'
// Full-quality model (loaded from R2 in background)
const FULL_MODEL_PATH = 'https://pub-d91108a6d61c4699bbf1f5aa4cbe6572.r2.dev/models/building.glb'

// Configure Draco loader for compressed models
const dracoLoader = new DRACOLoader()
dracoLoader.setDecoderPath('https://www.gstatic.com/draco/versioned/decoders/1.5.6/')
dracoLoader.preload()

// Configure GLTF loader with Draco support
const gltfLoader = new GLTFLoader()
gltfLoader.setDRACOLoader(dracoLoader)

// Cross-fade speed: how fast the full model fades in over the preview (per second)
const CROSSFADE_SPEED = 2.0

/**
 * Hook to load a GLB model in the background via GLTFLoader.
 * Returns the loaded scene when ready, or null while loading / on error.
 * Never throws — errors are logged and the model stays null.
 */
function useBackgroundModel(url: string): THREE.Group | null {
  const [model, setModel] = useState<THREE.Group | null>(null)

  useEffect(() => {
    let cancelled = false

    gltfLoader.load(
      url,
      (gltf) => {
        if (!cancelled) setModel(gltf.scene)
      },
      undefined,
      (err) => {
        console.error(`Failed to load model (${url}):`, err)
      }
    )

    return () => { cancelled = true }
  }, [url])

  return model
}

// Hook to get responsive scale based on screen size
function useResponsiveScale() {
  const [screenScale, setScreenScale] = useState(1)

  useEffect(() => {
    const updateScale = () => {
      const width = window.innerWidth
      const height = window.innerHeight
      const minDimension = Math.min(width, height)

      if (minDimension < 400) {
        setScreenScale(0.6)
      } else if (minDimension < 600) {
        setScreenScale(0.7)
      } else if (minDimension < 768) {
        setScreenScale(0.8)
      } else if (minDimension < 1024) {
        setScreenScale(0.9)
      } else {
        setScreenScale(1)
      }
    }

    updateScale()
    window.addEventListener('resize', updateScale)
    return () => window.removeEventListener('resize', updateScale)
  }, [])

  return screenScale
}

// Store for model bounds - allows external access to model size
export const modelBoundsStore = {
  bounds: null as THREE.Box3 | null,
  size: null as THREE.Vector3 | null,
  center: null as THREE.Vector3 | null,
  currentModelUrl: null as string | null,
  isReady: false,
  listeners: new Set<() => void>(),
  setBounds(bounds: THREE.Box3, modelUrl: string) {
    this.bounds = bounds.clone()
    this.size = new THREE.Vector3()
    this.center = new THREE.Vector3()
    this.currentModelUrl = modelUrl
    bounds.getSize(this.size)
    bounds.getCenter(this.center)
    this.isReady = true
    this.listeners.forEach(l => l())
  },
  subscribe(listener: () => void) {
    this.listeners.add(listener)
    return () => this.listeners.delete(listener)
  }
}

/** Set all mesh materials in a scene to transparent at a given opacity */
function setSceneOpacity(scene: THREE.Object3D, opacity: number) {
  scene.traverse((child) => {
    if (!(child instanceof THREE.Mesh) || !child.material) return
    const mats = Array.isArray(child.material) ? child.material : [child.material]
    for (const mat of mats) {
      mat.transparent = true
      mat.opacity = opacity
      mat.needsUpdate = true
    }
  })
}

/** Finalize all mesh materials: remove forced transparency unless needed */
function finalizeScene(scene: THREE.Object3D, wireframe: boolean, transparent: boolean) {
  scene.traverse((child) => {
    if (!(child instanceof THREE.Mesh) || !child.material) return
    const mats = Array.isArray(child.material) ? child.material : [child.material]
    for (const mat of mats) {
      if (mat instanceof THREE.MeshStandardMaterial || mat instanceof THREE.MeshBasicMaterial) {
        mat.wireframe = wireframe
        mat.transparent = transparent
        mat.opacity = transparent ? 0.5 : 1
        mat.needsUpdate = true
      }
    }
  })
}

/** Clone all materials on meshes so we can mutate them safely */
function cloneMaterials(scene: THREE.Object3D) {
  scene.traverse((child) => {
    if (!(child instanceof THREE.Mesh) || !child.material) return
    if (Array.isArray(child.material)) {
      child.material = child.material.map((m: THREE.Material) => m.clone())
    } else {
      child.material = child.material.clone()
    }
  })
}

/**
 * Inner component: renders preview instantly, cross-fades to full model seamlessly.
 * Both models are rendered simultaneously during the transition — no gap, no rebuild.
 * If preview fails to load (e.g. missing from deployment), falls back to full model only.
 */
function BuildingModelInner() {
  const config = useAdminStore((state) => state.config)
  const isEditMode = useAdminStore((state) => state.isEditMode)

  const wireframe = useViewerStore((state) => state.wireframe)
  const transparent = useViewerStore((state) => state.transparent)

  const setPreviewPosition = useMarkerPlacementStore((state) => state.setPreviewPosition)
  const startNewMarker = useMarkerPlacementStore((state) => state.startNewMarker)
  const newMarker = useMarkerPlacementStore((state) => state.newMarker)
  const editingMarkerId = useMarkerPlacementStore((state) => state.editingMarkerId)

  const setIsLoading = useStore((state) => state.setIsLoading)

  // Both models load via background loader (never throws, returns null on error)
  const previewScene = useBackgroundModel(PREVIEW_MODEL_PATH)
  const fullModelScene = useBackgroundModel(FULL_MODEL_PATH)

  // Report to store when first model is ready so loading overlay can dismiss
  const reportedRef = useRef(false)
  useEffect(() => {
    if ((previewScene || fullModelScene) && !reportedRef.current) {
      reportedRef.current = true
      setIsLoading(false)
    }
  }, [previewScene, fullModelScene, setIsLoading])

  const bounds = useBounds()
  const fittedRef = useRef(false)
  const groupRef = useRef<THREE.Group>(null)
  const boundsCalculatedRef = useRef(false)
  const responsiveScale = useResponsiveScale()

  // Clone scenes for safe material mutation
  const clonedPreview = useMemo(() => {
    if (!previewScene) return null
    const clone = previewScene.clone()
    cloneMaterials(clone)
    return clone
  }, [previewScene])

  const clonedFull = useMemo(() => {
    if (!fullModelScene) return null
    const clone = fullModelScene.clone()
    cloneMaterials(clone)
    // Start full model fully transparent if preview is available — it will cross-fade in
    // If no preview, show full model immediately at full opacity
    if (previewScene) setSceneOpacity(clone, 0)
    return clone
  }, [fullModelScene, previewScene])

  // Cross-fade state
  const crossfadeRef = useRef(0) // 0 = showing preview, 1 = fully transitioned
  const [transitionDone, setTransitionDone] = useState(false)

  // If preview failed but full model loaded, mark transition as done immediately
  useEffect(() => {
    if (!previewScene && clonedFull && !transitionDone) {
      finalizeScene(clonedFull, wireframe, transparent)
      setTransitionDone(true)
    }
  }, [previewScene, clonedFull, transitionDone, wireframe, transparent])

  // Per-frame cross-fade: fade full model in, fade preview out, then remove preview
  useFrame((_, delta) => {
    if (!clonedFull || !clonedPreview || transitionDone) return

    crossfadeRef.current = Math.min(1, crossfadeRef.current + delta * CROSSFADE_SPEED)
    const t = crossfadeRef.current

    // Full model fades in
    setSceneOpacity(clonedFull, t)
    // Preview fades out (starts fading at t=0.3 so there's always something visible)
    const previewOpacity = Math.max(0, 1 - (t - 0.3) / 0.7)
    setSceneOpacity(clonedPreview, previewOpacity)

    if (t >= 1) {
      // Finalize full model materials
      finalizeScene(clonedFull, wireframe, transparent)
      setTransitionDone(true)
    }
  })

  // Apply viewer settings (wireframe/transparent) when toggled after transition
  useEffect(() => {
    if (!transitionDone || !clonedFull) return
    finalizeScene(clonedFull, wireframe, transparent)
  }, [clonedFull, wireframe, transparent, transitionDone])

  // Calculate model bounds
  useFrame(() => {
    if (groupRef.current && !boundsCalculatedRef.current) {
      const box = new THREE.Box3().setFromObject(groupRef.current)
      if (box.max.x - box.min.x > 0.001) {
        modelBoundsStore.setBounds(box, FULL_MODEL_PATH)
        boundsCalculatedRef.current = true
      }
    }
  })

  // Fit camera to model when first model (preview or full) arrives
  const firstModel = clonedPreview || clonedFull
  useEffect(() => {
    if (firstModel && !fittedRef.current) {
      fittedRef.current = true

      const fitCamera = () => { bounds.refresh().fit() }
      const timer1 = setTimeout(fitCamera, 100)
      const timer2 = setTimeout(fitCamera, 300)
      const timer3 = setTimeout(fitCamera, 600)

      return () => {
        clearTimeout(timer1)
        clearTimeout(timer2)
        clearTimeout(timer3)
      }
    }
  }, [firstModel, bounds])

  const rotationRad: [number, number, number] = useMemo(
    () => [
      (config.rotation[0] * Math.PI) / 180,
      (config.rotation[1] * Math.PI) / 180,
      (config.rotation[2] * Math.PI) / 180,
    ],
    [config.rotation]
  )

  const finalScale = config.scale * responsiveScale

  const { scale } = useSpring({
    from: { scale: 0 },
    to: { scale: finalScale },
    config: { tension: 200, friction: 20 },
  })

  const handlePointerMove = useCallback(
    (e: ThreeEvent<PointerEvent>) => {
      if (!isEditMode || newMarker || editingMarkerId) return
      e.stopPropagation()
      const point = e.point
      setPreviewPosition([point.x, point.y, point.z])
    },
    [isEditMode, newMarker, editingMarkerId, setPreviewPosition]
  )

  const handlePointerLeave = useCallback(() => {
    setPreviewPosition(null)
  }, [setPreviewPosition])

  const handleClick = useCallback(
    (e: ThreeEvent<MouseEvent>) => {
      if (!isEditMode || newMarker || editingMarkerId) return
      e.stopPropagation()
      const point = e.point
      startNewMarker([point.x, point.y, point.z])
    },
    [isEditMode, newMarker, editingMarkerId, startNewMarker]
  )

  // Nothing loaded yet — render empty group (no crash)
  if (!clonedPreview && !clonedFull) {
    return (
      <animated.group ref={groupRef} scale={scale} position={config.position} rotation={rotationRad} />
    )
  }

  // - Before full model loads: preview only (with pointer events)
  // - During cross-fade: both rendered, full on top fading in
  // - After transition: full only, preview removed for performance
  const showPreview = !!clonedPreview && !transitionDone
  const showFull = !!clonedFull

  return (
    <animated.group
      ref={groupRef}
      scale={scale}
      position={config.position}
      rotation={rotationRad}
    >
      <Center>
        {showPreview && (
          <primitive
            object={clonedPreview}
            {...(!showFull ? {
              onPointerMove: handlePointerMove,
              onPointerLeave: handlePointerLeave,
              onClick: handleClick,
            } : {})}
          />
        )}
        {showFull && (
          <primitive
            object={clonedFull}
            onPointerMove={handlePointerMove}
            onPointerLeave={handlePointerLeave}
            onClick={handleClick}
          />
        )}
      </Center>
    </animated.group>
  )
}

export function BuildingModel() {
  return <BuildingModelInner />
}
