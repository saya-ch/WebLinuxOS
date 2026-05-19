import { useRef, useEffect, useState, useCallback } from 'react'

const COLS = 10
const ROWS = 20
const CELL = 20
const WIDTH = COLS * CELL
const HEIGHT = ROWS * CELL

const COLORS = ['#11111b', '#89b4fa', '#a6e3a1', '#f38ba8', '#f9e2af', '#cba6f7', '#94e2d5', '#fab387']

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

export default function GameTetris() {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const nextCanvasRef = useRef<HTMLCanvasElement>(null)
  const boardRef = useRef<number[][]>(
    Array.from({ length: ROWS }, () => Array(COLS).fill(0))
  )
  const pieceRef = useRef<Piece>(randomPiece())
  const nextPieceRef = useRef<Piece>(randomPiece())
  const scoreRef = useRef(0)
  const linesRef = useRef(0)
  const runningRef = useRef(false)
  const speedRef = useRef(800)

  const [score, setScore] = useState(0)
  const [lines, setLines] = useState(0)
  const [gameOver, setGameOver] = useState(false)
  const [started, setStarted] = useState(false)

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
    piece.shape.forEach((row, dr) => {
      row.forEach((val, dc) => {
        if (val && piece.y + dr >= 0) {
          ctx.fillStyle = COLORS[piece.color]
          ctx.fillRect((piece.x + dc) * CELL + 1, (piece.y + dr) * CELL + 1, CELL - 2, CELL - 2)
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
    ctx.fillRect(0, 0, 100, 80)

    const piece = nextPieceRef.current
    const shape = piece.shape
    const offsetX = (100 - shape[0].length * 16) / 2
    const offsetY = (80 - shape.length * 16) / 2

    shape.forEach((row, dr) => {
      row.forEach((val, dc) => {
        if (val) {
          ctx.fillStyle = COLORS[piece.color]
          ctx.fillRect(offsetX + dc * 16 + 1, offsetY + dr * 16 + 1, 14, 14)
        }
      })
    })
  }, [])

  const isCollision = (shape: number[][], x: number, y: number): boolean => {
    for (let r = 0; r < shape.length; r++) {
      for (let c = 0; c < shape[r].length; c++) {
        if (!shape[r][c]) continue
        const bx = x + c
        const by = y + r
        if (bx < 0 || bx >= COLS || by >= ROWS) return true
        if (by >= 0 && boardRef.current[by][bx]) return true
      }
    }
    return false
  }

  const lockPiece = () => {
    const piece = pieceRef.current
    piece.shape.forEach((row, dr) => {
      row.forEach((val, dc) => {
        if (val && piece.y + dr >= 0) {
          boardRef.current[piece.y + dr][piece.x + dc] = piece.color
        }
      })
    })
  }

  const clearLines = () => {
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
      scoreRef.current += [0, 100, 300, 500, 800][cleared] || 800
      setLines(linesRef.current)
      setScore(scoreRef.current)
      speedRef.current = Math.max(100, 800 - linesRef.current * 20)
    }
  }

  const spawnPiece = () => {
    pieceRef.current = nextPieceRef.current
    nextPieceRef.current = randomPiece()
    drawNext()
    if (isCollision(pieceRef.current.shape, pieceRef.current.x, pieceRef.current.y)) {
      runningRef.current = false
      setGameOver(true)
      setStarted(false)
    }
  }

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
  }, [drawBoard, drawNext])

  const moveHorizontal = (dx: number) => {
    const piece = pieceRef.current
    if (!isCollision(piece.shape, piece.x + dx, piece.y)) {
      pieceRef.current = { ...piece, x: piece.x + dx }
      drawBoard()
    }
  }

  const rotate = () => {
    const piece = pieceRef.current
    const rotated = rotateShape(piece.shape)
    if (!isCollision(rotated, piece.x, piece.y)) {
      pieceRef.current = { ...piece, shape: rotated }
      drawBoard()
    }
  }

  const hardDrop = () => {
    const piece = pieceRef.current
    let dropY = piece.y
    while (!isCollision(piece.shape, piece.x, dropY + 1)) {
      dropY++
    }
    scoreRef.current += (dropY - piece.y) * 2
    setScore(scoreRef.current)
    pieceRef.current = { ...piece, y: dropY }
    moveDown()
  }

  const gameLoop = useCallback(() => {
    if (!runningRef.current) return
    moveDown()
    setTimeout(gameLoop, speedRef.current)
  }, [moveDown])

  const startGame = () => {
    boardRef.current = Array.from({ length: ROWS }, () => Array(COLS).fill(0))
    pieceRef.current = randomPiece()
    nextPieceRef.current = randomPiece()
    scoreRef.current = 0
    linesRef.current = 0
    speedRef.current = 800
    setScore(0)
    setLines(0)
    setGameOver(false)
    setStarted(true)
    runningRef.current = true
    drawBoard()
    drawNext()
    setTimeout(gameLoop, speedRef.current)
  }

  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (!runningRef.current) return
      switch (e.key) {
        case 'ArrowLeft':
        case 'a':
        case 'A':
          moveHorizontal(-1)
          break
        case 'ArrowRight':
        case 'd':
        case 'D':
          moveHorizontal(1)
          break
        case 'ArrowDown':
        case 's':
        case 'S':
          moveDown()
          break
        case 'ArrowUp':
        case 'w':
        case 'W':
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
  }, [drawBoard, drawNext, moveDown])

  return (
    <div style={{
      display: 'flex', height: '100%', background: '#1e1e2e', color: '#cdd6f4',
      alignItems: 'center', justifyContent: 'center', gap: '16px', padding: '8px',
    }}>
      <canvas
        ref={canvasRef}
        width={WIDTH}
        height={HEIGHT}
        style={{ border: '2px solid #45475a', borderRadius: '4px' }}
      />

      <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', minWidth: '100px', textAlign: 'center' }}>
        <div>
          <div style={{ fontSize: '11px', color: '#a6adc8' }}>下一个</div>
          <canvas
            ref={nextCanvasRef}
            width={100}
            height={80}
            style={{ border: '1px solid #45475a', borderRadius: '4px', marginTop: '4px' }}
          />
        </div>

        <div>
          <div style={{ fontSize: '11px', color: '#a6adc8' }}>分数</div>
          <div style={{ fontSize: '20px', fontWeight: 700, color: '#a6e3a1' }}>{score}</div>
        </div>

        <div>
          <div style={{ fontSize: '11px', color: '#a6adc8' }}>行数</div>
          <div style={{ fontSize: '20px', fontWeight: 700, color: '#89b4fa' }}>{lines}</div>
        </div>

        {!started && !gameOver && (
          <button
            onClick={startGame}
            style={{
              padding: '8px 16px', background: '#a6e3a1', color: '#1e1e2e',
              border: 'none', borderRadius: '6px', cursor: 'pointer', fontSize: '12px', fontWeight: 600,
            }}
          >
            开始游戏
          </button>
        )}

        {gameOver && (
          <div>
            <div style={{ fontSize: '14px', color: '#f38ba8', fontWeight: 600 }}>游戏结束!</div>
            <button
              onClick={startGame}
              style={{
                marginTop: '8px', padding: '8px 16px', background: '#89b4fa', color: '#1e1e2e',
                border: 'none', borderRadius: '6px', cursor: 'pointer', fontSize: '12px', fontWeight: 600,
              }}
            >
              重新开始
            </button>
          </div>
        )}

        <div style={{ fontSize: '10px', color: '#6c7086', lineHeight: 1.6 }}>
          ← → 移动<br />
          ↑ 旋转<br />
          ↓ 加速<br />
          空格 硬降
        </div>
      </div>
    </div>
  )
}