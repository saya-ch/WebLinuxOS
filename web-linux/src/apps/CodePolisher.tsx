import { useState, useCallback, useMemo } from 'react'
import {
  Code,
  Wand2,
  Copy,
  Check,
  Download,
  GitCompare,
  Ruler,
  FileJson,
  Braces,
  Hash,
  Sparkles,
  Minimize2,
  Trash2,
  FileCode,
  Type,
} from 'lucide-react'

type Language = 'javascript' | 'json' | 'html' | 'css' | 'sql' | 'xml'
type IndentStyle = 'space2' | 'space4' | 'tab'
type Mode = 'format' | 'minify'

interface LanguageDef {
  key: Language
  label: string
  icon: React.ReactNode
  example: string
}

const LANGUAGES: LanguageDef[] = [
  {
    key: 'javascript',
    label: 'JavaScript',
    icon: <FileCode className="cp-lang-icon" />,
    example: `function fibonacci(n){if(n<=1)return n;let a=0,b=1;for(let i=2;i<=n;i++){let c=a+b;a=b;b=c;}return b;}const result=fibonacci(10);console.log("fib(10)=",result);`,
  },
  {
    key: 'json',
    label: 'JSON',
    icon: <FileJson className="cp-lang-icon" />,
    example: `{"name":"WebLinuxOS","version":"3.0.0","features":["terminal","filemanager","apps"],"config":{"theme":"dark","language":"zh-CN","shortcuts":{"ctrl":["c","v","x"]}},"stats":{"users":10000,"active":4500,"rating":4.8}}`,
  },
  {
    key: 'html',
    label: 'HTML',
    icon: <Code className="cp-lang-icon" />,
    example: `<!DOCTYPE html><html lang="zh-CN"><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"><title>WebLinuxOS</title><link rel="stylesheet" href="style.css"></head><body><div class="container"><header><h1>欢迎使用 WebLinuxOS</h1><p>一个运行在浏览器中的操作系统</p></header><main><section class="features"><h2>核心功能</h2><ul><li>终端模拟器</li><li>文件管理</li><li>应用中心</li></ul></section></main><footer><p>&copy; 2024 WebLinuxOS</p></footer></div><script src="app.js"></script></body></html>`,
  },
  {
    key: 'css',
    label: 'CSS',
    icon: <Braces className="cp-lang-icon" />,
    example: `body{font-family:"Segoe UI",Roboto,sans-serif;margin:0;padding:0;background:linear-gradient(135deg,#0f0c29,#302b63);color:#e0e0e0;min-height:100vh;display:flex;align-items:center;justify-content:center;}.container{max-width:1200px;margin:0 auto;padding:20px;}.card{background:rgba(255,255,255,0.08);backdrop-filter:blur(10px);border-radius:16px;padding:24px;border:1px solid rgba(255,255,255,0.12);box-shadow:0 8px 32px rgba(0,0,0,0.2);}.btn{padding:12px 24px;border-radius:8px;border:none;cursor:pointer;font-weight:600;transition:all 0.3s ease;}.btn-primary{background:linear-gradient(135deg,#667eea,#764ba2);color:white;}.btn-primary:hover{transform:translateY(-2px);box-shadow:0 8px 25px rgba(102,126,234,0.4);}@media(max-width:768px){.container{padding:12px;}.card{padding:16px;}}`,
  },
  {
    key: 'sql',
    label: 'SQL',
    icon: <Hash className="cp-lang-icon" />,
    example: `select u.id,u.name,u.email,count(o.id) as order_count,sum(o.total) as total_spent from users u left join orders o on u.id=o.user_id where u.status='active' and o.total>100 and u.created_at>='2024-01-01' group by u.id,u.name,u.email having count(o.id)>5 order by total_spent desc limit 50;`,
  },
  {
    key: 'xml',
    label: 'XML',
    icon: <FileCode className="cp-lang-icon" />,
    example: `<?xml version="1.0" encoding="UTF-8"?><root><product id="001" category="electronics"><name>智能手表</name><price currency="CNY">1299.00</price><stock>50</stock><specs><color>黑色</color><size>42mm</size><weight>32g</weight></specs><tags><tag>新品</tag><tag>热销</tag></tags></product><product id="002" category="accessories"><name>无线耳机</name><price currency="CNY">599.00</price><stock>200</stock><specs><color>白色</color><size>Standard</size><weight>5g</weight></specs><tags><tag>促销</tag></tags></product></root>`,
  },
]

const INDENT_MAP: Record<IndentStyle, string> = {
  space2: '  ',
  space4: '    ',
  tab: '\t',
}

function getIndent(style: IndentStyle): string {
  return INDENT_MAP[style]
}

function estimateGzipSize(input: string): number {
  if (!input) return 0
  const utf8Bytes = new TextEncoder().encode(input).length
  let uniqueChars = new Set<string>()
  let repetitions = 0
  for (let i = 0; i < input.length; i++) {
    const ch = input[i]
    uniqueChars.add(ch)
    if (i > 0 && input[i] === input[i - 1]) repetitions++
  }
  const ratio = 0.25 + (uniqueChars.size / Math.max(input.length, 1)) * 0.35 + Math.min(repetitions / Math.max(input.length, 1), 0.3) * 0.15
  return Math.max(Math.round(utf8Bytes * Math.max(ratio, 0.15)), Math.round(utf8Bytes * 0.1))
}

function formatJSON(input: string, indent: string, minify: boolean): string {
  if (!input.trim()) return ''
  const parsed = JSON.parse(input)
  if (minify) return JSON.stringify(parsed)
  const indentSize = indent === '\t' ? '\t' : indent.length
  return JSON.stringify(parsed, null, indentSize)
}

