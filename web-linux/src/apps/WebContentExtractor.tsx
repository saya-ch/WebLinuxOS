import React, { useState, useCallback, useMemo, useEffect, memo } from 'react'
import { useStore } from '../store'
import {
  Link2,
  Sparkles,
  FileText,
  Copy,
  Check,
  Trash2,
  History,
  Download,
  Languages,
  Tag,
  BarChart3,
  Loader2,
  ExternalLink,
  BookOpen,
  Clock,
  Search,
  Globe,
  Zap,
  Heart,
  ThumbsUp,
  ThumbsDown,
  Meh,
  Type,
  Hash,
  AlignLeft,
  Lightbulb,
  ChevronDown,
  ChevronUp,
  PanelLeft,
  PanelRight,
  Wrench,
} from 'lucide-react'

interface ExtractedMetadata {
  title: string
  description: string
  keywords: string[]
  ogTitle: string
  ogDescription: string
  ogImage: string
  ogSiteName: string
  ogType: string
  twitterCard: string
  author: string
  favicon: string
  canonicalUrl: string
  h1Count: number
  h2Count: number
  h3Count: number
  h4Count: number
  h5Count: number
  h6Count: number
  imageCount: number
  linkCount: number
  paragraphCount: number
}

interface ContentAnalysis {
  wordCount: number
  charCount: number
  sentenceCount: number
  paragraphCount: number
  avgSentenceLength: number
  readingTime: number
  keywordDensity: { word: string; count: number; density: number }[]
  sentiment: 'positive' | 'neutral' | 'negative'
  sentimentScore: number
  confidence: number
  language: string
  uniqueWords: number
  lexicalDiversity: number
}

interface AnalysisResult {
  id: string
  url: string
  metadata: ExtractedMetadata
  analysis: ContentAnalysis
  rawHtml: string
  plainText: string
  summary: string
  createdAt: number
}

const CORS_PROXIES = [
  (url: string) => `https://corsproxy.io/?${encodeURIComponent(url)}`,
  (url: string) => `https://api.allorigins.win/raw?url=${encodeURIComponent(url)}`,
  (url: string) => `https://api.codetabs.com/v1/proxy?quest=${encodeURIComponent(url)}`,
]

const STORAGE_KEY = 'weblinux-webcontentextractor-history'
const MAX_HISTORY = 30

const POSITIVE_WORDS = new Set([
  'good', 'great', 'excellent', 'amazing', 'wonderful', 'fantastic',
  'happy', 'love', 'best', 'beautiful', 'awesome', 'perfect', 'brilliant',
  'success', 'win', 'benefit', 'improve', 'achieve', 'positive', 'joy',
  'happy', 'pleased', 'delighted', 'satisfied', 'impressive', 'remarkable',
  '的', '好', '棒', '优秀', '精彩', '出色', '喜欢', '爱', '成功', '美好',
  '积极', '正面', '愉快', '满意', '赞赏', '欣赏', '出色', '卓越', '辉煌',
])

const NEGATIVE_WORDS = new Set([
  'bad', 'worst', 'terrible', 'horrible', 'awful', 'poor', 'sad',
  'hate', 'fail', 'wrong', 'problem', 'issue', 'crash', 'bug', 'error',
  'negative', 'angry', 'disappointed', 'frustrated', 'worse', 'broken',
  '的', '差', '糟糕', '可怕', '讨厌', '恨', '失败', '错误', '问题', '负面',
  '消极', '失望', '沮丧', '愤怒', '不满', '糟糕', '严重', '危害', '风险',
])

const STOP_WORDS = new Set([
  'the', 'a', 'an', 'is', 'are', 'was', 'were', 'be', 'been', 'being',
  'to', 'of', 'in', 'on', 'for', 'with', 'at', 'by', 'from', 'as',
  'and', 'or', 'but', 'if', 'this', 'that', 'it', 'we', 'you', 'i',
  'he', 'she', 'they', 'them', 'our', 'your', 'my', 'his', 'her', 'its',
  'will', 'have', 'has', 'had', 'do', 'does', 'did', 'can', 'could',
  'should', 'would', 'may', 'might', 'shall', 'not', 'no', 'so',
  '的', '了', '在', '是', '我', '你', '他', '她', '它', '们',
  '和', '与', '或', '但', '就', '也', '都', '很', '有', '没', '不',
  '对', '这', '那', '一个', '一些', '可以', '应该', '什么', '怎么',
])

const uid = () =>
  Math.random().toString(36).slice(2) + Date.now().toString(36)

