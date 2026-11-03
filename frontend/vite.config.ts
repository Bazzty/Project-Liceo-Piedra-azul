import react from '@vitejs/plugin-react'
import { fileURLToPath, URL } from 'node:url'
import { defineConfig } from 'vitest/config'

// La API de Laravel y los audios que genera se piden al mismo origen que la web (sin CORS).
// Por defecto, el puerto publicado por Docker; docker-compose.yml fija VITE_API_PROXY=http://nginx para Vite dentro de la red.
const destinoApi = process.env.VITE_API_PROXY ?? 'http://localhost:8000'
const haciaLaApi = { target: destinoApi, changeOrigin: true }
const proxy = { '/api': haciaLaApi, '/audio-generado': haciaLaApi }

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  test: { environment: 'jsdom', setupFiles: ['./src/test/setup.ts'], include: ['src/**/*.test.{ts,tsx}'] },
  // En Docker sobre Windows los cambios de archivos no llegan al contenedor: se revisan por intervalos.
  server: {
    watch: { usePolling: process.env.VITE_USE_POLLING === 'true' },
    proxy,
  },
  // `npm run preview` (la PWA compilada) también necesita llegar a la API.
  preview: { proxy },
  resolve: {
    alias: { '@': fileURLToPath(new URL('./src', import.meta.url)) },
  },
})
