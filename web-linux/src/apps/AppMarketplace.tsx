import { useState, useEffect, useMemo, useCallback } from 'react'

// ─── 类型定义 ────────────────────────────────────────────────

type Category = 'all' | 'development' | 'office' | 'internet' | 'multimedia' | 'system' | 'utilities' | 'games' | 'ai'
type SortBy = 'name' | 'rating' | 'downloads' | 'updated'
type ViewMode = 'grid' | 'list'

interface AppInfo {
  id: string
  name: string
  description: string
  version: string
  category: Category
  size: string
  sizeBytes: number
  downloads: number
  rating: number
  icon: string
  featured: boolean
  lastUpdated: string
  changelog: string
  screenshots: number
}

interface InstallRecord {
  id: string
  installDate: string
  version: string
}

interface UserRating {
  appId: string
  rating: number
}

// ─── 常量 ────────────────────────────────────────────────────

const STORAGE_KEY_INSTALLED = 'weblinux_marketplace_installed'
const STORAGE_KEY_RATINGS = 'weblinux_marketplace_ratings'
const STORAGE_KEY_DOWNLOADS = 'weblinux_marketplace_downloads'

const CATEGORY_LIST: { id: Category; name: string; icon: string; color: string }[] = [
  { id: 'all', name: '全部', icon: '🏪', color: '#7c3aed' },
  { id: 'development', name: '开发', icon: '💻', color: '#7c3aed' },
  { id: 'office', name: '办公', icon: '📝', color: '#38bdf8' },
  { id: 'internet', name: '互联网', icon: '🌐', color: '#34d399' },
  { id: 'multimedia', name: '多媒体', icon: '🎬', color: '#f472b6' },
  { id: 'system', name: '系统', icon: '⚙️', color: '#fbbf24' },
  { id: 'utilities', name: '工具', icon: '🔧', color: '#a78bfa' },
  { id: 'games', name: '游戏', icon: '🎮', color: '#fb923c' },
  { id: 'ai', name: 'AI', icon: '🤖', color: '#22d3ee' },
]

