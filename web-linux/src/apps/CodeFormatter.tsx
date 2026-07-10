import { memo, useState, useEffect, useRef, useCallback } from 'react'

type TabKey = 'json' | 'html' | 'css' | 'js' | 'base64' | 'url' | 'hash' | 'sql'
type HashAlgo = 'SHA-1' | 'SHA-256' | 'SHA-384' | 'SHA-512' | 'MD5'

interface TabDef {
  key: TabKey
  label: string
  icon: string
  example: string
}

const TABS: TabDef[] = [
  {
    key: 'json',
    label: 'JSON',
    icon: '📋',
    example: `{"name":"WebLinuxOS","version":"3.0.0","features":["terminal","filemanager","apps"],"config":{"theme":"dark","language":"zh-CN"}}`,
  },
  {
    key: 'html',
    label: 'HTML',
    icon: '🌐',
    example: `<!DOCTYPE html><html><head><title>Test</title></head><body><div class="container"><h1>Hello</h1><p>World</p></div></body></html>`,
  },
  {
    key: 'css',
    label: 'CSS',
    icon: '🎨',
    example: `body{font-family:Arial,sans-serif;margin:0;padding:0;background:#f5f5f5;color:#333;}.container{max-width:1200px;margin:0 auto;padding:20px;}`,
  },
  {
    key: 'js',
    label: 'JavaScript',
    icon: '⚡',
    example: `function fibonacci(n){if(n<=1)return n;let a=0,b=1;for(let i=2;i<=n;i++){let c=a+b;a=b;b=c;}return b;}const result=fibonacci(10);console.log(result);`,
  },
  {
    key: 'base64',
    label: 'Base64',
    icon: '🔐',
    example: `Hello, World! 你好，世界！`,
  },
  {
    key: 'url',
    label: 'URL',
    icon: '🔗',
    example: `https://example.com/path/to/page?query=hello world&foo=bar&name=张三#section`,
  },
  {
    key: 'hash',
    label: 'Hash',
    icon: '🔑',
    example: `The quick brown fox jumps over the lazy dog`,
  },
  {
    key: 'sql',
    label: 'SQL',
    icon: '🗄️',
    example: `select u.id,u.name,u.email,o.total,o.created_at from users u left join orders o on u.id=o.user_id where u.status='active' and o.total>100 order by o.created_at desc limit 50;`,
  },
]

function computeErrorLine(input: string, message: string): { line: number; column: number; detail: string } {
  let line = 1
  let column = 1
  const posMatch = message.match(/position\s+(\d+)/i) || message.match(/at\s+position\s+(\d+)/i)
  if (posMatch) {
    const pos = parseInt(posMatch[1], 10)
    const before = input.substring(0, pos)
    line = before.split('\n').length
    const lastNewline = before.lastIndexOf('\n')
    column = lastNewline === -1 ? pos + 1 : pos - lastNewline
  } else {
    const lineMatch = message.match(/line\s+(\d+)\s+column\s+(\d+)/i)
    if (lineMatch) {
      line = parseInt(lineMatch[1], 10)
      column = parseInt(lineMatch[2], 10)
    }
  }
  return { line, column, detail: message }
}

function formatJSON(input: string, indent: number, minify: boolean): string {
  if (!input.trim()) return ''
  const parsed = JSON.parse(input)
  return minify ? JSON.stringify(parsed) : JSON.stringify(parsed, null, indent)
}

