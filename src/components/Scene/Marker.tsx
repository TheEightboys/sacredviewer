import { useRef, useState, useEffect, useMemo } from 'react'
import { useFrame, useThree, ThreeEvent } from '@react-three/fiber'
import { useSpring, animated } from '@react-spring/three'
import { Mesh, Plane, Vector3, Raycaster, Vector2 } from 'three'
import { useStore } from '../../store/useStore'
import { useAdminStore } from '../../store/useAdminStore'
import { useMarkerPlacementStore } from '../../store/useMarkerPlacementStore'
import { useMarkerStore } from '../../store/useMarkerStore'
import { setMarkerHovered } from './MarkerOverlays'
import {
  MarkerType,
  MarkerSize,
  MarkerConfig,
} from '../../utils/configStorage'

interface MarkerProps {
  marker: MarkerConfig
}

const DEFAULT_COLORS = {
  default: '#ff4444',
  hover: '#ffff00',
  selected: '#00ff00',
}

// Type-specific colors
const TYPE_COLORS: Record<MarkerType, string> = {
  info: '#3b82f6', // Blue
  hotspot: '#f59e0b', // Amber
  link: '#10b981', // Emerald
  gallery: '#8b5cf6', // Purple
}

// Size multipliers
const SIZE_MULTIPLIERS: Record<MarkerSize, number> = {
  small: 0.7,
  medium: 1.0,
  large: 1.4,
}

