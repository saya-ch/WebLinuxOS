import { useState, useEffect, useCallback, useMemo } from 'react'
import {
  Cookie,
  RefreshCw,
  Download,
  Trash2,
  Plus,
  Search,
  X,
  Check,
  Calendar,
  HardDrive,
  Pencil,
  Eye,
  EyeOff,
  Info,
  Shield,
  Copy,
} from 'lucide-react'

interface CookieItem {
  name: string
  value: string
  domain: string
  path: string
  expires: number | null
  size: number
  httpOnly: boolean
  secure: boolean
  sameSite: string
}

interface NewCookieForm {
  name: string
  value: string
  days: string
  path: string
}

const parseCookies = (): CookieItem[] => {
  try {
    const raw = document.cookie
    if (!raw) return []

    return raw.split(';').map((pair) => {
      const idx = pair.indexOf('=')
      const name = idx >= 0 ? pair.slice(0, idx).trim() : pair.trim()
      const value = idx >= 0 ? pair.slice(idx + 1).trim() : ''
      const size = new Blob([name + '=' + value]).size

      return {
        name,
        value,
        domain: window.location.hostname,
        path: '/',
        expires: null,
        size,
        httpOnly: false,
        secure: window.location.protocol === 'https:',
        sameSite: 'Lax',
      }
    })
  } catch {
    return []
  }
}

