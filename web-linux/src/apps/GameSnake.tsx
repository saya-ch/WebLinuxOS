import { useRef, useEffect, useState, useCallback } from 'react'

const GRID = 20
const COLS = 16
const ROWS = 16
const WIDTH = COLS * GRID
const HEIGHT = ROWS * GRID

type Direction = 'UP' | 'DOWN' | 'LEFT' | 'RIGHT'
type Point = { x: number; y: number }
type PowerUp = { x: number; y: number; type: 'speed' | 'slow' | 'ghost' | 'reverse' | 'shrink' }

const directionVectors: Record<Direction, Point> = {
  UP: { x: 0, y: -1 },
  DOWN: { x: 0, y: 1 },
  LEFT: { x: -1, y: 0 },
  RIGHT: { x: 1, y: 0 },
}

const powerUpColors: Record<PowerUp['type'], string> = {
  speed: '#f38ba8',
  slow: '#89b4fa',
  ghost: '#cba6f7',
  reverse: '#f9e2af',
  shrink: '#a6e3a1',
}

const powerUpNames: Record<PowerUp['type'], string> = {
  speed: '闪电',
  slow: '雪花',
  ghost: '幽灵',
  reverse: '转向',
  shrink: '缩小',
}

function useSound() {
  const playSound = useCallback((type: 'eat' | 'die' | 'powerup' | 'start') => {
    try {
      const ctx = new (window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext)()
      const osc = ctx.createOscillator()
      const gain = ctx.createGain()
      osc.connect(gain)
      gain.connect(ctx.destination)
      gain.gain.value = 0.15

      switch (type) {
        case 'eat':
          osc.frequency.setValueAtTime(600, ctx.currentTime)
          osc.frequency.exponentialRampToValueAtTime(900, ctx.currentTime + 0.1)
          gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.1)
          osc.start(ctx.currentTime)
          osc.stop(ctx.currentTime + 0.1)
          break
        case 'die':
          osc.frequency.setValueAtTime(400, ctx.currentTime)
          osc.frequency.exponentialRampToValueAtTime(100, ctx.currentTime + 0.3)
          gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.3)
          osc.start(ctx.currentTime)
          osc.stop(ctx.currentTime + 0.3)
          break
        case 'powerup':
          osc.frequency.setValueAtTime(800, ctx.currentTime)
          osc.frequency.exponentialRampToValueAtTime(1200, ctx.currentTime + 0.15)
          gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.15)
          osc.start(ctx.currentTime)
          osc.stop(ctx.currentTime + 0.15)
          break
        case 'start':
          osc.frequency.setValueAtTime(440, ctx.currentTime)
          osc.frequency.setValueAtTime(550, ctx.currentTime + 0.1)
          osc.frequency.setValueAtTime(660, ctx.currentTime + 0.2)
          gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.3)
          osc.start(ctx.currentTime)
          osc.stop(ctx.currentTime + 0.3)
          break
      }
      setTimeout(() => ctx.close(), 1000)
    } catch {
      // Audio not supported
    }
  }, [])

  return playSound
}

