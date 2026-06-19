import { useState, useEffect, useCallback, useMemo } from 'react'
import { useStore } from '../store'

// ==================== 类型定义 ====================
interface HNStory {
  objectID: string
  title: string | null
  url: string | null
  author: string
  points: number | null
  num_comments: number | null
  created_at: string
  story_text?: string | null
  _tags: string[]
}

type HNTag = 'story' | 'ask_hn' | 'show_hn' | 'poll'

interface TagOption {
  key: HNTag
  label: string
  icon: string
  description: string
}

// ==================== 常量 ====================
const TAG_OPTIONS: TagOption[] = [
  { key: 'story', label: '热门故事', icon: '📰', description: 'Hacker News 热门文章' },
  { key: 'ask_hn', label: 'Ask HN', icon: '💬', description: '社区提问与讨论' },
  { key: 'show_hn', label: 'Show HN', icon: '🛠️', description: '项目与成果展示' },
  { key: 'poll', label: '投票', icon: '🗳️', description: '社区投票' },
]

// ==================== 工具函数 ====================
function relativeTime(iso: string): string {
  const then = new Date(iso).getTime()
  const diff = Date.now() - then
  const mins = Math.floor(diff / 60000)
  if (mins < 1) return '刚刚'
  if (mins < 60) return `${mins} 分钟前`
  const hours = Math.floor(mins / 60)
  if (hours < 24) return `${hours} 小时前`
  const days = Math.floor(hours / 24)
  if (days < 30) return `${days} 天前`
  const months = Math.floor(days / 30)
  if (months < 12) return `${months} 个月前`
  return `${Math.floor(months / 12)} 年前`
}

function getHostname(url: string | null): string {
  if (!url) return 'news.ycombinator.com'
  try {
    const u = new URL(url)
    return u.hostname.replace(/^www\./, '')
  } catch {
    return url
  }
}

