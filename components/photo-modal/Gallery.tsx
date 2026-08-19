'use client'

import { useState, useEffect } from 'react'
import { useSwipe } from './useSwipe'
import { useImagePreload } from './useImagePreload'

type Props = {
  images: string[]
  startIndex: number
  onClose: () => void
}

export function Gallery({ images, startIndex }: Props) {
  const [index, setIndex] = useState(startIndex)

  useImagePreload(images, index)

  const prev = () =>
    setIndex(i => (i - 1 + images.length) % images.length)

  const next = () =>
    setIndex(i => (i + 1) % images.length)

  const swipe = useSwipe(next, prev)

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'ArrowLeft') prev()
      if (e.key === 'ArrowRight') next()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [])

  return (
    <div className="relative">

      {/* IMAGE AREA */}
      <div {...swipe} className="relative h-[65vh]">

        <img
          src={images[index]}
          className="absolute inset-0 w-full h-full object-cover select-none z-20"
          draggable={false}
        />

{/* LEFT ARROW */}
<button
  onClick={prev}
  className="
    absolute left-3 md:left-5 top-1/2 -translate-y-1/2
    z-30
    h-11 w-11 md:h-12 md:w-12 rounded-full
    flex items-center justify-center

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
    <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
  </svg>
</button>

{/* RIGHT ARROW */}
<button
  onClick={next}
  className="
    absolute right-3 md:right-5 top-1/2 -translate-y-1/2
    z-30
    h-11 w-11 md:h-12 md:w-12 rounded-full
    flex items-center justify-center

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
    <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
  </svg>
</button>

        {/* NAVIGATION LINES */}
        <div className="absolute bottom-6 left-1/2 -translate-x-1/2 flex items-center gap-[10px] h-[8px] z-30">
          {images.map((_, i) => (
            <button
              key={i}
              onClick={() => setIndex(i)}
              className={`
                relative
                w-[30px] h-[3px]
                before:absolute before:content-[''] before:-inset-y-[18px] before:-inset-x-[5px]
                transition-all duration-300
                ${i === index
                  ? 'bg-[#139AB6] -translate-y-[2px] shadow-[0_0_6px_rgba(255,255,255,0.35)]'
                  : 'bg-white/25 hover:opacity-80'}
              `}
            />
          ))}
        </div>

      </div>
    </div>
  )
}
