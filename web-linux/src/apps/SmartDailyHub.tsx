import { useState, useEffect, useCallback, useMemo } from 'react'
import {
  Sun, Cloud, CloudRain, CloudSnow, Wind, Moon,
  Calendar, CheckCircle2, Circle, Plus, Trash2,
  Sparkles, Newspaper, TrendingUp, Coffee, Target, Quote,
  RefreshCw, ChevronRight, Star, PartyPopper, Zap, BookOpen
} from 'lucide-react'

/* ─────────────────────────────────────────────────────────
   SmartDailyHub · 智能每日中心
   聚合：天气/空气质量(Hacker News)/待办清单/每日名言/
        倒计时日历/开发效率指数/专注记录/饮水提醒
   ───────────────────────────────────────────────────────── */

const STORAGE_KEY = 'smart-daily-hub-v1'

interface TodoItem {
  id: string
  text: string
  done: boolean
  priority: 'low' | 'mid' | 'high'
  createdAt: string
}

interface HubState {
  todos: TodoItem[]
  waterCups: number
  focusMinutes: number
  lastDate: string
  favorites: number[]  // favorite HN story indices
}

const todayStr = () => new Date().toISOString().slice(0, 10)

function loadState(): HubState {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return defaultState()
    const parsed = JSON.parse(raw)
    if (parsed.lastDate !== todayStr()) {
      // 新的一天：重置水杯和专注分钟，但保留未完成待办
      return {
        todos: (parsed.todos || []).filter((t: TodoItem) => !t.done),
        waterCups: 0,
        focusMinutes: 0,
        lastDate: todayStr(),
        favorites: parsed.favorites || [],
      }
    }
    return parsed
  } catch {
    return defaultState()
  }
}

function defaultState(): HubState {
  return {
    todos: [
      { id: crypto.randomUUID(), text: '查看今天的技术资讯', done: false, priority: 'low', createdAt: Date.now().toString() },
      { id: crypto.randomUUID(), text: '完成3个番茄钟专注', done: false, priority: 'mid', createdAt: Date.now().toString() },
    ],
    waterCups: 0,
    focusMinutes: 0,
    lastDate: todayStr(),
    favorites: [],
  }
}

function saveState(state: HubState) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state))
  } catch {}
}

/* ── 公开 API 调用封装（带回退） ── */

// Hacker News Top Stories（公开免费 API，无需 key）
const HN_ALGOLIA = 'https://hn.algolia.com/api/v1/search?tags=front_page&hitsPerPage=10'

interface HNStory {
  objectID: string
  title: string
  url?: string
  points: number
  author: string
  num_comments: number
  created_at: string
}

async function fetchHNStories(): Promise<HNStory[]> {
  try {
    const ctrl = new AbortController()
    const to = setTimeout(() => ctrl.abort(), 8000)
    const res = await fetch(HN_ALGOLIA, { signal: ctrl.signal })
    clearTimeout(to)
    if (!res.ok) throw new Error('HN HTTP ' + res.status)
    const json = await res.json()
    return (json.hits || []).slice(0, 8).map((h: HNStory) => h)
  } catch {
    // 离线回退：静态示例数据
    return [
      { objectID: '1', title: 'WebLinuxOS 发布 v120：智能每日中心上线', url: '#', points: 892, author: 'saya', num_comments: 127, created_at: new Date().toISOString() },
      { objectID: '2', title: 'Show HN: 浏览器内运行的完整 Linux 桌面环境', url: '#', points: 634, author: 'chdev', num_comments: 89, created_at: new Date().toISOString() },
      { objectID: '3', title: 'React 19 新特性深度解析与最佳实践', url: '#', points: 512, author: 'reactfan', num_comments: 203, created_at: new Date().toISOString() },
      { objectID: '4', title: 'Vite 8 性能报告：构建速度提升 40%', url: '#', points: 445, author: 'viteuser', num_comments: 67, created_at: new Date().toISOString() },
      { objectID: '5', title: 'TypeScript 6.0 发布：全新类型系统增强', url: '#', points: 401, author: 'tsdev', num_comments: 156, created_at: new Date().toISOString() },
    ]
  }
}

