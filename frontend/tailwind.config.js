/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: 'class',
  content: ['./src/**/*.{html,ts}'],
  theme: {
    extend: {
      colors: {
        primary: {
          50:  '#eef2ff',
          100: '#dbeafe',
          200: '#bfdbfe',
          300: '#93c5fd',
          400: '#60a5fa',
          500: '#1f3a5f',   // Brand primary
          600: '#1e3a8a',
          700: '#1d4ed8',
          800: '#1e40af',
          900: '#1e3a8a',
          950: '#0f1f3d',
        },
        accent: {
          DEFAULT: '#1f7a6b',
          light:   '#2dd4bf',
          subtle:  '#f0fdf9',
          dark:    '#134e4a',
        },
        surface: {
          light: '#f8fafc',   // slate-50
          dark:  '#0f172a',   // slate-950
        },
      },
      fontFamily: {
        inter:   ['Inter', 'sans-serif'],
        manrope: ['Manrope', 'sans-serif'],
        outfit:  ['Outfit', 'sans-serif'],
      },
      boxShadow: {
        'card':       '0 2px 12px rgba(0, 0, 0, 0.06)',
        'card-hover': '0 8px 40px rgba(31, 58, 95, 0.12)',
        'card-dark':  '0 4px 24px rgba(0, 0, 0, 0.30)',
        'glass':      '0 4px 24px rgba(0, 0, 0, 0.06), inset 0 1px 0 rgba(255,255,255,0.5)',
        'modal':      '0 25px 60px rgba(0, 0, 0, 0.15)',
      },
      backdropBlur: {
        xs: '2px',
      },
      animation: {
        'fade-in':     'fade-in 0.5s cubic-bezier(0.16, 1, 0.3, 1) both',
        'slide-up':    'slide-up 0.5s cubic-bezier(0.16, 1, 0.3, 1) both',
        'slide-right': 'slide-in-right 0.4s cubic-bezier(0.16, 1, 0.3, 1) both',
        'pulse-soft':  'pulse-soft 2s ease-in-out infinite',
      },
      keyframes: {
        'fade-in': {
          from: { opacity: '0', transform: 'translateY(8px)' },
          to:   { opacity: '1', transform: 'translateY(0)' },
        },
        'slide-up': {
          from: { opacity: '0', transform: 'translateY(20px)' },
          to:   { opacity: '1', transform: 'translateY(0)' },
        },
        'slide-in-right': {
          from: { opacity: '0', transform: 'translateX(20px)' },
          to:   { opacity: '1', transform: 'translateX(0)' },
        },
        'pulse-soft': {
          '0%, 100%': { opacity: '1' },
          '50%':      { opacity: '0.6' },
        },
      },
    },
  },
  plugins: [],
};
