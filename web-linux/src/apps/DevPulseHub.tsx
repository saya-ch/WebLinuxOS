import { useState, useEffect, useCallback, useMemo } from 'react'
import { Newspaper, TrendingUp, Code2, Zap, BookOpen, RefreshCw, ExternalLink, Clock, Star, Search, Bookmark, BookmarkCheck, Filter, ChevronDown, Loader2 } from 'lucide-react'

interface NewsItem {
  id: string
  title: string
  url: string
  source: 'hackernews' | 'devto' | 'github' | 'producthunt'
  author?: string
  points?: number
  comments?: number
  timestamp?: number
  summary?: string
  tags?: string[]
}

interface CachedFeed {
  items: NewsItem[]
  fetchedAt: number
}

const FEED_CACHE_KEY = 'devpulse-cache-v1'
const BOOKMARKS_KEY = 'devpulse-bookmarks-v1'
const CACHE_TTL = 5 * 60 * 1000 // 5分钟缓存

const FEED_SOURCES = [
  { id: 'hackernews', name: 'Hacker News', icon: <Newspaper size={16} />, color: '#ff6600' },
  { id: 'github', name: 'GitHub Trending', icon: <Code2 size={16} />, color: '#24292f' },
  { id: 'devto', name: 'DEV.to', icon: <BookOpen size={16} />, color: '#0a0a0a' },
  { id: 'producthunt', name: 'Product Hunt', icon: <Star size={16} />, color: '#da552f' }
]

const PROXIES = [
  // 公共 CORS 代理列表，依次尝试
  (url: string) => `https://api.allorigins.win/raw?url=${encodeURIComponent(url)}`,
  (url: string) => `https://corsproxy.io/?${encodeURIComponent(url)}`,
  (url: string) => `https://api.codetabs.com/v1/proxy?quest=${encodeURIComponent(url)}`
]

async function fetchViaProxy(url: string): Promise<Response> {
  let lastErr: unknown
  for (const buildProxy of PROXIES) {
    try {
      const proxyUrl = buildProxy(url)
      const resp = await fetch(proxyUrl, {
        headers: { 'Accept': 'application/json, text/html' }
      })
      if (resp.ok) return resp
    } catch (err) {
      lastErr = err
      continue
    }
  }
  throw lastErr || new Error('所有代理均失败')
}

// Hacker News API 集成（公开免费API，CORS友好）
async function fetchHackerNews(topN = 30): Promise<NewsItem[]> {
  try {
    const topIdsResp = await fetch('https://hacker-news.firebaseio.com/v0/topstories.json')
    if (!topIdsResp.ok) throw new Error('HN API failed')
    const topIds: number[] = await topIdsResp.json()
    const ids = topIds.slice(0, topN)

    const items = await Promise.all(
      ids.map(async (id, idx) => {
        try {
          const itemResp = await fetch(`https://hacker-news.firebaseio.com/v0/item/${id}.json`)
          const item = await itemResp.json()
          if (!item || !item.title) return null
          return {
            id: `hn-${id}`,
            title: item.title,
            url: item.url || `https://news.ycombinator.com/item?id=${id}`,
            source: 'hackernews' as const,
            author: item.by,
            points: item.score || 0,
            comments: item.descendants || 0,
            timestamp: item.time ? item.time * 1000 : Date.now() - idx * 60000,
            summary: item.text || undefined
          }
        } catch {
          return null
        }
      })
    )
    return items.filter((x): x is Exclude<typeof x, null> => x !== null) as NewsItem[]
  } catch (err) {
    console.warn('[DevPulse] HN fetch failed:', err)
    return []
  }
}

