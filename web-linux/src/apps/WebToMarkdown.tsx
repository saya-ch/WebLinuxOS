import { useState, useCallback, useMemo, useEffect, useRef } from 'react'
import { marked } from 'marked'
import {
  Link2,
  Sparkles,
  FileText,
  Copy,
  Check,
  Download,
  Eye,
  EyeOff,
  Loader2,
  Trash2,
  AlignLeft,
  AlignJustify,
  Heading,
  Shield,
  ShieldCheck,
  Settings,
  Code,
  History,
  FileCode,
} from 'lucide-react'

type ConvertScope = 'full' | 'article' | 'headings'

interface HistoryItem {
  id: string
  url: string
  title: string
  markdown: string
  scope: ConvertScope
  createdAt: number
}

const CORS_PROXIES = [
  (url: string) => `https://corsproxy.io/?${encodeURIComponent(url)}`,
  (url: string) => `https://api.allorigins.win/raw?url=${encodeURIComponent(url)}`,
  (url: string) => `https://api.codetabs.com/v1/proxy?quest=${encodeURIComponent(url)}`,
]

const STORAGE_KEY = 'weblinux-watomarkdown-history'
const MAX_HISTORY = 20

const AD_SELECTORS = [
  'script', 'style', 'noscript', 'iframe', 'svg', 'canvas',
  'nav', 'footer', 'header', 'aside',
  '[class*="ad"]', '[class*="advertisement"]', '[class*="adsense"]',
  '[class*="sidebar"]', '[class*="comment"]', '[class*="comments"]',
  '[class*="footer"]', '[class*="header"]', '[class*="nav"]',
  '[class*="popup"]', '[class*="modal"]', '[class*="overlay"]',
  '[class*="cookie"]', '[class*="newsletter"]', '[class*="subscribe"]',
  '[id*="ad"]', '[id*="sidebar"]', '[id*="comment"]',
  'script[src*="ad"]', 'iframe[src*="ad"]',
  '.advertisement', '.ads', '.ad-slot', '.sponsored',
  '.related-posts', '.recommend', '.suggested',
  '[role="navigation"]', '[role="complementary"]',
  '.breadcrumb', '.breadcrumbs',
  '.pagination', '.pager',
]

const fetchWithProxy = async (url: string, signal?: AbortSignal): Promise<string> => {
  let lastError = ''
  for (const make of CORS_PROXIES) {
    try {
      const res = await fetch(make(url), { signal })
      if (!res.ok) {
        lastError = `HTTP ${res.status}`
        continue
      }
      const text = await res.text()
      if (text && text.length > 100) return text
      lastError = '响应为空'
    } catch (e) {
      if ((e as Error).name === 'AbortError') throw e
      lastError = (e as Error).message
    }
  }
  throw new Error(lastError || '所有 CORS 代理均不可用')
}

