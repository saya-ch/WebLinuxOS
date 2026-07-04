import { useState, useEffect, useRef, useCallback, memo } from 'react'
import { loadFromStorage, debouncedSaveToStorage } from '../../store/storageUtils'

/**
 * DesktopWidgets —— 桌面小部件系统
 *
 * 让 WebLinuxOS 的桌面不再只是图标和壁纸的容器，而是一个真正"活的"工作台：
 *  - 时钟：模拟指针 + 数字时间，一眼可见
 *  - 系统脉搏：实时展示内存占用、电池、网络状态
 *  - 天气：接入 open-meteo 公开 API（无需密钥），展示真实天气
 *  - 快捷便签：持久化的桌面便签
 *  - 专注计时器：番茄钟，帮助保持专注
 *
 * 设计语言：玻璃拟态（glassmorphism），与系统主题变量保持一致。
 * 所有状态持久化到 localStorage，刷新后依然保留。
 */

export type WidgetId = 'clock' | 'pulse' | 'weather' | 'note' | 'focus'

interface WidgetLayout {
  id: WidgetId
  visible: boolean
  x: number
  y: number
}

interface WidgetState {
  layout: WidgetLayout[]
  note: string
  focusMinutes: number
}

const DEFAULT_LAYOUT: WidgetLayout[] = [
  { id: 'clock', visible: true, x: 24, y: 24 },
  { id: 'weather', visible: true, x: 24, y: 268 },
  { id: 'pulse', visible: true, x: 314, y: 24 },
  { id: 'focus', visible: true, x: 314, y: 268 },
  { id: 'note', visible: false, x: 604, y: 24 },
]

const WIDGET_STORAGE_KEY = 'weblinux-widgets'
const WIDGET_WIDTH = 266

function loadWidgetState(): WidgetState {
  const raw = loadFromStorage<Partial<WidgetState>>(WIDGET_STORAGE_KEY, {})
  // 合并默认布局，保证新增的小部件也能出现
  const incoming = Array.isArray(raw.layout) ? raw.layout : []
  const merged: WidgetLayout[] = DEFAULT_LAYOUT.map((d) => {
    const found = incoming.find((i) => i && i.id === d.id)
    return found
      ? { ...d, visible: found.visible, x: found.x ?? d.x, y: found.y ?? d.y }
      : d
  })
  return {
    layout: merged,
    note: typeof raw.note === 'string' ? raw.note : '',
    focusMinutes: typeof raw.focusMinutes === 'number' ? raw.focusMinutes : 25,
  }
}

// ============== 小图标（自包含，避免依赖） ==============
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

// ============== 时钟小部件 ==============
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
        {/* 刻度 */}
        {Array.from({ length: 12 }).map((_, i) => (
          <div
            key={i}
            className="dw-clock-tick"
            style={{ transform: `rotate(${i * 30}deg)` }}
          />
        ))}
        {/* 指针 */}
        <div className="dw-clock-hand dw-clock-hand-hour" style={{ transform: `rotate(${hourAngle}deg)` }} />
        <div className="dw-clock-hand dw-clock-hand-min" style={{ transform: `rotate(${minAngle}deg)` }} />
        <div className="dw-clock-hand dw-clock-hand-sec" style={{ transform: `rotate(${secAngle}deg)` }} />
        <div className="dw-clock-center" />
      </div>
      <div className="dw-clock-info">
        <div className="dw-clock-time">{timeStr}</div>
        <div className="dw-clock-date">{dateStr}</div>
      </div>
    </div>
  )
})

