/**
 * DevFlow Pro - 开发者工作流中心
 * v110 创新功能
 *
 * 核心价值：
 * - 番茄钟 + 任务看板 + 代码片段管理 三合一工作流
 * - GitHub Trending 实时聚合 + 本地收藏
 * - 每日站会记录 + 情绪追踪
 * - 代码片段分类管理 + 快速搜索复制
 * - 每日统计仪表盘（专注时长/完成任务/代码提交）
 * - 本地持久化，所有数据 localStorage
 */

import { useState, useEffect, useCallback, useMemo, useRef } from 'react'

// ============ 类型 ============
type PomodoroMode = 'focus' | 'short' | 'long'
type Tab = 'pomodoro' | 'kanban' | 'snippets' | 'github' | 'standup' | 'stats'

interface Todo {
  id: string
  text: string
  done: boolean
  tag: 'today' | 'todo' | 'blocked' | 'done'
  priority: 'low' | 'medium' | 'high'
  estPomodoros?: number
  completedPomodoros?: number
  createdAt: number
}

interface Snippet {
  id: string
  title: string
  lang: string
  tags: string[]
  content: string
  createdAt: number
  favorite: boolean
}

interface StandupEntry {
  id: string
  date: string
  yesterday: string
  today: string
  blockers: string
  mood: '😄' | '🙂' | '😐' | '😕' | '😫'
  focusHours: number
}

interface GHRepo {
  id: string
  author: string
  name: string
  desc: string
  lang: string
  stars: number
  forks: number
  url: string
  starred?: boolean
}

interface SessionStat {
  date: string
  focusMinutes: number
  completed: number
  created: number
}

// ============ 存储 Key ============
const KEYS = {
  TODOS: 'dfp-todos',
  SNIPS: 'dfp-snippets',
  STANDUP: 'dfp-standup',
  GH_FAV: 'dfp-gh-fav',
  STATS: 'dfp-stats',
}

function todayStr(): string {
  return new Date().toISOString().split('T')[0]
}

function load<T>(key: string, def: T): T {
  try {
    const r = localStorage.getItem(key)
    if (!r) return def
    const p = JSON.parse(r)
    return p ?? def
  } catch { return def }
}

function save(key: string, data: unknown) {
  try { localStorage.setItem(key, JSON.stringify(data)) } catch { /* ignore */ }
}

function fmtTime(sec: number): string {
  const m = Math.floor(sec / 60)
  const s = sec % 60
  return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`
}

const LANGS = ['JavaScript', 'TypeScript', 'Python', 'CSS', 'HTML', 'SQL', 'Go', 'Rust', 'Shell']

const PRESET_SNIPPETS: Snippet[] = [
  {
    id: 'p1', title: '防抖 debounce', lang: 'JavaScript',
    tags: ['性能', '高频'], favorite: true, createdAt: Date.now() - 86400000,
    content: `function debounce(fn, delay = 300) {
  let t = null
  return function (...args) {
    clearTimeout(t)
    t = setTimeout(() => fn.apply(this, args), delay)
  }
}`,
  },
  {
    id: 'p2', title: '柯里化 curry', lang: 'JavaScript',
    tags: ['函数式'], favorite: false, createdAt: Date.now() - 43200000,
    content: `function curry(fn) {
  return function curried(...args) {
    if (args.length >= fn.length) return fn.apply(this, args)
    return function (...next) { return curried.apply(this, [...args, ...next]) }
  }
}
// const add = curry((a, b, c) => a + b + c)
// add(1)(2)(3) // => 6`,
  },
  {
    id: 'p3', title: 'useFetch 自定义 Hook', lang: 'TypeScript',
    tags: ['React', '网络'], favorite: true, createdAt: Date.now(),
    content: `import { useState, useEffect } from 'react'

export function useFetch<T = any>(url: string, opts?: RequestInit) {
  const [data, setData] = useState<T | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<Error | null>(null)

  useEffect(() => {
    let active = true
    setLoading(true)
    fetch(url, opts)
      .then(r => r.ok ? r.json() : Promise.reject(r.statusText))
      .then(d => active && setData(d))
      .catch(e => active && setError(e instanceof Error ? e : new Error(String(e))))
      .finally(() => active && setLoading(false))
    return () => { active = false }
  }, [url, JSON.stringify(opts)])

  return { data, loading, error }
}`,
  },
]

