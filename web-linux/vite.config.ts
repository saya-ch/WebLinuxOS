import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig(() => {
  return {
    plugins: [react()],
    // 该项目主部署目标是 GitHub Pages (https://<user>.github.io/WebLinuxOS/)，
    // 因此默认 base 固定为仓库子路径；本地开发或自定义域名时可通过 VITE_BASE_PATH 覆盖。
    base: process.env.VITE_BASE_PATH || '/WebLinuxOS/',
    build: {
      // GitHub Pages 部署工作流以仓库根目录作为上传源，因此默认输出到上级目录
      // (即仓库根)。如需打包到 ../dist，请设置 OUTPUT_DIR=dist
      outDir: process.env.OUTPUT_DIR || '../',
      // 警告：outDir 指向仓库根时，Vite 会清空其中的所有内容。
      // 这里显式关闭以避免误删 .git、README 等重要文件。
      // 部署前请使用 `npm run clean` 清理旧的构建产物。
      emptyOutDir: false,
      publicDir: 'public',
      sourcemap: false,
      minify: 'terser',
      cssMinify: true,
      target: 'es2020',
      chunkSizeWarningLimit: 1500,
      reportCompressedSize: false,
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
              if (match) return `app-${match[1]}`
            }
            return undefined
          },
          entryFileNames: 'assets/[name]-[hash].js',
          chunkFileNames: 'assets/[name]-[hash].js',
          assetFileNames: 'assets/[name]-[hash].[ext]',
        },
      },
    },
    optimizeDeps: {
      include: ['react', 'react-dom', 'zustand'],
      exclude: ['pyodide'],
      prebuildNotifications: false,
    },
    server: {
      port: 5173,
      open: false,
      host: true,
    },
    preview: {
      port: 4173,
      open: false,
    },
  }
})