// ============== 系统脉搏小部件 ==============
const PulseWidget = memo(function PulseWidget() {
  const [metrics, setMetrics] = useState({ memPercent: 0, memUsed: 0, battery: null as number | null, charging: false, online: true, cores: 1 })
  const [history, setHistory] = useState<number[]>(() => Array.from({ length: 28 }, () => 0))

  useEffect(() => {
    let cancelled = false

    async function sample() {
      if (cancelled) return
      let memPercent = 0
      let memUsed = 0
      // performance.memory 仅 Chromium 提供
      const perf = performance as Performance & { memory?: { usedJSHeapSize: number; jsHeapSizeLimit: number } }
      if (perf.memory) {
        memUsed = perf.memory.usedJSHeapSize
        memPercent = Math.min(100, (memUsed / perf.memory.jsHeapSizeLimit) * 100)
      } else {
        // 退化为基于时间戳的伪随机波动，保证视觉持续可读
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
        /* 不支持电池 API，忽略 */
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
  // 生成折线 points
  const points = history
    .map((v, i) => `${(i / (history.length - 1)) * 100},${28 - (v / max) * 24 - 2}`)
    .join(' ')

  return (
    <div className="dw-pulse">
      <div className="dw-pulse-row">
        <div className="dw-pulse-stat">
          <div className="dw-pulse-label">JS 堆内存</div>
          <div className="dw-pulse-value">{memMB} <span>MB</span></div>
        </div>
        <div className="dw-pulse-stat">
          <div className="dw-pulse-label">CPU 核心</div>
          <div className="dw-pulse-value">{metrics.cores}</div>
        </div>
      </div>
      <svg className="dw-pulse-graph" viewBox="0 0 100 28" preserveAspectRatio="none">
        <defs>
          <linearGradient id="dwPulseFill" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="var(--color-primary)" stopOpacity="0.45" />
            <stop offset="100%" stopColor="var(--color-primary)" stopOpacity="0" />
          </linearGradient>
        </defs>
        <polyline className="dw-pulse-line" points={points} fill="none" stroke="var(--color-primary)" strokeWidth="1.5" strokeLinejoin="round" strokeLinecap="round" />
        <polygon className="dw-pulse-area" points={`0,28 ${points} 100,28`} fill="url(#dwPulseFill)" />
      </svg>
      <div className="dw-pulse-row">
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
      </div>
    </div>
  )
})

// ============== 天气小部件（open-meteo 公开 API，无需密钥） ==============
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
      // 默认上海，保证无定位权限也能展示
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
        // 反向地理编码：open-meteo 提供的 geocoding 不支持反向，使用 BigDataCloud 免费 API
        let name = '当前位置'
        try {
          const r = await fetch(`https://api.bigdatacloud.net/data/reverse-geocode-client?latitude=${latitude}&longitude=${longitude}&localityLanguage=zh`)
          if (r.ok) {
            const j = await r.json()
            name = j.city || j.locality || j.principalSubdivision || '当前位置'
          }
        } catch {
          /* 使用默认名 */
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
    return <div className="dw-weather dw-weather-loading">正在获取天气…</div>
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
      <div className="dw-weather-main">
        <div className="dw-weather-icon">{info.icon}</div>
        <div>
          <div className="dw-weather-temp">{data.temp}°</div>
          <div className="dw-weather-label">{info.label}</div>
        </div>
      </div>
      <div className="dw-weather-meta">
        <span>💧 {data.humidity}%</span>
        <span>🌬 {data.wind} km/h</span>
      </div>
      <div className="dw-weather-loc">📍 {data.location}</div>
    </div>
  )
})

// ============== 快捷便签小部件 ==============
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
      <div className="dw-note-foot">{note.length} 字 · 自动保存</div>
    </div>
  )
})

