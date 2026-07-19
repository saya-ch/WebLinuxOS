import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { copyFileSync, existsSync, mkdirSync, readFileSync } from 'fs'
import { resolve } from 'path'

function readAppVersion(): string {
  try {
    const pkgPath = resolve(__dirname, 'package.json')
    const pkg = JSON.parse(readFileSync(pkgPath, 'utf-8'))
    return pkg.version || '0.0.0'
  } catch {
    return '0.0.0'
  }
}

const APP_VERSION = readAppVersion()

export default defineConfig(({ mode }) => {
  const outDir = process.env.OUTPUT_DIR || '../dist'
  const basePath = '/WebLinuxOS/'

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

  const isProduction = mode === 'production'

  return {
    plugins: [react()],
    base: basePath,
    build: {
      outDir,
      emptyOutDir: true,
      publicDir: false,
      sourcemap: isProduction ? false : 'inline',
      minify: isProduction ? 'terser' : false,
      cssMinify: isProduction,
      target: 'es2022',
      chunkSizeWarningLimit: 3000,
      reportCompressedSize: false,
      modulePreload: {
        polyfill: false,
        resolveDependencies: (_filename, deps) => {
          const criticalModules = ['vendor-react', 'vendor-zustand']
          return deps.filter(dep => criticalModules.some(m => dep.includes(m)))
        },
      },
      esbuild: {
        supported: {
          'top-level-await': true,
        },
        drop: isProduction ? ['console', 'debugger'] : [],
        minifyIdentifiers: isProduction,
        minifySyntax: isProduction,
      },
      rollupOptions: {
        cache: true,
        output: {
          manualChunks(id: string) {
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
            if (id.includes('node_modules/codemirror') || id.includes('node_modules/@codemirror')) {
              return 'vendor-codemirror'
            }
            if (id.includes('node_modules/prismjs')) {
              return 'vendor-prism'
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
            if (id.includes('src/apps/terminal')) {
              return 'app-terminal'
            }
            if (id.includes('src/apps/NexusAI')) {
              return 'app-nexusai'
            }
            if (id.includes('src/apps/CodeEditor') || id.includes('src/apps/CodeForge')) {
              return 'app-codeeditor'
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
      include: ['react', 'react-dom', 'zustand', 'lucide-react', 'marked'],
      exclude: ['pyodide'],
      prebuildNotifications: false,
      esbuildOptions: {
        target: 'es2022',
      },
    },
    define: {
      __BUILD_TIME__: JSON.stringify(new Date().toISOString().replace('T', ' ').split('.')[0]),
      __APP_VERSION__: JSON.stringify(APP_VERSION),
    },
    resolve: {
      conditions: ['es2022'],
      alias: {
        '@': resolve(__dirname, 'src'),
      },
    },
    server: {
      port: 5173,
      open: false,
      host: true,
      hmr: {
        overlay: true,
        clientPort: 5173,
        protocol: 'ws',
      },
      headers: {
        'Cross-Origin-Embedder-Policy': 'require-corp',
        'Cross-Origin-Opener-Policy': 'same-origin',
        'Cache-Control': 'no-store',
        'X-Content-Type-Options': 'nosniff',
        'X-Frame-Options': 'DENY',
        'X-XSS-Protection': '1; mode=block',
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