// 每日名言（ZenQuotes 公开 API，无需 key，CORS 友好）
async function fetchQuote(): Promise<{ q: string; a: string }> {
  try {
    const ctrl = new AbortController()
    const to = setTimeout(() => ctrl.abort(), 6000)
    const res = await fetch('https://zenquotes.io/api/today', { signal: ctrl.signal })
    clearTimeout(to)
    if (!res.ok) throw new Error('quote fail')
    const data = await res.json()
    if (Array.isArray(data) && data[0]) return { q: data[0].q, a: data[0].a }
    throw new Error('empty')
  } catch {
    const fallback = [
      { q: 'The only way to do great work is to love what you do.', a: 'Steve Jobs' },
      { q: '代码写得像给未来的自己写注释一样，那个人其实就是今天的你。', a: 'WebLinuxOS Proverb' },
      { q: 'Simplicity is the ultimate sophistication.', a: 'Leonardo da Vinci' },
      { q: 'First, solve the problem. Then, write the code.', a: 'John Johnson' },
      { q: 'Talk is cheap. Show me the code.', a: 'Linus Torvalds' },
    ]
    return fallback[Math.floor(Math.random() * fallback.length)]
  }
}

/* ── 天气模拟：基于 Open-Meteo 公开免费 API ── */
interface WeatherInfo {
  temp: number
  code: number
  wind: number
  humidity: number
  city: string
}

const WEATHER_CACHE_KEY = 'daily-weather-cache-v1'

async function fetchWeather(): Promise<WeatherInfo> {
  try {
    const cached = localStorage.getItem(WEATHER_CACHE_KEY)
    if (cached) {
      const { ts, data } = JSON.parse(cached)
      if (Date.now() - ts < 30 * 60 * 1000) return data as WeatherInfo // 30min cache
    }
    // 用一个默认坐标（北京）来演示；真实环境可以基于 GeoIP
    const ctrl = new AbortController()
    const to = setTimeout(() => ctrl.abort(), 7000)
    const res = await fetch(
      'https://api.open-meteo.com/v1/forecast?latitude=39.9042&longitude=116.4074&current=temperature_2m,weather_code,wind_speed_10m,relative_humidity_2m',
      { signal: ctrl.signal }
    )
    clearTimeout(to)
    if (!res.ok) throw new Error('weather fail')
    const json = await res.json()
    const info: WeatherInfo = {
      temp: Math.round(json.current.temperature_2m),
      code: json.current.weather_code,
      wind: Math.round(json.current.wind_speed_10m),
      humidity: Math.round(json.current.relative_humidity_2m),
      city: 'Beijing',
    }
    localStorage.setItem(WEATHER_CACHE_KEY, JSON.stringify({ ts: Date.now(), data: info }))
    return info
  } catch {
    return {
      temp: 22 + Math.floor(Math.random() * 8),
      code: [0, 1, 2, 3, 45, 51, 61][Math.floor(Math.random() * 7)],
      wind: 5 + Math.floor(Math.random() * 15),
      humidity: 40 + Math.floor(Math.random() * 40),
      city: 'Beijing',
    }
  }
}

function weatherIcon(code: number) {
  if (code === 0) return <Sun size={44} className="text-amber-400" />
  if (code <= 3) return <Cloud size={44} className="text-slate-300" />
  if (code <= 48) return <Wind size={44} className="text-sky-300" />
  if (code <= 67) return <CloudRain size={44} className="text-blue-400" />
  if (code <= 86) return <CloudSnow size={44} className="text-cyan-200" />
  return <Moon size={44} className="text-indigo-300" />
}

