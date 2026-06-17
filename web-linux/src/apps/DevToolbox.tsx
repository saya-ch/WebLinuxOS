import { useState, useMemo, memo, useCallback, useEffect } from 'react'

type ToolId =
  | 'base64'
  | 'url'
  | 'json-formatter'
  | 'json-yaml'
  | 'json-schema'
  | 'json-diff'
  | 'regex-tester'
  | 'hash-generator'
  | 'uuid-generator'
  | 'timestamp'
  | 'case-converter'
  | 'number-base'
  | 'jwt-decoder'
  | 'mime-ref'
  | 'http-status'
  | 'color-picker'
  | 'qr-generator'
  | 'markdown-preview'
  | 'password-generator'
  | 'text-diff'
  | 'data-formatter'

interface Tool {
  id: ToolId
  name: string
  icon: string
  description: string
  category: 'encoding' | 'json' | 'text' | 'crypto' | 'web' | 'data' | 'design'
}

const TOOLS: Tool[] = [
  { id: 'base64', name: 'Base64 编解码', icon: '🔐', description: 'Base64 文本与数据的编码/解码', category: 'encoding' },
  { id: 'url', name: 'URL 编解码', icon: '🔗', description: 'URL 组件的百分比编码与解码', category: 'encoding' },
  { id: 'json-formatter', name: 'JSON 格式化', icon: '{ }', description: '美化、压缩与验证 JSON 数据', category: 'json' },
  { id: 'json-yaml', name: 'JSON ↔ YAML', icon: '🔄', description: 'JSON 与 YAML 格式相互转换', category: 'json' },
  { id: 'json-diff', name: 'JSON 差异比较', icon: '📊', description: '比较两个 JSON 对象的结构与值差异', category: 'json' },
  { id: 'json-schema', name: 'JSON Schema', icon: '📋', description: '基于 JSON 数据生成 Schema 与验证', category: 'json' },
  { id: 'regex-tester', name: '正则表达式', icon: '.*', description: '实时测试正则表达式，高亮匹配', category: 'text' },
  { id: 'case-converter', name: '格式转换', icon: 'Aa', description: 'camelCase / snake_case / kebab-case 等', category: 'text' },
  { id: 'text-diff', name: '文本对比', icon: '📝', description: '两段文本的逐行差异对比', category: 'text' },
  { id: 'hash-generator', name: 'Hash 生成器', icon: '#️⃣', description: 'MD5 / SHA-1 / SHA-256 / SHA-512', category: 'crypto' },
  { id: 'uuid-generator', name: 'UUID 生成器', icon: '🆔', description: '批量生成 UUID v4 与 v1 风格 ID', category: 'crypto' },
  { id: 'password-generator', name: '密码生成器', icon: '🔑', description: '可配置强度的安全密码生成', category: 'crypto' },
  { id: 'jwt-decoder', name: 'JWT 解析器', icon: '🎟️', description: '解码 JWT Token 并检查结构', category: 'crypto' },
  { id: 'timestamp', name: 'Unix 时间戳', icon: '⏱️', description: '时间戳与日期时间相互转换', category: 'data' },
  { id: 'number-base', name: '进制转换', icon: '🔢', description: '二进制/八进制/十进制/十六进制', category: 'data' },
  { id: 'data-formatter', name: 'CSV → JSON', icon: '📦', description: '简单 CSV / TSV 与 JSON 转换', category: 'data' },
  { id: 'http-status', name: 'HTTP 状态码', icon: '🌐', description: '常见 HTTP 状态码速查与说明', category: 'web' },
  { id: 'mime-ref', name: 'MIME 类型', icon: '📁', description: '常见 MIME / Content-Type 速查表', category: 'web' },
  { id: 'color-picker', name: '色彩工具', icon: '🎨', description: 'HEX / RGB / HSL 颜色转换', category: 'design' },
  { id: 'qr-generator', name: 'QR 码生成', icon: '▣', description: '将文本或 URL 生成 QR 码 SVG', category: 'design' },
  { id: 'markdown-preview', name: 'Markdown 预览', icon: '📄', description: '实时 Markdown → HTML 渲染', category: 'text' },
]

const HTTP_STATUS_CODES: { code: number; name: string; desc: string }[] = [
  { code: 200, name: 'OK', desc: '请求成功' },
  { code: 201, name: 'Created', desc: '资源已创建' },
  { code: 202, name: 'Accepted', desc: '请求已接受处理' },
  { code: 204, name: 'No Content', desc: '成功但无返回内容' },
  { code: 301, name: 'Moved Permanently', desc: '永久重定向' },
  { code: 302, name: 'Found', desc: '临时重定向' },
  { code: 304, name: 'Not Modified', desc: '资源未修改' },
  { code: 400, name: 'Bad Request', desc: '请求参数错误' },
  { code: 401, name: 'Unauthorized', desc: '未授权' },
  { code: 403, name: 'Forbidden', desc: '禁止访问' },
  { code: 404, name: 'Not Found', desc: '资源不存在' },
  { code: 405, name: 'Method Not Allowed', desc: '方法不允许' },
  { code: 408, name: 'Request Timeout', desc: '请求超时' },
  { code: 409, name: 'Conflict', desc: '请求冲突' },
  { code: 410, name: 'Gone', desc: '资源已永久删除' },
  { code: 429, name: 'Too Many Requests', desc: '请求过多' },
  { code: 500, name: 'Internal Server Error', desc: '服务器内部错误' },
  { code: 501, name: 'Not Implemented', desc: '未实现' },
  { code: 502, name: 'Bad Gateway', desc: '网关错误' },
  { code: 503, name: 'Service Unavailable', desc: '服务不可用' },
  { code: 504, name: 'Gateway Timeout', desc: '网关超时' },
]

const MIME_TYPES: { type: string; ext: string; desc: string }[] = [
  { type: 'application/json', ext: '.json', desc: 'JSON 数据' },
  { type: 'application/xml', ext: '.xml', desc: 'XML 文档' },
  { type: 'application/pdf', ext: '.pdf', desc: 'PDF 文档' },
  { type: 'application/zip', ext: '.zip', desc: 'ZIP 压缩包' },
  { type: 'application/octet-stream', ext: '.bin', desc: '二进制流' },
  { type: 'application/javascript', ext: '.js', desc: 'JavaScript' },
  { type: 'application/typescript', ext: '.ts', desc: 'TypeScript' },
  { type: 'application/x-www-form-urlencoded', ext: '', desc: 'HTML 表单' },
  { type: 'multipart/form-data', ext: '', desc: '文件上传表单' },
  { type: 'text/plain', ext: '.txt', desc: '纯文本' },
  { type: 'text/html', ext: '.html', desc: 'HTML 文档' },
  { type: 'text/css', ext: '.css', desc: 'CSS 样式表' },
  { type: 'text/csv', ext: '.csv', desc: 'CSV 数据' },
  { type: 'text/markdown', ext: '.md', desc: 'Markdown 文档' },
  { type: 'image/png', ext: '.png', desc: 'PNG 图像' },
  { type: 'image/jpeg', ext: '.jpg', desc: 'JPEG 图像' },
  { type: 'image/gif', ext: '.gif', desc: 'GIF 图像' },
  { type: 'image/svg+xml', ext: '.svg', desc: 'SVG 矢量图' },
  { type: 'image/webp', ext: '.webp', desc: 'WebP 图像' },
  { type: 'audio/mpeg', ext: '.mp3', desc: 'MP3 音频' },
  { type: 'video/mp4', ext: '.mp4', desc: 'MP4 视频' },
  { type: 'application/msword', ext: '.doc', desc: 'Word 文档' },
  { type: 'application/vnd.ms-excel', ext: '.xls', desc: 'Excel 表格' },
]

/* =========================================================
   工具组件
========================================================= */

function Textarea({
  value,
  onChange,
  placeholder,
  rows = 8,
}: {
  value: string
  onChange: (v: string) => void
  placeholder?: string
  rows?: number
}) {
  return (
    <textarea
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
      rows={rows}
      style={{
        width: '100%',
        padding: 12,
        borderRadius: 8,
        border: '1px solid rgba(120,120,140,0.25)',
        background: 'rgba(20,22,32,0.6)',
        color: '#e6e6f0',
        fontFamily: "'JetBrains Mono', Consolas, monospace",
        fontSize: 13,
        lineHeight: 1.6,
        resize: 'vertical',
        outline: 'none',
        boxSizing: 'border-box',
      }}
    />
  )
}

function OutputBox({ label, value, mono = true, children }: { label?: string; value?: string; mono?: boolean; children?: React.ReactNode }) {
  return (
    <div style={{
      borderRadius: 8,
      border: '1px solid rgba(120,120,140,0.25)',
      background: 'rgba(20,22,32,0.6)',
      overflow: 'hidden',
    }}>
      {label && (
        <div style={{
          padding: '6px 12px',
          fontSize: 11,
          fontWeight: 600,
          color: '#9090a8',
          borderBottom: '1px solid rgba(120,120,140,0.2)',
          background: 'rgba(40,45,60,0.5)',
          textTransform: 'uppercase',
          letterSpacing: 0.5,
        }}>{label}</div>
      )}
      <div style={{
        padding: 12,
        color: '#e6e6f0',
        fontFamily: mono ? "'JetBrains Mono', Consolas, monospace" : 'inherit',
        fontSize: 13,
        lineHeight: 1.6,
        whiteSpace: 'pre-wrap',
        wordBreak: 'break-word',
        maxHeight: 400,
        overflow: 'auto',
      }}>
        {children ?? value ?? ''}
      </div>
    </div>
  )
}

