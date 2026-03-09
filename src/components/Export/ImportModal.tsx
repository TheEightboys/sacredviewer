import { useState, useCallback, useRef } from 'react'
import { motion } from 'framer-motion'
import { useExportStore } from '../../store/useExportStore'

interface ImportModalProps {
  onClose: () => void
}

type ImportType = 'json' | 'csv' | 'url'

interface ImportResult {
  success: boolean
  message: string
  details?: string[]
}

export function ImportModal({ onClose }: ImportModalProps) {
  const [importType, setImportType] = useState<ImportType>('json')
  const [textContent, setTextContent] = useState('')
  const [urlInput, setUrlInput] = useState('')
  const [result, setResult] = useState<ImportResult | null>(null)
  const [isImporting, setIsImporting] = useState(false)

  const fileInputRef = useRef<HTMLInputElement>(null)

  const { importProjectJson, importMarkersCSV, parseShareUrl } = useExportStore()

  const handleFileSelect = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    const reader = new FileReader()
    reader.onload = (event) => {
      const content = event.target?.result as string
      setTextContent(content)
      setResult(null)
    }
    reader.readAsText(file)
  }, [])

  const handleImport = useCallback(async () => {
    setIsImporting(true)
    setResult(null)

    try {
      if (importType === 'json') {
        if (!textContent.trim()) {
          setResult({ success: false, message: 'Please provide JSON content or select a file' })
          return
        }

        const success = importProjectJson(textContent)
        setResult({
          success,
          message: success ? 'Project imported successfully!' : 'Failed to import project. Invalid format.',
        })
      } else if (importType === 'csv') {
        if (!textContent.trim()) {
          setResult({ success: false, message: 'Please provide CSV content or select a file' })
          return
        }

        const { success, imported, errors } = importMarkersCSV(textContent)
        setResult({
          success,
          message: success ? `Imported ${imported} markers successfully!` : 'Failed to import markers',
          details: errors.length > 0 ? errors : undefined,
        })
      } else if (importType === 'url') {
        if (!urlInput.trim()) {
          setResult({ success: false, message: 'Please provide a share URL' })
          return
        }

        const parsed = parseShareUrl(urlInput)
        if (!parsed || !parsed.config) {
          setResult({ success: false, message: 'Invalid share URL or no embedded data found' })
          return
        }

        // Import the parsed config
        const success = importProjectJson(JSON.stringify(parsed.config))
        setResult({
          success,
          message: success ? 'Project imported from URL successfully!' : 'Failed to import from URL',
        })
      }
    } catch (error) {
      setResult({
        success: false,
        message: 'An error occurred during import',
        details: [String(error)],
      })
    } finally {
      setIsImporting(false)
    }
  }, [importType, textContent, urlInput, importProjectJson, importMarkersCSV, parseShareUrl])

  const importTypes: { id: ImportType; name: string; description: string; accept: string }[] = [
    {
      id: 'json',
      name: 'Project JSON',
      description: 'Import complete project with config, markers, and tours',
      accept: '.json',
    },
    {
      id: 'csv',
      name: 'Markers CSV',
      description: 'Import markers from spreadsheet',
      accept: '.csv',
    },
    {
      id: 'url',
      name: 'Share URL',
      description: 'Import from a shared link',
      accept: '',
    },
  ]

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
            <h2 className="text-lg font-semibold text-white">Import Project</h2>
            <p className="text-sm text-slate-400">Import data from various sources</p>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-white">
            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Import Type Selection */}
        <div className="border-b border-slate-700 p-6">
          <h3 className="mb-3 text-sm font-medium text-slate-300">Import Type</h3>
          <div className="grid gap-3 sm:grid-cols-3">
            {importTypes.map((type) => (
              <button
                key={type.id}
                onClick={() => {
                  setImportType(type.id)
                  setTextContent('')
                  setUrlInput('')
                  setResult(null)
                }}
                className={`rounded-lg p-4 text-left transition-colors ${
                  importType === type.id
                    ? 'bg-blue-600 text-white'
                    : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
                }`}
              >
                <div className="mb-1 font-medium">{type.name}</div>
                <p className="text-xs opacity-80">{type.description}</p>
              </button>
            ))}
          </div>
        </div>

        {/* Input Area */}
        <div className="flex-1 overflow-y-auto p-6">
          {importType === 'url' ? (
            <div>
              <label className="mb-2 block text-sm font-medium text-slate-300">Share URL</label>
              <input
                type="url"
                value={urlInput}
                onChange={(e) => {
                  setUrlInput(e.target.value)
                  setResult(null)
                }}
                placeholder="https://example.com/?data=..."
                className="w-full rounded-lg bg-slate-800 px-4 py-3 text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          ) : (
            <>
              <div className="mb-4">
                <label className="mb-2 block text-sm font-medium text-slate-300">
                  Upload File
                </label>
                <div className="flex gap-3">
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept={importTypes.find((t) => t.id === importType)?.accept}
                    onChange={handleFileSelect}
                    className="hidden"
                  />
                  <button
                    onClick={() => fileInputRef.current?.click()}
                    className="flex items-center gap-2 rounded-lg bg-slate-800 px-4 py-2 text-sm text-slate-300 transition-colors hover:bg-slate-700"
                  >
                    <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12"
                      />
                    </svg>
                    Choose File
                  </button>
                  {textContent && (
                    <span className="flex items-center text-sm text-green-400">
                      File loaded ({textContent.length} characters)
                    </span>
                  )}
                </div>
              </div>

              <div>
                <label className="mb-2 block text-sm font-medium text-slate-300">
                  Or Paste Content
                </label>
                <textarea
                  value={textContent}
                  onChange={(e) => {
                    setTextContent(e.target.value)
                    setResult(null)
                  }}
                  placeholder={
                    importType === 'json'
                      ? '{\n  "version": "1.0.0",\n  "config": {...},\n  "tours": [...]\n}'
                      : 'title,position_x,position_y,position_z\n"Marker 1",0,1,0'
                  }
                  className="h-48 w-full resize-none rounded-lg bg-slate-800 px-4 py-3 font-mono text-sm text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </>
          )}

          {/* Result */}
          {result && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className={`mt-4 rounded-lg p-4 ${
                result.success
                  ? 'bg-green-600/20 text-green-400'
                  : 'bg-red-600/20 text-red-400'
              }`}
            >
              <div className="flex items-center gap-2">
                {result.success ? (
                  <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M5 13l4 4L19 7"
                    />
                  </svg>
                ) : (
                  <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                    />
                  </svg>
                )}
                <span className="font-medium">{result.message}</span>
              </div>
              {result.details && result.details.length > 0 && (
                <ul className="mt-2 list-inside list-disc text-sm opacity-80">
                  {result.details.map((detail, i) => (
                    <li key={i}>{detail}</li>
                  ))}
                </ul>
              )}
            </motion.div>
          )}
        </div>

        {/* Actions */}
        <div className="flex gap-3 border-t border-slate-700 px-6 py-4">
          <button
            onClick={onClose}
            className="flex-1 rounded-lg bg-slate-700 py-2.5 text-sm font-medium text-white transition-colors hover:bg-slate-600"
          >
            Cancel
          </button>
          <button
            onClick={handleImport}
            disabled={isImporting}
            className="flex-1 rounded-lg bg-blue-600 py-2.5 text-sm font-medium text-white transition-colors hover:bg-blue-500 disabled:opacity-50"
          >
            {isImporting ? 'Importing...' : 'Import'}
          </button>
        </div>
      </motion.div>
    </motion.div>
  )
}
