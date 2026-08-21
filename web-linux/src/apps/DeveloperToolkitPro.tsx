import React, { useState, useMemo, useEffect, useRef } from 'react'

type TabKey = 'json' | 'base64' | 'url' | 'hash' | 'uuid' | 'timestamp' | 'color' | 'regex' | 'jwt' | 'cron'

const TABS: { key: TabKey; label: string; icon: string }[] = [
  { key: 'json', label: 'JSON', icon: '📋' },
  { key: 'base64', label: 'Base64', icon: '🔐' },
  { key: 'url', label: 'URL', icon: '🔗' },
  { key: 'hash', label: '哈希', icon: '🔒' },
  { key: 'uuid', label: 'UUID', icon: '🆔' },
  { key: 'timestamp', label: '时间戳', icon: '⏰' },
  { key: 'color', label: '颜色', icon: '🎨' },
  { key: 'regex', label: '正则', icon: '🎯' },
  { key: 'jwt', label: 'JWT', icon: '🎫' },
  { key: 'cron', label: 'Cron', icon: '⏱️' },
]

function unicodeToBase64(str: string): string {
  try {
    return btoa(unescape(encodeURIComponent(str)))
  } catch {
    return ''
  }
}

function base64ToUnicode(str: string): string {
  try {
    return decodeURIComponent(escape(atob(str)))
  } catch {
    return '⚠️ 无效的 Base64 字符串'
  }
}

function generateUUID(): string {
  if (typeof crypto !== 'undefined' && 'randomUUID' in crypto) {
    try {
      return (crypto as Crypto).randomUUID()
    } catch { /* fallback */ }
  }
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0
    const v = c === 'x' ? r : (r & 0x3) | 0x8
    return v.toString(16)
  })
}

async function computeHash(text: string, algorithm: 'SHA-1' | 'SHA-256' | 'SHA-384' | 'SHA-512'): Promise<string> {
  try {
    const encoder = new TextEncoder()
    const data = encoder.encode(text)
    const hashBuffer = await crypto.subtle.digest(algorithm, data)
    const hashArray = Array.from(new Uint8Array(hashBuffer))
    return hashArray.map(b => b.toString(16).padStart(2, '0')).join('')
  } catch {
    return '不支持'
  }
}

function simpleMD5(string: string): string {
  function rotateLeft(n: number, s: number): number { return (n << s) | (n >>> (32 - s)) }
  function addUnsigned(x: number, y: number): number {
    const lsw = (x & 0xFFFF) + (y & 0xFFFF)
    const msw = (x >> 16) + (y >> 16) + (lsw >> 16)
    return (msw << 16) | (lsw & 0xFFFF)
  }
  function F(x: number, y: number, z: number): number { return (x & y) | ((~x) & z) }
  function G(x: number, y: number, z: number): number { return (x & z) | (y & (~z)) }
  function H(x: number, y: number, z: number): number { return x ^ y ^ z }
  function I(x: number, y: number, z: number): number { return y ^ (x | (~z)) }
  function FF(a: number, b: number, c: number, d: number, x: number, s: number, ac: number): number {
    a = addUnsigned(a, addUnsigned(addUnsigned(F(b, c, d), x), ac))
    return addUnsigned(rotateLeft(a, s), b)
  }
  function GG(a: number, b: number, c: number, d: number, x: number, s: number, ac: number): number {
    a = addUnsigned(a, addUnsigned(addUnsigned(G(b, c, d), x), ac))
    return addUnsigned(rotateLeft(a, s), b)
  }
  function HH(a: number, b: number, c: number, d: number, x: number, s: number, ac: number): number {
    a = addUnsigned(a, addUnsigned(addUnsigned(H(b, c, d), x), ac))
    return addUnsigned(rotateLeft(a, s), b)
  }
  function II(a: number, b: number, c: number, d: number, x: number, s: number, ac: number): number {
    a = addUnsigned(a, addUnsigned(addUnsigned(I(b, c, d), x), ac))
    return addUnsigned(rotateLeft(a, s), b)
  }
  function convertToWordArray(str: string): number[] {
    const wordCount = (((str.length + 8) - ((str.length + 8) % 64)) / 64 + 1) * 16
    const wordArray: number[] = new Array(wordCount).fill(0)
    let bytePos = 0, byteCount = 0
    while (byteCount < str.length) {
      const wordArrayPos = (byteCount - (byteCount % 4)) / 4
      bytePos = (byteCount % 4) * 8
      wordArray[wordArrayPos] = (wordArray[wordArrayPos] | (str.charCodeAt(byteCount) << bytePos))
      byteCount++
    }
    const wordArrayPos = (byteCount - (byteCount % 4)) / 4
    bytePos = (byteCount % 4) * 8
    wordArray[wordArrayPos] = wordArray[wordArrayPos] | (0x80 << bytePos)
    wordArray[wordCount - 2] = str.length << 3
    wordArray[wordCount - 1] = str.length >>> 29
    return wordArray
  }
  function wordToHex(lvalue: number): string {
    let result = ''
    for (let i = 0; i <= 3; i++) {
      result += ((lvalue >> (i * 8 + 4)) & 0x0F).toString(16) + ((lvalue >> (i * 8)) & 0x0F).toString(16)
    }
    return result
  }
  const x = convertToWordArray(string)
  let a = 0x67452301, b = 0xEFCDAB89, c = 0x98BADCFE, d = 0x10325476
  for (let k = 0; k < x.length; k += 16) {
    const AA = a, BB = b, CC = c, DD = d
    a = FF(a, b, c, d, x[k + 0], 7, 0xD76AA478)
    d = FF(d, a, b, c, x[k + 1], 12, 0xE8C7B756)
    c = FF(c, d, a, b, x[k + 2], 17, 0x242070DB)
    b = FF(b, c, d, a, x[k + 3], 22, 0xC1BDCEEE)
    a = FF(a, b, c, d, x[k + 4], 7, 0xF57C0FAF)
    d = FF(d, a, b, c, x[k + 5], 12, 0x4787C62A)
    c = FF(c, d, a, b, x[k + 6], 17, 0xA8304613)
    b = FF(b, c, d, a, x[k + 7], 22, 0xFD469501)
    a = FF(a, b, c, d, x[k + 8], 7, 0x698098D8)
    d = FF(d, a, b, c, x[k + 9], 12, 0x8B44F7AF)
    c = FF(c, d, a, b, x[k + 10], 17, 0xFFFF5BB1)
    b = FF(b, c, d, a, x[k + 11], 22, 0x895CD7BE)
    a = FF(a, b, c, d, x[k + 12], 7, 0x6B901122)
    d = FF(d, a, b, c, x[k + 13], 12, 0xFD987193)
    c = FF(c, d, a, b, x[k + 14], 17, 0xA679438E)
    b = FF(b, c, d, a, x[k + 15], 22, 0x49B40821)
    a = GG(a, b, c, d, x[k + 1], 5, 0xF61E2562)
    d = GG(d, a, b, c, x[k + 6], 9, 0xC040B340)
    c = GG(c, d, a, b, x[k + 11], 14, 0x265E5A51)
    b = GG(b, c, d, a, x[k + 0], 20, 0xE9B6C7AA)
    a = GG(a, b, c, d, x[k + 5], 5, 0xD62F105D)
    d = GG(d, a, b, c, x[k + 10], 9, 0x02441453)
    c = GG(c, d, a, b, x[k + 15], 14, 0xD8A1E681)
    b = GG(b, c, d, a, x[k + 4], 20, 0xE7D3FBC8)
    a = GG(a, b, c, d, x[k + 9], 5, 0x21E1CDE6)
    d = GG(d, a, b, c, x[k + 14], 9, 0xC33707D6)
    c = GG(c, d, a, b, x[k + 3], 14, 0xF4D50D87)
    b = GG(b, c, d, a, x[k + 8], 20, 0x455A14ED)
    a = GG(a, b, c, d, x[k + 13], 5, 0xA9E3E905)
    d = GG(d, a, b, c, x[k + 2], 9, 0xFCEFA3F8)
    c = GG(c, d, a, b, x[k + 7], 14, 0x676F02D9)
    b = GG(b, c, d, a, x[k + 12], 20, 0x8D2A4C8A)
    a = HH(a, b, c, d, x[k + 5], 4, 0xFFFA3942)
    d = HH(d, a, b, c, x[k + 8], 11, 0x8771F681)
    c = HH(c, d, a, b, x[k + 11], 16, 0x6D9D6122)
    b = HH(b, c, d, a, x[k + 14], 23, 0xFDE5380C)
    a = HH(a, b, c, d, x[k + 1], 4, 0xA4BEEA44)
    d = HH(d, a, b, c, x[k + 4], 11, 0x4BDECFA9)
    c = HH(c, d, a, b, x[k + 7], 16, 0xF6BB4B60)
    b = HH(b, c, d, a, x[k + 10], 23, 0xBEBFBC70)
    a = HH(a, b, c, d, x[k + 13], 4, 0x289B7EC6)
    d = HH(d, a, b, c, x[k + 0], 11, 0xEAA127FA)
    c = HH(c, d, a, b, x[k + 3], 16, 0xD4EF3085)
    b = HH(b, c, d, a, x[k + 6], 23, 0x04881D05)
    a = HH(a, b, c, d, x[k + 9], 4, 0xD9D4D039)
    d = HH(d, a, b, c, x[k + 12], 11, 0xE6DB99E5)
    c = HH(c, d, a, b, x[k + 15], 16, 0x1FA27CF8)
    b = HH(b, c, d, a, x[k + 2], 23, 0xC4AC5665)
    a = II(a, b, c, d, x[k + 0], 6, 0xF4292244)
    d = II(d, a, b, c, x[k + 7], 10, 0x432AFF97)
    c = II(c, d, a, b, x[k + 14], 15, 0xAB9423A7)
    b = II(b, c, d, a, x[k + 5], 21, 0xFC93A039)
    a = II(a, b, c, d, x[k + 12], 6, 0x655B59C3)
    d = II(d, a, b, c, x[k + 3], 10, 0x8F0CCC92)
    c = II(c, d, a, b, x[k + 10], 15, 0xFFEFF47D)
    b = II(b, c, d, a, x[k + 1], 21, 0x85845DD1)
    a = II(a, b, c, d, x[k + 8], 6, 0x6FA87E4F)
    d = II(d, a, b, c, x[k + 15], 10, 0xFE2CE6E0)
    c = II(c, d, a, b, x[k + 6], 15, 0xA3014314)
    b = II(b, c, d, a, x[k + 13], 21, 0x4E0811A1)
    a = II(a, b, c, d, x[k + 4], 6, 0xF7537E82)
    d = II(d, a, b, c, x[k + 11], 10, 0xBD3AF235)
    c = II(c, d, a, b, x[k + 2], 15, 0x2AD7D2BB)
    b = II(b, c, d, a, x[k + 9], 21, 0xEB86D391)
    a = addUnsigned(a, AA)
    b = addUnsigned(b, BB)
    c = addUnsigned(c, CC)
    d = addUnsigned(d, DD)
  }
  return (wordToHex(a) + wordToHex(b) + wordToHex(c) + wordToHex(d)).toLowerCase()
}

