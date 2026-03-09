import { motion } from 'framer-motion'
import { FileDropZone } from './FileDropZone'
import { useR2Upload } from '../../hooks/useR2Upload'
import { useAdminStore } from '../../store/useAdminStore'
import { isValidModelFile } from '../../utils/r2Storage'

export function ModelUpload() {
  const { upload, isUploading, progress, error, reset } = useR2Upload()
  const { config, setModelUrl } = useAdminStore()

  const handleFileDrop = async (file: File) => {
    if (!isValidModelFile(file)) {
      alert('Please select a .glb or .gltf file')
      return
    }

    const result = await upload(file)
    if (result.success && result.publicUrl) {
      setModelUrl(result.publicUrl, result.objectKey)
    }
  }

  return (
    <div className="space-y-4">
      <h3 className="text-sm font-semibold uppercase tracking-wider text-slate-400">
        3D Model
      </h3>

      <FileDropZone
        onFileDrop={handleFileDrop}
        accept=".glb,.gltf"
        label="Upload 3D Model"
        hint="Drag & drop or click to select (.glb, .gltf)"
        disabled={isUploading}
      />

      {/* Upload Progress */}
      {isUploading && progress && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="space-y-2"
        >
          <div className="flex justify-between text-sm">
            <span className="text-slate-400">Uploading...</span>
            <span className="font-medium text-white">{progress.percentage}%</span>
          </div>
          <div className="h-2 overflow-hidden rounded-full bg-slate-700">
            <motion.div
              className="h-full bg-blue-500"
              initial={{ width: 0 }}
              animate={{ width: `${progress.percentage}%` }}
              transition={{ duration: 0.2 }}
            />
          </div>
          <p className="text-xs text-slate-500">
            {(progress.loaded / 1024 / 1024).toFixed(2)} MB /{' '}
            {(progress.total / 1024 / 1024).toFixed(2)} MB
          </p>
        </motion.div>
      )}

      {/* Error Message */}
      {error && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="flex items-center justify-between rounded-lg bg-red-500/10 p-3 text-red-400"
        >
          <span className="text-sm">{error}</span>
          <button
            onClick={reset}
            className="text-xs underline hover:no-underline"
          >
            Dismiss
          </button>
        </motion.div>
      )}

      {/* Current Model Info */}
      <div className="rounded-lg bg-slate-800/50 p-3">
        <p className="mb-1 text-xs text-slate-500">Current Model</p>
        <p className="truncate text-sm text-white" title={config.modelUrl}>
          {config.modelUrl}
        </p>
        {config.modelKey && (
          <p className="mt-1 truncate text-xs text-slate-500" title={config.modelKey}>
            Key: {config.modelKey}
          </p>
        )}
      </div>
    </div>
  )
}
