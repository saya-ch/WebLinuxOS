import { Suspense, lazy, useEffect, memo, useMemo, useRef, useState } from 'react'
import { useStore } from '../../store'
import Window from './Window'
import ErrorBoundary from '../ErrorBoundary'
import type { WindowState, AppDefinition } from '../../types'

interface WindowComponent {
  win: WindowState
  Component: React.LazyExoticComponent<React.ComponentType<any>>
  app: AppDefinition
}

/**
 * componentMap：将常用应用组件名（字符串）映射到懒加载组件。
 * 这是组件解析的首选方式，比动态拼接路径的 `import()` 更可靠，
 * 也便于后续的静态分析和 Tree Shaking。
 */
const componentMap: Record<string, () => Promise<{ default: React.ComponentType<any> }>> = {
  Terminal: () => import('../../apps/Terminal'),
  FileManager: () => import('../../apps/FileManager'),
  Calculator: () => import('../../apps/Calculator'),
  SystemSettings: () => import('../../apps/SystemSettings'),
  Notepad: () => import('../../apps/Notepad'),
  Calendar: () => import('../../apps/Calendar'),
  About: () => import('../../apps/About'),
  Weather: () => import('../../apps/Weather'),
  Clock: () => import('../../apps/Clock'),
  WebBrowser: () => import('../../apps/WebBrowser'),
  CodeEditor: () => import('../../apps/CodeEditor'),
  Notes: () => import('../../apps/Notes'),
  NotesApp: () => import('../../apps/NotesApp'),
  Paint: () => import('../../apps/Paint'),
  MusicPlayer: () => import('../../apps/MusicPlayer'),
  VideoPlayer: () => import('../../apps/VideoPlayer'),
  ImageViewer: () => import('../../apps/ImageViewer'),
  PDFViewer: () => import('../../apps/PDFViewer'),
  Settings: () => import('../../apps/SystemSettings'),
  SystemMonitor: () => import('../../apps/SystemMonitor'),
  SystemInfo: () => import('../../apps/SystemInfo'),
  Terminal2: () => import('../../apps/Terminal'),
  TextEditor: () => import('../../apps/TextEditor'),
  TextDiffViewer: () => import('../../apps/TextDiffViewer'),
  TodoApp: () => import('../../apps/TodoApp'),
  TodoList: () => import('../../apps/TodoList'),
  Screenshot: () => import('../../apps/Screenshot'),
  ScreenRecorder: () => import('../../apps/ScreenRecorder'),
  Translator: () => import('../../apps/Translator'),
  QRGenerator: () => import('../../apps/QRGenerator'),
  QRGeneratorEnhanced: () => import('../../apps/QRGeneratorEnhanced'),
  PasswordGenerator: () => import('../../apps/PasswordGenerator'),
  PasswordManager: () => import('../../apps/PasswordManager'),
  SmartPasswordManager: () => import('../../apps/SmartPasswordManager'),
  PasswordChecker: () => import('../../apps/PasswordChecker'),
  JSONFormatter: () => import('../../apps/JSONFormatter'),
  JSONSchemaValidator: () => import('../../apps/JSONSchemaValidator'),
  JSONYAMLConverter: () => import('../../apps/JSONYAMLConverter'),
  RegexBuilder: () => import('../../apps/RegexBuilder'),
  RegexTester: () => import('../../apps/RegexTester'),
  Base64Tools: () => import('../../apps/Base64Tools'),
  URLTools: () => import('../../apps/URLTools'),
  UnitConverter: () => import('../../apps/UnitConverter'),
  CurrencyConverter: () => import('../../apps/CurrencyConverter'),
  CurrencyLive: () => import('../../apps/CurrencyLive'),
  TimerApp: () => import('../../apps/TimerApp'),
  Pomodoro: () => import('../../apps/Pomodoro'),
  TextFormatter: () => import('../../apps/TextFormatter'),
  EmojiBrowser: () => import('../../apps/EmojiBrowser'),
  CharacterMap: () => import('../../apps/CharacterMap'),
  UuidTools: () => import('../../apps/UuidTools'),
  CodeRunner: () => import('../../apps/CodeRunner'),
  OnlineCodeRunner: () => import('../../apps/OnlineCodeRunner'),
  CodePlayground: () => import('../../apps/CodePlayground'),
  CodeSandbox: () => import('../../apps/CodeSandbox'),
  CodeStudio: () => import('../../apps/CodeStudio'),
  CodeFormatter: () => import('../../apps/CodeFormatter'),
  CodeDiffViewer: () => import('../../apps/CodeDiffViewer'),
  CodeDiffViewerEnhanced: () => import('../../apps/CodeDiffViewerEnhanced'),
  CodeReviewer: () => import('../../apps/CodeReviewer'),
  CodeGenerator: () => import('../../apps/CodeGenerator'),
  IntelligentCodeGenerator: () => import('../../apps/IntelligentCodeGenerator'),
  CodeInterpreter: () => import('../../apps/CodeInterpreter'),
  CodeSnippetsManager: () => import('../../apps/CodeSnippetsManager'),
  CodeSnippetShare: () => import('../../apps/CodeSnippetShare'),
  AIChat: () => import('../../apps/AIChat'),
  ChatAI: () => import('../../apps/ChatAI'),
  AIChatEnhanced: () => import('../../apps/AIChatEnhanced'),
  AIChatAssistant: () => import('../../apps/AIChatAssistant'),
  AIHelper: () => import('../../apps/AIHelper'),
  AIAssistant: () => import('../../apps/AIAssistant'),
  AIAssistantPro: () => import('../../apps/AIAssistantPro'),
  AICodeAssistant: () => import('../../apps/AICodeAssistant'),
  AICodeCompanion: () => import('../../apps/AICodeCompanion'),
  AICodeTutor: () => import('../../apps/AICodeTutor'),
  AIGenerator: () => import('../../apps/AIGenerator'),
  AIPromptLibrary: () => import('../../apps/AIPromptLibrary'),
  AISmartAssistant: () => import('../../apps/AISmartAssistant'),
  AITaskAssistant: () => import('../../apps/AITaskAssistant'),
  SystemAssistant: () => import('../../apps/SystemAssistant'),
  DevAssistant: () => import('../../apps/DevAssistant'),
  DevToolbox: () => import('../../apps/DevToolbox'),
  DevTools: () => import('../../apps/DevTools'),
  DevOpsTools: () => import('../../apps/DevOpsTools'),
  SmartDevFlow: () => import('../../apps/SmartDevFlow'),
  APILab: () => import('../../apps/APILab'),
  APITesterPro: () => import('../../apps/APITesterPro'),
  ApiTester: () => import('../../apps/ApiTester'),
  ApiTesterEnhanced: () => import('../../apps/ApiTesterEnhanced'),
  ApiDocsViewer: () => import('../../apps/ApiDocsViewer'),
  ApiDocsViewerEnhanced: () => import('../../apps/ApiDocsViewerEnhanced'),
  RESTClient: () => import('../../apps/RESTClient'),
  OnlineAPIHub: () => import('../../apps/OnlineAPIHub'),
  Chat: () => import('../../apps/Chat'),
  Contacts: () => import('../../apps/Contacts'),
  Email: () => import('../../apps/Email'),
  GlobalSearch: () => import('../../apps/GlobalSearch'),
  QuickLauncher: () => import('../../apps/QuickLauncher'),
  QuickCommands: () => import('../../apps/QuickCommands'),
  QuickNotesPro: () => import('../../apps/QuickNotesPro'),
  SmartSearch: () => import('../../apps/SmartSearch'),
  SmartNotes: () => import('../../apps/SmartNotes'),
  SmartNotesEnhanced: () => import('../../apps/SmartNotesEnhanced'),
  SmartDashboard: () => import('../../apps/SmartDashboard'),
  SmartHub: () => import('../../apps/SmartHub'),
  SmartProjectHub: () => import('../../apps/SmartProjectHub'),
  SmartScheduleAssistant: () => import('../../apps/SmartScheduleAssistant'),
  SmartPasswordManager2: () => import('../../apps/SmartPasswordManager'),
  UnifiedDashboard: () => import('../../apps/UnifiedDashboard'),
  RealTimeDashboard: () => import('../../apps/RealTimeDashboard'),
  RealTimeTranslator: () => import('../../apps/RealTimeTranslator'),
  VoiceTranscriber: () => import('../../apps/VoiceTranscriber'),
  SoundRecorder: () => import('../../apps/SoundRecorder'),
  Camera: () => import('../../apps/Camera'),
  ComponentSandbox: () => import('../../apps/ComponentSandbox'),
  CreativeToolkit: () => import('../../apps/CreativeToolkit'),
  ColorPicker: () => import('../../apps/ColorPicker'),
  ColorPaletteGenerator: () => import('../../apps/ColorPaletteGenerator'),
  CSSToolbox: () => import('../../apps/CSSToolbox'),
  MarkdownEditor: () => import('../../apps/MarkdownEditor'),
  MarkdownPreview: () => import('../../apps/MarkdownPreview'),
  MarkdownPreviewer: () => import('../../apps/MarkdownPreviewer'),
  MarkdownSlides: () => import('../../apps/MarkdownSlides'),
  MarkdownToHTML: () => import('../../apps/MarkdownToHTML'),
  Spreadsheet: () => import('../../apps/Spreadsheet'),
  Presentation: () => import('../../apps/Presentation'),
  TaskBoard: () => import('../../apps/TaskBoard'),
  TaskDashboard: () => import('../../apps/TaskDashboard'),
  TaskManager: () => import('../../apps/TaskManager'),
  TaskManagerPlus: () => import('../../apps/TaskManagerPlus'),
  TaskManagerPro: () => import('../../apps/TaskManagerPro'),
  TaskAutomation: () => import('../../apps/TaskAutomation'),
  ProductivityHub: () => import('../../apps/ProductivityHub'),
  ProjectPlanner: () => import('../../apps/ProjectPlanner'),
  ProjectManager: () => import('../../apps/ProjectManager'),
  IdeaBoard: () => import('../../apps/IdeaBoard'),
  IdeaCapture: () => import('../../apps/IdeaCapture'),
  KanbanBoard: () => import('../../apps/KanbanBoard'),
  MindMap: () => import('../../apps/MindMap'),
  StickyNotesWall: () => import('../../apps/StickyNotesWall'),
  Whiteboard: () => import('../../apps/Whiteboard'),
  WhiteboardPro: () => import('../../apps/WhiteboardPro'),
  CollaborativeWhiteboard: () => import('../../apps/CollaborativeWhiteboard'),
  DailyInspo: () => import('../../apps/DailyInspo'),
  HabitTracker: () => import('../../apps/HabitTracker'),
  Flashcards: () => import('../../apps/Flashcards'),
  KnowledgeCards: () => import('../../apps/KnowledgeCards'),
  LearningPlatform: () => import('../../apps/LearningPlatform'),
  RecipeBook: () => import('../../apps/RecipeBook'),
  ChinesePoetry: () => import('../../apps/ChinesePoetry'),
  Dictionary: () => import('../../apps/Dictionary'),
  WikipediaReader: () => import('../../apps/WikipediaReader'),
  HackerNewsReader: () => import('../../apps/HackerNewsReader'),
  NewsReader: () => import('../../apps/NewsReader'),
  SmartNewsReader: () => import('../../apps/SmartNewsReader'),
  RSSReader: () => import('../../apps/RSSReader'),
  GitHubExplorer: () => import('../../apps/GitHubExplorer'),
  GitHubTrending: () => import('../../apps/GitHubTrending'),
  NetworkMonitor: () => import('../../apps/NetworkMonitor'),
  NetworkSpeedTest: () => import('../../apps/NetworkSpeedTest'),
  NetworkExplorer: () => import('../../apps/NetworkExplorer'),
  WiFiManager: () => import('../../apps/WiFiManager'),
  BluetoothManager: () => import('../../apps/BluetoothManager'),
  Firewall: () => import('../../apps/Firewall'),
  DnsLookup: () => import('../../apps/DnsLookup'),
  IPLookup: () => import('../../apps/IPLookup'),
  SystemDashboard: () => import('../../apps/SystemDashboard'),
  SystemStatusDashboard: () => import('../../apps/SystemStatusDashboard'),
  SystemHealthDashboard: () => import('../../apps/SystemHealthDashboard'),
  SystemHealthDashboardEnhanced: () => import('../../apps/SystemHealthDashboardEnhanced'),
  SystemHealthCheck: () => import('../../apps/SystemHealthCheck'),
  SystemToolbox: () => import('../../apps/SystemToolbox'),
  PerformanceMonitor: () => import('../../apps/PerformanceMonitor'),
  ProcessMonitor: () => import('../../apps/ProcessMonitor'),
  DiskUsage: () => import('../../apps/DiskUsage'),
  DiskUtility: () => import('../../apps/DiskUtility'),
  LogViewer: () => import('../../apps/LogViewer'),
  ActivityTracker: () => import('../../apps/ActivityTracker'),
  UserManager: () => import('../../apps/UserManager'),
  PowerManager: () => import('../../apps/PowerManager'),
  BackupTool: () => import('../../apps/BackupTool'),
  CloudSync: () => import('../../apps/CloudSync'),
  PackageManager: () => import('../../apps/PackageManager'),
  SoftwareCenter: () => import('../../apps/SoftwareCenter'),
  ArchiveManager: () => import('../../apps/ArchiveManager'),
  ClipboardManager: () => import('../../apps/ClipboardManager'),
  ClipboardManagerAdvanced: () => import('../../apps/ClipboardManagerAdvanced'),
  ClipboardHistory: () => import('../../apps/ClipboardHistory'),
  BookmarkManager: () => import('../../apps/BookmarkManager'),
  Magnifier: () => import('../../apps/Magnifier'),
  FontViewer: () => import('../../apps/FontViewer'),
  CommandReference: () => import('../../apps/CommandReference'),
  AutoFlow: () => import('../../apps/AutoFlow'),
  CronTools: () => import('../../apps/CronTools'),
  RandomTools: () => import('../../apps/RandomTools'),
  OnlineToolkit: () => import('../../apps/OnlineToolkit'),
  QuickTools: () => import('../../apps/RandomTools'),
  CodeCollaborationHub: () => import('../../apps/CodeCollaborationHub'),
  WebDevToolkit: () => import('../../apps/WebDevToolkit'),
  WebToolsHub: () => import('../../apps/WebToolsHub'),
  WebServicesToolbox: () => import('../../apps/WebServicesToolbox'),
  AdvancedDataViz: () => import('../../apps/AdvancedDataViz'),
  DataViz: () => import('../../apps/DataViz'),
  DataVisualizer: () => import('../../apps/DataVisualizer'),
  DataExporter: () => import('../../apps/DataExporter'),
  Maps: () => import('../../apps/Maps'),
  CryptoTracker: () => import('../../apps/CryptoTracker'),
  CountryInfo: () => import('../../apps/CountryInfo'),
  StockTracker: () => import('../../apps/StockTracker'),
  AirQualityMonitor: () => import('../../apps/AirQualityMonitor'),
  Weather2: () => import('../../apps/Weather'),
  MusicStudio: () => import('../../apps/MusicStudio'),
  MusicVisualizer: () => import('../../apps/MusicVisualizer'),
  ImageOptimizer: () => import('../../apps/ImageOptimizer'),
  WallpaperGallery: () => import('../../apps/WallpaperGallery'),
  SpaceExplorer: () => import('../../apps/SpaceExplorer'),
  SpaceExplorerPro: () => import('../../apps/SpaceExplorerPro'),
  ParticleSystem: () => import('../../apps/ParticleSystem'),
  VirtualPet: () => import('../../apps/VirtualPet'),
  FocusMode: () => import('../../apps/FocusMode'),
  GameSnake: () => import('../../apps/GameSnake'),
  GameTetris: () => import('../../apps/GameTetris'),
  PasswordManagerEnhanced: () => import('../../apps/PasswordManagerEnhanced'),
  DevToolboxPro: () => import('../../apps/DevToolboxPro'),
  MarkdownEditorPro: () => import('../../apps/MarkdownEditorPro'),
  SystemMonitorPro: () => import('../../apps/SystemMonitorPro'),
  PomodoroPro: () => import('../../apps/PomodoroPro'),
  // === 新增创新应用 ===
  AIProgrammingAssistantPro: () => import('../../apps/AIProgrammingAssistantPro'),
  RealTimeDataDashboard: () => import('../../apps/RealTimeDataDashboard'),
  CollaborativeWhiteboardEnhanced: () => import('../../apps/CollaborativeWhiteboardEnhanced'),
  // === v3.2.0 新增应用（显式注册以优化打包） ===
  JwtDecoder: () => import('../../apps/JwtDecoder'),
  ColorPaletteExtractor: () => import('../../apps/ColorPaletteExtractor'),
  // === v13.0.0 新增创新应用 ===
  CodeInterviewPrep: () => import('../../apps/CodeInterviewPrep'),
  APIPlayground: () => import('../../apps/APIPlayground'),
  DataVizStudio: () => import('../../apps/DataVizStudio'),
  PasswordStrength: () => import('../../apps/PasswordStrength'),
  // === v5.0.0 新增创新应用 ===
  NetworkToolkit: () => import('../../apps/NetworkToolkit'),
  CodeLab: () => import('../../apps/CodeLab'),
  SmartCodeAssistant: () => import('../../apps/SmartCodeAssistant'),
  // === v6.4.0 新增应用 ===
  KnowledgeGarden: () => import('../../apps/KnowledgeGarden'),
  WebClipper: () => import('../../apps/WebClipper'),
  // === v7.0.0 新增应用 ===
  AISmartHub: () => import('../../apps/AISmartHub'),
  UtilityHub: () => import('../../apps/UtilityHub'),
  APIPlaybook: () => import('../../apps/APIPlaybook'),
  IconGallery: () => import('../../apps/IconGallery'),
  WorldClock: () => import('../../apps/WorldClock'),
  APIExplorer: () => import('../../apps/APIExplorer'),
  // === v8.0.0 新增应用 ===
  DevHub: () => import('../../apps/DevHub'),
  AIAssistantEnhanced: () => import('../../apps/AIAssistantEnhanced'),
  APIExplorerEnhanced: () => import('../../apps/APIExplorerEnhanced'),
  // === v8.1.0 新增公共 API 集成应用 ===
  AstroDaily: () => import('../../apps/AstroDaily'),
  ReadingList: () => import('../../apps/ReadingList'),
  GitHubProfile: () => import('../../apps/GitHubProfile'),
  // === v8.2.0 新增实用工具 ===
  HashGenerator: () => import('../../apps/HashGenerator'),
  // === v9.0.0 新增创新应用 ===
  AICodeAnalyzer: () => import('../../apps/AICodeAnalyzer'),
  NetworkStatusDashboard: () => import('../../apps/NetworkStatusDashboard'),
  SystemOptimizer: () => import('../../apps/SystemOptimizer'),
  // === v9.1.0 新增实时协作应用 ===
  RealTimeCollaborativeWhiteboard: () => import('../../apps/RealTimeCollaborativeWhiteboard'),
  // === v9.2.0 新增工作流自动化应用 ===
  WorkflowAutomation: () => import('../../apps/WorkflowAutomation'),
  // === v12.1.0 新增实用工具箱 ===
  UtilityToolkit: () => import('../../apps/UtilityToolkit'),
  // === v13.0 新增智能AI中心 ===
  SmartAIHub: () => import('../../apps/SmartAIHub'),
  // === v19.0 新增实时全球情报仪表盘 ===
  WorldPulse: () => import('../../apps/WorldPulse'),
}

