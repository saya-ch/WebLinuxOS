import { useState, useEffect, useCallback, useRef } from 'react'

interface GitHubRepo {
  id: number
  name: string
  full_name: string
  description: string
  html_url: string
  stargazers_count: number
  forks_count: number
  language: string
  updated_at: string
  owner: {
    login: string
    avatar_url: string
  }
}

type SortOption = 'stars' | 'forks' | 'updated'
type TrendingMode = 'stars' | 'created'

const LANGUAGE_COLORS: Record<string, string> = {
  JavaScript: '#f1e05a',
  TypeScript: '#3178c6',
  Python: '#3572A5',
  Rust: '#dea584',
  Go: '#00ADD8',
  Java: '#b07219',
  'C++': '#f34b7d',
  Ruby: '#701516',
  Swift: '#F05138',
  Kotlin: '#A97BFF',
  Shell: '#89e051',
  Dart: '#00B4AB',
  CSS: '#563d7c',
  HTML: '#e34c26',
}

const LANGUAGE_OPTIONS = [
  { value: '', label: '全部语言' },
  { value: 'javascript', label: 'JavaScript' },
  { value: 'typescript', label: 'TypeScript' },
  { value: 'python', label: 'Python' },
  { value: 'rust', label: 'Rust' },
  { value: 'go', label: 'Go' },
  { value: 'java', label: 'Java' },
  { value: 'cpp', label: 'C++' },
  { value: 'ruby', label: 'Ruby' },
  { value: 'swift', label: 'Swift' },
  { value: 'kotlin', label: 'Kotlin' },
  { value: 'shell', label: 'Shell' },
  { value: 'dart', label: 'Dart' },
  { value: 'css', label: 'CSS' },
  { value: 'html', label: 'HTML' },
]

const SORT_OPTIONS: { value: SortOption; label: string }[] = [
  { value: 'stars', label: '星标数' },
  { value: 'forks', label: 'Fork数' },
  { value: 'updated', label: '更新时间' },
]

const HISTORY_KEY = 'osh-search-history-v1'
const MAX_HISTORY = 10

