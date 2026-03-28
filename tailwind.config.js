/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./app/**/*.{js,jsx}', './components/**/*.{js,jsx}'],
  theme: {
    extend: {
      fontFamily: { sans: ['DM Sans', 'sans-serif'] },
      colors: {
        sidebar: '#1E1B4B',
        primary: '#7C3AED',
        sky: '#0EA5E9',
      }
    }
  },
  plugins: []
}