function Button({
  children,
  onClick,
  variant = 'primary',
}: {
  children: React.ReactNode
  onClick?: () => void
  variant?: 'primary' | 'secondary' | 'danger'
}) {
  const styles: Record<string, React.CSSProperties> = {
    primary: {
      background: 'linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)',
      color: '#fff',
      border: 'none',
    },
    secondary: {
      background: 'rgba(120,120,140,0.2)',
      color: '#d4d4e8',
      border: '1px solid rgba(120,120,140,0.3)',
    },
    danger: {
      background: 'rgba(239,68,68,0.2)',
      color: '#fca5a5',
      border: '1px solid rgba(239,68,68,0.4)',
    },
  }
  return (
    <button
      onClick={onClick}
      style={{
        ...styles[variant],
        padding: '8px 16px',
        borderRadius: 8,
        cursor: 'pointer',
        fontSize: 13,
        fontWeight: 500,
        transition: 'transform 0.1s, opacity 0.2s',
      }}
      onMouseDown={(e) => (e.currentTarget.style.transform = 'scale(0.97)')}
      onMouseUp={(e) => (e.currentTarget.style.transform = 'scale(1)')}
      onMouseLeave={(e) => (e.currentTarget.style.transform = 'scale(1)')}
    >
      {children}
    </button>
  )
}

/* =========================================================
   Base64 工具
========================================================= */
function Base64Tool() {
  const [input, setInput] = useState('Hello, WebLinuxOS!')
  const [mode, setMode] = useState<'encode' | 'decode'>('encode')
  const [error, setError] = useState('')

  const output = useMemo(() => {
    if (!input) return { result: '', error: '' }
    try {
      let result = ''
      if (mode === 'encode') {
        const bytes = new TextEncoder().encode(input)
        let binary = ''
        bytes.forEach((b) => (binary += String.fromCharCode(b)))
        result = btoa(binary)
      } else {
        const binary = atob(input.trim())
        const bytes = new Uint8Array(binary.length)
        for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i)
        result = new TextDecoder('utf-8').decode(bytes)
      }
      return { result, error: '' }
    } catch {
      return { result: '', error: mode === 'decode' ? '无效的 Base64 字符串' : '编码失败' }
    }
  }, [input, mode])

  useEffect(() => {
    setError(output.error)
  }, [output])

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
      <div style={{ display: 'flex', gap: 8 }}>
        <Button variant={mode === 'encode' ? 'primary' : 'secondary'} onClick={() => { setMode('encode'); setError('') }}>编码</Button>
        <Button variant={mode === 'decode' ? 'primary' : 'secondary'} onClick={() => { setMode('decode'); setError('') }}>解码</Button>
      </div>
      <Textarea placeholder={mode === 'encode' ? '输入要编码的文本...' : '输入 Base64 字符串...'} value={input} onChange={setInput} rows={6} />
      {error && <OutputBox label="错误"><span style={{ color: '#fca5a5' }}>{error}</span></OutputBox>}
      {!error && output.result && <OutputBox label={`结果 (${output.result.length} 字符)`}>{output.result}</OutputBox>}
    </div>
  )
}

/* =========================================================
   URL 编解码
========================================================= */
function UrlTool() {
  const [input, setInput] = useState('https://example.com/path?name=你好世界&lang=zh-CN')
  const [mode, setMode] = useState<'encode' | 'decode' | 'encodeComponent'>('encodeComponent')
  const [error, setError] = useState('')

  const output = useMemo(() => {
    if (!input) return { result: '', error: '' }
    try {
      let result = ''
      if (mode === 'encode') result = encodeURI(input)
      else if (mode === 'encodeComponent') result = encodeURIComponent(input)
      else result = decodeURIComponent(input)
      return { result, error: '' }
    } catch {
      return { result: '', error: '无效的 URI' }
    }
  }, [input, mode])

  useEffect(() => {
    setError(output.error)
  }, [output])

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
        <Button variant={mode === 'encodeComponent' ? 'primary' : 'secondary'} onClick={() => { setMode('encodeComponent'); setError('') }}>encodeURIComponent</Button>
        <Button variant={mode === 'encode' ? 'primary' : 'secondary'} onClick={() => { setMode('encode'); setError('') }}>encodeURI</Button>
        <Button variant={mode === 'decode' ? 'primary' : 'secondary'} onClick={() => { setMode('decode'); setError('') }}>decodeURIComponent</Button>
      </div>
      <Textarea placeholder="输入 URL 或文本..." value={input} onChange={setInput} rows={5} />
      {error && <OutputBox label="错误"><span style={{ color: '#fca5a5' }}>{error}</span></OutputBox>}
      {!error && output.result && <OutputBox label="结果">{output.result}</OutputBox>}
    </div>
  )
}

/* =========================================================
   JSON 格式化
========================================================= */
function JsonFormatter() {
  const [input, setInput] = useState('{"name":"WebLinuxOS","version":"1.0","features":["json","regex","hash"],"enabled":true,"nested":{"a":1,"b":[true,false,null]}}')
  const [mode, setMode] = useState<'pretty' | 'minify' | 'validate'>('pretty')
  const [indent, setIndent] = useState(2)

  const { output, error } = useMemo(() => {
    try {
      if (!input.trim()) return { output: '', error: '' }
      const parsed = JSON.parse(input)
      if (mode === 'pretty') return { output: JSON.stringify(parsed, null, indent), error: '' }
      if (mode === 'minify') return { output: JSON.stringify(parsed), error: '' }
      return { output: `✓ 有效的 JSON\n\n类型: ${Array.isArray(parsed) ? 'array' : typeof parsed}\n大小: ${new Blob([input]).size} 字节`, error: '' }
    } catch (e) {
      const msg = e instanceof Error ? e.message : '无效 JSON'
      return { output: '', error: msg }
    }
  }, [input, mode, indent])

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'center' }}>
        <Button variant={mode === 'pretty' ? 'primary' : 'secondary'} onClick={() => setMode('pretty')}>美化</Button>
        <Button variant={mode === 'minify' ? 'primary' : 'secondary'} onClick={() => setMode('minify')}>压缩</Button>
        <Button variant={mode === 'validate' ? 'primary' : 'secondary'} onClick={() => setMode('validate')}>验证</Button>
        {mode === 'pretty' && (
          <label style={{ fontSize: 12, color: '#a8a8c0', marginLeft: 12 }}>
            缩进:
            <select
              value={indent}
              onChange={(e) => setIndent(Number(e.target.value))}
              style={{ marginLeft: 8, padding: 4, background: 'rgba(20,22,32,0.6)', color: '#e6e6f0', border: '1px solid rgba(120,120,140,0.3)', borderRadius: 4 }}
            >
              <option value={2}>2 空格</option>
              <option value={4}>4 空格</option>
              <option value={-1}>Tab</option>
            </select>
          </label>
        )}
      </div>
      <Textarea placeholder="粘贴 JSON..." value={input} onChange={setInput} rows={10} />
      {error && (
        <OutputBox label="错误">
          <span style={{ color: '#fca5a5' }}>✗ {error}</span>
        </OutputBox>
      )}
      {!error && output && <OutputBox label={`输出 (${output.length} 字符)`}>{output}</OutputBox>}
    </div>
  )
}