const componentCache: Record<string, React.LazyExoticComponent<React.ComponentType<any>>> = {}
const preloadedComponents = new Set<string>()
const loadingStates = new Map<string, 'loading' | 'loaded' | 'error'>()

function loadComponent(name: string): React.LazyExoticComponent<React.ComponentType<any>> {
  if (componentCache[name]) {
    return componentCache[name]
  }

  if (componentMap[name]) {
    loadingStates.set(name, 'loading')
    componentCache[name] = lazy(componentMap[name])
    componentMap[name]().then(() => {
      loadingStates.set(name, 'loaded')
    }).catch(() => {
      loadingStates.set(name, 'error')
    })
    return componentCache[name]
  }

  loadingStates.set(name, 'loading')
  componentCache[name] = lazy(() =>
    import(`../../apps/${name}.tsx`)
      .then((module) => {
        loadingStates.set(name, 'loaded')
        return { default: module.default }
      })
      .catch(() => {
        loadingStates.set(name, 'error')
        return {
          default: () => (
            <div
              style={{
                padding: 40,
                color: 'var(--text-secondary)',
                textAlign: 'center',
                fontSize: 14,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                height: '100%',
                flexDirection: 'column',
                gap: 12,
              }}
            >
              <span style={{ fontSize: 48 }}>⚠️</span>
              <div>
                <span style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{name}</span>
                {' '}
                - 应用加载失败
              </div>
              <div style={{ fontSize: 12, opacity: 0.7 }}>
                组件文件可能缺失或已重命名，请检查应用配置。
              </div>
              <button
                onClick={() => window.location.reload()}
                style={{
                  padding: '8px 16px',
                  borderRadius: 6,
                  border: 'none',
                  background: 'var(--accent)',
                  color: '#fff',
                  cursor: 'pointer',
                  fontSize: 12,
                  transition: 'background 0.2s',
                }}
              >
                重新加载页面
              </button>
            </div>
          ),
        }
      }),
  )
  return componentCache[name]
}

