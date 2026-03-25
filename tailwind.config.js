/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        accent: "#378ADD",
        "node-bg": "#1a1a1a",
        "node-border": "#2a2a2a",
        canvas: "#0a0a0a",
      },
    },
  },
  plugins: [],
};
