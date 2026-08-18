import { useState, useEffect, useCallback, useRef, useMemo } from 'react'

// ======================== 类型定义 ========================

interface WindowState {
  id: string
  appId: string
  title: string
  x: number
  y: number
  width: number
  height: number
  zIndex: number
  focused: boolean
  minimized: boolean
}

interface WorkspaceData {
  id: string
  name: string
  icon: string
  color: string
  windows: WindowState[]
  createdAt: number
  lastUsedAt: number
  tags: string[]
  autoSave?: boolean
}

interface LayoutTemplate {
  id: string
  name: string
  icon: string
  color: string
  description: string
  windows: Omit<WindowState, 'id'>[]
}

interface SnapPreset {
  id: string
  name: string
  icon: string
  ratios: number[]
}

// ======================== 常量 ========================

const STORAGE_KEY = 'weblinux-workspace-layouts'
const RECENT_KEY = 'weblinux-workspace-recent'
const AUTOSAVE_KEY = 'weblinux-workspace-autosave'
const AUTOSAVE_INTERVAL = 30000

const COLORS = [
  '#9b8af0', '#00cec9', '#f59e0b', '#ef4444', '#10b981',
  '#3b82f6', '#8b5cf6', '#ec4899', '#06b6d4', '#f97316',
]

const ICONS = ['💻', '🎨', '📝', '📊', '🔧', '🚀', '🎯', '🗂️', '⚡', '🌐']

const LAYOUT_TEMPLATES: LayoutTemplate[] = [
  {
    id: 'developer',
    name: '开发者',
    icon: '💻',
    color: '#3b82f6',
    description: '终端 + 代码编辑器 + 文件管理器 + 浏览器',
    windows: [
      { appId: 'terminal', title: '终端', x: 0, y: 0, width: 50, height: 50, zIndex: 1, focused: true, minimized: false },
      { appId: 'code-editor', title: '代码编辑器', x: 50, y: 0, width: 50, height: 100, zIndex: 2, focused: false, minimized: false },
      { appId: 'files', title: '文件管理器', x: 0, y: 50, width: 50, height: 50, zIndex: 3, focused: false, minimized: false },
      { appId: 'browser', title: '浏览器', x: 25, y: 25, width: 50, height: 50, zIndex: 4, focused: false, minimized: false },
    ],
  },
  {
    id: 'designer',
    name: '设计师',
    icon: '🎨',
    color: '#ec4899',
    description: '图像查看器 + 取色器 + 画图 + CSS 工作室',
    windows: [
      { appId: 'image-viewer', title: '图像查看器', x: 0, y: 0, width: 50, height: 100, zIndex: 1, focused: true, minimized: false },
      { appId: 'color-picker', title: '取色器', x: 50, y: 0, width: 50, height: 50, zIndex: 2, focused: false, minimized: false },
      { appId: 'paint', title: '画图', x: 50, y: 50, width: 50, height: 50, zIndex: 3, focused: false, minimized: false },
      { appId: 'css-studio', title: 'CSS 工作室', x: 25, y: 25, width: 50, height: 50, zIndex: 4, focused: false, minimized: false },
    ],
  },
  {
    id: 'writer',
    name: '写作者',
    icon: '📝',
    color: '#10b981',
    description: '文本编辑器 + Markdown 编辑器 + 字典 + 笔记',
    windows: [
      { appId: 'text-editor', title: '文本编辑器', x: 0, y: 0, width: 60, height: 100, zIndex: 1, focused: true, minimized: false },
      { appId: 'markdown-editor', title: 'Markdown 编辑器', x: 60, y: 0, width: 40, height: 60, zIndex: 2, focused: false, minimized: false },
      { appId: 'dictionary', title: '字典', x: 60, y: 60, width: 40, height: 40, zIndex: 3, focused: false, minimized: false },
      { appId: 'notes', title: '笔记', x: 30, y: 30, width: 40, height: 40, zIndex: 4, focused: false, minimized: false },
    ],
  },
  {
    id: 'data-analyst',
    name: '数据分析师',
    icon: '📊',
    color: '#f59e0b',
    description: '电子表格 + 数据可视化 + JSON 工具 + API 测试',
    windows: [
      { appId: 'spreadsheet', title: '电子表格', x: 0, y: 0, width: 60, height: 50, zIndex: 1, focused: true, minimized: false },
      { appId: 'data-visualizer', title: '数据可视化', x: 60, y: 0, width: 40, height: 50, zIndex: 2, focused: false, minimized: false },
      { appId: 'json-formatter', title: 'JSON 工具', x: 0, y: 50, width: 50, height: 50, zIndex: 3, focused: false, minimized: false },
      { appId: 'api-tester', title: 'API 测试', x: 50, y: 50, width: 50, height: 50, zIndex: 4, focused: false, minimized: false },
    ],
  },
  {
    id: 'sysadmin',
    name: '系统管理员',
    icon: '🔧',
    color: '#ef4444',
    description: '终端 + 系统监控 + 网络工具 + 进程监控',
    windows: [
      { appId: 'terminal', title: '终端', x: 0, y: 0, width: 50, height: 50, zIndex: 1, focused: true, minimized: false },
      { appId: 'system-monitor', title: '系统监控', x: 50, y: 0, width: 50, height: 50, zIndex: 2, focused: false, minimized: false },
      { appId: 'network-toolkit', title: '网络工具', x: 0, y: 50, width: 50, height: 50, zIndex: 3, focused: false, minimized: false },
      { appId: 'process-monitor', title: '进程监控', x: 50, y: 50, width: 50, height: 50, zIndex: 4, focused: false, minimized: false },
    ],
  },
]

const SNAP_PRESETS: SnapPreset[] = [
  { id: 'half', name: '50/50', icon: '▬▬', ratios: [50, 50] },
  { id: 'thirds', name: '33/33/33', icon: '▬▬▬', ratios: [33, 34, 33] },
  { id: 'seven-three', name: '70/30', icon: '▬▬▬▬▬▬▬▬▬', ratios: [70, 30] },
  { id: 'quarter', name: '25×4', icon: '▬▬▬▬', ratios: [25, 25, 25, 25] },
  { id: 'main-side', name: '主+侧', icon: '▬▬▬▬▬▬▬▬', ratios: [65, 35] },
  { id: 'main-two', name: '主+双', icon: '▬▬▬▬▬▬▬', ratios: [50, 25, 25] },
]

type TabId = 'workspaces' | 'templates' | 'editor' | 'snap' | 'recent' | 'share'

// ======================== 工具函数 ========================

function generateId(): string {
  return `ws-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`
}