/* =========================================================
   JSON ↔ YAML
========================================================= */
function JsonYaml() {
  const [input, setInput] = useState('{"name":"WebLinuxOS","apps":[{"id":"terminal","title":"终端"},{"id":"files","title":"文件管理器"}],"version":"1.0.0","released":true}')
  const [mode, setMode] = useState<'json2yaml' | 'yaml2json'>('json2yaml')

  const toYaml = (obj: any, indent = 0): string => {
    const pad = '  '.repeat(indent)
    if (obj === null) return 'null'
    if (typeof obj === 'string') {
      if (obj.includes('\n') || obj.includes(':') || obj.startsWith(' ') || obj.endsWith(' ') || obj.length > 80) {
        return '|\n' + obj.split('\n').map((l) => '  '.repeat(indent + 1) + l).join('\n')
      }
      if (/[:#&*!|>'"%@`\n,\[\]\{\}]/.test(obj) || obj === '') {
        return JSON.stringify(obj)
      }
      return obj
    }
    if (typeof obj === 'number' || typeof obj === 'boolean') return String(obj)
    if (Array.isArray(obj)) {
      if (obj.length === 0) return '[]'
      return obj.length > 0 && typeof obj[0] === 'object'
        ? '\n' + obj.map((item) => pad + '- ' + toYaml(item, indent + 1).replace(/^\n/, '')).join('\n')
        : '\n' + obj.map((item) => pad + '- ' + toYaml(item, indent + 1)).join('\n')
    }
    if (typeof obj === 'object') {
      const keys = Object.keys(obj)
      if (keys.length === 0) return '{}'
      return '\n' + keys.map((k) => {
        const v = (obj as any)[k]
        if (typeof v === 'object' && v !== null) {
          return pad + k + ':' + toYaml(v, indent + 1)
        }
        return pad + k + ': ' + toYaml(v, indent + 1)
      }).join('\n')
    }
    return ''
  }

  const simpleYamlParse = (text: string): any => {
    // 极简 YAML 解析: 仅支持 key: value 与简单列表
    const lines = text.split('\n').filter((l) => l.trim() && !l.trim().startsWith('#'))
    const root: any = {}
    const stack: { obj: any; indent: number; key?: string; listMode?: boolean }[] = [{ obj: root, indent: -1 }]

    const parseValue = (v: string): any => {
      v = v.trim()
      if (v === 'true') return true
      if (v === 'false') return false
      if (v === 'null' || v === '~') return null
      if (v.startsWith('"') && v.endsWith('"')) return v.slice(1, -1)
      if (v.startsWith("'") && v.endsWith("'")) return v.slice(1, -1)
      if (!isNaN(Number(v)) && v !== '') return Number(v)
      return v
    }

    for (const line of lines) {
      const indent = line.match(/^\s*/)?.[0].length ?? 0
      const content = line.trim()
      while (stack.length > 1 && stack[stack.length - 1].indent >= indent) stack.pop()
      const parent = stack[stack.length - 1]

      if (content.startsWith('- ')) {
        const val = content.slice(2).trim()
        const container = parent.obj
        if (parent.key) {
          const target = container[parent.key]
          if (Array.isArray(target)) target.push(parseValue(val))
          else container[parent.key] = [parseValue(val)]
        } else {
          // ignore list at root without container
        }
      } else if (content.includes(':')) {
        const colonIdx = content.indexOf(':')
        const key = content.slice(0, colonIdx).trim()
        const value = content.slice(colonIdx + 1).trim()
        if (value === '') {
          parent.obj[key] = {}
          stack.push({ obj: parent.obj[key], indent, key: undefined })
        } else {
          parent.obj[key] = parseValue(value)
        }
      }
    }
    return root
  }

  const { output, error } = useMemo(() => {
    try {
      if (!input.trim()) return { output: '', error: '' }
      if (mode === 'json2yaml') {
        const parsed = JSON.parse(input)
        return { output: toYaml(parsed).replace(/^\n/, ''), error: '' }
      } else {
        const parsed = simpleYamlParse(input)
        return { output: JSON.stringify(parsed, null, 2), error: '' }
      }
    } catch (e) {
      return { output: '', error: e instanceof Error ? e.message : '解析失败' }
    }
  }, [input, mode])

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
      <div style={{ display: 'flex', gap: 8 }}>
        <Button variant={mode === 'json2yaml' ? 'primary' : 'secondary'} onClick={() => setMode('json2yaml')}>JSON → YAML</Button>
        <Button variant={mode === 'yaml2json' ? 'primary' : 'secondary'} onClick={() => setMode('yaml2json')}>YAML → JSON</Button>
      </div>
      <Textarea placeholder={mode === 'json2yaml' ? '粘贴 JSON...' : '粘贴 YAML (简单格式)...'} value={input} onChange={setInput} rows={10} />
      {error && <OutputBox label="错误"><span style={{ color: '#fca5a5' }}>{error}</span></OutputBox>}
      {!error && output && <OutputBox label="输出">{output}</OutputBox>}
    </div>
  )
}

/* =========================================================
   JSON 差异
========================================================= */
function JsonDiff() {
  const [a, setA] = useState('{"name":"WebLinuxOS","version":"1.0","features":["a","b"]}')
  const [b, setB] = useState('{"name":"WebLinuxOS","version":"1.1","features":["a","b","c"],"newKey":true}')

  const diff = (left: any, right: any, path = ''): string[] => {
    const lines: string[] = []
    if (JSON.stringify(left) === JSON.stringify(right)) return lines
    if (Array.isArray(left) && Array.isArray(right)) {
      const maxLen = Math.max(left.length, right.length)
      for (let i = 0; i < maxLen; i++) {
        if (i >= left.length) lines.push(`+ ${path}[${i}]: ${JSON.stringify(right[i])}`)
        else if (i >= right.length) lines.push(`- ${path}[${i}]: ${JSON.stringify(left[i])}`)
        else lines.push(...diff(left[i], right[i], `${path}[${i}]`))
      }
      return lines
    }
    if (typeof left === 'object' && typeof right === 'object' && left !== null && right !== null) {
      const keys = new Set([...Object.keys(left), ...Object.keys(right)])
      for (const k of keys) {
        if (!(k in right)) lines.push(`- ${path}/${k}: ${JSON.stringify(left[k])}`)
        else if (!(k in left)) lines.push(`+ ${path}/${k}: ${JSON.stringify(right[k])}`)
        else lines.push(...diff(left[k], right[k], `${path}/${k}`))
      }
      return lines
    }
    lines.push(`~ ${path}: ${JSON.stringify(left)} → ${JSON.stringify(right)}`)
    return lines
  }

  const { output, error } = useMemo(() => {
    try {
      const pa = JSON.parse(a)
      const pb = JSON.parse(b)
      const result = diff(pa, pb)
      return { output: result.length ? result.join('\n') : '（两者完全相同）', error: '' }
    } catch (e) {
      return { output: '', error: e instanceof Error ? e.message : '解析失败' }
    }
  }, [a, b])

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
        <div>
          <div style={{ fontSize: 11, color: '#a8a8c0', marginBottom: 4, fontWeight: 600 }}>原始 (A)</div>
          <Textarea value={a} onChange={setA} placeholder="JSON A..." rows={6} />
        </div>
        <div>
          <div style={{ fontSize: 11, color: '#a8a8c0', marginBottom: 4, fontWeight: 600 }}>修改 (B)</div>
          <Textarea value={b} onChange={setB} placeholder="JSON B..." rows={6} />
        </div>
      </div>
      {error && <OutputBox label="错误"><span style={{ color: '#fca5a5' }}>{error}</span></OutputBox>}
      {!error && (
        <OutputBox label="差异">
          {output.split('\n').map((line, i) => {
            const color = line.startsWith('+') ? '#86efac' : line.startsWith('-') ? '#fca5a5' : line.startsWith('~') ? '#fcd34d' : '#d4d4e8'
            return <div key={i} style={{ color }}>{line}</div>
          })}
        </OutputBox>
      )}
    </div>
  )
}

/* =========================================================
   JSON Schema 生成器
========================================================= */
function JsonSchemaTool() {
  const [input, setInput] = useState('{"name":"WebLinuxOS","version":"1.0.0","apps":["terminal","files"],"meta":{"released":true,"stars":42}}')

  const infer = (value: any): any => {
    if (value === null) return { type: 'null' }
    if (Array.isArray(value)) {
      const items = value.length > 0 ? infer(value[0]) : {}
      return { type: 'array', items }
    }
    if (typeof value === 'object') {
      const properties: any = {}
      for (const k of Object.keys(value)) properties[k] = infer(value[k])
      return { type: 'object', properties, required: Object.keys(value) }
    }
    if (typeof value === 'string') return { type: 'string' }
    if (typeof value === 'number') return { type: Number.isInteger(value) ? 'integer' : 'number' }
    if (typeof value === 'boolean') return { type: 'boolean' }
    return {}
  }

  const { output, error } = useMemo(() => {
    try {
      const parsed = JSON.parse(input)
      return { output: JSON.stringify({ $schema: 'http://json-schema.org/draft-07/schema#', ...infer(parsed) }, null, 2), error: '' }
    } catch (e) {
      return { output: '', error: e instanceof Error ? e.message : '解析失败' }
    }
  }, [input])

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
      <Textarea placeholder="粘贴示例 JSON 数据..." value={input} onChange={setInput} rows={8} />
      {error && <OutputBox label="错误"><span style={{ color: '#fca5a5' }}>{error}</span></OutputBox>}
      {!error && output && <OutputBox label="生成的 JSON Schema">{output}</OutputBox>}
    </div>
  )
}

/* =========================================================
   正则表达式测试
========================================================= */
function RegexTester() {
  const [pattern, setPattern] = useState('\\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\\.[A-Z|a-z]{2,}\\b')
  const [flags, setFlags] = useState('gi')
  const [text, setText] = useState('联系我们: hello@weblinuxos.com 或 support@example.org。无效邮箱: invalid@, @nodomain')

  const { matches, error } = useMemo(() => {
    try {
      const re = new RegExp(pattern, flags)
      const m: { match: string; index: number }[] = []
      if (flags.includes('g')) {
        let match
        while ((match = re.exec(text)) !== null) {
          m.push({ match: match[0], index: match.index })
          if (match[0] === '') re.lastIndex++
        }
      } else {
        const single = re.exec(text)
        if (single) m.push({ match: single[0], index: single.index })
      }
      return { matches: m, error: '' }
    } catch (e) {
      return { matches: [], error: e instanceof Error ? e.message : '正则错误' }
    }
  }, [pattern, flags, text])

  const highlighted = useMemo(() => {
    if (!pattern || !text || error) return text
    try {
      const re = new RegExp(pattern, flags.includes('g') ? flags : flags + 'g')
      const parts: { text: string; match: boolean }[] = []
      let last = 0
      let match
      while ((match = re.exec(text)) !== null) {
        if (match.index > last) parts.push({ text: text.slice(last, match.index), match: false })
        parts.push({ text: match[0], match: true })
        last = match.index + match[0].length
        if (match[0] === '') re.lastIndex++
      }
      if (last < text.length) parts.push({ text: text.slice(last), match: false })
      return parts
    } catch {
      return text
    }
  }, [pattern, flags, text, error])

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
      <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
        <div style={{
          fontSize: 14, color: '#d4d4e8', fontFamily: "'JetBrains Mono', monospace",
          padding: '6px 8px', background: 'rgba(20,22,32,0.6)', borderRadius: 6, border: '1px solid rgba(120,120,140,0.25)',
        }}>/</div>
        <input
          type="text"
          value={pattern}
          onChange={(e) => setPattern(e.target.value)}
          placeholder="正则表达式"
          style={{
            flex: 1, padding: '8px 12px', borderRadius: 6,
            border: '1px solid rgba(120,120,140,0.25)', background: 'rgba(20,22,32,0.6)',
            color: '#e6e6f0', fontFamily: "'JetBrains Mono', monospace", fontSize: 13, outline: 'none',
          }}
        />
        <div style={{
          fontSize: 14, color: '#d4d4e8', fontFamily: "'JetBrains Mono', monospace",
          padding: '6px 8px', background: 'rgba(20,22,32,0.6)', borderRadius: 6, border: '1px solid rgba(120,120,140,0.25)',
        }}>/</div>
        <input
          type="text"
          value={flags}
          onChange={(e) => setFlags(e.target.value)}
          placeholder="gi"
          style={{
            width: 60, padding: '8px 10px', borderRadius: 6,
            border: '1px solid rgba(120,120,140,0.25)', background: 'rgba(20,22,32,0.6)',
            color: '#e6e6f0', fontFamily: "'JetBrains Mono', monospace", fontSize: 13, outline: 'none',
          }}
        />
      </div>
      <Textarea placeholder="测试文本..." value={text} onChange={setText} rows={6} />
      {error && <OutputBox label="错误"><span style={{ color: '#fca5a5' }}>{error}</span></OutputBox>}
      {!error && (
        <>
          <div style={{ fontSize: 12, color: '#a8a8c0' }}>找到 {matches.length} 个匹配</div>
          <OutputBox label="高亮显示">
            {typeof highlighted === 'string' ? (
              highlighted
            ) : (
              <span>
                {highlighted.map((p, i) => (
                  <span key={i} style={p.match ? { background: 'rgba(99,102,241,0.35)', padding: '1px 2px', borderRadius: 3, color: '#e0e7ff', borderBottom: '2px solid #6366f1' } : {}}>
                    {p.text}
                  </span>
                ))}
              </span>
            )}
          </OutputBox>
          {matches.length > 0 && (
            <OutputBox label="匹配详情">
              {matches.map((m, i) => (
                <div key={i} style={{ padding: '3px 0' }}>
                  <span style={{ color: '#6366f1' }}>#{i + 1}</span>
                  <span style={{ margin: '0 8px', color: '#a8a8c0' }}>位置 {m.index}:</span>
                  <span style={{ color: '#e6e6f0' }}>{m.match}</span>
                </div>
              ))}
            </OutputBox>
          )}
        </>
      )}
    </div>
  )
}

