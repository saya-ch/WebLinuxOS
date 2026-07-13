import { useState, useEffect, useCallback, useMemo } from 'react'
import { useStore } from '../store'
import {
  BookOpen, Brain, Target, Clock, Award, Sparkles,
  ChevronRight, ChevronLeft, CheckCircle, Circle,
  Lightbulb, MessageCircle, BarChart3, Star, Zap
} from 'lucide-react'

// 知识卡片类型
interface KnowledgeCard {
  id: string
  title: string
  content: string
  category: string
  difficulty: 'beginner' | 'intermediate' | 'advanced'
  tags: string[]
  createdAt: string
  reviewedCount: number
  lastReviewed?: string
  mastered: boolean
}

// 学习路径类型
interface LearningPath {
  id: string
  name: string
  description: string
  icon: string
  totalCards: number
  completedCards: number
  estimatedTime: number // 分钟
  category: string
}

// 学习计划类型
interface LearningPlan {
  id: string
  date: string
  targetCards: number
  completedCards: number
  subject: string
  notes: string
}

// 预设知识卡片库
const defaultKnowledgeCards: KnowledgeCard[] = [
  {
    id: 'js-1',
    title: 'JavaScript 变量声明',
    content: 'JavaScript 有三种声明变量的方式：var（函数作用域）、let（块作用域）、const（常量）。推荐使用 let 和 const，避免使用 var。',
    category: 'JavaScript',
    difficulty: 'beginner',
    tags: ['基础', '变量', 'ES6'],
    createdAt: new Date().toISOString(),
    reviewedCount: 0,
    mastered: false
  },
  {
    id: 'js-2',
    title: '箭头函数',
    content: '箭头函数是 ES6 引入的简洁函数写法。它没有自己的 this，继承外层作用域的 this。语法：const fn = (x) => x * 2',
    category: 'JavaScript',
    difficulty: 'intermediate',
    tags: ['ES6', '函数', 'this'],
    createdAt: new Date().toISOString(),
    reviewedCount: 0,
    mastered: false
  },
  {
    id: 'react-1',
    title: 'React 组件基础',
    content: 'React 组件是可复用的 UI 单元。分为函数组件和类组件。现代 React 推荐使用函数组件配合 Hooks。',
    category: 'React',
    difficulty: 'beginner',
    tags: ['组件', '基础', 'Hooks'],
    createdAt: new Date().toISOString(),
    reviewedCount: 0,
    mastered: false
  },
  {
    id: 'react-2',
    title: 'useState Hook',
    content: 'useState 是最基础的 Hook，用于在函数组件中添加状态。用法：const [state, setState] = useState(initialValue)',
    category: 'React',
    difficulty: 'beginner',
    tags: ['Hooks', '状态', '基础'],
    createdAt: new Date().toISOString(),
    reviewedCount: 0,
    mastered: false
  },
  {
    id: 'ts-1',
    title: 'TypeScript 类型基础',
    content: 'TypeScript 为 JavaScript 添加了静态类型。基本类型：string、number、boolean、null、undefined、any、unknown、never',
    category: 'TypeScript',
    difficulty: 'beginner',
    tags: ['类型', '基础'],
    createdAt: new Date().toISOString(),
    reviewedCount: 0,
    mastered: false
  },
  {
    id: 'ts-2',
    title: '接口与类型别名',
    content: 'interface 定义对象形状，type 可定义任何类型。interface 可扩展和声明合并，type 更灵活。推荐对象用 interface，其他用 type。',
    category: 'TypeScript',
    difficulty: 'intermediate',
    tags: ['interface', 'type', '高级'],
    createdAt: new Date().toISOString(),
    reviewedCount: 0,
    mastered: false
  },
  {
    id: 'css-1',
    title: 'Flexbox 布局',
    content: 'Flexbox 是一维布局模型。主要属性：display:flex、justify-content（主轴）、align-items（交叉轴）、flex-direction、flex-wrap',
    category: 'CSS',
    difficulty: 'intermediate',
    tags: ['布局', 'Flexbox', '响应式'],
    createdAt: new Date().toISOString(),
    reviewedCount: 0,
    mastered: false
  },
  {
    id: 'git-1',
    title: 'Git 基本命令',
    content: 'Git 基本命令：git init（初始化）、git add（添加）、git commit（提交）、git push（推送）、git pull（拉取）、git status（状态）',
    category: 'Git',
    difficulty: 'beginner',
    tags: ['版本控制', '基础', '命令'],
    createdAt: new Date().toISOString(),
    reviewedCount: 0,
    mastered: false
  }
]

