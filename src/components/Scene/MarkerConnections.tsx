import { useMemo } from 'react'
import { Line } from '@react-three/drei'
import { useAdminStore } from '../../store/useAdminStore'
import { useMarkerStore } from '../../store/useMarkerStore'

export function MarkerConnections() {
  const markers = useAdminStore((state) => state.config.markers)
  const showConnections = useMarkerStore((state) => state.showConnections)

  const connections = useMemo(() => {
    if (!showConnections) return []

    const lines: { from: [number, number, number]; to: [number, number, number]; color: string }[] = []

    markers.forEach((marker) => {
      if (marker.connectedTo && marker.connectedTo.length > 0) {
        marker.connectedTo.forEach((targetId) => {
          const targetMarker = markers.find((m) => m.id === targetId)
          if (targetMarker) {
            lines.push({
              from: marker.position,
              to: targetMarker.position,
              color: marker.color || '#3b82f6',
            })
          }
        })
      }
    })

    return lines
  }, [markers, showConnections])

  // Tour path connections
  const tourPath = useMemo(() => {
    const tourMarkers = markers
      .filter((m) => m.tourOrder !== undefined)
      .sort((a, b) => (a.tourOrder || 0) - (b.tourOrder || 0))

    if (tourMarkers.length < 2) return []

    const lines: { from: [number, number, number]; to: [number, number, number] }[] = []
    for (let i = 0; i < tourMarkers.length - 1; i++) {
      const current = tourMarkers[i]
      const next = tourMarkers[i + 1]
      if (current && next) {
        lines.push({
          from: current.position,
          to: next.position,
        })
      }
    }

    return lines
  }, [markers])

  if (!showConnections) return null

  return (
    <group>
      {/* Custom connections */}
      {connections.map((connection, index) => (
        <Line
          key={`connection-${index}`}
          points={[connection.from, connection.to]}
          color={connection.color}
          lineWidth={2}
          transparent
          opacity={0.6}
          dashed
          dashSize={0.1}
          gapSize={0.05}
        />
      ))}

      {/* Tour path */}
      {tourPath.map((segment, index) => (
        <Line
          key={`tour-${index}`}
          points={[segment.from, segment.to]}
          color="#10b981"
          lineWidth={3}
          transparent
          opacity={0.4}
        />
      ))}
    </group>
  )
}
