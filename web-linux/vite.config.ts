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
            // IMPORTANT: patterns are checked in order — first match wins.
            // Use \b word boundaries to prevent substring collisions (e.g. CodeForge vs CodeForgeHelper).
            // Specific patterns must come BEFORE broad catch-alls to avoid overlap.
            const LARGE_APP_PATTERNS: [RegExp, string][] = [
              // ── Code editors / IDEs ──
              [/CodeEditor|\bCodeForge\b|CodeStudio|CodePlayground(?!Pro)|\bCodeSandbox\b|WebIDE(?!Pro)/i, 'app-codeeditor'],
              // ── File manager ──
              [/FileManager|LocalFileExplorer|DiskUsage|DiskUtility/i, 'app-filemanager'],
              // ── Browser / web browsing ──
              [/WebBrowser|Browser(?!Fingerprint)|WebView|OnlineBrowser/i, 'app-browser'],
              // ── Weather ──
              [/Weather|LiveWeather|AtmosphericWeather/i, 'app-weather'],
              // ── Music ──
              [/MusicPlayer|MusicStudio|SoundRecorder|AmbientSound/i, 'app-music'],
              // ── Video ──
              [/VideoPlayer|ScreenRecorder|GifExplorer/i, 'app-video'],
              // ── Games ──
              [/Game/i, 'app-games'],
              // ── AI assistants (smaller group) ──
              [/NexusAI|AICraft|AIBackgroundRemover|AIUpscaler|AICodeReview/i, 'app-ai-suite'],
              // ── Terminal ──
              [/TerminalPro|NeoTerminal|SmartShell|LinuxCommandLab|LinuxCommandPlayground/i, 'app-terminalpro'],
              // ── Calendar / dates ──
              [/Calendar/i, 'app-calendar'],
              // ── Calculator / math ──
              [/Calculator|QuantumCalculator|NumberBaseConverter|UnitConverter|CurrencyConverter|ExchangeRate/i, 'app-calculator'],
              // ── Clock / world time ──
              [/Clock|WorldClock|DateTimeCalculator/i, 'app-clock'],
              // ── Paint / drawing ──
              [/Paint|DrawPad|SnapStudio|MarkPoster/i, 'app-paint'],
              // ── Notepad / text editing ──
              [/Notepad|TextEditor|TextFormatter|TextDiffViewer|QuickNotesPro/i, 'app-notepad'],
              // ── Email / contacts ──
              [/Email|Contacts|RealClipboardHistory|ClipboardHistory|CloudClipboard/i, 'app-email'],
              // ── Dev tools / toolbox ──
              [/DevTools|DevBox|DevRadar|DevKit|DevLab|DevForge|DevPortal|DevAtlas|DevHub|DevEcosystem|DevShortcuts|DevToolkit|DeveloperToolbox|DeveloperCheatSheet|DevProductivitySuite/i, 'app-devtools'],
              // ── System / monitor / diagnostics ──
              [/SystemDashboard|SystemOptimizer|SystemHealthMonitor|SystemAnalytics|SystemAssistant|SystemBackup|SystemDiagnostics|SystemInfo|SystemMonitor|SystemPerformanceAnalyzer|SystemResourceDashboard|SystemSettings|SystemStatusDashboard|SystemTaskManager|SystemToolbox|SystemHealthCheck|SystemHealthDashboard|SystemMonitorDashboard|SystemMonitorPro|SystemDiagnosticsPro|SystemInfoPro|RealSystemMonitor|ProcessMonitor|ResourceMonitor|PowerManager/i, 'app-system'],
              // ── Regex ──
              [/RegexVisualizer|RegexMaster|OnlineRegexTester|RegexBuilder|RegexTester|RegexGolf/i, 'app-regex'],
              // ── JSON / YAML ──
              [/JsonTreeView|JsonFormatter|JsonCrusher|JsonToYamlConverter|JsonWorkbench|JsonToTypeScript|JSONForge|JSONSchemaValidator|JSONYAMLConverter/i, 'app-json'],
              // ── Prompt engineering / AI writing ──
              [/PromptEngineeringLab|PromptForge|AIWritingStudio|PromptEngineer|AIPromptLibrary|AIPromptOptimizer/i, 'app-prompt'],
              // ── Code sandbox / runner ──
              [/EnhancedCodeSandbox|OnlineCodeRunnerPro|OnlineCodeRunner|OnlineCodeRunnerEnhanced|OnlineCompiler|OnlineProgrammingLab|\bCodeRunner\b|CodeRunnerAdvanced|WebCodeRunner|WebAssemblyPlayground/i, 'app-sandbox'],
              // ── API tools / HTTP ──
              [/EnhancedApiDebugger|APILab|APILoadTester|APIExplorer|APITester|APIPlaybook|APIPlayground|APIHealthMonitor|APIDesignStudio|ApiDocsViewer|ApiLabPro|ApiTester|OnlineAPIHub|OpenAPIHub|RESTClient|RealHTTPClient|HTTPToolkit|HttpStatusCodes|HttpStatusExplorer|WebRequestLab|CORSProxy/i, 'app-api-tools'],
              // ── Book / reading / knowledge ──
              [/BookFinder|ReadingList|KnowledgeCards|KnowledgeExplorer|KnowledgeGarden|KnowledgeVine|WikiExplorer|WikipediaExplorer|WikipediaReader|ResearchAssistant|ChinesePoetry|Dictionary/i, 'app-bookfinder'],
              // ── Translation / language ──
              [/QuickTranslate|SmartTranslator|LanguageLab|RealTimeTranslator|RealTimeTranslatorEnhanced|Translator|AITranslator/i, 'app-translate'],
              // ── Color tools ──
              [/ColorName|ColorMixerPro|ColorPaletteGen|ColorAccessibility|ColorConverter|ColorLab|ColorPaletteExtractor|ColorPaletteGenerator|ColorPicker|ColorTools/i, 'app-colors'],
              // ── Global data / news / insights ──
              [/GlobalPulse|GlobalIntelCenter|InfoPulseCenter|GlobalInsights|NewsHub|NewsReader|SmartNewsReader|LiveInfoCenter|LiveDataCenter|LivePulse|WorldPulse/i, 'app-global-data'],
              // ── Notes / markdown ──
              [/SmartNotesPro|MarkdownNotebook|MarkdownLiveStudio|MarkdownLivePreview|MarkdownEditorPro|MarkdownPreviewer|MarkdownPublisher|MarkdownWriter|MarkdownCheatSheet|MarkdownToHTML|MarkdownToPDF|MarkdownQuickNote|MarkdownCollaborator|OnlineCollabNotebook|MarkdownLinter/i, 'app-notes'],
              // ── RSS ──
              [/RSSAggregator|RSSReader|SmartRSSReader|HackerNewsReader/i, 'app-rss'],
              // ── Web SSH / serial ──
              [/WebSSHTerminal|WebSerialTerminal/i, 'app-web-ssh'],
              // ── Workspace / cloud ──
              [/CloudDrive|WorkspaceLayout|WorkspaceHub|WorkspaceManager|SmartWorkspace|CrossDeviceSync|CloudSync/i, 'app-workspace'],
              // ── DevOps / deploy ──
              [/DevOpsDashboard|DevOpsHealthCheck|DevOpsTools|DeployMonitor|AutoFlow|WorkflowAutomation/i, 'app-devops'],
              // ── Fonts / typography ──
              [/FontPairing|FontViewer|CharacterMap/i, 'app-fonts'],
              // ── Focus / timer ──
              [/FocusTimer|FocusFlow|FocusMode|FocusFlowPro|CountdownTimer|TimerApp/i, 'app-focus'],
              // ── Quick tools / clipboard / sharing ──
              [/QuickShare|QuickCapture|QuickCommands|QuickLauncher|QuickTools|ClipboardManager|QuickNotesPro/i, 'app-quickshare'],
              // ── Browser info / dev info ──
              [/BrowserInfo|BrowserFingerprint|DevInfoDashboard|WebMetaExtractor|DevConsole/i, 'app-browser-info'],
              // ── Link / URL ──
              [/LinkAnalyzer|URLTools|URLToolsEnhanced|WebContentExtractor|WebSnapshot|WebSummarizer|WebClipper/i, 'app-link'],
              // ── Batch image ──
              [/BatchImageProcessor|ImageCompressor|ImageForge|ImageOptimizer|ImageViewer|BackgroundRemover|AiImageStudio/i, 'app-batchimg'],
              // ── Storage / cookies ──
              [/LocalStorageInspector|CookieManager|ArchiveManager/i, 'app-storage'],
              // ── WebSocket / network ──
              [/WebSocketClient|NetworkMonitor|NetworkSpeedTest|NetworkExplorer|NetworkStatusDashboard|NetworkToolkit|NetDiagnostics|DnsDiagnostics|DnsLookup|DNSProbe|Firewall|BluetoothManager|WiFiManager|IPLookup|Diagnostics/i, 'app-websocket'],
              // ── Mindfulness / wellness ──
              [/ZenBreath|DeepFocus|HabitTracker/i, 'app-mindfulness'],
              // ── Web tools / clipper ──
              [/SmartWebClipper|WebToMarkdown|WebDevToolkit|WebDevChecklist|WebToolbox|WebToolsHub|WebServicesToolbox|\bWebPerformanceProfiler\b|WebPerformanceTesterPro|WebsitePerformanceTester/i, 'app-web-tools'],
              // ── Code snap / screenshot ──
              [/CodeSnapPro|CodeScreenshotter|CodeSnapShare|Screenshot|ScreenCapture|CodeShare/i, 'app-code-snap'],
              // ── Data visualization ──
              [/DataVizWorkbench|DataViz|DataVizDashboard|DataVizStudio|DataVisualizer|AdvancedDataViz|DataPulsePro|DataVerseLive|LiveDashboard|RealTimeDashboard|RealTimeDataDashboard|RealTimeDataHub|LiveDataPipeline|LiveDataHub|NeuroGraph|InsightPulse/i, 'app-dataviz'],
              // ── Crypto / finance ──
              [/CryptoDashboard|CryptoMarketHub|CryptoPortfolioTracker|CryptoPriceTracker|CryptoSimulator|CryptoTracker|FinanceDashboard|StockDashboard|StockTracker|GlobalEconomicDashboard|NebulaDashboard/i, 'app-crypto'],
              // ── Travel / geo ──
              [/GlobalTravelAssistant|CountryInfo|GeoAtlas|Maps|AirQualityMonitor/i, 'app-travel'],
              // ── Performance ──
              [/WebsitePerformanceTester|PerformanceDashboard|\bPerformanceMonitor\b|ResourceMonitor|\bPerformanceProfiler\b/i, 'app-perf'],
              // ── Password / security ──
              [/PasswordGeneratorPro|PasswordGenerator|PasswordChecker|PasswordStrength|PasswordManager|SmartPasswordManager|PasswordManagerEnhanced|SecureVault|PrivacyDashboard|PrivacyGuard|SecurityCenter|SecurityTools/i, 'app-password'],
              // ── Presentation / slides ──
              [/MarkdownToSlides|SlideForge|Presentation/i, 'app-slides'],
              // ── Snippet / code tools ──
              [/SnippetForge|SnippetManager|SnippetShare|SnippetVault|CodeSnippetHub|CodeSnippetLibrary|CodeSnippetManager|CodeSnippetPlayground|CodeSnippetShare|CodeSnippetsManager|CodeFormatter|CodePolisher|CodeSearch|CodeVault|CodePerfAnalyzer|CodeInterpreter|CodeDocGen|\bCodeAssistantPro\b|CodeDiffViewer|CodeDiffViewerEnhanced|CodeGenerator|CodeLab|CodePenLite|CodePlaygroundPro|CodeRefactorAI|CodeReviewBot|CodeReviewer|CodeCollaborationHub|CodeCollaborationPlatform|DeveloperToolkitPro|CollaborationEnhanced|WebContainerIDE|WebSandboxIDE|WebIDEPro|ComponentSandbox|WebDB|DatabaseDesigner|Spreadsheet/i, 'app-snippet'],
              // ── Task / project management ──
              [/TaskManager|TaskManagerPlus|TaskManagerPro|TaskBoard|TaskDashboard|TaskAutomation|ProjectManager|ProjectPlanner|KanbanBoard|DailyAgenda|DailyDashboard|SmartScheduleAssistant|DailyInspo|SmartDailyHub|ProductivityCenter|ProductivityDashboard|ProductivityHub|MotivationalDashboard|UnifiedCommandHub|UnifiedDashboard/i, 'app-tasks'],
              // ── Code AI (catch-all for AI+Code combos) ──
              [/AIAssistant|AIChat|AICodeAnalyzer|AICodeAssistant|AICodeCompanion|AICodeMentor|AICodeTutor|AICommand|AICreation|AIDesktop|AIDoc|AIGenerator|AIHelper|AILearning|AIPoetry|AIProgramming|AIRewriter|AISmart|AISnippet|AIStory|AITask|AIText|AIUltimate|AIWallpaper|AIWiki|AIWorkbench|AIWorkflow|AIWorkspace|ChatAI|IntelligentCode|SmartCode|SmartAI|AIRegex|PollinationsAI|PollinationsStudio|AIArt/i, 'app-code-ai'],
              // ── Content creation / creative ──
              [/ContentStudio|CreativeToolkit|CreativeInspiration|AsciiArtGenerator|CSSArtStudio|CssAnimationStudio|CssGradientStudio|CssStudio|CSSToolbox|MemeGenerator|ParticleSystem|Visualizers|Whiteboard|WhiteboardPro|RealTimeWhiteboard|RealTimeCollaborativeWhiteboard|CollaborativeWhiteboard|RealtimeWhiteboard|MindMap|FlowBoard/i, 'app-content'],
              // ── Markdown tools (broader catch) ──
              [/Markdown/i, 'app-markdown'],
              // ── Git / GitHub ──
              [/GitAssistant|GitCheatsheet|GitHubExplorer|GitHubProfile|GitHubTrending|GitVisualizer|GitProbe|CodeDiff/i, 'app-git'],
              // ── Collab / real-time ──
              [/Collaboration|RealTimeCodeCollab|RealTimeCollaboration|RealtimeDocument|LiveCollabBoard|OnlineCollab/i, 'app-collab'],
              // ── Social / messaging ──
              [/Social|Chat(?!AI)|VoiceAssistant|VoiceTranscriber|WebSpeechSynth|SpeechMemo|IdeaBoard|IdeaCapture|IdeaStream|IdeaBoardInfinite/i, 'app-social'],
              // ── Charts / gauges ──
              [/Chart|Gauge|Dashboard(?!System|Weather|Performance|Finance|Crypto|Real)/i, 'app-charts'],
              // ── Emoji / icon / gallery ──
              [/Emoji|IconGallery|WallpaperGallery/i, 'app-gallery'],
              // ── Pomodoro (exact name) ──
              [/Pomodoro/i, 'app-pomodoro'],
              // ── Code review / refactor ──
              [/CodeReview|Refactor|CodeInterviewPrep|TechInterviewPrep/i, 'app-codereview'],
              // ── Audio recorder / player ──
              [/\bAudioRecorder\b|\bVideoRecorder\b|\bMusicPlayer\b|\bAudioViz\b|\bMusicVisualizer\b/i, 'app-recorder'],
              // ── Scheduler / planner ──
              [/Scheduler|Planner|Schedule|Automation/i, 'app-scheduler'],
              // ── Debugging / profiling ──
              [/Debug|Profile|Profiler|Diagnostics/i, 'app-debug'],
              // ── Cron / time tools ──
              [/Cron|Timer|Countdown|Stopwatch/i, 'app-timetools'],
              // ── Name / nameplate ──
              [/Nameplate|Name/i, 'app-nameplate'],
              // ── API / HTTP (remaining) ──
              [/API(?!Hub)|HTTP|REST|GraphQL/i, 'app-api-remaining'],
              // ── Translation (remaining) ──
              [/Translat/i, 'app-translat'],
              // ── Generator (remaining) ──
              [/Generator/i, 'app-generator'],
              // ── Testing ──
              [/Test|Probe|Check/i, 'app-testing'],
              // ── Recording / audio ──
              [/\bRecord\b|\bAudio\b|\bSound\b|\bSpeech\b|\bVoice\b/i, 'app-audio'],
              // ── Word / text ──
              [/Word|Text|TextAnalyze|Editor/i, 'app-text'],
              // ── Manager (remaining catch-all for XxxManager) ──
              [/Manager(?!Pro|Plus|Enhanced)|Hub(?!API|Open|Online)|Center|Console|Toolkit|Toolbox|Stack|Suite|Forge|Studio/i, 'app-manager'],
              // ── Database ──
              [/Database|\bDB\b|SQL/i, 'app-database'],
              // ── Setup / onboarding ──
              [/Setup|Wizard|Onboard|Welcome|Intro/i, 'app-setup'],
              // ── Manifest / registry ──
              [/Manifest|Registry|RegistryDB/i, 'app-manifest'],
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