/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./src/**/*.{js,jsx,ts,tsx}"],
  presets: [require("nativewind/preset")],
  darkMode: "class",
  theme: {
    extend: {
      colors: {
        // ألوان موحدة للوضعين الفاتح والداكن (تستخدم عبر bg-appBg-light dark:bg-appBg-dark)
        appBg: {
          light: '#F8FAFC',
          dark: '#0D1117',
        },
        appCard: {
          light: '#FFFFFF',
          dark: '#161B22',
        },
        appBorder: {
          light: '#E2E8F0',
          dark: '#21262D',
        },
        appText: {
          light: '#0F172A',
          dark: '#F0F6FC',
        },
        appSubText: {
          light: '#64748B',
          dark: '#8B949E',
        },
      },
    },
  },
  plugins: [],
};