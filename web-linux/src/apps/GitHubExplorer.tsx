import { useState, useCallback, useEffect, useRef } from 'react'
import { Search, Star, GitFork, Eye, TrendingUp, Loader2, ExternalLink, Clock } from 'lucide-react'

interface Repository {
  id: number
  name: string
  full_name: string
  description: string
  html_url: string
  stargazers_count: number
  forks_count: number
  watchers_count: number
  open_issues_count: number
  language: string
  created_at: string
  updated_at: string
  owner: {
    login: string
    avatar_url: string
    html_url: string
  }
  topics?: string[]
  license?: {
    name: string
  }
}

const LANGUAGE_COLORS: Record<string, string> = {
  JavaScript: '#f1e05a',
  TypeScript: '#3178c6',
  Python: '#3572A5',
  Java: '#b07219',
  'C++': '#f34b7d',
  C: '#555555',
  Go: '#00ADD8',
  Rust: '#dea584',
  Ruby: '#701516',
  PHP: '#4F5D95',
  Swift: '#ffac45',
  Kotlin: '#A97BFF',
  Dart: '#00B4AB',
  Shell: '#89e051',
  HTML: '#e34c26',
  CSS: '#563d7c',
  Vue: '#41b883',
  React: '#61dafb',
  SCSS: '#c6538c',
  Dockerfile: '#384d54',
  Markdown: '#083fa1',
}

