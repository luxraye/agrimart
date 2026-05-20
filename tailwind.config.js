/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./app/**/*.{js,jsx}",
    "./components/**/*.{js,jsx}",
    "./contexts/**/*.{js,jsx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        sans:  ["var(--font-dm-sans)", "ui-sans-serif", "system-ui", "sans-serif"],
        serif: ["var(--font-dm-serif)", "Georgia", "serif"],
      },
      colors: {
        brand: {
          50:  "#d8f3dc", 100: "#b7e4c7", 200: "#74c69d",
          400: "#52b788", 600: "#2d6a4f", 800: "#1b4332", 900: "#081c15",
          DEFAULT: "#2d6a4f",
        },
      },
    },
  },
  plugins: [],
  safelist: [
    "text-emerald-600","text-emerald-700","text-amber-600","text-amber-700","text-red-600","text-red-700",
    "bg-emerald-50","bg-amber-50","bg-red-50","bg-blue-50","bg-purple-50","bg-sky-50","bg-violet-50",
    "border-emerald-200","border-amber-200","border-red-200",
  ],
};
