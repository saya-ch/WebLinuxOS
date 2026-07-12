import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { copyFileSync, existsSync, mkdirSync } from 'fs'
import { resolve } from 'path'

export default defineConfig(() => {
  const outDir = process.env.OUTPUT_DIR || '../dist'
  const basePath = process.env.VITE_BASE_PATH || '/WebLinuxOS/'

  const targetPublicDir = resolve(__dirname, outDir)

  if (!existsSync(targetPublicDir)) {
    mkdirSync(targetPublicDir, { recursive: true })
  }

  const publicFiles = ['favicon.svg', 'icons.svg', 'manifest.json', '.nojekyll', '404.html']
  publicFiles.forEach(file => {
    const src = resolve(__dirname, 'public', file)
    const dest = resolve(targetPublicDir, file)
    if (existsSync(src)) {
      copyFileSync(src, dest)
    }
  })

  return {
    plugins: [react()],
    base: basePath,
    build: {
      outDir,
      emptyOutDir: true,
      publicDir: false,
      sourcemap: false,
      minify: 'terser',
      cssMinify: true,
      target: 'es2022',
      chunkSizeWarningLimit: 2000,
      reportCompressedSize: false,
      modulePreload: {
        polyfill: false,
        resolveDependencies: (_filename, deps) => {
          const criticalModules = ['vendor-react', 'vendor-zustand', 'component-desktop']
          return deps.filter(dep => criticalModules.some(m => dep.includes(m)))
        },
      },
      esbuild: {
        supported: {
          'top-level-await': true,
        },
        drop: ['console', 'debugger'],
      },
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
            if (id.includes('node_modules/marked')) {
              return 'vendor-marked'
            }
            if (id.includes('node_modules/pyodide')) {
              return 'vendor-pyodide'
            }
            if (id.includes('node_modules/monaco-editor')) {
              return 'vendor-monaco'
            }
            if (id.includes('node_modules/codemirror')) {
              return 'vendor-codemirror'
            }
            if (id.includes('node_modules/prismjs')) {
              return 'vendor-prism'
            }
            if (id.includes('node_modules/@codemirror')) {
              return 'vendor-codemirror'
            }
            if (id.includes('node_modules/chart.js')) {
              return 'vendor-chart'
            }
            if (id.includes('node_modules/date-fns')) {
              return 'vendor-date'
            }
            if (id.includes('node_modules/lodash')) {
              return 'vendor-lodash'
            }
            if (id.includes('node_modules/uuid')) {
              return 'vendor-uuid'
            }
            if (id.includes('src/apps/')) {
              const match = id.match(/src\/apps\/([A-Za-z][A-Za-z0-9_-]*)\.tsx/)
              if (match) return `app-${match[1]}`
            }
            if (id.includes('src/apps/terminal/')) {
              return 'app-terminal'
            }
            if (id.includes('src/components/')) {
              const match = id.match(/src\/components\/([A-Za-z][A-Za-z0-9_-]*)\//)
              if (match) return `component-${match[1]}`
            }
            if (id.includes('src/store/')) {
              return 'core-store'
            }
            if (id.includes('src/types/')) {
              return 'core-types'
            }
            if (id.includes('src/utils/')) {
              return 'core-utils'
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
      include: ['react', 'react-dom', 'zustand', 'lucide-react'],
      exclude: ['pyodide'],
      prebuildNotifications: false,
      esbuildOptions: {
        target: 'es2022',
      },
    },
    server: {
      port: 5173,
      open: false,
      host: true,
      hmr: {
        overlay: true,
      },
      headers: {
        'Cross-Origin-Embedder-Policy': 'require-corp',
        'Cross-Origin-Opener-Policy': 'same-origin',
        'Cache-Control': 'public, max-age=31536000, immutable',
      },
    },
    preview: {
      port: 4173,
      open: false,
      headers: {
        'Cache-Control': 'public, max-age=31536000, immutable',
      },
    },
  }
})