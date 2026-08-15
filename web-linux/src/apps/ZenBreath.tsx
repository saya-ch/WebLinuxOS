import { useState, useEffect, useRef, useCallback } from 'react'

type BreathPhase = 'idle' | 'inhale' | 'hold' | 'exhale' | 'hold2'
type Pattern = 'box' | '478' | 'calm' | 'energize'

interface PatternConfig {
  name: string
  inhale: number
  hold1: number
  exhale: number
  hold2: number
  description: string
}

const PATTERNS: Record<Pattern, PatternConfig> = {
  box: { name: '盒式呼吸', inhale: 4, hold1: 4, exhale: 4, hold2: 4, description: '4-4-4-4 均衡呼吸，适合压力管理' },
  '478': { name: '4-7-8 放松', inhale: 4, hold1: 7, exhale: 8, hold2: 0, description: '吸气4秒，屏息7秒，呼气8秒，深度放松' },
  calm: { name: '平静呼吸', inhale: 4, hold1: 2, exhale: 6, hold2: 0, description: '延长呼气，激活副交感神经' },
  energize: { name: '活力呼吸', inhale: 6, hold1: 0, exhale: 2, hold2: 0, description: '深长吸气，充满活力' },
}

const PHASE_ORDER: BreathPhase[] = ['inhale', 'hold', 'exhale', 'hold2']

const PHASE_LABELS: Record<BreathPhase, string> = {
  idle: '准备开始',
  inhale: '吸气',
  hold: '屏息',
  exhale: '呼气',
  hold2: '停顿',
}

