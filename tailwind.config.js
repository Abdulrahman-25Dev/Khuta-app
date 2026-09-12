/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./src/**/*.{js,jsx,ts,tsx}"],
  presets: [require("nativewind/preset")],
  darkMode: "class", // تمكين التبديل بين الوضعين الفاتح والداكن
  theme: {
    extend: {
      colors: {
        // الألوان الديناميكية للوضعين الداكن والفاتح
        appBg: 'var(--color-bg)',
        appCard: 'var(--color-card)',
        appBorder: 'var(--color-border)',
        appText: 'var(--color-text)',
        appSubText: 'var(--color-subtext)',
        
        // ألوان الثيمات المخصصة (Sunset, Forest, Ocean, Violet, Maroon)
        primary: 'var(--color-primary)',
        secondary: 'var(--color-secondary)',
        accentLight: 'var(--color-text-light)',

        // الألوان الثابتة السابقة لثيم الغروب (إذا احتجتها في أماكن خاصة)
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