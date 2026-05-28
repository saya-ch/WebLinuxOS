import { useState, useEffect, useCallback } from 'react'
import {
  RefreshCw,
  Copy,
  Heart,
  Star,
  Image,
  Quote,
  Coffee,
  Sparkles,
  ExternalLink
} from 'lucide-react'

interface Quote {
  content: string
  author: string
}

interface ImageData {
  url: string
  photographer: string
  alt: string
}

interface InspoContent {
  quote: Quote | null
  image: ImageData | null
  fact: string | null
  color: string
}

const colors = [
  'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
  'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)',
  'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)',
  'linear-gradient(135deg, #43e97b 0%, #38f9d7 100%)',
  'linear-gradient(135deg, #fa709a 0%, #fee140 100%)',
  'linear-gradient(135deg, #a18cd1 0%, #fbc2eb 100%)',
  'linear-gradient(135deg, #ffecd2 0%, #fcb69f 100%)',
  'linear-gradient(135deg, #ff9a9e 0%, #fecfef 100%)',
]

const funFacts = [
  '蜜蜂会通过跳舞来告诉同伴花蜜的位置',
  '章鱼有三个心脏',
  '火烈鸟天生是灰色的，吃虾才会变成粉红色',
  '一袋彩虹糖有超过 100 种口味',
  '蜗牛可以睡三年',
  '你每天眨眼大约 15,000 次',
  '世界上最古老的树有超过 5,000 年',
  '人类的 DNA 有 50% 与香蕉相同',
  '一只猫有 230 块骨头',
  '企鹅会向喜欢的企鹅送石头',
  '蜂蜜永远不会变质',
  '鲨鱼比树更早出现在地球上',
  '长颈鹿的舌头是蓝黑色的',
  '地球上的蚂蚁总重量和人类差不多',
  '一只狗狗的鼻子有 3 亿个嗅觉感受器',
]

const loadingQuotes = [
  '寻找灵感中...',
  '加载智慧...',
  '发现精彩...',
  '收集美好...',
  '准备惊喜...',
]

