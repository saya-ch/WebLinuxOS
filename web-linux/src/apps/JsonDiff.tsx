import React, { useState, useCallback, useMemo, useRef, memo } from 'react'
import {
  GitCompareArrows,
  FileJson,
  Copy,
  CheckCircle,
  ArrowLeftRight,
  Upload,
  ChevronDown,
  ChevronRight,
  Plus,
  Minus,
  RefreshCw,
  BarChart3,
  FileText,
  Trash2,
  TreePine,
  List,
} from 'lucide-react'

// ========== 色彩系统 ==========
const COLORS = {
  mainBg: '#1e1e2e',
  panelBg: '#181825',
  editorBg: '#11111b',
  text: '#cdd6f4',
  textMuted: '#6c7086',
  accent: '#89b4fa',
  accentHover: '#74c7ec',
  border: '#313244',
  btnBg: '#313244',
  btnHover: '#45475a',
  added: '#a6e3a1',
  addedBg: 'rgba(166, 227, 161, 0.12)',
  removed: '#f38ba8',
  removedBg: 'rgba(243, 139, 168, 0.12)',
  modified: '#f9e2af',
  modifiedBg: 'rgba(249, 226, 175, 0.12)',
  unchanged: '#a6adc8',
  success: '#a6e3a1',
  error: '#f38ba8',
  warning: '#fab387',
  purple: '#cba6f7',
  blue: '#89b4fa',
  green: '#a6e3a1',
  red: '#f38ba8',
  yellow: '#f9e2af',
}

// ========== 示例 JSON ==========
const SAMPLE_LEFT = `{
  "name": "WebLinuxOS",
  "version": "2.4.0",
  "active": true,
  "author": {
    "name": "开发者",
    "email": "dev@example.com"
  },
  "features": [
    "文件系统",
    "终端模拟",
    "窗口管理"
  ],
  "stats": {
    "users": 12800,
    "rating": 4.8
  },
  "config": {
    "theme": "dark",
    "language": "zh-CN"
  }
}`

const SAMPLE_RIGHT = `{
  "name": "WebLinuxOS",
  "version": "3.0.0",
  "active": true,
  "author": {
    "name": "开发者",
    "email": "dev@linuxos.com"
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
    "rating": 4.9
  },
  "config": {
    "theme": "dark",
    "language": "zh-CN",
    "notifications": true
  },
  "tags": ["web", "os", "linux"]
}`

// ========== 工具函数 ==========
function tryParseJSON(text: string): { ok: true; value: unknown } | { ok: false; error: string } {
  try {
    return { ok: true, value: JSON.parse(text) }
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : String(e) }
  }
}

function formatJSON(text: string, indent: number = 2): string {
  const parsed = JSON.parse(text)
  return JSON.stringify(parsed, null, indent)
}

// ========== Diff 类型 ==========
type DiffType = 'added' | 'removed' | 'modified' | 'unchanged'

interface DiffItem {
  path: string
  type: DiffType
  oldValue?: unknown
  newValue?: unknown
  key: string
}

interface DiffTreeNode {
  key: string
  path: string
  type: DiffType
  oldValue?: unknown
  newValue?: unknown
  children?: DiffTreeNode[]
  hasChildren: boolean
}

// ========== 深度对比算法 ==========
function deepDiff(oldObj: unknown, newObj: unknown, basePath: string = ''): DiffItem[] {
  const results: DiffItem[] = []

  // 原始值比较
  if (oldObj === newObj) {
    return results
  }

  // 两者都是对象
  if (
    oldObj !== null && typeof oldObj === 'object' &&
    newObj !== null && typeof newObj === 'object' &&
    !Array.isArray(oldObj) && !Array.isArray(newObj)
  ) {
    const oldRecord = oldObj as Record<string, unknown>
    const newRecord = newObj as Record<string, unknown>
    const allKeys = new Set([...Object.keys(oldRecord), ...Object.keys(newRecord)])

    for (const key of allKeys) {
      const path = basePath ? `${basePath}.${key}` : key
      const hasOld = key in oldRecord
      const hasNew = key in newRecord

      if (hasOld && hasNew) {
        // 两者都有此键，递归比较
        const oldVal = oldRecord[key]
        const newVal = newRecord[key]

        if (oldVal === newVal) {
          results.push({ path, type: 'unchanged', oldValue: oldVal, newValue: newVal, key })
        } else if (
          oldVal !== null && typeof oldVal === 'object' &&
          newVal !== null && typeof newVal === 'object' &&
          !Array.isArray(oldVal) && !Array.isArray(newVal)
        ) {
          // 两者都是对象，递归
          results.push(...deepDiff(oldVal, newVal, path))
        } else if (Array.isArray(oldVal) && Array.isArray(newVal)) {
          // 两者都是数组
          results.push(...diffArrays(oldVal, newVal, path))
        } else {
          // 值不同
          results.push({ path, type: 'modified', oldValue: oldVal, newValue: newVal, key })
        }
      } else if (hasOld && !hasNew) {
        results.push({ path, type: 'removed', oldValue: oldRecord[key], key })
      } else {
        results.push({ path, type: 'added', newValue: newRecord[key], key })
      }
    }
    return results
  }

  // 两者都是数组
  if (Array.isArray(oldObj) && Array.isArray(newObj)) {
    return diffArrays(oldObj, newObj, basePath)
  }

  // 值不同
  if (oldObj !== newObj) {
    const lastKey = basePath.split('.').pop() || ''
    results.push({ path: basePath, type: 'modified', oldValue: oldObj, newValue: newObj, key: lastKey })
  }

  return results
}

