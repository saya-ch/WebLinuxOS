import { useState, useEffect, useCallback, useMemo, useRef } from 'react'

// ─── Types ───────────────────────────────────────────────────────────────────

interface FeedSource {
  id: string
  name: string
  url: string
  category: FeedCategory
  favicon?: string
  isBuiltin?: boolean
}

type FeedCategory = 'Tech' | 'Science' | 'News' | 'Dev' | 'Custom'

interface RssItem {
  id: string
  title: string
  link: string
  description: string
  content: string
  pubDate: string
  author?: string
  category?: string[]
  sourceId: string
  sourceName: string
  sourceFavicon?: string
}

interface RssFeed {
  title: string
  description: string
  link: string
  items: RssItem[]
  sourceUrl: string
}

interface ReadState { [itemId: string]: boolean }
interface StarState { [itemId: string]: RssItem }
interface CachedFeed {
  sourceUrl: string
  feed: RssFeed
  timestamp: number
}

type ViewMode = 'list' | 'reader'
type SortMode = 'date' | 'source' | 'unread'

// ─── Constants ───────────────────────────────────────────────────────────────

const ST_SOURCES = 'rss-agg-sources-v2'
const ST_READ = 'rss-agg-read-v2'
const ST_STAR = 'rss-agg-star-v2'
const ST_CACHE = 'rss-agg-cache-v2'
const CACHE_TTL = 30 * 60 * 1000
const DEFAULT_REFRESH = 15

const PROXY_URLS = [
  (url: string) => `https://api.allorigins.win/raw?url=${encodeURIComponent(url)}`,
  (url: string) => `https://corsproxy.io/?${encodeURIComponent(url)}`,
  (url: string) => `https://api.codetabs.com/v1/proxy/?quest=${encodeURIComponent(url)}`,
]

const BUILTIN_SOURCES: FeedSource[] = [
  { id: 'bn-hn', name: 'Hacker News', url: 'https://hnrss.org/frontpage', category: 'Dev', favicon: '🟠', isBuiltin: true },
  { id: 'bn-tc', name: 'TechCrunch', url: 'https://techcrunch.com/feed/', category: 'Tech', favicon: '🟢', isBuiltin: true },
  { id: 'bn-ars', name: 'Ars Technica', url: 'https://feeds.arstechnica.com/arstechnica/index', category: 'Tech', favicon: '🔴', isBuiltin: true },
  { id: 'bn-verge', name: 'The Verge', url: 'https://www.theverge.com/rss/index.xml', category: 'Tech', favicon: '🔵', isBuiltin: true },
  { id: 'bn-devto', name: 'Dev.to', url: 'https://dev.to/feed', category: 'Dev', favicon: '🟣', isBuiltin: true },
  { id: 'bn-lob', name: 'Lobsters', url: 'https://lobste.rs/rss', category: 'Dev', favicon: '🦞', isBuiltin: true },
  { id: 'bn-reddit', name: 'Reddit Programming', url: 'https://www.reddit.com/r/programming/.rss', category: 'Dev', favicon: '🟠', isBuiltin: true },
  { id: 'bn-bbc', name: 'BBC Tech', url: 'https://feeds.bbci.co.uk/news/technology/rss.xml', category: 'News', favicon: '🔴', isBuiltin: true },
  { id: 'bn-mit', name: 'MIT Tech Review', url: 'https://www.technologyreview.com/feed/', category: 'Science', favicon: '⚪', isBuiltin: true },
]

const CATEGORIES: { id: FeedCategory | 'All'; icon: string }[] = [
  { id: 'All', icon: '📰' },
  { id: 'Tech', icon: '💻' },
  { id: 'Science', icon: '🔬' },
  { id: 'News', icon: '🌍' },
  { id: 'Dev', icon: '🧑‍💻' },
  { id: 'Custom', icon: '⭐' },
]

// ─── Helpers ─────────────────────────────────────────────────────────────────

