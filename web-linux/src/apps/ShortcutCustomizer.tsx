import { useState, useCallback, useEffect, useRef } from 'react'
import {
  Search,
  Plus,
  Trash2,
  Download,
  Upload,
  RotateCcw,
  AlertTriangle,
  Check,
  X,
  Keyboard,
  Settings,
  Monitor,
  AppWindow,
  Globe,
  Terminal,
  FileCode,
  Zap,
  Star,
  Edit3,
  Copy,
} from 'lucide-react'

interface ShortcutBinding {
  id: string
  category: 'system' | 'app'
  appName: string
  title: string
  keys: string
  description: string
  editable: boolean
}

const STORAGE_KEY = 'weblinux-shortcut-customizer'

const DEFAULT_SHORTCUTS: ShortcutBinding[] = [
  { id: 'sys-1', category: 'system', appName: '系统', title: '打开启动器', keys: 'Ctrl+Space', description: '打开全局启动器菜单', editable: true },
  { id: 'sys-2', category: 'system', appName: '系统', title: '搜索应用', keys: 'Ctrl+K', description: '聚焦搜索框', editable: true },
  { id: 'sys-3', category: 'system', appName: '系统', title: '切换窗口', keys: 'Alt+Tab', description: '在打开的窗口之间切换', editable: true },
  { id: 'sys-4', category: 'system', appName: '系统', title: '关闭当前窗口', keys: 'Ctrl+W', description: '关闭活动窗口', editable: true },
  { id: 'sys-5', category: 'system', appName: '系统', title: '最小化窗口', keys: 'Ctrl+M', description: '将当前窗口最小化', editable: true },
  { id: 'sys-6', category: 'system', appName: '系统', title: '最大化/还原窗口', keys: 'Ctrl+Shift+F', description: '切换窗口最大化状态', editable: true },
  { id: 'sys-7', category: 'system', appName: '系统', title: '截图', keys: 'Ctrl+Shift+S', description: '截取屏幕区域', editable: true },
  { id: 'sys-8', category: 'system', appName: '系统', title: '打开设置', keys: 'Ctrl+,', description: '打开系统设置', editable: true },
  { id: 'sys-9', category: 'system', appName: '系统', title: '显示桌面', keys: 'Ctrl+D', description: '隐藏所有窗口并显示桌面', editable: true },
  { id: 'sys-10', category: 'system', appName: '系统', title: '强制退出', keys: 'Ctrl+Shift+Esc', description: '强制退出当前应用', editable: true },

  { id: 'app-1', category: 'app', appName: '终端', title: '新建标签', keys: 'Ctrl+Shift+T', description: '在终端中新建标签页', editable: true },
  { id: 'app-2', category: 'app', appName: '终端', title: '关闭标签', keys: 'Ctrl+Shift+W', description: '关闭当前终端标签', editable: true },
  { id: 'app-3', category: 'app', appName: '终端', title: '复制', keys: 'Ctrl+Shift+C', description: '复制选中内容', editable: true },
  { id: 'app-4', category: 'app', appName: '终端', title: '粘贴', keys: 'Ctrl+Shift+V', description: '粘贴到终端', editable: true },
  { id: 'app-5', category: 'app', appName: '终端', title: '清屏', keys: 'Ctrl+L', description: '清除终端屏幕', editable: true },

  { id: 'app-6', category: 'app', appName: '文件管理器', title: '新建文件夹', keys: 'Ctrl+Shift+N', description: '创建新文件夹', editable: true },
  { id: 'app-7', category: 'app', appName: '文件管理器', title: '搜索', keys: 'Ctrl+F', description: '在文件管理器中搜索', editable: true },

  { id: 'app-8', category: 'app', appName: '浏览器', title: '新建标签页', keys: 'Ctrl+T', description: '打开新标签页', editable: true },
  { id: 'app-9', category: 'app', appName: '浏览器', title: '关闭标签页', keys: 'Ctrl+W', description: '关闭当前标签页', editable: true },
  { id: 'app-10', category: 'app', appName: '浏览器', title: '重新打开标签', keys: 'Ctrl+Shift+T', description: '恢复最近关闭的标签', editable: true },
  { id: 'app-11', category: 'app', appName: '浏览器', title: '开发者工具', keys: 'F12', description: '打开浏览器开发者工具', editable: true },
  { id: 'app-12', category: 'app', appName: '浏览器', title: '地址栏聚焦', keys: 'Ctrl+L', description: '快速聚焦地址栏', editable: true },

  { id: 'app-13', category: 'app', appName: '编辑器', title: '保存文件', keys: 'Ctrl+S', description: '保存当前文件', editable: true },
  { id: 'app-14', category: 'app', appName: '编辑器', title: '撤销', keys: 'Ctrl+Z', description: '撤销上一步操作', editable: true },
  { id: 'app-15', category: 'app', appName: '编辑器', title: '重做', keys: 'Ctrl+Shift+Z', description: '重做已撤销的操作', editable: true },
  { id: 'app-16', category: 'app', appName: '编辑器', title: '查找', keys: 'Ctrl+F', description: '在编辑器中查找', editable: true },
  { id: 'app-17', category: 'app', appName: '编辑器', title: '全局搜索', keys: 'Ctrl+Shift+F', description: '在所有文件中搜索', editable: true },
  { id: 'app-18', category: 'app', appName: '编辑器', title: '格式化', keys: 'Ctrl+Shift+L', description: '格式化代码', editable: true },

  { id: 'app-19', category: 'app', appName: '设置', title: '切换主题', keys: 'Ctrl+Shift+L', description: '在浅色/深色主题间切换', editable: true },
  { id: 'app-20', category: 'app', appName: '设置', title: '打开外观', keys: 'Ctrl+Shift+O', description: '打开外观设置页', editable: true },

  { id: 'app-21', category: 'app', appName: '截图工具', title: '区域截图', keys: 'Ctrl+Shift+A', description: '截取选定区域', editable: true },
  { id: 'app-22', category: 'app', appName: '截图工具', title: '全屏截图', keys: 'Ctrl+Shift+X', description: '截取整个屏幕', editable: true },
]