function toYAML(input: string): string {
  const parsed = JSON.parse(input)
  const dump = (obj: unknown, depth: number, onKey = false): string => {
    const indent = '  '.repeat(depth)
    if (obj === null) return 'null'
    if (typeof obj === 'boolean') return String(obj)
    if (typeof obj === 'number') return String(obj)
    if (typeof obj === 'string') {
      const needsQuote = /[:#&*!|>'"%@`\n\t]/.test(obj) || /^\s|\s$/.test(obj) || obj === ''
      return needsQuote ? `"${String(obj).replace(/\\/g, '\\\\').replace(/"/g, '\\"')}"` : String(obj)
    }
    if (Array.isArray(obj)) {
      if (obj.length === 0) return '[]'
      const parts = obj.map((item) => {
        const isComplex = typeof item === 'object' && item !== null
        if (isComplex) {
          const inner = dump(item, depth + 1, true)
          return `${indent}-\n${inner}`
        }
        return `${indent}- ${dump(item, 0)}`
      })
      return parts.join('\n')
    }
    if (typeof obj === 'object') {
      const rec = obj as Record<string, unknown>
      const keys = Object.keys(rec)
      if (keys.length === 0) return '{}'
      const parts = keys.map((k) => {
        const v = rec[k]
        const isComplex = typeof v === 'object' && v !== null && !(Array.isArray(v) && v.length === 0)
        if (isComplex) {
          const inner = dump(v, depth + 1)
          const extra = Array.isArray(v) && v.length > 0 && typeof v[0] !== 'object' ? `\n${inner}` : `\n${inner}`
          return `${indent}${k}:${extra}`
        }
        return `${indent}${k}: ${dump(v, depth)}`
      })
      return onKey ? parts.map((p) => p.replace(new RegExp(`^${indent}`), indent.replace(/^\s\s/, ''))).join('\n') : parts.join('\n')
    }
    return String(obj)
  }
  return dump(parsed, 0)
}

function validateJSONSchemaBasic(input: string): { valid: boolean; message: string; type?: string } {
  const parsed = JSON.parse(input)
  let type: string
  if (parsed === null) type = 'null'
  else if (Array.isArray(parsed)) type = `array (长度 ${parsed.length})`
  else if (typeof parsed === 'object') type = `object (键数 ${Object.keys(parsed as Record<string, unknown>).length})`
  else type = typeof parsed
  return { valid: true, message: `✓ JSON 有效，顶层类型: ${type}`, type }
}

function stripBlockComments(code: string): string {
  return code.replace(/\/\*[\s\S]*?\*\//g, '')
}

function tokenizeBrackets(code: string): string {
  let result = ''
  let inSingle = false
  let inDouble = false
  let inBacktick = false
  let inLineComment = false
  let inBlockComment = false
  for (let i = 0; i < code.length; i++) {
    const ch = code[i]
    const prev = code[i - 1]
    if (!inSingle && !inDouble && !inBacktick && !inLineComment && ch === '/' && code[i + 1] === '/') {
      inLineComment = true
      result += ch
      continue
    }
    if (inLineComment && ch === '\n') {
      inLineComment = false
      result += ch
      continue
    }
    if (inLineComment) {
      result += ch
      continue
    }
    if (!inSingle && !inDouble && !inBacktick && ch === '/' && code[i + 1] === '*') {
      inBlockComment = true
      result += '/*'
      i++
      continue
    }
    if (inBlockComment && ch === '*' && code[i + 1] === '/') {
      inBlockComment = false
      result += '*/'
      i++
      continue
    }
    if (inBlockComment) {
      result += ch
      continue
    }
    if (!inDouble && !inBacktick && ch === "'" && prev !== '\\') inSingle = !inSingle
    else if (!inSingle && !inBacktick && ch === '"' && prev !== '\\') inDouble = !inDouble
    else if (!inSingle && !inDouble && ch === '`' && prev !== '\\') inBacktick = !inBacktick
    if (!inSingle && !inDouble && !inBacktick) {
      if (ch === '{' || ch === '}' || ch === ';') {
        result += ch + '\u0001'
        continue
      }
    }
    result += ch
  }
  return result
}

function formatJS(input: string, indent: number): string {
  if (!input.trim()) return ''
  const cleaned = input.replace(/\r\n/g, '\n')
  const tokens = tokenizeBrackets(cleaned)
  const segments = tokens.split('\u0001').map((s) => s.trim()).filter((s) => s.length > 0)
  let level = 0
  const out: string[] = []
  for (const seg of segments) {
    const trimmed = seg
    if (!trimmed) continue
    if (trimmed.startsWith('}')) level = Math.max(0, level - 1)
    const lines = trimmed.split('\n')
    const formatted = lines
      .map((ln, idx) => {
        const l = idx === 0 ? ln : ln.trim()
        if (!l && idx === 0) return l
        if (!l) return ''
        const extra = idx === 0 ? 0 : (l.startsWith('}') ? Math.max(0, level - 1) : level)
        return ' '.repeat((idx === 0 ? level : extra) * indent) + l
      })
      .filter((l, i) => l !== '' || i === 0)
      .join('\n')
    out.push(formatted)
    if (trimmed.endsWith('{')) level++
    if (trimmed.endsWith('}') && !trimmed.startsWith('}') && trimmed !== '}') level = Math.max(0, level - 1)
  }
  return out.join('\n')
}

function formatHTML(input: string, indent: number): string {
  if (!input.trim()) return ''
  const tokens = input.match(/<!\s*--[\s\S]*?--\s*>|<!\[CDATA\[[\s\S]*?\]\]>|<[^>]+>|[^<]+/g) || [input]
  const selfClose = /^(br|hr|img|input|link|meta|area|base|col|embed|source|track|wbr)(\s|\/|>)/i
  let level = 0
  const out: string[] = []
  for (const raw of tokens) {
    const t = raw.trim()
    if (!t) continue
    if (/^<!/.test(t)) {
      out.push(' '.repeat(level * indent) + t)
      continue
    }
    const closeMatch = t.match(/^<\/\s*([a-zA-Z0-9-]+)/)
    const openMatch = t.match(/^<\s*([a-zA-Z0-9-]+)/)
    if (closeMatch) {
      level = Math.max(0, level - 1)
      out.push(' '.repeat(level * indent) + t)
    } else if (openMatch) {
      const tag = openMatch[1].toLowerCase()
      const isSelf = selfClose.test('<' + tag) || /\/\s*>$/.test(t)
      out.push(' '.repeat(level * indent) + t)
      if (!isSelf) level++
    } else {
      const text = t.replace(/\s+/g, ' ')
      if (text.trim()) {
        const lines = text.split('\n').map((l) => l.trim()).filter(Boolean)
        for (const ln of lines) out.push(' '.repeat(level * indent) + ln)
      }
    }
  }
  return out.join('\n')
}

function formatCSS(input: string, indent: number): string {
  if (!input.trim()) return ''
  let level = 0
  let inString: string | null = null
  let result = ''
  for (let i = 0; i < input.length; i++) {
    const ch = input[i]
    if (inString) {
      result += ch
      if (ch === inString && input[i - 1] !== '\\') inString = null
      continue
    }
    if (ch === '"' || ch === "'") {
      inString = ch
      result += ch
      continue
    }
    if (ch === '{') {
      result = result.replace(/\s+$/, '') + ' {\n'
      level++
    } else if (ch === '}') {
      level = Math.max(0, level - 1)
      result = result.replace(/\s+$/, '') + '\n' + ' '.repeat(level * indent) + '}\n'
    } else if (ch === ';') {
      result = result.replace(/\s+$/, '') + ';\n' + ' '.repeat(level * indent)
    } else if (ch === '\n') {
      result += '\n' + ' '.repeat(level * indent)
    } else if (ch === '\r') {
      continue
    } else {
      result += ch
    }
  }
  const cleaned = stripBlockComments(result)
  const lines = cleaned.split('\n').map((l) => l.replace(/\s+$/g, ''))
  const filtered: string[] = []
  for (const l of lines) {
    if (l.trim() === '' && filtered[filtered.length - 1]?.trim() === '') continue
    filtered.push(l)
  }
  return filtered.join('\n').trim()
}

function minifyCSS(input: string): string {
  if (!input.trim()) return ''
  let out = ''
  let inString: string | null = null
  for (let i = 0; i < input.length; i++) {
    const ch = input[i]
    if (inString) {
      out += ch
      if (ch === inString && input[i - 1] !== '\\') inString = null
      continue
    }
    if (ch === '"' || ch === "'") {
      inString = ch
      out += ch
      continue
    }
    if (ch === '/' && input[i + 1] === '*') {
      const end = input.indexOf('*/', i + 2)
      if (end === -1) return out
      i = end + 1
      continue
    }
    if (ch === '\n' || ch === '\r' || ch === '\t') continue
    if (ch === ' ' && (out.endsWith(' ') || out.endsWith('{') || out.endsWith('}') || out.endsWith(';') || out.endsWith(':'))) continue
    out += ch
  }
  return out
}

function minifyHTML(input: string): string {
  if (!input.trim()) return ''
  return input.replace(/>\s+</g, '><').replace(/\s+/g, ' ').trim()
}

function minifyJS(input: string): string {
  if (!input.trim()) return ''
  let out = ''
  let inString: string | null = null
  for (let i = 0; i < input.length; i++) {
    const ch = input[i]
    if (inString) {
      out += ch
      if (ch === inString && input[i - 1] !== '\\') inString = null
      continue
    }
    if (ch === '"' || ch === "'" || ch === '`') {
      inString = ch
      out += ch
      continue
    }
    if (ch === '/' && input[i + 1] === '/') {
      const end = input.indexOf('\n', i)
      if (end === -1) return out
      i = end
      continue
    }
    if (ch === '/' && input[i + 1] === '*') {
      const end = input.indexOf('*/', i + 2)
      if (end === -1) return out
      i = end + 1
      continue
    }
    if (ch === '\n' || ch === '\r' || ch === '\t') continue
    if (ch === ' ' && /[{};,=<>+\-*/%!&|?:]/.test(out.slice(-1))) continue
    out += ch
  }
  return out.trim()
}

const SQL_KEYWORDS = new Set([
  'SELECT', 'FROM', 'WHERE', 'AND', 'OR', 'NOT', 'IN', 'LIKE', 'IS', 'NULL',
  'INSERT', 'INTO', 'VALUES', 'UPDATE', 'SET', 'DELETE', 'CREATE', 'TABLE',
  'DROP', 'ALTER', 'ADD', 'COLUMN', 'INDEX', 'VIEW', 'AS', 'DISTINCT', 'GROUP',
  'BY', 'ORDER', 'HAVING', 'LIMIT', 'OFFSET', 'JOIN', 'LEFT', 'RIGHT', 'INNER',
  'OUTER', 'FULL', 'ON', 'UNION', 'ALL', 'BETWEEN', 'EXISTS', 'CASE', 'WHEN',
  'THEN', 'ELSE', 'END', 'WITH', 'PRIMARY', 'KEY', 'FOREIGN', 'REFERENCES',
  'UNIQUE', 'DEFAULT', 'CHECK', 'CONSTRAINT', 'AUTO_INCREMENT', 'COUNT', 'SUM',
  'AVG', 'MIN', 'MAX', 'CAST', 'CONVERT', 'NOW', 'CURRENT_TIMESTAMP', 'INNER',
  'CROSS', 'USING',
])

function formatSQL(input: string, indent: number): string {
  if (!input.trim()) return ''
  let out = ''
  let inSingle = false
  let inDouble = false
  let inBacktick = false
  let currentWord = ''
  for (let i = 0; i < input.length; i++) {
    const ch = input[i]
    if (!inDouble && !inBacktick && ch === "'" && input[i - 1] !== '\\') {
      inSingle = !inSingle
      out += ch
      continue
    }
    if (!inSingle && !inBacktick && ch === '"' && input[i - 1] !== '\\') {
      inDouble = !inDouble
      out += ch
      continue
    }
    if (!inSingle && !inDouble && ch === '`') {
      inBacktick = !inBacktick
      out += ch
      continue
    }
    if (inSingle || inDouble || inBacktick) {
      out += ch
      continue
    }
    if (/[a-zA-Z_]/.test(ch)) {
      currentWord += ch
    } else {
      if (currentWord) {
        const upper = currentWord.toUpperCase()
        out += SQL_KEYWORDS.has(upper) ? upper : currentWord
        currentWord = ''
      }
      out += ch
    }
  }
  if (currentWord) {
    const upper = currentWord.toUpperCase()
    out += SQL_KEYWORDS.has(upper) ? upper : currentWord
  }

  const breakKeywords = [
    'SELECT', 'FROM', 'WHERE', 'GROUP BY', 'HAVING', 'ORDER BY', 'LIMIT',
    'INSERT INTO', 'VALUES', 'UPDATE', 'SET', 'DELETE FROM',
    'LEFT JOIN', 'RIGHT JOIN', 'INNER JOIN', 'FULL JOIN', 'OUTER JOIN', 'JOIN',
    'CROSS JOIN', 'UNION ALL', 'UNION', 'AND', 'OR',
  ]
  let formatted = out
  for (const kw of breakKeywords) {
    const re = new RegExp(`\\s*\\b${kw.replace(/ /g, '\\s+')}\\b\\s*`, 'gi')
    formatted = formatted.replace(re, (match) => {
      const upper = match.trim().replace(/\s+/g, ' ').toUpperCase()
      return `\n${upper} `
    })
  }

  let level = 0
  const result: string[] = []
  const lines = formatted.split('\n').map((l) => l.trim()).filter(Boolean)
  for (const ln of lines) {
    if (ln.startsWith(')')) level = Math.max(0, level - 1)
    result.push(' '.repeat(level * indent) + ln)
    const opens = (ln.match(/\(/g) || []).length
    const closes = (ln.match(/\)/g) || []).length
    level += opens - closes
    if (level < 0) level = 0
  }
  return result.join('\n')
}

function minifySQL(input: string): string {
  if (!input.trim()) return ''
  let out = ''
  let inSingle = false
  for (let i = 0; i < input.length; i++) {
    const ch = input[i]
    if (ch === "'" && input[i - 1] !== '\\') inSingle = !inSingle
    if (inSingle) {
      out += ch
      continue
    }
    if (ch === '\n' || ch === '\r' || ch === '\t') {
      if (!out.endsWith(' ')) out += ' '
      continue
    }
    if (ch === ' ' && out.endsWith(' ')) continue
    out += ch
  }
  return out.trim()
}

function encodeBase64(input: string, urlSafe: boolean): string {
  const bytes = new TextEncoder().encode(input)
  let binary = ''
  const CHUNK = 0x8000
  for (let i = 0; i < bytes.length; i += CHUNK) {
    const slice = bytes.subarray(i, i + CHUNK)
    binary += String.fromCharCode.apply(null, Array.from(slice))
  }
  let result = btoa(binary)
  if (urlSafe) result = result.replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '')
  return result
}

function decodeBase64(input: string, urlSafe: boolean): string {
  let data = input.trim()
  if (urlSafe) {
    data = data.replace(/-/g, '+').replace(/_/g, '/')
    const pad = data.length % 4
    if (pad) data += '='.repeat(4 - pad)
  }
  if (!/^[A-Za-z0-9+/=\s]*$/.test(data)) throw new Error('输入包含无效的 Base64 字符')
  const binary = atob(data)
  const bytes = new Uint8Array(binary.length)
  for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i)
  return new TextDecoder('utf-8', { fatal: true }).decode(bytes)
}

