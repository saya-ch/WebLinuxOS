import { useState, useEffect, useCallback, useMemo } from 'react'
import { useStore } from '../store'

type TabKey = 'apod' | 'asteroid' | 'iss' | 'facts'

/* ---------- 类型定义 ---------- */
interface ApodData {
  date: string
  title: string
  explanation: string
  url: string
  hdurl?: string
  media_type: string
  copyright?: string
}

interface NeoCloseApproach {
  close_approach_date_full: string
  miss_distance: { kilometers: string }
  relative_velocity: { kilometers_per_hour: string }
  orbiting_body: string
}

interface NeoDiameter {
  estimated_diameter_min: number
  estimated_diameter_max: number
}

interface NeoObject {
  id: string
  name: string
  is_potentially_hazardous_asteroid: boolean
  estimated_diameter: { kilometers: NeoDiameter }
  close_approach_data: NeoCloseApproach[]
  nasa_jpl_url: string
}

interface IssData {
  latitude: number
  longitude: number
  altitude: number
  velocity: number
  visibility: string
  footprint: number
  timestamp: number
  daynum: number
  solar_lat: number
  solar_lon: number
  units: string
}

/* ---------- 常量 ---------- */
const NASA_KEY = 'DEMO_KEY'
const APOD_CACHE_KEY = 'space_explorer_pro_apod_cache'
const CACHE_TTL_MS = 24 * 60 * 60 * 1000

/* ---------- 工具函数 ---------- */
function formatNumber(n: number | string, digits = 0): string {
  const v = typeof n === 'string' ? Number(n) : n
  if (Number.isNaN(v)) return String(n)
  return v.toLocaleString('zh-CN', {
    minimumFractionDigits: digits,
    maximumFractionDigits: digits,
  })
}

function todayISO(): string {
  const d = new Date()
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${y}-${m}-${day}`
}

function addDays(dateStr: string, days: number): string {
  const d = new Date(dateStr)
  d.setDate(d.getDate() + days)
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${y}-${m}-${day}`
}

function openExternal(url: string): void {
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

/* ---------- localStorage APOD 缓存 ---------- */
interface ApodCache {
  [key: string]: { data: ApodData; timestamp: number }
}

function readApodCache(): ApodCache {
  try {
    const raw = localStorage.getItem(APOD_CACHE_KEY)
    if (!raw) return {}
    return JSON.parse(raw) as ApodCache
  } catch {
    return {}
  }
}

function writeApodCache(cache: ApodCache): void {
  try {
    localStorage.setItem(APOD_CACHE_KEY, JSON.stringify(cache))
  } catch {
    /* 忽略存储错误 */
  }
}

function getCachedApod(date: string): ApodData | null {
  const cache = readApodCache()
  const entry = cache[date]
  if (!entry) return null
  if (Date.now() - entry.timestamp > CACHE_TTL_MS) return null
  return entry.data
}

function setCachedApod(date: string, data: ApodData): void {
  const cache = readApodCache()
  cache[date] = { data, timestamp: Date.now() }
  writeApodCache(cache)
}

/* ---------- Toast ---------- */
function useToast() {
  const [toast, setToast] = useState<string | null>(null)
  const showToast = useCallback((t: string) => {
    setToast(t)
    window.setTimeout(() => setToast(null), 1800)
  }, [])
  return { toast, showToast }
}

/* ---------- APOD Tab ---------- */
function ApodTab({ isDark }: { isDark: boolean }) {
  const today = useMemo(() => todayISO(), [])
  const [date, setDate] = useState<string>(today)
  const [data, setData] = useState<ApodData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [imgError, setImgError] = useState(false)
  const { toast, showToast } = useToast()

  const fetchApod = useCallback(async (d: string) => {
    setLoading(true)
    setError(null)
    setImgError(false)
    const cached = getCachedApod(d)
    if (cached) {
      setData(cached)
      setLoading(false)
      return
    }
    try {
      const url = `https://api.nasa.gov/planetary/apod?api_key=${NASA_KEY}&date=${d}`
      const res = await fetch(url)
      if (!res.ok) {
        throw new Error(`HTTP ${res.status}`)
      }
      const json = (await res.json()) as ApodData
      setData(json)
      setCachedApod(d, json)
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

  const cardBg = isDark ? 'rgba(30, 28, 60, 0.55)' : 'rgba(255, 255, 255, 0.85)'
  const cardBorder = isDark ? 'rgba(124, 108, 240, 0.25)' : 'rgba(0, 0, 0, 0.08)'
  const textColor = isDark ? '#e8eaf6' : '#1a1a2e'
  const subTextColor = isDark ? 'rgba(232, 234, 246, 0.55)' : 'rgba(0, 0, 0, 0.55)'
  const inputBg = isDark ? 'rgba(15, 12, 41, 0.6)' : 'rgba(255, 255, 255, 0.9)'
  const inputBorder = isDark ? 'rgba(124, 108, 240, 0.35)' : 'rgba(0, 0, 0, 0.15)'
  const badgeBg = isDark ? 'rgba(124, 108, 240, 0.18)' : 'rgba(124, 108, 240, 0.1)'
  const badgeColor = isDark ? '#b8a8ff' : '#5a4fc8'
  const accent = isDark ? '#b8a8ff' : '#5a4fc8'

  const buttonPrimaryStyle: React.CSSProperties = {
    padding: '8px 16px',
    borderRadius: 6,
    border: 'none',
    cursor: 'pointer',
    fontSize: 13,
    fontWeight: 600,
    background: isDark
      ? 'linear-gradient(135deg, #7c6cf0, #9b8af0)'
      : 'linear-gradient(135deg, #6c5ce7, #8b7cf0)',
    color: '#fff',
    outline: 'none',
    transition: 'all 0.2s',
  }

  const buttonGhostStyle: React.CSSProperties = {
    padding: '8px 14px',
    borderRadius: 6,
    border: `1px solid ${isDark ? 'rgba(124, 108, 240, 0.4)' : 'rgba(124, 108, 240, 0.3)'}`,
    cursor: 'pointer',
    fontSize: 13,
    background: isDark ? 'rgba(255, 255, 255, 0.04)' : 'rgba(124, 108, 240, 0.05)',
    color: textColor,
    outline: 'none',
  }

  const inputStyle: React.CSSProperties = {
    padding: '8px 12px',
    borderRadius: 6,
    border: `1px solid ${inputBorder}`,
    background: inputBg,
    color: textColor,
    fontSize: 13,
    outline: 'none',
  }

  const loadingSpinnerStyle: React.CSSProperties = {
    width: 38,
    height: 38,
    border: `3px solid ${isDark ? 'rgba(124, 108, 240, 0.2)' : 'rgba(124, 108, 240, 0.15)'}`,
    borderTop: `3px solid ${isDark ? '#9b8af0' : '#7c6cf0'}`,
    borderRadius: '50%',
    animation: 'spin 1s linear infinite',
  }

  const loadingBoxStyle: React.CSSProperties = {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '60px 20px',
    color: isDark ? 'rgba(232, 234, 246, 0.6)' : 'rgba(0, 0, 0, 0.5)',
    fontSize: 14,
    gap: 12,
  }

  return (
    <div>
      <div
        style={{
          background: cardBg,
          border: `1px solid ${cardBorder}`,
          borderRadius: 12,
          padding: 20,
          marginBottom: 16,
        }}
      >
        <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', alignItems: 'flex-end' }}>
          <div>
            <div style={{ fontSize: 12, color: subTextColor, marginBottom: 6 }}>选择日期</div>
            <input
              type="date"
              value={date}
              min="1995-06-16"
              max={today}
              onChange={(e) => setDate(e.target.value)}
              style={inputStyle}
            />
          </div>
          <button style={buttonPrimaryStyle} onClick={() => fetchApod(date)}>
            🔄 重新加载
          </button>
          <button style={buttonGhostStyle} onClick={() => setDate(today)}>
            今日
          </button>
          <div style={{ flex: 1 }} />
          {data && (
            <span
              style={{
                display: 'inline-block',
                padding: '4px 10px',
                borderRadius: 20,
                background: badgeBg,
                color: badgeColor,
                fontSize: 12,
                fontWeight: 600,
                border: `1px solid ${isDark ? 'rgba(124, 108, 240, 0.3)' : 'rgba(124, 108, 240, 0.2)'}`,
              }}
            >
              APOD · {data.date}
            </span>
          )}
        </div>
      </div>

      {loading && (
        <div style={loadingBoxStyle}>
          <div style={loadingSpinnerStyle} />
          <div>正在加载今日天文图...</div>
        </div>
      )}
      {!loading && error && (
        <div
          style={{
            background: isDark ? 'rgba(60, 28, 30, 0.55)' : 'rgba(254, 226, 226, 0.9)',
            border: `1px solid ${isDark ? 'rgba(244, 67, 54, 0.4)' : 'rgba(239, 68, 68, 0.3)'}`,
            borderRadius: 12,
            padding: 24,
            textAlign: 'center',
            color: isDark ? '#ffb3b3' : '#c53030',
          }}
        >
          <div style={{ fontSize: 36, marginBottom: 12 }}>⚠️</div>
          <div style={{ fontSize: 15, fontWeight: 600, marginBottom: 8 }}>加载失败</div>
          <div
            style={{
              fontSize: 13,
              color: isDark ? 'rgba(232, 234, 246, 0.75)' : 'rgba(0, 0, 0, 0.65)',
              marginBottom: 16,
            }}
          >
            {error}
          </div>
          <button style={buttonPrimaryStyle} onClick={() => fetchApod(date)}>
            重新尝试
          </button>
        </div>
      )}
      {!loading && !error && data && (
        <div
          style={{
            background: cardBg,
            border: `1px solid ${cardBorder}`,
            borderRadius: 12,
            padding: 20,
            animation: 'fadeIn 0.3s ease',
          }}
        >
          <h2 style={{ margin: 0, fontSize: 20, color: isDark ? '#fff' : '#1a1a2e' }}>
            {data.title}
          </h2>
          <div style={{ fontSize: 12, color: subTextColor, marginTop: 4 }}>
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
              color: isDark ? 'rgba(232, 234, 246, 0.85)' : 'rgba(0, 0, 0, 0.75)',
            }}
          >
            {data.explanation}
          </p>

          <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', marginTop: 16 }}>
            <button
              style={buttonGhostStyle}
              onClick={async () => {
                const ok = await copyText(data.hdurl || data.url)
                showToast(ok ? '链接已复制' : '复制失败')
              }}
            >
              🔗 复制图片链接
            </button>
            <button style={buttonGhostStyle} onClick={() => openExternal(data.hdurl || data.url)}>
              🌐 在浏览器打开
            </button>
            {data.hdurl && (
              <button style={buttonGhostStyle} onClick={() => openExternal(data.hdurl!)}>
              🖼️ 高清图片
              </button>
            )}
            <button
              style={buttonGhostStyle}
              onClick={async () => {
                const ok = await copyText(`【${data.title}】\n${data.explanation}`)
                showToast(ok ? '说明已复制' : '复制失败')
              }}
            >
              📋 复制说明
            </button>
          </div>
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
            background: isDark ? 'rgba(30, 28, 60, 0.95)' : 'rgba(255, 255, 255, 0.95)',
            border: `1px solid ${isDark ? 'rgba(124, 108, 240, 0.5)' : 'rgba(124, 108, 240, 0.3)'}`,
            borderRadius: 8,
            fontSize: 13,
            color: accent,
            zIndex: 999,
            boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
          }}
        >
          {toast}
        </div>
      )}
    </div>
  )
}