export default function GameSnake() {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const snakeRef = useRef<Point[]>([{ x: 8, y: 8 }, { x: 7, y: 8 }, { x: 6, y: 8 }])
  const foodRef = useRef<Point>({ x: 12, y: 8 })
  const directionRef = useRef<Direction>('RIGHT')
  const nextDirectionRef = useRef<Direction>('RIGHT')
  const scoreRef = useRef(0)
  const runningRef = useRef(false)
  const pausedRef = useRef(false)
  const speedRef = useRef(150)
  const baseSpeedRef = useRef(150)
  const gameLoopRef = useRef<() => void>(() => {})
  const powerUpRef = useRef<PowerUp | null>(null)
  const ghostRef = useRef(false)
  const reverseRef = useRef(false)
  const powerUpTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const powerUpSpawnTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  const playSound = useSound()

  const [score, setScore] = useState(0)
  const [highScore, setHighScore] = useState(() => {
    try { return parseInt(localStorage.getItem('snake-high-score') || '0', 10) } catch { return 0 }
  })
  const [gameOver, setGameOver] = useState(false)
  const [started, setStarted] = useState(false)
  const [paused, setPaused] = useState(false)
  const [level, setLevel] = useState(() => {
    try { return parseInt(localStorage.getItem('snake-level') || '1', 10) } catch { return 1 }
  })
  const [activePowerUp, setActivePowerUp] = useState<PowerUp['type'] | null>(null)

  const randomFood = (snake: Point[]): Point => {
    let pos: Point
    do {
      pos = { x: Math.floor(Math.random() * COLS), y: Math.floor(Math.random() * ROWS) }
    } while (snake.some((s) => s.x === pos.x && s.y === pos.y))
    return pos
  }

  const spawnPowerUp = useCallback((snake: Point[]): PowerUp | null => {
    if (Math.random() > 0.15) return null
    const types: PowerUp['type'][] = ['speed', 'slow', 'ghost', 'reverse', 'shrink']
    const type = types[Math.floor(Math.random() * types.length)]
    let pos: Point
    do {
      pos = { x: Math.floor(Math.random() * COLS), y: Math.floor(Math.random() * ROWS) }
    } while (snake.some((s) => s.x === pos.x && s.y === pos.y))
    return { ...pos, type }
  }, [])

  const clearPowerUp = useCallback(() => {
    ghostRef.current = false
    reverseRef.current = false
    speedRef.current = baseSpeedRef.current
    setActivePowerUp(null)
    if (powerUpTimerRef.current) {
      clearTimeout(powerUpTimerRef.current)
      powerUpTimerRef.current = null
    }
  }, [])

  const applyPowerUp = useCallback((powerUp: PowerUp['type']) => {
    clearPowerUp()
    setActivePowerUp(powerUp)
    switch (powerUp) {
      case 'speed':
        speedRef.current = baseSpeedRef.current * 0.5
        break
      case 'slow':
        speedRef.current = baseSpeedRef.current * 1.8
        break
      case 'ghost':
        ghostRef.current = true
        break
      case 'reverse':
        reverseRef.current = true
        break
      case 'shrink':
        if (snakeRef.current.length > 3) {
          snakeRef.current.pop()
        }
        break
    }
    powerUpTimerRef.current = setTimeout(() => {
      clearPowerUp()
    }, 5000)
  }, [clearPowerUp])

  const draw = useCallback(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    // Background
    ctx.fillStyle = '#11111b'
    ctx.fillRect(0, 0, WIDTH, HEIGHT)

    // Grid
    for (let x = 0; x < COLS; x++) {
      for (let y = 0; y < ROWS; y++) {
        ctx.fillStyle = '#181825'
        ctx.fillRect(x * GRID + 1, y * GRID + 1, GRID - 2, GRID - 2)
      }
    }

    // Power-up
    const pu = powerUpRef.current
    if (pu) {
      ctx.fillStyle = powerUpColors[pu.type]
      ctx.beginPath()
      ctx.arc(pu.x * GRID + GRID / 2, pu.y * GRID + GRID / 2, GRID / 2 - 2, 0, Math.PI * 2)
      ctx.fill()
      ctx.fillStyle = '#fff'
      ctx.font = 'bold 8px sans-serif'
      ctx.textAlign = 'center'
      ctx.textBaseline = 'middle'
      const symbols: Record<PowerUp['type'], string> = { speed: '>', slow: '*', ghost: '?', reverse: '<', shrink: '-' }
      ctx.fillText(symbols[pu.type], pu.x * GRID + GRID / 2, pu.y * GRID + GRID / 2)
    }

    // Food
    const food = foodRef.current
    const gradient = ctx.createRadialGradient(
      food.x * GRID + GRID / 2, food.y * GRID + GRID / 2, 0,
      food.x * GRID + GRID / 2, food.y * GRID + GRID / 2, GRID / 2
    )
    gradient.addColorStop(0, '#ff9ff3')
    gradient.addColorStop(1, '#f38ba8')
    ctx.fillStyle = gradient
    ctx.beginPath()
    ctx.arc(food.x * GRID + GRID / 2, food.y * GRID + GRID / 2, GRID / 2 - 2, 0, Math.PI * 2)
    ctx.fill()

    // Snake
    const snake = snakeRef.current
    snake.forEach((seg, i) => {
      if (ghostRef.current && i > 0) {
        ctx.globalAlpha = 0.4
      }
      const hue = 120 - (i / snake.length) * 80
      ctx.fillStyle = i === 0 ? '#a6e3a1' : `hsl(${hue}, 80%, 65%)`
      ctx.fillRect(seg.x * GRID + 2, seg.y * GRID + 2, GRID - 4, GRID - 4)

      // Eyes
      if (i === 0) {
        const dir = reverseRef.current
          ? { x: -directionVectors[directionRef.current].x, y: -directionVectors[directionRef.current].y }
          : directionVectors[directionRef.current]
        ctx.fillStyle = '#fff'
        const cx = seg.x * GRID + GRID / 2
        const cy = seg.y * GRID + GRID / 2
        ctx.beginPath()
        ctx.arc(cx + (dir.x === 1 ? 3 : dir.x === -1 ? -3 : 0), cy + (dir.y === 1 ? 3 : dir.y === -1 ? -3 : 0), 3, 0, Math.PI * 2)
        ctx.fill()
        ctx.beginPath()
        ctx.arc(cx + (dir.x === 1 ? 3 : dir.x === -1 ? -3 : 0) + dir.x * 2, cy + (dir.y === 1 ? 3 : dir.y === -1 ? -3 : 0) + dir.y * 2, 1.5, 0, Math.PI * 2)
        ctx.fill()
      }
      ctx.globalAlpha = 1
    })
  }, [])

  useEffect(() => {
    gameLoopRef.current = () => {
      if (!runningRef.current || pausedRef.current) return

      let effectiveDir = directionRef.current
      if (reverseRef.current) {
        const opposites: Record<Direction, Direction> = { UP: 'DOWN', DOWN: 'UP', LEFT: 'RIGHT', RIGHT: 'LEFT' }
        effectiveDir = opposites[directionRef.current]
      } else {
        effectiveDir = nextDirectionRef.current
      }
      directionRef.current = effectiveDir

      const snake = snakeRef.current
      const head = snake[0]
      const dir = directionVectors[effectiveDir]
      const newHead = { x: head.x + dir.x, y: head.y + dir.y }

      // Wall collision
      if (newHead.x < 0 || newHead.x >= COLS || newHead.y < 0 || newHead.y >= ROWS) {
        runningRef.current = false
        playSound('die')
        setGameOver(true)
        setStarted(false)
        draw()
        return
      }

      // Self collision (unless ghost mode)
      if (!ghostRef.current && snake.some((s) => s.x === newHead.x && s.y === newHead.y)) {
        runningRef.current = false
        playSound('die')
        setGameOver(true)
        setStarted(false)
        draw()
        return
      }

      const newSnake = [newHead, ...snake]

      // Eat food
      if (newHead.x === foodRef.current.x && newHead.y === foodRef.current.y) {
        scoreRef.current += 10 * level
        setScore(scoreRef.current)
        foodRef.current = randomFood(newSnake)
        speedRef.current = Math.max(50, speedRef.current - 2 * level)
        playSound('eat')
        // Random power-up spawn
        const pu = spawnPowerUp(newSnake)
        powerUpRef.current = pu
      } else {
        newSnake.pop()
      }

      // Eat power-up
      const pu = powerUpRef.current
      if (pu && newHead.x === pu.x && newHead.y === pu.y) {
        applyPowerUp(pu.type)
        powerUpRef.current = null
        playSound('powerup')
      }

      snakeRef.current = newSnake
      draw()
      setTimeout(() => gameLoopRef.current(), speedRef.current)
    }
  }, [draw, level, randomFood, spawnPowerUp, applyPowerUp, playSound])

  const startGame = () => {
    if (powerUpTimerRef.current) clearTimeout(powerUpTimerRef.current)
    if (powerUpSpawnTimerRef.current) clearTimeout(powerUpSpawnTimerRef.current)
    clearPowerUp()
    snakeRef.current = [{ x: 8, y: 8 }, { x: 7, y: 8 }, { x: 6, y: 8 }]
    directionRef.current = 'RIGHT'
    nextDirectionRef.current = 'RIGHT'
    scoreRef.current = 0
    baseSpeedRef.current = Math.max(80, 180 - (level - 1) * 20)
    speedRef.current = baseSpeedRef.current
    powerUpRef.current = null
    setScore(0)
    setGameOver(false)
    setStarted(true)
    setPaused(false)
    pausedRef.current = false
    runningRef.current = true
    foodRef.current = randomFood(snakeRef.current)
    draw()
    playSound('start')
    setTimeout(() => gameLoopRef.current(), speedRef.current)
  }

  const togglePause = useCallback(() => {
    if (!runningRef.current) return
    pausedRef.current = !pausedRef.current
    setPaused(pausedRef.current)
    if (!pausedRef.current) {
      setTimeout(() => gameLoopRef.current(), speedRef.current)
    }
  }, [])

  const handleLevelChange = (newLevel: number) => {
    setLevel(newLevel)
    try { localStorage.setItem('snake-level', String(newLevel)) } catch {}
  }

  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape' || e.key === 'p' || e.key === 'P') {
        if (runningRef.current && !gameOver) {
          e.preventDefault()
          togglePause()
        }
        return
      }
      if (!runningRef.current || pausedRef.current) return
      const keyMap: Record<string, Direction> = {
        ArrowUp: 'UP', ArrowDown: 'DOWN', ArrowLeft: 'LEFT', ArrowRight: 'RIGHT',
        w: 'UP', s: 'DOWN', a: 'LEFT', d: 'RIGHT',
        W: 'UP', S: 'DOWN', A: 'LEFT', D: 'RIGHT',
      }
      const newDir = keyMap[e.key]
      if (newDir) {
        const opposites: Record<Direction, Direction> = { UP: 'DOWN', DOWN: 'UP', LEFT: 'RIGHT', RIGHT: 'LEFT' }
        if (reverseRef.current) {
          if (opposites[newDir] !== directionRef.current) {
            nextDirectionRef.current = newDir
          }
        } else {
          if (opposites[newDir] !== directionRef.current) {
            nextDirectionRef.current = newDir
          }
        }
      }
    }
    window.addEventListener('keydown', handleKey)
    draw()
    return () => window.removeEventListener('keydown', handleKey)
  }, [draw, togglePause])

  // Save high score
  useEffect(() => {
    if (score > highScore) {
      setHighScore(score)
      try { localStorage.setItem('snake-high-score', String(score)) } catch {}
    }
  }, [score, highScore])

  const levelLabels = ['简单', '普通', '困难', '地狱']
  const activePowerUpLabel = activePowerUp ? powerUpNames[activePowerUp] : null

  return (
    <div style={{
      display: 'flex', flexDirection: 'column', alignItems: 'center', height: '100%',
      background: '#1e1e2e', color: '#cdd6f4', padding: '10px', gap: '8px',
      userSelect: 'none',
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px', width: '100%', justifyContent: 'center' }}>
        <span style={{ fontSize: '20px', fontWeight: 700 }}>贪吃蛇</span>
        {!started && !gameOver && (
          <select
            value={level}
            onChange={(e) => handleLevelChange(Number(e.target.value))}
            style={{ padding: '4px 8px', borderRadius: '6px', border: '1px solid #45475a', background: '#313244', color: '#cdd6f4', fontSize: '12px' }}
          >
            {levelLabels.map((l, i) => <option key={i} value={i + 1}>{l}</option>)}
          </select>
        )}
      </div>

      <div style={{ display: 'flex', gap: '16px', fontSize: '14px' }}>
        <span style={{ color: '#a6e3a1' }}>得分: <b>{score}</b></span>
        <span style={{ color: '#f9e2af' }}>最高: <b>{highScore}</b></span>
        {activePowerUpLabel && (
          <span style={{ color: powerUpColors[activePowerUp!], fontWeight: 600 }}>
            {powerUpNames[activePowerUp!]} ({Math.round(((powerUpTimerRef.current ? 5000 : 0)) / 1000)}s)
          </span>
        )}
      </div>

      <canvas
        ref={canvasRef}
        width={WIDTH}
        height={HEIGHT}
        style={{ border: '2px solid #45475a', borderRadius: '8px' }}
      />

      {paused && (
        <div style={{
          position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)',
          background: 'rgba(0,0,0,0.8)', padding: '16px 32px', borderRadius: '12px',
          fontSize: '24px', fontWeight: 700, color: '#f9e2af', zIndex: 10,
        }}>
          PAUSED
        </div>
      )}

      {!started && !gameOver && (
        <button
          onClick={startGame}
          style={{
            padding: '10px 28px', background: '#a6e3a1', color: '#1e1e2e',
            border: 'none', borderRadius: '8px', cursor: 'pointer', fontSize: '14px', fontWeight: 600,
          }}
        >
          开始游戏
        </button>
      )}

      {gameOver && (
        <div style={{ textAlign: 'center', display: 'flex', flexDirection: 'column', gap: '8px' }}>
          <div style={{ fontSize: '16px', color: '#f38ba8', fontWeight: 600 }}>游戏结束!</div>
          <div style={{ fontSize: '13px', color: '#a6adc8' }}>最终得分: {score} {score >= highScore && score > 0 ? '(新纪录!)' : ''}</div>
          <button
            onClick={startGame}
            style={{
              padding: '10px 28px', background: '#89b4fa', color: '#1e1e2e',
              border: 'none', borderRadius: '8px', cursor: 'pointer', fontSize: '14px', fontWeight: 600,
            }}
          >
            重新开始
          </button>
        </div>
      )}

      {started && !gameOver && (
        <button
          onClick={togglePause}
          style={{
            padding: '6px 16px', background: paused ? '#a6e3a1' : '#f9e2af', color: '#1e1e2e',
            border: 'none', borderRadius: '6px', cursor: 'pointer', fontSize: '12px', fontWeight: 600,
          }}
        >
          {paused ? '继续' : '暂停'}
        </button>
      )}

      <div style={{ fontSize: '11px', color: '#6c7086', textAlign: 'center', lineHeight: 1.6 }}>
        方向键/WASD 控制移动 | ESC/P 暂停
        <br />
        <span style={{ color: '#f38ba8' }}>红色</span> 加速
        <span style={{ color: '#89b4fa' }}> | 蓝色</span> 减速
        <span style={{ color: '#cba6f7' }}> | 紫色</span> 穿墙
        <span style={{ color: '#f9e2af' }}> | 黄色</span> 反向
        <span style={{ color: '#a6e3a1' }}> | 绿色</span> 缩短
      </div>
    </div>
  )
}
