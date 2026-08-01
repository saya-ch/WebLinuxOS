import React, { useState, useCallback, useMemo, memo, useEffect, useRef } from 'react'

type BottomTab = 'format' | 'minify' | 'diff' | 'schema' | 'typescript'

const SAMPLE_JSON = `{
  "name": "Web Linux OS",
  "version": "2.4.0",
  "active": true,
  "stats": {
    "users": 12800,
    "active": 4500,
    "rating": 4.8
  },
  "features": ["Terminal", "FileSystem", "WindowManager"],
  "config": {
    "theme": "dark",
    "language": "zh-CN",
    "settings": {
      "notifications": true,
      "autoSave": true,
      "backup": { "enabled": true, "interval": 3600 }
    }
  },
  "tags": ["web", "os", "linux", "react"],
  "owner": null
}`

// ========== 工具函数 ==========
function tryParseJSON(text: string): { ok: true; value: unknown } | { ok: false; error: string } {
  try {
    return { ok: true, value: JSON.parse(text) }
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : String(e) }
  }
}

function tryFormat(text: string, indent: number): string {
  const parsed = JSON.parse(text)
  return JSON.stringify(parsed, null, indent)
}

function tryMinify(text: string): string {
  const parsed = JSON.parse(text)
  return JSON.stringify(parsed)
}

// ========== 语法高亮 ==========
function highlightJSON(text: string): React.ReactNode {
  if (!text) return null
  const lines = text.split('\n')
  return lines.map((line, lineIdx) => {
    const nodes: React.ReactNode[] = []
    const regex = /("(?:\\.|[^"\\])*"\s*:)|("(?:\\.|[^"\\])*")|(\b(?:true|false|null)\b)|(-?\d+\.?\d*(?:[eE][+-]?\d+)?)|([{}\[\],])/g
    let lastIndex = 0
    let match: RegExpExecArray | null
    let key = 0
    while ((match = regex.exec(line)) !== null) {
      if (match.index > lastIndex) {
        nodes.push(<span key={`t${key++}`}>{line.slice(lastIndex, match.index)}</span>)
      }
      const [m, keyPart, stringPart, keywordPart, numberPart, punctPart] = match
      if (keyPart) {
        nodes.push(<span key={`k${key++}`} style={{ color: '#f9e2af' }}>{m}</span>)
      } else if (stringPart) {
        nodes.push(<span key={`s${key++}`} style={{ color: '#a6e3a1' }}>{m}</span>)
      } else if (keywordPart) {
        nodes.push(<span key={`kw${key++}`} style={{ color: '#cba6f7' }}>{m}</span>)
      } else if (numberPart) {
        nodes.push(<span key={`n${key++}`} style={{ color: '#74c7ec' }}>{m}</span>)
      } else if (punctPart) {
        nodes.push(<span key={`p${key++}`} style={{ color: '#6c7086' }}>{m}</span>)
      }
      lastIndex = match.index + m.length
    }
    if (lastIndex < line.length) {
      nodes.push(<span key={`end${key++}`}>{line.slice(lastIndex)}</span>)
    }
    return (
      <div key={lineIdx} style={{ minHeight: '1.5em' }}>
        {nodes.length === 0 ? '\u00A0' : nodes}
      </div>
    )
  })
}

// ========== JSONPath ==========
function execJSONPath(root: unknown, path: string): { success: boolean; value?: unknown; error?: string } {
  try {
    if (!path.trim()) return { success: true, value: root }
    let current: unknown = root
    const normalized = path.startsWith('$') ? path.slice(1) : path
    const tokens = normalized.match(/(\.[A-Za-z_$][\w$]*|\[\d+\]|\[\*\]|\[?\*?\]?)/g) || []
    for (const token of tokens) {
      if (token === '' || token === '.' || token === '[]') continue
      if (token === '.*' || token === '[*]') {
        if (Array.isArray(current)) continue
        if (current && typeof current === 'object') {
          current = Object.values(current as Record<string, unknown>)
          continue
        }
        return { success: false, error: `通配符无法应用于当前节点` }
      }
      if (token.startsWith('[')) {
        const idx = parseInt(token.slice(1, -1), 10)
        if (Array.isArray(current)) {
          current = current[idx]
        } else {
          return { success: false, error: `索引 ${token} 无法应用于非数组` }
        }
      } else if (token.startsWith('.')) {
        const key = token.slice(1)
        if (current && typeof current === 'object') {
          current = (current as Record<string, unknown>)[key]
        } else {
          return { success: false, error: `键 "${key}" 无法应用于非对象` }
        }
      }
      if (current === undefined) return { success: false, error: `路径 "${token}" 处值为 undefined` }
    }
    return { success: true, value: current }
  } catch (e) {
    return { success: false, error: e instanceof Error ? e.message : String(e) }
  }
}

// ========== Diff 算法 ==========
type DiffOp = { type: 'equal' | 'added' | 'removed' | 'changed'; left?: unknown; right?: unknown; key?: string }