export default function OpenSourceHub() {
  const [query, setQuery] = useState('')
  const [language, setLanguage] = useState('')
  const [sort, setSort] = useState<SortOption>('stars')
  const [repos, setRepos] = useState<GitHubRepo[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [searchHistory, setSearchHistory] = useState<string[]>(() => {
    try {
      return JSON.parse(localStorage.getItem(HISTORY_KEY) || '[]')
    } catch {
      return []
    }
  })
  const [trendingMode, setTrendingMode] = useState<TrendingMode>('stars')
  const [activeTab, setActiveTab] = useState<'search' | 'trending'>('trending')
  const [showHistory, setShowHistory] = useState(false)
  const searchInputRef = useRef<HTMLInputElement>(null)
  const searchTimeoutRef = useRef<number | null>(null)

  const formatNumber = (num: number): string => {
    if (num >= 1000000) return (num / 1000000).toFixed(1) + 'M'
    if (num >= 1000) return (num / 1000).toFixed(1) + 'K'
    return num.toString()
  }

  const formatDate = (dateStr: string): string => {
    const date = new Date(dateStr)
    const now = new Date()
    const diff = now.getTime() - date.getTime()
    const days = Math.floor(diff / (1000 * 60 * 60 * 24))
    if (days === 0) return '今天'
    if (days === 1) return '昨天'
    if (days < 30) return `${days}天前`
    if (days < 365) return `${Math.floor(days / 30)}个月前`
    return `${Math.floor(days / 365)}年前`
  }

  const addSearchHistory = useCallback((q: string) => {
    if (!q.trim()) return
    setSearchHistory(prev => {
      const filtered = prev.filter(h => h !== q.trim())
      const next = [q.trim(), ...filtered].slice(0, MAX_HISTORY)
      try {
        localStorage.setItem(HISTORY_KEY, JSON.stringify(next))
      } catch { /* ignore */ }
      return next
    })
  }, [])

  const removeSearchHistory = useCallback((item: string) => {
    setSearchHistory(prev => {
      const next = prev.filter(h => h !== item)
      try {
        localStorage.setItem(HISTORY_KEY, JSON.stringify(next))
      } catch { /* ignore */ }
      return next
    })
  }, [])

  const fetchSearch = useCallback(async (searchQuery: string, lang: string, sortOpt: SortOption) => {
    if (!searchQuery.trim()) {
      setRepos([])
      setError(null)
      return
    }
    setLoading(true)
    setError(null)
    try {
      let q = encodeURIComponent(searchQuery.trim())
      if (lang) q += `+language:${lang}`
      const url = `https://api.github.com/search/repositories?q=${q}&sort=${sortOpt}&order=desc&per_page=20`
      const res = await fetch(url, { headers: { Accept: 'application/vnd.github+json' } })
      if (res.status === 403) {
        const reset = res.headers.get('X-RateLimit-Reset')
        const resetTime = reset
          ? new Date(parseInt(reset, 10) * 1000).toLocaleTimeString('zh-CN')
          : '稍后'
        throw new Error(`API 速率限制，${resetTime} 后恢复`)
      }
      if (!res.ok) throw new Error(`请求失败: ${res.status} ${res.statusText}`)
      const data = await res.json()
      setRepos(data.items || [])
      addSearchHistory(searchQuery.trim())
    } catch (err) {
      setError(err instanceof Error ? err.message : '搜索失败')
      setRepos([])
    } finally {
      setLoading(false)
    }
  }, [addSearchHistory])

  const fetchTrending = useCallback(async (mode: TrendingMode, lang: string) => {
    setLoading(true)
    setError(null)
    try {
      let q: string
      if (mode === 'created') {
        const since = new Date(Date.now() - 365 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
        q = `created:>${since}`
      } else {
        q = 'stars:>1000'
      }
      if (lang) q += ` language:${lang}`
      const url = `https://api.github.com/search/repositories?q=${encodeURIComponent(q)}&sort=stars&order=desc&per_page=20`
      const res = await fetch(url, { headers: { Accept: 'application/vnd.github+json' } })
      if (res.status === 403) {
        const reset = res.headers.get('X-RateLimit-Reset')
        const resetTime = reset
          ? new Date(parseInt(reset, 10) * 1000).toLocaleTimeString('zh-CN')
          : '稍后'
        throw new Error(`API 速率限制，${resetTime} 后恢复`)
      }
      if (!res.ok) throw new Error(`请求失败: ${res.status} ${res.statusText}`)
      const data = await res.json()
      setRepos(data.items || [])
    } catch (err) {
      setError(err instanceof Error ? err.message : '加载热门项目失败')
      setRepos([])
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    if (activeTab === 'trending') {
      fetchTrending(trendingMode, language)
    } else if (query.trim()) {
      fetchSearch(query, language, sort)
    }
  }, [activeTab, trendingMode, language, sort, fetchTrending, fetchSearch, query])

  const handleSearch = useCallback(() => {
    if (!query.trim()) return
    setActiveTab('search')
    setShowHistory(false)
    fetchSearch(query, language, sort)
  }, [query, language, sort, fetchSearch])

  const handleHistoryClick = useCallback((item: string) => {
    setQuery(item)
    setActiveTab('search')
    setShowHistory(false)
    fetchSearch(item, language, sort)
  }, [language, sort, fetchSearch])

  const debouncedSearch = useCallback((value: string) => {
    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current)
    }
    searchTimeoutRef.current = setTimeout(() => {
      if (value.trim()) {
        setActiveTab('search')
        fetchSearch(value, language, sort)
      }
    }, 600)
  }, [language, sort, fetchSearch])

  const handleQueryChange = useCallback((value: string) => {
    setQuery(value)
    if (value.trim()) {
      debouncedSearch(value)
    } else {
      setActiveTab('trending')
      setRepos([])
    }
  }, [debouncedSearch])

  // Theme colors
  const bg = '#0d1117'
  const surfaceBg = '#161b22'
  const borderColor = '#30363d'
  const textColor = '#c9d1d9'
  const mutedColor = '#8b949e'
  const accentColor = '#58a6ff'
  const cardBg = '#161b22'
  const hoverBorder = '#58a6ff'

  return (
    <div style={{
      height: '100%',
      background: bg,
      color: textColor,
      fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", "Noto Sans", Helvetica, Arial, sans-serif',
      fontSize: 13,
      display: 'flex',
      flexDirection: 'column',
      overflow: 'hidden'
    }}>
      {/* Fixed Search Bar */}
      <div style={{
        padding: '16px 20px',
        borderBottom: `1px solid ${borderColor}`,
        background: surfaceBg,
        flexShrink: 0,
        position: 'relative',
        zIndex: 10
      }}>
        {/* Title */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: 10,
          marginBottom: 14
        }}>
          <div style={{
            width: 36,
            height: 36,
            borderRadius: 10,
            background: 'linear-gradient(135deg, #238636, #2ea043)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: 18
          }}>
            🌐
          </div>
          <div>
            <div style={{ fontSize: 16, fontWeight: 700, color: '#e6edf3' }}>OpenSource Hub</div>
            <div style={{ fontSize: 11, color: mutedColor }}>探索 GitHub 开源世界</div>
          </div>
        </div>

        {/* Search Input */}
        <div style={{ display: 'flex', gap: 8, marginBottom: 12, position: 'relative' }}>
          <div style={{
            flex: 1,
            display: 'flex',
            alignItems: 'center',
            background: '#0d1117',
            border: `1px solid ${borderColor}`,
            borderRadius: 6,
            padding: '0 12px',
            transition: 'border-color 0.2s'
          }}>
            <span style={{ color: mutedColor, marginRight: 8, fontSize: 14 }}>🔍</span>
            <input
              ref={searchInputRef}
              type="text"
              value={query}
              onChange={(e) => handleQueryChange(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') handleSearch()
              }}
              onFocus={() => setShowHistory(true)}
              placeholder="搜索开源项目..."
              style={{
                flex: 1,
                padding: '8px 0',
                background: 'transparent',
                border: 'none',
                outline: 'none',
                color: textColor,
                fontSize: 13
              }}
            />
            {query && (
              <button
                onClick={() => { setQuery(''); setActiveTab('trending'); setRepos([]) }}
                style={{
                  background: 'none',
                  border: 'none',
                  color: mutedColor,
                  cursor: 'pointer',
                  fontSize: 14,
                  padding: 4
                }}
              >
                ✕
              </button>
            )}
          </div>
          <button
            onClick={handleSearch}
            disabled={loading || !query.trim()}
            style={{
              padding: '8px 20px',
              borderRadius: 6,
              border: 'none',
              background: loading || !query.trim() ? '#21262d' : '#238636',
              color: loading || !query.trim() ? mutedColor : '#fff',
              fontSize: 13,
              cursor: loading || !query.trim() ? 'not-allowed' : 'pointer',
              fontWeight: 500,
              whiteSpace: 'nowrap'
            }}
          >
            搜索
          </button>
        </div>

        {/* Search History Dropdown */}
        {showHistory && searchHistory.length > 0 && !query && (
          <div style={{
            position: 'absolute',
            top: 88,
            left: 20,
            right: 20,
            background: surfaceBg,
            border: `1px solid ${borderColor}`,
            borderRadius: 8,
            zIndex: 20,
            maxHeight: 240,
            overflow: 'auto',
            boxShadow: '0 8px 24px rgba(0,0,0,0.4)'
          }}>
            <div style={{ padding: '8px 12px', fontSize: 11, color: mutedColor, borderBottom: `1px solid ${borderColor}` }}>
              搜索历史
            </div>
            {searchHistory.map((item) => (
              <div
                key={item}
                onClick={() => handleHistoryClick(item)}
                style={{
                  padding: '8px 12px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  cursor: 'pointer',
                  transition: 'background 0.15s'
                }}
                onMouseEnter={(e) => { e.currentTarget.style.background = 'rgba(88,166,255,0.08)' }}
                onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent' }}
              >
                <span style={{ color: textColor, fontSize: 13 }}>🔍 {item}</span>
                <button
                  onClick={(e) => { e.stopPropagation(); removeSearchHistory(item) }}
                  style={{ background: 'none', border: 'none', color: mutedColor, cursor: 'pointer', fontSize: 12, padding: '2px 4px' }}
                >
                  ✕
                </button>
              </div>
            ))}
          </div>
        )}

        {/* Filter Row */}
        <div style={{ display: 'flex', gap: 10, alignItems: 'center', flexWrap: 'wrap' }}>
          {/* Tab: Search / Trending */}
          <div style={{
            display: 'flex',
            borderRadius: 6,
            overflow: 'hidden',
            border: `1px solid ${borderColor}`
          }}>
            <button
              onClick={() => setActiveTab('trending')}
              style={{
                padding: '5px 14px',
                border: 'none',
                background: activeTab === 'trending' ? '#238636' : 'transparent',
                color: activeTab === 'trending' ? '#fff' : mutedColor,
                fontSize: 12,
                cursor: 'pointer',
                fontWeight: activeTab === 'trending' ? 600 : 400,
                transition: 'all 0.15s'
              }}
            >
              🔥 热门
            </button>
            <button
              onClick={() => setActiveTab('search')}
              style={{
                padding: '5px 14px',
                border: 'none',
                background: activeTab === 'search' ? '#238636' : 'transparent',
                color: activeTab === 'search' ? '#fff' : mutedColor,
                fontSize: 12,
                cursor: 'pointer',
                fontWeight: activeTab === 'search' ? 600 : 400,
                transition: 'all 0.15s'
              }}
            >
              🔎 搜索
            </button>
          </div>

          {/* Language filter */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <span style={{ fontSize: 11, color: mutedColor }}>语言:</span>
            <select
              value={language}
              onChange={(e) => setLanguage(e.target.value)}
              style={{
                padding: '4px 8px',
                borderRadius: 4,
                border: `1px solid ${borderColor}`,
                background: '#0d1117',
                color: textColor,
                fontSize: 12,
                outline: 'none'
              }}
            >
              {LANGUAGE_OPTIONS.map(opt => (
                <option key={opt.value} value={opt.value}>{opt.label}</option>
              ))}
            </select>
          </div>

          {/* Sort (search mode) */}
          {activeTab === 'search' && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <span style={{ fontSize: 11, color: mutedColor }}>排序:</span>
              <select
                value={sort}
                onChange={(e) => setSort(e.target.value as SortOption)}
                style={{
                  padding: '4px 8px',
                  borderRadius: 4,
                  border: `1px solid ${borderColor}`,
                  background: '#0d1117',
                  color: textColor,
                  fontSize: 12,
                  outline: 'none'
                }}
              >
                {SORT_OPTIONS.map(opt => (
                  <option key={opt.value} value={opt.value}>{opt.label}</option>
                ))}
              </select>
            </div>
          )}

          {/* Trending mode */}
          {activeTab === 'trending' && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <span style={{ fontSize: 11, color: mutedColor }}>热门方式:</span>
              <select
                value={trendingMode}
                onChange={(e) => setTrendingMode(e.target.value as TrendingMode)}
                style={{
                  padding: '4px 8px',
                  borderRadius: 4,
                  border: `1px solid ${borderColor}`,
                  background: '#0d1117',
                  color: textColor,
                  fontSize: 12,
                  outline: 'none'
                }}
              >
                <option value="stars">按星标数</option>
                <option value="created">按创建时间</option>
              </select>
            </div>
          )}
        </div>
      </div>

      {/* Click-away to close history */}
      {showHistory && (
        <div
          onClick={() => setShowHistory(false)}
          style={{
            position: 'fixed',
            inset: 0,
            zIndex: 5
          }}
        />
      )}

      {/* Results Area */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '16px 20px' }}>
        {/* Error */}
        {error && (
          <div style={{
            marginBottom: 16,
            padding: '12px 16px',
            borderRadius: 8,
            background: 'rgba(248, 81, 73, 0.1)',
            border: '1px solid rgba(248, 81, 73, 0.3)',
            color: '#f85149',
            fontSize: 13,
            display: 'flex',
            alignItems: 'center',
            gap: 8
          }}>
            ⚠️ {error}
          </div>
        )}

        {/* Loading */}
        {loading && (
          <div style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            padding: 60,
            gap: 12
          }}>
            <div style={{
              width: 32,
              height: 32,
              border: '3px solid #30363d',
              borderTopColor: accentColor,
              borderRadius: '50%',
              animation: 'osh-spin 0.8s linear infinite'
            }} />
            <span style={{ color: mutedColor, fontSize: 13 }}>
              {activeTab === 'trending' ? '加载热门项目...' : '搜索中...'}
            </span>
          </div>
        )}

        {/* Empty */}
        {!loading && repos.length === 0 && !error && (
          <div style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            padding: 80,
            gap: 12
          }}>
            <div style={{ fontSize: 56 }}>📦</div>
            <div style={{ color: mutedColor, fontSize: 14 }}>
              {activeTab === 'search' ? '输入关键词搜索开源项目' : '暂无热门项目'}
            </div>
          </div>
        )}

        {/* Repo Cards Grid */}
        {!loading && repos.length > 0 && (
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))',
            gap: 12
          }}>
            {repos.map((repo) => {
              const langColor = LANGUAGE_COLORS[repo.language] || '#8b949e'
              return (
                <div
                  key={repo.id}
                  onClick={() => window.open(repo.html_url, '_blank')}
                  style={{
                    background: cardBg,
                    border: `1px solid ${borderColor}`,
                    borderRadius: 10,
                    padding: 16,
                    cursor: 'pointer',
                    transition: 'border-color 0.2s, transform 0.15s',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: 10
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.borderColor = hoverBorder
                    e.currentTarget.style.transform = 'translateY(-2px)'
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.borderColor = borderColor
                    e.currentTarget.style.transform = 'translateY(0)'
                  }}
                >
                  {/* Header: Avatar + Name */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <img
                      src={repo.owner.avatar_url}
                      alt={repo.owner.login}
                      style={{
                        width: 28,
                        height: 28,
                        borderRadius: '50%',
                        flexShrink: 0,
                        border: `1px solid ${borderColor}`
                      }}
                    />
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{
                        fontSize: 14,
                        fontWeight: 600,
                        color: accentColor,
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        whiteSpace: 'nowrap'
                      }}>
                        {repo.full_name}
                      </div>
                    </div>
                  </div>

                  {/* Description */}
                  <div style={{
                    fontSize: 12,
                    color: mutedColor,
                    lineHeight: 1.5,
                    overflow: 'hidden',
                    display: '-webkit-box',
                    WebkitLineClamp: 2,
                    WebkitBoxOrient: 'vertical',
                    textOverflow: 'ellipsis',
                    minHeight: 36
                  }}>
                    {repo.description || '暂无描述'}
                  </div>

                  {/* Meta: Language, Stars, Forks, Updated */}
                  <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 14,
                    flexWrap: 'wrap',
                    fontSize: 12,
                    color: mutedColor
                  }}>
                    {repo.language && (
                      <span style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                        <span style={{
                          width: 10,
                          height: 10,
                          borderRadius: '50%',
                          background: langColor,
                          display: 'inline-block',
                          flexShrink: 0
                        }} />
                        {repo.language}
                      </span>
                    )}
                    <span style={{ display: 'flex', alignItems: 'center', gap: 3 }}>
                      ⭐ {formatNumber(repo.stargazers_count)}
                    </span>
                    <span style={{ display: 'flex', alignItems: 'center', gap: 3 }}>
                      🍴 {formatNumber(repo.forks_count)}
                    </span>
                    <span style={{ fontSize: 11 }}>
                      {formatDate(repo.updated_at)}
                    </span>
                  </div>
                </div>
              )
            })}
          </div>
        )}

        {/* Result count */}
        {!loading && repos.length > 0 && (
          <div style={{
            textAlign: 'center',
            padding: '16px 0 8px',
            fontSize: 11,
            color: mutedColor
          }}>
            显示 {repos.length} 个结果 · 每页 20 条
          </div>
        )}
      </div>

      {/* Spinner animation */}
      <style>{`
        @keyframes osh-spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  )
}
