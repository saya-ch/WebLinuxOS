import { useState, useEffect, useCallback } from 'react'
import { RefreshCw, Copy, Heart, Star, Quote, Sparkles, Check, Trash2 } from 'lucide-react'

interface ZenQuote {
  q: string
  a: string
  c?: string
  h?: string
}

interface Category {
  key: string
  label: string
  gradient: string
}

const categories: Category[] = [
  { key: 'inspire', label: '励志', gradient: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)' },
  { key: 'manage', label: '管理', gradient: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)' },
  { key: 'life', label: '生活', gradient: 'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)' },
  { key: 'love', label: '爱情', gradient: 'linear-gradient(135deg, #fa709a 0%, #fee140 100%)' },
  { key: 'art', label: '艺术', gradient: 'linear-gradient(135deg, #a18cd1 0%, #fbc2eb 100%)' },
  { key: 'science', label: '科学', gradient: 'linear-gradient(135deg, #43e97b 0%, #38f9d7 100%)' },
]

const categoryNames: Record<string, string> = {
  inspire: '励志',
  manage: '管理',
  life: '生活',
  love: '爱情',
  art: '艺术',
  science: '科学',
}

const STORAGE_KEY = 'weblinux-quickquote-favorites'

const fallbackQuotes: Record<string, { q: string; a: string }[]> = {
  inspire: [
    { q: '成功不是终点，失败也非末日，继续前进的勇气才最可贵。', a: '丘吉尔' },
    { q: '你的时间有限，不要浪费在重复别人的生活上。', a: '史蒂夫·乔布斯' },
    { q: '梦想不会逃跑，会逃跑的永远是自己。', a: '稻盛和夫' },
  ],
  manage: [
    { q: '管理就是通过他人来完成工作。', a: '彼得·德鲁克' },
    { q: '好的管理者是让别人感到他们自己也能做到。', a: '李·艾柯卡' },
    { q: '战略决定做什么，文化决定做到什么程度。', a: '郭士纳' },
  ],
  life: [
    { q: '生活就像骑自行车，要保持平衡，就得往前走。', a: '爱因斯坦' },
    { q: '世界上只有一种真正的英雄主义，那就是在认清生活真相之后依然热爱生活。', a: '罗曼·罗兰' },
    { q: '人生如逆旅，我亦是行人。', a: '苏轼' },
  ],
  love: [
    { q: '爱不是彼此凝视，而是一起注视同一个方向。', a: '圣埃克苏佩里' },
    { q: '世界上最遥远的距离，是我站在你面前，你却不知道我爱你。', a: '泰戈尔' },
    { q: '愿我如星君如月，夜夜流光相皎洁。', a: '范成大' },
  ],
  art: [
    { q: '艺术不是你所看到的，而是你让别人看到的。', a: '艾德加·德加' },
    { q: '每个孩子都是艺术家，问题在于长大之后如何继续保持艺术家的灵性。', a: '毕加索' },
    { q: '在艺术中，最简单的东西就是最伟大的东西。', a: '罗丹' },
  ],
  science: [
    { q: '科学没有国界，科学家却有祖国。', a: '巴斯德' },
    { q: '想象力比知识更重要。', a: '爱因斯坦' },
    { q: '在科学上没有平坦的大道，只有不畏劳苦沿着陡峭山路攀登的人，才有希望达到光辉的顶点。', a: '马克思' },
  ],
}