function genId(): string {
  return Math.random().toString(36).slice(2, 10) + Date.now().toString(36)
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
  if (diff < 60) return `${Math.floor(diff)}秒前`
  if (diff < 3600) return `${Math.floor(diff / 60)}分钟前`
  if (diff < 86400) return `${Math.floor(diff / 3600)}小时前`
  if (diff < 86400 * 7) return `${Math.floor(diff / 86400)}天前`
  return d.toLocaleDateString('zh-CN')
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

function parseRssXml(xmlText: string, sourceUrl: string, sourceId: string, sourceName: string, sourceFavicon?: string): RssFeed {
  const parser = new DOMParser()
  const doc = parser.parseFromString(xmlText, 'text/xml')
  const parseError = doc.querySelector('parsererror')
  if (parseError) {
    throw new Error('XML 解析失败：源可能不是有效的 RSS/Atom 订阅')
  }

  let channelTitle = ''
  let channelDesc = ''
  let channelLink = ''
  const items: RssItem[] = []

  // RSS 2.0
  const channel = doc.querySelector('rss > channel')
  if (channel) {
    channelTitle = textContent(channel.querySelector(':scope > title'))
    channelDesc = textContent(channel.querySelector(':scope > description'))
    channelLink = textContent(channel.querySelector(':scope > link'))
    const entries = channel.querySelectorAll(':scope > item')
    entries.forEach((node) => {
      const title = textContent(node.querySelector(':scope > title'))
      const link = textContent(node.querySelector(':scope > link'))
      const description = textContent(node.querySelector(':scope > description')) || ''
      const content = textContent(node.querySelector(':scope > content\\:encoded')) || description
      const pubDate = textContent(node.querySelector(':scope > pubDate')) || textContent(node.querySelector(':scope > dc\\:date'))
      const author = textContent(node.querySelector(':scope > author')) || textContent(node.querySelector(':scope > dc\\:creator'))
      const categories = Array.from(node.querySelectorAll(':scope > category')).map(c => c.textContent || '').filter(Boolean)
      if (title || link) {
        items.push({ id: link || genId(), title, link, description, content, pubDate, author, category: categories, sourceId, sourceName, sourceFavicon })
      }
    })
    if (items.length > 0) return { title: channelTitle || '未知订阅', description: channelDesc, link: channelLink, items, sourceUrl }
  }

  // Atom
  const feed = doc.querySelector('feed')
  if (feed) {
    channelTitle = textContent(feed.querySelector(':scope > title'))
    const linkEl = feed.querySelector(':scope > link[href]')
    channelLink = linkEl?.getAttribute('href') || ''
    channelDesc = textContent(feed.querySelector(':scope > subtitle')) || textContent(feed.querySelector(':scope > summary'))
    const entries = feed.querySelectorAll(':scope > entry')
    entries.forEach((node) => {
      const title = textContent(node.querySelector(':scope > title'))
      const linkNode = node.querySelector(':scope > link[href]')
      const link = linkNode?.getAttribute('href') || ''
      const description = textContent(node.querySelector(':scope > summary')) || ''
      const content = textContent(node.querySelector(':scope > content')) || description
      const pubDate = textContent(node.querySelector(':scope > updated')) || textContent(node.querySelector(':scope > published'))
      const author = textContent(node.querySelector(':scope > author > name'))
      if (title || link) {
        items.push({ id: link || genId(), title, link, description, content, pubDate, author, sourceId, sourceName, sourceFavicon })
      }
    })
    if (items.length > 0) return { title: channelTitle || '未知订阅', description: channelDesc, link: channelLink, items, sourceUrl }
  }

  // RDF
  const rdfItems = doc.querySelectorAll('item')
  if (rdfItems.length > 0) {
    rdfItems.forEach((node) => {
      const title = textContent(node.querySelector(':scope > title'))
      const link = textContent(node.querySelector(':scope > link'))
      const description = textContent(node.querySelector(':scope > description')) || ''
      const pubDate = textContent(node.querySelector(':scope > dc\\:date'))
      if (title || link) {
        items.push({ id: link || genId(), title, link, description, content: description, pubDate, sourceId, sourceName, sourceFavicon })
      }
    })
    if (items.length > 0) return { title: channelTitle || '未知订阅', description: '', link: '', items, sourceUrl }
  }

  throw new Error('无法识别的 Feed 格式')
}

// ─── Styles ─────────────────────────────────────────────────────────────────

const colors = {
  bg: '#0f0f1a',
  bg2: '#1a1a2e',
  bg3: '#16213e',
  card: 'rgba(26, 26, 46, 0.8)',
  border: 'rgba(255,255,255,0.08)',
  text: '#e0e0e0',
  text2: '#8892b0',
  amber: '#f59e0b',
  red: '#ef4444',
  gradient: 'linear-gradient(135deg, #f59e0b 0%, #ef4444 100%)',
  gradient2: 'linear-gradient(135deg, #f59e0b22 0%, #ef444422 100%)',
}

// ─── Component ──────────────────────────────────────────────────────────────

export default function RSSAggregator() {
  // State
  const [sources, setSources] = useState<FeedSource[]>(() => {
    try { const s = localStorage.getItem(ST_SOURCES); return s ? JSON.parse(s) : BUILTIN_SOURCES } catch { return BUILTIN_SOURCES }
  })
  const [allItems, setAllItems] = useState<RssItem[]>([])
  const [readState, setReadState] = useState<ReadState>(() => {
    try { const s = localStorage.getItem(ST_READ); return s ? JSON.parse(s) : {} } catch { return {} }
  })
  const [starState, setStarState] = useState<StarState>(() => {
    try { const s = localStorage.getItem(ST_STAR); return s ? JSON.parse(s) : {} } catch { return {} }
  })
  const [cache, setCache] = useState<Record<string, CachedFeed>>(() => {
    try { const s = localStorage.getItem(ST_CACHE); return s ? JSON.parse(s) : {} } catch { return {} }
  })
  const [settings, setSettings] = useState({ refreshInterval: DEFAULT_REFRESH, useProxy: true, readability: false, autoRefresh: true })
  const [loading, setLoading] = useState<Record<string, boolean>>({})
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [selectedCategory, setSelectedCategory] = useState<FeedCategory | 'All'>('All')
  const [selectedSource, setSelectedSource] = useState<string | null>(null)
  const [viewMode, setViewMode] = useState<ViewMode>('list')
  const [readingItem, setReadingItem] = useState<RssItem | null>(null)
  const [searchQuery, setSearchQuery] = useState('')
  const [sortMode, setSortMode] = useState<SortMode>('date')
  const [showAddFeed, setShowAddFeed] = useState(false)
  const [newFeedUrl, setNewFeedUrl] = useState('')
  const [newFeedName, setNewFeedName] = useState('')
  const [newFeedCat, setNewFeedCat] = useState<FeedCategory>('Custom')
  const [showSettings, setShowSettings] = useState(false)
  const [filterUnread, setFilterUnread] = useState(false)
  const [filterStarred, setFilterStarred] = useState(false)
  const refreshTimerRef = useRef<ReturnType<typeof setInterval> | null>(null)

  // Persist
  useEffect(() => { localStorage.setItem(ST_SOURCES, JSON.stringify(sources)) }, [sources])
  useEffect(() => { localStorage.setItem(ST_READ, JSON.stringify(readState)) }, [readState])
  useEffect(() => { localStorage.setItem(ST_STAR, JSON.stringify(starState)) }, [starState])
  useEffect(() => {
    try { localStorage.setItem(ST_CACHE, JSON.stringify(cache)) } catch { /* localStorage full */ }
  }, [cache])

  // Fetch one feed
  const fetchFeed = useCallback(async (source: FeedSource) => {
    setLoading(prev => ({ ...prev, [source.id]: true }))
    setErrors(prev => { const n = { ...prev }; delete n[source.id]; return n })

    // Check cache
    const cached = cache[source.url]
    if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
      setAllItems(prev => {
        const others = prev.filter(i => i.sourceId !== source.id)
        return [...others, ...cached.feed.items].sort((a, b) => new Date(b.pubDate).getTime() - new Date(a.pubDate).getTime())
      })
      setLoading(prev => ({ ...prev, [source.id]: false }))
      return
    }

    const tryFetch = async (url: string): Promise<string> => {
      const res = await fetch(url, { headers: { 'Accept': 'text/xml, application/xml, application/rss+xml, application/atom+xml' } })
      if (!res.ok) throw new Error(`HTTP ${res.status}`)
      return res.text()
    }

    try {
      let xml = ''
      try {
        xml = await tryFetch(source.url)
      } catch {
        if (settings.useProxy) {
          let lastErr: Error | null = null
          for (const mkProxy of PROXY_URLS) {
            try {
              xml = await tryFetch(mkProxy(source.url))
              break
            } catch (e) {
              lastErr = e as Error
            }
          }
          if (!xml && lastErr) throw lastErr
        } else {
          throw new Error('CORS 被阻止，可在设置中启用代理')
        }
      }

      const feed = parseRssXml(xml, source.url, source.id, source.name, source.favicon)
      setCache(prev => ({ ...prev, [source.url]: { sourceUrl: source.url, feed, timestamp: Date.now() } }))
      setAllItems(prev => {
        const others = prev.filter(i => i.sourceId !== source.id)
        return [...others, ...feed.items].sort((a, b) => new Date(b.pubDate).getTime() - new Date(a.pubDate).getTime())
      })
    } catch (e) {
      const msg = (e as Error).message
      setErrors(prev => ({ ...prev, [source.id]: msg.includes('CORS') ? 'CORS 被阻止，请启用代理或使用支持跨域的源' : msg }))
    } finally {
      setLoading(prev => ({ ...prev, [source.id]: false }))
    }
  }, [cache, settings.useProxy])

  // Fetch all
  const fetchAll = useCallback(() => {
    sources.forEach(s => fetchFeed(s))
  }, [sources, fetchFeed])

  // Auto refresh
  useEffect(() => {
    if (refreshTimerRef.current) clearInterval(refreshTimerRef.current)
    if (settings.autoRefresh && settings.refreshInterval > 0) {
      refreshTimerRef.current = setInterval(fetchAll, settings.refreshInterval * 60 * 1000)
    }
    return () => { if (refreshTimerRef.current) clearInterval(refreshTimerRef.current) }
  }, [settings.autoRefresh, settings.refreshInterval, fetchAll])

  // Initial load
  useEffect(() => { fetchAll() }, []) // eslint-disable-line react-hooks/exhaustive-deps

  // Toggle read
  const toggleRead = useCallback((id: string) => {
    setReadState(prev => ({ ...prev, [id]: !prev[id] }))
  }, [])

  // Toggle star
  const toggleStar = useCallback((item: RssItem) => {
    setStarState(prev => {
      const n = { ...prev }
      if (n[item.id]) delete n[item.id]
      else n[item.id] = item
      return n
    })
  }, [])

  // Mark all read
  const markAllRead = useCallback(() => {
    setReadState(prev => {
      const n = { ...prev }
      filteredItems.forEach(i => { n[i.id] = true })
      return n
    })
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  // Add feed
  const addFeed = useCallback(() => {
    if (!newFeedUrl.trim()) return
    const src: FeedSource = {
      id: 'src-' + genId(),
      name: newFeedName.trim() || newFeedUrl.trim(),
      url: newFeedUrl.trim(),
      category: newFeedCat,
      isBuiltin: false,
    }
    setSources(prev => [...prev, src])
    setNewFeedUrl(''); setNewFeedName(''); setShowAddFeed(false)
    fetchFeed(src)
  }, [newFeedUrl, newFeedName, newFeedCat, fetchFeed])

  // Remove feed
  const removeFeed = useCallback((id: string) => {
    setSources(prev => prev.filter(s => s.id !== id))
    setAllItems(prev => prev.filter(i => i.sourceId !== id))
  }, [])

  // Filtered items
  const filteredItems = useMemo(() => {
    let items = allItems
    if (selectedCategory !== 'All') {
      const catSources = sources.filter(s => s.category === selectedCategory).map(s => s.id)
      items = items.filter(i => catSources.includes(i.sourceId))
    }
    if (selectedSource) {
      items = items.filter(i => i.sourceId === selectedSource)
    }
    if (searchQuery) {
      const q = searchQuery.toLowerCase()
      items = items.filter(i => i.title.toLowerCase().includes(q) || i.description.toLowerCase().includes(q))
    }
    if (filterUnread) items = items.filter(i => !readState[i.id])
    if (filterStarred) items = items.filter(i => starState[i.id])
    if (sortMode === 'source') items = [...items].sort((a, b) => a.sourceName.localeCompare(b.sourceName))
    if (sortMode === 'unread') items = [...items].sort((a, b) => (readState[a.id] ? 1 : 0) - (readState[b.id] ? 1 : 0))
    return items
  }, [allItems, selectedCategory, selectedSource, searchQuery, filterUnread, filterStarred, sortMode, readState, starState, sources])

  // Stats
  const unreadCount = useMemo(() => filteredItems.filter(i => !readState[i.id]).length, [filteredItems, readState])
  const starredCount = useMemo(() => Object.keys(starState).length, [starState])

  // Readability mode
  const renderContent = useCallback((item: RssItem): string => {
    if (settings.readability) {
      return `<div style="font-size:16px;line-height:1.8;color:#e0e0e0;max-width:680px;margin:0 auto;">${stripHtml(item.content || item.description)}</div>`
    }
    return `<div style="font-size:15px;line-height:1.7;color:#d0d0d0;max-width:680px;margin:0 auto;">${sanitizeHtml(item.content || item.description)}</div>`
  }, [settings.readability])

  // ─── Render ─────────────────────────────────────────────────────────────

  return (
    <div style={{ display: 'flex', height: '100%', background: colors.bg, color: colors.text, fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif' }}>
      {/* ── Left Sidebar ── */}
      <div style={{ width: 260, borderRight: `1px solid ${colors.border}`, display: 'flex', flexDirection: 'column', background: colors.bg2, flexShrink: 0 }}>
        {/* Header */}
        <div style={{ padding: '16px', borderBottom: `1px solid ${colors.border}` }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
            <div style={{ width: 32, height: 32, borderRadius: 8, background: colors.gradient, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 16 }}>📡</div>
            <div>
              <div style={{ fontWeight: 700, fontSize: 15 }}>RSS 聚合器</div>
              <div style={{ fontSize: 11, color: colors.text2 }}>{unreadCount} 未读 · {starredCount} 收藏</div>
            </div>
          </div>
          {/* Search */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, background: colors.bg, borderRadius: 6, padding: '6px 10px' }}>
            <span style={{ color: colors.text2, fontSize: 13 }}>🔍</span>
            <input value={searchQuery} onChange={e => setSearchQuery(e.target.value)} placeholder="搜索文章..." style={{ background: 'transparent', border: 'none', outline: 'none', color: colors.text, flex: 1, fontSize: 13 }} />
            {searchQuery && <span onClick={() => setSearchQuery('')} style={{ cursor: 'pointer', color: colors.text2, fontSize: 12 }}>✕</span>}
          </div>
        </div>

        {/* Categories */}
        <div style={{ padding: '10px 12px', borderBottom: `1px solid ${colors.border}` }}>
          <div style={{ fontSize: 11, color: colors.text2, marginBottom: 6, fontWeight: 600 }}>分类</div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4 }}>
            {CATEGORIES.map(cat => (
              <button key={cat.id} onClick={() => { setSelectedCategory(cat.id); setSelectedSource(null) }} style={{ padding: '3px 8px', borderRadius: 10, border: 'none', background: selectedCategory === cat.id ? colors.gradient2 : 'transparent', color: selectedCategory === cat.id ? colors.amber : colors.text2, cursor: 'pointer', fontSize: 11, transition: 'all 0.2s', display: 'flex', alignItems: 'center', gap: 3 }}>
                <span>{cat.icon}</span>
                <span>{cat.id}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Feed Sources */}
        <div style={{ flex: 1, overflow: 'auto', padding: '8px 10px' }}>
          <div style={{ fontSize: 11, color: colors.text2, marginBottom: 6, fontWeight: 600 }}>订阅源</div>
          {sources
            .filter(s => selectedCategory === 'All' || s.category === selectedCategory)
            .map(src => (
              <div key={src.id} onClick={() => { setSelectedSource(selectedSource === src.id ? null : src.id); setViewMode('list') }} style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '6px 8px', borderRadius: 6, cursor: 'pointer', background: selectedSource === src.id ? colors.gradient2 : 'transparent', marginBottom: 2, transition: 'all 0.15s' }}>
                <span style={{ fontSize: 14 }}>{src.favicon || '📋'}</span>
                <span style={{ flex: 1, fontSize: 12, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', color: selectedSource === src.id ? colors.amber : colors.text }}>{src.name}</span>
                {loading[src.id] && <span style={{ fontSize: 10, color: colors.amber }}>⟳</span>}
                {errors[src.id] && <span style={{ fontSize: 10, color: colors.red }}>⚠</span>}
                {!src.isBuiltin && <span onClick={e => { e.stopPropagation(); removeFeed(src.id) }} style={{ fontSize: 10, color: colors.text2, cursor: 'pointer', marginLeft: 2 }}>✕</span>}
              </div>
            ))}
        </div>

        {/* Actions */}
        <div style={{ padding: 10, borderTop: `1px solid ${colors.border}`, display: 'flex', flexDirection: 'column', gap: 6 }}>
          <button onClick={() => setShowAddFeed(true)} style={{ width: '100%', padding: '8px', borderRadius: 6, border: 'none', background: colors.gradient, color: '#fff', cursor: 'pointer', fontSize: 12, fontWeight: 600 }}>＋ 添加订阅</button>
          <div style={{ display: 'flex', gap: 6 }}>
            <button onClick={fetchAll} style={{ flex: 1, padding: 6, borderRadius: 6, border: `1px solid ${colors.border}`, background: 'transparent', color: colors.text2, cursor: 'pointer', fontSize: 11 }}>⟳ 刷新</button>
            <button onClick={() => setShowSettings(true)} style={{ flex: 1, padding: 6, borderRadius: 6, border: `1px solid ${colors.border}`, background: 'transparent', color: colors.text2, cursor: 'pointer', fontSize: 11 }}>⚙ 设置</button>
          </div>
        </div>
      </div>

      {/* ── Main Content ── */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
        {/* Toolbar */}
        <div style={{ padding: '10px 16px', borderBottom: `1px solid ${colors.border}`, display: 'flex', alignItems: 'center', gap: 10, background: colors.bg2 }}>
          {viewMode === 'reader' && (
            <button onClick={() => { setViewMode('list'); setReadingItem(null) }} style={{ padding: '4px 10px', borderRadius: 6, border: `1px solid ${colors.border}`, background: 'transparent', color: colors.text, cursor: 'pointer', fontSize: 12 }}>← 返回列表</button>
          )}
          <div style={{ flex: 1, fontSize: 13, color: colors.text2 }}>
            {viewMode === 'list' ? `${filteredItems.length} 篇文章` : readingItem?.title}
          </div>
          {viewMode === 'list' && (
            <>
              <button onClick={() => setFilterUnread(!filterUnread)} style={{ padding: '3px 8px', borderRadius: 10, border: 'none', background: filterUnread ? colors.amber : 'transparent', color: filterUnread ? '#000' : colors.text2, cursor: 'pointer', fontSize: 11 }}>未读</button>
              <button onClick={() => setFilterStarred(!filterStarred)} style={{ padding: '3px 8px', borderRadius: 10, border: 'none', background: filterStarred ? colors.red : 'transparent', color: filterStarred ? '#fff' : colors.text2, cursor: 'pointer', fontSize: 11 }}>★ 收藏</button>
              <select value={sortMode} onChange={e => setSortMode(e.target.value as SortMode)} style={{ padding: '3px 6px', borderRadius: 6, border: `1px solid ${colors.border}`, background: colors.bg, color: colors.text, fontSize: 11, cursor: 'pointer' }}>
                <option value="date">按日期</option>
                <option value="source">按来源</option>
                <option value="unread">未读优先</option>
              </select>
              <button onClick={markAllRead} style={{ padding: '3px 8px', borderRadius: 6, border: `1px solid ${colors.border}`, background: 'transparent', color: colors.text2, cursor: 'pointer', fontSize: 11 }}>全部已读</button>
            </>
          )}
          {viewMode === 'reader' && readingItem && (
            <>
              <button onClick={() => setSettings(p => ({ ...p, readability: !p.readability }))} style={{ padding: '3px 8px', borderRadius: 6, border: 'none', background: settings.readability ? colors.amber : 'transparent', color: settings.readability ? '#000' : colors.text2, cursor: 'pointer', fontSize: 11 }}>{settings.readability ? '📄 纯文本' : '📖 富文本'}</button>
              {readingItem.link && <a href={readingItem.link} target="_blank" rel="noopener noreferrer" style={{ padding: '3px 8px', borderRadius: 6, border: `1px solid ${colors.border}`, color: colors.text2, fontSize: 11, textDecoration: 'none' }}>↗ 原文</a>}
            </>
          )}
        </div>

        {/* Content */}
        <div style={{ flex: 1, overflow: 'auto' }}>
          {viewMode === 'list' ? (
            <div style={{ padding: 12 }}>
              {filteredItems.length === 0 ? (
                <div style={{ textAlign: 'center', padding: 48, color: colors.text2 }}>
                  <div style={{ fontSize: 36, marginBottom: 12 }}>📭</div>
                  <div>{allItems.length === 0 ? '正在加载文章...' : '没有匹配的文章'}</div>
                  {Object.keys(errors).length > 0 && (
                    <div style={{ marginTop: 16, fontSize: 12, textAlign: 'left', maxWidth: 400, margin: '16px auto 0' }}>
                      {Object.entries(errors).map(([id, msg]) => (
                        <div key={id} style={{ padding: '8px 12px', marginBottom: 6, borderRadius: 6, background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.2)' }}>
                          ⚠ {sources.find(s => s.id === id)?.name || id}: {msg}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              ) : (
                filteredItems.map(item => {
                  const isRead = readState[item.id]
                  const isStar = !!starState[item.id]
                  return (
                    <div key={item.id} onClick={() => { toggleRead(item.id); setReadingItem(item); setViewMode('reader') }} style={{ padding: '14px 16px', marginBottom: 8, borderRadius: 10, background: isRead ? 'rgba(26,26,46,0.4)' : colors.card, border: `1px solid ${isRead ? 'transparent' : 'rgba(245,158,11,0.15)'}`, cursor: 'pointer', transition: 'all 0.2s', backdropFilter: 'blur(8px)' }}>
                      <div style={{ display: 'flex', alignItems: 'flex-start', gap: 10 }}>
                        <div style={{ fontSize: 16, marginTop: 2 }}>{item.sourceFavicon || '📋'}</div>
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 4 }}>
                            <div style={{ flex: 1, fontWeight: isRead ? 400 : 600, fontSize: 14, color: isRead ? colors.text2 : colors.text, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{item.title}</div>
                            <span onClick={e => { e.stopPropagation(); toggleStar(item) }} style={{ cursor: 'pointer', fontSize: 14, color: isStar ? colors.red : colors.text2, flexShrink: 0 }}>{isStar ? '★' : '☆'}</span>
                          </div>
                          {item.description && <div style={{ fontSize: 12, color: colors.text2, marginBottom: 6, lineHeight: 1.5, overflow: 'hidden', textOverflow: 'ellipsis', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical' as const }}>{truncate(item.description, 160)}</div>}
                          <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 11, color: colors.text2 }}>
                            <span style={{ color: colors.amber }}>{item.sourceName}</span>
                            {item.author && <span>· {item.author}</span>}
                            <span>· {formatDate(item.pubDate)}</span>
                            {isRead && <span style={{ opacity: 0.6 }}>· 已读</span>}
                          </div>
                        </div>
                      </div>
                    </div>
                  )
                })
              )}
            </div>
          ) : readingItem ? (
            <div style={{ padding: '24px 32px' }}>
              <div style={{ maxWidth: 720, margin: '0 auto' }}>
                <div style={{ marginBottom: 24 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
                    <span style={{ fontSize: 14 }}>{readingItem.sourceFavicon || '📋'}</span>
                    <span style={{ fontSize: 12, color: colors.amber }}>{readingItem.sourceName}</span>
                    {readingItem.author && <span style={{ fontSize: 12, color: colors.text2 }}>· {readingItem.author}</span>}
                    <span style={{ fontSize: 12, color: colors.text2 }}>· {formatDate(readingItem.pubDate)}</span>
                  </div>
                  <h1 style={{ fontSize: 24, fontWeight: 700, lineHeight: 1.4, margin: 0, color: colors.text }}>{readingItem.title}</h1>
                  <div style={{ display: 'flex', gap: 8, marginTop: 12 }}>
                    <button onClick={() => toggleStar(readingItem)} style={{ padding: '4px 10px', borderRadius: 6, border: 'none', background: starState[readingItem.id] ? colors.red : 'rgba(255,255,255,0.1)', color: starState[readingItem.id] ? '#fff' : colors.text2, cursor: 'pointer', fontSize: 12 }}>{starState[readingItem.id] ? '★ 已收藏' : '☆ 收藏'}</button>
                    <button onClick={() => toggleRead(readingItem.id)} style={{ padding: '4px 10px', borderRadius: 6, border: 'none', background: readState[readingItem.id] ? 'rgba(255,255,255,0.1)' : colors.amber, color: readState[readingItem.id] ? colors.text2 : '#000', cursor: 'pointer', fontSize: 12 }}>{readState[readingItem.id] ? '标记未读' : '标记已读'}</button>
                  </div>
                </div>
                <div style={{ borderTop: `1px solid ${colors.border}`, paddingTop: 20 }} dangerouslySetInnerHTML={{ __html: renderContent(readingItem) }} />
              </div>
            </div>
          ) : null}
        </div>
      </div>

      {/* ── Add Feed Modal ── */}
      {showAddFeed && (
        <div style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.6)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 50, backdropFilter: 'blur(4px)' }} onClick={() => setShowAddFeed(false)}>
          <div style={{ width: 400, borderRadius: 12, background: colors.bg2, border: `1px solid ${colors.border}`, padding: 24, boxShadow: '0 20px 60px rgba(0,0,0,0.5)' }} onClick={e => e.stopPropagation()}>
            <h3 style={{ margin: '0 0 16px', fontSize: 16, fontWeight: 700 }}>添加 RSS 订阅</h3>
            <div style={{ marginBottom: 12 }}>
              <label style={{ display: 'block', fontSize: 12, color: colors.text2, marginBottom: 4 }}>Feed URL</label>
              <input value={newFeedUrl} onChange={e => setNewFeedUrl(e.target.value)} placeholder="https://example.com/feed.xml" style={{ width: '100%', padding: '8px 12px', borderRadius: 6, border: `1px solid ${colors.border}`, background: colors.bg, color: colors.text, fontSize: 13, outline: 'none', boxSizing: 'border-box' }} />
            </div>
            <div style={{ marginBottom: 12 }}>
              <label style={{ display: 'block', fontSize: 12, color: colors.text2, marginBottom: 4 }}>名称（可选）</label>
              <input value={newFeedName} onChange={e => setNewFeedName(e.target.value)} placeholder="自动检测" style={{ width: '100%', padding: '8px 12px', borderRadius: 6, border: `1px solid ${colors.border}`, background: colors.bg, color: colors.text, fontSize: 13, outline: 'none', boxSizing: 'border-box' }} />
            </div>
            <div style={{ marginBottom: 16 }}>
              <label style={{ display: 'block', fontSize: 12, color: colors.text2, marginBottom: 4 }}>分类</label>
              <select value={newFeedCat} onChange={e => setNewFeedCat(e.target.value as FeedCategory)} style={{ width: '100%', padding: '8px 12px', borderRadius: 6, border: `1px solid ${colors.border}`, background: colors.bg, color: colors.text, fontSize: 13, cursor: 'pointer' }}>
                {(['Tech', 'Science', 'News', 'Dev', 'Custom'] as FeedCategory[]).map(c => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>
            <div style={{ fontSize: 11, color: colors.text2, marginBottom: 12, padding: '8px 10px', borderRadius: 6, background: 'rgba(245,158,11,0.08)' }}>
              💡 提示：部分 RSS 源因 CORS 限制可能无法直接获取，可在设置中启用代理。
            </div>
            <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
              <button onClick={() => setShowAddFeed(false)} style={{ padding: '8px 16px', borderRadius: 6, border: `1px solid ${colors.border}`, background: 'transparent', color: colors.text2, cursor: 'pointer', fontSize: 13 }}>取消</button>
              <button onClick={addFeed} disabled={!newFeedUrl.trim()} style={{ padding: '8px 16px', borderRadius: 6, border: 'none', background: colors.gradient, color: '#fff', cursor: 'pointer', fontSize: 13, fontWeight: 600, opacity: newFeedUrl.trim() ? 1 : 0.5 }}>添加</button>
            </div>
          </div>
        </div>
      )}

      {/* ── Settings Modal ── */}
      {showSettings && (
        <div style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.6)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 50, backdropFilter: 'blur(4px)' }} onClick={() => setShowSettings(false)}>
          <div style={{ width: 380, borderRadius: 12, background: colors.bg2, border: `1px solid ${colors.border}`, padding: 24, boxShadow: '0 20px 60px rgba(0,0,0,0.5)' }} onClick={e => e.stopPropagation()}>
            <h3 style={{ margin: '0 0 16px', fontSize: 16, fontWeight: 700 }}>设置</h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <span style={{ fontSize: 13 }}>自动刷新</span>
                <button onClick={() => setSettings(p => ({ ...p, autoRefresh: !p.autoRefresh }))} style={{ width: 40, height: 22, borderRadius: 11, border: 'none', background: settings.autoRefresh ? colors.amber : 'rgba(255,255,255,0.15)', cursor: 'pointer', position: 'relative', transition: 'all 0.2s' }}>
                  <div style={{ width: 18, height: 18, borderRadius: 9, background: '#fff', position: 'absolute', top: 2, left: settings.autoRefresh ? 20 : 2, transition: 'all 0.2s' }} />
                </button>
              </div>
              <div>
                <span style={{ fontSize: 13 }}>刷新间隔（分钟）</span>
                <input type="number" value={settings.refreshInterval} onChange={e => setSettings(p => ({ ...p, refreshInterval: Math.max(1, parseInt(e.target.value) || DEFAULT_REFRESH) }))} min={1} style={{ width: '100%', padding: '6px 10px', borderRadius: 6, border: `1px solid ${colors.border}`, background: colors.bg, color: colors.text, fontSize: 13, marginTop: 4, outline: 'none', boxSizing: 'border-box' }} />
              </div>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <span style={{ fontSize: 13 }}>CORS 代理</span>
                <button onClick={() => setSettings(p => ({ ...p, useProxy: !p.useProxy }))} style={{ width: 40, height: 22, borderRadius: 11, border: 'none', background: settings.useProxy ? colors.amber : 'rgba(255,255,255,0.15)', cursor: 'pointer', position: 'relative', transition: 'all 0.2s' }}>
                  <div style={{ width: 18, height: 18, borderRadius: 9, background: '#fff', position: 'absolute', top: 2, left: settings.useProxy ? 20 : 2, transition: 'all 0.2s' }} />
                </button>
              </div>
              <div style={{ fontSize: 11, color: colors.text2, padding: '8px 10px', borderRadius: 6, background: 'rgba(245,158,11,0.08)' }}>
                💡 启用 CORS 代理可访问更多 RSS 源，但会通过第三方服务转发请求。
              </div>
            </div>
            <div style={{ marginTop: 16, textAlign: 'right' }}>
              <button onClick={() => setShowSettings(false)} style={{ padding: '8px 16px', borderRadius: 6, border: 'none', background: colors.gradient, color: '#fff', cursor: 'pointer', fontSize: 13 }}>完成</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
