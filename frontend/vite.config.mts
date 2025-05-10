import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import checker from 'vite-plugin-checker'

export default defineConfig({
  plugins: [
    react(),
    checker({ typescript: true }), // Enable TypeScript type checking
  ],
  build: {
    outDir: 'build',
  },
  server: {
    proxy: {
      '/api': {
        target: 'http://localhost:8000',
      },
    },
  },
})