function preloadComponents() {
  if (typeof window === 'undefined') return

  const criticalComponents = [
    'Terminal',
    'FileManager',
    'Calculator',
    'SystemSettings',
    'Notepad',
    'Calendar',
    'About',
    'Weather',
    'WorldPulse',
  ]

  const secondaryComponents = [
    'Notes',
    'CodeEditor',
    'WebBrowser',
    'MusicPlayer',
    'ImageViewer',
    'PDFViewer',
    'TaskManager',
    'PasswordManager',
  ]

  const developmentComponents = [
    'CodeRunner',
    'JSONFormatter',
    'RegexTester',
    'Base64Tools',
    'UnitConverter',
    'RESTClient',
    'DevToolbox',
  ]

  const loadWithPriority = (components: string[], delay: number) => {
    components.forEach((name, index) => {
      if (preloadedComponents.has(name)) return
      preloadedComponents.add(name)
      
      const loadFn = () => {
        try {
          loadComponent(name)
        } catch {
          // 静默忽略预加载错误
        }
      }

      if ('requestIdleCallback' in window) {
        const idleCallback = (window as unknown as { 
          requestIdleCallback: (cb: () => void, options?: { timeout?: number }) => void 
        }).requestIdleCallback
        idleCallback(loadFn, { timeout: delay + index * 100 })
      } else {
        setTimeout(loadFn, delay + index * 150)
      }
    })
  }

  loadWithPriority(criticalComponents, 500)
  
  if ('requestIdleCallback' in window) {
    const idleCallback = (window as unknown as { requestIdleCallback: (cb: () => void) => void }).requestIdleCallback
    idleCallback(() => {
      loadWithPriority(secondaryComponents, 0)
    })
    idleCallback(() => {
      loadWithPriority(developmentComponents, 0)
    })
  } else {
    setTimeout(() => loadWithPriority(secondaryComponents, 0), 2000)
    setTimeout(() => loadWithPriority(developmentComponents, 0), 3500)
  }

  document.addEventListener('visibilitychange', () => {
    if (!document.hidden && preloadedComponents.size < 40) {
      setTimeout(() => {
        const additionalComponents = [
          'TextEditor',
          'Paint',
          'Translator',
          'ChatAI',
          'MarkdownEditor',
          'KanbanBoard',
        ]
        loadWithPriority(additionalComponents.filter(c => !preloadedComponents.has(c)), 0)
      }, 1000)
    }
  })
}

