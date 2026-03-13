import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  // Оптимизация изображений
  images: {
    formats: ['image/avif', 'image/webp'],
    deviceSizes: [640, 750, 828, 1080, 1200, 1920, 2048],
    minimumCacheTTL: 31536000,
    // Разрешаем локальные изображения из public
    domains: ['lovelifestyle.ru', 'localhost'],
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'lovelifestyle.ru',
        pathname: '/images/**',
      },
      {
        protocol: 'https',
        hostname: 'lovelifestyle.ru',
        pathname: '/_next/static/**',
      },
      {
        protocol: 'http',
        hostname: 'localhost',
        port: '3000',
        pathname: '/images/**',
      },
    ],
    // Добавляем loader для локальных изображений
    loader: 'default',
    // Убираем опасные форматы
    dangerouslyAllowSVG: false,
    contentSecurityPolicy: "default-src 'self'; script-src 'none'; sandbox;",
  },

  // Сжатие
  compress: true,

  // Заголовки кэширования
  async headers() {
    return [
      {
        source: '/images/:path*',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=31536000, immutable',
          },
        ],
      },
      {
        source: '/panoramas/:path*',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=31536000, immutable',
          },
        ],
      },
      {
        source: '/_next/static/:path*',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=31536000, immutable',
          },
        ],
      },
      // Добавляем для API
      {
        source: '/api/:path*',
        headers: [
          {
            key: 'Cache-Control',
            value: 'no-store, max-age=0',
          },
        ],
      },
    ];
  },

  // ✅ Turbopack конфиг
  turbopack: {},

  // ✅ Webpack конфиг
  webpack: (config, { isServer }) => {
    if (!isServer) {
      config.resolve.fallback = {
        ...config.resolve.fallback,
        'better-sqlite3': false,
        fs: false,
        path: false,
        os: false,
        crypto: false,
      };
    }
    return config;
  },

  // ✅ Server Actions
  experimental: {
    serverActions: {
      allowedOrigins: ['localhost:3000', 'lovelifestyle.ru'],
      bodySizeLimit: '2mb'
    }
  },

  poweredByHeader: false,
  reactStrictMode: true,
};

export default nextConfig;
