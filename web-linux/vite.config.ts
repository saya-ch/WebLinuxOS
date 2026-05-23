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
      target: 'esnext'
    },
    optimizeDeps: {
      include: ['react', 'react-dom', 'zustand']
    }
  }
})
