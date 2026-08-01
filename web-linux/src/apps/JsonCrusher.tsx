import { useState, useMemo, useCallback } from 'react'

/**
 * JsonCrusher — 高级 JSON 工具
 *
 * 六大功能：
 *  1. 格式化 / 压缩
 *  2. JSON → TypeScript 类型生成
 *  3. JSONPath 查询
 *  4. 双 JSON Diff 对比
 *  5. JSON Schema 验证
 *  6. 树形视图展示
 */

type Tab = 'format' | 'ts' | 'path' | 'diff' | 'schema' | 'tree'

// ─── 工具函数 ─────────────────────────────────────────────

function tryParse(text: string): { ok: true; value: unknown } | { ok: false; error: string } {
  try {
    return { ok: true, value: JSON.parse(text) }
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : String(e) }
  }
}

function safeStringify(value: unknown, indent = 2): string {
  const seen = new WeakSet()
  return JSON.stringify(
    value,
    (_k, v) => {
      if (typeof v === 'object' && v !== null) {
        if (seen.has(v)) return '[Circular]'
        seen.add(v)
      }
      if (typeof v === 'bigint') return v.toString() + 'n'
      return v === undefined ? null : v
    },
    indent
  )
}

// ─── JSON → TypeScript 类型 ──────────────────────────────

function jsonToTS(value: unknown, rootName = 'RootType'): string {
  const lines: string[] = []
  const seen = new Map<object, string>()

  function resolve(v: unknown, name: string, prefix = ''): string {
    if (v === null) return 'null'
    if (v === undefined) return 'undefined'
    if (typeof v === 'string') return 'string'
    if (typeof v === 'number') return Number.isInteger(v as number) ? 'number' : 'number'
    if (typeof v === 'boolean') return 'boolean'
    if (Array.isArray(v)) {
      if (v.length === 0) return 'unknown[]'
      const types = new Set<string>()
      for (const item of v) types.add(resolve(item, name))
      const union = [...types]
      if (union.length === 1) return union[0] + '[]'
      return '(' + union.join(' | ') + ')[]'
    }
    if (typeof v === 'object') {
      const obj = v as object
      if (seen.has(obj)) return seen.get(obj)!
      seen.set(obj, name)
      emitInterface(obj as Record<string, unknown>, name, prefix)
      return name
    }
    return 'unknown'
  }

  function emitInterface(obj: Record<string, unknown>, name: string, prefix: string) {
    const entries = Object.entries(obj)
    const fields = entries.map(([k, v]) => {
      const isOpt = v === undefined
      const t = resolve(v, name + '_' + k.charAt(0).toUpperCase() + k.slice(1), prefix + '  ')
      return `${prefix}  ${/^[a-zA-Z_$][a-zA-Z0-9_$]*$/.test(k) ? k : JSON.stringify(k)}${isOpt ? '?' : ''}: ${t};`
    })
    lines.push(`${prefix}interface ${name} {`)
    lines.push(...fields)
    lines.push(`${prefix}}`)
  }

  if (typeof value === 'object' && value !== null && !Array.isArray(value)) {
    resolve(value, rootName)
  } else if (Array.isArray(value) && value.length > 0 && typeof value[0] === 'object' && value[0] !== null) {
    resolve(value[0], rootName + 'Item')
    lines.push(`type ${rootName} = ${rootName}Item[];`)
  } else {
    lines.push(`type ${rootName} = ${resolve(value, rootName)};`)
  }
  return lines.join('\n')
}

// ─── JSONPath 简易查询 ───────────────────────────────────

function queryJsonPath(obj: unknown, path: string): { matches: unknown[]; paths: string[] } {
  const matches: unknown[] = []
  const paths: string[] = []

  if (!path.startsWith('$')) return { matches, paths }

  const segments = path.slice(1).split('.').filter(Boolean)
  if (segments.length === 0) {
    matches.push(obj)
    paths.push('$')
    return { matches, paths }
  }

  function walk(current: unknown, curPath: string, segs: string[]) {
    if (segs.length === 0) {
      matches.push(current)
      paths.push(curPath)
      return
    }
    const [head, ...rest] = segs
    if (head === '*') {
      if (Array.isArray(current)) {
        current.forEach((item, i) => walk(item, `${curPath}[${i}]`, rest))
      } else if (typeof current === 'object' && current !== null) {
        Object.keys(current as Record<string, unknown>).forEach(k =>
          walk((current as Record<string, unknown>)[k], `${curPath}.${k}`, rest)
        )
      }
      return
    }
    if (head.startsWith('[') && head.endsWith(']')) {
      const idx = parseInt(head.slice(1, -1), 10)
      if (Array.isArray(current) && idx < current.length) {
        walk(current[idx], `${curPath}[${idx}]`, rest)
      }
      return
    }
    if (typeof current === 'object' && current !== null) {
      const val = (current as Record<string, unknown>)[head]
      if (val !== undefined) walk(val, `${curPath}.${head}`, rest)
    }
  }

  walk(obj, '$', segments)
  return { matches, paths }
}

