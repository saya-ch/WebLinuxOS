import { useState, useEffect, useCallback } from 'react'
import { Clipboard, Copy, Trash2, Search, Check, Star, X, AlertCircle, Link2, Type, Download, Plus, Shield } from 'lucide-react'

interface ClipboardEntry {
  id: string
  content: string
  type: 'text' | 'url'
  timestamp: number
  starred: boolean
}

type PermissionStatus = 'granted' | 'denied' | 'prompt' | 'unsupported'
type FilterType = 'all' | 'text' | 'url' | 'starred'

const STORAGE_KEY = 'weblinux-clipboard-history'

const formatTimestamp = (ts: number): string => {
  const diff = Date.now() - ts
  const minutes = Math.floor(diff / 60000)
  const hours = Math.floor(diff / 3600000)
  const days = Math.floor(diff / 86400000)

  if (minutes < 1) return '刚刚'
  if (minutes < 60) return `${minutes}分钟前`
  if (hours < 24) return `${hours}小时前`
  if (days < 7) return `${days}天前`
  return new Date(ts).toLocaleDateString('zh-CN', { month: '2-digit', day: '2-digit' })
}

const detectType = (text: string): 'text' | 'url' => {
  const trimmed = text.trim()
  if (/^https?:\/\//i.test(trimmed)) return 'url'
  if (/^[a-z][a-z0-9+.-]*:\/\//i.test(trimmed)) return 'url'
  return 'text'
}

const loadEntries = (): ClipboardEntry[] => {
  try {
    const saved = localStorage.getItem(STORAGE_KEY)
    if (!saved) return []
    const parsed = JSON.parse(saved)
    if (!Array.isArray(parsed)) return []
    return parsed.slice(0, 100)
  } catch {
    return []
  }
}

const saveEntries = (entries: ClipboardEntry[]) => {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(entries))
  } catch (err) {
    console.warn('[Clipboard] 保存失败：', err)
  }
}

