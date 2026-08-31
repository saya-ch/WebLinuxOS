import { useState, useEffect, useCallback, useMemo, useRef } from 'react'
import {
  Clipboard,
  Search,
  Copy,
  Trash2,
  Pin,
  PinOff,
  Clock,
  Link,
  Code,
  Type,
  Braces,
  CheckCircle,
  AlertCircle,
  X,
  Filter,
} from 'lucide-react'

// ===================== 类型定义 =====================

type ContentType = 'url' | 'code' | 'text' | 'json'

interface ClipboardEntry {
  id: string
  content: string
  preview: string
  timestamp: number
  type: ContentType
  pinned: boolean
  copied: boolean
}

interface TypeConfig {
  label: string
  color: string
  bg: string
  icon: React.ReactNode
}

// ===================== 工具函数 =====================

const MAX_HISTORY = 50
const POLL_INTERVAL = 1200
const STORAGE_KEY = 'weblinux-clipboard-history-v2'

function detectContentType(text: string): ContentType {
  const trimmed = text.trim()
  if (/^https?:\/\//i.test(trimmed) || /^www\./i.test(trimmed)) return 'url'
  try {
    JSON.parse(trimmed)
    if (/^[{\[]/.test(trimmed) && /[}\]]$/.test(trimmed)) return 'json'
  } catch {
    /* not json */
  }
  if (
    /[{}()<>[\];]/.test(trimmed) &&
    /\b(const|let|var|function|class|import|export|return|if|for|while|switch|async|await|=>)\b/.test(trimmed)
  ) {
    return 'code'
  }
  return 'text'
}

function getTypeConfig(type: ContentType): TypeConfig {
  switch (type) {
    case 'url':
      return {
        label: '链接',
        color: '#60a5fa',
        bg: 'rgba(96,165,250,0.12)',
        icon: <Link size={12} />,
      }
    case 'code':
      return {
        label: '代码',
        color: '#a78bfa',
        bg: 'rgba(167,139,250,0.12)',
        icon: <Code size={12} />,
      }
    case 'json':
      return {
        label: 'JSON',
        color: '#f59e0b',
        bg: 'rgba(245,158,11,0.12)',
        icon: <Braces size={12} />,
      }
    default:
      return {
        label: '文本',
        color: '#34d399',
        bg: 'rgba(52,211,153,0.12)',
        icon: <Type size={12} />,
      }
  }
}

function formatTime(ts: number): string {
  const diff = Date.now() - ts
  const sec = Math.floor(diff / 1000)
  const min = Math.floor(diff / 60000)
  const hr = Math.floor(diff / 3600000)
  const day = Math.floor(diff / 86400000)
  if (sec < 60) return '刚刚'
  if (min < 60) return `${min} 分钟前`
  if (hr < 24) return `${hr} 小时前`
  if (day < 30) return `${day} 天前`
  return new Date(ts).toLocaleDateString('zh-CN', {
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

function loadHistory(): ClipboardEntry[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    return raw ? JSON.parse(raw) : []
  } catch {
    return []
  }
}

function saveHistory(entries: ClipboardEntry[]) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(entries))
  } catch {
    /* storage full — silent */
  }
}

// ===================== 子组件 =====================

function EmptyState({ hasFilter }: { hasFilter: boolean }) {
  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        height: '100%',
        gap: '16px',
        color: 'var(--text-secondary)',
        padding: '40px 20px',
      }}
    >
      <div
        style={{
          width: '80px',
          height: '80px',
          borderRadius: '50%',
          background: 'var(--accent-subtle, rgba(155,138,240,0.08))',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <Clipboard size={36} style={{ opacity: 0.5 }} />
      </div>
      <p style={{ fontSize: '15px', fontWeight: 500 }}>
        {hasFilter ? '没有匹配的记录' : '暂无剪贴板历史'}
      </p>
      <p style={{ fontSize: '13px', textAlign: 'center', lineHeight: 1.6, maxWidth: '320px' }}>
        {hasFilter
          ? '尝试修改搜索关键词或筛选条件'
          : '复制任意内容后，系统将自动监听并记录到此处。最近 50 条记录会持久保存。'}
      </p>
    </div>
  )
}

