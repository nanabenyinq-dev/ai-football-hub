/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        bg: '#080b0e',
        bg2: '#0e1318',
        bg3: '#141a21',
        card: '#151c25',
        card2: '#1a2330',
        green: { DEFAULT: '#00e87a', dim: '#00e87a18', glow: '#00e87a35' },
        gold: { DEFAULT: '#f5c518', dim: '#f5c51815' },
        red: { DEFAULT: '#ff3b5c', dim: '#ff3b5c15' },
        blue: { DEFAULT: '#4facfe', dim: '#4facfe15' },
      },
      fontFamily: {
        sans: ['-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'sans-serif'],
        mono: ['monospace'],
      },
      animation: {
        'pulse-fire': 'pulse-fire 1.5s ease-in-out infinite',
        'shimmer': 'shimmer 3s ease-in-out infinite',
        'live-pulse': 'live-pulse 1s ease-in-out infinite',
        'badge-pop': 'badge-pop 2s ease-in-out infinite',
        'ticker': 'ticker 25s linear infinite',
      },
      keyframes: {
        'pulse-fire': { '0%,100%': { transform: 'scale(1)' }, '50%': { transform: 'scale(1.2)' } },
        'shimmer': { '0%': { left: '-100%' }, '100%': { left: '200%' } },
        'live-pulse': { '0%,100%': { opacity: '1' }, '50%': { opacity: '0.7' } },
        'badge-pop': { '0%,100%': { transform: 'scale(1)' }, '50%': { transform: 'scale(1.04)' } },
        'ticker': { '0%': { transform: 'translateX(0)' }, '100%': { transform: 'translateX(-50%)' } },
      }
    }
  },
  plugins: []
}
