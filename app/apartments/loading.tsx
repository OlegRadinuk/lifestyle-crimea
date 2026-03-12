'use client';

import { motion } from 'framer-motion';

export default function ApartmentsLoading() {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.4 }}
      className="fixed inset-0 z-[9999] flex items-center justify-center"
      style={{
        background: 'radial-gradient(circle at 30% 30%, #0B2A35, #051015)'
      }}
    >
      {/* Волны */}
      <motion.div
        className="absolute inset-0"
        style={{
          background: 'radial-gradient(circle at 50% 50%, #139AB6 0%, transparent 70%)'
        }}
        animate={{
          scale: [1, 1.2, 1],
          opacity: [0.15, 0.25, 0.15]
        }}
        transition={{
          duration: 3,
          repeat: Infinity,
          ease: "easeInOut"
        }}
      />

      {/* Логотип с пульсацией */}
      <motion.div
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{
          duration: 0.6,
          ease: [0.22, 1, 0.36, 1]
        }}
        className="relative z-10"
      >
        <motion.div
          animate={{
            scale: [1, 1.05, 1],
            opacity: [0.8, 1, 0.8]
          }}
          transition={{
            duration: 2,
            repeat: Infinity,
            ease: "easeInOut"
          }}
          className="w-24 h-24"
        >
          <img 
            src="/images/logo/logo-white.webp"
            alt=""
            className="w-full h-full object-contain"
          />
        </motion.div>
      </motion.div>

      {/* Декоративные круги */}
      <motion.div
        className="absolute bottom-[15%] left-[15%] w-32 h-32 border border-white/5 rounded-full"
        animate={{
          scale: [1, 1.3, 1],
          rotate: [0, 180, 360],
          opacity: [0.1, 0.2, 0.1]
        }}
        transition={{ duration: 8, repeat: Infinity, ease: "linear" }}
      />
      <motion.div
        className="absolute top-[20%] right-[20%] w-40 h-40 border border-white/5 rounded-full"
        animate={{
          scale: [1, 1.4, 1],
          rotate: [360, 180, 0],
          opacity: [0.1, 0.2, 0.1]
        }}
        transition={{ duration: 10, repeat: Infinity, ease: "linear" }}
      />
    </motion.div>
  );
}