// GitHub Trending (通过解析页面获取，使用代理)
async function fetchGitHubTrending(since = 'daily'): Promise<NewsItem[]> {
  try {
    const resp = await fetchViaProxy(`https://github.com/trending?since=${since}`)
    const html = await resp.text()
    const items: NewsItem[] = []
    // 简单解析：匹配 <article> 块
    const articleRegex = /<article[\s\S]*?<h2[^>]*>[\s\S]*?href="\/([^/]+)\/([^"#/]+)[\s\S]*?<p[^>]*>([\s\S]*?)<\/p>[\s\S]*?<a[\s\S]*?stargazers[\s\S]*?>([\s\S]*?)<\/a>[\s\S]*?<\/article>/g
    let match: RegExpExecArray | null
    let idx = 0
    while ((match = articleRegex.exec(html)) !== null && idx < 20) {
      const [, owner, repo, descRaw, starsRaw] = match
      const description = descRaw.replace(/<[^>]*>/g, '').trim()
      const stars = parseInt(starsRaw.replace(/<[^>]*>/g, '').replace(/,/g, '').trim(), 10) || 0
      if (owner && repo) {
        items.push({
          id: `gh-${owner}-${repo}`,
          title: `${owner}/${repo}`,
          url: `https://github.com/${owner}/${repo}`,
          source: 'github' as const,
          author: owner,
          points: stars,
          comments: 0,
          timestamp: Date.now() - idx * 300000,
          summary: description || 'No description',
          tags: ['github', 'trending']
        })
        idx++
      }
    }
    return items
  } catch (err) {
    console.warn('[DevPulse] GH trending failed:', err)
    return []
  }
}

// DEV.to 公开 API
async function fetchDevTo(topN = 20): Promise<NewsItem[]> {
  try {
    const resp = await fetch('https://dev.to/api/articles?per_page=' + topN)
    if (!resp.ok) throw new Error('DEV.to API failed')
    const data = await resp.json()
    return data.map((a: any, idx: number) => ({
      id: `devto-${a.id}`,
      title: a.title,
      url: a.url,
      source: 'devto' as const,
      author: a.user?.name || 'Unknown',
      points: a.positive_reactions_count || 0,
      comments: a.comments_count || 0,
      timestamp: a.published_timestamp ? new Date(a.published_timestamp).getTime() : Date.now() - idx * 60000,
      summary: a.description,
      tags: (a.tag_list || []).slice(0, 4)
    }))
  } catch (err) {
    console.warn('[DevPulse] DEV.to failed:', err)
    return []
  }
}

// Product Hunt (获取每日热门产品，通过公共代理)
async function fetchProductHunt(): Promise<NewsItem[]> {
  try {
    const resp = await fetchViaProxy('https://www.producthunt.com/')
    const html = await resp.text()
    const items: NewsItem[] = []
    // 尝试解析产品卡片
    const regex = /data-test="post-name"[^>]*>([^<]+)<[\s\S]*?data-test="post-tagline"[^>]*>([^<]*)<[\s\S]*?href="(\/posts\/[^"]+)"/g
    let match: RegExpExecArray | null
    let idx = 0
    while ((match = regex.exec(html)) !== null && idx < 15) {
      const [, title, desc, path] = match
      if (title.trim()) {
        items.push({
          id: `ph-${idx}-${title.trim().slice(0, 20)}`,
          title: title.trim(),
          url: 'https://www.producthunt.com' + path,
          source: 'producthunt' as const,
          points: 100 - idx,
          timestamp: Date.now() - idx * 3600000,
          summary: desc.trim() || 'Product Hunt today top',
          tags: ['product', 'startup']
        })
        idx++
      }
    }
    return items
  } catch (err) {
    console.warn('[DevPulse] PH failed:', err)
    return []
  }
}

function formatRelativeTime(ts: number): string {
  const diff = Date.now() - ts
  const mins = Math.floor(diff / 60000)
  if (mins < 1) return '刚刚'
  if (mins < 60) return `${mins}分钟前`
  const hrs = Math.floor(mins / 60)
  if (hrs < 24) return `${hrs}小时前`
  const days = Math.floor(hrs / 24)
  return `${days}天前`
}

