import { useState, useEffect, useCallback, useMemo, useRef, memo } from 'react'
import {
  Sparkles, Wand2, Copy, Download, Trash2, Star, Clock, Play,
  Layers, ChevronDown, ChevronRight, RotateCcw, Variable,
  FileText, Eye, Loader2, Check, Search, Code, PenTool,
  Languages, BarChart3, Lightbulb, Briefcase, GraduationCap,
  Zap, FileCode, MessageSquare,
} from 'lucide-react'

interface VariableDef { name: string; value: string }
interface PromptTemplate {
  id: string; name: string; category: string; content: string
  variables: string[]; description: string
  icon: React.ComponentType<{ size?: number; className?: string; color?: string }>; color: string
}
interface HistoryItem {
  id: string; prompt: string; result: string
  timestamp: number; templateName?: string
}
interface FavoriteItem { id: string; name: string; content: string; createdAt: number }

const CATEGORIES = [
  { key: 'all', name: '全部', icon: Layers, color: '#6366f1' },
  { key: 'coding', name: '编程开发', icon: Code, color: '#0ea5e9' },
  { key: 'writing', name: '写作创作', icon: PenTool, color: '#ec4899' },
  { key: 'analysis', name: '数据分析', icon: BarChart3, color: '#f59e0b' },
  { key: 'translation', name: '翻译润色', icon: Languages, color: '#14b8a6' },
  { key: 'creative', name: '创意灵感', icon: Lightbulb, color: '#a855f7' },
  { key: 'business', name: '商业报告', icon: Briefcase, color: '#ef4444' },
  { key: 'education', name: '教育学习', icon: GraduationCap, color: '#22c55e' },
  { key: 'code-review', name: '代码审查', icon: FileCode, color: '#f97316' },
]