const CATEGORY_META: Record<string, { label: string; icon: React.ReactNode; color: string }> = {
  system: { label: '系统快捷键', icon: <Monitor size={16} />, color: '#7c6cf0' },
  app: { label: '应用快捷键', icon: <AppWindow size={16} />, color: '#00d6c1' },
}

const APP_ICONS: Record<string, React.ReactNode> = {
  系统: <Settings size={14} />,
  终端: <Terminal size={14} />,
  文件管理器: <FileCode size={14} />,
  浏览器: <Globe size={14} />,
  编辑器: <Edit3 size={14} />,
  设置: <Zap size={14} />,
  截图工具: <Keyboard size={14} />,
}

function normalizeKey(key: string): string {
  const map: Record<string, string> = {
    'Control': 'Ctrl',
    'Meta': 'Meta',
    'Shift': 'Shift',
    'Alt': 'Alt',
    'Escape': 'Esc',
    'ArrowUp': '↑',
    'ArrowDown': '↓',
    'ArrowLeft': '←',
    'ArrowRight': '→',
    ' ': 'Space',
  }
  return map[key] || key
}

function captureKeyCombo(e: KeyboardEvent): string | null {
  const parts: string[] = []
  if (e.ctrlKey) parts.push('Ctrl')
  if (e.metaKey) parts.push('Meta')
  if (e.shiftKey) parts.push('Shift')
  if (e.altKey) parts.push('Alt')

  const key = e.key
  if (!['Control', 'Meta', 'Shift', 'Alt'].includes(key)) {
    const normalized = normalizeKey(key)
    if (normalized === 'Space') {
      parts.push('Space')
    } else if (normalized.length === 1) {
      parts.push(normalized.toUpperCase())
    } else {
      parts.push(normalized)
    }
    return parts.join('+')
  }
  return null
}

function keyComboEquals(a: string, b: string): boolean {
  const normalize = (s: string) =>
    s
      .split('+')
      .map((k) => k.trim().toLowerCase())
      .sort()
      .join('+')
  return normalize(a) === normalize(b)
}

