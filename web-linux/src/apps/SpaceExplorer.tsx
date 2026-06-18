import { useState, useEffect, useCallback, useMemo } from 'react'

type TabKey = 'apod' | 'mars' | 'iss' | 'astros' | 'earth'

/* ---------- APOD ---------- */
interface ApodData {
  date: string
  title: string
  explanation: string
  url: string
  hdurl?: string
  media_type: string
  copyright?: string
}

/* ---------- Mars Rover ---------- */
interface MarsCamera {
  full_name: string
  name: string
}
interface MarsRover {
  name: string
  landing_date: string
  launch_date: string
  status: string
}
interface MarsPhoto {
  id: number
  img_src: string
  earth_date: string
  sol: number
  camera: MarsCamera
  rover: MarsRover
}

/* ---------- ISS ---------- */
interface IssPosition {
  latitude: number
  longitude: number
  timestamp: number
}

/* ---------- Astronauts ---------- */
interface Astronaut {
  name: string
  craft: string
}

/* ---------- 通用工具 ---------- */
const DEMO_KEY = 'DEMO_KEY'

const containerStyle: React.CSSProperties = {
  width: '100%',
  height: '100%',
  background: 'linear-gradient(135deg, #0f0c29 0%, #302b63 50%, #24243e 100%)',
  color: '#e8eaf6',
  fontFamily:
    "-apple-system, BlinkMacSystemFont, 'Segoe UI', 'PingFang SC', 'Microsoft YaHei', sans-serif",
  display: 'flex',
  flexDirection: 'column',
  overflow: 'hidden',
}

const headerStyle: React.CSSProperties = {
  padding: '16px 24px',
  borderBottom: '1px solid rgba(124, 108, 240, 0.25)',
  background: 'rgba(15, 12, 41, 0.6)',
  backdropFilter: 'blur(8px)',
}

const titleStyle: React.CSSProperties = {
  fontSize: 22,
  fontWeight: 700,
  letterSpacing: 1,
  background: 'linear-gradient(90deg, #b8a8ff, #7c6cf0)',
  WebkitBackgroundClip: 'text',
  WebkitTextFillColor: 'transparent',
  margin: 0,
}

const subtitleStyle: React.CSSProperties = {
  fontSize: 12,
  color: 'rgba(232, 234, 246, 0.55)',
  marginTop: 4,
}

const tabsBarStyle: React.CSSProperties = {
  display: 'flex',
  gap: 4,
  padding: '10px 16px',
  borderBottom: '1px solid rgba(124, 108, 240, 0.2)',
  background: 'rgba(15, 12, 41, 0.4)',
  flexWrap: 'wrap',
}

const tabButtonStyle = (active: boolean): React.CSSProperties => ({
  padding: '8px 16px',
  borderRadius: 8,
  border: 'none',
  cursor: 'pointer',
  fontSize: 13,
  fontWeight: active ? 700 : 500,
  background: active
    ? 'linear-gradient(135deg, #7c6cf0, #9b8af0)'
    : 'rgba(255, 255, 255, 0.05)',
  color: active ? '#fff' : 'rgba(232, 234, 246, 0.75)',
  transition: 'all 0.2s',
  outline: 'none',
  boxShadow: active ? '0 4px 12px rgba(124, 108, 240, 0.35)' : 'none',
})

const contentStyle: React.CSSProperties = {
  flex: 1,
  overflow: 'auto',
  padding: 20,
}

const cardStyle: React.CSSProperties = {
  background: 'rgba(30, 28, 60, 0.55)',
  border: '1px solid rgba(124, 108, 240, 0.25)',
  borderRadius: 12,
  padding: 20,
  backdropFilter: 'blur(6px)',
}

const buttonPrimary: React.CSSProperties = {
  padding: '8px 16px',
  borderRadius: 6,
  border: 'none',
  cursor: 'pointer',
  fontSize: 13,
  fontWeight: 600,
  background: 'linear-gradient(135deg, #7c6cf0, #9b8af0)',
  color: '#fff',
  outline: 'none',
  transition: 'all 0.2s',
}

const buttonGhost: React.CSSProperties = {
  padding: '8px 14px',
  borderRadius: 6,
  border: '1px solid rgba(124, 108, 240, 0.4)',
  cursor: 'pointer',
  fontSize: 13,
  background: 'rgba(255, 255, 255, 0.04)',
  color: 'rgba(232, 234, 246, 0.85)',
  outline: 'none',
}

const inputStyle: React.CSSProperties = {
  padding: '8px 12px',
  borderRadius: 6,
  border: '1px solid rgba(124, 108, 240, 0.35)',
  background: 'rgba(15, 12, 41, 0.6)',
  color: '#e8eaf6',
  fontSize: 13,
  outline: 'none',
}

const labelStyle: React.CSSProperties = {
  fontSize: 12,
  color: 'rgba(232, 234, 246, 0.6)',
  marginBottom: 6,
  display: 'block',
}

