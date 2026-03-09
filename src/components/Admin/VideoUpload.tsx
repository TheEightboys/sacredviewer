import { useState, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useR2Upload } from '../../hooks/useR2Upload'
import {
  isValidVideoFile,
  generateVideoThumbnail,
  saveAsset,
  formatFileSize,
} from '../../utils/r2Storage'

interface VideoUploadProps {
  onUploadComplete: (url: string, objectKey?: string, thumbnail?: string) => void
  currentVideoUrl?: string
  compact?: boolean
}

export function VideoUpload({
  onUploadComplete,
  currentVideoUrl,
  compact = false,
}: VideoUploadProps) {
  const { upload, isUploading, progress, error, reset } = useR2Upload()
  const [isDragging, setIsDragging] = useState(false)

  const handleFileDrop = useCallback(
    async (file: File) => {
      if (!isValidVideoFile(file)) {
        alert('Please select a valid video file (.mp4, .webm, .mov)')
        return
      }

      const result = await upload(file)
      if (result.success && result.publicUrl && result.objectKey) {
        // Try to generate thumbnail
        let thumbUrl: string | undefined
        try {
          thumbUrl = await generateVideoThumbnail(result.publicUrl)
        } catch {
          // Thumbnail generation failed, continue without it
        }

        // Save asset to local tracking
        saveAsset({
          id: result.objectKey,
          name: file.name,
          type: 'video',
          objectKey: result.objectKey,
          publicUrl: result.publicUrl,
          size: file.size,
          uploadedAt: Date.now(),
          thumbnail: thumbUrl,
        })

        onUploadComplete(result.publicUrl, result.objectKey, thumbUrl)
      }
    },
    [upload, onUploadComplete]
  )

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setIsDragging(true)
  }, [])

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setIsDragging(false)
  }, [])

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault()
      e.stopPropagation()
      setIsDragging(false)

      const file = e.dataTransfer.files[0]
      if (file) {
        handleFileDrop(file)
      }
    },
    [handleFileDrop]
  )

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      handleFileDrop(file)
    }
    e.target.value = ''
  }

  if (compact) {
    return (
      <div className="space-y-2">
        <label
          className={`flex cursor-pointer items-center justify-center gap-2 rounded border-2 border-dashed px-3 py-2 text-sm transition-colors ${
            isDragging
              ? 'border-blue-400 bg-blue-500/10 text-blue-400'
              : 'border-slate-600 text-slate-400 hover:border-slate-500 hover:text-white'
          } ${isUploading ? 'pointer-events-none opacity-50' : ''}`}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
        >
          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12"
            />
          </svg>
          {isUploading ? `Uploading ${progress?.percentage || 0}%` : 'Upload video'}
          <input
            type="file"
            accept="video/mp4,video/webm,video/quicktime"
            onChange={handleFileChange}
            className="hidden"
            disabled={isUploading}
          />
        </label>

        {isUploading && progress && (
          <div className="h-1 overflow-hidden rounded-full bg-slate-700">
            <motion.div
              className="h-full bg-blue-500"
              initial={{ width: 0 }}
              animate={{ width: `${progress.percentage}%` }}
            />
          </div>
        )}

        {error && (
          <p className="text-xs text-red-400">{error}</p>
        )}
      </div>
    )
  }

  return (
    <div className="space-y-3">
      {/* Drop Zone */}
      <motion.div
        className={`relative cursor-pointer rounded-lg border-2 border-dashed p-6 text-center transition-colors ${
          isUploading
            ? 'pointer-events-none border-slate-700 bg-slate-800/50'
            : isDragging
              ? 'border-blue-400 bg-blue-500/10'
              : 'border-slate-600 bg-slate-800/50 hover:border-slate-500'
        }`}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={() => {
          if (!isUploading) {
            document.getElementById('video-upload-input')?.click()
          }
        }}
        whileHover={isUploading ? {} : { scale: 1.01 }}
        whileTap={isUploading ? {} : { scale: 0.99 }}
      >
        <input
          id="video-upload-input"
          type="file"
          accept="video/mp4,video/webm,video/quicktime"
          onChange={handleFileChange}
          className="hidden"
          disabled={isUploading}
        />

        <AnimatePresence mode="wait">
          {isUploading ? (
            <motion.div
              key="uploading"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="space-y-3"
            >
              <svg
                className="mx-auto h-10 w-10 animate-pulse text-blue-400"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"
                />
              </svg>
              <div>
                <p className="font-medium text-white">Uploading...</p>
                <p className="text-2xl font-bold text-blue-400">{progress?.percentage || 0}%</p>
              </div>
              <div className="mx-auto h-2 w-48 overflow-hidden rounded-full bg-slate-700">
                <motion.div
                  className="h-full bg-blue-500"
                  initial={{ width: 0 }}
                  animate={{ width: `${progress?.percentage || 0}%` }}
                />
              </div>
              {progress && (
                <p className="text-xs text-slate-500">
                  {formatFileSize(progress.loaded)} / {formatFileSize(progress.total)}
                </p>
              )}
            </motion.div>
          ) : isDragging ? (
            <motion.div
              key="dragging"
              initial={{ opacity: 0, y: 5 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -5 }}
              className="text-blue-400"
            >
              <svg
                className="mx-auto mb-2 h-10 w-10"
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
              <p className="font-medium">Drop video here</p>
            </motion.div>
          ) : (
            <motion.div
              key="default"
              initial={{ opacity: 0, y: 5 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -5 }}
              className="text-slate-400"
            >
              <svg
                className="mx-auto mb-2 h-10 w-10"
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
              <p className="font-medium text-white">Upload Video</p>
              <p className="mt-1 text-sm">Drag & drop or click to select</p>
              <p className="mt-1 text-xs text-slate-500">.mp4, .webm, .mov</p>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>

      {/* Error */}
      {error && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="flex items-center justify-between rounded-lg bg-red-500/10 p-3 text-red-400"
        >
          <span className="text-sm">{error}</span>
          <button onClick={reset} className="text-xs underline hover:no-underline">
            Dismiss
          </button>
        </motion.div>
      )}

      {/* Current Video Preview */}
      {currentVideoUrl && !isUploading && (
        <div className="rounded-lg bg-slate-800/50 p-3">
          <p className="mb-2 text-xs text-slate-500">Current Video</p>
          <div className="relative aspect-video overflow-hidden rounded bg-black">
            <video
              src={currentVideoUrl}
              className="h-full w-full object-contain"
              controls
              preload="metadata"
            />
          </div>
          <p className="mt-2 truncate text-xs text-slate-500" title={currentVideoUrl}>
            {currentVideoUrl}
          </p>
        </div>
      )}
    </div>
  )
}
