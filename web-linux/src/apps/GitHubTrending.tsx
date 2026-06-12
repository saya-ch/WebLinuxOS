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
  topics?: string[]
}

interface LanguageOption {
  value: string
  label: string
}

interface CacheEntry {
  data: GitHubRepo[]
  timestamp: number
}

const CACHE_TTL = 30 * 60 * 1000 // 30 minutes
const CACHE_KEY_PREFIX = 'weblinux-github-trending-v2'
const FALLBACK_CACHE_KEY = 'weblinux-github-fallback-v2'

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

const mockRepos: GitHubRepo[] = [
  {
    id: 10270250,
    name: 'react',
    full_name: 'facebook/react',
    description: '用于构建用户界面的声明式、高效、灵活的 JavaScript 库',
    html_url: 'https://github.com/facebook/react',
    stargazers_count: 225000,
    forks_count: 46000,
    language: 'JavaScript',
    owner: { login: 'facebook', avatar_url: 'https://avatars.githubusercontent.com/u/69631?v=4' },
    updated_at: new Date().toISOString(),
    topics: ['javascript', 'ui', 'library', 'frontend', 'declarative']
  },
  {
    id: 11730342,
    name: 'vue',
    full_name: 'vuejs/vue',
    description: '渐进式 JavaScript 框架，用于构建交互式 Web 界面',
    html_url: 'https://github.com/vuejs/vue',
    stargazers_count: 207000,
    forks_count: 33000,
    language: 'JavaScript',
    owner: { login: 'vuejs', avatar_url: 'https://avatars.githubusercontent.com/u/6128107?v=4' },
    updated_at: new Date().toISOString(),
    topics: ['vue', 'javascript', 'framework', 'frontend', 'reactive']
  },
  {
    id: 92902895,
    name: 'Next.js',
    full_name: 'vercel/next.js',
    description: 'React 框架，用于生产环境，支持 SSR、SSG 和路由',
    html_url: 'https://github.com/vercel/next.js',
    stargazers_count: 125000,
    forks_count: 27000,
    language: 'JavaScript',
    owner: { login: 'vercel', avatar_url: 'https://avatars.githubusercontent.com/u/14985020?v=4' },
    updated_at: new Date().toISOString(),
    topics: ['react', 'ssr', 'framework', 'nodejs', 'static-site-generator']
  },
  {
    id: 69932001,
    name: 'vite',
    full_name: 'vitejs/vite',
    description: '下一代前端工具链，提供极速的开发体验',
    html_url: 'https://github.com/vitejs/vite',
    stargazers_count: 68000,
    forks_count: 6100,
    language: 'TypeScript',
    owner: { login: 'vitejs', avatar_url: 'https://avatars.githubusercontent.com/u/83772613?v=4' },
    updated_at: new Date().toISOString(),
    topics: ['build-tool', 'vite', 'frontend', 'hmr', 'typescript']
  },
  {
    id: 145689817,
    name: 'TypeScript',
    full_name: 'microsoft/TypeScript',
    description: 'JavaScript 的超集，编译为纯 JavaScript，提供静态类型检查',
    html_url: 'https://github.com/microsoft/TypeScript',
    stargazers_count: 98000,
    forks_count: 12000,
    language: 'TypeScript',
    owner: { login: 'microsoft', avatar_url: 'https://avatars.githubusercontent.com/u/6154722?v=4' },
    updated_at: new Date().toISOString(),
    topics: ['typescript', 'javascript', 'language', 'compiler', 'static-typing']
  },
  {
    id: 81598961,
    name: 'tailwindcss',
    full_name: 'tailwindlabs/tailwindcss',
    description: '实用优先的 CSS 框架，支持快速构建自定义用户界面',
    html_url: 'https://github.com/tailwindlabs/tailwindcss',
    stargazers_count: 80000,
    forks_count: 4200,
    language: 'JavaScript',
    owner: { login: 'tailwindlabs', avatar_url: 'https://avatars.githubusercontent.com/u/67109815?v=4' },
    updated_at: new Date().toISOString(),
    topics: ['css', 'utility', 'framework', 'tailwindcss', 'design']
  },
  {
    id: 24195339,
    name: 'awesome',
    full_name: 'sindresorhus/awesome',
    description: '有趣的精选列表集合，关于各种有趣的事物',
    html_url: 'https://github.com/sindresorhus/awesome',
    stargazers_count: 315000,
    forks_count: 27500,
    language: 'Markdown',
    owner: { login: 'sindresorhus', avatar_url: 'https://avatars.githubusercontent.com/u/170270?v=4' },
    updated_at: new Date().toISOString(),
    topics: ['awesome', 'lists', 'curated', 'resources']
  },
  {
    id: 123458555,
    name: 'python',
    full_name: 'python/cpython',
    description: 'Python 编程语言官方实现',
    html_url: 'https://github.com/python/cpython',
    stargazers_count: 62000,
    forks_count: 29500,
    language: 'Python',
    owner: { login: 'python', avatar_url: 'https://avatars.githubusercontent.com/u/1525981?v=4' },
    updated_at: new Date().toISOString(),
    topics: ['python', 'language', 'interpreter', 'cpython']
  },
  {
    id: 287790885,
    name: 'chatgpt-next-web',
    full_name: 'ChatGPTNextWeb/ChatGPT-Next-Web',
    description: '一个拥有精美 UI 的跨平台 ChatGPT 客户端',
    html_url: 'https://github.com/ChatGPTNextWeb/ChatGPT-Next-Web',
    stargazers_count: 65000,
    forks_count: 55000,
    language: 'TypeScript',
    owner: { login: 'ChatGPTNextWeb', avatar_url: 'https://avatars.githubusercontent.com/u/133495084?v=4' },
    updated_at: new Date().toISOString(),
    topics: ['chatgpt', 'ai', 'webapp', 'nextjs', 'typescript']
  },
  {
    id: 40772264,
    name: 'go',
    full_name: 'golang/go',
    description: 'Go 编程语言官方仓库',
    html_url: 'https://github.com/golang/go',
    stargazers_count: 122000,
    forks_count: 17500,
    language: 'Go',
    owner: { login: 'golang', avatar_url: 'https://avatars.githubusercontent.com/u/4314092?v=4' },
    updated_at: new Date().toISOString(),
    topics: ['go', 'golang', 'language', 'compiler']
  },
  {
    id: 52837576,
    name: 'rust',
    full_name: 'rust-lang/rust',
    description: '赋予每个人构建可靠高效软件的能力',
    html_url: 'https://github.com/rust-lang/rust',
    stargazers_count: 95000,
    forks_count: 12200,
    language: 'Rust',
    owner: { login: 'rust-lang', avatar_url: 'https://avatars.githubusercontent.com/u/5430905?v=4' },
    updated_at: new Date().toISOString(),
    topics: ['rust', 'language', 'compiler', 'systems']
  },
  {
    id: 119553231,
    name: 'node',
    full_name: 'nodejs/node',
    description: 'Node.js JavaScript 运行时',
    html_url: 'https://github.com/nodejs/node',
    stargazers_count: 104000,
    forks_count: 28500,
    language: 'JavaScript',
    owner: { login: 'nodejs', avatar_url: 'https://avatars.githubusercontent.com/u/9950313?v=4' },
    updated_at: new Date().toISOString(),
    topics: ['nodejs', 'javascript', 'runtime', 'server']
  },
  {
    id: 15522064,
    name: 'tensorflow',
    full_name: 'tensorflow/tensorflow',
    description: '一个面向所有人的开源机器学习框架',
    html_url: 'https://github.com/tensorflow/tensorflow',
    stargazers_count: 185000,
    forks_count: 74000,
    language: 'Python',
    owner: { login: 'tensorflow', avatar_url: 'https://avatars.githubusercontent.com/u/15658638?v=4' },
    updated_at: new Date().toISOString(),
    topics: ['machine-learning', 'ai', 'python', 'deep-learning', 'tensorflow']
  },
  {
    id: 218723281,
    name: 'flutter',
    full_name: 'flutter/flutter',
    description: '谷歌的移动、Web 和桌面 UI 工具包',
    html_url: 'https://github.com/flutter/flutter',
    stargazers_count: 164000,
    forks_count: 27500,
    language: 'Dart',
    owner: { login: 'flutter', avatar_url: 'https://avatars.githubusercontent.com/u/14101776?v=4' },
    updated_at: new Date().toISOString(),
    topics: ['flutter', 'dart', 'mobile', 'cross-platform', 'ui']
  },
  {
    id: 596892,
    name: 'jquery',
    full_name: 'jquery/jquery',
    description: 'jQuery JavaScript 库',
    html_url: 'https://github.com/jquery/jquery',
    stargazers_count: 58000,
    forks_count: 20500,
    language: 'JavaScript',
    owner: { login: 'jquery', avatar_url: 'https://avatars.githubusercontent.com/u/70142?v=4' },
    updated_at: new Date().toISOString(),
    topics: ['jquery', 'javascript', 'dom', 'library']
  },
  {
    id: 13409255,
    name: 'django',
    full_name: 'django/django',
    description: '完美主义者用的 Web 框架，有最终期限',
    html_url: 'https://github.com/django/django',
    stargazers_count: 78000,
    forks_count: 31500,
    language: 'Python',
    owner: { login: 'django', avatar_url: 'https://avatars.githubusercontent.com/u/27804?v=4' },
    updated_at: new Date().toISOString(),
    topics: ['python', 'django', 'web', 'framework', 'orm']
  },
  {
    id: 136542346,
    name: 'deno',
    full_name: 'denoland/deno',
    description: '一个现代化的 JavaScript、TypeScript 和 WebAssembly 运行时',
    html_url: 'https://github.com/denoland/deno',
    stargazers_count: 94000,
    forks_count: 5200,
    language: 'Rust',
    owner: { login: 'denoland', avatar_url: 'https://avatars.githubusercontent.com/u/42048915?v=4' },
    updated_at: new Date().toISOString(),
    topics: ['deno', 'typescript', 'javascript', 'runtime', 'rust']
  },
  {
    id: 30721735,
    name: 'axios',
    full_name: 'axios/axios',
    description: '基于 Promise 的 HTTP 客户端，适用于浏览器和 node.js',
    html_url: 'https://github.com/axios/axios',
    stargazers_count: 105000,
    forks_count: 10800,
    language: 'JavaScript',
    owner: { login: 'axios', avatar_url: 'https://avatars.githubusercontent.com/u/32372331?v=4' },
    updated_at: new Date().toISOString(),
    topics: ['http', 'client', 'javascript', 'promise', 'xhr']
  }
]

