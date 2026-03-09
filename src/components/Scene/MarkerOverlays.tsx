import { useEffect, useState, useCallback } from 'react'
import { createPortal } from 'react-dom'
import * as THREE from 'three'
import { useAdminStore } from '../../store/useAdminStore'
import { MarkerType } from '../../utils/configStorage'

// Type-specific colors
const TYPE_COLORS: Record<MarkerType, string> = {
  info: '#3b82f6',
  hotspot: '#f59e0b',
  link: '#10b981',
  gallery: '#8b5cf6',
}

// Type-specific icons (SVG paths)
const TYPE_ICONS: Record<MarkerType, string> = {
  info: 'M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z',
  hotspot: 'M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z',
  link: 'M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14',
  gallery: 'M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z',
}

// Shared state for hover - simple Map-based store
const hoverListeners = new Set<() => void>()
const hoverStates = new Map<string, boolean>()

export function setMarkerHovered(id: string, hovered: boolean) {
  const current = hoverStates.get(id) || false
  if (current !== hovered) {
    hoverStates.set(id, hovered)
    hoverListeners.forEach((listener) => listener())
  }
}

function useHoverState() {
  const [, forceUpdate] = useState(0)

  useEffect(() => {
    const listener = () => forceUpdate((n) => n + 1)
    hoverListeners.add(listener)
    return () => {
      hoverListeners.delete(listener)
    }
  }, [])

  return hoverStates
}

interface MarkerOverlaysProps {
  camera: THREE.Camera | null
  domElement: HTMLCanvasElement | null
}

// This component renders OUTSIDE the Canvas
export function MarkerOverlays({ camera, domElement }: MarkerOverlaysProps) {
  const config = useAdminStore((state) => state.config)
  const isEditMode = useAdminStore((state) => state.isEditMode)
  const hoverState = useHoverState()
  const [screenPositions, setScreenPositions] = useState<Map<string, { x: number; y: number; visible: boolean }>>(new Map())

  // Update screen positions
  const updatePositions = useCallback(() => {
    if (!camera || !domElement) return

    const newPositions = new Map<string, { x: number; y: number; visible: boolean }>()
    const rect = domElement.getBoundingClientRect()

    config.markers.forEach((marker) => {
      const vec = new THREE.Vector3(...marker.position)
      vec.project(camera)

      const x = (vec.x * 0.5 + 0.5) * rect.width + rect.left
      const y = (-vec.y * 0.5 + 0.5) * rect.height + rect.top
      const visible = vec.z < 1

      newPositions.set(marker.id, { x, y, visible })
    })

    setScreenPositions(newPositions)
  }, [camera, domElement, config.markers])

  useEffect(() => {
    updatePositions()
    const interval = setInterval(updatePositions, 32) // ~30fps for smoother updates
    return () => clearInterval(interval)
  }, [updatePositions])

  // Get hovered markers with their screen positions
  const hoveredMarkers = config.markers.filter((marker) => {
    const isHovered = hoverState.get(marker.id) || false
    const pos = screenPositions.get(marker.id)
    return isHovered && pos?.visible
  })

  if (hoveredMarkers.length === 0) return null

  return createPortal(
    <>
      {hoveredMarkers.map((marker) => {
        const pos = screenPositions.get(marker.id)
        if (!pos) return null

        const type = marker.type || 'info'

        return (
          <div
            key={marker.id}
            style={{
              position: 'fixed',
              left: pos.x,
              top: pos.y - 50,
              transform: 'translate(-50%, -100%)',
              pointerEvents: 'none',
              zIndex: 1000,
            }}
          >
            {isEditMode ? (
              // Edit mode tooltip
              <div className="whitespace-nowrap rounded bg-black/80 px-3 py-1.5 text-center text-sm text-white shadow-lg">
                <div className="flex items-center gap-2">
                  <span
                    className="h-2 w-2 rounded-full"
                    style={{ backgroundColor: TYPE_COLORS[type] }}
                  />
                  <span className="font-medium">{marker.title || 'Untitled'}</span>
                </div>
                <div className="text-xs text-slate-400">Click to edit, drag to move</div>
              </div>
            ) : (
              // View mode tooltip
              <div className="whitespace-nowrap rounded bg-black/80 px-3 py-1.5 text-sm font-medium text-white shadow-lg">
                <div className="flex items-center gap-2">
                  <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={TYPE_ICONS[type]} />
                  </svg>
                  <span>{marker.title}</span>
                </div>
                {type === 'hotspot' && marker.description && (
                  <div className="mt-1 max-w-[200px] text-xs text-slate-300">{marker.description}</div>
                )}
                {type === 'link' && marker.linkUrl && (
                  <div className="mt-1 text-xs text-blue-300">Click to open link</div>
                )}
              </div>
            )}
          </div>
        )
      })}
    </>,
    document.body
  )
}
