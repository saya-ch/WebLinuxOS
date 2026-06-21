import { useState, useEffect, useCallback } from 'react'

const SIZE = 4
const CELL_GAP = 8

const TILE_COLORS: Record<number, { bg: string; text: string }> = {
  0: { bg: '#313244', text: '#cdd6f4' },
  2: { bg: '#eee', text: '#11111b' },
  4: { bg: '#f2cdcd', text: '#11111b' },
  8: { bg: '#f38ba8', text: '#fff' },
  16: { bg: '#fab387', text: '#11111b' },
  32: { bg: '#f9e2af', text: '#11111b' },
  64: { bg: '#f5c2e7', text: '#11111b' },
  128: { bg: '#cba6f7', text: '#11111b' },
  256: { bg: '#89b4fa', text: '#11111b' },
  512: { bg: '#74c7ec', text: '#11111b' },
  1024: { bg: '#89dceb', text: '#11111b' },
  2048: { bg: '#a6e3a1', text: '#11111b' },
  4096: { bg: '#f38ba8', text: '#fff' },
  8192: { bg: '#fab387', text: '#fff' },
}

function getColor(value: number): { bg: string; text: string } {
  return TILE_COLORS[value] || { bg: '#89b4fa', text: '#fff' }
}

function useSound() {
  const play = useCallback((type: 'merge' | 'move' | 'win' | 'lose' | 'start') => {
    try {
      const ctx = new (window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext)()
      const osc = ctx.createOscillator()
      const gain = ctx.createGain()
      osc.connect(gain)
      gain.connect(ctx.destination)
      gain.gain.value = 0.12
      switch (type) {
        case 'move':
          osc.frequency.value = 200
          gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.05)
          osc.start(ctx.currentTime)
          osc.stop(ctx.currentTime + 0.05)
          break
        case 'merge':
          osc.frequency.setValueAtTime(400, ctx.currentTime)
          osc.frequency.exponentialRampToValueAtTime(600, ctx.currentTime + 0.08)
          gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.1)
          osc.start(ctx.currentTime)
          osc.stop(ctx.currentTime + 0.1)
          break
        case 'win':
          osc.frequency.setValueAtTime(523, ctx.currentTime)
          osc.frequency.setValueAtTime(659, ctx.currentTime + 0.1)
          osc.frequency.setValueAtTime(784, ctx.currentTime + 0.2)
          osc.frequency.setValueAtTime(1047, ctx.currentTime + 0.3)
          gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.5)
          osc.start(ctx.currentTime)
          osc.stop(ctx.currentTime + 0.5)
          break
        case 'lose':
          osc.frequency.setValueAtTime(400, ctx.currentTime)
          osc.frequency.exponentialRampToValueAtTime(100, ctx.currentTime + 0.5)
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
  return play
}

type Board = number[][]

export default function Game2048() {
  const playSound = useSound()

  const [board, setBoard] = useState<Board>(() => {
    const b = Array.from({ length: SIZE }, () => Array(SIZE).fill(0))
    const addRandom = () => {
      const empty: [number, number][] = []
      b.forEach((row, r) => row.forEach((_, c) => { if (b[r][c] === 0) empty.push([r, c]) }))
      if (empty.length > 0) {
        const [r, c] = empty[Math.floor(Math.random() * empty.length)]
        b[r][c] = Math.random() < 0.9 ? 2 : 4
      }
    }
    addRandom(); addRandom()
    return b
  })

  const [score, setScore] = useState(0)
  const [highScore, setHighScore] = useState(() => {
    try { return parseInt(localStorage.getItem('2048-high-score') || '0', 10) } catch { return 0 }
  })
  const [gameOver, setGameOver] = useState(false)
  const [won, setWon] = useState(false)
  const [started, setStarted] = useState(false)

  const addRandom = useCallback((b: Board): Board => {
    const nb = b.map(row => [...row])
    const empty: [number, number][] = []
    nb.forEach((row, r) => row.forEach((_, c) => { if (nb[r][c] === 0) empty.push([r, c]) }))
    if (empty.length > 0) {
      const [r, c] = empty[Math.floor(Math.random() * empty.length)]
      nb[r][c] = Math.random() < 0.9 ? 2 : 4
    }
    return nb
  }, [])

  const canMove = useCallback((b: Board): boolean => {
    for (let r = 0; r < SIZE; r++) {
      for (let c = 0; c < SIZE; c++) {
        if (b[r][c] === 0) return true
        if (c < SIZE - 1 && b[r][c] === b[r][c + 1]) return true
        if (r < SIZE - 1 && b[r][c] === b[r + 1][c]) return true
      }
    }
    return false
  }, [])

  const move = useCallback((b: Board, dir: 'up' | 'down' | 'left' | 'right'): { board: Board; score: number; moved: boolean } => {
    let nb = b.map(row => [...row])
    let scoreAdd = 0
    let moved = false

    const rotateLeft = (grid: Board): Board => {
      const n = grid.length
      const res: Board = Array.from({ length: n }, () => Array(n).fill(0))
      for (let r = 0; r < n; r++) {
        for (let c = 0; c < n; c++) {
          res[n - 1 - c][r] = grid[r][c]
        }
      }
      return res
    }

    const rotateRight = (grid: Board): Board => {
      const n = grid.length
      const res: Board = Array.from({ length: n }, () => Array(n).fill(0))
      for (let r = 0; r < n; r++) {
        for (let c = 0; c < n; c++) {
          res[c][n - 1 - r] = grid[r][c]
        }
      }
      return res
    }

    const compress = (row: number[]): { row: number[]; score: number; merged: boolean[] } => {
      let score = 0
      const merged: boolean[] = row.map(() => false)
      const filtered = row.filter(v => v !== 0)
      const newRow: number[] = []
      for (let i = 0; i < filtered.length; i++) {
        if (i < filtered.length - 1 && filtered[i] === filtered[i + 1]) {
          const v = filtered[i] * 2
          newRow.push(v)
          score += v
          merged[newRow.length - 1] = true
          i++
        } else {
          newRow.push(filtered[i])
        }
      }
      while (newRow.length < SIZE) newRow.push(0)
      return { row: newRow, score, merged }
    }

    const steps = dir === 'up' ? 1 : dir === 'down' ? 3 : dir === 'left' ? 0 : 2
    for (let i = 0; i < steps; i++) nb = rotateLeft(nb)

    for (let r = 0; r < SIZE; r++) {
      const old = [...nb[r]]
      const { row: newRow, score: s } = compress(nb[r])
      nb[r] = newRow
      scoreAdd += s
      if (old.join(',') !== newRow.join(',')) moved = true
    }

    for (let i = 0; i < (4 - steps) % 4; i++) nb = rotateRight(nb)

    return { board: nb, score: scoreAdd, moved }
  }, [])

  const handleMove = useCallback((dir: 'up' | 'down' | 'left' | 'right') => {
    if (gameOver) return
    const { board: nb, score: s, moved } = move(board, dir)
    if (!moved) return

    let newBoard = addRandom(nb)
    setBoard(newBoard)
    setScore(prev => {
      const ns = prev + s
      if (ns > highScore) {
        setHighScore(ns)
        try { localStorage.setItem('2048-high-score', String(ns)) } catch {}
      }
      return ns
    })

    if (s > 0) playSound('merge')
    else playSound('move')

    if (newBoard.some(row => row.some(v => v >= 2048)) && !won) {
      setWon(true)
      playSound('win')
    }
    if (!canMove(newBoard)) {
      setGameOver(true)
      playSound('lose')
    }
  }, [board, gameOver, highScore, move, addRandom, canMove, playSound, won])

  const resetGame = useCallback(() => {
    const b: Board = Array.from({ length: SIZE }, () => Array(SIZE).fill(0))
    const addRandom = () => {
      const empty: [number, number][] = []
      b.forEach((row, r) => row.forEach((_, c) => { if (b[r][c] === 0) empty.push([r, c]) }))
      if (empty.length > 0) {
        const [r, c] = empty[Math.floor(Math.random() * empty.length)]
        b[r][c] = Math.random() < 0.9 ? 2 : 4
      }
    }
    addRandom(); addRandom()
    setBoard(b)
    setScore(0)
    setGameOver(false)
    setWon(false)
    setStarted(true)
    playSound('start')
  }, [playSound])

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      switch (e.key) {
        case 'ArrowUp':
        case 'w':
        case 'W':
          e.preventDefault()
          handleMove('up')
          break
        case 'ArrowDown':
        case 's':
        case 'S':
          e.preventDefault()
          handleMove('down')
          break
        case 'ArrowLeft':
        case 'a':
        case 'A':
          e.preventDefault()
          handleMove('left')
          break
        case 'ArrowRight':
        case 'd':
        case 'D':
          e.preventDefault()
          handleMove('right')
          break
        case 'r':
        case 'R':
          resetGame()
          break
      }
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [handleMove, resetGame])

  const cellSize = 72

  return (
    <div style={{
      display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
      height: '100%', background: '#1e1e2e', color: '#cdd6f4', padding: '12px', gap: '12px',
      userSelect: 'none',
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
        <span style={{ fontSize: '22px', fontWeight: 700 }}>2048</span>
        <div style={{ display: 'flex', gap: '12px', fontSize: '13px' }}>
          <div style={{ background: '#313244', padding: '6px 12px', borderRadius: '8px', textAlign: 'center' }}>
            <div style={{ color: '#a6adc8', fontSize: '10px' }}>分数</div>
            <div style={{ color: '#a6e3a1', fontWeight: 700 }}>{score}</div>
          </div>
          <div style={{ background: '#313244', padding: '6px 12px', borderRadius: '8px', textAlign: 'center' }}>
            <div style={{ color: '#a6adc8', fontSize: '10px' }}>最高</div>
            <div style={{ color: '#f9e2af', fontWeight: 700 }}>{highScore}</div>
          </div>
        </div>
      </div>

      <div style={{
        display: 'grid',
        gridTemplateColumns: `repeat(${SIZE}, ${cellSize}px)`,
        gap: `${CELL_GAP}px`,
        background: '#45475a',
        padding: `${CELL_GAP}px`,
        borderRadius: '12px',
        position: 'relative',
      }}>
        {board.map((row, r) =>
          row.map((val, c) => {
            const { bg, text } = getColor(val)
            return (
              <div
                key={`${r}-${c}`}
                style={{
                  width: cellSize,
                  height: cellSize,
                  background: bg,
                  borderRadius: '6px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: val >= 1000 ? '16px' : val >= 100 ? '20px' : '24px',
                  fontWeight: 700,
                  color: text,
                  transition: 'background 0.1s',
                }}
              >
                {val || ''}
              </div>
            )
          })
        )}
      </div>

      {won && !gameOver && (
        <div style={{
          background: '#a6e3a1', color: '#11111b', padding: '10px 20px', borderRadius: '8px',
          fontWeight: 700, fontSize: '16px',
        }}>
          你赢了！按 R 继续挑战更高分
        </div>
      )}

      {gameOver && (
        <div style={{ textAlign: 'center', display: 'flex', flexDirection: 'column', gap: '8px' }}>
          <div style={{ fontSize: '16px', color: '#f38ba8', fontWeight: 600 }}>游戏结束!</div>
          <div style={{ fontSize: '13px', color: '#a6adc8' }}>
            最终得分: {score} {score >= highScore && score > 0 ? '(新纪录!)' : ''}
          </div>
        </div>
      )}

      <button
        onClick={resetGame}
        style={{
          padding: '8px 24px', background: '#89b4fa', color: '#1e1e2e',
          border: 'none', borderRadius: '8px', cursor: 'pointer', fontSize: '14px', fontWeight: 600,
        }}
      >
        {started ? '重新开始' : '开始游戏'}
      </button>

      <div style={{ fontSize: '11px', color: '#6c7086', textAlign: 'center', lineHeight: 1.6 }}>
        方向键/WASD 移动方块 | R 重新开始
        <br />
        相同数字的方块会合并，目标是得到 2048！
      </div>
    </div>
  )
}