function diffArrays(oldArr: unknown[], newArr: unknown[], basePath: string): DiffItem[] {
  const results: DiffItem[] = []
  const maxLen = Math.max(oldArr.length, newArr.length)

  for (let i = 0; i < maxLen; i++) {
    const path = `${basePath}[${i}]`
    const key = `[${i}]`

    if (i >= oldArr.length) {
      results.push({ path, type: 'added', newValue: newArr[i], key })
    } else if (i >= newArr.length) {
      results.push({ path, type: 'removed', oldValue: oldArr[i], key })
    } else if (oldArr[i] === newArr[i]) {
      results.push({ path, type: 'unchanged', oldValue: oldArr[i], newValue: newArr[i], key })
    } else if (
      oldArr[i] !== null && typeof oldArr[i] === 'object' &&
      newArr[i] !== null && typeof newArr[i] === 'object' &&
      !Array.isArray(oldArr[i]) && !Array.isArray(newArr[i])
    ) {
      results.push(...deepDiff(oldArr[i], newArr[i], path))
    } else if (Array.isArray(oldArr[i]) && Array.isArray(newArr[i])) {
      results.push(...diffArrays(oldArr[i], newArr[i], path))
    } else {
      results.push({ path, type: 'modified', oldValue: oldArr[i], newValue: newArr[i], key })
    }
  }

  return results
}

// ========== 构建树形结构 ==========
function buildDiffTree(items: DiffItem[]): DiffTreeNode[] {
  const root: DiffTreeNode[] = []

  for (const item of items) {
    const parts = item.path.replace(/\[(\d+)\]/g, '.$1').split('.')
    let currentLevel = root

    for (let i = 0; i < parts.length; i++) {
      const part = parts[i]
      const isLeaf = i === parts.length - 1

      if (isLeaf) {
        currentLevel.push({
          key: part,
          path: item.path,
          type: item.type,
          oldValue: item.oldValue,
          newValue: item.newValue,
          hasChildren: false,
        })
      } else {
        let existing = currentLevel.find((n) => n.key === part && n.hasChildren)
        if (!existing) {
          existing = {
            key: part,
            path: parts.slice(0, i + 1).join('.'),
            type: 'unchanged',
            children: [],
            hasChildren: true,
          }
          currentLevel.push(existing)
        }
        currentLevel = existing.children!
      }
    }
  }

  return root
}

// ========== 格式化值为字符串 ==========
function formatValue(v: unknown): string {
  if (v === null) return 'null'
  if (v === undefined) return 'undefined'
  if (typeof v === 'string') return `"${v}"`
  if (typeof v === 'boolean' || typeof v === 'number') return String(v)
  try {
    return JSON.stringify(v, null, 2)
  } catch {
    return String(v)
  }
}

// ========== 树形节点组件 ==========
interface DiffTreeNodeProps {
  node: DiffTreeNode
  depth: number
}