function diffValues(a: unknown, b: unknown, key = ''): DiffOp[] {
  const result: DiffOp[] = []
  if (a === b) {
    result.push({ type: 'equal', left: a, right: b, key })
    return result
  }
  if (typeof a !== typeof b) {
    result.push({ type: 'changed', left: a, right: b, key })
    return result
  }
  if (Array.isArray(a) && Array.isArray(b)) {
    const len = Math.max(a.length, b.length)
    for (let i = 0; i < len; i++) {
      result.push(...diffValues(a[i], b[i], `${key}[${i}]`))
    }
    return result
  }
  if (a && b && typeof a === 'object' && typeof b === 'object') {
    const aObj = a as Record<string, unknown>
    const bObj = b as Record<string, unknown>
    const keys = Array.from(new Set([...Object.keys(aObj), ...Object.keys(bObj)]))
    for (const k of keys) {
      const hasA = k in aObj
      const hasB = k in bObj
      if (hasA && hasB) {
        result.push(...diffValues(aObj[k], bObj[k], key ? `${key}.${k}` : k))
      } else if (hasA) {
        result.push({ type: 'removed', left: aObj[k], key: key ? `${key}.${k}` : k })
      } else {
        result.push({ type: 'added', right: bObj[k], key: key ? `${key}.${k}` : k })
      }
    }
    return result
  }
  result.push({ type: 'changed', left: a, right: b, key })
  return result
}

// ========== Schema 生成 ==========
function inferSchema(value: unknown): Record<string, unknown> {
  if (value === null) return { type: 'null' }
  if (Array.isArray(value)) {
    const schema: Record<string, unknown> = { type: 'array' }
    if (value.length > 0) {
      const items = value.map((v) => inferSchema(v))
      const firstType = items[0].type
      if (items.every((i) => i.type === firstType)) {
        schema.items = items[0]
      } else {
        schema.items = { oneOf: items }
      }
    }
    return schema
  }
  const t = typeof value
  if (t === 'string') return { type: 'string' }
  if (t === 'number') return { type: Number.isInteger(value) ? 'integer' : 'number' }
  if (t === 'boolean') return { type: 'boolean' }
  if (t === 'object') {
    const obj = value as Record<string, unknown>
    const properties: Record<string, unknown> = {}
    const required: string[] = []
    for (const k of Object.keys(obj)) {
      properties[k] = inferSchema(obj[k])
      required.push(k)
    }
    const schema: Record<string, unknown> = { type: 'object', properties }
    if (required.length > 0) schema.required = required
    return schema
  }
  return { type: t }
}

function generateSchema(value: unknown, title = 'Root'): string {
  const schema = {
    $schema: 'http://json-schema.org/draft-07/schema#',
    title,
    ...inferSchema(value),
  }
  return JSON.stringify(schema, null, 2)
}

// ========== TypeScript 类型生成 ==========
function tsTypeOf(value: unknown): string {
  if (value === null) return 'null'
  if (Array.isArray(value)) {
    if (value.length === 0) return 'unknown[]'
    const itemTypes = value.map((v) => tsTypeOf(v))
    const unique = Array.from(new Set(itemTypes))
    return unique.length === 1 ? `${unique[0]}[]` : `(${unique.join(' | ')})[]`
  }
  const t = typeof value
  if (t === 'string' || t === 'number' || t === 'boolean' || t === 'undefined' || t === 'bigint') {
    return t
  }
  if (t === 'object') {
    const obj = value as Record<string, unknown>
    const keys = Object.keys(obj)
    if (keys.length === 0) return 'Record<string, unknown>'
    const fields = keys.map((k) => {
      const ts = tsTypeOf(obj[k])
      return `  ${k}: ${ts}`
    })
    return `{\n${fields.join(';\n')};\n}`
  }
  return 'unknown'
}

function generateTypeScript(value: unknown, name = 'Root'): string {
  const interfaceBody = tsTypeOf(value)
  const cleanName = name.replace(/[^a-zA-Z0-9_]/g, '_') || 'Root'
  if (!interfaceBody.includes('{')) {
    return `export type ${cleanName} = ${interfaceBody}`
  }
  return `export interface ${cleanName} ${interfaceBody}`
}

// ========== 树形视图 ==========
type TreeNodeProps = {
  data: unknown
  depth?: number
  isLast?: boolean
  path?: string
}

