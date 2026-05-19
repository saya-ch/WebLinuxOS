import { useRef, useEffect, useState, useCallback } from 'react'

const GRID = 20
const COLS = 16
const ROWS = 16
const WIDTH = COLS * GRID
const HEIGHT = ROWS * GRID

type Direction = 'UP' | 'DOWN' | 'LEFT' | 'RIGHT'
type Point = { x: number; y: number }

const directionVectors: Record<Direction, Point> = {
  UP: { x: 0, y: -1 },
  DOWN: { x: 0, y: 1 },
  LEFT: { x: -1, y: 0 },
  RIGHT: { x: 1, y: 0 },
}

export default function GameSnake() {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const snakeRef = useRef<Point[]>([{ x: 8, y: 8 }, { x: 7, y: 8 }, { x: 6, y: 8 }])
  const foodRef = useRef<Point>({ x: 12, y: 8 })
  const directionRef = useRef<Direction>('RIGHT')
  const nextDirectionRef = useRef<Direction>('RIGHT')
  const scoreRef = useRef(0)
  const runningRef = useRef(false)
  const speedRef = useRef(150)

  const [score, setScore] = useState(0)
  const [gameOver, setGameOver] = useState(false)
  const [started, setStarted] = useState(false)

  const randomFood = (snake: Point[]): Point => {
    let pos: Point
    do {
      pos = { x: Math.floor(Math.random() * COLS), y: Math.floor(Math.random() * ROWS) }
    } while (snake.some((s) => s.x === pos.x && s.y === pos.y))
    return pos
  }

  const draw = useCallback(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    ctx.fillStyle = '#11111b'
    ctx.fillRect(0, 0, WIDTH, HEIGHT)

    for (let x = 0; x < COLS; x++) {
      for (let y = 0; y < ROWS; y++) {
        ctx.fillStyle = '#181825'
        ctx.fillRect(x * GRID + 1, y * GRID + 1, GRID - 2, GRID - 2)
      }
    }

    const snake = snakeRef.current
    snake.forEach((seg, i) => {
      ctx.fillStyle = i === 0 ? '#a6e3a1' : '#89b4fa'
      ctx.fillRect(seg.x * GRID + 2, seg.y * GRID + 2, GRID - 4, GRID - 4)
      if (i === 0) {
        ctx.fillStyle = '#fff'
        const d = directionRef.current
        const cx = seg.x * GRID + GRID / 2
        const cy = seg.y * GRID + GRID / 2
        ctx.beginPath()
        ctx.arc(cx + (d === 'RIGHT' ? 3 : d === 'LEFT' ? -3 : 0), cy + (d === 'DOWN' ? 3 : d === 'UP' ? -3 : 0), 3, 0, Math.PI * 2)
        ctx.fill()
        ctx.beginPath()
        ctx.arc(cx + (d === 'RIGHT' ? 3 : d === 'LEFT' ? -3 : 0), cy + (d === 'DOWN' ? 3 : d === 'UP' ? -3 : 0), 3, 0, Math.PI * 2)
        ctx.fill()
      }
    })

    const food = foodRef.current
    ctx.fillStyle = '#f38ba8'
    ctx.beginPath()
    ctx.arc(food.x * GRID + GRID / 2, food.y * GRID + GRID / 2, GRID / 2 - 2, 0, Math.PI * 2)
    ctx.fill()
  }, [])

  const gameLoop = useCallback(() => {
    if (!runningRef.current) return

    directionRef.current = nextDirectionRef.current
    const snake = snakeRef.current
    const head = snake[0]
    const dir = directionVectors[directionRef.current]
    const newHead = { x: head.x + dir.x, y: head.y + dir.y }

    if (newHead.x < 0 || newHead.x >= COLS || newHead.y < 0 || newHead.y >= ROWS) {
      runningRef.current = false
      setGameOver(true)
      setStarted(false)
      draw()
      return
    }

    if (snake.some((s) => s.x === newHead.x && s.y === newHead.y)) {
      runningRef.current = false
      setGameOver(true)
      setStarted(false)
      draw()
      return
    }

    const newSnake = [newHead, ...snake]
    if (newHead.x === foodRef.current.x && newHead.y === foodRef.current.y) {
      scoreRef.current += 10
      setScore(scoreRef.current)
      foodRef.current = randomFood(newSnake)
      speedRef.current = Math.max(60, speedRef.current - 3)
    } else {
      newSnake.pop()
    }
    snakeRef.current = newSnake
    draw()
    setTimeout(gameLoop, speedRef.current)
  }, [draw])

  const startGame = () => {
    snakeRef.current = [{ x: 8, y: 8 }, { x: 7, y: 8 }, { x: 6, y: 8 }]
    directionRef.current = 'RIGHT'
    nextDirectionRef.current = 'RIGHT'
    scoreRef.current = 0
    speedRef.current = 150
    setScore(0)
    setGameOver(false)
    setStarted(true)
    runningRef.current = true
    foodRef.current = randomFood(snakeRef.current)
    draw()
    setTimeout(gameLoop, speedRef.current)
  }

  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (!runningRef.current) return
      const keyMap: Record<string, Direction> = {
        ArrowUp: 'UP', ArrowDown: 'DOWN', ArrowLeft: 'LEFT', ArrowRight: 'RIGHT',
        w: 'UP', s: 'DOWN', a: 'LEFT', d: 'RIGHT',
        W: 'UP', S: 'DOWN', A: 'LEFT', D: 'RIGHT',
      }
      const newDir = keyMap[e.key]
      if (newDir) {
        const opposites: Record<Direction, Direction> = { UP: 'DOWN', DOWN: 'UP', LEFT: 'RIGHT', RIGHT: 'LEFT' }
        if (opposites[newDir] !== directionRef.current) {
          nextDirectionRef.current = newDir
        }
      }
    }
    window.addEventListener('keydown', handleKey)
    draw()
    return () => window.removeEventListener('keydown', handleKey)
  }, [draw])

  return (
    <div style={{
      display: 'flex', flexDirection: 'column', alignItems: 'center', height: '100%',
      background: '#1e1e2e', color: '#cdd6f4', padding: '12px', gap: '10px',
    }}>
      <div style={{ fontSize: '18px', fontWeight: 700 }}>🐍 贪吃蛇</div>
      <div style={{ fontSize: '22px', fontWeight: 700, color: '#a6e3a1' }}>得分: {score}</div>

      <canvas
        ref={canvasRef}
        width={WIDTH}
        height={HEIGHT}
        style={{ border: '2px solid #45475a', borderRadius: '8px' }}
      />

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
          <div style={{ fontSize: '13px', color: '#a6adc8' }}>最终得分: {score}</div>
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

      <div style={{ fontSize: '11px', color: '#6c7086' }}>方向键/WASD 控制移动</div>
    </div>
  )
}