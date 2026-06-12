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
        sans:  ["var(--font-sans)", "ui-sans-serif", "system-ui", "sans-serif"],
        serif: ["var(--font-serif)", "Georgia", "serif"],
      },
      colors: {
        paper: "#f6f5f1",
        ink: "#16241c",
        brand: {
          50:  "#eef6f0",
          100: "#d9ecdf",
          200: "#b3d9c0",
          300: "#84bf9b",
          400: "#56a378",
          500: "#35885c",
          600: "#256b48",
          700: "#1d5639",
          800: "#17452e",
          900: "#113524",
          950: "#0a2117",
          DEFAULT: "#256b48",
        },
        gold: {
          50: "#fdf8ec",
          100: "#f9eccd",
          300: "#eed18a",
          500: "#dfae4f",
          600: "#c98f2e",
          700: "#a87124",
        },
        clay: {
          50: "#fcf0ee",
          100: "#f7dad5",
          500: "#c1442e",
          600: "#a73a27",
          700: "#8b3021",
        },
      },
      boxShadow: {
        card: "0 1px 2px rgba(22,36,28,0.04), 0 4px 16px rgba(22,36,28,0.05)",
        lift: "0 2px 4px rgba(22,36,28,0.06), 0 12px 32px rgba(22,36,28,0.10)",
        nav: "0 1px 0 rgba(22,36,28,0.06), 0 8px 24px rgba(22,36,28,0.04)",
      },
      borderRadius: {
        xl2: "1.25rem",
      },
      keyframes: {
        "fade-up": {
          from: { opacity: "0", transform: "translateY(8px)" },
          to: { opacity: "1", transform: "translateY(0)" },
        },
        shimmer: {
          "100%": { transform: "translateX(100%)" },
        },
        "pulse-dot": {
          "0%, 100%": { opacity: "1" },
          "50%": { opacity: "0.35" },
        },
      },
      animation: {
        "fade-up": "fade-up 0.45s cubic-bezier(0.21, 0.6, 0.35, 1) both",
        "pulse-dot": "pulse-dot 2s ease-in-out infinite",
      },
    },
  },
  plugins: [],
  safelist: [
    "text-emerald-700", "text-amber-700", "text-red-700",
    "bg-emerald-50", "bg-amber-50", "bg-red-50",
    "border-emerald-200", "border-amber-200", "border-red-200",
    "bg-emerald-500", "bg-amber-500", "bg-red-500",
  ],
};