const badgeStyle: React.CSSProperties = {
  display: 'inline-block',
  padding: '4px 10px',
  borderRadius: 20,
  background: 'rgba(124, 108, 240, 0.18)',
  color: '#b8a8ff',
  fontSize: 12,
  fontWeight: 600,
  border: '1px solid rgba(124, 108, 240, 0.3)',
}

const loadingStyle: React.CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  justifyContent: 'center',
  padding: '60px 20px',
  color: 'rgba(232, 234, 246, 0.6)',
  fontSize: 14,
  gap: 12,
}

const spinnerStyle: React.CSSProperties = {
  width: 38,
  height: 38,
  border: '3px solid rgba(124, 108, 240, 0.2)',
  borderTop: '3px solid #9b8af0',
  borderRadius: '50%',
  animation: 'spin 1s linear infinite',
}

const keyframeStyle = `
@keyframes spin { to { transform: rotate(360deg); } }
@keyframes fadeIn { from { opacity: 0; transform: translateY(8px); } to { opacity: 1; transform: translateY(0); } }
`

/* ---------- 共享状态组件 ---------- */
function StatusLoading({ text = '正在从太空获取数据...' }: { text?: string }) {
  return (
    <div style={loadingStyle}>
      <div style={spinnerStyle} />
      <div>{text}</div>
    </div>
  )
}

function StatusError({
  message,
  onRetry,
}: {
  message: string
  onRetry?: () => void
}) {
  return (
    <div
      style={{
        ...cardStyle,
        borderColor: 'rgba(244, 67, 54, 0.4)',
        background: 'rgba(60, 28, 30, 0.55)',
        textAlign: 'center',
      }}
    >
      <div style={{ fontSize: 36, marginBottom: 12 }}>⚠️</div>
      <div
        style={{
          fontSize: 15,
          fontWeight: 600,
          color: '#ffb3b3',
          marginBottom: 8,
        }}
      >
        加载失败
      </div>
      <div
        style={{
          fontSize: 13,
          color: 'rgba(232, 234, 246, 0.75)',
          marginBottom: 16,
        }}
      >
        {message}
      </div>
      {onRetry && (
        <button style={buttonPrimary} onClick={onRetry}>
          重新尝试
        </button>
      )}
    </div>
  )
}

function ActionRow({ items }: { items: { label: string; onClick: () => void }[] }) {
  return (
    <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', marginTop: 12 }}>
      {items.map((it) => (
        <button key={it.label} style={buttonGhost} onClick={it.onClick}>
          {it.label}
        </button>
      ))}
    </div>
  )
}

function openExternal(url: string) {
  window.open(url, '_blank', 'noopener,noreferrer')
}

async function copyText(text: string): Promise<boolean> {
  try {
    if (navigator.clipboard && navigator.clipboard.writeText) {
      await navigator.clipboard.writeText(text)
      return true
    }
    const ta = document.createElement('textarea')
    ta.value = text
    ta.style.position = 'fixed'
    ta.style.opacity = '0'
    document.body.appendChild(ta)
    ta.select()
    const ok = document.execCommand('copy')
    document.body.removeChild(ta)
    return ok
  } catch {
    return false
  }
}

