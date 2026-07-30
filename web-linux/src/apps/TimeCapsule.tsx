import { useState, useEffect, useMemo, useCallback, useRef } from 'react'
import {
  Target, Plus, Trash2, Calendar, Flag, CheckCircle2, Circle, Clock,
  TrendingUp, ChevronRight, Edit3, Save, X, Sparkles,
  BookOpen, Star, Heart, Compass, Anchor, Crown, Flame,
} from 'lucide-react'

/**
 * TimeCapsule 时间胶囊
 * --------------------------------------------------------------
 *  个人里程碑 / 目标 / 习惯追踪工作台
 *
 *  设计理念：
 *  - 把人生看作一条时间轴，每个里程碑都是时间轴上的「胶囊」
 *  - 目标 + 进度 + 截止 + 反思 = 完整的闭环
 *  - 视觉化时间线 + 习惯打卡 + 励志格言，激励持续前行
 *
 *  功能：
 *  1. 里程碑：长期目标（学完一门课 / 完成项目 / 旅行等）
 *  2. 任务：与里程碑关联的子任务
 *  3. 习惯：每日 / 每周打卡
 *  4. 反思：每日记录一行收获
 *  5. 时间线：所有事件按时间排序的视觉展示
 *
 *  存储：localStorage 全本地
 */

type ItemKind = 'milestone' | 'task' | 'habit' | 'reflection'

interface BaseItem {
  id: string
  kind: ItemKind
  title: string
  note?: string
  createdAt: number
  updatedAt: number
  achievedAt?: number
  color: string
  icon: string
  starred?: boolean
}

interface MilestoneItem extends BaseItem {
  kind: 'milestone'
  targetDate?: number  // 目标日期
  category: string
  progress: number     // 0-100
  linkedTaskIds: string[]
}

interface TaskItem extends BaseItem {
  kind: 'task'
  dueDate?: number
  done: boolean
  milestoneId?: string
  priority: 'low' | 'med' | 'high'
}

interface HabitItem extends BaseItem {
  kind: 'habit'
  frequency: 'daily' | 'weekly'
  streak: number           // 连续打卡
  lastCheckin?: number     // 上次打卡时间戳
  history: string[]        // ISO date strings
  target: number           // 每周/每天目标
}

interface ReflectionItem extends BaseItem {
  kind: 'reflection'
  date: number  // 当天
  mood: 1 | 2 | 3 | 4 | 5
}

type AnyItem = MilestoneItem | TaskItem | HabitItem | ReflectionItem

const STORAGE_KEY = 'weblinux-timecapsule-v1'

const COLOR_THEMES: Array<{ name: string; primary: string; soft: string; icon: string }> = [
  { name: 'amber', primary: '#f59e0b', soft: 'rgba(245, 158, 11, 0.15)', icon: 'star' },
  { name: 'rose', primary: '#f43f5e', soft: 'rgba(244, 63, 94, 0.15)', icon: 'heart' },
  { name: 'emerald', primary: '#10b981', soft: 'rgba(16, 185, 129, 0.15)', icon: 'compass' },
  { name: 'sky', primary: '#0ea5e9', soft: 'rgba(14, 165, 233, 0.15)', icon: 'anchor' },
  { name: 'violet', primary: '#8b5cf6', soft: 'rgba(139, 92, 246, 0.15)', icon: 'crown' },
  { name: 'amber', primary: '#fb923c', soft: 'rgba(251, 146, 60, 0.15)', icon: 'flame' },
]

const CATEGORIES = [
  { id: 'learning', label: '学习成长', icon: BookOpen, color: '#8b5cf6' },
  { id: 'career', label: '事业', icon: Crown, color: '#f59e0b' },
  { id: 'health', label: '健康', icon: Flame, color: '#ef4444' },
  { id: 'relationship', label: '关系', icon: Heart, color: '#f43f5e' },
  { id: 'experience', label: '体验', icon: Compass, color: '#10b981' },
  { id: 'creative', label: '创作', icon: Sparkles, color: '#0ea5e9' },
  { id: 'finance', label: '财务', icon: TrendingUp, color: '#22c55e' },
  { id: 'other', label: '其他', icon: Flag, color: '#94a3b8' },
]

const REFLECTION_PROMPTS = [
  '今天最让我有成就感的是什么？',
  '我学到了什么？',
  '我克服了什么困难？',
  '有谁帮到了我？',
  '明天我打算做什么？',
  '今天我可以做得更好的是什么？',
]

const SAMPLE_DATA: AnyItem[] = [
  {
    id: 'm1', kind: 'milestone', title: '完成 WebLinuxOS v54 发布',
    note: '集成 NeuroGraph / ImageForge / TimeCapsule 三大新应用',
    category: 'career', progress: 65, linkedTaskIds: ['t1', 't2'],
    color: '#f59e0b', icon: 'crown',
    createdAt: Date.now() - 86400000 * 30, updatedAt: Date.now() - 86400000,
    targetDate: Date.now() + 86400000 * 14, starred: true,
  },
  {
    id: 'm2', kind: 'milestone', title: '读完《代码大全》',
    note: '每天 30 页，进度稳定',
    category: 'learning', progress: 42, linkedTaskIds: [],
    color: '#8b5cf6', icon: 'book-open',
    createdAt: Date.now() - 86400000 * 60, updatedAt: Date.now() - 86400000 * 2,
    targetDate: Date.now() + 86400000 * 45,
  },
  {
    id: 'h1', kind: 'habit', title: '晨跑 30 分钟',
    frequency: 'daily', streak: 7, target: 1,
    history: Array.from({ length: 7 }, (_, i) => new Date(Date.now() - i * 86400000).toISOString().slice(0, 10)),
    lastCheckin: Date.now() - 3600000 * 2,
    color: '#ef4444', icon: 'flame',
    createdAt: Date.now() - 86400000 * 30, updatedAt: Date.now() - 3600000 * 2,
  },
  {
    id: 'h2', kind: 'habit', title: '写日记',
    frequency: 'daily', streak: 14, target: 1,
    history: Array.from({ length: 14 }, (_, i) => new Date(Date.now() - i * 86400000).toISOString().slice(0, 10)),
    lastCheckin: Date.now() - 3600000 * 5,
    color: '#0ea5e9', icon: 'edit-3',
    createdAt: Date.now() - 86400000 * 30, updatedAt: Date.now() - 3600000 * 5,
  },
  {
    id: 'h3', kind: 'habit', title: '深度阅读 1 小时',
    frequency: 'weekly', streak: 3, target: 5,
    history: ['2026-07-29', '2026-07-28', '2026-07-25'],
    lastCheckin: Date.now() - 86400000,
    color: '#10b981', icon: 'book-open',
    createdAt: Date.now() - 86400000 * 21, updatedAt: Date.now() - 86400000,
  },
  {
    id: 't1', kind: 'task', title: '编写 NeuroGraph 的 [[wiki 链接]] 解析',
    done: true, priority: 'high', milestoneId: 'm1',
    color: '#f59e0b', icon: 'check-circle-2',
    createdAt: Date.now() - 86400000 * 3, updatedAt: Date.now() - 86400000,
    achievedAt: Date.now() - 86400000,
  },
  {
    id: 't2', kind: 'task', title: '为 ImageForge 集成 Pollinations API',
    done: false, priority: 'high', milestoneId: 'm1',
    dueDate: Date.now() + 86400000 * 3,
    color: '#f59e0b', icon: 'circle',
    createdAt: Date.now() - 86400000, updatedAt: Date.now() - 3600000 * 3,
  },
  {
    id: 't3', kind: 'task', title: '本月跑完 60 公里',
    done: false, priority: 'med',
    dueDate: Date.now() + 86400000 * 5,
    color: '#94a3b8', icon: 'circle',
    createdAt: Date.now() - 86400000 * 5, updatedAt: Date.now() - 86400000 * 2,
  },
  {
    id: 'r1', kind: 'reflection',
    title: '今天完成了 TimeCapsule 的核心架构',
    note: '把目标拆成里程碑 + 任务 + 习惯的层级结构，比简单的 Todo 列表有更强的视觉层次感。',
    mood: 4, date: Date.now() - 86400000,
    color: '#10b981', icon: 'sparkles',
    createdAt: Date.now() - 86400000, updatedAt: Date.now() - 86400000,
  },
]

