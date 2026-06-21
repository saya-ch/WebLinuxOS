import { useState, useEffect, useCallback, useMemo } from 'react'

const EMOJIS = ['🍎', '🍊', '🍋', '🍇', '🍓', '🍒', '🥝', '🍑', '🌸', '🌺', '🌻', '🌼', '⭐', '🌙', '☀️', '🌈', '🦋', '🐝', '🦊', '🐼', '🐨', '🦁', '🐯', '🦄', '🐉', '🦋', '🐙', '🦀', '🐠', '🦜', '🎸', '🎮', '🎯', '🎲', '🎭', '🎨']

type Card = {
  id: number
  emoji: string
  flipped: boolean
  matched: boolean
}

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr]
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]]
  }
  return a
}

function useSound() {
  const play = useCallback((type: 'flip' | 'match' | 'mismatch' | 'win' | 'start') => {
    try {
      const ctx = new (window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext)()
      const osc = ctx.createOscillator()
      const gain = ctx.createGain()
      osc.connect(gain)
      gain.connect(ctx.destination)
      gain.gain.value = 0.12
      switch (type) {
        case 'flip':
          osc.frequency.value = 600
          gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.06)
          osc.start(ctx.currentTime)
          osc.stop(ctx.currentTime + 0.06)
          break
        case 'match':
          osc.frequency.setValueAtTime(523, ctx.currentTime)
          osc.frequency.setValueAtTime(784, ctx.currentTime + 0.1)
          gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.2)
          osc.start(ctx.currentTime)
          osc.stop(ctx.currentTime + 0.2)
          break
        case 'mismatch':
          osc.frequency.value = 200
          gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.15)
          osc.start(ctx.currentTime)
          osc.stop(ctx.currentTime + 0.15)
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
          osc.frequency.setValueAtTime(440, ctx.currentTime)
          osc.frequency.setValueAtTime(550, ctx.currentTime + 0.1)
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

export default function GameMemory() {
  const playSound = useSound()

  const [difficulty, setDifficulty] = useState(() => {
    try { return parseInt(localStorage.getItem('memory-difficulty') || '2', 10) } catch { return 2 }
  })
  const [cards, setCards] = useState<Card[]>([])
  const [moves, setMoves] = useState(0)
  const [highScore, setHighScore] = useState<Record<number, number>>(() => {
    try { return JSON.parse(localStorage.getItem('memory-high-scores') || '{}') } catch { return {} }
  })
  const [gameOver, setGameOver] = useState(false)
  const [started, setStarted] = useState(false)
  const [selected, setSelected] = useState<number[]>([])
  const [locked, setLocked] = useState(false)

  const levels = [
    { label: '简单 (4x3)', pairs: 6, cols: 4, rows: 3 },
    { label: '普通 (4x4)', pairs: 8, cols: 4, rows: 4 },
    { label: '困难 (5x4)', pairs: 10, cols: 5, rows: 4 },
    { label: '大师 (6x4)', pairs: 12, cols: 6, rows: 4 },
    { label: '地狱 (6x5)', pairs: 15, cols: 6, rows: 5 },
  ]

  const level = levels[Math.min(difficulty - 1, levels.length - 1)]

  const initGame = useCallback(() => {
    const emojis = shuffle(EMOJIS).slice(0, level.pairs)
    const deck = shuffle([...emojis, ...emojis]).map((emoji, i) => ({
      id: i,
      emoji,
      flipped: false,
      matched: false,
    }))
    setCards(deck)
    setMoves(0)
    setGameOver(false)
    setSelected([])
    setLocked(false)
    setStarted(true)
    playSound('start')
  }, [level.pairs, playSound])

  const handleCardClick = useCallback((id: number) => {
    if (locked) return
    const card = cards.find(c => c.id === id)
    if (!card || card.flipped || card.matched) return
    if (selected.length === 2) return

    playSound('flip')
    const newCards = cards.map(c => c.id === id ? { ...c, flipped: true } : c)
    const newSelected = [...selected, id]
    setCards(newCards)
    setSelected(newSelected)

    if (newSelected.length === 2) {
      setMoves(m => m + 1)
      setLocked(true)
      const [a, b] = newSelected
      const cardA = newCards.find(c => c.id === a)!
      const cardB = newCards.find(c => c.id === b)!

      if (cardA.emoji === cardB.emoji) {
        setTimeout(() => {
          setCards(prev => prev.map(c =>
            c.id === a || c.id === b ? { ...c, matched: true } : c
          ))
          playSound('match')
          setSelected([])
          setLocked(false)
        }, 400)
      } else {
        setTimeout(() => {
          setCards(prev => prev.map(c =>
            c.id === a || c.id === b ? { ...c, flipped: false } : c
          ))
          playSound('mismatch')
          setSelected([])
          setLocked(false)
        }, 800)
      }
    }
  }, [cards, selected, locked, playSound])

  // Check win condition
  useEffect(() => {
    if (started && cards.length > 0 && cards.every(c => c.matched)) {
      setGameOver(true)
      playSound('win')
      const key = difficulty
      const prevBest = highScore[key] ?? Infinity
      if (moves < prevBest) {
        const newScores = { ...highScore, [key]: moves }
        setHighScore(newScores)
        try { localStorage.setItem('memory-high-scores', JSON.stringify(newScores)) } catch {}
      }
    }
  }, [cards, started, moves, difficulty, highScore, playSound])

  const handleDifficultyChange = (d: number) => {
    setDifficulty(d)
    try { localStorage.setItem('memory-difficulty', String(d)) } catch {}
  }

  const cardWidth = useMemo(() => {
    const maxWidth = 520
    const totalGap = (level.cols - 1) * 6
    return Math.min(Math.floor((maxWidth - totalGap) / level.cols), 70)
  }, [level.cols])

  const cardHeight = useMemo(() => Math.floor(cardWidth * 1.2), [cardWidth])

  return (
    <div style={{
      display: 'flex', flexDirection: 'column', alignItems: 'center',
      height: '100%', background: '#1e1e2e', color: '#cdd6f4', padding: '10px', gap: '10px',
      userSelect: 'none', overflow: 'auto',
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap', justifyContent: 'center' }}>
        <span style={{ fontSize: '20px', fontWeight: 700 }}>记忆翻牌</span>
        {!started && (
          <select
            value={difficulty}
            onChange={(e) => handleDifficultyChange(Number(e.target.value))}
            style={{ padding: '4px 8px', borderRadius: '6px', border: '1px solid #45475a', background: '#313244', color: '#cdd6f4', fontSize: '12px' }}
          >
            {levels.map((l, i) => <option key={i} value={i + 1}>{l.label}</option>)}
          </select>
        )}
        <div style={{ display: 'flex', gap: '10px', fontSize: '13px' }}>
          <div style={{ background: '#313244', padding: '4px 10px', borderRadius: '6px' }}>
            <span style={{ color: '#a6adc8' }}>步数: </span>
            <span style={{ color: '#a6e3a1', fontWeight: 600 }}>{moves}</span>
          </div>
          <div style={{ background: '#313244', padding: '4px 10px', borderRadius: '6px' }}>
            <span style={{ color: '#a6adc8' }}>最高: </span>
            <span style={{ color: '#f9e2af', fontWeight: 600 }}>
              {highScore[difficulty] ?? '-'}
            </span>
          </div>
        </div>
      </div>

      {started && (
        <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap', justifyContent: 'center' }}>
          {Array.from({ length: level.pairs * 2 }, (_, i) => {
            const matched = cards.find(c => c.id === i)?.matched
            return (
              <div
                key={i}
                style={{
                  width: cardWidth * 0.5,
                  height: cardHeight * 0.5,
                  background: matched ? '#a6e3a1' : '#45475a',
                  borderRadius: '4px',
                  opacity: matched ? 0.6 : 1,
                }}
              />
            )
          })}
        </div>
      )}

      {!started ? (
        <button
          onClick={initGame}
          style={{
            padding: '10px 28px', background: '#a6e3a1', color: '#1e1e2e',
            border: 'none', borderRadius: '8px', cursor: 'pointer', fontSize: '14px', fontWeight: 600,
          }}
        >
          开始游戏
        </button>
      ) : (
        <div style={{
          display: 'grid',
          gridTemplateColumns: `repeat(${level.cols}, ${cardWidth}px)`,
          gap: '6px',
        }}>
          {cards.map(card => (
            <div
              key={card.id}
              onClick={() => handleCardClick(card.id)}
              style={{
                width: cardWidth,
                height: cardHeight,
                perspective: '600px',
                cursor: card.flipped || card.matched ? 'default' : 'pointer',
              }}
            >
              <div
                style={{
                  width: '100%',
                  height: '100%',
                  position: 'relative',
                  transformStyle: 'preserve-3d',
                  transition: 'transform 0.3s',
                  transform: card.flipped || card.matched ? 'rotateY(180deg)' : 'rotateY(0)',
                }}
              >
                {/* Back */}
                <div style={{
                  position: 'absolute',
                  width: '100%',
                  height: '100%',
                  backfaceVisibility: 'hidden',
                  background: 'linear-gradient(135deg, #585b70 0%, #45475a 100%)',
                  borderRadius: '8px',
                  border: '2px solid #6272a4',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: cardWidth * 0.4,
                }}>
                  🃏
                </div>
                {/* Front */}
                <div style={{
                  position: 'absolute',
                  width: '100%',
                  height: '100%',
                  backfaceVisibility: 'hidden',
                  transform: 'rotateY(180deg)',
                  background: card.matched
                    ? 'linear-gradient(135deg, #a6e3a1 0%, #89b4fa 100%)'
                    : 'linear-gradient(135deg, #89b4fa 0%, #cba6f7 100%)',
                  borderRadius: '8px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: cardWidth * 0.55,
                  boxShadow: card.matched ? '0 0 12px #a6e3a180' : 'none',
                }}>
                  {card.emoji}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {gameOver && (
        <div style={{
          background: 'linear-gradient(135deg, #a6e3a1 0%, #89b4fa 100%)',
          color: '#11111b', padding: '12px 24px', borderRadius: '10px',
          fontWeight: 700, fontSize: '15px', textAlign: 'center',
        }}>
          恭喜通关！用了 {moves} 步
          {highScore[difficulty] === moves && ' (新纪录!)'}
        </div>
      )}

      {started && (
        <button
          onClick={initGame}
          style={{
            padding: '8px 20px', background: '#45475a', color: '#cdd6f4',
            border: '1px solid #6272a4', borderRadius: '6px', cursor: 'pointer', fontSize: '13px',
          }}
        >
          重新开始
        </button>
      )}

      <div style={{ fontSize: '11px', color: '#6c7086', textAlign: 'center' }}>
        点击卡片翻开，找出所有相同的配对
      </div>
    </div>
  )
}
