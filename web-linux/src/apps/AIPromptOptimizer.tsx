import { useState, useEffect, useMemo, useCallback, memo } from 'react'
import {
  Sparkles,
  Copy,
  Download,
  Star,
  Trash2,
  Check,
  X,
  Eye,
  Zap,
  Layers,
  FileText,
  Code,
  Lightbulb,
  BarChart3,
  Users,
  MessageSquare,
  GraduationCap,
  Palette,
  Briefcase,
  ChevronRight,
  Globe,
  Target,
  Wand2,
  History,
  Info,
} from 'lucide-react'
import { useStore } from '../store'

type Lang = 'zh' | 'en'

interface Template {
  id: string
  titleZh: string
  titleEn: string
  category: string
  content: string
  variables: string[]
  descZh: string
  descEn: string
}

interface HistoryItem {
  id: string
  prompt: string
  optimized: string
  score: number
  timestamp: number
}

interface FavoriteItem {
  id: string
  title: string
  content: string
  createdAt: number
}

interface Suggestion {
  type: 'warning' | 'info' | 'success'
  messageZh: string
  messageEn: string
}

const STORAGE_KEYS = {
  history: 'weblinux-prompt-optimizer-history',
  favorites: 'weblinux-prompt-optimizer-favorites',
}

const CATEGORIES = [
  { key: 'general', icon: MessageSquare, zh: '通用对话', en: 'General Chat' },
  { key: 'code', icon: Code, zh: '代码生成', en: 'Code Generation' },
  { key: 'creative', icon: Lightbulb, zh: '创意写作', en: 'Creative Writing' },
  { key: 'analysis', icon: BarChart3, zh: '分析推理', en: 'Analysis & Reasoning' },
  { key: 'roleplay', icon: Users, zh: '角色扮演', en: 'Role Playing' },
  { key: 'education', icon: GraduationCap, zh: '教育学习', en: 'Education' },
  { key: 'business', icon: Briefcase, zh: '商业营销', en: 'Business' },
  { key: 'design', icon: Palette, zh: '设计艺术', en: 'Design & Art' },
  { key: 'research', icon: Target, zh: '研究学术', en: 'Research' },
  { key: 'translation', icon: Globe, zh: '翻译语言', en: 'Translation' },
]

