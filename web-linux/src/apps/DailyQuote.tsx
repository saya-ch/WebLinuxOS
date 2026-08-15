import { useState, useEffect, useCallback } from 'react'
import {
  RefreshCw,
  Copy,
  Heart,
  Star,
  Quote,
  Sparkles,
  Check,
  Trash2,
  Globe,
  Loader2,
} from 'lucide-react'
import { useStore } from '../store'

interface QuoteData {
  content: string
  author: string
  category?: string
  translated?: string
}

interface Category {
  key: string
  label: string
  tag: string
  gradient: string
}

const categories: Category[] = [
  { key: 'inspiration', label: '励志', tag: 'inspiration', gradient: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)' },
  { key: 'philosophy', label: '哲学', tag: 'philosophy', gradient: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)' },
  { key: 'technology', label: '科技', tag: 'technology', gradient: 'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)' },
  { key: 'life', label: '生活', tag: 'life', gradient: 'linear-gradient(135deg, #43e97b 0%, #38f9d7 100%)' },
  { key: 'love', label: '爱情', tag: 'love', gradient: 'linear-gradient(135deg, #fa709a 0%, #fee140 100%)' },
  { key: 'science', label: '科学', tag: 'science', gradient: 'linear-gradient(135deg, #a18cd1 0%, #fbc2eb 100%)' },
]

const STORAGE_KEY = 'weblinux-dailyquote-favorites'

const fallbackQuotes: Record<string, QuoteData[]> = {
  inspiration: [
    { content: '成功不是终点，失败也非末日，继续前进的勇气才最可贵。', author: '丘吉尔', category: 'inspiration' },
    { content: '你的时间有限，不要浪费在重复别人的生活上。', author: '史蒂夫·乔布斯', category: 'inspiration' },
    { content: '梦想不会逃跑，会逃跑的永远是自己。', author: '稻盛和夫', category: 'inspiration' },
    { content: '千里之行，始于足下。', author: '老子', category: 'inspiration' },
    { content: '不积跬步，无以至千里；不积小流，无以成江海。', author: '荀子', category: 'inspiration' },
  ],
  philosophy: [
    { content: '未经审视的生活不值得过。', author: '苏格拉底', category: 'philosophy' },
    { content: '人是万物的尺度。', author: '普罗泰戈拉', category: 'philosophy' },
    { content: '存在即合理。', author: '黑格尔', category: 'philosophy' },
    { content: '人生如逆旅，我亦是行人。', author: '苏轼', category: 'philosophy' },
    { content: '道可道，非常道；名可名，非常名。', author: '老子', category: 'philosophy' },
  ],
  technology: [
    { content: '唯一不变的就是变化本身。', author: '赫拉克利特', category: 'technology' },
    { content: '在代码里，像对待硬件一样对待软件。', author: 'Edsger Dijkstra', category: 'technology' },
    { content: '简单比复杂更难。', author: '史蒂夫·乔布斯', category: 'technology' },
    { content: '任何傻瓜都能写出计算机能懂的代码，好程序员写人能懂的代码。', author: 'Martin Fowler', category: 'technology' },
    { content: '过早的优化是万恶之源。', author: 'Donald Knuth', category: 'technology' },
  ],
  life: [
    { content: '生活就像骑自行车，要保持平衡，就得往前走。', author: '爱因斯坦', category: 'life' },
    { content: '世界上只有一种真正的英雄主义，那就是在认清生活真相之后依然热爱生活。', author: '罗曼·罗兰', category: 'life' },
    { content: '人生不是用来等待风暴过去，而是学会在雨中跳舞。', author: '维维安·格林', category: 'life' },
    { content: '浮生若梦，为欢几何？', author: '李白', category: 'life' },
  ],
  love: [
    { content: '爱不是彼此凝视，而是一起注视同一个方向。', author: '圣埃克苏佩里', category: 'love' },
    { content: '世界上最遥远的距离，是我站在你面前，你却不知道我爱你。', author: '泰戈尔', category: 'love' },
    { content: '愿我如星君如月，夜夜流光相皎洁。', author: '范成大', category: 'love' },
    { content: '两情若是久长时，又岂在朝朝暮暮。', author: '秦观', category: 'love' },
  ],
  science: [
    { content: '科学没有国界，科学家却有祖国。', author: '巴斯德', category: 'science' },
    { content: '想象力比知识更重要。', author: '爱因斯坦', category: 'science' },
    { content: '在科学上没有平坦的大道，只有不畏劳苦沿着陡峭山路攀登的人，才有希望达到光辉的顶点。', author: '马克思', category: 'science' },
    { content: '如果说我看得比别人更远，那是因为我站在巨人的肩膀上。', author: '牛顿', category: 'science' },
  ],
}

