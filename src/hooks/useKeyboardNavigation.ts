import { useEffect } from 'react'
import { useStore } from '../store/useStore'
import { useAdminStore } from '../store/useAdminStore'
import { useViewerStore } from '../store/useViewerStore'

export function useKeyboardNavigation() {
  const selectNextMarker = useStore((state) => state.selectNextMarker)
  const selectPrevMarker = useStore((state) => state.selectPrevMarker)
  const setSelectedMarker = useStore((state) => state.setSelectedMarker)
  const toggleEditMode = useAdminStore((state) => state.toggleEditMode)

  const {
    setAutoRotate,
    autoRotate,
    wireframe,
    setWireframe,
    transparent,
    setTransparent,
    showShortcuts,
    setShowShortcuts,
    setCurrentView,
  } = useViewerStore()

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Ignore if user is typing in an input
      if (
        e.target instanceof HTMLInputElement ||
        e.target instanceof HTMLTextAreaElement
      ) {
        return
      }

      switch (e.key) {
        // Marker navigation
        case 'ArrowRight':
        case 'ArrowDown':
          e.preventDefault()
          selectNextMarker()
          break
        case 'ArrowLeft':
        case 'ArrowUp':
          e.preventDefault()
          selectPrevMarker()
          break
        case 'Escape':
          e.preventDefault()
          setSelectedMarker(null)
          setShowShortcuts(false)
          break

        // Edit mode
        case 'e':
        case 'E':
          e.preventDefault()
          toggleEditMode()
          break

        // Camera controls
        case 'r':
        case 'R':
          e.preventDefault()
          setAutoRotate(!autoRotate)
          break

        // Display modes
        case 'w':
        case 'W':
          e.preventDefault()
          setWireframe(!wireframe)
          break
        case 'x':
        case 'X':
          e.preventDefault()
          setTransparent(!transparent)
          break

        // Help
        case '?':
          e.preventDefault()
          setShowShortcuts(!showShortcuts)
          break

        // Preset views (1-6)
        case '1':
          e.preventDefault()
          setCurrentView('front')
          break
        case '2':
          e.preventDefault()
          setCurrentView('back')
          break
        case '3':
          e.preventDefault()
          setCurrentView('left')
          break
        case '4':
          e.preventDefault()
          setCurrentView('right')
          break
        case '5':
          e.preventDefault()
          setCurrentView('top')
          break
        case '6':
          e.preventDefault()
          setCurrentView('isometric')
          break
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [
    selectNextMarker,
    selectPrevMarker,
    setSelectedMarker,
    toggleEditMode,
    setAutoRotate,
    autoRotate,
    wireframe,
    setWireframe,
    transparent,
    setTransparent,
    showShortcuts,
    setShowShortcuts,
    setCurrentView,
  ])
}
