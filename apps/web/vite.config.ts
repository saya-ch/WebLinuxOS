import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@weblinuxos/core': path.resolve(__dirname, '../../packages/core/src'),
      '@weblinuxos/ui': path.resolve(__dirname, '../../packages/ui/src'),
      '@weblinuxos/apps': path.resolve(__dirname, '../../packages/apps/src'),
    }
  }
})
