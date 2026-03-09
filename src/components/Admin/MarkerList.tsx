import { Reorder } from 'framer-motion'
import { useAdminStore } from '../../store/useAdminStore'
import { useStore } from '../../store/useStore'
import { useMarkerPlacementStore } from '../../store/useMarkerPlacementStore'
import { MarkerConfig } from '../../utils/configStorage'

interface MarkerItemProps {
  marker: MarkerConfig
  isSelected: boolean
  onSelect: () => void
  onEdit: () => void
  onDelete: () => void
}

function MarkerItem({ marker, isSelected, onSelect, onEdit, onDelete }: MarkerItemProps) {
  return (
    <Reorder.Item
      value={marker}
      className={`flex items-center gap-3 rounded-lg p-2 transition-colors ${
        isSelected ? 'bg-blue-500/20' : 'bg-slate-800/50 hover:bg-slate-800'
      }`}
    >
      {/* Drag handle */}
      <div className="cursor-grab text-slate-500 hover:text-slate-400 active:cursor-grabbing">
        <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 8h16M4 16h16" />
        </svg>
      </div>

      {/* Color indicator */}
      <div
        className="h-3 w-3 rounded-full"
        style={{ backgroundColor: marker.color || '#ff4444' }}
      />

      {/* Title */}
      <button
        onClick={onSelect}
        className="flex-1 truncate text-left text-sm text-white"
      >
        {marker.title || 'Untitled'}
      </button>

      {/* Position */}
      <span className="hidden text-xs text-slate-500 sm:block">
        [{marker.position.map((p) => p.toFixed(1)).join(', ')}]
      </span>

      {/* Edit button */}
      <button
        onClick={onEdit}
        className="p-1 text-slate-400 transition-colors hover:text-white"
        title="Edit marker"
      >
        <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
        </svg>
      </button>

      {/* Delete button */}
      <button
        onClick={onDelete}
        className="p-1 text-slate-400 transition-colors hover:text-red-400"
        title="Delete marker"
      >
        <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
        </svg>
      </button>
    </Reorder.Item>
  )
}

export function MarkerList() {
  const markers = useAdminStore((state) => state.config.markers)
  const updateConfig = useAdminStore((state) => state.updateConfig)
  const removeMarker = useAdminStore((state) => state.removeMarker)

  const selectedMarker = useStore((state) => state.selectedMarker)
  const setSelectedMarker = useStore((state) => state.setSelectedMarker)

  const setEditingMarkerId = useMarkerPlacementStore((state) => state.setEditingMarkerId)

  const handleReorder = (newOrder: MarkerConfig[]) => {
    updateConfig({ markers: newOrder })
  }

  const handleSelect = (id: string) => {
    setSelectedMarker(selectedMarker === id ? null : id)
  }

  const handleEdit = (id: string) => {
    setEditingMarkerId(id)
  }

  const handleDelete = (id: string) => {
    if (confirm('Are you sure you want to delete this marker?')) {
      removeMarker(id)
      if (selectedMarker === id) {
        setSelectedMarker(null)
      }
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold uppercase tracking-wider text-slate-400">
          Markers ({markers.length})
        </h3>
      </div>

      {markers.length === 0 ? (
        <div className="rounded-lg border border-dashed border-slate-700 p-6 text-center">
          <svg
            className="mx-auto mb-2 h-8 w-8 text-slate-600"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"
            />
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"
            />
          </svg>
          <p className="text-sm text-slate-500">No markers yet</p>
          <p className="mt-1 text-xs text-slate-600">
            Click on the 3D model to place markers
          </p>
        </div>
      ) : (
        <Reorder.Group
          axis="y"
          values={markers}
          onReorder={handleReorder}
          className="space-y-2"
        >
          {markers.map((marker) => (
            <MarkerItem
              key={marker.id}
              marker={marker}
              isSelected={selectedMarker === marker.id}
              onSelect={() => handleSelect(marker.id)}
              onEdit={() => handleEdit(marker.id)}
              onDelete={() => handleDelete(marker.id)}
            />
          ))}
        </Reorder.Group>
      )}

      {/* Instructions */}
      <div className="rounded-lg bg-slate-800/30 p-3 text-xs text-slate-500">
        <p className="mb-1 font-medium text-slate-400">Tips:</p>
        <ul className="list-inside list-disc space-y-0.5">
          <li>Click on the 3D model to place new markers</li>
          <li>Drag markers in the 3D view to reposition</li>
          <li>Drag items here to reorder the list</li>
        </ul>
      </div>
    </div>
  )
}