const DiffTreeNodeComponent = memo(function DiffTreeNodeComponent({ node, depth }: DiffTreeNodeProps) {
  const [collapsed, setCollapsed] = useState(depth > 2)

  const bgColor = useMemo(() => {
    switch (node.type) {
      case 'added': return COLORS.addedBg
      case 'removed': return COLORS.removedBg
      case 'modified': return COLORS.modifiedBg
      default: return 'transparent'
    }
  }, [node.type])

  const iconColor = useMemo(() => {
    switch (node.type) {
      case 'added': return COLORS.added
      case 'removed': return COLORS.removed
      case 'modified': return COLORS.modified
      default: return COLORS.unchanged
    }
  }, [node.type])

  const prefix = useMemo(() => {
    switch (node.type) {
      case 'added': return '+'
      case 'removed': return '-'
      case 'modified': return '~'
      default: return ' '
    }
  }, [node.type])

  if (node.hasChildren) {
    return (
      <div>
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            paddingLeft: `${depth * 16}px`,
            paddingRight: '12px',
            paddingTop: '4px',
            paddingBottom: '4px',
            background: bgColor,
            cursor: 'pointer',
            transition: 'background 0.15s',
          }}
          onClick={() => setCollapsed(!collapsed)}
          onMouseEnter={(e) => {
            if (bgColor === 'transparent') (e.currentTarget as HTMLElement).style.background = 'rgba(137, 180, 250, 0.06)'
          }}
          onMouseLeave={(e) => {
            if (bgColor === 'transparent') (e.currentTarget as HTMLElement).style.background = 'transparent'
          }}
        >
          <span style={{ color: COLORS.accent, width: '14px', textAlign: 'center', flexShrink: 0 }}>
            {collapsed ? <ChevronRight size={12} /> : <ChevronDown size={12} />}
          </span>
          <span style={{ color: COLORS.yellow, fontFamily: 'Consolas, Monaco, monospace', fontSize: '13px', marginLeft: '4px' }}>
            {node.key}
          </span>
          <span style={{ color: COLORS.textMuted, marginLeft: '4px', fontSize: '12px' }}>
            {collapsed ? `{…}` : '{'}
          </span>
          {collapsed && node.children && (
            <span style={{ color: COLORS.textMuted, fontSize: '11px', marginLeft: '6px', fontStyle: 'italic' }}>
              {node.children.length} 项
            </span>
          )}
        </div>
        {!collapsed && node.children && (
          <>
            {node.children.map((child, i) => (
              <DiffTreeNodeComponent key={`${child.path}-${i}`} node={child} depth={depth + 1} />
            ))}
            <div
              style={{
                paddingLeft: `${depth * 16 + 14}px`,
                paddingRight: '12px',
                paddingTop: '2px',
                paddingBottom: '4px',
                color: COLORS.textMuted,
                fontFamily: 'Consolas, Monaco, monospace',
                fontSize: '13px',
              }}
            >
              {'}'}
            </div>
          </>
        )}
      </div>
    )
  }

  // 叶子节点
  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'flex-start',
        paddingLeft: `${depth * 16}px`,
        paddingRight: '12px',
        paddingTop: '3px',
        paddingBottom: '3px',
        background: bgColor,
        fontFamily: 'Consolas, Monaco, monospace',
        fontSize: '13px',
        lineHeight: '1.5',
        transition: 'background 0.15s',
      }}
      onMouseEnter={(e) => {
        if (bgColor === 'transparent') (e.currentTarget as HTMLElement).style.background = 'rgba(137, 180, 250, 0.06)'
      }}
      onMouseLeave={(e) => {
        if (bgColor === 'transparent') (e.currentTarget as HTMLElement).style.background = 'transparent'
      }}
    >
      <span style={{ color: iconColor, width: '14px', textAlign: 'center', flexShrink: 0, fontWeight: 'bold' }}>
        {prefix}
      </span>
      <span style={{ color: COLORS.yellow, flexShrink: 0 }}>{node.key}</span>
      <span style={{ color: COLORS.textMuted, margin: '0 6px' }}>=</span>
      <span style={{ wordBreak: 'break-all', whiteSpace: 'pre-wrap' }}>
        {node.type === 'removed' ? (
          <span style={{ color: COLORS.removed }}>{formatValue(node.oldValue)}</span>
        ) : node.type === 'added' ? (
          <span style={{ color: COLORS.added }}>{formatValue(node.newValue)}</span>
        ) : node.type === 'modified' ? (
          <span>
            <span style={{ color: COLORS.removed, textDecoration: 'line-through', marginRight: '8px' }}>
              {formatValue(node.oldValue)}
            </span>
            <span style={{ color: COLORS.added }}>{formatValue(node.newValue)}</span>
          </span>
        ) : (
          <span style={{ color: COLORS.unchanged }}>{formatValue(node.newValue)}</span>
        )}
      </span>
    </div>
  )
})

