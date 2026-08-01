import React, { useState, useEffect, useMemo, useCallback, memo } from 'react'
import {
  Link2,
  Sparkles,
  FileText,
  Copy,
  Check,
  Star,
  Trash2,
  History,
  Download,
  Languages,
  Eye,
  Tag,
  BarChart3,
  Loader2,
  ExternalLink,
  BookOpen,
  Clock,
  Search,
  ChevronDown,
  ChevronUp,
  Highlighter,
  Globe,
} from 'lucide-react'

interface Summary {
  id: string
  url: string
  title: string
  description: string
  ogImage: string
  ogSiteName: string
  author: string
  content: string
  shortSummary: string
  mediumSummary: string
  detailedSummary: string
  keywords: { word: string; weight: number }[]
  readingTime: number
  difficulty: 'easy' | 'medium' | 'hard'
  difficultyScore: number
  translatedSummary?: string
  translatedLang?: string
  tags: string[]
  favorite: boolean
  createdAt: number
}

const STORAGE_KEY = 'weblinux-websummarizer-history'
const MAX_HISTORY = 50

const CORS_PROXIES = [
  (url: string) => `https://corsproxy.io/?${encodeURIComponent(url)}`,
  (url: string) => `https://api.allorigins.win/raw?url=${encodeURIComponent(url)}`,
  (url: string) => `https://api.codetabs.com/v1/proxy?quest=${encodeURIComponent(url)}`,
]

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
  '如何', '因为', '所以', '但是', '如果', '虽然', '然而', '而且',
])

const GENRE_EXPERT_WORDS: Record<string, Set<string>> = {
  tech: new Set(['algorithm', 'software', 'computer', 'programming', 'api', 'cloud', 'ai', 'machine', 'learning', 'data', 'system', 'network', 'security', 'database', 'code', 'developer', 'framework', 'server', 'client', 'html', 'css', 'javascript', 'python', 'react', 'vue', 'angular', 'serverless', 'docker', 'kubernetes', 'devops', 'agile', 'git', 'version', 'repository', 'debug', 'function', 'variable', 'class', 'object']),
  business: new Set(['market', 'business', 'company', 'industry', 'economic', 'finance', 'investment', 'strategy', 'management', 'profit', 'growth', 'revenue', 'customer', 'product', 'service', 'competitor', 'innovation', 'startup', 'entrepreneur', 'marketing', 'sales', 'revenue', 'cost', 'budget', 'roi', 'kpi', 'stakeholder', 'partnership']),
  science: new Set(['research', 'study', 'analysis', 'theory', 'experiment', 'data', 'hypothesis', 'methodology', 'finding', 'result', 'conclusion', 'science', 'scientific', 'researcher', 'peer', 'review', 'journal', 'publication', 'citation', 'laboratory', 'physics', 'chemistry', 'biology', 'molecule', 'cell', 'organism', 'quantum', 'relativistic']),
  health: new Set(['health', 'medical', 'clinical', 'disease', 'treatment', 'patient', 'hospital', 'medicine', 'surgery', 'diagnosis', 'symptom', 'therapy', 'drug', 'pharmaceutical', 'biological', 'wellness', 'fitness', 'nutrition', 'mental', 'physical', 'infection', 'chronic', 'acute', 'prevention']),
  sports: new Set(['game', 'match', 'team', 'player', 'score', 'tournament', 'championship', 'league', 'season', 'coach', 'strategy', 'performance', 'record', 'victory', 'defeat', 'penalty', 'referee', 'stadium', 'olympic', 'professional']),
}

const loadHistory = (): Summary[] => {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return []
    const data = JSON.parse(raw)
    return Array.isArray(data) ? data : []
  } catch {
    return []
  }
}

const saveHistory = (history: Summary[]) => {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(history.slice(0, MAX_HISTORY)))
  } catch {
    /* ignore */
  }
}

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

interface ExtractedData {
  title: string
  description: string
  ogImage: string
  ogSiteName: string
  author: string
  content: string
}

