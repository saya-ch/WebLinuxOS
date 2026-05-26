import { useState, useEffect, useCallback } from 'react'

interface NewsArticle {
  title: string
  description: string
  url: string
  urlToImage?: string
  source: { name: string }
  publishedAt: string
}

const CATEGORIES = [
  { id: 'general', name: '综合', icon: '📰' },
  { id: 'technology', name: '科技', icon: '💻' },
  { id: 'business', name: '商业', icon: '💰' },
  { id: 'science', name: '科学', icon: '🔬' },
  { id: 'health', name: '健康', icon: '🏥' },
  { id: 'entertainment', name: '娱乐', icon: '🎬' },
  { id: 'sports', name: '体育', icon: '⚽' },
]

// 使用免费的Spaceflight News API
const SPACEFLIGHT_NEWS_API = 'https://api.spaceflightnewsapi.net/v4'

const getCategoryName = (id: string) => CATEGORIES.find(c => c.id === id)?.name || '综合'

// 生成固定日期，避免在渲染期间调用 Date.now()
const getMockArticles = (category: string, now: number) => [
  {
    title: `${getCategoryName(category)}领域取得重大突破`,
    description: '近日，在全球专家的共同努力下，该领域取得了前所未有的进展。这项创新将深刻影响我们的日常生活。',
    url: 'https://github.com/saya-ch/WebLinuxOS',
    urlToImage: 'https://images.unsplash.com/photo-1495020689067-958852a7765e?w=800&auto=format&fit=crop',
    source: { name: '科技日报' },
    publishedAt: new Date(now - 3600000 * 2).toISOString(),
  },
  {
    title: 'Web Linux 操作系统发布新版本，性能大幅提升',
    description: 'Web Linux 3.1 版本正式发布，带来了全新的用户界面、更快的启动速度和更多实用应用程序。',
    url: 'https://github.com/saya-ch/WebLinuxOS',
    urlToImage: 'https://images.unsplash.com/photo-1460925895917-afdab827c52f?w=800&auto=format&fit=crop',
    source: { name: '开发周报' },
    publishedAt: new Date(now - 3600000 * 5).toISOString(),
  },
  {
    title: '人工智能助力医疗诊断，准确率提高30%',
    description: '医院开始部署 AI 辅助诊断系统，医生们表示该系统大大提高了诊断的准确性和效率。',
    url: 'https://github.com/saya-ch/WebLinuxOS',
    urlToImage: 'https://images.unsplash.com/photo-1559757121-5b744b2f75cf?w=800&auto=format&fit=crop',
    source: { name: '健康医疗' },
    publishedAt: new Date(now - 3600000 * 8).toISOString(),
  },
  {
    title: '全球环保峰会召开，各国签署减排协议',
    description: '在刚刚结束的全球环保峰会上，100多个国家签署了新的减排协议，承诺到2030年将碳排放减少50%。',
    url: 'https://github.com/saya-ch/WebLinuxOS',
    urlToImage: 'https://images.unsplash.com/photo-1444653614773-995cb1ef9efa?w=800&auto=format&fit=crop',
    source: { name: '国际新闻' },
    publishedAt: new Date(now - 3600000 * 12).toISOString(),
  },
  {
    title: '区块链技术应用于供应链管理',
    description: '多家跨国企业开始使用区块链技术来追踪商品的整个供应链过程，提高了透明度和效率。',
    url: 'https://github.com/saya-ch/WebLinuxOS',
    urlToImage: 'https://images.unsplash.com/photo-1518770660439-4636190af475?w=800&auto=format&fit=crop',
    source: { name: '商业周刊' },
    publishedAt: new Date(now - 3600000 * 24).toISOString(),
  },
  {
    title: '量子计算机取得里程碑式进展',
    description: '研究团队宣布他们在量子计算领域取得了重要突破，量子比特的稳定性提高了100倍。',
    url: 'https://github.com/saya-ch/WebLinuxOS',
    urlToImage: 'https://images.unsplash.com/photo-1550745165-9bc0b252726f?w=800&auto=format&fit=crop',
    source: { name: '科学探索' },
    publishedAt: new Date(now - 3600000 * 36).toISOString(),
  },
]

