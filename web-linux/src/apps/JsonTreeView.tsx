import React, { useState, useMemo, useCallback, useRef } from 'react'
import { useStore } from '../store'
import {
  Braces, Minimize2, Copy, Search, BarChart3, ChevronRight,
  ChevronDown, CheckCircle, AlertCircle, FileJson, X
} from 'lucide-react'

// ========== 示例 JSON ==========
const SAMPLE_JSON = `{
  "name": "WebLinuxOS",
  "version": "3.0.0",
  "description": "一个基于 Web 的 Linux 操作系统模拟",
  "active": true,
  "author": {
    "name": "开发者",
    "email": "dev@example.com",
    "social": {
      "github": "https://github.com/example",
      "twitter": "@example"
    }
  },
  "features": [
    "文件系统",
    "终端模拟",
    "窗口管理",
    "应用生态"
  ],
  "stats": {
    "users": 25600,
    "downloads": 150000,
    "rating": 4.9,
    "categories": {
      "desktop": 8500,
      "mobile": 12000,
      "server": 5100
    }
  },
  "config": {
    "theme": "dark",
    "language": "zh-CN",
    "plugins": null,
    "settings": {
      "notifications": true,
      "autoSave": false,
      "maxTabs": 10
    }
  }
}`

// ========== 主题色定义 ==========
function getColors(isDark: boolean) {
  return {
    bg: isDark ? '#1a1a2e' : '#f5f5f7',
    surface: isDark ? '#16213e' : '#ffffff',
    editorBg: isDark ? '#0d1117' : '#ffffff',
    treeBg: isDark ? '#0d1117' : '#fafafa',
    text: isDark ? '#e6e6e6' : '#1a1a2e',
    textMuted: isDark ? '#8b949e' : '#6b7280',
    border: isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.1)',
    accent: isDark ? '#7c6cf0' : '#5b4cd8',
    accentHover: isDark ? '#6a5ce0' : '#4a3dc0',
    success: isDark ? '#3fb950' : '#16a34a',
    error: isDark ? '#f85149' : '#dc2626',
    warning: isDark ? '#d29922' : '#ca8a04',
    btnBg: isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.04)',
    btnHover: isDark ? 'rgba(255,255,255,0.12)' : 'rgba(0,0,0,0.08)',
    headerBg: isDark ? 'rgba(13,17,23,0.9)' : 'rgba(255,255,255,0.95)',
    tooltipBg: isDark ? '#2d2d44' : '#333333',
    // 语法高亮色
    keyColor: isDark ? '#f9e2af' : '#b45309',
    stringColor: isDark ? '#a6e3a1' : '#16a34a',
    numberColor: isDark ? '#74c7ec' : '#2563eb',
    boolColor: isDark ? '#fab387' : '#ea580c',
    nullColor: isDark ? '#6c7086' : '#9ca3af',
    bracketColor: isDark ? '#6c7086' : '#6b7280',
    highlightBg: isDark ? 'rgba(124,108,240,0.25)' : 'rgba(91,76,216,0.15)',
    highlightBorder: isDark ? '#7c6cf0' : '#5b4cd8',
    lineColor: isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.06)',
  }
}

// ========== 工具函数 ==========
function tryParseJSON(text: string): { ok: true; value: unknown } | { ok: false; error: string; line: number; col: number } {
  try {
    return { ok: true, value: JSON.parse(text) }
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e)
    let line = 1, col = 1
    const posMatch = msg.match(/position\s+(\d+)/i)
    if (posMatch) {
      const pos = parseInt(posMatch[1], 10)
      const before = text.substring(0, pos)
      line = (before.match(/\n/g) || []).length + 1
      const lastNewline = before.lastIndexOf('\n')
      col = pos - lastNewline
    }
    return { ok: false, error: msg, line, col }
  }
}

function getJsonStats(value: unknown): { keys: number; values: number; depth: number; size: string } {
  let keys = 0
  let values = 0
  let maxDepth = 0

  function walk(v: unknown, depth: number) {
    if (depth > maxDepth) maxDepth = depth
    if (v === null || v === undefined) {
      values++
      return
    }
    if (typeof v === 'object' && !Array.isArray(v)) {
      const obj = v as Record<string, unknown>
      const entries = Object.entries(obj)
      keys += entries.length
      for (const [, val] of entries) {
        walk(val, depth + 1)
      }
    } else if (Array.isArray(v)) {
      values++ // array itself counts
      for (const item of v) {
        walk(item, depth + 1)
      }
    } else {
      values++
    }
  }

  walk(value, 0)

  const raw = JSON.stringify(value)
  let size: string
  if (raw.length < 1024) size = `${raw.length} B`
  else if (raw.length < 1024 * 1024) size = `${(raw.length / 1024).toFixed(1)} KB`
  else size = `${(raw.length / (1024 * 1024)).toFixed(1)} MB`

  return { keys, values, depth: maxDepth, size }
}