const TEMPLATES: Template[] = [
  {
    id: 'general-expert',
    titleZh: '通用专家助手',
    titleEn: 'General Expert Assistant',
    category: 'general',
    content:
      '你是一位经验丰富的专家。请关于"{topic}"为{audience}提供专业的分析和建议。要求使用{style}的风格，回答长度约{length}。请从多个角度进行阐述，并给出具体可操作的建议。',
    variables: ['topic', 'audience', 'style', 'length'],
    descZh: '适用于向AI提问获取专业建议的通用场景',
    descEn: 'General-purpose expert AI consultation',
  },
  {
    id: 'general-brainstorm',
    titleZh: '头脑风暴',
    titleEn: 'Brainstorming',
    category: 'general',
    content:
      '请围绕"{topic}"进行头脑风暴。针对{audience}的需求，至少提出10个不同的创意或解决方案，并按{style}分类整理。每个想法请附上简要说明和适用场景。',
    variables: ['topic', 'audience', 'style'],
    descZh: '生成创意和解决方案的头脑风暴',
    descEn: 'Generate creative ideas and solutions',
  },
  {
    id: 'code-generator',
    titleZh: '代码生成助手',
    titleEn: 'Code Generator',
    category: 'code',
    content:
      '请使用{language}编写一个{task}的程序。要求：\n1. 代码结构清晰，符合{style}规范\n2. 添加详细的中文注释\n3. 处理边界情况和错误处理\n4. 提供使用示例\n5. 考虑性能优化\n主题：{topic}',
    variables: ['language', 'task', 'style', 'topic'],
    descZh: '生成高质量代码，支持多种语言和风格',
    descEn: 'Generate high-quality code in multiple languages',
  },
  {
    id: 'code-review',
    titleZh: '代码审查专家',
    titleEn: 'Code Review Expert',
    category: 'code',
    content:
      '作为资深代码审查专家，请审查以下{language}代码。从以下维度给出反馈：\n1. 潜在Bug和安全漏洞\n2. 性能问题和优化建议\n3. 代码风格和可读性改进\n4. 设计模式建议\n5. 重构方案\n代码片段：\n```{code}```',
    variables: ['language', 'code'],
    descZh: '从多个维度审查代码并给出改进建议',
    descEn: 'Review code from multiple dimensions',
  },
  {
    id: 'code-explain',
    titleZh: '代码解释导师',
    titleEn: 'Code Explanation Tutor',
    category: 'code',
    content:
      '作为编程导师，请为{audience}详细解释以下{language}代码：\n1. 整体功能概述\n2. 关键函数/类的作用\n3. 核心算法和数据结构\n4. 执行流程说明\n5. 可能的边界情况\n代码：\n```{code}```\n讲解风格：{style}',
    variables: ['audience', 'language', 'code', 'style'],
    descZh: '适合初学者理解代码的详细讲解',
    descEn: 'Detailed code explanation for beginners',
  },
  {
    id: 'creative-story',
    titleZh: '短篇小说创作',
    titleEn: 'Short Story Writer',
    category: 'creative',
    content:
      '请以{style}的风格，创作一篇关于"{topic}"的短篇小说。目标读者是{audience}，长度约{length}。要求：\n1. 有吸引人的开头\n2. 丰满的人物形象\n3. 曲折的情节发展\n4. 深刻的主题内涵\n5. 令人回味的结尾',
    variables: ['style', 'topic', 'audience', 'length'],
    descZh: '创作引人入胜的短篇小说',
    descEn: 'Craft engaging short stories',
  },
  {
    id: 'creative-copywriting',
    titleZh: '营销文案写作',
    titleEn: 'Marketing Copywriter',
    category: 'creative',
    content:
      '作为资深营销文案策划师，请为"{topic}"撰写一份吸引人的营销文案。目标受众是{audience}，风格要求{style}。文案需包含：\n1. 引人注目的标题\n2. 核心卖点列表\n3. 情感共鸣描述\n4. 明确的行动号召\n5. 长度约{length}',
    variables: ['topic', 'audience', 'style', 'length'],
    descZh: '撰写高转化率的营销文案',
    descEn: 'Write high-converting marketing copy',
  },
  {
    id: 'creative-poem',
    titleZh: '诗歌创作',
    titleEn: 'Poetry Composition',
    category: 'creative',
    content:
      '请创作一首关于"{topic}"的诗，采用{style}的风格。诗的长度约{length}，目标读者是{audience}。注重意象营造、韵律节奏和情感表达。',
    variables: ['topic', 'style', 'length', 'audience'],
    descZh: '创作富有意境的诗歌',
    descEn: 'Compose evocative poetry',
  },
  {
    id: 'analysis-data',
    titleZh: '数据分析报告',
    titleEn: 'Data Analysis Report',
    category: 'analysis',
    content:
      '作为资深数据分析师，请根据以下数据/问题"{topic}"，为{audience}生成一份结构化的分析报告。报告需包含：\n1. 执行摘要\n2. 数据概览和关键指标\n3. 趋势分析\n4. 异常发现\n5. 可视化建议\n6. 可操作的结论\n报告风格：{style}，长度约{length}',
    variables: ['topic', 'audience', 'style', 'length'],
    descZh: '生成专业的数据分析报告',
    descEn: 'Generate professional data analysis reports',
  },
  {
    id: 'analysis-critical',
    titleZh: '批判性思维分析',
    titleEn: 'Critical Thinking Analysis',
    category: 'analysis',
    content:
      '作为批判性思维专家，请对"{topic}"进行深度分析：\n1. 核心论点识别\n2. 论据质量评估\n3. 逻辑推理检查\n4. 隐含假设揭示\n5. 反驳观点\n6. 综合结论\n请以{style}的风格呈现，目标读者是{audience}',
    variables: ['topic', 'style', 'audience'],
    descZh: '深度分析观点和论据',
    descEn: 'Deep analysis of arguments and evidence',
  },
  {
    id: 'roleplay-expert',
    titleZh: '专家角色扮演',
    titleEn: 'Expert Role Play',
    category: 'roleplay',
    content:
      '请扮演一位{topic}领域的资深专家。以{style}的口吻与我对话，适合{audience}理解。请用{length}的篇幅回答我的问题。在回答中展现深厚的专业知识和实战经验。',
    variables: ['topic', 'style', 'audience', 'length'],
    descZh: '让AI扮演特定领域的专家',
    descEn: 'Make AI play a domain expert',
  },
  {
    id: 'roleplay-interview',
    titleZh: '模拟面试',
    titleEn: 'Mock Interview',
    category: 'roleplay',
    content:
      '请扮演{topic}职位的面试官。以{style}的风格对我进行面试，适合{audience}。请：\n1. 每次提出一个问题\n2. 根据我的回答给出反馈\n3. 逐步增加难度\n4. 最后给出综合评价和改进建议',
    variables: ['topic', 'style', 'audience'],
    descZh: '模拟面试场景，锻炼面试技能',
    descEn: 'Mock interview for skill practice',
  },
  {
    id: 'education-tutor',
    titleZh: '个性化导师',
    titleEn: 'Personalized Tutor',
    category: 'education',
    content:
      '请作为{topic}的个性化导师，为{audience}提供教学。采用{style}的教学方法，每次教学长度约{length}。要求：\n1. 从基础概念入手\n2. 循序渐进\n3. 提供丰富的例子\n4. 适时检查理解程度\n5. 布置练习并提供反馈',
    variables: ['topic', 'audience', 'style', 'length'],
    descZh: '量身定制的学习指导',
    descEn: 'Personalized learning guidance',
  },
  {
    id: 'education-plan',
    titleZh: '学习计划制定',
    titleEn: 'Learning Plan Builder',
    category: 'education',
    content:
      '请为想要学习"{topic}"的{audience}制定一份详细的学习计划。学习风格偏好{style}，可用时间约{length}。计划包含：\n1. 学习目标拆解\n2. 分阶段内容安排\n3. 推荐学习资源\n4. 练习和反馈机制\n5. 进度检查点',
    variables: ['topic', 'audience', 'style', 'length'],
    descZh: '制定系统的学习计划',
    descEn: 'Create systematic learning plans',
  },
  {
    id: 'business-strategy',
    titleZh: '商业战略顾问',
    titleEn: 'Business Strategy Consultant',
    category: 'business',
    content:
      '作为资深商业战略顾问，请就"{topic}"为{audience}提供咨询建议。请进行：\n1. SWOT分析\n2. 竞争格局分析\n3. 市场机会评估\n4. 风险识别与应对\n5. 具体执行方案\n请以{style}的风格呈现，长度约{length}',
    variables: ['topic', 'audience', 'style', 'length'],
    descZh: '专业的商业战略分析',
    descEn: 'Professional business strategy analysis',
  },
  {
    id: 'business-plan',
    titleZh: '商业计划书',
    titleEn: 'Business Plan Writer',
    category: 'business',
    content:
      '请为"{topic}"撰写一份商业计划书，面向{audience}。计划需包含：\n1. 执行摘要\n2. 市场分析\n3. 产品/服务描述\n4. 商业模式\n5. 竞争优势\n6. 财务预测\n7. 运营计划\n风格：{style}，长度约{length}',
    variables: ['topic', 'audience', 'style', 'length'],
    descZh: '撰写完整的商业计划书',
    descEn: 'Write comprehensive business plans',
  },
  {
    id: 'design-review',
    titleZh: '设计评审反馈',
    titleEn: 'Design Review Feedback',
    category: 'design',
    content:
      '作为资深设计师，请就"{topic}"的设计为{audience}提供专业反馈。涵盖：\n1. 视觉美学评估\n2. 用户体验分析\n3. 品牌一致性检查\n4. 可用性改进建议\n5. 具体优化方案\n请以{style}的风格呈现，长度约{length}',
    variables: ['topic', 'audience', 'style', 'length'],
    descZh: '专业的设计评审反馈',
    descEn: 'Professional design review feedback',
  },
  {
    id: 'research-paper',
    titleZh: '学术论文助手',
    titleEn: 'Academic Paper Assistant',
    category: 'research',
    content:
      '作为学术研究助手，请围绕"{topic}"为{audience}提供帮助。包括：\n1. 研究背景梳理\n2. 关键概念解释\n3. 相关研究综述\n4. 研究方法论建议\n5. 论文结构建议\n请以{style}的学术风格呈现，长度约{length}',
    variables: ['topic', 'audience', 'style', 'length'],
    descZh: '学术研究和论文写作支持',
    descEn: 'Academic research and paper writing support',
  },
  {
    id: 'translation-expert',
    titleZh: '专业翻译',
    titleEn: 'Professional Translator',
    category: 'translation',
    content:
      '请作为精通多语言的翻译专家，将以下内容翻译成{target_language}。原文：\n{text}\n\n要求：\n1. 准确传达原意\n2. 符合目标语言的自然表达\n3. 保留原文语气和风格\n4. 文化特定表达提供注释\n5. 翻译风格：{style}',
    variables: ['target_language', 'text', 'style'],
    descZh: '地道的多语言翻译',
    descEn: 'Authentic multi-language translation',
  },
  {
    id: 'general-summary',
    titleZh: '内容摘要生成',
    titleEn: 'Content Summarizer',
    category: 'general',
    content:
      '请为以下内容生成一份简洁的摘要，适合{audience}阅读。要求：\n1. 保留核心信息\n2. 条理清晰\n3. 重点突出\n4. 长度约{length}\n5. 风格：{style}\n\n内容：\n{topic}',
    variables: ['audience', 'length', 'style', 'topic'],
    descZh: '为长文本生成精炼摘要',
    descEn: 'Generate concise summaries',
  },
]

