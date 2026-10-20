/** @type {import('tailwindcss').Config} */

// Genera { bg, text, border } para un botón de la vista principal.
const botonVista = (nombre) => ({
  bg: `var(--btn-${nombre}-bg)`,
  text: `var(--btn-${nombre}-text)`,
  border: `var(--btn-${nombre}-border)`,
});

// Genera { DEFAULT, bg } para un estado semántico.
const estado = (nombre) => ({
  DEFAULT: `var(--status-${nombre})`,
  bg: `var(--status-${nombre}-bg)`,
});

export default {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      fontFamily: {
        sans: ["var(--font-body)"],
      },
      colors: {
        /* Superficies y texto */
        app: "var(--bg-app)",
        surface: "var(--bg-card)",
        primary: "var(--text-primary)",
        secondary: "var(--text-secondary)",
        borderCustom: "var(--border-color)",
        borderStrong: "var(--border-strong)",

        /* Marca y acento */
        brand: { DEFAULT: "var(--brand-primary)", hover: "var(--brand-hover)" },
        onBrand: "var(--on-brand)",
        accent: { DEFAULT: "var(--accent)", hover: "var(--accent-hover)" },
        onAccent: "var(--on-accent)",

        /* Estados semánticos */
        statusOk: estado("ok"),
        statusWarn: estado("warn"),
        statusDanger: estado("danger"),
        statusInfo: estado("info"),
        onStatus: "var(--on-status)",

        /* Botones de la vista principal */
        btnAprender: botonVista("aprender"),
        btnHablar: botonVista("hablar"),
        btnColores: botonVista("colores"),
        btnLogros: botonVista("logros"),
      },
      borderRadius: {
        control: "var(--radius-control)",
        card: "var(--radius-card)",
      },
      boxShadow: {
        card: "var(--shadow-card)",
      },
      backgroundColor: {
        overlay: "var(--overlay)",
      },
      keyframes: {
        fadeIn: { from: { opacity: "0" }, to: { opacity: "1" } },
      },
      animation: {
        fadeIn: "fadeIn 0.2s ease-out",
      },
    },
  },
  plugins: [],
}