export default function ShortcutCustomizer() {
  const [shortcuts, setShortcuts] = useState<ShortcutBinding[]>([])
  const [search, setSearch] = useState('')
  const [activeCategory, setActiveCategory] = useState<'all' | 'system' | 'app'>('all')
  const [editingId, setEditingId] = useState<string | null>(null)
  const [captureMode, setCaptureMode] = useState(false)
  const [captureResult, setCaptureResult] = useState<string | null>(null)
  const [conflicts, setConflicts] = useState<Set<string>>(new Set())
  const [toast, setToast] = useState<{ type: 'success' | 'error' | 'info'; message: string } | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const captureInputRef = useRef<HTMLInputElement>(null)
  const [editingKeys, setEditingKeys] = useState('')
  const [captureTargetId, setCaptureTargetId] = useState<string | null>(null)

  useEffect(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY)
      if (saved) {
        const parsed = JSON.parse(saved) as ShortcutBinding[]
        if (Array.isArray(parsed) && parsed.length > 0) {
          setShortcuts(parsed)
          return
        }
      }
      setShortcuts(DEFAULT_SHORTCUTS)
    } catch {
      setShortcuts(DEFAULT_SHORTCUTS)
    }
  }, [])

  useEffect(() => {
    if (shortcuts.length > 0) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(shortcuts))
    }
  }, [shortcuts])

  useEffect(() => {
    const newConflicts = new Set<string>()
    for (let i = 0; i < shortcuts.length; i++) {
      for (let j = i + 1; j < shortcuts.length; j++) {
        if (keyComboEquals(shortcuts[i].keys, shortcuts[j].keys)) {
          newConflicts.add(shortcuts[i].id)
          newConflicts.add(shortcuts[j].id)
        }
      }
    }
    setConflicts(newConflicts)
  }, [shortcuts])

  useEffect(() => {
    if (toast) {
      const t = setTimeout(() => setToast(null), 2500)
      return () => clearTimeout(t)
    }
  }, [toast])

  const showToast = useCallback((type: 'success' | 'error' | 'info', message: string) => {
    setToast({ type, message })
  }, [])

  const filteredShortcuts = shortcuts.filter((s) => {
    if (activeCategory !== 'all' && s.category !== activeCategory) return false
    if (!search) return true
    const q = search.toLowerCase()
    return (
      s.title.toLowerCase().includes(q) ||
      s.keys.toLowerCase().includes(q) ||
      s.description.toLowerCase().includes(q) ||
      s.appName.toLowerCase().includes(q)
    )
  })

  const groupedShortcuts = filteredShortcuts.reduce<Record<string, ShortcutBinding[]>>((acc, s) => {
    const key = `${s.category}-${s.appName}`
    if (!acc[key]) acc[key] = []
    acc[key].push(s)
    return acc
  }, {})

  const startEditing = useCallback(
    (id: string) => {
      const sc = shortcuts.find((s) => s.id === id)
      if (!sc) return
      setEditingId(id)
      setEditingKeys(sc.keys)
    },
    [shortcuts]
  )

  const saveEditing = useCallback(
    (id: string) => {
      const trimmed = editingKeys.trim()
      if (!trimmed) {
        showToast('error', '快捷键不能为空')
        return
      }
      setShortcuts((prev) => prev.map((s) => (s.id === id ? { ...s, keys: trimmed } : s)))
      setEditingId(null)
      setEditingKeys('')
      showToast('success', '快捷键已更新')
    },
    [editingKeys, showToast]
  )

  const cancelEditing = useCallback(() => {
    setEditingId(null)
    setEditingKeys('')
  }, [])

  const deleteShortcut = useCallback(
    (id: string) => {
      setShortcuts((prev) => prev.filter((s) => s.id !== id))
      showToast('info', '已删除快捷键')
    },
    [showToast]
  )

  const addNewShortcut = useCallback(() => {
    const nextId = `custom-${Date.now()}`
    const newSC: ShortcutBinding = {
      id: nextId,
      category: 'app',
      appName: '自定义',
      title: '自定义快捷键',
      keys: 'Ctrl+Shift+K',
      description: '用户自定义的快捷键',
      editable: true,
    }
    setShortcuts((prev) => [...prev, newSC])
    setEditingId(nextId)
    setEditingKeys(newSC.keys)
    showToast('info', '已添加新快捷键')
  }, [showToast])

  const startCapture = useCallback(
    (targetId: string | null) => {
      setCaptureTargetId(targetId)
      setCaptureMode(true)
      setCaptureResult(null)
      setTimeout(() => {
        captureInputRef.current?.focus()
      }, 50)
    },
    []
  )

  const stopCapture = useCallback(() => {
    setCaptureMode(false)
    setCaptureTargetId(null)
    setCaptureResult(null)
  }, [])

  const handleCaptureKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      e.preventDefault()
      e.stopPropagation()
      const combo = captureKeyCombo(e.nativeEvent)
      if (combo) {
        setCaptureResult(combo)
        if (captureTargetId) {
          setEditingKeys(combo)
        }
      }
      if (e.key === 'Escape') {
        stopCapture()
      }
    },
    [captureTargetId, stopCapture]
  )

  const confirmCapture = useCallback(() => {
    if (captureResult && captureTargetId) {
      setShortcuts((prev) =>
        prev.map((s) => (s.id === captureTargetId ? { ...s, keys: captureResult } : s))
      )
      showToast('success', '快捷键已更新')
    }
    stopCapture()
  }, [captureResult, captureTargetId, stopCapture, showToast])

  const exportConfig = useCallback(() => {
    const config = {
      version: 1,
      exportedAt: new Date().toISOString(),
      shortcuts,
    }
    const blob = new Blob([JSON.stringify(config, null, 2)], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `shortcuts-config-${Date.now()}.json`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
    showToast('success', '配置已导出')
  }, [shortcuts, showToast])

  const triggerImport = useCallback(() => {
    fileInputRef.current?.click()
  }, [])

  const handleImport = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0]
      if (!file) return
      const reader = new FileReader()
      reader.onload = (ev) => {
        try {
          const data = JSON.parse(ev.target?.result as string)
          if (data.shortcuts && Array.isArray(data.shortcuts)) {
            setShortcuts(data.shortcuts)
            showToast('success', '配置已导入')
          } else {
            showToast('error', '无效的配置文件')
          }
        } catch {
          showToast('error', '解析配置文件失败')
        }
      }
      reader.readAsText(file)
      e.target.value = ''
    },
    [showToast]
  )

  const resetToDefaults = useCallback(() => {
    setShortcuts(DEFAULT_SHORTCUTS)
    localStorage.removeItem(STORAGE_KEY)
    showToast('success', '已恢复默认快捷键')
  }, [showToast])

  const copyKeys = useCallback((keys: string) => {
    navigator.clipboard.writeText(keys).then(
      () => showToast('success', `已复制: ${keys}`),
      () => showToast('error', '复制失败')
    )
  }, [showToast])

  const totalSystem = shortcuts.filter((s) => s.category === 'system').length
  const totalApp = shortcuts.filter((s) => s.category === 'app').length
  const conflictCount = conflicts.size

  return (
    <div
      style={{
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        color: 'var(--text-primary)',
        overflow: 'hidden',
      }}
    >
      {/* Header */}
      <Header
        search={search}
        onSearch={setSearch}
        totalSystem={totalSystem}
        totalApp={totalApp}
        conflictCount={conflictCount}
        onExport={exportConfig}
        onImport={triggerImport}
        onReset={resetToDefaults}
        onAdd={addNewShortcut}
      />

      {/* Stats bar */}
      <StatsBar
        total={shortcuts.length}
        systemCount={totalSystem}
        appCount={totalApp}
        conflictCount={conflictCount}
      />

      {/* Category tabs */}
      <CategoryTabs active={activeCategory} onChange={setActiveCategory} />

      {/* Main content */}
      <div
        style={{
          flex: 1,
          overflow: 'auto',
          padding: '16px',
          display: 'flex',
          flexDirection: 'column',
          gap: '16px',
        }}
      >
        {Object.keys(groupedShortcuts).length === 0 ? (
          <EmptyState />
        ) : (
          Object.entries(groupedShortcuts).map(([groupKey, items]) => {
            const [cat] = groupKey.split('-')
            const meta = CATEGORY_META[cat]
            return (
              <section key={groupKey}>
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                    marginBottom: '10px',
                    fontSize: '12px',
                    fontWeight: '600',
                    color: 'var(--text-secondary)',
                    letterSpacing: '0.5px',
                    textTransform: 'uppercase',
                  }}
                >
                  <span style={{ color: meta?.color }}>{meta?.icon}</span>
                  <span>{items[0].appName}</span>
                  <span
                    style={{
                      padding: '2px 8px',
                      borderRadius: '10px',
                      background: 'var(--glass-bg)',
                      border: '1px solid var(--glass-border)',
                      fontSize: '11px',
                    }}
                  >
                    {items.length} 项
                  </span>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  {items.map((sc) => (
                    <ShortcutRow
                      key={sc.id}
                      shortcut={sc}
                      isEditing={editingId === sc.id}
                      editingKeys={editingKeys}
                      onEdit={() => startEditing(sc.id)}
                      onSave={() => saveEditing(sc.id)}
                      onCancel={cancelEditing}
                      onKeysChange={setEditingKeys}
                      onDelete={() => deleteShortcut(sc.id)}
                      onCopy={() => copyKeys(sc.keys)}
                      onStartCapture={() => startCapture(sc.id)}
                      hasConflict={conflicts.has(sc.id)}
                    />
                  ))}
                </div>
              </section>
            )
          })
        )}
      </div>

      {/* Tester panel */}
      <TesterPanel
        captureMode={captureMode}
        captureResult={captureResult}
        captureInputRef={captureInputRef}
        onStartCapture={() => startCapture(null)}
        onStopCapture={stopCapture}
        onKeyDown={handleCaptureKeyDown}
        onConfirmCapture={confirmCapture}
        isCapturingForEdit={captureTargetId !== null}
      />

      {/* Hidden file input */}
      <input
        ref={fileInputRef}
        type="file"
        accept=".json,application/json"
        style={{ display: 'none' }}
        onChange={handleImport}
      />

      {/* Toast */}
      {toast && <Toast type={toast.type} message={toast.message} />}
    </div>
  )
}