function hexToRgb(hex: string): { r: number; g: number; b: number } | null {
  const m = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex)
  return m ? { r: parseInt(m[1], 16), g: parseInt(m[2], 16), b: parseInt(m[3], 16) } : null
}

function rgbToHex(r: number, g: number, b: number): string {
  const toHex = (n: number) => {
    const hex = Math.max(0, Math.min(255, Math.round(n))).toString(16)
    return hex.length === 1 ? '0' + hex : hex
  }
  return `#${toHex(r)}${toHex(g)}${toHex(b)}`
}

function rgbToHsl(r: number, g: number, b: number): { h: number; s: number; l: number } {
  const R = r / 255, G = g / 255, B = b / 255
  const max = Math.max(R, G, B), min = Math.min(R, G, B)
  let h = 0, s = 0
  const l = (max + min) / 2
  if (max !== min) {
    const d = max - min
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min)
    switch (max) {
      case R: h = (G - B) / d + (G < B ? 6 : 0); break
      case G: h = (B - R) / d + 2; break
      case B: h = (R - G) / d + 4; break
    }
    h *= 60
  }
  return { h: Math.round(h), s: Math.round(s * 100), l: Math.round(l * 100) }
}

function hslToRgb(h: number, s: number, l: number): { r: number; g: number; b: number } {
  const S = s / 100, L = l / 100
  const c = (1 - Math.abs(2 * L - 1)) * S
  const hh = ((h % 360) + 360) % 360 / 60
  const x = c * (1 - Math.abs((hh % 2) - 1))
  let r1 = 0, g1 = 0, b1 = 0
  if (hh < 1) { r1 = c; g1 = x; b1 = 0 }
  else if (hh < 2) { r1 = x; g1 = c; b1 = 0 }
  else if (hh < 3) { r1 = 0; g1 = c; b1 = x }
  else if (hh < 4) { r1 = 0; g1 = x; b1 = c }
  else if (hh < 5) { r1 = x; g1 = 0; b1 = c }
  else { r1 = c; g1 = 0; b1 = x }
  const m = L - c / 2
  return {
    r: Math.round((r1 + m) * 255),
    g: Math.round((g1 + m) * 255),
    b: Math.round((b1 + m) * 255),
  }
}

interface JWTPayload {
  header: Record<string, unknown> | null
  payload: Record<string, unknown> | null
  signature: string
  valid: boolean
  error?: string
}

function decodeJWT(token: string): JWTPayload {
  const result: JWTPayload = { header: null, payload: null, signature: '', valid: false }
  if (!token || !token.includes('.')) {
    result.error = '无效的 JWT 格式'
    return result
  }
  const parts = token.split('.')
  if (parts.length !== 3) {
    result.error = 'JWT 应包含 3 个部分'
    return result
  }
  try {
    const decodeBase64Url = (str: string): string => {
      let base64 = str.replace(/-/g, '+').replace(/_/g, '/')
      while (base64.length % 4) base64 += '='
      return decodeURIComponent(escape(atob(base64)))
    }
    result.header = JSON.parse(decodeBase64Url(parts[0]))
    result.payload = JSON.parse(decodeBase64Url(parts[1]))
    result.signature = parts[2]
    result.valid = true
  } catch (err) {
    result.error = err instanceof Error ? err.message : '解码失败'
  }
  return result
}

const CRON_PRESETS = [
  { label: '每分钟', expr: '* * * * *', desc: 'Every minute' },
  { label: '每5分钟', expr: '*/5 * * * *', desc: 'Every 5 minutes' },
  { label: '每小时', expr: '0 * * * *', desc: 'Every hour' },
  { label: '每天零点', expr: '0 0 * * *', desc: 'Every day at 00:00' },
  { label: '每周一零点', expr: '0 0 * * 1', desc: 'Every Monday' },
  { label: '每月1号零点', expr: '0 0 1 * *', desc: 'First day of month' },
  { label: '工作日9点', expr: '0 9 * * 1-5', desc: '9am on weekdays' },
  { label: '每30秒', expr: '*/30 * * * * *', desc: 'Every 30 seconds (with seconds field)' },
]

function parseCronField(field: string, min: number, max: number, names?: string[]): number[] {
  const result = new Set<number>()
  const parts = field.split(',')
  for (const part of parts) {
    if (part === '*' || part === '?') {
      for (let i = min; i <= max; i++) result.add(i)
    } else if (part.startsWith('*/')) {
      const step = parseInt(part.slice(1))
      if (!isNaN(step) && step > 0) {
        for (let i = min; i <= max; i += step) result.add(i)
      }
    } else if (part.includes('-')) {
      const [startStr, endStr] = part.split('-')
      const start = parseInt(startStr) || (names ? names.indexOf(startStr) : parseInt(startStr))
      const end = parseInt(endStr) || (names ? names.indexOf(endStr) : parseInt(endStr))
      if (!isNaN(start) && !isNaN(end)) {
        for (let i = start; i <= end; i++) result.add(i)
      }
    } else {
      const val = parseInt(part) || (names ? names.indexOf(part) : parseInt(part))
      if (!isNaN(val) && val >= min && val <= max) result.add(val)
    }
  }
  return Array.from(result).sort((a, b) => a - b)
}

