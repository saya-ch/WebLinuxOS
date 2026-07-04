import { useState, useEffect, useCallback } from 'react'

interface SearchResult {
  title: string
  snippet?: string
  url?: string
}

interface ArticleSummary {
  title: string
  extract: string
  thumbnail?: string
  pageid?: number
}

interface FavoriteItem {
  title: string
  lang: string
  addedAt: number
}

type TabKey = 'search' | 'random' | 'favorites'

const LANG_CONFIG: Record<string, { label: string; flag: string }> = {
  zh: { label: '中文', flag: '🇨🇳' },
  en: { label: 'English', flag: '🇺🇸' },
  ja: { label: '日本語', flag: '🇯🇵' },
}

const apiBase = (lang: string) => `https://${lang}.wikipedia.org/w/api.php`
const pageUrl = (lang: string, title: string) =>
  `https://${lang}.wikipedia.org/wiki/${encodeURIComponent(title)}`
const FAV_KEY = 'wikipedia-reader-favorites-v1'

function useFavorites() {
  const [items, setItems] = useState<FavoriteItem[]>([])

  useEffect(() => {
    try {
      const raw = localStorage.getItem(FAV_KEY)
      if (raw) setItems(JSON.parse(raw))
    } catch {
      // ignore
    }
  }, [])

  const persist = (next: FavoriteItem[]) => {
    setItems(next)
    try {
      localStorage.setItem(FAV_KEY, JSON.stringify(next))
    } catch {
      // ignore
    }
  }

  const isFav = (title: string, lang: string) =>
    items.some((i) => i.title === title && i.lang === lang)

  const toggle = (title: string, lang: string) => {
    const exists = items.find((i) => i.title === title && i.lang === lang)
    if (exists) {
      persist(items.filter((i) => !(i.title === title && i.lang === lang)))
    } else {
      persist([{ title, lang, addedAt: Date.now() }, ...items])
    }
  }

  const remove = (title: string, lang: string) =>
    persist(items.filter((i) => !(i.title === title && i.lang === lang)))

  const clear = () => persist([])

  return { items, isFav, toggle, remove, clear }
}

async function searchArticles(query: string, lang: string): Promise<SearchResult[]> {
  const url =
    apiBase(lang) +
    `?action=opensearch&search=${encodeURIComponent(query)}&limit=10&origin=*&format=json`
  const res = await fetch(url)
  if (!res.ok) throw new Error(`HTTP ${res.status}`)
  const data = await res.json()
  // data shape: [query, titles[], descriptions[], urls[]]
  const titles: string[] = data[1] || []
  const descs: string[] = data[2] || []
  const urls: string[] = data[3] || []
  return titles.map((title, idx) => ({
    title,
    snippet: descs[idx] || '',
    url: urls[idx],
  }))
}

async function fetchArticle(title: string, lang: string): Promise<ArticleSummary | null> {
  const url =
    apiBase(lang) +
    `?action=query&prop=extracts|pageimages&exintro=&explaintext=&titles=${encodeURIComponent(
      title
    )}&piprop=thumbnail&pithumbsize=400&format=json&origin=*`
  const res = await fetch(url)
  if (!res.ok) throw new Error(`HTTP ${res.status}`)
  const data = await res.json()
  const pages = data?.query?.pages
  if (!pages) return null
  const pageIds = Object.keys(pages)
  const page = pages[pageIds[0]]
  if (!page || page.missing !== undefined) return null
  return {
    title: page.title || title,
    extract: page.extract || '',
    thumbnail: page.thumbnail?.source,
    pageid: page.pageid,
  }
}

async function fetchRandom(lang: string): Promise<SearchResult[]> {
  const url =
    apiBase(lang) +
    `?action=query&list=random&rnlimit=5&rnnamespace=0&format=json&origin=*`
  const res = await fetch(url)
  if (!res.ok) throw new Error(`HTTP ${res.status}`)
  const data = await res.json()
  const list: Array<{ id: number; title: string }> = data?.query?.random || []
  return list.map((r) => ({ title: r.title, snippet: '', url: pageUrl(lang, r.title) }))
}

