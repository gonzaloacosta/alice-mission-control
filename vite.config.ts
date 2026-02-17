import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

export default defineConfig({
  plugins: [react(), tailwindcss()],
  server: {
    host: '0.0.0.0',
    port: 4444,
    allowedHosts: ['app.gonzaloacosta.me'],
    proxy: {
      '/api': {
        target: 'http://localhost:4446',
        changeOrigin: true,
      },
      '/ws': {
        target: 'ws://localhost:4446',
        ws: true,
        changeOrigin: true,
      }
    }
  },
})
