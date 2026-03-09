import { motion } from 'framer-motion'
import { ViewPresets } from './ViewPresets'
import { CameraControlsPanel } from './CameraControlsPanel'
import { ModelDisplayControls } from './ModelDisplayControls'
import { KeyboardShortcutsHelp } from './KeyboardShortcutsHelp'
import { TourControls } from './TourControls'
import { PerformancePanel } from './PerformancePanel'
import { CameraView } from '../../store/useViewerStore'
import { useAdminStore } from '../../store/useAdminStore'

interface SceneOverlayProps {
  onSelectView: (view: CameraView) => void
}

export function SceneOverlay({
  onSelectView,
}: SceneOverlayProps) {
  const isEditMode = useAdminStore((state) => state.isEditMode)

  return (
    <div className="pointer-events-none absolute inset-0 z-10">
      {/* Top-left: View Presets & Tour */}
      <div className="pointer-events-auto absolute left-2 top-2 flex items-start gap-1 sm:left-4 sm:top-4 sm:gap-2">
        <ViewPresets onSelectView={onSelectView} />
        <TourControls />
      </div>

      {/* Top-right: Display Controls */}
      <div className="pointer-events-auto absolute right-2 top-2 flex items-start gap-1 sm:right-4 sm:top-4 sm:gap-2">
        <PerformancePanel />
        <ModelDisplayControls />
        <CameraControlsPanel />
        <KeyboardShortcutsHelp />
      </div>

      {/* Bottom-left: Edit Mode Indicator */}
      {isEditMode && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="pointer-events-none absolute bottom-2 left-2 flex items-center gap-2 rounded-lg bg-blue-500/20 px-2 py-1.5 backdrop-blur-sm sm:bottom-4 sm:left-4 sm:px-3 sm:py-2"
        >
          <div className="h-2 w-2 animate-pulse rounded-full bg-blue-500" />
          <span className="text-xs font-medium text-blue-400 sm:text-sm">Edit Mode</span>
          <span className="hidden text-xs text-blue-400/60 sm:inline">Click model to place marker</span>
        </motion.div>
      )}
    </div>
  )
}