const TreeNode = memo(function TreeNode({ data, depth = 0, path = '' }: TreeNodeProps) {
  const [collapsed, setCollapsed] = useState(depth > 3)

  if (data === null) return <span style={{ color: '#f38ba8' }}>null</span>
  if (typeof data === 'string') return <span style={{ color: '#a6e3a1' }}>"{data}"</span>
  if (typeof data === 'number') return <span style={{ color: '#74c7ec' }}>{String(data)}</span>
  if (typeof data === 'boolean') return <span style={{ color: '#cba6f7' }}>{String(data)}</span>
  if (typeof data === 'undefined') return <span style={{ color: '#6c7086' }}>undefined</span>

  const indent = { paddingLeft: `${depth * 18}px` }
  const toggle = (
    <span
      onClick={() => setCollapsed(!collapsed)}
      style={{
        cursor: 'pointer',
        userSelect: 'none',
        color: '#89b4fa',
        display: 'inline-block',
        width: '14px',
        textAlign: 'center',
        fontFamily: 'monospace',
      }}
    >
      {collapsed ? '▶' : '▼'}
    </span>
  )

  if (Array.isArray(data)) {
    if (data.length === 0) {
      return <span style={{ color: '#6c7086' }}>[]</span>
    }
    return (
      <div style={{ fontFamily: 'Consolas, Monaco, monospace', fontSize: '13px', lineHeight: '1.55' }}>
        <div style={indent}>
          {toggle}
          <span style={{ color: '#6c7086' }}>[</span>
          {collapsed && (
            <span style={{ color: '#6c7086', fontStyle: 'italic', marginLeft: '6px' }}>
              ... {data.length} 项
            </span>
          )}
          {collapsed && <span style={{ color: '#6c7086' }}>]</span>}
        </div>
        {!collapsed && (
          <>
            {data.map((item, i) => (
              <div key={i} style={{ paddingLeft: `${(depth + 1) * 18 + 14}px` }}>
                <span style={{ color: '#6c7086', marginRight: '6px' }}>{i}:</span>
                <TreeNode data={item} depth={depth + 1} isLast={i === data.length - 1} path={`${path}[${i}]`} />
                {i < data.length - 1 && <span style={{ color: '#6c7086' }}>,</span>}
              </div>
            ))}
            <div style={{ ...indent, paddingLeft: `${depth * 18 + 14}px` }}>
              <span style={{ color: '#6c7086' }}>]</span>
            </div>
          </>
        )}
      </div>
    )
  }

  if (data && typeof data === 'object') {
    const obj = data as Record<string, unknown>
    const keys = Object.keys(obj)
    if (keys.length === 0) {
      return <span style={{ color: '#6c7086' }}>{'{}'}</span>
    }
    return (
      <div style={{ fontFamily: 'Consolas, Monaco, monospace', fontSize: '13px', lineHeight: '1.55' }}>
        <div style={indent}>
          {toggle}
          <span style={{ color: '#6c7086' }}>{'{'}</span>
          {collapsed && (
            <span style={{ color: '#6c7086', fontStyle: 'italic', marginLeft: '6px' }}>
              ... {keys.length} 个字段
            </span>
          )}
          {collapsed && <span style={{ color: '#6c7086' }}>{'}'}</span>}
        </div>
        {!collapsed && (
          <>
            {keys.map((k, i) => (
              <div key={k} style={{ paddingLeft: `${(depth + 1) * 18 + 14}px` }}>
                <span style={{ color: '#f9e2af' }}>"{k}"</span>
                <span style={{ color: '#6c7086' }}>: </span>
                <TreeNode data={obj[k]} depth={depth + 1} isLast={i === keys.length - 1} path={path ? `${path}.${k}` : k} />
                {i < keys.length - 1 && <span style={{ color: '#6c7086' }}>,</span>}
              </div>
            ))}
            <div style={{ ...indent, paddingLeft: `${depth * 18 + 14}px` }}>
              <span style={{ color: '#6c7086' }}>{'}'}</span>
            </div>
          </>
        )}
      </div>
    )
  }

  return <span>{String(data)}</span>
})

// ========== 高亮显示的输出容器 ==========
type HighlightedTextProps = { text: string; title?: string; readOnly?: boolean; onChange?: (v: string) => void }
const HighlightedText = memo(function HighlightedText({ text }: HighlightedTextProps) {
  return (
    <div
      style={{
        flex: 1,
        padding: '14px 16px',
        overflow: 'auto',
        background: '#11111b',
        fontFamily: 'Consolas, Monaco, "Courier New", monospace',
        fontSize: '13px',
        lineHeight: '1.55',
        color: '#cdd6f4',
        whiteSpace: 'pre',
        tabSize: 2,
      }}
    >
      {highlightJSON(text)}
    </div>
  )
})

