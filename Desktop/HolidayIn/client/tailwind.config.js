// 

// tailwind.config.js
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}"
  ],
  safelist: [
    "text-red-600",
    "text-green-600",
    "text-amber-600",
    "hover:bg-red-100",
    "hover:bg-green-100",
    "hover:bg-yellow-100",
    "font-semibold",
    "text-right"
  ],
  theme: {
    extend: {},
  },
  plugins: [],
}
