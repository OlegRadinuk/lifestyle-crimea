'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { useEffect, useState } from 'react';

export function LoadingScreen() {
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Ждем загрузки всех ресурсов
    const timer = setTimeout(() => {
      setIsLoading(false);
    }, 2000);

    return () => clearTimeout(timer);
  }, []);

  return (
    <AnimatePresence mode="wait">
      {isLoading && (
        <motion.div
          initial={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
          className="fixed inset-0 z-[9999] flex items-center justify-center"
          style={{ background: 'linear-gradient(135deg, #0B1A24 0%, #1A3A45 100%)' }}
        >
          <div className="text-center">
            {/* Логотип или название */}
            <motion.h1
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.2 }}
              className="text-5xl font-light text-white mb-4"
              style={{ color: '#139AB6' }}
            >
              Стиль Жизни
            </motion.h1>
            
            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 0.8 }}
              transition={{ duration: 0.6, delay: 0.4 }}
              className="text-white/70 text-sm mb-8 tracking-widest uppercase"
            >
              Lifestyle · Luxury
            </motion.p>
            
            {/* Индикатор загрузки */}
            <motion.div
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ duration: 0.6, delay: 0.6 }}
              className="flex gap-3 justify-center"
            >
              <div 
                className="w-2 h-2 rounded-full bg-white/60 animate-pulse" 
                style={{ animationDelay: '0s', animationDuration: '1.2s' }} 
              />
              <div 
                className="w-2 h-2 rounded-full bg-white/80 animate-pulse" 
                style={{ animationDelay: '0.2s', animationDuration: '1.2s' }} 
              />
              <div 
                className="w-2 h-2 rounded-full bg-white animate-pulse" 
                style={{ animationDelay: '0.4s', animationDuration: '1.2s' }} 
              />
            </motion.div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}