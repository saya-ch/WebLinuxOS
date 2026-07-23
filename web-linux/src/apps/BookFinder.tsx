import { useState, useCallback, useEffect, memo, useRef } from 'react'
import './BookFinder.css'

/**
 * BookFinder — 书海检索
 * 基于 Open Library 公开 API（https://openlibrary.org/developers/api）的图书发现工具。
 * - 搜索：https://openlibrary.org/search.json （CORS 友好、无需 API Key）
 * - 封面：https://covers.openlibrary.org/b/id/{cover_i}-M.jpg
 * - 作品详情：https://openlibrary.org{key}.json
 * 收藏数据保存在 localStorage，跨会话保留。
 */

interface BookDoc {
  key: string
  title: string
  author_name?: string[]
  first_publish_year?: number
  cover_i?: number
  isbn?: string[]
  number_of_pages_median?: number
  ratings_average?: number
  subject?: string[]
  language?: string[]
  publisher?: string[]
}

interface SearchResult {
  numFound: number
  start: number
  docs: BookDoc[]
}

interface WorkDetail {
  description?: string | { value: string }
  subjects?: string[]
  covers?: number[]
  links?: { url: string; title: string }[]
}

interface FavoriteBook {
  key: string
  title: string
  author: string
  year?: number
  cover_i?: number
  isbn?: string
  savedAt: number
}

const STORAGE_KEY = 'weblinuxos-bookfinder-favorites'
const RECENT_KEY = 'weblinuxos-bookfinder-recent'
const FAVORITES_LIMIT = 80
const RECENT_LIMIT = 8

const SUBJECT_CHIPS = [
  'fiction', 'science', 'history', 'philosophy', 'fantasy',
  'biography', 'poetry', 'art', 'programming', 'mathematics',
]

function coverUrl(cover_i?: number, isbn?: string, size: 'S' | 'M' | 'L' = 'M'): string {
  if (cover_i) return `https://covers.openlibrary.org/b/id/${cover_i}-${size}.jpg`
  if (isbn) return `https://covers.openlibrary.org/b/isbn/${isbn}-${size}.jpg`
  return ''
}

function primaryIsbn(doc: BookDoc): string | undefined {
  return doc.isbn && doc.isbn.length > 0 ? doc.isbn[0] : undefined
}

function authorText(doc: BookDoc): string {
  if (!doc.author_name || doc.author_name.length === 0) return '未知作者'
  const names = doc.author_name.slice(0, 3)
  return names.join('、') + (doc.author_name.length > 3 ? ' 等' : '')
}

async function fetchJSON<T>(url: string, signal?: AbortSignal): Promise<T> {
  const res = await fetch(url, { signal, headers: { Accept: 'application/json' } })
  if (!res.ok) throw new Error(`请求失败：HTTP ${res.status}`)
  return (await res.json()) as T
}

function loadFavorites(): FavoriteBook[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return []
    const arr = JSON.parse(raw) as FavoriteBook[]
    return Array.isArray(arr) ? arr : []
  } catch {
    return []
  }
}

function saveFavorites(list: FavoriteBook[]): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(list))
  } catch {
    /* 配额超限或隐私模式，静默忽略 */
  }
}

function loadRecent(): string[] {
  try {
    const raw = localStorage.getItem(RECENT_KEY)
    if (!raw) return []
    const arr = JSON.parse(raw) as string[]
    return Array.isArray(arr) ? arr : []
  } catch {
    return []
  }
}

function saveRecent(list: string[]): void {
  try {
    localStorage.setItem(RECENT_KEY, JSON.stringify(list))
  } catch {
    /* ignore */
  }
}

/* ---------- 视觉子组件 ---------- */

