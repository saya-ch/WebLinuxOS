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
  VoiceIcon, GraduationCapIcon, WrenchIcon, CpuIcon, SparklesIcon
} from './icons'


import type { AppDefinition } from './types'

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

function RocketIcon() {
  return (
    <svg viewBox="0 0 24 24" width="18" height="18" stroke="currentColor" strokeWidth="2" fill="none">
      <path d="M4.5 16.5c-1.5 1.26-2 5-2 5s3.74-.5 5-2c.71-.84.7-2.13-.09-2.91a2.18 2.18 0 0 0-2.91-.09z" />
      <path d="M12 15l-3-3a22 22 0 0 1 2-3.95A12.88 12.88 0 0 1 22 2c0 2.72-.78 7.5-6 11a22.35 22.35 0 0 1-4 2z" />
      <path d="M9 12H4s.55-3.03 2-4c1.62-1.08 5 0 5 0" />
      <path d="M12 15v5s3.03-.55 4-2c1.08-1.62 0-5 0-5" />
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

export const appRegistry: AppDefinition[] = [
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
  { id: 'github-explorer', name: 'GitHub 探索器', icon: <GitHubExplorerIcon />, component: 'GitHubExplorer', category: 'development', defaultWidth: 1200, defaultHeight: 850, minWidth: 900, minHeight: 600, resizable: true, multiple: false },
  { id: 'ai-code-tutor', name: 'AI 编程导师', icon: <AICodeTutorIcon />, component: 'AICodeTutor', category: 'development', defaultWidth: 1400, defaultHeight: 900, minWidth: 1000, minHeight: 600, resizable: true, multiple: false },
  { id: 'component-sandbox', name: '组件开发沙盒', icon: <ComponentSandboxIcon />, component: 'ComponentSandbox', category: 'development', defaultWidth: 1200, defaultHeight: 800, minWidth: 900, minHeight: 600, resizable: true, multiple: false },
  { id: 'realtime-dashboard', name: '实时数据仪表盘', icon: <RealTimeDashboardIcon />, component: 'RealTimeDashboard', category: 'utilities', defaultWidth: 1200, defaultHeight: 850, minWidth: 900, minHeight: 650, resizable: true, multiple: false },
  { id: 'smart-news-reader', name: '智能新闻阅读器', icon: <SmartNewsReaderIcon />, component: 'SmartNewsReader', category: 'internet', defaultWidth: 1200, defaultHeight: 850, minWidth: 800, minHeight: 600, resizable: true, multiple: false },
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
  { id: 'ai-code-assistant', name: 'AI代码助手', icon: <CpuIcon />, component: 'AICodeAssistant', category: 'development', defaultWidth: 1100, defaultHeight: 800, minWidth: 800, minHeight: 500, resizable: true, multiple: false },
  { id: 'smart-password-manager', name: '智能密码管理器', icon: <LockIcon />, component: 'SmartPasswordManager', category: 'utilities', defaultWidth: 1000, defaultHeight: 750, minWidth: 700, minHeight: 500, resizable: true, multiple: false },
  { id: 'project-planner', name: '项目规划器', icon: <ProjectPlannerIcon />, component: 'ProjectPlanner', category: 'development', defaultWidth: 1200, defaultHeight: 850, minWidth: 900, minHeight: 600, resizable: true, multiple: false },
  { id: 'code-generator', name: '代码生成器', icon: <CpuIcon />, component: 'CodeGenerator', category: 'development', defaultWidth: 1200, defaultHeight: 850, minWidth: 900, minHeight: 650, resizable: true, multiple: false },
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
  { id: 'smartdashboard', name: '智能仪表盘', icon: <DashboardIcon />, component: 'SmartDashboard', category: 'utilities', defaultWidth: 1200, defaultHeight: 850, minWidth: 900, minHeight: 600, resizable: true, multiple: false },
  { id: 'autoflow', name: 'AutoFlow 工作流', icon: <AutoFlowIcon />, component: 'AutoFlow', category: 'utilities', defaultWidth: 1300, defaultHeight: 800, minWidth: 1000, minHeight: 600, resizable: true, multiple: false },
  { id: 'focus-mode', name: '专注模式', icon: <FocusIcon />, component: 'FocusMode', category: 'utilities', defaultWidth: 1100, defaultHeight: 750, minWidth: 900, minHeight: 600, resizable: true, multiple: false },
  { id: 'task-board', name: '任务看板', icon: <BoardIcon />, component: 'TaskBoard', category: 'office', defaultWidth: 1200, defaultHeight: 800, minWidth: 900, minHeight: 600, resizable: true, multiple: false },
  { id: 'idea-capture', name: '灵感速记', icon: <IdeaIcon />, component: 'IdeaCapture', category: 'utilities', defaultWidth: 900, defaultHeight: 700, minWidth: 600, minHeight: 500, resizable: true, multiple: false },
  { id: 'code-diff-viewer', name: '代码差异查看器', icon: <DiffIcon />, component: 'CodeDiffViewer', category: 'development', defaultWidth: 1200, defaultHeight: 800, minWidth: 800, minHeight: 600, resizable: true, multiple: false },
  { id: 'image-optimizer', name: '图片优化器', icon: <ImageOptimizeIcon />, component: 'ImageOptimizer', category: 'utilities', defaultWidth: 1000, defaultHeight: 700, minWidth: 700, minHeight: 500, resizable: true, multiple: false },
  { id: 'network-speed-test', name: '网络速度测试', icon: <SpeedTestIcon />, component: 'NetworkSpeedTest', category: 'utilities', defaultWidth: 600, defaultHeight: 700, minWidth: 500, minHeight: 500, resizable: true, multiple: false },
  { id: 'quick-tools', name: '快速工具箱', icon: <WrenchIcon />, component: 'RandomTools', category: 'utilities', defaultWidth: 900, defaultHeight: 700, minWidth: 700, minHeight: 500, resizable: true, multiple: false },
  { id: 'learning-platform', name: '学习平台', icon: <GraduationCapIcon />, component: 'LearningPlatform', category: 'utilities', defaultWidth: 1200, defaultHeight: 800, minWidth: 900, minHeight: 600, resizable: true, multiple: false },
  { id: 'crypto-tracker', name: '加密货币追踪器', icon: <CryptoIcon />, component: 'CryptoTracker', category: 'utilities', defaultWidth: 600, defaultHeight: 900, minWidth: 450, minHeight: 600, resizable: true, multiple: false },
  { id: 'code-snippets', name: '代码片段管理', icon: <CodeSnippetsIcon />, component: 'CodeSnippetsManager', category: 'development', defaultWidth: 1100, defaultHeight: 750, minWidth: 800, minHeight: 500, resizable: true, multiple: false },
  { id: 'chat-ai', name: 'AI 智能助手', icon: <ChatAIIcon />, component: 'ChatAI', category: 'utilities', defaultWidth: 1000, defaultHeight: 750, minWidth: 700, minHeight: 500, resizable: true, multiple: false },
  { id: 'code-studio', name: 'Code Studio', icon: <CodeStudioIcon />, component: 'CodeStudio', category: 'development', defaultWidth: 1100, defaultHeight: 800, minWidth: 800, minHeight: 550, resizable: true, multiple: false },
  { id: 'text-formatter', name: '文本格式化', icon: <TextFormatIcon />, component: 'TextFormatter', category: 'utilities', defaultWidth: 850, defaultHeight: 700, minWidth: 600, minHeight: 500, resizable: true, multiple: false },
  { id: 'currency-converter', name: '汇率转换', icon: <CurrencyIcon />, component: 'CurrencyConverter', category: 'utilities', defaultWidth: 600, defaultHeight: 800, minWidth: 500, minHeight: 600, resizable: true, multiple: false },
  { id: 'voice-transcriber', name: '语音转录', icon: <VoiceIcon />, component: 'VoiceTranscriber', category: 'utilities', defaultWidth: 800, defaultHeight: 700, minWidth: 600, minHeight: 500, resizable: true, multiple: false },
  { id: 'news-reader', name: '新闻阅读器', icon: <NewsIcon />, component: 'NewsReader', category: 'internet', defaultWidth: 1000, defaultHeight: 700, minWidth: 600, minHeight: 450, resizable: true, multiple: false },
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
  { id: 'game-snake', name: '贪吃蛇', icon: <SnakeIcon />, component: 'GameSnake', category: 'games', defaultWidth: 400, defaultHeight: 450, minWidth: 350, minHeight: 400, resizable: false, multiple: false },
  { id: 'game-tetris', name: '俄罗斯方块', icon: <TetrisIcon />, component: 'GameTetris', category: 'games', defaultWidth: 400, defaultHeight: 520, minWidth: 300, minHeight: 450, resizable: false, multiple: false },
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
  { id: 'ip-lookup', name: 'IP & DNS 查询', icon: <CustomGlobeIcon />, component: 'IPLookup', category: 'utilities', defaultWidth: 800, defaultHeight: 700, minWidth: 600, minHeight: 500, resizable: true, multiple: false },
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
  { id: 'ai-assistant-pro', name: 'AI智能助手', icon: <AIAssistantProIcon />, component: 'AIAssistant', category: 'utilities', defaultWidth: 800, defaultHeight: 650, minWidth: 500, minHeight: 400, resizable: true, multiple: false },
  { id: 'ai-smart-assistant', name: 'AI智能对话助手', icon: <AISmartAssistantIcon />, component: 'AISmartAssistant', category: 'utilities', defaultWidth: 900, defaultHeight: 700, minWidth: 600, minHeight: 500, resizable: true, multiple: false },
  { id: 'notes-app-pro', name: '专业笔记应用', icon: <NotesAppIcon />, component: 'NotesApp', category: 'office', defaultWidth: 1100, defaultHeight: 800, minWidth: 700, minHeight: 500, resizable: true, multiple: false },
  { id: 'todo-app-pro', name: '专业待办事项', icon: <TodoAppIcon />, component: 'TodoApp', category: 'office', defaultWidth: 1000, defaultHeight: 750, minWidth: 600, minHeight: 500, resizable: true, multiple: false },
  { id: 'system-health-dashboard-enhanced', name: '增强版系统健康监控', icon: <SystemHealthDashboardIcon />, component: 'SystemHealthDashboardEnhanced', category: 'system', defaultWidth: 1200, defaultHeight: 900, minWidth: 900, minHeight: 600, resizable: true, multiple: false },
  { id: 'code-collaboration-hub', name: '代码协作中心', icon: <CodeStudioIcon />, component: 'CodeCollaborationHub', category: 'development', defaultWidth: 1100, defaultHeight: 800, minWidth: 800, minHeight: 600, resizable: true, multiple: false },
  { id: 'api-tester-pro', name: 'API测试器Pro', icon: <ApiIcon />, component: 'APITesterPro', category: 'development', defaultWidth: 1100, defaultHeight: 800, minWidth: 800, minHeight: 600, resizable: true, multiple: false },
  { id: 'productivity-hub', name: '生产力中心', icon: <ListTodoIcon />, component: 'ProductivityHub', category: 'office', defaultWidth: 1200, defaultHeight: 850, minWidth: 900, minHeight: 600, resizable: true, multiple: false },
  { id: 'api-lab', name: 'API 实验室', icon: <svg viewBox="0 0 24 24" width="18" height="18" stroke="currentColor" strokeWidth="2" fill="none"><path d="M9 2v6l-5 9a2 2 0 0 0 2 3h12a2 2 0 0 0 2-3l-5-9V2"/><line x1="8" y1="2" x2="16" y2="2"/><circle cx="12" cy="15" r="1.5"/></svg>, component: 'APILab', category: 'development', defaultWidth: 1300, defaultHeight: 900, minWidth: 950, minHeight: 700, resizable: true, multiple: false },
  { id: 'smart-hub', name: '智能聚合面板', icon: <svg viewBox="0 0 24 24" width="18" height="18" stroke="currentColor" strokeWidth="2" fill="none"><rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/><rect x="3" y="14" width="7" height="7" rx="1"/><rect x="14" y="14" width="7" height="7" rx="1"/><circle cx="6.5" cy="6.5" r="1.5" fill="currentColor"/><circle cx="17.5" cy="6.5" r="1.5" fill="currentColor"/><circle cx="6.5" cy="17.5" r="1.5" fill="currentColor"/><circle cx="17.5" cy="17.5" r="1.5" fill="currentColor"/></svg>, component: 'SmartHub', category: 'utilities', defaultWidth: 1350, defaultHeight: 900, minWidth: 1000, minHeight: 700, resizable: true, multiple: false },
]