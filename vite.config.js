import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

const basePath = process.env.VITE_BASE_PATH || './'

// https://vite.dev/config/
export default defineConfig({
  base: basePath,
  plugins: [react()],
  envPrefix: ['VITE_', 'NEXT_PUBLIC_'],
  server: {
    host: true,
  },
})
