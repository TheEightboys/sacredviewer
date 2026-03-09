import { useState, useCallback } from 'react'
import { uploadToR2, UploadResult, UploadProgress } from '../utils/r2Storage'

interface UseR2UploadReturn {
  upload: (file: File) => Promise<UploadResult>
  isUploading: boolean
  progress: UploadProgress | null
  error: string | null
  reset: () => void
}

export function useR2Upload(): UseR2UploadReturn {
  const [isUploading, setIsUploading] = useState(false)
  const [progress, setProgress] = useState<UploadProgress | null>(null)
  const [error, setError] = useState<string | null>(null)

  const upload = useCallback(async (file: File): Promise<UploadResult> => {
    setIsUploading(true)
    setProgress(null)
    setError(null)

    const result = await uploadToR2(file, setProgress)

    setIsUploading(false)

    if (!result.success) {
      setError(result.error || 'Upload failed')
    }

    return result
  }, [])

  const reset = useCallback(() => {
    setIsUploading(false)
    setProgress(null)
    setError(null)
  }, [])

  return { upload, isUploading, progress, error, reset }
}
