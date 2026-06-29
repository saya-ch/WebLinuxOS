import { useState, useCallback, memo, useEffect } from 'react'
import { Search, BookOpen, ExternalLink, Clock, TrendingUp, Loader2 } from 'lucide-react'

interface WikiPage {
  title: string
  extract: string
  pageid: number
  thumbnail?: { source: string; width: number; height: number }
  fullurl: string
}

interface SearchResult {
  title: string
  pageid: number
  snippet: string
}

const WikipediaExplorer = memo(function WikipediaExplorer() {
  const [query, setQuery] = useState('')
  const [searchResults, setSearchResults] = useState<SearchResult[]>([])
  const [selectedPage, setSelectedPage] = useState<WikiPage | null>(null)
  const [featuredArticle, setFeaturedArticle] = useState<WikiPage | null>(null)
  const [loading, setLoading] = useState(false)
  const [searchLoading, setSearchLoading] = useState(false)
  const [trending, setTrending] = useState<string[]>([])
  const [view, setView] = useState<'home' | 'search' | 'article'>('home')

  const searchWikipedia = useCallback(async (searchQuery: string) => {
    if (!searchQuery.trim()) return
    setSearchLoading(true)
    try {
      const response = await fetch(
        `https://zh.wikipedia.org/w/api.php?action=query&list=search&srsearch=${encodeURIComponent(searchQuery)}&format=json&origin=*&srlimit=10`
      )
      const data = await response.json()
      if (data.query?.search) {
        setSearchResults(data.query.search)
        setView('search')
      }
    } catch {
      setSearchResults([
        { title: '示例文章 1', pageid: 1, snippet: '这是一个示例搜索结果...' },
        { title: '示例文章 2', pageid: 2, snippet: '另一个示例结果...' }
      ])
      setView('search')
    }
    setSearchLoading(false)
  }, [])

  const fetchPage = useCallback(async (title: string) => {
    setLoading(true)
    try {
      const response = await fetch(
        `https://zh.wikipedia.org/w/api.php?action=query&prop=extracts|pageimages|info&exintro=true&explaintext=true&piprop=thumbnail&pithumbsize=400&inprop=url&titles=${encodeURIComponent(title)}&format=json&origin=*`
      )
      const data = await response.json()
      const pages = data.query?.pages
      if (pages) {
        const pageId = Object.keys(pages)[0]
        const page = pages[pageId]
        setSelectedPage(page)
        setView('article')
      }
    } catch {
      setSelectedPage({
        title: title,
        extract: '无法加载文章内容。请检查网络连接后重试。\n\n维基百科是一个内容开放、自由的网络百科全书项目，其目标及宗旨是为全人类提供自由的百科全书。',
        pageid: 0,
        fullurl: `https://zh.wikipedia.org/wiki/${encodeURIComponent(title)}`
      })
      setView('article')
    }
    setLoading(false)
  }, [])

  useEffect(() => {
    const loadFeatured = async () => {
      try {
        const response = await fetch(
          'https://zh.wikipedia.org/w/api.php?action=query&prop=extracts|pageimages&exintro=true&explaintext=true&piprop=thumbnail&pithumbsize=400&titles=人工智能&format=json&origin=*'
        )
        const data = await response.json()
        const pages = data.query?.pages
        if (pages) {
          const pageId = Object.keys(pages)[0]
          setFeaturedArticle(pages[pageId])
        }
      } catch {
        setFeaturedArticle({
          title: '人工智能',
          extract: '人工智能（Artificial Intelligence，AI）是指由人制造出来的机器所表现出来的智能。通常人工智能是指通过普通计算机程序的手段实现的类人智能技术。人工智能的研究包括机器人、语言识别、图像识别、自然语言处理和专家系统等。',
          pageid: 1,
          fullurl: 'https://zh.wikipedia.org/wiki/人工智能'
        })
      }
    }

    setTrending([
      '人工智能', '机器学习', '量子计算', '太空探索', 
      '生物科技', '新能源', '区块链', '元宇宙'
    ])
    loadFeatured()
  }, [])

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    searchWikipedia(query)
  }

  return (
    <div style={{
      height: '100%',
      display: 'flex',
      flexDirection: 'column',
      background: 'var(--window-bg, #fff)',
      color: 'var(--text-primary, #333)'
    }}>
      <div style={{
        padding: '16px 20px',
        borderBottom: '1px solid var(--window-border, #e5e5e5)',
        background: 'var(--window-header, #f8f9fa)'
      }}>
        <form onSubmit={handleSearch} style={{ display: 'flex', gap: '8px' }}>
          <div style={{
            flex: 1,
            position: 'relative',
            display: 'flex',
            alignItems: 'center'
          }}>
            <Search size={18} style={{ position: 'absolute', left: '12px', color: '#999' }} />
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="搜索维基百科..."
              style={{
                width: '100%',
                padding: '10px 12px 10px 40px',
                border: '1px solid var(--window-border, #ddd)',
                borderRadius: '8px',
                fontSize: '14px',
                background: 'var(--input-bg, #fff)',
                color: 'var(--text-primary, #333)',
                outline: 'none'
              }}
            />
          </div>
          <button
            type="submit"
            disabled={searchLoading}
            style={{
              padding: '10px 20px',
              background: '#8b7cf0',
              color: '#fff',
              border: 'none',
              borderRadius: '8px',
              cursor: 'pointer',
              fontSize: '14px',
              fontWeight: 500,
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              opacity: searchLoading ? 0.7 : 1
            }}
          >
            {searchLoading ? <Loader2 size={16} style={{ animation: 'spin 1s linear infinite' }} /> : '搜索'}
          </button>
        </form>
      </div>

      <div style={{ flex: 1, overflowY: 'auto', padding: '20px' }}>
        {view === 'home' && (
          <div>
            {featuredArticle && (
              <div style={{ marginBottom: '24px' }}>
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  marginBottom: '12px',
                  color: '#8b7cf0',
                  fontWeight: 600,
                  fontSize: '14px'
                }}>
                  <BookOpen size={18} />
                  精选文章
                </div>
                <div
                  onClick={() => fetchPage(featuredArticle.title)}
                  style={{
                    padding: '20px',
                    background: 'var(--card-bg, #f8f9fa)',
                    borderRadius: '12px',
                    cursor: 'pointer',
                    border: '1px solid var(--window-border, #e5e5e5)',
                    transition: 'all 0.2s ease'
                  }}
                >
                  <h2 style={{ margin: '0 0 12px 0', fontSize: '20px', color: 'var(--text-primary, #333)' }}>
                    {featuredArticle.title}
                  </h2>
                  <p style={{
                    margin: 0,
                    color: 'var(--text-secondary, #666)',
                    lineHeight: 1.6,
                    fontSize: '14px'
                  }}>
                    {featuredArticle.extract?.slice(0, 200)}...
                  </p>
                  <div style={{ marginTop: '12px', color: '#8b7cf0', fontSize: '13px' }}>
                    阅读更多 →
                  </div>
                </div>
              </div>
            )}

            <div style={{ marginBottom: '24px' }}>
              <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                marginBottom: '12px',
                color: '#f5a623',
                fontWeight: 600,
                fontSize: '14px'
              }}>
                <TrendingUp size={18} />
                热门话题
              </div>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                {trending.map((topic) => (
                  <button
                    key={topic}
                    onClick={() => fetchPage(topic)}
                    style={{
                      padding: '8px 14px',
                      background: 'var(--card-bg, #f0f0f5)',
                      border: '1px solid var(--window-border, #e0e0e0)',
                      borderRadius: '20px',
                      cursor: 'pointer',
                      fontSize: '13px',
                      color: 'var(--text-primary, #333)',
                      transition: 'all 0.2s ease'
                    }}
                  >
                    {topic}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                marginBottom: '12px',
                color: '#00d4aa',
                fontWeight: 600,
                fontSize: '14px'
              }}>
                <Clock size={18} />
                最近浏览
              </div>
              <div style={{ color: 'var(--text-secondary, #999)', fontSize: '13px' }}>
                暂无浏览历史
              </div>
            </div>
          </div>
        )}

        {view === 'search' && (
          <div>
            <div style={{ marginBottom: '16px', color: 'var(--text-secondary, #666)', fontSize: '14px' }}>
              找到 {searchResults.length} 个结果
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {searchResults.map((result) => (
                <div
                  key={result.pageid}
                  onClick={() => fetchPage(result.title)}
                  style={{
                    padding: '16px',
                    background: 'var(--card-bg, #f8f9fa)',
                    borderRadius: '8px',
                    cursor: 'pointer',
                    border: '1px solid var(--window-border, #e5e5e5)',
                    transition: 'all 0.2s ease'
                  }}
                >
                  <h3 style={{ margin: '0 0 8px 0', fontSize: '16px', color: '#8b7cf0' }}>
                    {result.title}
                  </h3>
                  <p style={{
                    margin: 0,
                    fontSize: '13px',
                    color: 'var(--text-secondary, #666)',
                    lineHeight: 1.5
                  }}>
                    {result.snippet.replace(/<[^>]*>/g, '')}...
                  </p>
                </div>
              ))}
            </div>
          </div>
        )}

        {view === 'article' && selectedPage && (
          <div>
            <button
              onClick={() => setView(searchResults.length > 0 ? 'search' : 'home')}
              style={{
                marginBottom: '16px',
                padding: '8px 16px',
                background: 'transparent',
                border: '1px solid var(--window-border, #ddd)',
                borderRadius: '6px',
                cursor: 'pointer',
                fontSize: '13px',
                color: 'var(--text-primary, #333)'
              }}
            >
              ← 返回
            </button>

            {loading ? (
              <div style={{ display: 'flex', justifyContent: 'center', padding: '40px' }}>
                <Loader2 size={32} style={{ color: '#8b7cf0', animation: 'spin 1s linear infinite' }} />
              </div>
            ) : (
              <article>
                <h1 style={{
                  fontSize: '28px',
                  marginBottom: '16px',
                  color: 'var(--text-primary, #333)'
                }}>
                  {selectedPage.title}
                </h1>

                {selectedPage.thumbnail && (
                  <img
                    src={selectedPage.thumbnail.source}
                    alt={selectedPage.title}
                    style={{
                      maxWidth: '100%',
                      borderRadius: '8px',
                      marginBottom: '20px'
                    }}
                  />
                )}

                <div style={{
                  lineHeight: 1.8,
                  fontSize: '15px',
                  color: 'var(--text-primary, #333)'
                }}>
                  {selectedPage.extract?.split('\n').map((paragraph, i) => (
                    <p key={i} style={{ marginBottom: '16px' }}>{paragraph}</p>
                  ))}
                </div>

                <div style={{
                  marginTop: '24px',
                  paddingTop: '16px',
                  borderTop: '1px solid var(--window-border, #e5e5e5)'
                }}>
                  <a
                    href={selectedPage.fullurl}
                    target="_blank"
                    rel="noopener noreferrer"
                    style={{
                      color: '#8b7cf0',
                      textDecoration: 'none',
                      fontSize: '14px',
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '4px'
                    }}
                  >
                    在维基百科上查看 <ExternalLink size={14} />
                  </a>
                </div>
              </article>
            )}
          </div>
        )}
      </div>
    </div>
  )
})

export default WikipediaExplorer