async function computeHash(input: string, algo: HashAlgo): Promise<string> {
  if (!input) return ''
  const data = new TextEncoder().encode(input)
  if (algo === 'MD5') {
    return md5Hex(data)
  }
  if (typeof crypto !== 'undefined' && crypto.subtle) {
    const buf = await crypto.subtle.digest(algo, data)
    return bufToHex(new Uint8Array(buf))
  }
  throw new Error('当前环境不支持 Web Crypto API')
}

function bufToHex(buf: Uint8Array): string {
  let out = ''
  for (let i = 0; i < buf.length; i++) {
    out += buf[i].toString(16).padStart(2, '0')
  }
  return out
}

function md5Hex(msg: Uint8Array): string {
  function rotl32(x: number, n: number): number {
    return (x << n) | (x >>> (32 - n))
  }
  function cmn(q: number, a: number, b: number, x: number, s: number, t: number): number {
    return rotl32((((a + q) & 0xffffffff) + ((x + t) & 0xffffffff)) & 0xffffffff, s) + b
  }
  function ff(a: number, b: number, c: number, d: number, x: number, s: number, t: number): number {
    return cmn((b & c) | (~b & d), a, b, x, s, t)
  }
  function gg(a: number, b: number, c: number, d: number, x: number, s: number, t: number): number {
    return cmn((b & d) | (c & ~d), a, b, x, s, t)
  }
  function hh(a: number, b: number, c: number, d: number, x: number, s: number, t: number): number {
    return cmn(b ^ c ^ d, a, b, x, s, t)
  }
  function ii(a: number, b: number, c: number, d: number, x: number, s: number, t: number): number {
    return cmn(c ^ (b | ~d), a, b, x, s, t)
  }

  const originalLen = msg.length
  const nBlocks = Math.floor((originalLen + 8) / 64) + 1
  const newLen = nBlocks * 64
  const padded = new Uint8Array(newLen)
  padded.set(msg)
  padded[originalLen] = 0x80
  const bitLen = originalLen * 8
  const view = new DataView(padded.buffer, padded.byteOffset, padded.byteLength)
  view.setUint32(newLen - 8, bitLen >>> 0, true)
  view.setUint32(newLen - 4, Math.floor(bitLen / 0x100000000), true)

  let a = 1732584193
  let b = -271733879
  let c = -1732584194
  let d = 271733878

  for (let i = 0; i < padded.length; i += 64) {
    const x = new Uint32Array(16)
    for (let j = 0; j < 16; j++) {
      x[j] = view.getUint32(i + j * 4, true)
    }
    const aa = a
    const bb = b
    const cc = c
    const dd = d

    a = ff(a, b, c, d, x[0], 7, -680876936)
    d = ff(d, a, b, c, x[1], 12, -389564586)
    c = ff(c, d, a, b, x[2], 17, 606105819)
    b = ff(b, c, d, a, x[3], 22, -1044525330)
    a = ff(a, b, c, d, x[4], 7, -176418897)
    d = ff(d, a, b, c, x[5], 12, 1200080426)
    c = ff(c, d, a, b, x[6], 17, -1473231341)
    b = ff(b, c, d, a, x[7], 22, -45705983)
    a = ff(a, b, c, d, x[8], 7, 1770035416)
    d = ff(d, a, b, c, x[9], 12, -1958414417)
    c = ff(c, d, a, b, x[10], 17, -42063)
    b = ff(b, c, d, a, x[11], 22, -1990404162)
    a = ff(a, b, c, d, x[12], 7, 1804603682)
    d = ff(d, a, b, c, x[13], 12, -40341101)
    c = ff(c, d, a, b, x[14], 17, -1502002290)
    b = ff(b, c, d, a, x[15], 22, 1236535329)

    a = gg(a, b, c, d, x[1], 5, -165796510)
    d = gg(d, a, b, c, x[6], 9, -1069501632)
    c = gg(c, d, a, b, x[11], 14, 643717713)
    b = gg(b, c, d, a, x[0], 20, -373897302)
    a = gg(a, b, c, d, x[5], 5, -701558691)
    d = gg(d, a, b, c, x[10], 9, 38016083)
    c = gg(c, d, a, b, x[15], 14, -660478335)
    b = gg(b, c, d, a, x[4], 20, -405537848)
    a = gg(a, b, c, d, x[9], 5, 568446438)
    d = gg(d, a, b, c, x[14], 9, -1019803690)
    c = gg(c, d, a, b, x[3], 14, -187363961)
    b = gg(b, c, d, a, x[8], 20, 1163531501)
    a = gg(a, b, c, d, x[13], 5, -1444681467)
    d = gg(d, a, b, c, x[2], 9, -51403784)
    c = gg(c, d, a, b, x[7], 14, 1735328473)
    b = gg(b, c, d, a, x[12], 20, -1926607734)

    a = hh(a, b, c, d, x[5], 4, -378558)
    d = hh(d, a, b, c, x[8], 11, -2022574463)
    c = hh(c, d, a, b, x[11], 16, 1839030562)
    b = hh(b, c, d, a, x[14], 23, -35309556)
    a = hh(a, b, c, d, x[1], 4, -1530992060)
    d = hh(d, a, b, c, x[4], 11, 1272893353)
    c = hh(c, d, a, b, x[7], 16, -155497632)
    b = hh(b, c, d, a, x[10], 23, -1094730640)
    a = hh(a, b, c, d, x[13], 4, 681279174)
    d = hh(d, a, b, c, x[0], 11, -358537222)
    c = hh(c, d, a, b, x[3], 16, -722521979)
    b = hh(b, c, d, a, x[6], 23, 76029189)
    a = hh(a, b, c, d, x[9], 4, -640364487)
    d = hh(d, a, b, c, x[12], 11, -421815835)
    c = hh(c, d, a, b, x[15], 16, 530742520)
    b = hh(b, c, d, a, x[2], 23, -995338651)

    a = ii(a, b, c, d, x[0], 6, -198630844)
    d = ii(d, a, b, c, x[7], 10, 1126891415)
    c = ii(c, d, a, b, x[14], 15, -1416354905)
    b = ii(b, c, d, a, x[5], 21, -57434055)
    a = ii(a, b, c, d, x[12], 6, 1700485571)
    d = ii(d, a, b, c, x[3], 10, -1894986606)
    c = ii(c, d, a, b, x[10], 15, -1051523)
    b = ii(b, c, d, a, x[1], 21, -2054922799)
    a = ii(a, b, c, d, x[8], 6, 1873313359)
    d = ii(d, a, b, c, x[15], 10, -30611744)
    c = ii(c, d, a, b, x[6], 15, -1560198380)
    b = ii(b, c, d, a, x[13], 21, 1309151649)
    a = ii(a, b, c, d, x[4], 6, -145523070)
    d = ii(d, a, b, c, x[11], 10, -1120210379)
    c = ii(c, d, a, b, x[2], 15, 718787259)
    b = ii(b, c, d, a, x[9], 21, -343485551)

    a = (a + aa) | 0
    b = (b + bb) | 0
    c = (c + cc) | 0
    d = (d + dd) | 0
  }

  const out = new Uint8Array(16)
  const outView = new DataView(out.buffer)
  outView.setUint32(0, a, true)
  outView.setUint32(4, b, true)
  outView.setUint32(8, c, true)
  outView.setUint32(12, d, true)
  return bufToHex(out)
}

