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
        premium:
          '0 20px 60px rgba(0, 0, 0, 0.25)',
        glow:
          '0 0 20px rgba(19, 154, 182, 0.35)',
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
    },
  },
  plugins: [],
}