const LoadingFallback = memo(function LoadingFallback() {
  const [showSlowMsg, setShowSlowMsg] = useState(false)
  const [showRetry, setShowRetry] = useState(false)

  useEffect(() => {
    const slowTimer = setTimeout(() => setShowSlowMsg(true), 1500)
    const retryTimer = setTimeout(() => setShowRetry(true), 8000)
    return () => {
      clearTimeout(slowTimer)
      clearTimeout(retryTimer)
    }
  }, [])

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 16,
        color: 'var(--text-secondary)',
        fontSize: 13,
        padding: 40,
        width: '100%',
        height: '100%',
      }}
    >
      <div
        style={{
          width: 40,
          height: 40,
          border: '3px solid var(--window-border)',
          borderTopColor: 'var(--accent)',
          borderRadius: '50%',
          animation: 'spin 0.8s linear infinite',
          boxShadow: '0 0 20px var(--accent-glow)',
        }}
      />
      <div style={{ textAlign: 'center', display: 'flex', flexDirection: 'column', gap: 8 }}>
        <span>正在加载应用…</span>
        {showSlowMsg && (
          <span style={{ fontSize: 11, opacity: 0.6 }}>首次加载可能需要一些时间，请稍候</span>
        )}
        {showRetry && (
          <button
            onClick={() => window.location.reload()}
            style={{
              padding: '6px 14px',
              borderRadius: 6,
              border: '1px solid var(--window-border)',
              background: 'var(--window-bg)',
              color: 'var(--text-primary)',
              cursor: 'pointer',
              fontSize: 12,
              marginTop: 8,
              transition: 'all 0.2s',
              alignSelf: 'center',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.borderColor = 'var(--accent)'
              e.currentTarget.style.background = 'var(--accent-bg)'
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.borderColor = 'var(--window-border)'
              e.currentTarget.style.background = 'var(--window-bg)'
            }}
          >
            加载超时，点击重试
          </button>
        )}
      </div>
      <div
        style={{
          width: 200,
          height: 4,
          background: 'var(--window-border)',
          borderRadius: 2,
          overflow: 'hidden',
        }}
      >
        <div
          style={{
            width: '50%',
            height: '100%',
            background: 'var(--accent-gradient)',
            animation: 'shimmer 1.5s ease-in-out infinite',
          }}
        />
      </div>
    </div>
  )
})