function minifyJSON(input: string): string {
  if (!input.trim()) return ''
  return JSON.stringify(JSON.parse(input))
}

function formatJS(input: string, indent: string): string {
  if (!input.trim()) return ''
  const cleaned = input.replace(/\r\n/g, '\n')
  const result: string[] = []
  let level = 0
  let inString: string | null = null
  let inLineComment = false
  let inBlockComment = false
  let i = 0

  const currentIndent = () => indent.repeat(Math.max(level, 0))

  while (i < cleaned.length) {
    const ch = cleaned[i]
    const next = cleaned[i + 1]

    if (inLineComment) {
      result.push(ch)
      if (ch === '\n') {
        inLineComment = false
        result.push(currentIndent())
      }
      i++
      continue
    }

    if (inBlockComment) {
      result.push(ch)
      if (ch === '*' && next === '/') {
        result.push('/')
        inBlockComment = false
        i += 2
        continue
      }
      i++
      continue
    }

    if (inString) {
      result.push(ch)
      if (ch === '\\' && i + 1 < cleaned.length) {
        result.push(cleaned[i + 1])
        i += 2
        continue
      }
      if (ch === inString) inString = null
      i++
      continue
    }

    if (ch === '/' && next === '/') {
      inLineComment = true
      result.push('//')
      i += 2
      continue
    }

    if (ch === '/' && next === '*') {
      inBlockComment = true
      result.push('/*')
      i += 2
      continue
    }

    if (ch === '"' || ch === "'" || ch === '`') {
      inString = ch
      result.push(ch)
      i++
      continue
    }

    if (ch === '{') {
      result.push('{')
      level++
      i++
      continue
    }

    if (ch === '}') {
      level = Math.max(0, level - 1)
      if (result.length > 0 && result[result.length - 1].trim() !== '') {
        result.push('\n')
        result.push(currentIndent())
      } else {
        result.push(currentIndent())
      }
      result.push('}')
      i++
      if (i < cleaned.length) {
        const nxt = cleaned[i]
        if (nxt === ',' || nxt === ';' || nxt === ')' || nxt === ']') {
          result.push(nxt)
          i++
        }
        result.push('\n' + currentIndent())
      }
      continue
    }

    if (ch === ';') {
      result.push(';')
      i++
      while (i < cleaned.length && (cleaned[i] === ' ' || cleaned[i] === '\t')) i++
      if (i < cleaned.length && cleaned[i] !== '\n') {
        result.push('\n' + currentIndent())
      }
      continue
    }

    if (ch === ',') {
      result.push(',')
      i++
      while (i < cleaned.length && (cleaned[i] === ' ' || cleaned[i] === '\t' || cleaned[i] === '\n')) i++
      if (i < cleaned.length && cleaned[i] !== '\n') {
        result.push('\n' + currentIndent())
      }
      continue
    }

    if (ch === '\n') {
      result.push('\n')
      i++
      while (i < cleaned.length && (cleaned[i] === ' ' || cleaned[i] === '\t' || cleaned[i] === '\n')) i++
      if (i < cleaned.length) result.push(currentIndent())
      continue
    }

    result.push(ch)
    i++
  }

  return result.join('').replace(/[ \t]+$/gm, '').replace(/\n{3,}/g, '\n\n')
}

function minifyJS(input: string): string {
  if (!input.trim()) return ''
  const cleaned = input.replace(/\r\n/g, '\n')
  let result = ''
  let inString: string | null = null
  let inLineComment = false
  let inBlockComment = false
  let prev = ''

  for (let i = 0; i < cleaned.length; i++) {
    const ch = cleaned[i]
    const next = cleaned[i + 1]

    if (inLineComment) {
      if (ch === '\n') inLineComment = false
      continue
    }
    if (inBlockComment) {
      if (ch === '*' && next === '/') {
        inBlockComment = false
        i++
      }
      continue
    }

    if (inString) {
      result += ch
      if (ch === '\\' && i + 1 < cleaned.length) {
        result += cleaned[i + 1]
        i++
      } else if (ch === inString) {
        inString = null
      }
      prev = ch
      continue
    }

    if (ch === '/' && next === '/') {
      inLineComment = true
      i++
      continue
    }
    if (ch === '/' && next === '*') {
      inBlockComment = true
      i++
      continue
    }

    if (ch === '"' || ch === "'" || ch === '`') {
      inString = ch
      result += ch
      prev = ch
      continue
    }

    if (ch === '\n' || ch === '\r') {
      if (/[a-zA-Z0-9_$]/.test(prev) && /[a-zA-Z0-9_$]/.test(next || '')) {
        result += ' '
      }
      continue
    }

    if (ch === ' ' || ch === '\t') {
      if (/[a-zA-Z0-9_$]/.test(prev) && /[a-zA-Z0-9_$]/.test(next || '')) {
        result += ' '
      }
      continue
    }

    result += ch
    prev = ch
  }

  return result
}

