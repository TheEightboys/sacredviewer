import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { VideoUpload } from './VideoUpload'
import {
  getVideoAssets,
  deleteFromR2,
  removeAsset,
  formatFileSize,
  UploadedAsset,
  generateVideoThumbnail,
  saveAsset,
} from '../../utils/r2Storage'
import { useAdminStore } from '../../store/useAdminStore'
import { useStore } from '../../store/useStore'

export function VideoLibrary() {
  const [videos, setVideos] = useState<UploadedAsset[]>([])
  const [selectedVideo, setSelectedVideo] = useState<UploadedAsset | null>(null)
  const [isDeleting, setIsDeleting] = useState<string | null>(null)
  const [externalUrl, setExternalUrl] = useState('')

  const markers = useAdminStore((state) => state.config.markers)
  const updateMarker = useAdminStore((state) => state.updateMarker)
  const selectedMarkerId = useStore((state) => state.selectedMarker)

  // Load videos on mount and after changes
  useEffect(() => {
    setVideos(getVideoAssets())
  }, [])

  const refreshVideos = () => {
    setVideos(getVideoAssets())
  }

  const handleUploadComplete = () => {
    refreshVideos()
  }

  const handleDelete = async (asset: UploadedAsset) => {
    if (!confirm(`Delete "${asset.name}"? This cannot be undone.`)) return

    setIsDeleting(asset.id)
    const success = await deleteFromR2(asset.objectKey)

    if (success) {
      removeAsset(asset.objectKey)
      refreshVideos()
      if (selectedVideo?.id === asset.id) {
        setSelectedVideo(null)
      }
    } else {
      alert('Failed to delete video from storage')
    }

    setIsDeleting(null)
  }

  const handleAssignToMarker = (asset: UploadedAsset) => {
    if (!selectedMarkerId) {
      alert('Please select a marker first (click a marker in the 3D view)')
      return
    }

    updateMarker(selectedMarkerId, {
      videoUrl: asset.publicUrl,
      videoKey: asset.objectKey,
    })

    alert(`Video assigned to marker "${markers.find(m => m.id === selectedMarkerId)?.title || selectedMarkerId}"`)
  }

  const handleImportUrl = () => {
    if (!externalUrl.trim()) return

    const asset: UploadedAsset = {
      id: `external-${Date.now()}`,
      name: externalUrl.split('/').pop() || 'External video',
      type: 'video',
      objectKey: '', // No R2 key for external URLs
      publicUrl: externalUrl.trim(),
      size: 0,
      uploadedAt: Date.now(),
    }

    saveAsset(asset)
    setExternalUrl('')
    refreshVideos()
  }

  const handleGenerateThumbnail = async (asset: UploadedAsset) => {
    try {
      const thumbnail = await generateVideoThumbnail(asset.publicUrl)
      // Update the asset with thumbnail
      const updatedAsset = { ...asset, thumbnail }
      saveAsset(updatedAsset)
      refreshVideos()
    } catch {
      alert('Failed to generate thumbnail')
    }
  }

  return (
    <div className="space-y-4">
      <h3 className="text-sm font-semibold uppercase tracking-wider text-slate-400">
        Video Library
      </h3>

      {/* Upload Section */}
      <VideoUpload onUploadComplete={handleUploadComplete} />

      {/* Import External URL */}
      <div className="space-y-2">
        <label className="text-xs text-slate-400">Import from URL</label>
        <div className="flex gap-2">
          <input
            type="text"
            value={externalUrl}
            onChange={(e) => setExternalUrl(e.target.value)}
            placeholder="https://example.com/video.mp4"
            className="flex-1 rounded bg-slate-800 px-3 py-2 text-sm text-white placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
          />
          <button
            onClick={handleImportUrl}
            disabled={!externalUrl.trim()}
            className="rounded bg-slate-700 px-3 py-2 text-sm font-medium text-white transition-colors hover:bg-slate-600 disabled:opacity-50"
          >
            Import
          </button>
        </div>
      </div>

      {/* Selected Marker Info */}
      {selectedMarkerId && (
        <div className="rounded-lg bg-blue-500/10 p-2 text-xs text-blue-400">
          Selected: {markers.find(m => m.id === selectedMarkerId)?.title || 'Unnamed marker'}
          <br />
          <span className="text-blue-300/60">Click a video to assign it</span>
        </div>
      )}

      {/* Video Grid */}
      {videos.length === 0 ? (
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
              d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z"
            />
          </svg>
          <p className="text-sm text-slate-500">No videos uploaded</p>
          <p className="mt-1 text-xs text-slate-600">
            Upload videos or import from URL
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-2">
          <AnimatePresence>
            {videos.map((video) => (
              <motion.div
                key={video.id}
                layout
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.9 }}
                className={`group relative overflow-hidden rounded-lg bg-slate-800 ${
                  selectedVideo?.id === video.id ? 'ring-2 ring-blue-500' : ''
                }`}
              >
                {/* Thumbnail */}
                <div
                  className="aspect-video cursor-pointer bg-slate-900"
                  onClick={() => setSelectedVideo(selectedVideo?.id === video.id ? null : video)}
                >
                  {video.thumbnail ? (
                    <img
                      src={video.thumbnail}
                      alt={video.name}
                      className="h-full w-full object-cover"
                    />
                  ) : (
                    <div className="flex h-full w-full items-center justify-center">
                      <svg
                        className="h-8 w-8 text-slate-600"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                      >
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
                    </div>
                  )}
                </div>

                {/* Info */}
                <div className="p-2">
                  <p className="truncate text-xs font-medium text-white" title={video.name}>
                    {video.name}
                  </p>
                  <p className="text-xs text-slate-500">
                    {video.size > 0 ? formatFileSize(video.size) : 'External'}
                  </p>
                </div>

                {/* Hover Actions */}
                <div className="absolute inset-0 flex items-center justify-center gap-1 bg-black/60 opacity-0 transition-opacity group-hover:opacity-100">
                  {selectedMarkerId && (
                    <button
                      onClick={() => handleAssignToMarker(video)}
                      className="rounded bg-blue-600 p-1.5 text-white hover:bg-blue-500"
                      title="Assign to selected marker"
                    >
                      <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
                      </svg>
                    </button>
                  )}
                  {!video.thumbnail && (
                    <button
                      onClick={() => handleGenerateThumbnail(video)}
                      className="rounded bg-slate-600 p-1.5 text-white hover:bg-slate-500"
                      title="Generate thumbnail"
                    >
                      <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                      </svg>
                    </button>
                  )}
                  <button
                    onClick={() => handleDelete(video)}
                    disabled={isDeleting === video.id || !video.objectKey}
                    className="rounded bg-red-600 p-1.5 text-white hover:bg-red-500 disabled:opacity-50"
                    title={video.objectKey ? 'Delete video' : 'External URL (cannot delete)'}
                  >
                    {isDeleting === video.id ? (
                      <svg className="h-4 w-4 animate-spin" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                      </svg>
                    ) : (
                      <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                      </svg>
                    )}
                  </button>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      )}

      {/* Selected Video Preview */}
      {selectedVideo && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="rounded-lg bg-slate-800 p-3"
        >
          <div className="mb-2 flex items-center justify-between">
            <p className="text-sm font-medium text-white">{selectedVideo.name}</p>
            <button
              onClick={() => setSelectedVideo(null)}
              className="text-slate-400 hover:text-white"
            >
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
          <video
            src={selectedVideo.publicUrl}
            className="w-full rounded"
            controls
            preload="metadata"
          />
          <p className="mt-2 truncate text-xs text-slate-500" title={selectedVideo.publicUrl}>
            {selectedVideo.publicUrl}
          </p>
        </motion.div>
      )}
    </div>
  )
}
