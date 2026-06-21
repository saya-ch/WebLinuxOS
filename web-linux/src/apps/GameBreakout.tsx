import { useRef, useEffect, useState, useCallback } from 'react'

const WIDTH = 400
const HEIGHT = 500
const PADDLE_W = 80
const PADDLE_H = 12
const BALL_R = 8
const BRICK_ROWS = 6
const BRICK_COLS = 9
const BRICK_W = (WIDTH - 20) / BRICK_COLS
const BRICK_H = 18

function useSound() {
  const play = useCallback((type: 'paddle' | 'brick' | 'wall' | 'die' | 'win' | 'start') => {
    try {
      const ctx = new (window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext)()
      const osc = ctx.createOscillator()
      const gain = ctx.createGain()
      osc.connect(gain)
      gain.connect(ctx.destination)
      gain.gain.value = 0.1
      switch (type) {
        case 'paddle':
          osc.frequency.value = 300
          gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.05)
          osc.start(ctx.currentTime)
          osc.stop(ctx.currentTime + 0.05)
          break
        case 'brick':
          osc.frequency.value = 500
          gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.08)
          osc.start(ctx.currentTime)
          osc.stop(ctx.currentTime + 0.08)
          break
        case 'wall':
          osc.frequency.value = 250
          gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.05)
          osc.start(ctx.currentTime)
          osc.stop(ctx.currentTime + 0.05)
          break
        case 'die':
          osc.frequency.setValueAtTime(400, ctx.currentTime)
          osc.frequency.exponentialRampToValueAtTime(80, ctx.currentTime + 0.4)
          gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.4)
          osc.start(ctx.currentTime)
          osc.stop(ctx.currentTime + 0.4)
          break
        case 'win':
          osc.frequency.setValueAtTime(523, ctx.currentTime)
          osc.frequency.setValueAtTime(659, ctx.currentTime + 0.12)
          osc.frequency.setValueAtTime(784, ctx.currentTime + 0.24)
          osc.frequency.setValueAtTime(1047, ctx.currentTime + 0.36)
          gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.6)
          osc.start(ctx.currentTime)
          osc.stop(ctx.currentTime + 0.6)
          break
        case 'start':
          osc.frequency.setValueAtTime(330, ctx.currentTime)
          osc.frequency.setValueAtTime(440, ctx.currentTime + 0.1)
          gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.2)
          osc.start(ctx.currentTime)
          osc.stop(ctx.currentTime + 0.2)
          break
      }
      setTimeout(() => ctx.close(), 1000)
    } catch {
      // Audio not supported
    }
  }, [])
  return play
}

