import type { Metadata } from 'next'
import { Montserrat } from 'next/font/google'
import './globals.css'

import HeaderConditional from '@/components/HeaderConditional'

import { HeaderProvider } from '@/components/HeaderContext'
import { SearchProvider } from '@/components/SearchContext'
import { ApartmentProvider } from '@/components/ApartmentContext'
import { PhotoModalProvider } from '@/components/photo-modal/PhotoModalContext'
import { ModalProvider } from '@/components/ModalProvider'
import { LayoutGroup } from 'framer-motion'

const montserrat = Montserrat({
  subsets: ['latin', 'cyrillic'],
  variable: '--font-montserrat',
  weight: ['300', '400', '500', '600', '700'],
})

export const metadata: Metadata = {
  title: 'Life Style Crimea',
  description: 'Премиальный комплекс апартаментов в Алуште',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
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
        {/* ← ВОТ СЮДА ВСТАВЬ МЕТА-ТЕГ */}
        <meta name="yandex-verification" content="439f21885509ad83" />
        <meta name="google-site-verification" content="9bcGUuoXG9e1r4BRrvPmd0OcE3ucaM7elZ_lBnFEY40" />
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
  )
}