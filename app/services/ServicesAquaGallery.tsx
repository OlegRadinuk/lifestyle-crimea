'use client';

import Image from 'next/image';
import { usePhotoModal } from '@/components/photo-modal/PhotoModalContext';

export type AquaPhoto = {
  src: string;
  alt: string;
  caption: string;
  /** Плитку видно только на широких экранах; в лайтбоксе кадр доступен везде */
  desktopOnly?: boolean;
};

type Props = {
  photos: AquaPhoto[];
};

/**
 * Плитка фото аквазоны в блоке «Аквазона» на /services.
 * Лайтбокс — общий для сайта (usePhotoModal), свой не заводим.
 */
export default function ServicesAquaGallery({ photos }: Props) {
  const { open } = usePhotoModal();
  const sources = photos.map((p) => p.src);

  return (
    <div className="sv-aqua-gallery">
      {photos.map((photo, i) => (
        <button
          type="button"
          key={photo.src}
          className={`sv-aqua-tile${i === 0 ? ' sv-aqua-tile--wide' : ''}${photo.desktopOnly ? ' sv-aqua-tile--desktop-only' : ''}`}
          onClick={() => open(sources, i)}
          aria-label={`Открыть фото: ${photo.caption}`}
        >
          <Image
            src={photo.src}
            alt={photo.alt}
            fill
            sizes="(max-width: 599px) 100vw, (max-width: 1024px) 50vw, 640px"
            className="sv-aqua-img"
          />
          <span className="sv-aqua-caption">{photo.caption}</span>
        </button>
      ))}
    </div>
  );
}