export default function ZenBreath() {
  const [pattern, setPattern] = useState<Pattern>('box')
  const [phase, setPhase] = useState<BreathPhase>('idle')
  const [secondsLeft, setSecondsLeft] = useState(0)
  const [cycles, setCycles] = useState(0)
  const [totalSessions, setTotalSessions] = useState(() => {
    try { return parseInt(localStorage.getItem('zenbreath_sessions') || '0') } catch { return 0 }
  })
  const [totalMinutes, setTotalMinutes] = useState(() => {
    try { return parseInt(localStorage.getItem('zenbreath_minutes') || '0') } catch { return 0 }
  })
  const [soundEnabled, setSoundEnabled] = useState(false)
  const [isRunning, setIsRunning] = useState(false)
  const [theme, setTheme] = useState<'ocean' | 'forest' | 'sunset' | 'midnight'>('ocean')

  const audioCtxRef = useRef<AudioContext | null>(null)
  const phaseRef = useRef<BreathPhase>('idle')
  const timerRef = useRef<number | null>(null)

  const themes = {
    ocean: { bg: 'linear-gradient(135deg, #0c4a6e 0%, #0369a1 50%, #0891b2 100%)', primary: '#0ea5e9', glow: 'rgba(14,165,233,0.4)' },
    forest: { bg: 'linear-gradient(135deg, #14532d 0%, #166534 50%, #15803d 100%)', primary: '#22c55e', glow: 'rgba(34,197,94,0.4)' },
    sunset: { bg: 'linear-gradient(135deg, #7c2d12 0%, #c2410c 50%, #ea580c 100%)', primary: '#f97316', glow: 'rgba(249,115,22,0.4)' },
    midnight: { bg: 'linear-gradient(135deg, #1e1b4b 0%, #312e81 50%, #4338ca 100%)', primary: '#818cf8', glow: 'rgba(129,140,248,0.4)' },
  }

  const playTone = useCallback((frequency: number, duration: number) => {
    if (!soundEnabled) return
    try {
      if (!audioCtxRef.current) {
        audioCtxRef.current = new AudioContext()
      }
      const ctx = audioCtxRef.current
      const oscillator = ctx.createOscillator()
      const gainNode = ctx.createGain()
      oscillator.connect(gainNode)
      gainNode.connect(ctx.destination)
      oscillator.frequency.value = frequency
      oscillator.type = 'sine'
      gainNode.gain.setValueAtTime(0, ctx.currentTime)
      gainNode.gain.linearRampToValueAtTime(0.1, ctx.currentTime + 0.05)
      gainNode.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + duration)
      oscillator.start(ctx.currentTime)
      oscillator.stop(ctx.currentTime + duration)
    } catch {}
  }, [soundEnabled])

  const getPhaseDuration = useCallback((currentPhase: BreathPhase, pat: Pattern): number => {
    const config = PATTERNS[pat]
    switch (currentPhase) {
      case 'inhale': return config.inhale
      case 'hold': return config.hold1
      case 'exhale': return config.exhale
      case 'hold2': return config.hold2
      default: return 0
    }
  }, [])

  const startSession = useCallback(() => {
    setIsRunning(true)
    setCycles(0)
    const firstPhase = PHASE_ORDER[0]
    setPhase(firstPhase)
    phaseRef.current = firstPhase
    const duration = getPhaseDuration(firstPhase, pattern)
    setSecondsLeft(duration)
  }, [pattern, getPhaseDuration])

  const stopSession = useCallback(() => {
    setIsRunning(false)
    setPhase('idle')
    setSecondsLeft(0)
    if (timerRef.current) {
      clearInterval(timerRef.current)
      timerRef.current = null
    }
  }, [])

  useEffect(() => {
    if (!isRunning || secondsLeft <= 0) return

    timerRef.current = window.setTimeout(() => {
      const currentIdx = PHASE_ORDER.indexOf(phaseRef.current)
      const nextIdx = (currentIdx + 1) % PHASE_ORDER.length
      const nextPhase = PHASE_ORDER[nextIdx]

      if (nextPhase === 'inhale' && phaseRef.current !== 'inhale') {
        setCycles(c => {
          const newCycles = c + 1
          if (newCycles % 4 === 0) {
            setTotalSessions(s => {
              const ns = s + 1
              try { localStorage.setItem('zenbreath_sessions', String(ns)) } catch {}
              return ns
            })
            const totalSeconds = PATTERNS[pattern].inhale + PATTERNS[pattern].hold1 + PATTERNS[pattern].exhale + PATTERNS[pattern].hold2
            setTotalMinutes(m => {
              const nm = m + Math.round(totalSeconds * 4 / 60)
              try { localStorage.setItem('zenbreath_minutes', String(nm)) } catch {}
              return nm
            })
          }
          return newCycles
        })
      }

      setPhase(nextPhase)
      phaseRef.current = nextPhase
      const nextDuration = getPhaseDuration(nextPhase, pattern)
      setSecondsLeft(nextDuration)

      const tones: Record<string, number> = { inhale: 523.25, hold: 440, exhale: 349.23, hold2: 392 }
      playTone(tones[nextPhase] || 440, 0.5)
    }, 1000)

    return () => {
      if (timerRef.current) clearTimeout(timerRef.current)
    }
  }, [isRunning, secondsLeft, pattern, getPhaseDuration, playTone])

  const currentDuration = getPhaseDuration(phase, pattern)
  const progress = currentDuration > 0 ? 1 - secondsLeft / currentDuration : 0

  const getScale = () => {
    switch (phase) {
      case 'inhale': return 0.6 + progress * 0.4
      case 'hold': return 1
      case 'exhale': return 1 - progress * 0.4
      case 'hold2': return 0.6
      default: return 0.7
    }
  }

  const currentTheme = themes[theme]

  return (
    <div style={{
      width: '100%', height: '100%',
      background: currentTheme.bg,
      display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
      color: 'white', fontFamily: "'Noto Sans SC', system-ui, sans-serif",
      position: 'relative', overflow: 'hidden',
    }}>
      <style>{`
        @keyframes breathe {
          0%, 100% { transform: scale(0.7); opacity: 0.8; }
          50% { transform: scale(1.05); opacity: 1; }
        }
        @keyframes glow {
          0%, 100% { box-shadow: 0 0 60px ${currentTheme.glow}, 0 0 120px ${currentTheme.glow}; }
          50% { box-shadow: 0 0 80px ${currentTheme.glow}, 0 0 160px ${currentTheme.glow}; }
        }
        @keyframes ripple {
          0% { transform: scale(1); opacity: 0.5; }
          100% { transform: scale(2.5); opacity: 0; }
        }
      `}</style>

      <div style={{
        position: 'absolute', top: 20, right: 20,
        display: 'flex', gap: 10,
      }}>
        {(['ocean', 'forest', 'sunset', 'midnight'] as const).map(t => (
          <button key={t} onClick={() => setTheme(t)} style={{
            width: 28, height: 28, borderRadius: '50%',
            background: themes[t].primary,
            border: theme === t ? '2px solid white' : '2px solid transparent',
            cursor: 'pointer', transition: 'all 0.3s',
          }} title={t} />
        ))}
      </div>

      <div style={{ position: 'absolute', top: 20, left: 20, display: 'flex', gap: 20, fontSize: 14 }}>
        <div>已完成 <strong style={{ color: currentTheme.primary }}>{totalSessions}</strong> 次</div>
        <div>累计 <strong style={{ color: currentTheme.primary }}>{totalMinutes}</strong> 分钟</div>
      </div>

      <div style={{ textAlign: 'center', marginBottom: 20 }}>
        <h1 style={{ fontSize: 28, fontWeight: 300, margin: 0, letterSpacing: 4 }}>
          {PATTERNS[pattern].name}
        </h1>
        <p style={{ fontSize: 13, opacity: 0.7, marginTop: 4 }}>
          {PATTERNS[pattern].description}
        </p>
      </div>

      <div style={{ position: 'relative', width: 280, height: 280, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        {phase !== 'idle' && (
          <div style={{
            position: 'absolute',
            width: 280, height: 280,
            borderRadius: '50%',
            background: `radial-gradient(circle, ${currentTheme.glow} 0%, transparent 70%)`,
            animation: 'ripple 4s ease-out infinite',
          }} />
        )}

        <div style={{
          width: 200, height: 200,
          borderRadius: '50%',
          background: `radial-gradient(circle at 30% 30%, ${currentTheme.primary} 0%, ${currentTheme.primary}aa 60%, transparent 100%)`,
          transform: `scale(${getScale()})`,
          transition: 'transform 0.5s ease-in-out',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          boxShadow: `0 0 60px ${currentTheme.glow}`,
          animation: phase !== 'idle' ? 'glow 4s ease-in-out infinite' : 'none',
        }}>
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: 36, fontWeight: 200 }}>
              {phase === 'idle' ? '●' : secondsLeft}
            </div>
            <div style={{ fontSize: 14, opacity: 0.8, marginTop: 4, letterSpacing: 2 }}>
              {PHASE_LABELS[phase]}
            </div>
          </div>
        </div>
      </div>

      <div style={{ marginTop: 30, display: 'flex', gap: 12 }}>
        {isRunning ? (
          <button onClick={stopSession} style={{
            padding: '12px 36px', fontSize: 15,
            background: 'rgba(255,255,255,0.15)', color: 'white',
            border: '1px solid rgba(255,255,255,0.3)',
            borderRadius: 30, cursor: 'pointer', backdropFilter: 'blur(10px)',
            transition: 'all 0.3s',
          }}>结束练习</button>
        ) : (
          <button onClick={startSession} style={{
            padding: '12px 48px', fontSize: 15,
            background: currentTheme.primary, color: 'white',
            border: 'none', borderRadius: 30, cursor: 'pointer',
            boxShadow: `0 4px 20px ${currentTheme.glow}`,
            transition: 'all 0.3s',
          }}>开始呼吸</button>
        )}
      </div>

      <div style={{ marginTop: 30, display: 'flex', gap: 16, flexWrap: 'wrap', justifyContent: 'center', maxWidth: 400 }}>
        {(Object.keys(PATTERNS) as Pattern[]).map(p => (
          <button key={p} onClick={() => { if (!isRunning) setPattern(p) }} style={{
            padding: '8px 16px', fontSize: 13,
            background: pattern === p ? currentTheme.primary : 'rgba(255,255,255,0.1)',
            color: 'white',
            border: pattern === p ? 'none' : '1px solid rgba(255,255,255,0.2)',
            borderRadius: 20, cursor: 'pointer',
            transition: 'all 0.3s',
          }}>
            {PATTERNS[p].name}
          </button>
        ))}
      </div>

      <button onClick={() => setSoundEnabled(!soundEnabled)} style={{
        marginTop: 16, padding: '6px 14px', fontSize: 12,
        background: soundEnabled ? currentTheme.primary : 'transparent',
        color: 'white',
        border: '1px solid rgba(255,255,255,0.3)',
        borderRadius: 15, cursor: 'pointer',
      }}>
        {soundEnabled ? '🔊 声音开' : '🔇 声音关'}
      </button>

      <div style={{ position: 'absolute', bottom: 20, fontSize: 12, opacity: 0.5 }}>
        完成 {cycles} 个循环
      </div>
    </div>
  )
}
