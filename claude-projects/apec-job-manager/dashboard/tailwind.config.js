/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        apec: {
          blue: '#0051A5',
          lightblue: '#00A3E0',
          orange: '#FF6B35',
          gray: '#F5F5F5'
        }
      }
    },
  },
  plugins: [],
}