/* ---------- APOD 页面 ---------- */
function ApodTab() {
  const today = useMemo(() => {
    const d = new Date()
    const y = d.getFullYear()
    const m = String(d.getMonth() + 1).padStart(2, '0')
    const day = String(d.getDate()).padStart(2, '0')
    return `${y}-${m}-${day}`
  }, [])

  const [date, setDate] = useState<string>(today)
  const [data, setData] = useState<ApodData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [imgError, setImgError] = useState(false)
  const [toast, setToast] = useState<string | null>(null)

  const fetchApod = useCallback(async (d: string) => {
    setLoading(true)
    setError(null)
    setImgError(false)
    setData(null)
    try {
      const url = `https://api.nasa.gov/planetary/apod?api_key=${DEMO_KEY}&date=${d}`
      const res = await fetch(url)
      if (!res.ok) {
        throw new Error(`HTTP ${res.status}`)
      }
      const json = await res.json()
      setData(json)
    } catch (err) {
      const msg = err instanceof Error ? err.message : '未知错误'
      setError(`无法获取天文图：${msg}。请检查网络连接或稍后重试。`)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchApod(date)
  }, [date, fetchApod])

  const showToast = (t: string) => {
    setToast(t)
    window.setTimeout(() => setToast(null), 1800)
  }

  return (
    <div>
      <div style={{ ...cardStyle, marginBottom: 16 }}>
        <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', alignItems: 'flex-end' }}>
          <div>
            <label style={labelStyle}>选择日期</label>
            <input
              type="date"
              value={date}
              min="1995-06-16"
              max={today}
              onChange={(e) => setDate(e.target.value)}
              style={inputStyle}
            />
          </div>
          <button style={buttonPrimary} onClick={() => fetchApod(date)}>
            🔄 重新加载
          </button>
          <button
            style={buttonGhost}
            onClick={() => setDate(today)}
          >
            今日
          </button>
          <div style={{ flex: 1 }} />
          {data && <span style={badgeStyle}>APOD · {data.date}</span>}
        </div>
      </div>

      {loading && <StatusLoading text="正在加载今日天文图..." />}
      {!loading && error && <StatusError message={error} onRetry={() => fetchApod(date)} />}
      {!loading && !error && data && (
        <div style={{ ...cardStyle, animation: 'fadeIn 0.3s ease' }}>
          <h2 style={{ margin: 0, fontSize: 20, color: '#fff' }}>{data.title}</h2>
          <div style={{ fontSize: 12, color: 'rgba(232, 234, 246, 0.55)', marginTop: 4 }}>
            {data.copyright ? `版权所有：${data.copyright}` : '公共领域 · NASA'}
          </div>

          <div
            style={{
              marginTop: 16,
              borderRadius: 10,
              overflow: 'hidden',
              background: 'rgba(0,0,0,0.3)',
              display: 'flex',
              justifyContent: 'center',
              alignItems: 'center',
            }}
          >
            {data.media_type === 'video' ? (
              <iframe
                src={data.url}
                title={data.title}
                style={{ width: '100%', maxWidth: '100%', aspectRatio: '16 / 9', border: 'none' }}
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
              />
            ) : (
              <img
                src={imgError ? data.url : data.hdurl || data.url}
                alt={data.title}
                onError={() => setImgError(true)}
                style={{
                  display: 'block',
                  maxWidth: '100%',
                  width: '100%',
                  height: 'auto',
                  objectFit: 'contain',
                }}
              />
            )}
          </div>

          <p
            style={{
              marginTop: 18,
              fontSize: 14,
              lineHeight: 1.8,
              color: 'rgba(232, 234, 246, 0.85)',
            }}
          >
            {data.explanation}
          </p>

          <ActionRow
            items={[
              {
                label: '🔗 复制图片链接',
                onClick: async () => {
                  const ok = await copyText(data.hdurl || data.url)
                  showToast(ok ? '链接已复制' : '复制失败')
                },
              },
              {
                label: '🌐 在浏览器打开',
                onClick: () => openExternal(data.hdurl || data.url),
              },
              {
                label: '📄 打开 APOD 页面',
                onClick: () =>
                  openExternal(`https://apod.nasa.gov/apod/ap${date.slice(2).replace(/-/g, '')}.html`),
              },
              {
                label: '📋 复制说明',
                onClick: async () => {
                  const ok = await copyText(`【${data.title}】\n${data.explanation}`)
                  showToast(ok ? '说明已复制' : '复制失败')
                },
              },
            ]}
          />
        </div>
      )}

      {toast && (
        <div
          style={{
            position: 'fixed',
            bottom: 24,
            left: '50%',
            transform: 'translateX(-50%)',
            padding: '10px 20px',
            background: 'rgba(30, 28, 60, 0.95)',
            border: '1px solid rgba(124, 108, 240, 0.5)',
            borderRadius: 8,
            fontSize: 13,
            color: '#fff',
            zIndex: 999,
          }}
        >
          {toast}
        </div>
      )}
    </div>
  )
}

/* ---------- Mars Rover 页面 ---------- */
const ROVERS: { key: string; name: string; note: string }[] = [
  { key: 'curiosity', name: '好奇号 (Curiosity)', note: '自 2012 年 8 月起在盖尔撞击坑工作' },
  { key: 'opportunity', name: '机遇号 (Opportunity)', note: '2004 - 2018 年在梅里迪亚尼平面' },
  { key: 'spirit', name: '勇气号 (Spirit)', note: '2004 - 2010 年在古谢夫撞击坑' },
]

function MarsTab() {
  const [rover, setRover] = useState('curiosity')
  const [sol, setSol] = useState(1000)
  const [page, setPage] = useState(1)
  const [photos, setPhotos] = useState<MarsPhoto[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [toast, setToast] = useState<string | null>(null)

  const fetchPhotos = useCallback(async () => {
    setLoading(true)
    setError(null)
    setPhotos([])
    try {
      const url = `https://api.nasa.gov/mars-photos/api/v1/rovers/${rover}/photos?sol=${sol}&page=${page}&api_key=${DEMO_KEY}`
      const res = await fetch(url)
      if (!res.ok) throw new Error(`HTTP ${res.status}`)
      const json = await res.json()
      const list: MarsPhoto[] = json.photos || []
      setPhotos(list)
      if (list.length === 0) {
        setError('当前 sol 日/分页没有找到照片，请尝试其他 sol 日。')
      }
    } catch (err) {
      const msg = err instanceof Error ? err.message : '未知错误'
      setError(`无法获取火星漫游车照片：${msg}`)
    } finally {
      setLoading(false)
    }
  }, [rover, sol, page])

  useEffect(() => {
    fetchPhotos()
  }, [fetchPhotos])

  const showToast = (t: string) => {
    setToast(t)
    window.setTimeout(() => setToast(null), 1800)
  }

  return (
    <div>
      <div style={{ ...cardStyle, marginBottom: 16 }}>
        <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', alignItems: 'flex-end' }}>
          <div>
            <label style={labelStyle}>漫游车</label>
            <select
              value={rover}
              onChange={(e) => {
                setRover(e.target.value)
                setPage(1)
              }}
              style={inputStyle}
            >
              {ROVERS.map((r) => (
                <option key={r.key} value={r.key} style={{ background: '#1e1c3c' }}>
                  {r.name}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label style={labelStyle}>Sol（火星日）</label>
            <input
              type="number"
              min={0}
              max={3000}
              value={sol}
              onChange={(e) => {
                setSol(Number(e.target.value) || 0)
                setPage(1)
              }}
              style={{ ...inputStyle, width: 120 }}
            />
          </div>
          <div>
            <label style={labelStyle}>分页</label>
            <input
              type="number"
              min={1}
              value={page}
              onChange={(e) => setPage(Number(e.target.value) || 1)}
              style={{ ...inputStyle, width: 90 }}
            />
          </div>
          <button style={buttonPrimary} onClick={fetchPhotos}>
            🔍 查询
          </button>
          <div style={{ flex: 1 }} />
          <span style={badgeStyle}>
            📡 {ROVERS.find((r) => r.key === rover)?.note}
          </span>
        </div>
      </div>

      {loading && <StatusLoading text="正在从火星获取图像..." />}
      {!loading && error && (
        <StatusError message={error} onRetry={() => fetchPhotos()} />
      )}
      {!loading && !error && photos.length > 0 && (
        <>
          <div
            style={{
              fontSize: 13,
              color: 'rgba(232, 234, 246, 0.6)',
              marginBottom: 12,
            }}
          >
            共找到 {photos.length} 张照片（sol {sol} · 第 {page} 页）
          </div>
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))',
              gap: 14,
              animation: 'fadeIn 0.3s ease',
            }}
          >
            {photos.map((p) => (
              <div
                key={p.id}
                style={{
                  ...cardStyle,
                  padding: 12,
                  display: 'flex',
                  flexDirection: 'column',
                }}
              >
                <div
                  style={{
                    borderRadius: 8,
                    overflow: 'hidden',
                    background: 'rgba(0,0,0,0.3)',
                  }}
                >
                  <img
                    src={p.img_src}
                    alt={`Mars photo ${p.id}`}
                    loading="lazy"
                    style={{
                      display: 'block',
                      maxWidth: '100%',
                      width: '100%',
                      height: 'auto',
                      objectFit: 'contain',
                    }}
                  />
                </div>
                <div style={{ marginTop: 10, fontSize: 13, color: '#fff', fontWeight: 600 }}>
                  📅 {p.earth_date}
                </div>
                <div style={{ fontSize: 12, color: 'rgba(232, 234, 246, 0.6)', marginTop: 2 }}>
                  📷 {p.camera.full_name} · Sol {p.sol}
                </div>
                <ActionRow
                  items={[
                    {
                      label: '🔗 复制',
                      onClick: async () => {
                        const ok = await copyText(p.img_src)
                        showToast(ok ? '链接已复制' : '复制失败')
                      },
                    },
                    {
                      label: '🌐 打开',
                      onClick: () => openExternal(p.img_src),
                    },
                  ]}
                />
              </div>
            ))}
          </div>
        </>
      )}

      {toast && (
        <div
          style={{
            position: 'fixed',
            bottom: 24,
            left: '50%',
            transform: 'translateX(-50%)',
            padding: '10px 20px',
            background: 'rgba(30, 28, 60, 0.95)',
            border: '1px solid rgba(124, 108, 240, 0.5)',
            borderRadius: 8,
            fontSize: 13,
            color: '#fff',
            zIndex: 999,
          }}
        >
          {toast}
        </div>
      )}
    </div>
  )
}

/* ---------- ISS 位置页面 ---------- */
function IssTab() {
  const [pos, setPos] = useState<IssPosition | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [autoRefresh, setAutoRefresh] = useState(true)
  const [lastUpdate, setLastUpdate] = useState<Date | null>(null)
  const [toast, setToast] = useState<string | null>(null)

  const fetchIss = useCallback(async () => {
    setError(null)
    try {
      const res = await fetch('http://api.open-notify.org/iss-now.json')
      if (!res.ok) throw new Error(`HTTP ${res.status}`)
      const json = await res.json()
      if (json.message !== 'success') {
        throw new Error('服务返回非 success')
      }
      setPos({
        latitude: Number(json.iss_position.latitude),
        longitude: Number(json.iss_position.longitude),
        timestamp: Number(json.timestamp),
      })
      setLastUpdate(new Date())
    } catch (err) {
      const msg = err instanceof Error ? err.message : '未知错误'
      setError(`无法获取 ISS 位置：${msg}`)
    }
  }, [])

  useEffect(() => {
    fetchIss()
    if (!autoRefresh) return
    const id = window.setInterval(() => fetchIss(), 10000)
    return () => window.clearInterval(id)
  }, [autoRefresh, fetchIss])

  const showToast = (t: string) => {
    setToast(t)
    window.setTimeout(() => setToast(null), 1800)
  }

  const mapUrl = pos
    ? `https://www.openstreetmap.org/?mlat=${pos.latitude.toFixed(
        4
      )}&mlon=${pos.longitude.toFixed(4)}#map=4/${pos.latitude.toFixed(2)}/${pos.longitude.toFixed(2)}`
    : ''

  /* 简易自绘地图（基于经纬度在世界地图上标记点） */
  const mapSize = { w: 720, h: 360 }
  const markerX = pos
    ? ((pos.longitude + 180) / 360) * mapSize.w
    : mapSize.w / 2
  const markerY = pos
    ? ((90 - pos.latitude) / 180) * mapSize.h
    : mapSize.h / 2

  return (
    <div>
      <div style={{ ...cardStyle, marginBottom: 16 }}>
        <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', alignItems: 'center' }}>
          <span style={badgeStyle}>🛰️ 国际空间站 (ISS) · 实时位置</span>
          <div style={{ flex: 1 }} />
          <label style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 13 }}>
            <input
              type="checkbox"
              checked={autoRefresh}
              onChange={(e) => setAutoRefresh(e.target.checked)}
            />
            每 10 秒自动刷新
          </label>
          <button style={buttonPrimary} onClick={fetchIss}>
            🔄 立即刷新
          </button>
        </div>
      </div>

      {error && <StatusError message={error} onRetry={() => fetchIss()} />}
      {!error && !pos && <StatusLoading text="正在定位国际空间站..." />}
      {!error && pos && (
        <div style={{ ...cardStyle, animation: 'fadeIn 0.3s ease' }}>
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
              gap: 14,
              marginBottom: 18,
            }}
          >
            <div
              style={{
                background: 'rgba(15, 12, 41, 0.6)',
                border: '1px solid rgba(124, 108, 240, 0.3)',
                borderRadius: 10,
                padding: 14,
              }}
            >
              <div style={{ fontSize: 12, color: 'rgba(232, 234, 246, 0.55)' }}>纬度</div>
              <div style={{ fontSize: 22, fontWeight: 700, color: '#b8a8ff', marginTop: 6 }}>
                {pos.latitude.toFixed(4)}°
              </div>
            </div>
            <div
              style={{
                background: 'rgba(15, 12, 41, 0.6)',
                border: '1px solid rgba(124, 108, 240, 0.3)',
                borderRadius: 10,
                padding: 14,
              }}
            >
              <div style={{ fontSize: 12, color: 'rgba(232, 234, 246, 0.55)' }}>经度</div>
              <div style={{ fontSize: 22, fontWeight: 700, color: '#b8a8ff', marginTop: 6 }}>
                {pos.longitude.toFixed(4)}°
              </div>
            </div>
            <div
              style={{
                background: 'rgba(15, 12, 41, 0.6)',
                border: '1px solid rgba(124, 108, 240, 0.3)',
                borderRadius: 10,
                padding: 14,
              }}
            >
              <div style={{ fontSize: 12, color: 'rgba(232, 234, 246, 0.55)' }}>在轨速度</div>
              <div style={{ fontSize: 22, fontWeight: 700, color: '#b8a8ff', marginTop: 6 }}>
                ~27,600 km/h
              </div>
            </div>
            <div
              style={{
                background: 'rgba(15, 12, 41, 0.6)',
                border: '1px solid rgba(124, 108, 240, 0.3)',
                borderRadius: 10,
                padding: 14,
              }}
            >
              <div style={{ fontSize: 12, color: 'rgba(232, 234, 246, 0.55)' }}>
                最后更新
              </div>
              <div style={{ fontSize: 22, fontWeight: 700, color: '#b8a8ff', marginTop: 6 }}>
                {lastUpdate?.toLocaleTimeString('zh-CN', { hour12: false })}
              </div>
            </div>
          </div>

          <div
            style={{
              position: 'relative',
              width: '100%',
              maxWidth: '100%',
              aspectRatio: `${mapSize.w} / ${mapSize.h}`,
              background:
                'linear-gradient(135deg, #1a1a3e 0%, #0d0d2b 100%)',
              border: '1px solid rgba(124, 108, 240, 0.3)',
              borderRadius: 10,
              overflow: 'hidden',
            }}
          >
            <svg
              viewBox={`0 0 ${mapSize.w} ${mapSize.h}`}
              preserveAspectRatio="xMidYMid meet"
              style={{ width: '100%', height: '100%', display: 'block' }}
            >
              {/* 经纬网格 */}
              {Array.from({ length: 13 }).map((_, i) => {
                const x = (i / 12) * mapSize.w
                return (
                  <line
                    key={`v${i}`}
                    x1={x}
                    y1={0}
                    x2={x}
                    y2={mapSize.h}
                    stroke="rgba(124, 108, 240, 0.12)"
                    strokeWidth={1}
                  />
                )
              })}
              {Array.from({ length: 7 }).map((_, i) => {
                const y = (i / 6) * mapSize.h
                return (
                  <line
                    key={`h${i}`}
                    x1={0}
                    y1={y}
                    x2={mapSize.w}
                    y2={y}
                    stroke="rgba(124, 108, 240, 0.12)"
                    strokeWidth={1}
                  />
                )
              })}
              {/* 赤道与本初子午线 */}
              <line
                x1={0}
                y1={mapSize.h / 2}
                x2={mapSize.w}
                y2={mapSize.h / 2}
                stroke="rgba(124, 108, 240, 0.3)"
                strokeDasharray="4 4"
              />
              <line
                x1={mapSize.w / 2}
                y1={0}
                x2={mapSize.w / 2}
                y2={mapSize.h}
                stroke="rgba(124, 108, 240, 0.3)"
                strokeDasharray="4 4"
              />

              {/* 非常简化的大陆轮廓（示意） */}
              <g fill="rgba(124, 108, 240, 0.18)" stroke="rgba(124, 108, 240, 0.45)" strokeWidth={1}>
                {/* 北美 */}
                <path d="M 90 90 L 170 75 L 200 110 L 190 170 L 150 195 L 110 180 L 80 140 Z" />
                {/* 南美 */}
                <path d="M 180 200 L 220 210 L 230 270 L 200 320 L 175 300 L 170 240 Z" />
                {/* 欧洲 */}
                <path d="M 340 80 L 410 75 L 420 130 L 380 150 L 345 135 Z" />
                {/* 非洲 */}
                <path d="M 355 155 L 420 155 L 435 210 L 410 280 L 375 290 L 350 230 Z" />
                {/* 亚洲 */}
                <path d="M 415 70 L 600 70 L 640 140 L 620 195 L 540 205 L 470 180 L 420 140 Z" />
                {/* 澳洲 */}
                <path d="M 580 250 L 650 245 L 660 285 L 620 305 L 585 285 Z" />
              </g>

              {/* ISS 标记点 */}
              <circle cx={markerX} cy={markerY} r={12} fill="rgba(255, 193, 7, 0.25)" />
              <circle cx={markerX} cy={markerY} r={6} fill="#ffc107" stroke="#fff" strokeWidth={1.5}>
                <animate attributeName="r" values="6;10;6" dur="1.6s" repeatCount="indefinite" />
              </circle>
              <circle cx={markerX} cy={markerY} r={3} fill="#fff" />

              <text
                x={markerX + 14}
                y={markerY - 8}
                fill="#ffd54f"
                fontSize="14"
                fontWeight="bold"
              >
                ISS 🛰️
              </text>
            </svg>
          </div>

          <div
            style={{
              marginTop: 12,
              fontSize: 12,
              color: 'rgba(232, 234, 246, 0.55)',
              textAlign: 'center',
            }}
          >
            本示意图为简化地图，仅用于展示 ISS 大致地理位置。
          </div>

          <ActionRow
            items={[
              {
                label: '🔗 复制坐标',
                onClick: async () => {
                  const ok = await copyText(`${pos.latitude.toFixed(4)}, ${pos.longitude.toFixed(4)}`)
                  showToast(ok ? '坐标已复制' : '复制失败')
                },
              },
              {
                label: '🗺️ OpenStreetMap',
                onClick: () => openExternal(mapUrl),
              },
              {
                label: '🌍 Google Maps',
                onClick: () =>
                  openExternal(
                    `https://www.google.com/maps?q=${pos.latitude},${pos.longitude}`
                  ),
              },
              {
                label: '📋 复制查询链接',
                onClick: async () => {
                  const ok = await copyText(mapUrl)
                  showToast(ok ? '链接已复制' : '复制失败')
                },
              },
            ]}
          />
        </div>
      )}

      {toast && (
        <div
          style={{
            position: 'fixed',
            bottom: 24,
            left: '50%',
            transform: 'translateX(-50%)',
            padding: '10px 20px',
            background: 'rgba(30, 28, 60, 0.95)',
            border: '1px solid rgba(124, 108, 240, 0.5)',
            borderRadius: 8,
            fontSize: 13,
            color: '#fff',
            zIndex: 999,
          }}
        >
          {toast}
        </div>
      )}
    </div>
  )
}

