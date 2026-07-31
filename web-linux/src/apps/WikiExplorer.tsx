import { useState, useEffect, useCallback, useMemo } from 'react'

// ─── Types ────────────────────────────────────────────────────────────────────

interface SearchResult {
  title: string
  pageid: number
  snippet: string
}

interface WikiArticle {
  title: string
  pageid: number
  extract: string
  thumbnail?: { source: string; width: number; height: number }
  fullurl: string
  categories?: string[]
}

interface HistoryItem {
  title: string
  pageid: number
  lang: string
  timestamp: number
}

interface FavoriteItem {
  title: string
  pageid: number
  lang: string
  addedAt: number
}

type ViewMode = 'home' | 'search' | 'article'
type LangCode = 'en' | 'zh'

// ─── Constants ────────────────────────────────────────────────────────────────

const LANG_MAP: Record<LangCode, { label: string; flag: string }> = {
  en: { label: 'English', flag: '🇺🇸' },
  zh: { label: '中文', flag: '🇨🇳' },
}

const HISTORY_KEY = 'wiki-explorer-history-v1'
const FAVORITES_KEY = 'wiki-explorer-favorites-v1'
const MAX_HISTORY = 50

// ─── Style tokens ─────────────────────────────────────────────────────────────

const S = {
  bgPrimary: '#0a0a18',
  bgSecondary: '#12122a',
  bgTertiary: '#1a1a3a',
  accent: '#8b7cf0',
  accentLight: '#a89cf8',
  accentDark: '#6b5cd0',
  accentGlow: 'rgba(139,124,240,0.25)',
  textPrimary: '#e2e8f0',
  textSecondary: '#a0aec0',
  textMuted: '#718096',
  border: 'rgba(139,124,240,0.15)',
  borderHover: 'rgba(139,124,240,0.35)',
  glass: 'rgba(255,255,255,0.04)',
  glassHover: 'rgba(255,255,255,0.08)',
  glassActive: 'rgba(139,124,240,0.12)',
  danger: '#f56565',
  success: '#48bb78',
  warning: '#ecc94b',
}

// ─── API helpers ──────────────────────────────────────────────────────────────

const apiBase = (lang: LangCode) => `https://${lang}.wikipedia.org/w/api.php`

async function searchWiki(query: string, lang: LangCode): Promise<SearchResult[]> {
  const url = `${apiBase(lang)}?action=query&list=search&srsearch=${encodeURIComponent(query)}&format=json&origin=*&srlimit=12`
  const res = await fetch(url)
  if (!res.ok) throw new Error(`HTTP ${res.status}`)
  const data = await res.json()
  return (data.query?.search || []).map((r: any) => ({
    title: r.title,
    pageid: r.pageid,
    snippet: r.snippet?.replace(/<[^>]*>/g, '') || '',
  }))
}

async function fetchArticle(pageid: number, lang: LangCode): Promise<WikiArticle | null> {
  const url = `${apiBase(lang)}?action=query&prop=extracts|pageimages|info|categories&exintro=true&explaintext=true&piprop=thumbnail&pithumbsize=500&inprop=url&pageids=${pageid}&format=json&origin=*`
  const res = await fetch(url)
  if (!res.ok) throw new Error(`HTTP ${res.status}`)
  const data = await res.json()
  const page = data.query?.pages?.[String(pageid)]
  if (!page || page.missing !== undefined) return null
  const cats: string[] = (page.categories || [])
    .map((c: any) => c.title?.replace(/^Category:/, '') || '')
    .filter(Boolean)
  return {
    title: page.title,
    pageid: page.pageid,
    extract: page.extract || '',
    thumbnail: page.thumbnail || undefined,
    fullurl: page.fullurl || `https://${lang}.wikipedia.org/wiki/${encodeURIComponent(page.title)}`,
    categories: cats,
  }
}

async function fetchRandomArticles(lang: LangCode): Promise<Array<{ id: number; title: string }>> {
  const url = `${apiBase(lang)}?action=query&list=random&rnlimit=5&rnnamespace=0&format=json&origin=*`
  const res = await fetch(url)
  if (!res.ok) throw new Error(`HTTP ${res.status}`)
  const data = await res.json()
  return data.query?.random || []
}

async function fetchRelatedArticles(pageid: number, lang: LangCode): Promise<Array<{ title: string; pageid: number }>> {
  const url = `${apiBase(lang)}?action=query&prop=links&pageids=${pageid}&pllimit=8&plnamespace=0&format=json&origin=*`
  const res = await fetch(url)
  if (!res.ok) return []
  const data = await res.json()
  const links = data.query?.pages?.[String(pageid)]?.links || []
  return links.map((l: any) => ({ title: l.title, pageid: l.pageid ?? 0 })).slice(0, 8)
}

