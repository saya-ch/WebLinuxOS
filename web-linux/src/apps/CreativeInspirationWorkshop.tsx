import { useState, useCallback, useEffect, useRef } from 'react'
import { useStore } from '../store'
import {
  Lightbulb, Wand2, Shuffle, Sparkles,
  PenTool, Copy,
  RefreshCw, Bookmark, Tag,
  Dice5, Zap, Heart
} from 'lucide-react'

// 创意卡片类型
interface CreativeCard {
  id: string
  title: string
  description: string
  category: string
  tags: string[]
  colors: string[]
  icon: string
  createdAt: string
  saved: boolean
  liked: boolean
}

// 关键词联想类型
interface KeywordAssociation {
  word: string
  related: string[]
  category: string
}

// 预设创意词库
const creativeKeywords: KeywordAssociation[] = [
  { word: '科技', related: ['AI', '数据', '未来', '智能', '连接', '创新'], category: '主题' },
  { word: '自然', related: ['生态', '绿色', '森林', '海洋', '生命', '和谐'], category: '主题' },
  { word: '城市', related: ['建筑', '交通', '人群', '霓虹', '摩天楼', '繁华'], category: '主题' },
  { word: '音乐', related: ['节奏', '旋律', '音符', '舞蹈', '韵律', '动感'], category: '艺术' },
  { word: '情感', related: ['温暖', '爱', '希望', '梦想', '勇气', '治愈'], category: '情感' },
  { word: '空间', related: ['宇宙', '星空', '行星', '探索', '无限', '神秘'], category: '主题' },
  { word: '抽象', related: ['几何', '线条', '形状', '色彩', '解构', '极简'], category: '风格' },
  { word: '复古', related: ['怀旧', '胶片', '岁月', '经典', '记忆', '时光'], category: '风格' }
]

// 预设配色方案
const colorPalettes = [
  { name: '活力橙黄', colors: ['#FF6B35', '#F7C59F', '#EFEFD0', '#2E2E3A', '#004E89'] },
  { name: '梦幻紫粉', colors: ['#A855F7', '#EC4899', '#F472B6', '#8B5CF6', '#6366F1'] },
  { name: '清新自然', colors: ['#22C55E', '#86EFAC', '#F0FDF4', '#166534', '#059669'] },
  { name: '深邃星空', colors: ['#1E3A5F', '#0F172A', '#3B82F6', '#60A5FA', '#F8FAFC'] },
  { name: '热情红蓝', colors: ['#EF4444', '#3B82F6', '#F87171', '#60A5FA', '#FECACA'] },
  { name: '柔和温暖', colors: ['#FCD34D', '#FBBF24', '#FEF3C7', '#D4AF37', '#B8860B'] },
  { name: '科技蓝绿', colors: ['#06B6D4', '#14B8A6', '#0EA5E9', '#5EEAD4', '#2DD4BF'] },
  { name: '暗夜霓虹', colors: ['#F43F5E', '#8B5CF6', '#06B6D4', '#10B981', '#FBBF24'] }
]

// 预设创意提示
const creativePrompts = [
  '将两个完全不相关的概念结合在一起，比如"咖啡"和"建筑"',
  '尝试用相反的颜色来表达同一种情感',
  '想象如果这件作品是由一个5岁孩子设计的，会是什么样子',
  '用最少的设计元素传达最多的信息',
  '让静止的元素看起来像在流动',
  '设计一个能让人瞬间感到快乐的作品',
  '把复杂的概念用简单的故事来表达',
  '创造一个只有在特定角度才能看出含义的设计',
  '用数字和字母构建一个视觉故事',
  '让作品能同时被儿童和成人欣赏'
]

// 预设形状模板
const shapeTemplates = [
  { name: '圆形组合', shapes: ['circle', 'circle', 'circle'], description: '三个同心圆，代表层次与核心' },
  { name: '三角平衡', shapes: ['triangle', 'triangle', 'triangle'], description: '三个三角形形成稳定的结构' },
  { name: '方块矩阵', shapes: ['square', 'square', 'square'], description: '九宫格布局，秩序与规律' },
  { name: '波浪线条', shapes: ['wave', 'wave', 'wave'], description: '流动的曲线，动感与韵律' },
  { name: '星形放射', shapes: ['star', 'star', 'star'], description: '向外发散的能量与光芒' }
]

