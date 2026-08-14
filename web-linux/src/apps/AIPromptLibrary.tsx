import { useState, useEffect, useMemo, memo, useRef, type ReactNode, type CSSProperties } from 'react'
import {
  Search,
  Plus,
  Copy,
  Star,
  Trash2,
  Check,
  X,
  BookOpen,
  Code,
  BarChart3,
  GraduationCap,
  Languages,
  Image,
  Sparkles,
  ChevronDown,
  Eye,
  Edit3,
  Download,
  Upload,
  Wand2,
  PenTool,
  Briefcase,
} from 'lucide-react'
import { useStore } from '../store'

interface Prompt {
  id: string
  title: string
  content: string
  category: string
  isFavorite: boolean
  isCustom: boolean
  createdAt: number
  description?: string
}

const CATEGORIES = [
  { key: 'all', name: '全部', icon: BookOpen, color: '#6366f1' },
  { key: 'code', name: '代码生成', icon: Code, color: '#0ea5e9' },
  { key: 'writing', name: '文本写作', icon: PenTool, color: '#ec4899' },
  { key: 'translation', name: '翻译', icon: Languages, color: '#14b8a6' },
  { key: 'analysis', name: '数据分析', icon: BarChart3, color: '#f59e0b' },
  { key: 'creative', name: '创意设计', icon: Sparkles, color: '#a855f7' },
  { key: 'education', name: '教育学习', icon: GraduationCap, color: '#22c55e' },
  { key: 'business', name: '商业营销', icon: Briefcase, color: '#ef4444' },
  { key: 'image', name: '图像生成', icon: Image, color: '#f97316' },
]

