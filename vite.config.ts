import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

export default defineConfig({
  plugins: [react(), tailwindcss()],
  // Use minimal public folder with only cloud texture
  // Models/videos are hosted on R2 CDN
  publicDir: 'public-deploy',
  build: {
    copyPublicDir: true,
  },
})
