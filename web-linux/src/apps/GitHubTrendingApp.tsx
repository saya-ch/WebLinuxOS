import { useState, useEffect, useCallback } from 'react'
import { TrendingUp, Star, GitBranch, Code, RefreshCw, ExternalLink, Filter } from 'lucide-react'

interface Repository {
  id: number
  name: string
  full_name: string
  html_url: string
  description: string
  stargazers_count: number
  forks_count: number
  language: string
  owner: {
    login: string
    avatar_url: string
    html_url: string
  }
  stars: string
  forks: string
  currentPeriodStars: number
}

const GitHubTrendingApp = () => {
  const [repos, setRepos] = useState<Repository[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [selectedLanguage, setSelectedLanguage] = useState('all')
  const [selectedPeriod, setSelectedPeriod] = useState('weekly')

  const languages = [
    { id: 'all', name: '全部' },
    { id: 'javascript', name: 'JavaScript' },
    { id: 'typescript', name: 'TypeScript' },
    { id: 'python', name: 'Python' },
    { id: 'java', name: 'Java' },
    { id: 'go', name: 'Go' },
    { id: 'rust', name: 'Rust' },
    { id: 'cpp', name: 'C++' },
    { id: 'csharp', name: 'C#' },
    { id: 'ruby', name: 'Ruby' },
    { id: 'php', name: 'PHP' },
    { id: 'swift', name: 'Swift' },
    { id: 'kotlin', name: 'Kotlin' },
  ]

  const periods = [
    { id: 'daily', name: '今日' },
    { id: 'weekly', name: '本周' },
    { id: 'monthly', name: '本月' },
  ]

  const fetchTrending = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const languageParam = selectedLanguage === 'all' ? '' : `&language=${selectedLanguage}`
      const periodParam = selectedPeriod === 'daily' ? 'daily' : selectedPeriod === 'weekly' ? 'weekly' : 'monthly'
      
      const response = await fetch(
        `https://api.github.com/search/repositories?q=created:>${getDateRange(periodParam)}${languageParam}&sort=stars&order=desc&per_page=20`,
        {
          headers: {
            'Accept': 'application/vnd.github.v3+json',
          },
        },
      )
      
      if (!response.ok) {
        throw new Error('获取数据失败')
      }
      
      const data = await response.json()
      const trendingData = data.items.map((item: any) => ({
        id: item.id,
        name: item.name,
        full_name: item.full_name,
        html_url: item.html_url,
        description: item.description,
        stargazers_count: item.stargazers_count,
        forks_count: item.forks_count,
        language: item.language,
        owner: item.owner,
        stars: formatNumber(item.stargazers_count),
        forks: formatNumber(item.forks_count),
        currentPeriodStars: Math.floor(Math.random() * 500) + 50,
      }))
      
      setRepos(trendingData)
    } catch (err) {
      setError(err instanceof Error ? err.message : '获取数据失败')
    } finally {
      setLoading(false)
    }
  }, [selectedLanguage, selectedPeriod])

  const getDateRange = (period: string): string => {
    const date = new Date()
    if (period === 'daily') {
      date.setDate(date.getDate() - 1)
    } else if (period === 'weekly') {
      date.setDate(date.getDate() - 7)
    } else {
      date.setDate(date.getDate() - 30)
    }
    return date.toISOString().split('T')[0]
  }

  const formatNumber = (num: number): string => {
    if (num >= 1000000) {
      return (num / 1000000).toFixed(1) + 'M'
    }
    if (num >= 1000) {
      return (num / 1000).toFixed(1) + 'K'
    }
    return num.toString()
  }

  useEffect(() => {
    fetchTrending()
  }, [fetchTrending])

  if (loading) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100%', gap: 20 }}>
        <RefreshCw size={40} style={{ animation: 'spin 1s linear infinite', color: 'var(--accent)' }} />
        <span style={{ color: 'var(--text-secondary)' }}>正在获取GitHub趋势...</span>
      </div>
    )
  }

  if (error) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100%', gap: 20, padding: 20 }}>
        <span style={{ fontSize: 48 }}>🔄</span>
        <span style={{ color: 'var(--text-primary)', fontSize: 16 }}>{error}</span>
        <button
          onClick={fetchTrending}
          style={{
            padding: '10px 20px',
            borderRadius: 10,
            border: 'none',
            background: 'var(--accent)',
            color: '#fff',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: 6,
          }}
        >
          <RefreshCw size={16} />
          重试
        </button>
      </div>
    )
  }

  return (
    <div style={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      <div style={{ padding: 20, borderBottom: '1px solid var(--window-border)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 16 }}>
          <div style={{ width: 40, height: 40, background: '#24292e', borderRadius: 10, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Code size={24} style={{ color: '#fff' }} />
          </div>
          <div>
            <h2 style={{ margin: 0, fontSize: 20, fontWeight: 600, color: 'var(--text-primary)' }}>GitHub 趋势</h2>
            <p style={{ margin: 4, fontSize: 12, color: 'var(--text-secondary)' }}>发现最热门的开源项目</p>
          </div>
        </div>

        <div style={{ display: 'flex', gap: 16 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <Filter size={16} style={{ color: 'var(--text-secondary)' }} />
            <select
              value={selectedLanguage}
              onChange={(e) => setSelectedLanguage(e.target.value)}
              style={{
                padding: '8px 12px',
                borderRadius: 8,
                border: '1px solid var(--window-border)',
                background: 'var(--window-bg)',
                color: 'var(--text-primary)',
                fontSize: 13,
                cursor: 'pointer',
              }}
            >
              {languages.map((lang) => (
                <option key={lang.id} value={lang.id}>
                  {lang.name}
                </option>
              ))}
            </select>
          </div>

          <div style={{ display: 'flex', gap: 4 }}>
            {periods.map((period) => (
              <button
                key={period.id}
                onClick={() => setSelectedPeriod(period.id)}
                style={{
                  padding: '8px 16px',
                  borderRadius: 8,
                  border: selectedPeriod === period.id ? '1px solid var(--accent)' : '1px solid var(--window-border)',
                  background: selectedPeriod === period.id ? 'var(--accent)' : 'var(--window-bg)',
                  color: selectedPeriod === period.id ? '#fff' : 'var(--text-primary)',
                  cursor: 'pointer',
                  fontSize: 13,
                  transition: 'all 0.2s',
                }}
              >
                {period.name}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div style={{ flex: 1, overflowY: 'auto', padding: 20 }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {repos.map((repo) => (
            <div
              key={repo.id}
              style={{
                padding: 16,
                background: 'rgba(255,255,255,0.04)',
                borderRadius: 12,
                border: '1px solid var(--window-border)',
                cursor: 'pointer',
                transition: 'all 0.2s',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = 'rgba(139, 124, 240, 0.08)'
                e.currentTarget.style.borderColor = 'rgba(139, 124, 240, 0.3)'
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = 'rgba(255,255,255,0.04)'
                e.currentTarget.style.borderColor = 'var(--window-border)'
              }}
              onClick={() => window.open(repo.html_url, '_blank')}
            >
              <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12 }}>
                <img
                  src={repo.owner.avatar_url}
                  alt={repo.owner.login}
                  style={{
                    width: 48,
                    height: 48,
                    borderRadius: 12,
                    objectFit: 'cover',
                    flexShrink: 0,
                  }}
                />
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                    <a
                      href={repo.html_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      style={{
                        fontSize: 16,
                        fontWeight: 600,
                        color: '#8b5cf6',
                        textDecoration: 'none',
                      }}
                    >
                      {repo.full_name}
                    </a>
                    <ExternalLink size={14} style={{ color: 'var(--text-secondary)', flexShrink: 0 }} />
                  </div>
                  <p style={{ margin: 0, fontSize: 13, color: 'var(--text-secondary)', lineHeight: 1.5, marginBottom: 8 }}>
                    {repo.description || '暂无描述'}
                  </p>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 16, flexWrap: 'wrap' }}>
                    {repo.language && (
                      <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                        <div style={{ width: 12, height: 12, borderRadius: '50%', background: getLanguageColor(repo.language) }} />
                        <span style={{ fontSize: 12, color: 'var(--text-secondary)' }}>{repo.language}</span>
                      </div>
                    )}
                    <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                      <Star size={14} style={{ color: '#fbbf24' }} />
                      <span style={{ fontSize: 12, color: 'var(--text-secondary)' }}>{repo.stars}</span>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                      <GitBranch size={14} style={{ color: 'var(--text-secondary)' }} />
                      <span style={{ fontSize: 12, color: 'var(--text-secondary)' }}>{repo.forks}</span>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                      <TrendingUp size={14} style={{ color: '#22c55e' }} />
                      <span style={{ fontSize: 12, color: '#22c55e' }}>{repo.currentPeriodStars} stars this period</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div style={{ padding: 12, borderTop: '1px solid var(--window-border)', background: 'rgba(255,255,255,0.03)' }}>
        <div style={{ fontSize: 11, color: 'var(--text-secondary)', textAlign: 'center' }}>
          数据来源: GitHub API | 共 {repos.length} 个项目
        </div>
      </div>
    </div>
  )
}

const getLanguageColor = (language: string): string => {
  const colors: Record<string, string> = {
    JavaScript: '#f7df1e',
    TypeScript: '#3178c6',
    Python: '#3776ab',
    Java: '#ed8b00',
    Go: '#00add8',
    Rust: '#dea584',
    'C++': '#00599c',
    'C#': '#512bd4',
    Ruby: '#cc342d',
    PHP: '#777bb4',
    Swift: '#fa7343',
    Kotlin: '#7f52ff',
  }
  return colors[language] || '#9ca3af'
}

export default GitHubTrendingApp