export function Marker({ marker }: MarkerProps) {
  const {
    id,
    position,
    color: markerColor,
    type = 'info',
    size = 'medium',
    animation = 'pulse',
    animationSpeed = 1,
    glowIntensity = 0.5,
    animateOnHover = false,
    groupId,
    linkUrl,
  } = marker

  const sphereRef = useRef<Mesh>(null)
  const [hovered, setHovered] = useState(false)
  const [animationValue, setAnimationValue] = useState(1)
  const [isDragging, setIsDragging] = useState(false)
  const [dragPosition, setDragPosition] = useState<[number, number, number]>(position)

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

  // Check visibility based on group
  const isVisible = useMemo(() => {
    if (groupId && !isGroupVisible(groupId)) return false
    if (activeGroupFilter && groupId !== activeGroupFilter) return false
    return true
  }, [groupId, isGroupVisible, activeGroupFilter])

  // Use type-specific color or custom color
  const baseColor = markerColor || TYPE_COLORS[type] || DEFAULT_COLORS.default
  const color = isSelected ? DEFAULT_COLORS.selected : hovered ? DEFAULT_COLORS.hover : baseColor

  // Size multiplier
  const sizeMultiplier = SIZE_MULTIPLIERS[size]

  // Base scale: 1.0 normal, 1.2 hover, 1.3 selected
  const baseScale = (isSelected ? 1.3 : hovered ? 1.2 : 1.0) * sizeMultiplier

  // Spring animation for hover/select with bounce
  const { scale } = useSpring({
    scale: baseScale,
    config: isSelected
      ? { tension: 400, friction: 10 }
      : { tension: 300, friction: 20 },
  })

  // Update shared hover state for overlays
  useEffect(() => {
    setMarkerHovered(id, hovered && !isDragging)
  }, [id, hovered, isDragging])

  // Animation loop
  useFrame((state) => {
    // Skip animation if animateOnHover and not hovered
    if (animateOnHover && !hovered && !isSelected) {
      setAnimationValue(1)
      return
    }

    const time = state.clock.elapsedTime * animationSpeed

    switch (animation) {
      case 'pulse':
        setAnimationValue(1 + Math.sin(time * 3) * 0.1)
        break
      case 'bounce':
        setAnimationValue(1 + Math.abs(Math.sin(time * 2)) * 0.15)
        break
      case 'rotate':
      case 'glow':
      case 'none':
      default:
        setAnimationValue(1)
        break
    }
  })

  // Rotation animation
  const rotationY = useMemo(() => {
    if (animation === 'rotate') {
      return Date.now() * 0.001 * animationSpeed
    }
    return 0
  }, [animation, animationSpeed])

  // Calculate glow intensity
  const effectiveGlowIntensity = useMemo(() => {
    if (isSelected) return 0.8
    if (hovered) return 0.6
    if (animation === 'glow') {
      return glowIntensity * (0.5 + Math.sin(Date.now() * 0.003 * animationSpeed) * 0.5)
    }
    return glowIntensity
  }, [isSelected, hovered, animation, glowIntensity, animationSpeed])

  // Sync drag position with actual position when not dragging
  useEffect(() => {
    if (!isDragging) {
      setDragPosition(position)
    }
  }, [position, isDragging])

  // Reset cursor on unmount
  useEffect(() => {
    return () => {
      document.body.style.cursor = 'auto'
      setMarkerHovered(id, false)
    }
  }, [id])

  // Handle dragging
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
      // Handle based on marker type
      switch (type) {
        case 'link':
          if (linkUrl) {
            window.open(linkUrl, '_blank', 'noopener,noreferrer')
          }
          break
        case 'hotspot':
        case 'gallery':
        case 'info':
        default:
          setSelectedMarker(isSelected ? null : id)
          break
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
      position={currentPosition}
      scale={scale.to((s) => s * animationValue)}
      rotation={[0, animation === 'rotate' ? rotationY : 0, 0]}
    >
      {/* Main marker shape based on type */}
      {type === 'info' && (
        // Video marker - sphere with ring
        <>
          <mesh
            ref={sphereRef}
            onClick={handleClick}
            onPointerDown={handlePointerDown}
            onPointerOver={handlePointerOver}
            onPointerOut={handlePointerOut}
          >
            <sphereGeometry args={[0.15, 16, 16]} />
            <meshStandardMaterial
              color={color}
              emissive={color}
              emissiveIntensity={effectiveGlowIntensity}
              toneMapped={false}
            />
          </mesh>
          {/* Ring at base */}
          <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.15, 0]}>
            <ringGeometry args={[0.2, 0.25, 32]} />
            <meshStandardMaterial
              color={color}
              emissive={color}
              emissiveIntensity={effectiveGlowIntensity * 0.6}
              toneMapped={false}
              transparent
              opacity={0.8}
            />
          </mesh>
        </>
      )}

      {type === 'hotspot' && (
        // Info hotspot - diamond shape
        <mesh
          ref={sphereRef}
          onClick={handleClick}
          onPointerDown={handlePointerDown}
          onPointerOver={handlePointerOver}
          onPointerOut={handlePointerOut}
          rotation={[Math.PI / 4, 0, Math.PI / 4]}
        >
          <boxGeometry args={[0.18, 0.18, 0.18]} />
          <meshStandardMaterial
            color={color}
            emissive={color}
            emissiveIntensity={effectiveGlowIntensity}
            toneMapped={false}
          />
        </mesh>
      )}

      {type === 'link' && (
        // Link marker - cylinder with arrow
        <>
          <mesh
            ref={sphereRef}
            onClick={handleClick}
            onPointerDown={handlePointerDown}
            onPointerOver={handlePointerOver}
            onPointerOut={handlePointerOut}
          >
            <cylinderGeometry args={[0.12, 0.12, 0.25, 16]} />
            <meshStandardMaterial
              color={color}
              emissive={color}
              emissiveIntensity={effectiveGlowIntensity}
              toneMapped={false}
            />
          </mesh>
          {/* Arrow on top */}
          <mesh position={[0, 0.2, 0]} rotation={[0, 0, Math.PI]}>
            <coneGeometry args={[0.08, 0.12, 16]} />
            <meshStandardMaterial
              color={color}
              emissive={color}
              emissiveIntensity={effectiveGlowIntensity}
              toneMapped={false}
            />
          </mesh>
        </>
      )}

      {type === 'gallery' && (
        // Gallery marker - rounded rectangle
        <mesh
          ref={sphereRef}
          onClick={handleClick}
          onPointerDown={handlePointerDown}
          onPointerOver={handlePointerOver}
          onPointerOut={handlePointerOut}
        >
          <boxGeometry args={[0.25, 0.18, 0.08]} />
          <meshStandardMaterial
            color={color}
            emissive={color}
            emissiveIntensity={effectiveGlowIntensity}
            toneMapped={false}
          />
        </mesh>
      )}
    </animated.group>
  )
}
