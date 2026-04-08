/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './app/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        brand: {
          dark: '#0a0a0a',
          card: '#141414',
          border: '#2a2a2a',
          accent: '#e63946',
          gold: '#f4a261',
          text: '#f1faee',
          muted: '#8a8a8a',
        }
      }
    },
  },
  plugins: [],
}