function matchesSearch(key: string | undefined, value: unknown, term: string): boolean {
  const lower = term.toLowerCase()
  if (key && key.toLowerCase().includes(lower)) return true
  if (value !== null && value !== undefined) {
    if (String(value).toLowerCase().includes(lower)) return true
  }
  return false
}

// ========== JSON 树节点组件 ==========
interface JsonNodeProps {
  keyName: string | undefined
  value: unknown
  depth: number
  path: string
  isLast: boolean
  collapsed: Record<string, boolean>
  onToggle: (path: string) => void
  searchTerm: string
  colors: ReturnType<typeof getColors>
  onCopyPath: (path: string) => void
  isRoot?: boolean
}

function JsonNode({
  keyName, value, depth, path, isLast,
  collapsed, onToggle, searchTerm, colors, onCopyPath, isRoot
}: JsonNodeProps) {
  const isObject = value !== null && typeof value === 'object' && !Array.isArray(value)
  const isArray = Array.isArray(value)
  const isExpandable = isObject || isArray
  const isCollapsed = collapsed[path]
  const indent = depth * 20

  // 搜索高亮
  const isHighlighted = searchTerm.length > 0 && matchesSearch(keyName, value, searchTerm)

  // 获取子节点
  const entries: Array<{ key: string; val: unknown; childPath: string }> = useMemo(() => {
    if (!isExpandable) return []
    if (isArray) {
      return (value as unknown[]).map((item, i) => ({
        key: String(i),
        val: item,
        childPath: `${path}[${i}]`,
      }))
    }
    return Object.entries(value as Record<string, unknown>).map(([k, v]) => ({
      key: k,
      val: v,
      childPath: `${path}.${k}`,
    }))
  }, [value, isExpandable, isArray, path])

  const handleClickPath = useCallback(() => {
    onCopyPath(path)
  }, [path, onCopyPath])

  // 渲染简单值
  const renderValue = (v: unknown) => {
    if (v === null) return <span style={{ color: colors.nullColor }}>null</span>
    if (typeof v === 'string') return <span style={{ color: colors.stringColor }}>"{v}"</span>
    if (typeof v === 'number') return <span style={{ color: colors.numberColor }}>{v}</span>
    if (typeof v === 'boolean') return <span style={{ color: colors.boolColor }}>{String(v)}</span>
    return <span>{String(v)}</span>
  }

  // 搜索匹配高亮辅助
  const highlightStyle: React.CSSProperties = isHighlighted
    ? { backgroundColor: colors.highlightBg, borderRadius: 3, outline: `1px solid ${colors.highlightBorder}` }
    : {}

  const nodeStyle: React.CSSProperties = {
    display: 'flex',
    alignItems: 'flex-start',
    padding: '2px 4px',
    paddingLeft: `${indent + 4}px`,
    cursor: isExpandable ? 'pointer' : 'default',
    minHeight: 26,
    position: 'relative',
    ...highlightStyle,
  }

  // 缩进连接线
  const guides: React.ReactNode[] = []
  for (let i = 1; i < depth; i++) {
    guides.push(
      <span
        key={`guide-${i}`}
        style={{
          position: 'absolute',
          left: `${i * 20 + 12}px`,
          top: 0,
          bottom: 0,
          width: 1,
          backgroundColor: colors.lineColor,
        }}
      />
    )
  }

  return (
    <div>
      <div
        style={nodeStyle}
        onClick={isExpandable ? () => onToggle(path) : undefined}
        onMouseEnter={(e) => {
          if (!isExpandable) (e.currentTarget as HTMLElement).style.backgroundColor = colors.btnHover
        }}
        onMouseLeave={(e) => {
          if (!isHighlighted) (e.currentTarget as HTMLElement).style.backgroundColor = 'transparent'
        }}
      >
        {guides}
        {/* 展开/折叠三角形 */}
        <span
          style={{
            width: 16,
            height: 16,
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center',
            flexShrink: 0,
            marginRight: 4,
            color: colors.textMuted,
            transform: isExpandable && isCollapsed ? 'rotate(0deg)' : isExpandable ? 'rotate(90deg)' : 'none',
            transition: 'transform 0.15s',
          }}
        >
          {isExpandable ? <ChevronRight size={14} /> : <span style={{ width: 14 }} />}
        </span>
        {/* 键名 */}
        {keyName !== undefined && !isRoot && (
          <span
            style={{
              color: colors.keyColor,
              marginRight: 6,
              fontWeight: 500,
              cursor: 'pointer',
              flexShrink: 0,
            }}
            onClick={(e) => {
              e.stopPropagation()
              handleClickPath()
            }}
            title={`点击复制路径: ${path}`}
          >
            {isArray ? `"${keyName}"` : `"${keyName}"`}
            <span style={{ color: colors.textMuted }}>: </span>
          </span>
        )}
        {/* 值或折叠预览 */}
        {isExpandable ? (
          <>
            <span style={{ color: colors.bracketColor }}>
              {isArray ? '[' : '{'}
            </span>
            {isCollapsed ? (
              <>
                <span style={{ color: colors.textMuted, fontSize: 12, margin: '0 4px' }}>
                  {isArray
                    ? `${(value as unknown[]).length} items`
                    : `${Object.keys(value as Record<string, unknown>).length} keys`}
                </span>
                <span style={{ color: colors.bracketColor }}>
                  {isArray ? ']' : '}'}
                </span>
                {!isLast && <span style={{ color: colors.textMuted }}>,</span>}
              </>
            ) : (
              <span style={{ color: colors.bracketColor }}>
                {isLast ? '' : ''}
              </span>
            )}
          </>
        ) : (
          <>
            {renderValue(value)}
            {!isLast && <span style={{ color: colors.textMuted }}>,</span>}
          </>
        )}
        {/* 路径复制按钮 */}
        <span
          onClick={(e) => {
            e.stopPropagation()
            handleClickPath()
          }}
          style={{
            marginLeft: 'auto',
            paddingLeft: 8,
            paddingRight: 4,
            cursor: 'pointer',
            opacity: 0.3,
            fontSize: 11,
            color: colors.textMuted,
            transition: 'opacity 0.15s',
            flexShrink: 0,
          }}
          onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.opacity = '1' }}
          onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.opacity = '0.3' }}
          title={`复制路径: ${path}`}
        >
          <Copy size={11} />
        </span>
      </div>
      {/* 展开的子节点 */}
      {isExpandable && !isCollapsed && (
        <div>
          {entries.map((entry, i) => (
            <JsonNode
              key={entry.childPath}
              keyName={entry.key}
              value={entry.val}
              depth={depth + 1}
              path={entry.childPath}
              isLast={i === entries.length - 1}
              collapsed={collapsed}
              onToggle={onToggle}
              searchTerm={searchTerm}
              colors={colors}
              onCopyPath={onCopyPath}
            />
          ))}
          {/* 结束括号 */}
          <div style={{ paddingLeft: `${indent + 4}px`, minHeight: 24, display: 'flex', alignItems: 'center' }}>
            <span style={{ width: 16 + 4, display: 'inline-block', flexShrink: 0 }} />
            <span style={{ color: colors.bracketColor }}>
              {isArray ? ']' : '}'}
              {!isLast && <span>,</span>}
            </span>
          </div>
        </div>
      )}
    </div>
  )
}