function cronToHumanReadable(expr: string): string {
  const parts = expr.trim().split(/\s+/)
  if (parts.length < 5 || parts.length > 6) return '无效的 Cron 表达式（需要 5 或 6 个字段）'

  const hasSeconds = parts.length === 6
  const [second, minute, hour, dayOfMonth, month, dayOfWeek] = hasSeconds
    ? parts
    : ['0', ...parts]

  const secondVals = parseCronField(second, 0, 59)
  const minuteVals = parseCronField(minute, 0, 59)
  const hourVals = parseCronField(hour, 0, 23)
  const domVals = parseCronField(dayOfMonth, 1, 31)
  const monthVals = parseCronField(month, 1, 12)
  const dowNames = ['日', '一', '二', '三', '四', '五', '六']
  const dowVals = parseCronField(dayOfWeek, 0, 6, dowNames)

  const parts_desc: string[] = []

  if (hasSeconds && secondVals.length === 1 && secondVals[0] !== 0) {
    parts_desc.push(`在第 ${secondVals[0]} 秒`)
  } else if (hasSeconds && secondVals.length === 60) {
    parts_desc.push('每秒')
  }

  if (minuteVals.length === 60) parts_desc.push('每分钟')
  else if (minuteVals.length <= 6) parts_desc.push(`在第 ${minuteVals.join(', ')} 分钟`)

  if (hourVals.length === 24) parts_desc.push('每小时')
  else if (hourVals.length <= 6) parts_desc.push(`在 ${hourVals.map(h => String(h).padStart(2, '0') + ':00').join(', ')}`)

  if (domVals.length === 31) parts_desc.push('每天')
  else if (domVals.length <= 10) parts_desc.push(`在第 ${domVals.join(', ')} 日`)

  if (monthVals.length === 12) parts_desc.push('每月')
  else if (monthVals.length <= 6) parts_desc.push(`${monthVals.join(', ')} 月`)

  if (dowVals.length === 7) parts_desc.push('每周每天')
  else if (dowVals.length > 0) parts_desc.push(`周${dowVals.map(d => dowNames[d]).join('、')}`)

  return parts_desc.join('，') || '无法解析'
}

function getNextCronTimes(expr: string, count: number): Date[] {
  const parts = expr.trim().split(/\s+/)
  if (parts.length < 5 || parts.length > 6) return []

  const hasSeconds = parts.length === 6
  const [second, minute, hour, dayOfMonth, month, dayOfWeek] = hasSeconds
    ? parts
    : ['0', ...parts]

  const secondVals = parseCronField(second, 0, 59)
  const minuteVals = parseCronField(minute, 0, 59)
  const hourVals = parseCronField(hour, 0, 23)
  const domVals = parseCronField(dayOfMonth, 1, 31)
  const monthVals = parseCronField(month, 1, 12)
  const dowVals = parseCronField(dayOfWeek, 0, 6)

  if (secondVals.length === 0 || minuteVals.length === 0 || hourVals.length === 0 ||
      domVals.length === 0 || monthVals.length === 0 || dowVals.length === 0) return []

  const results: Date[] = []
  const start = new Date()
  start.setMilliseconds(0)
  const iterLimit = 500000
  let iterations = 0

  while (results.length < count && iterations < iterLimit) {
    iterations++
    const s = start.getSeconds()
    const m = start.getMinutes()
    const h = start.getHours()
    const d = start.getDate()
    const mo = start.getMonth() + 1
    const dow = start.getDay()

    if (secondVals.includes(s) && minuteVals.includes(m) && hourVals.includes(h) &&
        domVals.includes(d) && monthVals.includes(mo) && dowVals.includes(dow)) {
      results.push(new Date(start))
      start.setSeconds(start.getSeconds() + 1)
    } else {
      if (s < 59) {
        start.setSeconds(s + 1)
      } else {
        start.setSeconds(0)
        if (m < 59) {
          start.setMinutes(m + 1)
        } else {
          start.setMinutes(0)
          if (h < 23) {
            start.setHours(h + 1)
          } else {
            start.setHours(0)
            start.setDate(d + 1)
          }
        }
      }
    }
  }
  return results
}

function CopyButton({ value }: { value: string }) {
  const [copied, setCopied] = useState(false)
  const onClick = async () => {
    try {
      await navigator.clipboard.writeText(value)
      setCopied(true)
      setTimeout(() => setCopied(false), 1500)
    } catch {
      const ta = document.createElement('textarea')
      ta.value = value
      document.body.appendChild(ta)
      ta.select()
      document.execCommand('copy')
      document.body.removeChild(ta)
      setCopied(true)
      setTimeout(() => setCopied(false), 1500)
    }
  }
  return (
    <button onClick={onClick} className="app-button" style={{ padding: '6px 14px', fontSize: 12 }}>
      {copied ? '✓ 已复制' : '📋 复制'}
    </button>
  )
}

function JsonTool() {
  const [text, setText] = useState('{\n  "name": "WebLinuxOS",\n  "version": "2.0",\n  "tools": ["JSON", "Base64", "哈希", "UUID", "时间戳", "颜色", "正则", "JWT", "Cron"],\n  "active": true,\n  "stats": { "users": 1000, "uptime": 99.9 }\n}')

  const { isValid, error, errorPos } = useMemo(() => {
    try {
      JSON.parse(text)
      return { isValid: true, error: '', errorPos: null as { line: number; col: number } | null }
    } catch (e) {
      const msg = e instanceof Error ? e.message : 'JSON 解析错误'
      const match = /position (\d+)/i.exec(msg)
      let pos: { line: number; col: number } | null = null
      if (match) {
        const idx = parseInt(match[1], 10)
        const before = text.slice(0, idx)
        const line = (before.match(/\n/g) || []).length + 1
        const lastNewline = before.lastIndexOf('\n')
        const col = idx - (lastNewline < 0 ? 0 : lastNewline)
        pos = { line, col }
      }
      return { isValid: false, error: msg, errorPos: pos }
    }
  }, [text])

  const prettified = useMemo(() => {
    try { return JSON.stringify(JSON.parse(text), null, 2) } catch { return '' }
  }, [text])

  const minified = useMemo(() => {
    try { return JSON.stringify(JSON.parse(text)) } catch { return '' }
  }, [text])

  const lines = useMemo(() => prettified.split('\n'), [prettified])

  return (
    <div className="app-card" style={{ display: 'flex', flexDirection: 'column', gap: 12, height: '100%' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 8 }}>
        <h3 style={{ margin: 0, fontSize: 16 }}>JSON 格式化 / 压缩 / 验证</h3>
        <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
          {isValid ? (
            <span className="chip" style={{ background: 'rgba(16, 185, 129, 0.15)', color: '#10b981' }}>✓ 合法 JSON</span>
          ) : (
            <span className="chip" style={{ background: 'rgba(239, 68, 68, 0.15)', color: '#ef4444' }}>✗ 格式错误</span>
          )}
          <button onClick={() => setText(prettified)} className="app-button" style={{ padding: '6px 14px', fontSize: 12 }}>美化</button>
          <button onClick={() => setText(minified)} className="app-button" style={{ padding: '6px 14px', fontSize: 12 }}>压缩</button>
          <CopyButton value={text} />
        </div>
      </div>

      {!isValid && (
        <div style={{ padding: '10px 14px', background: 'rgba(239, 68, 68, 0.1)', border: '1px solid rgba(239, 68, 68, 0.3)', borderRadius: 8, fontSize: 12, color: '#ef4444' }}>
          <strong>错误：</strong>{error}
          {errorPos && <span>（第 {errorPos.line} 行，第 {errorPos.col} 列）</span>}
        </div>
      )}

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, flex: 1, minHeight: 0 }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8, minHeight: 0 }}>
          <label style={{ fontSize: 12, color: 'var(--text-secondary)' }}>输入 JSON</label>
          <textarea
            className="app-textarea"
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder="输入 JSON..."
            style={{ flex: 1, minHeight: 250, padding: 10, resize: 'vertical', fontFamily: 'monospace', fontSize: 13 }}
          />
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8, minHeight: 0 }}>
          <label style={{ fontSize: 12, color: 'var(--text-secondary)' }}>格式化预览（{lines.length} 行）</label>
          <div style={{ flex: 1, minHeight: 250, overflow: 'auto', padding: 10, background: '#1a1a2e', borderRadius: 8, border: '1px solid var(--window-border)', fontFamily: 'monospace', fontSize: 13, lineHeight: 1.6 }}>
            {lines.map((line, i) => (
              <div key={i} style={{ display: 'flex' }}>
                <span style={{ display: 'inline-block', width: 40, textAlign: 'right', color: 'var(--text-secondary)', paddingRight: 12, userSelect: 'none', opacity: 0.6 }}>{i + 1}</span>
                <span style={{ color: 'var(--text-primary)', whiteSpace: 'pre' }}>{line}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}

function Base64Tool() {
  const [text, setText] = useState('Hello WebLinuxOS 你好世界 🌍')
  const encoded = useMemo(() => unicodeToBase64(text), [text])

  return (
    <div className="app-card" style={{ display: 'flex', flexDirection: 'column', gap: 12, height: '100%' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <h3 style={{ margin: 0, fontSize: 16 }}>Base64 编解码</h3>
        <div style={{ display: 'flex', gap: 8 }}>
          <span className="chip">文本 ↔ Base64</span>
          <span className="chip">支持中文/Unicode</span>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, flex: 1, minHeight: 0 }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8, minHeight: 0 }}>
          <label style={{ fontSize: 12, color: 'var(--text-secondary)' }}>原文</label>
          <textarea
            className="app-textarea"
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder="输入文本..."
            style={{ flex: 1, minHeight: 200, padding: 10, resize: 'vertical', fontFamily: 'monospace', fontSize: 13 }}
          />
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: 12, color: 'var(--text-secondary)' }}>{text.length} 字符</span>
            <div style={{ display: 'flex', gap: 8 }}>
              <button onClick={() => setText('')} className="app-button" style={{ padding: '6px 14px', fontSize: 12 }}>清空</button>
              <CopyButton value={text} />
            </div>
          </div>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 8, minHeight: 0 }}>
          <label style={{ fontSize: 12, color: 'var(--text-secondary)' }}>Base64 编码结果（在此粘贴可解码）</label>
          <textarea
            className="app-textarea"
            value={encoded}
            onChange={(e => {
              const decoded = base64ToUnicode(e.target.value)
              setText(decoded)
            })}
            placeholder="或在此粘贴 Base64 以解码..."
            style={{ flex: 1, minHeight: 200, padding: 10, resize: 'vertical', fontFamily: 'monospace', fontSize: 13, background: '#1a1a2e' }}
          />
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: 12, color: 'var(--text-secondary)' }}>{encoded.length} 字符</span>
            <div style={{ display: 'flex', gap: 8 }}>
              <button onClick={() => { const d = base64ToUnicode(encoded); setText(d) }} className="app-button" style={{ padding: '6px 14px', fontSize: 12 }}>🔄 解码回左侧</button>
              <CopyButton value={encoded} />
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

