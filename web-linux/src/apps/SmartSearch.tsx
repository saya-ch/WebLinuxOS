import { useState, useEffect, useCallback, useMemo } from 'react'

interface SearchResult {
  title: string
  description: string
  url: string
  source: string
  thumbnail?: string
}

interface NewsResult {
  title: string
  description: string
  url: string
  source: string
  publishedAt: string
  image?: string
}

interface SearchHistory {
  query: string
  timestamp: number
}

const STORAGE_KEY = 'weblinux-smart-search-history'

const loadHistory = (): SearchHistory[] => {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return []
    const parsed = JSON.parse(raw)
    return Array.isArray(parsed) ? parsed.slice(-20) : []
  } catch {
    return []
  }
}

const saveHistory = (history: SearchHistory[]) => {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(history.slice(-20)))
  } catch {
    // silent
  }
}

const SearchEngineAPI = async (query: string): Promise<SearchResult[]> => {
  try {
    const response = await fetch(
      `https://www.googleapis.com/customsearch/v1?key=AIzaSyDqCgZ3L7cGqT8Yb7Q3j7v7gH8K7L7d7R7&cx=017576662512468239146:omuauf_lfve&q=${encodeURIComponent(query)}`,
      { mode: 'cors' }
    )
    const data = await response.json()
    if (!data.items) return []
    return data.items.map((item: any) => ({
      title: item.title,
      description: item.snippet,
      url: item.link,
      source: item.displayLink,
      thumbnail: item.pagemap?.cse_image?.[0]?.src
    }))
  } catch {
    return []
  }
}

const NewsAPI = async (query: string): Promise<NewsResult[]> => {
  try {
    const response = await fetch(
      `https://newsapi.org/v2/everything?q=${encodeURIComponent(query)}&apiKey=pub_353655443e9b96375b53490f89c37e083985&language=zh&pageSize=10`,
      { mode: 'cors' }
    )
    const data = await response.json()
    if (!data.articles) return []
    return data.articles.map((article: any) => ({
      title: article.title,
      description: article.description,
      url: article.url,
      source: article.source.name,
      publishedAt: article.publishedAt,
      image: article.urlToImage
    }))
  } catch {
    return []
  }
}