// ========== 主组件 ==========
const JsonTreeView = () => {
  const resolvedTheme = useStore((s) => s.resolvedTheme)
  const isDark = resolvedTheme === 'dark'
  const colors = getColors(isDark)

  const [inputText, setInputText] = useState(SAMPLE_JSON)
  const [searchTerm, setSearchTerm] = useState('')
  const [collapsed, setCollapsed] = useState<Record<string, boolean>>({})
  const [copyFeedback, setCopyFeedback] = useState('')
  const [showStats, setShowStats] = useState(false)
  const [showSearch, setShowSearch] = useState(false)
  const textareaRef = useRef<HTMLTextAreaElement>(null)
  const feedbackTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  // 解析 JSON
  const parseResult = useMemo(() => tryParseJSON(inputText), [inputText])

  // 统计数据
  const stats = useMemo(() => {
    if (!parseResult.ok) return null
    return getJsonStats(parseResult.value)
  }, [parseResult])

  // 显示反馈消息
  const showFeedback = useCallback((msg: string) => {
    setCopyFeedback(msg)
    if (feedbackTimerRef.current) clearTimeout(feedbackTimerRef.current)
    feedbackTimerRef.current = setTimeout(() => setCopyFeedback(''), 2000)
  }, [])

  // 格式化
  const handleFormat = useCallback(() => {
    if (!parseResult.ok) return
    const formatted = JSON.stringify(parseResult.value, null, 2)
    setInputText(formatted)
    showFeedback('已格式化')
  }, [parseResult, showFeedback])

  // 压缩
  const handleMinify = useCallback(() => {
    if (!parseResult.ok) return
    const minified = JSON.stringify(parseResult.value)
    setInputText(minified)
    showFeedback('已压缩')
  }, [parseResult, showFeedback])

  // 复制全部
  const handleCopyAll = useCallback(() => {
    if (!parseResult.ok) return
    const text = JSON.stringify(parseResult.value, null, 2)
    navigator.clipboard.writeText(text).then(() => {
      showFeedback('已复制到剪贴板')
    }).catch(() => {
      showFeedback('复制失败')
    })
  }, [parseResult, showFeedback])

  // 复制路径
  const handleCopyPath = useCallback((path: string) => {
    navigator.clipboard.writeText(path).then(() => {
      showFeedback(`路径已复制: ${path}`)
    }).catch(() => {
      showFeedback('复制失败')
    })
  }, [showFeedback])

  // 折叠/展开切换
  const handleToggle = useCallback((path: string) => {
    setCollapsed(prev => ({ ...prev, [path]: !prev[path] }))
  }, [])

  // 全部折叠
  const handleCollapseAll = useCallback(() => {
    if (!parseResult.ok) return
    const allPaths: Record<string, boolean> = {}
    function collectPaths(v: unknown, p: string) {
      if (v !== null && typeof v === 'object' && !Array.isArray(v)) {
        allPaths[p] = true
        Object.entries(v as Record<string, unknown>).forEach(([k, val]) => {
          collectPaths(val, `${p}.${k}`)
        })
      } else if (Array.isArray(v)) {
        allPaths[p] = true
        v.forEach((item, i) => {
          collectPaths(item, `${p}[${i}]`)
        })
      }
    }
    collectPaths(parseResult.value, '$')
    setCollapsed(allPaths)
    showFeedback('已全部折叠')
  }, [parseResult, showFeedback])

  // 全部展开
  const handleExpandAll = useCallback(() => {
    setCollapsed({})
    showFeedback('已全部展开')
  }, [showFeedback])

  // 搜索展开匹配节点
  const handleSearchChange = useCallback((term: string) => {
    setSearchTerm(term)
  }, [])

  // 自动解析时展开所有
  const handleInputChange = useCallback((val: string) => {
    setInputText(val)
  }, [])

  const btnStyle = (active?: boolean): React.CSSProperties => ({
    display: 'inline-flex',
    alignItems: 'center',
    gap: 5,
    padding: '6px 12px',
    border: 'none',
    borderRadius: 6,
    backgroundColor: active ? colors.accent : colors.btnBg,
    color: active ? '#fff' : colors.text,
    cursor: 'pointer',
    fontSize: 12,
    fontWeight: 500,
    transition: 'all 0.15s',
    whiteSpace: 'nowrap',
  })

  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      height: '100%',
      backgroundColor: colors.bg,
      color: colors.text,
      fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
      fontSize: 13,
      overflow: 'hidden',
    }}>
      {/* 工具栏 */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        gap: 6,
        padding: '8px 12px',
        backgroundColor: colors.headerBg,
        borderBottom: `1px solid ${colors.border}`,
        flexWrap: 'wrap',
        flexShrink: 0,
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 4, marginRight: 8 }}>
          <FileJson size={18} style={{ color: colors.accent }} />
          <span style={{ fontWeight: 600, fontSize: 13 }}>JSON 树查看器</span>
        </div>
        <button
          style={btnStyle()}
          onClick={handleFormat}
          onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.backgroundColor = colors.btnHover }}
          onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.backgroundColor = colors.btnBg }}
          title="格式化 JSON"
        >
          <Braces size={14} /> 格式化
        </button>
        <button
          style={btnStyle()}
          onClick={handleMinify}
          onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.backgroundColor = colors.btnHover }}
          onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.backgroundColor = colors.btnBg }}
          title="压缩 JSON"
        >
          <Minimize2 size={14} /> 压缩
        </button>
        <button
          style={btnStyle()}
          onClick={handleCollapseAll}
          onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.backgroundColor = colors.btnHover }}
          onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.backgroundColor = colors.btnBg }}
          title="全部折叠"
        >
          <ChevronRight size={14} /> 折叠
        </button>
        <button
          style={btnStyle()}
          onClick={handleExpandAll}
          onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.backgroundColor = colors.btnHover }}
          onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.backgroundColor = colors.btnBg }}
          title="全部展开"
        >
          <ChevronDown size={14} /> 展开
        </button>
        <button
          style={btnStyle(showSearch)}
          onClick={() => setShowSearch(!showSearch)}
          onMouseEnter={(e) => { if (!showSearch) (e.currentTarget as HTMLElement).style.backgroundColor = colors.btnHover }}
          onMouseLeave={(e) => { if (!showSearch) (e.currentTarget as HTMLElement).style.backgroundColor = colors.btnBg }}
          title="搜索"
        >
          <Search size={14} /> 搜索
        </button>
        <button
          style={btnStyle()}
          onClick={handleCopyAll}
          onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.backgroundColor = colors.btnHover }}
          onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.backgroundColor = colors.btnBg }}
          title="复制全部"
        >
          <Copy size={14} /> 复制
        </button>
        <button
          style={btnStyle(showStats)}
          onClick={() => setShowStats(!showStats)}
          onMouseEnter={(e) => { if (!showStats) (e.currentTarget as HTMLElement).style.backgroundColor = colors.btnHover }}
          onMouseLeave={(e) => { if (!showStats) (e.currentTarget as HTMLElement).style.backgroundColor = colors.btnBg }}
          title="数据统计"
        >
          <BarChart3 size={14} /> 统计
        </button>
        {/* 反馈提示 */}
        {copyFeedback && (
          <span style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: 4,
            padding: '4px 10px',
            borderRadius: 6,
            backgroundColor: colors.success,
            color: '#fff',
            fontSize: 12,
            fontWeight: 500,
            marginLeft: 'auto',
            animation: 'fadeIn 0.15s',
          }}>
            <CheckCircle size={13} /> {copyFeedback}
          </span>
        )}
      </div>

      {/* 搜索栏 */}
      {showSearch && (
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: 8,
          padding: '8px 12px',
          backgroundColor: colors.surface,
          borderBottom: `1px solid ${colors.border}`,
          flexShrink: 0,
        }}>
          <Search size={14} style={{ color: colors.textMuted, flexShrink: 0 }} />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => handleSearchChange(e.target.value)}
            placeholder="搜索键名或值..."
            style={{
              flex: 1,
              padding: '6px 10px',
              border: `1px solid ${colors.border}`,
              borderRadius: 6,
              backgroundColor: colors.editorBg,
              color: colors.text,
              fontSize: 12,
              outline: 'none',
            }}
          />
          {searchTerm && (
            <button
              onClick={() => setSearchTerm('')}
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                width: 24,
                height: 24,
                border: 'none',
                borderRadius: 4,
                backgroundColor: 'transparent',
                color: colors.textMuted,
                cursor: 'pointer',
              }}
            >
              <X size={14} />
            </button>
          )}
        </div>
      )}

      {/* 统计面板 */}
      {showStats && stats && (
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: 20,
          padding: '8px 16px',
          backgroundColor: colors.surface,
          borderBottom: `1px solid ${colors.border}`,
          fontSize: 12,
          flexShrink: 0,
          flexWrap: 'wrap',
        }}>
          <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
            <span style={{ color: colors.textMuted }}>键总数:</span>
            <span style={{ color: colors.accent, fontWeight: 600 }}>{stats.keys}</span>
          </span>
          <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
            <span style={{ color: colors.textMuted }}>值总数:</span>
            <span style={{ color: colors.accent, fontWeight: 600 }}>{stats.values}</span>
          </span>
          <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
            <span style={{ color: colors.textMuted }}>深度:</span>
            <span style={{ color: colors.accent, fontWeight: 600 }}>{stats.depth}</span>
          </span>
          <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
            <span style={{ color: colors.textMuted }}>大小:</span>
            <span style={{ color: colors.accent, fontWeight: 600 }}>{stats.size}</span>
          </span>
        </div>
      )}

      {/* 主内容区：左侧输入 + 右侧树形视图 */}
      <div style={{
        display: 'flex',
        flex: 1,
        overflow: 'hidden',
      }}>
        {/* 左侧 - JSON 输入 */}
        <div style={{
          display: 'flex',
          flexDirection: 'column',
          width: '45%',
          borderRight: `1px solid ${colors.border}`,
          overflow: 'hidden',
        }}>
          <div style={{
            padding: '6px 12px',
            fontSize: 11,
            fontWeight: 600,
            color: colors.textMuted,
            textTransform: 'uppercase',
            letterSpacing: '0.5px',
            backgroundColor: colors.surface,
            borderBottom: `1px solid ${colors.border}`,
            flexShrink: 0,
          }}>
            JSON 输入
          </div>
          <textarea
            ref={textareaRef}
            value={inputText}
            onChange={(e) => handleInputChange(e.target.value)}
            spellCheck={false}
            style={{
              flex: 1,
              width: '100%',
              padding: '12px',
              border: 'none',
              resize: 'none',
              backgroundColor: colors.editorBg,
              color: colors.text,
              fontFamily: '"SF Mono", "Fira Code", "Cascadia Code", Consolas, monospace',
              fontSize: 12,
              lineHeight: 1.6,
              outline: 'none',
              tabSize: 2,
            }}
          />
          {/* 错误提示 */}
          {!parseResult.ok && (
            <div style={{
              padding: '8px 12px',
              backgroundColor: isDark ? 'rgba(248,81,73,0.1)' : 'rgba(220,38,38,0.08)',
              color: colors.error,
              fontSize: 12,
              display: 'flex',
              alignItems: 'flex-start',
              gap: 6,
              borderTop: `1px solid ${colors.border}`,
              flexShrink: 0,
            }}>
              <AlertCircle size={14} style={{ flexShrink: 0, marginTop: 1 }} />
              <div>
                <div style={{ fontWeight: 600 }}>JSON 解析错误</div>
                <div style={{ marginTop: 2, opacity: 0.85 }}>
                  {parseResult.line > 0 && `行 ${parseResult.line}, 列 ${parseResult.col}: `}
                  {parseResult.error}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* 右侧 - 树形视图 */}
        <div style={{
          display: 'flex',
          flexDirection: 'column',
          flex: 1,
          overflow: 'hidden',
        }}>
          <div style={{
            padding: '6px 12px',
            fontSize: 11,
            fontWeight: 600,
            color: colors.textMuted,
            textTransform: 'uppercase',
            letterSpacing: '0.5px',
            backgroundColor: colors.surface,
            borderBottom: `1px solid ${colors.border}`,
            flexShrink: 0,
          }}>
            树形视图
          </div>
          <div style={{
            flex: 1,
            overflow: 'auto',
            backgroundColor: colors.treeBg,
            padding: '4px 0',
          }}>
            {parseResult.ok ? (
              <JsonNode
                keyName={undefined}
                value={parseResult.value}
                depth={0}
                path="$"
                isLast={true}
                collapsed={collapsed}
                onToggle={handleToggle}
                searchTerm={searchTerm}
                colors={colors}
                onCopyPath={handleCopyPath}
                isRoot={true}
              />
            ) : (
              <div style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                height: '100%',
                color: colors.textMuted,
                gap: 8,
                padding: 24,
                textAlign: 'center',
              }}>
                <AlertCircle size={32} style={{ opacity: 0.4 }} />
                <div style={{ fontSize: 13 }}>JSON 解析失败</div>
                <div style={{ fontSize: 12, opacity: 0.7 }}>请检查输入的 JSON 格式是否正确</div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* 状态栏 */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '4px 12px',
        fontSize: 11,
        color: colors.textMuted,
        backgroundColor: colors.headerBg,
        borderTop: `1px solid ${colors.border}`,
        flexShrink: 0,
      }}>
        <span>
          {parseResult.ok ? (
            <span style={{ color: colors.success }}>
              <CheckCircle size={11} style={{ verticalAlign: -1, marginRight: 4 }} />
              有效 JSON
            </span>
          ) : (
            <span style={{ color: colors.error }}>
              <AlertCircle size={11} style={{ verticalAlign: -1, marginRight: 4 }} />
              格式错误
            </span>
          )}
        </span>
        <span>
          {stats && `键: ${stats.keys} | 值: ${stats.values} | 深度: ${stats.depth} | ${stats.size}`}
        </span>
      </div>
    </div>
  )
}

export default JsonTreeView
