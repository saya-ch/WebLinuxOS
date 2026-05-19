import { defineConfig } from 'vite'
import path from 'path'

export default defineConfig({
  resolve: {
    alias: {
      '@weblinuxos/core': path.resolve(__dirname, '../core/src')
    }
  }
})
