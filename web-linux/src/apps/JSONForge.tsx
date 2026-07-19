import { useState, useMemo, useCallback } from 'react'

/**
 * JSONForge
 *
 * 一体化 JSON 处理工具，集成五大功能：
 *  1. 格式化 / 压缩 / 转义
 *  2. 双向 JSON ⇄ YAML 转换
 *  3. JSON ⇌ CSV 转换（数组对象与表格互转）
 *  4. 双 JSON 深度 Diff（结构 + 值差异可视化）
 *  5. JSON Schema 自动生成（含类型推断）
 *
 * 全部在浏览器本地运行，无网络依赖。
 */

type Tab = 'format' | 'yaml' | 'csv' | 'diff' | 'schema'

// ---------- 工具函数 ----------
function tryParseJSON(text: string): { ok: true; value: unknown } | { ok: false; error: string } {
  try {
    return { ok: true, value: JSON.parse(text) }
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : String(e) }
  }
}

// 安全的 stringify，支持循环引用
function safeStringify(value: unknown, indent = 2): string {
  const seen = new WeakSet()
  return JSON.stringify(
    value,
    (_key, val) => {
      if (typeof val === 'object' && val !== null) {
        if (seen.has(val)) return '[Circular]'
        seen.add(val)
      }
      if (typeof val === 'bigint') return val.toString() + 'n'
      if (typeof val === 'undefined') return null
      return val
    },
    indent
  )
}

