// PomodoroFocus — 番茄钟 + SomaFM 专注电台 + 会话统计
// 集成真实的 SomaFM 公开流（无需 API Key），支持浏览器原生 Audio API
import { useEffect, useRef, useState, useCallback, memo } from 'react'
import {
  PlayIcon, PauseIcon, RotateCcwIcon,
  BrainIcon, MusicIcon, Volume2Icon, VolumeXIcon,
  PlusIcon, TrashIcon, BarChart3Icon, SparklesIcon
} from '../icons'

// SkipForward 图标（内联 SVG，保持轻量）
const SkipForwardIcon = ({ size = 18 }: { size?: number }) => (
  <svg viewBox="0 0 24 24" width={size} height={size} fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <polygon points="5 4 15 12 5 20 5 4" /><line x1="19" y1="5" x2="19" y2="19" />
  </svg>
)

type Mode = 'focus' | 'short' | 'long'
type RadioStation = { id: string; name: string; url: string; genre: string; color: string }

const DEFAULT_STATIONS: RadioStation[] = [
  { id: 'drift',       name: 'Drift Zone',        url: 'https://ice1.somafm.com/driftzone-128-mp3',      genre: '氛围电子', color: '#7c3aed' },
  { id: 'indie',       name: 'Indie Pop Rocks',  url: 'https://ice1.somafm.com/indiepop-128-mp3',        genre: '独立流行', color: '#ec4899' },
  { id: 'lush',        name: 'Lush',             url: 'https://ice1.somafm.com/lush-128-mp3',            genre: '梦幻流行', color: '#06b6d4' },
  { id: 'defcon',      name: 'DEF CON Radio',    url: 'https://ice1.somafm.com/defcon-128-mp3',          genre: '科技/黑客', color: '#22c55e' },
  { id: 'secretagent', name: 'Secret Agent',     url: 'https://ice1.somafm.com/secretagent-128-mp3',     genre: '黑色电影', color: '#f59e0b' },
  { id: 'fluid',       name: 'Fluid',            url: 'https://ice1.somafm.com/fluid-128-mp3',           genre: 'Chillout', color: '#3b82f6' },
  { id: 'poptron',     name: 'PopTron',          url: 'https://ice1.somafm.com/poptron-128-mp3',         genre: 'Electropop', color: '#f43f5e' },
  { id: 'u80',         name: 'Underground 80s',  url: 'https://ice1.somafm.com/u80s-128-mp3',            genre: '80s 地下', color: '#a855f7' },
]

const DEFAULT_DURATIONS: Record<Mode, number> = {
  focus: 25 * 60,
  short: 5 * 60,
  long: 15 * 60,
}

const MODE_META: Record<Mode, { label: string; icon: string; accent: string }> = {
  focus: { label: '专注时段', icon: 'brain',  accent: '#7c3aed' },
  short: { label: '短休息',   icon: 'coffee', accent: '#22c55e' },
  long:  { label: '长休息',   icon: 'coffee', accent: '#06b6d4' },
}

interface SessionRecord {
  id: string
  mode: Mode
  duration: number
  completedAt: number
  stationId?: string
}

interface TaskItem {
  id: string
  text: string
  done: boolean
  pomodoros: number
}

// ========== 音效提示（Web Audio API，无需外部音频文件） ==========
function playChime(type: 'focus' | 'break' = 'focus') {
  try {
    const AC = (window.AudioContext || (window as any).webkitAudioContext)
    if (!AC) return
    const ctx = new AC()
    const now = ctx.currentTime
    const baseFreq = type === 'focus' ? 880 : 523.25
    ;[0, 0.18, 0.36].forEach((offset, i) => {
      const osc = ctx.createOscillator()
      const gain = ctx.createGain()
      osc.type = 'sine'
      osc.frequency.setValueAtTime(baseFreq * (i === 1 ? 1.25 : i === 2 ? 1.5 : 1), now + offset)
      gain.gain.setValueAtTime(0, now + offset)
      gain.gain.linearRampToValueAtTime(0.12, now + offset + 0.02)
      gain.gain.exponentialRampToValueAtTime(0.0001, now + offset + 0.28)
      osc.connect(gain).connect(ctx.destination)
      osc.start(now + offset)
      osc.stop(now + offset + 0.3)
    })
    setTimeout(() => ctx.close(), 1200)
  } catch {
    /* 静默忽略音频错误 */
  }
}

