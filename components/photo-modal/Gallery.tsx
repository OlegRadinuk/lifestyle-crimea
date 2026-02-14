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
    absolute left-5 top-1/2 -translate-y-1/2
    z-30
    h-14 w-14 rounded-full
    flex items-center justify-center

    bg-[rgba(19,154,182,0.20)]
    backdrop-blur-2xl
    border border-white/40

    transition duration-300
    hover:bg-[rgba(19,154,182,0.35)]
  "
>
  <svg
    className="w-7 h-7 text-white transition group-hover:text-[#139AB6]"
    fill="none"
    stroke="currentColor"
    strokeWidth="2.5"
    viewBox="0 0 24 24"
  >
    <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
  </svg>
</button>

{/* RIGHT ARROW */}
<button
  onClick={next}
  className="
    absolute right-5 top-1/2 -translate-y-1/2
    z-30
    h-14 w-14 rounded-full
    flex items-center justify-center

    bg-[rgba(19,154,182,0.20)]
    backdrop-blur-2xl
    border border-white/40

    transition duration-300
    hover:bg-[rgba(19,154,182,0.35)]
  "
>
  <svg
    className="w-7 h-7 text-white"
    fill="none"
    stroke="currentColor"
    strokeWidth="2.5"
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