function formatHTML(input: string, indent: string): string {
  if (!input.trim()) return ''
  const cleaned = input.replace(/\r\n/g, '').replace(/>\s+</g, '><').trim()
  const tokens = cleaned.split(/(<[^>]+>)/g).filter(t => t.length > 0)

  const voidElements = new Set(['area', 'base', 'br', 'col', 'embed', 'hr', 'img', 'input', 'link', 'meta', 'param', 'source', 'track', 'wbr'])
  const result: string[] = []
  let level = 0
  let inPre = false

  for (const token of tokens) {
    if (!token.startsWith('<')) {
      if (inPre) {
        result.push(token)
      } else {
        const text = token.trim()
        if (text) {
          result.push(indent.repeat(level) + text)
        }
      }
      continue
    }

    if (token.startsWith('<!')) {
      result.push(indent.repeat(level) + token)
      continue
    }

    if (token.startsWith('<?')) {
      result.push(indent.repeat(level) + token)
      continue
    }

    if (token.startsWith('<!--')) {
      result.push(indent.repeat(level) + token)
      continue
    }

    if (token.startsWith('</')) {
      level = Math.max(0, level - 1)
      result.push(indent.repeat(level) + token)
      continue
    }

    const tagMatch = token.match(/^<\s*([a-zA-Z][\w-]*)/)
    const tagName = tagMatch ? tagMatch[1].toLowerCase() : ''

    if (token.endsWith('/>') || voidElements.has(tagName)) {
      result.push(indent.repeat(level) + token)
      continue
    }

    if (tagName === 'pre' || tagName === 'textarea' || tagName === 'code') {
      inPre = true
      result.push(indent.repeat(level) + token)
      level++
      continue
    }

    result.push(indent.repeat(level) + token)
    level++
  }

  return result.join('\n').replace(/[ \t]+$/gm, '')
}

function minifyHTML(input: string): string {
  if (!input.trim()) return ''
  return input
    .replace(/\r?\n/g, '')
    .replace(/>\s+</g, '><')
    .replace(/\s{2,}/g, ' ')
    .replace(/<!--[\s\S]*?-->/g, '')
    .trim()
}

function formatCSS(input: string, indent: string): string {
  if (!input.trim()) return ''
  const cleaned = input.replace(/\r\n/g, '\n')
  const result: string[] = []
  let level = 0
  let i = 0

  while (i < cleaned.length) {
    const ch = cleaned[i]

    if (ch === '{') {
      const before = result.join('').trimEnd()
      if (before && !before.endsWith('\n')) result.push('\n')
      result.push('{\n')
      level++
      result.push(indent.repeat(level))
      i++
      while (i < cleaned.length && (cleaned[i] === ' ' || cleaned[i] === '\t' || cleaned[i] === '\n')) i++
      continue
    }

    if (ch === '}') {
      level = Math.max(0, level - 1)
      if (result[result.length - 1] !== '\n') result.push('\n')
      result.push(indent.repeat(level) + '}\n')
      i++
      while (i < cleaned.length && (cleaned[i] === ' ' || cleaned[i] === '\t' || cleaned[i] === '\n')) i++
      if (i < cleaned.length) result.push(indent.repeat(level))
      continue
    }

    if (ch === ';') {
      result.push(';\n')
      i++
      while (i < cleaned.length && (cleaned[i] === ' ' || cleaned[i] === '\t' || cleaned[i] === '\n')) i++
      if (i < cleaned.length && cleaned[i] !== '}') result.push(indent.repeat(level))
      continue
    }

    if (ch === '\n') {
      i++
      while (i < cleaned.length && (cleaned[i] === ' ' || cleaned[i] === '\t' || cleaned[i] === '\n')) i++
      if (i < cleaned.length && cleaned[i] !== '}') {
        const last = result[result.length - 1] || ''
        if (!last.endsWith(indent.repeat(level))) {
          result.push(indent.repeat(level))
        }
      }
      continue
    }

    result.push(ch)
    i++
  }

  return result.join('').replace(/[ \t]+$/gm, '').replace(/\n{3,}/g, '\n\n')
}

function minifyCSS(input: string): string {
  if (!input.trim()) return ''
  return input
    .replace(/\r?\n/g, '')
    .replace(/\s+/g, ' ')
    .replace(/\s*([{}:;,])\s*/g, '$1')
    .replace(/;}/g, '}')
    .replace(/\/\*[\s\S]*?\*\//g, '')
    .trim()
}

function formatSQL(input: string, indent: string): string {
  if (!input.trim()) return ''
  const sql = input.trim().replace(/\s+/g, ' ')
  const keywords = [
    'SELECT', 'FROM', 'WHERE', 'AND', 'OR', 'ON', 'JOIN', 'LEFT JOIN',
    'RIGHT JOIN', 'INNER JOIN', 'OUTER JOIN', 'GROUP BY', 'ORDER BY',
    'HAVING', 'LIMIT', 'OFFSET', 'INSERT INTO', 'VALUES', 'UPDATE',
    'SET', 'DELETE FROM', 'CREATE TABLE', 'ALTER TABLE', 'DROP TABLE',
    'INDEX', 'UNIQUE', 'PRIMARY KEY', 'FOREIGN KEY', 'REFERENCES',
    'DEFAULT', 'NOT NULL', 'CHECK', 'IN', 'BETWEEN', 'LIKE', 'AS',
    'ASC', 'DESC', 'DISTINCT', 'UNION', 'CASE', 'WHEN', 'THEN', 'ELSE', 'END',
  ]

  let result = sql
  for (const kw of keywords.sort((a, b) => b.length - a.length)) {
    const re = new RegExp(`\\b${kw}\\b`, 'gi')
    result = result.replace(re, kw)
  }

  const formatted: string[] = []
  let remaining = result
  let first = true

  const clauseRegex = /\b(SELECT|FROM|WHERE|GROUP\s+BY|ORDER\s+BY|HAVING|LIMIT|OFFSET)\b/i

  while (remaining.length > 0) {
    const match = remaining.match(clauseRegex)
    if (!match || match.index === undefined) {
      formatted.push(remaining.trim())
      break
    }

    if (match.index > 0) {
      const prefix = remaining.substring(0, match.index).trim()
      if (prefix) formatted.push(prefix)
    }

    const clauseName = match[1].toUpperCase().replace(/\s+/g, ' ')
    const afterClause = remaining.substring(match.index + match[0].length)

    let nextClauseIdx = -1
    const nextMatch = afterClause.match(clauseRegex)
    if (nextMatch && nextMatch.index !== undefined) {
      nextClauseIdx = nextMatch.index
    }

    const clauseBody = nextClauseIdx >= 0
      ? afterClause.substring(0, nextClauseIdx).trim()
      : afterClause.trim()

    if (first) {
      formatted.push(`${clauseName} ${clauseBody}`)
      first = false
    } else {
      formatted.push(`${indent}${clauseName} ${clauseBody}`)
    }

    const keywordIndex = match.index + match[0].length + (nextClauseIdx >= 0 ? nextClauseIdx : afterClause.length)
    remaining = remaining.substring(keywordIndex)
  }

  return formatted.join('\n')
}