export default function RealClipboardHistory() {
  const [entries, setEntries] = useState<ClipboardEntry[]>(loadEntries)
  const [searchQuery, setSearchQuery] = useState('')
  const [filterType, setFilterType] = useState<FilterType>('all')
  const [copiedId, setCopiedId] = useState<string | null>(null)
  const [permissionStatus, setPermissionStatus] = useState<PermissionStatus>('prompt')
  const [inputValue, setInputValue] = useState('')
  const [activeEntryId, setActiveEntryId] = useState<string | null>(null)

  // 持久化
  useEffect(() => {
    saveEntries(entries)
  }, [entries])

  // 检查剪贴板权限
  useEffect(() => {
    if (typeof navigator === 'undefined' || !navigator.permissions) {
      setPermissionStatus('unsupported')
      return
    }
    const queryPermission = async () => {
      try {
        const status = await navigator.permissions.query({ name: 'clipboard-read' as PermissionName })
        setPermissionStatus(status.state as PermissionStatus)
        status.addEventListener('change', () => {
          setPermissionStatus(status.state as PermissionStatus)
        })
      } catch {
        setPermissionStatus('unsupported')
      }
    }
    queryPermission()
  }, [])

  const requestPermission = useCallback(async (): Promise<boolean> => {
    if (typeof navigator === 'undefined' || !navigator.clipboard) {
      setPermissionStatus('unsupported')
      return false
    }
    try {
      await navigator.clipboard.readText()
      setPermissionStatus('granted')
      return true
    } catch (err) {
      console.warn('[Clipboard] 权限请求失败：', err)
      setPermissionStatus('denied')
      return false
    }
  }, [])

  // 通用添加函数
  const addToHistory = useCallback((text: string) => {
    const trimmed = text.trim()
    if (!trimmed) return false
    const type = detectType(trimmed)
    const newEntry: ClipboardEntry = {
      id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
      content: trimmed,
      type,
      timestamp: Date.now(),
      starred: false
    }
    setEntries(prev => [newEntry, ...prev.filter(e => e.content !== trimmed)].slice(0, 100))
    return true
  }, [])

  const handleAdd = () => {
    if (addToHistory(inputValue)) {
      setInputValue('')
    }
  }

  const handlePasteFromClipboard = async () => {
    if (permissionStatus !== 'granted') {
      const ok = await requestPermission()
      if (!ok) return
    }
    try {
      const text = await navigator.clipboard.readText()
      if (text) addToHistory(text)
    } catch (err) {
      console.warn('[Clipboard] 读取失败：', err)
    }
  }

  const copyToClipboard = async (entry: ClipboardEntry) => {
    try {
      await navigator.clipboard.writeText(entry.content)
      setCopiedId(entry.id)
      setActiveEntryId(entry.id)
      setTimeout(() => setCopiedId(null), 2000)
    } catch (err) {
      console.warn('[Clipboard] 复制失败：', err)
    }
  }

  const deleteEntry = (id: string) => {
    setEntries(prev => prev.filter(e => e.id !== id))
    if (activeEntryId === id) setActiveEntryId(null)
  }

  const toggleStar = (id: string) => {
    setEntries(prev => prev.map(e => (e.id === id ? { ...e, starred: !e.starred } : e)))
  }

  const clearAll = () => {
    if (entries.length === 0) return
    if (confirm(`确定要清空全部 ${entries.length} 条记录吗？`)) {
      setEntries([])
      setActiveEntryId(null)
    }
  }

  const exportData = () => {
    const data = JSON.stringify(entries, null, 2)
    const blob = new Blob([data], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `clipboard-history-${new Date().toISOString().slice(0, 10)}.json`
    a.click()
    URL.revokeObjectURL(url)
  }

  const filteredEntries = entries.filter(entry => {
    const matchesSearch = !searchQuery || entry.content.toLowerCase().includes(searchQuery.toLowerCase())
    let matchesFilter = true
    if (filterType === 'text' || filterType === 'url') matchesFilter = entry.type === filterType
    else if (filterType === 'starred') matchesFilter = entry.starred
    return matchesSearch && matchesFilter
  })

  const stats = {
    total: entries.length,
    text: entries.filter(e => e.type === 'text').length,
    url: entries.filter(e => e.type === 'url').length,
    starred: entries.filter(e => e.starred).length
  }

  const permissionLabel: Record<PermissionStatus, { text: string; color: string; icon: typeof Shield }> = {
    granted: { text: '已授权', color: 'var(--accent-success, #10b981)', icon: Shield },
    denied: { text: '已拒绝', color: 'var(--accent-danger, #ef4444)', icon: AlertCircle },
    prompt: { text: '待授权', color: 'var(--accent-warning, #f59e0b)', icon: AlertCircle },
    unsupported: { text: '不支持', color: 'var(--text-secondary)', icon: AlertCircle }
  }

  const PermissionIcon = permissionLabel[permissionStatus].icon

  return (
    <div style={{
      height: '100%',
      display: 'flex',
      flexDirection: 'column',
      background: 'var(--window-bg)',
      color: 'var(--text-primary)',
      overflow: 'hidden'
    }}>
      {/* Header */}
      <div style={{
        padding: '20px 24px 16px',
        borderBottom: '1px solid var(--window-border, rgba(255,255,255,0.08))',
        background: 'var(--window-bg)'
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 16 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <div style={{
              width: 36, height: 36, borderRadius: 10,
              background: 'linear-gradient(135deg, var(--accent, #7c3aed) 0%, #38bdf8 100%)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              boxShadow: '0 4px 16px rgba(124, 58, 237, 0.25)'
            }}>
              <Clipboard size={18} color="#fff" />
            </div>
            <div>
              <h2 style={{ margin: 0, fontSize: 16, fontWeight: 600 }}>剪贴板历史</h2>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 2, fontSize: 11, color: 'var(--text-secondary)' }}>
                <PermissionIcon size={11} style={{ color: permissionLabel[permissionStatus].color }} />
                <span>剪贴板权限：{permissionLabel[permissionStatus].text}</span>
              </div>
            </div>
          </div>

          <div style={{ display: 'flex', gap: 8 }}>
            <button
              onClick={exportData}
              disabled={entries.length === 0}
              title="导出为 JSON"
              style={{
                display: 'flex', alignItems: 'center', gap: 6,
                padding: '7px 12px',
                background: 'transparent', color: 'var(--text-secondary)',
                border: '1px solid var(--window-border, rgba(255,255,255,0.12))',
                borderRadius: 6, cursor: entries.length === 0 ? 'not-allowed' : 'pointer',
                fontSize: 12, opacity: entries.length === 0 ? 0.4 : 1
              }}
            >
              <Download size={13} /> 导出
            </button>
            <button
              onClick={clearAll}
              disabled={entries.length === 0}
              style={{
                display: 'flex', alignItems: 'center', gap: 6,
                padding: '7px 12px',
                background: 'transparent', color: '#ef4444',
                border: '1px solid rgba(239,68,68,0.4)', borderRadius: 6,
                cursor: entries.length === 0 ? 'not-allowed' : 'pointer',
                fontSize: 12, opacity: entries.length === 0 ? 0.4 : 1
              }}
            >
              <Trash2 size={13} /> 清空
            </button>
          </div>
        </div>

        {/* Quick Add */}
        <div style={{ display: 'flex', gap: 8, marginBottom: 12 }}>
          <input
            type="text"
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleAdd()}
            placeholder="快速添加文本或链接到剪贴板历史…"
            style={{
              flex: 1, padding: '8px 12px',
              background: 'var(--input-bg, rgba(255,255,255,0.04))',
              border: '1px solid var(--window-border, rgba(255,255,255,0.12))',
              borderRadius: 6, color: 'var(--text-primary)', fontSize: 13
            }}
          />
          <button
            onClick={handleAdd}
            disabled={!inputValue.trim()}
            style={{
              display: 'flex', alignItems: 'center', gap: 6,
              padding: '8px 14px', background: 'var(--accent, #7c3aed)',
              color: '#fff', border: 'none', borderRadius: 6,
              cursor: inputValue.trim() ? 'pointer' : 'not-allowed',
              opacity: inputValue.trim() ? 1 : 0.4, fontSize: 12, fontWeight: 500
            }}
          >
            <Plus size={13} /> 添加
          </button>
          <button
            onClick={handlePasteFromClipboard}
            title="读取系统剪贴板"
            style={{
              display: 'flex', alignItems: 'center', gap: 6,
              padding: '8px 14px',
              background: 'transparent', color: 'var(--text-primary)',
              border: '1px solid var(--window-border, rgba(255,255,255,0.12))',
              borderRadius: 6, cursor: 'pointer', fontSize: 12
            }}
          >
            <Clipboard size={13} /> 读取
          </button>
        </div>

        {/* Search & Filter */}
        <div style={{ display: 'flex', gap: 8 }}>
          <div style={{ flex: 1, position: 'relative' }}>
            <Search size={14} style={{
              position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)',
              color: 'var(--text-secondary)'
            }} />
            <input
              type="text"
              placeholder="搜索历史记录…"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              style={{
                width: '100%', padding: '7px 12px 7px 32px',
                background: 'var(--input-bg, rgba(255,255,255,0.04))',
                border: '1px solid var(--window-border, rgba(255,255,255,0.12))',
                borderRadius: 6, color: 'var(--text-primary)', fontSize: 12
              }}
            />
          </div>
          <div style={{ display: 'flex', gap: 4 }}>
            {([
              { v: 'all', label: `全部 ${stats.total}` },
              { v: 'text', label: `文本 ${stats.text}` },
              { v: 'url', label: `链接 ${stats.url}` },
              { v: 'starred', label: `收藏 ${stats.starred}` }
            ] as const).map(({ v, label }) => (
              <button
                key={v}
                onClick={() => setFilterType(v)}
                style={{
                  padding: '7px 12px',
                  background: filterType === v ? 'var(--accent-bg, rgba(124,58,237,0.15))' : 'transparent',
                  color: filterType === v ? 'var(--accent, #a78bfa)' : 'var(--text-secondary)',
                  border: '1px solid var(--window-border, rgba(255,255,255,0.12))',
                  borderRadius: 6, cursor: 'pointer', fontSize: 11, whiteSpace: 'nowrap'
                }}
              >
                {label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Entries List */}
      <div style={{ flex: 1, overflow: 'auto', padding: 16 }}>
        {filteredEntries.length === 0 ? (
          <div style={{
            display: 'flex', flexDirection: 'column',
            alignItems: 'center', justifyContent: 'center', height: '100%',
            gap: 12, color: 'var(--text-secondary)'
          }}>
            <Clipboard size={48} style={{ opacity: 0.3 }} />
            <p style={{ fontSize: 14, margin: 0 }}>{entries.length === 0 ? '暂无剪贴板历史' : '没有匹配的记录'}</p>
            <p style={{ fontSize: 12, margin: 0, opacity: 0.7 }}>
              {entries.length === 0 ? '在上方添加内容或从系统剪贴板读取' : '尝试调整搜索或筛选条件'}
            </p>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {filteredEntries.map(entry => (
              <div
                key={entry.id}
                onClick={() => setActiveEntryId(entry.id)}
                style={{
                  padding: 12,
                  background: activeEntryId === entry.id
                    ? 'var(--accent-bg, rgba(124,58,237,0.08))'
                    : 'var(--card-bg, rgba(255,255,255,0.02))',
                  border: '1px solid',
                  borderColor: activeEntryId === entry.id
                    ? 'var(--accent, rgba(124,58,237,0.4))'
                    : 'var(--window-border, rgba(255,255,255,0.08))',
                  borderRadius: 10, cursor: 'pointer',
                  transition: 'all 0.15s'
                }}
              >
                <div style={{
                  display: 'flex', justifyContent: 'space-between',
                  alignItems: 'center', marginBottom: 8
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <span style={{
                      display: 'inline-flex', alignItems: 'center', gap: 4,
                      padding: '2px 8px',
                      background: entry.type === 'url'
                        ? 'rgba(56, 189, 248, 0.12)'
                        : 'rgba(124, 58, 237, 0.12)',
                      color: entry.type === 'url' ? '#38bdf8' : '#a78bfa',
                      borderRadius: 4, fontSize: 10, fontWeight: 500
                    }}>
                      {entry.type === 'url' ? <Link2 size={10} /> : <Type size={10} />}
                      {entry.type === 'url' ? '链接' : '文本'}
                    </span>
                    <span style={{ fontSize: 11, color: 'var(--text-secondary)' }}>
                      {formatTimestamp(entry.timestamp)}
                    </span>
                  </div>

                  <div style={{ display: 'flex', gap: 4 }}>
                    <button
                      onClick={(e) => { e.stopPropagation(); toggleStar(entry.id) }}
                      style={{
                        padding: 5, background: 'transparent', border: 'none',
                        cursor: 'pointer', color: entry.starred ? '#f59e0b' : 'var(--text-secondary)',
                        borderRadius: 4, display: 'flex', alignItems: 'center'
                      }}
                      title={entry.starred ? '取消收藏' : '收藏'}
                    >
                      <Star size={13} fill={entry.starred ? 'currentColor' : 'none'} />
                    </button>
                    <button
                      onClick={(e) => { e.stopPropagation(); copyToClipboard(entry) }}
                      style={{
                        display: 'flex', alignItems: 'center', gap: 4,
                        padding: '4px 10px',
                        background: copiedId === entry.id ? 'var(--accent, #7c3aed)' : 'transparent',
                        color: copiedId === entry.id ? '#fff' : 'var(--text-secondary)',
                        border: '1px solid var(--window-border, rgba(255,255,255,0.12))',
                        borderRadius: 4, cursor: 'pointer', fontSize: 11
                      }}
                    >
                      {copiedId === entry.id ? <Check size={11} /> : <Copy size={11} />}
                      {copiedId === entry.id ? '已复制' : '复制'}
                    </button>
                    <button
                      onClick={(e) => { e.stopPropagation(); deleteEntry(entry.id) }}
                      style={{
                        padding: 5, background: 'transparent', border: 'none',
                        cursor: 'pointer', color: 'var(--text-secondary)',
                        borderRadius: 4, display: 'flex', alignItems: 'center'
                      }}
                      title="删除"
                    >
                      <X size={13} />
                    </button>
                  </div>
                </div>

                <div style={{
                  fontSize: 12, lineHeight: 1.5, color: 'var(--text-primary)',
                  fontFamily: entry.type === 'url' ? 'var(--font-mono, monospace)' : 'inherit',
                  wordBreak: 'break-word', whiteSpace: 'pre-wrap',
                  maxHeight: 100, overflow: 'hidden',
                  display: '-webkit-box', WebkitLineClamp: 4, WebkitBoxOrient: 'vertical'
                }}>
                  {entry.content}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Footer */}
      <div style={{
        padding: '10px 24px',
        borderTop: '1px solid var(--window-border, rgba(255,255,255,0.08))',
        fontSize: 11, color: 'var(--text-secondary)',
        display: 'flex', justifyContent: 'space-between', alignItems: 'center'
      }}>
        <span>共 {stats.total} 条，显示 {filteredEntries.length} 条</span>
        <span>本地存储 · 最多 100 条</span>
      </div>
    </div>
  )
}