// ─── JSON Diff ──────────────────────────────────────────

interface DiffItem {
  path: string
  type: 'add' | 'remove' | 'change'
  left?: unknown
  right?: unknown
}

function diffJSON(left: unknown, right: unknown, path = '$'): DiffItem[] {
  const diffs: DiffItem[] = []

  if (left === right) return diffs
  if (left === null || right === null || typeof left !== typeof right || Array.isArray(left) !== Array.isArray(right)) {
    diffs.push({ path, type: 'change', left, right })
    return diffs
  }

  if (Array.isArray(left) && Array.isArray(right)) {
    const max = Math.max(left.length, right.length)
    for (let i = 0; i < max; i++) {
      if (i >= left.length) diffs.push({ path: `${path}[${i}]`, type: 'add', right: right[i] })
      else if (i >= right.length) diffs.push({ path: `${path}[${i}]`, type: 'remove', left: left[i] })
      else diffs.push(...diffJSON(left[i], right[i], `${path}[${i}]`))
    }
    return diffs
  }

  if (typeof left === 'object' && typeof right === 'object') {
    const lObj = left as Record<string, unknown>
    const rObj = right as Record<string, unknown>
    const allKeys = new Set([...Object.keys(lObj), ...Object.keys(rObj)])
    for (const k of allKeys) {
      const p = `${path}.${k}`
      if (!(k in lObj)) diffs.push({ path: p, type: 'add', right: rObj[k] })
      else if (!(k in rObj)) diffs.push({ path: p, type: 'remove', left: lObj[k] })
      else diffs.push(...diffJSON(lObj[k], rObj[k], p))
    }
  } else {
    diffs.push({ path, type: 'change', left, right })
  }
  return diffs
}

// ─── JSON Schema 验证 ───────────────────────────────────

interface SchemaIssue {
  path: string
  message: string
}

function validateSchema(value: unknown, schema: Record<string, unknown>, path = '$'): SchemaIssue[] {
  const issues: SchemaIssue[] = []

  const sType = schema.type as string | undefined
  if (sType) {
    const actual = value === null ? 'null' : Array.isArray(value) ? 'array' : typeof value
    if (sType === 'integer' && typeof value === 'number' && !Number.isInteger(value)) {
      issues.push({ path, message: `应为 integer，实际为 ${value}` })
    } else if (sType !== 'integer' && actual !== sType) {
      issues.push({ path, message: `应为 ${sType}，实际为 ${actual}` })
    }
  }

  if (schema.enum) {
    if (!(schema.enum as unknown[]).includes(value)) {
      issues.push({ path, message: `值 ${JSON.stringify(value)} 不在 enum ${JSON.stringify(schema.enum)} 中` })
    }
  }

  if (schema.minLength !== undefined && typeof value === 'string' && value.length < (schema.minLength as number)) {
    issues.push({ path, message: `字符串长度 ${value.length} < minLength ${(schema.minLength as number)}` })
  }
  if (schema.maxLength !== undefined && typeof value === 'string' && value.length > (schema.maxLength as number)) {
    issues.push({ path, message: `字符串长度 ${value.length} > maxLength ${(schema.maxLength as number)}` })
  }
  if (schema.minimum !== undefined && typeof value === 'number' && value < (schema.minimum as number)) {
    issues.push({ path, message: `数值 ${value} < minimum ${(schema.minimum as number)}` })
  }
  if (schema.maximum !== undefined && typeof value === 'number' && value > (schema.maximum as number)) {
    issues.push({ path, message: `数值 ${value} > maximum ${(schema.maximum as number)}` })
  }

  if (schema.required && typeof value === 'object' && value !== null && !Array.isArray(value)) {
    const obj = value as Record<string, unknown>
    for (const req of schema.required as string[]) {
      if (!(req in obj)) issues.push({ path, message: `缺少必需字段 "${req}"` })
    }
  }

  if (schema.properties && typeof value === 'object' && value !== null && !Array.isArray(value)) {
    const obj = value as Record<string, unknown>
    const props = schema.properties as Record<string, Record<string, unknown>>
    for (const [k, subSchema] of Object.entries(props)) {
      if (k in obj) issues.push(...validateSchema(obj[k], subSchema, `${path}.${k}`))
    }
  }

  if (schema.items && Array.isArray(value)) {
    const itemSchema = schema.items as Record<string, unknown>
    value.forEach((item, i) => issues.push(...validateSchema(item, itemSchema, `${path}[${i}]`)))
  }

  return issues
}

