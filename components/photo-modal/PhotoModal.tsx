'use client'

import { useEffect } from 'react'
import { createPortal } from 'react-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { Gallery } from './Gallery'

type Props = {
  images: string[]
  startIndex: number
  onClose: () => void
}

export function PhotoModal({ images, startIndex, onClose }: Props) {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }

    const scrollBarWidth =
      window.innerWidth - document.documentElement.clientWidth

    document.body.style.overflow = 'hidden'
    document.body.style.paddingRight = `${scrollBarWidth}px`

    window.addEventListener('keydown', onKey)

    return () => {
      document.body.style.overflow = ''
      document.body.style.paddingRight = ''
      window.removeEventListener('keydown', onKey)
    }
  }, [onClose])

  return createPortal(
    <div className="fixed inset-0 z-[4000]">
      
      {/* Backdrop */}
      <motion.div
        className="absolute inset-0 bg-black/40 backdrop-blur-md"
        onClick={onClose}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.2 }}
      />

      {/* Center Wrapper */}
      <div className="relative z-10 flex h-full w-full items-center justify-center p-6">
        
        {/* Animated Container */}
        <motion.div
  layoutId="photo-modal"
  transition={{
    layout: {
      duration: 0.45,
      ease: [0.22, 1, 0.36, 1]
    }
  }}
  className="relative w-full max-w-6xl rounded-2xl"
>
          {/* Glow */}
          <div
            className="
              absolute -inset-1 rounded-2xl
              bg-[#139AB6]
              blur-2xl opacity-40
              pointer-events-none
            "
          />

          {/* Card */}
          <div
            className="
              relative rounded-2xl
              bg-white
              border border-[#139AB6]
              shadow-[0_60px_140px_rgba(0,0,0,0.45)]
            "
          >
            {/* Close */}
            <button
              onClick={onClose}
              className="
                absolute top-5 right-5
                z-40
                h-14 w-14 rounded-full
                flex items-center justify-center
                group
                bg-[rgba(19,154,182,0.20)]
                backdrop-blur-2xl
                border border-white/40
                transition duration-300
                hover:bg-[rgba(19,154,182,0.35)]
              "
            >
              <svg
                className="w-6 h-6 text-white transition group-hover:text-[#139AB6]"
                fill="none"
                stroke="currentColor"
                strokeWidth="2.5"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M6 6l12 12M6 18L18 6"
                />
              </svg>
            </button>

            <div className="overflow-hidden rounded-2xl">
              <Gallery
                images={images}
                startIndex={startIndex}
                onClose={onClose}
              />
            </div>
          </div>
        </motion.div>
      </div>
    </div>,
    document.body
  )
}
