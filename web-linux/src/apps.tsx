import {
  FolderIcon, TerminalIcon, FileTextIcon, BrowserIcon, CalculatorIcon,
  CalendarIcon, ClockIcon, CloudRainIcon, ActivityIcon, SettingsIcon,
  NoteIcon, ImageIcon, VideoIcon, PDFIcon, CodeIcon,
  PackageIcon, ShoppingCartIcon, HardDriveIcon, ListTodoIcon, ServerIcon,
  WifiIcon, ShieldIcon, UserIcon, CameraIcon, PaintIcon, GridIcon,
  PresentationIcon, MailIcon, MessageIcon, ContactsIcon,
  LockIcon, BackupIcon, ZipIcon, FileSearchIcon, TypeIcon,
  LanguagesIcon, MapPinIcon, VideoRecorderIcon, MicIcon,
  BluetoothIcon, BatteryIcon, InfoIcon, HelpIcon, CommandIcon,
  PaletteIcon, MagnifierIcon, SnakeIcon, TetrisIcon, BoardIcon,
  LightningIcon, SearchIcon, PetIcon,
  WallpaperIcon, MindMapIcon, StickyNotesIcon, ParticleIcon, WhiteboardIcon, AutomationIcon,
  VoiceIcon, GraduationCapIcon, WrenchIcon, SparklesIcon, ApiLabIcon, Code2Icon, RocketIcon, WandIcon,
  LayersIcon, ClipboardIcon, UsersIcon, NetworkIcon, FolderOpenIcon,
  WikiSearchIcon, CodeSnapIcon, WebSummarizeIcon, TrendingUpIcon,
  ShareIcon, Link2Icon, PoetryIcon, BookmarkIcon,
  BarChartIcon, ResearchIcon, DatabaseIcon, BarChart3Icon,
  GlobeIcon, HashIcon, MonitorIcon, SystemAnalyticsIcon, ShortcutCustomizerIcon,
  PlaneIcon, FileJsonIcon,
  // v106 新增：仅保留 icons.tsx 独有的，不与 apps.tsx 本地 function 定义冲突
  DailyDashboardIcon
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
  // === v138 新增工具：Base64Toolkit 增强版Base64编解码 + CronExpressionParser Cron解析器
  { id: 'base64-toolkit', name: 'Base64 增强版编解码', icon: <CodeIcon />, component: 'Base64Toolkit', category: 'utilities', defaultWidth: 900, defaultHeight: 600, minWidth: 600, minHeight: 400, resizable: true, multiple: false, isNew: true, description: '全功能Base64编解码工具：文本/文件编码解码、URL安全Base64、Data URL生成、拖拽上传、编码比统计、双向交换' },
  { id: 'cron-parser', name: 'Cron 表达式解析器', icon: <ClockIcon />, component: 'CronExpressionParser', category: 'utilities', defaultWidth: 900, defaultHeight: 700, minWidth: 600, minHeight: 500, resizable: true, multiple: false, isNew: true, description: 'Cron调度表达式解析器：字段可视化拆解、自然语言描述、下N次执行时间预览、10个常用表达式预设' },
  // === v137 新增实用工具：PomodoroTimer 番茄时钟（组件已存在于 apps/ 目录但未注册）
  { id: 'pomodoro-timer', name: '番茄时钟', icon: <ClockIcon />, component: 'PomodoroTimer', category: 'utilities', defaultWidth: 420, defaultHeight: 520, minWidth: 360, minHeight: 440, resizable: false, multiple: false, isNew: true, description: '经典番茄工作法计时器：25分钟专注+5分钟休息循环，自定义时长，统计与历史记录' },
  // === v137 新增实用工具：CountdownTimer 倒计时器
  { id: 'countdown-timer', name: '倒计时器', icon: <ClockIcon />, component: 'CountdownTimer', category: 'utilities', defaultWidth: 420, defaultHeight: 540, minWidth: 360, minHeight: 460, resizable: false, multiple: false, isNew: true, description: '优雅的倒计时工具：自定义时长、预设快捷按钮、圆环进度可视化、历史记录' },
  // === v137 新增实用工具：MarkdownLivePreview Markdown实时预览
  { id: 'markdown-live-preview', name: 'Markdown 实时预览', icon: <CodeIcon />, component: 'MarkdownLivePreview', category: 'development', defaultWidth: 1000, defaultHeight: 680, minWidth: 720, minHeight: 480, resizable: true, multiple: false, isNew: true, description: '左右分栏 Markdown 编辑器：实时渲染、语法高亮、导出 HTML、可调分栏' },
  // === v136 新增实用工具：DevInfoDashboard 开发者信息仪表盘
  { id: 'dev-info-dashboard', name: 'DevInfoDashboard 开发者仪表盘', icon: <svg viewBox="0 0 24 24" width="18" height="18" stroke="currentColor" strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round"><rect x="2" y="3" width="20" height="14" rx="2"/><path d="M8 21h8"/><path d="M12 17v4"/></svg>, component: 'DevInfoDashboard', category: 'development', defaultWidth: 1280, defaultHeight: 880, minWidth: 960, minHeight: 660, resizable: true, multiple: false, isNew: true, description: '浏览器开发者信息仪表盘：实时FPS/内存/存储监控、设备与系统信息、网络状态、Web API支持检测、安全策略分析、页面信息概览，一键复制任意值' },
  // === v135 新增创新工具：BrowserFingerprint 浏览器指纹识别
  { id: 'browser-fingerprint', name: 'BrowserFingerprint 浏览器指纹', icon: <svg viewBox="0 0 24 24" width="18" height="18" stroke="currentColor" strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/><path d="M9 12l2 2 4-4"/></svg>, component: 'BrowserFingerprint', category: 'development', defaultWidth: 1100, defaultHeight: 800, minWidth: 800, minHeight: 600, resizable: true, multiple: false, isNew: true, description: '浏览器指纹识别与隐私分析：Canvas/WebGL/Audio指纹采集、8大类别隐私信息检测、风险评级(高/中/低)、隐私评分(A-F)、一键复制全部指纹数据' },
  // === v135 新增创新工具：LocalStorageInspector 存储检查器
  { id: 'localstorage-inspector', name: 'LocalStorageInspector 存储检查器', icon: <svg viewBox="0 0 24 24" width="18" height="18" stroke="currentColor" strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round"><ellipse cx="12" cy="5" rx="9" ry="3"/><path d="M21 12c0 1.66-4 3-9 3s-9-1.34-9-3"/><path d="M3 5v14c0 1.66 4 3 9 3s9-1.34 9-3V5"/></svg>, component: 'LocalStorageInspector', category: 'development', defaultWidth: 1100, defaultHeight: 800, minWidth: 800, minHeight: 600, resizable: true, multiple: false, isNew: true, description: '浏览器本地存储可视化检查器：localStorage/sessionStorage浏览、数据类型检测(JSON/String/Number/Boolean)、搜索过滤、在线编辑、JSON导入导出、存储使用统计、一键清空' },
  // === v134 新增创新工具：SystemHealthMonitor 系统健康监控
  { id: 'system-health-monitor', name: 'SystemHealthMonitor 系统健康监控', icon: <svg viewBox="0 0 24 24" width="18" height="18" stroke="currentColor" strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round"><path d="M22 12h-4l-3 9L9 3l-3 9H2"/></svg>, component: 'SystemHealthMonitor', category: 'utilities', defaultWidth: 1280, defaultHeight: 880, minWidth: 960, minHeight: 660, resizable: true, multiple: false, isNew: true, description: '综合系统健康监控仪表盘：实时FPS/内存/DOM节点/资源数/FCP/DCL监控、CPU核心/设备内存/网络状态/屏幕信息、20项历史趋势图、健康评分(0-100)、JSON报告导出' },
  // === v133 新增创新工具：ColorAccessibility + WebPerformanceProfiler + DNSProbe
  { id: 'color-accessibility', name: 'ColorAccessibility 色彩无障碍检查', icon: <svg viewBox="0 0 24 24" width="18" height="18" stroke="currentColor" strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><circle cx="12" cy="8" r="2" fill="currentColor"/><path d="M12 14v4"/><path d="M9 18l3-4 3 4"/></svg>, component: 'ColorAccessibility', category: 'development', defaultWidth: 1280, defaultHeight: 880, minWidth: 960, minHeight: 660, resizable: true, multiple: false, isNew: true, description: 'WCAG 2.1色彩无障碍检查：对比度计算器(AA/AAA合规)、8种色盲模拟、6色调色板矩阵分析、智能修复建议、JSON导出报告' },
  { id: 'web-perf-profiler', name: 'WebPerformanceProfiler 性能剖析器', icon: <svg viewBox="0 0 24 24" width="18" height="18" stroke="currentColor" strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round"><path d="M22 12h-4l-3 9L9 3l-3 9H2"/></svg>, component: 'WebPerformanceProfiler', category: 'development', defaultWidth: 1320, defaultHeight: 900, minWidth: 960, minHeight: 680, resizable: true, multiple: false, isNew: true, description: '真实浏览器性能剖析：Core Web Vitals(LCP/CLS/FID)、Navigation/Paint Timing、资源瀑布图、长任务检测、性能评分(0-100)、历史趋势、JSON报告导出' },
  { id: 'dns-probe', name: 'DNSProbe 网络诊断工具', icon: <svg viewBox="0 0 24 24" width="18" height="18" stroke="currentColor" strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><path d="M2 12h20"/><path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/></svg>, component: 'DNSProbe', category: 'networking', defaultWidth: 1320, defaultHeight: 900, minWidth: 960, minHeight: 680, resizable: true, multiple: false, isNew: true, description: '7合1网络诊断：DNS查询(Cloudflare/Google DoH)、HTTP头检查、CORS检测、端口连通测试、路由追踪估算、网络质量测速、IP地理信息' },
  // === v132 新增创新工具：HTTPToolkit + MarkdownLiveStudio
  { id: 'http-toolkit', name: 'HTTPToolkit 实用HTTP客户端', icon: <svg viewBox="0 0 24 24" width="18" height="18" stroke="currentColor" strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><path d="M2 12h20"/><path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/></svg>, component: 'HTTPToolkit', category: 'development', defaultWidth: 1320, defaultHeight: 860, minWidth: 960, minHeight: 660, resizable: true, multiple: false, isNew: true, description: '实用HTTP客户端：真实API集成（httpbin/JSONPlaceholder/GitHub/Open-Meteo/CatFact等12个预设模板）、方法选择、请求头编辑、请求体编辑、响应查看与格式化、请求历史记录、状态码与耗时统计、Ctrl+Enter快捷发送' },
  { id: 'markdown-live-studio', name: 'MarkdownLiveStudio 实时Markdown编辑器', icon: <svg viewBox="0 0 24 24" width="18" height="18" stroke="currentColor" strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round"><path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/></svg>, component: 'MarkdownLiveStudio', category: 'office', defaultWidth: 1320, defaultHeight: 860, minWidth: 960, minHeight: 660, resizable: true, multiple: false, isNew: true, description: '实时Markdown编辑器：分屏编辑与预览、4种预览主题（GitHub/Dark/Minimal/Solarized）、工具栏快捷格式化、可调字号、HTML复制与导出、Tab缩进支持、字数/行数/阅读时间统计' },
  // === v131 新增创新工具：TextAnalyzer 文本分析器
  { id: 'text-analyzer', name: 'TextAnalyzer 文本分析器', icon: <svg viewBox="0 0 24 24" width="18" height="18" stroke="currentColor" strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round"><path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/><line x1="10" y1="9" x2="8" y2="9"/></svg>, component: 'TextAnalyzer', category: 'utilities', defaultWidth: 900, defaultHeight: 600, minWidth: 600, minHeight: 400, resizable: true, multiple: false, isNew: true, description: '智能文本分析工具：字符/词频/句子统计、文本质量评分、Pollinations AI摘要、英语词典查询、MyMemory翻译' },
  // === v130 新增创新工具：AmbientSound + MarkdownNotebook
  { id: 'ambient-sound', name: 'AmbientSound 环境音播放器', icon: <svg viewBox="0 0 24 24" width="18" height="18" stroke="currentColor" strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round"><path d="M9 18V5l12-2v13"/><circle cx="6" cy="18" r="3"/><circle cx="18" cy="16" r="3"/></svg>, component: 'AmbientSound', category: 'multimedia', defaultWidth: 1100, defaultHeight: 750, minWidth: 800, minHeight: 550, resizable: true, multiple: false, isNew: true, description: 'Web Audio API实时合成环境音播放器：12种音效（雨声/雷声/风声/火焰/海浪/森林/鸟鸣/咖啡馆/白噪声/粉噪声/键盘/钟表）+独立音量+主音量+5种预设场景+定时关闭+本地偏好持久化' },
  { id: 'markdown-notebook', name: 'MarkdownNotebook 智能笔记本', icon: <svg viewBox="0 0 24 24" width="18" height="18" stroke="currentColor" strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round"><path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/><line x1="10" y1="9" x2="8" y2="9"/></svg>, component: 'MarkdownNotebook', category: 'office', defaultWidth: 1200, defaultHeight: 850, minWidth: 800, minHeight: 600, resizable: true, multiple: false, isNew: true, description: '功能完整的Markdown笔记本：多文档管理+文件夹分类+分屏编辑预览+收藏+实时字数统计+HTML导出+深色/浅色主题+Tab缩进+搜索过滤+本地持久化' },
  // === v129 新增创新工具：DeployMonitor + SmartTranslator + TextEditor语法高亮
  { id: 'deploy-monitor', name: 'DeployMonitor 部署监控面板', icon: <svg viewBox="0 0 24 24" width="18" height="18" stroke="currentColor" strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/><polyline points="9 12 11 14 15 10"/></svg>, component: 'DeployMonitor', category: 'development', defaultWidth: 1200, defaultHeight: 850, minWidth: 900, minHeight: 650, resizable: true, multiple: false, isNew: true, description: 'GitHub Pages部署状态监控面板：实时获取Workflow运行状态、部署成功率、最近构建历史、仓库信息，基于GitHub公开API' },
  { id: 'smart-translator', name: 'SmartTranslator 智能翻译器', icon: <svg viewBox="0 0 24 24" width="18" height="18" stroke="currentColor" strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round"><path d="M5 8l6 6"/><path d="M4 14l6-6 2-3"/><path d="M2 5h12"/><path d="M7 2h1"/><path d="m22 22-5-10-5 10"/><path d="M14 18h6"/></svg>, component: 'SmartTranslator', category: 'utilities', defaultWidth: 1200, defaultHeight: 850, minWidth: 800, minHeight: 600, resizable: true, multiple: false, isNew: true, description: '基于MyMemory免费API的实时翻译器：20种语言互译、自动语言检测、快速语言对切换、语音朗读、翻译历史、智能防抖' },
  // === v128 新增创新工具：RegexVisualizer + JsonTreeView + FocusTimer
  { id: 'regex-visualizer', name: 'RegexVisualizer 正则可视化调试器', icon: <svg viewBox="0 0 24 24" width="18" height="18" stroke="currentColor" strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><path d="M8 12h8"/><path d="M12 8v8"/></svg>, component: 'RegexVisualizer', category: 'development', defaultWidth: 1200, defaultHeight: 850, minWidth: 900, minHeight: 650, resizable: true, multiple: false, isNew: true, description: '正则表达式可视化调试器：实时匹配高亮、正则语法分解解释、10个常用模板、捕获组详情、错误诊断' },
  { id: 'json-tree-view', name: 'JsonTreeView JSON树形查看器', icon: <svg viewBox="0 0 24 24" width="18" height="18" stroke="currentColor" strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round"><path d="M12 3v6"/><path d="M6 12H3"/><path d="M12 12h9"/><path d="M6 12v6"/><path d="M18 12v6"/><circle cx="12" cy="3" r="1.5" fill="currentColor"/><circle cx="3" cy="12" r="1.5" fill="currentColor"/><circle cx="21" cy="12" r="1.5" fill="currentColor"/><circle cx="6" cy="18" r="1.5" fill="currentColor"/><circle cx="18" cy="18" r="1.5" fill="currentColor"/></svg>, component: 'JsonTreeView', category: 'development', defaultWidth: 1200, defaultHeight: 850, minWidth: 900, minHeight: 650, resizable: true, multiple: false, isNew: true, description: '交互式JSON树形查看器：可折叠/展开、语法高亮、路径复制、搜索过滤、格式化/压缩、数据统计' },
  { id: 'focus-timer', name: 'FocusTimer 专注番茄钟', icon: <svg viewBox="0 0 24 24" width="18" height="18" stroke="currentColor" strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><path d="M12 6v6l4 2"/></svg>, component: 'FocusTimer', category: 'office', defaultWidth: 900, defaultHeight: 750, minWidth: 600, minHeight: 550, resizable: true, multiple: false, isNew: true, description: '专注番茄钟：SVG环形进度、工作/短休/长休循环、Web Audio提示音、桌面通知、自定义时长、任务标签、历史记录' },
  // === v127 创新工具：TimestampConverter
  { id: 'timestamp-converter', name: 'TimestampConverter 时间戳转换', icon: <svg viewBox="0 0 24 24" width="18" height="18" stroke="currentColor" strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>, component: 'TimestampConverter', category: 'utilities', defaultWidth: 1000, defaultHeight: 750, minWidth: 700, minHeight: 550, resizable: true, multiple: false, isNew: true, description: '专业时间戳转换工具：Unix时间戳与日期双向转换、12个时区同时显示、时间戳计算器、人类可读时间差、实时时钟' },
  // === v125 创新应用：HashCalculator + SlideForge + ColorPaletteGen
  { id: 'hash-calculator', name: 'HashCalculator 哈希计算器', icon: <svg viewBox="0 0 24 24" width="18" height="18" stroke="currentColor" strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round"><line x1="4" y1="9" x2="20" y2="9"/><line x1="4" y1="15" x2="20" y2="15"/><line x1="10" y1="3" x2="8" y2="21"/><line x1="16" y1="3" x2="14" y2="21"/></svg>, component: 'HashCalculator', category: 'utilities', defaultWidth: 900, defaultHeight: 700, minWidth: 600, minHeight: 500, resizable: true, multiple: false, isNew: true, description: '基于Web Crypto API的专业哈希计算器：SHA-1/256/384/512四种算法同步计算，支持文本和文件输入，一键复制，大小写双格式显示' },
  { id: 'slide-forge', name: 'SlideForge 幻灯片工坊', icon: <svg viewBox="0 0 24 24" width="18" height="18" stroke="currentColor" strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round"><rect x="2" y="3" width="20" height="14" rx="2"/><line x1="8" y1="21" x2="16" y2="21"/><line x1="12" y1="17" x2="12" y2="21"/><polyline points="6 10 10 10 10 8"/></svg>, component: 'SlideForge', category: 'office', defaultWidth: 1200, defaultHeight: 800, minWidth: 900, minHeight: 600, resizable: true, multiple: false, isNew: true, description: 'Markdown转幻灯片工具：分屏编辑与预览、---分隔幻灯片、三种主题（极简/深邃/渐变）、全屏演示模式、键盘导航、独立HTML导出' },
  { id: 'color-palette-gen', name: 'ColorPaletteGen 调色板生成器', icon: <svg viewBox="0 0 24 24" width="18" height="18" stroke="currentColor" strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><circle cx="8" cy="9" r="1.5" fill="currentColor"/><circle cx="15" cy="8" r="1.5" fill="currentColor"/><circle cx="16" cy="14" r="1.5" fill="currentColor"/><circle cx="10" cy="15" r="1.5" fill="currentColor"/></svg>, component: 'ColorPaletteGen', category: 'development', defaultWidth: 1100, defaultHeight: 800, minWidth: 800, minHeight: 600, resizable: true, multiple: false, isNew: true, description: '色彩和谐调色板生成器：5种色彩和谐模式、WCAG对比度检测、色轮可视化、锁定/随机/保存/导出CSS、一键复制颜色值' },
  // === v124 五大创新应用：AICommandPro + DevOpsHealthCheck + EcoFoodPrint + GlobalIntelCenter + SnippetForge
  { id: 'ai-command-pro', name: 'AICommandPro · 智能命令中心', icon: <svg viewBox="0 0 24 24" width="18" height="18" stroke="currentColor" strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round"><polyline points="4 17 10 11 4 5"/><line x1="12" y1="19" x2="20" y2="19"/><circle cx="18" cy="6" r="2.5" fill="none"/><path d="M16 4l5 5"/></svg>, component: 'AICommandPro', category: 'development', defaultWidth: 1280, defaultHeight: 860, minWidth: 960, minHeight: 660, resizable: true, multiple: false, isNew: true, description: 'AI智能命令中心：自然语言与Shell命令双向转换、风险评估引擎(安全/警告/危险三级)、6大分类100+命令模板库(文件/开发/网络/Git/系统/运维)、历史记录、一键复制执行、智能收藏' },
  { id: 'devops-health-check', name: 'DevOpsHealthCheck · 网站健康诊断', icon: <svg viewBox="0 0 24 24" width="18" height="18" stroke="currentColor" strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/><path d="M9 12l2 2 4-4"/><circle cx="12" cy="12" r="10" opacity="0.35"/></svg>, component: 'DevOpsHealthCheck', category: 'development', defaultWidth: 1320, defaultHeight: 900, minWidth: 1000, minHeight: 700, resizable: true, multiple: false, isNew: true, description: '专业网站健康诊断：Cloudflare DoH DNS解析(8种记录)、crt.sh SSL证书链历史、RDAP域名注册信息+到期倒计时、11项安全头检查、HTTP重定向链追踪、综合健康等级评分A+-F、一键复制JSON报告' },
  { id: 'eco-food-print', name: 'EcoFoodPrint · 饮食碳足迹', icon: <svg viewBox="0 0 24 24" width="18" height="18" stroke="currentColor" strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round"><path d="M12 22c5.5 0 10-4.5 10-10S17.5 2 12 2 2 6.5 2 12s4.5 10 10 10z"/><path d="M12 2a10 10 0 0 1 10 10"/><path d="M12 22v-6"/><path d="M2 12h6"/><path d="m7 8 3 3-3 3"/><path d="M17 8l-3 3 3 3"/></svg>, component: 'EcoFoodPrint', category: 'utilities', defaultWidth: 1320, defaultHeight: 900, minWidth: 1000, minHeight: 700, resizable: true, multiple: false, isNew: true, description: '基于IPCC/FAO公开排放因子的饮食碳足迹计算器：87种食物、10大分类、4餐时记录、7日趋势SVG图表、分类饼图、等价值换算(种树/驾车/电力/水)、15条低碳建议、个性化数据分析、Open-Meteo天气联动、本地持久化存储' },
  { id: 'global-intel-center', name: 'GlobalIntelCenter · 全球实时情报中心', icon: <svg viewBox="0 0 24 24" width="18" height="18" stroke="currentColor" strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><path d="M2 12h20"/><path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/></svg>, component: 'GlobalIntelCenter', category: 'internet', defaultWidth: 1320, defaultHeight: 900, minWidth: 1000, minHeight: 700, resizable: true, multiple: false, isNew: true, description: '全球实时情报中心：Open-Meteo 6城市天气、CoinGecko 5大加密货币行情、Hacker News科技头条、Frankfurter 8种货币汇率、6时区世界时钟，5大板块实时数据聚合' },
  { id: 'snippet-forge', name: 'SnippetForge · 代码片段锻造炉', icon: <svg viewBox="0 0 24 24" width="18" height="18" stroke="currentColor" strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round"><path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z"/></svg>, component: 'SnippetForge', category: 'development', defaultWidth: 1280, defaultHeight: 860, minWidth: 960, minHeight: 660, resizable: true, multiple: false, isNew: true, description: '代码片段锻造炉：10种语言支持、标签系统、搜索过滤、收藏夹、CRUD管理、JSON导入导出、预设片段库、网格/列表视图切换、本地持久化' },
  // === v123 三大创新应用：DataVerse Live + NebulaDev Pro + QuantumHabit OS
  { id: 'data-verse-live', name: 'DataVerse Live · 多源实时数据画布', icon: <svg viewBox="0 0 24 24" width="18" height="18" stroke="currentColor" strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round"><path d="M3 3v18h18"/><path d="m7 14 3-3 4 4 5-6"/><circle cx="7" cy="14" r="1.2" fill="currentColor"/><circle cx="10" cy="11" r="1.2" fill="currentColor"/><circle cx="14" cy="15" r="1.2" fill="currentColor"/><circle cx="19" cy="9" r="1.2" fill="currentColor"/></svg>, component: 'DataVerseLive', category: 'internet', defaultWidth: 1380, defaultHeight: 900, minWidth: 1000, minHeight: 700, resizable: true, multiple: false, isNew: true, description: '自由卡片式多源实时数据画布：Open-Meteo多城市天气、Frankfurter全球汇率、CoinGecko加密货币、Hacker News头条、NASA APOD天文图、SpaceX发射、OpenJoke程序员笑话、每日箴言，9大卡片类型+自由添加+布局持久化+智能缓存+批量刷新' },
  { id: 'nebula-dev-pro', name: 'NebulaDev Pro · 开发者超级工具箱', icon: <svg viewBox="0 0 24 24" width="18" height="18" stroke="currentColor" strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round"><path d="M12 2a10 10 0 1 0 10 10"/><path d="M12 2a10 10 0 0 1 10 10"/><path d="M12 2v20"/><path d="M2 12h20"/><circle cx="12" cy="12" r="3" fill="currentColor"/></svg>, component: 'NebulaDevPro', category: 'development', defaultWidth: 1320, defaultHeight: 900, minWidth: 960, minHeight: 680, resizable: true, multiple: false, isNew: true, description: '7合1专业开发工具箱：JWT解码/验证/生成（HS256/HS384/HS512）、CORS预检探测、Cloudflare DoH DNS查询（10+记录类型）、Web Crypto密码学工具（SHA/HMAC/AES-GCM加解密）、HTTP时序分析、URL安全解析编码、密码熵值评估与生成器，全部本地计算或公开API' },
  { id: 'quantum-habit-os', name: 'QuantumHabit OS · 科学习惯操作系统', icon: <svg viewBox="0 0 24 24" width="18" height="18" stroke="currentColor" strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round"><path d="M12 2v4"/><path d="M12 18v4"/><path d="M4.93 4.93l2.83 2.83"/><path d="M16.24 16.24l2.83 2.83"/><path d="M2 12h4"/><path d="M18 12h4"/><circle cx="12" cy="12" r="4"/></svg>, component: 'QuantumHabitOS', category: 'office', defaultWidth: 1320, defaultHeight: 900, minWidth: 960, minHeight: 680, resizable: true, multiple: false, isNew: true, description: '基于行为科学的习惯操作系统：原子习惯4法则模板、66天成瘾曲线追踪、连续打卡+最长连续记录、每日签到日历热力图、本周/本月完成率仪表盘、专注番茄钟整合、自定义习惯分类+图标+颜色+每周目标、智能提醒建议、年度成长报告' },
  { id: 'language-lab-pro', name: 'LanguageLab · 语言实验室 Pro', icon: <svg viewBox="0 0 24 24" width="18" height="18" stroke="currentColor" strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round"><path d="M5 8l6 6"/><path d="M4 14l6-6 2-3"/><path d="M2 5h12"/><path d="M7 2h1"/><path d="m22 22-5-10-5 10"/><path d="M14 18h6"/></svg>, component: 'LanguageLab', category: 'utilities', defaultWidth: 1280, defaultHeight: 860, minWidth: 960, minHeight: 660, resizable: true, multiple: false, isNew: true, description: '真实API驱动的语言实验室：Free Dictionary 英英词典（释义/发音/同义词/例句）+ MyMemory 多语言翻译（100+语言对）+ 智能闪卡（SRS间隔重复）+ 生词收藏+ 搜索历史 + 24小时本地缓存，四模块合一的真正语言学习工具' },
  { id: 'recipe-forge', name: 'RecipeForge · 智能菜谱工坊', icon: <svg viewBox="0 0 24 24" width="18" height="18" stroke="currentColor" strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round"><path d="M6 13.87A4 4 0 0 1 7.41 6a5.11 5.11 0 0 1 1.05-1.54 5 5 0 0 1 7.08 0A5.11 5.11 0 0 1 16.59 6 4 4 0 0 1 18 13.87V21H6Z"/><line x1="6" y1="17" x2="18" y2="17"/><line x1="15" y1="11" x2="15.01" y2="11"/></svg>, component: 'RecipeForge', category: 'utilities', defaultWidth: 1280, defaultHeight: 860, minWidth: 960, minHeight: 660, resizable: true, multiple: false, isNew: true, description: '基于 TheMealDB 公开 API 的真实菜谱应用：关键词搜索+分类浏览（14大类）+ 地区风味（25+国家）+ 随机推荐 + 食材详情+分步做法 + 收藏夹 + 智能购物清单（自动合并食材+勾选+份数计算），真正可用的烹饪助手' },
  { id: 'eco-track-pro', name: 'EcoTrack · 碳足迹追踪 Pro', icon: <svg viewBox="0 0 24 24" width="18" height="18" stroke="currentColor" strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round"><path d="M12 2a10 10 0 1 0 10 10"/><path d="M12 2a10 10 0 0 1 10 10"/><path d="M12 2v20"/><path d="M2 12h20"/><path d="M17 8c-3-1-5 0-6 2s-3 3-6 3"/><path d="M8 16c2.5 1 5-1 6-3s3-3 6-3"/></svg>, component: 'EcoTrack', category: 'utilities', defaultWidth: 1280, defaultHeight: 860, minWidth: 960, minHeight: 660, resizable: true, multiple: false, isNew: true, description: '真实数据驱动的碳足迹追踪：IPCC公开排放因子+6大类活动（交通/饮食/居家用电/燃气/购物/废弃物）+ 自定义排放+ 30日趋势图+分类饼图+ Open-Meteo 实时气候数据+ 月度减排目标+ 碳抵消建议+ 等价值换算（树木/汽油/公里），完整的个人碳管理工具' },
  // === v121 创新应用：GlobalPulse 全球脉动 ===
  { id: 'global-pulse', name: 'GlobalPulse · 全球脉动', icon: <svg viewBox="0 0 24 24" width="18" height="18" stroke="currentColor" strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round"><path d="M22 12h-4l-3 9L9 3l-3 9H2"/><circle cx="12" cy="12" r="10"/><path d="M12 2a10 10 0 0 1 10 10"/><path d="M12 12 2 2"/></svg>, component: 'GlobalPulse', category: 'internet', defaultWidth: 1200, defaultHeight: 820, minWidth: 900, minHeight: 640, resizable: true, multiple: false, isNew: true, description: '全球脉动仪表盘：实时天气(Open-Meteo 8城市)、全球汇率(Frankfurter 11货币)、加密货币行情(CoinGecko 5大币种)、科技头条(Hacker News Top 20)、世界时钟(6时区)，多API集成+智能缓存+自动刷新' },
  // === v121 创新应用：CodeSnap Pro 代码快照 ===
  { id: 'code-snap-pro', name: 'CodeSnap Pro · 代码快照', icon: <svg viewBox="0 0 24 24" width="18" height="18" stroke="currentColor" strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round"><path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"/><circle cx="12" cy="13" r="4"/></svg>, component: 'CodeSnapPro', category: 'development', defaultWidth: 1280, defaultHeight: 800, minWidth: 960, minHeight: 640, resizable: true, multiple: false, isNew: true, description: '代码快照生成器：10种语言语法高亮、8种精美主题、行号显示、自定义文件名/字号/内边距/圆角、PNG导出、HTML复制、代码预设片段，将代码一键转换为分享级图片' },
  // === v120 两大创新应用：SmartDailyHub + WebDevChecklist ===
  { id: 'smart-daily-hub', name: 'SmartDailyHub · 智能每日中心', icon: <svg viewBox="0 0 24 24" width="18" height="18" stroke="currentColor" strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><path d="M12 6v6l4 2"/><path d="M8 2a8.94 8.94 0 0 1 8 0"/><path d="M2 12h2"/><path d="M20 12h2"/><path d="m4.93 4.93 1.41 1.41"/><path d="m17.66 6.34 1.41-1.41"/></svg>, component: 'SmartDailyHub', category: 'utilities', defaultWidth: 1280, defaultHeight: 880, minWidth: 960, minHeight: 680, resizable: true, multiple: false, isNew: true, description: '智能每日中心：聚合实时天气(Open-Meteo)、Hacker News科技头条(Algolia)、每日名言(ZenQuotes)、待办清单、饮水追踪、专注计时、节日倒计时、开发者效率指数，多API集成+本地持久化+离线回退' },
  { id: 'web-dev-checklist', name: 'WebDevChecklist · 开发者检查清单', icon: <svg viewBox="0 0 24 24" width="18" height="18" stroke="currentColor" strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round"><path d="M9 11l3 3L22 4"/><path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11"/><path d="M10 16H7"/><path d="M14 16h-1"/></svg>, component: 'WebDevChecklist', category: 'development', defaultWidth: 1280, defaultHeight: 880, minWidth: 960, minHeight: 680, resizable: true, multiple: false, isNew: true, description: 'Web开发发布检查清单：10大类100+检查项（性能/SEO/可访问性/安全/响应式/跨浏览器/代码质量/DevOps/内容合规/技术SEO），进度统计、搜索筛选、分类标签、完成度评级、Markdown/JSON导出、本地持久化' },
  // === v118 创新应用：LexiconForge 词语锻造坊（基于 Datamuse 公开语料 API 的多面写作助手）===
  { id: 'lexicon-forge', name: 'LexiconForge · 词语锻造坊', icon: <svg viewBox="0 0 24 24" width="18" height="18" stroke="currentColor" strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round"><path d="M4 19V5a2 2 0 0 1 2-2h10l4 4v12a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2z"/><path d="M14 3v4a1 1 0 0 0 1 1h4"/><path d="M8 13h6"/><path d="M8 17h4"/><path d="m16 11 2 2-2 2"/></svg>, component: 'LexiconForge', category: 'office', defaultWidth: 1100, defaultHeight: 760, minWidth: 720, minHeight: 520, resizable: true, multiple: false, isNew: true, description: '基于 Datamuse 公开语料 API 的多面写作助手：完全押韵/近似押韵（写诗作词）、同义词、反义词、联想词、同音词、拼写模式匹配（填字游戏/Scrabble），支持音节过滤、词频排序、定义展开、一键复制、收藏词库、搜索历史、24小时本地缓存、CORS代理回退' },
  // === v117 三大创新应用：MemeGenerator / TechInterviewPrep / MotivationalDashboard ===
  { id: 'meme-generator', name: 'MemeGenerator · 表情包工坊', icon: <svg viewBox="0 0 24 24" width="18" height="18" stroke="currentColor" strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/><circle cx="9" cy="10" r="1.2" fill="currentColor"/><circle cx="15" cy="10" r="1.2" fill="currentColor"/><path d="M9 14c1 1 2 1.5 3 1.5s2-.5 3-1.5"/></svg>, component: 'MemeGenerator', category: 'multimedia', defaultWidth: 1320, defaultHeight: 860, minWidth: 980, minHeight: 640, resizable: true, multiple: false, isNew: true, description: '本地表情包生成工坊：8个经典模板+自定义上传+Canvas实时渲染+自动换行+文字样式（字号/颜色/描边/字体）+复制到剪贴板+下载PNG+收藏夹+最近使用，一键产出 Drake/女友吐槽/双按钮/改我心意等经典' },
  { id: 'tech-interview-prep', name: 'TechInterviewPrep · 面试刷题', icon: <svg viewBox="0 0 24 24" width="18" height="18" stroke="currentColor" strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round"><path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z"/><path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z"/><path d="m9 10 2 2-2 2"/><path d="m15 10-2 2 2 2"/></svg>, component: 'TechInterviewPrep', category: 'development', defaultWidth: 1340, defaultHeight: 880, minWidth: 1000, minHeight: 680, resizable: true, multiple: false, isNew: true, description: '技术面试刷题助手：30+经典真实题（算法/前端/后端/数据库/网络/OS/行为/系统设计）+ 难度分级 + 三视图（刷题/题库/统计）+ 搜索筛选 + JS代码沙盒真实执行 + 收藏夹 + 自定义题库导入 + 连续打卡 + 本地持久化' },
  { id: 'motivational-dashboard', name: 'MotivationalDashboard · 励志仪表盘', icon: <svg viewBox="0 0 24 24" width="18" height="18" stroke="currentColor" strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round"><path d="M12 2 15 8l6 1-4.5 4.5L18 20l-6-3-6 3 1.5-6.5L3 9l6-1z" fill="currentColor" fillOpacity="0.15"/></svg>, component: 'MotivationalDashboard', category: 'utilities', defaultWidth: 1280, defaultHeight: 840, minWidth: 960, minHeight: 640, resizable: true, multiple: false, isNew: true, description: '五合一心灵充电站：ZenQuotes/Stoic公共API每日箴言+Picsum每日灵感图+4种呼吸冥想模式（Web Audio音效引导）+今日目标追踪+感恩日记+小成就墙+程序员小幽默+8套梦幻主题配色，全部本地持久化，科学支撑的幸福感提升工具' },
  // === v116 创新应用：PomodoroFocus 番茄钟 + SomaFM 电台 ===
  { id: 'pomodoro-focus', name: 'PomodoroFocus · 番茄电台', icon: <svg viewBox="0 0 24 24" width="18" height="18" stroke="currentColor" strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="13" r="8"/><path d="M12 9v4l2 2"/><path d="M5 3 2 6"/><path d="m22 6-3-3"/><path d="M9 1h6"/></svg>, component: 'PomodoroFocus', category: 'office', defaultWidth: 1180, defaultHeight: 780, minWidth: 880, minHeight: 600, resizable: true, multiple: false, isNew: true, description: '番茄钟 + SomaFM 公开电台 + 任务看板 + 专注统计：三阶段计时、8个真实SomaFM MP3流、Web Audio结束提示、任务番茄分配、7日专注柱状图，数据本地持久化' },
  // === v115 创新应用：DevRadar 开发者技术雷达 ===
  { id: 'dev-radar', name: 'DevRadar 技术雷达', icon: <svg viewBox="0 0 24 24" width="18" height="18" stroke="currentColor" strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><path d="M12 2a10 10 0 0 1 10 10"/><path d="M12 12 2 2"/><circle cx="12" cy="12" r="2" fill="currentColor"/></svg>, component: 'DevRadar', category: 'internet', defaultWidth: 1280, defaultHeight: 860, minWidth: 900, minHeight: 600, resizable: true, multiple: false, isNew: true, description: '开发者技术雷达：聚合Hacker News+GitHub Trending+GitHub Releases实时信息流，支持多源筛选、热门/最新/趋势排序、全文搜索、本地收藏、自动刷新、详情面板' },
  // === v114 创新应用：MindSync Pro 效率中心 ===
  { id: 'mind-sync-pro', name: 'MindSync Pro · 效率中心', icon: <svg viewBox="0 0 24 24" width="18" height="18" stroke="currentColor" strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round"><path d="M9.5 2A2.5 2.5 0 0 1 12 4.5v15a2.5 2.5 0 0 1-4.96.44 2.5 2.5 0 0 1-2.96-3.08 3 3 0 0 1-.34-5.58 2.5 2.5 0 0 1 1.32-4.24 2.5 2.5 0 0 1 4.44-2.04z"/><path d="M14.5 2A2.5 2.5 0 0 0 12 4.5v15a2.5 2.5 0 0 0 4.96.44 2.5 2.5 0 0 0 2.96-3.08 3 3 0 0 0 .34-5.58 2.5 2.5 0 0 0-1.32-4.24 2.5 2.5 0 0 0-4.44-2.04z"/></svg>, component: 'MindSyncPro', category: 'office', defaultWidth: 1280, defaultHeight: 900, minWidth: 960, minHeight: 680, resizable: true, multiple: false, isNew: true, description: '效率中心：番茄钟计时器+任务看板(Kanban)+21天习惯追踪+每日反思日记+可视化效率统计，五合一个人效率系统，全部数据本地持久化，支持声音提示与自动开始下一阶段' },
  // === v110 创新应用套件 ===
  { id: 'dev-flow-pro', name: 'DevFlow Pro · 开发者工作流中心', icon: <svg viewBox="0 0 24 24" width="18" height="18" stroke="currentColor" strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 1 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 1 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 1 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 1 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"/></svg>, component: 'DevFlowPro', category: 'development', defaultWidth: 1280, defaultHeight: 880, minWidth: 960, minHeight: 660, resizable: true, multiple: false, isNew: true, description: '开发者工作流中心：番茄钟(Pomodoro)+任务看板(Kanban)+代码片段管理(Snippets)+每日目标追踪四大模块，数据本地持久化，支持拖拽排序与高效管理' },
  // v109 创新功能 — WebContainer IDE 浏览器内全栈开发环境
  { id: 'webcontainer-ide', name: 'WebContainer IDE', icon: <Code2Icon />, component: 'WebContainerIDE', category: 'development', defaultWidth: 1300, defaultHeight: 850, minWidth: 900, minHeight: 600, resizable: true, multiple: false, isNew: true, description: '浏览器内全栈开发环境：JavaScript实时执行/HTML预览、5种代码模板、控制台输出捕获、多文件标签、代码分享、自动保存' },
  { id: 'markdown-writer', name: 'Markdown Writer', icon: <NoteIcon />, component: 'MarkdownWriter', category: 'office', defaultWidth: 1200, defaultHeight: 800, minWidth: 800, minHeight: 600, resizable: true, multiple: false, isNew: true, description: 'Markdown 写作工具：分屏实时预览、多文档管理、本地持久化、HTML/Markdown导出、字数统计、快捷键(Ctrl+B加粗/Ctrl+I斜体)' },
  // markdown-live-preview 已在上方注册，此处移除重复条目
  // v107 创新功能 — AppMarketplace 应用市场：安装/卸载/评分/更新
  { id: 'app-marketplace', name: 'AppMarketplace 应用市场', icon: <ShoppingCartIcon />, component: 'AppMarketplace', category: 'system', defaultWidth: 1280, defaultHeight: 900, minWidth: 960, minHeight: 680, resizable: true, multiple: false, isNew: true, description: '应用市场：550+应用浏览、搜索、分类筛选、安装/卸载管理、五星评分、下载量统计、更新检测、精选推荐' },
  // v107 创新功能 — CloudDrive 云盘客户端：IndexedDB本地云+WebDAV远程云
  { id: 'cloud-drive', name: 'CloudDrive 云盘', icon: <CloudRainIcon />, component: 'CloudDrive', category: 'internet', defaultWidth: 1280, defaultHeight: 900, minWidth: 960, minHeight: 680, resizable: true, multiple: false, isNew: true, description: '多云盘客户端：IndexedDB本地云存储+WebDAV远程云+文件浏览/上传/下载/预览/分享+存储分析+同步状态+收藏' },
  // v107 创新功能 — WebSSHTerminal 远程SSH终端：虚拟Linux Shell+50+命令
  { id: 'web-ssh-terminal', name: 'WebSSH 远程终端', icon: <TerminalIcon />, component: 'WebSSHTerminal', category: 'system', defaultWidth: 1100, defaultHeight: 750, minWidth: 800, minHeight: 600, resizable: true, multiple: false, isNew: true, description: 'Web SSH终端：虚拟Linux Shell、50+命令、完整虚拟文件系统、多会话标签、SFTP面板、端口转发、5种配色、管道支持' },
  // v107 创新功能 — WorkspaceLayout 工作区布局管理：保存/恢复/模板/自动保存
  { id: 'workspace-layout', name: 'Workspace 布局管理', icon: <LayersIcon />, component: 'WorkspaceLayout', category: 'utilities', defaultWidth: 1200, defaultHeight: 850, minWidth: 900, minHeight: 650, resizable: true, multiple: false, isNew: true, description: '工作区布局管理：保存/恢复窗口布局、6种预设模板、可视化编辑器、自动保存、导入/导出JSON、窗口吸附预设、快捷切换' },
  // v107 创新功能 — RSSAggregator RSS订阅聚合器：真实RSS解析+9个预设源
  { id: 'rss-aggregator', name: 'RSS 订阅聚合', icon: <MailIcon />, component: 'RSSAggregator', category: 'internet', defaultWidth: 1280, defaultHeight: 900, minWidth: 960, minHeight: 680, resizable: true, multiple: false, isNew: true, description: 'RSS订阅聚合器：真实RSS/Atom解析、9个预设源、文章阅读器、已读/未读/收藏、分类管理、自动刷新、离线缓存、CORS代理回退' },
  // v107 创新功能 — SmartNotesPro 增强智能笔记：维基链接+知识图谱+Markdown
  { id: 'smart-notes-pro', name: 'SmartNotes 智能笔记', icon: <NoteIcon />, component: 'SmartNotesPro', category: 'office', defaultWidth: 1200, defaultHeight: 850, minWidth: 900, minHeight: 650, resizable: true, multiple: false, isNew: true, description: '增强智能笔记：[[维基链接]]、反向链接追踪、知识图谱可视化、Markdown渲染、标签云、文件夹、5种模板、导出、回收站' },
  // v107 创新功能 — DevOpsDashboard DevOps仪表盘：服务监控+部署流水线+容器管理
  { id: 'devops-dashboard', name: 'DevOps 仪表盘', icon: <ServerIcon />, component: 'DevOpsDashboard', category: 'development', defaultWidth: 1280, defaultHeight: 900, minWidth: 960, minHeight: 680, resizable: true, multiple: false, isNew: true, description: 'DevOps基础设施仪表盘：真实服务健康监控、CI/CD部署流水线、容器管理、日志聚合、Canvas指标图表、告警管理、环境配置、API网关' },
  // v107 创新功能 — SystemOptimizer 系统优化器：真实浏览器性能审计+一键优化
  { id: 'system-optimizer', name: 'SystemOptimizer 优化器', icon: <ActivityIcon />, component: 'SystemOptimizer', category: 'system', defaultWidth: 1200, defaultHeight: 850, minWidth: 900, minHeight: 650, resizable: true, multiple: false, isNew: true, description: '系统优化器：真实存储/缓存/性能审计、健康评分、一键清理、内存/网络/启动优化、Performance API数据、优化前后对比' },
  // v108 创新功能 — LiveCollabBoard 实时协作画板：跨标签页实时绘图协作
  { id: 'live-collab-board', name: '实时协作画板', icon: <PaintIcon />, component: 'LiveCollabBoard', category: 'utilities', defaultWidth: 1100, defaultHeight: 750, minWidth: 800, minHeight: 600, resizable: true, multiple: false, isNew: true, description: '跨标签页实时协作画板：画笔/橡皮/直线/矩形/圆形工具、颜色选择、笔触大小、BroadcastChannel跨Tab同步、光标共享、用户在线指示、撤销、导出PNG' },
  // v106 创新功能 — DailyDashboard 每日仪表盘：聚合天气+空气质量+节假日+新闻+加密货币+每日名言
  { id: 'daily-dashboard', name: '每日仪表盘', icon: <DailyDashboardIcon />, component: 'DailyDashboard', category: 'utilities', defaultWidth: 1280, defaultHeight: 900, minWidth: 960, minHeight: 680, resizable: true, multiple: false, isNew: true, description: '每日信息聚合仪表盘：实时天气+5天预报、空气质量指数AQI、近期节假日倒计时、Hacker News热门资讯、加密货币行情、每日励志名言，一站式获取每日所需信息' },
  // v104 创新功能 — SmartWorkspace 智能工作空间：多布局自定义、收藏夹、应用快捷启动
  { id: 'smart-workspace', name: '智能工作空间', icon: <GridIcon />, component: 'SmartWorkspace', category: 'utilities', defaultWidth: 1280, defaultHeight: 820, minWidth: 960, minHeight: 640, resizable: true, multiple: false, isNew: true, description: '智能工作空间：多布局自定义（开发/设计/学习/办公）、应用收藏夹、一键启动、实时时钟、全局搜索' },
  // v104 创新功能 — 开发者效率仪表板：系统性能、待办、快捷入口三合一
  { id: 'dev-efficiency-dashboard', name: '开发者效率仪表板', icon: <ZapIcon />, component: 'DevEfficiencyDashboard', category: 'development', defaultWidth: 1200, defaultHeight: 800, minWidth: 900, minHeight: 600, resizable: true, multiple: false, isNew: true, description: '开发者效率仪表板：系统性能监控、待办事项、快捷应用入口、每日励志、工作统计' },
  // v105 创新功能 — WebSandbox 代码沙盒 IDE：浏览器内真实 JavaScript 执行环境
  { id: 'web-sandbox-ide', name: 'WebSandbox 代码沙盒', icon: <Code2Icon />, component: 'WebSandboxIDE', category: 'development', defaultWidth: 1100, defaultHeight: 750, minWidth: 800, minHeight: 600, resizable: true, multiple: false, isNew: true, description: '浏览器内代码沙盒 IDE：真实 JavaScript 执行（iframe sandbox）、控制台输出捕获带时间戳、代码模板库（数组方法/async/DOM/Fetch/数据结构）、代码片段持久化、执行耗时与内存统计、导出与分享' },
  // v78 创新功能 — AI研究助手：arXiv + Semantic Scholar 学术论文搜索
  { id: 'research-assistant', name: 'AI研究助手', icon: <ResearchIcon />, component: 'ResearchAssistant', category: 'utilities', defaultWidth: 1200, defaultHeight: 820, minWidth: 900, minHeight: 650, resizable: true, multiple: false,  description: '学术论文研究助手：arXiv + Semantic Scholar 双源搜索、每日论文精选、引用关系分析、相关论文推荐、收藏与历史' },
  // v73 创新功能 — 终极在线工具箱 & 真实AI聊天
  { id: 'ultimate-toolkit', name: '终极工具箱', icon: <WrenchIcon />, component: 'UltimateToolkit', category: 'utilities', defaultWidth: 1280, defaultHeight: 860, minWidth: 960, minHeight: 640, resizable: true, multiple: false,  description: '18合1在线工具箱：天气/汇率/IP查询/国家信息/百科搜索/每日名言/编程笑话/加密货币/GitHub趋势/颜色转换/UUID生成/Base64编解码/时间戳转换/JSON格式化/URL编解码/密码生成/Hash哈希/单位转换' },
  { id: 'ai-chat-real', name: 'AI 真实聊天', icon: <SparklesIcon />, component: 'AIChatReal', category: 'utilities', defaultWidth: 900, defaultHeight: 720, minWidth: 680, minHeight: 520, resizable: true, multiple: false,  description: '基于 Pollinations AI 公开免费 API 的真实AI对话：5种角色预设、多轮对话、Markdown渲染、代码高亮、打字机效果、对话历史持久化' },
  // v72 创新功能 — URL 工具箱 Pro：集成 is.gd 真实缩短 API + QR 码生成
  { id: 'url-tools-enhanced', name: 'URL 工具箱 Pro', icon: <Link2Icon />, component: 'URLToolsEnhanced', category: 'utilities', defaultWidth: 1100, defaultHeight: 780, minWidth: 800, minHeight: 600, resizable: true, multiple: false,  description: '增强版URL工具箱：真实URL缩短服务（is.gd API）、QR码生成、编码解码解析、历史记录管理' },
  { id: 'open-source-hub', name: '开源项目导航', icon: <GitHubIcon />, component: 'OpenSourceHub', category: 'internet', defaultWidth: 1200, defaultHeight: 800, minWidth: 900, minHeight: 600, resizable: true, multiple: false,  description: 'GitHub开源项目探索：仓库搜索、热门项目、语言筛选、星标排序、搜索历史' },
  
  { id: 'json-crusher', name: 'JSON 超级工具', icon: <WrenchIcon />, component: 'JsonCrusher', category: 'development', defaultWidth: 1100, defaultHeight: 750, minWidth: 800, minHeight: 600, resizable: true, multiple: false,  description: 'JSON高级工具箱：格式化/压缩、TS类型生成、JSONPath查询、Diff对比、Schema验证、树形视图' },
  { id: 'json-formatter', name: 'JSON 格式化工具', icon: <FileJsonIcon />, component: 'JsonFormatter', category: 'development', defaultWidth: 900, defaultHeight: 650, minWidth: 600, minHeight: 400, resizable: true, multiple: false, description: 'JSON格式化与验证工具：美化/压缩/验证/转TypeScript类型/转CSV，行号列号错误提示，语法高亮' },
  { id: 'encoding-toolkit', name: '编码解码工具箱', icon: <LockIcon />, component: 'EncodingToolkit', category: 'utilities', defaultWidth: 850, defaultHeight: 600, minWidth: 600, minHeight: 400, resizable: true, multiple: false, description: '编码解码工具箱：Base64编解码、URL编解码、HTML实体编解码、UTF-8字节计数、SHA-256哈希计算，支持文件拖放导入与一键复制' },
  { id: 'css-studio', name: 'CSS 工作室', icon: <PaletteIcon />, component: 'CssStudio', category: 'development', defaultWidth: 1100, defaultHeight: 750, minWidth: 800, minHeight: 600, resizable: true, multiple: false,  description: 'CSS可视化工具箱：渐变编辑、阴影生成、圆角编辑、动画关键帧、颜色转换、Flexbox布局预览' },
  // AI图像工作室（v58创新功能 — 基于 Pollinations.ai 公开免费 API 的 AI 图像生成工具）
  { id: 'ai-image-studio', name: 'AI图像工作室', icon: <ImageForgeIcon />, component: 'AIImageStudio', category: 'multimedia', defaultWidth: 1200, defaultHeight: 820, minWidth: 900, minHeight: 650, resizable: true, multiple: false,  description: '零配置 AI 图像生成器：基于 Pollinations.ai 公开免费 API，多种艺术风格预设、尺寸选择、模型选择、提示词输入、生成历史与本地收藏' },
  // LocalFileExplorer 本地文件浏览器（v57创新功能 — 基于 File System Access API 的真实本地文件浏览）
  { id: 'local-file-explorer', name: 'LocalFileExplorer 本地文件浏览', icon: <FolderOpenIcon />, component: 'LocalFileExplorer', category: 'system', defaultWidth: 1100, defaultHeight: 750, minWidth: 800, minHeight: 500, resizable: true, multiple: false,  description: '基于 File System Access API 的真实本地文件浏览：打开本地目录、浏览文件树、读取文件内容、搜索、排序、网格/列表视图、下载文件（需 Chrome/Edge）' },
  // WebAssembly Playground（v57创新功能 — 浏览器内 WebAssembly 学习与实验）
  { id: 'wasm-playground', name: 'WasmPlayground WASM实验场', icon: <Code2Icon />, component: 'WebAssemblyPlayground', category: 'development', defaultWidth: 1100, defaultHeight: 750, minWidth: 800, minHeight: 500, resizable: true, multiple: false,  description: '浏览器内 WebAssembly 学习与实验：预置示例程序（加法/阶乘/斐波那契）、运行WASM函数、执行时间测量、内存检查、WASM字节导出' },
  // RegexGolf 正则挑战（v57创新功能 — 正则表达式挑战游戏）
  { id: 'regex-golf', name: 'RegexGolf 正则挑战', icon: <SearchIcon />, component: 'RegexGolf', category: 'games', defaultWidth: 900, defaultHeight: 700, minWidth: 700, minHeight: 500, resizable: true, multiple: false,  description: '正则表达式挑战游戏：15+关卡逐步解锁、实时匹配测试、最短正则得分、提示系统、6大类别覆盖基础到高级' },
  // 实时协作中心（v57创新功能 — 实时多人协作平台）
  { id: 'realtime-collab-hub', name: '实时协作中心', icon: <UsersIcon />, component: 'RealTimeCollaborationHub', category: 'utilities', defaultWidth: 1200, defaultHeight: 800, minWidth: 900, minHeight: 600, resizable: true, multiple: false,  description: '实时多人协作平台：创建/加入房间、共享白板、代码编辑、笔记协作，支持画笔/橡皮擦/形状工具，导出PNG' },
  // 智能知识图谱（v57创新功能 — 双向链接笔记系统）
  { id: 'smart-knowledge-graph', name: '智能知识图谱', icon: <NetworkIcon />, component: 'SmartKnowledgeGraph', category: 'office', defaultWidth: 1200, defaultHeight: 800, minWidth: 900, minHeight: 600, resizable: true, multiple: false,  description: '双向链接笔记系统：[[链接]]语法、自动反向链接追踪、知识图谱可视化、标签系统、全文搜索、导入导出JSON' },
  // WikiExplorer 维基探索（v56 创新功能 — 基于 Wikipedia API 的交互式百科探索工具）
  { id: 'wiki-explorer', name: 'WikiExplorer 维基探索', icon: <WikiExplorerIcon />, component: 'WikiExplorer', category: 'internet', defaultWidth: 1200, defaultHeight: 820, minWidth: 800, minHeight: 600, resizable: true, multiple: false,  description: '基于 Wikipedia API 的交互式百科探索：搜索+文章阅读+精选推荐+随机发现+阅读历史+收藏+中英双语' },
  // SnippetVault 代码片段保险库（v56 创新功能 — 开发者代码片段管理与模板库）
  { id: 'snippet-vault', name: 'SnippetVault 代码保险库', icon: <SnippetVaultIcon />, component: 'SnippetVault', category: 'development', defaultWidth: 1200, defaultHeight: 820, minWidth: 800, minHeight: 600, resizable: true, multiple: false,  description: '代码片段管理：CRUD+智能搜索+语言筛选+标签系统+语法高亮+导入导出+置顶收藏+16个内置模板' },
  // GeoAtlas 地理图鉴（v56 创新功能 — 基于 REST Countries API 的交互式地理探索）
  { id: 'geo-atlas', name: 'GeoAtlas 地理图鉴', icon: <GeoAtlasIcon />, component: 'GeoAtlas', category: 'internet', defaultWidth: 1280, defaultHeight: 860, minWidth: 900, minHeight: 600, resizable: true, multiple: false,  description: '交互式地理图鉴：国家探索+搜索筛选+详情(国旗/首都/人口/面积/语言/货币/时区/邻国)+2-3国对比+地理测验+区域统计+收藏+OpenStreetMap地图' },
  // Studio Suite 创意工作室（v53.1 创新功能 — 设计师与前端开发者的一站式创意工具箱）
  { id: 'studio-suite', name: 'Studio Suite 创意工作室', icon: <StudioSuiteIcon />, component: 'StudioSuite', category: 'multimedia', defaultWidth: 1100, defaultHeight: 780, minWidth: 800, minHeight: 600, resizable: true, multiple: false,  description: '设计师与前端开发者的创意工具箱：调色板生成、渐变编辑、阴影生成、字体预览、WCAG对比度检查、单位转换，六大模块一站式服务' },
  // InfoPulse 信息脉搏中心（v53创新功能 — 多源信息聚合+实时监控+个性化布局）
  { id: 'info-pulse-center', name: 'InfoPulse 信息脉搏', icon: <ZapIcon />, component: 'InfoPulseCenter', category: 'utilities', defaultWidth: 1280, defaultHeight: 900, minWidth: 1000, minHeight: 700, resizable: true, multiple: false,  description: '实时信息聚合中心：技术动态+天气状况+系统健康度+世界时钟+GitHub热门+加密货币，卡片化布局，数据实时刷新' },
  // 智能工作台（v52创新功能 — 统一工作入口，聚合常用工具与实时信息）
  { id: 'smart-workbench', name: '智能工作台', icon: <RocketIcon />, component: 'SmartWorkbench', category: 'utilities', defaultWidth: 1280, defaultHeight: 860, minWidth: 900, minHeight: 650, resizable: true, multiple: false,  description: '统一工作入口：快捷工具一键直达+系统状态实时监控+专注计时器+六大分类应用导航，玻璃拟态设计，启动即生产力' },
  // 实时系统监控（v48创新功能 — 真实系统数据监控）
  { id: 'real-system-monitor', name: '实时系统监控', icon: <ActivityIcon />, component: 'RealSystemMonitor', category: 'utilities', defaultWidth: 900, defaultHeight: 650, minWidth: 700, minHeight: 500, resizable: true, multiple: false,  description: '真实系统监控：JavaScript堆内存+网络状态+FPS+页面性能+本地存储，所有数据来自浏览器API' },
  // 剪贴板历史管理器（v48创新功能 — 剪贴板历史管理）
  { id: 'real-clipboard-history', name: '剪贴板历史', icon: <ClipboardIcon />, component: 'RealClipboardHistory', category: 'utilities', defaultWidth: 800, defaultHeight: 600, minWidth: 600, minHeight: 500, resizable: true, multiple: false,  description: '剪贴板历史管理：保存剪贴板历史+搜索过滤+收藏功能+自动保存到本地' },
  // 实时代码协作平台（v47创新功能 — 多语言支持+实时协作+代码执行）
  { id: 'realtime-code-collab', name: '实时代码协作', icon: <UserIcon />, component: 'RealTimeCodeCollab', category: 'development', defaultWidth: 1200, defaultHeight: 800, minWidth: 900, minHeight: 600, resizable: true, multiple: false,  description: '实时代码协作平台：支持JavaScript/TypeScript/Python/Java/C++/Go/Rust/HTML/CSS，模拟协作者光标，代码实时执行，会话分享' },
  // AI智能代码分析器（v47创新功能 — 代码质量分析+改进建议+实时反馈）
  { id: 'audio-viz', name: 'AudioViz 音乐可视化', icon: <AudioVizIcon />, component: 'AudioViz', category: 'multimedia', defaultWidth: 1000, defaultHeight: 700, minWidth: 600, minHeight: 500, resizable: true, multiple: false,  description: '实时音频可视化器：频谱柱状图/波形图/圆形频谱/粒子效果/脉冲圆环，支持麦克风/文件/演示模式' },
  { id: 'pulse-board', name: 'PulseBoard 实时仪表盘', icon: <PulseIcon />, component: 'PulseBoard', category: 'utilities', defaultWidth: 1200, defaultHeight: 800, minWidth: 800, minHeight: 600, resizable: true, multiple: false,  description: '实时信息仪表盘：系统监控+天气+新闻+加密货币+多时区时钟，数据实时刷新' },
  { id: 'knowledge-vine', name: 'KnowledgeVine 知识花园', icon: <VineIcon />, component: 'KnowledgeVine', category: 'office', defaultWidth: 1200, defaultHeight: 800, minWidth: 800, minHeight: 600, resizable: true, multiple: false,  description: '可视化知识管理：知识树+思维导图+笔记卡片，让你的想法像植物一样生长' },
  { id: 'neo-terminal', name: 'NeoTerminal 增强终端', icon: <TerminalIcon />, component: 'NeoTerminal', category: 'system', defaultWidth: 900, defaultHeight: 600, minWidth: 600, minHeight: 400, resizable: true, multiple: true,  description: 'AI增强的现代化终端：自然语言转命令、智能建议、命令解释、多标签页、主题切换' },
  // DevPortal 开发者门户（v46创新功能 — 一站式开发者工作台：7大模块30+实用开发工具）
  { id: 'dev-portal', name: 'DevPortal 开发者门户', icon: <DevPortalIcon />, component: 'DevPortal', category: 'development', defaultWidth: 1200, defaultHeight: 850, minWidth: 900, minHeight: 650, resizable: true, multiple: false,  description: '一站式开发者门户：代码工具+文本工具+颜色工具+时间工具+网络工具，30+实用开发工具集成' },
  // 智能仪表板（v46创新功能 — 一站式信息聚合中心：天气+系统监控+快捷工具+每日名言+待办事项）
  { id: 'smart-dashboard', name: '智能仪表板', icon: <DashboardIcon />, component: 'SmartDashboard', category: 'utilities', defaultWidth: 1200, defaultHeight: 820, minWidth: 900, minHeight: 650, resizable: true, multiple: false,  description: '一站式智能仪表板：实时天气+系统监控+快捷工具入口+每日励志名言+待办事项管理，玻璃拟态设计' },
  // 网络工具箱专业版（v46创新功能 — IP查询+DNS+URL编解码+网络监控+HTTP状态码+端口扫描，六大网络工具）
  { id: 'network-toolkit-pro', name: '网络工具箱 Pro', icon: <CustomGlobeIcon />, component: 'NetworkToolkitPro', category: 'internet', defaultWidth: 1100, defaultHeight: 750, minWidth: 800, minHeight: 600, resizable: true, multiple: false,  description: '专业网络工具箱：IP信息查询+DNS查找+URL编解码+网络状态监控+HTTP状态码查询+端口扫描器' },
  // DevLab 开发者实验室（v45创新功能 — 12+开发工具集成，一站式开发工具箱）
  { id: 'dev-lab', name: 'DevLab 开发者实验室', icon: <SparklesIcon />, component: 'DevLab', category: 'development', defaultWidth: 1100, defaultHeight: 750, minWidth: 800, minHeight: 600, resizable: true, multiple: false,  description: '一站式开发者工具箱：JSON格式化、Base64编解码、哈希生成、UUID生成、密码生成、颜色工具、时间戳转换等12+实用开发工具' },
  // 云剪贴板（v40 创新功能 — 基于 GitHub Gist 的真实跨设备同步）
  { id: 'cloud-clipboard', name: '云剪贴板', icon: <BackupIcon />, component: 'CloudClipboard', category: 'utilities', defaultWidth: 1000, defaultHeight: 720, minWidth: 720, minHeight: 500, resizable: true, multiple: false,  description: '基于 GitHub Gist 的跨设备云剪贴板：本地存储 + Gist 同步 + 分享链接 + 语法检测' },
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
  // BookFinder 书海检索（v50创新功能 — 接入 Open Library 公开 API 的真实图书发现工具）
  { id: 'book-finder', name: '书海检索', icon: <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="1.8"><path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"/><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"/><path d="M9 7h7M9 11h7"/></svg>, component: 'BookFinder', category: 'internet', defaultWidth: 1100, defaultHeight: 760, minWidth: 720, minHeight: 520, resizable: true, multiple: false,  description: '基于 Open Library 公开 API 的真实图书发现：搜索数百万册图书、封面预览、作品详情、ISBN/评分、主题筛选、本地收藏' },
  // 新增WebIDE Pro在线编程环境（v36.0核心创新）
  { id: 'web-ide-pro', name: 'WebIDE Pro 在线编程', icon: <Code2Icon />, component: 'WebIDEPro', category: 'development', defaultWidth: 1300, defaultHeight: 850, minWidth: 1000, minHeight: 700, resizable: true, multiple: false },
  // 新增在线编程实验室（v35.0核心创新）
  { id: 'online-programming-lab', name: '在线编程实验室', icon: <Code2Icon />, component: 'OnlineProgrammingLab', category: 'development', defaultWidth: 1200, defaultHeight: 800, minWidth: 900, minHeight: 600, resizable: true, multiple: false },
  // 新增智能代码助手（v28.0创新功能）
  { id: 'intelligent-code-assistant', name: '智能代码助手', icon: <SparklesIcon />, component: 'IntelligentCodeAssistant', category: 'development', defaultWidth: 1100, defaultHeight: 800, minWidth: 800, minHeight: 600, resizable: true, multiple: false },
  // 新增DevKit开发者工具箱（v23.0迭代）
  { id: 'dev-kit', name: 'DevKit 开发者工具箱', icon: <WrenchIcon />, component: 'DevKit', category: 'development', defaultWidth: 1000, defaultHeight: 700, minWidth: 700, minHeight: 500, resizable: true, multiple: false },
  // 新增CyberHub赛博格控制中心（v26.0迭代）
  { id: 'cyber-hub', name: 'CyberHub 控制中心', icon: <ActivityIcon />, component: 'CyberHub', category: 'utilities', defaultWidth: 1200, defaultHeight: 800, minWidth: 900, minHeight: 600, resizable: true, multiple: false },
  // 新增智能开发者工作台（v31.0创新功能）
  { id: 'dev-workbench', name: '智能开发者工作台', icon: <RocketIcon />, component: 'DevWorkbench', category: 'development', defaultWidth: 1400, defaultHeight: 900, minWidth: 1000, minHeight: 700, resizable: true, multiple: false },
  // 新增系统诊断与性能分析（v42增强）
  { id: 'system-diagnostics-pro', name: '系统诊断分析', icon: <ActivityIcon />, component: 'SystemDiagnosticsPro', category: 'utilities', defaultWidth: 1000, defaultHeight: 700, minWidth: 800, minHeight: 600, resizable: true, multiple: false,  description: '全面系统健康检查：CPU/内存/网络/WebGL/存储性能分析与优化建议' },
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
  { id: 'color-palette', name: '色彩提取器', icon: <PaletteIcon />, component: 'ColorPaletteExtractor', category: 'graphics', defaultWidth: 900, defaultHeight: 750, minWidth: 700, minHeight: 550, resizable: true, multiple: false,  description: '图片主色提取工具：支持URL/上传/拖拽、ColorThief算法、颜色命名、LocalStorage收藏、CSS/SCSS导出' },
  { id: 'prompt-engineering-lab', name: 'AI Prompt 工程实验室', icon: <SparklesIcon />, component: 'PromptEngineeringLab', category: 'development', defaultWidth: 1100, defaultHeight: 800, minWidth: 800, minHeight: 600, resizable: true, multiple: false,  description: 'AI提示词工程实验室：10+精选模板、变量插值、分类管理、一键生成预览、本地收藏' },
  { id: 'website-performance-tester', name: '网站性能测试', icon: <ActivityIcon />, component: 'WebsitePerformanceTester', category: 'development', defaultWidth: 1000, defaultHeight: 800, minWidth: 750, minHeight: 600, resizable: true, multiple: false,  description: '网站性能分析工具：TTFB/加载时间/资源统计/优化建议/报告导出' },
  { id: 'codepen-lite', name: '前端代码编辑器', icon: <Code2Icon />, component: 'CodePenLite', category: 'development', defaultWidth: 1100, defaultHeight: 750, minWidth: 800, minHeight: 600, resizable: true, multiple: false },
  // 代码助手专业版（v37.2新增）
  { id: 'code-assistant-pro', name: '代码助手专业版', icon: <CodeIcon />, component: 'CodeAssistantPro', category: 'development', defaultWidth: 900, defaultHeight: 600, minWidth: 700, minHeight: 500, resizable: true, multiple: false },
  // 系统监控仪表盘（v37.2新增）
  { id: 'system-monitor-dashboard', name: '系统监控仪表盘', icon: <ActivityIcon />, component: 'SystemMonitorDashboard', category: 'utilities', defaultWidth: 900, defaultHeight: 650, minWidth: 700, minHeight: 500, resizable: true, multiple: false },
  // 代码搜索（v38.2新增）- 搜索GitHub开源项目
  { id: 'code-search', name: '代码搜索', icon: <SearchIcon />, component: 'CodeSearch', category: 'development', defaultWidth: 900, defaultHeight: 650, minWidth: 700, minHeight: 500, resizable: true, multiple: false },
  // PromptForge 提示词工程工作室（v41创新功能 — 模板库+变量插值+实时测试+AI优化建议）
  { id: 'prompt-forge', name: 'PromptForge 提示词工作室', icon: <WandIcon />, component: 'PromptForge', category: 'utilities', defaultWidth: 1100, defaultHeight: 750, minWidth: 800, minHeight: 600, resizable: true, multiple: false,  description: 'AI 提示词工程工作室：精选模板库+变量插值+实时测试+一键 AI 优化建议+历史记录' },
  // WebSnapshot 网页快照分析（v41创新功能 — 基于 microlink.io 的真实网页截图与元数据抓取）
  { id: 'web-snapshot', name: 'WebSnapshot 网页快照', icon: <CameraIcon />, component: 'WebSnapshot', category: 'internet', defaultWidth: 1200, defaultHeight: 800, minWidth: 900, minHeight: 600, resizable: true, multiple: false,  description: '网页快照分析工具：输入 URL 获取截图/标题/描述/OG 图，支持桌面/平板/手机视口与对比模式' },
  // PrivacyGuard 隐私守护者（v43创新功能 — 17 类 PII 检测+脱敏，零网络请求）
  { id: 'privacy-guard', name: 'PrivacyGuard 隐私守护', icon: <ShieldIcon />, component: 'PrivacyGuard', category: 'utilities', defaultWidth: 1100, defaultHeight: 760, minWidth: 800, minHeight: 600, resizable: true, multiple: false,  description: '本地 PII 检测与脱敏：识别邮箱/手机号/身份证/银行卡/IP/API Key/JWT/私钥等 17 类敏感信息，支持仅检测、部分掩码、哈希替换、完全移除四种模式' },
  // JSONForge JSON 一体化处理工作台（v43创新功能 — 格式化/YAML/CSV/Diff/Schema 五合一）
  { id: 'json-forge', name: 'JSONForge JSON 工坊', icon: <Code2Icon />, component: 'JSONForge', category: 'development', defaultWidth: 1200, defaultHeight: 800, minWidth: 900, minHeight: 600, resizable: true, multiple: false,  description: 'JSON 一体化处理：格式化/压缩、JSON⇌YAML、JSON⇌CSV、双 JSON Diff、JSON Schema 自动生成，全部本地计算' },
  // CronLab Cron 表达式实验室（v43创新功能 — 可视化构建+解释+下次触发预览）
  { id: 'cron-lab', name: 'CronLab Cron 实验室', icon: <ClockIcon />, component: 'CronLab', category: 'development', defaultWidth: 1100, defaultHeight: 750, minWidth: 800, minHeight: 600, resizable: true, multiple: false,  description: 'Cron 表达式实验室：可视化构建器、人类可读解释、下次触发时间预览、12 种常用预设，支持别名(L/W/#/mon-jan)语法' },
  // 在线代码编译器（v44创新功能 — JavaScript实时执行+HTML/CSS预览+多语言示例）
  { id: 'online-compiler', name: '在线代码编译器', icon: <TerminalIcon />, component: 'OnlineCompiler', category: 'development', defaultWidth: 1200, defaultHeight: 800, minWidth: 900, minHeight: 600, resizable: true, multiple: false,  description: '在线代码编译运行器：JavaScript实时执行+HTML/CSS预览+控制台输出捕获+算法示例' },
  // QuickCapture 捕手（v44创新功能 — 碎片信息收集工作台：五类内容+智能识别+标签+导入导出+快捷键）
  { id: 'quick-capture', name: 'QuickCapture 捕手', icon: <LayersIcon />, component: 'QuickCapture', category: 'utilities', defaultWidth: 1000, defaultHeight: 700, minWidth: 720, minHeight: 500, resizable: true, multiple: false,  description: '碎片信息收集工作台：五类内容(文本/代码/链接/待办/引用)+智能识别粘贴+多标签筛选+置顶收藏+导入导出+快捷键' },
  // 性能监控面板（v44创新功能 — 实时性能监控+FPS/内存/存储分析+智能警告）
  { id: 'performance-dashboard', name: '性能监控面板', icon: <ActivityIcon />, component: 'PerformanceDashboard', category: 'system', defaultWidth: 1200, defaultHeight: 800, minWidth: 900, minHeight: 600, resizable: true, multiple: false,  description: '实时性能监控：FPS/内存/CPU/存储分析，智能性能警告，历史数据可视化，优化建议' },
  // API测试终极版（v45创新功能 — 真实API调用+模板库+历史记录+收藏管理）
  { id: 'api-tester-ultra', name: 'API测试终结者', icon: <ApiLabIcon />, component: 'APITesterUltra', category: 'development', defaultWidth: 1200, defaultHeight: 800, minWidth: 900, minHeight: 600, resizable: true, multiple: false,  description: '专业API测试工具：真实API调用、预设模板库(GitHub/NASA/汇率等)、请求历史、收藏管理、响应格式化、一键复制/下载' },
  // 开发者快捷键大全（v45创新功能 — VS Code/Chrome/macOS/Terminal/Git/Vim快捷键速查）
  { id: 'dev-shortcuts', name: '开发者快捷键大全', icon: <CommandIcon />, component: 'DevShortcuts', category: 'utilities', defaultWidth: 1000, defaultHeight: 700, minWidth: 700, minHeight: 500, resizable: true, multiple: false,  description: '开发者必备快捷键速查表：覆盖VS Code/Chrome/macOS/Terminal/Git/Vim/Web开发，支持搜索、分类筛选、一键复制、自定义添加、收藏管理' },
  // FlowBoard 可视化工作流编辑器
  { id: 'flowboard', name: 'FlowBoard 工作流', icon: <WorkflowIcon />, component: 'FlowBoard', category: 'utilities', defaultWidth: 1200, defaultHeight: 800, minWidth: 800, minHeight: 600, resizable: true, multiple: false,  description: '可视化工作流编辑器：拖拽式节点编辑、条件分支、模拟执行、导出JSON' },
  // === v49.0 新增 Global Insights 全球洞察 - 集成多个真实公开 API ===
  { id: 'global-insights', name: 'Global Insights 全球洞察', icon: <GlobeInsightsIcon />, component: 'GlobalInsights', category: 'internet', defaultWidth: 1280, defaultHeight: 820, minWidth: 900, minHeight: 600, resizable: true, multiple: false,  description: '一站式全球信息聚合：新闻、国家、每日箴言、趣味冷知识、虚拟用户、NASA 每日图、汇率、GitHub 趋势 - 全部基于真实公开 API' },
  // === v51.0 新增创新实用工具 — 基于浏览器原生API的真实功能 ===
  { id: 'web-speech-synth', name: '语音合成阅读器', icon: <MicIcon />, component: 'WebSpeechSynth', category: 'utilities', defaultWidth: 800, defaultHeight: 650, minWidth: 600, minHeight: 500, resizable: true, multiple: false,  description: '基于 Web Speech API 的文本朗读工具：多语音选择、语速/音调/音量控制、进度高亮、支持中英文' },
  { id: 'screen-capture', name: '屏幕录制工具', icon: <VideoRecorderIcon />, component: 'ScreenCapture', category: 'utilities', defaultWidth: 850, defaultHeight: 650, minWidth: 650, minHeight: 500, resizable: true, multiple: false,  description: '基于 getDisplayMedia + MediaRecorder 的屏幕录制：格式选择、计时器、暂停/继续、录制预览与下载' },
  { id: 'file-hash-calc', name: '文件哈希计算器', icon: <ShieldIcon />, component: 'FileHashCalc', category: 'utilities', defaultWidth: 900, defaultHeight: 700, minWidth: 700, minHeight: 550, resizable: true, multiple: false,  description: '基于 Web Crypto API 的哈希计算：文件拖拽/文本输入、SHA-1/256/384/512 多算法、一键复制、哈希对比' },
  { id: 'web-serial-terminal', name: 'Web Serial 终端', icon: <HardDriveIcon />, component: 'WebSerialTerminal', category: 'development', defaultWidth: 900, defaultHeight: 650, minWidth: 700, minHeight: 500, resizable: true, multiple: false,  description: '基于 Web Serial API 的串口终端：波特率/数据位/校验位配置、HEX/ASCII模式、实时收发、硬件调试' },
  // === v54.0 新增创新应用 — NexusHub 互联枢纽 + EcoTrack 碳足迹追踪器
  { id: 'nexus-hub', name: 'NexusHub 互联枢纽', icon: <NexusHubIcon />, component: 'NexusHub', category: 'internet', defaultWidth: 1280, defaultHeight: 860, minWidth: 900, minHeight: 650, resizable: true, multiple: false,  description: '一站式内容发现与收藏中心：箴言、笑话、萌宠、虚拟人物、艺术画廊、美食食谱、API探索，基于8个合规公开API，支持本地收藏' },
  { id: 'eco-track', name: 'EcoTrack 碳足迹追踪', icon: <EcoTrackIcon />, component: 'EcoTrack', category: 'utilities', defaultWidth: 1200, defaultHeight: 820, minWidth: 850, minHeight: 620, resizable: true, multiple: false,  description: '个人碳足迹追踪与教育工具：交通、居家、饮食、购物、能耗5大类30+预设活动，数据可视化，目标跟踪，等价值换算，基于IPCC公开因子' },
  // === v54.1 新增三大创新应用 — NeuroGraph / ImageForge / TimeCapsule
  { id: 'neuro-graph', name: 'NeuroGraph 神经笔记', icon: <NeuroGraphIcon />, component: 'NeuroGraph', category: 'office', defaultWidth: 1280, defaultHeight: 820, minWidth: 900, minHeight: 600, resizable: true, multiple: false,  description: '双向链接 + 知识图谱可视化的本地笔记应用：[[wiki 链接]] 自动补全、力导向图谱、标签、反向链接、命令面板(⌘K)、导入/导出 JSON' },
  { id: 'image-forge', name: 'ImageForge AI 图像工坊', icon: <ImageForgeIcon />, component: 'ImageForge', category: 'multimedia', defaultWidth: 1280, defaultHeight: 860, minWidth: 900, minHeight: 640, resizable: true, multiple: false,  description: '零配置 AI 图像生成器：基于 Pollinations.ai 公开免费 API，8 种艺术风格预设、5 种模型、5 种比例、反向提示词、生成历史与收藏' },
  { id: 'time-capsule', name: 'TimeCapsule 时间胶囊', icon: <TimeCapsuleIcon />, component: 'TimeCapsule', category: 'utilities', defaultWidth: 1200, defaultHeight: 820, minWidth: 880, minHeight: 620, resizable: true, multiple: false,  description: '个人里程碑 + 习惯打卡 + 任务追踪 + 每日反思四合一：时间线视图、连续打卡可视化、心情记录、智能提示词、可关联子任务' },
  // === v55 新增五大创新实用工具（v55 Innovation Suite）
  { id: 'open-api-hub', name: 'OpenAPI Hub · 开放API工坊', icon: <OpenAPIHubIcon />, component: 'OpenAPIHub', category: 'development', defaultWidth: 1280, defaultHeight: 860, minWidth: 960, minHeight: 640, resizable: true, multiple: false,  description: '集成 15+ 合规公开 API：天气预报/地理编码/公开知识/加密货币/NASA天文/随机用户/开放数据等，可视化请求构建+参数配置+响应展示+收藏与历史' },
  { id: 'resume-forge', name: 'ResumeForge · 简历工坊', icon: <ResumeForgeIcon />, component: 'ResumeForge', category: 'office', defaultWidth: 1280, defaultHeight: 860, minWidth: 1000, minHeight: 680, resizable: true, multiple: false,  description: '真正可用的专业简历生成器：4种模板+10色主题，7大模块编辑，分屏/编辑/预览三视图，HTML/Markdown/JSON三格式导出，浏览器600ms自动保存' },
  { id: 'data-viz-studio', name: 'DataViz Studio · 数据可视化工坊', icon: <DataVizStudioIcon />, component: 'DataVizStudio', category: 'development', defaultWidth: 1280, defaultHeight: 860, minWidth: 1000, minHeight: 680, resizable: true, multiple: false,  description: '专业数据可视化：柱状/折线/面积/饼/环形/散点/雷达 8种图表，CSV/JSON双格式导入导出，SVG矢量复制，智能统计洞察 + Z-Score异常检测' },
  { id: 'code-review-bot', name: 'CodeReviewBot · AI代码审查', icon: <CodeReviewBotIcon />, component: 'CodeReviewBot', category: 'development', defaultWidth: 1280, defaultHeight: 860, minWidth: 1000, minHeight: 680, resizable: true, multiple: false,  description: '离线代码审查引擎：25+高价值规则（安全/性能/复杂度/可维护/命名规范），精确行号定位+修复建议+评分环图+批量 nolint，HTML审查报告导出' },
  { id: 'flash-master', name: 'FlashMaster · 间隔重复记忆', icon: <FlashMasterIcon />, component: 'FlashMaster', category: 'office', defaultWidth: 1200, defaultHeight: 820, minWidth: 900, minHeight: 640, resizable: true, multiple: false,  description: 'SM-2间隔重复算法卡片：学习/浏览/统计三视图，86张内置英语/React/系统设计/算法卡片，3D翻转动画+热力图打卡+LeetCode刷题模式+JSON导入导出' },
  // === v55.1 新增两大核心创新工具（v55.1 Innovation Suite）
  { id: 'markdown-publisher', name: 'MarkdownPublisher · 内容发布工坊', icon: <MarkdownPublisherIcon />, component: 'MarkdownPublisher', category: 'office', defaultWidth: 1280, defaultHeight: 860, minWidth: 900, minHeight: 620, resizable: true, multiple: false,  description: '真正可用的 Markdown 写作与发布：5种出版模板（极简白/文章深读/杂志风/技术文档/手账笔记），分屏编辑+实时预览+一键明暗主题，生成独立 HTML 文件带完整样式，本地多文档管理' },
  { id: 'idea-board', name: 'IdeaBoard · 灵感无限画板', icon: <IdeaBoardIcon />, component: 'IdeaBoardInfinite', category: 'multimedia', defaultWidth: 1280, defaultHeight: 860, minWidth: 960, minHeight: 640, resizable: true, multiple: false,  description: 'AI 提示词生成 + 自由绘画 + 可拖拽灵感卡片三合一：8种艺术风格（赛博朋克/水彩/像素/中国风等），撤销重做，PNG 导出，无限想法组织' },
  // === v55.2 新增 LivePulse 实时信息中心
  { id: 'live-pulse', name: 'LivePulse · 实时信息中心', icon: <LivePulseIcon />, component: 'LivePulse', category: 'internet', defaultWidth: 1180, defaultHeight: 820, minWidth: 880, minHeight: 600, resizable: true, multiple: false,  description: '四大实时信息面板：全球汇率(Frankfurter)、Hacker News/航天科技新闻、编程笑话(JokeAPI)、奇趣冷知识(UselessFacts+AdviceSlip)，缓存、收藏、复制、一键刷新一应俱全' },
  // === v55.3 新增 InsightPulse AI 洞察仪表盘 + CodeDocGen 代码文档生成器
  { id: 'insight-pulse', name: 'InsightPulse · AI 洞察仪表盘', icon: <InsightPulseIcon />, component: 'InsightPulse', category: 'internet', defaultWidth: 1280, defaultHeight: 860, minWidth: 960, minHeight: 640, resizable: true, multiple: false,  description: '多源聚合洞察中心：Hacker News 科技新闻、GitHub 热门趋势、ZenQuotes 每日箴言、RestCountries 世界国家信息，支持 10 分钟智能缓存、搜索过滤、本地收藏、一键复制、离线回退' },
  { id: 'code-doc-gen', name: 'CodeDocGen · 代码文档生成器', icon: <CodeDocGenIcon />, component: 'CodeDocGen', category: 'development', defaultWidth: 1200, defaultHeight: 840, minWidth: 900, minHeight: 640, resizable: true, multiple: false,  description: '多语言代码文档自动生成：TypeScript/JavaScript/Python/Go/Rust/Java/CSS/HTML 自动检测，JSDoc/Google/NumPy/Doxygen/PyDoc 五种注释风格，函数摘要/参数/返回值/异常/示例六维分析，一键复制或导出 Markdown' },
  // === v60 创新应用套件
  { id: 'ai-wiki-search', name: 'AIWikiSearch · 智能维基搜索', icon: <WikiSearchIcon />, component: 'AIWikiSearch', category: 'internet', defaultWidth: 1280, defaultHeight: 860, minWidth: 960, minHeight: 640, resizable: true, multiple: false,  description: 'Wikipedia 智能搜索：中英双语实时搜索建议、文章阅读+目录导航、AI摘要生成、收藏与历史、深色/浅色主题、玻璃拟态设计' },
  { id: 'code-snap-share', name: 'CodeSnapShare · 代码片段分享', icon: <CodeSnapIcon />, component: 'CodeSnapShare', category: 'development', defaultWidth: 1200, defaultHeight: 820, minWidth: 900, minHeight: 600, resizable: true, multiple: false,  description: '代码片段快速分享：10种语言语法高亮、Base64编码分享链接、一键复制导入、收藏与历史管理、表情标签、主题切换' },
  { id: 'web-summarizer', name: 'WebSummarizer · 网页摘要工具', icon: <WebSummarizeIcon />, component: 'WebSummarizer', category: 'utilities', defaultWidth: 1280, defaultHeight: 860, minWidth: 960, minHeight: 640, resizable: true, multiple: false,  description: '网页内容提取与智能摘要：URL元数据抓取、多级摘要生成、关键词提取、阅读难度分析、7种语言翻译、导出Markdown' },
  // === v61 创新应用套件 — AI 创作工作室 + 实时数据洞察 + 浏览器工具箱
  { id: 'ai-creation-studio', name: 'AI 创作工作室', icon: <SparklesIcon />, component: 'AICreationStudio', category: 'multimedia', defaultWidth: 1280, defaultHeight: 860, minWidth: 960, minHeight: 640, resizable: true, multiple: false,  description: 'AI 驱动的一站式创作平台：AI 图像生成（Pollinations.ai）、智能文案生成、配色方案生成、画布绘制，四合一创作工作台' },
  { id: 'crypto-market-tracker', name: '加密货币行情追踪', icon: <TrendingUpIcon />, component: 'CryptoTracker', category: 'internet', defaultWidth: 1280, defaultHeight: 860, minWidth: 960, minHeight: 640, resizable: true, multiple: false,  description: '实时加密货币行情追踪：基于 CoinGecko 公开 API，支持 100+ 加密货币、价格走势图、市值排名、收藏列表、价格提醒' },
  { id: 'reddit-explorer', name: 'Reddit 探索', icon: <MessageIcon />, component: 'NewsHub', category: 'internet', defaultWidth: 1200, defaultHeight: 820, minWidth: 900, minHeight: 600, resizable: true, multiple: false,  description: 'Reddit 社区内容探索：基于 Reddit JSON API，浏览热门帖子、子版块搜索、投票互动、内容收藏' },
  { id: 'color-contrast-checker', name: 'WCAG 对比度检查器', icon: <PaletteIcon />, component: 'ColorPicker', category: 'development', defaultWidth: 900, defaultHeight: 700, minWidth: 700, minHeight: 500, resizable: true, multiple: false,  description: 'WCAG 2.1 对比度合规检查：实时计算前景/背景颜色对比度、AAA/AA 等级判定、色盲模拟、色彩和谐度建议' },
  { id: 'keyboard-shortcut-tester', name: '快捷键测试器', icon: <CommandIcon />, component: 'DevShortcuts', category: 'utilities', defaultWidth: 1000, defaultHeight: 750, minWidth: 800, minHeight: 550, resizable: true, multiple: false,  description: '实时键盘事件可视化测试：捕获按键事件、显示键码/修饰键、生成快捷键组合、导出按键记录' },
  // === 新增创新应用套件 — 网络诊断/股票仪表盘/AI提示词优化 ===
  { id: 'net-diagnostics', name: '网络诊断', icon: <NetworkIcon />, component: 'NetDiagnostics', category: 'internet', defaultWidth: 1280, defaultHeight: 860, minWidth: 900, minHeight: 640, resizable: true, multiple: false,  description: '专业网络诊断工具：DNS查询(Cloudflare DoH)、HTTP测试、端口检查、子域名发现，支持数据导出' },
  
  { id: 'ai-prompt-optimizer', name: 'AI 提示词优化器', icon: <SparklesIcon />, component: 'AIPromptOptimizer', category: 'utilities', defaultWidth: 1280, defaultHeight: 860, minWidth: 960, minHeight: 640, resizable: true, multiple: false,  description: 'AI提示词工程优化器：智能评分引擎、20个场景模板、变量系统、实时预览与建议、历史收藏持久化' },
  { id: 'weather-live', name: '天气实况', icon: <CloudRainIcon />, component: 'AtmosphericWeather', category: 'internet', defaultWidth: 1280, defaultHeight: 860, minWidth: 900, minHeight: 640, resizable: true, multiple: false,  description: '精美天气仪表盘：Open-Meteo API、全球城市搜索、24h温度曲线、7日预报、收藏城市、动态背景' },
  // === v62 三大创新应用套件 ===
  { id: 'nebula-dashboard', name: 'Nebula 星云仪表盘', icon: <NebulaIcon />, component: 'NebulaDashboard', category: 'internet', defaultWidth: 1280, defaultHeight: 880, minWidth: 960, minHeight: 660, resizable: true, multiple: false,  description: '一站式信息聚合中心：NASA每日天文图、实时加密货币行情、精准天气预报、每日励志名言、系统状态监控，多源API一屏掌握' },
  { id: 'pollinations-ai', name: 'Pollinations AI 工坊', icon: <PollinationsAIIcon />, component: 'PollinationsAI', category: 'utilities', defaultWidth: 1200, defaultHeight: 860, minWidth: 900, minHeight: 650, resizable: true, multiple: false,  description: '零配置 AI 全能工作台：AI智能对话、图像生成、代码生成、多语言翻译、文本总结写作，基于 Pollinations.ai 免费公开 API' },
  { id: 'dev-atlas', name: 'DevAtlas 开发者图鉴', icon: <DevAtlasIcon />, component: 'DevAtlas', category: 'development', defaultWidth: 1280, defaultHeight: 880, minWidth: 960, minHeight: 660, resizable: true, multiple: false,  description: '系统化学习路径导航：10+精选技术路径、步骤化学习指南、高质量免费资源聚合、进度跟踪收藏，构建你的技术成长地图' },
  // === v63 安全与创新套件 ===
  { id: 'secure-vault', name: 'SecureVault 密码保险库', icon: <LockIcon />, component: 'SecureVault', category: 'utilities', defaultWidth: 1200, defaultHeight: 820, minWidth: 900, minHeight: 640, resizable: true, multiple: false,  description: '本地加密密码管理器：Web Crypto API AES-GCM加密、主密码解锁、密码CRUD、自动生成强密码、强度指示器、分类管理、标签搜索、导入导出' },
  { id: 'crypto-price', name: 'CryptoPrice 实时行情', icon: <TrendingUpIcon />, component: 'CryptoPriceTracker', category: 'internet', defaultWidth: 1280, defaultHeight: 860, minWidth: 960, minHeight: 640, resizable: true, multiple: false,  description: '实时加密货币行情追踪：CoinGecko公开API、100+币种、价格走势图、市值排名、收藏列表、24h涨跌幅、成交量数据' },
  { id: 'system-health', name: 'SystemHealth 健康检查', icon: <ActivityIcon />, component: 'SystemHealthCheck', category: 'system', defaultWidth: 1100, defaultHeight: 780, minWidth: 850, minHeight: 600, resizable: true, multiple: false,  description: '浏览器系统健康检查：内存使用、CPU负载、FPS监控、网络状态、存储分析、渲染性能、优化建议，所有数据来自浏览器API' },
  { id: 'json-workbench', name: 'JSON Workbench 工作台', icon: <Code2Icon />, component: 'JsonWorkbench', category: 'development', defaultWidth: 1280, defaultHeight: 860, minWidth: 960, minHeight: 640, resizable: true, multiple: false,  description: 'JSON处理工作台：格式化/压缩/校验、JSONPath查询、Diff对比、Schema生成、TypeScript类型生成、树形可视化、批量处理' },
  { id: 'time-travel', name: 'TimeTravel 时间旅行', icon: <ClockIcon />, component: 'TimeTravel', category: 'utilities', defaultWidth: 1100, defaultHeight: 780, minWidth: 850, minHeight: 600, resizable: true, multiple: false,  description: '时间戳转换与日期计算：Unix时间戳互转、时区转换、日期差值计算、节假日倒数、自定义格式、批量转换' },
  { id: 'color-lab', name: 'ColorLab 色彩实验室', icon: <PaletteIcon />, component: 'ColorLab', category: 'development', defaultWidth: 1100, defaultHeight: 780, minWidth: 850, minHeight: 600, resizable: true, multiple: false,  description: '色彩工具箱：颜色选择器、HEX/RGB/HSL互转、调色板生成、渐变编辑器、对比度检查、色盲模拟、配色方案' },
  // === v64 创新应用套件 — UnifiedCommandHub + DevPulseHub + CryptoMarketHub
  { id: 'unified-command-hub', name: 'UnifiedCmd 统一命令中心', icon: <CommandIcon />, component: 'UnifiedCommandHub', category: 'utilities', defaultWidth: 1100, defaultHeight: 780, minWidth: 850, minHeight: 600, resizable: true, multiple: false,  description: '一站式智能查询中心：自然语言输入自动识别查询类型，集成天气/汇率/国家/维基/词典/名言/计算器 7 大公开 API，支持历史记录与本地收藏' },
  { id: 'dev-pulse-hub', name: 'DevPulse 开发者脉搏', icon: <ActivityIcon />, component: 'DevPulseHub', category: 'development', defaultWidth: 1200, defaultHeight: 820, minWidth: 900, minHeight: 640, resizable: true, multiple: false,  description: '开发者新闻与资源聚合中心：Hacker News + GitHub Trending + DEV.to + Product Hunt 多源聚合，智能缓存、搜索过滤、排序收藏、一键跳转原文' },
  { id: 'crypto-market-hub', name: 'CryptoMarketHub 加密行情', icon: <svg viewBox="0 0 24 24" width="18" height="18" stroke="currentColor" strokeWidth="1.8" fill="none" strokeLinecap="round" strokeLinejoin="round"><path d="M3 3v18h18"/><path d="M7 14l3-3 3 3 5-5"/><circle cx="20" cy="6" r="1.2" fill="currentColor" stroke="none"/></svg>, component: 'CryptoMarketHub', category: 'internet', defaultWidth: 1280, defaultHeight: 860, minWidth: 960, minHeight: 640, resizable: true, multiple: false,  description: '加密货币实时行情中心：基于 CoinGecko 免费公开 API，80+ 币种、24h 涨跌幅、7 日 Sparkline、自选币种、持仓追踪（总价值/盈亏/24h浮动盈亏）、自动刷新、缓存加速' },
  // === v65 新增创新应用 ===
  { id: 'dns-diagnostics', name: 'DNS 网络诊断', icon: <NetworkIcon />, component: 'DnsDiagnostics', category: 'internet', defaultWidth: 1100, defaultHeight: 780, minWidth: 850, minHeight: 600, resizable: true, multiple: false,  description: 'DNS网络诊断工具：支持A/AAAA/MX/NS/TXT等10种DNS记录查询、常见端口扫描、HTTP响应检测、ASN信息查询，基于Cloudflare DoH' },
  { id: 'color-tools', name: 'ColorTools 色彩工具箱', icon: <PaletteIcon />, component: 'ColorTools', category: 'development', defaultWidth: 1100, defaultHeight: 780, minWidth: 850, minHeight: 600, resizable: true, multiple: false,  description: '专业色彩工具箱：颜色选择器、HEX/RGB/HSL/OKLCH互转、调色板生成、渐变编辑器、WCAG对比度检查、色盲模拟、Tailwind主题生成' },
  { id: 'markdown-pro', name: 'Markdown Pro 编辑器', icon: <NoteIcon />, component: 'MarkdownPreviewer', category: 'office', defaultWidth: 1200, defaultHeight: 800, minWidth: 900, minHeight: 650, resizable: true, multiple: false,  description: 'Markdown Pro 实时预览编辑器：分屏编辑+实时预览、GitHub风格、代码高亮、Mermaid图表、数学公式、导出HTML/PDF、自动保存' },
  // === v66 新增创新实用工具 ===
  { id: 'exchange-rate', name: '实时汇率', icon: <svg viewBox="0 0 24 24" width="18" height="18" stroke="currentColor" strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="1" x2="12" y2="23"/><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/></svg>, component: 'ExchangeRate', category: 'internet', defaultWidth: 1100, defaultHeight: 780, minWidth: 800, minHeight: 600, resizable: true, multiple: false,  description: '基于 ExchangeRate-API 公开接口的实时汇率转换：18种主流货币、收藏常用货币、历史记录、缓存优化、一键复制' },
  { id: 'dev-toolkit-new', name: '开发者工具箱', icon: <WrenchIcon />, component: 'DevToolkit', category: 'development', defaultWidth: 1100, defaultHeight: 780, minWidth: 800, minHeight: 600, resizable: true, multiple: false,  description: '开发者必备工具箱：UUID生成、Base64编解码、哈希计算、密码生成、JWT解码，五大核心工具集成' },
  { id: 'unit-converter-pro', name: '单位转换 Pro', icon: <svg viewBox="0 0 24 24" width="18" height="18" stroke="currentColor" strokeWidth="2" fill="none"><path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"/><polyline points="3.27 6.96 12 12.01 20.73 6.96"/><line x1="12" y1="22.08" x2="12" y2="12"/></svg>, component: 'UnitConverter', category: 'utilities', defaultWidth: 900, defaultHeight: 700, minWidth: 700, minHeight: 500, resizable: true, multiple: false,  description: '全面的单位转换工具：长度、重量、温度、面积、体积、速度、时间、数据存储 8 大类 50+ 单位' },
  { id: 'timer-app', name: '计时器与秒表', icon: <svg viewBox="0 0 24 24" width="18" height="18" stroke="currentColor" strokeWidth="2" fill="none"><circle cx="12" cy="13" r="8"/><path d="M12 9v4l2 2M9 2h6"/></svg>, component: 'TimerApp', category: 'utilities', defaultWidth: 500, defaultHeight: 600, minWidth: 400, minHeight: 500, resizable: true, multiple: false,  description: '精美的计时器和秒表：倒计时、正计时、圈数记录、预设常用时长、声音提醒' },
  { id: 'dice-roller', name: '骰子模拟器', icon: <svg viewBox="0 0 24 24" width="18" height="18" stroke="currentColor" strokeWidth="2" fill="none"><rect x="3" y="3" width="18" height="18" rx="3"/><circle cx="8" cy="8" r="1.5" fill="currentColor"/><circle cx="16" cy="8" r="1.5" fill="currentColor"/><circle cx="12" cy="12" r="1.5" fill="currentColor"/><circle cx="8" cy="16" r="1.5" fill="currentColor"/><circle cx="16" cy="16" r="1.5" fill="currentColor"/></svg>, component: 'OnlineDiceRoller', category: 'games', defaultWidth: 600, defaultHeight: 500, minWidth: 400, minHeight: 400, resizable: true, multiple: false,  description: '骰子模拟器：D4/D6/D8/D10/D12/D20多种骰子、多骰投掷、历史记录、概率分布' },
  { id: 'quick-quote', name: 'QuickQuote 名言生成', icon: <SparklesIcon />, component: 'QuickQuote', category: 'utilities', defaultWidth: 900, defaultHeight: 700, minWidth: 700, minHeight: 500, resizable: true, multiple: false,  description: '随机名言生成器：接入 ZenQuotes 公开API、6大分类筛选、收藏管理、一键复制' },
  { id: 'astro-viewer', name: 'AstroViewer 天文图', icon: <WallpaperIcon />, component: 'AstroViewer', category: 'internet', defaultWidth: 1000, defaultHeight: 750, minWidth: 700, minHeight: 500, resizable: true, multiple: false,  description: 'NASA每日天文图浏览：APOD API集成、日期导航、高清下载、收藏管理' },
  { id: 'color-name', name: 'ColorName 颜色命名', icon: <PaletteIcon />, component: 'ColorName', category: 'development', defaultWidth: 1100, defaultHeight: 780, minWidth: 800, minHeight: 600, resizable: true, multiple: false,  description: 'HTML颜色大全：148种命名颜色、搜索筛选、HEX/RGB/HSL转换、WCAG对比度检查' },
  { id: 'font-pairing', name: 'FontPairing 字体配对', icon: <TypeIcon />, component: 'FontPairing', category: 'development', defaultWidth: 1100, defaultHeight: 780, minWidth: 800, minHeight: 600, resizable: true, multiple: false,  description: 'Google Fonts配对方案：15套精选配对、实时预览、代码复制、场景推荐' },
  { id: 'code-snippet-playground', name: '代码片段游乐场', icon: <CodeSnippetsIcon />, component: 'CodeSnippetPlayground', category: 'development', defaultWidth: 1100, defaultHeight: 780, minWidth: 800, minHeight: 600, resizable: true, multiple: false,  description: '代码片段游乐场：JS/TS/Python/CSS/HTML预置片段、搜索筛选、收藏管理、语法高亮' },
  { id: 'daily-challenge', name: 'DailyChallenge 每日挑战', icon: <ActivityIcon />, component: 'DailyChallenge', category: 'development', defaultWidth: 900, defaultHeight: 700, minWidth: 700, minHeight: 500, resizable: true, multiple: false,  description: '每日编程挑战：12道预设题目、三级难度、计时统计、进度保存、解决方案提示' },
  // === v67 创新应用套件 — OnlineToolkitPro 在线工具箱 ===
  { id: 'online-toolkit-pro', name: '在线工具箱 Pro', icon: <WrenchIcon />, component: 'OnlineToolkitPro', category: 'utilities', defaultWidth: 1280, defaultHeight: 860, minWidth: 960, minHeight: 640, resizable: true, multiple: false,  description: '集成8大实用工具的在线工具箱：天气查询、实时汇率、新闻聚合、GitHub热门、二维码生成、多语言翻译、哈希计算、URL短链' },
  // v96 创新功能 — 每日一言、进制转换器、随机工具集
  { id: 'daily-quote', name: '每日一言', icon: <SparklesIcon />, component: 'DailyQuote', category: 'utilities', defaultWidth: 800, defaultHeight: 700, minWidth: 600, minHeight: 500, resizable: true, multiple: false, isNew: true, description: '每日经典名言：真实API获取、6大分类、收藏管理、中文翻译、一键复制' },
  { id: 'number-base-converter', name: '进制转换器', icon: <HashIcon />, component: 'NumberBaseConverter', category: 'development', defaultWidth: 900, defaultHeight: 700, minWidth: 700, minHeight: 500, resizable: true, multiple: false, isNew: true, description: '多进制实时互转：2-36进制支持、整数/浮点数、BigInt大数、转换步骤展示、历史记录' },
  { id: 'random-tools', name: '随机工具集', icon: <DiceIcon />, component: 'RandomTools', category: 'utilities', defaultWidth: 900, defaultHeight: 720, minWidth: 700, minHeight: 520, resizable: true, multiple: false, isNew: true, description: '7合1随机工具：密码生成、随机数、UUID、随机选择、随机排序、骰子、Luhn验证' },
  // === v68 创新应用 — DevProductivitySuite 开发者生产力工具箱 ===
  { id: 'dev-productivity-suite', name: '开发者生产力工具箱 Pro', icon: <Code2Icon />, component: 'DevProductivitySuite', category: 'development', defaultWidth: 1280, defaultHeight: 860, minWidth: 960, minHeight: 640, resizable: true, multiple: false,  description: '一站式开发者工具箱：代码片段管理、正则测试、时间戳转换、JSON工具、哈希生成、URL编解码，支持数据持久化与主题切换' },
  // === v69 创新应用套件 ===
  { id: 'quick-share', name: 'QuickShare 快速分享', icon: <ShareIcon />, component: 'QuickShare', category: 'utilities', defaultWidth: 720, defaultHeight: 620, minWidth: 620, minHeight: 520, resizable: true, multiple: false,  description: '文本/文件/图片快速分享：拖拽上传、本地存储、分享链接、二维码生成、Web Share API集成、一键下载' },
  { id: 'regex-master', name: 'RegexMaster 正则大师', icon: <SearchIcon />, component: 'RegexMaster', category: 'development', defaultWidth: 1280, defaultHeight: 800, minWidth: 980, minHeight: 640, resizable: true, multiple: false,  description: '正则表达式在线测试与学习：12+预设模板、实时高亮匹配、标志位开关、保存管理、语法快速参考' },
  // === v70 创新应用套件 — DevBox + BrowserInfo + APILab ===
  { id: 'devbox', name: 'DevBox 开发者工具箱', icon: <WrenchIcon />, component: 'DevBox', category: 'development', defaultWidth: 1280, defaultHeight: 860, minWidth: 960, minHeight: 640, resizable: true, multiple: false,  description: '一站式开发者工具箱：Base64/URL编解码、JSON格式化、哈希生成、UUID/密码生成、时间戳转换、颜色工具、正则测试、JWT解析、UA分析、Cron表达式' },
  { id: 'browser-info', name: '浏览器信息面板', icon: <InfoIcon />, component: 'BrowserInfo', category: 'system', defaultWidth: 1200, defaultHeight: 820, minWidth: 900, minHeight: 620, resizable: true, multiple: false,  description: '全面的浏览器与系统环境检测：浏览器详情、设备信息、系统配置、功能支持检测、网络状态分析，支持导出报告' },
  { id: 'api-lab', name: 'API Lab 实验室', icon: <ApiLabIcon />, component: 'APILab', category: 'development', defaultWidth: 1280, defaultHeight: 860, minWidth: 960, minHeight: 640, resizable: true, multiple: false,  description: '真实公开API探索实验室：天气/汇率/加密货币/国家信息/NASA天文图/HackerNews等12+API集成，支持参数编辑和请求历史' },
  // === v71 创新应用套件 ===
  { id: 'system-backup', name: '系统备份与恢复', icon: <BackupIcon />, component: 'SystemBackup', category: 'system', defaultWidth: 1100, defaultHeight: 780, minWidth: 800, minHeight: 550, resizable: true, multiple: false,  description: '系统备份与恢复：导出/导入完整系统状态、备份历史管理、选择性备份、一键重置，数据安全有保障' },

  // === v71 创新应用套件 — AI 桌面助手 ===
  { id: 'ai-desktop-assistant', name: 'AI 桌面助手', icon: <SparklesIcon />, component: 'AIDesktopAssistant', category: 'utilities', defaultWidth: 500, defaultHeight: 700, minWidth: 400, minHeight: 550, resizable: true, multiple: false,  description: 'AI 驱动的桌面助手：自然语言打开应用、天气查询、文本翻译、股票行情、笑话生成、每日名言、Hacker News 热门、颜色转换、UUID 生成、系统信息查询' },
  { id: 'developer-toolkit-pro', name: '开发者工具箱 Pro', icon: <WrenchIcon />, component: 'DeveloperToolkitPro', category: 'development', defaultWidth: 1100, defaultHeight: 750, minWidth: 800, minHeight: 600, resizable: true, multiple: false,  description: '集成12+实用开发工具：JSON处理、编解码、哈希生成、时间戳转换、颜色工具、正则测试、JWT解码、Cron解析' },
  // === v73 新增创新应用套件 ===
  { id: 'content-studio', name: 'AI 内容创作工作室', icon: <SparklesIcon />, component: 'ContentStudio', category: 'utilities', defaultWidth: 1280, defaultHeight: 860, minWidth: 960, minHeight: 640, resizable: true, multiple: false,  description: 'AI驱动的内容创作平台：文章生成、文本摘要、润色改写、标题生成、智能翻译、标签提取六大功能，基于Pollinations.ai API' },
  { id: 'system-resource-dashboard', name: '系统资源监控', icon: <ActivityIcon />, component: 'SystemResourceDashboard', category: 'system', defaultWidth: 1280, defaultHeight: 860, minWidth: 960, minHeight: 640, resizable: true, multiple: false,  description: '实时系统资源监控仪表盘：CPU/内存/网络/FPS/存储/浏览器信息实时监测，历史趋势可视化，智能性能警告' },
  { id: 'web-performance-tester-pro', name: '网页性能测试 Pro', icon: <svg viewBox="0 0 24 24" width="18" height="18" stroke="currentColor" strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round"><path d="M12 14l4-4"/><path d="M3.34 19a10 10 0 1 1 17.32 0"/></svg>, component: 'WebPerformanceTesterPro', category: 'development', defaultWidth: 1280, defaultHeight: 860, minWidth: 960, minHeight: 640, resizable: true, multiple: false,  description: '专业网页性能测试工具：TTFB/加载时间/资源统计/性能评分/优化建议/报告导出，支持测试历史记录和本地存储' },
  // === v74 新增创新应用套件 ===
  { id: 'ai-poetry-generator', name: 'AI 诗歌生成器', icon: <PoetryIcon />, component: 'AIPoetryGenerator', category: 'utilities', defaultWidth: 800, defaultHeight: 900, minWidth: 700, minHeight: 700, resizable: true, multiple: false,  description: 'AI 驱动的诗歌创作工具：8种诗歌风格（唐诗/宋词/现代诗/俳句/十四行诗等）、8种情感基调、历史记录、收藏管理、本地持久化，基于Pollinations AI API' },
  { id: 'ai-story-writer', name: 'AI 故事创作工坊', icon: <BookmarkIcon />, component: 'AIStoryWriter', category: 'multimedia', defaultWidth: 1000, defaultHeight: 850, minWidth: 800, minHeight: 650, resizable: true, multiple: false,  description: 'AI 故事创作助手：多体裁支持（奇幻/科幻/悬疑/ romance/寓言）、角色设定、情节生成、续写模式、多章节管理、风格调整，支持导出与本地收藏' },
  { id: 'crypto-portfolio-tracker', name: '加密投资组合追踪', icon: <TrendingUpIcon />, component: 'CryptoPortfolioTracker', category: 'internet', defaultWidth: 1280, defaultHeight: 860, minWidth: 960, minHeight: 640, resizable: true, multiple: false,  description: '个人加密货币投资组合管理：多资产持仓录入、实时市值计算、总价值/盈亏/24h浮动、资产配置饼图、历史趋势、基于CoinGecko API' },
  // === v75 新增创新应用套件 ===
  { id: 'cross-device-sync', name: '跨设备同步', icon: <ShareIcon />, component: 'CrossDeviceSync', category: 'utilities', defaultWidth: 1000, defaultHeight: 750, minWidth: 800, minHeight: 600, resizable: true, multiple: false,  description: '跨标签页/窗口实时同步工具：基于BroadcastChannel API实现多设备消息传递、智能内容类型识别、连接状态可视化、同步历史记录管理' },
  { id: 'live-data-pipeline', name: '实时数据流', icon: <ActivityIcon />, component: 'LiveDataPipeline', category: 'development', defaultWidth: 1280, defaultHeight: 860, minWidth: 960, minHeight: 640, resizable: true, multiple: false,  description: '实时数据流处理与可视化：多种数据模式生成、Canvas高性能折线图、实时统计分析、数据录制回放、CSV导出、Web Audio声音警报' },
  // v76 创新功能 — 世界时钟 & HTTP状态码工具
  { id: 'world-clock', name: '世界时钟', icon: <svg viewBox="0 0 24 24" width="18" height="18" stroke="currentColor" strokeWidth="2" fill="none"><circle cx="12" cy="12" r="10"/><path d="M2 12h20M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/></svg>, component: 'WorldClock', category: 'utilities', defaultWidth: 1200, defaultHeight: 800, minWidth: 900, minHeight: 600, resizable: true, multiple: false,  description: '多城市实时时钟：北京/东京/纽约/伦敦等6大时钟、自定义时区添加、12/24小时制切换、拖拽排序、玻璃拟态设计、数据持久化' },
  { id: 'http-status-explorer', name: 'HTTP状态码参考', icon: <ApiLabIcon />, component: 'HttpStatusExplorer', category: 'development', defaultWidth: 1200, defaultHeight: 850, minWidth: 900, minHeight: 650, resizable: true, multiple: false,  description: '完整HTTP状态码参考：75个状态码详细说明、分类筛选搜索、收藏功能、实时HTTP测试（支持GET/POST/PUT等方法）、响应时间和头信息展示' },
  // v77 创新功能 — InstantTools 即时开发者工具箱 & DataVizWorkbench
  { id: 'instant-tools', name: 'InstantTools 即时工具箱', icon: <WrenchIcon />, component: 'InstantTools', category: 'development', defaultWidth: 1280, defaultHeight: 860, minWidth: 960, minHeight: 640, resizable: true, multiple: false,  description: '开发者即时工具箱：文本对比、进制转换、URL编解码、Base64编解码、时间戳转换、哈希生成、UUID生成、正则测试、Cron解析、JWT解码，10大工具一站式服务' },
  { id: 'dataviz-workbench', name: 'DataViz 数据可视化', icon: <BarChartIcon />, component: 'DataVizWorkbench', category: 'development', defaultWidth: 1280, defaultHeight: 860, minWidth: 960, minHeight: 640, resizable: true, multiple: false,  description: '数据可视化工作台：支持手动编辑/CSV导入/预设数据三种模式，6种图表类型（柱状/折线/饼图/面积/雷达/散点），SVG导出，实时统计分析' },
  { id: 'daily-agenda', name: '每日议程 DailyAgenda', icon: <CalendarIcon />, component: 'DailyAgenda', category: 'utilities', defaultWidth: 1100, defaultHeight: 780, minWidth: 800, minHeight: 600, resizable: true, multiple: false,  description: '专业日程规划器：日视图时间块、事件拖拽调整、分类色彩编码、周视图切换、LocalStorage持久化' },
  { id: 'markdown-quick-note', name: 'Markdown 速记', icon: <NoteIcon />, component: 'MarkdownQuickNote', category: 'office', defaultWidth: 1000, defaultHeight: 700, minWidth: 750, minHeight: 500, resizable: true, multiple: false,  description: '快速Markdown笔记：分屏编辑预览、语法高亮、实时渲染、字数统计、导出MD文件、LocalStorage持久化' },
  // === v78 新增 LiveDataCenter 实时数据中心 ===
  { id: 'live-data-center', name: '实时数据中心', icon: <ZapIcon />, component: 'LiveDataCenter', category: 'internet', defaultWidth: 1280, defaultHeight: 880, minWidth: 960, minHeight: 640, resizable: true, multiple: false,  description: '一站式实时数据聚合中心：全球天气、加密货币行情、实时汇率、科技新闻、股票指数、世界时钟，6大公开API集成，自动刷新' },
  // v80 创新功能 — AI文档分析器 & 智能代码重构
  { id: 'ai-doc-analyzer', name: 'AI文档分析器', icon: <SparklesIcon />, component: 'AIDocAnalyzer', category: 'development', defaultWidth: 1280, defaultHeight: 860, minWidth: 900, minHeight: 640, resizable: true, multiple: false,  description: 'AI驱动的文档分析工具：代码复杂度评估、文档质量检查、重复代码检测、注释覆盖率分析、一键生成改进建议' },
  { id: 'smart-refactor', name: '智能重构助手', icon: <Code2Icon />, component: 'SmartRefactor', category: 'development', defaultWidth: 1200, defaultHeight: 820, minWidth: 900, minHeight: 600, resizable: true, multiple: false,  description: '智能代码重构工具：命名规范检查、函数拆分建议、依赖关系分析、代码迁移建议、批量重构预览' },
  { id: 'api-design-studio', name: 'API设计工作室', icon: <ApiLabIcon />, component: 'APIDesignStudio', category: 'development', defaultWidth: 1280, defaultHeight: 860, minWidth: 900, minHeight: 640, resizable: true, multiple: false,  description: 'RESTful API设计与文档工作室：端点设计、参数校验、响应结构、OpenAPI规范生成、接口模拟测试' },
  { id: 'git-assistant', name: 'Git助手', icon: <Code2Icon />, component: 'GitAssistant', category: 'development', defaultWidth: 1100, defaultHeight: 800, minWidth: 800, minHeight: 600, resizable: true, multiple: false,  description: 'Git版本控制助手：命令速查、交互教程、工作流可视化、命令生成器、提交规范检查' },
  { id: 'database-designer', name: '数据库设计器', icon: <Code2Icon />, component: 'DatabaseDesigner', category: 'development', defaultWidth: 1280, defaultHeight: 860, minWidth: 900, minHeight: 640, resizable: true, multiple: false,  description: '可视化数据库表结构设计器：字段类型选择、主键外键索引设置、SQL DDL生成、ER图可视化' },
  // === v81 创新应用套件 — FinanceDashboard / AICodeReviewPro / NetworkSpeedTestPro / ProductivityDashboard ===
  { id: 'finance-dashboard', name: '个人财务仪表盘', icon: <TrendingUpIcon />, component: 'FinanceDashboard', category: 'internet', defaultWidth: 1280, defaultHeight: 880, minWidth: 960, minHeight: 640, resizable: true, multiple: false,  description: '实时加密货币行情（CoinGecko API）、实时汇率查询（Frankfurter API）、投资组合管理（本地存储）、价格走势图（Canvas绘制）、玻璃拟态深色UI设计' },
  { id: 'network-speed-test-pro', name: '网络速度测试 Pro', icon: <ActivityIcon />, component: 'NetworkSpeedTestPro', category: 'networking', defaultWidth: 1280, defaultHeight: 860, minWidth: 960, minHeight: 640, resizable: true, multiple: false,  description: '真实下载速度测量（Hetzner测速服务器）、真实上传速度测量（httpbin.org）、延迟Ping测试、抖动计算、测试历史图表、网络评级（5G/4G/3G等）、结果分享' },
  { id: 'productivity-dashboard', name: '生产力仪表盘', icon: <ZapIcon />, component: 'ProductivityDashboard', category: 'utilities', defaultWidth: 1280, defaultHeight: 880, minWidth: 960, minHeight: 640, resizable: true, multiple: false,  description: 'Pomodor计时器、任务追踪、每日统计、连续打卡可视化、实时时钟、天气小组件（Open-Meteo API）、每日名言（ZenQuotes API）、本地存储持久化' },
  // 创新应用套件 — AI壁纸工作室 & 快速翻译
  { id: 'ai-wallpaper-studio', name: 'AI壁纸工作室', icon: <ImageIcon />, component: 'AIWallpaperStudio', category: 'graphics', defaultWidth: 1280, defaultHeight: 860, minWidth: 900, minHeight: 640, resizable: true, multiple: false,  description: 'Pollinations AI 壁纸生成器：6大分类（自然/抽象/赛博朋克/极简/宇宙/奇幻）、4种分辨率（HD/FHD/QHD/4K）、玻璃拟态Canvas效果、画廊收藏、Ctrl+S快捷键保存' },
  { id: 'quick-translate', name: '快速翻译', icon: <LanguagesIcon />, component: 'QuickTranslate', category: 'utilities', defaultWidth: 1200, defaultHeight: 800, minWidth: 880, minHeight: 600, resizable: true, multiple: false,  description: 'MyMemory免费翻译API：100+语言互译、自动检测源语言、翻译历史持久化、常用短语收藏、Web Speech API语音朗读、文本长度统计、玻璃拟态深色UI' },
  { id: 'ai-craft', name: 'AI 创作工坊', icon: <SparklesIcon />, component: 'AICraft', category: 'utilities', defaultWidth: 1300, defaultHeight: 860, minWidth: 960, minHeight: 660, resizable: true, multiple: false,  description: 'Pollinations AI 文本生成：10大写作场景（文章/邮件/故事/诗歌/演讲稿等）、6种语言风格、创意程度调节、流式实时输出、历史记录与模板保存' },
  { id: 'code-vault', name: 'CodeVault 代码保险库', icon: <CodeIcon />, component: 'CodeVault', category: 'development', defaultWidth: 1300, defaultHeight: 860, minWidth: 960, minHeight: 660, resizable: true, multiple: false,  description: '现代化代码片段管理器：20种语言支持、分类标签、全文搜索、收藏管理、导入导出JSON、使用统计、玻璃拟态设计' },
  // === v82 创新应用套件 ===
  { id: 'css-animation-studio', name: 'CSS动画工作室', icon: <PaletteIcon />, component: 'CssAnimationStudio', category: 'development', defaultWidth: 1100, defaultHeight: 800, minWidth: 850, minHeight: 600, resizable: true, multiple: false,  description: '可视化CSS动画生成器：10+动画预设、duration/timing-function/iteration-count参数配置、实时预览、一键生成CSS代码' },
  { id: 'markPoster', name: 'MarkPoster 海报生成器', icon: <PresentationIcon />, component: 'MarkPoster', category: 'office', defaultWidth: 1200, defaultHeight: 820, minWidth: 900, minHeight: 640, resizable: true, multiple: false,  description: 'Markdown转精美海报：6种模板主题、封面图URL、标签元数据、实时预览、一键导出PNG、分享链接' },
  { id: 'web-request-lab', name: 'Web请求实验室', icon: <ApiLabIcon />, component: 'WebRequestLab', category: 'development', defaultWidth: 1280, defaultHeight: 860, minWidth: 960, minHeight: 640, resizable: true, multiple: false,  description: '真实HTTP请求调试器：支持GET/POST/PUT/DELETE/PATCH、Headers与Body编辑、响应预览、请求历史、代码生成' },
  { id: 'code-polisher', name: '代码抛光工坊', icon: <Code2Icon />, component: 'CodePolisher', category: 'development', defaultWidth: 1180, defaultHeight: 820, minWidth: 900, minHeight: 640, resizable: true, multiple: false,  description: '代码格式化与压缩：JavaScript/JSON/HTML/CSS/SQL，缩进风格切换、一键复制、体积对比、Gzip压缩率展示' },
  { id: 'webdb', name: 'WebDB 数据库', icon: <DatabaseIcon />, component: 'WebDB', category: 'development', defaultWidth: 1280, defaultHeight: 860, minWidth: 960, minHeight: 640, resizable: true, multiple: false,  description: '浏览器原生 IndexedDB 管理工具：创建数据库与表、CRUD 操作、JSON 导入导出、数据网格排序过滤、查询构建器' },
  // === v82.1 创新应用套件 ===
  { id: 'code-refactor-ai', name: 'AI 代码重构智能体', icon: <SparklesIcon />, component: 'CodeRefactorAI', category: 'development', defaultWidth: 1300, defaultHeight: 880, minWidth: 960, minHeight: 640, resizable: true, multiple: false,  description: 'AI 驱动的代码重构与优化：多语言支持（JS/TS/Python）、代码质量五维评分、重构建议 Before/After 对比、性能优化分析、Markdown 报告导出' },
  { id: 'linux-command-lab', name: 'Linux命令实验室', icon: <TerminalIcon />, component: 'LinuxCommandLab', category: 'development', defaultWidth: 1280, defaultHeight: 860, minWidth: 960, minHeight: 640, resizable: true, multiple: false,  description: '交互式 Linux 命令模拟环境：30+ 常用命令、虚拟文件系统、命令历史与补全、终端风格界面、文件操作模拟' },
  { id: 'smart-shell', name: 'SmartShell 智能Shell', icon: <SparklesIcon />, component: 'SmartShell', category: 'development', defaultWidth: 1200, defaultHeight: 820, minWidth: 900, minHeight: 640, resizable: true, multiple: false,  description: '自然语言转Shell命令智能翻译器：100+命令模式、13个分类过滤、命令收藏、历史记录、终端风格玻璃拟态UI' },
  { id: 'algorithm-visualizer', name: '算法可视化', icon: <BarChart3Icon />, component: 'AlgorithmVisualizer', category: 'development', defaultWidth: 1280, defaultHeight: 880, minWidth: 960, minHeight: 640, resizable: true, multiple: false,  description: '交互式算法可视化工具：排序/搜索/图遍历/路径查找/数据结构，逐步执行动画、伪代码高亮、统计分析' },
  { id: 'git-visualizer', name: 'Git 可视化', icon: <Code2Icon />, component: 'GitVisualizer', category: 'development', defaultWidth: 1280, defaultHeight: 860, minWidth: 900, minHeight: 640, resizable: true, multiple: false,  description: '交互式 Git 提交历史可视化：SVG 提交图、分支时间线、提交详情查看器、模拟仓库生成、SVG/PNG 导出' },
  // === v83 创新应用 — CryptoSimulator 加密货币交易模拟器 ===
  { id: 'crypto-simulator', name: '加密交易模拟器', icon: <TrendingUpIcon />, component: 'CryptoSimulator', category: 'internet', defaultWidth: 1280, defaultHeight: 880, minWidth: 960, minHeight: 640, resizable: true, multiple: false,  description: '真实加密货币交易模拟器：CoinGecko实时行情、$100,000虚拟资金、实时买卖执行、持仓盈亏追踪、交易历史、价格图表标注、15种主流加密货币支持' },
  // === v83 新增创新应用 — PopularDashboard 实时数据聚合仪表板 ===
  { id: 'popular-dashboard', name: '实时数据中心', icon: <ActivityIcon />, component: 'PopularDashboard', category: 'utilities', defaultWidth: 1280, defaultHeight: 880, minWidth: 960, minHeight: 640, resizable: true, multiple: false,  description: '多源实时数据聚合仪表板：天气+加密货币+新闻+汇率+系统性能一站式监控，Open-Meteo/CoinGecko/NewsAPI/Exchangerate 真实API集成' },
  // === v83 新增创新应用 — PollinationsStudio AI图像生成工作室 ===
  { id: 'pollinations-studio', name: 'AI图像工作室', icon: <SparklesIcon />, component: 'PollinationsStudio', category: 'multimedia', defaultWidth: 1280, defaultHeight: 880, minWidth: 960, minHeight: 640, resizable: true, multiple: false,  description: '零配置AI图像生成器：Pollinations.ai公开免费API、10种艺术风格预设、多种画布比例、历史记录收藏、提示词增强、下载导出' },
  // === v84 新增创新应用 — QuickTools 快捷工具箱 ===
  { id: 'quick-tools', name: '快捷工具箱', icon: <WrenchIcon />, component: 'QuickTools', category: 'utilities', defaultWidth: 1100, defaultHeight: 780, minWidth: 880, minHeight: 580, resizable: true, multiple: false,  description: '10合1在线工具箱：密码生成器、UUID生成器、时间戳转换、URL编解码、Base64编解码、Hash计算器、JSON格式化、颜色选择器、单位换算、文本统计' },
  // === v85 新增创新应用 — ApiLabPro API测试实验室 ===
  { id: 'api-lab-pro', name: 'API测试实验室', icon: <ApiLabIcon />, component: 'ApiLabPro', category: 'development', defaultWidth: 1280, defaultHeight: 850, minWidth: 980, minHeight: 650, resizable: true, multiple: false,  description: '10+合规公开API测试实验室：天气预报、汇率转换、加密货币、科技新闻、励志名言、编程笑话、维基搜索、IP查询、国家信息、GitHub趋势，零配置实时数据' },
  // === v85 新增创新应用 — ImageCompressor 图像压缩工具 ===
  { id: 'image-compressor', name: '图像压缩工具', icon: <ImageIcon />, component: 'ImageCompressor', category: 'utilities', defaultWidth: 1280, defaultHeight: 850, minWidth: 980, minHeight: 650, resizable: true, multiple: false,  description: '浏览器内图片压缩与处理：JPEG/PNG/WebP/AVIF格式转换、质量调整、尺寸缩放、黑白/复古/模糊/亮度/对比度/饱和度滤镜、批量处理、节省空间统计' },
  // === v86 新增创新应用 ===
  { id: 'ai-doc-analyzer-pro', name: 'AI文档智能分析器 Pro', icon: <SparklesIcon />, component: 'AIDocAnalyzerPro', category: 'utilities', defaultWidth: 1280, defaultHeight: 880, minWidth: 960, minHeight: 640, resizable: true, multiple: false,  description: 'AI驱动的文本分析工具：智能摘要、关键要点提取、情感分析、实体识别、多语言翻译、文本改写润色，基于Pollinations AI公开API' },
  { id: 'global-economic-dashboard', name: '全球经济指标仪表板', icon: <TrendingUpIcon />, component: 'GlobalEconomicDashboard', category: 'internet', defaultWidth: 1320, defaultHeight: 900, minWidth: 1000, minHeight: 680, resizable: true, multiple: false,  description: '实时全球经济数据：汇率(Frankfurter API)、加密货币(CoinGecko API)、股指、大宗商品、经济指标、市场热力图，自动刷新，专业金融UI' },
  { id: 'color-converter', name: '色彩转换', icon: <PaletteIcon />, component: 'ColorConverter', category: 'development', defaultWidth: 520, defaultHeight: 580, minWidth: 400, minHeight: 400, resizable: true, multiple: false,  description: '开发者色彩工具：颜色选择器、HEX/RGB/HSL/HSV/CMYK互转、色彩和谐建议、11级色阶生成、CSS变量生成、历史记录持久化' },
  { id: 'http-status', name: 'HTTP 状态码', icon: <ListTodoIcon />, component: 'HttpStatusCodes', category: 'development', defaultWidth: 600, defaultHeight: 500, minWidth: 400, minHeight: 350, resizable: true, multiple: false,  description: 'HTTP 状态码参考工具：1xx-5xx 全部状态码、搜索过滤、分类标签、一键复制、cURL 命令生成、HTTP 方法速查' },
  // 系统监控仪表盘
  { id: 'system-monitor', name: '系统监控', icon: <ActivityIcon />, component: 'SystemMonitor', category: 'system', defaultWidth: 700, defaultHeight: 500, minWidth: 500, minHeight: 400, resizable: true, multiple: false,  description: '实时系统监控仪表盘：CPU/内存/磁盘/网络可视化、进程列表、自动刷新开关、系统运行时间、电池状态、主题感知' },
  { id: 'qr-generator', name: '二维码生成器', icon: <GridIcon />, component: 'QRCodeGenerator', category: 'utilities', defaultWidth: 500, defaultHeight: 520, minWidth: 380, minHeight: 420, resizable: true, multiple: false,  description: '符合ISO/IEC 18004标准的QR码生成器：GF(256)有限域Reed-Solomon纠错、8种掩码模式择优、版本1-10自适应、颜色自定义、PNG下载' },
  // 语音备忘录 — SpeechMemo
  { id: 'speech-memo', name: '语音备忘录', icon: <VoiceIcon />, component: 'SpeechMemo', category: 'utilities', defaultWidth: 500, defaultHeight: 520, minWidth: 400, minHeight: 400, resizable: true, multiple: false,  description: '语音备忘录：文字转语音（SpeechSynthesis）+ 语音录音转写（SpeechRecognition）+ 备忘录管理 + localStorage持久化' },
  { id: 'unit-converter', name: '单位换算', icon: <ListTodoIcon />, component: 'UnitConverter', category: 'utilities', defaultWidth: 480, defaultHeight: 560, minWidth: 380, minHeight: 420, resizable: true, multiple: false,  description: '综合单位换算工具：长度/重量/温度/体积/面积/时间/速度/数据存储/货币9大类，实时汇率API，本地历史记录' },
  { id: 'dev-toolkit', name: '开发者工具箱', icon: <WrenchIcon />, component: 'DevToolkit', category: 'development', defaultWidth: 750, defaultHeight: 580, minWidth: 500, minHeight: 400, resizable: true, multiple: false,  description: '10合1开发者工具箱：JSON格式化、URL编解码、Base64编解码、正则测试、MD5/SHA哈希生成、时间戳转换、UUID生成、JWT解码、HEX/RGB颜色转换、CSS语法验证' },
  // v87 新增：安全与实用工具中心
  { id: 'security-center', name: '安全中心', icon: <LockIcon />, component: 'SecurityCenter', category: 'utilities', defaultWidth: 760, defaultHeight: 680, minWidth: 560, minHeight: 500, resizable: true, multiple: false,  description: '安全与实用工具中心：密码泄露检查(HIBP k-anonymity)、强密码生成器(crypto API)、密码强度分析、URL缩短(is.gd API)、实时汇率转换(Frankfurter API)' },
  // === v88 创新应用套件 — LinuxCommandPlayground / SystemDiagnostics / APIDebugger ===
  { id: 'linux-command-playground', name: 'Linux命令实验场', icon: <TerminalIcon />, component: 'LinuxCommandPlayground', category: 'development', defaultWidth: 1280, defaultHeight: 860, minWidth: 960, minHeight: 640, resizable: true, multiple: false,  description: 'Linux命令学习与实验场：6大分类50+命令详解、实时命令模拟器、学习进度跟踪、常用命令速查表，中文界面' },
  { id: 'system-diagnostics', name: '系统诊断分析', icon: <ActivityIcon />, component: 'SystemDiagnostics', category: 'system', defaultWidth: 1280, defaultHeight: 880, minWidth: 960, minHeight: 640, resizable: true, multiple: false,  description: '深度系统诊断工具：CPU/内存/存储/网络/浏览器/安全/性能七维分析、真实浏览器API数据、仪表盘可视化、JSON报告导出' },
  { id: 'api-debugger', name: 'API调试器 Pro', icon: <ApiLabIcon />, component: 'APIDebugger', category: 'development', defaultWidth: 1280, defaultHeight: 860, minWidth: 960, minHeight: 640, resizable: true, multiple: false,  description: '专业HTTP调试工具：5种请求方法、Headers/Body管理、响应高亮查看、历史记录、10+常用API模板、代码生成(fetch/axios/curl)' },
  // === v89 创新应用套件 ===
  { id: 'md-html-generator', name: 'Markdown转HTML生成器', icon: <CodeIcon />, component: 'MarkdownToHTML', category: 'office', defaultWidth: 1280, defaultHeight: 860, minWidth: 960, minHeight: 640, resizable: true, multiple: false,  description: 'Markdown转独立HTML生成器：5种精美主题模板、实时预览、代码高亮、数学公式、Mermaid图表、导出完整HTML文件（带样式）' },
  { id: 'md-pdf-converter', name: 'Markdown转PDF', icon: <FileTextIcon />, component: 'MarkdownToPDF', category: 'office', defaultWidth: 1280, defaultHeight: 860, minWidth: 960, minHeight: 640, resizable: true, multiple: false,  description: 'Markdown转PDF实用工具：3种精美主题（经典/现代/极简）、代码高亮、实时预览、自定义纸张大小与边距、简历/报告/笔记模板、PDF与HTML双格式导出' },
  { id: 'browser-perf-analyzer', name: '浏览器性能分析器', icon: <ActivityIcon />, component: 'PerformanceMonitor', category: 'system', defaultWidth: 1200, defaultHeight: 780, minWidth: 900, minHeight: 600, resizable: true, multiple: false,  description: '实时浏览器性能深度分析：FPS监控、内存泄漏检测、渲染管线分析、长任务追踪、Layout/Style/Paint耗时、优化建议' },
  { id: 'scientific-calculator', name: '科学计算器', icon: <CalculatorIcon />, component: 'QuantumCalculator', category: 'utilities', defaultWidth: 480, defaultHeight: 620, minWidth: 380, minHeight: 520, resizable: true, multiple: false,  description: '功能完备的科学计算器：三角/对数/阶乘/矩阵/方程求解、历史记录、常量库、单位转换、编程模式（进制/位运算）' },
  { id: 'color-scheme-designer', name: '配色方案设计师', icon: <PaletteIcon />, component: 'ColorPaletteGenerator', category: 'graphics', defaultWidth: 1200, defaultHeight: 800, minWidth: 900, minHeight: 600, resizable: true, multiple: false, isNew: true, description: '专业配色方案设计工具：色轮Harmony、HSL/RGB/HEX、WCAG对比度检查、色盲模拟、Tailwind/VS Code主题导出、一键复制' },
  // === v90 创新应用套件 ===
  { id: 'ai-prompt-library', name: 'AI提示词库', icon: <SparklesIcon />, component: 'AIPromptLibrary', category: 'utilities', defaultWidth: 1280, defaultHeight: 860, minWidth: 960, minHeight: 640, resizable: true, multiple: false, isNew: true, description: '专业AI提示词管理工具：30+精选模板覆盖7大类别、变量系统、分类浏览搜索、收藏管理、JSON导入导出、玻璃拟态设计' },
  { id: 'collaboration-enhanced', name: '实时协作增强', icon: <UsersIcon />, component: 'CollaborationEnhanced', category: 'utilities', defaultWidth: 1280, defaultHeight: 860, minWidth: 960, minHeight: 640, resizable: true, multiple: false, isNew: true, description: '增强版实时协作平台：跨标签页白板绘制、协作代码编辑、实时笔记同步、房间系统、玻璃拟态UI' },
  { id: 'web-content-extractor', name: '网页内容提取器', icon: <GlobeIcon />, component: 'WebContentExtractor', category: 'development', defaultWidth: 1280, defaultHeight: 860, minWidth: 960, minHeight: 640, resizable: true, multiple: false, isNew: true, description: '网页元数据提取与内容分析：Open Graph检测、关键词密度分析、情感分析、智能摘要生成、历史记录管理' },
  { id: 'system-performance-analyzer', name: '系统性能分析器', icon: <ActivityIcon />, component: 'SystemPerformanceAnalyzer', category: 'system', defaultWidth: 1280, defaultHeight: 860, minWidth: 960, minHeight: 640, resizable: true, multiple: false, isNew: true, description: '深度浏览器性能分析：CPU/内存/渲染/网络/存储五维分析、Canvas实时图表、FPS监控、内存泄漏检测、性能评分' },
  // === v91 创新应用套件 — SmartCodeReview AI 代码审查与重构 ===
  { id: 'smart-code-review', name: 'SmartCodeReview AI代码审查', icon: <Code2Icon />, component: 'SmartCodeReview', category: 'development', defaultWidth: 1320, defaultHeight: 880, minWidth: 960, minHeight: 640, resizable: true, multiple: false, isNew: true, description: 'AI驱动的代码审查与重构工具：Pollinations AI真实代码分析、JS/TS/Python三语言支持、代码质量评分(0-100)、安全性/性能/风格检查、重构Before/After对比、批量分析、历史记录持久化、Markdown报告导出、玻璃拟态深色UI' },
  // === 创新应用 — RealTimeDataHub 实时多源数据聚合仪表板 ===
  { id: 'real-time-data-hub', name: '实时数据聚合中心', icon: <GlobeIcon />, component: 'RealTimeDataHub', category: 'internet', defaultWidth: 1320, defaultHeight: 880, minWidth: 960, minHeight: 640, resizable: true, multiple: false, isNew: true, description: '实时多源数据聚合仪表板：天气(Open-Meteo)+加密货币(CoinGecko)+汇率(Frankfurter)+科技新闻(Hacker News)+励志名言(ZenQuotes)五大数据源，卡片式布局、自动刷新、缓存优化、收藏功能、深色/浅色主题、玻璃拟态UI' },
  // === v92 创新应用 — PromptEngineer AI 提示词工程工具 ===
  { id: 'prompt-engineer', name: 'PromptEngineer 提示词工程', icon: <WandIcon />, component: 'PromptEngineer', category: 'development', defaultWidth: 1320, defaultHeight: 880, minWidth: 960, minHeight: 640, resizable: true, multiple: false, isNew: true, description: 'AI 提示词工程工具：25+预设场景模板、{{variable}}变量系统、Pollinations AI实时测试、历史记录与收藏、Markdown导出、玻璃拟态UI' },
  // === v93 创新应用套件 — RealHTTPClient & AITextAnalyzer ===
  { id: 'real-http-client', name: 'HTTP客户端 Pro', icon: <ApiLabIcon />, component: 'RealHTTPClient', category: 'development', defaultWidth: 1320, defaultHeight: 880, minWidth: 960, minHeight: 640, resizable: true, multiple: false, isNew: true, description: '专业HTTP客户端：7种请求方法、Headers/Body管理、响应时间/状态码展示、历史记录、收藏夹、快速模板、代码复制、取消请求' },
  { id: 'ai-text-analyzer', name: 'AI文本分析器', icon: <SparklesIcon />, component: 'AITextAnalyzer', category: 'utilities', defaultWidth: 1320, defaultHeight: 880, minWidth: 960, minHeight: 640, resizable: true, multiple: false, isNew: true, description: 'AI驱动的文本深度分析：字数统计、可读性评分、关键词提取、AI改进建议、中英文混合支持、高频词分析、阅读/演讲时间估算、多标签页导航' },
  // === v93.1 创新应用套件 ===
  { id: 'link-analyzer', name: 'URL链接分析器', icon: <Link2Icon />, component: 'LinkAnalyzer', category: 'networking', defaultWidth: 1100, defaultHeight: 780, minWidth: 850, minHeight: 600, resizable: true, multiple: false, isNew: true, description: 'URL深度分析工具：结构解析、参数提取、安全检查、批量分析' },
  { id: 'json-yaml-converter', name: 'JSON/YAML转换器', icon: <Code2Icon />, component: 'JsonToYamlConverter', category: 'development', defaultWidth: 1100, defaultHeight: 780, minWidth: 850, minHeight: 600, resizable: true, multiple: false, isNew: true, description: 'JSON与YAML双向转换器：实时预览、语法验证、一键复制' },
  { id: 'regex-tester-pro', name: '正则测试器 Pro', icon: <SearchIcon />, component: 'OnlineRegexTester', category: 'development', defaultWidth: 1100, defaultHeight: 780, minWidth: 850, minHeight: 600, resizable: true, multiple: false, isNew: true, description: '专业正则测试器：实时匹配、捕获组可视化、代码生成' },
  { id: 'api-load-tester', name: 'API负载测试器', icon: <ActivityIcon />, component: 'APILoadTester', category: 'development', defaultWidth: 1200, defaultHeight: 820, minWidth: 900, minHeight: 640, resizable: true, multiple: false, isNew: true, description: 'API性能负载测试：并发数配置、TPS统计、响应时间分布、性能评分' },
  { id: 'markdown-slides', name: 'Markdown转幻灯片', icon: <PresentationIcon />, component: 'MarkdownToSlides', category: 'office', defaultWidth: 1200, defaultHeight: 820, minWidth: 900, minHeight: 640, resizable: true, multiple: false, isNew: true, description: 'Markdown转幻灯片：实时编辑预览、多种动画主题、导出独立HTML' },
  { id: 'color-mixer-pro', name: '专业配色混合器', icon: <PaletteIcon />, component: 'ColorMixerPro', category: 'graphics', defaultWidth: 1100, defaultHeight: 780, minWidth: 850, minHeight: 600, resizable: true, multiple: false, isNew: true, description: '专业配色工具：颜色混合、和谐度分析、调色板生成、Tailwind导出' },
  { id: 'datetime-calculator', name: '日期时间计算器', icon: <ClockIcon />, component: 'DateTimeCalculator', category: 'utilities', defaultWidth: 1000, defaultHeight: 750, minWidth: 800, minHeight: 600, resizable: true, multiple: false, isNew: true, description: '日期时间计算：差值计算、工作日计算、时区转换、倒计时' },
  { id: 'batch-image-processor', name: '批量图片处理', icon: <ImageIcon />, component: 'BatchImageProcessor', category: 'graphics', defaultWidth: 1200, defaultHeight: 820, minWidth: 900, minHeight: 640, resizable: true, multiple: false, isNew: true, description: '批量图片处理：尺寸调整、格式转换、水印添加、滤镜批量应用' },
  { id: 'terminal-pro', name: '增强终端 Pro', icon: <TerminalIcon />, component: 'TerminalPro', category: 'system', defaultWidth: 1000, defaultHeight: 700, minWidth: 750, minHeight: 500, resizable: true, multiple: true, isNew: true, description: '增强版终端：多会话管理、语法高亮、主题切换、会话录制' },
  // === v94 创新应用 — 实时协作代码片段管理器 ===
  { id: 'snippet-share', name: '实时协作代码片段', icon: <CodeSnapIcon />, component: 'SnippetShare', category: 'development', defaultWidth: 1300, defaultHeight: 880, minWidth: 960, minHeight: 640, resizable: true, multiple: false, isNew: true, description: '实时协作代码片段管理器：17种语言支持、标签分类、收藏管理、导入导出JSON、分享链接、多标签页实时协作、玻璃拟态UI' },
  // === v94 创新应用 — AI 智能文本改写工具 ===
  { id: 'ai-rewriter', name: 'AI 文本改写工具', icon: <LanguagesIcon />, component: 'AIRewriter', category: 'utilities', defaultWidth: 1300, defaultHeight: 880, minWidth: 960, minHeight: 640, resizable: true, multiple: false, isNew: true, description: 'AI 驱动的文本改写工具：润色改进、简化易懂、扩展内容、生成摘要、中英互译、专业/创意风格转换、10+改写模式、历史记录与收藏、Pollinations AI 真实模型' },
  // === 创新应用 — 本地存储管理器 ===
  { id: 'local-storage-inspector', name: '本地存储管理器', icon: <DatabaseIcon />, component: 'LocalStorageInspector', category: 'utilities', defaultWidth: 1100, defaultHeight: 780, minWidth: 800, minHeight: 550, resizable: true, multiple: false, isNew: true, description: '浏览器本地存储分析与管理工具：LocalStorage/SessionStorage查看、编辑、删除、导出、搜索、类型检测、使用量统计、JSON预览' },
  // === 创新应用 — Cookie 管理器 ===
  { id: 'cookie-manager', name: 'Cookie 管理器', icon: <svg viewBox="0 0 24 24" width="18" height="18" stroke="currentColor" strokeWidth="2" fill="none"><circle cx="12" cy="12" r="10"/><circle cx="8.5" cy="10.5" r="0.5" fill="currentColor"/><circle cx="15.5" cy="9.5" r="0.5" fill="currentColor"/><circle cx="14.5" cy="14.5" r="0.5" fill="currentColor"/><circle cx="9.5" cy="15.5" r="0.5" fill="currentColor"/><path d="M12 2a10 10 0 0 1 10 10"/></svg>, component: 'CookieManager', category: 'utilities', defaultWidth: 1000, defaultHeight: 720, minWidth: 750, minHeight: 500, resizable: true, multiple: false, isNew: true, description: '浏览器Cookie管理工具：查看、添加、编辑、删除Cookie，搜索过滤，统计分析，导出JSON' },
  // === 创新应用 — WebSocket 客户端 ===
  { id: 'websocket-client', name: 'WebSocket 客户端', icon: <svg viewBox="0 0 24 24" width="18" height="18" stroke="currentColor" strokeWidth="2" fill="none"><path d="M4 12a16 16 0 0 1 16 0"/><path d="M7 14a11 11 0 0 1 10 0"/><path d="M10 16a6 6 0 0 1 4 0"/><circle cx="12" cy="18" r="1" fill="currentColor"/></svg>, component: 'WebSocketClient', category: 'development', defaultWidth: 1200, defaultHeight: 820, minWidth: 900, minHeight: 600, resizable: true, multiple: false, isNew: true, description: 'WebSocket连接测试工具：连接管理、消息收发、实时日志、JSON格式化、心跳检测、预设测试服务器' },
  // === v95 创新应用套件 — AI背景移除、网页转Markdown、智能主题生成器、代码截图生成器、智能RSS阅读器 ===
  { id: 'ai-background-remover', name: 'AI 背景移除', icon: <LayersIcon />, component: 'AIBackgroundRemover', category: 'multimedia', defaultWidth: 1280, defaultHeight: 860, minWidth: 960, minHeight: 640, resizable: true, multiple: false, isNew: true, description: '基于Pollinations AI的智能背景移除工具：支持批量处理、对比预览、历史记录，自动保留主体内容' },
  { id: 'web-to-markdown', name: '网页转 Markdown', icon: <FileTextIcon />, component: 'WebToMarkdown', category: 'utilities', defaultWidth: 1280, defaultHeight: 860, minWidth: 960, minHeight: 640, resizable: true, multiple: false, isNew: true, description: '网页内容转Markdown工具：自动提取正文、移除广告、语法高亮支持，支持多种导出格式' },
  { id: 'smart-theme-generator', name: '智能主题生成器', icon: <PaletteIcon />, component: 'SmartThemeGenerator', category: 'system', defaultWidth: 1280, defaultHeight: 860, minWidth: 960, minHeight: 640, resizable: true, multiple: false, isNew: true, description: 'AI驱动的主题生成工具：关键词生成配色、色彩和谐算法、WCAG对比度检查、CSS变量导出' },
  { id: 'code-screenshotter', name: '代码截图生成器', icon: <MonitorIcon />, component: 'CodeScreenshotter', category: 'development', defaultWidth: 1280, defaultHeight: 860, minWidth: 960, minHeight: 640, resizable: true, multiple: false, isNew: true, description: '代码美化截图工具：支持多种语言高亮、主题切换、窗口样式、PNG/SVG导出' },
  { id: 'smart-rss-reader', name: '智能 RSS 阅读器', icon: <Link2Icon />, component: 'SmartRSSReader', category: 'internet', defaultWidth: 1280, defaultHeight: 860, minWidth: 960, minHeight: 640, resizable: true, multiple: false, isNew: true, description: '功能完备的RSS阅读器：多源订阅、离线缓存、文章收藏、分类阅读、未读管理' },
  // === v97 创新应用套件 — 呼吸冥想、AI图像放大、网页提取 ===
  { id: 'zen-breath', name: 'ZenBreath 呼吸冥想', icon: <svg viewBox="0 0 24 24" width="18" height="18" stroke="currentColor" strokeWidth="2" fill="none"><circle cx="12" cy="12" r="10"/><circle cx="12" cy="12" r="6"/><circle cx="12" cy="12" r="2" fill="currentColor"/><path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83"/></svg>, component: 'ZenBreath', category: 'utilities', defaultWidth: 800, defaultHeight: 720, minWidth: 680, minHeight: 560, resizable: true, multiple: false, isNew: true, description: '正念呼吸冥想工具：4种呼吸模式（盒式/478/平静/活力）、4种主题配色、Web Audio音调反馈、练习统计、累计时长记录' },
  { id: 'ai-upscaler', name: 'AI 图像放大', icon: <svg viewBox="0 0 24 24" width="18" height="18" stroke="currentColor" strokeWidth="2" fill="none"><rect x="3" y="3" width="14" height="14" rx="2"/><path d="M7 7h4v4H7zM13 13h4v4h-4zM14 3v2M18 3h2M14 17v2M18 17h2"/></svg>, component: 'AIUpscaler', category: 'multimedia', defaultWidth: 1280, defaultHeight: 860, minWidth: 960, minHeight: 640, resizable: true, multiple: false, isNew: true, description: 'AI智能图像放大：Pollinations AI API、1.5-4倍放大、5种增强预设、滑动对比预览、历史记录、PNG下载' },
  { id: 'smart-web-clipper', name: '网页内容提取器', icon: <svg viewBox="0 0 24 24" width="18" height="18" stroke="currentColor" strokeWidth="2" fill="none"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/><path d="M8 10h8M8 14h5"/></svg>, component: 'SmartWebClipper', category: 'utilities', defaultWidth: 1280, defaultHeight: 860, minWidth: 960, minHeight: 640, resizable: true, multiple: false, isNew: true, description: '智能网页内容提取：URL抓取、正文提取、图片/链接/元数据分离、结构可视化、关键词搜索、Markdown导出、历史收藏' },
  // === v98 创新应用套件 — 系统分析器、快捷键定制中心 ===
  { id: 'system-analytics', name: '系统分析器', icon: <SystemAnalyticsIcon />, component: 'SystemAnalytics', category: 'system', defaultWidth: 1100, defaultHeight: 780, minWidth: 850, minHeight: 600, resizable: true, multiple: false, isNew: true, description: '应用使用统计追踪与数据分析：实时仪表盘、Top 10排行榜、24小时使用热力图、JSON/CSV数据导出' },
  { id: 'shortcut-customizer', name: '快捷键定制中心', icon: <ShortcutCustomizerIcon />, component: 'ShortcutCustomizer', category: 'system', defaultWidth: 980, defaultHeight: 720, minWidth: 780, minHeight: 560, resizable: true, multiple: false, isNew: true, description: '自定义系统快捷键绑定：冲突检测、实时按键捕获测试器、导入导出配置、恢复默认设置' },
  // === v99 创新应用套件 — 隐私与安全中心 ===
  { id: 'privacy-dashboard', name: '隐私与安全中心', icon: <ShieldIcon />, component: 'PrivacyDashboard', category: 'system', defaultWidth: 1000, defaultHeight: 800, minWidth: 800, minHeight: 600, resizable: true, multiple: false, isNew: true, description: '浏览器隐私状态实时监控：权限分析、存储检测、隐私评分、问题诊断与改进建议' },
  // === v100 创新应用 — GifExplorer GIF探索器 ===
  { id: 'gif-explorer', name: 'GIF 探索器', icon: <ImageIcon />, component: 'GifExplorer', category: 'multimedia', defaultWidth: 1200, defaultHeight: 800, minWidth: 900, minHeight: 600, resizable: true, multiple: false, isNew: true, description: 'GIF搜索和浏览应用：Giphy API真实搜索、热门趋势、分类浏览（反应/动物/运动/游戏等）、瀑布流布局、大图查看、分享与收藏、玻璃拟态UI' },
  // === v101 创新应用 — AI翻译大师 ===
  { id: 'ai-translator', name: 'AI 翻译大师', icon: <LanguagesIcon />, component: 'AITranslator', category: 'utilities', defaultWidth: 1280, defaultHeight: 860, minWidth: 960, minHeight: 640, resizable: true, multiple: false, isNew: true, description: 'AI驱动的多语言翻译工具：Pollinations AI真实翻译、14种语言互译、自动语言检测、常用短语预设、历史记录与收藏、Web Speech API语音朗读、玻璃拟态UI' },
  // === v102 创新应用 — DevToolkit Ultra 开发者工具箱 ===
  { id: 'devtoolkit-ultra', name: 'DevToolkit Ultra', icon: <WrenchIcon />, component: 'DevToolkitUltra', category: 'development', defaultWidth: 1200, defaultHeight: 860, minWidth: 900, minHeight: 650, resizable: true, multiple: false, isNew: true, description: '终极开发者工具箱：代码片段管理（收藏/标签/搜索/分页）、UUID/NanoID/CUID 生成器（批量生成）、JSON/SQL/HTML/CSS 格式化、代码模板库（JS/Python/TS/Bash）、数据导入导出' },
  // === v102 创新应用 — 实时汇率转换器 Pro ===
  { id: 'currency-converter-pro', name: '实时汇率 Pro', icon: <GlobeIcon />, component: 'CurrencyLive', category: 'utilities', defaultWidth: 1100, defaultHeight: 780, minWidth: 800, minHeight: 600, resizable: true, multiple: false, isNew: true, description: '实时汇率转换工具：Frankfurter API真实数据、150+货币支持、历史走势图、常用货币对、收藏夹、离线缓存' },
  // === v102 创新应用 — 开发者ASCII艺术生成器 ===
  { id: 'ascii-art-generator', name: 'ASCII 艺术生成器', icon: <SparklesIcon />, component: 'AsciiArtGenerator', category: 'multimedia', defaultWidth: 1000, defaultHeight: 750, minWidth: 700, minHeight: 550, resizable: true, multiple: false, isNew: true, description: 'ASCII艺术文本生成器：多种字体样式（标准/复古/科幻/装饰）、自定义宽度、实时预览、复制下载、装饰边框、banner生成' },
  // === v102 创新应用 — 网页元数据提取器 ===
  { id: 'web-meta-extractor', name: '网页元数据提取器', icon: <SearchIcon />, component: 'WebMetaExtractor', category: 'development', defaultWidth: 1100, defaultHeight: 780, minWidth: 800, minHeight: 600, resizable: true, multiple: false, isNew: true, description: '网页元数据提取器：输入URL即可获取页面标题、描述、Open Graph标签、Twitter卡片、favicon、语言等信息，支持复制JSON导出' },
  // === v102 创新应用 — 系统资源监控面板 ===
  { id: 'resource-monitor', name: '资源监控面板', icon: <ActivityIcon />, component: 'ResourceMonitor', category: 'system', defaultWidth: 900, defaultHeight: 700, minWidth: 700, minHeight: 500, resizable: true, multiple: false, isNew: true, description: '实时系统资源监控：内存使用、CPU估算、网络状态、存储用量、FPS帧率、页面性能指标、趋势图表、告警阈值设置' },
  { id: 'background-remover', name: 'AI 背景移除', icon: <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="1.8"><path d="M15 3h6v6"/><path d="M9 21H3v-6"/><path d="M21 3l-7 7"/><path d="M3 21l7-7"/></svg>, component: 'BackgroundRemover', category: 'graphics', defaultWidth: 1200, defaultHeight: 800, minWidth: 900, minHeight: 600, resizable: true, multiple: false, description: 'AI 背景移除工具：智能自动/颜色选择/边缘检测三种模式，支持手动擦除、撤销、对比预览，导出透明 PNG' },
  { id: 'code-snippet-manager', name: '代码片段管理器', icon: <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="1.8"><polyline points="16 18 22 12 16 6"/><polyline points="8 6 2 12 8 18"/></svg>, component: 'CodeSnippetManager', category: 'development', defaultWidth: 1200, defaultHeight: 800, minWidth: 900, minHeight: 600, resizable: true, multiple: false, description: '专业代码片段管理：增删改查、语法高亮、标签分类、收藏管理、导入导出、一键复制下载、多种视图模式' },
  // === v103 创新应用套件 ===
  { id: 'music-studio', name: '音乐工作室', icon: <MicIcon />, component: 'MusicStudio', category: 'multimedia', defaultWidth: 1280, defaultHeight: 800, minWidth: 960, minHeight: 640, resizable: true, multiple: false, isNew: true, description: 'Web音频音乐创作工作室：多轨步进编辑器、虚拟乐器（合成器/鼓组/贝斯）、音阶调性选择、WAV导出、本地项目保存、实时播放可视化' },
  { id: 'smart-home-dashboard', name: '智能家居中心', icon: <CloudIcon />, component: 'SmartHomeDashboard', category: 'utilities', defaultWidth: 1280, defaultHeight: 820, minWidth: 960, minHeight: 640, resizable: true, multiple: false, isNew: true, description: '智能家居控制仪表盘：20台模拟设备管理、7个房间组织、6种智能场景一键切换、能耗监控可视化、设备详情调节面板' },
  { id: 'language-lab', name: '语言实验室', icon: <LanguagesIcon />, component: 'LanguageLab', category: 'utilities', defaultWidth: 1200, defaultHeight: 820, minWidth: 900, minHeight: 640, resizable: true, multiple: false, isNew: true, description: '多语言学习实验室：6种语言课程、SRS间隔重复算法、3种交互题型、Web Speech API语音练习、XP进度系统、闪卡复习' },
  { id: 'ai-workspace', name: 'AI 智能工作台', icon: <SparklesIcon />, component: 'AIWorkspace', category: 'utilities', defaultWidth: 1280, defaultHeight: 860, minWidth: 960, minHeight: 640, resizable: true, multiple: false, isNew: true, description: 'AI驱动的智能工作台：AI对话助手、快速笔记总结、任务规划助手、代码片段生成与解释，四大核心模块一站式服务' },
  { id: 'voice-assistant', name: '语音助手', icon: <VoiceIcon />, component: 'VoiceAssistant', category: 'utilities', defaultWidth: 1100, defaultHeight: 820, minWidth: 850, minHeight: 600, resizable: true, multiple: false, isNew: true, description: '基于Web Speech API的语音助手：语音识别、语音合成、语音命令控制、12种语言支持、实时转写显示' },
  { id: 'realtime-whiteboard', name: '实时协作白板', icon: <WhiteboardIcon />, component: 'RealtimeWhiteboard', category: 'multimedia', defaultWidth: 1280, defaultHeight: 860, minWidth: 960, minHeight: 640, resizable: true, multiple: false, isNew: true, description: '实时协作白板应用：6种绘制工具、颜色与笔画调节、跨标签页实时协作、PNG导出、撤销重做、localStorage持久化' },
  { id: 'code-perf-analyzer', name: '代码性能分析器', icon: <ActivityIcon />, component: 'CodePerfAnalyzer', category: 'development', defaultWidth: 1280, defaultHeight: 860, minWidth: 960, minHeight: 640, resizable: true, multiple: false, isNew: true, description: 'JavaScript代码性能分析器：基准测试、执行时间统计、内存分析、FPS测试、代码对比、可视化图表、历史记录' },
  { id: 'ai-doc-generator', name: 'AI文档生成器', icon: <CodeIcon />, component: 'AIDocGenerator', category: 'development', defaultWidth: 1280, defaultHeight: 860, minWidth: 960, minHeight: 640, resizable: true, multiple: false, isNew: true, description: 'AI驱动的代码文档生成器：支持6种语言、5种注释风格、AI辅助生成、实时预览编辑、Markdown/HTML导出' },
  // === v106 创新应用套件 — 增强代码沙盒、API调试器、数据可视化 ===
  { id: 'enhanced-code-sandbox', name: '增强代码沙盒', icon: <Code2Icon />, component: 'EnhancedCodeSandbox', category: 'development', defaultWidth: 1280, defaultHeight: 860, minWidth: 960, minHeight: 640, resizable: true, multiple: false, isNew: true, description: '浏览器内真实代码执行环境：iframe沙盒隔离、实时控制台输出、4种代码模板、执行耗时统计、代码导出分享' },
  { id: 'enhanced-api-debugger', name: '增强API调试器', icon: <ApiLabIcon />, component: 'EnhancedApiDebugger', category: 'development', defaultWidth: 1280, defaultHeight: 860, minWidth: 960, minHeight: 640, resizable: true, multiple: false, isNew: true, description: '专业HTTP调试工具：支持7种请求方法、Headers/Body管理、响应时间/状态码展示、20+常用API模板、请求历史、JSON格式化、代码复制' },
  { id: 'dataviz-workbench-v2', name: '数据可视化工作台', icon: <BarChart3Icon />, component: 'DataVizWorkbench', category: 'development', defaultWidth: 1280, defaultHeight: 860, minWidth: 960, minHeight: 640, resizable: true, multiple: false, isNew: true, description: '纯SVG数据可视化工作台：4种图表类型（柱状/折线/面积/饼图）、自定义数据输入、4种示例数据集、统计摘要、SVG/PNG导出' },
  // === v111 创新应用套件 ===
  { id: 'ai-snippet-generator', name: 'AI代码片段生成器', icon: <CodeIcon />, component: 'AISnippetGenerator', category: 'development', defaultWidth: 1280, defaultHeight: 860, minWidth: 960, minHeight: 640, resizable: true, multiple: false, isNew: true, description: 'AI代码片段生成器：Pollinations AI真实代码生成、7种代码类型（函数/类/算法/API/测试/配置/SQL）、12种语言支持、创造性参数调节、复制下载、历史记录' },
  { id: 'ai-regex-generator', name: 'AI正则表达式生成器', icon: <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2"><path d="M18 16.98h-6c-.66 0-1.33-.14-2-.4"/><circle cx="6" cy="6" r="2"/><path d="M6 12v6"/><path d="M18 4l-6 6 6 6"/></svg>, component: 'AIRegexGenerator', category: 'development', defaultWidth: 1200, defaultHeight: 820, minWidth: 900, minHeight: 600, resizable: true, multiple: false, isNew: true, description: 'AI正则表达式生成器：自然语言描述生成正则、实时测试匹配、6种预设示例、历史记录、快速参考' },
  // === v112 创新应用套件 — AI智能写作工作台、实时加密货币仪表盘、天气环境监测中心 ===
  { id: 'ai-writing-studio', name: 'AI智能写作工作台', icon: <SparklesIcon />, component: 'AIWritingStudio', category: 'office', defaultWidth: 1320, defaultHeight: 880, minWidth: 960, minHeight: 640, resizable: true, multiple: false, isNew: true, description: 'AI驱动的专业写作工作台：Pollinations AI真实内容生成、8种写作模式（文章/改写/摘要/翻译/润色/扩写/大纲/邮件）、6种写作风格、8种语言互译、字数统计、本地项目保存、快速模板库' },
  { id: 'crypto-dashboard', name: '加密货币仪表盘', icon: <BarChart3Icon />, component: 'CryptoDashboard', category: 'finance', defaultWidth: 1320, defaultHeight: 880, minWidth: 960, minHeight: 640, resizable: true, multiple: false, isNew: true, description: '实时加密货币市场仪表盘：CoinGecko API真实数据、15个主流币种监控、实时价格更新、多周期K线走势图、收藏管理、市场统计分析、数据导出' },
  { id: 'weather-dashboard', name: '天气环境监测中心', icon: <CloudRainIcon />, component: 'WeatherDashboard', category: 'utilities', defaultWidth: 1320, defaultHeight: 880, minWidth: 960, minHeight: 640, resizable: true, multiple: false, isNew: true, description: '实时天气与环境监测：Open-Meteo API真实数据、12个中国/国际城市、当前天气详情、7日预报、24小时温度趋势、空气质量AQI监测、污染物浓度分析、收藏城市管理' },
  // === v113 创新应用套件 — 全球旅行助手 ===
  { id: 'global-travel-assistant', name: '全球旅行助手', icon: <PlaneIcon />, component: 'GlobalTravelAssistant', category: 'utilities', defaultWidth: 1320, defaultHeight: 880, minWidth: 960, minHeight: 640, resizable: true, multiple: false, isNew: true, description: '全球旅行助手：世界时钟(16城市)、实时天气查询(Open-Meteo API)、汇率转换(ExchangeRate-API)、时区转换器、收藏管理、玻璃拟态UI' },
  // === v120 创新应用 — CSS Art Studio CSS艺术工作室 ===
  { id: 'css-art-studio', name: 'CSS Art Studio · CSS艺术工作室', icon: <svg viewBox="0 0 24 24" width="18" height="18" stroke="currentColor" strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round"><circle cx="13.5" cy="6.5" r="2.5"/><circle cx="19" cy="13" r="2.5"/><circle cx="6" cy="12" r="2.5"/><circle cx="10" cy="20" r="2.5"/><path d="M12 2a10 10 0 1 0 10 10c0-1-2-1-3-1s-2 1-3 1-2-1-3-1-2 1-3 1-2-1-3-1 0-1-1-1"/></svg>, component: 'CSSArtStudio', category: 'multimedia', defaultWidth: 1280, defaultHeight: 860, minWidth: 960, minHeight: 640, resizable: true, multiple: false, isNew: true, description: '基于CSS的艺术创作工具：8种动态模板（渐变/极光/网格/粒子/波浪/色彩/几何/梦境）、色相饱和度动画速度实时调整、代码导出、本地收藏画廊' },
  // === v139 新增创新工具：WorldClock + CurrencyConverter + IPInfoDashboard
  { id: 'world-clock', name: 'WorldClock 世界时钟', icon: <ClockIcon />, component: 'WorldClock', category: 'utilities', defaultWidth: 1200, defaultHeight: 850, minWidth: 800, minHeight: 600, resizable: true, multiple: false, isNew: true, description: '全球时钟仪表盘：12个主要城市实时时间、数字/模拟双模式、12/24小时制切换、时差计算器、自定义城市添加、搜索过滤、昼夜状态指示' },
  { id: 'currency-converter', name: 'CurrencyConverter 汇率转换器', icon: <svg viewBox="0 0 24 24" width="18" height="18" stroke="currentColor" strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="1" x2="12" y2="23"/><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/></svg>, component: 'CurrencyConverter', category: 'finance', defaultWidth: 1200, defaultHeight: 850, minWidth: 800, minHeight: 600, resizable: true, multiple: false, isNew: true, description: '实时汇率转换器：Frankfurter API 30+种货币、双向转换、30天历史走势图、收藏货币对、汇率对比表、自动刷新、快速金额选择' },
  { id: 'ip-info-dashboard', name: 'IPInfoDashboard 网络信息仪表盘', icon: <GlobeIcon />, component: 'IPInfoDashboard', category: 'networking', defaultWidth: 1280, defaultHeight: 880, minWidth: 900, minHeight: 650, resizable: true, multiple: false, isNew: true, description: 'IP信息仪表盘：公共IP查询、地理位置定位、ISP信息、网络延迟测试、WebRTC本地IP检测、DNS泄漏测试、SVG世界地图定位、连接质量评分' },
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

function MarkdownPublisherIcon() {
  return (
    <svg viewBox="0 0 24 24" width="18" height="18" stroke="currentColor" strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round">
      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
      <polyline points="14 2 14 8 20 8" />
      <path d="M9 13l-2 3h4l-2 3" />
      <path d="M15 13v6" />
      <path d="M13 15l2-2 2 2" />
    </svg>
  )
}

function StudioSuiteIcon() {
  return (
    <svg viewBox="0 0 24 24" width="18" height="18" stroke="currentColor" strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 2L2 7l10 5 10-5-10-5z" />
      <path d="M2 17l10 5 10-5" />
      <path d="M2 12l10 5 10-5" />
      <circle cx="12" cy="12" r="2" fill="currentColor" stroke="none" />
    </svg>
  )
}

function AudioVizIcon() {
  return (
    <svg viewBox="0 0 24 24" width="18" height="18" stroke="currentColor" strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round">
      <path d="M2 12h2l2-5 3 10 3-8 2 3 2-5 2 5h2" />
      <circle cx="12" cy="12" r="9" strokeDasharray="2 3" opacity="0.5" />
    </svg>
  )
}

function PulseIcon() {
  return (
    <svg viewBox="0 0 24 24" width="18" height="18" stroke="currentColor" strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round">
      <path d="M2 12h3l2-6 3 12 3-8 2 4h5" />
      <circle cx="22" cy="12" r="1" fill="currentColor" stroke="none" />
    </svg>
  )
}

function VineIcon() {
  return (
    <svg viewBox="0 0 24 24" width="18" height="18" stroke="currentColor" strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 22V12" />
      <path d="M12 12C12 8 10 6 6 6" />
      <path d="M12 12C12 8 14 6 18 6" />
      <path d="M6 6C6 4 5 2 3 2" />
      <path d="M18 6C18 4 19 2 21 2" />
      <circle cx="3" cy="2" r="1" fill="currentColor" stroke="none" />
      <circle cx="21" cy="2" r="1" fill="currentColor" stroke="none" />
      <path d="M12 22C12 18 10 16 6 16" />
      <path d="M12 22C12 18 14 16 18 16" />
      <path d="M6 16C6 14 5 12 3 12" />
      <path d="M18 16C18 14 19 12 21 12" />
      <circle cx="3" cy="12" r="1" fill="currentColor" stroke="none" />
      <circle cx="21" cy="12" r="1" fill="currentColor" stroke="none" />
    </svg>
  )
}

function DevPortalIcon() {
  return (
    <svg viewBox="0 0 24 24" width="18" height="18" stroke="currentColor" strokeWidth="2" fill="none">
      <rect x="3" y="3" width="7" height="7" rx="1.5" />
      <rect x="14" y="3" width="7" height="7" rx="1.5" />
      <rect x="3" y="14" width="7" height="7" rx="1.5" />
      <path d="M17.5 14L14 17.5L17.5 21" />
      <path d="M21 17.5H14" />
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



function NexusHubIcon() {
  return (
    <svg viewBox="0 0 24 24" width="18" height="18" stroke="currentColor" strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="3" />
      <circle cx="4" cy="7" r="2" />
      <circle cx="20" cy="7" r="2" />
      <circle cx="4" cy="17" r="2" />
      <circle cx="20" cy="17" r="2" />
      <path d="M6 8.5L10 11" />
      <path d="M18 8.5L14 11" />
      <path d="M6 15.5L10 13" />
      <path d="M18 15.5L14 13" />
      <path d="M4 9V5" />
      <path d="M20 9V5" />
      <path d="M4 15v4" />
      <path d="M20 15v4" />
    </svg>
  )
}

function EcoTrackIcon() {
  return (
    <svg viewBox="0 0 24 24" width="18" height="18" stroke="currentColor" strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 22c4-4 6-8 6-12A6 6 0 0 0 6 6c-4 0-8 2-12 6Z" />
      <path d="M12 22c-4-4-6-8-6-12a6 6 0 0 1 6-6c0 4 2 8 6 12Z" />
      <circle cx="12" cy="12" r="2" />
      <path d="M12 4V2" />
      <path d="M4 12H2" />
    </svg>
  )
}

function NeuroGraphIcon() {
  return (
    <svg viewBox="0 0 24 24" width="18" height="18" stroke="currentColor" strokeWidth="1.8" fill="none" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="6" cy="6" r="2.5" fill="currentColor" stroke="none" opacity="0.7" />
      <circle cx="18" cy="6" r="2.5" fill="currentColor" stroke="none" opacity="0.7" />
      <circle cx="12" cy="14" r="2.5" fill="currentColor" stroke="none" opacity="0.9" />
      <circle cx="5" cy="18" r="2" fill="currentColor" stroke="none" opacity="0.6" />
      <circle cx="19" cy="18" r="2" fill="currentColor" stroke="none" opacity="0.6" />
      <line x1="7.5" y1="7" x2="11" y2="13" />
      <line x1="16.5" y1="7" x2="13" y2="13" />
      <line x1="10.5" y1="15.5" x2="6.5" y2="17" />
      <line x1="13.5" y1="15.5" x2="17.5" y2="17" />
    </svg>
  )
}

function ImageForgeIcon() {
  return (
    <svg viewBox="0 0 24 24" width="18" height="18" stroke="currentColor" strokeWidth="1.8" fill="none" strokeLinecap="round" strokeLinejoin="round">
      <path d="M15 4V2" />
      <path d="M15 16v-2" />
      <path d="M8 9h2" />
      <path d="M20 9h2" />
      <path d="M17.8 11.8L19 13" />
      <path d="M15 9h0" />
      <path d="M17.8 6.2L19 5" />
      <path d="M3 21l9-9 4 4-3 3" />
      <path d="M3 21h6" />
      <path d="M9 21l3-3" />
      <circle cx="15" cy="9" r="2" />
    </svg>
  )
}

function TimeCapsuleIcon() {
  return (
    <svg viewBox="0 0 24 24" width="18" height="18" stroke="currentColor" strokeWidth="1.8" fill="none" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="9" />
      <path d="M12 7v5l3 2" />
      <circle cx="12" cy="12" r="1.5" fill="currentColor" stroke="none" />
      <path d="M19 5l1.5-1.5" />
      <path d="M5 19l-1.5 1.5" />
    </svg>
  )
}

// === v55 新增 5 个图标函数
function OpenAPIHubIcon() {
  return (
    <svg viewBox="0 0 24 24" width="18" height="18" stroke="currentColor" strokeWidth="1.8" fill="none" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="3" width="18" height="18" rx="3" />
      <path d="M8 9l-2 3 2 3" />
      <path d="M16 9l2 3-2 3" />
      <path d="M12 9l-1 6" />
      <circle cx="12" cy="12" r="1.5" fill="currentColor" stroke="none" />
    </svg>
  )
}

function ResumeForgeIcon() {
  return (
    <svg viewBox="0 0 24 24" width="18" height="18" stroke="currentColor" strokeWidth="1.8" fill="none" strokeLinecap="round" strokeLinejoin="round">
      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
      <polyline points="14 2 14 8 20 8" />
      <line x1="8" y1="12" x2="16" y2="12" />
      <line x1="8" y1="16" x2="14" y2="16" />
      <path d="M18 14l2 2-2 2" />
    </svg>
  )
}

function DataVizStudioIcon() {
  return (
    <svg viewBox="0 0 24 24" width="18" height="18" stroke="currentColor" strokeWidth="1.8" fill="none" strokeLinecap="round" strokeLinejoin="round">
      <line x1="4" y1="20" x2="4" y2="12" />
      <line x1="9" y1="20" x2="9" y2="6" />
      <line x1="14" y1="20" x2="14" y2="15" />
      <line x1="19" y1="20" x2="19" y2="9" />
      <polyline points="4,12 9,6 14,15 19,9" />
      <circle cx="4" cy="12" r="1.5" fill="currentColor" stroke="none" />
      <circle cx="9" cy="6" r="1.5" fill="currentColor" stroke="none" />
      <circle cx="14" cy="15" r="1.5" fill="currentColor" stroke="none" />
      <circle cx="19" cy="9" r="1.5" fill="currentColor" stroke="none" />
    </svg>
  )
}

function CodeReviewBotIcon() {
  return (
    <svg viewBox="0 0 24 24" width="18" height="18" stroke="currentColor" strokeWidth="1.8" fill="none" strokeLinecap="round" strokeLinejoin="round">
      <path d="M9 17l-7.5-5L9 7" />
      <path d="M15 7l7.5 5L15 17" />
      <circle cx="12" cy="12" r="3.2" />
      <circle cx="12" cy="12" r="1" fill="currentColor" stroke="none" />
      <path d="M3 4l2-2" />
      <path d="M21 20l-2 2" />
      <path d="M3 20l-2 2" />
      <path d="M21 4l2-2" />
    </svg>
  )
}

function FlashMasterIcon() {
  return (
    <svg viewBox="0 0 24 24" width="18" height="18" stroke="currentColor" strokeWidth="1.8" fill="none" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="4" width="13" height="16" rx="2" />
      <path d="M16 8l6 3-6 3" />
      <rect x="6" y="6" width="7" height="12" rx="1" />
      <path d="M9 8l-2 5 2-1-1 3" />
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


function CodeFormatterIcon() {
  return (
    <svg viewBox="0 0 24 24" width="18" height="18" stroke="currentColor" strokeWidth="2" fill="none">
      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
      <polyline points="14 2 14 8 20 8"></polyline>
      <polyline points="16 14 12 18 8 14"></polyline>
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

function LivePulseIcon() {
  return (
    <svg viewBox="0 0 24 24" width="18" height="18" stroke="currentColor" strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="10" />
      <path d="M3 12h3l2-5 3 10 3-8 2 3h5" />
      <circle cx="21" cy="12" r="1" fill="currentColor" stroke="none" />
      <circle cx="12" cy="4" r="1" fill="currentColor" stroke="none" />
    </svg>
  )
}

function InsightPulseIcon() {
  return (
    <svg viewBox="0 0 24 24" width="18" height="18" stroke="currentColor" strokeWidth="1.8" fill="none" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="9" />
      <circle cx="12" cy="12" r="3" fill="currentColor" opacity="0.2" />
      <circle cx="12" cy="12" r="1.2" fill="currentColor" stroke="none" />
      <path d="M12 3a9 9 0 016.36 2.64" />
      <path d="M12 3v4" />
      <path d="M21 12h-4" />
      <path d="M18.36 18.36A9 9 0 0112 21" />
      <path d="M12 21v-4" />
      <path d="M3 12h4" />
      <path d="M5.64 5.64A9 9 0 0112 3" />
      <rect x="6" y="8" width="3" height="2" rx="0.5" fill="currentColor" opacity="0.7" />
      <rect x="15" y="14" width="3" height="2" rx="0.5" fill="currentColor" opacity="0.7" />
    </svg>
  )
}

function CodeDocGenIcon() {
  return (
    <svg viewBox="0 0 24 24" width="18" height="18" stroke="currentColor" strokeWidth="1.8" fill="none" strokeLinecap="round" strokeLinejoin="round">
      <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z" />
      <polyline points="14 2 14 8 20 8" />
      <path d="M9 14l-2 2 2 2" />
      <path d="M15 14l2 2-2 2" />
      <path d="M13 13l-1 6" />
      <line x1="8" y1="12" x2="16" y2="12" strokeWidth="2.5" />
    </svg>
  )
}

/* === v62 三大创新应用图标 === */
function NebulaIcon() {
  return (
    <svg viewBox="0 0 24 24" width="18" height="18" stroke="currentColor" strokeWidth="1.8" fill="none" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="9" />
      <ellipse cx="12" cy="12" rx="9" ry="3.5" />
      <ellipse cx="12" cy="12" rx="9" ry="3.5" transform="rotate(60 12 12)" />
      <ellipse cx="12" cy="12" rx="9" ry="3.5" transform="rotate(120 12 12)" />
      <circle cx="12" cy="12" r="2" fill="currentColor" />
      <circle cx="18.5" cy="8.5" r="0.8" fill="currentColor" stroke="none" />
      <circle cx="5" cy="15" r="0.6" fill="currentColor" stroke="none" />
    </svg>
  )
}

function PollinationsAIIcon() {
  return (
    <svg viewBox="0 0 24 24" width="18" height="18" stroke="currentColor" strokeWidth="1.8" fill="none" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 2L3 7v10l9 5 9-5V7L12 2z" />
      <path d="M12 7v10" />
      <path d="M3 7l9 5 9-5" />
      <circle cx="12" cy="17" r="1.2" fill="currentColor" stroke="none" />
      <path d="M7 9.5l5 2.8M17 9.5l-5 2.8" />
    </svg>
  )
}

function DevAtlasIcon() {
  return (
    <svg viewBox="0 0 24 24" width="18" height="18" stroke="currentColor" strokeWidth="1.8" fill="none" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="9" />
      <path d="M3 12h18M12 3a15 15 0 010 18M12 3a15 15 0 000 18" />
      <path d="M8 12c0-2.2 1.8-4 4-4M16 12c0 2.2-1.8 4-4 4" />
      <circle cx="12" cy="12" r="1.5" fill="currentColor" stroke="none" />
      <path d="M3 6l3 2M21 6l-3 2M3 18l3-2M21 18l-3-2" />
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


function WorkflowIcon() {
  return (
    <svg viewBox="0 0 24 24" width="18" height="18" stroke="currentColor" strokeWidth="2" fill="none">
      <circle cx="5" cy="6" r="2" />
      <circle cx="5" cy="18" r="2" />
      <circle cx="19" cy="12" r="2" />
      <path d="M7 6h4a3 3 0 0 1 3 3v0a3 3 0 0 0 3 3h2" />
      <path d="M7 18h4a3 3 0 0 0 3-3v0a3 3 0 0 1 3-3h2" />
    </svg>
  )
}

function GlobeInsightsIcon() {
  return (
    <svg viewBox="0 0 24 24" width="18" height="18" stroke="currentColor" strokeWidth="2" fill="none">
      <circle cx="12" cy="12" r="10" />
      <line x1="2" y1="12" x2="22" y2="12" />
      <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z" />
    </svg>
  )
}

function GeoAtlasIcon() {
  return (
    <svg viewBox="0 0 24 24" width="18" height="18" stroke="currentColor" strokeWidth="2" fill="none">
      <circle cx="12" cy="12" r="10" />
      <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z" />
      <line x1="2" y1="12" x2="22" y2="12" />
      <path d="M5 7h14" opacity="0.4" />
      <path d="M5 17h14" opacity="0.4" />
      <circle cx="15" cy="9" r="1.5" fill="currentColor" stroke="none" />
      <circle cx="9" cy="15" r="1.5" fill="currentColor" stroke="none" />
    </svg>
  )
}

function WikiExplorerIcon() {
  return (
    <svg viewBox="0 0 24 24" width="18" height="18" stroke="currentColor" strokeWidth="2" fill="none">
      <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" />
      <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z" />
      <circle cx="12" cy="9" r="3" />
      <path d="M12 12v2" />
      <line x1="9" y1="16" x2="15" y2="16" />
    </svg>
  )
}

function SnippetVaultIcon() {
  return (
    <svg viewBox="0 0 24 24" width="18" height="18" stroke="currentColor" strokeWidth="2" fill="none">
      <polyline points="16 18 22 12 16 6" />
      <polyline points="8 6 2 12 8 18" />
      <line x1="14" y1="4" x2="10" y2="20" />
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

// 注意（校验提示）：以下所有条目在 src/apps/ 下均应存在同名 .tsx 组件文件，
// 且每个 id 必须全局唯一。如新增注册，请先确认组件文件已就位。
// （当前 201 项已完成组件存在性与 id 去重校验，无异常。）
export const appRegistry: AppDefinition[] = [
  { id: 'smart-ai-hub', name: '智能AI中心', icon: <SmartAIHubIcon />, component: 'SmartAIHub', category: 'utilities', defaultWidth: 1100, defaultHeight: 800, minWidth: 700, minHeight: 600, resizable: true, multiple: false },
  { id: 'smart-dev-flow', name: '智能开发工作台', icon: <SmartDevFlowIcon />, component: 'SmartDevFlow', category: 'development', defaultWidth: 1280, defaultHeight: 880, minWidth: 900, minHeight: 650, resizable: true, multiple: false },
  { id: 'unified-dashboard', name: '统一数据仪表盘', icon: <UnifiedDashboardIcon />, component: 'UnifiedDashboard', category: 'utilities', defaultWidth: 1300, defaultHeight: 900, minWidth: 1000, minHeight: 700, resizable: true, multiple: false },
  { id: 'task-manager-plus', name: '任务管理器 Plus', icon: <TaskManagerPlusIcon />, component: 'TaskManagerPlus', category: 'office', defaultWidth: 1300, defaultHeight: 900, minWidth: 900, minHeight: 650, resizable: true, multiple: false },
  { id: 'idea-board-classic', name: '灵感板', icon: <IdeaBoardIcon />, component: 'IdeaBoard', category: 'utilities', defaultWidth: 1100, defaultHeight: 800, minWidth: 800, minHeight: 600, resizable: true, multiple: false },
  { id: 'color-palette-generator', name: '配色方案生成器', icon: <ColorPaletteIcon />, component: 'ColorPaletteGenerator', category: 'utilities', defaultWidth: 900, defaultHeight: 800, minWidth: 700, minHeight: 600, resizable: true, multiple: false },
  { id: 'cron-tools', name: 'Cron 生成器', icon: <CronIcon />, component: 'CronTools', category: 'development', defaultWidth: 700, defaultHeight: 750, minWidth: 500, minHeight: 500, resizable: true, multiple: false },
  { id: 'ai-task-assistant', name: 'AI 任务助手', icon: <AITaskAssistantIcon />, component: 'AITaskAssistant', category: 'utilities', defaultWidth: 1100, defaultHeight: 850, minWidth: 700, minHeight: 600, resizable: true, multiple: false },
  { id: 'intelligent-code-generator', name: '智能代码生成器', icon: <IntelligentCodeGeneratorIcon />, component: 'IntelligentCodeGenerator', category: 'development', defaultWidth: 1300, defaultHeight: 850, minWidth: 900, minHeight: 650, resizable: true, multiple: false },
  { id: 'code-formatter', name: '代码格式化', icon: <CodeFormatterIcon />, component: 'CodeFormatter', category: 'development', defaultWidth: 1000, defaultHeight: 700, minWidth: 700, minHeight: 500, resizable: true, multiple: false },
  { id: 'whiteboard-pro', name: '专业白板', icon: <WhiteboardProIcon />, component: 'WhiteboardPro', category: 'office', defaultWidth: 1200, defaultHeight: 900, minWidth: 800, minHeight: 600, resizable: true, multiple: false },
  { id: 'github-explorer', name: 'GitHub 探索器', icon: <GitHubExplorerIcon />, component: 'GitHubExplorer', category: 'development', defaultWidth: 1200, defaultHeight: 850, minWidth: 900, minHeight: 600, resizable: true, multiple: false },
  { id: 'component-sandbox', name: '组件开发沙盒', icon: <ComponentSandboxIcon />, component: 'ComponentSandbox', category: 'development', defaultWidth: 1200, defaultHeight: 800, minWidth: 900, minHeight: 600, resizable: true, multiple: false },
  { id: 'wikipedia-reader', name: '维基百科阅读器', icon: <WikipediaReaderIcon />, component: 'WikipediaReader', category: 'internet', defaultWidth: 1100, defaultHeight: 800, minWidth: 700, minHeight: 500, resizable: true, multiple: false },
  { id: 'dev-assistant', name: '开发助手', icon: <DevAssistantIcon />, component: 'DevAssistant', category: 'development', defaultWidth: 1000, defaultHeight: 750, minWidth: 700, minHeight: 500, resizable: true, multiple: false },
  { id: 'habit-tracker', name: '习惯追踪', icon: <svg viewBox="0 0 24 24" width="18" height="18" stroke="currentColor" strokeWidth="2" fill="none"><path d="M12 2L2 7l10 5 10-5-10-5z" /><path d="M2 17l10 5 10-5" /><path d="M2 12l10 5 10-5" /><circle cx="12" cy="7" r="1" fill="currentColor" /><circle cx="8" cy="14.5" r="1" fill="currentColor" /><circle cx="16" cy="14.5" r="1" fill="currentColor" /></svg>, component: 'HabitTracker', category: 'utilities', defaultWidth: 900, defaultHeight: 700, minWidth: 600, minHeight: 500, resizable: true, multiple: false },
  { id: 'code-sandbox', name: '代码沙盒', icon: <CodeSandboxIcon />, component: 'CodeSandbox', category: 'development', defaultWidth: 1200, defaultHeight: 800, minWidth: 800, minHeight: 600, resizable: true, multiple: false },
  { id: 'rest-client', name: 'REST 客户端', icon: <RESTClientIcon />, component: 'RESTClient', category: 'development', defaultWidth: 1200, defaultHeight: 800, minWidth: 900, minHeight: 600, resizable: true, multiple: false },
  { id: 'api-docs-viewer', name: 'API 文档中心', icon: <ApiIcon />, component: 'ApiDocsViewer', category: 'development', defaultWidth: 1100, defaultHeight: 800, minWidth: 800, minHeight: 600, resizable: true, multiple: false },
  { id: 'url-tools', name: 'URL 工具箱', icon: <URLToolsIcon />, component: 'URLTools', category: 'development', defaultWidth: 800, defaultHeight: 700, minWidth: 600, minHeight: 500, resizable: true, multiple: false },
  { id: 'base64-tools', name: 'Base64 工具箱', icon: <Base64ToolsIcon />, component: 'Base64Tools', category: 'development', defaultWidth: 800, defaultHeight: 700, minWidth: 600, minHeight: 500, resizable: true, multiple: false },
  { id: 'stock-tracker', name: '股票市场追踪器', icon: <StockTrackerIcon />, component: 'StockTracker', category: 'utilities', defaultWidth: 1100, defaultHeight: 750, minWidth: 800, minHeight: 600, resizable: true, multiple: false },
  { id: 'stock-dashboard', name: '实时股票仪表盘', icon: <StockTrackerIcon />, component: 'StockDashboard', category: 'utilities', defaultWidth: 1100, defaultHeight: 820, minWidth: 850, minHeight: 650, resizable: true, multiple: false, isNew: true, description: '实时股票仪表盘：基于 Stooq API 的实时行情、多股票监控、迷你走势图、市场指数概览、玻璃拟态设计' },
  { id: 'smart-project-hub', name: '智能项目管理', icon: <SmartProjectHubIcon />, component: 'SmartProjectHub', category: 'office', defaultWidth: 1200, defaultHeight: 850, minWidth: 900, minHeight: 600, resizable: true, multiple: false },
  { id: 'flashcards', name: '学习卡片', icon: <FlashcardsIcon />, component: 'Flashcards', category: 'utilities', defaultWidth: 1000, defaultHeight: 800, minWidth: 700, minHeight: 600, resizable: true, multiple: false },
  { id: 'daily-inspo', name: '每日灵感', icon: <SparklesIcon />, component: 'DailyInspo', category: 'utilities', defaultWidth: 700, defaultHeight: 850, minWidth: 500, minHeight: 600, resizable: true, multiple: false },
  { id: 'smart-password-manager', name: '智能密码管理器', icon: <LockIcon />, component: 'SmartPasswordManager', category: 'utilities', defaultWidth: 1000, defaultHeight: 750, minWidth: 700, minHeight: 500, resizable: true, multiple: false },
  { id: 'project-planner', name: '项目规划器', icon: <ProjectPlannerIcon />, component: 'ProjectPlanner', category: 'development', defaultWidth: 1200, defaultHeight: 850, minWidth: 900, minHeight: 600, resizable: true, multiple: false },
  { id: 'code-generator', name: '代码生成器', icon: <Code2Icon />, component: 'CodeGenerator', category: 'development', defaultWidth: 1200, defaultHeight: 850, minWidth: 900, minHeight: 650, resizable: true, multiple: false },
  { id: 'data-exporter', name: '数据导入导出', icon: <DataExporterIcon />, component: 'DataExporter', category: 'system', defaultWidth: 950, defaultHeight: 700, minWidth: 700, minHeight: 550, resizable: true, multiple: false },
  { id: 'code-reviewer', name: '代码审查助手', icon: <CodeReviewIcon />, component: 'CodeReviewer', category: 'development', defaultWidth: 1200, defaultHeight: 800, minWidth: 900, minHeight: 600, resizable: true, multiple: false },
  { id: 'creative-toolkit', name: '创意工具箱', icon: <CreativeToolkitIcon />, component: 'CreativeToolkit', category: 'utilities', defaultWidth: 900, defaultHeight: 750, minWidth: 700, minHeight: 550, resizable: true, multiple: false },
  { id: 'text-diff', name: '文本比较工具', icon: <DiffIcon />, component: 'TextDiffViewer', category: 'utilities', defaultWidth: 1000, defaultHeight: 700, minWidth: 700, minHeight: 500, resizable: true, multiple: false },
  { id: 'autoflow', name: 'AutoFlow 工作流', icon: <AutoFlowIcon />, component: 'AutoFlow', category: 'utilities', defaultWidth: 1300, defaultHeight: 800, minWidth: 1000, minHeight: 600, resizable: true, multiple: false },
  { id: 'idea-capture', name: '灵感速记', icon: <IdeaIcon />, component: 'IdeaCapture', category: 'utilities', defaultWidth: 900, defaultHeight: 700, minWidth: 600, minHeight: 500, resizable: true, multiple: false },
  { id: 'image-optimizer', name: '图片优化器', icon: <ImageOptimizeIcon />, component: 'ImageOptimizer', category: 'utilities', defaultWidth: 1000, defaultHeight: 700, minWidth: 700, minHeight: 500, resizable: true, multiple: false },
  { id: 'network-speed-test', name: '网络速度测试', icon: <SpeedTestIcon />, component: 'NetworkSpeedTest', category: 'utilities', defaultWidth: 600, defaultHeight: 700, minWidth: 500, minHeight: 500, resizable: true, multiple: false },
  { id: 'learning-platform', name: '学习平台', icon: <GraduationCapIcon />, component: 'LearningPlatform', category: 'utilities', defaultWidth: 1200, defaultHeight: 800, minWidth: 900, minHeight: 600, resizable: true, multiple: false },
  { id: 'crypto-tracker', name: '加密货币追踪器', icon: <CryptoIcon />, component: 'CryptoTracker', category: 'utilities', defaultWidth: 600, defaultHeight: 900, minWidth: 450, minHeight: 600, resizable: true, multiple: false },
  { id: 'country-info', name: '国家信息', icon: <MapPinIcon />, component: 'CountryInfo', category: 'utilities', defaultWidth: 1000, defaultHeight: 700, minWidth: 700, minHeight: 500, resizable: true, multiple: false },
  { id: 'chat-ai', name: 'AI 智能助手', icon: <ChatAIIcon />, component: 'ChatAI', category: 'utilities', defaultWidth: 1000, defaultHeight: 750, minWidth: 700, minHeight: 500, resizable: true, multiple: false },
  { id: 'code-studio', name: 'Code Studio', icon: <CodeStudioIcon />, component: 'CodeStudio', category: 'development', defaultWidth: 1100, defaultHeight: 800, minWidth: 800, minHeight: 550, resizable: true, multiple: false },
  { id: 'text-formatter', name: '文本格式化', icon: <TextFormatIcon />, component: 'TextFormatter', category: 'utilities', defaultWidth: 850, defaultHeight: 700, minWidth: 600, minHeight: 500, resizable: true, multiple: false },
  { id: 'currency-converter', name: '汇率转换', icon: <CurrencyIcon />, component: 'CurrencyConverter', category: 'utilities', defaultWidth: 850, defaultHeight: 650, minWidth: 700, minHeight: 550, resizable: true, multiple: false },
  { id: 'voice-transcriber', name: '语音转录', icon: <VoiceIcon />, component: 'VoiceTranscriber', category: 'utilities', defaultWidth: 800, defaultHeight: 700, minWidth: 600, minHeight: 500, resizable: true, multiple: false },
  { id: 'github-trending', name: 'GitHub 热门', icon: <GitHubIcon />, component: 'GitHubTrending', category: 'development', defaultWidth: 900, defaultHeight: 700, minWidth: 600, minHeight: 450, resizable: true, multiple: false },
  { id: 'regex-tester', name: '正则表达式测试', icon: <RegexIcon />, component: 'RegexTester', category: 'development', defaultWidth: 900, defaultHeight: 650, minWidth: 600, minHeight: 450, resizable: true, multiple: false },
  { id: 'json-schema-validator', name: 'JSON Schema 验证', icon: <JsonIcon />, component: 'JSONSchemaValidator', category: 'development', defaultWidth: 1000, defaultHeight: 700, minWidth: 600, minHeight: 450, resizable: true, multiple: false },
  { id: 'markdown-to-html', name: 'Markdown 转 HTML', icon: <FileTextIcon />, component: 'MarkdownToHTML', category: 'office', defaultWidth: 1000, defaultHeight: 700, minWidth: 600, minHeight: 450, resizable: true, multiple: false },
  { id: 'system-dashboard', name: '系统仪表盘', icon: <SystemIcon />, component: 'SystemDashboard', category: 'system', defaultWidth: 1200, defaultHeight: 800, minWidth: 800, minHeight: 600, resizable: true, multiple: false },
  { id: 'task-automation', name: '任务自动化', icon: <AutomationIcon />, component: 'TaskAutomation', category: 'utilities', defaultWidth: 1000, defaultHeight: 700, minWidth: 700, minHeight: 500, resizable: true, multiple: false },
  { id: 'music-visualizer', name: '音乐可视化', icon: <CustomMusicIcon />, component: 'MusicVisualizer', category: 'multimedia', defaultWidth: 1000, defaultHeight: 750, minWidth: 600, minHeight: 450, resizable: true, multiple: false },
  { id: 'whiteboard', name: '白板', icon: <WhiteboardIcon />, component: 'Whiteboard', category: 'office', defaultWidth: 1000, defaultHeight: 700, minWidth: 600, minHeight: 400, resizable: true, multiple: false },
  { id: 'particle-system', name: '粒子系统', icon: <ParticleIcon />, component: 'ParticleSystem', category: 'utilities', defaultWidth: 900, defaultHeight: 700, minWidth: 600, minHeight: 400, resizable: true, multiple: false },
  { id: 'sticky-notes-wall', name: '便签墙', icon: <StickyNotesIcon />, component: 'StickyNotesWall', category: 'office', defaultWidth: 800, defaultHeight: 600, minWidth: 500, minHeight: 400, resizable: true, multiple: false },
  { id: 'virtual-pet', name: '虚拟宠物', icon: <PetIcon />, component: 'VirtualPet', category: 'games', defaultWidth: 400, defaultHeight: 650, minWidth: 350, minHeight: 550, resizable: true, multiple: false },
  { id: 'wallpaper-gallery', name: '壁纸画廊', icon: <WallpaperIcon />, component: 'WallpaperGallery', category: 'utilities', defaultWidth: 700, defaultHeight: 600, minWidth: 500, minHeight: 450, resizable: true, multiple: false },
  { id: 'mind-map', name: '思维导图', icon: <MindMapIcon />, component: 'MindMap', category: 'office', defaultWidth: 900, defaultHeight: 650, minWidth: 600, minHeight: 450, resizable: true, multiple: false },
  { id: 'smart-search', name: '智慧搜索', icon: <SearchIcon />, component: 'SmartSearch', category: 'utilities', defaultWidth: 700, defaultHeight: 600, minWidth: 500, minHeight: 400, resizable: true, multiple: false },
  { id: 'network-explorer', name: '网络探索', icon: <ApiLabIcon />, component: 'NetworkExplorer', category: 'development', defaultWidth: 1100, defaultHeight: 700, minWidth: 700, minHeight: 500, resizable: true, multiple: false },
  { id: 'files', name: '文件管理器', icon: <FolderIcon />, component: 'FileManager', category: 'system', defaultWidth: 900, defaultHeight: 600, minWidth: 500, minHeight: 350, resizable: true, multiple: true },
  { id: 'terminal', name: '终端', icon: <TerminalIcon />, component: 'Terminal', category: 'system', defaultWidth: 800, defaultHeight: 500, minWidth: 400, minHeight: 250, resizable: true, multiple: true },
  { id: 'text-editor', name: '文本编辑器', icon: <FileTextIcon />, component: 'TextEditor', category: 'office', defaultWidth: 700, defaultHeight: 500, minWidth: 400, minHeight: 300, resizable: true, multiple: true },
  { id: 'browser', name: '浏览器', icon: <BrowserIcon />, component: 'WebBrowser', category: 'internet', defaultWidth: 1024, defaultHeight: 700, minWidth: 600, minHeight: 400, resizable: true, multiple: true },
  { id: 'calculator', name: '计算器', icon: <CalculatorIcon />, component: 'Calculator', category: 'utilities', defaultWidth: 350, defaultHeight: 480, minWidth: 300, minHeight: 400, resizable: false, multiple: false },
  { id: 'date-calculator', name: '日期计算器', icon: <CalendarIcon />, component: 'DateCalculator', category: 'utilities', defaultWidth: 900, defaultHeight: 650, minWidth: 700, minHeight: 500, resizable: true, multiple: false },
  { id: 'calendar', name: '日历', icon: <CalendarIcon />, component: 'Calendar', category: 'office', defaultWidth: 700, defaultHeight: 550, minWidth: 500, minHeight: 400, resizable: true, multiple: false },
  { id: 'clock', name: '时钟', icon: <ClockIcon />, component: 'Clock', category: 'utilities', defaultWidth: 400, defaultHeight: 450, minWidth: 300, minHeight: 350, resizable: false, multiple: false },
  { id: 'weather', name: '天气', icon: <CloudRainIcon />, component: 'Weather', category: 'utilities', defaultWidth: 900, defaultHeight: 700, minWidth: 700, minHeight: 500, resizable: true, multiple: false },
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
  { id: 'network-monitor', name: '网络监视器', icon: <WifiIcon />, component: 'NetworkMonitor', category: 'system', defaultWidth: 650, defaultHeight: 450, minWidth: 450, minHeight: 350, resizable: true, multiple: false },
  { id: 'speed-test', name: '网络速度测试', icon: <ActivityIcon />, component: 'SpeedTest', category: 'system', defaultWidth: 800, defaultHeight: 750, minWidth: 650, minHeight: 600, resizable: true, multiple: false, isNew: true, description: '真实网络测速：下载/上传速度测试、延迟测量、历史记录图表、公开测速服务器、结果本地存储' },
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
  { id: 'backup-tool', name: '备份工具', icon: <BackupIcon />, component: 'BackupTool', category: 'system', defaultWidth: 550, defaultHeight: 450, minWidth: 400, minHeight: 300, resizable: true, multiple: false },
  { id: 'archive-manager', name: '归档管理器', icon: <ZipIcon />, component: 'ArchiveManager', category: 'utilities', defaultWidth: 600, defaultHeight: 450, minWidth: 450, minHeight: 350, resizable: true, multiple: false },
  { id: 'disk-utility', name: '磁盘工具', icon: <HardDriveIcon />, component: 'DiskUtility', category: 'system', defaultWidth: 600, defaultHeight: 450, minWidth: 450, minHeight: 350, resizable: true, multiple: false },
  { id: 'log-viewer', name: '日志查看器', icon: <FileSearchIcon />, component: 'LogViewer', category: 'system', defaultWidth: 700, defaultHeight: 500, minWidth: 500, minHeight: 350, resizable: true, multiple: false },
  { id: 'character-map', name: '字符映射表', icon: <TypeIcon />, component: 'CharacterMap', category: 'utilities', defaultWidth: 600, defaultHeight: 450, minWidth: 450, minHeight: 350, resizable: true, multiple: false },
  { id: 'font-viewer', name: '字体查看器', icon: <TypeIcon />, component: 'FontViewer', category: 'utilities', defaultWidth: 600, defaultHeight: 450, minWidth: 450, minHeight: 350, resizable: true, multiple: false },
  { id: 'web-services', name: 'Web服务工具箱', icon: <CustomGlobeIcon />, component: 'WebServicesToolbox', category: 'utilities', defaultWidth: 900, defaultHeight: 700, minWidth: 600, minHeight: 500, resizable: true, multiple: false },
  { id: 'dictionary', name: '字典', icon: <CustomBookIcon />, component: 'Dictionary', category: 'office', defaultWidth: 600, defaultHeight: 500, minWidth: 450, minHeight: 350, resizable: true, multiple: false },
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
  { id: 'kanban-board', name: '任务看板', icon: <BoardIcon />, component: 'KanbanBoard', category: 'office', defaultWidth: 900, defaultHeight: 600, minWidth: 500, minHeight: 400, resizable: true, multiple: false },
  { id: 'clipboard-manager', name: '剪贴板管理', icon: <CustomClipboardIcon />, component: 'ClipboardManager', category: 'utilities', defaultWidth: 800, defaultHeight: 500, minWidth: 600, minHeight: 400, resizable: true, multiple: false },
  { id: 'quick-commands', name: '快捷命令', icon: <LightningIcon />, component: 'QuickCommands', category: 'utilities', defaultWidth: 850, defaultHeight: 550, minWidth: 600, minHeight: 400, resizable: true, multiple: false },
  { id: 'cloud-sync', name: '云同步', icon: <CloudIcon />, component: 'CloudSync', category: 'utilities', defaultWidth: 700, defaultHeight: 650, minWidth: 500, minHeight: 450, resizable: true, multiple: false },
  { id: 'api-tester', name: 'API 测试器', icon: <ApiIcon />, component: 'ApiTester', category: 'development', defaultWidth: 1050, defaultHeight: 700, minWidth: 700, minHeight: 500, resizable: true, multiple: false },
  { id: 'quick-launcher', name: '快速启动器', icon: <RocketIcon />, component: 'QuickLauncher', category: 'utilities', defaultWidth: 550, defaultHeight: 650, minWidth: 400, minHeight: 450, resizable: true, multiple: false },
  { id: 'activity-tracker', name: '活动追踪器', icon: <ActivityIcon />, component: 'ActivityTracker', category: 'utilities', defaultWidth: 500, defaultHeight: 700, minWidth: 400, minHeight: 500, resizable: true, multiple: false },
  { id: 'project-manager', name: '项目管理', icon: <TaskIcon />, component: 'ProjectManager', category: 'office', defaultWidth: 1200, defaultHeight: 800, minWidth: 900, minHeight: 600, resizable: true, multiple: false },
  { id: 'ip-lookup', name: 'IP & DNS 查询', icon: <CustomGlobeIcon />, component: 'IPLookup', category: 'utilities', defaultWidth: 700, defaultHeight: 550, minWidth: 550, minHeight: 450, resizable: true, multiple: false },
  
  { id: 'system-toolbox', name: '系统工具箱', icon: <WrenchIcon />, component: 'SystemToolbox', category: 'utilities', defaultWidth: 900, defaultHeight: 700, minWidth: 700, minHeight: 500, resizable: true, multiple: false },
  { id: 'regex-builder', name: '正则表达式构建器', icon: <RegexIcon />, component: 'RegexBuilder', category: 'development', defaultWidth: 900, defaultHeight: 800, minWidth: 700, minHeight: 600, resizable: true, multiple: false },
  { id: 'ai-generator', name: 'AI文本生成器', icon: <SparklesIcon />, component: 'AIGenerator', category: 'utilities', defaultWidth: 1000, defaultHeight: 750, minWidth: 700, minHeight: 500, resizable: true, multiple: false },
  { id: 'bookmark-manager', name: '网络书签管理', icon: <BookmarkManagerIcon />, component: 'BookmarkManager', category: 'internet', defaultWidth: 1000, defaultHeight: 750, minWidth: 700, minHeight: 500, resizable: true, multiple: false },
  { id: 'system-health-dashboard', name: '智能系统健康监控', icon: <SystemHealthDashboardIcon />, component: 'SystemHealthDashboard', category: 'system', defaultWidth: 1200, defaultHeight: 900, minWidth: 900, minHeight: 600, resizable: true, multiple: false },
  { id: 'qr-generator-enhanced', name: '增强版二维码生成器', icon: <QRCodeIcon />, component: 'QRGeneratorEnhanced', category: 'utilities', defaultWidth: 900, defaultHeight: 700, minWidth: 700, minHeight: 500, resizable: true, multiple: false },
  { id: 'code-diff-enhanced', name: '增强版代码差异查看器', icon: <CodeDiffIcon />, component: 'CodeDiffViewerEnhanced', category: 'development', defaultWidth: 1300, defaultHeight: 850, minWidth: 900, minHeight: 650, resizable: true, multiple: false },
  { id: 'api-docs-enhanced', name: '增强版API文档查看器', icon: <EnhancedApiDocsIcon />, component: 'ApiDocsViewerEnhanced', category: 'development', defaultWidth: 1200, defaultHeight: 850, minWidth: 900, minHeight: 650, resizable: true, multiple: false },
  { id: 'web-tools-hub', name: 'Web工具中心', icon: <WebToolsHubIcon />, component: 'WebToolsHub', category: 'utilities', defaultWidth: 900, defaultHeight: 700, minWidth: 600, minHeight: 500, resizable: true, multiple: false },
  { id: 'code-collaboration-hub', name: '代码协作中心', icon: <CodeStudioIcon />, component: 'CodeCollaborationHub', category: 'development', defaultWidth: 1100, defaultHeight: 800, minWidth: 800, minHeight: 600, resizable: true, multiple: false },

  { id: 'utility-center', name: '实用工具中心', icon: <WrenchIcon />, component: 'UtilityCenter', category: 'utilities', defaultWidth: 1000, defaultHeight: 700, minWidth: 700, minHeight: 500, resizable: true, multiple: false },
  { id: 'currency-live', name: '实时汇率', icon: <svg viewBox="0 0 24 24" width="18" height="18" stroke="currentColor" strokeWidth="2" fill="none"><path d="M12 2v20M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/></svg>, component: 'CurrencyLive', category: 'utilities', defaultWidth: 1000, defaultHeight: 700, minWidth: 700, minHeight: 500, resizable: true, multiple: false },
  { id: 'dns-lookup', name: 'DNS 查询工具', icon: <svg viewBox="0 0 24 24" width="18" height="18" stroke="currentColor" strokeWidth="2" fill="none"><circle cx="12" cy="12" r="10"/><path d="M2 12h20M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/></svg>, component: 'DnsLookup', category: 'utilities', defaultWidth: 900, defaultHeight: 700, minWidth: 600, minHeight: 500, resizable: true, multiple: false },
  { id: 'hacker-news-reader', name: 'Hacker News 阅读', icon: <svg viewBox="0 0 24 24" width="18" height="18" stroke="currentColor" strokeWidth="2" fill="none"><path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"/><path d="M9 7l2 5 2-5M10 13h2"/></svg>, component: 'HackerNewsReader', category: 'internet', defaultWidth: 1000, defaultHeight: 750, minWidth: 700, minHeight: 500, resizable: true, multiple: false },
  { id: 'uuid-tools', name: 'UUID 工具', icon: <svg viewBox="0 0 24 24" width="18" height="18" stroke="currentColor" strokeWidth="2" fill="none"><rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8.5" cy="8.5" r="1.5" fill="currentColor"/><circle cx="15.5" cy="8.5" r="1.5" fill="currentColor"/><circle cx="8.5" cy="15.5" r="1.5" fill="currentColor"/><circle cx="15.5" cy="15.5" r="1.5" fill="currentColor"/></svg>, component: 'UuidTools', category: 'development', defaultWidth: 800, defaultHeight: 650, minWidth: 500, minHeight: 450, resizable: true, multiple: false },
  { id: 'emoji-browser', name: '表情浏览器', icon: <svg viewBox="0 0 24 24" width="18" height="18" stroke="currentColor" strokeWidth="2" fill="none"><circle cx="12" cy="12" r="10"/><path d="M8 14s1.5 2 4 2 4-2 4-2M9 9h.01M15 9h.01"/></svg>, component: 'EmojiBrowser', category: 'utilities', defaultWidth: 800, defaultHeight: 700, minWidth: 550, minHeight: 450, resizable: true, multiple: false },
  { id: 'air-quality-monitor', name: '空气质量监测', icon: <AirQualityIcon />, component: 'AirQualityMonitor', category: 'utilities', defaultWidth: 900, defaultHeight: 750, minWidth: 650, minHeight: 500, resizable: true, multiple: false },
  { id: 'devops-tools', name: 'DevOps 工具箱', icon: <svg viewBox="0 0 24 24" width="18" height="18" stroke="currentColor" strokeWidth="2" fill="none"><path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z"/><line x1="7.5" y1="12.5" x2="11.5" y2="16.5"/><line x1="15.5" y1="4.5" x2="19.5" y2="8.5"/></svg>, component: 'DevOpsTools', category: 'development', defaultWidth: 1200, defaultHeight: 850, minWidth: 780, minHeight: 550, resizable: true, multiple: false },
  { id: 'chinese-poetry', name: '中国古诗词', icon: <ChinesePoetryIcon />, component: 'ChinesePoetry', category: 'utilities', defaultWidth: 1000, defaultHeight: 800, minWidth: 680, minHeight: 500, resizable: true, multiple: false },
  { id: 'rss-reader', name: 'RSS 订阅阅读器', icon: <svg viewBox="0 0 24 24" width="18" height="18" stroke="currentColor" strokeWidth="2" fill="none"><circle cx="6" cy="18" r="2" fill="currentColor" stroke="none"/><path d="M4 11a9 9 0 0 1 9 9"/><path d="M4 4a16 16 0 0 1 16 16"/></svg>, component: 'RSSReader', category: 'internet', defaultWidth: 1200, defaultHeight: 850, minWidth: 760, minHeight: 540, resizable: true, multiple: false },
  { id: 'space-explorer', name: '宇宙探索', icon: <SpaceExplorerIcon />, component: 'SpaceExplorer', category: 'internet', defaultWidth: 1200, defaultHeight: 850, minWidth: 800, minHeight: 550, resizable: true, multiple: false },
  { id: 'smart-schedule', name: '智能日程助手', icon: <svg viewBox="0 0 24 24" width="18" height="18" stroke="currentColor" strokeWidth="2" fill="none"><rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/><path d="M8 14h.01M12 14h.01M16 14h.01M8 18h.01M12 18h.01"/></svg>, component: 'SmartScheduleAssistant', category: 'office', defaultWidth: 1000, defaultHeight: 750, minWidth: 700, minHeight: 500, resizable: true, multiple: false },
  { id: 'system-assistant', name: '系统助手', icon: <SystemAssistantIcon />, component: 'SystemAssistant', category: 'system', defaultWidth: 900, defaultHeight: 700, minWidth: 650, minHeight: 500, resizable: true, multiple: false },
  { id: 'knowledge-cards', name: '知识卡片记忆', icon: <svg viewBox="0 0 24 24" width="18" height="18" stroke="currentColor" strokeWidth="2" fill="none"><rect x="2" y="3" width="20" height="14" rx="2"/><line x1="2" y1="17" x2="22" y2="17"/><line x1="8" y1="21" x2="16" y2="21"/><circle cx="12" cy="10" r="2" fill="currentColor" stroke="none"/></svg>, component: 'KnowledgeCards', category: 'office', defaultWidth: 1100, defaultHeight: 800, minWidth: 750, minHeight: 550, resizable: true, multiple: false },
  { id: 'css-toolbox', name: 'CSS 工具箱', icon: <svg viewBox="0 0 24 24" width="18" height="18" stroke="currentColor" strokeWidth="2" fill="none"><path d="M4 4h16l-2 16H6L4 4z"/><path d="M8 10h8M8 14h8"/></svg>, component: 'CSSToolbox', category: 'development', defaultWidth: 1250, defaultHeight: 850, minWidth: 900, minHeight: 650, resizable: true, multiple: false },
  { id: 'markdown-editor-pro', name: 'Markdown编辑器Pro', icon: <svg viewBox="0 0 24 24" width="18" height="18" stroke="currentColor" strokeWidth="2" fill="none"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="9" y1="15" x2="15" y2="15"/><line x1="9" y1="11" x2="15" y2="11"/></svg>, component: 'MarkdownEditorPro', category: 'office', defaultWidth: 1200, defaultHeight: 800, minWidth: 800, minHeight: 600, resizable: true, multiple: false },
  { id: 'realtime-data-dashboard', name: '实时数据仪表板', icon: <svg viewBox="0 0 24 24" width="18" height="18" stroke="currentColor" strokeWidth="2" fill="none"><rect x="3" y="3" width="18" height="18" rx="2"/><path d="M3 9h18M9 21V9"/><rect x="7" y="11" width="3" height="6" fill="currentColor" stroke="none"/><rect x="11" y="13" width="3" height="4" fill="currentColor" stroke="none"/><rect x="15" y="10" width="3" height="7" fill="currentColor" stroke="none"/></svg>, component: 'RealTimeDataDashboard', category: 'utilities', defaultWidth: 1200, defaultHeight: 850, minWidth: 900, minHeight: 650, resizable: true, multiple: false },
  // === v3.2.0 新增安全与设计工具 ===
  { id: 'jwt-decoder', name: 'JWT 解码与验证', icon: <svg viewBox="0 0 24 24" width="18" height="18" stroke="currentColor" strokeWidth="2" fill="none"><rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/><circle cx="12" cy="16" r="1.5" fill="currentColor" stroke="none"/></svg>, component: 'JwtDecoder', category: 'development', defaultWidth: 1100, defaultHeight: 750, minWidth: 800, minHeight: 600, resizable: true, multiple: false },
  { id: 'color-palette-extractor', name: '配色方案提取器', icon: <svg viewBox="0 0 24 24" width="18" height="18" stroke="currentColor" strokeWidth="2" fill="none"><circle cx="12" cy="12" r="9"/><circle cx="8" cy="9" r="1.5" fill="currentColor" stroke="none"/><circle cx="15" cy="8" r="1.5" fill="currentColor" stroke="none"/><circle cx="16" cy="14" r="1.5" fill="currentColor" stroke="none"/><circle cx="10" cy="15" r="1.5" fill="currentColor" stroke="none"/></svg>, component: 'ColorPaletteExtractor', category: 'utilities', defaultWidth: 1100, defaultHeight: 800, minWidth: 800, minHeight: 600, resizable: true, multiple: false },
  { id: 'password-strength', name: '密码强度分析', icon: <svg viewBox="0 0 24 24" width="18" height="18" stroke="currentColor" strokeWidth="2" fill="none"><path d="M12 2L4 6v6c0 5 3.5 9 8 10 4.5-1 8-5 8-10V6l-8-4z"/><path d="M9 12l2 2 4-4"/></svg>, component: 'PasswordStrength', category: 'utilities', defaultWidth: 950, defaultHeight: 800, minWidth: 700, minHeight: 600, resizable: true, multiple: false },
  // === v5.0.0 新增创新工具应用 ===
  // === v6.4.0 新增知识管理与内容收藏应用 ===
  { id: 'knowledge-garden', name: '知识花园', icon: <svg viewBox="0 0 24 24" width="18" height="18" stroke="currentColor" strokeWidth="2" fill="none"><circle cx="12" cy="12" r="9"/><circle cx="12" cy="12" r="4"/><path d="M12 3v3M12 18v3M3 12h3M18 12h3M5.6 5.6l2.1 2.1M16.3 16.3l2.1 2.1M5.6 18.4l2.1-2.1M16.3 7.7l2.1-2.1"/></svg>, component: 'KnowledgeGarden', category: 'office', defaultWidth: 1200, defaultHeight: 800, minWidth: 900, minHeight: 600, resizable: true, multiple: false },
  { id: 'web-clipper', name: '网页剪藏', icon: <svg viewBox="0 0 24 24" width="18" height="18" stroke="currentColor" strokeWidth="2" fill="none"><path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z"/></svg>, component: 'WebClipper', category: 'utilities', defaultWidth: 1100, defaultHeight: 800, minWidth: 850, minHeight: 600, resizable: true, multiple: false },
  // === v7.0.0 新增AI智能中心与实用工具聚合 ===
  { id: 'icon-gallery', name: '图标画廊', icon: <svg viewBox="0 0 24 24" width="18" height="18" stroke="currentColor" strokeWidth="2" fill="none"><rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8.5" cy="8.5" r="1.5"/><path d="M21 15l-5-5L5 21"/></svg>, component: 'IconGallery', category: 'utilities', defaultWidth: 1000, defaultHeight: 750, minWidth: 800, minHeight: 600, resizable: true, multiple: false },
  
  { id: 'api-explorer', name: 'API探索器', icon: <ApiIcon />, component: 'APIExplorer', category: 'development', defaultWidth: 1100, defaultHeight: 800, minWidth: 850, minHeight: 600, resizable: true, multiple: false },
  // === v8.0.0 新增创新应用 ===
  // === v8.1.0 新增公共 API 集成应用 ===
  { id: 'github-profile', name: 'GitHub 资料', icon: <svg viewBox="0 0 24 24" width="18" height="18" stroke="currentColor" strokeWidth="2" fill="none"><path d="M9 19c-5 1.5-5-2.5-7-3m14 6v-3.87a3.37 3.37 0 0 0-.94-2.61c3.14-.35 6.44-1.54 6.44-7A5.44 5.44 0 0 0 20 4.77 5.07 5.07 0 0 0 19.91 1S18.73.65 16 2.48a13.38 13.38 0 0 0-7 0C6.27.65 5.09 1 5.09 1A5.07 5.07 0 0 0 5 4.77a5.44 5.44 0 0 0-1.5 3.78c0 5.42 3.3 6.61 6.44 7A3.37 3.37 0 0 0 9 18.13V22"/></svg>, component: 'GitHubProfile', category: 'development', defaultWidth: 1200, defaultHeight: 850, minWidth: 800, minHeight: 600, resizable: true, multiple: false },
  // === v8.2.0 新增实用工具 ===
  { id: 'hash-generator', name: 'Hash 生成器', icon: <svg viewBox="0 0 24 24" width="18" height="18" stroke="currentColor" strokeWidth="2" fill="none"><line x1="4" y1="9" x2="20" y2="9"/><line x1="4" y1="15" x2="20" y2="15"/><line x1="10" y1="3" x2="8" y2="21"/><line x1="16" y1="3" x2="14" y2="21"/></svg>, component: 'HashGenerator', category: 'development', defaultWidth: 800, defaultHeight: 700, minWidth: 600, minHeight: 500, resizable: true, multiple: false },
  // === v9.0.0 新增创新应用 ===
  { id: 'network-status-dashboard', name: '网络状态仪表盘', icon: <svg viewBox="0 0 24 24" width="18" height="18" stroke="currentColor" strokeWidth="2" fill="none"><circle cx="12" cy="12" r="10"/><path d="M2 12h20M12 2a15 15 0 0 1 4 10 15 15 0 0 1-4 10 15 15 0 0 1-4-10 15 15 0 0 1 4-10z"/><circle cx="12" cy="12" r="3" fill="currentColor" stroke="none"/><path d="M6 8l6 4M12 12l6-4"/></svg>, component: 'NetworkStatusDashboard', category: 'system', defaultWidth: 1100, defaultHeight: 800, minWidth: 850, minHeight: 600, resizable: true, multiple: false },
  // === v9.2.0 新增工作流自动化应用 ===
  { id: 'workflow-automation', name: '工作流自动化', icon: <svg viewBox="0 0 24 24" width="18" height="18" stroke="currentColor" strokeWidth="2" fill="none"><rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/><rect x="3" y="14" width="7" height="7" rx="1"/><rect x="14" y="14" width="7" height="7" rx="1"/><path d="M10 6.5h4M6.5 10v4M17.5 10v4M10 17.5h4"/></svg>, component: 'WorkflowAutomation', category: 'utilities', defaultWidth: 1200, defaultHeight: 800, minWidth: 900, minHeight: 600, resizable: true, multiple: false },
  // === v10.0.0 新增创新协作与监控工具 ===
  { id: 'markdown-collaborator', name: '实时Markdown协作编辑器', icon: <svg viewBox="0 0 24 24" width="18" height="18" stroke="currentColor" strokeWidth="2" fill="none"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="9" y1="15" x2="15" y2="15"/><line x1="9" y1="11" x2="15" y2="11"/><circle cx="18" cy="18" r="3" fill="currentColor" stroke="none"/><circle cx="6" cy="18" r="3" fill="currentColor" stroke="none"/></svg>, component: 'MarkdownCollaborator', category: 'office', defaultWidth: 1300, defaultHeight: 900, minWidth: 1000, minHeight: 700, resizable: true, multiple: false },
  { id: 'api-health-monitor', name: 'API健康监控中心', icon: <svg viewBox="0 0 24 24" width="18" height="18" stroke="currentColor" strokeWidth="2" fill="none"><circle cx="12" cy="12" r="10"/><path d="M2 12h20M12 2a15 15 0 0 1 4 10 15 15 0 0 1-4 10 15 15 0 0 1-4-10 15 15 0 0 1 4-10z"/><circle cx="12" cy="12" r="2" fill="currentColor"/><path d="M8 10l4 2 4-2"/><path d="M12 14v4"/></svg>, component: 'APIHealthMonitor', category: 'utilities', defaultWidth: 1300, defaultHeight: 900, minWidth: 1000, minHeight: 700, resizable: true, multiple: false },
  // === v10.0.0 新增创新协作与监控工具 ===
  // === v13.0.0 新增创新应用 ===
  { id: 'code-interview-prep', name: '编程面试准备', icon: <svg viewBox="0 0 24 24" width="18" height="18" stroke="currentColor" strokeWidth="2" fill="none"><path d="M16 18l6-6-6-6"/><path d="M8 6l-6 6 6 6"/><path d="M14 4l-4 16"/></svg>, component: 'CodeInterviewPrep', category: 'development', defaultWidth: 1200, defaultHeight: 850, minWidth: 900, minHeight: 650, resizable: true, multiple: false },
  // === v14.0 新增实用工具应用 ===
  // === v15.0 新增创新应用 ===
  { id: 'web-ide', name: 'WebIDE 在线开发环境', icon: <Code2Icon />, component: 'WebIDE', category: 'development', defaultWidth: 1300, defaultHeight: 900, minWidth: 950, minHeight: 700, resizable: true, multiple: false },
  { id: 'global-search', name: '全局搜索中心', icon: <SearchIcon />, component: 'GlobalSearch', category: 'utilities', defaultWidth: 1000, defaultHeight: 750, minWidth: 750, minHeight: 550, resizable: true, multiple: false },
  { id: 'wikipedia-explorer', name: '维基百科探索', icon: <WikipediaReaderIcon />, component: 'WikipediaExplorer', category: 'internet', defaultWidth: 1100, defaultHeight: 800, minWidth: 800, minHeight: 600, resizable: true, multiple: false },
  // === v19.0 新增实时全球情报仪表盘（集成多个免费公开 API） ===
  { id: 'world-pulse', name: 'WorldPulse 全球脉搏', icon: <svg viewBox="0 0 24 24" width="18" height="18" stroke="currentColor" strokeWidth="2" fill="none"><circle cx="12" cy="12" r="10"/><path d="M2 12h20M12 2a15 15 0 0 1 4 10 15 15 0 0 1-4 10 15 15 0 0 1-4-10 15 15 0 0 1 4-10z"/><circle cx="12" cy="12" r="2.5" fill="currentColor" stroke="none"/><path d="M12 4v3M12 17v3M4 12h3M17 12h3"/></svg>, component: 'WorldPulse', category: 'internet', defaultWidth: 1280, defaultHeight: 860, minWidth: 900, minHeight: 640, resizable: true, multiple: false },
  // === v20.0 新增智能综合仪表盘 ===
  // === v24.0 新增AI助手Ultra（增强版智能助手）===
  // === v25.0 新增灵感流 - 快速捕捉想法与灵感 ===
  { id: 'idea-stream', name: '灵感流', icon: <svg viewBox="0 0 24 24" width="18" height="18" stroke="currentColor" strokeWidth="2" fill="none"><path d="M9 18h6M10 22h4M12 2a7 7 0 0 0-4 12.7c.6.5 1 1.3 1 2.1V18h6v-1.2c0-.8.4-1.6 1-2.1A7 7 0 0 0 12 2z"/><path d="M12 6v6M9 9l3 3 3-3"/></svg>, component: 'IdeaStream', category: 'office', defaultWidth: 820, defaultHeight: 720, minWidth: 560, minHeight: 480, resizable: true, multiple: false },
  // === v27.0 新增创新应用 - NexusAI 智能中枢与 DevForge 开发者锻造台 ===
  { id: 'nexus-ai', name: 'NexusAI 真实AI助手', icon: <svg viewBox="0 0 24 24" width="18" height="18" stroke="currentColor" strokeWidth="2" fill="none"><polygon points="12 2 2 7 12 12 22 7 12 2"/><polyline points="2 17 12 22 22 17"/><polyline points="2 12 12 17 22 12"/><circle cx="12" cy="12" r="3" fill="currentColor" stroke="none"/></svg>, component: 'NexusAI', category: 'utilities', defaultWidth: 1000, defaultHeight: 720, minWidth: 700, minHeight: 500, resizable: true, multiple: false, isNew: true, description: '基于 Pollinations.ai 的真实联网大模型对话（GPT-4o/DeepSeek/Llama），无需 API Key，支持流式输出与图像生成' },
  { id: 'dev-forge', name: 'DevForge 开发者锻造台', icon: <svg viewBox="0 0 24 24" width="18" height="18" stroke="currentColor" strokeWidth="2" fill="none"><path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z"/></svg>, component: 'DevForge', category: 'development', defaultWidth: 1000, defaultHeight: 700, minWidth: 700, minHeight: 500, resizable: true, multiple: false },
  // === v29.0 新增核心实用工具 ===
  { id: 'live-info-center', name: '实时信息中心', icon: <ActivityIcon />, component: 'LiveInfoCenter', category: 'internet', defaultWidth: 1200, defaultHeight: 850, minWidth: 900, minHeight: 650, resizable: true, multiple: false },
  // === v33.0 新增创新实用工具 ===
  { id: 'live-dashboard', name: 'Live Dashboard 实时仪表板', icon: <svg viewBox="0 0 24 24" width="18" height="18" stroke="currentColor" strokeWidth="2" fill="none"><rect x="3" y="3" width="18" height="18" rx="2"/><path d="M3 9h18M9 21V9"/><path d="M7 14l2 2 3-4"/></svg>, component: 'LiveDashboard', category: 'utilities', defaultWidth: 1200, defaultHeight: 800, minWidth: 900, minHeight: 600, resizable: true, multiple: false },
  // === v33.0 新增实时数据中心（集成真实公开API） ===
  { id: 'live-data-hub', name: '实时数据中心', icon: <ActivityIcon />, component: 'LiveDataHub', category: 'internet', defaultWidth: 950, defaultHeight: 780, minWidth: 700, minHeight: 550, resizable: true, multiple: false },
  // === v36.0 全新一代创新应用：AI Workbench / Knowledge Vine / CodeForge ===
  { id: 'ai-workbench', name: 'AI Workbench 智能工作台', icon: <SparklesIcon />, component: 'AIWorkbench', category: 'utilities', defaultWidth: 1280, defaultHeight: 820, minWidth: 1000, minHeight: 700, resizable: true, multiple: false },
  { id: 'code-forge', name: 'CodeForge 开发者工具集', icon: <Code2Icon />, component: 'CodeForge', category: 'development', defaultWidth: 1280, defaultHeight: 820, minWidth: 1000, minHeight: 700, resizable: true, multiple: false },
  { id: 'github-trending-app', name: 'GitHub 趋势', icon: <GitHubIcon />, component: 'GitHubTrendingApp', category: 'development', defaultWidth: 1000, defaultHeight: 750, minWidth: 700, minHeight: 500, resizable: true, multiple: false },
  { id: 'css-gradient', name: 'CSS 渐变工作室', icon: <PaletteIcon />, component: 'CssGradientStudio', category: 'development', defaultWidth: 1100, defaultHeight: 720, minWidth: 800, minHeight: 540, resizable: true, multiple: false },
  { id: 'git-cheatsheet', name: 'Git 命令速查', icon: <Code2Icon />, component: 'GitCheatsheet', category: 'development', defaultWidth: 900, defaultHeight: 700, minWidth: 600, minHeight: 500, resizable: true, multiple: false },
  // 注：APIHealthMonitor 已以 api-health-monitor 注册（utilities），此处移除重复的 api-health 条目
  { id: 'activity-heatmap', name: '活动热力图', icon: <ActivityIcon />, component: 'ActivityHeatmap', category: 'utilities', defaultWidth: 900, defaultHeight: 600, minWidth: 600, minHeight: 450, resizable: true, multiple: false },
  // regex-visualizer 已在 APP_REGISTRY_EXTRAS 中注册（v128），此处移除重复条目
  // === v39.0 全新创新应用 - Snap Studio 浏览器原生图片工坊 ===
  { id: 'snap-studio', name: 'Snap Studio 美图工坊', icon: <svg viewBox="0 0 24 24" width="18" height="18" stroke="currentColor" strokeWidth="2" fill="none"><path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"/><circle cx="12" cy="13" r="4"/></svg>, component: 'SnapStudio', category: 'multimedia', defaultWidth: 1200, defaultHeight: 820, minWidth: 900, minHeight: 600, resizable: true, multiple: false, isNew: true, description: 'Canvas 像素级图片编辑器：滤镜、微调、缩放、撤销重做、多格式导出' },
  // === v41.0 创新功能扩展 — 真实可用的开发者工具 ===
  { id: 'system-info-pro', name: '系统信息诊断', icon: <InfoIcon />, component: 'SystemInfoPro', category: 'system', defaultWidth: 1150, defaultHeight: 800, minWidth: 850, minHeight: 600, resizable: true, multiple: false, isNew: true, description: '详细的浏览器与系统信息诊断：CPU核心数、内存估算、电池状态、网络类型、屏幕信息、字体能力、权限状态、WebGL能力、CPU压力测试、实时性能监控' },
  { id: 'web-code-runner', name: 'Web代码运行器', icon: <Code2Icon />, component: 'WebCodeRunner', category: 'development', defaultWidth: 1150, defaultHeight: 780, minWidth: 800, minHeight: 550, resizable: true, multiple: false, isNew: true, description: '浏览器内 JavaScript 真实执行环境：代码编辑器、控制台输出、错误捕获、预设代码片段、执行时间测量、历史记录、代码分享链接' },
  // === v40.0 创新功能扩展 ===
  // 注意：以下 ...APP_REGISTRY_EXTRAS 必须放在 appRegistry 数组末尾，
  // 否则会被后续字面量项覆盖。
  ...(APP_REGISTRY_EXTRAS as AppDefinition[]),
] as AppDefinition[]