const APP_CATALOG: AppInfo[] = [
  // ── Development ──
  { id: 'code-editor', name: 'Code Editor', description: '专业代码编辑器，支持语法高亮、自动补全、多标签页和集成终端', version: '3.2.1', category: 'development', size: '12.4 MB', sizeBytes: 13002342, downloads: 284300, rating: 4.8, icon: '📝', featured: true, lastUpdated: '2025-08-10', changelog: '新增 LSP 支持，性能优化', screenshots: 5 },
  { id: 'git-manager', name: 'Git Manager', description: 'Git 版本控制图形化工具，支持分支管理、合并冲突解决和代码审查', version: '2.8.0', category: 'development', size: '8.6 MB', sizeBytes: 9028096, downloads: 196700, rating: 4.6, icon: '🔀', featured: false, lastUpdated: '2025-07-28', changelog: '新增交互式 rebase', screenshots: 4 },
  { id: 'terminal-pro', name: 'Terminal Pro', description: '高级终端模拟器，支持多会话、分屏、自定义主题和命令补全', version: '5.1.0', category: 'development', size: '6.2 MB', sizeBytes: 6501171, downloads: 342100, rating: 4.9, icon: '⬛', featured: true, lastUpdated: '2025-08-15', changelog: '新增 GPU 加速渲染', screenshots: 6 },
  { id: 'api-tester', name: 'API Tester', description: 'REST/GraphQL API 测试工具，支持环境变量、自动化测试和性能基准', version: '1.9.3', category: 'development', size: '4.8 MB', sizeBytes: 5033164, downloads: 89200, rating: 4.4, icon: '🔌', featured: false, lastUpdated: '2025-06-20', changelog: '新增 WebSocket 支持', screenshots: 3 },
  { id: 'regex-builder', name: 'Regex Builder', description: '可视化正则表达式构建器，实时匹配预览和常用模式库', version: '2.3.1', category: 'development', size: '2.1 MB', sizeBytes: 2202009, downloads: 67400, rating: 4.5, icon: '🔍', featured: false, lastUpdated: '2025-07-05', changelog: '新增正则可视化图表', screenshots: 3 },
  { id: 'docker-ui', name: 'Docker UI', description: 'Docker 容器管理界面，支持镜像构建、容器编排和日志查看', version: '1.4.2', category: 'development', size: '9.3 MB', sizeBytes: 9751756, downloads: 72100, rating: 4.3, icon: '🐳', featured: false, lastUpdated: '2025-05-30', changelog: '新增 Compose 支持', screenshots: 4 },

  // ── Office ──
  { id: 'doc-writer', name: 'Doc Writer', description: '文档写作工具，支持 Markdown、富文本和协作文档编辑', version: '4.0.0', category: 'office', size: '15.7 MB', sizeBytes: 16462643, downloads: 412300, rating: 4.7, icon: '📄', featured: true, lastUpdated: '2025-08-12', changelog: '全新协作引擎上线', screenshots: 6 },
  { id: 'spreadsheet-pro', name: 'Spreadsheet Pro', description: '电子表格应用，支持公式、数据透视表、图表和条件格式', version: '3.5.2', category: 'office', size: '18.3 MB', sizeBytes: 19189022, downloads: 298600, rating: 4.6, icon: '📊', featured: true, lastUpdated: '2025-08-08', changelog: '新增 XLOOKUP 函数', screenshots: 5 },
  { id: 'presentation', name: 'Presentation', description: '演示文稿制作工具，丰富模板、动画效果和远程演示功能', version: '2.7.0', category: 'office', size: '22.1 MB', sizeBytes: 23173529, downloads: 156800, rating: 4.4, icon: '📽️', featured: false, lastUpdated: '2025-07-18', changelog: '新增 AI 排版建议', screenshots: 4 },
  { id: 'pdf-viewer', name: 'PDF Viewer', description: 'PDF 阅读器，支持注释、签名、表单填写和 OCR 文字识别', version: '3.1.0', category: 'office', size: '11.5 MB', sizeBytes: 12058624, downloads: 387200, rating: 4.5, icon: '📕', featured: false, lastUpdated: '2025-07-22', changelog: '新增批注导出功能', screenshots: 4 },
  { id: 'note-app', name: 'Note App', description: '智能笔记应用，支持双向链接、知识图谱和全文搜索', version: '2.9.1', category: 'office', size: '7.8 MB', sizeBytes: 8178892, downloads: 223400, rating: 4.7, icon: '📒', featured: true, lastUpdated: '2025-08-14', changelog: '新增白板嵌入', screenshots: 5 },
  { id: 'calendar-pro', name: 'Calendar Pro', description: '日历与日程管理，支持多日历同步、智能提醒和会议安排', version: '2.4.0', category: 'office', size: '5.4 MB', sizeBytes: 5662310, downloads: 178900, rating: 4.3, icon: '📅', featured: false, lastUpdated: '2025-06-15', changelog: '新增自然语言日程创建', screenshots: 3 },

  // ── Internet ──
  { id: 'web-browser', name: 'Web Browser', description: '现代化浏览器，支持多标签页、广告拦截、隐私模式和扩展', version: '6.2.0', category: 'internet', size: '45.3 MB', sizeBytes: 47511910, downloads: 892400, rating: 4.8, icon: '🌍', featured: true, lastUpdated: '2025-08-16', changelog: '新增 WebGPU 支持', screenshots: 6 },
  { id: 'email-client', name: 'Email Client', description: '邮件客户端，支持多账户、智能分类、PGP 加密和日历集成', version: '3.3.1', category: 'internet', size: '13.6 MB', sizeBytes: 14260633, downloads: 245600, rating: 4.5, icon: '✉️', featured: false, lastUpdated: '2025-07-30', changelog: '新增统一收件箱', screenshots: 5 },
  { id: 'messenger', name: 'Messenger', description: '即时通讯应用，支持端到端加密、群组聊天和文件分享', version: '4.1.0', category: 'internet', size: '9.8 MB', sizeBytes: 10276045, downloads: 567800, rating: 4.6, icon: '💬', featured: false, lastUpdated: '2025-08-05', changelog: '新增语音消息', screenshots: 4 },
  { id: 'rss-reader', name: 'RSS Reader', description: 'RSS 订阅阅读器，支持 OPML 导入、离线阅读和智能推荐', version: '2.1.3', category: 'internet', size: '3.4 MB', sizeBytes: 3565158, downloads: 45200, rating: 4.2, icon: '📡', featured: false, lastUpdated: '2025-05-12', changelog: '新增阅读进度同步', screenshots: 3 },
  { id: 'vpn-client', name: 'VPN Client', description: 'VPN 客户端，支持多协议、分流规则和连接状态监控', version: '1.8.0', category: 'internet', size: '6.1 MB', sizeBytes: 6396313, downloads: 134200, rating: 4.4, icon: '🛡️', featured: false, lastUpdated: '2025-07-08', changelog: '新增 WireGuard 协议', screenshots: 3 },

  // ── Multimedia ──
  { id: 'music-player', name: 'Music Player', description: '音乐播放器，支持无损音频、歌词显示、均衡器和播放列表', version: '3.6.0', category: 'multimedia', size: '8.9 MB', sizeBytes: 9332320, downloads: 312500, rating: 4.6, icon: '🎵', featured: true, lastUpdated: '2025-08-11', changelog: '新增空间音频', screenshots: 5 },
  { id: 'video-player', name: 'Video Player', description: '全能视频播放器，支持 4K、字幕、倍速和画中画模式', version: '4.2.1', category: 'multimedia', size: '16.4 MB', sizeBytes: 17196646, downloads: 456700, rating: 4.7, icon: '▶️', featured: false, lastUpdated: '2025-08-03', changelog: '新增 HDR 支持', screenshots: 4 },
  { id: 'image-editor', name: 'Image Editor', description: '图片编辑器，支持图层、滤镜、AI 抠图和批量处理', version: '2.5.0', category: 'multimedia', size: '21.2 MB', sizeBytes: 22229811, downloads: 189300, rating: 4.5, icon: '🎨', featured: true, lastUpdated: '2025-08-13', changelog: '新增 AI 风格迁移', screenshots: 6 },
  { id: 'screen-recorder', name: 'Screen Recorder', description: '屏幕录制工具，支持区域录制、系统声音和实时标注', version: '1.7.2', category: 'multimedia', size: '7.5 MB', sizeBytes: 7864320, downloads: 98400, rating: 4.3, icon: '🎬', featured: false, lastUpdated: '2025-06-25', changelog: '新增 GIF 导出', screenshots: 3 },
  { id: 'audio-editor', name: 'Audio Editor', description: '音频编辑工具，支持多轨混音、降噪和效果器链', version: '2.0.0', category: 'multimedia', size: '10.8 MB', sizeBytes: 11324620, downloads: 56300, rating: 4.2, icon: '🎙️', featured: false, lastUpdated: '2025-05-20', changelog: '全新多轨引擎', screenshots: 4 },

  // ── System ──
  { id: 'system-monitor', name: 'System Monitor', description: '系统资源监视器，实时显示 CPU、内存、磁盘和网络使用情况', version: '3.8.0', category: 'system', size: '4.2 MB', sizeBytes: 4404019, downloads: 423100, rating: 4.7, icon: '📊', featured: true, lastUpdated: '2025-08-09', changelog: '新增 GPU 监控', screenshots: 5 },
  { id: 'disk-analyzer', name: 'Disk Analyzer', description: '磁盘空间分析器，可视化文件大小分布，快速清理大文件', version: '2.3.1', category: 'system', size: '3.6 MB', sizeBytes: 3774873, downloads: 167800, rating: 4.4, icon: '💾', featured: false, lastUpdated: '2025-07-14', changelog: '新增重复文件检测', screenshots: 3 },
  { id: 'task-manager', name: 'Task Manager', description: '任务管理器，查看和管理运行中的进程、服务和启动项', version: '4.0.1', category: 'system', size: '5.1 MB', sizeBytes: 5347737, downloads: 356200, rating: 4.5, icon: '📋', featured: false, lastUpdated: '2025-08-01', changelog: '新增性能评分', screenshots: 4 },
  { id: 'backup-tool', name: 'Backup Tool', description: '系统备份与恢复工具，支持增量备份、计划任务和云端同步', version: '1.5.0', category: 'system', size: '6.8 MB', sizeBytes: 7130316, downloads: 89100, rating: 4.1, icon: '🗃️', featured: false, lastUpdated: '2025-06-08', changelog: '新增加密备份', screenshots: 3 },
  { id: 'settings-center', name: 'Settings Center', description: '系统设置中心，一站式管理显示、网络、声音和隐私配置', version: '5.0.0', category: 'system', size: '7.3 MB', sizeBytes: 7654604, downloads: 890100, rating: 4.6, icon: '⚙️', featured: false, lastUpdated: '2025-08-17', changelog: '全新设置界面', screenshots: 5 },
  { id: 'firewall-config', name: 'Firewall Config', description: '防火墙配置工具，管理入站出站规则和应用网络权限', version: '2.1.0', category: 'system', size: '3.9 MB', sizeBytes: 4089446, downloads: 67200, rating: 4.0, icon: '🔥', featured: false, lastUpdated: '2025-04-22', changelog: '新增应用级规则', screenshots: 3 },

  // ── Utilities ──
  { id: 'calculator', name: 'Calculator', description: '科学计算器，支持单位换算、历史记录和程序员模式', version: '2.6.0', category: 'utilities', size: '1.8 MB', sizeBytes: 1887436, downloads: 534200, rating: 4.5, icon: '🧮', featured: false, lastUpdated: '2025-07-20', changelog: '新增大数计算', screenshots: 3 },
  { id: 'password-vault', name: 'Password Vault', description: '密码管理器，安全存储密码、自动填充和强度检测', version: '3.4.1', category: 'utilities', size: '4.5 MB', sizeBytes: 4718592, downloads: 278900, rating: 4.8, icon: '🔐', featured: true, lastUpdated: '2025-08-06', changelog: '新增硬件密钥支持', screenshots: 4 },
  { id: 'file-compressor', name: 'File Compressor', description: '文件压缩/解压工具，支持 ZIP、RAR、7Z 和 TAR 格式', version: '1.9.0', category: 'utilities', size: '3.2 MB', sizeBytes: 3355443, downloads: 198400, rating: 4.3, icon: '📦', featured: false, lastUpdated: '2025-06-30', changelog: '新增并行压缩', screenshots: 3 },
  { id: 'clipboard-manager', name: 'Clipboard Manager', description: '剪贴板管理器，历史记录、固定条目和跨设备同步', version: '2.2.0', category: 'utilities', size: '2.4 MB', sizeBytes: 2516582, downloads: 145600, rating: 4.4, icon: '📋', featured: false, lastUpdated: '2025-07-10', changelog: '新增智能分类', screenshots: 3 },
  { id: 'color-picker', name: 'Color Picker', description: '专业取色器，支持多种格式、调色板和对比度检查', version: '1.6.1', category: 'utilities', size: '1.2 MB', sizeBytes: 1258291, downloads: 78300, rating: 4.3, icon: '🎯', featured: false, lastUpdated: '2025-05-28', changelog: '新增 WCAG 检查', screenshots: 2 },
  { id: 'qr-generator', name: 'QR Generator', description: '二维码生成与扫描工具，支持自定义样式和批量生成', version: '1.3.0', category: 'utilities', size: '1.5 MB', sizeBytes: 1572864, downloads: 56700, rating: 4.1, icon: '📱', featured: false, lastUpdated: '2025-04-15', changelog: '新增 SVG 导出', screenshots: 2 },

  // ── Games ──
  { id: 'game-snake', name: 'Snake Game', description: '经典贪吃蛇游戏，多种难度和主题皮肤', version: '1.4.0', category: 'games', size: '0.8 MB', sizeBytes: 838860, downloads: 234500, rating: 4.2, icon: '🐍', featured: false, lastUpdated: '2025-03-20', changelog: '新增多人模式', screenshots: 3 },
  { id: 'game-2048', name: '2048', description: '数字合并益智游戏，多种棋盘尺寸和撤销功能', version: '1.2.0', category: 'games', size: '0.5 MB', sizeBytes: 524288, downloads: 189600, rating: 4.3, icon: '🔢', featured: false, lastUpdated: '2025-02-14', changelog: '新增 5x5 模式', screenshots: 2 },
  { id: 'game-tetris', name: 'Tetris', description: '经典俄罗斯方块，支持 Hold、Ghost 和 T-Spin 检测', version: '1.8.1', category: 'games', size: '0.9 MB', sizeBytes: 943718, downloads: 312300, rating: 4.5, icon: '🧱', featured: false, lastUpdated: '2025-06-12', changelog: '新增马拉松模式', screenshots: 3 },
  { id: 'game-chess', name: 'Chess', description: '国际象棋，支持人机对弈、棋局分析和在线对战', version: '2.0.0', category: 'games', size: '3.8 MB', sizeBytes: 3984588, downloads: 156700, rating: 4.6, icon: '♟️', featured: false, lastUpdated: '2025-07-25', changelog: '新增 Stockfish 16', screenshots: 4 },
  { id: 'game-sudoku', name: 'Sudoku', description: '数独游戏，多难度等级、提示系统和每日挑战', version: '1.5.2', category: 'games', size: '1.1 MB', sizeBytes: 1153433, downloads: 98400, rating: 4.1, icon: '🧩', featured: false, lastUpdated: '2025-05-18', changelog: '新增变体模式', screenshots: 2 },

  // ── AI ──
  { id: 'ai-chat', name: 'AI Chat', description: 'AI 智能对话助手，支持多轮对话、代码生成和知识问答', version: '4.0.0', category: 'ai', size: '8.2 MB', sizeBytes: 8598323, downloads: 678900, rating: 4.9, icon: '🤖', featured: true, lastUpdated: '2025-08-17', changelog: '全新多模态支持', screenshots: 6 },
  { id: 'ai-translator', name: 'AI Translator', description: 'AI 驱动的翻译工具，支持 100+ 语言、文档翻译和实时语音', version: '2.5.0', category: 'ai', size: '5.6 MB', sizeBytes: 5872025, downloads: 234100, rating: 4.6, icon: '🌐', featured: true, lastUpdated: '2025-08-02', changelog: '新增术语库功能', screenshots: 4 },
  { id: 'ai-code-assist', name: 'AI Code Assist', description: 'AI 代码助手，智能补全、代码解释、重构建议和 Bug 检测', version: '3.1.0', category: 'ai', size: '10.5 MB', sizeBytes: 11010048, downloads: 445600, rating: 4.8, icon: '✨', featured: true, lastUpdated: '2025-08-15', changelog: '新增项目级上下文', screenshots: 5 },
  { id: 'ai-image-gen', name: 'AI Image Gen', description: 'AI 图像生成器，文本到图像、风格迁移和图像编辑', version: '1.8.0', category: 'ai', size: '14.3 MB', sizeBytes: 14994618, downloads: 189200, rating: 4.5, icon: '🖼️', featured: false, lastUpdated: '2025-07-19', changelog: '新增 ControlNet', screenshots: 5 },
  { id: 'ai-summarizer', name: 'AI Summarizer', description: 'AI 文档摘要工具，智能提取要点、生成思维导图', version: '1.4.2', category: 'ai', size: '4.1 MB', sizeBytes: 4298168, downloads: 67800, rating: 4.3, icon: '📑', featured: false, lastUpdated: '2025-06-05', changelog: '新增长文档支持', screenshots: 3 },
  { id: 'ai-voice', name: 'AI Voice', description: 'AI 语音助手，语音识别、文字转语音和实时翻译', version: '2.0.1', category: 'ai', size: '9.7 MB', sizeBytes: 10171392, downloads: 123400, rating: 4.4, icon: '🗣️', featured: false, lastUpdated: '2025-07-12', changelog: '新增语音克隆', screenshots: 4 },
]