/* ---------- 小行星 Tab ---------- */
function AsteroidTab({ isDark }: { isDark: boolean }) {
  const today = useMemo(() => todayISO(), [])
  const startDate = today
  const endDate = useMemo(() => addDays(today, 6), [today])

  const [neos, setNeos] = useState<NeoObject[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [showOnlyHazard, setShowOnlyHazard] = useState(false)
  const [sortBy, setSortBy] = useState<'distance' | 'size' | 'velocity'>('distance')
  const { toast, showToast } = useToast()

  const fetchNeos = useCallback(async () => {
    setLoading(true)
    setError(null)
    setNeos([])
    try {
      const url = `https://api.nasa.gov/neo/rest/v1/feed?start_date=${startDate}&end_date=${endDate}&api_key=${NASA_KEY}`
      const res = await fetch(url)
      if (!res.ok) {
        throw new Error(`HTTP ${res.status}`)
      }
      const json = await res.json()
      const nearEarthObjects = json.near_earth_objects as Record<string, NeoObject[]>
      const all: NeoObject[] = []
      Object.values(nearEarthObjects).forEach((list) => {
        list.forEach((neo) => all.push(neo))
      })
      setNeos(all)
    } catch (err) {
      const msg = err instanceof Error ? err.message : '未知错误'
      setError(`无法获取小行星数据：${msg}。请检查网络连接或稍后重试。`)
    } finally {
      setLoading(false)
    }
  }, [startDate, endDate])

  useEffect(() => {
    fetchNeos()
  }, [fetchNeos])

  const filtered = useMemo(() => {
    let list = neos.slice()
    if (showOnlyHazard) list = list.filter((n) => n.is_potentially_hazardous_asteroid)
    list.sort((a, b) => {
      const aApproach = a.close_approach_data[0]
      const bApproach = b.close_approach_data[0]
      if (sortBy === 'distance') {
        return Number(aApproach?.miss_distance.kilometers || 0) - Number(bApproach?.miss_distance.kilometers || 0)
      }
      if (sortBy === 'size') {
        return (
          (b.estimated_diameter.kilometers.estimated_diameter_max || 0) -
          (a.estimated_diameter.kilometers.estimated_diameter_max || 0)
        )
      }
      return (
        Number(bApproach?.relative_velocity.kilometers_per_hour || 0) -
        Number(aApproach?.relative_velocity.kilometers_per_hour || 0)
      )
    })
    return list
  }, [neos, showOnlyHazard, sortBy])

  const stats = useMemo(() => {
    const total = neos.length
    const hazardous = neos.filter((n) => n.is_potentially_hazardous_asteroid).length
    const diameters = neos.map((n) => n.estimated_diameter.kilometers.estimated_diameter_max)
    const largest = diameters.length ? Math.max(...diameters) : 0
    return { total, hazardous, largest }
  }, [neos])

  const cardBg = isDark ? 'rgba(30, 28, 60, 0.55)' : 'rgba(255, 255, 255, 0.85)'
  const cardBorder = isDark ? 'rgba(124, 108, 240, 0.25)' : 'rgba(0, 0, 0, 0.08)'
  const textColor = isDark ? '#e8eaf6' : '#1a1a2e'
  const subTextColor = isDark ? 'rgba(232, 234, 246, 0.55)' : 'rgba(0, 0, 0, 0.55)'
  const inputBg = isDark ? 'rgba(15, 12, 41, 0.6)' : 'rgba(255, 255, 255, 0.9)'
  const inputBorder = isDark ? 'rgba(124, 108, 240, 0.35)' : 'rgba(0, 0, 0, 0.15)'
  const accent = isDark ? '#b8a8ff' : '#5a4fc8'

  const buttonPrimaryStyle: React.CSSProperties = {
    padding: '8px 16px',
    borderRadius: 6,
    border: 'none',
    cursor: 'pointer',
    fontSize: 13,
    fontWeight: 600,
    background: isDark
      ? 'linear-gradient(135deg, #7c6cf0, #9b8af0)'
      : 'linear-gradient(135deg, #6c5ce7, #8b7cf0)',
    color: '#fff',
    outline: 'none',
    transition: 'all 0.2s',
  }

  const buttonGhostStyle: React.CSSProperties = {
    padding: '8px 14px',
    borderRadius: 6,
    border: `1px solid ${isDark ? 'rgba(124, 108, 240, 0.4)' : 'rgba(124, 108, 240, 0.3)'}`,
    cursor: 'pointer',
    fontSize: 13,
    background: isDark ? 'rgba(255, 255, 255, 0.04)' : 'rgba(124, 108, 240, 0.05)',
    color: textColor,
    outline: 'none',
  }

  const inputStyle: React.CSSProperties = {
    padding: '8px 12px',
    borderRadius: 6,
    border: `1px solid ${inputBorder}`,
    background: inputBg,
    color: textColor,
    fontSize: 13,
    outline: 'none',
  }

  const loadingSpinnerStyle: React.CSSProperties = {
    width: 38,
    height: 38,
    border: `3px solid ${isDark ? 'rgba(124, 108, 240, 0.2)' : 'rgba(124, 108, 240, 0.15)'}`,
    borderTop: `3px solid ${isDark ? '#9b8af0' : '#7c6cf0'}`,
    borderRadius: '50%',
    animation: 'spin 1s linear infinite',
  }

  const loadingBoxStyle: React.CSSProperties = {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '60px 20px',
    color: isDark ? 'rgba(232, 234, 246, 0.6)' : 'rgba(0, 0, 0, 0.5)',
    fontSize: 14,
    gap: 12,
  }

  const hazardBg = isDark ? 'rgba(60, 28, 30, 0.55)' : 'rgba(254, 226, 226, 0.7)'
  const hazardBorder = isDark ? 'rgba(244, 67, 54, 0.4)' : 'rgba(239, 68, 68, 0.3)'
  const hazardText = isDark ? '#ff9999' : '#c53030'

  return (
    <div>
      <div
        style={{
          background: cardBg,
          border: `1px solid ${cardBorder}`,
          borderRadius: 12,
          padding: 20,
          marginBottom: 16,
        }}
      >
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))',
            gap: 14,
            marginBottom: 18,
          }}
        >
          <div
            style={{
              background: isDark ? 'rgba(15, 12, 41, 0.6)' : 'rgba(124, 108, 240, 0.08)',
              border: `1px solid ${cardBorder}`,
              borderRadius: 10,
              padding: 14,
            }}
          >
            <div style={{ fontSize: 12, color: subTextColor }}>时间段</div>
            <div style={{ fontSize: 15, fontWeight: 700, color: textColor, marginTop: 6 }}>
              {startDate} ~ {endDate}
            </div>
          </div>
          <div
            style={{
              background: isDark ? 'rgba(15, 12, 41, 0.6)' : 'rgba(124, 108, 240, 0.08)',
              border: `1px solid ${cardBorder}`,
              borderRadius: 10,
              padding: 14,
            }}
          >
            <div style={{ fontSize: 12, color: subTextColor }}>小行星总数</div>
            <div style={{ fontSize: 22, fontWeight: 700, color: accent, marginTop: 4 }}>
              {stats.total}
            </div>
          </div>
          <div
            style={{
              background: isDark ? 'rgba(60, 28, 30, 0.5)' : 'rgba(254, 226, 226, 0.6)',
              border: `1px solid ${hazardBorder}`,
              borderRadius: 10,
              padding: 14,
            }}
          >
            <div style={{ fontSize: 12, color: subTextColor }}>潜在危险</div>
            <div style={{ fontSize: 22, fontWeight: 700, color: hazardText, marginTop: 4 }}>
              {stats.hazardous}
            </div>
          </div>
          <div
            style={{
              background: isDark ? 'rgba(15, 12, 41, 0.6)' : 'rgba(124, 108, 240, 0.08)',
              border: `1px solid ${cardBorder}`,
              borderRadius: 10,
              padding: 14,
            }}
          >
            <div style={{ fontSize: 12, color: subTextColor }}>最大直径 (km)</div>
            <div style={{ fontSize: 22, fontWeight: 700, color: accent, marginTop: 4 }}>
              {stats.largest ? stats.largest.toFixed(2) : '—'}
            </div>
          </div>
        </div>

        <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', alignItems: 'center' }}>
          <label
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 6,
              fontSize: 13,
              color: textColor,
              cursor: 'pointer',
            }}
          >
            <input
              type="checkbox"
              checked={showOnlyHazard}
              onChange={(e) => setShowOnlyHazard(e.target.checked)}
            />
            只显示潜在危险小行星
          </label>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 13 }}>
            <span style={{ color: subTextColor }}>排序：</span>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as 'distance' | 'size' | 'velocity')}
              style={inputStyle}
            >
              <option value="distance" style={{ background: isDark ? '#1e1c3c' : '#fff' }}>
                距离由近到远
              </option>
              <option value="size" style={{ background: isDark ? '#1e1c3c' : '#fff' }}>
                体积由大到小
              </option>
              <option value="velocity" style={{ background: isDark ? '#1e1c3c' : '#fff' }}>
                速度由快到慢
              </option>
            </select>
          </div>
          <div style={{ flex: 1 }} />
          <button style={buttonPrimaryStyle} onClick={fetchNeos}>
            🔄 刷新数据
          </button>
        </div>
      </div>

      {loading && (
        <div style={loadingBoxStyle}>
          <div style={loadingSpinnerStyle} />
          <div>正在加载近地小行星数据...</div>
        </div>
      )}
      {!loading && error && (
        <div
          style={{
            background: isDark ? 'rgba(60, 28, 30, 0.55)' : 'rgba(254, 226, 226, 0.9)',
            border: `1px solid ${hazardBorder}`,
            borderRadius: 12,
            padding: 24,
            textAlign: 'center',
            color: hazardText,
          }}
        >
          <div style={{ fontSize: 36, marginBottom: 12 }}>⚠️</div>
          <div style={{ fontSize: 15, fontWeight: 600, marginBottom: 8 }}>加载失败</div>
          <div style={{ fontSize: 13, color: subTextColor, marginBottom: 16 }}>{error}</div>
          <button style={buttonPrimaryStyle} onClick={fetchNeos}>
            重新尝试
          </button>
        </div>
      )}
      {!loading && !error && filtered.length === 0 && (
        <div
          style={{
            background: cardBg,
            border: `1px solid ${cardBorder}`,
            borderRadius: 12,
            padding: 40,
            textAlign: 'center',
            color: subTextColor,
          }}
        >
          <div style={{ fontSize: 36, marginBottom: 12 }}>🔭</div>
          未找到符合条件的小行星
        </div>
      )}
      {!loading && !error && filtered.length > 0 && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12, animation: 'fadeIn 0.3s ease' }}>
          {filtered.map((neo) => {
            const approach = neo.close_approach_data[0]
            const diameter = neo.estimated_diameter.kilometers
            const minD = diameter.estimated_diameter_min
            const maxD = diameter.estimated_diameter_max
            const distance = approach ? Number(approach.miss_distance.kilometers) : 0
            const velocity = approach ? Number(approach.relative_velocity.kilometers_per_hour) : 0
            const isHazard = neo.is_potentially_hazardous_asteroid
            const bg = isHazard ? hazardBg : cardBg
            const border = isHazard ? hazardBorder : cardBorder
            return (
              <div
                key={neo.id}
                style={{
                  background: bg,
                  border: `1px solid ${border}`,
                  borderRadius: 12,
                  padding: 16,
                }}
              >
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 12, alignItems: 'flex-start' }}>
                  <div
                    style={{
                      width: 48,
                      height: 48,
                      borderRadius: 12,
                      background: isHazard
                        ? 'linear-gradient(135deg, #ef4444, #f97316)'
                        : isDark
                          ? 'linear-gradient(135deg, #7c6cf0, #9b8af0)'
                          : 'linear-gradient(135deg, #6c5ce7, #8b7cf0)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: 22,
                      flexShrink: 0,
                    }}
                  >
                    {isHazard ? '☄️' : '🌑'}
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, alignItems: 'center' }}>
                      <div
                        style={{
                          fontSize: 15,
                          fontWeight: 700,
                          color: isHazard ? hazardText : textColor,
                          wordBreak: 'break-word',
                        }}
                      >
                        {neo.name}
                      </div>
                      {isHazard && (
                        <span
                          style={{
                            display: 'inline-block',
                            padding: '3px 8px',
                            borderRadius: 10,
                            background: isDark ? 'rgba(239, 68, 68, 0.2)' : 'rgba(239, 68, 68, 0.12)',
                            color: hazardText,
                            fontSize: 11,
                            fontWeight: 700,
                            border: `1px solid ${hazardBorder}`,
                          }}
                        >
                          ⚠ 潜在危险
                        </span>
                      )}
                    </div>
                    <div
                      style={{
                        fontSize: 12,
                        color: subTextColor,
                        marginTop: 6,
                        wordBreak: 'break-word',
                      }}
                    >
                      ID: {neo.id}
                    </div>
                    <div
                      style={{
                        display: 'grid',
                        gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))',
                        gap: 10,
                        marginTop: 12,
                      }}
                    >
                      <div
                        style={{
                          fontSize: 12,
                          color: subTextColor,
                          background: isDark ? 'rgba(15, 12, 41, 0.4)' : 'rgba(0,0,0,0.04)',
                          padding: '8px 10px',
                          borderRadius: 6,
                        }}
                      >
                        <div>📏 直径范围 (km)</div>
                        <div style={{ fontSize: 13, fontWeight: 700, color: textColor, marginTop: 2 }}>
                          {minD.toFixed(3)} ~ {maxD.toFixed(3)}
                        </div>
                      </div>
                      <div
                        style={{
                          fontSize: 12,
                          color: subTextColor,
                          background: isDark ? 'rgba(15, 12, 41, 0.4)' : 'rgba(0,0,0,0.04)',
                          padding: '8px 10px',
                          borderRadius: 6,
                        }}
                      >
                        <div>🚀 飞行速度 (km/h)</div>
                        <div style={{ fontSize: 13, fontWeight: 700, color: textColor, marginTop: 2 }}>
                          {formatNumber(velocity, 0)}
                        </div>
                      </div>
                      <div
                        style={{
                          fontSize: 12,
                          color: subTextColor,
                          background: isDark ? 'rgba(15, 12, 41, 0.4)' : 'rgba(0,0,0,0.04)',
                          padding: '8px 10px',
                          borderRadius: 6,
                        }}
                      >
                        <div>📍 距地球距离 (km)</div>
                        <div style={{ fontSize: 13, fontWeight: 700, color: textColor, marginTop: 2 }}>
                          {formatNumber(distance, 0)}
                        </div>
                      </div>
                      {approach && (
                        <div
                          style={{
                            fontSize: 12,
                            color: subTextColor,
                            background: isDark ? 'rgba(15, 12, 41, 0.4)' : 'rgba(0,0,0,0.04)',
                            padding: '8px 10px',
                            borderRadius: 6,
                          }}
                        >
                          <div>🕐 接近时间</div>
                          <div style={{ fontSize: 13, fontWeight: 700, color: textColor, marginTop: 2 }}>
                            {approach.close_approach_date_full}
                          </div>
                        </div>
                      )}
                    </div>
                    <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginTop: 12 }}>
                      <button
                        style={buttonGhostStyle}
                        onClick={async () => {
                          const ok = await copyText(
                            `${neo.name} - 直径: ${minD.toFixed(3)}~${maxD.toFixed(3)}km, 距离地球: ${formatNumber(distance, 0)}km, 速度: ${formatNumber(velocity, 0)}km/h`
                          )
                          showToast(ok ? '数据已复制' : '复制失败')
                        }}
                      >
                        📋 复制信息
                      </button>
                      <button style={buttonGhostStyle} onClick={() => openExternal(neo.nasa_jpl_url)}>
                        🌐 查看详情
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            )
          })}
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
            background: isDark ? 'rgba(30, 28, 60, 0.95)' : 'rgba(255, 255, 255, 0.95)',
            border: `1px solid ${isDark ? 'rgba(124, 108, 240, 0.5)' : 'rgba(124, 108, 240, 0.3)'}`,
            borderRadius: 8,
            fontSize: 13,
            color: accent,
            zIndex: 999,
            boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
          }}
        >
          {toast}
        </div>
      )}
    </div>
  )
}

