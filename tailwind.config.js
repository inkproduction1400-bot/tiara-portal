/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./pages/**/*.{ts,tsx}",
    "./app/**/*.{ts,tsx}",
    "./components/**/*.{ts,tsx}",
    "./content/docs/**/*.{md,mdx,md}"
  ],
  theme: {
    extend: {
      colors: { ink: "#111827", accent: "#2563eb", zincbg: "#f7f9fb" },
      boxShadow: { soft: "0 8px 30px rgba(0,0,0,.06)" },
      borderRadius: { xl2: "1rem" }
    },
  },
  plugins: [require("@tailwindcss/typography")],
};
/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./app/**/*.{ts,tsx}', './pages/**/*.{ts,tsx}', './components/**/*.{ts,tsx}', './content/docs/**/*.{md,mdx}'],
  theme: { extend: {} },
  plugins: [require('@tailwindcss/typography')],
};
