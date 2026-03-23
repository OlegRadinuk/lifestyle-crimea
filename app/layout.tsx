import type { Metadata } from 'next';
import { Montserrat } from 'next/font/google';
import './globals.css';
import JsonLdHotel from './json-ld-hotel';

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
    default: 'Апартаменты в Алуште | Апарт-отель Стиль Жизни с Любовью | Life Style Crimea',
    template: '%s | Life Style Crimea',
  },
  description: 'Официальный сайт апарт-отеля «Стиль Жизни с Любовью» в Алуште. Дизайнерские апартаменты с видом на море. Гарантия лучшей цены, мгновенное подтверждение брони, бронирование онлайн.',
  keywords: 'апартаменты алушта, апарт-отель алушта, снять апартаменты в алуште, апартаменты с видом на море, стиль жизни с любовью, life style crimea',
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
    title: 'Апартаменты в Алуште | Апарт-отель Стиль Жизни с Любовью | Life Style Crimea',
    description: 'Официальный сайт апарт-отеля «Стиль Жизни с Любовью» в Алуште. Дизайнерские апартаменты с видом на море. Гарантия лучшей цены.',
    url: 'https://lovelifestyle.ru',
    siteName: 'Life Style Crimea',
    locale: 'ru_RU',
    type: 'website',
    images: [
      {
        url: '/og-image.jpg',
        width: 1200,
        height: 630,
        alt: 'Апарт-отель Стиль Жизни с Любовью - апартаменты в Алуште',
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

        {/* ФАВИКОНКИ */}
        <link rel="icon" type="image/png" href="/favicons/favicon-96x96.png" sizes="96x96" />
        <link rel="icon" type="image/svg+xml" href="/favicons/favicon.svg" />
        <link rel="shortcut icon" href="/favicons/favicon.ico" />
        <link rel="apple-touch-icon" sizes="180x180" href="/favicons/apple-touch-icon.png" />
        <meta name="apple-mobile-web-app-title" content="Love Life Style" />
        <link rel="manifest" href="/favicons/site.webmanifest" />
        <meta name="theme-color" content="#139AB6" />

        {/* JSON-LD для главной */}
        <JsonLdHotel />
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