const PRESET_PROMPTS: Omit<Prompt, 'id' | 'isFavorite' | 'isCustom' | 'createdAt'>[] = [
  {
    title: '通用专家助手',
    category: 'writing',
    description: '以专家视角解答各类问题',
    content:
      '你是一位经验丰富、学识渊博的专家助手。请以清晰、专业、有条理的方式回答我的问题。对于复杂问题，请先给出核心结论，再分点展开论证，并提供实际例子。问题：{问题}',
  },
  {
    title: '代码解释器',
    category: 'code',
    description: '详细解读任意代码片段',
    content:
      '你是一位耐心的编程导师。请详细解释以下代码，包括：1) 整体功能概述 2) 关键函数/类的作用 3) 核心算法和数据结构 4) 执行流程 5) 可能的边界情况。使用通俗易懂的语言，适合初学者理解。\n\n代码：\n{代码}',
  },
  {
    title: '代码审查专家',
    category: 'code',
    description: '全面审查代码并给出改进建议',
    content:
      '你是一位资深软件工程师，擅长代码审查。请对我提供的代码进行以下分析：1) 潜在的 bug 和逻辑错误 2) 性能问题 3) 代码风格和可读性改进建议 4) 安全风险 5) 更好的实现方案。请以具体代码片段为例给出建议。\n\n代码：\n{代码}',
  },
  {
    title: '代码重构建议',
    category: 'code',
    description: '提供重构方案提升代码质量',
    content:
      '你是一位注重代码质量的架构师。请分析我提供的代码，并给出重构建议，包括：1) 设计模式应用 2) 函数/类拆分 3) 命名优化 4) 减少重复代码 5) 提高可测试性。请提供重构前后的代码对比。\n\n代码：\n{代码}',
  },
  {
    title: 'Bug 诊断助手',
    category: 'code',
    description: '系统化排查和修复 Bug',
    content:
      '你是一位经验丰富的调试专家。请帮我分析这段代码的 bug：按以下步骤进行：1) 复现条件分析 2) 可能原因列举 3) 系统性排查步骤 4) 修复建议和代码示例 5) 预防此类问题的建议。\n\n错误描述：\n{错误描述}',
  },
  {
    title: '算法问题解决',
    category: 'code',
    description: '算法题目全流程解析',
    content:
      '你是一位算法竞赛教练。请帮我解决这个算法问题：1) 问题分析和约束理解 2) 思路阐述（时间/空间复杂度）3) 清晰的代码实现（含注释）4) 测试用例验证 5) 可能的优化方向。\n\n问题描述：\n{问题描述}',
  },
  {
    title: '函数生成器',
    category: 'code',
    description: '根据需求生成各类编程语言函数',
    content:
      '请编写一个 {编程语言} 函数，实现 {功能描述}。要求：1) 函数签名清晰 2) 包含完整的输入输出验证 3) 处理边界情况 4) 附带使用示例和文档注释。',
  },
  {
    title: '单元测试生成器',
    category: 'code',
    description: '自动生成测试用例',
    content:
      '请为以下代码生成完整的单元测试：1) 覆盖正常路径 2) 覆盖边界条件 3) 覆盖异常情况 4) 使用 {测试框架} 5) 包含合理的断言。\n\n被测代码：\n{代码}',
  },
  {
    title: '短篇故事创作',
    category: 'writing',
    description: '创作引人入胜的短篇小说',
    content:
      '你是一位擅长短篇小说创作的作家。请根据以下主题，创作一篇 {字数} 字左右的短篇小说，要求：有明确的开头、发展、高潮和结尾；人物形象鲜明；语言生动；情感真挚。\n\n主题：{主题}',
  },
  {
    title: '文章润色大师',
    category: 'writing',
    description: '提升文字表达质量',
    content:
      '你是一位语言风格编辑大师。请对我提供的文本进行润色和优化：1) 纠正语法和用词错误 2) 提升表达的流畅性和优雅度 3) 保持原意不变 4) 使语言更加简洁有力 5) 提供润色前后的对比说明。\n\n原文：\n{原文}',
  },
  {
    title: '营销文案写作',
    category: 'business',
    description: '撰写高转化率营销文案',
    content:
      '你是一位资深营销文案策划师。请为 "{产品/服务}" 撰写一份吸引人的营销文案，包含：引人注目的标题、核心卖点列表、情感共鸣描述、明确的行动号召。目标受众：{目标受众}。语言风格简洁有力。',
  },
  {
    title: '社交媒体脚本',
    category: 'writing',
    description: '打造爆款社交内容',
    content:
      '请为 "{主题}" 创作一份社交媒体内容脚本（平台：{平台}），要求：1) 开头3秒吸引人 2) 内容紧凑有趣 3) 结尾有互动引导 4) 包含相关话题标签 5) 符合平台调性。',
  },
  {
    title: '专业翻译',
    category: 'translation',
    description: '多语言精准翻译',
    content:
      '你是一位精通多语言的专业翻译。请将以下文本翻译成{目标语言}，要求：1) 准确传达原文意思 2) 符合目标语言的自然表达习惯 3) 保留原文的语气和风格 4) 对于文化特有表达，提供简短注释。\n\n原文：\n{原文}',
  },
  {
    title: '本地化适配',
    category: 'translation',
    description: '实现产品多语言本地化',
    content:
      '你是一位本地化专家。请将以下内容适配到{目标语言和地区}市场：1) 翻译文本 2) 调整文化习俗相关表达 3) 格式化日期、货币、数字 4) 调整用语风格以适应当地用户习惯。\n\n内容：\n{原文}',
  },
  {
    title: '数据分析报告',
    category: 'analysis',
    description: '生成结构化分析报告',
    content:
      '你是一位资深数据分析师。请根据以下数据/问题，生成一份结构化的分析报告，包含：1) 执行摘要 2) 数据概览和关键指标 3) 趋势分析 4) 异常发现 5) 可视化建议 6) 可操作的结论和建议。\n\n数据/问题：\n{数据描述}',
  },
  {
    title: 'SQL 查询助手',
    category: 'analysis',
    description: '自然语言转 SQL',
    content:
      '你是一位数据库专家。请根据以下需求编写 SQL 查询语句：1) 分析需求中的实体和关系 2) 设计合理的查询 3) 考虑性能优化 4) 提供执行说明和示例。数据库类型：{数据库类型}。需求：\n{需求描述}',
  },
  {
    title: '决策支持分析',
    category: 'analysis',
    description: 'SWOT 分析辅助决策',
    content:
      '你是一位商业战略顾问。请帮助我分析以下决策问题：1) 列出所有可行选项 2) SWOT 分析（每个选项的优势、劣势、机会、威胁）3) 关键成功因素 4) 风险评估 5) 推荐方案及理由。\n\n决策问题：\n{决策问题}',
  },
  {
    title: '费曼学习法',
    category: 'education',
    description: '用最简单的方式学习',
    content:
      '你是一位擅长费曼学习法的导师。请用最简单易懂的方式教我理解 "{概念}"：1) 用生活化的类比解释核心概念 2) 举至少3个具体例子 3) 逐步深入，从基础到高级 4) 在关键处停下来检查我的理解。',
  },
  {
    title: '学习计划制定',
    category: 'education',
    description: '个性化学习路径规划',
    content:
      '你是一位专业的学习规划师。请根据我想要学习的主题和可用时间，帮我制定一份详细的学习计划：1) 学习目标拆解 2) 分阶段学习内容安排 3) 推荐的学习资源（书籍、课程、网站）4) 练习和反馈机制 5) 进度检查点。\n\n学习主题：{学习主题}，可用时间：{可用时间}',
  },
  {
    title: '知识测验生成器',
    category: 'education',
    description: '根据知识点生成练习题',
    content:
      '请根据以下知识点生成一份测验，包含：1) 5 道选择题 2) 3 道简答题 3) 1 道综合应用题 4) 附完整答案和解析。难度等级：{难度等级}。知识点：\n{知识点}',
  },
  {
    title: '头脑风暴助手',
    category: 'creative',
    description: '激发创意灵感',
    content:
      '你是一位富有创造力的头脑风暴引导者。针对 "{主题}"，请：1) 提出至少10个不同角度的想法 2) 按类别分组整理 3) 选出3个最有潜力的方向并说明理由。',
  },
  {
    title: 'LOGO 设计思路',
    category: 'creative',
    description: '品牌视觉创意',
    content:
      '你是一位资深品牌设计师。请为 "{品牌名称}" 设计一套 LOGO 创意思路：1) 品牌核心价值提炼 2) 3种不同风格的视觉方向 3) 色彩方案建议 4) 字体搭配建议 5) 使用场景说明。品牌调性：{品牌调性}',
  },
  {
    title: '产品创新构思',
    category: 'creative',
    description: '从0到1产品创意',
    content:
      '你是一位产品创新顾问。请围绕 "{领域}" 提出5个创新产品点子，每个点子需包含：1) 目标用户 2) 核心痛点 3) 解决方案 4) 差异化亮点 5) 商业化潜力评估。',
  },
  {
    title: '商业计划书大纲',
    category: 'business',
    description: '专业 BP 结构输出',
    content:
      '请为 "{项目名称}" 生成一份商业计划书大纲，包含：1) 项目概述 2) 市场分析 3) 产品/服务 4) 商业模式 5) 竞争分析 6) 运营计划 7) 团队介绍 8) 财务预测 9) 融资需求。',
  },
  {
    title: '邮件写作助手',
    category: 'business',
    description: '商务邮件专业撰写',
    content:
      '请帮我撰写一封专业的{邮件类型}邮件，收件人：{收件人}，主题：{主题}。要求：1) 语气恰当 2) 结构清晰 3) 目的明确 4) 结尾有明确的下一步行动。',
  },
  {
    title: '写实风格图像',
    category: 'image',
    description: '逼真摄影风格',
    content:
      'photorealistic, hyper-detailed, 8k, professional photography, natural lighting, shallow depth of field, award-winning photo, {主题描述}, --ar 16:9 --v 6',
  },
  {
    title: '奇幻风格插画',
    category: 'image',
    description: '魔幻艺术风格',
    content:
      'fantasy art, magical atmosphere, epic composition, vibrant colors, highly detailed, digital painting, concept art, style of Ruan Jia and Artgerm, {主题描述}, --ar 3:4 --v 6',
  },
  {
    title: '赛博朋克风格',
    category: 'image',
    description: '未来霓虹都市',
    content:
      'cyberpunk style, neon lights, futuristic cityscape, rain, reflections, high contrast, cinematic lighting, blade runner aesthetic, {主题描述}, --ar 21:9 --v 6',
  },
  {
    title: '极简主义设计',
    category: 'image',
    description: '简约几何美学',
    content:
      'minimalist design, clean composition, limited color palette, negative space, geometric shapes, flat design, modern aesthetic, {主题描述}, --ar 1:1 --v 6',
  },
  {
    title: '二次元动漫风格',
    category: 'image',
    description: '日式动漫美学',
    content:
      'anime style, cel shading, vibrant colors, expressive characters, detailed background, studio ghibli inspired, {主题描述}, --ar 3:4 --niji 6',
  },
]