const loadingMessages = [
  '获取名言中...',
  '搜索智慧...',
  '加载经典语录...',
  '准备灵感...',
]

async function translateToChinese(text: string): Promise<string> {
  try {
    const res = await fetch(
      `https://api.mymemory.translated.net/get?q=${encodeURIComponent(text)}&langpair=en|zh-CN`
    )
    if (res.ok) {
      const data = await res.json()
      if (data.responseData?.translatedText) {
        return data.responseData.translatedText
      }
    }
  } catch {}
  return ''
}

export default function DailyQuote() {
  const { resolvedTheme } = useStore()
  const isDark = resolvedTheme === 'dark'

  const [quote, setQuote] = useState<QuoteData | null>(null)
  const [loading, setLoading] = useState(false)
  const [loadingText, setLoadingText] = useState('')
  const [activeCategory, setActiveCategory] = useState<string>('inspiration')
  const [favorites, setFavorites] = useState<QuoteData[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY)
      return saved ? JSON.parse(saved) : []
    } catch {
      return []
    }
  })
  const [showFavorites, setShowFavorites] = useState(false)
  const [copied, setCopied] = useState(false)
  const [translating, setTranslating] = useState(false)
  const [showTranslation, setShowTranslation] = useState(true)
  const [usedFallback, setUsedFallback] = useState(false)
  const [isTransitioning, setIsTransitioning] = useState(false)

  const fetchQuote = useCallback(async (category: string) => {
    setLoading(true)
    setLoadingText(loadingMessages[Math.floor(Math.random() * loadingMessages.length)])
    setIsTransitioning(true)
    setUsedFallback(false)

    try {
      const cat = categories.find((c) => c.key === category)
      const tag = cat ? cat.tag : ''
      const url = tag
        ? `https://api.quotable.io/random?tags=${encodeURIComponent(tag)}`
        : 'https://api.quotable.io/random'

      const res = await fetch(url)
      if (res.ok) {
        const data = await res.json()
        if (data.content && data.author) {
          const quoteData: QuoteData = {
            content: data.content,
            author: data.author,
            category,
          }
          setQuote(quoteData)
          setLoading(false)
          setTimeout(() => setIsTransitioning(false), 50)

          if (showTranslation) {
            setTranslating(true)
            try {
              const translated = await translateToChinese(data.content)
              if (translated) {
                setQuote((prev) => (prev ? { ...prev, translated } : prev))
              }
            } catch {}
            setTranslating(false)
          }
          return
        }
      }

      throw new Error('API不可用')
    } catch {
      setUsedFallback(true)
      const fb = fallbackQuotes[category] || fallbackQuotes.inspiration
      const random = fb[Math.floor(Math.random() * fb.length)]
      setQuote({ ...random, category })
    } finally {
      setLoading(false)
      setTimeout(() => setIsTransitioning(false), 300)
    }
  }, [showTranslation])

  useEffect(() => {
    fetchQuote(activeCategory)
  }, [activeCategory, fetchQuote])

  const copyToClipboard = async () => {
    if (!quote) return
    const text = `"${quote.content}" — ${quote.author}`
    await navigator.clipboard.writeText(text).catch(() => {})
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const toggleFavorite = () => {
    if (!quote) return
    const exists = favorites.some((f) => f.content === quote.content)
    let next: QuoteData[]
    if (exists) {
      next = favorites.filter((f) => f.content !== quote.content)
    } else {
      next = [...favorites, quote]
    }
    setFavorites(next)
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(next))
    } catch {}
  }

  const removeFavorite = (content: string) => {
    const next = favorites.filter((f) => f.content !== content)
    setFavorites(next)
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(next))
    } catch {}
  }

  const isFavorite = quote ? favorites.some((f) => f.content === quote.content) : false
  const currentCat = categories.find((c) => c.key === activeCategory) || categories[0]

  const bgGradient = isDark
    ? 'linear-gradient(135deg, #0f0c29 0%, #302b63 50%, #24243e 100%)'
    : 'linear-gradient(135deg, #f5f7fa 0%, #e4e8ec 50%, #d1d5db 100%)'

  const cardBg = isDark ? 'rgba(255,255,255,0.05)' : 'rgba(255,255,255,0.85)'
  const cardBorder = isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.08)'
  const textPrimary = isDark ? '#f0f0ff' : '#1f2937'
  const textSecondary = isDark ? '#b0b0cc' : '#6b7280'
  const textMuted = isDark ? '#8888aa' : '#9ca3af'
  const accentText = isDark ? '#c5bfff' : '#4f46e5'

  return (
    <div
      style={{
        height: '100%',
        background: bgGradient,
        color: textPrimary,
        overflow: 'auto',
        padding: 20,
        display: 'flex',
        flexDirection: 'column',
        fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
        transition: 'background 0.3s ease',
      }}
    >
      <style>{`
        .dq-card { transition: all 0.5s cubic-bezier(0.4, 0, 0.2, 1); }
        .dq-fade-in { animation: dqFadeIn 0.6s ease-out; }
        @keyframes dqFadeIn {
          from { opacity: 0; transform: translateY(20px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .dq-btn-glow { transition: all 0.3s ease; }
        .dq-btn-glow:hover { box-shadow: 0 0 20px rgba(124,108,234,0.3); }
        .dq-cat { transition: all 0.3s ease; }
        .dq-cat:hover { transform: translateY(-2px); }
        @keyframes dqSpin { to { transform: rotate(360deg); } }
        .dq-spin { animation: dqSpin 1s linear infinite; }
        @keyframes dqHeartBeat {
          0%, 100% { transform: scale(1); }
          50% { transform: scale(1.2); }
        }
        .dq-heartbeat { animation: dqHeartBeat 0.4s ease; }
        @keyframes dqPulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.6; }
        }
        .dq-pulse { animation: dqPulse 1.5s ease-in-out infinite; }
      `}</style>

      <div style={{ maxWidth: 800, margin: '0 auto', width: '100%' }}>
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: 20,
            flexWrap: 'wrap',
            gap: 12,
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <div
              style={{
                width: 44,
                height: 44,
                borderRadius: 14,
                background: currentCat.gradient,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                boxShadow: '0 4px 20px rgba(102,126,234,0.4)',
              }}
            >
              <Quote size={22} color="white" />
            </div>
            <div>
              <div style={{ fontSize: 22, fontWeight: 700, letterSpacing: '-0.5px' }}>每日一言</div>
              <div style={{ fontSize: 12, color: textMuted }}>
                {usedFallback ? '本地经典' : 'Quotable API'} · 智慧点亮人生
              </div>
            </div>
          </div>
          <button
            onClick={() => setShowFavorites(!showFavorites)}
            className="dq-btn-glow"
            style={{
              padding: '8px 16px',
              borderRadius: 10,
              border: `1px solid ${isDark ? 'rgba(255,255,255,0.12)' : 'rgba(0,0,0,0.1)'}`,
              background: showFavorites
                ? isDark
                  ? 'rgba(102,126,234,0.25)'
                  : 'rgba(102,126,234,0.1)'
                : isDark
                  ? 'rgba(255,255,255,0.06)'
                  : 'rgba(0,0,0,0.04)',
              color: showFavorites ? accentText : textSecondary,
              cursor: 'pointer',
              fontSize: 13,
              display: 'flex',
              alignItems: 'center',
              gap: 6,
              fontFamily: 'inherit',
              backdropFilter: 'blur(10px)',
            }}
          >
            <Star size={16} fill={showFavorites ? 'currentColor' : 'none'} />
            收藏 {favorites.length > 0 ? `(${favorites.length})` : ''}
          </button>
        </div>

        <div
          style={{
            display: 'flex',
            gap: 8,
            marginBottom: 20,
            overflowX: 'auto',
            paddingBottom: 4,
          }}
        >
          {categories.map((cat) => (
            <button
              key={cat.key}
              onClick={() => setActiveCategory(cat.key)}
              className="dq-cat dq-btn-glow"
              style={{
                padding: '8px 18px',
                borderRadius: 12,
                border:
                  activeCategory === cat.key
                    ? '1px solid transparent'
                    : `1px solid ${isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.08)'}`,
                background: activeCategory === cat.key ? cat.gradient : isDark ? 'rgba(255,255,255,0.05)' : 'rgba(255,255,255,0.6)',
                color: activeCategory === cat.key ? 'white' : textSecondary,
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

        {!showFavorites ? (
          <div
            className="dq-card"
            style={{
              background: cardBg,
              backdropFilter: 'blur(20px)',
              WebkitBackdropFilter: 'blur(20px)',
              border: `1px solid ${cardBorder}`,
              borderRadius: 24,
              padding: '40px 36px',
              boxShadow: isDark ? '0 8px 32px rgba(0,0,0,0.3)' : '0 8px 32px rgba(0,0,0,0.08)',
              minHeight: 320,
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'center',
              position: 'relative',
              overflow: 'hidden',
            }}
          >
            <div
              style={{
                position: 'absolute',
                top: 0,
                left: 0,
                right: 0,
                height: 4,
                background: currentCat.gradient,
              }}
            />

            {loading ? (
              <div
                style={{
                  textAlign: 'center',
                  color: textMuted,
                  padding: '40px 0',
                }}
              >
                <Loader2
                  size={40}
                  className="dq-spin"
                  style={{ margin: '0 auto', display: 'block' }}
                />
                <div style={{ marginTop: 16, fontSize: 14 }}>{loadingText}</div>
              </div>
            ) : quote ? (
              <div className={isTransitioning ? 'dq-fade-in' : ''} key={quote.content}>
                <Quote
                  size={32}
                  style={{
                    color: currentCat.gradient.includes('#667eea') ? '#a29bfe' : '#f5576c',
                    opacity: 0.6,
                    marginBottom: 16,
                  }}
                />
                <blockquote
                  style={{
                    margin: 0,
                    fontSize: 20,
                    lineHeight: 1.8,
                    color: textPrimary,
                    fontStyle: 'italic',
                    fontWeight: 300,
                    letterSpacing: '0.3px',
                  }}
                >
                  &ldquo;{quote.content}&rdquo;
                </blockquote>

                {translating && (
                  <div
                    style={{
                      marginTop: 16,
                      padding: '12px 16px',
                      background: isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.04)',
                      borderRadius: 12,
                      fontSize: 15,
                      color: textSecondary,
                      display: 'flex',
                      alignItems: 'center',
                      gap: 8,
                    }}
                  >
                    <Globe size={16} className="dq-pulse" />
                    <span>翻译中...</span>
                  </div>
                )}

                {!translating && quote.translated && (
                  <div
                    style={{
                      marginTop: 16,
                      padding: '12px 16px',
                      background: isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.04)',
                      borderRadius: 12,
                      fontSize: 15,
                      color: textSecondary,
                      borderLeft: `3px solid ${isDark ? '#7c6cf0' : '#5b4cd8'}`,
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 6, fontSize: 12, color: textMuted }}>
                      <Globe size={12} />
                      中文翻译
                    </div>
                    {quote.translated}
                  </div>
                )}

                <div
                  style={{
                    marginTop: 24,
                    display: 'flex',
                    alignItems: 'center',
                    gap: 12,
                  }}
                >
                  <div
                    style={{
                      flex: 1,
                      height: 1,
                      background: isDark
                        ? 'linear-gradient(90deg, transparent, rgba(255,255,255,0.2), transparent)'
                        : 'linear-gradient(90deg, transparent, rgba(0,0,0,0.15), transparent)',
                    }}
                  />
                </div>
                <div
                  style={{
                    marginTop: 16,
                    textAlign: 'right',
                    color: textSecondary,
                    fontSize: 15,
                    fontWeight: 500,
                  }}
                >
                  — {quote.author}
                </div>
                <div
                  style={{
                    marginTop: 8,
                    textAlign: 'right',
                    fontSize: 12,
                    color: textMuted,
                  }}
                >
                  {categories.find((c) => c.key === (quote.category || activeCategory))?.label || activeCategory}
                </div>
              </div>
            ) : null}
          </div>
        ) : (
          <div
            style={{
              background: cardBg,
              backdropFilter: 'blur(20px)',
              border: `1px solid ${cardBorder}`,
              borderRadius: 24,
              padding: 24,
              minHeight: 320,
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 20 }}>
              <Star size={20} style={{ color: '#facc15' }} />
              <span style={{ fontSize: 16, fontWeight: 600 }}>我的收藏</span>
              <span style={{ color: textMuted, fontSize: 13 }}>({favorites.length})</span>
            </div>
            {favorites.length === 0 ? (
              <div style={{ textAlign: 'center', padding: 40, color: textMuted }}>
                <Heart
                  size={48}
                  style={{ opacity: 0.3, margin: '0 auto 16px', display: 'block' }}
                />
                <div>还没有收藏任何名言</div>
                <div style={{ fontSize: 12, marginTop: 8 }}>点击名言下方的收藏按钮即可添加</div>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                {favorites.map((f, i) => (
                  <div
                    key={`${f.content}-${i}`}
                    style={{
                      padding: 16,
                      background: isDark ? 'rgba(255,255,255,0.04)' : 'rgba(0,0,0,0.03)',
                      borderRadius: 14,
                      border: `1px solid ${isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.06)'}`,
                      position: 'relative',
                    }}
                  >
                    <p
                      style={{
                        margin: 0,
                        fontSize: 14,
                        color: textPrimary,
                        lineHeight: 1.7,
                      }}
                    >
                      &ldquo;{f.content}&rdquo;
                    </p>
                    {f.translated && (
                      <p
                        style={{
                          margin: '6px 0 0',
                          fontSize: 13,
                          color: textSecondary,
                          lineHeight: 1.6,
                        }}
                      >
                        {f.translated}
                      </p>
                    )}
                    <div
                      style={{
                        marginTop: 10,
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                      }}
                    >
                      <span style={{ fontSize: 12, color: textMuted }}>
                        — {f.author}
                        {f.category && (
                          <span
                            style={{
                              marginLeft: 8,
                              padding: '2px 8px',
                              borderRadius: 8,
                              background: isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.06)',
                            }}
                          >
                            {categories.find((c) => c.key === f.category)?.label || f.category}
                          </span>
                        )}
                      </span>
                      <button
                        onClick={() => removeFavorite(f.content)}
                        style={{
                          padding: '4px 8px',
                          background: isDark ? 'rgba(255,100,100,0.1)' : 'rgba(255,100,100,0.1)',
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

        {!showFavorites && quote && (
          <div
            style={{
              display: 'flex',
              gap: 12,
              marginTop: 20,
              flexWrap: 'wrap',
            }}
          >
            <button
              onClick={() => fetchQuote(activeCategory)}
              disabled={loading}
              className="dq-btn-glow"
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
              <RefreshCw
                size={18}
                style={{ animation: loading ? 'dqSpin 1s linear infinite' : 'none' }}
              />
              换一句
            </button>
            <button
              onClick={copyToClipboard}
              className="dq-btn-glow"
              style={{
                padding: '14px 24px',
                borderRadius: 14,
                border: `1px solid ${isDark ? 'rgba(255,255,255,0.15)' : 'rgba(0,0,0,0.12)'}`,
                background: isDark ? 'rgba(255,255,255,0.06)' : 'rgba(255,255,255,0.7)',
                color: textPrimary,
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
              {copied ? (
                <Check size={18} style={{ color: '#4ade80' }} />
              ) : (
                <Copy size={18} />
              )}
              {copied ? '已复制' : '复制'}
            </button>
            <button
              onClick={toggleFavorite}
              className={`dq-btn-glow ${isFavorite ? 'dq-heartbeat' : ''}`}
              style={{
                padding: '14px 24px',
                borderRadius: 14,
                border: `1px solid ${isFavorite ? 'rgba(250,204,21,0.4)' : isDark ? 'rgba(255,255,255,0.15)' : 'rgba(0,0,0,0.12)'}`,
                background: isFavorite
                  ? isDark
                    ? 'rgba(250,204,21,0.1)'
                    : 'rgba(250,204,21,0.15)'
                  : isDark
                    ? 'rgba(255,255,255,0.06)'
                    : 'rgba(255,255,255,0.7)',
                color: isFavorite ? '#d97706' : textPrimary,
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
              <Heart size={18} fill={isFavorite ? 'currentColor' : 'none'} />
              {isFavorite ? '已收藏' : '收藏'}
            </button>
            <button
              onClick={() => {
                setShowTranslation((prev) => {
                  const next = !prev
                  if (next && quote && !quote.translated) {
                    setTranslating(true)
                    translateToChinese(quote.content)
                      .then((translated) => {
                        if (translated) {
                          setQuote((prev) => (prev ? { ...prev, translated } : prev))
                        }
                      })
                      .finally(() => setTranslating(false))
                  }
                  return next
                })
              }}
              className="dq-btn-glow"
              style={{
                padding: '14px 24px',
                borderRadius: 14,
                border: `1px solid ${isDark ? 'rgba(255,255,255,0.15)' : 'rgba(0,0,0,0.12)'}`,
                background: isDark ? 'rgba(255,255,255,0.06)' : 'rgba(255,255,255,0.7)',
                color: textPrimary,
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
              <Globe size={18} />
              {showTranslation ? '隐藏翻译' : '中文翻译'}
            </button>
          </div>
        )}

        <div
          style={{
            textAlign: 'center',
            marginTop: 24,
            fontSize: 11,
            color: textMuted,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 6,
          }}
        >
          <Sparkles size={12} />
          数据来源：Quotable API · MyMemory 翻译 · 本地缓存
        </div>
      </div>
    </div>
  )
}