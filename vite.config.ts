import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

export default defineConfig({
  plugins: [react(), tailwindcss()],
  // Use public in dev so /models/... works locally.
  // For production deploy, keep public-deploy for small bundle.
  publicDir: 'public',
  build: {
    copyPublicDir: true,
  },
  resolve: {
    // Force a single copy of these packages to prevent the
    // "Invalid hook call" / "Multiple Three.js instances" crash.
    dedupe: ['react', 'react-dom', 'three', '@react-three/fiber'],
  },
  optimizeDeps: {
    // Pre-bundle these so Vite sees only one version
    include: ['react', 'react-dom', 'three'],
  },
})

