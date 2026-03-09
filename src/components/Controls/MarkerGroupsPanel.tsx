import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useMarkerStore } from '../../store/useMarkerStore'
import { useAdminStore } from '../../store/useAdminStore'
import { MarkerGroup } from '../../utils/configStorage'

const GROUP_COLORS = [
  '#3b82f6',
  '#10b981',
  '#f59e0b',
  '#ef4444',
  '#8b5cf6',
  '#ec4899',
  '#06b6d4',
  '#84cc16',
]

export function MarkerGroupsPanel() {
  const [isOpen, setIsOpen] = useState(false)
  const [isCreating, setIsCreating] = useState(false)
  const [newGroupName, setNewGroupName] = useState('')
  const [newGroupColor, setNewGroupColor] = useState('#3b82f6')

  const groups = useMarkerStore((state) => state.getGroups)()
  const { addGroup, removeGroup, toggleGroupVisibility, isGroupVisible, setActiveGroupFilter, activeGroupFilter } = useMarkerStore()
  const markers = useAdminStore((state) => state.config.markers)
  const isEditMode = useAdminStore((state) => state.isEditMode)

  const getMarkerCountInGroup = (groupId: string | undefined) => {
    if (!groupId) return 0
    return markers.filter((m) => m.groupId === groupId).length
  }

  const handleCreateGroup = () => {
    if (!newGroupName.trim()) return

    const group: MarkerGroup = {
      id: `group-${Date.now()}`,
      name: newGroupName.trim(),
      color: newGroupColor,
      visible: true,
    }

    addGroup(group)
    setNewGroupName('')
    setIsCreating(false)
  }

  return (
    <div className="relative">
      {/* Toggle Button */}
      <motion.button
        onClick={() => setIsOpen(!isOpen)}
        className={`flex h-8 w-8 items-center justify-center rounded-lg text-sm transition-colors ${
          isOpen || activeGroupFilter
            ? 'bg-blue-500 text-white'
            : 'bg-black/40 text-white/70 backdrop-blur-sm hover:bg-black/50 hover:text-white'
        }`}
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        title="Marker Groups"
      >
        <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10"
          />
        </svg>
      </motion.button>

      {/* Dropdown Panel */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: -10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: -10 }}
            className="absolute right-0 top-full z-50 mt-2 w-64 rounded-lg bg-slate-900/95 p-3 shadow-xl backdrop-blur-sm"
          >
            {/* Header */}
            <div className="mb-3 flex items-center justify-between">
              <h3 className="text-sm font-semibold text-white">Marker Groups</h3>
              {activeGroupFilter && (
                <button
                  onClick={() => setActiveGroupFilter(null)}
                  className="text-xs text-blue-400 hover:text-blue-300"
                >
                  Clear filter
                </button>
              )}
            </div>

            {/* Groups List */}
            <div className="space-y-2">
              {groups.length === 0 ? (
                <p className="text-xs text-slate-500">No groups created</p>
              ) : (
                groups.map((group) => (
                  <div
                    key={group.id}
                    className={`flex items-center gap-2 rounded-lg p-2 transition-colors ${
                      activeGroupFilter === group.id ? 'bg-slate-700' : 'bg-slate-800'
                    }`}
                  >
                    {/* Visibility Toggle */}
                    <button
                      onClick={() => toggleGroupVisibility(group.id)}
                      className="text-slate-400 hover:text-white"
                    >
                      {isGroupVisible(group.id) ? (
                        <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                        </svg>
                      ) : (
                        <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
                        </svg>
                      )}
                    </button>

                    {/* Color Dot */}
                    <span
                      className="h-3 w-3 rounded-full"
                      style={{ backgroundColor: group.color }}
                    />

                    {/* Name and Count */}
                    <button
                      onClick={() => setActiveGroupFilter(activeGroupFilter === group.id ? null : group.id)}
                      className="flex flex-1 items-center justify-between text-left"
                    >
                      <span className="text-sm text-white">{group.name}</span>
                      <span className="text-xs text-slate-500">
                        {getMarkerCountInGroup(group.id)} markers
                      </span>
                    </button>

                    {/* Delete (edit mode only) */}
                    {isEditMode && (
                      <button
                        onClick={() => removeGroup(group.id)}
                        className="text-slate-500 hover:text-red-400"
                      >
                        <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                      </button>
                    )}
                  </div>
                ))
              )}
            </div>

            {/* Create New Group (edit mode only) */}
            {isEditMode && (
              <div className="mt-3 border-t border-slate-700 pt-3">
                {isCreating ? (
                  <div className="space-y-2">
                    <input
                      type="text"
                      value={newGroupName}
                      onChange={(e) => setNewGroupName(e.target.value)}
                      placeholder="Group name"
                      className="w-full rounded bg-slate-800 px-2 py-1.5 text-sm text-white placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                      autoFocus
                    />
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-slate-400">Color:</span>
                      <div className="flex gap-1">
                        {GROUP_COLORS.map((color) => (
                          <button
                            key={color}
                            onClick={() => setNewGroupColor(color)}
                            className={`h-5 w-5 rounded-full transition-transform ${
                              newGroupColor === color ? 'scale-125 ring-2 ring-white' : 'hover:scale-110'
                            }`}
                            style={{ backgroundColor: color }}
                          />
                        ))}
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <button
                        onClick={() => setIsCreating(false)}
                        className="flex-1 rounded bg-slate-700 py-1 text-xs text-white hover:bg-slate-600"
                      >
                        Cancel
                      </button>
                      <button
                        onClick={handleCreateGroup}
                        className="flex-1 rounded bg-blue-600 py-1 text-xs text-white hover:bg-blue-500"
                      >
                        Create
                      </button>
                    </div>
                  </div>
                ) : (
                  <button
                    onClick={() => setIsCreating(true)}
                    className="flex w-full items-center justify-center gap-1 rounded bg-slate-800 py-1.5 text-xs text-slate-400 hover:bg-slate-700 hover:text-white"
                  >
                    <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                    </svg>
                    New Group
                  </button>
                )}
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