const formatBytes = (bytes: number): string => {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(2)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(2)} MB`
}

const maskValue = (value: string): string => {
  if (!value) return '(空)'
  if (value.length <= 4) return '••••'
  if (value.length <= 12) return value.slice(0, 2) + '••••' + value.slice(-2)
  return value.slice(0, 4) + '••••••••' + value.slice(-4)
}

export default function CookieManager() {
  const [cookies, setCookies] = useState<CookieItem[]>([])
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedName, setSelectedName] = useState<string | null>(null)
  const [editingName, setEditingName] = useState<string | null>(null)
  const [editValue, setEditValue] = useState('')
  const [visibleValues, setVisibleValues] = useState<Set<string>>(new Set())
  const [showAddModal, setShowAddModal] = useState(false)
  const [newCookie, setNewCookie] = useState<NewCookieForm>({
    name: '',
    value: '',
    days: '30',
    path: '/',
  })
  const [toast, setToast] = useState<string | null>(null)

  const showToast = useCallback((message: string) => {
    setToast(message)
    setTimeout(() => setToast(null), 2000)
  }, [])

  const refreshCookies = useCallback(() => {
    setCookies(parseCookies())
    setSelectedName(null)
    setEditingName(null)
  }, [])

  useEffect(() => {
    refreshCookies()
  }, [refreshCookies])

  const filteredCookies = useMemo(() => {
    if (!searchQuery.trim()) return cookies
    const query = searchQuery.toLowerCase()
    return cookies.filter(
      (c) =>
        c.name.toLowerCase().includes(query) ||
        c.value.toLowerCase().includes(query)
    )
  }, [cookies, searchQuery])

  const stats = useMemo(() => {
    const total = cookies.length
    const totalSize = cookies.reduce((acc, c) => acc + c.size, 0)
    return { total, totalSize }
  }, [cookies])

  const handleAddCookie = useCallback(() => {
    const { name, value, days, path } = newCookie
    if (!name.trim()) {
      showToast('Cookie 名称不能为空')
      return
    }
    if (/\s/.test(name)) {
      showToast('Cookie 名称不能包含空格')
      return
    }

    let expiresStr = ''
    if (days.trim() !== '') {
      const daysNum = parseFloat(days)
      if (!isNaN(daysNum) && daysNum > 0) {
        const expiresDate = new Date()
        expiresDate.setTime(expiresDate.getTime() + daysNum * 24 * 60 * 60 * 1000)
        expiresStr = `; expires=${expiresDate.toUTCString()}`
      }
    }

    const pathStr = path.trim() || '/'
    document.cookie = `${encodeURIComponent(name)}=${encodeURIComponent(value)}${expiresStr}; path=${pathStr}`

    setNewCookie({ name: '', value: '', days: '30', path: '/' })
    setShowAddModal(false)
    refreshCookies()
    showToast('Cookie 添加成功')
  }, [newCookie, refreshCookies, showToast])

  const handleDeleteCookie = useCallback(
    (name: string, path: string = '/') => {
      document.cookie = `${encodeURIComponent(name)}=; expires=Thu, 01 Jan 1970 00:00:00 GMT; path=${path}`
      if (selectedName === name) setSelectedName(null)
      if (editingName === name) setEditingName(null)
      refreshCookies()
      showToast('Cookie 已删除')
    },
    [selectedName, editingName, refreshCookies, showToast]
  )

  const handleUpdateCookie = useCallback(() => {
    if (!editingName) return
    if (/\s/.test(editingName)) {
      showToast('Cookie 名称不能包含空格')
      return
    }
    const cookie = cookies.find((c) => c.name === editingName)
    if (!cookie) return

    const daysMatch = cookie.expires
    let expiresStr = ''
    if (daysMatch) {
      const d = new Date(daysMatch)
      expiresStr = `; expires=${d.toUTCString()}`
    }

    document.cookie = `${encodeURIComponent(editingName)}=${encodeURIComponent(editValue)}${expiresStr}; path=${cookie.path}`
    setEditingName(null)
    setEditValue('')
    refreshCookies()
    showToast('Cookie 已更新')
  }, [editingName, editValue, cookies, refreshCookies, showToast])

  const handleExportCookies = useCallback(() => {
    const exportData = cookies.map((c) => ({
      name: c.name,
      value: c.value,
      domain: c.domain,
      path: c.path,
      expires: c.expires ? new Date(c.expires).toISOString() : null,
      httpOnly: c.httpOnly,
      secure: c.secure,
      sameSite: c.sameSite,
      size: c.size,
    }))
    const json = JSON.stringify(exportData, null, 2)
    const blob = new Blob([json], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `cookies-${new Date().toISOString().slice(0, 10)}.json`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
    showToast('Cookie 已导出')
  }, [cookies, showToast])

  const handleClearAll = useCallback(() => {
    if (cookies.length === 0) {
      showToast('没有可清空的 Cookie')
      return
    }
    if (!confirm(`确定要清空全部 ${cookies.length} 个 Cookie 吗？此操作不可恢复。`)) return
    cookies.forEach((c) => {
      document.cookie = `${encodeURIComponent(c.name)}=; expires=Thu, 01 Jan 1970 00:00:00 GMT; path=${c.path}`
    })
    refreshCookies()
    showToast('已清空所有 Cookie')
  }, [cookies, refreshCookies, showToast])

  const toggleVisibility = useCallback((name: string) => {
    setVisibleValues((prev) => {
      const next = new Set(prev)
      if (next.has(name)) next.delete(name)
      else next.add(name)
      return next
    })
  }, [])

  const copyToClipboard = useCallback(
    async (text: string) => {
      try {
        await navigator.clipboard.writeText(text)
        showToast('已复制到剪贴板')
      } catch {
        showToast('复制失败')
      }
    },
    [showToast]
  )

  const startEditing = useCallback(
    (cookie: CookieItem) => {
      setEditingName(cookie.name)
      setEditValue(cookie.value)
      setSelectedName(cookie.name)
    },
    []
  )

  const commonBtnStyle: React.CSSProperties = {
    padding: '8px 14px',
    borderRadius: '8px',
    border: '1px solid var(--border-color, #444)',
    background: 'var(--bg-secondary, #2a2a2a)',
    color: 'var(--text-color, #e0e0e0)',
    cursor: 'pointer',
    fontSize: '13px',
    display: 'flex',
    alignItems: 'center',
    gap: '6px',
    transition: 'all 0.2s',
  }

  const primaryBtnStyle: React.CSSProperties = {
    ...commonBtnStyle,
    background: '#4c6ef5',
    borderColor: '#4c6ef5',
    color: '#fff',
  }

  const dangerBtnStyle: React.CSSProperties = {
    ...commonBtnStyle,
    color: '#ef4444',
    borderColor: 'rgba(239, 68, 68, 0.4)',
  }

  return (
    <div
      className="app-container app-cookie-manager"
      style={{
        padding: 0,
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        color: 'var(--text-color, #e0e0e0)',
        background: 'var(--bg-primary, #1a1a1a)',
      }}
    >
      {/* 顶部工具栏 */}
      <div
        style={{
          padding: '16px',
          borderBottom: '1px solid var(--border-color, #333)',
          background: 'var(--bg-secondary, #252525)',
          display: 'flex',
          flexDirection: 'column',
          gap: '12px',
        }}
      >
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            flexWrap: 'wrap',
            gap: '8px',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Cookie size={20} style={{ color: '#f59e0b' }} />
            <span style={{ fontSize: '16px', fontWeight: 600 }}>Cookie 管理器</span>
          </div>
          <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
            <button
              onClick={refreshCookies}
              style={commonBtnStyle}
              title="刷新"
            >
              <RefreshCw size={14} /> 刷新
            </button>
            <button
              onClick={handleExportCookies}
              style={commonBtnStyle}
              disabled={cookies.length === 0}
              title="导出 JSON"
            >
              <Download size={14} /> 导出
            </button>
            <button
              onClick={handleClearAll}
              style={dangerBtnStyle}
              disabled={cookies.length === 0}
              title="清空所有"
            >
              <Trash2 size={14} /> 清空
            </button>
            <button
              onClick={() => setShowAddModal(true)}
              style={primaryBtnStyle}
              title="新建 Cookie"
            >
              <Plus size={14} /> 新建
            </button>
          </div>
        </div>

        {/* 统计面板 */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
            gap: '10px',
          }}
        >
          <div
            style={{
              padding: '12px 14px',
              background: 'var(--bg-card, #1e1e1e)',
              borderRadius: '10px',
              border: '1px solid var(--border-color, #333)',
              display: 'flex',
              alignItems: 'center',
              gap: '10px',
            }}
          >
            <div
              style={{
                width: '36px',
                height: '36px',
                borderRadius: '8px',
                background: 'rgba(76, 110, 245, 0.15)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0,
              }}
            >
              <Cookie size={18} style={{ color: '#4c6ef5' }} />
            </div>
            <div>
              <div style={{ fontSize: '12px', color: 'var(--text-secondary, #888)' }}>
                Cookie 总数
              </div>
              <div style={{ fontSize: '20px', fontWeight: 700, lineHeight: 1.2 }}>
                {stats.total}
              </div>
            </div>
          </div>

          <div
            style={{
              padding: '12px 14px',
              background: 'var(--bg-card, #1e1e1e)',
              borderRadius: '10px',
              border: '1px solid var(--border-color, #333)',
              display: 'flex',
              alignItems: 'center',
              gap: '10px',
            }}
          >
            <div
              style={{
                width: '36px',
                height: '36px',
                borderRadius: '8px',
                background: 'rgba(245, 158, 11, 0.15)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0,
              }}
            >
              <HardDrive size={18} style={{ color: '#f59e0b' }} />
            </div>
            <div>
              <div style={{ fontSize: '12px', color: 'var(--text-secondary, #888)' }}>
                总大小
              </div>
              <div style={{ fontSize: '20px', fontWeight: 700, lineHeight: 1.2 }}>
                {formatBytes(stats.totalSize)}
              </div>
            </div>
          </div>
        </div>

        {/* 安全提示 */}
        <div
          style={{
            padding: '10px 12px',
            background: 'rgba(245, 158, 11, 0.1)',
            border: '1px solid rgba(245, 158, 11, 0.3)',
            borderRadius: '8px',
            display: 'flex',
            alignItems: 'flex-start',
            gap: '8px',
            fontSize: '12px',
            color: '#fbbf24',
          }}
        >
          <Shield size={16} style={{ flexShrink: 0, marginTop: 1 }} />
          <div>
            由于浏览器安全限制，<strong>document.cookie</strong> 只能读取和修改非 <strong>HttpOnly</strong> 的 Cookie。
            HttpOnly Cookie 由服务端设置，无法通过客户端 JavaScript 访问。
          </div>
        </div>

        {/* 搜索框 */}
        <div style={{ position: 'relative' }}>
          <Search
            size={16}
            style={{
              position: 'absolute',
              left: '12px',
              top: '50%',
              transform: 'translateY(-50%)',
              opacity: 0.5,
            }}
          />
          <input
            type="text"
            placeholder="按名称或值搜索 Cookie..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            style={{
              width: '100%',
              padding: '9px 12px 9px 36px',
              border: '1px solid var(--border-color, #444)',
              borderRadius: '8px',
              background: 'var(--bg-input, #1e1e1e)',
              color: 'var(--text-color, #e0e0e0)',
              fontSize: '13px',
              boxSizing: 'border-box',
              outline: 'none',
            }}
          />
        </div>
      </div>

      {/* Cookie 列表 */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '12px' }}>
        {filteredCookies.length === 0 ? (
          <div
            style={{
              textAlign: 'center',
              padding: '60px 20px',
              color: 'var(--text-secondary, #888)',
            }}
          >
            <div style={{ fontSize: '48px', marginBottom: '12px' }}>🍪</div>
            <div style={{ fontSize: '14px' }}>
              {searchQuery ? '没有找到匹配的 Cookie' : '当前页面没有 Cookie'}
            </div>
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                style={{
                  marginTop: '12px',
                  padding: '6px 12px',
                  fontSize: '12px',
                  borderRadius: '6px',
                  border: '1px solid var(--border-color, #444)',
                  background: 'transparent',
                  color: 'var(--text-secondary, #888)',
                  cursor: 'pointer',
                }}
              >
                清除搜索
              </button>
            )}
          </div>
        ) : (
          filteredCookies.map((cookie) => {
            const isExpanded = selectedName === cookie.name
            const isEditing = editingName === cookie.name
            const isVisible = visibleValues.has(cookie.name)

            return (
              <div
                key={cookie.name}
                onClick={() =>
                  setSelectedName(isExpanded ? null : cookie.name)
                }
                style={{
                  padding: '14px',
                  marginBottom: '8px',
                  borderRadius: '10px',
                  background: isExpanded
                    ? 'var(--accent-bg, rgba(76, 110, 245, 0.1))'
                    : 'var(--bg-secondary, #252525)',
                  border: isExpanded
                    ? '1px solid var(--accent, #4c6ef5)'
                    : '1px solid var(--border-color, #333)',
                  cursor: 'pointer',
                  transition: 'all 0.2s',
                }}
              >
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    marginBottom: '8px',
                    gap: '8px',
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
                    <div
                      style={{
                        fontWeight: 600,
                        fontSize: '14px',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        whiteSpace: 'nowrap',
                      }}
                    >
                      {cookie.name}
                    </div>
                    {cookie.secure && (
                      <span
                        style={{
                          fontSize: '10px',
                          padding: '2px 6px',
                          borderRadius: '4px',
                          background: 'rgba(16, 185, 129, 0.15)',
                          color: '#10b981',
                          flexShrink: 0,
                        }}
                      >
                        Secure
                      </span>
                    )}
                    <span
                      style={{
                        fontSize: '10px',
                        padding: '2px 6px',
                        borderRadius: '4px',
                        background: 'rgba(107, 114, 128, 0.2)',
                        color: '#9ca3af',
                        flexShrink: 0,
                      }}
                    >
                      {formatBytes(cookie.size)}
                    </span>
                  </div>

                  <div
                    style={{
                      display: 'flex',
                      gap: '2px',
                      flexShrink: 0,
                    }}
                  >
                    <button
                      onClick={(e) => {
                        e.stopPropagation()
                        toggleVisibility(cookie.name)
                      }}
                      title={isVisible ? '隐藏值' : '显示值'}
                      style={{
                        background: 'none',
                        border: 'none',
                        cursor: 'pointer',
                        padding: '4px',
                        color: 'var(--text-secondary, #888)',
                      }}
                    >
                      {isVisible ? <EyeOff size={14} /> : <Eye size={14} />}
                    </button>
                    <button
                      onClick={(e) => {
                        e.stopPropagation()
                        copyToClipboard(cookie.value)
                      }}
                      title="复制值"
                      style={{
                        background: 'none',
                        border: 'none',
                        cursor: 'pointer',
                        padding: '4px',
                        color: 'var(--text-secondary, #888)',
                      }}
                    >
                      <Copy size={14} />
                    </button>
                    <button
                      onClick={(e) => {
                        e.stopPropagation()
                        startEditing(cookie)
                      }}
                      title="编辑"
                      style={{
                        background: 'none',
                        border: 'none',
                        cursor: 'pointer',
                        padding: '4px',
                        color: '#4c6ef5',
                      }}
                    >
                      <Pencil size={14} />
                    </button>
                    <button
                      onClick={(e) => {
                        e.stopPropagation()
                        handleDeleteCookie(cookie.name, cookie.path)
                      }}
                      title="删除"
                      style={{
                        background: 'none',
                        border: 'none',
                        cursor: 'pointer',
                        padding: '4px',
                        color: '#ef4444',
                      }}
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                </div>

                <div
                  style={{
                    fontSize: '13px',
                    fontFamily: 'monospace',
                    color: 'var(--text-secondary, #aaa)',
                    marginBottom: '8px',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    whiteSpace: 'nowrap',
                  }}
                >
                  {isVisible ? cookie.value || '(空)' : maskValue(cookie.value)}
                </div>

                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '14px',
                    fontSize: '11px',
                    color: 'var(--text-secondary, #888)',
                    flexWrap: 'wrap',
                  }}
                >
                  <span
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '4px',
                    }}
                  >
                    <Calendar size={12} />
                    会话
                  </span>
                  <span
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '4px',
                    }}
                  >
                    <Info size={12} />
                    路径: {cookie.path}
                  </span>
                </div>

                {/* 展开详情 */}
                {isExpanded && !isEditing && (
                  <div
                    onClick={(e) => e.stopPropagation()}
                    style={{
                      marginTop: '12px',
                      padding: '12px',
                      background: 'var(--bg-input, #1e1e1e)',
                      borderRadius: '8px',
                      fontSize: '12px',
                      lineHeight: 1.8,
                    }}
                  >
                    <div
                      style={{
                        display: 'grid',
                        gridTemplateColumns: '100px 1fr',
                        gap: '4px 12px',
                      }}
                    >
                      <span style={{ color: 'var(--text-secondary, #888)' }}>
                        名称
                      </span>
                      <span
                        style={{
                          fontFamily: 'monospace',
                          wordBreak: 'break-all',
                        }}
                      >
                        {cookie.name}
                      </span>
                      <span style={{ color: 'var(--text-secondary, #888)' }}>
                        值
                      </span>
                      <span
                        style={{
                          fontFamily: 'monospace',
                          wordBreak: 'break-all',
                          color: 'var(--text-color, #e0e0e0)',
                        }}
                      >
                        {cookie.value || '(空)'}
                      </span>
                      <span style={{ color: 'var(--text-secondary, #888)' }}>
                        域名
                      </span>
                      <span style={{ fontFamily: 'monospace' }}>
                        {cookie.domain}
                      </span>
                      <span style={{ color: 'var(--text-secondary, #888)' }}>
                        路径
                      </span>
                      <span style={{ fontFamily: 'monospace' }}>
                        {cookie.path}
                      </span>
                      <span style={{ color: 'var(--text-secondary, #888)' }}>
                        大小
                      </span>
                      <span>{formatBytes(cookie.size)}</span>
                      <span style={{ color: 'var(--text-secondary, #888)' }}>
                        Secure
                      </span>
                      <span>{cookie.secure ? '是' : '否'}</span>
                      <span style={{ color: 'var(--text-secondary, #888)' }}>
                        HttpOnly
                      </span>
                      <span
                        style={{
                          color: cookie.httpOnly ? '#ef4444' : '#10b981',
                        }}
                      >
                        {cookie.httpOnly ? '是（不可操作）' : '否'}
                      </span>
                    </div>

                    <div
                      style={{
                        display: 'flex',
                        gap: '8px',
                        marginTop: '12px',
                      }}
                    >
                      <button
                        onClick={() => startEditing(cookie)}
                        style={primaryBtnStyle}
                      >
                        <Pencil size={14} /> 编辑值
                      </button>
                      <button
                        onClick={() => handleDeleteCookie(cookie.name, cookie.path)}
                        style={dangerBtnStyle}
                      >
                        <Trash2 size={14} /> 删除
                      </button>
                      <button
                        onClick={() => copyToClipboard(cookie.value)}
                        style={commonBtnStyle}
                      >
                        <Copy size={14} /> 复制值
                      </button>
                    </div>
                  </div>
                )}

                {/* 编辑模式 */}
                {isEditing && (
                  <div
                    onClick={(e) => e.stopPropagation()}
                    style={{
                      marginTop: '12px',
                      padding: '12px',
                      background: 'var(--bg-input, #1e1e1e)',
                      borderRadius: '8px',
                      display: 'flex',
                      flexDirection: 'column',
                      gap: '10px',
                    }}
                  >
                    <div
                      style={{
                        fontSize: '12px',
                        color: 'var(--text-secondary, #888)',
                      }}
                    >
                      正在编辑:{' '}
                      <strong style={{ color: '#4c6ef5' }}>
                        {editingName}
                      </strong>
                    </div>
                    <textarea
                      value={editValue}
                      onChange={(e) => setEditValue(e.target.value)}
                      rows={3}
                      style={{
                        width: '100%',
                        padding: '10px',
                        border: '1px solid var(--border-color, #444)',
                        borderRadius: '6px',
                        background: 'var(--bg-primary, #1a1a1a)',
                        color: 'var(--text-color, #e0e0e0)',
                        fontSize: '13px',
                        fontFamily: 'monospace',
                        resize: 'vertical',
                        boxSizing: 'border-box',
                        outline: 'none',
                      }}
                      placeholder="输入 Cookie 值..."
                    />
                    <div style={{ display: 'flex', gap: '8px' }}>
                      <button
                        onClick={handleUpdateCookie}
                        style={{ ...primaryBtnStyle, flex: 1 }}
                      >
                        <Check size={14} /> 保存
                      </button>
                      <button
                        onClick={() => {
                          setEditingName(null)
                          setEditValue('')
                        }}
                        style={{ ...commonBtnStyle, flex: 1 }}
                      >
                        <X size={14} /> 取消
                      </button>
                    </div>
                  </div>
                )}
              </div>
            )
          })
        )}
      </div>

      {/* 底部状态栏 */}
      <div
        style={{
          padding: '10px 16px',
          borderTop: '1px solid var(--border-color, #333)',
          fontSize: '12px',
          color: 'var(--text-secondary, #888)',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          background: 'var(--bg-secondary, #252525)',
        }}
      >
        <span>
          显示 {filteredCookies.length} / {cookies.length} 个 Cookie
        </span>
        <span>总大小: {formatBytes(stats.totalSize)}</span>
      </div>

      {/* 新建 Cookie 模态框 */}
      {showAddModal && (
        <div
          className="app-modal-overlay"
          onClick={() => setShowAddModal(false)}
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(0,0,0,0.6)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 9999,
          }}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            style={{
              background: 'var(--bg-secondary, #2a2a2a)',
              borderRadius: '12px',
              padding: '24px',
              width: '480px',
              maxWidth: '90vw',
              maxHeight: '85vh',
              display: 'flex',
              flexDirection: 'column',
              gap: '16px',
              overflow: 'auto',
            }}
          >
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                marginBottom: '4px',
              }}
            >
              <Plus size={18} style={{ color: '#4c6ef5' }} />
              <h3
                style={{
                  margin: 0,
                  fontSize: '18px',
                  color: 'var(--text-color, #e0e0e0)',
                }}
              >
                新建 Cookie
              </h3>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <div>
                <label
                  style={{
                    display: 'block',
                    fontSize: '12px',
                    color: 'var(--text-secondary, #888)',
                    marginBottom: '4px',
                  }}
                >
                  名称 *
                </label>
                <input
                  type="text"
                  value={newCookie.name}
                  onChange={(e) =>
                    setNewCookie((p) => ({ ...p, name: e.target.value }))
                  }
                  placeholder="例如: sessionId"
                  style={{
                    width: '100%',
                    padding: '10px 12px',
                    border: '1px solid var(--border-color, #444)',
                    borderRadius: '8px',
                    background: 'var(--bg-input, #1e1e1e)',
                    color: 'var(--text-color, #e0e0e0)',
                    fontSize: '13px',
                    boxSizing: 'border-box',
                    outline: 'none',
                    fontFamily: 'monospace',
                  }}
                />
              </div>

              <div>
                <label
                  style={{
                    display: 'block',
                    fontSize: '12px',
                    color: 'var(--text-secondary, #888)',
                    marginBottom: '4px',
                  }}
                >
                  值
                </label>
                <textarea
                  value={newCookie.value}
                  onChange={(e) =>
                    setNewCookie((p) => ({ ...p, value: e.target.value }))
                  }
                  placeholder="Cookie 的值"
                  rows={3}
                  style={{
                    width: '100%',
                    padding: '10px 12px',
                    border: '1px solid var(--border-color, #444)',
                    borderRadius: '8px',
                    background: 'var(--bg-input, #1e1e1e)',
                    color: 'var(--text-color, #e0e0e0)',
                    fontSize: '13px',
                    boxSizing: 'border-box',
                    outline: 'none',
                    fontFamily: 'monospace',
                    resize: 'vertical',
                  }}
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                <div>
                  <label
                    style={{
                      display: 'block',
                      fontSize: '12px',
                      color: 'var(--text-secondary, #888)',
                      marginBottom: '4px',
                    }}
                  >
                    过期天数
                  </label>
                  <input
                    type="number"
                    min="0"
                    step="1"
                    value={newCookie.days}
                    onChange={(e) =>
                      setNewCookie((p) => ({ ...p, days: e.target.value }))
                    }
                    placeholder="30"
                    style={{
                      width: '100%',
                      padding: '10px 12px',
                      border: '1px solid var(--border-color, #444)',
                      borderRadius: '8px',
                      background: 'var(--bg-input, #1e1e1e)',
                      color: 'var(--text-color, #e0e0e0)',
                      fontSize: '13px',
                      boxSizing: 'border-box',
                      outline: 'none',
                    }}
                  />
                  <div
                    style={{
                      fontSize: '11px',
                      color: 'var(--text-secondary, #666)',
                      marginTop: '4px',
                    }}
                  >
                    留空或设为 0 表示会话 Cookie
                  </div>
                </div>

                <div>
                  <label
                    style={{
                      display: 'block',
                      fontSize: '12px',
                      color: 'var(--text-secondary, #888)',
                      marginBottom: '4px',
                    }}
                  >
                    路径
                  </label>
                  <input
                    type="text"
                    value={newCookie.path}
                    onChange={(e) =>
                      setNewCookie((p) => ({ ...p, path: e.target.value }))
                    }
                    placeholder="/"
                    style={{
                      width: '100%',
                      padding: '10px 12px',
                      border: '1px solid var(--border-color, #444)',
                      borderRadius: '8px',
                      background: 'var(--bg-input, #1e1e1e)',
                      color: 'var(--text-color, #e0e0e0)',
                      fontSize: '13px',
                      boxSizing: 'border-box',
                      outline: 'none',
                      fontFamily: 'monospace',
                    }}
                  />
                </div>
              </div>

              <div
                style={{
                  padding: '10px 12px',
                  background: 'rgba(76, 110, 245, 0.08)',
                  border: '1px solid rgba(76, 110, 245, 0.2)',
                  borderRadius: '8px',
                  fontSize: '12px',
                  color: 'var(--text-secondary, #aaa)',
                  display: 'flex',
                  gap: '8px',
                }}
              >
                <Info size={14} style={{ color: '#4c6ef5', flexShrink: 0, marginTop: 1 }} />
                <span>
                  添加的 Cookie 仅在当前页面有效。HttpOnly Cookie 无法通过此方式设置。
                </span>
              </div>
            </div>

            <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end' }}>
              <button
                onClick={() => setShowAddModal(false)}
                style={commonBtnStyle}
              >
                取消
              </button>
              <button onClick={handleAddCookie} style={primaryBtnStyle}>
                <Check size={14} /> 添加 Cookie
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Toast 提示 */}
      {toast && (
        <div
          style={{
            position: 'fixed',
            bottom: '60px',
            left: '50%',
            transform: 'translateX(-50%)',
            padding: '10px 20px',
            background: 'rgba(30, 30, 30, 0.95)',
            color: 'var(--text-color, #e0e0e0)',
            borderRadius: '8px',
            border: '1px solid var(--border-color, #444)',
            fontSize: '13px',
            zIndex: 10000,
            boxShadow: '0 4px 12px rgba(0,0,0,0.4)',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
          }}
        >
          <Check size={14} style={{ color: '#10b981' }} />
          {toast}
        </div>
      )}
    </div>
  )
}