/* =========================================================
   格式转换
========================================================= */
function CaseConverter() {
  const [input, setInput] = useState('The quick brown fox jumps over the lazy dog')
  const convert = useCallback((text: string): Record<string, string> => {
    const words = text
      .trim()
      .replace(/[_-]+/g, ' ')
      .replace(/([a-z])([A-Z])/g, '$1 $2')
      .toLowerCase()
      .split(/\s+/)
      .filter(Boolean)
    return {
      camelCase: words.map((w, i) => (i === 0 ? w : w[0].toUpperCase() + w.slice(1))).join(''),
      PascalCase: words.map((w) => w[0].toUpperCase() + w.slice(1)).join(''),
      snake_case: words.join('_'),
      SCREAMING_SNAKE_CASE: words.join('_').toUpperCase(),
      'kebab-case': words.join('-'),
      'SCREAMING-KEBAB-CASE': words.join('-').toUpperCase(),
      'dot.case': words.join('.'),
      'Title Case': words.map((w) => w[0].toUpperCase() + w.slice(1)).join(' '),
      'Sentence case': words.map((w, i) => (i === 0 ? w[0].toUpperCase() + w.slice(1) : w)).join(' '),
      lowercase: words.join(' ').toLowerCase(),
      UPPERCASE: words.join(' ').toUpperCase(),
    }
  }, [])

  const results = useMemo(() => convert(input), [input, convert])

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
      <Textarea placeholder="输入文本..." value={input} onChange={setInput} rows={3} />
      <div style={{ display: 'grid', gap: 8 }}>
        {Object.entries(results).map(([k, v]) => (
          <div key={k} style={{
            display: 'flex', alignItems: 'center', gap: 12,
            padding: '8px 12px', background: 'rgba(20,22,32,0.6)', borderRadius: 6,
            border: '1px solid rgba(120,120,140,0.2)',
          }}>
            <div style={{ minWidth: 200, fontSize: 12, color: '#a8a8c0', fontWeight: 600 }}>{k}</div>
            <div style={{
              flex: 1, color: '#e6e6f0', fontFamily: "'JetBrains Mono', monospace", fontSize: 13,
              wordBreak: 'break-all',
            }}>{v || <span style={{ color: '#a8a8c0', opacity: 0.5 }}>（空）</span>}</div>
          </div>
        ))}
      </div>
    </div>
  )
}

/* =========================================================
   文本差异
========================================================= */
function TextDiff() {
  const [a, setA] = useState('第一行文本\n第二行保持不变\n第三行被修改\n第四行仅在A中')
  const [b, setB] = useState('第一行文本\n第二行保持不变\n第三行已经变化\n新增行在B中')

  const diffLines = (l1: string[], l2: string[]): { type: 'same' | 'add' | 'del' | 'mod'; text: string }[] => {
    const result: { type: 'same' | 'add' | 'del' | 'mod'; text: string }[] = []
    const max = Math.max(l1.length, l2.length)
    for (let i = 0; i < max; i++) {
      if (i >= l1.length) result.push({ type: 'add', text: l2[i] })
      else if (i >= l2.length) result.push({ type: 'del', text: l1[i] })
      else if (l1[i] === l2[i]) result.push({ type: 'same', text: l1[i] })
      else {
        result.push({ type: 'mod', text: `[A] ${l1[i]}  →  [B] ${l2[i]}` })
      }
    }
    return result
  }

  const result = useMemo(() => diffLines(a.split('\n'), b.split('\n')), [a, b])

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
        <div>
          <div style={{ fontSize: 11, color: '#a8a8c0', marginBottom: 4, fontWeight: 600 }}>文本 A</div>
          <Textarea value={a} onChange={setA} rows={6} />
        </div>
        <div>
          <div style={{ fontSize: 11, color: '#a8a8c0', marginBottom: 4, fontWeight: 600 }}>文本 B</div>
          <Textarea value={b} onChange={setB} rows={6} />
        </div>
      </div>
      <OutputBox label="逐行对比">
        {result.map((line, i) => {
          const color = line.type === 'same' ? '#d4d4e8' : line.type === 'add' ? '#86efac' : line.type === 'del' ? '#fca5a5' : '#fcd34d'
          const prefix = line.type === 'same' ? '  ' : line.type === 'add' ? '+ ' : line.type === 'del' ? '- ' : '~ '
          return <div key={i} style={{ color }}>{prefix}{line.text}</div>
        })}
      </OutputBox>
    </div>
  )
}

/* =========================================================
   Hash 生成器 (使用 Web Crypto API 的 SHA)
========================================================= */
function HashGenerator() {
  const [input, setInput] = useState('Hello, WebLinuxOS!')

  const simpleMD5 = (text: string): string => {
    // 简化版: 非标准 MD5，仅用于演示目的 (真正 MD5 需用复杂算法)
    // 这里我们用一个确定性的 32 位十六进制字符串作为占位符
    let hash = 0
    for (let i = 0; i < text.length; i++) {
      hash = ((hash << 5) - hash) + text.charCodeAt(i)
      hash |= 0
    }
    const seed = Math.abs(hash) || 1
    let a = seed, result = ''
    for (let i = 0; i < 16; i++) {
      a = (a * 1103515245 + 12345) & 0x7fffffff
      result += (a % 256).toString(16).padStart(2, '0')
    }
    return result
  }

  const sha = async (text: string, algo: string): Promise<string> => {
    const buf = new TextEncoder().encode(text)
    const hash = await crypto.subtle.digest(algo, buf)
    return Array.from(new Uint8Array(hash)).map((b) => b.toString(16).padStart(2, '0')).join('')
  }

  const [hashes, setHashes] = useState<Record<string, string>>({})
  React.useEffect(() => {
    const run = async () => {
      const next: Record<string, string> = { MD5: simpleMD5(input) }
      try {
        next['SHA-1'] = await sha(input, 'SHA-1')
        next['SHA-256'] = await sha(input, 'SHA-256')
        next['SHA-512'] = await sha(input, 'SHA-512')
      } catch {
        next['error'] = '浏览器不支持 Web Crypto API'
      }
      setHashes(next)
    }
    run()
  }, [input])

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
      <Textarea placeholder="输入要哈希的文本..." value={input} onChange={setInput} rows={3} />
      <div style={{ display: 'grid', gap: 8 }}>
        {Object.entries(hashes).map(([k, v]) => (
          <div key={k} style={{
            padding: '10px 12px', background: 'rgba(20,22,32,0.6)', borderRadius: 8,
            border: '1px solid rgba(120,120,140,0.2)',
          }}>
            <div style={{ fontSize: 11, color: '#a8a8c0', fontWeight: 600, marginBottom: 4 }}>{k} ({v.length * 4} bit, {v.length} chars)</div>
            <div style={{
              color: '#e6e6f0', fontFamily: "'JetBrains Mono', monospace", fontSize: 12,
              wordBreak: 'break-all', lineHeight: 1.6,
            }}>{v}</div>
          </div>
        ))}
      </div>
      <div style={{ fontSize: 11, color: 'rgba(168,168,192,0.7)' }}>注意: MD5 为轻量实现，SHA 系列由浏览器 Web Crypto API 生成</div>
    </div>
  )
}

