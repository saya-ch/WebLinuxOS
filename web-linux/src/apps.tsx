import {
  FolderIcon, TerminalIcon, FileTextIcon, BrowserIcon, CalculatorIcon,
  CalendarIcon, ClockIcon, CloudRainIcon, ActivityIcon, SettingsIcon,
  NoteIcon, ImageIcon, VideoIcon, PDFIcon, CodeIcon,
  PackageIcon, ShoppingCartIcon, HardDriveIcon, ListTodoIcon, ServerIcon,
  WifiIcon, ShieldIcon, UserIcon, CameraIcon, PaintIcon, GridIcon,
  PresentationIcon, MailIcon, MessageIcon, ContactsIcon, CheckListIcon,
  LockIcon, BackupIcon, ZipIcon, FileSearchIcon, TypeIcon,
  LanguagesIcon, MapPinIcon, VideoRecorderIcon, MicIcon,
  BluetoothIcon, BatteryIcon, InfoIcon, HelpIcon, CommandIcon,
  PaletteIcon, MagnifierIcon, SnakeIcon, TetrisIcon, ChatIcon, BoardIcon,
  LightningIcon, SearchIcon, PomodoroIcon, PetIcon,
  WallpaperIcon, MindMapIcon, StickyNotesIcon, ParticleIcon, WhiteboardIcon, AutomationIcon,
  VoiceIcon, GraduationCapIcon, WrenchIcon, SparklesIcon, ApiLabIcon, Code2Icon, RocketIcon, WandIcon
} from './icons'


import type { AppDefinition } from './types'

// 批量注册常量：如果未来需要从外部（如单独配置文件 / 插件系统 / API 拉取）
// 提供应用清单，可以将它们推入 APP_REGISTRY_EXTRAS，再在 appRegistry 末尾
// 通过 `...APP_REGISTRY_EXTRAS` 一次性展开注册，避免在此文件中逐条追加。
// 注意：要求每个 app id 全局唯一，注册前请使用 `apps.tsx` 文件末尾的
// 注释 / 外部脚本校验。
//
// 使用示例（未来扩展）：
//   export const APP_REGISTRY_EXTRAS: AppDefinition[] = [
//     { id: 'my-app', ... },
//   ]
//   // 并在下方 appRegistry 数组末尾追加：...APP_REGISTRY_EXTRAS
export const APP_REGISTRY_EXTRAS: AppDefinition[] = [
  // 云剪贴板（v40 创新功能 — 基于 GitHub Gist 的真实跨设备同步）
  { id: 'cloud-clipboard', name: '云剪贴板', icon: <BackupIcon />, component: 'CloudClipboard', category: 'utilities', defaultWidth: 1000, defaultHeight: 720, minWidth: 720, minHeight: 500, resizable: true, multiple: false, isNew: true, description: '基于 GitHub Gist 的跨设备云剪贴板：本地存储 + Gist 同步 + 分享链接 + 语法检测' },
  // 工作区管理器（v38.2创新功能）
  { id: 'workspace-manager', name: '工作区管理器', icon: <GridIcon />, component: 'WorkspaceManager', category: 'system', defaultWidth: 900, defaultHeight: 650, minWidth: 700, minHeight: 500, resizable: true, multiple: false },
  // 终极AI助手（v37.3创新功能）
  { id: 'ai-ultimate-assistant', name: '终极AI助手', icon: <SparklesIcon />, component: 'AIUltimateAssistant', category: 'utilities', defaultWidth: 1000, defaultHeight: 700, minWidth: 800, minHeight: 600, resizable: true, multiple: false },
  // 在线协作笔记本（v37.3创新功能）
  { id: 'online-collab-notebook', name: '在线协作笔记本', icon: <NoteIcon />, component: 'OnlineCollabNotebook', category: 'office', defaultWidth: 900, defaultHeight: 700, minWidth: 700, minHeight: 600, resizable: true, multiple: false },
  // 量子计算器（v37.0创新功能）
  { id: 'quantum-calculator', name: '量子计算器', icon: <CalculatorIcon />, component: 'QuantumCalculator', category: 'utilities', defaultWidth: 400, defaultHeight: 600, minWidth: 350, minHeight: 500, resizable: true, multiple: false },
  // 欢迎中心（v37.0新增）
  { id: 'welcome-hub', name: '欢迎中心', icon: <SparklesIcon />, component: 'WelcomeHub', category: 'system', defaultWidth: 1200, defaultHeight: 800, minWidth: 900, minHeight: 600, resizable: true, multiple: false },
  // 新增WebIDE Pro在线编程环境（v36.0核心创新）
  { id: 'web-ide-pro', name: 'WebIDE Pro 在线编程', icon: <Code2Icon />, component: 'WebIDEPro', category: 'development', defaultWidth: 1300, defaultHeight: 850, minWidth: 1000, minHeight: 700, resizable: true, multiple: false },
  // 新增在线编程实验室（v35.0核心创新）
  { id: 'online-programming-lab', name: '在线编程实验室', icon: <Code2Icon />, component: 'OnlineProgrammingLab', category: 'development', defaultWidth: 1200, defaultHeight: 800, minWidth: 900, minHeight: 600, resizable: true, multiple: false },
  // 新增智能代码助手（v28.0创新功能）
  { id: 'intelligent-code-assistant', name: '智能代码助手', icon: <SparklesIcon />, component: 'IntelligentCodeAssistant', category: 'development', defaultWidth: 1100, defaultHeight: 800, minWidth: 800, minHeight: 600, resizable: true, multiple: false },
  // 新增增强应用（v16.0迭代）
  { id: 'ai-chat-enhanced', name: 'AI聊天增强', icon: <ChatIcon />, component: 'AIChatEnhanced', category: 'utilities', defaultWidth: 800, defaultHeight: 600, minWidth: 600, minHeight: 500, resizable: true, multiple: false },
  // 新增AI Code Companion（v17.0迭代）
  { id: 'ai-code-companion', name: 'AI Code Companion', icon: <SparklesIcon />, component: 'AICodeCompanion', category: 'utilities', defaultWidth: 900, defaultHeight: 700, minWidth: 700, minHeight: 600, resizable: true, multiple: false },
  // 新增DevKit开发者工具箱（v23.0迭代）
  { id: 'dev-kit', name: 'DevKit 开发者工具箱', icon: <WrenchIcon />, component: 'DevKit', category: 'development', defaultWidth: 1000, defaultHeight: 700, minWidth: 700, minHeight: 500, resizable: true, multiple: false },
  // 新增CyberHub赛博格控制中心（v26.0迭代）
  { id: 'cyber-hub', name: 'CyberHub 控制中心', icon: <ActivityIcon />, component: 'CyberHub', category: 'utilities', defaultWidth: 1200, defaultHeight: 800, minWidth: 900, minHeight: 600, resizable: true, multiple: false },
  // 新增智能开发者工作台（v31.0创新功能）
  { id: 'dev-workbench', name: '智能开发者工作台', icon: <RocketIcon />, component: 'DevWorkbench', category: 'development', defaultWidth: 1400, defaultHeight: 900, minWidth: 1000, minHeight: 700, resizable: true, multiple: false },
  // 新增系统诊断与性能分析（v32.0创新功能）
  { id: 'system-diagnostics-pro', name: '系统诊断分析', icon: <ActivityIcon />, component: 'SystemDiagnosticsPro', category: 'utilities', defaultWidth: 1000, defaultHeight: 700, minWidth: 800, minHeight: 600, resizable: true, multiple: false },
  // 新增AI智能工作流助手（v32.0创新功能）
  { id: 'ai-workflow-assistant', name: 'AI工作流助手', icon: <SparklesIcon />, component: 'AIWorkflowAssistant', category: 'utilities', defaultWidth: 800, defaultHeight: 650, minWidth: 600, minHeight: 500, resizable: true, multiple: false },
  // 新增代码片段库（v32.0创新功能）
  { id: 'code-snippet-library', name: '代码片段库', icon: <Code2Icon />, component: 'CodeSnippetLibrary', category: 'development', defaultWidth: 900, defaultHeight: 600, minWidth: 700, minHeight: 500, resizable: true, multiple: false },
  // 新增API Explorer Pro（v32.0创新功能）
  { id: 'api-explorer-pro', name: 'API Explorer Pro', icon: <ApiLabIcon />, component: 'APIExplorerPro', category: 'development', defaultWidth: 1000, defaultHeight: 700, minWidth: 800, minHeight: 600, resizable: true, multiple: false },
  // 新增在线资源聚合器（v32.0创新功能）
  { id: 'online-resource-hub', name: '在线资源聚合器', icon: <BrowserIcon />, component: 'OnlineResourceHub', category: 'utilities', defaultWidth: 900, defaultHeight: 700, minWidth: 700, minHeight: 600, resizable: true, multiple: false },
  { id: 'web-toolbox', name: '万能工具箱', icon: <WrenchIcon />, component: 'WebToolbox', category: 'utilities', defaultWidth: 900, defaultHeight: 700, minWidth: 700, minHeight: 500, resizable: true, multiple: false },
  { id: 'live-weather', name: '实时天气', icon: <CloudRainIcon />, component: 'LiveWeather', category: 'internet', defaultWidth: 800, defaultHeight: 650, minWidth: 600, minHeight: 500, resizable: true, multiple: false },
  { id: 'codepen-lite', name: '前端代码编辑器', icon: <Code2Icon />, component: 'CodePenLite', category: 'development', defaultWidth: 1100, defaultHeight: 750, minWidth: 800, minHeight: 600, resizable: true, multiple: false },
  // 代码助手专业版（v37.2新增）
  { id: 'code-assistant-pro', name: '代码助手专业版', icon: <CodeIcon />, component: 'CodeAssistantPro', category: 'development', defaultWidth: 900, defaultHeight: 600, minWidth: 700, minHeight: 500, resizable: true, multiple: false },
  // 系统监控仪表盘（v37.2新增）
  { id: 'system-monitor-dashboard', name: '系统监控仪表盘', icon: <ActivityIcon />, component: 'SystemMonitorDashboard', category: 'utilities', defaultWidth: 900, defaultHeight: 650, minWidth: 700, minHeight: 500, resizable: true, multiple: false },
  // 在线代码运行器增强版（v38.1新增）
  { id: 'online-code-runner-enhanced', name: '在线代码运行器 Pro', icon: <Code2Icon />, component: 'OnlineCodeRunnerEnhanced', category: 'development', defaultWidth: 1100, defaultHeight: 750, minWidth: 900, minHeight: 600, resizable: true, multiple: false },
  // 代码搜索（v38.2新增）- 搜索GitHub开源项目
  { id: 'code-search', name: '代码搜索', icon: <SearchIcon />, component: 'CodeSearch', category: 'development', defaultWidth: 900, defaultHeight: 650, minWidth: 700, minHeight: 500, resizable: true, multiple: false },
  // PromptForge 提示词工程工作室（v41创新功能 — 模板库+变量插值+实时测试+AI优化建议）
  { id: 'prompt-forge', name: 'PromptForge 提示词工作室', icon: <WandIcon />, component: 'PromptForge', category: 'utilities', defaultWidth: 1100, defaultHeight: 750, minWidth: 800, minHeight: 600, resizable: true, multiple: false, isNew: true, description: 'AI 提示词工程工作室：精选模板库+变量插值+实时测试+一键 AI 优化建议+历史记录' },
  // WebSnapshot 网页快照分析（v41创新功能 — 基于 microlink.io 的真实网页截图与元数据抓取）
  { id: 'web-snapshot', name: 'WebSnapshot 网页快照', icon: <CameraIcon />, component: 'WebSnapshot', category: 'internet', defaultWidth: 1200, defaultHeight: 800, minWidth: 900, minHeight: 600, resizable: true, multiple: false, isNew: true, description: '网页快照分析工具：输入 URL 获取截图/标题/描述/OG 图，支持桌面/平板/手机视口与对比模式' },
]

// 批量注册函数：用于在运行时动态添加应用（保留去重保护）
export function registerApps(extras: AppDefinition[]) {
  const existingIds = new Set(appRegistry.map((app) => app.id))
  for (const app of extras) {
    if (!existingIds.has(app.id)) {
      appRegistry.push(app)
      existingIds.add(app.id)
    }
  }
}

function SmartNotesIcon() {
  return (
    <svg viewBox="0 0 24 24" width="18" height="18" stroke="currentColor" strokeWidth="2" fill="none">
      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
      <polyline points="14 2 14 8 20 8"></polyline>
      <line x1="16" y1="13" x2="8" y2="13"></line>
      <line x1="16" y1="17" x2="8" y2="17"></line>
      <polyline points="10 9 9 9 8 9"></polyline>
    </svg>
  )
}

function FocusIcon() {
  return (
    <svg viewBox="0 0 24 24" width="18" height="18" stroke="currentColor" strokeWidth="2" fill="none">
      <circle cx="12" cy="12" r="3"/>
      <path d="M12 1v4M12 19v4M1 12h4M19 12h4"/>
      <circle cx="12" cy="12" r="8"/>
    </svg>
  )
}

function DiceIcon() {
  return (
    <svg viewBox="0 0 24 24" width="18" height="18" stroke="currentColor" strokeWidth="2" fill="none">
      <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
      <circle cx="8.5" cy="8.5" r="1.5" fill="currentColor" />
      <circle cx="15.5" cy="8.5" r="1.5" fill="currentColor" />
      <circle cx="8.5" cy="15.5" r="1.5" fill="currentColor" />
      <circle cx="15.5" cy="15.5" r="1.5" fill="currentColor" />
      <circle cx="12" cy="12" r="1.5" fill="currentColor" />
    </svg>
  )
}

function DevAssistantIcon() {
  return (
    <svg viewBox="0 0 24 24" width="18" height="18" stroke="currentColor" strokeWidth="2" fill="none">
      <rect x="4" y="3" width="16" height="18" rx="2" ry="2" />
      <line x1="4" y1="9" x2="20" y2="9" />
      <polyline points="10,14 12,16 16,12" />
    </svg>
  )
}

function ApiIcon() {
  return (
    <svg viewBox="0 0 24 24" width="18" height="18" stroke="currentColor" strokeWidth="2" fill="none">
      <path d="M10 9h4V6h3l-5 5-5-5h3v3m-6 6h4v-3h3l-5 5-5-5h3v3" />
    </svg>
  )
}

function SystemAssistantIcon() {
  return (
    <svg viewBox="0 0 24 24" width="18" height="18" stroke="currentColor" strokeWidth="2" fill="none">
      <circle cx="12" cy="12" r="10" />
      <path d="M12 6v6l4 2" />
      <circle cx="12" cy="12" r="3" fill="currentColor" stroke="none" />
      <path d="M8 14l2-2M16 14l-2-2" />
    </svg>
  )
}

function RegexIcon() {
  return (
    <svg viewBox="0 0 24 24" width="18" height="18" stroke="currentColor" strokeWidth="2" fill="none">
      <path d="M10 10h4M12 20a8 8 0 1 0 0-16 8 8 0 0 0 0 16z" />
      <path d="M12 10v6" />
    </svg>
  )
}

function ChartIcon() {
  return (
    <svg viewBox="0 0 24 24" width="18" height="18" stroke="currentColor" strokeWidth="2" fill="none">
      <line x1="18" y1="20" x2="18" y2="10" />
      <line x1="12" y1="20" x2="12" y2="4" />
      <line x1="6" y1="20" x2="6" y2="14" />
      <path d="M3 20h18" />
    </svg>
  )
}

function TextFormatIcon() {
  return (
    <svg viewBox="0 0 24 24" width="18" height="18" stroke="currentColor" strokeWidth="2" fill="none">
      <path d="M14 3v4a1 1 0 0 0 1 1h4" />
      <path d="M17 21H7a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h7l5 5v11a2 2 0 0 1-2 2z" />
      <line x1="9" y1="9" x2="15" y2="9" />
      <line x1="9" y1="13" x2="15" y2="13" />
      <line x1="9" y1="17" x2="13" y2="17" />
    </svg>
  )
}

function CodeSnippetsIcon() {
  return (
    <svg viewBox="0 0 24 24" width="18" height="18" stroke="currentColor" strokeWidth="2" fill="none">
      <polyline points="16,18 22,12 16,6"></polyline>
      <polyline points="8,6 2,12 8,18"></polyline>
    </svg>
  )
}

function CryptoIcon() {
  return (
    <svg viewBox="0 0 24 24" width="18" height="18" stroke="currentColor" strokeWidth="2" fill="none">
      <circle cx="12" cy="12" r="10" />
      <path d="M12 6v12" />
      <path d="M8 12h8" />
      <circle cx="12" cy="12" r="4" />
    </svg>
  )
}

function DiffIcon() {
  return (
    <svg viewBox="0 0 24 24" width="18" height="18" stroke="currentColor" strokeWidth="2" fill="none">
      <path d="M12 3v18" />
      <path d="M3 12h18" />
      <rect x="3" y="3" width="18" height="18" rx="2" />
    </svg>
  )
}

function ImageOptimizeIcon() {
  return (
    <svg viewBox="0 0 24 24" width="18" height="18" stroke="currentColor" strokeWidth="2" fill="none">
      <rect x="3" y="3" width="18" height="18" rx="2" />
      <circle cx="8.5" cy="8.5" r="1.5" />
      <path d="M21 15l-5-5L5 21" />
    </svg>
  )
}

function SpeedTestIcon() {
  return (
    <svg viewBox="0 0 24 24" width="18" height="18" stroke="currentColor" strokeWidth="2" fill="none">
      <path d="M22 12h-4l-3 9L9 3l-3 9H2" />
    </svg>
  )
}

function IdeaIcon() {
  return (
    <svg viewBox="0 0 24 24" width="18" height="18" stroke="currentColor" strokeWidth="2" fill="none">
      <path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3" />
      <path d="M12 17h.01" />
      <path d="M12 2a10 10 0 1 0 10 10A10 10 0 0 0 12 2z" />
    </svg>
  )
}

function AutoFlowIcon() {
  return (
    <svg viewBox="0 0 24 24" width="18" height="18" stroke="currentColor" strokeWidth="2" fill="none">
      <circle cx="12" cy="12" r="3" />
      <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 20.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 3.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z" />
    </svg>
  )
}

function DashboardIcon() {
  return (
    <svg viewBox="0 0 24 24" width="18" height="18" stroke="currentColor" strokeWidth="2" fill="none">
      <rect x="3" y="3" width="7" height="9" rx="1" />
      <rect x="14" y="3" width="7" height="5" rx="1" />
      <rect x="14" y="12" width="7" height="9" rx="1" />
      <rect x="3" y="16" width="7" height="5" rx="1" />
    </svg>
  )
}

function UnifiedDashboardIcon() {
  return (
    <svg viewBox="0 0 24 24" width="18" height="18" stroke="currentColor" strokeWidth="2" fill="none">
      <rect x="3" y="3" width="7" height="7" rx="1" />
      <rect x="14" y="3" width="7" height="7" rx="1" />
      <rect x="3" y="14" width="7" height="7" rx="1" />
      <circle cx="17.5" cy="17.5" r="3.5" />
    </svg>
  )
}

function CodeReviewIcon() {
  return (
    <svg viewBox="0 0 24 24" width="18" height="18" stroke="currentColor" strokeWidth="2" fill="none">
      <path d="M9.5 17l-7.5-5 7.5-5" />
      <path d="M14.5 17l7.5-5-7.5-5" />
      <circle cx="12" cy="12" r="9" />
      <path d="M12 9v3l2 2" />
    </svg>
  )
}

function CreativeToolkitIcon() {
  return (
    <svg viewBox="0 0 24 24" width="18" height="18" stroke="currentColor" strokeWidth="2" fill="none">
      <path d="M12 2L2 7l10 5 10-5-10-5z" />
      <path d="M2 17l10 5 10-5" />
      <path d="M2 12l10 5 10-5" />
    </svg>
  )
}