// ─── 树形视图 ────────────────────────────────────────────

interface TreeNode {
  key: string
  value: unknown
  type: string
  children?: TreeNode[]
  expanded?: boolean
}

function buildTree(obj: unknown, key = 'root'): TreeNode {
  if (obj === null) return { key, value: null, type: 'null' }
  if (obj === undefined) return { key, value: undefined, type: 'undefined' }
  if (typeof obj !== 'object') return { key, value: obj, type: typeof obj }

  const isArr = Array.isArray(obj)
  const entries = isArr
    ? (obj as unknown[]).map((v, i) => buildTree(v, String(i)))
    : Object.entries(obj as Record<string, unknown>).map(([k, v]) => buildTree(v, k))

  return { key, value: obj, type: isArr ? 'array' : 'object', children: entries, expanded: key === 'root' }
}

// ─── 示例数据 ────────────────────────────────────────────

const SAMPLE_JSON = `{
  "name": "WebLinuxOS",
  "version": "2.0.1",
  "private": true,
  "description": "A web-based Linux OS simulator",
  "scripts": {
    "dev": "vite",
    "build": "tsc && vite build",
    "preview": "vite preview"
  },
  "dependencies": {
    "react": "^18.2.0",
    "react-dom": "^18.2.0"
  },
  "contributors": [
    { "name": "Alice", "role": "lead", "stars": 120 },
    { "name": "Bob", "role": "dev", "stars": 85 }
  ]
}`

const SAMPLE_SCHEMA = `{
  "type": "object",
  "required": ["name", "version"],
  "properties": {
    "name": { "type": "string", "minLength": 1 },
    "version": { "type": "string" },
    "private": { "type": "boolean" },
    "scripts": {
      "type": "object",
      "properties": {
        "dev": { "type": "string" },
        "build": { "type": "string" }
      }
    },
    "contributors": {
      "type": "array",
      "items": {
        "type": "object",
        "required": ["name"],
        "properties": {
          "name": { "type": "string" },
          "role": { "type": "string" },
          "stars": { "type": "number", "minimum": 0 }
        }
      }
    }
  }
}`

// ─── 样式常量 ────────────────────────────────────────────

const C = {
  bg: '#0c0a14',
  surface: 'rgba(255,255,255,0.025)',
  border: 'rgba(255,255,255,0.07)',
  borderActive: 'rgba(139,92,246,0.5)',
  text: '#e2e8f0',
  textDim: '#94a3b8',
  textMuted: '#64748b',
  accent: '#8b5cf6',
  accentLight: '#a78bfa',
  green: '#22c55e',
  red: '#ef4444',
  yellow: '#fbbf24',
  blue: '#38bdf8',
  mono: "'JetBrains Mono', 'Fira Code', monospace",
}

const container: React.CSSProperties = {
  height: '100%',
  display: 'flex',
  flexDirection: 'column',
  background: `radial-gradient(ellipse at top, #1a1030 0%, ${C.bg} 60%)`,
  color: C.text,
  fontFamily: C.mono,
  padding: 16,
  overflow: 'hidden',
  boxSizing: 'border-box',
}

const headerStyle: React.CSSProperties = {
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'center',
  marginBottom: 12,
  gap: 12,
  flexWrap: 'wrap',
}

const logoStyle: React.CSSProperties = {
  width: 42,
  height: 42,
  borderRadius: 10,
  background: `linear-gradient(135deg, ${C.accent} 0%, #6d28d9 100%)`,
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  color: '#fff',
  fontSize: 20,
  fontWeight: 900,
  boxShadow: `0 6px 16px rgba(139,92,246,0.35)`,
}

const titleStyle: React.CSSProperties = {
  margin: 0,
  fontSize: 21,
  fontWeight: 800,
  letterSpacing: '-0.02em',
  background: `linear-gradient(135deg, #c4b5fd 0%, ${C.accentLight} 50%, ${C.accent} 100%)`,
  WebkitBackgroundClip: 'text',
  WebkitTextFillColor: 'transparent',
  backgroundClip: 'text',
}

const subtitleStyle: React.CSSProperties = { margin: '2px 0 0 0', fontSize: 11, color: C.textDim }