function loadAll(): AnyItem[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return SAMPLE_DATA
    const arr = JSON.parse(raw) as AnyItem[]
    return Array.isArray(arr) ? arr : SAMPLE_DATA
  } catch {
    return SAMPLE_DATA
  }
}

function saveAll(items: AnyItem[]) {
  try { localStorage.setItem(STORAGE_KEY, JSON.stringify(items)) } catch { /* noop */ }
}

function uid(): string {
  return `t-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`
}

function dateStr(d: number | Date): string {
  return new Date(d).toISOString().slice(0, 10)
}

function daysBetween(a: number, b: number): number {
  const ms = Math.abs(a - b)
  return Math.floor(ms / 86400000)
}

function formatRelative(ts: number): string {
  const diff = ts - Date.now()
  const abs = Math.abs(diff)
  const future = diff > 0
  if (abs < 3600000) return future ? '1 小时内' : '刚刚'
  if (abs < 86400000) return future ? `${Math.floor(abs / 3600000)} 小时后` : `${Math.floor(abs / 3600000)} 小时前`
  if (abs < 86400000 * 30) return future ? `${Math.floor(abs / 86400000)} 天后` : `${Math.floor(abs / 86400000)} 天前`
  if (abs < 86400000 * 365) return future ? `${Math.floor(abs / 86400000 / 30)} 个月后` : `${Math.floor(abs / 86400000 / 30)} 个月前`
  return future ? `${Math.floor(abs / 86400000 / 365)} 年后` : `${Math.floor(abs / 86400000 / 365)} 年前`
}

const ICON_MAP: Record<string, React.ComponentType<{ size?: number; className?: string }>> = {
  'star': Star, 'heart': Heart, 'compass': Compass, 'anchor': Anchor,
  'crown': Crown, 'flame': Flame, 'book-open': BookOpen, 'edit-3': Edit3,
  'check-circle-2': CheckCircle2, 'circle': Circle, 'sparkles': Sparkles, 'flag': Flag,
}

function ItemIcon({ name, size = 14, className = '' }: { name: string; size?: number; className?: string }) {
  const C = ICON_MAP[name] || Star
  return <C size={size} className={className} />
}