// ---------- YAML 转换 ----------
function toYAML(value: unknown, indent = 0): string {
  const pad = '  '.repeat(indent)
  if (value === null || value === undefined) return 'null'
  if (typeof value === 'string') {
    // 含特殊字符的字符串加引号
    if (/[:#\[\]{},&*?|<>=!%@`"'\n]/.test(value) || value.trim() !== value || value === '') {
      return JSON.stringify(value)
    }
    return value
  }
  if (typeof value === 'number' || typeof value === 'boolean') return String(value)
  if (Array.isArray(value)) {
    if (value.length === 0) return '[]'
    return value
      .map((item) => {
        const v = toYAML(item, indent + 1)
        if (typeof item === 'object' && item !== null) {
          return `${pad}- ${v.trimStart()}`
        }
        return `${pad}- ${v}`
      })
      .join('\n')
  }
  if (typeof value === 'object') {
    const entries = Object.entries(value as Record<string, unknown>)
    if (entries.length === 0) return '{}'
    return entries
      .map(([k, v]) => {
        const yamlVal = toYAML(v, indent + 1)
        if (typeof v === 'object' && v !== null && !Array.isArray(v) && Object.keys(v as object).length > 0) {
          return `${pad}${k}:\n${yamlVal}`
        }
        if (Array.isArray(v) && v.length > 0) {
          return `${pad}${k}:\n${yamlVal}`
        }
        return `${pad}${k}: ${yamlVal}`
      })
      .join('\n')
  }
  return String(value)
}

function parseYAML(text: string): unknown {
  // 简易 YAML 解析器，支持基础结构（不替代完整 YAML 库）
  const lines = text.split('\n')
  const parseBlock = (lines: string[], startIndex: number, baseIndent: number): [unknown, number] => {
    let i = startIndex
    if (i >= lines.length) return [null, i]
    const first = lines[i]
    const firstTrimmed = first.trimStart()
    if (firstTrimmed.startsWith('- ')) {
      // 数组
      const arr: unknown[] = []
      while (i < lines.length) {
        const line = lines[i]
        if (line.trim() === '' || line.trim().startsWith('#')) { i++; continue }
        const indent = line.length - line.trimStart().length
        if (indent < baseIndent) break
        const trimmed = line.trimStart()
        if (!trimmed.startsWith('- ')) break
        const content = trimmed.slice(2)
        if (content.includes(': ')) {
          // 行内对象
          const obj: Record<string, unknown> = {}
          const [k, ...vParts] = content.split(': ')
          obj[k.trim()] = parseScalar(vParts.join(': '))
          // 后续可能还有更多同缩进的字段
          i++
          while (i < lines.length) {
            const nextLine = lines[i]
            if (nextLine.trim() === '' || nextLine.trim().startsWith('#')) { i++; continue }
            const nextIndent = nextLine.length - nextLine.trimStart().length
            if (nextIndent <= baseIndent) break
            const nextTrimmed = nextLine.trimStart()
            if (nextTrimmed.startsWith('- ')) break
            const [nk, ...nvParts] = nextTrimmed.split(': ')
            obj[nk.trim()] = parseScalar(nvParts.join(': '))
            i++
          }
          arr.push(obj)
        } else {
          i++
          const [val, next] = parseBlock(lines, i, baseIndent + 2)
          if (val !== null && typeof val === 'object') {
            arr.push(val)
            i = next
          } else {
            arr.push(parseScalar(content))
          }
        }
      }
      return [arr, i]
    }
    // 对象
    const obj: Record<string, unknown> = {}
    while (i < lines.length) {
      const line = lines[i]
      if (line.trim() === '' || line.trim().startsWith('#')) { i++; continue }
      const indent = line.length - line.trimStart().length
      if (indent < baseIndent) break
      if (indent > baseIndent) { i++; continue }
      const trimmed = line.trimStart()
      if (trimmed.startsWith('- ')) break
      const colonIdx = trimmed.indexOf(':')
      if (colonIdx === -1) { i++; continue }
      const key = trimmed.slice(0, colonIdx).trim()
      const rest = trimmed.slice(colonIdx + 1).trim()
      if (rest === '') {
        // 多行值
        i++
        const [val, next] = parseBlock(lines, i, baseIndent + 2)
        obj[key] = val
        i = next
      } else {
        obj[key] = parseScalar(rest)
        i++
      }
    }
    return [obj, i]
  }
  const [result] = parseBlock(lines, 0, 0)
  return result
}

function parseScalar(s: string): unknown {
  if (s === 'null' || s === '~') return null
  if (s === 'true') return true
  if (s === 'false') return false
  if (s === '[]') return []
  if (s === '{}') return {}
  if (/^-?\d+$/.test(s)) return parseInt(s, 10)
  if (/^-?\d+\.\d+$/.test(s)) return parseFloat(s)
  if ((s.startsWith('"') && s.endsWith('"')) || (s.startsWith("'") && s.endsWith("'"))) {
    try { return JSON.parse(s) } catch { return s.slice(1, -1) }
  }
  return s
}

// ---------- CSV 转换 ----------
function jsonToCSV(arr: unknown[]): string {
  if (!Array.isArray(arr) || arr.length === 0) return ''
  // 收集所有字段
  const keys = Array.from(new Set(arr.flatMap((item) => (typeof item === 'object' && item !== null ? Object.keys(item as object) : []))))
  if (keys.length === 0) return ''
  const escape = (v: unknown): string => {
    if (v === null || v === undefined) return ''
    if (typeof v === 'object') return JSON.stringify(v)
    const s = String(v)
    if (/[",\n\r]/.test(s)) return `"${s.replace(/"/g, '""')}"`
    return s
  }
  const rows = [keys.join(',')]
  for (const item of arr) {
    if (typeof item !== 'object' || item === null) continue
    const row = keys.map((k) => escape((item as Record<string, unknown>)[k])).join(',')
    rows.push(row)
  }
  return rows.join('\n')
}

function csvToJSON(csv: string): unknown[] {
  // 简单 CSV 解析器
  const rows: string[][] = []
  let cur: string[] = []
  let field = ''
  let inQuotes = false
  for (let i = 0; i < csv.length; i++) {
    const c = csv[i]
    if (inQuotes) {
      if (c === '"') {
        if (csv[i + 1] === '"') { field += '"'; i++ }
        else inQuotes = false
      } else field += c
    } else {
      if (c === '"') inQuotes = true
      else if (c === ',') { cur.push(field); field = '' }
      else if (c === '\n') { cur.push(field); rows.push(cur); cur = []; field = '' }
      else if (c === '\r') { /* skip */ }
      else field += c
    }
  }
  if (field !== '' || cur.length > 0) { cur.push(field); rows.push(cur) }
  if (rows.length === 0) return []
  const headers = rows[0]
  return rows.slice(1).map((row) => {
    const obj: Record<string, unknown> = {}
    headers.forEach((h, idx) => {
      const val = row[idx] ?? ''
      // 自动类型推断
      if (val === '') obj[h] = ''
      else if (val === 'true') obj[h] = true
      else if (val === 'false') obj[h] = false
      else if (/^-?\d+$/.test(val)) obj[h] = parseInt(val, 10)
      else if (/^-?\d+\.\d+$/.test(val)) obj[h] = parseFloat(val)
      else obj[h] = val
    })
    return obj
  })
}

// ---------- Diff ----------
interface DiffNode {
  path: string
  type: 'added' | 'removed' | 'changed'
  left?: unknown
  right?: unknown
}

function diffJSON(left: unknown, right: unknown, path = '$'): DiffNode[] {
  const result: DiffNode[] = []
  if (typeof left !== typeof right || left === null || right === null) {
    if (left === undefined && right !== undefined) result.push({ path, type: 'added', right })
    else if (left !== undefined && right === undefined) result.push({ path, type: 'removed', left })
    else if (JSON.stringify(left) !== JSON.stringify(right)) result.push({ path, type: 'changed', left, right })
    return result
  }
  if (Array.isArray(left) && Array.isArray(right)) {
    const maxLen = Math.max(left.length, right.length)
    for (let i = 0; i < maxLen; i++) {
      result.push(...diffJSON(left[i], right[i], `${path}[${i}]`))
    }
    return result
  }
  if (typeof left === 'object' && typeof right === 'object') {
    const leftObj = left as Record<string, unknown>
    const rightObj = right as Record<string, unknown>
    const keys = new Set([...Object.keys(leftObj), ...Object.keys(rightObj)])
    for (const k of keys) {
      result.push(...diffJSON(leftObj[k], rightObj[k], `${path}.${k}`))
    }
    return result
  }
  if (left !== right) result.push({ path, type: 'changed', left, right })
  return result
}

// ---------- JSON Schema ----------
function generateSchema(value: unknown): unknown {
  if (value === null) return { type: 'null' }
  if (Array.isArray(value)) {
    const itemSchema = value.length > 0 ? generateSchema(value[0]) : {}
    return {
      type: 'array',
      items: itemSchema,
      minItems: 0,
    }
  }
  if (typeof value === 'object') {
    const obj = value as Record<string, unknown>
    const properties: Record<string, unknown> = {}
    const required: string[] = []
    for (const [k, v] of Object.entries(obj)) {
      properties[k] = generateSchema(v)
      required.push(k)
    }
    return {
      type: 'object',
      properties,
      required,
      additionalProperties: false,
    }
  }
  if (typeof value === 'string') return { type: 'string' }
  if (typeof value === 'number') return Number.isInteger(value) ? { type: 'integer' } : { type: 'number' }
  if (typeof value === 'boolean') return { type: 'boolean' }
  return {}
}

// ---------- UI 组件 ----------
const SAMPLE = `{
  "name": "WebLinuxOS",
  "version": "42.0.0",
  "tags": ["os", "web", "react"],
  "meta": {
    "stars": 240,
    "license": "MIT",
    "active": true
  },
  "authors": [
    { "name": "Alice", "role": "maintainer" },
    { "name": "Bob", "role": "contributor" }
  ]
}`

export default function JSONForge() {
  const [tab, setTab] = useState<Tab>('format')

  // 格式化
  const [formatInput, setFormatInput] = useState('')
  const [indent, setIndent] = useState(2)
  const formatResult = useMemo(() => {
    if (!formatInput.trim()) return { ok: true as const, output: '', inputSize: 0, outputSize: 0 }
    const parsed = tryParseJSON(formatInput)
    if (!parsed.ok) return { ok: false as const, error: parsed.error }
    const out = safeStringify(parsed.value, indent)
    return { ok: true as const, output: out, inputSize: formatInput.length, outputSize: out.length }
  }, [formatInput, indent])

  // YAML
  const [yamlInput, setYamlInput] = useState('')
  const [yamlDir, setYamlDir] = useState<'j2y' | 'y2j'>('j2y')
  const yamlResult = useMemo(() => {
    if (!yamlInput.trim()) return { ok: true as const, output: '' }
    try {
      if (yamlDir === 'j2y') {
        const parsed = tryParseJSON(yamlInput)
        if (!parsed.ok) return { ok: false as const, error: parsed.error }
        return { ok: true as const, output: toYAML(parsed.value) }
      } else {
        const parsed = parseYAML(yamlInput)
        return { ok: true as const, output: safeStringify(parsed, 2) }
      }
    } catch (e) {
      return { ok: false as const, error: e instanceof Error ? e.message : String(e) }
    }
  }, [yamlInput, yamlDir])

  // CSV
  const [csvInput, setCsvInput] = useState('')
  const [csvDir, setCsvDir] = useState<'j2c' | 'c2j'>('j2c')
  const csvResult = useMemo(() => {
    if (!csvInput.trim()) return { ok: true as const, output: '' }
    try {
      if (csvDir === 'j2c') {
        const parsed = tryParseJSON(csvInput)
        if (!parsed.ok) return { ok: false as const, error: parsed.error }
        if (!Array.isArray(parsed.value)) return { ok: false as const, error: 'JSON → CSV 需要数组对象' }
        return { ok: true as const, output: jsonToCSV(parsed.value) }
      } else {
        const json = csvToJSON(csvInput)
        return { ok: true as const, output: safeStringify(json, 2) }
      }
    } catch (e) {
      return { ok: false as const, error: e instanceof Error ? e.message : String(e) }
    }
  }, [csvInput, csvDir])

  // Diff
  const [leftJSON, setLeftJSON] = useState('')
  const [rightJSON, setRightJSON] = useState('')
  const diffResult = useMemo(() => {
    if (!leftJSON.trim() && !rightJSON.trim()) return { ok: true as const, diffs: [] as DiffNode[] }
    const left = tryParseJSON(leftJSON)
    const right = tryParseJSON(rightJSON)
    if (!left.ok) return { ok: false as const, error: `左侧: ${left.error}` }
    if (!right.ok) return { ok: false as const, error: `右侧: ${right.error}` }
    return { ok: true as const, diffs: diffJSON(left.value, right.value) }
  }, [leftJSON, rightJSON])

  // Schema
  const [schemaInput, setSchemaInput] = useState('')
  const schemaResult = useMemo(() => {
    if (!schemaInput.trim()) return { ok: true as const, output: '' }
    const parsed = tryParseJSON(schemaInput)
    if (!parsed.ok) return { ok: false as const, error: parsed.error }
    return { ok: true as const, output: safeStringify(generateSchema(parsed.value), 2) }
  }, [schemaInput])

  const copyText = useCallback(async (text: string) => {
    if (!text) return
    try { await navigator.clipboard.writeText(text) } catch { /* ignore */ }
  }, [])

  return (
    <div style={container}>
      {/* Header */}
      <header style={headerStyle}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
          <div style={logoStyle}>
            <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M8 3H7a2 2 0 0 0-2 2v5a2 2 0 0 1-2 2 2 2 0 0 1 2 2v5a2 2 0 0 0 2 2h1" />
              <path d="M16 3h1a2 2 0 0 1 2 2v5a2 2 0 0 0 2 2 2 2 0 0 0-2 2v5a2 2 0 0 1-2 2h-1" />
              <path d="M9 8l1 1 1-1" opacity="0.6" />
            </svg>
          </div>
          <div>
            <h1 style={titleStyle}>JSONForge</h1>
            <p style={subtitleStyle}>JSON 一体化处理工作台 · 格式化 / YAML / CSV / Diff / Schema</p>
          </div>
        </div>
        <button onClick={() => { setFormatInput(SAMPLE); setYamlInput(SAMPLE); setCsvInput('[\n  {"name":"Alice","age":30},\n  {"name":"Bob","age":25}\n]'); setSchemaInput(SAMPLE) }} style={btnSecondary}>载入示例</button>
      </header>

      {/* Tabs */}
      <nav style={tabsStyle}>
        {([
          { id: 'format' as Tab, label: '格式化' },
          { id: 'yaml' as Tab, label: 'JSON ⇌ YAML' },
          { id: 'csv' as Tab, label: 'JSON ⇌ CSV' },
          { id: 'diff' as Tab, label: 'JSON Diff' },
          { id: 'schema' as Tab, label: 'Schema 生成' },
        ]).map((t) => (
          <button key={t.id} onClick={() => setTab(t.id)} style={{ ...tabBtn, background: tab === t.id ? 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)' : 'transparent', color: tab === t.id ? '#fff' : '#94a3b8' }}>
            {t.label}
          </button>
        ))}
      </nav>

      {/* Content */}
      <div style={contentStyle}>
        {tab === 'format' && (
          <>
            <div style={toolbarStyle}>
              <label style={{ display: 'flex', alignItems: 'center', gap: 8, color: '#94a3b8', fontSize: 12 }}>
                缩进：
                <select value={indent} onChange={(e) => setIndent(parseInt(e.target.value, 10))} style={selectStyle}>
                  <option value={0}>压缩 (0)</option>
                  <option value={2}>2 空格</option>
                  <option value={4}>4 空格</option>
                  <option value={8}>8 空格</option>
                </select>
              </label>
              <button onClick={() => copyText(formatResult.ok ? formatResult.output : '')} style={btnSecondary}>复制</button>
              {formatResult.ok && formatResult.output && (
                <span style={{ color: '#64748b', fontSize: 11 }}>
                  {formatResult.inputSize} → {formatResult.outputSize} 字符 ({formatResult.outputSize > formatResult.inputSize ? '+' : ''}{formatResult.outputSize - formatResult.inputSize})
                </span>
              )}
            </div>
            <div style={splitPaneStyle}>
              <div style={panelStyle}>
                <div style={panelHeaderStyle}>输入 JSON</div>
                <textarea value={formatInput} onChange={(e) => setFormatInput(e.target.value)} placeholder="粘贴 JSON…" style={textareaStyle} spellCheck={false} />
              </div>
              <div style={panelStyle}>
                <div style={panelHeaderStyle}>输出</div>
                <pre style={{ ...outputPreStyle, color: formatResult.ok ? '#fbbf24' : '#ef4444' }}>
                  {formatResult.ok ? (formatResult.output || '等待输入…') : `错误：${formatResult.error}`}
                </pre>
              </div>
            </div>
          </>
        )}

        {tab === 'yaml' && (
          <>
            <div style={toolbarStyle}>
              <div style={{ display: 'flex', gap: 4, background: 'rgba(255,255,255,0.03)', padding: 4, borderRadius: 8 }}>
                <button onClick={() => setYamlDir('j2y')} style={{ ...dirBtn, background: yamlDir === 'j2y' ? '#f59e0b' : 'transparent', color: yamlDir === 'j2y' ? '#fff' : '#94a3b8' }}>JSON → YAML</button>
                <button onClick={() => setYamlDir('y2j')} style={{ ...dirBtn, background: yamlDir === 'y2j' ? '#f59e0b' : 'transparent', color: yamlDir === 'y2j' ? '#fff' : '#94a3b8' }}>YAML → JSON</button>
              </div>
              <button onClick={() => copyText(yamlResult.ok ? yamlResult.output : '')} style={btnSecondary}>复制</button>
            </div>
            <div style={splitPaneStyle}>
              <div style={panelStyle}>
                <div style={panelHeaderStyle}>{yamlDir === 'j2y' ? 'JSON 输入' : 'YAML 输入'}</div>
                <textarea value={yamlInput} onChange={(e) => setYamlInput(e.target.value)} placeholder={yamlDir === 'j2y' ? '粘贴 JSON…' : '粘贴 YAML…'} style={textareaStyle} spellCheck={false} />
              </div>
              <div style={panelStyle}>
                <div style={panelHeaderStyle}>{yamlDir === 'j2y' ? 'YAML 输出' : 'JSON 输出'}</div>
                <pre style={{ ...outputPreStyle, color: yamlResult.ok ? '#fbbf24' : '#ef4444' }}>
                  {yamlResult.ok ? (yamlResult.output || '等待输入…') : `错误：${yamlResult.error}`}
                </pre>
              </div>
            </div>
          </>
        )}

        {tab === 'csv' && (
          <>
            <div style={toolbarStyle}>
              <div style={{ display: 'flex', gap: 4, background: 'rgba(255,255,255,0.03)', padding: 4, borderRadius: 8 }}>
                <button onClick={() => setCsvDir('j2c')} style={{ ...dirBtn, background: csvDir === 'j2c' ? '#f59e0b' : 'transparent', color: csvDir === 'j2c' ? '#fff' : '#94a3b8' }}>JSON → CSV</button>
                <button onClick={() => setCsvDir('c2j')} style={{ ...dirBtn, background: csvDir === 'c2j' ? '#f59e0b' : 'transparent', color: csvDir === 'c2j' ? '#fff' : '#94a3b8' }}>CSV → JSON</button>
              </div>
              <button onClick={() => copyText(csvResult.ok ? csvResult.output : '')} style={btnSecondary}>复制</button>
            </div>
            <div style={splitPaneStyle}>
              <div style={panelStyle}>
                <div style={panelHeaderStyle}>{csvDir === 'j2c' ? 'JSON 数组输入' : 'CSV 输入'}</div>
                <textarea value={csvInput} onChange={(e) => setCsvInput(e.target.value)} placeholder={csvDir === 'j2c' ? '[{"name":"Alice","age":30},...]' : 'name,age\nAlice,30'} style={textareaStyle} spellCheck={false} />
              </div>
              <div style={panelStyle}>
                <div style={panelHeaderStyle}>{csvDir === 'j2c' ? 'CSV 输出' : 'JSON 输出'}</div>
                <pre style={{ ...outputPreStyle, color: csvResult.ok ? '#fbbf24' : '#ef4444' }}>
                  {csvResult.ok ? (csvResult.output || '等待输入…') : `错误：${csvResult.error}`}
                </pre>
              </div>
            </div>
          </>
        )}

        {tab === 'diff' && (
          <>
            <div style={toolbarStyle}>
              {diffResult.ok && (
                <span style={{ color: '#94a3b8', fontSize: 12 }}>
                  差异：<span style={{ color: '#ef4444' }}>{diffResult.diffs.filter((d) => d.type === 'removed').length} 删除</span> · <span style={{ color: '#22c55e' }}>{diffResult.diffs.filter((d) => d.type === 'added').length} 新增</span> · <span style={{ color: '#f59e0b' }}>{diffResult.diffs.filter((d) => d.type === 'changed').length} 修改</span>
                </span>
              )}
            </div>
            <div style={splitPaneStyle}>
              <div style={panelStyle}>
                <div style={{ ...panelHeaderStyle, color: '#ef4444' }}>左侧 JSON</div>
                <textarea value={leftJSON} onChange={(e) => setLeftJSON(e.target.value)} placeholder="粘贴原 JSON…" style={textareaStyle} spellCheck={false} />
              </div>
              <div style={panelStyle}>
                <div style={{ ...panelHeaderStyle, color: '#22c55e' }}>右侧 JSON</div>
                <textarea value={rightJSON} onChange={(e) => setRightJSON(e.target.value)} placeholder="粘贴新 JSON…" style={textareaStyle} spellCheck={false} />
              </div>
            </div>
            {diffResult.ok && diffResult.diffs.length > 0 && (
              <div style={{ marginTop: 14, padding: 12, background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.06)', borderRadius: 10, maxHeight: 220, overflow: 'auto' }}>
                <div style={{ fontSize: 11, color: '#94a3b8', marginBottom: 8, letterSpacing: '0.05em', textTransform: 'uppercase' }}>差异详情</div>
                {diffResult.diffs.map((d, idx) => (
                  <div key={idx} style={{ display: 'flex', gap: 10, padding: '6px 8px', marginBottom: 4, borderRadius: 6, background: d.type === 'added' ? 'rgba(34,197,94,0.08)' : d.type === 'removed' ? 'rgba(239,68,68,0.08)' : 'rgba(245,158,11,0.08)', fontSize: 12, fontFamily: 'JetBrains Mono, monospace' }}>
                    <span style={{ width: 60, fontWeight: 700, color: d.type === 'added' ? '#22c55e' : d.type === 'removed' ? '#ef4444' : '#f59e0b' }}>
                      {d.type === 'added' ? '+ 新增' : d.type === 'removed' ? '- 删除' : '~ 修改'}
                    </span>
                    <span style={{ color: '#cbd5e1', flex: 1 }}>{d.path}</span>
                    {d.type === 'changed' && (
                      <span style={{ color: '#64748b' }}>
                        <span style={{ color: '#ef4444', textDecoration: 'line-through' }}>{String(d.left)}</span> → <span style={{ color: '#22c55e' }}>{String(d.right)}</span>
                      </span>
                    )}
                  </div>
                ))}
              </div>
            )}
            {diffResult.ok && diffResult.diffs.length === 0 && leftJSON.trim() && rightJSON.trim() && (
              <div style={{ marginTop: 14, padding: 20, textAlign: 'center', color: '#22c55e', fontSize: 13, background: 'rgba(34,197,94,0.05)', border: '1px solid rgba(34,197,94,0.2)', borderRadius: 10 }}>
                两个 JSON 结构完全一致
              </div>
            )}
          </>
        )}

        {tab === 'schema' && (
          <>
            <div style={toolbarStyle}>
              <button onClick={() => copyText(schemaResult.ok ? schemaResult.output : '')} style={btnSecondary}>复制 Schema</button>
            </div>
            <div style={splitPaneStyle}>
              <div style={panelStyle}>
                <div style={panelHeaderStyle}>输入 JSON</div>
                <textarea value={schemaInput} onChange={(e) => setSchemaInput(e.target.value)} placeholder="粘贴 JSON…" style={textareaStyle} spellCheck={false} />
              </div>
              <div style={panelStyle}>
                <div style={panelHeaderStyle}>JSON Schema 输出</div>
                <pre style={{ ...outputPreStyle, color: schemaResult.ok ? '#fbbf24' : '#ef4444' }}>
                  {schemaResult.ok ? (schemaResult.output || '等待输入…') : `错误：${schemaResult.error}`}
                </pre>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  )
}

// ---------- 样式 ----------
const container: React.CSSProperties = {
  height: '100%',
  display: 'flex',
  flexDirection: 'column',
  background: 'radial-gradient(ellipse at top, #1f1a0a 0%, #0d0a05 50%, #050402 100%)',
  color: '#e2e8f0',
  fontFamily: "'JetBrains Mono', 'Cabinet Grotesk', monospace",
  padding: 18,
  overflow: 'hidden',
  boxSizing: 'border-box',
}

const headerStyle: React.CSSProperties = {
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'center',
  marginBottom: 14,
  gap: 12,
  flexWrap: 'wrap',
}

const logoStyle: React.CSSProperties = {
  width: 44,
  height: 44,
  borderRadius: 11,
  background: 'linear-gradient(135deg, #f59e0b 0%, #b45309 100%)',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  color: '#fff',
  boxShadow: '0 8px 20px rgba(245,158,11,0.35)',
}

const titleStyle: React.CSSProperties = {
  margin: 0,
  fontSize: 22,
  fontWeight: 800,
  letterSpacing: '-0.02em',
  background: 'linear-gradient(135deg, #fde68a 0%, #fbbf24 50%, #f59e0b 100%)',
  WebkitBackgroundClip: 'text',
  WebkitTextFillColor: 'transparent',
  backgroundClip: 'text',
}

const subtitleStyle: React.CSSProperties = { margin: '2px 0 0 0', fontSize: 11, color: '#94a3b8' }

const tabsStyle: React.CSSProperties = {
  display: 'flex',
  gap: 4,
  background: 'rgba(255,255,255,0.03)',
  padding: 4,
  borderRadius: 10,
  marginBottom: 14,
  width: 'fit-content',
  flexWrap: 'wrap',
}

const tabBtn: React.CSSProperties = {
  padding: '8px 16px',
  borderRadius: 7,
  border: 'none',
  cursor: 'pointer',
  fontSize: 13,
  fontWeight: 600,
  transition: 'all 0.2s',
  fontFamily: 'inherit',
}

const contentStyle: React.CSSProperties = { flex: 1, display: 'flex', flexDirection: 'column', minHeight: 0 }

const toolbarStyle: React.CSSProperties = {
  display: 'flex',
  gap: 10,
  alignItems: 'center',
  marginBottom: 10,
  flexWrap: 'wrap',
}

const selectStyle: React.CSSProperties = {
  background: 'rgba(255,255,255,0.05)',
  border: '1px solid rgba(255,255,255,0.1)',
  color: '#e2e8f0',
  padding: '6px 10px',
  borderRadius: 6,
  fontFamily: 'inherit',
  fontSize: 12,
}

const splitPaneStyle: React.CSSProperties = {
  display: 'grid',
  gridTemplateColumns: '1fr 1fr',
  gap: 12,
  flex: 1,
  minHeight: 0,
}

const panelStyle: React.CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
  background: 'rgba(255,255,255,0.02)',
  border: '1px solid rgba(255,255,255,0.06)',
  borderRadius: 10,
  overflow: 'hidden',
  minHeight: 0,
}

const panelHeaderStyle: React.CSSProperties = {
  padding: '8px 12px',
  borderBottom: '1px solid rgba(255,255,255,0.06)',
  fontSize: 11,
  color: '#94a3b8',
  fontWeight: 600,
  letterSpacing: '0.05em',
  textTransform: 'uppercase',
}

const textareaStyle: React.CSSProperties = {
  flex: 1,
  background: 'transparent',
  border: 'none',
  color: '#e2e8f0',
  padding: 12,
  fontFamily: "'JetBrains Mono', monospace",
  fontSize: 13,
  lineHeight: 1.6,
  resize: 'none',
  outline: 'none',
  minHeight: 0,
}

const outputPreStyle: React.CSSProperties = {
  margin: 0,
  padding: 12,
  flex: 1,
  overflow: 'auto',
  fontFamily: "'JetBrains Mono', monospace",
  fontSize: 13,
  lineHeight: 1.6,
  whiteSpace: 'pre-wrap',
  wordBreak: 'break-word',
  minHeight: 0,
}

const btnSecondary: React.CSSProperties = {
  padding: '6px 12px',
  borderRadius: 7,
  border: '1px solid rgba(255,255,255,0.1)',
  background: 'rgba(255,255,255,0.03)',
  color: '#cbd5e1',
  cursor: 'pointer',
  fontSize: 12,
  fontWeight: 500,
  fontFamily: 'inherit',
}

const dirBtn: React.CSSProperties = {
  padding: '6px 14px',
  borderRadius: 6,
  border: 'none',
  cursor: 'pointer',
  fontSize: 12,
  fontWeight: 600,
  fontFamily: 'inherit',
  transition: 'all 0.2s',
}
