import { useState, useEffect, useRef, useCallback, memo } from 'react'
import { loadFromStorage, debouncedSaveToStorage } from '../../store/storageUtils'

export type WidgetId = 'clock' | 'pulse' | 'weather' | 'note' | 'focus' | 'systemMonitor' | 'quickLaunch' | 'musicPlayer' | 'airQuality' | 'dailyPoem'

interface WidgetLayout {
  id: WidgetId
  visible: boolean
  x: number
  y: number
  width: number
  height: number
}

interface WidgetState {
  layout: WidgetLayout[]
  note: string
  focusMinutes: number
  quickLaunchApps: string[]
  musicTrack: { title: string; artist: string; playing: boolean; progress: number }
  poemIndex: number
  aqiCity: string
}

const WIDGET_STORAGE_KEY = 'weblinux-widgets-v2'
const WIDGET_DEFAULT_WIDTH = 280
const WIDGET_MIN_WIDTH = 220
const WIDGET_MIN_HEIGHT = 120

const DEFAULT_LAYOUT: WidgetLayout[] = [
  { id: 'clock', visible: true, x: 24, y: 24, width: WIDGET_DEFAULT_WIDTH, height: 140 },
  { id: 'weather', visible: true, x: 24, y: 188, width: WIDGET_DEFAULT_WIDTH, height: 160 },
  { id: 'pulse', visible: true, x: 328, y: 24, width: WIDGET_DEFAULT_WIDTH, height: 160 },
  { id: 'focus', visible: true, x: 328, y: 208, width: WIDGET_DEFAULT_WIDTH, height: 200 },
  { id: 'airQuality', visible: false, x: 632, y: 24, width: WIDGET_DEFAULT_WIDTH, height: 160 },
  { id: 'dailyPoem', visible: false, x: 632, y: 212, width: WIDGET_DEFAULT_WIDTH, height: 180 },
  { id: 'note', visible: false, x: 24, y: 432, width: WIDGET_DEFAULT_WIDTH, height: 180 },
  { id: 'systemMonitor', visible: false, x: 328, y: 432, width: WIDGET_DEFAULT_WIDTH, height: 200 },
  { id: 'quickLaunch', visible: false, x: 632, y: 416, width: WIDGET_DEFAULT_WIDTH, height: 140 },
  { id: 'musicPlayer', visible: false, x: 24, y: 632, width: WIDGET_DEFAULT_WIDTH, height: 160 },
]

function loadWidgetState(): WidgetState {
  const raw = loadFromStorage<Partial<WidgetState>>(WIDGET_STORAGE_KEY, {})
  const incoming = Array.isArray(raw.layout) ? raw.layout : []
  const merged: WidgetLayout[] = DEFAULT_LAYOUT.map((d) => {
    const found = incoming.find((i) => i && i.id === d.id)
    return found
      ? {
          ...d,
          visible: found.visible,
          x: found.x ?? d.x,
          y: found.y ?? d.y,
          width: found.width ?? d.width,
          height: found.height ?? d.height,
        }
      : d
  })
  return {
    layout: merged,
    note: typeof raw.note === 'string' ? raw.note : '',
    focusMinutes: typeof raw.focusMinutes === 'number' ? raw.focusMinutes : 25,
    quickLaunchApps: Array.isArray(raw.quickLaunchApps) ? raw.quickLaunchApps : ['files', 'browser', 'terminal', 'settings'],
    musicTrack: raw.musicTrack && typeof raw.musicTrack === 'object'
      ? {
          title: raw.musicTrack.title ?? '未在播放',
          artist: raw.musicTrack.artist ?? '-',
          playing: raw.musicTrack.playing ?? false,
          progress: raw.musicTrack.progress ?? 0,
        }
      : { title: '夜曲', artist: '周杰伦', playing: false, progress: 0.35 },
    poemIndex: typeof raw.poemIndex === 'number' ? raw.poemIndex : 0,
    aqiCity: typeof raw.aqiCity === 'string' ? raw.aqiCity : '北京',
  }
}

function CloseGlyph() {
  return (
    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
      <path d="M18 6L6 18M6 6l12 12" />
    </svg>
  )
}
function DragGlyph() {
  return (
    <svg width="10" height="10" viewBox="0 0 24 24" fill="currentColor">
      <circle cx="9" cy="6" r="1.5" /><circle cx="15" cy="6" r="1.5" />
      <circle cx="9" cy="12" r="1.5" /><circle cx="15" cy="12" r="1.5" />
      <circle cx="9" cy="18" r="1.5" /><circle cx="15" cy="18" r="1.5" />
    </svg>
  )
}
function ResizeGlyph() {
  return (
    <svg width="10" height="10" viewBox="0 0 24 24" fill="currentColor" opacity="0.4">
      <path d="M22 22L12 22L22 12L22 22Z" />
      <path d="M22 16L16 22L22 22L22 16Z" fillOpacity="0.6" />
      <path d="M16 22L22 16" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" fill="none" />
      <path d="M12 22L22 12" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" fill="none" />
    </svg>
  )
}