function copyText(text: string): Promise<boolean> {
  if (navigator.clipboard && navigator.clipboard.writeText) {
    return navigator.clipboard
      .writeText(text)
      .then(() => true)
      .catch(() => false)
  }
  try {
    const ta = document.createElement('textarea')
    ta.value = text
    ta.style.position = 'fixed'
    ta.style.opacity = '0'
    document.body.appendChild(ta)
    ta.select()
    document.execCommand('copy')
    document.body.removeChild(ta)
    return Promise.resolve(true)
  } catch {
    return Promise.resolve(false)
  }
}

export default function WikipediaReader() {
  const [lang, setLang] = useState<string>('zh')
  const [tab, setTab] = useState<TabKey>('search')

  const [query, setQuery] = useState('')
  const [searchResults, setSearchResults] = useState<SearchResult[]>([])
  const [searching, setSearching] = useState(false)
  const [searchError, setSearchError] = useState<string | null>(null)

  const [selectedTitle, setSelectedTitle] = useState<string | null>(null)
  const [article, setArticle] = useState<ArticleSummary | null>(null)
  const [loadingArticle, setLoadingArticle] = useState(false)
  const [articleError, setArticleError] = useState<string | null>(null)

  const [randomResults, setRandomResults] = useState<SearchResult[]>([])
  const [loadingRandom, setLoadingRandom] = useState(false)
  const [randomError, setRandomError] = useState<string | null>(null)

  const [toast, setToast] = useState<string | null>(null)

  const { items: favorites, isFav, toggle: toggleFav, remove, clear } = useFavorites()

  const showToast = useCallback((msg: string) => {
    setToast(msg)
    window.setTimeout(() => setToast(null), 1800)
  }, [])

  const doSearch = useCallback(async () => {
    const q = query.trim()
    if (!q) {
      setSearchResults([])
      return
    }
    setSearching(true)
    setSearchError(null)
    setSearchResults([])
    try {
      const results = await searchArticles(q, lang)
      setSearchResults(results)
    } catch (err) {
      setSearchError((err as Error)?.message || '搜索失败，请稍后重试')
    } finally {
      setSearching(false)
    }
  }, [query, lang])

  const loadRandom = useCallback(async () => {
    setLoadingRandom(true)
    setRandomError(null)
    setRandomResults([])
    try {
      const list = await fetchRandom(lang)
      setRandomResults(list)
    } catch (err) {
      setRandomError((err as Error)?.message || '加载失败')
    } finally {
      setLoadingRandom(false)
    }
  }, [lang])

  const openArticle = useCallback(
    async (title: string) => {
      setSelectedTitle(title)
      setArticle(null)
      setArticleError(null)
      setLoadingArticle(true)
      try {
        const data = await fetchArticle(title, lang)
        setArticle(data)
      } catch (err) {
      setArticleError((err as Error)?.message || '加载条目失败')
      } finally {
        setLoadingArticle(false)
      }
    },
    [lang]
  )

  const handleCopyLink = useCallback(
    async (title: string) => {
      const ok = await copyText(pageUrl(lang, title))
      showToast(ok ? '链接已复制' : '复制失败')
    },
    [lang, showToast]
  )

  const handleOpenExternal = (title: string) => {
    window.open(pageUrl(lang, title), '_blank', 'noopener,noreferrer')
  }

  useEffect(() => {
    // 切换语言时重置结果
    setSearchResults([])
    setArticle(null)
    setSelectedTitle(null)
    setRandomResults([])
  }, [lang])

  useEffect(() => {
    if (tab === 'random' && randomResults.length === 0) {
      loadRandom()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tab])

  // ----------------------- Render helpers -----------------------

  const renderHeader = () => (
    <div
      style={{
        padding: '14px 18px',
        borderBottom: '1px solid rgba(255,255,255,0.08)',
        display: 'flex',
        alignItems: 'center',
        gap: 12,
        flexWrap: 'wrap',
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        <svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" strokeWidth="2" style={{ color: '#fff' }}>
          <path d="M12 2a10 10 0 1 0 10 10A10 10 0 0 0 12 2z" />
          <path d="M2 12h20" />
          <path d="M12 2a15 15 0 0 1 4 10 15 15 0 0 1-4 10 15 15 0 0 1-4-10 15 15 0 0 1 4-10z" />
        </svg>
        <div style={{ fontSize: 18, fontWeight: 700, color: '#fff' }}>维基百科阅读器</div>
      </div>

      <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: 8 }}>
        <span style={{ fontSize: 12, color: 'rgba(255,255,255,0.6)' }}>语言</span>
        <div style={{ display: 'flex', gap: 4, background: 'rgba(255,255,255,0.06)', padding: 3, borderRadius: 8 }}>
          {Object.entries(LANG_CONFIG).map(([code, cfg]) => (
            <button
              key={code}
              onClick={() => setLang(code)}
              style={{
                background: lang === code ? 'rgba(255,255,255,0.25)' : 'transparent',
                color: '#fff',
                border: 'none',
                borderRadius: 6,
                padding: '6px 10px',
                fontSize: 12,
                cursor: 'pointer',
                fontWeight: lang === code ? 600 : 400,
              }}
            >
              {cfg.flag} {cfg.label}
            </button>
          ))}
        </div>
      </div>
    </div>
  )

  const renderTabs = () => {
    const tabs: { key: TabKey; label: string; icon: string }[] = [
      { key: 'search', label: '搜索', icon: '🔎' },
      { key: 'random', label: '随机推荐', icon: '🎲' },
      { key: 'favorites', label: `收藏 (${favorites.length})`, icon: '⭐' },
    ]
    return (
      <div
        style={{
          padding: '10px 18px 0',
          display: 'flex',
          gap: 6,
          borderBottom: '1px solid rgba(255,255,255,0.08)',
        }}
      >
        {tabs.map((t) => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            style={{
              background: tab === t.key ? 'rgba(255,255,255,0.12)' : 'transparent',
              color: '#fff',
              border: 'none',
              padding: '8px 14px',
              borderRadius: '8px 8px 0 0',
              fontSize: 13,
              cursor: 'pointer',
              fontWeight: tab === t.key ? 600 : 400,
              borderBottom: tab === t.key ? '2px solid #7C6CF0' : '2px solid transparent',
            }}
          >
            <span style={{ marginRight: 6 }}>{t.icon}</span>
            {t.label}
          </button>
        ))}
      </div>
    )
  }

  const renderSearchTab = () => (
    <div style={{ padding: 16, display: 'flex', flexDirection: 'column', gap: 12 }}>
      <div style={{ display: 'flex', gap: 8 }}>
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') doSearch()
          }}
          placeholder="输入关键词搜索维基百科条目..."
          style={{
            flex: 1,
            padding: '10px 14px',
            fontSize: 14,
            borderRadius: 8,
            border: '1px solid rgba(255,255,255,0.15)',
            background: 'rgba(255,255,255,0.06)',
            color: '#fff',
            outline: 'none',
          }}
        />
        <button
          onClick={doSearch}
          disabled={searching}
          style={{
            padding: '10px 18px',
            background: 'linear-gradient(135deg, #7C6CF0 0%, #9B8AF0 100%)',
            color: '#fff',
            border: 'none',
            borderRadius: 8,
            fontSize: 14,
            fontWeight: 600,
            cursor: searching ? 'not-allowed' : 'pointer',
            opacity: searching ? 0.6 : 1,
          }}
        >
          {searching ? '搜索中...' : '搜索'}
        </button>
      </div>

      {searchError && (
        <div
          style={{
            padding: '10px 14px',
            borderRadius: 8,
            background: 'rgba(239,68,68,0.15)',
            color: '#fca5a5',
            fontSize: 13,
            border: '1px solid rgba(239,68,68,0.3)',
          }}
        >
          ⚠️ {searchError}
        </div>
      )}

      {searching && (
        <div style={{ color: 'rgba(255,255,255,0.7)', fontSize: 13, padding: 8 }}>
          正在搜索...
        </div>
      )}

      {!searching && !searchError && query && searchResults.length === 0 && (
        <div style={{ color: 'rgba(255,255,255,0.5)', fontSize: 13, padding: 8 }}>
          未找到相关条目，请尝试其他关键词。
        </div>
      )}

      {searchResults.length > 0 && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {searchResults.map((r, idx) => (
            <div
              key={r.title + idx}
              onClick={() => openArticle(r.title)}
              style={{
                padding: 14,
                background: 'rgba(255,255,255,0.05)',
                borderRadius: 10,
                cursor: 'pointer',
                border: '1px solid rgba(255,255,255,0.08)',
                transition: 'background 0.15s',
              }}
              onMouseEnter={(e) =>
                (e.currentTarget.style.background = 'rgba(255,255,255,0.1)')
              }
              onMouseLeave={(e) =>
                (e.currentTarget.style.background = 'rgba(255,255,255,0.05)')
              }
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 10 }}>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 15, fontWeight: 600, color: '#fff', marginBottom: 4 }}>
                    {r.title}
                  </div>
                  {r.snippet && (
                    <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.7)', lineHeight: 1.5 }}>
                      {r.snippet}
                    </div>
                  )}
                </div>
                <div style={{ display: 'flex', gap: 6, flexShrink: 0 }}>
                  <button
                    onClick={(e) => {
                      e.stopPropagation()
                      toggleFav(r.title, lang)
                    }}
                    style={{
                      background: 'rgba(255,255,255,0.08)',
                      border: 'none',
                      color: isFav(r.title, lang) ? '#ffd700' : '#fff',
                      borderRadius: 6,
                      padding: '6px 10px',
                      fontSize: 12,
                      cursor: 'pointer',
                    }}
                    title="收藏"
                  >
                    {isFav(r.title, lang) ? '★ 已收藏' : '☆ 收藏'}
                  </button>
                  <button
                    onClick={(e) => {
                      e.stopPropagation()
                      handleCopyLink(r.title)
                    }}
                    style={{
                      background: 'rgba(255,255,255,0.08)',
                      border: 'none',
                      color: '#fff',
                      borderRadius: 6,
                      padding: '6px 10px',
                      fontSize: 12,
                      cursor: 'pointer',
                    }}
                  >
                    🔗 复制
                  </button>
                  <button
                    onClick={(e) => {
                      e.stopPropagation()
                      handleOpenExternal(r.title)
                    }}
                    style={{
                      background: 'rgba(255,255,255,0.08)',
                      border: 'none',
                      color: '#fff',
                      borderRadius: 6,
                      padding: '6px 10px',
                      fontSize: 12,
                      cursor: 'pointer',
                    }}
                  >
                    ↗ 原页面
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )

  const renderRandomTab = () => (
    <div style={{ padding: 16, display: 'flex', flexDirection: 'column', gap: 12 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
        <div style={{ fontSize: 14, color: '#fff', fontWeight: 600 }}>🎲 随机推荐条目</div>
        <button
          onClick={loadRandom}
          disabled={loadingRandom}
          style={{
            marginLeft: 'auto',
            padding: '8px 14px',
            background: 'linear-gradient(135deg, #7C6CF0 0%, #9B8AF0 100%)',
            color: '#fff',
            border: 'none',
            borderRadius: 8,
            fontSize: 12,
            fontWeight: 600,
            cursor: loadingRandom ? 'not-allowed' : 'pointer',
            opacity: loadingRandom ? 0.6 : 1,
          }}
        >
          {loadingRandom ? '刷新中...' : '🔄 换一批'}
        </button>
      </div>

      {randomError && (
        <div
          style={{
            padding: '10px 14px',
            borderRadius: 8,
            background: 'rgba(239,68,68,0.15)',
            color: '#fca5a5',
            fontSize: 13,
          }}
        >
          ⚠️ {randomError}
        </div>
      )}

      {loadingRandom && (
        <div style={{ color: 'rgba(255,255,255,0.7)', fontSize: 13, padding: 8 }}>加载中...</div>
      )}

      {!loadingRandom && randomResults.length === 0 && !randomError && (
        <div style={{ color: 'rgba(255,255,255,0.5)', fontSize: 13, padding: 8 }}>
          暂无内容，点击"换一批"试试。
        </div>
      )}

      {randomResults.length > 0 && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {randomResults.map((r, idx) => (
            <div
              key={r.title + idx}
              onClick={() => openArticle(r.title)}
              style={{
                padding: 14,
                background: 'rgba(255,255,255,0.05)',
                borderRadius: 10,
                cursor: 'pointer',
                border: '1px solid rgba(255,255,255,0.08)',
              }}
              onMouseEnter={(e) =>
                (e.currentTarget.style.background = 'rgba(255,255,255,0.1)')
              }
              onMouseLeave={(e) =>
                (e.currentTarget.style.background = 'rgba(255,255,255,0.05)')
              }
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 10 }}>
                <div style={{ fontSize: 15, fontWeight: 600, color: '#fff' }}>{r.title}</div>
                <div style={{ display: 'flex', gap: 6 }}>
                  <button
                    onClick={(e) => {
                      e.stopPropagation()
                      toggleFav(r.title, lang)
                    }}
                    style={{
                      background: 'rgba(255,255,255,0.08)',
                      border: 'none',
                      color: isFav(r.title, lang) ? '#ffd700' : '#fff',
                      borderRadius: 6,
                      padding: '6px 10px',
                      fontSize: 12,
                      cursor: 'pointer',
                    }}
                  >
                    {isFav(r.title, lang) ? '★' : '☆'} 收藏
                  </button>
                  <button
                    onClick={(e) => {
                      e.stopPropagation()
                      handleCopyLink(r.title)
                    }}
                    style={{
                      background: 'rgba(255,255,255,0.08)',
                      border: 'none',
                      color: '#fff',
                      borderRadius: 6,
                      padding: '6px 10px',
                      fontSize: 12,
                      cursor: 'pointer',
                    }}
                  >
                    🔗
                  </button>
                  <button
                    onClick={(e) => {
                      e.stopPropagation()
                      handleOpenExternal(r.title)
                    }}
                    style={{
                      background: 'rgba(255,255,255,0.08)',
                      border: 'none',
                      color: '#fff',
                      borderRadius: 6,
                      padding: '6px 10px',
                      fontSize: 12,
                      cursor: 'pointer',
                    }}
                  >
                    ↗
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )

  const renderFavoritesTab = () => (
    <div style={{ padding: 16, display: 'flex', flexDirection: 'column', gap: 12 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
        <div style={{ fontSize: 14, color: '#fff', fontWeight: 600 }}>⭐ 我的收藏</div>
        {favorites.length > 0 && (
          <button
            onClick={() => {
              if (window.confirm('确定清空所有收藏吗？')) clear()
            }}
            style={{
              marginLeft: 'auto',
              padding: '6px 12px',
              background: 'rgba(239,68,68,0.2)',
              color: '#fca5a5',
              border: '1px solid rgba(239,68,68,0.3)',
              borderRadius: 6,
              fontSize: 12,
              cursor: 'pointer',
            }}
          >
            清空
          </button>
        )}
      </div>

      {favorites.length === 0 && (
        <div style={{ color: 'rgba(255,255,255,0.5)', fontSize: 13, padding: 16, textAlign: 'center' }}>
          还没有收藏的条目，快去搜索并收藏感兴趣的内容吧！
        </div>
      )}

      {favorites.length > 0 && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {favorites.map((f) => (
            <div
              key={f.title + f.lang}
              onClick={() => {
                if (f.lang !== lang) setLang(f.lang)
                openArticle(f.title)
              }}
              style={{
                padding: 14,
                background: 'rgba(255,255,255,0.05)',
                borderRadius: 10,
                cursor: 'pointer',
                border: '1px solid rgba(255,255,255,0.08)',
              }}
              onMouseEnter={(e) =>
                (e.currentTarget.style.background = 'rgba(255,255,255,0.1)')
              }
              onMouseLeave={(e) =>
                (e.currentTarget.style.background = 'rgba(255,255,255,0.05)')
              }
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 10 }}>
                <div>
                  <div style={{ fontSize: 15, fontWeight: 600, color: '#fff', marginBottom: 4 }}>
                    {f.title}
                    <span
                      style={{
                        marginLeft: 8,
                        fontSize: 11,
                        color: 'rgba(255,255,255,0.5)',
                        background: 'rgba(255,255,255,0.08)',
                        padding: '2px 6px',
                        borderRadius: 4,
                      }}
                    >
                      {LANG_CONFIG[f.lang]?.label || f.lang}
                    </span>
                  </div>
                  <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.4)' }}>
                    收藏于 {new Date(f.addedAt).toLocaleString()}
                  </div>
                </div>
                <div style={{ display: 'flex', gap: 6 }}>
                  <button
                    onClick={(e) => {
                      e.stopPropagation()
                      remove(f.title, f.lang)
                    }}
                    style={{
                      background: 'rgba(239,68,68,0.15)',
                      border: 'none',
                      color: '#fca5a5',
                      borderRadius: 6,
                      padding: '6px 10px',
                      fontSize: 12,
                      cursor: 'pointer',
                    }}
                  >
                    移除
                  </button>
                  <button
                    onClick={(e) => {
                      e.stopPropagation()
                      handleCopyLink(f.title)
                    }}
                    style={{
                      background: 'rgba(255,255,255,0.08)',
                      border: 'none',
                      color: '#fff',
                      borderRadius: 6,
                      padding: '6px 10px',
                      fontSize: 12,
                      cursor: 'pointer',
                    }}
                  >
                    🔗
                  </button>
                  <button
                    onClick={(e) => {
                      e.stopPropagation()
                      window.open(pageUrl(f.lang, f.title), '_blank', 'noopener,noreferrer')
                    }}
                    style={{
                      background: 'rgba(255,255,255,0.08)',
                      border: 'none',
                      color: '#fff',
                      borderRadius: 6,
                      padding: '6px 10px',
                      fontSize: 12,
                      cursor: 'pointer',
                    }}
                  >
                    ↗
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )

  const renderArticlePanel = () => {
    if (!selectedTitle) {
      return (
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            height: '100%',
            color: 'rgba(255,255,255,0.4)',
            fontSize: 14,
            textAlign: 'center',
            padding: 30,
          }}
        >
          <div>
            <div style={{ fontSize: 48, marginBottom: 16 }}>📖</div>
            <div>选择一个条目以查看简介和摘要</div>
            <div style={{ fontSize: 12, marginTop: 8, opacity: 0.7 }}>
              数据来源：维基百科（Wikipedia）· 免费的百科全书
            </div>
          </div>
        </div>
      )
    }

    return (
      <div style={{ height: '100%', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
        <div
          style={{
            padding: '14px 18px',
            borderBottom: '1px solid rgba(255,255,255,0.08)',
            display: 'flex',
            alignItems: 'center',
            gap: 10,
            flexWrap: 'wrap',
          }}
        >
          <div style={{ fontSize: 16, fontWeight: 700, color: '#fff', flex: 1 }}>
            📄 {selectedTitle}
          </div>
          <div style={{ display: 'flex', gap: 6 }}>
            <button
              onClick={() => toggleFav(selectedTitle, lang)}
              style={{
                padding: '6px 12px',
                background: 'rgba(255,255,255,0.08)',
                color: isFav(selectedTitle, lang) ? '#ffd700' : '#fff',
                border: 'none',
                borderRadius: 6,
                fontSize: 12,
                cursor: 'pointer',
              }}
            >
              {isFav(selectedTitle, lang) ? '★ 已收藏' : '☆ 收藏'}
            </button>
            <button
              onClick={() => handleCopyLink(selectedTitle)}
              style={{
                padding: '6px 12px',
                background: 'rgba(255,255,255,0.08)',
                color: '#fff',
                border: 'none',
                borderRadius: 6,
                fontSize: 12,
                cursor: 'pointer',
              }}
            >
              🔗 复制链接
            </button>
            <button
              onClick={() => handleOpenExternal(selectedTitle)}
              style={{
                padding: '6px 12px',
                background: 'linear-gradient(135deg, #7C6CF0 0%, #9B8AF0 100%)',
                color: '#fff',
                border: 'none',
                borderRadius: 6,
                fontSize: 12,
                fontWeight: 600,
                cursor: 'pointer',
              }}
            >
              ↗ 在浏览器中打开
            </button>
            <button
              onClick={() => {
                setSelectedTitle(null)
                setArticle(null)
                setArticleError(null)
              }}
              style={{
                padding: '6px 12px',
                background: 'rgba(255,255,255,0.08)',
                color: '#fff',
                border: 'none',
                borderRadius: 6,
                fontSize: 12,
                cursor: 'pointer',
              }}
            >
              ✕ 关闭
            </button>
          </div>
        </div>

        <div style={{ flex: 1, overflowY: 'auto', padding: 20 }}>
          {loadingArticle && (
            <div style={{ color: 'rgba(255,255,255,0.7)', fontSize: 14 }}>正在加载条目...</div>
          )}
          {articleError && (
            <div
              style={{
                padding: '10px 14px',
                borderRadius: 8,
                background: 'rgba(239,68,68,0.15)',
                color: '#fca5a5',
                fontSize: 13,
                border: '1px solid rgba(239,68,68,0.3)',
              }}
            >
              ⚠️ {articleError}
            </div>
          )}
          {!loadingArticle && !articleError && article === null && selectedTitle && (
            <div style={{ color: 'rgba(255,255,255,0.5)', fontSize: 13 }}>未找到该条目。</div>
          )}
          {article && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              <h2 style={{ margin: 0, fontSize: 22, fontWeight: 700, color: '#fff' }}>
                {article.title}
              </h2>

              {article.thumbnail && (
                <img
                  src={article.thumbnail}
                  alt={article.title}
                  style={{
                    maxWidth: '100%',
                    maxHeight: 260,
                    borderRadius: 10,
                    border: '1px solid rgba(255,255,255,0.1)',
                    alignSelf: 'flex-start',
                  }}
                />
              )}

              <div
                style={{
                  fontSize: 14,
                  color: 'rgba(255,255,255,0.9)',
                  lineHeight: 1.8,
                  whiteSpace: 'pre-wrap',
                }}
              >
                {article.extract || '（无摘要内容）'}
              </div>

              <div
                style={{
                  marginTop: 8,
                  padding: 12,
                  borderRadius: 8,
                  background: 'rgba(255,255,255,0.04)',
                  fontSize: 11,
                  color: 'rgba(255,255,255,0.5)',
                  lineHeight: 1.6,
                }}
              >
                原文链接：
                <a
                  href={pageUrl(lang, article.title)}
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{ color: '#B8A8FF', textDecoration: 'underline', wordBreak: 'break-all' }}
                >
                  {pageUrl(lang, article.title)}
                </a>
                <br />
                内容由维基百科（{LANG_CONFIG[lang]?.label || lang}）提供，基于 CC BY-SA 3.0 许可协议。
              </div>
            </div>
          )}
        </div>
      </div>
    )
  }

  // ------------------------- Main layout -------------------------

  return (
    <div
      style={{
        width: '100%',
        height: '100%',
        background: 'linear-gradient(135deg, #1e3c72 0%, #2a5298 100%)',
        color: '#fff',
        display: 'flex',
        flexDirection: 'column',
        overflow: 'hidden',
        fontFamily:
          '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, "PingFang SC", "Microsoft YaHei", sans-serif',
      }}
    >
      {renderHeader()}
      {renderTabs()}

      <div style={{ flex: 1, display: 'flex', overflow: 'hidden' }}>
        <div
          style={{
            width: '55%',
            minWidth: 360,
            borderRight: '1px solid rgba(255,255,255,0.08)',
            overflowY: 'auto',
            background: 'rgba(0,0,0,0.15)',
          }}
        >
          {tab === 'search' && renderSearchTab()}
          {tab === 'random' && renderRandomTab()}
          {tab === 'favorites' && renderFavoritesTab()}
        </div>

        <div style={{ flex: 1, minWidth: 0 }}>{renderArticlePanel()}</div>
      </div>

      {toast && (
        <div
          style={{
            position: 'absolute',
            bottom: 24,
            left: '50%',
            transform: 'translateX(-50%)',
            padding: '10px 18px',
            background: 'rgba(0,0,0,0.75)',
            color: '#fff',
            borderRadius: 8,
            fontSize: 13,
            pointerEvents: 'none',
            zIndex: 999,
          }}
        >
          {toast}
        </div>
      )}
    </div>
  )
}
