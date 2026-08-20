import { useState, useEffect, useMemo, useCallback, memo } from 'react'
import {
  Target, Flame, Trophy, Calendar, Play, Pause, RotateCcw,
  Plus, Trash2, Check, X, ChevronLeft, ChevronRight,
  Sparkles, TrendingUp, Clock, Award, Zap, BarChart3, PieChart,
  Bookmark, Heart, Dumbbell, BookOpen, Coffee, Droplets, Moon,
  Sun, Music, Brain, Palette, Code, Bike, Utensils, Lightbulb,
  Smile,
} from 'lucide-react'

// ========== 类型 ==========
type HabitIcon = 'target' | 'flame' | 'trophy' | 'bookmark' | 'heart' |
  'dumbbell' | 'book-open' | 'coffee' | 'droplets' | 'moon' |
  'sun' | 'music' | 'brain' | 'palette' | 'code' | 'bike' |
  'utensils' | 'lightbulb' | 'smile' | 'zap'

interface Habit {
  id: string
  name: string
  icon: HabitIcon
  color: string
  weeklyGoal: number // 每周目标次数
  category: 'health' | 'learning' | 'productivity' | 'mindfulness' | 'lifestyle' | 'creative'
  cue: string // 提示（原子习惯第1法则）
  craving: string // 渴求（第2法则）
  response: string // 反应（第3法则）
  reward: string // 奖励（第4法则）
  createdAt: number
  archived?: boolean
}

interface HabitState {
  habits: Habit[]
  // habitId -> { 'YYYY-MM-DD': true }
  checks: Record<string, Record<string, boolean>>
  // 专注会话
  focusSessions: { id: string; habitId: string | null; durationSec: number; completedAt: number }[]
}

const STORAGE_KEY = 'quantum-habit-os-v1'

const ICONS: Record<HabitIcon, React.ComponentType<{ className?: string }>> = {
  target: Target, flame: Flame, trophy: Trophy, bookmark: Bookmark, heart: Heart,
  dumbbell: Dumbbell, 'book-open': BookOpen, coffee: Coffee, droplets: Droplets, moon: Moon,
  sun: Sun, music: Music, brain: Brain, palette: Palette, code: Code, bike: Bike,
  utensils: Utensils, lightbulb: Lightbulb, smile: Smile, zap: Zap,
}

const COLORS = [
  '#ef4444', '#f97316', '#f59e0b', '#eab308', '#84cc16',
  '#22c55e', '#10b981', '#14b8a6', '#06b6d4', '#0ea5e9',
  '#3b82f6', '#6366f1', '#8b5cf6', '#a855f7', '#d946ef',
  '#ec4899', '#f43f5e',
]

const PRESETS: Omit<Habit, 'id' | 'createdAt'>[] = [
  {
    name: '晨间冥想', icon: 'brain', color: '#8b5cf6', weeklyGoal: 7, category: 'mindfulness',
    cue: '早晨醒后坐在床上', craving: '希望一整天保持清醒与平静',
    response: '做10分钟深呼吸冥想', reward: '喝一杯好茶并阅读5分钟',
  },
  {
    name: '每日阅读30分钟', icon: 'book-open', color: '#0ea5e9', weeklyGoal: 7, category: 'learning',
    cue: '晚饭后坐在沙发上', craving: '渴望成长与新灵感',
    response: '打开预定书籍阅读30分钟', reward: '在读书笔记上写3句感悟',
  },
  {
    name: '健身运动', icon: 'dumbbell', color: '#22c55e', weeklyGoal: 4, category: 'health',
    cue: '下班后换上运动服', craving: '希望身材健康有活力',
    response: '进行45分钟健身或跑步', reward: '享受一次蛋白质奶昔',
  },
  {
    name: '每日饮水 2L', icon: 'droplets', color: '#06b6d4', weeklyGoal: 7, category: 'health',
    cue: '每完成 1 小时工作', craving: '保持皮肤好与精力充沛',
    response: '喝 250ml 水并打卡', reward: '记录后允许刷 2 分钟手机',
  },
  {
    name: '编程学习', icon: 'code', color: '#6366f1', weeklyGoal: 5, category: 'learning',
    cue: '晚上 9 点坐在书桌前', craving: '提升技术能力与薪资',
    response: '完成 1 个编程练习或阅读文档', reward: '允许打 1 局游戏',
  },
  {
    name: '早睡 23:00', icon: 'moon', color: '#a855f7', weeklyGoal: 7, category: 'health',
    cue: '手机时钟显示 22:30', craving: '第二天有好精神',
    response: '关闭电子设备并洗漱', reward: '第二天早上多赖床 10 分钟',
  },
  {
    name: '每日写作', icon: 'lightbulb', color: '#f59e0b', weeklyGoal: 5, category: 'creative',
    cue: '早晨喝完咖啡', craving: '训练表达与积累作品',
    response: '写 200 字以上文章或日记', reward: '发朋友圈或分享给朋友',
  },
  {
    name: '学习英语', icon: 'bookmark', color: '#ec4899', weeklyGoal: 6, category: 'learning',
    cue: '通勤路上或午休', craving: '能看原版书和对话',
    response: '背 20 个单词 + 1 段听力', reward: '看一集无字幕美剧片段',
  },
]

const CATEGORY_LABELS: Record<Habit['category'], { label: string; color: string }> = {
  health: { label: '健康', color: 'text-emerald-300' },
  learning: { label: '学习', color: 'text-sky-300' },
  productivity: { label: '效率', color: 'text-amber-300' },
  mindfulness: { label: '正念', color: 'text-violet-300' },
  lifestyle: { label: '生活', color: 'text-rose-300' },
  creative: { label: '创造', color: 'text-fuchsia-300' },
}

