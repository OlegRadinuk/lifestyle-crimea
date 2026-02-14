import { AnimatePresence } from 'framer-motion'
import { usePhotoModal } from './PhotoModalContext'
import { PhotoModal } from './PhotoModal'

export function PhotoModalRoot() {
  const { isOpen, images, startIndex, close } = usePhotoModal()

  return (
    <AnimatePresence mode="wait">
      {isOpen && (
        <PhotoModal
          key="photo-modal"
          images={images}
          startIndex={startIndex}
          onClose={close}
        />
      )}
    </AnimatePresence>
  )
}