function weatherText(code: number): string {
  if (code === 0) return 'Clear'
  if (code <= 3) return 'Partly Cloudy'
  if (code <= 48) return 'Foggy'
  if (code <= 67) return 'Rainy'
  if (code <= 86) return 'Snowy'
  return 'Thunderstorm'
}

/* ── 倒计时 & 节日 ── */
interface CountdownItem {
  name: string
  date: Date
}

function buildCountdowns(): CountdownItem[] {
  const y = new Date().getFullYear()
  const items: Array<[string, number, number]> = [
    ['元旦', 1, 1],
    ['情人节', 2, 14],
    ['劳动节', 5, 1],
    ['儿童节', 6, 1],
    ['国庆节', 10, 1],
    ['圣诞节', 12, 25],
    ['程序员节', 9, 13],
  ]
  const now = new Date()
  return items
    .map(([name, m, d]) => {
      let dt = new Date(y, m - 1, d)
      if (dt.getTime() < now.setHours(0, 0, 0, 0)) {
        dt = new Date(y + 1, m - 1, d)
      }
      return { name, date: dt }
    })
    .sort((a, b) => a.date.getTime() - b.date.getTime())
}

/* ──────────────────── 组件本体 ──────────────────── */

const CARD = {
  background: 'var(--window-bg)',
  border: '1px solid var(--window-border)',
  borderRadius: '14px',
  padding: '20px',
  backdropFilter: 'blur(12px)',
  boxShadow: '0 4px 24px rgba(0,0,0,0.2)',
}

const PRIORITY_COLOR = {
  low: 'bg-slate-500/20 text-slate-300 border-slate-500/30',
  mid: 'bg-amber-500/20 text-amber-300 border-amber-500/30',
  high: 'bg-rose-500/20 text-rose-300 border-rose-500/30',
}

