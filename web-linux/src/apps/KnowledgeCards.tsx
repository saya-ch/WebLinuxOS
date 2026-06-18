import { useState, useEffect, useMemo } from 'react'
import { useStore } from '../store'

interface Card {
  id: string
  front: string
  back: string
  category: string
  difficulty: 1 | 2 | 3 | 4 | 5
  tags: string[]
  interval: number
  easeFactor: number
  nextReviewDate: string
  lastReviewedDate: string | null
  reviewCount: number
  createdAt: string
}

const STORAGE_KEY = 'knowledge_cards_v1'

const PRESET_CARDS: Omit<Card, 'id' | 'interval' | 'easeFactor' | 'nextReviewDate' | 'lastReviewedDate' | 'reviewCount' | 'createdAt'>[] = [
  {
    front: '什么是闭包（Closure）？',
    back: '闭包是指有权访问另一个函数作用域中变量的函数。即使外部函数已经执行完毕，内部函数仍然可以引用其中的变量和参数。常见应用：数据私有化、模块化、柯里化。',
    category: 'JavaScript',
    difficulty: 4,
    tags: ['基础', '作用域', '函数'],
  },
  {
    front: 'Promise 的三种状态是什么？',
    back: 'pending（进行中）、fulfilled（已成功）、rejected（已失败）。状态只能从 pending 变为 fulfilled 或 rejected，一旦改变就不可逆转。',
    category: 'JavaScript',
    difficulty: 3,
    tags: ['异步', 'ES6'],
  },
  {
    front: '什么是原型链（Prototype Chain）？',
    back: '当访问对象的属性时，如果对象自身没有该属性，JS 会沿着 __proto__ 向上查找其构造函数的 prototype 对象，直到 null 为止，这一链式结构称为原型链。它是 JavaScript 实现继承的核心机制。',
    category: 'JavaScript',
    difficulty: 5,
    tags: ['基础', '继承', 'OOP'],
  },
  {
    front: 'let、const 和 var 的区别？',
    back: 'var：函数作用域，存在变量提升，可重复声明。let：块级作用域，存在暂时性死区，不可重复声明。const：块级作用域，声明时必须初始化，引用不可变（对象内容可修改）。优先使用 const，其次 let。',
    category: 'JavaScript',
    difficulty: 2,
    tags: ['基础', 'ES6', '变量'],
  },
  {
    front: 'React 中 useState 的作用是什么？',
    back: 'useState 是 React 的 Hook，用于在函数组件中添加状态管理。它返回一个状态值和一个更新该状态的函数。调用更新函数时，React 会重新渲染组件。',
    category: 'React',
    difficulty: 2,
    tags: ['Hooks', '状态'],
  },
  {
    front: 'React useEffect 的依赖数组有哪几种用法？',
    back: '①不传依赖数组：每次渲染后都执行；②空数组 []：仅在组件挂载时执行一次（类似 componentDidMount）；③包含依赖项 [a, b]：当任一依赖项变化时重新执行。',
    category: 'React',
    difficulty: 3,
    tags: ['Hooks', '副作用'],
  },
  {
    front: '什么是事件循环（Event Loop）？',
    back: 'JS 运行时的执行机制：调用栈执行同步代码，遇到异步任务（宏任务如 setTimeout、微任务如 Promise.then）会放入相应队列。调用栈清空后，先执行所有微任务，再执行一个宏任务，然后重复此过程。',
    category: 'JavaScript',
    difficulty: 4,
    tags: ['异步', '运行时'],
  },
  {
    front: 'HTTP 状态码 200、301、304、401、404、500 分别表示什么？',
    back: '200 请求成功；301 永久重定向；304 未修改（使用缓存）；401 未授权；404 资源未找到；500 服务器内部错误。',
    category: '网络',
    difficulty: 2,
    tags: ['HTTP', '基础'],
  },
  {
    front: 'Git 中 merge 和 rebase 的区别？',
    back: 'merge：保留完整的提交历史，创建一个合并提交，历史呈分支合并形态。rebase：将当前分支的提交"移动"到目标分支之上，形成线性历史。一般原则：公共分支用 merge，个人特性分支可用 rebase。',
    category: '工具',
    difficulty: 3,
    tags: ['Git', '版本控制'],
  },
  {
    front: '什么是 CSS 盒模型（Box Model）？',
    back: '每个元素由 content（内容）、padding（内边距）、border（边框）、margin（外边距）组成。box-sizing：content-box（默认，width 仅指内容）、border-box（width 包含 padding 和 border，更直观）。',
    category: 'CSS',
    difficulty: 2,
    tags: ['基础', '布局'],
  },
]

