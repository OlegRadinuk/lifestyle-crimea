// components/photo-modal/useSwipe.ts
import { useRef } from 'react'

export function useSwipe(onLeft: () => void, onRight: () => void) {
  const startX = useRef<number | null>(null)

  return {
    onTouchStart: (e: React.TouchEvent) => {
      startX.current = e.touches[0].clientX
    },
    onTouchEnd: (e: React.TouchEvent) => {
      if (startX.current === null) return
      const delta = startX.current - e.changedTouches[0].clientX
      if (Math.abs(delta) > 50) {
        delta > 0 ? onLeft() : onRight()
      }
      startX.current = null
    },
  }
}
