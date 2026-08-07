import { useState, useCallback, memo } from 'react'
import { useStore } from '../store'
import { RefreshCw, Trash2, Dices } from 'lucide-react'

const DICE_TYPES = [4, 6, 8, 10, 12, 20] as const
type DiceType = (typeof DICE_TYPES)[number]

interface RollRecord {
  id: string
  dice: DiceType[]
  results: number[]
  total: number
  timestamp: number
}

const OnlineDiceRoller = memo(function OnlineDiceRoller() {
  const addNotification = useStore((s) => s.addNotification)
  const [selectedDice, setSelectedDice] = useState<DiceType[]>([6])
  const [results, setResults] = useState<number[]>([])
  const [history, setHistory] = useState<RollRecord[]>([])
  const [rolling, setRolling] = useState(false)

  const toggleDice = useCallback((d: DiceType) => {
    setSelectedDice((prev) => {
      const count = prev.filter((x) => x === d).length
      if (count >= 5) return prev
      return [...prev, d]
    })
  }, [])

  const removeDice = useCallback((index: number) => {
    setSelectedDice((prev) => prev.filter((_, i) => i !== index))
  }, [])

  const rollDice = useCallback(() => {
    if (selectedDice.length === 0) {
      addNotification({ title: '骰子', message: '请先选择骰子', type: 'warning' })
      return
    }
    setRolling(true)
    setTimeout(() => {
      const newResults = selectedDice.map((sides) => Math.floor(Math.random() * sides) + 1)
      const record: RollRecord = {
        id: Date.now().toString(),
        dice: [...selectedDice],
        results: newResults,
        total: newResults.reduce((a, b) => a + b, 0),
        timestamp: Date.now(),
      }
      setResults(newResults)
      setHistory((prev) => [record, ...prev].slice(0, 30))
      setRolling(false)
    }, 600)
  }, [selectedDice, addNotification])

  const clearHistory = useCallback(() => {
    setHistory([])
  }, [])

  const total = results.length > 0 ? results.reduce((a, b) => a + b, 0) : 0

  const getDistribution = (diceType: DiceType) => {
    const rolls = history.filter((h) => h.dice.includes(diceType))
    if (rolls.length === 0) return null
    const dist: Record<number, number> = {}
    for (const r of rolls) {
      for (const result of r.results) {
        if (result <= diceType) {
          dist[result] = (dist[result] || 0) + 1
        }
      }
    }
    return dist
  }

  const maxCount = DICE_TYPES.reduce((max, d) => {
    const dist = getDistribution(d)
    if (!dist) return max
    return Math.max(max, ...Object.values(dist))
  }, 0)

  const styles = `
    .dr-container {
      height: 100%;
      overflow: hidden;
      background: linear-gradient(180deg, #0f0f23 0%, #1a1a2e 100%);
      color: #e0e0e0;
      display: flex;
      flex-direction: column;
      font-family: 'Inter', -apple-system, sans-serif;
    }
    .dr-header {
      padding: 20px 24px;
      border-bottom: 1px solid rgba(255,255,255,0.06);
      display: flex;
      align-items: center;
      justify-content: space-between;
    }
    .dr-title {
      display: flex;
      align-items: center;
      gap: 12px;
      font-size: 18px;
      font-weight: 700;
      color: #fff;
    }
    .dr-title-icon {
      width: 36px;
      height: 36px;
      border-radius: 10px;
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      display: flex;
      align-items: center;
      justify-content: center;
    }
    .dr-body {
      flex: 1;
      overflow-y: auto;
      padding: 20px 24px;
    }
    .dr-section {
      margin-bottom: 24px;
    }
    .dr-section-title {
      font-size: 13px;
      font-weight: 600;
      text-transform: uppercase;
      letter-spacing: 0.5px;
      color: #8b8ba0;
      margin-bottom: 12px;
    }
    .dr-dice-selector {
      display: flex;
      gap: 8px;
      flex-wrap: wrap;
    }
    .dr-dice-btn {
      padding: 10px 16px;
      border-radius: 10px;
      border: 2px solid rgba(255,255,255,0.1);
      background: rgba(255,255,255,0.03);
      color: #a0a0b0;
      font-size: 14px;
      font-weight: 600;
      cursor: pointer;
      transition: all 0.2s;
    }
    .dr-dice-btn:hover {
      border-color: rgba(102, 126, 234, 0.5);
      color: #fff;
      background: rgba(102, 126, 234, 0.1);
    }
    .dr-dice-btn.active {
      border-color: #667eea;
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      color: #fff;
    }
    .dr-selected {
      display: flex;
      flex-wrap: wrap;
      gap: 10px;
      min-height: 60px;
    }
    .dr-selected-die {
      display: flex;
      align-items: center;
      gap: 6px;
      padding: 8px 12px;
      border-radius: 10px;
      background: rgba(102, 126, 234, 0.15);
      border: 1px solid rgba(102, 126, 234, 0.3);
      font-size: 14px;
      font-weight: 600;
    }
    .dr-remove-die {
      cursor: pointer;
      opacity: 0.6;
      transition: opacity 0.2s;
      background: none;
      border: none;
      color: inherit;
      padding: 0;
      display: flex;
    }
    .dr-remove-die:hover { opacity: 1; }
    .dr-result {
      background: linear-gradient(135deg, rgba(102, 126, 234, 0.1) 0%, rgba(118, 75, 162, 0.1) 100%);
      border: 1px solid rgba(102, 126, 234, 0.3);
      border-radius: 16px;
      padding: 32px;
      text-align: center;
    }
    .dr-dice-display {
      display: flex;
      justify-content: center;
      gap: 16px;
      margin-bottom: 20px;
      flex-wrap: wrap;
    }
    .dr-die {
      width: 70px;
      height: 70px;
      border-radius: 14px;
      background: linear-gradient(135deg, #fff 0%, #f0f0f5 100%);
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 28px;
      font-weight: 800;
      color: #1a1a2e;
      box-shadow: 0 8px 24px rgba(0,0,0,0.3);
      transition: transform 0.15s;
    }
    .dr-die.rolling {
      animation: rollShake 0.1s linear infinite;
    }
    @keyframes rollShake {
      0%, 100% { transform: rotate(-5deg) scale(1); }
      50% { transform: rotate(5deg) scale(1.05); }
    }
    .dr-total {
      font-size: 14px;
      color: #8b8ba0;
      margin-bottom: 8px;
    }
    .dr-total-value {
      font-size: 36px;
      font-weight: 800;
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      -webkit-background-clip: text;
      -webkit-text-fill-color: transparent;
    }
    .dr-roll-btn {
      width: 100%;
      padding: 14px;
      border: none;
      border-radius: 12px;
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      color: #fff;
      font-size: 16px;
      font-weight: 700;
      cursor: pointer;
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 8px;
      transition: transform 0.15s, box-shadow 0.15s;
    }
    .dr-roll-btn:hover {
      transform: translateY(-1px);
      box-shadow: 0 8px 24px rgba(102, 126, 234, 0.4);
    }
    .dr-roll-btn:disabled {
      opacity: 0.5;
      cursor: not-allowed;
    }
    .dr-history-list {
      display: flex;
      flex-direction: column;
      gap: 8px;
    }
    .dr-history-item {
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 12px 16px;
      background: rgba(255,255,255,0.03);
      border-radius: 10px;
      border: 1px solid rgba(255,255,255,0.05);
    }
    .dr-history-info {
      display: flex;
      flex-direction: column;
      gap: 4px;
    }
    .dr-history-dice {
      display: flex;
      gap: 6px;
      align-items: center;
    }
    .dr-history-die {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      min-width: 28px;
      height: 28px;
      padding: 0 6px;
      border-radius: 6px;
      background: rgba(102, 126, 234, 0.2);
      font-size: 12px;
      font-weight: 700;
    }
    .dr-history-time {
      font-size: 11px;
      color: #6b6b80;
    }
    .dr-history-total {
      font-size: 18px;
      font-weight: 700;
      color: #667eea;
    }
    .dr-empty {
      text-align: center;
      padding: 40px;
      color: #6b6b80;
      font-size: 14px;
    }
    .dr-dist-section {
      margin-top: 16px;
      padding: 16px;
      background: rgba(255,255,255,0.02);
      border-radius: 12px;
      border: 1px solid rgba(255,255,255,0.05);
    }
    .dr-dist-title {
      font-size: 12px;
      color: #8b8ba0;
      margin-bottom: 12px;
    }
    .dr-dist-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(120px, 1fr));
      gap: 12px;
    }
    .dr-dist-item {
      display: flex;
      flex-direction: column;
      gap: 4px;
    }
    .dr-dist-bar {
      height: 8px;
      border-radius: 4px;
      background: rgba(255,255,255,0.06);
      overflow: hidden;
    }
    .dr-dist-fill {
      height: 100%;
      background: linear-gradient(90deg, #667eea, #764ba2);
      border-radius: 4px;
      transition: width 0.3s;
    }
    .dr-dist-label {
      font-size: 11px;
      color: #8b8ba0;
      display: flex;
      justify-content: space-between;
    }
    .dr-clear {
      display: flex;
      align-items: center;
      gap: 6px;
      padding: 6px 12px;
      border-radius: 8px;
      border: 1px solid rgba(255,255,255,0.1);
      background: rgba(255,255,255,0.03);
      color: #8b8ba0;
      cursor: pointer;
      font-size: 12px;
      transition: all 0.2s;
    }
    .dr-clear:hover {
      border-color: rgba(239, 68, 68, 0.5);
      color: #ef4444;
    }
  `

  return (
    <div className="dr-container">
      <style>{styles}</style>
      <div className="dr-header">
        <div className="dr-title">
          <div className="dr-title-icon">
            <Dices size={20} color="white" />
          </div>
          骰子模拟器
        </div>
        {history.length > 0 && (
          <button className="dr-clear" onClick={clearHistory}>
            <Trash2 size={14} /> 清空
          </button>
        )}
      </div>

      <div className="dr-body">
        <div className="dr-section">
          <div className="dr-section-title">选择骰子类型</div>
          <div className="dr-dice-selector">
            {DICE_TYPES.map((d) => {
              const count = selectedDice.filter((x) => x === d).length
              return (
                <button
                  key={d}
                  className={`dr-dice-btn ${count > 0 ? 'active' : ''}`}
                  onClick={() => toggleDice(d)}
                  disabled={count >= 5}
                >
                  D{d}
                  {count > 0 && ` ×${count}`}
                </button>
              )
            })}
          </div>
        </div>

        <div className="dr-section">
          <div className="dr-section-title">已选骰子</div>
          <div className="dr-selected">
            {selectedDice.length === 0 && (
              <div className="dr-empty">点击上方骰子类型进行选择（最多 5 个同种骰子）</div>
            )}
            {selectedDice.map((d, i) => (
              <div key={`${d}-${i}`} className="dr-selected-die">
                D{d}
                <button className="dr-remove-die" onClick={() => removeDice(i)}>
                  ×
                </button>
              </div>
            ))}
          </div>
        </div>

        <div className="dr-section">
          <div className="dr-section-title">投掷结果</div>
          <div className="dr-result">
            <div className="dr-dice-display">
              {results.length === 0 ? (
                <div className="dr-empty">选择骰子后点击投掷按钮</div>
              ) : (
                results.map((r, i) => (
                  <div key={i} className={`dr-die ${rolling ? 'rolling' : ''}`}>
                    {r}
                  </div>
                ))
              )}
            </div>
            {results.length > 0 && (
              <>
                <div className="dr-total">总值</div>
                <div className="dr-total-value">{total}</div>
              </>
            )}
            <button
              className="dr-roll-btn"
              onClick={rollDice}
              disabled={rolling || selectedDice.length === 0}
              style={{ marginTop: results.length > 0 ? '24px' : '0' }}
            >
              <RefreshCw size={18} className={rolling ? 'animate-spin' : ''} />
              {rolling ? '投掷中...' : '投掷骰子'}
            </button>
          </div>
        </div>

        {history.length > 0 && (
          <div className="dr-section">
            <div className="dr-section-title">
              历史记录 ({history.length})
            </div>
            <div className="dr-history-list">
              {history.map((h) => (
                <div key={h.id} className="dr-history-item">
                  <div className="dr-history-info">
                    <div className="dr-history-dice">
                      {h.results.map((r, i) => (
                        <span key={i} className="dr-history-die">
                          {r}
                        </span>
                      ))}
                    </div>
                    <div className="dr-history-time">
                      {new Date(h.timestamp).toLocaleTimeString()}
                    </div>
                  </div>
                  <div className="dr-history-total">{h.total}</div>
                </div>
              ))}
            </div>

            {maxCount > 0 && (
              <div className="dr-dist-section">
                <div className="dr-dist-title">概率分布</div>
                {DICE_TYPES.map((d) => {
                  const dist = getDistribution(d)
                  if (!dist) return null
                  return (
                    <div key={d} style={{ marginBottom: 12 }}>
                      <div style={{ fontSize: 11, color: '#8b8ba0', marginBottom: 6 }}>D{d}</div>
                      <div className="dr-dist-grid">
                        {Array.from({ length: d }, (_, i) => i + 1).map((val) => {
                          const count = dist[val] || 0
                          const pct = maxCount > 0 ? (count / maxCount) * 100 : 0
                          return (
                            <div key={val} className="dr-dist-item">
                              <div className="dr-dist-bar">
                                <div className="dr-dist-fill" style={{ width: `${pct}%` }} />
                              </div>
                              <div className="dr-dist-label">
                                <span>{val}</span>
                                <span>{count}</span>
                              </div>
                            </div>
                          )
                        })}
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
})

export default OnlineDiceRoller
