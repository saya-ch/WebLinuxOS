import { useState, useEffect, useCallback, memo } from 'react'

interface Article {
  title: string
  description: string
  url: string
  source: string
  publishedAt: string
  category: string
  imageUrl: string
}

const CATEGORIES = [
  { id: 'all', name: '全部', icon: '📰' },
  { id: 'tech', name: '科技', icon: '💻' },
  { id: 'business', name: '商业', icon: '💼' },
  { id: 'science', name: '科学', icon: '🔬' },
  { id: 'health', name: '健康', icon: '❤️' },
  { id: 'sports', name: '体育', icon: '⚽' },
  { id: 'entertainment', name: '娱乐', icon: '🎬' }
]

const generateMockArticle = (category: string, index: number): Article => {
  const titles = {
    tech: [
      'OpenAI 发布 GPT-5 预览版，AI 能力再次突破',
      '苹果发布 Vision Pro 2，售价降低 30%',
      '特斯拉全自动驾驶技术获重大更新',
      '量子计算机首次实现商用化突破',
      '5G-A 网络正式商用，速度提升 10 倍'
    ],
    business: [
      '全球股市创历史新高，投资者信心大增',
      '亚马逊收购新兴电商平台，市值突破 2 万亿',
      '新能源汽车销量同比增长 150%',
      '央行宣布降息，刺激经济增长',
      '区块链技术在金融领域广泛应用'
    ],
    science: [
      'NASA 成功发射火星探测器，寻找生命迹象',
      '科学家发现新型可再生能源材料',
      '基因编辑技术治愈罕见遗传病',
      '人工智能辅助药物研发取得突破',
      '深海探测发现未知生物物种'
    ],
    health: [
      '新型疫苗研发成功，有效率达 95%',
      '研究发现健康饮食可延长寿命 10 年',
      '冥想训练显著改善心理健康',
      '睡眠不足对大脑的影响被揭示',
      '定期运动可降低多种疾病风险'
    ],
    sports: [
      '世界杯预选赛激烈进行，多支强队晋级',
      'NBA 季后赛精彩对决，湖人挺进总决赛',
      '奥运会倒计时，各项准备工作就绪',
      '足球巨星转会传闻不断，转会费创新高',
      '电竞产业蓬勃发展，观众突破 5 亿'
    ],
    entertainment: [
      '年度大片票房破纪录，创历史新高',
      '热门剧集第二季回归，观众好评如潮',
      '音乐节门票开售即售罄，场面火爆',
      '知名导演新作首映，获业界高度评价',
      '流媒体平台推出原创内容，竞争激烈'
    ]
  }

  const categoryTitles = category === 'all' ? titles.tech : titles[category as keyof typeof titles] || titles.tech
  const sources = ['TechCrunch', 'BBC News', 'Reuters', 'Bloomberg', 'CNBC', 'The Verge', 'Wired']
  const images = [
    'https://images.unsplash.com/photo-1451187580459-43490279c0fa?w=400&h=250&fit=crop',
    'https://images.unsplash.com/photo-1488590528505-98d2b5aba04b?w=400&h=250&fit=crop',
    'https://images.unsplash.com/photo-1504711434969-e33886168f5c?w=400&h=250&fit=crop',
    'https://images.unsplash.com/photo-1495020689067-958852a7765e?w=400&h=250&fit=crop',
    'https://images.unsplash.com/photo-1498050108023-c5249f4df085?w=400&h=250&fit=crop'
  ]

  const title = categoryTitles[index % categoryTitles.length]
  return {
    title,
    description: '这是一篇关于 ' + title + ' 的详细报道，内容丰富，值得深入阅读。本文将从多个角度分析这一事件的背景、现状和未来发展趋势...',
    url: 'https://example.com/article/' + index,
    source: sources[index % sources.length],
    publishedAt: new Date(Date.now() - index * 3600000).toISOString(),
    category: category === 'all' ? 'tech' : category,
    imageUrl: images[index % images.length]
  }
}

const generateArticles = (category: string): Article[] => {
  const count = 10
  return Array.from({ length: count }, (_, i) => generateMockArticle(category, i))
}

