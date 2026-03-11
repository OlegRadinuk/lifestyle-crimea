'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { useEffect, useState } from 'react';

export function LoadingScreen() {
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => setIsLoading(false), 2500);
    return () => clearTimeout(timer);
  }, []);

  // Правильные варианты анимации для Framer Motion
  const letterVariants = {
    hidden: { opacity: 0, y: 50 },
    visible: { 
      opacity: 1, 
      y: 0,
      transition: {
        duration: 0.6,
        ease: [0.22, 1, 0.36, 1]
      }
    }
  };

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
          className="fixed inset-0 z-[9999] flex items-center justify-center loading-screen"
        >
          {/* Анимированные волны на фоне */}
          <motion.div
            className="absolute inset-0 opacity-20 loading-bg-wave"
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
              className="loading-logo"
            >
              <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                <path d="M4 8L4 4L8 4M16 4L20 4L20 8M20 16L20 20L16 20M8 20L4 20L4 16" strokeLinecap="round"/>
                <circle cx="12" cy="12" r="3" fill="currentColor" fillOpacity="0.2" stroke="currentColor"/>
              </svg>
            </motion.div>

            {/* Заголовок по буквам */}
            <div className="loading-title-container">
              {title.map((letter, index) => (
                <motion.span
                  key={index}
                  custom={index}
                  variants={letterVariants}
                  initial="hidden"
                  animate="visible"
                  transition={{ delay: index * 0.08 }}
                  className="loading-letter"
                >
                  {letter}
                </motion.span>
              ))}
            </div>

            {/* Подзаголовок по буквам */}
            <motion.div 
              className="loading-subtitle-container"
              initial={{ opacity: 0 }}
              animate={{ opacity: 0.8 }}
              transition={{ delay: 0.8, duration: 0.5 }}
            >
              {subtitle.map((letter, index) => (
                <motion.span
                  key={index}
                  className="loading-subtitle-letter"
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
            <div className="loading-dots">
              {[0, 1, 2].map((i) => (
                <motion.div
                  key={i}
                  className="loading-dot"
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
              className="loading-progress-container"
              initial={{ width: 0, opacity: 0 }}
              animate={{ width: "12rem", opacity: 1 }}
              transition={{ delay: 0.5, duration: 0.5 }}
            >
              <motion.div
                className="loading-progress-bar"
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
              className="loading-text"
              animate={{ opacity: [0.3, 0.8, 0.3] }}
              transition={{ duration: 2, repeat: Infinity }}
            >
              подготовка к просмотру
            </motion.p>
          </div>

          {/* Декоративные элементы */}
          <motion.div
            className="loading-decoration-circle loading-decoration-circle-1"
            animate={{
              scale: [1, 1.2, 1],
              rotate: [0, 180, 360],
              opacity: [0.1, 0.2, 0.1]
            }}
            transition={{ duration: 8, repeat: Infinity, ease: "linear" }}
          />
          <motion.div
            className="loading-decoration-circle loading-decoration-circle-2"
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