// ─── localStorage 辅助 ───────────────────────────────────────

function loadJSON<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(key)
    if (raw) return JSON.parse(raw) as T
  } catch { /* ignore */ }
  return fallback
}

function saveJSON(key: string, data: unknown): void {
  try {
    localStorage.setItem(key, JSON.stringify(data))
  } catch { /* ignore */ }
}

// ─── 格式化 ──────────────────────────────────────────────────

function formatDownloads(n: number): string {
  if (n >= 1_000_000) return (n / 1_000_000).toFixed(1) + 'M'
  if (n >= 1_000) return (n / 1_000).toFixed(1) + 'K'
  return String(n)
}

function daysAgo(dateStr: string): number {
  const d = new Date(dateStr).getTime()
  const now = Date.now()
  return Math.max(0, Math.floor((now - d) / 86400000))
}

// ─── 主组件 ──────────────────────────────────────────────────

export default function AppMarketplace() {
  // 状态
  const [search, setSearch] = useState('')
  const [category, setCategory] = useState<Category>('all')
  const [sortBy, setSortBy] = useState<SortBy>('name')
  const [viewMode, setViewMode] = useState<ViewMode>('grid')
  const [selectedApp, setSelectedApp] = useState<AppInfo | null>(null)
  const [installing, setInstalling] = useState<string | null>(null)
  const [installProgress, setInstallProgress] = useState(0)
  const [userRatings, setUserRatings] = useState<UserRating[]>(() => loadJSON(STORAGE_KEY_RATINGS, []))
  const [installedApps, setInstalledApps] = useState<InstallRecord[]>(() => loadJSON(STORAGE_KEY_INSTALLED, []))
  const [downloadCounts, setDownloadCounts] = useState<Record<string, number>>(() => loadJSON(STORAGE_KEY_DOWNLOADS, {}))

  // 持久化
  useEffect(() => { saveJSON(STORAGE_KEY_INSTALLED, installedApps) }, [installedApps])
  useEffect(() => { saveJSON(STORAGE_KEY_RATINGS, userRatings) }, [userRatings])
  useEffect(() => { saveJSON(STORAGE_KEY_DOWNLOADS, downloadCounts) }, [downloadCounts])

  // 有效下载量（基础 + localStorage 增量）
  const getDownloads = useCallback((app: AppInfo): number => {
    return app.downloads + (downloadCounts[app.id] || 0)
  }, [downloadCounts])

  // 用户评分
  const getUserRating = useCallback((appId: string): number => {
    return userRatings.find(r => r.appId === appId)?.rating || 0
  }, [userRatings])

  // 有效评分（有用户评分则用用户的，否则用默认）
  const getEffectiveRating = useCallback((app: AppInfo): number => {
    const ur = getUserRating(app.id)
    return ur > 0 ? ur : app.rating
  }, [getUserRating])

  // 是否已安装
  const isInstalled = useCallback((appId: string): boolean => {
    return installedApps.some(i => i.id === appId)
  }, [installedApps])

  // 更新可用检测
  const updatesAvailable = useMemo(() => {
    return installedApps.filter(inst => {
      const catalogApp = APP_CATALOG.find(a => a.id === inst.id)
      return catalogApp && catalogApp.version !== inst.version
    })
  }, [installedApps])

  // 筛选与排序
  const filteredApps = useMemo(() => {
    let apps = APP_CATALOG.filter(app => {
      if (category !== 'all' && app.category !== category) return false
      if (search) {
        const q = search.toLowerCase()
        if (!app.name.toLowerCase().includes(q) && !app.description.toLowerCase().includes(q)) return false
      }
      return true
    })
    apps = [...apps].sort((a, b) => {
      switch (sortBy) {
        case 'name': return a.name.localeCompare(b.name)
        case 'rating': return getEffectiveRating(b) - getEffectiveRating(a)
        case 'downloads': return getDownloads(b) - getDownloads(a)
        case 'updated': return new Date(b.lastUpdated).getTime() - new Date(a.lastUpdated).getTime()
        default: return 0
      }
    })
    return apps
  }, [category, search, sortBy, getEffectiveRating, getDownloads])

  // 精选应用
  const featuredApps = useMemo(() => APP_CATALOG.filter(a => a.featured), [])

  // 最近更新
  const recentlyUpdated = useMemo(() => {
    return [...APP_CATALOG]
      .sort((a, b) => new Date(b.lastUpdated).getTime() - new Date(a.lastUpdated).getTime())
      .slice(0, 8)
  }, [])

  // 安装
  const installApp = useCallback((app: AppInfo) => {
    setInstalling(app.id)
    setInstallProgress(0)
    let progress = 0
    const interval = setInterval(() => {
      progress += Math.random() * 18 + 5
      if (progress >= 100) {
        clearInterval(interval)
        setInstalling(null)
        setInstallProgress(0)
        setInstalledApps(prev => {
          if (prev.find(i => i.id === app.id)) return prev
          return [...prev, { id: app.id, installDate: new Date().toLocaleDateString('zh-CN'), version: app.version }]
        })
        setDownloadCounts(prev => ({ ...prev, [app.id]: (prev[app.id] || 0) + 1 }))
      } else {
        setInstallProgress(progress)
      }
    }, 80)
  }, [])

  // 卸载
  const uninstallApp = useCallback((appId: string) => {
    setInstalledApps(prev => prev.filter(i => i.id !== appId))
  }, [])

  // 评分
  const rateApp = useCallback((appId: string, rating: number) => {
    setUserRatings(prev => {
      const next = prev.filter(r => r.appId !== appId)
      next.push({ appId, rating })
      return next
    })
  }, [])

  // 渲染星级
  const renderStars = (rating: number, size = 12): React.ReactNode => {
    const stars: React.ReactNode[] = []
    for (let i = 1; i <= 5; i++) {
      const filled = i <= Math.floor(rating)
      const half = !filled && i - 0.5 <= rating
      stars.push(
        <span
          key={i}
          style={{
            fontSize: `${size}px`,
            color: filled || half ? '#fbbf24' : '#45475a',
            lineHeight: 1,
          }}
          aria-label={`${i}星`}
        >
          {filled ? '★' : half ? '★' : '☆'}
        </span>
      )
    }
    return stars
  }

  // 可交互星级评分
  const renderInteractiveStars = (appId: string, currentRating: number): React.ReactNode => {
    return (
      <div style={{ display: 'flex', gap: '2px' }} role="radiogroup" aria-label="评分">
        {[1, 2, 3, 4, 5].map(star => (
          <button
            key={star}
            onClick={() => rateApp(appId, star)}
            style={{
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              padding: '2px',
              fontSize: '18px',
              color: star <= currentRating ? '#fbbf24' : '#45475a',
              lineHeight: 1,
              transition: 'color 0.15s',
            }}
            onMouseEnter={e => { e.currentTarget.style.color = '#fbbf24' }}
            onMouseLeave={e => { e.currentTarget.style.color = star <= currentRating ? '#fbbf24' : '#45475a' }}
            role="radio"
            aria-checked={star === currentRating}
            aria-label={`${star}星`}
          >
            ★
          </button>
        ))}
      </div>
    )
  }

  // ─── 样式常量 ──────────────────────────────────────────────

  const COLORS = {
    bg: '#0f0f1a',
    surface: 'rgba(30, 30, 50, 0.8)',
    card: 'rgba(40, 40, 65, 0.6)',
    cardHover: 'rgba(50, 50, 80, 0.7)',
    border: 'rgba(124, 58, 237, 0.15)',
    borderHover: 'rgba(124, 58, 237, 0.35)',
    text: '#e2e8f0',
    textSecondary: '#94a3b8',
    textMuted: '#64748b',
    accent: '#7c3aed',
    accentLight: '#a78bfa',
    cyan: '#38bdf8',
    green: '#34d399',
    pink: '#f472b6',
    yellow: '#fbbf24',
    red: '#f87171',
  }

  const glassCard: React.CSSProperties = {
    background: COLORS.card,
    backdropFilter: 'blur(12px)',
    WebkitBackdropFilter: 'blur(12px)',
    border: `1px solid ${COLORS.border}`,
    borderRadius: '12px',
    transition: 'all 0.2s ease',
  }

  // ─── 渲染 ────────────────────────────────────────────────

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        height: '100%',
        background: `linear-gradient(135deg, ${COLORS.bg} 0%, #1a1025 50%, #0f1923 100%)`,
        color: COLORS.text,
        overflow: 'hidden',
        fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
      }}
    >
      {/* ── 顶栏 ── */}
      <header
        style={{
          padding: '12px 16px',
          display: 'flex',
          alignItems: 'center',
          gap: '12px',
          borderBottom: `1px solid ${COLORS.border}`,
          background: COLORS.surface,
          backdropFilter: 'blur(16px)',
          flexShrink: 0,
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexShrink: 0 }}>
          <span style={{ fontSize: '22px' }}>🏪</span>
          <h1 style={{ fontSize: '16px', fontWeight: 700, margin: 0, background: `linear-gradient(135deg, ${COLORS.accent}, ${COLORS.cyan})`, WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
            应用市场
          </h1>
        </div>

        <div style={{ flex: 1, position: 'relative' }}>
          <input
            type="text"
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="搜索应用名称或描述..."
            aria-label="搜索应用"
            style={{
              width: '100%',
              padding: '8px 12px 8px 32px',
              background: 'rgba(15, 15, 26, 0.6)',
              border: `1px solid ${COLORS.border}`,
              borderRadius: '8px',
              color: COLORS.text,
              fontSize: '13px',
              outline: 'none',
              transition: 'border-color 0.2s',
            }}
            onFocus={e => { e.currentTarget.style.borderColor = COLORS.accent }}
            onBlur={e => { e.currentTarget.style.borderColor = COLORS.border }}
          />
          <span style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)', fontSize: '14px', pointerEvents: 'none' }}>🔍</span>
        </div>

        <div style={{ display: 'flex', gap: '6px', flexShrink: 0 }}>
          <button
            onClick={() => setViewMode('grid')}
            aria-label="网格视图"
            style={{
              padding: '6px 8px', border: `1px solid ${viewMode === 'grid' ? COLORS.accent : COLORS.border}`,
              borderRadius: '6px', background: viewMode === 'grid' ? `${COLORS.accent}33` : 'transparent',
              color: viewMode === 'grid' ? COLORS.accentLight : COLORS.textMuted,
              cursor: 'pointer', fontSize: '13px', transition: 'all 0.15s',
            }}
          >⊞</button>
          <button
            onClick={() => setViewMode('list')}
            aria-label="列表视图"
            style={{
              padding: '6px 8px', border: `1px solid ${viewMode === 'list' ? COLORS.accent : COLORS.border}`,
              borderRadius: '6px', background: viewMode === 'list' ? `${COLORS.accent}33` : 'transparent',
              color: viewMode === 'list' ? COLORS.accentLight : COLORS.textMuted,
              cursor: 'pointer', fontSize: '13px', transition: 'all 0.15s',
            }}
          >☰</button>
        </div>

        <select
          value={sortBy}
          onChange={e => setSortBy(e.target.value as SortBy)}
          aria-label="排序方式"
          style={{
            padding: '7px 10px', background: 'rgba(15, 15, 26, 0.6)',
            border: `1px solid ${COLORS.border}`, borderRadius: '6px',
            color: COLORS.text, fontSize: '12px', outline: 'none', cursor: 'pointer',
          }}
        >
          <option value="name">按名称</option>
          <option value="rating">按评分</option>
          <option value="downloads">按下载量</option>
          <option value="updated">按更新时间</option>
        </select>

        {updatesAvailable.length > 0 && (
          <span
            style={{
              background: COLORS.red,
              color: '#fff',
              borderRadius: '10px',
              padding: '2px 8px',
              fontSize: '11px',
              fontWeight: 700,
              flexShrink: 0,
            }}
            title={`${updatesAvailable.length} 个应用有更新`}
          >
            {updatesAvailable.length} 更新
          </span>
        )}
      </header>

      {/* ── 分类标签 ── */}
      <nav
        style={{
          display: 'flex',
          padding: '8px 16px',
          gap: '6px',
          overflowX: 'auto',
          flexShrink: 0,
          borderBottom: `1px solid ${COLORS.border}`,
        }}
        aria-label="应用分类"
      >
        {CATEGORY_LIST.map(cat => (
          <button
            key={cat.id}
            onClick={() => setCategory(cat.id)}
            style={{
              padding: '5px 14px',
              borderRadius: '20px',
              cursor: 'pointer',
              fontSize: '12px',
              fontWeight: category === cat.id ? 600 : 400,
              whiteSpace: 'nowrap',
              transition: 'all 0.2s',
              background: category === cat.id
                ? `linear-gradient(135deg, ${cat.color}44, ${cat.color}22)`
                : 'rgba(40, 40, 65, 0.3)',
              color: category === cat.id ? cat.color : COLORS.textSecondary,
              border: `1px solid ${category === cat.id ? cat.color + '66' : 'transparent'}`,
              boxShadow: category === cat.id ? `0 0 12px ${cat.color}33` : 'none',
            }}
          >
            {cat.icon} {cat.name}
          </button>
        ))}
      </nav>

      {/* ── 主内容滚动区 ── */}
      <main style={{ flex: 1, overflowY: 'auto', overflowX: 'hidden' }}>

        {/* ── 精选推荐 (仅 "全部" 分类 & 无搜索时显示) ── */}
        {category === 'all' && !search && (
          <section style={{ padding: '16px 16px 8px' }} aria-label="精选推荐">
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px' }}>
              <span style={{ fontSize: '16px' }}>⭐</span>
              <h2 style={{ fontSize: '15px', fontWeight: 700, margin: 0 }}>精选推荐</h2>
            </div>
            <div style={{ display: 'flex', gap: '12px', overflowX: 'auto', paddingBottom: '8px' }}>
              {featuredApps.map(app => (
                <div
                  key={app.id}
                  onClick={() => setSelectedApp(app)}
                  style={{
                    ...glassCard,
                    minWidth: '180px',
                    maxWidth: '180px',
                    padding: '14px',
                    cursor: 'pointer',
                    position: 'relative',
                    overflow: 'hidden',
                    background: `linear-gradient(135deg, ${COLORS.card}, ${COLORS.accent}11)`,
                  }}
                  onMouseEnter={e => {
                    e.currentTarget.style.borderColor = COLORS.borderHover
                    e.currentTarget.style.transform = 'translateY(-2px)'
                    e.currentTarget.style.boxShadow = `0 8px 24px ${COLORS.accent}22`
                  }}
                  onMouseLeave={e => {
                    e.currentTarget.style.borderColor = COLORS.border
                    e.currentTarget.style.transform = 'translateY(0)'
                    e.currentTarget.style.boxShadow = 'none'
                  }}
                  role="button"
                  tabIndex={0}
                  aria-label={`查看 ${app.name} 详情`}
                >
                  <div style={{ position: 'absolute', top: 0, right: 0, background: `linear-gradient(135deg, ${COLORS.accent}, ${COLORS.cyan})`, borderRadius: '0 12px 0 8px', padding: '2px 8px', fontSize: '9px', fontWeight: 700, color: '#fff' }}>
                    推荐
                  </div>
                  <div style={{ fontSize: '36px', textAlign: 'center', marginBottom: '8px' }}>{app.icon}</div>
                  <div style={{ fontSize: '13px', fontWeight: 600, textAlign: 'center', marginBottom: '4px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{app.name}</div>
                  <div style={{ fontSize: '10px', color: COLORS.textSecondary, textAlign: 'center', marginBottom: '6px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {app.description.slice(0, 20)}...
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'center', gap: '4px', alignItems: 'center' }}>
                    {renderStars(getEffectiveRating(app), 10)}
                    <span style={{ fontSize: '10px', color: COLORS.textMuted, marginLeft: '2px' }}>{getEffectiveRating(app).toFixed(1)}</span>
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* ── 最近更新 (仅 "全部" 分类 & 无搜索时显示) ── */}
        {category === 'all' && !search && (
          <section style={{ padding: '8px 16px 8px' }} aria-label="最近更新">
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '10px' }}>
              <span style={{ fontSize: '14px' }}>🕐</span>
              <h2 style={{ fontSize: '14px', fontWeight: 600, margin: 0 }}>最近更新</h2>
            </div>
            <div style={{ display: 'flex', gap: '8px', overflowX: 'auto', paddingBottom: '6px' }}>
              {recentlyUpdated.map(app => {
                const days = daysAgo(app.lastUpdated)
                const hasUpdate = isInstalled(app.id) && installedApps.find(i => i.id === app.id)?.version !== app.version
                return (
                  <div
                    key={app.id}
                    onClick={() => setSelectedApp(app)}
                    style={{
                      ...glassCard,
                      minWidth: '140px',
                      maxWidth: '140px',
                      padding: '10px',
                      cursor: 'pointer',
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center',
                      position: 'relative',
                    }}
                    onMouseEnter={e => { e.currentTarget.style.borderColor = COLORS.borderHover }}
                    onMouseLeave={e => { e.currentTarget.style.borderColor = COLORS.border }}
                    role="button"
                    tabIndex={0}
                    aria-label={`查看 ${app.name} 详情`}
                  >
                    {hasUpdate && (
                      <span style={{ position: 'absolute', top: 6, right: 6, width: 8, height: 8, borderRadius: '50%', background: COLORS.green, boxShadow: `0 0 6px ${COLORS.green}` }} title="有更新" />
                    )}
                    <span style={{ fontSize: '28px', marginBottom: '6px' }}>{app.icon}</span>
                    <div style={{ fontSize: '11px', fontWeight: 600, textAlign: 'center', marginBottom: '2px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', width: '100%' }}>{app.name}</div>
                    <div style={{ fontSize: '9px', color: COLORS.textMuted }}>v{app.version}</div>
                    <div style={{ fontSize: '9px', color: days <= 3 ? COLORS.green : COLORS.textMuted, marginTop: '2px' }}>
                      {days === 0 ? '今天' : days === 1 ? '昨天' : `${days}天前`}
                    </div>
                  </div>
                )
              })}
            </div>
          </section>
        )}

        {/* ── 应用网格/列表 ── */}
        <section style={{ padding: '8px 16px 16px' }} aria-label="应用列表">
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '10px' }}>
            <h2 style={{ fontSize: '14px', fontWeight: 600, margin: 0 }}>
              {category === 'all' ? '全部应用' : CATEGORY_LIST.find(c => c.id === category)?.name}
              <span style={{ fontSize: '11px', color: COLORS.textMuted, marginLeft: '8px', fontWeight: 400 }}>
                ({filteredApps.length})
              </span>
            </h2>
          </div>

          {filteredApps.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '48px 16px', color: COLORS.textMuted }}>
              <div style={{ fontSize: '40px', marginBottom: '12px' }}>🔍</div>
              <div style={{ fontSize: '14px', marginBottom: '4px' }}>未找到匹配的应用</div>
              <div style={{ fontSize: '12px' }}>尝试更换关键词或分类</div>
            </div>
          ) : viewMode === 'grid' ? (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(170px, 1fr))', gap: '10px' }}>
              {filteredApps.map(app => {
                const installed = isInstalled(app.id)
                const hasUpdate = installed && installedApps.find(i => i.id === app.id)?.version !== app.version
                return (
                  <div
                    key={app.id}
                    onClick={() => setSelectedApp(app)}
                    style={{
                      ...glassCard,
                      padding: '14px',
                      cursor: 'pointer',
                      position: 'relative',
                      overflow: 'hidden',
                    }}
                    onMouseEnter={e => {
                      e.currentTarget.style.borderColor = COLORS.borderHover
                      e.currentTarget.style.transform = 'translateY(-1px)'
                      e.currentTarget.style.boxShadow = `0 4px 16px rgba(124, 58, 237, 0.15)`
                    }}
                    onMouseLeave={e => {
                      e.currentTarget.style.borderColor = COLORS.border
                      e.currentTarget.style.transform = 'translateY(0)'
                      e.currentTarget.style.boxShadow = 'none'
                    }}
                    role="button"
                    tabIndex={0}
                    aria-label={`查看 ${app.name} 详情`}
                  >
                    {/* 更新徽章 */}
                    {hasUpdate && (
                      <span style={{ position: 'absolute', top: 8, right: 8, background: COLORS.green, color: '#fff', borderRadius: '8px', padding: '1px 6px', fontSize: '9px', fontWeight: 700 }}>更新</span>
                    )}
                    {/* 已安装标识 */}
                    {installed && !hasUpdate && (
                      <span style={{ position: 'absolute', top: 8, right: 8, color: COLORS.green, fontSize: '12px' }} title="已安装">✓</span>
                    )}

                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '6px' }}>
                      <span style={{ fontSize: '32px' }}>{app.icon}</span>
                      <div style={{ fontSize: '12px', fontWeight: 600, textAlign: 'center', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', width: '100%' }}>{app.name}</div>
                      <div style={{ fontSize: '10px', color: COLORS.textSecondary, textAlign: 'center', lineHeight: 1.3, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                        {app.description}
                      </div>
                      <div style={{ display: 'flex', gap: '3px', alignItems: 'center' }}>
                        {renderStars(getEffectiveRating(app), 10)}
                        <span style={{ fontSize: '9px', color: COLORS.textMuted, marginLeft: '2px' }}>{getEffectiveRating(app).toFixed(1)}</span>
                      </div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', width: '100%', fontSize: '9px', color: COLORS.textMuted, marginTop: '2px' }}>
                        <span>⬇ {formatDownloads(getDownloads(app))}</span>
                        <span>{app.size}</span>
                      </div>
                    </div>

                    {/* 安装进度条 */}
                    {installing === app.id && (
                      <div style={{ marginTop: '8px' }}>
                        <div style={{ background: 'rgba(15, 15, 26, 0.5)', borderRadius: '4px', height: '3px', overflow: 'hidden' }}>
                          <div style={{ width: `${Math.min(installProgress, 100)}%`, height: '100%', background: `linear-gradient(90deg, ${COLORS.accent}, ${COLORS.cyan})`, transition: 'width 0.1s' }} />
                        </div>
                        <div style={{ fontSize: '9px', color: COLORS.accentLight, textAlign: 'center', marginTop: '2px' }}>安装中 {Math.min(Math.round(installProgress), 100)}%</div>
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
          ) : (
            /* 列表视图 */
            <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
              {filteredApps.map(app => {
                const installed = isInstalled(app.id)
                const hasUpdate = installed && installedApps.find(i => i.id === app.id)?.version !== app.version
                return (
                  <div
                    key={app.id}
                    onClick={() => setSelectedApp(app)}
                    style={{
                      ...glassCard,
                      padding: '10px 14px',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '12px',
                    }}
                    onMouseEnter={e => { e.currentTarget.style.borderColor = COLORS.borderHover; e.currentTarget.style.background = COLORS.cardHover }}
                    onMouseLeave={e => { e.currentTarget.style.borderColor = COLORS.border; e.currentTarget.style.background = COLORS.card }}
                    role="button"
                    tabIndex={0}
                    aria-label={`查看 ${app.name} 详情`}
                  >
                    <span style={{ fontSize: '28px', flexShrink: 0 }}>{app.icon}</span>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '2px' }}>
                        <span style={{ fontSize: '13px', fontWeight: 600 }}>{app.name}</span>
                        {hasUpdate && <span style={{ background: COLORS.green, color: '#fff', borderRadius: '6px', padding: '0 5px', fontSize: '9px', fontWeight: 700 }}>可更新</span>}
                        {installed && !hasUpdate && <span style={{ color: COLORS.green, fontSize: '11px' }}>✓</span>}
                      </div>
                      <div style={{ fontSize: '11px', color: COLORS.textSecondary, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{app.description}</div>
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '2px', flexShrink: 0 }}>
                      <div style={{ display: 'flex', gap: '2px', alignItems: 'center' }}>
                        {renderStars(getEffectiveRating(app), 10)}
                        <span style={{ fontSize: '10px', color: COLORS.textMuted, marginLeft: '2px' }}>{getEffectiveRating(app).toFixed(1)}</span>
                      </div>
                      <div style={{ fontSize: '10px', color: COLORS.textMuted }}>
                        ⬇ {formatDownloads(getDownloads(app))} · {app.size}
                      </div>
                    </div>
                    {installing === app.id && (
                      <div style={{ width: '60px', flexShrink: 0 }}>
                        <div style={{ background: 'rgba(15, 15, 26, 0.5)', borderRadius: '3px', height: '3px', overflow: 'hidden' }}>
                          <div style={{ width: `${Math.min(installProgress, 100)}%`, height: '100%', background: `linear-gradient(90deg, ${COLORS.accent}, ${COLORS.cyan})`, transition: 'width 0.1s' }} />
                        </div>
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
          )}
        </section>
      </main>

      {/* ── 详情模态框 ── */}
      {selectedApp && (
        <div
          onClick={() => setSelectedApp(null)}
          style={{
            position: 'absolute',
            inset: 0,
            background: 'rgba(0, 0, 0, 0.6)',
            backdropFilter: 'blur(4px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 200,
            animation: 'fadeIn 0.15s ease',
          }}
          role="dialog"
          aria-modal="true"
          aria-label={`${selectedApp.name} 应用详情`}
        >
          <div
            onClick={e => e.stopPropagation()}
            style={{
              background: `linear-gradient(180deg, ${COLORS.bg}, #151525)`,
              borderRadius: '16px',
              padding: '0',
              width: '440px',
              maxWidth: '92%',
              maxHeight: '88%',
              overflowY: 'auto',
              border: `1px solid ${COLORS.borderHover}`,
              boxShadow: `0 24px 64px rgba(0, 0, 0, 0.5), 0 0 40px ${COLORS.accent}15`,
            }}
          >
            {/* 模态头部 */}
            <div style={{
              padding: '24px 24px 16px',
              background: `linear-gradient(135deg, ${COLORS.accent}15, ${COLORS.cyan}08)`,
              borderBottom: `1px solid ${COLORS.border}`,
              position: 'relative',
            }}>
              <button
                onClick={() => setSelectedApp(null)}
                aria-label="关闭"
                style={{
                  position: 'absolute', top: 12, right: 12, background: 'rgba(40,40,65,0.6)',
                  border: 'none', borderRadius: '6px', width: 28, height: 28, cursor: 'pointer',
                  color: COLORS.textSecondary, fontSize: '14px', display: 'flex', alignItems: 'center', justifyContent: 'center',
                }}
              >✕</button>

              <div style={{ display: 'flex', gap: '16px', alignItems: 'flex-start' }}>
                <div style={{
                  fontSize: '52px', width: 72, height: 72, display: 'flex', alignItems: 'center', justifyContent: 'center',
                  background: COLORS.card, borderRadius: '16px', border: `1px solid ${COLORS.border}`,
                  flexShrink: 0,
                }}>
                  {selectedApp.icon}
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <h3 style={{ fontSize: '18px', fontWeight: 700, margin: '0 0 4px' }}>{selectedApp.name}</h3>
                  <div style={{ display: 'flex', gap: '8px', alignItems: 'center', marginBottom: '6px', flexWrap: 'wrap' }}>
                    <span style={{
                      fontSize: '10px', fontWeight: 600,
                      background: `${CATEGORY_LIST.find(c => c.id === selectedApp.category)?.color || COLORS.accent}33`,
                      color: CATEGORY_LIST.find(c => c.id === selectedApp.category)?.color || COLORS.accentLight,
                      borderRadius: '6px', padding: '2px 8px',
                    }}>
                      {CATEGORY_LIST.find(c => c.id === selectedApp.category)?.name || selectedApp.category}
                    </span>
                    <span style={{ fontSize: '11px', color: COLORS.textSecondary }}>v{selectedApp.version}</span>
                    <span style={{ fontSize: '11px', color: COLORS.textMuted }}>{selectedApp.size}</span>
                  </div>
                  <div style={{ display: 'flex', gap: '4px', alignItems: 'center' }}>
                    {renderStars(getEffectiveRating(selectedApp), 13)}
                    <span style={{ fontSize: '12px', color: COLORS.textSecondary, marginLeft: '4px' }}>
                      {getEffectiveRating(selectedApp).toFixed(1)}
                    </span>
                    <span style={{ fontSize: '11px', color: COLORS.textMuted, marginLeft: '4px' }}>
                      ({formatDownloads(getDownloads(selectedApp))} 次下载)
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* 模态内容 */}
            <div style={{ padding: '16px 24px' }}>
              {/* 描述 */}
              <div style={{ marginBottom: '14px' }}>
                <div style={{ fontSize: '12px', fontWeight: 600, color: COLORS.accentLight, marginBottom: '6px' }}>描述</div>
                <div style={{ fontSize: '12px', color: COLORS.textSecondary, lineHeight: 1.7 }}>{selectedApp.description}</div>
              </div>

              {/* 截图占位 */}
              <div style={{ marginBottom: '14px' }}>
                <div style={{ fontSize: '12px', fontWeight: 600, color: COLORS.accentLight, marginBottom: '6px' }}>截图</div>
                <div style={{ display: 'flex', gap: '8px', overflowX: 'auto', paddingBottom: '4px' }}>
                  {Array.from({ length: selectedApp.screenshots }, (_, i) => (
                    <div
                      key={i}
                      style={{
                        minWidth: '140px', height: '90px', borderRadius: '8px',
                        background: `linear-gradient(${135 + i * 45}deg, ${COLORS.accent}22, ${COLORS.cyan}15)`,
                        border: `1px solid ${COLORS.border}`,
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        fontSize: '11px', color: COLORS.textMuted,
                      }}
                    >
                      截图 {i + 1}
                    </div>
                  ))}
                </div>
              </div>

              {/* 更新日志 */}
              <div style={{ marginBottom: '14px' }}>
                <div style={{ fontSize: '12px', fontWeight: 600, color: COLORS.accentLight, marginBottom: '6px' }}>更新日志</div>
                <div style={{
                  background: COLORS.card, borderRadius: '8px', padding: '10px 12px',
                  border: `1px solid ${COLORS.border}`,
                }}>
                  <div style={{ fontSize: '11px', color: COLORS.textSecondary, lineHeight: 1.8 }}>
                    <div><span style={{ color: COLORS.cyan, fontWeight: 600 }}>v{selectedApp.version}</span> — {selectedApp.changelog}</div>
                    <div><span style={{ color: COLORS.textMuted }}>v{(() => { const p = selectedApp.version.split('.'); return `${p[0]}.${p[1]}.${Math.max(0, Number(p[2]) - 1)}`; })()}</span> — 性能优化与稳定性提升</div>
                    <div><span style={{ color: COLORS.textMuted }}>v{(() => { const p = selectedApp.version.split('.'); return `${p[0]}.${Math.max(0, Number(p[1]) - 1)}.0`; })()}</span> — 界面重构与新增功能</div>
                  </div>
                </div>
              </div>

              {/* 信息行 */}
              <div style={{
                display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px',
                marginBottom: '14px',
              }}>
                {[
                  ['📦 大小', selectedApp.size],
                  ['📥 下载', formatDownloads(getDownloads(selectedApp))],
                  ['📅 更新', selectedApp.lastUpdated],
                  ['📂 分类', CATEGORY_LIST.find(c => c.id === selectedApp.category)?.name || selectedApp.category],
                ].map(([label, value]) => (
                  <div key={label} style={{
                    background: COLORS.card, borderRadius: '8px', padding: '8px 10px',
                    border: `1px solid ${COLORS.border}`,
                  }}>
                    <div style={{ fontSize: '10px', color: COLORS.textMuted, marginBottom: '2px' }}>{label}</div>
                    <div style={{ fontSize: '12px', color: COLORS.text }}>{value}</div>
                  </div>
                ))}
              </div>

              {/* 用户评分 */}
              <div style={{ marginBottom: '16px' }}>
                <div style={{ fontSize: '12px', fontWeight: 600, color: COLORS.accentLight, marginBottom: '8px' }}>你的评分</div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  {renderInteractiveStars(selectedApp.id, getUserRating(selectedApp.id))}
                  {getUserRating(selectedApp.id) > 0 && (
                    <span style={{ fontSize: '11px', color: COLORS.yellow }}>{getUserRating(selectedApp.id)} 星</span>
                  )}
                </div>
              </div>

              {/* 操作按钮 */}
              <div style={{ display: 'flex', gap: '8px' }}>
                {isInstalled(selectedApp.id) ? (
                  <>
                    {installedApps.find(i => i.id === selectedApp.id)?.version !== selectedApp.version && (
                      <button
                        onClick={() => {
                          installApp(selectedApp)
                          setSelectedApp(null)
                        }}
                        style={{
                          flex: 1, padding: '10px', border: 'none', borderRadius: '8px', cursor: 'pointer',
                          background: `linear-gradient(135deg, ${COLORS.green}, #059669)`,
                          color: '#fff', fontSize: '13px', fontWeight: 600,
                          boxShadow: `0 2px 12px ${COLORS.green}33`,
                        }}
                      >
                        更新至 v{selectedApp.version}
                      </button>
                    )}
                    <button
                      onClick={() => { uninstallApp(selectedApp.id); setSelectedApp(null) }}
                      style={{
                        flex: 1, padding: '10px', borderRadius: '8px', cursor: 'pointer',
                        background: `${COLORS.red}22`, color: COLORS.red,
                        fontSize: '13px', fontWeight: 600,
                        border: `1px solid ${COLORS.red}44`,
                      }}
                    >
                      卸载
                    </button>
                  </>
                ) : (
                  <button
                    onClick={() => { installApp(selectedApp); setSelectedApp(null) }}
                    disabled={installing === selectedApp.id}
                    style={{
                      flex: 1, padding: '10px', border: 'none', borderRadius: '8px',
                      cursor: installing === selectedApp.id ? 'not-allowed' : 'pointer',
                      background: installing === selectedApp.id
                        ? `${COLORS.accent}44`
                        : `linear-gradient(135deg, ${COLORS.accent}, ${COLORS.cyan})`,
                      color: installing === selectedApp.id ? COLORS.textMuted : '#fff',
                      fontSize: '13px', fontWeight: 600,
                      boxShadow: installing === selectedApp.id ? 'none' : `0 2px 12px ${COLORS.accent}33`,
                    }}
                  >
                    {installing === selectedApp.id ? '安装中...' : '安装'}
                  </button>
                )}
                <button
                  onClick={() => setSelectedApp(null)}
                  style={{
                    padding: '10px 20px', border: `1px solid ${COLORS.border}`,
                    borderRadius: '8px', cursor: 'pointer',
                    background: 'transparent', color: COLORS.textSecondary,
                    fontSize: '13px',
                  }}
                >
                  关闭
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── 底部状态栏 ── */}
      <footer style={{
        padding: '6px 16px',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        background: COLORS.surface,
        backdropFilter: 'blur(12px)',
        borderTop: `1px solid ${COLORS.border}`,
        fontSize: '11px',
        color: COLORS.textMuted,
        flexShrink: 0,
      }}>
        <span>共 {APP_CATALOG.length} 个应用 · 已安装 {installedApps.length} 个</span>
        <span>{updatesAvailable.length > 0 ? `${updatesAvailable.length} 个更新可用` : '所有应用均为最新'}</span>
      </footer>
    </div>
  )
}