// 预设学习路径
const defaultLearningPaths: LearningPath[] = [
  {
    id: 'path-js',
    name: 'JavaScript 入门到精通',
    description: '从基础语法到高级特性，全面掌握 JavaScript',
    icon: '🟨',
    totalCards: 25,
    completedCards: 0,
    estimatedTime: 120,
    category: 'JavaScript'
  },
  {
    id: 'path-react',
    name: 'React 开发实战',
    description: '学习 React 核心概念和最佳实践',
    icon: '⚛️',
    totalCards: 20,
    completedCards: 0,
    estimatedTime: 90,
    category: 'React'
  },
  {
    id: 'path-ts',
    name: 'TypeScript 类型系统',
    description: '深入理解 TypeScript 类型系统',
    icon: '📘',
    totalCards: 15,
    completedCards: 0,
    estimatedTime: 60,
    category: 'TypeScript'
  },
  {
    id: 'path-git',
    name: 'Git 版本控制',
    description: '掌握 Git 工作流和团队协作',
    icon: '📦',
    totalCards: 12,
    completedCards: 0,
    estimatedTime: 45,
    category: 'Git'
  }
]

// AI智能问答模拟数据
const aiResponses: Record<string, string> = {
  '变量': '在编程中，变量是存储数据的容器。JavaScript 中使用 let、const 和 var 声明变量。let 用于可变变量，const 用于常量，var 是旧语法不建议使用。',
  '函数': '函数是可复用的代码块。JavaScript 函数可以接收参数、返回值、作为对象方法、或用作回调。箭头函数提供了更简洁的写法。',
  '组件': 'React 组件是构建 UI 的基本单位。组件接收 props 作为输入，返回描述 UI 的 React 元素。组件可以是函数组件或类组件。',
  '状态': '状态（state）是组件的记忆，存储随时间变化的数据。React 中使用 useState Hook 在函数组件中管理状态。',
  '类型': 'TypeScript 类型系统为 JavaScript 添加了静态类型检查。类型帮助在开发阶段发现错误，提高代码质量和开发效率。',
  '默认': '这是一个很好的问题！我建议你通过实际编码练习来加深理解。可以尝试在代码编辑器中编写相关代码，观察运行结果。'
}