const STORAGE_KEY = 'weblinux-ai-prompt-library-v2'

interface ParsedVariable {
  name: string
  label: string
  defaultValue: string
}

function parseVariables(content: string): ParsedVariable[] {
  const regex = /\{([^}]+)\}/g
  const seen = new Set<string>()
  const result: ParsedVariable[] = []
  let match: RegExpExecArray | null
  while ((match = regex.exec(content)) !== null) {
    const raw = match[1].trim()
    const name = raw.split('|')[0].trim()
    if (!seen.has(name)) {
      seen.add(name)
      const label = raw.split('|')[1]?.trim() || name
      result.push({ name, label, defaultValue: '' })
    }
  }
  return result
}

function fillTemplate(content: string, values: Record<string, string>): string {
  return content.replace(/\{([^}]+)\}/g, (_, raw: string) => {
    const name = raw.split('|')[0].trim()
    return values[name] ?? `[${name}]`
  })
}

function highlightVariables(content: string) {
  const regex = /\{([^}]+)\}/g
  const parts: Array<{ text: string; isVar: boolean }> = []
  let lastIndex = 0
  let match: RegExpExecArray | null
  while ((match = regex.exec(content)) !== null) {
    if (match.index > lastIndex) {
      parts.push({ text: content.slice(lastIndex, match.index), isVar: false })
    }
    parts.push({ text: match[0], isVar: true })
    lastIndex = match.index + match[0].length
  }
  if (lastIndex < content.length) {
    parts.push({ text: content.slice(lastIndex), isVar: false })
  }
  return parts
}

