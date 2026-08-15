import { useState, useEffect, useCallback, useMemo, useRef } from 'react'

interface RssSource {
  id: string
  name: string
  url: string
  isBuiltin?: boolean
  favicon?: string
}

interface RssItem {
  id: string
  title: string
  link: string
  description: string
  pubDate: string
  author?: string
  category?: string[]
  content?: string
}

interface RssFeed {
  title: string
  description: string
  link: string
  items: RssItem[]
  sourceUrl: string
}

interface ReadState {
  [itemId: string]: boolean
}

interface FavoritesState {
  [itemId: string]: RssItem
}

interface CachedFeed {
  sourceUrl: string
  feed: RssFeed
  timestamp: number
}

type ThemeMode = 'dark' | 'light'

const STORAGE_SOURCES = 'smart-rss-sources-v1'
const STORAGE_READ = 'smart-rss-read-v1'
const STORAGE_FAVORITES = 'smart-rss-favorites-v1'
const STORAGE_CACHE = 'smart-rss-cache-v1'
const STORAGE_THEME = 'smart-rss-theme-v1'

const CACHE_TTL = 30 * 60 * 1000

const PROXY_URLS = [
  (url: string) => `https://api.allorigins.win/raw?url=${encodeURIComponent(url)}`,
  (url: string) => `https://corsproxy.io/?${encodeURIComponent(url)}`,
  (url: string) => `https://api.codetabs.com/v1/proxy/?quest=${encodeURIComponent(url)}`,
]

const BUILTIN_SOURCES: RssSource[] = [
  {
    id: 'builtin-hn',
    name: 'Hacker News',
    url: 'https://hnrss.org/frontpage',
    isBuiltin: true,
    favicon: '🟠',
  },
  {
    id: 'builtin-techcrunch',
    name: 'TechCrunch',
    url: 'https://techcrunch.com/feed/',
    isBuiltin: true,
    favicon: '🟢',
  },
  {
    id: 'builtin-theverge',
    name: 'The Verge',
    url: 'https://www.theverge.com/rss/index.xml',
    isBuiltin: true,
    favicon: '🔵',
  },
  {
    id: 'builtin-ars',
    name: 'Ars Technica',
    url: 'https://feeds.arstechnica.com/arstechnica/index',
    isBuiltin: true,
    favicon: '🔴',
  },
  {
    id: 'builtin-wired',
    name: 'Wired',
    url: 'https://www.wired.com/feed/rss',
    isBuiltin: true,
    favicon: '⚫',
  },
  {
    id: 'builtin-bbc',
    name: 'BBC News',
    url: 'http://feeds.bbci.co.uk/news/rss.xml',
    isBuiltin: true,
    favicon: '🔴',
  },
  {
    id: 'builtin-reuters',
    name: 'Reuters',
    url: 'https://feeds.reuters.com/reuters/topNews',
    isBuiltin: true,
    favicon: '🔵',
  },
  {
    id: 'builtin-nyt',
    name: 'New York Times',
    url: 'https://rss.nytimes.com/services/xml/rss/nyt/HomePage.xml',
    isBuiltin: true,
    favicon: '🟡',
  },
  {
    id: 'builtin-guardian',
    name: 'The Guardian',
    url: 'https://www.theguardian.com/world/rss',
    isBuiltin: true,
    favicon: '🔵',
  },
  {
    id: 'builtin-cnn',
    name: 'CNN',
    url: 'http://rss.cnn.com/rss/edition.rss',
    isBuiltin: true,
    favicon: '🔴',
  },
  {
    id: 'builtin-xinhua',
    name: '新华社',
    url: 'http://www.xinhuanet.com/rss/news.xml',
    isBuiltin: true,
    favicon: '🔴',
  },
  {
    id: 'builtin-wikipedia',
    name: 'Wikipedia',
    url: 'https://en.wikipedia.org/w/api.php?action=featuredfeed&feed=news&feedformat=atom',
    isBuiltin: true,
    favicon: '⚪',
  },
]

const PAGE_SIZE = 20

function genId(): string {
  return 'itm-' + Math.random().toString(36).slice(2, 10) + '-' + Date.now().toString(36)
}

function genSourceId(): string {
  return 'src-' + Math.random().toString(36).slice(2, 10)
}