export default function GitHubExplorer() {
  const [searchQuery, setSearchQuery] = useState('')
  const [repositories, setRepositories] = useState<Repository[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [selectedRepo, setSelectedRepo] = useState<Repository | null>(null)
  const [trendingRepos, setTrendingRepos] = useState<Repository[]>([])
  const [trendingLoading, setTrendingLoading] = useState(true)
  const [currentPage, setCurrentPage] = useState(1)
  const [hasMore, setHasMore] = useState(true)
  const searchTimeoutRef = useRef<number | null>(null)

  const fetchTrending = useCallback(async () => {
    setTrendingLoading(true)
    try {
      const CACHE_KEY = 'gh-trending-cache'
      const cached = localStorage.getItem(CACHE_KEY)
      if (cached) {
        try {
          const parsed = JSON.parse(cached)
          if (Date.now() - parsed.timestamp < 5 * 60 * 1000) {
            setTrendingRepos(parsed.items)
            setTrendingLoading(false)
            return
          }
        } catch {}
      }

      const response = await fetch(
        'https://api.github.com/search/repositories?q=stars:>1000&sort=stars&order=desc&per_page=20',
        { headers: { 'Accept': 'application/vnd.github+json' } }
      )

      if (response.status === 403) {
        const rateLimitReset = response.headers.get('X-RateLimit-Reset')
        const resetTime = rateLimitReset
          ? new Date(parseInt(rateLimitReset, 10) * 1000).toLocaleTimeString()
          : '稍后'
        throw new Error(`GitHub API 速率限制，${resetTime} 后恢复`)
      }
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`)
      }

      const data = await response.json()
      if (data.items) {
        setTrendingRepos(data.items)
        try {
          localStorage.setItem(
            CACHE_KEY,
            JSON.stringify({ timestamp: Date.now(), items: data.items })
          )
        } catch {}
      }
    } catch (err) {
      console.error('Failed to fetch trending repos:', err)
      setError(err instanceof Error ? err.message : '加载热门仓库失败，请检查网络连接')
    } finally {
      setTrendingLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchTrending()
  }, [fetchTrending])

  const searchRepos = useCallback(async (query: string, page: number = 1) => {
    if (!query.trim()) {
      setRepositories([])
      setCurrentPage(1)
      setHasMore(true)
      setError(null)
      return
    }

    setLoading(true)
    setError(null)

    try {
      const CACHE_KEY = `gh-search-${query.toLowerCase()}-${page}`
      const cached = localStorage.getItem(CACHE_KEY)
      if (cached) {
        try {
          const parsed = JSON.parse(cached)
          if (Date.now() - parsed.timestamp < 2 * 60 * 1000) {
            if (page === 1) {
            setRepositories(parsed.items)
          } else {
            setRepositories(prev => [...prev, ...parsed.items])
          }
          setHasMore(parsed.items.length === 20)
          setCurrentPage(page)
            setLoading(false)
            return
          }
        } catch {}
      }

      const response = await fetch(
        `https://api.github.com/search/repositories?q=${encodeURIComponent(query)}&sort=stars&order=desc&page=${page}&per_page=20`,
        { headers: { 'Accept': 'application/vnd.github+json' } }
      )

      if (response.status === 403) {
        const rateLimitReset = response.headers.get('X-RateLimit-Reset')
        const resetTime = rateLimitReset
          ? new Date(parseInt(rateLimitReset, 10) * 1000).toLocaleTimeString()
          : '稍后'
        throw new Error(`GitHub API 速率限制，${resetTime} 后恢复`)
      }
      if (response.status === 422) {
        throw new Error('搜索语法错误，请尝试其他关键词')
      }
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`)
      }

      const data = await response.json()
      if (data.items) {
        if (page === 1) {
          setRepositories(data.items)
        } else {
          setRepositories(prev => [...prev, ...data.items])
        }
        setHasMore(data.items.length === 20)
        setCurrentPage(page)
        try {
          localStorage.setItem(CACHE_KEY, JSON.stringify({
          timestamp: Date.now(),
          items: data.items,
        }))
        } catch {}
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : '搜索时出错，请稍后重试')
      console.error('Search error:', err)
    } finally {
      setLoading(false)
    }
  }, [])

  const debouncedSearch = useCallback(
    (query: string) => {
      if (searchTimeoutRef.current) {
        clearTimeout(searchTimeoutRef.current)
      }
      searchTimeoutRef.current = setTimeout(() => {
        searchRepos(query, 1)
      }, 500)
    },
    [searchRepos]
  )

  const formatNumber = (num: number): string => {
    if (num >= 1000000) {
      return (num / 1000000).toFixed(1) + 'M'
    }
    if (num >= 1000) {
      return (num / 1000).toFixed(1) + 'K'
    }
    return num.toString()
  }

  const formatDate = (dateStr: string): string => {
    const date = new Date(dateStr)
    return date.toLocaleDateString('zh-CN', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    })
  }

  const loadMore = useCallback(() => {
    if (!loading && hasMore && searchQuery) {
      searchRepos(searchQuery, currentPage + 1)
    }
  }, [loading, hasMore, searchQuery, currentPage, searchRepos])

  const displayRepos = searchQuery ? repositories : trendingRepos

  return (
    <div className="github-explorer" style={{ 
      height: '100%', 
      overflow: 'auto',
      background: 'linear-gradient(180deg, #0d1117 0%, #161b22 100%)',
      color: '#c9d1d9',
      fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", "Noto Sans", Helvetica, Arial, sans-serif'
    }}>
      <div style={{ padding: '16px' }}>
        <div style={{ 
          marginBottom: '24px',
          textAlign: 'center',
          padding: '24px 16px',
          background: 'linear-gradient(135deg, #238636 0%, #2ea043 100%)',
          borderRadius: '12px',
          color: '#ffffff'
        }}>
          <div style={{ fontSize: '32px', marginBottom: '8px' }}>🚀 GitHub Explorer</div>
          <div style={{ fontSize: '14px', opacity: 0.9 }}>探索全球最好的开源项目</div>
        </div>

        <div style={{ 
          display: 'flex', 
          gap: '12px', 
          marginBottom: '24px',
          position: 'sticky',
          top: 0,
          zIndex: 10,
          background: '#0d1117',
          padding: '8px 0'
        }}>
          <div style={{
            flex: 1,
            display: 'flex',
            alignItems: 'center',
            background: '#21262d',
            border: '1px solid #30363d',
            borderRadius: '6px',
            padding: '8px 12px',
            transition: 'all 0.2s'
          }}>
            <Search size={18} style={{ color: '#8b949e', marginRight: '8px' }} />
            <input
              type="text"
              placeholder="搜索仓库..."
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value)
                debouncedSearch(e.target.value)
              }}
              style={{
                flex: 1,
                background: 'transparent',
                border: 'none',
                outline: 'none',
                color: '#c9d1d9',
                fontSize: '14px'
              }}
            />
          </div>
        </div>

        {error && (
          <div style={{
            padding: '16px',
            background: 'rgba(248, 81, 73, 0.1)',
            border: '1px solid rgba(248, 81, 73, 0.3)',
            borderRadius: '6px',
            marginBottom: '16px',
            color: '#f85149'
          }}>
            {error}
          </div>
        )}

        <div style={{ marginBottom: '16px' }}>
          <h2 style={{
            fontSize: '16px',
            fontWeight: 600,
            margin: '0 0 16px 0',
            color: '#e6edf3',
            display: 'flex',
            alignItems: 'center',
            gap: '8px'
          }}>
            {searchQuery ? (
              <>
                <Search size={20} />
                搜索结果
              </>
            ) : (
              <>
                <TrendingUp size={20} />
                🔥 热门仓库
              </>
            )}
          </h2>

          {trendingLoading && !searchQuery ? (
            <div style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              padding: '40px',
              gap: '8px'
            }}>
              <Loader2 className="spinner" size={24} />
              <span>加载中...</span>
            </div>
          ) : displayRepos.length === 0 ? (
            <div style={{
              textAlign: 'center',
              padding: '40px 20px',
              color: '#8b949e'
            }}>
              <div style={{ fontSize: '48px', marginBottom: '16px' }}>🔍</div>
              <div>没有找到仓库</div>
            </div>
          ) : (
            <div style={{ display: 'grid', gap: '12px' }}>
              {displayRepos.map((repo) => (
                <div
                  key={repo.id}
                  onClick={() => setSelectedRepo(repo)}
                  style={{
                    background: '#161b22',
                    border: '1px solid #30363d',
                    borderRadius: '8px',
                    padding: '16px',
                    cursor: 'pointer',
                    transition: 'all 0.2s'
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.borderColor = '#58a6ff'
                    e.currentTarget.style.background = '#21262d'
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.borderColor = '#30363d'
                    e.currentTarget.style.background = '#161b22'
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '8px' }}>
                    <img
                      src={repo.owner.avatar_url}
                      alt={repo.owner.login}
                      style={{
                        width: '32px',
                        height: '32px',
                        borderRadius: '50%'
                      }}
                    />
                    <div style={{ flex: 1 }}>
                      <div style={{
                        fontSize: '16px',
                        fontWeight: 600,
                        color: '#58a6ff',
                        marginBottom: '2px'
                      }}>
                        {repo.full_name}
                      </div>
                      {repo.description && (
                        <div style={{
                          fontSize: '12px',
                          color: '#8b949e',
                          lineHeight: 1.5
                        }}>
                          {repo.description}
                        </div>
                      )}
                    </div>
                  </div>

                  <div style={{
                    display: 'flex',
                    flexWrap: 'wrap',
                    gap: '16px',
                    marginTop: '12px',
                    fontSize: '12px',
                    color: '#8b949e'
                  }}>
                    {repo.language && (
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <span style={{
                          width: '12px',
                          height: '12px',
                          borderRadius: '50%',
                          background: LANGUAGE_COLORS[repo.language] || '#8b949e'
                        }} />
                        {repo.language}
                      </div>
                    )}
                    <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                      <Star size={14} />
                      {formatNumber(repo.stargazers_count)}
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                      <GitFork size={14} />
                      {formatNumber(repo.forks_count)}
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                      <Eye size={14} />
                      {formatNumber(repo.watchers_count)}
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                      <Clock size={14} />
                      更新于 {formatDate(repo.updated_at)}
                    </div>
                  </div>

                  {repo.topics && repo.topics.length > 0 && (
                    <div style={{
                      display: 'flex',
                      flexWrap: 'wrap',
                      gap: '6px',
                      marginTop: '12px'
                    }}>
                      {repo.topics.slice(0, 5).map((topic) => (
                        <span
                          key={topic}
                          style={{
                            padding: '4px 10px',
                            background: 'rgba(88, 166, 255, 0.1)',
                            color: '#58a6ff',
                            borderRadius: '20px',
                            fontSize: '11px',
                            fontWeight: 500
                          }}
                        >
                          {topic}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}

          {loading && (
            <div style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              padding: '24px',
              gap: '8px'
            }}>
              <Loader2 className="spinner" size={20} />
              <span style={{ fontSize: '14px', color: '#8b949e' }}>加载更多...</span>
            </div>
          )}

          {hasMore && !loading && searchQuery && (
            <div style={{ textAlign: 'center', marginTop: '16px' }}>
              <button
                onClick={loadMore}
                style={{
                  padding: '8px 24px',
                  background: '#21262d',
                  border: '1px solid #30363d',
                  borderRadius: '6px',
                  color: '#c9d1d9',
                  fontSize: '14px',
                  cursor: 'pointer',
                  transition: 'all 0.2s'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = '#30363d'
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = '#21262d'
                }}
              >
                加载更多
              </button>
            </div>
          )}
        </div>
      </div>

      {selectedRepo && (
        <div style={{
          position: 'fixed',
          inset: 0,
          background: 'rgba(0, 0, 0, 0.7)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000,
          padding: '20px'
        }} onClick={() => setSelectedRepo(null)}>
          <div style={{
            background: '#0d1117',
            border: '1px solid #30363d',
            borderRadius: '12px',
            maxWidth: '600px',
            width: '100%',
            maxHeight: '80vh',
            overflow: 'auto',
            animation: 'slideUp 0.2s ease-out'
          }} onClick={(e) => e.stopPropagation()}>
            <div style={{
              padding: '20px',
              borderBottom: '1px solid #30363d'
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '12px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <img
                    src={selectedRepo.owner.avatar_url}
                    alt={selectedRepo.owner.login}
                    style={{ width: '48px', height: '48px', borderRadius: '50%' }}
                  />
                  <div>
                    <div style={{ fontSize: '18px', fontWeight: 600, color: '#e6edf3' }}>
                      {selectedRepo.full_name}
                    </div>
                    <div style={{ fontSize: '12px', color: '#8b949e' }}>
                      {selectedRepo.owner.login}
                    </div>
                  </div>
                </div>
                <button
                  onClick={() => setSelectedRepo(null)}
                  style={{
                    background: 'transparent',
                    border: 'none',
                    color: '#8b949e',
                    cursor: 'pointer',
                    fontSize: '24px'
                  }}
                >
                  ×
                </button>
              </div>
              {selectedRepo.description && (
                <div style={{ fontSize: '14px', color: '#8b949e', lineHeight: 1.6, marginBottom: '16px' }}>
                  {selectedRepo.description}
                </div>
              )}

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '12px', marginBottom: '16px' }}>
                <div style={{
                  background: '#161b22',
                  padding: '12px',
                  borderRadius: '8px',
                  textAlign: 'center'
                }}>
                  <Star size={20} style={{ color: '#f0883e', marginBottom: '4px' }} />
                  <div style={{ fontSize: '18px', fontWeight: 600, color: '#e6edf3' }}>
                    {formatNumber(selectedRepo.stargazers_count)}
                  </div>
                  <div style={{ fontSize: '11px', color: '#8b949e' }}>Stars</div>
                </div>
                <div style={{
                  background: '#161b22',
                  padding: '12px',
                  borderRadius: '8px',
                  textAlign: 'center'
                }}>
                  <GitFork size={20} style={{ color: '#56d364', marginBottom: '4px' }} />
                  <div style={{ fontSize: '18px', fontWeight: 600, color: '#e6edf3' }}>
                    {formatNumber(selectedRepo.forks_count)}
                  </div>
                  <div style={{ fontSize: '11px', color: '#8b949e' }}>Forks</div>
                </div>
                <div style={{
                  background: '#161b22',
                  padding: '12px',
                  borderRadius: '8px',
                  textAlign: 'center'
                }}>
                  <Eye size={20} style={{ color: '#8b949e', marginBottom: '4px' }} />
                  <div style={{ fontSize: '18px', fontWeight: 600, color: '#e6edf3' }}>
                    {formatNumber(selectedRepo.watchers_count)}
                  </div>
                  <div style={{ fontSize: '11px', color: '#8b949e' }}>Watchers</div>
                </div>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginBottom: '16px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px' }}>
                  <span style={{ color: '#8b949e' }}>创建时间</span>
                  <span style={{ color: '#e6edf3' }}>{formatDate(selectedRepo.created_at)}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px' }}>
                  <span style={{ color: '#8b949e' }}>最后更新</span>
                  <span style={{ color: '#e6edf3' }}>{formatDate(selectedRepo.updated_at)}</span>
                </div>
                {selectedRepo.language && (
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px' }}>
                    <span style={{ color: '#8b949e' }}>主要语言</span>
                    <span style={{ color: '#e6edf3' }}>{selectedRepo.language}</span>
                  </div>
                )}
                {selectedRepo.license && (
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px' }}>
                    <span style={{ color: '#8b949e' }}>许可证</span>
                    <span style={{ color: '#e6edf3' }}>{selectedRepo.license.name}</span>
                  </div>
                )}
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px' }}>
                  <span style={{ color: '#8b949e' }}>开放问题</span>
                  <span style={{ color: '#f85149' }}>{selectedRepo.open_issues_count}</span>
                </div>
              </div>

              <a
                href={selectedRepo.html_url}
                target="_blank"
                rel="noopener noreferrer"
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '8px',
                  width: '100%',
                  padding: '12px',
                  background: '#238636',
                  color: '#ffffff',
                  textDecoration: 'none',
                  borderRadius: '6px',
                  fontSize: '14px',
                  fontWeight: 500,
                  transition: 'background 0.2s'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = '#2ea043'
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = '#238636'
                }}
              >
                <ExternalLink size={16} />
                在 GitHub 上打开
              </a>
            </div>
          </div>
        </div>
      )}

      <style>{`
        @keyframes slideUp {
          from {
            opacity: 0;
            transform: translateY(20px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        
        .spinner {
          animation: spin 1s linear infinite;
        }
        
        @keyframes spin {
          from {
            transform: rotate(0deg);
          }
          to {
            transform: rotate(360deg);
          }
        }
      `}</style>
    </div>
  )
}
