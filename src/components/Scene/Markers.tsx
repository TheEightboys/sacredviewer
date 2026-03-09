import { useAdminStore } from '../../store/useAdminStore'
import { useMarkerPlacementStore } from '../../store/useMarkerPlacementStore'
import { Marker } from './Marker'

function PlacementPreview({ position }: { position: [number, number, number] }) {
  return (
    <group position={position}>
      {/* Preview sphere */}
      <mesh>
        <sphereGeometry args={[0.15, 16, 16]} />
        <meshStandardMaterial
          color="#4488ff"
          emissive="#4488ff"
          emissiveIntensity={0.5}
          transparent
          opacity={0.7}
        />
      </mesh>
      {/* Preview ring */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.15, 0]}>
        <ringGeometry args={[0.2, 0.25, 32]} />
        <meshStandardMaterial
          color="#4488ff"
          emissive="#4488ff"
          emissiveIntensity={0.3}
          transparent
          opacity={0.5}
        />
      </mesh>
    </group>
  )
}

// This component only renders 3D elements inside the Canvas
export function Markers() {
  const markers = useAdminStore((state) => state.config.markers)
  const isEditMode = useAdminStore((state) => state.isEditMode)

  const previewPosition = useMarkerPlacementStore((state) => state.previewPosition)
  const newMarker = useMarkerPlacementStore((state) => state.newMarker)
  const editingMarkerId = useMarkerPlacementStore((state) => state.editingMarkerId)

  return (
    <group>
      {markers.map((marker) => (
        <Marker key={marker.id} marker={marker} />
      ))}

      {/* Placement preview */}
      {isEditMode && previewPosition && !newMarker && !editingMarkerId && (
        <PlacementPreview position={previewPosition} />
      )}
    </group>
  )
}
