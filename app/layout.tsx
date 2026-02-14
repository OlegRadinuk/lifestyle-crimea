import type { Metadata } from 'next'
import { Montserrat } from 'next/font/google'
import './globals.css'

import HeaderWrapper from '@/components/HeaderWrapper'

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
      <body className={montserrat.variable}>
  <LayoutGroup id="global-modals">

    <HeaderProvider>
      <SearchProvider>
        <ApartmentProvider>
          <PhotoModalProvider>

            <HeaderWrapper />

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