export default function AILearningCompanion() {
  const theme = useStore(s => s.theme)
  const addNotification = useStore(s => s.addNotification)

  // 状态管理
  const [activeTab, setActiveTab] = useState<'cards' | 'paths' | 'plan' | 'ai' | 'progress'>('cards')
  const [cards, setCards] = useState<KnowledgeCard[]>(() => {
    const saved = localStorage.getItem('learning-cards')
    return saved ? JSON.parse(saved) : defaultKnowledgeCards
  })
  const [paths] = useState<LearningPath[]>(defaultLearningPaths)
  const [plans, setPlans] = useState<LearningPlan[]>(() => {
    const saved = localStorage.getItem('learning-plans')
    return saved ? JSON.parse(saved) : []
  })
  const [currentCardIndex, setCurrentCardIndex] = useState(0)
  const [showCardAnswer, setShowCardAnswer] = useState(false)
  const [aiQuestion, setAiQuestion] = useState('')
  const [aiAnswer, setAiAnswer] = useState('')
  const [isAiThinking, setIsAiThinking] = useState(false)
  const [selectedCategory, setSelectedCategory] = useState<string>('all')
  const [studyTime, setStudyTime] = useState(0)
  const [dailyGoal, setDailyGoal] = useState(10)

  // 保存到本地存储
  useEffect(() => {
    localStorage.setItem('learning-cards', JSON.stringify(cards))
  }, [cards])

  useEffect(() => {
    localStorage.setItem('learning-plans', JSON.stringify(plans))
  }, [plans])

  // 学习时间计时器
  useEffect(() => {
    const timer = setInterval(() => setStudyTime(t => t + 1), 1000)
    return () => clearInterval(timer)
  }, [])

  // 获取分类列表
  const categories = useMemo(() => {
    const cats = new Set(cards.map(c => c.category))
    return ['all', ...Array.from(cats)]
  }, [cards])

  // 过滤卡片
  const filteredCards = useMemo(() => {
    if (selectedCategory === 'all') return cards
    return cards.filter(c => c.category === selectedCategory)
  }, [cards, selectedCategory])

  // 当前卡片
  const currentCard = filteredCards[currentCardIndex]

  // 标记卡片已掌握
  const markMastered = useCallback(() => {
    if (!currentCard) return
    setCards(prev => prev.map(c =>
      c.id === currentCard.id
        ? { ...c, mastered: true, reviewedCount: c.reviewedCount + 1, lastReviewed: new Date().toISOString() }
        : c
    ))
    setShowCardAnswer(false)
    addNotification({ title: '学习进度', message: `已掌握: ${currentCard.title}`, type: 'success', duration: 2000 })
    // 自动跳转下一张
    if (currentCardIndex < filteredCards.length - 1) {
      setCurrentCardIndex(i => i + 1)
    }
  }, [currentCard, currentCardIndex, filteredCards.length, addNotification])

  // 标记需要复习
  const markNeedReview = useCallback(() => {
    if (!currentCard) return
    setCards(prev => prev.map(c =>
      c.id === currentCard.id
        ? { ...c, reviewedCount: c.reviewedCount + 1, lastReviewed: new Date().toISOString() }
        : c
    ))
    setShowCardAnswer(false)
    if (currentCardIndex < filteredCards.length - 1) {
      setCurrentCardIndex(i => i + 1)
    }
  }, [currentCard, currentCardIndex, filteredCards.length])

  // AI问答
  const askAi = useCallback(() => {
    if (!aiQuestion.trim()) return
    setIsAiThinking(true)
    setAiAnswer('')

    // 模拟AI思考
    setTimeout(() => {
      const keywords = Object.keys(aiResponses)
      let response = aiResponses['默认']
      for (const key of keywords) {
        if (aiQuestion.toLowerCase().includes(key)) {
          response = aiResponses[key]
          break
        }
      }
      setAiAnswer(response)
      setIsAiThinking(false)
    }, 800)
  }, [aiQuestion])

  // 创建学习计划
  const createPlan = useCallback(() => {
    const today = new Date().toISOString().split('T')[0]
    const newPlan: LearningPlan = {
      id: `plan-${Date.now()}`,
      date: today,
      targetCards: dailyGoal,
      completedCards: 0,
      subject: selectedCategory === 'all' ? '综合学习' : selectedCategory,
      notes: ''
    }
    setPlans(prev => [...prev, newPlan])
    addNotification({ title: '计划创建', message: '今日学习计划已创建', type: 'success', duration: 2000 })
  }, [dailyGoal, selectedCategory, addNotification])

  // 计算进度统计
  const stats = useMemo(() => ({
    totalCards: cards.length,
    masteredCards: cards.filter(c => c.mastered).length,
    reviewedToday: cards.filter(c => {
      if (!c.lastReviewed) return false
      const today = new Date().toISOString().split('T')[0]
      return c.lastReviewed.startsWith(today)
    }).length,
    studyTimeMinutes: Math.floor(studyTime / 60),
    masteryRate: Math.round((cards.filter(c => c.mastered).length / cards.length) * 100)
  }), [cards, studyTime])

  // 添加新卡片
  const addNewCard = useCallback(() => {
    const newCard: KnowledgeCard = {
      id: `card-${Date.now()}`,
      title: '新知识卡片',
      content: '在此填写知识点内容...',
      category: selectedCategory === 'all' ? 'JavaScript' : selectedCategory,
      difficulty: 'beginner',
      tags: [],
      createdAt: new Date().toISOString(),
      reviewedCount: 0,
      mastered: false
    }
    setCards(prev => [...prev, newCard])
    addNotification({ title: '卡片创建', message: '新知识卡片已添加', type: 'success', duration: 2000 })
  }, [selectedCategory, addNotification])

  // 样式变量
  const isDark = theme === 'dark'
  const bgGradient = isDark
    ? 'linear-gradient(135deg, #1a1a2e 0%, #16213e 50%, #0f3460 100%)'
    : 'linear-gradient(135deg, #f5f7fa 0%, #e8ecf3 50%, #dfe6f0 100%)'
  const cardBg = isDark ? 'rgba(255,255,255,0.08)' : 'rgba(255,255,255,0.9)'
  const accentGradient = 'linear-gradient(135deg, #e8b4d8 0%, #d4a5d9 50%, #c9a0dc 100%)'
  const warmGradient = 'linear-gradient(135deg, #f8e1f4 0%, #e8d4f0 50%, #d9c7eb 100%)'

  return (
    <div style={{
      height: '100%',
      display: 'flex',
      flexDirection: 'column',
      background: bgGradient,
      color: isDark ? '#e8e8f0' : '#2d3748',
      overflow: 'hidden'
    }}>
      {/* 头部 */}
      <div style={{
        padding: '20px 24px',
        borderBottom: `1px solid ${isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.08)'}`,
        background: isDark ? 'rgba(0,0,0,0.3)' : 'rgba(255,255,255,0.5)'
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div style={{
              width: '48px',
              height: '48px',
              borderRadius: '16px',
              background: warmGradient,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: '0 4px 12px rgba(216,160,220,0.3)'
            }}>
              <Brain size={28} color="#7c3aed" />
            </div>
            <div>
              <h1 style={{ margin: 0, fontSize: '22px', fontWeight: 700 }}>AI 学习伴侣</h1>
              <p style={{ margin: 0, fontSize: '13px', opacity: 0.7 }}>智能辅助学习，知识图谱可视化</p>
            </div>
          </div>
          <div style={{
            display: 'flex',
            gap: '16px',
            alignItems: 'center'
          }}>
            <div style={{
              padding: '10px 16px',
              background: cardBg,
              borderRadius: '12px',
              textAlign: 'center',
              border: `1px solid ${isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.05)'}`,
              boxShadow: '0 2px 8px rgba(0,0,0,0.1)'
            }}>
              <Clock size={18} style={{ marginBottom: '4px', opacity: 0.6 }} />
              <div style={{ fontSize: '16px', fontWeight: 600 }}>
                {Math.floor(studyTime / 60)}:{String(studyTime % 60).padStart(2, '0')}
              </div>
            </div>
            <div style={{
              padding: '10px 16px',
              background: cardBg,
              borderRadius: '12px',
              textAlign: 'center',
              border: `1px solid ${isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.05)'}`,
              boxShadow: '0 2px 8px rgba(0,0,0,0.1)'
            }}>
              <Award size={18} style={{ marginBottom: '4px', opacity: 0.6 }} />
              <div style={{ fontSize: '16px', fontWeight: 600 }}>{stats.masteryRate}%</div>
            </div>
          </div>
        </div>
      </div>

      {/* 标签导航 */}
      <div style={{
        display: 'flex',
        gap: '8px',
        padding: '12px 24px',
        borderBottom: `1px solid ${isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.08)'}`,
        overflow: 'auto'
      }}>
        {[
          { id: 'cards', name: '知识卡片', icon: BookOpen },
          { id: 'paths', name: '学习路径', icon: Target },
          { id: 'plan', name: '学习计划', icon: Clock },
          { id: 'ai', name: 'AI问答', icon: Sparkles },
          { id: 'progress', name: '进度追踪', icon: BarChart3 }
        ].map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as typeof activeTab)}
            style={{
              padding: '10px 18px',
              background: activeTab === tab.id ? accentGradient : cardBg,
              color: activeTab === tab.id ? '#fff' : isDark ? '#c0c0d0' : '#4a5568',
              border: `1px solid ${activeTab === tab.id ? 'rgba(216,160,220,0.5)' : 'transparent'}`,
              borderRadius: '10px',
              cursor: 'pointer',
              fontSize: '14px',
              fontWeight: activeTab === tab.id ? 600 : 400,
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              transition: 'all 0.2s ease',
              boxShadow: activeTab === tab.id ? '0 4px 12px rgba(216,160,220,0.4)' : '0 2px 4px rgba(0,0,0,0.1)'
            }}
          >
            <tab.icon size={18} />
            {tab.name}
          </button>
        ))}
      </div>

      {/* 内容区域 */}
      <div style={{ flex: 1, padding: '20px 24px', overflow: 'auto' }}>
        {/* 知识卡片 */}
        {activeTab === 'cards' && (
          <div>
            {/* 分类过滤 */}
            <div style={{
              display: 'flex',
              gap: '8px',
              marginBottom: '20px',
              flexWrap: 'wrap'
            }}>
              {categories.map(cat => (
                <button
                  key={cat}
                  onClick={() => {
                    setSelectedCategory(cat)
                    setCurrentCardIndex(0)
                    setShowCardAnswer(false)
                  }}
                  style={{
                    padding: '6px 14px',
                    background: selectedCategory === cat ? 'rgba(216,160,220,0.2)' : cardBg,
                    color: selectedCategory === cat ? '#7c3aed' : isDark ? '#9090a4' : '#4a5568',
                    border: `1px solid ${selectedCategory === cat ? '#d4a5d9' : 'transparent'}`,
                    borderRadius: '8px',
                    cursor: 'pointer',
                    fontSize: '13px',
                    transition: 'all 0.15s ease'
                  }}
                >
                  {cat === 'all' ? '全部' : cat}
                </button>
              ))}
              <button
                onClick={addNewCard}
                style={{
                  padding: '6px 14px',
                  background: accentGradient,
                  color: '#fff',
                  border: 'none',
                  borderRadius: '8px',
                  cursor: 'pointer',
                  fontSize: '13px',
                  fontWeight: 500,
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px'
                }}
              >
                <Zap size={14} /> 新增卡片
              </button>
            </div>

            {/* 卡片展示 */}
            {currentCard && (
              <div style={{
                background: cardBg,
                borderRadius: '20px',
                padding: '32px',
                border: `1px solid ${isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.05)'}`,
                boxShadow: '0 8px 32px rgba(0,0,0,0.15)',
                maxWidth: '700px',
                margin: '0 auto',
                position: 'relative'
              }}>
                {/* 卡片头部 */}
                <div style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  marginBottom: '20px'
                }}>
                  <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '12px'
                  }}>
                    <span style={{
                      padding: '6px 12px',
                      background: currentCard.mastered
                        ? 'linear-gradient(135deg, #48bb78, #38a169)'
                        : 'rgba(216,160,220,0.2)',
                      color: currentCard.mastered ? '#fff' : '#7c3aed',
                      borderRadius: '6px',
                      fontSize: '12px',
                      fontWeight: 600
                    }}>
                      {currentCard.mastered ? '已掌握' : '学习中'}
                    </span>
                    <span style={{
                      fontSize: '13px',
                      opacity: 0.6
                    }}>
                      {currentCard.category}
                    </span>
                  </div>
                  <div style={{
                    fontSize: '13px',
                    opacity: 0.6,
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px'
                  }}>
                    <Star size={14} />
                    复习 {currentCard.reviewedCount} 次
                  </div>
                </div>

                {/* 卡片标题 */}
                <h3 style={{
                  margin: '0 0 20px 0',
                  fontSize: '22px',
                  fontWeight: 700,
                  textAlign: 'center'
                }}>
                  {currentCard.title}
                </h3>

                {/* 卡片内容 */}
                <div style={{
                  background: isDark ? 'rgba(0,0,0,0.3)' : 'rgba(0,0,0,0.02)',
                  borderRadius: '12px',
                  padding: showCardAnswer ? '24px' : '16px',
                  marginBottom: '24px',
                  minHeight: '120px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  border: `1px solid ${showCardAnswer ? 'rgba(216,160,220,0.3)' : 'transparent'}`,
                  transition: 'all 0.3s ease'
                }}>
                  {!showCardAnswer ? (
                    <div style={{
                      textAlign: 'center',
                      opacity: 0.8
                    }}>
                      <Lightbulb size={32} style={{ marginBottom: '12px', opacity: 0.4 }} />
                      <p style={{ margin: 0, fontSize: '15px' }}>点击下方按钮显示答案</p>
                    </div>
                  ) : (
                    <p style={{
                      margin: 0,
                      fontSize: '16px',
                      lineHeight: 1.7,
                      textAlign: 'center'
                    }}>
                      {currentCard.content}
                    </p>
                  )}
                </div>

                {/* 操作按钮 */}
                <div style={{
                  display: 'flex',
                  justifyContent: 'center',
                  gap: '16px',
                  marginBottom: '20px'
                }}>
                  {!showCardAnswer ? (
                    <button
                      onClick={() => setShowCardAnswer(true)}
                      style={{
                        padding: '14px 32px',
                        background: accentGradient,
                        color: '#fff',
                        border: 'none',
                        borderRadius: '12px',
                        cursor: 'pointer',
                        fontSize: '16px',
                        fontWeight: 600,
                        boxShadow: '0 4px 16px rgba(216,160,220,0.4)',
                        transition: 'transform 0.2s ease'
                      }}
                    >
                      显示答案
                    </button>
                  ) : (
                    <>
                      <button
                        onClick={markNeedReview}
                        style={{
                          padding: '14px 24px',
                          background: 'linear-gradient(135deg, #ed8936, #dd6b20)',
                          color: '#fff',
                          border: 'none',
                          borderRadius: '12px',
                          cursor: 'pointer',
                          fontSize: '15px',
                          fontWeight: 500,
                          boxShadow: '0 4px 12px rgba(237,137,54,0.3)'
                        }}
                      >
                        需要复习
                      </button>
                      <button
                        onClick={markMastered}
                        style={{
                          padding: '14px 24px',
                          background: 'linear-gradient(135deg, #48bb78, #38a169)',
                          color: '#fff',
                          border: 'none',
                          borderRadius: '12px',
                          cursor: 'pointer',
                          fontSize: '15px',
                          fontWeight: 500,
                          boxShadow: '0 4px 12px rgba(72,187,120,0.3)'
                        }}
                      >
                        <CheckCircle size={18} style={{ marginRight: '8px' }} />
                        已掌握
                      </button>
                    </>
                  )}
                </div>

                {/* 导航按钮 */}
                <div style={{
                  display: 'flex',
                  justifyContent: 'center',
                  gap: '12px'
                }}>
                  <button
                    onClick={() => {
                      setCurrentCardIndex(i => Math.max(0, i - 1))
                      setShowCardAnswer(false)
                    }}
                    disabled={currentCardIndex === 0}
                    style={{
                      padding: '8px 16px',
                      background: cardBg,
                      color: currentCardIndex === 0 ? 'rgba(128,128,128,0.5)' : isDark ? '#c0c0d0' : '#4a5568',
                      border: 'none',
                      borderRadius: '8px',
                      cursor: currentCardIndex === 0 ? 'not-allowed' : 'pointer',
                      fontSize: '13px',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '4px'
                    }}
                  >
                    <ChevronLeft size={16} /> 上一张
                  </button>
                  <span style={{
                    padding: '8px 16px',
                    fontSize: '13px',
                    opacity: 0.7
                  }}>
                    {currentCardIndex + 1} / {filteredCards.length}
                  </span>
                  <button
                    onClick={() => {
                      setCurrentCardIndex(i => Math.min(filteredCards.length - 1, i + 1))
                      setShowCardAnswer(false)
                    }}
                    disabled={currentCardIndex === filteredCards.length - 1}
                    style={{
                      padding: '8px 16px',
                      background: cardBg,
                      color: currentCardIndex === filteredCards.length - 1 ? 'rgba(128,128,128,0.5)' : isDark ? '#c0c0d0' : '#4a5568',
                      border: 'none',
                      borderRadius: '8px',
                      cursor: currentCardIndex === filteredCards.length - 1 ? 'not-allowed' : 'pointer',
                      fontSize: '13px',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '4px'
                    }}
                  >
                    下一张 <ChevronRight size={16} />
                  </button>
                </div>
              </div>
            )}

            {/* 卡片列表概览 */}
            <div style={{
              marginTop: '24px',
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))',
              gap: '12px'
            }}>
              {filteredCards.slice(0, 8).map((card, idx) => (
                <div
                  key={card.id}
                  onClick={() => {
                    setCurrentCardIndex(idx)
                    setShowCardAnswer(false)
                  }}
                  style={{
                    background: currentCardIndex === idx ? accentGradient : cardBg,
                    color: currentCardIndex === idx ? '#fff' : isDark ? '#c0c0d0' : '#4a5568',
                    padding: '14px',
                    borderRadius: '10px',
                    cursor: 'pointer',
                    border: `1px solid ${currentCardIndex === idx ? 'rgba(216,160,220,0.5)' : 'transparent'}`,
                    transition: 'all 0.15s ease',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px'
                  }}
                >
                  {card.mastered ? <CheckCircle size={16} /> : <Circle size={16} />}
                  <span style={{ fontSize: '14px', fontWeight: 500 }}>{card.title}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* 学习路径 */}
        {activeTab === 'paths' && (
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))',
            gap: '20px'
          }}>
            {paths.map(path => (
              <div
                key={path.id}
                style={{
                  background: cardBg,
                  borderRadius: '16px',
                  padding: '24px',
                  border: `1px solid ${isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.05)'}`,
                  boxShadow: '0 4px 16px rgba(0,0,0,0.1)',
                  transition: 'transform 0.2s ease',
                  cursor: 'pointer'
                }}
                onMouseEnter={e => e.currentTarget.style.transform = 'translateY(-4px)'}
                onMouseLeave={e => e.currentTarget.style.transform = 'translateY(0)'}
              >
                <div style={{ fontSize: '48px', marginBottom: '16px' }}>{path.icon}</div>
                <h3 style={{ margin: '0 0 8px 0', fontSize: '18px', fontWeight: 600 }}>{path.name}</h3>
                <p style={{ margin: '0 0 20px 0', fontSize: '14px', opacity: 0.7, lineHeight: 1.6 }}>{path.description}</p>

                {/* 进度条 */}
                <div style={{ marginBottom: '16px' }}>
                  <div style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    fontSize: '13px',
                    marginBottom: '8px',
                    opacity: 0.8
                  }}>
                    <span>{path.completedCards} / {path.totalCards} 卡片</span>
                    <span>{Math.round((path.completedCards / path.totalCards) * 100)}%</span>
                  </div>
                  <div style={{
                    height: '8px',
                    background: isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.08)',
                    borderRadius: '4px',
                    overflow: 'hidden'
                  }}>
                    <div style={{
                      height: '100%',
                      width: `${(path.completedCards / path.totalCards) * 100}%`,
                      background: accentGradient,
                      borderRadius: '4px',
                      transition: 'width 0.5s ease'
                    }} />
                  </div>
                </div>

                <div style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center'
                }}>
                  <span style={{
                    padding: '6px 12px',
                    background: 'rgba(216,160,220,0.15)',
                    borderRadius: '6px',
                    fontSize: '12px',
                    color: '#7c3aed'
                  }}>
                    {path.category}
                  </span>
                  <span style={{ fontSize: '13px', opacity: 0.6 }}>
                    预计 {path.estimatedTime} 分钟
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* 学习计划 */}
        {activeTab === 'plan' && (
          <div style={{ maxWidth: '800px', margin: '0 auto' }}>
            <div style={{
              background: cardBg,
              borderRadius: '16px',
              padding: '24px',
              marginBottom: '24px',
              border: `1px solid ${isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.05)'}`,
              boxShadow: '0 4px 16px rgba(0,0,0,0.1)'
            }}>
              <h3 style={{ margin: '0 0 20px 0', fontSize: '18px', fontWeight: 600 }}>今日学习计划</h3>

              <div style={{
                display: 'flex',
                gap: '16px',
                alignItems: 'center',
                marginBottom: '20px'
              }}>
                <div style={{ flex: 1 }}>
                  <label style={{ display: 'block', marginBottom: '8px', fontSize: '13px', opacity: 0.7 }}>每日目标卡片数</label>
                  <input
                    type="number"
                    min={1}
                    max={50}
                    value={dailyGoal}
                    onChange={e => setDailyGoal(Math.max(1, Math.min(50, parseInt(e.target.value) || 10)))}
                    style={{
                      width: '100%',
                      padding: '10px 14px',
                      background: isDark ? 'rgba(0,0,0,0.3)' : 'rgba(0,0,0,0.02)',
                      border: `1px solid ${isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.08)'}`,
                      borderRadius: '8px',
                      color: isDark ? '#e8e8f0' : '#2d3748',
                      fontSize: '14px'
                    }}
                  />
                </div>
                <div style={{ flex: 1 }}>
                  <label style={{ display: 'block', marginBottom: '8px', fontSize: '13px', opacity: 0.7 }}>学习科目</label>
                  <select
                    value={selectedCategory}
                    onChange={e => setSelectedCategory(e.target.value)}
                    style={{
                      width: '100%',
                      padding: '10px 14px',
                      background: isDark ? 'rgba(0,0,0,0.3)' : 'rgba(0,0,0,0.02)',
                      border: `1px solid ${isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.08)'}`,
                      borderRadius: '8px',
                      color: isDark ? '#e8e8f0' : '#2d3748',
                      fontSize: '14px'
                    }}
                  >
                    {categories.map(cat => (
                      <option key={cat} value={cat}>{cat === 'all' ? '综合学习' : cat}</option>
                    ))}
                  </select>
                </div>
              </div>

              <button
                onClick={createPlan}
                style={{
                  width: '100%',
                  padding: '14px',
                  background: accentGradient,
                  color: '#fff',
                  border: 'none',
                  borderRadius: '10px',
                  cursor: 'pointer',
                  fontSize: '15px',
                  fontWeight: 600,
                  boxShadow: '0 4px 12px rgba(216,160,220,0.4)'
                }}
              >
                创建今日计划
              </button>
            </div>

            {/* 已有计划 */}
            {plans.length > 0 && (
              <div style={{
                background: cardBg,
                borderRadius: '16px',
                padding: '24px',
                border: `1px solid ${isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.05)'}`,
                boxShadow: '0 4px 16px rgba(0,0,0,0.1)'
              }}>
                <h3 style={{ margin: '0 0 16px 0', fontSize: '16px', fontWeight: 600 }}>历史计划</h3>
                {plans.slice(0, 5).map(plan => (
                  <div key={plan.id} style={{
                    padding: '12px',
                    marginBottom: '8px',
                    background: isDark ? 'rgba(0,0,0,0.2)' : 'rgba(0,0,0,0.02)',
                    borderRadius: '10px',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center'
                  }}>
                    <div>
                      <span style={{ fontSize: '14px', fontWeight: 500 }}>{plan.subject}</span>
                      <span style={{ fontSize: '12px', opacity: 0.6, marginLeft: '8px' }}>{plan.date}</span>
                    </div>
                    <div style={{
                      padding: '4px 10px',
                      background: plan.completedCards >= plan.targetCards
                        ? 'linear-gradient(135deg, #48bb78, #38a169)'
                        : 'rgba(216,160,220,0.2)',
                      color: plan.completedCards >= plan.targetCards ? '#fff' : '#7c3aed',
                      borderRadius: '6px',
                      fontSize: '12px'
                    }}>
                      {plan.completedCards} / {plan.targetCards}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* AI问答 */}
        {activeTab === 'ai' && (
          <div style={{ maxWidth: '700px', margin: '0 auto' }}>
            <div style={{
              background: cardBg,
              borderRadius: '20px',
              padding: '32px',
              border: `1px solid ${isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.05)'}`,
              boxShadow: '0 8px 32px rgba(0,0,0,0.15)'
            }}>
              <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: '12px',
                marginBottom: '24px'
              }}>
                <div style={{
                  width: '48px',
                  height: '48px',
                  borderRadius: '16px',
                  background: warmGradient,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}>
                  <MessageCircle size={28} color="#7c3aed" />
                </div>
                <div>
                  <h3 style={{ margin: 0, fontSize: '18px', fontWeight: 600 }}>智能学习助手</h3>
                  <p style={{ margin: 0, fontSize: '13px', opacity: 0.6 }}>有任何学习问题都可以问我</p>
                </div>
              </div>

              {/* 问答输入 */}
              <div style={{ marginBottom: '24px' }}>
                <textarea
                  value={aiQuestion}
                  onChange={e => setAiQuestion(e.target.value)}
                  placeholder="输入你的学习问题，例如：什么是变量？函数怎么定义？React组件是什么？"
                  style={{
                    width: '100%',
                    minHeight: '100px',
                    padding: '16px',
                    background: isDark ? 'rgba(0,0,0,0.3)' : 'rgba(0,0,0,0.02)',
                    border: `1px solid ${isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.08)'}`,
                    borderRadius: '12px',
                    color: isDark ? '#e8e8f0' : '#2d3748',
                    fontSize: '15px',
                    resize: 'vertical',
                    lineHeight: 1.6
                  }}
                />
              </div>

              <button
                onClick={askAi}
                disabled={isAiThinking || !aiQuestion.trim()}
                style={{
                  width: '100%',
                  padding: '14px',
                  background: isAiThinking ? 'rgba(216,160,220,0.5)' : accentGradient,
                  color: '#fff',
                  border: 'none',
                  borderRadius: '12px',
                  cursor: isAiThinking ? 'wait' : 'pointer',
                  fontSize: '15px',
                  fontWeight: 600,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '8px',
                  boxShadow: '0 4px 16px rgba(216,160,220,0.4)'
                }}
              >
                {isAiThinking ? (
                  <>
                    <div style={{
                      width: '18px',
                      height: '18px',
                      border: '2px solid rgba(255,255,255,0.3)',
                      borderTopColor: '#fff',
                      borderRadius: '50%',
                      animation: 'spin 1s linear infinite'
                    }} />
                    正在思考...
                  </>
                ) : (
                  <>
                    <Sparkles size={18} />
                    询问 AI
                  </>
                )}
              </button>

              {/* AI回答 */}
              {aiAnswer && (
                <div style={{
                  marginTop: '24px',
                  padding: '20px',
                  background: isDark ? 'rgba(216,160,220,0.1)' : 'rgba(216,160,220,0.05)',
                  borderRadius: '12px',
                  border: '1px solid rgba(216,160,220,0.2)'
                }}>
                  <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                    marginBottom: '12px'
                  }}>
                    <Brain size={20} color="#7c3aed" />
                    <span style={{ fontSize: '14px', fontWeight: 600, color: '#7c3aed' }}>AI 回答</span>
                  </div>
                  <p style={{
                    margin: 0,
                    fontSize: '15px',
                    lineHeight: 1.7,
                    color: isDark ? '#e8e8f0' : '#2d3748'
                  }}>
                    {aiAnswer}
                  </p>
                </div>
              )}

              {/* 推荐问题 */}
              <div style={{ marginTop: '24px' }}>
                <p style={{ fontSize: '13px', opacity: 0.7, marginBottom: '12px' }}>推荐问题</p>
                <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                  {['变量', '函数', '组件', '状态', '类型'].map(q => (
                    <button
                      key={q}
                      onClick={() => setAiQuestion(`什么是${q}？`)}
                      style={{
                        padding: '8px 16px',
                        background: cardBg,
                        color: isDark ? '#c0c0d0' : '#4a5568',
                        border: 'none',
                        borderRadius: '8px',
                        cursor: 'pointer',
                        fontSize: '13px',
                        transition: 'background 0.15s ease'
                      }}
                    >
                      {q}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* 进度追踪 */}
        {activeTab === 'progress' && (
          <div>
            {/* 统计概览 */}
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))',
              gap: '16px',
              marginBottom: '32px'
            }}>
              {[
                { label: '总卡片数', value: stats.totalCards, icon: BookOpen, color: '#7c3aed' },
                { label: '已掌握', value: stats.masteredCards, icon: CheckCircle, color: '#48bb78' },
                { label: '今日复习', value: stats.reviewedToday, icon: Clock, color: '#ed8936' },
                { label: '学习时长', value: `${stats.studyTimeMinutes}分`, icon: Zap, color: '#38b2ac' },
                { label: '掌握率', value: `${stats.masteryRate}%`, icon: Award, color: '#e53e3e' }
              ].map(stat => (
                <div key={stat.label} style={{
                  background: cardBg,
                  borderRadius: '14px',
                  padding: '20px',
                  textAlign: 'center',
                  border: `1px solid ${isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.05)'}`,
                  boxShadow: '0 4px 12px rgba(0,0,0,0.08)'
                }}>
                  <stat.icon size={28} color={stat.color} style={{ marginBottom: '12px' }} />
                  <div style={{ fontSize: '24px', fontWeight: 700, marginBottom: '6px' }}>{stat.value}</div>
                  <div style={{ fontSize: '13px', opacity: 0.7 }}>{stat.label}</div>
                </div>
              ))}
            </div>

            {/* 进度图表（模拟） */}
            <div style={{
              background: cardBg,
              borderRadius: '16px',
              padding: '24px',
              border: `1px solid ${isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.05)'}`,
              boxShadow: '0 4px 16px rgba(0,0,0,0.1)'
            }}>
              <h3 style={{ margin: '0 0 20px 0', fontSize: '16px', fontWeight: 600 }}>本周学习进度</h3>
              <div style={{
                display: 'flex',
                gap: '8px',
                alignItems: 'flex-end',
                height: '120px'
              }}>
                {['周一', '周二', '周三', '周四', '周五', '周六', '周日'].map((day, idx) => {
                  const height = Math.random() * 80 + 20
                  return (
                    <div key={day} style={{
                      flex: 1,
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center',
                      gap: '8px'
                    }}>
                      <div style={{
                        width: '100%',
                        height: `${height}%`,
                        background: idx === new Date().getDay() - 1 ? accentGradient : 'rgba(216,160,220,0.3)',
                        borderRadius: '6px 6px 0 0',
                        transition: 'height 0.5s ease',
                        boxShadow: idx === new Date().getDay() - 1 ? '0 4px 12px rgba(216,160,220,0.4)' : 'none'
                      }} />
                      <span style={{
                        fontSize: '12px',
                        opacity: idx === new Date().getDay() - 1 ? 1 : 0.6,
                        fontWeight: idx === new Date().getDay() - 1 ? 600 : 400
                      }}>
                        {day}
                      </span>
                    </div>
                  )
                })}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* CSS动画 */}
      <style>{`
        @keyframes spin {
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  )
}