export default function NewsReader() {
  const [articles, setArticles] = useState<NewsArticle[]>([])
  const [selectedCategory, setSelectedCategory] = useState('general')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [selectedArticle, setSelectedArticle] = useState<NewsArticle | null>(null)
  const [searchQuery, setSearchQuery] = useState('')
  const [searchMode, setSearchMode] = useState(false)
  const [nowTimestamp] = useState(() => Date.now())

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    const now = new Date()
    const diffMs = now.getTime() - date.getTime()
    const diffHrs = Math.floor(diffMs / 3600000)
    const diffDays = Math.floor(diffMs / 86400000)
    
    if (diffHrs < 1) return '刚刚'
    if (diffHrs < 24) return `${diffHrs}小时前`
    if (diffDays < 7) return `${diffDays}天前`
    return date.toLocaleDateString('zh-CN')
  }

  // 获取真实新闻数据
  const fetchSpaceflightNews = async (category: string) => {
    try {
      const url = `${SPACEFLIGHT_NEWS_API}/articles?limit=12&ordering=-published_at`
      
      const response = await fetch(url)
      if (!response.ok) throw new Error('Failed to fetch news')
      
      const data = await response.json()
      
      const mappedArticles: NewsArticle[] = data.results.map((item: unknown) => {
        const typedItem = item as { title?: string; summary?: string; news_site?: string; url?: string; image_url?: string; published_at?: string }
        return {
          title: typedItem.title || '',
          description: typedItem.summary || typedItem.news_site || '',
          url: typedItem.url || '',
          urlToImage: typedItem.image_url,
          source: { name: typedItem.news_site || '' },
          publishedAt: typedItem.published_at || new Date().toISOString(),
        }
      })
      
      return { articles: mappedArticles }
    } catch {
      // 如果失败，使用模拟数据作为备用
      return fetchMockNews(category)
    }
  }

  // 模拟新闻数据作为备用
  const fetchMockNews = async (category: string) => {
    await new Promise(resolve => setTimeout(resolve, 500))
    return { articles: getMockArticles(category, nowTimestamp) }
  }

  const loadNews = useCallback(async (category: string) => {
    setLoading(true)
    setError(null)
    try {
      let response
      if (category === 'technology' || category === 'science') {
        response = await fetchSpaceflightNews(category)
      } else {
        response = await fetchMockNews(category)
      }
      setArticles(response.articles)
    } catch {
      setError('加载新闻失败，请稍后重试')
    } finally {
      setLoading(false)
    }
  }, [nowTimestamp])

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    if (searchQuery.trim()) {
      loadNews(selectedCategory)
      setSearchMode(true)
    }
  }

  const clearSearch = () => {
    setSearchQuery('')
    setSearchMode(false)
    loadNews(selectedCategory)
  }

  useEffect(() => {
    loadNews(selectedCategory)
  }, [selectedCategory, loadNews])

  return (
    <div className="app-container" style={{ display: 'flex', flexDirection: 'column', height: '100%', overflow: 'hidden' }}>
      {/* 搜索栏 */}
      <div style={{ 
        padding: '12px', 
        borderBottom: '1px solid rgba(255,255,255,0.1)',
        background: 'rgba(0,0,0,0.2)',
      }}>
        <form onSubmit={handleSearch} style={{ display: 'flex', gap: '8px' }}>
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="搜索新闻..."
            style={{
              flex: 1,
              padding: '12px 16px',
              borderRadius: '12px',
              border: '1px solid rgba(255,255,255,0.1)',
              background: 'rgba(255,255,255,0.05)',
              color: '#fff',
              fontSize: '14px',
              outline: 'none',
            }}
          />
          {searchMode && (
            <button
              type="button"
              onClick={clearSearch}
              style={{
                padding: '12px 16px',
                borderRadius: '12px',
                border: '1px solid rgba(255,255,255,0.1)',
                background: 'rgba(255,255,255,0.05)',
                color: '#fff',
                cursor: 'pointer',
              }}
            >
              清除
            </button>
          )}
          <button
            type="submit"
            style={{
              padding: '12px 24px',
              borderRadius: '12px',
              border: 'none',
              background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
              color: '#fff',
              cursor: 'pointer',
              fontWeight: '500',
            }}
          >
            搜索
          </button>
        </form>
      </div>

      {/* 分类导航 */}
      <div style={{ 
        display: 'flex', 
        gap: '8px', 
        padding: '12px', 
        borderBottom: '1px solid rgba(255,255,255,0.1)',
        overflowX: 'auto',
        flexShrink: 0,
      }}>
        {CATEGORIES.map(category => (
          <button
            key={category.id}
            onClick={() => {
              setSelectedCategory(category.id)
              if (searchMode) clearSearch()
            }}
            style={{
              padding: '8px 16px',
              border: 'none',
              borderRadius: '20px',
              background: selectedCategory === category.id 
                ? 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)' 
                : 'rgba(255,255,255,0.05)',
              color: '#fff',
              cursor: 'pointer',
              fontSize: '14px',
              whiteSpace: 'nowrap',
              transition: 'all 0.2s ease',
            }}
          >
            {category.icon} {category.name}
          </button>
        ))}
      </div>

      {/* 内容区域 */}
      <div style={{ flex: 1, overflow: 'auto', padding: '12px' }}>
        {loading ? (
          <div style={{ 
            display: 'flex', 
            flexDirection: 'column', 
            alignItems: 'center', 
            justifyContent: 'center',
            height: '200px',
            color: '#888'
          }}>
            <div style={{ fontSize: '32px', marginBottom: '8px', animation: 'spin 1s linear infinite' }}>📰</div>
            <div>加载中...</div>
          </div>
        ) : error ? (
          <div style={{ 
            display: 'flex', 
            flexDirection: 'column', 
            alignItems: 'center', 
            justifyContent: 'center',
            height: '200px',
            color: '#f66'
          }}>
            <div style={{ fontSize: '32px', marginBottom: '8px' }}>⚠️</div>
            <div>{error}</div>
            <button
              onClick={() => loadNews(selectedCategory)}
              style={{
                marginTop: '16px',
                padding: '8px 24px',
                border: 'none',
                borderRadius: '6px',
                background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                color: '#fff',
                cursor: 'pointer',
              }}
            >
              重试
            </button>
          </div>
        ) : articles.length === 0 ? (
          <div style={{ 
            display: 'flex', 
            flexDirection: 'column', 
            alignItems: 'center', 
            justifyContent: 'center',
            height: '200px',
            color: '#888'
          }}>
            <div style={{ fontSize: '32px', marginBottom: '8px' }}>📭</div>
            <div>没有找到相关新闻</div>
          </div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '16px' }}>
            {articles.map((article, index) => (
              <div
                key={index}
                onClick={() => setSelectedArticle(article)}
                style={{
                  background: 'rgba(255,255,255,0.03)',
                  borderRadius: '12px',
                  overflow: 'hidden',
                  cursor: 'pointer',
                  transition: 'transform 0.2s ease, box-shadow 0.2s ease',
                  border: '1px solid rgba(255,255,255,0.1)',
                }}
                onMouseOver={(e) => {
                  e.currentTarget.style.transform = 'translateY(-2px)'
                  e.currentTarget.style.boxShadow = '0 10px 30px rgba(0,0,0,0.2)'
                }}
                onMouseOut={(e) => {
                  e.currentTarget.style.transform = ''
                  e.currentTarget.style.boxShadow = ''
                }}
              >
                {article.urlToImage && (
                  <div style={{ 
                    height: '160px', 
                    background: `url(${article.urlToImage}) center/cover`,
                    backgroundSize: 'cover',
                    backgroundPosition: 'center',
                  }} />
                )}
                <div style={{ padding: '16px' }}>
                  <div style={{ 
                    display: 'flex', 
                    justifyContent: 'space-between', 
                    alignItems: 'center', 
                    marginBottom: '8px',
                    fontSize: '12px',
                    color: '#888'
                  }}>
                    <span style={{ 
                      background: 'rgba(102, 126, 234, 0.2)', 
                      padding: '2px 8px', 
                      borderRadius: '4px',
                      color: '#a5b4fc'
                    }}>
                      {article.source.name}
                    </span>
                    <span>{formatDate(article.publishedAt)}</span>
                  </div>
                  <h3 style={{ 
                    margin: '0 0 8px 0', 
                    fontSize: '16px', 
                    lineHeight: '1.4',
                    color: '#fff'
                  }}>
                    {article.title}
                  </h3>
                  <p style={{ 
                    margin: 0, 
                    fontSize: '14px', 
                    color: '#aaa', 
                    lineHeight: '1.6',
                    display: '-webkit-box',
                    WebkitLineClamp: 3,
                    WebkitBoxOrient: 'vertical',
                    overflow: 'hidden'
                  }}>
                    {article.description}
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* 文章详情模态框 */}
      {selectedArticle && (
        <div style={{
          position: 'fixed',
          inset: 0,
          background: 'rgba(0,0,0,0.8)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000,
          padding: '20px',
        }} onClick={() => setSelectedArticle(null)}>
          <div style={{
            background: '#1a1a2e',
            borderRadius: '16px',
            maxWidth: '800px',
            maxHeight: '90vh',
            overflow: 'auto',
            width: '100%',
          }} onClick={(e) => e.stopPropagation()}>
            {selectedArticle.urlToImage && (
              <div style={{ 
                height: '300px', 
                background: `url(${selectedArticle.urlToImage}) center/cover`,
              }} />
            )}
            <div style={{ padding: '24px' }}>
              <div style={{ 
                display: 'flex', 
                justifyContent: 'space-between', 
                alignItems: 'center', 
                marginBottom: '16px'
              }}>
                <span style={{ 
                  background: 'rgba(102, 126, 234, 0.2)', 
                  padding: '4px 12px', 
                  borderRadius: '6px',
                  color: '#a5b4fc',
                  fontSize: '14px'
                }}>
                  {selectedArticle.source.name}
                </span>
                <span style={{ color: '#888', fontSize: '14px' }}>
                  {formatDate(selectedArticle.publishedAt)}
                </span>
              </div>
              <h2 style={{ margin: '0 0 16px 0', color: '#fff', fontSize: '24px', lineHeight: '1.4' }}>
                {selectedArticle.title}
              </h2>
              <p style={{ color: '#ccc', fontSize: '16px', lineHeight: '1.8', margin: 0 }}>
                {selectedArticle.description}
              </p>
              <div style={{ marginTop: '24px', display: 'flex', gap: '12px' }}>
                <button
                  onClick={() => setSelectedArticle(null)}
                  style={{
                    padding: '10px 24px',
                    border: '1px solid rgba(255,255,255,0.2)',
                    borderRadius: '8px',
                    background: 'transparent',
                    color: '#fff',
                    cursor: 'pointer',
                    fontSize: '14px',
                  }}
                >
                  关闭
                </button>
                <button
                  onClick={() => {
                    window.open(selectedArticle.url, '_blank')
                  }}
                  style={{
                    padding: '10px 24px',
                    border: 'none',
                    borderRadius: '8px',
                    background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                    color: '#fff',
                    cursor: 'pointer',
                    fontSize: '14px',
                  }}
                >
                  阅读全文
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
      <style>{`
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  )
}
