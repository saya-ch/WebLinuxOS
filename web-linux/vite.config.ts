import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { readFileSync } from 'fs'
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
  const basePath = process.env.VITE_BASE_PATH || '/WebLinuxOS/'

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
      chunkSizeWarningLimit: 1000,
      reportCompressedSize: false,
      modulePreload: {
        polyfill: false,
        resolveDependencies: (_filename, deps) => {
          const criticalModules = ['vendor-react', 'vendor-zustand', 'vendor-lucide']
          return deps.filter(dep => criticalModules.some(m => dep.includes(m)))
        },
      },
      esbuild: {
        supported: {
          'top-level-await': true,
        },
        drop: isProduction ? ['debugger'] : [],
        minifyIdentifiers: isProduction,
        minifySyntax: isProduction,
      },
      rollupOptions: {
        output: {
          manualChunks(id: string) {
            // ===== Vendor chunks (explicit) =====
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

            // ===== Core components =====
            if (id.includes('src/components')) {
              return 'components-shared'
            }

            // ===== Terminal (large multi-module app) =====
            if (id.includes('src/apps/terminal')) {
              return 'app-terminal'
            }

            // ===== Pattern-based auto chunking for apps =====
            // Large apps with submodules or complex dependencies get their own chunks
            const LARGE_APP_PATTERNS: [RegExp, string][] = [
              [/CodeEditor|CodeForge|CodeStudio/i, 'app-codeeditor'],
              [/FileManager/i, 'app-filemanager'],
              [/WebBrowser|Browser(?!Fingerprint)/i, 'app-browser'],
              [/Weather(?!Dashboard)/i, 'app-weather'],
              [/MusicPlayer|MusicStudio/i, 'app-music'],
              [/VideoPlayer/i, 'app-video'],
              [/Game/i, 'app-games'],
              [/NexusAI|AICraft|AIBackgroundRemover|AIUpscaler|AICodeReview/i, 'app-ai-suite'],
              [/TerminalPro/i, 'app-terminalpro'],
              [/Calendar/i, 'app-calendar'],
              [/Calculator/i, 'app-calculator'],
              [/Clock/i, 'app-clock'],
              [/Paint/i, 'app-paint'],
              [/Notepad/i, 'app-notepad'],
              [/Email/i, 'app-email'],
              [/DevTools|DevBox|DevRadar/i, 'app-devtools'],
              [/SystemDashboard|SystemOptimizer|SystemHealthMonitor/i, 'app-system'],
              [/RegexVisualizer|RegexMaster|OnlineRegexTester/i, 'app-regex'],
              [/JsonTreeView|JsonFormatter|JsonCrusher|JsonToYamlConverter/i, 'app-json'],
              [/PromptEngineeringLab|PromptForge|AIWritingStudio/i, 'app-prompt'],
              [/EnhancedCodeSandbox|OnlineCodeRunnerPro/i, 'app-sandbox'],
              [/EnhancedApiDebugger|APILab|APILoadTester/i, 'app-api-tools'],
              [/BookFinder/i, 'app-bookfinder'],
              [/QuickTranslate|SmartTranslator|LanguageLab/i, 'app-translate'],
              [/ColorName|ColorMixerPro|ColorPaletteGen|ColorAccessibility/i, 'app-colors'],
              [/GlobalPulse|GlobalIntelCenter|InfoPulseCenter/i, 'app-global-data'],
              [/SmartNotesPro|MarkdownNotebook|MarkdownLiveStudio|MarkdownLivePreview/i, 'app-notes'],
              [/RSSAggregator/i, 'app-rss'],
              [/WebSSHTerminal/i, 'app-web-ssh'],
              [/CloudDrive|WorkspaceLayout/i, 'app-workspace'],
              [/DevOpsDashboard/i, 'app-devops'],
              [/FontPairing/i, 'app-fonts'],
              [/FocusTimer|FocusFlow|ZenBreath|DeepFocus/i, 'app-focus'],
              [/QuickShare/i, 'app-quickshare'],
              [/BrowserInfo|DevInfoDashboard/i, 'app-browser-info'],
              [/LinkAnalyzer/i, 'app-link'],
              [/BatchImageProcessor/i, 'app-batchimg'],
              [/LocalStorageInspector|CookieManager/i, 'app-storage'],
              [/WebSocketClient/i, 'app-websocket'],
              [/ZenBreath|DeepFocus/i, 'app-mindfulness'],
              [/SmartWebClipper|WebToMarkdown/i, 'app-web-tools'],
              [/CodeSnapPro/i, 'app-code-snap'],
              [/AmbientSound/i, 'app-ambientsound'],
              [/TextAnalyzer/i, 'app-text-analyzer'],
              [/HTTPToolkit/i, 'app-http-toolkit'],
              [/DevRadar/i, 'app-devradar'],
              [/AstroViewer/i, 'app-astrophys'],
              [/DataVizWorkbench/i, 'app-dataviz'],
              [/QuickQuote|Quote/i, 'app-quote'],
              [/DailyChallenge/i, 'app-challenge'],
              [/SmartWebClipper/i, 'app-web-tools'],
              [/CryptoDashboard/i, 'app-crypto'],
              [/WeatherDashboard/i, 'app-weather-dash'],
              [/GlobalTravelAssistant/i, 'app-travel'],
              [/WebsitePerformanceTester|PerformanceDashboard/i, 'app-perf'],
              [/PasswordGeneratorPro/i, 'app-password'],
              [/DateTimeCalculator/i, 'app-datetime'],
              [/MarkdownToSlides|SlideForge/i, 'app-slides'],
              [/RegexMaster/i, 'app-regexmaster'],
              [/SnippetForge/i, 'app-snippet'],
              [/AppMarketplace/i, 'app-marketplace'],
              [/WorldClock/i, 'app-world-clock'],
              [/CurrencyConverter/i, 'app-currency'],
              [/IPInfoDashboard/i, 'app-ip-info'],
            ]

            for (const [pattern, chunkName] of LARGE_APP_PATTERNS) {
              if (pattern.test(id)) return chunkName
            }

            // All remaining apps: group into a single "apps-misc" chunk
            if (id.includes('src/apps/')) {
              return 'apps-misc'
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
    },
    define: {
      __BUILD_TIME__: JSON.stringify(new Date().toISOString().replace('T', ' ').split('.')[0]),
      __APP_VERSION__: JSON.stringify(APP_VERSION),
      __PUBLIC_URL__: JSON.stringify(basePath),
    },
    resolve: {
      conditions: ['es2022'],
      alias: {
        '@': resolve(__dirname, 'src'),
        '@components': resolve(__dirname, 'src/components'),
        '@apps': resolve(__dirname, 'src/apps'),
        '@store': resolve(__dirname, 'src/store'),
        '@utils': resolve(__dirname, 'src/utils'),
        '@hooks': resolve(__dirname, 'src/hooks'),
        '@types': resolve(__dirname, 'src/types'),
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
        'Referrer-Policy': 'strict-origin-when-cross-origin',
      },
    },
    preview: {
      port: 4173,
      open: false,
      headers: {
        'Cache-Control': 'public, max-age=31536000, immutable',
        'X-Content-Type-Options': 'nosniff',
        'X-Frame-Options': 'DENY',
        'X-XSS-Protection': '1; mode=block',
      },
    },
    cacheDir: '.vite',
  }
})