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
      chunkSizeWarningLimit: 1000,
      rollupOptions: {
        output: {
          manualChunks: (id) => {
            if (id.includes('node_modules/react') || id.includes('node_modules/react-dom')) {
              return 'vendor-react'
            }
            if (id.includes('node_modules/zustand')) {
              return 'vendor-zustand'
            }
            if (id.includes('node_modules/lucide-react')) {
              return 'vendor-lucide'
            }
            if (id.includes('node_modules/pyodide')) {
              return 'vendor-pyodide'
            }
            if (id.includes('src/apps/')) {
              const match = id.match(/src\/apps\/([A-Za-z]+)\.tsx/)
              if (match) {
                return `app-${match[1]}`
              }
            }
            return undefined
          },
          entryFileNames: 'assets/[name]-[hash].js',
          chunkFileNames: 'assets/[name]-[hash].js',
          assetFileNames: 'assets/[name]-[hash].[ext]',
        }
      }
    },
    optimizeDeps: {
      include: ['react', 'react-dom', 'zustand'],
      exclude: ['pyodide'],
      prebuildNotifications: false,
      rolldownOptions: {
        external: ['pyodide'],
      }
    },
    server: {
      port: 5173,
      open: false,
      host: true,
      headers: {
        'Cross-Origin-Embedder-Policy': 'require-corp',
        'Cross-Origin-Opener-Policy': 'same-origin'
      }
    },
    preview: {
      port: 4173,
      open: false
    }
  }
})
