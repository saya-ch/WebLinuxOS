import { useState, useCallback, useRef } from 'react'

interface ExtractedContent {
  url: string
  title: string
  description: string
  text: string
  images: { src: string; alt: string }[]
  links: { href: string; text: string }[]
  headings: { level: number; text: string }[]
  metadata: Record<string, string>
  fetchedAt: number
}

interface HistoryItem {
  id: string
  url: string
  title: string
  timestamp: number
  content: ExtractedContent
}

const EXTRACT_APIS = {
  allorigins: 'https://api.allorigins.win/get?url=',
  corsproxy: 'https://corsproxy.io/?',
}

function extractContentFromHtml(html: string, baseUrl: string): ExtractedContent {
  const parser = new DOMParser()
  const doc = parser.parseFromString(html, 'text/html')

  const title = doc.querySelector('title')?.textContent?.trim() || ''
  const description = doc.querySelector('meta[name="description"]')?.getAttribute('content') ||
    doc.querySelector('meta[property="og:description"]')?.getAttribute('content') || ''

  const images: { src: string; alt: string }[] = []
  doc.querySelectorAll('img').forEach(img => {
    const src = img.getAttribute('src') || img.getAttribute('data-src') || ''
    if (src && !src.startsWith('data:') && !src.startsWith('blob:')) {
      images.push({
        src: resolveUrl(src, baseUrl),
        alt: img.getAttribute('alt') || '',
      })
    }
  })

  const links: { href: string; text: string }[] = []
  doc.querySelectorAll('a').forEach(a => {
    const href = a.getAttribute('href') || ''
    const text = a.textContent?.trim() || ''
    if (href && text && !href.startsWith('#') && !href.startsWith('javascript:')) {
      links.push({
        href: resolveUrl(href, baseUrl),
        text,
      })
    }
  })

  const headings: { level: number; text: string }[] = []
  for (let i = 1; i <= 6; i++) {
    doc.querySelectorAll(`h${i}`).forEach(h => {
      const text = h.textContent?.trim() || ''
      if (text) headings.push({ level: i, text })
    })
  }

  const metadata: Record<string, string> = {}
  doc.querySelectorAll('meta').forEach(meta => {
    const name = meta.getAttribute('name') || meta.getAttribute('property') || ''
    const content = meta.getAttribute('content') || ''
    if (name && content) {
      metadata[name] = content
    }
  })

  const article = doc.querySelector('article') ||
    doc.querySelector('[class*="content"]') ||
    doc.querySelector('[class*="article"]') ||
    doc.body

  const text = article?.textContent?.replace(/\s+/g, ' ').trim() || ''

  return {
    url: baseUrl,
    title,
    description,
    text,
    images: images.slice(0, 50),
    links: links.slice(0, 100),
    headings,
    metadata,
    fetchedAt: Date.now(),
  }
}

function resolveUrl(url: string, base: string): string {
  try {
    return new URL(url, base).href
  } catch {
    return url
  }
}

