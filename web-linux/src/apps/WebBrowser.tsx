import { useState, useCallback, useRef, useEffect, memo } from 'react'

// ==================== 类型定义 ====================
interface HistoryItem {
  url: string
  title: string
  timestamp: Date
}

interface Bookmark {
  url: string
  title: string
  addedAt: Date
  category?: string
}

interface Tab {
  id: string
  url: string
  title: string
  pageType: PageType
  searchQuery?: string
  favicon: string
}

type PageType = 'home' | 'iframe' | 'wikipedia' | 'hackernews' | 'github' | 'search'

interface WikiSearchResult {
  title: string
  snippet: string
  pageid: number
}

interface WikiArticle {
  title: string
  extract: string
  thumbnail?: { source: string; width: number; height: number }
}

interface HNItem {
  id: number
  title: string
  by: string
  score: number
  time: number
  url?: string
  text?: string
  descendants?: number
  kids?: number[]
}

interface GHRepo {
  id: number
  full_name: string
  description: string | null
  stargazers_count: number
  forks_count: number
  language: string | null
  html_url: string
  owner: { avatar_url: string }
  updated_at: string
}

// ==================== 常量 ====================
const INTERNAL_PAGES = [
  { pageType: 'wikipedia' as PageType, title: '维基百科', icon: '📚', url: 'internal://wikipedia' },
  { pageType: 'hackernews' as PageType, title: 'Hacker News', icon: '📰', url: 'internal://hackernews' },
  { pageType: 'github' as PageType, title: 'GitHub 热门', icon: '🐙', url: 'internal://github' },
]

const QUICK_ACCESS = [
  { url: 'internal://wikipedia', title: '维基百科', icon: '📚', pageType: 'wikipedia' as PageType },
  { url: 'internal://hackernews', title: 'Hacker News', icon: '📰', pageType: 'hackernews' as PageType },
  { url: 'internal://github', title: 'GitHub 热门', icon: '🐙', pageType: 'github' as PageType },
  { url: 'https://www.google.com', title: 'Google', icon: '🔍', pageType: 'iframe' as PageType },
  { url: 'https://www.github.com', title: 'GitHub', icon: '🐙', pageType: 'iframe' as PageType },
  { url: 'https://www.youtube.com', title: 'YouTube', icon: '📺', pageType: 'iframe' as PageType },
  { url: 'https://stackoverflow.com', title: 'Stack Overflow', icon: '💻', pageType: 'iframe' as PageType },
  { url: 'https://codepen.io', title: 'CodePen', icon: '✏️', pageType: 'iframe' as PageType },
]

const FAVICON_MAP: Record<string, string> = {
  'www.google.com': '🔍',
  'github.com': '🐙',
  'www.wikipedia.org': '📚',
  'www.youtube.com': '📺',
  'twitter.com': '🐦',
  'stackoverflow.com': '💻',
  'news.ycombinator.com': '📰',
  'medium.com': '📝',
  'codepen.io': '✏️',
  'codesandbox.io': '📦',
  'producthunt.com': '🚀',
  'www.reddit.com': '🔴',
}

// ==================== 工具函数 ====================
function parseUrl(input: string): { url: string; pageType: PageType; searchQuery?: string } {
  const trimmed = input.trim()
  if (!trimmed) return { url: '', pageType: 'home' }

  // 内部页面协议
  if (trimmed.startsWith('internal://')) {
    const path = trimmed.replace('internal://', '')
    if (path === 'wikipedia') return { url: trimmed, pageType: 'wikipedia' }
    if (path === 'hackernews') return { url: trimmed, pageType: 'hackernews' }
    if (path === 'github') return { url: trimmed, pageType: 'github' }
    return { url: trimmed, pageType: 'home' }
  }

  // 已有协议前缀的完整URL
  if (trimmed.startsWith('http://') || trimmed.startsWith('https://')) {
    return { url: trimmed, pageType: 'iframe' }
  }

  // 特殊命令：wiki:搜索词
  if (trimmed.startsWith('wiki:')) {
    const query = trimmed.slice(5).trim()
    return { url: `internal://wikipedia`, pageType: 'wikipedia', searchQuery: query }
  }

  // 特殊命令：hn: 或 news:
  if (trimmed.startsWith('hn:') || trimmed.startsWith('news:')) {
    return { url: 'internal://hackernews', pageType: 'hackernews' }
  }

  // 特殊命令：gh: 或 git:
  if (trimmed.startsWith('gh:') || trimmed.startsWith('git:')) {
    const query = trimmed.slice(3).trim() || trimmed.slice(4).trim()
    return { url: 'internal://github', pageType: 'github', searchQuery: query }
  }

  // 看起来像域名
  if (trimmed.includes('.') && !trimmed.includes(' ')) {
    return { url: 'https://' + trimmed, pageType: 'iframe' }
  }

  // 否则视为搜索关键词 → Wikipedia搜索
  return { url: 'internal://wikipedia', pageType: 'wikipedia', searchQuery: trimmed }
}

function timeAgo(timestamp: number): string {
  const seconds = Math.floor((Date.now() / 1000) - timestamp)
  if (seconds < 60) return `${seconds}秒前`
  if (seconds < 3600) return `${Math.floor(seconds / 60)}分钟前`
  if (seconds < 86400) return `${Math.floor(seconds / 3600)}小时前`
  return `${Math.floor(seconds / 86400)}天前`
}

