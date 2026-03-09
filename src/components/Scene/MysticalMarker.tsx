import { useRef, useState, useEffect, useMemo } from 'react'
import { useFrame, useThree, ThreeEvent } from '@react-three/fiber'
import { useSpring, animated } from '@react-spring/three'
import { Html } from '@react-three/drei'
import { Mesh, Plane, Vector3, Raycaster, Vector2, Object3D } from 'three'
import { useStore } from '../../store/useStore'
import { useAdminStore } from '../../store/useAdminStore'
import { useMarkerPlacementStore } from '../../store/useMarkerPlacementStore'
import { useMarkerStore } from '../../store/useMarkerStore'
import { setMarkerHovered } from './MarkerOverlays'
import { MarkerConfig, MarkerIcon } from '../../utils/configStorage'

// Mystical icon SVG paths - all designed to fit in a 16x16 viewBox centered at 8,8
const MARKER_ICONS: Record<MarkerIcon, { path: string; viewBox?: string }> = {
  skull: {
    path: `M8 2C5 2 3 4.5 3 7c0 1.5.5 2.8 1.3 3.7-.2.5-.3 1.2-.3 2.3 0 1.5.8 2 2 2v1h1v-1h2v1h1v-1c1.2 0 2-.5 2-2 0-1.1-.1-1.8-.3-2.3.8-.9 1.3-2.2 1.3-3.7 0-2.5-2-5-5-5zm-2 6a1 1 0 110-2 1 1 0 010 2zm4 0a1 1 0 110-2 1 1 0 010 2zm-2 3.5l-1-1h2l-1 1z`,
  },
  fire: {
    path: `M8 1c0 2-1.5 3-2 5-.3 1.3.5 3 2 4 .5-1 .3-2 1-3 .5 1.5 2 2.5 2 4.5 0 2-1.5 3.5-3.5 3.5S4 13.5 4 11.5c0-2.5 1.5-4 2-5.5.3-1-1-2.5-1-4C6.5 3.5 8 3 8 1z`,
  },
  scroll: {
    path: `M4 3c-.5 0-1 .5-1 1v8c0 .5.5 1 1 1h1v1c0 .5.5 1 1 1h6c.5 0 1-.5 1-1V5c0-.5-.5-1-1-1h-1V3c0-.5-.5-1-1-1H4zm1 2h6v8H5V5zm1 1v1h4V6H6zm0 2v1h4V8H6zm0 2v1h3v-1H6z`,
  },
  candle: {
    path: `M7 3c0-1 1-2 1-2s1 1 1 2c0 .5-.2 1-.5 1.3.3.2.5.4.5.7v1h-2V5c0-.3.2-.5.5-.7-.3-.3-.5-.8-.5-1.3zM6 6h4v1H6V6zm.5 2h3l.5 6H6l.5-6z`,
  },
  lotus: {
    path: `M8 2c-.5 1.5-2 3-2 4.5 0 .8.3 1.5 1 2-.7.5-1 1.2-1 2 0 1.5 1.5 2.5 2 3.5.5-1 2-2 2-3.5 0-.8-.3-1.5-1-2 .7-.5 1-1.2 1-2 0-1.5-1.5-3-2-4.5zM5 6c-1 .5-2 1.5-2 3s1 2.5 2 3c-.5-1-.5-2 0-3s.5-2 0-3zm6 0c1 .5 2 1.5 2 3s-1 2.5-2 3c.5-1 .5-2 0-3s-.5-2 0-3z`,
  },
  om: {
    path: `M4 8c0-1.5 1-3 2.5-3 1 0 1.5.5 2 1-.5.5-1 1-1 2s.5 1.5 1 2c-1 1.5-3 1.5-4 0-.3-.5-.5-1.2-.5-2zm6-3c1 0 2 1 2 2s-.5 1.5-1 2h1.5c.5 0 1 .5 1 1s-.5 1-1 1H10c-.5 1-1.5 2-3 2v-1c1 0 2-.5 2.5-1.5-.5-.3-1-.8-1-1.5 0-1 .5-2 1.5-3zm1-2c.5 0 1 .5 1 1s-.5 1-1 1-1-.5-1-1 .5-1 1-1z`,
  },
  eye: {
    path: `M8 4C4.5 4 2 8 2 8s2.5 4 6 4 6-4 6-4-2.5-4-6-4zm0 6.5c-1.4 0-2.5-1.1-2.5-2.5S6.6 5.5 8 5.5s2.5 1.1 2.5 2.5-1.1 2.5-2.5 2.5zm0-4c-.8 0-1.5.7-1.5 1.5s.7 1.5 1.5 1.5 1.5-.7 1.5-1.5-.7-1.5-1.5-1.5z`,
  },
  moon: {
    path: `M8 2c-3.3 0-6 2.7-6 6s2.7 6 6 6c.8 0 1.5-.2 2.2-.4-1.3-1-2.2-2.6-2.2-4.6s.9-3.6 2.2-4.6c-.7-.3-1.4-.4-2.2-.4z`,
  },
  star: {
    path: `M8 1l2 5h5l-4 3.5 1.5 5.5L8 12l-4.5 3 1.5-5.5L1 6h5l2-5z`,
  },
  crystal: {
    path: `M8 1L4 6l4 9 4-9-4-5zm0 2.5L10 6H6l2-2.5zM5.5 7h5L8 12.5 5.5 7z`,
  },
  potion: {
    path: `M6 2v2H5v1h1v1.5L4 11c-.3.5-.3 1 0 1.5.3.4.7.5 1 .5h6c.3 0 .7-.1 1-.5.3-.5.3-1 0-1.5L10 6.5V5h1V4h-1V2H6zm1 1h2v2.5l2 4H5l2-4V3z`,
  },
  book: {
    path: `M3 3v10c0 .5.5 1 1 1h8c.5 0 1-.5 1-1V3c0-.5-.5-1-1-1H4c-.5 0-1 .5-1 1zm2 1h6v1H5V4zm0 2h6v1H5V6zm0 2h4v1H5V8z`,
  },
  key: {
    path: `M10.5 2c-1.4 0-2.5 1.1-2.5 2.5 0 .5.1.9.3 1.3L3 11v2h2v-1h1v-1h1l1-1 .7.2c.4.2.8.3 1.3.3 1.4 0 2.5-1.1 2.5-2.5S11.9 5.5 10.5 5.5zm0-1.5c-1.9 0-3.5 1.6-3.5 3.5 0 .4.1.8.2 1.1L2 10.8V14h3.2l.8-.8V12h1v-1h.5l.3-.3c.4.2.8.3 1.2.3 1.9 0 3.5-1.6 3.5-3.5S12.4 4 10.5 4zm1 2.5c.3 0 .5.2.5.5s-.2.5-.5.5-.5-.2-.5-.5.2-.5.5-.5z`,
  },
  compass: {
    path: `M8 2C4.7 2 2 4.7 2 8s2.7 6 6 6 6-2.7 6-6-2.7-6-6-6zm0 1c2.8 0 5 2.2 5 5s-2.2 5-5 5-5-2.2-5-5 2.2-5 5-5zm0 1.5L6 8l2 3.5L10 8 8 4.5z`,
  },
  none: {
    path: '',
  },
}

