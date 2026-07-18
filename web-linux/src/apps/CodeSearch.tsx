import { useState, useEffect, useCallback } from 'react'
import { Search, GitBranch, FileCode, Clock, User, Star, GitFork, ExternalLink, Terminal } from 'lucide-react'

interface SearchResult {
  id: string
  name: string
  description: string
  url: string
  stars: number
  forks: number
  language: string
  updatedAt: string
  owner: string
  ownerUrl: string
}

interface HistoryItem {
  query: string
  timestamp: Date
}

interface QuickTip {
  title: string
  description: string
  icon: React.ReactNode
}

const QUICK_TIPS: QuickTip[] = [
  { title: 'Code Search', description: 'Search GitHub repositories', icon: <Search size={18} /> },
  { title: 'User Search', description: 'Use user:username to search', icon: <User size={18} /> },
  { title: 'Repo Search', description: 'Use repo:owner/name to search', icon: <GitBranch size={18} /> },
  { title: 'Lang Filter', description: 'Use language:TypeScript to filter', icon: <FileCode size={18} /> },
]

function formatNumber(num: number): string {
  if (num >= 1000000) return `${(num / 1000000).toFixed(1)}M`
  if (num >= 1000) return `${(num / 1000).toFixed(1)}K`
  return num.toString()
}

function relativeTime(iso: string): string {
  const then = new Date(iso).getTime()
  const diff = Date.now() - then
  const days = Math.floor(diff / (1000 * 60 * 60 * 24))
  if (days < 1) return 'Today'
  if (days < 7) return `${days}d ago`
  if (days < 30) return `${Math.floor(days / 7)}w ago`
  if (days < 365) return `${Math.floor(days / 30)}mo ago`
  return `${Math.floor(days / 365)}y ago`
}

