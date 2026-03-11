/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/**/*.{html,ts}",
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        primary: {
          50: '#f0f6fc',
          100: '#e1edf8',
          200: '#bedcf1',
          300: '#8abce6',
          400: '#529ad7',
          500: '#307dc5',
          600: '#2162a5',
          700: '#1a4e86',
          800: '#174370',
          900: '#1f3a5f', // Deep Navy Blue (Primary Brand)
          950: '#102540',
        },
        accent: {
          50: '#f1fcf9',
          100: '#cef9ef',
          200: '#9ef1e0',
          300: '#65e3cd',
          400: '#37ccb4',
          500: '#1fb09b',
          600: '#168d7e',
          700: '#157166',
          800: '#145a52',
          900: '#1f7a6b', // Teal (Accent)
          950: '#07302d',
        },
        surface: {
          50: '#f8fafc', // App Background
          100: '#f1f5f9',
          200: '#e2e8f0', // Border Focus
          300: '#cbd5e1',
          400: '#94a3b8',
          500: '#64748b',
          600: '#475569',
          700: '#334155',
          800: '#1e293b',
          900: '#0f172a', // Primary Text
          950: '#ffffff', // Card Background
        }
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
        secondary: ['Manrope', 'system-ui', 'sans-serif'],
      },
      animation: {
        'fade-in': 'fadeIn 0.6s cubic-bezier(0.16, 1, 0.3, 1)',
        'slide-up': 'slideUp 0.6s cubic-bezier(0.16, 1, 0.3, 1)',
        'slide-in-right': 'slideInRight 0.4s ease-out',
        'pulse-slow': 'pulse 4s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'float': 'float 6s ease-in-out infinite',
        'shimmer': 'shimmer 2s linear infinite',
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        slideUp: {
          '0%': { opacity: '0', transform: 'translateY(20px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        slideInRight: {
          '0%': { opacity: '0', transform: 'translateX(20px)' },
          '100%': { opacity: '1', transform: 'translateX(0)' },
        },
        float: {
          '0%, 100%': { transform: 'translateY(0px)' },
          '50%': { transform: 'translateY(-10px)' },
        },
        shimmer: {
          'from': { backgroundPosition: '0 0' },
          'to': { backgroundPosition: '-200% 0' }
        }
      },
      boxShadow: {
        'glass': '0 8px 32px 0 rgba(31, 38, 135, 0.15)',
        'card': '0 2px 8px -1px rgba(0, 0, 0, 0.05), 0 4px 6px -1px rgba(0, 0, 0, 0.01)',
        'card-hover': '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)',
        'glow': '0 0 15px rgba(124, 58, 237, 0.3)',
      },
      backgroundImage: {
        'gradient-radial': 'radial-gradient(var(--tw-gradient-stops))',
      }
    },
  },
  plugins: [],
}
