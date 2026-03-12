'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { useEffect, useState } from 'react';

export default function ApartmentDetailLoading() {
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => setIsLoading(false), 2000);
    return () => clearTimeout(timer);
  }, []);

  const title = "Загружаем апартамент".split("");

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
          {/* Анимированные волны */}
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

          <div className="relative z-10 text-center">
            {/* Логотип */}
            <motion.div
              initial={{ scale: 0, rotate: -180 }}
              animate={{ scale: 1, rotate: 0 }}
              transition={{ 
                duration: 0.8, 
                ease: [0.22, 1, 0.36, 1],
                delay: 0.2
              }}
              className="w-24 h-24 mx-auto mb-8"
            >
              <img 
                src="/images/logo/logo-white.webp"
                alt="Life Style Crimea"
                className="w-full h-full object-contain"
              />
            </motion.div>

            {/* Заголовок по буквам */}
            <div className="mb-4 flex justify-center flex-wrap max-w-2xl px-4">
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
                  className="text-3xl md:text-4xl font-light inline-block text-white"
                  style={{ 
                    textShadow: '0 0 20px rgba(19,154,182,0.5)',
                    marginRight: letter === ' ' ? '0.3em' : '0.05em'
                  }}
                >
                  {letter}
                </motion.span>
              ))}
            </div>

            {/* Подзаголовок */}
            <motion.p
              className="text-white/60 mb-12 text-sm md:text-base"
              initial={{ opacity: 0 }}
              animate={{ opacity: 0.8 }}
              transition={{ delay: 0.8, duration: 0.5 }}
            >
              Готовим для вас лучший номер
            </motion.p>

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
                  duration: 1.5,
                  delay: 0.8,
                  ease: "easeInOut"
                }}
              />
            </motion.div>

            {/* Текст загрузки */}
            <motion.p
              className="text-white/40 text-xs mt-4 tracking-[0.3em] uppercase"
              animate={{ opacity: [0.3, 0.8, 0.3] }}
              transition={{ duration: 2, repeat: Infinity }}
            >
              Раскладываем полотенца
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