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
        display: ["var(--font-display)"],
      },
      colors: {
        /* Riel de navegación del panel docente */
        rail: {
          DEFAULT: "var(--rail-bg)",
          active: "var(--rail-active)",
          line: "var(--rail-line)",
          text: "var(--rail-text)",
          muted: "var(--rail-muted)",
          accent: "var(--rail-accent)",
        },

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
        aparecer: { from: { opacity: "0", transform: "translateY(18px) scale(0.96)" }, to: { opacity: "1", transform: "none" } },
        respirar: { "0%, 100%": { transform: "scale(1)" }, "50%": { transform: "scale(1.04)" } },
        pulso: { "0%": { boxShadow: "0 0 0 0 var(--accent)" }, "70%, 100%": { boxShadow: "0 0 0 14px transparent" } },
        saltito: { "0%, 100%": { transform: "translateY(0)" }, "30%": { transform: "translateY(-18px)" }, "60%": { transform: "translateY(0)" }, "75%": { transform: "translateY(-6px)" } },
        girar: { "0%, 100%": { transform: "rotate(0)" }, "25%": { transform: "rotate(-7deg)" }, "75%": { transform: "rotate(7deg)" } },
        pop: { "0%": { transform: "scale(0.5)" }, "70%": { transform: "scale(1.15)" }, "100%": { transform: "scale(1)" } },
        nube: { from: { transform: "translateX(0)" }, to: { transform: "translateX(70px)" } },
        caer: { "0%": { opacity: "1", transform: "translateY(-10vh) rotate(0)" }, "85%": { opacity: "1" }, "100%": { opacity: "0", transform: "translateY(105vh) rotate(360deg)" } },
        rotar: { from: { transform: "rotate(0)" }, to: { transform: "rotate(360deg)" } },
        respiracion: { "0%, 100%": { transform: "scale(0.85)", opacity: "0.8" }, "50%": { transform: "scale(1.15)", opacity: "1" } },
        flotar: { "0%, 100%": { transform: "translateY(0)" }, "50%": { transform: "translateY(-10px)" } },
      },
      animation: {
        fadeIn: "fadeIn 0.2s ease-out",
        flotar: "flotar 6s ease-in-out infinite",
        respiracion: "respiracion 8s ease-in-out infinite",
        rotar: "rotar 90s linear infinite",
        aparecer: "aparecer 0.5s ease-out backwards",
        respirar: "respirar 4.5s ease-in-out infinite",
        pulso: "pulso 2.4s ease-out infinite",
        saltito: "saltito 0.7s ease-out",
        girar: "girar 0.5s ease-in-out",
        pop: "pop 0.25s ease-out",
        nube: "nube 30s ease-in-out infinite alternate",
        caer: "caer 3.5s ease-in forwards",
      },
    },
  },
  plugins: [],
}