const Cover = memo(function Cover({ doc, size = 'M' }: { doc: BookDoc; size?: 'S' | 'M' | 'L' }) {
  const url = coverUrl(doc.cover_i, primaryIsbn(doc), size)
  const [loaded, setLoaded] = useState(false)
  const [errored, setErrored] = useState(false)

  if (!url || errored) {
    return (
      <div className="bf-cover-fallback" aria-label="无封面">
        <span>{doc.title.slice(0, 1)}</span>
      </div>
    )
  }

  return (
    <>
      {!loaded && <div className="bf-cover-skeleton" aria-hidden="true" />}
      <img
        className="bf-cover-img"
        src={url}
        alt={`《${doc.title}》封面`}
        loading="lazy"
        style={{ opacity: loaded ? 1 : 0 }}
        onLoad={() => setLoaded(true)}
        onError={() => setErrored(true)}
      />
    </>
  )
})

function RatingStars({ value }: { value?: number }) {
  if (!value || value <= 0) return <span className="bf-rating-empty">暂无评分</span>
  const full = Math.round(value / 2) // openlibrary 0-5 → 0-5 星
  return (
    <span className="bf-stars" title={`平均 ${value.toFixed(2)} / 5`}>
      {Array.from({ length: 5 }).map((_, i) => (
        <span key={i} className={i < full ? 'bf-star on' : 'bf-star'}>★</span>
      ))}
      <span className="bf-rating-num">{value.toFixed(1)}</span>
    </span>
  )
}

function SkeletonCard() {
  return (
    <div className="bf-card bf-card-skeleton">
      <div className="bf-cover-skeleton" style={{ aspectRatio: '2/3', width: '100%' }} />
      <div className="bf-skel-line" style={{ width: '85%', height: 14 }} />
      <div className="bf-skel-line" style={{ width: '55%', height: 11 }} />
    </div>
  )
}

/* ---------- 详情抽屉 ---------- */

function DetailDrawer({ doc, onClose, isFav, onToggleFav }: {
  doc: BookDoc | null
  onClose: () => void
  isFav: boolean
  onToggleFav: (doc: BookDoc) => void
}) {
  const [detail, setDetail] = useState<WorkDetail | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const abortRef = useRef<AbortController | null>(null)

  useEffect(() => {
    if (!doc) {
      setDetail(null)
      setError(null)
      return
    }
    setLoading(true)
    setError(null)
    setDetail(null)
    const ac = new AbortController()
    abortRef.current = ac
    fetchJSON<WorkDetail>(`https://openlibrary.org${doc.key}.json`, ac.signal)
      .then((d) => {
        setDetail(d)
        setLoading(false)
      })
      .catch((err) => {
        if (err.name === 'AbortError') return
        setError('无法加载作品详情')
        setLoading(false)
      })
    return () => ac.abort()
  }, [doc])

  if (!doc) return null

  const description = detail?.description
    ? typeof detail.description === 'string'
      ? detail.description
      : detail.description.value
    : null

  const subjects = (detail?.subjects ?? doc.subject ?? []).slice(0, 12)

  return (
    <div className="bf-drawer-overlay" onClick={onClose} role="dialog" aria-modal="true" aria-label="书籍详情">
      <div className="bf-drawer" onClick={(e) => e.stopPropagation()}>
        <button className="bf-drawer-close" onClick={onClose} aria-label="关闭详情">×</button>
        <div className="bf-drawer-head">
          <div className="bf-drawer-cover">
            <Cover doc={doc} size="L" />
          </div>
          <div className="bf-drawer-meta">
            <h2 className="bf-drawer-title">{doc.title}</h2>
            <p className="bf-drawer-author">{authorText(doc)}</p>
            <div className="bf-drawer-facts">
              {doc.first_publish_year && (
                <span className="bf-fact"><label>首版年份</label><b>{doc.first_publish_year}</b></span>
              )}
              {doc.number_of_pages_median && (
                <span className="bf-fact"><label>页数</label><b>~{doc.number_of_pages_median}</b></span>
              )}
              {primaryIsbn(doc) && (
                <span className="bf-fact bf-fact-isbn"><label>ISBN</label><b>{primaryIsbn(doc)}</b></span>
              )}
              <span className="bf-fact"><label>评分</label><RatingStars value={doc.ratings_average} /></span>
            </div>
            <div className="bf-drawer-actions">
              <button
                className={isFav ? 'bf-btn bf-btn-fav active' : 'bf-btn bf-btn-fav'}
                onClick={() => onToggleFav(doc)}
              >
                {isFav ? '★ 已收藏' : '☆ 加入收藏'}
              </button>
              <a
                className="bf-btn bf-btn-link"
                href={`https://openlibrary.org${doc.key}`}
                target="_blank"
                rel="noopener noreferrer"
              >
                在 Open Library 打开 ↗
              </a>
            </div>
          </div>
        </div>

        <div className="bf-drawer-body">
          {loading && <p className="bf-muted">正在加载详情…</p>}
          {error && <p className="bf-error">{error}</p>}
          {description && (
            <section className="bf-section">
              <h3>简介</h3>
              <p className="bf-description">{description}</p>
            </section>
          )}
          {subjects.length > 0 && (
            <section className="bf-section">
              <h3>主题</h3>
              <div className="bf-subjects">
                {subjects.map((s) => (
                  <span key={s} className="bf-chip bf-chip-readonly">{s}</span>
                ))}
              </div>
            </section>
          )}
          {!loading && !error && !description && subjects.length === 0 && (
            <p className="bf-muted">该作品暂无更多详情。</p>
          )}
        </div>
      </div>
    </div>
  )
}

