import { useRef } from 'react'
import { motion } from 'framer-motion'
import { useAdminStore } from '../../store/useAdminStore'
import { exportConfig, importConfig } from '../../utils/configStorage'

export function ConfigManager() {
  const fileInputRef = useRef<HTMLInputElement>(null)
  const { config, setConfig, loadFromStorage, resetToDefault } = useAdminStore()

  const handleExport = () => {
    exportConfig(config)
  }

  const handleImportClick = () => {
    fileInputRef.current?.click()
  }

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    try {
      const imported = await importConfig(file)
      setConfig(imported)
    } catch {
      alert('Failed to import config. Please check the file format.')
    }

    // Reset input
    e.target.value = ''
  }

  return (
    <div className="space-y-4">
      <h3 className="text-sm font-semibold uppercase tracking-wider text-slate-400">
        Configuration
      </h3>

      <input
        ref={fileInputRef}
        type="file"
        accept=".json"
        onChange={handleFileChange}
        className="hidden"
      />

      <div className="grid grid-cols-2 gap-2">
        <motion.button
          onClick={handleExport}
          className="flex items-center justify-center gap-2 rounded-lg bg-blue-600 py-2 text-sm font-medium text-white transition-colors hover:bg-blue-500"
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
        >
          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"
            />
          </svg>
          Export
        </motion.button>

        <motion.button
          onClick={handleImportClick}
          className="flex items-center justify-center gap-2 rounded-lg bg-slate-700 py-2 text-sm font-medium text-white transition-colors hover:bg-slate-600"
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
        >
          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12"
            />
          </svg>
          Import
        </motion.button>
      </div>

      <div className="grid grid-cols-2 gap-2">
        <motion.button
          onClick={loadFromStorage}
          className="flex items-center justify-center gap-2 rounded-lg bg-slate-700 py-2 text-sm font-medium text-white transition-colors hover:bg-slate-600"
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
        >
          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
            />
          </svg>
          Reload
        </motion.button>

        <motion.button
          onClick={resetToDefault}
          className="flex items-center justify-center gap-2 rounded-lg bg-red-600/20 py-2 text-sm font-medium text-red-400 transition-colors hover:bg-red-600/30"
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
        >
          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
            />
          </svg>
          Reset
        </motion.button>
      </div>

      {/* Config Summary */}
      <div className="rounded-lg bg-slate-800/50 p-3 text-xs">
        <p className="mb-2 font-semibold text-slate-400">Config Summary</p>
        <div className="space-y-1 text-slate-500">
          <p>Markers: {config.markers.length}</p>
          <p>Scale: {config.scale.toFixed(2)}</p>
          <p>
            Position: [{config.position.map((p) => p.toFixed(1)).join(', ')}]
          </p>
          <p>
            Rotation: [{config.rotation.map((r) => r.toFixed(0)).join(', ')}]°
          </p>
        </div>
      </div>
    </div>
  )
}