// ==================== 主组件 ====================
export default function NewsReader() {
  const [stories, setStories] = useState<HNStory[]>([])
  const [tag, setTag] = useState<HNTag>('story')
  const [loading, setLoading] = useState<boolean>(false)
  const [error, setError] = useState<string | null>(null)
  const [filter, setFilter] = useState<string>('')
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null)
  const [skeleton, setSkeleton] = useState<boolean>(true)

  const addNotification = useStore((s) => s.addNotification)

  // ========== 从 Hacker News Algolia API 获取真实新闻 ==========
  const fetchStories = useCallback(async (t: HNTag) => {
    setLoading(true)
    setError(null)
    setSkeleton(true)
    try {
      // story 类型默认按分数排序，其他按时间排序
      let url = ''
      if (t === 'story') {
        // 按分数（热门）+ 最近 90 天
        url = `https://hn.algolia.com/api/v1/search_by_date?tags=story&hitsPerPage=20`
      } else {
        url = `https://hn.algolia.com/api/v1/search_by_date?tags=${encodeURIComponent(t)}&hitsPerPage=20`
      }
      const res = await fetch(url)
      if (!res.ok) throw new Error(`HTTP ${res.status}`)
      const data = await res.json()
      const hits: HNStory[] = (data.hits ?? []).filter((h: HNStory) => h.title)
      setStories(hits)
      setLastUpdated(new Date())
      if (hits.length === 0) {
        setError('未找到相关内容')
      }
    } catch (err) {
      const msg = err instanceof Error ? err.message : '请求失败'
      setError(`新闻获取失败：${msg}`)
      addNotification({ title: '新闻阅读器', message: '新闻获取失败', type: 'error' })
    } finally {
      setLoading(false)
      // skeleton 短时间保留以获得更好的视觉反馈
      setTimeout(() => setSkeleton(false), 150)
    }
  }, [addNotification])

  // 首次加载 & tag 改变
  useEffect(() => {
    fetchStories(tag)
  }, [tag, fetchStories])

  // 前端过滤
  const filtered = useMemo(() => {
    const q = filter.trim().toLowerCase()
    if (!q) return stories
    return stories.filter(
      (s) =>
        (s.title ?? '').toLowerCase().includes(q) ||
        (s.author ?? '').toLowerCase().includes(q) ||
        (s.url ?? '').toLowerCase().includes(q)
    )
  }, [stories, filter])

  // 打开链接
  const openUrl = useCallback((url: string | null, fallbackId: string) => {
    const target = url && url.trim() !== '' ? url : `https://news.ycombinator.com/item?id=${fallbackId}`
    try {
      window.open(target, '_blank', 'noopener,noreferrer')
    } catch {
      // 某些环境下 window.open 可能失败，直接用 location.href
      try {
        window.location.href = target
      } catch {
        /* 忽略 */
      }
    }
  }, [])

  const currentTagInfo = TAG_OPTIONS.find((t) => t.key === tag)

  return (
    <div className="app-shell" style={{ height: '100%', overflowY: 'auto', padding: 14, background: 'linear-gradient(135deg, #0f1220 0%, #1a1a2e 100%)', color: '#fff' }}>
      {/* 顶部标题 */}
      <div className="app-card" style={{ padding: 14, marginBottom: 12, borderRadius: 12, background: 'linear-gradient(135deg, rgba(255, 102, 0, 0.15) 0%, rgba(124, 108, 240, 0.12) 100%)', border: '1px solid rgba(255,255,255,0.08)' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
          <div>
            <div style={{ fontSize: 20, fontWeight: 700, display: 'flex', alignItems: 'center', gap: 8 }}>
              <span>📰</span>
              <span>Hacker News 阅读器</span>
            </div>
            <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.55)', marginTop: 4 }}>
              数据来源：hn.algolia.com
              {lastUpdated && ` · 更新于 ${lastUpdated.toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' })}`}
            </div>
          </div>
          <button
            className="app-button"
            onClick={() => fetchStories(tag)}
            disabled={loading}
            style={{ padding: '8px 14px', borderRadius: 20, border: '1px solid rgba(255,255,255,0.2)', background: 'rgba(255,255,255,0.06)', color: '#fff', cursor: loading ? 'wait' : 'pointer', fontSize: 13 }}
          >
            {loading ? '刷新中...' : '🔄 刷新'}
          </button>
        </div>

        {/* 标签切换 */}
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginTop: 10 }}>
          {TAG_OPTIONS.map((opt) => (
            <button
              key={opt.key}
              className="chip"
              onClick={() => setTag(opt.key)}
              style={{
                padding: '7px 14px',
                borderRadius: 20,
                border: '1px solid ' + (tag === opt.key ? 'rgba(255, 102, 0, 0.6)' : 'rgba(255,255,255,0.12)'),
                background: tag === opt.key ? 'rgba(255, 102, 0, 0.25)' : 'rgba(255,255,255,0.05)',
                color: '#fff',
                cursor: 'pointer',
                fontSize: 12,
                fontWeight: tag === opt.key ? 600 : 400,
              }}
            >
              {opt.icon} {opt.label}
            </button>
          ))}
        </div>

        {/* 当前分类描述 */}
        <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.45)', marginTop: 8 }}>
          {currentTagInfo?.description} · 共 {stories.length} 条
        </div>
      </div>

      {/* 搜索 / 过滤框 */}
      <div className="app-card" style={{ padding: 10, marginBottom: 12, borderRadius: 10, background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.08)' }}>
        <input
          className="app-input"
          type="text"
          placeholder="🔍 按标题 / 作者 / 域名过滤..."
          value={filter}
          onChange={(e) => setFilter(e.target.value)}
          style={{ width: '100%', padding: '9px 12px', borderRadius: 8, border: '1px solid rgba(255,255,255,0.1)', background: 'rgba(0,0,0,0.25)', color: '#fff', fontSize: 13, outline: 'none' }}
        />
        {filter && (
          <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.5)', marginTop: 6 }}>
            找到 {filtered.length} / {stories.length} 条匹配
          </div>
        )}
      </div>

      {/* 错误 */}
      {error && !skeleton && (
        <div className="app-card" style={{ padding: 12, marginBottom: 12, borderRadius: 10, background: 'rgba(239, 68, 68, 0.15)', border: '1px solid rgba(239, 68, 68, 0.4)', color: '#fca5a5', fontSize: 13 }}>
          ⚠️ {error}
        </div>
      )}

      {/* 列表 */}
      {skeleton ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {Array.from({ length: 8 }).map((_, i) => (
            <div
              key={`sk-${i}`}
              className="app-card"
              style={{
                padding: 14,
                borderRadius: 10,
                background: 'rgba(255,255,255,0.04)',
                border: '1px solid rgba(255,255,255,0.06)',
                position: 'relative',
                overflow: 'hidden',
              }}
            >
              <div style={{ height: 14, width: `${70 + ((i * 13) % 25)}%`, background: 'linear-gradient(90deg, rgba(255,255,255,0.06) 0%, rgba(255,255,255,0.14) 50%, rgba(255,255,255,0.06) 100%)', backgroundSize: '200% 100%', animation: 'shimmer 1.2s linear infinite', borderRadius: 4, marginBottom: 8 }} />
              <div style={{ height: 11, width: `${40 + ((i * 7) % 30)}%`, background: 'linear-gradient(90deg, rgba(255,255,255,0.04) 0%, rgba(255,255,255,0.1) 50%, rgba(255,255,255,0.04) 100%)', backgroundSize: '200% 100%', animation: 'shimmer 1.2s linear infinite', borderRadius: 3 }} />
            </div>
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <div style={{ textAlign: 'center', padding: 48, color: 'rgba(255,255,255,0.55)' }}>
          <div style={{ fontSize: 48, marginBottom: 8 }}>📭</div>
          <div style={{ fontSize: 14 }}>{filter ? '未找到匹配的新闻' : '暂无新闻'}</div>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {filtered.map((story, idx) => (
            <article
              key={story.objectID}
              className="app-card"
              onClick={() => openUrl(story.url, story.objectID)}
              style={{
                padding: 14,
                borderRadius: 10,
                background: 'rgba(255,255,255,0.04)',
                border: '1px solid rgba(255,255,255,0.07)',
                cursor: 'pointer',
                transition: 'background 0.15s, transform 0.15s',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = 'rgba(255,255,255,0.075)'
                e.currentTarget.style.transform = 'translateY(-1px)'
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = 'rgba(255,255,255,0.04)'
                e.currentTarget.style.transform = 'translateY(0)'
              }}
            >
              {/* 标题 */}
              <div style={{ fontSize: 15, fontWeight: 600, lineHeight: 1.45, marginBottom: 8, color: '#f7f7ff' }}>
                <span style={{ display: 'inline-block', minWidth: 22, color: 'rgba(255,255,255,0.4)', fontSize: 13, marginRight: 6 }}>{idx + 1}.</span>
                {story.title}
              </div>

              {/* 元信息 */}
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10, alignItems: 'center', fontSize: 12, color: 'rgba(255,255,255,0.55)' }}>
                <span style={{ color: '#ff9a5a' }}>
                  👤 {story.author || 'unknown'}
                </span>
                <span style={{ color: '#a5b4fc' }}>
                  ⏱️ {relativeTime(story.created_at)}
                </span>
                {story.points !== null && story.points !== undefined && (
                  <span style={{ color: '#fbbf24' }}>
                    ⭐ {story.points} 分
                  </span>
                )}
                {story.num_comments !== null && story.num_comments !== undefined && (
                  <span style={{ color: '#60a5fa' }}>
                    💬 {story.num_comments} 评论
                  </span>
                )}
                <span style={{
                  padding: '2px 8px',
                  borderRadius: 10,
                  background: 'rgba(255,255,255,0.05)',
                  border: '1px solid rgba(255,255,255,0.08)',
                  color: 'rgba(255,255,255,0.7)',
                  fontSize: 11,
                }}>
                  🔗 {getHostname(story.url)}
                </span>
                <button
                  onClick={(e) => {
                    e.stopPropagation()
                    openUrl(story.url, story.objectID)
                  }}
                  className="app-button"
                  style={{
                    marginLeft: 'auto',
                    padding: '4px 12px',
                    borderRadius: 14,
                    border: '1px solid rgba(255, 102, 0, 0.4)',
                    background: 'rgba(255, 102, 0, 0.15)',
                    color: '#ffb088',
                    cursor: 'pointer',
                    fontSize: 11,
                  }}
                >
                  打开
                </button>
              </div>
            </article>
          ))}
        </div>
      )}
    </div>
  )
}
