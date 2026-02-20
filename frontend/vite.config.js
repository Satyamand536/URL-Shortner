import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    strictPort: true,
    host: true, // Listen on all network interfaces (e.g. 192.168.x.x)
    proxy: {
      '/api': {
        target: 'http://localhost:8001',
        changeOrigin: true,
        secure: false,
      },
      '/s/': {
        target: 'http://localhost:8001',
        changeOrigin: true,
        secure: false,
      },
    },
  },
})