function Header({
  search,
  onSearch,
  totalSystem,
  totalApp,
  conflictCount,
  onExport,
  onImport,
  onReset,
  onAdd,
}: {
  search: string
  onSearch: (v: string) => void
  totalSystem: number
  totalApp: number
  conflictCount: number
  onExport: () => void
  onImport: () => void
  onReset: () => void
  onAdd: () => void
}) {
  return (
    <div
      style={{
        padding: '14px 20px',
        borderBottom: '1px solid var(--window-border)',
        background: 'linear-gradient(135deg, rgba(124, 108, 240, 0.08), rgba(0, 214, 193, 0.05))',
        display: 'flex',
        alignItems: 'center',
        gap: '16px',
        flexShrink: 0,
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
        <div
          style={{
            width: '36px',
            height: '36px',
            borderRadius: '10px',
            background: 'var(--accent-gradient)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: '#fff',
            boxShadow: 'var(--glow-accent)',
          }}
        >
          <Keyboard size={18} />
        </div>
        <div>
          <div style={{ fontSize: '15px', fontWeight: '700' }}>快捷键定制中心</div>
          <div style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>
            系统 {totalSystem} · 应用 {totalApp}
            {conflictCount > 0 && (
              <span style={{ color: 'var(--warning)', marginLeft: '8px' }}>
                · {conflictCount} 项冲突
              </span>
            )}
          </div>
        </div>
      </div>

      <div style={{ flex: 1, position: 'relative', maxWidth: '360px' }}>
        <Search
          size={14}
          style={{
            position: 'absolute',
            left: '12px',
            top: '50%',
            transform: 'translateY(-50%)',
            color: 'var(--text-secondary)',
          }}
        />
        <input
          type="text"
          value={search}
          onChange={(e) => onSearch(e.target.value)}
          placeholder="搜索快捷键、应用或描述..."
          style={{
            width: '100%',
            padding: '9px 12px 9px 34px',
            borderRadius: '10px',
            border: '1px solid var(--window-border)',
            background: 'var(--glass-bg)',
            backdropFilter: 'blur(12px)',
            WebkitBackdropFilter: 'blur(12px)',
            color: 'var(--text-primary)',
            fontSize: '13px',
            outline: 'none',
            transition: 'border-color 0.2s, box-shadow 0.2s',
          }}
          onFocus={(e) => {
            e.currentTarget.style.borderColor = 'var(--accent)'
            e.currentTarget.style.boxShadow = '0 0 0 3px var(--accent-subtle)'
          }}
          onBlur={(e) => {
            e.currentTarget.style.borderColor = 'var(--window-border)'
            e.currentTarget.style.boxShadow = 'none'
          }}
        />
      </div>

      <div style={{ display: 'flex', gap: '8px', marginLeft: 'auto' }}>
        <IconButton icon={<Plus size={14} />} label="新建" onClick={onAdd} primary />
        <IconButton icon={<Download size={14} />} label="导出" onClick={onExport} />
        <IconButton icon={<Upload size={14} />} label="导入" onClick={onImport} />
        <IconButton icon={<RotateCcw size={14} />} label="重置" onClick={onReset} />
      </div>
    </div>
  )
}

function IconButton({
  icon,
  label,
  onClick,
  primary,
}: {
  icon: React.ReactNode
  label: string
  onClick: () => void
  primary?: boolean
}) {
  return (
    <button
      onClick={onClick}
      title={label}
      style={{
        padding: '7px 12px',
        borderRadius: '8px',
        border: primary ? 'none' : '1px solid var(--window-border)',
        background: primary ? 'var(--accent-gradient)' : 'var(--glass-bg)',
        color: primary ? '#fff' : 'var(--text-primary)',
        cursor: 'pointer',
        display: 'flex',
        alignItems: 'center',
        gap: '5px',
        fontSize: '12px',
        fontWeight: '500',
        transition: 'all 0.2s',
        backdropFilter: primary ? 'none' : 'blur(12px)',
        WebkitBackdropFilter: primary ? 'none' : 'blur(12px)',
        boxShadow: primary ? 'var(--glow-accent)' : 'none',
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.transform = 'translateY(-1px)'
        e.currentTarget.style.boxShadow = primary
          ? 'var(--glow-strong)'
          : '0 4px 12px rgba(0,0,0,0.15)'
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.transform = 'translateY(0)'
        e.currentTarget.style.boxShadow = primary ? 'var(--glow-accent)' : 'none'
      }}
    >
      {icon}
      {label}
    </button>
  )
}

function StatsBar({
  total,
  systemCount,
  appCount,
  conflictCount,
}: {
  total: number
  systemCount: number
  appCount: number
  conflictCount: number
}) {
  return (
    <div
      style={{
        display: 'flex',
        gap: '12px',
        padding: '12px 20px',
        borderBottom: '1px solid var(--window-border)',
        flexShrink: 0,
      }}
    >
      <StatCard label="总计" value={total} color="var(--accent)" />
      <StatCard label="系统" value={systemCount} color="#7c6cf0" />
      <StatCard label="应用" value={appCount} color="#00d6c1" />
      <StatCard
        label="冲突"
        value={conflictCount}
        color={conflictCount > 0 ? 'var(--warning)' : 'var(--text-secondary)'}
      />
    </div>
  )
}

function StatCard({ label, value, color }: { label: string; value: number; color: string }) {
  return (
    <div
      className="glass-effect"
      style={{
        flex: 1,
        padding: '10px 14px',
        borderRadius: '12px',
        display: 'flex',
        alignItems: 'center',
        gap: '10px',
      }}
    >
      <div
        style={{
          width: '8px',
          height: '8px',
          borderRadius: '50%',
          background: color,
          boxShadow: `0 0 10px ${color}`,
        }}
      />
      <div style={{ flex: 1 }}>
        <div style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>{label}</div>
        <div style={{ fontSize: '18px', fontWeight: '700' }}>{value}</div>
      </div>
    </div>
  )
}

function CategoryTabs({
  active,
  onChange,
}: {
  active: 'all' | 'system' | 'app'
  onChange: (v: 'all' | 'system' | 'app') => void
}) {
  const tabs: { key: 'all' | 'system' | 'app'; label: string; icon: React.ReactNode }[] = [
    { key: 'all', label: '全部', icon: <Star size={14} /> },
    { key: 'system', label: '系统', icon: <Monitor size={14} /> },
    { key: 'app', label: '应用', icon: <AppWindow size={14} /> },
  ]
  return (
    <div
      style={{
        display: 'flex',
        gap: '6px',
        padding: '0 20px 12px',
        flexShrink: 0,
      }}
    >
      {tabs.map((t) => (
        <button
          key={t.key}
          onClick={() => onChange(t.key)}
          style={{
            padding: '7px 16px',
            borderRadius: '8px',
            border: '1px solid var(--window-border)',
            background: active === t.key ? 'var(--accent)' : 'var(--glass-bg)',
            color: active === t.key ? '#fff' : 'var(--text-primary)',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            fontSize: '12px',
            fontWeight: active === t.key ? '600' : '500',
            transition: 'all 0.2s',
            backdropFilter: 'blur(12px)',
            WebkitBackdropFilter: 'blur(12px)',
            boxShadow: active === t.key ? 'var(--glow-accent)' : 'none',
          }}
        >
          {t.icon}
          {t.label}
        </button>
      ))}
    </div>
  )
}

function ShortcutRow({
  shortcut,
  isEditing,
  editingKeys,
  onEdit,
  onSave,
  onCancel,
  onKeysChange,
  onDelete,
  onCopy,
  onStartCapture,
  hasConflict,
}: {
  shortcut: ShortcutBinding
  isEditing: boolean
  editingKeys: string
  onEdit: () => void
  onSave: () => void
  onCancel: () => void
  onKeysChange: (v: string) => void
  onDelete: () => void
  onCopy: () => void
  onStartCapture: () => void
  hasConflict: boolean
}) {
  const appIcon = APP_ICONS[shortcut.appName] || <Zap size={14} />

  return (
    <div
      className="glass-effect"
      style={{
        padding: '14px 16px',
        borderRadius: '14px',
        display: 'flex',
        alignItems: 'center',
        gap: '14px',
        transition: 'all 0.2s',
        borderColor: hasConflict ? 'var(--warning)' : 'var(--glass-border)',
        background: hasConflict
          ? 'linear-gradient(135deg, rgba(255, 159, 10, 0.1), var(--glass-bg))'
          : 'var(--glass-bg)',
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.transform = 'translateY(-1px)'
        e.currentTarget.style.boxShadow = '0 4px 20px rgba(0,0,0,0.2)'
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.transform = 'translateY(0)'
        e.currentTarget.style.boxShadow = 'var(--shadow-sm)'
      }}
    >
      <div
        style={{
          width: '34px',
          height: '34px',
          borderRadius: '10px',
          background:
            shortcut.category === 'system'
              ? 'linear-gradient(135deg, #7c6cf0, #9b8af0)'
              : 'linear-gradient(135deg, #00d6c1, #40a9ff)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: '#fff',
          flexShrink: 0,
        }}
      >
        {appIcon}
      </div>

      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
          <span style={{ fontWeight: '600', fontSize: '13px' }}>{shortcut.title}</span>
          {hasConflict && (
            <span
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '3px',
                fontSize: '11px',
                color: 'var(--warning)',
                padding: '1px 6px',
                borderRadius: '8px',
                background: 'var(--warning-bg)',
              }}
            >
              <AlertTriangle size={10} />
              冲突
            </span>
          )}
        </div>
        <div style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>{shortcut.description}</div>
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
        {isEditing ? (
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <input
              value={editingKeys}
              onChange={(e) => onKeysChange(e.target.value)}
              placeholder="按键组合"
              style={{
                padding: '6px 10px',
                borderRadius: '8px',
                border: '1px solid var(--accent)',
                background: 'rgba(0,0,0,0.2)',
                color: 'var(--text-primary)',
                fontFamily: "'JetBrains Mono', monospace",
                fontSize: '12px',
                fontWeight: '600',
                width: '140px',
                outline: 'none',
              }}
              autoFocus
            />
            <button
              onClick={onStartCapture}
              title="捕获按键"
              style={{
                padding: '6px',
                borderRadius: '8px',
                border: '1px solid var(--window-border)',
                background: 'var(--glass-bg)',
                color: 'var(--accent)',
                cursor: 'pointer',
                display: 'flex',
              }}
            >
              <Keyboard size={14} />
            </button>
          </div>
        ) : (
          <KeyBadge keys={shortcut.keys} />
        )}
      </div>

      <div style={{ display: 'flex', gap: '4px', flexShrink: 0 }}>
        {isEditing ? (
          <>
            <ActionButton icon={<Check size={14} />} onClick={onSave} title="保存" />
            <ActionButton icon={<X size={14} />} onClick={onCancel} title="取消" />
          </>
        ) : (
          <>
            <ActionButton icon={<Copy size={14} />} onClick={onCopy} title="复制" />
            <ActionButton icon={<Edit3 size={14} />} onClick={onEdit} title="编辑" />
            <ActionButton
              icon={<Trash2 size={14} />}
              onClick={onDelete}
              title="删除"
              destructive
            />
          </>
        )}
      </div>
    </div>
  )
}

