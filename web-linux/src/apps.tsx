import {
  FolderIcon, TerminalIcon, FileTextIcon, BrowserIcon, CalculatorIcon,
  CalendarIcon, ClockIcon, CloudRainIcon, ActivityIcon, SettingsIcon,
  NoteIcon, ImageIcon, MusicIcon, VideoIcon, PDFIcon, CodeIcon,
  PackageIcon, ShoppingCartIcon, HardDriveIcon, ListTodoIcon, ServerIcon,
  WifiIcon, ShieldIcon, UserIcon, CameraIcon, PaintIcon, GridIcon,
  PresentationIcon, MailIcon, MessageIcon, ContactsIcon, CheckListIcon,
  LockIcon, BackupIcon, ZipIcon, FileSearchIcon, TypeIcon,
  BookIcon, LanguagesIcon, MapPinIcon, VideoRecorderIcon, MicIcon,
  BluetoothIcon, BatteryIcon, InfoIcon, HelpIcon, CommandIcon,
  PaletteIcon, MagnifierIcon, SnakeIcon, TetrisIcon, ChatIcon, BoardIcon,
  ClipboardIcon, LightningIcon, SearchIcon, PomodoroIcon, PetIcon,
  WallpaperIcon, MindMapIcon, StickyNotesIcon, ParticleIcon, WhiteboardIcon, AutomationIcon,
  VoiceIcon, GraduationCapIcon, WrenchIcon
} from './icons'

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