function formatDate(ts: number): string {
  const d = new Date(ts)
  return d.toLocaleDateString('zh-CN', {
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

function loadFromStorage<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(key)
    if (raw) return JSON.parse(raw)
  } catch { /* ignore */ }
  return fallback
}

function saveToStorage(key: string, data: unknown): void {
  try {
    localStorage.setItem(key, JSON.stringify(data))
  } catch { /* ignore */ }
}

function getRelativeTime(ts: number): string {
  const diff = Date.now() - ts
  if (diff < 60000) return '刚刚'
  if (diff < 3600000) return `${Math.floor(diff / 60000)} 分钟前`
  if (diff < 86400000) return `${Math.floor(diff / 3600000)} 小时前`
  return `${Math.floor(diff / 86400000)} 天前`
}

// ======================== 组件 ========================

export default function WorkspaceLayout() {
  // ---------- 状态 ----------
  const [workspaces, setWorkspaces] = useState<WorkspaceData[]>(() =>
    loadFromStorage<WorkspaceData[]>(STORAGE_KEY, [])
  )
  const [recentIds, setRecentIds] = useState<string[]>(() =>
    loadFromStorage<string[]>(RECENT_KEY, [])
  )
  const [activeTab, setActiveTab] = useState<TabId>('workspaces')
  const [selectedWsId, setSelectedWsId] = useState<string | null>(null)
  const [previewWsId, setPreviewWsId] = useState<string | null>(null)
  const [isCreating, setIsCreating] = useState(false)
  const [newName, setNewName] = useState('')
  const [newIcon, setNewIcon] = useState('💻')
  const [newColor, setNewColor] = useState('#9b8af0')
  const [newTag, setNewTag] = useState('')
  const [newTags, setNewTags] = useState<string[]>([])
  const [editWsId, setEditWsId] = useState<string | null>(null)
  const [editName, setEditName] = useState('')
  const [toast, setToast] = useState<string | null>(null)
  const [dragEditorWindow, setDragEditorWindow] = useState<number | null>(null)
  const [editorWindows, setEditorWindows] = useState<WindowState[]>([])
  const [autoSaveEnabled, setAutoSaveEnabled] = useState(() =>
    loadFromStorage<boolean>(AUTOSAVE_KEY, true)
  )
  const [importText, setImportText] = useState('')
  const [showImportModal, setShowImportModal] = useState(false)
  const [quickSwitchNum, setQuickSwitchNum] = useState<number | null>(null)

  const autoSaveTimerRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const toastTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  // ---------- 派生 ----------
  const selectedWorkspace = useMemo(
    () => workspaces.find(w => w.id === selectedWsId) ?? null,
    [workspaces, selectedWsId]
  )

  const previewWorkspace = useMemo(
    () => workspaces.find(w => w.id === previewWsId) ?? null,
    [workspaces, previewWsId]
  )

  const recentWorkspaces = useMemo(
    () => recentIds.map(id => workspaces.find(w => w.id === id)).filter(Boolean) as WorkspaceData[],
    [recentIds, workspaces]
  )

  // ---------- 持久化 ----------
  useEffect(() => {
    saveToStorage(STORAGE_KEY, workspaces)
  }, [workspaces])

  useEffect(() => {
    saveToStorage(RECENT_KEY, recentIds)
  }, [recentIds])

  useEffect(() => {
    saveToStorage(AUTOSAVE_KEY, autoSaveEnabled)
  }, [autoSaveEnabled])

  // ---------- Toast ----------
  const showToast = useCallback((msg: string) => {
    setToast(msg)
    if (toastTimerRef.current) clearTimeout(toastTimerRef.current)
    toastTimerRef.current = setTimeout(() => setToast(null), 2500)
  }, [])

  // ---------- 自动保存 ----------
  useEffect(() => {
    if (autoSaveTimerRef.current) clearInterval(autoSaveTimerRef.current)
    if (!autoSaveEnabled) return

    autoSaveTimerRef.current = setInterval(() => {
      if (selectedWsId) {
        setWorkspaces(prev => prev.map(w =>
          w.id === selectedWsId ? { ...w, lastUsedAt: Date.now(), autoSave: true } : w
        ))
      }
    }, AUTOSAVE_INTERVAL)

    return () => {
      if (autoSaveTimerRef.current) clearInterval(autoSaveTimerRef.current)
    }
  }, [autoSaveEnabled, selectedWsId])

  // ---------- 快捷键 Ctrl+1-9 ----------
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.ctrlKey && !e.altKey && !e.shiftKey) {
        const num = parseInt(e.key, 10)
        if (num >= 1 && num <= 9) {
          e.preventDefault()
          setQuickSwitchNum(num)
          const idx = num - 1
          if (idx < workspaces.length) {
            const ws = workspaces[idx]
            restoreWorkspace(ws)
            showToast(`切换到工作区: ${ws.name}`)
          }
          setTimeout(() => setQuickSwitchNum(null), 600)
        }
      }
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [workspaces, showToast])

  // ---------- 工作区操作 ----------
  const saveCurrentWorkspace = useCallback(() => {
    if (!newName.trim()) return

    const newWs: WorkspaceData = {
      id: generateId(),
      name: newName.trim(),
      icon: newIcon,
      color: newColor,
      windows: captureCurrentWindows(),
      createdAt: Date.now(),
      lastUsedAt: Date.now(),
      tags: newTags,
      autoSave: autoSaveEnabled,
    }

    setWorkspaces(prev => [newWs, ...prev])
    setSelectedWsId(newWs.id)
    setRecentIds(prev => [newWs.id, ...prev.filter(id => id !== newWs.id)].slice(0, 20))
    setIsCreating(false)
    setNewName('')
    setNewTags([])
    showToast(`工作区 "${newWs.name}" 已保存`)
  }, [newName, newIcon, newColor, newTags, autoSaveEnabled, showToast])

  const restoreWorkspace = useCallback((ws: WorkspaceData) => {
    const event = new CustomEvent('weblinux-restore-workspace', {
      detail: { windows: ws.windows },
    })
    window.dispatchEvent(event)

    ws.windows.forEach(w => {
      const launchEvent = new CustomEvent('weblinux-launch-app', { detail: { appId: w.appId } })
      window.dispatchEvent(launchEvent)
    })

    setWorkspaces(prev => prev.map(w =>
      w.id === ws.id ? { ...w, lastUsedAt: Date.now() } : w
    ))
    setRecentIds(prev => [ws.id, ...prev.filter(id => id !== ws.id)].slice(0, 20))
    setSelectedWsId(ws.id)
    showToast(`已加载工作区: ${ws.name}`)
  }, [showToast])

  const deleteWorkspace = useCallback((id: string) => {
    setWorkspaces(prev => prev.filter(w => w.id !== id))
    setRecentIds(prev => prev.filter(rid => rid !== id))
    if (selectedWsId === id) setSelectedWsId(null)
    if (previewWsId === id) setPreviewWsId(null)
    showToast('工作区已删除')
  }, [selectedWsId, previewWsId, showToast])

  const updateWorkspace = useCallback((id: string, updates: Partial<WorkspaceData>) => {
    setWorkspaces(prev => prev.map(w =>
      w.id === id ? { ...w, ...updates, lastUsedAt: Date.now() } : w
    ))
  }, [])

  const applyTemplate = useCallback((template: LayoutTemplate) => {
    const windows: WindowState[] = template.windows.map((w, i) => ({
      ...w,
      id: `win-${Date.now()}-${i}`,
    }))

    const newWs: WorkspaceData = {
      id: generateId(),
      name: template.name,
      icon: template.icon,
      color: template.color,
      windows,
      createdAt: Date.now(),
      lastUsedAt: Date.now(),
      tags: ['模板'],
      autoSave: autoSaveEnabled,
    }

    setWorkspaces(prev => [newWs, ...prev])
    setSelectedWsId(newWs.id)
    setRecentIds(prev => [newWs.id, ...prev.filter(id => id !== newWs.id)].slice(0, 20))
    showToast(`模板 "${template.name}" 已创建`)
  }, [autoSaveEnabled, showToast])

  const captureCurrentWindows = useCallback((): WindowState[] => {
    try {
      const store = (window as any).__WEBLINUX_STORE__
      if (store) {
        const wins = store.getState?.()?.windows
        if (Array.isArray(wins)) {
          return wins.map((w: any, i: number) => ({
            id: w.id || `win-${i}`,
            appId: w.appId || 'unknown',
            title: w.title || w.appId || '',
            x: typeof w.x === 'number' ? w.x : 0,
            y: typeof w.y === 'number' ? w.y : 0,
            width: typeof w.width === 'number' ? w.width : 50,
            height: typeof w.height === 'number' ? w.height : 50,
            zIndex: i,
            focused: w.focused ?? false,
            minimized: w.minimized ?? false,
          }))
        }
      }
    } catch { /* ignore */ }
    return []
  }, [])

  // ---------- 导出/导入 ----------
  const exportWorkspace = useCallback((ws: WorkspaceData) => {
    const json = JSON.stringify(ws, null, 2)
    const blob = new Blob([json], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `${ws.name}.workspace.json`
    a.click()
    URL.revokeObjectURL(url)
    showToast('已导出工作区配置')
  }, [showToast])

  const exportAll = useCallback(() => {
    const json = JSON.stringify({ version: 1, workspaces }, null, 2)
    const blob = new Blob([json], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = 'all-workspaces.json'
    a.click()
    URL.revokeObjectURL(url)
    showToast('已导出全部工作区')
  }, [workspaces, showToast])

  const importWorkspaces = useCallback(() => {
    if (!importText.trim()) return
    try {
      const parsed = JSON.parse(importText)
      if (Array.isArray(parsed)) {
        const incoming = parsed as WorkspaceData[]
        setWorkspaces(prev => [...incoming, ...prev])
        showToast(`已导入 ${incoming.length} 个工作区`)
      } else if (parsed.workspaces && Array.isArray(parsed.workspaces)) {
        const incoming = parsed.workspaces as WorkspaceData[]
        setWorkspaces(prev => [...incoming, ...prev])
        showToast(`已导入 ${incoming.length} 个工作区`)
      } else if (parsed.id && parsed.windows) {
        const incoming = parsed as WorkspaceData
        setWorkspaces(prev => [incoming, ...prev])
        showToast('已导入 1 个工作区')
      } else {
        showToast('无法识别的格式')
      }
    } catch {
      showToast('JSON 解析失败')
    }
    setImportText('')
    setShowImportModal(false)
  }, [importText, showToast])

  // ---------- 布局编辑器 ----------
  const startEditor = useCallback((ws: WorkspaceData | null) => {
    if (ws) {
      setEditorWindows([...ws.windows])
      setEditWsId(ws.id)
    } else {
      setEditorWindows([
        {
          id: `win-${Date.now()}-0`,
          appId: 'terminal',
          title: '终端',
          x: 0, y: 0,
          width: 50, height: 50,
          zIndex: 1,
          focused: true,
          minimized: false,
        },
      ])
      setEditWsId(null)
    }
    setActiveTab('editor')
  }, [])

  const addEditorWindow = useCallback(() => {
    setEditorWindows(prev => [
      ...prev,
      {
        id: `win-${Date.now()}-${prev.length}`,
        appId: 'app',
        title: `窗口 ${prev.length + 1}`,
        x: 10, y: 10,
        width: 40, height: 40,
        zIndex: prev.length + 1,
        focused: false,
        minimized: false,
      },
    ])
  }, [])

  const removeEditorWindow = useCallback((idx: number) => {
    setEditorWindows(prev => prev.filter((_, i) => i !== idx))
  }, [])

  const updateEditorWindow = useCallback((idx: number, field: keyof WindowState, value: any) => {
    setEditorWindows(prev => prev.map((w, i) => i === idx ? { ...w, [field]: value } : w))
  }, [])

  const saveEditorLayout = useCallback(() => {
    if (editWsId) {
      updateWorkspace(editWsId, { windows: [...editorWindows] })
      showToast('布局已更新')
    } else {
      const newWs: WorkspaceData = {
        id: generateId(),
        name: '自定义布局',
        icon: '🗂️',
        color: '#8b5cf6',
        windows: [...editorWindows],
        createdAt: Date.now(),
        lastUsedAt: Date.now(),
        tags: ['自定义'],
        autoSave: autoSaveEnabled,
      }
      setWorkspaces(prev => [newWs, ...prev])
      setSelectedWsId(newWs.id)
      showToast('自定义布局已保存')
    }
    setActiveTab('workspaces')
  }, [editWsId, editorWindows, updateWorkspace, autoSaveEnabled, showToast])

  // ---------- 吸附预设 ----------
  const applySnap = useCallback((preset: SnapPreset) => {
    const windows: WindowState[] = preset.ratios.map((ratio, i) => {
      let xOffset = 0
      for (let j = 0; j < i; j++) xOffset += preset.ratios[j]
      return {
        id: `win-${Date.now()}-${i}`,
        appId: 'app',
        title: `窗口 ${i + 1}`,
        x: xOffset,
        y: 0,
        width: ratio,
        height: 100,
        zIndex: i + 1,
        focused: i === 0,
        minimized: false,
      }
    })

    const newWs: WorkspaceData = {
      id: generateId(),
      name: `${preset.name} 分屏`,
      icon: '⚡',
      color: '#06b6d4',
      windows,
      createdAt: Date.now(),
      lastUsedAt: Date.now(),
      tags: ['分屏'],
      autoSave: autoSaveEnabled,
    }

    setWorkspaces(prev => [newWs, ...prev])
    setSelectedWsId(newWs.id)
    showToast(`已创建 ${preset.name} 分屏布局`)
  }, [autoSaveEnabled, showToast])

  // ---------- 编辑器拖拽 ----------
  const handleEditorMouseDown = useCallback((e: React.MouseEvent, idx: number) => {
    e.preventDefault()
    setDragEditorWindow(idx)
  }, [])

  const handleEditorMouseMove = useCallback((e: React.MouseEvent) => {
    if (dragEditorWindow === null) return
    const container = (e.currentTarget as HTMLElement).getBoundingClientRect()
    const x = Math.max(0, Math.min(90, ((e.clientX - container.left) / container.width) * 100 - 5))
    const y = Math.max(0, Math.min(90, ((e.clientY - container.top) / container.height) * 100 - 5))
    setEditorWindows(prev => prev.map((w, i) =>
      i === dragEditorWindow ? { ...w, x: Math.round(x), y: Math.round(y) } : w
    ))
  }, [dragEditorWindow])

  const handleEditorMouseUp = useCallback(() => {
    setDragEditorWindow(null)
  }, [])

  // ======================== 样式 ========================

  const s = {
    root: {
      height: '100%' as const,
      display: 'flex',
      flexDirection: 'column' as const,
      background: 'linear-gradient(145deg, #0c0c1d 0%, #141428 40%, #0f1628 100%)',
      color: '#e2e8f0',
      fontFamily: "'Inter', 'Noto Sans SC', system-ui, sans-serif",
      overflow: 'hidden',
    },
    header: {
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      padding: '14px 20px',
      borderBottom: '1px solid rgba(255,255,255,0.06)',
      background: 'rgba(0,0,0,0.3)',
      backdropFilter: 'blur(20px)',
      WebkitBackdropFilter: 'blur(20px)',
    },
    headerIcon: {
      width: '38px',
      height: '38px',
      borderRadius: '11px',
      background: 'linear-gradient(135deg, #7c3aed, #06b6d4)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      fontSize: '18px',
      boxShadow: '0 4px 15px rgba(124, 58, 237, 0.3)',
    },
    tab: (isActive: boolean): React.CSSProperties => ({
      padding: '7px 16px',
      background: isActive ? 'rgba(124, 58, 237, 0.2)' : 'transparent',
      border: isActive ? '1px solid rgba(124, 58, 237, 0.4)' : '1px solid transparent',
      borderRadius: '8px',
      color: isActive ? '#c4b5fd' : '#94a3b8',
      fontSize: '12px',
      fontWeight: isActive ? 600 : 400,
      cursor: 'pointer',
      transition: 'all 0.2s',
      whiteSpace: 'nowrap' as const,
    }),
    content: {
      flex: 1,
      display: 'flex',
      overflow: 'hidden',
    },
    sidebar: {
      width: '260px',
      borderRight: '1px solid rgba(255,255,255,0.06)',
      overflowY: 'auto' as const,
      padding: '12px',
      background: 'rgba(0,0,0,0.15)',
    },
    main: {
      flex: 1,
      padding: '20px',
      overflowY: 'auto' as const,
    },
    card: (color: string, hover = false): React.CSSProperties => ({
      background: `linear-gradient(135deg, ${color}10, ${color}06)`,
      border: `1px solid ${color}30`,
      borderRadius: '12px',
      padding: '16px',
      transition: 'all 0.25s cubic-bezier(.4,0,.2,1)',
      cursor: 'pointer',
      transform: hover ? 'translateY(-3px)' : 'none',
      boxShadow: hover ? `0 12px 30px ${color}18` : 'none',
    }),
    btn: (variant: 'primary' | 'secondary' | 'danger' | 'ghost' = 'secondary'): React.CSSProperties => {
      const base: React.CSSProperties = {
        display: 'inline-flex',
        alignItems: 'center',
        gap: '6px',
        padding: '8px 14px',
        border: 'none',
        borderRadius: '8px',
        cursor: 'pointer',
        fontSize: '12px',
        fontWeight: 500,
        transition: 'all 0.2s',
        whiteSpace: 'nowrap' as const,
      }
      switch (variant) {
        case 'primary':
          return { ...base, background: 'linear-gradient(135deg, #7c3aed, #3b82f6)', color: '#fff', boxShadow: '0 4px 12px rgba(124,58,237,0.3)' }
        case 'danger':
          return { ...base, background: 'rgba(239,68,68,0.12)', color: '#f87171', border: '1px solid rgba(239,68,68,0.25)' }
        case 'ghost':
          return { ...base, background: 'transparent', color: '#94a3b8', border: '1px solid rgba(255,255,255,0.1)' }
        default:
          return { ...base, background: 'rgba(255,255,255,0.06)', color: '#e2e8f0', border: '1px solid rgba(255,255,255,0.1)' }
      }
    },
    input: {
      width: '100%',
      padding: '8px 12px',
      background: 'rgba(255,255,255,0.05)',
      border: '1px solid rgba(255,255,255,0.1)',
      borderRadius: '8px',
      color: '#e2e8f0',
      fontSize: '13px',
      outline: 'none',
      boxSizing: 'border-box' as const,
      transition: 'border-color 0.2s',
    },
    glass: {
      background: 'rgba(255,255,255,0.03)',
      backdropFilter: 'blur(12px)',
      WebkitBackdropFilter: 'blur(12px)',
      border: '1px solid rgba(255,255,255,0.08)',
      borderRadius: '12px',
    },
    wsItem: (isSelected: boolean, color: string): React.CSSProperties => ({
      padding: '10px 12px',
      borderRadius: '10px',
      cursor: 'pointer',
      marginBottom: '4px',
      transition: 'all 0.2s',
      background: isSelected ? `${color}20` : 'transparent',
      border: isSelected ? `1px solid ${color}40` : '1px solid transparent',
    }),
  }

  // ======================== 渲染 ========================

  // ---------- 侧边栏列表 ----------
  const renderSidebar = () => (
    <div style={s.sidebar}>
      {/* 新建工作区表单 */}
      {isCreating && (
        <div style={{
          background: 'rgba(124,58,237,0.08)',
          border: '1px solid rgba(124,58,237,0.25)',
          borderRadius: '12px',
          padding: '14px',
          marginBottom: '12px',
          animation: 'fadeIn 0.25s ease',
        }}>
          <div style={{ fontSize: '13px', fontWeight: 600, marginBottom: '10px', color: '#c4b5fd' }}>新建工作区</div>
          <input
            value={newName}
            onChange={e => setNewName(e.target.value)}
            placeholder="工作区名称"
            style={{ ...s.input, marginBottom: '8px' }}
            autoFocus
            onKeyDown={e => e.key === 'Enter' && saveCurrentWorkspace()}
          />
          <div style={{ display: 'flex', gap: '6px', marginBottom: '8px', flexWrap: 'wrap' }}>
            {ICONS.map(icon => (
              <button
                key={icon}
                onClick={() => setNewIcon(icon)}
                style={{
                  width: '30px', height: '30px',
                  background: newIcon === icon ? 'rgba(124,58,237,0.3)' : 'rgba(255,255,255,0.05)',
                  border: newIcon === icon ? '1px solid rgba(124,58,237,0.5)' : '1px solid rgba(255,255,255,0.08)',
                  borderRadius: '6px', cursor: 'pointer', fontSize: '14px',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                }}
              >{icon}</button>
            ))}
          </div>
          <div style={{ display: 'flex', gap: '4px', marginBottom: '10px', flexWrap: 'wrap' }}>
            {COLORS.map(c => (
              <button
                key={c}
                onClick={() => setNewColor(c)}
                style={{
                  width: '22px', height: '22px', borderRadius: '50%',
                  background: c, cursor: 'pointer', border: newColor === c ? '2px solid #fff' : '2px solid transparent',
                  transition: 'border-color 0.15s',
                }}
              />
            ))}
          </div>
          <div style={{ display: 'flex', gap: '6px', marginBottom: '8px' }}>
            <input
              value={newTag}
              onChange={e => setNewTag(e.target.value)}
              placeholder="添加标签"
              style={{ ...s.input, flex: 1 }}
              onKeyDown={e => {
                if (e.key === 'Enter' && newTag.trim()) {
                  setNewTags(prev => [...prev, newTag.trim()])
                  setNewTag('')
                }
              }}
            />
          </div>
          {newTags.length > 0 && (
            <div style={{ display: 'flex', gap: '4px', flexWrap: 'wrap', marginBottom: '8px' }}>
              {newTags.map(tag => (
                <span key={tag} style={{
                  padding: '2px 8px', background: 'rgba(255,255,255,0.08)',
                  borderRadius: '4px', fontSize: '11px', color: '#94a3b8',
                  display: 'flex', alignItems: 'center', gap: '4px',
                }}>
                  {tag}
                  <span style={{ cursor: 'pointer', fontSize: '13px' }} onClick={() => setNewTags(prev => prev.filter(t => t !== tag))}>×</span>
                </span>
              ))}
            </div>
          )}
          <div style={{ display: 'flex', gap: '8px' }}>
            <button onClick={saveCurrentWorkspace} style={{ ...s.btn('primary'), flex: 1 }}>保存</button>
            <button onClick={() => { setIsCreating(false); setNewName(''); setNewTags([]) }} style={s.btn('ghost')}>取消</button>
          </div>
        </div>
      )}

      {/* 工作区列表 */}
      {workspaces.length === 0 && !isCreating ? (
        <div style={{ padding: '40px 16px', textAlign: 'center', color: '#64748b', fontSize: '13px' }}>
          <div style={{ fontSize: '36px', marginBottom: '12px', opacity: 0.5 }}>📂</div>
          <div>暂无工作区</div>
          <div style={{ fontSize: '12px', marginTop: '6px', opacity: 0.7 }}>点击"保存当前布局"创建</div>
        </div>
      ) : (
        workspaces.map((ws, idx) => (
          <div
            key={ws.id}
            onClick={() => setSelectedWsId(ws.id)}
            onMouseEnter={() => setPreviewWsId(ws.id)}
            onMouseLeave={() => setPreviewWsId(null)}
            style={s.wsItem(selectedWsId === ws.id, ws.color)}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
              <span style={{ fontSize: '16px' }}>{ws.icon}</span>
              <span style={{ fontWeight: 500, fontSize: '13px', flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {ws.name}
              </span>
              {idx < 9 && (
                <span style={{
                  fontSize: '10px', padding: '1px 5px',
                  background: 'rgba(255,255,255,0.06)', borderRadius: '4px',
                  color: '#64748b', fontFamily: 'monospace',
                }}>
                  ^{idx + 1}
                </span>
              )}
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '11px', color: '#64748b', paddingLeft: '24px' }}>
              <span>{ws.windows.length} 窗口</span>
              <span>·</span>
              <span>{getRelativeTime(ws.lastUsedAt)}</span>
            </div>
            {ws.tags.length > 0 && (
              <div style={{ display: 'flex', gap: '4px', paddingLeft: '24px', marginTop: '4px', flexWrap: 'wrap' }}>
                {ws.tags.slice(0, 3).map(tag => (
                  <span key={tag} style={{
                    padding: '1px 6px', background: 'rgba(255,255,255,0.05)',
                    borderRadius: '3px', fontSize: '10px', color: '#64748b',
                  }}>{tag}</span>
                ))}
              </div>
            )}
          </div>
        ))
      )}
    </div>
  )

  // ---------- 工作区详情面板 ----------
  const renderDetail = () => {
    if (!selectedWorkspace) {
      return (
        <div style={{
          height: '100%', display: 'flex', flexDirection: 'column',
          alignItems: 'center', justifyContent: 'center', color: '#64748b',
        }}>
          <div style={{ fontSize: '56px', marginBottom: '16px', opacity: 0.25 }}>🪟</div>
          <div style={{ fontSize: '15px', marginBottom: '6px' }}>选择工作区查看详情</div>
          <div style={{ fontSize: '13px', opacity: 0.7 }}>或保存当前布局创建新工作区</div>
        </div>
      )
    }

    const ws = selectedWorkspace

    return (
      <div>
        {/* 标题区 */}
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: '20px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div style={{
              width: '52px', height: '52px', borderRadius: '14px',
              background: `linear-gradient(135deg, ${ws.color}40, ${ws.color}15)`,
              border: `1px solid ${ws.color}30`,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: '26px',
            }}>{ws.icon}</div>
            <div>
              <h3 style={{ margin: 0, fontSize: '20px', fontWeight: 700, color: '#f1f5f9' }}>{ws.name}</h3>
              <div style={{ fontSize: '12px', color: '#64748b', marginTop: '4px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span>创建于 {formatDate(ws.createdAt)}</span>
                <span>·</span>
                <span>使用于 {getRelativeTime(ws.lastUsedAt)}</span>
                {ws.autoSave && <span style={{ color: '#10b981' }}>· 自动保存</span>}
              </div>
            </div>
          </div>
          {editWsId === ws.id ? (
            <div style={{ display: 'flex', gap: '6px', alignItems: 'center' }}>
              <input
                value={editName}
                onChange={e => setEditName(e.target.value)}
                style={{ ...s.input, width: '160px' }}
                autoFocus
                onKeyDown={e => {
                  if (e.key === 'Enter') {
                    updateWorkspace(ws.id, { name: editName.trim() || ws.name })
                    setEditWsId(null)
                    showToast('名称已更新')
                  }
                }}
              />
              <button onClick={() => { updateWorkspace(ws.id, { name: editName.trim() || ws.name }); setEditWsId(null); showToast('名称已更新') }} style={s.btn('primary')}>✓</button>
              <button onClick={() => setEditWsId(null)} style={s.btn('ghost')}>✕</button>
            </div>
          ) : (
            <button onClick={() => { setEditWsId(ws.id); setEditName(ws.name) }} style={s.btn('ghost')}>✏️ 重命名</button>
          )}
        </div>

        {/* 统计卡片 */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '12px', marginBottom: '20px' }}>
          {[
            { label: '打开窗口', value: ws.windows.length, color: '#7c3aed' },
            { label: '标签', value: ws.tags.length, color: '#06b6d4' },
            { label: '最后使用', value: getRelativeTime(ws.lastUsedAt), color: '#f59e0b', isText: true },
          ].map(item => (
            <div key={item.label} style={{
              padding: '14px',
              background: `${item.color}0a`,
              borderRadius: '10px',
              border: `1px solid ${item.color}20`,
            }}>
              <div style={{ fontSize: '11px', color: '#64748b', marginBottom: '4px' }}>{item.label}</div>
              <div style={{
                fontSize: item.isText ? '14px' : '24px',
                fontWeight: 600,
                color: item.color,
              }}>{item.value}</div>
            </div>
          ))}
        </div>

        {/* 操作按钮 */}
        <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', marginBottom: '24px' }}>
          <button onClick={() => restoreWorkspace(ws)} style={s.btn('primary')}>⚡ 加载工作区</button>
          <button onClick={() => updateWorkspace(ws.id, { windows: captureCurrentWindows() })} style={s.btn('secondary')}>💾 更新布局</button>
          <button onClick={() => startEditor(ws)} style={s.btn('secondary')}>📐 编辑布局</button>
          <button onClick={() => exportWorkspace(ws)} style={s.btn('secondary')}>📤 导出</button>
          <button onClick={() => deleteWorkspace(ws.id)} style={s.btn('danger')}>🗑️ 删除</button>
        </div>

        {/* 窗口预览 */}
        <div style={{ ...s.glass, padding: '16px', marginBottom: '16px' }}>
          <div style={{ fontSize: '13px', fontWeight: 600, marginBottom: '12px', color: '#c4b5fd' }}>窗口布局预览</div>
          <div style={{
            position: 'relative', width: '100%', height: '200px',
            background: 'rgba(0,0,0,0.3)', borderRadius: '8px', overflow: 'hidden',
            border: '1px solid rgba(255,255,255,0.06)',
          }}>
            {ws.windows.map((w, i) => (
              <div
                key={w.id || i}
                style={{
                  position: 'absolute',
                  left: `${w.x}%`, top: `${w.y}%`,
                  width: `${w.width}%`, height: `${w.height}%`,
                  background: `linear-gradient(135deg, ${ws.color}25, ${ws.color}10)`,
                  border: `1px solid ${ws.color}40`,
                  borderRadius: '4px',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: '10px', color: '#94a3b8', overflow: 'hidden',
                  padding: '2px',
                }}
              >
                <span style={{ textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{w.title || w.appId}</span>
              </div>
            ))}
          </div>
        </div>

        {/* 窗口列表 */}
        <div style={{ ...s.glass, padding: '16px' }}>
          <div style={{ fontSize: '13px', fontWeight: 600, marginBottom: '12px', color: '#c4b5fd' }}>窗口列表</div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
            {ws.windows.map((w, i) => (
              <div key={w.id || i} style={{
                padding: '8px 12px',
                background: 'rgba(255,255,255,0.04)',
                borderRadius: '8px',
                fontSize: '12px',
                display: 'flex', alignItems: 'center', gap: '6px',
                border: '1px solid rgba(255,255,255,0.06)',
              }}>
                <span style={{ color: ws.color }}>■</span>
                <span>{w.title || w.appId}</span>
                <span style={{ color: '#64748b', fontSize: '11px' }}>
                  {w.width}×{w.height}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
    )
  }

  // ---------- 模板选项卡 ----------
  const renderTemplates = () => (
    <div style={s.main}>
      <div style={{ marginBottom: '24px' }}>
        <h3 style={{ margin: '0 0 8px', fontSize: '18px', fontWeight: 700, color: '#f1f5f9' }}>布局模板</h3>
        <p style={{ margin: 0, fontSize: '13px', color: '#64748b' }}>选择预设布局，快速开始工作</p>
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))', gap: '16px' }}>
        {LAYOUT_TEMPLATES.map(tpl => (
          <div
            key={tpl.id}
            style={s.card(tpl.color)}
            onClick={() => applyTemplate(tpl)}
            onMouseEnter={e => {
              e.currentTarget.style.transform = 'translateY(-4px)'
              e.currentTarget.style.boxShadow = `0 16px 40px ${tpl.color}20`
            }}
            onMouseLeave={e => {
              e.currentTarget.style.transform = 'none'
              e.currentTarget.style.boxShadow = 'none'
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '12px' }}>
              <div style={{
                width: '48px', height: '48px', borderRadius: '12px',
                background: `linear-gradient(135deg, ${tpl.color}30, ${tpl.color}10)`,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: '24px',
              }}>{tpl.icon}</div>
              <div>
                <div style={{ fontWeight: 600, fontSize: '15px', color: '#e2e8f0' }}>{tpl.name}</div>
                <div style={{ fontSize: '12px', color: '#64748b', marginTop: '2px' }}>{tpl.description}</div>
              </div>
            </div>
            {/* 模板预览 */}
            <div style={{
              position: 'relative', width: '100%', height: '80px',
              background: 'rgba(0,0,0,0.25)', borderRadius: '6px', overflow: 'hidden',
            }}>
              {tpl.windows.map((w, i) => (
                <div
                  key={i}
                  style={{
                    position: 'absolute',
                    left: `${w.x}%`, top: `${w.y}%`,
                    width: `${w.width}%`, height: `${w.height}%`,
                    background: `${tpl.color}18`,
                    border: `1px solid ${tpl.color}30`,
                    borderRadius: '3px',
                  }}
                />
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  )

  // ---------- 布局编辑器 ----------
  const renderEditor = () => (
    <div style={s.main}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '20px' }}>
        <div>
          <h3 style={{ margin: '0 0 4px', fontSize: '18px', fontWeight: 700, color: '#f1f5f9' }}>布局编辑器</h3>
          <p style={{ margin: 0, fontSize: '13px', color: '#64748b' }}>拖拽调整窗口位置，修改大小与属性</p>
        </div>
        <div style={{ display: 'flex', gap: '8px' }}>
          <button onClick={addEditorWindow} style={s.btn('primary')}>+ 添加窗口</button>
          <button onClick={saveEditorLayout} style={s.btn('primary')}>💾 保存布局</button>
        </div>
      </div>

      {/* 画布 */}
      <div
        style={{
          position: 'relative', width: '100%', height: '320px',
          background: 'rgba(0,0,0,0.3)', borderRadius: '12px',
          border: '1px solid rgba(255,255,255,0.08)',
          overflow: 'hidden', cursor: dragEditorWindow !== null ? 'grabbing' : 'default',
          marginBottom: '20px',
        }}
        onMouseMove={handleEditorMouseMove}
        onMouseUp={handleEditorMouseUp}
        onMouseLeave={handleEditorMouseUp}
      >
        {/* 网格线 */}
        {Array.from({ length: 9 }, (_, i) => (
          <div key={`v${i}`} style={{
            position: 'absolute', left: `${(i + 1) * 10}%`, top: 0, bottom: 0,
            borderLeft: '1px dashed rgba(255,255,255,0.04)',
          }} />
        ))}
        {Array.from({ length: 9 }, (_, i) => (
          <div key={`h${i}`} style={{
            position: 'absolute', top: `${(i + 1) * 10}%`, left: 0, right: 0,
            borderTop: '1px dashed rgba(255,255,255,0.04)',
          }} />
        ))}
        {editorWindows.map((w, idx) => (
          <div
            key={w.id || idx}
            style={{
              position: 'absolute',
              left: `${w.x}%`, top: `${w.y}%`,
              width: `${w.width}%`, height: `${w.height}%`,
              background: dragEditorWindow === idx ? 'rgba(124,58,237,0.15)' : 'rgba(59,130,246,0.1)',
              border: dragEditorWindow === idx ? '1px solid rgba(124,58,237,0.5)' : '1px solid rgba(59,130,246,0.3)',
              borderRadius: '6px',
              display: 'flex', flexDirection: 'column',
              alignItems: 'center', justifyContent: 'center',
              cursor: 'grab', userSelect: 'none',
              padding: '4px',
              transition: dragEditorWindow === null ? 'background 0.2s, border-color 0.2s' : 'none',
            }}
            onMouseDown={e => handleEditorMouseDown(e, idx)}
          >
            <span style={{ fontSize: '11px', color: '#94a3b8', marginBottom: '2px', textOverflow: 'ellipsis', overflow: 'hidden', whiteSpace: 'nowrap', maxWidth: '90%' }}>
              {w.title || w.appId}
            </span>
            <span style={{ fontSize: '9px', color: '#475569' }}>
              {w.x},{w.y} | {w.width}×{w.height}
            </span>
          </div>
        ))}
      </div>

      {/* 窗口属性编辑 */}
      <div style={{ ...s.glass, padding: '16px' }}>
        <div style={{ fontSize: '13px', fontWeight: 600, marginBottom: '12px', color: '#c4b5fd' }}>窗口属性</div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          {editorWindows.map((w, idx) => (
            <div key={w.id || idx} style={{
              display: 'grid', gridTemplateColumns: '1fr 60px 60px 60px 60px auto',
              gap: '6px', alignItems: 'center', padding: '8px',
              background: 'rgba(255,255,255,0.03)', borderRadius: '8px',
              fontSize: '12px',
            }}>
              <input
                value={w.title}
                onChange={e => updateEditorWindow(idx, 'title', e.target.value)}
                style={{ ...s.input, padding: '4px 8px', fontSize: '12px' }}
                placeholder="标题"
              />
              {(['x', 'y', 'width', 'height'] as const).map(field => (
                <input
                  key={field}
                  type="number"
                  value={w[field]}
                  onChange={e => updateEditorWindow(idx, field, parseInt(e.target.value, 10) || 0)}
                  style={{ ...s.input, padding: '4px 8px', fontSize: '12px', width: '100%' }}
                  placeholder={field}
                />
              ))}
              <button onClick={() => removeEditorWindow(idx)} style={{
                ...s.btn('danger'), padding: '4px 8px', fontSize: '11px',
              }}>✕</button>
            </div>
          ))}
          {editorWindows.length === 0 && (
            <div style={{ padding: '20px', textAlign: 'center', color: '#64748b', fontSize: '13px' }}>
              点击"添加窗口"开始编辑
            </div>
          )}
        </div>
      </div>
    </div>
  )

  // ---------- 吸附预设 ----------
  const renderSnap = () => (
    <div style={s.main}>
      <div style={{ marginBottom: '24px' }}>
        <h3 style={{ margin: '0 0 8px', fontSize: '18px', fontWeight: 700, color: '#f1f5f9' }}>窗口吸附预设</h3>
        <p style={{ margin: 0, fontSize: '13px', color: '#64748b' }}>常用分屏布局，一键创建</p>
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '16px' }}>
        {SNAP_PRESETS.map(preset => (
          <div
            key={preset.id}
            style={s.card('#06b6d4')}
            onClick={() => applySnap(preset)}
            onMouseEnter={e => {
              e.currentTarget.style.transform = 'translateY(-3px)'
              e.currentTarget.style.boxShadow = '0 12px 30px rgba(6,182,212,0.15)'
            }}
            onMouseLeave={e => {
              e.currentTarget.style.transform = 'none'
              e.currentTarget.style.boxShadow = 'none'
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '12px' }}>
              <div style={{
                padding: '8px 12px', background: 'rgba(6,182,212,0.15)',
                borderRadius: '8px', fontSize: '14px', fontFamily: 'monospace', color: '#06b6d4',
                letterSpacing: '2px',
              }}>{preset.icon}</div>
              <div style={{ fontWeight: 600, fontSize: '14px', color: '#e2e8f0' }}>{preset.name}</div>
            </div>
            {/* 预览 */}
            <div style={{
              position: 'relative', width: '100%', height: '60px',
              background: 'rgba(0,0,0,0.25)', borderRadius: '6px', overflow: 'hidden',
              display: 'flex',
            }}>
              {preset.ratios.map((ratio, i) => (
                <div key={i} style={{
                  width: `${ratio}%`, height: '100%',
                  background: 'rgba(6,182,212,0.12)',
                  border: '1px solid rgba(6,182,212,0.25)',
                }} />
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  )

  // ---------- 最近使用 ----------
  const renderRecent = () => (
    <div style={s.main}>
      <div style={{ marginBottom: '24px' }}>
        <h3 style={{ margin: '0 0 8px', fontSize: '18px', fontWeight: 700, color: '#f1f5f9' }}>最近使用</h3>
        <p style={{ margin: 0, fontSize: '13px', color: '#64748b' }}>快速访问近期工作区</p>
      </div>
      {recentWorkspaces.length === 0 ? (
        <div style={{ padding: '40px', textAlign: 'center', color: '#64748b', fontSize: '13px' }}>
          <div style={{ fontSize: '36px', marginBottom: '12px', opacity: 0.5 }}>🕐</div>
          暂无最近使用的工作区
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          {recentWorkspaces.map(ws => (
            <div
              key={ws.id}
              style={{
                ...s.card(ws.color),
                display: 'flex', alignItems: 'center', gap: '14px',
              }}
              onClick={() => restoreWorkspace(ws)}
              onMouseEnter={e => {
                e.currentTarget.style.transform = 'translateX(4px)'
                e.currentTarget.style.borderColor = `${ws.color}50`
              }}
              onMouseLeave={e => {
                e.currentTarget.style.transform = 'none'
                e.currentTarget.style.borderColor = `${ws.color}30`
              }}
            >
              <div style={{
                width: '44px', height: '44px', borderRadius: '10px',
                background: `linear-gradient(135deg, ${ws.color}25, ${ws.color}10)`,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: '22px', flexShrink: 0,
              }}>{ws.icon}</div>
              <div style={{ flex: 1 }}>
                <div style={{ fontWeight: 500, fontSize: '14px', color: '#e2e8f0' }}>{ws.name}</div>
                <div style={{ fontSize: '12px', color: '#64748b', marginTop: '2px' }}>
                  {ws.windows.length} 窗口 · {getRelativeTime(ws.lastUsedAt)}
                </div>
              </div>
              <div style={{ fontSize: '16px', color: '#64748b' }}>→</div>
            </div>
          ))}
        </div>
      )}
    </div>
  )

  // ---------- 导入导出 ----------
  const renderShare = () => (
    <div style={s.main}>
      <div style={{ marginBottom: '24px' }}>
        <h3 style={{ margin: '0 0 8px', fontSize: '18px', fontWeight: 700, color: '#f1f5f9' }}>导入 / 导出</h3>
        <p style={{ margin: 0, fontSize: '13px', color: '#64748b' }}>分享你的工作区配置</p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', marginBottom: '24px' }}>
        {/* 导出 */}
        <div style={{ ...s.glass, padding: '20px' }}>
          <div style={{ fontSize: '14px', fontWeight: 600, color: '#c4b5fd', marginBottom: '12px' }}>📤 导出</div>
          <p style={{ fontSize: '12px', color: '#64748b', margin: '0 0 12px' }}>
            将工作区配置导出为 JSON 文件
          </p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {workspaces.slice(0, 5).map(ws => (
              <button key={ws.id} onClick={() => exportWorkspace(ws)} style={{
                ...s.btn('secondary'), justifyContent: 'flex-start', width: '100%',
              }}>
                <span>{ws.icon}</span> {ws.name}
              </button>
            ))}
            {workspaces.length > 5 && (
              <div style={{ fontSize: '11px', color: '#64748b', textAlign: 'center', padding: '4px' }}>
                还有 {workspaces.length - 5} 个工作区...
              </div>
            )}
            {workspaces.length > 0 && (
              <button onClick={exportAll} style={{ ...s.btn('primary'), marginTop: '4px' }}>
                📦 导出全部 ({workspaces.length})
              </button>
            )}
          </div>
        </div>

        {/* 导入 */}
        <div style={{ ...s.glass, padding: '20px' }}>
          <div style={{ fontSize: '14px', fontWeight: 600, color: '#c4b5fd', marginBottom: '12px' }}>📥 导入</div>
          <p style={{ fontSize: '12px', color: '#64748b', margin: '0 0 12px' }}>
            从 JSON 文本导入工作区配置
          </p>
          <textarea
            value={importText}
            onChange={e => setImportText(e.target.value)}
            placeholder='粘贴 JSON 配置...'
            style={{
              ...s.input, minHeight: '120px', resize: 'vertical',
              fontFamily: 'monospace', fontSize: '11px', marginBottom: '10px',
            }}
          />
          <button onClick={importWorkspaces} disabled={!importText.trim()} style={{
            ...s.btn('primary'),
            opacity: importText.trim() ? 1 : 0.5,
            cursor: importText.trim() ? 'pointer' : 'not-allowed',
          }}>
            📥 导入
          </button>
        </div>
      </div>

      {/* 单个工作区 JSON 预览 */}
      {selectedWorkspace && (
        <div style={{ ...s.glass, padding: '20px' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px' }}>
            <div style={{ fontSize: '14px', fontWeight: 600, color: '#c4b5fd' }}>
              {selectedWorkspace.icon} {selectedWorkspace.name} — JSON
            </div>
            <div style={{ display: 'flex', gap: '6px' }}>
              <button onClick={() => { navigator.clipboard?.writeText(JSON.stringify(selectedWorkspace, null, 2)); showToast('已复制到剪贴板') }} style={s.btn('ghost')}>
                📋 复制
              </button>
            </div>
          </div>
          <pre style={{
            margin: 0, padding: '12px', background: 'rgba(0,0,0,0.3)',
            borderRadius: '8px', fontSize: '11px', color: '#94a3b8',
            overflow: 'auto', maxHeight: '200px', fontFamily: 'monospace',
          }}>
            {JSON.stringify(selectedWorkspace, null, 2)}
          </pre>
        </div>
      )}
    </div>
  )

  // ---------- 悬停预览浮层 ----------
  const renderPreviewPopup = () => {
    if (!previewWorkspace || previewWsId === selectedWsId) return null
    const ws = previewWorkspace
    return (
      <div style={{
        position: 'fixed', bottom: '16px', left: '16px', zIndex: 999,
        width: '280px', background: 'rgba(20,20,40,0.95)',
        backdropFilter: 'blur(20px)', WebkitBackdropFilter: 'blur(20px)',
        border: `1px solid ${ws.color}30`, borderRadius: '14px',
        padding: '14px', boxShadow: `0 12px 40px rgba(0,0,0,0.5), 0 0 20px ${ws.color}10`,
        animation: 'fadeIn 0.2s ease',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
          <span style={{ fontSize: '18px' }}>{ws.icon}</span>
          <span style={{ fontWeight: 600, fontSize: '13px', color: '#e2e8f0' }}>{ws.name}</span>
          <span style={{ fontSize: '11px', color: '#64748b', marginLeft: 'auto' }}>{ws.windows.length} 窗口</span>
        </div>
        <div style={{
          position: 'relative', width: '100%', height: '100px',
          background: 'rgba(0,0,0,0.3)', borderRadius: '6px', overflow: 'hidden',
        }}>
          {ws.windows.map((w, i) => (
            <div key={w.id || i} style={{
              position: 'absolute', left: `${w.x}%`, top: `${w.y}%`,
              width: `${w.width}%`, height: `${w.height}%`,
              background: `${ws.color}15`, border: `1px solid ${ws.color}30`,
              borderRadius: '3px',
            }} />
          ))}
        </div>
      </div>
    )
  }

  // ---------- 快捷切换提示 ----------
  const renderQuickSwitch = () => {
    if (quickSwitchNum === null) return null
    return (
      <div style={{
        position: 'fixed', top: '50%', left: '50%', transform: 'translate(-50%, -50%)',
        zIndex: 9999, padding: '16px 28px',
        background: 'rgba(20,20,40,0.9)', backdropFilter: 'blur(20px)',
        borderRadius: '14px', border: '1px solid rgba(124,58,237,0.3)',
        boxShadow: '0 20px 60px rgba(0,0,0,0.5)',
        display: 'flex', alignItems: 'center', gap: '12px',
        animation: 'fadeIn 0.15s ease',
      }}>
        <div style={{
          width: '36px', height: '36px', borderRadius: '10px',
          background: 'linear-gradient(135deg, #7c3aed, #3b82f6)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: '18px', fontWeight: 700, color: '#fff',
        }}>{quickSwitchNum}</div>
        <div>
          <div style={{ fontSize: '14px', fontWeight: 600, color: '#e2e8f0' }}>
            {quickSwitchNum <= workspaces.length ? workspaces[quickSwitchNum - 1].name : '未分配'}
          </div>
          <div style={{ fontSize: '11px', color: '#64748b' }}>Ctrl+{quickSwitchNum}</div>
        </div>
      </div>
    )
  }

  // ---------- Toast ----------
  const renderToast = () => {
    if (!toast) return null
    return (
      <div style={{
        position: 'fixed', bottom: '24px', right: '24px', zIndex: 9999,
        padding: '10px 20px', background: 'rgba(16,185,129,0.15)',
        border: '1px solid rgba(16,185,129,0.3)', borderRadius: '10px',
        color: '#6ee7b7', fontSize: '13px', fontWeight: 500,
        backdropFilter: 'blur(12px)', boxShadow: '0 8px 25px rgba(0,0,0,0.3)',
        animation: 'fadeIn 0.2s ease',
      }}>
        ✓ {toast}
      </div>
    )
  }

  // ======================== 主渲染 ========================

  const tabs: { id: TabId; label: string; icon: string }[] = [
    { id: 'workspaces', label: '工作区', icon: '🪟' },
    { id: 'templates', label: '模板', icon: '📐' },
    { id: 'editor', label: '编辑器', icon: '✏️' },
    { id: 'snap', label: '分屏', icon: '▬' },
    { id: 'recent', label: '最近', icon: '🕐' },
    { id: 'share', label: '分享', icon: '🔗' },
  ]

  return (
    <div style={s.root}>
      {/* 顶部栏 */}
      <div style={s.header}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          <div style={s.headerIcon}>🪟</div>
          <div>
            <div style={{ fontWeight: 700, fontSize: '15px', color: '#f1f5f9' }}>工作区布局管理</div>
            <div style={{ fontSize: '11px', color: '#64748b' }}>
              {workspaces.length} 个工作区 · Ctrl+1-9 快速切换
            </div>
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          {tabs.map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              style={s.tab(activeTab === tab.id)}
              onMouseEnter={e => {
                if (activeTab !== tab.id) e.currentTarget.style.background = 'rgba(255,255,255,0.04)'
              }}
              onMouseLeave={e => {
                if (activeTab !== tab.id) e.currentTarget.style.background = 'transparent'
              }}
            >
              {tab.icon} {tab.label}
            </button>
          ))}
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          {/* 自动保存开关 */}
          <div
            onClick={() => setAutoSaveEnabled(prev => !prev)}
            style={{
              display: 'flex', alignItems: 'center', gap: '6px',
              padding: '6px 12px', background: 'rgba(255,255,255,0.04)',
              borderRadius: '8px', border: '1px solid rgba(255,255,255,0.08)',
              cursor: 'pointer', fontSize: '12px', color: '#94a3b8',
              transition: 'all 0.2s',
            }}
          >
            <div style={{
              width: '28px', height: '14px', borderRadius: '7px',
              background: autoSaveEnabled ? 'rgba(16,185,129,0.3)' : 'rgba(255,255,255,0.1)',
              position: 'relative', transition: 'background 0.2s',
            }}>
              <div style={{
                width: '10px', height: '10px', borderRadius: '50%',
                background: autoSaveEnabled ? '#10b981' : '#64748b',
                position: 'absolute', top: '2px',
                left: autoSaveEnabled ? '16px' : '2px',
                transition: 'all 0.2s',
              }} />
            </div>
            自动保存
          </div>

          <button
            onClick={() => setIsCreating(true)}
            style={s.btn('primary')}
            onMouseEnter={e => e.currentTarget.style.transform = 'translateY(-1px)'}
            onMouseLeave={e => e.currentTarget.style.transform = 'none'}
          >
            💾 保存当前布局
          </button>
        </div>
      </div>

      {/* 主体 */}
      <div style={s.content}>
        {activeTab === 'workspaces' && (
          <>
            {renderSidebar()}
            <div style={s.main}>{renderDetail()}</div>
          </>
        )}
        {activeTab === 'templates' && renderTemplates()}
        {activeTab === 'editor' && renderEditor()}
        {activeTab === 'snap' && renderSnap()}
        {activeTab === 'recent' && renderRecent()}
        {activeTab === 'share' && renderShare()}
      </div>

      {/* 浮层 */}
      {renderPreviewPopup()}
      {renderQuickSwitch()}
      {renderToast()}

      {/* 全局动画 */}
      <style>{`
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(6px); }
          to { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </div>
  )
}
