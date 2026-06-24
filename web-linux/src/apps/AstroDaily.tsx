import { useState, useEffect, useCallback, useMemo } from 'react'
import { useStore } from '../store'

// ==================== 类型定义 ====================
interface ApodItem {
  date: string
  title: string
  explanation: string
  url: string
  hdurl?: string
  media_type: 'image' | 'video' | 'other'
  copyright?: string
  service_version?: string
}

// ==================== 常量 ====================
const STORAGE_KEY_FAVORITES = 'weblinux-apod-favorites'
const STORAGE_KEY_LAST_DATE = 'weblinux-apod-last-date'

// NASA APOD 公开 API（DEMO_KEY：每小时 50 次请求限制；如需更高额度请到 api.nasa.gov 申请）
const APOD_ENDPOINT = (date?: string) => {
  const base = 'https://api.nasa.gov/planetary/apod'
  const params = new URLSearchParams({ api_key: 'DEMO_KEY', thumbs: 'true' })
  if (date) params.set('date', date)
  return `${base}?${params.toString()}`
}

function formatDateZh(dateStr: string): string {
  const d = new Date(dateStr + 'T00:00:00Z')
  if (isNaN(d.getTime())) return dateStr
  const weekdays = ['周日', '周一', '周二', '周三', '周四', '周五', '周六']
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')} ${weekdays[d.getUTCDay()]}`
}

function isValidApodResponse(data: unknown): data is ApodItem {
  if (!data || typeof data !== 'object') return false
  const d = data as Record<string, unknown>
  return typeof d.date === 'string' && typeof d.title === 'string'
}