const T = {
  zh: {
    appName: 'AI 提示词优化器',
    appDesc: '基于规则的智能提示词优化引擎',
    input: {
      label: '原始提示词',
      placeholder: '在此输入你的提示词，或从下方模板选择开始…',
      hint: '支持使用 {变量名} 作为占位符',
    },
    optimize: '优化提示词',
    optimizing: '分析中…',
    clear: '清空',
    template: {
      label: '选择模板',
      placeholder: '浏览模板',
      all: '全部分类',
      variables: '模板变量',
    },
    variables: {
      label: '变量填充',
      placeholder: (v: string) => `填写 ${v} 的值`,
    },
    result: {
      optimized: '优化结果',
      preview: '实时预览',
      score: '质量评分',
      suggestions: '优化建议',
      copy: '复制',
      copied: '已复制',
      save: '收藏',
      saved: '已收藏',
      export: '导出',
    },
    history: {
      label: '历史记录',
      empty: '暂无历史记录',
      clear: '清空历史',
    },
    favorites: {
      label: '我的收藏',
      empty: '暂无收藏',
      remove: '取消收藏',
    },
    quality: {
      clarity: '清晰度',
      specificity: '具体性',
      structure: '结构性',
      completeness: '完整性',
    },
    tips: {
      title: '快速提升技巧',
      items: [
        '使用具体的目标描述（如"面向初学者"而非"面向所有人"）',
        '指定输出格式（列表、段落、表格等）',
        '提供示例以明确期望',
        '分步骤描述复杂需求',
        '说明质量要求和约束条件',
      ],
    },
    export: {
      title: '导出提示词',
      btn: '导出',
      copied: '已复制到剪贴板',
    },
    lang: '语言',
    engine: '优化引擎',
    tabs: {
      edit: '编辑',
      preview: '预览',
      history: '历史',
      favorites: '收藏',
    },
  },
  en: {
    appName: 'AI Prompt Optimizer',
    appDesc: 'Rule-based intelligent prompt optimization engine',
    input: {
      label: 'Original Prompt',
      placeholder: 'Enter your prompt here, or start from a template below…',
      hint: 'Use {variable} as placeholders',
    },
    optimize: 'Optimize Prompt',
    optimizing: 'Analyzing…',
    clear: 'Clear',
    template: {
      label: 'Choose Template',
      placeholder: 'Browse templates',
      all: 'All Categories',
      variables: 'Template Variables',
    },
    variables: {
      label: 'Variable Values',
      placeholder: (v: string) => `Fill in ${v}`,
    },
    result: {
      optimized: 'Optimized Result',
      preview: 'Live Preview',
      score: 'Quality Score',
      suggestions: 'Suggestions',
      copy: 'Copy',
      copied: 'Copied',
      save: 'Save',
      saved: 'Saved',
      export: 'Export',
    },
    history: {
      label: 'History',
      empty: 'No history yet',
      clear: 'Clear History',
    },
    favorites: {
      label: 'Favorites',
      empty: 'No favorites yet',
      remove: 'Remove',
    },
    quality: {
      clarity: 'Clarity',
      specificity: 'Specificity',
      structure: 'Structure',
      completeness: 'Completeness',
    },
    tips: {
      title: 'Quick Tips',
      items: [
        'Use specific targets (e.g., "for beginners" not "for everyone")',
        'Specify output format (list, paragraph, table, etc.)',
        'Provide examples to clarify expectations',
        'Break down complex needs into steps',
        'State quality requirements and constraints',
      ],
    },
    export: {
      title: 'Export Prompt',
      btn: 'Export',
      copied: 'Copied to clipboard',
    },
    lang: 'Lang',
    engine: 'Optimization Engine',
    tabs: {
      edit: 'Edit',
      preview: 'Preview',
      history: 'History',
      favorites: 'Favorites',
    },
  },
}

function loadFromStorage<T>(key: string, defaultValue: T): T {
  try {
    const raw = localStorage.getItem(key)
    if (!raw) return defaultValue
    const parsed = JSON.parse(raw)
    return parsed as T
  } catch {
    return defaultValue
  }
}

function saveToStorage<T>(key: string, value: T): void {
  try {
    localStorage.setItem(key, JSON.stringify(value))
  } catch {
    /* ignore */
  }
}