function minifySQL(input: string): string {
  if (!input.trim()) return ''
  return input.replace(/\s+/g, ' ').trim()
}

function formatXML(input: string, indent: string): string {
  if (!input.trim()) return ''
  const cleaned = input.replace(/\r\n/g, '').replace(/>\s+</g, '><').trim()
  const tokens = cleaned.split(/(<[^>]+>)/g).filter(t => t.length > 0)

  const voidElements = new Set(['area', 'base', 'br', 'col', 'embed', 'hr', 'img', 'input', 'link', 'meta', 'param', 'source', 'track', 'wbr'])
  const result: string[] = []
  let level = 0

  for (const token of tokens) {
    if (!token.startsWith('<')) {
      const text = token.trim()
      if (text) result.push(indent.repeat(level) + text)
      continue
    }

    if (token.startsWith('<?') || token.startsWith('<!') || token.startsWith('<!--')) {
      result.push(indent.repeat(level) + token)
      continue
    }

    if (token.startsWith('</')) {
      level = Math.max(0, level - 1)
      result.push(indent.repeat(level) + token)
      continue
    }

    const tagMatch = token.match(/^<\s*([a-zA-Z][\w:-]*)/)
    const tagName = tagMatch ? tagMatch[1].toLowerCase() : ''

    if (token.endsWith('/>') || voidElements.has(tagName)) {
      result.push(indent.repeat(level) + token)
      continue
    }

    result.push(indent.repeat(level) + token)
    level++
  }

  return result.join('\n').replace(/[ \t]+$/gm, '')
}

function minifyXML(input: string): string {
  if (!input.trim()) return ''
  return input
    .replace(/\r?\n/g, '')
    .replace(/>\s+</g, '><')
    .replace(/\s{2,}/g, ' ')
    .replace(/<!--[\s\S]*?-->/g, '')
    .trim()
}

const formatters: Record<Language, (input: string, indent: string) => string> = {
  javascript: formatJS,
  json: (input, indent) => formatJSON(input, indent, false),
  html: formatHTML,
  css: formatCSS,
  sql: formatSQL,
  xml: formatXML,
}

const minifiers: Record<Language, (input: string) => string> = {
  javascript: minifyJS,
  json: minifyJSON,
  html: minifyHTML,
  css: minifyCSS,
  sql: minifySQL,
  xml: minifyXML,
}

function formatWithLanguage(input: string, lang: Language, indent: string): string {
  try {
    return formatters[lang](input, indent)
  } catch (e) {
    throw new Error(`${labelForLang(lang)} 格式化错误: ${e instanceof Error ? e.message : String(e)}`)
  }
}

function minifyWithLanguage(input: string, lang: Language): string {
  try {
    return minifiers[lang](input)
  } catch (e) {
    throw new Error(`${labelForLang(lang)} 压缩错误: ${e instanceof Error ? e.message : String(e)}`)
  }
}

function labelForLang(lang: Language): string {
  return LANGUAGES.find(l => l.key === lang)?.label || lang
}

