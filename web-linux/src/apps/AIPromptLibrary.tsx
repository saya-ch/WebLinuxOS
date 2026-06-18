import { useState, useEffect, useMemo, memo } from 'react'
import { Search, Plus, Copy, Star, Trash2, Check, X, BookOpen, Code, BarChart3, GraduationCap, Languages, Image, Sparkles, ChevronDown } from 'lucide-react'
import { useStore } from '../store'

interface Prompt {
  id: string
  title: string
  content: string
  category: string
  isFavorite: boolean
  isCustom: boolean
  createdAt: number
}

const CATEGORIES = [
  { key: 'all', name: '全部', icon: BookOpen },
  { key: 'creative', name: '创意写作', icon: Sparkles },
  { key: 'programming', name: '编程', icon: Code },
  { key: 'analysis', name: '分析', icon: BarChart3 },
  { key: 'learning', name: '学习', icon: GraduationCap },
  { key: 'translation', name: '翻译', icon: Languages },
  { key: 'image', name: '图像生成', icon: Image },
]

const PRESET_PROMPTS: Omit<Prompt, 'id' | 'isFavorite' | 'isCustom' | 'createdAt'>[] = [
  {
    title: '通用专家助手',
    category: 'creative',
    content: '你是一位经验丰富、学识渊博的专家助手。请以清晰、专业、有条理的方式回答我的问题。对于复杂问题，请先给出核心结论，再分点展开论证，并提供实际例子。',
  },
  {
    title: '短篇故事创作',
    category: 'creative',
    content: '你是一位擅长短篇小说创作的作家。请根据我提供的主题，创作一篇800-1200字的短篇小说，要求：有明确的开头、发展、高潮和结尾；人物形象鲜明；语言生动；情感真挚。',
  },
  {
    title: '营销文案写作',
    category: 'creative',
    content: '你是一位资深营销文案策划师。请为我描述的产品/服务撰写一份吸引人的营销文案，包含：引人注目的标题、核心卖点列表、情感共鸣描述、明确的行动号召。语言风格简洁有力。',
  },
  {
    title: '头脑风暴助手',
    category: 'creative',
    content: '你是一位富有创造力的头脑风暴引导者。针对我提出的问题或主题，请：1) 提出至少10个不同角度的想法 2) 按类别分组整理 3) 选出3个最有潜力的方向并说明理由。',
  },
  {
    title: '代码审查专家',
    category: 'programming',
    content: '你是一位资深软件工程师，擅长代码审查。请对我提供的代码进行以下分析：1) 潜在的 bug 和逻辑错误 2) 性能问题 3) 代码风格和可读性改进建议 4) 安全风险 5) 更好的实现方案。请以具体代码片段为例给出建议。',
  },
  {
    title: '代码解释器',
    category: 'programming',
    content: '你是一位耐心的编程导师。请详细解释我提供的代码，包括：1) 整体功能概述 2) 关键函数/类的作用 3) 核心算法和数据结构 4) 执行流程 5) 可能的边界情况。使用通俗易懂的语言，适合初学者理解。',
  },
  {
    title: '代码重构建议',
    category: 'programming',
    content: '你是一位注重代码质量的架构师。请分析我提供的代码，并给出重构建议，包括：1) 设计模式应用 2) 函数/类拆分 3) 命名优化 4) 减少重复代码 5) 提高可测试性。请提供重构前后的代码对比。',
  },
  {
    title: 'Bug 诊断助手',
    category: 'programming',
    content: '你是一位经验丰富的调试专家。请帮我分析这段代码的 bug：请按以下步骤进行：1) 复现条件分析 2) 可能原因列举 3) 系统性排查步骤 4) 修复建议和代码示例 5) 预防此类问题的建议。',
  },
  {
    title: '数据结构与算法',
    category: 'programming',
    content: '你是一位算法竞赛教练。请帮我解决这个算法问题，按照：1) 问题分析和约束理解 2) 思路阐述（时间/空间复杂度）3) 清晰的代码实现（含注释）4) 测试用例验证 5) 可能的优化方向。',
  },
  {
    title: '数据分析报告',
    category: 'analysis',
    content: '你是一位资深数据分析师。请根据我提供的数据/问题，生成一份结构化的分析报告，包含：1) 执行摘要 2) 数据概览和关键指标 3) 趋势分析 4) 异常发现 5) 可视化建议 6) 可操作的结论和建议。',
  },
  {
    title: '批判性思维分析',
    category: 'analysis',
    content: '你是一位擅长批判性思维的学者。请对我提出的观点/文章进行深度分析：1) 核心论点识别 2) 论据质量评估 3) 逻辑推理检查 4) 隐含假设揭示 5) 反驳观点 6) 综合结论。',
  },
  {
    title: '决策支持分析',
    category: 'analysis',
    content: '你是一位商业战略顾问。请帮助我分析这个决策问题：1) 列出所有可行选项 2) SWOT 分析（每个选项的优势、劣势、机会、威胁）3) 关键成功因素 4) 风险评估 5) 推荐方案及理由。',
  },
  {
    title: '费曼学习法',
    category: 'learning',
    content: '你是一位擅长费曼学习法的导师。请用最简单易懂的方式教我理解以下概念：1) 用生活化的类比解释核心概念 2) 举至少3个具体例子 3) 逐步深入，从基础到高级 4) 在关键处停下来检查我的理解。',
  },
  {
    title: '学习计划制定',
    category: 'learning',
    content: '你是一位专业的学习规划师。请根据我想要学习的主题和可用时间，帮我制定一份详细的学习计划：1) 学习目标拆解 2) 分阶段学习内容安排 3) 推荐的学习资源（书籍、课程、网站）4) 练习和反馈机制 5) 进度检查点。',
  },
  {
    title: '知识点总结',
    category: 'learning',
    content: '请帮我系统总结以下学习内容：1) 核心概念清单（附简洁定义）2) 知识点之间的联系图谱 3) 常见误解和易错点 4) 实际应用场景 5) 复习要点和记忆技巧 6) 下一步深入学习建议。',
  },
  {
    title: '提问式学习',
    category: 'learning',
    content: '你是一位苏格拉底式的导师。不要直接告诉我答案，而是通过一系列精心设计的问题引导我自己思考并得出结论。每次只提出一个问题，根据我的回答调整下一个问题的方向。',
  },
  {
    title: '专业翻译',
    category: 'translation',
    content: '你是一位精通多语言的专业翻译。请将我提供的文本翻译成{目标语言}，要求：1) 准确传达原文意思 2) 符合目标语言的自然表达习惯 3) 保留原文的语气和风格 4) 对于文化特有表达，提供简短注释。',
  },
  {
    title: '风格润色',
    category: 'translation',
    content: '你是一位语言风格编辑大师。请对我提供的文本进行润色和优化：1) 纠正语法和用词错误 2) 提升表达的流畅性和优雅度 3) 保持原意不变 4) 使语言更加简洁有力 5) 提供润色前后的对比说明。',
  },
  {
    title: '写实风格图像',
    category: 'image',
    content: 'photorealistic, hyper-detailed, 8k, professional photography, natural lighting, shallow depth of field, award-winning photo, [主题描述], --ar 16:9 --v 6',
  },
  {
    title: '奇幻风格插画',
    category: 'image',
    content: 'fantasy art, magical atmosphere, epic composition, vibrant colors, highly detailed, digital painting, concept art, style of Ruan Jia and Artgerm, [主题描述], --ar 3:4 --v 6',
  },
  {
    title: '极简主义设计',
    category: 'image',
    content: 'minimalist design, clean composition, limited color palette, negative space, geometric shapes, flat design, modern aesthetic, [主题描述], --ar 1:1 --v 6',
  },
  {
    title: '赛博朋克风格',
    category: 'image',
    content: 'cyberpunk style, neon lights, futuristic cityscape, rain, reflections, high contrast, cinematic lighting, blade runner aesthetic, [主题描述], --ar 21:9 --v 6',
  },
]

