import { useCallback } from 'react'
import { motion } from 'framer-motion'
import { useAdminStore } from '../../store/useAdminStore'
import { useTourStore } from '../../store/useTourStore'
import { useExportStore } from '../../store/useExportStore'

interface PrintViewProps {
  onClose: () => void
}

export function PrintView({ onClose }: PrintViewProps) {
  const config = useAdminStore((state) => state.config)
  const tours = useTourStore((state) => state.tours)
  const comments = useExportStore((state) => state.comments)

  const handlePrint = useCallback(() => {
    window.print()
  }, [])

  const generatePDF = useCallback(() => {
    // Create a printable HTML document
    const printWindow = window.open('', '_blank')
    if (!printWindow) {
      alert('Please allow popups to generate PDF')
      return
    }

    const getMarkerComments = (markerId: string) => {
      return comments.filter((c) => c.markerId === markerId)
    }

    const html = `
      <!DOCTYPE html>
      <html>
      <head>
        <title>3D Building Viewer - Report</title>
        <style>
          * { margin: 0; padding: 0; box-sizing: border-box; }
          body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; padding: 40px; color: #1e293b; line-height: 1.6; }
          .header { margin-bottom: 40px; border-bottom: 2px solid #3b82f6; padding-bottom: 20px; }
          .header h1 { font-size: 28px; color: #1e293b; margin-bottom: 8px; }
          .header p { color: #64748b; }
          .section { margin-bottom: 32px; }
          .section h2 { font-size: 20px; color: #3b82f6; margin-bottom: 16px; border-bottom: 1px solid #e2e8f0; padding-bottom: 8px; }
          .info-grid { display: grid; grid-template-columns: repeat(2, 1fr); gap: 16px; margin-bottom: 24px; }
          .info-item { background: #f8fafc; padding: 12px; border-radius: 8px; }
          .info-item label { font-size: 12px; color: #64748b; text-transform: uppercase; }
          .info-item value { font-size: 16px; color: #1e293b; display: block; }
          .marker-card { border: 1px solid #e2e8f0; border-radius: 8px; padding: 16px; margin-bottom: 16px; page-break-inside: avoid; }
          .marker-card h3 { font-size: 16px; color: #1e293b; margin-bottom: 8px; }
          .marker-card p { color: #64748b; font-size: 14px; }
          .marker-meta { display: flex; gap: 16px; margin-top: 8px; font-size: 12px; color: #94a3b8; }
          .marker-comments { margin-top: 12px; padding-top: 12px; border-top: 1px dashed #e2e8f0; }
          .comment { background: #fef3c7; padding: 8px; border-radius: 4px; margin-bottom: 8px; font-size: 13px; }
          .comment-author { font-weight: 600; color: #92400e; }
          .tour-card { border: 1px solid #e2e8f0; border-radius: 8px; padding: 16px; margin-bottom: 16px; }
          .tour-stops { margin-top: 12px; }
          .tour-stop { display: flex; align-items: center; gap: 8px; padding: 8px 0; border-bottom: 1px solid #f1f5f9; }
          .tour-stop:last-child { border-bottom: none; }
          .stop-number { width: 24px; height: 24px; background: #3b82f6; color: white; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-size: 12px; font-weight: bold; }
          .footer { margin-top: 40px; padding-top: 20px; border-top: 1px solid #e2e8f0; text-align: center; color: #94a3b8; font-size: 12px; }
          @media print {
            body { padding: 20px; }
            .marker-card, .tour-card { break-inside: avoid; }
          }
        </style>
      </head>
      <body>
        <div class="header">
          <h1>3D Building Viewer</h1>
          <p>Generated on ${new Date().toLocaleDateString()} at ${new Date().toLocaleTimeString()}</p>
        </div>

        <div class="section">
          <h2>Project Information</h2>
          <div class="info-grid">
            <div class="info-item">
              <label>Model</label>
              <value>${config.modelUrl}</value>
            </div>
            <div class="info-item">
              <label>Scale</label>
              <value>${config.scale}</value>
            </div>
            <div class="info-item">
              <label>Total Markers</label>
              <value>${config.markers.length}</value>
            </div>
            <div class="info-item">
              <label>Total Tours</label>
              <value>${tours.length}</value>
            </div>
          </div>
        </div>

        <div class="section">
          <h2>Markers (${config.markers.length})</h2>
          ${config.markers
            .map((marker, index) => {
              const markerComments = getMarkerComments(marker.id)
              return `
              <div class="marker-card">
                <h3>${index + 1}. ${marker.title || 'Untitled Marker'}</h3>
                <p>${marker.description || 'No description provided'}</p>
                <div class="marker-meta">
                  <span>Type: ${marker.type || 'info'}</span>
                  <span>Position: [${marker.position.map((p) => p.toFixed(2)).join(', ')}]</span>
                  ${marker.videoUrl ? `<span>Has Video</span>` : ''}
                </div>
                ${
                  markerComments.length > 0
                    ? `
                  <div class="marker-comments">
                    <strong style="font-size: 12px; color: #64748b;">Comments (${markerComments.length}):</strong>
                    ${markerComments
                      .map(
                        (c) => `
                      <div class="comment">
                        <span class="comment-author">${c.author}:</span> ${c.text}
                      </div>
                    `
                      )
                      .join('')}
                  </div>
                `
                    : ''
                }
              </div>
            `
            })
            .join('')}
        </div>

        ${
          tours.length > 0
            ? `
          <div class="section">
            <h2>Tours (${tours.length})</h2>
            ${tours
              .map(
                (tour) => `
              <div class="tour-card">
                <h3>${tour.name}</h3>
                <p>${tour.description || 'No description'}</p>
                <div class="marker-meta">
                  <span>${tour.stops.length} stops</span>
                  <span>Transition: ${tour.transitionDuration}ms</span>
                  ${tour.loop ? '<span>Loops</span>' : ''}
                </div>
                <div class="tour-stops">
                  ${tour.stops
                    .map((stop, i) => {
                      const marker = config.markers.find((m) => m.id === stop.markerId)
                      return `
                      <div class="tour-stop">
                        <div class="stop-number">${i + 1}</div>
                        <span>${marker?.title || 'Unknown Marker'}</span>
                        <span style="color: #94a3b8; font-size: 12px;">(${stop.duration}s, ${stop.transition})</span>
                      </div>
                    `
                    })
                    .join('')}
                </div>
              </div>
            `
              )
              .join('')}
          </div>
        `
            : ''
        }

        <div class="footer">
          <p>3D Building Viewer Report</p>
        </div>
      </body>
      </html>
    `

    printWindow.document.write(html)
    printWindow.document.close()
    printWindow.focus()

    // Wait for content to load then print
    setTimeout(() => {
      printWindow.print()
    }, 250)
  }, [config, tours, comments])

  const getGroupedMarkers = useCallback(() => {
    const groups: Record<string, typeof config.markers> = { ungrouped: [] }

    config.markers.forEach((marker) => {
      const groupId = marker.groupId || 'ungrouped'
      if (!groups[groupId]) {
        groups[groupId] = []
      }
      groups[groupId].push(marker)
    })

    return groups
  }, [config.markers])

  const groupedMarkers = getGroupedMarkers()

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
        className="flex max-h-[90vh] w-full max-w-3xl flex-col overflow-hidden rounded-xl bg-slate-900 shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-700 px-6 py-4">
          <div>
            <h2 className="text-lg font-semibold text-white">Print / PDF Report</h2>
            <p className="text-sm text-slate-400">Preview and print your project report</p>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-white">
            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Preview */}
        <div className="flex-1 overflow-y-auto p-6">
          {/* Summary */}
          <div className="mb-6 rounded-lg bg-slate-800 p-4">
            <h3 className="mb-3 text-sm font-semibold text-slate-400">Report Summary</h3>
            <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
              <div>
                <p className="text-2xl font-bold text-white">{config.markers.length}</p>
                <p className="text-xs text-slate-400">Markers</p>
              </div>
              <div>
                <p className="text-2xl font-bold text-white">{tours.length}</p>
                <p className="text-xs text-slate-400">Tours</p>
              </div>
              <div>
                <p className="text-2xl font-bold text-white">{Object.keys(groupedMarkers).length}</p>
                <p className="text-xs text-slate-400">Groups</p>
              </div>
              <div>
                <p className="text-2xl font-bold text-white">{comments.length}</p>
                <p className="text-xs text-slate-400">Comments</p>
              </div>
            </div>
          </div>

          {/* Marker List Preview */}
          <div className="mb-6">
            <h3 className="mb-3 text-sm font-semibold text-slate-400">Markers Preview</h3>
            <div className="max-h-60 space-y-2 overflow-y-auto rounded-lg bg-slate-800 p-3">
              {config.markers.slice(0, 10).map((marker, index) => (
                <div key={marker.id} className="flex items-center gap-3 text-sm">
                  <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-blue-600 text-xs font-bold text-white">
                    {index + 1}
                  </span>
                  <span className="flex-1 truncate text-slate-300">{marker.title || 'Untitled'}</span>
                  <span className="text-xs text-slate-500">{marker.type || 'info'}</span>
                </div>
              ))}
              {config.markers.length > 10 && (
                <p className="text-center text-xs text-slate-500">
                  ... and {config.markers.length - 10} more markers
                </p>
              )}
            </div>
          </div>

          {/* Tours Preview */}
          {tours.length > 0 && (
            <div>
              <h3 className="mb-3 text-sm font-semibold text-slate-400">Tours Preview</h3>
              <div className="space-y-2 rounded-lg bg-slate-800 p-3">
                {tours.map((tour) => (
                  <div key={tour.id} className="flex items-center justify-between text-sm">
                    <span className="text-slate-300">{tour.name}</span>
                    <span className="text-xs text-slate-500">{tour.stops.length} stops</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Actions */}
        <div className="flex gap-3 border-t border-slate-700 px-6 py-4">
          <button
            onClick={handlePrint}
            className="flex flex-1 items-center justify-center gap-2 rounded-lg bg-slate-700 py-2.5 text-sm font-medium text-white transition-colors hover:bg-slate-600"
          >
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z"
              />
            </svg>
            Print This Page
          </button>
          <button
            onClick={generatePDF}
            className="flex flex-1 items-center justify-center gap-2 rounded-lg bg-blue-600 py-2.5 text-sm font-medium text-white transition-colors hover:bg-blue-500"
          >
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z"
              />
            </svg>
            Generate Full Report
          </button>
        </div>
      </motion.div>
    </motion.div>
  )
}
