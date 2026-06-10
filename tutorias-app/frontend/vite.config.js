// vite.config.js
// Vite es el bundler/dev-server que reemplaza a webpack.
// Es mucho más rápido porque usa ES modules nativos.

import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  // El proxy redirige /api al backend para evitar problemas de CORS en desarrollo.
  // Cuando el frontend hace axios.get('/api/turnos'), Vite lo redirige a localhost:3001/api/turnos.
  // Esto solo funciona en desarrollo — en producción hay que configurar el servidor real.
  server: {
    port: 5173,
    proxy: {
      '/api': {
        target: 'http://localhost:3001',
        changeOrigin: true
      }
    }
  }
})