export default function QuickQuote() {
  const [quote, setQuote] = useState<ZenQuote | null>(null)
  const [loading, setLoading] = useState(false)
  const [loadingText, setLoadingText] = useState('')
  const [activeCategory, setActiveCategory] = useState<string>('inspire')
  const [favorites, setFavorites] = useState<ZenQuote[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY)
      return saved ? JSON.parse(saved) : []
    } catch { return [] }
  })
  const [showFavorites, setShowFavorites] = useState(false)
  const [copied, setCopied] = useState(false)
  const [isTransitioning, setIsTransitioning] = useState(false)

  const fetchQuote = useCallback(async (category: string) => {
    setLoading(true)
    setLoadingText('获取名言中...')
    setIsTransitioning(true)

    try {
      const url = category === 'inspire'
        ? 'https://zenquotes.io/api/random'
        : `https://zenquotes.io/api/random/${category}`
      const res = await fetch(url)
      if (res.ok) {
        const data = await res.json()
        if (Array.isArray(data) && data.length > 0) {
          setQuote(data[0])
          setLoading(false)
          setTimeout(() => setIsTransitioning(false), 50)
          return
        }
      }
      throw new Error('API不可用')
    } catch {
      const fb = fallbackQuotes[category]
      const random = fb[Math.floor(Math.random() * fb.length)]
      setQuote({ q: random.q, a: random.a, c: category })
    } finally {
      setLoading(false)
      setTimeout(() => setIsTransitioning(false), 300)
    }
  }, [])

  useEffect(() => {
    fetchQuote(activeCategory)
  }, [activeCategory, fetchQuote])

  const copyToClipboard = async () => {
    if (!quote) return
    const text = `"${quote.q}" — ${quote.a}`
    await navigator.clipboard.writeText(text).catch(() => {})
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const toggleFavorite = () => {
    if (!quote) return
    const exists = favorites.some(f => f.q === quote.q)
    let next: ZenQuote[]
    if (exists) {
      next = favorites.filter(f => f.q !== quote.q)
    } else {
      next = [...favorites, quote]
    }
    setFavorites(next)
    localStorage.setItem(STORAGE_KEY, JSON.stringify(next))
  }

  const removeFavorite = (q: string) => {
    const next = favorites.filter(f => f.q !== q)
    setFavorites(next)
    localStorage.setItem(STORAGE_KEY, JSON.stringify(next))
  }

  const isFavorite = quote ? favorites.some(f => f.q === quote.q) : false
  const currentCat = categories.find(c => c.key === activeCategory) || categories[0]

  return (
    <div style={{
      height: '100%',
      background: `linear-gradient(135deg, #0f0c29 0%, #302b63 50%, #24243e 100%)`,
      color: '#e0e0f0',
      overflow: 'auto',
      padding: 20,
      display: 'flex',
      flexDirection: 'column',
      fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
    }}>
      <style>{`
        .qq-card { transition: all 0.5s cubic-bezier(0.4, 0, 0.2, 1); }
        .qq-fade-in { animation: qqFadeIn 0.6s ease-out; }
        @keyframes qqFadeIn {
          from { opacity: 0; transform: translateY(20px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .qq-btn-glow { transition: all 0.3s ease; }
        .qq-btn-glow:hover { box-shadow: 0 0 20px rgba(255,255,255,0.3); }
        .qq-cat { transition: all 0.3s ease; }
        .qq-cat:hover { transform: translateY(-2px); }
        @keyframes qqSpin { to { transform: rotate(360deg); } }
        .qq-spin { animation: qqSpin 1s linear infinite; }
        @keyframes qqHeartBeat {
          0%, 100% { transform: scale(1); }
          50% { transform: scale(1.2); }
        }
        .qq-heartbeat { animation: qqHeartBeat 0.4s ease; }
      `}</style>

      <div style={{ maxWidth: 800, margin: '0 auto', width: '100%' }}>
        {/* 顶部标题栏 */}
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: 20,
          flexWrap: 'wrap',
          gap: 12,
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <div style={{
              width: 44, height: 44, borderRadius: 14,
              background: currentCat.gradient,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              boxShadow: '0 4px 20px rgba(102,126,234,0.4)',
            }}>
              <Quote size={22} color="white" />
            </div>
            <div>
              <div style={{ fontSize: 22, fontWeight: 700, letterSpacing: '-0.5px' }}>每日名言</div>
              <div style={{ fontSize: 12, color: '#8888aa' }}>ZenQuotes · 智慧点亮人生</div>
            </div>
          </div>
          <button
            onClick={() => setShowFavorites(!showFavorites)}
            className="qq-btn-glow"
            style={{
              padding: '8px 16px',
              borderRadius: 10,
              border: '1px solid rgba(255,255,255,0.12)',
              background: showFavorites ? 'rgba(102,126,234,0.25)' : 'rgba(255,255,255,0.06)',
              color: showFavorites ? '#c5bfff' : '#aaaacc',
              cursor: 'pointer',
              fontSize: 13,
              display: 'flex',
              alignItems: 'center',
              gap: 6,
              fontFamily: 'inherit',
              backdropFilter: 'blur(10px)',
            }}
          >
            <Star size={16} fill={showFavorites ? '#c5bfff' : 'none'} />
            收藏 {favorites.length > 0 ? `(${favorites.length})` : ''}
          </button>
        </div>

        {/* 分类选择 */}
        <div style={{
          display: 'flex',
          gap: 8,
          marginBottom: 20,
          overflowX: 'auto',
          paddingBottom: 4,
        }}>
          {categories.map(cat => (
            <button
              key={cat.key}
              onClick={() => setActiveCategory(cat.key)}
              className="qq-cat qq-btn-glow"
              style={{
                padding: '8px 18px',
                borderRadius: 12,
                border: activeCategory === cat.key ? '1px solid transparent' : '1px solid rgba(255,255,255,0.1)',
                background: activeCategory === cat.key ? cat.gradient : 'rgba(255,255,255,0.05)',
                color: activeCategory === cat.key ? 'white' : '#aaaacc',
                cursor: 'pointer',
                fontSize: 13,
                fontWeight: activeCategory === cat.key ? 600 : 400,
                whiteSpace: 'nowrap',
                fontFamily: 'inherit',
                boxShadow: activeCategory === cat.key ? '0 4px 20px rgba(0,0,0,0.3)' : 'none',
              }}
            >
              {cat.label}
            </button>
          ))}
        </div>

        {/* 名言卡片 */}
        {!showFavorites ? (
          <div
            className="qq-card"
            style={{
              background: 'rgba(255,255,255,0.05)',
              backdropFilter: 'blur(20px)',
              WebkitBackdropFilter: 'blur(20px)',
              border: '1px solid rgba(255,255,255,0.1)',
              borderRadius: 24,
              padding: '40px 36px',
              boxShadow: '0 8px 32px rgba(0,0,0,0.3)',
              minHeight: 320,
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'center',
              position: 'relative',
              overflow: 'hidden',
            }}
          >
            <div style={{
              position: 'absolute', top: 0, left: 0, right: 0, height: 4,
              background: currentCat.gradient,
            }} />

            {loading ? (
              <div style={{
                textAlign: 'center',
                color: '#8888aa',
                padding: '40px 0',
              }}>
                <RefreshCw size={40} className="qq-spin" style={{ margin: '0 auto', display: 'block' }} />
                <div style={{ marginTop: 16, fontSize: 14 }}>{loadingText}</div>
              </div>
            ) : quote ? (
              <div className={isTransitioning ? 'qq-fade-in' : ''} key={quote.q}>
                <Quote size={32} style={{ color: currentCat.gradient.includes('#667eea') ? '#a29bfe' : '#f5576c', opacity: 0.6, marginBottom: 16 }} />
                <blockquote style={{
                  margin: 0,
                  fontSize: 20,
                  lineHeight: 1.8,
                  color: '#f0f0ff',
                  fontStyle: 'italic',
                  fontWeight: 300,
                  letterSpacing: '0.3px',
                }}>
                  &ldquo;{quote.q}&rdquo;
                </blockquote>
                <div style={{
                  marginTop: 24,
                  display: 'flex',
                  alignItems: 'center',
                  gap: 12,
                }}>
                  <div style={{ flex: 1, height: 1, background: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.2), transparent)' }} />
                </div>
                <div style={{
                  marginTop: 16,
                  textAlign: 'right',
                  color: '#b0b0cc',
                  fontSize: 15,
                  fontWeight: 500,
                }}>
                  — {quote.a}
                </div>
                <div style={{
                  marginTop: 8,
                  textAlign: 'right',
                  fontSize: 12,
                  color: '#6666aa',
                }}>
                  {categoryNames[quote.c || activeCategory]}
                </div>
              </div>
            ) : null}
          </div>
        ) : (
          <div style={{
            background: 'rgba(255,255,255,0.05)',
            backdropFilter: 'blur(20px)',
            border: '1px solid rgba(255,255,255,0.1)',
            borderRadius: 24,
            padding: 24,
            minHeight: 320,
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 20 }}>
              <Star size={20} style={{ color: '#facc15' }} />
              <span style={{ fontSize: 16, fontWeight: 600 }}>我的收藏</span>
              <span style={{ color: '#6666aa', fontSize: 13 }}>({favorites.length})</span>
            </div>
            {favorites.length === 0 ? (
              <div style={{ textAlign: 'center', padding: 40, color: '#6666aa' }}>
                <Heart size={48} style={{ opacity: 0.3, margin: '0 auto 16px', display: 'block' }} />
                <div>还没有收藏任何名言</div>
                <div style={{ fontSize: 12, marginTop: 8 }}>点击名言下方的收藏按钮即可添加</div>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                {favorites.map((f, i) => (
                  <div key={i} style={{
                    padding: 16,
                    background: 'rgba(255,255,255,0.04)',
                    borderRadius: 14,
                    border: '1px solid rgba(255,255,255,0.08)',
                    position: 'relative',
                  }}>
                    <p style={{ margin: 0, fontSize: 14, color: '#e0e0f0', lineHeight: 1.7 }}>&ldquo;{f.q}&rdquo;</p>
                    <div style={{ marginTop: 10, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span style={{ fontSize: 12, color: '#8888aa' }}>— {f.a}</span>
                      <button
                        onClick={() => removeFavorite(f.q)}
                        style={{
                          padding: '4px 8px',
                          background: 'rgba(255,100,100,0.1)',
                          border: 'none',
                          borderRadius: 6,
                          color: '#f87171',
                          cursor: 'pointer',
                          fontSize: 12,
                          display: 'flex',
                          alignItems: 'center',
                          gap: 4,
                          fontFamily: 'inherit',
                        }}
                      >
                        <Trash2 size={12} />
                        移除
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* 操作按钮 */}
        {!showFavorites && quote && (
          <div style={{
            display: 'flex',
            gap: 12,
            marginTop: 20,
            flexWrap: 'wrap',
          }}>
            <button
              onClick={() => fetchQuote(activeCategory)}
              disabled={loading}
              className="qq-btn-glow"
              style={{
                flex: 1,
                minWidth: 150,
                padding: '14px 24px',
                borderRadius: 14,
                border: 'none',
                background: currentCat.gradient,
                color: 'white',
                cursor: loading ? 'not-allowed' : 'pointer',
                fontSize: 15,
                fontWeight: 600,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 8,
                boxShadow: '0 4px 20px rgba(0,0,0,0.3)',
                fontFamily: 'inherit',
                opacity: loading ? 0.6 : 1,
              }}
            >
              <RefreshCw size={18} style={{ animation: loading ? 'qqSpin 1s linear infinite' : 'none' }} />
              换一条
            </button>
            <button
              onClick={copyToClipboard}
              className="qq-btn-glow"
              style={{
                padding: '14px 24px',
                borderRadius: 14,
                border: '1px solid rgba(255,255,255,0.15)',
                background: 'rgba(255,255,255,0.06)',
                color: '#d0d0e0',
                cursor: 'pointer',
                fontSize: 14,
                fontWeight: 500,
                display: 'flex',
                alignItems: 'center',
                gap: 8,
                fontFamily: 'inherit',
                backdropFilter: 'blur(10px)',
              }}
            >
              {copied ? <Check size={18} style={{ color: '#4ade80' }} /> : <Copy size={18} />}
              {copied ? '已复制' : '复制'}
            </button>
            <button
              onClick={toggleFavorite}
              className={`qq-btn-glow ${isFavorite ? 'qq-heartbeat' : ''}`}
              style={{
                padding: '14px 24px',
                borderRadius: 14,
                border: `1px solid ${isFavorite ? 'rgba(250,204,21,0.4)' : 'rgba(255,255,255,0.15)'}`,
                background: isFavorite ? 'rgba(250,204,21,0.1)' : 'rgba(255,255,255,0.06)',
                color: isFavorite ? '#facc15' : '#d0d0e0',
                cursor: 'pointer',
                fontSize: 14,
                fontWeight: 500,
                display: 'flex',
                alignItems: 'center',
                gap: 8,
                fontFamily: 'inherit',
                backdropFilter: 'blur(10px)',
              }}
            >
              <Heart size={18} fill={isFavorite ? '#facc15' : 'none'} />
              {isFavorite ? '已收藏' : '收藏'}
            </button>
          </div>
        )}

        {/* 底部装饰 */}
        <div style={{
          textAlign: 'center',
          marginTop: 24,
          fontSize: 11,
          color: '#5555aa',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: 6,
        }}>
          <Sparkles size={12} />
          数据来源：ZenQuotes API · 本地缓存
        </div>
      </div>
    </div>
  )
}