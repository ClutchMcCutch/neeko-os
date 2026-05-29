import type { Config } from 'tailwindcss';

export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Inter', 'ui-sans-serif', 'system-ui', 'sans-serif'],
      },
      colors: {
        ink: {
          950: '#08090d',
          900: '#0d1016',
          850: '#121620',
          800: '#171c27',
          700: '#222a37',
        },
        neeko: {
          mint: '#62d6ad',
          gold: '#e9bf72',
          rose: '#e48d8f',
          blue: '#7db7ff',
        },
      },
      boxShadow: {
        premium: '0 18px 70px rgba(0,0,0,0.35)',
      },
    },
  },
  plugins: [],
} satisfies Config;
