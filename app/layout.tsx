import type { Metadata } from 'next';
import { Montserrat } from 'next/font/google';
import './globals.css';

import HeaderConditional from '@/components/HeaderConditional';
import { HeaderProvider } from '@/components/HeaderContext';
import { SearchProvider } from '@/components/SearchContext';
import { ApartmentProvider } from '@/components/ApartmentContext';
import { PhotoModalProvider } from '@/components/photo-modal/PhotoModalContext';
import { ModalProvider } from '@/components/ModalProvider';
import { LayoutGroup } from 'framer-motion';

const montserrat = Montserrat({
  subsets: ['latin', 'cyrillic'],
  variable: '--font-montserrat',
  weight: ['300', '400', '500', '600', '700'],
});

export const metadata: Metadata = {
  title: {
    default: 'Апартаменты в Алуште | Life Style Crimea | Стиль Жизни с любовью',
    template: '%s | Life Style Crimea',
  },
  description: 'Премиальные апартаменты в Алуште с видом на море. 38 дизайнерских номеров с террасами, полностью укомплектованы. Бронирование онлайн. Лучшие цены напрямую.',
  keywords: 'апартаменты алушта, снять апартаменты в алуште, гостиница алушта, апартаменты с видом на море, life style crimea, стиль жизни с любовью',
  authors: [{ name: 'Life Style Crimea' }],
  creator: 'Life Style Crimea',
  publisher: 'Life Style Crimea',
  robots: {
    index: true,
    follow: true,
    'max-snippet': 150,
    'max-image-preview': 'large',
  },
  alternates: {
    canonical: 'https://lovelifestyle.ru',
  },
  openGraph: {
    title: 'Апартаменты в Алуште | Life Style Crimea',
    description: 'Премиальные апартаменты в Алуште с видом на море. 38 дизайнерских номеров. Бронирование онлайн.',
    url: 'https://lovelifestyle.ru',
    siteName: 'Life Style Crimea',
    locale: 'ru_RU',
    type: 'website',
    images: [
      {
        url: '/og-image.jpg',
        width: 1200,
        height: 630,
        alt: 'Life Style Crimea - апартаменты в Алуште',
      },
    ],
  },
  verification: {
    yandex: '439f21885509ad83',
    google: '9bcGUuoXG9e1r4BRrvPmd0OcE3ucaM7elZ_lBnFEY40',
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="ru">
      <head>
        <link
          rel="preload"
          as="image"
          href="/panoramas/LS-Art-Sweet-Caramel.webp"
          crossOrigin="anonymous"
          fetchPriority="high"
        />
      </head>
      <body className={montserrat.variable}>
        <LayoutGroup id="global-modals">
          <HeaderProvider>
            <SearchProvider>
              <ApartmentProvider>
                <PhotoModalProvider>
                  <HeaderConditional />
                  {children}
                  <ModalProvider />
                </PhotoModalProvider>
              </ApartmentProvider>
            </SearchProvider>
          </HeaderProvider>
        </LayoutGroup>
      </body>
    </html>
  );
}