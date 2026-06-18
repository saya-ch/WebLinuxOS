import { useState, useEffect, useCallback, useMemo } from 'react'

interface RssSource {
  id: string
  name: string
  url: string
  isBuiltin?: boolean
}

interface RssItem {
  title: string
  link: string
  description: string
  pubDate: string
  author?: string
  category?: string[]
}

interface RssFeed {
  title: string
  description: string
  link: string
  items: RssItem[]
  sourceUrl: string
}

const STORAGE_KEY = 'rss-reader-sources-v1'

const BUILTIN_SOURCES: RssSource[] = [
  { id: 'builtin-xinhua', name: '新华社 · 最新', url: 'http://www.xinhuanet.com/rss/news.xml', isBuiltin: true },
  { id: 'builtin-bbc-zhongwen', name: 'BBC 中文网', url: 'http://feeds.bbci.co.uk/zhongwen/trad/rss.xml', isBuiltin: true },
  { id: 'builtin-wikipedia-news', name: 'Wikipedia · News', url: 'https://en.wikipedia.org/w/api.php?action=featuredfeed&feed=news&feedformat=atom', isBuiltin: true },
  { id: 'builtin-hn', name: 'Hacker News', url: 'https://hnrss.org/frontpage', isBuiltin: true },
  { id: 'builtin-sm', name: 'Slashdot', url: 'https://rss.slashdot.org/Slashdot/slashdotMain', isBuiltin: true },
]

function genId(): string {
  return 'src-' + Math.random().toString(36).slice(2, 10)
}

