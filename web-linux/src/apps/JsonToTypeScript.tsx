import { useState, useCallback, useMemo, useRef, type ReactNode, type CSSProperties, type MouseEvent as ReactMouseEvent } from 'react'
import { FileJsonIcon, CopyIcon, DownloadIcon, CheckCircleIcon, RefreshCwIcon } from '../icons'

const AlertCircle = ({ size = 16, color }: { size?: number; color?: string }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color || 'currentColor'} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="10" /><line x1="12" y1="8" x2="12" y2="12" /><line x1="12" y1="16" x2="12.01" y2="16" />
  </svg>
)

const Braces = ({ size = 16, style }: { size?: number; style?: CSSProperties }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={style}>
    <path d="M8 3H7a2 2 0 0 0-2 2v5a2 2 0 0 1-2 2 2 2 0 0 1 2 2v5a2 2 0 0 0 2 2h1" /><path d="M16 3h1a2 2 0 0 1 2 2v5a2 2 0 0 0 2 2 2 2 0 0 0-2 2v5a2 2 0 0 1-2 2h-1" />
  </svg>
)

const FileCode = ({ size = 16 }: { size?: number }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" /><polyline points="14 2 14 8 20 8" /><path d="m10 13-2 2 2 2" /><path d="m14 17 2-2-2-2" />
  </svg>
)

// ========== 颜色常量 ==========
const COLORS = {
  bg: 'var(--bg-primary, #0f0f1a)',
  bgSecondary: 'var(--bg-secondary, #1a1a2e)',
  bgTertiary: 'var(--bg-tertiary, #16213e)',
  text: 'var(--text-primary, #e0e0e8)',
  textSecondary: 'var(--text-secondary, #9090a4)',
  accent: 'var(--accent, #7c6cf0)',
  border: 'var(--window-border, rgba(255,255,255,0.08))',
  radius: 'var(--window-radius, 12px)',
  editorBg: '#0d1117',
  success: '#3fb950',
  error: '#f85149',
  warning: '#d29922',
  btnBg: 'rgba(255,255,255,0.06)',
  btnHover: 'rgba(255,255,255,0.12)',
  hoverBg: 'rgba(124,108,240,0.1)',
}

// ========== 示例数据 ==========
const SAMPLES = [
  {
    name: '用户信息',
    data: {
      id: 1001,
      name: '张三',
      email: 'zhangsan@example.com',
      age: 28,
      isActive: true,
      roles: ['admin', 'editor'],
      address: {
        street: '科技大道 123 号',
        city: '深圳',
        country: '中国',
        zip: '518000',
      },
      metadata: null,
      friends: [
        { id: 1002, name: '李四' },
        { id: 1003, name: '王五', nickname: '小王' },
      ],
    },
  },
  {
    name: 'API 响应',
    data: {
      status: 200,
      message: 'success',
      data: {
        total: 150,
        page: 1,
        pageSize: 20,
        items: [
          {
            id: 'post_001',
            title: 'TypeScript 入门指南',
            content: '本文介绍 TypeScript 的基础用法...',
            author: { id: 'u1', name: '作者A' },
            tags: ['typescript', 'programming'],
            views: 2580,
            likes: 186,
            isPublished: true,
            publishedAt: '2024-01-15T10:30:00Z',
            comments: [
              { userId: 'u2', text: '写得很好！', timestamp: '2024-01-15T11:00:00Z' },
            ],
          },
        ],
      },
      pagination: {
        hasNext: true,
        nextCursor: 'eyJpZCI6InBvc3RfMDAxIn0=',
      },
    },
  },
  {
    name: '配置对象',
    data: {
      appName: 'WebLinuxOS',
      version: '3.0.0',
      debug: false,
      port: 8080,
      database: {
        host: 'localhost',
        port: 5432,
        name: 'weblinuxos',
        pool: { min: 2, max: 10 },
      },
      cache: {
        enabled: true,
        ttl: 3600,
        strategy: 'lru',
      },
      features: {
        darkMode: true,
        i18n: true,
        analytics: false,
        experimental: { wasm: true, workers: false },
      },
      logging: {
        level: 'info',
        transports: ['console', 'file'],
        rotation: { maxFiles: 5, maxSize: '10mb' },
      },
    },
  },
]