function generateId(): string {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 7)
}

// ==================== 样式常量 ====================
const S = {
  btnBase: {
    padding: '8px 12px' as const,
    borderRadius: 6,
    border: '1px solid #30363d',
    background: 'transparent',
    color: '#c9d1d9',
    cursor: 'pointer' as const,
    fontSize: 14,
    transition: 'all 0.2s',
  },
  btnDisabled: {
    background: 'rgba(48,54,61,0.5)',
    color: '#6e7681',
    cursor: 'not-allowed' as const,
  },
  btnActive: {
    background: 'rgba(102,126,234,0.2)',
    color: '#667eea',
  },
  cardBase: {
    padding: '14px 16px',
    borderRadius: 8,
    background: '#161b22',
    border: '1px solid #30363d',
    marginBottom: 8,
  },
  textPrimary: { color: '#e6edf3', fontSize: 14 },
  textSecondary: { color: '#8b949e', fontSize: 12 },
  textMuted: { color: '#6e7681', fontSize: 11 },
  linkColor: '#667eea',
}

// ==================== 主组件 ====================
const WebBrowser = memo(function WebBrowser() {
  // --- 标签页状态 ---
  const [tabs, setTabs] = useState<Tab[]>(() => {
    const initial: Tab = {
      id: generateId(),
      url: '',
      title: '新标签页',
      pageType: 'home',
      favicon: '🏠',
    }
    return [initial]
  })
  const [activeTabId, setActiveTabId] = useState(() => tabs[0].id)

  const currentTab = tabs.find(t => t.id === activeTabId) || tabs[0]

  // --- 通用状态 ---
  const [inputUrl, setInputUrl] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [iframeBlocked, setIframeBlocked] = useState(false)
  const [zoom, setZoom] = useState(100)

  // --- 历史和书签 ---
  const [history, setHistory] = useState<HistoryItem[]>(() => {
    try {
      const saved = localStorage.getItem('weblinux-browser-history')
      return saved ? JSON.parse(saved) : []
    } catch { return [] }
  })
  const [bookmarks, setBookmarks] = useState<Bookmark[]>(() => {
    try {
      const saved = localStorage.getItem('weblinux-browser-bookmarks')
      return saved ? JSON.parse(saved) : []
    } catch { return [] }
  })
  const [showHistory, setShowHistory] = useState(false)
  const [showBookmarks, setShowBookmarks] = useState(false)

  // --- API数据状态 ---
  const [wikiResults, setWikiResults] = useState<WikiSearchResult[]>([])
  const [wikiArticle, setWikiArticle] = useState<WikiArticle | null>(null)
  const [wikiQuery, setWikiQuery] = useState('')
  const [hnStories, setHnStories] = useState<HNItem[]>([])
  const [hnTab, setHnTab] = useState<'top' | 'new' | 'best' | 'ask' | 'show'>('top')
  const [ghRepos, setGhRepos] = useState<GHRepo[]>([])
  const [ghQuery, setGhQuery] = useState('')
  const [ghSort, setGhSort] = useState<'stars' | 'forks' | 'updated'>('stars')

  const iframeRef = useRef<HTMLIFrameElement>(null)
  const iframeTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  // --- 持久化 ---
  useEffect(() => {
    if (history.length > 0) {
      localStorage.setItem('weblinux-browser-history', JSON.stringify(history.slice(-50)))
    }
  }, [history])

  useEffect(() => {
    localStorage.setItem('weblinux-browser-bookmarks', JSON.stringify(bookmarks))
  }, [bookmarks])

  // ============ 标签页管理 ============
  const addTab = useCallback((url: string, pageType: PageType, title: string, favicon: string, searchQuery?: string) => {
    const newTab: Tab = { id: generateId(), url, title, pageType, favicon, searchQuery }
    setTabs(prev => [...prev, newTab])
    setActiveTabId(newTab.id)
    setInputUrl(url.startsWith('internal://') ? '' : url)
  }, [])

  const closeTab = useCallback((tabId: string) => {
    setTabs(prev => {
      if (prev.length <= 1) return prev
      const next = prev.filter(t => t.id !== tabId)
      if (activeTabId === tabId) {
        const idx = prev.findIndex(t => t.id === tabId)
        const newActive = next[Math.min(idx, next.length - 1)]
        setActiveTabId(newActive.id)
        setInputUrl(newActive.url.startsWith('internal://') ? '' : newActive.url)
      }
      return next
    })
  }, [activeTabId])

  const updateCurrentTab = useCallback((updates: Partial<Tab>) => {
    setTabs(prev => prev.map(t => t.id === activeTabId ? { ...t, ...updates } : t))
  }, [activeTabId])

  // ============ 导航 ============
  const navigateTo = useCallback((targetUrl: string, queryOverride?: string) => {
    const { url: finalUrl, pageType, searchQuery } = parseUrl(targetUrl)
    const query = queryOverride || searchQuery

    // 设置加载状态
    setIsLoading(true)
    setError(null)
    setIframeBlocked(false)
    setWikiArticle(null)

    // 更新标签页
    const title = pageType === 'home' ? '新标签页'
      : pageType === 'wikipedia' ? '维基百科'
      : pageType === 'hackernews' ? 'Hacker News'
      : pageType === 'github' ? 'GitHub 热门'
      : finalUrl.split('/')[2] || finalUrl
    const favicon = pageType === 'home' ? '🏠'
      : pageType === 'wikipedia' ? '📚'
      : pageType === 'hackernews' ? '📰'
      : pageType === 'github' ? '🐙'
      : FAVICON_MAP[finalUrl.split('/')[2] || ''] || '🌐'

    updateCurrentTab({ url: finalUrl, pageType, title, favicon, searchQuery: query })
    setInputUrl(pageType !== 'home' && !finalUrl.startsWith('internal://') ? finalUrl : (query || ''))

    // 添加历史
    if (finalUrl && pageType !== 'home') {
      const newHistoryItem: HistoryItem = { url: finalUrl, title, timestamp: new Date() }
      setHistory(prev => [...prev.slice(-49), newHistoryItem])
    }

    // 根据页面类型加载数据
    if (pageType === 'wikipedia' && query) {
      fetchWikipediaSearch(query)
    } else if (pageType === 'hackernews') {
      fetchHackerNews(hnTab)
    } else if (pageType === 'github') {
      fetchGitHubTrending(query || '')
    } else if (pageType === 'iframe') {
      // iframe加载 - 设置超时检测
      if (iframeTimeoutRef.current) clearTimeout(iframeTimeoutRef.current)
      iframeTimeoutRef.current = setTimeout(() => {
        setIframeBlocked(true)
        setIsLoading(false)
      }, 8000)
    } else {
      setIsLoading(false)
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeTabId, hnTab, updateCurrentTab])

  // ============ API 调用 ============
  const fetchWikipediaSearch = useCallback(async (query: string) => {
    setIsLoading(true)
    setError(null)
    setWikiQuery(query)
    try {
      const resp = await fetch(
        `https://zh.wikipedia.org/w/api.php?action=query&list=search&srsearch=${encodeURIComponent(query)}&srlimit=15&format=json&origin=*`
      )
      const data = await resp.json()
      setWikiResults(data.query?.search || [])
      if (data.query?.search?.length === 0) {
        // 尝试英文维基
        const enResp = await fetch(
          `https://en.wikipedia.org/w/api.php?action=query&list=search&srsearch=${encodeURIComponent(query)}&srlimit=15&format=json&origin=*`
        )
        const enData = await enResp.json()
        setWikiResults(enData.query?.search || [])
      }
    } catch {
      setError('维基百科搜索失败，请检查网络连接')
    }
    setIsLoading(false)
  }, [])

  const fetchWikipediaArticle = useCallback(async (pageid: number, title: string) => {
    setIsLoading(true)
    setError(null)
    try {
      const lang = /[\u4e00-\u9fa5]/.test(title) ? 'zh' : 'en'
      const resp = await fetch(
        `https://${lang}.wikipedia.org/w/api.php?action=query&pageids=${pageid}&prop=extracts|pageimages&exintro=false&explaintext=true&piprop=thumbnail&pithumbsize=300&format=json&origin=*`
      )
      const data = await resp.json()
      const page = data.query?.pages?.[pageid]
      if (page) {
        setWikiArticle({ title: page.title, extract: page.extract || '', thumbnail: page.thumbnail })
        updateCurrentTab({ title: page.title })
      }
    } catch {
      setError('加载维基百科文章失败')
    }
    setIsLoading(false)
  }, [updateCurrentTab])

  const fetchHackerNews = useCallback(async (tab: 'top' | 'new' | 'best' | 'ask' | 'show') => {
    setIsLoading(true)
    setError(null)
    setHnTab(tab)
    try {
      const storyType = tab === 'ask' ? 'askstories' : tab === 'show' ? 'showstories' : `${tab}stories`
      const idResp = await fetch(`https://hacker-news.firebaseio.com/v0/${storyType}.json`)
      const ids: number[] = await idResp.json()
      const topIds = ids.slice(0, 20)
      const stories = await Promise.all(
        topIds.map(async (id) => {
          const r = await fetch(`https://hacker-news.firebaseio.com/v0/item/${id}.json`)
          return r.json()
        })
      )
      setHnStories(stories.filter(Boolean))
    } catch {
      setError('加载 Hacker News 失败，请检查网络连接')
    }
    setIsLoading(false)
  }, [])

  const fetchGitHubTrending = useCallback(async (query: string) => {
    setIsLoading(true)
    setError(null)
    setGhQuery(query)
    try {
      const q = query || 'stars:>1000'
      const resp = await fetch(
        `https://api.github.com/search/repositories?q=${encodeURIComponent(q)}&sort=${ghSort}&order=desc&per_page=20`
      )
      const data = await resp.json()
      setGhRepos(data.items || [])
    } catch {
      setError('加载 GitHub 数据失败，请检查网络连接')
    }
    setIsLoading(false)
  }, [ghSort])

  // 初始化加载：如果当前标签页是内置页面且没有数据，则加载数据
  useEffect(() => {
    if (currentTab.pageType === 'hackernews' && hnStories.length === 0) {
      fetchHackerNews('top')
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentTab.pageType])

  // ============ 历史和书签操作 ============
  const goBack = useCallback(() => {
    if (history.length > 1) {
      const prevItem = history[history.length - 2]
      navigateTo(prevItem.url)
    }
  }, [history, navigateTo])

  const refresh = useCallback(() => {
    if (currentTab.pageType === 'wikipedia' && wikiQuery) {
      fetchWikipediaSearch(wikiQuery)
    } else if (currentTab.pageType === 'hackernews') {
      fetchHackerNews(hnTab)
    } else if (currentTab.pageType === 'github') {
      fetchGitHubTrending(ghQuery)
    } else if (currentTab.pageType === 'iframe' && iframeRef.current) {
      setIsLoading(true)
      iframeRef.current.src = currentTab.url
    }
  }, [currentTab, wikiQuery, hnTab, ghQuery, fetchWikipediaSearch, fetchHackerNews, fetchGitHubTrending])

  const addBookmark = useCallback(() => {
    const exists = bookmarks.some(b => b.url === currentTab.url)
    if (!exists) {
      setBookmarks(prev => [...prev, { url: currentTab.url, title: currentTab.title, addedAt: new Date() }])
    }
  }, [currentTab, bookmarks])

  const removeBookmark = useCallback((targetUrl: string) => {
    setBookmarks(prev => prev.filter(b => b.url !== targetUrl))
  }, [])

  const clearHistory = useCallback(() => {
    setHistory([])
    localStorage.removeItem('weblinux-browser-history')
  }, [])

  const isBookmarked = bookmarks.some(b => b.url === currentTab.url)

  const handleIframeLoad = useCallback(() => {
    setIsLoading(false)
    setIframeBlocked(false)
    if (iframeTimeoutRef.current) {
      clearTimeout(iframeTimeoutRef.current)
      iframeTimeoutRef.current = null
    }
  }, [])

  const zoomIn = useCallback(() => setZoom(z => Math.min(z + 10, 200)), [])
  const zoomOut = useCallback(() => setZoom(z => Math.max(z - 10, 50)), [])

  // ============ 渲染：内置页面 ============

  // --- 主页 ---
  const renderHome = () => (
    <div style={{ flex: 1, overflow: 'auto', padding: 40, display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
      <div style={{ fontSize: 48, marginBottom: 8 }}>🌐</div>
      <h2 style={{ color: '#e6edf3', marginBottom: 24, fontWeight: 400 }}>WebLinux 浏览器</h2>
      <div style={{
        width: '100%', maxWidth: 500, position: 'relative', marginBottom: 32,
      }}>
        <input
          type="text"
          value={inputUrl}
          onChange={(e) => setInputUrl(e.target.value)}
          onKeyDown={(e) => { if (e.key === 'Enter' && inputUrl.trim()) navigateTo(inputUrl) }}
          placeholder="搜索维基百科，或输入网址..."
          autoFocus
          style={{
            width: '100%', padding: '14px 18px 14px 44px', borderRadius: 24,
            border: '1px solid #30363d', background: '#0d1117', color: '#e6edf3',
            fontSize: 16, outline: 'none', boxSizing: 'border-box',
          }}
        />
        <span style={{ position: 'absolute', left: 16, top: '50%', transform: 'translateY(-50%)', fontSize: 16 }}>🔍</span>
      </div>
      <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap', justifyContent: 'center', maxWidth: 600, marginBottom: 40 }}>
        {INTERNAL_PAGES.map(p => (
          <button
            key={p.pageType}
            onClick={() => navigateTo(p.url)}
            style={{
              padding: '16px 24px', borderRadius: 12, border: '1px solid #30363d',
              background: '#161b22', color: '#e6edf3', cursor: 'pointer', fontSize: 14,
              display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8, minWidth: 100,
              transition: 'all 0.2s',
            }}
          >
            <span style={{ fontSize: 28 }}>{p.icon}</span>
            <span>{p.title}</span>
          </button>
        ))}
      </div>
      <div style={{ color: '#6e7681', fontSize: 12, textAlign: 'center', maxWidth: 400, lineHeight: 1.6 }}>
        提示：输入关键词直接搜索维基百科 · 输入 wiki:搜索词 搜索维基 · 输入网址访问网站 · 输入 gh:关键词 搜索GitHub
      </div>
    </div>
  )

  // --- 维基百科 ---
  const renderWikipedia = () => (
    <div style={{ flex: 1, overflow: 'auto', padding: 20, display: 'flex', flexDirection: 'column' }}>
      {/* 搜索栏 */}
      <div style={{ display: 'flex', gap: 8, marginBottom: 16 }}>
        <input
          type="text"
          value={wikiQuery}
          onChange={(e) => setWikiQuery(e.target.value)}
          onKeyDown={(e) => { if (e.key === 'Enter' && wikiQuery.trim()) fetchWikipediaSearch(wikiQuery) }}
          placeholder="搜索维基百科..."
          style={{
            flex: 1, padding: '10px 14px', borderRadius: 8, border: '1px solid #30363d',
            background: '#0d1117', color: '#e6edf3', fontSize: 14, outline: 'none',
          }}
        />
        <button
          onClick={() => fetchWikipediaSearch(wikiQuery)}
          style={{ ...S.btnBase, background: 'linear-gradient(135deg, #667eea, #764ba2)', border: 'none', color: '#fff', fontWeight: 600 }}
        >
          搜索
        </button>
      </div>

      {/* 文章详情 */}
      {wikiArticle && (
        <div style={{ marginBottom: 16 }}>
          <button
            onClick={() => setWikiArticle(null)}
            style={{ ...S.btnBase, marginBottom: 12, fontSize: 12, padding: '6px 12px' }}
          >
            ← 返回搜索结果
          </button>
          <div style={{ ...S.cardBase, padding: 24 }}>
            <div style={{ display: 'flex', gap: 16, alignItems: 'flex-start', flexWrap: 'wrap' }}>
              {wikiArticle.thumbnail && (
                <img src={wikiArticle.thumbnail.source} alt="" style={{ borderRadius: 8, maxWidth: 200 }} />
              )}
              <div style={{ flex: 1, minWidth: 200 }}>
                <h2 style={{ color: '#e6edf3', margin: '0 0 12px 0', fontSize: 20 }}>{wikiArticle.title}</h2>
                <div style={{ color: '#c9d1d9', fontSize: 14, lineHeight: 1.8, whiteSpace: 'pre-wrap' }}>
                  {wikiArticle.extract}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 搜索结果 */}
      {!wikiArticle && wikiResults.length > 0 && (
        <div>
          <h3 style={{ color: '#e6edf3', margin: '0 0 12px 0', fontSize: 14 }}>
            搜索结果（{wikiResults.length}条）
          </h3>
          {wikiResults.map((r) => (
            <div
              key={r.pageid}
              onClick={() => fetchWikipediaArticle(r.pageid, r.title)}
              style={{ ...S.cardBase, cursor: 'pointer', transition: 'all 0.2s' }}
            >
              <div style={{ color: S.linkColor, fontSize: 15, fontWeight: 600, marginBottom: 4 }}>{r.title}</div>
              <div style={{ ...S.textSecondary, lineHeight: 1.5 }} dangerouslySetInnerHTML={{ __html: r.snippet + '...' }} />
            </div>
          ))}
        </div>
      )}

      {!wikiArticle && wikiResults.length === 0 && !isLoading && wikiQuery && (
        <div style={{ textAlign: 'center', color: '#8b949e', padding: 40, fontSize: 14 }}>
          未找到相关结果，请尝试其他关键词
        </div>
      )}

      {!wikiArticle && wikiResults.length === 0 && !isLoading && !wikiQuery && (
        <div style={{ textAlign: 'center', color: '#8b949e', padding: 40, fontSize: 14 }}>
          输入关键词开始搜索维基百科
        </div>
      )}
    </div>
  )

  // --- Hacker News ---
  const renderHackerNews = () => {
    const hnTabs: { key: 'top' | 'new' | 'best' | 'ask' | 'show'; label: string }[] = [
      { key: 'top', label: '热门' },
      { key: 'new', label: '最新' },
      { key: 'best', label: '最佳' },
      { key: 'ask', label: 'Ask HN' },
      { key: 'show', label: 'Show HN' },
    ]
    return (
      <div style={{ flex: 1, overflow: 'auto', padding: 20, display: 'flex', flexDirection: 'column' }}>
        {/* 标签切换 */}
        <div style={{ display: 'flex', gap: 4, marginBottom: 16, flexWrap: 'wrap' }}>
          {hnTabs.map(t => (
            <button
              key={t.key}
              onClick={() => fetchHackerNews(t.key)}
              style={{
                ...S.btnBase,
                fontSize: 12, padding: '6px 12px',
                ...(hnTab === t.key ? S.btnActive : {}),
              }}
            >
              {t.label}
            </button>
          ))}
          <button
            onClick={() => fetchHackerNews(hnTab)}
            style={{ ...S.btnBase, fontSize: 12, padding: '6px 12px', marginLeft: 8 }}
          >
            🔄 刷新
          </button>
        </div>

        {/* 故事列表 */}
        {hnStories.map((story, i) => (
          <div key={story.id} style={{ ...S.cardBase, display: 'flex', gap: 12, alignItems: 'flex-start' }}>
            <span style={{ color: '#667eea', fontSize: 13, fontWeight: 700, minWidth: 24, textAlign: 'right' }}>
              {i + 1}.
            </span>
            <div style={{ flex: 1 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                {story.url ? (
                  <a
                    href={story.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    style={{ color: '#e6edf3', fontSize: 14, textDecoration: 'none', fontWeight: 500 }}
                  >
                    {story.title}
                  </a>
                ) : (
                  <span style={{ color: '#e6edf3', fontSize: 14, fontWeight: 500 }}>{story.title}</span>
                )}
              </div>
              <div style={{ ...S.textMuted, display: 'flex', gap: 12, flexWrap: 'wrap' }}>
                <span>▲ {story.score}</span>
                <span>by {story.by}</span>
                <span>{timeAgo(story.time)}</span>
                {story.descendants != null && <span>💬 {story.descendants}</span>}
                {story.url && (
                  <span style={{ color: '#6e7681' }}>
                    ({new URL(story.url).hostname})
                  </span>
                )}
              </div>
            </div>
          </div>
        ))}

        {hnStories.length === 0 && !isLoading && (
          <div style={{ textAlign: 'center', color: '#8b949e', padding: 40, fontSize: 14 }}>
            点击刷新加载 Hacker News 内容
          </div>
        )}
      </div>
    )
  }

  // --- GitHub ---
  const renderGitHub = () => (
    <div style={{ flex: 1, overflow: 'auto', padding: 20, display: 'flex', flexDirection: 'column' }}>
      {/* 搜索栏 */}
      <div style={{ display: 'flex', gap: 8, marginBottom: 12, flexWrap: 'wrap' }}>
        <input
          type="text"
          value={ghQuery}
          onChange={(e) => setGhQuery(e.target.value)}
          onKeyDown={(e) => { if (e.key === 'Enter') fetchGitHubTrending(ghQuery) }}
          placeholder="搜索 GitHub 仓库（如：react, vue, machine-learning）..."
          style={{
            flex: 1, minWidth: 200, padding: '10px 14px', borderRadius: 8, border: '1px solid #30363d',
            background: '#0d1117', color: '#e6edf3', fontSize: 14, outline: 'none',
          }}
        />
        <button
          onClick={() => fetchGitHubTrending(ghQuery)}
          style={{ ...S.btnBase, background: 'linear-gradient(135deg, #667eea, #764ba2)', border: 'none', color: '#fff', fontWeight: 600 }}
        >
          搜索
        </button>
      </div>
      {/* 排序 */}
      <div style={{ display: 'flex', gap: 4, marginBottom: 16 }}>
        {(['stars', 'forks', 'updated'] as const).map(s => (
          <button
            key={s}
            onClick={() => { setGhSort(s); fetchGitHubTrending(ghQuery) }}
            style={{
              ...S.btnBase, fontSize: 12, padding: '6px 12px',
              ...(ghSort === s ? S.btnActive : {}),
            }}
          >
            {s === 'stars' ? '⭐ 星标' : s === 'forks' ? '🍴 分支' : '🕐 更新'}
          </button>
        ))}
      </div>

      {/* 仓库列表 */}
      {ghRepos.map(repo => (
        <div key={repo.id} style={{ ...S.cardBase, display: 'flex', gap: 12, alignItems: 'flex-start' }}>
          <img src={repo.owner.avatar_url} alt="" style={{ width: 36, height: 36, borderRadius: 6, flexShrink: 0 }} />
          <div style={{ flex: 1, minWidth: 0 }}>
            <a
              href={repo.html_url}
              target="_blank"
              rel="noopener noreferrer"
              style={{ color: S.linkColor, fontSize: 14, textDecoration: 'none', fontWeight: 600 }}
            >
              {repo.full_name}
            </a>
            {repo.description && (
              <div style={{ ...S.textSecondary, marginTop: 4, lineHeight: 1.4, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {repo.description}
              </div>
            )}
            <div style={{ ...S.textMuted, marginTop: 6, display: 'flex', gap: 12, flexWrap: 'wrap' }}>
              {repo.language && <span style={{ color: '#667eea' }}>● {repo.language}</span>}
              <span>⭐ {repo.stargazers_count.toLocaleString()}</span>
              <span>🍴 {repo.forks_count.toLocaleString()}</span>
              <span>更新于 {new Date(repo.updated_at).toLocaleDateString('zh-CN')}</span>
            </div>
          </div>
        </div>
      ))}

      {ghRepos.length === 0 && !isLoading && (
        <div style={{ textAlign: 'center', color: '#8b949e', padding: 40, fontSize: 14 }}>
          输入关键词搜索 GitHub 仓库，或直接点击搜索查看热门项目
        </div>
      )}
    </div>
  )

  // --- iframe带fallback ---
  const renderIframe = () => (
    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden', position: 'relative' }}>
      {iframeBlocked && (
        <div style={{
          position: 'absolute', inset: 0, zIndex: 10,
          display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column',
          gap: 16, padding: 40, background: 'rgba(13,17,23,0.95)',
        }}>
          <div style={{ fontSize: 48 }}>🚫</div>
          <div style={{ fontSize: 16, color: '#e6edf3', textAlign: 'center' }}>
            此网站可能不允许在框架中显示
          </div>
          <div style={{ fontSize: 13, color: '#8b949e', textAlign: 'center', maxWidth: 400, lineHeight: 1.6 }}>
            大多数网站出于安全策略会阻止 iframe 嵌入。你可以尝试在外部浏览器中打开，或使用内置的维基百科、Hacker News 等功能。
          </div>
          <div style={{ display: 'flex', gap: 8 }}>
            <button
              onClick={() => window.open(currentTab.url, '_blank')}
              style={{
                padding: '10px 20px', borderRadius: 8, border: 'none',
                background: 'linear-gradient(135deg, #667eea, #764ba2)', color: '#fff',
                cursor: 'pointer', fontSize: 14, fontWeight: 600,
              }}
            >
              在外部浏览器打开
            </button>
            <button
              onClick={() => navigateTo('internal://wikipedia')}
              style={{ ...S.btnBase, padding: '10px 20px' }}
            >
              搜索维基百科
            </button>
          </div>
        </div>
      )}
      <div style={{
        flex: 1, overflow: 'auto',
        transform: `scale(${zoom / 100})`, transformOrigin: 'top left',
        width: `${100 / (zoom / 100)}%`, height: `${100 / (zoom / 100)}%`,
      }}>
        <iframe
          ref={iframeRef}
          src={currentTab.url}
          title="Web Browser"
          sandbox="allow-same-origin allow-scripts allow-popups allow-forms allow-modals"
          style={{ width: '100%', height: '100%', border: 'none', background: '#fff' }}
          onLoad={handleIframeLoad}
        />
      </div>
    </div>
  )

  // --- 内容路由 ---
  const renderContent = () => {
    if (isLoading && !iframeBlocked) {
      return (
        <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column', gap: 12 }}>
          <div style={{ fontSize: 32, animation: 'spin 1s linear infinite' }}>⏳</div>
          <div style={{ color: '#8b949e', fontSize: 14 }}>加载中...</div>
        </div>
      )
    }
    if (error) {
      return (
        <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column', gap: 16, padding: 40 }}>
          <div style={{ fontSize: 48 }}>⚠️</div>
          <div style={{ fontSize: 16, color: '#e6edf3', textAlign: 'center' }}>{error}</div>
          <button onClick={refresh} style={{ ...S.btnBase, background: 'linear-gradient(135deg, #667eea, #764ba2)', border: 'none', color: '#fff' }}>
            重试
          </button>
        </div>
      )
    }
    switch (currentTab.pageType) {
      case 'home': return renderHome()
      case 'wikipedia': return renderWikipedia()
      case 'hackernews': return renderHackerNews()
      case 'github': return renderGitHub()
      case 'iframe': return renderIframe()
      default: return renderHome()
    }
  }

  // ============ 主渲染 ============
  return (
    <div style={{
      height: '100%', display: 'flex', flexDirection: 'column',
      background: '#1a1a2e', color: '#e6edf3',
      fontFamily: 'system-ui, -apple-system, sans-serif',
    }}>
      {/* 标签页栏 */}
      <div style={{
        display: 'flex', background: '#0d1117', borderBottom: '1px solid #30363d',
        overflowX: 'auto', alignItems: 'center', minHeight: 36,
      }}>
        {tabs.map(tab => (
          <div
            key={tab.id}
            onClick={() => {
              setActiveTabId(tab.id)
              setInputUrl(tab.url.startsWith('internal://') ? (tab.searchQuery || '') : tab.url)
            }}
            style={{
              display: 'flex', alignItems: 'center', gap: 6,
              padding: '6px 12px', cursor: 'pointer', fontSize: 12,
              background: tab.id === activeTabId ? '#1a1a2e' : 'transparent',
              borderBottom: tab.id === activeTabId ? '2px solid #667eea' : '2px solid transparent',
              color: tab.id === activeTabId ? '#e6edf3' : '#8b949e',
              whiteSpace: 'nowrap', maxWidth: 180, overflow: 'hidden', textOverflow: 'ellipsis',
              borderRight: '1px solid #30363d', transition: 'all 0.2s',
            }}
          >
            <span>{tab.favicon}</span>
            <span style={{ overflow: 'hidden', textOverflow: 'ellipsis' }}>{tab.title}</span>
            {tabs.length > 1 && (
              <span
                onClick={(e) => { e.stopPropagation(); closeTab(tab.id) }}
                style={{ marginLeft: 4, color: '#6e7681', fontSize: 10, lineHeight: 1, padding: '2px 4px', borderRadius: 3 }}
              >
                ✕
              </span>
            )}
          </div>
        ))}
        <button
          onClick={() => addTab('', 'home', '新标签页', '🏠')}
          style={{
            padding: '6px 10px', background: 'none', border: 'none', color: '#8b949e',
            cursor: 'pointer', fontSize: 16, lineHeight: 1,
          }}
        >
          +
        </button>
      </div>

      {/* 工具栏 */}
      <div style={{
        padding: '8px 12px', background: '#161b22', borderBottom: '1px solid #30363d',
        display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap',
      }}>
        {/* 导航按钮 */}
        <div style={{ display: 'flex', gap: 4 }}>
          <button
            onClick={goBack}
            disabled={history.length <= 1}
            style={{
              ...S.btnBase,
              ...(history.length <= 1 ? S.btnDisabled : {}),
            }}
          >
            ←
          </button>
          <button
            onClick={refresh}
            style={S.btnBase}
          >
            {isLoading ? '⏳' : '🔄'}
          </button>
        </div>

        {/* URL输入框 */}
        <div style={{ flex: 1, minWidth: 200, position: 'relative' }}>
          <input
            type="text"
            value={inputUrl}
            onChange={(e) => setInputUrl(e.target.value)}
            onKeyDown={(e) => { if (e.key === 'Enter' && inputUrl.trim()) navigateTo(inputUrl) }}
            placeholder="搜索或输入网址..."
            style={{
              width: '100%', padding: '10px 14px 10px 38px', borderRadius: 8,
              border: '1px solid #30363d', background: '#0d1117', color: '#e6edf3',
              fontSize: 14, outline: 'none', transition: 'border-color 0.2s', boxSizing: 'border-box',
            }}
          />
          <span style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', fontSize: 14 }}>
            {currentTab.favicon}
          </span>
          {isLoading && (
            <div style={{ position: 'absolute', right: 10, top: '50%', transform: 'translateY(-50%)', color: '#667eea', fontSize: 12 }}>
              加载中...
            </div>
          )}
        </div>

        {/* 操作按钮 */}
        <div style={{ display: 'flex', gap: 4 }}>
          <button onClick={addBookmark} style={{ ...S.btnBase, ...(isBookmarked ? S.btnActive : {}) }}>
            {isBookmarked ? '★' : '☆'}
          </button>
          <button onClick={() => setShowBookmarks(!showBookmarks)} style={{ ...S.btnBase, ...(showBookmarks ? S.btnActive : {}) }}>
            📚
          </button>
          <button onClick={() => setShowHistory(!showHistory)} style={{ ...S.btnBase, ...(showHistory ? S.btnActive : {}) }}>
            📜
          </button>
        </div>

        {/* 缩放控制 */}
        <div style={{ display: 'flex', gap: 2, alignItems: 'center' }}>
          <button onClick={zoomOut} style={{ ...S.btnBase, padding: '6px 10px', fontSize: 12 }}>−</button>
          <span style={{ fontSize: 12, color: '#8b949e', minWidth: 45, textAlign: 'center' }}>{zoom}%</span>
          <button onClick={zoomIn} style={{ ...S.btnBase, padding: '6px 10px', fontSize: 12 }}>+</button>
        </div>
      </div>

      {/* 主内容区 */}
      <div style={{ flex: 1, display: 'flex', overflow: 'hidden' }}>
        {/* 侧边栏 */}
        {(showHistory || showBookmarks) && (
          <div style={{
            width: 280, background: '#161b22', borderRight: '1px solid #30363d',
            display: 'flex', flexDirection: 'column', overflow: 'hidden',
          }}>
            <div style={{
              padding: '12px 16px', borderBottom: '1px solid #30363d',
              display: 'flex', justifyContent: 'space-between', alignItems: 'center',
            }}>
              <h3 style={{ fontSize: 14, fontWeight: 600, margin: 0 }}>
                {showHistory ? '浏览历史' : '书签'}
              </h3>
              <button
                onClick={() => { if (showHistory) clearHistory(); else setBookmarks([]) }}
                style={{ padding: '4px 8px', borderRadius: 4, border: '1px solid #30363d', background: 'transparent', color: '#8b949e', cursor: 'pointer', fontSize: 12 }}
              >
                清空
              </button>
            </div>
            <div style={{ flex: 1, overflowY: 'auto', padding: 8 }}>
              {showHistory ? (
                history.length === 0 ? (
                  <div style={{ color: '#8b949e', textAlign: 'center', padding: 20, fontSize: 13 }}>暂无浏览历史</div>
                ) : (
                  history.slice().reverse().map((item, i) => (
                    <div
                      key={i}
                      onClick={() => { navigateTo(item.url); setShowHistory(false) }}
                      style={{
                        padding: '10px 12px', borderRadius: 6, cursor: 'pointer', marginBottom: 4,
                        background: currentTab.url === item.url ? 'rgba(102,126,234,0.2)' : 'transparent',
                        border: '1px solid transparent', transition: 'all 0.2s',
                      }}
                    >
                      <div style={{ fontSize: 13, color: '#e6edf3', marginBottom: 4 }}>{item.title}</div>
                      <div style={{ fontSize: 11, color: '#8b949e' }}>{item.url}</div>
                    </div>
                  ))
                )
              ) : (
                bookmarks.length === 0 ? (
                  <div style={{ color: '#8b949e', textAlign: 'center', padding: 20, fontSize: 13 }}>暂无书签</div>
                ) : (
                  bookmarks.map((bookmark, i) => (
                    <div
                      key={i}
                      style={{
                        padding: '10px 12px', borderRadius: 6, cursor: 'pointer', marginBottom: 4,
                        border: '1px solid transparent', display: 'flex', justifyContent: 'space-between', alignItems: 'center', transition: 'all 0.2s',
                      }}
                    >
                      <div onClick={() => { navigateTo(bookmark.url); setShowBookmarks(false) }} style={{ flex: 1 }}>
                        <div style={{ fontSize: 13, color: '#e6edf3', marginBottom: 4 }}>{bookmark.title}</div>
                        <div style={{ fontSize: 11, color: '#8b949e' }}>{bookmark.url}</div>
                      </div>
                      <button onClick={() => removeBookmark(bookmark.url)} style={{ background: 'none', border: 'none', color: '#8b949e', cursor: 'pointer', fontSize: 12, padding: 4 }}>
                        ✕
                      </button>
                    </div>
                  ))
                )
              )}
            </div>
          </div>
        )}

        {/* 浏览器内容 */}
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
          {renderContent()}
        </div>
      </div>

      {/* 快速访问栏 */}
      <div style={{
        padding: '8px 12px', background: '#161b22', borderTop: '1px solid #30363d',
        display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'center',
      }}>
        <span style={{ fontSize: 12, color: '#8b949e' }}>快速访问:</span>
        {QUICK_ACCESS.map(site => (
          <button
            key={site.url + site.title}
            onClick={() => {
              if (site.pageType !== 'iframe') {
                navigateTo(site.url)
              } else {
                addTab(site.url, site.pageType, site.title, site.icon)
              }
            }}
            style={{
              padding: '6px 10px', borderRadius: 6, border: '1px solid #30363d',
              background: 'transparent', color: '#c9d1d9', cursor: 'pointer', fontSize: 12,
              display: 'flex', alignItems: 'center', gap: 4, transition: 'all 0.2s',
            }}
          >
            <span>{site.icon}</span>
            <span>{site.title}</span>
          </button>
        ))}
      </div>

      {/* 状态栏 */}
      <div style={{
        padding: '6px 12px', background: '#0d1117', borderTop: '1px solid #30363d',
        display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: 11, color: '#8b949e',
      }}>
        <span>{currentTab.title}</span>
        <span>{currentTab.url || '新标签页'}</span>
      </div>

      {/* 旋转动画样式 */}
      <style>{`@keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }`}</style>
    </div>
  )
})

export default WebBrowser