// ========== 主组件 ==========
const JsonDiff = memo(function JsonDiff() {
  const [leftText, setLeftText] = useState<string>('')
  const [rightText, setRightText] = useState<string>('')
  const [diffItems, setDiffItems] = useState<DiffItem[]>([])
  const [hasCompared, setHasCompared] = useState<boolean>(false)
  const [copyFlash, setCopyFlash] = useState<string>('')
  const [viewMode, setViewMode] = useState<'tree' | 'list'>('tree')
  const [filter, setFilter] = useState<'all' | 'added' | 'removed' | 'modified'>('all')
  const [leftValid, setLeftValid] = useState<boolean | null>(null)
  const [rightValid, setRightValid] = useState<boolean | null>(null)
  const [leftError, setLeftError] = useState('')
  const [rightError, setRightError] = useState('')
  const copyTimerRef = useRef<number | null>(null)
  const leftFileRef = useRef<HTMLInputElement>(null)
  const rightFileRef = useRef<HTMLInputElement>(null)

  // 实时校验
  const validateLeft = useCallback((text: string) => {
    if (!text.trim()) { setLeftValid(null); setLeftError(''); return }
    const result = tryParseJSON(text)
    setLeftValid(result.ok)
    setLeftError(result.ok ? '' : result.error)
  }, [])

  const validateRight = useCallback((text: string) => {
    if (!text.trim()) { setRightValid(null); setRightError(''); return }
    const result = tryParseJSON(text)
    setRightValid(result.ok)
    setRightError(result.ok ? '' : result.error)
  }, [])

  const handleLeftChange = useCallback((text: string) => {
    setLeftText(text)
    validateLeft(text)
  }, [validateLeft])

  const handleRightChange = useCallback((text: string) => {
    setRightText(text)
    validateRight(text)
  }, [validateRight])

  // 比较
  const handleCompare = useCallback(() => {
    const leftResult = tryParseJSON(leftText)
    const rightResult = tryParseJSON(rightText)

    if (!leftResult.ok) {
      setLeftValid(false)
      setLeftError(leftResult.error)
      return
    }
    if (!rightResult.ok) {
      setRightValid(false)
      setRightError(rightResult.error)
      return
    }

    const items = deepDiff(leftResult.value, rightResult.value)
    setDiffItems(items)
    setHasCompared(true)
  }, [leftText, rightText])

  // 统计
  const stats = useMemo(() => {
    const added = diffItems.filter((d) => d.type === 'added').length
    const removed = diffItems.filter((d) => d.type === 'removed').length
    const modified = diffItems.filter((d) => d.type === 'modified').length
    const unchanged = diffItems.filter((d) => d.type === 'unchanged').length
    return { added, removed, modified, unchanged, total: diffItems.length }
  }, [diffItems])

  // 过滤后的结果
  const filteredItems = useMemo(() => {
    if (filter === 'all') return diffItems
    return diffItems.filter((d) => d.type === filter)
  }, [diffItems, filter])

  // 树形数据
  const diffTree = useMemo(() => {
    return buildDiffTree(filteredItems)
  }, [filteredItems])

  // Flash 复制提示
  const flashCopy = useCallback((msg: string) => {
    setCopyFlash(msg)
    if (copyTimerRef.current) window.clearTimeout(copyTimerRef.current)
    copyTimerRef.current = window.setTimeout(() => setCopyFlash(''), 1800)
  }, [])

  // 复制差异报告
  const handleCopyReport = useCallback(async () => {
    if (!diffItems.length) { flashCopy('无差异数据'); return }

    const lines: string[] = []
    lines.push('=== JSON Diff 报告 ===')
    lines.push(`时间: ${new Date().toLocaleString('zh-CN')}`)
    lines.push(`统计: 新增 ${stats.added}, 删除 ${stats.removed}, 修改 ${stats.modified}, 未变 ${stats.unchanged}`)
    lines.push('')

    for (const item of diffItems) {
      if (item.type === 'unchanged') continue
      const prefix = item.type === 'added' ? '+' : item.type === 'removed' ? '-' : '~'
      lines.push(`${prefix} ${item.path}`)
      if (item.type === 'removed') {
        lines.push(`  旧值: ${JSON.stringify(item.oldValue)}`)
      } else if (item.type === 'added') {
        lines.push(`  新值: ${JSON.stringify(item.newValue)}`)
      } else if (item.type === 'modified') {
        lines.push(`  旧值: ${JSON.stringify(item.oldValue)}`)
        lines.push(`  新值: ${JSON.stringify(item.newValue)}`)
      }
      lines.push('')
    }

    try {
      await navigator.clipboard.writeText(lines.join('\n'))
      flashCopy('已复制差异报告')
    } catch {
      flashCopy('复制失败')
    }
  }, [diffItems, stats, flashCopy])

  // 格式化 JSON
  const handleFormat = useCallback((side: 'left' | 'right') => {
    try {
      if (side === 'left') {
        const formatted = formatJSON(leftText)
        setLeftText(formatted)
        setLeftValid(true)
        setLeftError('')
      } else {
        const formatted = formatJSON(rightText)
        setRightText(formatted)
        setRightValid(true)
        setRightError('')
      }
      flashCopy('已格式化')
    } catch {
      flashCopy('格式化失败')
    }
  }, [leftText, rightText, flashCopy])

  // 交换面板
  const handleSwap = useCallback(() => {
    setLeftText(rightText)
    setRightText(leftText)
    setLeftValid(rightValid)
    setRightValid(leftValid)
    setLeftError(rightError)
    setRightError(leftError)
    flashCopy('已交换')
  }, [leftText, rightText, leftValid, rightValid, leftError, rightError, flashCopy])

  // 清空
  const handleClear = useCallback(() => {
    setLeftText('')
    setRightText('')
    setDiffItems([])
    setHasCompared(false)
    setLeftValid(null)
    setRightValid(null)
    setLeftError('')
    setRightError('')
    flashCopy('已清空')
  }, [flashCopy])

  // 加载示例
  const handleLoadSample = useCallback(() => {
    setLeftText(SAMPLE_LEFT)
    setRightText(SAMPLE_RIGHT)
    setLeftValid(true)
    setRightValid(true)
    setLeftError('')
    setRightError('')
    setDiffItems([])
    setHasCompared(false)
    flashCopy('已加载示例')
  }, [flashCopy])

  // 从文件加载
  const handleFileLoad = useCallback((side: 'left' | 'right', e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = (ev) => {
      const text = ev.target?.result as string
      if (side === 'left') {
        handleLeftChange(text)
      } else {
        handleRightChange(text)
      }
    }
    reader.readAsText(file)
    e.target.value = ''
  }, [handleLeftChange, handleRightChange])

  // ========== 样式 ==========
  const toolbarBtnStyle = (active?: boolean): React.CSSProperties => ({
    padding: '6px 14px',
    borderRadius: '6px',
    border: `1px solid ${COLORS.border}`,
    background: active ? `${COLORS.accent}22` : COLORS.btnBg,
    color: active ? COLORS.accent : COLORS.text,
    cursor: 'pointer',
    fontSize: '12.5px',
    fontWeight: active ? 600 : 400,
    transition: 'all 0.15s',
    display: 'flex',
    alignItems: 'center',
    gap: '6px',
    whiteSpace: 'nowrap',
  })

  const textareaStyle: React.CSSProperties = {
    flex: 1,
    padding: '12px 14px',
    background: COLORS.editorBg,
    border: 'none',
    outline: 'none',
    resize: 'none',
    fontFamily: 'Consolas, Monaco, "Courier New", monospace',
    fontSize: '13px',
    color: COLORS.text,
    lineHeight: '1.55',
    width: '100%',
  }

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        height: '100%',
        background: COLORS.mainBg,
        color: COLORS.text,
        fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "PingFang SC", sans-serif',
        overflow: 'hidden',
      }}
    >
      {/* ========== 头部 ========== */}
      <div
        style={{
          padding: '10px 18px',
          background: COLORS.panelBg,
          borderBottom: `1px solid ${COLORS.border}`,
          display: 'flex',
          alignItems: 'center',
          gap: '14px',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <div
            style={{
              width: '30px',
              height: '30px',
              borderRadius: '7px',
              background: 'linear-gradient(135deg, #89b4fa, #a6e3a1)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <GitCompareArrows size={16} color="#1e1e2e" />
          </div>
          <div>
            <div style={{ fontWeight: 600, fontSize: '14px', color: COLORS.text }}>JSON 对比工具</div>
            <div style={{ fontSize: '11px', color: COLORS.textMuted }}>深度比较 · 树形视图 · 差异报告</div>
          </div>
        </div>

        <div style={{ flex: 1 }} />

        {/* Flash 提示 */}
        {copyFlash && (
          <div
            style={{
              padding: '4px 12px',
              borderRadius: '4px',
              background: `${COLORS.success}22`,
              color: COLORS.success,
              fontSize: '12px',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              animation: 'fadeIn 0.2s ease',
            }}
          >
            <CheckCircle size={12} />
            {copyFlash}
          </div>
        )}
      </div>

      {/* ========== 工具栏 ========== */}
      <div
        style={{
          display: 'flex',
          padding: '8px 18px',
          background: COLORS.panelBg,
          borderBottom: `1px solid ${COLORS.border}`,
          gap: '8px',
          alignItems: 'center',
          flexWrap: 'wrap',
        }}
      >
        <button onClick={handleCompare} style={{ ...toolbarBtnStyle(true), background: `${COLORS.accent}33` }} title="开始比较">
          <GitCompareArrows size={14} /> 比较
        </button>
        <button onClick={handleSwap} style={toolbarBtnStyle()} title="交换左右面板">
          <ArrowLeftRight size={14} /> 交换
        </button>
        <button onClick={handleLoadSample} style={toolbarBtnStyle()} title="加载示例数据">
          <FileJson size={14} /> 示例
        </button>
        <button onClick={handleClear} style={{ ...toolbarBtnStyle(), color: COLORS.error }} title="清空所有">
          <Trash2 size={14} /> 清空
        </button>

        <div style={{ width: '1px', height: '20px', background: COLORS.border, margin: '0 4px' }} />

        <button onClick={() => handleFormat('left')} style={toolbarBtnStyle()} title="格式化左侧">
          <RefreshCw size={13} /> 格式化左
        </button>
        <button onClick={() => handleFormat('right')} style={toolbarBtnStyle()} title="格式化右侧">
          <RefreshCw size={13} /> 格式化右
        </button>

        <div style={{ flex: 1 }} />

        {hasCompared && (
          <button onClick={handleCopyReport} style={toolbarBtnStyle()} title="复制差异报告">
            <Copy size={14} /> 复制报告
          </button>
        )}
      </div>

      {/* ========== 编辑器区域 ========== */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
        {/* 双栏编辑器 */}
        <div style={{ display: 'flex', flex: hasCompared ? '0 0 200px' : 1, borderBottom: `1px solid ${COLORS.border}` }}>
          {/* 左面板 */}
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', borderRight: `1px solid ${COLORS.border}` }}>
            <div
              style={{
                padding: '6px 14px',
                background: COLORS.panelBg,
                fontSize: '12px',
                color: leftValid === false ? COLORS.error : leftValid === true ? COLORS.success : COLORS.blue,
                fontWeight: 600,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                gap: '8px',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <FileJson size={13} />
                原始 JSON（左）
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                {leftValid === false && leftError && (
                  <span style={{ fontSize: '11px', color: COLORS.error, fontWeight: 400, maxWidth: '200px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }} title={leftError}>
                    {leftError}
                  </span>
                )}
                <button
                  onClick={() => leftFileRef.current?.click()}
                  style={{
                    padding: '2px 8px',
                    borderRadius: '4px',
                    border: `1px solid ${COLORS.border}`,
                    background: COLORS.btnBg,
                    color: COLORS.unchanged,
                    cursor: 'pointer',
                    fontSize: '11px',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '4px',
                  }}
                  title="从文件加载"
                >
                  <Upload size={11} /> 加载文件
                </button>
              </div>
            </div>
            <textarea
              value={leftText}
              onChange={(e) => handleLeftChange(e.target.value)}
              spellCheck={false}
              placeholder='粘贴或输入原始 JSON...'
              style={{
                ...textareaStyle,
                borderTop: leftValid === false ? `2px solid ${COLORS.error}` : 'none',
              }}
            />
          </div>

          {/* 右面板 */}
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
            <div
              style={{
                padding: '6px 14px',
                background: COLORS.panelBg,
                fontSize: '12px',
                color: rightValid === false ? COLORS.error : rightValid === true ? COLORS.success : COLORS.green,
                fontWeight: 600,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                gap: '8px',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <FileJson size={13} />
                修改后 JSON（右）
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                {rightValid === false && rightError && (
                  <span style={{ fontSize: '11px', color: COLORS.error, fontWeight: 400, maxWidth: '200px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }} title={rightError}>
                    {rightError}
                  </span>
                )}
                <button
                  onClick={() => rightFileRef.current?.click()}
                  style={{
                    padding: '2px 8px',
                    borderRadius: '4px',
                    border: `1px solid ${COLORS.border}`,
                    background: COLORS.btnBg,
                    color: COLORS.unchanged,
                    cursor: 'pointer',
                    fontSize: '11px',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '4px',
                  }}
                  title="从文件加载"
                >
                  <Upload size={11} /> 加载文件
                </button>
              </div>
            </div>
            <textarea
              value={rightText}
              onChange={(e) => handleRightChange(e.target.value)}
              spellCheck={false}
              placeholder='粘贴或输入修改后的 JSON...'
              style={{
                ...textareaStyle,
                borderTop: rightValid === false ? `2px solid ${COLORS.error}` : 'none',
              }}
            />
          </div>
        </div>

        {/* 隐藏的文件输入 */}
        <input ref={leftFileRef} type="file" accept=".json,.txt" style={{ display: 'none' }} onChange={(e) => handleFileLoad('left', e)} />
        <input ref={rightFileRef} type="file" accept=".json,.txt" style={{ display: 'none' }} onChange={(e) => handleFileLoad('right', e)} />

        {/* ========== Diff 结果区域 ========== */}
        {hasCompared && (
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
            {/* 统计栏 + 视图切换 */}
            <div
              style={{
                padding: '8px 14px',
                background: COLORS.panelBg,
                borderBottom: `1px solid ${COLORS.border}`,
                display: 'flex',
                alignItems: 'center',
                gap: '14px',
                fontSize: '12px',
                flexWrap: 'wrap',
              }}
            >
              <BarChart3 size={14} style={{ color: COLORS.accent, flexShrink: 0 }} />
              <span style={{ color: COLORS.textMuted }}>共 <span style={{ color: COLORS.text, fontWeight: 600 }}>{stats.total}</span> 项</span>
              <span style={{ color: COLORS.added }}>
                <Plus size={11} style={{ verticalAlign: 'middle' }} /> 新增 {stats.added}
              </span>
              <span style={{ color: COLORS.removed }}>
                <Minus size={11} style={{ verticalAlign: 'middle' }} /> 删除 {stats.removed}
              </span>
              <span style={{ color: COLORS.modified }}>
                ~ 修改 {stats.modified}
              </span>
              <span style={{ color: COLORS.unchanged }}>
                · 未变 {stats.unchanged}
              </span>

              <div style={{ flex: 1 }} />

              {/* 过滤器 */}
              <div style={{ display: 'flex', gap: '4px' }}>
                {([
                  { key: 'all' as const, label: '全部' },
                  { key: 'added' as const, label: '新增' },
                  { key: 'removed' as const, label: '删除' },
                  { key: 'modified' as const, label: '修改' },
                ]).map((f) => (
                  <button
                    key={f.key}
                    onClick={() => setFilter(f.key)}
                    style={{
                      padding: '3px 10px',
                      borderRadius: '4px',
                      border: `1px solid ${COLORS.border}`,
                      background: filter === f.key ? `${COLORS.accent}22` : 'transparent',
                      color: filter === f.key ? COLORS.accent : '#a6adc8',
                      cursor: 'pointer',
                      fontSize: '11px',
                      transition: 'all 0.15s',
                    }}
                  >
                    {f.label}
                  </button>
                ))}
              </div>

              <div style={{ width: '1px', height: '20px', background: COLORS.border, margin: '0 4px' }} />

              {/* 视图模式 */}
              <div style={{ display: 'flex', gap: '4px' }}>
                <button
                  onClick={() => setViewMode('tree')}
                  style={{
                    padding: '3px 8px',
                    borderRadius: '4px',
                    border: `1px solid ${COLORS.border}`,
                    background: viewMode === 'tree' ? `${COLORS.accent}22` : 'transparent',
                    color: viewMode === 'tree' ? COLORS.accent : '#a6adc8',
                    cursor: 'pointer',
                    fontSize: '11px',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '4px',
                    transition: 'all 0.15s',
                  }}
                  title="树形视图"
                >
                  <TreePine size={12} /> 树形
                </button>
                <button
                  onClick={() => setViewMode('list')}
                  style={{
                    padding: '3px 8px',
                    borderRadius: '4px',
                    border: `1px solid ${COLORS.border}`,
                    background: viewMode === 'list' ? `${COLORS.accent}22` : 'transparent',
                    color: viewMode === 'list' ? COLORS.accent : '#a6adc8',
                    cursor: 'pointer',
                    fontSize: '11px',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '4px',
                    transition: 'all 0.15s',
                  }}
                  title="列表视图"
                >
                  <List size={12} /> 列表
                </button>
              </div>
            </div>

            {/* Diff 内容 */}
            <div style={{ flex: 1, overflow: 'auto', background: COLORS.editorBg }}>
              {filteredItems.length === 0 ? (
                <div style={{ padding: '40px 20px', textAlign: 'center', color: COLORS.textMuted, fontSize: '13px' }}>
                  {diffItems.length === 0 ? '无差异' : '当前筛选条件下无结果'}
                </div>
              ) : viewMode === 'tree' ? (
                // 树形视图
                <div style={{ padding: '8px 0' }}>
                  {diffTree.map((node, i) => (
                    <DiffTreeNodeComponent key={`${node.path}-${i}`} node={node} depth={0} />
                  ))}
                </div>
              ) : (
                // 列表视图
                filteredItems.map((item, i) => {
                  let bg = 'transparent'
                  let icon = ' '
                  let iconColor = COLORS.unchanged
                  if (item.type === 'added') { bg = COLORS.addedBg; icon = '+'; iconColor = COLORS.added }
                  else if (item.type === 'removed') { bg = COLORS.removedBg; icon = '-'; iconColor = COLORS.removed }
                  else if (item.type === 'modified') { bg = COLORS.modifiedBg; icon = '~'; iconColor = COLORS.modified }

                  return (
                    <div
                      key={`${item.path}-${i}`}
                      style={{
                        display: 'flex',
                        padding: '4px 14px',
                        fontFamily: 'Consolas, Monaco, monospace',
                        fontSize: '12.5px',
                        lineHeight: '1.5',
                        background: bg,
                        color: COLORS.text,
                        borderBottom: `1px solid ${COLORS.border}`,
                        transition: 'background 0.15s',
                      }}
                      onMouseEnter={(e) => {
                        (e.currentTarget as HTMLElement).style.background = bg === 'transparent'
                          ? 'rgba(137, 180, 250, 0.06)'
                          : bg.replace('0.12', '0.18')
                      }}
                      onMouseLeave={(e) => {
                        (e.currentTarget as HTMLElement).style.background = bg
                      }}
                    >
                      <span style={{ width: '18px', color: iconColor, fontWeight: 'bold', flexShrink: 0 }}>{icon}</span>
                      <span style={{ color: COLORS.accent, marginRight: '8px', flexShrink: 0, maxWidth: '280px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }} title={item.path}>
                        {item.path}
                      </span>
                      <span style={{ color: COLORS.textMuted, marginRight: '6px', flexShrink: 0 }}>=</span>
                      <span style={{ wordBreak: 'break-all', whiteSpace: 'pre-wrap' }}>
                        {item.type === 'removed' ? (
                          <span style={{ color: COLORS.removed }}>{formatValue(item.oldValue)}</span>
                        ) : item.type === 'added' ? (
                          <span style={{ color: COLORS.added }}>{formatValue(item.newValue)}</span>
                        ) : item.type === 'modified' ? (
                          <span>
                            <span style={{ color: COLORS.removed, textDecoration: 'line-through', marginRight: '8px' }}>
                              {formatValue(item.oldValue)}
                            </span>
                            <span style={{ color: COLORS.added }}>{formatValue(item.newValue)}</span>
                          </span>
                        ) : (
                          <span style={{ color: COLORS.unchanged }}>{formatValue(item.newValue)}</span>
                        )}
                      </span>
                    </div>
                  )
                })
              )}
            </div>
          </div>
        )}

        {/* 未比较时的提示 */}
        {!hasCompared && (
          <div
            style={{
              flex: 1,
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              color: COLORS.textMuted,
              gap: '16px',
              padding: '40px 20px',
            }}
          >
            <GitCompareArrows size={48} style={{ color: `${COLORS.accent}44` }} />
            <div style={{ fontSize: '15px', fontWeight: 500 }}>在两侧粘贴 JSON 并点击「比较」</div>
            <div style={{ fontSize: '12px', color: COLORS.textMuted, textAlign: 'center', maxWidth: '400px', lineHeight: '1.6' }}>
              支持嵌套对象、数组、基本类型的深度比较。差异结果将以树形或列表方式展示，包含新增、删除、修改和未变更项的统计。
            </div>
            <button
              onClick={handleLoadSample}
              style={{
                padding: '8px 20px',
                borderRadius: '6px',
                border: `1px solid ${COLORS.border}`,
                background: COLORS.btnBg,
                color: COLORS.accent,
                cursor: 'pointer',
                fontSize: '13px',
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                transition: 'all 0.15s',
              }}
              onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.background = COLORS.btnHover }}
              onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.background = COLORS.btnBg }}
            >
              <FileText size={14} />
              加载示例数据
            </button>
          </div>
        )}
      </div>
    </div>
  )
})

export default JsonDiff