const ClockWidget = memo(function ClockWidget() {
  const [now, setNow] = useState(new Date())
  useEffect(() => {
    const t = setInterval(() => setNow(new Date()), 1000)
    return () => clearInterval(t)
  }, [])

  const seconds = now.getSeconds()
  const minutes = now.getMinutes()
  const hours = now.getHours() % 12
  const secAngle = (seconds / 60) * 360
  const minAngle = (minutes / 60) * 360 + (seconds / 60) * 6
  const hourAngle = (hours / 12) * 360 + (minutes / 60) * 30

  const dateStr = now.toLocaleDateString('zh-CN', { month: 'long', day: 'numeric', weekday: 'long' })
  const timeStr = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`

  return (
    <div className="dw-clock">
      <div className="dw-clock-face">
        <div className="dw-clock-glow" />
        {Array.from({ length: 12 }).map((_, i) => (
          <div
            key={i}
            className="dw-clock-tick"
            style={{ transform: `rotate(${i * 30}deg)` }}
          />
        ))}
        <div className="dw-clock-hand dw-clock-hand-hour" style={{ transform: `rotate(${hourAngle}deg)` }} />
        <div className="dw-clock-hand dw-clock-hand-min" style={{ transform: `rotate(${minAngle}deg)` }} />
        <div className="dw-clock-hand dw-clock-hand-sec" style={{ transform: `rotate(${secAngle}deg)` }} />
        <div className="dw-clock-center" />
      </div>
      <div className="dw-clock-info">
        <div className="dw-clock-time">{timeStr}</div>
        <div className="dw-clock-date">{dateStr}</div>
        <div className="dw-clock-sec-display">
          <span className="dw-clock-sec-num">{String(seconds).padStart(2, '0')}</span>
          <span className="dw-clock-sec-label">秒</span>
        </div>
      </div>
    </div>
  )
})

const PulseWidget = memo(function PulseWidget() {
  const [metrics, setMetrics] = useState({ memPercent: 0, memUsed: 0, battery: null as number | null, charging: false, online: true, cores: 1 })
  const [history, setHistory] = useState<number[]>(() => Array.from({ length: 28 }, () => 0))

  useEffect(() => {
    let cancelled = false

    async function sample() {
      if (cancelled) return
      let memPercent = 0
      let memUsed = 0
      const perf = performance as Performance & { memory?: { usedJSHeapSize: number; jsHeapSizeLimit: number } }
      if (perf.memory) {
        memUsed = perf.memory.usedJSHeapSize
        memPercent = Math.min(100, (memUsed / perf.memory.jsHeapSizeLimit) * 100)
      } else {
        memPercent = 30 + (Math.sin(Date.now() / 4000) * 12 + Math.random() * 8)
      }

      let battery: number | null = null
      let charging = false
      try {
        const bat = (navigator as Navigator & { getBattery?: () => Promise<{ level: number; charging: boolean }> }).getBattery
        if (typeof bat === 'function') {
          const b = await bat.call(navigator)
          battery = Math.round(b.level * 100)
          charging = b.charging
        }
      } catch {
        /* ignore */
      }

      setMetrics({
        memPercent: Math.max(2, Math.round(memPercent)),
        memUsed,
        battery,
        charging,
        online: navigator.onLine,
        cores: navigator.hardwareConcurrency || 1,
      })
      setHistory((prev) => [...prev.slice(1), memPercent])
    }

    sample()
    const t = setInterval(sample, 2000)
    return () => { cancelled = true; clearInterval(t) }
  }, [])

  const memMB = metrics.memUsed ? (metrics.memUsed / 1048576).toFixed(1) : '—'
  const max = Math.max(...history, 1)
  const points = history
    .map((v, i) => `${(i / (history.length - 1)) * 100},${28 - (v / max) * 24 - 2}`)
    .join(' ')
  const areaPoints = `0,28 ${points} 100,28`

  return (
    <div className="dw-pulse">
      <div className="dw-pulse-row">
        <div className="dw-pulse-stat">
          <div className="dw-pulse-label">JS 堆内存</div>
          <div className="dw-pulse-value">{memMB} <span>MB</span></div>
          <div className="dw-pulse-bar">
            <div className="dw-pulse-bar-fill" style={{ width: `${metrics.memPercent}%` }} />
          </div>
        </div>
        <div className="dw-pulse-stat">
          <div className="dw-pulse-label">CPU 核心</div>
          <div className="dw-pulse-value">{metrics.cores}</div>
          <div className="dw-pulse-bar">
            <div className="dw-pulse-bar-fill dw-pulse-bar-secondary" style={{ width: `${Math.min(100, 30 + Math.random() * 20)}%` }} />
          </div>
        </div>
      </div>
      <div className="dw-pulse-graph-wrap">
        <svg className="dw-pulse-graph" viewBox="0 0 100 28" preserveAspectRatio="none">
          <defs>
            <linearGradient id="dwPulseFill" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="var(--color-primary)" stopOpacity="0.5" />
              <stop offset="100%" stopColor="var(--color-primary)" stopOpacity="0" />
            </linearGradient>
          </defs>
          <polygon className="dw-pulse-area" points={areaPoints} fill="url(#dwPulseFill)" />
          <polyline className="dw-pulse-line" points={points} fill="none" stroke="var(--color-primary)" strokeWidth="1.5" strokeLinejoin="round" strokeLinecap="round" />
        </svg>
      </div>
      <div className="dw-pulse-row dw-pulse-row-chips">
        <div className="dw-pulse-chip">
          <span className={`dw-dot ${metrics.online ? 'dw-dot-ok' : 'dw-dot-err'}`} />
          {metrics.online ? '在线' : '离线'}
        </div>
        {metrics.battery !== null && (
          <div className="dw-pulse-chip">
            <span className={`dw-dot ${metrics.battery > 20 ? 'dw-dot-ok' : 'dw-dot-warn'}`} />
            电池 {metrics.battery}%{metrics.charging ? ' ⚡' : ''}
          </div>
        )}
        <div className="dw-pulse-chip">
          <span className="dw-dot dw-dot-info" />
          {metrics.memPercent}%
        </div>
      </div>
    </div>
  )
})

interface WeatherData {
  temp: number
  code: number
  wind: number
  humidity: number
  location: string
  isDay: boolean
}

const WEATHER_CODE_MAP: Record<number, { label: string; icon: string }> = {
  0: { label: '晴', icon: '☀' },
  1: { label: '晴间多云', icon: '🌤' },
  2: { label: '多云', icon: '⛅' },
  3: { label: '阴', icon: '☁' },
  45: { label: '雾', icon: '🌫' },
  48: { label: '冻雾', icon: '🌫' },
  51: { label: '小毛毛雨', icon: '🌦' },
  53: { label: '毛毛雨', icon: '🌦' },
  55: { label: '大毛毛雨', icon: '🌧' },
  61: { label: '小雨', icon: '🌦' },
  63: { label: '中雨', icon: '🌧' },
  65: { label: '大雨', icon: '🌧' },
  71: { label: '小雪', icon: '🌨' },
  73: { label: '中雪', icon: '🌨' },
  75: { label: '大雪', icon: '❄' },
  80: { label: '阵雨', icon: '🌦' },
  81: { label: '中阵雨', icon: '🌧' },
  82: { label: '强阵雨', icon: '⛈' },
  95: { label: '雷暴', icon: '⛈' },
  96: { label: '雷暴冰雹', icon: '⛈' },
  99: { label: '强雷暴', icon: '⛈' },
}

const WeatherWidget = memo(function WeatherWidget() {
  const [data, setData] = useState<WeatherData | null>(null)
  const [err, setErr] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let cancelled = false

    async function fetchWeather(lat: number, lon: number, name: string) {
      try {
        const url = `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current=temperature_2m,relative_humidity_2m,is_day,weather_code,wind_speed_10m`
        const res = await fetch(url)
        if (!res.ok) throw new Error(`HTTP ${res.status}`)
        const json = await res.json()
        const cur = json.current
        if (!cur) throw new Error('无数据')
        if (!cancelled) {
          setData({
            temp: Math.round(cur.temperature_2m),
            code: cur.weather_code,
            wind: Math.round(cur.wind_speed_10m),
            humidity: Math.round(cur.relative_humidity_2m),
            location: name,
            isDay: cur.is_day === 1,
          })
          setErr(null)
        }
      } catch (e) {
        if (!cancelled) setErr((e as Error).message || '获取失败')
      } finally {
        if (!cancelled) setLoading(false)
      }
    }

    function fallbackLocation() {
      fetchWeather(31.2304, 121.4737, '上海')
    }

    if (!navigator.geolocation) {
      fallbackLocation()
      return
    }

    let gotPosition = false
    const timer = setTimeout(() => {
      if (!gotPosition) fallbackLocation()
    }, 4000)

    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        gotPosition = true
        clearTimeout(timer)
        const { latitude, longitude } = pos.coords
        let name = '当前位置'
        try {
          const r = await fetch(`https://api.bigdatacloud.net/data/reverse-geocode-client?latitude=${latitude}&longitude=${longitude}&localityLanguage=zh`)
          if (r.ok) {
            const j = await r.json()
            name = j.city || j.locality || j.principalSubdivision || '当前位置'
          }
        } catch {
          /* use default */
        }
        fetchWeather(latitude, longitude, name)
      },
      () => {
        gotPosition = true
        clearTimeout(timer)
        fallbackLocation()
      },
      { timeout: 4000, maximumAge: 600000 }
    )

    return () => { cancelled = true; clearTimeout(timer) }
  }, [])

  if (loading) {
    return <div className="dw-weather dw-weather-loading"><div className="dw-weather-spinner" />正在获取天气…</div>
  }
  if (err || !data) {
    return (
      <div className="dw-weather dw-weather-error">
        <div>天气暂不可用</div>
        <button className="dw-weather-retry" onClick={() => window.location.reload()}>重试</button>
      </div>
    )
  }

  const info = WEATHER_CODE_MAP[data.code] || { label: '未知', icon: '🌡' }

  return (
    <div className={`dw-weather ${data.isDay ? '' : 'dw-weather-night'}`}>
      <div className="dw-weather-bg" />
      <div className="dw-weather-main">
        <div className="dw-weather-icon-wrap">
          <div className="dw-weather-icon">{info.icon}</div>
        </div>
        <div className="dw-weather-main-info">
          <div className="dw-weather-temp">{data.temp}°</div>
          <div className="dw-weather-label">{info.label}</div>
        </div>
      </div>
      <div className="dw-weather-meta">
        <div className="dw-weather-meta-item">
          <span className="dw-weather-meta-icon">💧</span>
          <span className="dw-weather-meta-value">{data.humidity}%</span>
          <span className="dw-weather-meta-label">湿度</span>
        </div>
        <div className="dw-weather-meta-item">
          <span className="dw-weather-meta-icon">🌬</span>
          <span className="dw-weather-meta-value">{data.wind}</span>
          <span className="dw-weather-meta-label">km/h</span>
        </div>
        <div className="dw-weather-meta-item">
          <span className="dw-weather-meta-icon">🌡</span>
          <span className="dw-weather-meta-value">{data.temp}°</span>
          <span className="dw-weather-meta-label">体感</span>
        </div>
      </div>
      <div className="dw-weather-loc">📍 {data.location}</div>
    </div>
  )
})

