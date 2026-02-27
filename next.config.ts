import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    // Форматы, которые Next.js может генерировать
    formats: ['image/webp'],
    
    // Размеры изображений для оптимизации
    deviceSizes: [640, 750, 828, 1080, 1200, 1920, 2048],
    imageSizes: [16, 32, 48, 64, 96, 128, 256, 384],
    
    // Кэширование оптимизированных изображений (в секундах)
    minimumCacheTTL: 60,
    
    // Если используете внешние изображения - укажите домены
    // domains: ['example.com'],
    
    // Remote patterns для более гибкой настройки
    remotePatterns: [],
  },
  
  // Сжатие ответов
  compress: true,
  
  // Опции для TurboPack (вы используете)
  experimental: {
    turbo: {
      rules: {
        '*.webp': ['file-loader'],
      }
    }
  }
};

export default nextConfig;