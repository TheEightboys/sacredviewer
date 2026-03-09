import { useState, useCallback, useEffect, useRef } from 'react'
import { motion } from 'framer-motion'
import { useExportStore } from '../../store/useExportStore'
import { useTourStore } from '../../store/useTourStore'

interface ShareModalProps {
  onClose: () => void
}

type ShareTab = 'link' | 'embed' | 'qr' | 'social'

// Simple QR Code generator using canvas
function generateQRCode(text: string, size: number = 200): string {
  // This is a simplified QR code placeholder - in production you'd use a proper QR library
  // For now, we'll generate a placeholder with the URL encoded
  const canvas = document.createElement('canvas')
  canvas.width = size
  canvas.height = size
  const ctx = canvas.getContext('2d')

  if (!ctx) return ''

  // Draw a placeholder QR pattern
  ctx.fillStyle = '#ffffff'
  ctx.fillRect(0, 0, size, size)

  ctx.fillStyle = '#000000'

  // Create a simple pattern based on the text hash
  const hash = text.split('').reduce((a, b) => {
    a = (a << 5) - a + b.charCodeAt(0)
    return a & a
  }, 0)

  const cellSize = size / 25

  // Draw position detection patterns (corners)
  const drawPositionPattern = (x: number, y: number) => {
    // Outer square
    ctx.fillRect(x * cellSize, y * cellSize, 7 * cellSize, 7 * cellSize)
    ctx.fillStyle = '#ffffff'
    ctx.fillRect((x + 1) * cellSize, (y + 1) * cellSize, 5 * cellSize, 5 * cellSize)
    ctx.fillStyle = '#000000'
    ctx.fillRect((x + 2) * cellSize, (y + 2) * cellSize, 3 * cellSize, 3 * cellSize)
  }

  drawPositionPattern(0, 0)
  drawPositionPattern(18, 0)
  drawPositionPattern(0, 18)

  // Draw data modules based on hash
  for (let row = 0; row < 25; row++) {
    for (let col = 0; col < 25; col++) {
      // Skip position patterns
      if ((row < 8 && col < 8) || (row < 8 && col > 16) || (row > 16 && col < 8)) {
        continue
      }

      // Use hash to determine module color
      const bit = ((hash >> ((row * 25 + col) % 32)) & 1) ^ ((text.charCodeAt((row + col) % text.length) || 0) & 1)
      if (bit) {
        ctx.fillRect(col * cellSize, row * cellSize, cellSize, cellSize)
      }
    }
  }

  return canvas.toDataURL('image/png')
}