function KeyBadge({ keys }: { keys: string }) {
  const keyParts = keys.split('+')
  return (
    <div style={{ display: 'flex', gap: '3px', alignItems: 'center' }}>
      {keyParts.map((part, i) => (
        <span key={i} style={{ display: 'flex', alignItems: 'center' }}>
          <span
            style={{
              padding: '4px 10px',
              borderRadius: '6px',
              border: '1px solid var(--window-border)',
              background: 'var(--glass-bg)',
              fontFamily: "'JetBrains Mono', monospace",
              fontSize: '12px',
              fontWeight: '600',
              color: 'var(--accent)',
              minWidth: part.length > 1 ? '32px' : '24px',
              textAlign: 'center',
              boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
            }}
          >
            {part}
          </span>
          {i < keyParts.length - 1 && (
            <span style={{ color: 'var(--text-secondary)', fontSize: '12px', margin: '0 1px' }}>+</span>
          )}
        </span>
      ))}
    </div>
  )
}

function ActionButton({
  icon,
  onClick,
  title,
  destructive,
}: {
  icon: React.ReactNode
  onClick: () => void
  title: string
  destructive?: boolean
}) {
  return (
    <button
      onClick={onClick}
      title={title}
      style={{
        padding: '6px',
        borderRadius: '8px',
        border: 'none',
        background: 'transparent',
        color: destructive ? 'var(--error)' : 'var(--text-secondary)',
        cursor: 'pointer',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        transition: 'all 0.15s',
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.background = destructive ? 'var(--error-bg)' : 'var(--accent-bg)'
        e.currentTarget.style.color = destructive ? 'var(--error)' : 'var(--accent)'
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.background = 'transparent'
        e.currentTarget.style.color = destructive ? 'var(--error)' : 'var(--text-secondary)'
      }}
    >
      {icon}
    </button>
  )
}

