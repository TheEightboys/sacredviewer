import { useState } from 'react'
import { motion } from 'framer-motion'
import { ModelUpload } from './ModelUpload'
import { ModelControls } from './ModelControls'
import { ConfigManager } from './ConfigManager'
import { MarkerList } from './MarkerList'
import { VideoLibrary } from './VideoLibrary'
import { AssetManager } from './AssetManager'

type Tab = 'markers' | 'videos' | 'model' | 'storage' | 'config'

const tabs: { id: Tab; label: string }[] = [
  { id: 'markers', label: 'Markers' },
  { id: 'videos', label: 'Videos' },
  { id: 'model', label: 'Model' },
  { id: 'storage', label: 'Storage' },
  { id: 'config', label: 'Config' },
]

export function AdminPanel() {
  const [activeTab, setActiveTab] = useState<Tab>('markers')

  return (
    <div className="flex h-full flex-col bg-slate-900">
      {/* Header */}
      <div className="border-b border-slate-700 px-4 py-3">
        <div className="flex items-center gap-2">
          <div className="flex h-6 w-6 items-center justify-center rounded bg-blue-500">
            <svg className="h-4 w-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
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
          </div>
          <h2 className="font-semibold text-white">Editor Mode</h2>
        </div>
        <p className="mt-1 text-xs text-slate-500">Press E to toggle</p>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-slate-700">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`relative flex-1 px-4 py-2 text-sm font-medium transition-colors ${
              activeTab === tab.id
                ? 'text-white'
                : 'text-slate-400 hover:text-slate-300'
            }`}
          >
            {tab.label}
            {activeTab === tab.id && (
              <motion.div
                layoutId="adminTabIndicator"
                className="absolute bottom-0 left-0 right-0 h-0.5 bg-blue-500"
              />
            )}
          </button>
        ))}
      </div>

      {/* Tab Content */}
      <div className="flex-1 overflow-y-auto p-4">
        {activeTab === 'markers' && <MarkerList />}
        {activeTab === 'videos' && <VideoLibrary />}
        {activeTab === 'model' && (
          <div className="space-y-6">
            <ModelUpload />
            <ModelControls />
          </div>
        )}
        {activeTab === 'storage' && <AssetManager />}
        {activeTab === 'config' && <ConfigManager />}
      </div>
    </div>
  )
}
