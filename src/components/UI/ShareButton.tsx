import { useState, useRef, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import * as htmlToImage from 'html-to-image'

type ShareTarget = 'instagram' | 'whatsapp' | 'whatsapp-group' | null

export function ShareButton() {
  const [isOpen, setIsOpen] = useState(false)
  const [isSharing, setIsSharing] = useState<ShareTarget>(null)
  const [showTooltip, setShowTooltip] = useState<{show: boolean, text: string}>({show: false, text: ''})
  const menuRef = useRef<HTMLDivElement>(null)

  // Close menu when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const handleShare = async (target: ShareTarget) => {
    if (isSharing) return
    setIsSharing(target)
    setShowTooltip({show: false, text: ''})

    // If on desktop without native share menu, give a hint
    const targetName = target === 'instagram' ? 'Instagram' : target === 'whatsapp' ? 'WhatsApp' : 'WhatsApp Group'

    try {
      // 1. Capture the screenshot
      const dataUrl = await htmlToImage.toPng(document.body, {
        backgroundColor: '#0a1525',
        filter: (node) => {
          if (node instanceof HTMLElement) {
             return node.closest('[data-html2canvas-ignore]') === null
          }
          return true
        }
      })

      const response = await fetch(dataUrl)
      const blob = await response.blob()

      if (!blob) throw new Error('Screenshot failed')

      const file = new File([blob], `sacred-viewer-${target}.png`, { type: 'image/png' })
      const shareData = {
        title: 'Explore Sacred Viewer',
        text: `Check out this beautiful 3D model on Sacred Viewer!`,
        files: [file]
      }

      // Try native Web Share API (WhatsApp/Insta natively appear here on mobile)
      if (navigator.canShare && navigator.canShare(shareData)) {
        try {
          // Note: On mobile web, we must use the OS Share Sheet. 
          // We can't deep-link an image directly to a specific app without native intent.
          await navigator.share(shareData)
          setIsOpen(false)
        } catch (error) {
          if ((error as Error).name !== 'AbortError') {
             fallbackDownload(dataUrl);
          }
        }
      } else {
        // Fallback for desktop: Try Clipboard or Download
        try {
           await navigator.clipboard.write([
             new ClipboardItem({ 'image/png': blob })
           ])
           setShowTooltip({show: true, text: `Copied to clipboard! Ready to paste in ${targetName}.`})
           setTimeout(() => setShowTooltip({show: false, text: ''}), 4000)
           setIsOpen(false)
        } catch (e) {
           console.error('Clipboard write failed', e);
           setShowTooltip({show: true, text: `Downloading image for ${targetName}...`})
           setTimeout(() => setShowTooltip({show: false, text: ''}), 3000)
           fallbackDownload(dataUrl);
           setIsOpen(false)
        }
      }

    } catch (error) {
      console.error('Failed to capture screenshot:', error)
      alert("Failed to capture screenshot. Please try again.")
    } finally {
      setIsSharing(null)
    }
  }

  const fallbackDownload = (dataUrl: string) => {
    const link = document.createElement('a')
    link.download = 'sacred-viewer-snapshot.png'
    link.href = dataUrl
    link.click()
  }

  return (
    <div className="relative z-50 flex items-center justify-center" ref={menuRef} data-html2canvas-ignore>
      {/* Fancy Tooltip */}
      <AnimatePresence>
        {showTooltip.show && (
          <motion.div
            initial={{ opacity: 0, y: 10, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -10, scale: 0.9 }}
            className="absolute right-0 top-14 z-50 w-max rounded-lg px-4 py-3 text-sm font-medium shadow-2xl backdrop-blur-md"
            style={{
              background: 'linear-gradient(135deg, rgba(20, 20, 25, 0.95) 0%, rgba(30, 30, 40, 0.95) 100%)',
              border: '1px solid rgba(212, 168, 83, 0.5)',
              color: '#f0d78c',
              boxShadow: '0 10px 30px rgba(0,0,0,0.5), 0 0 20px rgba(212, 168, 83, 0.2)'
            }}
          >
            {showTooltip.text}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Share Menu Dropdown */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 10, transformOrigin: 'top right' }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 10 }}
            transition={{ type: "spring", stiffness: 300, damping: 25 }}
            className="absolute right-0 top-14 mt-2 flex w-56 flex-col overflow-hidden rounded-xl shadow-2xl backdrop-blur-xl"
            style={{
              background: 'rgba(15, 15, 20, 0.85)',
              border: '1px solid rgba(212, 168, 83, 0.3)',
              boxShadow: '0 20px 40px rgba(0,0,0,0.6), inset 0 1px 0 rgba(255,255,255,0.1)'
            }}
          >
            <div className="px-3 py-2 text-xs font-semibold uppercase tracking-wider text-slate-400"
                 style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
              Share Snapshot To
            </div>
            
            {/* Instagram */}
            <button 
              onClick={() => handleShare('instagram')}
              disabled={!!isSharing}
              className="group flex items-center gap-3 px-4 py-3 text-sm font-medium text-white transition-colors hover:bg-white/10 disabled:opacity-50"
            >
              {isSharing === 'instagram' ? <Spinner /> : (
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-tr from-[#f09433] via-[#e6683c] to-[#bc1888] shadow-lg">
                  <svg className="h-5 w-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                     <rect x="2" y="2" width="20" height="20" rx="5" ry="5" strokeWidth="2"></rect>
                     <path d="M16 11.37A4 4 0 1112.63 8 4 4 0 0116 11.37z" strokeWidth="2"></path>
                     <line x1="17.5" y1="6.5" x2="17.51" y2="6.5" strokeWidth="2"></line>
                  </svg>
                </div>
              )}
              Instagram
            </button>

            {/* WhatsApp */}
            <button 
              onClick={() => handleShare('whatsapp')}
              disabled={!!isSharing}
              className="group flex items-center gap-3 px-4 py-3 text-sm font-medium text-white transition-colors hover:bg-white/10 disabled:opacity-50"
            >
              {isSharing === 'whatsapp' ? <Spinner /> : (
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#25D366] shadow-lg">
                  <svg className="h-5 w-5 text-white" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.888-.788-1.489-1.761-1.663-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51a12.8 12.8 0 00-.57-.01c-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z"/>
                  </svg>
                </div>
              )}
              WhatsApp
            </button>

            {/* WhatsApp Group */}
            <button 
              onClick={() => handleShare('whatsapp-group')}
              disabled={!!isSharing}
              className="group flex items-center gap-3 px-4 py-3 text-sm font-medium text-white transition-colors hover:bg-white/10 disabled:opacity-50"
            >
              {isSharing === 'whatsapp-group' ? <Spinner /> : (
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-600 shadow-lg relative">
                  <svg className="h-5 w-5 text-white" fill="currentColor" viewBox="0 0 24 24">
                     <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.888-.788-1.489-1.761-1.663-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51a12.8 12.8 0 00-.57-.01c-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z"/>
                  </svg>
                  <div className="absolute -bottom-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-[#128C7E] shadow border border-[#1e293b]">
                     <svg className="h-2.5 w-2.5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"/></svg>
                  </div>
                </div>
              )}
              WhatsApp Group
            </button>

          </motion.div>
        )}
      </AnimatePresence>

      <motion.button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center justify-center rounded-lg bg-black/50 p-2 text-white/80 backdrop-blur-sm transition-colors hover:bg-black/70 hover:text-white"
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        aria-label="Share Snapshot"
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          width="24"
          height="24"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d="M4 12v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8" />
          <polyline points="16 6 12 2 8 6" />
          <line x1="12" y1="2" x2="12" y2="15" />
        </svg>
      </motion.button>
    </div>
  )
}

function Spinner() {
  return (
    <div className="flex h-8 w-8 items-center justify-center">
      <motion.div
        animate={{ rotate: 360 }}
        transition={{ repeat: Infinity, duration: 1, ease: 'linear' }}
        className="h-5 w-5 rounded-full border-2 border-slate-500 border-t-white"
      />
    </div>
  )
}
