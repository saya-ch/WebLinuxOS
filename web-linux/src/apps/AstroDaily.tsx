import { useState, useEffect, useCallback, useMemo, useRef } from 'react'
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
  thumbnail_url?: string
}

interface CacheItem {
  data: ApodItem
  timestamp: number
}

// ==================== 常量 ====================
const STORAGE_KEY_FAVORITES = 'weblinux-apod-favorites'
const STORAGE_KEY_CACHE = 'weblinux-apod-cache'
const CACHE_DURATION = 24 * 60 * 60 * 1000 // 缓存24小时

// NASA APOD API（DEMO_KEY：每小时 50 次请求限制；如需更高额度请到 api.nasa.gov 申请）
const APOD_ENDPOINT = (date?: string, apiKey = 'DEMO_KEY') => {
  const base = 'https://api.nasa.gov/planetary/apod'
  const params = new URLSearchParams({ api_key: apiKey, thumbs: 'true' })
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

// ==================== 缓存管理 ====================
function getCache(): Record<string, CacheItem> {
  try {
    const raw = localStorage.getItem(STORAGE_KEY_CACHE)
    if (raw) {
      const parsed = JSON.parse(raw)
      if (typeof parsed === 'object' && parsed !== null) {
        return parsed
      }
    }
  } catch {
    // 忽略
  }
  return {}
}

function setCache(date: string, data: ApodItem): void {
  try {
    const cache = getCache()
    cache[date] = { data, timestamp: Date.now() }
    // 清理过期缓存
    const now = Date.now()
    Object.keys(cache).forEach(key => {
      if (now - cache[key].timestamp > CACHE_DURATION) {
        delete cache[key]
      }
    })
    localStorage.setItem(STORAGE_KEY_CACHE, JSON.stringify(cache))
  } catch {
    // 忽略
  }
}

function getCachedItem(date: string): ApodItem | null {
  try {
    const cache = getCache()
    const item = cache[date]
    if (item && Date.now() - item.timestamp < CACHE_DURATION) {
      return item.data
    }
  } catch {
    // 忽略
  }
  return null
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
  const [apiKey, setApiKey] = useState('DEMO_KEY')
  const [showApiKeyInput, setShowApiKeyInput] = useState(false)
  const [copiedDate, setCopiedDate] = useState<string | null>(null)
  const [downloading, setDownloading] = useState(false)
  const favoritesGridRef = useRef<HTMLDivElement>(null)

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

  // 加载自定义API Key
  useEffect(() => {
    try {
      const savedKey = localStorage.getItem('weblinux-apod-apikey')
      if (savedKey) setApiKey(savedKey)
    } catch {
      // 忽略
    }
  }, [])

  // 拉取 APOD 数据（带缓存）
  const fetchApod = useCallback(async (targetDate: string) => {
    setLoading(true)
    setError(null)
    setImageLoaded(false)

    // 先检查缓存
    const cached = getCachedItem(targetDate)
    if (cached) {
      setApod(cached)
      setLoading(false)
      return
    }

    try {
      const res = await fetch(APOD_ENDPOINT(targetDate, apiKey))
      if (!res.ok) {
        if (res.status === 429) {
          throw new Error('API 请求次数超限，请稍后重试或使用自定义 API Key')
        }
        throw new Error(`HTTP ${res.status}`)
      }
      const data = await res.json()
      if (!isValidApodResponse(data)) throw new Error('返回数据格式不正确')
      setApod(data)
      // 缓存结果
      setCache(targetDate, data)
      try {
        localStorage.setItem('weblinux-apod-last-date', targetDate)
      } catch {
        // 忽略
      }
    } catch (err) {
      const msg = err instanceof Error ? err.message : '请求失败'
      setError(`获取失败：${msg}`)
    } finally {
      setLoading(false)
    }
  }, [apiKey])

  useEffect(() => {
    fetchApod(date)
  }, [date, fetchApod])

  // 保存自定义API Key
  const saveApiKey = useCallback((key: string) => {
    setApiKey(key)
    try {
      localStorage.setItem('weblinux-apod-apikey', key)
    } catch {
      // 忽略
    }
    setShowApiKeyInput(false)
    addNotification({
      title: 'NASA 天文每日',
      message: key === 'DEMO_KEY' ? '已重置为默认 API Key' : 'API Key 已保存',
      type: 'success',
      duration: 2000,
    })
  }, [addNotification])

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
      if (next < '1995-06-16') return prev // 不允许查看 APOD 开始前的日期
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

  // 分享功能（复制链接）
  const shareApod = useCallback(async () => {
    if (!apod) return
    const shareUrl = `https://apod.nasa.gov/apod/ap${apod.date.replace(/-/g, '').slice(2)}.html`
    try {
      await navigator.clipboard.writeText(shareUrl)
      setCopiedDate(apod.date)
      setTimeout(() => setCopiedDate(null), 2000)
      addNotification({
        title: 'NASA 天文每日',
        message: '链接已复制到剪贴板',
        type: 'success',
        duration: 2000,
      })
    } catch {
      addNotification({
        title: 'NASA 天文每日',
        message: '复制失败，请手动复制链接',
        type: 'error',
        duration: 3000,
      })
    }
  }, [apod, addNotification])

  // 下载高清图片
  const downloadHdImage = useCallback(async () => {
    if (!apod || apod.media_type !== 'image') return
    const hdUrl = apod.hdurl || apod.url
    if (!hdUrl) return

    setDownloading(true)
    try {
      const response = await fetch(hdUrl)
      const blob = await response.blob()
      const url = URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href = url
      link.download = `nasa-apod-${apod.date}.jpg`
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      URL.revokeObjectURL(url)
      addNotification({
        title: 'NASA 天文每日',
        message: '高清图片下载成功',
        type: 'success',
        duration: 2000,
      })
    } catch {
      // 如果直接下载失败，打开新窗口
      window.open(hdUrl, '_blank')
      addNotification({
        title: 'NASA 天文每日',
        message: '请在打开的新窗口中保存图片',
        type: 'info',
        duration: 3000,
      })
    } finally {
      setDownloading(false)
    }
  }, [apod, addNotification])

  // 删除收藏
  const removeFavorite = useCallback((itemDate: string, e: React.MouseEvent) => {
    e.stopPropagation()
    setFavorites((prev) => {
      const next = prev.filter((f) => f.date !== itemDate)
      try {
        localStorage.setItem(STORAGE_KEY_FAVORITES, JSON.stringify(next))
      } catch {
        // 忽略
      }
      addNotification({
        title: 'NASA 天文每日',
        message: '已从收藏移除',
        type: 'success',
        duration: 2000,
      })
      return next
    })
  }, [addNotification])

  // 随机日期
  const goRandom = useCallback(() => {
    const start = new Date('1995-06-16').getTime()
    const end = new Date().getTime()
    const randomTime = start + Math.random() * (end - start)
    const randomDate = new Date(randomTime).toISOString().slice(0, 10)
    setDate(randomDate)
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
      {/* 星空背景 */}
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
        .astro-card {
          transition: transform 0.2s ease, box-shadow 0.2s ease;
        }
        .astro-card:hover {
          transform: translateY(-2px);
          box-shadow: 0 8px 25px rgba(124, 108, 240, 0.15);
        }
        @keyframes shimmer {
          0% { background-position: -200% 0; }
          100% { background-position: 200% 0; }
        }
        .image-loading {
          background: linear-gradient(90deg, rgba(80,80,120,0.15) 25%, rgba(100,100,140,0.25) 50%, rgba(80,80,120,0.15) 75%);
          background-size: 200% 100%;
          animation: shimmer 1.5s infinite;
        }
      `}</style>
      <div className="astro-daily-bg" />

      <div style={{ position: 'relative', zIndex: 1, padding: 20, maxWidth: 1200, margin: '0 auto' }}>
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
            <div style={{ fontSize: 24, fontWeight: 800, letterSpacing: -0.5, display: 'flex', alignItems: 'center', gap: 8 }}>
              <span style={{ fontSize: 28 }}>🌌</span>
              天文每日
              <span style={{ fontSize: 12, color: '#8888aa', fontWeight: 400, marginLeft: 4, padding: '2px 8px', background: 'rgba(124,108,240,0.2)', borderRadius: 4 }}>
                NASA APOD
              </span>
            </div>
            <div style={{ fontSize: 11, color: '#6666aa', marginTop: 4 }}>
              每天一张来自 NASA 的天文图片 · 支持高清下载与收藏分享
            </div>
          </div>
          <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>
            <button
              onClick={() => setShowFavorites((s) => !s)}
              style={navBtnStyle(showFavorites)}
              title="查看收藏"
            >
              <span style={{ marginRight: 4 }}>⭐</span>
              收藏 {favorites.length > 0 ? `(${favorites.length})` : ''}
            </button>
            <button
              onClick={() => setShowApiKeyInput((s) => !s)}
              style={navBtnStyle(showApiKeyInput)}
              title="设置 API Key"
            >
              ⚙️
            </button>
          </div>
        </div>

        {/* API Key 设置面板 */}
        {showApiKeyInput && (
          <div
            style={{
              background: 'rgba(255,255,255,0.04)',
              border: '1px solid rgba(255,255,255,0.1)',
              borderRadius: 12,
              padding: 16,
              marginBottom: 16,
            }}
          >
            <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 10 }}>🔧 API 设置</div>
            <div style={{ fontSize: 11, color: '#8888aa', marginBottom: 12 }}>
              默认使用 DEMO_KEY（每小时 50 次请求限制）。如需更高额度，请前往{' '}
              <a href="https://api.nasa.gov" target="_blank" rel="noopener noreferrer" style={{ color: '#a29bfe' }}>
                api.nasa.gov
              </a>{' '}
              申请免费 API Key。
            </div>
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
              <input
                type="text"
                placeholder="输入您的 NASA API Key"
                value={apiKey}
                onChange={(e) => setApiKey(e.target.value)}
                style={{
                  flex: 1,
                  minWidth: 200,
                  padding: '8px 12px',
                  background: 'rgba(255,255,255,0.06)',
                  border: '1px solid rgba(255,255,255,0.12)',
                  borderRadius: 6,
                  color: '#e0e0f0',
                  fontSize: 13,
                  fontFamily: 'inherit',
                  outline: 'none',
                }}
              />
              <button onClick={() => saveApiKey(apiKey)} style={navBtnStyle(false)}>
                保存
              </button>
              <button onClick={() => saveApiKey('DEMO_KEY')} style={navBtnStyle(false)}>
                重置
              </button>
            </div>
          </div>
        )}

        {/* 收藏面板 - 瀑布流布局 */}
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
            <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 10 }}>
              我的收藏 <span style={{ color: '#8888aa', fontWeight: 400 }}>({favorites.length})</span>
            </div>
            {favorites.length === 0 ? (
              <div style={{ fontSize: 12, color: '#8888aa', padding: 24, textAlign: 'center' }}>
                <div style={{ fontSize: 48, marginBottom: 12, opacity: 0.5 }}>☆</div>
                还没有收藏。点击图片下方的「收藏」按钮即可添加。
              </div>
            ) : (
              <div
                ref={favoritesGridRef}
                style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))',
                  gap: 12,
                }}
              >
                {favorites.map((f) => (
                  <div
                    key={f.date}
                    className="astro-card"
                    onClick={() => openFavorite(f)}
                    style={{
                      padding: 0,
                      border: '1px solid rgba(255,255,255,0.1)',
                      borderRadius: 10,
                      overflow: 'hidden',
                      background: 'rgba(0,0,0,0.3)',
                      cursor: 'pointer',
                    }}
                  >
                    <div style={{ position: 'relative' }}>
                      {f.media_type === 'image' ? (
                        <img
                          src={f.url}
                          alt={f.title}
                          loading="lazy"
                          style={{
                            width: '100%',
                            aspectRatio: '16 / 9',
                            objectFit: 'cover',
                            display: 'block',
                          }}
                        />
                      ) : (
                        <div
                          style={{
                            width: '100%',
                            aspectRatio: '16 / 9',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            background: 'rgba(80,80,120,0.2)',
                            fontSize: 32,
                          }}
                        >
                          ▶️
                        </div>
                      )}
                      {/* 删除按钮 */}
                      <button
                        onClick={(e) => removeFavorite(f.date, e)}
                        style={{
                          position: 'absolute',
                          top: 6,
                          right: 6,
                          width: 24,
                          height: 24,
                          padding: 0,
                          background: 'rgba(0,0,0,0.6)',
                          border: 'none',
                          borderRadius: '50%',
                          color: '#ff6b6b',
                          fontSize: 12,
                          cursor: 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          opacity: 0.8,
                        }}
                        title="移除收藏"
                      >
                        ✕
                      </button>
                    </div>
                    <div style={{ padding: 10 }}>
                      <div style={{ fontSize: 12, fontWeight: 600, color: '#e0e0f0', marginBottom: 4, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {f.title}
                      </div>
                      <div style={{ fontSize: 10, color: '#8888aa' }}>{f.date}</div>
                    </div>
                  </div>
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
          <button onClick={goRandom} style={navBtnStyle(false)}>
            🎲 随机
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
              NASA APOD 公开接口使用 DEMO_KEY 时每小时有 50 次请求限制。可使用设置面板配置自定义 API Key。
            </div>
          </div>
        )}

        {loading ? (
          <div style={{ textAlign: 'center', padding: 80, color: '#8888aa', fontSize: 14 }}>
            <div style={{ fontSize: 48, marginBottom: 12 }}>🌌</div>
            正在从 NASA 获取今日星象…
          </div>
        ) : apod ? (
          <article
            className="astro-card"
            style={{
              background: 'rgba(255,255,255,0.04)',
              border: '1px solid rgba(255,255,255,0.1)',
              borderRadius: 16,
              overflow: 'hidden',
            }}
          >
            {/* 媒体区域 */}
            {apod.media_type === 'image' ? (
              <div style={{ position: 'relative', background: '#000' }}>
                {!imageLoaded && (
                  <div
                    className="image-loading"
                    style={{
                      width: '100%',
                      aspectRatio: '16 / 9',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
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
                    cursor: 'pointer',
                  }}
                  onClick={() => window.open(apod.hdurl || apod.url, '_blank')}
                  title="点击查看大图"
                />
                {/* 图片操作悬浮层 */}
                <div
                  style={{
                    position: 'absolute',
                    bottom: 12,
                    right: 12,
                    display: 'flex',
                    gap: 8,
                  }}
                >
                  {apod.hdurl && (
                    <button
                      onClick={downloadHdImage}
                      disabled={downloading}
                      style={{
                        padding: '8px 14px',
                        background: 'rgba(0,0,0,0.7)',
                        backdropFilter: 'blur(8px)',
                        border: '1px solid rgba(255,255,255,0.2)',
                        borderRadius: 8,
                        color: '#fff',
                        fontSize: 12,
                        cursor: downloading ? 'wait' : 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        gap: 4,
                      }}
                      title="下载高清图片"
                    >
                      {downloading ? '⏳' : '⬇️'} {downloading ? '下载中...' : '下载高清'}
                    </button>
                  )}
                </div>
              </div>
            ) : apod.media_type === 'video' ? (
              <div
                style={{
                  position: 'relative',
                  paddingBottom: '56.25%',
                  background: '#000',
                }}
              >
                <iframe
                  src={apod.url}
                  title={apod.title}
                  allow="encrypted-media; picture-in-picture"
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
                  color: '#8888aa',
                }}
              >
                暂不支持的媒体类型
              </div>
            )}

            {/* 内容区域 */}
            <div style={{ padding: 20 }}>
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
              </div>

              {/* 操作按钮栏 */}
              <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 16 }}>
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
                    display: 'flex',
                    alignItems: 'center',
                    gap: 4,
                  }}
                  title={isFavorited ? '取消收藏' : '收藏'}
                >
                  {isFavorited ? '★ 已收藏' : '☆ 收藏'}
                </button>
                <button
                  onClick={shareApod}
                  style={{
                    background: 'rgba(255,255,255,0.06)',
                    border: '1px solid rgba(255,255,255,0.12)',
                    borderRadius: 8,
                    padding: '8px 14px',
                    cursor: 'pointer',
                    color: '#aaaacc',
                    fontSize: 13,
                    whiteSpace: 'nowrap',
                    fontFamily: 'inherit',
                    display: 'flex',
                    alignItems: 'center',
                    gap: 4,
                  }}
                  title="分享链接"
                >
                  {copiedDate === apod.date ? '✓ 已复制' : '📋 分享'}
                </button>
                {apod.media_type === 'image' && apod.hdurl && (
                  <a
                    href={apod.hdurl}
                    target="_blank"
                    rel="noopener noreferrer"
                    style={{
                      background: 'rgba(255,255,255,0.06)',
                      border: '1px solid rgba(255,255,255,0.12)',
                      borderRadius: 8,
                      padding: '8px 14px',
                      cursor: 'pointer',
                      color: '#aaaacc',
                      fontSize: 13,
                      whiteSpace: 'nowrap',
                      fontFamily: 'inherit',
                      textDecoration: 'none',
                      display: 'flex',
                      alignItems: 'center',
                      gap: 4,
                    }}
                    title="在新窗口打开高清图片"
                  >
                    🔗 打开原图
                  </a>
                )}
              </div>

              {/* 说明 */}
              <div
                style={{
                  fontSize: 14,
                  lineHeight: 1.8,
                  color: '#c0c0d0',
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
            </div>
          </article>
        ) : null}

        {/* 页脚提示 */}
        <div
          style={{
            textAlign: 'center',
            padding: '20px 0',
            fontSize: 11,
            color: '#5555aa',
          }}
        >
          NASA APOD 自 1995 年 6 月 16 日起每日更新 · 数据缓存 24 小时
        </div>
      </div>
    </div>
  )
}

function navBtnStyle(active: boolean): React.CSSProperties {
  return {
    padding: '6px 12px',
    background: active ? 'rgba(124,108,240,0.25)' : 'rgba(255,255,255,0.06)',
    border: '1px solid ' + (active ? 'rgba(124,108,240,0.6)' : 'rgba(255,255,255,0.12)'),
    borderRadius: 8,
    color: active ? '#c5bfff' : '#aaaacc',
    cursor: 'pointer',
    fontSize: 12,
    fontFamily: 'inherit',
    whiteSpace: 'nowrap',
  }
}

export default AstroDaily