const normalizeUrl = (input: string): string => {
  const trimmed = input.trim()
  if (!trimmed) return ''
  if (/^https?:\/\//i.test(trimmed)) return trimmed
  return 'https://' + trimmed
}

// ============================================================
// Turndown 核心实现：HTML → Markdown
// ============================================================

type TurndownRules = Record<string, (...args: any[]) => string>

interface TurndownOptions {
  headingLevel?: number
  bulletListMarker?: string
  codeBlockStyle?: 'indented' | 'fenced'
  emDelimiter?: string
  strongDelimiter?: string
  hr?: string
  keepFilter?: (node: Element) => boolean
}

const DEFAULT_TURNDOWN_OPTIONS: Required<TurndownOptions> = {
  headingLevel: 1,
  bulletListMarker: '-',
  codeBlockStyle: 'fenced',
  emDelimiter: '*',
  strongDelimiter: '**',
  hr: '---',
  keepFilter: () => true,
}

const turndown = (html: string, options: TurndownOptions = {}): string => {
  const opts: Required<TurndownOptions> = { ...DEFAULT_TURNDOWN_OPTIONS, ...options }

  const rules: TurndownRules = {
    html: (_node, text) => text.trim(),

    text: (_node, text) => {
      return text.replace(/\s+/g, ' ')
    },

    heading: (node, _text) => {
      const level = parseInt(node.tagName.charAt(1))
      const hLevel = Math.max(1, Math.min(6, level))
      const prefix = '#'.repeat(hLevel) + ' '
      const content = processChildren(node, opts)
      return `\n\n${prefix}${content}\n\n`
    },

    paragraph: (_node, text) => {
      return `\n\n${text}\n\n`
    },

    br: () => '\n',

    horizontalRule: () => `\n\n${opts.hr}\n\n`,

    list: (node, _text) => {
      const items = Array.from(node.children) as Element[]
      const ordered = node.tagName === 'OL'
      const indent = getListIndent(node)
      let result = '\n'

      items.forEach((item, index) => {
        if (item.tagName !== 'LI') return
        const marker = ordered ? `${index + 1}. ` : `${opts.bulletListMarker} `
        const content = processChildren(item, opts)
        result += indent + marker + content + '\n'

        const subList = item.querySelector(':scope > ul, :scope > ol') as Element | null
        if (subList) {
          const subResult = turndown(subList.outerHTML, opts)
          result += subResult.split('\n').map((l: string) => indent + '  ' + l).join('\n') + '\n'
        }
      })

      return result + '\n'
    },

    listItem: (_node, text) => text,

    em: (_node, text) => text ? `${opts.emDelimiter}${text}${opts.emDelimiter}` : '',
    strong: (_node, text) => text ? `${opts.strongDelimiter}${text}${opts.strongDelimiter}` : '',
    del: (_node, text) => text ? `~~${text}~~` : '',

    link: (node, text) => {
      const href = node.getAttribute('href') || ''
      const title = node.getAttribute('title') || ''
      if (!href && !text) return ''
      if (href === text) return `<${href}>`
      const titlePart = title ? ` "${title}"` : ''
      return `[${text}](${href}${titlePart})`
    },

    image: (node) => {
      const src = node.getAttribute('src') || ''
      const alt = node.getAttribute('alt') || ''
      const title = node.getAttribute('title') || ''
      const titlePart = title ? ` "${title}"` : ''
      if (!src) return ''
      return `![${alt}](${src}${titlePart})`
    },

    blockquote: (_node, text) => {
      const lines = text.split('\n')
      const quoted = lines.map((l: string) => l.trim() ? `> ${l}` : '>').join('\n')
      return `\n\n${quoted}\n\n`
    },

    code: (node, text) => {
      const parent = node.parentElement
      if (parent && parent.tagName === 'PRE') return text
      return text ? '`' + text + '`' : ''
    },

    pre: (node, _text) => {
      const codeEl = node.querySelector('code')
      let content = ''
      let language = ''
      if (codeEl) {
        content = codeEl.textContent || ''
        const cls = codeEl.getAttribute('class') || ''
        const langMatch = cls.match(/language-(\w+)/) || cls.match(/lang-(\w+)/)
        language = langMatch ? langMatch[1] : ''
      } else {
        content = node.textContent || ''
      }
      content = content.replace(/\n{3,}/g, '\n\n').trim()
      if (opts.codeBlockStyle === 'fenced') {
        return `\n\n\`\`\`${language}\n${content}\n\`\`\`\n\n`
      }
      return '\n\n' + content.split('\n').map(l => '    ' + l).join('\n') + '\n\n'
    },

    table: (node, _text) => {
      return convertTable(node, opts)
    },

    td: (_node, text) => {
      return text.replace(/\|/g, '\\|')
    },

    th: (_node, text) => {
      return text.replace(/\|/g, '\\|')
    },

    dd: (_node, text) => `\n${text}\n`,
    dt: (_node, text) => `\n**${text}**\n`,

    sub: (_node, text) => text ? `<sub>${text}</sub>` : '',
    sup: (_node, text) => text ? `<sup>${text}</sup>` : '',

    iframe: (node) => {
      const src = node.getAttribute('src') || ''
      return src ? `\n\n[${src}](${src})\n\n` : ''
    },
  }

  const processChildren = (node: Element, o: Required<TurndownOptions>): string => {
    let result = ''
    for (const child of Array.from(node.childNodes)) {
      if (child.nodeType === Node.TEXT_NODE) {
        result += child.textContent || ''
      } else if (child.nodeType === Node.ELEMENT_NODE) {
        const el = child as Element
        if (!o.keepFilter(el)) continue
        result += convertElement(el, o)
      }
    }
    return result
  }

  const convertElement = (node: Element, o: Required<TurndownOptions>): string => {
    const tag = node.tagName.toLowerCase()

    if (rules[tag]) {
      return rules[tag](node, processChildren(node, o), o)
    }

    switch (tag) {
      case 'a': return rules.link(node, processChildren(node, o))
      case 'img': return rules.image(node)
      case 'br': return rules.br()
      case 'hr': return rules.horizontalRule()
      case 'em': case 'i': return rules.em(node, processChildren(node, o))
      case 'strong': case 'b': return rules.strong(node, processChildren(node, o))
      case 'del': case 's': case 'strike': return rules.del(node, processChildren(node, o))
      case 'code': return rules.code(node, processChildren(node, o))
      case 'pre': return rules.pre(node, '', )
      case 'blockquote': return rules.blockquote(node, processChildren(node, o))
      case 'ul': case 'ol': return rules.list(node, '', o)
      case 'li': return rules.listItem(node, processChildren(node, o))
      case 'h1': case 'h2': case 'h3': case 'h4': case 'h5': case 'h6':
        return rules.heading(node, '', o)
      case 'p': return rules.paragraph(node, processChildren(node, o))
      case 'table': return rules.table(node, '', o)
      case 'td': case 'th': return (rules[tag] as Function)(node, processChildren(node, o))
      case 'thead': case 'tbody': case 'tfoot': return processChildren(node, o)
      case 'tr': return convertTableRow(node, o)
      case 'dl': return processChildren(node, o)
      case 'dt': return rules.dt(node, processChildren(node, o))
      case 'dd': return rules.dd(node, processChildren(node, o))
      case 'sub': return rules.sub(node, processChildren(node, o))
      case 'sup': return rules.sup(node, processChildren(node, o))
      case 'iframe': return rules.iframe(node)
      case 'script': case 'style': return ''
      default: return processChildren(node, o)
    }
  }

  const convertTable = (node: Element, o: Required<TurndownOptions>): string => {
    const rows = node.querySelectorAll('tr')
    if (rows.length === 0) return ''

    const hasHeader = node.querySelector('thead th') || rows[0]?.querySelector('th')

    const tableData: string[][] = []
    for (const row of Array.from(rows)) {
      const cells = row.querySelectorAll('td, th')
      const rowData: string[] = []
      for (const cell of Array.from(cells)) {
        rowData.push(processChildren(cell, o).trim())
      }
      tableData.push(rowData)
    }

    if (tableData.length === 0) return ''

    let result = '\n\n'
    const headerRow = hasHeader ? tableData[0] : null
    const bodyRows = hasHeader ? tableData.slice(1) : tableData

    if (headerRow) {
      result += '| ' + headerRow.join(' | ') + ' |\n'
      result += '| ' + headerRow.map(() => '---').join(' | ') + ' |\n'
    }

    for (const row of bodyRows) {
      result += '| ' + row.join(' | ') + ' |\n'
    }

    return result + '\n'
  }

  const convertTableRow = (node: Element, o: Required<TurndownOptions>): string => {
    const cells = node.querySelectorAll('td, th')
    const rowData: string[] = []
    for (const cell of Array.from(cells)) {
      rowData.push(processChildren(cell, o).trim())
    }
    return '| ' + rowData.join(' | ') + ' |\n'
  }

  const getListIndent = (node: Element): string => {
    let depth = 0
    let parent = node.parentElement
    while (parent) {
      if (parent.tagName === 'UL' || parent.tagName === 'OL') depth++
      parent = parent.parentElement
    }
    return '  '.repeat(Math.max(0, depth - 1))
  }

  const wrapInHtml = (bodyContent: string): string => {
    return `<!DOCTYPE html><html><head><meta charset="utf-8"></head><body>${bodyContent}</body></html>`
  }

  const wrappedHtml = wrapInHtml(html)
  const parser = new DOMParser()
  const doc = parser.parseFromString(wrappedHtml, 'text/html')
  const body = doc.body
  const result = processChildren(body, opts)

  return result
    .replace(/\n{3,}/g, '\n\n')
    .replace(/[ \t]+\n/g, '\n')
    .replace(/\n{3,}/g, '\n\n')
    .trim()
}

// ============================================================
// HTML 清理：移除广告和导航
// ============================================================

const cleanHtml = (doc: Document, removeAds: boolean): void => {
  if (!removeAds) return

  AD_SELECTORS.forEach((selector) => {
    try {
      doc.querySelectorAll(selector).forEach((el) => el.remove())
    } catch {
      // ignore invalid selectors
    }
  })

  doc.querySelectorAll('*').forEach((el) => {
    const text = (el.textContent || '').trim()
    const tag = el.tagName.toLowerCase()
    if ((tag === 'div' || tag === 'span') && text.length === 0 && el.children.length === 0) {
      const style = el.getAttribute('style') || ''
      if (style.includes('display:none') || style.includes('visibility:hidden')) {
        el.remove()
      }
    }
  })
}

// ============================================================
// 内容提取：根据范围选择内容
// ============================================================

const extractContent = (
  doc: Document,
  scope: ConvertScope,
  baseUrl: string,
  removeAds: boolean
): { html: string; title: string } => {
  void baseUrl
  cleanHtml(doc, removeAds)

  const title =
    doc.querySelector('meta[property="og:title"]')?.getAttribute('content') ||
    doc.querySelector('meta[name="twitter:title"]')?.getAttribute('content') ||
    doc.querySelector('title')?.textContent?.trim() ||
    '无标题'

  if (scope === 'headings') {
    const headings = doc.querySelectorAll('h1, h2, h3, h4, h5, h6')
    let html = '<div>'
    headings.forEach((h) => {
      html += h.outerHTML
    })
    html += '</div>'
    return { html, title }
  }

  if (scope === 'article') {
    const candidates = [
      'article',
      'main',
      '[role="main"]',
      '.post-content',
      '.article-content',
      '.article-body',
      '.post-body',
      '.entry-content',
      '.story-body',
      '.story-content',
      '.post',
      '#content',
      '.content',
    ]

    for (const sel of candidates) {
      const el = doc.querySelector(sel)
      if (el && (el.textContent || '').trim().length > 100) {
        return { html: el.innerHTML, title }
      }
    }

    const allDivs = doc.querySelectorAll('div, section')
    let maxLen = 0
    let bestEl: Element | null = null
    allDivs.forEach((el) => {
      const text = (el.textContent || '').trim()
      if (text.length > maxLen && text.length > 200) {
        maxLen = text.length
        bestEl = el
      }
    })

    if (bestEl) {
      return { html: (bestEl as Element).innerHTML, title }
    }
  }

  return { html: doc.body?.innerHTML || '', title }
}

// ============================================================
// Markdown 预览样式
// ============================================================

const MARKDOWN_PREVIEW_STYLES = `
  .md-preview {
    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
    line-height: 1.7;
    color: #e0e0e8;
    padding: 24px;
    max-width: 800px;
    margin: 0 auto;
  }
  .md-preview h1, .md-preview h2, .md-preview h3, .md-preview h4 {
    color: #fff;
    margin-top: 1.5em;
    margin-bottom: 0.6em;
    font-weight: 700;
    line-height: 1.3;
  }
  .md-preview h1 { font-size: 1.8em; border-bottom: 1px solid rgba(255,255,255,0.1); padding-bottom: 0.3em; }
  .md-preview h2 { font-size: 1.4em; border-bottom: 1px solid rgba(255,255,255,0.06); padding-bottom: 0.2em; }
  .md-preview h3 { font-size: 1.2em; }
  .md-preview h4 { font-size: 1.05em; }
  .md-preview p { margin: 0.8em 0; }
  .md-preview a { color: #8b7cf0; text-decoration: none; }
  .md-preview a:hover { text-decoration: underline; }
  .md-preview code {
    background: rgba(139,124,240,0.15);
    color: #c4b5fd;
    padding: 2px 6px;
    border-radius: 4px;
    font-size: 0.88em;
    font-family: 'JetBrains Mono', 'Fira Code', Consolas, monospace;
  }
  .md-preview pre {
    background: rgba(0,0,0,0.4);
    border: 1px solid rgba(255,255,255,0.08);
    border-radius: 8px;
    padding: 16px;
    overflow-x: auto;
    margin: 1em 0;
  }
  .md-preview pre code {
    background: transparent;
    color: #e0e0e8;
    padding: 0;
    font-size: 0.88em;
    line-height: 1.6;
  }
  .md-preview blockquote {
    border-left: 3px solid #8b7cf0;
    background: rgba(139,124,240,0.06);
    padding: 10px 16px;
    margin: 1em 0;
    border-radius: 0 6px 6px 0;
    color: #b0b0c8;
  }
  .md-preview ul, .md-preview ol { padding-left: 1.8em; margin: 0.8em 0; }
  .md-preview li { margin: 0.3em 0; }
  .md-preview ul li { list-style: disc; }
  .md-preview ol li { list-style: decimal; }
  .md-preview table {
    border-collapse: collapse;
    width: 100%;
    margin: 1em 0;
    font-size: 0.92em;
  }
  .md-preview th {
    background: rgba(139,124,240,0.12);
    color: #fff;
    font-weight: 600;
    text-align: left;
  }
  .md-preview th, .md-preview td {
    border: 1px solid rgba(255,255,255,0.12);
    padding: 8px 12px;
  }
  .md-preview tr:nth-child(even) td {
    background: rgba(255,255,255,0.02);
  }
  .md-preview img {
    max-width: 100%;
    border-radius: 8px;
    margin: 1em 0;
  }
  .md-preview hr {
    border: none;
    border-top: 1px solid rgba(255,255,255,0.1);
    margin: 2em 0;
  }
  .md-preview strong { color: #fff; font-weight: 700; }
  .md-preview em { font-style: italic; }
  .md-preview del { text-decoration: line-through; color: #888; }
`

// ============================================================
// History helpers
// ============================================================

const loadHistory = (): HistoryItem[] => {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return []
    const data = JSON.parse(raw)
    return Array.isArray(data) ? data : []
  } catch {
    return []
  }
}