export function ShareModal({ onClose }: ShareModalProps) {
  const [activeTab, setActiveTab] = useState<ShareTab>('link')
  const [copied, setCopied] = useState(false)
  const [editMode, setEditMode] = useState(false)
  const [selectedTourId, setSelectedTourId] = useState<string>('')
  const [embedWidth, setEmbedWidth] = useState('100%')
  const [embedHeight, setEmbedHeight] = useState('600')
  const [qrCodeUrl, setQrCodeUrl] = useState<string>('')

  const { generateShareUrl } = useExportStore()
  const { tours } = useTourStore()
  const qrCanvasRef = useRef<HTMLCanvasElement>(null)

  // Generate share URL
  const shareUrl = generateShareUrl({
    editMode,
    tourId: selectedTourId || undefined,
  })

  // Generate QR code when URL changes
  useEffect(() => {
    const qrUrl = generateQRCode(shareUrl, 200)
    setQrCodeUrl(qrUrl)
  }, [shareUrl])

  // Generate embed code
  const embedCode = `<iframe
  src="${shareUrl}&embed=1"
  width="${embedWidth}"
  height="${embedHeight}"
  frameborder="0"
  allowfullscreen
  style="border: none; border-radius: 8px;"
  title="3D Building Viewer"
></iframe>`

  const copyToClipboard = useCallback(async (text: string) => {
    try {
      await navigator.clipboard.writeText(text)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch {
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

  const downloadQRCode = useCallback(() => {
    const a = document.createElement('a')
    a.href = qrCodeUrl
    a.download = 'building-viewer-qr.png'
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
  }, [qrCodeUrl])

  const shareToSocial = useCallback(
    (platform: string) => {
      const encodedUrl = encodeURIComponent(shareUrl)
      const title = encodeURIComponent('Check out this 3D Building Viewer')

      const urls: Record<string, string> = {
        twitter: `https://twitter.com/intent/tweet?url=${encodedUrl}&text=${title}`,
        facebook: `https://www.facebook.com/sharer/sharer.php?u=${encodedUrl}`,
        linkedin: `https://www.linkedin.com/sharing/share-offsite/?url=${encodedUrl}`,
        email: `mailto:?subject=${title}&body=${encodedUrl}`,
      }

      if (urls[platform]) {
        window.open(urls[platform], '_blank', 'width=600,height=400')
      }
    },
    [shareUrl]
  )

  const tabs: { id: ShareTab; label: string }[] = [
    { id: 'link', label: 'Link' },
    { id: 'embed', label: 'Embed' },
    { id: 'qr', label: 'QR Code' },
    { id: 'social', label: 'Social' },
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
          <div>
            <h2 className="text-lg font-semibold text-white">Share Project</h2>
            <p className="text-sm text-slate-400">Share your 3D building viewer</p>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-white">
            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Options */}
        <div className="border-b border-slate-700 px-6 py-4">
          <div className="flex flex-wrap gap-4">
            <label className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={editMode}
                onChange={(e) => setEditMode(e.target.checked)}
                className="rounded border-slate-600 bg-slate-700 text-blue-500"
              />
              <span className="text-sm text-slate-300">Enable edit mode</span>
            </label>

            {tours.length > 0 && (
              <div className="flex items-center gap-2">
                <label className="text-sm text-slate-400">Auto-start tour:</label>
                <select
                  value={selectedTourId}
                  onChange={(e) => setSelectedTourId(e.target.value)}
                  className="rounded bg-slate-700 px-2 py-1 text-sm text-white"
                >
                  <option value="">None</option>
                  {tours.map((tour) => (
                    <option key={tour.id} value={tour.id}>
                      {tour.name}
                    </option>
                  ))}
                </select>
              </div>
            )}
          </div>
        </div>

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
          {activeTab === 'link' && (
            <div className="space-y-4">
              <div className="rounded-lg bg-slate-800 p-3">
                <p className="mb-2 break-all text-sm text-slate-300">{shareUrl}</p>
              </div>
              <button
                onClick={() => copyToClipboard(shareUrl)}
                className="w-full rounded-lg bg-blue-600 py-2.5 text-sm font-medium text-white transition-colors hover:bg-blue-500"
              >
                {copied ? 'Copied!' : 'Copy Link'}
              </button>
            </div>
          )}

          {activeTab === 'embed' && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="mb-1 block text-xs text-slate-400">Width</label>
                  <input
                    type="text"
                    value={embedWidth}
                    onChange={(e) => setEmbedWidth(e.target.value)}
                    className="w-full rounded bg-slate-800 px-3 py-2 text-sm text-white"
                    placeholder="100%"
                  />
                </div>
                <div>
                  <label className="mb-1 block text-xs text-slate-400">Height (px)</label>
                  <input
                    type="text"
                    value={embedHeight}
                    onChange={(e) => setEmbedHeight(e.target.value)}
                    className="w-full rounded bg-slate-800 px-3 py-2 text-sm text-white"
                    placeholder="600"
                  />
                </div>
              </div>
              <div className="rounded-lg bg-slate-800 p-3">
                <pre className="overflow-x-auto whitespace-pre-wrap text-xs text-slate-300">{embedCode}</pre>
              </div>
              <button
                onClick={() => copyToClipboard(embedCode)}
                className="w-full rounded-lg bg-blue-600 py-2.5 text-sm font-medium text-white transition-colors hover:bg-blue-500"
              >
                {copied ? 'Copied!' : 'Copy Embed Code'}
              </button>
            </div>
          )}

          {activeTab === 'qr' && (
            <div className="space-y-4">
              <div className="flex justify-center rounded-lg bg-white p-4">
                {qrCodeUrl ? (
                  <img src={qrCodeUrl} alt="QR Code" className="h-48 w-48" />
                ) : (
                  <div className="flex h-48 w-48 items-center justify-center text-slate-400">
                    Generating...
                  </div>
                )}
                <canvas ref={qrCanvasRef} className="hidden" />
              </div>
              <p className="text-center text-xs text-slate-400">
                Scan to open the 3D Building Viewer
              </p>
              <button
                onClick={downloadQRCode}
                className="w-full rounded-lg bg-blue-600 py-2.5 text-sm font-medium text-white transition-colors hover:bg-blue-500"
              >
                Download QR Code
              </button>
            </div>
          )}

          {activeTab === 'social' && (
            <div className="space-y-4">
              <p className="text-sm text-slate-400">Share on social media</p>
              <div className="grid grid-cols-2 gap-3">
                <button
                  onClick={() => shareToSocial('twitter')}
                  className="flex items-center justify-center gap-2 rounded-lg bg-[#1DA1F2] py-3 text-sm font-medium text-white transition-opacity hover:opacity-90"
                >
                  <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M23.953 4.57a10 10 0 01-2.825.775 4.958 4.958 0 002.163-2.723c-.951.555-2.005.959-3.127 1.184a4.92 4.92 0 00-8.384 4.482C7.69 8.095 4.067 6.13 1.64 3.162a4.822 4.822 0 00-.666 2.475c0 1.71.87 3.213 2.188 4.096a4.904 4.904 0 01-2.228-.616v.06a4.923 4.923 0 003.946 4.827 4.996 4.996 0 01-2.212.085 4.936 4.936 0 004.604 3.417 9.867 9.867 0 01-6.102 2.105c-.39 0-.779-.023-1.17-.067a13.995 13.995 0 007.557 2.209c9.053 0 13.998-7.496 13.998-13.985 0-.21 0-.42-.015-.63A9.935 9.935 0 0024 4.59z" />
                  </svg>
                  Twitter
                </button>
                <button
                  onClick={() => shareToSocial('facebook')}
                  className="flex items-center justify-center gap-2 rounded-lg bg-[#4267B2] py-3 text-sm font-medium text-white transition-opacity hover:opacity-90"
                >
                  <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
                  </svg>
                  Facebook
                </button>
                <button
                  onClick={() => shareToSocial('linkedin')}
                  className="flex items-center justify-center gap-2 rounded-lg bg-[#0A66C2] py-3 text-sm font-medium text-white transition-opacity hover:opacity-90"
                >
                  <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z" />
                  </svg>
                  LinkedIn
                </button>
                <button
                  onClick={() => shareToSocial('email')}
                  className="flex items-center justify-center gap-2 rounded-lg bg-slate-700 py-3 text-sm font-medium text-white transition-colors hover:bg-slate-600"
                >
                  <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                  </svg>
                  Email
                </button>
              </div>
            </div>
          )}
        </div>
      </motion.div>
    </motion.div>
  )
}