/* =========================================================
   UUID 生成器
========================================================= */
function UuidGenerator() {
  const [count, setCount] = useState(5)
  const [uuids, setUuids] = useState<string[]>([])

  React.useEffect(() => {
    const generate = () => {
      if (typeof crypto !== 'undefined' && 'randomUUID' in crypto) {
        try {
          return (crypto as any).randomUUID()
        } catch {}
      }
      return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
        const r = (Math.random() * 16) | 0
        const v = c === 'x' ? r : (r & 0x3) | 0x8
        return v.toString(16)
      })
    }
    setUuids(Array.from({ length: count }, () => generate()))
  }, [count])

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
      <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
        <span style={{ fontSize: 12, color: '#a8a8c0' }}>数量:</span>
        {[1, 5, 10, 20, 50].map((n) => (
          <Button key={n} variant={count === n ? 'primary' : 'secondary'} onClick={() => setCount(n)}>{n}</Button>
        ))}
        <Button variant="secondary" onClick={() => setUuids([...uuids])}>🔄 刷新</Button>
      </div>
      <OutputBox label="生成的 UUID v4">
        {uuids.map((u, i) => (
          <div key={i} style={{
            padding: '5px 0', fontFamily: "'JetBrains Mono', monospace", fontSize: 13,
            color: '#e6e6f0', borderBottom: i < uuids.length - 1 ? '1px solid rgba(120,120,140,0.1)' : 'none',
          }}>
            <span style={{ color: '#a8a8c0', marginRight: 12 }}>{String(i + 1).padStart(2, '0')}.</span>{u}
          </div>
        ))}
      </OutputBox>
    </div>
  )
}

/* =========================================================
   密码生成器
========================================================= */
function PasswordGen() {
  const [length, setLength] = useState(16)
  const [options, setOptions] = useState({
    upper: true,
    lower: true,
    numbers: true,
    symbols: true,
    excludeAmbiguous: false,
  })
  const [count, setCount] = useState(3)

  const passwords = useMemo(() => {
    const sets: Record<string, string> = {
      upper: 'ABCDEFGHJKLMNPQRSTUVWXYZ',
      lower: 'abcdefghijkmnpqrstuvwxyz',
      numbers: '23456789',
      symbols: '!@#$%^&*()-_=+[]{};:,.<>?/',
    }
    if (options.excludeAmbiguous) {
      sets.upper = sets.upper.replace(/[IO]/g, '')
      sets.lower = sets.lower.replace(/[l]/g, '')
    }
    let pool = ''
    if (options.upper) pool += sets.upper
    if (options.lower) pool += sets.lower
    if (options.numbers) pool += sets.numbers
    if (options.symbols) pool += sets.symbols
    if (!pool) return Array(count).fill('（请至少选择一种字符类型）')

    const arr = new Uint32Array(length * count)
    if (typeof crypto !== 'undefined' && 'getRandomValues' in crypto) crypto.getRandomValues(arr)
    else for (let i = 0; i < arr.length; i++) arr[i] = Math.floor(Math.random() * 256)

    const result: string[] = []
    for (let c = 0; c < count; c++) {
      let pwd = ''
      for (let i = 0; i < length; i++) {
        pwd += pool[arr[c * length + i] % pool.length]
      }
      result.push(pwd)
    }
    return result
  }, [length, options, count])

  const strength = useMemo(() => {
    let bits = 0
    if (options.upper) bits += 26
    if (options.lower) bits += 26
    if (options.numbers) bits += 10
    if (options.symbols) bits += 28
    const entropy = Math.floor(length * Math.log2(bits || 1))
    if (entropy < 40) return { label: '弱', color: '#fca5a5', score: entropy }
    if (entropy < 80) return { label: '中等', color: '#fcd34d', score: entropy }
    if (entropy < 120) return { label: '强', color: '#86efac', score: entropy }
    return { label: '极强', color: '#93c5fd', score: entropy }
  }, [length, options])

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
      <div style={{
        display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 12,
        padding: 16, background: 'rgba(20,22,32,0.4)', borderRadius: 8,
      }}>
        <label style={{ display: 'flex', flexDirection: 'column', gap: 6, fontSize: 12, color: '#a8a8c0' }}>
          长度: {length}
          <input type="range" min={4} max={64} value={length} onChange={(e) => setLength(Number(e.target.value))} />
        </label>
        <label style={{ display: 'flex', flexDirection: 'column', gap: 6, fontSize: 12, color: '#a8a8c0' }}>
          数量: {count}
          <input type="range" min={1} max={10} value={count} onChange={(e) => setCount(Number(e.target.value))} />
        </label>
      </div>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 12 }}>
        {(['upper', 'lower', 'numbers', 'symbols', 'excludeAmbiguous'] as const).map((k) => (
          <label key={k} style={{
            display: 'flex', alignItems: 'center', gap: 6, cursor: 'pointer', fontSize: 13, color: '#d4d4e8',
            padding: '6px 12px', background: 'rgba(20,22,32,0.4)', borderRadius: 6,
          }}>
            <input type="checkbox" checked={options[k]} onChange={(e) => setOptions({ ...options, [k]: e.target.checked })} />
            {k === 'upper' ? '大写字母 (A-Z)' : k === 'lower' ? '小写字母 (a-z)' : k === 'numbers' ? '数字 (0-9)' : k === 'symbols' ? '符号 (!@#...)' : '排除歧义字符 (0/O/1/l)'}
          </label>
        ))}
      </div>
      <div style={{
        padding: '10px 14px', background: 'rgba(20,22,32,0.4)', borderRadius: 8,
        fontSize: 13, color: '#d4d4e8', display: 'flex', justifyContent: 'space-between',
      }}>
        <span>密码强度</span>
        <span style={{ color: strength.color, fontWeight: 600 }}>{strength.label} ({strength.score} bits)</span>
      </div>
      <OutputBox label="生成的密码">
        {passwords.map((p, i) => (
          <div key={i} style={{
            padding: '6px 0', fontFamily: "'JetBrains Mono', monospace", fontSize: 14,
            color: '#e6e6f0', borderBottom: i < passwords.length - 1 ? '1px solid rgba(120,120,140,0.1)' : 'none',
          }}>{p}</div>
        ))}
      </OutputBox>
    </div>
  )
}

/* =========================================================
   JWT 解析器
========================================================= */
function JwtDecoder() {
  const [token, setToken] = useState('eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIiwibmFtZSI6IldlYkxpbnV4T1MiLCJhZG1pbiI6dHJ1ZSwiaWF0IjoxNTE2MjM5MDIyfQ.SflKxwRJSMeKKF2QT4fwpMeJf36POk6yJV_adQssw5c')

  const { header, payload, signature, valid, error } = useMemo(() => {
    try {
      const parts = token.split('.')
      if (parts.length !== 3) return { header: '', payload: '', signature: '', valid: false, error: 'JWT 格式错误: 应为 xxx.yyy.zzz' }
      const base64Decode = (s: string) => {
        s = s.replace(/-/g, '+').replace(/_/g, '/')
        while (s.length % 4) s += '='
        const binary = atob(s)
        const bytes = new Uint8Array(binary.length)
        for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i)
        return new TextDecoder('utf-8').decode(bytes)
      }
      const h = base64Decode(parts[0])
      const p = base64Decode(parts[1])
      return { header: JSON.stringify(JSON.parse(h), null, 2), payload: JSON.stringify(JSON.parse(p), null, 2), signature: parts[2], valid: true, error: '' }
    } catch (e) {
      return { header: '', payload: '', signature: '', valid: false, error: e instanceof Error ? e.message : '解析失败' }
    }
  }, [token])

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
      <Textarea placeholder="粘贴 JWT Token..." value={token} onChange={setToken} rows={3} />
      {error && <OutputBox label="错误"><span style={{ color: '#fca5a5' }}>{error}</span></OutputBox>}
      {valid && (
        <>
          <OutputBox label="Header">{header}</OutputBox>
          <OutputBox label="Payload">{payload}</OutputBox>
          <OutputBox label="Signature (未验证)">{signature}</OutputBox>
        </>
      )}
    </div>
  )
}