// ========== JSON 解析 ==========
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

// ========== JSON 统计 ==========
function getJsonStats(value: unknown): { depth: number; properties: number; size: string } {
  let depth = 0
  let properties = 0

  function traverse(v: unknown, d: number): void {
    if (d > depth) depth = d
    if (v !== null && typeof v === 'object') {
      if (Array.isArray(v)) {
        for (const item of v) traverse(item, d + 1)
      } else {
        const obj = v as Record<string, unknown>
        const keys = Object.keys(obj)
        properties += keys.length
        for (const k of keys) traverse(obj[k], d + 1)
      }
    }
  }
  traverse(value, 0)

  const raw = JSON.stringify(value)
  let size: string
  if (raw.length > 1024 * 1024) size = (raw.length / 1024 / 1024).toFixed(1) + ' MB'
  else if (raw.length > 1024) size = (raw.length / 1024).toFixed(1) + ' KB'
  else size = raw.length + ' B'

  return { depth, properties, size }
}

// ========== 类型推断 ==========
interface TypeContext {
  interfaces: Map<string, string>
  nameCounter: number
  useTypeAlias: boolean
}

function inferType(value: unknown, name: string, ctx: TypeContext): string {
  if (value === null) return 'null'
  if (value === undefined) return 'void'
  if (typeof value === 'string') return 'string'
  if (typeof value === 'number') {
    return Number.isInteger(value) ? 'number' : 'number'
  }
  if (typeof value === 'boolean') return 'boolean'

  if (Array.isArray(value)) {
    return inferArrayType(value, name, ctx)
  }

  if (typeof value === 'object') {
    return inferObjectType(value as Record<string, unknown>, name, ctx)
  }
  return 'unknown'
}

function inferArrayType(arr: unknown[], name: string, ctx: TypeContext): string {
  if (arr.length === 0) return 'unknown[]'

  const types = new Set<string>()
  for (const item of arr) {
    types.add(inferType(item, name + 'Item', ctx))
  }

  if (types.size === 1) {
    const inner = [...types][0]
    if (inner.endsWith('[]') || inner.includes('interface') || inner === 'unknown[]') {
      return `(${inner})[]`
    }
    return `${inner}[]`
  }

  const unionMembers = [...types].sort().join(' | ')
  return `(${unionMembers})[]`
}

function inferObjectType(obj: Record<string, unknown>, name: string, ctx: TypeContext): string {
  const keys = Object.keys(obj)
  if (keys.length === 0) return 'Record<string, unknown>'

  const safeName = makeValidName(name)

  if (ctx.interfaces.has(safeName)) {
    return safeName
  }

  const fields: string[] = []
  const allKeys = new Set<string>()

  // Collect all keys from all objects of same type (for optional detection)
  for (const key of keys) {
    allKeys.add(key)
  }

  for (const key of keys) {
    const val = obj[key]
    const fieldType = inferType(val, safeName + capitalize(key), ctx)
    fields.push(`  ${key}: ${fieldType};`)
  }

  const interfaceName = safeName

  if (ctx.useTypeAlias) {
    const lines = fields.map(f => f).join('\n')
    ctx.interfaces.set(interfaceName, `type ${interfaceName} = {\n${lines}\n}`)
  } else {
    const lines = fields.map(f => f).join('\n')
    ctx.interfaces.set(interfaceName, `interface ${interfaceName} {\n${lines}\n}`)
  }

  return interfaceName
}

