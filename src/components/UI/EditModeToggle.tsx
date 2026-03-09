import { motion } from 'framer-motion'
import { useAdminStore } from '../../store/useAdminStore'

export function EditModeToggle() {
  const isEditMode = useAdminStore((state) => state.isEditMode)
  const toggleEditMode = useAdminStore((state) => state.toggleEditMode)

  return (
    <motion.button
      onClick={toggleEditMode}
      className="font-mystical fixed right-4 top-4 z-50 flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-medium shadow-lg transition-colors"
      style={{
        background: isEditMode
          ? 'linear-gradient(180deg, rgba(212, 168, 83, 0.4) 0%, rgba(139, 105, 20, 0.5) 100%)'
          : 'rgba(10, 10, 15, 0.85)',
        border: `1px solid ${isEditMode ? '#d4a853' : 'rgba(212, 168, 83, 0.3)'}`,
        color: isEditMode ? '#f0d78c' : '#8b8b99',
        boxShadow: isEditMode
          ? '0 0 20px rgba(212, 168, 83, 0.4)'
          : '0 4px 20px rgba(0, 0, 0, 0.4)',
      }}
      whileHover={{
        scale: 1.05,
        boxShadow: '0 0 25px rgba(212, 168, 83, 0.5)',
      }}
      whileTap={{ scale: 0.95 }}
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.5 }}
    >
      {isEditMode ? (
        <>
          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
            />
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"
            />
          </svg>
          View Mode
        </>
      ) : (
        <>
          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
            />
          </svg>
          Edit Mode
        </>
      )}
      <span
        className="ml-1 rounded px-1.5 py-0.5 text-xs"
        style={{
          background: 'rgba(212, 168, 83, 0.2)',
          color: '#d4a853',
        }}
      >
        E
      </span>
    </motion.button>
  )
}
