import { useState, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  ExportModal,
  ImportModal,
  ShareModal,
  PrintView,
  ScreenshotRecorder,
} from '../Export'
import { useAdminStore } from '../../store/useAdminStore'

export function ExportShareControls() {
  const [showDropdown, setShowDropdown] = useState(false)
  const [showExport, setShowExport] = useState(false)
  const [showImport, setShowImport] = useState(false)
  const [showShare, setShowShare] = useState(false)
  const [showPrint, setShowPrint] = useState(false)

  const isEditMode = useAdminStore((state) => state.isEditMode)
  const canvasRef = useRef<HTMLCanvasElement>(null)

  return (
    <>
      <div className="flex items-center gap-1">
        {/* Screenshot/Recording Button */}
        <ScreenshotRecorder canvasRef={canvasRef} />

        {/* Main Menu Button */}
        <div className="relative">
          <motion.button
            onClick={() => setShowDropdown(!showDropdown)}
            className="flex h-8 w-8 items-center justify-center rounded-lg bg-black/40 text-white/70 backdrop-blur-sm transition-colors hover:bg-black/50 hover:text-white"
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            title="Export & Share"
          >
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12"
              />
            </svg>
          </motion.button>

          {/* Dropdown */}
          <AnimatePresence>
            {showDropdown && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="absolute right-0 top-full z-50 mt-2 w-48 overflow-hidden rounded-lg bg-slate-900/95 shadow-xl backdrop-blur-sm"
              >
                <div className="p-2">
                  {/* Export Section */}
                  <p className="mb-2 px-3 text-xs font-semibold uppercase tracking-wider text-slate-500">
                    Export
                  </p>
                  <button
                    onClick={() => {
                      setShowDropdown(false)
                      setShowExport(true)
                    }}
                    className="flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm text-slate-300 transition-colors hover:bg-slate-800 hover:text-white"
                  >
                    <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                      />
                    </svg>
                    Export Project
                  </button>

                  <button
                    onClick={() => {
                      setShowDropdown(false)
                      setShowPrint(true)
                    }}
                    className="flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm text-slate-300 transition-colors hover:bg-slate-800 hover:text-white"
                  >
                    <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z"
                      />
                    </svg>
                    Print / PDF
                  </button>
                </div>

                {/* Share Section */}
                <div className="border-t border-slate-700 p-2">
                  <p className="mb-2 px-3 text-xs font-semibold uppercase tracking-wider text-slate-500">
                    Share
                  </p>
                  <button
                    onClick={() => {
                      setShowDropdown(false)
                      setShowShare(true)
                    }}
                    className="flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm text-slate-300 transition-colors hover:bg-slate-800 hover:text-white"
                  >
                    <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z"
                      />
                    </svg>
                    Share Project
                  </button>
                </div>

                {/* Import Section (Admin only) */}
                {isEditMode && (
                  <div className="border-t border-slate-700 p-2">
                    <p className="mb-2 px-3 text-xs font-semibold uppercase tracking-wider text-slate-500">
                      Import
                    </p>
                    <button
                      onClick={() => {
                        setShowDropdown(false)
                        setShowImport(true)
                      }}
                      className="flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm text-blue-400 transition-colors hover:bg-blue-600/20"
                    >
                      <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"
                        />
                      </svg>
                      Import Data
                    </button>
                  </div>
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>

      {/* Modals */}
      <AnimatePresence>
        {showExport && <ExportModal onClose={() => setShowExport(false)} />}
        {showImport && <ImportModal onClose={() => setShowImport(false)} />}
        {showShare && <ShareModal onClose={() => setShowShare(false)} />}
        {showPrint && <PrintView onClose={() => setShowPrint(false)} />}
      </AnimatePresence>
    </>
  )
}
