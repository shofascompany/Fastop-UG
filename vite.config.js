import { fileURLToPath, URL } from 'node:url'
import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'

export default defineConfig({
  plugins: [vue()],
  server: {
    // the Fastop API (npm run api) handles accounts and email verification
    proxy: { '/api': 'http://localhost:8787' },
    // Photos are served as they are and never need live reload. Not watching them also stops
    // Windows "EBUSY: resource busy or locked" crashes while a photo is still being copied in.
    watch: { ignored: ['**/public/img/**', '**/public/icons/**', '**/branding/**', '**/server/data/**', '**/dist/**'] },
  },
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url)),
    },
  },
})