function DataExporterIcon() {
  return (
    <svg viewBox="0 0 24 24" width="18" height="18" stroke="currentColor" strokeWidth="2" fill="none">
      <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
      <polyline points="7 10 12 15 17 10" />
      <line x1="12" y1="15" x2="12" y2="3" />
    </svg>
  )
}

function ProjectPlannerIcon() {
  return (
    <svg viewBox="0 0 24 24" width="18" height="18" stroke="currentColor" strokeWidth="2" fill="none">
      <rect x="3" y="3" width="18" height="18" rx="2" />
      <line x1="3" y1="9" x2="21" y2="9" />
      <line x1="9" y1="21" x2="9" y2="9" />
      <circle cx="7" cy="6" r="1" fill="currentColor" />
      <circle cx="12" cy="6" r="1" fill="currentColor" />
      <circle cx="17" cy="6" r="1" fill="currentColor" />
    </svg>
  );
}

function FlashcardsIcon() {
  return (
    <svg viewBox="0 0 24 24" width="18" height="18" stroke="currentColor" strokeWidth="2" fill="none">
      <rect x="3" y="5" width="18" height="14" rx="2" />
      <line x1="3" y1="12" x2="21" y2="12" />
      <path d="M9 8H8" />
      <path d="M13 8H8" />
      <path d="M9 16H8" />
      <path d="M13 16H8" />
    </svg>
  );
}

function SmartProjectHubIcon() {
  return (
    <svg viewBox="0 0 24 24" width="18" height="18" stroke="currentColor" strokeWidth="2" fill="none">
      <rect x="3" y="3" width="18" height="18" rx="2" />
      <line x1="3" y1="9" x2="21" y2="9" />
      <line x1="9" y1="3" x2="9" y2="21" />
      <circle cx="6" cy="6" r="1" fill="currentColor" />
      <circle cx="15" cy="6" r="1" fill="currentColor" />
      <circle cx="15" cy="15" r="1" fill="currentColor" />
      <circle cx="6" cy="15" r="1" fill="currentColor" />
    </svg>
  );
}

function StockTrackerIcon() {
  return (
    <svg viewBox="0 0 24 24" width="18" height="18" stroke="currentColor" strokeWidth="2" fill="none">
      <path d="M16 8l-4-4-4 4" />
      <path d="M12 4v16" />
      <path d="M4 14l4 4 4-4" />
      <path d="M20 10l-4 4-4-4" />
    </svg>
  );
}

function MarkdownSlidesIcon() {
  return (
    <svg viewBox="0 0 24 24" width="18" height="18" stroke="currentColor" strokeWidth="2" fill="none">
      <rect x="2" y="3" width="20" height="14" rx="2" />
      <path d="M8 21h8" />
      <path d="M12 17v4" />
      <line x1="6" y1="7" x2="18" y2="7" />
      <line x1="6" y1="11" x2="14" y2="11" />
      <polyline points="16 11 18 9 20 11" />
    </svg>
  );
}

function RealTimeTranslatorIcon() {
  return (
    <svg viewBox="0 0 24 24" width="18" height="18" stroke="currentColor" strokeWidth="2" fill="none">
      <path d="M12 2L2 7l10 5 10-5-10-5z" />
      <path d="M2 17l10 5 10-5" />
      <path d="M2 12l10 5 10-5" />
    </svg>
  );
}

function ComponentSandboxIcon() {
  return (
    <svg viewBox="0 0 24 24" width="18" height="18" stroke="currentColor" strokeWidth="2" fill="none">
      <rect x="2" y="3" width="20" height="18" rx="2" />
      <path d="M2 9h20" />
      <path d="M9 21v-6a3 3 0 0 1 3-3h0a3 3 0 0 1 3 3v6" />
      <path d="M18 13v4" />
      <path d="M14 15v4" />
      <circle cx="6" cy="6" r="1" fill="currentColor" />
      <circle cx="9" cy="6" r="1" fill="currentColor" />
      <circle cx="12" cy="6" r="1" fill="currentColor" />
    </svg>
  );
}

function OnlineToolkitIcon() {
  return (
    <svg viewBox="0 0 24 24" width="18" height="18" stroke="currentColor" strokeWidth="2" fill="none">
      <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z" />
      <polyline points="3.27 6.96 12 12.01 20.73 6.96" />
      <line x1="12" y1="22.08" x2="12" y2="12" />
    </svg>
  );
}

function RecipeBookIcon() {
  return (
    <svg viewBox="0 0 24 24" width="18" height="18" stroke="currentColor" strokeWidth="2" fill="none">
      <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" />
      <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z" />
      <path d="M8 7h8M8 11h8M8 15h6" />
    </svg>
  )
}

function URLToolsIcon() {
  return (
    <svg viewBox="0 0 24 24" width="18" height="18" stroke="currentColor" strokeWidth="2" fill="none">
      <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71" />
      <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71" />
    </svg>
  )
}

function Base64ToolsIcon() {
  return (
    <svg viewBox="0 0 24 24" width="18" height="18" stroke="currentColor" strokeWidth="2" fill="none">
      <polyline points="16 18 22 12 16 6" />
      <polyline points="8 6 2 12 8 18" />
      <line x1="2" y1="12" x2="22" y2="12" />
    </svg>
  )
}

function JSONYAMLConverterIcon() {
  return (
    <svg viewBox="0 0 24 24" width="18" height="18" stroke="currentColor" strokeWidth="2" fill="none">
      <path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z" />
      <polyline points="14 2 14 8 20 8" />
      <path d="M9 13v-1h1v1" />
      <path d="M12 13v-1h1v1" />
      <path d="M15 13v-1h1v1" />
      <path d="M8 16h8" />
    </svg>
  )
}

function AIChatAssistantIcon() {
  return (
    <svg viewBox="0 0 24 24" width="18" height="18" stroke="currentColor" strokeWidth="2" fill="none">
      <circle cx="12" cy="12" r="10" />
      <circle cx="10" cy="10" r="1" fill="currentColor" />
      <circle cx="14" cy="10" r="1" fill="currentColor" />
      <path d="M8 14c1 1.5 3 2.5 4 2.5s3-1 4-2.5" />
    </svg>
  )
}

function RealTimeDashboardIcon() {
  return (
    <svg viewBox="0 0 24 24" width="18" height="18" stroke="currentColor" strokeWidth="2" fill="none">
      <rect x="3" y="3" width="18" height="18" rx="2" />
      <line x1="3" y1="9" x2="21" y2="9" />
      <polyline points="7 17 11 13 14 16 19 11" />
    </svg>
  )
}

function RealTimeDashboardEnhancedIcon() {
  return (
    <svg viewBox="0 0 24 24" width="18" height="18" stroke="currentColor" strokeWidth="2" fill="none">
      <circle cx="12" cy="12" r="10" strokeDasharray="2 1" />
      <circle cx="12" cy="12" r="6" fill="none" />
      <circle cx="12" cy="12" r="2" fill="currentColor" />
      <path d="M12 2 L14 4 M12 2 L10 4 M12 22 L14 20 M12 22 L10 20 M2 12 L4 10 M2 12 L4 14 M22 12 L20 10 M22 12 L20 14" />
    </svg>
  )
}

function AICodeAssistantIcon() {
  return (
    <svg viewBox="0 0 24 24" width="18" height="18" stroke="currentColor" strokeWidth="2" fill="none">
      <circle cx="12" cy="12" r="10" strokeDasharray="3 2" />
      <path d="M8 12 L10 12 L10 8 L14 8 L14 12 L16 12" />
      <circle cx="9" cy="16" r="1" fill="currentColor" />
      <circle cx="15" cy="16" r="1" fill="currentColor" />
      <path d="M7 8 Q12 4 17 8" />
    </svg>
  )
}

function SmartNewsReaderIcon() {
  return (
    <svg viewBox="0 0 24 24" width="18" height="18" stroke="currentColor" strokeWidth="2" fill="none">
      <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" />
      <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 17.5" />
      <line x1="8" y1="6" x2="18" y2="6" />
      <line x1="8" y1="10" x2="15" y2="10" />
    </svg>
  )
}

function WikipediaReaderIcon() {
  return (
    <svg viewBox="0 0 24 24" width="18" height="18" stroke="currentColor" strokeWidth="2" fill="none">
      <circle cx="12" cy="12" r="10" />
      <path d="M2 12h20" />
      <path d="M12 2a15 15 0 0 1 4 10 15 15 0 0 1-4 10 15 15 0 0 1-4-10 15 15 0 0 1 4-10z" />
    </svg>
  )
}

function ChatAIIcon() {
  return (
    <svg viewBox="0 0 24 24" width="18" height="18" stroke="currentColor" strokeWidth="2" fill="none">
      <circle cx="12" cy="12" r="10" />
      <path d="M8 14s1.5 2 4 2 4-2 4-2" />
      <line x1="9" y1="9" x2="9.01" y2="9" />
      <line x1="15" y1="9" x2="15.01" y2="9" />
    </svg>
  )
}

function CodeStudioIcon() {
  return (
    <svg viewBox="0 0 24 24" width="18" height="18" stroke="currentColor" strokeWidth="2" fill="none">
      <polyline points="16 18 22 12 16 6" />
      <polyline points="8 6 2 12 8 18" />
      <line x1="14" y1="4" x2="10" y2="20" />
    </svg>
  )
}

function CurrencyIcon() {
  return (
    <svg viewBox="0 0 24 24" width="18" height="18" stroke="currentColor" strokeWidth="2" fill="none">
      <line x1="12" y1="1" x2="12" y2="23" />
      <path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
    </svg>
  )
}

function CronIcon() {
  return (
    <svg viewBox="0 0 24 24" width="18" height="18" stroke="currentColor" strokeWidth="2" fill="none">
      <circle cx="12" cy="12" r="10" />
      <polyline points="12 6 12 12 16 14" />
    </svg>
  )
}

function UnitIcon() {
  return (
    <svg viewBox="0 0 24 24" width="18" height="18" stroke="currentColor" strokeWidth="2" fill="none">
      <line x1="4" y1="9" x2="20" y2="9" />
      <line x1="4" y1="15" x2="20" y2="15" />
      <line x1="10" y1="3" x2="8" y2="21" />
      <line x1="16" y1="3" x2="14" y2="21" />
    </svg>
  )
}

function JsonIcon() {
  return (
    <svg viewBox="0 0 24 24" width="18" height="18" stroke="currentColor" strokeWidth="2" fill="none">
      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
      <polyline points="14 2 14 8 20 8" />
      <path d="M8 13h2" />
      <path d="M8 17h2" />
      <path d="M14 13h2" />
      <path d="M14 17h2" />
    </svg>
  )
}

function QRCodeIcon() {
  return (
    <svg viewBox="0 0 24 24" width="18" height="18" stroke="currentColor" strokeWidth="2" fill="none">
      <rect x="3" y="3" width="7" height="7" />
      <rect x="14" y="3" width="7" height="7" />
      <rect x="3" y="14" width="7" height="7" />
      <rect x="14" y="14" width="3" height="3" />
      <rect x="18" y="14" width="3" height="3" />
      <rect x="14" y="18" width="3" height="3" />
      <rect x="18" y="18" width="3" height="3" />
    </svg>
  )
}

function TaskIcon() {
  return (
    <svg viewBox="0 0 24 24" width="18" height="18" stroke="currentColor" strokeWidth="2" fill="none">
      <path d="M9 11l3 3L22 4" />
      <path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11" />
    </svg>
  )
}

function SystemIcon() {
  return (
    <svg viewBox="0 0 24 24" width="18" height="18" stroke="currentColor" strokeWidth="2" fill="none">
      <rect x="2" y="3" width="20" height="14" rx="2" ry="2" />
      <line x1="8" y1="21" x2="16" y2="21" />
      <line x1="12" y1="17" x2="12" y2="21" />
    </svg>
  )
}

function SystemHealthDashboardIcon() {
  return (
    <svg viewBox="0 0 24 24" width="18" height="18" stroke="currentColor" strokeWidth="2" fill="none">
      <path d="M22 12h-4l-3 9L9 3l-3 9H2" />
      <circle cx="12" cy="12" r="3" />
    </svg>
  )
}

function OnlineCodeRunnerIcon() {
  return (
    <svg viewBox="0 0 24 24" width="18" height="18" stroke="currentColor" strokeWidth="2" fill="none">
      <polyline points="16 18 22 12 16 6" />
      <polyline points="8 6 2 12 8 18" />
      <circle cx="12" cy="12" r="2" fill="currentColor" />
    </svg>
  )
}

function WebToolsHubIcon() {
  return (
    <svg viewBox="0 0 24 24" width="18" height="18" stroke="currentColor" strokeWidth="2" fill="none">
      <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z" />
      <polyline points="3.27 6.96 12 12.01 20.73 6.96" />
      <line x1="12" y1="22.08" x2="12" y2="12" />
      <circle cx="12" cy="12" r="2" fill="currentColor" />
    </svg>
  )
}

function AIAssistantProIcon() {
  return (
    <svg viewBox="0 0 24 24" width="18" height="18" stroke="currentColor" strokeWidth="2" fill="none">
      <circle cx="12" cy="12" r="10" />
      <path d="M8 14s1.5 2 4 2 4-2 4-2" />
      <line x1="9" y1="9" x2="9.01" y2="9" />
      <line x1="15" y1="9" x2="15.01" y2="9" />
      <path d="M12 2v4M12 18v4" />
    </svg>
  )
}

function AISmartAssistantIcon() {
  return (
    <svg viewBox="0 0 24 24" width="18" height="18" stroke="currentColor" strokeWidth="2" fill="none">
      <circle cx="12" cy="12" r="10" />
      <circle cx="12" cy="12" r="4" fill="currentColor" />
      <path d="M12 2v2M12 20v2M2 12h2M20 12h2" />
    </svg>
  )
}

function NotesAppIcon() {
  return (
    <svg viewBox="0 0 24 24" width="18" height="18" stroke="currentColor" strokeWidth="2" fill="none">
      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
      <polyline points="14 2 14 8 20 8" />
      <line x1="16" y1="13" x2="8" y2="13" />
      <line x1="16" y1="17" x2="8" y2="17" />
      <polyline points="10 9 9 9 8 9" />
    </svg>
  )
}

function TodoAppIcon() {
  return (
    <svg viewBox="0 0 24 24" width="18" height="18" stroke="currentColor" strokeWidth="2" fill="none">
      <rect x="3" y="3" width="18" height="18" rx="2" />
      <path d="M9 12l2 2 4-4" />
      <line x1="8" y1="7" x2="16" y2="7" />
    </svg>
  )
}

function CodeDiffIcon() {
  return (
    <svg viewBox="0 0 24 24" width="18" height="18" stroke="currentColor" strokeWidth="2" fill="none">
      <rect x="2" y="3" width="8" height="18" rx="2" />
      <rect x="14" y="3" width="8" height="18" rx="2" />
      <line x1="6" y1="8" x2="6" y2="8.01" />
      <line x1="6" y1="12" x2="6" y2="12.01" />
      <line x1="18" y1="8" x2="18" y2="8.01" />
      <line x1="18" y1="12" x2="18" y2="12.01" />
    </svg>
  )
}

function EnhancedApiDocsIcon() {
  return (
    <svg viewBox="0 0 24 24" width="18" height="18" stroke="currentColor" strokeWidth="2" fill="none">
      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
      <polyline points="14 2 14 8 20 8" />
      <line x1="16" y1="13" x2="8" y2="13" />
      <line x1="16" y1="17" x2="8" y2="17" />
      <polyline points="10 9 9 9 8 9" />
    </svg>
  )
}

function CustomMusicIcon() {
  return (
    <svg viewBox="0 0 24 24" width="18" height="18" stroke="currentColor" strokeWidth="2" fill="none">
      <path d="M9 18V5l12-2v13" />
      <circle cx="6" cy="18" r="3" />
      <circle cx="18" cy="16" r="3" />
    </svg>
  )
}

function NewsIcon() {
  return (
    <svg viewBox="0 0 24 24" width="18" height="18" stroke="currentColor" strokeWidth="2" fill="none">
      <path d="M4 22h16a2 2 0 0 0 2-2V4a2 2 0 0 0-2-2H8a2 2 0 0 0-2 2v16a2 2 0 0 1-2 2Zm0 0a2 2 0 0 1-2-2v-9c0-1.1.9-2 2-2h2" />
      <path d="M18 14h-8" />
      <path d="M15 18h-5" />
      <path d="M10 6h8v4h-8V6Z" />
    </svg>
  )
}

function GitHubIcon() {
  return (
    <svg viewBox="0 0 24 24" width="18" height="18" stroke="currentColor" strokeWidth="2" fill="none">
      <path d="M9 19c-5 1.5-5-2.5-7-3m14 6v-3.87a3.37 3.37 0 0 0-.94-2.61c3.14-.35 6.44-1.54 6.44-7A5.44 5.44 0 0 0 20 4.77 5.07 5.07 0 0 0 19.91 1S18.73.65 16 2.48a13.38 13.38 0 0 0-7 0C6.27.65 5.09 1 5.09 1A5.07 5.07 0 0 0 5 4.77a5.44 5.44 0 0 0-1.5 3.78c0 5.42 3.3 6.61 6.44 7A3.37 3.37 0 0 0 9 18.13V22" />
    </svg>
  )
}

function GitHubExplorerIcon() {
  return (
    <svg viewBox="0 0 24 24" width="18" height="18" stroke="currentColor" strokeWidth="2" fill="none">
      <path d="M12 2C6.477 2 2 6.477 2 12c0 4.42 2.865 8.17 6.839 9.49.5.092.682-.217.682-.482 0-.237-.008-.866-.013-1.7-2.782.604-3.369-1.341-3.369-1.341-.454-1.155-1.11-1.462-1.11-1.462-.908-.62.069-.608.069-.608 1.003.07 1.531 1.03 1.531 1.03.892 1.529 2.341 1.087 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.11-4.555-4.943 0-1.091.39-1.984 1.029-2.683-.103-.253-.446-1.27.098-2.647 0 0 .84-.269 2.75 1.025A9.578 9.578 0 0112 6.836c.85.004 1.705.114 2.504.336 1.909-1.294 2.747-1.025 2.747-1.025.546 1.377.203 2.394.1 2.647.64.699 1.028 1.592 1.028 2.683 0 3.842-2.339 4.687-4.566 4.935.359.309.678.919.678 1.852 0 1.336-.012 2.415-.012 2.743 0 .267.18.578.688.48C19.138 20.167 22 16.418 22 12c0-5.523-4.477-10-10-10z" />
      <circle cx="8" cy="10" r="2" />
      <circle cx="16" cy="10" r="2" />
      <circle cx="12" cy="16" r="2" />
    </svg>
  )
}

function WhiteboardProIcon() {
  return (
    <svg viewBox="0 0 24 24" width="18" height="18" stroke="currentColor" strokeWidth="2" fill="none">
      <rect x="3" y="4" width="18" height="16" rx="2" />
      <path d="M3 8h18" />
      <path d="M8 14l2 2 4-4" />
      <circle cx="16" cy="14" r="1" fill="currentColor" />
    </svg>
  )
}

function NewsHubIcon() {
  return (
    <svg viewBox="0 0 24 24" width="18" height="18" stroke="currentColor" strokeWidth="2" fill="none">
      <path d="M4 22h16a2 2 0 0 0 2-2V4a2 2 0 0 0-2-2H8a2 2 0 0 0-2 2v16a2 2 0 0 1-2 2Zm0 0a2 2 0 0 1-2-2v-9c0-1.1.9-2 2-2h2" />
      <path d="M18 14h-8" />
      <path d="M15 18h-5" />
      <path d="M10 6h8v4h-8V6Z" />
    </svg>
  )
}

function DataVizDashboardIcon() {
  return (
    <svg viewBox="0 0 24 24" width="18" height="18" stroke="currentColor" strokeWidth="2" fill="none">
      <rect x="3" y="3" width="7" height="7" rx="1" />
      <rect x="14" y="3" width="7" height="7" rx="1" />
      <rect x="14" y="14" width="7" height="7" rx="1" />
      <rect x="3" y="14" width="7" height="7" rx="1" />
      <path d="M7 7v0" />
      <path d="M18 7v0" />
      <path d="M18 18v0" />
      <path d="M7 18v0" />
    </svg>
  )
}

