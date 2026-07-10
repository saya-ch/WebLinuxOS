import { useRef, useEffect, useState, useCallback } from 'react'

const COLS = 10
const ROWS = 20
const CELL = 22
const WIDTH = COLS * CELL
const HEIGHT = ROWS * CELL

const COLORS = ['#11111b', '#89b4fa', '#a6e3a1', '#f38ba8', '#f9e2af', '#cba6f7', '#94e2d5', '#fab387']
const COLOR_NAMES = ['空', 'I形', 'O形', 'T形', 'L形', 'J形', 'S形', 'Z形']

const SHAPES = [
  [[1, 1, 1, 1]],
  [[1, 1], [1, 1]],
  [[0, 1, 0], [1, 1, 1]],
  [[1, 0, 0], [1, 1, 1]],
  [[0, 0, 1], [1, 1, 1]],
  [[1, 1, 0], [0, 1, 1]],
  [[0, 1, 1], [1, 1, 0]],
]

type Piece = {
  shape: number[][]
  color: number
  x: number
  y: number
}

function useSound() {
  const playSound = useCallback((type: 'move' | 'rotate' | 'drop' | 'clear' | 'die' | 'start') => {
    try {
      const ctx = new (window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext)()
      const osc = ctx.createOscillator()
      const gain = ctx.createGain()
      osc.connect(gain)
      gain.connect(ctx.destination)
      gain.gain.value = 0.12

      switch (type) {
        case 'move':
          osc.frequency.value = 300
          gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.05)
          osc.start(ctx.currentTime)
          osc.stop(ctx.currentTime + 0.05)
          break
        case 'rotate':
          osc.frequency.value = 400
          gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.06)
          osc.start(ctx.currentTime)
          osc.stop(ctx.currentTime + 0.06)
          break
        case 'drop':
          osc.frequency.setValueAtTime(500, ctx.currentTime)
          gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.08)
          osc.start(ctx.currentTime)
          osc.stop(ctx.currentTime + 0.08)
          break
        case 'clear':
          osc.frequency.setValueAtTime(523, ctx.currentTime)
          osc.frequency.setValueAtTime(659, ctx.currentTime + 0.08)
          osc.frequency.setValueAtTime(784, ctx.currentTime + 0.16)
          gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.25)
          osc.start(ctx.currentTime)
          osc.stop(ctx.currentTime + 0.25)
          break
        case 'die':
          osc.frequency.setValueAtTime(400, ctx.currentTime)
          osc.frequency.exponentialRampToValueAtTime(80, ctx.currentTime + 0.5)
          gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.5)
          osc.start(ctx.currentTime)
          osc.stop(ctx.currentTime + 0.5)
          break
        case 'start':
          osc.frequency.setValueAtTime(330, ctx.currentTime)
          osc.frequency.setValueAtTime(440, ctx.currentTime + 0.1)
          osc.frequency.setValueAtTime(550, ctx.currentTime + 0.2)
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

function randomPiece(): Piece {
  const idx = Math.floor(Math.random() * SHAPES.length)
  return {
    shape: SHAPES[idx].map((row) => [...row]),
    color: idx + 1,
    x: Math.floor((COLS - SHAPES[idx][0].length) / 2),
    y: 0,
  }
}

function rotateShape(shape: number[][]): number[][] {
  const rows = shape.length
  const cols = shape[0].length
  const rotated: number[][] = []
  for (let c = 0; c < cols; c++) {
    rotated.push([])
    for (let r = rows - 1; r >= 0; r--) {
      rotated[c].push(shape[r][c])
    }
  }
  return rotated
}

function drawGhost(ctx: CanvasRenderingContext2D, piece: Piece, board: number[][], CELL_SIZE: number) {
  let ghostY = piece.y
  while (!isCollisionStatic(piece.shape, piece.x, ghostY + 1, board)) {
    ghostY++
  }
  if (ghostY === piece.y) return
  piece.shape.forEach((row, dr) => {
    row.forEach((val, dc) => {
      if (val) {
        ctx.strokeStyle = COLORS[piece.color] + '60'
        ctx.lineWidth = 1
        ctx.strokeRect((piece.x + dc) * CELL_SIZE + 1, (ghostY + dr) * CELL_SIZE + 1, CELL_SIZE - 2, CELL_SIZE - 2)
      }
    })
  })
}

