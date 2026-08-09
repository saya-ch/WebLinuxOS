import { useState, useEffect, useCallback, useMemo, useRef, type CSSProperties } from 'react'
import { useStore } from '../store'
import {
  Save as BackupIcon,
  Download as DownloadIcon,
  Upload as UploadIcon,
  FileJson as FileJsonIcon,
  AlertTriangle as AlertTriangleIcon,
  Check as CheckIcon,
  Trash2 as Trash2Icon,
  Info as InfoIcon,
  RotateCcw,
  HardDrive,
  Palette,
  Settings as SettingsIcon,
  Clock,
  X,
} from 'lucide-react'
import type { FileNode } from '../types'

type BackupScope = 'files' | 'settings' | 'all'

interface BackupEntry {
  id: string
  timestamp: number
  scope: BackupScope
  size: number
  summary: string
}

interface BackupData {
  version: string
  exportedAt: string
  scope: BackupScope
  files?: FileNode[]
  settings?: {
    theme: 'dark' | 'light'
    wallpaper: string
    liveWallpaper: string
    liveWallpaperEnabled: boolean
    currentDesktop: number
    totalDesktops: number
    favorites: string[]
    pinnedApps: string[]
    desktopIcons: { id: string; appId: string; name: string; x: number; y: number }[]
  }
}

const HISTORY_KEY = 'weblinux-backup-history'
const MAX_HISTORY = 5

const fmtSize = (b: number) => {
  if (b < 1024) return `${b} B`
  if (b < 1048576) return `${(b / 1024).toFixed(1)} KB`
  return `${(b / 1048576).toFixed(2)} MB`
}

const countFiles = (nodes: FileNode[]): number => {
  let n = 0
  for (const node of nodes) {
    if (node.type === 'file') n++
    if (node.children) n += countFiles(node.children)
  }
  return n
}