export default function TimeCapsule() {
  const [items, setItems] = useState<AnyItem[]>(() => loadAll())
  const [activeTab, setActiveTab] = useState<'overview' | 'milestones' | 'habits' | 'tasks' | 'timeline' | 'reflect'>('overview')
  const [editingItem, setEditingItem] = useState<AnyItem | null>(null)
  const [reflectionText, setReflectionText] = useState('')
  const [reflectionMood, setReflectionMood] = useState<1 | 2 | 3 | 4 | 5>(4)
  const timelineRef = useRef<HTMLDivElement>(null)

  useEffect(() => { saveAll(items) }, [items])

  const milestones = useMemo(() => items.filter((i): i is MilestoneItem => i.kind === 'milestone'), [items])
  const tasks = useMemo(() => items.filter((i): i is TaskItem => i.kind === 'task'), [items])
  const habits = useMemo(() => items.filter((i): i is HabitItem => i.kind === 'habit'), [items])
  const reflections = useMemo(() => items.filter((i): i is ReflectionItem => i.kind === 'reflection'), [items])

  const stats = useMemo(() => {
    const openTasks = tasks.filter((t) => !t.done).length
    const doneTasks = tasks.filter((t) => t.done).length
    const habitRate = habits.length > 0
      ? Math.round((habits.reduce((s, h) => s + h.streak, 0) / Math.max(1, habits.length)) * 10) / 10
      : 0
    const achievedMilestones = milestones.filter((m) => m.progress >= 100).length
    const avgProgress = milestones.length > 0
      ? Math.round(milestones.reduce((s, m) => s + m.progress, 0) / milestones.length)
      : 0
    return { openTasks, doneTasks, habitRate, achievedMilestones, avgProgress, totalMilestones: milestones.length }
  }, [tasks, habits, milestones])

  // 今日打卡
  const todayStr = dateStr(Date.now())
  const todayCheckedHabits = habits.filter((h) => h.history.includes(todayStr)).length

  // 今日反思
  const todayReflections = reflections.filter((r) => dateStr(r.date) === todayStr)

  const createItem = useCallback((kind: ItemKind) => {
    const now = Date.now()
    const base = { id: uid(), createdAt: now, updatedAt: now, color: COLOR_THEMES[items.length % COLOR_THEMES.length].primary, icon: 'star' }
    let item: AnyItem
    if (kind === 'milestone') {
      item = { ...base, kind: 'milestone', title: '新里程碑', category: 'learning', progress: 0, linkedTaskIds: [] }
    } else if (kind === 'task') {
      item = { ...base, kind: 'task', title: '新任务', done: false, priority: 'med' }
    } else if (kind === 'habit') {
      item = { ...base, kind: 'habit', title: '新习惯', frequency: 'daily', streak: 0, history: [], target: 1 }
    } else {
      item = { ...base, kind: 'reflection', title: '今日反思', date: now, mood: 3 }
    }
    setItems((prev) => [item, ...prev])
    setEditingItem(item)
  }, [items.length])

  const updateItem = useCallback((id: string, patch: Partial<AnyItem>) => {
    setItems((prev) => prev.map((it) => (it.id === id ? ({ ...it, ...patch, updatedAt: Date.now() } as AnyItem) : it)))
  }, [])

  const deleteItem = useCallback((id: string) => {
    if (!confirm('确认删除此项？')) return
    setItems((prev) => prev.filter((it) => it.id !== id))
  }, [])

  // 任务完成切换
  const toggleTask = useCallback((id: string) => {
    setItems((prev) => prev.map((it) => {
      if (it.id !== id || it.kind !== 'task') return it
      const done = !it.done
      return { ...it, done, achievedAt: done ? Date.now() : undefined, updatedAt: Date.now() } as TaskItem
    }))
    // 同步更新关联里程碑进度
    setItems((prev) => {
      const task = prev.find((i) => i.id === id) as TaskItem | undefined
      if (!task || !task.milestoneId) return prev
      const linkedTasks = (prev as TaskItem[]).filter((t) => t.milestoneId === task.milestoneId)
      if (linkedTasks.length === 0) return prev
      const doneCount = linkedTasks.filter((t) => t.done).length
      const progress = Math.round((doneCount / linkedTasks.length) * 100)
      return prev.map((it) => it.id === task.milestoneId ? ({ ...it, progress, updatedAt: Date.now() } as MilestoneItem) : it)
    })
  }, [])

  // 习惯打卡
  const checkHabit = useCallback((id: string) => {
    setItems((prev) => prev.map((it) => {
      if (it.id !== id || it.kind !== 'habit') return it
      const today = dateStr(Date.now())
      if (it.history.includes(today)) return it
      // 计算 streak
      const yesterday = dateStr(Date.now() - 86400000)
      const newStreak = it.history.includes(yesterday) || it.lastCheckin && dateStr(it.lastCheckin) === yesterday
        ? it.streak + 1
        : 1
      return { ...it, history: [...it.history, today].slice(-60), streak: newStreak, lastCheckin: Date.now(), updatedAt: Date.now() } as HabitItem
    }))
  }, [])

  const uncheckHabit = useCallback((id: string) => {
    setItems((prev) => prev.map((it) => {
      if (it.id !== id || it.kind !== 'habit') return it
      const today = dateStr(Date.now())
      if (!it.history.includes(today)) return it
      return { ...it, history: it.history.filter((d) => d !== today), streak: Math.max(0, it.streak - 1), updatedAt: Date.now() } as HabitItem
    }))
  }, [])

  // 提交今日反思
  const submitReflection = useCallback(() => {
    if (!reflectionText.trim()) return
    const item: ReflectionItem = {
      id: uid(),
      kind: 'reflection',
      title: reflectionText.trim().slice(0, 60),
      note: reflectionText.trim(),
      mood: reflectionMood,
      date: Date.now(),
      color: COLOR_THEMES[reflections.length % COLOR_THEMES.length].primary,
      icon: 'sparkles',
      createdAt: Date.now(),
      updatedAt: Date.now(),
    }
    setItems((prev) => [item, ...prev])
    setReflectionText('')
  }, [reflectionText, reflectionMood, reflections.length])

  return (
    <div className="tc-root">
      <header className="tc-header">
        <div className="tc-header-left">
          <div className="tc-brand">
            <Target size={18} />
            <span>TimeCapsule</span>
            <span className="tc-brand-sub">时间胶囊</span>
          </div>
        </div>
        <div className="tc-stats">
          <div className="tc-stat">
            <span className="tc-stat-num">{stats.avgProgress}</span>
            <span className="tc-stat-label">目标完成度</span>
          </div>
          <div className="tc-stat">
            <span className="tc-stat-num">{todayCheckedHabits}/{habits.length}</span>
            <span className="tc-stat-label">今日打卡</span>
          </div>
          <div className="tc-stat">
            <span className="tc-stat-num">{stats.openTasks}</span>
            <span className="tc-stat-label">待办任务</span>
          </div>
          <div className="tc-stat">
            <span className="tc-stat-num">{stats.achievedMilestones}</span>
            <span className="tc-stat-label">已达成里程碑</span>
          </div>
        </div>
      </header>

      <nav className="tc-tabs">
        {[
          { id: 'overview', label: '总览', icon: Sparkles },
          { id: 'milestones', label: '里程碑', icon: Target, count: milestones.length },
          { id: 'habits', label: '习惯', icon: Flame, count: habits.length },
          { id: 'tasks', label: '任务', icon: CheckCircle2, count: tasks.filter((t) => !t.done).length },
          { id: 'timeline', label: '时间线', icon: Clock, count: items.length },
          { id: 'reflect', label: '反思', icon: BookOpen, count: reflections.length },
        ].map((t) => {
          const Icon = t.icon
          return (
            <button
              key={t.id}
              className={`tc-tab ${activeTab === t.id ? 'tc-tab-active' : ''}`}
              onClick={() => setActiveTab(t.id as typeof activeTab)}
            >
              <Icon size={13} /> {t.label}
              {typeof t.count === 'number' && t.count > 0 && <span className="tc-tab-count">{t.count}</span>}
            </button>
          )
        })}
      </nav>

      <main className="tc-main">
        {activeTab === 'overview' && (
          <div className="tc-overview">
            <div className="tc-hero">
              <div className="tc-hero-bg" />
              <div className="tc-hero-content">
                <div className="tc-hero-quote">
                  <span className="tc-quote-mark">"</span>
                  把人生拆解为可视化的里程碑与每日微习惯，是对抗熵增最朴素的方法。
                </div>
                <div className="tc-hero-attr">— TimeCapsule</div>
              </div>
            </div>

            <section className="tc-section">
              <div className="tc-section-head">
                <h3>进行中的里程碑</h3>
                <button className="tc-btn-ghost" onClick={() => setActiveTab('milestones')}>
                  查看全部 <ChevronRight size={12} />
                </button>
              </div>
              <div className="tc-grid">
                {milestones.filter((m) => m.progress < 100).slice(0, 3).map((m) => (
                  <MilestoneCard key={m.id} m={m} onEdit={() => setEditingItem(m)} onDelete={() => deleteItem(m.id)} onUpdate={(p) => updateItem(m.id, p)} />
                ))}
                {milestones.filter((m) => m.progress < 100).length === 0 && (
                  <div className="tc-empty-small">所有里程碑都已达成，太棒了！</div>
                )}
              </div>
            </section>

            <section className="tc-section">
              <div className="tc-section-head">
                <h3>今日打卡</h3>
                <button className="tc-btn-ghost" onClick={() => setActiveTab('habits')}>
                  管理习惯 <ChevronRight size={12} />
                </button>
              </div>
              <div className="tc-grid tc-grid-habits">
                {habits.map((h) => (
                  <HabitCard
                    key={h.id} h={h}
                    onCheck={() => checkHabit(h.id)}
                    onUncheck={() => uncheckHabit(h.id)}
                    onEdit={() => setEditingItem(h)}
                    onDelete={() => deleteItem(h.id)}
                  />
                ))}
                {habits.length === 0 && (
                  <div className="tc-empty-small">没有习惯，去添加一个吧</div>
                )}
              </div>
            </section>

            <section className="tc-section">
              <div className="tc-section-head">
                <h3>待办任务</h3>
                <button className="tc-btn-ghost" onClick={() => setActiveTab('tasks')}>
                  全部任务 <ChevronRight size={12} />
                </button>
              </div>
              <div className="tc-task-list">
                {tasks.filter((t) => !t.done).slice(0, 5).map((t) => (
                  <TaskRow key={t.id} t={t} onToggle={() => toggleTask(t.id)} onEdit={() => setEditingItem(t)} onDelete={() => deleteItem(t.id)} milestone={milestones.find((m) => m.id === t.milestoneId)} />
                ))}
                {tasks.filter((t) => !t.done).length === 0 && (
                  <div className="tc-empty-small">没有待办任务，享受当下</div>
                )}
              </div>
            </section>
          </div>
        )}

        {activeTab === 'milestones' && (
          <div className="tc-page">
            <div className="tc-page-head">
              <h2>里程碑 ({milestones.length})</h2>
              <button className="tc-btn-primary" onClick={() => createItem('milestone')}>
                <Plus size={14} /> 新里程碑
              </button>
            </div>
            <div className="tc-grid">
              {milestones.map((m) => (
                <MilestoneCard key={m.id} m={m} onEdit={() => setEditingItem(m)} onDelete={() => deleteItem(m.id)} onUpdate={(p) => updateItem(m.id, p)} />
              ))}
            </div>
            {milestones.length === 0 && (
              <div className="tc-empty">
                <Target size={32} />
                <p>还没有里程碑，创建一个长期目标开启你的旅程</p>
                <button className="tc-btn-primary" onClick={() => createItem('milestone')}>
                  <Plus size={14} /> 创建里程碑
                </button>
              </div>
            )}
          </div>
        )}

        {activeTab === 'habits' && (
          <div className="tc-page">
            <div className="tc-page-head">
              <h2>习惯 ({habits.length})</h2>
              <button className="tc-btn-primary" onClick={() => createItem('habit')}>
                <Plus size={14} /> 新习惯
              </button>
            </div>
            <div className="tc-grid tc-grid-habits">
              {habits.map((h) => (
                <HabitCard key={h.id} h={h} onCheck={() => checkHabit(h.id)} onUncheck={() => uncheckHabit(h.id)} onEdit={() => setEditingItem(h)} onDelete={() => deleteItem(h.id)} />
              ))}
            </div>
            {habits.length === 0 && (
              <div className="tc-empty">
                <Flame size={32} />
                <p>添加你的第一个习惯</p>
                <button className="tc-btn-primary" onClick={() => createItem('habit')}>
                  <Plus size={14} /> 新建习惯
                </button>
              </div>
            )}
          </div>
        )}

        {activeTab === 'tasks' && (
          <div className="tc-page">
            <div className="tc-page-head">
              <h2>任务</h2>
              <button className="tc-btn-primary" onClick={() => createItem('task')}>
                <Plus size={14} /> 新任务
              </button>
            </div>
            <div className="tc-task-list">
              {tasks.filter((t) => !t.done).map((t) => (
                <TaskRow key={t.id} t={t} onToggle={() => toggleTask(t.id)} onEdit={() => setEditingItem(t)} onDelete={() => deleteItem(t.id)} milestone={milestones.find((m) => m.id === t.milestoneId)} />
              ))}
            </div>
            {tasks.filter((t) => t.done).length > 0 && (
              <>
                <h3 className="tc-section-divider">已完成 ({tasks.filter((t) => t.done).length})</h3>
                <div className="tc-task-list tc-task-list-done">
                  {tasks.filter((t) => t.done).map((t) => (
                    <TaskRow key={t.id} t={t} onToggle={() => toggleTask(t.id)} onEdit={() => setEditingItem(t)} onDelete={() => deleteItem(t.id)} milestone={milestones.find((m) => m.id === t.milestoneId)} />
                  ))}
                </div>
              </>
            )}
            {tasks.length === 0 && (
              <div className="tc-empty">
                <CheckCircle2 size={32} />
                <p>暂无任务</p>
              </div>
            )}
          </div>
        )}

        {activeTab === 'timeline' && (
          <div className="tc-page">
            <div className="tc-page-head">
              <h2>时间线</h2>
            </div>
            <div className="tc-timeline" ref={timelineRef}>
              {items
                .slice()
                .sort((a, b) => {
                  const aT = a.kind === 'reflection' ? a.date : a.achievedAt || a.updatedAt
                  const bT = b.kind === 'reflection' ? b.date : b.achievedAt || b.updatedAt
                  return bT - aT
                })
                .slice(0, 60)
                .map((it) => (
                  <TimelineEntry key={it.id} item={it} milestone={it.kind === 'task' ? milestones.find((m) => m.id === (it as TaskItem).milestoneId) : undefined} onEdit={() => setEditingItem(it)} onDelete={() => deleteItem(it.id)} />
                ))}
            </div>
          </div>
        )}

        {activeTab === 'reflect' && (
          <div className="tc-page">
            <div className="tc-page-head">
              <h2>每日反思</h2>
            </div>
            <div className="tc-reflect-new">
              <div className="tc-reflect-prompt">
                <Sparkles size={14} /> {REFLECTION_PROMPTS[Math.floor((Date.now() / 86400000) % REFLECTION_PROMPTS.length)]}
              </div>
              <textarea
                className="tc-reflect-textarea"
                value={reflectionText}
                onChange={(e) => setReflectionText(e.target.value)}
                placeholder="今天的所思所感…"
                rows={4}
              />
              <div className="tc-reflect-meta">
                <div className="tc-mood-row">
                  <span>心情</span>
                  {[1, 2, 3, 4, 5].map((m) => (
                    <button
                      key={m}
                      className={`tc-mood ${reflectionMood === m ? 'tc-mood-active' : ''}`}
                      onClick={() => setReflectionMood(m as 1 | 2 | 3 | 4 | 5)}
                      title={['糟糕', '低落', '一般', '不错', '超棒'][m - 1]}
                    >
                      {['😞', '😕', '😐', '🙂', '🤩'][m - 1]}
                    </button>
                  ))}
                </div>
                <button className="tc-btn-primary" onClick={submitReflection} disabled={!reflectionText.trim()}>
                  <Save size={14} /> 保存
                </button>
              </div>
            </div>

            <div className="tc-reflections">
              {reflections.slice(0, 30).map((r) => (
                <div key={r.id} className="tc-reflection-card">
                  <div className="tc-reflection-head">
                    <span className="tc-reflection-date">{new Date(r.date).toLocaleDateString('zh-CN', { month: 'long', day: 'numeric', weekday: 'short' })}</span>
                    <span className="tc-reflection-mood">{['😞', '😕', '😐', '🙂', '🤩'][r.mood - 1]}</span>
                    <button className="tc-icon-btn" onClick={() => deleteItem(r.id)}>
                      <Trash2 size={11} />
                    </button>
                  </div>
                  <div className="tc-reflection-title">{r.title}</div>
                  {r.note && r.note.length > r.title.length && (
                    <div className="tc-reflection-note">{r.note}</div>
                  )}
                </div>
              ))}
            </div>
            {reflections.length === 0 && todayReflections.length === 0 && (
              <div className="tc-empty">
                <BookOpen size={32} />
                <p>开始记录你的每日反思</p>
              </div>
            )}
          </div>
        )}
      </main>

      {editingItem && (
        <ItemEditor
          item={editingItem}
          milestones={milestones}
          onSave={(patch) => {
            updateItem(editingItem.id, patch)
            setEditingItem(null)
          }}
          onCancel={() => setEditingItem(null)}
        />
      )}

      <style>{STYLES}</style>
    </div>
  )
}