const NoteWidget = memo(function NoteWidget({ note, onChange }: { note: string; onChange: (v: string) => void }) {
  return (
    <div className="dw-note">
      <textarea
        className="dw-note-input"
        value={note}
        onChange={(e) => onChange(e.target.value)}
        placeholder="在这里随手记下灵感…&#10;内容会自动保存。"
        spellCheck={false}
      />
      <div className="dw-note-foot">
        <span>{note.length} 字</span>
        <span className="dw-note-save-status">
          <span className="dw-dot dw-dot-ok" style={{ width: 4, height: 4 }} />
          自动保存
        </span>
      </div>
    </div>
  )
})

const FocusWidget = memo(function FocusWidget({ minutes, onMinutesChange }: { minutes: number; onMinutesChange: (m: number) => void }) {
  const [remaining, setRemaining] = useState(minutes * 60)
  const [running, setRunning] = useState(false)
  const audioRef = useRef<AudioContext | null>(null)

  useEffect(() => {
    if (!running) setRemaining(minutes * 60)
  }, [minutes, running])

  useEffect(() => {
    if (!running) return
    const t = setInterval(() => {
      setRemaining((r) => {
        if (r <= 1) {
          setRunning(false)
          try {
            const ctx = audioRef.current ??= new (window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext)()
            const osc = ctx.createOscillator()
            const gain = ctx.createGain()
            osc.connect(gain); gain.connect(ctx.destination)
            osc.frequency.value = 880
            gain.gain.setValueAtTime(0.0001, ctx.currentTime)
            gain.gain.exponentialRampToValueAtTime(0.2, ctx.currentTime + 0.02)
            gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + 0.6)
            osc.start(); osc.stop(ctx.currentTime + 0.6)
          } catch { /* ignore */ }
          return 0
        }
        return r - 1
      })
    }, 1000)
    return () => clearInterval(t)
  }, [running])

  const total = minutes * 60
  const progress = total > 0 ? 1 - remaining / total : 0
  const mm = String(Math.floor(remaining / 60)).padStart(2, '0')
  const ss = String(remaining % 60).padStart(2, '0')

  const radius = 42
  const circ = 2 * Math.PI * radius

  return (
    <div className="dw-focus">
      <div className="dw-focus-ring">
        <div className="dw-focus-ring-bg-glow" />
        <svg width="104" height="104" viewBox="0 0 104 104">
          <defs>
            <linearGradient id="dwFocusGrad" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="var(--color-primary)" />
              <stop offset="100%" stopColor="var(--color-secondary)" />
            </linearGradient>
          </defs>
          <circle cx="52" cy="52" r={radius} fill="none" stroke="var(--glass-border)" strokeWidth="5" />
          <circle
            cx="52" cy="52" r={radius} fill="none"
            stroke="url(#dwFocusGrad)" strokeWidth="5" strokeLinecap="round"
            strokeDasharray={circ}
            strokeDashoffset={circ * (1 - progress)}
            transform="rotate(-90 52 52)"
            style={{ transition: 'stroke-dashoffset 1s linear' }}
          />
        </svg>
        <div className="dw-focus-time">{running ? `${mm}:${ss}` : `${minutes}:00`}</div>
        <div className="dw-focus-sub">{running ? '专注中…' : '准备开始'}</div>
      </div>
      <div className="dw-focus-controls">
        {!running ? (
          <button className="dw-focus-btn dw-focus-btn-primary" onClick={() => { if (remaining === 0) setRemaining(minutes * 60); setRunning(true) }}>
            ▶ 开始专注
          </button>
        ) : (
          <button className="dw-focus-btn" onClick={() => setRunning(false)}>⏸ 暂停</button>
        )}
        <button className="dw-focus-btn" onClick={() => { setRunning(false); setRemaining(minutes * 60) }}>↺ 重置</button>
      </div>
      <div className="dw-focus-presets">
        {[15, 25, 45, 60].map((m) => (
          <button
            key={m}
            className={`dw-focus-preset ${minutes === m ? 'active' : ''}`}
            onClick={() => onMinutesChange(m)}
          >{m}m</button>
        ))}
      </div>
    </div>
  )
})