function stripHtml(html: string): string {
  if (!html || typeof html !== 'string') return ''
  return html
    .replace(/<script[\s\S]*?<\/script>/gi, '')
    .replace(/<style[\s\S]*?<\/style>/gi, '')
    .replace(/<br\s*\/?>/gi, ' ')
    .replace(/<\/p>/gi, ' ')
    .replace(/<\/div>/gi, ' ')
    .replace(/<li>/gi, ' · ')
    .replace(/<[^>]+>/g, '')
    .replace(/&nbsp;/gi, ' ')
    .replace(/&amp;/gi, '&')
    .replace(/&lt;/gi, '<')
    .replace(/&gt;/gi, '>')
    .replace(/&quot;/gi, '"')
    .replace(/&#x27;/gi, "'")
    .replace(/&#\d+;/gi, '')
    .replace(/\s+/g, ' ')
    .trim()
}

function truncate(text: string, max = 220): string {
  const cleaned = stripHtml(text)
  if (cleaned.length <= max) return cleaned
  return cleaned.slice(0, max).trimEnd() + '…'
}

function formatDate(raw?: string): string {
  if (!raw) return ''
  const d = new Date(raw)
  if (Number.isNaN(d.getTime())) return raw
  const now = Date.now()
  const diff = (now - d.getTime()) / 1000
  if (diff < 0) return d.toLocaleString()
  if (diff < 60) return `${Math.floor(diff)} 秒前`
  if (diff < 3600) return `${Math.floor(diff / 60)} 分钟前`
  if (diff < 86400) return `${Math.floor(diff / 3600)} 小时前`
  if (diff < 86400 * 7) return `${Math.floor(diff / 86400)} 天前`
  return d.toLocaleString()
}

function textContent(el: Element | null | undefined): string {
  return (el?.textContent || '').trim()
}

function parseRssXml(xmlText: string, sourceUrl: string): RssFeed {
  const parser = new DOMParser()
  const doc = parser.parseFromString(xmlText, 'text/xml')
  const parseError = doc.querySelector('parsererror')
  if (parseError) {
    throw new Error('XML 解析失败：源可能不是有效的 RSS / Atom 订阅')
  }

  let channelTitle = ''
  let channelDesc = ''
  let channelLink = ''
  const items: RssItem[] = []

  // RSS 2.0: rss/channel
  const channel = doc.querySelector('rss > channel')
  if (channel) {
    channelTitle = textContent(channel.querySelector(':scope > title'))
    channelDesc = textContent(channel.querySelector(':scope > description'))
    channelLink = textContent(channel.querySelector(':scope > link'))
    const entries = channel.querySelectorAll(':scope > item')
    entries.forEach((node) => {
      const title = textContent(node.querySelector(':scope > title'))
      const link = textContent(node.querySelector(':scope > link'))
      const description =
        textContent(node.querySelector(':scope > content\\:encoded')) ||
        textContent(node.querySelector(':scope > description'))
      const pubDate =
        textContent(node.querySelector(':scope > pubDate')) ||
        textContent(node.querySelector(':scope > dc\\:date'))
      const author = textContent(node.querySelector(':scope > author')) ||
        textContent(node.querySelector(':scope > dc\\:creator'))
      const categories = Array.from(node.querySelectorAll(':scope > category'))
        .map((c) => c.textContent || '')
        .filter(Boolean)
      if (title || link) {
        items.push({ title, link, description, pubDate, author, category: categories })
      }
    })
    if (items.length > 0) {
      return {
        title: channelTitle || '未知订阅',
        description: channelDesc,
        link: channelLink,
        items,
        sourceUrl,
      }
    }
  }

  // Atom: feed/entry
  const feed = doc.querySelector('feed')
  if (feed) {
    channelTitle = textContent(feed.querySelector(':scope > title'))
    const linkEl = feed.querySelector(':scope > link[href]')
    channelLink = linkEl?.getAttribute('href') || ''
    channelDesc = textContent(feed.querySelector(':scope > subtitle')) || textContent(feed.querySelector(':scope > summary'))
    const entries = feed.querySelectorAll(':scope > entry')
    entries.forEach((node) => {
      const title = textContent(node.querySelector(':scope > title'))
      const linkNode = node.querySelector(':scope > link[href]')
      const link = linkNode?.getAttribute('href') || ''
      const description =
        textContent(node.querySelector(':scope > content')) ||
        textContent(node.querySelector(':scope > summary'))
      const pubDate =
        textContent(node.querySelector(':scope > updated')) ||
        textContent(node.querySelector(':scope > published'))
      const author = textContent(node.querySelector(':scope > author > name'))
      if (title || link) {
        items.push({ title, link, description, pubDate, author })
      }
    })
    if (items.length > 0) {
      return {
        title: channelTitle || '未知订阅',
        description: channelDesc,
        link: channelLink,
        items,
        sourceUrl,
      }
    }
  }

  // RDF / RSS 1.0 fallback
  const rdfItems = doc.querySelectorAll('item')
  if (rdfItems.length > 0) {
    rdfItems.forEach((node) => {
      const title = textContent(node.querySelector(':scope > title'))
      const link = textContent(node.querySelector(':scope > link'))
      const description = textContent(node.querySelector(':scope > description'))
      const pubDate = textContent(node.querySelector(':scope > dc\\:date')) || textContent(node.querySelector(':scope > pubDate'))
      if (title || link) items.push({ title, link, description, pubDate })
    })
    return { title: 'RSS 订阅', description: '', link: '', items, sourceUrl }
  }

  throw new Error('未找到可解析的 RSS / Atom 条目')
}

const proxyUrl = (url: string) =>
  `https://api.allorigins.win/raw?url=${encodeURIComponent(url)}`

function loadSources(): RssSource[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return []
    const parsed = JSON.parse(raw)
    if (!Array.isArray(parsed)) return []
    return parsed
      .filter((s) => s && typeof s.url === 'string' && typeof s.name === 'string')
      .map((s) => ({ id: String(s.id || genId()), name: String(s.name), url: String(s.url), isBuiltin: false }))
  } catch {
    return []
  }
}

function saveSources(list: RssSource[]) {
  const toSave = list.filter((s) => !s.isBuiltin).map(({ id, name, url }) => ({ id, name, url }))
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(toSave))
  } catch {
    /* ignore */
  }
}

