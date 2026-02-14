'use client'

import { createContext, useContext, useState, useCallback } from 'react'

type PhotoModalState = {
  images: string[]
  startIndex: number
}

type PhotoModalContextType = {
  isOpen: boolean
  images: string[]
  startIndex: number
  open: (images: string[], startIndex?: number) => void
  close: () => void
}

const PhotoModalContext = createContext<PhotoModalContextType | null>(null)

export function PhotoModalProvider({
  children,
}: {
  children: React.ReactNode
}) {
  const [state, setState] = useState<PhotoModalState | null>(null)

  const open = useCallback((images: string[], startIndex = 0) => {
    setState({ images, startIndex })
  }, [])

  const close = useCallback(() => {
    setState(null)
  }, [])

  return (
    <PhotoModalContext.Provider
      value={{
        isOpen: state !== null,
        images: state?.images ?? [],
        startIndex: state?.startIndex ?? 0,
        open,
        close,
      }}
    >
      {children}
    </PhotoModalContext.Provider>
  )
}

export function usePhotoModal() {
  const ctx = useContext(PhotoModalContext)
  if (!ctx) {
    throw new Error('usePhotoModal must be used inside PhotoModalProvider')
  }
  return ctx
}