/* ---------- 航天员页面 ---------- */
function AstrosTab() {
  const [people, setPeople] = useState<Astronaut[]>([])
  const [number, setNumber] = useState(0)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [toast, setToast] = useState<string | null>(null)

  const fetchPeople = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const res = await fetch('http://api.open-notify.org/astros.json')
      if (!res.ok) throw new Error(`HTTP ${res.status}`)
      const json = await res.json()
      setPeople(json.people || [])
      setNumber(Number(json.number) || (json.people || []).length)
    } catch (err) {
      const msg = err instanceof Error ? err.message : '未知错误'
      setError(`无法获取太空人员信息：${msg}`)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchPeople()
  }, [fetchPeople])

  const grouped = useMemo(() => {
    const g: Record<string, Astronaut[]> = {}
    people.forEach((p) => {
      const key = p.craft || '未知'
      if (!g[key]) g[key] = []
      g[key].push(p)
    })
    return g
  }, [people])

  const showToast = (t: string) => {
    setToast(t)
    window.setTimeout(() => setToast(null), 1800)
  }

  return (
    <div>
      <div style={{ ...cardStyle, marginBottom: 16 }}>
        <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', alignItems: 'center' }}>
          <span style={badgeStyle}>🧑‍🚀 当前在太空人员</span>
          <div style={{ flex: 1 }} />
          <div style={{ fontSize: 13, color: 'rgba(232, 234, 246, 0.75)' }}>
            总人数：<strong style={{ color: '#b8a8ff' }}>{number}</strong>
          </div>
          <button style={buttonPrimary} onClick={fetchPeople}>
            🔄 刷新
          </button>
        </div>
      </div>

      {loading && <StatusLoading text="正在获取太空人员名单..." />}
      {!loading && error && <StatusError message={error} onRetry={() => fetchPeople()} />}
      {!loading && !error && people.length === 0 && (
        <div style={{ ...cardStyle, textAlign: 'center', color: 'rgba(232, 234, 246, 0.6)' }}>
          当前没有获取到人员信息。
        </div>
      )}
      {!loading && !error && people.length > 0 && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16, animation: 'fadeIn 0.3s ease' }}>
          {Object.entries(grouped).map(([craft, list]) => (
            <div key={craft} style={cardStyle}>
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 10,
                  marginBottom: 14,
                }}
              >
                <h3 style={{ margin: 0, color: '#fff', fontSize: 16 }}>🛰️ {craft}</h3>
                <span style={badgeStyle}>{list.length} 人</span>
              </div>
              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))',
                  gap: 10,
                }}
              >
                {list.map((p, idx) => (
                  <div
                    key={`${p.name}-${idx}`}
                    style={{
                      background: 'rgba(15, 12, 41, 0.6)',
                      border: '1px solid rgba(124, 108, 240, 0.25)',
                      borderRadius: 8,
                      padding: '12px 14px',
                      display: 'flex',
                      alignItems: 'center',
                      gap: 12,
                    }}
                  >
                    <div
                      style={{
                        width: 36,
                        height: 36,
                        borderRadius: '50%',
                        background:
                          'linear-gradient(135deg, #7c6cf0, #9b8af0)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontSize: 18,
                        flexShrink: 0,
                      }}
                    >
                      🧑‍🚀
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontSize: 14, color: '#fff', fontWeight: 600 }}>
                        {p.name}
                      </div>
                      <div style={{ fontSize: 12, color: 'rgba(232, 234, 246, 0.55)' }}>
                        {craft}
                      </div>
                    </div>
                    <button
                      style={{
                        ...buttonGhost,
                        padding: '6px 10px',
                        fontSize: 12,
                      }}
                      onClick={async () => {
                        const ok = await copyText(p.name)
                        showToast(ok ? '姓名已复制' : '复制失败')
                      }}
                    >
                      复制
                    </button>
                    <button
                      style={{
                        ...buttonGhost,
                        padding: '6px 10px',
                        fontSize: 12,
                      }}
                      onClick={() =>
                        openExternal(
                          `https://www.google.com/search?q=${encodeURIComponent(p.name + ' astronaut')}`
                        )
                      }
                    >
                      搜索
                    </button>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}

      {toast && (
        <div
          style={{
            position: 'fixed',
            bottom: 24,
            left: '50%',
            transform: 'translateX(-50%)',
            padding: '10px 20px',
            background: 'rgba(30, 28, 60, 0.95)',
            border: '1px solid rgba(124, 108, 240, 0.5)',
            borderRadius: 8,
            fontSize: 13,
            color: '#fff',
            zIndex: 999,
          }}
        >
          {toast}
        </div>
      )}
    </div>
  )
}