/* ---------- ISS Tab ---------- */
function IssTab({ isDark }: { isDark: boolean }) {
  const [data, setData] = useState<IssData | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [autoRefresh, setAutoRefresh] = useState(true)
  const [lastUpdate, setLastUpdate] = useState<Date | null>(null)
  const { toast, showToast } = useToast()

  const fetchIss = useCallback(async () => {
    setError(null)
    try {
      const url = 'https://api.wheretheiss.at/v1/satellites/25544'
      const res = await fetch(url)
      if (!res.ok) throw new Error(`HTTP ${res.status}`)
      const json = (await res.json()) as IssData
      setData(json)
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

  const mapSize = { w: 720, h: 360 }
  const markerX = data ? ((data.longitude + 180) / 360) * mapSize.w : mapSize.w / 2
  const markerY = data ? ((90 - data.latitude) / 180) * mapSize.h : mapSize.h / 2

  const cardBg = isDark ? 'rgba(30, 28, 60, 0.55)' : 'rgba(255, 255, 255, 0.85)'
  const cardBorder = isDark ? 'rgba(124, 108, 240, 0.25)' : 'rgba(0, 0, 0, 0.08)'
  const textColor = isDark ? '#e8eaf6' : '#1a1a2e'
  const subTextColor = isDark ? 'rgba(232, 234, 246, 0.55)' : 'rgba(0, 0, 0, 0.55)'
  const accent = isDark ? '#b8a8ff' : '#5a4fc8'

  const buttonPrimaryStyle: React.CSSProperties = {
    padding: '8px 16px',
    borderRadius: 6,
    border: 'none',
    cursor: 'pointer',
    fontSize: 13,
    fontWeight: 600,
    background: isDark
      ? 'linear-gradient(135deg, #7c6cf0, #9b8af0)'
      : 'linear-gradient(135deg, #6c5ce7, #8b7cf0)',
    color: '#fff',
    outline: 'none',
    transition: 'all 0.2s',
  }

  const buttonGhostStyle: React.CSSProperties = {
    padding: '8px 14px',
    borderRadius: 6,
    border: `1px solid ${isDark ? 'rgba(124, 108, 240, 0.4)' : 'rgba(124, 108, 240, 0.3)'}`,
    cursor: 'pointer',
    fontSize: 13,
    background: isDark ? 'rgba(255, 255, 255, 0.04)' : 'rgba(124, 108, 240, 0.05)',
    color: textColor,
    outline: 'none',
  }

  const loadingSpinnerStyle: React.CSSProperties = {
    width: 38,
    height: 38,
    border: `3px solid ${isDark ? 'rgba(124, 108, 240, 0.2)' : 'rgba(124, 108, 240, 0.15)'}`,
    borderTop: `3px solid ${isDark ? '#9b8af0' : '#7c6cf0'}`,
    borderRadius: '50%',
    animation: 'spin 1s linear infinite',
  }

  return (
    <div>
      <div
        style={{
          background: cardBg,
          border: `1px solid ${cardBorder}`,
          borderRadius: 12,
          padding: 20,
          marginBottom: 16,
        }}
      >
        <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', alignItems: 'center' }}>
          <span
            style={{
              display: 'inline-block',
              padding: '4px 12px',
              borderRadius: 20,
              background: isDark ? 'rgba(124, 108, 240, 0.18)' : 'rgba(124, 108, 240, 0.1)',
              color: accent,
              fontSize: 13,
              fontWeight: 700,
              border: `1px solid ${isDark ? 'rgba(124, 108, 240, 0.3)' : 'rgba(124, 108, 240, 0.2)'}`,
            }}
          >
            🛰️ 国际空间站 (ISS) · 实时位置
          </span>
          <div style={{ flex: 1 }} />
          <label
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 6,
              fontSize: 13,
              color: textColor,
              cursor: 'pointer',
            }}
          >
            <input
              type="checkbox"
              checked={autoRefresh}
              onChange={(e) => setAutoRefresh(e.target.checked)}
            />
            每 10 秒自动刷新
          </label>
          <button style={buttonPrimaryStyle} onClick={fetchIss}>
            🔄 立即刷新
          </button>
        </div>
      </div>

      {error && (
        <div
          style={{
            background: isDark ? 'rgba(60, 28, 30, 0.55)' : 'rgba(254, 226, 226, 0.9)',
            border: `1px solid ${isDark ? 'rgba(244, 67, 54, 0.4)' : 'rgba(239, 68, 68, 0.3)'}`,
            borderRadius: 12,
            padding: 24,
            textAlign: 'center',
          }}
        >
          <div style={{ fontSize: 36, marginBottom: 12 }}>⚠️</div>
          <div style={{ fontSize: 15, fontWeight: 600, color: isDark ? '#ffb3b3' : '#c53030', marginBottom: 8 }}>
            加载失败
          </div>
          <div style={{ fontSize: 13, color: subTextColor, marginBottom: 16 }}>{error}</div>
          <button style={buttonPrimaryStyle} onClick={fetchIss}>
            重新尝试
          </button>
        </div>
      )}
      {!error && !data && (
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '60px 20px',
            color: subTextColor,
            fontSize: 14,
            gap: 12,
          }}
        >
          <div style={loadingSpinnerStyle} />
          <div>正在定位国际空间站...</div>
        </div>
      )}
      {!error && data && (
        <div
          style={{
            background: cardBg,
            border: `1px solid ${cardBorder}`,
            borderRadius: 12,
            padding: 20,
            animation: 'fadeIn 0.3s ease',
          }}
        >
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
                background: isDark ? 'rgba(15, 12, 41, 0.6)' : 'rgba(124, 108, 240, 0.08)',
                border: `1px solid ${cardBorder}`,
                borderRadius: 10,
                padding: 14,
              }}
            >
              <div style={{ fontSize: 12, color: subTextColor }}>纬度</div>
              <div style={{ fontSize: 22, fontWeight: 700, color: accent, marginTop: 6 }}>
                {data.latitude.toFixed(4)}°
              </div>
            </div>
            <div
              style={{
                background: isDark ? 'rgba(15, 12, 41, 0.6)' : 'rgba(124, 108, 240, 0.08)',
                border: `1px solid ${cardBorder}`,
                borderRadius: 10,
                padding: 14,
              }}
            >
              <div style={{ fontSize: 12, color: subTextColor }}>经度</div>
              <div style={{ fontSize: 22, fontWeight: 700, color: accent, marginTop: 6 }}>
                {data.longitude.toFixed(4)}°
              </div>
            </div>
            <div
              style={{
                background: isDark ? 'rgba(15, 12, 41, 0.6)' : 'rgba(124, 108, 240, 0.08)',
                border: `1px solid ${cardBorder}`,
                borderRadius: 10,
                padding: 14,
              }}
            >
              <div style={{ fontSize: 12, color: subTextColor }}>海拔高度 (km)</div>
              <div style={{ fontSize: 22, fontWeight: 700, color: accent, marginTop: 6 }}>
                {data.altitude.toFixed(2)}
              </div>
            </div>
            <div
              style={{
                background: isDark ? 'rgba(15, 12, 41, 0.6)' : 'rgba(124, 108, 240, 0.08)',
                border: `1px solid ${cardBorder}`,
                borderRadius: 10,
                padding: 14,
              }}
            >
              <div style={{ fontSize: 12, color: subTextColor }}>飞行速度 (km/h)</div>
              <div style={{ fontSize: 22, fontWeight: 700, color: accent, marginTop: 6 }}>
                {formatNumber(data.velocity, 0)}
              </div>
            </div>
            <div
              style={{
                background: isDark ? 'rgba(15, 12, 41, 0.6)' : 'rgba(124, 108, 240, 0.08)',
                border: `1px solid ${cardBorder}`,
                borderRadius: 10,
                padding: 14,
              }}
            >
              <div style={{ fontSize: 12, color: subTextColor }}>可见性</div>
              <div style={{ fontSize: 20, fontWeight: 700, color: accent, marginTop: 6 }}>
                {data.visibility === 'daylight' ? '☀️ 白天' : data.visibility === 'eclipsed' ? '🌑 阴影' : data.visibility}
              </div>
            </div>
            <div
              style={{
                background: isDark ? 'rgba(15, 12, 41, 0.6)' : 'rgba(124, 108, 240, 0.08)',
                border: `1px solid ${cardBorder}`,
                borderRadius: 10,
                padding: 14,
              }}
            >
              <div style={{ fontSize: 12, color: subTextColor }}>最后更新</div>
              <div style={{ fontSize: 18, fontWeight: 700, color: accent, marginTop: 6 }}>
                {lastUpdate?.toLocaleString('zh-CN', { hour12: false })}
              </div>
            </div>
          </div>

          <div
            style={{
              position: 'relative',
              width: '100%',
              maxWidth: '100%',
              aspectRatio: `${mapSize.w} / ${mapSize.h}`,
              background: isDark ? 'linear-gradient(135deg, #1a1a3e 0%, #0d0d2b 100%)' : 'linear-gradient(135deg, #e8f0fe 0%, #c7d4f5 100%)',
              border: `1px solid ${cardBorder}`,
              borderRadius: 10,
              overflow: 'hidden',
            }}
          >
            <svg
              viewBox={`0 0 ${mapSize.w} ${mapSize.h}`}
              preserveAspectRatio="xMidYMid meet"
              style={{ width: '100%', height: '100%', display: 'block' }}
            >
              {Array.from({ length: 13 }).map((_, i) => {
                const x = (i / 12) * mapSize.w
                return (
                  <line
                    key={`v${i}`}
                    x1={x}
                    y1={0}
                    x2={x}
                    y2={mapSize.h}
                    stroke={isDark ? 'rgba(124, 108, 240, 0.12)' : 'rgba(124, 108, 240, 0.2)'}
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
                    stroke={isDark ? 'rgba(124, 108, 240, 0.12)' : 'rgba(124, 108, 240, 0.2)'}
                    strokeWidth={1}
                  />
                )
              })}
              <line
                x1={0}
                y1={mapSize.h / 2}
                x2={mapSize.w}
                y2={mapSize.h / 2}
                stroke={isDark ? 'rgba(124, 108, 240, 0.3)' : 'rgba(124, 108, 240, 0.35)'}
                strokeDasharray="4 4"
              />
              <line
                x1={mapSize.w / 2}
                y1={0}
                x2={mapSize.w / 2}
                y2={mapSize.h}
                stroke={isDark ? 'rgba(124, 108, 240, 0.3)' : 'rgba(124, 108, 240, 0.35)'}
                strokeDasharray="4 4"
              />
              <g fill={isDark ? 'rgba(124, 108, 240, 0.25)' : 'rgba(100, 100, 160, 0.15)'} stroke={isDark ? 'rgba(124, 108, 240, 0.5)' : 'rgba(100, 100, 160, 0.35)'} strokeWidth={1}>
                <path d="M 90 90 L 170 75 L 200 110 L 190 170 L 150 195 L 110 180 L 80 140 Z" />
                <path d="M 180 200 L 220 210 L 230 270 L 200 320 L 175 300 L 170 240 Z" />
                <path d="M 340 80 L 410 75 L 420 130 L 380 150 L 345 135 Z" />
                <path d="M 355 155 L 420 155 L 435 210 L 410 280 L 375 290 L 350 230 Z" />
                <path d="M 415 70 L 600 70 L 640 140 L 620 195 L 540 205 L 470 180 L 420 140 Z" />
                <path d="M 580 250 L 650 245 L 660 285 L 620 305 L 585 285 Z" />
              </g>
              <circle cx={markerX} cy={markerY} r={14} fill="rgba(255, 193, 7, 0.2)" />
              <circle cx={markerX} cy={markerY} r={12} fill="rgba(255, 193, 7, 0.25)" />
              <circle cx={markerX} cy={markerY} r={7} fill="#ffc107" stroke="#fff" strokeWidth={1.5}>
                <animate attributeName="r" values="6;10;6" dur="1.6s" repeatCount="indefinite" />
              </circle>
              <circle cx={markerX} cy={markerY} r={3} fill="#fff" />
              <text
                x={markerX + 16}
                y={markerY - 10}
                fill={isDark ? '#ffd54f' : '#d97706'}
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
              color: subTextColor,
              textAlign: 'center',
            }}
          >
            本示意图为简化地图，仅用于展示 ISS 大致地理位置。
          </div>

          <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', marginTop: 16 }}>
            <button
              style={buttonGhostStyle}
              onClick={async () => {
                const ok = await copyText(
                  `国际空间站 (ISS) 位置\n纬度: ${data.latitude.toFixed(4)}°\n经度: ${data.longitude.toFixed(4)}°\n海拔: ${data.altitude.toFixed(2)} km\n速度: ${formatNumber(data.velocity, 0)} km/h`
                )
                showToast(ok ? '位置信息已复制' : '复制失败')
              }}
            >
              📋 复制坐标
            </button>
            <button
              style={buttonGhostStyle}
              onClick={() =>
                openExternal(
                  `https://www.openstreetmap.org/?mlat=${data.latitude.toFixed(4)}&mlon=${data.longitude.toFixed(4)}#map=4/${data.latitude.toFixed(2)}/${data.longitude.toFixed(2)}`
                )
              }
            >
              🗺️ OpenStreetMap
            </button>
            <button
              style={buttonGhostStyle}
              onClick={() =>
                openExternal(`https://www.google.com/maps?q=${data.latitude},${data.longitude}`)
              }
            >
              🌍 Google Maps
            </button>
            <button
              style={buttonGhostStyle}
              onClick={() => openExternal('https://spotthestation.nasa.gov/')}
            >
              🔭 观测指南
            </button>
          </div>
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
            background: isDark ? 'rgba(30, 28, 60, 0.95)' : 'rgba(255, 255, 255, 0.95)',
            border: `1px solid ${isDark ? 'rgba(124, 108, 240, 0.5)' : 'rgba(124, 108, 240, 0.3)'}`,
            borderRadius: 8,
            fontSize: 13,
            color: accent,
            zIndex: 999,
            boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
          }}
        >
          {toast}
        </div>
      )}
    </div>
  )
}