const todayISO = () => new Date().toISOString().slice(0, 10)

const isDueToday = (card: Card) => {
  return card.nextReviewDate <= todayISO()
}

const buildDefaultCards = (): Card[] => {
  const today = todayISO()
  return PRESET_CARDS.map((c, idx) => ({
    id: `preset-${idx + 1}`,
    ...c,
    interval: 1,
    easeFactor: 2.5,
    nextReviewDate: today,
    lastReviewedDate: null,
    reviewCount: 0,
    createdAt: today,
  }))
}

const loadCards = (): Card[] => {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return buildDefaultCards()
    const parsed = JSON.parse(raw)
    if (Array.isArray(parsed) && parsed.length > 0) return parsed as Card[]
    return buildDefaultCards()
  } catch {
    return buildDefaultCards()
  }
}

const persistCards = (cards: Card[]) => {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(cards))
  } catch {
    // ignore
  }
}

const addDays = (iso: string, days: number) => {
  const d = new Date(iso)
  d.setDate(d.getDate() + days)
  return d.toISOString().slice(0, 10)
}

const applyReview = (card: Card, remembered: boolean): Card => {
  const today = todayISO()
  if (remembered) {
    const newInterval = card.interval === 0 ? 1 : card.interval * 2
    return {
      ...card,
      interval: newInterval,
      nextReviewDate: addDays(today, newInterval),
      lastReviewedDate: today,
      reviewCount: card.reviewCount + 1,
    }
  }
  return {
    ...card,
    interval: 1,
    nextReviewDate: addDays(today, 1),
    lastReviewedDate: today,
    reviewCount: card.reviewCount + 1,
  }
}

const difficultyLabel = (d: number) =>
  ({ 1: '入门', 2: '简单', 3: '中等', 4: '较难', 5: '精通' })[d] || String(d)

const difficultyColor = (d: number, dark: boolean) => {
  const palette = dark
    ? ['#6b7386', '#38c172', '#f59e0b', '#ef7b44', '#ef4444']
    : ['#6b7386', '#22a06b', '#d98207', '#d35a22', '#c92d2d']
  return palette[Math.max(0, Math.min(4, d - 1))]
}