// ========== 工具函数 ==========
function ymd(d: Date): string {
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${y}-${m}-${day}`
}
function daysAgo(n: number): string {
  const d = new Date()
  d.setDate(d.getDate() - n)
  return ymd(d)
}
function parseYMD(s: string): Date {
  const [y, m, d] = s.split('-').map(Number)
  return new Date(y, (m || 1) - 1, d || 1)
}
function loadState(): HabitState {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (raw) return JSON.parse(raw) as HabitState
  } catch {}
  // 新用户：创建 3 个默认习惯 + 模拟一点历史
  const now = Date.now()
  const habits = PRESETS.slice(0, 3).map((p, i) => ({
    ...p, id: `h-${now}-${i}`, createdAt: now - (30 - i) * 86400000,
  }))
  const checks: Record<string, Record<string, boolean>> = {}
  habits.forEach((h, idx) => {
    checks[h.id] = {}
    // 模拟 30 天内 ~70% 打卡率
    for (let i = 1; i <= 30; i++) {
      const key = daysAgo(i)
      if (Math.random() < 0.7 - idx * 0.1) checks[h.id][key] = true
    }
  })
  return { habits, checks, focusSessions: [] }
}

function useForceTick(ms = 60000) {
  const [, setT] = useState(0)
  useEffect(() => {
    const id = setInterval(() => setT(x => x + 1), ms)
    return () => clearInterval(id)
  }, [ms])
}

// ========== 主组件 ==========
const QuantumHabitOS = memo(function QuantumHabitOS() {
  const [state, setState] = useState<HabitState>(() => loadState())
  const [view, setView] = useState<'today' | 'habits' | 'focus' | 'stats' | 'report'>('today')
  const [showAdd, setShowAdd] = useState(false)
  const [calendarMonth, setCalendarMonth] = useState(() => { const d = new Date(); return { y: d.getFullYear(), m: d.getMonth() } })
  const [focusHabitId, setFocusHabitId] = useState<string | null>(null)
  const [focusMin, setFocusMin] = useState(25)
  const [focusRunning, setFocusRunning] = useState(false)
  const [focusElapsed, setFocusElapsed] = useState(0) // 秒

  useForceTick(1000 * 30)

  // 持久化
  useEffect(() => {
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify(state)) } catch {}
  }, [state])

  // 专注计时器
  useEffect(() => {
    if (!focusRunning) return
    const id = setInterval(() => {
      setFocusElapsed(e => {
        const next = e + 1
        if (next >= focusMin * 60) {
          setFocusRunning(false)
          // 记录完成
          setState(s => ({
            ...s,
            focusSessions: [...s.focusSessions, {
              id: `f-${Date.now()}`, habitId: focusHabitId,
              durationSec: focusMin * 60, completedAt: Date.now(),
            }],
          }))
          return focusMin * 60
        }
        return next
      })
    }, 1000)
    return () => clearInterval(id)
  }, [focusRunning, focusMin, focusHabitId])

  const today = useMemo(() => ymd(new Date()), [])

  const toggleCheck = useCallback((habitId: string, dateKey: string) => {
    setState(s => {
      const hc = { ...(s.checks[habitId] || {}) }
      if (hc[dateKey]) delete hc[dateKey]
      else hc[dateKey] = true
      return { ...s, checks: { ...s.checks, [habitId]: hc } }
    })
  }, [])

  const addHabit = useCallback((h: Omit<Habit, 'id' | 'createdAt'>) => {
    setState(s => ({
      ...s,
      habits: [...s.habits, { ...h, id: `h-${Date.now()}`, createdAt: Date.now() }],
    }))
  }, [])

  const updateHabit = useCallback((id: string, patch: Partial<Habit>) => {
    setState(s => ({ ...s, habits: s.habits.map(h => h.id === id ? { ...h, ...patch } : h) }))
  }, [])

  const removeHabit = useCallback((id: string) => {
    setState(s => {
      const checks = { ...s.checks }
      delete checks[id]
      return { ...s, habits: s.habits.filter(h => h.id !== id), checks }
    })
  }, [])

  const applyPreset = useCallback((idx: number) => {
    addHabit(PRESETS[idx])
  }, [addHabit])

  // 统计
  const stats = useMemo(() => {
    const active = state.habits.filter(h => !h.archived)
    const todayDone = active.filter(h => state.checks[h.id]?.[today]).length
    let totalChecks = 0
    active.forEach(h => {
      Object.keys(state.checks[h.id] || {}).forEach(() => {
        totalChecks++
      })
    })

    // 总专注时长（分钟）
    const focusMinTotal = Math.round(state.focusSessions.reduce((a, b) => a + b.durationSec, 0) / 60)

    // 每周完成率（最近7天）
    const last7Keys = Array.from({ length: 7 }, (_, i) => daysAgo(6 - i))
    let expected = 0, actual = 0
    active.forEach(h => {
      const dailyGoal = h.weeklyGoal / 7
      last7Keys.forEach(k => {
        expected += dailyGoal
        if (state.checks[h.id]?.[k]) actual += 1
      })
    })
    const weeklyRate = expected > 0 ? Math.min(100, Math.round(actual / expected * 100)) : 0

    // 每个习惯连续打卡
    const streaks: Record<string, number> = {}
    active.forEach(h => {
      let s = 0
      for (let i = 0; i < 400; i++) {
        const k = daysAgo(i)
        if (state.checks[h.id]?.[k]) s++
        else if (i === 0) {
          // 今天没打，也允许从昨天开始算连续
          continue
        } else break
      }
      streaks[h.id] = s
    })

    // 最长连续记录
    const maxStreaks: Record<string, number> = {}
    active.forEach(h => {
      const keys = Object.keys(state.checks[h.id] || {}).sort()
      let max = 0, cur = 0, prev: Date | null = null
      keys.forEach(k => {
        const d = parseYMD(k)
        if (prev) {
          const diff = Math.round((d.getTime() - prev.getTime()) / 86400000)
          if (diff === 1) cur++
          else { max = Math.max(max, cur); cur = 1 }
        } else cur = 1
        prev = d
      })
      max = Math.max(max, cur)
      maxStreaks[h.id] = max
    })

    return { active, todayDone, totalChecks, focusMinTotal, weeklyRate, streaks, maxStreaks }
  }, [state, today])

  // ========== UI ==========
  return (
    <div className="w-full h-full flex flex-col bg-gradient-to-br from-[#0b0a1f] via-[#0f0b2a] to-[#0a1024] text-slate-100 overflow-hidden">
      {/* 顶栏 */}
      <div className="flex-shrink-0 px-5 py-3.5 border-b border-white/5 bg-black/30 backdrop-blur-md flex items-center gap-4">
        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-amber-400 via-rose-500 to-violet-600 flex items-center justify-center shadow-lg shadow-rose-500/30">
          <Sparkles className="w-5 h-5 text-white" />
        </div>
        <div className="flex-1 min-w-0">
          <h2 className="text-lg font-bold tracking-tight bg-gradient-to-r from-amber-200 via-rose-200 to-violet-200 bg-clip-text text-transparent">
            QuantumHabit OS · 科学习惯操作系统
          </h2>
          <p className="text-[11px] text-slate-400 mt-0.5">原子习惯 4 法则 · 66 天成瘾曲线 · 连续打卡 · 专注番茄 · 年度成长报告</p>
        </div>
        <div className="flex items-center gap-2 text-[11px]">
          <div className="px-3 py-1.5 rounded-lg bg-emerald-500/10 border border-emerald-400/20 text-emerald-300">
            今日 <b className="ml-1">{stats.todayDone}</b>/<b>{stats.active.length}</b>
          </div>
          <div className="px-3 py-1.5 rounded-lg bg-violet-500/10 border border-violet-400/20 text-violet-300">
            周完成 <b className="ml-1">{stats.weeklyRate}%</b>
          </div>
        </div>
      </div>

      {/* 导航栏 */}
      <div className="flex-shrink-0 px-4 py-2 border-b border-white/5 bg-gradient-to-r from-amber-500/5 via-transparent to-violet-500/5 flex gap-1.5 overflow-x-auto">
        {[
          { id: 'today' as const, name: '今日打卡', Icon: Calendar, color: 'from-amber-500 to-rose-500' },
          { id: 'habits' as const, name: '习惯管理', Icon: Target, color: 'from-sky-500 to-indigo-500' },
          { id: 'focus' as const, name: '专注番茄钟', Icon: Clock, color: 'from-emerald-500 to-teal-500' },
          { id: 'stats' as const, name: '数据统计', Icon: BarChart3, color: 'from-fuchsia-500 to-pink-500' },
          { id: 'report' as const, name: '年度成长报告', Icon: Trophy, color: 'from-violet-500 to-purple-500' },
        ].map(v => {
          const Icon = v.Icon
          const active = view === v.id
          return (
            <button
              key={v.id}
              onClick={() => setView(v.id)}
              className={`flex-shrink-0 px-3.5 py-2 rounded-lg text-xs font-medium flex items-center gap-2 transition-all ${active
                ? `bg-gradient-to-r ${v.color}/25 text-white shadow border border-white/10`
                : 'text-slate-400 hover:text-slate-200 hover:bg-white/5 border border-transparent'
              }`}
            >
              <Icon className="w-3.5 h-3.5" />
              {v.name}
            </button>
          )
        })}
      </div>

      {/* 内容区 */}
      <div className="flex-1 overflow-y-auto px-5 py-4">
        {view === 'today' && <TodayView state={state} today={today} streaks={stats.streaks} maxStreaks={stats.maxStreaks} toggleCheck={toggleCheck} calendarMonth={calendarMonth} setCalendarMonth={setCalendarMonth} />}
        {view === 'habits' && <HabitsView state={state} streaks={stats.streaks} addHabit={addHabit} updateHabit={updateHabit} removeHabit={removeHabit} showAdd={showAdd} setShowAdd={setShowAdd} applyPreset={applyPreset} />}
        {view === 'focus' && <FocusView state={state} focusHabitId={focusHabitId} setFocusHabitId={setFocusHabitId} focusMin={focusMin} setFocusMin={setFocusMin} focusRunning={focusRunning} setFocusRunning={setFocusRunning} focusElapsed={focusElapsed} setFocusElapsed={setFocusElapsed} totalFocusMin={stats.focusMinTotal} />}
        {view === 'stats' && <StatsView state={state} streaks={stats.streaks} maxStreaks={stats.maxStreaks} />}
        {view === 'report' && <ReportView state={state} today={today} streaks={stats.streaks} maxStreaks={stats.maxStreaks} totalChecks={stats.totalChecks} weeklyRate={stats.weeklyRate} focusMinTotal={stats.focusMinTotal} />}
      </div>
    </div>
  )
})

// ========== 今日打卡视图 ==========
function TodayView({
  state, today, streaks, maxStreaks, toggleCheck, calendarMonth, setCalendarMonth,
}: {
  state: HabitState; today: string; streaks: Record<string, number>; maxStreaks: Record<string, number>
  toggleCheck: (habitId: string, dateKey: string) => void
  calendarMonth: { y: number; m: number }
  setCalendarMonth: (m: { y: number; m: number }) => void
}) {
  const active = state.habits.filter(h => !h.archived)
  const todayDone = active.filter(h => state.checks[h.id]?.[today]).length
  const pct = active.length > 0 ? Math.round(todayDone / active.length * 100) : 0

  // 日历天数
  const daysInMonth = new Date(calendarMonth.y, calendarMonth.m + 1, 0).getDate()
  const firstDow = new Date(calendarMonth.y, calendarMonth.m, 1).getDay()
  const cells: (number | null)[] = []
  for (let i = 0; i < firstDow; i++) cells.push(null)
  for (let d = 1; d <= daysInMonth; d++) cells.push(d)

  const keyForDay = (d: number) => `${calendarMonth.y}-${String(calendarMonth.m + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`

  return (
    <div className="space-y-4">
      {/* 进度卡 */}
      <div className="p-5 rounded-2xl bg-gradient-to-br from-amber-500/15 via-rose-500/10 to-violet-500/15 border border-white/10 shadow-xl">
        <div className="flex items-center justify-between mb-3">
          <div>
            <div className="text-xs text-slate-400 uppercase tracking-wider">Today Progress</div>
            <div className="mt-1 text-2xl font-bold">
              {new Date().toLocaleDateString('zh-CN', { weekday: 'long', month: 'long', day: 'numeric' })}
            </div>
          </div>
          <div className="text-right">
            <div className="text-4xl font-black bg-gradient-to-br from-amber-300 to-rose-300 bg-clip-text text-transparent">{pct}%</div>
            <div className="text-xs text-slate-400">{todayDone} / {active.length} 完成</div>
          </div>
        </div>
        <div className="h-2.5 rounded-full bg-white/5 overflow-hidden">
          <div
            className="h-full bg-gradient-to-r from-amber-400 via-rose-500 to-violet-500 transition-all duration-500"
            style={{ width: `${pct}%` }}
          />
        </div>
        {pct === 100 && active.length > 0 && (
          <div className="mt-3 text-sm text-amber-200 flex items-center gap-2 animate-pulse">
            <Trophy className="w-4 h-4 text-amber-300" /> 恭喜！今日习惯已全部完成，你真棒！
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* 习惯列表 */}
        <div className="lg:col-span-2 space-y-2.5">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-semibold text-slate-200 flex items-center gap-2">
              <Flame className="w-4 h-4 text-orange-400" /> 今日习惯清单
            </h3>
          </div>
          {active.length === 0 && (
            <div className="p-6 rounded-xl border border-dashed border-white/10 text-center text-slate-400 text-sm">
              还没有习惯，去「习惯管理」创建你的第一个习惯吧。
            </div>
          )}
          {active.map(h => {
            const done = !!state.checks[h.id]?.[today]
            const Icon = ICONS[h.icon] || Target
            const streak = streaks[h.id] || 0
            const maxS = maxStreaks[h.id] || 0
            return (
              <div
                key={h.id}
                className={`group p-4 rounded-xl border transition-all ${done
                  ? 'bg-emerald-500/10 border-emerald-400/30'
                  : 'bg-white/[0.03] border-white/5 hover:border-white/10 hover:bg-white/[0.05]'
                }`}
              >
                <div className="flex items-start gap-3.5">
                  <button
                    onClick={() => toggleCheck(h.id, today)}
                    className={`flex-shrink-0 w-9 h-9 rounded-xl flex items-center justify-center transition-all ${done
                      ? 'bg-emerald-500 text-white shadow-lg shadow-emerald-500/30'
                      : 'bg-white/5 border border-white/10 text-slate-400 hover:border-white/30 hover:text-slate-200'
                    }`}
                  >
                    {done ? <Check className="w-5 h-5" /> : <div className="w-3.5 h-3.5 rounded-md border-2 border-current opacity-60" />}
                  </button>
                  <div
                    className="flex-shrink-0 w-10 h-10 rounded-xl flex items-center justify-center"
                    style={{ background: `${h.color}20`, color: h.color }}
                  >
                    <Icon className="w-5 h-5" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <div className={`font-semibold ${done ? 'text-slate-400 line-through' : 'text-slate-100'}`}>{h.name}</div>
                      <span className={`text-[10px] px-2 py-0.5 rounded-full border ${CATEGORY_LABELS[h.category].color} border-white/10 bg-white/5`}>
                        {CATEGORY_LABELS[h.category].label}
                      </span>
                      <span className="text-[10px] text-slate-500">目标 {h.weeklyGoal}次/周</span>
                    </div>
                    <div className="mt-1 flex items-center gap-3 text-[11px] text-slate-400">
                      <span className="flex items-center gap-1"><Flame className="w-3 h-3 text-orange-400" /> 连续 <b className="text-orange-300">{streak}</b> 天</span>
                      <span className="flex items-center gap-1"><Award className="w-3 h-3 text-amber-400" /> 最长 <b className="text-amber-300">{maxS}</b> 天</span>
                    </div>
                    {h.cue && (
                      <div className="mt-2 p-2 rounded-lg bg-black/20 text-[11px] text-slate-400 leading-relaxed space-y-0.5">
                        <div><span className="text-sky-300">提示：</span>{h.cue}</div>
                        <div><span className="text-fuchsia-300">渴求：</span>{h.craving}</div>
                        <div><span className="text-emerald-300">反应：</span>{h.response}</div>
                        <div><span className="text-amber-300">奖励：</span>{h.reward}</div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )
          })}
        </div>

        {/* 日历打卡热力图 */}
        <div>
          <div className="p-4 rounded-xl bg-white/[0.03] border border-white/5">
            <div className="flex items-center justify-between mb-3">
              <button
                onClick={() => {
                  let m = calendarMonth.m - 1, y = calendarMonth.y
                  if (m < 0) { m = 11; y-- }
                  setCalendarMonth({ y, m })
                }}
                className="p-1.5 rounded-lg hover:bg-white/10 text-slate-400"
              ><ChevronLeft className="w-4 h-4" /></button>
              <div className="text-sm font-semibold">
                {calendarMonth.y} 年 {calendarMonth.m + 1} 月
              </div>
              <button
                onClick={() => {
                  let m = calendarMonth.m + 1, y = calendarMonth.y
                  if (m > 11) { m = 0; y++ }
                  setCalendarMonth({ y, m })
                }}
                className="p-1.5 rounded-lg hover:bg-white/10 text-slate-400"
              ><ChevronRight className="w-4 h-4" /></button>
            </div>
            <div className="grid grid-cols-7 gap-1 text-[10px] text-slate-500 mb-1">
              {['日', '一', '二', '三', '四', '五', '六'].map(d => (
                <div key={d} className="text-center">{d}</div>
              ))}
            </div>
            <div className="grid grid-cols-7 gap-1">
              {cells.map((d, i) => {
                if (d === null) return <div key={i} />
                const k = keyForDay(d)
                // 计算当天完成数
                const count = active.filter(h => state.checks[h.id]?.[k]).length
                const intensity = active.length > 0 ? count / active.length : 0
                const isToday = k === today
                return (
                  <div
                    key={i}
                    onClick={() => active.forEach(h => toggleCheck(h.id, k))}
                    title={`${k}：${count} / ${active.length}`}
                    className={`aspect-square rounded-md text-[10px] flex items-center justify-center cursor-pointer transition-all ${isToday ? 'ring-2 ring-amber-400/60' : ''}`}
                    style={{
                      background: count === 0
                        ? 'rgba(255,255,255,0.03)'
                        : `rgba(251, 191, 36, ${0.15 + intensity * 0.7})`,
                      color: count === 0 ? 'rgb(100 116 139)' : '#1f2937',
                      fontWeight: count > 0 ? 600 : 400,
                    }}
                  >{d}</div>
                )
              })}
            </div>
            <div className="mt-3 flex items-center justify-end gap-1.5 text-[10px] text-slate-500">
              <span>少</span>
              {[0.1, 0.3, 0.55, 0.85, 1].map((v, i) => (
                <div key={i} className="w-3.5 h-3.5 rounded-sm" style={{ background: `rgba(251, 191, 36, ${v})` }} />
              ))}
              <span>多</span>
            </div>
          </div>

          {/* 66天成瘾曲线 */}
          <div className="mt-4 p-4 rounded-xl bg-gradient-to-br from-violet-500/10 to-fuchsia-500/10 border border-white/5">
            <div className="flex items-center justify-between mb-3">
              <div className="text-sm font-semibold flex items-center gap-2">
                <TrendingUp className="w-4 h-4 text-fuchsia-400" /> 66 天成瘾曲线
              </div>
              <div className="text-[10px] text-slate-400">科学研究：新习惯平均需 66 天自动化</div>
            </div>
            <svg viewBox="0 0 300 100" className="w-full h-24">
              <defs>
                <linearGradient id="curve-grad" x1="0" x2="1">
                  <stop offset="0%" stopColor="#f59e0b" />
                  <stop offset="50%" stopColor="#ec4899" />
                  <stop offset="100%" stopColor="#8b5cf6" />
                </linearGradient>
                <linearGradient id="curve-fill" x1="0" x2="0" y1="0" y2="1">
                  <stop offset="0%" stopColor="#ec4899" stopOpacity="0.4" />
                  <stop offset="100%" stopColor="#ec4899" stopOpacity="0" />
                </linearGradient>
              </defs>
              {/* 曲线 S 形：y = 100 / (1 + e^(-k(x-33))) */}
              {(() => {
                const pts: string[] = []
                const fillPts: string[] = ['0,100']
                const totalDays = active.reduce((acc, h) => {
                  const created = Math.floor((Date.now() - h.createdAt) / 86400000)
                  const checks = Object.keys(state.checks[h.id] || {}).length
                  return acc + Math.max(0, Math.min(checks, created))
                }, 0)
                const avg = active.length > 0 ? totalDays / active.length : 0
                for (let x = 0; x <= 66; x++) {
                  const y = 100 - 100 / (1 + Math.exp(-0.12 * (x - 33)))
                  const px = Math.round(x / 66 * 300)
                  pts.push(`${px},${y.toFixed(1)}`)
                  fillPts.push(`${px},${y.toFixed(1)}`)
                }
                fillPts.push('300,100')
                const currentX = Math.min(66, Math.round(avg)) / 66 * 300
                const currentY = 100 - 100 / (1 + Math.exp(-0.12 * (Math.min(66, Math.round(avg)) - 33)))
                return (
                  <>
                    <path d={`M ${fillPts.join(' L ')} Z`} fill="url(#curve-fill)" />
                    <path d={`M ${pts.join(' L ')}`} fill="none" stroke="url(#curve-grad)" strokeWidth="2.5" strokeLinecap="round" />
                    <circle cx={currentX} cy={currentY} r="5" fill="#fff" stroke="#ec4899" strokeWidth="2.5">
                      <animate attributeName="r" values="4.5;6;4.5" dur="1.5s" repeatCount="indefinite" />
                    </circle>
                    <text x={Math.min(280, currentX + 8)} y={Math.max(10, currentY - 8)} fontSize="10" fill="#fda4af" fontWeight="600">
                      你在这 · {Math.round(avg)} 天
                    </text>
                    {/* 里程碑 */}
                    {[21, 66].map(m => {
                      const mx = m / 66 * 300
                      const my = 100 - 100 / (1 + Math.exp(-0.12 * (m - 33)))
                      return (
                        <g key={m}>
                          <line x1={mx} y1={my - 20} x2={mx} y2={my} stroke="#fff" strokeOpacity="0.2" strokeDasharray="2 2" />
                          <circle cx={mx} cy={my} r="3" fill="#fbbf24" />
                          <text x={mx} y={my - 22} fontSize="8" textAnchor="middle" fill="#fcd34d" fontWeight="600">{m}天</text>
                        </g>
                      )
                    })}
                  </>
                )
              })()}
            </svg>
          </div>
        </div>
      </div>
    </div>
  )
}

// ========== 习惯管理视图 ==========
function HabitsView({
  state, streaks, addHabit, updateHabit, removeHabit, showAdd, setShowAdd, applyPreset,
}: {
  state: HabitState; streaks: Record<string, number>
  addHabit: (h: Omit<Habit, 'id' | 'createdAt'>) => void
  updateHabit: (id: string, patch: Partial<Habit>) => void
  removeHabit: (id: string) => void
  showAdd: boolean; setShowAdd: (b: boolean) => void
  applyPreset: (idx: number) => void
}) {
  const active = state.habits.filter(h => !h.archived)

  return (
    <div className="space-y-5">
      {/* 预设区 */}
      <div className="p-4 rounded-2xl bg-gradient-to-br from-sky-500/10 to-indigo-500/10 border border-white/10">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-sm font-semibold flex items-center gap-2">
            <Lightbulb className="w-4 h-4 text-amber-300" /> 快速模板 · 基于「原子习惯」四大法则
          </h3>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-2.5">
          {PRESETS.map((p, i) => {
            const Icon = ICONS[p.icon] || Target
            const exists = active.some(h => h.name === p.name)
            return (
              <button
                key={i}
                disabled={exists}
                onClick={() => applyPreset(i)}
                className={`text-left p-3 rounded-xl border transition-all ${exists
                  ? 'bg-white/[0.02] border-white/5 opacity-50 cursor-not-allowed'
                  : 'bg-white/[0.04] border-white/10 hover:bg-white/[0.07] hover:border-white/20'
                }`}
              >
                <div className="flex items-center gap-2 mb-1.5">
                  <div
                    className="w-7 h-7 rounded-lg flex items-center justify-center"
                    style={{ background: `${p.color}25`, color: p.color }}
                  ><Icon className="w-3.5 h-3.5" /></div>
                  <div className="text-xs font-semibold text-slate-100">{p.name}</div>
                </div>
                <div className="text-[10px] text-slate-400 leading-relaxed">{p.response}</div>
                <div className="mt-1.5 text-[10px] text-sky-300">{exists ? '已添加' : `目标 ${p.weeklyGoal} 次/周`}</div>
              </button>
            )
          })}
        </div>
      </div>

      {/* 自定义创建 */}
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold flex items-center gap-2">
          <Target className="w-4 h-4 text-sky-400" /> 我的习惯 ({active.length})
        </h3>
        <button
          onClick={() => setShowAdd(!showAdd)}
          className="px-3 py-1.5 rounded-lg bg-gradient-to-r from-amber-500 to-rose-500 text-white text-xs font-medium flex items-center gap-1.5 shadow-lg shadow-rose-500/20"
        >
          {showAdd ? <X className="w-3.5 h-3.5" /> : <Plus className="w-3.5 h-3.5" />}
          {showAdd ? '取消' : '新建习惯'}
        </button>
      </div>

      {showAdd && <HabitEditor onSave={(h) => { addHabit(h); setShowAdd(false) }} onCancel={() => setShowAdd(false)} />}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        {active.map(h => {
          const Icon = ICONS[h.icon] || Target
          const streak = streaks[h.id] || 0
          const daysSince = Math.floor((Date.now() - h.createdAt) / 86400000)
          // 本周完成数
          let weeklyDone = 0
          for (let i = 0; i < 7; i++) {
            if (state.checks[h.id]?.[daysAgo(i)]) weeklyDone++
          }
          return (
            <div key={h.id} className="p-4 rounded-xl bg-white/[0.03] border border-white/10 hover:border-white/20 transition-all">
              <div className="flex items-start gap-3">
                <div
                  className="w-11 h-11 rounded-xl flex items-center justify-center"
                  style={{ background: `${h.color}20`, color: h.color, boxShadow: `0 0 24px ${h.color}20` }}
                >
                  <Icon className="w-5.5 h-5.5" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <div className="font-semibold text-slate-100">{h.name}</div>
                    <span className={`text-[10px] px-1.5 py-0.5 rounded-full ${CATEGORY_LABELS[h.category].color} bg-white/5`}>
                      {CATEGORY_LABELS[h.category].label}
                    </span>
                  </div>
                  <div className="mt-1 flex items-center gap-3 text-[11px] text-slate-400">
                    <span className="flex items-center gap-1"><Calendar className="w-3 h-3" /> 坚持 {daysSince} 天</span>
                    <span className="flex items-center gap-1"><Flame className="w-3 h-3 text-orange-400" /> 连续 {streak}</span>
                    <span className="flex items-center gap-1">
                      <Target className="w-3 h-3" /> 本周 {weeklyDone}/{h.weeklyGoal}
                    </span>
                  </div>
                  <div className="mt-2 h-1.5 rounded-full bg-white/5 overflow-hidden">
                    <div
                      className="h-full rounded-full transition-all"
                      style={{
                        width: `${Math.min(100, Math.round(weeklyDone / h.weeklyGoal * 100))}%`,
                        background: h.color,
                      }}
                    />
                  </div>
                  <div className="mt-2 flex gap-1.5">
                    <button
                      onClick={() => removeHabit(h.id)}
                      className="text-[10px] px-2 py-1 rounded-md bg-rose-500/10 text-rose-300 hover:bg-rose-500/20 flex items-center gap-1"
                    ><Trash2 className="w-3 h-3" /> 删除</button>
                    <button
                      onClick={() => updateHabit(h.id, { weeklyGoal: Math.max(1, h.weeklyGoal - 1) })}
                      className="text-[10px] px-2 py-1 rounded-md bg-white/5 text-slate-300 hover:bg-white/10"
                    >目标-</button>
                    <button
                      onClick={() => updateHabit(h.id, { weeklyGoal: Math.min(7, h.weeklyGoal + 1) })}
                      className="text-[10px] px-2 py-1 rounded-md bg-white/5 text-slate-300 hover:bg-white/10"
                    >目标+</button>
                  </div>
                </div>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}

function HabitEditor({ onSave, onCancel, initial }: {
  onSave: (h: Omit<Habit, 'id' | 'createdAt'>) => void
  onCancel: () => void
  initial?: Omit<Habit, 'id' | 'createdAt'>
}) {
  const [name, setName] = useState(initial?.name || '')
  const [icon, setIcon] = useState<HabitIcon>(initial?.icon || 'target')
  const [color, setColor] = useState(initial?.color || COLORS[0])
  const [weeklyGoal, setWeeklyGoal] = useState(initial?.weeklyGoal || 7)
  const [category, setCategory] = useState<Habit['category']>(initial?.category || 'productivity')
  const [cue, setCue] = useState(initial?.cue || '')
  const [craving, setCraving] = useState(initial?.craving || '')
  const [response, setResponse] = useState(initial?.response || '')
  const [reward, setReward] = useState(initial?.reward || '')

  const submit = () => {
    if (!name.trim()) return
    onSave({ name: name.trim(), icon, color, weeklyGoal, category, cue, craving, response, reward })
  }

  return (
    <div className="p-5 rounded-2xl bg-gradient-to-br from-slate-900/90 to-slate-800/90 border border-white/10 backdrop-blur space-y-4 shadow-2xl">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-[11px] text-slate-400 mb-1">习惯名称 *</label>
          <input
            value={name} onChange={e => setName(e.target.value)} placeholder="例如：每天晨跑 5 公里"
            className="w-full px-3 py-2 rounded-lg bg-black/30 border border-white/10 text-sm focus:border-amber-400/50 focus:outline-none"
          />
        </div>
        <div>
          <label className="block text-[11px] text-slate-400 mb-1">分类</label>
          <select
            value={category} onChange={e => setCategory(e.target.value as Habit['category'])}
            className="w-full px-3 py-2 rounded-lg bg-black/30 border border-white/10 text-sm focus:outline-none"
          >
            {Object.entries(CATEGORY_LABELS).map(([k, v]) => (
              <option key={k} value={k}>{v.label}</option>
            ))}
          </select>
        </div>
        <div>
          <label className="block text-[11px] text-slate-400 mb-1">每周目标次数：{weeklyGoal}</label>
          <input type="range" min="1" max="7" value={weeklyGoal} onChange={e => setWeeklyGoal(+e.target.value)} className="w-full" />
        </div>
        <div>
          <label className="block text-[11px] text-slate-400 mb-1">颜色</label>
          <div className="flex flex-wrap gap-1.5">
            {COLORS.map(c => (
              <button
                key={c} onClick={() => setColor(c)}
                className={`w-6 h-6 rounded-md border-2 transition-all ${color === c ? 'border-white scale-110' : 'border-transparent'}`}
                style={{ background: c }}
              />
            ))}
          </div>
        </div>
        <div className="md:col-span-2">
          <label className="block text-[11px] text-slate-400 mb-1">图标</label>
          <div className="flex flex-wrap gap-1.5">
            {(Object.keys(ICONS) as HabitIcon[]).map(k => {
              const Ic = ICONS[k]
              return (
                <button
                  key={k} onClick={() => setIcon(k)} title={k}
                  className={`w-9 h-9 rounded-lg border flex items-center justify-center transition-all ${icon === k ? 'border-amber-400 bg-amber-400/10 scale-110' : 'border-white/10 bg-white/5 hover:bg-white/10'}`}
                  style={{ color }}
                ><Ic className="w-4.5 h-4.5" /></button>
              )
            })}
          </div>
        </div>
        <div>
          <label className="block text-[11px] text-sky-300 mb-1">法则 1 · 提示（让它显而易见）</label>
          <input value={cue} onChange={e => setCue(e.target.value)} placeholder="时间/地点触发条件"
            className="w-full px-3 py-2 rounded-lg bg-black/30 border border-white/10 text-xs focus:outline-none" />
        </div>
        <div>
          <label className="block text-[11px] text-fuchsia-300 mb-1">法则 2 · 渴求（让它有吸引力）</label>
          <input value={craving} onChange={e => setCraving(e.target.value)} placeholder="为什么想做？"
            className="w-full px-3 py-2 rounded-lg bg-black/30 border border-white/10 text-xs focus:outline-none" />
        </div>
        <div>
          <label className="block text-[11px] text-emerald-300 mb-1">法则 3 · 反应（让它简单易行）</label>
          <input value={response} onChange={e => setResponse(e.target.value)} placeholder="具体执行动作"
            className="w-full px-3 py-2 rounded-lg bg-black/30 border border-white/10 text-xs focus:outline-none" />
        </div>
        <div>
          <label className="block text-[11px] text-amber-300 mb-1">法则 4 · 奖励（让它令人满足）</label>
          <input value={reward} onChange={e => setReward(e.target.value)} placeholder="完成后的小奖励"
            className="w-full px-3 py-2 rounded-lg bg-black/30 border border-white/10 text-xs focus:outline-none" />
        </div>
      </div>
      <div className="flex justify-end gap-2">
        <button onClick={onCancel} className="px-4 py-2 rounded-lg text-xs bg-white/5 text-slate-300 hover:bg-white/10">取消</button>
        <button onClick={submit} className="px-4 py-2 rounded-lg text-xs bg-gradient-to-r from-amber-500 to-rose-500 text-white font-medium shadow-lg shadow-rose-500/20 flex items-center gap-1.5">
          <Check className="w-3.5 h-3.5" /> 保存习惯
        </button>
      </div>
    </div>
  )
}

// ========== 专注番茄钟 ==========
function FocusView({
  state, focusHabitId, setFocusHabitId, focusMin, setFocusMin, focusRunning, setFocusRunning, focusElapsed, setFocusElapsed, totalFocusMin,
}: {
  state: HabitState
  focusHabitId: string | null; setFocusHabitId: (s: string | null) => void
  focusMin: number; setFocusMin: (n: number) => void
  focusRunning: boolean; setFocusRunning: (b: boolean) => void
  focusElapsed: number; setFocusElapsed: (n: number) => void
  totalFocusMin: number
}) {
  const totalSec = focusMin * 60
  const remaining = Math.max(0, totalSec - focusElapsed)
  const pct = totalSec > 0 ? (focusElapsed / totalSec) : 0
  const mins = Math.floor(remaining / 60)
  const secs = remaining % 60
  const active = state.habits.filter(h => !h.archived)

  // 最近会话
  const recent = [...state.focusSessions].sort((a, b) => b.completedAt - a.completedAt).slice(0, 8)
  const habitMap = new Map(state.habits.map(h => [h.id, h]))

  // 环形进度参数
  const R = 90, C = 2 * Math.PI * R

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-4">
        {/* 左侧：圆形计时器 */}
        <div className="lg:col-span-3 p-6 rounded-2xl bg-gradient-to-br from-emerald-500/10 via-teal-500/5 to-sky-500/10 border border-white/10 flex flex-col items-center">
          <div className="text-xs text-slate-400 uppercase tracking-widest">Pomodoro Focus</div>
          <div className="mt-2 text-sm font-semibold text-emerald-300">专注当下，一次只做一件事</div>

          <div className="mt-6 relative">
            <svg width="240" height="240" viewBox="0 0 240 240">
              <defs>
                <linearGradient id="focusGrad" x1="0" x2="1" y1="0" y2="1">
                  <stop offset="0%" stopColor="#34d399" />
                  <stop offset="100%" stopColor="#0ea5e9" />
                </linearGradient>
              </defs>
              <circle cx="120" cy="120" r={R} stroke="rgba(255,255,255,0.05)" strokeWidth="14" fill="none" />
              <circle
                cx="120" cy="120" r={R}
                stroke="url(#focusGrad)"
                strokeWidth="14"
                fill="none"
                strokeLinecap="round"
                strokeDasharray={C}
                strokeDashoffset={C * (1 - pct)}
                transform="rotate(-90 120 120)"
                style={{ transition: 'stroke-dashoffset 1s linear' }}
              />
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <div className="text-5xl font-black tabular-nums tracking-tight bg-gradient-to-br from-emerald-200 to-sky-200 bg-clip-text text-transparent">
                {String(mins).padStart(2, '0')}:{String(secs).padStart(2, '0')}
              </div>
              <div className="mt-1 text-xs text-slate-400">
                {focusRunning ? '专注进行中' : pct >= 1 ? '已完成' : '准备开始'}
              </div>
            </div>
          </div>

          {/* 预设时长 */}
          <div className="mt-5 flex gap-2 flex-wrap justify-center">
            {[15, 25, 45, 60, 90].map(m => (
              <button
                key={m}
                onClick={() => { if (!focusRunning) { setFocusMin(m); setFocusElapsed(0) } }}
                disabled={focusRunning}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${focusMin === m
                  ? 'bg-gradient-to-r from-emerald-500 to-sky-500 text-white shadow'
                  : 'bg-white/5 text-slate-300 hover:bg-white/10 disabled:opacity-40'
                }`}
              >{m} 分钟</button>
            ))}
          </div>

          {/* 绑定习惯 */}
          <div className="mt-5 w-full max-w-md">
            <div className="text-[11px] text-slate-400 mb-1.5">关联习惯（可选）</div>
            <div className="flex flex-wrap gap-1.5">
              <button
                onClick={() => setFocusHabitId(null)}
                className={`px-3 py-1.5 rounded-lg text-xs border transition-all ${focusHabitId === null ? 'bg-white/10 border-white/20 text-white' : 'bg-white/[0.03] border-white/5 text-slate-400 hover:text-slate-200'}`}
              >不关联</button>
              {active.map(h => {
                const Icon = ICONS[h.icon] || Target
                return (
                  <button
                    key={h.id}
                    onClick={() => setFocusHabitId(h.id)}
                    className={`px-2.5 py-1.5 rounded-lg text-xs border flex items-center gap-1 transition-all ${focusHabitId === h.id ? 'border-white/30 bg-white/10' : 'border-white/5 bg-white/[0.03] text-slate-400 hover:text-slate-200'}`}
                    style={{ color: focusHabitId === h.id ? h.color : undefined }}
                  >
                    <Icon className="w-3 h-3" />{h.name}
                  </button>
                )
              })}
            </div>
          </div>

          {/* 控制按钮 */}
          <div className="mt-5 flex items-center gap-3">
            {!focusRunning ? (
              <button
                onClick={() => { if (remaining <= 0) setFocusElapsed(0); setFocusRunning(true) }}
                className="px-6 py-3 rounded-xl bg-gradient-to-r from-emerald-500 to-sky-500 text-white font-semibold shadow-lg shadow-emerald-500/30 flex items-center gap-2 hover:scale-[1.02] transition-transform"
              >
                <Play className="w-4 h-4" /> 开始专注
              </button>
            ) : (
              <button
                onClick={() => setFocusRunning(false)}
                className="px-6 py-3 rounded-xl bg-gradient-to-r from-amber-500 to-orange-500 text-white font-semibold shadow-lg shadow-amber-500/30 flex items-center gap-2"
              >
                <Pause className="w-4 h-4" /> 暂停
              </button>
            )}
            <button
              onClick={() => { setFocusRunning(false); setFocusElapsed(0) }}
              className="px-4 py-3 rounded-xl bg-white/5 text-slate-300 hover:bg-white/10 flex items-center gap-2"
            >
              <RotateCcw className="w-4 h-4" /> 重置
            </button>
          </div>
        </div>

        {/* 右侧：统计 & 历史 */}
        <div className="lg:col-span-2 space-y-4">
          <div className="p-4 rounded-2xl bg-white/[0.03] border border-white/10">
            <h4 className="text-sm font-semibold mb-3 flex items-center gap-2">
              <BarChart3 className="w-4 h-4 text-sky-400" /> 专注统计
            </h4>
            <div className="grid grid-cols-2 gap-3">
              <StatTile label="累计专注" value={`${totalFocusMin}`} unit="分钟" accent="text-emerald-300" />
              <StatTile label="完成次数" value={`${state.focusSessions.length}`} unit="次" accent="text-sky-300" />
              <StatTile label="今日" value={`${state.focusSessions.filter(s => Date.now() - s.completedAt < 86400000).length}`} unit="次" accent="text-amber-300" />
              <StatTile label="本周" value={`${state.focusSessions.filter(s => Date.now() - s.completedAt < 7 * 86400000).length}`} unit="次" accent="text-violet-300" />
            </div>
          </div>
          <div className="p-4 rounded-2xl bg-white/[0.03] border border-white/10">
            <h4 className="text-sm font-semibold mb-3 flex items-center gap-2">
              <Clock className="w-4 h-4 text-amber-400" /> 最近专注
            </h4>
            {recent.length === 0 ? (
              <div className="py-6 text-center text-xs text-slate-400">还没有专注记录，开始你的第一次专注吧！</div>
            ) : (
              <div className="space-y-1.5 max-h-60 overflow-y-auto pr-1">
                {recent.map(s => {
                  const h = habitMap.get(s.habitId || '')
                  const Icon = h ? (ICONS[h.icon] || Target) : Clock
                  return (
                    <div key={s.id} className="flex items-center gap-2.5 p-2 rounded-lg bg-white/[0.02] hover:bg-white/[0.05] text-xs">
                      <div
                        className="w-7 h-7 rounded-md flex items-center justify-center flex-shrink-0"
                        style={h ? { background: `${h.color}20`, color: h.color } : { background: '#ffffff10', color: '#94a3b8' }}
                      ><Icon className="w-3.5 h-3.5" /></div>
                      <div className="flex-1 min-w-0">
                        <div className="text-slate-200 truncate">{h?.name || '未关联习惯'}</div>
                        <div className="text-[10px] text-slate-500">
                          {new Date(s.completedAt).toLocaleString('zh-CN', { month: 'numeric', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                        </div>
                      </div>
                      <div className="text-emerald-300 font-semibold tabular-nums">{Math.round(s.durationSec / 60)}m</div>
                    </div>
                  )
                })}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

function StatTile({ label, value, unit, accent }: { label: string; value: string; unit: string; accent: string }) {
  return (
    <div className="p-3 rounded-xl bg-black/20 border border-white/5">
      <div className="text-[10px] text-slate-500">{label}</div>
      <div className="mt-0.5 flex items-baseline gap-1">
        <div className={`text-xl font-bold ${accent}`}>{value}</div>
        <div className="text-[10px] text-slate-500">{unit}</div>
      </div>
    </div>
  )
}

// ========== 数据统计 ==========
function StatsView({ state, streaks, maxStreaks }: {
  state: HabitState; streaks: Record<string, number>; maxStreaks: Record<string, number>
}) {
  const active = state.habits.filter(h => !h.archived)
  // 过去 30 天每天完成数
  const last30 = Array.from({ length: 30 }, (_, i) => daysAgo(29 - i))
  const dailyCounts = last30.map(k => active.filter(h => state.checks[h.id]?.[k]).length)
  const maxCount = Math.max(1, ...dailyCounts)
  // 分类饼图
  const catCounts: Record<string, number> = {}
  active.forEach(h => {
    let count = 0
    for (let i = 0; i < 30; i++) if (state.checks[h.id]?.[daysAgo(i)]) count++
    catCounts[h.category] = (catCounts[h.category] || 0) + count
  })
  const catEntries = Object.entries(catCounts).filter(([, v]) => v > 0)
  const catTotal = catEntries.reduce((a, [, v]) => a + v, 0)

  // 堆叠 SVG 饼图
  let pieAccum = 0
  const pieSegments = catEntries.map(([cat, v]) => {
    const frac = v / (catTotal || 1)
    const start = pieAccum
    pieAccum += frac
    const colorMap: Record<string, string> = { health: '#10b981', learning: '#0ea5e9', productivity: '#f59e0b', mindfulness: '#8b5cf6', lifestyle: '#ec4899', creative: '#d946ef' }
    return { cat, frac, start, color: colorMap[cat] || '#64748b', label: CATEGORY_LABELS[cat as Habit['category']]?.label || cat }
  })
  function polar(frac: number) {
    const a = 2 * Math.PI * frac - Math.PI / 2
    return [100 + 80 * Math.cos(a), 100 + 80 * Math.sin(a)] as const
  }

  return (
    <div className="space-y-4">
      {/* 总览卡片 */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <KPI title="总习惯" value={`${active.length}`} unit="个" icon={<Target className="w-4 h-4" />} accent="from-sky-500/30 to-sky-400/10" color="text-sky-300" />
        <KPI title="累计打卡" value={`${active.reduce((a, h) => a + Object.keys(state.checks[h.id] || {}).length, 0)}`} unit="次" icon={<Check className="w-4 h-4" />} accent="from-emerald-500/30 to-emerald-400/10" color="text-emerald-300" />
        <KPI title="当前最长连续" value={`${Math.max(0, ...Object.values(streaks))}`} unit="天" icon={<Flame className="w-4 h-4" />} accent="from-orange-500/30 to-amber-400/10" color="text-orange-300" />
        <KPI title="历史最长连续" value={`${Math.max(0, ...Object.values(maxStreaks))}`} unit="天" icon={<Trophy className="w-4 h-4" />} accent="from-violet-500/30 to-fuchsia-400/10" color="text-violet-300" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-5 gap-4">
        {/* 30天柱状图 */}
        <div className="lg:col-span-3 p-5 rounded-2xl bg-white/[0.03] border border-white/10">
          <h4 className="text-sm font-semibold mb-4 flex items-center gap-2">
            <BarChart3 className="w-4 h-4 text-amber-400" /> 过去 30 天每日打卡
          </h4>
          <div className="flex items-end gap-1 h-48">
            {dailyCounts.map((c, i) => {
              const h = Math.max(4, (c / maxCount) * 100)
              const d = parseYMD(last30[i])
              const isToday = i === last30.length - 1
              return (
                <div key={i} className="flex-1 flex flex-col items-center justify-end group relative">
                  <div
                    className={`w-full rounded-t transition-all ${isToday ? 'bg-gradient-to-t from-amber-500 to-rose-400' : 'bg-gradient-to-t from-sky-500/70 to-violet-400/70'} group-hover:brightness-125`}
                    style={{ height: `${h}%` }}
                    title={`${last30[i]}：${c} / ${active.length}`}
                  />
                  {(i % 5 === 0 || isToday) && (
                    <div className="mt-1 text-[9px] text-slate-500">{d.getMonth() + 1}/{d.getDate()}</div>
                  )}
                </div>
              )
            })}
          </div>
        </div>

        {/* 分类饼图 */}
        <div className="lg:col-span-2 p-5 rounded-2xl bg-white/[0.03] border border-white/10">
          <h4 className="text-sm font-semibold mb-3 flex items-center gap-2">
            <PieChart className="w-4 h-4 text-fuchsia-400" /> 近 30 天分类分布
          </h4>
          {catTotal === 0 ? (
            <div className="py-12 text-center text-xs text-slate-400">暂无数据</div>
          ) : (
            <div className="flex items-center gap-4">
              <svg viewBox="0 0 200 200" className="w-40 h-40 flex-shrink-0">
                {pieSegments.map((seg, i) => {
                  const [x1, y1] = polar(seg.start)
                  const [x2, y2] = polar(seg.start + seg.frac)
                  const large = seg.frac > 0.5 ? 1 : 0
                  const d = `M 100 100 L ${x1} ${y1} A 80 80 0 ${large} 1 ${x2} ${y2} Z`
                  return <path key={i} d={d} fill={seg.color} stroke="rgba(0,0,0,0.3)" strokeWidth="1" />
                })}
                <circle cx="100" cy="100" r="44" fill="rgba(255,255,255,0.03)" />
                <text x="100" y="96" textAnchor="middle" fontSize="18" fontWeight="700" fill="#f1f5f9">{catTotal}</text>
                <text x="100" y="112" textAnchor="middle" fontSize="9" fill="#94a3b8">总打卡</text>
              </svg>
              <div className="flex-1 space-y-1.5 min-w-0">
                {pieSegments.map((seg, i) => (
                  <div key={i} className="flex items-center gap-2 text-xs">
                    <div className="w-3 h-3 rounded-sm flex-shrink-0" style={{ background: seg.color }} />
                    <div className="flex-1 truncate">{seg.label}</div>
                    <div className="text-slate-400 tabular-nums">{Math.round(seg.frac * 100)}%</div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* 习惯表现排行榜 */}
      <div className="p-5 rounded-2xl bg-white/[0.03] border border-white/10">
        <h4 className="text-sm font-semibold mb-3 flex items-center gap-2">
          <TrendingUp className="w-4 h-4 text-emerald-400" /> 习惯完成度排行（近 30 天）
        </h4>
        <div className="space-y-2">
          {active.map(h => {
            let done = 0
            for (let i = 0; i < 30; i++) if (state.checks[h.id]?.[daysAgo(i)]) done++
            const dailyGoal = h.weeklyGoal / 7
            const expected = dailyGoal * 30
            const rate = Math.min(100, Math.round(done / Math.max(1, expected) * 100))
            return { h, done, rate }
          }).sort((a, b) => b.rate - a.rate).map(({ h, done, rate }, rank) => {
            const Ic = ICONS[h.icon] || Target
            return (
              <div key={h.id} className="flex items-center gap-3 p-2.5 rounded-xl bg-black/20">
                <div className={`w-7 h-7 rounded-lg flex items-center justify-center text-xs font-bold ${rank === 0 ? 'bg-amber-500/20 text-amber-300' : rank === 1 ? 'bg-slate-400/20 text-slate-300' : rank === 2 ? 'bg-orange-600/20 text-orange-300' : 'bg-white/5 text-slate-500'}`}>
                  {rank + 1}
                </div>
                <div className="w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0" style={{ background: `${h.color}20`, color: h.color }}>
                  <Ic className="w-4 h-4" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between">
                    <div className="text-sm text-slate-200 truncate">{h.name}</div>
                    <div className="text-[11px] text-slate-400 tabular-nums ml-2 flex-shrink-0">{done} 次 · {rate}%</div>
                  </div>
                  <div className="mt-1 h-1.5 rounded-full bg-white/5 overflow-hidden">
                    <div className="h-full rounded-full transition-all" style={{ width: `${rate}%`, background: h.color }} />
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}

function KPI({ title, value, unit, icon, accent, color }: {
  title: string; value: string; unit: string; icon: React.ReactNode; accent: string; color: string
}) {
  return (
    <div className={`p-4 rounded-2xl border border-white/10 bg-gradient-to-br ${accent}`}>
      <div className="flex items-center justify-between">
        <div className="text-[11px] text-slate-400">{title}</div>
        <div className={color}>{icon}</div>
      </div>
      <div className="mt-2 flex items-baseline gap-1.5">
        <div className={`text-2xl font-black ${color}`}>{value}</div>
        <div className="text-[10px] text-slate-400">{unit}</div>
      </div>
    </div>
  )
}

// ========== 年度成长报告 ==========
function ReportView({ state, streaks, maxStreaks, totalChecks, weeklyRate, focusMinTotal }: {
  state: HabitState; today: string; streaks: Record<string, number>; maxStreaks: Record<string, number>
  totalChecks: number; weeklyRate: number; focusMinTotal: number
}) {
  void (arguments[1] as string)
  const active = state.habits.filter(h => !h.archived)
  const year = new Date().getFullYear()
  const jan1 = new Date(year, 0, 1)
  const daysSinceJan1 = Math.floor((Date.now() - jan1.getTime()) / 86400000)
  // 年度打卡热力图 (7列 x 53行 的 GitHub 风格)
  const cols = 53
  const rows = 7
  const cells: { key: string; count: number }[][] = Array.from({ length: cols }, () =>
    Array.from({ length: rows }, () => ({ key: '', count: 0 }))
  )
  for (let day = 0; day <= daysSinceJan1; day++) {
    const d = new Date(jan1)
    d.setDate(jan1.getDate() + day)
    const week = Math.floor((day + jan1.getDay()) / 7)
    const dow = d.getDay()
    if (week < cols) {
      const key = ymd(d)
      const count = active.filter(h => state.checks[h.id]?.[key]).length
      cells[week][dow] = { key, count }
    }
  }
  const maxCell = Math.max(1, ...cells.flat().map(c => c.count))

  const maxHabit = active.reduce((best, h) => {
    const s = maxStreaks[h.id] || 0
    if (!best || s > (maxStreaks[best.id] || 0)) return h
    return best
  }, null as Habit | null)
  const currentBest = active.reduce((best, h) => {
    const s = streaks[h.id] || 0
    if (!best || s > (streaks[best.id] || 0)) return h
    return best
  }, null as Habit | null)

  return (
    <div className="max-w-5xl mx-auto space-y-5">
      <div className="p-8 rounded-3xl bg-gradient-to-br from-violet-600/20 via-fuchsia-500/10 to-amber-500/20 border border-white/10 text-center relative overflow-hidden">
        <div className="absolute inset-0 opacity-20" style={{
          backgroundImage: 'radial-gradient(circle at 20% 20%, #f59e0b80 0%, transparent 50%), radial-gradient(circle at 80% 80%, #8b5cf680 0%, transparent 50%)'
        }} />
        <div className="relative">
          <div className="text-[11px] uppercase tracking-[0.3em] text-slate-400">Annual Growth Report · 年度成长报告</div>
          <h1 className="mt-2 text-4xl md:text-5xl font-black bg-gradient-to-br from-amber-200 via-rose-200 to-violet-300 bg-clip-text text-transparent">
            {year} 年你正在变得更好
          </h1>
          <p className="mt-3 text-sm text-slate-300 max-w-xl mx-auto leading-relaxed">
            每一次打卡，都是对未来自己的投资。这是你在 {year} 年留下的成长足迹。
          </p>
        </div>
      </div>

      {/* 4 大 KPI */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <ReportKPI value={`${totalChecks}`} label="累计打卡次数" unit="次" icon={<Check className="w-4 h-4" />} color="#10b981" />
        <ReportKPI value={`${active.length}`} label="坚持的习惯" unit="个" icon={<Target className="w-4 h-4" />} color="#0ea5e9" />
        <ReportKPI value={`${Math.max(0, ...Object.values(maxStreaks))}`} label="历史最长连续" unit="天" icon={<Trophy className="w-4 h-4" />} color="#f59e0b" />
        <ReportKPI value={`${focusMinTotal}`} label="累计专注时长" unit="分钟" icon={<Clock className="w-4 h-4" />} color="#8b5cf6" />
      </div>

      {/* 年度热力图 */}
      <div className="p-5 rounded-2xl bg-white/[0.03] border border-white/10">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-sm font-semibold flex items-center gap-2">
            <Flame className="w-4 h-4 text-orange-400" /> {year} 习惯打卡热力图
          </h3>
          <div className="text-[10px] text-slate-500 flex items-center gap-1.5">
            <span>少</span>
            {[0.15, 0.35, 0.6, 0.85].map((v, i) => (
              <div key={i} className="w-3 h-3 rounded-sm" style={{ background: `rgba(16, 185, 129, ${v})` }} />
            ))}
            <span>多</span>
          </div>
        </div>
        <div className="overflow-x-auto pb-2">
          <div className="flex gap-[3px] min-w-fit">
            {cells.map((col, ci) => (
              <div key={ci} className="flex flex-col gap-[3px]">
                {col.map((cell, ri) => {
                  const filled = cell.key !== ''
                  const intensity = filled ? Math.min(1, cell.count / maxCell) : 0
                  return (
                    <div
                      key={ri}
                      title={filled ? `${cell.key}：${cell.count} 个习惯完成` : ''}
                      className="w-[11px] h-[11px] rounded-[2px]"
                      style={{
                        background: !filled ? 'rgba(255,255,255,0.03)'
                          : intensity === 0 ? 'rgba(255,255,255,0.04)'
                          : `rgba(16, 185, 129, ${0.15 + intensity * 0.85})`,
                      }}
                    />
                  )
                })}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* 2 列：习惯之王 + 荣誉 */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="p-5 rounded-2xl bg-gradient-to-br from-amber-500/10 to-orange-500/10 border border-white/10">
          <h3 className="text-sm font-semibold mb-3 flex items-center gap-2">
            <Trophy className="w-4 h-4 text-amber-300" /> 坚持之王
          </h3>
          {maxHabit ? (() => {
            const Icon = ICONS[maxHabit.icon] || Target
            return (
              <div className="flex items-center gap-4">
                <div
                  className="w-16 h-16 rounded-2xl flex items-center justify-center flex-shrink-0 shadow-2xl"
                  style={{
                    background: `linear-gradient(135deg, ${maxHabit.color}, ${maxHabit.color}88)`,
                    boxShadow: `0 0 40px ${maxHabit.color}60`,
                  }}
                ><Icon className="w-8 h-8 text-white" /></div>
                <div className="flex-1 min-w-0">
                  <div className="text-lg font-bold">{maxHabit.name}</div>
                  <div className="text-xs text-slate-400 mt-0.5">
                    历史最长连续打卡记录
                  </div>
                  <div className="mt-2 text-3xl font-black text-amber-300">
                    {maxStreaks[maxHabit.id] || 0}<span className="text-sm font-medium ml-1">天</span>
                  </div>
                </div>
              </div>
            )
          })() : <div className="text-slate-400 text-sm">暂无数据</div>}
        </div>

        <div className="p-5 rounded-2xl bg-gradient-to-br from-rose-500/10 to-fuchsia-500/10 border border-white/10">
          <h3 className="text-sm font-semibold mb-3 flex items-center gap-2">
            <Flame className="w-4 h-4 text-rose-300" /> 当前燃烧中
          </h3>
          {currentBest ? (() => {
            const Icon = ICONS[currentBest.icon] || Target
            return (
              <div className="flex items-center gap-4">
                <div
                  className="w-16 h-16 rounded-2xl flex items-center justify-center flex-shrink-0 shadow-2xl"
                  style={{
                    background: `linear-gradient(135deg, ${currentBest.color}, ${currentBest.color}88)`,
                    boxShadow: `0 0 40px ${currentBest.color}60`,
                    animation: 'pulse 2s ease-in-out infinite',
                  }}
                ><Icon className="w-8 h-8 text-white" /></div>
                <div className="flex-1 min-w-0">
                  <div className="text-lg font-bold">{currentBest.name}</div>
                  <div className="text-xs text-slate-400 mt-0.5">正在连续打卡，不要让火焰熄灭！</div>
                  <div className="mt-2 text-3xl font-black text-rose-300">
                    {streaks[currentBest.id] || 0}<span className="text-sm font-medium ml-1">天 🔥</span>
                  </div>
                </div>
              </div>
            )
          })() : <div className="text-slate-400 text-sm">暂无数据</div>}
        </div>
      </div>

      {/* 综合评级 */}
      <div className="p-6 rounded-3xl bg-gradient-to-br from-emerald-500/15 via-teal-500/10 to-sky-500/15 border border-white/10 text-center">
        <div className="text-xs uppercase tracking-widest text-slate-400">年度成长评级</div>
        {(() => {
          const score = Math.min(100,
            (weeklyRate * 0.4) +
            (Math.min(100, totalChecks / 3)) * 0.3 +
            (Math.min(100, Math.max(0, ...Object.values(maxStreaks)) / 0.66)) * 0.2 +
            (Math.min(100, focusMinTotal / 30)) * 0.1
          )
          let grade = 'D', desc = '起步阶段，加油！', color = '#94a3b8'
          if (score >= 90) { grade = 'S'; desc = '卓越！你是自律大师'; color = '#f59e0b' }
          else if (score >= 80) { grade = 'A'; desc = '优秀，持续精进', color = '#10b981' }
          else if (score >= 65) { grade = 'B'; desc = '良好，保持节奏', color = '#0ea5e9' }
          else if (score >= 45) { grade = 'C'; desc = '还行，再加把劲', color = '#a855f7' }
          return (
            <div className="mt-3 flex flex-col items-center">
              <div
                className="text-7xl font-black tracking-tight"
                style={{ color, textShadow: `0 0 30px ${color}80` }}
              >{grade}</div>
              <div className="mt-1 text-lg font-semibold" style={{ color }}>{desc}</div>
              <div className="mt-2 text-xs text-slate-400">综合得分 {Math.round(score)} / 100</div>
              <div className="mt-4 h-2 w-full max-w-md rounded-full bg-white/5 overflow-hidden">
                <div
                  className="h-full rounded-full transition-all"
                  style={{ width: `${score}%`, background: `linear-gradient(90deg, ${color}, #ec4899)` }}
                />
              </div>
              <div className="mt-4 max-w-md mx-auto text-xs text-slate-400 leading-relaxed">
                💡 建议：{score < 65
                  ? '先从一个容易的小习惯开始，使用 2 分钟法则让起步变得简单。不要完美，要持续。'
                  : score < 85
                  ? '你的节奏很棒！尝试使用「习惯堆叠」——把新习惯绑定到已坚持的习惯之后。'
                  : '你已经是习惯大师！尝试用「身份认同」来强化：我是「每天阅读的人」，而不是「我要阅读」。'}
              </div>
            </div>
          )
        })()}
      </div>
    </div>
  )
}

function ReportKPI({ value, label, unit, icon, color }: {
  value: string; label: string; unit: string; icon: React.ReactNode; color: string
}) {
  return (
    <div className="p-4 rounded-2xl bg-white/[0.03] border border-white/10">
      <div className="flex items-center gap-2" style={{ color }}>
        {icon}
        <span className="text-[10px] uppercase tracking-wider text-slate-400">{label}</span>
      </div>
      <div className="mt-2 flex items-baseline gap-1">
        <div className="text-3xl font-black" style={{ color }}>{value}</div>
        <div className="text-[11px] text-slate-500">{unit}</div>
      </div>
    </div>
  )
}

export default QuantumHabitOS
