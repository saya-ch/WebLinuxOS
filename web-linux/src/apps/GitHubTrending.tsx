import { useState, useEffect } from 'react'
import { useStore } from '../store'

interface GitHubRepo {
  id: number
  name: string
  full_name: string
  description: string
  html_url: string
  stargazers_count: number
  forks_count: number
  language: string
  owner: {
    login: string
    avatar_url: string
  }
  updated_at: string
}

interface LanguageOption {
  value: string
  label: string
}

const languages: LanguageOption[] = [
  { value: '', label: '全部语言' },
  { value: 'javascript', label: 'JavaScript' },
  { value: 'typescript', label: 'TypeScript' },
  { value: 'python', label: 'Python' },
  { value: 'java', label: 'Java' },
  { value: 'go', label: 'Go' },
  { value: 'rust', label: 'Rust' },
  { value: 'cpp', label: 'C++' },
  { value: 'c', label: 'C' },
  { value: 'csharp', label: 'C#' },
  { value: 'ruby', label: 'Ruby' },
  { value: 'php', label: 'PHP' },
  { value: 'swift', label: 'Swift' },
  { value: 'kotlin', label: 'Kotlin' },
]

const dateRangeOptions = [
  { value: 'daily', label: '今日' },
  { value: 'weekly', label: '本周' },
  { value: 'monthly', label: '本月' },
]

