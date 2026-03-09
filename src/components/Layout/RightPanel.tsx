import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { VideoPlayer } from '../UI/VideoPlayer'
import { AdminPanel } from '../Admin'
import { useAdminStore } from '../../store/useAdminStore'

type PanelTab = 'video' | 'editor'

export function RightPanel() {
  const isEditMode = useAdminStore((state) => state.isEditMode)
  const [activeTab, setActiveTab] = useState<PanelTab>(isEditMode ? 'editor' : 'video')

  // Sync tab with edit mode changes
  if (isEditMode && activeTab === 'video') {
    setActiveTab('editor')
  }

  return (
    <div className="flex h-full flex-col">
      {/* Tab Switcher - only show when in edit mode */}
      {isEditMode && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex border-b border-slate-700 bg-slate-800"
        >
          <button
            onClick={() => setActiveTab('video')}
            className={`relative flex-1 px-4 py-2.5 text-sm font-medium transition-colors ${
              activeTab === 'video'
                ? 'text-white'
                : 'text-slate-400 hover:text-slate-300'
            }`}
          >
            <span className="flex items-center justify-center gap-2">
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z"
                />
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
              Video
            </span>
            {activeTab === 'video' && (
              <motion.div
                layoutId="rightPanelTabIndicator"
                className="absolute bottom-0 left-0 right-0 h-0.5 bg-blue-500"
              />
            )}
          </button>
          <button
            onClick={() => setActiveTab('editor')}
            className={`relative flex-1 px-4 py-2.5 text-sm font-medium transition-colors ${
              activeTab === 'editor'
                ? 'text-white'
                : 'text-slate-400 hover:text-slate-300'
            }`}
          >
            <span className="flex items-center justify-center gap-2">
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"
                />
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                />
              </svg>
              Editor
            </span>
            {activeTab === 'editor' && (
              <motion.div
                layoutId="rightPanelTabIndicator"
                className="absolute bottom-0 left-0 right-0 h-0.5 bg-blue-500"
              />
            )}
          </button>
        </motion.div>
      )}

      {/* Panel Content */}
      <div className="flex-1 overflow-hidden">
        <AnimatePresence mode="wait">
          {activeTab === 'video' || !isEditMode ? (
            <motion.div
              key="video"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.2 }}
              className="h-full"
            >
              <VideoPlayer />
            </motion.div>
          ) : (
            <motion.div
              key="editor"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.2 }}
              className="h-full"
            >
              <AdminPanel />
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  )
}