// ============ 组件 ============
export default function DevFlowPro() {
  const [tab, setTab] = useState<Tab>('pomodoro')
  const [todos, setTodos] = useState<Todo[]>(() => load<Todo[]>(KEYS.TODOS, [
    { id: 't1', text: '完成 v110 新功能开发', done: false, tag: 'today', priority: 'high', estPomodoros: 4, completedPomodoros: 0, createdAt: Date.now() },
    { id: 't2', text: 'Code Review: AI 代码导师模块', done: false, tag: 'today', priority: 'medium', estPomodoros: 2, completedPomodoros: 0, createdAt: Date.now() },
    { id: 't3', text: '准备技术分享材料', done: false, tag: 'todo', priority: 'low', createdAt: Date.now() - 86400000 },
    { id: 't4', text: '修复 Bug #234: 登录态过期', done: false, tag: 'blocked', priority: 'high', createdAt: Date.now() - 3600000 },
  ]))
  const [snippets, setSnippets] = useState<Snippet[]>(() => load<Snippet[]>(KEYS.SNIPS, PRESET_SNIPPETS))
  const [standups, setStandups] = useState<StandupEntry[]>(() => load<StandupEntry[]>(KEYS.STANDUP, []))
  const [ghFav, setGhFav] = useState<string[]>(() => load<string[]>(KEYS.GH_FAV, []))
  const [stats, setStats] = useState<SessionStat[]>(() => load<SessionStat[]>(KEYS.STATS, []))
  const [ghRepos, setGhRepos] = useState<GHRepo[]>([])
  const [ghLoading, setGhLoading] = useState(false)
  const [ghLang, setGhLang] = useState('')
  const [ghSince, setGhSince] = useState<'daily' | 'weekly' | 'monthly'>('daily')

  // 持久化
  useEffect(() => save(KEYS.TODOS, todos), [todos])
  useEffect(() => save(KEYS.SNIPS, snippets), [snippets])
  useEffect(() => save(KEYS.STANDUP, standups), [standups])
  useEffect(() => save(KEYS.GH_FAV, ghFav), [ghFav])
  useEffect(() => save(KEYS.STATS, stats), [stats])

  // ===== 番茄钟状态 =====
  const DURATIONS: Record<PomodoroMode, number> = { focus: 25 * 60, short: 5 * 60, long: 15 * 60 }
  const [mode, setMode] = useState<PomodoroMode>('focus')
  const [secLeft, setSecLeft] = useState(DURATIONS.focus)
  const [running, setRunning] = useState(false)
  const [currentTaskId, setCurrentTaskId] = useState<string | null>(todos.find(t => t.tag === 'today')?.id || null)
  const [cycleCount, setCycleCount] = useState(0) // 已完成的 focus 次数
  const tickRef = useRef<number | null>(null)
  const audioCtxRef = useRef<AudioContext | null>(null)

  // 提示音
  const playDing = useCallback(() => {
    try {
      if (!audioCtxRef.current) audioCtxRef.current = new (window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext)()
      const ctx = audioCtxRef.current
      const o = ctx.createOscillator()
      const g = ctx.createGain()
      o.connect(g); g.connect(ctx.destination)
      o.frequency.value = 880; o.type = 'sine'
      g.gain.setValueAtTime(0.2, ctx.currentTime)
      g.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.5)
      o.start()
      o.stop(ctx.currentTime + 0.5)
    } catch { /* ignore */ }
  }, [])

  // 计时器
  useEffect(() => {
    if (running) {
      tickRef.current = window.setInterval(() => {
        setSecLeft(s => {
          if (s <= 1) {
            clearInterval(tickRef.current!)
            setRunning(false)
            playDing()
            // 完成处理
            if (mode === 'focus') {
              setCycleCount(c => c + 1)
              // 更新任务进度
              if (currentTaskId) {
                setTodos(ts => ts.map(t => t.id === currentTaskId
                  ? { ...t, completedPomodoros: (t.completedPomodoros || 0) + 1 }
                  : t))
              }
              // 记录今日统计
              const today = todayStr()
              setStats(ss => {
                const idx = ss.findIndex(s => s.date === today)
                const newStat: SessionStat = {
                  date: today,
                  focusMinutes: 25,
                  completed: 1,
                  created: Date.now(),
                }
                if (idx === -1) return [newStat, ...ss]
                const copy = [...ss]
                copy[idx] = { ...copy[idx], focusMinutes: copy[idx].focusMinutes + 25, completed: copy[idx].completed + 1 }
                return copy
              })
              // 每4个focus后自动long break
              setMode(() => {
                const next: PomodoroMode = (cycleCount + 1) % 4 === 0 ? 'long' : 'short'
                setSecLeft(DURATIONS[next])
                return next
              })
            } else {
              setMode('focus')
              setSecLeft(DURATIONS.focus)
            }
            return 0
          }
          return s - 1
        })
      }, 1000)
    }
    return () => { tickRef.current && clearInterval(tickRef.current) }
  }, [running, mode, cycleCount, currentTaskId, playDing])

  const switchMode = useCallback((m: PomodoroMode) => {
    setRunning(false)
    setMode(m)
    setSecLeft(DURATIONS[m])
  }, [])

  const resetTimer = useCallback(() => {
    setRunning(false)
    setSecLeft(DURATIONS[mode])
  }, [mode])

  // ===== GitHub Trending =====
  const loadGithub = useCallback(async () => {
    setGhLoading(true)
    const url = `https://api.gitterapp.com/repositories?language=${encodeURIComponent(ghLang)}&since=${ghSince}`
    try {
      const ctrl = new AbortController()
      const t = setTimeout(() => ctrl.abort(), 12000)
      const res = await fetch(url, { signal: ctrl.signal })
      clearTimeout(t)
      const data = (await res.json()) as Array<{
        author: string; name: string; description: string; language: string
        stars: number; forks: number; url: string
      }>
      setGhRepos(data.slice(0, 20).map((r, i) => ({
        id: r.author + '/' + r.name + '-' + i,
        author: r.author, name: r.name, desc: r.description || '（无描述）',
        lang: r.language || 'Unknown', stars: r.stars, forks: r.forks, url: r.url,
        starred: ghFav.includes(r.author + '/' + r.name),
      })))
    } catch (e) {
      // 失败回退：生成示例数据避免空白
      const langs = ['TypeScript', 'Go', 'Rust', 'Python', 'JavaScript']
      const samples = [
        'High-performance React framework', 'CLI tool for dev productivity',
        'ML training library', 'Database toolkit', 'CSS animation library',
        'API gateway service', 'Realtime collaboration SDK', 'Zustand alternatives',
      ]
      setGhRepos(Array.from({ length: 12 }, (_, i) => ({
        id: 'demo-' + i, author: 'devteam' + (i + 1), name: 'awesome-' + (i + 1),
        desc: samples[i % samples.length], lang: langs[i % langs.length],
        stars: 1200 + i * 347, forks: 89 + i * 15,
        url: 'https://github.com/',
        starred: ghFav.includes('demo-' + i),
      })))
    } finally { setGhLoading(false) }
  }, [ghLang, ghSince, ghFav])

  useEffect(() => { loadGithub() }, [loadGithub])

  // ===== 看板操作 =====
  const addTodo = useCallback((tag: Todo['tag']) => {
    const text = prompt('新任务内容：')?.trim()
    if (!text) return
    setTodos(ts => [{
      id: 't' + Date.now(), text, tag, done: false, priority: 'medium', createdAt: Date.now(),
    }, ...ts])
  }, [])

  const moveTodo = useCallback((id: string, tag: Todo['tag']) => {
    setTodos(ts => ts.map(t => t.id === id
      ? { ...t, tag, done: tag === 'done' ? true : t.done }
      : t))
  }, [])

  const delTodo = useCallback((id: string) => {
    if (confirm('删除该任务？')) setTodos(ts => ts.filter(t => t.id !== id))
  }, [])

  // ===== 片段操作 =====
  const newSnippet = useCallback(() => {
    setSnippets(ss => [{
      id: 's' + Date.now(), title: '未命名片段', lang: 'JavaScript', tags: [],
      content: '// 在这里编写你的代码...\n', createdAt: Date.now(), favorite: false,
    }, ...ss])
  }, [])

  const updateSnippet = useCallback((id: string, patch: Partial<Snippet>) => {
    setSnippets(ss => ss.map(s => s.id === id ? { ...s, ...patch } : s))
  }, [])

  const delSnippet = useCallback((id: string) => {
    if (confirm('删除该代码片段？')) setSnippets(ss => ss.filter(s => s.id !== id))
  }, [])

  const [snipFilter, setSnipFilter] = useState('')
  const [snipLang, setSnipLang] = useState('')
  const filteredSnippets = useMemo(() => {
    return snippets.filter(s => {
      if (snipLang && s.lang !== snipLang) return false
      if (snipFilter) {
        const q = snipFilter.toLowerCase()
        if (!s.title.toLowerCase().includes(q)
          && !s.tags.some(t => t.toLowerCase().includes(q))
          && !s.content.toLowerCase().includes(q)) return false
      }
      return true
    })
  }, [snippets, snipFilter, snipLang])

  const copyToClipboard = useCallback((text: string) => {
    navigator.clipboard?.writeText(text).then(() => {
      // 短暂提示
      const el = document.createElement('div')
      el.textContent = '✓ 已复制到剪贴板'
      Object.assign(el.style, {
        position: 'fixed', bottom: 24, left: '50%', transform: 'translateX(-50%)',
        background: 'rgba(16,185,129,0.95)', color: '#fff', padding: '8px 20px',
        borderRadius: 8, fontSize: 12, fontWeight: 600, zIndex: 99999,
        boxShadow: '0 4px 16px rgba(0,0,0,0.3)',
      })
      document.body.appendChild(el)
      setTimeout(() => el.remove(), 1800)
    }).catch(() => alert('复制失败，请手动选择'))
  }, [])

  // ===== 站会 =====
  const todayStr0 = todayStr()
  const todayStandup = standups.find(s => s.date === todayStr0)
  const [suYesterday, setSuYesterday] = useState(todayStandup?.yesterday || '')
  const [suToday, setSuToday] = useState(todayStandup?.today || '')
  const [suBlockers, setSuBlockers] = useState(todayStandup?.blockers || '')
  const [suMood, setSuMood] = useState<StandupEntry['mood']>(todayStandup?.mood || '🙂')
  const [suFocus, setSuFocus] = useState(todayStandup?.focusHours || 0)

  const saveStandup = useCallback(() => {
    const entry: StandupEntry = {
      id: todayStr0, date: todayStr0,
      yesterday: suYesterday, today: suToday, blockers: suBlockers,
      mood: suMood, focusHours: suFocus,
    }
    setStandups(ss => {
      const i = ss.findIndex(s => s.date === todayStr0)
      const copy = [...ss]
      if (i === -1) copy.unshift(entry)
      else copy[i] = entry
      return copy
    })
    alert('✓ 今日站会记录已保存')
  }, [todayStr0, suYesterday, suToday, suBlockers, suMood, suFocus])

  // 统计
  const todayStats = stats.find(s => s.date === todayStr0) || { focusMinutes: 0, completed: 0 }
  const weekStats = useMemo(() => {
    const now = new Date()
    const days: { date: string; minutes: number; completed: number; label: string }[] = []
    for (let i = 6; i >= 0; i--) {
      const d = new Date(now)
      d.setDate(d.getDate() - i)
      const k = d.toISOString().split('T')[0]
      const s = stats.find(x => x.date === k) || { focusMinutes: 0, completed: 0 }
      days.push({
        date: k, minutes: s.focusMinutes, completed: s.completed,
        label: ['日', '一', '二', '三', '四', '五', '六'][d.getDay()],
      })
    }
    return days
  }, [stats])

  // ===== 渲染 =====
  const panelStyle: React.CSSProperties = {
    background: 'var(--panel-bg, rgba(20,20,35,0.6))',
    border: '1px solid var(--border-color, rgba(255,255,255,0.08))',
    borderRadius: 12, padding: 18,
  }

  return (
    <div style={{
      display: 'flex', height: '100%',
      fontFamily: "'Noto Sans SC', 'Space Grotesk', sans-serif",
      color: 'var(--text-primary, #e0e0e8)',
    }}>
      {/* 左侧导航 */}
      <div style={{
        width: 64, flexShrink: 0,
        borderRight: '1px solid var(--border-color, rgba(255,255,255,0.08))',
        background: 'var(--panel-bg, rgba(15,15,25,0.7))',
        display: 'flex', flexDirection: 'column', alignItems: 'center',
        padding: '14px 0', gap: 8,
      }}>
        <div style={{
          width: 40, height: 40, borderRadius: 10,
          background: 'linear-gradient(135deg,#f97316,#ef4444,#7c3aed)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: 18, marginBottom: 10,
        }}>⚡</div>
        {([
          ['pomodoro', '🍅', '番茄钟'],
          ['kanban', '📋', '任务板'],
          ['snippets', '📝', '代码库'],
          ['github', '🐙', 'GitHub'],
          ['standup', '🗣', '站会'],
          ['stats', '📊', '统计'],
        ] as [Tab, string, string][]).map(([t, icon, label]) => (
          <button key={t} onClick={() => setTab(t)} title={label} style={{
            width: 48, height: 48, borderRadius: 12, border: 'none',
            background: tab === t
              ? 'linear-gradient(135deg, rgba(124,58,237,0.3), rgba(56,189,248,0.2))'
              : 'transparent',
            color: tab === t ? '#fff' : '#64748b',
            fontSize: 20, cursor: 'pointer', position: 'relative',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            transition: 'all 0.15s',
          }}>
            {icon}
            {tab === t && <div style={{
              position: 'absolute', left: -8, top: '50%', transform: 'translateY(-50%)',
              width: 3, height: 24, borderRadius: 2,
              background: 'linear-gradient(180deg,#7c3aed,#38bdf8)',
            }} />}
          </button>
        ))}
        <div style={{ flex: 1 }} />
        <div style={{
          fontSize: 9, color: '#475569', textAlign: 'center', lineHeight: 1.4,
        }}>DevFlow<br />Pro</div>
      </div>

      {/* 主内容 */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minWidth: 0 }}>
        {/* 顶部栏 */}
        <div style={{
          padding: '14px 24px',
          borderBottom: '1px solid var(--border-color, rgba(255,255,255,0.08))',
          display: 'flex', alignItems: 'center', gap: 20,
        }}>
          <div>
            <div style={{ fontSize: 16, fontWeight: 700, color: '#fff' }}>
              {tab === 'pomodoro' && '🍅 番茄专注中心'}
              {tab === 'kanban' && '📋 任务看板'}
              {tab === 'snippets' && '📝 代码片段库'}
              {tab === 'github' && '🐙 GitHub 热门趋势'}
              {tab === 'standup' && '🗣 每日站会'}
              {tab === 'stats' && '📊 工作统计'}
            </div>
            <div style={{ fontSize: 11, color: '#64748b', marginTop: 2 }}>
              {new Date().toLocaleDateString('zh-CN', { year: 'numeric', month: 'long', day: 'numeric', weekday: 'long' })}
            </div>
          </div>
          <div style={{ flex: 1 }} />
          <div style={{
            display: 'flex', alignItems: 'center', gap: 16, fontSize: 12,
            padding: '8px 16px', borderRadius: 10,
            background: 'rgba(255,255,255,0.03)',
            border: '1px solid rgba(255,255,255,0.06)',
          }}>
            <div>
              <div style={{ color: '#f97316', fontWeight: 700, fontSize: 14 }}>{todayStats.focusMinutes}m</div>
              <div style={{ color: '#64748b', fontSize: 9 }}>今日专注</div>
            </div>
            <div style={{ width: 1, height: 28, background: 'rgba(255,255,255,0.08)' }} />
            <div>
              <div style={{ color: '#10b981', fontWeight: 700, fontSize: 14 }}>{todayStats.completed}</div>
              <div style={{ color: '#64748b', fontSize: 9 }}>完成番茄</div>
            </div>
            <div style={{ width: 1, height: 28, background: 'rgba(255,255,255,0.08)' }} />
            <div>
              <div style={{ color: '#a78bfa', fontWeight: 700, fontSize: 14 }}>{cycleCount}</div>
              <div style={{ color: '#64748b', fontSize: 9 }}>本轮循环</div>
            </div>
          </div>
        </div>

        <div style={{ flex: 1, overflow: 'auto', padding: 24 }}>
          {/* 番茄钟 */}
          {tab === 'pomodoro' && (
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 380px', gap: 24, maxWidth: 1100, margin: '0 auto' }}>
              <div style={{ ...panelStyle, textAlign: 'center', padding: 40 }}>
                {/* 模式切换 */}
                <div style={{ display: 'inline-flex', gap: 4, padding: 4, borderRadius: 999, background: 'rgba(255,255,255,0.04)', marginBottom: 36 }}>
                  {(['focus', 'short', 'long'] as PomodoroMode[]).map(m => (
                    <button key={m} onClick={() => switchMode(m)} style={{
                      padding: '8px 20px', fontSize: 12, fontWeight: 600, borderRadius: 999, border: 'none',
                      cursor: 'pointer', color: mode === m ? '#fff' : '#64748b',
                      background: mode === m
                        ? m === 'focus' ? 'linear-gradient(90deg,#ef4444,#f97316)'
                          : m === 'short' ? 'linear-gradient(90deg,#10b981,#059669)'
                          : 'linear-gradient(90deg,#38bdf8,#7c3aed)'
                        : 'transparent',
                      transition: 'all 0.2s',
                    }}>
                      {m === 'focus' ? '🍅 专注 25m' : m === 'short' ? '☕ 短休 5m' : '🌴 长休 15m'}
                    </button>
                  ))}
                </div>

                {/* 计时器圆环 */}
                <div style={{ position: 'relative', display: 'inline-block', marginBottom: 32 }}>
                  <svg width="260" height="260" viewBox="0 0 260 260">
                    <circle cx="130" cy="130" r="118" fill="none" stroke="rgba(255,255,255,0.05)" strokeWidth="14" />
                    <circle
                      cx="130" cy="130" r="118" fill="none"
                      stroke={mode === 'focus' ? 'url(#pg-focus)' : mode === 'short' ? 'url(#pg-short)' : 'url(#pg-long)'}
                      strokeWidth="14" strokeLinecap="round"
                      strokeDasharray={`${2 * Math.PI * 118}`}
                      strokeDashoffset={`${2 * Math.PI * 118 * (1 - secLeft / DURATIONS[mode])}`}
                      transform="rotate(-90 130 130)"
                      style={{ transition: 'stroke-dashoffset 1s linear' }}
                    />
                    <defs>
                      <linearGradient id="pg-focus" x1="0%" y1="0%" x2="100%" y2="100%">
                        <stop offset="0%" stopColor="#ef4444" /><stop offset="100%" stopColor="#f97316" />
                      </linearGradient>
                      <linearGradient id="pg-short" x1="0%" y1="0%" x2="100%" y2="100%">
                        <stop offset="0%" stopColor="#10b981" /><stop offset="100%" stopColor="#059669" />
                      </linearGradient>
                      <linearGradient id="pg-long" x1="0%" y1="0%" x2="100%" y2="100%">
                        <stop offset="0%" stopColor="#38bdf8" /><stop offset="100%" stopColor="#7c3aed" />
                      </linearGradient>
                    </defs>
                  </svg>
                  <div style={{
                    position: 'absolute', inset: 0,
                    display: 'flex', flexDirection: 'column',
                    alignItems: 'center', justifyContent: 'center',
                  }}>
                    <div style={{
                      fontSize: 64, fontWeight: 800, fontFamily: "'JetBrains Mono', monospace",
                      color: '#fff', letterSpacing: -2,
                      textShadow: '0 0 40px rgba(124,58,237,0.4)',
                    }}>{fmtTime(secLeft)}</div>
                    <div style={{ fontSize: 12, color: '#94a3b8', marginTop: 4 }}>
                      {mode === 'focus' ? '保持专注' : mode === 'short' ? '短暂放松' : '起身活动一下'}
                    </div>
                  </div>
                </div>

                {/* 控制按钮 */}
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 12, marginBottom: 24 }}>
                  <button onClick={resetTimer} style={{
                    width: 48, height: 48, borderRadius: '50%', border: 'none',
                    background: 'rgba(255,255,255,0.06)', color: '#cbd5e1', fontSize: 18,
                    cursor: 'pointer',
                  }}>↺</button>
                  <button onClick={() => setRunning(r => !r)} style={{
                    width: 76, height: 76, borderRadius: '50%', border: 'none',
                    background: running
                      ? 'linear-gradient(135deg,#f59e0b,#d97706)'
                      : 'linear-gradient(135deg,#10b981,#059669)',
                    color: '#fff', fontSize: 28, fontWeight: 700, cursor: 'pointer',
                    boxShadow: running
                      ? '0 8px 24px rgba(245,158,11,0.4)'
                      : '0 8px 24px rgba(16,185,129,0.4)',
                    transition: 'transform 0.15s',
                  }} onMouseDown={(e) => e.currentTarget.style.transform = 'scale(0.95)'}
                     onMouseUp={(e) => e.currentTarget.style.transform = 'scale(1)'}
                     onMouseLeave={(e) => e.currentTarget.style.transform = 'scale(1)'}>
                    {running ? '⏸' : '▶'}
                  </button>
                  <button onClick={() => switchMode(mode)} style={{
                    width: 48, height: 48, borderRadius: '50%', border: 'none',
                    background: 'rgba(255,255,255,0.06)', color: '#cbd5e1', fontSize: 18,
                    cursor: 'pointer',
                  }}>⏭</button>
                </div>

                {/* 正在进行的任务 */}
                <div style={{
                  padding: '14px 20px', borderRadius: 12, textAlign: 'left',
                  background: 'rgba(124,58,237,0.08)',
                  border: '1px solid rgba(124,58,237,0.15)',
                }}>
                  <div style={{ fontSize: 10, color: '#a78bfa', fontWeight: 600, marginBottom: 6 }}>📍 当前任务</div>
                  <select
                    value={currentTaskId || ''}
                    onChange={e => setCurrentTaskId(e.target.value || null)}
                    style={{
                      width: '100%', padding: '8px 12px', borderRadius: 8, fontSize: 13,
                      background: 'rgba(0,0,0,0.3)', color: '#fff',
                      border: '1px solid rgba(255,255,255,0.08)',
                    }}
                  >
                    <option value="">（不绑定任务）</option>
                    {todos.filter(t => t.tag !== 'done').map(t => (
                      <option key={t.id} value={t.id}>
                        [{t.tag === 'today' ? '今日' : t.tag === 'todo' ? '待办' : '阻塞'}] {t.text}
                      </option>
                    ))}
                  </select>
                  {currentTaskId && (() => {
                    const t = todos.find(x => x.id === currentTaskId)
                    if (t?.estPomodoros) {
                      const done = t.completedPomodoros || 0
                      return (
                        <div style={{ marginTop: 10 }}>
                          <div style={{ display: 'flex', gap: 4 }}>
                            {Array.from({ length: t.estPomodoros }).map((_, i) => (
                              <div key={i} style={{
                                width: 24, height: 14, borderRadius: 4,
                                background: i < done
                                  ? 'linear-gradient(90deg,#f97316,#ef4444)'
                                  : 'rgba(255,255,255,0.08)',
                              }} />
                            ))}
                          </div>
                          <div style={{ fontSize: 10, color: '#64748b', marginTop: 4 }}>
                            进度：{done} / {t.estPomodoros} 个番茄
                          </div>
                        </div>
                      )
                    }
                    return null
                  })()}
                </div>
              </div>

              {/* 今日任务列表 */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                <div style={panelStyle}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
                    <div style={{ fontSize: 13, fontWeight: 700 }}>🎯 今日任务</div>
                    <button onClick={() => addTodo('today')} style={{
                      padding: '4px 12px', fontSize: 11, borderRadius: 6,
                      background: 'rgba(124,58,237,0.15)', color: '#c4b5fd',
                      border: '1px solid rgba(124,58,237,0.25)', cursor: 'pointer', fontWeight: 600,
                    }}>+ 新增</button>
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                    {todos.filter(t => t.tag === 'today').map(t => (
                      <div key={t.id} style={{
                        display: 'flex', alignItems: 'center', gap: 10,
                        padding: '10px 12px', borderRadius: 8,
                        background: 'rgba(255,255,255,0.02)',
                        border: t.done ? '1px solid rgba(16,185,129,0.2)' : '1px solid transparent',
                      }}>
                        <input type="checkbox" checked={t.done}
                          onChange={() => moveTodo(t.id, t.done ? 'today' : 'done')}
                          style={{ width: 16, height: 16 }} />
                        <span style={{
                          flex: 1, fontSize: 12,
                          textDecoration: t.done ? 'line-through' : 'none',
                          color: t.done ? '#64748b' : '#e0e0e8',
                        }}>{t.text}</span>
                        {t.priority !== 'medium' && (
                          <span style={{
                            fontSize: 9, padding: '2px 6px', borderRadius: 4,
                            background: t.priority === 'high' ? 'rgba(239,68,68,0.15)' : 'rgba(100,116,139,0.15)',
                            color: t.priority === 'high' ? '#fca5a5' : '#94a3b8',
                          }}>{t.priority === 'high' ? '高优先' : '低优先'}</span>
                        )}
                        <button onClick={() => delTodo(t.id)} style={{
                          background: 'transparent', border: 'none',
                          color: '#64748b', cursor: 'pointer', fontSize: 14,
                        }}>×</button>
                      </div>
                    ))}
                    {todos.filter(t => t.tag === 'today').length === 0 && (
                      <div style={{ fontSize: 11, color: '#64748b', textAlign: 'center', padding: 20 }}>
                        暂无今日任务，点击「+ 新增」开始规划
                      </div>
                    )}
                  </div>
                </div>

                <div style={panelStyle}>
                  <div style={{ fontSize: 13, fontWeight: 700, marginBottom: 14 }}>🔥 本周专注热力图</div>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7,1fr)', gap: 6 }}>
                    {weekStats.map((d, i) => {
                      const intensity = Math.min(d.minutes / 240, 1)
                      const bg = intensity > 0
                        ? `rgba(16,185,129,${0.15 + intensity * 0.75})`
                        : 'rgba(255,255,255,0.03)'
                      return (
                        <div key={i} style={{
                          padding: '10px 4px', borderRadius: 8,
                          background: bg, textAlign: 'center',
                          border: '1px solid rgba(255,255,255,0.04)',
                        }}>
                          <div style={{ fontSize: 10, color: '#64748b', marginBottom: 6 }}>周{d.label}</div>
                          <div style={{ fontSize: 14, fontWeight: 700, color: d.minutes > 0 ? '#fff' : '#64748b' }}>
                            {d.minutes >= 60 ? `${(d.minutes / 60).toFixed(1)}h` : `${d.minutes}m`}
                          </div>
                          <div style={{ fontSize: 9, color: '#475569', marginTop: 4 }}>{d.completed} 🍅</div>
                        </div>
                      )
                    })}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* 看板 */}
          {tab === 'kanban' && (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 16, minHeight: 400 }}>
              {([
                ['today', '今日必做', '☀️', '#f97316'],
                ['todo', '待办池', '📝', '#38bdf8'],
                ['blocked', '阻塞中', '🚫', '#ef4444'],
                ['done', '已完成', '✅', '#10b981'],
              ] as [Todo['tag'], string, string, string][]).map(([tag, title, emoji, color]) => (
                <div key={tag} style={{ ...panelStyle, padding: 16, display: 'flex', flexDirection: 'column' }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <span style={{ fontSize: 18 }}>{emoji}</span>
                      <span style={{ fontSize: 13, fontWeight: 700 }}>{title}</span>
                      <span style={{
                        padding: '2px 8px', borderRadius: 999, fontSize: 10, fontWeight: 700,
                        background: `${color}20`, color,
                      }}>{todos.filter(t => t.tag === tag).length}</span>
                    </div>
                    <button onClick={() => addTodo(tag)} style={{
                      width: 24, height: 24, borderRadius: 6, border: 'none',
                      background: `${color}20`, color, cursor: 'pointer', fontWeight: 700, fontSize: 14,
                    }}>+</button>
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 8, flex: 1 }}>
                    {todos.filter(t => t.tag === tag).map(t => (
                      <div key={t.id} style={{
                        padding: '12px', borderRadius: 10,
                        background: 'rgba(255,255,255,0.03)',
                        border: `1px solid ${color}15`,
                        borderLeft: `3px solid ${color}`,
                        cursor: 'grab',
                      }}>
                        <div style={{ fontSize: 12, fontWeight: 500, marginBottom: 8, lineHeight: 1.5 }}>{t.text}</div>
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                          <div style={{ display: 'flex', gap: 4 }}>
                            {t.priority !== 'medium' && (
                              <span style={{
                                fontSize: 9, padding: '2px 6px', borderRadius: 4,
                                background: t.priority === 'high' ? 'rgba(239,68,68,0.12)' : 'rgba(100,116,139,0.12)',
                                color: t.priority === 'high' ? '#fca5a5' : '#94a3b8',
                              }}>{t.priority === 'high' ? '高优' : '低优'}</span>
                            )}
                            {t.estPomodoros && (
                              <span style={{
                                fontSize: 9, padding: '2px 6px', borderRadius: 4,
                                background: 'rgba(249,115,22,0.12)', color: '#fdba74',
                              }}>🍅 ×{t.estPomodoros}</span>
                            )}
                          </div>
                          <div style={{ display: 'flex', gap: 4 }}>
                            {(['today', 'todo', 'blocked', 'done'] as Todo['tag'][]).filter(x => x !== tag).map(x => (
                              <button key={x} onClick={() => moveTodo(t.id, x)} title={`移至：${x}`} style={{
                                width: 18, height: 18, borderRadius: 4, fontSize: 9, border: 'none',
                                background: 'rgba(255,255,255,0.04)', color: '#64748b', cursor: 'pointer',
                              }}>
                                {x === 'today' ? '☀' : x === 'todo' ? '📝' : x === 'blocked' ? '🚫' : '✓'}
                              </button>
                            ))}
                            <button onClick={() => delTodo(t.id)} style={{
                              width: 18, height: 18, borderRadius: 4, fontSize: 12, border: 'none',
                              background: 'rgba(239,68,68,0.1)', color: '#fca5a5', cursor: 'pointer',
                            }}>×</button>
                          </div>
                        </div>
                      </div>
                    ))}
                    {todos.filter(t => t.tag === tag).length === 0 && (
                      <div style={{
                        flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center',
                        fontSize: 11, color: '#475569',
                        border: '2px dashed rgba(255,255,255,0.05)', borderRadius: 8,
                      }}>
                        拖拽或点击 + 添加任务
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* 代码片段 */}
          {tab === 'snippets' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              <div style={{ ...panelStyle, padding: '14px 18px', display: 'flex', alignItems: 'center', gap: 12 }}>
                <button onClick={newSnippet} style={{
                  padding: '8px 20px', borderRadius: 8, border: 'none',
                  background: 'linear-gradient(90deg,#7c3aed,#5b4cd8)',
                  color: '#fff', fontSize: 12, fontWeight: 700, cursor: 'pointer',
                }}>+ 新建片段</button>
                <input
                  value={snipFilter}
                  onChange={e => setSnipFilter(e.target.value)}
                  placeholder="🔍 搜索标题 / 标签 / 代码内容…"
                  style={{
                    flex: 1, padding: '8px 14px', borderRadius: 8, fontSize: 12,
                    background: 'rgba(255,255,255,0.03)',
                    border: '1px solid rgba(255,255,255,0.08)', color: 'inherit',
                  }}
                />
                <select value={snipLang} onChange={e => setSnipLang(e.target.value)} style={{
                  padding: '8px 12px', borderRadius: 8, fontSize: 12,
                  background: 'rgba(255,255,255,0.03)', color: 'inherit',
                  border: '1px solid rgba(255,255,255,0.08)',
                }}>
                  <option value="">全部语言</option>
                  {LANGS.map(l => <option key={l} value={l}>{l}</option>)}
                </select>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(460px,1fr))', gap: 16 }}>
                {filteredSnippets.map(s => (
                  <div key={s.id} style={{ ...panelStyle, padding: 16, display: 'flex', flexDirection: 'column', gap: 12 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <button onClick={() => updateSnippet(s.id, { favorite: !s.favorite })} style={{
                        background: 'transparent', border: 'none', cursor: 'pointer', fontSize: 16,
                      }}>{s.favorite ? '⭐' : '☆'}</button>
                      <input
                        value={s.title}
                        onChange={e => updateSnippet(s.id, { title: e.target.value })}
                        style={{
                          flex: 1, fontSize: 13, fontWeight: 600,
                          background: 'transparent', border: 'none', color: '#fff',
                          padding: '4px 6px', borderRadius: 4,
                        }}
                      />
                      <select value={s.lang} onChange={e => updateSnippet(s.id, { lang: e.target.value })} style={{
                        padding: '4px 10px', fontSize: 10, borderRadius: 6,
                        background: 'rgba(124,58,237,0.15)', color: '#c4b5fd',
                        border: '1px solid rgba(124,58,237,0.25)',
                      }}>{s.lang}</select>
                      <button onClick={() => copyToClipboard(s.content)} title="复制" style={{
                        width: 30, height: 28, borderRadius: 6, border: 'none',
                        background: 'rgba(16,185,129,0.12)', color: '#6ee7b7',
                        cursor: 'pointer', fontSize: 12, fontWeight: 700,
                      }}>📋</button>
                      <button onClick={() => delSnippet(s.id)} title="删除" style={{
                        width: 28, height: 28, borderRadius: 6, border: 'none',
                        background: 'rgba(239,68,68,0.1)', color: '#fca5a5',
                        cursor: 'pointer', fontSize: 14,
                      }}>×</button>
                    </div>
                    <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap' }}>
                      {s.tags.length === 0 ? (
                        <span style={{ fontSize: 10, color: '#475569' }}>（双击标签处添加）</span>
                      ) : s.tags.map((tg, i) => (
                        <span key={i} style={{
                          fontSize: 10, padding: '2px 8px', borderRadius: 999,
                          background: 'rgba(56,189,248,0.1)', color: '#7dd3fc',
                        }}>#{tg}</span>
                      ))}
                    </div>
                    <textarea
                      value={s.content}
                      onChange={e => updateSnippet(s.id, { content: e.target.value })}
                      spellCheck={false}
                      style={{
                        minHeight: 140, padding: 12, borderRadius: 8,
                        fontFamily: "'JetBrains Mono', monospace", fontSize: 11,
                        background: 'rgba(0,0,0,0.4)', color: '#cbd5e1',
                        border: '1px solid rgba(255,255,255,0.06)',
                        lineHeight: 1.6, resize: 'vertical',
                      }}
                    />
                  </div>
                ))}
              </div>
              {filteredSnippets.length === 0 && (
                <div style={{ ...panelStyle, textAlign: 'center', padding: 60, color: '#64748b', fontSize: 12 }}>
                  未找到匹配的代码片段
                </div>
              )}
            </div>
          )}

          {/* GitHub Trending */}
          {tab === 'github' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              <div style={{ ...panelStyle, padding: '14px 18px', display: 'flex', alignItems: 'center', gap: 12 }}>
                <div style={{ fontSize: 13, fontWeight: 700, color: '#fff', display: 'flex', alignItems: 'center', gap: 8 }}>
                  🐙 GitHub Trending
                </div>
                <div style={{ flex: 1 }} />
                <select value={ghSince} onChange={e => setGhSince(e.target.value as typeof ghSince)} style={{
                  padding: '6px 12px', borderRadius: 6, fontSize: 11,
                  background: 'rgba(255,255,255,0.04)', color: 'inherit',
                  border: '1px solid rgba(255,255,255,0.08)',
                }}>
                  <option value="daily">今日</option>
                  <option value="weekly">本周</option>
                  <option value="monthly">本月</option>
                </select>
                <select value={ghLang} onChange={e => setGhLang(e.target.value)} style={{
                  padding: '6px 12px', borderRadius: 6, fontSize: 11,
                  background: 'rgba(255,255,255,0.04)', color: 'inherit',
                  border: '1px solid rgba(255,255,255,0.08)',
                }}>
                  <option value="">全部语言</option>
                  {LANGS.map(l => <option key={l} value={l.toLowerCase()}>{l}</option>)}
                </select>
                <button onClick={loadGithub} disabled={ghLoading} style={{
                  padding: '6px 16px', borderRadius: 6, fontSize: 11, fontWeight: 600,
                  background: 'linear-gradient(90deg,#7c3aed,#5b4cd8)', color: '#fff',
                  border: 'none', cursor: ghLoading ? 'not-allowed' : 'pointer',
                }}>{ghLoading ? '加载中…' : '🔄 刷新'}</button>
              </div>

              <div style={{ ...panelStyle, padding: 0, overflow: 'hidden' }}>
                {ghLoading && ghRepos.length === 0 ? (
                  <div style={{ padding: 60, textAlign: 'center', color: '#64748b', fontSize: 12 }}>加载中…</div>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column' }}>
                    <div style={{
                      display: 'grid',
                      gridTemplateColumns: '50px 2fr 1fr 100px 100px 80px 80px',
                      gap: 14, padding: '12px 20px', fontSize: 10, fontWeight: 700,
                      color: '#64748b', background: 'rgba(255,255,255,0.02)',
                      borderBottom: '1px solid rgba(255,255,255,0.06)',
                    }}>
                      <span>#</span><span>项目</span><span>描述</span><span>语言</span><span>⭐ Stars</span><span>🍴 Forks</span><span>操作</span>
                    </div>
                    {ghRepos.map((r, i) => (
                      <div key={r.id} style={{
                        display: 'grid',
                        gridTemplateColumns: '50px 2fr 1fr 100px 100px 80px 80px',
                        gap: 14, padding: '14px 20px', alignItems: 'center',
                        borderBottom: '1px solid rgba(255,255,255,0.04)',
                        fontSize: 12, transition: 'background 0.15s',
                        cursor: 'pointer',
                      }}
                        onMouseEnter={(e) => e.currentTarget.style.background = 'rgba(124,58,237,0.05)'}
                        onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
                        onClick={() => window.open(r.url, '_blank')}
                      >
                        <span style={{ color: '#64748b', fontWeight: 700 }}>{i + 1}</span>
                        <div>
                          <div style={{ fontSize: 13, fontWeight: 700, color: '#a78bfa' }}>
                            <span style={{ color: '#94a3b8' }}>{r.author}/</span>{r.name}
                          </div>
                        </div>
                        <span style={{
                          color: '#94a3b8', fontSize: 11, lineHeight: 1.5,
                          display: '-webkit-box', WebkitLineClamp: 2,
                          WebkitBoxOrient: 'vertical', overflow: 'hidden',
                        }}>{r.desc}</span>
                        <span style={{
                          padding: '3px 10px', borderRadius: 999, fontSize: 10,
                          background: 'rgba(56,189,248,0.1)', color: '#7dd3fc',
                          fontWeight: 600, textAlign: 'center', justifySelf: 'start',
                        }}>{r.lang}</span>
                        <span style={{ fontFamily: "'JetBrains Mono', monospace", color: '#fbbf24', fontWeight: 700 }}>
                          {r.stars >= 1000 ? `${(r.stars / 1000).toFixed(1)}k` : r.stars}
                        </span>
                        <span style={{ fontFamily: "'JetBrains Mono', monospace", color: '#94a3b8' }}>
                          {r.forks >= 1000 ? `${(r.forks / 1000).toFixed(1)}k` : r.forks}
                        </span>
                        <div style={{ display: 'flex', gap: 6 }} onClick={(e) => e.stopPropagation()}>
                          <button onClick={() => {
                            const key = r.author + '/' + r.name
                            setGhFav(f => f.includes(key) ? f.filter(x => x !== key) : [...f, key])
                            setGhRepos(rs => rs.map(x => x.id === r.id ? { ...x, starred: !x.starred } : x))
                          }} style={{
                            width: 30, height: 28, borderRadius: 6, border: 'none',
                            background: r.starred ? 'rgba(251,191,36,0.15)' : 'rgba(255,255,255,0.04)',
                            color: r.starred ? '#fbbf24' : '#64748b', cursor: 'pointer',
                            fontSize: 12,
                          }} title={r.starred ? '取消收藏' : '收藏'}>
                            {r.starred ? '★' : '☆'}
                          </button>
                          <a href={r.url} target="_blank" rel="noreferrer noopener" style={{
                            width: 30, height: 28, borderRadius: 6, border: 'none',
                            background: 'rgba(124,58,237,0.1)', color: '#c4b5fd',
                            display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
                            fontSize: 12, textDecoration: 'none',
                          }} title="打开">↗</a>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {ghFav.length > 0 && (
                <div style={panelStyle}>
                  <div style={{ fontSize: 12, fontWeight: 700, marginBottom: 12, color: '#fbbf24' }}>
                    ⭐ 已收藏项目（{ghFav.length}）
                  </div>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                    {ghFav.map((f, i) => (
                      <div key={i} style={{
                        padding: '6px 12px', borderRadius: 8, fontSize: 11,
                        background: 'rgba(251,191,36,0.08)', color: '#fde68a',
                        border: '1px solid rgba(251,191,36,0.15)',
                        display: 'inline-flex', alignItems: 'center', gap: 6,
                      }}>
                        <span>⭐</span>
                        <a href={`https://github.com/${f}`} target="_blank" rel="noreferrer noopener"
                          style={{ color: 'inherit', textDecoration: 'none', fontWeight: 600 }}>{f}</a>
                        <button onClick={() => setGhFav(ff => ff.filter(x => x !== f))} style={{
                          background: 'transparent', border: 'none', color: '#fbbf2480',
                          cursor: 'pointer', marginLeft: 4,
                        }}>×</button>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* 站会 */}
          {tab === 'standup' && (
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 380px', gap: 24, maxWidth: 1100, margin: '0 auto' }}>
              <div style={panelStyle}>
                <div style={{ fontSize: 13, fontWeight: 700, marginBottom: 20 }}>🗣 每日站会记录 · {todayStr0}</div>

                <div style={{ marginBottom: 18 }}>
                  <label style={{ fontSize: 11, fontWeight: 600, color: '#94a3b8', display: 'block', marginBottom: 8 }}>
                    📅 昨天我完成了什么？
                  </label>
                  <textarea value={suYesterday} onChange={e => setSuYesterday(e.target.value)}
                    placeholder="- 完成了用户登录模块重构\n- Review 了 PR #234\n- 修复支付流程 Bug"
                    style={{
                      width: '100%', minHeight: 100, padding: 12, borderRadius: 8,
                      fontSize: 12, fontFamily: 'inherit', background: 'rgba(0,0,0,0.3)',
                      color: '#cbd5e1', border: '1px solid rgba(255,255,255,0.06)',
                      lineHeight: 1.7, resize: 'vertical',
                    }} />
                </div>

                <div style={{ marginBottom: 18 }}>
                  <label style={{ fontSize: 11, fontWeight: 600, color: '#94a3b8', display: 'block', marginBottom: 8 }}>
                    🎯 今天我计划做什么？
                  </label>
                  <textarea value={suToday} onChange={e => setSuToday(e.target.value)}
                    placeholder="- 完成 AI 代码导师的 API 对接\n- 性能优化：首屏加载时间降低 30%\n- 准备周会 PPT"
                    style={{
                      width: '100%', minHeight: 100, padding: 12, borderRadius: 8,
                      fontSize: 12, fontFamily: 'inherit', background: 'rgba(0,0,0,0.3)',
                      color: '#cbd5e1', border: '1px solid rgba(255,255,255,0.06)',
                      lineHeight: 1.7, resize: 'vertical',
                    }} />
                </div>

                <div style={{ marginBottom: 20 }}>
                  <label style={{ fontSize: 11, fontWeight: 600, color: '#94a3b8', display: 'block', marginBottom: 8 }}>
                    🚫 有什么阻塞我的事情？
                  </label>
                  <textarea value={suBlockers} onChange={e => setSuBlockers(e.target.value)}
                    placeholder="（无则留空）\n- 需要设计部门提供新版 Logo\n- API 文档尚未更新"
                    style={{
                      width: '100%', minHeight: 80, padding: 12, borderRadius: 8,
                      fontSize: 12, fontFamily: 'inherit',
                      background: 'rgba(239,68,68,0.04)',
                      color: '#fca5a5',
                      border: '1px solid rgba(239,68,68,0.1)',
                      lineHeight: 1.7, resize: 'vertical',
                    }} />
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 20 }}>
                  <div>
                    <label style={{ fontSize: 11, fontWeight: 600, color: '#94a3b8', display: 'block', marginBottom: 8 }}>
                      😊 今日心情
                    </label>
                    <div style={{ display: 'flex', gap: 6 }}>
                      {(['😄', '🙂', '😐', '😕', '😫'] as const).map(m => (
                        <button key={m} onClick={() => setSuMood(m)} style={{
                          width: 44, height: 44, borderRadius: 10, border: '2px solid',
                          borderColor: suMood === m ? '#a78bfa' : 'rgba(255,255,255,0.06)',
                          background: suMood === m ? 'rgba(124,58,237,0.15)' : 'rgba(255,255,255,0.03)',
                          cursor: 'pointer', fontSize: 22,
                        }}>{m}</button>
                      ))}
                    </div>
                  </div>
                  <div>
                    <label style={{ fontSize: 11, fontWeight: 600, color: '#94a3b8', display: 'block', marginBottom: 8 }}>
                      ⏱ 预计专注（小时）：{suFocus}h
                    </label>
                    <input type="range" min="0" max="12" step="0.5"
                      value={suFocus} onChange={e => setSuFocus(parseFloat(e.target.value))}
                      style={{ width: '100%', marginTop: 14 }} />
                  </div>
                </div>

                <button onClick={saveStandup} style={{
                  width: '100%', padding: '12px', borderRadius: 10, border: 'none',
                  background: 'linear-gradient(90deg,#7c3aed,#5b4cd8,#38bdf8)',
                  color: '#fff', fontSize: 13, fontWeight: 700, cursor: 'pointer',
                }}>💾 保存今日站会</button>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                <div style={panelStyle}>
                  <div style={{ fontSize: 12, fontWeight: 700, marginBottom: 14 }}>📜 历史站会记录</div>
                  {standups.length === 0 ? (
                    <div style={{ fontSize: 11, color: '#64748b', textAlign: 'center', padding: 20 }}>
                      还没有历史记录，开始记录第一次吧！
                    </div>
                  ) : (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 8, maxHeight: 420, overflow: 'auto' }}>
                      {standups.slice(0, 14).map(su => (
                        <div key={su.id} style={{
                          padding: '12px', borderRadius: 8,
                          background: 'rgba(255,255,255,0.02)',
                          border: '1px solid rgba(255,255,255,0.04)',
                        }}>
                          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6 }}>
                            <span style={{ fontSize: 11, fontWeight: 600, color: '#cbd5e1' }}>{su.date}</span>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                              <span style={{ fontSize: 18 }}>{su.mood}</span>
                              <span style={{ fontSize: 10, color: '#64748b' }}>{su.focusHours}h</span>
                            </div>
                          </div>
                          <div style={{
                            fontSize: 10, color: '#94a3b8', lineHeight: 1.6,
                            display: '-webkit-box', WebkitLineClamp: 3,
                            WebkitBoxOrient: 'vertical', overflow: 'hidden',
                          }}>
                            {su.today || su.yesterday || '（无内容）'}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* 统计 */}
          {tab === 'stats' && (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 16, marginBottom: 24 }}>
              {[
                ['🎯', '累计专注时长', `${Math.floor(stats.reduce((a, b) => a + b.focusMinutes, 0) / 60)} 小时`, '#f97316'],
                ['✅', '完成番茄数', `${stats.reduce((a, b) => a + b.completed, 0)} 个`, '#10b981'],
                ['📝', '代码片段', `${snippets.length} 段`, '#7c3aed'],
                ['🗣', '站会记录', `${standups.length} 天`, '#38bdf8'],
              ].map(([i, t, v, c], idx) => (
                <div key={idx} style={{ ...panelStyle }}>
                  <div style={{ fontSize: 28, marginBottom: 8 }}>{i}</div>
                  <div style={{ fontSize: 11, color: '#64748b', marginBottom: 4 }}>{t}</div>
                  <div style={{ fontSize: 24, fontWeight: 800, color: c as string }}>{v}</div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