const styles = `
.cp-root {
  --cp-bg-primary: rgba(15, 15, 25, 0.85);
  --cp-bg-secondary: rgba(25, 25, 40, 0.65);
  --cp-bg-tertiary: rgba(35, 35, 55, 0.55);
  --cp-border: rgba(255, 255, 255, 0.1);
  --cp-border-strong: rgba(255, 255, 255, 0.18);
  --cp-text-primary: rgba(232, 232, 240, 0.95);
  --cp-text-secondary: rgba(232, 232, 240, 0.65);
  --cp-text-muted: rgba(232, 232, 240, 0.4);
  --cp-accent: #7c6cf0;
  --cp-accent-hover: #9484e0;
  --cp-accent-glow: rgba(124, 108, 240, 0.35);
  --cp-success: #4ade80;
  --cp-success-glow: rgba(74, 222, 128, 0.35);
  --cp-warning: #fbbf24;
  --cp-danger: #f87171;
  --cp-gradient-primary: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  --cp-gradient-success: linear-gradient(135deg, #11998e 0%, #38ef7d 100%);
  --cp-gradient-warn: linear-gradient(135deg, #f093fb 0%, #f5576c 100%);
  --cp-radius-sm: 8px;
  --cp-radius-md: 12px;
  --cp-radius-lg: 16px;
  --cp-shadow-glass: 0 8px 32px rgba(0, 0, 0, 0.3);
  --cp-shadow-soft: 0 4px 16px rgba(0, 0, 0, 0.2);

  height: 100%;
  display: flex;
  flex-direction: column;
  background: linear-gradient(135deg, #0f0c29 0%, #1a1640 50%, #24243e 100%);
  color: var(--cp-text-primary);
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
  overflow: hidden;
}

.cp-header {
  display: flex;
  align-items: center;
  gap: 14px;
  padding: 16px 20px;
  background: var(--cp-bg-secondary);
  backdrop-filter: blur(20px);
  -webkit-backdrop-filter: blur(20px);
  border-bottom: 1px solid var(--cp-border);
  flex-shrink: 0;
}

.cp-header-icon {
  width: 42px;
  height: 42px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: var(--cp-radius-md);
  background: var(--cp-gradient-primary);
  box-shadow: 0 4px 16px var(--cp-accent-glow);
  color: white;
}

.cp-header-info {
  flex: 1;
  min-width: 0;
}

.cp-header-title {
  font-size: 18px;
  font-weight: 700;
  letter-spacing: -0.02em;
  display: flex;
  align-items: center;
  gap: 8px;
}

.cp-header-subtitle {
  font-size: 12px;
  color: var(--cp-text-secondary);
  margin-top: 2px;
}

.cp-toolbar {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 10px;
  padding: 14px 20px;
  background: var(--cp-bg-tertiary);
  backdrop-filter: blur(12px);
  -webkit-backdrop-filter: blur(12px);
  border-bottom: 1px solid var(--cp-border);
  flex-shrink: 0;
}

.cp-lang-group {
  display: flex;
  gap: 4px;
  padding: 4px;
  background: rgba(0, 0, 0, 0.25);
  border-radius: var(--cp-radius-sm);
  border: 1px solid var(--cp-border);
}

.cp-lang-btn {
  display: flex;
  align-items: center;
  gap: 5px;
  padding: 7px 13px;
  border-radius: 6px;
  border: none;
  background: transparent;
  color: var(--cp-text-secondary);
  font-size: 12px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s ease;
  white-space: nowrap;
  font-family: inherit;
}

.cp-lang-btn:hover {
  color: var(--cp-text-primary);
  background: rgba(255, 255, 255, 0.05);
}

.cp-lang-btn.active {
  background: var(--cp-gradient-primary);
  color: white;
  box-shadow: 0 2px 8px var(--cp-accent-glow);
}

.cp-lang-icon {
  width: 14px;
  height: 14px;
}

.cp-separator {
  width: 1px;
  height: 24px;
  background: var(--cp-border);
}

.cp-indent-group {
  display: flex;
  gap: 4px;
  padding: 4px;
  background: rgba(0, 0, 0, 0.25);
  border-radius: var(--cp-radius-sm);
  border: 1px solid var(--cp-border);
}

.cp-indent-btn {
  display: flex;
  align-items: center;
  gap: 4px;
  padding: 6px 11px;
  border-radius: 6px;
  border: none;
  background: transparent;
  color: var(--cp-text-secondary);
  font-size: 12px;
  cursor: pointer;
  transition: all 0.2s ease;
  font-family: inherit;
  font-weight: 500;
}

.cp-indent-btn:hover {
  color: var(--cp-text-primary);
  background: rgba(255, 255, 255, 0.05);
}

.cp-indent-btn.active {
  background: rgba(124, 108, 240, 0.25);
  color: var(--cp-accent-hover);
}

.cp-action-group {
  display: flex;
  gap: 8px;
  margin-left: auto;
}

.cp-btn {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 8px 14px;
  border-radius: var(--cp-radius-sm);
  border: 1px solid var(--cp-border);
  background: var(--cp-bg-tertiary);
  color: var(--cp-text-primary);
  font-size: 12px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s ease;
  font-family: inherit;
  white-space: nowrap;
}

.cp-btn:hover {
  background: rgba(255, 255, 255, 0.08);
  border-color: var(--cp-border-strong);
  transform: translateY(-1px);
}

.cp-btn:active {
  transform: translateY(0);
}

.cp-btn-primary {
  background: var(--cp-gradient-primary);
  border: none;
  box-shadow: 0 2px 12px var(--cp-accent-glow);
}

.cp-btn-primary:hover {
  box-shadow: 0 4px 20px var(--cp-accent-glow);
  transform: translateY(-1px);
}

.cp-btn-success {
  background: var(--cp-gradient-success);
  border: none;
  color: white;
  box-shadow: 0 2px 12px var(--cp-success-glow);
}

.cp-btn-success:hover {
  box-shadow: 0 4px 20px var(--cp-success-glow);
}

.cp-btn-danger {
  color: var(--cp-danger);
}

.cp-btn-danger:hover {
  background: rgba(248, 113, 113, 0.12);
  border-color: rgba(248, 113, 113, 0.3);
}

.cp-btn-icon {
  width: 14px;
  height: 14px;
}

.cp-main {
  flex: 1;
  display: flex;
  gap: 16px;
  padding: 16px 20px;
  min-height: 0;
  overflow: hidden;
}

.cp-editor-panel {
  flex: 1;
  display: flex;
  flex-direction: column;
  background: var(--cp-bg-primary);
  backdrop-filter: blur(16px);
  -webkit-backdrop-filter: blur(16px);
  border: 1px solid var(--cp-border);
  border-radius: var(--cp-radius-lg);
  overflow: hidden;
  min-width: 0;
}

.cp-panel-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 10px 16px;
  background: var(--cp-bg-secondary);
  border-bottom: 1px solid var(--cp-border);
  flex-shrink: 0;
}

.cp-panel-title {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 13px;
  font-weight: 600;
  color: var(--cp-text-primary);
}

.cp-panel-title-icon {
  width: 16px;
  height: 16px;
  color: var(--cp-accent);
}

.cp-panel-actions {
  display: flex;
  gap: 6px;
}

.cp-icon-btn {
  width: 28px;
  height: 28px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 6px;
  border: none;
  background: transparent;
  color: var(--cp-text-secondary);
  cursor: pointer;
  transition: all 0.2s ease;
}

.cp-icon-btn:hover {
  background: rgba(255, 255, 255, 0.08);
  color: var(--cp-text-primary);
}

.cp-icon-btn.copied {
  color: var(--cp-success);
  background: rgba(74, 222, 128, 0.12);
}

.cp-textarea {
  flex: 1;
  width: 100%;
  padding: 16px;
  background: transparent;
  border: none;
  outline: none;
  color: var(--cp-text-primary);
  font-family: 'JetBrains Mono', 'Fira Code', 'Consolas', monospace;
  font-size: 13px;
  line-height: 1.6;
  resize: none;
  tab-size: 2;
  overflow: auto;
}

.cp-textarea::placeholder {
  color: var(--cp-text-muted);
}

.cp-textarea::-webkit-scrollbar,
.cp-output::-webkit-scrollbar {
  width: 8px;
  height: 8px;
}

.cp-textarea::-webkit-scrollbar-track,
.cp-output::-webkit-scrollbar-track {
  background: transparent;
}

.cp-textarea::-webkit-scrollbar-thumb,
.cp-output::-webkit-scrollbar-thumb {
  background: rgba(255, 255, 255, 0.15);
  border-radius: 4px;
}

.cp-textarea::-webkit-scrollbar-thumb:hover,
.cp-output::-webkit-scrollbar-thumb:hover {
  background: rgba(255, 255, 255, 0.25);
}

.cp-output {
  flex: 1;
  padding: 16px;
  background: rgba(0, 0, 0, 0.2);
  color: var(--cp-text-primary);
  font-family: 'JetBrains Mono', 'Fira Code', 'Consolas', monospace;
  font-size: 13px;
  line-height: 1.6;
  overflow: auto;
  white-space: pre;
  tab-size: 2;
  margin: 0;
}

.cp-footer {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px 20px;
  background: var(--cp-bg-secondary);
  backdrop-filter: blur(12px);
  -webkit-backdrop-filter: blur(12px);
  border-top: 1px solid var(--cp-border);
  flex-shrink: 0;
  flex-wrap: wrap;
}

.cp-stat {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 6px 12px;
  background: rgba(0, 0, 0, 0.25);
  border-radius: var(--cp-radius-sm);
  border: 1px solid var(--cp-border);
  font-size: 12px;
}

.cp-stat-icon {
  width: 13px;
  height: 13px;
  color: var(--cp-accent);
}

.cp-stat-label {
  color: var(--cp-text-muted);
}

.cp-stat-value {
  color: var(--cp-text-primary);
  font-weight: 600;
  font-variant-numeric: tabular-nums;
}

.cp-stat-value.success {
  color: var(--cp-success);
}

.cp-stat-value.warning {
  color: var(--cp-warning);
}

.cp-stat-value.danger {
  color: var(--cp-danger);
}

.cp-compare-group {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-left: auto;
  padding: 6px 14px;
  background: rgba(0, 0, 0, 0.3);
  border-radius: var(--cp-radius-sm);
  border: 1px solid var(--cp-border);
}

.cp-compare-label {
  display: flex;
  align-items: center;
  gap: 4px;
  font-size: 11px;
  color: var(--cp-text-muted);
  text-transform: uppercase;
  letter-spacing: 0.05em;
}

.cp-compare-value {
  font-size: 13px;
  font-weight: 700;
  font-variant-numeric: tabular-nums;
}

.cp-compare-value.positive {
  color: var(--cp-success);
}

.cp-compare-value.negative {
  color: var(--cp-danger);
}

.cp-compare-value.neutral {
  color: var(--cp-text-secondary);
}

.cp-error-bar {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 10px 16px;
  background: rgba(248, 113, 113, 0.1);
  border-top: 1px solid rgba(248, 113, 113, 0.3);
  color: var(--cp-danger);
  font-size: 12px;
  flex-shrink: 0;
  backdrop-filter: blur(12px);
}

.cp-error-icon {
  width: 16px;
  height: 16px;
  flex-shrink: 0;
}

.cp-error-text {
  flex: 1;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.cp-mode-group {
  display: flex;
  gap: 4px;
  padding: 4px;
  background: rgba(0, 0, 0, 0.25);
  border-radius: var(--cp-radius-sm);
  border: 1px solid var(--cp-border);
}

.cp-mode-btn {
  display: flex;
  align-items: center;
  gap: 5px;
  padding: 7px 13px;
  border-radius: 6px;
  border: none;
  background: transparent;
  color: var(--cp-text-secondary);
  font-size: 12px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s ease;
  font-family: inherit;
}

.cp-mode-btn:hover {
  color: var(--cp-text-primary);
  background: rgba(255, 255, 255, 0.05);
}

.cp-mode-btn.active {
  background: var(--cp-gradient-primary);
  color: white;
  box-shadow: 0 2px 8px var(--cp-accent-glow);
}

.cp-empty-output {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  height: 100%;
  color: var(--cp-text-muted);
  gap: 10px;
  font-size: 13px;
}

.cp-empty-output-icon {
  width: 40px;
  height: 40px;
  opacity: 0.5;
}

.cp-toast {
  position: absolute;
  top: 20px;
  right: 20px;
  padding: 10px 16px;
  background: var(--cp-gradient-success);
  color: white;
  border-radius: var(--cp-radius-sm);
  font-size: 13px;
  font-weight: 600;
  display: flex;
  align-items: center;
  gap: 8px;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.3);
  z-index: 1000;
  animation: cp-toast-in 0.3s ease;
}

@keyframes cp-toast-in {
  from {
    opacity: 0;
    transform: translateY(-10px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

@media (max-width: 768px) {
  .cp-main {
    flex-direction: column;
  }
  .cp-editor-panel {
    min-height: 250px;
  }
  .cp-action-group {
    margin-left: 0;
    width: 100%;
  }
  .cp-compare-group {
    margin-left: 0;
    width: 100%;
    justify-content: center;
  }
}
`

