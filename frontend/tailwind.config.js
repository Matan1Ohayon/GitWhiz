/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,jsx}",
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        cyan: {
          light: '#7dd3fc',
          DEFAULT: '#38bdf8',
          dark: '#0ea5e9',
        },
        rose: {
          light: '#fda4af',
          DEFAULT: '#fb7185',
          dark: '#f43f5e',
        },
      },
      fontFamily: {
        syne: ['Syne', 'sans-serif'],
        sans: ['DM Sans', 'sans-serif'],
      },
    },
  },
  plugins: [],
}