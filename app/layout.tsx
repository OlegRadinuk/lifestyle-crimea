import type { Metadata, Viewport } from 'next';
import { Montserrat } from 'next/font/google';
import Script from 'next/script';
import './globals.css';
import JsonLdHotel from './json-ld-hotel';
import { AppProviders } from '@/components/AppProviders';

const montserrat = Montserrat({
  subsets: ['latin', 'cyrillic'],
  variable: '--font-montserrat',
  weight: ['300', '400', '500', '600', '700'],
});

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
};

export const metadata: Metadata = {
  metadataBase: new URL('https://lovelifestyle.ru'),
  /* Тайтл: русское имя первым — по-английски бренд почти не ищут, а место
     в тайтле ограничено (~60-70 символов, дальше обрезает выдача). Хвост
     шаблона отдан городу: он вытягивает релевантность на всех подстраницах.
     «Профессорский уголок» — микрорайон, в котором стоит комплекс, и самый
     частый гео-запрос района (5 790/мес по Вордстату, регион Россия), а на
     сайте он не встречался ни разу. Держим его ТОЧЕЧНО: тайтл главной +
     описания главной и каталога. В тайтлы карточек и прочих страниц не
     тащим — там своя работа, а повтор на всех страницах пользы не даёт. */
  title: {
    default: 'Апартаменты в Алуште у моря — Профессорский уголок | «Стиль Жизни»',
    template: '%s | Стиль Жизни, Алушта',
  },
  description: 'Апарт-отель «Стиль Жизни» в Алуште, Профессорский уголок: апартаменты с видом на море, до пляжа 650 м. Бассейны круглый год, аквазона и детские бассейны. Снять жильё посуточно напрямую, без посредников.',
  keywords: 'апартаменты алушта, снять жильё в алуште, профессорский уголок алушта, квартира посуточно алушта, апартаменты алушта посуточно, жильё в алуште у моря, апарт-отель алушта, стиль жизни алушта',
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
  /* og:* — это то, что видно в мессенджерах и соцсетях, и оно НЕ наследует
     `title`/`description` выше: заполняется отдельно. Держать синхронно. */
  openGraph: {
    title: 'Апартаменты в Алуште у моря — Профессорский уголок, «Стиль Жизни»',
    description: 'Бассейны круглый год, аквазона с детскими бассейнами, вид на море и горы. До пляжа 650 м. Снять жильё посуточно напрямую, без посредников.',
    url: 'https://lovelifestyle.ru',
    siteName: 'Стиль Жизни, Алушта',
    locale: 'ru_RU',
    type: 'website',
    images: [
      {
        url: '/og-image.jpg',
        width: 1200,
        height: 630,
        alt: 'Апарт-отель «Стиль Жизни» в Алуште — бассейн с шезлонгами и вид на море',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Апартаменты в Алуште у моря — Профессорский уголок, «Стиль Жизни»',
    description: 'Бассейны круглый год, аквазона с детскими бассейнами, вид на море и горы. Снять жильё посуточно напрямую.',
    images: ['/og-image.jpg'],
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
        {/* Панораму (2-я сцена главной) НЕ преложим:
            (1) в корневом layout это грузило её на КАЖДОЙ странице, где она не нужна
                (/apartments и др.) → warning «preloaded but not used» в консоли;
            (2) с fetchPriority=high она отбирала канал у hero-картинки — настоящего LCP
                главной, которую ждёт лоад-скрин.
            Панорама ниже сгиба, грузится своим three.js-лоадером, под ней есть постер. */}

        {/* Лоад-скрин главной снимает JS, и только он: isLoading заведён как
            useState(true), поэтому на сервере оверлей рендерится всегда. Если
            скрипты не отработали, убрать его некому — он остаётся поверх
            страницы навсегда, и вместо главной видна заставка. Яндекс
            исполняет JS не всегда, так что случай не гипотетический.
            <noscript> — ровно тот инструмент: со скриптами лоадер работает
            как работал, без них его просто нет. */}
        <noscript>
          <style>{`.ls-loading-screen{display:none!important}`}</style>
        </noscript>

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
        {/* Widget position + mobile */}
        <style>{`
          #opsph-btn    { right: 130px !important; bottom: 72px !important; }
          #opsph-bubble { right: 130px !important; bottom: 132px !important; }
          #opsph-wrap   { right: 126px !important; bottom: 132px !important; }

          /* Avatar logo padding */
          #opsph-btn-ava img, #opsph-head-ava img,
          #opsph-bubble-ava img, .opsph-row-ava img {
            padding: 4px !important;
            object-fit: contain !important;
          }

          @media (max-width: 480px) {
            #opsph-btn    { right: 16px !important; bottom: 16px !important; }
            #opsph-bubble { right: 16px !important; bottom: 76px !important; max-width: calc(100vw - 32px) !important; }
            #opsph-wrap   { right: 0 !important; left: 0 !important; bottom: 0 !important;
                            width: 100vw !important; max-width: 100vw !important;
                            height: 100dvh !important; max-height: 100dvh !important;
                            border-radius: 0 !important; }
            /* Hide floating button when chat is open — use ✕ in header instead */
            body:has(#opsph-wrap.open) #opsph-btn { display: none !important; }
            /* Extra bottom padding for input area so keyboard doesn't hide it */
            #opsph-form { padding-bottom: env(safe-area-inset-bottom, 8px) !important; }
          }
        `}</style>
      </head>
      <body className={montserrat.variable}>
        <AppProviders>{children}</AppProviders>
        <script dangerouslySetInnerHTML={{ __html: `window._opsphCfg={"lifestyle-crimea":{avatar:"https://lovelifestyle.ru/images/logo/logo-white.webp"}};` }} />
        <Script
          src="https://optisphere.tech/widget.js"
          data-bot="lifestyle-crimea"
          data-color="#0891b2"
          data-title="София"
          data-placeholder="Спросите об апартаментах…"
          data-greeting-delay="25000"
          strategy="afterInteractive"
        />
      </body>
    </html>
  );
}