export default function SmartWebClipper() {
  const [url, setUrl] = useState('')
  const [content, setContent] = useState<ExtractedContent | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [activeTab, setActiveTab] = useState<'overview' | 'text' | 'images' | 'links' | 'structure'>('overview')
  const [viewMode, setViewMode] = useState<'preview' | 'source'>('preview')
  void viewMode; void setViewMode
  const [searchQuery, setSearchQuery] = useState('')
  const [imageFilter, setImageFilter] = useState<'all' | 'withAlt' | 'large'>('all')
  const [history, setHistory] = useState<HistoryItem[]>(() => {
    try {
      const saved = localStorage.getItem('webclipper_history')
      return saved ? JSON.parse(saved) : []
    } catch { return [] }
  })
  const [favorites, setFavorites] = useState<string[]>(() => {
    try {
      const saved = localStorage.getItem('webclipper_favorites')
      return saved ? JSON.parse(saved) : []
    } catch { return [] }
  })
  const sourceRef = useRef<HTMLTextAreaElement>(null)
  void sourceRef

  const saveToHistory = useCallback((item: HistoryItem) => {
    const newHistory = [item, ...history.filter(h => h.id !== item.id)].slice(0, 30)
    setHistory(newHistory)
    try { localStorage.setItem('webclipper_history', JSON.stringify(newHistory)) } catch {}
  }, [history])

  const toggleFavorite = () => {
    if (!content) return
    const isFav = favorites.includes(content.url)
    const newFavorites = isFav
      ? favorites.filter(f => f !== content.url)
      : [...favorites, content.url]
    setFavorites(newFavorites)
    try { localStorage.setItem('webclipper_favorites', JSON.stringify(newFavorites)) } catch {}
  }

  const clearHistory = () => {
    setHistory([])
    try { localStorage.removeItem('webclipper_history') } catch {}
  }

  const fetchContent = useCallback(async (targetUrl: string) => {
    setLoading(true)
    setError('')
    setContent(null)

    try {
      const encodedUrl = encodeURIComponent(targetUrl)
      const proxyUrl = `${EXTRACT_APIS.allorigins}${encodedUrl}`

      const response = await fetch(proxyUrl)
      if (!response.ok) {
        throw new Error(`请求失败：${response.status}`)
      }

      const data = await response.json()
      const html = data.contents

      if (!html) {
        throw new Error('无法获取页面内容')
      }

      const extracted = extractContentFromHtml(html, targetUrl)

      setContent(extracted)

      const item: HistoryItem = {
        id: Date.now().toString(),
        url: targetUrl,
        title: extracted.title || targetUrl,
        timestamp: Date.now(),
        content: extracted,
      }
      saveToHistory(item)

    } catch (e) {
      setError(e instanceof Error ? e.message : '获取页面失败。请检查URL或网络连接')
    } finally {
      setLoading(false)
    }
  }, [saveToHistory])

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (url.trim()) {
      fetchContent(url.trim())
    }
  }

  const loadFromHistory = (item: HistoryItem) => {
    setContent(item.content)
    setUrl(item.url)
    setError('')
  }

  const exportAsMarkdown = () => {
    if (!content) return
    let md = `# ${content.title}\n\n`
    md += `> 来源：${content.url}\n\n`
    if (content.description) md += `## 摘要\n\n${content.description}\n\n`
    md += `## 内容\n\n${content.text.slice(0, 5000)}\n\n`
    if (content.headings.length > 0) {
      md += `## 章节结构\n\n`
      content.headings.forEach(h => {
        md += `${'#'.repeat(h.level)} ${h.text}\n\n`
      })
    }
    const blob = new Blob([md], { type: 'text/markdown' })
    const a = document.createElement('a')
    a.href = URL.createObjectURL(blob)
    a.download = `${content.title || 'export'}.md`
    a.click()
  }

  const filteredText = content?.text
    ? (() => {
        const text = content.text
        if (!searchQuery.trim()) return text
        const regex = new RegExp(searchQuery, 'gi')
        return text.replace(regex, match => `**${match}**`)
      })()
    : ''

  const filteredImages = content?.images.filter(img => {
    if (imageFilter === 'withAlt') return img.alt.length > 0
    if (imageFilter === 'large') return true
    return true
  }) || []

  return (
    <div style={{
      width: '100%', height: '100%',
      background: 'linear-gradient(135deg, #1e1e2e 0%, #2d2d44 50%, #1a1a2e 100%)',
      color: 'white', fontFamily: "'Noto Sans SC', system-ui, sans-serif",
      display: 'flex', flexDirection: 'column', overflow: 'auto',
    }}>
      <style>{`
        @keyframes fadeSlide {
          from { opacity: 0; transform: translateY(8px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .fade-slide { animation: fadeSlide 0.3s ease; }
        ::-webkit-scrollbar { width: 6px; height: 6px; }
        ::-webkit-scrollbar-track { background: rgba(255,255,255,0.05); }
        ::-webkit-scrollbar-thumb { background: rgba(255,255,255,0.2); border-radius: 3px; }
      `}</style>

      <div style={{ padding: 16, borderBottom: '1px solid rgba(255,255,255,0.08)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 12 }}>
          <div style={{
            width: 36, height: 36, borderRadius: 10,
            background: 'linear-gradient(135deg, #f59e0b, #ef4444)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>✂️</div>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 16, fontWeight: 600 }}>网页内容提取器</div>
            <div style={{ fontSize: 12, opacity: 0.5 }}>智能提取网页正文、图片、链接、元数据</div>
          </div>
          {content && (
            <button onClick={toggleFavorite} style={{
              padding: '6px 12px',
              background: favorites.includes(content.url) ? '#ef4444' : 'rgba(255,255,255,0.08)',
              color: 'white', border: 'none', borderRadius: 15,
              cursor: 'pointer', fontSize: 13,
            }}>
              {favorites.includes(content.url) ? '❤️ 已收藏' : '🤍 收藏'}
            </button>
          )}
        </div>

        <form onSubmit={handleSubmit} style={{ display: 'flex', gap: 8 }}>
          <input
            value={url}
            onChange={e => setUrl(e.target.value)}
            placeholder="输入网页URL，如 https://example.com"
            style={{
              flex: 1, padding: '10px 16px',
              background: 'rgba(255,255,255,0.08)',
              border: '1px solid rgba(255,255,255,0.1)',
              borderRadius: 10, color: 'white',
              outline: 'none', fontSize: 14,
            }}
          />
          <button type="submit" disabled={loading} style={{
            padding: '10px 24px',
            background: 'linear-gradient(135deg, #f59e0b, #ef4444)',
            color: 'white', border: 'none', borderRadius: 10,
            cursor: loading ? 'not-allowed' : 'pointer',
            fontSize: 14, fontWeight: 600,
            opacity: loading ? 0.6 : 1,
          }}>
            {loading ? '抓取中...' : '🔍 提取'}
          </button>
        </form>
      </div>

      {error && (
        <div style={{
          margin: '16px', padding: '12px 16px',
          background: 'rgba(239,68,68,0.15)',
          border: '1px solid rgba(239,68,68,0.3)',
          borderRadius: 10, color: '#fca5a5',
          fontSize: 13,
        }}>
          ⚠ {error}
        </div>
      )}

      {loading && (
        <div style={{
          flex: 1, display: 'flex',
          alignItems: 'center', justifyContent: 'center',
          minHeight: 200,
        }}>
          <div style={{ textAlign: 'center' }}>
            <div style={{
              width: 40, height: 40,
              border: '3px solid rgba(255,255,255,0.1)',
              borderTopColor: '#f59e0b',
              borderRadius: '50%',
              animation: 'spin 1s linear infinite',
              margin: '0 auto 12px',
            }} />
            <div style={{ fontSize: 14, opacity: 0.7 }}>正在抓取页面内容...</div>
          </div>
        </div>
      )}

      {!loading && content && (
        <div className="fade-slide" style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
          <div style={{
            padding: '12px 16px',
            background: 'rgba(255,255,255,0.03)',
            borderBottom: '1px solid rgba(255,255,255,0.08)',
          }}>
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
              {(['overview', 'text', 'images', 'links', 'structure'] as const).map(tab => (
                <button key={tab} onClick={() => setActiveTab(tab)} style={{
                  padding: '6px 14px', fontSize: 13,
                  background: activeTab === tab ? '#f59e0b' : 'transparent',
                  color: 'white', border: 'none',
                  borderRadius: 15, cursor: 'pointer',
                }}>
                  {tab === 'overview' ? '📋 概览' :
                    tab === 'text' ? '📝 正文' :
                    tab === 'images' ? `🖼️ 图片 (${content.images.length})` :
                    tab === 'links' ? `🔗 链接 (${content.links.length})` :
                    `📑 结构 (${content.headings.length})`}
                </button>
              ))}
            </div>
          </div>

          <div style={{ flex: 1, padding: 16, overflow: 'auto' }}>
            {activeTab === 'overview' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                <div style={{
                  padding: 20,
                  background: 'rgba(255,255,255,0.04)',
                  borderRadius: 12,
                }}>
                  <div style={{ fontSize: 18, fontWeight: 600, marginBottom: 8 }}>
                    {content.title}
                  </div>
                  <a href={content.url} target="_blank" rel="noopener noreferrer" style={{
                    color: '#f59e0b', fontSize: 13, wordBreak: 'break-all',
                  }}>
                    {content.url}
                  </a>
                  {content.description && (
                    <p style={{ fontSize: 14, opacity: 0.7, marginTop: 12, lineHeight: 1.6 }}>
                      {content.description}
                    </p>
                  )}
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(120px, 1fr))', gap: 12 }}>
                  {[
                    { label: '正文长度', value: `${content.text.length} 字` },
                    { label: '图片数量', value: content.images.length },
                    { label: '链接数量', value: content.links.length },
                    { label: '标题层级', value: content.headings.length },
                    { label: '元数据', value: Object.keys(content.metadata).length },
                  ].map(stat => (
                    <div key={stat.label} style={{
                      padding: '12px',
                      background: 'rgba(255,255,255,0.04)',
                      borderRadius: 10,
                      textAlign: 'center',
                    }}>
                      <div style={{ fontSize: 11, opacity: 0.5 }}>{stat.label}</div>
                      <div style={{ fontSize: 18, fontWeight: 600, marginTop: 4 }}>{stat.value}</div>
                    </div>
                  ))}
                </div>

                {Object.keys(content.metadata).length > 0 && (
                  <div>
                    <h3 style={{ fontSize: 14, marginBottom: 12, opacity: 0.7 }}>元数据</h3>
                    <div style={{
                      maxHeight: 200, overflow: 'auto',
                      background: 'rgba(0,0,0,0.2)',
                      borderRadius: 10, padding: 12,
                    }}>
                      {Object.entries(content.metadata).map(([key, value]) => (
                        <div key={key} style={{
                          display: 'flex', gap: 8,
                          padding: '4px 0',
                          borderBottom: '1px solid rgba(255,255,255,0.05)',
                          fontSize: 12,
                        }}>
                          <code style={{ color: '#a5b4fc', minWidth: 120 }}>{key}</code>
                          <code style={{ color: 'rgba(255,255,255,0.7)', wordBreak: 'break-all' }}>{value}</code>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}

            {activeTab === 'text' && (
              <div>
                <div style={{ display: 'flex', gap: 8, marginBottom: 12 }}>
                  <input
                    value={searchQuery}
                    onChange={e => setSearchQuery(e.target.value)}
                    placeholder="搜索正文..."
                    style={{
                      flex: 1, padding: '8px 12px',
                      background: 'rgba(255,255,255,0.08)',
                      border: '1px solid rgba(255,255,255,0.1)',
                      borderRadius: 8, color: 'white',
                      outline: 'none', fontSize: 13,
                    }}
                  />
                  <button onClick={exportAsMarkdown} style={{
                    padding: '8px 16px',
                    background: 'rgba(255,255,255,0.08)',
                    color: 'white', border: '1px solid rgba(255,255,255,0.2)',
                    borderRadius: 8, cursor: 'pointer', fontSize: 13,
                  }}>
                    📥 导出 MD
                  </button>
                </div>
                <div style={{
                  padding: 20,
                  background: 'rgba(255,255,255,0.04)',
                  borderRadius: 12,
                  lineHeight: 1.8,
                  fontSize: 14,
                  whiteSpace: 'pre-wrap',
                  maxHeight: 500,
                  overflow: 'auto',
                }}>
                  {filteredText}
                </div>
              </div>
            )}

            {activeTab === 'images' && (
              <div>
                <div style={{ display: 'flex', gap: 8, marginBottom: 12 }}>
                  {(['all', 'withAlt'] as const).map(f => (
                    <button key={f} onClick={() => setImageFilter(f)} style={{
                      padding: '6px 12px', fontSize: 12,
                      background: imageFilter === f ? '#f59e0b' : 'rgba(255,255,255,0.08)',
                      color: 'white', border: 'none',
                      borderRadius: 12, cursor: 'pointer',
                    }}>
                      {f === 'all' ? '全部' : '有Alt'}
                    </button>
                  ))}
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(150px, 1fr))', gap: 12 }}>
                  {filteredImages.slice(0, 30).map((img, idx) => (
                    <div key={idx} style={{
                      aspectRatio: '1',
                      background: 'rgba(255,255,255,0.05)',
                      borderRadius: 8,
                      overflow: 'hidden',
                    }}>
                      <img src={img.src} alt={img.alt} loading="lazy" style={{
                        width: '100%', height: '100%',
                        objectFit: 'cover',
                      }} />
                    </div>
                  ))}
                </div>
                {content.images.length > 30 && (
                  <div style={{ textAlign: 'center', marginTop: 16, fontSize: 12, opacity: 0.5 }}>
                    仅显示前 30 张图片
                  </div>
                )}
              </div>
            )}

            {activeTab === 'links' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {content.links.slice(0, 50).map((link, idx) => (
                  <a key={idx} href={link.href} target="_blank" rel="noopener noreferrer" style={{
                    display: 'block',
                    padding: '10px 14px',
                    background: 'rgba(255,255,255,0.04)',
                    borderRadius: 8,
                    color: 'white',
                    textDecoration: 'none',
                    fontSize: 13,
                    transition: 'background 0.2s',
                  }}
                  onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,0.08)'}
                  onMouseLeave={e => e.currentTarget.style.background = 'rgba(255,255,255,0.04)'}
                  >
                    <div style={{ fontWeight: 500 }}>{link.text || '(无文本)'}</div>
                    <div style={{ fontSize: 11, opacity: 0.5, marginTop: 2, wordBreak: 'break-all' }}>{link.href}</div>
                  </a>
                ))}
              </div>
            )}

            {activeTab === 'structure' && (
              <div>
                <div style={{ fontSize: 14, fontWeight: 600, marginBottom: 16 }}>
                  📑 页面结构 ({content.headings.length} 个标题)
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                  {content.headings.map((h, idx) => (
                    <div key={idx} style={{
                      padding: '8px 12px',
                      background: 'rgba(255,255,255,0.04)',
                      borderRadius: 6,
                      borderLeft: `${h.level * 3}px solid #f59e0b`,
                      fontSize: 13,
                      paddingLeft: 12 + h.level * 12,
                    }}>
                      <span style={{ opacity: 0.3, marginRight: 8 }}>H{h.level}</span>
                      {h.text}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {!loading && !content && (
        <div style={{
          flex: 1, display: 'flex',
          alignItems: 'center', justifyContent: 'center',
          minHeight: 300,
        }}>
          <div style={{ textAlign: 'center', opacity: 0.5 }}>
            <div style={{ fontSize: 48, marginBottom: 12 }}>🌐</div>
            <div style={{ fontSize: 15 }}>输入URL开始提取网页内容</div>
          </div>
        </div>
      )}

      {history.length > 0 && (
        <div style={{
          padding: 16, borderTop: '1px solid rgba(255,255,255,0.08)',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
            <div style={{ fontSize: 13, opacity: 0.7 }}>📚 历史记录</div>
            <button onClick={clearHistory} style={{
              background: 'transparent', border: 'none',
              color: 'rgba(255,255,255,0.4)', cursor: 'pointer',
              fontSize: 12,
            }}>清空历史</button>
          </div>
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            {history.slice(0, 10).map(item => (
              <button key={item.id} onClick={() => loadFromHistory(item)} style={{
                padding: '6px 12px',
                background: 'rgba(255,255,255,0.06)',
                color: 'white', border: 'none',
                borderRadius: 12, cursor: 'pointer',
                fontSize: 12,
                maxWidth: 200,
                whiteSpace: 'nowrap', textOverflow: 'ellipsis',
              }}>
                {item.title.slice(0, 20)}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