// ─── localStorage helpers ─────────────────────────────────────────────────────

function loadFromStorage<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(key)
    return raw ? JSON.parse(raw) : fallback
  } catch {
    return fallback
  }
}

function saveToStorage<T>(key: string, data: T): void {
  try {
    localStorage.setItem(key, JSON.stringify(data))
  } catch {
    // ignore quota errors
  }
}

// ─── Skeleton component ───────────────────────────────────────────────────────

function Skeleton({ width, height, radius = 6 }: { width: string; height: string; radius?: number }) {
  return (
    <div style={{
      width,
      height,
      borderRadius: radius,
      background: `linear-gradient(90deg, ${S.glass} 25%, ${S.glassHover} 50%, ${S.glass} 75%)`,
      backgroundSize: '200% 100%',
      animation: 'wikiShimmer 1.5s ease-in-out infinite',
    }} />
  )
}

function ArticleSkeleton() {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 14, padding: 4 }}>
      <Skeleton width="70%" height="28px" radius={8} />
      <Skeleton width="100%" height="180px" radius={10} />
      <Skeleton width="100%" height="16px" />
      <Skeleton width="95%" height="16px" />
      <Skeleton width="90%" height="16px" />
      <Skeleton width="85%" height="16px" />
      <Skeleton width="60%" height="16px" />
    </div>
  )
}

// ─── Main component ───────────────────────────────────────────────────────────

