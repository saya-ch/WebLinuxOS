import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig(({ mode }) => {
  const isGitHubPages = mode === 'github-pages'
  
  return {
    plugins: [react()],
    base: isGitHubPages ? '/WebLinuxOS/' : '/',
    build: {
      outDir: isGitHubPages ? '../' : '../dist',
      emptyOutDir: isGitHubPages ? false : true,
      publicDir: 'public',
      sourcemap: false,
      target: 'esnext',
      minify: 'terser',
      cssMinify: true,
      rollupOptions: {
        output: {
          manualChunks: (id) => {
            if (id.includes('node_modules/react') || id.includes('node_modules/react-dom')) {
              return 'vendor'
            }
            if (id.includes('node_modules/zustand')) {
              return 'store'
            }
            return undefined
          }
        }
      }
    },
    optimizeDeps: {
      include: ['react', 'react-dom', 'zustand'],
      prebuildNotifications: false
    },
    server: {
      port: 5173,
      open: false,
      host: true
    },
    preview: {
      port: 4173,
      open: false
    }
  }
})