function formatTime(seconds: number): string {
  const m = Math.floor(seconds / 60).toString().padStart(2, '0')
  const s = Math.floor(seconds % 60).toString().padStart(2, '0')
  return `${m}:${s}`
}

const PomodoroFocus = memo(function PomodoroFocus() {
  const [durations, setDurations] = useState<Record<Mode, number>>(() => {
    try {
      const saved = localStorage.getItem('pf-durations')
      if (saved) return { ...DEFAULT_DURATIONS, ...JSON.parse(saved) }
    } catch { /* ignore */ }
    return DEFAULT_DURATIONS
  })

  const [mode, setMode] = useState<Mode>('focus')
  const [remaining, setRemaining] = useState(durations.focus)
  const [running, setRunning] = useState(false)
  const [completed, setCompleted] = useState(0) // 已完成专注数
  const [autoAdvance, setAutoAdvance] = useState(true)
  const [soundOn, setSoundOn] = useState(true)

  // 电台相关
  const [radioOn, setRadioOn] = useState(false)
  const [currentStation, setCurrentStation] = useState<RadioStation>(DEFAULT_STATIONS[0])
  const [volume, setVolume] = useState(0.6)
  const [muted, setMuted] = useState(false)
  const audioRef = useRef<HTMLAudioElement | null>(null)

  // 任务列表
  const [tasks, setTasks] = useState<TaskItem[]>(() => {
    try {
      const saved = localStorage.getItem('pf-tasks')
      if (saved) return JSON.parse(saved)
    } catch { /* ignore */ }
    return [
      { id: 't1', text: '阅读一章技术文档', done: false, pomodoros: 2 },
      { id: 't2', text: '实现一个小功能', done: false, pomodoros: 3 },
    ]
  })
  const [newTaskText, setNewTaskText] = useState('')
  const [showStats, setShowStats] = useState(false)

  // 会话历史
  const [sessions, setSessions] = useState<SessionRecord[]>(() => {
    try {
      const saved = localStorage.getItem('pf-sessions')
      if (saved) return JSON.parse(saved)
    } catch { /* ignore */ }
    return []
  })

  // ========== 持久化 ==========
  useEffect(() => {
    localStorage.setItem('pf-durations', JSON.stringify(durations))
  }, [durations])
  useEffect(() => {
    localStorage.setItem('pf-tasks', JSON.stringify(tasks))
  }, [tasks])
  useEffect(() => {
    try {
      localStorage.setItem('pf-sessions', JSON.stringify(sessions.slice(-200)))
    } catch { /* ignore quota */ }
  }, [sessions])

  // ========== 计时器核心 ==========
  const intervalRef = useRef<number | null>(null)
  useEffect(() => {
    if (!running) {
      if (intervalRef.current !== null) {
        window.clearInterval(intervalRef.current)
        intervalRef.current = null
      }
      return
    }
    intervalRef.current = window.setInterval(() => {
      setRemaining((r) => {
        if (r <= 1) {
          handleTimerComplete()
          return 0
        }
        return r - 1
      })
    }, 1000)
    return () => {
      if (intervalRef.current !== null) {
        window.clearInterval(intervalRef.current)
        intervalRef.current = null
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [running])

  const handleTimerComplete = useCallback(() => {
    setRunning(false)
    if (soundOn) playChime(mode === 'focus' ? 'break' : 'focus')
    // 记录会话
    setSessions((prev) => [...prev, {
      id: 's-' + Date.now(),
      mode,
      duration: durations[mode],
      completedAt: Date.now(),
      stationId: radioOn ? currentStation.id : undefined,
    }])
    if (mode === 'focus') {
      setCompleted((c) => c + 1)
      // 标记一个任务完成了一个番茄
      setTasks((ts) => {
        const idx = ts.findIndex((t) => !t.done && t.pomodoros > 0)
        if (idx === -1) return ts
        const next = [...ts]
        next[idx] = { ...next[idx], pomodoros: Math.max(0, next[idx].pomodoros - 1), done: next[idx].pomodoros - 1 === 0 }
        return next
      })
      // 每 4 个专注后进入长休息
      const nextCount = completed + 1
      const nextMode: Mode = nextCount % 4 === 0 ? 'long' : 'short'
      if (autoAdvance) {
        const d = durations[nextMode]
        setMode(nextMode)
        setRemaining(d)
        setRunning(true)
      } else {
        setMode(nextMode)
        setRemaining(durations[nextMode])
      }
    } else {
      // 休息结束 → 切回专注
      if (autoAdvance) {
        setMode('focus')
        setRemaining(durations.focus)
        setRunning(true)
      } else {
        setMode('focus')
        setRemaining(durations.focus)
      }
    }
  }, [mode, durations, soundOn, autoAdvance, radioOn, currentStation.id, completed])

  const toggleRunning = () => setRunning((r) => !r)
  const resetTimer = () => {
    setRunning(false)
    setRemaining(durations[mode])
  }
  const switchMode = (m: Mode) => {
    setMode(m)
    setRunning(false)
    setRemaining(durations[m])
  }

  const adjustDuration = (m: Mode, delta: number) => {
    setDurations((d) => {
      const next = Math.max(1, Math.min(180, d[m] + delta))
      const upd = { ...d, [m]: next }
      if (m === mode) setRemaining(next)
      return upd
    })
  }

  // ========== 电台控制 ==========
  useEffect(() => {
    const el = audioRef.current
    if (!el) return
    el.volume = muted ? 0 : volume
  }, [volume, muted])

  useEffect(() => {
    const el = audioRef.current
    if (!el) return
    if (radioOn) {
      el.src = currentStation.url
      el.play().catch(() => setRadioOn(false))
    } else {
      el.pause()
      el.removeAttribute('src')
      el.load()
    }
  }, [radioOn, currentStation])

  // ========== 任务管理 ==========
  const addTask = () => {
    const text = newTaskText.trim()
    if (!text) return
    setTasks((ts) => [...ts, { id: 't-' + Date.now(), text, done: false, pomodoros: 1 }])
    setNewTaskText('')
  }
  const removeTask = (id: string) => setTasks((ts) => ts.filter((t) => t.id !== id))
  const toggleTask = (id: string) => setTasks((ts) => ts.map((t) => t.id === id ? { ...t, done: !t.done } : t))
  const updateTaskPomos = (id: string, delta: number) =>
    setTasks((ts) => ts.map((t) => t.id === id ? { ...t, pomodoros: Math.max(0, t.pomodoros + delta) } : t))

  // ========== 统计 ==========
  const todayStart = new Date()
  todayStart.setHours(0, 0, 0, 0)
  const todaysSessions = sessions.filter((s) => s.completedAt >= todayStart.getTime())
  const todaysFocus = todaysSessions.filter((s) => s.mode === 'focus').length
  const todaysMinutes = todaysSessions
    .filter((s) => s.mode === 'focus')
    .reduce((acc, s) => acc + Math.round(s.duration / 60), 0)
  const last7Days: { date: string; focus: number; minutes: number }[] = []
  for (let i = 6; i >= 0; i--) {
    const d = new Date()
    d.setHours(0, 0, 0, 0)
    d.setDate(d.getDate() - i)
    const next = new Date(d)
    next.setDate(d.getDate() + 1)
    const inDay = sessions.filter((s) => s.completedAt >= d.getTime() && s.completedAt < next.getTime() && s.mode === 'focus')
    last7Days.push({
      date: d.toLocaleDateString('zh-CN', { weekday: 'short' }),
      focus: inDay.length,
      minutes: Math.round(inDay.reduce((acc, s) => acc + s.duration / 60, 0)),
    })
  }
  const maxDailyFocus = Math.max(1, ...last7Days.map((d) => d.focus))

  // ========== 渲染 ==========
  const progress = 1 - remaining / durations[mode]
  const modeMeta = MODE_META[mode]
  const ringR = 120
  const ringC = 2 * Math.PI * ringR

  return (
    <div className="pomodoro-focus" style={styles.root}>
      <audio ref={audioRef} preload="none" crossOrigin="anonymous" />

      {/* 左侧：计时器 */}
      <div style={styles.leftPanel}>
        <div style={styles.modeTabs}>
          {(['focus', 'short', 'long'] as Mode[]).map((m) => (
            <button
              key={m}
              onClick={() => switchMode(m)}
              style={{
                ...styles.modeTab,
                background: mode === m ? MODE_META[m].accent : 'transparent',
                color: mode === m ? '#fff' : '#cbd5e1',
                borderColor: mode === m ? MODE_META[m].accent : 'rgba(148,163,184,0.25)',
                boxShadow: mode === m ? `0 4px 20px ${MODE_META[m].accent}55` : 'none',
              }}
            >
              {MODE_META[m].label}
            </button>
          ))}
        </div>

        <div style={{ position: 'relative', width: 280, height: 280, margin: '10px auto' }}>
          <svg width="280" height="280" style={{ transform: 'rotate(-90deg)' }}>
            <circle cx="140" cy="140" r={ringR} stroke="rgba(255,255,255,0.06)" strokeWidth="10" fill="none" />
            <circle
              cx="140" cy="140" r={ringR}
              stroke={modeMeta.accent}
              strokeWidth="10"
              fill="none"
              strokeLinecap="round"
              strokeDasharray={ringC}
              strokeDashoffset={ringC * (1 - progress)}
              style={{ transition: 'stroke-dashoffset 0.5s linear, stroke 0.4s' }}
            />
          </svg>
          <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
            <div style={{ fontSize: 64, fontWeight: 200, color: '#f1f5f9', fontVariantNumeric: 'tabular-nums', letterSpacing: '-0.04em' }}>
              {formatTime(remaining)}
            </div>
            <div style={{ fontSize: 12, color: '#94a3b8', marginTop: 6, letterSpacing: '0.1em', textTransform: 'uppercase' }}>
              {modeMeta.label}
            </div>
            <div style={{ fontSize: 11, color: '#64748b', marginTop: 2 }}>
              已完成 <span style={{ color: modeMeta.accent, fontWeight: 600 }}>{completed}</span> 个番茄 · 今日 {todaysFocus}
            </div>
          </div>
        </div>

        <div style={styles.controls}>
          <button onClick={resetTimer} style={styles.roundBtn} title="重置">
            <RotateCcwIcon size={18} />
          </button>
          <button
            onClick={toggleRunning}
            style={{
              ...styles.playBtn,
              background: running ? '#ef4444' : modeMeta.accent,
              boxShadow: `0 8px 24px ${running ? '#ef444455' : modeMeta.accent + 'aa'}`,
            }}
          >
            {running ? <PauseIcon size={24} /> : <PlayIcon size={24} />}
          </button>
          <button
            onClick={() => { setRemaining(0); if (!running) setRunning(true) }}
            style={styles.roundBtn}
            title="跳到下一阶段"
          >
            <SkipForwardIcon size={18} />
          </button>
        </div>

        <div style={styles.options}>
          <label style={styles.optionLabel}>
            <input type="checkbox" checked={autoAdvance} onChange={(e) => setAutoAdvance(e.target.checked)} />
            <span>自动进入下一阶段</span>
          </label>
          <label style={styles.optionLabel}>
            <input type="checkbox" checked={soundOn} onChange={(e) => setSoundOn(e.target.checked)} />
            <span>结束提示音</span>
          </label>
        </div>

        <div style={styles.durationAdjuster}>
          <span style={styles.durLabel}>时长（分钟）</span>
          {(['focus', 'short', 'long'] as Mode[]).map((m) => (
            <div key={m} style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <span style={{ width: 40, fontSize: 11, color: '#94a3b8' }}>{MODE_META[m].label.slice(0, 2)}</span>
              <button onClick={() => adjustDuration(m, -1)} style={styles.miniBtn}>-</button>
              <span style={{ minWidth: 32, textAlign: 'center', color: '#e2e8f0', fontWeight: 500 }}>
                {Math.round(durations[m] / 60)}
              </span>
              <button onClick={() => adjustDuration(m, 1)} style={styles.miniBtn}>+</button>
            </div>
          ))}
        </div>
      </div>

      {/* 右侧：电台 + 任务 + 统计 */}
      <div style={styles.rightPanel}>
        {/* 电台卡片 */}
        <div style={styles.card}>
          <div style={styles.cardHeader}>
            <div style={styles.cardTitle}>
              <MusicIcon size={16} />
              <span>SomaFM 专注电台</span>
              <span style={styles.liveTag}>{radioOn ? 'LIVE' : 'OFF'}</span>
            </div>
            <button
              onClick={() => setRadioOn((v) => !v)}
              style={{
                ...styles.radioBtn,
                background: radioOn ? '#ef4444' : '#7c3aed',
                boxShadow: radioOn ? '0 0 20px #ef444466' : '0 0 16px #7c3aed66',
              }}
            >
              {radioOn ? <PauseIcon size={14} /> : <PlayIcon size={14} />}
              <span>{radioOn ? '停止' : '播放'}</span>
            </button>
          </div>

          <div style={styles.nowPlaying}>
            <div style={{ ...styles.stationDot, background: currentStation.color, opacity: radioOn ? 1 : 0.3 }} />
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 14, color: '#f1f5f9', fontWeight: 600 }}>{currentStation.name}</div>
              <div style={{ fontSize: 11, color: '#94a3b8' }}>{currentStation.genre}</div>
            </div>
          </div>

          <div style={styles.stationGrid}>
            {DEFAULT_STATIONS.map((s) => (
              <button
                key={s.id}
                onClick={() => setCurrentStation(s)}
                style={{
                  ...styles.stationChip,
                  background: currentStation.id === s.id ? s.color : 'rgba(148,163,184,0.08)',
                  borderColor: currentStation.id === s.id ? s.color : 'rgba(148,163,184,0.2)',
                  color: currentStation.id === s.id ? '#fff' : '#cbd5e1',
                }}
                title={s.url}
              >
                {s.name}
              </button>
            ))}
          </div>

          <div style={styles.volumeRow}>
            <button onClick={() => setMuted((m) => !m)} style={styles.iconBtn}>
              {muted || volume === 0 ? <VolumeXIcon size={14} /> : <Volume2Icon size={14} />}
            </button>
            <input
              type="range"
              min={0} max={1} step={0.01}
              value={muted ? 0 : volume}
              onChange={(e) => { setVolume(Number(e.target.value)); setMuted(false) }}
              style={{ flex: 1, accentColor: '#7c3aed' }}
            />
            <span style={styles.volumeLabel}>{Math.round((muted ? 0 : volume) * 100)}</span>
          </div>
          <div style={{ fontSize: 10, color: '#475569', marginTop: 6 }}>
            流源: SomaFM.com · 公开 MP3 流，无需认证
          </div>
        </div>

        {/* 任务卡片 */}
        <div style={styles.card}>
          <div style={styles.cardHeader}>
            <div style={styles.cardTitle}>
              <BrainIcon size={16} />
              <span>今日任务</span>
              <span style={{ marginLeft: 'auto', fontSize: 11, color: '#64748b' }}>
                {tasks.filter((t) => !t.done).length} 待办
              </span>
            </div>
          </div>
          <div style={styles.taskInput}>
            <input
              value={newTaskText}
              onChange={(e) => setNewTaskText(e.target.value)}
              onKeyDown={(e) => { if (e.key === 'Enter') addTask() }}
              placeholder="添加一个任务，例如：写完项目 README"
              style={styles.input}
            />
            <button onClick={addTask} style={styles.addBtn}>
              <PlusIcon size={16} />
            </button>
          </div>
          <div style={styles.taskList}>
            {tasks.length === 0 && <div style={styles.emptyState}>还没有任务，开始添加第一个吧</div>}
            {tasks.map((t) => (
              <div key={t.id} style={{ ...styles.taskRow, opacity: t.done ? 0.5 : 1 }}>
                <input
                  type="checkbox"
                  checked={t.done}
                  onChange={() => toggleTask(t.id)}
                  style={{ accentColor: '#7c3aed', marginRight: 10 }}
                />
                <span style={{ flex: 1, fontSize: 13, color: '#e2e8f0', textDecoration: t.done ? 'line-through' : 'none' }}>
                  {t.text}
                </span>
                <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                  <button onClick={() => updateTaskPomos(t.id, -1)} style={styles.miniBtn}>−</button>
                  <span style={{ minWidth: 18, textAlign: 'center', color: '#cbd5e1', fontSize: 12 }}>
                    {t.pomodoros}
                  </span>
                  <button onClick={() => updateTaskPomos(t.id, 1)} style={styles.miniBtn}>+</button>
                  <button onClick={() => removeTask(t.id)} style={{ ...styles.miniBtn, marginLeft: 4 }}>
                    <TrashIcon size={12} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* 统计 */}
        <div style={styles.card}>
          <div style={{ ...styles.cardHeader, cursor: 'pointer' }} onClick={() => setShowStats((v) => !v)}>
            <div style={styles.cardTitle}>
              <BarChart3Icon size={16} />
              <span>专注统计</span>
            </div>
            <span style={{ fontSize: 11, color: '#94a3b8' }}>{showStats ? '收起' : '展开'}</span>
          </div>
          <div style={styles.statsRow}>
            <div style={styles.statChip}>
              <div style={styles.statNum}>{todaysFocus}</div>
              <div style={styles.statLabel}>今日完成</div>
            </div>
            <div style={styles.statChip}>
              <div style={styles.statNum}>{todaysMinutes}</div>
              <div style={styles.statLabel}>专注分钟</div>
            </div>
            <div style={styles.statChip}>
              <div style={styles.statNum}>{completed}</div>
              <div style={styles.statLabel}>总计番茄</div>
            </div>
          </div>
          {showStats && (
            <div style={styles.chart}>
              {last7Days.map((d) => (
                <div key={d.date} style={styles.chartCol}>
                  <div
                    style={{
                      ...styles.chartBar,
                      height: `${(d.focus / maxDailyFocus) * 100}%`,
                      background: d.focus > 0 ? 'linear-gradient(180deg, #a78bfa 0%, #7c3aed 100%)' : 'rgba(148,163,184,0.15)',
                    }}
                    title={`${d.date}: ${d.focus} 个番茄 · ${d.minutes} 分钟`}
                  />
                  <span style={styles.chartLabel}>{d.date}</span>
                </div>
              ))}
            </div>
          )}
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 10, color: '#475569', padding: '0 4px' }}>
          <SparklesIcon size={12} />
          <span>本应用完全在浏览器本地运行 · 数据自动保存到 localStorage</span>
        </div>
      </div>
    </div>
  )
})

// ========== 内联样式（避免外部 CSS 依赖） ==========
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const styles: any = {
  root: {
    width: '100%',
    height: '100%',
    display: 'flex',
    gap: 16,
    padding: 16,
    background: 'linear-gradient(135deg, #0a0a18 0%, #14142b 50%, #0f0f23 100%)',
    color: '#e2e8f0',
    fontFamily: "'Inter', 'Noto Sans SC', system-ui, sans-serif",
    overflow: 'auto',
    boxSizing: 'border-box',
  },
  leftPanel: {
    flex: '0 0 380px',
    display: 'flex',
    flexDirection: 'column',
    background: 'rgba(20, 20, 40, 0.55)',
    border: '1px solid rgba(124, 58, 237, 0.18)',
    borderRadius: 20,
    padding: 22,
    boxShadow: '0 20px 60px rgba(0,0,0,0.4), inset 0 1px 0 rgba(255,255,255,0.04)',
    backdropFilter: 'blur(12px)',
  },
  rightPanel: {
    flex: 1,
    display: 'flex',
    flexDirection: 'column',
    gap: 14,
    minWidth: 0,
  },
  modeTabs: { display: 'flex', gap: 8, marginBottom: 16, justifyContent: 'center' },
  modeTab: {
    padding: '8px 14px',
    fontSize: 12,
    fontWeight: 600,
    border: '1px solid',
    borderRadius: 10,
    cursor: 'pointer',
    transition: 'all 0.25s',
    background: 'transparent',
    letterSpacing: '0.04em',
  },
  controls: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 20,
    marginTop: 10,
  },
  roundBtn: {
    width: 42, height: 42,
    borderRadius: '50%',
    border: '1px solid rgba(148,163,184,0.25)',
    background: 'rgba(30,41,59,0.8)',
    color: '#cbd5e1',
    cursor: 'pointer',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    transition: 'all 0.2s',
  },
  playBtn: {
    width: 72, height: 72,
    borderRadius: '50%',
    border: 'none',
    color: '#fff',
    cursor: 'pointer',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    transition: 'all 0.2s',
  },
  options: {
    display: 'flex',
    justifyContent: 'center',
    gap: 18,
    marginTop: 16,
    fontSize: 12,
  },
  optionLabel: {
    display: 'flex',
    alignItems: 'center',
    gap: 6,
    color: '#94a3b8',
    cursor: 'pointer',
  },
  durationAdjuster: {
    marginTop: 16,
    padding: 12,
    borderRadius: 12,
    background: 'rgba(15, 23, 42, 0.6)',
    border: '1px solid rgba(148,163,184,0.12)',
    display: 'flex',
    flexDirection: 'column',
    gap: 8,
  },
  durLabel: { fontSize: 11, color: '#94a3b8', marginBottom: 4 },
  miniBtn: {
    width: 22, height: 22,
    borderRadius: 6,
    border: '1px solid rgba(148,163,184,0.25)',
    background: 'rgba(30,41,59,0.6)',
    color: '#cbd5e1',
    cursor: 'pointer',
    fontSize: 13,
    lineHeight: 1,
    display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
    padding: 0,
  },
  card: {
    background: 'rgba(20, 20, 40, 0.55)',
    border: '1px solid rgba(148,163,184,0.12)',
    borderRadius: 16,
    padding: 14,
    backdropFilter: 'blur(10px)',
  },
  cardHeader: { display: 'flex', alignItems: 'center', gap: 10, marginBottom: 10 },
  cardTitle: { display: 'flex', alignItems: 'center', gap: 8, fontSize: 13, fontWeight: 600, color: '#e2e8f0', width: '100%' },
  liveTag: {
    marginLeft: 'auto',
    fontSize: 9,
    padding: '2px 6px',
    borderRadius: 4,
    background: '#ef4444',
    color: '#fff',
    fontWeight: 700,
    letterSpacing: '0.1em',
  },
  radioBtn: {
    display: 'flex',
    alignItems: 'center',
    gap: 6,
    padding: '6px 12px',
    borderRadius: 10,
    border: 'none',
    color: '#fff',
    fontSize: 11,
    fontWeight: 600,
    cursor: 'pointer',
    transition: 'all 0.2s',
  },
  nowPlaying: { display: 'flex', alignItems: 'center', gap: 10, padding: '8px 10px', background: 'rgba(15,23,42,0.6)', borderRadius: 10, marginBottom: 10 },
  stationDot: { width: 10, height: 10, borderRadius: '50%', transition: 'all 0.3s', boxShadow: '0 0 12px currentColor' },
  stationGrid: { display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 6, marginBottom: 10 },
  stationChip: {
    padding: '6px 8px',
    borderRadius: 8,
    border: '1px solid',
    fontSize: 11,
    fontWeight: 500,
    cursor: 'pointer',
    transition: 'all 0.2s',
    textAlign: 'center',
    background: 'transparent',
  },
  volumeRow: { display: 'flex', alignItems: 'center', gap: 8 },
  iconBtn: { background: 'transparent', border: 'none', color: '#94a3b8', cursor: 'pointer', padding: 4, borderRadius: 6 },
  volumeLabel: { width: 28, textAlign: 'right', fontSize: 11, color: '#94a3b8' },
  taskInput: { display: 'flex', gap: 6, marginBottom: 8 },
  input: {
    flex: 1,
    padding: '8px 12px',
    borderRadius: 10,
    border: '1px solid rgba(148,163,184,0.2)',
    background: 'rgba(15,23,42,0.7)',
    color: '#e2e8f0',
    fontSize: 13,
    outline: 'none',
  },
  addBtn: {
    width: 34, height: 34,
    borderRadius: 10,
    border: 'none',
    background: '#7c3aed',
    color: '#fff',
    cursor: 'pointer',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
  },
  taskList: { display: 'flex', flexDirection: 'column', gap: 6 },
  taskRow: { display: 'flex', alignItems: 'center', gap: 4, padding: '6px 8px', borderRadius: 8, background: 'rgba(15,23,42,0.4)' },
  emptyState: { padding: 14, textAlign: 'center', color: '#64748b', fontSize: 12 },
  statsRow: { display: 'flex', gap: 8, marginBottom: 10 },
  statChip: {
    flex: 1,
    padding: 10,
    borderRadius: 10,
    background: 'rgba(15,23,42,0.6)',
    textAlign: 'center',
    border: '1px solid rgba(148,163,184,0.1)',
  },
  statNum: { fontSize: 22, fontWeight: 700, color: '#a78bfa', fontVariantNumeric: 'tabular-nums' },
  statLabel: { fontSize: 10, color: '#94a3b8', marginTop: 2 },
  chart: { display: 'flex', alignItems: 'flex-end', gap: 6, height: 80, padding: '0 2px' },
  chartCol: { flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', height: '100%', gap: 4 },
  chartBar: { width: '100%', minHeight: 4, borderRadius: '4px 4px 0 0', background: 'rgba(148,163,184,0.15)', flex: '0 0 auto' },
  chartLabel: { fontSize: 9, color: '#64748b', marginTop: 'auto' },
};

export default PomodoroFocus
