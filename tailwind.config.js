/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './app/**/*.{js,ts,jsx,tsx}',
    './components/**/*.{js,ts,jsx,tsx}',
  ],
  theme: {
    extend: {
      fontFamily: {
        montserrat: ['var(--font-montserrat)', 'sans-serif'],
      },
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
         Animation Keyframes
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
         Animations
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
         Z-index scale
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
    },
  },
  plugins: [],
}