export default function KnowledgeCards() {
  const theme = useStore((s) => s.theme)
  const isDark = theme === 'dark'

  const [cards, setCards] = useState<Card[]>(() => loadCards())
  const [tab, setTab] = useState<'today' | 'browse' | 'new'>('today')
  const [search, setSearch] = useState('')
  const [categoryFilter, setCategoryFilter] = useState<string>('all')
  const [studyIndex, setStudyIndex] = useState(0)
  const [flippedIds, setFlippedIds] = useState<Set<string>>(new Set())
  const [studyFlipped, setStudyFlipped] = useState(false)

  const [formFront, setFormFront] = useState('')
  const [formBack, setFormBack] = useState('')
  const [formCategory, setFormCategory] = useState('JavaScript')
  const [formDifficulty, setFormDifficulty] = useState<1 | 2 | 3 | 4 | 5>(3)
  const [formTags, setFormTags] = useState('')

  useEffect(() => {
    persistCards(cards)
  }, [cards])

  const categories = useMemo(() => {
    const set = new Set<string>()
    cards.forEach((c) => set.add(c.category))
    return ['all', ...Array.from(set)]
  }, [cards])

  const todayCards = useMemo(() => cards.filter(isDueToday), [cards])

  const filteredCards = useMemo(() => {
    const q = search.trim().toLowerCase()
    return cards.filter((c) => {
      if (categoryFilter !== 'all' && c.category !== categoryFilter) return false
      if (!q) return true
      return (
        c.front.toLowerCase().includes(q) ||
        c.back.toLowerCase().includes(q) ||
        c.tags.some((t) => t.toLowerCase().includes(q)) ||
        c.category.toLowerCase().includes(q)
      )
    })
  }, [cards, search, categoryFilter])

  const toggleFlip = (id: string) => {
    setFlippedIds((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  const handleCreate = () => {
    if (!formFront.trim() || !formBack.trim()) return
    const tags = formTags
      .split(/[,，]/)
      .map((t) => t.trim())
      .filter(Boolean)
    const newCard: Card = {
      id: `c-${Date.now()}`,
      front: formFront.trim(),
      back: formBack.trim(),
      category: formCategory.trim() || '未分类',
      difficulty: formDifficulty,
      tags,
      interval: 1,
      easeFactor: 2.5,
      nextReviewDate: todayISO(),
      lastReviewedDate: null,
      reviewCount: 0,
      createdAt: todayISO(),
    }
    setCards((prev) => [newCard, ...prev])
    setFormFront('')
    setFormBack('')
    setFormTags('')
    setTab('browse')
  }

  const markCard = (id: string, remembered: boolean) => {
    setCards((prev) => prev.map((c) => (c.id === id ? applyReview(c, remembered) : c)))
    setStudyFlipped(false)
  }

  const deleteCard = (id: string) => {
    if (!confirm('确定删除这张卡片？')) return
    setCards((prev) => prev.filter((c) => c.id !== id))
  }

  const nextStudy = () => {
    setStudyFlipped(false)
    setStudyIndex((i) => (i + 1) % todayCards.length)
  }

  const resetAll = () => {
    if (!confirm('确定重置所有卡片为预设示例？这将清除你创建的全部内容。')) return
    setCards(buildDefaultCards())
    setStudyIndex(0)
    setStudyFlipped(false)
  }

  const colors = {
    bg: isDark ? '#1a1d24' : '#f7f8fa',
    panel: isDark ? '#242832' : '#ffffff',
    panelAlt: isDark ? '#1f2330' : '#f2f4f7',
    border: isDark ? '#353a47' : '#e4e7eb',
    textPrimary: isDark ? '#e6e8ef' : '#1f2328',
    textSecondary: isDark ? '#9ba3b4' : '#5f6b7a',
    textMuted: isDark ? '#6b7386' : '#8a94a4',
    accent: '#4f7cff',
    accentHover: '#3e6ae0',
    accentBg: isDark ? 'rgba(79, 124, 255, 0.12)' : 'rgba(79, 124, 255, 0.08)',
    success: '#38c172',
    danger: '#ef4444',
    warning: '#f59e0b',
    inputBg: isDark ? '#1a1d24' : '#f7f8fa',
    front: isDark ? '#2a2f3d' : '#ffffff',
    back: isDark ? '#2f3a4a' : '#eef3ff',
  }

  const tabsMeta: { key: 'today' | 'browse' | 'new'; label: string; count?: number }[] = [
    { key: 'today', label: '今日复习', count: todayCards.length },
    { key: 'browse', label: '浏览全部', count: cards.length },
    { key: 'new', label: '新建卡片' },
  ]

  const currentStudyCard = todayCards[studyIndex]

  const CardView = ({ card, compact = false }: { card: Card; compact?: boolean }) => {
    const isFlipped = flippedIds.has(card.id)
    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
        <div
          onClick={() => toggleFlip(card.id)}
          style={{
            perspective: '1200px',
            cursor: 'pointer',
            height: compact ? 220 : 280,
          }}
        >
          <div
            style={{
              position: 'relative',
              width: '100%',
              height: '100%',
              transformStyle: 'preserve-3d',
              transition: 'transform 0.7s cubic-bezier(0.4, 0, 0.2, 1)',
              transform: isFlipped ? 'rotateY(180deg)' : 'rotateY(0deg)',
            }}
          >
            <div
              style={{
                position: 'absolute',
                inset: 0,
                backfaceVisibility: 'hidden',
                background: colors.front,
                border: `1px solid ${colors.border}`,
                borderRadius: 14,
                padding: '24px 28px',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'space-between',
                boxShadow: isDark ? '0 4px 18px rgba(0,0,0,0.35)' : '0 2px 10px rgba(0,0,0,0.06)',
              }}
            >
              <div
                style={{
                  fontSize: '12px',
                  color: colors.accent,
                  fontWeight: 600,
                  letterSpacing: '0.5px',
                  textTransform: 'uppercase',
                }}
              >
                问题 · 点击翻转
              </div>
              <div style={{ fontSize: compact ? 16 : 19, color: colors.textPrimary, fontWeight: 600, lineHeight: 1.6 }}>
                {card.front}
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: 12, color: colors.textMuted }}>
                <span>{card.category}</span>
                <span>
                  {isDueToday(card) ? '待复习' : `下次：${card.nextReviewDate}`}
                </span>
              </div>
            </div>

            <div
              style={{
                position: 'absolute',
                inset: 0,
                backfaceVisibility: 'hidden',
                background: colors.back,
                border: `1px solid ${colors.border}`,
                borderRadius: 14,
                padding: '24px 28px',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'space-between',
                transform: 'rotateY(180deg)',
                boxShadow: isDark ? '0 4px 18px rgba(0,0,0,0.35)' : '0 2px 10px rgba(0,0,0,0.06)',
              }}
            >
              <div
                style={{
                  fontSize: '12px',
                  color: colors.success,
                  fontWeight: 600,
                  letterSpacing: '0.5px',
                  textTransform: 'uppercase',
                }}
              >
                答案
              </div>
              <div style={{ fontSize: compact ? 15 : 17, color: colors.textPrimary, lineHeight: 1.7 }}>
                {card.back}
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, color: colors.textMuted }}>
                <span>已复习 {card.reviewCount} 次</span>
                <span>间隔 {card.interval} 天</span>
              </div>
            </div>
          </div>
        </div>

        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, alignItems: 'center' }}>
          <span
            style={{
              fontSize: 11,
              padding: '3px 8px',
              borderRadius: 20,
              background: colors.accentBg,
              color: colors.accent,
              fontWeight: 600,
            }}
          >
            {card.category}
          </span>
          <span
            style={{
              fontSize: 11,
              padding: '3px 8px',
              borderRadius: 20,
              color: '#fff',
              background: difficultyColor(card.difficulty, isDark),
              fontWeight: 600,
            }}
          >
            {difficultyLabel(card.difficulty)}
          </span>
          {card.tags.map((t) => (
            <span
              key={t}
              style={{
                fontSize: 11,
                padding: '3px 8px',
                borderRadius: 20,
                background: colors.panelAlt,
                color: colors.textSecondary,
                border: `1px solid ${colors.border}`,
              }}
            >
              #{t}
            </span>
          ))}
        </div>
      </div>
    )
  }

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        height: '100%',
        background: colors.bg,
        color: colors.textPrimary,
        fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", "PingFang SC", "Microsoft YaHei", sans-serif',
      }}
    >
      <div
        style={{
          padding: '16px 24px',
          borderBottom: `1px solid ${colors.border}`,
          background: colors.panel,
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: 12,
        }}
      >
        <div>
          <h1 style={{ margin: 0, fontSize: 18, fontWeight: 700 }}>🧠 知识卡片</h1>
          <p style={{ margin: '4px 0 0', fontSize: 12, color: colors.textSecondary }}>
            基于间隔重复记忆 · 共 {cards.length} 张 · 今日待复习 {todayCards.length} 张
          </p>
        </div>
        <button
          onClick={resetAll}
          style={{
            padding: '8px 14px',
            fontSize: 12,
            background: colors.panelAlt,
            border: `1px solid ${colors.border}`,
            color: colors.textSecondary,
            borderRadius: 8,
            cursor: 'pointer',
          }}
        >
          重置示例
        </button>
      </div>

      <div
        style={{
          display: 'flex',
          gap: 4,
          padding: '10px 24px',
          borderBottom: `1px solid ${colors.border}`,
          background: colors.panel,
        }}
      >
        {tabsMeta.map((t) => {
          const active = tab === t.key
          return (
            <button
              key={t.key}
              onClick={() => setTab(t.key)}
              style={{
                padding: '8px 16px',
                fontSize: 13,
                fontWeight: active ? 600 : 500,
                background: active ? colors.accentBg : 'transparent',
                color: active ? colors.accent : colors.textSecondary,
                border: `1px solid ${active ? colors.accent : colors.border}`,
                borderRadius: 8,
                cursor: 'pointer',
                transition: 'all 0.15s',
              }}
            >
              {t.label}
              {typeof t.count === 'number' && (
                <span style={{ marginLeft: 6, opacity: 0.8 }}>({t.count})</span>
              )}
            </button>
          )
        })}
      </div>

      <div style={{ flex: 1, overflow: 'auto', padding: 24 }}>
        {tab === 'today' && (
          <div style={{ maxWidth: 720, margin: '0 auto' }}>
            {todayCards.length === 0 ? (
              <div
                style={{
                  textAlign: 'center',
                  padding: '80px 20px',
                  color: colors.textMuted,
                }}
              >
                <div style={{ fontSize: 48, marginBottom: 16 }}>🎉</div>
                <div style={{ fontSize: 16, fontWeight: 600, color: colors.textPrimary }}>今日复习已完成！</div>
                <div style={{ fontSize: 13, marginTop: 8 }}>
                  明天再来，或去"浏览全部"查看其他卡片。
                </div>
              </div>
            ) : (
              <>
                <div
                  style={{
                    marginBottom: 16,
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    fontSize: 13,
                    color: colors.textSecondary,
                  }}
                >
                  <span>
                    进度：{studyIndex + 1} / {todayCards.length}
                  </span>
                  <span>{Math.round(((studyIndex + 1) / todayCards.length) * 100)}%</span>
                </div>
                <div
                  style={{
                    height: 4,
                    background: colors.panelAlt,
                    borderRadius: 2,
                    overflow: 'hidden',
                    marginBottom: 20,
                  }}
                >
                  <div
                    style={{
                      height: '100%',
                      width: `${((studyIndex + 1) / todayCards.length) * 100}%`,
                      background: colors.accent,
                      transition: 'width 0.3s',
                    }}
                  />
                </div>

                <div style={{ perspective: '1200px', marginBottom: 20 }}>
                  <div
                    onClick={() => setStudyFlipped((v) => !v)}
                    style={{
                      position: 'relative',
                      width: '100%',
                      height: 320,
                      transformStyle: 'preserve-3d',
                      transition: 'transform 0.7s cubic-bezier(0.4, 0, 0.2, 1)',
                      transform: studyFlipped ? 'rotateY(180deg)' : 'rotateY(0deg)',
                      cursor: 'pointer',
                    }}
                  >
                    <div
                      style={{
                        position: 'absolute',
                        inset: 0,
                        backfaceVisibility: 'hidden',
                        background: colors.front,
                        border: `1px solid ${colors.border}`,
                        borderRadius: 16,
                        padding: '36px 40px',
                        display: 'flex',
                        flexDirection: 'column',
                        justifyContent: 'space-between',
                        boxShadow: isDark ? '0 8px 30px rgba(0,0,0,0.35)' : '0 4px 16px rgba(0,0,0,0.06)',
                      }}
                    >
                      <div
                        style={{
                          fontSize: 12,
                          color: colors.accent,
                          fontWeight: 700,
                          letterSpacing: 1,
                          textTransform: 'uppercase',
                        }}
                      >
                        问题 · 点击翻转查看答案
                      </div>
                      <div style={{ fontSize: 22, fontWeight: 600, lineHeight: 1.7 }}>
                        {currentStudyCard.front}
                      </div>
                      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', fontSize: 12, color: colors.textMuted }}>
                        <span>{currentStudyCard.category}</span>
                        <span>·</span>
                        <span>{difficultyLabel(currentStudyCard.difficulty)}</span>
                      </div>
                    </div>

                    <div
                      style={{
                        position: 'absolute',
                        inset: 0,
                        backfaceVisibility: 'hidden',
                        background: colors.back,
                        border: `1px solid ${colors.border}`,
                        borderRadius: 16,
                        padding: '36px 40px',
                        display: 'flex',
                        flexDirection: 'column',
                        justifyContent: 'space-between',
                        transform: 'rotateY(180deg)',
                        boxShadow: isDark ? '0 8px 30px rgba(0,0,0,0.35)' : '0 4px 16px rgba(0,0,0,0.06)',
                      }}
                    >
                      <div
                        style={{
                          fontSize: 12,
                          color: colors.success,
                          fontWeight: 700,
                          letterSpacing: 1,
                          textTransform: 'uppercase',
                        }}
                      >
                        答案
                      </div>
                      <div style={{ fontSize: 18, lineHeight: 1.8 }}>{currentStudyCard.back}</div>
                      <div style={{ fontSize: 12, color: colors.textMuted }}>选择下方按钮以标记复习结果</div>
                    </div>
                  </div>
                </div>

                <div style={{ display: 'flex', gap: 12, justifyContent: 'center' }}>
                  <button
                    onClick={() => markCard(currentStudyCard.id, false)}
                    style={{
                      flex: 1,
                      padding: '14px 20px',
                      background: `linear-gradient(135deg, ${colors.danger} 0%, #c92d2d 100%)`,
                      color: '#fff',
                      border: 'none',
                      borderRadius: 12,
                      cursor: 'pointer',
                      fontSize: 14,
                      fontWeight: 600,
                    }}
                  >
                    😵 忘记了（1 天后）
                  </button>
                  <button
                    onClick={() => markCard(currentStudyCard.id, true)}
                    style={{
                      flex: 1,
                      padding: '14px 20px',
                      background: `linear-gradient(135deg, ${colors.success} 0%, #22a06b 100%)`,
                      color: '#fff',
                      border: 'none',
                      borderRadius: 12,
                      cursor: 'pointer',
                      fontSize: 14,
                      fontWeight: 600,
                    }}
                  >
                    🎯 记得（间隔 ×2）
                  </button>
                  <button
                    onClick={nextStudy}
                    style={{
                      padding: '14px 16px',
                      background: colors.panelAlt,
                      border: `1px solid ${colors.border}`,
                      color: colors.textSecondary,
                      borderRadius: 12,
                      cursor: 'pointer',
                      fontSize: 14,
                      fontWeight: 600,
                    }}
                  >
                    跳过
                  </button>
                </div>
              </>
            )}
          </div>
        )}

        {tab === 'browse' && (
          <div style={{ maxWidth: 1200, margin: '0 auto' }}>
            <div style={{ display: 'flex', gap: 12, marginBottom: 20, flexWrap: 'wrap' }}>
              <input
                placeholder="🔍 搜索问题、答案、标签或分类..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                style={{
                  flex: 1,
                  minWidth: 220,
                  padding: '10px 14px',
                  background: colors.inputBg,
                  border: `1px solid ${colors.border}`,
                  color: colors.textPrimary,
                  borderRadius: 10,
                  fontSize: 13,
                  outline: 'none',
                }}
              />
              <select
                value={categoryFilter}
                onChange={(e) => setCategoryFilter(e.target.value)}
                style={{
                  padding: '10px 14px',
                  background: colors.inputBg,
                  border: `1px solid ${colors.border}`,
                  color: colors.textPrimary,
                  borderRadius: 10,
                  fontSize: 13,
                  outline: 'none',
                  cursor: 'pointer',
                }}
              >
                {categories.map((c) => (
                  <option key={c} value={c}>
                    {c === 'all' ? '全部分类' : c}
                  </option>
                ))}
              </select>
            </div>

            {filteredCards.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '60px 20px', color: colors.textMuted, fontSize: 14 }}>
                没有找到匹配的卡片
              </div>
            ) : (
              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))',
                  gap: 16,
                }}
              >
                {filteredCards.map((card) => (
                  <div
                    key={card.id}
                    style={{
                      background: colors.panel,
                      border: `1px solid ${colors.border}`,
                      borderRadius: 14,
                      padding: 16,
                      display: 'flex',
                      flexDirection: 'column',
                      gap: 12,
                    }}
                  >
                    <CardView card={card} compact />
                    <button
                      onClick={() => deleteCard(card.id)}
                      style={{
                        padding: '6px 10px',
                        fontSize: 12,
                        background: 'transparent',
                        border: `1px solid ${colors.border}`,
                        color: colors.danger,
                        borderRadius: 8,
                        cursor: 'pointer',
                        alignSelf: 'flex-end',
                      }}
                    >
                      删除
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {tab === 'new' && (
          <div style={{ maxWidth: 640, margin: '0 auto' }}>
            <div
              style={{
                background: colors.panel,
                border: `1px solid ${colors.border}`,
                borderRadius: 14,
                padding: 24,
                display: 'flex',
                flexDirection: 'column',
                gap: 16,
              }}
            >
              <div>
                <h2 style={{ margin: 0, fontSize: 16, fontWeight: 700 }}>创建新卡片</h2>
                <p style={{ margin: '4px 0 0', fontSize: 12, color: colors.textSecondary }}>
                  填写卡片的问题、答案与相关信息
                </p>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                <label style={{ fontSize: 12, color: colors.textSecondary, fontWeight: 600 }}>正面（问题）</label>
                <textarea
                  value={formFront}
                  onChange={(e) => setFormFront(e.target.value)}
                  placeholder="例如：什么是闭包？"
                  rows={2}
                  style={{
                    padding: '10px 12px',
                    background: colors.inputBg,
                    border: `1px solid ${colors.border}`,
                    color: colors.textPrimary,
                    borderRadius: 10,
                    fontSize: 14,
                    fontFamily: 'inherit',
                    resize: 'vertical',
                    outline: 'none',
                  }}
                />
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                <label style={{ fontSize: 12, color: colors.textSecondary, fontWeight: 600 }}>背面（答案）</label>
                <textarea
                  value={formBack}
                  onChange={(e) => setFormBack(e.target.value)}
                  placeholder="详细的答案说明..."
                  rows={4}
                  style={{
                    padding: '10px 12px',
                    background: colors.inputBg,
                    border: `1px solid ${colors.border}`,
                    color: colors.textPrimary,
                    borderRadius: 10,
                    fontSize: 14,
                    fontFamily: 'inherit',
                    resize: 'vertical',
                    outline: 'none',
                  }}
                />
              </div>

              <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 6, flex: 1, minWidth: 180 }}>
                  <label style={{ fontSize: 12, color: colors.textSecondary, fontWeight: 600 }}>分类</label>
                  <input
                    value={formCategory}
                    onChange={(e) => setFormCategory(e.target.value)}
                    placeholder="JavaScript"
                    style={{
                      padding: '10px 12px',
                      background: colors.inputBg,
                      border: `1px solid ${colors.border}`,
                      color: colors.textPrimary,
                      borderRadius: 10,
                      fontSize: 14,
                      outline: 'none',
                    }}
                  />
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: 6, flex: 1, minWidth: 180 }}>
                  <label style={{ fontSize: 12, color: colors.textSecondary, fontWeight: 600 }}>
                    难度：{difficultyLabel(formDifficulty)}
                  </label>
                  <div style={{ display: 'flex', gap: 4 }}>
                    {[1, 2, 3, 4, 5].map((n) => (
                      <button
                        key={n}
                        onClick={() => setFormDifficulty(n as 1 | 2 | 3 | 4 | 5)}
                        style={{
                          flex: 1,
                          padding: '8px 0',
                          fontSize: 12,
                          background: formDifficulty === n ? difficultyColor(n, isDark) : colors.inputBg,
                          color: formDifficulty === n ? '#fff' : colors.textSecondary,
                          border: `1px solid ${formDifficulty === n ? 'transparent' : colors.border}`,
                          borderRadius: 8,
                          cursor: 'pointer',
                          fontWeight: 600,
                        }}
                      >
                        {n}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                <label style={{ fontSize: 12, color: colors.textSecondary, fontWeight: 600 }}>
                  标签（用逗号分隔）
                </label>
                <input
                  value={formTags}
                  onChange={(e) => setFormTags(e.target.value)}
                  placeholder="基础, 异步, ES6"
                  style={{
                    padding: '10px 12px',
                    background: colors.inputBg,
                    border: `1px solid ${colors.border}`,
                    color: colors.textPrimary,
                    borderRadius: 10,
                    fontSize: 14,
                    outline: 'none',
                  }}
                />
              </div>

              <div
                style={{
                  display: 'flex',
                  gap: 10,
                  marginTop: 8,
                }}
              >
                <button
                  onClick={handleCreate}
                  disabled={!formFront.trim() || !formBack.trim()}
                  style={{
                    flex: 1,
                    padding: '12px 20px',
                    background: formFront.trim() && formBack.trim()
                      ? `linear-gradient(135deg, ${colors.accent} 0%, ${colors.accentHover} 100%)`
                      : colors.panelAlt,
                    color: formFront.trim() && formBack.trim() ? '#fff' : colors.textMuted,
                    border: 'none',
                    borderRadius: 10,
                    fontSize: 14,
                    fontWeight: 600,
                    cursor: formFront.trim() && formBack.trim() ? 'pointer' : 'not-allowed',
                  }}
                >
                  创建卡片
                </button>
                <button
                  onClick={() => {
                    setFormFront('')
                    setFormBack('')
                    setFormTags('')
                  }}
                  style={{
                    padding: '12px 20px',
                    background: colors.panelAlt,
                    border: `1px solid ${colors.border}`,
                    color: colors.textSecondary,
                    borderRadius: 10,
                    fontSize: 14,
                    fontWeight: 600,
                    cursor: 'pointer',
                  }}
                >
                  清空
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