function TesterPanel({
  captureMode,
  captureResult,
  captureInputRef,
  onStartCapture,
  onStopCapture,
  onKeyDown,
  onConfirmCapture,
  isCapturingForEdit,
}: {
  captureMode: boolean
  captureResult: string | null
  captureInputRef: React.RefObject<HTMLInputElement | null>
  onStartCapture: () => void
  onStopCapture: () => void
  onKeyDown: (e: React.KeyboardEvent) => void
  onConfirmCapture: () => void
  isCapturingForEdit: boolean
}) {
  return (
    <div
      style={{
        padding: '16px 20px',
        borderTop: '1px solid var(--window-border)',
        background: 'var(--glass-bg)',
        backdropFilter: 'blur(12px)',
        WebkitBackdropFilter: 'blur(12px)',
        flexShrink: 0,
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '10px' }}>
        <div
          style={{
            width: '28px',
            height: '28px',
            borderRadius: '8px',
            background: captureMode ? 'var(--accent-gradient)' : 'var(--glass-bg)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: captureMode ? '#fff' : 'var(--accent)',
            transition: 'all 0.2s',
            boxShadow: captureMode ? 'var(--glow-accent)' : 'none',
          }}
        >
          <Keyboard size={14} />
        </div>
        <div style={{ fontSize: '13px', fontWeight: '600' }}>快捷键测试器</div>
        <div style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>
          {captureMode ? '按下任意键组合进行捕获' : '点击下方按钮开始捕获按键'}
        </div>
      </div>

      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '12px',
          padding: '16px',
          borderRadius: '14px',
          border: captureMode
            ? '2px solid var(--accent)'
            : '1px dashed var(--window-border)',
          background: captureMode ? 'var(--accent-subtle)' : 'rgba(0,0,0,0.15)',
          transition: 'all 0.2s',
          position: 'relative',
          overflow: 'hidden',
        }}
      >
        {captureMode && (
          <div
            style={{
              position: 'absolute',
              inset: 0,
              background:
                'radial-gradient(circle at 50% 50%, var(--accent-subtle) 0%, transparent 70%)',
              animation: 'breathe 2s ease-in-out infinite',
              pointerEvents: 'none',
            }}
          />
        )}

        <div style={{ flex: 1, position: 'relative', zIndex: 1 }}>
          {captureMode ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
              <div style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>
                {isCapturingForEdit
                  ? '正在捕获按键以更新快捷键绑定...'
                  : '请按下要测试的按键组合:'}
              </div>
              <div
                style={{
                  fontSize: '22px',
                  fontWeight: '700',
                  fontFamily: "'JetBrains Mono', monospace",
                  color: captureResult ? 'var(--accent)' : 'var(--text-secondary)',
                  minHeight: '32px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                }}
              >
                {captureResult ? (
                  <KeyBadge keys={captureResult} />
                ) : (
                  <span
                    style={{
                      opacity: 0.5,
                      animation: 'cursorBlink 1s step-end infinite',
                    }}
                  >
                    等待按键输入...
                  </span>
                )}
              </div>
            </div>
          ) : (
            <div style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>
              实时捕获按键组合，用于验证快捷键是否正确绑定
            </div>
          )}
        </div>

        <input
          ref={captureInputRef}
          type="text"
          value=""
          onKeyDown={onKeyDown}
          style={{
            position: 'absolute',
            opacity: 0,
            pointerEvents: 'none',
            width: '1px',
            height: '1px',
          }}
          tabIndex={-1}
        />

        <div style={{ display: 'flex', gap: '8px', position: 'relative', zIndex: 1 }}>
          {captureMode ? (
            <>
              {captureResult && !isCapturingForEdit && (
                <button
                  onClick={onConfirmCapture}
                  style={{
                    padding: '8px 16px',
                    borderRadius: '8px',
                    border: 'none',
                    background: 'var(--accent-gradient)',
                    color: '#fff',
                    cursor: 'pointer',
                    fontSize: '12px',
                    fontWeight: '600',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '5px',
                    boxShadow: 'var(--glow-accent)',
                  }}
                >
                  <Check size={14} />
                  确认
                </button>
              )}
              <button
                onClick={onStopCapture}
                style={{
                  padding: '8px 16px',
                  borderRadius: '8px',
                  border: '1px solid var(--window-border)',
                  background: 'var(--glass-bg)',
                  color: 'var(--text-primary)',
                  cursor: 'pointer',
                  fontSize: '12px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '5px',
                }}
              >
                <X size={14} />
                取消
              </button>
            </>
          ) : (
            <button
              onClick={onStartCapture}
              style={{
                padding: '8px 18px',
                borderRadius: '8px',
                border: 'none',
                background: 'var(--accent-gradient)',
                color: '#fff',
                cursor: 'pointer',
                fontSize: '12px',
                fontWeight: '600',
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                boxShadow: 'var(--glow-accent)',
                transition: 'all 0.2s',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = 'translateY(-1px)'
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = 'translateY(0)'
              }}
            >
              <Zap size={14} />
              开始捕获
            </button>
          )}
        </div>
      </div>
    </div>
  )
}

