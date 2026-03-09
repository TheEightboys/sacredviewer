import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  getAssets,
  deleteFromR2,
  removeAsset,
  formatFileSize,
  UploadedAsset,
} from '../../utils/r2Storage'

type AssetFilter = 'all' | 'model' | 'video'

export function AssetManager() {
  const [assets, setAssets] = useState<UploadedAsset[]>([])
  const [filter, setFilter] = useState<AssetFilter>('all')
  const [isDeleting, setIsDeleting] = useState<string | null>(null)

  useEffect(() => {
    setAssets(getAssets())
  }, [])

  const refreshAssets = () => {
    setAssets(getAssets())
  }

  const filteredAssets = assets.filter((a) => {
    if (filter === 'all') return true
    return a.type === filter
  })

  const totalSize = assets.reduce((sum, a) => sum + a.size, 0)
  const modelCount = assets.filter((a) => a.type === 'model').length
  const videoCount = assets.filter((a) => a.type === 'video').length

  const handleDelete = async (asset: UploadedAsset) => {
    if (!asset.objectKey) {
      // External URL, just remove from tracking
      removeAsset(asset.objectKey || asset.id)
      refreshAssets()
      return
    }

    if (!confirm(`Delete "${asset.name}"? This will remove it from R2 storage.`)) return

    setIsDeleting(asset.id)
    const success = await deleteFromR2(asset.objectKey)

    if (success) {
      removeAsset(asset.objectKey)
      refreshAssets()
    } else {
      alert('Failed to delete from storage')
    }

    setIsDeleting(null)
  }

  const handleClearAll = async () => {
    if (!confirm('Delete ALL uploaded assets? This cannot be undone.')) return

    for (const asset of assets) {
      if (asset.objectKey) {
        await deleteFromR2(asset.objectKey)
      }
      removeAsset(asset.objectKey || asset.id)
    }
    refreshAssets()
  }

  return (
    <div className="space-y-4">
      <h3 className="text-sm font-semibold uppercase tracking-wider text-slate-400">
        Storage
      </h3>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-2">
        <div className="rounded-lg bg-slate-800/50 p-3 text-center">
          <p className="text-2xl font-bold text-white">{assets.length}</p>
          <p className="text-xs text-slate-500">Total Assets</p>
        </div>
        <div className="rounded-lg bg-slate-800/50 p-3 text-center">
          <p className="text-2xl font-bold text-blue-400">{videoCount}</p>
          <p className="text-xs text-slate-500">Videos</p>
        </div>
        <div className="rounded-lg bg-slate-800/50 p-3 text-center">
          <p className="text-2xl font-bold text-green-400">{modelCount}</p>
          <p className="text-xs text-slate-500">Models</p>
        </div>
      </div>

      {/* Total Size */}
      <div className="rounded-lg bg-slate-800/50 p-3">
        <div className="flex items-center justify-between">
          <span className="text-sm text-slate-400">Total Size</span>
          <span className="font-mono text-sm text-white">{formatFileSize(totalSize)}</span>
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="flex gap-1 rounded-lg bg-slate-800/50 p-1">
        {(['all', 'video', 'model'] as AssetFilter[]).map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`flex-1 rounded px-3 py-1.5 text-xs font-medium capitalize transition-colors ${
              filter === f
                ? 'bg-slate-700 text-white'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            {f}
          </button>
        ))}
      </div>

      {/* Asset List */}
      {filteredAssets.length === 0 ? (
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
              d="M5 8h14M5 8a2 2 0 110-4h14a2 2 0 110 4M5 8v10a2 2 0 002 2h10a2 2 0 002-2V8m-9 4h4"
            />
          </svg>
          <p className="text-sm text-slate-500">No assets found</p>
        </div>
      ) : (
        <div className="space-y-2">
          <AnimatePresence>
            {filteredAssets.map((asset) => (
              <motion.div
                key={asset.id}
                layout
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 10 }}
                className="flex items-center gap-3 rounded-lg bg-slate-800/50 p-2"
              >
                {/* Type Icon */}
                <div
                  className={`flex h-8 w-8 items-center justify-center rounded ${
                    asset.type === 'video' ? 'bg-blue-500/20' : 'bg-green-500/20'
                  }`}
                >
                  {asset.type === 'video' ? (
                    <svg
                      className="h-4 w-4 text-blue-400"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z"
                      />
                    </svg>
                  ) : (
                    <svg
                      className="h-4 w-4 text-green-400"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4"
                      />
                    </svg>
                  )}
                </div>

                {/* Info */}
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm text-white" title={asset.name}>
                    {asset.name}
                  </p>
                  <p className="text-xs text-slate-500">
                    {asset.size > 0 ? formatFileSize(asset.size) : 'External'} •{' '}
                    {new Date(asset.uploadedAt).toLocaleDateString()}
                  </p>
                </div>

                {/* Delete Button */}
                <button
                  onClick={() => handleDelete(asset)}
                  disabled={isDeleting === asset.id}
                  className="p-1.5 text-slate-400 transition-colors hover:text-red-400 disabled:opacity-50"
                  title="Delete asset"
                >
                  {isDeleting === asset.id ? (
                    <svg className="h-4 w-4 animate-spin" fill="none" viewBox="0 0 24 24">
                      <circle
                        className="opacity-25"
                        cx="12"
                        cy="12"
                        r="10"
                        stroke="currentColor"
                        strokeWidth="4"
                      />
                      <path
                        className="opacity-75"
                        fill="currentColor"
                        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
                      />
                    </svg>
                  ) : (
                    <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                      />
                    </svg>
                  )}
                </button>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      )}

      {/* Clear All Button */}
      {assets.length > 0 && (
        <button
          onClick={handleClearAll}
          className="w-full rounded-lg bg-red-600/10 py-2 text-sm font-medium text-red-400 transition-colors hover:bg-red-600/20"
        >
          Clear All Assets
        </button>
      )}

      {/* Info */}
      <div className="rounded-lg bg-slate-800/30 p-3 text-xs text-slate-500">
        <p>Assets are stored in Cloudflare R2.</p>
        <p className="mt-1">External URLs are tracked locally but not stored in R2.</p>
      </div>
    </div>
  )
}
