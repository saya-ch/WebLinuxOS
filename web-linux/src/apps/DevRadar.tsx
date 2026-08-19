import { useState, useEffect, useCallback, memo, useMemo, useRef } from 'react'

/**
 * DevRadar - 开发者技术雷达
 * 聚合 Hacker News + GitHub Trending + GitHub Releases 的实时技术信息流
 * 提供个性化过滤、收藏、搜索和深度阅读功能
 */

interface FeedItem {
  id: string
  source: 'hackernews' | 'github-trending' | 'github-releases'
  title: string
  url?: string
  description?: string
  score?: number
  comments?: number
  author?: string
  time?: string
  language?: string
  stars?: number
  forks?: number
  tags?: string[]
}

type FeedSource = 'all' | 'hackernews' | 'github-trending' | 'github-releases'
type SortMode = 'latest' | 'popular' | 'trending'

const STORAGE_KEY = 'devradar-favorites'

const DevRadar = memo(function DevRadar() {
  const [items, setItems] = useState<FeedItem[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [source, setSource] = useState<FeedSource>('all')
  const [sortMode, setSortMode] = useState<SortMode>('popular')
  const [searchQuery, setSearchQuery] = useState('')
  const [favorites, setFavorites] = useState<Set<string>>(new Set())
  const [showFavoritesOnly, setShowFavoritesOnly] = useState(false)
  const [selectedItem, setSelectedItem] = useState<FeedItem | null>(null)
  const [refreshKey, setRefreshKey] = useState(0)
  const [lastUpdate, setLastUpdate] = useState<Date | null>(null)
  const [autoRefresh, setAutoRefresh] = useState(true)
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null)

  // 加载收藏
  useEffect(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY)
      if (saved) {
        setFavorites(new Set(JSON.parse(saved)))
      }
    } catch {
      // ignore
    }
  }, [])

  // 保存收藏
  const saveFavorites = useCallback((fav: Set<string>) => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify([...fav]))
    } catch {
      // ignore
    }
  }, [])

  // 获取 Hacker News 数据
  const fetchHackerNews = useCallback(async (): Promise<FeedItem[]> => {
    try {
      const res = await fetch('https://hn.algolia.com/api/v1/search?tags=front_page&hitsPerPage=30')
      if (!res.ok) throw new Error('HN API failed')
      const data = await res.json()
      return (data.hits || []).map((hit: any) => ({
        id: `hn-${hit.objectID}`,
        source: 'hackernews' as const,
        title: hit.title || hit.story_title || 'Untitled',
        url: hit.url || `https://news.ycombinator.com/item?id=${hit.objectID}`,
        description: hit.story_text?.slice(0, 200)?.replace(/<[^>]+>/g, ''),
        score: hit.points || 0,
        comments: hit.num_comments || 0,
        author: hit.author,
        time: hit.created_at,
        tags: hit._tags?.slice(0, 3),
      }))
    } catch {
      return []
    }
  }, [])

  // 获取 GitHub Trending
  const fetchGitHubTrending = useCallback(async (): Promise<FeedItem[]> => {
    try {
      // 使用 GitHub 搜索 API 模拟 trending
      const since = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString()
      const res = await fetch(
        `https://api.github.com/search/repositories?q=created:>${since.split('T')[0]}&sort=stars&order=desc&per_page=30`
      )
      if (!res.ok) throw new Error('GitHub API failed')
      const data = await res.json()
      return (data.items || []).map((repo: any) => ({
        id: `gh-${repo.id}`,
        source: 'github-trending' as const,
        title: `${repo.full_name}`,
        url: repo.html_url,
        description: repo.description,
        stars: repo.stargazers_count,
        forks: repo.forks_count,
        language: repo.language,
        author: repo.owner?.login,
        time: repo.created_at,
        tags: repo.topics?.slice(0, 4),
      }))
    } catch {
      return []
    }
  }, [])

  // 获取 GitHub Releases
  const fetchGitHubReleases = useCallback(async (): Promise<FeedItem[]> => {
    try {
      // 获取热门项目的最新release
      const popularRepos = [
        'microsoft/vscode',
        'facebook/react',
        'vercel/next.js',
        'microsoft/TypeScript',
        'tailwindlabs/tailwindcss',
        'vitejs/vite',
        'prisma/prisma',
        'shadcn-ui/ui',
      ]
      const results = await Promise.allSettled(
        popularRepos.map(async (repo): Promise<FeedItem | null> => {
          const res = await fetch(`https://api.github.com/repos/${repo}/releases/latest`)
          if (!res.ok) return null
          const data = await res.json()
          return {
            id: `rel-${repo}-${data.id}`,
            source: 'github-releases' as const,
            title: `${repo} ${data.tag_name}`,
            url: data.html_url,
            description: data.body?.slice(0, 300)?.replace(/<[^>]+>/g, ''),
            author: data.author?.login,
            time: data.published_at,
            tags: ['release', repo.split('/')[1]],
          }
        })
      )
      return results
        .filter((r): r is PromiseFulfilledResult<FeedItem | null> => r.status === 'fulfilled')
        .map((r) => r.value)
        .filter((v): v is FeedItem => v !== null)
    } catch {
      return []
    }
  }, [])

  // 获取所有数据
  const fetchAll = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const sources: Promise<FeedItem[]>[] = []
      if (source === 'all' || source === 'hackernews') sources.push(fetchHackerNews())
      if (source === 'all' || source === 'github-trending') sources.push(fetchGitHubTrending())
      if (source === 'all' || source === 'github-releases') sources.push(fetchGitHubReleases())

      const results = await Promise.allSettled(sources)
      const allItems = results
        .filter((r): r is PromiseFulfilledResult<FeedItem[]> => r.status === 'fulfilled')
        .flatMap((r) => r.value)

      if (allItems.length === 0) {
        setError('暂无数据，请稍后重试')
      } else {
        setItems(allItems)
        setLastUpdate(new Date())
      }
    } catch (e) {
      setError('获取数据失败，请检查网络连接')
    } finally {
      setLoading(false)
    }
  }, [source, fetchHackerNews, fetchGitHubTrending, fetchGitHubReleases])

  useEffect(() => {
    fetchAll()
  }, [fetchAll, refreshKey])

  // 自动刷新
  useEffect(() => {
    if (!autoRefresh) {
      if (intervalRef.current) clearInterval(intervalRef.current)
      return
    }
    intervalRef.current = setInterval(() => {
      setRefreshKey((k) => k + 1)
    }, 5 * 60 * 1000) // 5分钟
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current)
    }
  }, [autoRefresh])

  // 过滤和排序
  const filteredItems = useMemo(() => {
    let result = items

    if (showFavoritesOnly) {
      result = result.filter((item) => favorites.has(item.id))
    }

    if (searchQuery) {
      const q = searchQuery.toLowerCase()
      result = result.filter(
        (item) =>
          item.title.toLowerCase().includes(q) ||
          item.description?.toLowerCase().includes(q) ||
          item.language?.toLowerCase().includes(q) ||
          item.tags?.some((t) => t.toLowerCase().includes(q))
      )
    }

    // 排序
    result = [...result].sort((a, b) => {
      switch (sortMode) {
        case 'popular':
          return (b.score || b.stars || 0) - (a.score || a.stars || 0)
        case 'latest':
          return new Date(b.time || 0).getTime() - new Date(a.time || 0).getTime()
        case 'trending':
          return (b.comments || 0) - (a.comments || 0)
        default:
          return 0
      }
    })

    return result
  }, [items, searchQuery, showFavoritesOnly, favorites, sortMode])

  const toggleFavorite = useCallback(
    (id: string) => {
      setFavorites((prev) => {
        const next = new Set(prev)
        if (next.has(id)) next.delete(id)
        else next.add(id)
        saveFavorites(next)
        return next
      })
    },
    [saveFavorites]
  )

  const sourceColors: Record<FeedSource, string> = {
    all: '#7c6cf0',
    hackernews: '#ff6600',
    'github-trending': '#586069',
    'github-releases': '#28a745',
  }

  const sourceLabels: Record<FeedSource, string> = {
    all: '全部',
    hackernews: 'Hacker News',
    'github-trending': 'GitHub Trending',
    'github-releases': 'Releases',
  }

  return (
    <div className="devradar-app">
      <style>{`
        .devradar-app {
          display: flex;
          height: 100%;
          background: linear-gradient(180deg, #0d1117 0%, #161b22 100%);
          color: #c9d1d9;
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
          overflow: hidden;
        }
        .devradar-sidebar {
          width: 280px;
          border-right: 1px solid #30363d;
          display: flex;
          flex-direction: column;
          flex-shrink: 0;
          background: rgba(13, 17, 23, 0.8);
          backdrop-filter: blur(10px);
        }
        .devradar-header {
          padding: 20px;
          border-bottom: 1px solid #30363d;
        }
        .devradar-logo {
          display: flex;
          align-items: center;
          gap: 10px;
          margin-bottom: 16px;
        }
        .devradar-logo-icon {
          width: 32px;
          height: 32px;
          border-radius: 8px;
          background: linear-gradient(135deg, #7c6cf0 0%, #00d6c1 100%);
          display: flex;
          align-items: center;
          justify-content: center;
          font-weight: 800;
          font-size: 16px;
          color: white;
          box-shadow: 0 4px 12px rgba(124, 108, 240, 0.4);
        }
        .devradar-logo-text {
          font-size: 18px;
          font-weight: 700;
          background: linear-gradient(90deg, #7c6cf0, #00d6c1);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
        }
        .devradar-search {
          width: 100%;
          padding: 10px 14px;
          background: #21262d;
          border: 1px solid #30363d;
          border-radius: 8px;
          color: #c9d1d9;
          font-size: 13px;
          outline: none;
          transition: border-color 0.2s;
        }
        .devradar-search:focus {
          border-color: #7c6cf0;
          box-shadow: 0 0 0 3px rgba(124, 108, 240, 0.1);
        }
        .devradar-sources {
          padding: 12px;
          flex: 1;
          overflow-y: auto;
        }
        .devradar-source-list {
          list-style: none;
          padding: 0;
          margin: 0;
        }
        .devradar-source-item {
          display: flex;
          align-items: center;
          gap: 10px;
          padding: 10px 12px;
          border-radius: 8px;
          cursor: pointer;
          transition: background 0.2s;
          margin-bottom: 4px;
        }
        .devradar-source-item:hover {
          background: rgba(255, 255, 255, 0.04);
        }
        .devradar-source-item.active {
          background: rgba(124, 108, 240, 0.12);
          color: #7c6cf0;
        }
        .devradar-source-dot {
          width: 8px;
          height: 8px;
          border-radius: 50%;
          flex-shrink: 0;
        }
        .devradar-source-name {
          font-size: 14px;
          font-weight: 500;
        }
        .devradar-source-count {
          margin-left: auto;
          font-size: 12px;
          color: #8b949e;
          background: #21262d;
          padding: 2px 8px;
          border-radius: 10px;
        }
        .devradar-controls {
          padding: 16px;
          border-top: 1px solid #30363d;
        }
        .devradar-control-row {
          display: flex;
          align-items: center;
          justify-content: space-between;
          margin-bottom: 12px;
        }
        .devradar-control-label {
          font-size: 12px;
          color: #8b949e;
        }
        .devradar-toggle {
          position: relative;
          width: 36px;
          height: 20px;
          background: #30363d;
          border-radius: 10px;
          cursor: pointer;
          transition: background 0.2s;
        }
        .devradar-toggle.on {
          background: #7c6cf0;
        }
        .devradar-toggle::after {
          content: '';
          position: absolute;
          top: 2px;
          left: 2px;
          width: 16px;
          height: 16px;
          background: white;
          border-radius: 50%;
          transition: transform 0.2s;
        }
        .devradar-toggle.on::after {
          transform: translateX(16px);
        }
        .devradar-refresh-btn {
          width: 100%;
          padding: 8px;
          background: #21262d;
          border: 1px solid #30363d;
          border-radius: 8px;
          color: #c9d1d9;
          cursor: pointer;
          font-size: 12px;
          transition: all 0.2s;
        }
        .devradar-refresh-btn:hover {
          background: #30363d;
          border-color: #7c6cf0;
        }
        .devradar-main {
          flex: 1;
          display: flex;
          flex-direction: column;
          overflow: hidden;
        }
        .devradar-toolbar {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 12px 20px;
          border-bottom: 1px solid #30363d;
          background: rgba(13, 17, 23, 0.6);
        }
        .devradar-sort-tabs {
          display: flex;
          gap: 4px;
        }
        .devradar-sort-tab {
          padding: 6px 14px;
          background: transparent;
          border: 1px solid transparent;
          border-radius: 6px;
          color: #8b949e;
          cursor: pointer;
          font-size: 13px;
          transition: all 0.2s;
        }
        .devradar-sort-tab:hover {
          color: #c9d1d9;
          background: rgba(255, 255, 255, 0.04);
        }
        .devradar-sort-tab.active {
          color: #7c6cf0;
          background: rgba(124, 108, 240, 0.1);
          border-color: rgba(124, 108, 240, 0.2);
        }
        .devradar-last-update {
          font-size: 12px;
          color: #8b949e;
        }
        .devradar-feed {
          flex: 1;
          overflow-y: auto;
          padding: 16px;
        }
        .devradar-item {
          padding: 16px;
          border: 1px solid #30363d;
          border-radius: 12px;
          margin-bottom: 12px;
          cursor: pointer;
          transition: all 0.2s;
          background: #161b22;
        }
        .devradar-item:hover {
          border-color: #7c6cf0;
          transform: translateY(-1px);
          box-shadow: 0 4px 16px rgba(0, 0, 0, 0.3);
        }
        .devradar-item.fav {
          border-color: rgba(255, 193, 7, 0.3);
        }
        .devradar-item-header {
          display: flex;
          align-items: flex-start;
          gap: 12px;
          margin-bottom: 8px;
        }
        .devradar-item-badge {
          padding: 2px 8px;
          border-radius: 4px;
          font-size: 10px;
          font-weight: 600;
          text-transform: uppercase;
          flex-shrink: 0;
          color: white;
        }
        .devradar-item-title {
          font-size: 15px;
          font-weight: 600;
          color: #e6edf3;
          line-height: 1.4;
          flex: 1;
        }
        .devradar-item-title a {
          color: inherit;
          text-decoration: none;
        }
        .devradar-item-title a:hover {
          color: #7c6cf0;
        }
        .devradar-item-fav-btn {
          background: none;
          border: none;
          cursor: pointer;
          font-size: 18px;
          color: #8b949e;
          padding: 4px;
          transition: color 0.2s;
        }
        .devradar-item-fav-btn:hover {
          color: #ffc107;
        }
        .devradar-item-fav-btn.active {
          color: #ffc107;
        }
        .devradar-item-desc {
          font-size: 13px;
          color: #8b949e;
          line-height: 1.5;
          margin-bottom: 10px;
          overflow: hidden;
          display: -webkit-box;
          -webkit-line-clamp: 2;
          -webkit-box-orient: vertical;
        }
        .devradar-item-meta {
          display: flex;
          align-items: center;
          gap: 16px;
          font-size: 12px;
          color: #8b949e;
        }
        .devradar-item-meta-item {
          display: flex;
          align-items: center;
          gap: 4px;
        }
        .devradar-item-lang {
          padding: 2px 8px;
          border-radius: 4px;
          font-size: 11px;
          font-weight: 500;
        }
        .devradar-item-tags {
          display: flex;
          gap: 6px;
          flex-wrap: wrap;
          margin-top: 8px;
        }
        .devradar-tag {
          padding: 2px 8px;
          background: rgba(124, 108, 240, 0.1);
          color: #7c6cf0;
          border-radius: 4px;
          font-size: 11px;
        }
        .devradar-loading {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          height: 100%;
          gap: 16px;
        }
        .devradar-spinner {
          width: 32px;
          height: 32px;
          border: 3px solid #30363d;
          border-top-color: #7c6cf0;
          border-radius: 50%;
          animation: devradarSpin 0.8s linear infinite;
        }
        @keyframes devradarSpin {
          to { transform: rotate(360deg); }
        }
        .devradar-empty {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          height: 100%;
          color: #8b949e;
          gap: 8px;
        }
        .devradar-detail-panel {
          width: 400px;
          border-left: 1px solid #30363d;
          padding: 20px;
          overflow-y: auto;
          background: rgba(13, 17, 23, 0.6);
        }
        .devradar-detail-close {
          background: none;
          border: none;
          color: #8b949e;
          cursor: pointer;
          font-size: 20px;
          float: right;
        }
        .devradar-detail-title {
          font-size: 18px;
          font-weight: 700;
          margin: 12px 0 16px;
          color: #e6edf3;
        }
        .devradar-detail-desc {
          font-size: 14px;
          line-height: 1.6;
          color: #c9d1d9;
          margin-bottom: 20px;
        }
        .devradar-detail-link {
          display: inline-block;
          padding: 8px 16px;
          background: #7c6cf0;
          color: white;
          text-decoration: none;
          border-radius: 8px;
          font-size: 13px;
          font-weight: 600;
          transition: opacity 0.2s;
        }
        .devradar-detail-link:hover {
          opacity: 0.9;
        }
      `}</style>

      {/* 侧边栏 */}
      <div className="devradar-sidebar">
        <div className="devradar-header">
          <div className="devradar-logo">
            <div className="devradar-logo-icon">R</div>
            <div className="devradar-logo-text">DevRadar</div>
          </div>
          <input
            type="text"
            className="devradar-search"
            placeholder="搜索技术资讯..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>

        <div className="devradar-sources">
          <ul className="devradar-source-list">
            {(['all', 'hackernews', 'github-trending', 'github-releases'] as FeedSource[]).map((s) => (
              <li
                key={s}
                className={`devradar-source-item ${source === s ? 'active' : ''}`}
                onClick={() => setSource(s)}
              >
                <span
                  className="devradar-source-dot"
                  style={{ background: sourceColors[s] }}
                />
                <span className="devradar-source-name">{sourceLabels[s]}</span>
                <span className="devradar-source-count">
                  {s === 'all' ? items.length : items.filter((i) => i.source === s).length}
                </span>
              </li>
            ))}
          </ul>
        </div>

        <div className="devradar-controls">
          <div className="devradar-control-row">
            <span className="devradar-control-label">仅看收藏</span>
            <div
              className={`devradar-toggle ${showFavoritesOnly ? 'on' : ''}`}
              onClick={() => setShowFavoritesOnly(!showFavoritesOnly)}
            />
          </div>
          <div className="devradar-control-row">
            <span className="devradar-control-label">自动刷新</span>
            <div
              className={`devradar-toggle ${autoRefresh ? 'on' : ''}`}
              onClick={() => setAutoRefresh(!autoRefresh)}
            />
          </div>
          <button className="devradar-refresh-btn" onClick={() => setRefreshKey((k) => k + 1)}>
            {loading ? '加载中...' : '刷新数据'}
          </button>
        </div>
      </div>

      {/* 主内容区 */}
      <div className="devradar-main">
        <div className="devradar-toolbar">
          <div className="devradar-sort-tabs">
            {(['popular', 'latest', 'trending'] as SortMode[]).map((m) => (
              <button
                key={m}
                className={`devradar-sort-tab ${sortMode === m ? 'active' : ''}`}
                onClick={() => setSortMode(m)}
              >
                {m === 'popular' ? '热门' : m === 'latest' ? '最新' : '趋势'}
              </button>
            ))}
          </div>
          {lastUpdate && (
            <span className="devradar-last-update">
              更新于 {lastUpdate.toLocaleTimeString('zh-CN')}
            </span>
          )}
        </div>

        <div className="devradar-feed">
          {loading ? (
            <div className="devradar-loading">
              <div className="devradar-spinner" />
              <span>正在聚合技术资讯...</span>
            </div>
          ) : error ? (
            <div className="devradar-empty">
              <span>{error}</span>
              <button className="devradar-refresh-btn" onClick={() => setRefreshKey((k) => k + 1)}>
                重试
              </button>
            </div>
          ) : filteredItems.length === 0 ? (
            <div className="devradar-empty">
              <span>暂无匹配内容</span>
            </div>
          ) : (
            filteredItems.map((item) => (
              <div
                key={item.id}
                className={`devradar-item ${favorites.has(item.id) ? 'fav' : ''}`}
                onClick={() => setSelectedItem(item)}
              >
                <div className="devradar-item-header">
                  <span
                    className="devradar-item-badge"
                    style={{ background: sourceColors[item.source] }}
                  >
                    {sourceLabels[item.source]}
                  </span>
                  <div className="devradar-item-title">
                    {item.url ? (
                      <a href={item.url} target="_blank" rel="noopener noreferrer">
                        {item.title}
                      </a>
                    ) : (
                      item.title
                    )}
                  </div>
                  <button
                    className={`devradar-item-fav-btn ${favorites.has(item.id) ? 'active' : ''}`}
                    onClick={(e) => {
                      e.stopPropagation()
                      toggleFavorite(item.id)
                    }}
                  >
                    {favorites.has(item.id) ? '★' : '☆'}
                  </button>
                </div>
                {item.description && (
                  <div className="devradar-item-desc">{item.description}</div>
                )}
                <div className="devradar-item-meta">
                  {item.score !== undefined && (
                    <span className="devradar-item-meta-item">
                      ↑ {item.score}
                    </span>
                  )}
                  {item.comments !== undefined && (
                    <span className="devradar-item-meta-item">
                      💬 {item.comments}
                    </span>
                  )}
                  {item.stars !== undefined && (
                    <span className="devradar-item-meta-item">
                      ★ {item.stars.toLocaleString()}
                    </span>
                  )}
                  {item.forks !== undefined && (
                    <span className="devradar-item-meta-item">
                      🍴 {item.forks.toLocaleString()}
                    </span>
                  )}
                  {item.author && (
                    <span className="devradar-item-meta-item">@{item.author}</span>
                  )}
                  {item.language && (
                    <span
                      className="devradar-item-lang"
                      style={{
                        background: langColors[item.language] || '#8b949e22',
                        color: langColors[item.language] || '#8b949e',
                      }}
                    >
                      {item.language}
                    </span>
                  )}
                </div>
                {item.tags && item.tags.length > 0 && (
                  <div className="devradar-item-tags">
                    {item.tags.map((tag, i) => (
                      <span key={i} className="devradar-tag">{tag}</span>
                    ))}
                  </div>
                )}
              </div>
            ))
          )}
        </div>
      </div>

      {/* 详情面板 */}
      {selectedItem && (
        <div className="devradar-detail-panel">
          <button
            className="devradar-detail-close"
            onClick={() => setSelectedItem(null)}
          >
            ×
          </button>
          <h2 className="devradar-detail-title">{selectedItem.title}</h2>
          {selectedItem.description && (
            <p className="devradar-detail-desc">{selectedItem.description}</p>
          )}
          {selectedItem.url && (
            <a
              className="devradar-detail-link"
              href={selectedItem.url}
              target="_blank"
              rel="noopener noreferrer"
            >
              查看原文 →
            </a>
          )}
        </div>
      )}
    </div>
  )
})

const langColors: Record<string, string> = {
  JavaScript: '#f1e05a',
  TypeScript: '#3178c6',
  Python: '#3572A5',
  Java: '#b07219',
  Go: '#00ADD8',
  Rust: '#dea584',
  C: '#555555',
  'C++': '#f34b7d',
  Ruby: '#701516',
  PHP: '#4F5D95',
  Swift: '#F05138',
  Kotlin: '#A97BFF',
  Dart: '#00B4AB',
  Shell: '#89e051',
  HTML: '#e34c26',
  CSS: '#563d7c',
  Vue: '#41b883',
}

export default DevRadar
