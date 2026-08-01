import { useState, useEffect, useCallback, useRef, useMemo } from 'react'
import {
  Search, BookOpen, Star, StarOff, History, X, Loader2,
  Globe, Sun, Moon, ChevronRight, Clock, Trash2,
  Sparkles, FileText, List, ArrowLeft, ExternalLink,
  Eye, EyeOff
} from 'lucide-react'
import { marked } from 'marked'

// ==================== 类型定义 ====================
type Lang = 'en' | 'zh'
type ViewMode = 'search' | 'article'
type Theme = 'dark' | 'light'

interface SearchSuggestion {
  title: string
  description?: string
  pageid?: number
}

interface Section {
  id: string
  title: string
  level: number
  anchor: string
}

interface ArticleData {
  title: string
  extract: string
  extract_html?: string
  thumbnail?: { source: string; width: number; height: number }
  fullurl: string
  pageid: number
  sections?: Section[]
  content?: string
  htmlContent?: string
}

interface FavoriteItem {
  title: string
  lang: Lang
  addedAt: number
  thumbnail?: string
}

interface HistoryItem {
  title: string
  lang: Lang
  timestamp: number
}

// ==================== 常量 ====================
const API_BASE = (lang: Lang) => `https://${lang}.wikipedia.org`
const FAV_KEY = 'aiwiki-favorites-v1'
const HIST_KEY = 'aiwiki-history-v1'
const MAX_HISTORY = 50