export default function DevPulseHub() {
  const [allItems, setAllItems] = useState<NewsItem[]>([])
  const [loading, setLoading] = useState(false)
  const [activeSources, setActiveSources] = useState<Set<string>>(new Set(['hackernews', 'github', 'devto', 'producthunt']))
  const [searchQuery, setSearchQuery] = useState('')
  const [sortBy, setSortBy] = useState<'hot' | 'new'>('hot')
  const [bookmarks, setBookmarks] = useState<Set<string>>(() => {
    try {
      const raw = localStorage.getItem(BOOKMARKS_KEY)
      return new Set(raw ? JSON.parse(raw) : [])
    } catch { return new Set() }
  })
  const [showBookmarksOnly, setShowBookmarksOnly] = useState(false)
  const [sourceLoading, setSourceLoading] = useState<Record<string, boolean>>({})
  const [filterOpen, setFilterOpen] = useState(false)

  const toggleBookmark = useCallback((id: string) => {
    setBookmarks(prev => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      localStorage.setItem(BOOKMARKS_KEY, JSON.stringify([...next]))
      return next
    })
  }, [])

  const loadFeeds = useCallback(async (forceRefresh = false) => {
    setLoading(true)
    const cacheRaw = localStorage.getItem(FEED_CACHE_KEY)
    const now = Date.now()

    if (!forceRefresh && cacheRaw) {
      try {
        const cache: Record<string, CachedFeed> = JSON.parse(cacheRaw)
        const allValid = Object.values(cache).every(c => now - c.fetchedAt < CACHE_TTL)
        if (allValid && Object.keys(cache).length >= 2) {
          const combined = Object.values(cache).flatMap(c => c.items)
          if (combined.length > 10) {
            setAllItems(combined)
            setLoading(false)
            return
          }
        }
      } catch { /* ignore */ }
    }

    const results: Record<string, NewsItem[]> = {}
    const sources = [...activeSources]

    // 并发加载
    await Promise.all(sources.map(async (src) => {
      setSourceLoading(s => ({ ...s, [src]: true }))
      try {
        let items: NewsItem[] = []
        switch (src) {
          case 'hackernews': items = await fetchHackerNews(25); break
          case 'github': items = await fetchGitHubTrending('daily'); break
          case 'devto': items = await fetchDevTo(20); break
          case 'producthunt': items = await fetchProductHunt(); break
        }
        results[src] = items
        // 保存到缓存
        try {
          const existing: Record<string, CachedFeed> = JSON.parse(localStorage.getItem(FEED_CACHE_KEY) || '{}')
          existing[src] = { items, fetchedAt: Date.now() }
          localStorage.setItem(FEED_CACHE_KEY, JSON.stringify(existing))
        } catch { /* ignore */ }
      } finally {
        setSourceLoading(s => ({ ...s, [src]: false }))
      }
    }))

    const combined = Object.values(results).flat()
    setAllItems(combined)
    setLoading(false)
  }, [activeSources])

  useEffect(() => {
    loadFeeds()
  }, [])

  const filteredItems = useMemo(() => {
    let items = allItems.filter(i => activeSources.has(i.source))
    if (showBookmarksOnly) items = items.filter(i => bookmarks.has(i.id))
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase()
      items = items.filter(i =>
        i.title.toLowerCase().includes(q) ||
        (i.summary || '').toLowerCase().includes(q) ||
        (i.author || '').toLowerCase().includes(q) ||
        (i.tags || []).some(t => t.toLowerCase().includes(q))
      )
    }
    if (sortBy === 'hot') {
      items = [...items].sort((a, b) => (b.points || 0) - (a.points || 0))
    } else {
      items = [...items].sort((a, b) => (b.timestamp || 0) - (a.timestamp || 0))
    }
    return items
  }, [allItems, activeSources, searchQuery, sortBy, bookmarks, showBookmarksOnly])

  const toggleSource = (src: string) => {
    setActiveSources(prev => {
      const next = new Set(prev)
      if (next.has(src)) next.delete(src)
      else next.add(src)
      return next
    })
  }

  const sourceConfig = (sourceId: string) => FEED_SOURCES.find(s => s.id === sourceId)!

  return (
    <div style={{
      height: '100%',
      display: 'flex',
      flexDirection: 'column',
      background: 'linear-gradient(180deg, #0b1020 0%, #111936 100%)',
      color: '#e6e8f0',
      fontFamily: 'system-ui, -apple-system, sans-serif',
      overflow: 'hidden'
    }}>
      {/* 头部 */}
      <div style={{
        padding: '18px 22px 12px',
        borderBottom: '1px solid rgba(255,255,255,0.06)',
        background: 'rgba(255,255,255,0.02)'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 10 }}>
          <div style={{
            width: 36, height: 36,
            borderRadius: 10,
            background: 'linear-gradient(135deg, #6366f1, #ec4899)',
            display: 'flex', alignItems: 'center', justifyContent: 'center'
          }}>
            <Zap size={20} color="#fff" />
          </div>
          <div style={{ flex: 1 }}>
            <h2 style={{ margin: 0, fontSize: 19, fontWeight: 700, letterSpacing: '0.01em' }}>
              DevPulse · 开发者新闻中心
            </h2>
            <p style={{ margin: '3px 0 0', fontSize: 12, color: '#7b82a4' }}>
              Hacker News · GitHub Trending · DEV.to · Product Hunt · 实时聚合
            </p>
          </div>
          <button
            onClick={() => loadFeeds(true)}
            disabled={loading}
            style={{
              padding: '8px 14px',
              background: loading ? 'rgba(99,102,241,0.3)' : 'rgba(99,102,241,0.15)',
              border: '1px solid rgba(99,102,241,0.3)',
              borderRadius: 8,
              color: '#a5b4fc',
              cursor: loading ? 'not-allowed' : 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: 6,
              fontSize: 13,
              fontFamily: 'inherit',
              transition: 'all 0.15s'
            }}
          >
            <RefreshCw size={14} style={loading ? { animation: 'spin 1s linear infinite' } : undefined} />
            {loading ? '刷新中...' : '刷新'}
          </button>
        </div>

        {/* 搜索栏 + 过滤器 */}
        <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
          <div style={{
            position: 'relative',
            flex: 1,
            maxWidth: 360
          }}>
            <Search size={14} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: '#60688a' }} />
            <input
              type="text"
              placeholder="搜索标题、作者、标签..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              style={{
                width: '100%',
                padding: '9px 12px 9px 34px',
                background: 'rgba(255,255,255,0.04)',
                border: '1px solid rgba(255,255,255,0.08)',
                borderRadius: 8,
                color: '#e6e8f0',
                fontSize: 13,
                outline: 'none',
                fontFamily: 'inherit'
              }}
            />
          </div>

          <div style={{
            position: 'relative',
            display: 'flex',
            alignItems: 'center',
            gap: 6,
            padding: '8px 12px',
            background: 'rgba(255,255,255,0.04)',
            border: '1px solid rgba(255,255,255,0.08)',
            borderRadius: 8,
            cursor: 'pointer',
            fontSize: 13,
            color: '#b0b5cf'
          }} onClick={() => setFilterOpen(o => !o)}>
            <Filter size={14} />
            <span>排序: {sortBy === 'hot' ? '热门' : '最新'}</span>
            <ChevronDown size={14} style={{ transform: filterOpen ? 'rotate(180deg)' : 'none', transition: 'transform 0.2s' }} />
            {filterOpen && (
              <div style={{
                position: 'absolute',
                top: '100%',
                right: 0,
                marginTop: 6,
                background: '#161e3d',
                border: '1px solid rgba(255,255,255,0.1)',
                borderRadius: 10,
                padding: 6,
                zIndex: 50,
                minWidth: 150,
                boxShadow: '0 10px 30px rgba(0,0,0,0.4)'
              }}>
                {(['hot', 'new'] as const).map(s => (
                  <div
                    key={s}
                    onClick={e => { e.stopPropagation(); setSortBy(s); setFilterOpen(false) }}
                    style={{
                      padding: '8px 10px',
                      borderRadius: 6,
                      cursor: 'pointer',
                      fontSize: 13,
                      color: sortBy === s ? '#a5b4fc' : '#b0b5cf',
                      background: sortBy === s ? 'rgba(99,102,241,0.15)' : 'transparent'
                    }}
                  >
                    {s === 'hot' ? '🔥 按热度' : '⏱ 按时间'}
                  </div>
                ))}
              </div>
            )}
          </div>

          <button
            onClick={() => setShowBookmarksOnly(b => !b)}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 5,
              padding: '8px 12px',
              background: showBookmarksOnly ? 'rgba(245,158,11,0.2)' : 'rgba(255,255,255,0.04)',
              border: `1px solid ${showBookmarksOnly ? 'rgba(245,158,11,0.4)' : 'rgba(255,255,255,0.08)'}`,
              borderRadius: 8,
              color: showBookmarksOnly ? '#fbbf24' : '#b0b5cf',
              fontSize: 13,
              cursor: 'pointer',
              fontFamily: 'inherit',
              transition: 'all 0.15s'
            }}
          >
            {showBookmarksOnly ? <BookmarkCheck size={14} /> : <Bookmark size={14} />}
            收藏 ({bookmarks.size})
          </button>
        </div>

        {/* 来源切换 */}
        <div style={{ display: 'flex', gap: 8, marginTop: 12, flexWrap: 'wrap' }}>
          {FEED_SOURCES.map(src => {
            const active = activeSources.has(src.id)
            return (
              <button
                key={src.id}
                onClick={() => toggleSource(src.id)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 6,
                  padding: '6px 12px',
                  background: active ? `${src.color}22` : 'rgba(255,255,255,0.03)',
                  border: `1px solid ${active ? `${src.color}55` : 'rgba(255,255,255,0.08)'}`,
                  borderRadius: 20,
                  color: active ? '#fff' : '#7b82a4',
                  cursor: 'pointer',
                  fontSize: 12,
                  fontFamily: 'inherit',
                  opacity: sourceLoading[src.id] ? 0.6 : 1
                }}
              >
                {sourceLoading[src.id] ? <Loader2 size={12} style={{ animation: 'spin 1s linear infinite' }} /> : src.icon}
                {src.name}
              </button>
            )
          })}
        </div>
      </div>

      {/* 列表 */}
      <div style={{
        flex: 1,
        overflowY: 'auto',
        padding: '14px 22px',
        scrollBehavior: 'smooth'
      }}>
        {loading && filteredItems.length === 0 && (
          <div style={{
            height: '100%',
            minHeight: 300,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 14,
            color: '#7b82a4'
          }}>
            <Loader2 size={32} style={{ animation: 'spin 1s linear infinite', color: '#6366f1' }} />
            <div style={{ fontSize: 14 }}>正在加载新闻源...</div>
            <div style={{ fontSize: 11, color: '#5a6083' }}>首次加载可能需要几秒钟</div>
          </div>
        )}

        {!loading && filteredItems.length === 0 && (
          <div style={{
            padding: '60px 20px',
            textAlign: 'center',
            color: '#7b82a4'
          }}>
            <Newspaper size={40} style={{ margin: '0 auto 14px', opacity: 0.3 }} />
            <div style={{ fontSize: 14, marginBottom: 6 }}>暂无内容</div>
            <div style={{ fontSize: 12, color: '#5a6083' }}>
              {showBookmarksOnly ? '还没有收藏任何内容' : '尝试更改筛选条件或点击刷新按钮'}
            </div>
          </div>
        )}

        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {filteredItems.map((item, i) => {
            const srcCfg = sourceConfig(item.source)
            const bookmarked = bookmarks.has(item.id)
            return (
              <a
                key={item.id}
                href={item.url}
                target="_blank"
                rel="noopener noreferrer"
                onClick={e => { e.preventDefault(); window.open(item.url, '_blank', 'noopener,noreferrer') }}
                style={{
                  display: 'block',
                  textDecoration: 'none',
                  padding: '14px 16px',
                  background: 'rgba(255,255,255,0.03)',
                  border: '1px solid rgba(255,255,255,0.05)',
                  borderRadius: 12,
                  color: 'inherit',
                  cursor: 'pointer',
                  transition: 'all 0.2s',
                  transform: 'translateY(0)'
                }}
                onMouseOver={e => {
                  e.currentTarget.style.background = 'rgba(255,255,255,0.06)'
                  e.currentTarget.style.borderColor = `${srcCfg.color}33`
                  e.currentTarget.style.transform = 'translateY(-1px)'
                  e.currentTarget.style.boxShadow = `0 4px 18px ${srcCfg.color}11`
                }}
                onMouseOut={e => {
                  e.currentTarget.style.background = 'rgba(255,255,255,0.03)'
                  e.currentTarget.style.borderColor = 'rgba(255,255,255,0.05)'
                  e.currentTarget.style.transform = 'translateY(0)'
                  e.currentTarget.style.boxShadow = 'none'
                }}
              >
                <div style={{ display: 'flex', gap: 12 }}>
                  {/* 序号/热度 */}
                  <div style={{
                    width: 40,
                    minWidth: 40,
                    paddingTop: 2,
                    textAlign: 'center'
                  }}>
                    <div style={{
                      fontSize: 13,
                      fontWeight: 700,
                      color: `${srcCfg.color}cc`
                    }}>
                      {item.points !== undefined && item.points > 0 ? (
                        <>
                          <TrendingUp size={12} style={{ display: 'inline', verticalAlign: '-2px', marginRight: 2 }} />
                          {item.points > 999 ? `${(item.points / 1000).toFixed(1)}k` : item.points}
                        </>
                      ) : `#${i + 1}`}
                    </div>
                  </div>

                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: 'flex', alignItems: 'flex-start', gap: 8 }}>
                      <div style={{
                        flex: 1,
                        fontSize: 14.5,
                        fontWeight: 600,
                        color: '#f0f2fa',
                        lineHeight: 1.4,
                        marginBottom: 6,
                        wordBreak: 'break-word'
                      }}>
                        {item.title}
                        <ExternalLink size={12} style={{
                          display: 'inline',
                          marginLeft: 6,
                          verticalAlign: '2px',
                          opacity: 0.4
                        }} />
                      </div>

                      <button
                        onClick={e => { e.preventDefault(); e.stopPropagation(); toggleBookmark(item.id) }}
                        title={bookmarked ? '取消收藏' : '收藏'}
                        style={{
                          background: 'transparent',
                          border: 'none',
                          color: bookmarked ? '#fbbf24' : '#5a6083',
                          cursor: 'pointer',
                          padding: 4,
                          borderRadius: 6
                        }}
                      >
                        {bookmarked ? <BookmarkCheck size={16} /> : <Bookmark size={16} />}
                      </button>
                    </div>

                    {item.summary && (
                      <div style={{
                        fontSize: 12.5,
                        color: '#8a8fa8',
                        lineHeight: 1.55,
                        marginBottom: 8,
                        display: '-webkit-box',
                        WebkitLineClamp: 2,
                        WebkitBoxOrient: 'vertical',
                        overflow: 'hidden'
                      }}>
                        {item.summary}
                      </div>
                    )}

                    <div style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 10,
                      flexWrap: 'wrap'
                    }}>
                      <span style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: 4,
                        padding: '2px 8px',
                        background: `${srcCfg.color}18`,
                        color: srcCfg.color,
                        borderRadius: 10,
                        fontSize: 11,
                        fontWeight: 500,
                        border: `1px solid ${srcCfg.color}22`
                      }}>
                        {srcCfg.icon}
                        {srcCfg.name}
                      </span>

                      {item.author && (
                        <span style={{ fontSize: 11, color: '#7b82a4', display: 'inline-flex', alignItems: 'center', gap: 3 }}>
                          <Code2 size={11} />
                          {item.author}
                        </span>
                      )}

                      {item.comments !== undefined && item.comments > 0 && (
                        <span style={{ fontSize: 11, color: '#7b82a4' }}>
                          💬 {item.comments}
                        </span>
                      )}

                      {item.tags && item.tags.length > 0 && item.tags.slice(0, 3).map(tag => (
                        <span
                          key={tag}
                          style={{
                            fontSize: 10.5,
                            padding: '1px 7px',
                            background: 'rgba(99,102,241,0.08)',
                            color: '#818cf8',
                            borderRadius: 4
                          }}
                        >
                          #{tag}
                        </span>
                      ))}

                      <span style={{ fontSize: 11, color: '#5a6083', marginLeft: 'auto', display: 'inline-flex', alignItems: 'center', gap: 3 }}>
                        <Clock size={11} />
                        {item.timestamp ? formatRelativeTime(item.timestamp) : 'N/A'}
                      </span>
                    </div>
                  </div>
                </div>
              </a>
            )
          })}
        </div>

        {filteredItems.length > 0 && (
          <div style={{
            textAlign: 'center',
            padding: '24px 0 12px',
            color: '#5a6083',
            fontSize: 11
          }}>
            已显示 {filteredItems.length} 条 · 数据每 5 分钟自动缓存 · 来源均为公开免费 API
          </div>
        )}
      </div>

      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
        ::-webkit-scrollbar { width: 8px; }
        ::-webkit-scrollbar-track { background: transparent; }
        ::-webkit-scrollbar-thumb { background: rgba(99,102,241,0.25); border-radius: 4px; }
        ::-webkit-scrollbar-thumb:hover { background: rgba(99,102,241,0.45); }
      `}</style>
    </div>
  )
}