function MilestoneCard({ m, onEdit, onDelete, onUpdate }: { m: MilestoneItem; onEdit: () => void; onDelete: () => void; onUpdate: (p: Partial<MilestoneItem>) => void }) {
  const cat = CATEGORIES.find((c) => c.id === m.category)
  const due = m.targetDate ? daysBetween(Date.now(), m.targetDate) : null
  return (
    <div className="tc-milestone-card" style={{ borderLeft: `3px solid ${m.color}` }}>
      <div className="tc-card-head">
        <div className="tc-card-icon" style={{ background: `${m.color}22`, color: m.color }}>
          <ItemIcon name={m.icon} size={16} />
        </div>
        <div className="tc-card-title-row">
          <h4>{m.title}</h4>
          {m.starred && <Star size={12} className="tc-star-on" fill="currentColor" />}
        </div>
        <div className="tc-card-actions">
          <button className="tc-icon-btn" onClick={onEdit}><Edit3 size={11} /></button>
          <button className="tc-icon-btn" onClick={onDelete}><Trash2 size={11} /></button>
        </div>
      </div>
      {m.note && <div className="tc-card-note">{m.note}</div>}
      <div className="tc-card-meta">
        {cat && (
          <span className="tc-card-tag" style={{ background: `${cat.color}22`, color: cat.color }}>
            {cat.label}
          </span>
        )}
        {due !== null && (
          <span className={`tc-card-tag ${due < 0 ? 'tc-card-tag-warn' : due < 7 ? 'tc-card-tag-soon' : ''}`}>
            <Clock size={10} /> {due >= 0 ? `${due} 天后` : `已过 ${-due} 天`}
          </span>
        )}
      </div>
      <div className="tc-progress">
        <div className="tc-progress-bar" style={{ width: `${m.progress}%`, background: `linear-gradient(90deg, ${m.color}, ${m.color}cc)` }} />
        <span className="tc-progress-text">{m.progress}%</span>
      </div>
      <input
        type="range" min={0} max={100} value={m.progress}
        onChange={(e) => onUpdate({ progress: parseInt(e.target.value) })}
        className="tc-progress-input"
      />
    </div>
  )
}

