import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

export default defineConfig({
  plugins: [
    react(),
    tailwindcss()
  ],

  server: {
    port: 5173,
    open: true
  },

  build: {
    sourcemap: true,
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (id.includes('node_modules/pdfjs-dist')) return 'pdfjs';
          if (id.includes('node_modules/react')) return 'react-vendor';
          if (id.includes('node_modules')) return 'vendor';
        }
      }
    }
  }
})