interface MysticalMarkerProps {
  marker: MarkerConfig
  onSelect?: (id: string) => void
}

// Hindu temple bell / singing bowl sound effect
const playTempleBellSound = () => {
  try {
    const audioContext = new (window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext)()

    // Create a rich, calming temple bell sound
    const createBellTone = (freq: number, delay: number, duration: number, volume: number, type: OscillatorType = 'sine') => {
      const osc = audioContext.createOscillator()
      const gain = audioContext.createGain()

      osc.connect(gain)
      gain.connect(audioContext.destination)

      osc.type = type
      osc.frequency.setValueAtTime(freq, audioContext.currentTime + delay)
      // Slight vibrato for warmth
      osc.frequency.setValueAtTime(freq * 1.002, audioContext.currentTime + delay + 0.3)
      osc.frequency.setValueAtTime(freq * 0.998, audioContext.currentTime + delay + 0.6)

      // Soft attack, very long peaceful decay
      gain.gain.setValueAtTime(0, audioContext.currentTime + delay)
      gain.gain.linearRampToValueAtTime(volume, audioContext.currentTime + delay + 0.01)
      gain.gain.exponentialRampToValueAtTime(volume * 0.7, audioContext.currentTime + delay + 0.3)
      gain.gain.exponentialRampToValueAtTime(0.001, audioContext.currentTime + delay + duration)

      osc.start(audioContext.currentTime + delay)
      osc.stop(audioContext.currentTime + delay + duration)
    }

    // Fundamental - deep Om frequency (136.1 Hz is the "Om" frequency)
    createBellTone(136.1, 0, 2.0, 0.12, 'sine')
    // Second harmonic
    createBellTone(272.2, 0.005, 1.5, 0.08, 'sine')
    // Third harmonic - bell shimmer
    createBellTone(408.3, 0.01, 1.0, 0.05, 'sine')
    // High overtone for brightness
    createBellTone(544.4, 0.015, 0.7, 0.03, 'sine')
    // Very high shimmer
    createBellTone(680.5, 0.02, 0.4, 0.015, 'sine')

  } catch {
    // Audio not supported
  }
}