function stripHtml(html: string): string {
  if (!html || typeof html !== 'string') return ''
  return html
    .replace(/<script[\s\S]*?<\/script>/gi, '')
    .replace(/<style[\s\S]*?<\/style>/gi, '')
    .replace(/<iframe[\s\S]*?<\/iframe>/gi, '')
    .replace(/<br\s*\/?>/gi, ' ')
    .replace(/<\/p>/gi, ' ')
    .replace(/<\/div>/gi, ' ')
    .replace(/<li>/gi, ' · ')
    .replace(/<[^>]+>/g, '')
    .replace(/&nbsp;/gi, ' ')
    .replace(/&amp;/gi, '&')
    .replace(/&lt;/gi, '<')
    .replace(/&gt;/gi, '>')
    .replace(/&quot;/gi, '"')
    .replace(/&#x27;/gi, "'")
    .replace(/&#\d+;/gi, '')
    .replace(/\s+/g, ' ')
    .trim()
}

function truncate(text: string, max = 220): string {
  const cleaned = stripHtml(text)
  if (cleaned.length <= max) return cleaned
  return cleaned.slice(0, max).trimEnd() + '…'
}

function formatDate(raw?: string): string {
  if (!raw) return ''
  const d = new Date(raw)
  if (Number.isNaN(d.getTime())) return raw
  const now = Date.now()
  const diff = (now - d.getTime()) / 1000
  if (diff < 0) return d.toLocaleString()
  if (diff < 60) return `${Math.floor(diff)} 秒前`
  if (diff < 3600) return `${Math.floor(diff / 60)} 分钟前`
  if (diff < 86400) return `${Math.floor(diff / 3600)} 小时前`
  if (diff < 86400 * 7) return `${Math.floor(diff / 86400)} 天前`
  return d.toLocaleString()
}

function sanitizeHtml(html: string): string {
  if (!html) return ''
  return html
    .replace(/<script[\s\S]*?<\/script>/gi, '')
    .replace(/<style[\s\S]*?<\/style>/gi, '')
    .replace(/<iframe[\s\S]*?<\/iframe>/gi, '')
    .replace(/<object[\s\S]*?<\/object>/gi, '')
    .replace(/<embed[\s\S]*?<\/embed>/gi, '')
    .replace(/on\w+="[^"]*"/gi, '')
    .replace(/on\w+='[^']*'/gi, '')
    .replace(/javascript:/gi, '')
}

function textContent(el: Element | null | undefined): string {
  return (el?.textContent || '').trim()
}

function parseRssXml(xmlText: string, sourceUrl: string): RssFeed {
  const parser = new DOMParser()
  const doc = parser.parseFromString(xmlText, 'text/xml')
  const parseError = doc.querySelector('parsererror')
  if (parseError) {
    throw new Error('XML 解析失败：源可能不是有效的 RSS / Atom 订阅')
  }

  let channelTitle = ''
  let channelDesc = ''
  let channelLink = ''
  const items: RssItem[] = []

  const channel = doc.querySelector('rss > channel')
  if (channel) {
    channelTitle = textContent(channel.querySelector(':scope > title'))
    channelDesc = textContent(channel.querySelector(':scope > description'))
    channelLink = textContent(channel.querySelector(':scope > link'))
    const entries = channel.querySelectorAll(':scope > item')
    entries.forEach((node) => {
      const title = textContent(node.querySelector(':scope > title'))
      const link = textContent(node.querySelector(':scope > link'))
      const description =
        textContent(node.querySelector(':scope > description')) || ''
      const content =
        textContent(node.querySelector(':scope > content\\:encoded')) || description
      const pubDate =
        textContent(node.querySelector(':scope > pubDate')) ||
        textContent(node.querySelector(':scope > dc\\:date'))
      const author =
        textContent(node.querySelector(':scope > author')) ||
        textContent(node.querySelector(':scope > dc\\:creator'))
      const categories = Array.from(node.querySelectorAll(':scope > category'))
        .map((c) => c.textContent || '')
        .filter(Boolean)
      if (title || link) {
        const itemId = link || genId()
        items.push({
          id: itemId,
          title,
          link,
          description,
          content,
          pubDate,
          author,
          category: categories,
        })
      }
    })
    if (items.length > 0) {
      return {
        title: channelTitle || '未知订阅',
        description: channelDesc,
        link: channelLink,
        items,
        sourceUrl,
      }
    }
  }

  const feed = doc.querySelector('feed')
  if (feed) {
    channelTitle = textContent(feed.querySelector(':scope > title'))
    const linkEl = feed.querySelector(':scope > link[href]')
    channelLink = linkEl?.getAttribute('href') || ''
    channelDesc =
      textContent(feed.querySelector(':scope > subtitle')) ||
      textContent(feed.querySelector(':scope > summary'))
    const entries = feed.querySelectorAll(':scope > entry')
    entries.forEach((node) => {
      const title = textContent(node.querySelector(':scope > title'))
      const linkNode = node.querySelector(':scope > link[href]')
      const link = linkNode?.getAttribute('href') || ''
      const description =
        textContent(node.querySelector(':scope > summary')) || ''
      const content =
        textContent(node.querySelector(':scope > content')) || description
      const pubDate =
        textContent(node.querySelector(':scope > updated')) ||
        textContent(node.querySelector(':scope > published'))
      const author = textContent(node.querySelector(':scope > author > name'))
      if (title || link) {
        const itemId = link || genId()
        items.push({
          id: itemId,
          title,
          link,
          description,
          content,
          pubDate,
          author,
        })
      }
    })
    if (items.length > 0) {
      return {
        title: channelTitle || '未知订阅',
        description: channelDesc,
        link: channelLink,
        items,
        sourceUrl,
      }
    }
  }

  const rdfItems = doc.querySelectorAll('item')
  if (rdfItems.length > 0) {
    rdfItems.forEach((node) => {
      const title = textContent(node.querySelector(':scope > title'))
      const link = textContent(node.querySelector(':scope > link'))
      const description = textContent(node.querySelector(':scope > description'))
      const pubDate =
        textContent(node.querySelector(':scope > dc\\:date')) ||
        textContent(node.querySelector(':scope > pubDate'))
      if (title || link) {
        const itemId = link || genId()
        items.push({ id: itemId, title, link, description, pubDate })
      }
    })
    return {
      title: 'RSS 订阅',
      description: '',
      link: '',
      items,
      sourceUrl,
    }
  }

  throw new Error('未找到可解析的 RSS / Atom 条目')
}

function loadSources(): RssSource[] {
  try {
    const raw = localStorage.getItem(STORAGE_SOURCES)
    if (!raw) return []
    const parsed = JSON.parse(raw)
    if (!Array.isArray(parsed)) return []
    return parsed
      .filter((s) => s && typeof s.url === 'string' && typeof s.name === 'string')
      .map((s) => ({
        id: String(s.id || genSourceId()),
        name: String(s.name),
        url: String(s.url),
        isBuiltin: false,
      }))
  } catch {
    return []
  }
}

function saveSources(list: RssSource[]) {
  const toSave = list
    .filter((s) => !s.isBuiltin)
    .map(({ id, name, url }) => ({ id, name, url }))
  try {
    localStorage.setItem(STORAGE_SOURCES, JSON.stringify(toSave))
  } catch {
    /* ignore */
  }
}

function loadReadState(): ReadState {
  try {
    const raw = localStorage.getItem(STORAGE_READ)
    if (!raw) return {}
    return JSON.parse(raw)
  } catch {
    return {}
  }
}

function saveReadState(state: ReadState) {
  try {
    localStorage.setItem(STORAGE_READ, JSON.stringify(state))
  } catch {
    /* ignore */
  }
}

function loadFavorites(): FavoritesState {
  try {
    const raw = localStorage.getItem(STORAGE_FAVORITES)
    if (!raw) return {}
    return JSON.parse(raw)
  } catch {
    return {}
  }
}

function saveFavorites(state: FavoritesState) {
  try {
    localStorage.setItem(STORAGE_FAVORITES, JSON.stringify(state))
  } catch {
    /* ignore */
  }
}

function loadCache(): Record<string, CachedFeed> {
  try {
    const raw = localStorage.getItem(STORAGE_CACHE)
    if (!raw) return {}
    return JSON.parse(raw)
  } catch {
    return {}
  }
}

function saveCache(cache: Record<string, CachedFeed>) {
  try {
    const serialized: Record<string, CachedFeed> = {}
    Object.entries(cache).forEach(([key, value]) => {
      if (Date.now() - value.timestamp < CACHE_TTL) {
        serialized[key] = value
      }
    })
    localStorage.setItem(STORAGE_CACHE, JSON.stringify(serialized))
  } catch {
    /* ignore */
  }
}

function loadTheme(): ThemeMode {
  try {
    const raw = localStorage.getItem(STORAGE_THEME)
    if (raw === 'light' || raw === 'dark') return raw
  } catch {
    /* ignore */
  }
  return 'dark'
}

function saveTheme(theme: ThemeMode) {
  try {
    localStorage.setItem(STORAGE_THEME, theme)
  } catch {
    /* ignore */
  }
}

const darkTheme = {
  bg: 'linear-gradient(180deg, #0f172a 0%, #111827 40%, #0b1220 100%)',
  bgSecondary: 'rgba(15,23,42,0.55)',
  bgTertiary: 'rgba(17,24,39,0.6)',
  cardBg: 'rgba(30,41,59,0.55)',
  cardBgHover: 'rgba(30,41,59,0.75)',
  borderColor: 'rgba(148,163,184,0.15)',
  borderActive: 'rgba(249,115,22,0.5)',
  textPrimary: '#f1f5f9',
  textSecondary: '#94a3b8',
  textTertiary: '#64748b',
  textMuted: '#475569',
  accentPrimary: '#f97316',
  accentSecondary: '#fb923c',
  accentSuccess: '#22c55e',
  accentDanger: '#ef4444',
  accentInfo: '#3b82f6',
  headerBg: 'linear-gradient(90deg, #1e293b, #111827)',
  inputBg: 'rgba(15,23,42,0.85)',
  inputBorder: 'rgba(148,163,184,0.25)',
  unreadDot: '#f97316',
  readOpacity: 0.55,
  favoriteActive: '#fbbf24',
}

const lightTheme = {
  bg: 'linear-gradient(180deg, #f8fafc 0%, #f1f5f9 40%, #e2e8f0 100%)',
  bgSecondary: 'rgba(255,255,255,0.8)',
  bgTertiary: 'rgba(255,255,255,0.6)',
  cardBg: 'rgba(255,255,255,0.9)',
  cardBgHover: 'rgba(255,255,255,1)',
  borderColor: 'rgba(148,163,184,0.2)',
  borderActive: 'rgba(249,115,22,0.5)',
  textPrimary: '#0f172a',
  textSecondary: '#475569',
  textTertiary: '#64748b',
  textMuted: '#94a3b8',
  accentPrimary: '#ea580c',
  accentSecondary: '#f97316',
  accentSuccess: '#16a34a',
  accentDanger: '#dc2626',
  accentInfo: '#2563eb',
  headerBg: 'linear-gradient(90deg, #ffffff, #f8fafc)',
  inputBg: 'rgba(255,255,255,0.95)',
  inputBorder: 'rgba(148,163,184,0.3)',
  unreadDot: '#ea580c',
  readOpacity: 0.6,
  favoriteActive: '#d97706',
}

function fetchFeedWithFallback(sourceUrl: string): Promise<string> {
  let lastError: Error | null = null
  const tryFetch = (index: number): Promise<string> => {
    if (index >= PROXY_URLS.length) {
      throw lastError || new Error('所有代理均无法访问')
    }
    const proxyUrl = PROXY_URLS[index](sourceUrl)
    return fetch(proxyUrl, { cache: 'no-store' })
      .then((res) => {
        if (!res.ok) throw new Error(`代理返回错误：HTTP ${res.status}`)
        return res.text()
      })
      .then((text) => {
        if (!text || text.length < 30) {
          throw new Error('未接收到有效内容')
        }
        return text
      })
      .catch((err) => {
        lastError = err
        return tryFetch(index + 1)
      })
  }
  return tryFetch(0)
}

export default function SmartRSSReader() {
  const [userSources, setUserSources] = useState<RssSource[]>(() => loadSources())
  const [selectedId, setSelectedId] = useState<string>(BUILTIN_SOURCES[0].id)
  const [feeds, setFeeds] = useState<Record<string, RssFeed>>({})
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [searchQuery, setSearchQuery] = useState('')
  const [newName, setNewName] = useState('')
  const [newUrl, setNewUrl] = useState('')
  const [showAdd, setShowAdd] = useState(false)
  const [activeItem, setActiveItem] = useState<RssItem | null>(null)
  const [readState, setReadState] = useState<ReadState>(() => loadReadState())
  const [favorites, setFavorites] = useState<FavoritesState>(() => loadFavorites())
  const [cache, setCache] = useState<Record<string, CachedFeed>>(() => loadCache())
  const [theme, setTheme] = useState<ThemeMode>(() => loadTheme())
  const [visibleCount, setVisibleCount] = useState(PAGE_SIZE)
  const [activeTab, setActiveTab] = useState<'all' | 'unread' | 'favorites'>('all')
  void setActiveTab
  const [activeSourceTab, setActiveSourceTab] = useState<'sources' | 'favorites' | 'history'>('sources')

  const scrollRef = useRef<HTMLDivElement>(null)

  const t = theme === 'dark' ? darkTheme : lightTheme

  const allSources = useMemo(
    () => [...BUILTIN_SOURCES, ...userSources],
    [userSources],
  )

  const selectedSource = useMemo(
    () => allSources.find((s) => s.id === selectedId) || allSources[0],
    [allSources, selectedId],
  )

  const currentFeed = useMemo(() => {
    if (!selectedSource) return null
    return feeds[selectedSource.id] || null
  }, [feeds, selectedSource])

  const allFeedItems = useMemo(() => {
    const items: RssItem[] = []
    Object.values(feeds).forEach((feed) => {
      items.push(...feed.items)
    })
    return items.sort((a, b) => {
      const ta = new Date(a.pubDate).getTime() || 0
      const tb = new Date(b.pubDate).getTime() || 0
      return tb - ta
    })
  }, [feeds])

  const displayedItems = useMemo(() => {
    let items: RssItem[] = []

    if (activeSourceTab === 'favorites') {
      items = Object.values(favorites).sort((a, b) => {
        const ta = new Date(a.pubDate).getTime() || 0
        const tb = new Date(b.pubDate).getTime() || 0
        return tb - ta
      })
    } else if (activeSourceTab === 'history') {
      items = allFeedItems.filter((item) => readState[item.id])
    } else if (activeTab === 'unread') {
      const feed = currentFeed
      if (feed) {
        items = feed.items.filter((item) => !readState[item.id])
      }
    } else {
      const feed = currentFeed
      if (feed) {
        items = feed.items
      }
    }

    const q = searchQuery.trim().toLowerCase()
    if (q) {
      items = items.filter((it) => {
        return (
          it.title?.toLowerCase().includes(q) ||
          stripHtml(it.description).toLowerCase().includes(q) ||
          (it.author || '').toLowerCase().includes(q) ||
          (it.category || []).some((c) => c.toLowerCase().includes(q))
        )
      })
    }

    return items
  }, [
    currentFeed,
    activeTab,
    activeSourceTab,
    searchQuery,
    readState,
    favorites,
    allFeedItems,
  ])

  const paginatedItems = useMemo(() => {
    return displayedItems.slice(0, visibleCount)
  }, [displayedItems, visibleCount])

  const hasMore = visibleCount < displayedItems.length

  const fetchFeed = useCallback(
    async (source: RssSource, forceRefresh = false) => {
      setLoading(true)
      setError(null)
      setActiveItem(null)

      const cacheKey = source.url
      const cached = cache[cacheKey]
      if (!forceRefresh && cached && Date.now() - cached.timestamp < CACHE_TTL) {
        setFeeds((prev) => ({ ...prev, [source.id]: cached.feed }))
        setLoading(false)
        return
      }

      try {
        const text = await fetchFeedWithFallback(source.url)
        const parsed = parseRssXml(text, source.url)
        setFeeds((prev) => ({ ...prev, [source.id]: parsed }))

        const newCache = {
          ...cache,
          [cacheKey]: {
            sourceUrl: source.url,
            feed: parsed,
            timestamp: Date.now(),
          },
        }
        setCache(newCache)
        saveCache(newCache)
      } catch (e: any) {
        const msg = e?.message || String(e)
        let friendly = '加载失败，请稍后重试'
        if (msg.includes('Failed to fetch') || msg.includes('NetworkError')) {
          friendly = '网络错误：无法连接到 RSS 代理服务'
        } else if (msg.includes('XML') || msg.includes('解析')) {
          friendly = `解析失败：${msg}`
        } else if (msg.includes('HTTP')) {
          friendly = `远程站点错误：${msg}`
        } else {
          friendly = msg
        }
        setError(friendly)

        if (cached) {
          setFeeds((prev) => ({ ...prev, [source.id]: cached.feed }))
        }
      } finally {
        setLoading(false)
      }
    },
    [cache],
  )

  useEffect(() => {
    if (selectedSource) {
      setVisibleCount(PAGE_SIZE)
      setActiveItem(null)
      fetchFeed(selectedSource)
    }
  }, [selectedSource, fetchFeed])

  useEffect(() => {
    saveTheme(theme)
  }, [theme])

  const markAsRead = useCallback(
    (itemId: string) => {
      setReadState((prev) => {
        const next = { ...prev, [itemId]: true }
        saveReadState(next)
        return next
      })
    },
    [],
  )

  const markAllAsRead = useCallback(() => {
    if (!currentFeed) return
    setReadState((prev) => {
      const next = { ...prev }
      currentFeed.items.forEach((item) => {
        next[item.id] = true
      })
      saveReadState(next)
      return next
    })
  }, [currentFeed])

  const toggleFavorite = useCallback((item: RssItem) => {
    setFavorites((prev) => {
      const next = { ...prev }
      if (next[item.id]) {
        delete next[item.id]
      } else {
        next[item.id] = item
      }
      saveFavorites(next)
      return next
    })
  }, [])

  const isFavorite = useCallback(
    (itemId: string) => !!favorites[itemId],
    [favorites],
  )

  const isRead = useCallback(
    (itemId: string) => !!readState[itemId],
    [readState],
  )

  const handleItemClick = useCallback(
    (item: RssItem) => {
      setActiveItem(item)
      markAsRead(item.id)
    },
    [markAsRead],
  )

  const handleScroll = useCallback(() => {
    const el = scrollRef.current
    if (!el) return
    if (el.scrollTop + el.clientHeight >= el.scrollHeight - 100) {
      if (hasMore) {
        setVisibleCount((prev) => prev + PAGE_SIZE)
      }
    }
  }, [hasMore])

  const addSource = useCallback(() => {
    const name = newName.trim()
    const url = newUrl.trim()
    if (!url) {
      setError('请输入订阅地址（URL）')
      return
    }
    let normalized = url
    if (!/^https?:\/\//i.test(normalized)) {
      normalized = 'https://' + normalized
    }
    try {
      new URL(normalized)
    } catch {
      setError('订阅地址无效，请检查 URL 格式')
      return
    }
    const nextList = [
      ...userSources,
      { id: genSourceId(), name: name || normalized, url: normalized },
    ]
    setUserSources(nextList)
    saveSources(nextList)
    setNewName('')
    setNewUrl('')
    setShowAdd(false)
    setError(null)
  }, [newName, newUrl, userSources])

  const removeSource = useCallback(
    (id: string) => {
      const nextList = userSources.filter((s) => s.id !== id)
      setUserSources(nextList)
      saveSources(nextList)
      if (selectedId === id) {
        setSelectedId(BUILTIN_SOURCES[0].id)
      }
    },
    [userSources, selectedId],
  )

  const unreadCount = useMemo(() => {
    if (!currentFeed) return 0
    return currentFeed.items.filter((item) => !readState[item.id]).length
  }, [currentFeed, readState])

  const totalUnreadCount = useMemo(() => {
    return allFeedItems.filter((item) => !readState[item.id]).length
  }, [allFeedItems, readState])

  const favCount = Object.keys(favorites).length

  return (
    <div
      style={{
        height: '100%',
        width: '100%',
        display: 'flex',
        flexDirection: 'column',
        background: t.bg,
        color: t.textPrimary,
        fontFamily:
          '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif',
        boxSizing: 'border-box',
      }}
    >
      <div
        style={{
          padding: '12px 20px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: 12,
          borderBottom: `1px solid ${t.borderColor}`,
          background: t.headerBg,
          flexWrap: 'wrap',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div
            style={{
              width: 32,
              height: 32,
              borderRadius: 8,
              background: 'linear-gradient(135deg, #f97316 0%, #ef4444 100%)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#fff',
              fontWeight: 700,
              fontSize: 14,
              flexShrink: 0,
            }}
          >
            📰
          </div>
          <div>
            <div style={{ fontSize: 16, fontWeight: 700, color: t.textPrimary }}>
              Smart RSS Reader
            </div>
            <div style={{ fontSize: 11, color: t.textSecondary }}>
              智能 RSS 阅读器 · 支持离线缓存
            </div>
          </div>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <input
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="🔍 搜索文章..."
            style={{
              width: 280,
              padding: '8px 12px',
              background: t.inputBg,
              border: `1px solid ${t.inputBorder}`,
              borderRadius: 8,
              color: t.textPrimary,
              fontSize: 13,
              outline: 'none',
            }}
          />
          <button
            onClick={() => {
              if (selectedSource) fetchFeed(selectedSource, true)
            }}
            disabled={loading}
            style={{
              padding: '8px 14px',
              background: loading ? t.textTertiary : t.accentPrimary,
              color: '#fff',
              border: 'none',
              borderRadius: 8,
              cursor: loading ? 'default' : 'pointer',
              fontSize: 13,
              fontWeight: 600,
            }}
          >
            {loading ? '加载中...' : '🔄 刷新'}
          </button>
          <button
            onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
            style={{
              padding: '8px 12px',
              background: t.cardBg,
              color: t.textPrimary,
              border: `1px solid ${t.borderColor}`,
              borderRadius: 8,
              cursor: 'pointer',
              fontSize: 14,
            }}
            title={theme === 'dark' ? '切换到浅色主题' : '切换到深色主题'}
          >
            {theme === 'dark' ? '☀️' : '🌙'}
          </button>
        </div>
      </div>

      <div style={{ flex: 1, display: 'flex', minHeight: 0 }}>
        <div
          style={{
            width: 280,
            flexShrink: 0,
            borderRight: `1px solid ${t.borderColor}`,
            display: 'flex',
            flexDirection: 'column',
            background: t.bgSecondary,
          }}
        >
          <div
            style={{
              display: 'flex',
              borderBottom: `1px solid ${t.borderColor}`,
            }}
          >
            {(['sources', 'favorites', 'history'] as const).map((tab) => (
              <button
                key={tab}
                onClick={() => {
                  setActiveSourceTab(tab)
                  setVisibleCount(PAGE_SIZE)
                }}
                style={{
                  flex: 1,
                  padding: '10px 8px',
                  background:
                    activeSourceTab === tab ? t.cardBg : 'transparent',
                  border: 'none',
                  borderBottom:
                    activeSourceTab === tab
                      ? `2px solid ${t.accentPrimary}`
                      : '2px solid transparent',
                  color:
                    activeSourceTab === tab
                      ? t.accentPrimary
                      : t.textSecondary,
                  fontSize: 12,
                  fontWeight: 600,
                  cursor: 'pointer',
                  transition: 'all 0.15s',
                }}
              >
                {tab === 'sources' && '📡 源'}
                {tab === 'favorites' && `⭐ 收藏 (${favCount})`}
                {tab === 'history' && `📖 历史 (${Object.keys(readState).length})`}
              </button>
            ))}
          </div>

          {activeSourceTab === 'sources' && (
            <>
              <div
                style={{
                  padding: 12,
                  borderBottom: `1px solid ${t.borderColor}`,
                }}
              >
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    marginBottom: 8,
                  }}
                >
                  <span
                    style={{
                      fontSize: 11,
                      color: t.textSecondary,
                      fontWeight: 600,
                      letterSpacing: 0.5,
                      textTransform: 'uppercase',
                    }}
                  >
                    热门源
                  </span>
                  <span
                    style={{
                      fontSize: 10,
                      color: t.textTertiary,
                    }}
                  >
                    {totalUnreadCount} 未读
                  </span>
                </div>
                {BUILTIN_SOURCES.map((s) => (
                  <SourceRow
                    key={s.id}
                    source={s}
                    active={selectedId === s.id}
                    unreadCount={
                      feeds[s.id]?.items.filter(
                        (it) => !readState[it.id],
                      ).length || 0
                    }
                    onClick={() => setSelectedId(s.id)}
                    theme={t}
                  />
                ))}
              </div>

              <div
                style={{
                  flex: 1,
                  padding: 12,
                  overflowY: 'auto',
                }}
              >
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    marginBottom: 8,
                  }}
                >
                  <span
                    style={{
                      fontSize: 11,
                      color: t.textSecondary,
                      fontWeight: 600,
                      letterSpacing: 0.5,
                      textTransform: 'uppercase',
                    }}
                  >
                    我的源 ({userSources.length})
                  </span>
                  <button
                    onClick={() => setShowAdd((v) => !v)}
                    style={{
                      background: 'transparent',
                      border: `1px solid ${t.accentPrimary}`,
                      color: t.accentSecondary,
                      padding: '3px 8px',
                      borderRadius: 6,
                      cursor: 'pointer',
                      fontSize: 11,
                      fontWeight: 600,
                    }}
                  >
                    {showAdd ? '取消' : '+ 添加'}
                  </button>
                </div>

                {showAdd && (
                  <div
                    style={{
                      background: t.cardBg,
                      border: `1px solid ${t.borderColor}`,
                      borderRadius: 8,
                      padding: 10,
                      marginBottom: 12,
                      display: 'flex',
                      flexDirection: 'column',
                      gap: 8,
                    }}
                  >
                    <input
                      placeholder="订阅名称（可选）"
                      value={newName}
                      onChange={(e) => setNewName(e.target.value)}
                      style={inputStyle(t)}
                    />
                    <input
                      placeholder="RSS / Atom URL"
                      value={newUrl}
                      onChange={(e) => setNewUrl(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') addSource()
                      }}
                      style={inputStyle(t)}
                    />
                    <button
                      onClick={addSource}
                      style={{
                        padding: '8px 12px',
                        background: t.accentPrimary,
                        color: '#fff',
                        border: 'none',
                        borderRadius: 6,
                        fontSize: 13,
                        fontWeight: 600,
                        cursor: 'pointer',
                      }}
                    >
                      保存订阅
                    </button>
                  </div>
                )}

                {userSources.length === 0 && !showAdd && (
                  <div
                    style={{
                      fontSize: 12,
                      color: t.textTertiary,
                      padding: '10px 4px',
                      lineHeight: 1.6,
                    }}
                  >
                    暂无自定义订阅。点击「+ 添加」保存新的 RSS 地址。
                  </div>
                )}

                {userSources.map((s) => (
                  <UserSourceRow
                    key={s.id}
                    source={s}
                    active={selectedId === s.id}
                    unreadCount={
                      feeds[s.id]?.items.filter(
                        (it) => !readState[it.id],
                      ).length || 0
                    }
                    onClick={() => setSelectedId(s.id)}
                    onRemove={() => removeSource(s.id)}
                    theme={t}
                  />
                ))}
              </div>
            </>
          )}

          {activeSourceTab === 'favorites' && (
            <div style={{ flex: 1, padding: 12, overflowY: 'auto' }}>
              <div
                style={{
                  fontSize: 11,
                  color: t.textSecondary,
                  fontWeight: 600,
                  marginBottom: 10,
                }}
              >
                收藏的文章 ({favCount})
              </div>
              {favCount === 0 ? (
                <div style={{ fontSize: 12, color: t.textTertiary, padding: 10 }}>
                  还没有收藏任何文章。在文章列表中点击 ⭐ 图标收藏。
                </div>
              ) : (
                Object.values(favorites).map((item) => (
                  <div
                    key={item.id}
                    onClick={() => handleItemClick(item)}
                    style={{
                      padding: '8px 10px',
                      borderRadius: 6,
                      cursor: 'pointer',
                      background: t.cardBg,
                      marginBottom: 4,
                      border: `1px solid ${t.borderColor}`,
                    }}
                  >
                    <div
                      style={{
                        fontSize: 12,
                        fontWeight: 600,
                        color: t.textPrimary,
                        lineHeight: 1.4,
                        marginBottom: 4,
                      }}
                    >
                      {item.title}
                    </div>
                    <div style={{ fontSize: 10, color: t.textTertiary }}>
                      {formatDate(item.pubDate)}
                    </div>
                  </div>
                ))
              )}
            </div>
          )}

          {activeSourceTab === 'history' && (
            <div style={{ flex: 1, padding: 12, overflowY: 'auto' }}>
              <div
                style={{
                  fontSize: 11,
                  color: t.textSecondary,
                  fontWeight: 600,
                  marginBottom: 10,
                }}
              >
                阅读历史 ({Object.keys(readState).length})
              </div>
              {Object.keys(readState).length === 0 ? (
                <div style={{ fontSize: 12, color: t.textTertiary, padding: 10 }}>
                  还没有阅读历史。点击文章即会自动标记为已读。
                </div>
              ) : (
                allFeedItems
                  .filter((item) => readState[item.id])
                  .slice(0, 50)
                  .map((item) => (
                    <div
                      key={item.id}
                      onClick={() => handleItemClick(item)}
                      style={{
                        padding: '8px 10px',
                        borderRadius: 6,
                        cursor: 'pointer',
                        background: t.cardBg,
                        marginBottom: 4,
                        border: `1px solid ${t.borderColor}`,
                      }}
                    >
                      <div
                        style={{
                          fontSize: 12,
                          fontWeight: 600,
                          color: t.textPrimary,
                          lineHeight: 1.4,
                          marginBottom: 4,
                        }}
                      >
                        {item.title}
                      </div>
                      <div style={{ fontSize: 10, color: t.textTertiary }}>
                        {formatDate(item.pubDate)}
                      </div>
                    </div>
                  ))
              )}
            </div>
          )}

          <div
            style={{
              padding: '10px 14px',
              fontSize: 10,
              color: t.textTertiary,
              borderTop: `1px solid ${t.borderColor}`,
              lineHeight: 1.5,
            }}
          >
            数据保存于浏览器 localStorage
            <br />
            缓存 30 分钟 · 支持离线阅读
          </div>
        </div>

        <div
          style={{
            width: 420,
            flexShrink: 0,
            borderRight: `1px solid ${t.borderColor}`,
            display: 'flex',
            flexDirection: 'column',
            background: t.bgTertiary,
            minWidth: 0,
          }}
        >
          <div
            style={{
              padding: '12px 16px',
              borderBottom: `1px solid ${t.borderColor}`,
              minHeight: 60,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
            }}
          >
            <div
              style={{
                fontSize: 14,
                fontWeight: 700,
                color: t.textPrimary,
                whiteSpace: 'nowrap',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
              }}
            >
              {activeSourceTab === 'favorites'
                ? '⭐ 收藏夹'
                : activeSourceTab === 'history'
                  ? '📖 阅读历史'
                  : currentFeed
                    ? currentFeed.title
                    : selectedSource?.name || '加载中...'}
            </div>
            <div style={{ display: 'flex', gap: 8 }}>
              {activeSourceTab === 'sources' && currentFeed && (
                <>
                  {unreadCount > 0 && (
                    <button
                      onClick={markAllAsRead}
                      style={{
                        padding: '4px 10px',
                        background: 'transparent',
                        border: `1px solid ${t.borderColor}`,
                        borderRadius: 6,
                        color: t.textSecondary,
                        fontSize: 11,
                        cursor: 'pointer',
                      }}
                    >
                      全部已读
                    </button>
                  )}
                  <div
                    style={{
                      fontSize: 11,
                      color: t.textTertiary,
                    }}
                  >
                    {currentFeed.items.length} 篇
                  </div>
                </>
              )}
            </div>
          </div>

          <div
            ref={scrollRef}
            onScroll={handleScroll}
            style={{ flex: 1, overflowY: 'auto', padding: '6px 6px 14px' }}
          >
            {error && (
              <div
                style={{
                  margin: '10px 8px',
                  padding: 12,
                  borderRadius: 8,
                  background:
                    theme === 'dark'
                      ? 'rgba(239,68,68,0.12)'
                      : 'rgba(239,68,68,0.08)',
                  border: '1px solid rgba(239,68,68,0.35)',
                  color: theme === 'dark' ? '#fca5a5' : '#991b1b',
                  fontSize: 12,
                  lineHeight: 1.6,
                }}
              >
                <div style={{ fontWeight: 700, marginBottom: 4 }}>
                  ⚠️ 无法加载此订阅
                </div>
                {error}
              </div>
            )}

            {loading && (
              <div
                style={{
                  textAlign: 'center',
                  padding: '60px 20px',
                  color: t.textSecondary,
                  fontSize: 13,
                }}
              >
                <div style={{ fontSize: 28, marginBottom: 10 }}>📡</div>
                正在获取订阅...
              </div>
            )}

            {!loading &&
              !error &&
              paginatedItems.length === 0 && (
                <div
                  style={{
                    textAlign: 'center',
                    padding: '60px 20px',
                    color: t.textSecondary,
                    fontSize: 13,
                  }}
                >
                  {searchQuery.trim()
                    ? '没有找到匹配的文章'
                    : activeSourceTab === 'favorites'
                      ? '还没有收藏文章'
                      : activeSourceTab === 'history'
                        ? '还没有阅读历史'
                        : '此订阅暂无文章'}
                </div>
              )}

            {!loading &&
              !error &&
              paginatedItems.map((it) => {
                const isActive = activeItem?.id === it.id
                const read = isRead(it.id)
                const fav = isFavorite(it.id)
                return (
                  <ArticleCard
                    key={it.id}
                    item={it}
                    isActive={isActive}
                    isRead={read}
                    isFavorite={fav}
                    onClick={() => handleItemClick(it)}
                    onToggleFavorite={(e) => {
                      e.stopPropagation()
                      toggleFavorite(it)
                    }}
                    theme={t}
                  />
                )
              })}

            {!loading && !error && hasMore && (
              <div
                style={{
                  textAlign: 'center',
                  padding: '12px',
                  color: t.textTertiary,
                  fontSize: 12,
                }}
              >
                向下滚动加载更多...
              </div>
            )}

            {!loading && !error && !hasMore && displayedItems.length > PAGE_SIZE && (
              <div
                style={{
                  textAlign: 'center',
                  padding: '12px',
                  color: t.textTertiary,
                  fontSize: 11,
                }}
              >
                已加载全部 {displayedItems.length} 篇文章
              </div>
            )}
          </div>
        </div>

        <div
          style={{
            flex: 1,
            display: 'flex',
            flexDirection: 'column',
            overflow: 'hidden',
            minWidth: 0,
          }}
        >
          <div
            style={{
              padding: '12px 20px',
              borderBottom: `1px solid ${t.borderColor}`,
              fontSize: 12,
              color: t.textSecondary,
              fontWeight: 600,
              letterSpacing: 0.5,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
            }}
          >
            <span>文章详情</span>
            {activeItem && (
              <div style={{ display: 'flex', gap: 12 }}>
                <button
                  onClick={() => toggleFavorite(activeItem)}
                  style={{
                    background: 'transparent',
                    border: 'none',
                    cursor: 'pointer',
                    fontSize: 16,
                    color: isFavorite(activeItem.id)
                      ? t.favoriteActive
                      : t.textTertiary,
                  }}
                  title={isFavorite(activeItem.id) ? '取消收藏' : '收藏文章'}
                >
                  {isFavorite(activeItem.id) ? '⭐' : '☆'}
                </button>
                {activeItem.link && (
                  <a
                    href={activeItem.link}
                    target="_blank"
                    rel="noopener noreferrer"
                    style={{
                      color: t.accentInfo,
                      textDecoration: 'none',
                      fontSize: 12,
                    }}
                  >
                    原文 ↗
                  </a>
                )}
              </div>
            )}
          </div>
          <div style={{ flex: 1, overflowY: 'auto', padding: 20 }}>
            {activeItem ? (
              <div style={{ maxWidth: 820 }}>
                <h1
                  style={{
                    fontSize: 22,
                    fontWeight: 700,
                    color: t.textPrimary,
                    lineHeight: 1.3,
                    marginBottom: 12,
                  }}
                >
                  {activeItem.title || '(无标题)'}
                </h1>
                <div
                  style={{
                    fontSize: 12,
                    color: t.textSecondary,
                    display: 'flex',
                    gap: 16,
                    alignItems: 'center',
                    marginBottom: 20,
                    flexWrap: 'wrap',
                  }}
                >
                  <span>🕒 {formatDate(activeItem.pubDate)}</span>
                  {activeItem.author && (
                    <span>✍️ {activeItem.author}</span>
                  )}
                  {activeItem.category && activeItem.category.length > 0 && (
                    <span>
                      🏷️ {activeItem.category.slice(0, 3).join(' · ')}
                    </span>
                  )}
                </div>

                <div
                  style={{
                    fontSize: 15,
                    color: t.textPrimary,
                    lineHeight: 1.8,
                    background: t.cardBg,
                    padding: '20px 22px',
                    borderRadius: 10,
                    border: `1px solid ${t.borderColor}`,
                    wordBreak: 'break-word',
                  }}
                  dangerouslySetInnerHTML={{
                    __html:
                      sanitizeHtml(activeItem.content || activeItem.description) ||
                      `<em style="color:${t.textTertiary}">（该文章无正文内容）</em>`,
                  }}
                />
              </div>
            ) : (
              <div
                style={{
                  height: '100%',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: t.textTertiary,
                  textAlign: 'center',
                  gap: 14,
                }}
              >
                <div style={{ fontSize: 64, opacity: 0.4 }}>📖</div>
                <div style={{ fontSize: 15, color: t.textSecondary }}>
                  {activeSourceTab === 'favorites'
                    ? '从收藏夹选择一篇文章'
                    : activeSourceTab === 'history'
                      ? '从历史记录选择一篇文章'
                      : '从左侧选择一个源，然后点击文章查看详情'}
                </div>
                <div
                  style={{
                    fontSize: 12,
                    color: t.textMuted,
                    maxWidth: 420,
                    lineHeight: 1.7,
                  }}
                >
                  支持 RSS 2.0 / Atom / RSS 1.0 格式；
                  所有网络请求经由多个 CORS 代理转发，支持离线缓存阅读。
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

function inputStyle(t: typeof darkTheme) {
  return {
    padding: '8px 10px',
    background: t.inputBg,
    border: `1px solid ${t.inputBorder}`,
    borderRadius: 6,
    color: t.textPrimary,
    fontSize: 12,
    outline: 'none',
  }
}

interface SourceRowProps {
  source: RssSource
  active: boolean
  unreadCount: number
  onClick: () => void
  theme: typeof darkTheme
}

function SourceRow({ source, active, unreadCount, onClick, theme }: SourceRowProps) {
  return (
    <div
      onClick={onClick}
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: 10,
        padding: '8px 10px',
        borderRadius: 6,
        cursor: 'pointer',
        background: active
          ? theme === darkTheme
            ? 'linear-gradient(90deg, rgba(249,115,22,0.2), rgba(249,115,22,0.05))'
            : 'linear-gradient(90deg, rgba(249,115,22,0.15), rgba(249,115,22,0.03))'
          : 'transparent',
        border: active
          ? `1px solid ${theme.borderActive}`
          : '1px solid transparent',
        marginBottom: 3,
        transition: 'background 0.15s',
      }}
      onMouseEnter={(e) => {
        if (!active) e.currentTarget.style.background = 'rgba(148,163,184,0.08)'
      }}
      onMouseLeave={(e) => {
        if (!active) e.currentTarget.style.background = 'transparent'
      }}
    >
      <div
        style={{
          width: 20,
          height: 20,
          borderRadius: 5,
          background: source.favicon
            ? `${source.favicon}33`
            : 'radial-gradient(circle at 30% 30%, #fb923c 0%, #ef4444 80%)',
          flexShrink: 0,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontSize: 12,
        }}
      >
        {source.favicon || '📰'}
      </div>
      <div style={{ minWidth: 0, flex: 1 }}>
        <div
          style={{
            fontSize: 13,
            fontWeight: 600,
            color: active ? theme.accentSecondary : theme.textPrimary,
            whiteSpace: 'nowrap',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
          }}
        >
          {source.name}
        </div>
      </div>
      {unreadCount > 0 && (
        <span
          style={{
            minWidth: 18,
            height: 18,
            padding: '0 5px',
            borderRadius: 9,
            background: theme.unreadDot,
            color: '#fff',
            fontSize: 10,
            fontWeight: 700,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          {unreadCount > 99 ? '99+' : unreadCount}
        </span>
      )}
    </div>
  )
}

interface UserSourceRowProps {
  source: RssSource
  active: boolean
  unreadCount: number
  onClick: () => void
  onRemove: () => void
  theme: typeof darkTheme
}

function UserSourceRow({
  source,
  active,
  unreadCount,
  onClick,
  onRemove,
  theme,
}: UserSourceRowProps) {
  return (
    <div
      onClick={onClick}
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: 8,
        padding: '8px 10px',
        borderRadius: 6,
        cursor: 'pointer',
        background: active
          ? theme === darkTheme
            ? 'linear-gradient(90deg, rgba(249,115,22,0.2), rgba(249,115,22,0.05))'
            : 'linear-gradient(90deg, rgba(249,115,22,0.15), rgba(249,115,22,0.03))'
          : 'transparent',
        border: active
          ? `1px solid ${theme.borderActive}`
          : '1px solid transparent',
        marginBottom: 4,
        transition: 'background 0.15s',
      }}
      onMouseEnter={(e) => {
        if (!active) e.currentTarget.style.background = 'rgba(148,163,184,0.08)'
      }}
      onMouseLeave={(e) => {
        if (!active) e.currentTarget.style.background = 'transparent'
      }}
    >
      <div style={{ minWidth: 0, flex: 1 }}>
        <div
          style={{
            fontSize: 13,
            fontWeight: 600,
            color: theme.textPrimary,
            whiteSpace: 'nowrap',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
          }}
        >
          {source.name}
        </div>
        <div
          style={{
            fontSize: 10,
            color: theme.textTertiary,
            marginTop: 2,
            whiteSpace: 'nowrap',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
          }}
        >
          {source.url}
        </div>
      </div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
        {unreadCount > 0 && (
          <span
            style={{
              minWidth: 18,
              height: 18,
              padding: '0 5px',
              borderRadius: 9,
              background: theme.unreadDot,
              color: '#fff',
              fontSize: 10,
              fontWeight: 700,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            {unreadCount > 99 ? '99+' : unreadCount}
          </span>
        )}
        <button
          onClick={(e) => {
            e.stopPropagation()
            if (confirm(`删除订阅「${source.name}」？`)) onRemove()
          }}
          style={{
            background: 'transparent',
            border: 'none',
            color: theme.textTertiary,
            fontSize: 14,
            cursor: 'pointer',
            padding: '2px 4px',
          }}
          title="删除"
        >
          ×
        </button>
      </div>
    </div>
  )
}

interface ArticleCardProps {
  item: RssItem
  isActive: boolean
  isRead: boolean
  isFavorite: boolean
  onClick: () => void
  onToggleFavorite: (e: React.MouseEvent) => void
  theme: typeof darkTheme
}

function ArticleCard({
  item,
  isActive,
  isRead,
  isFavorite,
  onClick,
  onToggleFavorite,
  theme,
}: ArticleCardProps) {
  return (
    <div
      onClick={onClick}
      style={{
        padding: '12px 14px',
        margin: '4px 2px',
        borderRadius: 8,
        cursor: 'pointer',
        border: '1px solid',
        borderColor: isActive
          ? theme.borderActive
          : theme.borderColor,
        background: isActive
          ? theme === darkTheme
            ? 'linear-gradient(135deg, rgba(249,115,22,0.12), rgba(239,68,68,0.06))'
            : 'linear-gradient(135deg, rgba(249,115,22,0.1), rgba(239,68,68,0.04))'
          : theme.cardBg,
        transition: 'background 0.15s, border-color 0.15s',
        opacity: isRead ? theme.readOpacity : 1,
        position: 'relative',
      }}
      onMouseEnter={(e) => {
        if (!isActive) {
          e.currentTarget.style.background = theme.cardBgHover
        }
      }}
      onMouseLeave={(e) => {
        if (!isActive) {
          e.currentTarget.style.background = theme.cardBg
        }
      }}
    >
      {!isRead && (
        <div
          style={{
            position: 'absolute',
            left: 6,
            top: 14,
            width: 6,
            height: 6,
            borderRadius: 3,
            background: theme.unreadDot,
          }}
        />
      )}
      <div
        style={{
          display: 'flex',
          alignItems: 'flex-start',
          justifyContent: 'space-between',
          gap: 8,
        }}
      >
        <div
          style={{
            fontSize: 14,
            fontWeight: 600,
            color: theme.textPrimary,
            lineHeight: 1.4,
            marginBottom: 6,
            flex: 1,
          }}
        >
          {item.title || '(无标题)'}
        </div>
        <button
          onClick={onToggleFavorite}
          style={{
            background: 'transparent',
            border: 'none',
            cursor: 'pointer',
            fontSize: 14,
            color: isFavorite ? theme.favoriteActive : theme.textTertiary,
            padding: '2px 4px',
            flexShrink: 0,
          }}
          title={isFavorite ? '取消收藏' : '收藏'}
        >
          {isFavorite ? '⭐' : '☆'}
        </button>
      </div>
      <div
        style={{
          fontSize: 12,
          color: theme.textSecondary,
          lineHeight: 1.5,
          marginBottom: 8,
          display: '-webkit-box',
          WebkitLineClamp: 2,
          WebkitBoxOrient: 'vertical',
          overflow: 'hidden',
          paddingLeft: isRead ? 0 : 10,
        }}
      >
        {truncate(item.description, 140)}
      </div>
      <div
        style={{
          fontSize: 11,
          color: theme.textTertiary,
          display: 'flex',
          gap: 12,
          alignItems: 'center',
          paddingLeft: isRead ? 0 : 10,
        }}
      >
        <span>🕒 {formatDate(item.pubDate)}</span>
        {item.author && <span>✍️ {item.author}</span>}
        {item.link && (
          <a
            href={item.link}
            target="_blank"
            rel="noopener noreferrer"
            onClick={(e) => e.stopPropagation()}
            style={{
              color: theme.accentInfo,
              textDecoration: 'none',
              marginLeft: 'auto',
            }}
          >
            原文 ↗
          </a>
        )}
      </div>
    </div>
  )
}