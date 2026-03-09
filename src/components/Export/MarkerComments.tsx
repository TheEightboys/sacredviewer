import { useState, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useExportStore } from '../../store/useExportStore'

interface MarkerCommentsProps {
  markerId: string
  markerTitle: string
}

export function MarkerComments({ markerId, markerTitle }: MarkerCommentsProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [newComment, setNewComment] = useState('')
  const [authorName, setAuthorName] = useState(() => {
    return localStorage.getItem('comment-author') || ''
  })

  const { addComment, deleteComment, getMarkerComments } = useExportStore()

  const markerComments = getMarkerComments(markerId)

  const handleSubmit = useCallback(
    (e: React.FormEvent) => {
      e.preventDefault()
      if (!newComment.trim()) return

      // Save author name for future comments
      if (authorName.trim()) {
        localStorage.setItem('comment-author', authorName.trim())
      }

      addComment(markerId, newComment.trim(), authorName.trim() || 'Anonymous')
      setNewComment('')
    },
    [markerId, newComment, authorName, addComment]
  )

  const formatDate = (timestamp: number) => {
    const date = new Date(timestamp)
    return date.toLocaleDateString() + ' ' + date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
  }

  return (
    <div className="relative">
      {/* Toggle Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-1.5 rounded-lg bg-slate-700/50 px-2 py-1 text-xs text-slate-400 transition-colors hover:bg-slate-700 hover:text-white"
      >
        <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"
          />
        </svg>
        {markerComments.length > 0 && (
          <span className="rounded-full bg-blue-500 px-1.5 py-0.5 text-[10px] font-bold text-white">
            {markerComments.length}
          </span>
        )}
      </button>

      {/* Comments Panel */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 10, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 10, scale: 0.95 }}
            className="absolute bottom-full left-0 z-50 mb-2 w-72 overflow-hidden rounded-lg bg-slate-800 shadow-xl"
          >
            {/* Header */}
            <div className="flex items-center justify-between border-b border-slate-700 px-4 py-3">
              <div>
                <h4 className="text-sm font-medium text-white">Comments</h4>
                <p className="truncate text-xs text-slate-400">{markerTitle}</p>
              </div>
              <button
                onClick={() => setIsOpen(false)}
                className="text-slate-400 hover:text-white"
              >
                <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {/* Comments List */}
            <div className="max-h-48 overflow-y-auto p-3">
              {markerComments.length === 0 ? (
                <p className="py-4 text-center text-xs text-slate-500">No comments yet</p>
              ) : (
                <div className="space-y-3">
                  {markerComments.map((comment) => (
                    <div
                      key={comment.id}
                      className="group rounded-lg bg-slate-700/50 p-2"
                    >
                      <div className="mb-1 flex items-center justify-between">
                        <span className="text-xs font-medium text-blue-400">
                          {comment.author}
                        </span>
                        <div className="flex items-center gap-2">
                          <span className="text-[10px] text-slate-500">
                            {formatDate(comment.timestamp)}
                          </span>
                          <button
                            onClick={() => deleteComment(comment.id)}
                            className="hidden text-slate-500 hover:text-red-400 group-hover:block"
                          >
                            <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                            </svg>
                          </button>
                        </div>
                      </div>
                      <p className="text-xs text-slate-300">{comment.text}</p>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Add Comment Form */}
            <form onSubmit={handleSubmit} className="border-t border-slate-700 p-3">
              <input
                type="text"
                value={authorName}
                onChange={(e) => setAuthorName(e.target.value)}
                placeholder="Your name"
                className="mb-2 w-full rounded bg-slate-700 px-2 py-1 text-xs text-white placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
              />
              <div className="flex gap-2">
                <input
                  type="text"
                  value={newComment}
                  onChange={(e) => setNewComment(e.target.value)}
                  placeholder="Add a comment..."
                  className="flex-1 rounded bg-slate-700 px-2 py-1.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                />
                <button
                  type="submit"
                  disabled={!newComment.trim()}
                  className="rounded bg-blue-600 px-3 py-1.5 text-xs font-medium text-white transition-colors hover:bg-blue-500 disabled:opacity-50"
                >
                  Add
                </button>
              </div>
            </form>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
