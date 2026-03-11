'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { useEffect, useState } from 'react';

export function LoadingScreen() {
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => setIsLoading(false), 2500);
    return () => clearTimeout(timer);
  }, []);

  // Разбиваем текст на буквы
  const title = "Стиль Жизни".split("");
  const subtitle = "Lifestyle · Luxury".split("");

  return (
    <AnimatePresence mode="wait">
      {isLoading && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
          className="fixed inset-0 z-[9999] flex items-center justify-center"
          style={{
            background: 'radial-gradient(circle at 30% 30%, #0B2A35, #051015)'
          }}
        >
          {/* Анимированные волны на фоне */}
          <motion.div
            className="absolute inset-0 opacity-20"
            style={{
              background: 'radial-gradient(circle at 50% 50%, #139AB6 0%, transparent 70%)'
            }}
            animate={{
              scale: [1, 1.2, 1],
              opacity: [0.2, 0.3, 0.2]
            }}
            transition={{
              duration: 4,
              repeat: Infinity,
              ease: "easeInOut"
            }}
          />

          {/* Основной контент */}
          <div className="relative z-10 text-center">
            {/* Логотип или иконка */}
            <motion.div
              initial={{ scale: 0, rotate: -180 }}
              animate={{ scale: 1, rotate: 0 }}
              transition={{ 
                duration: 0.8, 
                ease: [0.22, 1, 0.36, 1],
                delay: 0.2
              }}
              className="w-24 h-24 mx-auto mb-8 rounded-3xl bg-gradient-to-br from-[#139AB6] to-[#0D6B7F] flex items-center justify-center shadow-2xl shadow-[#139AB6]/30 text-white"
            >
              <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                <path d="M4 8L4 4L8 4M16 4L20 4L20 8M20 16L20 20L16 20M8 20L4 20L4 16" strokeLinecap="round"/>
                <circle cx="12" cy="12" r="3" fill="currentColor" fillOpacity="0.2" stroke="currentColor"/>
              </svg>
            </motion.div>

            {/* Заголовок по буквам */}
            <div className="mb-4 flex justify-center flex-wrap">
              {title.map((letter, index) => (
                <motion.span
                  key={index}
                  initial={{ opacity: 0, y: 50 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ 
                    delay: index * 0.08,
                    duration: 0.6,
                    ease: [0.22, 1, 0.36, 1]
                  }}
                  className="text-5xl md:text-6xl font-light inline-block text-white"
                  style={{ 
                    textShadow: '0 0 20px rgba(19,154,182,0.5)',
                    marginRight: letter === ' ' ? '0.3em' : '0.05em'
                  }}
                >
                  {letter}
                </motion.span>
              ))}
            </div>

            {/* Подзаголовок по буквам */}
            <motion.div 
              className="mb-12 flex justify-center flex-wrap"
              initial={{ opacity: 0 }}
              animate={{ opacity: 0.8 }}
              transition={{ delay: 0.8, duration: 0.5 }}
            >
              {subtitle.map((letter, index) => (
                <motion.span
                  key={index}
                  className="text-sm md:text-base uppercase tracking-[0.3em] inline-block text-white"
                  style={{
                    marginRight: letter === ' ' ? '0.5em' : '0.1em'
                  }}
                  animate={{
                    opacity: [0.5, 1, 0.5],
                  }}
                  transition={{
                    duration: 2,
                    delay: 1 + index * 0.1,
                    repeat: Infinity,
                    ease: "easeInOut"
                  }}
                >
                  {letter}
                </motion.span>
              ))}
            </motion.div>

            {/* Индикатор загрузки */}
            <div className="flex justify-center items-center gap-3 mb-8">
              {[0, 1, 2].map((i) => (
                <motion.div
                  key={i}
                  className="w-3 h-3 rounded-full"
                  style={{ 
                    background: i === 1 ? '#139AB6' : 'rgba(255,255,255,0.3)',
                    boxShadow: i === 1 ? '0 0 20px #139AB6' : 'none'
                  }}
                  animate={{
                    scale: [1, 1.3, 1],
                    opacity: [0.5, 1, 0.5],
                  }}
                  transition={{
                    duration: 1.5,
                    delay: i * 0.2,
                    repeat: Infinity,
                    ease: "easeInOut"
                  }}
                />
              ))}
            </div>

            {/* Прогресс-бар */}
            <motion.div 
              className="h-[2px] w-48 mx-auto bg-white/10 rounded-full overflow-hidden"
              initial={{ width: 0, opacity: 0 }}
              animate={{ width: '12rem', opacity: 1 }}
              transition={{ delay: 0.5, duration: 0.5 }}
            >
              <motion.div
                className="h-full bg-gradient-to-r from-[#139AB6] to-[#4FD0E8]"
                initial={{ width: '0%' }}
                animate={{ width: '100%' }}
                transition={{ 
                  duration: 2,
                  delay: 0.8,
                  ease: "easeInOut"
                }}
              />
            </motion.div>

            {/* Текст "загрузка" */}
            <motion.p
              className="text-white/40 text-xs mt-4 tracking-[0.3em] uppercase"
              animate={{ opacity: [0.3, 0.8, 0.3] }}
              transition={{ duration: 2, repeat: Infinity }}
            >
              подготовка к просмотру
            </motion.p>
          </div>

          {/* Декоративные элементы */}
          <motion.div
            className="absolute bottom-10 left-10 w-20 h-20 border border-white/5 rounded-full"
            animate={{
              scale: [1, 1.2, 1],
              rotate: [0, 180, 360],
              opacity: [0.1, 0.2, 0.1]
            }}
            transition={{ duration: 8, repeat: Infinity, ease: "linear" }}
          />
          <motion.div
            className="absolute top-20 right-20 w-32 h-32 border border-white/5 rounded-full"
            animate={{
              scale: [1, 1.3, 1],
              rotate: [360, 180, 0],
              opacity: [0.1, 0.2, 0.1]
            }}
            transition={{ duration: 10, repeat: Infinity, ease: "linear" }}
          />
        </motion.div>
      )}
    </AnimatePresence>
  );
}