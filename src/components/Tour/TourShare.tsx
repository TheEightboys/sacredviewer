import { useState, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useTourStore } from '../../store/useTourStore'

interface TourShareProps {
  onClose: () => void
}

type TabType = 'link' | 'embed' | 'export'

export function TourShare({ onClose }: TourShareProps) {
  const [activeTab, setActiveTab] = useState<TabType>('link')
  const [selectedTourId, setSelectedTourId] = useState<string | null>(null)
  const [copied, setCopied] = useState(false)
  const [autoPlay, setAutoPlay] = useState(true)
  const [showControls, setShowControls] = useState(true)
  const [embedWidth, setEmbedWidth] = useState('100%')
  const [embedHeight, setEmbedHeight] = useState('600px')

  const { tours } = useTourStore()

  const selectedTour = tours.find((t) => t.id === selectedTourId)

  // Generate shareable URL
  const generateShareUrl = useCallback(() => {
    if (!selectedTour) return ''
    const baseUrl = window.location.origin + window.location.pathname
    const params = new URLSearchParams()
    params.set('tour', selectedTour.id)
    if (autoPlay) params.set('autoplay', '1')
    if (!showControls) params.set('controls', '0')
    return `${baseUrl}?${params.toString()}`
  }, [selectedTour, autoPlay, showControls])

  // Generate embed code
  const generateEmbedCode = useCallback(() => {
    const url = generateShareUrl()
    return `<iframe
  src="${url}&embed=1"
  width="${embedWidth}"
  height="${embedHeight}"
  frameborder="0"
  allowfullscreen
  title="${selectedTour?.name || 'Building Tour'}"
></iframe>`
  }, [generateShareUrl, embedWidth, embedHeight, selectedTour?.name])

  // Export tour as JSON
  const exportTourJson = useCallback(() => {
    if (!selectedTour) return ''
    return JSON.stringify(selectedTour, null, 2)
  }, [selectedTour])

  // Copy to clipboard
  const copyToClipboard = useCallback(async (text: string) => {
    try {
      await navigator.clipboard.writeText(text)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch {
      // Fallback for older browsers
      const textarea = document.createElement('textarea')
      textarea.value = text
      document.body.appendChild(textarea)
      textarea.select()
      document.execCommand('copy')
      document.body.removeChild(textarea)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    }
  }, [])

  // Download JSON file
  const downloadJson = useCallback(() => {
    if (!selectedTour) return
    const json = exportTourJson()
    const blob = new Blob([json], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `${selectedTour.name.replace(/\s+/g, '-').toLowerCase()}-tour.json`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
  }, [selectedTour, exportTourJson])

  const tabs: { id: TabType; label: string }[] = [
    { id: 'link', label: 'Share Link' },
    { id: 'embed', label: 'Embed' },
    { id: 'export', label: 'Export' },
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
        className="w-full max-w-lg overflow-hidden rounded-xl bg-slate-900 shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-700 px-6 py-4">
          <h2 className="text-lg font-semibold text-white">Share Tour</h2>
          <button onClick={onClose} className="text-slate-400 hover:text-white">
            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </button>
        </div>

        {/* Tour Selection */}
        <div className="border-b border-slate-700 px-6 py-4">
          <label className="mb-2 block text-sm font-medium text-slate-400">Select Tour</label>
          <select
            value={selectedTourId || ''}
            onChange={(e) => setSelectedTourId(e.target.value || null)}
            className="w-full rounded-lg bg-slate-800 px-4 py-2 text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="">Choose a tour...</option>
            {tours.map((tour) => (
              <option key={tour.id} value={tour.id}>
                {tour.name} ({tour.stops.length} stops)
              </option>
            ))}
          </select>
        </div>

        {selectedTour && (
          <>
            {/* Tabs */}
            <div className="flex border-b border-slate-700">
              {tabs.map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex-1 px-4 py-3 text-sm font-medium transition-colors ${
                    activeTab === tab.id
                      ? 'border-b-2 border-blue-500 text-white'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>

            {/* Tab Content */}
            <div className="p-6">
              <AnimatePresence mode="wait">
                {activeTab === 'link' && (
                  <motion.div
                    key="link"
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: 10 }}
                    className="space-y-4"
                  >
                    {/* Options */}
                    <div className="flex flex-wrap gap-4">
                      <label className="flex items-center gap-2">
                        <input
                          type="checkbox"
                          checked={autoPlay}
                          onChange={(e) => setAutoPlay(e.target.checked)}
                          className="rounded border-slate-600 bg-slate-700 text-blue-500"
                        />
                        <span className="text-sm text-slate-300">Auto-play</span>
                      </label>
                      <label className="flex items-center gap-2">
                        <input
                          type="checkbox"
                          checked={showControls}
                          onChange={(e) => setShowControls(e.target.checked)}
                          className="rounded border-slate-600 bg-slate-700 text-blue-500"
                        />
                        <span className="text-sm text-slate-300">Show controls</span>
                      </label>
                    </div>

                    {/* URL */}
                    <div className="rounded-lg bg-slate-800 p-3">
                      <p className="mb-2 break-all text-sm text-slate-300">{generateShareUrl()}</p>
                      <button
                        onClick={() => copyToClipboard(generateShareUrl())}
                        className="w-full rounded bg-blue-600 py-2 text-sm font-medium text-white transition-colors hover:bg-blue-500"
                      >
                        {copied ? 'Copied!' : 'Copy Link'}
                      </button>
                    </div>
                  </motion.div>
                )}

                {activeTab === 'embed' && (
                  <motion.div
                    key="embed"
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: 10 }}
                    className="space-y-4"
                  >
                    {/* Embed Options */}
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="mb-1 block text-xs text-slate-400">Width</label>
                        <input
                          type="text"
                          value={embedWidth}
                          onChange={(e) => setEmbedWidth(e.target.value)}
                          className="w-full rounded bg-slate-800 px-3 py-2 text-sm text-white focus:outline-none focus:ring-1 focus:ring-blue-500"
                          placeholder="100%"
                        />
                      </div>
                      <div>
                        <label className="mb-1 block text-xs text-slate-400">Height</label>
                        <input
                          type="text"
                          value={embedHeight}
                          onChange={(e) => setEmbedHeight(e.target.value)}
                          className="w-full rounded bg-slate-800 px-3 py-2 text-sm text-white focus:outline-none focus:ring-1 focus:ring-blue-500"
                          placeholder="600px"
                        />
                      </div>
                    </div>

                    {/* Embed Code */}
                    <div className="rounded-lg bg-slate-800 p-3">
                      <pre className="overflow-x-auto whitespace-pre-wrap text-xs text-slate-300">
                        {generateEmbedCode()}
                      </pre>
                    </div>

                    <button
                      onClick={() => copyToClipboard(generateEmbedCode())}
                      className="w-full rounded bg-blue-600 py-2 text-sm font-medium text-white transition-colors hover:bg-blue-500"
                    >
                      {copied ? 'Copied!' : 'Copy Embed Code'}
                    </button>
                  </motion.div>
                )}

                {activeTab === 'export' && (
                  <motion.div
                    key="export"
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: 10 }}
                    className="space-y-4"
                  >
                    {/* Export JSON Preview */}
                    <div className="max-h-60 overflow-auto rounded-lg bg-slate-800 p-3">
                      <pre className="whitespace-pre-wrap text-xs text-slate-300">
                        {exportTourJson()}
                      </pre>
                    </div>

                    <div className="flex gap-3">
                      <button
                        onClick={() => copyToClipboard(exportTourJson())}
                        className="flex-1 rounded bg-slate-700 py-2 text-sm font-medium text-white transition-colors hover:bg-slate-600"
                      >
                        {copied ? 'Copied!' : 'Copy JSON'}
                      </button>
                      <button
                        onClick={downloadJson}
                        className="flex-1 rounded bg-blue-600 py-2 text-sm font-medium text-white transition-colors hover:bg-blue-500"
                      >
                        Download File
                      </button>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </>
        )}

        {!selectedTour && (
          <div className="flex h-40 items-center justify-center text-slate-500">
            Select a tour to share
          </div>
        )}
      </motion.div>
    </motion.div>
  )
}
