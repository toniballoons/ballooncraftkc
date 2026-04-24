import { fileURLToPath } from 'url'
import { dirname, resolve } from 'path'
import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)

// https://vite.dev/config/
export default defineConfig({
  logLevel: 'error', // Suppress warnings, only show errors
  plugins: [
    react(),
  ],
  resolve: {
    alias: {
      '@': resolve(__dirname, './src')
    }
  }
});
