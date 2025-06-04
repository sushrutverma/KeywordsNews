/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        primary: {
          DEFAULT: 'var(--primary)',
          dark: 'var(--primary-dark)',
        },
        surface: {
          DEFAULT: 'var(--surface)',
          dark: 'var(--surface-dark)',
        },
      },
      fontFamily: {
        playfair: ['Playfair Display', 'serif'],
        'source-serif': ['Source Serif 4', 'serif'],
        unifraktur: ['UnifrakturCook', 'cursive'],
      },
      spacing: {
        'safe-bottom': 'var(--safe-area-inset-bottom)',
      },
      screens: {
        'xs': '375px',
      },
      height: {
        screen: ['100vh /* fallback */', '100dvh'],
      },
      minHeight: {
        screen: ['100vh /* fallback */', '100dvh'],
      },
      maxHeight: {
        screen: ['100vh /* fallback */', '100dvh'],
      },
      animation: {
        'ripple': 'ripple 0.6s linear',
      },
      keyframes: {
        ripple: {
          '0%': { transform: 'scale(0)', opacity: 1 },
          '100%': { transform: 'scale(4)', opacity: 0 },
        },
      },
    },
  },
  plugins: [],
};