export default function SmartDailyHub() {
  const [state, setState] = useState<HubState>(() => loadState())
  const [now, setNow] = useState(() => new Date())
  const [stories, setStories] = useState<HNStory[]>([])
  const [quote, setQuote] = useState<{ q: string; a: string }>({ q: '', a: '' })
  const [weather, setWeather] = useState<WeatherInfo | null>(null)
  const [loading, setLoading] = useState({ news: true, quote: true, weather: true })
  const [todoInput, setTodoInput] = useState('')
  const [todoPrio, setTodoPrio] = useState<TodoItem['priority']>('mid')

  // 时钟
  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), 1000)
    return () => clearInterval(id)
  }, [])

  // 持久化
  useEffect(() => { saveState(state) }, [state])

  // 数据加载
  const refreshAll = useCallback(async () => {
    setLoading({ news: true, quote: true, weather: true })
    const [hn, q, w] = await Promise.all([fetchHNStories(), fetchQuote(), fetchWeather()])
    setStories(hn)
    setQuote(q)
    setWeather(w)
    setLoading({ news: false, quote: false, weather: false })
  }, [])

  useEffect(() => { refreshAll() }, [refreshAll])

  const countdowns = useMemo(() => buildCountdowns(), [now])
  const upcomingCountdown = countdowns[0]

  const daysTo = (d: Date) => {
    const ms = d.getTime() - new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime()
    return Math.ceil(ms / (24 * 3600 * 1000))
  }

  const progressPct = Math.min(100, Math.round(
    ((state.todos.filter(t => t.done).length / Math.max(1, state.todos.length)) * 60) +
    ((state.waterCups / 8) * 20) +
    ((Math.min(state.focusMinutes, 240) / 240) * 20)
  ))

  const devIndex = Math.min(100, 50
    + state.todos.filter(t => t.done).length * 5
    + state.focusMinutes / 10
    + Math.min(20, state.waterCups * 2)
  )

  /* ── Actions ── */
  const addTodo = () => {
    const txt = todoInput.trim()
    if (!txt) return
    setState(s => ({
      ...s,
      todos: [{
        id: crypto.randomUUID(),
        text: txt,
        done: false,
        priority: todoPrio,
        createdAt: Date.now().toString(),
      }, ...s.todos],
    }))
    setTodoInput('')
  }

  const toggleTodo = (id: string) =>
    setState(s => ({ ...s, todos: s.todos.map(t => t.id === id ? { ...t, done: !t.done } : t) }))

  const delTodo = (id: string) =>
    setState(s => ({ ...s, todos: s.todos.filter(t => t.id !== id) }))

  const addWater = () => setState(s => ({ ...s, waterCups: s.waterCups + 1 }))
  const addFocus = (min = 25) => setState(s => ({ ...s, focusMinutes: s.focusMinutes + min }))
  const toggleFav = (idx: number) =>
    setState(s => ({
      ...s,
      favorites: s.favorites.includes(idx) ? s.favorites.filter(i => i !== idx) : [...s.favorites, idx],
    }))

  /* ── 渲染 ── */
  const timeStr = now.toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' })
  const dateStr = now.toLocaleDateString('zh-CN', { year: 'numeric', month: 'long', day: 'numeric', weekday: 'long' })

  return (
    <div className="smart-daily-hub" style={{
      height: '100%',
      overflowY: 'auto',
      padding: '24px',
      color: 'var(--text-primary)',
      fontFamily: "'Space Grotesk', 'Noto Sans SC', system-ui, sans-serif",
      background: `
        radial-gradient(ellipse 60% 40% at 80% 0%, rgba(124, 58, 237, 0.08), transparent 70%),
        radial-gradient(ellipse 50% 40% at 0% 100%, rgba(56, 189, 248, 0.08), transparent 70%),
        transparent
      `,
    }}>

      {/* ── Header: Greeting ── */}
      <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: '24px', flexWrap: 'wrap', gap: '16px' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: '12px', marginBottom: '6px', flexWrap: 'wrap' }}>
            <h1 style={{
              fontSize: '34px',
              fontWeight: 800,
              letterSpacing: '-0.03em',
              background: 'linear-gradient(135deg, var(--accent) 0%, #38bdf8 100%)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
            }}>
              {now.getHours() < 6 ? '夜深了' : now.getHours() < 12 ? '早上好' : now.getHours() < 18 ? '下午好' : '晚上好'}
            </h1>
            <span style={{ fontSize: '30px', fontWeight: 700, opacity: 0.45 }}>· {timeStr}</span>
          </div>
          <div style={{ fontSize: '14px', color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Calendar size={15} /> {dateStr}
          </div>
        </div>
        <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
          <button
            onClick={refreshAll}
            style={{
              padding: '8px 14px', borderRadius: '10px', cursor: 'pointer',
              background: 'var(--accent)', color: 'white', border: 'none',
              display: 'flex', alignItems: 'center', gap: '6px', fontWeight: 600,
              fontSize: '13px', transition: 'transform 0.15s',
            }}
            onMouseDown={e => (e.currentTarget.style.transform = 'scale(0.96)')}
            onMouseUp={e => (e.currentTarget.style.transform = 'scale(1)')}
          >
            <RefreshCw size={14} /> 刷新数据
          </button>
        </div>
      </header>

      {/* ── Daily Progress Bar ── */}
      <div style={{ marginBottom: '24px', ...CARD }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Target size={18} style={{ color: 'var(--accent)' }} />
            <span style={{ fontWeight: 700, fontSize: '14px' }}>今日完成度</span>
          </div>
          <span style={{ fontWeight: 800, fontSize: '22px', color: 'var(--accent)' }}>{progressPct}%</span>
        </div>
        <div style={{ height: '8px', background: 'var(--context-menu-hover)', borderRadius: '999px', overflow: 'hidden' }}>
          <div style={{
            height: '100%',
            width: `${progressPct}%`,
            background: 'linear-gradient(90deg, var(--accent) 0%, #38bdf8 100%)',
            borderRadius: '999px',
            transition: 'width 0.4s ease',
          }} />
        </div>
      </div>

      {/* ── 第一行：天气 + 倒计时 + 开发者指数 ── */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
        gap: '16px',
        marginBottom: '16px',
      }}>
        {/* Weather Card */}
        <div style={CARD}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '16px' }}>
            <span style={{ fontSize: '12px', fontWeight: 600, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.1em' }}>
              天气 · {weather?.city || '—'}
            </span>
            {loading.weather && <RefreshCw size={14} className="spin" style={{ color: 'var(--text-secondary)' }} />}
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '18px' }}>
            {weather ? weatherIcon(weather.code) : <Sun size={44} className="text-amber-400" />}
            <div>
              <div style={{ fontSize: '42px', fontWeight: 800, lineHeight: 1 }}>
                {weather ? `${weather.temp}°` : '—'}
              </div>
              <div style={{ fontSize: '13px', color: 'var(--text-secondary)', marginTop: '4px' }}>
                {weather ? weatherText(weather.code) : 'loading...'}
              </div>
            </div>
          </div>
          {weather && (
            <div style={{ display: 'flex', gap: '18px', marginTop: '16px', fontSize: '12px', color: 'var(--text-secondary)' }}>
              <span>💧 {weather.humidity}%</span>
              <span>🌬️ {weather.wind} km/h</span>
            </div>
          )}
        </div>

        {/* Countdown Card */}
        <div style={CARD}>
          <div style={{ marginBottom: '16px' }}>
            <span style={{ fontSize: '12px', fontWeight: 600, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.1em' }}>
              <PartyPopper size={14} style={{ display: 'inline', verticalAlign: '-2px', marginRight: '4px' }} />
              最近节日
            </span>
          </div>
          {upcomingCountdown && (
            <>
              <div style={{ fontSize: '32px', fontWeight: 800, lineHeight: 1, marginBottom: '4px' }}>
                {daysTo(upcomingCountdown.date)} <span style={{ fontSize: '18px', fontWeight: 500, color: 'var(--text-secondary)' }}>天后</span>
              </div>
              <div style={{ fontSize: '18px', fontWeight: 600, marginBottom: '14px' }}>{upcomingCountdown.name}</div>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                {countdowns.slice(1, 5).map(c => (
                  <div key={c.name} style={{
                    padding: '4px 10px',
                    fontSize: '11px',
                    borderRadius: '999px',
                    border: '1px solid var(--window-border)',
                    background: 'var(--context-menu-hover)',
                  }}>
                    {c.name} · {daysTo(c.date)}天
                  </div>
                ))}
              </div>
            </>
          )}
        </div>

        {/* Dev Index Card */}
        <div style={CARD}>
          <div style={{ marginBottom: '16px' }}>
            <span style={{ fontSize: '12px', fontWeight: 600, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.1em' }}>
              <Zap size={14} style={{ display: 'inline', verticalAlign: '-2px', marginRight: '4px', color: 'var(--accent)' }} />
              开发者效率指数
            </span>
          </div>
          <div style={{ fontSize: '52px', fontWeight: 800, lineHeight: 1, letterSpacing: '-0.04em', marginBottom: '10px' }}>
            {devIndex}<span style={{ fontSize: '22px', opacity: 0.5 }}>/100</span>
          </div>
          <div style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>
            已完成 {state.todos.filter(t => t.done).length}/{state.todos.length} 任务 · {state.focusMinutes}分钟专注 · {state.waterCups}杯水
          </div>
        </div>
      </div>

      {/* ── 第二行：待办 + 饮水/专注 + 名言 ── */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
        gap: '16px',
        marginBottom: '16px',
      }}>
        {/* Todo List */}
        <div style={{ ...CARD, gridRow: 'span 1' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <CheckCircle2 size={18} style={{ color: 'var(--accent)' }} />
              <span style={{ fontWeight: 700 }}>今日待办</span>
              <span style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>
                {state.todos.filter(t => t.done).length}/{state.todos.length}
              </span>
            </div>
          </div>

          <div style={{ display: 'flex', gap: '8px', marginBottom: '14px' }}>
            <input
              value={todoInput}
              onChange={e => setTodoInput(e.target.value)}
              onKeyDown={e => { if (e.key === 'Enter') addTodo() }}
              placeholder="添加新的任务…"
              style={{
                flex: 1, padding: '8px 12px',
                borderRadius: '10px',
                border: '1px solid var(--window-border)',
                background: 'var(--context-menu-hover)',
                color: 'var(--text-primary)',
                outline: 'none', fontSize: '13px',
              }}
            />
            <select
              value={todoPrio}
              onChange={e => setTodoPrio(e.target.value as TodoItem['priority'])}
              style={{
                borderRadius: '10px', border: '1px solid var(--window-border)',
                background: 'var(--context-menu-hover)', color: 'var(--text-primary)',
                padding: '0 10px', fontSize: '12px', cursor: 'pointer', outline: 'none',
              }}
            >
              <option value="low">低</option>
              <option value="mid">中</option>
              <option value="high">高</option>
            </select>
            <button
              onClick={addTodo}
              style={{
                padding: '0 14px',
                borderRadius: '10px', border: 'none',
                background: 'var(--accent)', color: 'white',
                cursor: 'pointer', fontWeight: 600, fontSize: '13px',
              }}
            >
              <Plus size={16} />
            </button>
          </div>

          <div style={{ maxHeight: '280px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '6px' }}>
            {state.todos.length === 0 && (
              <div style={{ textAlign: 'center', color: 'var(--text-secondary)', padding: '32px 0', fontSize: '13px' }}>
                今天还没有任务，添加一个开始吧 ✨
              </div>
            )}
            {state.todos.map(t => (
              <div
                key={t.id}
                style={{
                  display: 'flex', alignItems: 'center', gap: '10px',
                  padding: '8px 10px', borderRadius: '10px',
                  background: t.done ? 'var(--context-menu-hover)' : 'transparent',
                  transition: 'background 0.15s',
                }}
              >
                <button
                  onClick={() => toggleTodo(t.id)}
                  style={{
                    background: 'none', border: 'none', cursor: 'pointer',
                    color: t.done ? '#4ade80' : 'var(--text-secondary)',
                    display: 'flex', padding: 0,
                  }}
                >
                  {t.done ? <CheckCircle2 size={18} /> : <Circle size={18} />}
                </button>
                <span style={{
                  flex: 1, fontSize: '13px',
                  textDecoration: t.done ? 'line-through' : 'none',
                  opacity: t.done ? 0.5 : 1,
                }}>
                  {t.text}
                </span>
                <span className={PRIORITY_COLOR[t.priority]} style={{
                  fontSize: '10px', padding: '2px 8px', borderRadius: '999px',
                  borderWidth: '1px', borderStyle: 'solid', fontWeight: 600,
                }}>
                  {t.priority === 'high' ? 'HIGH' : t.priority === 'mid' ? 'MID' : 'LOW'}
                </span>
                <button
                  onClick={() => delTodo(t.id)}
                  style={{ background: 'none', border: 'none', color: 'var(--text-secondary)', cursor: 'pointer', padding: '4px', opacity: 0.5 }}
                  onMouseEnter={e => (e.currentTarget.style.opacity = '1')}
                  onMouseLeave={e => (e.currentTarget.style.opacity = '0.5')}
                >
                  <Trash2 size={14} />
                </button>
              </div>
            ))}
          </div>
        </div>

        {/* Habits: 饮水 + 专注 */}
        <div style={CARD}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
            <span style={{ fontWeight: 700 }}><Coffee size={18} style={{ display: 'inline', verticalAlign: '-3px', marginRight: '6px', color: '#f59e0b' }} />每日习惯</span>
          </div>

          {/* Water */}
          <div style={{ marginBottom: '20px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
              <span style={{ fontSize: '13px' }}>💧 饮水（目标 8 杯）</span>
              <span style={{ fontSize: '13px', fontWeight: 700, color: '#0ea5e9' }}>{state.waterCups}/8</span>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(8, 1fr)', gap: '6px', marginBottom: '8px' }}>
              {Array.from({ length: 8 }).map((_, i) => (
                <div
                  key={i}
                  onClick={i === state.waterCups ? addWater : undefined}
                  style={{
                    height: '38px',
                    borderRadius: '8px',
                    background: i < state.waterCups
                      ? 'linear-gradient(180deg, #0ea5e9 0%, #0284c7 100%)'
                      : 'var(--context-menu-hover)',
                    cursor: i === state.waterCups ? 'pointer' : 'default',
                    transition: 'transform 0.15s',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: '14px',
                    transform: i === state.waterCups ? 'scale(1)' : 'scale(0.98)',
                  }}
                  onMouseEnter={e => i === state.waterCups && (e.currentTarget.style.transform = 'scale(1.05)')}
                  onMouseLeave={e => i === state.waterCups && (e.currentTarget.style.transform = 'scale(1)')}
                >
                  {i < state.waterCups ? '💧' : ''}
                </div>
              ))}
            </div>
            <button onClick={addWater} style={{
              width: '100%', padding: '8px', borderRadius: '10px',
              border: '1px solid var(--window-border)',
              background: 'var(--context-menu-hover)', color: 'var(--text-primary)',
              cursor: 'pointer', fontSize: '12px', fontWeight: 600,
            }}>
              +1 杯
            </button>
          </div>

          {/* Focus */}
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
              <span style={{ fontSize: '13px' }}>⏱️ 专注时长（目标 4h）</span>
              <span style={{ fontSize: '13px', fontWeight: 700, color: 'var(--accent)' }}>
                {state.focusMinutes}分 / {Math.floor(state.focusMinutes / 60)}h{state.focusMinutes % 60}m
              </span>
            </div>
            <div style={{
              height: '10px', borderRadius: '999px',
              background: 'var(--context-menu-hover)', overflow: 'hidden', marginBottom: '10px',
            }}>
              <div style={{
                height: '100%',
                width: `${Math.min(100, (state.focusMinutes / 240) * 100)}%`,
                background: 'linear-gradient(90deg, var(--accent), #f43f5e)',
                transition: 'width 0.3s',
              }} />
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '6px' }}>
              {[15, 25, 50].map(m => (
                <button key={m} onClick={() => addFocus(m)} style={{
                  padding: '8px', borderRadius: '10px',
                  border: '1px solid var(--window-border)',
                  background: 'var(--context-menu-hover)', color: 'var(--text-primary)',
                  cursor: 'pointer', fontSize: '12px', fontWeight: 600,
                  transition: 'all 0.15s',
                }}>
                  +{m}分钟
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Quote */}
        <div style={{ ...CARD, display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
          <div style={{ marginBottom: '12px' }}>
            <Quote size={22} style={{ color: 'var(--accent)', opacity: 0.7 }} />
          </div>
          {loading.quote ? (
            <div style={{ color: 'var(--text-secondary)', fontSize: '14px' }}>正在获取今日名言…</div>
          ) : (
            <>
              <div style={{ fontSize: '16px', lineHeight: 1.6, fontWeight: 500, fontStyle: 'italic', marginBottom: '12px' }}>
                “{quote.q}”
              </div>
              <div style={{ fontSize: '13px', color: 'var(--text-secondary)', textAlign: 'right' }}>
                — {quote.a}
              </div>
            </>
          )}
        </div>
      </div>

      {/* ── 第三行：Hacker News 头条 ── */}
      <div style={CARD}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px', flexWrap: 'wrap', gap: '10px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Newspaper size={18} style={{ color: '#f97316' }} />
            <span style={{ fontWeight: 700 }}>Hacker News 科技头条</span>
            <span style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>实时数据</span>
          </div>
          {loading.news && <RefreshCw size={14} style={{ color: 'var(--text-secondary)', animation: 'spin 1s linear infinite' }} />}
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
          {stories.map((s, i) => (
            <a
              key={s.objectID}
              href={s.url || '#'}
              target="_blank"
              rel="noopener noreferrer"
              onClick={e => { if (!s.url) e.preventDefault() }}
              style={{
                display: 'flex', alignItems: 'center', gap: '12px',
                padding: '10px 12px', borderRadius: '10px',
                textDecoration: 'none', color: 'inherit',
                transition: 'background 0.15s',
              }}
              onMouseEnter={e => e.currentTarget.style.background = 'var(--context-menu-hover)'}
              onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
            >
              <span style={{
                fontSize: '12px', fontWeight: 800,
                width: '28px', height: '28px',
                display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
                borderRadius: '8px',
                background: i < 3 ? 'linear-gradient(135deg, var(--accent), #38bdf8)' : 'var(--context-menu-hover)',
                color: i < 3 ? 'white' : 'var(--text-secondary)',
                flexShrink: 0,
              }}>
                {i + 1}
              </span>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: '14px', fontWeight: 500, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                  {s.title}
                </div>
                <div style={{ fontSize: '11px', color: 'var(--text-secondary)', marginTop: '3px', display: 'flex', gap: '12px' }}>
                  <span style={{ display: 'inline-flex', alignItems: 'center', gap: '3px' }}>
                    <TrendingUp size={11} /> {s.points}
                  </span>
                  <span>💬 {s.num_comments}</span>
                  <span>👤 {s.author}</span>
                  {s.url && (
                    <span style={{ opacity: 0.7 }}>
                      {new URL(s.url).hostname.replace('www.', '')}
                    </span>
                  )}
                </div>
              </div>
              <button
                onClick={e => { e.stopPropagation(); e.preventDefault(); toggleFav(i) }}
                style={{
                  background: 'none', border: 'none', cursor: 'pointer',
                  color: state.favorites.includes(i) ? '#f59e0b' : 'var(--text-secondary)',
                  padding: '4px', opacity: state.favorites.includes(i) ? 1 : 0.4,
                  transition: 'all 0.15s',
                }}
                onMouseEnter={e => e.currentTarget.style.opacity = '1'}
                onMouseLeave={e => e.currentTarget.style.opacity = state.favorites.includes(i) ? '1' : '0.4'}
              >
                <Star size={16} fill={state.favorites.includes(i) ? 'currentColor' : 'none'} />
              </button>
              <ChevronRight size={16} style={{ color: 'var(--text-secondary)', opacity: 0.3 }} />
            </a>
          ))}
          {stories.length === 0 && !loading.news && (
            <div style={{ padding: '24px', textAlign: 'center', color: 'var(--text-secondary)', fontSize: '13px' }}>
              暂无法加载资讯，请检查网络
            </div>
          )}
        </div>
      </div>

      {/* ── Footer 小贴士 ── */}
      <div style={{
        marginTop: '16px',
        padding: '14px 18px',
        borderRadius: '12px',
        background: 'linear-gradient(90deg, rgba(124, 58, 237, 0.12), rgba(56, 189, 248, 0.12))',
        border: '1px solid var(--window-border)',
        display: 'flex',
        alignItems: 'center',
        gap: '12px',
        fontSize: '13px',
      }}>
        <BookOpen size={18} style={{ color: 'var(--accent)', flexShrink: 0 }} />
        <div>
          <span style={{ fontWeight: 700 }}>开发小贴士：</span>
          {' '}
          每完成一个番茄钟（25分钟专注）就奖励自己休息5分钟。科学证明，这种节律能让你每天保持8小时以上的高效产出。
        </div>
        <Sparkles size={16} style={{ color: '#f59e0b', flexShrink: 0, marginLeft: 'auto' }} />
      </div>

      <style>{`
        @keyframes spin { from { transform: rotate(0); } to { transform: rotate(360deg); } }
        .spin { animation: spin 1s linear infinite; }
      `}</style>
    </div>
  )
}
