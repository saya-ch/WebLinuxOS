import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig(({ mode }) => {
  const isGitHubPages = mode === 'github-pages'
  
  return {
    plugins: [react()],
    base: isGitHubPages ? '/WebLinuxOS/' : '/',
    build: {
      outDir: '../',
      emptyOutDir: false,
      rollupOptions: {
        output: {
          manualChunks: undefined
        }
      },
      publicDir: isGitHubPages ? false : 'public'
    }
  }
})
