import { useState, useEffect, useCallback, useMemo } from 'react'

// ── 类型定义 ──

interface StorageEntry {
  key: string
  value: string
  size: number
  type: 'string' | 'json' | 'number' | 'boolean' | 'other'
  lastModified: number | null
}

interface StorageStats {
  totalItems: number
  totalSize: number
  usedPercent: number
  largestKey: string
  largestSize: number
}

// ── 工具函数 ──

function estimateSize(str: string): number {
  return new Blob([str]).size
}

function formatBytes(bytes: number): string {
  if (bytes === 0) return '0 B'
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(2)} MB`
}

function detectType(value: string): StorageEntry['type'] {
  if (value === 'true' || value === 'false') return 'boolean'
  if (/^-?\d+(\.\d+)?$/.test(value)) return 'number'
  try {
    const parsed = JSON.parse(value)
    if (typeof parsed === 'object' && parsed !== null) return 'json'
    return 'string'
  } catch {
    return 'string'
  }
}

function prettyPrint(value: string, type: StorageEntry['type']): string {
  if (type === 'json') {
    try {
      return JSON.stringify(JSON.parse(value), null, 2)
    } catch {
      return value
    }
  }
  return value
}

function getAllStorage(storageType: 'localStorage' | 'sessionStorage'): StorageEntry[] {
  const storage = storageType === 'localStorage' ? localStorage : sessionStorage
  const entries: StorageEntry[] = []
  for (let i = 0; i < storage.length; i++) {
    const key = storage.key(i)
    if (key === null) continue
    const value = storage.getItem(key) || ''
    entries.push({
      key,
      value,
      size: estimateSize(key) + estimateSize(value),
      type: detectType(value),
      lastModified: null,
    })
  }
  return entries.sort((a, b) => b.size - a.size)
}

function computeStats(entries: StorageEntry[]): StorageStats {
  const totalSize = entries.reduce((sum, e) => sum + e.size, 0)
  const STORAGE_LIMIT = 5 * 1024 * 1024
  const largest = entries.reduce((max, e) => e.size > max.size ? e : max, entries[0])
  return {
    totalItems: entries.length,
    totalSize,
    usedPercent: Math.round((totalSize / STORAGE_LIMIT) * 100),
    largestKey: largest?.key || '-',
    largestSize: largest?.size || 0,
  }
}

// ── 组件 ──

export default function LocalStorageInspector() {
  const [storageType, setStorageType] = useState<'localStorage' | 'sessionStorage'>('localStorage')
  const [entries, setEntries] = useState<StorageEntry[]>([])
  const [selectedKey, setSelectedKey] = useState<string | null>(null)
  const [searchQuery, setSearchQuery] = useState('')
  const [filterType, setFilterType] = useState<string>('all')
  const [editingValue, setEditingValue] = useState('')
  const [isEditing, setIsEditing] = useState(false)
  const [message, setMessage] = useState<{ text: string; type: 'success' | 'error' } | null>(null)

  const refresh = useCallback(() => {
    setEntries(getAllStorage(storageType))
    setSelectedKey(null)
    setIsEditing(false)
  }, [storageType])

  useEffect(() => {
    refresh()
  }, [refresh])

  const stats = useMemo(() => computeStats(entries), [entries])

  const filteredEntries = useMemo(() => {
    return entries.filter(e => {
      const matchesSearch = !searchQuery || e.key.toLowerCase().includes(searchQuery.toLowerCase()) || e.value.toLowerCase().includes(searchQuery.toLowerCase())
      const matchesType = filterType === 'all' || e.type === filterType
      return matchesSearch && matchesType
    })
  }, [entries, searchQuery, filterType])

  const selectedEntry = useMemo(() => entries.find(e => e.key === selectedKey) || null, [entries, selectedKey])

  const showMessage = useCallback((text: string, type: 'success' | 'error') => {
    setMessage({ text, type })
    setTimeout(() => setMessage(null), 2500)
  }, [])

  const handleSelect = useCallback((key: string) => {
    setSelectedKey(key)
    setIsEditing(false)
    const entry = entries.find(e => e.key === key)
    if (entry) {
      setEditingValue(prettyPrint(entry.value, entry.type))
    }
  }, [entries])

  const handleSave = useCallback(() => {
    if (!selectedKey) return
    const storage = storageType === 'localStorage' ? localStorage : sessionStorage
    try {
      storage.setItem(selectedKey, editingValue)
      showMessage('保存成功', 'success')
      refresh()
    } catch (err) {
      showMessage(`保存失败: ${err instanceof Error ? err.message : '未知错误'}`, 'error')
    }
  }, [selectedKey, editingValue, storageType, showMessage, refresh])

  const handleDelete = useCallback((key: string) => {
    const storage = storageType === 'localStorage' ? localStorage : sessionStorage
    try {
      storage.removeItem(key)
      showMessage(`已删除: ${key}`, 'success')
      if (selectedKey === key) setSelectedKey(null)
      refresh()
    } catch (err) {
      showMessage(`删除失败: ${err instanceof Error ? err.message : '未知错误'}`, 'error')
    }
  }, [storageType, selectedKey, showMessage, refresh])

  const handleClearAll = useCallback(() => {
    const storage = storageType === 'localStorage' ? localStorage : sessionStorage
    try {
      storage.clear()
      showMessage('已清空所有存储', 'success')
      setSelectedKey(null)
      refresh()
    } catch (err) {
      showMessage(`清空失败: ${err instanceof Error ? err.message : '未知错误'}`, 'error')
    }
  }, [storageType, showMessage, refresh])

  const handleExport = useCallback(() => {
    const data: Record<string, string> = {}
    for (const e of entries) data[e.key] = e.value
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `${storageType}-export-${new Date().toISOString().slice(0, 10)}.json`
    a.click()
    URL.revokeObjectURL(url)
    showMessage('导出成功', 'success')
  }, [entries, storageType, showMessage])

  const handleImport = useCallback(() => {
    const input = document.createElement('input')
    input.type = 'file'
    input.accept = '.json'
    input.onchange = async (e) => {
      const file = (e.target as HTMLInputElement).files?.[0]
      if (!file) return
      try {
        const text = await file.text()
        const data = JSON.parse(text) as Record<string, string>
        const storage = storageType === 'localStorage' ? localStorage : sessionStorage
        let count = 0
        for (const [k, v] of Object.entries(data)) {
          if (typeof v === 'string') {
            storage.setItem(k, v)
            count++
          }
        }
        showMessage(`已导入 ${count} 条记录`, 'success')
        refresh()
      } catch (err) {
        showMessage(`导入失败: ${err instanceof Error ? err.message : 'JSON格式错误'}`, 'error')
      }
    }
    input.click()
  }, [storageType, showMessage, refresh])

  const handleCopyKey = useCallback(async (key: string) => {
    try {
      await navigator.clipboard.writeText(key)
      showMessage('已复制 key', 'success')
    } catch { /* ignore */ }
  }, [showMessage])

  const typeColors: Record<string, string> = {
    json: '#7c6cf0', string: '#3b82f6', number: '#10b981', boolean: '#f59e0b', other: '#6b7280',
  }

  return (
    <div style={{
      height: '100%', display: 'flex', flexDirection: 'column',
      background: 'var(--bg-primary, #0a0a1a)', color: 'var(--text-primary, #e0e0e8)',
      fontFamily: 'system-ui, -apple-system, sans-serif', fontSize: 13,
    }}>
      {/* 消息提示 */}
      {message && (
        <div style={{
          position: 'absolute', top: 8, right: 8, zIndex: 100,
          padding: '8px 16px', borderRadius: 8, fontSize: 12, fontWeight: 600,
          background: message.type === 'success' ? 'rgba(16,185,129,0.15)' : 'rgba(239,68,68,0.15)',
          color: message.type === 'success' ? '#10b981' : '#ef4444',
          border: `1px solid ${message.type === 'success' ? 'rgba(16,185,129,0.3)' : 'rgba(239,68,68,0.3)'}`,
          backdropFilter: 'blur(8px)',
        }}>
          {message.text}
        </div>
      )}

      {/* 顶栏 */}
      <div style={{
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        padding: '10px 16px', borderBottom: '1px solid rgba(255,255,255,0.08)',
        background: 'rgba(255,255,255,0.02)', flexShrink: 0, flexWrap: 'wrap', gap: 8,
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <span style={{ fontSize: 18 }}>{'\u{1F4BE}'}</span>
          <span style={{ fontWeight: 700, fontSize: 14 }}>存储检查器</span>
          <div style={{ display: 'flex', borderRadius: 6, overflow: 'hidden', border: '1px solid rgba(255,255,255,0.1)' }}>
            {(['localStorage', 'sessionStorage'] as const).map(type => (
              <button
                key={type}
                onClick={() => setStorageType(type)}
                style={{
                  padding: '4px 12px', border: 'none', fontSize: 11, fontWeight: 600, cursor: 'pointer',
                  background: storageType === type ? 'var(--accent, #7c6cf0)' : 'transparent',
                  color: storageType === type ? '#fff' : 'var(--text-secondary, #a0a0c8)',
                  transition: 'all 0.15s',
                }}
              >
                {type === 'localStorage' ? 'Local' : 'Session'}
              </button>
            ))}
          </div>
        </div>
        <div style={{ display: 'flex', gap: 6 }}>
          <button onClick={handleImport} style={toolBtnStyle}>{'\u{1F4E5}'} 导入</button>
          <button onClick={handleExport} style={toolBtnStyle}>{'\u{1F4E4}'} 导出</button>
          <button onClick={handleClearAll} style={{ ...toolBtnStyle, color: '#ef4444', borderColor: 'rgba(239,68,68,0.3)' }}>{'\u{1F5D1}'} 清空</button>
        </div>
      </div>

      {/* 统计条 */}
      <div style={{
        display: 'flex', alignItems: 'center', gap: 20, padding: '8px 16px',
        borderBottom: '1px solid rgba(255,255,255,0.06)', fontSize: 11,
        color: 'var(--text-secondary, #a0a0c8)', flexShrink: 0,
      }}>
        <span>{stats.totalItems} 项</span>
        <span>总大小: {formatBytes(stats.totalSize)}</span>
        <div style={{ flex: 1, maxWidth: 200, height: 4, borderRadius: 2, background: 'rgba(255,255,255,0.08)', overflow: 'hidden' }}>
          <div style={{ height: '100%', width: `${Math.min(100, stats.usedPercent)}%`, borderRadius: 2, background: stats.usedPercent > 80 ? '#ef4444' : stats.usedPercent > 50 ? '#f59e0b' : '#10b981', transition: 'width 0.3s' }} />
        </div>
        <span>{stats.usedPercent}% of 5MB</span>
        {stats.largestKey !== '-' && <span>最大: {stats.largestKey.slice(0, 20)} ({formatBytes(stats.largestSize)})</span>}
      </div>

      {/* 搜索和过滤 */}
      <div style={{
        display: 'flex', alignItems: 'center', gap: 8, padding: '8px 16px',
        borderBottom: '1px solid rgba(255,255,255,0.06)', flexShrink: 0,
      }}>
        <input
          type="text"
          value={searchQuery}
          onChange={e => setSearchQuery(e.target.value)}
          placeholder="搜索 key 或 value..."
          style={{
            flex: 1, padding: '6px 12px', borderRadius: 6,
            border: '1px solid rgba(255,255,255,0.1)', background: 'rgba(255,255,255,0.04)',
            color: 'var(--text-primary, #e0e0e8)', fontSize: 12, outline: 'none',
          }}
        />
        <div style={{ display: 'flex', gap: 4 }}>
          {['all', 'json', 'string', 'number', 'boolean'].map(t => (
            <button
              key={t}
              onClick={() => setFilterType(t)}
              style={{
                padding: '4px 8px', borderRadius: 4, border: 'none', fontSize: 10, fontWeight: 600,
                cursor: 'pointer', textTransform: 'uppercase',
                background: filterType === t ? (typeColors[t] || '#6b7280') + '30' : 'transparent',
                color: filterType === t ? (typeColors[t] || '#6b7280') : 'var(--text-tertiary, #6a6a8a)',
                transition: 'all 0.15s',
              }}
            >
              {t}
            </button>
          ))}
        </div>
        <button onClick={refresh} style={toolBtnStyle}>{'\u{1F504}'}</button>
      </div>

      {/* 主内容区 */}
      <div style={{ flex: 1, display: 'flex', overflow: 'hidden' }}>
        {/* 键列表 */}
        <div style={{
          width: selectedEntry ? 260 : '100%', flexShrink: 0, overflow: 'auto',
          borderRight: selectedEntry ? '1px solid rgba(255,255,255,0.06)' : 'none',
          transition: 'width 0.2s',
        }}>
          {filteredEntries.length === 0 ? (
            <div style={{
              padding: 40, textAlign: 'center', color: 'var(--text-tertiary, #6a6a8a)',
              fontSize: 13,
            }}>
              <div style={{ fontSize: 32, marginBottom: 12 }}>{'\u{1F4C2}'}</div>
              {entries.length === 0 ? '存储为空' : '无匹配结果'}
            </div>
          ) : (
            filteredEntries.map(entry => (
              <div
                key={entry.key}
                onClick={() => handleSelect(entry.key)}
                style={{
                  display: 'flex', alignItems: 'center', gap: 8,
                  padding: '8px 12px', cursor: 'pointer',
                  background: selectedKey === entry.key ? 'rgba(124,108,240,0.12)' : 'transparent',
                  borderLeft: selectedKey === entry.key ? '2px solid var(--accent, #7c6cf0)' : '2px solid transparent',
                  transition: 'all 0.1s',
                  borderBottom: '1px solid rgba(255,255,255,0.03)',
                }}
              >
                <span style={{
                  width: 6, height: 6, borderRadius: '50%', flexShrink: 0,
                  background: typeColors[entry.type],
                }} />
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{
                    fontWeight: 500, fontSize: 12, overflow: 'hidden',
                    textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                    color: 'var(--text-primary, #e0e0e8)',
                  }}>
                    {entry.key}
                  </div>
                  <div style={{
                    fontSize: 10, color: 'var(--text-tertiary, #6a6a8a)',
                    overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                  }}>
                    {entry.type.toUpperCase()} / {formatBytes(entry.size)}
                  </div>
                </div>
                <button
                  onClick={(e) => { e.stopPropagation(); handleDelete(entry.key) }}
                  style={{
                    padding: '2px 4px', border: 'none', background: 'transparent',
                    color: 'var(--text-tertiary, #6a6a8a)', cursor: 'pointer', fontSize: 12,
                    borderRadius: 4, transition: 'color 0.15s',
                  }}
                  onMouseEnter={e => (e.currentTarget.style.color = '#ef4444')}
                  onMouseLeave={e => (e.currentTarget.style.color = 'var(--text-tertiary, #6a6a8a)')}
                  title="删除"
                >
                  {'\u{2715}'}
                </button>
              </div>
            ))
          )}
        </div>

        {/* 详情面板 */}
        {selectedEntry && (
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
            {/* 详情顶栏 */}
            <div style={{
              display: 'flex', alignItems: 'center', justifyContent: 'space-between',
              padding: '8px 14px', borderBottom: '1px solid rgba(255,255,255,0.06)',
              background: 'rgba(255,255,255,0.02)', flexShrink: 0,
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <span style={{ fontWeight: 600, fontSize: 13, maxWidth: 300, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {selectedEntry.key}
                </span>
                <span style={{
                  fontSize: 10, padding: '2px 6px', borderRadius: 4,
                  background: typeColors[selectedEntry.type] + '20',
                  color: typeColors[selectedEntry.type],
                  fontWeight: 600, textTransform: 'uppercase',
                }}>
                  {selectedEntry.type}
                </span>
                <span style={{ fontSize: 10, color: 'var(--text-tertiary, #6a6a8a)' }}>
                  {formatBytes(selectedEntry.size)}
                </span>
              </div>
              <div style={{ display: 'flex', gap: 6 }}>
                <button
                  onClick={() => handleCopyKey(selectedEntry.key)}
                  style={{ ...toolBtnStyle, fontSize: 10, padding: '3px 8px' }}
                >
                  复制 Key
                </button>
                <button
                  onClick={() => {
                    if (isEditing) { handleSave(); setIsEditing(false) }
                    else { setEditingValue(prettyPrint(selectedEntry!.value, selectedEntry!.type)); setIsEditing(true) }
                  }}
                  style={{
                    ...toolBtnStyle, fontSize: 10, padding: '3px 8px',
                    background: isEditing ? 'rgba(16,185,129,0.15)' : undefined,
                    color: isEditing ? '#10b981' : undefined,
                    borderColor: isEditing ? 'rgba(16,185,129,0.3)' : undefined,
                  }}
                >
                  {isEditing ? '保存' : '编辑'}
                </button>
                {isEditing && (
                  <button
                    onClick={() => setIsEditing(false)}
                    style={{ ...toolBtnStyle, fontSize: 10, padding: '3px 8px' }}
                  >
                    取消
                  </button>
                )}
              </div>
            </div>

            {/* 内容区 */}
            <div style={{ flex: 1, overflow: 'auto', padding: 12 }}>
              {isEditing ? (
                <textarea
                  value={editingValue}
                  onChange={e => setEditingValue(e.target.value)}
                  style={{
                    width: '100%', height: '100%', minHeight: 300, padding: 12,
                    borderRadius: 8, border: '1px solid rgba(124,108,240,0.3)',
                    background: 'rgba(0,0,0,0.3)', color: '#e0e0e8',
                    fontFamily: 'monospace', fontSize: 12, lineHeight: 1.6,
                    resize: 'none', outline: 'none', boxSizing: 'border-box',
                  }}
                  spellCheck={false}
                />
              ) : (
                <pre style={{
                  margin: 0, padding: 12, borderRadius: 8,
                  background: 'rgba(0,0,0,0.3)', fontSize: 12, lineHeight: 1.6,
                  fontFamily: 'monospace', whiteSpace: 'pre-wrap', wordBreak: 'break-all',
                  color: 'var(--text-primary, #e0e0e8)', overflow: 'auto', minHeight: 200,
                  maxHeight: '100%',
                }}>
                  {prettyPrint(selectedEntry.value, selectedEntry.type)}
                </pre>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

const toolBtnStyle: React.CSSProperties = {
  padding: '5px 10px', borderRadius: 6,
  border: '1px solid rgba(255,255,255,0.1)',
  background: 'transparent', color: 'var(--text-secondary, #a0a0c8)',
  fontSize: 11, fontWeight: 600, cursor: 'pointer',
  transition: 'all 0.15s', whiteSpace: 'nowrap' as const,
}
