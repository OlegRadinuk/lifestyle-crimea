import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  // Оптимизация изображений
  images: {
    formats: ['image/avif', 'image/webp'],
    deviceSizes: [640, 750, 828, 1080, 1200, 1920, 2048],
    minimumCacheTTL: 31536000,
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'lovelifestyle.ru',
      },
    ],
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
    ];
  },

  // ❌ УБИРАЕМ swcMinify — он больше не нужен
  // swcMinify: true,

  // ✅ Turbopack конфиг (пустой, чтобы избежать ошибки)
  turbopack: {},

  // ✅ Webpack всё ещё можно использовать, но только на сервере
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

  // Другие полезные настройки
  output: 'standalone',
  poweredByHeader: false,
  reactStrictMode: true,
};

export default nextConfig;