export function MysticalMarker({ marker, onSelect }: MysticalMarkerProps) {
  const {
    id,
    position,
    title,
    groupId,
    icon = 'none',
  } = marker

  // Occlusion state - hide marker when behind model
  const [isOccluded, setIsOccluded] = useState(false)
  const occlusionRaycaster = useMemo(() => new Raycaster(), [])

  const meshRef = useRef<Mesh>(null)
  const [hovered, setHovered] = useState(false)
  const [isDragging, setIsDragging] = useState(false)
  const [dragPosition, setDragPosition] = useState<[number, number, number]>(position)
  const floatOffset = useRef(0)

  const { camera, gl } = useThree()

  const selectedMarker = useStore((state) => state.selectedMarker)
  const setSelectedMarker = useStore((state) => state.setSelectedMarker)

  const isEditMode = useAdminStore((state) => state.isEditMode)
  const updateMarker = useAdminStore((state) => state.updateMarker)

  const editingMarkerId = useMarkerPlacementStore((state) => state.editingMarkerId)
  const setEditingMarkerId = useMarkerPlacementStore((state) => state.setEditingMarkerId)
  const draggingMarkerId = useMarkerPlacementStore((state) => state.draggingMarkerId)
  const setDraggingMarkerId = useMarkerPlacementStore((state) => state.setDraggingMarkerId)

  const isGroupVisible = useMarkerStore((state) => state.isGroupVisible)
  const activeGroupFilter = useMarkerStore((state) => state.activeGroupFilter)

  const isSelected = selectedMarker === id
  const isEditing = editingMarkerId === id
  const isBeingDragged = draggingMarkerId === id

  // Check visibility
  const isVisible = useMemo(() => {
    if (groupId && !isGroupVisible(groupId)) return false
    if (activeGroupFilter && groupId !== activeGroupFilter) return false
    return true
  }, [groupId, isGroupVisible, activeGroupFilter])

  // Ancient map marker colors
  const ancientGold = '#b8860b' // Dark golden rod
  const parchmentColor = '#f4e4bc' // Aged parchment
  const selectedGlow = '#ffd700'

  // Animation spring
  const { scale } = useSpring({
    scale: isSelected ? 1.3 : hovered ? 1.15 : 1,
    config: { tension: 300, friction: 20 },
  })

  // Gentle floating animation + occlusion check
  useFrame((state) => {
    floatOffset.current = Math.sin(state.clock.elapsedTime * 1.5 + position[0] * 2) * 0.02

    // Check if marker is occluded by the model (behind it from camera's view)
    const markerWorldPos = new Vector3(position[0], position[1], position[2])
    const cameraPos = state.camera.position.clone()
    const directionToMarker = markerWorldPos.clone().sub(cameraPos).normalize()
    const distanceToMarker = cameraPos.distanceTo(markerWorldPos)

    // Set up raycaster from camera towards marker
    occlusionRaycaster.set(cameraPos, directionToMarker)
    occlusionRaycaster.far = distanceToMarker

    // Find all meshes in the scene (excluding markers)
    const meshesToTest: Object3D[] = []
    state.scene.traverse((obj) => {
      if (obj instanceof Mesh && obj.name !== 'marker-mesh' && obj.visible) {
        // Skip very small objects (particles, etc) and transparent objects
        if (obj.geometry && obj.material) {
          const mat = obj.material as { transparent?: boolean; opacity?: number }
          if (!mat.transparent || (mat.opacity && mat.opacity > 0.5)) {
            meshesToTest.push(obj)
          }
        }
      }
    })

    const intersects = occlusionRaycaster.intersectObjects(meshesToTest, false)

    // If there's an intersection closer than the marker, it's occluded
    const firstIntersect = intersects[0]
    const occluded = !!(intersects.length > 0 && firstIntersect && firstIntersect.distance < distanceToMarker - 0.1)

    if (occluded !== isOccluded) {
      setIsOccluded(occluded)
    }
  })

  // Sync drag position
  useEffect(() => {
    if (!isDragging) {
      setDragPosition(position)
    }
  }, [position, isDragging])

  // Update overlay hover state
  useEffect(() => {
    setMarkerHovered(id, hovered && !isDragging)
  }, [id, hovered, isDragging])

  // Cleanup
  useEffect(() => {
    return () => {
      document.body.style.cursor = 'auto'
      setMarkerHovered(id, false)
    }
  }, [id])

  // Handle dragging in edit mode
  useEffect(() => {
    if (!isEditMode || !isBeingDragged) return

    const handleMouseMove = (e: MouseEvent) => {
      const plane = new Plane(new Vector3(0, 1, 0), -position[1])
      const raycaster = new Raycaster()

      const rect = gl.domElement.getBoundingClientRect()
      const x = ((e.clientX - rect.left) / rect.width) * 2 - 1
      const y = -((e.clientY - rect.top) / rect.height) * 2 + 1

      raycaster.setFromCamera(new Vector2(x, y), camera)

      const intersectPoint = new Vector3()
      raycaster.ray.intersectPlane(plane, intersectPoint)

      if (intersectPoint) {
        setDragPosition([intersectPoint.x, position[1], intersectPoint.z])
      }
    }

    const handleMouseUp = () => {
      setIsDragging(false)
      setDraggingMarkerId(null)
      updateMarker(id, { position: dragPosition })
      document.body.style.cursor = 'auto'
    }

    window.addEventListener('mousemove', handleMouseMove)
    window.addEventListener('mouseup', handleMouseUp)

    return () => {
      window.removeEventListener('mousemove', handleMouseMove)
      window.removeEventListener('mouseup', handleMouseUp)
    }
  }, [isEditMode, isBeingDragged, camera, gl, position, id, updateMarker, dragPosition, setDraggingMarkerId])

  const handleClick = (e: ThreeEvent<MouseEvent>) => {
    e.stopPropagation()

    if (isEditMode) {
      setEditingMarkerId(isEditing ? null : id)
    } else {
      // Play temple bell sound only when selecting a marker (not deselecting)
      if (!isSelected) {
        playTempleBellSound()
      }
      setSelectedMarker(isSelected ? null : id)
      if (onSelect && !isSelected) {
        onSelect(id)
      }
    }
  }

  const handlePointerDown = (e: ThreeEvent<PointerEvent>) => {
    if (!isEditMode) return
    e.stopPropagation()
    setIsDragging(true)
    setDraggingMarkerId(id)
    document.body.style.cursor = 'grabbing'
  }

  const handlePointerOver = (e: ThreeEvent<PointerEvent>) => {
    e.stopPropagation()
    setHovered(true)
    document.body.style.cursor = isEditMode ? 'grab' : 'pointer'
  }

  const handlePointerOut = () => {
    setHovered(false)
    if (!isDragging) {
      document.body.style.cursor = 'auto'
    }
  }

  const currentPosition = isDragging ? dragPosition : position

  if (!isVisible) return null

  return (
    <animated.group
      position={[currentPosition[0], currentPosition[1] + floatOffset.current, currentPosition[2]]}
      scale={scale}
    >
      {/* HTML-based ancient map marker - hidden when occluded */}
      <Html
        center
        style={{
          pointerEvents: isOccluded ? 'none' : 'auto',
          userSelect: 'none',
          opacity: isOccluded ? 0 : 1,
          transition: 'opacity 0.2s ease-out',
        }}
        zIndexRange={[100, 0]}
      >
        <div
          onClick={(e) => {
            if (isOccluded) return
            e.stopPropagation()
            handleClick(e as unknown as ThreeEvent<MouseEvent>)
          }}
          onPointerDown={(e) => {
            if (isOccluded) return
            e.stopPropagation()
            handlePointerDown(e as unknown as ThreeEvent<PointerEvent>)
          }}
          onPointerOver={(e) => {
            if (isOccluded) return
            e.stopPropagation()
            handlePointerOver(e as unknown as ThreeEvent<PointerEvent>)
          }}
          onPointerOut={handlePointerOut}
          className="relative flex flex-col items-center"
          style={{
            cursor: isEditMode ? 'grab' : 'pointer',
            filter: isSelected
              ? `drop-shadow(0 0 12px ${selectedGlow}) drop-shadow(0 0 4px ${ancientGold})`
              : 'drop-shadow(0 3px 6px rgba(0,0,0,0.4))',
            transform: `scale(${hovered ? 1.15 : 1})`,
            transition: 'transform 0.3s ease, filter 0.3s ease',
          }}
        >
          {/* Teardrop/Pin Marker - ice cream cone style */}
          <div
            className="relative"
            style={{
              width: '36px',
              height: '52px',
            }}
          >
            <svg
              viewBox="0 0 36 52"
              width="36"
              height="52"
              style={{ position: 'absolute', top: 0, left: 0 }}
            >
              <defs>
                {/* Aged parchment gradient for inner fill */}
                <linearGradient id={`parchment-${id}`} x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stopColor="#f7edd5" />
                  <stop offset="30%" stopColor={parchmentColor} />
                  <stop offset="70%" stopColor="#e8d9b5" />
                  <stop offset="100%" stopColor="#d4c4a0" />
                </linearGradient>
                {/* Gold metallic gradient */}
                <linearGradient id={`gold-${id}`} x1="0%" y1="0%" x2="0%" y2="100%">
                  <stop offset="0%" stopColor="#ffd700" />
                  <stop offset="30%" stopColor="#d4a853" />
                  <stop offset="70%" stopColor={ancientGold} />
                  <stop offset="100%" stopColor="#8b6914" />
                </linearGradient>
                {/* Glow filter */}
                <filter id={`glow-${id}`} x="-50%" y="-50%" width="200%" height="200%">
                  <feGaussianBlur stdDeviation="3" result="coloredBlur"/>
                  <feMerge>
                    <feMergeNode in="coloredBlur"/>
                    <feMergeNode in="SourceGraphic"/>
                  </feMerge>
                </filter>
                {/* Inner shadow for depth */}
                <filter id={`inset-${id}`}>
                  <feOffset dx="0" dy="1" />
                  <feGaussianBlur stdDeviation="1" result="offset-blur" />
                  <feComposite operator="out" in="SourceGraphic" in2="offset-blur" result="inverse" />
                  <feFlood floodColor="#000" floodOpacity="0.2" result="color" />
                  <feComposite operator="in" in="color" in2="inverse" result="shadow" />
                  <feComposite operator="over" in="shadow" in2="SourceGraphic" />
                </filter>
              </defs>

              {/* Teardrop/Pin shape - circle top with pointed bottom */}
              <path
                d="M18 2
                   C 28 2, 34 10, 34 18
                   C 34 26, 28 32, 18 48
                   C 8 32, 2 26, 2 18
                   C 2 10, 8 2, 18 2 Z"
                fill={`url(#parchment-${id})`}
                stroke={`url(#gold-${id})`}
                strokeWidth="2"
                filter={isSelected ? `url(#glow-${id})` : undefined}
              />

              {/* Inner circle area for icon */}
              <circle
                cx="18"
                cy="16"
                r="12"
                fill="none"
                stroke={ancientGold}
                strokeWidth="1.5"
                opacity="0.6"
              />

              {/* Icon in center or default dot */}
              {icon && icon !== 'none' && MARKER_ICONS[icon] ? (
                <g transform="translate(10, 8) scale(1)">
                  <path
                    d={MARKER_ICONS[icon].path}
                    fill={ancientGold}
                    stroke="#8b6914"
                    strokeWidth="0.3"
                  />
                </g>
              ) : (
                <>
                  {/* Default sacred geometry dot */}
                  <circle
                    cx="18"
                    cy="16"
                    r="5"
                    fill={`url(#gold-${id})`}
                  />
                  <circle
                    cx="18"
                    cy="16"
                    r="2"
                    fill={parchmentColor}
                  />
                </>
              )}

              {/* Highlight on pin for 3D effect */}
              <ellipse
                cx="12"
                cy="10"
                rx="4"
                ry="3"
                fill="rgba(255,255,255,0.3)"
              />
            </svg>
          </div>

          {/* Title label on hover/select - ancient scroll style */}
          {(hovered || isSelected) && title && (
            <div
              className="mt-2 whitespace-nowrap px-3 py-1 text-xs font-medium"
              style={{
                background: `linear-gradient(180deg, ${parchmentColor} 0%, #e8d9b5 100%)`,
                color: '#4a3c2a',
                border: `1px solid ${ancientGold}`,
                borderRadius: '2px',
                fontSize: '11px',
                fontFamily: 'Georgia, serif',
                letterSpacing: '0.5px',
                boxShadow: '0 2px 4px rgba(0,0,0,0.3), inset 0 1px 0 rgba(255,255,255,0.3)',
              }}
            >
              {title}
            </div>
          )}
        </div>
      </Html>

      {/* Invisible 3D mesh for raycasting (larger hit area) */}
      <mesh
        ref={meshRef}
        visible={false}
        onClick={handleClick}
        onPointerDown={handlePointerDown}
        onPointerOver={handlePointerOver}
        onPointerOut={handlePointerOut}
      >
        <sphereGeometry args={[0.3, 8, 8]} />
        <meshBasicMaterial transparent opacity={0} />
      </mesh>
    </animated.group>
  )
}