// ==================== 主组件 ====================
export default function AIWikiSearch() {
  const [theme, setTheme] = useState<Theme>('dark')
  const [lang, setLang] = useState<Lang>('en')
  const [query, setQuery] = useState('')
  const [suggestions, setSuggestions] = useState<SearchSuggestion[]>([])
  const [showSuggestions, setShowSuggestions] = useState(false)
  const [searchLoading, setSearchLoading] = useState(false)
  const [activeSuggestion, setActiveSuggestion] = useState(-1)

  const [view, setView] = useState<ViewMode>('search')
  const [article, setArticle] = useState<ArticleData | null>(null)
  const [loadingArticle, setLoadingArticle] = useState(false)
  const [articleError, setArticleError] = useState<string | null>(null)
  const [activeSection, setActiveSection] = useState<string>('')
  const [showToc, setShowToc] = useState(true)
  const [showSummary, setShowSummary] = useState(true)

  const [favorites, setFavorites] = useState<FavoriteItem[]>([])
  const [history, setHistory] = useState<HistoryItem[]>([])
  const [leftPanel, setLeftPanel] = useState<'search' | 'favorites' | 'history'>('search')
  const [showFav, setShowFav] = useState(false)

  const searchRef = useRef<HTMLInputElement>(null)
  const contentRef = useRef<HTMLDivElement>(null)
  const debounceRef = useRef<number | null>(null)

  // ==================== 主题样式 ====================
  const styles = useMemo(() => {
    const isDark = theme === 'dark'
    return {
      app: {
        width: '100%',
        height: '100%',
        display: 'flex',
        flexDirection: 'column' as const,
        background: isDark
          ? 'linear-gradient(135deg, #0f0c29 0%, #302b63 50%, #24243e 100%)'
          : 'linear-gradient(135deg, #f5f7fa 0%, #e4e8ec 50%, #d6dde5 100%)',
        color: isDark ? '#f0f0f5' : '#1a1a2e',
        fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "PingFang SC", "Microsoft YaHei", sans-serif',
        overflow: 'hidden',
        position: 'relative' as const,
      },
      glass: {
        background: isDark
          ? 'rgba(255, 255, 255, 0.06)'
          : 'rgba(255, 255, 255, 0.65)',
        backdropFilter: 'blur(20px)',
        WebkitBackdropFilter: 'blur(20px)',
        border: isDark ? '1px solid rgba(255,255,255,0.1)' : '1px solid rgba(0,0,0,0.08)',
      },
      header: {
        padding: '14px 20px',
        display: 'flex',
        alignItems: 'center',
        gap: 14,
        flexWrap: 'wrap' as const,
        borderBottom: isDark ? '1px solid rgba(255,255,255,0.08)' : '1px solid rgba(0,0,0,0.06)',
      },
      body: isDark ? 'rgba(255,255,255,0.9)' : 'rgba(0,0,0,0.75)',
      secondaryText: isDark ? 'rgba(255,255,255,0.6)' : 'rgba(0,0,0,0.55)',
      tertiaryText: isDark ? 'rgba(255,255,255,0.4)' : 'rgba(0,0,0,0.35)',
      accent: '#7C6CF0',
      accentLight: '#9B8AF0',
      danger: '#ef4444',
      inputBg: isDark ? 'rgba(255,255,255,0.08)' : 'rgba(255,255,255,0.9)',
      inputBorder: isDark ? 'rgba(255,255,255,0.15)' : 'rgba(0,0,0,0.12)',
      cardBg: isDark ? 'rgba(255,255,255,0.04)' : 'rgba(255,255,255,0.7)',
      hoverBg: isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.05)',
      separator: isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.08)',
    }
  }, [theme])

  // ==================== 数据持久化 ====================
  useEffect(() => {
    try {
      const raw = localStorage.getItem(FAV_KEY)
      if (raw) setFavorites(JSON.parse(raw))
    } catch {}
    try {
      const raw = localStorage.getItem(HIST_KEY)
      if (raw) setHistory(JSON.parse(raw))
    } catch {}
  }, [])

  useEffect(() => {
    try { localStorage.setItem(FAV_KEY, JSON.stringify(favorites)) } catch {}
  }, [favorites])

  useEffect(() => {
    try { localStorage.setItem(HIST_KEY, JSON.stringify(history)) } catch {}
  }, [history])

  // ==================== 历史记录 ====================
  const addHistory = useCallback((title: string, l: Lang) => {
    setHistory((prev) => {
      const filtered = prev.filter((h) => !(h.title === title && h.lang === l))
      return [{ title, lang: l, timestamp: Date.now() }, ...filtered].slice(0, MAX_HISTORY)
    })
  }, [])

  const clearHistory = () => setHistory([])

  // ==================== 收藏功能 ====================
  const isFav = useCallback(
    (title: string, l: Lang) => favorites.some((f) => f.title === title && f.lang === l),
    [favorites]
  )

  const toggleFav = useCallback((item: { title: string; lang: Lang; thumbnail?: string }) => {
    setFavorites((prev) => {
      const exists = prev.find((f) => f.title === item.title && f.lang === item.lang)
      if (exists) {
        return prev.filter((f) => !(f.title === item.title && f.lang === item.lang))
      }
      return [{ ...item, addedAt: Date.now() }, ...prev]
    })
  }, [])

  const removeFav = (title: string, l: Lang) => {
    setFavorites((prev) => prev.filter((f) => !(f.title === title && f.lang === l)))
  }

  // ==================== API 调用 ====================
  const fetchSuggestions = useCallback(async (q: string) => {
    if (!q.trim()) {
      setSuggestions([])
      return
    }
    setSearchLoading(true)
    try {
      const url = `${API_BASE(lang)}/w/api.php?action=opensearch&search=${encodeURIComponent(q)}&limit=8&namespace=0&format=json&origin=*`
      const res = await fetch(url)
      if (!res.ok) throw new Error(`HTTP ${res.status}`)
      const data = await res.json()
      const titles: string[] = data[1] || []
      const descs: string[] = data[2] || []
      const pages: number[] = data[4] || []
      setSuggestions(
        titles.map((t, i) => ({
          title: t,
          description: descs[i] || '',
          pageid: pages[i],
        }))
      )
    } catch {
      setSuggestions([])
    } finally {
      setSearchLoading(false)
    }
  }, [lang])

  // 实时搜索建议（防抖）
  useEffect(() => {
    if (debounceRef.current) window.clearTimeout(debounceRef.current)
    if (query.trim()) {
      debounceRef.current = window.setTimeout(() => fetchSuggestions(query), 300)
    } else {
      setSuggestions([])
    }
    return () => {
      if (debounceRef.current) window.clearTimeout(debounceRef.current)
    }
  }, [query, fetchSuggestions])

  const fetchArticle = useCallback(async (title: string) => {
    setLoadingArticle(true)
    setArticleError(null)
    setShowSuggestions(false)
    setView('article')
    setActiveSection('')

    try {
      const summaryUrl = `${API_BASE(lang)}/api/rest_v1/page/summary/${encodeURIComponent(title)}`
      const summaryRes = await fetch(summaryUrl)
      if (!summaryRes.ok) throw new Error('Article not found')
      const summaryData = await summaryRes.json()

      const htmlUrl = `${API_BASE(lang)}/api/rest_v1/page/html/${encodeURIComponent(title)}`
      const htmlRes = await fetch(htmlUrl)
      let htmlContent: string | undefined
      let sections: Section[] = []

      if (htmlRes.ok) {
        htmlContent = await htmlRes.text()
        const sectionRegex = /<section[^>]*class="(?:mw\.(?:parser|content-heading|section-heading))[^"]*"[^>]*>/g
        const headingRegex = /<h([1-6])[^>]*id="([^"]*)"[^>]*>([\s\S]*?)<\/h\1>/g
        let match
        while ((match = headingRegex.exec(htmlContent)) !== null) {
          sections.push({
            id: match[2],
            title: match[3].replace(/<[^>]*>/g, '').trim(),
            level: parseInt(match[1]),
            anchor: match[2],
          })
        }
        if (sectionRegex) {
          sections = sections.filter((s) => s.title)
        }
      }

      setArticle({
        title: summaryData.title || title,
        extract: summaryData.extract || '',
        extract_html: summaryData.extract_html,
        thumbnail: summaryData.thumbnail,
        fullurl: summaryData.fullurl || `${API_BASE(lang)}/wiki/${encodeURIComponent(title)}`,
        pageid: summaryData.pageid || 0,
        sections,
        htmlContent,
      })

      addHistory(summaryData.title || title, lang)
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to load article'
      setArticleError(msg)
      setArticle({
        title,
        extract: '',
        fullurl: `${API_BASE(lang)}/wiki/${encodeURIComponent(title)}`,
        pageid: 0,
      })
    } finally {
      setLoadingArticle(false)
    }
  }, [lang, addHistory])

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    if (suggestions.length > 0) {
      fetchArticle(suggestions[0].title)
    } else if (query.trim()) {
      fetchArticle(query.trim())
    }
  }

  const handleSuggestionClick = (s: SearchSuggestion) => {
    fetchArticle(s.title)
  }

  // 滚动时高亮当前章节
  useEffect(() => {
    if (!contentRef.current || !article?.sections) return
    const handleScroll = () => {
      const container = contentRef.current
      if (!container) return
      const scrollTop = container.scrollTop
      let current = ''
      for (const sec of (article.sections ?? [])) {
        const el = document.getElementById(`section-${sec.id}`)
        if (el) {
          const offsetTop = el.offsetTop
          if (offsetTop - 100 <= scrollTop) {
            current = sec.id
          }
        }
      }
      setActiveSection(current)
    }
    const container = contentRef.current
    container?.addEventListener('scroll', handleScroll)
    return () => container?.removeEventListener('scroll', handleScroll)
  }, [article])

  const scrollToSection = (anchor: string) => {
    const el = document.getElementById(`section-${anchor}`)
    if (el && contentRef.current) {
      const container = contentRef.current
      const top = el.offsetTop - 10
      container.scrollTo({ top, behavior: 'smooth' })
      setActiveSection(anchor)
    }
  }

  // ==================== 键盘导航 ====================
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (showSuggestions && suggestions.length > 0) {
      if (e.key === 'ArrowDown') {
        e.preventDefault()
        setActiveSuggestion((prev) => (prev + 1) % suggestions.length)
      } else if (e.key === 'ArrowUp') {
        e.preventDefault()
        setActiveSuggestion((prev) => (prev <= 0 ? suggestions.length - 1 : prev - 1))
      } else if (e.key === 'Enter' && activeSuggestion >= 0) {
        e.preventDefault()
        fetchArticle(suggestions[activeSuggestion].title)
      }
    }
  }

  // ==================== 渲染辅助 ====================
  const headerRightStyle: React.CSSProperties = {
    marginLeft: 'auto',
    display: 'flex',
    alignItems: 'center',
    gap: 8,
    flexWrap: 'wrap',
  }

  const btnIcon: React.CSSProperties = {
    padding: '8px 10px',
    borderRadius: 8,
    cursor: 'pointer',
    background: 'transparent',
    border: 'none',
    color: styles.body,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    transition: 'all 0.2s ease',
  }

  const langBtnStyle = (active: boolean): React.CSSProperties => ({
    padding: '6px 12px',
    borderRadius: 8,
    cursor: 'pointer',
    background: active ? styles.accent : 'transparent',
    border: active ? 'none' : `1px solid ${styles.inputBorder}`,
    color: active ? '#fff' : styles.body,
    fontSize: 13,
    fontWeight: active ? 600 : 400,
    display: 'flex',
    alignItems: 'center',
    gap: 4,
    transition: 'all 0.2s ease',
  })

  const primaryBtn: React.CSSProperties = {
    padding: '10px 20px',
    background: `linear-gradient(135deg, ${styles.accent} 0%, ${styles.accentLight} 100%)`,
    color: '#fff',
    border: 'none',
    borderRadius: 10,
    cursor: 'pointer',
    fontSize: 14,
    fontWeight: 600,
    display: 'flex',
    alignItems: 'center',
    gap: 6,
    transition: 'all 0.2s ease',
    opacity: searchLoading ? 0.7 : 1,
  }

  const cardStyle: React.CSSProperties = {
    padding: 14,
    background: styles.cardBg,
    borderRadius: 12,
    border: `1px solid ${styles.separator}`,
    cursor: 'pointer',
    transition: 'all 0.2s ease',
    display: 'flex',
    gap: 12,
    alignItems: 'flex-start',
  }

  // ==================== 渲染组件 ====================
  const renderSearchPanel = () => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
      <div style={{ display: 'flex', gap: 8 }}>
        <div style={{ flex: 1, position: 'relative' }}>
          <Search
            size={18}
            style={{
              position: 'absolute',
              left: 14,
              top: '50%',
              transform: 'translateY(-50%)',
              color: styles.secondaryText,
              pointerEvents: 'none',
            }}
          />
          <input
            ref={searchRef}
            type="text"
            value={query}
            onChange={(e) => {
              setQuery(e.target.value)
              setShowSuggestions(true)
            }}
            onFocus={() => setShowSuggestions(true)}
            onBlur={() => setTimeout(() => setShowSuggestions(false), 200)}
            onKeyDown={handleKeyDown}
            placeholder={lang === 'zh' ? '搜索维基百科...' : 'Search Wikipedia...'}
            style={{
              width: '100%',
              padding: '12px 14px 12px 42px',
              background: styles.inputBg,
              border: `1px solid ${styles.inputBorder}`,
              borderRadius: 12,
              color: styles.body,
              fontSize: 14,
              outline: 'none',
              transition: 'all 0.2s ease',
            }}
          />
          {query && (
            <button
              onClick={() => {
                setQuery('')
                setSuggestions([])
              }}
              style={{
                position: 'absolute',
                right: 12,
                top: '50%',
                transform: 'translateY(-50%)',
                ...btnIcon,
                padding: 4,
              }}
            >
              <X size={16} />
            </button>
          )}

          {showSuggestions && suggestions.length > 0 && (
            <div
              style={{
                position: 'absolute',
                top: 'calc(100% + 4px)',
                left: 0,
                right: 0,
                zIndex: 100,
                maxHeight: 320,
                overflowY: 'auto',
                borderRadius: 12,
                ...styles.glass,
                display: 'flex',
                flexDirection: 'column' as const,
                boxShadow: '0 8px 32px rgba(0,0,0,0.25)',
              }}
            >
              {searchLoading && suggestions.length === 0 ? (
                <div style={{ padding: 12, fontSize: 13, color: styles.secondaryText }}>
                  Searching...
                </div>
              ) : (
                suggestions.map((s, i) => (
                  <div
                    key={s.title + i}
                    onMouseDown={(e) => {
                      e.preventDefault()
                      handleSuggestionClick(s)
                    }}
                    onMouseEnter={() => setActiveSuggestion(i)}
                    style={{
                      padding: '10px 14px',
                      cursor: 'pointer',
                      transition: 'background 0.15s',
                      background: activeSuggestion === i ? styles.hoverBg : 'transparent',
                      borderBottom: i < suggestions.length - 1 ? `1px solid ${styles.separator}` : 'none',
                    }}
                  >
                    <div style={{ fontSize: 14, fontWeight: 500, color: styles.body }}>{s.title}</div>
                    {s.description && (
                      <div
                        style={{
                          fontSize: 12,
                          color: styles.secondaryText,
                          lineHeight: 1.4,
                          marginTop: 2,
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                          display: '-webkit-box',
                          WebkitLineClamp: 2,
                          WebkitBoxOrient: 'vertical',
                        }}
                        dangerouslySetInnerHTML={{ __html: s.description }}
                      />
                    )}
                  </div>
                ))
              )}
            </div>
          )}
        </div>
        <button onClick={handleSearch} disabled={searchLoading} style={primaryBtn}>
          {searchLoading ? <Loader2 size={16} className="spin" /> : <Search size={16} />}
          {lang === 'zh' ? '搜索' : 'Search'}
        </button>
      </div>

      <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', alignItems: 'center' }}>
        <span style={{ fontSize: 12, color: styles.secondaryText }}>
          {lang === 'zh' ? '热门搜索：' : 'Trending:'}
        </span>
        {(lang === 'zh'
          ? ['人工智能', '量子计算', '气候变化', '太空探索', '生物科技']
          : ['Artificial Intelligence', 'Quantum Computing', 'Climate Change', 'Space Exploration', 'Biotechnology']
        ).map((topic) => (
          <button
            key={topic}
            onClick={() => {
              setQuery(topic)
              fetchArticle(topic)
            }}
            style={{
              padding: '5px 12px',
              fontSize: 12,
              borderRadius: 20,
              background: styles.cardBg,
              border: `1px solid ${styles.separator}`,
              color: styles.body,
              cursor: 'pointer',
              transition: 'all 0.2s ease',
            }}
          >
            {topic}
          </button>
        ))}
      </div>
    </div>
  )

  const renderFavoritesPanel = () => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <Star size={18} color={styles.accent} fill={styles.accent} />
          <span style={{ fontWeight: 600, fontSize: 14, color: styles.body }}>
            {lang === 'zh' ? `我的收藏 (${favorites.length})` : `Favorites (${favorites.length})`}
          </span>
        </div>
        {favorites.length > 0 && (
          <button
            onClick={() => {
              if (window.confirm(lang === 'zh' ? '确定清空所有收藏？' : 'Clear all favorites?')) {
                setFavorites([])
              }
            }}
            style={{
              padding: '5px 10px',
              fontSize: 12,
              borderRadius: 6,
              background: 'rgba(239,68,68,0.12)',
              color: styles.danger,
              border: '1px solid rgba(239,68,68,0.3)',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: 4,
            }}
          >
            <Trash2 size={12} />
            {lang === 'zh' ? '清空' : 'Clear'}
          </button>
        )}
      </div>

      {favorites.length === 0 && (
        <div
          style={{
            padding: 20,
            textAlign: 'center',
            color: styles.tertiaryText,
            fontSize: 13,
          }}
        >
          <Star size={32} style={{ margin: '0 auto 8px', display: 'block' }} />
          {lang === 'zh' ? '还没有收藏的条目' : 'No favorites yet'}
        </div>
      )}

      {favorites.map((f) => (
        <div key={f.title + f.lang} style={cardStyle}>
          {f.thumbnail && (
            <img
              src={f.thumbnail}
              alt={f.title}
              style={{
                width: 60,
                height: 60,
                borderRadius: 8,
                objectFit: 'cover',
                flexShrink: 0,
              }}
            />
          )}
          <div style={{ flex: 1, minWidth: 0 }}>
            <div
              style={{
                fontWeight: 600,
                fontSize: 14,
                color: styles.body,
                marginBottom: 4,
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                whiteSpace: 'nowrap',
              }}
            >
              {f.title}
            </div>
            <div style={{ fontSize: 11, color: styles.tertiaryText }}>
              {LANG_LABEL[f.lang]} · {new Date(f.addedAt).toLocaleDateString()}
            </div>
          </div>
          <div style={{ display: 'flex', gap: 4 }}>
            <button
              onClick={(e) => {
                e.stopPropagation()
                fetchArticle(f.title)
              }}
              style={{ ...btnIcon, padding: 6 }}
            >
              <Eye size={14} />
            </button>
            <button
              onClick={(e) => {
                e.stopPropagation()
                removeFav(f.title, f.lang)
              }}
              style={{ ...btnIcon, padding: 6, color: styles.danger }}
            >
              <X size={14} />
            </button>
          </div>
        </div>
      ))}
    </div>
  )

  const renderHistoryPanel = () => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <History size={18} color={styles.accent} />
          <span style={{ fontWeight: 600, fontSize: 14, color: styles.body }}>
            {lang === 'zh' ? `历史记录 (${history.length})` : `History (${history.length})`}
          </span>
        </div>
        {history.length > 0 && (
          <button
            onClick={() => {
              if (window.confirm(lang === 'zh' ? '确定清空所有历史？' : 'Clear all history?')) {
                clearHistory()
              }
            }}
            style={{
              padding: '5px 10px',
              fontSize: 12,
              borderRadius: 6,
              background: 'rgba(239,68,68,0.12)',
              color: styles.danger,
              border: '1px solid rgba(239,68,68,0.3)',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: 4,
            }}
          >
            <Trash2 size={12} />
            {lang === 'zh' ? '清空' : 'Clear'}
          </button>
        )}
      </div>

      {history.length === 0 && (
        <div
          style={{
            padding: 20,
            textAlign: 'center',
            color: styles.tertiaryText,
            fontSize: 13,
          }}
        >
          <Clock size={32} style={{ margin: '0 auto 8px', display: 'block' }} />
          {lang === 'zh' ? '暂无浏览记录' : 'No browsing history'}
        </div>
      )}

      {history.map((h) => (
        <div
          key={h.title + h.timestamp}
          onClick={() => {
            if (h.lang !== lang) setLang(h.lang)
            fetchArticle(h.title)
          }}
          style={{
            ...cardStyle,
            padding: '10px 14px',
            cursor: 'pointer',
          }}
        >
          <div style={{ flex: 1 }}>
            <div
              style={{
                fontSize: 14,
                color: styles.body,
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                whiteSpace: 'nowrap',
              }}
            >
              {h.title}
            </div>
            <div style={{ fontSize: 11, color: styles.tertiaryText }}>
              {LANG_LABEL[h.lang]} · {new Date(h.timestamp).toLocaleString()}
            </div>
          </div>
          <ChevronRight size={16} style={{ color: styles.secondaryText, flexShrink: 0 }} />
        </div>
      ))}
    </div>
  )

  const renderArticleView = () => (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      {articleError && (
        <div
          style={{
            margin: '16px',
            padding: 12,
            borderRadius: 8,
            background: 'rgba(239,68,68,0.15)',
            color: styles.danger,
            fontSize: 13,
            border: '1px solid rgba(239,68,68,0.3)',
          }}
        >
          {articleError}
        </div>
      )}

      <div
        style={{
          padding: '12px 20px',
          display: 'flex',
          alignItems: 'center',
          gap: 10,
          borderBottom: `1px solid ${styles.separator}`,
          flexWrap: 'wrap',
        }}
      >
        <button
          onClick={() => setView('search')}
          style={{
            ...btnIcon,
            color: styles.body,
            padding: '6px 10px',
          }}
        >
          <ArrowLeft size={18} />
        </button>
        <div
          style={{
            fontSize: 16,
            fontWeight: 700,
            color: styles.body,
            flex: 1,
            minWidth: 0,
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            whiteSpace: 'nowrap',
          }}
        >
          <BookOpen size={16} style={{ display: 'inline', verticalAlign: 'middle', marginRight: 8 }} />
          {article?.title || ''}
        </div>
        <button
          onClick={() => article && toggleFav({ title: article.title, lang, thumbnail: article.thumbnail?.source })}
          style={{
            ...btnIcon,
            color: isFav(article?.title || '', lang) ? '#ffd700' : styles.body,
          }}
          title={isFav(article?.title || '', lang) ? '取消收藏' : '收藏'}
        >
          {isFav(article?.title || '', lang) ? <Star size={18} fill="#ffd700" /> : <StarOff size={18} />}
        </button>
        <button
          onClick={() => setShowToc((v) => !v)}
          style={{ ...btnIcon, color: styles.body }}
          title="目录"
        >
          <List size={18} />
        </button>
        <button
          onClick={() => setShowSummary((v) => !v)}
          style={{ ...btnIcon, color: styles.body }}
          title="摘要"
        >
          {showSummary ? <EyeOff size={18} /> : <Eye size={18} />}
        </button>
        <a
          href={article?.fullurl}
          target="_blank"
          rel="noopener noreferrer"
          style={{ ...btnIcon, color: styles.body, textDecoration: 'none' }}
          title="在维基百科打开"
        >
          <ExternalLink size={18} />
        </a>
      </div>

      <div style={{ flex: 1, display: 'flex', overflow: 'hidden' }}>
        {showToc && article?.sections && article.sections.length > 0 && (
          <div
            style={{
              width: 220,
              padding: 16,
              overflowY: 'auto',
              borderRight: `1px solid ${styles.separator}`,
              flexShrink: 0,
            }}
          >
            <div
              style={{
                fontSize: 12,
                fontWeight: 600,
                textTransform: 'uppercase',
                letterSpacing: 1,
                color: styles.secondaryText,
                marginBottom: 12,
                display: 'flex',
                alignItems: 'center',
                gap: 6,
              }}
            >
              <List size={12} />
              {lang === 'zh' ? '目录' : 'Contents'}
            </div>
            {article.sections.map((sec) => (
              <div
                key={sec.id}
                onClick={() => scrollToSection(sec.id)}
                style={{
                  padding: '6px 8px',
                  fontSize: 13,
                  color: activeSection === sec.id ? styles.accent : styles.body,
                  fontWeight: activeSection === sec.id ? 600 : 400,
                  cursor: 'pointer',
                  borderRadius: 6,
                  transition: 'all 0.15s',
                  paddingLeft: 8 + (sec.level - 1) * 12,
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  whiteSpace: 'nowrap',
                  background: activeSection === sec.id ? styles.hoverBg : 'transparent',
                }}
                title={sec.title}
              >
                {sec.title}
              </div>
            ))}
          </div>
        )}

        <div
          ref={contentRef}
          style={{
            flex: 1,
            overflowY: 'auto',
            padding: '24px 32px',
            minWidth: 0,
          }}
        >
          {loadingArticle ? (
            <div
              style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                height: '60%',
                gap: 12,
                color: styles.secondaryText,
              }}
            >
              <Loader2 size={36} style={{ animation: 'spin 1s linear infinite' }} />
              <span>{lang === 'zh' ? '加载文章中...' : 'Loading article...'}</span>
            </div>
          ) : article ? (
            <div style={{ maxWidth: 860, margin: '0 auto' }}>
              {showSummary && article.extract && (
                <div
                  style={{
                    marginBottom: 24,
                    padding: 20,
                    borderRadius: 14,
                    background: styles.cardBg,
                    border: `1px solid ${styles.separator}`,
                    position: 'relative',
                    overflow: 'hidden',
                  }}
                >
                  <div
                    style={{
                      position: 'absolute',
                      top: 0,
                      left: 0,
                      width: 4,
                      height: '100%',
                      background: `linear-gradient(180deg, ${styles.accent} 0%, ${styles.accentLight} 100%)`,
                    }}
                  />
                  <div
                    style={{
                      fontSize: 12,
                      fontWeight: 600,
                      textTransform: 'uppercase',
                      letterSpacing: 1,
                      color: styles.accent,
                      marginBottom: 10,
                      display: 'flex',
                      alignItems: 'center',
                      gap: 6,
                    }}
                  >
                    <Sparkles size={14} />
                    {lang === 'zh' ? 'AI 智能摘要' : 'AI Summary'}
                  </div>
                  {article.thumbnail && (
                    <img
                      src={article.thumbnail.source}
                      alt={article.title}
                      style={{
                        maxWidth: '100%',
                        maxHeight: 200,
                        borderRadius: 10,
                        marginBottom: 16,
                        objectFit: 'cover',
                      }}
                    />
                  )}
                  <div
                    className="marked-summary"
                    style={{
                      lineHeight: 1.8,
                      fontSize: 15,
                      color: styles.body,
                    }}
                    dangerouslySetInnerHTML={{
                      __html: marked.parse(article.extract || ''),
                    }}
                  />
                  <div
                    style={{
                      marginTop: 14,
                      padding: '10px 12px',
                      borderRadius: 8,
                      fontSize: 11,
                      color: styles.tertiaryText,
                      background: 'rgba(0,0,0,0.04)',
                      display: 'flex',
                      alignItems: 'center',
                      gap: 6,
                    }}
                  >
                    <FileText size={12} />
                    {lang === 'zh'
                      ? `数据来源：维基百科 · ${new Blob([article.extract]).size} 字节`
                      : `Source: Wikipedia · ${new Blob([article.extract]).size} bytes`}
                  </div>
                </div>
              )}

              {article.htmlContent ? (
                <div
                  dangerouslySetInnerHTML={{
                    __html: article.htmlContent,
                  }}
                  style={{
                    lineHeight: 1.8,
                    fontSize: 15,
                    color: styles.body,
                  }}
                  className="wiki-content"
                />
              ) : article.extract ? (
                <div
                  style={{
                    lineHeight: 1.8,
                    fontSize: 15,
                    color: styles.body,
                    whiteSpace: 'pre-wrap',
                  }}
                >
                  {article.extract}
                </div>
              ) : (
                <div style={{ color: styles.tertiaryText, textAlign: 'center', padding: 30 }}>
                  {lang === 'zh' ? '暂无内容' : 'No content available'}
                </div>
              )}
            </div>
          ) : (
            <div style={{ color: styles.tertiaryText, textAlign: 'center', padding: 30 }}>
              {lang === 'zh' ? '请搜索一篇文章' : 'Search for an article'}
            </div>
          )}
        </div>
      </div>
    </div>
  )

  const LANG_LABEL: Record<Lang, string> = {
    en: 'English',
    zh: '中文',
  }

  // ==================== 主渲染 ====================
  return (
    <div style={styles.app}>
      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
        .spin { animation: spin 1s linear infinite; }
        .wiki-content h1, .wiki-content h2 { 
          font-size: 1.4em; 
          margin: 1em 0 0.5em; 
          padding-bottom: 0.3em;
          border-bottom: 1px solid ${styles.separator};
        }
        .wiki-content h3 { font-size: 1.2em; margin: 0.8em 0 0.4em; }
        .wiki-content p { margin: 0.6em 0; line-height: 1.8; }
        .wiki-content a { color: ${styles.accent}; text-decoration: none; }
        .wiki-content a:hover { text-decoration: underline; }
        .wiki-content ul, .wiki-content ol { padding-left: 1.5em; margin: 0.5em 0; }
        .wiki-content li { margin: 0.2em 0; }
        .wiki-content img { max-width: 100%; border-radius: 8px; margin: 0.5em 0; }
        .wiki-content table { 
          border-collapse: collapse; 
          margin: 1em 0; 
          width: 100%;
          font-size: 0.9em;
        }
        .wiki-content th, .wiki-content td { 
          border: 1px solid ${styles.separator}; 
          padding: 6px 10px; 
        }
        .wiki-content th { background: ${styles.cardBg}; font-weight: 600; }
        .wiki-content blockquote {
          border-left: 3px solid ${styles.accent};
          margin: 1em 0;
          padding: 0.5em 1em;
          color: ${styles.secondaryText};
          font-style: italic;
        }
        .wiki-content figure, .wiki-content .mw-file-description {
          margin: 1em 0;
          padding: 1em;
          border: 1px solid ${styles.separator};
          border-radius: 8px;
          background: ${styles.cardBg};
          text-align: center;
        }
        .wiki-content figure img { max-width: 100%; height: auto; }
        .wiki-content figcaption, .wiki-content .mw-file-caption {
          font-size: 0.85em;
          color: ${styles.secondaryText};
          margin-top: 0.5em;
        }
        ::-webkit-scrollbar { width: 8px; height: 8px; }
        ::-webkit-scrollbar-track { background: transparent; }
        ::-webkit-scrollbar-thumb { background: ${styles.separator}; border-radius: 4px; }
        ::-webkit-scrollbar-thumb:hover { background: ${styles.secondaryText}; }
        .marked-summary p { margin: 0.5em 0; }
        .marked-summary code {
          background: ${styles.separator};
          padding: 2px 6px;
          border-radius: 4px;
          font-size: 0.9em;
        }
        .marked-summary strong { color: ${styles.body}; font-weight: 600; }
        .marked-summary em { color: ${styles.secondaryText}; }
        .marked-summary a { color: ${styles.accent}; text-decoration: none; }
        .marked-summary a:hover { text-decoration: underline; }
        .marked-summary ul, .marked-summary ol { 
          padding-left: 1.4em; 
          margin: 0.5em 0; 
        }
      `}</style>

      <div style={styles.header}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div
            style={{
              width: 36,
              height: 36,
              borderRadius: 10,
              background: `linear-gradient(135deg, ${styles.accent} 0%, ${styles.accentLight} 100%)`,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: `0 4px 12px ${styles.accent}40`,
            }}
          >
            <Sparkles size={20} color="#fff" />
          </div>
          <div>
            <div style={{ fontSize: 17, fontWeight: 700, color: styles.body }}>AI Wiki Search</div>
            <div style={{ fontSize: 11, color: styles.secondaryText }}>
              {lang === 'zh' ? '智能维基百科搜索' : 'Intelligent Wikipedia Search'}
            </div>
          </div>
        </div>

        <div style={headerRightStyle}>
          <div style={{ display: 'flex', gap: 4, padding: 3, borderRadius: 10, background: styles.inputBg }}>
            <button onClick={() => setLang('en')} style={langBtnStyle(lang === 'en')}>
              <Globe size={12} /> EN
            </button>
            <button onClick={() => setLang('zh')} style={langBtnStyle(lang === 'zh')}>
              <Globe size={12} /> 中文
            </button>
          </div>

          <div style={{ display: 'flex', gap: 4 }}>
            <button
              onClick={() => setShowFav((v) => !v)}
              style={{
                ...btnIcon,
                color: showFav ? '#ffd700' : styles.body,
                background: showFav ? styles.inputBg : 'transparent',
              }}
              title={lang === 'zh' ? '收藏' : 'Favorites'}
            >
              {showFav ? <Star size={18} fill="#ffd700" /> : <Star size={18} />}
            </button>
            <button
              onClick={() => setTheme((t) => (t === 'dark' ? 'light' : 'dark'))}
              style={btnIcon}
              title={lang === 'zh' ? '切换主题' : 'Toggle theme'}
            >
              {theme === 'dark' ? <Sun size={18} /> : <Moon size={18} />}
            </button>
          </div>
        </div>
      </div>

      {view === 'search' && (
        <div style={{ flex: 1, display: 'flex', overflow: 'hidden' }}>
          <div
            style={{
              flex: 1,
              padding: '20px 24px',
              overflowY: 'auto',
              display: 'flex',
              flexDirection: 'column',
              gap: 20,
            }}
          >
            {renderSearchPanel()}
            {leftPanel === 'search' && (
              <div
                style={{
                  padding: 20,
                  borderRadius: 14,
                  ...styles.glass,
                }}
              >
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 8,
                    marginBottom: 14,
                  }}
                >
                  <Sparkles size={18} color={styles.accent} />
                  <span style={{ fontWeight: 600, fontSize: 14, color: styles.body }}>
                    {lang === 'zh' ? 'AI 智能摘要' : 'AI Summary'}
                  </span>
                </div>
                <div style={{ fontSize: 13, color: styles.secondaryText, lineHeight: 1.8 }}>
                  {lang === 'zh'
                    ? '输入任何关键词搜索，获取维基百科的智能摘要和完整文章内容。支持中英文搜索，实时建议，目录导航，收藏管理等功能。'
                    : 'Search any keyword to get intelligent summaries and full article content from Wikipedia. Supports bilingual search, real-time suggestions, table of contents navigation, favorites management, and more.'}
                </div>

                <div
                  style={{
                    marginTop: 16,
                    display: 'grid',
                    gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))',
                    gap: 10,
                  }}
                >
                  {[
                    { icon: <Search size={16} />, label: lang === 'zh' ? '实时搜索' : 'Real-time' },
                    { icon: <Globe size={16} />, label: lang === 'zh' ? '多语言' : 'Bilingual' },
                    { icon: <BookOpen size={16} />, label: lang === 'zh' ? '阅读视图' : 'Reader View' },
                    { icon: <Star size={16} />, label: lang === 'zh' ? '收藏管理' : 'Favorites' },
                  ].map((f) => (
                    <div
                      key={f.label}
                      style={{
                        padding: '10px 12px',
                        borderRadius: 8,
                        background: styles.cardBg,
                        display: 'flex',
                        alignItems: 'center',
                        gap: 8,
                        fontSize: 12,
                        color: styles.body,
                      }}
                    >
                      <span style={{ color: styles.accent }}>{f.icon}</span>
                      {f.label}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {leftPanel === 'favorites' && renderFavoritesPanel()}
            {leftPanel === 'history' && renderHistoryPanel()}
          </div>

          {showFav && (
            <div
              style={{
                width: 280,
                padding: 16,
                borderLeft: `1px solid ${styles.separator}`,
                overflowY: 'auto',
                ...styles.glass,
              }}
            >
              <div
                style={{
                  display: 'flex',
                  gap: 4,
                  marginBottom: 16,
                  padding: 4,
                  borderRadius: 8,
                  background: styles.inputBg,
                }}
              >
                <button
                  onClick={() => setLeftPanel('search')}
                  style={{
                    flex: 1,
                    padding: '8px',
                    borderRadius: 6,
                    background: leftPanel === 'search' ? styles.accent : 'transparent',
                    color: leftPanel === 'search' ? '#fff' : styles.body,
                    border: 'none',
                    fontSize: 12,
                    cursor: 'pointer',
                    fontWeight: leftPanel === 'search' ? 600 : 400,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: 4,
                  }}
                >
                  <Search size={12} />
                  {lang === 'zh' ? '推荐' : 'Featured'}
                </button>
                <button
                  onClick={() => setLeftPanel('favorites')}
                  style={{
                    flex: 1,
                    padding: '8px',
                    borderRadius: 6,
                    background: leftPanel === 'favorites' ? styles.accent : 'transparent',
                    color: leftPanel === 'favorites' ? '#fff' : styles.body,
                    border: 'none',
                    fontSize: 12,
                    cursor: 'pointer',
                    fontWeight: leftPanel === 'favorites' ? 600 : 400,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: 4,
                  }}
                >
                  <Star size={12} />
                  {lang === 'zh' ? '收藏' : 'Saved'}
                </button>
                <button
                  onClick={() => setLeftPanel('history')}
                  style={{
                    flex: 1,
                    padding: '8px',
                    borderRadius: 6,
                    background: leftPanel === 'history' ? styles.accent : 'transparent',
                    color: leftPanel === 'history' ? '#fff' : styles.body,
                    border: 'none',
                    fontSize: 12,
                    cursor: 'pointer',
                    fontWeight: leftPanel === 'history' ? 600 : 400,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: 4,
                  }}
                >
                  <History size={12} />
                  {lang === 'zh' ? '历史' : 'History'}
                </button>
              </div>

              {leftPanel === 'search' && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                  {(lang === 'zh'
                    ? ['人工智能', '量子计算', '气候变化', '太空探索', '生物科技', '区块链', '元宇宙', '新能源']
                    : ['Artificial Intelligence', 'Quantum Computing', 'Climate Change', 'Space Exploration', 'Biotechnology', 'Blockchain', 'Metaverse', 'Renewable Energy']
                  ).map((topic, i) => (
                    <div
                      key={topic}
                      onClick={() => {
                        setQuery(topic)
                        fetchArticle(topic)
                      }}
                      style={{
                        padding: '10px 12px',
                        borderRadius: 8,
                        background: styles.cardBg,
                        cursor: 'pointer',
                        fontSize: 13,
                        color: styles.body,
                        transition: 'all 0.2s',
                        display: 'flex',
                        alignItems: 'center',
                        gap: 10,
                      }}
                    >
                      <span
                        style={{
                          width: 24,
                          height: 24,
                          borderRadius: 6,
                          background: `linear-gradient(135deg, ${styles.accent} 0%, ${styles.accentLight} 100%)`,
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          fontSize: 11,
                          fontWeight: 700,
                          color: '#fff',
                          flexShrink: 0,
                        }}
                      >
                        {i + 1}
                      </span>
                      {topic}
                    </div>
                  ))}
                </div>
              )}

              {leftPanel === 'favorites' && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                  {favorites.length === 0 ? (
                    <div style={{ color: styles.tertiaryText, fontSize: 13, textAlign: 'center', padding: 20 }}>
                      {lang === 'zh' ? '还没有收藏' : 'No favorites yet'}
                    </div>
                  ) : (
                    favorites.map((f) => (
                      <div
                        key={f.title + f.lang}
                        onClick={() => {
                          if (f.lang !== lang) setLang(f.lang)
                          fetchArticle(f.title)
                        }}
                        style={{
                          padding: '10px 12px',
                          borderRadius: 8,
                          background: styles.cardBg,
                          cursor: 'pointer',
                          fontSize: 13,
                          color: styles.body,
                        }}
                      >
                        <div
                          style={{
                            fontWeight: 500,
                            overflow: 'hidden',
                            textOverflow: 'ellipsis',
                            whiteSpace: 'nowrap',
                          }}
                        >
                          {f.title}
                        </div>
                        <div style={{ fontSize: 11, color: styles.tertiaryText }}>
                          {LANG_LABEL[f.lang]}
                        </div>
                      </div>
                    ))
                  )}
                </div>
              )}

              {leftPanel === 'history' && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                  {history.length === 0 ? (
                    <div style={{ color: styles.tertiaryText, fontSize: 13, textAlign: 'center', padding: 20 }}>
                      {lang === 'zh' ? '暂无历史' : 'No history'}
                    </div>
                  ) : (
                    history.map((h) => (
                      <div
                        key={h.title + h.timestamp}
                        onClick={() => {
                          if (h.lang !== lang) setLang(h.lang)
                          fetchArticle(h.title)
                        }}
                        style={{
                          padding: '10px 12px',
                          borderRadius: 8,
                          background: styles.cardBg,
                          cursor: 'pointer',
                          fontSize: 13,
                          color: styles.body,
                        }}
                      >
                        <div
                          style={{
                            overflow: 'hidden',
                            textOverflow: 'ellipsis',
                            whiteSpace: 'nowrap',
                          }}
                        >
                          {h.title}
                        </div>
                        <div style={{ fontSize: 11, color: styles.tertiaryText }}>
                          {LANG_LABEL[h.lang]} · {new Date(h.timestamp).toLocaleTimeString()}
                        </div>
                      </div>
                    ))
                  )}
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {view === 'article' && renderArticleView()}
    </div>
  )
}