function loadCustomPrompts(): Prompt[] {
  try {
    const saved = localStorage.getItem(STORAGE_KEY)
    if (!saved) return []
    const parsed = JSON.parse(saved)
    if (Array.isArray(parsed)) return parsed as Prompt[]
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
    description: p.description,
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
  const [showCustom, setShowCustom] = useState(false)
  const [showAddModal, setShowAddModal] = useState(false)
  const [editingPrompt, setEditingPrompt] = useState<Prompt | null>(null)
  const [previewPrompt, setPreviewPrompt] = useState<Prompt | null>(null)
  const [previewValues, setPreviewValues] = useState<Record<string, string>>({})
  const [newTitle, setNewTitle] = useState('')
  const [newContent, setNewContent] = useState('')
  const [newDescription, setNewDescription] = useState('')
  const [newCategory, setNewCategory] = useState('code')
  const [copiedId, setCopiedId] = useState<string | null>(null)
  const [expandedId, setExpandedId] = useState<string | null>(null)
  const [toast, setToast] = useState<{ msg: string; type: 'success' | 'error' } | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    saveCustomPrompts(customPrompts)
    setPrompts(buildInitialPrompts(customPrompts))
  }, [customPrompts])

  useEffect(() => {
    if (!toast) return
    const t = setTimeout(() => setToast(null), 2200)
    return () => clearTimeout(t)
  }, [toast])

  const showToast = (msg: string, type: 'success' | 'error' = 'success') => {
    setToast({ msg, type })
  }

  const filteredPrompts = useMemo(() => {
    let result = prompts

    if (activeCategory !== 'all') {
      result = result.filter((p) => p.category === activeCategory)
    }
    if (showFavorites) {
      result = result.filter((p) => p.isFavorite)
    }
    if (showCustom) {
      result = result.filter((p) => p.isCustom)
    }
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase().trim()
      result = result.filter(
        (p) =>
          p.title.toLowerCase().includes(query) ||
          p.content.toLowerCase().includes(query) ||
          (p.description || '').toLowerCase().includes(query) ||
          p.category.toLowerCase().includes(query),
      )
    }

    return result.sort((a, b) => {
      if (a.isFavorite !== b.isFavorite) return a.isFavorite ? -1 : 1
      return b.createdAt - a.createdAt
    })
  }, [prompts, activeCategory, showFavorites, showCustom, searchQuery])

  const categoryCount = useMemo(() => {
    const counts: Record<string, number> = { all: prompts.length, custom: prompts.filter((p) => p.isCustom).length }
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
      showToast('已复制到剪贴板')
      setTimeout(() => setCopiedId((cur) => (cur === id ? null : cur)), 1500)
    } catch (err) {
      console.warn('复制失败:', err)
      showToast('复制失败', 'error')
    }
  }

  const handleUseTemplate = (prompt: Prompt) => {
    const variables = parseVariables(prompt.content)
    if (variables.length === 0) {
      copyToClipboard(prompt.content, prompt.id)
      return
    }
    setPreviewPrompt(prompt)
    setPreviewValues({})
  }

  const handlePreviewCopy = () => {
    if (!previewPrompt) return
    const filled = fillTemplate(previewPrompt.content, previewValues)
    copyToClipboard(filled, `preview-${previewPrompt.id}`)
  }

  const toggleFavorite = (id: string) => {
    const target = prompts.find((p) => p.id === id)
    if (!target) return

    const updated: Prompt = { ...target, isFavorite: !target.isFavorite }

    if (target.isCustom) {
      setCustomPrompts((prev) => prev.map((p) => (p.id === id ? updated : p)))
    } else {
      setPrompts((prev) => prev.map((p) => (p.id === id ? updated : p)))
      setCustomPrompts((prev) => {
        const exists = prev.some((p) => p.id === id)
        if (exists) return prev.map((p) => (p.id === id ? updated : p))
        return [...prev, updated]
      })
    }
  }

  const deleteCustomPrompt = (id: string) => {
    setCustomPrompts((prev) => prev.filter((p) => p.id !== id))
    showToast('已删除')
  }

  const resetModal = () => {
    setNewTitle('')
    setNewContent('')
    setNewDescription('')
    setNewCategory('code')
    setShowAddModal(false)
    setEditingPrompt(null)
  }

  const openAddModal = () => {
    setEditingPrompt(null)
    setShowAddModal(true)
  }

  const openEditModal = (prompt: Prompt) => {
    setEditingPrompt(prompt)
    setNewTitle(prompt.title)
    setNewContent(prompt.content)
    setNewDescription(prompt.description || '')
    setNewCategory(prompt.category)
    setShowAddModal(true)
  }

  const savePrompt = () => {
    if (!newTitle.trim() || !newContent.trim()) return
    if (editingPrompt) {
      setCustomPrompts((prev) => {
        const exists = prev.some((p) => p.id === editingPrompt.id)
        const updated: Prompt = {
          ...editingPrompt,
          title: newTitle.trim(),
          content: newContent.trim(),
          description: newDescription.trim() || undefined,
          category: newCategory,
        }
        if (exists) return prev.map((p) => (p.id === editingPrompt.id ? updated : p))
        return [...prev, updated]
      })
      showToast('保存成功')
    } else {
      const newPrompt: Prompt = {
        id: `custom-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        title: newTitle.trim(),
        content: newContent.trim(),
        description: newDescription.trim() || undefined,
        category: newCategory,
        isFavorite: false,
        isCustom: true,
        createdAt: Date.now(),
      }
      setCustomPrompts((prev) => [newPrompt, ...prev])
      showToast('添加成功')
    }
    resetModal()
  }

  const handleExport = () => {
    try {
      const exportData = {
        version: 1,
        exportedAt: new Date().toISOString(),
        prompts: customPrompts,
      }
      const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' })
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `ai-prompt-library-${Date.now()}.json`
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      URL.revokeObjectURL(url)
      showToast('导出成功')
    } catch (err) {
      console.warn('导出失败:', err)
      showToast('导出失败', 'error')
    }
  }

  const handleImport = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    e.target.value = ''
    if (!file) return
    const reader = new FileReader()
    reader.onload = (event) => {
      try {
        const text = event.target?.result as string
        const data = JSON.parse(text)
        let imported: Prompt[] = []
        if (Array.isArray(data)) {
          imported = data
        } else if (data.prompts && Array.isArray(data.prompts)) {
          imported = data.prompts
        } else {
          throw new Error('无效格式')
        }
        imported = imported
          .filter((p) => p && p.title && p.content)
          .map((p) => ({
            id: p.id || `imported-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
            title: p.title,
            content: p.content,
            description: p.description,
            category: p.category || 'creative',
            isFavorite: !!p.isFavorite,
            isCustom: true,
            createdAt: p.createdAt || Date.now(),
          }))
        setCustomPrompts((prev) => {
          const existingIds = new Set(prev.map((p) => p.id))
          const merged = [...prev]
          for (const imp of imported) {
            if (!existingIds.has(imp.id)) merged.push(imp)
          }
          return merged
        })
        showToast(`已导入 ${imported.length} 条`)
      } catch (err) {
        console.warn('导入失败:', err)
        showToast('导入失败', 'error')
      }
    }
    reader.onerror = () => showToast('读取文件失败', 'error')
    reader.readAsText(file)
  }

  const getCategoryName = (key: string) => {
    const cat = CATEGORIES.find((c) => c.key === key)
    return cat ? cat.name : key
  }

  const getCategoryColor = (key: string) => {
    const cat = CATEGORIES.find((c) => c.key === key)
    return cat ? cat.color : '#6366f1'
  }

  const cardBg = isDark ? 'rgba(255,255,255,0.04)' : 'rgba(255,255,255,0.65)'
  const cardBorder = isDark ? 'rgba(255,255,255,0.1)' : 'rgba(15,23,42,0.08)'

  const headerGlass = isDark
    ? 'linear-gradient(135deg, rgba(30,30,40,0.75) 0%, rgba(20,20,28,0.55) 100%)'
    : 'linear-gradient(135deg, rgba(255,255,255,0.85) 0%, rgba(247,247,252,0.7) 100%)'

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
        position: 'relative',
      }}
    >
      <div
        style={{
          padding: '16px',
          borderBottom: `1px solid ${cardBorder}`,
          background: headerGlass,
          backdropFilter: 'blur(18px)',
          WebkitBackdropFilter: 'blur(18px)',
        }}
      >
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            marginBottom: '12px',
            flexWrap: 'wrap',
          }}
        >
          <div style={{ flex: 1, position: 'relative', minWidth: '180px' }}>
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
              placeholder="搜索提示词 / 分类 / 描述..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              style={{
                width: '100%',
                padding: '9px 12px 9px 36px',
                borderRadius: '10px',
                border: `1px solid ${cardBorder}`,
                background: isDark ? 'rgba(255,255,255,0.05)' : 'rgba(255,255,255,0.8)',
                color: 'var(--titlebar-text)',
                outline: 'none',
                fontSize: '13px',
                boxSizing: 'border-box',
                backdropFilter: 'blur(8px)',
                transition: 'border-color 0.2s, box-shadow 0.2s',
              }}
              onFocus={(e) => {
                e.currentTarget.style.borderColor = 'var(--accent)'
                e.currentTarget.style.boxShadow = '0 0 0 3px rgba(99,102,241,0.15)'
              }}
              onBlur={(e) => {
                e.currentTarget.style.borderColor = cardBorder
                e.currentTarget.style.boxShadow = 'none'
              }}
            />
          </div>
          <div style={{ display: 'flex', gap: '6px' }}>
            <input
              ref={fileInputRef}
              type="file"
              accept="application/json"
              style={{ display: 'none' }}
              onChange={handleImport}
            />
            <button
              onClick={() => fileInputRef.current?.click()}
              title="导入 JSON"
              style={{
                padding: '8px 10px',
                borderRadius: '10px',
                border: `1px solid ${cardBorder}`,
                background: isDark ? 'rgba(255,255,255,0.05)' : 'rgba(255,255,255,0.8)',
                color: 'var(--titlebar-text)',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '4px',
                fontSize: '13px',
                transition: 'all 0.2s',
              }}
            >
              <Upload size={15} />
            </button>
            <button
              onClick={handleExport}
              title="导出 JSON"
              style={{
                padding: '8px 10px',
                borderRadius: '10px',
                border: `1px solid ${cardBorder}`,
                background: isDark ? 'rgba(255,255,255,0.05)' : 'rgba(255,255,255,0.8)',
                color: 'var(--titlebar-text)',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '4px',
                fontSize: '13px',
                transition: 'all 0.2s',
              }}
            >
              <Download size={15} />
            </button>
            <button
              onClick={openAddModal}
              style={{
                padding: '8px 14px',
                borderRadius: '10px',
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
                boxShadow: '0 4px 14px rgba(99,102,241,0.35)',
              }}
            >
              <Plus size={15} />
              新建
            </button>
          </div>
        </div>

        <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
          {CATEGORIES.map((cat) => {
            const Icon = cat.icon
            const isActive = activeCategory === cat.key && !showFavorites && !showCustom
            return (
              <button
                key={cat.key}
                onClick={() => {
                  setActiveCategory(cat.key)
                  setShowFavorites(false)
                  setShowCustom(false)
                }}
                style={{
                  padding: '6px 12px',
                  borderRadius: '20px',
                  border: isActive ? 'none' : `1px solid ${cardBorder}`,
                  background: isActive ? cat.color : isDark ? 'rgba(255,255,255,0.05)' : 'rgba(255,255,255,0.8)',
                  color: isActive ? 'white' : 'var(--titlebar-text)',
                  cursor: 'pointer',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '6px',
                  fontSize: '12px',
                  transition: 'all 0.2s',
                  fontWeight: isActive ? 500 : 400,
                }}
              >
                <Icon size={13} />
                {cat.name}
                <span
                  style={{
                    fontSize: '10px',
                    opacity: 0.75,
                    padding: '1px 6px',
                    borderRadius: '10px',
                    background: isActive ? 'rgba(255,255,255,0.22)' : 'rgba(128,128,128,0.18)',
                  }}
                >
                  {categoryCount[cat.key] || 0}
                </span>
              </button>
            )
          })}
          <button
            onClick={() => {
              setShowFavorites((v) => !v)
              setShowCustom(false)
              setActiveCategory('all')
            }}
            style={{
              padding: '6px 12px',
              borderRadius: '20px',
              border: showFavorites ? 'none' : `1px solid ${cardBorder}`,
              background: showFavorites ? '#f59e0b' : isDark ? 'rgba(255,255,255,0.05)' : 'rgba(255,255,255,0.8)',
              color: showFavorites ? 'white' : 'var(--titlebar-text)',
              cursor: 'pointer',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              fontSize: '12px',
              transition: 'all 0.2s',
            }}
          >
            <Star size={13} fill={showFavorites ? 'currentColor' : 'none'} />
            收藏 ({favoriteCount})
          </button>
          <button
            onClick={() => {
              setShowCustom((v) => !v)
              setShowFavorites(false)
              setActiveCategory('all')
            }}
            style={{
              padding: '6px 12px',
              borderRadius: '20px',
              border: showCustom ? 'none' : `1px solid ${cardBorder}`,
              background: showCustom ? '#10b981' : isDark ? 'rgba(255,255,255,0.05)' : 'rgba(255,255,255,0.8)',
              color: showCustom ? 'white' : 'var(--titlebar-text)',
              cursor: 'pointer',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              fontSize: '12px',
              transition: 'all 0.2s',
            }}
          >
            <Wand2 size={13} />
            自定义 ({categoryCount.custom || 0})
          </button>
        </div>
      </div>

      <div
        style={{
          flex: 1,
          overflow: 'auto',
          padding: '16px',
          background: isDark
            ? 'radial-gradient(ellipse at top, rgba(99,102,241,0.08), transparent 60%)'
            : 'radial-gradient(ellipse at top, rgba(99,102,241,0.06), transparent 60%)',
        }}
      >
        {filteredPrompts.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '60px 20px', opacity: 0.5 }}>
            <BookOpen size={48} style={{ margin: '0 auto 16px', opacity: 0.3 }} />
            <p style={{ fontSize: '15px', fontWeight: 500, marginBottom: '6px' }}>没有找到匹配的提示词</p>
            <p style={{ fontSize: '12px' }}>
              {searchQuery ? '尝试更换搜索关键词' : '点击右上角"新建"按钮创建自定义模板'}
            </p>
          </div>
        ) : (
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))',
              gap: '14px',
            }}
          >
            {filteredPrompts.map((prompt) => {
              const isExpanded = expandedId === prompt.id
              const isCopied = copiedId === prompt.id
              const variables = parseVariables(prompt.content)
              const categoryColor = getCategoryColor(prompt.category)
              const parts = highlightVariables(prompt.content)
              return (
                <div
                  key={prompt.id}
                  style={{
                    background: cardBg,
                    border: `1px solid ${cardBorder}`,
                    borderRadius: '14px',
                    padding: '16px',
                    display: 'flex',
                    flexDirection: 'column',
                    transition: 'all 0.25s ease',
                    position: 'relative',
                    backdropFilter: 'blur(14px)',
                    WebkitBackdropFilter: 'blur(14px)',
                    boxShadow: isDark
                      ? '0 4px 20px rgba(0,0,0,0.3)'
                      : '0 4px 20px rgba(15,23,42,0.06)',
                    overflow: 'hidden',
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.transform = 'translateY(-2px)'
                    e.currentTarget.style.boxShadow = isDark
                      ? '0 10px 30px rgba(0,0,0,0.45)'
                      : '0 10px 30px rgba(15,23,42,0.1)'
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.transform = 'translateY(0)'
                    e.currentTarget.style.boxShadow = isDark
                      ? '0 4px 20px rgba(0,0,0,0.3)'
                      : '0 4px 20px rgba(15,23,42,0.06)'
                  }}
                >
                  <div
                    style={{
                      position: 'absolute',
                      top: 0,
                      left: 0,
                      right: 0,
                      height: '2px',
                      background: `linear-gradient(90deg, ${categoryColor}, transparent)`,
                      opacity: 0.7,
                    }}
                  />
                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'flex-start',
                      justifyContent: 'space-between',
                      marginBottom: '8px',
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
                    <div style={{ display: 'flex', gap: '2px', flexShrink: 0 }}>
                      <button
                        onClick={() => toggleFavorite(prompt.id)}
                        title={prompt.isFavorite ? '取消收藏' : '收藏'}
                        style={{
                          padding: '5px',
                          borderRadius: '6px',
                          border: 'none',
                          background: 'transparent',
                          cursor: 'pointer',
                          color: prompt.isFavorite ? '#f59e0b' : 'var(--titlebar-text)',
                          opacity: prompt.isFavorite ? 1 : 0.5,
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          transition: 'all 0.2s',
                        }}
                      >
                        <Star size={14} fill={prompt.isFavorite ? 'currentColor' : 'none'} />
                      </button>
                      {prompt.isCustom && (
                        <>
                          <button
                            onClick={() => openEditModal(prompt)}
                            title="编辑"
                            style={{
                              padding: '5px',
                              borderRadius: '6px',
                              border: 'none',
                              background: 'transparent',
                              cursor: 'pointer',
                              color: 'var(--titlebar-text)',
                              opacity: 0.5,
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              transition: 'opacity 0.2s',
                            }}
                          >
                            <Edit3 size={14} />
                          </button>
                          <button
                            onClick={() => deleteCustomPrompt(prompt.id)}
                            title="删除"
                            style={{
                              padding: '5px',
                              borderRadius: '6px',
                              border: 'none',
                              background: 'transparent',
                              cursor: 'pointer',
                              color: '#ef4444',
                              opacity: 0.5,
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              transition: 'opacity 0.2s',
                            }}
                          >
                            <Trash2 size={14} />
                          </button>
                        </>
                      )}
                    </div>
                  </div>

                  {prompt.description && (
                    <p
                      style={{
                        margin: 0,
                        fontSize: '12px',
                        color: 'var(--titlebar-text)',
                        opacity: 0.6,
                        marginBottom: '8px',
                        lineHeight: 1.5,
                      }}
                    >
                      {prompt.description}
                    </p>
                  )}

                  <div style={{ display: 'flex', gap: '6px', marginBottom: '10px', flexWrap: 'wrap' }}>
                    <span
                      style={{
                        padding: '2px 9px',
                        borderRadius: '10px',
                        background: `${categoryColor}22`,
                        color: categoryColor,
                        fontSize: '11px',
                        fontWeight: 500,
                        border: `1px solid ${categoryColor}33`,
                      }}
                    >
                      {getCategoryName(prompt.category)}
                    </span>
                    {variables.length > 0 && (
                      <span
                        style={{
                          padding: '2px 9px',
                          borderRadius: '10px',
                          background: isDark ? 'rgba(139,92,246,0.2)' : 'rgba(139,92,246,0.12)',
                          color: isDark ? '#c4b5fd' : '#7c3aed',
                          fontSize: '11px',
                          fontWeight: 500,
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '3px',
                        }}
                      >
                        <Wand2 size={10} />
                        {variables.length} 个变量
                      </span>
                    )}
                    {prompt.isCustom && (
                      <span
                        style={{
                          padding: '2px 9px',
                          borderRadius: '10px',
                          background: isDark ? 'rgba(16,185,129,0.2)' : 'rgba(16,185,129,0.12)',
                          color: isDark ? '#6ee7b7' : '#059669',
                          fontSize: '11px',
                          fontWeight: 500,
                        }}
                      >
                        自定义
                      </span>
                    )}
                  </div>

                  <div
                    style={{
                      fontSize: '12px',
                      lineHeight: 1.65,
                      color: 'var(--titlebar-text)',
                      opacity: 0.82,
                      marginBottom: '12px',
                      wordBreak: 'break-word',
                      position: 'relative',
                      maxHeight: isExpanded ? 'none' : '110px',
                      overflow: isExpanded ? 'visible' : 'hidden',
                      flex: 1,
                    }}
                  >
                    {parts.map((part, i) =>
                      part.isVar ? (
                        <span
                          key={i}
                          style={{
                            background: isDark ? 'rgba(139,92,246,0.25)' : 'rgba(139,92,246,0.12)',
                            color: isDark ? '#c4b5fd' : '#7c3aed',
                            padding: '0 4px',
                            borderRadius: '4px',
                            fontWeight: 500,
                            fontSize: '11.5px',
                          }}
                        >
                          {part.text}
                        </span>
                      ) : (
                        <span key={i}>{part.text}</span>
                      ),
                    )}
                    {!isExpanded && prompt.content.length > 200 && (
                      <div
                        style={{
                          position: 'absolute',
                          bottom: 0,
                          left: 0,
                          right: 0,
                          height: '36px',
                          background: `linear-gradient(to bottom, transparent, ${isDark ? 'rgba(30,30,38,0.95)' : 'rgba(255,255,255,0.92)'})`,
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
                    {prompt.content.length > 200 && (
                      <button
                        onClick={() => setExpandedId(isExpanded ? null : prompt.id)}
                        style={{
                          padding: '6px 10px',
                          borderRadius: '8px',
                          border: `1px solid ${cardBorder}`,
                          background: isDark ? 'rgba(255,255,255,0.04)' : 'rgba(255,255,255,0.7)',
                          color: 'var(--titlebar-text)',
                          cursor: 'pointer',
                          fontSize: '12px',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '4px',
                          transition: 'all 0.2s',
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
                      onClick={() => setPreviewPrompt(prompt)}
                      style={{
                        padding: '6px 10px',
                        borderRadius: '8px',
                        border: `1px solid ${cardBorder}`,
                        background: isDark ? 'rgba(255,255,255,0.04)' : 'rgba(255,255,255,0.7)',
                        color: 'var(--titlebar-text)',
                        cursor: 'pointer',
                        fontSize: '12px',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '4px',
                        transition: 'all 0.2s',
                      }}
                    >
                      <Eye size={12} />
                      预览
                    </button>
                    <button
                      onClick={() => handleUseTemplate(prompt)}
                      style={{
                        padding: '6px 14px',
                        borderRadius: '8px',
                        border: 'none',
                        background: isCopied ? '#10b981' : 'var(--accent)',
                        color: 'white',
                        cursor: 'pointer',
                        fontSize: '12px',
                        fontWeight: '500',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '5px',
                        marginLeft: 'auto',
                        transition: 'all 0.2s',
                        boxShadow: '0 2px 8px rgba(99,102,241,0.3)',
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
                          {variables.length > 0 ? '使用模板' : '一键复制'}
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

      {previewPrompt && (
        <Modal onClose={() => setPreviewPrompt(null)} isDark={isDark} title={previewPrompt.title}>
          <div style={{ marginBottom: '14px' }}>
            {previewPrompt.description && (
              <p style={{ margin: '0 0 10px', fontSize: '13px', opacity: 0.7, lineHeight: 1.6 }}>
                {previewPrompt.description}
              </p>
            )}
            {(() => {
              const variables = parseVariables(previewPrompt.content)
              if (variables.length === 0) {
                return (
                  <div
                    style={{
                      padding: '12px',
                      borderRadius: '10px',
                      background: isDark ? 'rgba(255,255,255,0.04)' : 'rgba(15,23,42,0.04)',
                      fontSize: '13px',
                      lineHeight: 1.7,
                      whiteSpace: 'pre-wrap',
                      maxHeight: '280px',
                      overflow: 'auto',
                    }}
                  >
                    {previewPrompt.content}
                  </div>
                )
              }
              return (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                  <div
                    style={{
                      fontSize: '12px',
                      opacity: 0.65,
                      marginBottom: '4px',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '6px',
                    }}
                  >
                    <Wand2 size={13} />
                    模板包含 {variables.length} 个变量，请填写后使用
                  </div>
                  {variables.map((v) => (
                    <div key={v.name}>
                      <label
                        style={{
                          display: 'block',
                          fontSize: '12px',
                          marginBottom: '4px',
                          opacity: 0.75,
                          fontWeight: 500,
                        }}
                      >
                        {v.label}
                      </label>
                      <input
                        type="text"
                        placeholder={`请输入 ${v.label}`}
                        value={previewValues[v.name] || ''}
                        onChange={(e) =>
                          setPreviewValues((prev) => ({ ...prev, [v.name]: e.target.value }))
                        }
                        style={{
                          width: '100%',
                          padding: '9px 12px',
                          borderRadius: '8px',
                          border: `1px solid ${isDark ? 'rgba(255,255,255,0.1)' : 'rgba(15,23,42,0.1)'}`,
                          background: isDark ? 'rgba(255,255,255,0.05)' : 'rgba(255,255,255,0.7)',
                          color: 'var(--titlebar-text)',
                          fontSize: '13px',
                          outline: 'none',
                          boxSizing: 'border-box',
                        }}
                      />
                    </div>
                  ))}
                  <div style={{ marginTop: '10px' }}>
                    <div
                      style={{
                        fontSize: '12px',
                        opacity: 0.7,
                        marginBottom: '6px',
                        fontWeight: 500,
                      }}
                    >
                      预览效果
                    </div>
                    <div
                      style={{
                        padding: '12px',
                        borderRadius: '10px',
                        background: isDark ? 'rgba(255,255,255,0.04)' : 'rgba(15,23,42,0.04)',
                        fontSize: '13px',
                        lineHeight: 1.7,
                        whiteSpace: 'pre-wrap',
                        maxHeight: '220px',
                        overflow: 'auto',
                        border: `1px dashed ${isDark ? 'rgba(255,255,255,0.1)' : 'rgba(15,23,42,0.1)'}`,
                      }}
                    >
                      {(() => {
                        const filled = fillTemplate(previewPrompt.content, previewValues)
                        const parts = highlightVariables(filled)
                        return parts.map((part, i) =>
                          part.isVar ? (
                            <span
                              key={i}
                              style={{
                                background: isDark ? 'rgba(239,68,68,0.2)' : 'rgba(239,68,68,0.1)',
                                color: isDark ? '#fca5a5' : '#dc2626',
                                padding: '0 4px',
                                borderRadius: '4px',
                                fontWeight: 500,
                              }}
                            >
                              {part.text}
                            </span>
                          ) : (
                            <span key={i}>{part.text}</span>
                          ),
                        )
                      })()}
                    </div>
                  </div>
                </div>
              )
            })()}
          </div>
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px' }}>
            <button
              onClick={() => setPreviewPrompt(null)}
              style={{
                padding: '8px 16px',
                borderRadius: '8px',
                border: `1px solid ${isDark ? 'rgba(255,255,255,0.1)' : 'rgba(15,23,42,0.1)'}`,
                background: isDark ? 'rgba(255,255,255,0.05)' : 'rgba(255,255,255,0.7)',
                color: 'var(--titlebar-text)',
                cursor: 'pointer',
                fontSize: '13px',
              }}
            >
              关闭
            </button>
            <button
              onClick={handlePreviewCopy}
              style={{
                padding: '8px 20px',
                borderRadius: '8px',
                border: 'none',
                background: 'var(--accent)',
                color: 'white',
                cursor: 'pointer',
                fontSize: '13px',
                fontWeight: '500',
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                boxShadow: '0 4px 14px rgba(99,102,241,0.35)',
              }}
            >
              <Copy size={14} />
              复制结果
            </button>
          </div>
        </Modal>
      )}

      {showAddModal && (
        <Modal onClose={resetModal} isDark={isDark} title={editingPrompt ? '编辑提示词' : '新建自定义提示词'}>
          <div style={{ marginBottom: '14px' }}>
            <label style={modalLabelStyle(isDark)}>标题</label>
            <input
              type="text"
              placeholder="为你的提示词起个名字..."
              value={newTitle}
              onChange={(e) => setNewTitle(e.target.value)}
              style={modalInputStyle(isDark)}
            />
          </div>
          <div style={{ marginBottom: '14px' }}>
            <label style={modalLabelStyle(isDark)}>分类</label>
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
                      borderRadius: '8px',
                      border: active ? 'none' : `1px solid ${isDark ? 'rgba(255,255,255,0.1)' : 'rgba(15,23,42,0.1)'}`,
                      background: active ? cat.color : isDark ? 'rgba(255,255,255,0.05)' : 'rgba(255,255,255,0.7)',
                      color: active ? 'white' : 'var(--titlebar-text)',
                      cursor: 'pointer',
                      fontSize: '12px',
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '5px',
                      transition: 'all 0.2s',
                    }}
                  >
                    <Icon size={12} />
                    {cat.name}
                  </button>
                )
              })}
            </div>
          </div>
          <div style={{ marginBottom: '14px' }}>
            <label style={modalLabelStyle(isDark)}>描述（可选）</label>
            <input
              type="text"
              placeholder="简短描述这个提示词的用途..."
              value={newDescription}
              onChange={(e) => setNewDescription(e.target.value)}
              style={modalInputStyle(isDark)}
            />
          </div>
          <div style={{ marginBottom: '16px' }}>
            <label style={modalLabelStyle(isDark)}>
              提示词内容 <span style={{ opacity: 0.6, fontWeight: 400 }}>（使用 {'{变量名}'} 标记可替换部分）</span>
            </label>
            <textarea
              placeholder="示例：请将 {原文} 翻译为 {目标语言}..."
              value={newContent}
              onChange={(e) => setNewContent(e.target.value)}
              rows={8}
              style={{
                ...modalInputStyle(isDark),
                resize: 'vertical',
                fontFamily: 'inherit',
                lineHeight: 1.6,
              }}
            />
          </div>
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px' }}>
            <button
              onClick={resetModal}
              style={{
                padding: '8px 16px',
                borderRadius: '8px',
                border: `1px solid ${isDark ? 'rgba(255,255,255,0.1)' : 'rgba(15,23,42,0.1)'}`,
                background: isDark ? 'rgba(255,255,255,0.05)' : 'rgba(255,255,255,0.7)',
                color: 'var(--titlebar-text)',
                cursor: 'pointer',
                fontSize: '13px',
              }}
            >
              取消
            </button>
            <button
              onClick={savePrompt}
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
                boxShadow:
                  newTitle.trim() && newContent.trim() ? '0 4px 14px rgba(99,102,241,0.35)' : 'none',
              }}
            >
              {editingPrompt ? '保存修改' : '创建'}
            </button>
          </div>
        </Modal>
      )}

      {toast && (
        <div
          style={{
            position: 'absolute',
            bottom: '24px',
            left: '50%',
            transform: 'translateX(-50%)',
            padding: '10px 20px',
            borderRadius: '10px',
            background:
              toast.type === 'success'
                ? isDark
                  ? 'rgba(16,185,129,0.9)'
                  : 'rgba(16,185,129,0.95)'
                : isDark
                  ? 'rgba(239,68,68,0.9)'
                  : 'rgba(239,68,68,0.95)',
            color: 'white',
            fontSize: '13px',
            fontWeight: 500,
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            boxShadow: '0 8px 30px rgba(0,0,0,0.25)',
            backdropFilter: 'blur(10px)',
            zIndex: 100,
            animation: 'fadeInUp 0.25s ease',
          }}
        >
          {toast.type === 'success' ? <Check size={15} /> : <X size={15} />}
          {toast.msg}
        </div>
      )}

      <style>{`
        @keyframes fadeInUp {
          from { opacity: 0; transform: translate(-50%, 10px); }
          to { opacity: 1; transform: translate(-50%, 0); }
        }
        ::-webkit-scrollbar { width: 8px; height: 8px; }
        ::-webkit-scrollbar-track { background: transparent; }
        ::-webkit-scrollbar-thumb {
          background: ${isDark ? 'rgba(255,255,255,0.15)' : 'rgba(15,23,42,0.15)'};
          border-radius: 4px;
        }
        ::-webkit-scrollbar-thumb:hover {
          background: ${isDark ? 'rgba(255,255,255,0.25)' : 'rgba(15,23,42,0.25)'};
        }
      `}</style>
    </div>
  )
})

function Modal({
  children,
  onClose,
  isDark,
  title,
}: {
  children: ReactNode
  onClose: () => void
  isDark: boolean
  title: string
}) {
  return (
    <div
      style={{
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        background: isDark ? 'rgba(0,0,0,0.55)' : 'rgba(15,23,42,0.45)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 20,
        padding: '20px',
        backdropFilter: 'blur(6px)',
        WebkitBackdropFilter: 'blur(6px)',
        animation: 'fadeInUp 0.2s ease',
      }}
      onClick={onClose}
    >
      <div
        style={{
          background: isDark ? 'rgba(30,30,38,0.95)' : 'rgba(255,255,255,0.98)',
          borderRadius: '16px',
          width: '100%',
          maxWidth: '560px',
          maxHeight: '85vh',
          border: `1px solid ${isDark ? 'rgba(255,255,255,0.1)' : 'rgba(15,23,42,0.08)'}`,
          overflow: 'hidden',
          boxShadow: isDark
            ? '0 20px 60px rgba(0,0,0,0.6)'
            : '0 20px 60px rgba(15,23,42,0.25)',
          backdropFilter: 'blur(20px)',
          WebkitBackdropFilter: 'blur(20px)',
          display: 'flex',
          flexDirection: 'column',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <div
          style={{
            padding: '16px 20px',
            borderBottom: `1px solid ${isDark ? 'rgba(255,255,255,0.08)' : 'rgba(15,23,42,0.08)'}`,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
          }}
        >
          <h2 style={{ margin: 0, fontSize: '16px', fontWeight: '600', color: 'var(--titlebar-text)' }}>
            {title}
          </h2>
          <button
            onClick={onClose}
            style={{
              padding: '5px',
              borderRadius: '8px',
              border: 'none',
              background: 'transparent',
              cursor: 'pointer',
              color: 'var(--titlebar-text)',
              opacity: 0.6,
              display: 'flex',
              transition: 'all 0.2s',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.opacity = '1'
              e.currentTarget.style.background = isDark ? 'rgba(255,255,255,0.08)' : 'rgba(15,23,42,0.05)'
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.opacity = '0.6'
              e.currentTarget.style.background = 'transparent'
            }}
          >
            <X size={18} />
          </button>
        </div>
        <div style={{ padding: '20px', overflow: 'auto', flex: 1 }}>{children}</div>
      </div>
    </div>
  )
}

function modalLabelStyle(isDark: boolean): CSSProperties {
  return {
    display: 'block',
    marginBottom: '6px',
    fontSize: '12px',
    color: isDark ? 'rgba(255,255,255,0.75)' : 'rgba(15,23,42,0.75)',
    opacity: 0.75,
    fontWeight: 500,
  }
}

function modalInputStyle(isDark: boolean): CSSProperties {
  return {
    width: '100%',
    padding: '10px 12px',
    borderRadius: '10px',
    border: `1px solid ${isDark ? 'rgba(255,255,255,0.1)' : 'rgba(15,23,42,0.1)'}`,
    background: isDark ? 'rgba(255,255,255,0.05)' : 'rgba(255,255,255,0.7)',
    color: 'var(--titlebar-text)',
    fontSize: '13px',
    outline: 'none',
    boxSizing: 'border-box',
    transition: 'border-color 0.2s, box-shadow 0.2s',
  }
}