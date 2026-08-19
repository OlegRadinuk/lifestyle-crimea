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
  /* Блокировка фона держится ровно на время жизни модалки — зависимостей нет
     намеренно. Раньше эффект был склеен с обработчиком Escape и висел на
     [onClose]: родитель отдаёт новую функцию на каждый рендер, эффект
     переигрывался, и блокировка снималась-ставилась по кругу. */
  useEffect(() => {
    const scrollY = window.scrollY
    const scrollBarWidth = window.innerWidth - document.documentElement.clientWidth
    const body = document.body

    /* Одного overflow:hidden мало: на iOS он фон не держит, а при снятии
       браузер терял позицию — гость закрывал галерею и улетал в начало
       списка (проверено, 1500px → 0 и в WebKit, и в Chromium).
       Поэтому фиксируем body со сдвигом на текущую прокрутку, а при закрытии
       возвращаем страницу ровно туда, где человек её оставил. */
    body.style.position = 'fixed'
    body.style.top = `-${scrollY}px`
    body.style.left = '0'
    body.style.right = '0'
    body.style.width = '100%'
    body.style.overflow = 'hidden'
    body.style.paddingRight = `${scrollBarWidth}px`

    return () => {
      body.style.position = ''
      body.style.top = ''
      body.style.left = ''
      body.style.right = ''
      body.style.width = ''
      body.style.overflow = ''
      body.style.paddingRight = ''
      window.scrollTo(0, scrollY)
    }
  }, [])

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [onClose])

  return createPortal(
    <div className="fixed inset-0 z-[4000]">
      
      {/* Backdrop */}
      <motion.div
        className="photo-modal-backdrop absolute inset-0 bg-black/40 backdrop-blur-md"
        onClick={onClose}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.2 }}
      />

      {/* Center Wrapper
          pointer-events-none — обязательно: обёртка растянута на весь экран
          (h-full w-full) и лежит выше подложки, поэтому без этого она
          перехватывала и клик, и наведение. Из-за неё клик мимо карточки не
          закрывал лайтбокс, хотя onClose на подложке висел. События
          возвращаем ниже, на самой карточке. */}
      <div className="pointer-events-none relative z-10 flex h-full w-full items-center justify-center p-6">

        {/* Animated Container */}
        <motion.div
  layoutId="photo-modal"
  transition={{
    layout: {
      duration: 0.45,
      ease: [0.22, 1, 0.36, 1]
    }
  }}
  className="pointer-events-auto relative w-full max-w-6xl rounded-2xl"
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
                absolute top-3 right-3 md:top-5 md:right-5
                z-40
                h-11 w-11 md:h-12 md:w-12 rounded-full
                flex items-center justify-center
                group
                bg-black/30
                backdrop-blur-md
                border border-white/25
                shadow-[0_2px_12px_rgba(0,0,0,0.35)]
                transition duration-300
                hover:bg-black/45 hover:border-white/40
                active:scale-95
              "
            >
              <svg
                className="w-5 h-5 md:w-[22px] md:h-[22px] text-white"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
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
