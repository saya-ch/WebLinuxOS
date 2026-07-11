import { useState, useCallback } from 'react'
import { GlobeIcon, SearchIcon, ExternalLinkIcon, StarIcon, CopyIcon, CheckIcon } from '../icons'

interface Resource {
  id: string
  name: string
  description: string
  url: string
  category: string
  tags: string[]
  free: boolean
  starred: boolean
}

const defaultResources: Resource[] = [
  // 开发工具
  { id: '1', name: 'GitHub', description: '全球最大的代码托管平台', url: 'https://github.com', category: 'development', tags: ['git', '代码托管', '开源'], free: true, starred: true },
  { id: '2', name: 'Stack Overflow', description: '开发者问答社区', url: 'https://stackoverflow.com', category: 'development', tags: ['问答', '编程', '社区'], free: true, starred: false },
  { id: '3', name: 'MDN Web Docs', description: 'Mozilla开发者文档', url: 'https://developer.mozilla.org', category: 'development', tags: ['文档', 'Web', 'JavaScript'], free: true, starred: false },
  { id: '4', name: 'CodePen', description: '前端代码演示平台', url: 'https://codepen.io', category: 'development', tags: ['前端', '演示', 'CSS'], free: true, starred: false },
  { id: '5', name: 'JSFiddle', description: '在线代码编辑器', url: 'https://jsfiddle.net', category: 'development', tags: ['JavaScript', '测试', '在线'], free: true, starred: false },
  
  // 设计资源
  { id: '6', name: 'Dribbble', description: '设计师作品展示平台', url: 'https://dribbble.com', category: 'design', tags: ['设计', 'UI', '灵感'], free: true, starred: false },
  { id: '7', name: 'Figma', description: '在线协作设计工具', url: 'https://figma.com', category: 'design', tags: ['UI设计', '协作', '原型'], free: true, starred: false },
  { id: '8', name: 'Unsplash', description: '免费高质量图片库', url: 'https://unsplash.com', category: 'design', tags: ['图片', '免费', '高清'], free: true, starred: true },
  { id: '9', name: 'Font Awesome', description: '图标字体库', url: 'https://fontawesome.com', category: 'design', tags: ['图标', '字体', '免费'], free: true, starred: false },
  
  // 学习资源
  { id: '10', name: 'freeCodeCamp', description: '免费编程学习平台', url: 'https://freecodecamp.org', category: 'learning', tags: ['学习', '编程', '免费'], free: true, starred: true },
  { id: '11', name: 'Coursera', description: '在线课程平台', url: 'https://coursera.org', category: 'learning', tags: ['课程', '大学', '证书'], free: false, starred: false },
  { id: '12', name: 'LeetCode', description: '算法练习平台', url: 'https://leetcode.com', category: 'learning', tags: ['算法', '面试', '练习'], free: true, starred: false },
  { id: '13', name: 'Khan Academy', description: '免费教育平台', url: 'https://khanacademy.org', category: 'learning', tags: ['教育', '免费', '数学'], free: true, starred: false },
  
  // API服务
  { id: '14', name: 'Open-Meteo', description: '免费天气API', url: 'https://open-meteo.com', category: 'api', tags: ['天气', '免费API', '数据'], free: true, starred: false },
  { id: '15', name: 'CoinGecko', description: '加密货币数据API', url: 'https://coingecko.com', category: 'api', tags: ['加密货币', '金融', 'API'], free: true, starred: false },
  { id: '16', name: 'JSONPlaceholder', description: '免费测试API', url: 'https://jsonplaceholder.typicode.com', category: 'api', tags: ['测试', 'REST', '免费'], free: true, starred: true },
  { id: '17', name: 'IPify', description: 'IP地址查询API', url: 'https://ipify.org', category: 'api', tags: ['IP', '网络', '免费'], free: true, starred: false },
  
  // 工具
  { id: '18', name: 'TinyPNG', description: '图片压缩工具', url: 'https://tinypng.com', category: 'tools', tags: ['图片', '压缩', '免费'], free: true, starred: false },
  { id: '19', name: 'Remove.bg', description: '背景移除工具', url: 'https://remove.bg', category: 'tools', tags: ['图片', '背景移除', 'AI'], free: true, starred: false },
  { id: '20', name: 'Carbon', description: '代码截图美化', url: 'https://carbon.now.sh', category: 'tools', tags: ['代码', '截图', '美化'], free: true, starred: true },
  
  // AI工具
  { id: '21', name: 'ChatGPT', description: 'OpenAI对话AI', url: 'https://chat.openai.com', category: 'ai', tags: ['AI', '对话', 'GPT'], free: false, starred: false },
  { id: '22', name: 'Hugging Face', description: 'AI模型社区', url: 'https://huggingface.co', category: 'ai', tags: ['AI', '模型', '开源'], free: true, starred: false },
  { id: '23', name: 'Claude', description: 'Anthropic AI助手', url: 'https://claude.ai', category: 'ai', tags: ['AI', '对话', 'Claude'], free: false, starred: false },
]