export default function DailyInspo() {
  const [content, setContent] = useState<InspoContent>({
    quote: null,
    image: null,
    fact: null,
    color: colors[0],
  })
  const [loading, setLoading] = useState(false)
  const [loadingText, setLoadingText] = useState('')
  const [favorites, setFavorites] = useState<Quote[]>(() => {
    try {
      const saved = localStorage.getItem('weblinux-inspo-favorites')
      return saved ? JSON.parse(saved) : []
    } catch {
      return []
    }
  })
  const [activeTab, setActiveTab] = useState<'all' | 'quotes' | 'images' | 'facts'>('all')

  const fetchRandomQuote = useCallback(async (): Promise<Quote> => {
    try {
      const response = await fetch('https://api.quotable.io/random')
      if (response.ok) {
        const data = await response.json()
        return { content: data.content, author: data.author }
      }
    } catch {
      // Handle fetch error silently
    }
    const fallbackQuotes = [
      { content: '生活不是等待风暴过去，而是学会在雨中跳舞。', author: '维维安·格林' },
      { content: '成功不是最终的，失败也不是致命的，重要的是继续前进的勇气。', author: '温斯顿·丘吉尔' },
      { content: '你的时间有限，不要浪费在重复别人的生活上。', author: '史蒂夫·乔布斯' },
      { content: '唯一不变的就是变化本身。', author: '赫拉克利特' },
      { content: '梦想不会逃跑，会逃跑的永远是自己。', author: '稻盛和夫' },
    ]
    return fallbackQuotes[Math.floor(Math.random() * fallbackQuotes.length)]
  }, [])

  const fetchRandomImage = useCallback(async (): Promise<ImageData> => {
    return {
      url: `https://picsum.photos/800/600?random=${Date.now()}`,
      photographer: 'Lorem Picsum',
      alt: 'Beautiful random image',
    }
  }, [])

  const getRandomFact = useCallback((): string => {
    return funFacts[Math.floor(Math.random() * funFacts.length)]
  }, [])

  const getInspired = useCallback(async () => {
    setLoading(true)
    setLoadingText(loadingQuotes[Math.floor(Math.random() * loadingQuotes.length)])
    
    try {
      const [quote, image] = await Promise.all([
        fetchRandomQuote(),
        fetchRandomImage(),
      ])
      
      setContent({
        quote,
        image,
        fact: getRandomFact(),
        color: colors[Math.floor(Math.random() * colors.length)],
      })
    } catch {
      setContent({
        quote: { content: '保持好奇心，每一天都是新的开始！', author: 'WebLinuxOS' },
        image: { url: `https://picsum.photos/800/600?random=${Date.now()}`, photographer: 'Lorem Picsum', alt: 'Inspiration' },
        fact: getRandomFact(),
        color: colors[Math.floor(Math.random() * colors.length)],
      })
    } finally {
      setLoading(false)
    }
  }, [fetchRandomQuote, fetchRandomImage, getRandomFact])

  useEffect(() => {
    getInspired()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const copyToClipboard = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text)
    } catch {
      // Handle clipboard error silently
    }
  }

  const toggleFavorite = (quote: Quote) => {
    let newFavorites
    const isFav = favorites.some(f => f.content === quote.content)
    if (isFav) {
      newFavorites = favorites.filter(f => f.content !== quote.content)
    } else {
      newFavorites = [...favorites, quote]
    }
    setFavorites(newFavorites)
    localStorage.setItem('weblinux-inspo-favorites', JSON.stringify(newFavorites))
  }

  const isFavorite = (quote: Quote) => {
    return favorites.some(f => f.content === quote.content)
  }

  return (
    <div className="app-container" style={{ padding: 0, height: '100%', display: 'flex', flexDirection: 'column' }}>
      <div style={{
        background: content.color,
        padding: 24,
        color: 'white',
        textAlign: 'center',
        boxShadow: '0 4px 20px rgba(0,0,0,0.1)',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 12, marginBottom: 12 }}>
          <Sparkles size={28} />
          <h1 style={{ margin: 0, fontSize: 24, fontWeight: 700 }}>每日灵感</h1>
          <Sparkles size={28} />
        </div>
        <p style={{ margin: 0, opacity: 0.9, fontSize: 14 }}>为你的每一天带来美好</p>
      </div>

      <div style={{
        display: 'flex',
        borderBottom: '1px solid var(--window-border)',
        background: 'var(--window-header)',
      }}>
        {[
          { id: 'all', label: '全部', icon: Sparkles },
          { id: 'quotes', label: '名言', icon: Quote },
          { id: 'images', label: '图片', icon: Image },
          { id: 'facts', label: '趣事', icon: Coffee },
        ].map((tab) => {
          const Icon = tab.icon
          const isActive = activeTab === tab.id
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as 'all' | 'quotes' | 'images' | 'facts')}
              style={{
                flex: 1,
                padding: '12px 16px',
                border: 'none',
                background: isActive ? 'var(--accent)' : 'transparent',
                color: isActive ? 'white' : 'var(--text-primary)',
                cursor: 'pointer',
                fontSize: 13,
                fontWeight: isActive ? 600 : 500,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 6,
                transition: 'all 0.2s',
              }}
            >
              <Icon size={16} />
              {tab.label}
            </button>
          )
        })}
      </div>

      <div style={{
        flex: 1,
        overflow: 'auto',
        padding: 20,
        display: 'flex',
        flexDirection: 'column',
        gap: 20,
      }}>
        {loading ? (
          <div style={{
            flex: 1,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 20,
            color: 'var(--text-secondary)',
          }}>
            <RefreshCw size={48} style={{ animation: 'spin 1s linear infinite' }} />
            <div style={{ fontSize: 16 }}>{loadingText}</div>
          </div>
        ) : (
          <>
            {(activeTab === 'all' || activeTab === 'quotes') && content.quote && (
              <div style={{
                background: 'var(--window-bg)',
                borderRadius: 16,
                padding: 24,
                boxShadow: '0 4px 20px rgba(0,0,0,0.08)',
                border: '1px solid var(--window-border)',
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 16 }}>
                  <Quote size={20} style={{ color: 'var(--accent)' }} />
                  <h3 style={{ margin: 0, fontSize: 16, fontWeight: 600 }}>今日名言</h3>
                </div>
                <blockquote style={{
                  margin: 0,
                  fontSize: 18,
                  lineHeight: 1.7,
                  fontStyle: 'italic',
                  color: 'var(--text-primary)',
                  borderLeft: '4px solid var(--accent)',
                  paddingLeft: 16,
                }}>
                  "{content.quote.content}"
                </blockquote>
                <div style={{
                  marginTop: 12,
                  textAlign: 'right',
                  color: 'var(--text-secondary)',
                  fontSize: 14,
                  fontWeight: 500,
                }}>
                  — {content.quote.author}
                </div>
                <div style={{ marginTop: 16, display: 'flex', gap: 8 }}>
                  <button
                    onClick={() => content.quote && copyToClipboard(`"${content.quote.content}" — ${content.quote.author}`)}
                    style={{
                      padding: '8px 16px',
                      borderRadius: 8,
                      border: '1px solid var(--window-border)',
                      background: 'var(--window-header)',
                      color: 'var(--text-primary)',
                      cursor: 'pointer',
                      fontSize: 13,
                      display: 'flex',
                      alignItems: 'center',
                      gap: 6,
                      transition: 'all 0.2s',
                    }}
                    onMouseEnter={(e) => e.currentTarget.style.background = 'var(--hover-bg)'}
                    onMouseLeave={(e) => e.currentTarget.style.background = 'var(--window-header)'}
                  >
                    <Copy size={16} />
                    复制
                  </button>
                  <button
                    onClick={() => content.quote && toggleFavorite(content.quote)}
                    style={{
                      padding: '8px 16px',
                      borderRadius: 8,
                      border: '1px solid var(--window-border)',
                      background: content.quote && isFavorite(content.quote) ? 'var(--accent)' : 'var(--window-header)',
                      color: content.quote && isFavorite(content.quote) ? 'white' : 'var(--text-primary)',
                      cursor: 'pointer',
                      fontSize: 13,
                      display: 'flex',
                      alignItems: 'center',
                      gap: 6,
                      transition: 'all 0.2s',
                    }}
                  >
                    {content.quote && isFavorite(content.quote) ? <Heart size={16} fill="currentColor" /> : <Heart size={16} />}
                    {content.quote && isFavorite(content.quote) ? '已收藏' : '收藏'}
                  </button>
                </div>
              </div>
            )}

            {(activeTab === 'all' || activeTab === 'images') && content.image && (
              <div style={{
                background: 'var(--window-bg)',
                borderRadius: 16,
                overflow: 'hidden',
                boxShadow: '0 4px 20px rgba(0,0,0,0.08)',
                border: '1px solid var(--window-border)',
              }}>
                <div style={{ padding: '16px 20px', borderBottom: '1px solid var(--window-border)', display: 'flex', alignItems: 'center', gap: 10 }}>
                  <Image size={20} style={{ color: 'var(--accent)' }} />
                  <h3 style={{ margin: 0, fontSize: 16, fontWeight: 600 }}>灵感图片</h3>
                </div>
                <img
                  src={content.image.url}
                  alt={content.image.alt}
                  style={{ width: '100%', height: 300, objectFit: 'cover', display: 'block' }}
                />
                <div style={{ padding: '12px 20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'var(--window-header)' }}>
                  <span style={{ fontSize: 13, color: 'var(--text-secondary)' }}>
                    摄影: {content.image.photographer}
                  </span>
                  <a
                    href={content.image.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    style={{
                      fontSize: 13,
                      color: 'var(--accent)',
                      textDecoration: 'none',
                      display: 'flex',
                      alignItems: 'center',
                      gap: 4,
                    }}
                  >
                    在新标签页打开 <ExternalLink size={14} />
                  </a>
                </div>
              </div>
            )}

            {(activeTab === 'all' || activeTab === 'facts') && content.fact && (
              <div style={{
                background: 'var(--window-bg)',
                borderRadius: 16,
                padding: 24,
                boxShadow: '0 4px 20px rgba(0,0,0,0.08)',
                border: '1px solid var(--window-border)',
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 16 }}>
                  <Coffee size={20} style={{ color: 'var(--accent)' }} />
                  <h3 style={{ margin: 0, fontSize: 16, fontWeight: 600 }}>趣味小知识</h3>
                </div>
                <p style={{ margin: 0, fontSize: 16, lineHeight: 1.7, color: 'var(--text-primary)' }}>
                  💡 {content.fact}
                </p>
              </div>
            )}

            {activeTab === 'quotes' && favorites.length > 0 && (
              <div style={{
                background: 'var(--window-bg)',
                borderRadius: 16,
                padding: 24,
                boxShadow: '0 4px 20px rgba(0,0,0,0.08)',
                border: '1px solid var(--window-border)',
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 16 }}>
                  <Star size={20} style={{ color: 'var(--accent)' }} />
                  <h3 style={{ margin: 0, fontSize: 16, fontWeight: 600 }}>我的收藏</h3>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                  {favorites.map((fav, i) => (
                    <div key={i} style={{
                      padding: 16,
                      background: 'var(--window-header)',
                      borderRadius: 12,
                      border: '1px solid var(--window-border)',
                    }}>
                      <p style={{ margin: 0, fontSize: 14, color: 'var(--text-primary)', marginBottom: 8 }}>"{fav.content}"</p>
                      <p style={{ margin: 0, fontSize: 12, color: 'var(--text-secondary)', textAlign: 'right' }}>— {fav.author}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div style={{ textAlign: 'center', padding: 20 }}>
              <button
                onClick={getInspired}
                disabled={loading}
                style={{
                  padding: '14px 32px',
                  borderRadius: 12,
                  border: 'none',
                  background: content.color,
                  color: 'white',
                  cursor: loading ? 'not-allowed' : 'pointer',
                  fontSize: 15,
                  fontWeight: 600,
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 10,
                  boxShadow: '0 4px 15px rgba(0,0,0,0.2)',
                  opacity: loading ? 0.7 : 1,
                  transition: 'all 0.2s',
                }}
              >
                <RefreshCw size={20} style={{ animation: loading ? 'spin 1s linear infinite' : 'none' }} />
                换一批灵感
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  )
}
