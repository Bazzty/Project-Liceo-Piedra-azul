/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      colors: {
        app: "var(--bg-app)",
        surface: "var(--bg-card)",
        primary: "var(--text-primary)",
        secondary: "var(--text-secondary)",
        brand: {
          DEFAULT: "var(--brand-primary)",
          hover: "var(--brand-hover)",
        },
        borderCustom: "var(--border-color)",
      },
    },
  },
  plugins: [],
}