const categories = [
  { id: 'all', name: '全部', icon: GlobeIcon },
  { id: 'development', name: '开发', icon: null },
  { id: 'design', name: '设计', icon: null },
  { id: 'learning', name: '学习', icon: null },
  { id: 'api', name: 'API', icon: null },
  { id: 'tools', name: '工具', icon: null },
  { id: 'ai', name: 'AI', icon: null },
]

export default function OnlineResourceHub() {
  const [resources, setResources] = useState<Resource[]>(defaultResources)
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedCategory, setSelectedCategory] = useState('all')
  const [copiedId, setCopiedId] = useState<string | null>(null)
  const [showFavorites, setShowFavorites] = useState(false)

  const filteredResources = useCallback(() => {
    return resources.filter(r => {
      const matchesSearch = r.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        r.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
        r.tags.some(t => t.toLowerCase().includes(searchQuery.toLowerCase()))
      const matchesCategory = selectedCategory === 'all' || r.category === selectedCategory
      const matchesFavorite = !showFavorites || r.starred
      return matchesSearch && matchesCategory && matchesFavorite
    })
  }, [resources, searchQuery, selectedCategory, showFavorites])

  const toggleStar = useCallback((id: string) => {
    setResources(prev => prev.map(r => 
      r.id === id ? { ...r, starred: !r.starred } : r
    ))
  }, [])

  const copyUrl = useCallback((id: string, url: string) => {
    navigator.clipboard.writeText(url)
    setCopiedId(id)
    setTimeout(() => setCopiedId(null), 2000)
  }, [])

  const openUrl = useCallback((url: string) => {
    window.open(url, '_blank', 'noopener,noreferrer')
  }, [])

  const getCategoryColor = (category: string) => {
    const colors: Record<string, string> = {
      development: '#3b82f6',
      design: '#ec4899',
      learning: '#22c55e',
      api: '#f59e0b',
      tools: '#6366f1',
      ai: '#8b5cf6',
    }
    return colors[category] || '#6b7280'
  }

  const filtered = filteredResources()

  return (
    <div style={{
      height: '100%',
      display: 'flex',
      flexDirection: 'column',
      background: 'linear-gradient(135deg, #0f172a 0%, #1e293b 100%)',
      color: '#f1f5f9',
      fontFamily: 'Inter, system-ui, sans-serif'
    }}>
      {/* 头部 */}
      <div style={{
        padding: '16px 20px',
        borderBottom: '1px solid rgba(255,255,255,0.1)',
        background: 'rgba(0,0,0,0.2)'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 12 }}>
          <GlobeIcon size={24} style={{ color: '#3b82f6' }} />
          <h1 style={{ fontSize: 18, fontWeight: 600, margin: 0 }}>在线资源聚合器</h1>
          <span style={{
            padding: '2px 8px',
            background: '#3b82f622',
            borderRadius: 12,
            fontSize: 11,
            color: '#3b82f6'
          }}>
            {resources.length} 个资源
          </span>
        </div>
        
        {/* 搜索 */}
        <div style={{ display: 'flex', gap: 8 }}>
          <div style={{ flex: 1, position: 'relative' }}>
            <SearchIcon size={14} style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', color: '#64748b' }} />
            <input
              type="text"
              placeholder="搜索资源..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              style={{
                width: '100%',
                padding: '8px 10px 8px 32px',
                background: '#0f172a',
                border: '1px solid #334155',
                borderRadius: 6,
                color: '#f1f5f9',
                fontSize: 13
              }}
            />
          </div>
          <button
            onClick={() => setShowFavorites(!showFavorites)}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 6,
              padding: '8px 12px',
              background: showFavorites ? '#3b82f622' : 'transparent',
              border: showFavorites ? '1px solid #3b82f6' : '1px solid #334155',
              borderRadius: 6,
              color: showFavorites ? '#3b82f6' : '#64748b',
              fontSize: 12,
              cursor: 'pointer'
            }}
          >
            <StarIcon size={14} fill={showFavorites ? '#3b82f6' : 'none'} />
            收藏
          </button>
        </div>
      </div>

      {/* 分类标签 */}
      <div style={{
        display: 'flex',
        gap: 6,
        padding: '12px 20px',
        borderBottom: '1px solid rgba(255,255,255,0.1)',
        overflowX: 'auto'
      }}>
        {categories.map(cat => (
          <button
            key={cat.id}
            onClick={() => setSelectedCategory(cat.id)}
            style={{
              padding: '6px 12px',
              background: selectedCategory === cat.id ? `${getCategoryColor(cat.id)}22` : 'transparent',
              border: selectedCategory === cat.id ? `1px solid ${getCategoryColor(cat.id)}` : '1px solid transparent',
              borderRadius: 6,
              color: selectedCategory === cat.id ? getCategoryColor(cat.id) : '#64748b',
              fontSize: 12,
              fontWeight: 500,
              cursor: 'pointer',
              whiteSpace: 'nowrap'
            }}
          >
            {cat.name}
          </button>
        ))}
      </div>

      {/* 资源列表 */}
      <div style={{ flex: 1, overflow: 'auto', padding: 16 }}>
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
          gap: 12
        }}>
          {filtered.map(resource => (
            <div key={resource.id} style={{
              background: 'rgba(255,255,255,0.03)',
              borderRadius: 12,
              padding: 14,
              border: `1px solid ${getCategoryColor(resource.category)}22`,
              transition: 'all 0.2s'
            }}>
              <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 8 }}>
                <div style={{ flex: 1 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                    <span style={{ fontSize: 14, fontWeight: 500 }}>{resource.name}</span>
                    {resource.free && (
                      <span style={{
                        padding: '1px 6px',
                        background: '#22c55e22',
                        borderRadius: 4,
                        fontSize: 10,
                        color: '#22c55e'
                      }}>
                        免费
                      </span>
                    )}
                  </div>
                  <div style={{ fontSize: 12, color: '#94a3b8', marginBottom: 8 }}>{resource.description}</div>
                </div>
                <button
                  onClick={() => toggleStar(resource.id)}
                  style={{
                    padding: 4,
                    background: 'transparent',
                    border: 'none',
                    color: resource.starred ? '#f59e0b' : '#64748b',
                    cursor: 'pointer'
                  }}
                >
                  <StarIcon size={16} fill={resource.starred ? '#f59e0b' : 'none'} />
                </button>
              </div>
              
              {/* 标签 */}
              <div style={{ display: 'flex', gap: 4, marginBottom: 10, flexWrap: 'wrap' }}>
                {resource.tags.map((tag, i) => (
                  <span key={i} style={{
                    padding: '2px 6px',
                    background: '#334155',
                    borderRadius: 4,
                    fontSize: 10,
                    color: '#94a3b8'
                  }}>
                    {tag}
                  </span>
                ))}
              </div>
              
              {/* URL */}
              <div style={{
                padding: '6px 10px',
                background: '#0f172a',
                borderRadius: 6,
                marginBottom: 10,
                fontSize: 11,
                color: '#64748b',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                whiteSpace: 'nowrap'
              }}>
                {resource.url}
              </div>
              
              {/* 操作按钮 */}
              <div style={{ display: 'flex', gap: 8 }}>
                <button
                  onClick={() => openUrl(resource.url)}
                  style={{
                    flex: 1,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: 6,
                    padding: '6px 12px',
                    background: getCategoryColor(resource.category),
                    border: 'none',
                    borderRadius: 6,
                    color: '#fff',
                    fontSize: 12,
                    fontWeight: 500,
                    cursor: 'pointer'
                  }}
                >
                  <ExternalLinkIcon size={14} />
                  打开
                </button>
                <button
                  onClick={() => copyUrl(resource.id, resource.url)}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    padding: 6,
                    background: copiedId === resource.id ? '#22c55e' : '#334155',
                    border: 'none',
                    borderRadius: 6,
                    color: '#fff',
                    cursor: 'pointer'
                  }}
                >
                  {copiedId === resource.id ? <CheckIcon size={14} /> : <CopyIcon size={14} />}
                </button>
              </div>
            </div>
          ))}
        </div>
        
        {filtered.length === 0 && (
          <div style={{ textAlign: 'center', padding: 40, color: '#64748b' }}>
            没有找到匹配的资源
          </div>
        )}
      </div>
    </div>
  )
}