function Toast({ text, onDone }: { text: string; onDone: () => void }) {
  useEffect(() => {
    const t = setTimeout(onDone, 1600)
    return () => clearTimeout(t)
  }, [onDone])

  return (
    <div
      style={{
        position: 'fixed',
        bottom: '24px',
        left: '50%',
        transform: 'translateX(-50%)',
        background: 'var(--window-bg, rgba(14,14,24,0.95))',
        border: '1px solid var(--window-border)',
        borderRadius: '10px',
        padding: '10px 20px',
        fontSize: '13px',
        color: 'var(--text-primary)',
        display: 'flex',
        alignItems: 'center',
        gap: '8px',
        boxShadow: '0 8px 32px rgba(0,0,0,0.35)',
        zIndex: 9999,
        animation: 'fadeSlideUp 0.25s ease-out',
        pointerEvents: 'none',
      }}
    >
      <CheckCircle size={16} style={{ color: '#34d399', flexShrink: 0 }} />
      {text}
    </div>
  )
}

// ===================== 主组件 =====================

type FilterType = 'all' | 'pinned' | ContentType

export default function ClipboardHistory() {
  const [entries, setEntries] = useState<ClipboardEntry[]>(loadHistory)
  const [searchQuery, setSearchQuery] = useState('')
  const [filterType, setFilterType] = useState<FilterType>('all')
  const [showClearConfirm, setShowClearConfirm] = useState(false)
  const [toastMsg, setToastMsg] = useState<string | null>(null)
  const lastClipRef = useRef<string>('')
  const mountedRef = useRef(true)

  // ---- 持久化 ----
  useEffect(() => {
    saveHistory(entries)
  }, [entries])

  // ---- 剪贴板轮询 ----
  useEffect(() => {
    mountedRef.current = true
    // 初始化 lastClipRef，避免重复检测已有记录
    if (entries.length > 0) {
      lastClipRef.current = entries[0].content
    }

    const poll = setInterval(async () => {
      if (!mountedRef.current) return
      try {
        const text = await navigator.clipboard.readText()
        if (!text || !text.trim()) return
        if (text === lastClipRef.current) return
        lastClipRef.current = text

        setEntries((prev) => {
          // 去重：如果内容已存在则移到最前
          const existing = prev.find((e) => e.content === text)
          if (existing) {
            return [
              { ...existing, timestamp: Date.now() },
              ...prev.filter((e) => e.id !== existing.id),
            ].slice(0, MAX_HISTORY)
          }
          const entry: ClipboardEntry = {
            id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
            content: text,
            preview: text.length > 200 ? text.slice(0, 200) + '…' : text,
            timestamp: Date.now(),
            type: detectContentType(text),
            pinned: false,
            copied: false,
          }
          return [entry, ...prev].slice(0, MAX_HISTORY)
        })
      } catch {
        /* permission denied — silent */
      }
    }, POLL_INTERVAL)

    return () => {
      mountedRef.current = false
      clearInterval(poll)
    }
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  // ---- 操作 ----
  const copyEntry = useCallback(
    async (entry: ClipboardEntry) => {
      try {
        await navigator.clipboard.writeText(entry.content)
        lastClipRef.current = entry.content
        setEntries((prev) =>
          prev.map((e) => (e.id === entry.id ? { ...e, copied: true } : e))
        )
        setTimeout(() => {
          setEntries((prev) =>
            prev.map((e) => (e.id === entry.id ? { ...e, copied: false } : e))
          )
        }, 1200)
        setToastMsg('已复制到剪贴板')
      } catch {
        setToastMsg('复制失败，请检查权限')
      }
    },
    []
  )

  const togglePin = useCallback((id: string) => {
    setEntries((prev) =>
      prev.map((e) => (e.id === id ? { ...e, pinned: !e.pinned } : e))
    )
  }, [])

  const deleteEntry = useCallback((id: string) => {
    setEntries((prev) => prev.filter((e) => e.id !== id))
  }, [])

  const clearAll = useCallback(() => {
    setEntries((prev) => prev.filter((e) => e.pinned))
    setShowClearConfirm(false)
    setToastMsg('已清空（已固定的条目保留）')
  }, [])

  // ---- 过滤 & 排序 ----
  const filteredEntries = useMemo(() => {
    let result = entries

    if (filterType === 'pinned') {
      result = result.filter((e) => e.pinned)
    } else if (filterType !== 'all') {
      result = result.filter((e) => e.type === filterType)
    }

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase()
      result = result.filter(
        (e) =>
          e.content.toLowerCase().includes(q) ||
          e.type.toLowerCase().includes(q)
      )
    }

    // pinned 优先，然后按时间降序
    return [...result].sort((a, b) => {
      if (a.pinned && !b.pinned) return -1
      if (!a.pinned && b.pinned) return 1
      return b.timestamp - a.timestamp
    })
  }, [entries, filterType, searchQuery])

  const stats = useMemo(() => {
    const total = entries.length
    const pinned = entries.filter((e) => e.pinned).length
    return { total, pinned }
  }, [entries])

  const hasActiveFilter = filterType !== 'all' || searchQuery.trim() !== ''

  // ---- 渲染 ----
  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        height: '100%',
        background: 'var(--window-bg)',
        color: 'var(--text-primary)',
        position: 'relative',
        overflow: 'hidden',
      }}
    >
      {/* 顶部工具栏 */}
      <div
        style={{
          padding: '14px 16px',
          borderBottom: '1px solid var(--window-border)',
          display: 'flex',
          flexDirection: 'column',
          gap: '10px',
          background: 'var(--window-bg)',
        }}
      >
        {/* 第一行：搜索 + 操作按钮 */}
        <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
          <div style={{ position: 'relative', flex: 1, minWidth: 0 }}>
            <Search
              size={15}
              style={{
                position: 'absolute',
                left: '10px',
                top: '50%',
                transform: 'translateY(-50%)',
                color: 'var(--text-secondary)',
                pointerEvents: 'none',
              }}
            />
            <input
              type="text"
              placeholder="搜索剪贴板内容…"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              style={{
                width: '100%',
                padding: '7px 32px 7px 32px',
                background: 'var(--accent-subtle, rgba(155,138,240,0.06))',
                border: '1px solid var(--window-border)',
                borderRadius: '8px',
                color: 'var(--text-primary)',
                fontSize: '13px',
                outline: 'none',
                boxSizing: 'border-box',
                transition: 'border-color 0.2s',
              }}
              onFocus={(e) => {
                e.currentTarget.style.borderColor = 'var(--accent, #9b8af0)'
              }}
              onBlur={(e) => {
                e.currentTarget.style.borderColor = 'var(--window-border)'
              }}
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                style={{
                  position: 'absolute',
                  right: '6px',
                  top: '50%',
                  transform: 'translateY(-50%)',
                  background: 'none',
                  border: 'none',
                  cursor: 'pointer',
                  color: 'var(--text-secondary)',
                  padding: '2px',
                  display: 'flex',
                }}
              >
                <X size={14} />
              </button>
            )}
          </div>

          {entries.length > 0 && (
            <button
              onClick={() => setShowClearConfirm(true)}
              title="清空历史（固定的条目将保留）"
              style={{
                padding: '7px 12px',
                background: 'rgba(239,68,68,0.08)',
                color: '#ef4444',
                border: '1px solid rgba(239,68,68,0.2)',
                borderRadius: '8px',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '5px',
                fontSize: '12px',
                fontWeight: 500,
                whiteSpace: 'nowrap',
                transition: 'all 0.15s',
                flexShrink: 0,
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = 'rgba(239,68,68,0.16)'
                e.currentTarget.style.borderColor = 'rgba(239,68,68,0.4)'
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = 'rgba(239,68,68,0.08)'
                e.currentTarget.style.borderColor = 'rgba(239,68,68,0.2)'
              }}
            >
              <Trash2 size={14} />
              清空
            </button>
          )}
        </div>

        {/* 第二行：筛选标签 + 统计 */}
        <div style={{ display: 'flex', gap: '6px', alignItems: 'center', flexWrap: 'wrap' }}>
          <Filter size={13} style={{ color: 'var(--text-secondary)', flexShrink: 0 }} />
          {(
            [
              { key: 'all' as FilterType, label: '全部' },
              { key: 'pinned' as FilterType, label: '固定' },
              { key: 'text' as FilterType, label: '文本' },
              { key: 'url' as FilterType, label: '链接' },
              { key: 'code' as FilterType, label: '代码' },
              { key: 'json' as FilterType, label: 'JSON' },
            ] as const
          ).map(({ key, label }) => {
            const active = filterType === key
            return (
              <button
                key={key}
                onClick={() => setFilterType(key)}
                style={{
                  padding: '3px 10px',
                  background: active ? 'var(--accent, #9b8af0)' : 'transparent',
                  color: active ? '#fff' : 'var(--text-secondary)',
                  border: active
                    ? '1px solid var(--accent, #9b8af0)'
                    : '1px solid var(--window-border)',
                  borderRadius: '12px',
                  cursor: 'pointer',
                  fontSize: '11px',
                  fontWeight: active ? 600 : 400,
                  transition: 'all 0.15s',
                  whiteSpace: 'nowrap',
                }}
              >
                {label}
              </button>
            )
          })}

          <span
            style={{
              marginLeft: 'auto',
              fontSize: '11px',
              color: 'var(--text-secondary)',
              whiteSpace: 'nowrap',
            }}
          >
            {stats.total} 条
            {stats.pinned > 0 && ` · ${stats.pinned} 固定`}
          </span>
        </div>
      </div>

      {/* 列表区域 */}
      <div style={{ flex: 1, overflow: 'auto', padding: '8px' }}>
        {filteredEntries.length === 0 ? (
          <EmptyState hasFilter={hasActiveFilter} />
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
            {filteredEntries.map((entry) => {
              const tc = getTypeConfig(entry.type)
              return (
                <div
                  key={entry.id}
                  style={{
                    padding: '10px 12px',
                    background: entry.pinned
                      ? 'var(--accent-subtle, rgba(155,138,240,0.06))'
                      : 'var(--glass-bg, rgba(255,255,255,0.03))',
                    border: entry.pinned
                      ? '1px solid var(--accent, #9b8af0)'
                      : '1px solid transparent',
                    borderRadius: '10px',
                    transition: 'all 0.2s',
                    cursor: 'default',
                  }}
                  onMouseEnter={(e) => {
                    if (!entry.pinned) {
                      e.currentTarget.style.background =
                        'var(--accent-subtle, rgba(155,138,240,0.06))'
                      e.currentTarget.style.borderColor = 'var(--window-border)'
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (!entry.pinned) {
                      e.currentTarget.style.background =
                        'var(--glass-bg, rgba(255,255,255,0.03))'
                      e.currentTarget.style.borderColor = 'transparent'
                    }
                  }}
                >
                  {/* 头部行 */}
                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      marginBottom: '6px',
                    }}
                  >
                    <div
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '8px',
                        minWidth: 0,
                        flex: 1,
                      }}
                    >
                      {/* 类型标签 */}
                      <span
                        style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '3px',
                          padding: '2px 7px',
                          borderRadius: '6px',
                          background: tc.bg,
                          color: tc.color,
                          fontSize: '10px',
                          fontWeight: 600,
                          letterSpacing: '0.3px',
                          flexShrink: 0,
                          textTransform: 'uppercase',
                        }}
                      >
                        {tc.icon}
                        {tc.label}
                      </span>
                      {/* 时间 */}
                      <span
                        style={{
                          fontSize: '11px',
                          color: 'var(--text-secondary)',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '3px',
                          flexShrink: 0,
                        }}
                      >
                        <Clock size={11} />
                        {formatTime(entry.timestamp)}
                      </span>
                      {/* 固定标记 */}
                      {entry.pinned && (
                        <Pin
                          size={11}
                          style={{
                            color: 'var(--accent, #9b8af0)',
                            flexShrink: 0,
                          }}
                        />
                      )}
                    </div>

                    {/* 操作按钮 */}
                    <div
                      style={{
                        display: 'flex',
                        gap: '2px',
                        flexShrink: 0,
                        opacity: 0.4,
                        transition: 'opacity 0.2s',
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.opacity = '1'
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.opacity = '0.4'
                      }}
                    >
                      <button
                        onClick={() => copyEntry(entry)}
                        title="复制"
                        style={{
                          padding: '4px',
                          background: 'none',
                          border: 'none',
                          cursor: 'pointer',
                          color: entry.copied ? '#34d399' : 'var(--text-secondary)',
                          display: 'flex',
                          borderRadius: '4px',
                          transition: 'all 0.15s',
                        }}
                      >
                        {entry.copied ? <CheckCircle size={14} /> : <Copy size={14} />}
                      </button>
                      <button
                        onClick={() => togglePin(entry.id)}
                        title={entry.pinned ? '取消固定' : '固定'}
                        style={{
                          padding: '4px',
                          background: 'none',
                          border: 'none',
                          cursor: 'pointer',
                          color: entry.pinned
                            ? 'var(--accent, #9b8af0)'
                            : 'var(--text-secondary)',
                          display: 'flex',
                          borderRadius: '4px',
                          transition: 'all 0.15s',
                        }}
                      >
                        {entry.pinned ? <PinOff size={14} /> : <Pin size={14} />}
                      </button>
                      <button
                        onClick={() => deleteEntry(entry.id)}
                        title="删除"
                        style={{
                          padding: '4px',
                          background: 'none',
                          border: 'none',
                          cursor: 'pointer',
                          color: 'var(--text-secondary)',
                          display: 'flex',
                          borderRadius: '4px',
                          transition: 'all 0.15s',
                        }}
                        onMouseEnter={(e) => {
                          e.currentTarget.style.color = '#ef4444'
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.color = 'var(--text-secondary)'
                        }}
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </div>

                  {/* 内容预览 */}
                  <div
                    style={{
                      fontSize: '12.5px',
                      color: 'var(--text-primary)',
                      lineHeight: 1.6,
                      whiteSpace: 'pre-wrap',
                      wordBreak: 'break-all',
                      maxHeight: '72px',
                      overflow: 'hidden',
                      fontFamily:
                        entry.type === 'code' || entry.type === 'json'
                          ? 'var(--font-mono, monospace)'
                          : 'inherit',
                      opacity: 0.9,
                      // 渐变截断
                      maskImage:
                        'linear-gradient(to bottom, black 60%, transparent)',
                      WebkitMaskImage:
                        'linear-gradient(to bottom, black 60%, transparent)',
                    }}
                  >
                    {entry.preview}
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>

      {/* 清空确认弹窗 */}
      {showClearConfirm && (
        <div
          style={{
            position: 'absolute',
            inset: 0,
            background: 'rgba(0,0,0,0.5)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 100,
            backdropFilter: 'blur(4px)',
          }}
          onClick={() => setShowClearConfirm(false)}
        >
          <div
            style={{
              background: 'var(--window-bg)',
              border: '1px solid var(--window-border)',
              borderRadius: '14px',
              padding: '24px',
              maxWidth: '320px',
              width: '90%',
              boxShadow: 'var(--shadow-medium, 0 10px 48px rgba(0,0,0,0.32))',
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '10px',
                marginBottom: '12px',
              }}
            >
              <div
                style={{
                  width: '36px',
                  height: '36px',
                  borderRadius: '10px',
                  background: 'rgba(239,68,68,0.1)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <AlertCircle size={20} style={{ color: '#ef4444' }} />
              </div>
              <span style={{ fontSize: '15px', fontWeight: 600 }}>
                确认清空
              </span>
            </div>
            <p
              style={{
                fontSize: '13px',
                color: 'var(--text-secondary)',
                lineHeight: 1.6,
                margin: '0 0 18px',
              }}
            >
              将删除所有未固定的剪贴板记录。已固定的条目将保留。
            </p>
            <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
              <button
                onClick={() => setShowClearConfirm(false)}
                style={{
                  padding: '7px 16px',
                  background: 'transparent',
                  border: '1px solid var(--window-border)',
                  borderRadius: '8px',
                  color: 'var(--text-primary)',
                  cursor: 'pointer',
                  fontSize: '13px',
                }}
              >
                取消
              </button>
              <button
                onClick={clearAll}
                style={{
                  padding: '7px 16px',
                  background: '#ef4444',
                  border: 'none',
                  borderRadius: '8px',
                  color: '#fff',
                  cursor: 'pointer',
                  fontSize: '13px',
                  fontWeight: 500,
                }}
              >
                确认清空
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Toast 提示 */}
      {toastMsg && <Toast text={toastMsg} onDone={() => setToastMsg(null)} />}
    </div>
  )
}
