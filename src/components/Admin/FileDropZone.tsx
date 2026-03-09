import { useState, useCallback, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'

interface FileDropZoneProps {
  onFileDrop: (file: File) => void
  accept: string
  label: string
  hint?: string
  disabled?: boolean
}

export function FileDropZone({
  onFileDrop,
  accept,
  label,
  hint,
  disabled = false,
}: FileDropZoneProps) {
  const [isDragging, setIsDragging] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    if (!disabled) {
      setIsDragging(true)
    }
  }, [disabled])

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

      if (disabled) return

      const file = e.dataTransfer.files[0]
      if (file) {
        onFileDrop(file)
      }
    },
    [onFileDrop, disabled]
  )

  const handleClick = () => {
    if (!disabled) {
      inputRef.current?.click()
    }
  }

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      onFileDrop(file)
    }
    // Reset input so same file can be selected again
    e.target.value = ''
  }

  return (
    <motion.div
      className={`relative cursor-pointer rounded-lg border-2 border-dashed p-6 text-center transition-colors ${
        disabled
          ? 'cursor-not-allowed border-slate-700 bg-slate-800/50 opacity-50'
          : isDragging
            ? 'border-blue-400 bg-blue-500/10'
            : 'border-slate-600 bg-slate-800/50 hover:border-slate-500 hover:bg-slate-800'
      }`}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
      onClick={handleClick}
      whileHover={disabled ? {} : { scale: 1.01 }}
      whileTap={disabled ? {} : { scale: 0.99 }}
    >
      <input
        ref={inputRef}
        type="file"
        accept={accept}
        onChange={handleFileChange}
        className="hidden"
        disabled={disabled}
      />

      <AnimatePresence mode="wait">
        {isDragging ? (
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
                d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"
              />
            </svg>
            <p className="font-medium">Drop file here</p>
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
                d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12"
              />
            </svg>
            <p className="font-medium text-white">{label}</p>
            {hint && <p className="mt-1 text-sm">{hint}</p>}
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  )
}