// ========== Diff 视图 ==========
type DiffViewProps = {
  diff: DiffOp[]
}
const DiffView = memo(function DiffView({ diff }: DiffViewProps) {
  const [filter, setFilter] = useState<'all' | 'changes' | 'added' | 'removed'>('all')
  const filtered = useMemo(() => {
    if (filter === 'all') return diff
    return diff.filter((d) => d.type === filter || (filter === 'changes' && d.type === 'changed'))
  }, [diff, filter])

  const summary = useMemo(() => {
    const added = diff.filter((d) => d.type === 'added').length
    const removed = diff.filter((d) => d.type === 'removed').length
    const changed = diff.filter((d) => d.type === 'changed').length
    return { added, removed, changed, total: diff.length }
  }, [diff])

  return (
    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
      <div
        style={{
          padding: '8px 12px',
          background: '#181825',
          borderBottom: '1px solid #313244',
          display: 'flex',
          alignItems: 'center',
          gap: '10px',
          fontSize: '12px',
        }}
      >
        <span style={{ color: '#a6e3a1' }}>共 {summary.total}</span>
        <span style={{ color: '#f38ba8' }}>新增 {summary.added}</span>
        <span style={{ color: '#fab387' }}>删除 {summary.removed}</span>
        <span style={{ color: '#f9e2af' }}>修改 {summary.changed}</span>
        <div style={{ flex: 1 }} />
        <div style={{ display: 'flex', gap: '4px' }}>
          {(['all', 'changes', 'added', 'removed'] as const).map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              style={{
                padding: '3px 10px',
                borderRadius: '4px',
                border: '1px solid #313244',
                background: filter === f ? '#89b4fa33' : 'transparent',
                color: filter === f ? '#89b4fa' : '#a6adc8',
                cursor: 'pointer',
                fontSize: '11px',
              }}
            >
              {f === 'all' ? '全部' : f === 'changes' ? '修改' : f === 'added' ? '新增' : '删除'}
            </button>
          ))}
        </div>
      </div>
      <div style={{ flex: 1, overflow: 'auto', padding: '8px 0', background: '#11111b' }}>
        {filtered.length === 0 && (
          <div style={{ padding: '20px', textAlign: 'center', color: '#6c7086', fontSize: '13px' }}>
            无差异
          </div>
        )}
        {filtered.map((d, i) => {
          let bg = 'transparent'
          let icon = ' '
          let iconColor = '#6c7086'
          if (d.type === 'added') { bg = 'rgba(166, 227, 161, 0.12)'; icon = '+'; iconColor = '#a6e3a1' }
          else if (d.type === 'removed') { bg = 'rgba(243, 139, 168, 0.12)'; icon = '-'; iconColor = '#f38ba8' }
          else if (d.type === 'changed') { bg = 'rgba(249, 226, 175, 0.12)'; icon = '~'; iconColor = '#f9e2af' }
          return (
            <div
              key={i}
              style={{
                display: 'flex',
                padding: '3px 14px',
                fontFamily: 'Consolas, Monaco, monospace',
                fontSize: '12.5px',
                lineHeight: '1.5',
                background: bg,
                color: '#cdd6f4',
                borderBottom: '1px solid #1e1e2e',
              }}
            >
              <span style={{ width: '18px', color: iconColor, fontWeight: 'bold', flexShrink: 0 }}>{icon}</span>
              <span style={{ color: '#89b4fa', marginRight: '8px', flexShrink: 0 }}>{d.key || '<root>'}</span>
              <span style={{ color: '#6c7086', marginRight: '6px' }}>=</span>
              <span style={{ wordBreak: 'break-all', whiteSpace: 'pre-wrap' }}>
                {d.type === 'removed' ? (
                  <span style={{ color: '#f38ba8' }}>{JSON.stringify(d.left)}</span>
                ) : d.type === 'added' ? (
                  <span style={{ color: '#a6e3a1' }}>{JSON.stringify(d.right)}</span>
                ) : d.type === 'changed' ? (
                  <span>
                    <span style={{ color: '#f38ba8', textDecoration: 'line-through', marginRight: '8px' }}>
                      {JSON.stringify(d.left)}
                    </span>
                    <span style={{ color: '#a6e3a1' }}>{JSON.stringify(d.right)}</span>
                  </span>
                ) : (
                  <span style={{ color: '#a6adc8' }}>{JSON.stringify(d.right)}</span>
                )}
              </span>
            </div>
          )
        })}
      </div>
    </div>
  )
})

// ========== Diff 双栏编辑器 ==========
type DiffEditorProps = {
  left: string
  right: string
  onLeftChange: (v: string) => void
  onRightChange: (v: string) => void
}
const DiffEditor = memo(function DiffEditor({ left, right, onLeftChange, onRightChange }: DiffEditorProps) {
  return (
    <div style={{ display: 'flex', height: '100%', minHeight: '260px', borderBottom: '1px solid #313244' }}>
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', borderRight: '1px solid #313244' }}>
        <div style={{ padding: '6px 14px', background: '#181825', fontSize: '12px', color: '#89b4fa', fontWeight: 600 }}>
          左侧 JSON (原始)
        </div>
        <textarea
          value={left}
          onChange={(e) => onLeftChange(e.target.value)}
          spellCheck={false}
          placeholder='粘贴或输入左侧 JSON...'
          style={{
            flex: 1,
            padding: '12px 14px',
            background: '#11111b',
            border: 'none',
            outline: 'none',
            resize: 'none',
            fontFamily: 'Consolas, Monaco, monospace',
            fontSize: '13px',
            color: '#cdd6f4',
            lineHeight: '1.55',
          }}
        />
      </div>
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
        <div style={{ padding: '6px 14px', background: '#181825', fontSize: '12px', color: '#a6e3a1', fontWeight: 600 }}>
          右侧 JSON (对比)
        </div>
        <textarea
          value={right}
          onChange={(e) => onRightChange(e.target.value)}
          spellCheck={false}
          placeholder='粘贴或输入右侧 JSON...'
          style={{
            flex: 1,
            padding: '12px 14px',
            background: '#11111b',
            border: 'none',
            outline: 'none',
            resize: 'none',
            fontFamily: 'Consolas, Monaco, monospace',
            fontSize: '13px',
            color: '#cdd6f4',
            lineHeight: '1.55',
          }}
        />
      </div>
    </div>
  )
})

