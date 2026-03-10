import { useEffect } from 'react'
import { MysticalLayout } from './components/Layout'
import { MysticalScene } from './components/Scene'
import { MysticalInfoPanel, FullscreenToggle, ShareButton, WhatsAppButton } from './components/UI'
import { ErrorBoundary } from './components/ErrorBoundary'
import { useKeyboardNavigation } from './hooks/useKeyboardNavigation'
import { useAdminStore } from './store/useAdminStore'
import { useStore } from './store/useStore'

export default function App() {
  useKeyboardNavigation()
  const config = useAdminStore((state) => state.config)
  const setSelectedMarker = useStore((state) => state.setSelectedMarker)
  const selectedMarker = useStore((state) => state.selectedMarker)
  // Auto-select first marker immediately so video panel is visible from start
  useEffect(() => {
    const firstMarker = config.markers[0]
    if (!selectedMarker && firstMarker) {
      setSelectedMarker(firstMarker.id)
    }
  }, [selectedMarker, config.markers, setSelectedMarker])

  // Get title from config or use default
  const title = config.title || ''

  return (
    <ErrorBoundary>
      <div className="fixed right-4 top-4 z-50 flex gap-2" data-html2canvas-ignore>
        <WhatsAppButton />
        <ShareButton />
        <FullscreenToggle />
      </div>
      <MysticalLayout
        title={title}
        infoPanel={<MysticalInfoPanel />}
      >
        <div className="relative h-full w-full">
          <MysticalScene />
        </div>
      </MysticalLayout>
    </ErrorBoundary>
  )
}
