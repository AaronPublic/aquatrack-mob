/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./App.{js,jsx,ts,tsx}",
    "./src/**/*.{js,jsx,ts,tsx}",
    "./components/**/*.{js,jsx,ts,tsx}"
  ],
  presets: [require("nativewind/preset")],
  theme: {
    extend: {
      colors: {
        primary: "#001e66", // Navy Blue
        accent: "#00aeef",  // Brand Azure
        customBg: "#f1f5f9",
        customBorder: "#e2e8f0",
        textMuted: "#64748b"
      }
    },
  },
  plugins: [],
}