function optimizePrompt(content: string): { optimized: string; score: number; suggestions: Suggestion[] } {
  const suggestions: Suggestion[] = []
  let score = 50
  let optimized = content.trim()

  const hasQuestion = /[?？]/.test(optimized)
  const hasStructure = /(首先|其次|然后|最后|第一|第二|\d+\.|步骤|Step|First|Second|Finally)/i.test(optimized)
  const hasClarity = /(请|请你|你是|作为|please|you are|act as|as a)/i.test(optimized)
  const hasSpecificity = /(\d+字|\d+words|\d+-?\d+|大约|左右|约|approximately|about|around)/i.test(optimized)
  const hasExamples = /(例如|比如|举例|示例|for example|for instance|e\.g\.)/i.test(optimized)
  const hasFormat = /(格式|输出|写成|列表|表格|JSON|JSON|markdown|format|output|list|table)/i.test(optimized)
  const hasRole = /(你是|作为|扮演|pretend|act as|roleplay|role play|you are)/i.test(optimized)
  const hasConstraints = /(不要|不得|必须|需要|应该|禁止|don't|must|should|need to|avoid)/i.test(optimized)
  const lengthOk = optimized.length >= 50
  const notTooLong = optimized.length <= 2000
  const hasNewline = /[\n\r]/.test(optimized)
  const hasAudience = /(初学者|专家|专业|新手|普通|用户|读者|beginner|expert|professional|user|reader)/i.test(optimized)

  if (hasQuestion) score += 5
  else suggestions.push({ type: 'info', messageZh: '添加明确的问题或任务描述', messageEn: 'Add a clear question or task description' })

  if (hasStructure) score += 8
  else suggestions.push({ type: 'warning', messageZh: '考虑使用结构化表达（如编号列表）', messageEn: 'Consider using structured format (e.g., numbered list)' })

  if (hasClarity) score += 6
  else suggestions.push({ type: 'warning', messageZh: '明确角色设定（如"你是一位专家"）', messageEn: 'Specify role setting (e.g., "You are an expert")' })

  if (hasSpecificity) score += 7
  else suggestions.push({ type: 'info', messageZh: '添加具体的约束条件（如字数、风格）', messageEn: 'Add specific constraints (e.g., word count, style)' })

  if (hasExamples) score += 5
  if (hasFormat) score += 5
  if (hasRole) score += 4
  if (hasConstraints) score += 4
  if (hasNewline) score += 3

  if (!lengthOk) {
    suggestions.push({ type: 'warning', messageZh: '提示词过短，建议补充更多细节', messageEn: 'Prompt is too short, add more details' })
    score = Math.max(score - 10, 20)
  }
  if (!notTooLong) {
    suggestions.push({ type: 'info', messageZh: '提示词较长，考虑精简核心需求', messageEn: 'Prompt is long, consider condensing core needs' })
  }
  if (!hasAudience) {
    suggestions.push({ type: 'info', messageZh: '考虑添加目标受众描述', messageEn: 'Consider adding target audience description' })
  }

  const sentences = optimized.split(/[。！？!?\n]+/).filter((s) => s.trim().length > 0)
  if (sentences.length >= 3 && !hasStructure) {
    optimized = sentences.map((s, i) => `${i + 1}. ${s.trim()}`).join('\n')
    suggestions.push({ type: 'success', messageZh: '已自动优化为结构化列表格式', messageEn: 'Auto-optimized to structured list format' })
  }

  if (!hasRole && /(请|please)/i.test(optimized)) {
    optimized = `You are a helpful AI assistant.\n\n${optimized}`
    suggestions.push({ type: 'success', messageZh: '已添加角色设定以增强效果', messageEn: 'Added role setting for better results' })
  }

  score = Math.min(Math.max(score, 0), 100)

  if (suggestions.length === 0 || suggestions.every((s) => s.type === 'success')) {
    suggestions.unshift({ type: 'success', messageZh: '提示词质量优秀！', messageEn: 'Excellent prompt quality!' })
  }

  return { optimized, score, suggestions }
}

function fillTemplate(template: Template, variables: Record<string, string>): string {
  let result = template.content
  for (const key of template.variables) {
    const placeholder = `{${key}}`
    const value = variables[key] || `[${key}]`
    result = result.split(placeholder).join(value)
  }
  return result
}

export default memo(function AIPromptOptimizer() {
  const theme = useStore((state) => state.theme)
  const isDark = theme === 'dark'

  const [lang, setLang] = useState<Lang>(() => {
    const saved = localStorage.getItem('weblinux-prompt-optimizer-lang')
    return (saved === 'en' ? 'en' : 'zh') as Lang
  })

  const [activeTab, setActiveTab] = useState<'edit' | 'preview' | 'history' | 'favorites'>('edit')
  const [selectedCategory, setSelectedCategory] = useState('all')
  const [selectedTemplate, setSelectedTemplate] = useState<Template | null>(null)
  const [variables, setVariables] = useState<Record<string, string>>({})
  const [input, setInput] = useState('')
  const [showTemplates, setShowTemplates] = useState(false)
  const [optimizedResult, setOptimizedResult] = useState('')
  const [score, setScore] = useState(0)
  const [suggestions, setSuggestions] = useState<Suggestion[]>([])
  const [isOptimizing, setIsOptimizing] = useState(false)
  const [copied, setCopied] = useState(false)
  const [exportOpen, setExportOpen] = useState(false)
  const [history, setHistory] = useState<HistoryItem[]>(() => loadFromStorage<HistoryItem[]>(STORAGE_KEYS.history, []))
  const [favorites, setFavorites] = useState<FavoriteItem[]>(() => loadFromStorage<FavoriteItem[]>(STORAGE_KEYS.favorites, []))
  const [autoOptimize, setAutoOptimize] = useState(true)

  const t = T[lang]

  useEffect(() => {
    localStorage.setItem('weblinux-prompt-optimizer-lang', lang)
  }, [lang])

  useEffect(() => {
    if (!autoOptimize || !input.trim()) {
      setOptimizedResult('')
      setScore(0)
      setSuggestions([])
      return
    }
    const { optimized, score: s, suggestions: sug } = optimizePrompt(input)
    setOptimizedResult(optimized)
    setScore(s)
    setSuggestions(sug)
  }, [input, autoOptimize])

  useEffect(() => {
    saveToStorage(STORAGE_KEYS.history, history)
  }, [history])

  useEffect(() => {
    saveToStorage(STORAGE_KEYS.favorites, favorites)
  }, [favorites])

  const filteredTemplates = useMemo(() => {
    if (selectedCategory === 'all') return TEMPLATES
    return TEMPLATES.filter((t) => t.category === selectedCategory)
  }, [selectedCategory])

  const activeVariables = useMemo(() => {
    if (!selectedTemplate) return [] as string[]
    return selectedTemplate.variables
  }, [selectedTemplate])

  const handleSelectTemplate = useCallback((template: Template) => {
    setSelectedTemplate(template)
    const vars: Record<string, string> = {}
    template.variables.forEach((v) => (vars[v] = ''))
    setVariables(vars)
    const filled = fillTemplate(template, vars)
    setInput(filled)
    setShowTemplates(false)
  }, [])

  const handleFillVariable = useCallback((key: string, value: string) => {
    setVariables((prev) => ({ ...prev, [key]: value }))
    if (selectedTemplate) {
      const newVars = { ...variables, [key]: value }
      setInput(fillTemplate(selectedTemplate, newVars))
    }
  }, [variables, selectedTemplate])

  const handleOptimize = useCallback(() => {
    if (!input.trim()) return
    setIsOptimizing(true)
    setTimeout(() => {
      const { optimized, score: s, suggestions: sug } = optimizePrompt(input)
      setOptimizedResult(optimized)
      setScore(s)
      setSuggestions(sug)
      setIsOptimizing(false)
      const item: HistoryItem = {
        id: `hist-${Date.now()}`,
        prompt: input,
        optimized,
        score: s,
        timestamp: Date.now(),
      }
      setHistory((prev) => [item, ...prev].slice(0, 50))
    }, 400)
  }, [input])

  const handleCopy = useCallback(
    async (text: string) => {
      try {
        await navigator.clipboard.writeText(text)
        setCopied(true)
        setTimeout(() => setCopied(false), 1500)
      } catch {
        const ta = document.createElement('textarea')
        ta.value = text
        document.body.appendChild(ta)
        ta.select()
        document.execCommand('copy')
        document.body.removeChild(ta)
        setCopied(true)
        setTimeout(() => setCopied(false), 1500)
      }
    },
    [],
  )

  const handleFavorite = useCallback(
    (title: string, content: string) => {
      const exists = favorites.some((f) => f.content === content)
      if (exists) {
        setFavorites((prev) => prev.filter((f) => f.content !== content))
      } else {
        setFavorites((prev) => [
          { id: `fav-${Date.now()}`, title, content, createdAt: Date.now() },
          ...prev,
        ])
      }
    },
    [favorites],
  )

  const handleClearHistory = useCallback(() => {
    setHistory([])
  }, [])

  const isFavorite = useCallback(
    (content: string) => favorites.some((f) => f.content === content),
    [favorites],
  )

  const categoryName = useMemo(
    () => (cat: string) => {
      const c = CATEGORIES.find((c) => c.key === cat)
      return c ? (lang === 'zh' ? c.zh : c.en) : cat
    },
    [lang],
  )

  const scoreColor = useMemo(() => {
    if (score >= 80) return '#10b981'
    if (score >= 60) return '#f59e0b'
    return '#ef4444'
  }, [score])

  const suggestionIcon = (type: Suggestion['type']) => {
    if (type === 'success') return <Check size={14} color="#10b981" />
    if (type === 'warning') return <Lightbulb size={14} color="#f59e0b" />
    return <Info size={14} color="#3b82f6" />
  }

  return (
    <div
      style={{
        width: '100%',
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        background: isDark
          ? 'linear-gradient(135deg, #0f0f1a 0%, #1a1a2e 50%, #16213e 100%)'
          : 'linear-gradient(135deg, #f8fafc 0%, #eef2ff 50%, #f0f9ff 100%)',
        color: isDark ? '#e2e8f0' : '#1e293b',
        overflow: 'hidden',
      }}
    >
      {/* Header */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '16px 20px',
          borderBottom: `1px solid ${isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.06)'}`,
          background: isDark ? 'rgba(15,15,26,0.7)' : 'rgba(255,255,255,0.7)',
          backdropFilter: 'blur(12px)',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <div
            style={{
              width: 40,
              height: 40,
              borderRadius: 12,
              background: 'linear-gradient(135deg, #6366f1 0%, #8b5cf6 50%, #ec4899 100%)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: '0 4px 15px rgba(99,102,241,0.3)',
            }}
          >
            <Wand2 size={22} color="#fff" />
          </div>
          <div>
            <div style={{ fontSize: 18, fontWeight: 700, letterSpacing: '-0.02em' }}>{t.appName}</div>
            <div style={{ fontSize: 12, opacity: 0.6 }}>{t.appDesc}</div>
          </div>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <button
            onClick={() => setAutoOptimize(!autoOptimize)}
            style={{
              padding: '6px 12px',
              borderRadius: 8,
              border: `1px solid ${isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)'}`,
              background: autoOptimize
                ? 'linear-gradient(135deg, rgba(99,102,241,0.2), rgba(139,92,246,0.2))'
                : 'transparent',
              color: autoOptimize ? '#818cf8' : (isDark ? '#94a3b8' : '#64748b'),
              cursor: 'pointer',
              fontSize: 12,
              fontWeight: 500,
              display: 'flex',
              alignItems: 'center',
              gap: 4,
              transition: 'all 0.2s',
            }}
          >
            <Zap size={14} />
            {autoOptimize ? (lang === 'zh' ? '实时优化' : 'Live') : (lang === 'zh' ? '手动优化' : 'Manual')}
          </button>
          <button
            onClick={() => setLang(lang === 'zh' ? 'en' : 'zh')}
            style={{
              padding: '6px 12px',
              borderRadius: 8,
              border: `1px solid ${isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)'}`,
              background: 'transparent',
              color: isDark ? '#94a3b8' : '#64748b',
              cursor: 'pointer',
              fontSize: 12,
              fontWeight: 500,
              display: 'flex',
              alignItems: 'center',
              gap: 4,
              transition: 'all 0.2s',
            }}
          >
            <Globe size={14} />
            {lang === 'zh' ? '中' : 'EN'}
          </button>
        </div>
      </div>

      {/* Main Content */}
      <div style={{ flex: 1, display: 'flex', overflow: 'hidden' }}>
        {/* Left Panel - Input & Templates */}
        <div
          style={{
            flex: 1,
            display: 'flex',
            flexDirection: 'column',
            padding: 20,
            gap: 16,
            overflow: 'auto',
            borderRight: `1px solid ${isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.04)'}`,
          }}
        >
          {/* Tabs */}
          <div style={{ display: 'flex', gap: 4, marginBottom: 4 }}>
            {(['edit', 'preview', 'history', 'favorites'] as const).map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                style={{
                  flex: 1,
                  padding: '8px 12px',
                  borderRadius: 10,
                  border: 'none',
                  background: activeTab === tab
                    ? isDark
                      ? 'rgba(99,102,241,0.2)'
                      : 'rgba(99,102,241,0.15)'
                    : 'transparent',
                  color:
                    activeTab === tab
                      ? '#818cf8'
                      : isDark
                        ? '#94a3b8'
                        : '#64748b',
                  cursor: 'pointer',
                  fontSize: 13,
                  fontWeight: activeTab === tab ? 600 : 400,
                  transition: 'all 0.2s',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: 6,
                }}
              >
                {tab === 'edit' && <FileText size={14} />}
                {tab === 'preview' && <Eye size={14} />}
                {tab === 'history' && <History size={14} />}
                {tab === 'favorites' && <Star size={14} />}
                {t.tabs[tab]}
              </button>
            ))}
          </div>

          {activeTab === 'edit' && (
            <>
              {/* Template Selector */}
              <div>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
                  <label style={{ fontSize: 13, fontWeight: 600, opacity: 0.8 }}>
                    {t.template.label}
                  </label>
                  {selectedTemplate && (
                    <button
                      onClick={() => {
                        setSelectedTemplate(null)
                        setVariables({})
                      }}
                      style={{
                        background: 'none',
                        border: 'none',
                        color: isDark ? '#94a3b8' : '#64748b',
                        cursor: 'pointer',
                        fontSize: 11,
                        display: 'flex',
                        alignItems: 'center',
                        gap: 4,
                      }}
                    >
                      <X size={12} />
                      {lang === 'zh' ? '清除选择' : 'Clear'}
                    </button>
                  )}
                </div>

                {selectedTemplate ? (
                  <div
                    style={{
                      padding: 14,
                      borderRadius: 12,
                      background: isDark
                        ? 'rgba(99,102,241,0.1)'
                        : 'rgba(99,102,241,0.08)',
                      border: `1px solid ${isDark ? 'rgba(99,102,241,0.3)' : 'rgba(99,102,241,0.2)'}`,
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                      <Sparkles size={14} color="#818cf8" />
                      <span style={{ fontWeight: 600, fontSize: 14 }}>
                        {lang === 'zh' ? selectedTemplate.titleZh : selectedTemplate.titleEn}
                      </span>
                      <span
                        style={{
                          fontSize: 10,
                          padding: '2px 8px',
                          borderRadius: 6,
                          background: isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.08)',
                          color: isDark ? '#94a3b8' : '#64748b',
                        }}
                      >
                        {categoryName(selectedTemplate.category)}
                      </span>
                    </div>
                    <div style={{ fontSize: 12, opacity: 0.6, marginBottom: 10 }}>
                      {lang === 'zh' ? selectedTemplate.descZh : selectedTemplate.descEn}
                    </div>

                    {/* Variable Inputs */}
                    {activeVariables.length > 0 && (
                      <div style={{ marginTop: 10 }}>
                        <div style={{ fontSize: 11, fontWeight: 600, marginBottom: 8, opacity: 0.6 }}>
                          {t.template.variables}
                        </div>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                          {activeVariables.map((v) => (
                            <div key={v} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                              <span
                                style={{
                                  fontSize: 11,
                                  padding: '2px 8px',
                                  borderRadius: 6,
                                  background: isDark ? 'rgba(139,92,246,0.2)' : 'rgba(139,92,246,0.15)',
                                  color: '#a78bfa',
                                  fontFamily: 'monospace',
                                  fontWeight: 600,
                                  minWidth: 80,
                                  textAlign: 'center',
                                }}
                              >
                                {`{${v}}`}
                              </span>
                              <input
                                value={variables[v] || ''}
                                onChange={(e) => handleFillVariable(v, e.target.value)}
                                placeholder={t.variables.placeholder(v)}
                                style={{
                                  flex: 1,
                                  padding: '8px 12px',
                                  borderRadius: 8,
                                  border: `1px solid ${isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)'}`,
                                  background: isDark ? 'rgba(0,0,0,0.2)' : 'rgba(255,255,255,0.8)',
                                  color: isDark ? '#e2e8f0' : '#1e293b',
                                  fontSize: 13,
                                  outline: 'none',
                                }}
                              />
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                ) : (
                  <button
                    onClick={() => setShowTemplates(!showTemplates)}
                    style={{
                      width: '100%',
                      padding: '14px',
                      borderRadius: 12,
                      border: `2px dashed ${isDark ? 'rgba(255,255,255,0.15)' : 'rgba(0,0,0,0.12)'}`,
                      background: isDark ? 'rgba(255,255,255,0.02)' : 'rgba(255,255,255,0.5)',
                      color: isDark ? '#94a3b8' : '#64748b',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: 8,
                      transition: 'all 0.2s',
                      fontSize: 13,
                    }}
                  >
                    <Layers size={16} />
                    {t.template.placeholder}
                    <ChevronRight size={14} style={{ transform: showTemplates ? 'rotate(90deg)' : 'none', transition: 'transform 0.2s' }} />
                  </button>
                )}

                {showTemplates && (
                  <div
                    style={{
                      marginTop: 10,
                      borderRadius: 12,
                      border: `1px solid ${isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.06)'}`,
                      background: isDark ? 'rgba(0,0,0,0.2)' : 'rgba(255,255,255,0.7)',
                      overflow: 'hidden',
                    }}
                  >
                    {/* Category Filter */}
                    <div
                      style={{
                        display: 'flex',
                        gap: 6,
                        padding: 10,
                        overflowX: 'auto',
                        borderBottom: `1px solid ${isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.04)'}`,
                      }}
                    >
                      <button
                        onClick={() => setSelectedCategory('all')}
                        style={{
                          padding: '4px 10px',
                          borderRadius: 6,
                          border: 'none',
                          background: selectedCategory === 'all'
                            ? isDark
                              ? 'rgba(99,102,241,0.3)'
                              : 'rgba(99,102,241,0.2)'
                            : 'transparent',
                          color: selectedCategory === 'all'
                            ? '#818cf8'
                            : isDark
                              ? '#94a3b8'
                              : '#64748b',
                          fontSize: 12,
                          cursor: 'pointer',
                          whiteSpace: 'nowrap',
                        }}
                      >
                        {t.template.all}
                      </button>
                      {CATEGORIES.map((cat) => (
                        <button
                          key={cat.key}
                          onClick={() => setSelectedCategory(cat.key)}
                          style={{
                            padding: '4px 10px',
                            borderRadius: 6,
                            border: 'none',
                            background: selectedCategory === cat.key
                              ? isDark
                                ? 'rgba(99,102,241,0.3)'
                                : 'rgba(99,102,241,0.2)'
                              : 'transparent',
                            color: selectedCategory === cat.key
                              ? '#818cf8'
                              : isDark
                                ? '#94a3b8'
                                : '#64748b',
                            fontSize: 12,
                            cursor: 'pointer',
                            whiteSpace: 'nowrap',
                            display: 'flex',
                            alignItems: 'center',
                            gap: 4,
                          }}
                        >
                          <cat.icon size={12} />
                          {lang === 'zh' ? cat.zh : cat.en}
                        </button>
                      ))}
                    </div>
                    {/* Templates List */}
                    <div style={{ maxHeight: 260, overflowY: 'auto' }}>
                      {filteredTemplates.map((tpl) => (
                        <button
                          key={tpl.id}
                          onClick={() => handleSelectTemplate(tpl)}
                          style={{
                            width: '100%',
                            padding: '10px 14px',
                            border: 'none',
                            borderBottom: `1px solid ${isDark ? 'rgba(255,255,255,0.04)' : 'rgba(0,0,0,0.03)'}`,
                            background: 'transparent',
                            color: isDark ? '#e2e8f0' : '#1e293b',
                            cursor: 'pointer',
                            textAlign: 'left',
                            display: 'flex',
                            flexDirection: 'column',
                            gap: 4,
                            transition: 'background 0.15s',
                          }}
                          onMouseEnter={(e) => {
                            ;(e.currentTarget as HTMLElement).style.background = isDark
                              ? 'rgba(255,255,255,0.05)'
                              : 'rgba(0,0,0,0.03)'
                          }}
                          onMouseLeave={(e) => {
                            ;(e.currentTarget as HTMLElement).style.background = 'transparent'
                          }}
                        >
                          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                            <span style={{ fontWeight: 600, fontSize: 13 }}>
                              {lang === 'zh' ? tpl.titleZh : tpl.titleEn}
                            </span>
                            <span
                              style={{
                                fontSize: 10,
                                padding: '1px 6px',
                                borderRadius: 4,
                                background: isDark ? 'rgba(139,92,246,0.2)' : 'rgba(139,92,246,0.12)',
                                color: '#a78bfa',
                              }}
                            >
                              {categoryName(tpl.category)}
                            </span>
                          </div>
                          <div style={{ fontSize: 11, opacity: 0.55 }}>
                            {lang === 'zh' ? tpl.descZh : tpl.descEn}
                          </div>
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* Input Area */}
              <div>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
                  <label style={{ fontSize: 13, fontWeight: 600, opacity: 0.8 }}>
                    {t.input.label}
                  </label>
                  <div style={{ display: 'flex', gap: 6 }}>
                    <button
                      onClick={() => {
                        setInput('')
                        setSelectedTemplate(null)
                        setVariables({})
                      }}
                      style={{
                        padding: '4px 10px',
                        borderRadius: 6,
                        border: `1px solid ${isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)'}`,
                        background: 'transparent',
                        color: isDark ? '#94a3b8' : '#64748b',
                        cursor: 'pointer',
                        fontSize: 11,
                        display: 'flex',
                        alignItems: 'center',
                        gap: 4,
                      }}
                    >
                      <Trash2 size={12} />
                      {t.clear}
                    </button>
                    {!autoOptimize && (
                      <button
                        onClick={handleOptimize}
                        disabled={!input.trim() || isOptimizing}
                        style={{
                          padding: '4px 12px',
                          borderRadius: 6,
                          border: 'none',
                          background: input.trim() && !isOptimizing
                            ? 'linear-gradient(135deg, #6366f1, #8b5cf6)'
                            : isDark
                              ? 'rgba(255,255,255,0.1)'
                              : 'rgba(0,0,0,0.08)',
                          color: input.trim() && !isOptimizing ? '#fff' : (isDark ? '#64748b' : '#94a3b8'),
                          cursor: input.trim() && !isOptimizing ? 'pointer' : 'not-allowed',
                          fontSize: 11,
                          fontWeight: 500,
                          display: 'flex',
                          alignItems: 'center',
                          gap: 4,
                        }}
                      >
                        <Sparkles size={12} />
                        {isOptimizing ? t.optimizing : t.optimize}
                      </button>
                    )}
                  </div>
                </div>
                <textarea
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  placeholder={t.input.placeholder}
                  style={{
                    width: '100%',
                    minHeight: 200,
                    padding: 14,
                    borderRadius: 12,
                    border: `1px solid ${isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.08)'}`,
                    background: isDark ? 'rgba(0,0,0,0.3)' : 'rgba(255,255,255,0.8)',
                    color: isDark ? '#e2e8f0' : '#1e293b',
                    fontSize: 13,
                    lineHeight: 1.7,
                    outline: 'none',
                    resize: 'vertical',
                    fontFamily: 'inherit',
                    transition: 'border-color 0.2s',
                  }}
                  onFocus={(e) => {
                    ;(e.currentTarget as HTMLTextAreaElement).style.borderColor = isDark
                      ? 'rgba(99,102,241,0.5)'
                      : 'rgba(99,102,241,0.4)'
                  }}
                  onBlur={(e) => {
                    ;(e.currentTarget as HTMLTextAreaElement).style.borderColor = isDark
                      ? 'rgba(255,255,255,0.1)'
                      : 'rgba(0,0,0,0.08)'
                  }}
                />
                <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 6, fontSize: 11, opacity: 0.5 }}>
                  <span>{t.input.hint}</span>
                  <span>{input.length} {lang === 'zh' ? '字符' : 'chars'}</span>
                </div>
              </div>

              {/* Quick Tips */}
              <div
                style={{
                  padding: 14,
                  borderRadius: 12,
                  background: isDark
                    ? 'rgba(16,185,129,0.08)'
                    : 'rgba(16,185,129,0.06)',
                  border: `1px solid ${isDark ? 'rgba(16,185,129,0.2)' : 'rgba(16,185,129,0.15)'}`,
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8, fontWeight: 600, fontSize: 13 }}>
                  <Lightbulb size={14} color="#10b981" />
                  {t.tips.title}
                </div>
                <ul style={{ paddingLeft: 18, display: 'flex', flexDirection: 'column', gap: 4 }}>
                  {t.tips.items.map((tip, i) => (
                    <li key={i} style={{ fontSize: 12, opacity: 0.75, lineHeight: 1.5 }}>
                      {tip}
                    </li>
                  ))}
                </ul>
              </div>
            </>
          )}

          {activeTab === 'preview' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              <div style={{ fontSize: 13, fontWeight: 600, opacity: 0.8 }}>{t.result.preview}</div>
              <div
                style={{
                  padding: 16,
                  borderRadius: 12,
                  background: isDark ? 'rgba(0,0,0,0.3)' : 'rgba(255,255,255,0.8)',
                  border: `1px solid ${isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.06)'}`,
                  fontSize: 13,
                  lineHeight: 1.7,
                  whiteSpace: 'pre-wrap',
                  wordBreak: 'break-word',
                  minHeight: 300,
                }}
              >
                {input || (
                  <span style={{ opacity: 0.4, fontSize: 12 }}>
                    {lang === 'zh' ? '在左侧编辑器中输入提示词' : 'Enter a prompt in the editor'}
                  </span>
                )}
              </div>
            </div>
          )}

          {activeTab === 'history' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <div style={{ fontSize: 13, fontWeight: 600 }}>{t.history.label}</div>
                {history.length > 0 && (
                  <button
                    onClick={handleClearHistory}
                    style={{
                      padding: '4px 10px',
                      borderRadius: 6,
                      border: `1px solid ${isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)'}`,
                      background: 'transparent',
                      color: isDark ? '#ef4444' : '#dc2626',
                      cursor: 'pointer',
                      fontSize: 11,
                      display: 'flex',
                      alignItems: 'center',
                      gap: 4,
                    }}
                  >
                    <Trash2 size={12} />
                    {t.history.clear}
                  </button>
                )}
              </div>
              {history.length === 0 ? (
                <div
                  style={{
                    padding: 40,
                    textAlign: 'center',
                    borderRadius: 12,
                    border: `1px dashed ${isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)'}`,
                    color: isDark ? '#64748b' : '#94a3b8',
                    fontSize: 13,
                  }}
                >
                  {t.history.empty}
                </div>
              ) : (
                history.map((h) => (
                  <div
                    key={h.id}
                    style={{
                      padding: 12,
                      borderRadius: 10,
                      background: isDark ? 'rgba(255,255,255,0.03)' : 'rgba(0,0,0,0.02)',
                      border: `1px solid ${isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.04)'}`,
                      cursor: 'pointer',
                      transition: 'background 0.15s',
                    }}
                    onClick={() => {
                      setInput(h.prompt)
                      setOptimizedResult(h.optimized)
                      setScore(h.score)
                      setActiveTab('edit')
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6 }}>
                      <div style={{ fontSize: 11, opacity: 0.6 }}>
                        {new Date(h.timestamp).toLocaleString(lang === 'zh' ? 'zh-CN' : 'en-US')}
                      </div>
                      <div
                        style={{
                          fontSize: 11,
                          fontWeight: 600,
                          color: h.score >= 80 ? '#10b981' : h.score >= 60 ? '#f59e0b' : '#ef4444',
                        }}
                      >
                        {h.score}分
                      </div>
                    </div>
                    <div
                      style={{
                        fontSize: 12,
                        opacity: 0.7,
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        whiteSpace: 'nowrap',
                      }}
                    >
                      {h.prompt.slice(0, 80)}
                    </div>
                  </div>
                ))
              )}
            </div>
          )}

          {activeTab === 'favorites' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              <div style={{ fontSize: 13, fontWeight: 600 }}>{t.favorites.label}</div>
              {favorites.length === 0 ? (
                <div
                  style={{
                    padding: 40,
                    textAlign: 'center',
                    borderRadius: 12,
                    border: `1px dashed ${isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)'}`,
                    color: isDark ? '#64748b' : '#94a3b8',
                    fontSize: 13,
                  }}
                >
                  {t.favorites.empty}
                </div>
              ) : (
                favorites.map((f) => (
                  <div
                    key={f.id}
                    style={{
                      padding: 12,
                      borderRadius: 10,
                      background: isDark ? 'rgba(255,255,255,0.03)' : 'rgba(0,0,0,0.02)',
                      border: `1px solid ${isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.04)'}`,
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6 }}>
                      <span style={{ fontWeight: 600, fontSize: 13 }}>{f.title}</span>
                      <div style={{ display: 'flex', gap: 6 }}>
                        <button
                          onClick={() => {
                            setInput(f.content)
                            setActiveTab('edit')
                          }}
                          style={{
                            padding: '3px 8px',
                            borderRadius: 5,
                            border: 'none',
                            background: isDark ? 'rgba(99,102,241,0.2)' : 'rgba(99,102,241,0.12)',
                            color: '#818cf8',
                            cursor: 'pointer',
                            fontSize: 11,
                            display: 'flex',
                            alignItems: 'center',
                          }}
                        >
                          <Eye size={11} />
                        </button>
                        <button
                          onClick={() => handleCopy(f.content)}
                          style={{
                            padding: '3px 8px',
                            borderRadius: 5,
                            border: 'none',
                            background: isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.06)',
                            color: isDark ? '#94a3b8' : '#64748b',
                            cursor: 'pointer',
                            fontSize: 11,
                            display: 'flex',
                            alignItems: 'center',
                          }}
                        >
                          <Copy size={11} />
                        </button>
                        <button
                          onClick={() => setFavorites((prev) => prev.filter((x) => x.id !== f.id))}
                          style={{
                            padding: '3px 8px',
                            borderRadius: 5,
                            border: 'none',
                            background: isDark ? 'rgba(239,68,68,0.15)' : 'rgba(239,68,68,0.1)',
                            color: '#ef4444',
                            cursor: 'pointer',
                            fontSize: 11,
                            display: 'flex',
                            alignItems: 'center',
                          }}
                        >
                          <Trash2 size={11} />
                        </button>
                      </div>
                    </div>
                    <div
                      style={{
                        fontSize: 12,
                        opacity: 0.6,
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        display: '-webkit-box',
                        WebkitLineClamp: 2,
                        WebkitBoxOrient: 'vertical',
                      }}
                    >
                      {f.content}
                    </div>
                  </div>
                ))
              )}
            </div>
          )}
        </div>

        {/* Right Panel - Results & Suggestions */}
        <div
          style={{
            width: 420,
            display: 'flex',
            flexDirection: 'column',
            padding: 20,
            gap: 16,
            overflow: 'auto',
          }}
        >
          {/* Score Card */}
          <div
            style={{
              padding: 20,
              borderRadius: 16,
              background: isDark
                ? 'linear-gradient(135deg, rgba(99,102,241,0.15), rgba(139,92,246,0.1))'
                : 'linear-gradient(135deg, rgba(99,102,241,0.1), rgba(139,92,246,0.08))',
              border: `1px solid ${isDark ? 'rgba(99,102,241,0.3)' : 'rgba(99,102,241,0.2)'}`,
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <Sparkles size={16} color="#818cf8" />
                <span style={{ fontWeight: 600, fontSize: 14 }}>{t.result.score}</span>
              </div>
              <div
                style={{
                  fontSize: 28,
                  fontWeight: 800,
                  color: scoreColor,
                  fontVariantNumeric: 'tabular-nums',
                }}
              >
                {score}
                <span style={{ fontSize: 14, opacity: 0.5, fontWeight: 500 }}>/100</span>
              </div>
            </div>
            {/* Score Bar */}
            <div
              style={{
                height: 8,
                borderRadius: 4,
                background: isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.08)',
                overflow: 'hidden',
                marginBottom: 14,
              }}
            >
              <div
                style={{
                  height: '100%',
                  width: `${score}%`,
                  borderRadius: 4,
                  background: `linear-gradient(90deg, ${scoreColor}, ${scoreColor}cc)`,
                  transition: 'width 0.5s ease',
                }}
              />
            </div>
            {/* Quality Breakdown */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
              {[
                { label: t.quality.clarity, value: Math.min(score + 5, 100) },
                { label: t.quality.specificity, value: Math.max(score - 8, 0) },
                { label: t.quality.structure, value: Math.min(score + 2, 100) },
                { label: t.quality.completeness, value: Math.max(score - 3, 0) },
              ].map((q) => (
                <div
                  key={q.label}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '6px 10px',
                    borderRadius: 8,
                    background: isDark ? 'rgba(0,0,0,0.2)' : 'rgba(255,255,255,0.6)',
                    fontSize: 11,
                  }}
                >
                  <span style={{ opacity: 0.7 }}>{q.label}</span>
                  <span
                    style={{
                      fontWeight: 600,
                      color: q.value >= 80 ? '#10b981' : q.value >= 60 ? '#f59e0b' : '#ef4444',
                    }}
                  >
                    {q.value}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Optimized Result */}
          <div>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <Wand2 size={14} color="#818cf8" />
                <span style={{ fontWeight: 600, fontSize: 13 }}>{t.result.optimized}</span>
              </div>
              <div style={{ display: 'flex', gap: 6 }}>
                <button
                  onClick={() => handleCopy(optimizedResult || input)}
                  disabled={!optimizedResult && !input}
                  style={{
                    padding: '5px 10px',
                    borderRadius: 7,
                    border: `1px solid ${isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)'}`,
                    background: copied
                      ? isDark
                        ? 'rgba(16,185,129,0.2)'
                        : 'rgba(16,185,129,0.1)'
                      : isDark
                        ? 'rgba(255,255,255,0.05)'
                        : 'rgba(0,0,0,0.04)',
                    color: copied ? '#10b981' : (isDark ? '#94a3b8' : '#64748b'),
                    cursor: copied ? 'default' : 'pointer',
                    fontSize: 11,
                    display: 'flex',
                    alignItems: 'center',
                    gap: 4,
                    transition: 'all 0.2s',
                  }}
                >
                  {copied ? <Check size={12} /> : <Copy size={12} />}
                  {copied ? t.result.copied : t.result.copy}
                </button>
                <button
                  onClick={() =>
                    handleFavorite(
                      selectedTemplate
                        ? lang === 'zh'
                          ? selectedTemplate.titleZh
                          : selectedTemplate.titleEn
                        : lang === 'zh'
                          ? '自定义提示词'
                          : 'Custom Prompt',
                      optimizedResult || input,
                    )
                  }
                  disabled={!optimizedResult && !input}
                  style={{
                    padding: '5px 10px',
                    borderRadius: 7,
                    border: `1px solid ${isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)'}`,
                    background: isFavorite(optimizedResult || input)
                      ? isDark
                        ? 'rgba(245,158,11,0.2)'
                        : 'rgba(245,158,11,0.1)'
                      : isDark
                        ? 'rgba(255,255,255,0.05)'
                        : 'rgba(0,0,0,0.04)',
                    color: isFavorite(optimizedResult || input) ? '#f59e0b' : (isDark ? '#94a3b8' : '#64748b'),
                    cursor: 'pointer',
                    fontSize: 11,
                    display: 'flex',
                    alignItems: 'center',
                    gap: 4,
                  }}
                >
                  <Star size={12} fill={isFavorite(optimizedResult || input) ? '#f59e0b' : 'none'} />
                  {isFavorite(optimizedResult || input) ? t.favorites.remove : t.result.save}
                </button>
                <button
                  onClick={() => setExportOpen(!exportOpen)}
                  style={{
                    padding: '5px 10px',
                    borderRadius: 7,
                    border: `1px solid ${isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)'}`,
                    background: isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.04)',
                    color: isDark ? '#94a3b8' : '#64748b',
                    cursor: 'pointer',
                    fontSize: 11,
                    display: 'flex',
                    alignItems: 'center',
                    gap: 4,
                  }}
                >
                  <Download size={12} />
                  {t.result.export}
                </button>
              </div>
            </div>
            <div
              style={{
                padding: 14,
                borderRadius: 12,
                background: isDark ? 'rgba(0,0,0,0.35)' : 'rgba(255,255,255,0.85)',
                border: `1px solid ${isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.06)'}`,
                fontSize: 13,
                lineHeight: 1.7,
                whiteSpace: 'pre-wrap',
                wordBreak: 'break-word',
                minHeight: 140,
                maxHeight: 260,
                overflow: 'auto',
                fontFamily: 'inherit',
              }}
            >
              {optimizedResult || input || (
                <span style={{ opacity: 0.4, fontSize: 12 }}>
                  {lang === 'zh' ? '等待输入…' : 'Waiting for input…'}
                </span>
              )}
            </div>
          </div>

          {/* Export Panel */}
          {exportOpen && (
            <div
              style={{
                padding: 14,
                borderRadius: 12,
                background: isDark ? 'rgba(0,0,0,0.3)' : 'rgba(255,255,255,0.8)',
                border: `1px solid ${isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.06)'}`,
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
                <span style={{ fontWeight: 600, fontSize: 13 }}>{t.export.title}</span>
                <button
                  onClick={() => setExportOpen(false)}
                  style={{
                    background: 'none',
                    border: 'none',
                    color: isDark ? '#94a3b8' : '#64748b',
                    cursor: 'pointer',
                  }}
                >
                  <X size={14} />
                </button>
              </div>
              <textarea
                readOnly
                value={JSON.stringify(
                  {
                    original: input,
                    optimized: optimizedResult || input,
                    score,
                    suggestions: suggestions.map((s) => ({
                      type: s.type,
                      message: lang === 'zh' ? s.messageZh : s.messageEn,
                    })),
                    exportedAt: new Date().toISOString(),
                  },
                  null,
                  2,
                )}
                style={{
                  width: '100%',
                  minHeight: 100,
                  padding: 10,
                  borderRadius: 8,
                  border: `1px solid ${isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.06)'}`,
                  background: isDark ? 'rgba(0,0,0,0.3)' : 'rgba(255,255,255,0.6)',
                  color: isDark ? '#e2e8f0' : '#1e293b',
                  fontSize: 11,
                  fontFamily: 'monospace',
                  resize: 'vertical',
                  outline: 'none',
                }}
              />
              <button
                onClick={() => {
                  handleCopy(
                    JSON.stringify(
                      {
                        original: input,
                        optimized: optimizedResult || input,
                        score,
                        suggestions: suggestions.map((s) => ({
                          type: s.type,
                          message: lang === 'zh' ? s.messageZh : s.messageEn,
                        })),
                        exportedAt: new Date().toISOString(),
                      },
                      null,
                      2,
                    ),
                  )
                }}
                style={{
                  marginTop: 10,
                  padding: '8px 16px',
                  borderRadius: 8,
                  border: 'none',
                  background: 'linear-gradient(135deg, #6366f1, #8b5cf6)',
                  color: '#fff',
                  cursor: 'pointer',
                  fontSize: 12,
                  fontWeight: 500,
                  display: 'flex',
                  alignItems: 'center',
                  gap: 6,
                  width: '100%',
                  justifyContent: 'center',
                }}
              >
                <Copy size={13} />
                {t.export.copied}
              </button>
            </div>
          )}

          {/* Suggestions */}
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10 }}>
              <Lightbulb size={14} color="#f59e0b" />
              <span style={{ fontWeight: 600, fontSize: 13 }}>{t.result.suggestions}</span>
            </div>
            {suggestions.length === 0 ? (
              <div
                style={{
                  padding: 20,
                  textAlign: 'center',
                  borderRadius: 10,
                  border: `1px dashed ${isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)'}`,
                  color: isDark ? '#64748b' : '#94a3b8',
                  fontSize: 12,
                }}
              >
                {lang === 'zh' ? '开始输入以获取建议' : 'Start typing to get suggestions'}
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {suggestions.map((s, i) => (
                  <div
                    key={i}
                    style={{
                      padding: '10px 12px',
                      borderRadius: 10,
                      background:
                        s.type === 'success'
                          ? isDark
                            ? 'rgba(16,185,129,0.1)'
                            : 'rgba(16,185,129,0.08)'
                          : s.type === 'warning'
                            ? isDark
                              ? 'rgba(245,158,11,0.1)'
                              : 'rgba(245,158,11,0.08)'
                            : isDark
                              ? 'rgba(59,130,246,0.1)'
                              : 'rgba(59,130,246,0.08)',
                      border: `1px solid ${
                        s.type === 'success'
                          ? isDark
                            ? 'rgba(16,185,129,0.3)'
                            : 'rgba(16,185,129,0.2)'
                          : s.type === 'warning'
                            ? isDark
                              ? 'rgba(245,158,11,0.3)'
                              : 'rgba(245,158,11,0.2)'
                            : isDark
                              ? 'rgba(59,130,246,0.3)'
                              : 'rgba(59,130,246,0.2)'
                      }`,
                      display: 'flex',
                      alignItems: 'flex-start',
                      gap: 8,
                      fontSize: 12,
                      lineHeight: 1.5,
                    }}
                  >
                    <div style={{ flexShrink: 0, marginTop: 2 }}>{suggestionIcon(s.type)}</div>
                    <div>{lang === 'zh' ? s.messageZh : s.messageEn}</div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Recent History Quick Access */}
          {history.length > 0 && (
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10 }}>
                <History size={14} color="#3b82f6" />
                <span style={{ fontWeight: 600, fontSize: 13 }}>{t.history.label}</span>
                <span style={{ fontSize: 11, opacity: 0.5 }}>({history.length})</span>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                {history.slice(0, 5).map((h) => (
                  <div
                    key={h.id}
                    style={{
                      padding: '8px 10px',
                      borderRadius: 8,
                      background: isDark ? 'rgba(255,255,255,0.03)' : 'rgba(0,0,0,0.02)',
                      border: `1px solid ${isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.04)'}`,
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      gap: 8,
                      transition: 'background 0.15s',
                    }}
                    onClick={() => {
                      setInput(h.prompt)
                      setOptimizedResult(h.optimized)
                      setScore(h.score)
                    }}
                    onMouseEnter={(e) => {
                      ;(e.currentTarget as HTMLElement).style.background = isDark
                        ? 'rgba(255,255,255,0.06)'
                        : 'rgba(0,0,0,0.04)'
                    }}
                    onMouseLeave={(e) => {
                      ;(e.currentTarget as HTMLElement).style.background = isDark
                        ? 'rgba(255,255,255,0.03)'
                        : 'rgba(0,0,0,0.02)'
                    }}
                  >
                    <div
                      style={{
                        fontSize: 11,
                        opacity: 0.65,
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        whiteSpace: 'nowrap',
                        flex: 1,
                      }}
                    >
                      {h.prompt.slice(0, 50)}
                    </div>
                    <div
                      style={{
                        fontSize: 10,
                        fontWeight: 600,
                        color: h.score >= 80 ? '#10b981' : h.score >= 60 ? '#f59e0b' : '#ef4444',
                        flexShrink: 0,
                      }}
                    >
                      {h.score}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
})