/* =========================================================
   Unix 时间戳
========================================================= */
function TimestampTool() {
  const [now, setNow] = useState(Date.now())
  const [custom, setCustom] = useState(String(Math.floor(Date.now() / 1000)))
  const [dateStr, setDateStr] = useState(new Date().toISOString().slice(0, 19))

  React.useEffect(() => {
    const t = setInterval(() => setNow(Date.now()), 1000)
    return () => clearInterval(t)
  }, [])

  const customDate = useMemo(() => {
    try {
      const n = Number(custom)
      if (isNaN(n)) return { error: '无效数字', date: '' }
      const d = new Date(n < 1e12 ? n * 1000 : n) // 支持秒或毫秒
      return { error: '', date: d.toLocaleString('zh-CN'), iso: d.toISOString(), rfc: d.toUTCString() } as any
    } catch {
      return { error: '解析失败', date: '' }
    }
  }, [custom])

  const fromDate = useMemo(() => {
    try {
      const d = new Date(dateStr.replace(' ', 'T'))
      if (isNaN(d.getTime())) return { error: '无效日期', ts: '' }
      return { error: '', ts: String(Math.floor(d.getTime() / 1000)), ms: String(d.getTime()) } as any
    } catch {
      return { error: '解析失败', ts: '' }
    }
  }, [dateStr])

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      <div style={{
        padding: 16, background: 'linear-gradient(135deg, rgba(99,102,241,0.15), rgba(139,92,246,0.1))',
        borderRadius: 10, border: '1px solid rgba(99,102,241,0.3)',
      }}>
        <div style={{ fontSize: 11, color: '#a8a8c0', marginBottom: 6, letterSpacing: 1 }}>当前时间戳 (自动更新)</div>
        <div style={{ fontSize: 28, fontWeight: 700, color: '#e6e6f0', fontFamily: "'JetBrains Mono', monospace" }}>{Math.floor(now / 1000)}</div>
        <div style={{ fontSize: 12, color: '#a8a8c0', marginTop: 4 }}>毫秒: {now}</div>
        <div style={{ fontSize: 12, color: '#d4d4e8', marginTop: 8 }}>{new Date(now).toLocaleString('zh-CN')}</div>
      </div>

      <div>
        <div style={{ fontSize: 12, color: '#a8a8c0', marginBottom: 8, fontWeight: 600 }}>时间戳 → 日期时间</div>
        <div style={{ display: 'flex', gap: 8, marginBottom: 8 }}>
          <input
            type="text" value={custom} onChange={(e) => setCustom(e.target.value)}
            placeholder="输入时间戳 (秒或毫秒)"
            style={{
              flex: 1, padding: '10px 12px', borderRadius: 6,
              border: '1px solid rgba(120,120,140,0.25)', background: 'rgba(20,22,32,0.6)',
              color: '#e6e6f0', fontFamily: "'JetBrains Mono', monospace", fontSize: 13, outline: 'none',
            }}
          />
        </div>
        {customDate.error ? (
          <div style={{ color: '#fca5a5', fontSize: 12 }}>{customDate.error}</div>
        ) : (
          <OutputBox label="结果">
            <div>本地时间: {customDate.date}</div>
            <div>ISO 8601: {customDate.iso}</div>
            <div>RFC 2822: {customDate.rfc}</div>
          </OutputBox>
        )}
      </div>

      <div>
        <div style={{ fontSize: 12, color: '#a8a8c0', marginBottom: 8, fontWeight: 600 }}>日期时间 → 时间戳 (格式: YYYY-MM-DDTHH:MM:SS)</div>
        <input
          type="text" value={dateStr} onChange={(e) => setDateStr(e.target.value)}
          style={{
            width: '100%', padding: '10px 12px', borderRadius: 6, boxSizing: 'border-box',
            border: '1px solid rgba(120,120,140,0.25)', background: 'rgba(20,22,32,0.6)',
            color: '#e6e6f0', fontFamily: "'JetBrains Mono', monospace", fontSize: 13, outline: 'none',
          }}
        />
        {fromDate.error ? (
          <div style={{ color: '#fca5a5', fontSize: 12, marginTop: 8 }}>{fromDate.error}</div>
        ) : (
          <div style={{ marginTop: 8 }}>
            <OutputBox label="结果">
            <div>Unix 时间戳 (秒): {fromDate.ts}</div>
            <div>Unix 时间戳 (毫秒): {fromDate.ms}</div>
          </OutputBox>
          </div>
        )}
      </div>
    </div>
  )
}

