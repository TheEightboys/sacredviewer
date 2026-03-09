import { useState } from 'react'
import { motion, AnimatePresence, Reorder } from 'framer-motion'
import { useTourStore, TourStop, TransitionType } from '../../store/useTourStore'
import { useAdminStore } from '../../store/useAdminStore'

interface TourEditorProps {
  onClose: () => void
}

const TRANSITION_TYPES: { value: TransitionType; label: string }[] = [
  { value: 'fly', label: 'Fly To' },
  { value: 'fade', label: 'Fade' },
  { value: 'orbit', label: 'Orbit' },
  { value: 'instant', label: 'Instant' },
]

export function TourEditor({ onClose }: TourEditorProps) {
  const [selectedTourId, setSelectedTourId] = useState<string | null>(null)
  const [isCreating, setIsCreating] = useState(false)
  const [newTourName, setNewTourName] = useState('')
  const [editingStopIndex, setEditingStopIndex] = useState<number | null>(null)

  const { tours, createTour, updateTour, deleteTour, addStop, updateStop, removeStop, reorderStops } = useTourStore()
  const markers = useAdminStore((state) => state.config.markers)

  const selectedTour = tours.find((t) => t.id === selectedTourId)

  const handleCreateTour = () => {
    if (!newTourName.trim()) return
    const tour = createTour(newTourName.trim())
    setSelectedTourId(tour.id)
    setNewTourName('')
    setIsCreating(false)
  }

  const handleAddMarkerToTour = (markerId: string) => {
    if (!selectedTourId) return
    addStop(selectedTourId, markerId)
  }

  const handleReorder = (newOrder: TourStop[]) => {
    if (!selectedTour) return
    // Find the indices and reorder
    const oldStops = selectedTour.stops
    newOrder.forEach((stop, newIndex) => {
      const oldIndex = oldStops.findIndex((s) => s.markerId === stop.markerId)
      if (oldIndex !== newIndex && oldIndex !== -1) {
        reorderStops(selectedTour.id, oldIndex, newIndex)
      }
    })
  }

  const getMarkerTitle = (markerId: string) => {
    return markers.find((m) => m.id === markerId)?.title || 'Unknown Marker'
  }

  const availableMarkers = markers.filter(
    (m) => !selectedTour?.stops.some((s) => s.markerId === m.id)
  )

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm"
      onClick={onClose}
    >
      <motion.div
        initial={{ scale: 0.95, y: 20 }}
        animate={{ scale: 1, y: 0 }}
        exit={{ scale: 0.95, y: 20 }}
        className="m-4 flex max-h-[90vh] w-full max-w-4xl flex-col overflow-hidden rounded-xl bg-slate-900 shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-700 px-6 py-4">
          <h2 className="text-xl font-semibold text-white">Tour Editor</h2>
          <button onClick={onClose} className="text-slate-400 hover:text-white">
            <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="flex flex-1 overflow-hidden">
          {/* Tour List Sidebar */}
          <div className="w-64 shrink-0 border-r border-slate-700 p-4">
            <div className="mb-4 flex items-center justify-between">
              <h3 className="text-sm font-semibold text-slate-400">Tours</h3>
              <button
                onClick={() => setIsCreating(true)}
                className="rounded bg-blue-600 px-2 py-1 text-xs text-white hover:bg-blue-500"
              >
                + New
              </button>
            </div>

            {/* Create Tour Form */}
            <AnimatePresence>
              {isCreating && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: 'auto', opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  className="mb-4 overflow-hidden"
                >
                  <input
                    type="text"
                    value={newTourName}
                    onChange={(e) => setNewTourName(e.target.value)}
                    placeholder="Tour name"
                    className="mb-2 w-full rounded bg-slate-800 px-3 py-2 text-sm text-white placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                    autoFocus
                    onKeyDown={(e) => e.key === 'Enter' && handleCreateTour()}
                  />
                  <div className="flex gap-2">
                    <button
                      onClick={() => setIsCreating(false)}
                      className="flex-1 rounded bg-slate-700 py-1 text-xs text-white hover:bg-slate-600"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={handleCreateTour}
                      className="flex-1 rounded bg-blue-600 py-1 text-xs text-white hover:bg-blue-500"
                    >
                      Create
                    </button>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Tour List */}
            <div className="space-y-1">
              {tours.length === 0 ? (
                <p className="text-sm text-slate-500">No tours created yet</p>
              ) : (
                tours.map((tour) => (
                  <button
                    key={tour.id}
                    onClick={() => setSelectedTourId(tour.id)}
                    className={`flex w-full items-center justify-between rounded-lg px-3 py-2 text-left text-sm transition-colors ${
                      selectedTourId === tour.id
                        ? 'bg-blue-600 text-white'
                        : 'text-slate-300 hover:bg-slate-800'
                    }`}
                  >
                    <span className="truncate">{tour.name}</span>
                    <span className="text-xs opacity-60">{tour.stops.length} stops</span>
                  </button>
                ))
              )}
            </div>
          </div>

          {/* Tour Editor Main Area */}
          <div className="flex-1 overflow-y-auto p-6">
            {!selectedTour ? (
              <div className="flex h-full items-center justify-center text-slate-500">
                Select or create a tour to edit
              </div>
            ) : (
              <div className="space-y-6">
                {/* Tour Settings */}
                <div className="rounded-lg bg-slate-800 p-4">
                  <h3 className="mb-4 text-sm font-semibold text-slate-400">Tour Settings</h3>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="mb-1 block text-xs text-slate-400">Name</label>
                      <input
                        type="text"
                        value={selectedTour.name}
                        onChange={(e) => updateTour(selectedTour.id, { name: e.target.value })}
                        className="w-full rounded bg-slate-700 px-3 py-2 text-sm text-white focus:outline-none focus:ring-1 focus:ring-blue-500"
                      />
                    </div>
                    <div>
                      <label className="mb-1 block text-xs text-slate-400">Transition Duration (ms)</label>
                      <input
                        type="number"
                        value={selectedTour.transitionDuration}
                        onChange={(e) => updateTour(selectedTour.id, { transitionDuration: parseInt(e.target.value) || 1500 })}
                        className="w-full rounded bg-slate-700 px-3 py-2 text-sm text-white focus:outline-none focus:ring-1 focus:ring-blue-500"
                      />
                    </div>
                  </div>
                  <div className="mt-4 flex flex-wrap gap-4">
                    <label className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        checked={selectedTour.loop}
                        onChange={(e) => updateTour(selectedTour.id, { loop: e.target.checked })}
                        className="rounded border-slate-600 bg-slate-700 text-blue-500"
                      />
                      <span className="text-sm text-slate-300">Loop tour</span>
                    </label>
                    <label className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        checked={selectedTour.showProgress}
                        onChange={(e) => updateTour(selectedTour.id, { showProgress: e.target.checked })}
                        className="rounded border-slate-600 bg-slate-700 text-blue-500"
                      />
                      <span className="text-sm text-slate-300">Show progress bar</span>
                    </label>
                  </div>
                </div>

                {/* Tour Stops */}
                <div className="rounded-lg bg-slate-800 p-4">
                  <div className="mb-4 flex items-center justify-between">
                    <h3 className="text-sm font-semibold text-slate-400">Tour Stops</h3>
                    <span className="text-xs text-slate-500">Drag to reorder</span>
                  </div>

                  {selectedTour.stops.length === 0 ? (
                    <p className="py-4 text-center text-sm text-slate-500">
                      No stops added. Add markers from the list below.
                    </p>
                  ) : (
                    <Reorder.Group
                      axis="y"
                      values={selectedTour.stops}
                      onReorder={handleReorder}
                      className="space-y-2"
                    >
                      {selectedTour.stops.map((stop, index) => (
                        <Reorder.Item
                          key={stop.markerId}
                          value={stop}
                          className="rounded-lg bg-slate-700 p-3"
                        >
                          <div className="flex items-center gap-3">
                            {/* Drag Handle */}
                            <div className="cursor-grab text-slate-500">
                              <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 8h16M4 16h16" />
                              </svg>
                            </div>

                            {/* Stop Number */}
                            <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-blue-600 text-xs font-bold text-white">
                              {index + 1}
                            </div>

                            {/* Stop Info */}
                            <div className="flex-1">
                              <p className="text-sm font-medium text-white">
                                {getMarkerTitle(stop.markerId)}
                              </p>
                              <p className="text-xs text-slate-400">
                                {stop.duration}s • {TRANSITION_TYPES.find((t) => t.value === stop.transition)?.label}
                              </p>
                            </div>

                            {/* Actions */}
                            <button
                              onClick={() => setEditingStopIndex(editingStopIndex === index ? null : index)}
                              className="rounded p-1 text-slate-400 hover:bg-slate-600 hover:text-white"
                            >
                              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                              </svg>
                            </button>
                            <button
                              onClick={() => removeStop(selectedTour.id, index)}
                              className="rounded p-1 text-slate-400 hover:bg-red-600/20 hover:text-red-400"
                            >
                              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                              </svg>
                            </button>
                          </div>

                          {/* Stop Settings (Expanded) */}
                          <AnimatePresence>
                            {editingStopIndex === index && (
                              <motion.div
                                initial={{ height: 0, opacity: 0 }}
                                animate={{ height: 'auto', opacity: 1 }}
                                exit={{ height: 0, opacity: 0 }}
                                className="mt-3 overflow-hidden border-t border-slate-600 pt-3"
                              >
                                <div className="grid grid-cols-2 gap-3">
                                  <div>
                                    <label className="mb-1 block text-xs text-slate-400">Duration (seconds)</label>
                                    <input
                                      type="number"
                                      min="1"
                                      value={stop.duration}
                                      onChange={(e) => updateStop(selectedTour.id, index, { duration: parseInt(e.target.value) || 5 })}
                                      className="w-full rounded bg-slate-600 px-2 py-1 text-sm text-white focus:outline-none focus:ring-1 focus:ring-blue-500"
                                    />
                                  </div>
                                  <div>
                                    <label className="mb-1 block text-xs text-slate-400">Transition</label>
                                    <select
                                      value={stop.transition}
                                      onChange={(e) => updateStop(selectedTour.id, index, { transition: e.target.value as TransitionType })}
                                      className="w-full rounded bg-slate-600 px-2 py-1 text-sm text-white focus:outline-none focus:ring-1 focus:ring-blue-500"
                                    >
                                      {TRANSITION_TYPES.map((t) => (
                                        <option key={t.value} value={t.value}>{t.label}</option>
                                      ))}
                                    </select>
                                  </div>
                                </div>
                                <label className="mt-2 flex items-center gap-2">
                                  <input
                                    type="checkbox"
                                    checked={stop.autoPlayVideo}
                                    onChange={(e) => updateStop(selectedTour.id, index, { autoPlayVideo: e.target.checked })}
                                    className="rounded border-slate-500 bg-slate-600 text-blue-500"
                                  />
                                  <span className="text-xs text-slate-300">Auto-play video at this stop</span>
                                </label>
                              </motion.div>
                            )}
                          </AnimatePresence>
                        </Reorder.Item>
                      ))}
                    </Reorder.Group>
                  )}
                </div>

                {/* Available Markers */}
                <div className="rounded-lg bg-slate-800 p-4">
                  <h3 className="mb-4 text-sm font-semibold text-slate-400">Add Markers to Tour</h3>
                  {availableMarkers.length === 0 ? (
                    <p className="text-sm text-slate-500">All markers have been added to this tour</p>
                  ) : (
                    <div className="flex flex-wrap gap-2">
                      {availableMarkers.map((marker) => (
                        <button
                          key={marker.id}
                          onClick={() => handleAddMarkerToTour(marker.id)}
                          className="flex items-center gap-2 rounded-lg bg-slate-700 px-3 py-2 text-sm text-slate-300 transition-colors hover:bg-slate-600 hover:text-white"
                        >
                          <svg className="h-4 w-4 text-blue-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                          </svg>
                          {marker.title}
                        </button>
                      ))}
                    </div>
                  )}
                </div>

                {/* Danger Zone */}
                <div className="rounded-lg border border-red-900/50 bg-red-900/10 p-4">
                  <h3 className="mb-2 text-sm font-semibold text-red-400">Danger Zone</h3>
                  <button
                    onClick={() => {
                      if (confirm('Are you sure you want to delete this tour?')) {
                        deleteTour(selectedTour.id)
                        setSelectedTourId(null)
                      }
                    }}
                    className="rounded bg-red-600 px-3 py-1.5 text-sm text-white hover:bg-red-500"
                  >
                    Delete Tour
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </motion.div>
    </motion.div>
  )
}
