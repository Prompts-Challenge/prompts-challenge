import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import { fileURLToPath } from 'node:url'
import tailwindcss from 'tailwindcss'
import autoprefixer from 'autoprefixer'
import fs from 'fs'
import dotenv from 'dotenv'

// Load .env file
const envConfig = dotenv.parse(fs.readFileSync('.env'))

export default defineConfig({
  plugins: [vue()],
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url))
    }
  },
  css: {
    postcss: {
      plugins: [
        tailwindcss(),
        autoprefixer()
      ]
    }
  },
  define: {
    'import.meta.env.VITE_GITHUB_CLIENT_SECRET': JSON.stringify(envConfig.GITHUB_CLIENT_SECRET)
  }
})
