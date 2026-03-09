import { useState, useEffect } from 'react'
import { createPortal } from 'react-dom'
import { motion, AnimatePresence } from 'framer-motion'
import {
  MarkerConfig,
  MarkerType,
  MarkerSize,
  MarkerAnimation,
  MarkerGroup,
  MarkerIcon,
} from '../../utils/configStorage'
import { useR2Upload } from '../../hooks/useR2Upload'
import {
  isValidVideoFile,
  saveAsset,
  getVideoAssets,
  UploadedAsset,
} from '../../utils/r2Storage'
import { useMarkerStore } from '../../store/useMarkerStore'

interface MarkerEditPopupProps {
  marker: MarkerConfig
  position: [number, number, number]
  onSave: (marker: MarkerConfig) => void
  onDelete?: () => void
  onCancel: () => void
  isNew?: boolean
}

// Separate modal component that renders outside the 3D canvas
function MarkerEditModal({
  marker,
  onSave,
  onDelete,
  onCancel,
  isNew = false,
}: Omit<MarkerEditPopupProps, 'position'>) {
  const [title, setTitle] = useState(marker.title)
  const [description, setDescription] = useState(marker.description || '')
  const [type, setType] = useState<MarkerType>(marker.type || 'info')
  const [videoUrl, setVideoUrl] = useState(marker.videoUrl || '')
  const [videoKey, setVideoKey] = useState(marker.videoKey)
  const [linkUrl, setLinkUrl] = useState(marker.linkUrl || '')
  const [galleryImages, setGalleryImages] = useState<string[]>(marker.galleryImages || [])
  const [color, setColor] = useState(marker.color || '#ff4444')
  const [size, setSize] = useState<MarkerSize>(marker.size || 'medium')
  const [animation, setAnimation] = useState<MarkerAnimation>(marker.animation || 'pulse')
  const [animationSpeed, setAnimationSpeed] = useState(marker.animationSpeed || 1)
  const [glowIntensity, setGlowIntensity] = useState(marker.glowIntensity || 0.5)
  const [animateOnHover, setAnimateOnHover] = useState(marker.animateOnHover || false)
  const [groupId, setGroupId] = useState<string | undefined>(marker.groupId)
  const [tourOrder, setTourOrder] = useState<number | undefined>(marker.tourOrder)
  const [icon, setIcon] = useState<MarkerIcon>(marker.icon || 'none')
  const [showLibrary, setShowLibrary] = useState(false)
  const [isDragging, setIsDragging] = useState(false)
  const [activeTab, setActiveTab] = useState<'basic' | 'style' | 'advanced'>('basic')

  const { upload, isUploading, progress, error: uploadError } = useR2Upload()
  const videoAssets = getVideoAssets()
  const groups = useMarkerStore((state) => state.getGroups)()

  // Sync state when marker changes
  useEffect(() => {
    setTitle(marker.title)
    setDescription(marker.description || '')
    setType(marker.type || 'info')
    setVideoUrl(marker.videoUrl || '')
    setVideoKey(marker.videoKey)
    setLinkUrl(marker.linkUrl || '')
    setGalleryImages(marker.galleryImages || [])
    setColor(marker.color || '#ff4444')
    setSize(marker.size || 'medium')
    setAnimation(marker.animation || 'pulse')
    setAnimationSpeed(marker.animationSpeed || 1)
    setGlowIntensity(marker.glowIntensity || 0.5)
    setAnimateOnHover(marker.animateOnHover || false)
    setGroupId(marker.groupId)
    setTourOrder(marker.tourOrder)
    setIcon(marker.icon || 'none')
  }, [marker])

  const handleVideoUpload = async (file: File) => {
    if (!isValidVideoFile(file)) {
      alert('Please select a valid video file (mp4, webm, mov)')
      return
    }

    const result = await upload(file)
    if (result.success && result.publicUrl && result.objectKey) {
      setVideoUrl(result.publicUrl)
      setVideoKey(result.objectKey)

      saveAsset({
        id: result.objectKey,
        name: file.name,
        type: 'video',
        objectKey: result.objectKey,
        publicUrl: result.publicUrl,
        size: file.size,
        uploadedAt: Date.now(),
      })
    }
  }

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      await handleVideoUpload(file)
    }
    e.target.value = ''
  }

  const handleDrop = async (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setIsDragging(false)

    const file = e.dataTransfer.files[0]
    if (file) {
      await handleVideoUpload(file)
    }
  }

  const handleSelectFromLibrary = (asset: UploadedAsset) => {
    setVideoUrl(asset.publicUrl)
    setVideoKey(asset.objectKey)
    setShowLibrary(false)
  }

  const handleAddGalleryImage = () => {
    const url = prompt('Enter image URL:')
    if (url) {
      setGalleryImages([...galleryImages, url])
    }
  }

  const handleRemoveGalleryImage = (index: number) => {
    setGalleryImages(galleryImages.filter((_, i) => i !== index))
  }

  const handleSave = () => {
    if (!title.trim()) {
      alert('Title is required')
      return
    }

    onSave({
      ...marker,
      title: title.trim(),
      description: description.trim() || undefined,
      type,
      videoUrl: type === 'info' ? (videoUrl.trim() || undefined) : undefined,
      videoKey: type === 'info' ? videoKey : undefined,
      linkUrl: type === 'link' ? (linkUrl.trim() || undefined) : undefined,
      galleryImages: type === 'gallery' ? galleryImages : undefined,
      color,
      size,
      icon,
      animation,
      animationSpeed,
      glowIntensity,
      animateOnHover,
      groupId,
      tourOrder,
    })
  }

  return (
    <AnimatePresence>
      {/* Backdrop */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-2 backdrop-blur-sm sm:p-4"
        onClick={onCancel}
      >
        {/* Modal */}
        <motion.div
          initial={{ opacity: 0, scale: 0.9, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.9, y: 20 }}
          className="max-h-[95vh] w-full max-w-sm overflow-hidden rounded-xl bg-slate-900 shadow-2xl sm:max-w-md"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="flex items-center justify-between border-b border-slate-700 px-4 py-3 sm:px-6 sm:py-4">
            <h3 className="text-base font-semibold text-white sm:text-lg">
              {isNew ? 'New Marker' : 'Edit Marker'}
            </h3>
            <button
              onClick={onCancel}
              className="rounded-lg p-1 text-slate-400 hover:bg-slate-800 hover:text-white"
            >
              <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          {/* Tabs */}
          <div className="flex gap-1 border-b border-slate-700 px-2 py-2 sm:px-4">
            {(['basic', 'style', 'advanced'] as const).map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`flex-1 rounded-lg px-3 py-2 text-xs font-medium capitalize transition-colors sm:text-sm ${
                  activeTab === tab
                    ? 'bg-blue-600 text-white'
                    : 'text-slate-400 hover:bg-slate-800 hover:text-white'
                }`}
              >
                {tab}
              </button>
            ))}
          </div>

          {/* Tab Content - Scrollable */}
          <div className="max-h-[50vh] overflow-y-auto p-4 sm:max-h-[60vh] sm:p-6">
            <div className="space-y-4">
              {activeTab === 'basic' && (
                <>
                  {/* Marker Type */}
                  <div>
                    <label className="mb-2 block text-xs font-medium text-slate-400 sm:text-sm">Type</label>
                    <div className="grid grid-cols-4 gap-2">
                      {MARKER_TYPES.map((t) => (
                        <button
                          key={t.value}
                          onClick={() => setType(t.value)}
                          className={`flex flex-col items-center gap-1 rounded-lg p-2 transition-colors sm:p-3 ${
                            type === t.value
                              ? 'bg-blue-600 text-white'
                              : 'bg-slate-800 text-slate-400 hover:bg-slate-700 hover:text-white'
                          }`}
                        >
                          <svg className="h-4 w-4 sm:h-5 sm:w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={t.icon} />
                          </svg>
                          <span className="text-[10px] sm:text-xs">{t.label}</span>
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Title */}
                  <div>
                    <label className="mb-1 block text-xs font-medium text-slate-400 sm:text-sm">Title *</label>
                    <input
                      type="text"
                      value={title}
                      onChange={(e) => setTitle(e.target.value)}
                      placeholder="Enter marker title"
                      className="w-full rounded-lg bg-slate-800 px-3 py-2 text-sm text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500 sm:text-base"
                    />
                  </div>

                  {/* Description */}
                  <div>
                    <label className="mb-1 block text-xs font-medium text-slate-400 sm:text-sm">Description</label>
                    <textarea
                      value={description}
                      onChange={(e) => setDescription(e.target.value)}
                      placeholder="Enter description"
                      rows={2}
                      className="w-full resize-none rounded-lg bg-slate-800 px-3 py-2 text-sm text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500 sm:text-base"
                    />
                  </div>

                  {/* Type-specific content */}
                  {type === 'info' && (
                    <div>
                      <div className="mb-1 flex items-center justify-between">
                        <label className="text-xs font-medium text-slate-400 sm:text-sm">Video</label>
                        {videoAssets.length > 0 && (
                          <button
                            type="button"
                            onClick={() => setShowLibrary(!showLibrary)}
                            className="text-xs text-blue-400 hover:text-blue-300"
                          >
                            {showLibrary ? 'Hide library' : 'From library'}
                          </button>
                        )}
                      </div>

                      {showLibrary && videoAssets.length > 0 && (
                        <div className="mb-2 max-h-24 overflow-y-auto rounded-lg bg-slate-800 p-2">
                          {videoAssets.map((asset) => (
                            <button
                              key={asset.id}
                              onClick={() => handleSelectFromLibrary(asset)}
                              className="flex w-full items-center gap-2 rounded-lg p-2 text-left text-xs text-slate-300 hover:bg-slate-700 sm:text-sm"
                            >
                              <svg className="h-4 w-4 shrink-0 text-slate-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
                              </svg>
                              <span className="truncate">{asset.name}</span>
                            </button>
                          ))}
                        </div>
                      )}

                      <input
                        type="text"
                        value={videoUrl}
                        onChange={(e) => setVideoUrl(e.target.value)}
                        placeholder="/videos/example.mp4 or https://..."
                        className="w-full rounded-lg bg-slate-800 px-3 py-2 text-sm text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />

                      <div
                        className={`mt-2 rounded-lg border-2 border-dashed p-3 text-center transition-colors sm:p-4 ${
                          isDragging
                            ? 'border-blue-400 bg-blue-500/10'
                            : 'border-slate-700 hover:border-slate-600'
                        } ${isUploading ? 'pointer-events-none opacity-50' : 'cursor-pointer'}`}
                        onDragOver={(e) => { e.preventDefault(); setIsDragging(true) }}
                        onDragLeave={() => setIsDragging(false)}
                        onDrop={handleDrop}
                        onClick={() => !isUploading && document.getElementById('marker-video-input')?.click()}
                      >
                        <input
                          id="marker-video-input"
                          type="file"
                          accept="video/mp4,video/webm,video/quicktime"
                          onChange={handleFileChange}
                          className="hidden"
                          disabled={isUploading}
                        />
                        {isUploading ? (
                          <div className="space-y-2">
                            <p className="text-xs text-blue-400 sm:text-sm">Uploading {progress?.percentage || 0}%</p>
                            <div className="mx-auto h-1.5 w-32 overflow-hidden rounded-full bg-slate-700">
                              <div
                                className="h-full bg-blue-500 transition-all"
                                style={{ width: `${progress?.percentage || 0}%` }}
                              />
                            </div>
                          </div>
                        ) : (
                          <p className="text-xs text-slate-500 sm:text-sm">
                            {isDragging ? 'Drop video here' : 'Drop or click to upload video'}
                          </p>
                        )}
                      </div>
                      {uploadError && (
                        <p className="mt-2 whitespace-pre-wrap rounded-lg bg-red-500/10 p-2 text-xs text-red-400">{uploadError}</p>
                      )}
                    </div>
                  )}

                  {type === 'link' && (
                    <div>
                      <label className="mb-1 block text-xs font-medium text-slate-400 sm:text-sm">Link URL</label>
                      <input
                        type="url"
                        value={linkUrl}
                        onChange={(e) => setLinkUrl(e.target.value)}
                        placeholder="https://example.com"
                        className="w-full rounded-lg bg-slate-800 px-3 py-2 text-sm text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                  )}

                  {type === 'gallery' && (
                    <div>
                      <div className="mb-1 flex items-center justify-between">
                        <label className="text-xs font-medium text-slate-400 sm:text-sm">Gallery Images</label>
                        <button
                          type="button"
                          onClick={handleAddGalleryImage}
                          className="text-xs text-blue-400 hover:text-blue-300"
                        >
                          + Add image
                        </button>
                      </div>
                      <div className="space-y-2">
                        {galleryImages.map((img, index) => (
                          <div key={index} className="flex items-center gap-2">
                            <input
                              type="text"
                              value={img}
                              onChange={(e) => {
                                const newImages = [...galleryImages]
                                newImages[index] = e.target.value
                                setGalleryImages(newImages)
                              }}
                              className="flex-1 rounded-lg bg-slate-800 px-3 py-2 text-sm text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                            />
                            <button
                              onClick={() => handleRemoveGalleryImage(index)}
                              className="shrink-0 rounded-lg p-2 text-red-400 hover:bg-red-500/20"
                            >
                              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                              </svg>
                            </button>
                          </div>
                        ))}
                        {galleryImages.length === 0 && (
                          <p className="text-xs text-slate-500">No images added</p>
                        )}
                      </div>
                    </div>
                  )}
                </>
              )}

              {activeTab === 'style' && (
                <>
                  {/* Icon Selection */}
                  <div>
                    <label className="mb-2 block text-xs font-medium text-slate-400 sm:text-sm">Marker Icon</label>
                    <div className="grid grid-cols-5 gap-2">
                      {MARKER_ICONS.map((iconOption) => (
                        <button
                          key={iconOption.value}
                          onClick={() => setIcon(iconOption.value)}
                          title={iconOption.label}
                          className={`flex flex-col items-center justify-center gap-1 rounded-lg p-2 transition-colors ${
                            icon === iconOption.value
                              ? 'bg-amber-600 text-white'
                              : 'bg-slate-800 text-slate-400 hover:bg-slate-700 hover:text-amber-400'
                          }`}
                        >
                          <svg className="h-5 w-5" viewBox="0 0 16 16" fill="currentColor">
                            <path d={iconOption.path} />
                          </svg>
                          <span className="text-[8px] leading-none">{iconOption.label}</span>
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Size */}
                  <div>
                    <label className="mb-2 block text-xs font-medium text-slate-400 sm:text-sm">Size</label>
                    <div className="flex gap-2">
                      {MARKER_SIZES.map((s) => (
                        <button
                          key={s.value}
                          onClick={() => setSize(s.value)}
                          className={`flex-1 rounded-lg py-2 text-sm font-medium transition-colors sm:py-2.5 ${
                            size === s.value
                              ? 'bg-blue-600 text-white'
                              : 'bg-slate-800 text-slate-400 hover:bg-slate-700 hover:text-white'
                          }`}
                        >
                          {s.label}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Color Picker */}
                  <div>
                    <label className="mb-2 block text-xs font-medium text-slate-400 sm:text-sm">Color</label>
                    <div className="flex flex-wrap gap-2">
                      {MARKER_COLORS.map((c) => (
                        <button
                          key={c}
                          onClick={() => setColor(c)}
                          className={`h-8 w-8 rounded-full transition-transform sm:h-9 sm:w-9 ${
                            color === c ? 'scale-110 ring-2 ring-white ring-offset-2 ring-offset-slate-900' : 'hover:scale-105'
                          }`}
                          style={{ backgroundColor: c }}
                        />
                      ))}
                    </div>
                  </div>

                  {/* Animation */}
                  <div>
                    <label className="mb-2 block text-xs font-medium text-slate-400 sm:text-sm">Animation</label>
                    <div className="grid grid-cols-5 gap-1 sm:gap-2">
                      {MARKER_ANIMATIONS.map((a) => (
                        <button
                          key={a.value}
                          onClick={() => setAnimation(a.value)}
                          className={`rounded-lg px-2 py-2 text-[10px] font-medium transition-colors sm:text-xs ${
                            animation === a.value
                              ? 'bg-blue-600 text-white'
                              : 'bg-slate-800 text-slate-400 hover:bg-slate-700 hover:text-white'
                          }`}
                        >
                          {a.label}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Animation Speed */}
                  {animation !== 'none' && (
                    <div>
                      <label className="mb-1 block text-xs font-medium text-slate-400 sm:text-sm">
                        Animation Speed: {animationSpeed.toFixed(1)}x
                      </label>
                      <input
                        type="range"
                        min="0.5"
                        max="2"
                        step="0.1"
                        value={animationSpeed}
                        onChange={(e) => setAnimationSpeed(parseFloat(e.target.value))}
                        className="w-full accent-blue-500"
                      />
                    </div>
                  )}

                  {/* Glow Intensity */}
                  <div>
                    <label className="mb-1 block text-xs font-medium text-slate-400 sm:text-sm">
                      Glow Intensity: {Math.round(glowIntensity * 100)}%
                    </label>
                    <input
                      type="range"
                      min="0"
                      max="1"
                      step="0.1"
                      value={glowIntensity}
                      onChange={(e) => setGlowIntensity(parseFloat(e.target.value))}
                      className="w-full accent-blue-500"
                    />
                  </div>

                  {/* Animate on Hover */}
                  {animation !== 'none' && (
                    <label className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        checked={animateOnHover}
                        onChange={(e) => setAnimateOnHover(e.target.checked)}
                        className="rounded border-slate-600 bg-slate-800 text-blue-500 focus:ring-blue-500"
                      />
                      <span className="text-xs text-slate-400 sm:text-sm">Animate only on hover</span>
                    </label>
                  )}
                </>
              )}

              {activeTab === 'advanced' && (
                <>
                  {/* Group */}
                  <div>
                    <label className="mb-1 block text-xs font-medium text-slate-400 sm:text-sm">Group</label>
                    <select
                      value={groupId || ''}
                      onChange={(e) => setGroupId(e.target.value || undefined)}
                      className="w-full rounded-lg bg-slate-800 px-3 py-2 text-sm text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="">No group</option>
                      {groups.map((group: MarkerGroup) => (
                        <option key={group.id} value={group.id}>
                          {group.name}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Tour Order */}
                  <div>
                    <label className="mb-1 block text-xs font-medium text-slate-400 sm:text-sm">Tour Order</label>
                    <input
                      type="number"
                      value={tourOrder ?? ''}
                      onChange={(e) => setTourOrder(e.target.value ? parseInt(e.target.value) : undefined)}
                      placeholder="Leave empty to exclude from tour"
                      min="1"
                      className="w-full rounded-lg bg-slate-800 px-3 py-2 text-sm text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                    <p className="mt-1 text-xs text-slate-500">
                      Set a number to include in guided tour
                    </p>
                  </div>

                  {/* Position (read-only) */}
                  <div>
                    <label className="mb-1 block text-xs font-medium text-slate-400 sm:text-sm">Position</label>
                    <div className="grid grid-cols-3 gap-2">
                      <div className="rounded-lg bg-slate-800 px-2 py-2 text-center text-xs text-slate-400 sm:text-sm">
                        X: {marker.position[0].toFixed(2)}
                      </div>
                      <div className="rounded-lg bg-slate-800 px-2 py-2 text-center text-xs text-slate-400 sm:text-sm">
                        Y: {marker.position[1].toFixed(2)}
                      </div>
                      <div className="rounded-lg bg-slate-800 px-2 py-2 text-center text-xs text-slate-400 sm:text-sm">
                        Z: {marker.position[2].toFixed(2)}
                      </div>
                    </div>
                  </div>
                </>
              )}
            </div>
          </div>

          {/* Actions */}
          <div className="flex gap-2 border-t border-slate-700 px-4 py-3 sm:gap-3 sm:px-6 sm:py-4">
            {onDelete && !isNew && (
              <button
                onClick={onDelete}
                className="rounded-lg bg-red-600/20 px-3 py-2 text-sm font-medium text-red-400 transition-colors hover:bg-red-600/30"
              >
                Delete
              </button>
            )}
            <div className="flex-1" />
            <button
              onClick={onCancel}
              className="rounded-lg bg-slate-700 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-slate-600"
            >
              Cancel
            </button>
            <button
              onClick={handleSave}
              disabled={isUploading}
              className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-blue-500 disabled:opacity-50"
            >
              {isNew ? 'Create' : 'Save'}
            </button>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  )
}

const MARKER_COLORS = [
  '#ff4444',
  '#ff8844',
  '#ffcc00',
  '#44ff44',
  '#44ffff',
  '#4488ff',
  '#8844ff',
  '#ff44ff',
]

const MARKER_TYPES: { value: MarkerType; label: string; icon: string }[] = [
  { value: 'info', label: 'Video', icon: 'M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z' },
  { value: 'hotspot', label: 'Info', icon: 'M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z' },
  { value: 'link', label: 'Link', icon: 'M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14' },
  { value: 'gallery', label: 'Gallery', icon: 'M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z' },
]

const MARKER_SIZES: { value: MarkerSize; label: string }[] = [
  { value: 'small', label: 'S' },
  { value: 'medium', label: 'M' },
  { value: 'large', label: 'L' },
]

const MARKER_ANIMATIONS: { value: MarkerAnimation; label: string }[] = [
  { value: 'pulse', label: 'Pulse' },
  { value: 'bounce', label: 'Bounce' },
  { value: 'rotate', label: 'Rotate' },
  { value: 'glow', label: 'Glow' },
  { value: 'none', label: 'None' },
]

const MARKER_ICONS: { value: MarkerIcon; label: string; path: string }[] = [
  { value: 'none', label: 'None', path: '' },
  { value: 'skull', label: 'Skull', path: 'M8 2C5 2 3 4.5 3 7c0 1.5.5 2.8 1.3 3.7-.2.5-.3 1.2-.3 2.3 0 1.5.8 2 2 2v1h1v-1h2v1h1v-1c1.2 0 2-.5 2-2 0-1.1-.1-1.8-.3-2.3.8-.9 1.3-2.2 1.3-3.7 0-2.5-2-5-5-5zm-2 6a1 1 0 110-2 1 1 0 010 2zm4 0a1 1 0 110-2 1 1 0 010 2zm-2 3.5l-1-1h2l-1 1z' },
  { value: 'fire', label: 'Fire', path: 'M8 1c0 2-1.5 3-2 5-.3 1.3.5 3 2 4 .5-1 .3-2 1-3 .5 1.5 2 2.5 2 4.5 0 2-1.5 3.5-3.5 3.5S4 13.5 4 11.5c0-2.5 1.5-4 2-5.5.3-1-1-2.5-1-4C6.5 3.5 8 3 8 1z' },
  { value: 'scroll', label: 'Scroll', path: 'M4 3c-.5 0-1 .5-1 1v8c0 .5.5 1 1 1h1v1c0 .5.5 1 1 1h6c.5 0 1-.5 1-1V5c0-.5-.5-1-1-1h-1V3c0-.5-.5-1-1-1H4zm1 2h6v8H5V5zm1 1v1h4V6H6zm0 2v1h4V8H6zm0 2v1h3v-1H6z' },
  { value: 'candle', label: 'Candle', path: 'M7 3c0-1 1-2 1-2s1 1 1 2c0 .5-.2 1-.5 1.3.3.2.5.4.5.7v1h-2V5c0-.3.2-.5.5-.7-.3-.3-.5-.8-.5-1.3zM6 6h4v1H6V6zm.5 2h3l.5 6H6l.5-6z' },
  { value: 'lotus', label: 'Lotus', path: 'M8 2c-.5 1.5-2 3-2 4.5 0 .8.3 1.5 1 2-.7.5-1 1.2-1 2 0 1.5 1.5 2.5 2 3.5.5-1 2-2 2-3.5 0-.8-.3-1.5-1-2 .7-.5 1-1.2 1-2 0-1.5-1.5-3-2-4.5zM5 6c-1 .5-2 1.5-2 3s1 2.5 2 3c-.5-1-.5-2 0-3s.5-2 0-3zm6 0c1 .5 2 1.5 2 3s-1 2.5-2 3c.5-1 .5-2 0-3s-.5-2 0-3z' },
  { value: 'om', label: 'Om', path: 'M4 8c0-1.5 1-3 2.5-3 1 0 1.5.5 2 1-.5.5-1 1-1 2s.5 1.5 1 2c-1 1.5-3 1.5-4 0-.3-.5-.5-1.2-.5-2zm6-3c1 0 2 1 2 2s-.5 1.5-1 2h1.5c.5 0 1 .5 1 1s-.5 1-1 1H10c-.5 1-1.5 2-3 2v-1c1 0 2-.5 2.5-1.5-.5-.3-1-.8-1-1.5 0-1 .5-2 1.5-3zm1-2c.5 0 1 .5 1 1s-.5 1-1 1-1-.5-1-1 .5-1 1-1z' },
  { value: 'eye', label: 'Eye', path: 'M8 4C4.5 4 2 8 2 8s2.5 4 6 4 6-4 6-4-2.5-4-6-4zm0 6.5c-1.4 0-2.5-1.1-2.5-2.5S6.6 5.5 8 5.5s2.5 1.1 2.5 2.5-1.1 2.5-2.5 2.5zm0-4c-.8 0-1.5.7-1.5 1.5s.7 1.5 1.5 1.5 1.5-.7 1.5-1.5-.7-1.5-1.5-1.5z' },
  { value: 'moon', label: 'Moon', path: 'M8 2c-3.3 0-6 2.7-6 6s2.7 6 6 6c.8 0 1.5-.2 2.2-.4-1.3-1-2.2-2.6-2.2-4.6s.9-3.6 2.2-4.6c-.7-.3-1.4-.4-2.2-.4z' },
  { value: 'star', label: 'Star', path: 'M8 1l2 5h5l-4 3.5 1.5 5.5L8 12l-4.5 3 1.5-5.5L1 6h5l2-5z' },
  { value: 'crystal', label: 'Crystal', path: 'M8 1L4 6l4 9 4-9-4-5zm0 2.5L10 6H6l2-2.5zM5.5 7h5L8 12.5 5.5 7z' },
  { value: 'potion', label: 'Potion', path: 'M6 2v2H5v1h1v1.5L4 11c-.3.5-.3 1 0 1.5.3.4.7.5 1 .5h6c.3 0 .7-.1 1-.5.3-.5.3-1 0-1.5L10 6.5V5h1V4h-1V2H6zm1 1h2v2.5l2 4H5l2-4V3z' },
  { value: 'book', label: 'Book', path: 'M3 3v10c0 .5.5 1 1 1h8c.5 0 1-.5 1-1V3c0-.5-.5-1-1-1H4c-.5 0-1 .5-1 1zm2 1h6v1H5V4zm0 2h6v1H5V6zm0 2h4v1H5V8z' },
  { value: 'key', label: 'Key', path: 'M10.5 2c-1.4 0-2.5 1.1-2.5 2.5 0 .5.1.9.3 1.3L3 11v2h2v-1h1v-1h1l1-1 .7.2c.4.2.8.3 1.3.3 1.4 0 2.5-1.1 2.5-2.5S11.9 5.5 10.5 5.5zm.5 2c.3 0 .5.2.5.5s-.2.5-.5.5-.5-.2-.5-.5.2-.5.5-.5z' },
  { value: 'compass', label: 'Compass', path: 'M8 2C4.7 2 2 4.7 2 8s2.7 6 6 6 6-2.7 6-6-2.7-6-6-6zm0 1c2.8 0 5 2.2 5 5s-2.2 5-5 5-5-2.2-5-5 2.2-5 5-5zm0 1.5L6 8l2 3.5L10 8 8 4.5z' },
]

// Exported component that uses portal to render modal outside 3D canvas
export function MarkerEditPopup({
  marker,
  onSave,
  onDelete,
  onCancel,
  isNew = false,
}: MarkerEditPopupProps) {
  // Use createPortal to render the modal in the document body
  // This ensures it stays within viewport and is fully responsive
  return createPortal(
    <MarkerEditModal
      marker={marker}
      onSave={onSave}
      onDelete={onDelete}
      onCancel={onCancel}
      isNew={isNew}
    />,
    document.body
  )
}