export default function GitHubTrending() {
  const { theme } = useStore()
  const isDark = theme === 'dark'
  const [repos, setRepos] = useState<GitHubRepo[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [selectedLanguage, setSelectedLanguage] = useState('')
  const [dateRange, setDateRange] = useState('daily')
  const [activeTab, setActiveTab] = useState<'trending' | 'favorites'>('trending')
  const [searchQuery, setSearchQuery] = useState('')
  const [expandedCards, setExpandedCards] = useState<Set<string>>(new Set())
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null)
  const [favorites, setFavorites] = useState<string[]>(() => {
    const saved = localStorage.getItem('weblinux-github-favorites')
    return saved ? JSON.parse(saved) : []
  })

  const bg = isDark ? '#1a1a2e' : '#f5f5f5'
  const textColor = isDark ? '#e0e0e0' : '#333'
  const cardBg = isDark ? 'rgba(255,255,255,0.05)' : '#fff'
  const hoverBg = isDark ? 'rgba(255,255,255,0.1)' : '#fffbe6'
  const borderColor = isDark ? '#2a2a4a' : '#ddd'
  const accent = isDark ? '#4fc3f7' : '#1976d2'
  const mutedColor = isDark ? '#888' : '#666'

  const getCacheKey = (lang: string, range: string) => {
    return `${CACHE_KEY_PREFIX}-${lang}-${range}`
  }

  const getCache = (lang: string, range: string): CacheEntry | null => {
    try {
      const raw = localStorage.getItem(getCacheKey(lang, range))
      if (!raw) return null
      const entry: CacheEntry = JSON.parse(raw)
      if (Date.now() - entry.timestamp > CACHE_TTL) return null
      return entry
    } catch {
      return null
    }
  }

  const setCache = (lang: string, range: string, data: GitHubRepo[]) => {
    try {
      const entry: CacheEntry = { data, timestamp: Date.now() }
      localStorage.setItem(getCacheKey(lang, range), JSON.stringify(entry))
    } catch {
      // ignore storage errors
    }
  }

  const toggleFavorite = (repoId: string) => {
    const newFavorites = favorites.includes(repoId)
      ? favorites.filter(id => id !== repoId)
      : [...favorites, repoId]
    setFavorites(newFavorites)
    localStorage.setItem('weblinux-github-favorites', JSON.stringify(newFavorites))
  }

  const toggleExpand = (repoFullName: string) => {
    setExpandedCards(prev => {
      const next = new Set(prev)
      if (next.has(repoFullName)) {
        next.delete(repoFullName)
      } else {
        next.add(repoFullName)
      }
      return next
    })
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

  const formatUpdateTime = (date: Date): string => {
    return date.toLocaleString('zh-CN', {
      hour12: false,
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit'
    })
  }

  const fetchTrending = async () => {
    setLoading(true)
    setError(null)

    const cache = getCache(selectedLanguage, dateRange)
    if (cache) {
      setRepos(cache.data)
      setLastUpdated(new Date(cache.timestamp))
      setLoading(false)
    }

    try {
      const days = dateRange === 'daily' ? 1 : dateRange === 'weekly' ? 7 : 30

      // 策略 1: 基于 push 时间 + 星数，尝试找到最近活跃的流行仓库
      const pushedSince = new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString().split('T')[0]

      const queries: string[] = []
      if (selectedLanguage) {
        queries.push(`pushed:>=${pushedSince} language:${selectedLanguage}`)
        queries.push(`language:${selectedLanguage} stars:>1000`)
      } else {
        queries.push(`pushed:>=${pushedSince}`)
        queries.push('stars:>10000')
      }

      let finalItems: GitHubRepo[] = []
      let lastError: Error | null = null

      for (const query of queries) {
        try {
          const response = await fetch(
            `https://api.github.com/search/repositories?q=${encodeURIComponent(query)}&sort=stars&order=desc&per_page=30`,
            { headers: { Accept: 'application/vnd.github+json' } }
          )
          if (!response.ok) {
            lastError = new Error(`GitHub API 错误: ${response.status} ${response.statusText}`)
            continue
          }
          const data = await response.json()
          const items: GitHubRepo[] = data.items || []
          // 合并并去重
          const seen = new Set(finalItems.map((r) => r.id))
          for (const item of items) {
            if (!seen.has(item.id)) finalItems.push(item)
          }
          if (finalItems.length >= 20) break
        } catch (e) {
          lastError = e instanceof Error ? e : new Error(String(e))
        }
      }

      if (!finalItems.length) {
        throw lastError || new Error('没有找到匹配的仓库')
      }

      finalItems.sort((a, b) => b.stargazers_count - a.stargazers_count)
      setRepos(finalItems)
      setLastUpdated(new Date())
      setCache(selectedLanguage, dateRange, finalItems)
      setError(null)
    } catch (err) {
      const msg = err instanceof Error ? err.message : '获取失败'
      setError(msg + (cache ? ' (使用缓存数据)' : ' (使用示例数据)'))
      if (!cache) {
        setRepos(mockRepos)
        setLastUpdated(new Date())
        setCache(selectedLanguage, dateRange, mockRepos)
        try {
          localStorage.setItem(FALLBACK_CACHE_KEY, JSON.stringify({ data: mockRepos, timestamp: Date.now() }))
        } catch { /* ignore */ }
      }
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchTrending()
  }, [selectedLanguage, dateRange])

  const filteredRepos = repos
    .filter(repo => activeTab === 'trending' ? true : favorites.includes(repo.full_name))
    .filter(repo => {
      if (!searchQuery.trim()) return true
      const q = searchQuery.toLowerCase()
      return (
        repo.full_name.toLowerCase().includes(q) ||
        (repo.description && repo.description.toLowerCase().includes(q)) ||
        (repo.name && repo.name.toLowerCase().includes(q))
      )
    })

  const openAllInGitHub = () => {
    const days = dateRange === 'daily' ? 1 : dateRange === 'weekly' ? 7 : 30
    const since = new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
    let query = `created:>=${since}`
    if (selectedLanguage) {
      query += ` language:${selectedLanguage}`
    }
    const url = `https://github.com/search?q=${encodeURIComponent(query)}&type=repositories&s=stars&o=desc`
    window.open(url, '_blank')
  }

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

          <button
            onClick={openAllInGitHub}
            style={{
              padding: '6px 16px',
              borderRadius: 6,
              border: `1px solid ${borderColor}`,
              background: cardBg,
              color: textColor,
              fontSize: 12,
              cursor: 'pointer'
            }}
          >
            🔗 查看所有
          </button>
        </div>

        <div style={{ display: 'flex', gap: 8, alignItems: 'center', marginBottom: 12 }}>
          <button
            onClick={() => setActiveTab('trending')}
            style={{
              padding: '6px 16px',
              borderRadius: 6,
              border: `1px solid ${activeTab === 'trending' ? accent : borderColor}`,
              background: activeTab === 'trending' ? accent : cardBg,
              color: activeTab === 'trending' ? '#fff' : textColor,
              fontSize: 12,
              cursor: 'pointer',
              fontWeight: activeTab === 'trending' ? 600 : 400
            }}
          >
            🔥 热门
          </button>
          <button
            onClick={() => setActiveTab('favorites')}
            style={{
              padding: '6px 16px',
              borderRadius: 6,
              border: `1px solid ${activeTab === 'favorites' ? accent : borderColor}`,
              background: activeTab === 'favorites' ? accent : cardBg,
              color: activeTab === 'favorites' ? '#fff' : textColor,
              fontSize: 12,
              cursor: 'pointer',
              fontWeight: activeTab === 'favorites' ? 600 : 400
            }}
          >
            ⭐ 收藏 ({favorites.length})
          </button>
        </div>

        {lastUpdated && (
          <div style={{ fontSize: 11, color: mutedColor, marginBottom: 8 }}>
            最后更新: {formatUpdateTime(lastUpdated)}
          </div>
        )}

        <div style={{ display: 'flex', gap: 8 }}>
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="🔍 搜索项目名称或描述..."
            style={{
              flex: 1,
              padding: '8px 12px',
              borderRadius: 6,
              border: `1px solid ${borderColor}`,
              background: cardBg,
              color: textColor,
              fontSize: 12,
              outline: 'none'
            }}
          />
        </div>
      </div>

      <div style={{ flex: 1, overflowY: 'auto', padding: 16 }}>
        {error && (
          <div style={{
            marginBottom: 12,
            padding: '10px 14px',
            borderRadius: 8,
            background: 'rgba(239, 68, 68, 0.1)',
            border: '1px solid rgba(239, 68, 68, 0.3)',
            color: 'rgb(239, 68, 68)',
            fontSize: 12,
          }}>
            ⚠️ {error}
          </div>
        )}

        {loading && !repos.length && (
          <div style={{ textAlign: 'center', padding: 40 }}>
            <div style={{ fontSize: 32 }}>🚀</div>
            <div style={{ marginTop: 8, color: mutedColor }}>正在加载热门仓库...</div>
          </div>
        )}

        {!loading && activeTab === 'favorites' && filteredRepos.length === 0 && (
          <div style={{ textAlign: 'center', padding: 60 }}>
            <div style={{ fontSize: 64, marginBottom: 16 }}>⭐</div>
            <div style={{ color: mutedColor, fontSize: 14 }}>暂无收藏项目</div>
            <div style={{ color: mutedColor, fontSize: 12, marginTop: 8 }}>点击项目卡片上的星标来收藏项目</div>
          </div>
        )}

        {!loading && activeTab === 'trending' && filteredRepos.length === 0 && !error && (
          <div style={{ textAlign: 'center', padding: 60 }}>
            <div style={{ fontSize: 64, marginBottom: 16 }}>📦</div>
            <div style={{ color: mutedColor, fontSize: 14 }}>没有找到仓库</div>
          </div>
        )}

        {!loading && filteredRepos.length > 0 && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {filteredRepos.map((repo) => (
              <div
                key={repo.id}
                onClick={() => toggleExpand(repo.full_name)}
                onMouseEnter={(e) => { e.currentTarget.style.background = hoverBg }}
                onMouseLeave={(e) => { e.currentTarget.style.background = cardBg }}
                style={{
                  background: cardBg,
                  borderRadius: 12,
                  padding: 16,
                  border: `1px solid ${borderColor}`,
                  cursor: 'pointer',
                  transition: 'background 0.2s ease'
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
                        onClick={(e) => e.stopPropagation()}
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
                      <span style={{ fontSize: 12, color: accent, marginLeft: 'auto' }}>
                        {expandedCards.has(repo.full_name) ? '▲ 收起' : '▼ 展开详情'}
                      </span>
                    </div>

                    {expandedCards.has(repo.full_name) && repo.topics && repo.topics.length > 0 && (
                      <div style={{ marginTop: 16, paddingTop: 12, borderTop: `1px solid ${borderColor}` }}>
                        <div style={{ fontSize: 11, color: mutedColor, marginBottom: 8 }}>主题标签:</div>
                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                          {repo.topics.map((topic, idx) => (
                            <span
                              key={idx}
                              style={{
                                padding: '4px 10px',
                                borderRadius: 12,
                                background: isDark ? 'rgba(79,195,247,0.15)' : 'rgba(25,118,210,0.1)',
                                color: accent,
                                fontSize: 11,
                                border: `1px solid ${isDark ? 'rgba(79,195,247,0.3)' : 'rgba(25,118,210,0.2)'}`
                              }}
                            >
                              #{topic}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}

                    {expandedCards.has(repo.full_name) && (!repo.topics || repo.topics.length === 0) && (
                      <div style={{ marginTop: 16, paddingTop: 12, borderTop: `1px solid ${borderColor}`, fontSize: 11, color: mutedColor }}>
                        该项目暂无可用的主题标签信息
                      </div>
                    )}
                  </div>

                  <button
                    onClick={(e) => { e.stopPropagation(); toggleFavorite(repo.full_name) }}
                    style={{
                      border: 'none',
                      background: 'transparent',
                      fontSize: 20,
                      cursor: 'pointer',
                      padding: 4,
                      color: favorites.includes(repo.full_name) ? '#f59e0b' : mutedColor,
                      flexShrink: 0
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