/* ---------- 太空知识 Tab ---------- */
interface SpaceFact {
  icon: string
  title: string
  content: string
  source?: string
}

const SPACE_FACTS: SpaceFact[] = [
  {
    icon: '☀️',
    title: '太阳的质量',
    content:
      '太阳占整个太阳系质量的约 99.86%。它的质量约为 1.989 × 10³⁰ 千克，是地球的 33 万多倍。太阳每秒将约 6 亿吨氢转化为氦，释放出巨大的能量。',
  },
  {
    icon: '🌙',
    title: '月球正在远离地球',
    content:
      '月球正以每年约 3.8 厘米的速度远离地球。同时，地球的自转也在逐渐减慢，每 100 年一天的时间会延长约 1.7 毫秒。',
  },
  {
    icon: '🌍',
    title: '地球的自转速度',
    content:
      '地球在赤道处的自转线速度约为 1,670 公里/小时。而地球围绕太阳公转的速度约为 107,200 公里/小时，即每秒约 30 公里。',
  },
  {
    icon: '⚫',
    title: '黑洞的存在',
    content:
      '银河系中心有一个超大质量黑洞，名为 "人马座 A*"，质量约为太阳的 430 万倍。黑洞的引力强大到连光都无法逃脱。',
  },
  {
    icon: '⭐',
    title: '恒星数量',
    content:
      '可观测宇宙中估计有 10²² 到 10²⁴ 颗恒星。仅我们所在的银河系就有超过 1,000 亿颗恒星。',
  },
  {
    icon: '🚀',
    title: '旅行者 1 号',
    content:
      '旅行者 1 号是目前距离地球最远的人造物体，已于 2012 年进入星际空间。它以约 17 公里/秒的速度飞行，携带的 "金唱片" 记录了地球上的各种声音和图像。',
  },
  {
    icon: '🌌',
    title: '银河系的大小',
    content:
      '银河系的直径约为 10 万光年，中心厚度约为 1 万光年。光在真空中的速度约为每秒 30 万公里，一光年约等于 9.46 万亿公里。',
  },
  {
    icon: '☄️',
    title: '小行星带',
    content:
      '火星和木星之间的小行星带包含数百万颗小行星。其中最大的 "谷神星" 直径约为 950 公里，被归类为矮行星。',
  },
  {
    icon: '🛰️',
    title: '国际空间站',
    content:
      '国际空间站 (ISS) 是人类有史以来建造的最大的太空结构，长约 109 米，宽约 73 米。它在约 400 公里的高度绕地球运行，每 90 分钟绕地球一圈。',
  },
  {
    icon: '🌡️',
    title: '太空的温度',
    content:
      '太空中的温度因位置而异。远离恒星的深空温度约为 -270.45°C（接近绝对零度）。而在阳光下的地球轨道附近，温度可高达 120°C。',
  },
  {
    icon: '🌠',
    title: '流星雨的由来',
    content:
      '流星雨是当地球穿过彗星留下的尘埃和碎片轨迹时发生的现象。著名的流星雨包括英仙座流星雨（8 月）、双子座流星雨（12 月）等。',
  },
  {
    icon: '🪐',
    title: '木星的大红斑',
    content:
      '木星表面的大红斑是一个已经持续存在至少 350 年的巨型风暴，直径可容纳两到三个地球。风速可达约 650 公里/小时。',
  },
  {
    icon: '🌓',
    title: '月球的自转',
    content:
      '月球的自转周期与绕地球公转的周期相同（约 27.3 天），因此我们永远只能看到月球的同一面（近侧），另外约 41% 的月球表面是地球上无法直接看到的。',
  },
  {
    icon: '🌞',
    title: '太阳的寿命',
    content:
      '太阳目前约 46 亿岁，正处于主序星阶段。它还有约 50 亿年的寿命，之后会膨胀为红巨星，最终坍缩成白矮星。',
  },
  {
    icon: '🔭',
    title: '詹姆斯·韦伯望远镜',
    content:
      '詹姆斯·韦伯太空望远镜 (JWST) 是目前最强大的太空望远镜，运行在距离地球约 150 万公里的日地系统 L2 拉格朗日点。它能观测到 135 亿光年外的早期宇宙。',
  },
  {
    icon: '🌌',
    title: '暗物质与暗能量',
    content:
      '宇宙中约 68% 是暗能量，27% 是暗物质，只有约 5% 是我们熟悉的普通物质。暗物质和暗能量的本质仍是现代物理学最大的谜团之一。',
  },
]

