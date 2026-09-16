/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx,ts,tsx}'],
  theme: {
    extend: {
      colors: {
        brand: {
          50:  '#f5f3ff',
          100: '#ede9fe',
          200: '#ddd6fe',
          300: '#c4b5fd',
          400: '#a78bfa',
          500: '#8b5cf6',
          600: '#7c3aed',
          700: '#6d28d9',
          800: '#5b21b6',
          900: '#4c1d95',
        },
      },
      fontFamily: {
        sans: ['Inter', 'ui-sans-serif', 'system-ui'],
      },
      backgroundImage: {
        'gradient-brand': 'linear-gradient(135deg, #6d28d9 0%, #4f46e5 100%)',
        'gradient-card':  'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
        'gradient-hero':  'linear-gradient(135deg, #0f172a 0%, #1e1b4b 50%, #312e81 100%)',
      },
      boxShadow: {
        'card':    '0 1px 3px 0 rgb(0 0 0 / .06), 0 1px 2px -1px rgb(0 0 0 / .06)',
        'card-md': '0 4px 16px -2px rgb(0 0 0 / .08), 0 2px 4px -2px rgb(0 0 0 / .05)',
        'card-lg': '0 10px 40px -4px rgb(0 0 0 / .1),  0 4px 8px -4px rgb(0 0 0 / .06)',
        'glow':    '0 0 20px rgba(124, 58, 237, .35)',
        'glow-sm': '0 0 10px rgba(124, 58, 237, .2)',
      },
      animation: {
        'fade-in':    'fadeIn .4s ease-out',
        'slide-up':   'slideUp .4s ease-out',
        'slide-in':   'slideIn .3s ease-out',
        'pulse-slow': 'pulse 3s ease-in-out infinite',
        'bounce-sm':  'bounceSm .6s ease-in-out',
      },
      keyframes: {
        fadeIn:   { from: { opacity: '0' },                    to: { opacity: '1' } },
        slideUp:  { from: { opacity: '0', transform: 'translateY(16px)' }, to: { opacity: '1', transform: 'translateY(0)' } },
        slideIn:  { from: { opacity: '0', transform: 'translateX(-10px)' }, to: { opacity: '1', transform: 'translateX(0)' } },
        bounceSm: { '0%,100%': { transform: 'translateY(0)' }, '50%': { transform: 'translateY(-4px)' } },
      },
    },
  },
  plugins: [],
};
