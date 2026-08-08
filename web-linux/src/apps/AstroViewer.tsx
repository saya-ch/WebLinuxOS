import { useState, useEffect, useCallback } from 'react'
import { ChevronLeft, ChevronRight, Heart, Download, Calendar, ExternalLink, Share2, Star, Sparkles, Loader2 } from 'lucide-react'

interface ApodItem {
  date: string
  title: string
  explanation: string
  url: string
  hdurl?: string
  media_type: string
  copyright?: string
  thumbnail_url?: string
}

const STORAGE_KEY_FAVORITES = 'weblinux-astrov-favorites'
const STORAGE_KEY_CACHE = 'weblinux-astrov-cache'

export default function AstroViewer() {
  const [apod, setApod] = useState<ApodItem | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [date, setDate] = useState<string>(() => new Date().toISOString().slice(0, 10))
  const [favorites, setFavorites] = useState<ApodItem[]>([])
  const [showFavorites, setShowFavorites] = useState(false)
  const [showDetails, setShowDetails] = useState(true)
  const [imageLoaded, setImageLoaded] = useState(false)
  const [downloading, setDownloading] = useState(false)
  const [shareCopied, setShareCopied] = useState(false)

  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY_FAVORITES)
      if (raw) setFavorites(JSON.parse(raw))
    } catch { /* ignore */ }
  }, [])

  const fetchApod = useCallback(async (targetDate: string) => {
    setLoading(true)
    setError(null)
    setImageLoaded(false)

    try {
      const cacheRaw = localStorage.getItem(STORAGE_KEY_CACHE)
      const cache = cacheRaw ? JSON.parse(cacheRaw) : {}
      if (cache[targetDate] && Date.now() - cache[targetDate].timestamp < 86400000) {
        setApod(cache[targetDate].data)
        setLoading(false)
        return
      }

      const res = await fetch(`https://api.nasa.gov/planetary/apod?api_key=DEMO_KEY&date=${targetDate}`)
      if (!res.ok) throw new Error(`请求失败 (${res.status})`)
      const data = await res.json()
      setApod(data)

      cache[targetDate] = { data, timestamp: Date.now() }
      localStorage.setItem(STORAGE_KEY_CACHE, JSON.stringify(cache))
    } catch (err) {
      const msg = err instanceof Error ? err.message : '未知错误'
      setError(`获取失败：${msg}`)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { fetchApod(date) }, [date, fetchApod])

  const shiftDate = (offset: number) => {
    const d = new Date(date + 'T00:00:00Z')
    d.setUTCDate(d.getUTCDate() + offset)
    const today = new Date().toISOString().slice(0, 10)
    const next = d.toISOString().slice(0, 10)
    if (next > today || next < '1995-06-16') return
    setDate(next)
  }

  const goToday = () => setDate(new Date().toISOString().slice(0, 10))

  const goRandom = () => {
    const start = new Date('1995-06-16').getTime()
    const end = new Date().getTime()
    const randomTime = start + Math.random() * (end - start)
    setDate(new Date(randomTime).toISOString().slice(0, 10))
  }

  const toggleFavorite = () => {
    if (!apod) return
    const exists = favorites.some(f => f.date === apod.date)
    const next = exists ? favorites.filter(f => f.date !== apod.date) : [apod, ...favorites]
    setFavorites(next)
    localStorage.setItem(STORAGE_KEY_FAVORITES, JSON.stringify(next))
  }

  const removeFavorite = (itemDate: string, e: React.MouseEvent) => {
    e.stopPropagation()
    const next = favorites.filter(f => f.date !== itemDate)
    setFavorites(next)
    localStorage.setItem(STORAGE_KEY_FAVORITES, JSON.stringify(next))
  }

  const openFavorite = (item: ApodItem) => {
    setShowFavorites(false)
    setDate(item.date)
  }

  const downloadImage = async () => {
    if (!apod || apod.media_type !== 'image') return
    const hdUrl = apod.hdurl || apod.url
    setDownloading(true)
    try {
      const res = await fetch(hdUrl)
      const blob = await res.blob()
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `nasa-apod-${apod.date}.jpg`
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      URL.revokeObjectURL(url)
    } catch {
      window.open(hdUrl, '_blank')
    } finally {
      setDownloading(false)
    }
  }

  const shareApod = async () => {
    if (!apod) return
    const shareUrl = `https://apod.nasa.gov/apod/ap${apod.date.replace(/-/g, '').slice(2)}.html`
    try {
      await navigator.clipboard.writeText(shareUrl)
      setShareCopied(true)
      setTimeout(() => setShareCopied(false), 2000)
    } catch { /* ignore */ }
  }

  const isFav = apod ? favorites.some(f => f.date === apod.date) : false

  const formatDate = (d: string) => {
    const dateObj = new Date(d + 'T00:00:00Z')
    const weekdays = ['周日', '周一', '周二', '周三', '周四', '周五', '周六']
    return `${dateObj.getFullYear()}年${dateObj.getMonth() + 1}月${dateObj.getDate()}日 ${weekdays[dateObj.getUTCDay()]}`
  }

  return (
    <div style={{
      height: '100%',
      background: 'radial-gradient(ellipse at top, #1a1a3e 0%, #0a0a1e 50%, #050510 100%)',
      color: '#e0e0f0',
      overflow: 'auto',
      fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
      position: 'relative',
    }}>
      <style>{`
        .av-starfield {
          position: fixed; inset: 0; pointer-events: none; z-index: 0;
          background-image:
            radial-gradient(1px 1px at 20% 30%, white, transparent),
            radial-gradient(1px 1px at 40% 70%, white, transparent),
            radial-gradient(1px 1px at 60% 20%, white, transparent),
            radial-gradient(1px 1px at 80% 50%, white, transparent),
            radial-gradient(1px 1px at 10% 80%, white, transparent),
            radial-gradient(1.5px 1.5px at 30% 10%, white, transparent),
            radial-gradient(1px 1px at 70% 80%, white, transparent),
            radial-gradient(1.5px 1.5px at 90% 30%, white, transparent);
          opacity: 0.6;
        }
        @keyframes avShimmer { 0% { background-position: -200% 0; } 100% { background-position: 200% 0; } }
        .av-shimmer {
          background: linear-gradient(90deg, rgba(80,80,120,0.15) 25%, rgba(100,100,140,0.25) 50%, rgba(80,80,120,0.15) 75%);
          background-size: 200% 100%;
          animation: avShimmer 1.5s infinite;
        }
        @keyframes avFadeIn { from { opacity: 0; transform: translateY(12px); } to { opacity: 1; transform: translateY(0); } }
        .av-fade { animation: avFadeIn 0.5s ease-out; }
        .av-card { transition: transform 0.2s ease, box-shadow 0.2s ease; }
        .av-card:hover { transform: translateY(-2px); box-shadow: 0 8px 25px rgba(124,108,240,0.15); }
        .av-btn { transition: all 0.25s ease; }
        .av-btn:hover { transform: translateY(-1px); }
        @keyframes avSpin { to { transform: rotate(360deg); } }
        .av-spin { animation: avSpin 1s linear infinite; }
        @keyframes avHeartBeat { 0%, 100% { transform: scale(1); } 50% { transform: scale(1.15); } }
        .av-heartbeat { animation: avHeartBeat 0.4s ease; }
      `}</style>
      <div className="av-starfield" />

      <div style={{ position: 'relative', zIndex: 1, padding: 20, maxWidth: 1100, margin: '0 auto' }}>
        {/* 头部 */}
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: 16,
          flexWrap: 'wrap',
          gap: 12,
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <div style={{
              width: 44, height: 44, borderRadius: 14,
              background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              boxShadow: '0 4px 20px rgba(102,126,234,0.4)',
            }}>
              <Sparkles size={22} color="white" />
            </div>
            <div>
              <div style={{ fontSize: 22, fontWeight: 700 }}>天文每日</div>
              <div style={{ fontSize: 12, color: '#8888aa' }}>NASA Astronomy Picture of the Day</div>
            </div>
          </div>
          <button
            onClick={() => setShowFavorites(!showFavorites)}
            className="av-btn"
            style={{
              padding: '8px 16px',
              borderRadius: 10,
              border: '1px solid rgba(255,255,255,0.12)',
              background: showFavorites ? 'rgba(124,108,240,0.25)' : 'rgba(255,255,255,0.06)',
              color: showFavorites ? '#c5bfff' : '#aaaacc',
              cursor: 'pointer',
              fontSize: 13,
              display: 'flex',
              alignItems: 'center',
              gap: 6,
              fontFamily: 'inherit',
              backdropFilter: 'blur(10px)',
            }}
          >
            <Star size={16} fill={showFavorites ? '#c5bfff' : 'none'} />
            收藏 {favorites.length > 0 ? `(${favorites.length})` : ''}
          </button>
        </div>

        {/* 收藏面板 */}
        {showFavorites && (
          <div style={{
            background: 'rgba(255,255,255,0.04)',
            backdropFilter: 'blur(20px)',
            border: '1px solid rgba(255,255,255,0.1)',
            borderRadius: 16,
            padding: 20,
            marginBottom: 16,
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 16 }}>
              <Heart size={18} style={{ color: '#f87171' }} />
              <span style={{ fontSize: 15, fontWeight: 600 }}>我的收藏</span>
              <span style={{ color: '#6666aa', fontSize: 12 }}>({favorites.length})</span>
            </div>
            {favorites.length === 0 ? (
              <div style={{ textAlign: 'center', padding: 32, color: '#6666aa' }}>
                <Star size={40} style={{ opacity: 0.3, margin: '0 auto 12px', display: 'block' }} />
                <div>还没有收藏任何图片</div>
                <div style={{ fontSize: 12, marginTop: 6 }}>点击图片下方的收藏按钮即可添加</div>
              </div>
            ) : (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))', gap: 12 }}>
                {favorites.map(f => (
                  <div
                    key={f.date}
                    className="av-card"
                    onClick={() => openFavorite(f)}
                    style={{
                      padding: 0,
                      border: '1px solid rgba(255,255,255,0.1)',
                      borderRadius: 12,
                      overflow: 'hidden',
                      background: 'rgba(0,0,0,0.3)',
                      cursor: 'pointer',
                      position: 'relative',
                    }}
                  >
                    {f.media_type === 'image' ? (
                      <img src={f.url} alt={f.title} loading="lazy" style={{ width: '100%', aspectRatio: '16/9', objectFit: 'cover', display: 'block' }} />
                    ) : (
                      <div style={{ width: '100%', aspectRatio: '16/9', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(80,80,120,0.2)', fontSize: 32 }}>▶️</div>
                    )}
                    <button
                      onClick={(e) => removeFavorite(f.date, e)}
                      style={{
                        position: 'absolute', top: 6, right: 6, width: 24, height: 24, padding: 0,
                        background: 'rgba(0,0,0,0.6)', border: 'none', borderRadius: '50%',
                        color: '#f87171', fontSize: 12, cursor: 'pointer', display: 'flex',
                        alignItems: 'center', justifyContent: 'center',
                      }}
                    >✕</button>
                    <div style={{ padding: 10 }}>
                      <div style={{ fontSize: 12, fontWeight: 600, color: '#e0e0f0', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{f.title}</div>
                      <div style={{ fontSize: 10, color: '#8888aa' }}>{f.date}</div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* 日期导航 */}
        <div style={{
          display: 'flex', gap: 8, alignItems: 'center', marginBottom: 16, flexWrap: 'wrap',
          background: 'rgba(255,255,255,0.04)', backdropFilter: 'blur(20px)',
          border: '1px solid rgba(255,255,255,0.1)', borderRadius: 12, padding: 10,
        }}>
          <button onClick={() => shiftDate(-1)} className="av-btn" style={navBtn}>
            <ChevronLeft size={16} /> 前一天
          </button>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '4px 10px', background: 'rgba(255,255,255,0.06)', borderRadius: 8, border: '1px solid rgba(255,255,255,0.1)' }}>
            <Calendar size={14} style={{ color: '#8888aa' }} />
            <input
              type="date"
              value={date}
              max={new Date().toISOString().slice(0, 10)}
              min="1995-06-16"
              onChange={(e) => e.target.value && setDate(e.target.value)}
              style={{
                background: 'transparent', border: 'none', color: '#e0e0f0', fontSize: 13,
                fontFamily: 'inherit', outline: 'none', colorScheme: 'dark',
              }}
            />
          </div>
          <button onClick={goToday} className="av-btn" style={navBtn}>今天</button>
          <button onClick={() => shiftDate(1)} className="av-btn" style={navBtn}>
            后一天 <ChevronRight size={16} />
          </button>
          <button onClick={goRandom} className="av-btn" style={{ ...navBtn, background: 'rgba(124,108,240,0.2)', border: '1px solid rgba(124,108,240,0.4)' }}>
            🎲 随机
          </button>
        </div>

        {error && (
          <div style={{
            background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.3)',
            padding: 14, borderRadius: 10, fontSize: 13, color: '#fca5a5', marginBottom: 16,
          }}>
            ⚠ {error}
            <div style={{ fontSize: 11, marginTop: 4, opacity: 0.8 }}>NASA APOD 公开接口每小时限 50 次请求</div>
          </div>
        )}

        {/* 主内容 */}
        {loading ? (
          <div style={{
            textAlign: 'center', padding: 80, color: '#8888aa', fontSize: 14,
            background: 'rgba(255,255,255,0.04)', borderRadius: 16, border: '1px solid rgba(255,255,255,0.1)',
          }}>
            <Loader2 size={40} className="av-spin" style={{ margin: '0 auto 12px', display: 'block' }} />
            正在从 NASA 获取今日星象...
          </div>
        ) : apod ? (
          <article className="av-fade" style={{
            background: 'rgba(255,255,255,0.04)',
            backdropFilter: 'blur(20px)',
            border: '1px solid rgba(255,255,255,0.1)',
            borderRadius: 20,
            overflow: 'hidden',
          }}>
            {/* 媒体区域 */}
            {apod.media_type === 'image' ? (
              <div style={{ position: 'relative', background: '#000', maxHeight: '60vh', overflow: 'hidden' }}>
                {!imageLoaded && (
                  <div className="av-shimmer" style={{ width: '100%', aspectRatio: '16/9', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#8888aa', fontSize: 12 }}>加载图片中...</div>
                )}
                <img
                  src={apod.url}
                  alt={apod.title}
                  onLoad={() => setImageLoaded(true)}
                  style={{ width: '100%', height: 'auto', display: imageLoaded ? 'block' : 'none', maxHeight: '60vh', objectFit: 'contain', cursor: 'zoom-in' }}
                  onClick={() => window.open(apod.hdurl || apod.url, '_blank')}
                />
                {imageLoaded && apod.hdurl && (
                  <div style={{ position: 'absolute', bottom: 12, right: 12, display: 'flex', gap: 8 }}>
                    <button onClick={downloadImage} disabled={downloading} className="av-btn" style={{
                      padding: '8px 14px', background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(8px)',
                      border: '1px solid rgba(255,255,255,0.2)', borderRadius: 8, color: '#fff', fontSize: 12,
                      cursor: downloading ? 'wait' : 'pointer', display: 'flex', alignItems: 'center', gap: 4,
                      fontFamily: 'inherit',
                    }}>
                      <Download size={14} /> {downloading ? '下载中...' : '下载高清'}
                    </button>
                  </div>
                )}
              </div>
            ) : apod.media_type === 'video' ? (
              <div style={{ position: 'relative', paddingBottom: '56.25%', background: '#000' }}>
                <iframe src={apod.url} title={apod.title} allow="encrypted-media; picture-in-picture" allowFullScreen style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', border: 'none' }} />
              </div>
            ) : (
              <div style={{ padding: 40, textAlign: 'center', background: 'rgba(80,80,120,0.1)', color: '#8888aa' }}>暂不支持的媒体类型</div>
            )}

            {/* 信息区域 */}
            <div style={{ padding: 20 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12, gap: 12, flexWrap: 'wrap' }}>
                <div style={{ flex: 1, minWidth: 200 }}>
                  <div style={{ fontSize: 12, color: '#8888aa', marginBottom: 4 }}>{formatDate(apod.date)}</div>
                  <h2 style={{ fontSize: 20, fontWeight: 700, margin: 0, color: '#f0f0ff' }}>{apod.title}</h2>
                  {apod.copyright && (
                    <div style={{ fontSize: 11, color: '#9999bb', marginTop: 6 }}>© {apod.copyright.replace(/\n/g, ' · ')}</div>
                  )}
                </div>
              </div>

              {/* 操作按钮 */}
              <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 16 }}>
                <button
                  onClick={toggleFavorite}
                  className={`av-btn ${isFav ? 'av-heartbeat' : ''}`}
                  style={{
                    background: isFav ? 'rgba(250,204,21,0.15)' : 'rgba(255,255,255,0.06)',
                    border: '1px solid ' + (isFav ? 'rgba(250,204,21,0.5)' : 'rgba(255,255,255,0.12)'),
                    borderRadius: 10, padding: '8px 14px', cursor: 'pointer',
                    color: isFav ? '#facc15' : '#aaaacc', fontSize: 13,
                    display: 'flex', alignItems: 'center', gap: 6, fontFamily: 'inherit',
                  }}
                >
                  <Heart size={16} fill={isFav ? '#facc15' : 'none'} />
                  {isFav ? '已收藏' : '收藏'}
                </button>
                <button onClick={shareApod} className="av-btn" style={{
                  ...actionBtn,
                  color: shareCopied ? '#4ade80' : '#aaaacc',
                }}>
                  <Share2 size={16} />
                  {shareCopied ? '已复制链接' : '分享'}
                </button>
                {apod.media_type === 'image' && apod.hdurl && (
                  <a href={apod.hdurl} target="_blank" rel="noopener noreferrer" className="av-btn" style={{
                    ...actionBtn, textDecoration: 'none',
                  }}>
                    <ExternalLink size={16} /> 原图链接
                  </a>
                )}
                <button onClick={() => setShowDetails(!showDetails)} className="av-btn" style={actionBtn}>
                  {showDetails ? '收起详情' : '展开详情'}
                </button>
              </div>

              {/* 详细说明 */}
              {showDetails && (
                <div style={{
                  fontSize: 14, lineHeight: 1.8, color: '#c0c0d0', whiteSpace: 'pre-wrap',
                  padding: 16, background: 'rgba(255,255,255,0.03)', borderRadius: 12,
                  border: '1px solid rgba(255,255,255,0.06)',
                }}>
                  {apod.explanation}
                </div>
              )}

              {/* 底部链接 */}
              <div style={{
                display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                marginTop: 16, paddingTop: 14, borderTop: '1px solid rgba(255,255,255,0.08)',
                fontSize: 11, color: '#6666aa', flexWrap: 'wrap', gap: 8,
              }}>
                <span>数据来源：NASA Astronomy Picture of the Day</span>
                <a
                  href={`https://apod.nasa.gov/apod/ap${apod.date.replace(/-/g, '').slice(2)}.html`}
                  target="_blank" rel="noopener noreferrer"
                  style={{ color: '#a29bfe', textDecoration: 'none' }}
                >在 NASA 官网查看 ↗</a>
              </div>
            </div>
          </article>
        ) : null}

        <div style={{ textAlign: 'center', padding: '16px 0', fontSize: 11, color: '#5555aa' }}>
          NASA APOD 自 1995 年 6 月 16 日起每日更新
        </div>
      </div>
    </div>
  )
}

const navBtn: React.CSSProperties = {
  padding: '6px 12px', background: 'rgba(255,255,255,0.06)',
  border: '1px solid rgba(255,255,255,0.12)', borderRadius: 8,
  color: '#aaaacc', cursor: 'pointer', fontSize: 12,
  fontFamily: 'inherit', whiteSpace: 'nowrap',
  display: 'flex', alignItems: 'center', gap: 4,
}

const actionBtn: React.CSSProperties = {
  background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.12)',
  borderRadius: 10, padding: '8px 14px', cursor: 'pointer',
  color: '#aaaacc', fontSize: 13, display: 'flex', alignItems: 'center', gap: 6,
  fontFamily: 'inherit',
}