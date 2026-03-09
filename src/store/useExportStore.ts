import { create } from 'zustand'
import { useAdminStore } from './useAdminStore'
import { useTourStore } from './useTourStore'

export interface MarkerComment {
  id: string
  markerId: string
  text: string
  author: string
  timestamp: number
}

export interface ProjectExport {
  version: string
  exportedAt: string
  config: ReturnType<typeof useAdminStore.getState>['config']
  tours: ReturnType<typeof useTourStore.getState>['tours']
  comments?: MarkerComment[]
}

interface ExportState {
  // Comments
  comments: MarkerComment[]

  // Recording state
  isRecording: boolean
  recordingStream: MediaStream | null
  mediaRecorder: MediaRecorder | null
  recordedChunks: Blob[]

  // Actions - Comments
  addComment: (markerId: string, text: string, author?: string) => void
  deleteComment: (commentId: string) => void
  getMarkerComments: (markerId: string) => MarkerComment[]

  // Actions - Export
  exportProjectJson: () => string
  exportMarkersCSV: () => string
  exportStandaloneHTML: () => string

  // Actions - Import
  importProjectJson: (json: string) => boolean
  importMarkersCSV: (csv: string) => { success: boolean; imported: number; errors: string[] }

  // Actions - Share
  generateShareUrl: (options?: { editMode?: boolean; tourId?: string }) => string
  parseShareUrl: (url: string) => { config?: ProjectExport; editMode?: boolean; tourId?: string } | null

  // Actions - Recording
  startRecording: (canvas: HTMLCanvasElement) => Promise<void>
  stopRecording: () => Promise<Blob | null>
  setRecordingState: (isRecording: boolean) => void
}

const STORAGE_KEY = 'building-viewer-comments'
const VERSION = '1.0.0'

function loadComments(): MarkerComment[] {
  try {
    const data = localStorage.getItem(STORAGE_KEY)
    return data ? JSON.parse(data) : []
  } catch {
    return []
  }
}

function saveComments(comments: MarkerComment[]) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(comments))
}