const extractFromHtml = (html: string): ExtractedData => {
  const doc = new DOMParser().parseFromString(html, 'text/html')

  const title =
    doc.querySelector('meta[property="og:title"]')?.getAttribute('content') ||
    doc.querySelector('meta[name="twitter:title"]')?.getAttribute('content') ||
    doc.querySelector('title')?.textContent?.trim() ||
    ''

  const description =
    doc.querySelector('meta[property="og:description"]')?.getAttribute('content') ||
    doc.querySelector('meta[name="twitter:description"]')?.getAttribute('content') ||
    doc.querySelector('meta[name="description"]')?.getAttribute('content') ||
    ''

  const ogImage =
    doc.querySelector('meta[property="og:image"]')?.getAttribute('content') ||
    doc.querySelector('meta[name="twitter:image"]')?.getAttribute('content') ||
    ''

  const ogSiteName =
    doc.querySelector('meta[property="og:site_name"]')?.getAttribute('content') ||
    ''

  const author =
    doc.querySelector('meta[name="author"]')?.getAttribute('content') ||
    doc.querySelector('meta[property="article:author"]')?.getAttribute('content') ||
    doc.querySelector('meta[name="twitter:creator"]')?.getAttribute('content')?.replace('@', '') ||
    ''

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
    'article[itemprop="articleBody"]',
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

  const content = htmlToText(contentEl?.innerHTML || doc.body?.innerHTML || '')

  return {
    title: title.trim(),
    description: description.trim(),
    ogImage: ogImage.trim(),
    ogSiteName: ogSiteName.trim(),
    author: author.trim(),
    content,
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

const summarizeText = (text: string, level: 'short' | 'medium' | 'detailed'): string => {
  const sentences = splitIntoSentences(text)
  if (sentences.length === 0) return ''

  const counts = { short: 2, medium: 5, detailed: 10 }
  const count = Math.min(counts[level], sentences.length)

  if (level === 'detailed' && sentences.length > count) {
    const scored = sentences.map((s, i) => ({
      s,
      i,
      score: s.length + (i < 3 ? 20 : 0) + (s.includes('：') || s.includes(':') ? 10 : 0),
    }))
    scored.sort((a, b) => b.score - a.score)
    const top = scored.slice(0, count).sort((a, b) => a.i - b.i)
    return top.map((t) => t.s).join(' ')
  }

  return sentences.slice(0, count).join(' ')
}

const extractKeywords = (text: string): { word: string; weight: number }[] => {
  const words = text.toLowerCase().match(/[\p{L}][\p{L}\d]{2,}/gu) || []
  const wordTotal = words.length
  if (wordTotal === 0) return []

  const freq = new Map<string, number>()
  for (const w of words) {
    if (STOP_WORDS.has(w)) continue
    if (w.length < 2) continue
    freq.set(w, (freq.get(w) || 0) + 1)
  }

  const scored = Array.from(freq.entries())
    .map(([word, count]) => {
      let score = count / wordTotal
      for (const expertWords of Object.values(GENRE_EXPERT_WORDS)) {
        if (expertWords.has(word)) score += 0.15
      }
      if (word.length > 6) score += 0.05
      return { word, weight: Math.min(score * 100, 100) }
    })
    .sort((a, b) => b.weight - a.weight)

  return scored.slice(0, 10)
}

const extractTags = (text: string): string[] => {
  const keywords = extractKeywords(text)
  return keywords.slice(0, 5).map((k) => k.word)
}

const analyzeDifficulty = (text: string): { level: 'easy' | 'medium' | 'hard'; score: number; readingTime: number } => {
  const sentences = splitIntoSentences(text)
  if (sentences.length === 0) {
    return { level: 'easy', score: 0, readingTime: 0 }
  }

  const words = text.match(/[\p{L}]+/gu) || []
  const wordCount = words.length
  const avgSentenceLen = wordCount / Math.max(sentences.length, 1)

  let complexWordRatio = 0
  if (wordCount > 0) {
    const complexWords = words.filter((w) => w.length > 6).length
    complexWordRatio = complexWords / wordCount
  }

  const uniqueWords = new Set(words.map((w) => w.toLowerCase()))
  const lexicalDiversity = uniqueWords.size / Math.max(wordCount, 1)

  let score = 30
  score += Math.min(avgSentenceLen * 1.2, 40)
  score += complexWordRatio * 60
  score += lexicalDiversity * 20
  score = Math.min(score, 100)

  const level = score < 35 ? 'easy' : score < 65 ? 'medium' : 'hard'
  const readingTime = Math.max(1, Math.round(wordCount / 200))

  return { level, score: Math.round(score), readingTime }
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

const translateText = async (
  text: string,
  fromLang: string,
  toLang: string,
): Promise<string> => {
  const langPair = `${fromLang}|${toLang}`
  const url = `https://api.mymemory.translated.net/get?q=${encodeURIComponent(text)}&langpair=${langPair}`
  try {
    const res = await fetch(url)
    if (!res.ok) throw new Error(`HTTP ${res.status}`)
    const data = await res.json()
    if (data.responseStatus === 200 && data.responseData?.translatedText) {
      return String(data.responseData.translatedText)
    }
    throw new Error('翻译 API 返回异常')
  } catch {
    return `[${toLang}] ${text}`
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

const DIFFICULTY_LABELS: Record<string, { label: string; color: string; bg: string }> = {
  easy: { label: '简单', color: '#10b981', bg: 'rgba(16,185,129,0.15)' },
  medium: { label: '中等', color: '#f59e0b', bg: 'rgba(245,158,11,0.15)' },
  hard: { label: '困难', color: '#ef4444', bg: 'rgba(239,68,68,0.15)' },
}

const WebSummarizer: React.FC = () => {
  const [urlInput, setUrlInput] = useState('')
  const [loading, setLoading] = useState(false)
  const [progress, setProgress] = useState('')
  const [error, setError] = useState('')
  const [summaries, setSummaries] = useState<Summary[]>(() => loadHistory())
  const [activeId, setActiveId] = useState<string | null>(null)
  const [search, setSearch] = useState('')
  const [filterFav, setFilterFav] = useState(false)
  const [copiedId, setCopiedId] = useState<string | null>(null)
  const [activeLevel, setActiveLevel] = useState<'short' | 'medium' | 'detailed'>('medium')
  const [translating, setTranslating] = useState(false)
  const [showFullContent, setShowFullContent] = useState(false)
  const [toast, setToast] = useState<{ msg: string; type: 'success' | 'error' | 'info' } | null>(null)

  useEffect(() => {
    saveHistory(summaries)
  }, [summaries])

  useEffect(() => {
    if (!toast) return
    const t = setTimeout(() => setToast(null), 2500)
    return () => clearTimeout(t)
  }, [toast])

  const showToast = useCallback((msg: string, type: 'success' | 'error' | 'info' = 'success') => {
    setToast({ msg, type })
  }, [])

  const activeSummary = useMemo(
    () => summaries.find((s) => s.id === activeId) || null,
    [summaries, activeId],
  )

  const filteredSummaries = useMemo(() => {
    return summaries.filter((s) => {
      if (filterFav && !s.favorite) return false
      if (search.trim()) {
        const q = search.trim().toLowerCase()
        const hay = (s.url + ' ' + s.title + ' ' + (s.description || '') + ' ' + s.tags.join(' ')).toLowerCase()
        if (!hay.includes(q)) return false
      }
      return true
    })
  }, [summaries, filterFav, search])

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
      setProgress('解析页面元数据...')

      const data = extractFromHtml(html)
      setProgress('生成摘要...')

      const shortSummary = summarizeText(data.content, 'short')
      const mediumSummary = summarizeText(data.content, 'medium')
      const detailedSummary = summarizeText(data.content, 'detailed')

      setProgress('分析关键词和难度...')

      const keywords = extractKeywords(data.content || data.title + ' ' + data.description)
      const tags = extractTags(data.content || data.title + ' ' + data.description)
      const { level, score, readingTime } = analyzeDifficulty(data.content)

      const newSummary: Summary = {
        id: uid(),
        url,
        title: data.title || url,
        description: data.description,
        ogImage: data.ogImage,
        ogSiteName: data.ogSiteName,
        author: data.author,
        content: data.content,
        shortSummary,
        mediumSummary,
        detailedSummary,
        keywords,
        readingTime,
        difficulty: level,
        difficultyScore: score,
        tags,
        favorite: false,
        createdAt: Date.now(),
      }

      setSummaries((prev) => [newSummary, ...prev].slice(0, MAX_HISTORY))
      setActiveId(newSummary.id)
      setUrlInput('')
      showToast('摘要生成成功', 'success')
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err)
      setError(`抓取失败：${msg}。请检查 URL 或稍后重试。`)
      showToast('抓取失败', 'error')
    } finally {
      setLoading(false)
      setProgress('')
    }
  }, [urlInput, showToast])

  const toggleFavorite = useCallback((id: string) => {
    setSummaries((prev) =>
      prev.map((s) => (s.id === id ? { ...s, favorite: !s.favorite } : s)),
    )
  }, [])

  const deleteSummary = useCallback((id: string) => {
    setSummaries((prev) => prev.filter((s) => s.id !== id))
    if (activeId === id) setActiveId(null)
  }, [activeId])

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

  const exportSummary = useCallback((s: Summary) => {
    const lines: string[] = []
    lines.push(`# ${s.title}`)
    lines.push('')
    lines.push(`> 来源: ${s.url}`)
    if (s.author) lines.push(`> 作者: ${s.author}`)
    if (s.tags.length) lines.push(`> 标签: ${s.tags.map((t) => '#' + t).join(' ')}`)
    lines.push(`> 阅读时长: ${s.readingTime} 分钟`)
    lines.push(`> 难度: ${DIFFICULTY_LABELS[s.difficulty].label}`)
    lines.push('')
    lines.push('## 简短摘要')
    lines.push(s.shortSummary)
    lines.push('')
    lines.push('## 中等摘要')
    lines.push(s.mediumSummary)
    lines.push('')
    lines.push('## 详细摘要')
    lines.push(s.detailedSummary)
    lines.push('')
    lines.push('## 关键词')
    lines.push(s.keywords.map((k) => `- ${k.word} (${k.weight.toFixed(1)}%)`).join('\n'))
    if (s.translatedSummary) {
      lines.push('')
      lines.push(`## 翻译 (${s.translatedLang})`)
      lines.push(s.translatedSummary)
    }
    const md = lines.join('\n')
    const blob = new Blob([md], { type: 'text/markdown' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `${s.title.replace(/[^\w\u4e00-\u9fa5]+/g, '-').slice(0, 50)}.md`
    a.click()
    URL.revokeObjectURL(url)
    showToast('已导出 Markdown', 'success')
  }, [showToast])

  const translateActive = useCallback(async (toLang: string) => {
    if (!activeSummary) return
    setTranslating(true)
    try {
      const sourceText = activeSummary.mediumSummary || activeSummary.shortSummary
      const fromLang = detectLanguage(sourceText)
      const translated = await translateText(sourceText, fromLang, toLang)
      setSummaries((prev) =>
        prev.map((s) =>
          s.id === activeSummary.id
            ? { ...s, translatedSummary: translated, translatedLang: toLang }
            : s,
        ),
      )
      showToast('翻译完成', 'success')
    } catch {
      showToast('翻译失败', 'error')
    } finally {
      setTranslating(false)
    }
  }, [activeSummary, showToast])

  const clearAll = useCallback(() => {
    if (confirm('确定清空所有历史记录？')) {
      setSummaries([])
      setActiveId(null)
      showToast('已清空', 'info')
    }
  }, [showToast])

  const currentSummaryText = useMemo(() => {
    if (!activeSummary) return ''
    switch (activeLevel) {
      case 'short': return activeSummary.shortSummary
      case 'medium': return activeSummary.mediumSummary
      case 'detailed': return activeSummary.detailedSummary
    }
  }, [activeSummary, activeLevel])

  return (
    <div style={styles.container}>
      <div style={styles.topBar}>
        <div style={styles.inputGroup}>
          <Link2 size={16} color="#8b7cf0" />
          <input
            style={styles.urlInput}
            placeholder="输入网页 URL 进行智能摘要，例如 https://example.com/article"
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
              <><Loader2 size={14} className="animate-spin" /> 生成中...</>
            ) : (
              <><Sparkles size={14} /> 智能摘要</>
            )}
          </button>
        </div>
      </div>

      {error && <div style={styles.errorBar}>{error}</div>}
      {progress && !error && <div style={styles.progressBar}><Loader2 size={12} className="animate-spin" /> {progress}</div>}

      <div style={styles.body}>
        <aside style={styles.sidebar}>
          <div style={styles.sidebarHeader}>
            <div style={styles.sidebarTitle}>
              <History size={14} /> 历史记录
            </div>
            <div style={{ display: 'flex', gap: 4 }}>
              <button
                style={{ ...styles.filterBtn, ...(filterFav ? styles.filterBtnActive : {}) }}
                onClick={() => setFilterFav((v) => !v)}
                title="只看收藏"
              >
                <Star size={12} />
              </button>
              <button
                style={styles.filterBtn}
                onClick={clearAll}
                title="清空全部"
                disabled={summaries.length === 0}
              >
                <Trash2 size={12} />
              </button>
            </div>
          </div>

          <div style={{ padding: '8px 10px' }}>
            <div style={styles.searchInputWrapper}>
              <Search size={12} color="#64748b" />
              <input
                style={styles.searchInput}
                placeholder="搜索摘要..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
          </div>

          <div style={styles.convList}>
            {filteredSummaries.length === 0 ? (
              <div style={styles.emptySidebar}>
                {search ? '没有匹配的结果' : '暂无摘要\n输入 URL 开始生成'}
              </div>
            ) : (
              filteredSummaries.map((s) => (
                <div
                  key={s.id}
                  style={{
                    ...styles.snapItem,
                    ...(s.id === activeId ? styles.snapItemActive : {}),
                  }}
                  onClick={() => setActiveId(s.id)}
                >
                  {s.ogImage ? (
                    <img
                      src={s.ogImage}
                      alt=""
                      style={styles.thumbImg}
                      onError={(e) => {
                        ;(e.target as HTMLImageElement).style.display = 'none'
                      }}
                    />
                  ) : (
                    <div style={styles.thumbPlaceholder}>
                      <FileText size={20} />
                    </div>
                  )}
                  <div style={styles.snapInfo}>
                    <div style={styles.snapTitle}>
                      {s.favorite && <Star size={11} style={{ color: '#fbbf24', flexShrink: 0 }} />}
                      {s.title}
                    </div>
                    <div style={styles.snapDesc}>{s.shortSummary.slice(0, 60)}</div>
                    <div style={styles.snapMeta}>
                      <span>{formatDate(s.createdAt)}</span>
                      <span>{s.readingTime}分钟</span>
                    </div>
                  </div>
                  <div style={styles.snapActions} onClick={(e) => e.stopPropagation()}>
                    <button
                      style={styles.miniBtn}
                      onClick={() => toggleFavorite(s.id)}
                      title={s.favorite ? '取消收藏' : '收藏'}
                    >
                      <Star size={11} style={{ color: s.favorite ? '#fbbf24' : '#64748b' }} />
                    </button>
                    <button
                      style={{ ...styles.miniBtn, color: '#ef4444' }}
                      onClick={() => deleteSummary(s.id)}
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
              <span><BarChart3 size={12} /> 共 {summaries.length} 条</span>
              <span><Star size={12} style={{ color: '#fbbf24' }} /> {summaries.filter((s) => s.favorite).length}</span>
            </div>
          </div>
        </aside>

        <main style={styles.main}>
          {!activeSummary ? (
            <div style={styles.emptyMain}>
              <div style={styles.emptyIcon}><Sparkles size={48} /></div>
              <h2 style={styles.emptyTitle}>WebSummarizer 智能摘要</h2>
              <p style={styles.emptyDesc}>
                输入任意网页 URL，自动提取元数据、生成多级别摘要、
                <br />分析关键词和阅读难度，支持翻译与导出
              </p>
              <div style={styles.featureList}>
                <FeatureItem icon={<FileText size={16} />} label="智能抓取与摘要" />
                <FeatureItem icon={<Tag size={16} />} label="关键词与标签提取" />
                <FeatureItem icon={<BarChart3 size={16} />} label="阅读难度分析" />
                <FeatureItem icon={<Languages size={16} />} label="多语言翻译" />
                <FeatureItem icon={<Star size={16} />} label="收藏与历史" />
                <FeatureItem icon={<Download size={16} />} label="导出 Markdown" />
              </div>
            </div>
          ) : (
            <div style={styles.detailView}>
              <div style={styles.card}>
                {activeSummary.ogImage && (
                  <div style={styles.cardImageOverlay}>
                    <img
                      src={activeSummary.ogImage}
                      alt=""
                      style={styles.cardImage}
                      onError={(e) => {
                        ;(e.target as HTMLImageElement).style.display = 'none'
                      }}
                    />
                    <div style={styles.cardImageGradient} />
                  </div>
                )}

                <div style={{ ...styles.cardBody, ...(activeSummary.ogImage ? { paddingTop: 16 } : {}) }}>
                  <div style={styles.cardHeader}>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <h1 style={styles.cardTitle}>{activeSummary.title}</h1>
                      <a
                        href={activeSummary.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        style={styles.cardUrl}
                      >
                        <ExternalLink size={12} />
                        {activeSummary.url}
                      </a>
                    </div>
                    <div style={styles.cardActions}>
                      <button
                        style={{ ...styles.iconBtn, ...(activeSummary.favorite ? styles.iconBtnActive : {}) }}
                        onClick={() => toggleFavorite(activeSummary.id)}
                      >
                        <Star size={14} style={{ color: activeSummary.favorite ? '#fbbf24' : undefined }} />
                        {activeSummary.favorite ? '已收藏' : '收藏'}
                      </button>
                      <button
                        style={styles.iconBtn}
                        onClick={() => copyText(activeSummary.detailedSummary, `export-${activeSummary.id}`)}
                      >
                        <Copy size={14} /> 复制
                      </button>
                      <button
                        style={styles.iconBtn}
                        onClick={() => exportSummary(activeSummary)}
                      >
                        <Download size={14} /> 导出
                      </button>
                    </div>
                  </div>

                  {activeSummary.description && (
                    <div style={styles.descriptionBlock}>
                      <BookOpen size={14} />
                      <span>{activeSummary.description}</span>
                    </div>
                  )}

                  <div style={styles.metaRow}>
                    <MetaCard
                      icon={<Clock size={14} />}
                      label="阅读时长"
                      value={`${activeSummary.readingTime} 分钟`}
                      color="#3b82f6"
                    />
                    <MetaCard
                      icon={<BarChart3 size={14} />}
                      label="难度"
                      value={DIFFICULTY_LABELS[activeSummary.difficulty].label}
                      color={DIFFICULTY_LABELS[activeSummary.difficulty].color}
                      bgColor={DIFFICULTY_LABELS[activeSummary.difficulty].bg}
                    />
                    <MetaCard
                      icon={<Highlighter size={14} />}
                      label="难度指数"
                      value={`${activeSummary.difficultyScore}/100`}
                      color="#8b7cf0"
                    />
                    {activeSummary.author && (
                      <MetaCard
                        icon={<User size={14} />}
                        label="作者"
                        value={activeSummary.author}
                        color="#10b981"
                      />
                    )}
                  </div>

                  <div style={styles.section}>
                    <div style={styles.sectionHeader}>
                      <FileText size={16} color="#8b7cf0" />
                      <span style={styles.sectionTitle}>智能摘要</span>
                      <div style={styles.levelTabs}>
                        {([
                          { key: 'short', label: '简短' },
                          { key: 'medium', label: '中等' },
                          { key: 'detailed', label: '详细' },
                        ] as const).map((lvl) => (
                          <button
                            key={lvl.key}
                            style={{
                              ...styles.levelTab,
                              ...(activeLevel === lvl.key ? styles.levelTabActive : {}),
                            }}
                            onClick={() => setActiveLevel(lvl.key)}
                          >
                            {lvl.label}
                          </button>
                        ))}
                      </div>
                    </div>
                    <div style={styles.summaryText}>
                      {currentSummaryText || '内容不足，无法生成摘要'}
                    </div>
                    <div style={{ display: 'flex', gap: 8, marginTop: 8 }}>
                      <button
                        style={styles.smallBtn}
                        onClick={() => copyText(currentSummaryText, `sum-${activeSummary.id}-${activeLevel}`)}
                        disabled={!currentSummaryText}
                      >
                        {copiedId === `sum-${activeSummary.id}-${activeLevel}` ? <Check size={12} color="#10b981" /> : <Copy size={12} />}
                        {copiedId === `sum-${activeSummary.id}-${activeLevel}` ? '已复制' : '复制摘要'}
                      </button>
                      <button
                        style={styles.smallBtn}
                        onClick={() => {
                          const md = `# ${activeSummary.title}\n\n${currentSummaryText}`
                          copyText(md, `md-${activeSummary.id}-${activeLevel}`)
                        }}
                        disabled={!currentSummaryText}
                      >
                        <Copy size={12} /> 复制为 Markdown
                      </button>
                    </div>
                  </div>

                  <div style={styles.section}>
                    <div style={styles.sectionHeader}>
                      <Tag size={16} color="#8b7cf0" />
                      <span style={styles.sectionTitle}>关键词与标签</span>
                    </div>
                    <div style={styles.keywordsGrid}>
                      {activeSummary.keywords.map((kw) => (
                        <div
                          key={kw.word}
                          style={styles.keywordChip}
                          title={`权重: ${kw.weight.toFixed(1)}%`}
                        >
                          <span>{kw.word}</span>
                          <span style={styles.keywordWeight}>{kw.weight.toFixed(0)}</span>
                        </div>
                      ))}
                    </div>
                    <div style={styles.tagsRow}>
                      {activeSummary.tags.map((tag) => (
                        <span key={tag} style={styles.tagChip}>#{tag}</span>
                      ))}
                    </div>
                  </div>

                  <div style={styles.section}>
                    <div style={styles.sectionHeader}>
                      <Languages size={16} color="#8b7cf0" />
                      <span style={styles.sectionTitle}>翻译</span>
                    </div>
                    <div style={styles.translateRow}>
                      {['en', 'zh', 'ja', 'ko', 'fr', 'de', 'es'].map((lang) => (
                        <button
                          key={lang}
                          style={{
                            ...styles.translateBtn,
                            ...(activeSummary.translatedLang === lang ? styles.translateBtnActive : {}),
                          }}
                          onClick={() => translateActive(lang)}
                          disabled={translating}
                        >
                          {LANG_LABELS[lang]}
                        </button>
                      ))}
                    </div>
                    {translating && (
                      <div style={styles.translating}>
                        <Loader2 size={12} className="animate-spin" /> 翻译中...
                      </div>
                    )}
                    {activeSummary.translatedSummary && !translating && (
                      <div style={styles.translationResult}>
                        <Globe size={14} />
                        <span>{activeSummary.translatedSummary}</span>
                      </div>
                    )}
                  </div>

                  <div style={styles.section}>
                    <div
                      style={{ ...styles.sectionHeader, cursor: 'pointer' }}
                      onClick={() => setShowFullContent((v) => !v)}
                    >
                      <Eye size={16} color="#8b7cf0" />
                      <span style={styles.sectionTitle}>原文内容</span>
                      {showFullContent ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                    </div>
                    {showFullContent && (
                      <div style={styles.fullContent}>
                        {activeSummary.content ? activeSummary.content : '无正文内容'}
                      </div>
                    )}
                  </div>
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

const LANG_LABELS: Record<string, string> = {
  en: 'English',
  zh: '中文',
  ja: '日本語',
  ko: '한국어',
  fr: 'Français',
  de: 'Deutsch',
  es: 'Español',
}

const User: React.FC<{ size?: number; color?: string }> = ({ size = 14, color }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    stroke={color || 'currentColor'}
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
    <circle cx="12" cy="7" r="4" />
  </svg>
)

const FeatureItem: React.FC<{ icon: React.ReactNode; label: string }> = ({ icon, label }) => (
  <div style={styles.featureItem}>
    <span style={{ color: '#8b7cf0' }}>{icon}</span>
    <span>{label}</span>
  </div>
)

const MetaCard: React.FC<{
  icon: React.ReactNode
  label: string
  value: string
  color: string
  bgColor?: string
}> = ({ icon, label, value, color, bgColor }) => (
  <div style={{ ...styles.metaCard, borderColor: color, background: bgColor || 'transparent' }}>
    <div style={{ ...styles.metaCardIcon, color }}>{icon}</div>
    <div style={styles.metaCardText}>
      <div style={styles.metaCardLabel}>{label}</div>
      <div style={styles.metaCardValue}>{value}</div>
    </div>
  </div>
)

const styles: Record<string, React.CSSProperties> = {
  container: {
    display: 'flex',
    flexDirection: 'column',
    height: '100%',
    width: '100%',
    background: 'linear-gradient(180deg, #0f0f1a 0%, #1a1a2e 100%)',
    color: '#e0e0e8',
    fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
    fontSize: 14,
    overflow: 'hidden',
  },
  topBar: {
    padding: '14px 20px',
    background: 'rgba(0,0,0,0.3)',
    borderBottom: '1px solid rgba(255,255,255,0.06)',
  },
  inputGroup: {
    display: 'flex',
    alignItems: 'center',
    gap: 10,
    padding: '10px 14px',
    background: 'rgba(255,255,255,0.05)',
    border: '1px solid rgba(255,255,255,0.1)',
    borderRadius: 10,
  },
  urlInput: {
    flex: 1,
    background: 'transparent',
    border: 'none',
    outline: 'none',
    color: '#e0e0e8',
    fontSize: 14,
    fontFamily: 'inherit',
  },
  fetchBtn: {
    display: 'flex',
    alignItems: 'center',
    gap: 6,
    padding: '8px 18px',
    background: 'linear-gradient(135deg, #8b7cf0, #6c5ce7)',
    border: 'none',
    borderRadius: 8,
    color: '#fff',
    cursor: 'pointer',
    fontSize: 13,
    fontWeight: 600,
    transition: 'all 0.2s',
  },
  disabledBtn: {
    opacity: 0.6,
    cursor: 'not-allowed',
  },
  errorBar: {
    padding: '8px 20px',
    background: 'rgba(239,68,68,0.1)',
    borderBottom: '1px solid rgba(239,68,68,0.4)',
    color: '#fca5a5',
    fontSize: 13,
  },
  progressBar: {
    padding: '8px 20px',
    background: 'rgba(59,130,246,0.1)',
    borderBottom: '1px solid rgba(59,130,246,0.3)',
    color: '#93c5fd',
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
    background: 'rgba(0,0,0,0.2)',
    borderRight: '1px solid rgba(255,255,255,0.06)',
    display: 'flex',
    flexDirection: 'column',
  },
  sidebarHeader: {
    padding: 12,
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderBottom: '1px solid rgba(255,255,255,0.06)',
  },
  sidebarTitle: {
    display: 'flex',
    alignItems: 'center',
    gap: 6,
    fontSize: 13,
    fontWeight: 600,
    color: '#c4b5fd',
  },
  filterBtn: {
    width: 28,
    height: 28,
    background: 'rgba(255,255,255,0.05)',
    border: '1px solid rgba(255,255,255,0.1)',
    borderRadius: 6,
    color: '#94a3b8',
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
  filterBtnActive: {
    color: '#fbbf24',
    borderColor: '#fbbf24',
    background: 'rgba(251,191,36,0.1)',
  },
  searchInputWrapper: {
    display: 'flex',
    alignItems: 'center',
    gap: 6,
    padding: '6px 10px',
    background: 'rgba(255,255,255,0.04)',
    border: '1px solid rgba(255,255,255,0.08)',
    borderRadius: 6,
  },
  searchInput: {
    flex: 1,
    background: 'transparent',
    border: 'none',
    outline: 'none',
    color: '#e0e0e8',
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
    color: '#64748b',
    fontSize: 12,
    whiteSpace: 'pre-line',
  },
  snapItem: {
    display: 'flex',
    gap: 8,
    padding: 8,
    borderRadius: 8,
    marginBottom: 4,
    cursor: 'pointer',
    border: '1px solid transparent',
    transition: 'all 0.15s',
  },
  snapItemActive: {
    background: 'rgba(139,124,240,0.15)',
    borderColor: 'rgba(139,124,240,0.4)',
  },
  thumbImg: {
    width: 56,
    height: 42,
    borderRadius: 6,
    objectFit: 'cover',
    flexShrink: 0,
    background: '#1a1a2e',
  },
  thumbPlaceholder: {
    width: 56,
    height: 42,
    borderRadius: 6,
    background: 'rgba(139,124,240,0.15)',
    color: '#8b7cf0',
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
    gap: 2,
  },
  snapTitle: {
    display: 'flex',
    alignItems: 'center',
    gap: 4,
    color: '#f1f5f9',
    fontSize: 12,
    fontWeight: 600,
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap',
  },
  snapDesc: {
    color: '#94a3b8',
    fontSize: 11,
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap',
  },
  snapMeta: {
    display: 'flex',
    gap: 8,
    color: '#64748b',
    fontSize: 10,
  },
  snapActions: {
    display: 'flex',
    flexDirection: 'column',
    gap: 3,
  },
  miniBtn: {
    width: 24,
    height: 24,
    background: 'rgba(255,255,255,0.05)',
    border: '1px solid rgba(255,255,255,0.08)',
    borderRadius: 4,
    color: '#94a3b8',
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
  sidebarFooter: {
    padding: 10,
    borderTop: '1px solid rgba(255,255,255,0.06)',
  },
  statsRow: {
    display: 'flex',
    justifyContent: 'space-between',
    color: '#64748b',
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
    color: '#94a3b8',
    gap: 8,
  },
  emptyIcon: {
    width: 80,
    height: 80,
    borderRadius: '50%',
    background: 'linear-gradient(135deg, rgba(139,124,240,0.2), rgba(108,92,231,0.2))',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    color: '#8b7cf0',
    marginBottom: 8,
  },
  emptyTitle: {
    color: '#f1f5f9',
    margin: '8px 0 4px',
    fontSize: 20,
  },
  emptyDesc: {
    color: '#94a3b8',
    maxWidth: 500,
    lineHeight: 1.6,
    margin: 0,
  },
  featureList: {
    display: 'grid',
    gridTemplateColumns: '1fr 1fr',
    gap: 8,
    marginTop: 20,
    maxWidth: 400,
  },
  featureItem: {
    display: 'flex',
    alignItems: 'center',
    gap: 8,
    padding: '10px 14px',
    background: 'rgba(255,255,255,0.04)',
    border: '1px solid rgba(255,255,255,0.06)',
    borderRadius: 8,
    fontSize: 12,
    color: '#cbd5e1',
  },
  detailView: {
    maxWidth: 900,
    margin: '0 auto',
  },
  card: {
    background: 'rgba(30,30,50,0.6)',
    border: '1px solid rgba(255,255,255,0.08)',
    borderRadius: 16,
    overflow: 'hidden',
    backdropFilter: 'blur(10px)',
  },
  cardImageOverlay: {
    position: 'relative',
    height: 200,
    overflow: 'hidden',
  },
  cardImage: {
    width: '100%',
    height: '100%',
    objectFit: 'cover',
  },
  cardImageGradient: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: '60%',
    background: 'linear-gradient(to top, rgba(30,30,50,0.8), transparent)',
  },
  cardBody: {
    padding: 20,
  },
  cardHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    gap: 16,
    marginBottom: 16,
  },
  cardTitle: {
    fontSize: 22,
    color: '#f1f5f9',
    margin: 0,
    lineHeight: 1.3,
    wordBreak: 'break-word',
  },
  cardUrl: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: 4,
    color: '#a29bfe',
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
  iconBtn: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: 6,
    padding: '7px 12px',
    background: 'rgba(255,255,255,0.06)',
    border: '1px solid rgba(255,255,255,0.1)',
    borderRadius: 8,
    color: '#cbd5e1',
    cursor: 'pointer',
    fontSize: 12,
    transition: 'all 0.15s',
  },
  iconBtnActive: {
    background: 'rgba(251,191,36,0.15)',
    borderColor: 'rgba(251,191,36,0.4)',
    color: '#fbbf24',
  },
  descriptionBlock: {
    display: 'flex',
    gap: 10,
    padding: '12px 16px',
    background: 'rgba(139,124,240,0.08)',
    border: '1px solid rgba(139,124,240,0.2)',
    borderRadius: 10,
    color: '#c4b5fd',
    fontSize: 13,
    lineHeight: 1.6,
    marginBottom: 16,
  },
  metaRow: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))',
    gap: 10,
    marginBottom: 20,
  },
  metaCard: {
    display: 'flex',
    alignItems: 'center',
    gap: 10,
    padding: '10px 14px',
    background: 'rgba(255,255,255,0.04)',
    border: '1px solid rgba(255,255,255,0.1)',
    borderLeft: '3px solid',
    borderRadius: 8,
  },
  metaCardIcon: {
    width: 28,
    height: 28,
    borderRadius: 6,
    background: 'rgba(255,255,255,0.05)',
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
    color: '#64748b',
    marginBottom: 2,
  },
  metaCardValue: {
    fontSize: 14,
    color: '#e2e8f0',
    fontWeight: 600,
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap',
  },
  section: {
    marginBottom: 20,
  },
  sectionHeader: {
    display: 'flex',
    alignItems: 'center',
    gap: 10,
    marginBottom: 12,
    flexWrap: 'wrap',
  },
  sectionTitle: {
    fontSize: 15,
    fontWeight: 600,
    color: '#f1f5f9',
  },
  levelTabs: {
    display: 'flex',
    background: 'rgba(255,255,255,0.05)',
    borderRadius: 8,
    padding: 3,
    marginLeft: 'auto',
  },
  levelTab: {
    padding: '5px 14px',
    background: 'transparent',
    border: 'none',
    borderRadius: 6,
    color: '#94a3b8',
    cursor: 'pointer',
    fontSize: 12,
    fontWeight: 500,
    transition: 'all 0.15s',
  },
  levelTabActive: {
    background: 'linear-gradient(135deg, #8b7cf0, #6c5ce7)',
    color: '#fff',
  },
  summaryText: {
    padding: '16px 18px',
    background: 'rgba(255,255,255,0.04)',
    border: '1px solid rgba(255,255,255,0.08)',
    borderRadius: 12,
    color: '#e2e8f0',
    fontSize: 14,
    lineHeight: 1.8,
  },
  smallBtn: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: 6,
    padding: '6px 12px',
    background: 'rgba(255,255,255,0.05)',
    border: '1px solid rgba(255,255,255,0.1)',
    borderRadius: 6,
    color: '#cbd5e1',
    cursor: 'pointer',
    fontSize: 12,
  },
  keywordsGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fill, minmax(120px, 1fr))',
    gap: 8,
    marginBottom: 12,
  },
  keywordChip: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: '8px 12px',
    background: 'rgba(139,124,240,0.1)',
    border: '1px solid rgba(139,124,240,0.25)',
    borderRadius: 8,
    color: '#c4b5fd',
    fontSize: 13,
    fontWeight: 500,
  },
  keywordWeight: {
    fontSize: 11,
    color: '#8b7cf0',
    fontWeight: 600,
    background: 'rgba(139,124,240,0.15)',
    padding: '2px 6px',
    borderRadius: 4,
  },
  tagsRow: {
    display: 'flex',
    flexWrap: 'wrap',
    gap: 6,
  },
  tagChip: {
    padding: '4px 10px',
    background: 'rgba(255,255,255,0.06)',
    border: '1px solid rgba(255,255,255,0.1)',
    borderRadius: 12,
    color: '#94a3b8',
    fontSize: 12,
  },
  translateRow: {
    display: 'flex',
    flexWrap: 'wrap',
    gap: 6,
    marginBottom: 10,
  },
  translateBtn: {
    padding: '6px 14px',
    background: 'rgba(255,255,255,0.05)',
    border: '1px solid rgba(255,255,255,0.1)',
    borderRadius: 6,
    color: '#cbd5e1',
    cursor: 'pointer',
    fontSize: 12,
    transition: 'all 0.15s',
  },
  translateBtnActive: {
    background: 'linear-gradient(135deg, #8b7cf0, #6c5ce7)',
    borderColor: 'transparent',
    color: '#fff',
  },
  translating: {
    display: 'flex',
    alignItems: 'center',
    gap: 8,
    color: '#93c5fd',
    fontSize: 12,
    padding: '8px 12px',
    background: 'rgba(59,130,246,0.1)',
    borderRadius: 6,
  },
  translationResult: {
    display: 'flex',
    gap: 10,
    padding: '12px 14px',
    background: 'rgba(16,185,129,0.08)',
    border: '1px solid rgba(16,185,129,0.2)',
    borderRadius: 8,
    color: '#a7f3d0',
    fontSize: 13,
    lineHeight: 1.6,
  },
  fullContent: {
    padding: '16px 18px',
    background: 'rgba(0,0,0,0.3)',
    border: '1px solid rgba(255,255,255,0.06)',
    borderRadius: 10,
    color: '#94a3b8',
    fontSize: 13,
    lineHeight: 1.8,
    whiteSpace: 'pre-wrap',
    maxHeight: 400,
    overflowY: 'auto',
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
    animation: 'fadeInUp 0.3s ease',
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

export default memo(WebSummarizer)