const SmartNewsReader = memo(function SmartNewsReader() {
  const [selectedCategory, setSelectedCategory] = useState('all')
  const [articles, setArticles] = useState<Article[]>([])
  const [loading, setLoading] = useState(true)
  const [savedArticles, setSavedArticles] = useState<Article[]>([])
  const [searchQuery, setSearchQuery] = useState('')

  const loadArticles = useCallback((category: string) => {
    setLoading(true)
    setTimeout(() => {
      setArticles(generateArticles(category))
      setLoading(false)
    }, 500)
  }, [])

  useEffect(() => {
    loadArticles(selectedCategory)
  }, [selectedCategory, loadArticles])

  const toggleSaveArticle = (article: Article) => {
    setSavedArticles(prev => {
      const isSaved = prev.some(a => a.url === article.url)
      if (isSaved) {
        return prev.filter(a => a.url !== article.url)
      } else {
        return [article, ...prev]
      }
    })
  }

  const isSaved = (article: Article) => {
    return savedArticles.some(a => a.url === article.url)
  }

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr)
    const now = new Date()
    const diff = now.getTime() - date.getTime()
    const hours = Math.floor(diff / 3600000)
    if (hours < 1) return '刚刚'
    if (hours < 24) return `${hours}小时前`
    return date.toLocaleDateString('zh-CN')
  }

  const filteredArticles = articles.filter(article =>
    article.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    article.description.toLowerCase().includes(searchQuery.toLowerCase())
  )

  return (
    <div style={{
      height: '100%',
      overflow: 'auto',
      padding: '20px',
      background: 'linear-gradient(180deg, #1a1a2e 0%, #16213e 100%)'
    }}>
      <div style={{ marginBottom: '24px' }}>
        <h2 style={{
          margin: '0 0 8px 0',
          fontSize: '24px',
          fontWeight: '700',
          background: 'linear-gradient(135deg, #f59e0b, #ef4444)',
          WebkitBackgroundClip: 'text',
          WebkitTextFillColor: 'transparent'
        }}>
          📰 智能新闻阅读器
        </h2>
        <p style={{ margin: 0, color: '#a0a0c8', fontSize: '14px' }}>
          个性化新闻推荐，实时更新全球资讯
        </p>
      </div>

      <div style={{ marginBottom: '20px' }}>
        <input
          type="text"
          placeholder="搜索新闻..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          style={{
            width: '100%',
            padding: '14px 18px',
            borderRadius: '12px',
            border: '1px solid rgba(255, 255, 255, 0.1)',
            background: 'rgba(255, 255, 255, 0.05)',
            color: '#e8e8f4',
            fontSize: '14px',
            outline: 'none',
            transition: 'all 0.2s'
          }}
          onFocus={(e) => {
            e.target.style.borderColor = 'rgba(245, 158, 11, 0.5)'
            e.target.style.boxShadow = '0 0 0 3px rgba(245, 158, 11, 0.1)'
          }}
          onBlur={(e) => {
            e.target.style.borderColor = 'rgba(255, 255, 255, 0.1)'
            e.target.style.boxShadow = 'none'
          }}
        />
      </div>

      <div style={{
        display: 'flex',
        gap: '8px',
        marginBottom: '20px',
        overflowX: 'auto',
        paddingBottom: '8px'
      }}>
        {CATEGORIES.map((category) => (
          <button
            key={category.id}
            onClick={() => setSelectedCategory(category.id)}
            style={{
              padding: '10px 16px',
              borderRadius: '20px',
              border: selectedCategory === category.id
                ? '1px solid rgba(245, 158, 11, 0.5)'
                : '1px solid rgba(255, 255, 255, 0.1)',
              background: selectedCategory === category.id
                ? 'rgba(245, 158, 11, 0.2)'
                : 'rgba(255, 255, 255, 0.03)',
              color: selectedCategory === category.id ? '#f59e0b' : '#a0a0c8',
              fontSize: '13px',
              fontWeight: '600',
              cursor: 'pointer',
              whiteSpace: 'nowrap',
              transition: 'all 0.2s'
            }}
          >
            <span style={{ marginRight: '6px' }}>{category.icon}</span>
            {category.name}
          </button>
        ))}
      </div>

      {savedArticles.length > 0 && (
        <div style={{
          background: 'rgba(16, 185, 129, 0.1)',
          border: '1px solid rgba(16, 185, 129, 0.3)',
          borderRadius: '12px',
          padding: '16px',
          marginBottom: '20px'
        }}>
          <div style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: '12px'
          }}>
            <div style={{
              color: '#10b981',
              fontWeight: '600',
              fontSize: '14px'
            }}>
              ⭐ 已收藏 ({savedArticles.length})
            </div>
          </div>
          <div style={{ display: 'flex', gap: '8px', overflowX: 'auto' }}>
            {savedArticles.map((article, _index) => (
              <div
                key={article.url}
                style={{
                  minWidth: '200px',
                  padding: '12px',
                  background: 'rgba(255, 255, 255, 0.03)',
                  borderRadius: '8px',
                  fontSize: '12px',
                  color: '#e8e8f4',
                  whiteSpace: 'nowrap',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis'
                }}
              >
                {article.title}
              </div>
            ))}
          </div>
        </div>
      )}

      {loading ? (
        <div style={{
          display: 'flex',
          flexDirection: 'column',
          gap: '16px'
        }}>
          {[1, 2, 3].map((i) => (
            <div
              key={i}
              style={{
                background: 'rgba(255, 255, 255, 0.03)',
                borderRadius: '16px',
                padding: '20px',
                animation: 'pulse 1.5s infinite'
              }}
            >
              <div style={{
                width: '60%',
                height: '20px',
                background: 'rgba(255, 255, 255, 0.05)',
                borderRadius: '4px',
                marginBottom: '12px'
              }} />
              <div style={{
                width: '100%',
                height: '48px',
                background: 'rgba(255, 255, 255, 0.05)',
                borderRadius: '4px'
              }} />
            </div>
          ))}
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {filteredArticles.map((article, _index) => (
            <article
              key={article.url}
              style={{
                background: 'rgba(255, 255, 255, 0.03)',
                borderRadius: '16px',
                overflow: 'hidden',
                border: '1px solid rgba(255, 255, 255, 0.05)',
                transition: 'all 0.2s'
              }}
            >
              <div style={{ display: 'flex' }}>
                <div style={{
                  width: '200px',
                  minWidth: '200px',
                  height: '140px',
                  backgroundImage: `url(${article.imageUrl})`,
                  backgroundSize: 'cover',
                  backgroundPosition: 'center'
                }} />
                <div style={{
                  flex: 1,
                  padding: '20px',
                  display: 'flex',
                  flexDirection: 'column'
                }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '12px' }}>
                    <div style={{ flex: 1 }}>
                      <h3 style={{
                        margin: '0 0 8px 0',
                        fontSize: '16px',
                        fontWeight: '600',
                        color: '#e8e8f4',
                        lineHeight: '1.4'
                      }}>
                        {article.title}
                      </h3>
                      <p style={{
                        margin: '0 0 12px 0',
                        fontSize: '13px',
                        color: '#a0a0c8',
                        lineHeight: '1.5',
                        display: '-webkit-box',
                        WebkitLineClamp: 2,
                        WebkitBoxOrient: 'vertical',
                        overflow: 'hidden'
                      }}>
                        {article.description}
                      </p>
                    </div>
                    <button
                      onClick={() => toggleSaveArticle(article)}
                      style={{
                        padding: '8px',
                        borderRadius: '8px',
                        border: 'none',
                        background: isSaved(article)
                          ? 'rgba(16, 185, 129, 0.2)'
                          : 'rgba(255, 255, 255, 0.05)',
                        color: isSaved(article) ? '#10b981' : '#a0a0c8',
                        cursor: 'pointer',
                        fontSize: '18px',
                        transition: 'all 0.2s'
                      }}
                    >
                      {isSaved(article) ? '⭐' : '☆'}
                    </button>
                  </div>
                  <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '12px',
                    marginTop: 'auto',
                    color: '#a0a0c8',
                    fontSize: '12px'
                  }}>
                    <span style={{
                      background: 'rgba(245, 158, 11, 0.2)',
                      color: '#f59e0b',
                      padding: '4px 8px',
                      borderRadius: '12px',
                      fontWeight: '600'
                    }}>
                      {CATEGORIES.find(c => c.id === article.category)?.name || '通用'}
                    </span>
                    <span>📡 {article.source}</span>
                    <span>⏰ {formatDate(article.publishedAt)}</span>
                  </div>
                </div>
              </div>
            </article>
          ))}
        </div>
      )}

      {!loading && filteredArticles.length === 0 && (
        <div style={{
          textAlign: 'center',
          padding: '40px',
          color: '#a0a0c8'
        }}>
          <div style={{ fontSize: '48px', marginBottom: '16px' }}>🔍</div>
          <div>没有找到相关新闻</div>
        </div>
      )}
    </div>
  )
})

export default SmartNewsReader