const RSSReader = () => {
  const [userSources, setUserSources] = useState<RssSource[]>(() => loadSources())
  const [selectedId, setSelectedId] = useState<string>(BUILTIN_SOURCES[0].id)
  const [feed, setFeed] = useState<RssFeed | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [searchQuery, setSearchQuery] = useState('')
  const [newName, setNewName] = useState('')
  const [newUrl, setNewUrl] = useState('')
  const [activeItem, setActiveItem] = useState<RssItem | null>(null)
  const [showAdd, setShowAdd] = useState(false)

  const allSources = useMemo(
    () => [...BUILTIN_SOURCES, ...userSources],
    [userSources],
  )

  const selectedSource = useMemo(
    () => allSources.find((s) => s.id === selectedId) || allSources[0],
    [allSources, selectedId],
  )

  const filteredItems = useMemo(() => {
    if (!feed) return []
    const q = searchQuery.trim().toLowerCase()
    if (!q) return feed.items
    return feed.items.filter((it) => {
      return (
        it.title?.toLowerCase().includes(q) ||
        stripHtml(it.description).toLowerCase().includes(q) ||
        (it.author || '').toLowerCase().includes(q)
      )
    })
  }, [feed, searchQuery])

  const fetchFeed = useCallback(async (source: RssSource) => {
    setLoading(true)
    setError(null)
    setFeed(null)
    setActiveItem(null)
    try {
      const res = await fetch(proxyUrl(source.url), { cache: 'no-store' })
      if (!res.ok) {
        throw new Error(`代理返回错误：HTTP ${res.status}`)
      }
      const text = await res.text()
      if (!text || text.length < 30) {
        throw new Error('未接收到有效内容（可能目标站点阻止了代理，或网络异常）')
      }
      const parsed = parseRssXml(text, source.url)
      setFeed(parsed)
    } catch (e: any) {
      const msg = e?.message || String(e)
      let friendly = '加载失败，请稍后重试'
      if (msg.includes('Failed to fetch') || msg.includes('NetworkError') || msg.includes('网络')) {
        friendly = '网络错误：无法连接到 RSS 代理服务，请检查网络后重试'
      } else if (msg.includes('CORS') || msg.includes('代理')) {
        friendly = `CORS / 代理服务错误：${msg}`
      } else if (msg.includes('XML') || msg.includes('解析')) {
        friendly = `解析失败：${msg}`
      } else if (msg.includes('HTTP')) {
        friendly = `远程站点错误：${msg}`
      } else {
        friendly = msg
      }
      setError(friendly)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    if (selectedSource) fetchFeed(selectedSource)
  }, [selectedSource, fetchFeed])

  const addSource = () => {
    const name = newName.trim()
    const url = newUrl.trim()
    if (!url) {
      setError('请输入订阅地址（URL）')
      return
    }
    let normalized = url
    if (!/^https?:\/\//i.test(normalized)) {
      normalized = 'https://' + normalized
    }
    try {
      new URL(normalized)
    } catch {
      setError('订阅地址无效，请检查 URL 格式')
      return
    }
    const nextList = [
      ...userSources,
      { id: genId(), name: name || normalized, url: normalized },
    ]
    setUserSources(nextList)
    saveSources(nextList)
    setNewName('')
    setNewUrl('')
    setShowAdd(false)
    setError(null)
  }

  const removeSource = (id: string) => {
    const nextList = userSources.filter((s) => s.id !== id)
    setUserSources(nextList)
    saveSources(nextList)
    if (selectedId === id) {
      setSelectedId(BUILTIN_SOURCES[0].id)
    }
  }

  return (
    <div
      style={{
        height: '100%',
        width: '100%',
        display: 'flex',
        flexDirection: 'column',
        background:
          'linear-gradient(180deg, #0f172a 0%, #111827 40%, #0b1220 100%)',
        color: '#e5e7eb',
        fontFamily:
          '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif',
        boxSizing: 'border-box',
      }}
    >
      {/* 顶栏 */}
      <div
        style={{
          padding: '14px 20px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: 12,
          borderBottom: '1px solid rgba(255,255,255,0.06)',
          background: 'linear-gradient(90deg, #1e293b, #111827)',
          flexWrap: 'wrap',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div
            style={{
              width: 28,
              height: 28,
              borderRadius: 8,
              background:
                'linear-gradient(135deg, #f97316 0%, #ef4444 100%)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#fff',
              fontWeight: 700,
              fontSize: 14,
              flexShrink: 0,
            }}
          >
            R
          </div>
          <div>
            <div style={{ fontSize: 16, fontWeight: 700, color: '#f8fafc' }}>
              RSS 订阅阅读器
            </div>
            <div style={{ fontSize: 11, color: '#94a3b8' }}>
              通过公共 CORS 代理读取 RSS / Atom 订阅
            </div>
          </div>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <input
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="🔍 搜索当前订阅内的文章标题 / 内容..."
            style={{
              width: 320,
              padding: '8px 12px',
              background: 'rgba(15,23,42,0.8)',
              border: '1px solid rgba(148,163,184,0.25)',
              borderRadius: 8,
              color: '#e2e8f0',
              fontSize: 13,
              outline: 'none',
            }}
          />
          <button
            onClick={() => {
              if (selectedSource) fetchFeed(selectedSource)
            }}
            disabled={loading}
            style={{
              padding: '8px 14px',
              background: loading ? '#334155' : '#f97316',
              color: '#fff',
              border: 'none',
              borderRadius: 8,
              cursor: loading ? 'default' : 'pointer',
              fontSize: 13,
              fontWeight: 600,
            }}
          >
            {loading ? '加载中...' : '🔄 刷新'}
          </button>
        </div>
      </div>

      {/* 主体三栏 */}
      <div style={{ flex: 1, display: 'flex', minHeight: 0 }}>
        {/* 左栏：订阅源 */}
        <div
          style={{
            width: 280,
            flexShrink: 0,
            borderRight: '1px solid rgba(255,255,255,0.06)',
            display: 'flex',
            flexDirection: 'column',
            background: 'rgba(15,23,42,0.55)',
          }}
        >
          <div style={{ padding: 14, borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                marginBottom: 10,
              }}
            >
              <span style={{ fontSize: 12, color: '#94a3b8', fontWeight: 600, letterSpacing: 0.5 }}>
                预置订阅
              </span>
            </div>
            {BUILTIN_SOURCES.map((s) => (
              <SourceRow
                key={s.id}
                source={s}
                active={selectedId === s.id}
                onClick={() => setSelectedId(s.id)}
              />
            ))}
          </div>

          <div style={{ flex: 1, padding: 14, overflowY: 'auto' }}>
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                marginBottom: 10,
              }}
            >
              <span style={{ fontSize: 12, color: '#94a3b8', fontWeight: 600, letterSpacing: 0.5 }}>
                我的订阅（{userSources.length}）
              </span>
              <button
                onClick={() => setShowAdd((v) => !v)}
                style={{
                  background: 'transparent',
                  border: '1px solid rgba(249,115,22,0.4)',
                  color: '#fb923c',
                  padding: '3px 8px',
                  borderRadius: 6,
                  cursor: 'pointer',
                  fontSize: 11,
                  fontWeight: 600,
                }}
              >
                {showAdd ? '取消' : '+ 添加'}
              </button>
            </div>

            {showAdd && (
              <div
                style={{
                  background: 'rgba(30,41,59,0.8)',
                  border: '1px solid rgba(148,163,184,0.15)',
                  borderRadius: 8,
                  padding: 10,
                  marginBottom: 12,
                  display: 'flex',
                  flexDirection: 'column',
                  gap: 8,
                }}
              >
                <input
                  placeholder="订阅名称（可选）"
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  style={inputStyle}
                />
                <input
                  placeholder="RSS / Atom URL"
                  value={newUrl}
                  onChange={(e) => setNewUrl(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') addSource()
                  }}
                  style={inputStyle}
                />
                <button
                  onClick={addSource}
                  style={{
                    padding: '8px 12px',
                    background: '#f97316',
                    color: '#fff',
                    border: 'none',
                    borderRadius: 6,
                    fontSize: 13,
                    fontWeight: 600,
                    cursor: 'pointer',
                  }}
                >
                  保存订阅
                </button>
              </div>
            )}

            {userSources.length === 0 && !showAdd && (
              <div
                style={{
                  fontSize: 12,
                  color: '#64748b',
                  padding: '10px 4px',
                  lineHeight: 1.6,
                }}
              >
                暂无自定义订阅。点击右上角「+ 添加」保存一个新的 RSS 地址。
              </div>
            )}

            {userSources.map((s) => (
              <div
                key={s.id}
                onClick={() => setSelectedId(s.id)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  gap: 8,
                  padding: '8px 10px',
                  borderRadius: 6,
                  cursor: 'pointer',
                  background:
                    selectedId === s.id
                      ? 'linear-gradient(90deg, rgba(249,115,22,0.2), rgba(249,115,22,0.05))'
                      : 'transparent',
                  border:
                    selectedId === s.id
                      ? '1px solid rgba(249,115,22,0.35)'
                      : '1px solid transparent',
                  marginBottom: 4,
                  transition: 'background 0.15s',
                }}
                onMouseEnter={(e) => {
                  if (selectedId !== s.id) {
                    e.currentTarget.style.background = 'rgba(148,163,184,0.08)'
                  }
                }}
                onMouseLeave={(e) => {
                  if (selectedId !== s.id) {
                    e.currentTarget.style.background = 'transparent'
                  }
                }}
              >
                <div style={{ minWidth: 0, flex: 1 }}>
                  <div
                    style={{
                      fontSize: 13,
                      fontWeight: 600,
                      color: '#e2e8f0',
                      whiteSpace: 'nowrap',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                    }}
                  >
                    {s.name}
                  </div>
                  <div
                    style={{
                      fontSize: 10,
                      color: '#64748b',
                      marginTop: 2,
                      whiteSpace: 'nowrap',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                    }}
                  >
                    {s.url}
                  </div>
                </div>
                <button
                  onClick={(e) => {
                    e.stopPropagation()
                    if (confirm(`删除订阅「${s.name}」？`)) removeSource(s.id)
                  }}
                  style={{
                    background: 'transparent',
                    border: 'none',
                    color: '#64748b',
                    fontSize: 14,
                    cursor: 'pointer',
                    padding: '2px 4px',
                  }}
                  title="删除"
                >
                  ×
                </button>
              </div>
            ))}
          </div>

          <div
            style={{
              padding: '10px 14px',
              fontSize: 10,
              color: '#64748b',
              borderTop: '1px solid rgba(255,255,255,0.05)',
              lineHeight: 1.5,
            }}
          >
            数据保存于浏览器 localStorage，
            <br />
            key：<code style={{ color: '#f8afc3' }}>rss-reader-sources-v1</code>
          </div>
        </div>

        {/* 中栏：文章列表 */}
        <div
          style={{
            width: 420,
            flexShrink: 0,
            borderRight: '1px solid rgba(255,255,255,0.06)',
            display: 'flex',
            flexDirection: 'column',
            background: 'rgba(17,24,39,0.6)',
            minWidth: 0,
          }}
        >
          <div
            style={{
              padding: '14px 16px',
              borderBottom: '1px solid rgba(255,255,255,0.05)',
              minHeight: 66,
            }}
          >
            <div
              style={{
                fontSize: 15,
                fontWeight: 700,
                color: '#f8fafc',
                whiteSpace: 'nowrap',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
              }}
            >
              {feed ? feed.title : selectedSource?.name || '加载中...'}
            </div>
            <div
              style={{
                fontSize: 11,
                color: '#94a3b8',
                marginTop: 4,
                display: 'flex',
                gap: 10,
                alignItems: 'center',
              }}
            >
              <span>{feed ? `${feed.items.length} 篇文章` : '—'}</span>
              {searchQuery.trim() && (
                <span style={{ color: '#fb923c' }}>
                  搜索结果：{filteredItems.length} 篇
                </span>
              )}
              {feed?.link && (
                <a
                  href={feed.link}
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{ color: '#60a5fa', textDecoration: 'none', fontSize: 11 }}
                >
                  站点 ↗
                </a>
              )}
            </div>
          </div>

          <div style={{ flex: 1, overflowY: 'auto', padding: '6px 6px 14px' }}>
            {error && (
              <div
                style={{
                  margin: '10px 8px',
                  padding: 12,
                  borderRadius: 8,
                  background: 'rgba(239,68,68,0.12)',
                  border: '1px solid rgba(239,68,68,0.35)',
                  color: '#fca5a5',
                  fontSize: 12,
                  lineHeight: 1.6,
                }}
              >
                <div style={{ fontWeight: 700, marginBottom: 4 }}>⚠️ 无法加载此订阅</div>
                {error}
                <div style={{ marginTop: 8, fontSize: 11, color: '#fecaca' }}>
                  提示：部分站点对第三方代理有限制；可尝试直接访问订阅地址验证。
                </div>
              </div>
            )}

            {loading && (
              <div
                style={{
                  textAlign: 'center',
                  padding: '60px 20px',
                  color: '#94a3b8',
                  fontSize: 13,
                }}
              >
                <div style={{ fontSize: 28, marginBottom: 10 }}>📡</div>
                正在通过 CORS 代理获取订阅...
              </div>
            )}

            {!loading && !error && feed && filteredItems.length === 0 && (
              <div
                style={{
                  textAlign: 'center',
                  padding: '60px 20px',
                  color: '#94a3b8',
                  fontSize: 13,
                }}
              >
                {searchQuery.trim() ? '没有找到匹配的文章' : '此订阅暂无文章'}
              </div>
            )}

            {!loading &&
              !error &&
              filteredItems.map((it, idx) => {
                const isActive =
                  activeItem &&
                  activeItem.title === it.title &&
                  activeItem.link === it.link
                return (
                  <div
                    key={it.link + idx}
                    onClick={() => setActiveItem(it)}
                    style={{
                      padding: '12px 14px',
                      margin: '4px 2px',
                      borderRadius: 8,
                      cursor: 'pointer',
                      border: '1px solid',
                      borderColor: isActive
                        ? 'rgba(249,115,22,0.5)'
                        : 'rgba(148,163,184,0.1)',
                      background: isActive
                        ? 'linear-gradient(135deg, rgba(249,115,22,0.12), rgba(239,68,68,0.06))'
                        : 'rgba(30,41,59,0.4)',
                      transition: 'background 0.15s, border-color 0.15s',
                    }}
                    onMouseEnter={(e) => {
                      if (!isActive) {
                        e.currentTarget.style.background = 'rgba(30,41,59,0.75)'
                        e.currentTarget.style.borderColor = 'rgba(148,163,184,0.25)'
                      }
                    }}
                    onMouseLeave={(e) => {
                      if (!isActive) {
                        e.currentTarget.style.background = 'rgba(30,41,59,0.4)'
                        e.currentTarget.style.borderColor = 'rgba(148,163,184,0.1)'
                      }
                    }}
                  >
                    <div
                      style={{
                        fontSize: 14,
                        fontWeight: 600,
                        color: '#f1f5f9',
                        lineHeight: 1.4,
                        marginBottom: 6,
                      }}
                    >
                      {it.title || '(无标题)'}
                    </div>
                    <div
                      style={{
                        fontSize: 12,
                        color: '#94a3b8',
                        lineHeight: 1.5,
                        marginBottom: 8,
                        display: '-webkit-box',
                        WebkitLineClamp: 2,
                        WebkitBoxOrient: 'vertical',
                        overflow: 'hidden',
                      }}
                    >
                      {truncate(it.description, 140)}
                    </div>
                    <div
                      style={{
                        fontSize: 11,
                        color: '#64748b',
                        display: 'flex',
                        gap: 12,
                        alignItems: 'center',
                      }}
                    >
                      <span>🕒 {formatDate(it.pubDate)}</span>
                      {it.author && <span>✍️ {it.author}</span>}
                      {it.link && (
                        <a
                          href={it.link}
                          target="_blank"
                          rel="noopener noreferrer"
                          onClick={(e) => e.stopPropagation()}
                          style={{ color: '#60a5fa', textDecoration: 'none', marginLeft: 'auto' }}
                        >
                          原文 ↗
                        </a>
                      )}
                    </div>
                  </div>
                )
              })}
          </div>
        </div>

        {/* 右栏：文章详情 */}
        <div
          style={{
            flex: 1,
            display: 'flex',
            flexDirection: 'column',
            overflow: 'hidden',
            minWidth: 0,
          }}
        >
          <div
            style={{
              padding: '14px 20px',
              borderBottom: '1px solid rgba(255,255,255,0.05)',
              fontSize: 12,
              color: '#94a3b8',
              fontWeight: 600,
              letterSpacing: 0.5,
            }}
          >
            文章详情
          </div>
          <div style={{ flex: 1, overflowY: 'auto', padding: 20 }}>
            {activeItem ? (
              <div style={{ maxWidth: 820 }}>
                <div
                  style={{
                    fontSize: 22,
                    fontWeight: 700,
                    color: '#f8fafc',
                    lineHeight: 1.3,
                    marginBottom: 14,
                  }}
                >
                  {activeItem.title || '(无标题)'}
                </div>
                <div
                  style={{
                    fontSize: 12,
                    color: '#94a3b8',
                    display: 'flex',
                    gap: 16,
                    alignItems: 'center',
                    marginBottom: 20,
                    flexWrap: 'wrap',
                  }}
                >
                  <span>🕒 {formatDate(activeItem.pubDate)}</span>
                  {activeItem.author && <span>✍️ {activeItem.author}</span>}
                  {activeItem.category && activeItem.category.length > 0 && (
                    <span>🏷️ {activeItem.category.slice(0, 3).join(' · ')}</span>
                  )}
                  {activeItem.link && (
                    <a
                      href={activeItem.link}
                      target="_blank"
                      rel="noopener noreferrer"
                      style={{
                        color: '#f97316',
                        textDecoration: 'none',
                        fontSize: 12,
                        marginLeft: 'auto',
                        padding: '4px 10px',
                        background: 'rgba(249,115,22,0.15)',
                        borderRadius: 6,
                        fontWeight: 600,
                      }}
                    >
                      在新标签页打开原文 ↗
                    </a>
                  )}
                </div>

                <div
                  style={{
                    fontSize: 15,
                    color: '#e2e8f0',
                    lineHeight: 1.8,
                    background: 'rgba(30,41,59,0.55)',
                    padding: '20px 22px',
                    borderRadius: 10,
                    border: '1px solid rgba(148,163,184,0.1)',
                    wordBreak: 'break-word',
                  }}
                  dangerouslySetInnerHTML={{
                    __html: activeItem.description || '<em style="color:#64748b">（该文章无正文摘要）</em>',
                  }}
                />
                <div
                  style={{
                    marginTop: 16,
                    fontSize: 11,
                    color: '#64748b',
                    lineHeight: 1.6,
                  }}
                >
                  注：摘要由 RSS 源直接提供，样式由浏览器渲染；部分图片与链接可能因同源策略而无法加载。
                </div>
              </div>
            ) : (
              <div
                style={{
                  height: '100%',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: '#64748b',
                  textAlign: 'center',
                  gap: 14,
                }}
              >
                <div style={{ fontSize: 64, opacity: 0.4 }}>📖</div>
                <div style={{ fontSize: 15, color: '#94a3b8' }}>
                  从左侧订阅列表选择一个源，然后点击中间的文章查看详情
                </div>
                <div style={{ fontSize: 12, color: '#475569', maxWidth: 420, lineHeight: 1.7 }}>
                  支持 RSS 2.0 / Atom / RSS 1.0 (RDF) 格式；
                  所有网络请求经由 <code style={{ color: '#f8afc3' }}>api.allorigins.win</code> CORS 代理转发。
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

const inputStyle: React.CSSProperties = {
  padding: '8px 10px',
  background: 'rgba(15,23,42,0.85)',
  border: '1px solid rgba(148,163,184,0.25)',
  borderRadius: 6,
  color: '#e2e8f0',
  fontSize: 12,
  outline: 'none',
}

function SourceRow({
  source,
  active,
  onClick,
}: {
  source: RssSource
  active: boolean
  onClick: () => void
}) {
  return (
    <div
      onClick={onClick}
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: 10,
        padding: '10px 10px',
        borderRadius: 6,
        cursor: 'pointer',
        background: active
          ? 'linear-gradient(90deg, rgba(249,115,22,0.2), rgba(249,115,22,0.05))'
          : 'transparent',
        border: active ? '1px solid rgba(249,115,22,0.35)' : '1px solid transparent',
        marginBottom: 3,
        transition: 'background 0.15s',
      }}
      onMouseEnter={(e) => {
        if (!active) e.currentTarget.style.background = 'rgba(148,163,184,0.08)'
      }}
      onMouseLeave={(e) => {
        if (!active) e.currentTarget.style.background = 'transparent'
      }}
    >
      <div
        style={{
          width: 20,
          height: 20,
          borderRadius: 5,
          background:
            'radial-gradient(circle at 30% 30%, #fb923c 0%, #ef4444 80%)',
          flexShrink: 0,
          boxShadow: '0 0 8px rgba(249,115,22,0.35)',
        }}
      />
      <div style={{ minWidth: 0, flex: 1 }}>
        <div
          style={{
            fontSize: 13,
            fontWeight: 600,
            color: active ? '#fde68a' : '#e2e8f0',
            whiteSpace: 'nowrap',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
          }}
        >
          {source.name}
        </div>
      </div>
    </div>
  )
}

export default RSSReader
