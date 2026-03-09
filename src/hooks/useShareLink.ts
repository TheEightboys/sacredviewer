import { useEffect, useState } from 'react'
import { useExportStore } from '../store/useExportStore'
import { useAdminStore } from '../store/useAdminStore'
import { useTourStore } from '../store/useTourStore'

interface ShareLinkResult {
  loaded: boolean
  editMode: boolean
  tourId: string | null
  isEmbedded: boolean
}

export function useShareLink(): ShareLinkResult {
  const [result, setResult] = useState<ShareLinkResult>({
    loaded: false,
    editMode: false,
    tourId: null,
    isEmbedded: false,
  })

  const { parseShareUrl, importProjectJson } = useExportStore()
  const setEditMode = useAdminStore((state) => state.setEditMode)
  const { setActiveTour, play } = useTourStore()

  useEffect(() => {
    const url = window.location.href
    const urlObj = new URL(url)

    // Check if we're in embed mode
    const isEmbedded = urlObj.searchParams.get('embed') === '1'

    // Check for direct tour parameter
    const tourId = urlObj.searchParams.get('tour')

    // Check for edit mode
    const editMode = urlObj.searchParams.get('edit') === '1'

    // Check for encoded data
    const data = urlObj.searchParams.get('data')

    if (data) {
      // Parse and import the shared data
      const parsed = parseShareUrl(url)
      if (parsed && parsed.config) {
        try {
          const success = importProjectJson(JSON.stringify(parsed.config))
          if (success) {
            console.log('Loaded project from share link')

            // Set edit mode if specified
            if (parsed.editMode) {
              setEditMode(true)
            }

            // Start tour if specified
            if (parsed.tourId) {
              setTimeout(() => {
                setActiveTour(parsed.tourId!)
                play()
              }, 500)
            }

            setResult({
              loaded: true,
              editMode: parsed.editMode || false,
              tourId: parsed.tourId || null,
              isEmbedded,
            })

            // Clean up URL
            const cleanUrl = window.location.origin + window.location.pathname
            window.history.replaceState({}, document.title, cleanUrl)
            return
          }
        } catch (error) {
          console.error('Failed to load share link:', error)
        }
      }
    }

    // Handle tour-only parameter (no embedded data)
    if (tourId && !data) {
      setTimeout(() => {
        setActiveTour(tourId)
        play()
      }, 500)
    }

    // Handle edit mode parameter (no embedded data)
    if (editMode && !data) {
      setEditMode(true)
    }

    setResult({
      loaded: true,
      editMode,
      tourId,
      isEmbedded,
    })
  }, [parseShareUrl, importProjectJson, setEditMode, setActiveTour, play])

  return result
}