// ==================== 主组件 ====================
const AstroDaily = () => {
  const [apod, setApod] = useState<ApodItem | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [date, setDate] = useState<string>(() => new Date().toISOString().slice(0, 10))
  const [favorites, setFavorites] = useState<ApodItem[]>([])
  const [showFavorites, setShowFavorites] = useState(false)
  const [imageLoaded, setImageLoaded] = useState(false)

  const addNotification = useStore((s) => s.addNotification)

  // 加载收藏
  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY_FAVORITES)
      if (raw) {
        const parsed = JSON.parse(raw)
        if (Array.isArray(parsed)) setFavorites(parsed)
      }
    } catch {
      // 忽略
    }
  }, [])

  // 拉取 APOD 数据
  const fetchApod = useCallback(async (targetDate: string) => {
    setLoading(true)
    setError(null)
    setImageLoaded(false)
    try {
      const res = await fetch(APOD_ENDPOINT(targetDate))
      if (!res.ok) throw new Error(`HTTP ${res.status}`)
      const data = await res.json()
      if (!isValidApodResponse(data)) throw new Error('返回数据格式不正确')
      setApod(data)
      try {
        localStorage.setItem(STORAGE_KEY_LAST_DATE, targetDate)
      } catch {
        // 忽略
      }
    } catch (err) {
      const msg = err instanceof Error ? err.message : '请求失败'
      setError(`获取失败：${msg}`)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchApod(date)
  }, [date, fetchApod])

  // 跳转到当天
  const goToday = useCallback(() => {
    setDate(new Date().toISOString().slice(0, 10))
  }, [])

  // 切换到前一天/后一天
  const shiftDate = useCallback((offset: number) => {
    setDate((prev) => {
      const d = new Date(prev + 'T00:00:00Z')
      d.setUTCDate(d.getUTCDate() + offset)
      const now = new Date()
      const todayStr = now.toISOString().slice(0, 10)
      const next = d.toISOString().slice(0, 10)
      if (next > todayStr) return prev // 不允许查看未来
      return next
    })
  }, [])

  // 收藏 / 取消收藏
  const toggleFavorite = useCallback(() => {
    if (!apod) return
    setFavorites((prev) => {
      const exists = prev.some((f) => f.date === apod.date)
      const next = exists ? prev.filter((f) => f.date !== apod.date) : [apod, ...prev]
      try {
        localStorage.setItem(STORAGE_KEY_FAVORITES, JSON.stringify(next))
      } catch {
        // 忽略
      }
      addNotification({
        title: 'NASA 天文每日',
        message: exists ? `已从收藏移除：${apod.date}` : `已收藏：${apod.date}`,
        type: 'success',
        duration: 2000,
      })
      return next
    })
  }, [apod, addNotification])

  // 是否已收藏
  const isFavorited = useMemo(
    () => (apod ? favorites.some((f) => f.date === apod.date) : false),
    [apod, favorites]
  )

  // 切换显示某天的收藏项
  const openFavorite = useCallback((item: ApodItem) => {
    setShowFavorites(false)
    setDate(item.date)
  }, [])

  return (
    <div
      style={{
        height: '100%',
        background: 'radial-gradient(ellipse at top, #1a1a3e 0%, #0a0a1e 50%, #050510 100%)',
        color: '#e0e0f0',
        overflow: 'auto',
        position: 'relative',
      }}
    >
      <style>{`
        .astro-daily-bg {
          position: fixed;
          inset: 0;
          pointer-events: none;
          background-image:
            radial-gradient(1px 1px at 20% 30%, white, transparent),
            radial-gradient(1px 1px at 40% 70%, white, transparent),
            radial-gradient(1px 1px at 60% 20%, white, transparent),
            radial-gradient(1px 1px at 80% 50%, white, transparent),
            radial-gradient(1px 1px at 10% 80%, white, transparent),
            radial-gradient(1.5px 1.5px at 30% 10%, white, transparent),
            radial-gradient(1px 1px at 70% 80%, white, transparent),
            radial-gradient(1.5px 1.5px at 90% 30%, white, transparent);
          opacity: 0.5;
          z-index: 0;
        }
      `}</style>
      <div className="astro-daily-bg" />

      <div style={{ position: 'relative', zIndex: 1, padding: 20, maxWidth: 1100, margin: '0 auto' }}>
        {/* 顶部栏 */}
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: 20,
            flexWrap: 'wrap',
            gap: 12,
          }}
        >
          <div>
            <div style={{ fontSize: 22, fontWeight: 800, letterSpacing: -0.5 }}>
              天文每日
              <span style={{ fontSize: 13, color: '#8888aa', fontWeight: 400, marginLeft: 8 }}>
                NASA APOD
              </span>
            </div>
            <div style={{ fontSize: 11, color: '#6666aa', marginTop: 4 }}>
              每天一张来自 NASA 的天文图片
            </div>
          </div>
          <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>
            <button
              onClick={() => setShowFavorites((s) => !s)}
              style={navBtnStyle(showFavorites)}
              title="查看收藏"
            >
              收藏 {favorites.length > 0 ? `(${favorites.length})` : ''}
            </button>
          </div>
        </div>

        {/* 收藏面板 */}
        {showFavorites && (
          <div
            style={{
              background: 'rgba(255,255,255,0.04)',
              border: '1px solid rgba(255,255,255,0.1)',
              borderRadius: 12,
              padding: 16,
              marginBottom: 16,
            }}
          >
            <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 10 }}>我的收藏</div>
            {favorites.length === 0 ? (
              <div style={{ fontSize: 12, color: '#8888aa', padding: 16, textAlign: 'center' }}>
                还没有收藏。点击图片右上角的星标即可收藏。
              </div>
            ) : (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(140px, 1fr))', gap: 10 }}>
                {favorites.map((f) => (
                  <button
                    key={f.date}
                    onClick={() => openFavorite(f)}
                    style={{
                      padding: 0,
                      border: '1px solid rgba(255,255,255,0.1)',
                      borderRadius: 8,
                      overflow: 'hidden',
                      background: 'rgba(0,0,0,0.3)',
                      cursor: 'pointer',
                      textAlign: 'left',
                    }}
                  >
                    {f.media_type === 'image' ? (
                      <img
                        src={f.url}
                        alt={f.title}
                        loading="lazy"
                        style={{ width: '100%', aspectRatio: '1 / 1', objectFit: 'cover', display: 'block' }}
                      />
                    ) : (
                      <div
                        style={{
                          width: '100%',
                          aspectRatio: '1 / 1',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          background: 'rgba(80,80,120,0.2)',
                          fontSize: 24,
                        }}
                      >
                        ▶
                      </div>
                    )}
                    <div style={{ padding: 6, fontSize: 10, color: '#aaaacc' }}>{f.date}</div>
                  </button>
                ))}
              </div>
            )}
          </div>
        )}

        {/* 日期导航 */}
        <div
          style={{
            display: 'flex',
            gap: 8,
            alignItems: 'center',
            marginBottom: 16,
            flexWrap: 'wrap',
          }}
        >
          <button onClick={() => shiftDate(-1)} style={navBtnStyle(false)}>
            ← 前一天
          </button>
          <input
            type="date"
            value={date}
            max={new Date().toISOString().slice(0, 10)}
            min="1995-06-16"
            onChange={(e) => e.target.value && setDate(e.target.value)}
            style={{
              padding: '6px 10px',
              background: 'rgba(255,255,255,0.06)',
              border: '1px solid rgba(255,255,255,0.12)',
              borderRadius: 6,
              color: '#e0e0f0',
              fontSize: 13,
              fontFamily: 'inherit',
              outline: 'none',
              colorScheme: 'dark',
            }}
          />
          <button onClick={goToday} style={navBtnStyle(false)}>
            今天
          </button>
          <button onClick={() => shiftDate(1)} style={navBtnStyle(false)}>
            后一天 →
          </button>
        </div>

        {error && (
          <div
            style={{
              background: 'rgba(239,68,68,0.1)',
              border: '1px solid rgba(239,68,68,0.3)',
              padding: 16,
              borderRadius: 8,
              fontSize: 13,
              color: '#fca5a5',
              marginBottom: 16,
            }}
          >
            ⚠ {error}
            <div style={{ fontSize: 11, marginTop: 6, opacity: 0.8 }}>
              NASA APOD 公开接口使用 DEMO_KEY 时每小时有 50 次请求限制。
            </div>
          </div>
        )}

        {loading ? (
          <div style={{ textAlign: 'center', padding: 80, color: '#8888aa', fontSize: 14 }}>
            <div style={{ fontSize: 36, marginBottom: 12 }}>◌</div>
            正在从 NASA 获取今日星象…
          </div>
        ) : apod ? (
          <article
            style={{
              background: 'rgba(255,255,255,0.04)',
              border: '1px solid rgba(255,255,255,0.1)',
              borderRadius: 12,
              padding: 20,
            }}
          >
            {/* 标题与日期 */}
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'flex-start',
                marginBottom: 16,
                gap: 12,
                flexWrap: 'wrap',
              }}
            >
              <div style={{ flex: 1, minWidth: 200 }}>
                <div style={{ fontSize: 11, color: '#8888aa', marginBottom: 4 }}>
                  {formatDateZh(apod.date)}
                </div>
                <h1
                  style={{
                    fontSize: 22,
                    fontWeight: 700,
                    margin: 0,
                    lineHeight: 1.3,
                    color: '#f0f0ff',
                  }}
                >
                  {apod.title}
                </h1>
                {apod.copyright && (
                  <div style={{ fontSize: 11, color: '#9999bb', marginTop: 6 }}>
                    © {apod.copyright.replace(/\n/g, ' · ')}
                  </div>
                )}
              </div>
              <button
                onClick={toggleFavorite}
                style={{
                  background: isFavorited ? 'rgba(250,204,21,0.15)' : 'rgba(255,255,255,0.06)',
                  border: '1px solid ' + (isFavorited ? 'rgba(250,204,21,0.5)' : 'rgba(255,255,255,0.12)'),
                  borderRadius: 8,
                  padding: '8px 14px',
                  cursor: 'pointer',
                  color: isFavorited ? '#facc15' : '#aaaacc',
                  fontSize: 13,
                  whiteSpace: 'nowrap',
                  fontFamily: 'inherit',
                }}
                title={isFavorited ? '取消收藏' : '收藏'}
              >
                {isFavorited ? '★ 已收藏' : '☆ 收藏'}
              </button>
            </div>

            {/* 媒体 */}
            {apod.media_type === 'image' ? (
              <a
                href={apod.hdurl || apod.url}
                target="_blank"
                rel="noopener noreferrer"
                style={{ display: 'block', position: 'relative', borderRadius: 8, overflow: 'hidden' }}
              >
                {!imageLoaded && (
                  <div
                    style={{
                      width: '100%',
                      aspectRatio: '16 / 9',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      background: 'rgba(80,80,120,0.15)',
                      color: '#8888aa',
                      fontSize: 12,
                    }}
                  >
                    加载图片中…
                  </div>
                )}
                <img
                  src={apod.url}
                  alt={apod.title}
                  onLoad={() => setImageLoaded(true)}
                  style={{
                    width: '100%',
                    height: 'auto',
                    display: imageLoaded ? 'block' : 'none',
                    maxHeight: '70vh',
                    objectFit: 'contain',
                    background: '#000',
                  }}
                />
              </a>
            ) : apod.media_type === 'video' ? (
              <div
                style={{
                  position: 'relative',
                  paddingBottom: '56.25%',
                  background: '#000',
                  borderRadius: 8,
                  overflow: 'hidden',
                }}
              >
                <iframe
                  src={apod.url}
                  title={apod.title}
                  allow="encrypted-media"
                  allowFullScreen
                  style={{
                    position: 'absolute',
                    inset: 0,
                    width: '100%',
                    height: '100%',
                    border: 'none',
                  }}
                />
              </div>
            ) : (
              <div
                style={{
                  padding: 40,
                  textAlign: 'center',
                  background: 'rgba(80,80,120,0.1)',
                  borderRadius: 8,
                  color: '#8888aa',
                }}
              >
                暂不支持的媒体类型
              </div>
            )}

            {/* 说明 */}
            <div
              style={{
                fontSize: 14,
                lineHeight: 1.7,
                color: '#c0c0d0',
                marginTop: 18,
                whiteSpace: 'pre-wrap',
              }}
            >
              {apod.explanation}
            </div>

            {/* 底部链接 */}
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                marginTop: 20,
                paddingTop: 14,
                borderTop: '1px solid rgba(255,255,255,0.08)',
                fontSize: 11,
                color: '#6666aa',
                flexWrap: 'wrap',
                gap: 8,
              }}
            >
              <span>数据来源：NASA Astronomy Picture of the Day</span>
              <a
                href={`https://apod.nasa.gov/apod/ap${apod.date.replace(/-/g, '').slice(2)}.html`}
                target="_blank"
                rel="noopener noreferrer"
                style={{ color: '#a29bfe', textDecoration: 'none' }}
              >
                在 NASA 官网查看 ↗
              </a>
            </div>
          </article>
        ) : null}
      </div>
    </div>
  )
}

function navBtnStyle(active: boolean): React.CSSProperties {
  return {
    padding: '6px 12px',
    background: active ? 'rgba(124,108,240,0.25)' : 'rgba(255,255,255,0.06)',
    border: '1px solid ' + (active ? 'rgba(124,108,240,0.6)' : 'rgba(255,255,255,0.12)'),
    borderRadius: 6,
    color: active ? '#c5bfff' : '#aaaacc',
    cursor: 'pointer',
    fontSize: 12,
    fontFamily: 'inherit',
  }
}

export default AstroDaily