const SystemMonitorWidget = memo(function SystemMonitorWidget() {
  const [data, setData] = useState({
    cpu: 0,
    memory: 0,
    memoryUsed: 0,
    memoryTotal: 0,
    networkDown: 0,
    networkUp: 0,
  })
  const [cpuHistory, setCpuHistory] = useState<number[]>(() => Array.from({ length: 30 }, () => 0))
  const [memHistory, setMemHistory] = useState<number[]>(() => Array.from({ length: 30 }, () => 0))

  useEffect(() => {
    function sample() {
      const perf = performance as Performance & { memory?: { usedJSHeapSize: number; jsHeapSizeLimit: number } }
      let memPercent = 0
      let memUsed = 0
      let memTotal = 0

      if (perf.memory) {
        memUsed = perf.memory.usedJSHeapSize
        memTotal = perf.memory.jsHeapSizeLimit
        memPercent = Math.min(100, (memUsed / memTotal) * 100)
      } else {
        memPercent = 35 + Math.sin(Date.now() / 5000) * 15 + Math.random() * 5
        memUsed = memPercent * 8 * 1048576
        memTotal = 8 * 1048576 * 100
      }

      const now = Date.now()
      const baseCpu = 25 + Math.sin(now / 3000) * 15 + Math.random() * 10
      const cpuPercent = Math.min(100, Math.max(5, baseCpu))

      setData({
        cpu: Math.round(cpuPercent),
        memory: Math.round(memPercent),
        memoryUsed: memUsed,
        memoryTotal: memTotal,
        networkDown: Math.round(50 + Math.random() * 200),
        networkUp: Math.round(20 + Math.random() * 80),
      })
      setCpuHistory((prev) => [...prev.slice(1), cpuPercent])
      setMemHistory((prev) => [...prev.slice(1), memPercent])
    }

    sample()
    const t = setInterval(sample, 1500)
    return () => clearInterval(t)
  }, [])

  const maxCpu = Math.max(...cpuHistory, 1)
  const maxMem = Math.max(...memHistory, 1)

  const cpuPoints = cpuHistory
    .map((v, i) => `${(i / (cpuHistory.length - 1)) * 100},${40 - (v / maxCpu) * 34 - 3}`)
    .join(' ')
  const memPoints = memHistory
    .map((v, i) => `${(i / (memHistory.length - 1)) * 100},${40 - (v / maxMem) * 34 - 3}`)
    .join(' ')

  const memUsedMB = (data.memoryUsed / 1048576).toFixed(0)

  return (
    <div className="dw-sysmon">
      <div className="dw-sysmon-gauges">
        <div className="dw-sysmon-gauge">
          <div className="dw-sysmon-gauge-label">CPU</div>
          <div className="dw-sysmon-gauge-value">{data.cpu}%</div>
          <div className="dw-sysmon-gauge-bar">
            <div
              className="dw-sysmon-gauge-fill dw-sysmon-cpu-fill"
              style={{ width: `${data.cpu}%` }}
            />
          </div>
        </div>
        <div className="dw-sysmon-gauge">
          <div className="dw-sysmon-gauge-label">内存</div>
          <div className="dw-sysmon-gauge-value">{data.memory}%</div>
          <div className="dw-sysmon-gauge-bar">
            <div
              className="dw-sysmon-gauge-fill dw-sysmon-mem-fill"
              style={{ width: `${data.memory}%` }}
            />
          </div>
        </div>
      </div>

      <div className="dw-sysmon-chart">
        <div className="dw-sysmon-chart-title">
          <span className="dw-sysmon-legend">
            <span className="dw-sysmon-legend-dot dw-sysmon-legend-cpu" />
            CPU
          </span>
          <span className="dw-sysmon-legend">
            <span className="dw-sysmon-legend-dot dw-sysmon-legend-mem" />
            内存
          </span>
        </div>
        <svg className="dw-sysmon-svg" viewBox="0 0 100 40" preserveAspectRatio="none">
          <defs>
            <linearGradient id="dwCpuFill" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="var(--color-secondary)" stopOpacity="0.4" />
              <stop offset="100%" stopColor="var(--color-secondary)" stopOpacity="0" />
            </linearGradient>
            <linearGradient id="dwMemFill" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="var(--color-primary)" stopOpacity="0.3" />
              <stop offset="100%" stopColor="var(--color-primary)" stopOpacity="0" />
            </linearGradient>
          </defs>
          <polygon points={`0,40 ${memPoints} 100,40`} fill="url(#dwMemFill)" />
          <polygon points={`0,40 ${cpuPoints} 100,40`} fill="url(#dwCpuFill)" />
          <polyline points={memPoints} fill="none" stroke="var(--color-primary)" strokeWidth="1.2" strokeLinejoin="round" strokeLinecap="round" opacity="0.7" />
          <polyline points={cpuPoints} fill="none" stroke="var(--color-secondary)" strokeWidth="1.5" strokeLinejoin="round" strokeLinecap="round" />
        </svg>
      </div>

      <div className="dw-sysmon-stats">
        <div className="dw-sysmon-stat">
          <span className="dw-sysmon-stat-icon">⬇</span>
          <span className="dw-sysmon-stat-value">{data.networkDown}</span>
          <span className="dw-sysmon-stat-unit">KB/s</span>
        </div>
        <div className="dw-sysmon-stat">
          <span className="dw-sysmon-stat-icon">⬆</span>
          <span className="dw-sysmon-stat-value">{data.networkUp}</span>
          <span className="dw-sysmon-stat-unit">KB/s</span>
        </div>
        <div className="dw-sysmon-stat">
          <span className="dw-sysmon-stat-icon">💾</span>
          <span className="dw-sysmon-stat-value">{memUsedMB}</span>
          <span className="dw-sysmon-stat-unit">MB</span>
        </div>
      </div>
    </div>
  )
})