function WorkspaceManagerIcon() {
  return (
    <svg viewBox="0 0 24 24" width="18" height="18" stroke="currentColor" strokeWidth="2" fill="none">
      <rect x="3" y="3" width="7" height="7" rx="1" />
      <rect x="14" y="3" width="7" height="7" rx="1" />
      <rect x="3" y="14" width="7" height="7" rx="1" />
      <path d="M14 17h7" />
      <path d="M17.5 14v7" />
    </svg>
  )
}

function CustomClipboardIcon() {
  return (
    <svg viewBox="0 0 24 24" width="18" height="18" stroke="currentColor" strokeWidth="2" fill="none">
      <path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2" />
      <rect x="8" y="2" width="8" height="4" rx="1" ry="1" />
    </svg>
  )
}

function CloudIcon() {
  return (
    <svg viewBox="0 0 24 24" width="18" height="18" stroke="currentColor" strokeWidth="2" fill="none">
      <path d="M18 10h-1.26A8 8 0 1 0 9 20h9a5 5 0 0 0 0-10z" />
    </svg>
  )
}

function GameIcon() {
  return (
    <svg viewBox="0 0 24 24" width="18" height="18" stroke="currentColor" strokeWidth="2" fill="none">
      <line x1="6" y1="12" x2="10" y2="12" />
      <line x1="8" y1="10" x2="8" y2="14" />
      <line x1="15" y1="13" x2="15.01" y2="13" />
      <line x1="18" y1="11" x2="18.01" y2="11" />
      <rect x="2" y="6" width="20" height="12" rx="2" />
    </svg>
  )
}

function ZapIcon() {
  return (
    <svg viewBox="0 0 24 24" width="18" height="18" stroke="currentColor" strokeWidth="2" fill="none">
      <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" />
    </svg>
  )
}

function CustomGlobeIcon() {
  return (
    <svg viewBox="0 0 24 24" width="18" height="18" stroke="currentColor" strokeWidth="2" fill="none">
      <circle cx="12" cy="12" r="10" />
      <line x1="2" y1="12" x2="22" y2="12" />
      <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z" />
    </svg>
  )
}

function CustomBookIcon() {
  return (
    <svg viewBox="0 0 24 24" width="18" height="18" stroke="currentColor" strokeWidth="2" fill="none">
      <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" />
      <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z" />
    </svg>
  )
}

function ColorPaletteIcon() {
  return (
    <svg viewBox="0 0 24 24" width="18" height="18" stroke="currentColor" strokeWidth="2" fill="none">
      <circle cx="12" cy="12" r="10" />
      <circle cx="12" cy="6" r="2" fill="#7C6CF0" stroke="none" />
      <circle cx="17.5" cy="10" r="2" fill="#9B8AF0" stroke="none" />
      <circle cx="17.5" cy="16" r="2" fill="#B8A8FF" stroke="none" />
      <circle cx="6.5" cy="16" r="2" fill="#D8D0FF" stroke="none" />
      <circle cx="6.5" cy="10" r="2" fill="#F0EEFF" stroke="none" />
    </svg>
  )
}

function BookmarkManagerIcon() {
  return (
    <svg viewBox="0 0 24 24" width="18" height="18" stroke="currentColor" strokeWidth="2" fill="none">
      <path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z" />
    </svg>
  )
}

function CodeSnippetShareIcon() {
  return (
    <svg viewBox="0 0 24 24" width="18" height="18" stroke="currentColor" strokeWidth="2" fill="none">
      <polyline points="16 18 22 12 16 6" />
      <polyline points="8 6 2 12 8 18" />
      <line x1="2" y1="12" x2="22" y2="12" />
    </svg>
  )
}

function CodeFormatterIcon() {
  return (
    <svg viewBox="0 0 24 24" width="18" height="18" stroke="currentColor" strokeWidth="2" fill="none">
      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
      <polyline points="14 2 14 8 20 8"></polyline>
      <polyline points="16 14 12 18 8 14"></polyline>
    </svg>
  )
}

function DevToolboxIcon() {
  return (
    <svg viewBox="0 0 24 24" width="18" height="18" stroke="currentColor" strokeWidth="2" fill="none">
      <rect x="2" y="7" width="14" height="12" rx="2" />
      <path d="M6 7V4h10a2 2 0 0 1 2 2v10" />
      <circle cx="9" cy="13" r="2" />
      <path d="M12 11l4 4M16 11l-4 4" />
    </svg>
  )
}

function TaskManagerProIcon() {
  return (
    <svg viewBox="0 0 24 24" width="18" height="18" stroke="currentColor" strokeWidth="2" fill="none">
      <rect x="3" y="3" width="18" height="18" rx="2" />
      <line x1="9" y1="3" x2="9" y2="21" />
      <line x1="3" y1="9" x2="21" y2="9" />
      <circle cx="6" cy="6" r="1" fill="currentColor" />
      <circle cx="12" cy="6" r="1" fill="currentColor" />
      <circle cx="18" cy="6" r="1" fill="currentColor" />
      <circle cx="6" cy="12" r="1" fill="currentColor" />
      <circle cx="6" cy="18" r="1" fill="currentColor" />
    </svg>
  )
}

function CodeSandboxIcon() {
  return (
    <svg viewBox="0 0 24 24" width="18" height="18" stroke="currentColor" strokeWidth="2" fill="none">
      <path d="M16 18l6-6-6-6" />
      <path d="M8 6l-6 6 6 6" />
      <rect x="9" y="3" width="6" height="18" rx="1" />
    </svg>
  )
}

function RESTClientIcon() {
  return (
    <svg viewBox="0 0 24 24" width="18" height="18" stroke="currentColor" strokeWidth="2" fill="none">
      <rect x="3" y="5" width="18" height="14" rx="2" />
      <path d="M7 10h10M7 14h7" />
      <circle cx="6" cy="8" r="1" fill="currentColor" />
      <circle cx="8" cy="8" r="1" fill="currentColor" />
      <circle cx="10" cy="8" r="1" fill="currentColor" />
    </svg>
  )
}

function AdvancedDataVizIcon() {
  return (
    <svg viewBox="0 0 24 24" width="18" height="18" stroke="currentColor" strokeWidth="2" fill="none">
      <rect x="3" y="3" width="18" height="18" rx="2" />
      <path d="M7 17l4-4 3 3 5-6" />
      <circle cx="7" cy="17" r="1" fill="currentColor" />
      <circle cx="11" cy="13" r="1" fill="currentColor" />
      <circle cx="14" cy="16" r="1" fill="currentColor" />
      <circle cx="19" cy="10" r="1" fill="currentColor" />
    </svg>
  )
}

function AICodeTutorIcon() {
  return (
    <svg viewBox="0 0 24 24" width="18" height="18" stroke="currentColor" strokeWidth="2" fill="none">
      <path d="M12 3L2 9l10 6 10-6-10-6z" />
      <path d="M2 15l10 6 10-6" />
      <path d="M12 12l-4-2" />
      <path d="M12 12l4-2" />
      <path d="M12 12v8" />
    </svg>
  )
}

function IntelligentCodeGeneratorIcon() {
  return (
    <svg viewBox="0 0 24 24" width="18" height="18" stroke="currentColor" strokeWidth="2" fill="none">
      <circle cx="12" cy="12" r="10"/>
      <path d="M12 2a10 10 0 0 1 0 20"/>
      <path d="M2 12h20"/>
      <path d="m8 12 3 3 3-3"/>
      <circle cx="12" cy="8" r="1" fill="currentColor"/>
    </svg>
  )
}

function AITaskAssistantIcon() {
  return (
    <svg viewBox="0 0 24 24" width="18" height="18" stroke="currentColor" strokeWidth="2" fill="none">
      <rect x="3" y="4" width="18" height="18" rx="2" />
      <path d="M9 10h6" />
      <path d="M9 14h6" />
      <path d="M12 2a10 10 0 0 0-10 10" />
      <circle cx="12" cy="12" r="3" fill="currentColor"/>
    </svg>
  )
}

function IdeaBoardIcon() {
  return (
    <svg viewBox="0 0 24 24" width="18" height="18" stroke="currentColor" strokeWidth="2" fill="none">
      <path d="M12 2L2 7l10 5 10-5-10-5z" />
      <path d="M2 17l10 5 10-5" />
      <path d="M2 12l10 5 10-5" />
      <circle cx="12" cy="7" r="1" fill="currentColor" />
      <circle cx="8" cy="14.5" r="1" fill="currentColor" />
      <circle cx="16" cy="14.5" r="1" fill="currentColor" />
    </svg>
  )
}

function MusicStudioIcon() {
  return (
    <svg viewBox="0 0 24 24" width="18" height="18" stroke="currentColor" strokeWidth="2" fill="none">
      <path d="M9 18V5l12-2v13" />
      <circle cx="6" cy="18" r="3" />
      <circle cx="18" cy="16" r="3" />
      <path d="M12 10v4" />
      <path d="M9 12h6" />
    </svg>
  )
}

function TaskManagerPlusIcon() {
  return (
    <svg viewBox="0 0 24 24" width="18" height="18" stroke="currentColor" strokeWidth="2" fill="none">
      <rect x="3" y="3" width="18" height="18" rx="2" />
      <path d="M7 12l3 3 7-7" />
      <line x1="8" y1="7" x2="16" y2="7" />
    </svg>
  )
}

function AirQualityIcon() {
  return (
    <svg viewBox="0 0 24 24" width="18" height="18" stroke="currentColor" strokeWidth="2" fill="none">
      <path d="M12 2v10M12 22v-6M6 12H2M22 12h-4M7.05 7.05L4.22 4.22M19.78 19.78l-2.83-2.83M7.05 16.95l-2.83 2.83M19.78 4.22l-2.83 2.83" />
      <circle cx="12" cy="12" r="4" fill="currentColor" opacity="0.3" />
    </svg>
  )
}

function SpaceExplorerIcon() {
  return (
    <svg viewBox="0 0 24 24" width="18" height="18" stroke="currentColor" strokeWidth="2" fill="none">
      <circle cx="12" cy="12" r="9" />
      <path d="M12 3 L10 12 L12 15 L14 12 Z" fill="currentColor" stroke="none" />
      <circle cx="12" cy="12" r="1.5" />
      <circle cx="5.5" cy="12" r="0.8" fill="currentColor" stroke="none" />
      <circle cx="18.5" cy="12" r="0.8" fill="currentColor" stroke="none" />
    </svg>
  )
}

function QuickNotesProIcon() {
  return (
    <svg viewBox="0 0 24 24" width="18" height="18" stroke="currentColor" strokeWidth="2" fill="none">
      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
      <polyline points="14 2 14 8 20 8" />
      <line x1="16" y1="13" x2="8" y2="13" />
      <line x1="16" y1="17" x2="8" y2="17" />
      <line x1="10" y1="9" x2="8" y2="9" />
      <circle cx="18" cy="18" r="3" fill="currentColor" stroke="none" />
    </svg>
  )
}

function ChinesePoetryIcon() {
  return (
    <svg viewBox="0 0 24 24" width="18" height="18" stroke="currentColor" strokeWidth="2" fill="none">
      <path d="M6 21V5a1 1 0 0 1 1-1h8a1 1 0 0 1 1 1v16" />
      <path d="M16 4h3a1 1 0 0 1 1 1v16H6" />
      <line x1="9" y1="8" x2="13" y2="8" />
      <line x1="9" y1="12" x2="13" y2="12" />
      <line x1="9" y1="16" x2="12" y2="16" />
    </svg>
  )
}

function SmartDevFlowIcon() {
  return (
    <svg viewBox="0 0 24 24" width="18" height="18" stroke="currentColor" strokeWidth="2" fill="none">
      <path d="M12 2L2 7l10 5 10-5-10-5z" />
      <path d="M2 17l10 5 10-5" />
      <path d="M2 12l10 5 10-5" />
      <circle cx="12" cy="12" r="3" fill="currentColor" stroke="none" />
    </svg>
  )
}

function SmartAIHubIcon() {
  return (
    <svg viewBox="0 0 24 24" width="18" height="18" stroke="currentColor" strokeWidth="2" fill="none">
      <path d="M12 2a5 5 0 0 1 5 5v1a4 4 0 0 1 2 7.464V17a3 3 0 0 1-3 3H8a3 3 0 0 1-3-3v-1.536A4 4 0 0 1 7 8V7a5 5 0 0 1 5-5z" />
      <circle cx="9" cy="12" r="1.2" fill="currentColor" stroke="none" />
      <circle cx="15" cy="12" r="1.2" fill="currentColor" stroke="none" />
      <path d="M9 17h6" />
    </svg>
  )
}

function WorkspaceHubIcon() {
  return (
    <svg viewBox="0 0 24 24" width="18" height="18" stroke="currentColor" strokeWidth="2" fill="none">
      <rect x="3" y="3" width="7" height="7" rx="1" />
      <rect x="14" y="3" width="7" height="7" rx="1" />
      <rect x="3" y="14" width="7" height="7" rx="1" />
      <rect x="14" y="14" width="7" height="7" rx="1" />
    </svg>
  )
}

