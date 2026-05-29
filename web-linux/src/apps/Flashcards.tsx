import { useState } from 'react'

const defaultCards = [
  { id: 1, front: 'React 是什么？', back: '一个用于构建用户界面的 JavaScript 库' },
  { id: 2, front: '什么是 JSX？', back: 'JavaScript XML，一种用于在 React 中编写 HTML 的语法扩展' },
  { id: 3, front: '什么是 useState？', back: 'React 的 Hook，用于在函数组件中添加状态' },
  { id: 4, front: '什么是 useEffect？', back: 'React 的 Hook，用于处理组件中的副作用' },
]

export default function Flashcards() {
  const [cards, setCards] = useState(defaultCards)
  const [currentIndex, setCurrentIndex] = useState(0)
  const [isFlipped, setIsFlipped] = useState(false)
  const [newFront, setNewFront] = useState('')
  const [newBack, setNewBack] = useState('')
  const [showAddForm, setShowAddForm] = useState(false)

  const currentCard = cards[currentIndex]

  const nextCard = () => {
    setIsFlipped(false)
    setCurrentIndex((prev) => (prev + 1) % cards.length)
  }

  const prevCard = () => {
    setIsFlipped(false)
    setCurrentIndex((prev) => (prev - 1 + cards.length) % cards.length)
  }

  const addCard = () => {
    if (newFront && newBack) {
      setCards([...cards, { id: Date.now(), front: newFront, back: newBack }])
      setNewFront('')
      setNewBack('')
      setShowAddForm(false)
    }
  }

  const deleteCard = () => {
    if (cards.length <= 1) return
    const newCards = cards.filter((_, i) => i !== currentIndex)
    setCards(newCards)
    setCurrentIndex(Math.min(currentIndex, newCards.length - 1))
    setIsFlipped(false)
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', background: '#1e1e2e', color: '#cdd6f4' }}>
      <div style={{ padding: '16px 20px', borderBottom: '1px solid #313244', background: '#181825', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h1 style={{ margin: '0 0 6px', fontSize: '20px', fontWeight: 700 }}>📚 学习卡片</h1>
          <p style={{ margin: 0, fontSize: '12px', color: '#a6adc8' }}>使用闪卡学习和记忆知识</p>
        </div>
        <button onClick={() => setShowAddForm(!showAddForm)} style={{ padding: '8px 16px', background: 'linear-gradient(135deg, #89b4fa 0%, #74c7ec 100%)', border: 'none', borderRadius: '10px', color: '#1e1e2e', fontWeight: 600, cursor: 'pointer', fontSize: '13px' }}>
          + 添加卡片
        </button>
      </div>

      <div style={{ flex: 1, padding: '24px', overflow: 'auto', display: 'flex', flexDirection: 'column', gap: '20px', alignItems: 'center', justifyContent: 'center' }}>
        {showAddForm && (
          <div style={{ width: '100%', maxWidth: '500px', background: '#313244', borderRadius: '14px', padding: '20px' }}>
            <h2 style={{ margin: '0 0 16px', fontSize: '16px', fontWeight: 600 }}>添加新卡片</h2>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <input
                value={newFront}
                onChange={(e) => setNewFront(e.target.value)}
                placeholder="正面内容 (问题)..."
                style={{ padding: '12px', background: '#181825', border: '1px solid #45475a', borderRadius: '10px', color: '#cdd6f4', fontSize: '14px' }}
              />
              <input
                value={newBack}
                onChange={(e) => setNewBack(e.target.value)}
                placeholder="背面内容 (答案)..."
                style={{ padding: '12px', background: '#181825', border: '1px solid #45475a', borderRadius: '10px', color: '#cdd6f4', fontSize: '14px' }}
              />
              <div style={{ display: 'flex', gap: '10px' }}>
                <button onClick={addCard} style={{ flex: 1, padding: '12px', background: '#a6e3a1', border: 'none', borderRadius: '10px', color: '#1e1e2e', fontWeight: 600, cursor: 'pointer' }}>
                  添加
                </button>
                <button onClick={() => setShowAddForm(false)} style={{ padding: '12px 20px', background: '#45475a', border: 'none', borderRadius: '10px', color: '#cdd6f4', cursor: 'pointer' }}>
                  取消
                </button>
              </div>
            </div>
          </div>
        )}

        {cards.length > 0 && (
          <>
            <div style={{ width: '100%', maxWidth: '500px' }}>
              <div style={{ textAlign: 'center', marginBottom: '20px', fontSize: '14px', color: '#a6adc8' }}>
                卡片 {currentIndex + 1} / {cards.length}
              </div>

              <div
                onClick={() => setIsFlipped(!isFlipped)}
                style={{
                  width: '100%',
                  height: '300px',
                  perspective: '1000px',
                  cursor: 'pointer',
                }}
              >
                <div
                  style={{
                    position: 'relative',
                    width: '100%',
                    height: '100%',
                    transformStyle: 'preserve-3d',
                    transition: 'transform 0.6s',
                    transform: isFlipped ? 'rotateY(180deg)' : 'rotateY(0deg)',
                  }}
                >
                  <div
                    style={{
                      position: 'absolute',
                      width: '100%',
                      height: '100%',
                      backfaceVisibility: 'hidden',
                      background: 'linear-gradient(135deg, #313244 0%, #45475a 100%)',
                      borderRadius: '20px',
                      padding: '40px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      textAlign: 'center',
                      fontSize: '22px',
                      fontWeight: 600,
                      boxShadow: '0 10px 30px rgba(0,0,0,0.3)',
                    }}
                  >
                    <div>
                      <div style={{ fontSize: '12px', color: '#89b4fa', marginBottom: '12px', textTransform: 'uppercase' }}>正面</div>
                      {currentCard.front}
                    </div>
                  </div>
                  <div
                    style={{
                      position: 'absolute',
                      width: '100%',
                      height: '100%',
                      backfaceVisibility: 'hidden',
                      background: 'linear-gradient(135deg, #45475a 0%, #313244 100%)',
                      borderRadius: '20px',
                      padding: '40px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      textAlign: 'center',
                      fontSize: '20px',
                      boxShadow: '0 10px 30px rgba(0,0,0,0.3)',
                      transform: 'rotateY(180deg)',
                    }}
                  >
                    <div>
                      <div style={{ fontSize: '12px', color: '#a6e3a1', marginBottom: '12px', textTransform: 'uppercase' }}>背面</div>
                      {currentCard.back}
                    </div>
                  </div>
                </div>
              </div>

              <div style={{ textAlign: 'center', marginTop: '16px', fontSize: '13px', color: '#a6adc8' }}>点击卡片翻转</div>
            </div>

            <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
              <button onClick={prevCard} style={{ padding: '14px 30px', background: '#313244', border: 'none', borderRadius: '12px', color: '#cdd6f4', cursor: 'pointer', fontSize: '15px', fontWeight: 600 }}>
                ← 上一张
              </button>
              <button onClick={deleteCard} style={{ padding: '14px 20px', background: '#f38ba8', border: 'none', borderRadius: '12px', color: '#1e1e2e', cursor: 'pointer', fontSize: '15px', fontWeight: 600 }}>
                🗑️
              </button>
              <button onClick={nextCard} style={{ padding: '14px 30px', background: 'linear-gradient(135deg, #89b4fa 0%, #74c7ec 100%)', border: 'none', borderRadius: '12px', color: '#1e1e2e', cursor: 'pointer', fontSize: '15px', fontWeight: 600 }}>
                下一张 →
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  )
}
