/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./app/**/*.{js,jsx,ts,tsx}",
    "./src/**/*.{js,jsx,ts,tsx}",
  ],
  presets: [require("nativewind/preset")],
  // ← THIS is the key fix
  darkMode: "class",
  theme: {
    extend: {
      colors: {
        primary: {
          DEFAULT: "#1E3A8A",
          50:      "#EFF6FF",
          100:     "#DBEAFE",
          200:     "#BFDBFE",
          500:     "#3B82F6",
          600:     "#2563EB",
          700:     "#1D4ED8",
          900:     "#1E3A8A",
        },
        accent: {
          DEFAULT: "#06B6D4",
          light:   "#CFFAFE",
          dark:    "#0891B2",
        },
        background:    "#F8FAFC",
        surface:       "#FFFFFF",
        textPrimary:   "#0F172A",
        textSecondary: "#64748B",
        border:        "#E2E8F0",
        error:         "#EF4444",
        success:       "#10B981",
        warning:       "#F59E0B",
      },
    },
  },
  plugins: [],
};