interface QuickApp {
  id: string
  name: string
  icon: string
  color: string
}

const QUICK_APPS: QuickApp[] = [
  { id: 'files', name: '文件', icon: '📁', color: 'var(--color-primary)' },
  { id: 'browser', name: '浏览器', icon: '🌐', color: 'var(--color-secondary)' },
  { id: 'terminal', name: '终端', icon: '⌨', color: '#10b981' },
  { id: 'settings', name: '设置', icon: '⚙', color: '#f59e0b' },
  { id: 'editor', name: '编辑器', icon: '📝', color: '#8b5cf6' },
  { id: 'calculator', name: '计算器', icon: '🧮', color: '#ec4899' },
  { id: 'music', name: '音乐', icon: '🎵', color: '#ef4444' },
  { id: 'photos', name: '图片', icon: '🖼', color: '#06b6d4' },
]

const QuickLaunchWidget = memo(function QuickLaunchWidget() {
  const handleLaunch = (app: QuickApp) => {
    const event = new CustomEvent('weblinux-launch-app', { detail: { appId: app.id } })
    window.dispatchEvent(event)
  }

  return (
    <div className="dw-quick">
      <div className="dw-quick-grid">
        {QUICK_APPS.map((app) => (
          <button
            key={app.id}
            className="dw-quick-item"
            onClick={() => handleLaunch(app)}
            style={{ '--app-color': app.color } as React.CSSProperties}
          >
            <div className="dw-quick-icon">{app.icon}</div>
            <div className="dw-quick-name">{app.name}</div>
          </button>
        ))}
      </div>
    </div>
  )
})

const MusicPlayerWidget = memo(function MusicPlayerWidget() {
  const [playing, setPlaying] = useState(false)
  const [progress, setProgress] = useState(0.35)
  const [track] = useState({ title: '夜曲', artist: '周杰伦', album: '十一月的萧邦' })
  const [volume, setVolume] = useState(0.7)
  const [liked, setLiked] = useState(false)

  useEffect(() => {
    if (!playing) return
    const t = setInterval(() => {
      setProgress((p) => {
        if (p >= 1) return 0
        return p + 0.002
      })
    }, 500)
    return () => clearInterval(t)
  }, [playing])

  const formatTime = (p: number) => {
    const total = 240
    const current = Math.floor(p * total)
    const m = Math.floor(current / 60)
    const s = current % 60
    return `${m}:${String(s).padStart(2, '0')}`
  }

  return (
    <div className="dw-music">
      <div className="dw-music-bg" />
      <div className="dw-music-album">
        <div className={`dw-music-album-art ${playing ? 'spinning' : ''}`}>
          <span className="dw-music-album-icon">🎵</span>
        </div>
      </div>
      <div className="dw-music-info">
        <div className="dw-music-title">{track.title}</div>
        <div className="dw-music-artist">{track.artist} · {track.album}</div>
      </div>

      <div className="dw-music-progress">
        <div className="dw-music-progress-bar" onClick={(e) => {
          const rect = (e.currentTarget as HTMLDivElement).getBoundingClientRect()
          const p = (e.clientX - rect.left) / rect.width
          setProgress(Math.max(0, Math.min(1, p)))
        }}>
          <div className="dw-music-progress-fill" style={{ width: `${progress * 100}%` }}>
            <div className="dw-music-progress-thumb" />
          </div>
        </div>
        <div className="dw-music-time">
          <span>{formatTime(progress)}</span>
          <span>{formatTime(1)}</span>
        </div>
      </div>

      <div className="dw-music-controls">
        <button className="dw-music-btn dw-music-btn-like" onClick={() => setLiked(!liked)}>
          {liked ? '❤️' : '🤍'}
        </button>
        <button className="dw-music-btn dw-music-btn-skip">⏮</button>
        <button className="dw-music-btn dw-music-btn-play" onClick={() => setPlaying(!playing)}>
          {playing ? '⏸' : '▶'}
        </button>
        <button className="dw-music-btn dw-music-btn-skip">⏭</button>
        <div className="dw-music-volume">
          <span className="dw-music-vol-icon">🔊</span>
          <input
            type="range"
            min="0"
            max="100"
            value={volume * 100}
            onChange={(e) => setVolume(Number(e.target.value) / 100)}
            className="dw-music-vol-slider"
          />
        </div>
      </div>
    </div>
  )
})

