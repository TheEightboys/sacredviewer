import { useState, useCallback } from 'react'
import { motion } from 'framer-motion'
import { useExportStore } from '../../store/useExportStore'

interface ExportModalProps {
  onClose: () => void
}

type ExportFormat = 'json' | 'csv' | 'html'

export function ExportModal({ onClose }: ExportModalProps) {
  const [selectedFormat, setSelectedFormat] = useState<ExportFormat>('json')
  const [copied, setCopied] = useState(false)
  const [preview, setPreview] = useState<string | null>(null)

  const { exportProjectJson, exportMarkersCSV, exportStandaloneHTML } = useExportStore()

  const formats: { id: ExportFormat; name: string; description: string; extension: string }[] = [
    {
      id: 'json',
      name: 'Project JSON',
      description: 'Complete project with config, markers, tours, and comments',
      extension: '.json',
    },
    {
      id: 'csv',
      name: 'Markers CSV',
      description: 'Marker data in spreadsheet format',
      extension: '.csv',
    },
    {
      id: 'html',
      name: 'Standalone HTML',
      description: 'Self-contained HTML viewer with embedded data',
      extension: '.html',
    },
  ]

  const getExportContent = useCallback(() => {
    switch (selectedFormat) {
      case 'json':
        return exportProjectJson()
      case 'csv':
        return exportMarkersCSV()
      case 'html':
        return exportStandaloneHTML()
      default:
        return ''
    }
  }, [selectedFormat, exportProjectJson, exportMarkersCSV, exportStandaloneHTML])

  const handlePreview = useCallback(() => {
    const content = getExportContent()
    setPreview(content)
  }, [getExportContent])

  const handleDownload = useCallback(() => {
    const content = getExportContent()
    const format = formats.find((f) => f.id === selectedFormat)
    const filename = `building-viewer-export${format?.extension || '.txt'}`

    const mimeTypes: Record<ExportFormat, string> = {
      json: 'application/json',
      csv: 'text/csv',
      html: 'text/html',
    }

    const blob = new Blob([content], { type: mimeTypes[selectedFormat] })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = filename
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
  }, [getExportContent, selectedFormat])

  const handleCopy = useCallback(async () => {
    const content = getExportContent()
    try {
      await navigator.clipboard.writeText(content)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch {
      // Fallback
      const textarea = document.createElement('textarea')
      textarea.value = content
      document.body.appendChild(textarea)
      textarea.select()
      document.execCommand('copy')
      document.body.removeChild(textarea)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    }
  }, [getExportContent])

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm"
      onClick={onClose}
    >
      <motion.div
        initial={{ scale: 0.95, y: 20 }}
        animate={{ scale: 1, y: 0 }}
        exit={{ scale: 0.95, y: 20 }}
        className="flex max-h-[90vh] w-full max-w-2xl flex-col overflow-hidden rounded-xl bg-slate-900 shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-700 px-6 py-4">
          <div>
            <h2 className="text-lg font-semibold text-white">Export Project</h2>
            <p className="text-sm text-slate-400">Choose a format to export your project</p>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-white">
            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Format Selection */}
        <div className="border-b border-slate-700 p-6">
          <h3 className="mb-3 text-sm font-medium text-slate-300">Export Format</h3>
          <div className="grid gap-3 sm:grid-cols-3">
            {formats.map((format) => (
              <button
                key={format.id}
                onClick={() => {
                  setSelectedFormat(format.id)
                  setPreview(null)
                }}
                className={`rounded-lg p-4 text-left transition-colors ${
                  selectedFormat === format.id
                    ? 'bg-blue-600 text-white'
                    : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
                }`}
              >
                <div className="mb-1 flex items-center gap-2">
                  <span className="font-medium">{format.name}</span>
                  <span className="rounded bg-black/20 px-1.5 py-0.5 text-xs">{format.extension}</span>
                </div>
                <p className="text-xs opacity-80">{format.description}</p>
              </button>
            ))}
          </div>
        </div>

        {/* Preview */}
        <div className="flex-1 overflow-hidden p-6">
          {preview ? (
            <div className="h-full">
              <div className="mb-2 flex items-center justify-between">
                <h3 className="text-sm font-medium text-slate-300">Preview</h3>
                <button
                  onClick={() => setPreview(null)}
                  className="text-xs text-slate-400 hover:text-white"
                >
                  Hide Preview
                </button>
              </div>
              <div className="max-h-60 overflow-auto rounded-lg bg-slate-800 p-4">
                <pre className="whitespace-pre-wrap text-xs text-slate-300">{preview.slice(0, 3000)}</pre>
                {preview.length > 3000 && (
                  <p className="mt-2 text-xs text-slate-500">
                    ... and {preview.length - 3000} more characters
                  </p>
                )}
              </div>
            </div>
          ) : (
            <div className="flex h-40 items-center justify-center">
              <button
                onClick={handlePreview}
                className="text-sm text-blue-400 hover:text-blue-300"
              >
                Click to preview export content
              </button>
            </div>
          )}
        </div>

        {/* Actions */}
        <div className="flex gap-3 border-t border-slate-700 px-6 py-4">
          <button
            onClick={handleCopy}
            className="flex-1 rounded-lg bg-slate-700 py-2.5 text-sm font-medium text-white transition-colors hover:bg-slate-600"
          >
            {copied ? 'Copied!' : 'Copy to Clipboard'}
          </button>
          <button
            onClick={handleDownload}
            className="flex-1 rounded-lg bg-blue-600 py-2.5 text-sm font-medium text-white transition-colors hover:bg-blue-500"
          >
            Download File
          </button>
        </div>
      </motion.div>
    </motion.div>
  )
}