export default function CreativeInspirationWorkshop() {
  const theme = useStore(s => s.theme)
  const addNotification = useStore(s => s.addNotification)

  // 状态管理
  const [activeTab, setActiveTab] = useState<'canvas' | 'keywords' | 'prompts' | 'random' | 'saved'>('canvas')
  const [savedCards, setSavedCards] = useState<CreativeCard[]>(() => {
    const saved = localStorage.getItem('creative-cards')
    return saved ? JSON.parse(saved) : []
  })
  const [selectedPalette, setSelectedPalette] = useState(colorPalettes[0])
  const [keywordInput, setKeywordInput] = useState('')
  const [associatedKeywords, setAssociatedKeywords] = useState<string[]>([])
  const [currentPrompt, setCurrentPrompt] = useState(creativePrompts[0])
  const [randomCombination, setRandomCombination] = useState<{
    keywords: string[]
    colors: string[]
    shape: string
  } | null>(null)
  const [canvasShapes, setCanvasShapes] = useState<{
    type: string
    x: number
    y: number
    size: number
    color: string
  }[]>([])
  const [selectedShape, setSelectedShape] = useState<'circle' | 'square' | 'triangle'>('circle')
  const [_canvasColor, setCanvasColor] = useState(selectedPalette.colors[0])

  // 画布引用
  const canvasRef = useRef<HTMLDivElement>(null)

  // 保存到本地存储
  useEffect(() => {
    localStorage.setItem('creative-cards', JSON.stringify(savedCards))
  }, [savedCards])

  // 关键词联想
  const associateKeywords = useCallback(() => {
    if (!keywordInput.trim()) {
      setAssociatedKeywords([])
      return
    }

    const input = keywordInput.toLowerCase()
    const results: string[] = []

    // 匹配关键词库
    creativeKeywords.forEach(kw => {
      if (kw.word.includes(input) || input.includes(kw.word)) {
        results.push(...kw.related.slice(0, 4))
      }
      kw.related.forEach(rel => {
        if (rel.includes(input) || input.includes(rel)) {
          results.push(kw.word)
        }
      })
    })

    // 添加随机创意词
    const randomCreativeWords = ['灵感', '突破', '融合', '重组', '反转', '叠合', '碰撞']
    results.push(...randomCreativeWords.slice(0, 3))

    setAssociatedKeywords(results.slice(0, 12))
  }, [keywordInput])

  // 生成随机创意组合
  const generateRandomCombination = useCallback(() => {
    const randomKeywords = creativeKeywords
      .sort(() => Math.random() - 0.5)
      .slice(0, 3)
      .flatMap(kw => [kw.word, kw.related[Math.floor(Math.random() * kw.related.length)]])

    const randomPalette = colorPalettes[Math.floor(Math.random() * colorPalettes.length)]
    const randomShape = shapeTemplates[Math.floor(Math.random() * shapeTemplates.length)]

    setRandomCombination({
      keywords: randomKeywords.slice(0, 6),
      colors: randomPalette.colors,
      shape: randomShape.name
    })

    setSelectedPalette(randomPalette)
    addNotification({ title: '创意生成', message: '新的创意组合已生成', type: 'success', duration: 2000 })
  }, [addNotification])

  // 切换提示
  const nextPrompt = useCallback(() => {
    const currentIndex = creativePrompts.indexOf(currentPrompt)
    const nextIndex = (currentIndex + 1) % creativePrompts.length
    setCurrentPrompt(creativePrompts[nextIndex])
  }, [currentPrompt])

  // 添加形状到画布
  const addShapeToCanvas = useCallback((x: number, y: number) => {
    const newShape = {
      type: selectedShape,
      x,
      y,
      size: 30 + Math.random() * 40,
      color: selectedPalette.colors[Math.floor(Math.random() * selectedPalette.colors.length)]
    }
    setCanvasShapes(prev => [...prev, newShape])
  }, [selectedShape, selectedPalette])

  // 清空画布
  const clearCanvas = useCallback(() => {
    setCanvasShapes([])
    addNotification({ title: '画布清空', message: '画布已重置', type: 'info', duration: 1500 })
  }, [addNotification])

  // 保存创意卡片
  const saveCreativeCard = useCallback(() => {
    const newCard: CreativeCard = {
      id: `creative-${Date.now()}`,
      title: randomCombination?.keywords.join(' + ') || '创意画板',
      description: currentPrompt,
      category: randomCombination?.shape || '画板作品',
      tags: associatedKeywords.slice(0, 5),
      colors: selectedPalette.colors,
      icon: '🎨',
      createdAt: new Date().toISOString(),
      saved: true,
      liked: false
    }
    setSavedCards(prev => [...prev, newCard])
    addNotification({ title: '保存成功', message: '创意已保存到收藏', type: 'success', duration: 2000 })
  }, [randomCombination, currentPrompt, associatedKeywords, selectedPalette, addNotification])

  // 复制颜色方案
  const copyColors = useCallback(() => {
    const colorText = selectedPalette.colors.join(', ')
    navigator.clipboard.writeText(colorText)
    addNotification({ title: '已复制', message: '颜色方案已复制到剪贴板', type: 'success', duration: 1500 })
  }, [selectedPalette, addNotification])

  // 样式变量
  const isDark = theme === 'dark'
  const bgGradient = isDark
    ? 'linear-gradient(135deg, #1f1f3d 0%, #2d2d5a 50%, #3d3d7a 100%)'
    : 'linear-gradient(135deg, #fef3c7 0%, #fcd34d 30%, #fbbf24 60%, #f59e0b 100%)'
  const cardBg = isDark ? 'rgba(255,255,255,0.1)' : 'rgba(255,255,255,0.95)'
  const accentGradient = 'linear-gradient(135deg, #f43f5e 0%, #8b5cf6 50%, #06b6d4 100%)'

  return (
    <div style={{
      height: '100%',
      display: 'flex',
      flexDirection: 'column',
      background: bgGradient,
      color: isDark ? '#f0f0f8' : '#1f2937',
      overflow: 'hidden'
    }}>
      {/* 头部 */}
      <div style={{
        padding: '20px 24px',
        borderBottom: `1px solid ${isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.08)'}`,
        background: isDark ? 'rgba(0,0,0,0.2)' : 'rgba(255,255,255,0.3)'
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div style={{
              width: '48px',
              height: '48px',
              borderRadius: '16px',
              background: accentGradient,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: '0 4px 16px rgba(244,63,94,0.4)'
            }}>
              <Wand2 size={28} color="#fff" />
            </div>
            <div>
              <h1 style={{ margin: 0, fontSize: '22px', fontWeight: 700 }}>创意灵感工坊</h1>
              <p style={{ margin: 0, fontSize: '13px', opacity: 0.7 }}>活泼多彩，激发无限创意</p>
            </div>
          </div>
          <div style={{
            display: 'flex',
            gap: '12px'
          }}>
            <div style={{
              padding: '10px 16px',
              background: cardBg,
              borderRadius: '12px',
              textAlign: 'center',
              border: `1px solid ${isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.05)'}`,
              boxShadow: '0 2px 8px rgba(0,0,0,0.1)'
            }}>
              <Bookmark size={16} style={{ marginBottom: '4px' }} />
              <div style={{ fontSize: '14px', fontWeight: 600 }}>{savedCards.length}</div>
            </div>
            <button
              onClick={saveCreativeCard}
              style={{
                padding: '10px 20px',
                background: accentGradient,
                color: '#fff',
                border: 'none',
                borderRadius: '12px',
                cursor: 'pointer',
                fontSize: '14px',
                fontWeight: 500,
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                boxShadow: '0 4px 12px rgba(244,63,94,0.4)'
              }}
            >
              <Heart size={18} /> 保存创意
            </button>
          </div>
        </div>
      </div>

      {/* 标签导航 */}
      <div style={{
        display: 'flex',
        gap: '8px',
        padding: '12px 24px',
        borderBottom: `1px solid ${isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.08)'}`,
        overflow: 'auto',
        flexWrap: 'wrap'
      }}>
        {[
          { id: 'canvas', name: '灵感画板', icon: PenTool },
          { id: 'keywords', name: '关键词联想', icon: Tag },
          { id: 'prompts', name: '创意提示', icon: Lightbulb },
          { id: 'random', name: '随机组合', icon: Dice5 },
          { id: 'saved', name: '收藏夹', icon: Bookmark }
        ].map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as typeof activeTab)}
            style={{
              padding: '10px 18px',
              background: activeTab === tab.id
                ? accentGradient
                : cardBg,
              color: activeTab === tab.id ? '#fff' : isDark ? '#c0c0d0' : '#4a5568',
              border: 'none',
              borderRadius: '10px',
              cursor: 'pointer',
              fontSize: '14px',
              fontWeight: activeTab === tab.id ? 600 : 400,
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              transition: 'all 0.2s ease',
              boxShadow: activeTab === tab.id ? '0 4px 12px rgba(244,63,94,0.4)' : '0 2px 4px rgba(0,0,0,0.1)'
            }}
          >
            <tab.icon size={18} />
            {tab.name}
          </button>
        ))}
      </div>

      {/* 内容区域 */}
      <div style={{ flex: 1, padding: '20px 24px', overflow: 'auto' }}>
        {/* 灵感画板 */}
        {activeTab === 'canvas' && (
          <div style={{ display: 'flex', gap: '24px', height: '100%' }}>
            {/* 工具面板 */}
            <div style={{
              width: '280px',
              background: cardBg,
              borderRadius: '16px',
              padding: '20px',
              border: `1px solid ${isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.05)'}`,
              boxShadow: '0 4px 16px rgba(0,0,0,0.1)'
            }}>
              <h3 style={{ margin: '0 0 16px 0', fontSize: '16px', fontWeight: 600 }}>形状工具</h3>

              <div style={{ display: 'flex', gap: '8px', marginBottom: '20px' }}>
                {[
                  { type: 'circle', name: '圆形' },
                  { type: 'square', name: '方块' },
                  { type: 'triangle', name: '三角' }
                ].map(shape => (
                  <button
                    key={shape.type}
                    onClick={() => setSelectedShape(shape.type as typeof selectedShape)}
                    style={{
                      width: '60px',
                      height: '60px',
                      background: selectedShape === shape.type
                        ? accentGradient
                        : isDark ? 'rgba(0,0,0,0.3)' : 'rgba(0,0,0,0.05)',
                      border: `2px solid ${selectedShape === shape.type ? 'transparent' : isDark ? 'rgba(255,255,255,0.2)' : 'rgba(0,0,0,0.1)'}`,
                      borderRadius: '10px',
                      cursor: 'pointer',
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '6px',
                      color: selectedShape === shape.type ? '#fff' : isDark ? '#c0c0d0' : '#4a5568'
                    }}
                  >
                    {shape.type === 'circle' && <div style={{ width: '24px', height: '24px', borderRadius: '50%', background: selectedShape === shape.type ? '#fff' : 'currentColor' }} />}
                    {shape.type === 'square' && <div style={{ width: '24px', height: '24px', background: selectedShape === shape.type ? '#fff' : 'currentColor' }} />}
                    {shape.type === 'triangle' && <div style={{
                      width: 0,
                      height: 0,
                      borderLeft: '12px solid transparent',
                      borderRight: '12px solid transparent',
                      borderBottom: `24px solid ${selectedShape === shape.type ? '#fff' : 'currentColor'}`
                    }} />}
                    <span style={{ fontSize: '11px' }}>{shape.name}</span>
                  </button>
                ))}
              </div>

              <h3 style={{ margin: '0 0 16px 0', fontSize: '16px', fontWeight: 600 }}>颜色方案</h3>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                {colorPalettes.slice(0, 4).map(palette => (
                  <button
                    key={palette.name}
                    onClick={() => {
                      setSelectedPalette(palette)
                      setCanvasColor(palette.colors[0])
                    }}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '10px',
                      padding: '12px',
                      background: selectedPalette.name === palette.name
                        ? 'rgba(244,63,94,0.2)'
                        : isDark ? 'rgba(0,0,0,0.2)' : 'rgba(0,0,0,0.02)',
                      border: `1px solid ${selectedPalette.name === palette.name ? '#f43f5e' : 'transparent'}`,
                      borderRadius: '10px',
                      cursor: 'pointer',
                      transition: 'all 0.15s ease'
                    }}
                  >
                    <div style={{ display: 'flex', gap: '4px' }}>
                      {palette.colors.slice(0, 5).map(color => (
                        <div key={color} style={{
                          width: '20px',
                          height: '20px',
                          borderRadius: '4px',
                          background: color,
                          boxShadow: '0 2px 4px rgba(0,0,0,0.2)'
                        }} />
                      ))}
                    </div>
                    <span style={{ fontSize: '13px', opacity: 0.8 }}>{palette.name}</span>
                  </button>
                ))}
              </div>

              <button
                onClick={copyColors}
                style={{
                  width: '100%',
                  marginTop: '16px',
                  padding: '10px',
                  background: isDark ? 'rgba(0,0,0,0.3)' : 'rgba(0,0,0,0.05)',
                  color: isDark ? '#c0c0d0' : '#4a5568',
                  border: 'none',
                  borderRadius: '8px',
                  cursor: 'pointer',
                  fontSize: '13px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '6px'
                }}
              >
                <Copy size={16} /> 复制颜色
              </button>

              <button
                onClick={clearCanvas}
                style={{
                  width: '100%',
                  marginTop: '10px',
                  padding: '10px',
                  background: 'linear-gradient(135deg, #f43f5e, #ef4444)',
                  color: '#fff',
                  border: 'none',
                  borderRadius: '8px',
                  cursor: 'pointer',
                  fontSize: '13px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '6px'
                }}
              >
                <RefreshCw size={16} /> 清空画布
              </button>
            </div>

            {/* 画布区域 */}
            <div
              ref={canvasRef}
              onClick={(e) => {
                const rect = e.currentTarget.getBoundingClientRect()
                const x = e.clientX - rect.left
                const y = e.clientY - rect.top
                addShapeToCanvas(x, y)
              }}
              style={{
                flex: 1,
                background: isDark ? 'rgba(0,0,0,0.4)' : 'rgba(255,255,255,0.5)',
                borderRadius: '16px',
                border: `2px dashed ${isDark ? 'rgba(255,255,255,0.2)' : 'rgba(0,0,0,0.1)'}`,
                position: 'relative',
                cursor: 'crosshair',
                overflow: 'hidden',
                minHeight: '400px'
              }}
            >
              {/* 渲染形状 */}
              {canvasShapes.map((shape, idx) => (
                <div
                  key={idx}
                  style={{
                    position: 'absolute',
                    left: shape.x,
                    top: shape.y,
                    width: shape.size,
                    height: shape.size,
                    borderRadius: shape.type === 'circle' ? '50%' : shape.type === 'triangle' ? '0' : '4px',
                    background: shape.type === 'triangle' ? 'transparent' : shape.color,
                    boxShadow: '0 4px 12px rgba(0,0,0,0.3)',
                    animation: 'pulse 2s ease-in-out infinite',
                    ...(shape.type === 'triangle' && {
                      width: 0,
                      height: 0,
                      borderLeft: `${shape.size / 2}px solid transparent`,
                      borderRight: `${shape.size / 2}px solid transparent`,
                      borderBottom: `${shape.size}px solid ${shape.color}`
                    })
                  }}
                />
              ))}

              {/* 提示文字 */}
              {canvasShapes.length === 0 && (
                <div style={{
                  position: 'absolute',
                  top: '50%',
                  left: '50%',
                  transform: 'translate(-50%, -50%)',
                  textAlign: 'center',
                  opacity: 0.6
                }}>
                  <PenTool size={48} style={{ marginBottom: '16px' }} />
                  <p style={{ margin: 0, fontSize: '16px' }}>点击画布添加形状</p>
                  <p style={{ margin: '8px 0 0 0', fontSize: '13px' }}>选择左侧工具和颜色开始创作</p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* 关键词联想 */}
        {activeTab === 'keywords' && (
          <div style={{ maxWidth: '800px', margin: '0 auto' }}>
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
                <Tag size={32} color="#f43f5e" />
                <h3 style={{ margin: 0, fontSize: '20px', fontWeight: 600 }}>关键词联想引擎</h3>
              </div>

              <p style={{
                margin: '0 0 20px 0',
                fontSize: '14px',
                opacity: 0.7,
                lineHeight: 1.6
              }}>
                输入一个关键词，系统会为你联想相关的创意词汇，帮助你拓展思维边界
              </p>

              {/* 输入区域 */}
              <div style={{ marginBottom: '24px' }}>
                <input
                  type="text"
                  value={keywordInput}
                  onChange={e => setKeywordInput(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && associateKeywords()}
                  placeholder="输入关键词，如：科技、自然、音乐..."
                  style={{
                    width: '100%',
                    padding: '16px 20px',
                    background: isDark ? 'rgba(0,0,0,0.3)' : 'rgba(0,0,0,0.02)',
                    border: `1px solid ${isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.08)'}`,
                    borderRadius: '12px',
                    color: isDark ? '#f0f0f8' : '#1f2937',
                    fontSize: '16px',
                    outline: 'none'
                  }}
                />
              </div>

              <button
                onClick={associateKeywords}
                style={{
                  width: '100%',
                  padding: '14px',
                  background: accentGradient,
                  color: '#fff',
                  border: 'none',
                  borderRadius: '12px',
                  cursor: 'pointer',
                  fontSize: '15px',
                  fontWeight: 600,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '8px',
                  boxShadow: '0 4px 16px rgba(244,63,94,0.4)'
                }}
              >
                <Sparkles size={18} /> 开始联想
              </button>

              {/* 联想结果 */}
              {associatedKeywords.length > 0 && (
                <div style={{
                  marginTop: '24px',
                  padding: '20px',
                  background: isDark ? 'rgba(244,63,94,0.1)' : 'rgba(244,63,94,0.05)',
                  borderRadius: '12px',
                  border: '1px solid rgba(244,63,94,0.2)'
                }}>
                  <div style={{
                    fontSize: '14px',
                    fontWeight: 600,
                    marginBottom: '16px',
                    color: '#f43f5e'
                  }}>
                    联想关键词 ({associatedKeywords.length})
                  </div>
                  <div style={{
                    display: 'flex',
                    gap: '10px',
                    flexWrap: 'wrap'
                  }}>
                    {associatedKeywords.map(kw => (
                      <div
                        key={kw}
                        style={{
                          padding: '10px 16px',
                          background: selectedPalette.colors[Math.floor(Math.random() * selectedPalette.colors.length)],
                          borderRadius: '8px',
                          color: '#fff',
                          fontSize: '14px',
                          fontWeight: 500,
                          cursor: 'pointer',
                          transition: 'transform 0.15s ease',
                          boxShadow: '0 2px 8px rgba(0,0,0,0.2)'
                        }}
                        onClick={() => {
                          setKeywordInput(kw)
                          associateKeywords()
                        }}
                      >
                        {kw}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* 热门词库 */}
              <div style={{ marginTop: '24px' }}>
                <p style={{ fontSize: '14px', opacity: 0.7, marginBottom: '12px' }}>热门创意词汇</p>
                <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                  {creativeKeywords.slice(0, 6).map(kw => (
                    <button
                      key={kw.word}
                      onClick={() => {
                        setKeywordInput(kw.word)
                        associateKeywords()
                      }}
                      style={{
                        padding: '8px 14px',
                        background: cardBg,
                        color: isDark ? '#c0c0d0' : '#4a5568',
                        border: 'none',
                        borderRadius: '8px',
                        cursor: 'pointer',
                        fontSize: '13px'
                      }}
                    >
                      {kw.word}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* 创意提示 */}
        {activeTab === 'prompts' && (
          <div style={{ maxWidth: '700px', margin: '0 auto' }}>
            <div style={{
              background: cardBg,
              borderRadius: '20px',
              padding: '40px',
              textAlign: 'center',
              border: `1px solid ${isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.05)'}`,
              boxShadow: '0 8px 32px rgba(0,0,0,0.15)',
              position: 'relative'
            }}>
              {/* 背景装饰 */}
              <div style={{
                position: 'absolute',
                top: -20,
                right: -20,
                width: '100px',
                height: '100px',
                background: accentGradient,
                borderRadius: '50%',
                opacity: 0.3,
                filter: 'blur(30px)'
              }} />

              <Lightbulb size={64} color="#fbbf24" style={{ marginBottom: '24px' }} />

              <h3 style={{ margin: '0 0 16px 0', fontSize: '14px', fontWeight: 500, opacity: 0.6 }}>今日创意提示</h3>

              <p style={{
                margin: '0 0 32px 0',
                fontSize: '20px',
                fontWeight: 600,
                lineHeight: 1.6,
                color: isDark ? '#f0f0f8' : '#1f2937'
              }}>
                {currentPrompt}
              </p>

              <button
                onClick={nextPrompt}
                style={{
                  padding: '16px 32px',
                  background: accentGradient,
                  color: '#fff',
                  border: 'none',
                  borderRadius: '14px',
                  cursor: 'pointer',
                  fontSize: '16px',
                  fontWeight: 600,
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '10px',
                  boxShadow: '0 4px 20px rgba(244,63,94,0.5)'
                }}
              >
                <Zap size={20} />
                下一个提示
              </button>
            </div>

            {/* 提示列表 */}
            <div style={{
              marginTop: '24px',
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))',
              gap: '12px'
            }}>
              {creativePrompts.slice(0, 5).map(prompt => (
                <div
                  key={prompt}
                  onClick={() => setCurrentPrompt(prompt)}
                  style={{
                    background: currentPrompt === prompt ? accentGradient : cardBg,
                    color: currentPrompt === prompt ? '#fff' : isDark ? '#c0c0d0' : '#4a5568',
                    padding: '16px',
                    borderRadius: '12px',
                    cursor: 'pointer',
                    fontSize: '13px',
                    lineHeight: 1.5,
                    border: `1px solid ${currentPrompt === prompt ? 'transparent' : isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.05)'}`,
                    boxShadow: currentPrompt === prompt ? '0 4px 12px rgba(244,63,94,0.4)' : '0 2px 8px rgba(0,0,0,0.1)',
                    transition: 'all 0.2s ease'
                  }}
                >
                  {prompt.slice(0, 30)}...
                </div>
              ))}
            </div>
          </div>
        )}

        {/* 随机组合 */}
        {activeTab === 'random' && (
          <div style={{ maxWidth: '800px', margin: '0 auto' }}>
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
                <Dice5 size={32} color="#f43f5e" />
                <h3 style={{ margin: 0, fontSize: '20px', fontWeight: 600 }}>随机创意组合器</h3>
              </div>

              <p style={{
                margin: '0 0 24px 0',
                fontSize: '14px',
                opacity: 0.7
              }}>
                点击按钮，系统将随机组合关键词、配色和形状，给你全新的创意灵感
              </p>

              <button
                onClick={generateRandomCombination}
                style={{
                  width: '100%',
                  padding: '16px',
                  background: accentGradient,
                  color: '#fff',
                  border: 'none',
                  borderRadius: '14px',
                  cursor: 'pointer',
                  fontSize: '16px',
                  fontWeight: 600,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '10px',
                  boxShadow: '0 4px 20px rgba(244,63,94,0.5)'
                }}
              >
                <Shuffle size={20} />
                生成随机组合
              </button>

              {/* 组合结果 */}
              {randomCombination && (
                <div style={{
                  marginTop: '24px',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '20px'
                }}>
                  {/* 关键词 */}
                  <div style={{
                    padding: '20px',
                    background: isDark ? 'rgba(0,0,0,0.3)' : 'rgba(0,0,0,0.02)',
                    borderRadius: '12px'
                  }}>
                    <div style={{
                      fontSize: '13px',
                      fontWeight: 600,
                      marginBottom: '12px',
                      color: '#f43f5e'
                    }}>
                      关键词组合
                    </div>
                    <div style={{
                      display: 'flex',
                      gap: '8px',
                      flexWrap: 'wrap'
                    }}>
                      {randomCombination.keywords.map(kw => (
                        <span
                          key={kw}
                          style={{
                            padding: '8px 14px',
                            background: selectedPalette.colors[Math.floor(Math.random() * selectedPalette.colors.length)],
                            borderRadius: '6px',
                            color: '#fff',
                            fontSize: '14px',
                            fontWeight: 500
                          }}
                        >
                          {kw}
                        </span>
                      ))}
                    </div>
                  </div>

                  {/* 配色 */}
                  <div style={{
                    padding: '20px',
                    background: isDark ? 'rgba(0,0,0,0.3)' : 'rgba(0,0,0,0.02)',
                    borderRadius: '12px'
                  }}>
                    <div style={{
                      fontSize: '13px',
                      fontWeight: 600,
                      marginBottom: '12px',
                      color: '#06b6d4'
                    }}>
                      推荐配色
                    </div>
                    <div style={{
                      display: 'flex',
                      gap: '8px',
                      alignItems: 'center'
                    }}>
                      {randomCombination.colors.map(color => (
                        <div
                          key={color}
                          style={{
                            width: '48px',
                            height: '48px',
                            borderRadius: '8px',
                            background: color,
                            boxShadow: '0 4px 12px rgba(0,0,0,0.2)'
                          }}
                        />
                      ))}
                    </div>
                  </div>

                  {/* 形状 */}
                  <div style={{
                    padding: '20px',
                    background: isDark ? 'rgba(0,0,0,0.3)' : 'rgba(0,0,0,0.02)',
                    borderRadius: '12px'
                  }}>
                    <div style={{
                      fontSize: '13px',
                      fontWeight: 600,
                      marginBottom: '12px',
                      color: '#8b5cf6'
                    }}>
                      建议形状
                    </div>
                    <span style={{
                      padding: '10px 20px',
                      background: accentGradient,
                      borderRadius: '8px',
                      color: '#fff',
                      fontSize: '15px',
                      fontWeight: 500
                    }}>
                      {randomCombination.shape}
                    </span>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* 收藏夹 */}
        {activeTab === 'saved' && (
          <div>
            {savedCards.length === 0 ? (
              <div style={{
                textAlign: 'center',
                padding: '60px 24px',
                background: cardBg,
                borderRadius: '16px',
                border: `1px solid ${isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.05)'}`,
                boxShadow: '0 4px 16px rgba(0,0,0,0.1)'
              }}>
                <Bookmark size={48} style={{ marginBottom: '16px', opacity: 0.4 }} />
                <p style={{ margin: 0, fontSize: '16px', opacity: 0.7 }}>暂无收藏的创意</p>
                <p style={{ margin: '8px 0 0 0', fontSize: '14px', opacity: 0.5 }}>在其他页面创作并保存你的灵感</p>
              </div>
            ) : (
              <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
                gap: '16px'
              }}>
                {savedCards.map(card => (
                  <div
                    key={card.id}
                    style={{
                      background: cardBg,
                      borderRadius: '16px',
                      padding: '20px',
                      border: `1px solid ${isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.05)'}`,
                      boxShadow: '0 4px 16px rgba(0,0,0,0.1)',
                      transition: 'transform 0.2s ease'
                    }}
                  >
                    <div style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      marginBottom: '12px'
                    }}>
                      <span style={{ fontSize: '24px' }}>{card.icon}</span>
                      <div style={{
                        display: 'flex',
                        gap: '8px'
                      }}>
                        <button
                          onClick={() => {
                            setSavedCards(prev => prev.filter(c => c.id !== card.id))
                            addNotification({ title: '已删除', message: '创意已从收藏移除', type: 'info', duration: 1500 })
                          }}
                          style={{
                            padding: '4px 8px',
                            background: 'transparent',
                            color: isDark ? '#c0c0d0' : '#4a5568',
                            border: 'none',
                            borderRadius: '4px',
                            cursor: 'pointer',
                            fontSize: '12px'
                          }}
                        >
                          删除
                        </button>
                      </div>
                    </div>

                    <h4 style={{
                      margin: '0 0 8px 0',
                      fontSize: '16px',
                      fontWeight: 600
                    }}>
                      {card.title}
                    </h4>

                    <p style={{
                      margin: '0 0 12px 0',
                      fontSize: '13px',
                      opacity: 0.7,
                      lineHeight: 1.5
                    }}>
                      {card.description.slice(0, 50)}...
                    </p>

                    {/* 颜色预览 */}
                    <div style={{
                      display: 'flex',
                      gap: '4px',
                      marginBottom: '12px'
                    }}>
                      {card.colors.slice(0, 5).map(color => (
                        <div
                          key={color}
                          style={{
                            width: '24px',
                            height: '24px',
                            borderRadius: '4px',
                            background: color
                          }}
                        />
                      ))}
                    </div>

                    {/* 标签 */}
                    <div style={{
                      display: 'flex',
                      gap: '6px',
                      flexWrap: 'wrap'
                    }}>
                      {card.tags.slice(0, 3).map(tag => (
                        <span
                          key={tag}
                          style={{
                            padding: '4px 8px',
                            background: isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.05)',
                            borderRadius: '4px',
                            fontSize: '11px',
                            opacity: 0.8
                          }}
                        >
                          {tag}
                        </span>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      {/* CSS动画 */}
      <style>{`
        @keyframes pulse {
          0%, 100% { transform: scale(1); }
          50% { transform: scale(1.05); }
        }
      `}</style>
    </div>
  )
}