const saveHistory = (history: HistoryItem[]) => {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(history.slice(0, MAX_HISTORY)))
  } catch {
    // ignore
  }
}

const formatDate = (ts: number): string => {
  const d = new Date(ts)
  const now = Date.now()
  const diff = now - ts
  if (diff < 60_000) return '刚刚'
  if (diff < 3_600_000) return `${Math.floor(diff / 60_000)} 分钟前`
  if (diff < 86_400_000) return `${Math.floor(diff / 3_600_000)} 小时前`
  if (diff < 7 * 86_400_000) return `${Math.floor(diff / 86_400_000)} 天前`
  return d.toLocaleDateString('zh-CN')
}

// ============================================================
// Main Component
// ============================================================

const SCOPE_OPTIONS: { value: ConvertScope; label: string; icon: React.ReactNode; desc: string }[] = [
  { value: 'full', label: '全文', icon: <AlignJustify size={14} />, desc: '转换整个页面 HTML' },
  { value: 'article', label: '正文', icon: <AlignLeft size={14} />, desc: '仅提取文章主体内容' },
  { value: 'headings', label: '标题', icon: <Heading size={14} />, desc: '仅提取所有标题层级' },
]

export default function WebToMarkdown() {
  const [urlInput, setUrlInput] = useState('')
  const [loading, setLoading] = useState(false)
  const [progress, setProgress] = useState('')
  const [error, setError] = useState('')

  const [scope, setScope] = useState<ConvertScope>('article')
  const [removeAds, setRemoveAds] = useState(true)
  const [headingLevel, setHeadingLevel] = useState(1)
  const [bulletMarker, setBulletMarker] = useState('-')

  const [markdown, setMarkdown] = useState('')
  const [pageTitle, setPageTitle] = useState('')
  const [currentUrl, setCurrentUrl] = useState('')

  const [showPreview, setShowPreview] = useState(true)
  const [splitMode, setSplitMode] = useState(true)
  const [copied, setCopied] = useState(false)

  const [history, setHistory] = useState<HistoryItem[]>(() => loadHistory())
  const [showHistory, setShowHistory] = useState(false)
  const [showSettings, setShowSettings] = useState(false)

  const editorRef = useRef<HTMLTextAreaElement>(null)

  useEffect(() => {
    saveHistory(history)
  }, [history])

  const handleConvert = useCallback(async () => {
    const url = normalizeUrl(urlInput)
    if (!url) {
      setError('请输入有效的 URL')
      return
    }
    setError('')
    setLoading(true)
    setProgress('通过 CORS 代理抓取页面...')

    try {
      const html = await fetchWithProxy(url)
      setProgress('解析 HTML 结构...')

      const parser = new DOMParser()
      const doc = parser.parseFromString(html, 'text/html')

      setProgress(`提取${scope === 'full' ? '全文' : scope === 'article' ? '正文' : '标题'}内容...`)

      const { html: contentHtml, title } = extractContent(doc, scope, url, removeAds)

      setProgress('转换为 Markdown...')

      const md = turndown(contentHtml, {
        headingLevel,
        bulletListMarker: bulletMarker as '-' | '*' | '+',
        codeBlockStyle: 'fenced',
        emDelimiter: '*',
        strongDelimiter: '**',
        hr: '---',
      })

      setMarkdown(md)
      setPageTitle(title)
      setCurrentUrl(url)

      const item: HistoryItem = {
        id: 'watom-' + Date.now().toString(36),
        url,
        title,
        markdown: md,
        scope,
        createdAt: Date.now(),
      }
      setHistory((prev) => [item, ...prev].slice(0, MAX_HISTORY))

      setProgress('')
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err)
      setError(`转换失败：${msg}`)
      setProgress('')
    } finally {
      setLoading(false)
    }
  }, [urlInput, scope, removeAds, headingLevel, bulletMarker])

  const handleCopy = useCallback(async () => {
    if (!markdown) return
    try {
      await navigator.clipboard.writeText(markdown)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch {
      const ta = document.createElement('textarea')
      ta.value = markdown
      document.body.appendChild(ta)
      ta.select()
      try {
        document.execCommand('copy')
        setCopied(true)
        setTimeout(() => setCopied(false), 2000)
      } catch {
        // ignore
      }
      document.body.removeChild(ta)
    }
  }, [markdown])

  const handleDownload = useCallback(() => {
    if (!markdown) return
    const title = pageTitle || 'markdown-export'
    const safeName = title.replace(/[^\w\u4e00-\u9fa5\-]+/g, '-').slice(0, 60)
    const blob = new Blob([markdown], { type: 'text/markdown;charset=utf-8' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `${safeName}.md`
    a.click()
    URL.revokeObjectURL(url)
  }, [markdown, pageTitle])

  const handleClear = useCallback(() => {
    setMarkdown('')
    setPageTitle('')
    setCurrentUrl('')
    setError('')
    setUrlInput('')
  }, [])

  const handleHistoryClick = useCallback((item: HistoryItem) => {
    setMarkdown(item.markdown)
    setPageTitle(item.title)
    setCurrentUrl(item.url)
    setUrlInput(item.url)
    setScope(item.scope)
    setShowHistory(false)
  }, [])

  const handleDeleteHistory = useCallback((id: string) => {
    setHistory((prev) => prev.filter((h) => h.id !== id))
  }, [])

  const handleClearHistory = useCallback(() => {
    if (confirm('确定清空全部历史记录？')) {
      setHistory([])
    }
  }, [])

  const wordCount = useMemo(() => {
    if (!markdown) return 0
    return markdown.replace(/\s+/g, '').length
  }, [markdown])

  const lineCount = useMemo(() => {
    if (!markdown) return 0
    return markdown.split('\n').length
  }, [markdown])

  const previewHtml = useMemo(() => {
    if (!markdown) return ''
    try {
      return marked.parse(markdown, { async: false }) as string
    } catch {
      return ''
    }
  }, [markdown])

  const bgGradient = 'linear-gradient(180deg, #0a0a14 0%, #12121f 100%)'
  const accentColor = '#8b7cf0'
  const accentGradient = 'linear-gradient(135deg, #8b7cf0, #6c5ce7)'
  const textColor = '#e0e0e8'
  const subTextColor = '#94a3b8'
  const mutedColor = '#64748b'
  const borderColor = 'rgba(255,255,255,0.08)'
  const inputBg = 'rgba(255,255,255,0.04)'
  const cardBg = 'rgba(25,25,42,0.6)'
  const glassBg = 'rgba(20,20,35,0.5)'
  void cardBg; void glassBg

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey && !loading) {
      e.preventDefault()
      handleConvert()
    }
  }

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        height: '100%',
        width: '100%',
        background: bgGradient,
        color: textColor,
        fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
        fontSize: 14,
        overflow: 'hidden',
      }}
    >
      {/* Top Bar */}
      <div
        style={{
          padding: '14px 20px',
          background: 'rgba(0,0,0,0.3)',
          borderBottom: `1px solid ${borderColor}`,
          backdropFilter: 'blur(10px)',
          display: 'flex',
          alignItems: 'center',
          gap: 12,
          flexShrink: 0,
        }}
      >
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 8,
            padding: '6px 12px',
            background: 'rgba(139,124,240,0.15)',
            borderRadius: 8,
            color: accentColor,
            fontWeight: 600,
            fontSize: 13,
          }}
        >
          <FileCode size={16} />
          WebToMarkdown
        </div>

        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 10,
            padding: '10px 14px',
            background: inputBg,
            border: `1px solid ${borderColor}`,
            borderRadius: 10,
            flex: 1,
            maxWidth: 700,
          }}
        >
          <Link2 size={16} color={accentColor} />
          <input
            type="text"
            value={urlInput}
            onChange={(e) => setUrlInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="输入网页 URL 转换为 Markdown，例如 https://example.com/article"
            disabled={loading}
            style={{
              flex: 1,
              background: 'transparent',
              border: 'none',
              outline: 'none',
              color: textColor,
              fontSize: 14,
              fontFamily: 'inherit',
            }}
          />
          {urlInput && !loading && (
            <button
              onClick={() => setUrlInput('')}
              style={{
                background: 'transparent',
                border: 'none',
                color: mutedColor,
                cursor: 'pointer',
                padding: 0,
                display: 'flex',
                alignItems: 'center',
              }}
            >
              <Trash2 size={14} />
            </button>
          )}
        </div>

        <button
          onClick={handleConvert}
          disabled={loading}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 6,
            padding: '10px 20px',
            background: loading ? '#555' : accentGradient,
            border: 'none',
            borderRadius: 8,
            color: '#fff',
            cursor: loading ? 'not-allowed' : 'pointer',
            fontSize: 13,
            fontWeight: 600,
            transition: 'all 0.2s',
            boxShadow: loading ? 'none' : '0 4px 14px rgba(139,124,240,0.3)',
          }}
        >
          {loading ? (
            <><Loader2 size={14} style={{ animation: 'spin 1s linear infinite' }} /> 转换中...</>
          ) : (
            <><Sparkles size={14} /> 转换</>
          )}
        </button>

        <button
          onClick={() => setShowSettings(!showSettings)}
          style={{
            width: 38,
            height: 38,
            background: showSettings ? 'rgba(139,124,240,0.3)' : inputBg,
            border: `1px solid ${borderColor}`,
            borderRadius: 8,
            color: showSettings ? accentColor : subTextColor,
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
          title="设置"
        >
          <Settings size={16} />
        </button>
      </div>

      {/* Settings Panel */}
      {showSettings && (
        <div
          style={{
            padding: '12px 20px',
            background: 'rgba(0,0,0,0.25)',
            borderBottom: `1px solid ${borderColor}`,
            display: 'flex',
            gap: 20,
            flexWrap: 'wrap',
            alignItems: 'center',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <span style={{ fontSize: 12, color: subTextColor }}>转换范围：</span>
            <div style={{ display: 'flex', gap: 4 }}>
              {SCOPE_OPTIONS.map((opt) => (
                <button
                  key={opt.value}
                  onClick={() => setScope(opt.value)}
                  title={opt.desc}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 4,
                    padding: '6px 12px',
                    background: scope === opt.value ? 'rgba(139,124,240,0.25)' : inputBg,
                    border: `1px solid ${scope === opt.value ? 'rgba(139,124,240,0.5)' : borderColor}`,
                    borderRadius: 6,
                    color: scope === opt.value ? '#fff' : subTextColor,
                    fontSize: 12,
                    cursor: 'pointer',
                  }}
                >
                  {opt.icon}
                  {opt.label}
                </button>
              ))}
            </div>
          </div>

          <label
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 6,
              fontSize: 12,
              color: subTextColor,
              cursor: 'pointer',
            }}
          >
            <input
              type="checkbox"
              checked={removeAds}
              onChange={(e) => setRemoveAds(e.target.checked)}
              style={{ accentColor }}
            />
            <Shield size={14} color={removeAds ? accentColor : mutedColor} />
            移除广告和导航
          </label>

          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <span style={{ fontSize: 12, color: subTextColor }}>标题起始级别：</span>
            <select
              value={headingLevel}
              onChange={(e) => setHeadingLevel(Number(e.target.value))}
              style={{
                padding: '5px 10px',
                background: inputBg,
                border: `1px solid ${borderColor}`,
                borderRadius: 6,
                color: textColor,
                fontSize: 12,
                outline: 'none',
              }}
            >
              <option value={1}>H1</option>
              <option value={2}>H2</option>
              <option value={3}>H3</option>
            </select>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <span style={{ fontSize: 12, color: subTextColor }}>列表标记：</span>
            <select
              value={bulletMarker}
              onChange={(e) => setBulletMarker(e.target.value)}
              style={{
                padding: '5px 10px',
                background: inputBg,
                border: `1px solid ${borderColor}`,
                borderRadius: 6,
                color: textColor,
                fontSize: 12,
                outline: 'none',
              }}
            >
              <option value="-">- (短横线)</option>
              <option value="*">* (星号)</option>
              <option value="+">+ (加号)</option>
            </select>
          </div>
        </div>
      )}

      {/* Error / Progress */}
      {error && (
        <div
          style={{
            padding: '8px 20px',
            background: 'rgba(239,68,68,0.1)',
            borderBottom: '1px solid rgba(239,68,68,0.4)',
            color: '#fca5a5',
            fontSize: 13,
            display: 'flex',
            alignItems: 'center',
            gap: 8,
          }}
        >
          <span>⚠️ {error}</span>
        </div>
      )}
      {progress && !error && (
        <div
          style={{
            padding: '8px 20px',
            background: 'rgba(59,130,246,0.1)',
            borderBottom: '1px solid rgba(59,130,246,0.3)',
            color: '#93c5fd',
            fontSize: 13,
            display: 'flex',
            alignItems: 'center',
            gap: 8,
          }}
        >
          <Loader2 size={12} style={{ animation: 'spin 1s linear infinite' }} />
          {progress}
        </div>
      )}

      {/* Main Content Area */}
      <div style={{ flex: 1, display: 'flex', overflow: 'hidden' }}>
        {/* Left: Editor / Preview */}
        <div
          style={{
            flex: 1,
            display: 'flex',
            flexDirection: 'column',
            overflow: 'hidden',
            borderRight: showHistory ? `1px solid ${borderColor}` : 'none',
          }}
        >
          {/* Toolbar */}
          <div
            style={{
              padding: '10px 16px',
              background: 'rgba(0,0,0,0.2)',
              borderBottom: `1px solid ${borderColor}`,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              gap: 8,
              flexShrink: 0,
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <div style={{ display: 'flex', gap: 4 }}>
                <button
                  onClick={() => setSplitMode(false)}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 4,
                    padding: '5px 12px',
                    background: !splitMode ? 'rgba(139,124,240,0.25)' : 'transparent',
                    border: `1px solid ${!splitMode ? 'rgba(139,124,240,0.5)' : borderColor}`,
                    borderRadius: 6,
                    color: !splitMode ? '#fff' : subTextColor,
                    fontSize: 12,
                    cursor: 'pointer',
                  }}
                >
                  <Code size={13} />
                  编辑
                </button>
                <button
                  onClick={() => setSplitMode(true)}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 4,
                    padding: '5px 12px',
                    background: splitMode ? 'rgba(139,124,240,0.25)' : 'transparent',
                    border: `1px solid ${splitMode ? 'rgba(139,124,240,0.5)' : borderColor}`,
                    borderRadius: 6,
                    color: splitMode ? '#fff' : subTextColor,
                    fontSize: 12,
                    cursor: 'pointer',
                  }}
                >
                  <AlignLeft size={13} />
                  分屏
                </button>
              </div>

              {pageTitle && (
                <div
                  style={{
                    fontSize: 12,
                    color: mutedColor,
                    marginLeft: 12,
                    paddingLeft: 12,
                    borderLeft: `1px solid ${borderColor}`,
                    maxWidth: 300,
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    whiteSpace: 'nowrap',
                  }}
                  title={pageTitle}
                >
                  <FileText size={12} style={{ display: 'inline', marginRight: 4 }} />
                  {pageTitle}
                </div>
              )}
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <span style={{ fontSize: 11, color: mutedColor }}>
                {wordCount} 字符 · {lineCount} 行
              </span>
              <button
                onClick={() => setShowPreview(!showPreview)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 4,
                  padding: '5px 10px',
                  background: showPreview ? 'rgba(139,124,240,0.2)' : inputBg,
                  border: `1px solid ${borderColor}`,
                  borderRadius: 6,
                  color: subTextColor,
                  fontSize: 12,
                  cursor: 'pointer',
                }}
                title={showPreview ? '隐藏预览' : '显示预览'}
              >
                {showPreview ? <Eye size={13} /> : <EyeOff size={13} />}
                {showPreview ? '预览开' : '预览关'}
              </button>
              <button
                onClick={handleCopy}
                disabled={!markdown}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 4,
                  padding: '5px 12px',
                  background: copied ? 'rgba(16,185,129,0.2)' : inputBg,
                  border: `1px solid ${borderColor}`,
                  borderRadius: 6,
                  color: copied ? '#10b981' : subTextColor,
                  fontSize: 12,
                  cursor: markdown ? 'pointer' : 'not-allowed',
                  opacity: markdown ? 1 : 0.5,
                }}
              >
                {copied ? <Check size={13} /> : <Copy size={13} />}
                {copied ? '已复制' : '复制'}
              </button>
              <button
                onClick={handleDownload}
                disabled={!markdown}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 4,
                  padding: '5px 12px',
                  background: inputBg,
                  border: `1px solid ${borderColor}`,
                  borderRadius: 6,
                  color: subTextColor,
                  fontSize: 12,
                  cursor: markdown ? 'pointer' : 'not-allowed',
                  opacity: markdown ? 1 : 0.5,
                }}
              >
                <Download size={13} />
                下载
              </button>
              <button
                onClick={handleClear}
                disabled={!markdown}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 4,
                  padding: '5px 12px',
                  background: inputBg,
                  border: `1px solid ${borderColor}`,
                  borderRadius: 6,
                  color: '#f87171',
                  fontSize: 12,
                  cursor: markdown ? 'pointer' : 'not-allowed',
                  opacity: markdown ? 1 : 0.5,
                }}
              >
                <Trash2 size={13} />
                清空
              </button>
            </div>
          </div>

          {/* Editor + Preview */}
          <div style={{ flex: 1, display: 'flex', overflow: 'hidden' }}>
            {/* Markdown Editor */}
            <div
              style={{
                display: 'flex',
                flexDirection: 'column',
                overflow: 'hidden',
                ...(showPreview && splitMode
                  ? { flex: 1, borderRight: `1px solid ${borderColor}` }
                  : { flex: 1 }),
              }}
            >
              <textarea
                ref={editorRef}
                value={markdown}
                onChange={(e) => setMarkdown(e.target.value)}
                placeholder="在左侧输入 URL 并点击转换按钮，生成的 Markdown 将显示在这里..."
                style={{
                  flex: 1,
                  padding: 20,
                  background: 'rgba(0,0,0,0.25)',
                  border: 'none',
                  outline: 'none',
                  color: textColor,
                  fontSize: 14,
                  fontFamily: "'JetBrains Mono', 'Fira Code', Consolas, monospace",
                  lineHeight: 1.7,
                  resize: 'none',
                  tabSize: 2,
                }}
                spellCheck={false}
              />
            </div>

            {/* Preview Pane */}
            {showPreview && splitMode && (
              <div
                style={{
                  flex: 1,
                  overflow: 'auto',
                  background: 'rgba(0,0,0,0.15)',
                }}
              >
                {markdown ? (
                  <div
                    className="md-preview"
                    dangerouslySetInnerHTML={{ __html: previewHtml }}
                  />
                ) : (
                  <div
                    style={{
                      height: '100%',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      color: mutedColor,
                      flexDirection: 'column',
                      gap: 8,
                    }}
                  >
                    <Eye size={32} style={{ opacity: 0.4 }} />
                    <span style={{ fontSize: 13 }}>预览区</span>
                    <span style={{ fontSize: 12 }}>转换后在此处实时预览</span>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Single preview mode */}
          {showPreview && !splitMode && markdown && (
            <div
              style={{
                position: 'absolute',
                inset: 0,
                display: 'flex',
                flexDirection: 'column',
                background: 'rgba(0,0,0,0.9)',
                zIndex: 50,
              }}
            >
              <div
                style={{
                  padding: '8px 16px',
                  background: 'rgba(0,0,0,0.5)',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  borderBottom: `1px solid ${borderColor}`,
                }}
              >
                <span style={{ fontSize: 13, color: subTextColor }}>Markdown 预览</span>
                <button
                  onClick={() => setShowPreview(false)}
                  style={{
                    padding: '5px 12px',
                    background: inputBg,
                    border: `1px solid ${borderColor}`,
                    borderRadius: 6,
                    color: subTextColor,
                    fontSize: 12,
                    cursor: 'pointer',
                  }}
                >
                  关闭预览
                </button>
              </div>
              <div
                style={{
                  flex: 1,
                  overflow: 'auto',
                }}
              >
                <div
                  className="md-preview"
                  dangerouslySetInnerHTML={{ __html: previewHtml }}
                />
              </div>
            </div>
          )}
        </div>

        {/* Right: History Panel */}
        {showHistory && (
          <div
            style={{
              width: 280,
              background: 'rgba(0,0,0,0.25)',
              display: 'flex',
              flexDirection: 'column',
              flexShrink: 0,
            }}
          >
            <div
              style={{
                padding: '12px',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                borderBottom: `1px solid ${borderColor}`,
              }}
            >
              <span style={{ fontSize: 13, fontWeight: 600, color: '#c4b5fd' }}>
                历史记录 ({history.length})
              </span>
              <div style={{ display: 'flex', gap: 4 }}>
                <button
                  onClick={handleClearHistory}
                  disabled={history.length === 0}
                  style={{
                    width: 26,
                    height: 26,
                    background: inputBg,
                    border: `1px solid ${borderColor}`,
                    borderRadius: 4,
                    color: history.length === 0 ? mutedColor : '#f87171',
                    cursor: history.length === 0 ? 'not-allowed' : 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                  title="清空全部"
                >
                  <Trash2 size={11} />
                </button>
                <button
                  onClick={() => setShowHistory(false)}
                  style={{
                    width: 26,
                    height: 26,
                    background: inputBg,
                    border: `1px solid ${borderColor}`,
                    borderRadius: 4,
                    color: subTextColor,
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                  title="关闭"
                >
                  ✕
                </button>
              </div>
            </div>

            <div style={{ flex: 1, overflowY: 'auto', padding: 8 }}>
              {history.length === 0 ? (
                <div
                  style={{
                    padding: 24,
                    textAlign: 'center',
                    color: mutedColor,
                    fontSize: 12,
                  }}
                >
                  暂无历史记录
                  <br />
                  转换后的内容会自动保存
                </div>
              ) : (
                history.map((item) => (
                  <div
                    key={item.id}
                    style={{
                      padding: 10,
                      marginBottom: 4,
                      borderRadius: 8,
                      cursor: 'pointer',
                      background: 'rgba(255,255,255,0.03)',
                      border: '1px solid transparent',
                      transition: 'all 0.15s',
                    }}
                    onClick={() => handleHistoryClick(item)}
                    onMouseEnter={(e) => {
                      ;(e.currentTarget as HTMLElement).style.background = 'rgba(139,124,240,0.1)'
                      ;(e.currentTarget as HTMLElement).style.borderColor = 'rgba(139,124,240,0.3)'
                    }}
                    onMouseLeave={(e) => {
                      ;(e.currentTarget as HTMLElement).style.background = 'rgba(255,255,255,0.03)'
                      ;(e.currentTarget as HTMLElement).style.borderColor = 'transparent'
                    }}
                  >
                    <div
                      style={{
                        fontSize: 12,
                        fontWeight: 600,
                        color: '#fff',
                        marginBottom: 4,
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        whiteSpace: 'nowrap',
                      }}
                    >
                      {item.title || '无标题'}
                    </div>
                    <div
                      style={{
                        fontSize: 11,
                        color: mutedColor,
                        marginBottom: 4,
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        whiteSpace: 'nowrap',
                      }}
                    >
                      {item.url}
                    </div>
                    <div
                      style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        fontSize: 10,
                        color: mutedColor,
                      }}
                    >
                      <span>{formatDate(item.createdAt)}</span>
                      <span
                        onClick={(e) => {
                          e.stopPropagation()
                          handleDeleteHistory(item.id)
                        }}
                        style={{
                          color: '#f87171',
                          cursor: 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                        }}
                      >
                        <Trash2 size={10} />
                      </span>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        )}

        {/* History Toggle Button */}
        {!showHistory && (
          <button
            onClick={() => setShowHistory(true)}
            style={{
              width: 36,
              background: 'rgba(0,0,0,0.3)',
              border: `1px solid ${borderColor}`,
              borderRight: 'none',
              borderRadius: '8px 0 0 8px',
              color: subTextColor,
              cursor: 'pointer',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 4,
              padding: 8,
              alignSelf: 'center',
              position: 'absolute',
              right: 0,
              top: '50%',
              transform: 'translateY(-50%)',
              zIndex: 10,
            }}
            title={`显示历史记录 (${history.length})`}
          >
            <History size={14} />
            <span style={{ fontSize: 10 }}>{history.length}</span>
          </button>
        )}
      </div>

      {/* Bottom Status Bar */}
      <div
        style={{
          padding: '6px 20px',
          background: 'rgba(0,0,0,0.35)',
          borderTop: `1px solid ${borderColor}`,
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          fontSize: 11,
          color: mutedColor,
          flexShrink: 0,
        }}
      >
        <div style={{ display: 'flex', gap: 16 }}>
          <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
            <ShieldCheck size={12} color={removeAds ? '#10b981' : mutedColor} />
            {removeAds ? '广告过滤已启用' : '广告过滤已关闭'}
          </span>
          <span>
            范围：{SCOPE_OPTIONS.find((s) => s.value === scope)?.label}
          </span>
          {currentUrl && (
            <span
              style={{
                color: accentColor,
                cursor: 'pointer',
                maxWidth: 300,
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                whiteSpace: 'nowrap',
              }}
              title={currentUrl}
              onClick={() => {
                window.open(currentUrl, '_blank')
              }}
            >
              🔗 {currentUrl}
            </span>
          )}
        </div>
        <div style={{ display: 'flex', gap: 12 }}>
          <span>Turndown 算法 · marked 预览</span>
          <span>{wordCount} 字符 / {lineCount} 行</span>
        </div>
      </div>

      {/* Preview Styles */}
      <style>{MARKDOWN_PREVIEW_STYLES}</style>

      {/* Keyframe for spinner */}
      <style>{`
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  )
}