function makeValidName(name: string): string {
  let clean = name.replace(/[^a-zA-Z0-9_$]/g, '')
  if (clean.length === 0) clean = 'Type'
  if (/^[0-9]/.test(clean)) clean = '_' + clean
  // Ensure PascalCase
  clean = clean.charAt(0).toUpperCase() + clean.slice(1)
  return clean || 'Type'
}

function capitalize(s: string): string {
  if (!s) return s
  return s.charAt(0).toUpperCase() + s.slice(1)
}

// ========== 主转换函数 ==========
function jsonToTypeScript(value: unknown, rootName: string, useTypeAlias: boolean): string {
  const ctx: TypeContext = {
    interfaces: new Map(),
    nameCounter: 0,
    useTypeAlias,
  }

  // Process root value
  const rootType = inferType(value, rootName, ctx)

  // Build output
  const sections: string[] = []

  // If root is an object, its interface was already added
  // If root is an array, we need a root type alias
  if (Array.isArray(value)) {
    if (useTypeAlias) {
      sections.push(`type ${rootName} = ${rootType}`)
    } else {
      sections.push(`type ${rootName} = ${rootType}`)
    }
  }

  // Add all collected interfaces/types
  const sortedEntries = [...ctx.interfaces.entries()].sort((a, b) => {
    // Root object first
    if (a[0] === rootName && !Array.isArray(value)) return -1
    if (b[0] === rootName && !Array.isArray(value)) return 1
    return a[0].localeCompare(b[0])
  })

  for (const [name, def] of sortedEntries) {
    // For non-root object types, output them
    if (name === rootName && !Array.isArray(value)) {
      // Root object - already output as first entry
      sections.unshift(def)
    } else {
      sections.push(def)
    }
  }

  return sections.join('\n\n')
}

// ========== 添加可选属性检测 ==========
function jsonToTypeScriptAdvanced(value: unknown, rootName: string, useTypeAlias: boolean): string {
  const ctx: TypeContext = {
    interfaces: new Map(),
    nameCounter: 0,
    useTypeAlias,
  }

  inferType(value, rootName, ctx)

  // Post-process: check for optional properties in arrays of objects
  if (Array.isArray(value) && value.length > 1) {
    addOptionalProperties(value, rootName, ctx)
  }

  const sections: string[] = []
  const sortedEntries = [...ctx.interfaces.entries()].sort((a, b) => {
    if (a[0] === rootName) return -1
    if (b[0] === rootName) return 1
    return a[0].localeCompare(b[0])
  })

  for (const [, def] of sortedEntries) {
    sections.push(def)
  }

  return sections.join('\n\n')
}

function addOptionalProperties(arr: unknown[], name: string, ctx: TypeContext): void {
  // Check if all items are objects
  const objects = arr.filter(item => item !== null && typeof item === 'object' && !Array.isArray(item)) as Record<string, unknown>[]
  if (objects.length < 2) return

  // Collect all keys and count occurrences
  const keyCount = new Map<string, number>()
  for (const obj of objects) {
    for (const key of Object.keys(obj)) {
      keyCount.set(key, (keyCount.get(key) || 0) + 1)
    }
  }

  // If some keys are missing in some objects, mark them as optional
  const hasOptional = [...keyCount.values()].some(c => c < objects.length)
  if (!hasOptional) return

  const safeName = makeValidName(name)
  const existing = ctx.interfaces.get(safeName)
  if (!existing) return

  // Rebuild the interface with optional markers
  const fields: string[] = []
  for (const obj of objects) {
    for (const key of Object.keys(obj)) {
      if (!fields.some(f => f.startsWith(`  ${key}:`))) {
        const val = obj[key]
        const fieldType = inferType(val, safeName + capitalize(key), ctx)
        const isOptional = keyCount.get(key)! < objects.length
        fields.push(`  ${key}${isOptional ? '?' : ''}: ${fieldType};`)
      }
    }
    break // Only use first object for field order
  }

  if (ctx.useTypeAlias) {
    ctx.interfaces.set(safeName, `type ${safeName} = {\n${fields.join('\n')}\n}`)
  } else {
    ctx.interfaces.set(safeName, `interface ${safeName} {\n${fields.join('\n')}\n}`)
  }
}

