/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        neonBlue: '#0bf4f3',
        neonGreen: '#39ff14',
        neonRed: '#ff073a'
      }
    },
  },
  plugins: [],
}
