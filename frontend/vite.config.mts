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
    host: '0.0.0.0', // or host: true
    proxy: {
      '/api': {
        target: 'https://cdm.radaron.hu',
        secure: false,
      },
    },
  },
})
