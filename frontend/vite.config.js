import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      '/api': {
        target: 'https://vocal-aurel-matan-179c5675.koyeb.app',
        changeOrigin: true,
      },
    },
  },
})