const WikiExplorer = () => {
  const [lang, setLang] = useState<LangCode>('zh')
  const [view, setView] = useState<ViewMode>('home')
  const [query, setQuery] = useState('')

  // Search state
  const [searchResults, setSearchResults] = useState<SearchResult[]>([])
  const [searchLoading, setSearchLoading] = useState(false)
  const [searchError, setSearchError] = useState<string | null>(null)

  // Article state
  const [currentArticle, setCurrentArticle] = useState<WikiArticle | null>(null)
  const [articleLoading, setArticleLoading] = useState(false)
  const [articleError, setArticleError] = useState<string | null>(null)
  const [relatedArticles, setRelatedArticles] = useState<Array<{ title: string; pageid: number }>>([])

  // Random articles
  const [randomArticles, setRandomArticles] = useState<Array<{ id: number; title: string }>>([])
  const [randomLoading, setRandomLoading] = useState(false)

  // Featured article
  const [featuredArticle, setFeaturedArticle] = useState<WikiArticle | null>(null)

  // History & Favorites
  const [history, setHistory] = useState<HistoryItem[]>(() => loadFromStorage(HISTORY_KEY, []))
  const [favorites, setFavorites] = useState<FavoriteItem[]>(() => loadFromStorage(FAVORITES_KEY, []))

  // Toast
  const [toast, setToast] = useState<string | null>(null)

  // ── Toast helper ──
  const showToast = useCallback((msg: string) => {
    setToast(msg)
    setTimeout(() => setToast(null), 2200)
  }, [])

  // ── Persist helpers ──
  const persistHistory = useCallback((items: HistoryItem[]) => {
    setHistory(items)
    saveToStorage(HISTORY_KEY, items)
  }, [])

  const persistFavorites = useCallback((items: FavoriteItem[]) => {
    setFavorites(items)
    saveToStorage(FAVORITES_KEY, items)
  }, [])

  // ── Favorites logic ──
  const isFavorite = useCallback(
    (title: string) => favorites.some((f) => f.title === title && f.lang === lang),
    [favorites, lang],
  )

  const toggleFavorite = useCallback(
    (title: string, pageid: number) => {
      const exists = favorites.find((f) => f.title === title && f.lang === lang)
      if (exists) {
        persistFavorites(favorites.filter((f) => !(f.title === title && f.lang === lang)))
        showToast('已移除收藏')
      } else {
        persistFavorites([{ title, pageid, lang, addedAt: Date.now() }, ...favorites])
        showToast('已添加到收藏 ✓')
      }
    },
    [favorites, lang, persistFavorites, showToast],
  )

  // ── Add to history ──
  const addToHistory = useCallback(
    (title: string, pageid: number) => {
      const filtered = history.filter((h) => !(h.title === title && h.lang === lang))
      const updated = [{ title, pageid, lang, timestamp: Date.now() }, ...filtered].slice(0, MAX_HISTORY)
      persistHistory(updated)
    },
    [history, lang, persistHistory],
  )

  // ── Search ──
  const doSearch = useCallback(async (searchQuery?: string) => {
    const q = (searchQuery ?? query).trim()
    if (!q) return
    setQuery(q)
    setSearchLoading(true)
    setSearchError(null)
    try {
      const results = await searchWiki(q, lang)
      setSearchResults(results)
      setView('search')
    } catch {
      setSearchError('搜索失败，请检查网络后重试')
    } finally {
      setSearchLoading(false)
    }
  }, [query, lang])

  // ── Open article ──
  const openArticle = useCallback(async (pageid: number, _title?: string) => {
    setArticleLoading(true)
    setArticleError(null)
    setCurrentArticle(null)
    setRelatedArticles([])
    setView('article')
    try {
      const article = await fetchArticle(pageid, lang)
      if (article) {
        setCurrentArticle(article)
        addToHistory(article.title, article.pageid)
        // Fetch related articles in background
        fetchRelatedArticles(pageid, lang).then(setRelatedArticles).catch(() => {})
      } else {
        setArticleError('未找到该条目')
      }
    } catch {
      setArticleError('加载条目失败，请检查网络连接')
    } finally {
      setArticleLoading(false)
    }
  }, [lang, addToHistory])

  // ── Load random ──
  const loadRandom = useCallback(async () => {
    setRandomLoading(true)
    try {
      const list = await fetchRandomArticles(lang)
      setRandomArticles(list)
    } catch {
      showToast('获取随机文章失败')
    } finally {
      setRandomLoading(false)
    }
  }, [lang, showToast])

  // ── Load featured on mount ──
  useEffect(() => {
    const loadFeatured = async () => {
      try {
        const url = `${apiBase(lang)}?action=query&prop=extracts|pageimages|info&exintro=true&explaintext=true&piprop=thumbnail&pithumbsize=500&inprop=url&titles=${lang === 'zh' ? '人工智能' : 'Artificial_intelligence'}&format=json&origin=*`
        const res = await fetch(url)
        if (!res.ok) return
        const data = await res.json()
        const pages = data.query?.pages
        if (pages) {
          const pageId = Object.keys(pages)[0]
          const page = pages[pageId]
          if (page && page.missing === undefined) {
            setFeaturedArticle({
              title: page.title,
              pageid: page.pageid,
              extract: page.extract || '',
              thumbnail: page.thumbnail || undefined,
              fullurl: page.fullurl || '',
            })
          }
        }
      } catch {
        // silently ignore
      }
    }
    loadFeatured()
  }, [lang])

  // ── Load random on mount ──
  useEffect(() => {
    loadRandom()
  }, [lang]) // eslint-disable-line react-hooks/exhaustive-deps

  // ── Navigate back ──
  const goBack = useCallback(() => {
    if (view === 'article' && searchResults.length > 0) {
      setView('search')
    } else {
      setView('home')
    }
    setCurrentArticle(null)
    setArticleError(null)
  }, [view, searchResults.length])

  // ── Computed: recent history (deduplicated by title for display) ──
  const recentHistory = useMemo(() => {
    const seen = new Set<string>()
    return history.filter((h) => {
      const key = `${h.lang}:${h.title}`
      if (seen.has(key)) return false
      seen.add(key)
      return true
    }).slice(0, 10)
  }, [history])

  // ═══════════════════════════════════════════════════════════════════════════
  // RENDER
  // ═══════════════════════════════════════════════════════════════════════════

  return (
    <div style={styles.root}>
      {/* Inject keyframes */}
      <style>{`
        @keyframes wikiShimmer {
          0% { background-position: 200% 0; }
          100% { background-position: -200% 0; }
        }
        @keyframes wikiFadeIn {
          from { opacity: 0; transform: translateY(8px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @keyframes wikiSpin {
          to { transform: rotate(360deg); }
        }
        @keyframes wikiPulse {
          0%, 100% { opacity: 0.6; }
          50% { opacity: 1; }
        }
      `}</style>

      {/* ── Header / Search bar ── */}
      <div style={styles.header}>
        <div style={styles.headerLeft}>
          <svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke={S.accent} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="12" cy="12" r="10" />
            <path d="M2 12h20" />
            <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z" />
          </svg>
          <span style={styles.headerTitle}>WikiExplorer</span>
        </div>

        <form
          onSubmit={(e) => { e.preventDefault(); doSearch() }}
          style={styles.searchForm}
        >
          <div style={styles.searchInputWrap}>
            <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke={S.textMuted} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)' }}>
              <circle cx="11" cy="11" r="8" /><path d="M21 21l-4.35-4.35" />
            </svg>
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder={lang === 'zh' ? '搜索维基百科...' : 'Search Wikipedia...'}
              style={styles.searchInput}
            />
          </div>
          <button type="submit" disabled={searchLoading} style={styles.searchBtn}>
            {searchLoading ? (
              <div style={{ width: 16, height: 16, border: '2px solid rgba(255,255,255,0.3)', borderTopColor: '#fff', borderRadius: '50%', animation: 'wikiSpin 0.7s linear infinite' }} />
            ) : (
              <span>{lang === 'zh' ? '搜索' : 'Search'}</span>
            )}
          </button>
        </form>

        {/* Language switcher */}
        <div style={styles.langSwitcher}>
          {(Object.entries(LANG_MAP) as [LangCode, typeof LANG_MAP[LangCode]][]).map(([code, cfg]) => (
            <button
              key={code}
              onClick={() => setLang(code)}
              style={{
                ...styles.langBtn,
                background: lang === code ? S.accent : 'transparent',
                color: lang === code ? '#fff' : S.textSecondary,
                fontWeight: lang === code ? 700 : 400,
              }}
            >
              {cfg.flag} {cfg.label}
            </button>
          ))}
        </div>
      </div>

      {/* ── Action bar (back + random + favorites) ── */}
      <div style={styles.actionBar}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          {view !== 'home' && (
            <button onClick={goBack} style={styles.actionBtn}>
              ← {lang === 'zh' ? '返回' : 'Back'}
            </button>
          )}
          <button onClick={loadRandom} disabled={randomLoading} style={styles.actionBtn}>
            🎲 {lang === 'zh' ? '随机发现' : 'Random'}
          </button>
          <button
            onClick={() => {
              if (favorites.length === 0) {
                showToast(lang === 'zh' ? '暂无收藏' : 'No favorites yet')
                return
              }
              // Show favorites as toast-like list; or navigate to home and show section
              showToast(lang === 'zh' ? `已收藏 ${favorites.filter(f => f.lang === lang).length} 篇文章` : `${favorites.filter(f => f.lang === lang).length} favorites`)
            }}
            style={styles.actionBtn}
          >
            ⭐ {lang === 'zh' ? '收藏' : 'Favs'} ({favorites.filter(f => f.lang === lang).length})
          </button>
        </div>
        {view === 'article' && currentArticle && (
          <button
            onClick={() => toggleFavorite(currentArticle.title, currentArticle.pageid)}
            style={{
              ...styles.favBtn,
              color: isFavorite(currentArticle.title) ? S.warning : S.textSecondary,
            }}
          >
            {isFavorite(currentArticle.title) ? '★' : '☆'} {lang === 'zh' ? '收藏' : 'Favorite'}
          </button>
        )}
      </div>

      {/* ── Content area ── */}
      <div style={styles.content}>
        {/* ── HOME VIEW ── */}
        {view === 'home' && (
          <div style={{ animation: 'wikiFadeIn 0.3s ease' }}>
            {/* Featured article */}
            {featuredArticle && (
              <div style={styles.section}>
                <div style={styles.sectionTitle}>
                  <span style={{ color: S.accent, fontSize: 16 }}>📖</span>
                  <span>{lang === 'zh' ? '精选文章' : 'Featured Article'}</span>
                </div>
                <div
                  onClick={() => openArticle(featuredArticle.pageid, featuredArticle.title)}
                  style={styles.featuredCard}
                >
                  <div style={{ display: 'flex', gap: 16 }}>
                    {featuredArticle.thumbnail && (
                      <img
                        src={featuredArticle.thumbnail.source}
                        alt={featuredArticle.title}
                        style={styles.featuredImg}
                      />
                    )}
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <h2 style={styles.featuredTitle}>{featuredArticle.title}</h2>
                      <p style={styles.featuredExtract}>
                        {featuredArticle.extract?.slice(0, 180)}
                        {(featuredArticle.extract?.length || 0) > 180 ? '…' : ''}
                      </p>
                      <span style={styles.readMore}>{lang === 'zh' ? '阅读更多 →' : 'Read more →'}</span>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Random discoveries */}
            <div style={styles.section}>
              <div style={styles.sectionTitle}>
                <span style={{ color: S.warning, fontSize: 16 }}>🎲</span>
                <span>{lang === 'zh' ? '随机发现' : 'Random Discoveries'}</span>
                <button onClick={loadRandom} disabled={randomLoading} style={styles.refreshBtn}>
                  ↻
                </button>
              </div>
              <div style={styles.randomGrid}>
                {randomLoading ? (
                  Array.from({ length: 5 }).map((_, i) => (
                    <Skeleton key={i} width="100%" height="42px" radius={8} />
                  ))
                ) : (
                  randomArticles.map((r) => (
                    <button
                      key={r.id}
                      onClick={() => openArticle(r.id, r.title)}
                      style={styles.randomBtn}
                    >
                      {r.title}
                    </button>
                  ))
                )}
              </div>
            </div>

            {/* History */}
            <div style={styles.section}>
              <div style={styles.sectionTitle}>
                <span style={{ color: S.success, fontSize: 16 }}>🕐</span>
                <span>{lang === 'zh' ? '阅读历史' : 'Reading History'}</span>
                {history.length > 0 && (
                  <button
                    onClick={() => { persistHistory([]); showToast(lang === 'zh' ? '历史已清空' : 'History cleared') }}
                    style={styles.clearBtn}
                  >
                    {lang === 'zh' ? '清空' : 'Clear'}
                  </button>
                )}
              </div>
              {recentHistory.length === 0 ? (
                <div style={styles.emptyText}>{lang === 'zh' ? '暂无浏览历史' : 'No reading history yet'}</div>
              ) : (
                <div style={styles.historyList}>
                  {recentHistory.map((h) => (
                    <button
                      key={`${h.lang}:${h.title}:${h.timestamp}`}
                      onClick={() => openArticle(h.pageid, h.title)}
                      style={styles.historyBtn}
                    >
                      <span style={styles.historyTitle}>{h.title}</span>
                      <span style={styles.historyTime}>
                        {new Date(h.timestamp).toLocaleDateString(lang === 'zh' ? 'zh-CN' : 'en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Favorites */}
            {favorites.filter(f => f.lang === lang).length > 0 && (
              <div style={styles.section}>
                <div style={styles.sectionTitle}>
                  <span style={{ color: S.warning, fontSize: 16 }}>⭐</span>
                  <span>{lang === 'zh' ? '我的收藏' : 'My Favorites'}</span>
                </div>
                <div style={styles.favList}>
                  {favorites.filter(f => f.lang === lang).slice(0, 8).map((f) => (
                    <div key={`${f.lang}:${f.title}`} style={styles.favItem}>
                      <button onClick={() => openArticle(f.pageid, f.title)} style={styles.favItemTitle}>
                        {f.title}
                      </button>
                      <button
                        onClick={() => {
                          persistFavorites(favorites.filter(x => !(x.title === f.title && x.lang === f.lang)))
                          showToast(lang === 'zh' ? '已移除收藏' : 'Removed from favorites')
                        }}
                        style={styles.favRemoveBtn}
                      >
                        ×
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* ── SEARCH VIEW ── */}
        {view === 'search' && (
          <div style={{ animation: 'wikiFadeIn 0.3s ease' }}>
            {searchError && (
              <div style={styles.errorBanner}>⚠️ {searchError}</div>
            )}

            {searchLoading ? (
              <div style={styles.skeletonList}>
                {Array.from({ length: 6 }).map((_, i) => (
                  <div key={i} style={{ display: 'flex', flexDirection: 'column', gap: 8, padding: '16px', background: S.glass, borderRadius: 10, border: `1px solid ${S.border}` }}>
                    <Skeleton width="60%" height="18px" />
                    <Skeleton width="100%" height="14px" />
                    <Skeleton width="85%" height="14px" />
                  </div>
                ))}
              </div>
            ) : (
              <>
                <div style={styles.resultCount}>
                  {lang === 'zh'
                    ? `找到 ${searchResults.length} 个结果`
                    : `${searchResults.length} results found`}
                </div>
                <div style={styles.searchList}>
                  {searchResults.map((result, idx) => (
                    <div
                      key={`${result.pageid}-${idx}`}
                      onClick={() => openArticle(result.pageid, result.title)}
                      style={styles.searchCard}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.background = S.glassHover
                        e.currentTarget.style.borderColor = S.borderHover
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.background = S.glass
                        e.currentTarget.style.borderColor = S.border
                      }}
                    >
                      <h3 style={styles.searchCardTitle}>{result.title}</h3>
                      <p style={styles.searchCardSnippet}>{result.snippet}…</p>
                      <div style={styles.searchCardFooter}>
                        <span style={{ color: S.accentLight, fontSize: 12 }}>PageID: {result.pageid}</span>
                        <button
                          onClick={(e) => { e.stopPropagation(); toggleFavorite(result.title, result.pageid) }}
                          style={styles.miniFavBtn}
                        >
                          {isFavorite(result.title) ? '★' : '☆'}
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </>
            )}
          </div>
        )}

        {/* ── ARTICLE VIEW ── */}
        {view === 'article' && (
          <div style={{ animation: 'wikiFadeIn 0.3s ease' }}>
            {articleLoading ? (
              <ArticleSkeleton />
            ) : articleError ? (
              <div style={styles.errorBanner}>⚠️ {articleError}</div>
            ) : currentArticle ? (
              <>
                <article style={styles.article}>
                  <h1 style={styles.articleTitle}>{currentArticle.title}</h1>

                  {currentArticle.thumbnail && (
                    <div style={styles.articleImgWrap}>
                      <img
                        src={currentArticle.thumbnail.source}
                        alt={currentArticle.title}
                        style={styles.articleImg}
                      />
                    </div>
                  )}

                  <div style={styles.articleBody}>
                    {currentArticle.extract?.split('\n').map((paragraph, i) => (
                      paragraph.trim() ? <p key={i} style={styles.articleParagraph}>{paragraph}</p> : null
                    ))}
                  </div>

                  {/* Categories */}
                  {currentArticle.categories && currentArticle.categories.length > 0 && (
                    <div style={styles.categoriesWrap}>
                      <span style={{ color: S.textMuted, fontSize: 12, marginRight: 8 }}>
                        {lang === 'zh' ? '分类：' : 'Categories: '}
                      </span>
                      {currentArticle.categories.slice(0, 8).map((cat) => (
                        <span key={cat} style={styles.categoryTag}>{cat}</span>
                      ))}
                    </div>
                  )}

                  {/* External link */}
                  <div style={styles.articleFooter}>
                    <a
                      href={currentArticle.fullurl}
                      target="_blank"
                      rel="noopener noreferrer"
                      style={styles.externalLink}
                    >
                      {lang === 'zh' ? '在维基百科中查看原文' : 'View on Wikipedia'} ↗
                    </a>
                    <span style={{ color: S.textMuted, fontSize: 11 }}>
                      CC BY-SA 3.0 · {LANG_MAP[lang].label}
                    </span>
                  </div>
                </article>

                {/* Related articles */}
                {relatedArticles.length > 0 && (
                  <div style={styles.relatedSection}>
                    <div style={styles.sectionTitle}>
                      <span style={{ color: S.accentLight, fontSize: 16 }}>🔗</span>
                      <span>{lang === 'zh' ? '相关文章' : 'Related Articles'}</span>
                    </div>
                    <div style={styles.relatedGrid}>
                      {relatedArticles.map((r) => (
                        <button
                          key={r.title}
                          onClick={() => openArticle(r.pageid, r.title)}
                          style={styles.relatedBtn}
                          onMouseEnter={(e) => {
                            e.currentTarget.style.background = S.glassHover
                            e.currentTarget.style.borderColor = S.borderHover
                          }}
                          onMouseLeave={(e) => {
                            e.currentTarget.style.background = S.glass
                            e.currentTarget.style.borderColor = S.border
                          }}
                        >
                          {r.title}
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </>
            ) : null}
          </div>
        )}
      </div>

      {/* ── Toast ── */}
      {toast && (
        <div style={styles.toast}>
          {toast}
        </div>
      )}
    </div>
  )
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles: Record<string, React.CSSProperties> = {
  root: {
    width: '100%',
    height: '100%',
    background: `linear-gradient(160deg, ${S.bgPrimary} 0%, ${S.bgSecondary} 50%, #0e0e24 100%)`,
    color: S.textPrimary,
    display: 'flex',
    flexDirection: 'column',
    overflow: 'hidden',
    fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, "PingFang SC", "Microsoft YaHei", sans-serif',
  },

  // Header
  header: {
    padding: '14px 18px',
    borderBottom: `1px solid ${S.border}`,
    display: 'flex',
    alignItems: 'center',
    gap: 14,
    background: `rgba(10,10,24,0.85)`,
    backdropFilter: 'blur(12px)',
    flexWrap: 'wrap' as const,
  },
  headerLeft: {
    display: 'flex',
    alignItems: 'center',
    gap: 10,
    flexShrink: 0,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: 800,
    background: `linear-gradient(135deg, ${S.accent}, ${S.accentLight})`,
    WebkitBackgroundClip: 'text',
    WebkitTextFillColor: 'transparent',
    letterSpacing: -0.3,
  },
  searchForm: {
    display: 'flex',
    gap: 8,
    flex: 1,
    minWidth: 200,
  },
  searchInputWrap: {
    flex: 1,
    position: 'relative' as const,
    display: 'flex',
    alignItems: 'center',
  },
  searchInput: {
    width: '100%',
    padding: '10px 14px 10px 38px',
    fontSize: 14,
    borderRadius: 10,
    border: `1px solid ${S.border}`,
    background: S.glass,
    color: S.textPrimary,
    outline: 'none',
    transition: 'border-color 0.2s, box-shadow 0.2s',
  },
  searchBtn: {
    padding: '10px 20px',
    background: `linear-gradient(135deg, ${S.accent}, ${S.accentDark})`,
    color: '#fff',
    border: 'none',
    borderRadius: 10,
    fontSize: 14,
    fontWeight: 600,
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    gap: 6,
    transition: 'opacity 0.15s, transform 0.15s',
    flexShrink: 0,
  },

  // Language switcher
  langSwitcher: {
    display: 'flex',
    gap: 4,
    background: S.glass,
    padding: 3,
    borderRadius: 8,
    border: `1px solid ${S.border}`,
    flexShrink: 0,
  },
  langBtn: {
    padding: '6px 12px',
    border: 'none',
    borderRadius: 6,
    fontSize: 12,
    cursor: 'pointer',
    transition: 'all 0.2s',
  },

  // Action bar
  actionBar: {
    padding: '8px 18px',
    borderBottom: `1px solid ${S.border}`,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    background: `rgba(18,18,42,0.6)`,
  },
  actionBtn: {
    padding: '6px 14px',
    background: S.glass,
    border: `1px solid ${S.border}`,
    color: S.textPrimary,
    borderRadius: 8,
    fontSize: 13,
    cursor: 'pointer',
    transition: 'all 0.2s',
  },
  favBtn: {
    padding: '6px 14px',
    background: S.glass,
    border: `1px solid ${S.border}`,
    borderRadius: 8,
    fontSize: 13,
    cursor: 'pointer',
    transition: 'all 0.2s',
    fontWeight: 600,
  },

  // Content
  content: {
    flex: 1,
    overflowY: 'auto' as const,
    padding: '18px 20px',
  },

  // Section
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    display: 'flex',
    alignItems: 'center',
    gap: 8,
    marginBottom: 12,
    fontSize: 14,
    fontWeight: 700,
    color: S.textPrimary,
  },

  // Featured card
  featuredCard: {
    padding: 20,
    background: `linear-gradient(135deg, ${S.glass}, rgba(139,124,240,0.08))`,
    borderRadius: 14,
    border: `1px solid ${S.border}`,
    cursor: 'pointer',
    transition: 'all 0.25s ease',
    boxShadow: `0 4px 24px ${S.accentGlow}`,
  },
  featuredImg: {
    width: 120,
    height: 120,
    objectFit: 'cover' as const,
    borderRadius: 10,
    border: `1px solid ${S.border}`,
    flexShrink: 0,
  },
  featuredTitle: {
    margin: '0 0 10px 0',
    fontSize: 20,
    fontWeight: 700,
    color: S.textPrimary,
    lineHeight: 1.3,
  },
  featuredExtract: {
    margin: 0,
    fontSize: 13,
    color: S.textSecondary,
    lineHeight: 1.7,
  },
  readMore: {
    display: 'inline-block',
    marginTop: 10,
    color: S.accent,
    fontSize: 13,
    fontWeight: 600,
  },

  // Random
  randomGrid: {
    display: 'flex',
    flexDirection: 'column' as const,
    gap: 8,
  },
  randomBtn: {
    padding: '12px 16px',
    background: S.glass,
    border: `1px solid ${S.border}`,
    borderRadius: 10,
    color: S.textPrimary,
    fontSize: 14,
    fontWeight: 500,
    cursor: 'pointer',
    textAlign: 'left' as const,
    transition: 'all 0.2s',
  },
  refreshBtn: {
    marginLeft: 'auto',
    background: 'transparent',
    border: `1px solid ${S.border}`,
    color: S.accent,
    borderRadius: 6,
    width: 28,
    height: 28,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: 16,
    cursor: 'pointer',
    transition: 'all 0.2s',
  },

  // History
  historyList: {
    display: 'flex',
    flexDirection: 'column' as const,
    gap: 4,
  },
  historyBtn: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '10px 14px',
    background: S.glass,
    border: `1px solid ${S.border}`,
    borderRadius: 8,
    cursor: 'pointer',
    transition: 'all 0.2s',
    textAlign: 'left' as const,
  },
  historyTitle: {
    color: S.textPrimary,
    fontSize: 13,
    fontWeight: 500,
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap' as const,
  },
  historyTime: {
    color: S.textMuted,
    fontSize: 11,
    flexShrink: 0,
    marginLeft: 12,
  },
  clearBtn: {
    marginLeft: 'auto',
    background: 'transparent',
    border: `1px solid rgba(245,101,101,0.3)`,
    color: S.danger,
    borderRadius: 6,
    padding: '4px 10px',
    fontSize: 11,
    cursor: 'pointer',
    transition: 'all 0.2s',
  },
  emptyText: {
    color: S.textMuted,
    fontSize: 13,
    textAlign: 'center' as const,
    padding: 20,
  },

  // Favorites list
  favList: {
    display: 'flex',
    flexDirection: 'column' as const,
    gap: 4,
  },
  favItem: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '10px 14px',
    background: S.glass,
    borderRadius: 8,
    border: `1px solid ${S.border}`,
  },
  favItemTitle: {
    background: 'none',
    border: 'none',
    color: S.warning,
    fontSize: 13,
    fontWeight: 600,
    cursor: 'pointer',
    textAlign: 'left' as const,
    padding: 0,
  },
  favRemoveBtn: {
    background: 'transparent',
    border: 'none',
    color: S.textMuted,
    fontSize: 16,
    cursor: 'pointer',
    padding: '2px 6px',
    borderRadius: 4,
    transition: 'color 0.15s',
  },

  // Search results
  resultCount: {
    color: S.textMuted,
    fontSize: 13,
    marginBottom: 12,
  },
  searchList: {
    display: 'flex',
    flexDirection: 'column' as const,
    gap: 10,
  },
  searchCard: {
    padding: '16px 18px',
    background: S.glass,
    borderRadius: 12,
    border: `1px solid ${S.border}`,
    cursor: 'pointer',
    transition: 'all 0.2s ease',
  },
  searchCardTitle: {
    margin: '0 0 8px 0',
    fontSize: 16,
    fontWeight: 700,
    color: S.accentLight,
  },
  searchCardSnippet: {
    margin: 0,
    fontSize: 13,
    color: S.textSecondary,
    lineHeight: 1.6,
  },
  searchCardFooter: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 10,
  },
  miniFavBtn: {
    background: 'transparent',
    border: 'none',
    color: S.warning,
    fontSize: 16,
    cursor: 'pointer',
    padding: '2px 6px',
  },

  // Skeleton list
  skeletonList: {
    display: 'flex',
    flexDirection: 'column' as const,
    gap: 10,
  },

  // Article
  article: {
    marginBottom: 24,
  },
  articleTitle: {
    margin: '0 0 18px 0',
    fontSize: 26,
    fontWeight: 800,
    color: S.textPrimary,
    lineHeight: 1.3,
    letterSpacing: -0.3,
  },
  articleImgWrap: {
    marginBottom: 18,
  },
  articleImg: {
    maxWidth: '100%',
    maxHeight: 300,
    borderRadius: 12,
    border: `1px solid ${S.border}`,
    display: 'block',
  },
  articleBody: {
    lineHeight: 1.9,
    fontSize: 15,
    color: S.textPrimary,
  },
  articleParagraph: {
    marginBottom: 14,
  },

  // Categories
  categoriesWrap: {
    marginTop: 18,
    padding: '12px 14px',
    background: S.glass,
    borderRadius: 10,
    border: `1px solid ${S.border}`,
    display: 'flex',
    flexWrap: 'wrap' as const,
    gap: 6,
    alignItems: 'center',
  },
  categoryTag: {
    padding: '3px 10px',
    background: `rgba(139,124,240,0.1)`,
    borderRadius: 12,
    fontSize: 11,
    color: S.accentLight,
    border: `1px solid rgba(139,124,240,0.15)`,
  },

  // Article footer
  articleFooter: {
    marginTop: 20,
    paddingTop: 16,
    borderTop: `1px solid ${S.border}`,
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    flexWrap: 'wrap' as const,
    gap: 8,
  },
  externalLink: {
    color: S.accent,
    textDecoration: 'none',
    fontSize: 14,
    fontWeight: 600,
    transition: 'color 0.2s',
  },

  // Related
  relatedSection: {
    marginTop: 20,
  },
  relatedGrid: {
    display: 'flex',
    flexWrap: 'wrap' as const,
    gap: 8,
  },
  relatedBtn: {
    padding: '8px 14px',
    background: S.glass,
    border: `1px solid ${S.border}`,
    borderRadius: 8,
    color: S.textPrimary,
    fontSize: 13,
    cursor: 'pointer',
    transition: 'all 0.2s',
  },

  // Toast
  toast: {
    position: 'absolute' as const,
    bottom: 24,
    left: '50%',
    transform: 'translateX(-50%)',
    padding: '10px 22px',
    background: `linear-gradient(135deg, ${S.accentDark}, ${S.accent})`,
    color: '#fff',
    borderRadius: 10,
    fontSize: 13,
    fontWeight: 600,
    pointerEvents: 'none' as const,
    zIndex: 999,
    boxShadow: `0 4px 20px ${S.accentGlow}`,
    animation: 'wikiFadeIn 0.25s ease',
  },
}

export default WikiExplorer
