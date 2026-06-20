import { useState, useEffect, useCallback } from 'react'

interface Story {
  id: number
  title: string
  by: string
  url?: string
  score: number
  time: number
  descendants: number
  type: string
}

interface Category {
  id: string
  name: string
  endpoint: string
  icon: string
}

const CATEGORIES: Category[] = [
  { id: 'top', name: '热门', endpoint: 'topstories', icon: '🔥' },
  { id: 'new', name: '最新', endpoint: 'newstories', icon: '⚡' },
  { id: 'best', name: '精选', endpoint: 'beststories', icon: '⭐' },
  { id: 'ask', name: '问答', endpoint: 'askstories', icon: '❓' },
  { id: 'show', name: '展示', endpoint: 'showstories', icon: '👀' },
  { id: 'job', name: '招聘', endpoint: 'jobstories', icon: '💼' },
]

const formatTime = (timestamp: number): string => {
  const now = Date.now() / 1000
  const diff = now - timestamp
  
  if (diff < 60) return '刚刚'
  if (diff < 3600) return `${Math.floor(diff / 60)} 分钟前`
  if (diff < 86400) return `${Math.floor(diff / 3600)} 小时前`
  if (diff < 604800) return `${Math.floor(diff / 86400)} 天前`
  
  const date = new Date(timestamp * 1000)
  return `${date.getMonth() + 1}/${date.getDate()}`
}

