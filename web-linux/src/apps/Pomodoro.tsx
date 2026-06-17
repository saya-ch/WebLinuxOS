import { useState, useEffect, useRef, useCallback, useMemo } from 'react'

interface PomodoroPhase {
  id: string
  name: string
  duration: number
  color: string
}

interface PomodoroSession {
  date: string
  cycles: number
  focusSeconds: number
  tasks: string
}

const STORAGE_KEY = 'weblinux-pomodoro-stats'

function loadStats(): { cycles: number; totalTime: number; sessions: PomodoroSession[] } {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return { cycles: 0, totalTime: 0, sessions: [] }
    const parsed = JSON.parse(raw)
    return {
      cycles: Number(parsed.cycles) || 0,
      totalTime: Number(parsed.totalTime) || 0,
      sessions: Array.isArray(parsed.sessions) ? parsed.sessions : [],
    }
  } catch {
    return { cycles: 0, totalTime: 0, sessions: [] }
  }
}

function saveStats(cycles: number, totalTime: number, sessions: PomodoroSession[]) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ cycles, totalTime, sessions }))
  } catch {}
}

const Pomodoro: React.FC = () => {
  const initial = useMemo(() => loadStats(), [])
  const [timeLeft, setTimeLeft] = useState(25 * 60)
  const [isRunning, setIsRunning] = useState(false)
  const [currentPhaseIndex, setCurrentPhaseIndex] = useState(0)
  const [cycles, setCycles] = useState(initial.cycles)
  const [totalTime, setTotalTime] = useState(initial.totalTime)
  const [sessions, setSessions] = useState<PomodoroSession[]>(initial.sessions)
  const [taskInput, setTaskInput] = useState('')
  const [currentTask, setCurrentTask] = useState('')
  const [showHistory, setShowHistory] = useState(false)
  const timerRef = useRef<number | null>(null)
  const sessionStartRef = useRef<{ start: number; task: string } | null>(null)

  const phases = useMemo<PomodoroPhase[]>(() => [
    { id: 'work', name: '专注工作', duration: 25 * 60, color: 'from-red-500 to-orange-500' },
    { id: 'short', name: '短休息', duration: 5 * 60, color: 'from-green-500 to-teal-500' },
    { id: 'work2', name: '专注工作', duration: 25 * 60, color: 'from-red-500 to-orange-500' },
    { id: 'short2', name: '短休息', duration: 5 * 60, color: 'from-green-500 to-teal-500' },
    { id: 'work3', name: '专注工作', duration: 25 * 60, color: 'from-red-500 to-orange-500' },
    { id: 'short3', name: '短休息', duration: 5 * 60, color: 'from-green-500 to-teal-500' },
    { id: 'work4', name: '专注工作', duration: 25 * 60, color: 'from-red-500 to-orange-500' },
    { id: 'long', name: '长休息', duration: 15 * 60, color: 'from-blue-500 to-indigo-500' },
  ], [])

  const currentPhase = phases[currentPhaseIndex]

  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60).toString().padStart(2, '0')
    const secs = (seconds % 60).toString().padStart(2, '0')
    return `${mins}:${secs}`
  }

  const startTimer = () => {
    if (timerRef.current) {
      clearInterval(timerRef.current)
    }
    if (!sessionStartRef.current) {
      sessionStartRef.current = { start: Date.now(), task: currentTask || '未命名任务' }
    }
    setIsRunning(true)
    timerRef.current = window.setInterval(() => {
      setTimeLeft(prev => {
        if (prev <= 1) {
          nextPhase()
          return 0
        }
        setTotalTime(t => t + 1)
        return prev - 1
      })
    }, 1000)
  }

  const pauseTimer = () => {
    if (timerRef.current) {
      clearInterval(timerRef.current)
    }
    setIsRunning(false)
  }

  const recordSession = (finalCycles: number) => {
    if (!sessionStartRef.current) return
    const start = sessionStartRef.current
    const focusSeconds = Math.round((Date.now() - start.start) / 1000)
    if (focusSeconds < 30) return
    const today = new Date().toISOString().slice(0, 10)
    setSessions(prev => {
      const next = [
        { date: today, cycles: finalCycles, focusSeconds, tasks: start.task },
        ...prev,
      ].slice(0, 50)
      return next
    })
    sessionStartRef.current = null
  }

  const resetTimer = () => {
    if (timerRef.current) {
      clearInterval(timerRef.current)
    }
    setIsRunning(false)
    setTimeLeft(currentPhase.duration)
  }

  const nextPhase = useCallback(() => {
    pauseTimer()
    const newIndex = (currentPhaseIndex + 1) % phases.length
    let updatedCycles = cycles
    if (newIndex === 0) {
      updatedCycles = cycles + 1
      setCycles(updatedCycles)
      recordSession(updatedCycles)
    }
    setCurrentPhaseIndex(newIndex)
    setTimeLeft(phases[newIndex].duration)
  }, [currentPhaseIndex, phases, cycles, totalTime, sessions])

  const previousPhase = () => {
    let newIndex = currentPhaseIndex - 1
    if (newIndex < 0) newIndex = phases.length - 1
    setCurrentPhaseIndex(newIndex)
    setTimeLeft(phases[newIndex].duration)
    pauseTimer()
  }

  const setCustomTime = (mins: number) => {
    setTimeLeft(mins * 60)
    pauseTimer()
  }

  const progress = ((currentPhase.duration - timeLeft) / currentPhase.duration)

  useEffect(() => {
    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current)
      }
    }
  }, [])

  useEffect(() => {
    saveStats(cycles, totalTime, sessions)
  }, [cycles, totalTime, sessions])

  return (
    <div className="h-full w-full flex flex-col p-6 gap-6 bg-slate-900/80">
      <div className="text-center">
        <h2 className="text-2xl font-bold text-slate-200 mb-2">番茄工作法</h2>
        <p className="text-slate-400 text-sm">专注工作，高效休息</p>
      </div>

      <div className="flex items-center justify-center gap-2">
        {phases.map((phase, index) => (
          <div
            key={phase.id}
            className={`w-3 h-3 rounded-full ${
              index < currentPhaseIndex 
                ? 'bg-green-500' 
                : index === currentPhaseIndex 
                  ? 'bg-blue-500 scale-150'
                  : 'bg-slate-600'
            }`}
          />
        ))}
      </div>

      <div className="flex flex-col items-center gap-4">
        <div className="relative w-64 h-64">
          <svg className="w-full h-full transform -rotate-90" viewBox="0 0 100 100">
            <circle
              cx="50"
              cy="50"
              r="45"
              fill="none"
              stroke="currentColor"
              strokeWidth="8"
              className="text-slate-700"
            />
            <circle
              cx="50"
              cy="50"
              r="45"
              fill="none"
              stroke="currentColor"
              strokeWidth="8"
              strokeDasharray="283"
              strokeDashoffset={283 * (1 - progress)}
              strokeLinecap="round"
              className={`transition-all duration-1000 text-transparent ${
                currentPhaseIndex % 2 === 0 ? 'stroke-red-500' : 'stroke-green-500'
              }`}
            />
          </svg>
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <div className="text-5xl font-bold text-slate-200 mb-2">
              {formatTime(timeLeft)}
            </div>
            <div className="text-lg text-slate-400">
              {currentPhase.name}
            </div>
          </div>
        </div>

        <div className="flex gap-3">
          <button
            onClick={previousPhase}
            className="px-4 py-2 bg-slate-700 hover:bg-slate-600 text-slate-200 rounded-lg transition-colors"
          >
            上一个
          </button>
          {isRunning ? (
            <button
              onClick={pauseTimer}
              className="px-6 py-2 bg-red-600 hover:bg-red-500 text-white rounded-lg transition-colors"
            >
              暂停
            </button>
          ) : (
            <button
              onClick={startTimer}
              className="px-6 py-2 bg-green-600 hover:bg-green-500 text-white rounded-lg transition-colors"
            >
              开始
            </button>
          )}
          <button
            onClick={resetTimer}
            className="px-4 py-2 bg-slate-700 hover:bg-slate-600 text-slate-200 rounded-lg transition-colors"
          >
            重置
          </button>
          <button
            onClick={nextPhase}
            className="px-4 py-2 bg-slate-700 hover:bg-slate-600 text-slate-200 rounded-lg transition-colors"
          >
            下一个
          </button>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="p-4 bg-slate-800 rounded-xl text-center">
          <div className="text-2xl font-bold text-slate-200">{cycles}</div>
          <div className="text-sm text-slate-400">完成循环</div>
        </div>
        <div className="p-4 bg-slate-800 rounded-xl text-center">
          <div className="text-2xl font-bold text-slate-200">{formatTime(totalTime)}</div>
          <div className="text-sm text-slate-400">总专注时间</div>
        </div>
      </div>

      <div className="flex gap-2 justify-center">
        <button
          onClick={() => setCustomTime(25)}
          className="px-3 py-1.5 bg-slate-700 hover:bg-slate-600 text-slate-300 rounded-lg text-sm transition-colors"
        >
          25分钟
        </button>
        <button
          onClick={() => setCustomTime(5)}
          className="px-3 py-1.5 bg-slate-700 hover:bg-slate-600 text-slate-300 rounded-lg text-sm transition-colors"
        >
          5分钟
        </button>
        <button
          onClick={() => setCustomTime(15)}
          className="px-3 py-1.5 bg-slate-700 hover:bg-slate-600 text-slate-300 rounded-lg text-sm transition-colors"
        >
          15分钟
        </button>
        <button
          onClick={() => setCustomTime(10)}
          className="px-3 py-1.5 bg-slate-700 hover:bg-slate-600 text-slate-300 rounded-lg text-sm transition-colors"
        >
          10分钟
        </button>
      </div>

      <div className="border-t border-slate-700/60 pt-4 flex flex-col gap-3">
        <div className="flex items-center gap-2">
          <input
            type="text"
            value={taskInput}
            onChange={(e) => setTaskInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && taskInput.trim()) {
                setCurrentTask(taskInput.trim())
                setTaskInput('')
              }
            }}
            placeholder="输入当前专注任务..."
            className="flex-1 px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-slate-200 text-sm placeholder-slate-500 focus:outline-none focus:border-blue-500"
          />
          <button
            onClick={() => {
              if (taskInput.trim()) {
                setCurrentTask(taskInput.trim())
                setTaskInput('')
              }
            }}
            className="px-3 py-2 bg-blue-600 hover:bg-blue-500 text-white text-sm rounded-lg transition-colors"
          >
            设置
          </button>
        </div>
        {currentTask && (
          <div className="text-sm text-slate-300 px-1">
            当前任务: <span className="text-blue-300">{currentTask}</span>
          </div>
        )}
        <button
          onClick={() => setShowHistory(s => !s)}
          className="text-xs text-slate-400 hover:text-slate-200 self-start"
        >
          {showHistory ? '隐藏' : '查看'}历史会话 ({sessions.length})
        </button>
        {showHistory && (
          <div className="max-h-40 overflow-y-auto bg-slate-800/50 rounded-lg p-2 text-xs space-y-1">
            {sessions.length === 0 ? (
              <div className="text-slate-500 px-2 py-1">暂无历史记录</div>
            ) : (
              sessions.map((s, i) => (
                <div key={i} className="flex justify-between text-slate-300 px-2 py-1 hover:bg-slate-700/50 rounded">
                  <span className="truncate flex-1">{s.tasks}</span>
                  <span className="text-slate-500 ml-2">{s.date}</span>
                  <span className="text-blue-300 ml-2">{Math.round(s.focusSeconds / 60)}分钟</span>
                </div>
              ))
            )}
          </div>
        )}
      </div>
    </div>
  )
}

export default Pomodoro
