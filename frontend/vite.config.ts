import react from '@vitejs/plugin-react'
import { existsSync } from 'node:fs'
import { fileURLToPath, URL } from 'node:url'
import { defineConfig } from 'vitest/config'

// La API de Laravel y los audios que genera se piden al mismo origen que la web (sin CORS).
// Dentro de Docker Vite la alcanza por el servicio «nginx»; fuera, por el puerto publicado. VITE_API_PROXY lo cambia.
const destinoApi = process.env.VITE_API_PROXY ?? (existsSync('/.dockerenv') ? 'http://nginx' : 'http://localhost:8000')
const haciaLaApi = { target: destinoApi, changeOrigin: true }

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  test: { environment: 'jsdom', setupFiles: ['./src/test/setup.ts'], include: ['src/**/*.test.{ts,tsx}'] },
  // En Docker sobre Windows los cambios de archivos no llegan al contenedor: se revisan por intervalos.
  server: {
    watch: { usePolling: process.env.VITE_USE_POLLING === 'true' },
    proxy: { '/api': haciaLaApi, '/audio-generado': haciaLaApi },
  },
  resolve: {
    alias: { '@': fileURLToPath(new URL('./src', import.meta.url)) },
  },
})