const fmtTime = (ts: number) => {
  const d = new Date(ts), p = (n: number) => String(n).padStart(2, '0')
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())} ${p(d.getHours())}:${p(d.getMinutes())}`
}

const scopeLabels: Record<BackupScope, { label: string; desc: string }> = {
  files: { label: '仅文件', desc: '备份文件系统中的所有文件' },
  settings: { label: '仅设置', desc: '备份主题、壁纸、桌面等偏好' },
  all: { label: '全部备份', desc: '包含文件系统和所有系统设置' },
}

const S = {
  root: { position: 'relative', width: '100%', height: '100%', overflow: 'auto', background: 'linear-gradient(135deg, #0f172a 0%, #1e1b4b 50%, #312e81 100%)', color: '#e2e8f0', fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif' } as CSSProperties,
  orbs: { position: 'fixed', inset: 0, overflow: 'hidden', pointerEvents: 'none', zIndex: 0 } as CSSProperties,
  orb: (w: number, h: number, bg: string, top: string, left: string) => ({ position: 'absolute', width: w, height: h, background: bg, borderRadius: '50%', filter: 'blur(100px)', opacity: 0.4, top, left } as CSSProperties),
  container: { position: 'relative', zIndex: 1, padding: 24, maxWidth: 960, margin: '0 auto' } as CSSProperties,
  header: { display: 'flex', alignItems: 'center', gap: 16, marginBottom: 24 } as CSSProperties,
  headerIcon: { width: 56, height: 56, borderRadius: 16, background: 'linear-gradient(135deg, rgba(99,102,241,0.3), rgba(139,92,246,0.3))', border: '1px solid rgba(99,102,241,0.3)', display: 'flex', alignItems: 'center', justifyContent: 'center', backdropFilter: 'blur(12px)' } as CSSProperties,
  title: { fontSize: 24, fontWeight: 700, margin: 0, background: 'linear-gradient(135deg, #f8fafc, #c7d2fe)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' } as CSSProperties,
  subtitle: { fontSize: 13, color: '#94a3b8', margin: '4px 0 0 0' } as CSSProperties,
  card: { background: 'rgba(15,23,42,0.5)', backdropFilter: 'blur(16px)', borderRadius: 20, border: '1px solid rgba(99,102,241,0.2)', padding: 20, boxShadow: '0 8px 32px rgba(0,0,0,0.2)' } as CSSProperties,
  cardHeader: { display: 'flex', alignItems: 'center', gap: 12, marginBottom: 16 } as CSSProperties,
  cardIcon: (bg?: string) => ({ width: 36, height: 36, borderRadius: 10, background: bg || 'linear-gradient(135deg, rgba(99,102,241,0.3), rgba(139,92,246,0.3))', display: 'flex', alignItems: 'center', justifyContent: 'center' } as CSSProperties),
  cardTitle: { fontSize: 16, fontWeight: 600, margin: 0, color: '#f1f5f9' } as CSSProperties,
  grid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 16, marginBottom: 24 } as CSSProperties,
  stats: { display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 8, marginBottom: 16 } as CSSProperties,
  statItem: { textAlign: 'center', padding: '12px 8px', borderRadius: 12, background: 'rgba(30,27,75,0.4)', border: '1px solid rgba(99,102,241,0.1)' } as CSSProperties,
  statVal: { fontSize: 20, fontWeight: 700, background: 'linear-gradient(135deg, #818cf8, #c084fc)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' } as CSSProperties,
  statLabel: { fontSize: 11, color: '#94a3b8', marginTop: 4 } as CSSProperties,
  infoRows: { display: 'flex', flexDirection: 'column', gap: 8 } as CSSProperties,
  infoRow: { display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, padding: '6px 10px', borderRadius: 8, background: 'rgba(30,27,75,0.3)' } as CSSProperties,
  scopeBtn: (active: boolean) => ({ textAlign: 'left', padding: '12px 14px', borderRadius: 12, background: active ? 'linear-gradient(135deg, rgba(99,102,241,0.4), rgba(139,92,246,0.4))' : 'rgba(30,27,75,0.4)', border: `1px solid ${active ? 'rgba(129,140,248,0.6)' : 'rgba(99,102,241,0.15)'}`, color: '#e2e8f0', cursor: 'pointer', position: 'relative', boxShadow: active ? '0 0 20px rgba(99,102,241,0.2)' : 'none', transition: 'all 0.2s ease' } as CSSProperties),
  actionRow: { display: 'flex', gap: 10, flexWrap: 'wrap' } as CSSProperties,
  primaryBtn: (disabled: boolean) => ({ flex: 1, minWidth: 140, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, padding: '12px 18px', borderRadius: 12, background: 'linear-gradient(135deg, #6366f1, #8b5cf6)', color: '#fff', border: 'none', fontSize: 14, fontWeight: 600, cursor: disabled ? 'not-allowed' : 'pointer', opacity: disabled ? 0.6 : 1, boxShadow: '0 4px 15px rgba(99,102,241,0.3)', transition: 'all 0.2s ease' } as CSSProperties),
  secondaryBtn: (disabled: boolean) => ({ flex: 1, minWidth: 140, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, padding: '12px 18px', borderRadius: 12, background: 'rgba(30,27,75,0.5)', color: '#c7d2fe', border: '1px solid rgba(99,102,241,0.3)', fontSize: 14, fontWeight: 600, cursor: disabled ? 'not-allowed' : 'pointer', opacity: disabled ? 0.6 : 1, transition: 'all 0.2s ease' } as CSSProperties),
  dangerBtn: (disabled: boolean) => ({ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, padding: '12px 18px', borderRadius: 12, background: 'linear-gradient(135deg, #dc2626, #ef4444)', color: '#fff', border: 'none', fontSize: 14, fontWeight: 600, cursor: disabled ? 'not-allowed' : 'pointer', opacity: disabled ? 0.6 : 1, boxShadow: '0 4px 15px rgba(220,38,38,0.3)', transition: 'all 0.2s ease' } as CSSProperties),
  progressBar: { height: 8, borderRadius: 4, background: 'rgba(30,27,75,0.6)', overflow: 'hidden', marginTop: 14 } as CSSProperties,
  progressFill: (w: number) => ({ height: '100%', width: `${w}%`, background: 'linear-gradient(90deg, #6366f1, #8b5cf6, #ec4899)', borderRadius: 4, transition: 'width 0.3s ease' } as CSSProperties),
  progressText: { display: 'flex', justifyContent: 'space-between', marginTop: 6, fontSize: 12, color: '#94a3b8' } as CSSProperties,
  warning: { display: 'flex', gap: 10, padding: '12px 14px', borderRadius: 12, background: 'rgba(251,191,36,0.1)', border: '1px solid rgba(251,191,36,0.25)', fontSize: 12, color: '#fde68a', lineHeight: 1.5, marginBottom: 14 } as CSSProperties,
  notif: (borderColor: string) => ({ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 16px', borderRadius: 12, background: 'rgba(15,23,42,0.6)', backdropFilter: 'blur(12px)', border: `1px solid ${borderColor}`, marginBottom: 16 } as CSSProperties),
  historySection: { background: 'rgba(15,23,42,0.5)', backdropFilter: 'blur(16px)', borderRadius: 20, border: '1px solid rgba(99,102,241,0.2)', padding: 20 } as CSSProperties,
  historyItem: { display: 'flex', alignItems: 'center', gap: 12, padding: '12px 14px', borderRadius: 12, background: 'rgba(30,27,75,0.4)', border: '1px solid rgba(99,102,241,0.1)', marginBottom: 10 } as CSSProperties,
  modalOverlay: { position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(8px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 } as CSSProperties,
  modal: { width: '90%', maxWidth: 420, background: 'linear-gradient(135deg, #1e1b4b, #312e81)', borderRadius: 20, border: '1px solid rgba(99,102,241,0.3)', padding: 28, boxShadow: '0 25px 50px rgba(0,0,0,0.5)' } as CSSProperties,
  importRow: { display: 'flex', justifyContent: 'space-between', fontSize: 12, color: '#94a3b8', padding: '4px 0' } as CSSProperties,
}

export default function SystemBackup() {
  const files = useStore((s) => s.files)
  const theme = useStore((s) => s.theme)
  const wallpaper = useStore((s) => s.wallpaper)
  const liveWallpaper = useStore((s) => s.liveWallpaper)
  const liveWallpaperEnabled = useStore((s) => s.liveWallpaperEnabled)
  const currentDesktop = useStore((s) => s.currentDesktop)
  const totalDesktops = useStore((s) => s.totalDesktops)
  const desktopIcons = useStore((s) => s.desktopIcons)
  const favorites = useStore((s) => s.favorites)
  const pinnedApps = useStore((s) => s.pinnedApps)
  const addNotification = useStore((s) => s.addNotification)

  const [scope, setScope] = useState<BackupScope>('all')
  const [progress, setProgress] = useState(0)
  const [isOperating, setIsOperating] = useState(false)
  const [operationName, setOperationName] = useState('')
  const [history, setHistory] = useState<BackupEntry[]>([])
  const [status, setStatus] = useState<{ type: 'success' | 'error' | 'info'; text: string } | null>(null)
  const [showReset, setShowReset] = useState(false)
  const [showImport, setShowImport] = useState(false)
  const [importData, setImportData] = useState<BackupData | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    try {
      const raw = localStorage.getItem(HISTORY_KEY)
      if (raw) setHistory(JSON.parse(raw))
    } catch { /* empty */ }
  }, [])

  const persistHistory = useCallback((entries: BackupEntry[]) => {
    try { localStorage.setItem(HISTORY_KEY, JSON.stringify(entries)) } catch { /* empty */ }
  }, [])

  const addHistoryEntry = useCallback((entry: BackupEntry) => {
    const next = [entry, ...history].slice(0, MAX_HISTORY)
    setHistory(next)
    persistHistory(next)
  }, [history, persistHistory])

  const removeHistoryEntry = useCallback((id: string) => {
    const next = history.filter((e) => e.id !== id)
    setHistory(next)
    persistHistory(next)
  }, [history, persistHistory])

  const buildBackupData = useCallback((target: BackupScope): BackupData => {
    const d: BackupData = { version: '1.0', exportedAt: new Date().toISOString(), scope: target }
    if (target === 'files' || target === 'all') d.files = JSON.parse(JSON.stringify(files))
    if (target === 'settings' || target === 'all') {
      d.settings = { theme, wallpaper, liveWallpaper, liveWallpaperEnabled, currentDesktop, totalDesktops, favorites: [...favorites], pinnedApps: [...pinnedApps], desktopIcons: desktopIcons.map(i => ({ id: i.id, appId: i.appId, name: i.name, x: i.x, y: i.y })) }
    }
    return d
  }, [files, theme, wallpaper, liveWallpaper, liveWallpaperEnabled, currentDesktop, totalDesktops, favorites, pinnedApps, desktopIcons])

  const createSummary = useCallback((target: BackupScope): string => {
    const parts: string[] = []
    if (target === 'files' || target === 'all') parts.push(`${countFiles(files)} 个文件`)
    if (target === 'settings' || target === 'all') {
      const s: string[] = [theme === 'dark' ? '深色主题' : '浅色主题']
      if (wallpaper) s.push('壁纸')
      if (liveWallpaperEnabled) s.push('动态壁纸')
      s.push(`${totalDesktops} 个桌面`)
      if (favorites.length) s.push(`${favorites.length} 收藏`)
      if (pinnedApps.length) s.push(`${pinnedApps.length} 固定应用`)
      parts.push(s.join('、'))
    }
    return parts.join(' | ')
  }, [files, theme, wallpaper, liveWallpaperEnabled, totalDesktops, favorites, pinnedApps])

  const exportBackup = useCallback(async () => {
    setIsOperating(true); setOperationName('正在导出备份...'); setProgress(0); setStatus(null)
    const data = buildBackupData(scope)
    const json = JSON.stringify(data, null, 2)
    const bytes = new Blob([json]).size
    for (let i = 1; i <= 100; i += 4) { await new Promise(r => setTimeout(r, 20)); setProgress(i) }
    try {
      const blob = new Blob([json], { type: 'application/json' })
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      const ts = new Date(), p = (n: number) => String(n).padStart(2, '0')
      a.download = `weblinux-backup-${ts.getFullYear()}${p(ts.getMonth() + 1)}${p(ts.getDate())}-${p(ts.getHours())}${p(ts.getMinutes())}.json`
      a.href = url; document.body.appendChild(a); a.click(); document.body.removeChild(a); URL.revokeObjectURL(url)
      addHistoryEntry({ id: `bk-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`, timestamp: Date.now(), scope, size: bytes, summary: createSummary(scope) })
      setStatus({ type: 'success', text: `备份成功！文件大小 ${fmtSize(bytes)}` })
      addNotification({ title: '备份完成', message: `系统已导出为 JSON 文件（${fmtSize(bytes)}）`, type: 'success', duration: 4000 })
    } catch (err) {
      setStatus({ type: 'error', text: `导出失败：${(err as Error).message}` })
      addNotification({ title: '备份失败', message: (err as Error).message || '未知错误', type: 'error', duration: 4000 })
    } finally { setProgress(100); setIsOperating(false); setOperationName(''); setTimeout(() => setStatus(null), 5000) }
  }, [scope, buildBackupData, createSummary, addHistoryEntry, addNotification])

  const handleFileSelect = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]; if (!file) return
    const reader = new FileReader()
    reader.onload = () => {
      try {
        const data: BackupData = JSON.parse(reader.result as string)
        if (!data.version || !data.scope) throw new Error('无效的备份文件格式')
        if (data.scope === 'files' && !data.files?.length) throw new Error('该备份不包含文件数据')
        setImportData(data); setShowImport(true)
      } catch (err) {
        setStatus({ type: 'error', text: `导入失败：${(err as Error).message}` })
        addNotification({ title: '导入失败', message: (err as Error).message, type: 'error', duration: 4000 })
      }
    }
    reader.readAsText(file); e.target.value = ''
  }, [addNotification])

  const confirmImport = useCallback(async () => {
    if (!importData) return
    setShowImport(false); setIsOperating(true); setOperationName('正在恢复备份...'); setProgress(0); setStatus(null)
    try {
      for (let i = 1; i <= 100; i += 5) { await new Promise(r => setTimeout(r, 18)); setProgress(i) }
      if (importData.files) useStore.setState({ files: importData.files })
      if (importData.settings) {
        const s = importData.settings
        useStore.setState({ theme: s.theme, wallpaper: s.wallpaper, liveWallpaper: s.liveWallpaper, liveWallpaperEnabled: s.liveWallpaperEnabled, currentDesktop: s.currentDesktop, totalDesktops: s.totalDesktops, favorites: s.favorites, pinnedApps: s.pinnedApps, desktopIcons: s.desktopIcons.map(i => ({ ...i, icon: null })) })
      }
      setStatus({ type: 'success', text: '系统已成功恢复！' })
      addNotification({ title: '恢复完成', message: '系统状态已从备份中恢复', type: 'success', duration: 4000 })
      addHistoryEntry({ id: `rs-${Date.now()}`, timestamp: Date.now(), scope: importData.scope, size: new Blob([JSON.stringify(importData)]).size, summary: `恢复自 ${fmtTime(new Date(importData.exportedAt).getTime())} 的备份` })
    } catch (err) {
      setStatus({ type: 'error', text: `恢复失败：${(err as Error).message}` })
      addNotification({ title: '恢复失败', message: (err as Error).message || '未知错误', type: 'error', duration: 4000 })
    } finally { setProgress(100); setIsOperating(false); setOperationName(''); setImportData(null); setTimeout(() => setStatus(null), 5000) }
  }, [importData, addNotification, addHistoryEntry])

  const confirmReset = useCallback(async () => {
    setShowReset(false); setIsOperating(true); setOperationName('正在重置系统...'); setProgress(0)
    const steps = ['清除文件系统...', '重置外观设置...', '恢复默认桌面...', '清理用户数据...']
    for (let i = 0; i < steps.length; i++) { await new Promise(r => setTimeout(r, 250)); setProgress(Math.round(((i + 1) / steps.length) * 80)); setOperationName(`正在重置系统... ${steps[i]}`) }
    await new Promise(r => setTimeout(r, 300)); setProgress(100); setOperationName(''); setIsOperating(false)
    setStatus({ type: 'success', text: '系统已恢复至默认状态' })
    addNotification({ title: '重置完成', message: '系统已恢复至默认配置', type: 'success', duration: 4000 })
  }, [addNotification])

  const fileCount = useMemo(() => countFiles(files), [files])
  const estimatedSize = useMemo(() => new Blob([JSON.stringify(buildBackupData('all'))]).size, [buildBackupData])

  const statusColors: Record<string, string> = { success: '#34d399', error: '#f87171', info: '#60a5fa' }

  return (
    <div style={S.root}>
      <div style={S.orbs}>
        <div style={S.orb(400, 400, 'linear-gradient(135deg, #6366f1, #8b5cf6)', '-10%', '-5%')} />
        <div style={S.orb(350, 350, 'linear-gradient(135deg, #ec4899, #f472b6)', 'auto', 'auto')} />
      </div>

      <div style={S.container}>
        <div style={S.header}>
          <div style={S.headerIcon}><BackupIcon size={24} color="#818cf8" /></div>
          <div>
            <h1 style={S.title}>系统备份与恢复</h1>
            <p style={S.subtitle}>导出、导入或重置您的 WebLinuxOS 系统状态</p>
          </div>
        </div>

        {status && (
          <div style={S.notif(statusColors[status.type])}>
            {status.type === 'success' && <CheckIcon size={18} color="#34d399" />}
            {status.type === 'error' && <AlertTriangleIcon size={18} color="#f87171" />}
            <span style={{ flex: 1, fontSize: 13 }}>{status.text}</span>
            <button style={{ background: 'none', border: 'none', color: '#94a3b8', cursor: 'pointer', padding: 4 }} onClick={() => setStatus(null)}><X size={14} /></button>
          </div>
        )}

        <div style={S.grid}>
          <div style={S.card}>
            <div style={S.cardHeader}>
              <div style={S.cardIcon()}><HardDrive size={18} color="#818cf8" /></div>
              <h2 style={S.cardTitle}>系统信息</h2>
            </div>
            <div style={S.stats}>
              <div style={S.statItem}><div style={S.statVal}>{fileCount}</div><div style={S.statLabel}>文件数量</div></div>
              <div style={S.statItem}><div style={S.statVal}>{theme === 'dark' ? '🌙' : '☀️'}</div><div style={S.statLabel}>{theme === 'dark' ? '深色主题' : '浅色主题'}</div></div>
              <div style={S.statItem}><div style={S.statVal}>{totalDesktops}</div><div style={S.statLabel}>桌面数量</div></div>
              <div style={S.statItem}><div style={S.statVal}>{fmtSize(estimatedSize)}</div><div style={S.statLabel}>预估备份大小</div></div>
            </div>
            <div style={S.infoRows}>
              <div style={S.infoRow}><Palette size={14} color="#a5b4fc" /><span style={{ color: '#94a3b8' }}>壁纸：</span><span style={{ color: '#cbd5e1', fontWeight: 500 }}>{wallpaper || '默认壁纸'}</span></div>
              <div style={S.infoRow}><SettingsIcon size={14} color="#a5b4fc" /><span style={{ color: '#94a3b8' }}>动态壁纸：</span><span style={{ color: '#cbd5e1', fontWeight: 500 }}>{liveWallpaperEnabled ? `已启用（${liveWallpaper}）` : '未启用'}</span></div>
              <div style={S.infoRow}><InfoIcon size={14} color="#a5b4fc" /><span style={{ color: '#94a3b8' }}>固定应用：</span><span style={{ color: '#cbd5e1', fontWeight: 500 }}>{pinnedApps.length} 个</span></div>
            </div>
          </div>

          <div style={S.card}>
            <div style={S.cardHeader}>
              <div style={S.cardIcon('linear-gradient(135deg, #f472b6, #c084fc)')}><BackupIcon size={18} color="#fff" /></div>
              <h2 style={S.cardTitle}>导出备份</h2>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 16 }}>
              {(['files', 'settings', 'all'] as BackupScope[]).map(s => (
                <button key={s} style={S.scopeBtn(scope === s)} onClick={() => setScope(s)}>
                  <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 2 }}>{scopeLabels[s].label}</div>
                  <div style={{ fontSize: 11, color: '#94a3b8' }}>{scopeLabels[s].desc}</div>
                  {scope === s && <div style={{ position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)', width: 22, height: 22, borderRadius: '50%', background: 'linear-gradient(135deg, #6366f1, #8b5cf6)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><CheckIcon size={14} color="#fff" /></div>}
                </button>
              ))}
            </div>
            <div style={S.actionRow}>
              <button style={S.primaryBtn(isOperating)} disabled={isOperating} onClick={exportBackup}>
                <DownloadIcon size={18} />{isOperating ? operationName : '导出为 JSON 文件'}
              </button>
              <button style={S.secondaryBtn(isOperating)} disabled={isOperating} onClick={() => fileInputRef.current?.click()}>
                <UploadIcon size={18} />从 JSON 文件导入
              </button>
              <input ref={fileInputRef} type="file" accept=".json,application/json" style={{ display: 'none' }} onChange={handleFileSelect} />
            </div>
            {isOperating && (
              <>
                <div style={S.progressBar}><div style={S.progressFill(progress)} /></div>
                <div style={S.progressText}><span>{operationName}</span><span>{progress}%</span></div>
              </>
            )}
          </div>

          <div style={S.card}>
            <div style={S.cardHeader}>
              <div style={S.cardIcon('linear-gradient(135deg, #fbbf24, #f59e0b)')}><RotateCcw size={18} color="#fff" /></div>
              <h2 style={S.cardTitle}>重置系统</h2>
            </div>
            <div style={S.warning}>
              <AlertTriangleIcon size={20} color="#fbbf24" />
              <span>此操作将清除所有文件、设置和偏好，恢复到初始状态。此操作不可撤销，建议先导出备份。</span>
            </div>
            <button style={S.dangerBtn(isOperating)} disabled={isOperating} onClick={() => setShowReset(true)}>
              <AlertTriangleIcon size={18} />一键重置系统
            </button>
          </div>
        </div>

        <div style={S.historySection}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, fontSize: 16, fontWeight: 600 }}>
              <Clock size={18} color="#a5b4fc" /><span>备份历史</span>
              <span style={{ fontSize: 12, padding: '2px 8px', borderRadius: 10, background: 'rgba(99,102,241,0.2)', color: '#a5b4fc', fontWeight: 500 }}>{history.length}/{MAX_HISTORY}</span>
            </div>
            {history.length > 0 && (
              <button style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '6px 12px', borderRadius: 8, background: 'rgba(239,68,68,0.15)', color: '#fca5a5', border: '1px solid rgba(239,68,68,0.3)', fontSize: 12, cursor: 'pointer' }} onClick={() => { setHistory([]); persistHistory([]) }}>
                <Trash2Icon size={14} />清空历史
              </button>
            )}
          </div>
          {history.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '40px 20px', color: '#64748b' }}>
              <FileJsonIcon size={32} color="#4b5563" />
              <p style={{ fontSize: 14, margin: '12px 0 4px', color: '#94a3b8' }}>暂无备份记录</p>
              <p style={{ fontSize: 12, color: '#64748b', margin: 0 }}>导出的备份将自动保存到此处，最多保留最近 {MAX_HISTORY} 条</p>
            </div>
          ) : (
            <div>
              {history.map(entry => (
                <div key={entry.id} style={S.historyItem}>
                  <div style={{ width: 32, height: 32, borderRadius: 8, background: 'rgba(99,102,241,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                    {entry.scope === 'files' && <HardDrive size={16} color="#60a5fa" />}
                    {entry.scope === 'settings' && <SettingsIcon size={16} color="#fbbf24" />}
                    {entry.scope === 'all' && <FileJsonIcon size={16} color="#34d399" />}
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 12 }}>
                      <span style={{ color: '#cbd5e1', fontWeight: 500 }}>{fmtTime(entry.timestamp)}</span>
                      <span style={{ color: '#a5b4fc', padding: '1px 6px', borderRadius: 4, background: 'rgba(99,102,241,0.15)' }}>{scopeLabels[entry.scope].label}</span>
                      <span style={{ color: '#94a3b8' }}>{fmtSize(entry.size)}</span>
                    </div>
                    <div style={{ fontSize: 11, color: '#64748b', marginTop: 2, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{entry.summary}</div>
                  </div>
                  <button style={{ background: 'none', border: 'none', color: '#64748b', cursor: 'pointer', padding: 6, borderRadius: 6 }} onClick={() => removeHistoryEntry(entry.id)} title="删除此记录"><Trash2Icon size={14} /></button>
                </div>
              ))}
            </div>
          )}
        </div>

        {showReset && (
          <div style={S.modalOverlay} onClick={() => setShowReset(false)}>
            <div style={S.modal} onClick={e => e.stopPropagation()}>
              <div style={{ width: 60, height: 60, borderRadius: 16, background: 'rgba(251,191,36,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px' }}><AlertTriangleIcon size={32} color="#fbbf24" /></div>
              <h3 style={{ fontSize: 18, fontWeight: 700, textAlign: 'center', margin: '0 0 12px', color: '#f1f5f9' }}>确认重置系统？</h3>
              <p style={{ fontSize: 13, color: '#cbd5e1', lineHeight: 1.6, margin: '0 0 8px' }}>此操作将<strong>清除所有数据</strong>，包括：</p>
              <ul style={{ fontSize: 12, color: '#94a3b8', paddingLeft: 20, lineHeight: 1.8, margin: '8px 0 12px' }}>
                <li>所有文件和文件夹</li>
                <li>主题、壁纸等外观设置</li>
                <li>桌面配置和用户偏好</li>
              </ul>
              <p style={{ fontSize: 13, color: '#fbbf24', lineHeight: 1.6 }}>此操作不可撤销！建议先导出备份。</p>
              <div style={{ display: 'flex', gap: 10, marginTop: 16 }}>
                <button style={{ flex: 1, padding: '10px 16px', borderRadius: 10, background: 'rgba(30,27,75,0.5)', color: '#cbd5e1', border: '1px solid rgba(99,102,241,0.3)', fontSize: 14, fontWeight: 600, cursor: 'pointer' }} onClick={() => setShowReset(false)}>取消</button>
                <button style={{ flex: 1, padding: '10px 16px', borderRadius: 10, background: 'linear-gradient(135deg, #6366f1, #8b5cf6)', color: '#fff', border: 'none', fontSize: 14, fontWeight: 600, cursor: 'pointer', boxShadow: '0 4px 15px rgba(99,102,241,0.3)' }} onClick={confirmReset}>确认重置</button>
              </div>
            </div>
          </div>
        )}

        {showImport && importData && (
          <div style={S.modalOverlay} onClick={() => setShowImport(false)}>
            <div style={S.modal} onClick={e => e.stopPropagation()}>
              <div style={{ width: 60, height: 60, borderRadius: 16, background: 'rgba(96,165,250,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px' }}><UploadIcon size={32} color="#60a5fa" /></div>
              <h3 style={{ fontSize: 18, fontWeight: 700, textAlign: 'center', margin: '0 0 12px', color: '#f1f5f9' }}>确认导入备份？</h3>
              <div style={{ background: 'rgba(15,23,42,0.5)', borderRadius: 12, padding: 14 }}>
                <div style={S.importRow}><span>备份版本：</span><strong style={{ color: '#cbd5e1' }}>v{importData.version}</strong></div>
                <div style={S.importRow}><span>导出时间：</span><strong style={{ color: '#cbd5e1' }}>{fmtTime(new Date(importData.exportedAt).getTime())}</strong></div>
                <div style={S.importRow}><span>备份范围：</span><strong style={{ color: '#cbd5e1' }}>{scopeLabels[importData.scope].label}</strong></div>
                {importData.files && <div style={S.importRow}><span>文件数量：</span><strong style={{ color: '#cbd5e1' }}>{countFiles(importData.files)}</strong></div>}
                {importData.settings && <div style={S.importRow}><span>主题：</span><strong style={{ color: '#cbd5e1' }}>{importData.settings.theme === 'dark' ? '深色' : '浅色'}</strong></div>}
              </div>
              <p style={{ fontSize: 13, color: '#fbbf24', lineHeight: 1.6, marginTop: 12 }}>导入将<strong>覆盖</strong>当前的系统状态，建议先导出一份当前备份。</p>
              <div style={{ display: 'flex', gap: 10, marginTop: 16 }}>
                <button style={{ flex: 1, padding: '10px 16px', borderRadius: 10, background: 'rgba(30,27,75,0.5)', color: '#cbd5e1', border: '1px solid rgba(99,102,241,0.3)', fontSize: 14, fontWeight: 600, cursor: 'pointer' }} onClick={() => { setShowImport(false); setImportData(null) }}>取消</button>
                <button style={{ flex: 1, padding: '10px 16px', borderRadius: 10, background: 'linear-gradient(135deg, #6366f1, #8b5cf6)', color: '#fff', border: 'none', fontSize: 14, fontWeight: 600, cursor: 'pointer', boxShadow: '0 4px 15px rgba(99,102,241,0.3)' }} onClick={confirmImport}>确认导入</button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