const normalizeUrl = (input: string): string => {
  const trimmed = input.trim()
  if (!trimmed) return ''
  if (/^https?:\/\//i.test(trimmed)) return trimmed
  return 'https://' + trimmed
}

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

const htmlToText = (html: string): string => {
  const div = document.createElement('div')
  div.innerHTML = html
  div.querySelectorAll('script, style, noscript, iframe, svg, canvas, nav, footer, header, aside, .ad, .advertisement, [class*="sidebar"], [class*="comment"], [class*="footer"], [class*="header"]').forEach((el) => el.remove())
  div.querySelectorAll('br').forEach((el) => el.replaceWith(document.createTextNode('\n')))
  div.querySelectorAll('p, div, li, h1, h2, h3, h4, h5, h6, blockquote, pre').forEach((el) => {
    el.appendChild(document.createTextNode('\n'))
  })
  const text = (div.textContent || '').replace(/\n{3,}/g, '\n\n')
  return text.trim()
}

const extractMetadata = (doc: Document, url: string): ExtractedMetadata => {
  const getMeta = (selector: string): string => {
    const el = doc.querySelector(selector)
    return el?.getAttribute('content')?.trim() || ''
  }

  const title =
    getMeta('meta[property="og:title"]') ||
    getMeta('meta[name="twitter:title"]') ||
    doc.querySelector('title')?.textContent?.trim() ||
    ''

  const description =
    getMeta('meta[property="og:description"]') ||
    getMeta('meta[name="twitter:description"]') ||
    getMeta('meta[name="description"]') ||
    ''

  const keywords = (getMeta('meta[name="keywords"]') || '')
    .split(/[,，]/)
    .map((k) => k.trim())
    .filter(Boolean)

  const h1Count = doc.querySelectorAll('h1').length
  const h2Count = doc.querySelectorAll('h2').length
  const h3Count = doc.querySelectorAll('h3').length
  const h4Count = doc.querySelectorAll('h4').length
  const h5Count = doc.querySelectorAll('h5').length
  const h6Count = doc.querySelectorAll('h6').length
  const imageCount = doc.querySelectorAll('img').length
  const linkCount = doc.querySelectorAll('a').length
  const paragraphCount = doc.querySelectorAll('p').length

  let favicon = getMeta('link[rel="icon"]') || getMeta('link[rel="shortcut icon"]')
  if (!favicon) {
    try {
      const urlObj = new URL(url)
      favicon = `${urlObj.protocol}//${urlObj.hostname}/favicon.ico`
    } catch {
      favicon = ''
    }
  }

  return {
    title,
    description,
    keywords,
    ogTitle: getMeta('meta[property="og:title"]'),
    ogDescription: getMeta('meta[property="og:description"]'),
    ogImage: getMeta('meta[property="og:image"]'),
    ogSiteName: getMeta('meta[property="og:site_name"]'),
    ogType: getMeta('meta[property="og:type"]'),
    twitterCard: getMeta('meta[name="twitter:card"]'),
    author: getMeta('meta[name="author"]') || getMeta('meta[property="article:author"]'),
    favicon,
    canonicalUrl: getMeta('link[rel="canonical"]') || url,
    h1Count,
    h2Count,
    h3Count,
    h4Count,
    h5Count,
    h6Count,
    imageCount,
    linkCount,
    paragraphCount,
  }
}

const splitIntoSentences = (text: string): string[] => {
  const cleaned = text.replace(/\s+/g, ' ').trim()
  const sentences: string[] = []
  const regex = /[^.!?。！？]+[.!?。！？]+/g
  let match: RegExpExecArray | null
  while ((match = regex.exec(cleaned)) !== null) {
    const s = match[0].trim()
    if (s.length > 5) sentences.push(s)
  }
  if (sentences.length === 0 && cleaned.length > 0) {
    sentences.push(cleaned)
  }
  return sentences
}

const summarizeText = (text: string): string => {
  const sentences = splitIntoSentences(text)
  if (sentences.length === 0) return ''

  const count = Math.min(5, sentences.length)
  const scored = sentences.map((s, i) => ({
    s,
    i,
    score: s.length + (i < 3 ? 15 : 0) + (s.includes('：') || s.includes(':') ? 8 : 0),
  }))
  scored.sort((a, b) => b.score - a.score)
  const top = scored.slice(0, count).sort((a, b) => a.i - b.i)
  return top.map((t) => t.s).join(' ')
}

const detectLanguage = (text: string): string => {
  const chineseChars = (text.match(/[\u4e00-\u9fff]/g) || []).length
  const totalChars = text.replace(/\s/g, '').length
  if (totalChars === 0) return 'en'
  const chineseRatio = chineseChars / totalChars
  if (chineseRatio > 0.5) return 'zh'
  if (chineseRatio > 0.1) return 'zh'
  const kanaChars = (text.match(/[\u3040-\u309f\u30a0-\u30ff]/g) || []).length
  if (kanaChars > totalChars * 0.1) return 'ja'
  return 'en'
}

const analyzeSentiment = (text: string): { sentiment: 'positive' | 'neutral' | 'negative'; score: number; confidence: number } => {
  const words = text.toLowerCase().match(/[\p{L}][\p{L}\d]{1,}/gu) || []
  let positiveCount = 0
  let negativeCount = 0

  for (const w of words) {
    if (POSITIVE_WORDS.has(w)) positiveCount++
    if (NEGATIVE_WORDS.has(w)) negativeCount++
  }

  const total = positiveCount + negativeCount
  if (total === 0) {
    return { sentiment: 'neutral', score: 50, confidence: 20 }
  }

  const score = Math.round((positiveCount / total) * 100)
  let sentiment: 'positive' | 'neutral' | 'negative'
  if (score > 60) sentiment = 'positive'
  else if (score < 40) sentiment = 'negative'
  else sentiment = 'neutral'

  const confidence = Math.min(100, Math.round((total / Math.max(words.length, 1)) * 200))
  return { sentiment, score, confidence }
}

const analyzeContent = (text: string): ContentAnalysis => {
  const sentences = splitIntoSentences(text)
  const words = text.toLowerCase().match(/[\p{L}][\p{L}\d]{1,}/gu) || []
  const wordCount = words.length
  const uniqueWords = new Set(words.map((w) => w.toLowerCase()))
  const lexicalDiversity = wordCount > 0 ? uniqueWords.size / wordCount : 0

  const keywordMap = new Map<string, number>()
  for (const w of words) {
    if (STOP_WORDS.has(w)) continue
    if (w.length < 2) continue
    keywordMap.set(w, (keywordMap.get(w) || 0) + 1)
  }

  const keywordDensity = Array.from(keywordMap.entries())
    .map(([word, count]) => ({
      word,
      count,
      density: wordCount > 0 ? (count / wordCount) * 100 : 0,
    }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 15)

  const { sentiment, score, confidence } = analyzeSentiment(text)
  const language = detectLanguage(text)

  return {
    wordCount,
    charCount: text.length,
    sentenceCount: sentences.length,
    paragraphCount: text.split(/\n\s*\n/).filter((p) => p.trim()).length,
    avgSentenceLength: sentences.length > 0 ? Math.round(wordCount / sentences.length) : 0,
    readingTime: Math.max(1, Math.round(wordCount / 200)),
    keywordDensity,
    sentiment,
    sentimentScore: score,
    confidence,
    language,
    uniqueWords: uniqueWords.size,
    lexicalDiversity: Math.round(lexicalDiversity * 100),
  }
}

const loadHistory = (): AnalysisResult[] => {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return []
    const data = JSON.parse(raw)
    return Array.isArray(data) ? data : []
  } catch {
    return []
  }
}

const saveHistory = (history: AnalysisResult[]) => {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(history.slice(0, MAX_HISTORY)))
  } catch {
    /* ignore */
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

const LANGUAGE_NAMES: Record<string, string> = {
  zh: '中文',
  en: 'English',
  ja: '日本語',
}

const SENTIMENT_LABELS: Record<string, { label: string; color: string; bg: string; icon: string }> = {
  positive: { label: '正面', color: '#10b981', bg: 'rgba(16,185,129,0.15)', icon: '😊' },
  neutral: { label: '中性', color: '#f59e0b', bg: 'rgba(245,158,11,0.15)', icon: '😐' },
  negative: { label: '负面', color: '#ef4444', bg: 'rgba(239,68,68,0.15)', icon: '😟' },
}

const WebContentExtractor: React.FC = () => {
  const theme = useStore((s) => s.resolvedTheme)
  const isDark = theme === 'dark'

  const [urlInput, setUrlInput] = useState('')
  const [loading, setLoading] = useState(false)
  const [progress, setProgress] = useState('')
  const [error, setError] = useState('')
  const [results, setResults] = useState<AnalysisResult[]>(() => loadHistory())
  const [activeId, setActiveId] = useState<string | null>(null)
  const [sidebarOpen, setSidebarOpen] = useState(true)
  const [copiedId, setCopiedId] = useState<string | null>(null)
  const [activeTab, setActiveTab] = useState<'metadata' | 'analysis' | 'tools'>('metadata')
  const [showRawText, setShowRawText] = useState(false)
  const [toast, setToast] = useState<{ msg: string; type: 'success' | 'error' | 'info' } | null>(null)

  useEffect(() => {
    saveHistory(results)
  }, [results])

  useEffect(() => {
    if (!toast) return
    const t = setTimeout(() => setToast(null), 2500)
    return () => clearTimeout(t)
  }, [toast])

  const showToast = useCallback((msg: string, type: 'success' | 'error' | 'info' = 'success') => {
    setToast({ msg, type })
  }, [])

  const activeResult = useMemo(
    () => results.find((r) => r.id === activeId) || null,
    [results, activeId],
  )

  const handleFetch = useCallback(async () => {
    const url = normalizeUrl(urlInput)
    if (!url) {
      setError('请输入有效的 URL')
      return
    }
    setLoading(true)
    setError('')
    setProgress('通过 CORS 代理抓取页面...')

    try {
      const html = await fetchWithProxy(url)
      setProgress('解析页面结构...')

      const doc = new DOMParser().parseFromString(html, 'text/html')
      const metadata = extractMetadata(doc, url)

      setProgress('分析内容...')

      const candidates = [
        'article',
        'main',
        '[role="main"]',
        '.post-content',
        '.article-content',
        '.article-body',
        '.post-body',
        '.entry-content',
        '.content',
        '#content',
        '.story-body',
        '.story-content',
        '.article',
        '.post',
      ]
      let contentEl: Element | null = null
      for (const sel of candidates) {
        contentEl = doc.querySelector(sel)
        if (contentEl) break
      }

      if (!contentEl) {
        const allDivs = doc.querySelectorAll('div, section')
        let maxLen = 0
        allDivs.forEach((el) => {
          const text = (el.textContent || '').trim()
          if (text.length > maxLen && text.length > 200) {
            maxLen = text.length
            contentEl = el
          }
        })
      }

      const plainText = htmlToText(contentEl?.innerHTML || doc.body?.innerHTML || '')
      const analysis = analyzeContent(plainText)
      const summary = summarizeText(plainText)

      const newResult: AnalysisResult = {
        id: uid(),
        url,
        metadata,
        analysis,
        rawHtml: html,
        plainText,
        summary,
        createdAt: Date.now(),
      }

      setResults((prev) => [newResult, ...prev].slice(0, MAX_HISTORY))
      setActiveId(newResult.id)
      setUrlInput('')
      setActiveTab('metadata')
      showToast('分析完成', 'success')
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err)
      setError(`抓取失败：${msg}。请检查 URL 或稍后重试。`)
      showToast('抓取失败', 'error')
    } finally {
      setLoading(false)
      setProgress('')
    }
  }, [urlInput, showToast])

  const copyText = useCallback(async (text: string, id: string) => {
    try {
      await navigator.clipboard.writeText(text)
      setCopiedId(id)
      setTimeout(() => setCopiedId(null), 2000)
      showToast('已复制到剪贴板', 'success')
    } catch {
      showToast('复制失败', 'error')
    }
  }, [showToast])

  const deleteResult = useCallback((id: string) => {
    setResults((prev) => prev.filter((r) => r.id !== id))
    if (activeId === id) setActiveId(null)
  }, [activeId])

  const clearAll = useCallback(() => {
    if (confirm('确定清空所有历史记录？')) {
      setResults([])
      setActiveId(null)
      showToast('已清空', 'info')
    }
  }, [showToast])

  const exportResult = useCallback((r: AnalysisResult) => {
    const lines: string[] = []
    lines.push(`# ${r.metadata.title}`)
    lines.push('')
    lines.push(`> 来源: ${r.url}`)
    lines.push(`> 分析时间: ${new Date(r.createdAt).toLocaleString('zh-CN')}`)
    lines.push('')
    lines.push('## 元数据')
    lines.push(`- 标题: ${r.metadata.title}`)
    lines.push(`- 描述: ${r.metadata.description}`)
    lines.push(`- 关键词: ${r.metadata.keywords.join(', ') || '无'}`)
    lines.push(`- 作者: ${r.metadata.author || '未知'}`)
    lines.push(`- 语言: ${LANGUAGE_NAMES[r.analysis.language] || r.analysis.language}`)
    lines.push('')
    lines.push('## 内容分析')
    lines.push(`- 字数: ${r.analysis.wordCount}`)
    lines.push(`- 字符数: ${r.analysis.charCount}`)
    lines.push(`- 段落数: ${r.analysis.paragraphCount}`)
    lines.push(`- 句子数: ${r.analysis.sentenceCount}`)
    lines.push(`- 阅读时间: ${r.analysis.readingTime} 分钟`)
    lines.push(`- 情感倾向: ${SENTIMENT_LABELS[r.analysis.sentiment].label}`)
    lines.push('')
    lines.push('## 页面结构')
    lines.push(`- H1: ${r.metadata.h1Count}`)
    lines.push(`- H2: ${r.metadata.h2Count}`)
    lines.push(`- H3: ${r.metadata.h3Count}`)
    lines.push(`- H4-H6: ${r.metadata.h4Count + r.metadata.h5Count + r.metadata.h6Count}`)
    lines.push(`- 图片: ${r.metadata.imageCount}`)
    lines.push(`- 链接: ${r.metadata.linkCount}`)
    lines.push('')
    lines.push('## 摘要')
    lines.push(r.summary)
    const md = lines.join('\n')
    const blob = new Blob([md], { type: 'text/markdown' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `${r.metadata.title.replace(/[^\w\u4e00-\u9fa5]+/g, '-').slice(0, 50) || 'web-analysis'}.md`
    a.click()
    URL.revokeObjectURL(url)
    showToast('已导出 Markdown', 'success')
  }, [showToast])

  const convertHtmlToText = useCallback(() => {
    if (!activeResult) return
    copyText(activeResult.plainText, `text-${activeResult.id}`)
  }, [activeResult, copyText])

  const copySummary = useCallback(() => {
    if (!activeResult) return
    copyText(activeResult.summary, `summary-${activeResult.id}`)
  }, [activeResult, copyText])

  const bgGradient = isDark
    ? 'linear-gradient(180deg, #0a0a14 0%, #12121f 100%)'
    : 'linear-gradient(180deg, #f8fafc 0%, #e2e8f0 100%)'

  const textColor = isDark ? '#e0e0e8' : '#1e293b'
  const subTextColor = isDark ? '#94a3b8' : '#64748b'
  const mutedColor = isDark ? '#64748b' : '#94a3b8'
  const borderColor = isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.08)'
  const cardBg = isDark ? 'rgba(25,25,42,0.6)' : 'rgba(255,255,255,0.7)'
  const glassBg = isDark ? 'rgba(20,20,35,0.5)' : 'rgba(255,255,255,0.5)'
  const accentColor = '#8b7cf0'
  const accentGradient = 'linear-gradient(135deg, #8b7cf0, #6c5ce7)'
  const inputBg = isDark ? 'rgba(255,255,255,0.04)' : 'rgba(255,255,255,0.6)'
  const inputBorder = isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)'

  const styles: Record<string, React.CSSProperties> = {
    container: {
      display: 'flex',
      flexDirection: 'column',
      height: '100%',
      width: '100%',
      background: bgGradient,
      color: textColor,
      fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
      fontSize: 14,
      overflow: 'hidden',
    },
    topBar: {
      padding: '14px 20px',
      background: isDark ? 'rgba(0,0,0,0.3)' : 'rgba(255,255,255,0.5)',
      borderBottom: `1px solid ${borderColor}`,
      backdropFilter: 'blur(10px)',
      display: 'flex',
      alignItems: 'center',
      gap: 12,
    },
    inputGroup: {
      display: 'flex',
      alignItems: 'center',
      gap: 10,
      padding: '10px 14px',
      background: inputBg,
      border: `1px solid ${inputBorder}`,
      borderRadius: 10,
      flex: 1,
      maxWidth: 700,
    },
    urlInput: {
      flex: 1,
      background: 'transparent',
      border: 'none',
      outline: 'none',
      color: textColor,
      fontSize: 14,
      fontFamily: 'inherit',
    },
    fetchBtn: {
      display: 'flex',
      alignItems: 'center',
      gap: 6,
      padding: '8px 18px',
      background: accentGradient,
      border: 'none',
      borderRadius: 8,
      color: '#fff',
      cursor: 'pointer',
      fontSize: 13,
      fontWeight: 600,
      transition: 'all 0.2s',
      boxShadow: '0 4px 14px rgba(139,124,240,0.3)',
    },
    disabledBtn: {
      opacity: 0.6,
      cursor: 'not-allowed',
    },
    sidebarToggle: {
      width: 36,
      height: 36,
      background: inputBg,
      border: `1px solid ${inputBorder}`,
      borderRadius: 8,
      color: subTextColor,
      cursor: 'pointer',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
    },
    errorBar: {
      padding: '8px 20px',
      background: 'rgba(239,68,68,0.1)',
      borderBottom: '1px solid rgba(239,68,68,0.4)',
      color: isDark ? '#fca5a5' : '#b91c1c',
      fontSize: 13,
    },
    progressBar: {
      padding: '8px 20px',
      background: isDark ? 'rgba(59,130,246,0.1)' : 'rgba(59,130,246,0.08)',
      borderBottom: '1px solid rgba(59,130,246,0.3)',
      color: isDark ? '#93c5fd' : '#2563eb',
      fontSize: 13,
      display: 'flex',
      alignItems: 'center',
      gap: 8,
    },
    body: {
      flex: 1,
      display: 'flex',
      overflow: 'hidden',
    },
    sidebar: {
      width: 300,
      minWidth: 300,
      background: isDark ? 'rgba(0,0,0,0.25)' : 'rgba(255,255,255,0.4)',
      borderRight: `1px solid ${borderColor}`,
      display: 'flex',
      flexDirection: 'column',
      backdropFilter: 'blur(8px)',
      overflow: 'hidden',
      transition: 'width 0.3s, min-width 0.3s',
    },
    sidebarCollapsed: {
      width: 0,
      minWidth: 0,
      borderRight: 'none',
    },
    sidebarHeader: {
      padding: 12,
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center',
      borderBottom: `1px solid ${borderColor}`,
    },
    sidebarTitle: {
      display: 'flex',
      alignItems: 'center',
      gap: 6,
      fontSize: 13,
      fontWeight: 600,
      color: isDark ? '#c4b5fd' : '#6c5ce7',
    },
    sidebarActions: {
      display: 'flex',
      gap: 4,
    },
    iconBtn: {
      width: 28,
      height: 28,
      background: isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.04)',
      border: `1px solid ${borderColor}`,
      borderRadius: 6,
      color: subTextColor,
      cursor: 'pointer',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
    },
    searchWrapper: {
      padding: '8px 10px',
    },
    searchInputWrapper: {
      display: 'flex',
      alignItems: 'center',
      gap: 6,
      padding: '6px 10px',
      background: inputBg,
      border: `1px solid ${inputBorder}`,
      borderRadius: 6,
    },
    searchInput: {
      flex: 1,
      background: 'transparent',
      border: 'none',
      outline: 'none',
      color: textColor,
      fontSize: 12,
    },
    convList: {
      flex: 1,
      overflowY: 'auto',
      padding: 6,
    },
    emptySidebar: {
      padding: 24,
      textAlign: 'center',
      color: mutedColor,
      fontSize: 12,
      whiteSpace: 'pre-line',
    },
    snapItem: {
      display: 'flex',
      gap: 8,
      padding: 10,
      borderRadius: 10,
      marginBottom: 4,
      cursor: 'pointer',
      border: '1px solid transparent',
      transition: 'all 0.15s',
    },
    snapItemActive: {
      background: isDark ? 'rgba(139,124,240,0.15)' : 'rgba(139,124,240,0.1)',
      borderColor: isDark ? 'rgba(139,124,240,0.4)' : 'rgba(139,124,240,0.3)',
    },
    thumbPlaceholder: {
      width: 44,
      height: 44,
      borderRadius: 8,
      background: isDark ? 'rgba(139,124,240,0.15)' : 'rgba(139,124,240,0.12)',
      color: accentColor,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      flexShrink: 0,
    },
    snapInfo: {
      flex: 1,
      minWidth: 0,
      display: 'flex',
      flexDirection: 'column',
      gap: 3,
    },
    snapTitle: {
      color: isDark ? '#f1f5f9' : '#1e293b',
      fontSize: 12,
      fontWeight: 600,
      overflow: 'hidden',
      textOverflow: 'ellipsis',
      whiteSpace: 'nowrap',
    },
    snapUrl: {
      color: mutedColor,
      fontSize: 11,
      overflow: 'hidden',
      textOverflow: 'ellipsis',
      whiteSpace: 'nowrap',
    },
    snapMeta: {
      display: 'flex',
      gap: 8,
      color: mutedColor,
      fontSize: 10,
    },
    snapActions: {
      display: 'flex',
      flexDirection: 'column',
      gap: 3,
    },
    sidebarFooter: {
      padding: 10,
      borderTop: `1px solid ${borderColor}`,
    },
    statsRow: {
      display: 'flex',
      justifyContent: 'space-between',
      color: mutedColor,
      fontSize: 11,
    },
    main: {
      flex: 1,
      overflowY: 'auto',
      padding: 24,
    },
    emptyMain: {
      height: '100%',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      textAlign: 'center',
      color: subTextColor,
      gap: 8,
    },
    emptyIcon: {
      width: 80,
      height: 80,
      borderRadius: '50%',
      background: isDark
        ? 'linear-gradient(135deg, rgba(139,124,240,0.2), rgba(108,92,231,0.2))'
        : 'linear-gradient(135deg, rgba(139,124,240,0.15), rgba(108,92,231,0.15))',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      color: accentColor,
      marginBottom: 8,
    },
    emptyTitle: {
      color: isDark ? '#f1f5f9' : '#1e293b',
      margin: '8px 0 4px',
      fontSize: 20,
    },
    emptyDesc: {
      color: subTextColor,
      maxWidth: 500,
      lineHeight: 1.6,
      margin: 0,
    },
    featureList: {
      display: 'grid',
      gridTemplateColumns: '1fr 1fr',
      gap: 8,
      marginTop: 20,
      maxWidth: 420,
    },
    featureItem: {
      display: 'flex',
      alignItems: 'center',
      gap: 8,
      padding: '10px 14px',
      background: glassBg,
      border: `1px solid ${borderColor}`,
      borderRadius: 8,
      fontSize: 12,
      color: isDark ? '#cbd5e1' : '#475569',
    },
    detailView: {
      maxWidth: 1100,
      margin: '0 auto',
    },
    card: {
      background: cardBg,
      border: `1px solid ${borderColor}`,
      borderRadius: 16,
      overflow: 'hidden',
      backdropFilter: 'blur(10px)',
      marginBottom: 16,
    },
    cardHeader: {
      padding: 20,
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'flex-start',
      gap: 16,
      borderBottom: `1px solid ${borderColor}`,
      flexWrap: 'wrap',
    },
    cardTitle: {
      fontSize: 20,
      color: isDark ? '#f1f5f9' : '#1e293b',
      margin: 0,
      lineHeight: 1.3,
      wordBreak: 'break-word',
    },
    cardUrl: {
      display: 'inline-flex',
      alignItems: 'center',
      gap: 4,
      color: accentColor,
      fontSize: 12,
      textDecoration: 'none',
      marginTop: 6,
      wordBreak: 'break-all',
    },
    cardActions: {
      display: 'flex',
      gap: 6,
      flexShrink: 0,
    },
    actionBtn: {
      display: 'inline-flex',
      alignItems: 'center',
      gap: 6,
      padding: '7px 12px',
      background: isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.04)',
      border: `1px solid ${borderColor}`,
      borderRadius: 8,
      color: subTextColor,
      cursor: 'pointer',
      fontSize: 12,
      transition: 'all 0.15s',
    },
    metaSection: {
      padding: 20,
    },
    metaRow: {
      display: 'grid',
      gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))',
      gap: 12,
      marginBottom: 20,
    },
    metaCard: {
      display: 'flex',
      alignItems: 'center',
      gap: 10,
      padding: '12px 14px',
      background: glassBg,
      border: `1px solid ${borderColor}`,
      borderRadius: 10,
      borderLeft: '3px solid',
    },
    metaCardIcon: {
      width: 32,
      height: 32,
      borderRadius: 8,
      background: isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.04)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
    },
    metaCardText: {
      flex: 1,
      minWidth: 0,
    },
    metaCardLabel: {
      fontSize: 11,
      color: mutedColor,
      marginBottom: 2,
    },
    metaCardValue: {
      fontSize: 14,
      color: isDark ? '#e2e8f0' : '#1e293b',
      fontWeight: 600,
      overflow: 'hidden',
      textOverflow: 'ellipsis',
      whiteSpace: 'nowrap',
    },
    tabsHeader: {
      display: 'flex',
      gap: 4,
      padding: '8px 12px',
      background: isDark ? 'rgba(0,0,0,0.2)' : 'rgba(0,0,0,0.03)',
      borderBottom: `1px solid ${borderColor}`,
    },
    tabBtn: {
      padding: '8px 18px',
      background: 'transparent',
      border: 'none',
      borderRadius: 8,
      color: subTextColor,
      cursor: 'pointer',
      fontSize: 13,
      fontWeight: 500,
      display: 'flex',
      alignItems: 'center',
      gap: 6,
      transition: 'all 0.15s',
    },
    tabBtnActive: {
      background: accentGradient,
      color: '#fff',
      boxShadow: '0 2px 8px rgba(139,124,240,0.3)',
    },
    tabContent: {
      padding: 20,
    },
    section: {
      marginBottom: 24,
    },
    sectionHeader: {
      display: 'flex',
      alignItems: 'center',
      gap: 10,
      marginBottom: 14,
      flexWrap: 'wrap',
    },
    sectionTitle: {
      fontSize: 15,
      fontWeight: 600,
      color: isDark ? '#f1f5f9' : '#1e293b',
    },
    statGrid: {
      display: 'grid',
      gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))',
      gap: 12,
    },
    statCard: {
      padding: '14px 16px',
      background: glassBg,
      border: `1px solid ${borderColor}`,
      borderRadius: 12,
      textAlign: 'center',
    },
    statValue: {
      fontSize: 28,
      fontWeight: 700,
      background: accentGradient,
      WebkitBackgroundClip: 'text',
      WebkitTextFillColor: 'transparent',
      backgroundClip: 'text',
    },
    statLabel: {
      fontSize: 12,
      color: subTextColor,
      marginTop: 4,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      gap: 4,
    },
    structureBar: {
      display: 'flex',
      height: 28,
      borderRadius: 8,
      overflow: 'hidden',
      background: isDark ? 'rgba(255,255,255,0.04)' : 'rgba(0,0,0,0.04)',
      gap: 2,
    },
    structureSegment: {
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      fontSize: 11,
      fontWeight: 600,
      color: '#fff',
      transition: 'all 0.2s',
      minWidth: 24,
    },
    structureLegend: {
      display: 'flex',
      flexWrap: 'wrap',
      gap: 8,
      marginTop: 10,
    },
    legendItem: {
      display: 'flex',
      alignItems: 'center',
      gap: 6,
      fontSize: 12,
      color: subTextColor,
    },
    legendDot: {
      width: 10,
      height: 10,
      borderRadius: 3,
    },
    keywordsCloud: {
      display: 'flex',
      flexWrap: 'wrap',
      gap: 8,
    },
    keywordChip: {
      display: 'flex',
      alignItems: 'center',
      gap: 6,
      padding: '8px 14px',
      background: isDark ? 'rgba(139,124,240,0.1)' : 'rgba(139,124,240,0.08)',
      border: `1px solid ${isDark ? 'rgba(139,124,240,0.25)' : 'rgba(139,124,240,0.2)'}`,
      borderRadius: 20,
      color: isDark ? '#c4b5fd' : '#6c5ce7',
      fontSize: 13,
      fontWeight: 500,
    },
    keywordBar: {
      height: 4,
      borderRadius: 2,
      background: accentGradient,
      marginTop: 6,
    },
    sentimentCard: {
      padding: '20px',
      background: glassBg,
      border: `1px solid ${borderColor}`,
      borderRadius: 12,
      textAlign: 'center',
    },
    sentimentIcon: {
      fontSize: 48,
      marginBottom: 8,
    },
    sentimentLabel: {
      fontSize: 18,
      fontWeight: 600,
      marginBottom: 4,
    },
    sentimentScore: {
      fontSize: 32,
      fontWeight: 700,
      marginTop: 8,
    },
    sentimentBar: {
      height: 6,
      borderRadius: 3,
      background: isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.06)',
      overflow: 'hidden',
      marginTop: 10,
    },
    sentimentFill: {
      height: '100%',
      borderRadius: 3,
      transition: 'width 0.5s ease',
    },
    summaryBox: {
      padding: '16px 18px',
      background: glassBg,
      border: `1px solid ${borderColor}`,
      borderRadius: 12,
      color: isDark ? '#e2e8f0' : '#334155',
      fontSize: 14,
      lineHeight: 1.8,
    },
    toolActions: {
      display: 'flex',
      gap: 8,
      flexWrap: 'wrap',
      marginTop: 12,
    },
    toolBtn: {
      display: 'inline-flex',
      alignItems: 'center',
      gap: 6,
      padding: '10px 16px',
      background: isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.04)',
      border: `1px solid ${borderColor}`,
      borderRadius: 8,
      color: subTextColor,
      cursor: 'pointer',
      fontSize: 13,
      transition: 'all 0.15s',
    },
    toolBtnPrimary: {
      background: accentGradient,
      color: '#fff',
      border: 'none',
    },
    rawTextArea: {
      width: '100%',
      padding: '16px',
      background: isDark ? 'rgba(0,0,0,0.3)' : 'rgba(0,0,0,0.02)',
      border: `1px solid ${borderColor}`,
      borderRadius: 10,
      color: isDark ? '#94a3b8' : '#475569',
      fontSize: 13,
      lineHeight: 1.8,
      whiteSpace: 'pre-wrap',
      maxHeight: 400,
      overflowY: 'auto',
      fontFamily: 'inherit',
      resize: 'vertical',
    },
    ogGrid: {
      display: 'grid',
      gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
      gap: 12,
    },
    ogCard: {
      padding: '14px',
      background: glassBg,
      border: `1px solid ${borderColor}`,
      borderRadius: 10,
    },
    ogLabel: {
      fontSize: 11,
      color: mutedColor,
      marginBottom: 6,
      display: 'flex',
      alignItems: 'center',
      gap: 4,
    },
    ogValue: {
      fontSize: 13,
      color: isDark ? '#e2e8f0' : '#334155',
      lineHeight: 1.5,
      wordBreak: 'break-word',
    },
    ogImage: {
      width: '100%',
      maxHeight: 180,
      objectFit: 'cover',
      borderRadius: 8,
      marginTop: 8,
    },
    toast: {
      position: 'absolute',
      bottom: 24,
      left: '50%',
      transform: 'translateX(-50%)',
      padding: '10px 20px',
      borderRadius: 10,
      color: '#fff',
      fontSize: 13,
      boxShadow: '0 4px 20px rgba(0,0,0,0.4)',
      zIndex: 100,
    },
    toastSuccess: {
      background: 'linear-gradient(135deg, #10b981, #059669)',
    },
    toastError: {
      background: 'linear-gradient(135deg, #ef4444, #dc2626)',
    },
    toastInfo: {
      background: 'linear-gradient(135deg, #3b82f6, #2563eb)',
    },
  }

  const SENTIMENT = SENTIMENT_LABELS

  const structureData = [
    { label: 'H1', value: activeResult?.metadata.h1Count || 0, color: '#8b7cf0' },
    { label: 'H2', value: activeResult?.metadata.h2Count || 0, color: '#6c5ce7' },
    { label: 'H3', value: activeResult?.metadata.h3Count || 0, color: '#a29bfe' },
    { label: 'H4', value: activeResult?.metadata.h4Count || 0, color: '#b8b0ff' },
    { label: 'H5', value: activeResult?.metadata.h5Count || 0, color: '#c4b5fd' },
    { label: 'H6', value: activeResult?.metadata.h6Count || 0, color: '#ddd6fe' },
  ]
  const totalHeadings = structureData.reduce((sum, s) => sum + s.value, 0)

  return (
    <div style={styles.container}>
      <div style={styles.topBar}>
        <button
          style={styles.sidebarToggle}
          onClick={() => setSidebarOpen((v) => !v)}
          title={sidebarOpen ? '隐藏侧栏' : '显示侧栏'}
        >
          {sidebarOpen ? <PanelLeft size={16} /> : <PanelRight size={16} />}
        </button>
        <div style={styles.inputGroup}>
          <Link2 size={16} color={accentColor} />
          <input
            style={styles.urlInput}
            placeholder="输入网页 URL 进行内容分析，例如 https://example.com/article"
            value={urlInput}
            onChange={(e) => setUrlInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !loading) handleFetch()
            }}
            disabled={loading}
          />
          <button
            style={{ ...styles.fetchBtn, ...(loading ? styles.disabledBtn : {}) }}
            onClick={handleFetch}
            disabled={loading}
          >
            {loading ? (
              <><Loader2 size={14} className="animate-spin" /> 分析中...</>
            ) : (
              <><Sparkles size={14} /> 智能分析</>
            )}
          </button>
        </div>
      </div>

      {error && <div style={styles.errorBar}>{error}</div>}
      {progress && !error && (
        <div style={styles.progressBar}>
          <Loader2 size={12} className="animate-spin" /> {progress}
        </div>
      )}

      <div style={styles.body}>
        <aside
          style={{
            ...styles.sidebar,
            ...(!sidebarOpen ? styles.sidebarCollapsed : {}),
          }}
        >
          <div style={styles.sidebarHeader}>
            <div style={styles.sidebarTitle}>
              <History size={14} /> 历史记录
            </div>
            <div style={styles.sidebarActions}>
              <button
                style={styles.iconBtn}
                onClick={clearAll}
                title="清空全部"
                disabled={results.length === 0}
              >
                <Trash2 size={12} />
              </button>
            </div>
          </div>

          <div style={styles.searchWrapper}>
            <div style={styles.searchInputWrapper}>
              <Search size={12} color={mutedColor} />
              <input
                style={styles.searchInput}
                placeholder={`共 ${results.length} 条记录`}
                disabled
              />
            </div>
          </div>

          <div style={styles.convList}>
            {results.length === 0 ? (
              <div style={styles.emptySidebar}>
                暂无记录
                {'\n'}输入 URL 开始分析
              </div>
            ) : (
              results.map((r) => (
                <div
                  key={r.id}
                  style={{
                    ...styles.snapItem,
                    ...(r.id === activeId ? styles.snapItemActive : {}),
                  }}
                  onClick={() => setActiveId(r.id)}
                >
                  <div style={styles.thumbPlaceholder}>
                    <FileText size={18} />
                  </div>
                  <div style={styles.snapInfo}>
                    <div style={styles.snapTitle}>
                      {r.metadata.title || r.url}
                    </div>
                    <div style={styles.snapUrl}>{r.url}</div>
                    <div style={styles.snapMeta}>
                      <span>{formatDate(r.createdAt)}</span>
                      <span>{r.analysis.wordCount} 字</span>
                    </div>
                  </div>
                  <div style={styles.snapActions} onClick={(e) => e.stopPropagation()}>
                    <button
                      style={{ ...styles.iconBtn, width: 24, height: 24 }}
                      onClick={() => deleteResult(r.id)}
                      title="删除"
                    >
                      <Trash2 size={11} />
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>

          <div style={styles.sidebarFooter}>
            <div style={styles.statsRow}>
              <span><BarChart3 size={12} /> 共 {results.length} 条</span>
              <span>最近 {results.length > 0 ? formatDate(results[0].createdAt) : '-'}</span>
            </div>
          </div>
        </aside>

        <main style={styles.main}>
          {!activeResult ? (
            <div style={styles.emptyMain}>
              <div style={styles.emptyIcon}><Sparkles size={48} /></div>
              <h2 style={styles.emptyTitle}>WebContentExtractor</h2>
              <p style={styles.emptyDesc}>
                专业的网页内容提取与分析工具
                <br />元数据提取 · 内容分析 · 情感检测 · 文本处理
              </p>
              <div style={styles.featureList}>
                <div style={styles.featureItem}>
                  <span style={{ color: accentColor }}><Globe size={16} /></span>
                  <span>网页元数据提取</span>
                </div>
                <div style={styles.featureItem}>
                  <span style={{ color: accentColor }}><BarChart3 size={16} /></span>
                  <span>内容结构分析</span>
                </div>
                <div style={styles.featureItem}>
                  <span style={{ color: accentColor }}><Heart size={16} /></span>
                  <span>情感倾向检测</span>
                </div>
                <div style={styles.featureItem}>
                  <span style={{ color: accentColor }}><Hash size={16} /></span>
                  <span>关键词密度分析</span>
                </div>
                <div style={styles.featureItem}>
                  <span style={{ color: accentColor }}><Languages size={16} /></span>
                  <span>语言自动检测</span>
                </div>
                <div style={styles.featureItem}>
                  <span style={{ color: accentColor }}><FileText size={16} /></span>
                  <span>文本摘要生成</span>
                </div>
              </div>
            </div>
          ) : (
            <div style={styles.detailView}>
              <div style={styles.card}>
                <div style={styles.cardHeader}>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <h1 style={styles.cardTitle}>{activeResult.metadata.title || '无标题'}</h1>
                    <a
                      href={activeResult.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      style={styles.cardUrl}
                    >
                      <ExternalLink size={12} />
                      {activeResult.url}
                    </a>
                  </div>
                  <div style={styles.cardActions}>
                    <button
                      style={styles.actionBtn}
                      onClick={() => copyText(activeResult.plainText, `text-${activeResult.id}`)}
                    >
                      {copiedId === `text-${activeResult.id}` ? <Check size={14} color="#10b981" /> : <Copy size={14} />}
                      {copiedId === `text-${activeResult.id}` ? '已复制' : '复制文本'}
                    </button>
                    <button
                      style={styles.actionBtn}
                      onClick={() => exportResult(activeResult)}
                    >
                      <Download size={14} /> 导出
                    </button>
                  </div>
                </div>

                <div style={styles.tabsHeader}>
                  <button
                    style={{
                      ...styles.tabBtn,
                      ...(activeTab === 'metadata' ? styles.tabBtnActive : {}),
                    }}
                    onClick={() => setActiveTab('metadata')}
                  >
                    <Globe size={14} /> 元数据
                  </button>
                  <button
                    style={{
                      ...styles.tabBtn,
                      ...(activeTab === 'analysis' ? styles.tabBtnActive : {}),
                    }}
                    onClick={() => setActiveTab('analysis')}
                  >
                    <BarChart3 size={14} /> 内容分析
                  </button>
                  <button
                    style={{
                      ...styles.tabBtn,
                      ...(activeTab === 'tools' ? styles.tabBtnActive : {}),
                    }}
                    onClick={() => setActiveTab('tools')}
                  >
                    <Wrench size={14} /> 文本工具
                  </button>
                </div>

                <div style={styles.tabContent}>
                  {activeTab === 'metadata' && (
                    <div>
                      <div style={styles.section}>
                        <div style={styles.sectionHeader}>
                          <Globe size={16} color={accentColor} />
                          <span style={styles.sectionTitle}>基础信息</span>
                        </div>
                        <div style={styles.metaRow}>
                          <MetaCard
                            icon={<Type size={14} />}
                            label="标题"
                            value={activeResult.metadata.title || '未知'}
                            color={accentColor}
                          />
                          <MetaCard
                            icon={<FileText size={14} />}
                            label="描述"
                            value={activeResult.metadata.description || '未知'}
                            color="#3b82f6"
                          />
                          <MetaCard
                            icon={<User size={14} color="#10b981" />}
                            label="作者"
                            value={activeResult.metadata.author || '未知'}
                            color="#10b981"
                          />
                          <MetaCard
                            icon={<Languages size={14} />}
                            label="语言"
                            value={LANGUAGE_NAMES[activeResult.analysis.language] || activeResult.analysis.language}
                            color="#f59e0b"
                          />
                        </div>
                      </div>

                      <div style={styles.section}>
                        <div style={styles.sectionHeader}>
                          <Tag size={16} color={accentColor} />
                          <span style={styles.sectionTitle}>关键词</span>
                        </div>
                        <div style={styles.keywordsCloud}>
                          {activeResult.metadata.keywords.length > 0 ? (
                            activeResult.metadata.keywords.map((kw, i) => (
                              <div key={i} style={styles.keywordChip}>
                                <span>{kw}</span>
                              </div>
                            ))
                          ) : (
                            <span style={{ color: mutedColor, fontSize: 13 }}>页面未设置 keywords meta 标签</span>
                          )}
                        </div>
                      </div>

                      <div style={styles.section}>
                        <div style={styles.sectionHeader}>
                          <Hash size={16} color={accentColor} />
                          <span style={styles.sectionTitle}>页面结构 (H1-H6)</span>
                        </div>
                        {totalHeadings > 0 ? (
                          <>
                            <div style={styles.structureBar}>
                              {structureData.map((s) => (
                                s.value > 0 ? (
                                  <div
                                    key={s.label}
                                    style={{
                                      ...styles.structureSegment,
                                      width: `${(s.value / totalHeadings) * 100}%`,
                                      background: s.color,
                                    }}
                                    title={`${s.label}: ${s.value}`}
                                  >
                                    {s.value > 1 ? `${s.label} ${s.value}` : s.label}
                                  </div>
                                ) : null
                              ))}
                            </div>
                            <div style={styles.structureLegend}>
                              {structureData.map((s) => (
                                <div key={s.label} style={styles.legendItem}>
                                  <div style={{ ...styles.legendDot, background: s.color }} />
                                  <span>{s.label}: {s.value}</span>
                                </div>
                              ))}
                            </div>
                          </>
                        ) : (
                          <span style={{ color: mutedColor, fontSize: 13 }}>未检测到标题标签</span>
                        )}
                        <div style={{ ...styles.metaRow, marginTop: 16 }}>
                          <MetaCard
                            icon={<ImageIcon size={14} />}
                            label="图片数量"
                            value={`${activeResult.metadata.imageCount}`}
                            color="#f59e0b"
                          />
                          <MetaCard
                            icon={<Link2 size={14} />}
                            label="链接数量"
                            value={`${activeResult.metadata.linkCount}`}
                            color="#3b82f6"
                          />
                          <MetaCard
                            icon={<AlignLeft size={14} />}
                            label="段落数量"
                            value={`${activeResult.metadata.paragraphCount}`}
                            color="#10b981"
                          />
                          <MetaCard
                            icon={<FileText size={14} />}
                            label="H1 标题"
                            value={`${activeResult.metadata.h1Count}`}
                            color={accentColor}
                          />
                        </div>
                      </div>

                      {(activeResult.metadata.ogTitle || activeResult.metadata.ogImage) && (
                        <div style={styles.section}>
                          <div style={styles.sectionHeader}>
                            <Zap size={16} color={accentColor} />
                            <span style={styles.sectionTitle}>Open Graph / Twitter Card</span>
                          </div>
                          <div style={styles.ogGrid}>
                            {activeResult.metadata.ogTitle && (
                              <div style={styles.ogCard}>
                                <div style={styles.ogLabel}>
                                  <span style={{ width: 8, height: 8, borderRadius: 4, background: '#ef4444', display: 'inline-block' }} />
                                  og:title
                                </div>
                                <div style={styles.ogValue}>{activeResult.metadata.ogTitle}</div>
                              </div>
                            )}
                            {activeResult.metadata.ogDescription && (
                              <div style={styles.ogCard}>
                                <div style={styles.ogLabel}>
                                  <span style={{ width: 8, height: 8, borderRadius: 4, background: '#f59e0b', display: 'inline-block' }} />
                                  og:description
                                </div>
                                <div style={styles.ogValue}>{activeResult.metadata.ogDescription}</div>
                              </div>
                            )}
                            {activeResult.metadata.ogType && (
                              <div style={styles.ogCard}>
                                <div style={styles.ogLabel}>
                                  <span style={{ width: 8, height: 8, borderRadius: 4, background: '#3b82f6', display: 'inline-block' }} />
                                  og:type
                                </div>
                                <div style={styles.ogValue}>{activeResult.metadata.ogType}</div>
                              </div>
                            )}
                            {activeResult.metadata.ogSiteName && (
                              <div style={styles.ogCard}>
                                <div style={styles.ogLabel}>
                                  <span style={{ width: 8, height: 8, borderRadius: 4, background: '#10b981', display: 'inline-block' }} />
                                  og:site_name
                                </div>
                                <div style={styles.ogValue}>{activeResult.metadata.ogSiteName}</div>
                              </div>
                            )}
                            {activeResult.metadata.twitterCard && (
                              <div style={styles.ogCard}>
                                <div style={styles.ogLabel}>
                                  <span style={{ width: 8, height: 8, borderRadius: 4, background: '#8b7cf0', display: 'inline-block' }} />
                                  twitter:card
                                </div>
                                <div style={styles.ogValue}>{activeResult.metadata.twitterCard}</div>
                              </div>
                            )}
                          </div>
                          {activeResult.metadata.ogImage && (
                            <div style={{ marginTop: 12 }}>
                              <img
                                src={activeResult.metadata.ogImage}
                                alt="OG Image"
                                style={styles.ogImage}
                                onError={(e) => {
                                  ;(e.target as HTMLImageElement).style.display = 'none'
                                }}
                              />
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  )}

                  {activeTab === 'analysis' && (
                    <div>
                      <div style={styles.section}>
                        <div style={styles.sectionHeader}>
                          <BarChart3 size={16} color={accentColor} />
                          <span style={styles.sectionTitle}>统计数据</span>
                        </div>
                        <div style={styles.statGrid}>
                          <div style={styles.statCard}>
                            <div style={styles.statValue}>{activeResult.analysis.wordCount}</div>
                            <div style={styles.statLabel}><Type size={12} /> 字数</div>
                          </div>
                          <div style={styles.statCard}>
                            <div style={styles.statValue}>{activeResult.analysis.charCount}</div>
                            <div style={styles.statLabel}><FileText size={12} /> 字符数</div>
                          </div>
                          <div style={styles.statCard}>
                            <div style={styles.statValue}>{activeResult.analysis.sentenceCount}</div>
                            <div style={styles.statLabel}><AlignLeft size={12} /> 句子数</div>
                          </div>
                          <div style={styles.statCard}>
                            <div style={styles.statValue}>{activeResult.analysis.paragraphCount}</div>
                            <div style={styles.statLabel}><Hash size={12} /> 段落数</div>
                          </div>
                          <div style={styles.statCard}>
                            <div style={styles.statValue}>{activeResult.analysis.readingTime}</div>
                            <div style={styles.statLabel}><Clock size={12} /> 阅读分钟</div>
                          </div>
                          <div style={styles.statCard}>
                            <div style={styles.statValue}>{activeResult.analysis.uniqueWords}</div>
                            <div style={styles.statLabel}><Sparkles size={12} /> 独特词汇</div>
                          </div>
                        </div>
                      </div>

                      <div style={styles.section}>
                        <div style={styles.sectionHeader}>
                          <Heart size={16} color={accentColor} />
                          <span style={styles.sectionTitle}>情感分析</span>
                        </div>
                        <div style={{ display: 'grid', gridTemplateColumns: '200px 1fr', gap: 16 }}>
                          <div style={{
                            ...styles.sentimentCard,
                            borderColor: SENTIMENT[activeResult.analysis.sentiment].color,
                          }}>
                            <div style={{ fontSize: 48 }}>
                              {SENTIMENT[activeResult.analysis.sentiment].icon}
                            </div>
                            <div style={{
                              ...styles.sentimentLabel,
                              color: SENTIMENT[activeResult.analysis.sentiment].color,
                            }}>
                              {SENTIMENT[activeResult.analysis.sentiment].label}
                            </div>
                            <div style={{
                              ...styles.sentimentScore,
                              color: SENTIMENT[activeResult.analysis.sentiment].color,
                            }}>
                              {activeResult.analysis.sentimentScore}
                            </div>
                            <div style={styles.sentimentBar}>
                              <div style={{
                                ...styles.sentimentFill,
                                width: `${activeResult.analysis.sentimentScore}%`,
                                background: SENTIMENT[activeResult.analysis.sentiment].color,
                              }} />
                            </div>
                            <div style={{ ...styles.statLabel, marginTop: 8 }}>
                              置信度: {activeResult.analysis.confidence}%
                            </div>
                          </div>
                          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                              <ThumbsUp size={16} color="#10b981" />
                              <span style={{ color: subTextColor, fontSize: 13 }}>正面词汇比例</span>
                              <span style={{ marginLeft: 'auto', color: '#10b981', fontWeight: 600 }}>
                                {activeResult.analysis.sentimentScore}%
                              </span>
                            </div>
                            <div style={{ height: 6, borderRadius: 3, background: isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.06)' }}>
                              <div style={{ height: '100%', width: `${activeResult.analysis.sentimentScore}%`, borderRadius: 3, background: '#10b981', transition: 'width 0.5s ease' }} />
                            </div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                              <ThumbsDown size={16} color="#ef4444" />
                              <span style={{ color: subTextColor, fontSize: 13 }}>负面词汇比例</span>
                              <span style={{ marginLeft: 'auto', color: '#ef4444', fontWeight: 600 }}>
                                {100 - activeResult.analysis.sentimentScore}%
                              </span>
                            </div>
                            <div style={{ height: 6, borderRadius: 3, background: isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.06)' }}>
                              <div style={{ height: '100%', width: `${100 - activeResult.analysis.sentimentScore}%`, borderRadius: 3, background: '#ef4444', transition: 'width 0.5s ease' }} />
                            </div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginTop: 6 }}>
                              <Meh size={16} color="#f59e0b" />
                              <span style={{ color: subTextColor, fontSize: 13 }}>平均句长</span>
                              <span style={{ marginLeft: 'auto', color: '#f59e0b', fontWeight: 600 }}>
                                {activeResult.analysis.avgSentenceLength} 词/句
                              </span>
                            </div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                              <BookOpen size={16} color="#3b82f6" />
                              <span style={{ color: subTextColor, fontSize: 13 }}>词汇多样性</span>
                              <span style={{ marginLeft: 'auto', color: '#3b82f6', fontWeight: 600 }}>
                                {activeResult.analysis.lexicalDiversity}%
                              </span>
                            </div>
                          </div>
                        </div>
                      </div>

                      <div style={styles.section}>
                        <div style={styles.sectionHeader}>
                          <Hash size={16} color={accentColor} />
                          <span style={styles.sectionTitle}>关键词密度</span>
                        </div>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                          {activeResult.analysis.keywordDensity.map((kw) => (
                            <div key={kw.word} style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                              <span style={{ width: 100, fontSize: 13, color: isDark ? '#e2e8f0' : '#334155', fontWeight: 500 }}>
                                {kw.word}
                              </span>
                              <div style={{ flex: 1, height: 8, borderRadius: 4, background: isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.04)' }}>
                                <div style={{
                                  height: '100%',
                                  width: `${Math.min(kw.density * 20, 100)}%`,
                                  borderRadius: 4,
                                  background: accentGradient,
                                  transition: 'width 0.5s ease',
                                }} />
                              </div>
                              <span style={{ width: 80, textAlign: 'right', fontSize: 12, color: subTextColor }}>
                                {kw.count} 次 · {kw.density.toFixed(2)}%
                              </span>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  )}

                  {activeTab === 'tools' && (
                    <div>
                      <div style={styles.section}>
                        <div style={styles.sectionHeader}>
                          <Lightbulb size={16} color={accentColor} />
                          <span style={styles.sectionTitle}>智能摘要</span>
                        </div>
                        <div style={styles.summaryBox}>
                          {activeResult.summary || '内容不足，无法生成摘要'}
                        </div>
                        <div style={styles.toolActions}>
                          <button
                            style={{ ...styles.toolBtn, ...styles.toolBtnPrimary }}
                            onClick={copySummary}
                            disabled={!activeResult.summary}
                          >
                            {copiedId === `summary-${activeResult.id}` ? <Check size={14} color="#10b981" /> : <Copy size={14} />}
                            {copiedId === `summary-${activeResult.id}` ? '已复制' : '复制摘要'}
                          </button>
                        </div>
                      </div>

                      <div style={styles.section}>
                        <div style={styles.sectionHeader}>
                          <Languages size={16} color={accentColor} />
                          <span style={styles.sectionTitle}>语言检测</span>
                        </div>
                        <div style={{ ...styles.summaryBox, display: 'flex', alignItems: 'center', gap: 12 }}>
                          <Globe size={24} color={accentColor} />
                          <div>
                            <div style={{ fontSize: 16, fontWeight: 600 }}>
                              {LANGUAGE_NAMES[activeResult.analysis.language] || activeResult.analysis.language}
                            </div>
                            <div style={{ fontSize: 12, color: subTextColor }}>
                              检测基于字符分布分析
                            </div>
                          </div>
                        </div>
                      </div>

                      <div style={styles.section}>
                        <div style={{ ...styles.sectionHeader, cursor: 'pointer' }} onClick={() => setShowRawText((v) => !v)}>
                          <FileText size={16} color={accentColor} />
                          <span style={styles.sectionTitle}>HTML 转纯文本</span>
                          {showRawText ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                        </div>
                        {showRawText && (
                          <>
                            <textarea
                              style={styles.rawTextArea}
                              value={activeResult.plainText}
                              readOnly
                            />
                            <div style={styles.toolActions}>
                              <button
                                style={{ ...styles.toolBtn, ...styles.toolBtnPrimary }}
                                onClick={convertHtmlToText}
                              >
                                {copiedId === `text-${activeResult.id}` ? <Check size={14} color="#10b981" /> : <Copy size={14} />}
                                {copiedId === `text-${activeResult.id}` ? '已复制' : '复制纯文本'}
                              </button>
                              <button
                                style={styles.toolBtn}
                                onClick={() => copyText(activeResult.rawHtml, `html-${activeResult.id}`)}
                              >
                                {copiedId === `html-${activeResult.id}` ? <Check size={14} color="#10b981" /> : <FileText size={14} />}
                                {copiedId === `html-${activeResult.id}` ? '已复制' : '复制 HTML'}
                              </button>
                            </div>
                          </>
                        )}
                      </div>

                      <div style={styles.section}>
                        <div style={styles.sectionHeader}>
                          <Zap size={16} color={accentColor} />
                          <span style={styles.sectionTitle}>快速操作</span>
                        </div>
                        <div style={styles.toolActions}>
                          <button
                            style={{ ...styles.toolBtn, ...styles.toolBtnPrimary }}
                            onClick={() => copyText(activeResult.metadata.title + '\n' + activeResult.metadata.description, `meta-${activeResult.id}`)}
                          >
                            <Copy size={14} /> 复制元信息
                          </button>
                          <button
                            style={styles.toolBtn}
                            onClick={() => copyText(activeResult.summary + '\n\n' + activeResult.plainText.slice(0, 500), `all-${activeResult.id}`)}
                          >
                            <Download size={14} /> 复制全部
                          </button>
                          <button
                            style={styles.toolBtn}
                            onClick={() => exportResult(activeResult)}
                          >
                            <Download size={14} /> 导出 Markdown
                          </button>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}
        </main>
      </div>

      {toast && (
        <div
          style={{
            ...styles.toast,
            ...(toast.type === 'success' ? styles.toastSuccess : {}),
            ...(toast.type === 'error' ? styles.toastError : {}),
            ...(toast.type === 'info' ? styles.toastInfo : {}),
          }}
        >
          {toast.msg}
        </div>
      )}
    </div>
  )
}

const MetaCard: React.FC<{
  icon: React.ReactNode
  label: string
  value: string
  color: string
}> = ({ icon, label, value, color }) => (
  <div style={{ ...styles_metaCard, borderColor: color, minWidth: 0 }}>
    <div style={{ ...styles_metaCardIcon, color }}>{icon}</div>
    <div style={styles_metaCardText}>
      <div style={styles_metaCardLabel}>{label}</div>
      <div style={styles_metaCardValue} title={value}>{value}</div>
    </div>
  </div>
)

const ImageIcon: React.FC<{ size?: number }> = ({ size = 14 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
    <circle cx="8.5" cy="8.5" r="1.5" />
    <polyline points="21 15 16 10 5 21" />
  </svg>
)

const User: React.FC<{ size?: number; color?: string }> = ({ size = 14, color }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color || 'currentColor'} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
    <circle cx="12" cy="7" r="4" />
  </svg>
)

const styles_metaCard: React.CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  gap: 10,
  padding: '12px 14px',
  background: 'rgba(20,20,35,0.5)',
  border: '1px solid rgba(255,255,255,0.08)',
  borderRadius: 10,
  borderLeft: '3px solid',
}

const styles_metaCardIcon: React.CSSProperties = {
  width: 32,
  height: 32,
  borderRadius: 8,
  background: 'rgba(255,255,255,0.05)',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  flexShrink: 0,
}

const styles_metaCardText: React.CSSProperties = {
  flex: 1,
  minWidth: 0,
}

const styles_metaCardLabel: React.CSSProperties = {
  fontSize: 11,
  color: '#64748b',
  marginBottom: 2,
}

const styles_metaCardValue: React.CSSProperties = {
  fontSize: 14,
  color: '#e2e8f0',
  fontWeight: 600,
  overflow: 'hidden',
  textOverflow: 'ellipsis',
  whiteSpace: 'nowrap',
}

export default memo(WebContentExtractor)