export default function GameBreakout() {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const paddleRef = useRef(WIDTH / 2 - PADDLE_W / 2)
  const ballRef = useRef({ x: WIDTH / 2, y: HEIGHT - 80, vx: 3, vy: -3 })
  const bricksRef = useRef<boolean[][]>([])
  const scoreRef = useRef(0)
  const livesRef = useRef(3)
  const runningRef = useRef(false)
  const animRef = useRef<number>(0)
  const keysRef = useRef<Set<string>>(new Set())

  const playSound = useSound()

  const [score, setScore] = useState(0)
  const [lives, setLives] = useState(3)
  const [highScore, setHighScore] = useState(() => {
    try { return parseInt(localStorage.getItem('breakout-high-score') || '0', 10) } catch { return 0 }
  })
  const [gameOver, setGameOver] = useState(false)
  const [started, setStarted] = useState(false)
  const [won, setWon] = useState(false)

  const initBricks = useCallback(() => {
    const bricks: boolean[][] = []
    for (let r = 0; r < BRICK_ROWS; r++) {
      bricks[r] = []
      for (let c = 0; c < BRICK_COLS; c++) {
        bricks[r][c] = true
      }
    }
    bricksRef.current = bricks
  }, [])

  const draw = useCallback(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    // Background
    ctx.fillStyle = '#11111b'
    ctx.fillRect(0, 0, WIDTH, HEIGHT)

    // Bricks
    const colors = ['#f38ba8', '#fab387', '#f9e2af', '#a6e3a1', '#89b4fa', '#cba6f7']
    bricksRef.current.forEach((row, r) => {
      row.forEach((exists, c) => {
        if (exists) {
          ctx.fillStyle = colors[r % colors.length]
          ctx.fillRect(10 + c * BRICK_W + 1, 30 + r * BRICK_H + 1, BRICK_W - 2, BRICK_H - 2)
          ctx.fillStyle = 'rgba(255,255,255,0.2)'
          ctx.fillRect(10 + c * BRICK_W + 2, 30 + r * BRICK_H + 2, BRICK_W - 6, 3)
        }
      })
    })

    // Paddle
    const gradient = ctx.createLinearGradient(paddleRef.current, 0, paddleRef.current + PADDLE_W, 0)
    gradient.addColorStop(0, '#89b4fa')
    gradient.addColorStop(1, '#cba6f7')
    ctx.fillStyle = gradient
    ctx.beginPath()
    ctx.roundRect(paddleRef.current, HEIGHT - 30, PADDLE_W, PADDLE_H, 6)
    ctx.fill()

    // Ball
    const ball = ballRef.current
    const ballGradient = ctx.createRadialGradient(ball.x - 2, ball.y - 2, 0, ball.x, ball.y, BALL_R)
    ballGradient.addColorStop(0, '#fff')
    ballGradient.addColorStop(1, '#89b4fa')
    ctx.fillStyle = ballGradient
    ctx.beginPath()
    ctx.arc(ball.x, ball.y, BALL_R, 0, Math.PI * 2)
    ctx.fill()
  }, [])

  const gameLoop = useCallback(() => {
    if (!runningRef.current) return

    // Move paddle
    const paddle = paddleRef.current
    if (keysRef.current.has('ArrowLeft') || keysRef.current.has('a')) {
      paddleRef.current = Math.max(0, paddle - 6)
    }
    if (keysRef.current.has('ArrowRight') || keysRef.current.has('d')) {
      paddleRef.current = Math.min(WIDTH - PADDLE_W, paddle + 6)
    }

    const ball = ballRef.current
    ball.x += ball.vx
    ball.y += ball.vy

    // Wall collision
    if (ball.x - BALL_R <= 0 || ball.x + BALL_R >= WIDTH) {
      ball.vx *= -1
      ball.x = Math.max(BALL_R, Math.min(WIDTH - BALL_R, ball.x))
      playSound('wall')
    }
    if (ball.y - BALL_R <= 0) {
      ball.vy *= -1
      ball.y = BALL_R
      playSound('wall')
    }

    // Paddle collision
    if (
      ball.y + BALL_R >= HEIGHT - 30 &&
      ball.y - BALL_R <= HEIGHT - 30 + PADDLE_H &&
      ball.x >= paddleRef.current &&
      ball.x <= paddleRef.current + PADDLE_W
    ) {
      ball.vy = -Math.abs(ball.vy)
      const hitPos = (ball.x - paddleRef.current) / PADDLE_W
      ball.vx = (hitPos - 0.5) * 8
      ball.y = HEIGHT - 30 - BALL_R
      playSound('paddle')
    }

    // Brick collision
    let allClear = true
    bricksRef.current.forEach((row, r) => {
      row.forEach((exists, c) => {
        if (!exists) return
        allClear = false
        const bx = 10 + c * BRICK_W
        const by = 30 + r * BRICK_H
        if (
          ball.x + BALL_R > bx &&
          ball.x - BALL_R < bx + BRICK_W &&
          ball.y + BALL_R > by &&
          ball.y - BALL_R < by + BRICK_H
        ) {
          row[c] = false
          ball.vy *= -1
          scoreRef.current += 10
          setScore(scoreRef.current)
          playSound('brick')
        }
      })
    })

    if (allClear) {
      runningRef.current = false
      setWon(true)
      playSound('win')
      draw()
      return
    }

    // Ball lost
    if (ball.y > HEIGHT + BALL_R) {
      livesRef.current -= 1
      setLives(livesRef.current)
      playSound('die')
      if (livesRef.current <= 0) {
        runningRef.current = false
        setGameOver(true)
        draw()
        return
      } else {
        ball.x = WIDTH / 2
        ball.y = HEIGHT - 80
        ball.vx = 3
        ball.vy = -3
      }
    }

    draw()
    animRef.current = requestAnimationFrame(gameLoop)
  }, [draw, playSound])

  const startGame = useCallback(() => {
    if (animRef.current) cancelAnimationFrame(animRef.current)
    paddleRef.current = WIDTH / 2 - PADDLE_W / 2
    ballRef.current = { x: WIDTH / 2, y: HEIGHT - 80, vx: 3, vy: -3 }
    scoreRef.current = 0
    livesRef.current = 3
    initBricks()
    setScore(0)
    setLives(3)
    setGameOver(false)
    setWon(false)
    setStarted(true)
    runningRef.current = true
    draw()
    playSound('start')
    animRef.current = requestAnimationFrame(gameLoop)
  }, [initBricks, draw, gameLoop, playSound])

  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if (['ArrowLeft', 'ArrowRight', 'a', 'd'].includes(e.key)) {
        e.preventDefault()
        keysRef.current.add(e.key)
      }
    }
    const up = (e: KeyboardEvent) => {
      keysRef.current.delete(e.key)
    }
    window.addEventListener('keydown', down)
    window.addEventListener('keyup', up)
    draw()
    return () => {
      window.removeEventListener('keydown', down)
      window.removeEventListener('keyup', up)
      if (animRef.current) cancelAnimationFrame(animRef.current)
    }
  }, [draw])

  // Save high score
  useEffect(() => {
    if (score > highScore) {
      setHighScore(score)
      try { localStorage.setItem('breakout-high-score', String(score)) } catch {}
    }
  }, [score, highScore])

  return (
    <div style={{
      display: 'flex', flexDirection: 'column', alignItems: 'center',
      height: '100%', background: '#1e1e2e', color: '#cdd6f4', padding: '8px', gap: '8px',
      userSelect: 'none',
    }}>
      <div style={{ display: 'flex', gap: '14px', fontSize: '14px' }}>
        <span style={{ color: '#a6e3a1' }}>分数: <b>{score}</b></span>
        <span style={{ color: '#f9e2af' }}>最高: <b>{highScore}</b></span>
        <span style={{ color: '#f38ba8' }}>
          {Array.from({ length: lives }, () => '❤').join('')}
        </span>
      </div>

      <canvas
        ref={canvasRef}
        width={WIDTH}
        height={HEIGHT}
        style={{ border: '2px solid #45475a', borderRadius: '8px', maxWidth: '100%' }}
      />

      {won && (
        <div style={{
          background: 'linear-gradient(135deg, #a6e3a1 0%, #89b4fa 100%)',
          color: '#11111b', padding: '10px 20px', borderRadius: '8px',
          fontWeight: 700, fontSize: '14px',
        }}>
          恭喜通关！得分: {score}
        </div>
      )}

      {gameOver && (
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontSize: '14px', color: '#f38ba8', fontWeight: 600 }}>游戏结束!</div>
          <div style={{ fontSize: '12px', color: '#a6adc8', marginTop: '4px' }}>
            {score >= highScore && score > 0 ? '新纪录!' : `最高: ${highScore}`}
          </div>
        </div>
      )}

      <button
        onClick={startGame}
        style={{
          padding: '8px 24px', background: '#a6e3a1', color: '#1e1e2e',
          border: 'none', borderRadius: '8px', cursor: 'pointer', fontSize: '14px', fontWeight: 600,
        }}
      >
        {started ? '重新开始' : '开始游戏'}
      </button>

      <div style={{ fontSize: '11px', color: '#6c7086', textAlign: 'center', lineHeight: 1.6 }}>
        ← → / A D 移动挡板
        <br />
        反弹球打破所有砖块！
      </div>
    </div>
  )
}
