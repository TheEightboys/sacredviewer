import { useCallback, useRef } from 'react'
import * as THREE from 'three'
import { TransitionType } from '../store/useTourStore'
import { useViewerStore } from '../store/useViewerStore'

interface UseTourCameraOptions {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  controlsRef: React.MutableRefObject<any>
  cameraRef: React.MutableRefObject<THREE.PerspectiveCamera | null>
}

interface MarkerPosition {
  position: [number, number, number]
}

export function useTourCamera({ controlsRef, cameraRef }: UseTourCameraOptions) {
  const animationRef = useRef<number | null>(null)
  const orbitAnimationRef = useRef<number | null>(null)
  const reduceMotion = useViewerStore((state) => state.reduceMotion)

  // Cancel any running animations
  const cancelAnimations = useCallback(() => {
    if (animationRef.current) {
      cancelAnimationFrame(animationRef.current)
      animationRef.current = null
    }
    if (orbitAnimationRef.current) {
      cancelAnimationFrame(orbitAnimationRef.current)
      orbitAnimationRef.current = null
    }
  }, [])

  // Calculate camera position for a marker
  const calculateCameraPosition = useCallback(
    (
      markerPosition: [number, number, number],
      distance: number = 5,
      angle?: [number, number]
    ): { position: THREE.Vector3; target: THREE.Vector3 } => {
      const target = new THREE.Vector3(...markerPosition)

      // Default angle: 45 degrees azimuth, 30 degrees polar
      const azimuth = angle?.[0] ?? Math.PI / 4
      const polar = angle?.[1] ?? Math.PI / 6

      // Calculate position using spherical coordinates
      const position = new THREE.Vector3(
        target.x + distance * Math.sin(polar) * Math.cos(azimuth),
        target.y + distance * Math.cos(polar),
        target.z + distance * Math.sin(polar) * Math.sin(azimuth)
      )

      return { position, target }
    },
    []
  )

  // Fly to transition - smooth camera movement
  const flyTo = useCallback(
    (
      targetPosition: THREE.Vector3,
      targetLookAt: THREE.Vector3,
      duration: number,
      onComplete?: () => void
    ) => {
      if (!controlsRef.current || !cameraRef.current) {
        onComplete?.()
        return
      }

      const camera = cameraRef.current
      const controls = controlsRef.current

      if (reduceMotion || duration <= 0) {
        camera.position.copy(targetPosition)
        controls.target.copy(targetLookAt)
        controls.update()
        onComplete?.()
        return
      }

      cancelAnimations()

      const startPos = camera.position.clone()
      const startTarget = controls.target.clone()
      const startTime = performance.now()

      const animate = () => {
        const elapsed = performance.now() - startTime
        const progress = Math.min(elapsed / duration, 1)
        // Ease in-out cubic for smooth movement
        const eased =
          progress < 0.5
            ? 4 * progress * progress * progress
            : 1 - Math.pow(-2 * progress + 2, 3) / 2

        camera.position.lerpVectors(startPos, targetPosition, eased)
        controls.target.lerpVectors(startTarget, targetLookAt, eased)
        controls.update()

        if (progress < 1) {
          animationRef.current = requestAnimationFrame(animate)
        } else {
          animationRef.current = null
          onComplete?.()
        }
      }

      animationRef.current = requestAnimationFrame(animate)
    },
    [controlsRef, cameraRef, reduceMotion, cancelAnimations]
  )

  // Fade transition - fade out, instant move, fade in (handled via CSS)
  const fadeTo = useCallback(
    (
      targetPosition: THREE.Vector3,
      targetLookAt: THREE.Vector3,
      duration: number,
      onComplete?: () => void
    ) => {
      if (!controlsRef.current || !cameraRef.current) {
        onComplete?.()
        return
      }

      const camera = cameraRef.current
      const controls = controlsRef.current

      cancelAnimations()

      // Instant move (fade is handled by component CSS)
      setTimeout(() => {
        camera.position.copy(targetPosition)
        controls.target.copy(targetLookAt)
        controls.update()
        onComplete?.()
      }, duration / 2)
    },
    [controlsRef, cameraRef, cancelAnimations]
  )

  // Orbit transition - fly to position while orbiting around target
  const orbitTo = useCallback(
    (
      targetPosition: THREE.Vector3,
      targetLookAt: THREE.Vector3,
      duration: number,
      onComplete?: () => void
    ) => {
      if (!controlsRef.current || !cameraRef.current) {
        onComplete?.()
        return
      }

      const camera = cameraRef.current
      const controls = controlsRef.current

      if (reduceMotion || duration <= 0) {
        camera.position.copy(targetPosition)
        controls.target.copy(targetLookAt)
        controls.update()
        onComplete?.()
        return
      }

      cancelAnimations()

      const startPos = camera.position.clone()
      const startTarget = controls.target.clone()
      const startTime = performance.now()

      // Calculate arc path parameters
      const startDistance = startPos.distanceTo(startTarget)
      const endDistance = targetPosition.distanceTo(targetLookAt)

      const animate = () => {
        const elapsed = performance.now() - startTime
        const progress = Math.min(elapsed / duration, 1)
        // Ease in-out for smooth orbit
        const eased =
          progress < 0.5
            ? 2 * progress * progress
            : 1 - Math.pow(-2 * progress + 2, 2) / 2

        // Interpolate target
        controls.target.lerpVectors(startTarget, targetLookAt, eased)

        // Calculate orbit angle (add a partial rotation)
        const orbitAngle = eased * Math.PI * 0.5 // Quarter turn

        // Calculate distance
        const currentDistance = THREE.MathUtils.lerp(startDistance, endDistance, eased)

        // Calculate position with orbit
        const spherical = new THREE.Spherical()
        spherical.setFromVector3(
          new THREE.Vector3().subVectors(
            progress < 0.5 ? startPos : targetPosition,
            progress < 0.5 ? startTarget : targetLookAt
          )
        )
        spherical.theta += orbitAngle * (progress < 0.5 ? 1 : -1)
        spherical.radius = currentDistance

        const offset = new THREE.Vector3().setFromSpherical(spherical)
        camera.position.copy(controls.target).add(offset)

        // Interpolate towards final position
        camera.position.lerp(targetPosition, eased * eased)

        controls.update()

        if (progress < 1) {
          orbitAnimationRef.current = requestAnimationFrame(animate)
        } else {
          orbitAnimationRef.current = null
          camera.position.copy(targetPosition)
          controls.target.copy(targetLookAt)
          controls.update()
          onComplete?.()
        }
      }

      orbitAnimationRef.current = requestAnimationFrame(animate)
    },
    [controlsRef, cameraRef, reduceMotion, cancelAnimations]
  )

  // Instant transition
  const instantTo = useCallback(
    (
      targetPosition: THREE.Vector3,
      targetLookAt: THREE.Vector3,
      onComplete?: () => void
    ) => {
      if (!controlsRef.current || !cameraRef.current) {
        onComplete?.()
        return
      }

      const camera = cameraRef.current
      const controls = controlsRef.current

      cancelAnimations()

      camera.position.copy(targetPosition)
      controls.target.copy(targetLookAt)
      controls.update()
      onComplete?.()
    },
    [controlsRef, cameraRef, cancelAnimations]
  )

  // Main navigation function
  const navigateToMarker = useCallback(
    (
      marker: MarkerPosition,
      transition: TransitionType,
      duration: number,
      options?: {
        distance?: number
        angle?: [number, number]
        onComplete?: () => void
      }
    ) => {
      const { position, target } = calculateCameraPosition(
        marker.position,
        options?.distance,
        options?.angle
      )

      switch (transition) {
        case 'fly':
          flyTo(position, target, duration, options?.onComplete)
          break
        case 'fade':
          fadeTo(position, target, duration, options?.onComplete)
          break
        case 'orbit':
          orbitTo(position, target, duration, options?.onComplete)
          break
        case 'instant':
        default:
          instantTo(position, target, options?.onComplete)
          break
      }
    },
    [calculateCameraPosition, flyTo, fadeTo, orbitTo, instantTo]
  )

  return {
    navigateToMarker,
    cancelAnimations,
    flyTo,
    fadeTo,
    orbitTo,
    instantTo,
    calculateCameraPosition,
  }
}