const tabsStyle: React.CSSProperties = {
  display: 'flex',
  gap: 3,
  background: C.surface,
  padding: 3,
  borderRadius: 9,
  marginBottom: 12,
  width: 'fit-content',
  flexWrap: 'wrap',
}

const tabBtn: React.CSSProperties = {
  padding: '7px 14px',
  borderRadius: 6,
  border: 'none',
  cursor: 'pointer',
  fontSize: 12,
  fontWeight: 600,
  transition: 'all 0.2s',
  fontFamily: 'inherit',
}

const contentStyle: React.CSSProperties = { flex: 1, display: 'flex', flexDirection: 'column', minHeight: 0, overflow: 'hidden' }

const toolbarStyle: React.CSSProperties = {
  display: 'flex',
  gap: 8,
  alignItems: 'center',
  marginBottom: 8,
  flexWrap: 'wrap',
}

const selectStyle: React.CSSProperties = {
  background: 'rgba(255,255,255,0.05)',
  border: `1px solid ${C.border}`,
  color: C.text,
  padding: '5px 9px',
  borderRadius: 5,
  fontFamily: 'inherit',
  fontSize: 12,
}

const splitStyle: React.CSSProperties = {
  display: 'grid',
  gridTemplateColumns: '1fr 1fr',
  gap: 10,
  flex: 1,
  minHeight: 0,
}

const panelStyle: React.CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
  background: C.surface,
  border: `1px solid ${C.border}`,
  borderRadius: 9,
  overflow: 'hidden',
  minHeight: 0,
}

const panelHeaderStyle: React.CSSProperties = {
  padding: '7px 11px',
  borderBottom: `1px solid ${C.border}`,
  fontSize: 11,
  color: C.textDim,
  fontWeight: 600,
  letterSpacing: '0.04em',
  textTransform: 'uppercase' as const,
}

const textareaStyle: React.CSSProperties = {
  flex: 1,
  background: 'transparent',
  border: 'none',
  color: C.text,
  padding: 10,
  fontFamily: C.mono,
  fontSize: 12,
  lineHeight: 1.6,
  resize: 'none',
  outline: 'none',
  minHeight: 0,
}

const outputPreStyle: React.CSSProperties = {
  margin: 0,
  padding: 10,
  flex: 1,
  overflow: 'auto',
  fontFamily: C.mono,
  fontSize: 12,
  lineHeight: 1.6,
  whiteSpace: 'pre-wrap',
  wordBreak: 'break-word',
  minHeight: 0,
}

const btnStyle: React.CSSProperties = {
  padding: '5px 11px',
  borderRadius: 6,
  border: `1px solid ${C.border}`,
  background: C.surface,
  color: '#cbd5e1',
  cursor: 'pointer',
  fontSize: 12,
  fontWeight: 500,
  fontFamily: 'inherit',
  transition: 'all 0.15s',
}

// ─── 主组件 ──────────────────────────────────────────────