// ========== 语法高亮（TypeScript） ==========
function highlightTypeScript(text: string): ReactNode {
  if (!text) return null
  const lines = text.split('\n')
  let key = 0

  return lines.map((line, lineIdx) => {
    const nodes: ReactNode[] = []

    // Keywords
    const kwRegex = /\b(interface|type|export|import|from|const|let|var|function|class|extends|implements|new|return|if|else|for|while|do|switch|case|break|continue|throw|try|catch|finally|async|await|readonly|static|public|private|protected|abstract|enum|namespace|declare|module|keyof|typeof|instanceof|in|of|as|is|infer|never|undefined|void|string|number|boolean|any|unknown|object|null|symbol|bigint)\b/g
    // Strings
    const strRegex = /(["'`])(?:(?!\1|\\).|\\.)*\1/g
    // Comments
    const commentRegex = /(\/\/.*$)/gm
    // Types/interfaces after : or = or < or >
    const typeRef = /:\s*([A-Z][a-zA-Z0-9]*)/g
    // Punctuation
    const punctRegex = /([{}()\[\];,.<>=!&|?:])/g

    let lastIdx = 0
    const allMatches: Array<{ start: number; end: number; type: string; text: string }> = []

    // Collect all matches
    let m: RegExpExecArray | null

    const kwc = new RegExp(kwRegex.source, kwRegex.flags)
    while ((m = kwc.exec(line)) !== null) {
      allMatches.push({ start: m.index, end: m.index + m[0].length, type: 'keyword', text: m[0] })
    }

    const strc = new RegExp(strRegex.source, strRegex.flags)
    while ((m = strc.exec(line)) !== null) {
      allMatches.push({ start: m.index, end: m.index + m[0].length, type: 'string', text: m[0] })
    }

    const comc = new RegExp(commentRegex.source, commentRegex.flags)
    while ((m = comc.exec(line)) !== null) {
      allMatches.push({ start: m.index, end: m.index + m[0].length, type: 'comment', text: m[0] })
    }

    // Sort by start position
    allMatches.sort((a, b) => a.start - b.start)

    // Remove overlapping matches
    const filtered: typeof allMatches = []
    let maxEnd = 0
    for (const match of allMatches) {
      if (match.start >= maxEnd) {
        filtered.push(match)
        maxEnd = match.end
      }
    }

    // Build nodes
    for (const match of filtered) {
      if (match.start > lastIdx) {
        nodes.push(<span key={`t${key++}`}>{line.slice(lastIdx, match.start)}</span>)
      }
      const color = match.type === 'keyword' ? '#c678dd'
        : match.type === 'string' ? '#98c379'
        : match.type === 'comment' ? '#5c6370'
        : COLORS.text
      nodes.push(<span key={`m${key++}`} style={{ color }}>{match.text}</span>)
      lastIdx = match.end
    }

    if (lastIdx < line.length) {
      // Highlight remaining - try to color type names and punctuation
      const remaining = line.slice(lastIdx)
      const remainingNodes: ReactNode[] = []
      let rLastIdx = 0

      // Type references
      const trRegex = /:\s*([A-Z][a-zA-Z0-9]*)/g
      let trMatch: RegExpExecArray | null
      const trc = new RegExp(trRegex.source, trRegex.flags)
      while ((trMatch = trc.exec(remaining)) !== null) {
        if (trMatch.index > rLastIdx) {
          remainingNodes.push(<span key={`rt${key++}`}>{remaining.slice(rLastIdx, trMatch.index)}</span>)
        }
        // Color the colon separately
        remainingNodes.push(<span key={`rc${key++}`}>{trMatch[0].charAt(0)}</span>)
        remainingNodes.push(<span key={`rn${key++}`} style={{ color: '#61afef' }}>{trMatch[1]}</span>)
        rLastIdx = trMatch.index + trMatch[0].length
      }

      // Punctuation in what's left
      if (rLastIdx < remaining.length) {
        remainingNodes.push(<span key={`re${key++}`}>{remaining.slice(rLastIdx)}</span>)
      }

      if (remainingNodes.length > 0) {
        nodes.push(...remainingNodes)
      } else {
        nodes.push(<span key={`end${key++}`}>{remaining}</span>)
      }
    }

    return (
      <div key={lineIdx} style={{ minHeight: '1.5em' }}>
        {nodes.length === 0 ? '\u00A0' : nodes}
      </div>
    )
  })
}

// ========== JSON 语法高亮 ==========
function highlightJSON(text: string): ReactNode {
  if (!text) return null
  const lines = text.split('\n')
  let key = 0

  return lines.map((line, lineIdx) => {
    const nodes: ReactNode[] = []
    const regex = /("(?:\\.|[^"\\])*"\s*:)|("(?:\\.|[^"\\])*")|(\b(?:true|false|null)\b)|(-?\d+\.?\d*(?:[eE][+-]?\d+)?)|([{}\[\],])/g
    let lastIndex = 0
    let match: RegExpExecArray | null
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
      nodes.push(<span key={`end${key++}`}>{line.slice(lastIndex, line.length)}</span>)
    }
    return (
      <div key={lineIdx} style={{ minHeight: '1.5em' }}>
        {nodes.length === 0 ? '\u00A0' : nodes}
      </div>
    )
  })
}

// ========== 主组件 ==========
export default function JsonToTypeScript() {
  const [input, setInput] = useState('')
  const [useTypeAlias, setUseTypeAlias] = useState(false)
  const [splitRatio, setSplitRatio] = useState(0.5)
  const [copied, setCopied] = useState(false)
  const [sampleIdx, setSampleIdx] = useState(-1)
  const containerRef = useRef<HTMLDivElement>(null)
  const dragging = useRef(false)

  // 解析 JSON
  const parseResult = useMemo(() => tryParseJSON(input), [input])

  // 生成 TypeScript
  const output = useMemo(() => {
    if (!parseResult.ok || input.trim() === '') return ''
    try {
      return jsonToTypeScriptAdvanced(parseResult.value, 'RootObject', useTypeAlias)
    } catch {
      return '// 生成失败，请检查输入'
    }
  }, [parseResult, input, useTypeAlias])

  // JSON 统计
  const stats = useMemo(() => {
    if (!parseResult.ok || input.trim() === '') return null
    return getJsonStats(parseResult.value)
  }, [parseResult, input])

  // 格式化 JSON
  const handleFormat = useCallback(() => {
    if (!parseResult.ok) return
    try {
      const formatted = JSON.stringify(parseResult.value, null, 2)
      setInput(formatted)
    } catch {}
  }, [parseResult])

  // 复制到剪贴板
  const handleCopy = useCallback(() => {
    if (!output) return
    navigator.clipboard.writeText(output).then(() => {
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    })
  }, [output])

  // 下载 .ts 文件
  const handleDownload = useCallback(() => {
    if (!output) return
    const blob = new Blob([output], { type: 'text/typescript' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = 'types.ts'
    a.click()
    URL.revokeObjectURL(url)
  }, [output])

  // 加载示例
  const handleLoadSample = useCallback((idx: number) => {
    setSampleIdx(idx)
    setInput(JSON.stringify(SAMPLES[idx].data, null, 2))
  }, [])

  // 拖拽分割
  const handleDragStart = useCallback((e: ReactMouseEvent) => {
    e.preventDefault()
    dragging.current = true
    const container = containerRef.current
    if (!container) return
    const rect = container.getBoundingClientRect()

    const onMove = (ev: MouseEvent) => {
      if (!dragging.current) return
      const ratio = (ev.clientX - rect.left) / rect.width
      setSplitRatio(Math.max(0.2, Math.min(0.8, ratio)))
    }
    const onUp = () => {
      dragging.current = false
      document.removeEventListener('mousemove', onMove)
      document.removeEventListener('mouseup', onUp)
    }
    document.addEventListener('mousemove', onMove)
    document.addEventListener('mouseup', onUp)
  }, [])

  // 行号
  const lineCount = useMemo(() => {
    return input ? input.split('\n').length : 0
  }, [input])

  const outputLineCount = useMemo(() => {
    return output ? output.split('\n').length : 0
  }, [output])

  return (
    <div style={{
      width: '100%',
      height: '100%',
      display: 'flex',
      flexDirection: 'column',
      background: COLORS.bg,
      color: COLORS.text,
      fontFamily: "'SF Mono', 'Fira Code', 'Cascadia Code', monospace",
      overflow: 'hidden',
    }}>
      <style>{`
        .json-ts-input::placeholder { color: ${COLORS.textSecondary}; opacity: 0.6; }
      `}</style>
      {/* 工具栏 */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        gap: 6,
        padding: '8px 12px',
        background: COLORS.bgSecondary,
        borderBottom: `1px solid ${COLORS.border}`,
        flexShrink: 0,
        flexWrap: 'wrap',
      }}>
        <FileJsonIcon size={16} color={COLORS.accent} />
        <span style={{ fontSize: 13, fontWeight: 600, color: COLORS.text, marginRight: 8 }}>
          JSON → TypeScript
        </span>

        <div style={{ height: 20, width: 1, background: COLORS.border, margin: '0 4px' }} />

        <button
          onClick={handleFormat}
          disabled={!parseResult.ok || !input.trim()}
          title="格式化 JSON"
          style={toolbarBtnStyle}
          onMouseEnter={e => { if (!e.currentTarget.disabled) e.currentTarget.style.background = COLORS.btnHover }}
          onMouseLeave={e => { e.currentTarget.style.background = COLORS.btnBg }}
        >
          <Braces size={13} />
          <span>格式化</span>
        </button>

        <button
          onClick={() => setUseTypeAlias(!useTypeAlias)}
          title={useTypeAlias ? '切换为 interface' : '切换为 type alias'}
          style={{ ...toolbarBtnStyle, background: useTypeAlias ? COLORS.hoverBg : COLORS.btnBg }}
          onMouseEnter={e => { e.currentTarget.style.background = COLORS.hoverBg }}
          onMouseLeave={e => { e.currentTarget.style.background = useTypeAlias ? COLORS.hoverBg : COLORS.btnBg }}
        >
          <FileCode size={13} />
          <span>{useTypeAlias ? 'type' : 'interface'}</span>
        </button>

        <button
          onClick={handleCopy}
          disabled={!output}
          title="复制到剪贴板"
          style={toolbarBtnStyle}
          onMouseEnter={e => { if (!e.currentTarget.disabled) e.currentTarget.style.background = COLORS.btnHover }}
          onMouseLeave={e => { e.currentTarget.style.background = COLORS.btnBg }}
        >
          {copied ? <CheckCircleIcon size={13} color={COLORS.success} /> : <CopyIcon size={13} />}
          <span>{copied ? '已复制' : '复制'}</span>
        </button>

        <button
          onClick={handleDownload}
          disabled={!output}
          title="下载 .ts 文件"
          style={toolbarBtnStyle}
          onMouseEnter={e => { if (!e.currentTarget.disabled) e.currentTarget.style.background = COLORS.btnHover }}
          onMouseLeave={e => { e.currentTarget.style.background = COLORS.btnBg }}
        >
          <DownloadIcon size={13} />
          <span>下载 .ts</span>
        </button>

        <div style={{ height: 20, width: 1, background: COLORS.border, margin: '0 4px' }} />

        {SAMPLES.map((sample, idx) => (
          <button
            key={idx}
            onClick={() => handleLoadSample(idx)}
            title={`加载 ${sample.name} 示例`}
            style={{
              ...toolbarBtnStyle,
              background: sampleIdx === idx ? COLORS.hoverBg : COLORS.btnBg,
            }}
            onMouseEnter={e => { e.currentTarget.style.background = COLORS.hoverBg }}
            onMouseLeave={e => { e.currentTarget.style.background = sampleIdx === idx ? COLORS.hoverBg : COLORS.btnBg }}
          >
            <RefreshCwIcon size={11} />
            <span>{sample.name}</span>
          </button>
        ))}
      </div>

      {/* 主体区域 */}
      <div
        ref={containerRef}
        style={{ flex: 1, display: 'flex', overflow: 'hidden', position: 'relative' }}
      >
        {/* 左侧：JSON 输入 */}
        <div style={{ width: `${splitRatio * 100}%`, display: 'flex', flexDirection: 'column', minWidth: 0 }}>
          <div style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '4px 12px',
            background: COLORS.editorBg,
            borderBottom: `1px solid ${COLORS.border}`,
            flexShrink: 0,
          }}>
            <span style={{ fontSize: 11, color: COLORS.textSecondary, textTransform: 'uppercase' as const, letterSpacing: 1 }}>
              JSON 输入
            </span>
            <span style={{ fontSize: 11, color: COLORS.textSecondary }}>{lineCount} 行</span>
          </div>
          <div style={{ flex: 1, display: 'flex', overflow: 'hidden', position: 'relative' }}>
            {/* 行号 */}
            <div style={{
              width: 44,
              flexShrink: 0,
              background: COLORS.editorBg,
              borderRight: `1px solid ${COLORS.border}`,
              overflow: 'hidden',
              paddingTop: 12,
              textAlign: 'right',
              paddingRight: 8,
              userSelect: 'none',
            }}>
              {Array.from({ length: Math.max(lineCount, 1) }, (_, i) => (
                <div key={i} style={{ height: 20, fontSize: 12, color: 'rgba(255,255,255,0.15)', lineHeight: '20px' }}>
                  {i + 1}
                </div>
              ))}
            </div>
            {/* 输入区 */}
            <div style={{ flex: 1, position: 'relative' }}>
              <textarea
                className="json-ts-input"
                value={input}
                onChange={e => setInput(e.target.value)}
                placeholder={'在此粘贴或输入 JSON 数据...\n\n支持:\n  - 对象 { ... }\n  - 数组 [ ... ]\n  - 嵌套结构\n  - null 值'}
                spellCheck={false}
                style={{
                  width: '100%',
                  height: '100%',
                  background: 'transparent',
                  color: 'transparent',
                  caretColor: COLORS.text,
                  border: 'none',
                  outline: 'none',
                  resize: 'none',
                  fontFamily: "'SF Mono', 'Fira Code', monospace",
                  fontSize: 13,
                  lineHeight: '20px',
                  padding: '12px 16px',
                  boxSizing: 'border-box',
                  tabSize: 2,
                }}
              />
              {/* 语法高亮遮罩 */}
              {input.trim() && (
                <div style={{
                  position: 'absolute',
                  left: 16,
                  right: 16,
                  top: 0,
                  pointerEvents: 'none',
                  whiteSpace: 'pre-wrap',
                  wordBreak: 'break-all',
                  fontFamily: "'SF Mono', 'Fira Code', monospace",
                  fontSize: 13,
                  lineHeight: '20px',
                }}>
                  {highlightJSON(input)}
                </div>
              )}
            </div>
          </div>
          {/* 错误栏 */}
          {!parseResult.ok && input.trim() && (
            <div style={{
              padding: '6px 12px',
              background: 'rgba(248,81,73,0.08)',
              borderTop: '1px solid rgba(248,81,73,0.2)',
              display: 'flex',
              alignItems: 'center',
              gap: 8,
              flexShrink: 0,
            }}>
              <AlertCircle size={13} color={COLORS.error} />
              <span style={{ color: COLORS.error, fontSize: 12, flex: 1 }}>
                第 {parseResult.line} 行，第 {parseResult.col} 列: {parseResult.error}
              </span>
            </div>
          )}
        </div>

        {/* 拖拽手柄 */}
        <div
          onMouseDown={handleDragStart}
          style={{
            width: 5,
            cursor: 'col-resize',
            background: COLORS.border,
            flexShrink: 0,
            transition: 'background 0.2s',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
          onMouseEnter={e => { e.currentTarget.style.background = COLORS.accent }}
          onMouseLeave={e => { e.currentTarget.style.background = COLORS.border }}
        >
          <div style={{ width: 2, height: 24, borderRadius: 1, background: COLORS.textSecondary, opacity: 0.5 }} />
        </div>

        {/* 右侧：TypeScript 输出 */}
        <div style={{ width: `${(1 - splitRatio) * 100}%`, display: 'flex', flexDirection: 'column', minWidth: 0 }}>
          <div style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '4px 12px',
            background: COLORS.editorBg,
            borderBottom: `1px solid ${COLORS.border}`,
            flexShrink: 0,
          }}>
            <span style={{ fontSize: 11, color: COLORS.textSecondary, textTransform: 'uppercase' as const, letterSpacing: 1 }}>
              TypeScript 输出
            </span>
            <span style={{ fontSize: 11, color: COLORS.textSecondary }}>{outputLineCount} 行</span>
          </div>
          <div style={{
            flex: 1,
            overflow: 'auto',
            background: COLORS.editorBg,
            padding: '12px 16px',
            fontFamily: "'SF Mono', 'Fira Code', monospace",
            fontSize: 13,
            lineHeight: '20px',
            color: COLORS.text,
          }}>
            {output ? (
              <div>{highlightTypeScript(output)}</div>
            ) : (
              <div style={{
                color: COLORS.textSecondary,
                padding: 40,
                textAlign: 'center',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: 12,
              }}>
                <Braces size={40} style={{ opacity: 0.2 }} />
                <div style={{ fontSize: 14 }}>在左侧输入 JSON 数据</div>
                <div style={{ fontSize: 12, opacity: 0.6 }}>TypeScript 类型定义将在此处自动生成</div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* 底部状态栏 */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        gap: 16,
        padding: '4px 12px',
        background: COLORS.bgSecondary,
        borderTop: `1px solid ${COLORS.border}`,
        flexShrink: 0,
        fontSize: 11,
        color: COLORS.textSecondary,
      }}>
        {stats ? (
          <>
            <span>大小: {stats.size}</span>
            <span style={{ opacity: 0.3 }}>|</span>
            <span>深度: {stats.depth}</span>
            <span style={{ opacity: 0.3 }}>|</span>
            <span>属性数: {stats.properties}</span>
            <span style={{ opacity: 0.3 }}>|</span>
            <span style={{ color: COLORS.success }}>✓ 有效 JSON</span>
          </>
        ) : input.trim() ? (
          <span style={{ color: COLORS.error }}>✗ JSON 解析错误</span>
        ) : (
          <span>就绪</span>
        )}
        <span style={{ marginLeft: 'auto' }}>
          {useTypeAlias ? '模式: type alias' : '模式: interface'}
        </span>
      </div>
    </div>
  )
}

// ========== 工具栏按钮样式 ==========
const toolbarBtnStyle: CSSProperties = {
  display: 'inline-flex',
  alignItems: 'center',
  gap: 4,
  padding: '4px 8px',
  background: 'rgba(255,255,255,0.06)',
  border: '1px solid rgba(255,255,255,0.08)',
  borderRadius: 6,
  color: '#e0e0e8',
  fontSize: 12,
  cursor: 'pointer',
  transition: 'all 0.15s',
  fontFamily: 'inherit',
  whiteSpace: 'nowrap',
}
