import { useState, useEffect, useCallback, memo } from 'react'

interface NewsArticle {
  title: string
  description: string
  url: string
  source: string
  image: string
  date: string
  category: string
}

interface NewsCategory {
  id: string
  name: string
  icon: string
}

const categories: NewsCategory[] = [
  { id: 'general', name: '综合', icon: '📰' },
  { id: 'business', name: '财经', icon: '💼' },
  { id: 'technology', name: '科技', icon: '💻' },
  { id: 'entertainment', name: '娱乐', icon: '🎬' },
  { id: 'sports', name: '体育', icon: '⚽' },
  { id: 'health', name: '健康', icon: '❤️' },
  { id: 'science', name: '科学', icon: '🔬' },
]

const FALLBACK_NEWS: NewsArticle[] = [
  {
    title: 'WebLinuxOS 发布新版本，增强用户体验',
    description: '基于Web的Linux操作系统模拟平台发布了最新版本，新增了多个实用工具和改进的用户界面。',
    url: '#',
    source: 'WebLinuxOS官方',
    image: 'https://picsum.photos/400/200?random=1',
    date: '2小时前',
    category: 'technology'
  },
  {
    title: '人工智能技术持续突破',
    description: 'AI领域取得重大进展，新一代模型在多个基准测试中刷新记录。',
    url: '#',
    source: '科技日报',
    image: 'https://picsum.photos/400/200?random=2',
    date: '5小时前',
    category: 'technology'
  },
  {
    title: '全球股市今日走势分析',
    description: '主要股市指数今日表现分化，科技股领涨。',
    url: '#',
    source: '财经时报',
    image: 'https://picsum.photos/400/200?random=3',
    date: '3小时前',
    category: 'business'
  },
  {
    title: '健康生活新趋势',
    description: '专家建议每天保持适量运动和均衡饮食对身心健康至关重要。',
    url: '#',
    source: '健康周刊',
    image: 'https://picsum.photos/400/200?random=4',
    date: '8小时前',
    category: 'health'
  },
  {
    title: '体育赛事精彩回顾',
    description: '周末各大联赛精彩纷呈，多场比赛上演逆转好戏。',
    url: '#',
    source: '体育新闻',
    image: 'https://picsum.photos/400/200?random=5',
    date: '6小时前',
    category: 'sports'
  },
  {
    title: '新发现：宇宙神秘现象',
    description: '天文学家发现了一个前所未见的宇宙现象，挑战现有理论。',
    url: '#',
    source: '科学探索',
    image: 'https://picsum.photos/400/200?random=6',
    date: '12小时前',
    category: 'science'
  },
]

const CACHE_KEY = 'weblinux-news-cache'
const CACHE_TTL = 15 * 60 * 1000

function getCachedNews(): { articles: NewsArticle[]; timestamp: number } | null {
  try {
    const raw = localStorage.getItem(CACHE_KEY)
    if (!raw) return null
    const parsed = JSON.parse(raw)
    if (Date.now() - parsed.timestamp > CACHE_TTL) return null
    return parsed
  } catch {
    return null
  }
}

function setCachedNews(articles: NewsArticle[]) {
  try {
    localStorage.setItem(CACHE_KEY, JSON.stringify({ articles, timestamp: Date.now() }))
  } catch { /* ignore */ }
}