function CodePolisher() {
  const [input, setInput] = useState(LANGUAGES[0].example)
  const [output, setOutput] = useState('')
  const [language, setLanguage] = useState<Language>('javascript')
  const [indentStyle, setIndentStyle] = useState<IndentStyle>('space2')
  const [mode, setMode] = useState<Mode>('format')
  const [error, setError] = useState<string | null>(null)
  const [copied, setCopied] = useState(false)

  const currentIndent = useMemo(() => getIndent(indentStyle), [indentStyle])

  const stats = useMemo(() => {
    const inputSize = new TextEncoder().encode(input).length
    const outputSize = new TextEncoder().encode(output).length
    const inputLines = input ? input.split('\n').length : 0
    const outputLines = output ? output.split('\n').length : 0
    const inputGzip = estimateGzipSize(input)
    const outputGzip = estimateGzipSize(output)
    const sizeDelta = outputSize - inputSize
    const sizeDeltaPercent = inputSize > 0 ? ((sizeDelta / inputSize) * 100).toFixed(1) : '0.0'
    const gzipDelta = outputGzip - inputGzip

    return {
      inputSize,
      outputSize,
      inputLines,
      outputLines,
      inputGzip,
      outputGzip,
      sizeDelta,
      sizeDeltaPercent,
      gzipDelta,
      charCount: input.length,
    }
  }, [input, output])

  const handleFormat = useCallback(() => {
    if (!input.trim()) {
      setOutput('')
      setError(null)
      return
    }
    try {
      const result = mode === 'format'
        ? formatWithLanguage(input, language, currentIndent)
        : minifyWithLanguage(input, language)
      setOutput(result)
      setError(null)
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e)
      setError(msg)
      setOutput('')
    }
  }, [input, language, currentIndent, mode])

  const handleCopy = useCallback(() => {
    if (!output) return
    navigator.clipboard.writeText(output).then(() => {
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    })
  }, [output])

  const handleDownload = useCallback(() => {
    if (!output) return
    const extMap: Record<Language, string> = {
      javascript: 'js',
      json: 'json',
      html: 'html',
      css: 'css',
      sql: 'sql',
      xml: 'xml',
    }
    const blob = new Blob([output], { type: 'text/plain;charset=utf-8' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `polished-code.${extMap[language]}`
    a.click()
    URL.revokeObjectURL(url)
  }, [output, language])

  const handleClear = useCallback(() => {
    setInput('')
    setOutput('')
    setError(null)
  }, [])

  const handleLoadExample = useCallback(() => {
    const lang = LANGUAGES.find(l => l.key === language)
    if (lang) {
      setInput(lang.example)
      setOutput('')
      setError(null)
    }
  }, [language])

  const handleLanguageChange = useCallback((lang: Language) => {
    setLanguage(lang)
    const def = LANGUAGES.find(l => l.key === lang)
    if (def) {
      setInput(def.example)
      setOutput('')
      setError(null)
    }
  }, [])

  const swapIO = useCallback(() => {
    if (!output) return
    setInput(output)
    setOutput('')
    setError(null)
  }, [output])

  const getDeltaClass = () => {
    const val = parseFloat(stats.sizeDeltaPercent)
    if (val > 0.5) return 'positive'
    if (val < -0.5) return 'negative'
    return 'neutral'
  }

  const getDeltaSymbol = () => {
    const val = parseFloat(stats.sizeDeltaPercent)
    if (val > 0.5) return '+'
    return ''
  }

  return (
    <div className="cp-root">
      <style>{styles}</style>

      <div className="cp-header">
        <div className="cp-header-icon">
          <Sparkles className="w-5 h-5" />
        </div>
        <div className="cp-header-info">
          <div className="cp-header-title">
            代码整形台
            <span style={{ fontSize: 12, color: 'var(--cp-text-secondary)', fontWeight: 400 }}>
              CodePolisher
            </span>
          </div>
          <div className="cp-header-subtitle">
            格式化 · 压缩 · 对比 · 一键复制
          </div>
        </div>
      </div>

      <div className="cp-toolbar">
        <div className="cp-lang-group">
          {LANGUAGES.map(lang => (
            <button
              key={lang.key}
              className={`cp-lang-btn ${language === lang.key ? 'active' : ''}`}
              onClick={() => handleLanguageChange(lang.key)}
              title={lang.label}
            >
              {lang.icon}
              <span>{lang.label}</span>
            </button>
          ))}
        </div>

        <div className="cp-separator" />

        <div className="cp-mode-group">
          <button
            className={`cp-mode-btn ${mode === 'format' ? 'active' : ''}`}
            onClick={() => setMode('format')}
            title="格式化/美化"
          >
            <Wand2 className="w-3.5 h-3.5" />
            <span>美化</span>
          </button>
          <button
            className={`cp-mode-btn ${mode === 'minify' ? 'active' : ''}`}
            onClick={() => setMode('minify')}
            title="压缩/Minify"
          >
            <Minimize2 className="w-3.5 h-3.5" />
            <span>压缩</span>
          </button>
        </div>

        <div className="cp-separator" />

        <div className="cp-indent-group">
          <button
            className={`cp-indent-btn ${indentStyle === 'space2' ? 'active' : ''}`}
            onClick={() => setIndentStyle('space2')}
            title="2 空格缩进"
          >
            <Ruler className="w-3.5 h-3.5" />
            <span>2空格</span>
          </button>
          <button
            className={`cp-indent-btn ${indentStyle === 'space4' ? 'active' : ''}`}
            onClick={() => setIndentStyle('space4')}
            title="4 空格缩进"
          >
            <span style={{ width: 14, textAlign: 'center', fontSize: 11 }}>4</span>
            <span>4空格</span>
          </button>
          <button
            className={`cp-indent-btn ${indentStyle === 'tab' ? 'active' : ''}`}
            onClick={() => setIndentStyle('tab')}
            title="Tab 缩进"
          >
            <span style={{ width: 14, textAlign: 'center', fontSize: 11 }}>⇥</span>
            <span>Tab</span>
          </button>
        </div>

        <div className="cp-action-group">
          <button className="cp-btn cp-btn-primary" onClick={handleFormat}>
            {mode === 'format' ? (
              <>
                <Wand2 className="cp-btn-icon" />
                <span>格式化</span>
              </>
            ) : (
              <>
                <Minimize2 className="cp-btn-icon" />
                <span>压缩</span>
              </>
            )}
          </button>

          <button className="cp-btn" onClick={handleLoadExample} title="加载示例">
            <Sparkles className="cp-btn-icon" />
            <span>示例</span>
          </button>

          <button className="cp-btn cp-btn-danger" onClick={handleClear} title="清空">
            <Trash2 className="cp-btn-icon" />
          </button>
        </div>
      </div>

      <div className="cp-main">
        <div className="cp-editor-panel">
          <div className="cp-panel-header">
            <div className="cp-panel-title">
              <Code className="cp-panel-title-icon" />
              <span>输入 · {labelForLang(language)}</span>
            </div>
            <div className="cp-panel-actions">
              <button className="cp-icon-btn" onClick={handleLoadExample} title="加载示例">
                <Sparkles className="w-4 h-4" />
              </button>
              <button className="cp-icon-btn" onClick={handleClear} title="清空">
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          </div>
          <textarea
            className="cp-textarea"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder={`在此输入 ${labelForLang(language)} 代码...`}
            spellCheck={false}
          />
        </div>

        <div className="cp-editor-panel">
          <div className="cp-panel-header">
            <div className="cp-panel-title">
              {mode === 'format' ? (
                <Wand2 className="cp-panel-title-icon" />
              ) : (
                <Minimize2 className="cp-panel-title-icon" />
              )}
              <span>
                {mode === 'format' ? '美化输出' : '压缩输出'}
                {error && (
                  <span style={{ color: 'var(--cp-danger)', marginLeft: 8, fontSize: 12, fontWeight: 400 }}>
                    · 错误
                  </span>
                )}
              </span>
            </div>
            <div className="cp-panel-actions">
              {output && (
                <>
                  <button
                    className={`cp-icon-btn ${copied ? 'copied' : ''}`}
                    onClick={handleCopy}
                    title="复制"
                  >
                    {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                  </button>
                  <button className="cp-icon-btn" onClick={handleDownload} title="下载">
                    <Download className="w-4 h-4" />
                  </button>
                  <button className="cp-icon-btn" onClick={swapIO} title="交换到输入">
                    <GitCompare className="w-4 h-4" />
                  </button>
                </>
              )}
            </div>
          </div>
          {error ? (
            <div className="cp-error-bar">
              <Hash className="cp-error-icon" />
              <span className="cp-error-text">{error}</span>
            </div>
          ) : output ? (
            <pre className="cp-output">{output}</pre>
          ) : (
            <div className="cp-empty-output">
              {mode === 'format' ? (
                <Wand2 className="cp-empty-output-icon" />
              ) : (
                <Minimize2 className="cp-empty-output-icon" />
              )}
              <span>点击「格式化」或「压缩」按钮处理代码</span>
            </div>
          )}
        </div>
      </div>

      <div className="cp-footer">
        <div className="cp-stat">
          <Type className="cp-stat-icon" />
          <span className="cp-stat-label">字符</span>
          <span className="cp-stat-value">{stats.charCount.toLocaleString()}</span>
        </div>
        <div className="cp-stat">
          <Hash className="cp-stat-icon" />
          <span className="cp-stat-label">行数</span>
          <span className="cp-stat-value">{stats.inputLines.toLocaleString()}</span>
        </div>
        <div className="cp-stat">
          <FileJson className="cp-stat-icon" />
          <span className="cp-stat-label">原始</span>
          <span className="cp-stat-value">{stats.inputSize.toLocaleString()} B</span>
        </div>
        {output && (
          <>
            <div className="cp-stat">
              <FileJson className="cp-stat-icon" />
              <span className="cp-stat-label">输出</span>
              <span className="cp-stat-value">{stats.outputSize.toLocaleString()} B</span>
            </div>
            <div className="cp-stat">
              <GitCompare className="cp-stat-icon" />
              <span className="cp-stat-label">Gzip</span>
              <span className="cp-stat-value">
                {stats.inputGzip} B → {stats.outputGzip} B
              </span>
            </div>
          </>
        )}

        {output && (
          <div className="cp-compare-group">
            <div className="cp-compare-label">
              <GitCompare className="w-3.5 h-3.5" />
              <span>大小变化</span>
            </div>
            <div className={`cp-compare-value ${getDeltaClass()}`}>
              {getDeltaClass() === 'neutral' ? '±0.0%' : `${getDeltaSymbol()}${stats.sizeDeltaPercent}%`}
            </div>
          </div>
        )}
      </div>

      {copied && (
        <div className="cp-toast">
          <Check className="w-4 h-4" />
          <span>已复制到剪贴板</span>
        </div>
      )}
    </div>
  )
}

export default CodePolisher