// ========== 主组件 ==========
const JsonWorkbench = memo(function JsonWorkbench() {
  const [input, setInput] = useState<string>(SAMPLE_JSON)
  const [rightInput, setRightInput] = useState<string>(SAMPLE_JSON.replace('"2.4.0"', '"3.0.0"'))
  const [bottomTab, setBottomTab] = useState<BottomTab>('format')
  const [indentSize, setIndentSize] = useState<number>(2)
  const [pathQuery, setPathQuery] = useState<string>('')
  const [viewTree, setViewTree] = useState<boolean>(false)
  const [copyFlash, setCopyFlash] = useState<string>('')
  const [inputStats, setInputStats] = useState<{ chars: number; lines: number; size: string }>({ chars: 0, lines: 0, size: '0 B' })
  const [largeMode, setLargeMode] = useState<boolean>(false)
  const copyTimerRef = useRef<number | null>(null)

  // 统计
  useEffect(() => {
    const chars = input.length
    const lines = input.split('\n').length
    const kb = chars / 1024
    const size = kb > 1024 ? `${(kb / 1024).toFixed(2)} MB` : `${kb.toFixed(1)} KB`
    setInputStats({ chars, lines, size })
    setLargeMode(kb > 500)
  }, [input])

  // 校验
  const validation = useMemo(() => {
    if (!input.trim()) return { valid: false, error: '输入为空' }
    const result = tryParseJSON(input)
    if (result.ok) {
      const size = new Blob([input]).size
      return { valid: true, error: '', value: result.value, size }
    }
    return { valid: false, error: result.error }
  }, [input])

  // 格式化输出
  const formatOutput = useMemo(() => {
    if (bottomTab !== 'format') return ''
    if (!validation.valid) return ''
    try {
      return JSON.stringify(validation.value, null, indentSize)
    } catch {
      return ''
    }
  }, [bottomTab, validation, indentSize])

  // 压缩输出
  const minifyOutput = useMemo(() => {
    if (bottomTab !== 'minify') return ''
    if (!validation.valid) return ''
    try {
      return JSON.stringify(validation.value)
    } catch {
      return ''
    }
  }, [bottomTab, validation])

  // Schema 输出
  const schemaOutput = useMemo(() => {
    if (bottomTab !== 'schema') return ''
    if (!validation.valid) return ''
    try {
      return generateSchema(validation.value, 'Root')
    } catch {
      return ''
    }
  }, [bottomTab, validation])

  // TS 输出
  const typescriptOutput = useMemo(() => {
    if (bottomTab !== 'typescript') return ''
    if (!validation.valid) return ''
    try {
      return generateTypeScript(validation.value, 'Root')
    } catch {
      return ''
    }
  }, [bottomTab, validation])

  // Diff
  const diffOutput = useMemo(() => {
    if (bottomTab !== 'diff') return [] as DiffOp[]
    const left = tryParseJSON(input)
    const right = tryParseJSON(rightInput)
    if (!left.ok || !right.ok) return []
    return diffValues(left.value, right.value)
  }, [bottomTab, input, rightInput])

  // JSONPath 查询结果
  const pathResult = useMemo(() => {
    if (!pathQuery.trim()) return null
    if (!validation.valid) return { success: false, error: 'JSON 无效' }
    return execJSONPath(validation.value, pathQuery)
  }, [pathQuery, validation])

  const pathResultText = useMemo(() => {
    if (!pathResult) return ''
    if (pathResult.success) {
      try {
        return JSON.stringify(pathResult.value, null, 2)
      } catch {
        return String(pathResult.value)
      }
    }
    return pathResult.error || '未知错误'
  }, [pathResult])

  // 当前要显示的输出文本
  const currentOutputText = useMemo(() => {
    if (pathResult) return pathResultText
    switch (bottomTab) {
      case 'format': return formatOutput
      case 'minify': return minifyOutput
      case 'schema': return schemaOutput
      case 'typescript': return typescriptOutput
      case 'diff': return ''
    }
  }, [bottomTab, formatOutput, minifyOutput, schemaOutput, typescriptOutput, pathResult, pathResultText])

  // ========== 操作函数 ==========
  const flashCopy = useCallback((msg: string) => {
    setCopyFlash(msg)
    if (copyTimerRef.current) window.clearTimeout(copyTimerRef.current)
    copyTimerRef.current = window.setTimeout(() => setCopyFlash(''), 1800)
  }, [])

  const handleCopy = useCallback(async (text: string, label = '已复制') => {
    if (!text) { flashCopy('无内容可复制'); return }
    try {
      await navigator.clipboard.writeText(text)
      flashCopy(label)
    } catch {
      flashCopy('复制失败')
    }
  }, [flashCopy])

  const handleFormat = useCallback(() => {
    try {
      setInput(tryFormat(input, indentSize))
      flashCopy('已格式化')
    } catch {
      flashCopy('格式化失败')
    }
  }, [input, indentSize, flashCopy])

  const handleMinify = useCallback(() => {
    try {
      setInput(tryMinify(input))
      flashCopy('已压缩')
    } catch {
      flashCopy('压缩失败')
    }
  }, [input, flashCopy])

  const handleValidate = useCallback(() => {
    if (validation.valid) flashCopy('✓ JSON 有效')
    else flashCopy('✗ JSON 无效')
  }, [validation, flashCopy])

  const handleClear = useCallback(() => {
    setInput('')
    setRightInput('')
    setPathQuery('')
    flashCopy('已清空')
  }, [flashCopy])

  const handleLoadSample = useCallback(() => {
    setInput(SAMPLE_JSON)
    setRightInput(SAMPLE_JSON.replace('"2.4.0"', '"3.0.0"'))
    flashCopy('已加载示例')
  }, [flashCopy])

  // ========== 样式常量 ==========
  const mainBg = '#1e1e2e'
  const panelBg = '#181825'
  const borderColor = '#313244'
  const accentColor = '#89b4fa'

  const toolbarBtnStyle = (active?: boolean): React.CSSProperties => ({
    padding: '6px 14px',
    borderRadius: '6px',
    border: `1px solid ${borderColor}`,
    background: active ? `${accentColor}22` : '#313244',
    color: active ? accentColor : '#cdd6f4',
    cursor: 'pointer',
    fontSize: '12.5px',
    fontWeight: active ? 600 : 400,
    transition: 'all 0.15s',
  })

  const tabs: { key: BottomTab; label: string; icon: string }[] = [
    { key: 'format', label: '格式化', icon: '{}' },
    { key: 'minify', label: '压缩', icon: '⇅' },
    { key: 'diff', label: 'Diff', icon: '⇌' },
    { key: 'schema', label: 'Schema', icon: '⌘' },
    { key: 'typescript', label: 'TypeScript', icon: 'TS' },
  ]

  // 计算树形视图可显示
  const canShowTree = viewTree && validation.valid && !!validation.value && !pathResult

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        height: '100%',
        background: mainBg,
        color: '#cdd6f4',
        fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "PingFang SC", sans-serif',
        overflow: 'hidden',
      }}
    >
      {/* ========== 头部 ========== */}
      <div
        style={{
          padding: '10px 18px',
          background: panelBg,
          borderBottom: `1px solid ${borderColor}`,
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
              background: 'linear-gradient(135deg, #89b4fa, #cba6f7)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '14px',
              fontWeight: 700,
              color: '#1e1e2e',
            }}
          >
            {}
          </div>
          <div>
            <div style={{ fontWeight: 600, fontSize: '14px', color: '#cdd6f4' }}>JSON 工作台</div>
            <div style={{ fontSize: '11px', color: '#6c7086' }}>格式化 · Diff · Schema · TypeScript</div>
          </div>
        </div>

        <div style={{ flex: 1 }} />

        {validation.valid ? (
          <div style={{ fontSize: '12px', color: '#a6e3a1', display: 'flex', alignItems: 'center', gap: '6px' }}>
            <span style={{ width: '7px', height: '7px', borderRadius: '50%', background: '#a6e3a1', display: 'inline-block' }} />
            有效 JSON
          </div>
        ) : input.trim() ? (
          <div style={{ fontSize: '12px', color: '#f38ba8', display: 'flex', alignItems: 'center', gap: '6px' }}>
            <span style={{ width: '7px', height: '7px', borderRadius: '50%', background: '#f38ba8', display: 'inline-block' }} />
            {validation.error}
          </div>
        ) : (
          <div style={{ fontSize: '12px', color: '#6c7086' }}>等待输入...</div>
        )}
      </div>

      {/* ========== 工具栏 ========== */}
      <div
        style={{
          display: 'flex',
          padding: '10px 18px',
          background: panelBg,
          borderBottom: `1px solid ${borderColor}`,
          gap: '10px',
          alignItems: 'center',
          flexWrap: 'wrap',
        }}
      >
        <button onClick={handleFormat} style={toolbarBtnStyle()} title="格式化 JSON">
          ✨ 格式化
        </button>
        <button onClick={handleMinify} style={toolbarBtnStyle()} title="压缩 JSON">
          ⇅ 压缩
        </button>
        <button onClick={handleValidate} style={toolbarBtnStyle()} title="校验 JSON">
          ✓ 校验
        </button>
        <button onClick={handleLoadSample} style={toolbarBtnStyle()} title="加载示例">
          📄 示例
        </button>
        <button onClick={handleClear} style={{ ...toolbarBtnStyle(), color: '#f38ba8' }} title="清空">
          🗑 清空
        </button>

        <div style={{ width: '1px', height: '20px', background: borderColor, margin: '0 4px' }} />

        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12px' }}>
          <span style={{ color: '#6c7086' }}>缩进:</span>
          <select
            value={indentSize}
            onChange={(e) => setIndentSize(Number(e.target.value))}
            style={{
              padding: '4px 8px',
              borderRadius: '4px',
              border: `1px solid ${borderColor}`,
              background: '#313244',
              color: '#cdd6f4',
              fontSize: '12px',
              outline: 'none',
            }}
          >
            <option value={2}>2 空格</option>
            <option value={4}>4 空格</option>
            <option value={8}>Tab</option>
          </select>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          <label
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              fontSize: '12px',
              color: '#a6adc8',
              cursor: 'pointer',
            }}
          >
            <input
              type="checkbox"
              checked={viewTree}
              onChange={(e) => setViewTree(e.target.checked)}
              style={{ accentColor }}
            />
            树形视图
          </label>
        </div>

        <div style={{ flex: 1 }} />

        {largeMode && (
          <div style={{ fontSize: '11px', color: '#fab387', background: '#fab38722', padding: '3px 8px', borderRadius: '4px' }}>
            ⚠ 大数据模式 ({inputStats.size})
          </div>
        )}

        <div style={{ fontSize: '11px', color: '#6c7086' }}>
          {inputStats.lines} 行 · {inputStats.chars} 字符 · {inputStats.size}
        </div>

        <button
          onClick={() => handleCopy(currentOutputText || input, '✓ 已复制全部输出')}
          style={{ ...toolbarBtnStyle(), background: '#89b4fa33', color: accentColor, borderColor: accentColor }}
          title="复制全部输出"
        >
          📋 复制全部
        </button>
      </div>

      {/* ========== 错误提示 ========== */}
      {!validation.valid && input.trim() && (
        <div
          style={{
            padding: '8px 20px',
            background: 'rgba(243, 139, 168, 0.12)',
            borderBottom: '1px solid rgba(243, 139, 168, 0.3)',
            color: '#f38ba8',
            fontSize: '12px',
            fontFamily: 'Consolas, Monaco, monospace',
          }}
        >
          ⚠ {validation.error}
        </div>
      )}

      {/* ========== 主编辑区 ========== */}
      <div style={{ flex: 1, display: 'flex', overflow: 'hidden', minHeight: 0 }}>
        {/* 左侧：输入 */}
        <div style={{ flex: 1.1, display: 'flex', flexDirection: 'column', borderRight: `1px solid ${borderColor}`, minWidth: 0 }}>
          <div
            style={{
              padding: '7px 18px',
              background: panelBg,
              borderBottom: `1px solid ${borderColor}`,
              fontSize: '12px',
              fontWeight: 600,
              color: '#89b4fa',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
            }}
          >
            <span>📝 JSON 输入</span>
            {validation.valid && (
              <span style={{ fontSize: '11px', color: '#6c7086', fontWeight: 400 }}>
                {inputStats.chars.toLocaleString()} 字符
              </span>
            )}
          </div>
          <textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            spellCheck={false}
            placeholder='在此粘贴或输入 JSON 数据...'
            style={{
              flex: 1,
              padding: '14px 18px',
              background: '#11111b',
              border: 'none',
              outline: 'none',
              resize: 'none',
              fontFamily: 'Consolas, Monaco, "Courier New", monospace',
              fontSize: '13px',
              color: '#cdd6f4',
              lineHeight: '1.55',
              tabSize: indentSize,
              whiteSpace: 'pre',
              overflow: 'auto',
            }}
          />
        </div>

        {/* 右侧：输出 */}
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minWidth: 0 }}>
          <div
            style={{
              padding: '7px 18px',
              background: panelBg,
              borderBottom: `1px solid ${borderColor}`,
              fontSize: '12px',
              fontWeight: 600,
              color: '#a6e3a1',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
            }}
          >
            <span>📊 {pathResult ? 'JSONPath 查询结果' : tabs.find((t) => t.key === bottomTab)?.label + ' 输出'}</span>
            <button
              onClick={() => handleCopy(currentOutputText, '✓ 已复制')}
              style={{
                background: 'transparent',
                border: 'none',
                color: '#6c7086',
                cursor: 'pointer',
                fontSize: '11px',
                padding: '0',
              }}
            >
              复制
            </button>
          </div>

          {/* JSONPath 输入 */}
          <div
            style={{
              display: 'flex',
              gap: '8px',
              padding: '8px 18px',
              background: panelBg,
              borderBottom: `1px solid ${borderColor}`,
              alignItems: 'center',
            }}
          >
            <span style={{ fontSize: '11px', color: '#6c7086', flexShrink: 0 }}>JSONPath:</span>
            <input
              value={pathQuery}
              onChange={(e) => setPathQuery(e.target.value)}
              placeholder="$.stats.users 或 $.features[0]"
              style={{
                flex: 1,
                padding: '5px 10px',
                borderRadius: '4px',
                border: `1px solid ${borderColor}`,
                background: '#11111b',
                color: '#cdd6f4',
                fontSize: '12px',
                fontFamily: 'Consolas, Monaco, monospace',
                outline: 'none',
              }}
            />
            {pathQuery && (
              <button
                onClick={() => setPathQuery('')}
                style={{
                  background: 'transparent',
                  border: '1px solid',
                  borderColor: borderColor,
                  color: '#6c7086',
                  cursor: 'pointer',
                  padding: '3px 10px',
                  borderRadius: '4px',
                  fontSize: '11px',
                }}
              >
                清除
              </button>
            )}
          </div>

          {/* 输出内容 */}
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden', minHeight: 0 }}>
            {canShowTree && validation.value !== null ? (
              <div
                style={{
                  flex: 1,
                  padding: '14px 18px',
                  overflow: 'auto',
                  background: '#11111b',
                  color: '#cdd6f4',
                }}
              >
                <TreeNode data={validation.value as unknown} />
              </div>
            ) : pathResult ? (
              pathResult.success ? (
                <HighlightedText text={pathResultText} />
              ) : (
                <div
                  style={{
                    flex: 1,
                    padding: '14px 18px',
                    background: '#11111b',
                    color: '#f38ba8',
                    fontFamily: 'Consolas, Monaco, monospace',
                    fontSize: '13px',
                  }}
                >
                  ❌ {pathResult.error}
                </div>
              )
            ) : bottomTab === 'diff' ? (
              <DiffView diff={diffOutput} />
            ) : !validation.valid ? (
              <div
                style={{
                  flex: 1,
                  padding: '20px',
                  background: '#11111b',
                  color: '#6c7086',
                  fontFamily: 'Consolas, Monaco, monospace',
                  fontSize: '13px',
                  overflow: 'auto',
                }}
              >
                JSON 无效，无法生成输出
              </div>
            ) : currentOutputText ? (
              <HighlightedText text={currentOutputText} />
            ) : (
              <div
                style={{
                  flex: 1,
                  padding: '20px',
                  background: '#11111b',
                  color: '#6c7086',
                  fontSize: '13px',
                  overflow: 'auto',
                }}
              >
                {bottomTab === 'format' && '点击"格式化"按钮或切换标签页查看输出'}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ========== 底部标签页 ========== */}
      <div
        style={{
          background: panelBg,
          borderTop: `1px solid ${borderColor}`,
          display: 'flex',
          flexDirection: 'column',
        }}
      >
        {bottomTab === 'diff' && (
          <DiffEditor left={input} right={rightInput} onLeftChange={setInput} onRightChange={setRightInput} />
        )}

        <div
          style={{
            display: 'flex',
            padding: '0 18px',
            alignItems: 'center',
            gap: '4px',
            borderTop: bottomTab === 'diff' ? 'none' : 'none',
          }}
        >
          {tabs.map((tab) => (
            <button
              key={tab.key}
              onClick={() => setBottomTab(tab.key)}
              style={{
                padding: '10px 16px',
                background: 'transparent',
                border: 'none',
                borderBottom: `2px solid ${bottomTab === tab.key ? accentColor : 'transparent'}`,
                color: bottomTab === tab.key ? accentColor : '#a6adc8',
                cursor: 'pointer',
                fontSize: '13px',
                fontWeight: bottomTab === tab.key ? 600 : 400,
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                transition: 'color 0.15s, border-color 0.15s',
              }}
            >
              <span style={{ fontFamily: 'Consolas, Monaco, monospace', fontSize: '11px', color: '#6c7086' }}>
                {tab.icon}
              </span>
              {tab.label}
            </button>
          ))}

          <div style={{ flex: 1 }} />

          <button
            onClick={() => handleCopy(currentOutputText || input, '✓ 已复制')}
            style={{
              padding: '5px 12px',
              margin: '6px 0',
              borderRadius: '5px',
              border: `1px solid ${accentColor}`,
              background: `${accentColor}22`,
              color: accentColor,
              cursor: 'pointer',
              fontSize: '12px',
              fontWeight: 600,
            }}
          >
            📋 复制当前输出
          </button>
        </div>
      </div>

      {/* ========== 复制提示 ========== */}
      {copyFlash && (
        <div
          style={{
            position: 'fixed',
            bottom: '24px',
            left: '50%',
            transform: 'translateX(-50%)',
            padding: '10px 22px',
            background: '#a6e3a1',
            color: '#1e1e2e',
            borderRadius: '8px',
            fontSize: '13px',
            fontWeight: 600,
            boxShadow: '0 6px 20px rgba(0,0,0,0.35)',
            zIndex: 9999,
            animation: 'fadeIn 0.2s',
          }}
        >
          {copyFlash}
        </div>
      )}
    </div>
  )
})

export default JsonWorkbench
