/** @type {import('tailwindcss').Config} */
module.exports = {
  // NOTE: Update this to include the paths to all files that contain Nativewind classes.
  content: ["./src/**/*.{js,jsx,ts,tsx}"],
  presets: [require("nativewind/preset")],
  theme: {
    extend: {
      colors: {
        bgDark: '#0B0F19',
        cardDark: '#1A1A2E',
        borderDark: '#27293D',
        orangeDark: '#EA6113',
        orangeMid: '#F88F22',
        yellowGold: '#FB8931',
        creamLight: '#FFE3B3',
        textSub: '#8A8F9E',
        tickInactive: '#1F2432',
      },
    },
  },
  plugins: [],
}