function ApiIcon() {
  return (
    <svg viewBox="0 0 24 24" width="18" height="18" stroke="currentColor" strokeWidth="2" fill="none">
      <path d="M10 9h4V6h3l-5 5-5-5h3v3m-6 6h4v-3h3l-5 5-5-5h3v3" />
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
import type { AppDefinition } from './types'

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

export const appRegistry: AppDefinition[] = [
  { id: 'task-board', name: '任务看板', icon: <BoardIcon />, component: 'TaskBoard', category: 'office', defaultWidth: 1200, defaultHeight: 800, minWidth: 900, minHeight: 600, resizable: true, multiple: false },
  { id: 'idea-capture', name: '灵感速记', icon: <IdeaIcon />, component: 'IdeaCapture', category: 'utilities', defaultWidth: 900, defaultHeight: 700, minWidth: 600, minHeight: 500, resizable: true, multiple: false },
  { id: 'code-diff-viewer', name: '代码差异查看器', icon: <DiffIcon />, component: 'CodeDiffViewer', category: 'development', defaultWidth: 1200, defaultHeight: 800, minWidth: 800, minHeight: 600, resizable: true, multiple: false },
  { id: 'image-optimizer', name: '图片优化器', icon: <ImageOptimizeIcon />, component: 'ImageOptimizer', category: 'utilities', defaultWidth: 1000, defaultHeight: 700, minWidth: 700, minHeight: 500, resizable: true, multiple: false },
  { id: 'network-speed-test', name: '网络速度测试', icon: <SpeedTestIcon />, component: 'NetworkSpeedTest', category: 'utilities', defaultWidth: 600, defaultHeight: 700, minWidth: 500, minHeight: 500, resizable: true, multiple: false },
  { id: 'quick-tools', name: '快速工具箱', icon: <WrenchIcon />, component: 'RandomTools', category: 'utilities', defaultWidth: 900, defaultHeight: 700, minWidth: 700, minHeight: 500, resizable: true, multiple: false },
  { id: 'learning-platform', name: '学习平台', icon: <GraduationCapIcon />, component: 'LearningPlatform', category: 'utilities', defaultWidth: 1200, defaultHeight: 800, minWidth: 900, minHeight: 600, resizable: true, multiple: false },
  { id: 'crypto-tracker', name: '加密货币追踪器', icon: <CryptoIcon />, component: 'CryptoTracker', category: 'utilities', defaultWidth: 600, defaultHeight: 900, minWidth: 450, minHeight: 600, resizable: true, multiple: false },
  { id: 'code-snippets', name: '代码片段管理', icon: <CodeSnippetsIcon />, component: 'CodeSnippetsManager', category: 'development', defaultWidth: 1100, defaultHeight: 750, minWidth: 800, minHeight: 500, resizable: true, multiple: false },
  { id: 'chat-ai', name: 'AI 智能助手', icon: '🧠', component: 'ChatAI', category: 'utilities', defaultWidth: 1000, defaultHeight: 750, minWidth: 700, minHeight: 500, resizable: true, multiple: false },
  { id: 'code-studio', name: 'Code Studio', icon: '💻', component: 'CodeStudio', category: 'development', defaultWidth: 1100, defaultHeight: 800, minWidth: 800, minHeight: 550, resizable: true, multiple: false },
  { id: 'text-formatter', name: '文本格式化', icon: <TextFormatIcon />, component: 'TextFormatter', category: 'utilities', defaultWidth: 850, defaultHeight: 700, minWidth: 600, minHeight: 500, resizable: true, multiple: false },
  { id: 'currency-converter', name: '汇率转换', icon: '💱', component: 'CurrencyConverter', category: 'utilities', defaultWidth: 600, defaultHeight: 800, minWidth: 500, minHeight: 600, resizable: true, multiple: false },
  { id: 'voice-transcriber', name: '语音转录', icon: <VoiceIcon />, component: 'VoiceTranscriber', category: 'utilities', defaultWidth: 800, defaultHeight: 700, minWidth: 600, minHeight: 500, resizable: true, multiple: false },
  { id: 'news-reader', name: '新闻阅读器', icon: '📰', component: 'NewsReader', category: 'internet', defaultWidth: 1000, defaultHeight: 700, minWidth: 600, minHeight: 450, resizable: true, multiple: false },
  { id: 'github-trending', name: 'GitHub 热门', icon: '💻', component: 'GitHubTrending', category: 'development', defaultWidth: 900, defaultHeight: 700, minWidth: 600, minHeight: 450, resizable: true, multiple: false },
  { id: 'unit-converter', name: '单位转换器', icon: '📏', component: 'UnitConverter', category: 'utilities', defaultWidth: 700, defaultHeight: 700, minWidth: 500, minHeight: 500, resizable: true, multiple: false },
  { id: 'regex-tester', name: '正则表达式测试', icon: '🔍', component: 'RegexTester', category: 'development', defaultWidth: 900, defaultHeight: 650, minWidth: 600, minHeight: 450, resizable: true, multiple: false },
  { id: 'json-formatter', name: 'JSON 格式化', icon: '📋', component: 'JSONFormatter', category: 'development', defaultWidth: 1000, defaultHeight: 700, minWidth: 600, minHeight: 450, resizable: true, multiple: false },
  { id: 'qr-generator', name: 'QR 码生成器', icon: '📷', component: 'QRGenerator', category: 'utilities', defaultWidth: 900, defaultHeight: 650, minWidth: 600, minHeight: 450, resizable: true, multiple: false },
  { id: 'task-dashboard', name: '协作任务看板', icon: '📊', component: 'TaskDashboard', category: 'office', defaultWidth: 1200, defaultHeight: 800, minWidth: 800, minHeight: 600, resizable: true, multiple: false },
  { id: 'system-dashboard', name: '系统仪表盘', icon: '📊', component: 'SystemDashboard', category: 'system', defaultWidth: 1200, defaultHeight: 800, minWidth: 800, minHeight: 600, resizable: true, multiple: false },
  { id: 'task-automation', name: '任务自动化', icon: <AutomationIcon />, component: 'TaskAutomation', category: 'utilities', defaultWidth: 1000, defaultHeight: 700, minWidth: 700, minHeight: 500, resizable: true, multiple: false },
  { id: 'music-visualizer', name: '音乐可视化', icon: '🎵', component: 'MusicVisualizer', category: 'multimedia', defaultWidth: 1000, defaultHeight: 750, minWidth: 600, minHeight: 450, resizable: true, multiple: false },
  { id: 'whiteboard', name: '白板', icon: <WhiteboardIcon />, component: 'Whiteboard', category: 'office', defaultWidth: 1000, defaultHeight: 700, minWidth: 600, minHeight: 400, resizable: true, multiple: false },
  { id: 'particle-system', name: '粒子系统', icon: <ParticleIcon />, component: 'ParticleSystem', category: 'utilities', defaultWidth: 900, defaultHeight: 700, minWidth: 600, minHeight: 400, resizable: true, multiple: false },
  { id: 'sticky-notes-wall', name: '便签墙', icon: <StickyNotesIcon />, component: 'StickyNotesWall', category: 'office', defaultWidth: 800, defaultHeight: 600, minWidth: 500, minHeight: 400, resizable: true, multiple: false },
  { id: 'virtual-pet', name: '虚拟宠物', icon: <PetIcon />, component: 'VirtualPet', category: 'games', defaultWidth: 400, defaultHeight: 650, minWidth: 350, minHeight: 550, resizable: true, multiple: false },
  { id: 'wallpaper-gallery', name: '壁纸画廊', icon: <WallpaperIcon />, component: 'WallpaperGallery', category: 'utilities', defaultWidth: 700, defaultHeight: 600, minWidth: 500, minHeight: 450, resizable: true, multiple: false },
  { id: 'mind-map', name: '思维导图', icon: <MindMapIcon />, component: 'MindMap', category: 'office', defaultWidth: 900, defaultHeight: 650, minWidth: 600, minHeight: 450, resizable: true, multiple: false },
  { id: 'pomodoro', name: '番茄工作法', icon: <PomodoroIcon />, component: 'Pomodoro', category: 'utilities', defaultWidth: 500, defaultHeight: 650, minWidth: 400, minHeight: 550, resizable: true, multiple: false },
  { id: 'smart-search', name: '智慧搜索', icon: <SearchIcon />, component: 'SmartSearch', category: 'utilities', defaultWidth: 700, defaultHeight: 600, minWidth: 500, minHeight: 400, resizable: true, multiple: false },
  { id: 'files', name: '文件管理器', icon: <FolderIcon />, component: 'FileManager', category: 'system', defaultWidth: 900, defaultHeight: 600, minWidth: 500, minHeight: 350, resizable: true, multiple: true },
  { id: 'terminal', name: '终端', icon: <TerminalIcon />, component: 'Terminal', category: 'system', defaultWidth: 800, defaultHeight: 500, minWidth: 400, minHeight: 250, resizable: true, multiple: true },
  { id: 'text-editor', name: '文本编辑器', icon: <FileTextIcon />, component: 'TextEditor', category: 'office', defaultWidth: 700, defaultHeight: 500, minWidth: 400, minHeight: 300, resizable: true, multiple: true },
  { id: 'markdown-editor', name: 'Markdown 编辑器', icon: <FileTextIcon />, component: 'MarkdownEditor', category: 'office', defaultWidth: 900, defaultHeight: 600, minWidth: 600, minHeight: 400, resizable: true, multiple: true },
  { id: 'browser', name: '浏览器', icon: <BrowserIcon />, component: 'WebBrowser', category: 'internet', defaultWidth: 1024, defaultHeight: 700, minWidth: 600, minHeight: 400, resizable: true, multiple: true },
  { id: 'calculator', name: '计算器', icon: <CalculatorIcon />, component: 'Calculator', category: 'utilities', defaultWidth: 350, defaultHeight: 480, minWidth: 300, minHeight: 400, resizable: false, multiple: false },
  { id: 'calendar', name: '日历', icon: <CalendarIcon />, component: 'Calendar', category: 'office', defaultWidth: 700, defaultHeight: 550, minWidth: 500, minHeight: 400, resizable: true, multiple: false },
  { id: 'clock', name: '时钟', icon: <ClockIcon />, component: 'Clock', category: 'utilities', defaultWidth: 400, defaultHeight: 450, minWidth: 300, minHeight: 350, resizable: false, multiple: false },
  { id: 'weather', name: '天气', icon: <CloudRainIcon />, component: 'Weather', category: 'utilities', defaultWidth: 500, defaultHeight: 500, minWidth: 400, minHeight: 400, resizable: true, multiple: false },
  { id: 'system-monitor', name: '系统监视器', icon: <ActivityIcon />, component: 'SystemMonitor', category: 'system', defaultWidth: 700, defaultHeight: 500, minWidth: 500, minHeight: 350, resizable: true, multiple: false },
  { id: 'settings', name: '设置', icon: <SettingsIcon />, component: 'SystemSettings', category: 'system', defaultWidth: 750, defaultHeight: 550, minWidth: 550, minHeight: 400, resizable: true, multiple: false },
  { id: 'notepad', name: '记事本', icon: <NoteIcon />, component: 'Notepad', category: 'office', defaultWidth: 500, defaultHeight: 400, minWidth: 350, minHeight: 250, resizable: true, multiple: true },
  { id: 'image-viewer', name: '图片查看器', icon: <ImageIcon />, component: 'ImageViewer', category: 'multimedia', defaultWidth: 800, defaultHeight: 600, minWidth: 400, minHeight: 300, resizable: true, multiple: true },
  { id: 'music-player', name: '音乐播放器', icon: <MusicIcon />, component: 'MusicPlayer', category: 'multimedia', defaultWidth: 500, defaultHeight: 400, minWidth: 350, minHeight: 300, resizable: true, multiple: false },
  { id: 'video-player', name: '视频播放器', icon: <VideoIcon />, component: 'VideoPlayer', category: 'multimedia', defaultWidth: 800, defaultHeight: 550, minWidth: 500, minHeight: 350, resizable: true, multiple: false },
  { id: 'pdf-viewer', name: 'PDF 查看器', icon: <PDFIcon />, component: 'PDFViewer', category: 'office', defaultWidth: 800, defaultHeight: 600, minWidth: 500, minHeight: 400, resizable: true, multiple: true },
  { id: 'code-editor', name: '代码编辑器', icon: <CodeIcon />, component: 'CodeEditor', category: 'development', defaultWidth: 900, defaultHeight: 600, minWidth: 550, minHeight: 350, resizable: true, multiple: true },
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
  { id: 'spreadsheet', name: '电子表格', icon: <GridIcon />, component: 'Spreadsheet', category: 'office', defaultWidth: 900, defaultHeight: 600, minWidth: 550, minHeight: 350, resizable: true, multiple: true },
  { id: 'presentation', name: '演示文稿', icon: <PresentationIcon />, component: 'Presentation', category: 'office', defaultWidth: 900, defaultHeight: 600, minWidth: 550, minHeight: 350, resizable: true, multiple: true },
  { id: 'email', name: '邮件客户端', icon: <MailIcon />, component: 'Email', category: 'internet', defaultWidth: 900, defaultHeight: 600, minWidth: 600, minHeight: 400, resizable: true, multiple: false },
  { id: 'chat', name: '即时通讯', icon: <MessageIcon />, component: 'Chat', category: 'internet', defaultWidth: 700, defaultHeight: 550, minWidth: 450, minHeight: 350, resizable: true, multiple: false },
  { id: 'contacts', name: '通讯录', icon: <ContactsIcon />, component: 'Contacts', category: 'office', defaultWidth: 650, defaultHeight: 500, minWidth: 450, minHeight: 350, resizable: true, multiple: false },
  { id: 'notes', name: '笔记', icon: <NoteIcon />, component: 'Notes', category: 'office', defaultWidth: 700, defaultHeight: 550, minWidth: 450, minHeight: 350, resizable: true, multiple: true },
  { id: 'todo-list', name: '待办事项', icon: <CheckListIcon />, component: 'TodoList', category: 'office', defaultWidth: 550, defaultHeight: 500, minWidth: 350, minHeight: 350, resizable: true, multiple: false },
  { id: 'password-manager', name: '密码管理器', icon: <LockIcon />, component: 'PasswordManager', category: 'utilities', defaultWidth: 650, defaultHeight: 500, minWidth: 450, minHeight: 350, resizable: true, multiple: false },
  { id: 'backup-tool', name: '备份工具', icon: <BackupIcon />, component: 'BackupTool', category: 'system', defaultWidth: 550, defaultHeight: 450, minWidth: 400, minHeight: 300, resizable: true, multiple: false },
  { id: 'archive-manager', name: '归档管理器', icon: <ZipIcon />, component: 'ArchiveManager', category: 'utilities', defaultWidth: 600, defaultHeight: 450, minWidth: 450, minHeight: 350, resizable: true, multiple: false },
  { id: 'disk-utility', name: '磁盘工具', icon: <HardDriveIcon />, component: 'DiskUtility', category: 'system', defaultWidth: 600, defaultHeight: 450, minWidth: 450, minHeight: 350, resizable: true, multiple: false },
  { id: 'log-viewer', name: '日志查看器', icon: <FileSearchIcon />, component: 'LogViewer', category: 'system', defaultWidth: 700, defaultHeight: 500, minWidth: 500, minHeight: 350, resizable: true, multiple: false },
  { id: 'character-map', name: '字符映射表', icon: <TypeIcon />, component: 'CharacterMap', category: 'utilities', defaultWidth: 600, defaultHeight: 450, minWidth: 450, minHeight: 350, resizable: true, multiple: false },
  { id: 'font-viewer', name: '字体查看器', icon: <TypeIcon />, component: 'FontViewer', category: 'utilities', defaultWidth: 600, defaultHeight: 450, minWidth: 450, minHeight: 350, resizable: true, multiple: false },
  { id: 'dictionary', name: '字典', icon: <BookIcon />, component: 'Dictionary', category: 'office', defaultWidth: 600, defaultHeight: 500, minWidth: 450, minHeight: 350, resizable: true, multiple: false },
  { id: 'translator', name: '翻译器', icon: <LanguagesIcon />, component: 'Translator', category: 'office', defaultWidth: 650, defaultHeight: 500, minWidth: 450, minHeight: 350, resizable: true, multiple: false },
  { id: 'maps', name: '地图', icon: <MapPinIcon />, component: 'Maps', category: 'internet', defaultWidth: 800, defaultHeight: 600, minWidth: 500, minHeight: 400, resizable: true, multiple: false },
  { id: 'camera', name: '摄像头', icon: <CameraIcon />, component: 'Camera', category: 'multimedia', defaultWidth: 640, defaultHeight: 520, minWidth: 400, minHeight: 350, resizable: true, multiple: false },
  { id: 'screen-recorder', name: '屏幕录制器', icon: <VideoRecorderIcon />, component: 'ScreenRecorder', category: 'multimedia', defaultWidth: 500, defaultHeight: 400, minWidth: 350, minHeight: 300, resizable: true, multiple: false },
  { id: 'sound-recorder', name: '录音机', icon: <MicIcon />, component: 'SoundRecorder', category: 'multimedia', defaultWidth: 400, defaultHeight: 300, minWidth: 300, minHeight: 250, resizable: false, multiple: false },
  { id: 'bluetooth', name: '蓝牙管理器', icon: <BluetoothIcon />, component: 'BluetoothManager', category: 'system', defaultWidth: 550, defaultHeight: 400, minWidth: 400, minHeight: 300, resizable: true, multiple: false },
  { id: 'wifi', name: 'Wi-Fi 管理器', icon: <WifiIcon />, component: 'WiFiManager', category: 'system', defaultWidth: 550, defaultHeight: 400, minWidth: 400, minHeight: 300, resizable: true, multiple: false },
  { id: 'power', name: '电源管理', icon: <BatteryIcon />, component: 'PowerManager', category: 'system', defaultWidth: 500, defaultHeight: 400, minWidth: 400, minHeight: 300, resizable: true, multiple: false },
  { id: 'about', name: '关于系统', icon: <InfoIcon />, component: 'About', category: 'system', defaultWidth: 550, defaultHeight: 450, minWidth: 400, minHeight: 300, resizable: false, multiple: false },
  { id: 'help', name: '帮助', icon: <HelpIcon />, component: 'Help', category: 'system', defaultWidth: 700, defaultHeight: 550, minWidth: 500, minHeight: 350, resizable: true, multiple: false },
  { id: 'command-ref', name: '命令参考', icon: <CommandIcon />, component: 'CommandReference', category: 'development', defaultWidth: 700, defaultHeight: 550, minWidth: 500, minHeight: 350, resizable: true, multiple: false },
  { id: 'color-picker', name: '取色器', icon: <PaletteIcon />, component: 'ColorPicker', category: 'utilities', defaultWidth: 450, defaultHeight: 400, minWidth: 350, minHeight: 300, resizable: false, multiple: false },
  { id: 'magnifier', name: '放大镜', icon: <MagnifierIcon />, component: 'Magnifier', category: 'utilities', defaultWidth: 400, defaultHeight: 350, minWidth: 300, minHeight: 250, resizable: false, multiple: false },
  { id: 'game-snake', name: '贪吃蛇', icon: <SnakeIcon />, component: 'GameSnake', category: 'games', defaultWidth: 400, defaultHeight: 450, minWidth: 350, minHeight: 400, resizable: false, multiple: false },
  { id: 'game-tetris', name: '俄罗斯方块', icon: <TetrisIcon />, component: 'GameTetris', category: 'games', defaultWidth: 400, defaultHeight: 520, minWidth: 300, minHeight: 450, resizable: false, multiple: false },
  { id: 'ai-helper', name: 'AI 助手', icon: <ChatIcon />, component: 'AIHelper', category: 'utilities', defaultWidth: 500, defaultHeight: 600, minWidth: 350, minHeight: 400, resizable: true, multiple: false },
  { id: 'kanban-board', name: '任务看板', icon: <BoardIcon />, component: 'KanbanBoard', category: 'office', defaultWidth: 900, defaultHeight: 600, minWidth: 500, minHeight: 400, resizable: true, multiple: false },
  { id: 'clipboard-manager', name: '剪贴板管理', icon: <ClipboardIcon />, component: 'ClipboardManager', category: 'utilities', defaultWidth: 800, defaultHeight: 500, minWidth: 600, minHeight: 400, resizable: true, multiple: false },
  { id: 'clipboard-history', name: '剪贴板历史', icon: '📋', component: 'ClipboardHistory', category: 'utilities', defaultWidth: 600, defaultHeight: 700, minWidth: 400, minHeight: 500, resizable: true, multiple: false },
  { id: 'quick-commands', name: '快捷命令', icon: <LightningIcon />, component: 'QuickCommands', category: 'utilities', defaultWidth: 850, defaultHeight: 550, minWidth: 600, minHeight: 400, resizable: true, multiple: false },
  { id: 'cloud-sync', name: '云同步', icon: '☁️', component: 'CloudSync', category: 'utilities', defaultWidth: 700, defaultHeight: 650, minWidth: 500, minHeight: 450, resizable: true, multiple: false },
  { id: 'code-playground', name: '代码运行器', icon: '🎮', component: 'CodePlayground', category: 'development', defaultWidth: 950, defaultHeight: 650, minWidth: 600, minHeight: 450, resizable: true, multiple: false },
  { id: 'api-tester', name: 'API 测试器', icon: <ApiIcon />, component: 'ApiTester', category: 'development', defaultWidth: 1050, defaultHeight: 700, minWidth: 700, minHeight: 500, resizable: true, multiple: false },
  { id: 'data-viz', name: '数据可视化', icon: <ChartIcon />, component: 'DataViz', category: 'development', defaultWidth: 1000, defaultHeight: 700, minWidth: 700, minHeight: 500, resizable: true, multiple: false },
  { id: 'quick-launcher', name: '快速启动器', icon: '🚀', component: 'QuickLauncher', category: 'utilities', defaultWidth: 550, defaultHeight: 650, minWidth: 400, minHeight: 450, resizable: true, multiple: false },
  { id: 'activity-tracker', name: '活动追踪器', icon: '📊', component: 'ActivityTracker', category: 'utilities', defaultWidth: 500, defaultHeight: 700, minWidth: 400, minHeight: 500, resizable: true, multiple: false },
  { id: 'performance-monitor', name: '性能监控', icon: '⚡', component: 'PerformanceMonitor', category: 'system', defaultWidth: 800, defaultHeight: 600, minWidth: 600, minHeight: 450, resizable: true, multiple: false },
  { id: 'project-manager', name: '项目管理', icon: '📋', component: 'ProjectManager', category: 'office', defaultWidth: 1200, defaultHeight: 800, minWidth: 900, minHeight: 600, resizable: true, multiple: false },
  { id: 'random-tools', name: '随机工具', icon: <DiceIcon />, component: 'RandomTools', category: 'utilities', defaultWidth: 700, defaultHeight: 700, minWidth: 500, minHeight: 500, resizable: true, multiple: false },
  { id: 'ip-lookup', name: 'IP & DNS 查询', icon: '🌐', component: 'IPLookup', category: 'utilities', defaultWidth: 800, defaultHeight: 700, minWidth: 600, minHeight: 500, resizable: true, multiple: false },
  { id: 'system-health', name: '系统健康检查', icon: '🩺', component: 'SystemHealthCheck', category: 'system', defaultWidth: 650, defaultHeight: 800, minWidth: 500, minHeight: 600, resizable: true, multiple: false },
  { id: 'system-toolbox', name: '系统工具箱', icon: '🔧', component: 'SystemToolbox', category: 'utilities', defaultWidth: 900, defaultHeight: 700, minWidth: 700, minHeight: 500, resizable: true, multiple: false },
]