export default function JsonCrusher() {
  const [tab, setTab] = useState<Tab>('format')

  // 格式化
  const [fmtInput, setFmtInput] = useState('')
  const [indent, setIndent] = useState(2)
  const fmtResult = useMemo(() => {
    if (!fmtInput.trim()) return { ok: true as const, output: '', inSize: 0, outSize: 0 }
    const p = tryParse(fmtInput)
    if (!p.ok) return { ok: false as const, error: p.error }
    const out = safeStringify(p.value, indent)
    return { ok: true as const, output: out, inSize: fmtInput.length, outSize: out.length }
  }, [fmtInput, indent])

  // TypeScript 类型
  const [tsInput, setTsInput] = useState('')
  const [tsRootName, setTsRootName] = useState('RootType')
  const tsResult = useMemo(() => {
    if (!tsInput.trim()) return { ok: true as const, output: '' }
    const p = tryParse(tsInput)
    if (!p.ok) return { ok: false as const, error: p.error }
    return { ok: true as const, output: jsonToTS(p.value, tsRootName || 'RootType') }
  }, [tsInput, tsRootName])

  // JSONPath
  const [pathInput, setPathInput] = useState('')
  const [pathQuery, setPathQuery] = useState('$')
  const pathResult = useMemo(() => {
    if (!pathInput.trim()) return { ok: true as const, matches: [] as unknown[], paths: [] as string[] }
    const p = tryParse(pathInput)
    if (!p.ok) return { ok: false as const, error: p.error }
    try {
      const r = queryJsonPath(p.value, pathQuery)
      return { ok: true as const, matches: r.matches, paths: r.paths }
    } catch (e) {
      return { ok: false as const, error: e instanceof Error ? e.message : String(e) }
    }
  }, [pathInput, pathQuery])

  // Diff
  const [diffLeft, setDiffLeft] = useState('')
  const [diffRight, setDiffRight] = useState('')
  const diffResult = useMemo(() => {
    if (!diffLeft.trim() && !diffRight.trim()) return { ok: true as const, diffs: [] as DiffItem[] }
    const l = tryParse(diffLeft)
    const r = tryParse(diffRight)
    if (!l.ok) return { ok: false as const, error: `左侧: ${l.error}` }
    if (!r.ok) return { ok: false as const, error: `右侧: ${r.error}` }
    return { ok: true as const, diffs: diffJSON(l.value, r.value) }
  }, [diffLeft, diffRight])

  // Schema 验证
  const [schemaDataInput, setSchemaDataInput] = useState('')
  const [schemaDefInput, setSchemaDefInput] = useState('')
  const schemaResult = useMemo(() => {
    if (!schemaDataInput.trim() || !schemaDefInput.trim()) return { ok: true as const, issues: [] as SchemaIssue[] }
    const data = tryParse(schemaDataInput)
    const schema = tryParse(schemaDefInput)
    if (!data.ok) return { ok: false as const, error: `数据: ${data.error}` }
    if (!schema.ok) return { ok: false as const, error: `Schema: ${schema.error}` }
    return { ok: true as const, issues: validateSchema(data.value, schema.value as Record<string, unknown>) }
  }, [schemaDataInput, schemaDefInput])

  // 树形视图
  const [treeInput, setTreeInput] = useState('')
  const [expandedKeys, setExpandedKeys] = useState<Set<string>>(new Set(['root']))
  const treeData = useMemo(() => {
    if (!treeInput.trim()) return null
    const p = tryParse(treeInput)
    if (!p.ok) return null
    return buildTree(p.value)
  }, [treeInput])

  const toggleExpand = useCallback((path: string) => {
    setExpandedKeys(prev => {
      const next = new Set(prev)
      if (next.has(path)) next.delete(path)
      else next.add(path)
      return next
    })
  }, [])

  const copyText = useCallback(async (text: string) => {
    if (!text) return
    try { await navigator.clipboard.writeText(text) } catch { /* noop */ }
  }, [])

  const loadSample = useCallback(() => {
    setFmtInput(SAMPLE_JSON)
    setTsInput(SAMPLE_JSON)
    setPathInput(SAMPLE_JSON)
    setDiffLeft(SAMPLE_JSON)
    setDiffRight(SAMPLE_JSON.replace('"2.0.1"', '"3.0.0"').replace('"Alice"', '"Alicia"'))
    setSchemaDataInput(SAMPLE_JSON)
    setSchemaDefInput(SAMPLE_SCHEMA)
    setTreeInput(SAMPLE_JSON)
  }, [])

  // ─── 树形视图渲染 ───

  const renderTree = (node: TreeNode, depth: number, parentPath: string): React.ReactNode => {
    const nodePath = parentPath ? `${parentPath}.${node.key}` : node.key
    const isExpanded = expandedKeys.has(nodePath)
    const isContainer = node.type === 'object' || node.type === 'array'
    const indentPx = depth * 18

    let valuePreview = ''
    if (node.type === 'string') valuePreview = `"${String(node.value)}"`
    else if (node.type === 'number') valuePreview = String(node.value)
    else if (node.type === 'boolean') valuePreview = String(node.value)
    else if (node.type === 'null') valuePreview = 'null'
    else if (node.type === 'array') valuePreview = `Array[${node.children?.length ?? 0}]`
    else if (node.type === 'object') valuePreview = `Object{${node.children?.length ?? 0}}`

    const typeColor =
      node.type === 'string' ? C.green :
      node.type === 'number' ? C.yellow :
      node.type === 'boolean' ? C.blue :
      node.type === 'null' ? C.textMuted :
      node.type === 'array' ? C.accentLight :
      node.type === 'object' ? C.accentLight : C.text

    return (
      <div key={nodePath}>
        <div
          style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '3px 8px', cursor: isContainer ? 'pointer' : 'default', paddingLeft: 8 + indentPx }}
          onClick={() => isContainer && toggleExpand(nodePath)}
        >
          {isContainer && (
            <span style={{ color: C.textMuted, fontSize: 10, width: 12, textAlign: 'center', flexShrink: 0 }}>
              {isExpanded ? '▼' : '▶'}
            </span>
          )}
          {!isContainer && <span style={{ width: 12, flexShrink: 0 }} />}
          <span style={{ color: C.accentLight, fontSize: 12 }}>{node.key}</span>
          <span style={{ color: C.textMuted, fontSize: 12 }}>:</span>
          <span style={{ color: typeColor, fontSize: 12, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
            {valuePreview}
          </span>
        </div>
        {isContainer && isExpanded && node.children?.map(child => renderTree(child, depth + 1, nodePath))}
      </div>
    )
  }

  const tabs: { id: Tab; label: string; icon: string }[] = [
    { id: 'format', label: '格式化', icon: '✨' },
    { id: 'ts', label: 'TS 类型', icon: '🔷' },
    { id: 'path', label: 'Path 查询', icon: '🔍' },
    { id: 'diff', label: 'Diff 对比', icon: '⚡' },
    { id: 'schema', label: 'Schema', icon: '🛡️' },
    { id: 'tree', label: '树形视图', icon: '🌳' },
  ]

  return (
    <div style={container}>
      {/* Header */}
      <header style={headerStyle}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <div style={logoStyle}>J</div>
          <div>
            <h1 style={titleStyle}>JsonCrusher</h1>
            <p style={subtitleStyle}>高级 JSON 工具 · 格式化 / TS类型 / Path / Diff / Schema / 树形</p>
          </div>
        </div>
        <button onClick={loadSample} style={btnStyle}>载入示例</button>
      </header>

      {/* Tabs */}
      <nav style={tabsStyle}>
        {tabs.map(t => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            style={{
              ...tabBtn,
              background: tab === t.id ? `linear-gradient(135deg, ${C.accent} 0%, #6d28d9 100%)` : 'transparent',
              color: tab === t.id ? '#fff' : C.textDim,
            }}
          >
            {t.icon} {t.label}
          </button>
        ))}
      </nav>

      {/* Content */}
      <div style={contentStyle}>
        {/* ── 格式化 ── */}
        {tab === 'format' && (
          <>
            <div style={toolbarStyle}>
              <label style={{ display: 'flex', alignItems: 'center', gap: 6, color: C.textDim, fontSize: 12 }}>
                缩进：
                <select value={indent} onChange={e => setIndent(parseInt(e.target.value, 10))} style={selectStyle}>
                  <option value={0}>压缩 (0)</option>
                  <option value={2}>2 空格</option>
                  <option value={4}>4 空格</option>
                </select>
              </label>
              <button onClick={() => copyText(fmtResult.ok ? fmtResult.output : '')} style={btnStyle}>复制</button>
              {fmtResult.ok && fmtResult.output && (
                <span style={{ color: C.textMuted, fontSize: 11 }}>
                  {fmtResult.inSize} → {fmtResult.outSize} 字符 ({fmtResult.outSize > fmtResult.inSize ? '+' : ''}{fmtResult.outSize - fmtResult.inSize})
                </span>
              )}
            </div>
            <div style={splitStyle}>
              <div style={panelStyle}>
                <div style={panelHeaderStyle}>输入 JSON</div>
                <textarea value={fmtInput} onChange={e => setFmtInput(e.target.value)} placeholder="粘贴 JSON…" style={textareaStyle} spellCheck={false} />
              </div>
              <div style={panelStyle}>
                <div style={panelHeaderStyle}>输出</div>
                <pre style={{ ...outputPreStyle, color: fmtResult.ok ? C.green : C.red }}>
                  {fmtResult.ok ? (fmtResult.output || '等待输入…') : `错误：${fmtResult.error}`}
                </pre>
              </div>
            </div>
          </>
        )}

        {/* ── TypeScript 类型 ── */}
        {tab === 'ts' && (
          <>
            <div style={toolbarStyle}>
              <label style={{ display: 'flex', alignItems: 'center', gap: 6, color: C.textDim, fontSize: 12 }}>
                根类型名：
                <input
                  value={tsRootName}
                  onChange={e => setTsRootName(e.target.value)}
                  style={{ ...selectStyle, width: 120 }}
                />
              </label>
              <button onClick={() => copyText(tsResult.ok ? tsResult.output : '')} style={btnStyle}>复制</button>
            </div>
            <div style={splitStyle}>
              <div style={panelStyle}>
                <div style={panelHeaderStyle}>JSON 输入</div>
                <textarea value={tsInput} onChange={e => setTsInput(e.target.value)} placeholder="粘贴 JSON…" style={textareaStyle} spellCheck={false} />
              </div>
              <div style={panelStyle}>
                <div style={panelHeaderStyle}>TypeScript 类型</div>
                <pre style={{ ...outputPreStyle, color: tsResult.ok ? C.blue : C.red }}>
                  {tsResult.ok ? (tsResult.output || '等待输入…') : `错误：${tsResult.error}`}
                </pre>
              </div>
            </div>
          </>
        )}

        {/* ── JSONPath ── */}
        {tab === 'path' && (
          <>
            <div style={toolbarStyle}>
              <label style={{ display: 'flex', alignItems: 'center', gap: 6, color: C.textDim, fontSize: 12 }}>
                Path：
                <input
                  value={pathQuery}
                  onChange={e => setPathQuery(e.target.value)}
                  placeholder="$.contributors[*].name"
                  style={{ ...selectStyle, width: 220, fontFamily: C.mono }}
                />
              </label>
              {pathResult.ok && (
                <span style={{ color: C.textMuted, fontSize: 11 }}>匹配 {pathResult.matches.length} 项</span>
              )}
            </div>
            <div style={splitStyle}>
              <div style={panelStyle}>
                <div style={panelHeaderStyle}>JSON 输入</div>
                <textarea value={pathInput} onChange={e => setPathInput(e.target.value)} placeholder="粘贴 JSON…" style={textareaStyle} spellCheck={false} />
              </div>
              <div style={panelStyle}>
                <div style={panelHeaderStyle}>查询结果</div>
                {pathResult.ok ? (
                  <div style={{ ...outputPreStyle, overflow: 'auto' }}>
                    {pathResult.matches.length === 0 ? (
                      <span style={{ color: C.textMuted }}>无匹配</span>
                    ) : (
                      pathResult.matches.map((m, i) => (
                        <div key={i} style={{ marginBottom: 6, padding: '4px 8px', background: 'rgba(139,92,246,0.08)', borderRadius: 5, borderLeft: `3px solid ${C.accent}` }}>
                          <div style={{ color: C.textMuted, fontSize: 10, marginBottom: 2 }}>{pathResult.paths[i]}</div>
                          <div style={{ color: C.green, fontSize: 12, fontFamily: C.mono }}>{typeof m === 'string' ? `"${m}"` : safeStringify(m, 2)}</div>
                        </div>
                      ))
                    )}
                  </div>
                ) : (
                  <pre style={{ ...outputPreStyle, color: C.red }}>错误：{pathResult.error}</pre>
                )}
              </div>
            </div>
          </>
        )}

        {/* ── Diff ── */}
        {tab === 'diff' && (
          <>
            <div style={toolbarStyle}>
              <span style={{ color: C.textMuted, fontSize: 11 }}>
                {diffResult.ok ? `${diffResult.diffs.length} 处差异` : ''}
              </span>
            </div>
            <div style={splitStyle}>
              <div style={panelStyle}>
                <div style={panelHeaderStyle}>左侧 JSON</div>
                <textarea value={diffLeft} onChange={e => setDiffLeft(e.target.value)} placeholder="JSON A…" style={textareaStyle} spellCheck={false} />
              </div>
              <div style={panelStyle}>
                <div style={panelHeaderStyle}>右侧 JSON</div>
                <textarea value={diffRight} onChange={e => setDiffRight(e.target.value)} placeholder="JSON B…" style={textareaStyle} spellCheck={false} />
              </div>
            </div>
            <div style={{ marginTop: 8, flex: 1, minHeight: 0, overflow: 'auto', background: C.surface, border: `1px solid ${C.border}`, borderRadius: 9, padding: 10 }}>
              {diffResult.ok ? (
                diffResult.diffs.length === 0 ? (
                  <span style={{ color: C.textMuted, fontSize: 12 }}>完全一致，无差异</span>
                ) : (
                  diffResult.diffs.map((d, i) => (
                    <div key={i} style={{
                      marginBottom: 4,
                      padding: '4px 8px',
                      borderRadius: 4,
                      fontSize: 12,
                      background: d.type === 'add' ? 'rgba(34,197,94,0.08)' : d.type === 'remove' ? 'rgba(239,68,68,0.08)' : 'rgba(251,191,36,0.08)',
                      borderLeft: `3px solid ${d.type === 'add' ? C.green : d.type === 'remove' ? C.red : C.yellow}`,
                    }}>
                      <span style={{ color: C.textMuted, fontSize: 11 }}>{d.path}</span>
                      {' '}
                      <span style={{
                        color: d.type === 'add' ? C.green : d.type === 'remove' ? C.red : C.yellow,
                        fontWeight: 600,
                        fontSize: 11,
                      }}>
                        {d.type === 'add' ? '+ 新增' : d.type === 'remove' ? '- 删除' : '~ 变更'}
                      </span>
                      {d.type === 'change' && (
                        <span style={{ color: C.textDim, marginLeft: 8, fontSize: 11 }}>
                          {safeStringify(d.left)} → {safeStringify(d.right)}
                        </span>
                      )}
                      {d.type === 'add' && (
                        <span style={{ color: C.green, marginLeft: 8, fontSize: 11 }}>{safeStringify(d.right)}</span>
                      )}
                      {d.type === 'remove' && (
                        <span style={{ color: C.red, marginLeft: 8, fontSize: 11 }}>{safeStringify(d.left)}</span>
                      )}
                    </div>
                  ))
                )
              ) : (
                <span style={{ color: C.red, fontSize: 12 }}>错误：{diffResult.error}</span>
              )}
            </div>
          </>
        )}

        {/* ── Schema 验证 ── */}
        {tab === 'schema' && (
          <>
            <div style={splitStyle}>
              <div style={panelStyle}>
                <div style={panelHeaderStyle}>JSON 数据</div>
                <textarea value={schemaDataInput} onChange={e => setSchemaDataInput(e.target.value)} placeholder="待验证的 JSON…" style={textareaStyle} spellCheck={false} />
              </div>
              <div style={panelStyle}>
                <div style={panelHeaderStyle}>JSON Schema</div>
                <textarea value={schemaDefInput} onChange={e => setSchemaDefInput(e.target.value)} placeholder="Schema 定义…" style={textareaStyle} spellCheck={false} />
              </div>
            </div>
            <div style={{ marginTop: 8, flex: 1, minHeight: 0, overflow: 'auto', background: C.surface, border: `1px solid ${C.border}`, borderRadius: 9, padding: 10 }}>
              {schemaResult.ok ? (
                schemaResult.issues.length === 0 ? (
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <span style={{ color: C.green, fontSize: 16 }}>✓</span>
                    <span style={{ color: C.green, fontSize: 13, fontWeight: 600 }}>验证通过</span>
                  </div>
                ) : (
                  <>
                    <div style={{ color: C.red, fontSize: 13, fontWeight: 600, marginBottom: 6 }}>
                      ✗ {schemaResult.issues.length} 个验证错误
                    </div>
                    {schemaResult.issues.map((issue, i) => (
                      <div key={i} style={{
                        marginBottom: 3,
                        padding: '4px 8px',
                        borderRadius: 4,
                        background: 'rgba(239,68,68,0.06)',
                        borderLeft: `3px solid ${C.red}`,
                        fontSize: 12,
                      }}>
                        <span style={{ color: C.textMuted, fontSize: 11 }}>{issue.path}</span>
                        <span style={{ color: C.red, marginLeft: 8, fontSize: 11 }}>{issue.message}</span>
                      </div>
                    ))}
                  </>
                )
              ) : (
                <span style={{ color: C.red, fontSize: 12 }}>错误：{schemaResult.error}</span>
              )}
            </div>
          </>
        )}

        {/* ── 树形视图 ── */}
        {tab === 'tree' && (
          <div style={splitStyle}>
            <div style={panelStyle}>
              <div style={panelHeaderStyle}>JSON 输入</div>
              <textarea value={treeInput} onChange={e => setTreeInput(e.target.value)} placeholder="粘贴 JSON…" style={textareaStyle} spellCheck={false} />
            </div>
            <div style={panelStyle}>
              <div style={{ ...panelHeaderStyle, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span>树形视图</span>
                <div style={{ display: 'flex', gap: 6 }}>
                  <button onClick={() => {
                    const all = new Set<string>()
                    const collect = (n: TreeNode, p: string) => {
                      const np = p ? `${p}.${n.key}` : n.key
                      if (n.type === 'object' || n.type === 'array') { all.add(np); n.children?.forEach(c => collect(c, np)) }
                    }
                    if (treeData) { collect(treeData, ''); setExpandedKeys(all) }
                  }} style={{ ...btnStyle, padding: '2px 8px', fontSize: 11 }}>展开全部</button>
                  <button onClick={() => setExpandedKeys(new Set(['root']))} style={{ ...btnStyle, padding: '2px 8px', fontSize: 11 }}>收起全部</button>
                </div>
              </div>
              <div style={{ flex: 1, overflow: 'auto', padding: '6px 0' }}>
                {treeData ? renderTree(treeData, 0, '') : (
                  <span style={{ color: C.textMuted, padding: 10, fontSize: 12, display: 'block' }}>等待输入…</span>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
