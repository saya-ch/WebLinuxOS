import { Suspense, lazy, useEffect, memo, useMemo, useRef, useState } from 'react'
import { useStore } from '../../store'
import Window from './Window'
import ErrorBoundary from '../ErrorBoundary'
import type { WindowState, AppDefinition } from '../../types'

interface WindowComponent {
  win: WindowState
  Component: React.LazyExoticComponent<React.ComponentType<Record<string, unknown> | undefined>>
  app: AppDefinition
}

/**
 * componentMap：将常用应用组件名（字符串）映射到懒加载组件。
 * 这是组件解析的首选方式，比动态拼接路径的 `import()` 更可靠，
 * 也便于后续的静态分析和 Tree Shaking。
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const componentMap: Record<string, () => Promise<{ default: React.ComponentType<any> }>> = {
  OnlineCodeRunnerPro: () => import('../../apps/OnlineCodeRunnerPro'),
  WeatherLive: () => import('../../apps/WeatherLive'),
  WeatherDashboard: () => import('../../apps/WeatherDashboard'),
  PromptEngineeringLab: () => import('../../apps/PromptEngineeringLab'),
  WebsitePerformanceTester: () => import('../../apps/WebsitePerformanceTester'),
  JsonCrusher: () => import('../../apps/JsonCrusher'),
  CssStudio: () => import('../../apps/CssStudio'),
  RealTimeCollaborationHub: () => import('../../apps/RealTimeCollaborationHub'),
  SmartKnowledgeGraph: () => import('../../apps/SmartKnowledgeGraph'),
  StudioSuite: () => import('../../apps/StudioSuite'),
  InfoPulseCenter: () => import('../../apps/InfoPulseCenter'),
  SmartWorkbench: () => import('../../apps/SmartWorkbench'),
  RealSystemMonitor: () => import('../../apps/RealSystemMonitor'),
  RealClipboardHistory: () => import('../../apps/RealClipboardHistory'),
  About: () => import('../../apps/About'),
  BookFinder: () => import('../../apps/BookFinder'),
  ActivityHeatmap: () => import('../../apps/ActivityHeatmap'),
  ActivityTracker: () => import('../../apps/ActivityTracker'),
  AdvancedDataViz: () => import('../../apps/AdvancedDataViz'),
  RealTimeCodeCollab: () => import('../../apps/RealTimeCodeCollab'),
  AICodeAnalyzerPro: () => import('../../apps/AICodeAnalyzerPro'),
  AudioViz: () => import('../../apps/AudioViz'),
  AIAssistant: () => import('../../apps/AIAssistant'),
  AIAssistantEnhanced: () => import('../../apps/AIAssistantEnhanced'),
  AIAssistantPro: () => import('../../apps/AIAssistantPro'),
  AIAssistantUltra: () => import('../../apps/AIAssistantUltra'),
  AIChat: () => import('../../apps/AIChat'),
  AIChatAssistant: () => import('../../apps/AIChatAssistant'),
  AIChatEnhanced: () => import('../../apps/AIChatEnhanced'),
  AICodeAnalyzer: () => import('../../apps/AICodeAnalyzer'),
  AICodeAssistant: () => import('../../apps/AICodeAssistant'),
  AICodeCompanion: () => import('../../apps/AICodeCompanion'),
  AICodeTutor: () => import('../../apps/AICodeTutor'),
  AIGenerator: () => import('../../apps/AIGenerator'),
  AIImageStudio: () => import('../../apps/AIImageStudio'),
  AIHelper: () => import('../../apps/AIHelper'),
  AILearningCompanion: () => import('../../apps/AILearningCompanion'),
  AIProgrammingAssistantPro: () => import('../../apps/AIProgrammingAssistantPro'),
  AIPromptLibrary: () => import('../../apps/AIPromptLibrary'),
  AirQualityMonitor: () => import('../../apps/AirQualityMonitor'),
  AISmartAssistant: () => import('../../apps/AISmartAssistant'),
  AISmartHub: () => import('../../apps/AISmartHub'),
  AITaskAssistant: () => import('../../apps/AITaskAssistant'),
  AIUltimateAssistant: () => import('../../apps/AIUltimateAssistant'),
  AIWorkbench: () => import('../../apps/AIWorkbench'),
  AIWorkflowAssistant: () => import('../../apps/AIWorkflowAssistant'),
  ApiDocsViewer: () => import('../../apps/ApiDocsViewer'),
  ApiDocsViewerEnhanced: () => import('../../apps/ApiDocsViewerEnhanced'),
  APIExplorer: () => import('../../apps/APIExplorer'),
  APIExplorerEnhanced: () => import('../../apps/APIExplorerEnhanced'),
  APIExplorerPro: () => import('../../apps/APIExplorerPro'),
  APIHealthMonitor: () => import('../../apps/APIHealthMonitor'),
  APILab: () => import('../../apps/APILab'),
  APIPlaybook: () => import('../../apps/APIPlaybook'),
  APIPlayground: () => import('../../apps/APIPlayground'),
  ApiTester: () => import('../../apps/ApiTester'),
  ApiTesterEnhanced: () => import('../../apps/ApiTesterEnhanced'),
  APITesterPro: () => import('../../apps/APITesterPro'),
  SystemInfoPro: () => import('../../apps/SystemInfoPro'),
  WebCodeRunner: () => import('../../apps/WebCodeRunner'),
  ArchiveManager: () => import('../../apps/ArchiveManager'),
  AstroDaily: () => import('../../apps/AstroDaily'),
  AutoFlow: () => import('../../apps/AutoFlow'),
  BackupTool: () => import('../../apps/BackupTool'),
  Base64Tools: () => import('../../apps/Base64Tools'),
  BrowserInfo: () => import('../../apps/BrowserInfo'),
  BluetoothManager: () => import('../../apps/BluetoothManager'),
  BookmarkManager: () => import('../../apps/BookmarkManager'),
  Calculator: () => import('../../apps/Calculator'),
  Calendar: () => import('../../apps/Calendar'),
  Camera: () => import('../../apps/Camera'),
  CharacterMap: () => import('../../apps/CharacterMap'),
  Chat: () => import('../../apps/Chat'),
  ChatAI: () => import('../../apps/ChatAI'),
  ChinesePoetry: () => import('../../apps/ChinesePoetry'),
  ClipboardHistory: () => import('../../apps/ClipboardHistory'),
  ClipboardManager: () => import('../../apps/ClipboardManager'),
  ClipboardManagerAdvanced: () => import('../../apps/ClipboardManagerAdvanced'),
  Clock: () => import('../../apps/Clock'),
  CloudClipboard: () => import('../../apps/CloudClipboard'),
  CloudSync: () => import('../../apps/CloudSync'),
  CodeAssistantPro: () => import('../../apps/CodeAssistantPro'),
  CodeCollaborationHub: () => import('../../apps/CodeCollaborationHub'),
  CodeCollaborationPlatform: () => import('../../apps/CodeCollaborationPlatform'),
  CodeDiffViewer: () => import('../../apps/CodeDiffViewer'),
  CodeDiffViewerEnhanced: () => import('../../apps/CodeDiffViewerEnhanced'),
  CodeEditor: () => import('../../apps/CodeEditor'),
  CodeForge: () => import('../../apps/CodeForge'),
  CodeFormatter: () => import('../../apps/CodeFormatter'),
  CodeGenerator: () => import('../../apps/CodeGenerator'),
  CodeInterpreter: () => import('../../apps/CodeInterpreter'),
  CodeInterviewPrep: () => import('../../apps/CodeInterviewPrep'),
  CodeLab: () => import('../../apps/CodeLab'),
  CodePenLite: () => import('../../apps/CodePenLite'),
  CodePlayground: () => import('../../apps/CodePlayground'),
  CodeReviewer: () => import('../../apps/CodeReviewer'),
  CodeRunner: () => import('../../apps/CodeRunner'),
  CodeRunnerAdvanced: () => import('../../apps/CodeRunnerAdvanced'),
  CodeSandbox: () => import('../../apps/CodeSandbox'),
  CodeSearch: () => import('../../apps/CodeSearch'),
  CodeShare: () => import('../../apps/CodeShare'),
  CodeSnippetHub: () => import('../../apps/CodeSnippetHub'),
  CodeSnippetLibrary: () => import('../../apps/CodeSnippetLibrary'),
  CodeSnippetShare: () => import('../../apps/CodeSnippetShare'),
  CodeSnippetsManager: () => import('../../apps/CodeSnippetsManager'),
  CodeStudio: () => import('../../apps/CodeStudio'),
  CollaborativeWhiteboard: () => import('../../apps/CollaborativeWhiteboard'),
  CollaborativeWhiteboardEnhanced: () => import('../../apps/CollaborativeWhiteboardEnhanced'),
  ColorPaletteExtractor: () => import('../../apps/ColorPaletteExtractor'),
  ColorPaletteGenerator: () => import('../../apps/ColorPaletteGenerator'),
  ColorPicker: () => import('../../apps/ColorPicker'),
  CommandReference: () => import('../../apps/CommandReference'),
  ComponentSandbox: () => import('../../apps/ComponentSandbox'),
  Contacts: () => import('../../apps/Contacts'),
  CountryInfo: () => import('../../apps/CountryInfo'),
  CreativeInspirationWorkshop: () => import('../../apps/CreativeInspirationWorkshop'),
  CreativeToolkit: () => import('../../apps/CreativeToolkit'),
  CronTools: () => import('../../apps/CronTools'),
  CryptoTracker: () => import('../../apps/CryptoTracker'),
  CssGradientStudio: () => import('../../apps/CssGradientStudio'),
  CSSToolbox: () => import('../../apps/CSSToolbox'),
  CurrencyConverter: () => import('../../apps/CurrencyConverter'),
  CurrencyLive: () => import('../../apps/CurrencyLive'),
  CyberHub: () => import('../../apps/CyberHub'),
  DailyInspo: () => import('../../apps/DailyInspo'),
  DataExporter: () => import('../../apps/DataExporter'),
  DataVisualizer: () => import('../../apps/DataVisualizer'),
  DataViz: () => import('../../apps/DataViz'),
  DataVizDashboard: () => import('../../apps/DataVizDashboard'),
  DataVizStudio: () => import('../../apps/DataVizStudio'),
  DateCalculator: () => import('../../apps/DateCalculator'),
  DevBox: () => import('../../apps/DevBox'),
  DevAssistant: () => import('../../apps/DevAssistant'),
  DevConsole: () => import('../../apps/DevConsole'),
  DevEcosystem: () => import('../../apps/DevEcosystem'),
  DeveloperToolbox: () => import('../../apps/DeveloperToolbox'),
  DevForge: () => import('../../apps/DevForge'),
  DevHub: () => import('../../apps/DevHub'),
  DevKit: () => import('../../apps/DevKit'),
  DevOpsTools: () => import('../../apps/DevOpsTools'),
  DevToolbox: () => import('../../apps/DevToolbox'),
  DevToolboxCentral: () => import('../../apps/DevToolboxCentral'),
  DevToolboxPro: () => import('../../apps/DevToolboxPro'),
  DevToolkit: () => import('../../apps/DevToolkit'),
  DevTools: () => import('../../apps/DevTools'),
  DevWorkbench: () => import('../../apps/DevWorkbench'),
  Dictionary: () => import('../../apps/Dictionary'),
  DiskUsage: () => import('../../apps/DiskUsage'),
  DiskUtility: () => import('../../apps/DiskUtility'),
  DnsLookup: () => import('../../apps/DnsLookup'),
  DrawPad: () => import('../../apps/DrawPad'),
  Email: () => import('../../apps/Email'),
  EmojiBrowser: () => import('../../apps/EmojiBrowser'),
  FileManager: () => import('../../apps/FileManager'),
  Firewall: () => import('../../apps/Firewall'),
  Flashcards: () => import('../../apps/Flashcards'),
  FlowBoard: () => import('../../apps/FlowBoard'),
  FocusMode: () => import('../../apps/FocusMode'),
  FontViewer: () => import('../../apps/FontViewer'),
  Game2048: () => import('../../apps/Game2048'),
  GameBreakout: () => import('../../apps/GameBreakout'),
  GameMemory: () => import('../../apps/GameMemory'),
  GameSnake: () => import('../../apps/GameSnake'),
  GameTetris: () => import('../../apps/GameTetris'),
  GitCheatsheet: () => import('../../apps/GitCheatsheet'),
  GitHubExplorer: () => import('../../apps/GitHubExplorer'),
  GitHubProfile: () => import('../../apps/GitHubProfile'),
  GitHubTrending: () => import('../../apps/GitHubTrending'),
  GitHubTrendingApp: () => import('../../apps/GitHubTrendingApp'),
  GlobalSearch: () => import('../../apps/GlobalSearch'),
  GlobalInsights: () => import('../../apps/GlobalInsights'),
  GeoAtlas: () => import('../../apps/GeoAtlas'),
  WebSpeechSynth: () => import('../../apps/WebSpeechSynth'),
  ScreenCapture: () => import('../../apps/ScreenCapture'),
  FileHashCalc: () => import('../../apps/FileHashCalc'),
  WebSerialTerminal: () => import('../../apps/WebSerialTerminal'),
  HabitTracker: () => import('../../apps/HabitTracker'),
  HackerNewsReader: () => import('../../apps/HackerNewsReader'),
  HashGenerator: () => import('../../apps/HashGenerator'),
  Help: () => import('../../apps/Help'),
  HttpStatusExplorer: () => import('../../apps/HttpStatusExplorer'),
  IconGallery: () => import('../../apps/IconGallery'),
  IdeaBoard: () => import('../../apps/IdeaBoard'),
  IdeaCapture: () => import('../../apps/IdeaCapture'),
  IdeaStream: () => import('../../apps/IdeaStream'),
  ImageOptimizer: () => import('../../apps/ImageOptimizer'),
  ImageViewer: () => import('../../apps/ImageViewer'),
  IntelligentCodeAssistant: () => import('../../apps/IntelligentCodeAssistant'),
  IntelligentCodeGenerator: () => import('../../apps/IntelligentCodeGenerator'),
  IntelligentDashboard: () => import('../../apps/IntelligentDashboard'),
  IPLookup: () => import('../../apps/IPLookup'),
  JSONFormatter: () => import('../../apps/JSONFormatter'),
  JSONSchemaValidator: () => import('../../apps/JSONSchemaValidator'),
  JSONYAMLConverter: () => import('../../apps/JSONYAMLConverter'),
  JwtDecoder: () => import('../../apps/JwtDecoder'),
  KanbanBoard: () => import('../../apps/KanbanBoard'),
  KnowledgeCards: () => import('../../apps/KnowledgeCards'),
  KnowledgeExplorer: () => import('../../apps/KnowledgeExplorer'),
  KnowledgeGarden: () => import('../../apps/KnowledgeGarden'),
  KnowledgeVine: () => import('../../apps/KnowledgeVine'),
  LearningPlatform: () => import('../../apps/LearningPlatform'),
  LiveDashboard: () => import('../../apps/LiveDashboard'),
  LiveDataHub: () => import('../../apps/LiveDataHub'),
  LiveInfoCenter: () => import('../../apps/LiveInfoCenter'),
  LiveWeather: () => import('../../apps/LiveWeather'),
  LocalFileExplorer: () => import('../../apps/LocalFileExplorer'),
  LogViewer: () => import('../../apps/LogViewer'),
  Magnifier: () => import('../../apps/Magnifier'),
  Maps: () => import('../../apps/Maps'),
  MarkdownCollaborator: () => import('../../apps/MarkdownCollaborator'),
  MarkdownEditor: () => import('../../apps/MarkdownEditor'),
  MarkdownEditorPro: () => import('../../apps/MarkdownEditorPro'),
  MarkdownPreview: () => import('../../apps/MarkdownPreview'),
  MarkdownPreviewer: () => import('../../apps/MarkdownPreviewer'),
  MarkdownSlides: () => import('../../apps/MarkdownSlides'),
  MarkdownToHTML: () => import('../../apps/MarkdownToHTML'),
  MindMap: () => import('../../apps/MindMap'),
  MusicPlayer: () => import('../../apps/MusicPlayer'),
  MusicStudio: () => import('../../apps/MusicStudio'),
  MusicVisualizer: () => import('../../apps/MusicVisualizer'),
  NetworkExplorer: () => import('../../apps/NetworkExplorer'),
  NetworkMonitor: () => import('../../apps/NetworkMonitor'),
  NetworkSpeedTest: () => import('../../apps/NetworkSpeedTest'),
  NetworkStatusDashboard: () => import('../../apps/NetworkStatusDashboard'),
  NetworkToolkit: () => import('../../apps/NetworkToolkit'),
  NetworkToolkitPro: () => import('../../apps/NetworkToolkitPro'),
  NewsHub: () => import('../../apps/NewsHub'),
  NewsReader: () => import('../../apps/NewsReader'),
  NexusAI: () => import('../../apps/NexusAI'),
  Notepad: () => import('../../apps/Notepad'),
  Notes: () => import('../../apps/Notes'),
  NotesApp: () => import('../../apps/NotesApp'),
  OnlineAPIHub: () => import('../../apps/OnlineAPIHub'),
  OnlineCodeRunner: () => import('../../apps/OnlineCodeRunner'),
  OnlineCodeRunnerEnhanced: () => import('../../apps/OnlineCodeRunnerEnhanced'),
  OnlineCollabNotebook: () => import('../../apps/OnlineCollabNotebook'),
  OnlineProgrammingLab: () => import('../../apps/OnlineProgrammingLab'),
  OnlineResourceHub: () => import('../../apps/OnlineResourceHub'),
  OnlineCompiler: () => import('../../apps/OnlineCompiler'),
  OnlineToolkit: () => import('../../apps/OnlineToolkit'),
  OnlineToolkitPro: () => import('../../apps/OnlineToolkitPro'),
  PackageManager: () => import('../../apps/PackageManager'),
  Paint: () => import('../../apps/Paint'),
  ParticleSystem: () => import('../../apps/ParticleSystem'),
  PasswordChecker: () => import('../../apps/PasswordChecker'),
  PasswordGenerator: () => import('../../apps/PasswordGenerator'),
  PasswordManager: () => import('../../apps/PasswordManager'),
  PasswordManagerEnhanced: () => import('../../apps/PasswordManagerEnhanced'),
  PasswordStrength: () => import('../../apps/PasswordStrength'),
  PDFViewer: () => import('../../apps/PDFViewer'),
  PerformanceMonitor: () => import('../../apps/PerformanceMonitor'),
  PerformanceDashboard: () => import('../../apps/PerformanceDashboard'),
  PulseBoard: () => import('../../apps/PulseBoard'),
  Pomodoro: () => import('../../apps/Pomodoro'),
  PomodoroPro: () => import('../../apps/PomodoroPro'),
  PomodoroStudio: () => import('../../apps/PomodoroStudio'),
  PowerManager: () => import('../../apps/PowerManager'),
  Presentation: () => import('../../apps/Presentation'),
  ProcessMonitor: () => import('../../apps/ProcessMonitor'),
  ProductivityCenter: () => import('../../apps/ProductivityCenter'),
  ProductivityHub: () => import('../../apps/ProductivityHub'),
  ProjectManager: () => import('../../apps/ProjectManager'),
  ProjectPlanner: () => import('../../apps/ProjectPlanner'),
  PromptForge: () => import('../../apps/PromptForge'),
  QRCodeGeneratorPro: () => import('../../apps/QRCodeGeneratorPro'),
  QRGenerator: () => import('../../apps/QRGenerator'),
  QRGeneratorEnhanced: () => import('../../apps/QRGeneratorEnhanced'),
  QuantumCalculator: () => import('../../apps/QuantumCalculator'),
  QuickCommands: () => import('../../apps/QuickCommands'),
  QuickLauncher: () => import('../../apps/QuickLauncher'),
  QuickNotesPro: () => import('../../apps/QuickNotesPro'),
  RandomTools: () => import('../../apps/RandomTools'),
  ReadingList: () => import('../../apps/ReadingList'),
  RealTimeCollaborativeWhiteboard: () => import('../../apps/RealTimeCollaborativeWhiteboard'),
  RealTimeCollaborativeWhiteboardEnhanced: () => import('../../apps/RealTimeCollaborativeWhiteboardEnhanced'),
  RealTimeDashboard: () => import('../../apps/RealTimeDashboard'),
  RealTimeDashboardEnhanced: () => import('../../apps/RealTimeDashboardEnhanced'),
  RealTimeDataDashboard: () => import('../../apps/RealTimeDataDashboard'),
  RealtimeDocumentEditor: () => import('../../apps/RealtimeDocumentEditor'),
  RealTimeTranslator: () => import('../../apps/RealTimeTranslator'),
  RealTimeTranslatorEnhanced: () => import('../../apps/RealTimeTranslatorEnhanced'),
  RecipeBook: () => import('../../apps/RecipeBook'),
  RecipeLab: () => import('../../apps/RecipeLab'),
  RegexBuilder: () => import('../../apps/RegexBuilder'),
  RegexGolf: () => import('../../apps/RegexGolf'),
  SnippetVault: () => import('../../apps/SnippetVault'),
  WikiExplorer: () => import('../../apps/WikiExplorer'),
  RegexTester: () => import('../../apps/RegexTester'),
  RegexVisualizer: () => import('../../apps/RegexVisualizer'),
  RESTClient: () => import('../../apps/RESTClient'),
  RSSReader: () => import('../../apps/RSSReader'),
  ScreenRecorder: () => import('../../apps/ScreenRecorder'),
  Screenshot: () => import('../../apps/Screenshot'),
  SmartAIHub: () => import('../../apps/SmartAIHub'),
  SmartCodeAssistant: () => import('../../apps/SmartCodeAssistant'),
  SmartDashboard: () => import('../../apps/SmartDashboard'),
  SmartDevFlow: () => import('../../apps/SmartDevFlow'),
  SmartHub: () => import('../../apps/SmartHub'),
  SmartNewsReader: () => import('../../apps/SmartNewsReader'),
  SmartNotes: () => import('../../apps/SmartNotes'),
  SmartNotesEnhanced: () => import('../../apps/SmartNotesEnhanced'),
  SmartNotesPro: () => import('../../apps/SmartNotesPro'),
  SmartOverview: () => import('../../apps/SmartOverview'),
  SmartPasswordManager: () => import('../../apps/SmartPasswordManager'),
  SmartProjectHub: () => import('../../apps/SmartProjectHub'),
  SmartScheduleAssistant: () => import('../../apps/SmartScheduleAssistant'),
  SmartSearch: () => import('../../apps/SmartSearch'),
  SnapStudio: () => import('../../apps/SnapStudio'),
  SoftwareCenter: () => import('../../apps/SoftwareCenter'),
  SoundRecorder: () => import('../../apps/SoundRecorder'),
  SpaceExplorer: () => import('../../apps/SpaceExplorer'),
  SpaceExplorerPro: () => import('../../apps/SpaceExplorerPro'),
  SpeedTest: () => import('../../apps/SpeedTest'),
  Spreadsheet: () => import('../../apps/Spreadsheet'),
  StickyNotesWall: () => import('../../apps/StickyNotesWall'),
  StockTracker: () => import('../../apps/StockTracker'),
  SystemAssistant: () => import('../../apps/SystemAssistant'),
  SystemDashboard: () => import('../../apps/SystemDashboard'),
  SystemDiagnosticsPro: () => import('../../apps/SystemDiagnosticsPro'),
  SystemHealthDashboard: () => import('../../apps/SystemHealthDashboard'),
  SystemHealthDashboardEnhanced: () => import('../../apps/SystemHealthDashboardEnhanced'),
  SystemInfo: () => import('../../apps/SystemInfo'),
  SystemMonitor: () => import('../../apps/SystemMonitor'),
  SystemMonitorDashboard: () => import('../../apps/SystemMonitorDashboard'),
  SystemMonitorPro: () => import('../../apps/SystemMonitorPro'),
  SystemOptimizer: () => import('../../apps/SystemOptimizer'),
  SystemSettings: () => import('../../apps/SystemSettings'),
  SystemStatusDashboard: () => import('../../apps/SystemStatusDashboard'),
  SystemToolbox: () => import('../../apps/SystemToolbox'),
  TaskAutomation: () => import('../../apps/TaskAutomation'),
  TaskBoard: () => import('../../apps/TaskBoard'),
  TaskDashboard: () => import('../../apps/TaskDashboard'),
  TaskManager: () => import('../../apps/TaskManager'),
  TaskManagerPlus: () => import('../../apps/TaskManagerPlus'),
  TaskManagerPro: () => import('../../apps/TaskManagerPro'),
  Terminal: () => import('../../apps/Terminal'),
  NeoTerminal: () => import('../../apps/NeoTerminal'),
  TextDiffViewer: () => import('../../apps/TextDiffViewer'),
  TextEditor: () => import('../../apps/TextEditor'),
  TextFormatter: () => import('../../apps/TextFormatter'),
  TimeManagementMaster: () => import('../../apps/TimeManagementMaster'),
  TimerApp: () => import('../../apps/TimerApp'),
  TodoApp: () => import('../../apps/TodoApp'),
  TodoList: () => import('../../apps/TodoList'),
  Translator: () => import('../../apps/Translator'),
  UnifiedDashboard: () => import('../../apps/UnifiedDashboard'),
  UnitConverter: () => import('../../apps/UnitConverter'),
  URLTools: () => import('../../apps/URLTools'),
  URLToolsEnhanced: () => import('../../apps/URLToolsEnhanced'),
  UserManager: () => import('../../apps/UserManager'),
  UtilityCenter: () => import('../../apps/UtilityCenter'),
  UtilityHub: () => import('../../apps/UtilityHub'),
  UtilityToolkit: () => import('../../apps/UtilityToolkit'),
  UuidTools: () => import('../../apps/UuidTools'),
  VideoPlayer: () => import('../../apps/VideoPlayer'),
  VirtualPet: () => import('../../apps/VirtualPet'),
  VoiceTranscriber: () => import('../../apps/VoiceTranscriber'),
  WallpaperGallery: () => import('../../apps/WallpaperGallery'),
  Weather: () => import('../../apps/Weather'),
  WeatherApp: () => import('../../apps/WeatherApp'),
  WebAssemblyPlayground: () => import('../../apps/WebAssemblyPlayground'),
  WebBrowser: () => import('../../apps/WebBrowser'),
  WebClipper: () => import('../../apps/WebClipper'),
  WebDevToolkit: () => import('../../apps/WebDevToolkit'),
  WebIDE: () => import('../../apps/WebIDE'),
  WebIDEPro: () => import('../../apps/WebIDEPro'),
  WebServicesToolbox: () => import('../../apps/WebServicesToolbox'),
  WebSnapshot: () => import('../../apps/WebSnapshot'),
  PrivacyGuard: () => import('../../apps/PrivacyGuard'),
  JSONForge: () => import('../../apps/JSONForge'),
  CronLab: () => import('../../apps/CronLab'),
  WebToolbox: () => import('../../apps/WebToolbox'),
  WebToolsHub: () => import('../../apps/WebToolsHub'),
  WelcomeHub: () => import('../../apps/WelcomeHub'),
  Whiteboard: () => import('../../apps/Whiteboard'),
  WhiteboardPro: () => import('../../apps/WhiteboardPro'),
  WiFiManager: () => import('../../apps/WiFiManager'),
  WikipediaExplorer: () => import('../../apps/WikipediaExplorer'),
  WikipediaReader: () => import('../../apps/WikipediaReader'),
  WorkflowAutomation: () => import('../../apps/WorkflowAutomation'),
  WorkspaceHub: () => import('../../apps/WorkspaceHub'),
  WorkspaceManager: () => import('../../apps/WorkspaceManager'),
  WorldClock: () => import('../../apps/WorldClock'),
  WorldPulse: () => import('../../apps/WorldPulse'),
  QuickCapture: () => import('../../apps/QuickCapture'),
  APITesterUltra: () => import('../../apps/APITesterUltra'),
  DevShortcuts: () => import('../../apps/DevShortcuts'),
  DevLab: () => import('../../apps/DevLab'),
  DevPortal: () => import('../../apps/DevPortal'),
  NexusHub: () => import('../../apps/NexusHub'),
  EcoTrack: () => import('../../apps/EcoTrack'),
  ExchangeRate: () => import('../../apps/ExchangeRate'),
  OnlineDiceRoller: () => import('../../apps/OnlineDiceRoller'),
  // === v54.1 新增三大创新应用 — NeuroGraph / ImageForge / TimeCapsule
  NeuroGraph: () => import('../../apps/NeuroGraph'),
  ImageForge: () => import('../../apps/ImageForge'),
  TimeCapsule: () => import('../../apps/TimeCapsule'),
  // === v55 新增五大创新实用工具
  OpenAPIHub: () => import('../../apps/OpenAPIHub'),
  ResumeForge: () => import('../../apps/ResumeForge'),
  CodeReviewBot: () => import('../../apps/CodeReviewBot'),
  FlashMaster: () => import('../../apps/FlashMaster'),
  // === v55.2 新增 LivePulse 实时信息中心
  LivePulse: () => import('../../apps/LivePulse'),
  // === v55.3 新增 InsightPulse AI 洞察仪表盘 + CodeDocGen 代码文档生成器
  InsightPulse: () => import('../../apps/InsightPulse'),
  CodeDocGen: () => import('../../apps/CodeDocGen'),
  // === v60 创新应用套件
  AIWikiSearch: () => import('../../apps/AIWikiSearch'),
  CodeSnapShare: () => import('../../apps/CodeSnapShare'),
  WebSummarizer: () => import('../../apps/WebSummarizer'),
  MarkdownSlidesPro: () => import('../../apps/MarkdownSlidesPro'),
  OpenSourceHub: () => import('../../apps/OpenSourceHub'),
  // === v62 三大创新应用套件 ===
  NebulaDashboard: () => import('../../apps/NebulaDashboard'),
  PollinationsAI: () => import('../../apps/PollinationsAI'),
  DevAtlas: () => import('../../apps/DevAtlas'),
  // === v63 安全与创新套件 ===
  SecureVault: () => import('../../apps/SecureVault'),
  CryptoPriceTracker: () => import('../../apps/CryptoPriceTracker'),
  SystemHealthCheck: () => import('../../apps/SystemHealthCheck'),
  JsonWorkbench: () => import('../../apps/JsonWorkbench'),
  TimeTravel: () => import('../../apps/TimeTravel'),
  ColorLab: () => import('../../apps/ColorLab'),
  // === v64 创新应用套件
  UnifiedCommandHub: () => import('../../apps/UnifiedCommandHub'),
  DevPulseHub: () => import('../../apps/DevPulseHub'),
  CryptoMarketHub: () => import('../../apps/CryptoMarketHub'),
  // === v65 新增创新应用 ===
  DnsDiagnostics: () => import('../../apps/DnsDiagnostics'),
  ColorTools: () => import('../../apps/ColorTools'),
  MarkdownPreviewerEnhanced: () => import('../../apps/MarkdownPreviewer'),
  // === v66 创新应用 ===
  QuickQuote: () => import('../../apps/QuickQuote'),
  AstroViewer: () => import('../../apps/AstroViewer'),
  ColorName: () => import('../../apps/ColorName'),
  FontPairing: () => import('../../apps/FontPairing'),
  CodeSnippetPlayground: () => import('../../apps/CodeSnippetPlayground'),
  DailyChallenge: () => import('../../apps/DailyChallenge'),
  DevProductivitySuite: () => import('../../apps/DevProductivitySuite'),
  // === v69 创新应用 ===
  FocusFlow: () => import('../../apps/FocusFlow'),
  QuickShare: () => import('../../apps/QuickShare'),
  RegexMaster: () => import('../../apps/RegexMaster'),
  // === v71 创新应用 ===
  AIDesktopAssistant: () => import('../../apps/AIDesktopAssistant'),
  DeveloperToolkitPro: () => import('../../apps/DeveloperToolkitPro'),
}

const COMPONENT_LOAD_TIMEOUT = 30000
const MAX_RETRY_ATTEMPTS = 2
const MAX_CACHE_SIZE = 100

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const componentCache: Record<string, React.LazyExoticComponent<React.ComponentType<any>>> = {}
const preloadedComponents = new Set<string>()
const loadingStates = new Map<string, 'loading' | 'loaded' | 'error'>()
const retryCounts = new Map<string, number>()
const cacheAccessTimes = new Map<string, number>()

function createErrorFallback(name: string): React.ComponentType {
  return () => (
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
        onClick={() => {
          delete componentCache[name]
          loadingStates.delete(name)
          retryCounts.delete(name)
          window.location.reload()
        }}
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
  )
}

function timeoutPromise<T>(promise: Promise<T>, ms: number): Promise<T> {
  return new Promise((resolve, reject) => {
    const timer = setTimeout(() => reject(new Error('Timeout')), ms)
    promise.then(
      (res) => { clearTimeout(timer); resolve(res) },
      (err) => { clearTimeout(timer); reject(err) }
    )
  })
}

function trimCache() {
  if (Object.keys(componentCache).length <= MAX_CACHE_SIZE) return
  
  const sortedEntries = Array.from(cacheAccessTimes.entries())
    .sort((a, b) => a[1] - b[1])
  
  const toRemove = sortedEntries.slice(0, sortedEntries.length - MAX_CACHE_SIZE)
  toRemove.forEach(([name]) => {
    delete componentCache[name]
    loadingStates.delete(name)
    retryCounts.delete(name)
    cacheAccessTimes.delete(name)
    preloadedComponents.delete(name)
  })
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function loadComponent(name: string): React.LazyExoticComponent<React.ComponentType<any>> {
  if (componentCache[name]) {
    cacheAccessTimes.set(name, Date.now())
    return componentCache[name]
  }

  trimCache()

  const retryCount = retryCounts.get(name) || 0
  
  if (retryCount >= MAX_RETRY_ATTEMPTS) {
    loadingStates.set(name, 'error')
    componentCache[name] = lazy(() => Promise.resolve({ default: createErrorFallback(name) }))
    return componentCache[name]
  }

  loadingStates.set(name, 'loading')

  const doImport = async (): Promise<{ default: React.ComponentType<unknown> }> => {
    // 在每次递归前重新读取最新的重试计数，避免闭包陈旧导致无限递归
    const currentRetry = retryCounts.get(name) || 0

    if (componentMap[name]) {
      try {
        const module = await timeoutPromise(componentMap[name](), COMPONENT_LOAD_TIMEOUT)
        loadingStates.set(name, 'loaded')
        cacheAccessTimes.set(name, Date.now())
        return { default: module.default as React.ComponentType<unknown> }
      } catch (error) {
        const nextRetry = currentRetry + 1
        retryCounts.set(name, nextRetry)
        if (nextRetry < MAX_RETRY_ATTEMPTS) {
          // 真正重试：递归调用前计数已更新，递归内会读取到最新值
          return doImport()
        }
        loadingStates.set(name, 'error')
        return { default: createErrorFallback(name) as React.ComponentType<unknown> }
      }
    }

    try {
      const module = await timeoutPromise(import(`../../apps/${name}.tsx`), COMPONENT_LOAD_TIMEOUT)
      loadingStates.set(name, 'loaded')
      cacheAccessTimes.set(name, Date.now())
      return { default: module.default as React.ComponentType<unknown> }
    } catch (error) {
      const nextRetry = currentRetry + 1
      retryCounts.set(name, nextRetry)
      if (nextRetry < MAX_RETRY_ATTEMPTS) {
        return doImport()
      }
      loadingStates.set(name, 'error')
      return { default: createErrorFallback(name) as React.ComponentType<unknown> }
    }
  }

  componentCache[name] = lazy(doImport)
  return componentCache[name]
}

function preloadComponents(): () => void {
  if (typeof window === 'undefined') return () => {}

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
    'QuickQuote',
    'ColorName',
  ]

  const developmentComponents = [
    'CodeRunner',
    'JSONFormatter',
    'RegexTester',
    'Base64Tools',
    'UnitConverter',
    'RESTClient',
    'DevToolbox',
    'CodeSnippetPlayground',
    'FontPairing',
    'DailyChallenge',
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

  // visibilitychange 的回调：提前定义为具名函数，便于在卸载时移除
  const onVisibilityChange = () => {
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
  }
  
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

  document.addEventListener('visibilitychange', onVisibilityChange)
  // 返回 cleanup 函数，避免在 StrictMode / 重渲染中累积监听器导致内存泄漏
  return () => {
    document.removeEventListener('visibilitychange', onVisibilityChange)
  }
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
  const cleanupRef = useRef<(() => void) | null>(null)

  useEffect(() => {
    if (!preloadedRef.current) {
      cleanupRef.current = preloadComponents()
      preloadedRef.current = true
    }
    return () => {
      // 组件卸载或 StrictMode 重渲染时移除 visibilitychange 监听器
      if (cleanupRef.current) {
        cleanupRef.current()
        cleanupRef.current = null
      }
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