function HabitCard({ h, onCheck, onUncheck, onEdit, onDelete }: { h: HabitItem; onCheck: () => void; onUncheck: () => void; onEdit: () => void; onDelete: () => void }) {
  const today = dateStr(Date.now())
  const checkedToday = h.history.includes(today)
  // 最近 7 天
  const last7 = Array.from({ length: 7 }, (_, i) => {
    const d = new Date(Date.now() - i * 86400000)
    const ds = dateStr(d)
    return { date: ds, day: d.getDay(), done: h.history.includes(ds) }
  }).reverse()
  return (
    <div className="tc-habit-card" style={{ borderLeft: `3px solid ${h.color}` }}>
      <div className="tc-card-head">
        <div className="tc-card-icon" style={{ background: `${h.color}22`, color: h.color }}>
          <ItemIcon name={h.icon} size={16} />
        </div>
        <div className="tc-card-title-row">
          <h4>{h.title}</h4>
          <span className="tc-habit-freq">{h.frequency === 'daily' ? '每日' : `每周 ${h.target} 次`}</span>
        </div>
        <div className="tc-card-actions">
          <button className="tc-icon-btn" onClick={onEdit}><Edit3 size={11} /></button>
          <button className="tc-icon-btn" onClick={onDelete}><Trash2 size={11} /></button>
        </div>
      </div>
      <div className="tc-streak">
        <Flame size={14} className={h.streak > 0 ? 'tc-flame-on' : ''} />
        <span className="tc-streak-num">{h.streak}</span>
        <span className="tc-streak-label">连续打卡</span>
      </div>
      <div className="tc-week">
        {last7.map((d) => (
          <div key={d.date} className={`tc-day ${d.done ? 'tc-day-done' : ''}`} title={d.date}>
            {['日', '一', '二', '三', '四', '五', '六'][d.day]}
          </div>
        ))}
      </div>
      <button
        className={`tc-check-btn ${checkedToday ? 'tc-check-btn-done' : ''}`}
        onClick={checkedToday ? onUncheck : onCheck}
      >
        {checkedToday ? <><CheckCircle2 size={14} /> 今日已打卡</> : <><Circle size={14} /> 打卡</>}
      </button>
    </div>
  )
}

function TaskRow({ t, onToggle, onEdit, onDelete, milestone }: { t: TaskItem; onToggle: () => void; onEdit: () => void; onDelete: () => void; milestone?: MilestoneItem }) {
  const priorityColor = { low: '#10b981', med: '#f59e0b', high: '#ef4444' }[t.priority]
  return (
    <div className={`tc-task ${t.done ? 'tc-task-done' : ''}`}>
      <button className="tc-task-check" onClick={onToggle}>
        {t.done ? <CheckCircle2 size={18} className="tc-task-checked" /> : <Circle size={18} />}
      </button>
      <div className="tc-task-main">
        <div className="tc-task-title">{t.title}</div>
        <div className="tc-task-meta">
          <span className="tc-priority" style={{ background: `${priorityColor}22`, color: priorityColor }}>
            {t.priority === 'high' ? '高' : t.priority === 'med' ? '中' : '低'}
          </span>
          {milestone && (
            <span className="tc-task-milestone" style={{ color: milestone.color }}>
              <Target size={10} /> {milestone.title}
            </span>
          )}
          {t.dueDate && (
            <span className="tc-task-due">
              <Calendar size={10} /> {formatRelative(t.dueDate)}
            </span>
          )}
        </div>
      </div>
      <div className="tc-task-actions">
        <button className="tc-icon-btn" onClick={onEdit}><Edit3 size={11} /></button>
        <button className="tc-icon-btn" onClick={onDelete}><Trash2 size={11} /></button>
      </div>
    </div>
  )
}

function TimelineEntry({ item, milestone, onEdit, onDelete }: { item: AnyItem; milestone?: MilestoneItem; onEdit: () => void; onDelete: () => void }) {
  const ts = item.kind === 'reflection' ? item.date : item.achievedAt || item.updatedAt
  const kindLabel = (() => {
    if (item.kind === 'milestone') return '里程碑'
    if (item.kind === 'task') return item.done ? '任务完成' : '任务'
    if (item.kind === 'habit') return '习惯打卡'
    return '反思'
  })()
  return (
    <div className="tc-timeline-entry">
      <div className="tc-timeline-dot" style={{ background: item.color }} />
      <div className="tc-timeline-card" style={{ borderLeft: `3px solid ${item.color}` }}>
        <div className="tc-timeline-head">
          <span className="tc-timeline-kind" style={{ background: `${item.color}22`, color: item.color }}>{kindLabel}</span>
          <span className="tc-timeline-time">{formatRelative(ts)}</span>
          <div className="tc-card-actions">
            <button className="tc-icon-btn" onClick={onEdit}><Edit3 size={10} /></button>
            <button className="tc-icon-btn" onClick={onDelete}><Trash2 size={10} /></button>
          </div>
        </div>
        <div className="tc-timeline-title">{item.title}</div>
        {item.note && item.note !== item.title && <div className="tc-timeline-note">{item.note}</div>}
        {milestone && (
          <div className="tc-timeline-link">
            <ChevronRight size={10} /> 归属里程碑: <strong>{milestone.title}</strong>
          </div>
        )}
      </div>
    </div>
  )
}