const WindowManager = memo(function WindowManager() {
  const windows = useStore((s) => s.windows)
  const apps = useStore((s) => s.apps)
  const currentDesktop = useStore((s) => s.currentDesktop)
  const windowsPerDesktop = useStore((s) => s.windowsPerDesktop)

  const preloadedRef = useRef(false)

  useEffect(() => {
    if (!preloadedRef.current) {
      preloadComponents()
      preloadedRef.current = true
    }
  }, [])

  const memoizedWindows = useMemo(() => {
    const currentDesktopWindows = windowsPerDesktop[currentDesktop] || []
    const appMap = new Map(apps.map((app) => [app.id, app]))

    return windows
      .filter((win) => currentDesktopWindows.includes(win.id))
      .map((win) => {
        const app = appMap.get(win.appId) ?? apps.find((a) => a.id === win.appId)
        if (!app) return null
        const Component = loadComponent(app.component)
        return { win, Component, app }
      })
      .filter(Boolean) as WindowComponent[]
  }, [windows, apps, currentDesktop, windowsPerDesktop])

  useEffect(() => {
    const handleVisibilityChange = () => {
      // 仅在页面可见时才处理窗口overflow，避免后台运行时不必要的样式计算
      if (document.hidden) {
        document.body.style.setProperty('overflow', 'hidden')
      } else {
        document.body.style.removeProperty('overflow')
      }
    }
    document.addEventListener('visibilitychange', handleVisibilityChange)
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange)
  }, [])

  return (
    <>
      {memoizedWindows.map(({ win, Component }) => (
        <Window key={win.id} window={win}>
          <ErrorBoundary>
            <Suspense fallback={<LoadingFallback />}>
              <Component />
            </Suspense>
          </ErrorBoundary>
        </Window>
      ))}
    </>
  )
})

export default WindowManager