function EmptyState() {
  return (
    <div
      style={{
        flex: 1,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '40px',
        color: 'var(--text-secondary)',
      }}
    >
      <div
        style={{
          width: '64px',
          height: '64px',
          borderRadius: '50%',
          background: 'var(--glass-bg)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          marginBottom: '16px',
          border: '1px solid var(--glass-border)',
        }}
      >
        <Keyboard size={28} />
      </div>
      <div style={{ fontSize: '15px', fontWeight: '600', marginBottom: '4px' }}>
        没有找到快捷键
      </div>
      <div style={{ fontSize: '12px' }}>尝试调整搜索条件或添加新的快捷键</div>
    </div>
  )
}

function Toast({ type, message }: { type: 'success' | 'error' | 'info'; message: string }) {
  const colors = {
    success: { bg: 'var(--success-bg)', color: 'var(--success)', icon: <Check size={14} /> },
    error: { bg: 'var(--error-bg)', color: 'var(--error)', icon: <AlertTriangle size={14} /> },
    info: { bg: 'var(--info-bg)', color: 'var(--info)', icon: <Zap size={14} /> },
  }
  const c = colors[type]
  return (
    <div
      style={{
        position: 'fixed',
        bottom: '70px',
        left: '50%',
        transform: 'translateX(-50%)',
        padding: '10px 18px',
        borderRadius: '10px',
        background: c.bg,
        color: c.color,
        border: `1px solid ${c.color}`,
        display: 'flex',
        alignItems: 'center',
        gap: '8px',
        fontSize: '13px',
        fontWeight: '500',
        zIndex: 10000,
        boxShadow: '0 8px 32px rgba(0,0,0,0.3)',
        backdropFilter: 'blur(20px)',
        WebkitBackdropFilter: 'blur(20px)',
        animation: 'slideUp 0.25s cubic-bezier(0.175, 0.885, 0.32, 1.275)',
      }}
    >
      {c.icon}
      {message}
    </div>
  )
}