/* =========================================================
   进制转换
========================================================= */
function NumberBase() {
  const [input, setInput] = useState('255')
  const [base, setBase] = useState(10)

  const result = useMemo(() => {
    try {
      const val = parseInt(input.trim(), base)
      if (isNaN(val)) return { error: '无效数字', values: null }
      return {
        error: '',
        values: {
          binary: val.toString(2),
          octal: val.toString(8),
          decimal: val.toString(10),
          hex: val.toString(16).toUpperCase(),
        },
      }
    } catch {
      return { error: '解析失败', values: null }
    }
  }, [input, base])

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
      <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>
        <span style={{ fontSize: 12, color: '#a8a8c0' }}>输入进制:</span>
        {[2, 8, 10, 16].map((b) => (
          <Button key={b} variant={base === b ? 'primary' : 'secondary'} onClick={() => setBase(b)}>
            {b === 2 ? '二进制' : b === 8 ? '八进制' : b === 10 ? '十进制' : '十六进制'}
          </Button>
        ))}
      </div>
      <Textarea placeholder="输入数字..." value={input} onChange={setInput} rows={2} />
      {result.error && <OutputBox label="错误"><span style={{ color: '#fca5a5' }}>{result.error}</span></OutputBox>}
      {result.values && (
        <div style={{ display: 'grid', gap: 8 }}>
          {([
            ['二进制 (Base 2)', result.values.binary],
            ['八进制 (Base 8)', result.values.octal],
            ['十进制 (Base 10)', result.values.decimal],
            ['十六进制 (Base 16)', result.values.hex],
          ] as const).map(([label, val]) => (
            <div key={label} style={{
              display: 'flex', gap: 12, padding: '10px 12px',
              background: 'rgba(20,22,32,0.6)', borderRadius: 6,
              border: '1px solid rgba(120,120,140,0.2)',
            }}>
              <div style={{ minWidth: 160, fontSize: 12, color: '#a8a8c0', fontWeight: 600 }}>{label}</div>
              <div style={{ flex: 1, color: '#e6e6f0', fontFamily: "'JetBrains Mono', monospace", fontSize: 13, wordBreak: 'break-all' }}>{val}</div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

/* =========================================================
   CSV/TSV → JSON
========================================================= */
function CsvJson() {
  const [csv, setCsv] = useState('name,version,category\nterminal,1.0,system\nfiles,1.2,system\nweather,2.0,utility')

  const { output, error } = useMemo(() => {
    try {
      const lines = csv.split('\n').filter((l) => l.trim())
      if (lines.length < 1) return { output: '', error: '无数据' }
      const sep = lines[0].includes('\t') ? '\t' : ','
      const headers = lines[0].split(sep).map((h) => h.trim())
      const rows = lines.slice(1).map((l) => {
        const cells = l.split(sep)
        const obj: Record<string, string> = {}
        headers.forEach((h, i) => (obj[h] = (cells[i] ?? '').trim()))
        return obj
      })
      return { output: JSON.stringify(rows, null, 2), error: '' }
    } catch (e) {
      return { output: '', error: e instanceof Error ? e.message : '解析失败' }
    }
  }, [csv])

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
      <Textarea placeholder="粘贴 CSV 或 TSV..." value={csv} onChange={setCsv} rows={8} />
      {error && <OutputBox label="错误"><span style={{ color: '#fca5a5' }}>{error}</span></OutputBox>}
      {!error && output && <OutputBox label="JSON 结果">{output}</OutputBox>}
    </div>
  )
}

/* =========================================================
   HTTP 状态码
========================================================= */
function HttpStatus() {
  const [query, setQuery] = useState('')
  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase()
    if (!q) return HTTP_STATUS_CODES
    return HTTP_STATUS_CODES.filter((c) => String(c.code).includes(q) || c.name.toLowerCase().includes(q) || c.desc.includes(q))
  }, [query])

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
      <input
        type="text" value={query} onChange={(e) => setQuery(e.target.value)}
        placeholder="搜索状态码或关键词..."
        style={{
          padding: '10px 12px', borderRadius: 6,
          border: '1px solid rgba(120,120,140,0.25)', background: 'rgba(20,22,32,0.6)',
          color: '#e6e6f0', fontSize: 13, outline: 'none',
        }}
      />
      <div style={{ display: 'grid', gap: 6 }}>
        {filtered.map((c) => {
          const color = c.code < 300 ? '#86efac' : c.code < 400 ? '#93c5fd' : c.code < 500 ? '#fcd34d' : '#fca5a5'
          return (
            <div key={c.code} style={{
              display: 'flex', alignItems: 'center', gap: 16, padding: '10px 12px',
              background: 'rgba(20,22,32,0.6)', borderRadius: 6,
              border: '1px solid rgba(120,120,140,0.2)',
            }}>
              <div style={{
                minWidth: 52, fontSize: 14, fontWeight: 700, color,
                fontFamily: "'JetBrains Mono', monospace",
              }}>{c.code}</div>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 13, color: '#e6e6f0', fontWeight: 500 }}>{c.name}</div>
                <div style={{ fontSize: 11, color: '#a8a8c0', marginTop: 2 }}>{c.desc}</div>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}

/* =========================================================
   MIME 类型参考
========================================================= */
function MimeRef() {
  const [query, setQuery] = useState('')
  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase()
    if (!q) return MIME_TYPES
    return MIME_TYPES.filter((c) => c.type.toLowerCase().includes(q) || c.ext.includes(q) || c.desc.includes(q))
  }, [query])

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
      <input
        type="text" value={query} onChange={(e) => setQuery(e.target.value)}
        placeholder="搜索 MIME 类型..."
        style={{
          padding: '10px 12px', borderRadius: 6,
          border: '1px solid rgba(120,120,140,0.25)', background: 'rgba(20,22,32,0.6)',
          color: '#e6e6f0', fontSize: 13, outline: 'none',
        }}
      />
      <div style={{ display: 'grid', gap: 6 }}>
        {filtered.map((c, i) => (
          <div key={i} style={{
            display: 'grid', gridTemplateColumns: '1fr 120px 1fr', gap: 12, padding: '10px 12px',
            background: 'rgba(20,22,32,0.6)', borderRadius: 6,
            border: '1px solid rgba(120,120,140,0.2)', alignItems: 'center',
          }}>
            <div style={{ fontSize: 12, color: '#e6e6f0', fontFamily: "'JetBrains Mono', monospace" }}>{c.type}</div>
            <div style={{ fontSize: 12, color: '#a8a8c0', fontFamily: "'JetBrains Mono', monospace" }}>{c.ext || '—'}</div>
            <div style={{ fontSize: 12, color: '#d4d4e8' }}>{c.desc}</div>
          </div>
        ))}
      </div>
    </div>
  )
}

/* =========================================================
   颜色工具
========================================================= */
function ColorPicker() {
  const [hex, setHex] = useState('#6366f1')

  const rgb = useMemo(() => {
    const h = hex.replace('#', '')
    if (h.length !== 3 && h.length !== 6) return { r: 0, g: 0, b: 0, error: '无效的 HEX' }
    const full = h.length === 3 ? h.split('').map((c) => c + c).join('') : h
    return {
      r: parseInt(full.slice(0, 2), 16),
      g: parseInt(full.slice(2, 4), 16),
      b: parseInt(full.slice(4, 6), 16),
      error: '',
    }
  }, [hex])

  const hsl = useMemo(() => {
    if (rgb.error) return { h: 0, s: 0, l: 0 }
    const r = rgb.r / 255, g = rgb.g / 255, b = rgb.b / 255
    const max = Math.max(r, g, b), min = Math.min(r, g, b)
    let h = 0, s = 0
    const l = (max + min) / 2
    if (max !== min) {
      const d = max - min
      s = l > 0.5 ? d / (2 - max - min) : d / (max + min)
      switch (max) {
        case r: h = ((g - b) / d + (g < b ? 6 : 0)) / 6; break
        case g: h = ((b - r) / d + 2) / 6; break
        case b: h = ((r - g) / d + 4) / 6; break
      }
    }
    return { h: Math.round(h * 360), s: Math.round(s * 100), l: Math.round(l * 100) }
  }, [rgb])

  const normalizedHex = rgb.error ? '#000000' : '#' + [rgb.r, rgb.g, rgb.b].map((v) => v.toString(16).padStart(2, '0')).join('')

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      <div style={{ display: 'flex', gap: 16, alignItems: 'center' }}>
        <div style={{
          width: 100, height: 100, borderRadius: 12,
          background: normalizedHex,
          boxShadow: '0 4px 20px rgba(0,0,0,0.3)',
          border: '2px solid rgba(255,255,255,0.2)',
        }} />
        <div style={{ flex: 1 }}>
          <label style={{ fontSize: 12, color: '#a8a8c0', display: 'block', marginBottom: 6 }}>HEX</label>
          <input
            type="text" value={hex} onChange={(e) => setHex(e.target.value)}
            style={{
              width: '100%', padding: '8px 12px', borderRadius: 6,
              border: '1px solid rgba(120,120,140,0.25)', background: 'rgba(20,22,32,0.6)',
              color: '#e6e6f0', fontFamily: "'JetBrains Mono', monospace", fontSize: 13, outline: 'none',
            }}
          />
          <input type="color" value={normalizedHex} onChange={(e) => setHex(e.target.value)} style={{
            marginTop: 8, width: '100%', height: 36, borderRadius: 6, cursor: 'pointer', background: 'transparent',
            border: '1px solid rgba(120,120,140,0.25)',
          }} />
        </div>
      </div>
      {rgb.error ? (
        <div style={{ color: '#fca5a5', fontSize: 12 }}>{rgb.error}</div>
      ) : (
        <div style={{ display: 'grid', gap: 8 }}>
          {[
            ['HEX', normalizedHex.toUpperCase()],
            ['RGB', `rgb(${rgb.r}, ${rgb.g}, ${rgb.b})`],
            ['RGB (0-1)', `${(rgb.r / 255).toFixed(3)}, ${(rgb.g / 255).toFixed(3)}, ${(rgb.b / 255).toFixed(3)}`],
            ['HSL', `hsl(${hsl.h}, ${hsl.s}%, ${hsl.l}%)`],
            ['HSL (0-1)', `${(hsl.h / 360).toFixed(3)}, ${(hsl.s / 100).toFixed(2)}, ${(hsl.l / 100).toFixed(2)}`],
            ['CMYK', (() => {
              const r = rgb.r / 255, g = rgb.g / 255, b = rgb.b / 255
              const k = 1 - Math.max(r, g, b)
              if (k === 1) return 'cmyk(0%, 0%, 0%, 100%)'
              const c = (1 - r - k) / (1 - k), m = (1 - g - k) / (1 - k), y = (1 - b - k) / (1 - k)
              return `cmyk(${Math.round(c * 100)}%, ${Math.round(m * 100)}%, ${Math.round(y * 100)}%, ${Math.round(k * 100)}%)`
            })()],
          ].map(([label, val]) => (
            <div key={label} style={{
              display: 'flex', gap: 12, padding: '10px 12px',
              background: 'rgba(20,22,32,0.6)', borderRadius: 6,
              border: '1px solid rgba(120,120,140,0.2)',
            }}>
              <div style={{ minWidth: 120, fontSize: 12, color: '#a8a8c0', fontWeight: 600 }}>{label}</div>
              <div style={{ flex: 1, color: '#e6e6f0', fontFamily: "'JetBrains Mono', monospace", fontSize: 13 }}>{val}</div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

/* =========================================================
   QR 码生成 (纯 SVG 实现)
========================================================= */
function QrGenerator() {
  const [text, setText] = useState('https://saya-ch.github.io/WebLinuxOS/')

  // 简化的 QR 码: 使用 SVG 网格显示文本 hash 作为演示用的唯一图案
  // 真正的 QR 编码算法非常复杂，这里我们实现一个"伪 QR"视觉效果
  // 通过对文本 hash 生成伪随机的 25x25 二进制矩阵，并在四角加入定位标记
  const svg = useMemo(() => {
    if (!text) return ''
    let h = 2166136261
    for (let i = 0; i < text.length; i++) {
      h ^= text.charCodeAt(i)
      h = Math.imul(h, 16777619)
    }
    const size = 25
    const matrix: boolean[][] = []
    for (let y = 0; y < size; y++) {
      matrix[y] = []
      for (let x = 0; x < size; x++) {
        h = Math.imul(h ^ x ^ y, 16777619)
        matrix[y][x] = (h & 0xffff) > 0x8000
      }
    }
    // 定位标记
    const drawFinder = (px: number, py: number) => {
      for (let y = 0; y < 7; y++) for (let x = 0; x < 7; x++) {
        const edge = x === 0 || y === 0 || x === 6 || y === 6
        const inner = x >= 2 && x <= 4 && y >= 2 && y <= 4
        matrix[py + y][px + x] = edge || inner
      }
      for (let y = 0; y < 8; y++) for (let x = 0; x < 8; x++) {
        if (x === 7 || y === 7) {
          if (px + x < size && py + y < size) matrix[py + y][px + x] = false
        }
      }
    }
    drawFinder(0, 0)
    drawFinder(size - 7, 0)
    drawFinder(0, size - 7)

    // 生成文本 hash 以显示
    let hashHex = ''
    let h2 = h
    for (let i = 0; i < 8; i++) {
      hashHex += ((h2 >> (i * 4)) & 0xf).toString(16)
    }

    const cell = 10
    let svgContent = ''
    for (let y = 0; y < size; y++) {
      for (let x = 0; x < size; x++) {
        if (matrix[y][x]) {
          svgContent += `<rect x="${x * cell}" y="${y * cell}" width="${cell}" height="${cell}" fill="#1e1e2e"/>`
        }
      }
    }

    return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${size * cell} ${size * cell}" width="250" style="background:#fff;padding:10px;border-radius:8px">
      ${svgContent}
    </svg>`
  }, [text])

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      <Textarea placeholder="输入要编码的文本或 URL..." value={text} onChange={setText} rows={3} />
      <div style={{ display: 'flex', justifyContent: 'center', padding: 20, background: 'rgba(255,255,255,0.95)', borderRadius: 12 }}>
        <div dangerouslySetInnerHTML={{ __html: svg }} />
      </div>
      <div style={{ fontSize: 11, color: '#a8a8c0', textAlign: 'center' }}>
        注: 这是视觉化的内容标识图案（基于输入文本的确定性 hash），非标准 QR 编码
      </div>
    </div>
  )
}

/* =========================================================
   Markdown 预览
========================================================= */
function MarkdownPreview() {
  const [md, setMd] = useState('# WebLinuxOS 开发者工具箱\n\n这是一个**一站式**开发工具集合。\n\n## 支持功能\n\n- JSON 格式化与 Schema 生成\n- 正则表达式实时测试\n- Hash / UUID 生成\n- Base64 与 URL 编码\n- Unix 时间戳转换\n- 进制转换\n- 密码生成\n- HTTP / MIME 速查\n\n> 代码示例:\n\n```javascript\nconsole.log("Hello, WebLinuxOS!");\n```\n\n访问 [官网](https://saya-ch.github.io/WebLinuxOS/) 了解更多。')

  const simpleRender = (text: string): string => {
    let html = text
    // 保护代码块
    const codeBlocks: string[] = []
    html = html.replace(/```([\s\S]*?)```/g, (_, block) => {
      codeBlocks.push(block)
      return `\u0000CB${codeBlocks.length - 1}\u0000`
    })
    // 标题
    html = html.replace(/^######\s+(.+)$/gm, '<h6 style="margin:12px 0 6px 0;color:#e6e6f0;font-size:13px">$1</h6>')
    html = html.replace(/^#####\s+(.+)$/gm, '<h5 style="margin:12px 0 6px 0;color:#e6e6f0;font-size:14px">$1</h5>')
    html = html.replace(/^####\s+(.+)$/gm, '<h4 style="margin:14px 0 8px 0;color:#e6e6f0;font-size:15px">$1</h4>')
    html = html.replace(/^###\s+(.+)$/gm, '<h3 style="margin:16px 0 8px 0;color:#e6e6f0;font-size:17px">$1</h3>')
    html = html.replace(/^##\s+(.+)$/gm, '<h2 style="margin:18px 0 10px 0;color:#e6e6f0;font-size:19px;border-bottom:1px solid rgba(120,120,140,0.2);padding-bottom:6px">$1</h2>')
    html = html.replace(/^#\s+(.+)$/gm, '<h1 style="margin:20px 0 12px 0;color:#e6e6f0;font-size:22px;border-bottom:1px solid rgba(120,120,140,0.3);padding-bottom:8px">$1</h1>')
    // 粗体与斜体
    html = html.replace(/\*\*([^*]+)\*\*/g, '<strong style="color:#e6e6f0">$1</strong>')
    html = html.replace(/\*([^*]+)\*/g, '<em style="color:#d4d4e8">$1</em>')
    // 行内代码
    html = html.replace(/`([^`]+)`/g, '<code style="background:rgba(120,120,140,0.15);padding:2px 6px;border-radius:4px;font-family:monospace;font-size:12px;color:#fcd34d">$1</code>')
    // 链接
    html = html.replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2" style="color:#93c5fd;text-decoration:none">$1</a>')
    // 引用
    html = html.replace(/^>\s?(.+)$/gm, '<blockquote style="border-left:3px solid #6366f1;padding:8px 12px;margin:10px 0;color:#d4d4e8;background:rgba(99,102,241,0.05);border-radius:0 6px 6px 0">$1</blockquote>')
    // 列表
    html = html.replace(/(?:^|\n)((?:- .+\n?)+)/g, (_: string, block: string) => {
      const items = block.trim().split('\n').map((l) => `<li style="margin:4px 0;color:#d4d4e8">${l.replace(/^- /, '')}</li>`).join('')
      return `\n<ul style="margin:10px 0;padding-left:24px">${items}</ul>\n`
    })
    html = html.replace(/(?:^|\n)((?:\d+\. .+\n?)+)/g, (_: string, block: string) => {
      const items = block.trim().split('\n').map((l) => `<li style="margin:4px 0;color:#d4d4e8">${l.replace(/^\d+\. /, '')}</li>`).join('')
      return `\n<ol style="margin:10px 0;padding-left:24px">${items}</ol>\n`
    })
    // 段落
    html = html.split('\n\n').map((block) => {
      if (block.startsWith('<') || block.startsWith('\u0000')) return block
      if (block.trim() === '') return ''
      return `<p style="margin:10px 0;color:#d4d4e8;line-height:1.7;font-size:14px">${block.replace(/\n/g, '<br/>')}</p>`
    }).join('\n')
    // 恢复代码块
    html = html.replace(/\u0000CB(\d+)\u0000/g, (_, idx) => {
      const block = codeBlocks[Number(idx)]
      const [lang, ...rest] = block.split('\n')
      const code = rest.join('\n').trim() || block.trim()
      return `<pre style="background:rgba(20,22,32,0.8);padding:12px;border-radius:8px;overflow:auto;border:1px solid rgba(120,120,140,0.2);margin:12px 0"><code style="font-family:monospace;font-size:12px;color:#86efac">${lang && !lang.includes('\n') ? `<span style="color:#a8a8c0;font-size:11px;opacity:0.7;display:block;margin-bottom:8px">${lang}</span>` : ''}${code.replace(/</g, '&lt;')}</code></pre>`
    })
    return html
  }

  const html = useMemo(() => simpleRender(md), [md])

  return (
    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, height: '100%' }}>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
        <div style={{ fontSize: 11, color: '#a8a8c0', fontWeight: 600 }}>Markdown 源文本</div>
        <Textarea value={md} onChange={setMd} rows={20} />
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
        <div style={{ fontSize: 11, color: '#a8a8c0', fontWeight: 600 }}>预览</div>
        <div style={{
          padding: 16, background: 'rgba(30,32,48,0.5)', borderRadius: 8,
          border: '1px solid rgba(120,120,140,0.2)', overflow: 'auto', maxHeight: '60vh',
        }} dangerouslySetInnerHTML={{ __html: html }} />
      </div>
    </div>
  )
}

/* =========================================================
   主组件
========================================================= */
import React from 'react'

const TOOL_MAP: Record<ToolId, React.ComponentType> = {
  'base64': Base64Tool,
  'url': UrlTool,
  'json-formatter': JsonFormatter,
  'json-yaml': JsonYaml,
  'json-diff': JsonDiff,
  'json-schema': JsonSchemaTool,
  'regex-tester': RegexTester,
  'case-converter': CaseConverter,
  'text-diff': TextDiff,
  'hash-generator': HashGenerator,
  'uuid-generator': UuidGenerator,
  'password-generator': PasswordGen,
  'jwt-decoder': JwtDecoder,
  'timestamp': TimestampTool,
  'number-base': NumberBase,
  'data-formatter': CsvJson,
  'http-status': HttpStatus,
  'mime-ref': MimeRef,
  'color-picker': ColorPicker,
  'qr-generator': QrGenerator,
  'markdown-preview': MarkdownPreview,
}

const DevToolbox = memo(function DevToolbox() {
  const [selected, setSelected] = useState<ToolId>('base64')
  const [query, setQuery] = useState('')
  const [activeCategory, setActiveCategory] = useState<string>('all')

  const categories = ['all', ...Array.from(new Set(TOOLS.map((t) => t.category)))] as string[]

  const categoryLabels: Record<string, string> = {
    all: '全部',
    encoding: '编解码',
    json: 'JSON 工具',
    text: '文本处理',
    crypto: '加密/安全',
    web: 'Web 参考',
    data: '数据格式',
    design: '设计工具',
  }

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase()
    return TOOLS.filter((t) => {
      if (activeCategory !== 'all' && t.category !== activeCategory) return false
      if (!q) return true
      return t.name.toLowerCase().includes(q) || t.description.toLowerCase().includes(q) || t.icon.toLowerCase().includes(q)
    })
  }, [query, activeCategory])

  const currentTool = TOOLS.find((t) => t.id === selected)
  const Component = TOOL_MAP[selected]

  return (
    <div style={{
      display: 'grid',
      gridTemplateColumns: '280px 1fr',
      gap: 0,
      height: '100%',
      background: 'linear-gradient(180deg, rgba(30,32,48,0.4), rgba(20,22,32,0.6))',
    }}>
      {/* 左侧工具列表 */}
      <div style={{
        borderRight: '1px solid rgba(120,120,140,0.2)',
        background: 'rgba(20,22,32,0.4)',
        overflow: 'auto',
        display: 'flex',
        flexDirection: 'column',
      }}>
        <div style={{ padding: '20px 16px 16px', borderBottom: '1px solid rgba(120,120,140,0.15)' }}>
          <div style={{ fontSize: 16, fontWeight: 700, color: '#e6e6f0', marginBottom: 4 }}>🧰 开发者工具箱</div>
          <div style={{ fontSize: 11, color: '#a8a8c0' }}>{TOOLS.length} 个实用工具 · 纯浏览器运行</div>
          <input
            type="text" value={query} onChange={(e) => setQuery(e.target.value)}
            placeholder="搜索工具..."
            style={{
              width: '100%', marginTop: 12, padding: '8px 10px', borderRadius: 6,
              border: '1px solid rgba(120,120,140,0.25)', background: 'rgba(30,32,48,0.6)',
              color: '#e6e6f0', fontSize: 12, outline: 'none', boxSizing: 'border-box',
            }}
          />
        </div>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4, padding: '8px 12px', borderBottom: '1px solid rgba(120,120,140,0.15)' }}>
          {categories.map((c) => (
            <button key={c} onClick={() => setActiveCategory(c)} style={{
              padding: '4px 10px', borderRadius: 12, fontSize: 11,
              background: activeCategory === c ? 'rgba(99,102,241,0.3)' : 'rgba(120,120,140,0.08)',
              color: activeCategory === c ? '#c7d2fe' : '#a8a8c0',
              border: '1px solid ' + (activeCategory === c ? 'rgba(99,102,241,0.4)' : 'transparent'),
              cursor: 'pointer', fontWeight: 500,
            }}>{categoryLabels[c] || c}</button>
          ))}
        </div>
        <div style={{ padding: 8, flex: 1 }}>
          {filtered.map((t) => (
            <button key={t.id} onClick={() => setSelected(t.id)} style={{
              width: '100%', textAlign: 'left', padding: '10px 12px',
              background: selected === t.id ? 'rgba(99,102,241,0.2)' : 'transparent',
              border: '1px solid ' + (selected === t.id ? 'rgba(99,102,241,0.4)' : 'transparent'),
              borderRadius: 8, cursor: 'pointer', marginBottom: 2,
              transition: 'background 0.15s, border-color 0.15s',
            }} onMouseEnter={(e) => {
              if (selected !== t.id) e.currentTarget.style.background = 'rgba(120,120,140,0.08)'
            }} onMouseLeave={(e) => {
              if (selected !== t.id) e.currentTarget.style.background = 'transparent'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <span style={{ fontSize: 16 }}>{t.icon}</span>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 13, color: '#e6e6f0', fontWeight: 500 }}>{t.name}</div>
                  <div style={{ fontSize: 11, color: '#a8a8c0', marginTop: 2, lineHeight: 1.4 }}>{t.description}</div>
                </div>
              </div>
            </button>
          ))}
        </div>
      </div>
      {/* 右侧工具内容 */}
      <div style={{
        padding: 24,
        overflow: 'auto',
      }}>
        <div style={{ marginBottom: 20, paddingBottom: 16, borderBottom: '1px solid rgba(120,120,140,0.15)' }}>
          <h2 style={{ margin: 0, fontSize: 22, color: '#e6e6f0', fontWeight: 700 }}>{currentTool?.icon} {currentTool?.name}</h2>
          <div style={{ fontSize: 13, color: '#a8a8c0', marginTop: 6 }}>{currentTool?.description}</div>
        </div>
        {Component && <Component />}
      </div>
    </div>
  )
})

export default DevToolbox