export default function NewsReader() {
  const [stories, setStories] = useState<Story[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [activeCategory, setActiveCategory] = useState('top')
  const [searchQuery, setSearchQuery] = useState('')
  const [searchResults, setSearchResults] = useState<Story[]>([])
  const [isSearching, setIsSearching] = useState(false)
  const [page, setPage] = useState(0)
  const [hasMore, setHasMore] = useState(true)
  const [storyIds, setStoryIds] = useState<number[]>([])

  const fetchStoryIds = useCallback(async (category: string) => {
    setLoading(true)
    setError(null)
    setStories([])
    setPage(0)
    setHasMore(true)
    
    try {
      const cat = CATEGORIES.find(c => c.id === category)
      if (!cat) return
      
      const response = await fetch(
        `https://hacker-news.firebaseio.com/v0/${cat.endpoint}.json`
      )
      if (!response.ok) throw new Error('网络请求失败')
      const ids: number[] = await response.json()
      setStoryIds(ids || [])
      
      // 加载前20个故事
      if (ids && ids.length > 0) {
        const first20Ids = ids.slice(0, 20)
        const storyPromises = first20Ids.map(id =>
          fetch(`https://hacker-news.firebaseio.com/v0/item/${id}.json`).then(r => r.json())
        )
        const fetchedStories = await Promise.all(storyPromises)
        setStories(fetchedStories.filter(s => s && s.title))
        setHasMore(ids.length > 20)
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : '获取新闻失败')
    } finally {
      setLoading(false)
    }
  }, [])

  const loadMore = useCallback(async () => {
    if (loading || !hasMore || storyIds.length === 0) return
    
    setLoading(true)
    try {
      const nextPage = page + 1
      const start = nextPage * 20
      const end = start + 20
      const nextIds = storyIds.slice(start, end)
      
      if (nextIds.length === 0) {
        setHasMore(false)
        return
      }
      
      const storyPromises = nextIds.map(id =>
        fetch(`https://hacker-news.firebaseio.com/v0/item/${id}.json`).then(r => r.json())
      )
      const fetchedStories = await Promise.all(storyPromises)
      const validStories = fetchedStories.filter(s => s && s.title)
      
      setStories(prev => [...prev, ...validStories])
      setPage(nextPage)
      setHasMore(end < storyIds.length)
    } catch (err) {
      setError(err instanceof Error ? err.message : '加载更多失败')
    } finally {
      setLoading(false)
    }
  }, [loading, hasMore, storyIds, page])

  const searchStories = useCallback(async (query: string) => {
    if (query.length < 2) {
      setSearchResults([])
      setIsSearching(false)
      return
    }
    
    setIsSearching(true)
    try {
      const response = await fetch(
        `https://hn.algolia.com/api/v1/search?query=${encodeURIComponent(query)}&hitsPerPage=30`
      )
      if (!response.ok) throw new Error('搜索失败')
      const data = await response.json()
      
      const results: Story[] = data.hits.map((hit: any) => ({
        id: hit.objectID,
        title: hit.title,
        by: hit.author,
        url: hit.url,
        score: hit.points,
        time: hit.created_at_i,
        descendants: hit.num_comments || 0,
        type: hit.type || 'story',
      }))
      
      setSearchResults(results)
    } catch (err) {
      console.error('搜索错误:', err)
    } finally {
      setIsSearching(false)
    }
  }, [])

  useEffect(() => {
    fetchStoryIds(activeCategory)
  }, [activeCategory, fetchStoryIds])

  const handleCategoryChange = (categoryId: string) => {
    setActiveCategory(categoryId)
    setSearchQuery('')
    setSearchResults([])
  }

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value
    setSearchQuery(value)
    if (value.length >= 2) {
      searchStories(value)
    } else {
      setSearchResults([])
    }
  }

  const openStory = (story: Story) => {
    if (story.url) {
      window.open(story.url, '_blank')
    } else {
      window.open(`https://news.ycombinator.com/item?id=${story.id}`, '_blank')
    }
  }

  const displayStories = searchQuery.length >= 2 ? searchResults : stories

  return (
    <div className="app-container" style={{ 
      background: 'var(--window-bg)', 
      padding: 16, 
      overflow: 'auto',
      height: '100%'
    }}>
      {/* 标题 */}
      <div style={{ textAlign: 'center', marginBottom: 16 }}>
        <div style={{ fontSize: 18, fontWeight: 600, color: 'var(--text-primary)' }}>
          📰 Hacker News
        </div>
        <div style={{ fontSize: 11, color: 'var(--text-secondary)', marginTop: 2 }}>
          技术新闻与讨论
        </div>
      </div>

      {/* 搜索框 */}
      <div style={{ marginBottom: 12 }}>
        <input
          type="text"
          value={searchQuery}
          onChange={handleSearchChange}
          placeholder="搜索新闻..."
          style={{
            width: '100%',
            padding: '10px 14px',
            background: 'var(--window-bg)',
            border: '1px solid var(--window-border)',
            borderRadius: 8,
            color: 'var(--text-primary)',
            fontSize: 13,
            outline: 'none',
          }}
        />
        {isSearching && (
          <div style={{ textAlign: 'center', marginTop: 8, color: 'var(--text-secondary)' }}>
            搜索中...
          </div>
        )}
      </div>

      {/* 分类标签 */}
      <div style={{ 
        display: 'flex', 
        gap: 6, 
        marginBottom: 12,
        overflowX: 'auto',
        paddingBottom: 4
      }}>
        {CATEGORIES.map(cat => (
          <button
            key={cat.id}
            onClick={() => handleCategoryChange(cat.id)}
            style={{
              padding: '6px 12px',
              background: activeCategory === cat.id ? 'var(--accent)' : 'rgba(255,255,255,0.08)',
              border: 'none',
              borderRadius: 6,
              color: activeCategory === cat.id ? '#fff' : 'var(--text-primary)',
              fontSize: 12,
              cursor: 'pointer',
              whiteSpace: 'nowrap',
              transition: 'background 0.15s',
            }}
          >
            {cat.icon} {cat.name}
          </button>
        ))}
      </div>

      {/* 加载状态 */}
      {loading && stories.length === 0 && (
        <div style={{ textAlign: 'center', padding: 40 }}>
          <div style={{ fontSize: 48, marginBottom: 16 }}>📰</div>
          <div style={{ color: 'var(--text-secondary)' }}>正在加载新闻...</div>
        </div>
      )}

      {/* 错误状态 */}
      {error && (
        <div style={{ 
          textAlign: 'center', 
          padding: 20,
          background: 'rgba(244,71,71,0.1)',
          borderRadius: 8
        }}>
          <div style={{ color: '#f44747' }}>{error}</div>
          <button
            onClick={() => fetchStoryIds(activeCategory)}
            style={{
              marginTop: 12,
              padding: '8px 16px',
              background: 'var(--accent)',
              border: 'none',
              borderRadius: 6,
              color: '#fff',
              cursor: 'pointer',
            }}
          >
            重试
          </button>
        </div>
      )}

      {/* 新闻列表 */}
      {!loading && !error && displayStories.length === 0 && (
        <div style={{ textAlign: 'center', padding: 40, color: 'var(--text-secondary)' }}>
          {searchQuery.length >= 2 ? '未找到相关新闻' : '暂无新闻'}
        </div>
      )}

      {displayStories.length > 0 && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {displayStories.map((story, i) => (
            <div
              key={story.id || i}
              onClick={() => openStory(story)}
              style={{
                padding: '12px 14px',
                background: 'rgba(255,255,255,0.05)',
                borderRadius: 8,
                cursor: 'pointer',
                transition: 'background 0.15s',
              }}
            >
              <div style={{ 
                fontSize: 14, 
                fontWeight: 500, 
                color: 'var(--text-primary)',
                marginBottom: 6,
                lineHeight: 1.4
              }}>
                {story.title}
              </div>
              <div style={{ 
                display: 'flex', 
                alignItems: 'center', 
                gap: 12,
                fontSize: 12,
                color: 'var(--text-secondary)'
              }}>
                <span>👍 {story.score}</span>
                <span>💬 {story.descendants || 0}</span>
                <span>👤 {story.by}</span>
                <span>🕐 {formatTime(story.time)}</span>
              </div>
              {story.url && (
                <div style={{ 
                  fontSize: 11, 
                  color: 'var(--accent)', 
                  marginTop: 4,
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  whiteSpace: 'nowrap'
                }}>
                  {new URL(story.url).hostname}
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* 加载更多按钮 */}
      {!searchQuery && hasMore && stories.length > 0 && (
        <button
          onClick={loadMore}
          disabled={loading}
          style={{
            marginTop: 12,
            width: '100%',
            padding: '12px',
            background: 'rgba(255,255,255,0.08)',
            border: '1px solid var(--window-border)',
            borderRadius: 8,
            color: 'var(--text-primary)',
            fontSize: 13,
            cursor: loading ? 'not-allowed' : 'pointer',
            opacity: loading ? 0.6 : 1,
          }}
        >
          {loading ? '加载中...' : '加载更多'}
        </button>
      )}

      {/* 数据来源 */}
      <div style={{ textAlign: 'center', marginTop: 12, fontSize: 11, color: 'var(--text-secondary)' }}>
        数据来源: Hacker News API
      </div>
    </div>
  )
}