function FactsTab({ isDark }: { isDark: boolean }) {
  const [index, setIndex] = useState(0)
  const fact = SPACE_FACTS[index]

  const cardBg = isDark ? 'rgba(30, 28, 60, 0.55)' : 'rgba(255, 255, 255, 0.85)'
  const cardBorder = isDark ? 'rgba(124, 108, 240, 0.25)' : 'rgba(0, 0, 0, 0.08)'
  const textColor = isDark ? '#e8eaf6' : '#1a1a2e'
  const subTextColor = isDark ? 'rgba(232, 234, 246, 0.55)' : 'rgba(0, 0, 0, 0.55)'
  const accent = isDark ? '#b8a8ff' : '#5a4fc8'

  const buttonPrimaryStyle: React.CSSProperties = {
    padding: '8px 16px',
    borderRadius: 6,
    border: 'none',
    cursor: 'pointer',
    fontSize: 13,
    fontWeight: 600,
    background: isDark
      ? 'linear-gradient(135deg, #7c6cf0, #9b8af0)'
      : 'linear-gradient(135deg, #6c5ce7, #8b7cf0)',
    color: '#fff',
    outline: 'none',
    transition: 'all 0.2s',
  }

  const buttonGhostStyle: React.CSSProperties = {
    padding: '8px 14px',
    borderRadius: 6,
    border: `1px solid ${isDark ? 'rgba(124, 108, 240, 0.4)' : 'rgba(124, 108, 240, 0.3)'}`,
    cursor: 'pointer',
    fontSize: 13,
    background: isDark ? 'rgba(255, 255, 255, 0.04)' : 'rgba(124, 108, 240, 0.05)',
    color: textColor,
    outline: 'none',
  }

  const goRandom = () => {
    let next = index
    if (SPACE_FACTS.length > 1) {
      while (next === index) {
        next = Math.floor(Math.random() * SPACE_FACTS.length)
      }
    }
    setIndex(next)
  }

  return (
    <div style={{ animation: 'fadeIn 0.3s ease' }}>
      <div
        style={{
          background: cardBg,
          border: `1px solid ${cardBorder}`,
          borderRadius: 12,
          padding: 20,
          marginBottom: 16,
        }}
      >
        <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', alignItems: 'center' }}>
          <span
            style={{
              display: 'inline-block',
              padding: '4px 12px',
              borderRadius: 20,
              background: isDark ? 'rgba(124, 108, 240, 0.18)' : 'rgba(124, 108, 240, 0.1)',
              color: accent,
              fontSize: 13,
              fontWeight: 700,
              border: `1px solid ${isDark ? 'rgba(124, 108, 240, 0.3)' : 'rgba(124, 108, 240, 0.2)'}`,
            }}
          >
            📚 太空冷知识 · {index + 1} / {SPACE_FACTS.length}
          </span>
          <div style={{ flex: 1 }} />
          <button style={buttonGhostStyle} onClick={() => setIndex(Math.max(0, index - 1))}>
            ← 上一条
          </button>
          <button style={buttonPrimaryStyle} onClick={goRandom}>
            🎲 随机一条
          </button>
          <button
            style={buttonGhostStyle}
            onClick={() => setIndex(Math.min(SPACE_FACTS.length - 1, index + 1))}
          >
            下一条 →
          </button>
        </div>
      </div>

      <div
        style={{
          background: cardBg,
          border: `1px solid ${cardBorder}`,
          borderRadius: 12,
          padding: 28,
        }}
      >
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 16,
            marginBottom: 18,
          }}
        >
          <div
            style={{
              width: 64,
              height: 64,
              borderRadius: 16,
              background: isDark
                ? 'linear-gradient(135deg, #7c6cf0, #9b8af0)'
                : 'linear-gradient(135deg, #6c5ce7, #8b7cf0)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: 32,
              flexShrink: 0,
            }}
          >
            {fact.icon}
          </div>
          <h2 style={{ margin: 0, fontSize: 22, color: isDark ? '#fff' : '#1a1a2e' }}>
            {fact.title}
          </h2>
        </div>
        <p
          style={{
            fontSize: 15,
            lineHeight: 1.9,
            color: isDark ? 'rgba(232, 234, 246, 0.85)' : 'rgba(0, 0, 0, 0.75)',
            margin: 0,
          }}
        >
          {fact.content}
        </p>
        <div
          style={{
            marginTop: 20,
            paddingTop: 16,
            borderTop: `1px dashed ${isDark ? 'rgba(124, 108, 240, 0.25)' : 'rgba(0, 0, 0, 0.1)'}`,
            fontSize: 12,
            color: subTextColor,
            textAlign: 'center',
          }}
        >
          💡 点击 "随机一条" 探索更多太空知识
        </div>
      </div>

      <div
        style={{
          marginTop: 16,
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))',
          gap: 10,
        }}
      >
        {SPACE_FACTS.map((f, i) => (
          <button
            key={i}
            onClick={() => setIndex(i)}
            style={{
              padding: '12px 14px',
              borderRadius: 10,
              border: i === index
                ? `1px solid ${accent}`
                : `1px solid ${cardBorder}`,
              background: i === index
                ? (isDark ? 'rgba(124, 108, 240, 0.15)' : 'rgba(124, 108, 240, 0.1)')
                : cardBg,
              cursor: 'pointer',
              textAlign: 'left',
              fontSize: 13,
              color: textColor,
              outline: 'none',
              transition: 'all 0.15s',
            }}
          >
            <div style={{ fontSize: 20, marginBottom: 4 }}>{f.icon}</div>
            <div style={{ fontWeight: 600, fontSize: 13 }}>{f.title}</div>
          </button>
        ))}
      </div>
    </div>
  )
}

