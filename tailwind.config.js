/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./src/**/*.{html,ts}",
  ],
  theme: {
    extend: {
      fontFamily: {
        display: ['Space Grotesk', 'sans-serif'],
        sans: ['DM Sans', 'sans-serif'],
      },
      colors: {
        vault: {
          bg: '#0a0e17',
          elevated: '#111827',
          card: '#151d2e',
          'card-hover': '#1a2438',
          border: '#1f2937',
          fg: '#f1f5f9',
          muted: '#64748b',
          accent: '#06d6a0',
          'accent-dim': 'rgba(6, 214, 160, 0.15)',
          danger: '#ef4444',
          warning: '#f59e0b',
        }
      }
    },
  },
  plugins: [],
}