export default function CodeSearch() {
  const [query, setQuery] = useState('')
  const [results, setResults] = useState<SearchResult[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [searchHistory, setSearchHistory] = useState<HistoryItem[]>([])
  const [activeTab, setActiveTab] = useState<'repositories' | 'code'>('repositories')

  useEffect(() => {
    const saved = localStorage.getItem('codeSearchHistory')
    if (saved) {
      try {
        setSearchHistory(JSON.parse(saved))
      } catch {
        setSearchHistory([])
      }
    }
  }, [])

  const saveHistory = useCallback((q: string) => {
    const newHistory = [{ query: q, timestamp: new Date() }, ...searchHistory.filter(h => h.query !== q)].slice(0, 10)
    setSearchHistory(newHistory)
    localStorage.setItem('codeSearchHistory', JSON.stringify(newHistory))
  }, [searchHistory])

  const fetchResults = useCallback(async (q: string) => {
    if (!q.trim()) return
    
    setLoading(true)
    setError(null)
    
    try {
      const url = `https://api.github.com/search/repositories?q=${encodeURIComponent(q)}&sort=stars&order=desc&per_page=15`
      const response = await fetch(url)
      
      if (!response.ok) {
        throw new Error(`GitHub API error: ${response.status}`)
      }
      
      const data = await response.json()
      const items = (data.items || []).map((item: any) => ({
        id: item.id.toString(),
        name: item.name,
        description: item.description || 'No description',
        url: item.html_url,
        stars: item.stargazers_count,
        forks: item.forks_count,
        language: item.language || 'Unknown',
        updatedAt: item.updated_at,
        owner: item.owner.login,
        ownerUrl: item.owner.html_url,
      }))
      
      setResults(items)
      saveHistory(q)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Search failed')
    } finally {
      setLoading(false)
    }
  }, [saveHistory])

  useEffect(() => {
    const timer = setTimeout(() => {
      if (query.trim()) {
        fetchResults(query)
      } else {
        setResults([])
      }
    }, 500)
    
    return () => clearTimeout(timer)
  }, [query, fetchResults])

  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      fetchResults(query)
    }
  }, [query, fetchResults])

  const clearHistory = useCallback(() => {
    setSearchHistory([])
    localStorage.removeItem('codeSearchHistory')
  }, [])

  const languageColors: Record<string, string> = {
    TypeScript: '#3178c6',
    JavaScript: '#f7df1e',
    Python: '#3776ab',
    Rust: '#dea584',
    Go: '#00add8',
    Java: '#ed8b00',
    C: '#555555',
    'C++': '#f34b7d',
    'C#': '#512bd4',
    Ruby: '#cc342d',
    PHP: '#777bb4',
    Swift: '#fa7343',
    Kotlin: '#7f52ff',
    Dart: '#00b4ab',
    HTML: '#e34f26',
    CSS: '#1572b6',
    Shell: '#89e051',
    Dockerfile: '#384d54',
    Makefile: '#427819',
    Markdown: '#083fa1',
    JSON: '#000000',
    YAML: '#cb171e',
    SQL: '#e38c00',
  }

  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      height: '100%',
      background: 'linear-gradient(180deg, #1a1a2e 0%, #16213e 100%)',
    }}>
      <div style={{
        padding: '16px 20px',
        background: 'rgba(0,0,0,0.3)',
        borderBottom: '1px solid rgba(255,255,255,0.08)',
      }}>
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: 12,
          marginBottom: 12,
        }}>
          <div style={{
            width: 40,
            height: 40,
            borderRadius: 10,
            background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}>
            <Search size={20} style={{ color: '#fff' }} />
          </div>
          <div>
            <h2 style={{
              color: '#fff',
              fontSize: 16,
              fontWeight: 600,
              margin: 0,
            }}>Code Search</h2>
            <p style={{
              color: 'rgba(255,255,255,0.5)',
              fontSize: 12,
              margin: '2px 0 0 0',
            }}>Search GitHub open source projects</p>
          </div>
        </div>

        <div style={{
          display: 'flex',
          gap: 8,
          marginBottom: 12,
        }}>
          <button
            onClick={() => setActiveTab('repositories')}
            style={{
              padding: '6px 14px',
              borderRadius: 6,
              border: 'none',
              background: activeTab === 'repositories' 
                ? 'var(--accent, #667eea)' 
                : 'rgba(255,255,255,0.08)',
              color: activeTab === 'repositories' ? '#fff' : 'rgba(255,255,255,0.7)',
              fontSize: 12,
              cursor: 'pointer',
              transition: 'all 0.2s',
              display: 'flex',
              alignItems: 'center',
              gap: 6,
            }}
          >
            <GitBranch size={14} />
            Repositories
          </button>
          <button
            onClick={() => setActiveTab('code')}
            style={{
              padding: '6px 14px',
              borderRadius: 6,
              border: 'none',
              background: activeTab === 'code' 
                ? 'var(--accent, #667eea)' 
                : 'rgba(255,255,255,0.08)',
              color: activeTab === 'code' ? '#fff' : 'rgba(255,255,255,0.7)',
              fontSize: 12,
              cursor: 'pointer',
              transition: 'all 0.2s',
              display: 'flex',
              alignItems: 'center',
              gap: 6,
            }}
          >
            <FileCode size={14} />
            Code
          </button>
        </div>

        <div style={{
          position: 'relative',
        }}>
          <Search size={18} style={{
            position: 'absolute',
            left: 14,
            top: '50%',
            transform: 'translateY(-50%)',
            color: 'rgba(255,255,255,0.4)',
          }} />
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Search code, repositories or users..."
            style={{
              width: '100%',
              padding: '10px 14px 10px 44px',
              borderRadius: 10,
              border: '1px solid rgba(255,255,255,0.1)',
              background: 'rgba(255,255,255,0.05)',
              color: '#fff',
              fontSize: 13,
              outline: 'none',
              transition: 'all 0.2s',
            }}
            onFocus={(e) => {
              e.currentTarget.style.borderColor = 'var(--accent, #667eea)'
              e.currentTarget.style.background = 'rgba(255,255,255,0.08)'
            }}
            onBlur={(e) => {
              e.currentTarget.style.borderColor = 'rgba(255,255,255,0.1)'
              e.currentTarget.style.background = 'rgba(255,255,255,0.05)'
            }}
          />
          {query && (
            <button
              onClick={() => setQuery('')}
              style={{
                position: 'absolute',
                right: 14,
                top: '50%',
                transform: 'translateY(-50%)',
                background: 'none',
                border: 'none',
                color: 'rgba(255,255,255,0.4)',
                cursor: 'pointer',
                fontSize: 16,
              }}
            >
              x
            </button>
          )}
        </div>
      </div>

      <div style={{
        flex: 1,
        overflow: 'auto',
        padding: 16,
      }}>
        {!query.trim() && results.length === 0 && (
          <div style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            height: '100%',
            padding: 40,
          }}>
            <div style={{
              width: 80,
              height: 80,
              borderRadius: 20,
              background: 'linear-gradient(135deg, rgba(102,126,234,0.2) 0%, rgba(118,75,162,0.2) 100%)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              marginBottom: 24,
            }}>
              <Search size={40} style={{ color: '#667eea' }} />
            </div>
            <h3 style={{
              color: '#fff',
              fontSize: 18,
              fontWeight: 600,
              margin: 0,
            }}>Explore Open Source</h3>
            <p style={{
              color: 'rgba(255,255,255,0.5)',
              fontSize: 14,
              textAlign: 'center',
              margin: '8px 0 24px 0',
            }}>Discover amazing open source projects on GitHub</p>

            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(2, 1fr)',
              gap: 12,
              width: '100%',
              maxWidth: 480,
            }}>
              {QUICK_TIPS.map((tip, index) => (
                <div
                  key={index}
                  style={{
                    padding: 14,
                    borderRadius: 10,
                    background: 'rgba(255,255,255,0.05)',
                    border: '1px solid rgba(255,255,255,0.08)',
                  }}
                >
                  <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 10,
                  }}>
                    <div style={{
                      width: 32,
                      height: 32,
                      borderRadius: 8,
                      background: 'rgba(102,126,234,0.15)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      color: '#667eea',
                    }}>
                      {tip.icon}
                    </div>
                    <div>
                      <h4 style={{
                        color: '#fff',
                        fontSize: 13,
                        fontWeight: 500,
                        margin: 0,
                      }}>
                        {tip.title}
                      </h4>
                      <p style={{
                        color: 'rgba(255,255,255,0.5)',
                        fontSize: 11,
                        margin: '4px 0 0 0',
                      }}>
                        {tip.description}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {searchHistory.length > 0 && (
              <div style={{
                marginTop: 24,
                width: '100%',
                maxWidth: 480,
              }}>
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  marginBottom: 12,
                }}>
                  <h4 style={{
                    color: 'rgba(255,255,255,0.6)',
                    fontSize: 12,
                    fontWeight: 500,
                    margin: 0,
                  }}>
                    Search History
                  </h4>
                  <button
                    onClick={clearHistory}
                    style={{
                      background: 'none',
                      border: 'none',
                      color: 'rgba(255,255,255,0.4)',
                      fontSize: 11,
                      cursor: 'pointer',
                      transition: 'color 0.2s',
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.color = '#ff6b6b'
                    }}
                  >
                    Clear History
                  </button>
                </div>
                <div style={{
                  display: 'flex',
                  flexWrap: 'wrap',
                  gap: 8,
                }}>
                  {searchHistory.map((item, index) => (
                    <button
                      key={index}
                      onClick={() => setQuery(item.query)}
                      style={{
                        padding: '6px 12px',
                        borderRadius: 20,
                        background: 'rgba(255,255,255,0.08)',
                        border: '1px solid rgba(255,255,255,0.1)',
                        color: 'rgba(255,255,255,0.7)',
                        fontSize: 12,
                        cursor: 'pointer',
                        transition: 'all 0.2s',
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.background = 'rgba(102,126,234,0.2)'
                        e.currentTarget.style.borderColor = '#667eea'
                      }}
                    >
                      {item.query}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {loading && (
          <div style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            padding: 40,
          }}>
            <div style={{
              width: 40,
              height: 40,
              border: '3px solid rgba(255,255,255,0.1)',
              borderTopColor: '#667eea',
              borderRadius: '50%',
              animation: 'spin 0.8s linear infinite',
            }} />
            <p style={{
              color: 'rgba(255,255,255,0.5)',
              fontSize: 13,
              marginTop: 16,
            }}>Searching...</p>
          </div>
        )}

        {error && (
          <div style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            padding: 40,
          }}>
            <div style={{
              width: 60,
              height: 60,
              borderRadius: 16,
              background: 'rgba(255,107,107,0.15)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              marginBottom: 16,
            }}>
              <Terminal size={28} style={{ color: '#ff6b6b' }} />
            </div>
            <p style={{
              color: '#ff6b6b',
              fontSize: 14,
              margin: 0,
            }}>Search Failed</p>
            <p style={{
              color: 'rgba(255,255,255,0.5)',
              fontSize: 12,
              marginTop: 8,
            }}>
              {error}
            </p>
          </div>
        )}

        {results.length > 0 && !loading && !error && (
          <div style={{
            display: 'flex',
            flexDirection: 'column',
            gap: 10,
          }}>
            {results.map((result) => (
              <div
                key={result.id}
                style={{
                  padding: 14,
                  borderRadius: 10,
                  background: 'rgba(255,255,255,0.05)',
                  border: '1px solid rgba(255,255,255,0.08)',
                  cursor: 'pointer',
                  transition: 'all 0.2s',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = 'rgba(255,255,255,0.08)'
                  e.currentTarget.style.borderColor = 'rgba(102,126,234,0.3)'
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = 'rgba(255,255,255,0.05)'
                  e.currentTarget.style.borderColor = 'rgba(255,255,255,0.08)'
                }}
                onClick={() => window.open(result.url, '_blank')}
              >
                <div style={{
                  display: 'flex',
                  alignItems: 'flex-start',
                  gap: 12,
                }}>
                  <div style={{
                    width: 36,
                    height: 36,
                    borderRadius: 9,
                    background: 'linear-gradient(135deg, #6e5494 0%, #4a3780 100%)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    flexShrink: 0,
                  }}>
                    <GitBranch size={18} style={{ color: '#fff' }} />
                  </div>
                  <div style={{ flex: 1 }}>
                    <div style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 8,
                      marginBottom: 4,
                    }}>
                      <span style={{
                        color: '#fff',
                        fontSize: 14,
                        fontWeight: 500,
                      }}>
                        {result.name}
                      </span>
                      <span style={{
                        color: 'rgba(255,255,255,0.5)',
                        fontSize: 12,
                      }}>
                        /
                      </span>
                      <a
                        href={result.ownerUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        style={{
                          color: '#667eea',
                          fontSize: 12,
                          textDecoration: 'none',
                        }}
                      >
                        {result.owner}
                      </a>
                      <ExternalLink size={12} style={{
                        color: 'rgba(255,255,255,0.3)',
                      }} />
                    </div>
                    <p style={{
                      color: 'rgba(255,255,255,0.6)',
                      fontSize: 12,
                      margin: '4px 0 10px 0',
                      lineHeight: 1.5,
                    }}>
                      {result.description}
                    </p>
                    <div style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 16,
                      flexWrap: 'wrap',
                    }}>
                      {result.language && (
                        <div style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: 6,
                        }}>
                          <div style={{
                            width: 10,
                            height: 10,
                            borderRadius: '50%',
                            backgroundColor: languageColors[result.language] || '#888',
                          }} />
                          <span style={{
                            color: 'rgba(255,255,255,0.5)',
                            fontSize: 11,
                          }}>
                            {result.language}
                          </span>
                        </div>
                      )}
                      <div style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: 4,
                        color: 'rgba(255,255,255,0.5)',
                        fontSize: 11,
                      }}>
                        <Star size={12} style={{ color: '#f39c12' }} />
                        {formatNumber(result.stars)}
                      </div>
                      <div style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: 4,
                        color: 'rgba(255,255,255,0.5)',
                        fontSize: 11,
                      }}>
                        <GitFork size={12} />
                        {formatNumber(result.forks)}
                      </div>
                      <div style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: 4,
                        color: 'rgba(255,255,255,0.4)',
                        fontSize: 11,
                      }}>
                        <Clock size={12} />
                        {relativeTime(result.updatedAt)}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <div style={{
        padding: '10px 16px',
        background: 'rgba(0,0,0,0.3)',
        borderTop: '1px solid rgba(255,255,255,0.08)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
      }}>
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: 12,
        }}>
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: 6,
            color: 'rgba(255,255,255,0.5)',
            fontSize: 11,
          }}>
            <GitBranch size={12} />
            <span>GitHub API</span>
          </div>
        </div>
        <div style={{
          color: 'rgba(255,255,255,0.4)',
          fontSize: 11,
        }}>
          {results.length > 0 ? `${results.length} results found` : ''}
        </div>
      </div>
    </div>
  )
}