export const useExportStore = create<ExportState>((set, get) => ({
  comments: loadComments(),
  isRecording: false,
  recordingStream: null,
  mediaRecorder: null,
  recordedChunks: [],

  // Comments
  addComment: (markerId, text, author = 'Anonymous') => {
    const comment: MarkerComment = {
      id: `comment-${Date.now()}`,
      markerId,
      text,
      author,
      timestamp: Date.now(),
    }
    const comments = [...get().comments, comment]
    set({ comments })
    saveComments(comments)
  },

  deleteComment: (commentId) => {
    const comments = get().comments.filter((c) => c.id !== commentId)
    set({ comments })
    saveComments(comments)
  },

  getMarkerComments: (markerId) => {
    return get().comments.filter((c) => c.markerId === markerId)
  },

  // Export
  exportProjectJson: () => {
    const config = useAdminStore.getState().config
    const tours = useTourStore.getState().tours
    const comments = get().comments

    const exportData: ProjectExport = {
      version: VERSION,
      exportedAt: new Date().toISOString(),
      config,
      tours,
      comments,
    }

    return JSON.stringify(exportData, null, 2)
  },

  exportMarkersCSV: () => {
    const { markers } = useAdminStore.getState().config

    // CSV headers
    const headers = [
      'id',
      'title',
      'description',
      'position_x',
      'position_y',
      'position_z',
      'videoUrl',
      'type',
      'groupId',
      'color',
      'size',
      'tourOrder',
    ]

    const rows = markers.map((marker) => [
      marker.id,
      `"${(marker.title || '').replace(/"/g, '""')}"`,
      `"${(marker.description || '').replace(/"/g, '""')}"`,
      marker.position[0],
      marker.position[1],
      marker.position[2],
      marker.videoUrl || '',
      marker.type || 'info',
      marker.groupId || '',
      marker.color || '',
      marker.size || '',
      marker.tourOrder ?? '',
    ])

    return [headers.join(','), ...rows.map((r) => r.join(','))].join('\n')
  },

  exportStandaloneHTML: () => {
    const config = useAdminStore.getState().config
    const tours = useTourStore.getState().tours

    // Create a minimal standalone HTML viewer
    const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>3D Building Viewer - Exported</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { font-family: system-ui, sans-serif; background: #1e293b; color: white; }
    .container { max-width: 1200px; margin: 0 auto; padding: 2rem; }
    h1 { margin-bottom: 1rem; }
    .info { background: #334155; padding: 1rem; border-radius: 0.5rem; margin-bottom: 2rem; }
    .markers { display: grid; grid-template-columns: repeat(auto-fill, minmax(300px, 1fr)); gap: 1rem; }
    .marker { background: #475569; padding: 1rem; border-radius: 0.5rem; }
    .marker h3 { color: #60a5fa; margin-bottom: 0.5rem; }
    .marker p { color: #94a3b8; font-size: 0.875rem; }
    .position { font-family: monospace; color: #4ade80; font-size: 0.75rem; margin-top: 0.5rem; }
    .video-link { color: #f472b6; text-decoration: none; font-size: 0.875rem; }
    .video-link:hover { text-decoration: underline; }
    .tours { margin-top: 2rem; }
    .tour { background: #334155; padding: 1rem; border-radius: 0.5rem; margin-bottom: 1rem; }
    .tour h3 { color: #34d399; }
    .stops { margin-top: 0.5rem; font-size: 0.875rem; color: #94a3b8; }
  </style>
</head>
<body>
  <div class="container">
    <h1>3D Building Viewer</h1>

    <div class="info">
      <p><strong>Model:</strong> ${config.modelUrl}</p>
      <p><strong>Scale:</strong> ${config.scale}</p>
      <p><strong>Total Markers:</strong> ${config.markers.length}</p>
      <p><strong>Exported:</strong> ${new Date().toLocaleString()}</p>
    </div>

    <h2>Markers</h2>
    <div class="markers">
      ${config.markers
        .map(
          (m) => `
        <div class="marker">
          <h3>${m.title || 'Untitled'}</h3>
          <p>${m.description || 'No description'}</p>
          <div class="position">Position: [${m.position.map((p) => p.toFixed(2)).join(', ')}]</div>
          ${m.videoUrl ? `<a href="${m.videoUrl}" class="video-link" target="_blank">View Video</a>` : ''}
        </div>
      `
        )
        .join('')}
    </div>

    ${
      tours.length > 0
        ? `
    <div class="tours">
      <h2>Tours</h2>
      ${tours
        .map(
          (t) => `
        <div class="tour">
          <h3>${t.name}</h3>
          <p>${t.description || ''}</p>
          <div class="stops">
            <strong>Stops:</strong> ${t.stops.length} markers
            ${t.loop ? ' | Loops' : ''}
          </div>
        </div>
      `
        )
        .join('')}
    </div>
    `
        : ''
    }

    <script>
      // Embedded config for potential future use
      window.BUILDING_VIEWER_CONFIG = ${JSON.stringify({ config, tours })};
    </script>
  </div>
</body>
</html>`

    return html
  },

  // Import
  importProjectJson: (json) => {
    try {
      const data: ProjectExport = JSON.parse(json)

      if (!data.config || !data.config.markers) {
        console.error('Invalid project format')
        return false
      }

      // Import config
      useAdminStore.getState().updateConfig(data.config)

      // Import tours if present
      if (data.tours && Array.isArray(data.tours)) {
        // Clear existing tours and add imported ones
        const tourStore = useTourStore.getState()
        data.tours.forEach((tour) => {
          tourStore.createTour(tour.name)
          // Update with full tour data
          const createdTour = tourStore.tours[tourStore.tours.length - 1]
          if (createdTour) {
            tourStore.updateTour(createdTour.id, {
              ...tour,
              id: createdTour.id, // Keep the new ID
            })
          }
        })
      }

      // Import comments if present
      if (data.comments && Array.isArray(data.comments)) {
        set({ comments: data.comments })
        saveComments(data.comments)
      }

      return true
    } catch (error) {
      console.error('Failed to import project:', error)
      return false
    }
  },

  importMarkersCSV: (csv) => {
    const errors: string[] = []
    let imported = 0

    try {
      const lines = csv.trim().split('\n')
      if (lines.length < 2) {
        return { success: false, imported: 0, errors: ['CSV must have headers and at least one data row'] }
      }

      const firstLine = lines[0]
      if (!firstLine) {
        return { success: false, imported: 0, errors: ['CSV is empty'] }
      }
      const headers = firstLine.split(',').map((h) => h.trim().toLowerCase())
      const requiredHeaders = ['title', 'position_x', 'position_y', 'position_z']

      for (const required of requiredHeaders) {
        if (!headers.includes(required)) {
          errors.push(`Missing required header: ${required}`)
        }
      }

      if (errors.length > 0) {
        return { success: false, imported: 0, errors }
      }

      const titleIdx = headers.indexOf('title')
      const descIdx = headers.indexOf('description')
      const posXIdx = headers.indexOf('position_x')
      const posYIdx = headers.indexOf('position_y')
      const posZIdx = headers.indexOf('position_z')
      const videoIdx = headers.indexOf('videourl')
      const typeIdx = headers.indexOf('type')
      const groupIdx = headers.indexOf('groupid')

      const adminStore = useAdminStore.getState()

      for (let i = 1; i < lines.length; i++) {
        try {
          // Handle quoted CSV values
          const values: string[] = []
          let current = ''
          let inQuotes = false

          const line = lines[i]
          if (!line) continue

          for (const char of line) {
            if (char === '"') {
              inQuotes = !inQuotes
            } else if (char === ',' && !inQuotes) {
              values.push(current.trim())
              current = ''
            } else {
              current += char
            }
          }
          values.push(current.trim())

          const posX = values[posXIdx]
          const posY = values[posYIdx]
          const posZ = values[posZIdx]

          const position: [number, number, number] = [
            parseFloat(posX ?? '0') || 0,
            parseFloat(posY ?? '0') || 0,
            parseFloat(posZ ?? '0') || 0,
          ]

          const title = values[titleIdx] || `Marker ${i}`
          const typeValue = typeIdx >= 0 ? values[typeIdx] : undefined
          const validTypes = ['info', 'hotspot', 'link', 'gallery'] as const
          const markerType = typeValue && validTypes.includes(typeValue as typeof validTypes[number])
            ? (typeValue as typeof validTypes[number])
            : 'info'

          adminStore.addMarker({
            id: `imported-${Date.now()}-${i}`,
            title,
            description: descIdx >= 0 ? values[descIdx] : undefined,
            position,
            videoUrl: videoIdx >= 0 ? values[videoIdx] : undefined,
            type: markerType,
            groupId: groupIdx >= 0 ? values[groupIdx] : undefined,
          })
          imported++
        } catch (rowError) {
          errors.push(`Row ${i + 1}: Failed to parse`)
        }
      }

      return { success: imported > 0, imported, errors }
    } catch (error) {
      return { success: false, imported: 0, errors: ['Failed to parse CSV'] }
    }
  },

  // Share
  generateShareUrl: (options = {}) => {
    const config = useAdminStore.getState().config
    const tours = useTourStore.getState().tours

    const shareData = {
      config,
      tours,
    }

    // Compress and encode
    const encoded = btoa(encodeURIComponent(JSON.stringify(shareData)))

    const baseUrl = window.location.origin + window.location.pathname
    const params = new URLSearchParams()
    params.set('data', encoded)

    if (options.editMode) {
      params.set('edit', '1')
    }
    if (options.tourId) {
      params.set('tour', options.tourId)
    }

    return `${baseUrl}?${params.toString()}`
  },

  parseShareUrl: (url) => {
    try {
      const urlObj = new URL(url)
      const data = urlObj.searchParams.get('data')
      const editMode = urlObj.searchParams.get('edit') === '1'
      const tourId = urlObj.searchParams.get('tour')

      if (!data) {
        return tourId ? { editMode, tourId } : null
      }

      const decoded = JSON.parse(decodeURIComponent(atob(data)))

      return {
        config: decoded,
        editMode,
        tourId: tourId || undefined,
      }
    } catch {
      return null
    }
  },

  // Recording
  startRecording: async (canvas) => {
    try {
      const stream = canvas.captureStream(30)
      const mediaRecorder = new MediaRecorder(stream, {
        mimeType: 'video/webm;codecs=vp9',
      })

      const chunks: Blob[] = []

      mediaRecorder.ondataavailable = (e) => {
        if (e.data.size > 0) {
          chunks.push(e.data)
        }
      }

      set({
        isRecording: true,
        recordingStream: stream,
        mediaRecorder,
        recordedChunks: chunks,
      })

      mediaRecorder.start(100) // Collect data every 100ms
    } catch (error) {
      console.error('Failed to start recording:', error)
      throw error
    }
  },

  stopRecording: async () => {
    const { mediaRecorder, recordedChunks } = get()

    if (!mediaRecorder) return null

    return new Promise<Blob | null>((resolve) => {
      mediaRecorder.onstop = () => {
        const blob = new Blob(recordedChunks, { type: 'video/webm' })
        set({
          isRecording: false,
          recordingStream: null,
          mediaRecorder: null,
          recordedChunks: [],
        })
        resolve(blob)
      }

      mediaRecorder.stop()
    })
  },

  setRecordingState: (isRecording) => set({ isRecording }),
}))