function parseURLDetailed(input: string): string {
  if (!input.trim()) return ''
  let urlStr = input.trim()
  if (!/^[a-zA-Z][a-zA-Z0-9+.-]*:\/\//.test(urlStr)) urlStr = 'http://' + urlStr
  const u = new URL(urlStr)
  const info: Record<string, unknown> = {
    protocol: u.protocol,
    origin: u.origin,
    hostname: u.hostname,
    host: u.host,
    port: u.port || '(default)',
    pathname: u.pathname,
    search: u.search,
    hash: u.hash,
    username: u.username || '(none)',
    password: u.password || '(none)',
    queryParams: Object.fromEntries(u.searchParams.entries()),
  }
  return JSON.stringify(info, null, 2)
}

function CodeFormatter() {
  const [tab, setTab] = useState<TabKey>('json')
  const [inputs, setInputs] = useState<Record<TabKey, string>>({
    json: '', html: '', css: '', js: '', base64: '', url: '', hash: '', sql: '',
  })
  const [outputs, setOutputs] = useState<Record<TabKey, string>>({
    json: '', html: '', css: '', js: '', base64: '', url: '', hash: '', sql: '',
  })
  const [errors, setErrors] = useState<Record<TabKey, string>>({
    json: '', html: '', css: '', js: '', base64: '', url: '', hash: '', sql: '',
  })
  const [indent, setIndent] = useState<number>(2)
  const [jsonMode, setJsonMode] = useState<'format' | 'minify' | 'yaml'>('format')
  const [base64Mode, setBase64Mode] = useState<'encode' | 'decode'>('encode')
  const [base64UrlSafe, setBase64UrlSafe] = useState<boolean>(false)
  const [urlMode, setUrlMode] = useState<'encode' | 'decode' | 'parse'>('encode')
  const [hashAlgo, setHashAlgo] = useState<HashAlgo>('SHA-256')
  const [copied, setCopied] = useState(false)
  const [hashLoading, setHashLoading] = useState(false)
  const [errorLineInfo, setErrorLineInfo] = useState<{ line: number; column: number } | null>(null)
  const debounceRef = useRef<number | null>(null)

  const input = inputs[tab]
  const output = outputs[tab]
  const error = errors[tab]

  const setTabInput = useCallback((value: string) => {
    setInputs((prev) => ({ ...prev, [tab]: value }))
  }, [tab])

  const setTabOutput = useCallback((value: string) => {
    setOutputs((prev) => ({ ...prev, [tab]: value }))
  }, [tab])

  const setTabError = useCallback((value: string) => {
    setErrors((prev) => ({ ...prev, [tab]: value }))
  }, [tab])

  const processJSON = useCallback(() => {
    const text = inputs.json.trim()
    if (!text) {
      setTabOutput('')
      setTabError('')
      setErrorLineInfo(null)
      return
    }
    try {
      let result: string
      if (jsonMode === 'yaml') result = toYAML(text)
      else result = formatJSON(text, indent, jsonMode === 'minify')
      setTabOutput(result)
      setTabError('')
      setErrorLineInfo(null)
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e)
      const info = computeErrorLine(inputs.json, msg)
      setTabError(`第 ${info.line} 行, 第 ${info.column} 列: ${info.detail}`)
      setTabOutput('')
      setErrorLineInfo({ line: info.line, column: info.column })
    }
  }, [inputs.json, jsonMode, indent, setTabOutput, setTabError])

  const processHTML = useCallback(() => {
    try {
      const result = formatHTML(inputs.html, indent)
      setTabOutput(result)
      setTabError('')
    } catch (e) {
      setTabError(e instanceof Error ? e.message : String(e))
      setTabOutput('')
    }
  }, [inputs.html, indent, setTabOutput, setTabError])

  const processCSS = useCallback(() => {
    try {
      const result = formatCSS(inputs.css, indent)
      setTabOutput(result)
      setTabError('')
    } catch (e) {
      setTabError(e instanceof Error ? e.message : String(e))
      setTabOutput('')
    }
  }, [inputs.css, indent, setTabOutput, setTabError])

  const processJS = useCallback(() => {
    try {
      const result = formatJS(inputs.js, indent)
      setTabOutput(result)
      setTabError('')
    } catch (e) {
      setTabError(e instanceof Error ? e.message : String(e))
      setTabOutput('')
    }
  }, [inputs.js, indent, setTabOutput, setTabError])

  const processBase64 = useCallback(() => {
    try {
      const text = inputs.base64
      if (!text.trim()) {
        setTabOutput('')
        setTabError('')
        return
      }
      const result = base64Mode === 'encode' ? encodeBase64(text, base64UrlSafe) : decodeBase64(text, base64UrlSafe)
      setTabOutput(result)
      setTabError('')
    } catch (e) {
      setTabError(e instanceof Error ? e.message : String(e))
      setTabOutput('')
    }
  }, [inputs.base64, base64Mode, base64UrlSafe, setTabOutput, setTabError])

  const processURL = useCallback(() => {
    try {
      const text = inputs.url
      if (!text.trim()) {
        setTabOutput('')
        setTabError('')
        return
      }
      let result: string
      if (urlMode === 'encode') result = encodeURIComponent(text)
      else if (urlMode === 'decode') result = decodeURIComponent(text)
      else result = parseURLDetailed(text)
      setTabOutput(result)
      setTabError('')
    } catch (e) {
      setTabError(e instanceof Error ? e.message : String(e))
      setTabOutput('')
    }
  }, [inputs.url, urlMode, setTabOutput, setTabError])

  const processSQL = useCallback(() => {
    try {
      const result = formatSQL(inputs.sql, indent)
      setTabOutput(result)
      setTabError('')
    } catch (e) {
      setTabError(e instanceof Error ? e.message : String(e))
      setTabOutput('')
    }
  }, [inputs.sql, indent, setTabOutput, setTabError])

  const processHash = useCallback(async () => {
    try {
      const text = inputs.hash
      if (!text.trim()) {
        setTabOutput('')
        setTabError('')
        return
      }
      setHashLoading(true)
      const sha256 = await computeHash(text, 'SHA-256')
      const sha1 = await computeHash(text, 'SHA-1')
      const sha384 = await computeHash(text, 'SHA-384')
      const sha512 = await computeHash(text, 'SHA-512')
      const md5 = await computeHash(text, 'MD5')
      const lines = [
        `输入文本: ${text.length > 120 ? text.slice(0, 120) + '...' : text}`,
        `输入字节数: ${new TextEncoder().encode(text).length}`,
        '',
        `MD5:    ${md5}`,
        `SHA-1:  ${sha1}`,
        `SHA-256: ${sha256}`,
        `SHA-384: ${sha384}`,
        `SHA-512: ${sha512}`,
      ]
      setTabOutput(lines.join('\n'))
      setTabError('')
    } catch (e) {
      setTabError(e instanceof Error ? e.message : String(e))
      setTabOutput('')
    } finally {
      setHashLoading(false)
    }
  }, [inputs.hash, setTabOutput, setTabError])

  const runProcessing = useCallback(() => {
    switch (tab) {
      case 'json': processJSON(); break
      case 'html': processHTML(); break
      case 'css': processCSS(); break
      case 'js': processJS(); break
      case 'base64': processBase64(); break
      case 'url': processURL(); break
      case 'sql': processSQL(); break
      case 'hash': processHash(); break
    }
  }, [tab, processJSON, processHTML, processCSS, processJS, processBase64, processURL, processSQL, processHash])

  useEffect(() => {
    if (debounceRef.current) window.clearTimeout(debounceRef.current)
    debounceRef.current = window.setTimeout(() => {
      runProcessing()
    }, 200)
    return () => {
      if (debounceRef.current) window.clearTimeout(debounceRef.current)
    }
  }, [input, tab, indent, jsonMode, base64Mode, base64UrlSafe, urlMode, hashAlgo, runProcessing])

  const loadExample = () => {
    const def = TABS.find((t) => t.key === tab)
    if (def) setTabInput(def.example)
  }

  const copyOutput = async () => {
    if (!output) return
    try {
      await navigator.clipboard.writeText(output)
      setCopied(true)
      window.setTimeout(() => setCopied(false), 2000)
    } catch {
      setTabError('复制失败，请检查浏览器权限')
    }
  }

  const swapInputOutput = () => {
    const o = outputs[tab]
    setInputs((prev) => ({ ...prev, [tab]: o }))
    setOutputs((prev) => ({ ...prev, [tab]: inputs[tab] }))
  }

  const clearAll = () => {
    setInputs((prev) => ({ ...prev, [tab]: '' }))
    setOutputs((prev) => ({ ...prev, [tab]: '' }))
    setErrors((prev) => ({ ...prev, [tab]: '' }))
    setErrorLineInfo(null)
  }

  const minifyCurrent = () => {
    try {
      let result = ''
      const src = inputs[tab].trim()
      if (!src) {
        setTabOutput('')
        setTabError('')
        return
      }
      if (tab === 'json') {
        result = formatJSON(src, indent, true)
      } else if (tab === 'html') {
        result = minifyHTML(src)
      } else if (tab === 'css') {
        result = minifyCSS(src)
      } else if (tab === 'js') {
        result = minifyJS(src)
      } else if (tab === 'sql') {
        result = minifySQL(src)
      } else {
        return
      }
      setTabOutput(result)
      setTabError('')
    } catch (e) {
      setTabError(e instanceof Error ? e.message : String(e))
      setTabOutput('')
    }
  }

  const validateJSON = () => {
    try {
      const res = validateJSONSchemaBasic(inputs.json)
      setTabError(res.message)
      setErrorLineInfo(null)
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e)
      const info = computeErrorLine(inputs.json, msg)
      setTabError(`✗ JSON 无效 (第 ${info.line} 行, 第 ${info.column} 列): ${info.detail}`)
      setErrorLineInfo({ line: info.line, column: info.column })
    }
  }

  const inputStats = useCallback(() => {
    const text = inputs[tab]
    const bytes = new TextEncoder().encode(text).length
    return `字符: ${text.length} | 字节: ${bytes} | 行: ${text ? text.split('\n').length : 0}`
  }, [inputs, tab])

  const outputStats = useCallback(() => {
    const text = outputs[tab]
    const bytes = new TextEncoder().encode(text).length
    return `字符: ${text.length} | 字节: ${bytes} | 行: ${text ? text.split('\n').length : 0}`
  }, [outputs, tab])

  const inputLabel = (() => {
    switch (tab) {
      case 'base64': return base64Mode === 'encode' ? '输入文本' : '输入 Base64'
      case 'hash': return '输入文本'
      default: return '输入代码'
    }
  })()

  const outputLabel = (() => {
    switch (tab) {
      case 'base64': return base64Mode === 'encode' ? 'Base64 结果' : '解码文本'
      case 'hash': return '哈希结果'
      case 'json': return jsonMode === 'yaml' ? 'YAML 输出' : '格式化输出'
      default: return '格式化输出'
    }
  })()

  const headerStyle: React.CSSProperties = {
    padding: '12px 20px',
    background: '#1e1e2e',
    borderBottom: '1px solid #313244',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: '12px',
    flexWrap: 'wrap',
  }

  const titleStyle: React.CSSProperties = {
    margin: 0,
    color: '#cdd6f4',
    fontSize: '18px',
    fontWeight: 600,
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
  }

  const subtitleStyle: React.CSSProperties = {
    margin: '2px 0 0 0',
    color: '#9399b2',
    fontSize: '12px',
  }

  const tabBarStyle: React.CSSProperties = {
    display: 'flex',
    gap: '4px',
    padding: '8px 16px',
    background: '#181825',
    borderBottom: '1px solid #313244',
    overflowX: 'auto',
  }

  const tabStyle = (active: boolean): React.CSSProperties => ({
    padding: '8px 14px',
    borderRadius: '8px',
    border: 'none',
    background: active ? 'linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)' : 'transparent',
    color: active ? '#fff' : '#9399b2',
    cursor: 'pointer',
    fontSize: '13px',
    fontWeight: active ? 600 : 400,
    whiteSpace: 'nowrap',
    transition: 'all 0.2s',
    display: 'flex',
    alignItems: 'center',
    gap: '6px',
  })

  const toolbarStyle: React.CSSProperties = {
    display: 'flex',
    gap: '8px',
    padding: '10px 16px',
    background: '#1e1e2e',
    borderBottom: '1px solid #313244',
    alignItems: 'center',
    flexWrap: 'wrap',
  }

  const btnStyle = (primary = false, disabled = false): React.CSSProperties => ({
    padding: '7px 14px',
    borderRadius: '6px',
    border: primary ? 'none' : '1px solid #45475a',
    background: primary ? 'linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)' : '#313244',
    color: '#cdd6f4',
    cursor: disabled ? 'not-allowed' : 'pointer',
    fontSize: '12px',
    fontWeight: 500,
    transition: 'all 0.2s',
    opacity: disabled ? 0.5 : 1,
    boxShadow: primary ? '0 2px 8px rgba(99,102,241,0.3)' : 'none',
  })

  const selectStyle: React.CSSProperties = {
    padding: '6px 10px',
    borderRadius: '6px',
    background: '#313244',
    border: '1px solid #45475a',
    color: '#cdd6f4',
    fontSize: '12px',
    cursor: 'pointer',
    outline: 'none',
  }

  const labelStyle: React.CSSProperties = {
    fontSize: '12px',
    color: '#9399b2',
    display: 'flex',
    alignItems: 'center',
    gap: '6px',
  }

  const errorBarStyle: React.CSSProperties = {
    padding: '10px 16px',
    background: error.startsWith('✓') || error.startsWith('第') && error.includes('有效的') ? 'rgba(166, 227, 161, 0.1)' : 'rgba(243, 139, 168, 0.1)',
    color: error.startsWith('✓') ? '#a6e3a1' : '#f38ba8',
    fontSize: '12px',
    borderBottom: '1px solid #313244',
    wordBreak: 'break-word',
  }

  const panelsStyle: React.CSSProperties = {
    flex: 1,
    display: 'flex',
    gap: '12px',
    padding: '12px 16px 16px 16px',
    minHeight: 0,
    background: '#11111b',
  }

  const panelStyle: React.CSSProperties = {
    flex: 1,
    display: 'flex',
    flexDirection: 'column',
    background: '#181825',
    borderRadius: '8px',
    border: '1px solid #313244',
    minWidth: 0,
    minHeight: 0,
    overflow: 'hidden',
  }

  const panelHeaderStyle: React.CSSProperties = {
    padding: '8px 12px',
    borderBottom: '1px solid #313244',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    background: '#1e1e2e',
    fontSize: '12px',
    color: '#9399b2',
    fontWeight: 500,
  }

  const textareaStyle: React.CSSProperties = {
    flex: 1,
    padding: '12px',
    background: '#11111b',
    border: 'none',
    outline: 'none',
    resize: 'none',
    fontFamily: '"Fira Code", "Monaco", "Ubuntu Mono", monospace',
    fontSize: '13px',
    color: '#cdd6f4',
    lineHeight: 1.6,
    overflow: 'auto',
    minHeight: 0,
    whiteSpace: 'pre',
  }

  const preStyle: React.CSSProperties = {
    flex: 1,
    margin: 0,
    padding: '12px',
    background: '#11111b',
    fontFamily: '"Fira Code", "Monaco", "Ubuntu Mono", monospace',
    fontSize: '13px',
    color: '#a6e3a1',
    lineHeight: 1.6,
    overflow: 'auto',
    minHeight: 0,
    whiteSpace: 'pre',
    wordBreak: 'normal',
  }

  const groupStyle: React.CSSProperties = {
    display: 'flex',
    gap: '6px',
    alignItems: 'center',
    paddingLeft: '8px',
    borderLeft: '1px solid #313244',
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', background: '#11111b', color: '#cdd6f4', fontFamily: 'system-ui, -apple-system, sans-serif' }}>
      <div style={headerStyle}>
        <div>
          <h2 style={titleStyle}>🎨 代码格式化工具</h2>
          <p style={subtitleStyle}>JSON / HTML / CSS / JavaScript / Base64 / URL / Hash / SQL 一体化工具</p>
        </div>
        <div style={{ display: 'flex', gap: '6px', alignItems: 'center' }}>
          <span style={labelStyle}>缩进</span>
          <select value={indent} onChange={(e) => setIndent(parseInt(e.target.value, 10))} style={selectStyle}>
            <option value={2}>2 空格</option>
            <option value={4}>4 空格</option>
            <option value={8}>8 空格</option>
          </select>
        </div>
      </div>

      <div style={tabBarStyle}>
        {TABS.map((t) => (
          <button key={t.key} onClick={() => setTab(t.key)} style={tabStyle(tab === t.key)}>
            <span>{t.icon}</span>{t.label}
          </button>
        ))}
      </div>

      <div style={toolbarStyle}>
        {tab === 'json' && (
          <>
            <div style={{ display: 'flex', gap: '4px' }}>
              <button onClick={() => setJsonMode('format')} style={{ ...btnStyle(false), background: jsonMode === 'format' ? 'linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)' : '#313244' }}>美化</button>
              <button onClick={() => setJsonMode('minify')} style={{ ...btnStyle(false), background: jsonMode === 'minify' ? 'linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)' : '#313244' }}>压缩</button>
              <button onClick={() => setJsonMode('yaml')} style={{ ...btnStyle(false), background: jsonMode === 'yaml' ? 'linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)' : '#313244' }}>→ YAML</button>
            </div>
            <div style={groupStyle}>
              <button onClick={validateJSON} style={btnStyle(false)}>验证</button>
            </div>
          </>
        )}

        {tab === 'base64' && (
          <>
            <div style={{ display: 'flex', gap: '4px' }}>
              <button onClick={() => setBase64Mode('encode')} style={{ ...btnStyle(false), background: base64Mode === 'encode' ? 'linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)' : '#313244' }}>编码</button>
              <button onClick={() => setBase64Mode('decode')} style={{ ...btnStyle(false), background: base64Mode === 'decode' ? 'linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)' : '#313244' }}>解码</button>
            </div>
            <div style={groupStyle}>
              <label style={{ ...labelStyle, cursor: 'pointer' }}>
                <input type="checkbox" checked={base64UrlSafe} onChange={(e) => setBase64UrlSafe(e.target.checked)} style={{ cursor: 'pointer' }} />
                URL Safe
              </label>
            </div>
          </>
        )}

        {tab === 'url' && (
          <div style={{ display: 'flex', gap: '4px' }}>
            <button onClick={() => setUrlMode('encode')} style={{ ...btnStyle(false), background: urlMode === 'encode' ? 'linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)' : '#313244' }}>编码</button>
            <button onClick={() => setUrlMode('decode')} style={{ ...btnStyle(false), background: urlMode === 'decode' ? 'linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)' : '#313244' }}>解码</button>
            <button onClick={() => setUrlMode('parse')} style={{ ...btnStyle(false), background: urlMode === 'parse' ? 'linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)' : '#313244' }}>解析</button>
          </div>
        )}

        {tab === 'hash' && (
          <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
            <span style={labelStyle}>算法:</span>
            <select value={hashAlgo} onChange={(e) => setHashAlgo(e.target.value as HashAlgo)} style={selectStyle}>
              <option value="MD5">MD5</option>
              <option value="SHA-1">SHA-1</option>
              <option value="SHA-256">SHA-256</option>
              <option value="SHA-384">SHA-384</option>
              <option value="SHA-512">SHA-512</option>
            </select>
            {hashLoading && <span style={{ fontSize: '12px', color: '#f9e2af' }}>计算中...</span>}
          </div>
        )}

        {(tab === 'html' || tab === 'css' || tab === 'js' || tab === 'sql') && (
          <button onClick={minifyCurrent} style={btnStyle(false)}>压缩</button>
        )}

        <div style={groupStyle}>
          <button onClick={loadExample} style={btnStyle(false)}>示例</button>
          <button onClick={swapInputOutput} disabled={!output} style={btnStyle(false, !output)}>交换</button>
          <button onClick={copyOutput} disabled={!output} style={btnStyle(false, !output)}>
            {copied ? '✓ 已复制' : '复制'}
          </button>
          <button onClick={clearAll} style={btnStyle(false)}>清空</button>
        </div>

        <div style={{ flex: 1 }} />
        <div style={{ fontSize: '11px', color: '#7f849c' }}>
          {inputStats()}
        </div>
      </div>

      {error && (
        <div style={errorBarStyle}>{error}</div>
      )}

      {tab === 'json' && errorLineInfo && (
        <div style={{
          padding: '6px 16px',
          background: 'rgba(249, 226, 175, 0.1)',
          borderBottom: '1px solid #313244',
          fontSize: '11px',
          color: '#f9e2af',
        }}>
          错误位置提示: 行 {errorLineInfo.line}, 列 {errorLineInfo.column}
        </div>
      )}

      <div style={panelsStyle}>
        <div style={panelStyle}>
          <div style={panelHeaderStyle}>
            <span>📥 {inputLabel}</span>
            <span style={{ fontSize: '11px', color: '#7f849c' }}>{inputStats()}</span>
          </div>
          <textarea
            value={input}
            onChange={(e) => setTabInput(e.target.value)}
            placeholder="在此粘贴或输入内容..."
            spellCheck={false}
            style={textareaStyle}
          />
        </div>

        <div style={{ ...panelStyle, borderColor: '#45475a' }}>
          <div style={panelHeaderStyle}>
            <span>📤 {outputLabel}</span>
            <span style={{ fontSize: '11px', color: '#7f849c' }}>{outputStats()}</span>
          </div>
          <pre style={preStyle}>{output || <span style={{ color: '#585b70' }}>（输出将显示在这里）</span>}</pre>
        </div>
      </div>
    </div>
  )
}

export default memo(CodeFormatter)