const SmartNewsReader = memo(function SmartNewsReader() {
  const [articles, setArticles] = useState<NewsArticle[]>([])
  const [selectedCategory, setSelectedCategory] = useState('general')
  const [loading, setLoading] = useState(true)
  const [errorMsg, setErrorMsg] = useState<string | null>(null)
  const [selectedArticle, setSelectedArticle] = useState<NewsArticle | null>(null)
  const [searchQuery, setSearchQuery] = useState('')

  const fetchNews = useCallback(async () => {
    const cached = getCachedNews()
    if (cached) {
      setArticles(cached.articles)
      setLoading(false)
    }

    try {
      const response = await fetch(
        `https://newsapi.org/v2/top-headlines?country=cn&category=${selectedCategory}&apiKey=demo`
      )
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`)
      }
      const data = await response.json()
      
      if (data.articles && Array.isArray(data.articles)) {
        const formattedArticles: NewsArticle[] = data.articles.map((item: any) => ({
          title: item.title || '无标题',
          description: item.description || item.content || '暂无描述',
          url: item.url || '#',
          source: item.source?.name || '未知来源',
          image: item.urlToImage || `https://picsum.photos/400/200?random=${Math.random()}`,
          date: item.publishedAt ? formatDate(item.publishedAt) : '未知时间',
          category: selectedCategory
        }))
        setArticles(formattedArticles)
        setCachedNews(formattedArticles)
        setErrorMsg(null)
      } else {
        throw new Error('数据格式异常')
      }
    } catch (err) {
      console.warn('News fetch failed:', err)
      if (!cached) {
        setArticles(FALLBACK_NEWS)
      }
      setErrorMsg('新闻服务暂时不可用，显示缓存数据')
    } finally {
      setLoading(false)
    }
  }, [selectedCategory])

  const formatDate = (dateStr: string): string => {
    const date = new Date(dateStr)
    const now = new Date()
    const diffMs = now.getTime() - date.getTime()
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60))
    const diffDays = Math.floor(diffHours / 24)

    if (diffHours < 1) return '刚刚'
    if (diffHours < 24) return `${diffHours}小时前`
    if (diffDays < 7) return `${diffDays}天前`
    return date.toLocaleDateString('zh-CN')
  }

  useEffect(() => {
    fetchNews()
    const interval = setInterval(fetchNews, 15 * 60 * 1000)
    return () => clearInterval(interval)
  }, [fetchNews])

  const filteredArticles = articles.filter(article =>
    article.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    article.description.toLowerCase().includes(searchQuery.toLowerCase())
  )

  return (
    <div style={{
      height: '100%',
      display: 'flex',
      flexDirection: 'column',
      background: 'linear-gradient(135deg, #0f0f23 0%, #1a1a3e 100%)',
      overflow: 'hidden'
    }}>
      <div style={{
        padding: '16px 20px',
        background: 'rgba(99, 102, 241, 0.1)',
        borderBottom: '1px solid rgba(99, 102, 241, 0.2)',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '12px' }}>
          <span style={{ fontSize: '24px' }}>📰</span>
          <div>
            <h2 style={{ margin: 0, fontSize: '18px', fontWeight: '600', color: '#fff' }}>智能新闻阅读器</h2>
            <span style={{ fontSize: '12px', color: '#a0a0c8' }}>实时新闻资讯</span>
          </div>
        </div>
        
        <div style={{ display: 'flex', gap: '8px', overflowX: 'auto' }}>
          {categories.map(cat => (
            <button
              key={cat.id}
              onClick={() => {
                setSelectedCategory(cat.id)
                setLoading(true)
              }}
              style={{
                padding: '8px 16px',
                borderRadius: '20px',
                background: selectedCategory === cat.id
                  ? 'linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)'
                  : 'rgba(255, 255, 255, 0.05)',
                border: selectedCategory === cat.id ? 'none' : '1px solid rgba(255, 255, 255, 0.1)',
                color: '#fff',
                cursor: 'pointer',
                fontSize: '13px',
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                whiteSpace: 'nowrap',
                transition: 'all 0.2s'
              }}
            >
              {cat.icon} {cat.name}
            </button>
          ))}
        </div>
      </div>

      <div style={{
        padding: '12px 20px',
        background: 'rgba(0, 0, 0, 0.2)',
        borderBottom: '1px solid rgba(255, 255, 255, 0.05)'
      }}>
        <input
          type="text"
          placeholder="🔍 搜索新闻..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          style={{
            width: '100%',
            padding: '10px 14px',
            borderRadius: '10px',
            border: '1px solid rgba(255, 255, 255, 0.1)',
            background: 'rgba(255, 255, 255, 0.05)',
            color: '#fff',
            fontSize: '14px',
            outline: 'none',
            boxSizing: 'border-box'
          }}
        />
      </div>

      {errorMsg && (
        <div style={{
          padding: '12px 20px',
          background: 'rgba(239, 68, 68, 0.1)',
          color: '#ef4444',
          fontSize: '13px',
          textAlign: 'center'
        }}>
          ⚠️ {errorMsg}
        </div>
      )}

      <div style={{ flex: 1, display: 'flex', overflow: 'hidden' }}>
        <div style={{ flex: 1, overflowY: 'auto', padding: '16px', display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '16px' }}>
          {loading && (
            <div style={{ gridColumn: '1 / -1', display: 'flex', justifyContent: 'center', alignItems: 'center', padding: '40px', color: '#a0a0c8' }}>
              <div style={{ fontSize: '48px', marginRight: '12px' }}>📰</div>
              <div>加载新闻中...</div>
            </div>
          )}
          
          {!loading && filteredArticles.length === 0 && (
            <div style={{ gridColumn: '1 / -1', display: 'flex', justifyContent: 'center', alignItems: 'center', padding: '40px', color: '#a0a0c8' }}>
              <div style={{ fontSize: '48px', marginRight: '12px' }}>🔍</div>
              <div>未找到相关新闻</div>
            </div>
          )}

          {!loading && filteredArticles.map((article, index) => (
            <div
              key={index}
              onClick={() => setSelectedArticle(article)}
              style={{
                background: 'rgba(255, 255, 255, 0.03)',
                borderRadius: '16px',
                overflow: 'hidden',
                cursor: 'pointer',
                border: selectedArticle?.title === article.title
                  ? '1px solid rgba(99, 102, 241, 0.5)'
                  : '1px solid rgba(255, 255, 255, 0.05)',
                transition: 'all 0.2s',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = 'translateY(-4px)'
                e.currentTarget.style.boxShadow = '0 8px 32px rgba(0, 0, 0, 0.3)'
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = 'translateY(0)'
                e.currentTarget.style.boxShadow = 'none'
              }}
            >
              <div style={{ height: '150px', overflow: 'hidden' }}>
                <img
                  src={article.image}
                  alt={article.title}
                  style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                />
              </div>
              <div style={{ padding: '16px' }}>
                <div style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  marginBottom: '8px'
                }}>
                  <span style={{
                    fontSize: '11px',
                    padding: '2px 8px',
                    borderRadius: '10px',
                    background: 'rgba(99, 102, 241, 0.2)',
                    color: '#818cf8'
                  }}>
                    {categories.find(c => c.id === article.category)?.icon} {article.source}
                  </span>
                  <span style={{ fontSize: '11px', color: '#a0a0c8' }}>{article.date}</span>
                </div>
                <h3 style={{
                  margin: '0 0 8px 0',
                  fontSize: '15px',
                  fontWeight: '600',
                  color: '#fff',
                  lineHeight: 1.4,
                  display: '-webkit-box',
                  WebkitLineClamp: 2,
                  WebkitBoxOrient: 'vertical',
                  overflow: 'hidden'
                }}>
                  {article.title}
                </h3>
                <p style={{
                  margin: 0,
                  fontSize: '13px',
                  color: '#a0a0c8',
                  lineHeight: 1.5,
                  display: '-webkit-box',
                  WebkitLineClamp: 2,
                  WebkitBoxOrient: 'vertical',
                  overflow: 'hidden'
                }}>
                  {article.description}
                </p>
              </div>
            </div>
          ))}
        </div>

        {selectedArticle && (
          <div style={{
            width: '400px',
            borderLeft: '1px solid rgba(255, 255, 255, 0.1)',
            background: 'rgba(0, 0, 0, 0.2)',
            padding: '20px',
            overflowY: 'auto'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
              <h3 style={{ margin: 0, color: '#fff', fontSize: '16px', fontWeight: '600' }}>文章详情</h3>
              <button
                onClick={() => setSelectedArticle(null)}
                style={{
                  padding: '6px 12px',
                  borderRadius: '8px',
                  background: 'rgba(255, 255, 255, 0.05)',
                  border: 'none',
                  color: '#a0a0c8',
                  cursor: 'pointer',
                  fontSize: '12px'
                }}
              >
                关闭
              </button>
            </div>

            <div style={{ marginBottom: '16px' }}>
              <img
                src={selectedArticle.image}
                alt={selectedArticle.title}
                style={{ width: '100%', borderRadius: '12px' }}
              />
            </div>

            <h2 style={{ margin: '0 0 12px 0', color: '#fff', fontSize: '20px', lineHeight: 1.4 }}>
              {selectedArticle.title}
            </h2>

            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              marginBottom: '16px',
              color: '#a0a0c8',
              fontSize: '13px'
            }}>
              <span>{categories.find(c => c.id === selectedArticle.category)?.icon} {selectedArticle.source}</span>
              <span>{selectedArticle.date}</span>
            </div>

            <p style={{
              margin: 0,
              color: '#c0c0d8',
              fontSize: '14px',
              lineHeight: 1.7,
              whiteSpace: 'pre-wrap'
            }}>
              {selectedArticle.description}
            </p>

            <button
              onClick={() => window.open(selectedArticle.url, '_blank')}
              style={{
                marginTop: '20px',
                width: '100%',
                padding: '12px',
                borderRadius: '10px',
                background: 'linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)',
                border: 'none',
                color: '#fff',
                cursor: 'pointer',
                fontSize: '14px',
                fontWeight: '600'
              }}
            >
              🔗 查看原文
            </button>
          </div>
        )}
      </div>
    </div>
  )
})

export default SmartNewsReader