const SmartSearch = () => {
  const [query, setQuery] = useState('')
  const [activeTab, setActiveTab] = useState<'web' | 'news'>('web')
  const [searchResults, setSearchResults] = useState<SearchResult[]>([])
  const [newsResults, setNewsResults] = useState<NewsResult[]>([])
  const [loading, setLoading] = useState(false)
  const [history, setHistory] = useState<SearchHistory[]>(() => loadHistory())
  const [suggestions, setSuggestions] = useState<string[]>([])

  const popularSearches = useMemo(() => [
    'React 19新特性',
    'TypeScript最佳实践',
    'WebAssembly教程',
    'AI编程助手',
    '前端性能优化',
    'GitHub热门项目',
    '技术博客',
    '开源工具'
  ], [])

  useEffect(() => {
    if (query.length > 2) {
      const timeout = setTimeout(() => {
        const filtered = popularSearches.filter(s =>
          s.toLowerCase().includes(query.toLowerCase())
        )
        setSuggestions(filtered)
      }, 300)
      return () => clearTimeout(timeout)
    } else {
      setSuggestions([])
    }
  }, [query, popularSearches])

  const performSearch = useCallback(async () => {
    if (!query.trim()) return

    setLoading(true)
    setHistory(prev => {
      const newHistory = [{ query: query.trim(), timestamp: Date.now() }, ...prev]
      saveHistory(newHistory)
      return newHistory
    })

    try {
      if (activeTab === 'web') {
        const results = await SearchEngineAPI(query)
        setSearchResults(results)
      } else {
        const results = await NewsAPI(query)
        setNewsResults(results)
      }
    } catch (error) {
      console.error('Search failed:', error)
    } finally {
      setLoading(false)
    }
  }, [query, activeTab])

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      performSearch()
    }
  }

  const clearHistory = () => {
    setHistory([])
    saveHistory([])
  }

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr)
    const now = new Date()
    const diff = now.getTime() - date.getTime()
    const hours = Math.floor(diff / (1000 * 60 * 60))
    const days = Math.floor(hours / 24)
    if (hours < 1) return '刚刚'
    if (hours < 24) return `${hours}小时前`
    if (days < 7) return `${days}天前`
    return date.toLocaleDateString()
  }

  return (
    <div style={{
      height: '100%',
      display: 'flex',
      flexDirection: 'column',
      backgroundColor: '#1e1e2e',
      color: '#e0e0e8'
    }}>
      <div style={{
        padding: '16px',
        borderBottom: '1px solid #3a3a5c',
        backgroundColor: '#1a1a2e'
      }}>
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '12px',
          marginBottom: '12px'
        }}>
          <div style={{
            width: '40px',
            height: '40px',
            borderRadius: '8px',
            background: 'linear-gradient(135deg, #6c5ce7, #a29bfe)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '20px'
          }}>🔍</div>
          <div style={{ flex: 1 }}>
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder="输入搜索关键词..."
              style={{
                width: '100%',
                padding: '10px 16px',
                borderRadius: '12px',
                border: 'none',
                outline: 'none',
                backgroundColor: '#2d2d44',
                color: '#e0e0e8',
                fontSize: '14px',
                fontFamily: 'monospace'
              }}
            />
            {suggestions.length > 0 && (
              <div style={{
                position: 'absolute',
                marginTop: '4px',
                width: 'calc(100% - 68px)',
                backgroundColor: '#2d2d44',
                borderRadius: '8px',
                border: '1px solid #3a3a5c',
                boxShadow: '0 4px 12px rgba(0,0,0,0.3)',
                zIndex: 100
              }}>
                {suggestions.map((suggestion, idx) => (
                  <div
                    key={idx}
                    onClick={() => {
                      setQuery(suggestion)
                      setSuggestions([])
                    }}
                    style={{
                    padding: '8px 16px',
                    cursor: 'pointer'
                  }}
                  >{suggestion}</div>
                ))}
              </div>
            )}
          </div>
          <button
            onClick={performSearch}
            disabled={loading || !query.trim()}
            style={{
              padding: '10px 24px',
              borderRadius: '12px',
              border: 'none',
              backgroundColor: '#6c5ce7',
              color: 'white',
              cursor: loading ? 'wait' : 'pointer',
              fontSize: '14px',
              fontWeight: '500',
              opacity: (loading || !query.trim()) ? 0.5 : 1
            }}
          >
            {loading ? '搜索中...' : '搜索'}
          </button>
        </div>

        <div style={{ display: 'flex', gap: '8px' }}>
          <button
            onClick={() => setActiveTab('web')}
            style={{
              padding: '6px 16px',
              borderRadius: '6px',
              border: activeTab === 'web' ? '1px solid #6c5ce7' : '1px solid #3a3a5c',
              backgroundColor: activeTab === 'web' ? '#6c5ce722' : 'transparent',
              color: '#e0e0e8',
              cursor: 'pointer',
              fontSize: '13px'
            }}
          >网页搜索</button>
          <button
            onClick={() => setActiveTab('news')}
            style={{
              padding: '6px 16px',
              borderRadius: '6px',
              border: activeTab === 'news' ? '1px solid #6c5ce7' : '1px solid #3a3a5c',
              backgroundColor: activeTab === 'news' ? '#6c5ce722' : 'transparent',
              color: '#e0e0e8',
              cursor: 'pointer',
              fontSize: '13px'
            }}
          >新闻资讯</button>
        </div>
      </div>

      <div style={{ flex: 1, overflow: 'auto', padding: '16px' }}>
        {!query && !loading && (
          <div>
            <div style={{ marginBottom: '16px' }}>
              <h3 style={{ fontSize: '14px', fontWeight: '500', color: '#a0a0b0', marginBottom: '8px' }}>热门搜索</h3>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                {popularSearches.map((search, idx) => (
                  <button
                    key={idx}
                    onClick={() => {
                      setQuery(search)
                      setActiveTab('web')
                    }}
                    style={{
                padding: '6px 12px',
                borderRadius: '20px',
                border: '1px solid #3a3a5c',
                backgroundColor: '#2d2d44',
                color: '#e0e0e8',
                cursor: 'pointer',
                fontSize: '12px'
              }}
            >{search}</button>
                ))}
              </div>
            </div>

            {history.length > 0 && (
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                  <h3 style={{ fontSize: '14px', fontWeight: '500', color: '#a0a0b0' }}>搜索历史</h3>
                  <button
                    onClick={clearHistory}
                    style={{
                      padding: '4px 8px',
                      border: 'none',
                      backgroundColor: 'transparent',
                      color: '#d63031',
                      cursor: 'pointer',
                      fontSize: '12px'
                    }}
                  >清空</button>
                </div>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                  {history.map((item, idx) => (
                    <button
                      key={idx}
                      onClick={() => {
                        setQuery(item.query)
                        setActiveTab('web')
                      }}
                      style={{
                        padding: '6px 12px',
                        borderRadius: '20px',
                        border: '1px solid #3a3a5c',
                        backgroundColor: '#2d2d44',
                        color: '#a0a0b0',
                        cursor: 'pointer',
                        fontSize: '12px'
                      }}
                    >{item.query}</button>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {loading && (
          <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '200px' }}>
            <div style={{ fontSize: '24px' }}>🔍 搜索中...</div>
          </div>
        )}

        {query && !loading && activeTab === 'web' && searchResults.length === 0 && (
          <div style={{ textAlign: 'center', padding: '40px', color: '#a0a0b0' }}>
            <div style={{ fontSize: '48px', marginBottom: '16px' }}>🔍</div>
            <p>未找到相关结果，请尝试其他关键词</p>
          </div>
        )}

        {query && !loading && activeTab === 'web' && searchResults.length > 0 && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            {searchResults.map((result, idx) => (
              <a
                key={idx}
                href={result.url}
                target="_blank"
                rel="noopener noreferrer"
                style={{
                  textDecoration: 'none',
                  padding: '12px',
                  borderRadius: '8px',
                  backgroundColor: '#2d2d44',
                  border: '1px solid transparent'
                }}
              >
                <div style={{ display: 'flex', gap: '12px' }}>
                  {result.thumbnail && (
                    <img
                      src={result.thumbnail}
                      alt=""
                      style={{ width: '80px', height: '60px', objectFit: 'cover', borderRadius: '4px' }}
                    />
                  )}
                  <div style={{ flex: 1 }}>
                    <h4 style={{ fontSize: '14px', fontWeight: '500', color: '#6c5ce7', marginBottom: '4px' }}>
                      {result.title}
                    </h4>
                    <p style={{ fontSize: '13px', color: '#a0a0b0', marginBottom: '4px', lineHeight: '1.5' }}>
                      {result.description}
                    </p>
                    <p style={{ fontSize: '12px', color: '#666' }}>{result.source}</p>
                  </div>
                </div>
              </a>
            ))}
          </div>
        )}

        {query && !loading && activeTab === 'news' && newsResults.length === 0 && (
          <div style={{ textAlign: 'center', padding: '40px', color: '#a0a0b0' }}>
            <div style={{ fontSize: '48px', marginBottom: '16px' }}>📰</div>
            <p>未找到相关新闻，请尝试其他关键词</p>
          </div>
        )}

        {query && !loading && activeTab === 'news' && newsResults.length > 0 && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            {newsResults.map((result, idx) => (
              <a
                key={idx}
                href={result.url}
                target="_blank"
                rel="noopener noreferrer"
                style={{
                  textDecoration: 'none',
                  padding: '12px',
                  borderRadius: '8px',
                  backgroundColor: '#2d2d44',
                  border: '1px solid transparent'
                }}
              >
                <div style={{ display: 'flex', gap: '12px' }}>
                  {result.image && (
                    <img
                      src={result.image}
                      alt=""
                      style={{ width: '100px', height: '70px', objectFit: 'cover', borderRadius: '4px' }}
                    />
                  )}
                  <div style={{ flex: 1 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
                      <h4 style={{ fontSize: '14px', fontWeight: '500', color: '#6c5ce7' }}>
                        {result.title}
                      </h4>
                      <span style={{ fontSize: '11px', color: '#666' }}>{formatDate(result.publishedAt)}</span>
                    </div>
                    <p style={{ fontSize: '13px', color: '#a0a0b0', marginBottom: '4px', lineHeight: '1.5' }}>
                      {result.description}
                    </p>
                    <p style={{ fontSize: '12px', color: '#666' }}>{result.source}</p>
                  </div>
                </div>
              </a>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

export default SmartSearch