/* ---------- 主组件 ---------- */
const TABS: { key: 'apod' | 'asteroid' | 'iss' | 'facts'; label: string; icon: string }[] = [
  { key: 'apod', label: '每日天文', icon: '🌌' },
  { key: 'asteroid', label: '小行星', icon: '☄️' },
  { key: 'iss', label: 'ISS位置', icon: '🛰️' },
  { key: 'facts', label: '太空知识', icon: '📚' },
]

const keyframeStyle = `
@keyframes spin { to { transform: rotate(360deg); } }
@keyframes fadeIn { from { opacity: 0; transform: translateY(8px); } to { opacity: 1; transform: translateY(0); } }
`

export default function SpaceExplorerPro() {
  const theme = useStore((s) => s.theme)
  const isDark = theme === 'dark'
  const [tab, setTab] = useState<TabKey>('apod')

  const containerBg = isDark
    ? 'linear-gradient(135deg, #0f0c29 0%, #302b63 50%, #24243e 100%)'
    : 'linear-gradient(135deg, #f0f4ff 0%, #e8eefc 50%, #dde5f7 100%)'

  const textColor = isDark ? '#e8eaf6' : '#1a1a2e'
  const subTextColor = isDark ? 'rgba(232, 234, 246, 0.55)' : 'rgba(0, 0, 0, 0.55)'
  const headerBg = isDark ? 'rgba(15, 12, 41, 0.6)' : 'rgba(255, 255, 255, 0.7)'
  const tabsBg = isDark ? 'rgba(15, 12, 41, 0.4)' : 'rgba(255, 255, 255, 0.5)'

  return (
    <div
      style={{
        width: '100%',
        height: '100%',
        background: containerBg,
        color: textColor,
        fontFamily:
          "-apple-system, BlinkMacSystemFont, 'Segoe UI', 'PingFang SC', 'Microsoft YaHei', sans-serif",
        display: 'flex',
        flexDirection: 'column',
        overflow: 'hidden',
      }}
    >
      <style>{keyframeStyle}</style>
      <div
        style={{
          padding: '16px 24px',
          borderBottom: `1px solid ${isDark ? 'rgba(124, 108, 240, 0.25)' : 'rgba(124, 108, 240, 0.15)'}`,
          background: headerBg,
          backdropFilter: 'blur(8px)',
        }}
      >
        <h1
          style={{
            margin: 0,
            fontSize: 22,
            fontWeight: 700,
            letterSpacing: 1,
            background: isDark
              ? 'linear-gradient(90deg, #b8a8ff, #7c6cf0)'
              : 'linear-gradient(90deg, #5a4fc8, #7c6cf0)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
          }}
        >
          🚀 宇宙探索 · Space Explorer Pro
        </h1>
        <div style={{ fontSize: 12, color: subTextColor, marginTop: 4 }}>
          接入 NASA Open API 与 wheretheiss.at · 探索宇宙奥秘
        </div>
      </div>

      <div
        style={{
          display: 'flex',
          gap: 6,
          padding: '12px 16px',
          borderBottom: `1px solid ${isDark ? 'rgba(124, 108, 240, 0.2)' : 'rgba(124, 108, 240, 0.12)'}`,
          background: tabsBg,
          flexWrap: 'wrap',
        }}
      >
        {TABS.map((t) => {
          const active = tab === t.key
          return (
            <button
              key={t.key}
              onClick={() => setTab(t.key)}
              style={{
                padding: '8px 16px',
                borderRadius: 10,
                border: active
                  ? `1px solid ${isDark ? 'rgba(124, 108, 240, 0.5)' : 'rgba(124, 108, 240, 0.3)'}`
                  : '1px solid transparent',
                cursor: 'pointer',
                fontSize: 13,
                fontWeight: active ? 700 : 500,
                background: active
                  ? (isDark
                      ? 'linear-gradient(135deg, #7c6cf0, #9b8af0)'
                      : 'linear-gradient(135deg, #6c5ce7, #8b7cf0)')
                  : (isDark ? 'rgba(255, 255, 255, 0.04)' : 'rgba(124, 108, 240, 0.05)'),
                color: active ? '#fff' : textColor,
                transition: 'all 0.2s',
                outline: 'none',
              }}
            >
              {t.icon} {t.label}
            </button>
          )
        })}
      </div>

      <div style={{ flex: 1, overflowY: 'auto', padding: 20 }}>
        {tab === 'apod' && <ApodTab isDark={isDark} />}
        {tab === 'asteroid' && <AsteroidTab isDark={isDark} />}
        {tab === 'iss' && <IssTab isDark={isDark} />}
        {tab === 'facts' && <FactsTab isDark={isDark} />}
      </div>
    </div>
  )
}
