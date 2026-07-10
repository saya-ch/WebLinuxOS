import { useState, useEffect, useCallback, useMemo } from 'react'

interface HnItem {
  objectID: string
  title?: string
  url?: string
  author?: string
  points?: number
  num_comments?: number
  created_at_i?: number
  story_text?: string
  text?: string
  parent_id?: number
  story_title?: string
  story_url?: string
}

interface HnSearchResult {
  hits: HnItem[]
  nbHits: number
  page: number
  nbPages: number
}

type TabKind = 'top' | 'newest' | 'ask' | 'show' | 'comments' | 'search'

function formatTime(ts?: number): string {
  if (!ts) return ''
  const diff = Math.floor(Date.now() / 1000 - ts)
  if (diff < 60) return `${diff}s ago`
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`
  if (diff < 86400 * 30) return `${Math.floor(diff / 86400)}d ago`
  return new Date(ts * 1000).toLocaleDateString()
}

function stripHtml(html: string): string {
   
  if (typeof html !== 'string') return ''
  return html
    .replace(/<p>/gi, '\n\n')
    .replace(/<i>/gi, '')
    .replace(/<\/i>/gi, '')
    .replace(/<a[^>]*>([^<]*)<\/a>/gi, '$1')
    .replace(/<[^>]*>/g, '')
    .replace(/&quot;/g, '"')
    .replace(/&#x27;/gi, "'")
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&nbsp;/g, ' ')
    .replace(/\s+\n/g, '\n')
    .trim()
}

function extractDomain(url?: string): string {
  if (!url) return ''
  try {
    return new URL(url).hostname.replace(/^www\./, '')
  } catch {
    return ''
  }
}

const HackerNewsReader = () => {
  const [tab, setTab] = useState<TabKind>('top')
  const [query, setQuery] = useState('')
  const [appliedQuery, setAppliedQuery] = useState('')
  const [items, setItems] = useState<HnItem[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [selected, setSelected] = useState<HnItem | null>(null)
  const [comments, setComments] = useState<HnItem[]>([])
  const [commentsLoading, setCommentsLoading] = useState(false)
  const [page, setPage] = useState(0)
  const [totalPages, setTotalPages] = useState(1)

  const fetchStories = useCallback(async (kind: TabKind, q: string, p: number) => {
    setLoading(true)
    setError(null)
    try {
      let url = ''
      const pageQ = `&page=${p}`
      switch (kind) {
        case 'top':
          url = `https://hn.algolia.com/api/v1/search?tags=front_page${pageQ}&hitsPerPage=30`
          break
        case 'newest':
          url = `https://hn.algolia.com/api/v1/search_by_date?tags=story${pageQ}&hitsPerPage=30`
          break
        case 'ask':
          url = `https://hn.algolia.com/api/v1/search?tags=ask_hn${pageQ}&hitsPerPage=30`
          break
        case 'show':
          url = `https://hn.algolia.com/api/v1/search?tags=show_hn${pageQ}&hitsPerPage=30`
          break
        case 'comments':
          url = `https://hn.algolia.com/api/v1/search_by_date?tags=comment${pageQ}&hitsPerPage=30`
          break
        case 'search':
          url = `https://hn.algolia.com/api/v1/search?query=${encodeURIComponent(q || '')}&${pageQ.replace('&', '')}&hitsPerPage=30`
          break
      }
      const res = await fetch(url)
      if (!res.ok) throw new Error(`HTTP ${res.status}`)
      const data: HnSearchResult = await res.json()
      setItems(data.hits)
      setTotalPages(Math.max(1, data.nbPages))
    } catch (e) {
      console.error('HN fetch error:', e)
      setError('加载失败，请稍后重试')
      setItems([])
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    if (tab === 'search' && appliedQuery.trim() === '' && items.length === 0) {
      // 搜索标签页不自动加载，等待用户输入查询
      return
    }
    fetchStories(tab, appliedQuery, page)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tab, page])

  const loadComments = useCallback(async (item: HnItem) => {
    setSelected(item)
    setComments([])
    setCommentsLoading(true)
    try {
      // 该 API 返回故事及其嵌套评论
      const storyUrl = `https://hn.algolia.com/api/v1/items/${item.objectID}`
      const res = await fetch(storyUrl)
      if (res.ok) {
        const data = await res.json()
        const list: HnItem[] = []
        const flatten = (c: any, depth: number) => {
          if (!c) return
          if (depth > 8) return
          if (c.text) {
            list.push({
              objectID: c.id,
              text: c.text,
              author: c.author,
              created_at_i: c.created_at_i,
              num_comments: c.children?.length || 0,
            } as any)
          }
          if (Array.isArray(c.children)) {
            c.children.forEach((child: any) => flatten(child, depth + 1))
          }
        }
        if (Array.isArray(data.children)) {
          data.children.forEach((c: any) => flatten(c, 0))
        }
        setComments(list)
      }
    } catch (e) {
      console.error('HN comments error:', e)
    } finally {
      setCommentsLoading(false)
    }
  }, [])

  const title = useMemo(() => {
    switch (tab) {
      case 'top': return '🔥 首页热门'
      case 'newest': return '🆕 最新'
      case 'ask': return '❓ Ask HN'
      case 'show': return '🛠️ Show HN'
      case 'comments': return '💬 最新评论'
      case 'search': return appliedQuery ? `🔍 "${appliedQuery}"` : '🔍 搜索'
    }
  }, [tab, appliedQuery])

  return (
    <div style={{
      height: '100%',
      background: 'linear-gradient(135deg, #fff7ed 0%, #fef3c7 50%, #fde68a 100%)',
      color: '#1c1917',
      overflow: 'auto',
      boxSizing: 'border-box',
    }}>
      <div style={{ padding: 20, maxWidth: 1100, margin: '0 auto' }}>
        <div style={{
          display: 'flex', justifyContent: 'space-between', alignItems: 'baseline',
          marginBottom: 4, flexWrap: 'wrap', gap: 8,
        }}>
          <div style={{ fontSize: 22, fontWeight: 800, letterSpacing: -0.5 }}>
            <span style={{ color: '#ff6600' }}>Y</span>
            <span style={{ color: '#c2410c' }}>Combinator</span>
            <span style={{ color: '#78350f', fontWeight: 400, marginLeft: 8, fontSize: 13 }}>新闻阅读器</span>
          </div>
          <div style={{ fontSize: 11, color: 'rgba(120,53,15,0.6)' }}>
            Powered by Algolia HN API
          </div>
        </div>

        <div style={{
          display: 'flex', gap: 4, marginBottom: 16, flexWrap: 'wrap',
          borderBottom: '2px solid rgba(255,102,0,0.2)',
          paddingBottom: 10,
        }}>
          {([
            ['top', '🔥 热门'],
            ['newest', '🆕 最新'],
            ['ask', '❓ Ask HN'],
            ['show', '🛠️ Show HN'],
            ['comments', '💬 评论'],
            ['search', '🔍 搜索'],
          ] as const).map(([k, label]) => (
            <button
              key={k}
              onClick={() => { setTab(k); setPage(0); if (k !== 'search') setAppliedQuery('') }}
              style={{
                padding: '8px 12px',
                background: tab === k ? '#ff6600' : 'transparent',
                color: tab === k ? '#fff' : '#7c2d12',
                border: 'none',
                borderRadius: 6,
                fontSize: 13,
                fontWeight: 600,
                cursor: 'pointer',
                transition: 'background 0.15s',
              }}
            >
              {label}
            </button>
          ))}
        </div>

        {tab === 'search' && (
          <div style={{
            display: 'flex', gap: 8, marginBottom: 16,
            background: '#fff',
            padding: 10,
            borderRadius: 8,
            border: '1px solid rgba(255,102,0,0.2)',
          }}>
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && query.trim()) {
                  setAppliedQuery(query.trim())
                  setPage(0)
                  fetchStories('search', query.trim(), 0)
                }
              }}
              placeholder="搜索标题、作者、链接..."
              style={{
                flex: 1, padding: '10px 12px',
                background: 'rgba(255,247,237,0.7)',
                border: '1px solid #fed7aa',
                borderRadius: 6,
                fontSize: 13,
                outline: 'none',
                color: '#1c1917',
              }}
            />
            <button
              onClick={() => {
                if (query.trim()) {
                  setAppliedQuery(query.trim())
                  setPage(0)
                  fetchStories('search', query.trim(), 0)
                }
              }}
              style={{
                padding: '10px 18px',
                background: '#ff6600',
                color: '#fff',
                border: 'none',
                borderRadius: 6,
                fontSize: 13, fontWeight: 600,
                cursor: 'pointer',
              }}
            >
              搜索
            </button>
          </div>
        )}

        {selected && (
          <div style={{
            background: '#fff',
            border: '1px solid #fed7aa',
            borderRadius: 12,
            padding: 18,
            marginBottom: 16,
            boxShadow: '0 4px 12px rgba(194,65,12,0.08)',
          }}>
            <div style={{
              display: 'flex', justifyContent: 'space-between', alignItems: 'start', gap: 12, marginBottom: 10,
            }}>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 17, fontWeight: 700, color: '#7c2d12', lineHeight: 1.3, marginBottom: 6 }}>
                  {selected.title || selected.story_title}
                </div>
                <div style={{ fontSize: 12, color: '#92400e' }}>
                  {selected.url && (
                    <a href={selected.url} target="_blank" rel="noopener noreferrer" style={{ color: '#c2410c' }}>
                      ({extractDomain(selected.url)})
                    </a>
                  )}
                </div>
              </div>
              <button
                onClick={() => setSelected(null)}
                style={{
                  background: 'none', border: 'none', fontSize: 20,
                  color: '#a16207', cursor: 'pointer', padding: '0 6px',
                }}
              >
                ×
              </button>
            </div>
            <div style={{
              fontSize: 12, color: '#78350f', marginBottom: 10,
              display: 'flex', gap: 12, flexWrap: 'wrap',
            }}>
              <span>👤 {selected.author || '(unknown)'}</span>
              {selected.points !== undefined && <span>👍 {selected.points} 分</span>}
              {selected.num_comments !== undefined && (
                <span>💬 {selected.num_comments} 评论</span>
              )}
              <span>🕐 {formatTime(selected.created_at_i)}</span>
              {selected.title && (
                <a
                  href={`https://news.ycombinator.com/item?id=${selected.objectID}`}
                  target="_blank" rel="noopener noreferrer"
                  style={{ color: '#c2410c', textDecoration: 'none' }}
                >
                  在 HN 打开 ↗
                </a>
              )}
            </div>
            {(selected.story_text || selected.text) && (
              <div style={{
                fontSize: 13, color: '#44403c', lineHeight: 1.6,
                background: '#fff7ed',
                padding: 12,
                borderRadius: 8,
                borderLeft: '3px solid #ff6600',
                marginBottom: 12,
              }}>
                {stripHtml(selected.story_text || selected.text || '')}
              </div>
            )}

            {selected.num_comments !== undefined && selected.num_comments > 0 && (
              <>
                <div style={{ fontSize: 12, fontWeight: 700, color: '#7c2d12', marginBottom: 8 }}>
                  {commentsLoading ? '加载评论中...' : `${comments.length} 条评论`}
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8, maxHeight: 500, overflow: 'auto' }}>
                  {comments.slice(0, 200).map((c, i) => (
                    <div key={c.objectID + '-' + i} style={{
                      background: 'rgba(255,247,237,0.8)',
                      padding: 10,
                      borderRadius: 6,
                      fontSize: 12,
                      border: '1px solid rgba(254,215,170,0.6)',
                    }}>
                      <div style={{ fontSize: 11, color: '#92400e', marginBottom: 4 }}>
                        <b>{c.author}</b> · {formatTime(c.created_at_i)}
                      </div>
                      <div style={{ color: '#44403c', lineHeight: 1.5 }}>
                        {stripHtml(c.text || '')}
                      </div>
                    </div>
                  ))}
                </div>
                {!commentsLoading && comments.length === 0 && (
                  <div style={{ fontSize: 12, color: '#a16207', textAlign: 'center', padding: 20 }}>
                    暂无评论
                  </div>
                )}
              </>
            )}
          </div>
        )}

        {error && (
          <div style={{
            background: 'rgba(239,68,68,0.1)',
            border: '1px solid rgba(239,68,68,0.3)',
            padding: 12, borderRadius: 8, fontSize: 13, color: '#991b1b', marginBottom: 16,
          }}>
            ⚠️ {error}
          </div>
        )}

        {loading ? (
          <div style={{ textAlign: 'center', padding: 60, color: '#92400e', fontSize: 14 }}>
            加载中...
          </div>
        ) : (
          <>
            <div style={{
              fontSize: 14, fontWeight: 700, color: '#7c2d12', marginBottom: 10,
              display: 'flex', justifyContent: 'space-between', alignItems: 'baseline',
            }}>
              <span>{title}</span>
              <span style={{ fontSize: 11, color: '#92400e', fontWeight: 500 }}>
                第 {page + 1} / {totalPages} 页
              </span>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6, marginBottom: 16 }}>
              {items.map((item, i) => {
                const displayTitle = item.title || item.story_title || '(无标题)'
                const displayUrl = item.url || item.story_url
                const domain = extractDomain(displayUrl)
                const isSelfPost = !domain || domain === '' || domain === 'news.ycombinator.com'
                return (
                  <div key={item.objectID} style={{
                    background: '#fff',
                    border: '1px solid rgba(254,215,170,0.6)',
                    borderRadius: 8,
                    padding: '12px 14px',
                    display: 'grid',
                    gridTemplateColumns: '40px 1fr auto',
                    gap: 10,
                    alignItems: 'start',
                    transition: 'background 0.15s',
                  }}
                    onMouseEnter={(e) => { e.currentTarget.style.background = '#fff7ed' }}
                    onMouseLeave={(e) => { e.currentTarget.style.background = '#fff' }}
                  >
                    <div style={{
                      fontSize: 16, fontWeight: 800, color: '#fb923c',
                      fontFamily: 'monospace', textAlign: 'center',
                      paddingTop: 2,
                    }}>
                      {page * 30 + i + 1}
                    </div>
                    <div style={{ minWidth: 0 }}>
                      <button
                        onClick={() => loadComments(item)}
                        style={{
                          fontSize: 14, fontWeight: 700, color: '#7c2d12',
                          background: 'none', border: 'none', padding: 0,
                          cursor: 'pointer', marginRight: 6,
                          textAlign: 'left', lineHeight: 1.3,
                        }}
                      >
                        {displayTitle}
                      </button>
                      {displayUrl && (
                        <a
                          href={displayUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          style={{
                            fontSize: 11, color: '#a16207',
                            textDecoration: 'none', fontWeight: 400,
                          }}
                        >
                          ({isSelfPost ? 'self' : domain})
                        </a>
                      )}
                      <div style={{ fontSize: 11, color: '#92400e', marginTop: 4, display: 'flex', gap: 10, flexWrap: 'wrap' }}>
                        <span>👤 {item.author}</span>
                        {item.points !== undefined && <span>👍 {item.points} 分</span>}
                        {item.num_comments !== undefined && (
                          <span>💬 {item.num_comments} 评论</span>
                        )}
                        <span>🕐 {formatTime(item.created_at_i)}</span>
                        <a
                          href={`https://news.ycombinator.com/item?id=${item.objectID}`}
                          target="_blank" rel="noopener noreferrer"
                          style={{ color: '#c2410c', textDecoration: 'none' }}
                        >
                          HN ↗
                        </a>
                      </div>
                    </div>
                    {displayUrl && (
                      <a
                        href={displayUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        style={{
                          background: 'rgba(255,102,0,0.1)',
                          padding: '4px 10px',
                          borderRadius: 6,
                          fontSize: 11,
                          color: '#c2410c',
                          textDecoration: 'none',
                          fontWeight: 600,
                          whiteSpace: 'nowrap',
                        }}
                      >
                        打开 →
                      </a>
                    )}
                  </div>
                )
              })}
            </div>

            {items.length === 0 && !loading && (
              <div style={{ textAlign: 'center', padding: 60, color: '#92400e', fontSize: 13 }}>
                没有找到结果
              </div>
            )}

            {items.length > 0 && (
              <div style={{
                display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                padding: 12,
                background: '#fff',
                border: '1px solid rgba(254,215,170,0.6)',
                borderRadius: 8,
              }}>
                <button
                  onClick={() => setPage((p) => Math.max(0, p - 1))}
                  disabled={page === 0}
                  style={{
                    padding: '8px 16px',
                    background: page === 0 ? 'rgba(255,102,0,0.1)' : '#ff6600',
                    color: page === 0 ? '#a16207' : '#fff',
                    border: 'none', borderRadius: 6, fontSize: 12, fontWeight: 600,
                    cursor: page === 0 ? 'default' : 'pointer',
                  }}
                >
                  ← 上一页
                </button>
                <div style={{ fontSize: 12, color: '#7c2d12', fontWeight: 600 }}>
                  第 {page + 1} 页（共 {totalPages} 页）
                </div>
                <button
                  onClick={() => setPage((p) => Math.min(totalPages - 1, p + 1))}
                  disabled={page >= totalPages - 1}
                  style={{
                    padding: '8px 16px',
                    background: page >= totalPages - 1 ? 'rgba(255,102,0,0.1)' : '#ff6600',
                    color: page >= totalPages - 1 ? '#a16207' : '#fff',
                    border: 'none', borderRadius: 6, fontSize: 12, fontWeight: 600,
                    cursor: page >= totalPages - 1 ? 'default' : 'pointer',
                  }}
                >
                  下一页 →
                </button>
              </div>
            )}
          </>
        )}

        <div style={{
          marginTop: 24,
          padding: 14,
          fontSize: 11,
          color: '#92400e',
          textAlign: 'center',
          opacity: 0.7,
        }}>
          本应用使用 Hacker News 的公开 API（hn.algolia.com/api）。所有内容版权归原作者所有。
        </div>
      </div>
    </div>
  )
}

export default HackerNewsReader
