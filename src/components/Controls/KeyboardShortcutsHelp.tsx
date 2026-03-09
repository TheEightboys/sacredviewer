import { motion, AnimatePresence } from 'framer-motion'
import { useViewerStore } from '../../store/useViewerStore'

interface ShortcutItem {
  key: string
  description: string
  category: 'navigation' | 'view' | 'display' | 'general'
}

const shortcuts: ShortcutItem[] = [
  // Navigation
  { key: 'Arrow Keys', description: 'Navigate markers', category: 'navigation' },
  { key: 'Escape', description: 'Deselect marker', category: 'navigation' },
  { key: '+/-', description: 'Zoom in/out', category: 'navigation' },
  { key: 'Home', description: 'Reset view', category: 'navigation' },
  { key: 'F', description: 'Fit to screen', category: 'navigation' },

  // View
  { key: '1-6', description: 'Preset views', category: 'view' },
  { key: 'R', description: 'Toggle auto-rotate', category: 'view' },

  // Display
  { key: 'W', description: 'Toggle wireframe', category: 'display' },
  { key: 'X', description: 'Toggle X-ray mode', category: 'display' },

  // General
  { key: 'E', description: 'Toggle edit mode', category: 'general' },
  { key: '?', description: 'Show/hide shortcuts', category: 'general' },
]

const categoryLabels: Record<string, string> = {
  navigation: 'Navigation',
  view: 'Camera & View',
  display: 'Display',
  general: 'General',
}

export function KeyboardShortcutsHelp() {
  const { showShortcuts, setShowShortcuts } = useViewerStore()

  const groupedShortcuts = shortcuts.reduce<Record<string, ShortcutItem[]>>(
    (acc, shortcut) => {
      const category = acc[shortcut.category]
      if (!category) {
        acc[shortcut.category] = [shortcut]
      } else {
        category.push(shortcut)
      }
      return acc
    },
    {}
  )

  return (
    <>
      {/* Help Button */}
      <motion.button
        onClick={() => setShowShortcuts(!showShortcuts)}
        className={`flex h-8 w-8 items-center justify-center rounded-lg text-sm font-bold transition-colors ${
          showShortcuts
            ? 'bg-blue-500 text-white'
            : 'bg-black/40 text-white/70 backdrop-blur-sm hover:bg-black/50 hover:text-white'
        }`}
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        title="Keyboard Shortcuts (?)"
      >
        ?
      </motion.button>

      {/* Modal */}
      <AnimatePresence>
        {showShortcuts && (
          <>
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm"
              onClick={() => setShowShortcuts(false)}
            />

            {/* Modal Content */}
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="fixed left-2 right-2 top-1/2 z-50 max-h-[90vh] -translate-y-1/2 overflow-y-auto rounded-xl bg-slate-900 p-4 shadow-2xl sm:left-1/2 sm:right-auto sm:w-full sm:max-w-lg sm:-translate-x-1/2 sm:p-6"
            >
              {/* Header */}
              <div className="mb-4 flex items-center justify-between sm:mb-6">
                <h2 className="text-lg font-semibold text-white sm:text-xl">Keyboard Shortcuts</h2>
                <button
                  onClick={() => setShowShortcuts(false)}
                  className="text-slate-400 hover:text-white"
                >
                  <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              {/* Shortcuts Grid - Single column on mobile */}
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 sm:gap-6">
                {Object.entries(groupedShortcuts).map(([category, items]) => (
                  <div key={category}>
                    <h3 className="mb-2 text-xs font-semibold uppercase tracking-wider text-slate-500">
                      {categoryLabels[category]}
                    </h3>
                    <div className="space-y-2">
                      {items.map((shortcut) => (
                        <div
                          key={shortcut.key}
                          className="flex items-center justify-between text-sm"
                        >
                          <span className="text-slate-400">{shortcut.description}</span>
                          <kbd className="ml-2 min-w-[50px] shrink-0 rounded bg-slate-800 px-2 py-1 text-center text-xs font-medium text-slate-300 sm:min-w-[60px]">
                            {shortcut.key}
                          </kbd>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>

              {/* Footer */}
              <div className="mt-4 border-t border-slate-700 pt-4 text-center text-xs text-slate-500 sm:mt-6">
                Press <kbd className="rounded bg-slate-800 px-1.5 py-0.5">?</kbd> to close
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  )
}