/* ---------- 地球观测图像（静态） ---------- */
function EarthTab() {
  const images = [
    {
      title: '蓝色大理石 - 东半球',
      url: 'https://upload.wikimedia.org/wikipedia/commons/thumb/9/97/The_Earth_seen_from_Apollo_17.jpg/1024px-The_Earth_seen_from_Apollo_17.jpg',
      desc: '经典的 "蓝色大理石" 图像，由阿波罗 17 号宇航员于 1972 年拍摄。',
    },
    {
      title: '地球 · 西半球',
      url: 'https://upload.wikimedia.org/wikipedia/commons/thumb/6/6f/Earth_Eastern_Hemisphere.jpg/1024px-Earth_Eastern_Hemisphere.jpg',
      desc: '显示非洲、欧洲与亚洲部分区域的合成卫星图像。',
    },
    {
      title: '从国际空间站看到的地球',
      url: 'https://images-assets.nasa.gov/image/iss065e095866/iss065e095866~orig.jpg',
      desc: '由国际空间站 Expedition 65 拍摄的地球图像。',
    },
  ]
  const [toast, setToast] = useState<string | null>(null)

  const showToast = (t: string) => {
    setToast(t)
    window.setTimeout(() => setToast(null), 1800)
  }

  return (
    <div>
      <div style={{ ...cardStyle, marginBottom: 16 }}>
        <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', alignItems: 'center' }}>
          <span style={badgeStyle}>🌍 地球观测图像精选</span>
          <div style={{ flex: 1 }} />
          <div style={{ fontSize: 12, color: 'rgba(232, 234, 246, 0.55)' }}>
            静态精选图像 · 版权归原摄影师 / NASA 所有
          </div>
        </div>
      </div>

      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
          gap: 16,
          animation: 'fadeIn 0.3s ease',
        }}
      >
        {images.map((img, idx) => (
          <div key={idx} style={cardStyle}>
            <h3 style={{ margin: 0, fontSize: 16, color: '#fff' }}>{img.title}</h3>
            <div
              style={{
                marginTop: 12,
                borderRadius: 8,
                overflow: 'hidden',
                background: 'rgba(0,0,0,0.3)',
              }}
            >
              <img
                src={img.url}
                alt={img.title}
                loading="lazy"
                onError={(e) => {
                  const t = e.currentTarget
                  t.style.display = 'none'
                  const ph = document.createElement('div')
                  ph.textContent = '图像加载失败'
                  ph.style.cssText =
                    'padding:40px;text-align:center;font-size:13px;color:rgba(232,234,246,0.5);'
                  t.parentElement?.appendChild(ph)
                }}
                style={{
                  display: 'block',
                  maxWidth: '100%',
                  width: '100%',
                  height: 'auto',
                  objectFit: 'contain',
                }}
              />
            </div>
            <p
              style={{
                fontSize: 13,
                lineHeight: 1.7,
                color: 'rgba(232, 234, 246, 0.75)',
                marginTop: 12,
                marginBottom: 0,
              }}
            >
              {img.desc}
            </p>
            <ActionRow
              items={[
                {
                  label: '🔗 复制链接',
                  onClick: async () => {
                    const ok = await copyText(img.url)
                    showToast(ok ? '链接已复制' : '复制失败')
                  },
                },
                {
                  label: '🌐 打开原图',
                  onClick: () => openExternal(img.url),
                },
              ]}
            />
          </div>
        ))}
      </div>

      {toast && (
        <div
          style={{
            position: 'fixed',
            bottom: 24,
            left: '50%',
            transform: 'translateX(-50%)',
            padding: '10px 20px',
            background: 'rgba(30, 28, 60, 0.95)',
            border: '1px solid rgba(124, 108, 240, 0.5)',
            borderRadius: 8,
            fontSize: 13,
            color: '#fff',
            zIndex: 999,
          }}
        >
          {toast}
        </div>
      )}
    </div>
  )
}

