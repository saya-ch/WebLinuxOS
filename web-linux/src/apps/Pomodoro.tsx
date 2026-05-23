import { useState, useEffect, useRef, useCallback } from 'react'

interface PomodoroPhase {
  id: string
  name: string
  duration: number
  color: string
}

const Pomodoro: React.FC = () => {
  const [timeLeft, setTimeLeft] = useState(25 * 60)
  const [isRunning, setIsRunning] = useState(false)
  const [currentPhaseIndex, setCurrentPhaseIndex] = useState(0)
  const [cycles, setCycles] = useState(0)
  const [totalTime, setTotalTime] = useState(0)
  const timerRef = useRef<number | null>(null)

  const phases: PomodoroPhase[] = [
    { id: 'work', name: '专注工作', duration: 25 * 60, color: 'from-red-500 to-orange-500' },
    { id: 'short', name: '短休息', duration: 5 * 60, color: 'from-green-500 to-teal-500' },
    { id: 'work2', name: '专注工作', duration: 25 * 60, color: 'from-red-500 to-orange-500' },
    { id: 'short2', name: '短休息', duration: 5 * 60, color: 'from-green-500 to-teal-500' },
    { id: 'work3', name: '专注工作', duration: 25 * 60, color: 'from-red-500 to-orange-500' },
    { id: 'short3', name: '短休息', duration: 5 * 60, color: 'from-green-500 to-teal-500' },
    { id: 'work4', name: '专注工作', duration: 25 * 60, color: 'from-red-500 to-orange-500' },
    { id: 'long', name: '长休息', duration: 15 * 60, color: 'from-blue-500 to-indigo-500' },
  ]

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
    if (newIndex === 0) {
      setCycles(c => c + 1)
    }
    setCurrentPhaseIndex(newIndex)
    setTimeLeft(phases[newIndex].duration)
  }, [currentPhaseIndex, phases])

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

  // 不再需要这个 useEffect，因为我们已经在 nextPhase 和 previousPhase 中处理了

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
    </div>
  )
}

export default Pomodoro
