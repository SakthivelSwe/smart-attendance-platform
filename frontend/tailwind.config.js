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
          50: '#eef4ff',
          100: '#d9e5ff',
          200: '#bcd2ff',
          300: '#8eb4ff',
          400: '#5989ff',
          500: '#3363fc',
          600: '#1d43f1',
          700: '#1530de',
          800: '#1829b4',
          900: '#19288e',
          950: '#141a56',
        },
        accent: {
          50: '#fff8ed',
          100: '#ffeed4',
          200: '#ffd9a8',
          300: '#ffbe71',
          400: '#ff9838',
          500: '#fe7a11',
          600: '#ef5f07',
          700: '#c64608',
          800: '#9d380f',
          900: '#7e3010',
          950: '#441506',
        },
        surface: {
          50: '#f8fafc',
          100: '#f1f5f9',
          200: '#e2e8f0',
          300: '#cbd5e1',
          400: '#94a3b8',
          500: '#64748b',
          600: '#475569',
          700: '#334155',
          800: '#1e293b',
          850: '#172033',
          900: '#0f172a',
          950: '#020617',
        },
      },
      fontFamily: {
        sans: ['"Plus Jakarta Sans"', 'system-ui', 'sans-serif'],
        display: ['"Plus Jakarta Sans"', 'system-ui', 'sans-serif'],
        body: ['"DM Sans"', 'system-ui', 'sans-serif'],
      },
      animation: {
        'fade-in': 'fadeIn 0.5s cubic-bezier(0.16, 1, 0.3, 1) forwards',
        'slide-up': 'slideUp 0.5s cubic-bezier(0.16, 1, 0.3, 1) forwards',
        'slide-down': 'slideDown 0.4s cubic-bezier(0.16, 1, 0.3, 1) forwards',
        'slide-in-right': 'slideInRight 0.4s cubic-bezier(0.16, 1, 0.3, 1) forwards',
        'slide-in-left': 'slideInLeft 0.35s cubic-bezier(0.16, 1, 0.3, 1) forwards',
        'scale-in': 'scaleIn 0.35s cubic-bezier(0.16, 1, 0.3, 1) forwards',
        'pulse-slow': 'pulse 4s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'float': 'float 6s ease-in-out infinite',
        'shimmer': 'shimmer 2s linear infinite',
        'glow-pulse': 'glowPulse 2s ease-in-out infinite',
        'spin-slow': 'spin 3s linear infinite',
        'bounce-subtle': 'bounceSubtle 2s ease-in-out infinite',
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        slideUp: {
          '0%': { opacity: '0', transform: 'translateY(16px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        slideDown: {
          '0%': { opacity: '0', transform: 'translateY(-12px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        slideInRight: {
          '0%': { opacity: '0', transform: 'translateX(20px)' },
          '100%': { opacity: '1', transform: 'translateX(0)' },
        },
        slideInLeft: {
          '0%': { opacity: '0', transform: 'translateX(-20px)' },
          '100%': { opacity: '1', transform: 'translateX(0)' },
        },
        scaleIn: {
          '0%': { opacity: '0', transform: 'scale(0.95)' },
          '100%': { opacity: '1', transform: 'scale(1)' },
        },
        float: {
          '0%, 100%': { transform: 'translateY(0px)' },
          '50%': { transform: 'translateY(-8px)' },
        },
        shimmer: {
          'from': { backgroundPosition: '200% 0' },
          'to': { backgroundPosition: '-200% 0' }
        },
        glowPulse: {
          '0%, 100%': { opacity: '0.4' },
          '50%': { opacity: '1' },
        },
        bounceSubtle: {
          '0%, 100%': { transform: 'translateY(0)' },
          '50%': { transform: 'translateY(-4px)' },
        },
      },
      boxShadow: {
        'glass': '0 8px 32px rgba(0, 0, 0, 0.08)',
        'glass-dark': '0 8px 32px rgba(0, 0, 0, 0.32)',
        'card': '0 1px 3px rgba(0, 0, 0, 0.04), 0 1px 2px rgba(0, 0, 0, 0.02)',
        'card-hover': '0 20px 40px -12px rgba(0, 0, 0, 0.12)',
        'elevated': '0 12px 40px -8px rgba(0, 0, 0, 0.1), 0 4px 12px -2px rgba(0, 0, 0, 0.04)',
        'glow-primary': '0 0 20px rgba(29, 67, 241, 0.15)',
        'glow-accent': '0 0 20px rgba(254, 122, 17, 0.15)',
        'inner-glow': 'inset 0 1px 0 rgba(255, 255, 255, 0.05)',
        'premium': '0 1px 2px rgba(0, 0, 0, 0.04), 0 4px 16px rgba(0, 0, 0, 0.06), 0 12px 40px rgba(0, 0, 0, 0.04)',
      },
      backgroundImage: {
        'gradient-radial': 'radial-gradient(var(--tw-gradient-stops))',
        'gradient-mesh': 'radial-gradient(at 40% 20%, hsla(228, 98%, 56%, 0.08) 0px, transparent 50%), radial-gradient(at 80% 0%, hsla(189, 100%, 56%, 0.06) 0px, transparent 50%), radial-gradient(at 0% 50%, hsla(355, 100%, 93%, 0.05) 0px, transparent 50%)',
        'gradient-mesh-dark': 'radial-gradient(at 40% 20%, hsla(228, 98%, 56%, 0.12) 0px, transparent 50%), radial-gradient(at 80% 0%, hsla(189, 100%, 56%, 0.08) 0px, transparent 50%), radial-gradient(at 0% 50%, hsla(355, 100%, 93%, 0.04) 0px, transparent 50%)',
        'dot-pattern': 'radial-gradient(circle, currentColor 1px, transparent 1px)',
      },
      backgroundSize: {
        'dot-sm': '24px 24px',
        'dot-md': '32px 32px',
      },
      borderRadius: {
        '4xl': '2rem',
      },
      transitionTimingFunction: {
        'spring': 'cubic-bezier(0.16, 1, 0.3, 1)',
      }
    },
  },
  plugins: [],
}
