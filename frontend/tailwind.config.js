/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        beach: {
          canvas: "#F7F5F0",
          panel: "#EFECE6",
          active: "#E5E0D6",
          inset: "#DFD9CD",
          border: "#D8D2C4",
          borderDark: "#B5AD9E",
          sage: "#7B9080",
          sageHover: "#6B8070",
          clay: "#C89585",
          clayHover: "#B58273",
          slate: "#5C6B73",
          charred: "#2C3330",
          pebble: "#58635D",
          mist: "#8E9A92",
        },
      },
    },
  },
  plugins: [],
}
