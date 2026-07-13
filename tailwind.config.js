/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: "class",
  content: [
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        // Your custom colors
        "brand-green": "#666d41",
        "brand-yellow": "#ffce0f",
      },
    },
  },
  plugins: [],
};