const AQI_CATEGORIES = [
  { range: [0, 50], category: '优', color: '#00e400' },
  { range: [51, 100], category: '良', color: '#ffff00' },
  { range: [101, 150], category: '轻度污染', color: '#ff7e00' },
  { range: [151, 200], category: '中度污染', color: '#ff0000' },
  { range: [201, 300], category: '重度污染', color: '#99004c' },
  { range: [301, 500], category: '严重污染', color: '#7e0023' },
]

function getAQICategory(aqi: number) {
  for (const cat of AQI_CATEGORIES) {
    if (aqi >= cat.range[0] && aqi <= cat.range[1]) return cat
  }
  return AQI_CATEGORIES[AQI_CATEGORIES.length - 1]
}

const AQI_CITIES = [
  { name: '北京', coords: [39.9042, 116.4074] },
  { name: '上海', coords: [31.2304, 121.4737] },
  { name: '广州', coords: [23.1291, 113.2644] },
  { name: '深圳', coords: [22.5431, 114.0579] },
  { name: '杭州', coords: [30.2741, 120.1551] },
  { name: '成都', coords: [30.5728, 104.0668] },
]

const AirQualityWidget = memo(function AirQualityWidget({ city, onCityChange }: { city: string; onCityChange: (c: string) => void }) {
  const [aqi, setAqi] = useState<number | null>(null)
  const [loading, setLoading] = useState(true)
  const [err, setErr] = useState<string | null>(null)
  const [pm25, setPm25] = useState(0)

  useEffect(() => {
    let cancelled = false
    async function fetchData() {
      setLoading(true)
      setErr(null)
      try {
        const cityData = AQI_CITIES.find(c => c.name === city) || AQI_CITIES[0]
        const [lat, lon] = cityData.coords
        const res = await fetch(
          `https://air-quality-api.open-meteo.com/v1/air-quality?latitude=${lat}&longitude=${lon}&current=us_aqi,pm2_5`
        )
        if (!res.ok) throw new Error('获取失败')
        const data = await res.json()
        if (!cancelled) {
          setAqi(Math.round(data.current?.us_aqi ?? 0))
          setPm25(Math.round(data.current?.pm2_5 ?? 0))
        }
      } catch (e) {
        if (!cancelled) setErr((e as Error).message || '获取失败')
      } finally {
        if (!cancelled) setLoading(false)
      }
    }
    fetchData()
    const t = setInterval(fetchData, 30 * 60 * 1000)
    return () => { cancelled = true; clearInterval(t) }
  }, [city])

  const category = aqi !== null ? getAQICategory(aqi) : null

  if (loading) {
    return <div className="dw-aqi dw-loading"><div className="dw-weather-spinner" />正在获取空气质量…</div>
  }
  if (err || aqi === null) {
    return <div className="dw-aqi dw-error">空气质量暂不可用</div>
  }

  return (
    <div className="dw-aqi">
      <div className="dw-aqi-header">
        <div className="dw-aqi-city">
          <select
            value={city}
            onChange={(e) => onCityChange(e.target.value)}
            className="dw-aqi-city-select"
          >
            {AQI_CITIES.map(c => <option key={c.name} value={c.name}>{c.name}</option>)}
          </select>
        </div>
        <div className="dw-aqi-label">AQI</div>
      </div>
      <div className="dw-aqi-main">
        <div className="dw-aqi-value" style={{ color: category?.color }}>{aqi}</div>
        <div className="dw-aqi-category" style={{ background: category?.color }}>{category?.category}</div>
      </div>
      <div className="dw-aqi-details">
        <div className="dw-aqi-detail-item">
          <span className="dw-aqi-detail-icon">🌫</span>
          <span className="dw-aqi-detail-value">{pm25}</span>
          <span className="dw-aqi-detail-unit">μg/m³ PM2.5</span>
        </div>
      </div>
    </div>
  )
})

const DAILY_POEMS = [
  { title: '静夜思', author: '李白', dynasty: '唐', content: '床前明月光，\n疑是地上霜。\n举头望明月，\n低头思故乡。' },
  { title: '登鹳雀楼', author: '王之涣', dynasty: '唐', content: '白日依山尽，\n黄河入海流。\n欲穷千里目，\n更上一层楼。' },
  { title: '相思', author: '王维', dynasty: '唐', content: '红豆生南国，\n春来发几枝。\n愿君多采撷，\n此物最相思。' },
  { title: '春晓', author: '孟浩然', dynasty: '唐', content: '春眠不觉晓，\n处处闻啼鸟。\n夜来风雨声，\n花落知多少。' },
  { title: '江雪', author: '柳宗元', dynasty: '唐', content: '千山鸟飞绝，\n万径人踪灭。\n孤舟蓑笠翁，\n独钓寒江雪。' },
  { title: '游子吟', author: '孟郊', dynasty: '唐', content: '慈母手中线，\n游子身上衣。\n临行密密缝，\n意恐迟迟归。\n谁言寸草心，\n报得三春晖。' },
  { title: '望庐山瀑布', author: '李白', dynasty: '唐', content: '日照香炉生紫烟，\n遥看瀑布挂前川。\n飞流直下三千尺，\n疑是银河落九天。' },
  { title: '出塞', author: '王昌龄', dynasty: '唐', content: '秦时明月汉时关，\n万里长征人未还。\n但使龙城飞将在，\n不教胡马度阴山。' },
  { title: '送元二使安西', author: '王维', dynasty: '唐', content: '渭城朝雨浥轻尘，\n客舍青青柳色新。\n劝君更尽一杯酒，\n西出阳关无故人。' },
  { title: '悯农', author: '李绅', dynasty: '唐', content: '锄禾日当午，\n汗滴禾下土。\n谁知盘中餐，\n粒粒皆辛苦。' },
]

