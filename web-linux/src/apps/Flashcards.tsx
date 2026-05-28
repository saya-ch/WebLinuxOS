import { useState, useCallback } from 'react'
import { 
  Plus, Edit, Trash2, Shuffle, CheckCircle2, 
  XCircle, ChevronLeft, BookOpen, 
  FolderPlus, FileText 
} from 'lucide-react'

interface Flashcard {
  id: string
  question: string
  answer: string
  category: string
  difficulty: 'easy' | 'medium' | 'hard'
  lastReviewed?: string
  reviewCount: number
  correctCount: number
}

interface Deck {
  id: string
  name: string
  description: string
  cards: Flashcard[]
  createdAt: string
}

function Flashcards() {
  const [decks, setDecks] = useState<Deck[]>(() => {
    try {
      const saved = localStorage.getItem('flashcards-decks')
      return saved ? JSON.parse(saved) : [
        {
          id: '1',
          name: '编程基础',
          description: 'JavaScript 和 Web 开发的基础知识',
          cards: [
            { id: '1', question: '什么是闭包？', answer: '闭包是一个函数，它可以访问其外部函数作用域中的变量，即使外部函数已经执行完毕。', category: 'JavaScript', difficulty: 'medium', reviewCount: 0, correctCount: 0 },
            { id: '2', question: '什么是 Promise？', answer: 'Promise 是异步编程的一种解决方案，表示一个异步操作的最终完成（或失败）及其结果值。', category: 'JavaScript', difficulty: 'hard', reviewCount: 0, correctCount: 0 },
            { id: '3', question: 'HTML 代表什么？', answer: 'HyperText Markup Language（超文本标记语言）', category: 'HTML', difficulty: 'easy', reviewCount: 0, correctCount: 0 },
            { id: '4', question: 'CSS 代表什么？', answer: 'Cascading Style Sheets（层叠样式表）', category: 'CSS', difficulty: 'easy', reviewCount: 0, correctCount: 0 },
            { id: '5', question: '什么是 React Hooks？', answer: 'React Hooks 是 React 16.8 引入的函数，允许你在函数组件中使用状态和其他 React 特性。', category: 'React', difficulty: 'medium', reviewCount: 0, correctCount: 0 }
          ],
          createdAt: new Date().toISOString()
        }
      ]
    } catch {
      return []
    }
  })
  
  const [currentDeck, setCurrentDeck] = useState<Deck | null>(null)
  const [currentCardIndex, setCurrentCardIndex] = useState(0)
  const [isFlipped, setIsFlipped] = useState(false)
  const [isReviewing, setIsReviewing] = useState(false)
  const [showAddDeck, setShowAddDeck] = useState(false)
  const [showAddCard, setShowAddCard] = useState(false)
  const [editingDeck, setEditingDeck] = useState<Deck | null>(null)
  const [editingCard, setEditingCard] = useState<Flashcard | null>(null)
  const [newDeckName, setNewDeckName] = useState('')
  const [newDeckDescription, setNewDeckDescription] = useState('')
  const [newQuestion, setNewQuestion] = useState('')
  const [newAnswer, setNewAnswer] = useState('')
  const [newCategory, setNewCategory] = useState('')
  const [newDifficulty, setNewDifficulty] = useState<'easy' | 'medium' | 'hard'>('medium')

  const saveDecks = useCallback((updatedDecks: Deck[]) => {
    localStorage.setItem('flashcards-decks', JSON.stringify(updatedDecks))
    setDecks(updatedDecks)
  }, [])

  const handleAddDeck = () => {
    if (!newDeckName.trim()) return
    
    const newDeck: Deck = {
      id: Date.now().toString(),
      name: newDeckName.trim(),
      description: newDeckDescription.trim(),
      cards: [],
      createdAt: new Date().toISOString()
    }
    
    saveDecks([...decks, newDeck])
    setNewDeckName('')
    setNewDeckDescription('')
    setShowAddDeck(false)
  }

  const handleDeleteDeck = (deckId: string) => {
    if (confirm('确定要删除这个卡组吗？')) {
      saveDecks(decks.filter(d => d.id !== deckId))
      if (currentDeck?.id === deckId) {
        setCurrentDeck(null)
        setIsReviewing(false)
      }
    }
  }

  const handleEditDeck = (deck: Deck) => {
    setEditingDeck(deck)
    setNewDeckName(deck.name)
    setNewDeckDescription(deck.description)
    setShowAddDeck(true)
  }

  const handleUpdateDeck = () => {
    if (!editingDeck || !newDeckName.trim()) return
    
    const updatedDecks = decks.map(d => 
      d.id === editingDeck.id 
        ? { ...d, name: newDeckName.trim(), description: newDeckDescription.trim() }
        : d
    )
    
    saveDecks(updatedDecks)
    if (currentDeck?.id === editingDeck.id) {
      setCurrentDeck(updatedDecks.find(d => d.id === editingDeck.id) || null)
    }
    setEditingDeck(null)
    setShowAddDeck(false)
    setNewDeckName('')
    setNewDeckDescription('')
  }

  const handleAddCard = () => {
    if (!currentDeck || !newQuestion.trim() || !newAnswer.trim()) return
    
    const newCard: Flashcard = {
      id: Date.now().toString(),
      question: newQuestion.trim(),
      answer: newAnswer.trim(),
      category: newCategory.trim(),
      difficulty: newDifficulty,
      reviewCount: 0,
      correctCount: 0
    }
    
    const updatedDeck = { ...currentDeck, cards: [...currentDeck.cards, newCard] }
    const updatedDecks = decks.map(d => d.id === currentDeck.id ? updatedDeck : d)
    saveDecks(updatedDecks)
    setCurrentDeck(updatedDeck)
    setNewQuestion('')
    setNewAnswer('')
    setNewCategory('')
    setNewDifficulty('medium')
    setShowAddCard(false)
  }

  const handleEditCard = (card: Flashcard) => {
    setEditingCard(card)
    setNewQuestion(card.question)
    setNewAnswer(card.answer)
    setNewCategory(card.category)
    setNewDifficulty(card.difficulty)
    setShowAddCard(true)
  }

  const handleUpdateCard = () => {
    if (!currentDeck || !editingCard || !newQuestion.trim() || !newAnswer.trim()) return
    
    const updatedCards = currentDeck.cards.map(c => 
      c.id === editingCard.id 
        ? { 
            ...c, 
            question: newQuestion.trim(), 
            answer: newAnswer.trim(), 
            category: newCategory.trim(),
            difficulty: newDifficulty 
          }
        : c
    )
    
    const updatedDeck = { ...currentDeck, cards: updatedCards }
    const updatedDecks = decks.map(d => d.id === currentDeck.id ? updatedDeck : d)
    saveDecks(updatedDecks)
    setCurrentDeck(updatedDeck)
    setEditingCard(null)
    setShowAddCard(false)
    setNewQuestion('')
    setNewAnswer('')
    setNewCategory('')
  }

  const handleDeleteCard = (cardId: string) => {
    if (!currentDeck || !confirm('确定要删除这张卡片吗？')) return
    
    const updatedDeck = { ...currentDeck, cards: currentDeck.cards.filter(c => c.id !== cardId) }
    const updatedDecks = decks.map(d => d.id === currentDeck.id ? updatedDeck : d)
    saveDecks(updatedDecks)
    setCurrentDeck(updatedDeck)
  }

  const startReview = (deck: Deck) => {
    setCurrentDeck(deck)
    setCurrentCardIndex(0)
    setIsFlipped(false)
    setIsReviewing(true)
  }

  const handleReviewResult = (correct: boolean) => {
    if (!currentDeck) return
    
    const updatedCards = [...currentDeck.cards]
    const card = updatedCards[currentCardIndex]
    card.reviewCount = (card.reviewCount || 0) + 1
    if (correct) {
      card.correctCount = (card.correctCount || 0) + 1
    }
    card.lastReviewed = new Date().toISOString()
    
    const updatedDeck = { ...currentDeck, cards: updatedCards }
    const updatedDecks = decks.map(d => d.id === currentDeck.id ? updatedDeck : d)
    saveDecks(updatedDecks)
    setCurrentDeck(updatedDeck)
    
    if (currentCardIndex < updatedCards.length - 1) {
      setCurrentCardIndex(prev => prev + 1)
      setIsFlipped(false)
    } else {
      alert('复习完成！🎉')
      setIsReviewing(false)
    }
  }

  const shuffleDeck = () => {
    if (!currentDeck) return
    
    const shuffledCards = [...currentDeck.cards].sort(() => Math.random() - 0.5)
    const updatedDeck = { ...currentDeck, cards: shuffledCards }
    const updatedDecks = decks.map(d => d.id === currentDeck.id ? updatedDeck : d)
    saveDecks(updatedDecks)
    setCurrentDeck(updatedDeck)
    setCurrentCardIndex(0)
    setIsFlipped(false)
  }

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case 'easy': return 'text-green-600 bg-green-100'
      case 'medium': return 'text-yellow-600 bg-yellow-100'
      case 'hard': return 'text-red-600 bg-red-100'
      default: return 'text-gray-600 bg-gray-100'
    }
  }

  return (
    <div className="app-container" style={{ height: '100%', display: 'flex', flexDirection: 'column', background: 'var(--window-bg)' }}>
      {!isReviewing ? (
        <>
          {/* Header */}
          <div style={{ padding: '16px 20px', borderBottom: '1px solid var(--window-border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'var(--window-header)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <BookOpen style={{ color: 'var(--accent)' }} />
              <h2 style={{ margin: 0, fontSize: '18px', fontWeight: 600 }}>学习卡片</h2>
            </div>
            <div style={{ display: 'flex', gap: '8px' }}>
              <button 
                onClick={() => setShowAddDeck(true)}
                style={{
                  padding: '8px 16px',
                  border: 'none',
                  borderRadius: '8px',
                  background: 'var(--accent)',
                  color: 'white',
                  cursor: 'pointer',
                  fontSize: '14px',
                  fontWeight: 500,
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  transition: 'all 0.2s'
                }}
              >
                <FolderPlus size={16} /> 新建卡组
              </button>
            </div>
          </div>

          {/* Content */}
          <div style={{ flex: 1, overflow: 'auto', padding: '20px', display: 'flex', gap: '24px' }}>
            {/* Decks List */}
            <div style={{ width: '300px', flexShrink: 0 }}>
              <h3 style={{ margin: '0 0 16px 0', fontSize: '14px', fontWeight: 600, color: 'var(--text-secondary)' }}>我的卡组</h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                {decks.map(deck => (
                  <div key={deck.id} style={{
                    padding: '16px',
                    border: '1px solid var(--window-border)',
                    borderRadius: '12px',
                    background: currentDeck?.id === deck.id ? 'rgba(var(--accent-rgb), 0.1)' : 'var(--window-header)',
                    cursor: 'pointer',
                    transition: 'all 0.2s'
                  }} onClick={() => setCurrentDeck(deck)}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                      <div style={{ flex: 1, marginRight: '12px' }}>
                        <h4 style={{ margin: '0 0 4px 0', fontSize: '15px', fontWeight: 600 }}>{deck.name}</h4>
                        <p style={{ margin: '0 0 8px 0', fontSize: '13px', color: 'var(--text-secondary)' }}>{deck.description}</p>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', fontSize: '12px', color: 'var(--text-secondary)' }}>
                          <span><FileText size={14} style={{ verticalAlign: 'middle', marginRight: '4px' }} /> {deck.cards.length} 张卡片</span>
                        </div>
                      </div>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                        <button 
                          onClick={(e) => { e.stopPropagation(); handleEditDeck(deck); }}
                          style={{
                            padding: '4px',
                            border: 'none',
                            background: 'transparent',
                            cursor: 'pointer',
                            color: 'var(--text-secondary)',
                            borderRadius: '4px',
                            transition: 'all 0.2s'
                          }}
                        >
                          <Edit size={16} />
                        </button>
                        <button 
                          onClick={(e) => { e.stopPropagation(); handleDeleteDeck(deck.id); }}
                          style={{
                            padding: '4px',
                            border: 'none',
                            background: 'transparent',
                            cursor: 'pointer',
                            color: 'var(--text-secondary)',
                            borderRadius: '4px',
                            transition: 'all 0.2s'
                          }}
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </div>
                    {deck.cards.length > 0 && (
                      <button 
                        onClick={(e) => { e.stopPropagation(); startReview(deck); }}
                        style={{
                          marginTop: '12px',
                          padding: '8px 16px',
                          border: 'none',
                          borderRadius: '8px',
                          background: 'var(--accent)',
                          color: 'white',
                          cursor: 'pointer',
                          fontSize: '13px',
                          fontWeight: 500,
                          width: '100%',
                          transition: 'all 0.2s'
                        }}
                      >
                        开始复习
                      </button>
                    )}
                  </div>
                ))}
                
                {decks.length === 0 && (
                  <div style={{
                    padding: '40px 20px',
                    textAlign: 'center',
                    color: 'var(--text-secondary)',
                    fontSize: '14px'
                  }}>
                    <BookOpen size={48} style={{ marginBottom: '16px', opacity: 0.5 }} />
                    <p>还没有卡组，点击上方按钮创建一个吧！</p>
                  </div>
                )}
              </div>
            </div>

            {/* Deck Details */}
            {currentDeck && (
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                  <div>
                    <h3 style={{ margin: 0, fontSize: '20px', fontWeight: 600 }}>{currentDeck.name}</h3>
                    <p style={{ margin: '4px 0 0 0', fontSize: '13px', color: 'var(--text-secondary)' }}>{currentDeck.description}</p>
                  </div>
                  <div style={{ display: 'flex', gap: '8px' }}>
                    {currentDeck.cards.length > 1 && (
                      <button 
                        onClick={shuffleDeck}
                        style={{
                          padding: '8px 16px',
                          border: '1px solid var(--window-border)',
                          borderRadius: '8px',
                          background: 'var(--window-header)',
                          cursor: 'pointer',
                          fontSize: '13px',
                          fontWeight: 500,
                          display: 'flex',
                          alignItems: 'center',
                          gap: '6px',
                          transition: 'all 0.2s'
                        }}
                      >
                        <Shuffle size={16} /> 随机顺序
                      </button>
                    )}
                    {currentDeck.cards.length > 0 && (
                      <button 
                        onClick={() => startReview(currentDeck)}
                        style={{
                          padding: '8px 16px',
                          border: 'none',
                          borderRadius: '8px',
                          background: 'var(--accent)',
                          color: 'white',
                          cursor: 'pointer',
                          fontSize: '13px',
                          fontWeight: 500,
                          display: 'flex',
                          alignItems: 'center',
                          gap: '6px',
                          transition: 'all 0.2s'
                        }}
                      >
                        <BookOpen size={16} /> 开始复习
                      </button>
                    )}
                    <button 
                      onClick={() => setShowAddCard(true)}
                      style={{
                        padding: '8px 16px',
                        border: 'none',
                        borderRadius: '8px',
                        background: 'var(--accent)',
                        color: 'white',
                        cursor: 'pointer',
                        fontSize: '13px',
                        fontWeight: 500,
                        display: 'flex',
                        alignItems: 'center',
                        gap: '6px',
                        transition: 'all 0.2s'
                      }}
                    >
                      <Plus size={16} /> 添加卡片
                    </button>
                  </div>
                </div>

                {/* Cards List */}
                {currentDeck.cards.length > 0 ? (
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '16px' }}>
                    {currentDeck.cards.map((card) => (
                      <div key={card.id} style={{
                        padding: '16px',
                        border: '1px solid var(--window-border)',
                        borderRadius: '12px',
                        background: 'var(--window-header)',
                        transition: 'all 0.2s'
                      }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '12px' }}>
                          <div style={{ display: 'flex', gap: '8px' }}>
                            {card.category && (
                              <span style={{
                                padding: '2px 8px',
                                borderRadius: '12px',
                                fontSize: '11px',
                                fontWeight: 500,
                                background: 'var(--hover-bg)',
                                color: 'var(--text-secondary)'
                              }}>
                                {card.category}
                              </span>
                            )}
                            <span style={{
                              padding: '2px 8px',
                              borderRadius: '12px',
                              fontSize: '11px',
                              fontWeight: 500,
                              background: getDifficultyColor(card.difficulty)
                            }}>
                              {card.difficulty === 'easy' ? '简单' : card.difficulty === 'medium' ? '中等' : '困难'}
                            </span>
                          </div>
                          <div style={{ display: 'flex', gap: '4px' }}>
                            <button 
                              onClick={() => handleEditCard(card)}
                              style={{
                                padding: '4px',
                                border: 'none',
                                background: 'transparent',
                                cursor: 'pointer',
                                color: 'var(--text-secondary)',
                                borderRadius: '4px',
                                transition: 'all 0.2s'
                              }}
                            >
                              <Edit size={16} />
                            </button>
                            <button 
                              onClick={() => handleDeleteCard(card.id)}
                              style={{
                                padding: '4px',
                                border: 'none',
                                background: 'transparent',
                                cursor: 'pointer',
                                color: 'var(--text-secondary)',
                                borderRadius: '4px',
                                transition: 'all 0.2s'
                              }}
                            >
                              <Trash2 size={16} />
                            </button>
                          </div>
                        </div>
                        <p style={{ margin: '0 0 8px 0', fontSize: '14px', fontWeight: 500, color: 'var(--text-primary)' }}>{card.question}</p>
                        <p style={{ margin: 0, fontSize: '13px', color: 'var(--text-secondary)' }}>{card.answer}</p>
                        {card.reviewCount > 0 && (
                          <div style={{ marginTop: '12px', paddingTop: '12px', borderTop: '1px solid var(--window-border)', display: 'flex', justifyContent: 'space-between', fontSize: '12px', color: 'var(--text-secondary)' }}>
                            <span>复习次数: {card.reviewCount}</span>
                            <span>正确率: {card.reviewCount > 0 ? Math.round((card.correctCount / card.reviewCount) * 100) : 0}%</span>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                ) : (
                  <div style={{
                    padding: '60px 20px',
                    textAlign: 'center',
                    color: 'var(--text-secondary)',
                    fontSize: '14px',
                    border: '2px dashed var(--window-border)',
                    borderRadius: '16px'
                  }}>
                    <FileText size={48} style={{ marginBottom: '16px', opacity: 0.5 }} />
                    <p>这个卡组还没有卡片</p>
                    <button 
                      onClick={() => setShowAddCard(true)}
                      style={{
                        marginTop: '16px',
                        padding: '10px 24px',
                        border: 'none',
                        borderRadius: '8px',
                        background: 'var(--accent)',
                        color: 'white',
                        cursor: 'pointer',
                        fontSize: '14px',
                        fontWeight: 500,
                        transition: 'all 0.2s'
                      }}
                    >
                      添加第一张卡片
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>
        </>
      ) : (
        currentDeck && (
          /* Review Mode */
          <div style={{ height: '100%', display: 'flex', flexDirection: 'column', background: 'var(--window-bg)' }}>
            {/* Review Header */}
            <div style={{ padding: '16px 20px', borderBottom: '1px solid var(--window-border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'var(--window-header)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <button 
                  onClick={() => setIsReviewing(false)}
                  style={{
                    padding: '6px 12px',
                    border: '1px solid var(--window-border)',
                    borderRadius: '8px',
                    background: 'transparent',
                    cursor: 'pointer',
                    fontSize: '13px',
                    fontWeight: 500,
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px',
                    transition: 'all 0.2s'
                  }}
                >
                  <ChevronLeft size={16} /> 返回
                </button>
                <h2 style={{ margin: 0, fontSize: '18px', fontWeight: 600 }}>复习: {currentDeck.name}</h2>
              </div>
              <span style={{ fontSize: '14px', color: 'var(--text-secondary)' }}>
                {currentCardIndex + 1} / {currentDeck.cards.length}
              </span>
            </div>

            {/* Review Content */}
            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', padding: '40px' }}>
              <div 
                onClick={() => setIsFlipped(!isFlipped)}
                style={{
                  width: '100%',
                  maxWidth: '700px',
                  aspectRatio: '16 / 9',
                  perspective: '1000px',
                  cursor: 'pointer'
                }}
              >
                <div style={{
                  position: 'relative',
                  width: '100%',
                  height: '100%',
                  transition: 'transform 0.6s',
                  transformStyle: 'preserve-3d',
                  transform: isFlipped ? 'rotateY(180deg)' : 'rotateY(0deg)'
                }}>
                  {/* Front Side */}
                  <div style={{
                    position: 'absolute',
                    width: '100%',
                    height: '100%',
                    backfaceVisibility: 'hidden',
                    background: 'linear-gradient(135deg, var(--accent) 0%, #8b5cf6 100%)',
                    borderRadius: '20px',
                    padding: '40px',
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'center',
                    alignItems: 'center',
                    color: 'white',
                    boxShadow: '0 10px 40px rgba(0, 0, 0, 0.2)'
                  }}>
                    <div style={{ marginBottom: '20px', fontSize: '14px', opacity: 0.9 }}>问题</div>
                    <div style={{ fontSize: '24px', fontWeight: 600, textAlign: 'center', lineHeight: 1.5 }}>
                      {currentDeck.cards[currentCardIndex].question}
                    </div>
                    <div style={{ marginTop: '30px', fontSize: '13px', opacity: 0.7 }}>点击卡片查看答案</div>
                  </div>
                  
                  {/* Back Side */}
                  <div style={{
                    position: 'absolute',
                    width: '100%',
                    height: '100%',
                    backfaceVisibility: 'hidden',
                    background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
                    borderRadius: '20px',
                    padding: '40px',
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'center',
                    alignItems: 'center',
                    color: 'white',
                    transform: 'rotateY(180deg)',
                    boxShadow: '0 10px 40px rgba(0, 0, 0, 0.2)'
                  }}>
                    <div style={{ marginBottom: '20px', fontSize: '14px', opacity: 0.9 }}>答案</div>
                    <div style={{ fontSize: '20px', fontWeight: 500, textAlign: 'center', lineHeight: 1.6 }}>
                      {currentDeck.cards[currentCardIndex].answer}
                    </div>
                    <div style={{ marginTop: '30px', fontSize: '13px', opacity: 0.7 }}>点击卡片返回问题</div>
                  </div>
                </div>
              </div>

              {/* Review Buttons */}
              {isFlipped && (
                <div style={{ marginTop: '40px', display: 'flex', gap: '16px' }}>
                  <button 
                    onClick={() => handleReviewResult(false)}
                    style={{
                      padding: '14px 32px',
                      border: '2px solid #ef4444',
                      borderRadius: '12px',
                      background: 'transparent',
                      color: '#ef4444',
                      cursor: 'pointer',
                      fontSize: '16px',
                      fontWeight: 600,
                      display: 'flex',
                      alignItems: 'center',
                      gap: '8px',
                      transition: 'all 0.2s'
                    }}
                  >
                    <XCircle size={20} /> 忘记了
                  </button>
                  <button 
                    onClick={() => handleReviewResult(true)}
                    style={{
                      padding: '14px 32px',
                      border: 'none',
                      borderRadius: '12px',
                      background: '#10b981',
                      color: 'white',
                      cursor: 'pointer',
                      fontSize: '16px',
                      fontWeight: 600,
                      display: 'flex',
                      alignItems: 'center',
                      gap: '8px',
                      transition: 'all 0.2s'
                    }}
                  >
                    <CheckCircle2 size={20} /> 记住了
                  </button>
                </div>
              )}
            </div>
          </div>
        )
      )}

      {/* Add Deck Modal */}
      {showAddDeck && (
        <div style={{
          position: 'absolute',
          inset: 0,
          background: 'rgba(0, 0, 0, 0.5)',
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          zIndex: 1000
        }} onClick={() => setShowAddDeck(false)}>
          <div style={{
            background: 'var(--window-bg)',
            borderRadius: '16px',
            padding: '24px',
            width: '450px',
            boxShadow: '0 10px 40px rgba(0, 0, 0, 0.3)'
          }} onClick={(e) => e.stopPropagation()}>
            <h3 style={{ margin: '0 0 20px 0', fontSize: '18px', fontWeight: 600 }}>
              {editingDeck ? '编辑卡组' : '新建卡组'}
            </h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div>
                <label style={{ display: 'block', marginBottom: '6px', fontSize: '13px', fontWeight: 500 }}>卡组名称</label>
                <input 
                  type="text" 
                  value={newDeckName}
                  onChange={(e) => setNewDeckName(e.target.value)}
                  placeholder="输入卡组名称..."
                  style={{
                    width: '100%',
                    padding: '10px 14px',
                    border: '1px solid var(--window-border)',
                    borderRadius: '8px',
                    fontSize: '14px',
                    background: 'var(--window-header)',
                    color: 'var(--text-primary)',
                    outline: 'none'
                  }}
                  autoFocus
                />
              </div>
              <div>
                <label style={{ display: 'block', marginBottom: '6px', fontSize: '13px', fontWeight: 500 }}>描述（可选）</label>
                <textarea 
                  value={newDeckDescription}
                  onChange={(e) => setNewDeckDescription(e.target.value)}
                  placeholder="简单描述一下这个卡组..."
                  rows={3}
                  style={{
                    width: '100%',
                    padding: '10px 14px',
                    border: '1px solid var(--window-border)',
                    borderRadius: '8px',
                    fontSize: '14px',
                    background: 'var(--window-header)',
                    color: 'var(--text-primary)',
                    outline: 'none',
                    resize: 'none'
                  }}
                />
              </div>
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '8px' }}>
                <button 
                  onClick={() => {
                    setShowAddDeck(false)
                    setEditingDeck(null)
                    setNewDeckName('')
                    setNewDeckDescription('')
                  }}
                  style={{
                    padding: '10px 20px',
                    border: '1px solid var(--window-border)',
                    borderRadius: '8px',
                    background: 'transparent',
                    cursor: 'pointer',
                    fontSize: '14px',
                    fontWeight: 500,
                    transition: 'all 0.2s'
                  }}
                >
                  取消
                </button>
                <button 
                  onClick={editingDeck ? handleUpdateDeck : handleAddDeck}
                  style={{
                    padding: '10px 20px',
                    border: 'none',
                    borderRadius: '8px',
                    background: 'var(--accent)',
                    color: 'white',
                    cursor: 'pointer',
                    fontSize: '14px',
                    fontWeight: 500,
                    transition: 'all 0.2s'
                  }}
                >
                  {editingDeck ? '更新' : '创建'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Add Card Modal */}
      {showAddCard && currentDeck && (
        <div style={{
          position: 'absolute',
          inset: 0,
          background: 'rgba(0, 0, 0, 0.5)',
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          zIndex: 1000
        }} onClick={() => setShowAddCard(false)}>
          <div style={{
            background: 'var(--window-bg)',
            borderRadius: '16px',
            padding: '24px',
            width: '500px',
            boxShadow: '0 10px 40px rgba(0, 0, 0, 0.3)'
          }} onClick={(e) => e.stopPropagation()}>
            <h3 style={{ margin: '0 0 20px 0', fontSize: '18px', fontWeight: 600 }}>
              {editingCard ? '编辑卡片' : '添加新卡片'}
            </h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div>
                <label style={{ display: 'block', marginBottom: '6px', fontSize: '13px', fontWeight: 500 }}>问题</label>
                <textarea 
                  value={newQuestion}
                  onChange={(e) => setNewQuestion(e.target.value)}
                  placeholder="输入问题..."
                  rows={3}
                  style={{
                    width: '100%',
                    padding: '10px 14px',
                    border: '1px solid var(--window-border)',
                    borderRadius: '8px',
                    fontSize: '14px',
                    background: 'var(--window-header)',
                    color: 'var(--text-primary)',
                    outline: 'none',
                    resize: 'none'
                  }}
                  autoFocus
                />
              </div>
              <div>
                <label style={{ display: 'block', marginBottom: '6px', fontSize: '13px', fontWeight: 500 }}>答案</label>
                <textarea 
                  value={newAnswer}
                  onChange={(e) => setNewAnswer(e.target.value)}
                  placeholder="输入答案..."
                  rows={3}
                  style={{
                    width: '100%',
                    padding: '10px 14px',
                    border: '1px solid var(--window-border)',
                    borderRadius: '8px',
                    fontSize: '14px',
                    background: 'var(--window-header)',
                    color: 'var(--text-primary)',
                    outline: 'none',
                    resize: 'none'
                  }}
                />
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div>
                  <label style={{ display: 'block', marginBottom: '6px', fontSize: '13px', fontWeight: 500 }}>分类（可选）</label>
                  <input 
                    type="text" 
                    value={newCategory}
                    onChange={(e) => setNewCategory(e.target.value)}
                    placeholder="例如：JavaScript"
                    style={{
                      width: '100%',
                      padding: '10px 14px',
                      border: '1px solid var(--window-border)',
                      borderRadius: '8px',
                      fontSize: '14px',
                      background: 'var(--window-header)',
                      color: 'var(--text-primary)',
                      outline: 'none'
                    }}
                  />
                </div>
                <div>
                  <label style={{ display: 'block', marginBottom: '6px', fontSize: '13px', fontWeight: 500 }}>难度</label>
                  <select 
                    value={newDifficulty}
                    onChange={(e) => setNewDifficulty(e.target.value as 'easy' | 'medium' | 'hard')}
                    style={{
                      width: '100%',
                      padding: '10px 14px',
                      border: '1px solid var(--window-border)',
                      borderRadius: '8px',
                      fontSize: '14px',
                      background: 'var(--window-header)',
                      color: 'var(--text-primary)',
                      outline: 'none'
                    }}
                  >
                    <option value="easy">简单</option>
                    <option value="medium">中等</option>
                    <option value="hard">困难</option>
                  </select>
                </div>
              </div>
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '8px' }}>
                <button 
                  onClick={() => {
                    setShowAddCard(false)
                    setEditingCard(null)
                    setNewQuestion('')
                    setNewAnswer('')
                    setNewCategory('')
                  }}
                  style={{
                    padding: '10px 20px',
                    border: '1px solid var(--window-border)',
                    borderRadius: '8px',
                    background: 'transparent',
                    cursor: 'pointer',
                    fontSize: '14px',
                    fontWeight: 500,
                    transition: 'all 0.2s'
                  }}
                >
                  取消
                </button>
                <button 
                  onClick={editingCard ? handleUpdateCard : handleAddCard}
                  style={{
                    padding: '10px 20px',
                    border: 'none',
                    borderRadius: '8px',
                    background: 'var(--accent)',
                    color: 'white',
                    cursor: 'pointer',
                    fontSize: '14px',
                    fontWeight: 500,
                    transition: 'all 0.2s'
                  }}
                >
                  {editingCard ? '更新' : '添加'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default Flashcards
