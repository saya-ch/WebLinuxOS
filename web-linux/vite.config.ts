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
      rollupOptions: {
        output: {
          manualChunks: isGitHubPages ? {
            vendor: ['react', 'react-dom'],
            store: ['zustand'],
          } : undefined
        }
      },
      publicDir: 'public',
      sourcemap: false,
      minify: 'esbuild',
      target: 'esnext'
    },
    esbuild: {
      keepNames: true
    }
  }
})