/* ---------- 主组件 ---------- */

const BookFinder = memo(function BookFinder() {
  const [query, setQuery] = useState('')
  const [activeSubject, setActiveSubject] = useState<string | null>(null)
  const [results, setResults] = useState<BookDoc[]>([])
  const [total, setTotal] = useState(0)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [hasSearched, setHasSearched] = useState(false)
  const [selected, setSelected] = useState<BookDoc | null>(null)
  const [favorites, setFavorites] = useState<FavoriteBook[]>(() => loadFavorites())
  const [recent, setRecent] = useState<string[]>(() => loadRecent())
  const [tab, setTab] = useState<'search' | 'favorites'>('search')

  const abortRef = useRef<AbortController | null>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  const isFav = useCallback((key: string) => favorites.some((f) => f.key === key), [favorites])

  const toggleFav = useCallback((doc: BookDoc) => {
    setFavorites((prev) => {
      const exists = prev.some((f) => f.key === doc.key)
      let next: FavoriteBook[]
      if (exists) {
        next = prev.filter((f) => f.key !== doc.key)
      } else {
        const fav: FavoriteBook = {
          key: doc.key,
          title: doc.title,
          author: authorText(doc),
          year: doc.first_publish_year,
          cover_i: doc.cover_i,
          isbn: primaryIsbn(doc),
          savedAt: Date.now(),
        }
        next = [fav, ...prev].slice(0, FAVORITES_LIMIT)
      }
      saveFavorites(next)
      return next
    })
  }, [])

  const runSearch = useCallback((rawQuery: string, subject: string | null) => {
    const q = rawQuery.trim()
    if (!q && !subject) return
    setLoading(true)
    setError(null)
    setHasSearched(true)
    setTab('search')

    abortRef.current?.abort()
    const ac = new AbortController()
    abortRef.current = ac

    const params = new URLSearchParams()
    if (q) params.set('q', q)
    if (subject) params.set('subject', subject)
    params.set('limit', '24')
    params.set('fields', 'key,title,author_name,first_publish_year,cover_i,isbn,number_of_pages_median,ratings_average,subject')

    fetchJSON<SearchResult>(`https://openlibrary.org/search.json?${params.toString()}`, ac.signal)
      .then((data) => {
        setResults(data.docs)
        setTotal(data.numFound)
        setLoading(false)
        if (q) {
          setRecent((prev) => {
            const next = [q, ...prev.filter((r) => r.toLowerCase() !== q.toLowerCase())].slice(0, RECENT_LIMIT)
            saveRecent(next)
            return next
          })
        }
      })
      .catch((err) => {
        if (err.name === 'AbortError') return
        setError('搜索失败，请检查网络连接后重试。')
        setResults([])
        setTotal(0)
        setLoading(false)
      })
  }, [])

  const handleSubmit = useCallback((e: React.FormEvent) => {
    e.preventDefault()
    runSearch(query, activeSubject)
  }, [query, activeSubject, runSearch])

  const handleSubjectChip = useCallback((s: string) => {
    setActiveSubject(s)
    setQuery('')
    runSearch('', s)
  }, [runSearch])

  const handleRecent = useCallback((q: string) => {
    setQuery(q)
    setActiveSubject(null)
    runSearch(q, null)
  }, [runSearch])

  useEffect(() => {
    return () => abortRef.current?.abort()
  }, [])

  return (
    <div className="bf-root">
      <header className="bf-header">
        <div className="bf-brand">
          <div className="bf-brand-mark" aria-hidden="true">
            <svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" strokeWidth="1.6">
              <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" />
              <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z" />
              <path d="M9 7h7M9 11h7" />
            </svg>
          </div>
          <div>
            <h1 className="bf-brand-title">书海检索</h1>
            <p className="bf-brand-sub">Open Library · 数百万册图书 · 无需登录</p>
          </div>
        </div>

        <div className="bf-tabs" role="tablist">
          <button
            role="tab"
            aria-selected={tab === 'search'}
            className={tab === 'search' ? 'bf-tab active' : 'bf-tab'}
            onClick={() => setTab('search')}
          >
            搜索
          </button>
          <button
            role="tab"
            aria-selected={tab === 'favorites'}
            className={tab === 'favorites' ? 'bf-tab active' : 'bf-tab'}
            onClick={() => setTab('favorites')}
          >
            收藏 <span className="bf-tab-count">{favorites.length}</span>
          </button>
        </div>
      </header>

      {tab === 'search' && (
        <>
          <form className="bf-search-form" onSubmit={handleSubmit}>
            <div className="bf-search-input-wrap">
              <svg className="bf-search-icon" viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="11" cy="11" r="7" />
                <line x1="21" y1="21" x2="16.65" y2="16.65" />
              </svg>
              <input
                ref={inputRef}
                className="bf-search-input"
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="搜索书名、作者、主题…"
                aria-label="搜索图书"
                autoFocus
              />
              {query && (
                <button type="button" className="bf-clear-btn" onClick={() => { setQuery(''); inputRef.current?.focus() }} aria-label="清空">×</button>
              )}
            </div>
            <button type="submit" className="bf-search-btn" disabled={loading}>检索</button>
          </form>

          <div className="bf-chips">
            <span className="bf-chips-label">热门主题</span>
            {SUBJECT_CHIPS.map((s) => (
              <button
                key={s}
                className={activeSubject === s ? 'bf-chip active' : 'bf-chip'}
                onClick={() => handleSubjectChip(s)}
                type="button"
              >
                {s}
              </button>
            ))}
            {activeSubject && (
              <button className="bf-chip bf-chip-clear" onClick={() => { setActiveSubject(null); runSearch(query, null) }} type="button">
                清除主题 ×
              </button>
            )}
          </div>

          {recent.length > 0 && !hasSearched && (
            <div className="bf-recent">
              <span className="bf-chips-label">最近搜索</span>
              {recent.map((r) => (
                <button key={r} className="bf-chip bf-chip-ghost" onClick={() => handleRecent(r)} type="button">{r}</button>
              ))}
            </div>
          )}

          <div className="bf-status">
            {loading && <span className="bf-muted">检索中…</span>}
            {!loading && hasSearched && !error && (
              <span>共找到 <b>{total.toLocaleString()}</b> 条结果，展示前 {results.length} 条</span>
            )}
            {error && <span className="bf-error">{error}</span>}
          </div>

          <div className="bf-grid">
            {loading && Array.from({ length: 12 }).map((_, i) => <SkeletonCard key={i} />)}
            {!loading && results.map((doc, i) => (
              <button
                key={doc.key}
                className="bf-card"
                style={{ animationDelay: `${Math.min(i * 28, 400)}ms` }}
                onClick={() => setSelected(doc)}
                type="button"
              >
                <div className="bf-card-cover">
                  <Cover doc={doc} size="M" />
                  {isFav(doc.key) && <span className="bf-card-fav" aria-label="已收藏">★</span>}
                </div>
                <div className="bf-card-body">
                  <h3 className="bf-card-title" title={doc.title}>{doc.title}</h3>
                  <p className="bf-card-author">{authorText(doc)}</p>
                  <div className="bf-card-foot">
                    {doc.first_publish_year && <span className="bf-card-year">{doc.first_publish_year}</span>}
                    <RatingStars value={doc.ratings_average} />
                  </div>
                </div>
              </button>
            ))}
            {!loading && !error && hasSearched && results.length === 0 && (
              <div className="bf-empty">
                <div className="bf-empty-mark" aria-hidden="true">⌕</div>
                <p>未找到匹配的图书</p>
                <span className="bf-muted">尝试更换关键词或主题</span>
              </div>
            )}
            {!loading && !error && !hasSearched && (
              <div className="bf-empty">
                <div className="bf-empty-mark" aria-hidden="true">📖</div>
                <p>输入关键词或选择主题开始探索</p>
                <span className="bf-muted">数据来自 Open Library，覆盖全球出版物</span>
              </div>
            )}
          </div>
        </>
      )}

      {tab === 'favorites' && (
        <div className="bf-fav-pane">
          {favorites.length === 0 ? (
            <div className="bf-empty">
              <div className="bf-empty-mark" aria-hidden="true">☆</div>
              <p>还没有收藏的图书</p>
              <span className="bf-muted">在搜索结果中点击书籍，加入收藏</span>
            </div>
          ) : (
            <>
              <div className="bf-status">
                共 <b>{favorites.length}</b> 本收藏 · 按收藏时间倒序
              </div>
              <div className="bf-grid">
                {favorites.map((f, i) => {
                  const doc: BookDoc = {
                    key: f.key,
                    title: f.title,
                    author_name: f.author === '未知作者' ? [] : f.author.split('、'),
                    first_publish_year: f.year,
                    cover_i: f.cover_i,
                    isbn: f.isbn ? [f.isbn] : undefined,
                  }
                  return (
                    <button
                      key={f.key}
                      className="bf-card"
                      style={{ animationDelay: `${Math.min(i * 24, 360)}ms` }}
                      onClick={() => setSelected(doc)}
                      type="button"
                    >
                      <div className="bf-card-cover">
                        <Cover doc={doc} size="M" />
                        <span className="bf-card-fav" aria-label="已收藏">★</span>
                      </div>
                      <div className="bf-card-body">
                        <h3 className="bf-card-title" title={f.title}>{f.title}</h3>
                        <p className="bf-card-author">{f.author}</p>
                        <div className="bf-card-foot">
                          {f.year && <span className="bf-card-year">{f.year}</span>}
                          <button
                            className="bf-remove-btn"
                            onClick={(e) => { e.stopPropagation(); toggleFav(doc) }}
                            type="button"
                            aria-label="移除收藏"
                          >
                            移除
                          </button>
                        </div>
                      </div>
                    </button>
                  )
                })}
              </div>
            </>
          )}
        </div>
      )}

      <DetailDrawer
        doc={selected}
        onClose={() => setSelected(null)}
        isFav={selected ? isFav(selected.key) : false}
        onToggleFav={toggleFav}
      />
    </div>
  )
})

export default BookFinder
