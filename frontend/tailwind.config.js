/** @type {import('tailwindcss').Config} */
export default {
  darkMode: 'class',
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
        /* Colores de estado (panel docente) */
        statusOk: { DEFAULT: "var(--status-ok)", bg: "var(--status-ok-bg)" },
        statusWarn: { DEFAULT: "var(--status-warn)", bg: "var(--status-warn-bg)" },
        statusDanger: { DEFAULT: "var(--status-danger)", bg: "var(--status-danger-bg)" },
        /* Variables dinámicas para botones de la Vista Principal */
        btnAprender: {
          bg: "var(--btn-aprender-bg)",
          text: "var(--btn-aprender-text)",
          border: "var(--btn-aprender-border)",
        },
        btnHablar: {
          bg: "var(--btn-hablar-bg)",
          text: "var(--btn-hablar-text)",
          border: "var(--btn-hablar-border)",
        },
        btnColores: {
          bg: "var(--btn-colores-bg)",
          text: "var(--btn-colores-text)",
          border: "var(--btn-colores-border)",
        },
        btnLogros: {
          bg: "var(--btn-logros-bg)",
          text: "var(--btn-logros-text)",
          border: "var(--btn-logros-border)",
        },
      },
    },
  },
  plugins: [],
}