function UrlTool() {
  const [text, setText] = useState('https://example.com/测试?q=你好&value=测试 值')
  const encoded = useMemo(() => { try { return encodeURIComponent(text) } catch { return '' } }, [text])
  const decoded = useMemo(() => { try { return decodeURIComponent(text) } catch { return '⚠️ 解码失败' } }, [text])

  return (
    <div className="app-card" style={{ display: 'flex', flexDirection: 'column', gap: 12, height: '100%' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <h3 style={{ margin: 0, fontSize: 16 }}>URL 编解码</h3>
        <span className="chip">encodeURIComponent / decodeURIComponent</span>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        <label style={{ fontSize: 12, color: 'var(--text-secondary)' }}>输入文本 / URL</label>
        <textarea
          className="app-textarea"
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="输入文本或 URL..."
          style={{ minHeight: 100, padding: 10, resize: 'vertical', fontFamily: 'monospace', fontSize: 13 }}
        />
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span style={{ fontSize: 12, color: 'var(--text-secondary)' }}>{text.length} 字符</span>
          <div style={{ display: 'flex', gap: 8 }}>
            <button onClick={() => setText('')} className="app-button" style={{ padding: '6px 14px', fontSize: 12 }}>清空</button>
            <CopyButton value={text} />
          </div>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          <label style={{ fontSize: 12, color: 'var(--text-secondary)' }}>编码结果</label>
          <div style={{ padding: 12, background: '#1a1a2e', borderRadius: 8, fontFamily: 'monospace', fontSize: 13, minHeight: 100, wordBreak: 'break-all', whiteSpace: 'pre-wrap', border: '1px solid var(--window-border)' }}>{encoded}</div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: 12, color: 'var(--text-secondary)' }}>{encoded.length} 字符</span>
            <CopyButton value={encoded} />
          </div>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          <label style={{ fontSize: 12, color: 'var(--text-secondary)' }}>解码结果</label>
          <div style={{ padding: 12, background: '#1a1a2e', borderRadius: 8, fontFamily: 'monospace', fontSize: 13, minHeight: 100, wordBreak: 'break-all', whiteSpace: 'pre-wrap', border: '1px solid var(--window-border)' }}>{decoded}</div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: 12, color: 'var(--text-secondary)' }}>{decoded.length} 字符</span>
            <CopyButton value={decoded} />
          </div>
        </div>
      </div>
    </div>
  )
}

