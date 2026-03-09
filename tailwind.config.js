/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './app/**/*.{js,ts,jsx,tsx}',
    './components/**/*.{js,ts,jsx,tsx}',
  ],
  theme: {
    extend: {
      colors: {
        tealPremium: '#139AB6',
      },

      /* =========================
         Shadows (soft, premium)
      ========================= */
      boxShadow: {
        premium: '0 20px 60px rgba(0, 0, 0, 0.25)',
        glow: '0 0 20px rgba(19, 154, 182, 0.35)',
      },

      /* =========================
         Transitions (calm)
      ========================= */
      transitionTimingFunction: {
        calm: 'cubic-bezier(0.4, 0.0, 0.2, 1)',
      },
      transitionDuration: {
        calm: '300ms',
        slow: '500ms',
      },

      /* =========================
         NEW: Animation Keyframes
      ========================= */
      keyframes: {
        fadeUp: {
          from: { opacity: '0', transform: 'translateY(20px)' },
          to: { opacity: '1', transform: 'translateY(0)' },
        },
        fadeIn: {
          from: { opacity: '0' },
          to: { opacity: '1' },
        },
        letterIn: {
          from: { opacity: '0', transform: 'translateY(4px)' },
          to: { opacity: '1', transform: 'translateY(0)' },
        },
        loaderPulse: {
          '0%, 80%, 100%': { opacity: '0.3' },
          '40%': { opacity: '1' },
        },
        calendarFade: {
          from: { opacity: '0', transform: 'translateY(-6px)' },
          to: { opacity: '1', transform: 'translateY(0)' },
        },
        glint: {
          '0%, 100%': { transform: 'translateX(-120%) rotate(12deg)', opacity: '0' },
          '25%': { opacity: '1' },
          '65%': { transform: 'translateX(260%) rotate(12deg)', opacity: '0' },
        },
      },

      /* =========================
         NEW: Animations
      ========================= */
      animation: {
        'fade-up': 'fadeUp 0.8s ease forwards',
        'fade-in': 'fadeIn 0.6s ease forwards',
        'letter-in': 'letterIn 0.4s ease forwards',
        'loader-pulse': 'loaderPulse 1.4s ease-in-out infinite',
        'calendar-fade': 'calendarFade 0.15s ease-out',
        'glint': 'glint 5s cubic-bezier(0.4, 0, 0.2, 1) infinite',
        'pulse-slow': 'pulse 3s infinite',
      },

      /* =========================
         NEW: Z-index scale
      ========================= */
      zIndex: {
        '1': '1',
        '2': '2',
        '3': '3',
        'header': '50',
        'burger': '9999',
        'modal': '2000',
        'modal-overlay': '2001',
      },

      /* =========================
         NEW: Font sizes with clamp
      ========================= */
      fontSize: {
        'responsive-xs': 'clamp(10px, 2vw, 12px)',
        'responsive-sm': 'clamp(12px, 2.5vw, 14px)',
        'responsive-base': 'clamp(14px, 3vw, 16px)',
        'responsive-lg': 'clamp(16px, 4vw, 18px)',
        'responsive-xl': 'clamp(18px, 5vw, 20px)',
        'responsive-2xl': 'clamp(20px, 6vw, 24px)',
        'responsive-3xl': 'clamp(24px, 7vw, 32px)',
        'responsive-4xl': 'clamp(28px, 8vw, 42px)',
        'responsive-5xl': 'clamp(32px, 10vw, 72px)',
      },

      /* =========================
         NEW: Spacing scale
      ========================= */
      spacing: {
        'section-sm': 'clamp(2rem, 5vh, 4rem)',
        'section-md': 'clamp(3rem, 8vh, 6rem)',
        'section-lg': 'clamp(4rem, 10vh, 8rem)',
      },
    },
  },
  plugins: [],
}