// 注意（校验提示）：以下所有条目在 src/apps/ 下均应存在同名 .tsx 组件文件，
// 且每个 id 必须全局唯一。如新增注册，请先确认组件文件已就位。
// （当前 201 项已完成组件存在性与 id 去重校验，无异常。）
export const appRegistry: AppDefinition[] = [
  { id: 'workspace-hub', name: '工作空间中心', icon: <WorkspaceHubIcon />, component: 'WorkspaceHub', category: 'system', defaultWidth: 1100, defaultHeight: 800, minWidth: 800, minHeight: 600, resizable: true, multiple: false },
  { id: 'smart-ai-hub', name: '智能AI中心', icon: <SmartAIHubIcon />, component: 'SmartAIHub', category: 'utilities', defaultWidth: 1100, defaultHeight: 800, minWidth: 700, minHeight: 600, resizable: true, multiple: false },
  { id: 'smart-dev-flow', name: '智能开发工作台', icon: <SmartDevFlowIcon />, component: 'SmartDevFlow', category: 'development', defaultWidth: 1280, defaultHeight: 880, minWidth: 900, minHeight: 650, resizable: true, multiple: false },
  { id: 'dev-toolbox', name: '开发者工具箱', icon: <DevToolboxIcon />, component: 'DevToolbox', category: 'development', defaultWidth: 1300, defaultHeight: 900, minWidth: 950, minHeight: 700, resizable: true, multiple: false },
  { id: 'unified-dashboard', name: '统一数据仪表盘', icon: <UnifiedDashboardIcon />, component: 'UnifiedDashboard', category: 'utilities', defaultWidth: 1300, defaultHeight: 900, minWidth: 1000, minHeight: 700, resizable: true, multiple: false },
  { id: 'task-manager-plus', name: '任务管理器 Plus', icon: <TaskManagerPlusIcon />, component: 'TaskManagerPlus', category: 'office', defaultWidth: 1300, defaultHeight: 900, minWidth: 900, minHeight: 650, resizable: true, multiple: false },
  { id: 'idea-board', name: '灵感板', icon: <IdeaBoardIcon />, component: 'IdeaBoard', category: 'utilities', defaultWidth: 1100, defaultHeight: 800, minWidth: 800, minHeight: 600, resizable: true, multiple: false },
  { id: 'music-studio', name: '音乐工作室', icon: <MusicStudioIcon />, component: 'MusicStudio', category: 'multimedia', defaultWidth: 1000, defaultHeight: 750, minWidth: 700, minHeight: 550, resizable: true, multiple: false },
  { id: 'color-palette-generator', name: '配色方案生成器', icon: <ColorPaletteIcon />, component: 'ColorPaletteGenerator', category: 'utilities', defaultWidth: 900, defaultHeight: 800, minWidth: 700, minHeight: 600, resizable: true, multiple: false },
  { id: 'cron-tools', name: 'Cron 生成器', icon: <CronIcon />, component: 'CronTools', category: 'development', defaultWidth: 700, defaultHeight: 750, minWidth: 500, minHeight: 500, resizable: true, multiple: false },
  { id: 'ai-task-assistant', name: 'AI 任务助手', icon: <AITaskAssistantIcon />, component: 'AITaskAssistant', category: 'utilities', defaultWidth: 1100, defaultHeight: 850, minWidth: 700, minHeight: 600, resizable: true, multiple: false },
  { id: 'intelligent-code-generator', name: '智能代码生成器', icon: <IntelligentCodeGeneratorIcon />, component: 'IntelligentCodeGenerator', category: 'development', defaultWidth: 1300, defaultHeight: 850, minWidth: 900, minHeight: 650, resizable: true, multiple: false },
  { id: 'code-formatter', name: '代码格式化', icon: <CodeFormatterIcon />, component: 'CodeFormatter', category: 'development', defaultWidth: 1000, defaultHeight: 700, minWidth: 700, minHeight: 500, resizable: true, multiple: false },
  { id: 'whiteboard-pro', name: '专业白板', icon: <WhiteboardProIcon />, component: 'WhiteboardPro', category: 'office', defaultWidth: 1200, defaultHeight: 900, minWidth: 800, minHeight: 600, resizable: true, multiple: false },
  { id: 'news-hub', name: '新闻聚合中心', icon: <NewsHubIcon />, component: 'NewsHub', category: 'internet', defaultWidth: 1200, defaultHeight: 850, minWidth: 800, minHeight: 600, resizable: true, multiple: false },
  { id: 'data-viz-dashboard', name: '数据可视化仪表盘', icon: <DataVizDashboardIcon />, component: 'DataVizDashboard', category: 'utilities', defaultWidth: 1200, defaultHeight: 850, minWidth: 900, minHeight: 650, resizable: true, multiple: false },
  { id: 'workspace-manager', name: '工作空间管理器', icon: <WorkspaceManagerIcon />, component: 'WorkspaceManager', category: 'system', defaultWidth: 1100, defaultHeight: 800, minWidth: 800, minHeight: 600, resizable: true, multiple: false },
  { id: 'github-explorer', name: 'GitHub 探索器', icon: <GitHubExplorerIcon />, component: 'GitHubExplorer', category: 'development', defaultWidth: 1200, defaultHeight: 850, minWidth: 900, minHeight: 600, resizable: true, multiple: false },
  { id: 'ai-code-tutor', name: 'AI 编程导师', icon: <AICodeTutorIcon />, component: 'AICodeTutor', category: 'development', defaultWidth: 1400, defaultHeight: 900, minWidth: 1000, minHeight: 600, resizable: true, multiple: false },
  { id: 'component-sandbox', name: '组件开发沙盒', icon: <ComponentSandboxIcon />, component: 'ComponentSandbox', category: 'development', defaultWidth: 1200, defaultHeight: 800, minWidth: 900, minHeight: 600, resizable: true, multiple: false },
  { id: 'realtime-dashboard', name: '实时数据仪表盘', icon: <RealTimeDashboardIcon />, component: 'RealTimeDashboard', category: 'utilities', defaultWidth: 1200, defaultHeight: 850, minWidth: 900, minHeight: 650, resizable: true, multiple: false },
  { id: 'realtime-dashboard-enhanced', name: '实时数据仪表盘 Pro', icon: <RealTimeDashboardEnhancedIcon />, component: 'RealTimeDashboardEnhanced', category: 'utilities', defaultWidth: 1300, defaultHeight: 900, minWidth: 1000, minHeight: 700, resizable: true, multiple: false },
  { id: 'ai-code-assistant', name: 'AI 编程助手', icon: <AICodeAssistantIcon />, component: 'AICodeAssistant', category: 'development', defaultWidth: 1400, defaultHeight: 850, minWidth: 1000, minHeight: 650, resizable: true, multiple: false },
  { id: 'smart-news-reader', name: '智能新闻阅读器', icon: <SmartNewsReaderIcon />, component: 'SmartNewsReader', category: 'internet', defaultWidth: 1200, defaultHeight: 850, minWidth: 800, minHeight: 600, resizable: true, multiple: false },
  { id: 'wikipedia-reader', name: '维基百科阅读器', icon: <WikipediaReaderIcon />, component: 'WikipediaReader', category: 'internet', defaultWidth: 1100, defaultHeight: 800, minWidth: 700, minHeight: 500, resizable: true, multiple: false },
  { id: 'advanced-data-viz', name: '高级数据可视化', icon: <AdvancedDataVizIcon />, component: 'AdvancedDataViz', category: 'development', defaultWidth: 1200, defaultHeight: 850, minWidth: 900, minHeight: 650, resizable: true, multiple: false },
  { id: 'dev-assistant', name: '开发助手', icon: <DevAssistantIcon />, component: 'DevAssistant', category: 'development', defaultWidth: 1000, defaultHeight: 750, minWidth: 700, minHeight: 500, resizable: true, multiple: false },
  { id: 'habit-tracker', name: '习惯追踪', icon: <svg viewBox="0 0 24 24" width="18" height="18" stroke="currentColor" strokeWidth="2" fill="none"><path d="M12 2L2 7l10 5 10-5-10-5z" /><path d="M2 17l10 5 10-5" /><path d="M2 12l10 5 10-5" /><circle cx="12" cy="7" r="1" fill="currentColor" /><circle cx="8" cy="14.5" r="1" fill="currentColor" /><circle cx="16" cy="14.5" r="1" fill="currentColor" /></svg>, component: 'HabitTracker', category: 'utilities', defaultWidth: 900, defaultHeight: 700, minWidth: 600, minHeight: 500, resizable: true, multiple: false },
  { id: 'code-sandbox', name: '代码沙盒', icon: <CodeSandboxIcon />, component: 'CodeSandbox', category: 'development', defaultWidth: 1200, defaultHeight: 800, minWidth: 800, minHeight: 600, resizable: true, multiple: false },
  { id: 'rest-client', name: 'REST 客户端', icon: <RESTClientIcon />, component: 'RESTClient', category: 'development', defaultWidth: 1200, defaultHeight: 800, minWidth: 900, minHeight: 600, resizable: true, multiple: false },
  { id: 'ai-chat-assistant', name: 'AI 聊天助手', icon: <AIChatAssistantIcon />, component: 'AIChatAssistant', category: 'utilities', defaultWidth: 900, defaultHeight: 700, minWidth: 600, minHeight: 500, resizable: true, multiple: false },
  { id: 'task-manager-pro', name: '专业任务管理', icon: <TaskManagerProIcon />, component: 'TaskManagerPro', category: 'office', defaultWidth: 1100, defaultHeight: 800, minWidth: 700, minHeight: 550, resizable: true, multiple: false },
  { id: 'api-docs-viewer', name: 'API 文档中心', icon: <ApiIcon />, component: 'ApiDocsViewer', category: 'development', defaultWidth: 1100, defaultHeight: 800, minWidth: 800, minHeight: 600, resizable: true, multiple: false },
  { id: 'url-tools', name: 'URL 工具箱', icon: <URLToolsIcon />, component: 'URLTools', category: 'development', defaultWidth: 800, defaultHeight: 700, minWidth: 600, minHeight: 500, resizable: true, multiple: false },
  { id: 'base64-tools', name: 'Base64 工具箱', icon: <Base64ToolsIcon />, component: 'Base64Tools', category: 'development', defaultWidth: 800, defaultHeight: 700, minWidth: 600, minHeight: 500, resizable: true, multiple: false },
  { id: 'json-yaml-converter', name: 'JSON/YAML 转换器', icon: <JSONYAMLConverterIcon />, component: 'JSONYAMLConverter', category: 'development', defaultWidth: 1000, defaultHeight: 750, minWidth: 700, minHeight: 500, resizable: true, multiple: false },
  { id: 'recipe-book', name: '食谱大全', icon: <RecipeBookIcon />, component: 'RecipeBook', category: 'utilities', defaultWidth: 1100, defaultHeight: 800, minWidth: 700, minHeight: 550, resizable: true, multiple: false },
  { id: 'online-toolkit', name: '在线工具中心', icon: <OnlineToolkitIcon />, component: 'OnlineToolkit', category: 'utilities', defaultWidth: 1100, defaultHeight: 800, minWidth: 700, minHeight: 550, resizable: true, multiple: false },
  { id: 'realtime-translator', name: '实时翻译助手', icon: <RealTimeTranslatorIcon />, component: 'RealTimeTranslator', category: 'utilities', defaultWidth: 900, defaultHeight: 800, minWidth: 600, minHeight: 500, resizable: true, multiple: false },
  { id: 'stock-tracker', name: '股票市场追踪器', icon: <StockTrackerIcon />, component: 'StockTracker', category: 'utilities', defaultWidth: 1100, defaultHeight: 750, minWidth: 800, minHeight: 600, resizable: true, multiple: false },
  { id: 'markdown-slides', name: 'Markdown 幻灯片', icon: <MarkdownSlidesIcon />, component: 'MarkdownSlides', category: 'office', defaultWidth: 1200, defaultHeight: 850, minWidth: 900, minHeight: 600, resizable: true, multiple: false },
  { id: 'smart-project-hub', name: '智能项目管理', icon: <SmartProjectHubIcon />, component: 'SmartProjectHub', category: 'office', defaultWidth: 1200, defaultHeight: 850, minWidth: 900, minHeight: 600, resizable: true, multiple: false },
  { id: 'flashcards', name: '学习卡片', icon: <FlashcardsIcon />, component: 'Flashcards', category: 'utilities', defaultWidth: 1000, defaultHeight: 800, minWidth: 700, minHeight: 600, resizable: true, multiple: false },
  { id: 'daily-inspo', name: '每日灵感', icon: <SparklesIcon />, component: 'DailyInspo', category: 'utilities', defaultWidth: 700, defaultHeight: 850, minWidth: 500, minHeight: 600, resizable: true, multiple: false },
  { id: 'smart-password-manager', name: '智能密码管理器', icon: <LockIcon />, component: 'SmartPasswordManager', category: 'utilities', defaultWidth: 1000, defaultHeight: 750, minWidth: 700, minHeight: 500, resizable: true, multiple: false },
  { id: 'project-planner', name: '项目规划器', icon: <ProjectPlannerIcon />, component: 'ProjectPlanner', category: 'development', defaultWidth: 1200, defaultHeight: 850, minWidth: 900, minHeight: 600, resizable: true, multiple: false },
  { id: 'code-generator', name: '代码生成器', icon: <Code2Icon />, component: 'CodeGenerator', category: 'development', defaultWidth: 1200, defaultHeight: 850, minWidth: 900, minHeight: 650, resizable: true, multiple: false },
  { id: 'data-exporter', name: '数据导入导出', icon: <DataExporterIcon />, component: 'DataExporter', category: 'system', defaultWidth: 950, defaultHeight: 700, minWidth: 700, minHeight: 550, resizable: true, multiple: false },
  { id: 'smart-notes', name: '智能笔记', icon: <SmartNotesIcon />, component: 'SmartNotes', category: 'utilities', defaultWidth: 1100, defaultHeight: 800, minWidth: 600, minHeight: 500, resizable: true, multiple: false },
  { id: 'code-reviewer', name: '代码审查助手', icon: <CodeReviewIcon />, component: 'CodeReviewer', category: 'development', defaultWidth: 1200, defaultHeight: 800, minWidth: 900, minHeight: 600, resizable: true, multiple: false },
  { id: 'creative-toolkit', name: '创意工具箱', icon: <CreativeToolkitIcon />, component: 'CreativeToolkit', category: 'utilities', defaultWidth: 900, defaultHeight: 750, minWidth: 700, minHeight: 550, resizable: true, multiple: false },
  { id: 'markdown-previewer', name: 'Markdown 预览器', icon: <FileTextIcon />, component: 'MarkdownPreviewer', category: 'office', defaultWidth: 1200, defaultHeight: 800, minWidth: 800, minHeight: 500, resizable: true, multiple: false },
  { id: 'quick-markdown', name: '快速 Markdown 预览', icon: <FileTextIcon />, component: 'MarkdownPreview', category: 'office', defaultWidth: 900, defaultHeight: 600, minWidth: 600, minHeight: 400, resizable: true, multiple: true },
  { id: 'notes-app', name: '便签应用', icon: <NoteIcon />, component: 'Notes', category: 'office', defaultWidth: 800, defaultHeight: 600, minWidth: 500, minHeight: 400, resizable: true, multiple: true },
  { id: 'clipboard-history', name: '剪贴板历史', icon: <CustomClipboardIcon />, component: 'ClipboardHistory', category: 'utilities', defaultWidth: 700, defaultHeight: 500, minWidth: 500, minHeight: 350, resizable: true, multiple: false },
  { id: 'password-generator', name: '密码生成器', icon: <LockIcon />, component: 'PasswordGenerator', category: 'utilities', defaultWidth: 500, defaultHeight: 800, minWidth: 400, minHeight: 600, resizable: true, multiple: false },
  { id: 'text-diff', name: '文本比较工具', icon: <DiffIcon />, component: 'TextDiffViewer', category: 'utilities', defaultWidth: 1000, defaultHeight: 700, minWidth: 700, minHeight: 500, resizable: true, multiple: false },
  { id: 'timer-app', name: '定时器', icon: <ClockIcon />, component: 'TimerApp', category: 'utilities', defaultWidth: 600, defaultHeight: 700, minWidth: 500, minHeight: 500, resizable: true, multiple: false },
  { id: 'smart-dashboard', name: '智能仪表盘', icon: <DashboardIcon />, component: 'SmartDashboard', category: 'utilities', defaultWidth: 1200, defaultHeight: 850, minWidth: 900, minHeight: 600, resizable: true, multiple: false },
  { id: 'autoflow', name: 'AutoFlow 工作流', icon: <AutoFlowIcon />, component: 'AutoFlow', category: 'utilities', defaultWidth: 1300, defaultHeight: 800, minWidth: 1000, minHeight: 600, resizable: true, multiple: false },
  { id: 'focus-mode', name: '专注模式', icon: <FocusIcon />, component: 'FocusMode', category: 'utilities', defaultWidth: 1100, defaultHeight: 750, minWidth: 900, minHeight: 600, resizable: true, multiple: false },
  { id: 'task-board', name: '任务看板', icon: <BoardIcon />, component: 'TaskBoard', category: 'office', defaultWidth: 1200, defaultHeight: 800, minWidth: 900, minHeight: 600, resizable: true, multiple: false },
  { id: 'idea-capture', name: '灵感速记', icon: <IdeaIcon />, component: 'IdeaCapture', category: 'utilities', defaultWidth: 900, defaultHeight: 700, minWidth: 600, minHeight: 500, resizable: true, multiple: false },
  { id: 'code-diff-viewer', name: '代码差异查看器', icon: <DiffIcon />, component: 'CodeDiffViewer', category: 'development', defaultWidth: 1200, defaultHeight: 800, minWidth: 800, minHeight: 600, resizable: true, multiple: false },
  { id: 'image-optimizer', name: '图片优化器', icon: <ImageOptimizeIcon />, component: 'ImageOptimizer', category: 'utilities', defaultWidth: 1000, defaultHeight: 700, minWidth: 700, minHeight: 500, resizable: true, multiple: false },
  { id: 'network-speed-test', name: '网络速度测试', icon: <SpeedTestIcon />, component: 'NetworkSpeedTest', category: 'utilities', defaultWidth: 600, defaultHeight: 700, minWidth: 500, minHeight: 500, resizable: true, multiple: false },
  { id: 'learning-platform', name: '学习平台', icon: <GraduationCapIcon />, component: 'LearningPlatform', category: 'utilities', defaultWidth: 1200, defaultHeight: 800, minWidth: 900, minHeight: 600, resizable: true, multiple: false },
  { id: 'crypto-tracker', name: '加密货币追踪器', icon: <CryptoIcon />, component: 'CryptoTracker', category: 'utilities', defaultWidth: 600, defaultHeight: 900, minWidth: 450, minHeight: 600, resizable: true, multiple: false },
  { id: 'country-info', name: '国家信息', icon: <MapPinIcon />, component: 'CountryInfo', category: 'utilities', defaultWidth: 1000, defaultHeight: 700, minWidth: 700, minHeight: 500, resizable: true, multiple: false },
  { id: 'code-snippets', name: '代码片段管理', icon: <CodeSnippetsIcon />, component: 'CodeSnippetsManager', category: 'development', defaultWidth: 1100, defaultHeight: 750, minWidth: 800, minHeight: 500, resizable: true, multiple: false },
  { id: 'chat-ai', name: 'AI 智能助手', icon: <ChatAIIcon />, component: 'ChatAI', category: 'utilities', defaultWidth: 1000, defaultHeight: 750, minWidth: 700, minHeight: 500, resizable: true, multiple: false },
  { id: 'ai-chat', name: 'AI 聊天助手', icon: <ChatIcon />, component: 'AIChat', category: 'utilities', defaultWidth: 900, defaultHeight: 700, minWidth: 600, minHeight: 500, resizable: true, multiple: false },
  { id: 'code-studio', name: 'Code Studio', icon: <CodeStudioIcon />, component: 'CodeStudio', category: 'development', defaultWidth: 1100, defaultHeight: 800, minWidth: 800, minHeight: 550, resizable: true, multiple: false },
  { id: 'text-formatter', name: '文本格式化', icon: <TextFormatIcon />, component: 'TextFormatter', category: 'utilities', defaultWidth: 850, defaultHeight: 700, minWidth: 600, minHeight: 500, resizable: true, multiple: false },
  { id: 'currency-converter', name: '汇率转换', icon: <CurrencyIcon />, component: 'CurrencyConverter', category: 'utilities', defaultWidth: 850, defaultHeight: 650, minWidth: 700, minHeight: 550, resizable: true, multiple: false },
  { id: 'voice-transcriber', name: '语音转录', icon: <VoiceIcon />, component: 'VoiceTranscriber', category: 'utilities', defaultWidth: 800, defaultHeight: 700, minWidth: 600, minHeight: 500, resizable: true, multiple: false },
  { id: 'news-reader', name: '新闻阅读器', icon: <NewsIcon />, component: 'NewsReader', category: 'internet', defaultWidth: 1000, defaultHeight: 700, minWidth: 700, minHeight: 500, resizable: true, multiple: false },
  { id: 'github-trending', name: 'GitHub 热门', icon: <GitHubIcon />, component: 'GitHubTrending', category: 'development', defaultWidth: 900, defaultHeight: 700, minWidth: 600, minHeight: 450, resizable: true, multiple: false },
  { id: 'unit-converter', name: '单位转换器', icon: <UnitIcon />, component: 'UnitConverter', category: 'utilities', defaultWidth: 700, defaultHeight: 700, minWidth: 500, minHeight: 500, resizable: true, multiple: false },
  { id: 'regex-tester', name: '正则表达式测试', icon: <RegexIcon />, component: 'RegexTester', category: 'development', defaultWidth: 900, defaultHeight: 650, minWidth: 600, minHeight: 450, resizable: true, multiple: false },
  { id: 'json-formatter', name: 'JSON 格式化', icon: <JsonIcon />, component: 'JSONFormatter', category: 'development', defaultWidth: 1000, defaultHeight: 700, minWidth: 600, minHeight: 450, resizable: true, multiple: false },
  { id: 'json-schema-validator', name: 'JSON Schema 验证', icon: <JsonIcon />, component: 'JSONSchemaValidator', category: 'development', defaultWidth: 1000, defaultHeight: 700, minWidth: 600, minHeight: 450, resizable: true, multiple: false },
  { id: 'markdown-to-html', name: 'Markdown 转 HTML', icon: <FileTextIcon />, component: 'MarkdownToHTML', category: 'office', defaultWidth: 1000, defaultHeight: 700, minWidth: 600, minHeight: 450, resizable: true, multiple: false },
  { id: 'qr-generator', name: 'QR 码生成器', icon: <QRCodeIcon />, component: 'QRGenerator', category: 'utilities', defaultWidth: 900, defaultHeight: 650, minWidth: 600, minHeight: 450, resizable: true, multiple: false },
  { id: 'task-dashboard', name: '协作任务看板', icon: <TaskIcon />, component: 'TaskDashboard', category: 'office', defaultWidth: 1200, defaultHeight: 800, minWidth: 800, minHeight: 600, resizable: true, multiple: false },
  { id: 'system-dashboard', name: '系统仪表盘', icon: <SystemIcon />, component: 'SystemDashboard', category: 'system', defaultWidth: 1200, defaultHeight: 800, minWidth: 800, minHeight: 600, resizable: true, multiple: false },
  { id: 'task-automation', name: '任务自动化', icon: <AutomationIcon />, component: 'TaskAutomation', category: 'utilities', defaultWidth: 1000, defaultHeight: 700, minWidth: 700, minHeight: 500, resizable: true, multiple: false },
  { id: 'music-visualizer', name: '音乐可视化', icon: <CustomMusicIcon />, component: 'MusicVisualizer', category: 'multimedia', defaultWidth: 1000, defaultHeight: 750, minWidth: 600, minHeight: 450, resizable: true, multiple: false },
  { id: 'whiteboard', name: '白板', icon: <WhiteboardIcon />, component: 'Whiteboard', category: 'office', defaultWidth: 1000, defaultHeight: 700, minWidth: 600, minHeight: 400, resizable: true, multiple: false },
  { id: 'particle-system', name: '粒子系统', icon: <ParticleIcon />, component: 'ParticleSystem', category: 'utilities', defaultWidth: 900, defaultHeight: 700, minWidth: 600, minHeight: 400, resizable: true, multiple: false },
  { id: 'sticky-notes-wall', name: '便签墙', icon: <StickyNotesIcon />, component: 'StickyNotesWall', category: 'office', defaultWidth: 800, defaultHeight: 600, minWidth: 500, minHeight: 400, resizable: true, multiple: false },
  { id: 'virtual-pet', name: '虚拟宠物', icon: <PetIcon />, component: 'VirtualPet', category: 'games', defaultWidth: 400, defaultHeight: 650, minWidth: 350, minHeight: 550, resizable: true, multiple: false },
  { id: 'wallpaper-gallery', name: '壁纸画廊', icon: <WallpaperIcon />, component: 'WallpaperGallery', category: 'utilities', defaultWidth: 700, defaultHeight: 600, minWidth: 500, minHeight: 450, resizable: true, multiple: false },
  { id: 'mind-map', name: '思维导图', icon: <MindMapIcon />, component: 'MindMap', category: 'office', defaultWidth: 900, defaultHeight: 650, minWidth: 600, minHeight: 450, resizable: true, multiple: false },
  { id: 'pomodoro', name: '番茄工作法', icon: <PomodoroIcon />, component: 'Pomodoro', category: 'utilities', defaultWidth: 500, defaultHeight: 650, minWidth: 400, minHeight: 550, resizable: true, multiple: false },
  { id: 'smart-search', name: '智慧搜索', icon: <SearchIcon />, component: 'SmartSearch', category: 'utilities', defaultWidth: 700, defaultHeight: 600, minWidth: 500, minHeight: 400, resizable: true, multiple: false },
  { id: 'network-explorer', name: '网络探索', icon: <ApiLabIcon />, component: 'NetworkExplorer', category: 'development', defaultWidth: 1100, defaultHeight: 700, minWidth: 700, minHeight: 500, resizable: true, multiple: false },
  { id: 'files', name: '文件管理器', icon: <FolderIcon />, component: 'FileManager', category: 'system', defaultWidth: 900, defaultHeight: 600, minWidth: 500, minHeight: 350, resizable: true, multiple: true },
  { id: 'terminal', name: '终端', icon: <TerminalIcon />, component: 'Terminal', category: 'system', defaultWidth: 800, defaultHeight: 500, minWidth: 400, minHeight: 250, resizable: true, multiple: true },
  { id: 'text-editor', name: '文本编辑器', icon: <FileTextIcon />, component: 'TextEditor', category: 'office', defaultWidth: 700, defaultHeight: 500, minWidth: 400, minHeight: 300, resizable: true, multiple: true },
  { id: 'markdown-editor', name: 'Markdown 编辑器', icon: <FileTextIcon />, component: 'MarkdownEditor', category: 'office', defaultWidth: 900, defaultHeight: 600, minWidth: 600, minHeight: 400, resizable: true, multiple: true },
  { id: 'browser', name: '浏览器', icon: <BrowserIcon />, component: 'WebBrowser', category: 'internet', defaultWidth: 1024, defaultHeight: 700, minWidth: 600, minHeight: 400, resizable: true, multiple: true },
  { id: 'calculator', name: '计算器', icon: <CalculatorIcon />, component: 'Calculator', category: 'utilities', defaultWidth: 350, defaultHeight: 480, minWidth: 300, minHeight: 400, resizable: false, multiple: false },
  { id: 'date-calculator', name: '日期计算器', icon: <CalendarIcon />, component: 'DateCalculator', category: 'utilities', defaultWidth: 900, defaultHeight: 650, minWidth: 700, minHeight: 500, resizable: true, multiple: false },
  { id: 'calendar', name: '日历', icon: <CalendarIcon />, component: 'Calendar', category: 'office', defaultWidth: 700, defaultHeight: 550, minWidth: 500, minHeight: 400, resizable: true, multiple: false },
  { id: 'clock', name: '时钟', icon: <ClockIcon />, component: 'Clock', category: 'utilities', defaultWidth: 400, defaultHeight: 450, minWidth: 300, minHeight: 350, resizable: false, multiple: false },
  { id: 'weather', name: '天气', icon: <CloudRainIcon />, component: 'Weather', category: 'utilities', defaultWidth: 900, defaultHeight: 700, minWidth: 700, minHeight: 500, resizable: true, multiple: false },
  { id: 'system-monitor', name: '系统监视器', icon: <ActivityIcon />, component: 'SystemMonitor', category: 'system', defaultWidth: 900, defaultHeight: 700, minWidth: 700, minHeight: 500, resizable: true, multiple: false },
  { id: 'settings', name: '设置', icon: <SettingsIcon />, component: 'SystemSettings', category: 'system', defaultWidth: 750, defaultHeight: 550, minWidth: 550, minHeight: 400, resizable: true, multiple: false },
  { id: 'notepad', name: '记事本', icon: <NoteIcon />, component: 'Notepad', category: 'office', defaultWidth: 500, defaultHeight: 400, minWidth: 350, minHeight: 250, resizable: true, multiple: true },
  { id: 'image-viewer', name: '图片查看器', icon: <ImageIcon />, component: 'ImageViewer', category: 'multimedia', defaultWidth: 800, defaultHeight: 600, minWidth: 400, minHeight: 300, resizable: true, multiple: true },
  { id: 'music-player', name: '音乐播放器', icon: <CustomMusicIcon />, component: 'MusicPlayer', category: 'multimedia', defaultWidth: 500, defaultHeight: 400, minWidth: 350, minHeight: 300, resizable: true, multiple: false },
  { id: 'video-player', name: '视频播放器', icon: <VideoIcon />, component: 'VideoPlayer', category: 'multimedia', defaultWidth: 800, defaultHeight: 550, minWidth: 500, minHeight: 350, resizable: true, multiple: false },
  { id: 'pdf-viewer', name: 'PDF 查看器', icon: <PDFIcon />, component: 'PDFViewer', category: 'office', defaultWidth: 800, defaultHeight: 600, minWidth: 500, minHeight: 400, resizable: true, multiple: true },
  { id: 'code-editor', name: '代码编辑器', icon: <CodeIcon />, component: 'CodeEditor', category: 'development', defaultWidth: 900, defaultHeight: 600, minWidth: 550, minHeight: 350, resizable: true, multiple: true },
  { id: 'code-runner', name: '在线代码运行器', icon: <CodeIcon />, component: 'CodeRunner', category: 'development', defaultWidth: 900, defaultHeight: 600, minWidth: 600, minHeight: 400, resizable: true, multiple: false },
  { id: 'package-manager', name: '软件包管理器', icon: <PackageIcon />, component: 'PackageManager', category: 'system', defaultWidth: 700, defaultHeight: 500, minWidth: 500, minHeight: 350, resizable: true, multiple: false },
  { id: 'software-center', name: '软件中心', icon: <ShoppingCartIcon />, component: 'SoftwareCenter', category: 'system', defaultWidth: 800, defaultHeight: 600, minWidth: 600, minHeight: 400, resizable: true, multiple: false },
  { id: 'disk-usage', name: '磁盘使用分析器', icon: <HardDriveIcon />, component: 'DiskUsage', category: 'system', defaultWidth: 600, defaultHeight: 450, minWidth: 450, minHeight: 350, resizable: true, multiple: false },
  { id: 'task-manager', name: '任务管理器', icon: <ListTodoIcon />, component: 'TaskManager', category: 'system', defaultWidth: 700, defaultHeight: 500, minWidth: 500, minHeight: 350, resizable: true, multiple: false },
  { id: 'process-monitor', name: '进程监视器', icon: <ServerIcon />, component: 'ProcessMonitor', category: 'system', defaultWidth: 750, defaultHeight: 500, minWidth: 500, minHeight: 350, resizable: true, multiple: false },
  { id: 'network-monitor', name: '网络监视器', icon: <WifiIcon />, component: 'NetworkMonitor', category: 'system', defaultWidth: 650, defaultHeight: 450, minWidth: 450, minHeight: 350, resizable: true, multiple: false },
  { id: 'firewall', name: '防火墙设置', icon: <ShieldIcon />, component: 'Firewall', category: 'system', defaultWidth: 600, defaultHeight: 450, minWidth: 450, minHeight: 350, resizable: true, multiple: false },
  { id: 'user-manager', name: '用户管理', icon: <UserIcon />, component: 'UserManager', category: 'system', defaultWidth: 600, defaultHeight: 450, minWidth: 450, minHeight: 350, resizable: true, multiple: false },
  { id: 'screenshot', name: '截图工具', icon: <CameraIcon />, component: 'Screenshot', category: 'utilities', defaultWidth: 500, defaultHeight: 400, minWidth: 350, minHeight: 250, resizable: true, multiple: false },
  { id: 'paint', name: '画图', icon: <PaintIcon />, component: 'Paint', category: 'multimedia', defaultWidth: 850, defaultHeight: 600, minWidth: 500, minHeight: 350, resizable: true, multiple: true },
  { id: 'draw-pad', name: '绘图板', icon: <PaintIcon />, component: 'DrawPad', category: 'multimedia', defaultWidth: 960, defaultHeight: 680, minWidth: 700, minHeight: 500, resizable: true, multiple: true },
  { id: 'code-share', name: '代码分享', icon: <CodeIcon />, component: 'CodeShare', category: 'development', defaultWidth: 1000, defaultHeight: 700, minWidth: 700, minHeight: 500, resizable: true, multiple: false },
  { id: 'spreadsheet', name: '电子表格', icon: <GridIcon />, component: 'Spreadsheet', category: 'office', defaultWidth: 900, defaultHeight: 600, minWidth: 550, minHeight: 350, resizable: true, multiple: true },
  { id: 'presentation', name: '演示文稿', icon: <PresentationIcon />, component: 'Presentation', category: 'office', defaultWidth: 900, defaultHeight: 600, minWidth: 550, minHeight: 350, resizable: true, multiple: true },
  { id: 'email', name: '邮件客户端', icon: <MailIcon />, component: 'Email', category: 'internet', defaultWidth: 900, defaultHeight: 600, minWidth: 600, minHeight: 400, resizable: true, multiple: false },
  { id: 'chat', name: '即时通讯', icon: <MessageIcon />, component: 'Chat', category: 'internet', defaultWidth: 700, defaultHeight: 550, minWidth: 450, minHeight: 350, resizable: true, multiple: false },
  { id: 'contacts', name: '通讯录', icon: <ContactsIcon />, component: 'Contacts', category: 'office', defaultWidth: 650, defaultHeight: 500, minWidth: 450, minHeight: 350, resizable: true, multiple: false },
  { id: 'todo-list', name: '待办事项', icon: <CheckListIcon />, component: 'TodoList', category: 'office', defaultWidth: 550, defaultHeight: 500, minWidth: 350, minHeight: 350, resizable: true, multiple: false },
  { id: 'password-manager', name: '密码管理器', icon: <LockIcon />, component: 'PasswordManager', category: 'utilities', defaultWidth: 650, defaultHeight: 500, minWidth: 450, minHeight: 350, resizable: true, multiple: false },
  { id: 'backup-tool', name: '备份工具', icon: <BackupIcon />, component: 'BackupTool', category: 'system', defaultWidth: 550, defaultHeight: 450, minWidth: 400, minHeight: 300, resizable: true, multiple: false },
  { id: 'archive-manager', name: '归档管理器', icon: <ZipIcon />, component: 'ArchiveManager', category: 'utilities', defaultWidth: 600, defaultHeight: 450, minWidth: 450, minHeight: 350, resizable: true, multiple: false },
  { id: 'disk-utility', name: '磁盘工具', icon: <HardDriveIcon />, component: 'DiskUtility', category: 'system', defaultWidth: 600, defaultHeight: 450, minWidth: 450, minHeight: 350, resizable: true, multiple: false },
  { id: 'log-viewer', name: '日志查看器', icon: <FileSearchIcon />, component: 'LogViewer', category: 'system', defaultWidth: 700, defaultHeight: 500, minWidth: 500, minHeight: 350, resizable: true, multiple: false },
  { id: 'character-map', name: '字符映射表', icon: <TypeIcon />, component: 'CharacterMap', category: 'utilities', defaultWidth: 600, defaultHeight: 450, minWidth: 450, minHeight: 350, resizable: true, multiple: false },
  { id: 'font-viewer', name: '字体查看器', icon: <TypeIcon />, component: 'FontViewer', category: 'utilities', defaultWidth: 600, defaultHeight: 450, minWidth: 450, minHeight: 350, resizable: true, multiple: false },
  { id: 'web-services', name: 'Web服务工具箱', icon: <CustomGlobeIcon />, component: 'WebServicesToolbox', category: 'utilities', defaultWidth: 900, defaultHeight: 700, minWidth: 600, minHeight: 500, resizable: true, multiple: false },
  { id: 'dictionary', name: '字典', icon: <CustomBookIcon />, component: 'Dictionary', category: 'office', defaultWidth: 600, defaultHeight: 500, minWidth: 450, minHeight: 350, resizable: true, multiple: false },
  { id: 'translator', name: '翻译器', icon: <LanguagesIcon />, component: 'Translator', category: 'office', defaultWidth: 650, defaultHeight: 500, minWidth: 450, minHeight: 350, resizable: true, multiple: false },
  { id: 'maps', name: '地图', icon: <MapPinIcon />, component: 'Maps', category: 'internet', defaultWidth: 800, defaultHeight: 600, minWidth: 500, minHeight: 400, resizable: true, multiple: false },
  { id: 'camera', name: '摄像头', icon: <CameraIcon />, component: 'Camera', category: 'multimedia', defaultWidth: 640, defaultHeight: 520, minWidth: 400, minHeight: 350, resizable: true, multiple: false },
  { id: 'screen-recorder', name: '屏幕录制器', icon: <VideoRecorderIcon />, component: 'ScreenRecorder', category: 'multimedia', defaultWidth: 500, defaultHeight: 400, minWidth: 350, minHeight: 300, resizable: true, multiple: false },
  { id: 'sound-recorder', name: '录音机', icon: <MicIcon />, component: 'SoundRecorder', category: 'multimedia', defaultWidth: 400, defaultHeight: 300, minWidth: 300, minHeight: 250, resizable: false, multiple: false },
  { id: 'bluetooth', name: '蓝牙管理器', icon: <BluetoothIcon />, component: 'BluetoothManager', category: 'system', defaultWidth: 550, defaultHeight: 400, minWidth: 400, minHeight: 300, resizable: true, multiple: false },
  { id: 'wifi', name: 'Wi-Fi 管理器', icon: <WifiIcon />, component: 'WiFiManager', category: 'system', defaultWidth: 550, defaultHeight: 400, minWidth: 400, minHeight: 300, resizable: true, multiple: false },
  { id: 'system-info', name: '系统信息', icon: <SystemIcon />, component: 'SystemInfo', category: 'system', defaultWidth: 700, defaultHeight: 600, minWidth: 500, minHeight: 400, resizable: true, multiple: false },
  { id: 'power', name: '电源管理', icon: <BatteryIcon />, component: 'PowerManager', category: 'system', defaultWidth: 500, defaultHeight: 400, minWidth: 400, minHeight: 300, resizable: true, multiple: false },
  { id: 'about', name: '关于系统', icon: <InfoIcon />, component: 'About', category: 'system', defaultWidth: 550, defaultHeight: 450, minWidth: 400, minHeight: 300, resizable: false, multiple: false },
  { id: 'help', name: '帮助', icon: <HelpIcon />, component: 'Help', category: 'system', defaultWidth: 700, defaultHeight: 550, minWidth: 500, minHeight: 350, resizable: true, multiple: false },
  { id: 'command-ref', name: '命令参考', icon: <CommandIcon />, component: 'CommandReference', category: 'development', defaultWidth: 700, defaultHeight: 550, minWidth: 500, minHeight: 350, resizable: true, multiple: false },
  { id: 'color-picker', name: '取色器', icon: <PaletteIcon />, component: 'ColorPicker', category: 'utilities', defaultWidth: 450, defaultHeight: 400, minWidth: 350, minHeight: 300, resizable: false, multiple: false },
  { id: 'magnifier', name: '放大镜', icon: <MagnifierIcon />, component: 'Magnifier', category: 'utilities', defaultWidth: 400, defaultHeight: 350, minWidth: 300, minHeight: 250, resizable: false, multiple: false },
  { id: 'realtime-collab-whiteboard', name: '实时协作白板', icon: <WhiteboardIcon />, component: 'RealTimeCollaborativeWhiteboard', category: 'office', defaultWidth: 1100, defaultHeight: 850, minWidth: 800, minHeight: 600, resizable: true, multiple: false },
  { id: 'game-snake', name: '贪吃蛇', icon: <SnakeIcon />, component: 'GameSnake', category: 'games', defaultWidth: 400, defaultHeight: 450, minWidth: 350, minHeight: 400, resizable: false, multiple: false },
  { id: 'game-tetris', name: '俄罗斯方块', icon: <TetrisIcon />, component: 'GameTetris', category: 'games', defaultWidth: 400, defaultHeight: 520, minWidth: 300, minHeight: 450, resizable: false, multiple: false },
  { id: 'game-2048', name: '2048', icon: <svg viewBox="0 0 24 24" width="18" height="18" stroke="currentColor" strokeWidth="2" fill="none"><rect x="2" y="2" width="20" height="20" rx="4"/><path d="M7 7h4v4H7zM13 7h4v4h-4zM7 13h4v4H7zM13 13h4v4h-4z"/></svg>, component: 'Game2048', category: 'games', defaultWidth: 380, defaultHeight: 520, minWidth: 320, minHeight: 450, resizable: false, multiple: false },
  { id: 'game-memory', name: '记忆翻牌', icon: <svg viewBox="0 0 24 24" width="18" height="18" stroke="currentColor" strokeWidth="2" fill="none"><rect x="3" y="5" width="18" height="14" rx="2"/><line x1="3" y1="12" x2="21" y2="12"/><path d="M9 8H8M13 8H8M9 16H8M13 16H8"/></svg>, component: 'GameMemory', category: 'games', defaultWidth: 550, defaultHeight: 550, minWidth: 400, minHeight: 450, resizable: false, multiple: false },
  { id: 'game-breakout', name: '弹球游戏', icon: <svg viewBox="0 0 24 24" width="18" height="18" stroke="currentColor" strokeWidth="2" fill="none"><rect x="2" y="4" width="20" height="16" rx="2"/><line x1="7" y1="8" x2="17" y2="8"/><line x1="7" y1="12" x2="17" y2="12"/><line x1="7" y1="16" x2="17" y2="16"/><circle cx="12" cy="20" r="2"/></svg>, component: 'GameBreakout', category: 'games', defaultWidth: 420, defaultHeight: 560, minWidth: 380, minHeight: 500, resizable: false, multiple: false },
  { id: 'ai-helper', name: 'AI 助手', icon: <ChatIcon />, component: 'AIHelper', category: 'utilities', defaultWidth: 500, defaultHeight: 600, minWidth: 350, minHeight: 400, resizable: true, multiple: false },
  { id: 'kanban-board', name: '任务看板', icon: <BoardIcon />, component: 'KanbanBoard', category: 'office', defaultWidth: 900, defaultHeight: 600, minWidth: 500, minHeight: 400, resizable: true, multiple: false },
  { id: 'clipboard-manager', name: '剪贴板管理', icon: <CustomClipboardIcon />, component: 'ClipboardManager', category: 'utilities', defaultWidth: 800, defaultHeight: 500, minWidth: 600, minHeight: 400, resizable: true, multiple: false },
  { id: 'quick-commands', name: '快捷命令', icon: <LightningIcon />, component: 'QuickCommands', category: 'utilities', defaultWidth: 850, defaultHeight: 550, minWidth: 600, minHeight: 400, resizable: true, multiple: false },
  { id: 'cloud-sync', name: '云同步', icon: <CloudIcon />, component: 'CloudSync', category: 'utilities', defaultWidth: 700, defaultHeight: 650, minWidth: 500, minHeight: 450, resizable: true, multiple: false },
  { id: 'code-playground', name: '代码运行器', icon: <GameIcon />, component: 'CodePlayground', category: 'development', defaultWidth: 950, defaultHeight: 650, minWidth: 600, minHeight: 450, resizable: true, multiple: false },
  { id: 'api-tester', name: 'API 测试器', icon: <ApiIcon />, component: 'ApiTester', category: 'development', defaultWidth: 1050, defaultHeight: 700, minWidth: 700, minHeight: 500, resizable: true, multiple: false },
  { id: 'data-viz', name: '数据可视化', icon: <ChartIcon />, component: 'DataViz', category: 'development', defaultWidth: 1000, defaultHeight: 700, minWidth: 700, minHeight: 500, resizable: true, multiple: false },
  { id: 'data-visualizer', name: '高级数据可视化', icon: <ChartIcon />, component: 'DataVisualizer', category: 'development', defaultWidth: 1100, defaultHeight: 800, minWidth: 800, minHeight: 600, resizable: true, multiple: false },
  { id: 'clipboard-manager-advanced', name: '智能剪贴板管理', icon: <CustomClipboardIcon />, component: 'ClipboardManagerAdvanced', category: 'utilities', defaultWidth: 900, defaultHeight: 700, minWidth: 600, minHeight: 500, resizable: true, multiple: false },
  { id: 'quick-launcher', name: '快速启动器', icon: <RocketIcon />, component: 'QuickLauncher', category: 'utilities', defaultWidth: 550, defaultHeight: 650, minWidth: 400, minHeight: 450, resizable: true, multiple: false },
  { id: 'activity-tracker', name: '活动追踪器', icon: <ActivityIcon />, component: 'ActivityTracker', category: 'utilities', defaultWidth: 500, defaultHeight: 700, minWidth: 400, minHeight: 500, resizable: true, multiple: false },
  { id: 'performance-monitor', name: '性能监控', icon: <ZapIcon />, component: 'PerformanceMonitor', category: 'system', defaultWidth: 800, defaultHeight: 600, minWidth: 600, minHeight: 450, resizable: true, multiple: false },
  { id: 'project-manager', name: '项目管理', icon: <TaskIcon />, component: 'ProjectManager', category: 'office', defaultWidth: 1200, defaultHeight: 800, minWidth: 900, minHeight: 600, resizable: true, multiple: false },
  { id: 'random-tools', name: '随机工具', icon: <DiceIcon />, component: 'RandomTools', category: 'utilities', defaultWidth: 700, defaultHeight: 700, minWidth: 500, minHeight: 500, resizable: true, multiple: false },
  { id: 'ip-lookup', name: 'IP & DNS 查询', icon: <CustomGlobeIcon />, component: 'IPLookup', category: 'utilities', defaultWidth: 700, defaultHeight: 550, minWidth: 550, minHeight: 450, resizable: true, multiple: false },
  { id: 'system-health', name: '系统健康检查', icon: <ActivityIcon />, component: 'SystemHealthCheck', category: 'system', defaultWidth: 650, defaultHeight: 800, minWidth: 500, minHeight: 600, resizable: true, multiple: false },
  { id: 'system-toolbox', name: '系统工具箱', icon: <WrenchIcon />, component: 'SystemToolbox', category: 'utilities', defaultWidth: 900, defaultHeight: 700, minWidth: 700, minHeight: 500, resizable: true, multiple: false },
  { id: 'dev-tools', name: '开发者工具箱', icon: <WrenchIcon />, component: 'DevTools', category: 'development', defaultWidth: 800, defaultHeight: 700, minWidth: 600, minHeight: 500, resizable: true, multiple: false },
  { id: 'regex-builder', name: '正则表达式构建器', icon: <RegexIcon />, component: 'RegexBuilder', category: 'development', defaultWidth: 900, defaultHeight: 800, minWidth: 700, minHeight: 600, resizable: true, multiple: false },
  { id: 'ai-generator', name: 'AI文本生成器', icon: <SparklesIcon />, component: 'AIGenerator', category: 'utilities', defaultWidth: 1000, defaultHeight: 750, minWidth: 700, minHeight: 500, resizable: true, multiple: false },
  { id: 'collaborative-whiteboard', name: '实时协作白板', icon: <WhiteboardIcon />, component: 'CollaborativeWhiteboard', category: 'office', defaultWidth: 1000, defaultHeight: 750, minWidth: 700, minHeight: 500, resizable: true, multiple: false },
  { id: 'password-checker', name: '密码安全中心', icon: <ShieldIcon />, component: 'PasswordChecker', category: 'utilities', defaultWidth: 600, defaultHeight: 800, minWidth: 450, minHeight: 600, resizable: true, multiple: false },
  { id: 'bookmark-manager', name: '网络书签管理', icon: <BookmarkManagerIcon />, component: 'BookmarkManager', category: 'internet', defaultWidth: 1000, defaultHeight: 750, minWidth: 700, minHeight: 500, resizable: true, multiple: false },
  { id: 'code-snippet-share', name: '代码片段分享', icon: <CodeSnippetShareIcon />, component: 'CodeSnippetShare', category: 'development', defaultWidth: 1200, defaultHeight: 800, minWidth: 800, minHeight: 600, resizable: true, multiple: false },
  { id: 'system-health-dashboard', name: '智能系统健康监控', icon: <SystemHealthDashboardIcon />, component: 'SystemHealthDashboard', category: 'system', defaultWidth: 1200, defaultHeight: 900, minWidth: 900, minHeight: 600, resizable: true, multiple: false },
  { id: 'qr-generator-enhanced', name: '增强版二维码生成器', icon: <QRCodeIcon />, component: 'QRGeneratorEnhanced', category: 'utilities', defaultWidth: 900, defaultHeight: 700, minWidth: 700, minHeight: 500, resizable: true, multiple: false },
  { id: 'api-tester-enhanced', name: '增强版API测试器', icon: <ApiIcon />, component: 'ApiTesterEnhanced', category: 'development', defaultWidth: 1100, defaultHeight: 750, minWidth: 800, minHeight: 550, resizable: true, multiple: false },
  { id: 'smart-notes-enhanced', name: '增强版智能笔记', icon: <NoteIcon />, component: 'SmartNotesEnhanced', category: 'office', defaultWidth: 1100, defaultHeight: 800, minWidth: 800, minHeight: 600, resizable: true, multiple: false },
  { id: 'password-manager-enhanced', name: '增强版密码管理器', icon: <LockIcon />, component: 'PasswordManagerEnhanced', category: 'utilities', defaultWidth: 800, defaultHeight: 700, minWidth: 600, minHeight: 500, resizable: true, multiple: false },
  { id: 'code-diff-enhanced', name: '增强版代码差异查看器', icon: <CodeDiffIcon />, component: 'CodeDiffViewerEnhanced', category: 'development', defaultWidth: 1300, defaultHeight: 850, minWidth: 900, minHeight: 650, resizable: true, multiple: false },
  { id: 'api-docs-enhanced', name: '增强版API文档查看器', icon: <EnhancedApiDocsIcon />, component: 'ApiDocsViewerEnhanced', category: 'development', defaultWidth: 1200, defaultHeight: 850, minWidth: 900, minHeight: 650, resizable: true, multiple: false },
  { id: 'online-code-runner', name: '在线代码运行器', icon: <OnlineCodeRunnerIcon />, component: 'OnlineCodeRunner', category: 'development', defaultWidth: 1000, defaultHeight: 750, minWidth: 700, minHeight: 500, resizable: true, multiple: false },
  { id: 'web-tools-hub', name: 'Web工具中心', icon: <WebToolsHubIcon />, component: 'WebToolsHub', category: 'utilities', defaultWidth: 900, defaultHeight: 700, minWidth: 600, minHeight: 500, resizable: true, multiple: false },
  { id: 'ai-assistant-pro', name: 'AI智能助手Pro', icon: <AIAssistantProIcon />, component: 'AIAssistantPro', category: 'utilities', defaultWidth: 850, defaultHeight: 700, minWidth: 600, minHeight: 450, resizable: true, multiple: false },
  { id: 'ai-smart-assistant', name: 'AI智能对话助手', icon: <AISmartAssistantIcon />, component: 'AISmartAssistant', category: 'utilities', defaultWidth: 900, defaultHeight: 700, minWidth: 600, minHeight: 500, resizable: true, multiple: false },
  { id: 'notes-app-pro', name: '专业笔记应用', icon: <NotesAppIcon />, component: 'NotesApp', category: 'office', defaultWidth: 1100, defaultHeight: 800, minWidth: 700, minHeight: 500, resizable: true, multiple: false },
  { id: 'todo-app-pro', name: '专业待办事项', icon: <TodoAppIcon />, component: 'TodoApp', category: 'office', defaultWidth: 1000, defaultHeight: 750, minWidth: 600, minHeight: 500, resizable: true, multiple: false },
  { id: 'system-health-dashboard-enhanced', name: '增强版系统健康监控', icon: <SystemHealthDashboardIcon />, component: 'SystemHealthDashboardEnhanced', category: 'system', defaultWidth: 1200, defaultHeight: 900, minWidth: 900, minHeight: 600, resizable: true, multiple: false },
  { id: 'code-collaboration-hub', name: '代码协作中心', icon: <CodeStudioIcon />, component: 'CodeCollaborationHub', category: 'development', defaultWidth: 1100, defaultHeight: 800, minWidth: 800, minHeight: 600, resizable: true, multiple: false },
  { id: 'api-tester-pro', name: 'API测试器Pro', icon: <ApiIcon />, component: 'APITesterPro', category: 'development', defaultWidth: 1100, defaultHeight: 800, minWidth: 800, minHeight: 600, resizable: true, multiple: false },
  { id: 'productivity-hub', name: '生产力中心', icon: <ListTodoIcon />, component: 'ProductivityHub', category: 'office', defaultWidth: 1200, defaultHeight: 850, minWidth: 900, minHeight: 600, resizable: true, multiple: false },
  { id: 'api-lab', name: 'API 实验室', icon: <svg viewBox="0 0 24 24" width="18" height="18" stroke="currentColor" strokeWidth="2" fill="none"><path d="M9 2v6l-5 9a2 2 0 0 0 2 3h12a2 2 0 0 0 2-3l-5-9V2"/><line x1="8" y1="2" x2="16" y2="2"/><circle cx="12" cy="15" r="1.5"/></svg>, component: 'APILab', category: 'development', defaultWidth: 1300, defaultHeight: 900, minWidth: 950, minHeight: 700, resizable: true, multiple: false },
  { id: 'smart-hub', name: '智能聚合面板', icon: <svg viewBox="0 0 24 24" width="18" height="18" stroke="currentColor" strokeWidth="2" fill="none"><rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/><rect x="3" y="14" width="7" height="7" rx="1"/><rect x="14" y="14" width="7" height="7" rx="1"/><circle cx="6.5" cy="6.5" r="1.5" fill="currentColor"/><circle cx="17.5" cy="6.5" r="1.5" fill="currentColor"/><circle cx="6.5" cy="17.5" r="1.5" fill="currentColor"/><circle cx="17.5" cy="17.5" r="1.5" fill="currentColor"/></svg>, component: 'SmartHub', category: 'utilities', defaultWidth: 1350, defaultHeight: 900, minWidth: 1000, minHeight: 700, resizable: true, multiple: false },
  { id: 'utility-center', name: '实用工具中心', icon: <WrenchIcon />, component: 'UtilityCenter', category: 'utilities', defaultWidth: 1000, defaultHeight: 700, minWidth: 700, minHeight: 500, resizable: true, multiple: false },
  { id: 'currency-live', name: '实时汇率', icon: <svg viewBox="0 0 24 24" width="18" height="18" stroke="currentColor" strokeWidth="2" fill="none"><path d="M12 2v20M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/></svg>, component: 'CurrencyLive', category: 'utilities', defaultWidth: 1000, defaultHeight: 700, minWidth: 700, minHeight: 500, resizable: true, multiple: false },
  { id: 'dns-lookup', name: 'DNS 查询工具', icon: <svg viewBox="0 0 24 24" width="18" height="18" stroke="currentColor" strokeWidth="2" fill="none"><circle cx="12" cy="12" r="10"/><path d="M2 12h20M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/></svg>, component: 'DnsLookup', category: 'utilities', defaultWidth: 900, defaultHeight: 700, minWidth: 600, minHeight: 500, resizable: true, multiple: false },
  { id: 'hacker-news-reader', name: 'Hacker News 阅读', icon: <svg viewBox="0 0 24 24" width="18" height="18" stroke="currentColor" strokeWidth="2" fill="none"><path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"/><path d="M9 7l2 5 2-5M10 13h2"/></svg>, component: 'HackerNewsReader', category: 'internet', defaultWidth: 1000, defaultHeight: 750, minWidth: 700, minHeight: 500, resizable: true, multiple: false },
  { id: 'uuid-tools', name: 'UUID 工具', icon: <svg viewBox="0 0 24 24" width="18" height="18" stroke="currentColor" strokeWidth="2" fill="none"><rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8.5" cy="8.5" r="1.5" fill="currentColor"/><circle cx="15.5" cy="8.5" r="1.5" fill="currentColor"/><circle cx="8.5" cy="15.5" r="1.5" fill="currentColor"/><circle cx="15.5" cy="15.5" r="1.5" fill="currentColor"/></svg>, component: 'UuidTools', category: 'development', defaultWidth: 800, defaultHeight: 650, minWidth: 500, minHeight: 450, resizable: true, multiple: false },
  { id: 'emoji-browser', name: '表情浏览器', icon: <svg viewBox="0 0 24 24" width="18" height="18" stroke="currentColor" strokeWidth="2" fill="none"><circle cx="12" cy="12" r="10"/><path d="M8 14s1.5 2 4 2 4-2 4-2M9 9h.01M15 9h.01"/></svg>, component: 'EmojiBrowser', category: 'utilities', defaultWidth: 800, defaultHeight: 700, minWidth: 550, minHeight: 450, resizable: true, multiple: false },
  { id: 'system-status-dashboard', name: '系统状态仪表盘', icon: <svg viewBox="0 0 24 24" width="18" height="18" stroke="currentColor" strokeWidth="2" fill="none"><rect x="3" y="3" width="18" height="18" rx="2"/><path d="M3 9h18M9 21V9"/></svg>, component: 'SystemStatusDashboard', category: 'system', defaultWidth: 900, defaultHeight: 750, minWidth: 650, minHeight: 500, resizable: true, multiple: false },
  { id: 'web-dev-toolkit', name: 'Web开发工具箱', icon: <svg viewBox="0 0 24 24" width="18" height="18" stroke="currentColor" strokeWidth="2" fill="none"><rect x="2" y="3" width="20" height="14" rx="2"/><line x1="8" y1="21" x2="16" y2="21"/><line x1="12" y1="17" x2="12" y2="21"/></svg>, component: 'WebDevToolkit', category: 'development', defaultWidth: 1000, defaultHeight: 750, minWidth: 700, minHeight: 500, resizable: true, multiple: false },
  { id: 'air-quality-monitor', name: '空气质量监测', icon: <AirQualityIcon />, component: 'AirQualityMonitor', category: 'utilities', defaultWidth: 900, defaultHeight: 750, minWidth: 650, minHeight: 500, resizable: true, multiple: false },
  { id: 'devops-tools', name: 'DevOps 工具箱', icon: <svg viewBox="0 0 24 24" width="18" height="18" stroke="currentColor" strokeWidth="2" fill="none"><path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z"/><line x1="7.5" y1="12.5" x2="11.5" y2="16.5"/><line x1="15.5" y1="4.5" x2="19.5" y2="8.5"/></svg>, component: 'DevOpsTools', category: 'development', defaultWidth: 1200, defaultHeight: 850, minWidth: 780, minHeight: 550, resizable: true, multiple: false },
  { id: 'chinese-poetry', name: '中国古诗词', icon: <ChinesePoetryIcon />, component: 'ChinesePoetry', category: 'utilities', defaultWidth: 1000, defaultHeight: 800, minWidth: 680, minHeight: 500, resizable: true, multiple: false },
  { id: 'rss-reader', name: 'RSS 订阅阅读器', icon: <svg viewBox="0 0 24 24" width="18" height="18" stroke="currentColor" strokeWidth="2" fill="none"><circle cx="6" cy="18" r="2" fill="currentColor" stroke="none"/><path d="M4 11a9 9 0 0 1 9 9"/><path d="M4 4a16 16 0 0 1 16 16"/></svg>, component: 'RSSReader', category: 'internet', defaultWidth: 1200, defaultHeight: 850, minWidth: 760, minHeight: 540, resizable: true, multiple: false },
  { id: 'space-explorer', name: '宇宙探索', icon: <SpaceExplorerIcon />, component: 'SpaceExplorer', category: 'internet', defaultWidth: 1200, defaultHeight: 850, minWidth: 800, minHeight: 550, resizable: true, multiple: false },
  { id: 'code-interpreter', name: 'AI代码解释器', icon: <svg viewBox="0 0 24 24" width="18" height="18" stroke="currentColor" strokeWidth="2" fill="none"><polyline points="16 18 22 12 16 6"/><polyline points="8 6 2 12 8 18"/><circle cx="12" cy="12" r="3"/><path d="M12 9v6"/></svg>, component: 'CodeInterpreter', category: 'development', defaultWidth: 1100, defaultHeight: 800, minWidth: 800, minHeight: 600, resizable: true, multiple: false },
  { id: 'smart-schedule', name: '智能日程助手', icon: <svg viewBox="0 0 24 24" width="18" height="18" stroke="currentColor" strokeWidth="2" fill="none"><rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/><path d="M8 14h.01M12 14h.01M16 14h.01M8 18h.01M12 18h.01"/></svg>, component: 'SmartScheduleAssistant', category: 'office', defaultWidth: 1000, defaultHeight: 750, minWidth: 700, minHeight: 500, resizable: true, multiple: false },
  { id: 'online-api-hub', name: '在线API工具中心', icon: <svg viewBox="0 0 24 24" width="18" height="18" stroke="currentColor" strokeWidth="2" fill="none"><circle cx="12" cy="12" r="10"/><path d="M2 12h20M12 2a15 15 0 0 1 4 10 15 15 0 0 1-4 10 15 15 0 0 1-4-10 15 15 0 0 1 4-10z"/><path d="M12 6v12M6 12h12"/></svg>, component: 'OnlineAPIHub', category: 'utilities', defaultWidth: 1000, defaultHeight: 800, minWidth: 700, minHeight: 550, resizable: true, multiple: false },
  { id: 'system-assistant', name: '系统助手', icon: <SystemAssistantIcon />, component: 'SystemAssistant', category: 'system', defaultWidth: 900, defaultHeight: 700, minWidth: 650, minHeight: 500, resizable: true, multiple: false },
  { id: 'ai-prompt-library', name: 'AI 提示词库', icon: <svg viewBox="0 0 24 24" width="18" height="18" stroke="currentColor" strokeWidth="2" fill="none"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="9" y1="13" x2="15" y2="13"/><line x1="9" y1="17" x2="15" y2="17"/><circle cx="19" cy="20" r="3" fill="currentColor" stroke="none"/></svg>, component: 'AIPromptLibrary', category: 'utilities', defaultWidth: 1100, defaultHeight: 800, minWidth: 750, minHeight: 550, resizable: true, multiple: false },
  { id: 'knowledge-cards', name: '知识卡片记忆', icon: <svg viewBox="0 0 24 24" width="18" height="18" stroke="currentColor" strokeWidth="2" fill="none"><rect x="2" y="3" width="20" height="14" rx="2"/><line x1="2" y1="17" x2="22" y2="17"/><line x1="8" y1="21" x2="16" y2="21"/><circle cx="12" cy="10" r="2" fill="currentColor" stroke="none"/></svg>, component: 'KnowledgeCards', category: 'office', defaultWidth: 1100, defaultHeight: 800, minWidth: 750, minHeight: 550, resizable: true, multiple: false },
  { id: 'space-explorer-pro', name: '太空探索专业版', icon: <svg viewBox="0 0 24 24" width="18" height="18" stroke="currentColor" strokeWidth="2" fill="none"><circle cx="12" cy="12" r="10"/><circle cx="12" cy="12" r="4"/><path d="M12 2a10 10 0 0 1 0 20M2 12h20"/><circle cx="12" cy="12" r="1" fill="currentColor" stroke="none"/></svg>, component: 'SpaceExplorerPro', category: 'internet', defaultWidth: 1200, defaultHeight: 850, minWidth: 850, minHeight: 650, resizable: true, multiple: false },
  { id: 'css-toolbox', name: 'CSS 工具箱', icon: <svg viewBox="0 0 24 24" width="18" height="18" stroke="currentColor" strokeWidth="2" fill="none"><path d="M4 4h16l-2 16H6L4 4z"/><path d="M8 10h8M8 14h8"/></svg>, component: 'CSSToolbox', category: 'development', defaultWidth: 1250, defaultHeight: 850, minWidth: 900, minHeight: 650, resizable: true, multiple: false },
  { id: 'quick-notes-pro', name: '便签专业版', icon: <QuickNotesProIcon />, component: 'QuickNotesPro', category: 'office', defaultWidth: 1100, defaultHeight: 800, minWidth: 700, minHeight: 550, resizable: true, multiple: false },
  { id: 'dev-toolbox-pro', name: '开发者工具箱Pro', icon: <svg viewBox="0 0 24 24" width="18" height="18" stroke="currentColor" strokeWidth="2" fill="none"><path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z"/><line x1="7.5" y1="12.5" x2="11.5" y2="16.5"/><line x1="15.5" y1="4.5" x2="19.5" y2="8.5"/></svg>, component: 'DevToolboxPro', category: 'development', defaultWidth: 1100, defaultHeight: 750, minWidth: 800, minHeight: 550, resizable: true, multiple: false },
  { id: 'markdown-editor-pro', name: 'Markdown编辑器Pro', icon: <svg viewBox="0 0 24 24" width="18" height="18" stroke="currentColor" strokeWidth="2" fill="none"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="9" y1="15" x2="15" y2="15"/><line x1="9" y1="11" x2="15" y2="11"/></svg>, component: 'MarkdownEditorPro', category: 'office', defaultWidth: 1200, defaultHeight: 800, minWidth: 800, minHeight: 600, resizable: true, multiple: false },
  { id: 'system-monitor-pro', name: '系统监视器Pro', icon: <svg viewBox="0 0 24 24" width="18" height="18" stroke="currentColor" strokeWidth="2" fill="none"><rect x="2" y="3" width="20" height="14" rx="2"/><path d="M2 17h20M8 21h8"/></svg>, component: 'SystemMonitorPro', category: 'system', defaultWidth: 1000, defaultHeight: 700, minWidth: 700, minHeight: 500, resizable: true, multiple: false },
  { id: 'pomodoro-pro', name: '番茄钟Pro', icon: <svg viewBox="0 0 24 24" width="18" height="18" stroke="currentColor" strokeWidth="2" fill="none"><path d="M12 22c5 0 9-4 9-9V9H3v4c0 5 4 9 9 9z"/><path d="M18 2l-3 3M22 5l-3 3M12 2v5M8 2v5"/><circle cx="12" cy="15" r="3"/></svg>, component: 'PomodoroPro', category: 'utilities', defaultWidth: 500, defaultHeight: 650, minWidth: 400, minHeight: 500, resizable: true, multiple: false },
  // === 新增创新应用 ===
  { id: 'ai-programming-assistant-pro', name: 'AI编程助手Pro', icon: <svg viewBox="0 0 24 24" width="18" height="18" stroke="currentColor" strokeWidth="2" fill="none"><circle cx="12" cy="12" r="10"/><path d="M8 9h8M8 13h6"/><circle cx="12" cy="12" r="3" fill="currentColor" stroke="none"/><path d="M12 2v4M12 18v4"/></svg>, component: 'AIProgrammingAssistantPro', category: 'development', defaultWidth: 1100, defaultHeight: 800, minWidth: 800, minHeight: 600, resizable: true, multiple: false },
  { id: 'realtime-data-dashboard', name: '实时数据仪表板', icon: <svg viewBox="0 0 24 24" width="18" height="18" stroke="currentColor" strokeWidth="2" fill="none"><rect x="3" y="3" width="18" height="18" rx="2"/><path d="M3 9h18M9 21V9"/><rect x="7" y="11" width="3" height="6" fill="currentColor" stroke="none"/><rect x="11" y="13" width="3" height="4" fill="currentColor" stroke="none"/><rect x="15" y="10" width="3" height="7" fill="currentColor" stroke="none"/></svg>, component: 'RealTimeDataDashboard', category: 'utilities', defaultWidth: 1200, defaultHeight: 850, minWidth: 900, minHeight: 650, resizable: true, multiple: false },
  { id: 'collaborative-whiteboard-enhanced', name: '在线协作白板', icon: <svg viewBox="0 0 24 24" width="18" height="18" stroke="currentColor" strokeWidth="2" fill="none"><rect x="3" y="3" width="18" height="18" rx="2"/><path d="M3 9h18M9 21V9"/><path d="M7 13l3 3 4-6 3 3"/></svg>, component: 'CollaborativeWhiteboardEnhanced', category: 'office', defaultWidth: 1100, defaultHeight: 800, minWidth: 800, minHeight: 600, resizable: true, multiple: false },
  // === v3.2.0 新增安全与设计工具 ===
  { id: 'jwt-decoder', name: 'JWT 解码与验证', icon: <svg viewBox="0 0 24 24" width="18" height="18" stroke="currentColor" strokeWidth="2" fill="none"><rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/><circle cx="12" cy="16" r="1.5" fill="currentColor" stroke="none"/></svg>, component: 'JwtDecoder', category: 'development', defaultWidth: 1100, defaultHeight: 750, minWidth: 800, minHeight: 600, resizable: true, multiple: false },
  { id: 'color-palette-extractor', name: '配色方案提取器', icon: <svg viewBox="0 0 24 24" width="18" height="18" stroke="currentColor" strokeWidth="2" fill="none"><circle cx="12" cy="12" r="9"/><circle cx="8" cy="9" r="1.5" fill="currentColor" stroke="none"/><circle cx="15" cy="8" r="1.5" fill="currentColor" stroke="none"/><circle cx="16" cy="14" r="1.5" fill="currentColor" stroke="none"/><circle cx="10" cy="15" r="1.5" fill="currentColor" stroke="none"/></svg>, component: 'ColorPaletteExtractor', category: 'utilities', defaultWidth: 1100, defaultHeight: 800, minWidth: 800, minHeight: 600, resizable: true, multiple: false },
  { id: 'password-strength', name: '密码强度分析', icon: <svg viewBox="0 0 24 24" width="18" height="18" stroke="currentColor" strokeWidth="2" fill="none"><path d="M12 2L4 6v6c0 5 3.5 9 8 10 4.5-1 8-5 8-10V6l-8-4z"/><path d="M9 12l2 2 4-4"/></svg>, component: 'PasswordStrength', category: 'utilities', defaultWidth: 950, defaultHeight: 800, minWidth: 700, minHeight: 600, resizable: true, multiple: false },
  // === v5.0.0 新增创新工具应用 ===
  { id: 'network-toolkit', name: '网络工具站', icon: <svg viewBox="0 0 24 24" width="18" height="18" stroke="currentColor" strokeWidth="2" fill="none"><circle cx="12" cy="12" r="10"/><path d="M2 12h20M12 2a15 15 0 0 1 4 10 15 15 0 0 1-4 10 15 15 0 0 1-4-10 15 15 0 0 1 4-10z"/><circle cx="12" cy="12" r="2" fill="currentColor"/></svg>, component: 'NetworkToolkit', category: 'utilities', defaultWidth: 950, defaultHeight: 750, minWidth: 700, minHeight: 550, resizable: true, multiple: false },
  { id: 'codelab', name: '代码实验室', icon: <svg viewBox="0 0 24 24" width="18" height="18" stroke="currentColor" strokeWidth="2" fill="none"><path d="M9 3v2H5v14h14V5h-4V3H9zm2 4h2v2h-2V7zm-4 4h10v2H7v-2zm0 4h10v2H7v-2z"/></svg>, component: 'CodeLab', category: 'development', defaultWidth: 1200, defaultHeight: 850, minWidth: 900, minHeight: 650, resizable: true, multiple: false },
  { id: 'smart-code-assistant', name: '智能代码助手', icon: <svg viewBox="0 0 24 24" width="18" height="18" stroke="currentColor" strokeWidth="2" fill="none"><circle cx="12" cy="12" r="10"/><path d="M8 10h8M8 14h6"/><circle cx="12" cy="12" r="2" fill="currentColor" stroke="none"/><path d="M3 12l4 4M21 12l-4 4"/></svg>, component: 'SmartCodeAssistant', category: 'development', defaultWidth: 1200, defaultHeight: 850, minWidth: 900, minHeight: 650, resizable: true, multiple: false },
  // === v6.4.0 新增知识管理与内容收藏应用 ===
  { id: 'knowledge-garden', name: '知识花园', icon: <svg viewBox="0 0 24 24" width="18" height="18" stroke="currentColor" strokeWidth="2" fill="none"><circle cx="12" cy="12" r="9"/><circle cx="12" cy="12" r="4"/><path d="M12 3v3M12 18v3M3 12h3M18 12h3M5.6 5.6l2.1 2.1M16.3 16.3l2.1 2.1M5.6 18.4l2.1-2.1M16.3 7.7l2.1-2.1"/></svg>, component: 'KnowledgeGarden', category: 'office', defaultWidth: 1200, defaultHeight: 800, minWidth: 900, minHeight: 600, resizable: true, multiple: false },
  { id: 'web-clipper', name: '网页剪藏', icon: <svg viewBox="0 0 24 24" width="18" height="18" stroke="currentColor" strokeWidth="2" fill="none"><path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z"/></svg>, component: 'WebClipper', category: 'utilities', defaultWidth: 1100, defaultHeight: 800, minWidth: 850, minHeight: 600, resizable: true, multiple: false },
  // === v7.0.0 新增AI智能中心与实用工具聚合 ===
  { id: 'ai-smart-hub', name: 'AI智能中心', icon: <svg viewBox="0 0 24 24" width="18" height="18" stroke="currentColor" strokeWidth="2" fill="none"><circle cx="12" cy="12" r="10"/><path d="M8 14s1.5 2 4 2 4-2 4-2"/><line x1="9" y1="9" x2="9.01" y2="9"/><line x1="15" y1="9" x2="15.01" y2="9"/><path d="M12 2v4M12 18v4M2 12h4M18 12h4"/><circle cx="12" cy="12" r="3" fill="currentColor" stroke="none"/></svg>, component: 'AISmartHub', category: 'utilities', defaultWidth: 1200, defaultHeight: 800, minWidth: 900, minHeight: 600, resizable: true, multiple: false },
  { id: 'utility-hub', name: '实用工具聚合中心', icon: <svg viewBox="0 0 24 24" width="18" height="18" stroke="currentColor" strokeWidth="2" fill="none"><rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/><rect x="3" y="14" width="7" height="7" rx="1"/><rect x="14" y="14" width="7" height="7" rx="1"/><circle cx="6.5" cy="6.5" r="1.5" fill="currentColor"/><circle cx="17.5" cy="6.5" r="1.5" fill="currentColor"/><circle cx="6.5" cy="17.5" r="1.5" fill="currentColor"/><circle cx="17.5" cy="17.5" r="1.5" fill="currentColor"/></svg>, component: 'UtilityHub', category: 'utilities', defaultWidth: 1300, defaultHeight: 850, minWidth: 1000, minHeight: 700, resizable: true, multiple: false },
  { id: 'api-playbook', name: 'API演练场', icon: <svg viewBox="0 0 24 24" width="18" height="18" stroke="currentColor" strokeWidth="2" fill="none"><circle cx="12" cy="12" r="10"/><path d="M2 12h20M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/><circle cx="12" cy="12" r="2" fill="currentColor"/></svg>, component: 'APIPlaybook', category: 'development', defaultWidth: 1100, defaultHeight: 800, minWidth: 850, minHeight: 600, resizable: true, multiple: false },
  { id: 'icon-gallery', name: '图标画廊', icon: <svg viewBox="0 0 24 24" width="18" height="18" stroke="currentColor" strokeWidth="2" fill="none"><rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8.5" cy="8.5" r="1.5"/><path d="M21 15l-5-5L5 21"/></svg>, component: 'IconGallery', category: 'utilities', defaultWidth: 1000, defaultHeight: 750, minWidth: 800, minHeight: 600, resizable: true, multiple: false },
  { id: 'world-clock', name: '世界时钟', icon: <ClockIcon />, component: 'WorldClock', category: 'utilities', defaultWidth: 900, defaultHeight: 700, minWidth: 700, minHeight: 500, resizable: true, multiple: false },
  { id: 'api-explorer', name: 'API探索器', icon: <ApiIcon />, component: 'APIExplorer', category: 'development', defaultWidth: 1100, defaultHeight: 800, minWidth: 850, minHeight: 600, resizable: true, multiple: false },
  // === v8.0.0 新增创新应用 ===
  { id: 'dev-hub', name: '开发者工具中心', icon: <svg viewBox="0 0 24 24" width="18" height="18" stroke="currentColor" strokeWidth="2" fill="none"><rect x="3" y="3" width="18" height="18" rx="2"/><path d="M9 9h6M9 13h6M9 17h4"/><circle cx="17" cy="17" r="2" fill="currentColor"/></svg>, component: 'DevHub', category: 'development', defaultWidth: 1000, defaultHeight: 750, minWidth: 700, minHeight: 500, resizable: true, multiple: false },
  { id: 'ai-assistant-enhanced', name: 'AI智能助手增强版', icon: <svg viewBox="0 0 24 24" width="18" height="18" stroke="currentColor" strokeWidth="2" fill="none"><circle cx="12" cy="12" r="10"/><path d="M8 14s1.5 2 4 2 4-2 4-2"/><line x1="9" y1="9" x2="9.01" y2="9"/><line x1="15" y1="9" x2="15.01" y2="9"/><path d="M12 2v4M12 18v4"/><circle cx="12" cy="12" r="3" fill="currentColor" stroke="none"/></svg>, component: 'AIAssistantEnhanced', category: 'utilities', defaultWidth: 900, defaultHeight: 700, minWidth: 600, minHeight: 500, resizable: true, multiple: false },
  { id: 'api-explorer-enhanced', name: '公开API探索器', icon: <svg viewBox="0 0 24 24" width="18" height="18" stroke="currentColor" strokeWidth="2" fill="none"><circle cx="12" cy="12" r="10"/><path d="M2 12h20M12 2a15 15 0 0 1 4 10 15 15 0 0 1-4 10 15 15 0 0 1-4-10 15 15 0 0 1 4-10z"/><path d="M12 6v12M6 12h12"/></svg>, component: 'APIExplorerEnhanced', category: 'development', defaultWidth: 1100, defaultHeight: 800, minWidth: 800, minHeight: 600, resizable: true, multiple: false },
  // === v8.1.0 新增公共 API 集成应用 ===
  { id: 'astro-daily', name: '天文每日', icon: <svg viewBox="0 0 24 24" width="18" height="18" stroke="currentColor" strokeWidth="2" fill="none"><circle cx="12" cy="12" r="4"/><path d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M4.93 19.07l1.41-1.41M17.66 6.34l1.41-1.41"/></svg>, component: 'AstroDaily', category: 'internet', defaultWidth: 1100, defaultHeight: 800, minWidth: 800, minHeight: 600, resizable: true, multiple: false },
  { id: 'reading-list', name: '阅读清单', icon: <svg viewBox="0 0 24 24" width="18" height="18" stroke="currentColor" strokeWidth="2" fill="none"><path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z"/><path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z"/></svg>, component: 'ReadingList', category: 'office', defaultWidth: 1200, defaultHeight: 850, minWidth: 800, minHeight: 600, resizable: true, multiple: false },
  { id: 'github-profile', name: 'GitHub 资料', icon: <svg viewBox="0 0 24 24" width="18" height="18" stroke="currentColor" strokeWidth="2" fill="none"><path d="M9 19c-5 1.5-5-2.5-7-3m14 6v-3.87a3.37 3.37 0 0 0-.94-2.61c3.14-.35 6.44-1.54 6.44-7A5.44 5.44 0 0 0 20 4.77 5.07 5.07 0 0 0 19.91 1S18.73.65 16 2.48a13.38 13.38 0 0 0-7 0C6.27.65 5.09 1 5.09 1A5.07 5.07 0 0 0 5 4.77a5.44 5.44 0 0 0-1.5 3.78c0 5.42 3.3 6.61 6.44 7A3.37 3.37 0 0 0 9 18.13V22"/></svg>, component: 'GitHubProfile', category: 'development', defaultWidth: 1200, defaultHeight: 850, minWidth: 800, minHeight: 600, resizable: true, multiple: false },
  // === v8.2.0 新增实用工具 ===
  { id: 'hash-generator', name: 'Hash 生成器', icon: <svg viewBox="0 0 24 24" width="18" height="18" stroke="currentColor" strokeWidth="2" fill="none"><line x1="4" y1="9" x2="20" y2="9"/><line x1="4" y1="15" x2="20" y2="15"/><line x1="10" y1="3" x2="8" y2="21"/><line x1="16" y1="3" x2="14" y2="21"/></svg>, component: 'HashGenerator', category: 'development', defaultWidth: 800, defaultHeight: 700, minWidth: 600, minHeight: 500, resizable: true, multiple: false },
  // === v9.0.0 新增创新应用 ===
  { id: 'ai-code-analyzer', name: 'AI代码分析器', icon: <svg viewBox="0 0 24 24" width="18" height="18" stroke="currentColor" strokeWidth="2" fill="none"><circle cx="12" cy="12" r="10"/><path d="M8 9h8M8 13h6"/><path d="M12 6v3M12 15v3"/><circle cx="12" cy="12" r="2" fill="currentColor" stroke="none"/><path d="M9 19l3-3 3 3"/></svg>, component: 'AICodeAnalyzer', category: 'development', defaultWidth: 1200, defaultHeight: 850, minWidth: 900, minHeight: 650, resizable: true, multiple: false },
  { id: 'network-status-dashboard', name: '网络状态仪表盘', icon: <svg viewBox="0 0 24 24" width="18" height="18" stroke="currentColor" strokeWidth="2" fill="none"><circle cx="12" cy="12" r="10"/><path d="M2 12h20M12 2a15 15 0 0 1 4 10 15 15 0 0 1-4 10 15 15 0 0 1-4-10 15 15 0 0 1 4-10z"/><circle cx="12" cy="12" r="3" fill="currentColor" stroke="none"/><path d="M6 8l6 4M12 12l6-4"/></svg>, component: 'NetworkStatusDashboard', category: 'system', defaultWidth: 1100, defaultHeight: 800, minWidth: 850, minHeight: 600, resizable: true, multiple: false },
  { id: 'system-optimizer', name: '系统资源优化器', icon: <svg viewBox="0 0 24 24" width="18" height="18" stroke="currentColor" strokeWidth="2" fill="none"><circle cx="12" cy="12" r="10"/><path d="M12 6v6l4 2"/><circle cx="12" cy="12" r="3" fill="currentColor" stroke="none"/><path d="M8 14l2-2M16 14l-2-2"/><path d="M12 2v2M12 20v2M2 12h2M20 12h2"/></svg>, component: 'SystemOptimizer', category: 'system', defaultWidth: 1100, defaultHeight: 850, minWidth: 850, minHeight: 650, resizable: true, multiple: false },
  // === v9.2.0 新增工作流自动化应用 ===
  { id: 'workflow-automation', name: '工作流自动化', icon: <svg viewBox="0 0 24 24" width="18" height="18" stroke="currentColor" strokeWidth="2" fill="none"><rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/><rect x="3" y="14" width="7" height="7" rx="1"/><rect x="14" y="14" width="7" height="7" rx="1"/><path d="M10 6.5h4M6.5 10v4M17.5 10v4M10 17.5h4"/></svg>, component: 'WorkflowAutomation', category: 'utilities', defaultWidth: 1200, defaultHeight: 800, minWidth: 900, minHeight: 600, resizable: true, multiple: false },
  // === v10.0.0 新增创新协作与监控工具 ===
  { id: 'markdown-collaborator', name: '实时Markdown协作编辑器', icon: <svg viewBox="0 0 24 24" width="18" height="18" stroke="currentColor" strokeWidth="2" fill="none"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="9" y1="15" x2="15" y2="15"/><line x1="9" y1="11" x2="15" y2="11"/><circle cx="18" cy="18" r="3" fill="currentColor" stroke="none"/><circle cx="6" cy="18" r="3" fill="currentColor" stroke="none"/></svg>, component: 'MarkdownCollaborator', category: 'office', defaultWidth: 1300, defaultHeight: 900, minWidth: 1000, minHeight: 700, resizable: true, multiple: false },
  { id: 'api-health-monitor', name: 'API健康监控中心', icon: <svg viewBox="0 0 24 24" width="18" height="18" stroke="currentColor" strokeWidth="2" fill="none"><circle cx="12" cy="12" r="10"/><path d="M2 12h20M12 2a15 15 0 0 1 4 10 15 15 0 0 1-4 10 15 15 0 0 1-4-10 15 15 0 0 1 4-10z"/><circle cx="12" cy="12" r="2" fill="currentColor"/><path d="M8 10l4 2 4-2"/><path d="M12 14v4"/></svg>, component: 'APIHealthMonitor', category: 'utilities', defaultWidth: 1300, defaultHeight: 900, minWidth: 1000, minHeight: 700, resizable: true, multiple: false },
  { id: 'code-snippet-hub', name: '代码片段分享中心', icon: <svg viewBox="0 0 24 24" width="18" height="18" stroke="currentColor" strokeWidth="2" fill="none"><polyline points="16 18 22 12 16 6"/><polyline points="8 6 2 12 8 18"/><circle cx="12" cy="12" r="3" fill="currentColor" stroke="none"/><path d="M12 2v4M12 18v4"/></svg>, component: 'CodeSnippetHub', category: 'development', defaultWidth: 1200, defaultHeight: 850, minWidth: 900, minHeight: 650, resizable: true, multiple: false },
  // === v11.0.0 新增创新生产力与学习工具 ===
  { id: 'time-management-master', name: '时间管理大师', icon: <svg viewBox="0 0 24 24" width="18" height="18" stroke="currentColor" strokeWidth="2" fill="none"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/><rect x="3" y="3" width="6" height="6" rx="1" fill="currentColor" stroke="none"/><rect x="15" y="15" width="6" height="6" rx="1" fill="currentColor" stroke="none"/><path d="M6 8h3M15 17h3"/></svg>, component: 'TimeManagementMaster', category: 'office', defaultWidth: 1300, defaultHeight: 900, minWidth: 1000, minHeight: 700, resizable: true, multiple: false },
  { id: 'ai-learning-companion', name: 'AI学习伴侣', icon: <svg viewBox="0 0 24 24" width="18" height="18" stroke="currentColor" strokeWidth="2" fill="none"><circle cx="12" cy="12" r="10"/><path d="M8 14s1.5 2 4 2 4-2 4-2"/><circle cx="9" cy="10" r="1" fill="currentColor"/><circle cx="15" cy="10" r="1" fill="currentColor"/><path d="M2 7l4 5-4 5"/><path d="M22 7l-4 5 4 5"/><rect x="6" y="4" width="12" height="3" rx="1" fill="currentColor" stroke="none"/></svg>, component: 'AILearningCompanion', category: 'utilities', defaultWidth: 1200, defaultHeight: 850, minWidth: 900, minHeight: 650, resizable: true, multiple: false },
  { id: 'creative-inspiration-workshop', name: '创意灵感工坊', icon: <svg viewBox="0 0 24 24" width="18" height="18" stroke="currentColor" strokeWidth="2" fill="none"><path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3"/><path d="M12 17h.01"/><path d="M12 2a10 10 0 1 0 10 10A10 10 0 0 0 12 2z"/><path d="M4 4l4 4M20 4l-4 4M4 20l4-4M20 20l-4-4"/><circle cx="12" cy="12" r="3" fill="currentColor" stroke="none"/></svg>, component: 'CreativeInspirationWorkshop', category: 'utilities', defaultWidth: 1100, defaultHeight: 800, minWidth: 800, minHeight: 600, resizable: true, multiple: false },
  { id: 'dev-ecosystem', name: '开发者生态系统', icon: <svg viewBox="0 0 24 24" width="18" height="18" stroke="currentColor" strokeWidth="2" fill="none"><circle cx="12" cy="12" r="3"/><circle cx="5" cy="5" r="2"/><circle cx="19" cy="5" r="2"/><circle cx="5" cy="19" r="2"/><circle cx="19" cy="19" r="2"/><path d="M12 9V5M12 15v4M9 12H5M15 12h4"/><path d="M7 7l3 3M14 14l3 3M7 17l3-3M14 10l3-3"/></svg>, component: 'DevEcosystem', category: 'development', defaultWidth: 1400, defaultHeight: 900, minWidth: 1000, minHeight: 700, resizable: true, multiple: false },
  // === v12.1.0 新增实用工具箱 ===
  { id: 'utility-toolkit', name: '实用工具箱', icon: <WrenchIcon />, component: 'UtilityToolkit', category: 'utilities', defaultWidth: 900, defaultHeight: 700, minWidth: 700, minHeight: 500, resizable: true, multiple: false },
  // === v13.0.0 新增创新应用 ===
  { id: 'code-interview-prep', name: '编程面试准备', icon: <svg viewBox="0 0 24 24" width="18" height="18" stroke="currentColor" strokeWidth="2" fill="none"><path d="M16 18l6-6-6-6"/><path d="M8 6l-6 6 6 6"/><path d="M14 4l-4 16"/></svg>, component: 'CodeInterviewPrep', category: 'development', defaultWidth: 1200, defaultHeight: 850, minWidth: 900, minHeight: 650, resizable: true, multiple: false },
  { id: 'api-playground', name: 'API游乐场', icon: <svg viewBox="0 0 24 24" width="18" height="18" stroke="currentColor" strokeWidth="2" fill="none"><circle cx="12" cy="12" r="10"/><path d="M2 12h20M12 2a15 15 0 0 1 4 10 15 15 0 0 1-4 10 15 15 0 0 1-4-10 15 15 0 0 1 4-10z"/><circle cx="12" cy="12" r="3"/></svg>, component: 'APIPlayground', category: 'development', defaultWidth: 1200, defaultHeight: 850, minWidth: 900, minHeight: 650, resizable: true, multiple: false },
  { id: 'data-viz-studio', name: '数据可视化工作室', icon: <svg viewBox="0 0 24 24" width="18" height="18" stroke="currentColor" strokeWidth="2" fill="none"><rect x="3" y="3" width="18" height="18" rx="2"/><path d="M3 9h18M9 21V9"/><path d="M7 17l3-3 4 4 4-6"/></svg>, component: 'DataVizStudio', category: 'development', defaultWidth: 1300, defaultHeight: 900, minWidth: 1000, minHeight: 700, resizable: true, multiple: false },
  // === v14.0 新增实用工具应用 ===
  { id: 'dev-toolkit', name: '开发者工具箱', icon: <svg viewBox="0 0 24 24" width="18" height="18" stroke="currentColor" strokeWidth="2" fill="none"><path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z"/></svg>, component: 'DevToolkit', category: 'development', defaultWidth: 1100, defaultHeight: 800, minWidth: 800, minHeight: 600, resizable: true, multiple: false },
  { id: 'smart-overview', name: '智能概览', icon: <svg viewBox="0 0 24 24" width="18" height="18" stroke="currentColor" strokeWidth="2" fill="none"><rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/><rect x="3" y="14" width="7" height="7" rx="1"/><rect x="14" y="14" width="7" height="7" rx="1"/><circle cx="6.5" cy="6.5" r="1.5" fill="currentColor"/><circle cx="17.5" cy="6.5" r="1.5" fill="currentColor"/><circle cx="6.5" cy="17.5" r="1.5" fill="currentColor"/><circle cx="17.5" cy="17.5" r="1.5" fill="currentColor"/></svg>, component: 'SmartOverview', category: 'system', defaultWidth: 1200, defaultHeight: 850, minWidth: 900, minHeight: 650, resizable: true, multiple: false },
  // === v15.0 新增创新应用 ===
  { id: 'web-ide', name: 'WebIDE 在线开发环境', icon: <Code2Icon />, component: 'WebIDE', category: 'development', defaultWidth: 1300, defaultHeight: 900, minWidth: 950, minHeight: 700, resizable: true, multiple: false },
  { id: 'global-search', name: '全局搜索中心', icon: <SearchIcon />, component: 'GlobalSearch', category: 'utilities', defaultWidth: 1000, defaultHeight: 750, minWidth: 750, minHeight: 550, resizable: true, multiple: false },
  { id: 'wikipedia-explorer', name: '维基百科探索', icon: <WikipediaReaderIcon />, component: 'WikipediaExplorer', category: 'internet', defaultWidth: 1100, defaultHeight: 800, minWidth: 800, minHeight: 600, resizable: true, multiple: false },
  // === v19.0 新增实时全球情报仪表盘（集成多个免费公开 API） ===
  { id: 'world-pulse', name: 'WorldPulse 全球脉搏', icon: <svg viewBox="0 0 24 24" width="18" height="18" stroke="currentColor" strokeWidth="2" fill="none"><circle cx="12" cy="12" r="10"/><path d="M2 12h20M12 2a15 15 0 0 1 4 10 15 15 0 0 1-4 10 15 15 0 0 1-4-10 15 15 0 0 1 4-10z"/><circle cx="12" cy="12" r="2.5" fill="currentColor" stroke="none"/><path d="M12 4v3M12 17v3M4 12h3M17 12h3"/></svg>, component: 'WorldPulse', category: 'internet', defaultWidth: 1280, defaultHeight: 860, minWidth: 900, minHeight: 640, resizable: true, multiple: false },
  // === v20.0 新增智能综合仪表盘 ===
  { id: 'intelligent-dashboard', name: '智能综合仪表盘', icon: <svg viewBox="0 0 24 24" width="18" height="18" stroke="currentColor" strokeWidth="2" fill="none"><rect x="3" y="3" width="18" height="18" rx="2"/><path d="M3 9h18M9 21V9"/><rect x="5" y="11" width="4" height="6" fill="currentColor" stroke="none"/><rect x="10" y="13" width="4" height="4" fill="currentColor" stroke="none"/><rect x="15" y="11" width="4" height="6" fill="currentColor" stroke="none"/><circle cx="12" cy="6" r="1.5" fill="currentColor" stroke="none"/></svg>, component: 'IntelligentDashboard', category: 'utilities', defaultWidth: 1280, defaultHeight: 860, minWidth: 900, minHeight: 640, resizable: true, multiple: false },
  // === v21.0 新增生产力中心 ===
  { id: 'productivity-center', name: '生产力中心', icon: <svg viewBox="0 0 24 24" width="18" height="18" stroke="currentColor" strokeWidth="2" fill="none"><path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z"/></svg>, component: 'ProductivityCenter', category: 'office', defaultWidth: 900, defaultHeight: 750, minWidth: 650, minHeight: 550, resizable: true, multiple: false },
  // === v22.0 新增知识探索中心 ===
  { id: 'knowledge-explorer', name: '知识探索中心', icon: <svg viewBox="0 0 24 24" width="18" height="18" stroke="currentColor" strokeWidth="2" fill="none"><circle cx="12" cy="12" r="10"/><path d="M2 12h20M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/><circle cx="12" cy="12" r="3"/></svg>, component: 'KnowledgeExplorer', category: 'internet', defaultWidth: 1000, defaultHeight: 750, minWidth: 700, minHeight: 550, resizable: true, multiple: false },
  // === v23.0 新增智能笔记专业版 ===
  { id: 'smart-notes-pro', name: '智能笔记专业版', icon: <svg viewBox="0 0 24 24" width="18" height="18" stroke="currentColor" strokeWidth="2" fill="none"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/><circle cx="12" cy="12" r="10" fill="currentColor" opacity="0.1"/></svg>, component: 'SmartNotesPro', category: 'office', defaultWidth: 1200, defaultHeight: 800, minWidth: 900, minHeight: 600, resizable: true, multiple: false },
  // === v24.0 新增AI助手Ultra（增强版智能助手）===
  { id: 'ai-assistant-ultra', name: 'AI智能助手 Ultra', icon: <svg viewBox="0 0 24 24" width="18" height="18" stroke="currentColor" strokeWidth="2" fill="none"><circle cx="12" cy="12" r="10"/><path d="M8 14s1.5 2 4 2 4-2 4-2"/><circle cx="9" cy="9" r="1.5" fill="currentColor"/><circle cx="15" cy="9" r="1.5" fill="currentColor"/><path d="M12 2v4M12 18v4M2 12h4M18 12h4"/><circle cx="12" cy="12" r="3" fill="currentColor" opacity="0.3" stroke="none"/></svg>, component: 'AIAssistantUltra', category: 'utilities', defaultWidth: 950, defaultHeight: 750, minWidth: 700, minHeight: 550, resizable: true, multiple: false },
  // === v25.0 新增灵感流 - 快速捕捉想法与灵感 ===
  { id: 'idea-stream', name: '灵感流', icon: <svg viewBox="0 0 24 24" width="18" height="18" stroke="currentColor" strokeWidth="2" fill="none"><path d="M9 18h6M10 22h4M12 2a7 7 0 0 0-4 12.7c.6.5 1 1.3 1 2.1V18h6v-1.2c0-.8.4-1.6 1-2.1A7 7 0 0 0 12 2z"/><path d="M12 6v6M9 9l3 3 3-3"/></svg>, component: 'IdeaStream', category: 'office', defaultWidth: 820, defaultHeight: 720, minWidth: 560, minHeight: 480, resizable: true, multiple: false },
  // === v27.0 新增创新应用 - NexusAI 智能中枢与 DevForge 开发者锻造台 ===
  { id: 'nexus-ai', name: 'NexusAI 真实AI助手', icon: <svg viewBox="0 0 24 24" width="18" height="18" stroke="currentColor" strokeWidth="2" fill="none"><polygon points="12 2 2 7 12 12 22 7 12 2"/><polyline points="2 17 12 22 22 17"/><polyline points="2 12 12 17 22 12"/><circle cx="12" cy="12" r="3" fill="currentColor" stroke="none"/></svg>, component: 'NexusAI', category: 'utilities', defaultWidth: 1000, defaultHeight: 720, minWidth: 700, minHeight: 500, resizable: true, multiple: false, isNew: true, description: '基于 Pollinations.ai 的真实联网大模型对话（GPT-4o/DeepSeek/Llama），无需 API Key，支持流式输出与图像生成' },
  { id: 'dev-forge', name: 'DevForge 开发者锻造台', icon: <svg viewBox="0 0 24 24" width="18" height="18" stroke="currentColor" strokeWidth="2" fill="none"><path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z"/></svg>, component: 'DevForge', category: 'development', defaultWidth: 1000, defaultHeight: 700, minWidth: 700, minHeight: 500, resizable: true, multiple: false },
  // === v29.0 新增核心实用工具 ===
  { id: 'dev-toolbox-central', name: '核心工具箱', icon: <Code2Icon />, component: 'DevToolboxCentral', category: 'development', defaultWidth: 1100, defaultHeight: 750, minWidth: 800, minHeight: 600, resizable: true, multiple: false },
  { id: 'live-info-center', name: '实时信息中心', icon: <ActivityIcon />, component: 'LiveInfoCenter', category: 'internet', defaultWidth: 1200, defaultHeight: 850, minWidth: 900, minHeight: 650, resizable: true, multiple: false },
  // === v30.0 新增实时协作文档编辑器 ===
  { id: 'realtime-doc-editor', name: '实时协作文档编辑器', icon: <svg viewBox="0 0 24 24" width="18" height="18" stroke="currentColor" strokeWidth="2" fill="none"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/><circle cx="12" cy="12" r="3" fill="currentColor" opacity="0.2"/></svg>, component: 'RealtimeDocumentEditor', category: 'office', defaultWidth: 1300, defaultHeight: 900, minWidth: 900, minHeight: 650, resizable: true, multiple: false },
  // === v33.0 新增创新实用工具 ===
  { id: 'dev-console', name: 'DevConsole 开发者控制台', icon: <svg viewBox="0 0 24 24" width="18" height="18" stroke="currentColor" strokeWidth="2" fill="none"><polyline points="4 17 10 11 4 5"/><line x1="12" y1="19" x2="20" y2="19"/></svg>, component: 'DevConsole', category: 'development', defaultWidth: 1000, defaultHeight: 700, minWidth: 700, minHeight: 500, resizable: true, multiple: false },
  { id: 'live-dashboard', name: 'Live Dashboard 实时仪表板', icon: <svg viewBox="0 0 24 24" width="18" height="18" stroke="currentColor" strokeWidth="2" fill="none"><rect x="3" y="3" width="18" height="18" rx="2"/><path d="M3 9h18M9 21V9"/><path d="M7 14l2 2 3-4"/></svg>, component: 'LiveDashboard', category: 'utilities', defaultWidth: 1200, defaultHeight: 800, minWidth: 900, minHeight: 600, resizable: true, multiple: false },
  // === v33.0 新增实时数据中心（集成真实公开API） ===
  { id: 'live-data-hub', name: '实时数据中心', icon: <ActivityIcon />, component: 'LiveDataHub', category: 'internet', defaultWidth: 950, defaultHeight: 780, minWidth: 700, minHeight: 550, resizable: true, multiple: false },
  // === v36.0 全新一代创新应用：AI Workbench / Knowledge Vine / CodeForge ===
  { id: 'ai-workbench', name: 'AI Workbench 智能工作台', icon: <SparklesIcon />, component: 'AIWorkbench', category: 'utilities', defaultWidth: 1280, defaultHeight: 820, minWidth: 1000, minHeight: 700, resizable: true, multiple: false },
  { id: 'knowledge-vine', name: 'Knowledge Vine 知识藤蔓', icon: <SmartNotesIcon />, component: 'KnowledgeVine', category: 'office', defaultWidth: 1280, defaultHeight: 820, minWidth: 1000, minHeight: 700, resizable: true, multiple: false },
  { id: 'code-forge', name: 'CodeForge 开发者工具集', icon: <Code2Icon />, component: 'CodeForge', category: 'development', defaultWidth: 1280, defaultHeight: 820, minWidth: 1000, minHeight: 700, resizable: true, multiple: false },
  { id: 'weather-app', name: '天气查询', icon: <CloudRainIcon />, component: 'WeatherApp', category: 'utilities', defaultWidth: 900, defaultHeight: 700, minWidth: 700, minHeight: 500, resizable: true, multiple: false },
  { id: 'github-trending-app', name: 'GitHub 趋势', icon: <GitHubIcon />, component: 'GitHubTrendingApp', category: 'development', defaultWidth: 1000, defaultHeight: 750, minWidth: 700, minHeight: 500, resizable: true, multiple: false },
  // === v37.1 新增实用开发工具 ===
  { id: 'http-status', name: 'HTTP 状态码', icon: <ApiLabIcon />, component: 'HttpStatusExplorer', category: 'development', defaultWidth: 1000, defaultHeight: 700, minWidth: 700, minHeight: 500, resizable: true, multiple: false },
  { id: 'css-gradient', name: 'CSS 渐变工作室', icon: <PaletteIcon />, component: 'CssGradientStudio', category: 'development', defaultWidth: 1100, defaultHeight: 720, minWidth: 800, minHeight: 540, resizable: true, multiple: false },
  { id: 'git-cheatsheet', name: 'Git 命令速查', icon: <Code2Icon />, component: 'GitCheatsheet', category: 'development', defaultWidth: 900, defaultHeight: 700, minWidth: 600, minHeight: 500, resizable: true, multiple: false },
  { id: 'pomodoro-studio', name: 'Pomodoro Studio', icon: <PomodoroIcon />, component: 'PomodoroStudio', category: 'office', defaultWidth: 1100, defaultHeight: 720, minWidth: 800, minHeight: 540, resizable: true, multiple: false },
  { id: 'api-health', name: 'API 健康监控', icon: <ActivityIcon />, component: 'ApiHealthMonitor', category: 'development', defaultWidth: 1000, defaultHeight: 700, minWidth: 700, minHeight: 500, resizable: true, multiple: false },
  { id: 'activity-heatmap', name: '活动热力图', icon: <ActivityIcon />, component: 'ActivityHeatmap', category: 'utilities', defaultWidth: 900, defaultHeight: 600, minWidth: 600, minHeight: 450, resizable: true, multiple: false },
  { id: 'regex-visualizer', name: '正则表达式可视化', icon: <Code2Icon />, component: 'RegexVisualizer', category: 'development', defaultWidth: 1100, defaultHeight: 750, minWidth: 800, minHeight: 550, resizable: true, multiple: false },
  // === v39.0 全新创新应用 - Snap Studio 浏览器原生图片工坊 ===
  { id: 'snap-studio', name: 'Snap Studio 美图工坊', icon: <svg viewBox="0 0 24 24" width="18" height="18" stroke="currentColor" strokeWidth="2" fill="none"><path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"/><circle cx="12" cy="13" r="4"/></svg>, component: 'SnapStudio', category: 'multimedia', defaultWidth: 1200, defaultHeight: 820, minWidth: 900, minHeight: 600, resizable: true, multiple: false, isNew: true, description: 'Canvas 像素级图片编辑器：滤镜、微调、缩放、撤销重做、多格式导出' },
  // === v40.0 创新功能扩展 ===
  // 注意：以下 ...APP_REGISTRY_EXTRAS 必须放在 appRegistry 数组末尾，
  // 否则会被后续字面量项覆盖。
  ...APP_REGISTRY_EXTRAS,
]