// ============== 专注计时器小部件 ==============
const FocusWidget = memo(function FocusWidget({ minutes, onMinutesChange }: { minutes: number; onMinutesChange: (m: number) => void }) {
  const [remaining, setRemaining] = useState(minutes * 60)
  const [running, setRunning] = useState(false)
  const audioRef = useRef<AudioContext | null>(null)

  // 当时长变更且未运行时，重置剩余时间
  useEffect(() => {
    if (!running) setRemaining(minutes * 60)
  }, [minutes, running])

  useEffect(() => {
    if (!running) return
    const t = setInterval(() => {
      setRemaining((r) => {
        if (r <= 1) {
          // 完成
          setRunning(false)
          // 播放提示音
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
          } catch { /* 忽略音频错误 */ }
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

  const radius = 38
  const circ = 2 * Math.PI * radius

  return (
    <div className="dw-focus">
      <div className="dw-focus-ring">
        <svg width="96" height="96" viewBox="0 0 96 96">
          <circle cx="48" cy="48" r={radius} fill="none" stroke="var(--glass-border)" strokeWidth="5" />
          <circle
            cx="48" cy="48" r={radius} fill="none"
            stroke="var(--color-primary)" strokeWidth="5" strokeLinecap="round"
            strokeDasharray={circ}
            strokeDashoffset={circ * (1 - progress)}
            transform="rotate(-90 48 48)"
            style={{ transition: 'stroke-dashoffset 1s linear' }}
          />
        </svg>
        <div className="dw-focus-time">{running ? `${mm}:${ss}` : `${minutes}:00`}</div>
      </div>
      <div className="dw-focus-controls">
        {!running ? (
          <button className="dw-focus-btn dw-focus-btn-primary" onClick={() => { if (remaining === 0) setRemaining(minutes * 60); setRunning(true) }}>
            开始专注
          </button>
        ) : (
          <button className="dw-focus-btn" onClick={() => setRunning(false)}>暂停</button>
        )}
        <button className="dw-focus-btn" onClick={() => { setRunning(false); setRemaining(minutes * 60) }}>重置</button>
      </div>
      <div className="dw-focus-presets">
        {[15, 25, 45].map((m) => (
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

// ============== 单个小部件容器（可拖拽） ==============
const WidgetShell = memo(function WidgetShell({
  title, x, y, onClose, onDrag, children,
}: {
  title: string
  x: number
  y: number
  onClose: () => void
  onDrag: (x: number, y: number) => void
  children: React.ReactNode
}) {
  const dragRef = useRef<{ startX: number; startY: number; origX: number; origY: number } | null>(null)

  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    // 不拦截输入控件
    const target = e.target as HTMLElement
    if (target.closest('button, input, textarea, select')) return
    e.preventDefault()
    dragRef.current = { startX: e.clientX, startY: e.clientY, origX: x, origY: y }

    const onMove = (ev: MouseEvent) => {
      if (!dragRef.current) return
      const dx = ev.clientX - dragRef.current.startX
      const dy = ev.clientY - dragRef.current.startY
      const maxX = window.innerWidth - WIDGET_WIDTH - 8
      const maxY = window.innerHeight - 60
      onDrag(
        Math.max(0, Math.min(maxX, dragRef.current.origX + dx)),
        Math.max(0, Math.min(maxY, dragRef.current.origY + dy))
      )
    }
    const onUp = () => {
      dragRef.current = null
      window.removeEventListener('mousemove', onMove)
      window.removeEventListener('mouseup', onUp)
    }
    window.addEventListener('mousemove', onMove)
    window.addEventListener('mouseup', onUp)
  }, [x, y, onDrag])

  return (
    <div
      className="dw-shell"
      style={{ left: x, top: y, width: WIDGET_WIDTH }}
      onMouseDown={handleMouseDown}
    >
      <div className="dw-shell-header">
        <span className="dw-shell-drag" aria-hidden="true"><DragGlyph /></span>
        <span className="dw-shell-title">{title}</span>
        <button className="dw-shell-close" onClick={onClose} aria-label="关闭小部件" title="关闭">
          <CloseGlyph />
        </button>
      </div>
      <div className="dw-shell-body">{children}</div>
    </div>
  )
})

// ============== 主组件 ==============
const DesktopWidgets = memo(function DesktopWidgets({ visible }: { visible: boolean }) {
  const [state, setState] = useState<WidgetState>(() => loadWidgetState())
  const saveTimer = useRef<ReturnType<typeof setTimeout> | null>(null)

  // 监听外部可见性变更（右键菜单切换），重新读取持久化状态
  useEffect(() => {
    const handler = () => setState(loadWidgetState())
    window.addEventListener('weblinux-widgets-change', handler)
    return () => window.removeEventListener('weblinux-widgets-change', handler)
  }, [])

  const updateLayout = useCallback((id: WidgetId, patch: Partial<WidgetLayout>) => {
    setState((prev) => {
      const next: WidgetState = {
        ...prev,
        layout: prev.layout.map((l) => (l.id === id ? { ...l, ...patch } : l)),
      }
      if (saveTimer.current) clearTimeout(saveTimer.current)
      saveTimer.current = setTimeout(() => debouncedSaveToStorage(WIDGET_STORAGE_KEY, next, 300), 200)
      return next
    })
  }, [])

  const setNote = useCallback((note: string) => {
    setState((prev) => {
      const next = { ...prev, note }
      if (saveTimer.current) clearTimeout(saveTimer.current)
      saveTimer.current = setTimeout(() => debouncedSaveToStorage(WIDGET_STORAGE_KEY, next, 300), 200)
      return next
    })
  }, [])

  const setFocusMinutes = useCallback((m: number) => {
    setState((prev) => {
      const next = { ...prev, focusMinutes: m }
      debouncedSaveToStorage(WIDGET_STORAGE_KEY, next, 300)
      return next
    })
  }, [])

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
            title={WIDGET_TITLES[l.id]}
            x={l.x}
            y={l.y}
            onClose={() => updateLayout(l.id, { visible: false })}
            onDrag={(x, y) => updateLayout(l.id, { x, y })}
          >
            {l.id === 'clock' && <ClockWidget />}
            {l.id === 'pulse' && <PulseWidget />}
            {l.id === 'weather' && <WeatherWidget />}
            {l.id === 'note' && <NoteWidget note={state.note} onChange={setNote} />}
            {l.id === 'focus' && <FocusWidget minutes={state.focusMinutes} onMinutesChange={setFocusMinutes} />}
          </WidgetShell>
        )
      })}
    </div>
  )
})

const WIDGET_TITLES: Record<WidgetId, string> = {
  clock: '时钟',
  pulse: '系统脉搏',
  weather: '实时天气',
  note: '便签',
  focus: '专注计时器',
}

// 导出小部件可见性控制，供桌面右键菜单使用
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
  // 通知组件刷新
  window.dispatchEvent(new CustomEvent('weblinux-widgets-change'))
}

export function toggleAllWidgets(visible: boolean) {
  const st = loadWidgetState()
  const layout = st.layout.map((l) => ({ ...l, visible }))
  const next = { ...st, layout }
  debouncedSaveToStorage(WIDGET_STORAGE_KEY, next, 100)
  window.dispatchEvent(new CustomEvent('weblinux-widgets-change'))
}

export const WIDGET_IDS: WidgetId[] = ['clock', 'pulse', 'weather', 'focus', 'note']

export default DesktopWidgets