/* ---------- 主组件 ---------- */
const tabs: { key: TabKey; label: string; icon: string }[] = [
  { key: 'apod', label: '今日天文图', icon: '🌌' },
  { key: 'mars', label: '火星漫游车', icon: '🔴' },
  { key: 'iss', label: 'ISS 位置', icon: '🛰️' },
  { key: 'astros', label: '太空人员', icon: '🧑‍🚀' },
  { key: 'earth', label: '地球图像', icon: '🌍' },
]

export default function SpaceExplorer() {
  const [tab, setTab] = useState<TabKey>('apod')

  return (
    <div style={containerStyle}>
      <style>{keyframeStyle}</style>
      <div style={headerStyle}>
        <h1 style={titleStyle}>🚀 宇宙探索 · Space Explorer</h1>
        <div style={subtitleStyle}>
          接入 NASA Open API 与 Open Notify · 发现太阳系与太空中的精彩
        </div>
      </div>

      <div style={tabsBarStyle}>
        {tabs.map((t) => (
          <button
            key={t.key}
            style={tabButtonStyle(tab === t.key)}
            onClick={() => setTab(t.key)}
          >
            {t.icon} {t.label}
          </button>
        ))}
      </div>

      <div style={contentStyle}>
        {tab === 'apod' && <ApodTab />}
        {tab === 'mars' && <MarsTab />}
        {tab === 'iss' && <IssTab />}
        {tab === 'astros' && <AstrosTab />}
        {tab === 'earth' && <EarthTab />}
      </div>
    </div>
  )
}
