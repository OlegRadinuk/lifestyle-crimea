import type { Metadata } from 'next';
import { Montserrat } from 'next/font/google';
import './globals.css';
import JsonLdHotel from './json-ld-hotel';
import { AppProviders } from '@/components/AppProviders';

const montserrat = Montserrat({
  subsets: ['latin', 'cyrillic'],
  variable: '--font-montserrat',
  weight: ['300', '400', '500', '600', '700'],
});

export const metadata: Metadata = {
  metadataBase: new URL('https://lovelifestyle.ru'),
  title: {
    default: 'Апартаменты в Алуште | Life Style Crimea | Стиль Жизни с любовью',
    template: '%s | Life Style Crimea',
  },
  description: 'Премиальные апартаменты в Алуште с видом на море. 38 дизайнерских номеров с балконами, полностью укомплектованы. Бронирование онлайн. Лучшие цены напрямую.',
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
        {/* Preload главного изображения */}
        <link
          rel="preload"
          as="image"
          href="/panoramas/LS-Art-Sweet-Caramel.webp"
          crossOrigin="anonymous"
          fetchPriority="high"
        />

        {/* ========== ФАВИКОНКИ ========== */}
        <link rel="icon" type="image/png" href="/favicons/favicon-96x96.png" sizes="96x96" />
        <link rel="icon" type="image/svg+xml" href="/favicons/favicon.svg" />
        <link rel="shortcut icon" href="/favicons/favicon.ico" />
        <link rel="apple-touch-icon" sizes="180x180" href="/favicons/apple-touch-icon.png" />
        <meta name="apple-mobile-web-app-title" content="Love Life Style" />
        <link rel="manifest" href="/favicons/site.webmanifest" />
        
        {/* Цвет темы для браузера */}
        <meta name="theme-color" content="#139AB6" />
        <meta name="msapplication-TileColor" content="#139AB6" />
        <meta name="msapplication-navbutton-color" content="#139AB6" />

        {/* JSON-LD разметка для главной */}
        <JsonLdHotel />
      </head>
      <body className={montserrat.variable}>
        <AppProviders>{children}</AppProviders>
      </body>
    </html>
  );
}