const TEMPLATES: PromptTemplate[] = [
  { id: 'code-review', name: '代码审查助手', category: 'code-review', icon: FileCode, color: '#f97316',
    description: '全面审查代码，发现潜在问题与改进建议',
    variables: ['language', 'code', 'focus_area'],
    content: `你是一位资深软件工程师，擅长代码审查。请对以下{{language}}代码进行专业审查：

\`\`\`{{language}}
{{code}}
\`\`\`

请重点关注以下方面：
1. 潜在 Bug 和逻辑错误
2. 性能瓶颈与优化空间
3. 代码风格与可读性
4. 安全风险
5. 设计模式与架构建议

聚焦领域：{{focus_area}}

请以结构化方式输出审查报告，包含问题描述、严重程度、建议代码示例。` },
  { id: 'tech-doc', name: '技术文档撰写', category: 'writing', icon: FileText, color: '#0ea5e9',
    description: '生成专业的技术文档和API说明',
    variables: ['topic', 'audience', 'doc_type'],
    content: `请为{{topic}}撰写一份专业的技术文档。

目标读者：{{audience}}
文档类型：{{doc_type}}

要求：
1. 结构清晰，层次分明
2. 包含代码示例和图示说明
3. 提供最佳实践建议
4. 标注注意事项和常见陷阱
5. 适当使用表格总结关键信息` },
  { id: 'creative-writing', name: '创意写作', category: 'creative', icon: PenTool, color: '#ec4899',
    description: '激发创意灵感，生成精彩故事与文案',
    variables: ['genre', 'topic', 'style', 'length'],
    content: `请以{{style}}风格，围绕"{{topic}}"创作一篇{{genre}}作品。

体裁：{{genre}}
风格：{{style}}
主题：{{topic}}
长度：{{length}}字

要求：
1. 开头引人入胜
2. 情节跌宕起伏
3. 人物性格鲜明
4. 语言生动有画面感
5. 结尾留有余韵` },
  { id: 'data-analysis', name: '数据分析解读', category: 'analysis', icon: BarChart3, color: '#f59e0b',
    description: '深入分析数据，发现趋势与洞察',
    variables: ['data_description', 'analysis_goal', 'industry'],
    content: `你是一位资深数据分析师。请对以下数据进行专业分析：

数据概述：{{data_description}}
分析目标：{{analysis_goal}}
所属行业：{{industry}}

请提供：
1. 关键数据指标梳理
2. 趋势与模式识别
3. 异常值与离群点分析
4. 业务洞察与建议
5. 下一步行动方案` },
  { id: 'translation', name: '翻译润色', category: 'translation', icon: Languages, color: '#14b8a6',
    description: '高质量双语翻译，保留原意与风格',
    variables: ['source_lang', 'target_lang', 'text', 'tone'],
    content: `请将以下{{source_lang}}文本翻译为{{target_lang}}：

原文：
{{text}}

翻译要求：
1. 保持原文语义和风格
2. 使用自然流畅的目标语言
3. 专业术语准确对应
4. 语气语调符合{{tone}}风格
5. 如有文化差异，适当本地化` },
  { id: 'qa-assistant', name: '知识问答专家', category: 'education', icon: GraduationCap, color: '#22c55e',
    description: '以专家视角解答各类专业问题',
    variables: ['question', 'field', 'depth'],
    content: `你是一位{{field}}领域的专家。请回答以下问题：

问题：{{question}}

要求：
1. 先给出核心结论
2. 分点展开详细论证
3. 提供实际例子或案例
4. 标注关键概念和术语解释
5. 根据{{depth}}深度调整回答详略` },
  { id: 'business-report', name: '商业报告生成', category: 'business', icon: Briefcase, color: '#ef4444',
    description: '生成专业商业分析与战略报告',
    variables: ['company', 'industry', 'report_type', 'period'],
    content: `请为{{company}}撰写一份{{report_type}}。

行业：{{industry}}
报告类型：{{report_type}}
报告周期：{{period}}

报告结构：
1. 执行摘要
2. 市场环境分析
3. 竞争格局分析
4. 关键指标与数据
5. 风险评估
6. 战略建议
7. 行动路线图` },
  { id: 'code-generator', name: '代码生成器', category: 'coding', icon: Code, color: '#0ea5e9',
    description: '根据需求生成各类编程语言代码',
    variables: ['language', 'feature', 'requirements'],
    content: `请使用{{language}}编写代码，实现以下功能：

功能描述：{{feature}}

需求要求：
{{requirements}}

代码要求：
1. 函数签名清晰，命名规范
2. 完整的输入输出验证
3. 处理边界情况和异常
4. 包含使用示例和文档注释
5. 遵循{{language}}最佳实践` },
  { id: 'bug-fixer', name: 'Bug 诊断修复', category: 'coding', icon: Zap, color: '#0ea5e9',
    description: '系统化排查和修复代码问题',
    variables: ['language', 'error_desc', 'code'],
    content: `你是一位经验丰富的调试专家。请帮我分析以下{{language}}代码的问题。

错误描述：{{error_desc}}
相关代码：
\`\`\`{{language}}
{{code}}
\`\`\`

请按以下步骤分析：
1. 复现条件分析
2. 可能原因列举
3. 系统性排查步骤
4. 修复建议和代码示例
5. 预防此类问题的最佳实践` },
  { id: 'algorithm-solver', name: '算法题目解析', category: 'coding', icon: Code, color: '#8b5cf6',
    description: '算法题目全流程分析与解答',
    variables: ['problem', 'constraints', 'language'],
    content: `你是一位算法竞赛教练。请帮我解决这个算法问题。

问题描述：{{problem}}
约束条件：{{constraints}}
偏好语言：{{language}}

请提供：
1. 问题分析与约束理解
2. 解题思路与复杂度分析
3. 清晰的代码实现（含详细注释）
4. 测试用例验证
5. 可能的优化方向` },
  { id: 'sql-optimizer', name: 'SQL 性能优化', category: 'analysis', icon: BarChart3, color: '#f59e0b',
    description: 'SQL 查询优化与索引建议',
    variables: ['sql_query', 'table_structure', 'performance_issue'],
    content: `你是一位数据库性能专家。请对以下 SQL 查询进行优化分析。

原 SQL：
{{sql_query}}

表结构：{{table_structure}}
性能问题：{{performance_issue}}

请提供：
1. 性能瓶颈分析
2. 优化后的 SQL 写法
3. 索引建议
4. 执行计划分析
5. 数据库层面的优化建议` },
  { id: 'product-description', name: '产品描述撰写', category: 'writing', icon: PenTool, color: '#ec4899',
    description: '撰写吸引眼球的产品介绍文案',
    variables: ['product', 'features', 'target_user', 'platform'],
    content: `请为以下产品撰写一份吸引人的描述文案。

产品名称：{{product}}
核心特点：{{features}}
目标用户：{{target_user}}
发布平台：{{platform}}

要求：
1. 突出产品核心价值
2. 使用目标用户的语言
3. 包含行动号召
4. 风格适配{{platform}}
5. 适当使用情绪词和场景描述` },
  { id: 'email-writer', name: '专业邮件撰写', category: 'writing', icon: MessageSquare, color: '#0ea5e9',
    description: '撰写得体专业的商务邮件',
    variables: ['recipient', 'purpose', 'key_points', 'tone'],
    content: `请为{{recipient}}撰写一封专业邮件。

邮件目的：{{purpose}}
关键要点：{{key_points}}
语气风格：{{tone}}

要求：
1. 主题行清晰明确
2. 开场礼貌得体
3. 正文简洁有逻辑
4. 结尾有明确行动号召
5. 格式规范专业` },
  { id: 'interview-prep', name: '面试准备助手', category: 'education', icon: GraduationCap, color: '#22c55e',
    description: '系统化准备各类面试',
    variables: ['position', 'company', 'experience_years', 'focus_areas'],
    content: `请帮我为{{company}}的{{position}}职位面试做准备。

经验年限：{{experience_years}}年
重点领域：{{focus_areas}}

请提供：
1. 高频面试问题清单
2. 每个问题的回答框架
3. 行为面试 STAR 法则示例
4. 技术问题深度解析
5. 面试前检查清单` },
  { id: 'marketing-copy', name: '营销文案生成', category: 'business', icon: Briefcase, color: '#ef4444',
    description: '各平台营销推广文案',
    variables: ['platform', 'product', 'promotion', 'audience'],
    content: `请为{{platform}}生成产品推广文案。

产品：{{product}}
促销活动：{{promotion}}
目标受众：{{audience}}

要求：
1. 符合{{platform}}内容风格
2. 包含吸引眼球的标题
3. 简洁有力的卖点描述
4. 紧迫感与稀缺性营造
5. 明确的行动号召` },
  { id: 'learning-path', name: '学习路径规划', category: 'education', icon: GraduationCap, color: '#22c55e',
    description: '系统化学习规划与资源推荐',
    variables: ['topic', 'current_level', 'goal', 'timeframe'],
    content: `请为我规划一条{{topic}}的学习路径。

当前水平：{{current_level}}
学习目标：{{goal}}
时间期限：{{timeframe}}

请提供：
1. 分阶段学习计划
2. 每个阶段的核心知识点
3. 推荐学习资源（书籍/课程/文章）
4. 实践项目建议
5. 里程碑检查点` },
  { id: 'research-summary', name: '研究综述撰写', category: 'analysis', icon: BarChart3, color: '#f59e0b',
    description: '系统性研究文献综述',
    variables: ['topic', 'field', 'time_range', 'scope'],
    content: `请对以下研究主题进行系统性综述。

主题：{{topic}}
所属领域：{{field}}
时间范围：{{time_range}}
综述范围：{{scope}}

请提供：
1. 研究背景与意义
2. 主要研究方向梳理
3. 关键研究者与里程碑成果
4. 当前研究热点与趋势
5. 未来研究方向展望` },
  { id: 'creative-brainstorm', name: '创意头脑风暴', category: 'creative', icon: Lightbulb, color: '#a855f7',
    description: '发散思维，生成创意点子',
    variables: ['topic', 'domain', 'constraints', 'count'],
    content: `请围绕"{{topic}}"进行头脑风暴，生成{{count}}个创意想法。

领域：{{domain}}
约束条件：{{constraints}}

请提供：
1. 每个创意的核心概念
2. 潜在应用场景
3. 可行性评估
4. 创新亮点
5. 与现有方案的差异化` },
  { id: 'api-doc', name: 'API 文档生成', category: 'coding', icon: FileCode, color: '#0ea5e9',
    description: '生成完整的 REST API 文档',
    variables: ['api_name', 'endpoints', 'auth_type'],
    content: `请为以下 API 生成完整的技术文档。

API 名称：{{api_name}}
端点列表：{{endpoints}}
认证方式：{{auth_type}}

文档要求：
1. API 概述与架构说明
2. 认证机制详解
3. 端点详细说明（方法/路径/参数/响应）
4. 请求与响应示例
5. 错误码说明
6. SDK 使用示例` },
  { id: 'code-refactor', name: '代码重构建议', category: 'code-review', icon: FileCode, color: '#f97316',
    description: '提供重构方案提升代码质量',
    variables: ['language', 'code', 'goal'],
    content: `你是一位注重代码质量的架构师。请分析并重构以下代码。

\`\`\`{{language}}
{{code}}
\`\`\`

重构目标：{{goal}}

请提供：
1. 当前代码问题分析
2. 重构策略与设计模式选择
3. 重构前后代码对比
4. 性能影响评估
5. 渐进式重构步骤` },
  { id: 'unit-test', name: '单元测试生成', category: 'coding', icon: Code, color: '#0ea5e9',
    description: '自动生成代码单元测试',
    variables: ['language', 'code', 'framework'],
    content: `请为以下{{language}}代码生成单元测试。

\`\`\`{{language}}
{{code}}
\`\`\`

测试框架：{{framework}}

要求：
1. 覆盖主要功能路径
2. 包含边界条件测试
3. 包含异常场景测试
4. 使用合理的 mock/stub
5. 测试命名清晰规范` },
  { id: 'git-commit', name: 'Git 提交信息', category: 'coding', icon: Code, color: '#8b5cf6',
    description: '生成规范的 Git 提交信息',
    variables: ['changes', 'type', 'scope'],
    content: `请为以下代码变更生成规范的 Git 提交信息。

变更内容：{{changes}}
变更类型：{{type}}（feat/fix/refactor/docs/test/chore）
影响范围：{{scope}}

请生成：
1. 符合 Conventional Commits 规范的标题
2. 详细的变更说明
3. 关联的 Issue/Ticket 引用
4. Breaking Change 标注（如有）` },
  { id: 'data-visualization', name: '数据可视化建议', category: 'analysis', icon: BarChart3, color: '#f59e0b',
    description: '选择最佳可视化方案呈现数据',
    variables: ['data_type', 'insight_goal', 'audience'],
    content: `请为以下数据选择最佳可视化方案。

数据类型：{{data_type}}
洞察目标：{{insight_goal}}
目标受众：{{audience}}

请提供：
1. 推荐的图表类型及理由
2. 视觉编码方案（颜色/尺寸/形状）
3. 交互设计建议
4. 数据故事叙述结构
5. 工具与技术栈建议` },
  { id: 'learning-assistant', name: '学习辅导老师', category: 'education', icon: GraduationCap, color: '#22c55e',
    description: '耐心细致的一对一学习辅导',
    variables: ['subject', 'question', 'level', 'learning_style'],
    content: `你是一位耐心的{{subject}}辅导老师。请帮助我理解以下问题。

问题：{{question}}
水平层次：{{level}}
学习风格：{{learning_style}}

请使用以下教学策略：
1. 从简单到复杂逐步引导
2. 使用类比和比喻帮助理解
3. 提供具体示例和练习
4. 鼓励提问和思考
5. 定期检查理解程度` },
  { id: 'sentiment-analysis', name: '情感分析解读', category: 'analysis', icon: BarChart3, color: '#f59e0b',
    description: '文本情感与观点深度分析',
    variables: ['text', 'context', 'aspects'],
    content: `请对以下文本进行情感分析。

文本内容：{{text}}
上下文背景：{{context}}
关注方面：{{aspects}}

请提供：
1. 整体情感倾向（正面/负面/中性）
2. 各维度情感强度评分
3. 关键观点提取
4. 情感转折点识别
5. 分析结论与建议` },
  { id: 'brand-tagline', name: '品牌标语创作', category: 'creative', icon: Lightbulb, color: '#a855f7',
    description: '打造令人印象深刻的品牌标语',
    variables: ['brand', 'positioning', 'personality', 'target'],
    content: `请为以下品牌创作标语和口号。

品牌名称：{{brand}}
品牌定位：{{positioning}}
品牌个性：{{personality}}
目标受众：{{target}}

请提供：
1. 5条候选标语
2. 每条的创作理念
3. 情感诉求策略
4. 适用场景建议
5. 与品牌形象的契合度分析` },
]

