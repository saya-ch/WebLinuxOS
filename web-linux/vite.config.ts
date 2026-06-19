import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { copyFileSync, existsSync, mkdirSync } from 'fs'
import { resolve } from 'path'

export default defineConfig(() => {
  const outDir = process.env.OUTPUT_DIR || '../'
  const targetPublicDir = resolve(__dirname, outDir, 'public')

  // 确保目标目录存在
  if (!existsSync(targetPublicDir)) {
    mkdirSync(targetPublicDir, { recursive: true })
  }

  // 复制公共资源文件
  const publicFiles = ['favicon.svg', 'icons.svg', 'manifest.json', '.nojekyll']
  publicFiles.forEach(file => {
    const src = resolve(__dirname, 'public', file)
    const dest = resolve(targetPublicDir, file)
    if (existsSync(src)) {
      copyFileSync(src, dest)
    }
  })

  return {
    plugins: [react()],
    base: process.env.VITE_BASE_PATH || '/WebLinuxOS/',
    build: {
      outDir,
      emptyOutDir: false,
      publicDir: false,
      sourcemap: false,
      minify: 'terser',
      cssMinify: true,
      target: 'es2022',
      chunkSizeWarningLimit: 1500,
      reportCompressedSize: false,
      // 支持 top-level-await
      esbuild: {
        supported: {
          'top-level-await': true,
        },
      },
      rollupOptions: {
        output: {
          manualChunks: (id) => {
            // 核心框架依赖：React 相关
            if (id.includes('node_modules/react') || id.includes('node_modules/react-dom')) {
              return 'vendor-react'
            }
            // 状态管理：zustand
            if (id.includes('node_modules/zustand')) {
              return 'vendor-zustand'
            }
            // 图标库：lucide-react
            if (id.includes('node_modules/lucide-react')) {
              return 'vendor-lucide'
            }
            // 数学/科学库（体积较大）
            if (id.includes('node_modules/marked')) {
              return 'vendor-marked'
            }
            // Python 运行时（体积非常大，独立 chunk）
            if (id.includes('node_modules/pyodide')) {
              return 'vendor-pyodide'
            }
            // 应用级模块：支持驼峰大小写命名
            if (id.includes('src/apps/')) {
              const match = id.match(/src\/apps\/([A-Za-z][A-Za-z0-9_-]*)\.tsx/)
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