const DailyPoemWidget = memo(function DailyPoemWidget({ index, onNext }: { index: number; onNext: () => void }) {
  const poem = DAILY_POEMS[index % DAILY_POEMS.length]

  return (
    <div className="dw-poem">
      <div className="dw-poem-header">
        <span className="dw-poem-title">📜 每日诗词</span>
        <button className="dw-poem-refresh" onClick={onNext} title="换一首">↻</button>
      </div>
      <div className="dw-poem-content">
        <div className="dw-poem-name">{poem.title}</div>
        <div className="dw-poem-author">【{poem.dynasty}】{poem.author}</div>
        <div className="dw-poem-text">
          {poem.content.split('\n').map((line, i) => (
            <div key={i}>{line}</div>
          ))}
        </div>
      </div>
    </div>
  )
})

interface WidgetShellProps {
  id: WidgetId
  title: string
  x: number
  y: number
  width: number
  height: number
  onClose: () => void
  onDrag: (x: number, y: number) => void
  onResize: (width: number, height: number, x?: number, y?: number) => void
  onDragStart?: () => void
  onDragEnd?: () => void
  children: React.ReactNode
  resizable?: boolean
}

const WidgetShell = memo(function WidgetShell({
  id, title, x, y, width, height, onClose, onDrag, onResize, onDragStart, onDragEnd, children, resizable = true,
}: WidgetShellProps) {
  const dragRef = useRef<{ startX: number; startY: number; origX: number; origY: number } | null>(null)
  const resizeRef = useRef<{ startX: number; startY: number; origW: number; origH: number; origX: number; origY: number; edge: string } | null>(null)
  const [isDragging, setIsDragging] = useState(false)
  const [isResizing, setIsResizing] = useState(false)

  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    const target = e.target as HTMLElement
    if (target.closest('button, input, textarea, select, .dw-music-progress-bar, .dw-music-vol-slider')) return
    e.preventDefault()
    dragRef.current = { startX: e.clientX, startY: e.clientY, origX: x, origY: y }
    setIsDragging(true)
    onDragStart?.()

    const onMove = (ev: MouseEvent) => {
      if (!dragRef.current) return
      const dx = ev.clientX - dragRef.current.startX
      const dy = ev.clientY - dragRef.current.startY
      const maxX = window.innerWidth - width - 8
      const maxY = window.innerHeight - 60
      onDrag(
        Math.max(0, Math.min(maxX, dragRef.current.origX + dx)),
        Math.max(0, Math.min(maxY, dragRef.current.origY + dy))
      )
    }
    const onUp = () => {
      dragRef.current = null
      setIsDragging(false)
      onDragEnd?.()
      window.removeEventListener('mousemove', onMove)
      window.removeEventListener('mouseup', onUp)
    }
    window.addEventListener('mousemove', onMove)
    window.addEventListener('mouseup', onUp)
  }, [x, y, width, onDrag, onDragStart, onDragEnd])

  const handleResizeStart = useCallback((e: React.MouseEvent, edge: string) => {
    e.preventDefault()
    e.stopPropagation()
    resizeRef.current = { startX: e.clientX, startY: e.clientY, origW: width, origH: height, origX: x, origY: y, edge }
    setIsResizing(true)

    const onMove = (ev: MouseEvent) => {
      if (!resizeRef.current) return
      const dx = ev.clientX - resizeRef.current.startX
      const dy = ev.clientY - resizeRef.current.startY
      let newW = resizeRef.current.origW
      let newH = resizeRef.current.origH
      let newX = resizeRef.current.origX
      let newY = resizeRef.current.origY

      if (resizeRef.current.edge.includes('e')) {
        newW = Math.max(WIDGET_MIN_WIDTH, resizeRef.current.origW + dx)
      }
      if (resizeRef.current.edge.includes('w')) {
        newW = Math.max(WIDGET_MIN_WIDTH, resizeRef.current.origW - dx)
        newX = resizeRef.current.origX + (resizeRef.current.origW - newW)
      }
      if (resizeRef.current.edge.includes('s')) {
        newH = Math.max(WIDGET_MIN_HEIGHT, resizeRef.current.origH + dy)
      }
      if (resizeRef.current.edge.includes('n')) {
        newH = Math.max(WIDGET_MIN_HEIGHT, resizeRef.current.origH - dy)
        newY = resizeRef.current.origY + (resizeRef.current.origH - newH)
      }

      onResize(newW, newH, newX, newY)
    }
    const onUp = () => {
      resizeRef.current = null
      setIsResizing(false)
      window.removeEventListener('mousemove', onMove)
      window.removeEventListener('mouseup', onUp)
    }
    window.addEventListener('mousemove', onMove)
    window.addEventListener('mouseup', onUp)
  }, [width, height, x, y, onResize])

  return (
    <div
      className={`dw-shell ${isDragging ? 'dw-shell-dragging' : ''} ${isResizing ? 'dw-shell-resizing' : ''}`}
      style={{ left: x, top: y, width, height }}
      data-widget-id={id}
    >
      <div className="dw-shell-header" onMouseDown={handleMouseDown}>
        <span className="dw-shell-drag" aria-hidden="true"><DragGlyph /></span>
        <span className="dw-shell-title">{title}</span>
        <button className="dw-shell-close" onClick={onClose} aria-label="关闭小部件" title="关闭">
          <CloseGlyph />
        </button>
      </div>
      <div className="dw-shell-body">{children}</div>

      {resizable && (
        <>
          <div className="dw-resize-handle dw-resize-e" onMouseDown={(e) => handleResizeStart(e, 'e')} />
          <div className="dw-resize-handle dw-resize-s" onMouseDown={(e) => handleResizeStart(e, 's')} />
          <div className="dw-resize-handle dw-resize-se" onMouseDown={(e) => handleResizeStart(e, 'se')}>
            <ResizeGlyph />
          </div>
        </>
      )}
    </div>
  )
})