const STORAGE_KEY = 'weblinux-ai-prompt-library-v1'

function loadCustomPrompts(): Prompt[] {
  try {
    const saved = localStorage.getItem(STORAGE_KEY)
    if (!saved) return []
    const parsed = JSON.parse(saved)
    if (Array.isArray(parsed)) return parsed
    return []
  } catch {
    return []
  }
}

function saveCustomPrompts(prompts: Prompt[]) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(prompts))
  } catch (error) {
    console.warn('保存提示词失败:', error)
  }
}

function buildInitialPrompts(custom: Prompt[]): Prompt[] {
  const presets: Prompt[] = PRESET_PROMPTS.map((p, idx) => ({
    id: `preset-${idx}`,
    title: p.title,
    content: p.content,
    category: p.category,
    isFavorite: false,
    isCustom: false,
    createdAt: Date.now() - idx * 1000,
  }))
  return [...custom, ...presets]
}

export default memo(function AIPromptLibrary() {
  const theme = useStore((state) => state.theme)
  const isDark = theme === 'dark'

  const [customPrompts, setCustomPrompts] = useState<Prompt[]>(() => loadCustomPrompts())
  const [prompts, setPrompts] = useState<Prompt[]>(() => buildInitialPrompts(loadCustomPrompts()))
  const [searchQuery, setSearchQuery] = useState('')
  const [activeCategory, setActiveCategory] = useState('all')
  const [showFavorites, setShowFavorites] = useState(false)
  const [showAddModal, setShowAddModal] = useState(false)
  const [newTitle, setNewTitle] = useState('')
  const [newContent, setNewContent] = useState('')
  const [newCategory, setNewCategory] = useState('creative')
  const [copiedId, setCopiedId] = useState<string | null>(null)
  const [expandedId, setExpandedId] = useState<string | null>(null)

  useEffect(() => {
    saveCustomPrompts(customPrompts)
    setPrompts(buildInitialPrompts(customPrompts))
  }, [customPrompts])

  const filteredPrompts = useMemo(() => {
    let result = prompts

    if (activeCategory !== 'all') {
      result = result.filter((p) => p.category === activeCategory)
    }

    if (showFavorites) {
      result = result.filter((p) => p.isFavorite)
    }

    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase().trim()
      result = result.filter(
        (p) =>
          p.title.toLowerCase().includes(query) ||
          p.content.toLowerCase().includes(query) ||
          p.category.toLowerCase().includes(query),
      )
    }

    return result.sort((a, b) => {
      if (a.isFavorite !== b.isFavorite) return a.isFavorite ? -1 : 1
      return b.createdAt - a.createdAt
    })
  }, [prompts, activeCategory, showFavorites, searchQuery])

  const categoryCount = useMemo(() => {
    const counts: Record<string, number> = { all: prompts.length }
    for (const c of CATEGORIES.slice(1)) {
      counts[c.key] = prompts.filter((p) => p.category === c.key).length
    }
    return counts
  }, [prompts])

  const favoriteCount = useMemo(() => prompts.filter((p) => p.isFavorite).length, [prompts])

  const copyToClipboard = async (content: string, id: string) => {
    try {
      if (navigator.clipboard && navigator.clipboard.writeText) {
        await navigator.clipboard.writeText(content)
      } else {
        const textarea = document.createElement('textarea')
        textarea.value = content
        textarea.style.position = 'fixed'
        textarea.style.opacity = '0'
        document.body.appendChild(textarea)
        textarea.select()
        document.execCommand('copy')
        document.body.removeChild(textarea)
      }
      setCopiedId(id)
      setTimeout(() => setCopiedId((cur) => (cur === id ? null : cur)), 1500)
    } catch (err) {
      console.warn('复制失败:', err)
    }
  }

  const toggleFavorite = (id: string) => {
    setPrompts((prev) => prev.map((p) => (p.id === id ? { ...p, isFavorite: !p.isFavorite } : p)))
    const updatedCustom = customPrompts.map((p) => (p.id === id ? { ...p, isFavorite: !p.isFavorite } : p))
    if (updatedCustom.some((p) => p.id === id)) {
      setCustomPrompts(updatedCustom)
    } else {
      const target = prompts.find((p) => p.id === id)
      if (target && !target.isCustom) {
        const newCustom: Prompt = {
          ...target,
          isFavorite: !target.isFavorite,
        }
        setCustomPrompts((prev) => {
          const filtered = prev.filter((p) => p.id !== target.id)
          return [...filtered, newCustom]
        })
      }
    }
  }

  const deleteCustomPrompt = (id: string) => {
    setCustomPrompts((prev) => prev.filter((p) => p.id !== id))
  }

  const addNewPrompt = () => {
    if (!newTitle.trim() || !newContent.trim()) return
    const newPrompt: Prompt = {
      id: `custom-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      title: newTitle.trim(),
      content: newContent.trim(),
      category: newCategory,
      isFavorite: false,
      isCustom: true,
      createdAt: Date.now(),
    }
    setCustomPrompts((prev) => [newPrompt, ...prev])
    setNewTitle('')
    setNewContent('')
    setNewCategory('creative')
    setShowAddModal(false)
  }

  const resetModal = () => {
    setNewTitle('')
    setNewContent('')
    setNewCategory('creative')
    setShowAddModal(false)
  }

  const getCategoryName = (key: string) => {
    const cat = CATEGORIES.find((c) => c.key === key)
    return cat ? cat.name : key
  }

  const cardBg = isDark ? 'rgba(255,255,255,0.04)' : 'rgba(0,0,0,0.02)'
  const cardBorder = isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.08)'

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        height: '100%',
        background: 'var(--window-bg)',
        fontSize: '14px',
        color: 'var(--titlebar-text)',
        overflow: 'hidden',
      }}
    >
      <div
        style={{
          padding: '16px',
          borderBottom: '1px solid var(--window-border)',
        }}
      >
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            marginBottom: '12px',
          }}
        >
          <div
            style={{
              flex: 1,
              position: 'relative',
            }}
          >
            <Search
              size={16}
              style={{
                position: 'absolute',
                left: '12px',
                top: '50%',
                transform: 'translateY(-50%)',
                opacity: 0.5,
              }}
            />
            <input
              type="text"
              placeholder="搜索提示词..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              style={{
                width: '100%',
                padding: '8px 12px 8px 36px',
                borderRadius: '8px',
                border: '1px solid var(--window-border)',
                background: 'var(--titlebar-bg)',
                color: 'var(--titlebar-text)',
                outline: 'none',
                fontSize: '13px',
                boxSizing: 'border-box',
              }}
            />
          </div>
          <button
            onClick={() => setShowAddModal(true)}
            style={{
              padding: '8px 14px',
              borderRadius: '8px',
              border: 'none',
              background: 'var(--accent)',
              color: 'white',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              fontSize: '13px',
              fontWeight: '500',
              whiteSpace: 'nowrap',
            }}
          >
            <Plus size={16} />
            添加
          </button>
        </div>

        <div
          style={{
            display: 'flex',
            gap: '6px',
            flexWrap: 'wrap',
            marginBottom: '10px',
          }}
        >
          {CATEGORIES.map((cat) => {
            const Icon = cat.icon
            const active = activeCategory === cat.key && !showFavorites
            return (
              <button
                key={cat.key}
                onClick={() => {
                  setActiveCategory(cat.key)
                  setShowFavorites(false)
                }}
                style={{
                  padding: '6px 12px',
                  borderRadius: '20px',
                  border: active ? 'none' : '1px solid var(--window-border)',
                  background: active ? 'var(--accent)' : 'var(--titlebar-bg)',
                  color: active ? 'white' : 'var(--titlebar-text)',
                  cursor: 'pointer',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '6px',
                  fontSize: '12px',
                  transition: 'all 0.2s',
                }}
              >
                <Icon size={14} />
                {cat.name}
                <span
                  style={{
                    fontSize: '10px',
                    opacity: 0.7,
                    padding: '1px 6px',
                    borderRadius: '10px',
                    background: active ? 'rgba(255,255,255,0.2)' : 'rgba(128,128,128,0.15)',
                  }}
                >
                  {categoryCount[cat.key] || 0}
                </span>
              </button>
            )
          })}
          <button
            onClick={() => setShowFavorites((v) => !v)}
            style={{
              padding: '6px 12px',
              borderRadius: '20px',
              border: showFavorites ? 'none' : '1px solid var(--window-border)',
              background: showFavorites ? '#ffc107' : 'var(--titlebar-bg)',
              color: showFavorites ? 'white' : 'var(--titlebar-text)',
              cursor: 'pointer',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              fontSize: '12px',
              transition: 'all 0.2s',
            }}
          >
            <Star size={14} fill={showFavorites ? 'currentColor' : 'none'} />
            收藏 ({favoriteCount})
          </button>
        </div>
      </div>

      <div
        style={{
          flex: 1,
          overflow: 'auto',
          padding: '16px',
        }}
      >
        {filteredPrompts.length === 0 ? (
          <div
            style={{
              textAlign: 'center',
              padding: '60px 20px',
              opacity: 0.5,
            }}
          >
            <BookOpen size={48} style={{ margin: '0 auto 16px', opacity: 0.3 }} />
            <p>没有找到匹配的提示词</p>
            <p style={{ fontSize: '12px', marginTop: '8px' }}>
              {searchQuery ? '尝试更换搜索关键词' : '点击右上角"添加"按钮创建新提示词'}
            </p>
          </div>
        ) : (
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
              gap: '12px',
            }}
          >
            {filteredPrompts.map((prompt) => {
              const isExpanded = expandedId === prompt.id
              const isCopied = copiedId === prompt.id
              return (
                <div
                  key={prompt.id}
                  style={{
                    background: cardBg,
                    border: `1px solid ${cardBorder}`,
                    borderRadius: '10px',
                    padding: '14px',
                    display: 'flex',
                    flexDirection: 'column',
                    transition: 'all 0.2s',
                    position: 'relative',
                  }}
                >
                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'flex-start',
                      justifyContent: 'space-between',
                      marginBottom: '10px',
                      gap: '8px',
                    }}
                  >
                    <h3
                      style={{
                        margin: 0,
                        fontSize: '14px',
                        fontWeight: '600',
                        color: 'var(--titlebar-text)',
                        flex: 1,
                        lineHeight: 1.4,
                      }}
                    >
                      {prompt.title}
                    </h3>
                    <div
                      style={{
                        display: 'flex',
                        gap: '4px',
                        flexShrink: 0,
                      }}
                    >
                      <button
                        onClick={() => toggleFavorite(prompt.id)}
                        title={prompt.isFavorite ? '取消收藏' : '收藏'}
                        style={{
                          padding: '4px',
                          borderRadius: '6px',
                          border: 'none',
                          background: 'transparent',
                          cursor: 'pointer',
                          color: prompt.isFavorite ? '#ffc107' : 'var(--titlebar-text)',
                          opacity: prompt.isFavorite ? 1 : 0.5,
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                        }}
                      >
                        <Star size={14} fill={prompt.isFavorite ? 'currentColor' : 'none'} />
                      </button>
                      {prompt.isCustom && (
                        <button
                          onClick={() => deleteCustomPrompt(prompt.id)}
                          title="删除"
                          style={{
                            padding: '4px',
                            borderRadius: '6px',
                            border: 'none',
                            background: 'transparent',
                            cursor: 'pointer',
                            color: 'var(--titlebar-text)',
                            opacity: 0.5,
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                          }}
                        >
                          <Trash2 size={14} />
                        </button>
                      )}
                    </div>
                  </div>

                  <div
                    style={{
                      display: 'flex',
                      gap: '6px',
                      marginBottom: '10px',
                      flexWrap: 'wrap',
                    }}
                  >
                    <span
                      style={{
                        padding: '2px 8px',
                        borderRadius: '10px',
                        background: 'var(--accent)',
                        color: 'white',
                        fontSize: '11px',
                      }}
                    >
                      {getCategoryName(prompt.category)}
                    </span>
                    {prompt.isCustom && (
                      <span
                        style={{
                          padding: '2px 8px',
                          borderRadius: '10px',
                          background: isDark ? 'rgba(76, 175, 80, 0.3)' : 'rgba(76, 175, 80, 0.15)',
                          color: isDark ? '#81c784' : '#2e7d32',
                          fontSize: '11px',
                        }}
                      >
                        自定义
                      </span>
                    )}
                  </div>

                  <div
                    style={{
                      fontSize: '12px',
                      lineHeight: 1.6,
                      color: 'var(--titlebar-text)',
                      opacity: 0.8,
                      marginBottom: '12px',
                      whiteSpace: 'pre-wrap',
                      wordBreak: 'break-word',
                      position: 'relative',
                      maxHeight: isExpanded ? 'none' : '100px',
                      overflow: isExpanded ? 'visible' : 'hidden',
                    }}
                  >
                    {prompt.content}
                    {!isExpanded && prompt.content.length > 180 && (
                      <div
                        style={{
                          position: 'absolute',
                          bottom: 0,
                          left: 0,
                          right: 0,
                          height: '30px',
                          background: `linear-gradient(to bottom, transparent, ${isDark ? 'rgba(30,30,30,0.9)' : 'rgba(250,250,250,0.9)'})`,
                          pointerEvents: 'none',
                        }}
                      />
                    )}
                  </div>

                  <div
                    style={{
                      display: 'flex',
                      gap: '6px',
                      marginTop: 'auto',
                      paddingTop: '4px',
                    }}
                  >
                    {prompt.content.length > 180 && (
                      <button
                        onClick={() => setExpandedId(isExpanded ? null : prompt.id)}
                        style={{
                          padding: '6px 10px',
                          borderRadius: '6px',
                          border: '1px solid var(--window-border)',
                          background: 'var(--titlebar-bg)',
                          color: 'var(--titlebar-text)',
                          cursor: 'pointer',
                          fontSize: '12px',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '4px',
                        }}
                      >
                        {isExpanded ? '收起' : '展开'}
                        <ChevronDown
                          size={12}
                          style={{
                            transform: isExpanded ? 'rotate(180deg)' : 'none',
                            transition: 'transform 0.2s',
                          }}
                        />
                      </button>
                    )}
                    <button
                      onClick={() => copyToClipboard(prompt.content, prompt.id)}
                      style={{
                        padding: '6px 12px',
                        borderRadius: '6px',
                        border: 'none',
                        background: isCopied ? '#4caf50' : 'var(--accent)',
                        color: 'white',
                        cursor: 'pointer',
                        fontSize: '12px',
                        fontWeight: '500',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '6px',
                        marginLeft: 'auto',
                        transition: 'all 0.2s',
                      }}
                    >
                      {isCopied ? (
                        <>
                          <Check size={12} />
                          已复制
                        </>
                      ) : (
                        <>
                          <Copy size={12} />
                          复制
                        </>
                      )}
                    </button>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>

      {showAddModal && (
        <div
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: isDark ? 'rgba(0,0,0,0.6)' : 'rgba(0,0,0,0.4)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 10,
            padding: '20px',
          }}
          onClick={resetModal}
        >
          <div
            style={{
              background: 'var(--window-bg)',
              borderRadius: '12px',
              width: '100%',
              maxWidth: '500px',
              border: '1px solid var(--window-border)',
              overflow: 'hidden',
              boxShadow: '0 10px 40px rgba(0,0,0,0.3)',
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div
              style={{
                padding: '16px 20px',
                borderBottom: '1px solid var(--window-border)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
              }}
            >
              <h2 style={{ margin: 0, fontSize: '16px', fontWeight: '600', color: 'var(--titlebar-text)' }}>
                添加自定义提示词
              </h2>
              <button
                onClick={resetModal}
                style={{
                  padding: '4px',
                  borderRadius: '6px',
                  border: 'none',
                  background: 'transparent',
                  cursor: 'pointer',
                  color: 'var(--titlebar-text)',
                  opacity: 0.6,
                  display: 'flex',
                }}
              >
                <X size={18} />
              </button>
            </div>

            <div style={{ padding: '20px' }}>
              <div style={{ marginBottom: '16px' }}>
                <label
                  style={{
                    display: 'block',
                    marginBottom: '6px',
                    fontSize: '12px',
                    color: 'var(--titlebar-text)',
                    opacity: 0.7,
                  }}
                >
                  标题
                </label>
                <input
                  type="text"
                  placeholder="为你的提示词起个名字..."
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '10px 12px',
                    borderRadius: '8px',
                    border: '1px solid var(--window-border)',
                    background: 'var(--titlebar-bg)',
                    color: 'var(--titlebar-text)',
                    fontSize: '13px',
                    outline: 'none',
                    boxSizing: 'border-box',
                  }}
                />
              </div>

              <div style={{ marginBottom: '16px' }}>
                <label
                  style={{
                    display: 'block',
                    marginBottom: '6px',
                    fontSize: '12px',
                    color: 'var(--titlebar-text)',
                    opacity: 0.7,
                  }}
                >
                  分类
                </label>
                <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                  {CATEGORIES.slice(1).map((cat) => {
                    const Icon = cat.icon
                    const active = newCategory === cat.key
                    return (
                      <button
                        key={cat.key}
                        onClick={() => setNewCategory(cat.key)}
                        style={{
                          padding: '6px 12px',
                          borderRadius: '6px',
                          border: active ? 'none' : '1px solid var(--window-border)',
                          background: active ? 'var(--accent)' : 'var(--titlebar-bg)',
                          color: active ? 'white' : 'var(--titlebar-text)',
                          cursor: 'pointer',
                          fontSize: '12px',
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '6px',
                        }}
                      >
                        <Icon size={12} />
                        {cat.name}
                      </button>
                    )
                  })}
                </div>
              </div>

              <div style={{ marginBottom: '16px' }}>
                <label
                  style={{
                    display: 'block',
                    marginBottom: '6px',
                    fontSize: '12px',
                    color: 'var(--titlebar-text)',
                    opacity: 0.7,
                  }}
                >
                  提示词内容
                </label>
                <textarea
                  placeholder="输入完整的提示词内容，可以包含角色设定、任务要求、输出格式等..."
                  value={newContent}
                  onChange={(e) => setNewContent(e.target.value)}
                  rows={8}
                  style={{
                    width: '100%',
                    padding: '12px',
                    borderRadius: '8px',
                    border: '1px solid var(--window-border)',
                    background: 'var(--titlebar-bg)',
                    color: 'var(--titlebar-text)',
                    fontSize: '13px',
                    lineHeight: 1.6,
                    outline: 'none',
                    resize: 'vertical',
                    boxSizing: 'border-box',
                    fontFamily: 'inherit',
                  }}
                />
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px' }}>
                <button
                  onClick={resetModal}
                  style={{
                    padding: '8px 16px',
                    borderRadius: '8px',
                    border: '1px solid var(--window-border)',
                    background: 'var(--titlebar-bg)',
                    color: 'var(--titlebar-text)',
                    cursor: 'pointer',
                    fontSize: '13px',
                  }}
                >
                  取消
                </button>
                <button
                  onClick={addNewPrompt}
                  disabled={!newTitle.trim() || !newContent.trim()}
                  style={{
                    padding: '8px 20px',
                    borderRadius: '8px',
                    border: 'none',
                    background: newTitle.trim() && newContent.trim() ? 'var(--accent)' : 'rgba(128,128,128,0.3)',
                    color: 'white',
                    cursor: newTitle.trim() && newContent.trim() ? 'pointer' : 'not-allowed',
                    fontSize: '13px',
                    fontWeight: '500',
                  }}
                >
                  保存
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
})