function isCollisionStatic(shape: number[][], x: number, y: number, board: number[][]): boolean {
  for (let r = 0; r < shape.length; r++) {
    for (let c = 0; c < shape[r].length; c++) {
      if (!shape[r][c]) continue
      const bx = x + c
      const by = y + r
      if (bx < 0 || bx >= COLS || by >= ROWS) return true
      if (by >= 0 && board[by][bx]) return true
    }
  }
  return false
}

export default function GameTetris() {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const nextCanvasRef = useRef<HTMLCanvasElement>(null)
  const boardRef = useRef<number[][]>(Array.from({ length: ROWS }, () => Array(COLS).fill(0)))
  const pieceRef = useRef<Piece>(randomPiece())
  const nextPieceRef = useRef<Piece>(randomPiece())
  const scoreRef = useRef(0)
  const linesRef = useRef(0)
  const runningRef = useRef(false)
  const pausedRef = useRef(false)
  const speedRef = useRef(800)
  const baseSpeedRef = useRef(800)
  const gameLoopRef = useRef<() => void>(() => {})

  const playSound = useSound()

  const [score, setScore] = useState(0)
  const [lines, setLines] = useState(0)
  const [highScore, setHighScore] = useState(() => {
    try { return parseInt(localStorage.getItem('tetris-high-score') || '0', 10) } catch { return 0 }
  })
  const [gameOver, setGameOver] = useState(false)
  const [started, setStarted] = useState(false)
  const [paused, setPaused] = useState(false)
  const [level, setLevel] = useState(() => {
    try { return parseInt(localStorage.getItem('tetris-level') || '1', 10) } catch { return 1 }
  })
  const [nextName, setNextName] = useState('')

  const drawBoard = useCallback(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    ctx.fillStyle = '#11111b'
    ctx.fillRect(0, 0, WIDTH, HEIGHT)

    for (let r = 0; r < ROWS; r++) {
      for (let c = 0; c < COLS; c++) {
        ctx.fillStyle = boardRef.current[r][c] ? COLORS[boardRef.current[r][c]] : '#181825'
        ctx.fillRect(c * CELL + 1, r * CELL + 1, CELL - 2, CELL - 2)
      }
    }

    const piece = pieceRef.current
    // Ghost piece
    drawGhost(ctx, piece, boardRef.current, CELL)
    // Active piece
    piece.shape.forEach((row, dr) => {
      row.forEach((val, dc) => {
        if (val && piece.y + dr >= 0) {
          ctx.fillStyle = COLORS[piece.color]
          ctx.fillRect((piece.x + dc) * CELL + 1, (piece.y + dr) * CELL + 1, CELL - 2, CELL - 2)
          // Highlight
          ctx.fillStyle = 'rgba(255,255,255,0.2)'
          ctx.fillRect((piece.x + dc) * CELL + 2, (piece.y + dr) * CELL + 2, CELL - 6, 3)
          ctx.fillRect((piece.x + dc) * CELL + 2, (piece.y + dr) * CELL + 2, 3, CELL - 6)
        }
      })
    })
  }, [])

  const drawNext = useCallback(() => {
    const canvas = nextCanvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    ctx.fillStyle = '#181825'
    ctx.fillRect(0, 0, 120, 100)

    const piece = nextPieceRef.current
    const shape = piece.shape
    const blockSize = 18
    const offsetX = (120 - shape[0].length * blockSize) / 2
    const offsetY = (100 - shape.length * blockSize) / 2

    shape.forEach((row, dr) => {
      row.forEach((val, dc) => {
        if (val) {
          ctx.fillStyle = COLORS[piece.color]
          ctx.fillRect(offsetX + dc * blockSize + 1, offsetY + dr * blockSize + 1, blockSize - 2, blockSize - 2)
        }
      })
    })
    setNextName(COLOR_NAMES[piece.color])
  }, [])

  const isCollision = useCallback((shape: number[][], x: number, y: number): boolean => {
    return isCollisionStatic(shape, x, y, boardRef.current)
  }, [])

  const lockPiece = useCallback(() => {
    const piece = pieceRef.current
    piece.shape.forEach((row, dr) => {
      row.forEach((val, dc) => {
        if (val && piece.y + dr >= 0) {
          boardRef.current[piece.y + dr][piece.x + dc] = piece.color
        }
      })
    })
  }, [])

  const clearLines = useCallback(() => {
    const board = boardRef.current
    let cleared = 0
    for (let r = ROWS - 1; r >= 0; r--) {
      if (board[r].every((cell) => cell !== 0)) {
        board.splice(r, 1)
        board.unshift(Array(COLS).fill(0))
        cleared++
        r++
      }
    }
    if (cleared > 0) {
      linesRef.current += cleared
      scoreRef.current += [0, 100, 300, 500, 800][cleared] * level
      setLines(linesRef.current)
      setScore(scoreRef.current)
      baseSpeedRef.current = Math.max(100, 900 - linesRef.current * 15 - (level - 1) * 50)
      speedRef.current = baseSpeedRef.current
      playSound('clear')
    }
  }, [level, playSound])

  const spawnPiece = useCallback(() => {
    pieceRef.current = nextPieceRef.current
    nextPieceRef.current = randomPiece()
    drawNext()
    if (isCollision(pieceRef.current.shape, pieceRef.current.x, pieceRef.current.y)) {
      runningRef.current = false
      playSound('die')
      setGameOver(true)
      setStarted(false)
    }
  }, [isCollision, drawNext, playSound])

  const moveDown = useCallback((): boolean => {
    const piece = pieceRef.current
    if (!isCollision(piece.shape, piece.x, piece.y + 1)) {
      pieceRef.current = { ...piece, y: piece.y + 1 }
      drawBoard()
      return true
    }
    lockPiece()
    clearLines()
    spawnPiece()
    drawBoard()
    return false
  }, [isCollision, drawBoard, lockPiece, clearLines, spawnPiece])

  const moveHorizontal = useCallback((dx: number) => {
    const piece = pieceRef.current
    if (!isCollision(piece.shape, piece.x + dx, piece.y)) {
      pieceRef.current = { ...piece, x: piece.x + dx }
      drawBoard()
      playSound('move')
    }
  }, [isCollision, drawBoard, playSound])

  const rotate = useCallback(() => {
    const piece = pieceRef.current
    const rotated = rotateShape(piece.shape)
    // Wall kick
    const kicks = [0, -1, 1, -2, 2]
    for (const kick of kicks) {
      if (!isCollision(rotated, piece.x + kick, piece.y)) {
        pieceRef.current = { ...piece, shape: rotated, x: piece.x + kick }
        drawBoard()
        playSound('rotate')
        return
      }
    }
  }, [isCollision, drawBoard, playSound])

  const hardDrop = useCallback(() => {
    const piece = pieceRef.current
    let dropY = piece.y
    while (!isCollision(piece.shape, piece.x, dropY + 1)) {
      dropY++
    }
    scoreRef.current += (dropY - piece.y) * 2
    setScore(scoreRef.current)
    pieceRef.current = { ...piece, y: dropY }
    playSound('drop')
    moveDown()
  }, [isCollision, moveDown, playSound])

  useEffect(() => {
    gameLoopRef.current = () => {
      if (!runningRef.current || pausedRef.current) return
      moveDown()
      setTimeout(() => gameLoopRef.current(), speedRef.current)
    }
  }, [moveDown])

  const startGame = () => {
    boardRef.current = Array.from({ length: ROWS }, () => Array(COLS).fill(0))
    pieceRef.current = randomPiece()
    nextPieceRef.current = randomPiece()
    scoreRef.current = 0
    linesRef.current = 0
    baseSpeedRef.current = Math.max(100, 900 - (level - 1) * 100)
    speedRef.current = baseSpeedRef.current
    setScore(0)
    setLines(0)
    setGameOver(false)
    setStarted(true)
    setPaused(false)
    pausedRef.current = false
    runningRef.current = true
    drawBoard()
    drawNext()
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
    try { localStorage.setItem('tetris-level', String(newLevel)) } catch {}
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
      switch (e.key) {
        case 'ArrowLeft':
        case 'a':
        case 'A':
          e.preventDefault()
          moveHorizontal(-1)
          break
        case 'ArrowRight':
        case 'd':
        case 'D':
          e.preventDefault()
          moveHorizontal(1)
          break
        case 'ArrowDown':
        case 's':
        case 'S':
          e.preventDefault()
          moveDown()
          break
        case 'ArrowUp':
        case 'w':
        case 'W':
          e.preventDefault()
          rotate()
          break
        case ' ':
          e.preventDefault()
          hardDrop()
          break
      }
    }
    window.addEventListener('keydown', handleKey)
    drawBoard()
    drawNext()
    return () => window.removeEventListener('keydown', handleKey)
  }, [drawBoard, drawNext, moveDown, moveHorizontal, rotate, hardDrop, togglePause])

  // Save high score
  useEffect(() => {
    if (score > highScore) {
      setHighScore(score)
      try { localStorage.setItem('tetris-high-score', String(score)) } catch {}
    }
  }, [score, highScore])

  const levelLabels = ['新手', '简单', '普通', '困难', '大师']

  return (
    <div style={{
      display: 'flex', height: '100%', background: '#1e1e2e', color: '#cdd6f4',
      alignItems: 'center', justifyContent: 'center', gap: '12px', padding: '6px',
      userSelect: 'none',
    }}>
      <canvas
        ref={canvasRef}
        width={WIDTH}
        height={HEIGHT}
        style={{ border: '2px solid #45475a', borderRadius: '6px' }}
      />

      <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', minWidth: '110px', textAlign: 'center' }}>
        {!started && !gameOver && (
          <select
            value={level}
            onChange={(e) => handleLevelChange(Number(e.target.value))}
            style={{ padding: '4px 8px', borderRadius: '6px', border: '1px solid #45475a', background: '#313244', color: '#cdd6f4', fontSize: '11px' }}
          >
            {levelLabels.map((l, i) => <option key={i} value={i + 1}>{l}</option>)}
          </select>
        )}

        <div>
          <div style={{ fontSize: '10px', color: '#a6adc8' }}>下一个</div>
          <div style={{ fontSize: '10px', color: COLORS[nextPieceRef.current.color], fontWeight: 600 }}>{nextName}</div>
          <canvas
            ref={nextCanvasRef}
            width={120}
            height={100}
            style={{ border: '1px solid #45475a', borderRadius: '4px', marginTop: '4px' }}
          />
        </div>

        <div>
          <div style={{ fontSize: '10px', color: '#a6adc8' }}>分数</div>
          <div style={{ fontSize: '22px', fontWeight: 700, color: '#a6e3a1' }}>{score}</div>
        </div>

        <div>
          <div style={{ fontSize: '10px', color: '#a6adc8' }}>行数</div>
          <div style={{ fontSize: '18px', fontWeight: 700, color: '#89b4fa' }}>{lines}</div>
        </div>

        <div>
          <div style={{ fontSize: '10px', color: '#a6adc8' }}>最高</div>
          <div style={{ fontSize: '16px', fontWeight: 600, color: '#f9e2af' }}>{highScore}</div>
        </div>

        {!started && !gameOver && (
          <button
            onClick={startGame}
            style={{
              padding: '8px 16px', background: '#a6e3a1', color: '#1e1e2e',
              border: 'none', borderRadius: '6px', cursor: 'pointer', fontSize: '13px', fontWeight: 600,
            }}
          >
            开始游戏
          </button>
        )}

        {started && !gameOver && (
          <button
            onClick={togglePause}
            style={{
              padding: '6px 12px', background: paused ? '#a6e3a1' : '#f9e2af', color: '#1e1e2e',
              border: 'none', borderRadius: '6px', cursor: 'pointer', fontSize: '12px', fontWeight: 600,
            }}
          >
            {paused ? '继续' : '暂停'}
          </button>
        )}

        {gameOver && (
          <div>
            <div style={{ fontSize: '14px', color: '#f38ba8', fontWeight: 600 }}>游戏结束!</div>
            <div style={{ fontSize: '11px', color: '#a6adc8', marginTop: '4px' }}>
              {score >= highScore && score > 0 ? '新纪录!' : `最高: ${highScore}`}
            </div>
            <button
              onClick={startGame}
              style={{
                marginTop: '8px', padding: '8px 16px', background: '#89b4fa', color: '#1e1e2e',
                border: 'none', borderRadius: '6px', cursor: 'pointer', fontSize: '13px', fontWeight: 600,
              }}
            >
              重新开始
            </button>
          </div>
        )}

        <div style={{ fontSize: '10px', color: '#6c7086', lineHeight: 1.6, marginTop: '4px' }}>
          ← → 移动
          <br />
          ↑ 旋转
          <br />
          ↓ 加速
          <br />
          空格 硬降
          <br />
          ESC 暂停
        </div>
      </div>

      {paused && (
        <div style={{
          position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)',
          background: 'rgba(0,0,0,0.85)', padding: '16px 32px', borderRadius: '12px',
          fontSize: '22px', fontWeight: 700, color: '#f9e2af', zIndex: 10,
          boxShadow: '0 4px 24px rgba(0,0,0,0.5)',
        }}>
          PAUSED
        </div>
      )}
    </div>
  )
}
