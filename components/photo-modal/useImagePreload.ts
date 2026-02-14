// components/photo-modal/useImagePreload.ts
export function useImagePreload(images: string[], index: number) {
  ;[index, index - 1, index + 1].forEach(i => {
    if (!images[i]) return
    const img = new Image()
    img.src = images[i]
  })
}