const DesktopWidgets = memo(function DesktopWidgets({ visible }: { visible: boolean }) {
  const [state, setState] = useState<WidgetState>(() => loadWidgetState())
  const saveTimer = useRef<ReturnType<typeof setTimeout> | null>(null)
  const [draggingId, setDraggingId] = useState<WidgetId | null>(null)

  useEffect(() => {
    const handler = () => setState(loadWidgetState())
    window.addEventListener('weblinux-widgets-change', handler)
    return () => window.removeEventListener('weblinux-widgets-change', handler)
  }, [])

  const persistState = useCallback((next: WidgetState) => {
    if (saveTimer.current) clearTimeout(saveTimer.current)
    saveTimer.current = setTimeout(() => debouncedSaveToStorage(WIDGET_STORAGE_KEY, next, 300), 150)
  }, [])

  const updateLayout = useCallback((id: WidgetId, patch: Partial<WidgetLayout>) => {
    setState((prev) => {
      const next: WidgetState = {
        ...prev,
        layout: prev.layout.map((l) => (l.id === id ? { ...l, ...patch } : l)),
      }
      persistState(next)
      return next
    })
  }, [persistState])

  const setNote = useCallback((note: string) => {
    setState((prev) => {
      const next = { ...prev, note }
      persistState(next)
      return next
    })
  }, [persistState])

  const setFocusMinutes = useCallback((m: number) => {
    setState((prev) => {
      const next = { ...prev, focusMinutes: m }
      persistState(next)
      return next
    })
  }, [persistState])

  const setPoemIndex = useCallback((idx: number) => {
    setState((prev) => {
      const next = { ...prev, poemIndex: idx }
      persistState(next)
      return next
    })
  }, [persistState])

  const setAqiCity = useCallback((city: string) => {
    setState((prev) => {
      const next = { ...prev, aqiCity: city }
      persistState(next)
      return next
    })
  }, [persistState])

  const handleResize = useCallback((id: WidgetId, width: number, height: number, x?: number, y?: number) => {
    const patch: Partial<WidgetLayout> = { width, height }
    if (x !== undefined) patch.x = x
    if (y !== undefined) patch.y = y
    updateLayout(id, patch)
  }, [updateLayout])

  if (!visible) return null

  const anyVisible = state.layout.some((l) => l.visible)
  if (!anyVisible) return null

  return (
    <div className="desktop-widgets" aria-label="桌面小部件">
      {state.layout.map((l) => {
        if (!l.visible) return null
        return (
          <WidgetShell
            key={l.id}
            id={l.id}
            title={WIDGET_TITLES[l.id]}
            x={l.x}
            y={l.y}
            width={l.width}
            height={l.height}
            onClose={() => updateLayout(l.id, { visible: false })}
            onDrag={(x, y) => updateLayout(l.id, { x, y })}
            onResize={(w, h, nx, ny) => handleResize(l.id, w, h, nx, ny)}
            onDragStart={() => setDraggingId(l.id)}
            onDragEnd={() => setDraggingId(null)}
          >
            {l.id === 'clock' && <ClockWidget />}
            {l.id === 'pulse' && <PulseWidget />}
            {l.id === 'weather' && <WeatherWidget />}
            {l.id === 'note' && <NoteWidget note={state.note} onChange={setNote} />}
            {l.id === 'focus' && <FocusWidget minutes={state.focusMinutes} onMinutesChange={setFocusMinutes} />}
            {l.id === 'systemMonitor' && <SystemMonitorWidget />}
            {l.id === 'quickLaunch' && <QuickLaunchWidget />}
            {l.id === 'musicPlayer' && <MusicPlayerWidget />}
            {l.id === 'airQuality' && <AirQualityWidget city={state.aqiCity} onCityChange={setAqiCity} />}
            {l.id === 'dailyPoem' && <DailyPoemWidget index={state.poemIndex} onNext={() => setPoemIndex(state.poemIndex + 1)} />}
          </WidgetShell>
        )
      })}
      {draggingId && <div className="dw-drag-overlay" />}
    </div>
  )
})

export const WIDGET_TITLES: Record<WidgetId, string> = {
  clock: '时钟',
  pulse: '系统脉搏',
  weather: '实时天气',
  note: '便签',
  focus: '专注计时器',
  systemMonitor: '系统监控',
  quickLaunch: '快捷启动',
  musicPlayer: '音乐播放器',
  airQuality: '空气质量',
  dailyPoem: '每日诗词',
}

export function getWidgetVisibility(): Record<WidgetId, boolean> {
  const st = loadWidgetState()
  const result = {} as Record<WidgetId, boolean>
  DEFAULT_LAYOUT.forEach((l) => {
    const found = st.layout.find((x) => x.id === l.id)
    result[l.id] = found ? found.visible : l.visible
  })
  return result
}

export function setWidgetVisibility(id: WidgetId, visible: boolean) {
  const st = loadWidgetState()
  const layout = st.layout.map((l) => (l.id === id ? { ...l, visible } : l))
  const next = { ...st, layout }
  debouncedSaveToStorage(WIDGET_STORAGE_KEY, next, 100)
  window.dispatchEvent(new CustomEvent('weblinux-widgets-change'))
}

export function toggleAllWidgets(visible: boolean) {
  const st = loadWidgetState()
  const layout = st.layout.map((l) => ({ ...l, visible }))
  const next = { ...st, layout }
  debouncedSaveToStorage(WIDGET_STORAGE_KEY, next, 100)
  window.dispatchEvent(new CustomEvent('weblinux-widgets-change'))
}

export const WIDGET_IDS: WidgetId[] = ['clock', 'pulse', 'weather', 'focus', 'note', 'systemMonitor', 'quickLaunch', 'musicPlayer', 'airQuality', 'dailyPoem']

export default DesktopWidgets