export default function GitHubTrending() {
  const { theme } = useStore()
  const isDark = theme === 'dark'
  const [repos, setRepos] = useState<GitHubRepo[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [selectedLanguage, setSelectedLanguage] = useState('')
  const [dateRange, setDateRange] = useState('daily')
  const [favorites, setFavorites] = useState<string[]>(() => {
    const saved = localStorage.getItem('weblinux-github-favorites')
    return saved ? JSON.parse(saved) : []
  })

  const bg = isDark ? '#1a1a2e' : '#f5f5f5'
  const textColor = isDark ? '#e0e0e0' : '#333'
  const cardBg = isDark ? 'rgba(255,255,255,0.05)' : '#fff'
  const borderColor = isDark ? '#2a2a4a' : '#ddd'
  const accent = isDark ? '#4fc3f7' : '#1976d2'
  const mutedColor = isDark ? '#888' : '#666'

  const toggleFavorite = (repoId: string) => {
    const newFavorites = favorites.includes(repoId)
      ? favorites.filter(id => id !== repoId)
      : [...favorites, repoId]
    setFavorites(newFavorites)
    localStorage.setItem('weblinux-github-favorites', JSON.stringify(newFavorites))
  }

  const formatNumber = (num: number): string => {
    if (num >= 1000000) {
      return (num / 1000000).toFixed(1) + 'M'
    } else if (num >= 1000) {
      return (num / 1000).toFixed(1) + 'K'
    }
    return num.toString()
  }

  const formatDate = (dateStr: string): string => {
    const date = new Date(dateStr)
    const now = new Date()
    const diff = now.getTime() - date.getTime()
    const days = Math.floor(diff / (1000 * 60 * 60 * 24))
    
    if (days === 0) return '今天'
    if (days === 1) return '昨天'
    if (days < 7) return `${days}天前`
    return date.toLocaleDateString('zh-CN')
  }

  const fetchTrending = async () => {
    setLoading(true)
    setError(null)
    
    try {
      const days = dateRange === 'daily' ? 1 : dateRange === 'weekly' ? 7 : 30
      const since = new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
      
      let query = `created:>=${since}`
      if (selectedLanguage) {
        query += ` language:${selectedLanguage}`
      }
      
      const response = await fetch(
        `https://api.github.com/search/repositories?q=${encodeURIComponent(query)}&sort=stars&order=desc&per_page=30`
      )
      
      if (!response.ok) {
        throw new Error('获取数据失败')
      }
      
      const data = await response.json()
      setRepos(data.items || [])
    } catch (err) {
      setError(err instanceof Error ? err.message : '获取失败')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchTrending()
  }, [selectedLanguage, dateRange])

  return (
    <div style={{ height: '100%', background: bg, color: textColor, fontFamily: 'system-ui, sans-serif', fontSize: 13, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
      <div style={{ padding: 16, borderBottom: `1px solid ${borderColor}` }}>
        <div style={{ display: 'flex', gap: 12, alignItems: 'center', flexWrap: 'wrap', marginBottom: 12 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <span style={{ fontSize: 12, color: mutedColor }}>语言:</span>
            <select
              value={selectedLanguage}
              onChange={(e) => setSelectedLanguage(e.target.value)}
              style={{
                padding: '6px 10px',
                borderRadius: 6,
                border: `1px solid ${borderColor}`,
                background: cardBg,
                color: textColor,
                fontSize: 12,
                outline: 'none'
              }}
            >
              {languages.map(lang => (
                <option key={lang.value} value={lang.value}>{lang.label}</option>
              ))}
            </select>
          </div>
          
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <span style={{ fontSize: 12, color: mutedColor }}>时间范围:</span>
            <select
              value={dateRange}
              onChange={(e) => setDateRange(e.target.value)}
              style={{
                padding: '6px 10px',
                borderRadius: 6,
                border: `1px solid ${borderColor}`,
                background: cardBg,
                color: textColor,
                fontSize: 12,
                outline: 'none'
              }}
            >
              {dateRangeOptions.map(opt => (
                <option key={opt.value} value={opt.value}>{opt.label}</option>
              ))}
            </select>
          </div>
          
          <button
            onClick={fetchTrending}
            disabled={loading}
            style={{
              padding: '6px 16px',
              borderRadius: 6,
              border: 'none',
              background: loading ? '#666' : accent,
              color: '#fff',
              fontSize: 12,
              cursor: loading ? 'not-allowed' : 'pointer'
            }}
          >
            {loading ? '刷新中...' : '🔄 刷新'}
          </button>
        </div>
      </div>

      <div style={{ flex: 1, overflowY: 'auto', padding: 16 }}>
        {loading && (
          <div style={{ textAlign: 'center', padding: 40 }}>
            <div style={{ fontSize: 32 }}>🚀</div>
            <div style={{ marginTop: 8, color: mutedColor }}>正在加载热门仓库...</div>
          </div>
        )}

        {error && !loading && (
          <div style={{ textAlign: 'center', padding: 40 }}>
            <div style={{ fontSize: 48 }}>😕</div>
            <div style={{ marginTop: 12, color: '#f66', fontSize: 14 }}>{error}</div>
            <button
              onClick={fetchTrending}
              style={{
                marginTop: 16,
                padding: '8px 20px',
                borderRadius: 6,
                border: 'none',
                background: accent,
                color: '#fff',
                cursor: 'pointer'
              }}
            >
              重试
            </button>
          </div>
        )}

        {!loading && !error && repos.length === 0 && (
          <div style={{ textAlign: 'center', padding: 60 }}>
            <div style={{ fontSize: 64, marginBottom: 16 }}>📦</div>
            <div style={{ color: mutedColor, fontSize: 14 }}>没有找到仓库</div>
          </div>
        )}

        {!loading && !error && repos.length > 0 && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {repos.map((repo) => (
              <div
                key={repo.id}
                style={{
                  background: cardBg,
                  borderRadius: 12,
                  padding: 16,
                  border: `1px solid ${borderColor}`,
                }}
              >
                <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 12 }}>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8 }}>
                      <img
                        src={repo.owner.avatar_url}
                        alt=""
                        style={{ width: 32, height: 32, borderRadius: '50%' }}
                      />
                      <a
                        href={repo.html_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        style={{ color: accent, textDecoration: 'none', fontWeight: 600, fontSize: 16 }}
                      >
                        {repo.full_name}
                      </a>
                    </div>
                    
                    <p style={{
                      margin: '8px 0',
                      color: mutedColor,
                      fontSize: 13,
                      lineHeight: 1.6
                    }}>
                      {repo.description || '暂无描述'}
                    </p>
                    
                    <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap', marginTop: 12 }}>
                      {repo.language && (
                        <span style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 12 }}>
                          <span style={{
                            width: 12,
                            height: 12,
                            borderRadius: '50%',
                            background: repo.language === 'JavaScript' ? '#f1e05a' :
                              repo.language === 'TypeScript' ? '#3178c6' :
                              repo.language === 'Python' ? '#3572A5' :
                              repo.language === 'Java' ? '#b07219' :
                              repo.language === 'Go' ? '#00ADD8' :
                              repo.language === 'Rust' ? '#dea584' : '#666'
                          }}></span>
                          {repo.language}
                        </span>
                      )}
                      <span style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 12, color: mutedColor }}>
                        ⭐ {formatNumber(repo.stargazers_count)}
                      </span>
                      <span style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 12, color: mutedColor }}>
                        🍴 {formatNumber(repo.forks_count)}
                      </span>
                      <span style={{ fontSize: 12, color: mutedColor }}>
                        更新于 {formatDate(repo.updated_at)}
                      </span>
                    </div>
                  </div>
                  
                  <button
                    onClick={() => toggleFavorite(repo.full_name)}
                    style={{
                      border: 'none',
                      background: 'transparent',
                      fontSize: 20,
                      cursor: 'pointer',
                      padding: 4,
                      color: favorites.includes(repo.full_name) ? '#f59e0b' : mutedColor
                    }}
                    title={favorites.includes(repo.full_name) ? '取消收藏' : '收藏'}
                  >
                    {favorites.includes(repo.full_name) ? '⭐' : '☆'}
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