function ItemEditor({ item, milestones, onSave, onCancel }: { item: AnyItem; milestones: MilestoneItem[]; onSave: (p: Partial<AnyItem>) => void; onCancel: () => void }) {
  const [draft, setDraft] = useState<AnyItem>(item)
  useEffect(() => setDraft(item), [item.id])
  // 类型 narrow 辅助：将 draft 视为当前 kind 的具体类型
  const updateDraft = useCallback(<K extends ItemKind>(kind: K, patch: Partial<Extract<AnyItem, { kind: K }>>) => {
    setDraft((prev) => ({ ...prev, ...patch } as AnyItem))
    void kind
  }, [])
  return (
    <div className="tc-modal-mask" onClick={onCancel}>
      <div className="tc-modal" onClick={(e) => e.stopPropagation()}>
        <div className="tc-modal-head">
          <h3>编辑 · {item.kind === 'milestone' ? '里程碑' : item.kind === 'task' ? '任务' : item.kind === 'habit' ? '习惯' : '反思'}</h3>
          <button className="tc-icon-btn" onClick={onCancel}><X size={14} /></button>
        </div>
        <div className="tc-modal-body">
          <label className="tc-field">
            <span>标题</span>
            <input value={draft.title} onChange={(e) => setDraft({ ...draft, title: e.target.value })} />
          </label>
          <label className="tc-field">
            <span>备注</span>
            <textarea value={draft.note || ''} rows={3} onChange={(e) => setDraft({ ...draft, note: e.target.value })} />
          </label>
          {item.kind === 'milestone' && (() => {
            const m = draft as MilestoneItem
            return (
              <>
                <label className="tc-field">
                  <span>分类</span>
                  <select
                    value={m.category}
                    onChange={(e) => updateDraft('milestone', { category: e.target.value })}
                  >
                    {CATEGORIES.map((c) => <option key={c.id} value={c.id}>{c.label}</option>)}
                  </select>
                </label>
                <label className="tc-field">
                  <span>目标日期</span>
                  <input
                    type="date"
                    value={m.targetDate ? new Date(m.targetDate).toISOString().slice(0, 10) : ''}
                    onChange={(e) => updateDraft('milestone', { targetDate: e.target.value ? new Date(e.target.value).getTime() : undefined })}
                  />
                </label>
                <label className="tc-field">
                  <span>进度 {m.progress}%</span>
                  <input
                    type="range" min={0} max={100}
                    value={m.progress}
                    onChange={(e) => updateDraft('milestone', { progress: parseInt(e.target.value) })}
                  />
                </label>
              </>
            )
          })()}
          {item.kind === 'task' && (() => {
            const t = draft as TaskItem
            return (
              <>
                <label className="tc-field">
                  <span>优先级</span>
                  <select
                    value={t.priority}
                    onChange={(e) => updateDraft('task', { priority: e.target.value as 'low' | 'med' | 'high' })}
                  >
                    <option value="low">低</option>
                    <option value="med">中</option>
                    <option value="high">高</option>
                  </select>
                </label>
                <label className="tc-field">
                  <span>截止日期</span>
                  <input
                    type="date"
                    value={t.dueDate ? new Date(t.dueDate).toISOString().slice(0, 10) : ''}
                    onChange={(e) => updateDraft('task', { dueDate: e.target.value ? new Date(e.target.value).getTime() : undefined })}
                  />
                </label>
                <label className="tc-field">
                  <span>关联里程碑</span>
                  <select
                    value={t.milestoneId || ''}
                    onChange={(e) => updateDraft('task', { milestoneId: e.target.value || undefined })}
                  >
                    <option value="">无</option>
                    {milestones.map((m) => <option key={m.id} value={m.id}>{m.title}</option>)}
                  </select>
                </label>
              </>
            )
          })()}
          {item.kind === 'habit' && (() => {
            const h = draft as HabitItem
            return (
              <>
                <label className="tc-field">
                  <span>频率</span>
                  <select
                    value={h.frequency}
                    onChange={(e) => updateDraft('habit', { frequency: e.target.value as 'daily' | 'weekly' })}
                  >
                    <option value="daily">每日</option>
                    <option value="weekly">每周</option>
                  </select>
                </label>
                <label className="tc-field">
                  <span>每周目标次数</span>
                  <input
                    type="number" min={1} max={7}
                    value={h.target}
                    onChange={(e) => updateDraft('habit', { target: parseInt(e.target.value) || 1 })}
                  />
                </label>
              </>
            )
          })()}
          <label className="tc-field">
            <span>颜色</span>
            <div className="tc-color-row">
              {COLOR_THEMES.map((c) => (
                <button
                  key={c.name + c.primary}
                  className={`tc-color-dot ${draft.color === c.primary ? 'tc-color-dot-active' : ''}`}
                  style={{ background: c.primary }}
                  onClick={() => setDraft({ ...draft, color: c.primary })}
                />
              ))}
            </div>
          </label>
        </div>
        <div className="tc-modal-foot">
          <button className="tc-btn-ghost" onClick={onCancel}>取消</button>
          <button className="tc-btn-primary" onClick={() => onSave(draft)}><Save size={13} /> 保存</button>
        </div>
      </div>
    </div>
  )
}

