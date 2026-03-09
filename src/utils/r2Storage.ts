// R2 Storage utility for uploading/downloading files

export interface UploadResult {
  success: boolean
  publicUrl?: string
  objectKey?: string
  error?: string
}

export interface UploadProgress {
  loaded: number
  total: number
  percentage: number
}

// Check if we're in development mode without Wrangler
function isDevelopmentWithoutWrangler(): boolean {
  // Check if we're on localhost without the Wrangler dev server
  return window.location.hostname === 'localhost' &&
         !window.location.port.startsWith('8') // Wrangler typically uses port 8788
}

// Get content type for a file, with fallbacks for types browsers don't recognize
function getContentType(file: File): string {
  // If browser provides a type, use it
  if (file.type) return file.type

  // Fallback based on file extension
  const ext = file.name.toLowerCase().split('.').pop()
  const mimeTypes: Record<string, string> = {
    'glb': 'model/gltf-binary',
    'gltf': 'model/gltf+json',
    'mp4': 'video/mp4',
    'webm': 'video/webm',
    'mov': 'video/quicktime',
    'jpg': 'image/jpeg',
    'jpeg': 'image/jpeg',
    'png': 'image/png',
    'gif': 'image/gif',
    'webp': 'image/webp',
  }

  return mimeTypes[ext || ''] || 'application/octet-stream'
}

// Get presigned URL from our Worker
async function getPresignedUrl(
  filename: string,
  contentType: string,
  operation: 'PUT' | 'GET' = 'PUT'
): Promise<{ uploadUrl: string; publicUrl: string; objectKey: string }> {
  const response = await fetch('/api/upload-url', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ filename, contentType, operation }),
  })

  if (!response.ok) {
    if (response.status === 404 && isDevelopmentWithoutWrangler()) {
      throw new Error(
        'Upload API not available in development mode. Either:\n' +
        '1. Use a video URL instead (e.g., /videos/example.mp4)\n' +
        '2. Run "npm run pages:dev" after building to test uploads\n' +
        '3. Deploy to Cloudflare Pages for full functionality'
      )
    }
    throw new Error(`Failed to get presigned URL: ${response.status}`)
  }

  return response.json()
}

// Upload file to R2
export async function uploadToR2(
  file: File,
  onProgress?: (progress: UploadProgress) => void
): Promise<UploadResult> {
  try {
    // Get content type with fallback for unrecognized types
    const contentType = getContentType(file)

    // Get presigned URL
    const { uploadUrl, publicUrl, objectKey } = await getPresignedUrl(file.name, contentType)

    // Upload with progress tracking
    return new Promise((resolve, reject) => {
      const xhr = new XMLHttpRequest()

      xhr.upload.addEventListener('progress', (e) => {
        if (e.lengthComputable && onProgress) {
          onProgress({
            loaded: e.loaded,
            total: e.total,
            percentage: Math.round((e.loaded / e.total) * 100),
          })
        }
      })

      xhr.addEventListener('load', () => {
        if (xhr.status >= 200 && xhr.status < 300) {
          resolve({ success: true, publicUrl, objectKey })
        } else {
          reject(new Error(`Upload failed: ${xhr.status}`))
        }
      })

      xhr.addEventListener('error', () => reject(new Error('Upload failed')))

      xhr.open('PUT', uploadUrl)
      xhr.setRequestHeader('Content-Type', contentType)
      xhr.send(file)
    })
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Upload failed',
    }
  }
}

// Delete file from R2
export async function deleteFromR2(objectKey: string): Promise<boolean> {
  try {
    const response = await fetch('/api/delete-url', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ objectKey }),
    })

    const { deleteUrl } = await response.json()

    const deleteResponse = await fetch(deleteUrl, { method: 'DELETE' })
    return deleteResponse.ok
  } catch {
    return false
  }
}

// Helper to check if file type is valid
export function isValidModelFile(file: File): boolean {
  const validTypes = ['.glb', '.gltf']
  return validTypes.some((ext) => file.name.toLowerCase().endsWith(ext))
}

export function isValidVideoFile(file: File): boolean {
  const validTypes = ['video/mp4', 'video/webm', 'video/quicktime']
  return validTypes.includes(file.type)
}

// Generate thumbnail from video file
export function generateVideoThumbnail(
  videoUrl: string,
  seekTime: number = 1
): Promise<string> {
  return new Promise((resolve, reject) => {
    const video = document.createElement('video')
    video.crossOrigin = 'anonymous'
    video.src = videoUrl
    video.muted = true

    video.addEventListener('loadedmetadata', () => {
      // Seek to specified time or 10% of duration
      video.currentTime = Math.min(seekTime, video.duration * 0.1)
    })

    video.addEventListener('seeked', () => {
      const canvas = document.createElement('canvas')
      canvas.width = 320
      canvas.height = 180

      const ctx = canvas.getContext('2d')
      if (ctx) {
        ctx.drawImage(video, 0, 0, canvas.width, canvas.height)
        const thumbnail = canvas.toDataURL('image/jpeg', 0.7)
        resolve(thumbnail)
      } else {
        reject(new Error('Failed to get canvas context'))
      }

      // Clean up
      video.remove()
    })

    video.addEventListener('error', () => {
      reject(new Error('Failed to load video'))
      video.remove()
    })

    // Start loading
    video.load()
  })
}

// Format file size for display
export function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 B'
  const k = 1024
  const sizes = ['B', 'KB', 'MB', 'GB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
}

// Asset type for tracking uploaded files
export interface UploadedAsset {
  id: string
  name: string
  type: 'model' | 'video'
  objectKey: string
  publicUrl: string
  size: number
  uploadedAt: number
  thumbnail?: string
}

// Local storage key for tracking assets
const ASSETS_KEY = 'building-viewer-assets'

export function saveAsset(asset: UploadedAsset): void {
  const assets = getAssets()
  // Avoid duplicates
  const filtered = assets.filter((a) => a.objectKey !== asset.objectKey)
  filtered.push(asset)
  localStorage.setItem(ASSETS_KEY, JSON.stringify(filtered))
}

export function getAssets(): UploadedAsset[] {
  const data = localStorage.getItem(ASSETS_KEY)
  return data ? JSON.parse(data) : []
}

export function removeAsset(objectKey: string): void {
  const assets = getAssets().filter((a) => a.objectKey !== objectKey)
  localStorage.setItem(ASSETS_KEY, JSON.stringify(assets))
}

export function getVideoAssets(): UploadedAsset[] {
  return getAssets().filter((a) => a.type === 'video')
}

export function getModelAssets(): UploadedAsset[] {
  return getAssets().filter((a) => a.type === 'model')
}