function HashTool() {
  const [text, setText] = useState('Hello, WebLinuxOS!')
  const [md5, setMd5] = useState('')
  const [sha1, setSha1] = useState('')
  const [sha256, setSha256] = useState('')
  const [sha384, setSha384] = useState('')
  const [sha512, setSha512] = useState('')

  useEffect(() => {
    const compute = async () => {
      setMd5(simpleMD5(text))
      setSha1(await computeHash(text, 'SHA-1'))
      setSha256(await computeHash(text, 'SHA-256'))
      setSha384(await computeHash(text, 'SHA-384'))
      setSha512(await computeHash(text, 'SHA-512'))
    }
    compute()
  }, [text])

  const hashItems = [
    { name: 'MD5', value: md5, bits: 128 },
    { name: 'SHA-1', value: sha1, bits: 160 },
    { name: 'SHA-256', value: sha256, bits: 256 },
    { name: 'SHA-384', value: sha384, bits: 384 },
    { name: 'SHA-512', value: sha512, bits: 512 },
  ]

  return (
    <div className="app-card" style={{ display: 'flex', flexDirection: 'column', gap: 12, height: '100%' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <h3 style={{ margin: 0, fontSize: 16 }}>哈希生成器</h3>
        <div style={{ display: 'flex', gap: 8 }}>
          <span className="chip">MD5</span>
          <span className="chip">SHA-1/256/384/512</span>
        </div>
      </div>

      <textarea
        className="app-textarea"
        value={text}
        onChange={(e) => setText(e.target.value)}
        placeholder="输入要计算哈希的文本..."
        style={{ padding: 10, minHeight: 100, fontFamily: 'monospace', fontSize: 13, resize: 'vertical' }}
      />

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <span style={{ fontSize: 12, color: 'var(--text-secondary)' }}>{text.length} 字符</span>
        <button onClick={() => setText('')} className="app-button" style={{ padding: '6px 14px', fontSize: 12 }}>清空</button>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        {hashItems.map((item) => (
          <div key={item.name} style={{ padding: 10, borderRadius: 8, background: 'var(--window-bg-secondary)', border: '1px solid var(--window-border)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
              <span style={{ fontWeight: 600, fontSize: 13 }}>{item.name}</span>
              <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                <span style={{ fontSize: 11, color: 'var(--text-secondary)' }}>{item.bits} bit</span>
                <CopyButton value={item.value} />
              </div>
            </div>
            <div style={{ fontFamily: 'monospace', fontSize: 12, wordBreak: 'break-all', color: 'var(--text-secondary)', lineHeight: 1.5, userSelect: 'all' }}>
              {item.value || '计算中...'}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

function UuidTool() {
  const [uuids, setUuids] = useState<string[]>(() => Array.from({ length: 5 }, () => generateUUID()))
  const [uuidCount, setUuidCount] = useState(5)

  return (
    <div className="app-card" style={{ display: 'flex', flexDirection: 'column', gap: 12, height: '100%' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <h3 style={{ margin: 0, fontSize: 16 }}>UUID v4 生成器</h3>
        <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
          <label style={{ fontSize: 12, color: 'var(--text-secondary)' }}>数量</label>
          <input type="number" min={1} max={50} value={uuidCount} onChange={(e) => setUuidCount(Math.max(1, Math.min(50, parseInt(e.target.value) || 1)))} className="app-input" style={{ width: 60, padding: '4px 8px', fontSize: 12 }} />
          <button onClick={() => setUuids(Array.from({ length: uuidCount }, () => generateUUID()))} className="app-button-primary" style={{ padding: '6px 14px', fontSize: 12, border: 'none', cursor: 'pointer', borderRadius: 6, background: 'var(--accent)', color: '#fff' }}>🔄 重新生成</button>
        </div>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 4, maxHeight: 400, overflow: 'auto', background: '#1a1a2e', borderRadius: 8, border: '1px solid var(--window-border)', padding: 8 }}>
        {uuids.map((u, i) => (
          <div key={i} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '6px 10px', fontFamily: 'monospace', fontSize: 12, borderRadius: 4, transition: 'background 0.15s' }}
            onMouseEnter={(e) => { e.currentTarget.style.background = 'rgba(139,124,240,0.08)' }}
            onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent' }}>
            <span style={{ color: 'var(--text-secondary)', width: 30 }}>#{i + 1}</span>
            <span style={{ flex: 1, color: 'var(--text-primary)', wordBreak: 'break-all' }}>{u}</span>
            <CopyButton value={u} />
          </div>
        ))}
      </div>

      <div style={{ display: 'flex', justifyContent: 'center', gap: 8 }}>
        <button onClick={() => navigator.clipboard?.writeText(uuids.join('\n')).catch(() => {})} className="app-button" style={{ padding: '8px 20px', fontSize: 13 }}>
          📋 复制全部
        </button>
      </div>
    </div>
  )
}

function TimestampTool() {
  const [now, setNow] = useState(Date.now())
  const [inputTs, setInputTs] = useState<string>(String(Math.floor(Date.now() / 1000)))
  const [inputDate, setInputDate] = useState<string>('')
  const [unit, setUnit] = useState<'s' | 'ms'>('s')

  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), 1000)
    return () => clearInterval(id)
  }, [])

  useEffect(() => {
    const d = new Date(now)
    const pad = (n: number) => String(n).padStart(2, '0')
    setInputDate(`${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`)
  }, [])

  const parsedFromTs = useMemo(() => {
    const n = parseFloat(inputTs)
    if (isNaN(n)) return null
    const ms = unit === 's' ? n * 1000 : n
    return new Date(ms)
  }, [inputTs, unit])

  const parsedFromDate = useMemo(() => {
    if (!inputDate) return null
    const d = new Date(inputDate.replace(' ', 'T'))
    if (isNaN(d.getTime())) return null
    return d
  }, [inputDate])

  const fmt = (d: Date) => {
    const pad = (n: number) => String(n).padStart(2, '0')
    return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`
  }
  const fmtUTC = (d: Date) => {
    const pad = (n: number) => String(n).padStart(2, '0')
    return `${d.getUTCFullYear()}-${pad(d.getUTCMonth() + 1)}-${pad(d.getUTCDate())} ${pad(d.getUTCHours())}:${pad(d.getUTCMinutes())}:${pad(d.getUTCSeconds())} UTC`
  }

  return (
    <div className="app-card" style={{ display: 'flex', flexDirection: 'column', gap: 14, height: '100%' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 8 }}>
        <h3 style={{ margin: 0, fontSize: 16 }}>时间戳转换</h3>
        <div style={{ display: 'flex', gap: 8 }}>
          <span className="chip">{new Date(now).toLocaleTimeString()}</span>
          <span className="chip">Unix (s): {Math.floor(now / 1000)}</span>
          <span className="chip">Unix (ms): {now}</span>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8, padding: 14, background: '#1a1a2e', borderRadius: 8, border: '1px solid var(--window-border)' }}>
          <strong style={{ fontSize: 13 }}>时间戳 → 日期</strong>
          <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
            <input value={inputTs} onChange={(e) => setInputTs(e.target.value)} className="app-input" placeholder="输入时间戳" style={{ flex: 1, padding: '8px 10px', fontSize: 13, fontFamily: 'monospace' }} />
            <select value={unit} onChange={(e) => setUnit(e.target.value as 's' | 'ms')} className="app-input" style={{ padding: '8px 10px', fontSize: 12, cursor: 'pointer' }}>
              <option value="s">秒</option>
              <option value="ms">毫秒</option>
            </select>
          </div>
          <div style={{ display: 'flex', gap: 8 }}>
            <button onClick={() => setInputTs(String(Math.floor(Date.now() / 1000)))} className="app-button" style={{ padding: '6px 12px', fontSize: 12 }}>使用当前秒</button>
            <button onClick={() => setInputTs(String(Date.now()))} className="app-button" style={{ padding: '6px 12px', fontSize: 12 }}>使用当前毫秒</button>
          </div>
          {parsedFromTs && !isNaN(parsedFromTs.getTime()) ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6, fontSize: 12, padding: 10, background: 'rgba(139,124,240,0.08)', borderRadius: 6 }}>
              <div><span style={{ color: 'var(--text-secondary)' }}>本地：</span>{fmt(parsedFromTs)}</div>
              <div><span style={{ color: 'var(--text-secondary)' }}>UTC：</span>{fmtUTC(parsedFromTs)}</div>
              <div><span style={{ color: 'var(--text-secondary)' }}>ISO：</span>{parsedFromTs.toISOString()}</div>
              <div><span style={{ color: 'var(--text-secondary)' }}>相对：</span>{getRelativeTime(parsedFromTs)}</div>
            </div>
          ) : (
            <div style={{ fontSize: 12, color: '#ef4444' }}>无效时间戳</div>
          )}
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 8, padding: 14, background: '#1a1a2e', borderRadius: 8, border: '1px solid var(--window-border)' }}>
          <strong style={{ fontSize: 13 }}>日期 → 时间戳</strong>
          <input value={inputDate} onChange={(e) => setInputDate(e.target.value)} className="app-input" placeholder="YYYY-MM-DD HH:mm:ss" style={{ padding: '8px 10px', fontSize: 13, fontFamily: 'monospace' }} />
          <div style={{ display: 'flex', gap: 8 }}>
            <button onClick={() => { const d = new Date(); const pad = (n: number) => String(n).padStart(2, '0'); setInputDate(`${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`) }} className="app-button" style={{ padding: '6px 12px', fontSize: 12 }}>使用当前时间</button>
            <CopyButton value={inputDate} />
          </div>
          {parsedFromDate ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6, fontSize: 12, padding: 10, background: 'rgba(16,185,129,0.08)', borderRadius: 6 }}>
              <div><span style={{ color: 'var(--text-secondary)' }}>Unix (s):</span> <span style={{ fontFamily: 'monospace' }}>{Math.floor(parsedFromDate.getTime() / 1000)}</span></div>
              <div><span style={{ color: 'var(--text-secondary)' }}>Unix (ms):</span> <span style={{ fontFamily: 'monospace' }}>{parsedFromDate.getTime()}</span></div>
              <div><span style={{ color: 'var(--text-secondary)' }}>ISO：</span>{parsedFromDate.toISOString()}</div>
            </div>
          ) : (
            <div style={{ fontSize: 12, color: '#ef4444' }}>无效日期格式</div>
          )}
        </div>
      </div>
    </div>
  )
}

function getRelativeTime(date: Date): string {
  const now = new Date()
  const diffMs = now.getTime() - date.getTime()
  const absMs = Math.abs(diffMs)
  const future = diffMs < 0

  const seconds = Math.floor(absMs / 1000)
  const minutes = Math.floor(seconds / 60)
  const hours = Math.floor(minutes / 60)
  const days = Math.floor(hours / 24)

  let str: string
  if (seconds < 60) str = `${seconds} 秒`
  else if (minutes < 60) str = `${minutes} 分钟`
  else if (hours < 24) str = `${hours} 小时`
  else if (days < 30) str = `${days} 天`
  else if (days < 365) str = `${Math.floor(days / 30)} 个月`
  else str = `${Math.floor(days / 365)} 年`

  return future ? `${str} 后` : `${str} 前`
}

function ColorTool() {
  const [hex, setHex] = useState('#7c6cf0')
  const rgb = useMemo(() => hexToRgb(hex), [hex])
  const hsl = useMemo(() => (rgb ? rgbToHsl(rgb.r, rgb.g, rgb.b) : { h: 0, s: 0, l: 0 }), [rgb])
  const fileInputRef = useRef<HTMLInputElement>(null)

  const palette = useMemo(() => {
    if (!rgb) return [] as string[]
    const base = rgbToHsl(rgb.r, rgb.g, rgb.b)
    const result: string[] = []
    for (let i = 0; i < 10; i++) {
      const l = 90 - i * 9
      const { r, g, b } = hslToRgb(base.h, base.s, l)
      result.push(rgbToHex(r, g, b))
    }
    return result
  }, [rgb])

  const harmonyColors = useMemo(() => {
    if (!rgb) return [] as string[]
    const base = rgbToHsl(rgb.r, rgb.g, rgb.b)
    const results: string[] = []
    const harmonies = [0, 30, 60, 120, 150, 180, 210, 240, 300]
    for (const hOffset of harmonies) {
      const { r, g, b } = hslToRgb((base.h + hOffset) % 360, Math.min(100, base.s + 10), Math.min(90, Math.max(10, base.l)))
      results.push(rgbToHex(r, g, b))
    }
    return results
  }, [rgb])

  return (
    <div className="app-card" style={{ display: 'flex', flexDirection: 'column', gap: 14, height: '100%' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <h3 style={{ margin: 0, fontSize: 16 }}>颜色选择器 + 格式转换</h3>
        <input type="color" value={rgb ? hex : '#000000'} onChange={(e) => setHex(e.target.value)} ref={fileInputRef as unknown as React.RefObject<HTMLInputElement>} style={{ width: 50, height: 32, cursor: 'pointer', border: 'none', borderRadius: 6, padding: 0, background: 'transparent' }} />
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '200px 1fr', gap: 14 }}>
        <div style={{ height: 180, background: rgb ? `rgb(${rgb.r}, ${rgb.g}, ${rgb.b})` : '#000', borderRadius: 12, border: '2px solid var(--window-border)', boxShadow: `0 0 40px ${rgb ? `rgba(${rgb.r},${rgb.g},${rgb.b},0.35)` : 'transparent'}`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 14, color: rgb && (rgb.r * 299 + rgb.g * 587 + rgb.b * 114) / 1000 > 128 ? '#000' : '#fff', fontFamily: 'monospace' }}>
          预览
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
            <label style={{ width: 80, fontSize: 12, color: 'var(--text-secondary)' }}>HEX</label>
            <input value={hex} onChange={(e) => setHex(e.target.value)} className="app-input" style={{ flex: 1, padding: '8px 10px', fontSize: 13, fontFamily: 'monospace' }} />
            <CopyButton value={hex} />
          </div>
          <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
            <label style={{ width: 80, fontSize: 12, color: 'var(--text-secondary)' }}>RGB</label>
            <input value={rgb ? `rgb(${rgb.r}, ${rgb.g}, ${rgb.b})` : '无效'} readOnly className="app-input" style={{ flex: 1, padding: '8px 10px', fontSize: 13, fontFamily: 'monospace' }} />
            <CopyButton value={rgb ? `rgb(${rgb.r}, ${rgb.g}, ${rgb.b})` : ''} />
          </div>
          <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
            <label style={{ width: 80, fontSize: 12, color: 'var(--text-secondary)' }}>HSL</label>
            <input value={rgb ? `hsl(${hsl.h}, ${hsl.s}%, ${hsl.l}%)` : '无效'} readOnly className="app-input" style={{ flex: 1, padding: '8px 10px', fontSize: 13, fontFamily: 'monospace' }} />
            <CopyButton value={rgb ? `hsl(${hsl.h}, ${hsl.s}%, ${hsl.l}%)` : ''} />
          </div>
          {rgb && (
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', padding: 10, background: '#1a1a2e', borderRadius: 8 }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 2, flex: 1, minWidth: 80 }}>
                <label style={{ fontSize: 11, color: 'var(--text-secondary)' }}>R: {rgb.r}</label>
                <input type="range" min={0} max={255} value={rgb.r} onChange={(e) => { const r = parseInt(e.target.value); setHex(rgbToHex(r, rgb.g, rgb.b)) }} />
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 2, flex: 1, minWidth: 80 }}>
                <label style={{ fontSize: 11, color: 'var(--text-secondary)' }}>G: {rgb.g}</label>
                <input type="range" min={0} max={255} value={rgb.g} onChange={(e) => { const g = parseInt(e.target.value); setHex(rgbToHex(rgb.r, g, rgb.b)) }} />
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 2, flex: 1, minWidth: 80 }}>
                <label style={{ fontSize: 11, color: 'var(--text-secondary)' }}>B: {rgb.b}</label>
                <input type="range" min={0} max={255} value={rgb.b} onChange={(e) => { const b = parseInt(e.target.value); setHex(rgbToHex(rgb.r, rgb.g, b)) }} />
              </div>
            </div>
          )}
        </div>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        <label style={{ fontSize: 12, color: 'var(--text-secondary)' }}>调色板（点击复制）</label>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(10, 1fr)', gap: 4, height: 50 }}>
          {palette.map((c, i) => (
            <button key={i} onClick={() => { navigator.clipboard?.writeText(c).catch(() => {}) }} title={c}
              style={{ background: c, border: '2px solid transparent', borderRadius: 6, cursor: 'pointer', fontSize: 10, color: 'transparent', transition: 'transform 0.15s, border-color 0.15s' }}
              onMouseEnter={(e) => { e.currentTarget.style.transform = 'scale(1.05)'; e.currentTarget.style.borderColor = 'var(--accent)' }}
              onMouseLeave={(e) => { e.currentTarget.style.transform = 'scale(1)'; e.currentTarget.style.borderColor = 'transparent' }}>
              {c}
            </button>
          ))}
        </div>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        <label style={{ fontSize: 12, color: 'var(--text-secondary)' }}>和谐色</label>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(9, 1fr)', gap: 4 }}>
          {harmonyColors.map((c, i) => (
            <button key={i} onClick={() => setHex(c)} title={c}
              style={{ aspectRatio: '1', background: c, border: 'none', borderRadius: 6, cursor: 'pointer', transition: 'transform 0.15s' }}
              onMouseEnter={(e) => { e.currentTarget.style.transform = 'scale(1.1)' }}
              onMouseLeave={(e) => { e.currentTarget.style.transform = 'scale(1)' }} />
          ))}
        </div>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        <label style={{ fontSize: 12, color: 'var(--text-secondary)' }}>常用色</label>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(10, 1fr)', gap: 4 }}>
          {['#ef4444', '#f97316', '#eab308', '#22c55e', '#14b8a6', '#06b6d4', '#3b82f6', '#8b5cf6', '#ec4899', '#64748b'].map((c) => (
            <button key={c} onClick={() => setHex(c)} title={c}
              style={{ aspectRatio: '1', background: c, border: 'none', borderRadius: 6, cursor: 'pointer', transition: 'transform 0.15s' }}
              onMouseEnter={(e) => { e.currentTarget.style.transform = 'scale(1.1)' }}
              onMouseLeave={(e) => { e.currentTarget.style.transform = 'scale(1)' }} />
          ))}
        </div>
      </div>
    </div>
  )
}

const RegexTool: React.FC = () => {
  const [pattern, setPattern] = useState('(\\w+)=(\\d+)')
  const [flags, setFlags] = useState('g')
  const [testText, setTestText] = useState('name=123 age=456 key=789')

  const getMatches = (): Array<{ match: string; index: number; groups: string[] }> => {
    if (!pattern) return []
    try {
      const re = new RegExp(pattern, flags)
      const results: Array<{ match: string; index: number; groups: string[] }> = []
      let m: RegExpExecArray | null
      if (re.global) {
        while ((m = re.exec(testText)) !== null) {
          results.push({ match: m[0], index: m.index, groups: m.slice(1) })
          if (results.length > 1000) break
        }
      } else {
        m = re.exec(testText)
        if (m) results.push({ match: m[0], index: m.index, groups: m.slice(1) })
      }
      return results
    } catch { return [] }
  }

  const matches = getMatches()
  const isValid = (() => { try { new RegExp(pattern, flags); return true } catch { return false } })()

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12, height: '100%' }}>
      <div style={{ display: 'flex', gap: 8 }}>
        <input value={pattern} onChange={(e) => setPattern(e.target.value)} placeholder="正则表达式..."
          style={{ flex: 1, padding: '10px 12px', background: 'var(--input-bg)', color: 'var(--text-primary)', border: `1px solid ${isValid ? 'var(--window-border)' : 'var(--danger)'}`, borderRadius: 8, fontSize: 13, fontFamily: 'monospace' }} />
        <input value={flags} onChange={(e) => setFlags(e.target.value)} placeholder="flags" style={{ width: 80, padding: '10px 12px', background: 'var(--input-bg)', color: 'var(--text-primary)', border: '1px solid var(--window-border)', borderRadius: 8, fontSize: 13, fontFamily: 'monospace' }} />
      </div>
      {!isValid && <div style={{ padding: '8px 12px', background: 'rgba(239,68,68,0.15)', color: '#ef4444', borderRadius: 8, fontSize: 12 }}>⚠ 正则表达式无效</div>}
      <textarea value={testText} onChange={(e) => setTestText(e.target.value)} placeholder="输入要测试的文本..."
        style={{ flex: 1, minHeight: 120, padding: 12, background: 'var(--input-bg)', color: 'var(--text-primary)', border: '1px solid var(--window-border)', borderRadius: 8, fontSize: 13, fontFamily: 'monospace', resize: 'vertical' }} />
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <label style={{ fontSize: 12, color: 'var(--text-secondary)' }}>匹配结果 ({matches.length})</label>
      </div>
      <div style={{ padding: 10, background: 'var(--input-bg)', border: '1px solid var(--window-border)', borderRadius: 8, maxHeight: 150, overflow: 'auto', fontSize: 12, fontFamily: 'monospace' }}>
        {matches.length === 0 && <div style={{ color: 'var(--text-secondary)', textAlign: 'center', padding: 20 }}>无匹配</div>}
        {matches.map((m, i) => (
          <div key={i} style={{ padding: '6px 8px', borderBottom: i < matches.length - 1 ? '1px solid var(--window-border)' : 'none' }}>
            <span style={{ color: 'var(--accent)', fontWeight: 600 }}>[{i}]</span>
            <span style={{ marginLeft: 8, color: 'var(--text-primary)' }}>"{m.match}"</span>
            <span style={{ marginLeft: 8, color: 'var(--text-secondary)' }}>@ {m.index}</span>
            {m.groups.length > 0 && <div style={{ marginLeft: 20, color: 'var(--success)', fontSize: 11 }}>Groups: {m.groups.map((g, j) => `$${j + 1}="${g}"`).join(', ')}</div>}
          </div>
        ))}
      </div>
      <div style={{ padding: 10, background: 'var(--input-bg)', border: '1px solid var(--window-border)', borderRadius: 8 }}>
        <label style={{ fontSize: 12, color: 'var(--text-secondary)', display: 'block', marginBottom: 6 }}>常用模式</label>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
          {[
            { label: '邮箱', pattern: '[\\w.-]+@[\\w.-]+\\.\\w+' },
            { label: 'URL', pattern: 'https?://[\\w.-]+(?:/[\\w./?%&=-]*)?' },
            { label: '手机号', pattern: '1[3-9]\\d{9}' },
            { label: 'IP', pattern: '\\d{1,3}\\.\\d{1,3}\\.\\d{1,3}\\.\\d{1,3}' },
            { label: '日期', pattern: '\\d{4}-\\d{2}-\\d{2}' },
          ].map((p) => (
            <button key={p.label} onClick={() => { setPattern(p.pattern); setFlags('g') }}
              style={{ padding: '4px 10px', background: 'var(--hover)', color: 'var(--text-primary)', border: 'none', borderRadius: 6, fontSize: 11, cursor: 'pointer' }}>
              {p.label}
            </button>
          ))}
        </div>
      </div>
    </div>
  )
}

const JwtTool: React.FC = () => {
  const [token, setToken] = useState('')
  const [header, setHeader] = useState<string | null>(null)
  const [payload, setPayload] = useState<string | null>(null)
  const [signature, setSignature] = useState<string>('')
  const [error, setError] = useState('')

  React.useEffect(() => {
    const decode = () => {
      setError(''); setHeader(null); setPayload(null); setSignature('')
      if (!token.trim()) return
      try {
        const parts = token.trim().split('.')
        if (parts.length !== 3) { setError('无效的JWT格式，应由三部分组成'); return }
        const decodePart = (s: string): string => {
          let base64 = s.replace(/-/g, '+').replace(/_/g, '/')
          while (base64.length % 4) base64 += '='
          try {
            // 优先使用 TextDecoder 处理 Unicode，避免 decodeURIComponent 在多字节字符上失败
            const binStr = window.atob(base64)
            const bytes = Uint8Array.from(binStr, ch => ch.charCodeAt(0))
            if (typeof TextDecoder !== 'undefined') {
              return new TextDecoder('utf-8').decode(bytes)
            }
            // 回退：使用 decodeURIComponent + %XX 编码
            const hexChars = Array.from(binStr).map(c => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
            return window.decodeURIComponent(hexChars.join(''))
          } catch {
            return ''
          }
        }
        setHeader(decodePart(parts[0]))
        setPayload(decodePart(parts[1]))
        setSignature(parts[2])
      } catch (e) { setError('解码失败：' + (e as Error).message) }
    }
    decode()
  }, [token])

  const formatJson = (str: string | null) => {
    if (!str) return ''
    try { return JSON.stringify(JSON.parse(str), null, 2) } catch { return str }
  }

  const headerParsed = header ? formatJson(header) : ''
  const payloadParsed = payload ? formatJson(payload) : ''

  const getExpInfo = () => {
    if (!payload) return null
    try {
      const p = JSON.parse(payload)
      if (!p.exp) return null
      const expDate = new Date(p.exp * 1000)
      const now = Date.now()
      return { expired: now > p.exp * 1000, date: expDate.toLocaleString(), remaining: Math.floor((p.exp * 1000 - now) / 1000) }
    } catch { return null }
  }

  const expInfo = getExpInfo()

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12, height: '100%' }}>
      <textarea value={token} onChange={(e) => setToken(e.target.value)} placeholder="粘贴JWT Token..."
        style={{ minHeight: 80, padding: 12, background: 'var(--input-bg)', color: 'var(--text-primary)', border: '1px solid var(--window-border)', borderRadius: 8, fontSize: 12, fontFamily: 'monospace', resize: 'vertical' }} />
      {error && <div style={{ padding: '8px 12px', background: 'rgba(239,68,68,0.15)', color: '#ef4444', borderRadius: 8, fontSize: 12 }}>{error}</div>}
      {expInfo && (
        <div style={{ padding: 10, background: expInfo.expired ? 'rgba(239,68,68,0.15)' : 'rgba(34,197,94,0.15)', borderRadius: 8, fontSize: 12, color: expInfo.expired ? '#ef4444' : '#22c55e' }}>
          {expInfo.expired ? '已过期' : `有效期至 ${expInfo.date}（剩余 ${Math.floor(expInfo.remaining / 86400)}天 ${Math.floor((expInfo.remaining % 86400) / 3600)}小时）`}
        </div>
      )}
      {header && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <label style={{ fontSize: 12, color: 'var(--accent)', fontWeight: 600 }}>Header</label>
            <CopyButton value={headerParsed} />
          </div>
          <pre style={{ padding: 10, background: 'var(--input-bg)', border: '1px solid var(--window-border)', borderRadius: 8, fontSize: 12, fontFamily: 'monospace', color: 'var(--text-primary)', overflow: 'auto', margin: 0 }}>{headerParsed}</pre>
        </div>
      )}
      {payload && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <label style={{ fontSize: 12, color: 'var(--accent)', fontWeight: 600 }}>Payload</label>
            <CopyButton value={payloadParsed} />
          </div>
          <pre style={{ padding: 10, background: 'var(--input-bg)', border: '1px solid var(--window-border)', borderRadius: 8, fontSize: 12, fontFamily: 'monospace', color: 'var(--text-primary)', overflow: 'auto', margin: 0, flex: 1 }}>{payloadParsed}</pre>
        </div>
      )}
      {signature && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
          <label style={{ fontSize: 12, color: 'var(--accent)', fontWeight: 600 }}>Signature</label>
          <div style={{ padding: 10, background: 'var(--input-bg)', border: '1px solid var(--window-border)', borderRadius: 8, fontSize: 11, fontFamily: 'monospace', color: 'var(--text-secondary)', wordBreak: 'break-all' }}>{signature.substring(0, 40)}...（已截断）</div>
        </div>
      )}
    </div>
  )
}

const CronTool: React.FC = () => {
  const [expr, setExpr] = useState('* * * * *')
  const [description, setDescription] = useState('')
  const [nextRuns, setNextRuns] = useState<string[]>([])

  const parseCron = (cron: string) => {
    const parts = cron.trim().split(/\s+/)
    if (parts.length < 5) { setDescription('Cron表达式至少需要5个字段'); setNextRuns([]); return }
    const [minute, hour, dayOfMonth, month, dayOfWeek] = parts
    const parts_desc: string[] = []

    const parseField = (field: string, min: number, max: number): number[] => {
      const result: number[] = []
      field.split(',').forEach(part => {
        if (part === '*' || part === '?') {
          for (let i = min; i <= max; i++) result.push(i)
        } else if (part.includes('/')) {
          const [start, step] = part.split('/')
          const s = start === '*' || start === '?' ? min : parseInt(start)
          const st = parseInt(step)
          for (let i = s; i <= max; i += st) result.push(i)
        } else if (part.includes('-')) {
          const [s, e] = part.split('-').map(Number)
          for (let i = s; i <= e; i++) result.push(i)
        } else {
          const v = parseInt(part)
          if (!isNaN(v)) result.push(v)
        }
      })
      return [...new Set(result)].sort((a, b) => a - b)
    }

    try {
      const mins = parseField(minute, 0, 59)
      const hrs = parseField(hour, 0, 23)
      const doms = parseField(dayOfMonth, 1, 31)
      const mons = parseField(month, 1, 12)
      const dows = parseField(dayOfWeek, 0, 6)

      if (mins.length === 60) parts_desc.push('每分钟')
      else if (mins.length <= 10) parts_desc.push(`第 ${mins.join(', ')} 分钟`)

      if (hrs.length === 24) parts_desc.push('每小时')
      else parts_desc.push(`第 ${hrs.join(', ')} 小时`)

      if (doms.length === 31) parts_desc.push('每天')
      else parts_desc.push(`${doms.join(', ')} 日`)

      if (mons.length === 12) parts_desc.push('每月')
      else parts_desc.push(`${mons.join(', ')} 月`)

      if (dows.length === 7) parts_desc.push('每周每天')
      else parts_desc.push(`周${dows.join(', ')}`)

      const desc = parts_desc.join('，')

      const now = new Date()
      const runs: string[] = []
      let cursor = new Date(now)
      cursor.setSeconds(0, 0)
      for (let i = 0; i < 200 && runs.length < 5; i++) {
        cursor.setMinutes(cursor.getMinutes() + 1)
        const m = cursor.getMinutes()
        const h = cursor.getHours()
        const d = cursor.getDate()
        const mo = cursor.getMonth() + 1
        const dw = cursor.getDay()
        if (mins.includes(m) && hrs.includes(h) && doms.includes(d) && mons.includes(mo) && dows.includes(dw)) {
          runs.push(cursor.toLocaleString('zh-CN', { year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit', second: '2-digit' }))
          if (runs.length >= 5) break
        }
      }
      setNextRuns(runs)
      setDescription(desc)
    } catch (e) { setDescription('解析错误: ' + (e as Error).message); setNextRuns([]) }
  }

  React.useEffect(() => { parseCron(expr) }, [expr])

  const presets = [
    { label: '每分钟', value: '* * * * *' },
    { label: '每5分钟', value: '*/5 * * * *' },
    { label: '每小时', value: '0 * * * *' },
    { label: '每天0点', value: '0 0 * * *' },
    { label: '每周一早9点', value: '0 9 * * 1' },
    { label: '每月1号0点', value: '0 0 1 * *' },
  ]

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12, height: '100%' }}>
      <div style={{ display: 'flex', gap: 8 }}>
        <input value={expr} onChange={(e) => setExpr(e.target.value)} placeholder="* * * * *"
          style={{ flex: 1, padding: '10px 12px', background: 'var(--input-bg)', color: 'var(--text-primary)', border: '1px solid var(--window-border)', borderRadius: 8, fontSize: 16, fontFamily: 'monospace', letterSpacing: 2 }} />
      </div>
      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
        {presets.map((p) => (
          <button key={p.value} onClick={() => setExpr(p.value)}
            style={{ padding: '5px 10px', background: 'var(--hover)', color: 'var(--text-primary)', border: 'none', borderRadius: 6, fontSize: 12, cursor: 'pointer' }}>
            {p.label}
          </button>
        ))}
      </div>
      <div style={{ padding: 10, background: 'var(--input-bg)', border: '1px solid var(--window-border)', borderRadius: 8 }}>
        <label style={{ fontSize: 12, color: 'var(--accent)', fontWeight: 600, display: 'block', marginBottom: 4 }}>字段说明</label>
        <div style={{ fontSize: 11, color: 'var(--text-secondary)', fontFamily: 'monospace', lineHeight: 1.6 }}>
          分 (0-59) &nbsp; 时 (0-23) &nbsp; 日 (1-31) &nbsp; 月 (1-12) &nbsp; 周 (0-6)<br />
          <span>* 全部 &nbsp; ? 不指定 &nbsp; , 列表 &nbsp; - 范围 &nbsp; / 步长</span>
        </div>
      </div>
      <div style={{ padding: 10, background: 'var(--input-bg)', border: '1px solid var(--window-border)', borderRadius: 8 }}>
        <label style={{ fontSize: 12, color: 'var(--accent)', fontWeight: 600, display: 'block', marginBottom: 4 }}>解析结果</label>
        <div style={{ fontSize: 13, color: 'var(--text-primary)' }}>{description || '...'}</div>
      </div>
      <div style={{ padding: 10, background: 'var(--input-bg)', border: '1px solid var(--window-border)', borderRadius: 8, flex: 1, overflow: 'auto' }}>
        <label style={{ fontSize: 12, color: 'var(--accent)', fontWeight: 600, display: 'block', marginBottom: 6 }}>最近5次执行时间</label>
        {nextRuns.length === 0 ? (
          <div style={{ color: 'var(--text-secondary)', textAlign: 'center', padding: 16 }}>无计划执行</div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 4, fontFamily: 'monospace', fontSize: 12 }}>
            {nextRuns.map((r, i) => (
              <div key={i} style={{ padding: '4px 8px', background: 'var(--hover)', borderRadius: 4 }}>
                <span style={{ color: 'var(--text-secondary)', marginRight: 8 }}>#{i + 1}</span>{r}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

const DeveloperToolkitPro: React.FC = () => {
  const [activeTab, setActiveTab] = useState<TabKey>('json')

  return (
    <div className="app-shell">
      <div style={{ display: 'flex', borderBottom: '1px solid var(--window-border)', overflowX: 'auto', flexShrink: 0 }}>
        {TABS.map((t) => (
          <button
            key={t.key}
            onClick={() => setActiveTab(t.key)}
            style={{
              padding: '10px 16px',
              background: activeTab === t.key ? 'var(--accent-bg)' : 'transparent',
              color: activeTab === t.key ? 'var(--accent)' : 'var(--text-primary)',
              border: 'none',
              borderBottom: activeTab === t.key ? '2px solid var(--accent)' : '2px solid transparent',
              cursor: 'pointer',
              fontSize: 13,
              fontFamily: 'inherit',
              whiteSpace: 'nowrap',
              display: 'flex',
              alignItems: 'center',
              gap: 6,
              transition: 'background 0.15s',
            }}
          >
            <span>{t.icon}</span>
            <span>{t.label}</span>
          </button>
        ))}
      </div>
      <div style={{ flex: 1, overflow: 'auto', padding: 16 }}>
        {activeTab === 'json' && <JsonTool />}
        {activeTab === 'base64' && <Base64Tool />}
        {activeTab === 'url' && <UrlTool />}
        {activeTab === 'hash' && <HashTool />}
        {activeTab === 'uuid' && <UuidTool />}
        {activeTab === 'timestamp' && <TimestampTool />}
        {activeTab === 'color' && <ColorTool />}
        {activeTab === 'regex' && <RegexTool />}
        {activeTab === 'jwt' && <JwtTool />}
        {activeTab === 'cron' && <CronTool />}
      </div>
    </div>
  )
}

export default DeveloperToolkitPro
export { decodeJWT, cronToHumanReadable, getNextCronTimes, CRON_PRESETS }