const spinStyle: React.CSSProperties = { animation: 'spin 1s linear infinite' }

const PromptEngineer = memo(function PromptEngineer() {
  const [selectedCategory, setSelectedCategory] = useState('all')
  const [searchQuery, setSearchQuery] = useState('')
  const [activeTemplate, setActiveTemplate] = useState<PromptTemplate | null>(null)
  const [variables, setVariables] = useState<VariableDef[]>([])
  const [promptContent, setPromptContent] = useState('')
  const [aiResult, setAiResult] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [activeTab, setActiveTab] = useState<'templates' | 'history' | 'favorites'>('templates')
  const [history, setHistory] = useState<HistoryItem[]>(() => {
    try { return JSON.parse(localStorage.getItem('prompt-engineer-history') || '[]') } catch { return [] }
  })
  const [favorites, setFavorites] = useState<FavoriteItem[]>(() => {
    try { return JSON.parse(localStorage.getItem('prompt-engineer-favorites') || '[]') } catch { return [] }
  })
  const [copiedId, setCopiedId] = useState<string | null>(null)
  const [expandedTemplates, setExpandedTemplates] = useState<Set<string>>(new Set())
  const resultRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    try { localStorage.setItem('prompt-engineer-history', JSON.stringify(history.slice(0, 100))) } catch {}
  }, [history])
  useEffect(() => {
    try { localStorage.setItem('prompt-engineer-favorites', JSON.stringify(favorites)) } catch {}
  }, [favorites])

  const filteredTemplates = useMemo(() => {
    return TEMPLATES.filter((t) => {
      const mc = selectedCategory === 'all' || t.category === selectedCategory
      const ms = !searchQuery || t.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        t.description.toLowerCase().includes(searchQuery.toLowerCase())
      return mc && ms
    })
  }, [selectedCategory, searchQuery])

  const loadTemplate = useCallback((template: PromptTemplate) => {
    setActiveTemplate(template)
    setVariables(template.variables.map((v) => ({ name: v, value: '' })))
    setPromptContent(template.content)
    setAiResult('')
  }, [])

  const replaceVariables = useCallback((content: string, vars: VariableDef[]) => {
    let r = content
    for (const v of vars) {
      r = r.replace(new RegExp(`\\{\\{${v.name}\\}\\}`, 'g'), v.value || `[${v.name}未填写]`)
    }
    return r
  }, [])

  const filledPrompt = useMemo(() => {
    if (!promptContent) return ''
    return replaceVariables(promptContent, variables)
  }, [promptContent, variables, replaceVariables])

  const handleVariableChange = useCallback((index: number, value: string) => {
    setVariables((prev) => { const n = [...prev]; n[index] = { ...n[index], value }; return n })
  }, [])

  const handleTestAI = useCallback(async () => {
    if (!filledPrompt.trim() || isLoading) return
    setIsLoading(true)
    setAiResult('')
    const tempId = Date.now().toString()

    try {
      const response = await fetch('https://text.pollinations.ai/', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: [{ role: 'user', content: filledPrompt }],
          model: 'flux',
          temperature: 0.8,
          max_tokens: 2048,
        }),
      })

      if (!response.ok || !response.body) throw new Error(`API 请求失败: ${response.status}`)

      const reader = response.body.getReader()
      const decoder = new TextDecoder()
      let result = ''

      while (true) {
        const { done, value } = await reader.read()
        if (done) break
        const chunk = decoder.decode(value)
        try {
          const lines = chunk.split('\n')
          for (const line of lines) {
            if (line.startsWith('data: ')) {
              const data = line.slice(6)
              if (data === '[DONE]') continue
              try {
                const parsed = JSON.parse(data)
                const c = parsed.choices?.[0]?.delta?.content || parsed.choices?.[0]?.message?.content || parsed.content || ''
                if (c) { result += c; setAiResult(result) }
              } catch { result += data; setAiResult(result) }
            } else if (chunk && !chunk.startsWith('data:')) {
              result += chunk; setAiResult(result)
            }
          }
        } catch { result += chunk; setAiResult(result) }
      }

      if (!result.trim()) setAiResult('（AI 未返回内容，请检查网络或重试）')
      setHistory((prev) => [{ id: tempId, prompt: filledPrompt, result: result || '（无输出）', timestamp: Date.now(), templateName: activeTemplate?.name }, ...prev])
    } catch (error) {
      const msg = error instanceof Error ? error.message : '未知错误'
      setAiResult(`❌ API 调用失败：${msg}\n\n请检查网络连接后重试。`)
      setHistory((prev) => [{ id: tempId, prompt: filledPrompt, result: `❌ 失败：${msg}`, timestamp: Date.now(), templateName: activeTemplate?.name }, ...prev])
    } finally { setIsLoading(false) }
  }, [filledPrompt, isLoading, activeTemplate])

  const handleCopy = useCallback(async (text: string, id: string) => {
    try { await navigator.clipboard.writeText(text); setCopiedId(id); setTimeout(() => setCopiedId(null), 1500) } catch {}
  }, [])

  const handleExportMarkdown = useCallback(() => {
    if (!filledPrompt && !aiResult) return
    const md = `# 提示词工程报告\n\n## 模板信息\n- **模板名称**：${activeTemplate?.name || '自定义'}\n- **分类**：${activeTemplate?.category || '—'}\n- **导出时间**：${new Date().toLocaleString('zh-CN')}\n\n## 提示词内容\n\n\`\`\`\n${filledPrompt || promptContent}\n\`\`\`\n\n## AI 响应\n\n${aiResult || '*尚未生成响应*'}\n\n---\n*由 PromptEngineer 生成*`
    const blob = new Blob([md], { type: 'text/markdown;charset=utf-8' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url; a.download = `prompt-engineer-${Date.now()}.md`; a.click()
    URL.revokeObjectURL(url)
  }, [filledPrompt, promptContent, aiResult, activeTemplate])

  const handleSaveFavorite = useCallback(() => {
    if (!filledPrompt) return
    const name = activeTemplate?.name || `自定义 #${favorites.length + 1}`
    setFavorites((prev) => prev.some((f) => f.content === filledPrompt) ? prev : [{ id: Date.now().toString(), name, content: filledPrompt, createdAt: Date.now() }, ...prev])
  }, [filledPrompt, activeTemplate, favorites.length])

  const handleLoadFavorite = useCallback((fav: FavoriteItem) => {
    setActiveTemplate(null); setVariables([]); setPromptContent(fav.content); setAiResult('')
  }, [])

  const handleDeleteFavorite = useCallback((id: string) => setFavorites((prev) => prev.filter((f) => f.id !== id)), [])
  const handleDeleteHistory = useCallback((id: string) => setHistory((prev) => prev.filter((h) => h.id !== id)), [])
  const handleClearHistory = useCallback(() => setHistory([]), [])
  const toggleExpand = useCallback((id: string) => {
    setExpandedTemplates((prev) => { const n = new Set(prev); n.has(id) ? n.delete(id) : n.add(id); return n })
  }, [])

  const isFavorite = useMemo(() => filledPrompt && favorites.some((f) => f.content === filledPrompt), [filledPrompt, favorites])

  const S = {
    container: { width: '100%', height: '100%', position: 'relative', overflow: 'hidden', fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", "PingFang SC", "Microsoft YaHei", sans-serif', color: '#f1f5f9' } as React.CSSProperties,
    glassBg: { position: 'absolute', inset: 0, background: 'linear-gradient(135deg, #0f172a 0%, #1e1b4b 25%, #312e81 50%, #1e3a5f 75%, #0f172a 100%)', zIndex: 0 } as React.CSSProperties,
    header: { position: 'relative', zIndex: 1, display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '16px 24px', background: 'rgba(15,23,42,0.5)', backdropFilter: 'blur(20px)', WebkitBackdropFilter: 'blur(20px)', borderBottom: '1px solid rgba(255,255,255,0.08)', flexShrink: 0 } as React.CSSProperties,
    headerLeft: { display: 'flex', alignItems: 'center', gap: 16 } as React.CSSProperties,
    logo: { width: 44, height: 44, borderRadius: 12, background: 'linear-gradient(135deg, #6366f1, #a855f7)', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 4px 20px rgba(99,102,241,0.4)' } as React.CSSProperties,
    title: { margin: 0, fontSize: 20, fontWeight: 700, background: 'linear-gradient(135deg, #e0e7ff, #c7d2fe)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' } as React.CSSProperties,
    subtitle: { margin: 0, fontSize: 12, color: '#94a3b8', marginTop: 2 } as React.CSSProperties,
    headerRight: { display: 'flex', alignItems: 'center', gap: 10 } as React.CSSProperties,
    iconBtn: { width: 36, height: 36, borderRadius: 10, border: '1px solid rgba(255,255,255,0.1)', background: 'rgba(255,255,255,0.05)', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', transition: 'all 0.2s', color: '#fff' } as React.CSSProperties,
    primaryBtn: { height: 36, padding: '0 16px', borderRadius: 10, border: 'none', background: 'linear-gradient(135deg, #6366f1, #8b5cf6)', color: '#fff', fontSize: 13, fontWeight: 600, display: 'flex', alignItems: 'center', gap: 6, cursor: 'pointer', boxShadow: '0 4px 20px rgba(99,102,241,0.4)' } as React.CSSProperties,
    mainContent: { position: 'relative', zIndex: 1, display: 'flex', height: 'calc(100% - 77px)', overflow: 'hidden' } as React.CSSProperties,
    leftPanel: { width: 340, flexShrink: 0, display: 'flex', flexDirection: 'column', background: 'rgba(15,23,42,0.4)', backdropFilter: 'blur(20px)', WebkitBackdropFilter: 'blur(20px)', borderRight: '1px solid rgba(255,255,255,0.08)', overflow: 'hidden' } as React.CSSProperties,
    tabs: { display: 'flex', padding: 12, gap: 4, borderBottom: '1px solid rgba(255,255,255,0.08)', flexShrink: 0 } as React.CSSProperties,
    tab: { flex: 1, padding: '8px 10px', borderRadius: 8, border: 'none', background: 'rgba(255,255,255,0.03)', color: '#94a3b8', fontSize: 12, fontWeight: 500, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, cursor: 'pointer', position: 'relative' } as React.CSSProperties,
    tabActive: { background: 'rgba(99,102,241,0.2)', color: '#c7d2fe' } as React.CSSProperties,
    badge: { position: 'absolute', top: -2, right: 2, width: 16, height: 16, borderRadius: 8, background: '#6366f1', color: '#fff', fontSize: 9, fontWeight: 700, display: 'flex', alignItems: 'center', justifyContent: 'center' } as React.CSSProperties,
    templatesSection: { flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' } as React.CSSProperties,
    searchWrapper: { display: 'flex', alignItems: 'center', gap: 8, padding: '10px 12px', margin: '12px 12px 0', borderRadius: 10, background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.08)' } as React.CSSProperties,
    searchInput: { flex: 1, background: 'transparent', border: 'none', outline: 'none', color: '#f1f5f9', fontSize: 13 } as React.CSSProperties,
    categoryList: { display: 'flex', flexWrap: 'wrap', gap: 6, padding: '10px 12px' } as React.CSSProperties,
    categoryItem: { display: 'flex', alignItems: 'center', gap: 5, padding: '5px 10px', borderRadius: 16, border: '1px solid transparent', background: 'rgba(255,255,255,0.04)', color: '#94a3b8', fontSize: 11, fontWeight: 500, cursor: 'pointer' } as React.CSSProperties,
    categoryItemActive: { background: 'rgba(99,102,241,0.15)', color: '#c7d2fe' } as React.CSSProperties,
    templateList: { flex: 1, overflowY: 'auto', padding: '4px 12px 16px', display: 'flex', flexDirection: 'column', gap: 8 } as React.CSSProperties,
    templateCard: { borderRadius: 12, border: '1px solid rgba(255,255,255,0.08)', background: 'rgba(255,255,255,0.03)', overflow: 'hidden' } as React.CSSProperties,
    templateHeader: { display: 'flex', alignItems: 'center', gap: 10, padding: 12, cursor: 'pointer' } as React.CSSProperties,
    templateIcon: { width: 32, height: 32, borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 } as React.CSSProperties,
    templateInfo: { flex: 1, minWidth: 0 } as React.CSSProperties,
    templateName: { fontSize: 13, fontWeight: 600, color: '#f1f5f9', marginBottom: 2 } as React.CSSProperties,
    templateDesc: { fontSize: 11, color: '#94a3b8', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' } as React.CSSProperties,
    templateActions: { flexShrink: 0 } as React.CSSProperties,
    templatePreview: { padding: '0 12px 12px', borderTop: '1px solid rgba(255,255,255,0.06)' } as React.CSSProperties,
    previewLabel: { fontSize: 10, textTransform: 'uppercase', letterSpacing: 1, color: '#6366f1', marginBottom: 6, marginTop: 10 } as React.CSSProperties,
    previewContent: { background: 'rgba(0,0,0,0.3)', borderRadius: 8, padding: 10, fontSize: 11, color: '#cbd5e1', whiteSpace: 'pre-wrap', wordBreak: 'break-word', maxHeight: 120, overflowY: 'auto', margin: 0, fontFamily: 'ui-monospace, SFMono-Regular, Menlo, monospace' } as React.CSSProperties,
    variableChips: { display: 'flex', flexWrap: 'wrap', gap: 4, marginTop: 8 } as React.CSSProperties,
    variableChip: { padding: '2px 6px', borderRadius: 4, background: 'rgba(99,102,241,0.2)', color: '#c7d2fe', fontSize: 10, fontFamily: 'monospace' } as React.CSSProperties,
    favoritesSection: { flex: 1, overflowY: 'auto', padding: 12 } as React.CSSProperties,
    favoriteList: { display: 'flex', flexDirection: 'column', gap: 10 } as React.CSSProperties,
    favoriteCard: { borderRadius: 12, border: '1px solid rgba(255,255,255,0.08)', background: 'rgba(255,255,255,0.04)', padding: 12 } as React.CSSProperties,
    favoriteHeader: { display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6 } as React.CSSProperties,
    favoriteName: { fontSize: 13, fontWeight: 600, color: '#f1f5f9' } as React.CSSProperties,
    favoriteActions: { display: 'flex', gap: 4 } as React.CSSProperties,
    favoriteContent: { fontSize: 11, color: '#94a3b8', whiteSpace: 'pre-wrap', wordBreak: 'break-word', maxHeight: 80, overflow: 'hidden', margin: 0, fontFamily: 'ui-monospace, SFMono-Regular, Menlo, monospace', background: 'rgba(0,0,0,0.2)', padding: 8, borderRadius: 6 } as React.CSSProperties,
    favoriteDate: { fontSize: 10, color: '#64748b', marginTop: 6 } as React.CSSProperties,
    historySection: { flex: 1, overflowY: 'auto', padding: 12 } as React.CSSProperties,
    historyToolbar: { display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10, fontSize: 11, color: '#94a3b8' } as React.CSSProperties,
    clearBtn: { display: 'flex', alignItems: 'center', gap: 4, padding: '4px 8px', borderRadius: 6, border: '1px solid rgba(239,68,68,0.3)', background: 'rgba(239,68,68,0.1)', color: '#ef4444', fontSize: 10, cursor: 'pointer' } as React.CSSProperties,
    historyList: { display: 'flex', flexDirection: 'column', gap: 10 } as React.CSSProperties,
    historyCard: { borderRadius: 12, border: '1px solid rgba(255,255,255,0.08)', background: 'rgba(255,255,255,0.04)', padding: 12 } as React.CSSProperties,
    historyHeader: { display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6 } as React.CSSProperties,
    historyTemplate: { fontSize: 12, fontWeight: 600, color: '#c7d2fe' } as React.CSSProperties,
    historyDate: { fontSize: 10, color: '#64748b' } as React.CSSProperties,
    historyPrompt: { fontSize: 11, color: '#94a3b8', marginBottom: 4, lineHeight: 1.5 } as React.CSSProperties,
    historyResult: { fontSize: 11, color: '#cbd5e1', marginBottom: 8, lineHeight: 1.5 } as React.CSSProperties,
    historyActions: { display: 'flex', gap: 4 } as React.CSSProperties,
    emptyState: { display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '40px 20px', color: '#64748b', gap: 8, textAlign: 'center' } as React.CSSProperties,
    rightPanel: { flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden', padding: 20, gap: 20 } as React.CSSProperties,
    builderSection: { flex: 1, display: 'flex', flexDirection: 'column', background: 'rgba(255,255,255,0.03)', backdropFilter: 'blur(20px)', WebkitBackdropFilter: 'blur(20px)', borderRadius: 16, border: '1px solid rgba(255,255,255,0.08)', padding: 20, overflow: 'hidden', minHeight: 0 } as React.CSSProperties,
    sectionHeader: { display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16, flexShrink: 0 } as React.CSSProperties,
    sectionTitle: { display: 'flex', alignItems: 'center', gap: 8, fontSize: 16, fontWeight: 700, color: '#f1f5f9' } as React.CSSProperties,
    templateBadge: { display: 'flex', alignItems: 'center', gap: 6, padding: '4px 10px', borderRadius: 8, background: 'rgba(99,102,241,0.15)', border: '1px solid rgba(99,102,241,0.3)', fontSize: 11, color: '#c7d2fe' } as React.CSSProperties,
    variablesSection: { marginBottom: 16, flexShrink: 0 } as React.CSSProperties,
    variablesLabel: { fontSize: 11, textTransform: 'uppercase', letterSpacing: 1, color: '#a855f7', marginBottom: 10 } as React.CSSProperties,
    variablesGrid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))', gap: 10 } as React.CSSProperties,
    variableField: { display: 'flex', flexDirection: 'column', gap: 4 } as React.CSSProperties,
    variableName: { fontSize: 10, fontFamily: 'monospace', color: '#c7d2fe' } as React.CSSProperties,
    variableInput: { width: '100%', padding: '8px 10px', borderRadius: 8, border: '1px solid rgba(255,255,255,0.1)', background: 'rgba(0,0,0,0.25)', color: '#f1f5f9', fontSize: 12, outline: 'none', boxSizing: 'border-box' } as React.CSSProperties,
    editorSection: { marginBottom: 16, flexShrink: 0 } as React.CSSProperties,
    editorToolbar: { display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 } as React.CSSProperties,
    editorTitle: { display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, fontWeight: 600, color: '#c7d2fe' } as React.CSSProperties,
    editorActions: { display: 'flex', gap: 4 } as React.CSSProperties,
    miniBtn: { width: 28, height: 28, borderRadius: 6, border: '1px solid rgba(255,255,255,0.1)', background: 'rgba(255,255,255,0.05)', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', color: '#94a3b8' } as React.CSSProperties,
    promptEditor: { width: '100%', height: 120, borderRadius: 10, border: '1px solid rgba(255,255,255,0.1)', background: 'rgba(0,0,0,0.3)', color: '#f1f5f9', fontSize: 13, padding: 12, fontFamily: 'ui-monospace, SFMono-Regular, Menlo, monospace', resize: 'vertical', outline: 'none', lineHeight: 1.6, boxSizing: 'border-box' } as React.CSSProperties,
    previewSection: { flex: 1, display: 'flex', flexDirection: 'column', minHeight: 0 } as React.CSSProperties,
    previewHeader: { display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, fontWeight: 600, color: '#a855f7', marginBottom: 8 } as React.CSSProperties,
    previewBox: { flex: 1, borderRadius: 10, border: '1px solid rgba(168,85,247,0.2)', background: 'rgba(0,0,0,0.35)', color: '#e2e8f0', fontSize: 12, padding: 12, whiteSpace: 'pre-wrap', wordBreak: 'break-word', overflow: 'auto', fontFamily: 'ui-monospace, SFMono-Regular, Menlo, monospace', margin: 0, lineHeight: 1.6 } as React.CSSProperties,
    resultSection: { flex: 1, display: 'flex', flexDirection: 'column', background: 'rgba(255,255,255,0.03)', backdropFilter: 'blur(20px)', WebkitBackdropFilter: 'blur(20px)', borderRadius: 16, border: '1px solid rgba(255,255,255,0.08)', padding: 20, overflow: 'hidden', minHeight: 0 } as React.CSSProperties,
    resultBox: { flex: 1, borderRadius: 12, border: '1px solid rgba(255,255,255,0.08)', background: 'rgba(0,0,0,0.3)', overflow: 'auto', position: 'relative' } as React.CSSProperties,
    resultContent: { padding: 16, fontSize: 13, color: '#e2e8f0', lineHeight: 1.7, whiteSpace: 'pre-wrap', wordBreak: 'break-word' } as React.CSSProperties,
    loadingOverlay: { position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 12, color: '#94a3b8', fontSize: 13, background: 'rgba(0,0,0,0.4)', zIndex: 2 } as React.CSSProperties,
    resultPlaceholder: { display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100%', color: '#64748b', gap: 10, textAlign: 'center' } as React.CSSProperties,
  }

  return (
    <div style={S.container}>
      <div style={S.glassBg} />
      <header style={S.header}>
        <div style={S.headerLeft}>
          <div style={S.logo}><Wand2 size={24} color="#fff" /></div>
          <div>
            <h1 style={S.title}>PromptEngineer</h1>
            <p style={S.subtitle}>AI 提示词工程工具 · 构建 · 测试 · 优化</p>
          </div>
        </div>
        <div style={S.headerRight}>
          <button style={{ ...S.iconBtn, opacity: !filledPrompt ? 0.4 : 1, cursor: !filledPrompt ? 'not-allowed' : 'pointer' }} onClick={handleSaveFavorite} disabled={!filledPrompt} title="收藏">
            <Star size={16} color={isFavorite ? '#f59e0b' : '#fff'} />
          </button>
          <button style={{ ...S.iconBtn, opacity: !filledPrompt ? 0.4 : 1, cursor: !filledPrompt ? 'not-allowed' : 'pointer' }} onClick={() => handleCopy(filledPrompt, 'main')} disabled={!filledPrompt} title="复制">
            {copiedId === 'main' ? <Check size={16} color="#22c55e" /> : <Copy size={16} color="#fff" />}
          </button>
          <button style={S.iconBtn} onClick={handleExportMarkdown} title="导出 Markdown">
            <Download size={16} color="#fff" />
          </button>
          <button style={{ ...S.primaryBtn, opacity: isLoading || !filledPrompt ? 0.6 : 1, cursor: isLoading || !filledPrompt ? 'not-allowed' : 'pointer' }} onClick={handleTestAI} disabled={isLoading || !filledPrompt}>
            {isLoading ? <Loader2 size={16} style={spinStyle} /> : <Play size={16} />}
            {isLoading ? '测试中...' : 'AI 测试'}
          </button>
        </div>
      </header>

      <div style={S.mainContent}>
        <aside style={S.leftPanel}>
          <div style={S.tabs}>
            {([
              { key: 'templates', label: '场景模板', icon: Layers },
              { key: 'favorites', label: '收藏夹', icon: Star },
              { key: 'history', label: '历史记录', icon: Clock },
            ] as const).map((tab) => (
              <button key={tab.key} style={{ ...S.tab, ...(activeTab === tab.key ? S.tabActive : {}) }} onClick={() => setActiveTab(tab.key)}>
                <tab.icon size={14} />{tab.label}
                {tab.key === 'history' && history.length > 0 && <span style={S.badge}>{history.length}</span>}
                {tab.key === 'favorites' && favorites.length > 0 && <span style={S.badge}>{favorites.length}</span>}
              </button>
            ))}
          </div>

          {activeTab === 'templates' && (
            <div style={S.templatesSection}>
              <div style={S.searchWrapper}>
                <Search size={14} color="#94a3b8" />
                <input style={S.searchInput} placeholder="搜索模板..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} />
              </div>
              <div style={S.categoryList}>
                {CATEGORIES.map((cat) => (
                  <button key={cat.key} style={{ ...S.categoryItem, ...(selectedCategory === cat.key ? S.categoryItemActive : {}), borderColor: selectedCategory === cat.key ? cat.color : 'transparent' }} onClick={() => setSelectedCategory(cat.key)}>
                    <cat.icon size={14} color={cat.color} /><span>{cat.name}</span>
                  </button>
                ))}
              </div>
              <div style={S.templateList}>
                {filteredTemplates.map((tpl) => {
                  const IC = tpl.icon
                  const isExp = expandedTemplates.has(tpl.id)
                  const isAct = activeTemplate?.id === tpl.id
                  return (
                    <div key={tpl.id} style={{ ...S.templateCard, ...(isAct ? { borderColor: tpl.color, background: 'rgba(255,255,255,0.12)' } : {}) }}>
                      <div style={S.templateHeader} onClick={() => { isAct ? toggleExpand(tpl.id) : loadTemplate(tpl) }}>
                        <div style={{ ...S.templateIcon, background: `${tpl.color}20` }}><IC size={16} color={tpl.color} /></div>
                        <div style={S.templateInfo}>
                          <div style={S.templateName}>{tpl.name}</div>
                          <div style={S.templateDesc}>{tpl.description}</div>
                        </div>
                        <div style={S.templateActions}>
                          {isAct && (isExp ? <ChevronDown size={14} color="#94a3b8" /> : <ChevronRight size={14} color="#94a3b8" />)}
                        </div>
                      </div>
                      {isAct && isExp && (
                        <div style={S.templatePreview}>
                          <div style={S.previewLabel}>模板预览</div>
                          <pre style={S.previewContent}>{tpl.content}</pre>
                          <div style={S.variableChips}>
                            {tpl.variables.map((v) => <span key={v} style={S.variableChip}>{`{{${v}}}`}</span>)}
                          </div>
                        </div>
                      )}
                    </div>
                  )
                })}
              </div>
            </div>
          )}

          {activeTab === 'favorites' && (
            <div style={S.favoritesSection}>
              {favorites.length === 0 ? (
                <div style={S.emptyState}>
                  <Star size={32} color="#475569" /><p>暂无收藏</p><span>点击右上角收藏提示词</span>
                </div>
              ) : (
                <div style={S.favoriteList}>
                  {favorites.map((fav) => (
                    <div key={fav.id} style={S.favoriteCard}>
                      <div style={S.favoriteHeader}>
                        <div style={S.favoriteName}>{fav.name}</div>
                        <div style={S.favoriteActions}>
                          <button style={S.miniBtn} onClick={() => handleCopy(fav.content, fav.id)} title="复制">
                            {copiedId === fav.id ? <Check size={12} color="#22c55e" /> : <Copy size={12} />}
                          </button>
                          <button style={S.miniBtn} onClick={() => handleLoadFavorite(fav)} title="加载"><Play size={12} /></button>
                          <button style={{ ...S.miniBtn, color: '#ef4444' }} onClick={() => handleDeleteFavorite(fav.id)} title="删除"><Trash2 size={12} /></button>
                        </div>
                      </div>
                      <pre style={S.favoriteContent}>{fav.content}</pre>
                      <div style={S.favoriteDate}>{new Date(fav.createdAt).toLocaleString('zh-CN')}</div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {activeTab === 'history' && (
            <div style={S.historySection}>
              {history.length > 0 && (
                <div style={S.historyToolbar}>
                  <span>共 {history.length} 条记录</span>
                  <button style={S.clearBtn} onClick={handleClearHistory}><Trash2 size={12} />清空</button>
                </div>
              )}
              {history.length === 0 ? (
                <div style={S.emptyState}>
                  <Clock size={32} color="#475569" /><p>暂无历史</p><span>点击"AI 测试"开始生成</span>
                </div>
              ) : (
                <div style={S.historyList}>
                  {history.map((item) => (
                    <div key={item.id} style={S.historyCard}>
                      <div style={S.historyHeader}>
                        <div style={S.historyTemplate}>{item.templateName || '自定义'}</div>
                        <div style={S.historyDate}>{new Date(item.timestamp).toLocaleString('zh-CN')}</div>
                      </div>
                      <div style={S.historyPrompt}><strong>提示词：</strong>{item.prompt.length > 100 ? item.prompt.slice(0, 100) + '...' : item.prompt}</div>
                      <div style={S.historyResult}><strong>结果：</strong>{item.result.length > 100 ? item.result.slice(0, 100) + '...' : item.result}</div>
                      <div style={S.historyActions}>
                        <button style={S.miniBtn} onClick={() => handleCopy(item.result, item.id)} title="复制结果">
                          {copiedId === item.id ? <Check size={12} color="#22c55e" /> : <Copy size={12} />}
                        </button>
                        <button style={{ ...S.miniBtn, color: '#ef4444' }} onClick={() => handleDeleteHistory(item.id)} title="删除"><Trash2 size={12} /></button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </aside>

        <section style={S.rightPanel}>
          <div style={S.builderSection}>
            <div style={S.sectionHeader}>
              <div style={S.sectionTitle}><Variable size={18} color="#6366f1" />提示词构建器</div>
              {activeTemplate && (
                <div style={S.templateBadge}>
                  {activeTemplate.icon && <activeTemplate.icon size={14} color={activeTemplate.color} />}
                  <span>{activeTemplate.name}</span>
                </div>
              )}
            </div>

            {variables.length > 0 && (
              <div style={S.variablesSection}>
                <div style={S.variablesLabel}>变量填充</div>
                <div style={S.variablesGrid}>
                  {variables.map((v, idx) => (
                    <div key={v.name} style={S.variableField}>
                      <label style={S.variableName}>{`{{${v.name}}}`}</label>
                      <input style={S.variableInput} placeholder={`输入 ${v.name}`} value={v.value} onChange={(e) => handleVariableChange(idx, e.target.value)} />
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div style={S.editorSection}>
              <div style={S.editorToolbar}>
                <div style={S.editorTitle}><FileText size={14} color="#6366f1" />提示词编辑</div>
                <div style={S.editorActions}>
                  <button style={S.miniBtn} onClick={() => setPromptContent(promptContent)} title="刷新"><RotateCcw size={12} /></button>
                  <button style={S.miniBtn} onClick={() => handleCopy(promptContent, 'editor')} title="复制原始">
                    {copiedId === 'editor' ? <Check size={12} color="#22c55e" /> : <Copy size={12} />}
                  </button>
                </div>
              </div>
              <textarea style={S.promptEditor} value={promptContent} onChange={(e) => setPromptContent(e.target.value)} placeholder="选择模板或直接编辑提示词...&#10;使用 {{变量名}} 定义变量" />
            </div>

            <div style={S.previewSection}>
              <div style={S.previewHeader}><Eye size={14} color="#6366f1" />变量替换预览</div>
              <pre style={S.previewBox}>{filledPrompt || '— 选择模板或填写变量查看预览 —'}</pre>
            </div>
          </div>

          <div style={S.resultSection} ref={resultRef}>
            <div style={S.sectionHeader}>
              <div style={S.sectionTitle}><Sparkles size={18} color="#a855f7" />AI 测试结果</div>
              {aiResult && !isLoading && (
                <button style={S.miniBtn} onClick={() => handleCopy(aiResult, 'result')}>
                  {copiedId === 'result' ? <Check size={12} color="#22c55e" /> : <Copy size={12} />}
                </button>
              )}
            </div>
            <div style={S.resultBox}>
              {isLoading && (
                <div style={S.loadingOverlay}>
                  <Loader2 size={28} style={spinStyle} color="#6366f1" />
                  <span>AI 正在生成响应...</span>
                </div>
              )}
              {!isLoading && aiResult ? (
                <div style={S.resultContent}>{aiResult}</div>
              ) : (
                <div style={S.resultPlaceholder}>
                  <MessageSquare size={40} color="#334155" />
                  <p>AI 测试结果将在此显示</p>
                  <span>点击顶部"AI 测试"按钮开始</span>
                </div>
              )}
            </div>
          </div>
        </section>
      </div>
    </div>
  )
})

export default PromptEngineer