const STYLES = `
.tc-root {
  display: flex; flex-direction: column; height: 100%;
  background: linear-gradient(180deg, #0a0a14 0%, #0d0d1a 100%);
  color: #e2e8f0;
  font-family: 'Plus Jakarta Sans', 'Noto Sans SC', system-ui, sans-serif;
  font-size: 14px; overflow: hidden;
  position: relative;
}
.tc-root * { box-sizing: border-box; }
.tc-header {
  display: flex; align-items: center; justify-content: space-between;
  padding: 14px 20px;
  border-bottom: 1px solid rgba(255,255,255,0.06);
  background: rgba(10, 10, 18, 0.5);
  backdrop-filter: blur(8px);
}
.tc-brand {
  display: flex; align-items: center; gap: 8px;
  font-family: 'Fraunces', serif; font-weight: 700; font-size: 17px;
  color: #fcd34d; letter-spacing: -0.01em;
}
.tc-brand-sub {
  font-family: 'JetBrains Mono', monospace; font-size: 10px; color: #64748b;
  padding: 2px 6px; background: rgba(255,255,255,0.04); border-radius: 4px;
  font-weight: 500;
}
.tc-stats { display: flex; gap: 12px; }
.tc-stat {
  display: flex; flex-direction: column; align-items: center;
  padding: 6px 14px; border-radius: 8px;
  background: rgba(255,255,255,0.03);
  border: 1px solid rgba(255,255,255,0.05);
  min-width: 90px;
}
.tc-stat-num { font-size: 18px; font-weight: 700; color: #fde68a; font-family: 'JetBrains Mono', monospace; }
.tc-stat-label { font-size: 10px; color: #64748b; }
.tc-tabs {
  display: flex; gap: 4px; padding: 10px 20px;
  border-bottom: 1px solid rgba(255,255,255,0.05);
  overflow-x: auto;
}
.tc-tab {
  display: inline-flex; align-items: center; gap: 5px;
  padding: 6px 12px; border-radius: 7px; cursor: pointer;
  background: transparent; border: none;
  color: #94a3b8; font-size: 12px; font-family: inherit;
  font-weight: 500; transition: all 0.15s; white-space: nowrap;
}
.tc-tab:hover { color: #fde68a; background: rgba(255,255,255,0.04); }
.tc-tab-active {
  background: linear-gradient(135deg, rgba(251, 191, 36, 0.18) 0%, rgba(245, 158, 11, 0.08) 100%);
  color: #fde68a;
}
.tc-tab-count {
  padding: 0 5px; font-size: 10px; border-radius: 3px;
  background: rgba(255,255,255,0.1); color: #cbd5e1;
  font-family: 'JetBrains Mono', monospace;
}
.tc-main { flex: 1; overflow-y: auto; padding: 18px 20px; }
.tc-main::-webkit-scrollbar { width: 6px; }
.tc-main::-webkit-scrollbar-thumb { background: rgba(255,255,255,0.08); border-radius: 3px; }
.tc-overview, .tc-page { display: flex; flex-direction: column; gap: 22px; }
.tc-hero {
  position: relative; overflow: hidden;
  padding: 32px 28px; border-radius: 12px;
  background: linear-gradient(135deg, rgba(245, 158, 11, 0.12) 0%, rgba(139, 92, 246, 0.08) 100%);
  border: 1px solid rgba(251, 191, 36, 0.2);
}
.tc-hero-bg {
  position: absolute; inset: 0;
  background: radial-gradient(circle at 80% 20%, rgba(251, 191, 36, 0.15) 0%, transparent 50%);
  pointer-events: none;
}
.tc-hero-content { position: relative; }
.tc-hero-quote {
  font-family: 'Fraunces', serif; font-size: 20px; font-weight: 500;
  color: #fde68a; line-height: 1.5; font-style: italic;
}
.tc-quote-mark { font-size: 36px; color: #fbbf24; vertical-align: -8px; margin-right: 4px; opacity: 0.5; }
.tc-hero-attr { margin-top: 10px; font-size: 12px; color: #94a3b8; }
.tc-section-head {
  display: flex; align-items: center; justify-content: space-between;
  margin-bottom: 10px;
}
.tc-section-head h3 { font-size: 14px; font-weight: 600; color: #cbd5e1; }
.tc-section { display: flex; flex-direction: column; }
.tc-page-head {
  display: flex; align-items: center; justify-content: space-between;
  padding-bottom: 8px; border-bottom: 1px solid rgba(255,255,255,0.05);
}
.tc-page-head h2 { font-size: 18px; font-weight: 600; color: #fde68a; }
.tc-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(280px, 1fr)); gap: 10px; }
.tc-grid-habits { grid-template-columns: repeat(auto-fill, minmax(240px, 1fr)); }
.tc-milestone-card, .tc-habit-card {
  background: rgba(255,255,255,0.03);
  border: 1px solid rgba(255,255,255,0.06);
  border-radius: 10px; padding: 14px 16px;
  display: flex; flex-direction: column; gap: 8px;
  transition: all 0.15s;
}
.tc-milestone-card:hover, .tc-habit-card:hover { background: rgba(255,255,255,0.05); transform: translateY(-1px); }
.tc-card-head { display: flex; align-items: flex-start; gap: 10px; }
.tc-card-icon {
  display: inline-flex; align-items: center; justify-content: center;
  width: 30px; height: 30px; border-radius: 8px; flex-shrink: 0;
}
.tc-card-title-row { flex: 1; min-width: 0; display: flex; align-items: center; gap: 6px; flex-wrap: wrap; }
.tc-card-title-row h4 { font-size: 13.5px; font-weight: 600; color: #f1f5f9; margin: 0; }
.tc-card-actions { display: flex; gap: 2px; opacity: 0; transition: opacity 0.15s; }
.tc-milestone-card:hover .tc-card-actions, .tc-habit-card:hover .tc-card-actions { opacity: 1; }
.tc-icon-btn {
  display: inline-flex; align-items: center; justify-content: center;
  background: transparent; border: none; cursor: pointer;
  color: #64748b; padding: 3px; border-radius: 4px;
  transition: all 0.15s;
}
.tc-icon-btn:hover { color: #fbbf24; background: rgba(255,255,255,0.05); }
.tc-card-note { font-size: 12px; color: #94a3b8; line-height: 1.5; }
.tc-card-meta { display: flex; gap: 5px; flex-wrap: wrap; }
.tc-card-tag {
  display: inline-flex; align-items: center; gap: 3px;
  padding: 2px 7px; border-radius: 3px;
  font-size: 10.5px; font-weight: 500;
}
.tc-card-tag-warn { background: rgba(239, 68, 68, 0.15); color: #fca5a5; }
.tc-card-tag-soon { background: rgba(245, 158, 11, 0.15); color: #fde68a; }
.tc-progress {
  position: relative; height: 18px; border-radius: 5px;
  background: rgba(255,255,255,0.05);
  overflow: hidden; display: flex; align-items: center;
}
.tc-progress-bar {
  position: absolute; left: 0; top: 0; bottom: 0;
  transition: width 0.3s;
  border-radius: 5px;
}
.tc-progress-text {
  position: relative; padding-left: 8px;
  font-size: 10.5px; font-weight: 700; color: #1a1a2e;
  font-family: 'JetBrains Mono', monospace;
  mix-blend-mode: screen;
  filter: drop-shadow(0 0 1px rgba(0,0,0,0.5));
}
.tc-progress-input {
  width: 100%; accent-color: #fbbf24; height: 4px;
}
.tc-habit-freq { font-size: 10.5px; color: #64748b; }
.tc-streak {
  display: flex; align-items: center; gap: 6px;
  padding: 6px 10px; border-radius: 6px;
  background: rgba(255,255,255,0.03);
  border: 1px solid rgba(255,255,255,0.05);
}
.tc-flame-on { color: #f97316; }
.tc-streak-num { font-size: 18px; font-weight: 700; color: #fde68a; font-family: 'JetBrains Mono', monospace; }
.tc-streak-label { font-size: 11px; color: #64748b; }
.tc-week { display: flex; gap: 3px; justify-content: space-between; }
.tc-day {
  flex: 1; text-align: center; padding: 4px 0;
  font-size: 10px; color: #64748b;
  background: rgba(255,255,255,0.03); border-radius: 4px;
  font-family: 'JetBrains Mono', monospace;
}
.tc-day-done {
  background: linear-gradient(135deg, rgba(16, 185, 129, 0.2) 0%, rgba(5, 150, 105, 0.15) 100%);
  color: #6ee7b7; font-weight: 700;
}
.tc-check-btn {
  display: flex; align-items: center; justify-content: center; gap: 6px;
  padding: 8px; border-radius: 7px; cursor: pointer;
  background: rgba(255,255,255,0.04);
  border: 1px solid rgba(255,255,255,0.08);
  color: #cbd5e1; font-size: 12px; font-family: inherit; font-weight: 500;
  transition: all 0.15s;
}
.tc-check-btn:hover { background: rgba(251, 191, 36, 0.1); color: #fde68a; border-color: rgba(251, 191, 36, 0.3); }
.tc-check-btn-done { background: linear-gradient(135deg, rgba(16, 185, 129, 0.2) 0%, rgba(5, 150, 105, 0.15) 100%); color: #6ee7b7; border-color: rgba(16, 185, 129, 0.3); }
.tc-task-list { display: flex; flex-direction: column; gap: 6px; }
.tc-task {
  display: flex; align-items: center; gap: 10px;
  padding: 10px 14px; border-radius: 8px;
  background: rgba(255,255,255,0.03);
  border: 1px solid rgba(255,255,255,0.05);
  transition: all 0.15s;
}
.tc-task:hover { background: rgba(255,255,255,0.05); }
.tc-task-done { opacity: 0.6; }
.tc-task-done .tc-task-title { text-decoration: line-through; color: #94a3b8; }
.tc-task-check {
  background: transparent; border: none; cursor: pointer;
  color: #475569; padding: 0; display: flex; transition: color 0.15s;
}
.tc-task-check:hover { color: #fde68a; }
.tc-task-checked { color: #34d399; }
.tc-task-main { flex: 1; min-width: 0; }
.tc-task-title { font-size: 13px; color: #f1f5f9; font-weight: 500; }
.tc-task-meta { display: flex; gap: 8px; margin-top: 3px; font-size: 10.5px; }
.tc-priority {
  display: inline-block; padding: 1px 5px; border-radius: 3px;
  font-size: 10px; font-weight: 600;
}
.tc-task-milestone, .tc-task-due { display: inline-flex; align-items: center; gap: 3px; color: #64748b; }
.tc-task-actions { display: flex; gap: 2px; opacity: 0; transition: opacity 0.15s; }
.tc-task:hover .tc-task-actions { opacity: 1; }
.tc-task-list-done .tc-task { opacity: 0.5; }
.tc-section-divider { font-size: 12px; color: #64748b; text-transform: uppercase; letter-spacing: 0.08em; margin-top: 8px; font-weight: 600; }
.tc-timeline { position: relative; padding-left: 24px; }
.tc-timeline::before {
  content: ''; position: absolute; left: 6px; top: 8px; bottom: 8px; width: 2px;
  background: linear-gradient(180deg, rgba(251, 191, 36, 0.4), rgba(139, 92, 246, 0.2), transparent);
}
.tc-timeline-entry { position: relative; margin-bottom: 12px; }
.tc-timeline-dot {
  position: absolute; left: -22px; top: 14px;
  width: 12px; height: 12px; border-radius: 50%;
  border: 2px solid #0a0a14; box-shadow: 0 0 0 1px rgba(255,255,255,0.05);
}
.tc-timeline-card {
  background: rgba(255,255,255,0.03);
  border: 1px solid rgba(255,255,255,0.05);
  border-radius: 8px; padding: 10px 14px;
}
.tc-timeline-head {
  display: flex; align-items: center; gap: 8px;
  margin-bottom: 4px;
}
.tc-timeline-kind {
  padding: 1px 7px; border-radius: 3px;
  font-size: 10px; font-weight: 600;
}
.tc-timeline-time { font-size: 10.5px; color: #64748b; font-family: 'JetBrains Mono', monospace; flex: 1; }
.tc-timeline-title { font-size: 13px; color: #f1f5f9; font-weight: 500; }
.tc-timeline-note { font-size: 12px; color: #94a3b8; margin-top: 4px; line-height: 1.5; }
.tc-timeline-link { font-size: 11px; color: #64748b; margin-top: 4px; display: flex; align-items: center; gap: 3px; }
.tc-timeline-link strong { color: #cbd5e1; font-weight: 500; }
.tc-reflect-new {
  background: rgba(255,255,255,0.03);
  border: 1px solid rgba(255,255,255,0.08);
  border-radius: 10px; padding: 14px 16px;
  display: flex; flex-direction: column; gap: 10px;
}
.tc-reflect-prompt {
  display: flex; align-items: center; gap: 6px;
  font-size: 12px; color: #fde68a; font-style: italic;
}
.tc-reflect-textarea {
  width: 100%; min-height: 80px;
  background: rgba(0,0,0,0.3); border: 1px solid rgba(255,255,255,0.08);
  border-radius: 8px; padding: 10px 12px;
  color: #f1f5f9; font-size: 13px; line-height: 1.6;
  font-family: inherit; outline: none; resize: vertical;
}
.tc-reflect-textarea:focus { border-color: rgba(251, 191, 36, 0.5); }
.tc-reflect-meta { display: flex; align-items: center; justify-content: space-between; }
.tc-mood-row { display: flex; align-items: center; gap: 6px; font-size: 11px; color: #94a3b8; }
.tc-mood {
  background: transparent; border: 1px solid rgba(255,255,255,0.08);
  padding: 4px 8px; border-radius: 5px; cursor: pointer; font-size: 16px;
  transition: all 0.15s;
}
.tc-mood:hover { background: rgba(255,255,255,0.05); transform: scale(1.1); }
.tc-mood-active { background: rgba(251, 191, 36, 0.15); border-color: rgba(251, 191, 36, 0.5); }
.tc-reflections { display: flex; flex-direction: column; gap: 8px; }
.tc-reflection-card {
  background: rgba(255,255,255,0.03);
  border: 1px solid rgba(255,255,255,0.06);
  border-radius: 8px; padding: 10px 14px;
}
.tc-reflection-head { display: flex; align-items: center; gap: 8px; margin-bottom: 4px; }
.tc-reflection-date { font-size: 11px; color: #94a3b8; font-weight: 600; flex: 1; }
.tc-reflection-mood { font-size: 18px; }
.tc-reflection-title { font-size: 13px; color: #f1f5f9; font-weight: 500; }
.tc-reflection-note { font-size: 12px; color: #cbd5e1; margin-top: 4px; line-height: 1.6; white-space: pre-wrap; }
.tc-btn-primary {
  display: inline-flex; align-items: center; gap: 6px;
  padding: 7px 14px; border-radius: 7px; cursor: pointer;
  background: linear-gradient(135deg, #f59e0b 0%, #d97706 100%);
  color: #1a1a2e; border: none; font-size: 12px;
  font-family: inherit; font-weight: 600;
  box-shadow: 0 3px 10px rgba(245, 158, 11, 0.2);
  transition: all 0.2s;
}
.tc-btn-primary:hover:not(:disabled) { transform: translateY(-1px); }
.tc-btn-primary:disabled { opacity: 0.5; cursor: not-allowed; }
.tc-btn-ghost {
  display: inline-flex; align-items: center; gap: 4px;
  padding: 5px 10px; border-radius: 6px; cursor: pointer;
  background: transparent; color: #94a3b8;
  border: 1px solid rgba(255,255,255,0.08);
  font-size: 11px; font-family: inherit; font-weight: 500;
  transition: all 0.15s;
}
.tc-btn-ghost:hover { color: #fde68a; border-color: rgba(251, 191, 36, 0.4); }
.tc-empty {
  display: flex; flex-direction: column; align-items: center; justify-content: center;
  padding: 60px 20px; color: #64748b; gap: 12px;
}
.tc-empty p { font-size: 13px; }
.tc-empty-small {
  grid-column: 1 / -1;
  padding: 30px; text-align: center; color: #64748b; font-size: 12.5px;
  border: 1px dashed rgba(255,255,255,0.1); border-radius: 8px;
}
.tc-modal-mask {
  position: fixed; inset: 0; z-index: 1000;
  background: rgba(0,0,0,0.7); backdrop-filter: blur(4px);
  display: flex; align-items: center; justify-content: center;
  padding: 20px;
  animation: tcFadeIn 0.2s;
}
@keyframes tcFadeIn { from { opacity: 0; } to { opacity: 1; } }
.tc-modal {
  width: 100%; max-width: 480px;
  background: rgba(15, 15, 25, 0.98);
  border: 1px solid rgba(255,255,255,0.1);
  border-radius: 12px;
  box-shadow: 0 20px 60px rgba(0,0,0,0.6);
  display: flex; flex-direction: column;
  max-height: 90vh; overflow: hidden;
}
.tc-modal-head {
  display: flex; align-items: center; justify-content: space-between;
  padding: 14px 18px; border-bottom: 1px solid rgba(255,255,255,0.05);
}
.tc-modal-head h3 { font-size: 14px; font-weight: 600; color: #fde68a; }
.tc-modal-body {
  flex: 1; overflow-y: auto; padding: 16px 18px;
  display: flex; flex-direction: column; gap: 12px;
}
.tc-field { display: flex; flex-direction: column; gap: 4px; font-size: 11px; color: #94a3b8; font-weight: 500; }
.tc-field input, .tc-field select, .tc-field textarea {
  background: rgba(0,0,0,0.3); border: 1px solid rgba(255,255,255,0.08);
  color: #e2e8f0; padding: 7px 10px; border-radius: 6px;
  font-size: 13px; font-family: inherit; outline: none;
  transition: border-color 0.15s;
}
.tc-field input:focus, .tc-field select:focus, .tc-field textarea:focus { border-color: rgba(251, 191, 36, 0.5); }
.tc-field input[type="range"] { padding: 0; }
.tc-color-row { display: flex; gap: 6px; padding: 4px 0; }
.tc-color-dot {
  width: 22px; height: 22px; border-radius: 50%;
  border: 2px solid transparent; cursor: pointer;
  transition: all 0.15s;
}
.tc-color-dot:hover { transform: scale(1.1); }
.tc-color-dot-active { border-color: white; transform: scale(1.15); box-shadow: 0 0 0 1px rgba(255,255,255,0.2); }
.tc-modal-foot {
  display: flex; gap: 8px; justify-content: flex-end;
  padding: 12px 18px; border-top: 1px solid rgba(255,255,255,0.05);
}
.tc-star-on { color: #fbbf24; }
`
