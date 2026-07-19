import { useState, useEffect, useMemo, useCallback, useRef, memo } from 'react'
import {
  chat,
  streamChat,
  AVAILABLE_TEXT_MODELS,
  type AIMessage,
} from '../services/aiService'
import { marked } from 'marked'
import { WandIcon, SparklesIcon, LightbulbIcon } from '../icons'

/**
 * PromptForge — AI 提示词工程工作室
 *
 * 一个面向提示词工程师 / 内容创作者的工具：
 *  - 内置高质量模板库（写作 / 编程 / 分析 / 创意 / 教育 / 营销）
 *  - {{变量名}} 插值：用真实数据填充模板
 *  - 实时调用 AI（Pollinations.ai 免费 API）查看输出
 *  - 一键优化：让 AI 反向优化提示词
 *  - 收藏 / 标签 / 搜索 / 导入 / 导出（JSON）
 *  - localStorage 持久化
 *
 * 与 Nexus AI 的区别：Nexus AI 是通用对话，PromptForge 专注于"提示词"这一工件
 * 的工程化管理——你管理的是模板、变量和优化迭代，而不是聊天记录。
 */

type Category = 'writing' | 'coding' | 'analysis' | 'creative' | 'education' | 'marketing' | 'custom'

interface PromptTemplate {
  id: string
  title: string
  category: Category
  content: string
  description?: string
  tags: string[]
  favorite?: boolean
  createdAt: number
  updatedAt: number
  usageCount: number
}

interface TestRun {
  id: string
  templateId: string
  input: string
  output: string
  model: string
  temperature: number
  durationMs: number
  timestamp: number
  error?: boolean
}

const STORAGE_KEY = 'weblinux-promptforge-templates'
const HISTORY_KEY = 'weblinux-promptforge-runs'

const CATEGORY_LABELS: Record<Category, string> = {
  writing: '写作',
  coding: '编程',
  analysis: '分析',
  creative: '创意',
  education: '教育',
  marketing: '营销',
  custom: '自定义',
}

const CATEGORY_COLORS: Record<Category, string> = {
  writing: '#3b82f6',
  coding: '#10b981',
  analysis: '#f59e0b',
  creative: '#ec4899',
  education: '#8b5cf6',
  marketing: '#ef4444',
  custom: '#6b7280',
}

// 内置精选模板库（开源社区常见的高质量提示词，未引用任何专有内容）
const BUILTIN_TEMPLATES: PromptTemplate[] = [
  {
    id: 'builtin-1',
    title: '代码审查助手',
    category: 'coding',
    content: '请审查以下 {{language}} 代码，从可读性、性能、安全性、潜在 bug 四个维度给出改进建议，并对每个问题给出修改后的代码片段：\n\n```{{language}}\n{{code}}\n```',
    description: '从四个维度审查代码并给出修改建议',
    tags: ['review', 'best-practice'],
    createdAt: Date.now(),
    updatedAt: Date.now(),
    usageCount: 0,
  },
  {
    id: 'builtin-2',
    title: '函数文档生成',
    category: 'coding',
    content: '为以下函数生成符合 JSDoc 规范的文档注释，包含参数说明、返回值、异常、使用示例（2 个）和边界条件：\n\n```{{language}}\n{{code}}\n```',
    tags: ['doc', 'jsdoc'],
    createdAt: Date.now(),
    updatedAt: Date.now(),
    usageCount: 0,
  },
  {
    id: 'builtin-3',
    title: '概念解释器',
    category: 'education',
    content: '请用 {{analogy}} 的类比向一个完全没有背景知识的人解释"{{concept}}"这个概念。要求：\n1. 不超过 300 字\n2. 至少给出 2 个具体的例子\n3. 指出常见的误解',
    tags: ['explain', 'learning'],
    createdAt: Date.now(),
    updatedAt: Date.now(),
    usageCount: 0,
  },
  {
    id: 'builtin-4',
    title: '邮件润色',
    category: 'writing',
    content: '请将以下邮件改写为更{{tone}}的语气，保持核心信息不变，输出改写后的邮件正文：\n\n主题：{{subject}}\n正文：{{body}}',
    tags: ['email', 'rewrite'],
    createdAt: Date.now(),
    updatedAt: Date.now(),
    usageCount: 0,
  },
  {
    id: 'builtin-5',
    title: '产品文案生成',
    category: 'marketing',
    content: '为产品"{{product}}"撰写一段 {{length}} 字的 {{platform}} 推广文案。\n产品定位：{{positioning}}\n目标用户：{{audience}}\n核心卖点：{{selling_points}}\n要求：包含 1 个钩子 + 3 个卖点 + 1 个 CTA',
    tags: ['copywriting', 'ads'],
    createdAt: Date.now(),
    updatedAt: Date.now(),
    usageCount: 0,
  },
  {
    id: 'builtin-6',
    title: '头脑风暴',
    category: 'creative',
    content: '围绕主题"{{topic}}"，请生成 {{count}} 个 {{style}} 的创意点子。每个点子包含：\n- 名称（10 字内）\n- 一句话描述\n- 实现难度（低/中/高）\n按创意度从高到低排序',
    tags: ['brainstorm', 'ideas'],
    createdAt: Date.now(),
    updatedAt: Date.now(),
    usageCount: 0,
  },
  {
    id: 'builtin-7',
    title: '数据洞察',
    category: 'analysis',
    content: '以下是一份 {{data_type}} 数据的描述：\n{{data_description}}\n\n请从三个角度分析：\n1. 数据中可能存在的异常点\n2. 三个值得深挖的洞察假设\n3. 推荐的可视化方式（含图表类型与轴定义）',
    tags: ['data', 'insight'],
    createdAt: Date.now(),
    updatedAt: Date.now(),
    usageCount: 0,
  },
  {
    id: 'builtin-8',
    title: '学习路径规划',
    category: 'education',
    content: '我想在 {{weeks}} 周内从零开始学习"{{skill}}"，每天可投入 {{hours}} 小时。\n请为我制定一份分周学习计划，包含：\n- 每周学习目标\n- 推荐资源类型（不指定具体名称）\n- 每周末的自测题目类型\n- 里程碑项目',
    tags: ['plan', 'roadmap'],
    createdAt: Date.now(),
    updatedAt: Date.now(),
    usageCount: 0,
  },
]

function uid() {
  return Math.random().toString(36).slice(2) + Date.now().toString(36)
}

function loadTemplates(): PromptTemplate[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return BUILTIN_TEMPLATES
    const data = JSON.parse(raw)
    if (!Array.isArray(data)) return BUILTIN_TEMPLATES
    // 合并内置模板（用户可删除，但首次保留）
    const builtinIds = new Set(BUILTIN_TEMPLATES.map((t) => t.id))
    const userTemplates = data.filter((t: PromptTemplate) => !builtinIds.has(t.id))
    return [...BUILTIN_TEMPLATES, ...userTemplates]
  } catch {
    return BUILTIN_TEMPLATES
  }
}

function saveTemplates(templates: PromptTemplate[]) {
  try {
    // 内置模板不持久化，避免版本更新后旧模板残留
    const builtinIds = new Set(BUILTIN_TEMPLATES.map((t) => t.id))
    const toSave = templates.filter((t) => !builtinIds.has(t.id))
    localStorage.setItem(STORAGE_KEY, JSON.stringify(toSave))
  } catch {
    /* ignore */
  }
}

function loadHistory(): TestRun[] {
  try {
    const raw = localStorage.getItem(HISTORY_KEY)
    if (!raw) return []
    const data = JSON.parse(raw)
    return Array.isArray(data) ? data.slice(0, 50) : []
  } catch {
    return []
  }
}

function saveHistory(history: TestRun[]) {
  try {
    localStorage.setItem(HISTORY_KEY, JSON.stringify(history.slice(0, 50)))
  } catch {
    /* ignore */
  }
}

/** 从模板内容中提取所有 {{变量名}} */
function extractVariables(content: string): string[] {
  const matches = content.match(/\{\{\s*([a-zA-Z_][\w]*)\s*\}\}/g) || []
  const seen = new Set<string>()
  const result: string[] = []
  for (const m of matches) {
    const name = m.replace(/[{}]/g, '').trim()
    if (!seen.has(name)) {
      seen.add(name)
      result.push(name)
    }
  }
  return result
}

/** 用变量值填充模板 */
function interpolate(content: string, vars: Record<string, string>): string {
  return content.replace(/\{\{\s*([a-zA-Z_][\w]*)\s*\}\}/g, (_, name: string) => {
    return vars[name] !== undefined && vars[name] !== '' ? vars[name] : `{{${name}}}`
  })
}

function PromptForge() {
  const [templates, setTemplates] = useState<PromptTemplate[]>(() => loadTemplates())
  const [activeId, setActiveId] = useState<string | null>(templates[0]?.id || null)
  const [search, setSearch] = useState('')
  const [filterCategory, setFilterCategory] = useState<Category | 'all'>('all')
  const [filterFavorite, setFilterFavorite] = useState(false)
  const [view, setView] = useState<'library' | 'editor' | 'runner' | 'history'>('library')

  // 编辑器状态
  const [editTitle, setEditTitle] = useState('')
  const [editCategory, setEditCategory] = useState<Category>('custom')
  const [editContent, setEditContent] = useState('')
  const [editDescription, setEditDescription] = useState('')
  const [editTags, setEditTags] = useState('')
  const [editingId, setEditingId] = useState<string | null>(null)

  // 运行器状态
  const [variables, setVariables] = useState<Record<string, string>>({})
  const [model, setModel] = useState('openai')
  const [temperature, setTemperature] = useState(0.7)
  const [output, setOutput] = useState('')
  const [streaming, setStreaming] = useState(true)
  const [running, setRunning] = useState(false)
  const [runError, setRunError] = useState('')
  const [optimizing, setOptimizing] = useState(false)

  const [history, setHistory] = useState<TestRun[]>(() => loadHistory())
  const [toast, setToast] = useState<{ msg: string; type: 'success' | 'error' | 'info' } | null>(null)

  const fileInputRef = useRef<HTMLInputElement>(null)

  // 持久化
  useEffect(() => {
    saveTemplates(templates)
  }, [templates])

  useEffect(() => {
    saveHistory(history)
  }, [history])

  // toast 自动隐藏
  useEffect(() => {
    if (!toast) return
    const t = setTimeout(() => setToast(null), 2500)
    return () => clearTimeout(t)
  }, [toast])

  const activeTemplate = useMemo(
    () => templates.find((t) => t.id === activeId) || null,
    [templates, activeId],
  )

  const variableNames = useMemo(
    () => (activeTemplate ? extractVariables(activeTemplate.content) : []),
    [activeTemplate],
  )

  const filteredTemplates = useMemo(() => {
    return templates.filter((t) => {
      if (filterCategory !== 'all' && t.category !== filterCategory) return false
      if (filterFavorite && !t.favorite) return false
      if (search.trim()) {
        const q = search.trim().toLowerCase()
        const hay = (t.title + ' ' + (t.description || '') + ' ' + t.tags.join(' ') + ' ' + t.content).toLowerCase()
        if (!hay.includes(q)) return false
      }
      return true
    })
  }, [templates, filterCategory, filterFavorite, search])

  // 当切换 active 模板时，重置变量
  useEffect(() => {
    setVariables({})
    setOutput('')
    setRunError('')
  }, [activeId])

  const startNew = useCallback(() => {
    setEditingId(null)
    setEditTitle('')
    setEditCategory('custom')
    setEditContent('')
    setEditDescription('')
    setEditTags('')
    setView('editor')
  }, [])

  const startEdit = useCallback((t: PromptTemplate) => {
    setEditingId(t.id)
    setEditTitle(t.title)
    setEditCategory(t.category)
    setEditContent(t.content)
    setEditDescription(t.description || '')
    setEditTags(t.tags.join(', '))
    setView('editor')
  }, [])

  const saveEdit = useCallback(() => {
    const title = editTitle.trim()
    if (!title) {
      setToast({ msg: '请填写模板标题', type: 'error' })
      return
    }
    if (!editContent.trim()) {
      setToast({ msg: '请填写模板内容', type: 'error' })
      return
    }
    const tags = editTags
      .split(/[,，]/)
      .map((s) => s.trim())
      .filter(Boolean)
    const now = Date.now()
    if (editingId) {
      setTemplates((prev) =>
        prev.map((t) =>
          t.id === editingId
            ? {
                ...t,
                title,
                category: editCategory,
                content: editContent,
                description: editDescription,
                tags,
                updatedAt: now,
              }
            : t,
        ),
      )
      setToast({ msg: '模板已更新', type: 'success' })
    } else {
      const newTemplate: PromptTemplate = {
        id: uid(),
        title,
        category: editCategory,
        content: editContent,
        description: editDescription,
        tags,
        createdAt: now,
        updatedAt: now,
        usageCount: 0,
      }
      setTemplates((prev) => [newTemplate, ...prev])
      setActiveId(newTemplate.id)
      setToast({ msg: '模板已创建', type: 'success' })
    }
    setView('library')
  }, [editTitle, editContent, editCategory, editDescription, editTags, editingId])

  const deleteTemplate = useCallback(
    (id: string) => {
      setTemplates((prev) => prev.filter((t) => t.id !== id))
      if (activeId === id) {
        setActiveId(templates.find((t) => t.id !== id)?.id || null)
      }
      setToast({ msg: '模板已删除', type: 'info' })
    },
    [activeId, templates],
  )

  const toggleFavorite = useCallback((id: string) => {
    setTemplates((prev) =>
      prev.map((t) => (t.id === id ? { ...t, favorite: !t.favorite } : t)),
    )
  }, [])

  const runPrompt = useCallback(async () => {
    if (!activeTemplate) return
    if (running) return

    const filled = interpolate(activeTemplate.content, variables)
    const hasUnfilled = /\{\{[^}]+\}\}/.test(filled)
    if (hasUnfilled) {
      setRunError('存在未填充的变量，请填写所有变量后再运行')
      setToast({ msg: '存在未填充的变量', type: 'error' })
      return
    }

    setRunning(true)
    setOutput('')
    setRunError('')
    const startTs = performance.now()

    const apiMessages: AIMessage[] = [
      { role: 'system', content: '你是一个严格遵循用户提示词指令的助手，按照用户的格式要求输出，不要添加额外的解释。' },
      { role: 'user', content: filled },
    ]

    let finalOutput = ''
    try {
      if (streaming) {
        finalOutput = await streamChat(
          apiMessages,
          (delta) => {
            setOutput((prev) => prev + delta)
          },
          { model, temperature },
        )
      } else {
        finalOutput = await chat(apiMessages, { model, temperature })
        setOutput(finalOutput)
      }
      setToast({ msg: '运行完成', type: 'success' })
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err)
      setRunError(`调用失败：${msg}`)
      setToast({ msg: '运行失败', type: 'error' })
    } finally {
      const durationMs = Math.round(performance.now() - startTs)
      const run: TestRun = {
        id: uid(),
        templateId: activeTemplate.id,
        input: filled,
        output: finalOutput || '',
        model,
        temperature,
        durationMs,
        timestamp: Date.now(),
        error: !!runError,
      }
      setHistory((prev) => [run, ...prev].slice(0, 50))
      // 更新使用次数
      setTemplates((prev) =>
        prev.map((t) =>
          t.id === activeTemplate.id ? { ...t, usageCount: t.usageCount + 1 } : t,
        ),
      )
      setRunning(false)
    }
  }, [activeTemplate, variables, running, streaming, model, temperature, runError])

  const optimizePrompt = useCallback(async () => {
    if (!activeTemplate) return
    if (optimizing) return

    setOptimizing(true)
    const optimizeInstruction = `你是一位资深提示词工程师。请优化下面的提示词，使其更清晰、更具体、更易于 AI 理解和执行。要求：

1. 输出优化后的提示词（用 \`\`\`text 代码块包裹）
2. 列出 3 条主要改进点
3. 给出 1 条使用建议

原始提示词：
"""
${activeTemplate.content}
"""`

    try {
      const result = await chat(
        [
          { role: 'system', content: '你是世界级的提示词工程专家，精通 GPT、Claude 等模型的提示词设计。' },
          { role: 'user', content: optimizeInstruction },
        ],
        { model: 'openai-large', temperature: 0.4 },
      )
      setOutput(result)
      setToast({ msg: '优化建议已生成', type: 'success' })
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err)
      setRunError(`优化失败：${msg}`)
      setToast({ msg: '优化失败', type: 'error' })
    } finally {
      setOptimizing(false)
    }
  }, [activeTemplate, optimizing])

  const copyOutput = useCallback(async () => {
    if (!output) return
    try {
      await navigator.clipboard.writeText(output)
      setToast({ msg: '已复制到剪贴板', type: 'success' })
    } catch {
      setToast({ msg: '复制失败', type: 'error' })
    }
  }, [output])

  const exportAll = useCallback(() => {
    const data = JSON.stringify(
      templates.filter((t) => !t.id.startsWith('builtin-')),
      null,
      2,
    )
    const blob = new Blob([data], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `promptforge-templates-${new Date().toISOString().slice(0, 10)}.json`
    a.click()
    URL.revokeObjectURL(url)
    setToast({ msg: '已导出', type: 'success' })
  }, [templates])

  const importJson = useCallback((file: File) => {
    const reader = new FileReader()
    reader.onload = () => {
      try {
        const data = JSON.parse(reader.result as string)
        if (!Array.isArray(data)) throw new Error('格式错误')
        const imported: PromptTemplate[] = []
        for (const item of data) {
          if (!item || typeof item !== 'object') continue
          if (!item.title || !item.content) continue
          imported.push({
            id: uid(),
            title: String(item.title),
            category: (item.category as Category) || 'custom',
            content: String(item.content),
            description: item.description ? String(item.description) : undefined,
            tags: Array.isArray(item.tags) ? item.tags.map(String) : [],
            favorite: Boolean(item.favorite),
            createdAt: Date.now(),
            updatedAt: Date.now(),
            usageCount: 0,
          })
        }
        if (imported.length === 0) {
          setToast({ msg: '未找到可用模板', type: 'error' })
          return
        }
        setTemplates((prev) => [...imported, ...prev])
        setToast({ msg: `成功导入 ${imported.length} 个模板`, type: 'success' })
      } catch (err) {
        setToast({
          msg: `导入失败：${err instanceof Error ? err.message : '解析错误'}`,
          type: 'error',
        })
      }
    }
    reader.readAsText(file)
  }, [])

  const renderOutputHtml = useCallback((content: string) => {
    try {
      return { __html: marked.parse(content, { async: false, breaks: true }) as string }
    } catch {
      return { __html: content.replace(/</g, '&lt;').replace(/>/g, '&gt;') }
    }
  }, [])

  return (
    <div style={styles.container}>
      {/* 侧边栏 */}
      <div style={styles.sidebar}>
        <div style={styles.sidebarHeader}>
          <div style={styles.brand}>
            <div style={{ ...styles.brandIcon, background: 'linear-gradient(135deg,#8b5cf6,#ec4899)' }}>
              <WandIcon size={16} />
            </div>
            <div>
              <div style={styles.brandName}>PromptForge</div>
              <div style={styles.brandSub}>提示词工程工作室</div>
            </div>
          </div>
          <button style={styles.newBtn} onClick={startNew} title="新建模板">
            ＋
          </button>
        </div>

        <div style={styles.searchBox}>
          <input
            style={styles.searchInput}
            placeholder="搜索模板..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>

        <div style={styles.filterRow}>
          <select
            style={styles.filterSelect}
            value={filterCategory}
            onChange={(e) => setFilterCategory(e.target.value as Category | 'all')}
          >
            <option value="all">全部分类</option>
            {(Object.keys(CATEGORY_LABELS) as Category[]).map((c) => (
              <option key={c} value={c}>
                {CATEGORY_LABELS[c]}
              </option>
            ))}
          </select>
          <button
            style={{
              ...styles.favBtn,
              ...(filterFavorite ? styles.favBtnActive : {}),
            }}
            onClick={() => setFilterFavorite((v) => !v)}
            title="只看收藏"
          >
            ★
          </button>
        </div>

        <div style={styles.convList}>
          {filteredTemplates.length === 0 && (
            <div style={styles.emptySidebar}>无匹配模板，点击 + 新建</div>
          )}
          {filteredTemplates.map((t) => (
            <div
              key={t.id}
              style={{
                ...styles.convItem,
                ...(t.id === activeId ? styles.convItemActive : {}),
              }}
              onClick={() => {
                setActiveId(t.id)
                setView('library')
              }}
            >
              <div style={styles.convTop}>
                <span
                  style={{
                    ...styles.categoryBadge,
                    background: CATEGORY_COLORS[t.category] + '22',
                    color: CATEGORY_COLORS[t.category],
                  }}
                >
                  {CATEGORY_LABELS[t.category]}
                </span>
                {t.favorite && <span style={styles.star}>★</span>}
              </div>
              <div style={styles.convTitle}>{t.title}</div>
              {t.description && <div style={styles.convDesc}>{t.description}</div>}
              <div style={styles.convMetaRow}>
                <span>{t.usageCount} 次</span>
                <span>{variableCountLabel(t.content)}</span>
              </div>
            </div>
          ))}
        </div>

        <div style={styles.sidebarFooter}>
          <button style={styles.footerBtn} onClick={exportAll} title="导出全部模板">
            导出 JSON
          </button>
          <button
            style={styles.footerBtn}
            onClick={() => fileInputRef.current?.click()}
            title="从 JSON 导入"
          >
            导入 JSON
          </button>
          <input
            ref={fileInputRef}
            type="file"
            accept=".json,application/json"
            style={{ display: 'none' }}
            onChange={(e) => {
              const f = e.target.files?.[0]
              if (f) importJson(f)
              e.target.value = ''
            }}
          />
        </div>
      </div>

      {/* 主区域 */}
      <div style={styles.main}>
        {/* 顶部 Tab */}
        <div style={styles.tabBar}>
          <button
            style={{ ...styles.tab, ...(view === 'library' ? styles.tabActive : {}) }}
            onClick={() => setView('library')}
          >
            模板详情
          </button>
          <button
            style={{ ...styles.tab, ...(view === 'editor' ? styles.tabActive : {}) }}
            onClick={() => activeTemplate && startEdit(activeTemplate)}
            disabled={!activeTemplate}
          >
            编辑
          </button>
          <button
            style={{ ...styles.tab, ...(view === 'runner' ? styles.tabActive : {}) }}
            onClick={() => setView('runner')}
            disabled={!activeTemplate}
          >
            运行测试
          </button>
          <button
            style={{ ...styles.tab, ...(view === 'history' ? styles.tabActive : {}) }}
            onClick={() => setView('history')}
          >
            历史 ({history.length})
          </button>
          <div style={{ flex: 1 }} />
          <div style={styles.toolbarRight}>
            <span style={styles.poweredBy}>Pollinations.ai · 免费无 Key</span>
          </div>
        </div>

        {/* 内容区 */}
        <div style={styles.content}>
          {!activeTemplate && view !== 'editor' && (
            <div style={styles.emptyMain}>
              <WandIcon size={64} />
              <h2>PromptForge 提示词工程工作室</h2>
              <p>从左侧选择一个模板，或点击 + 创建新模板，开始你的提示词工程之旅。</p>
              <p style={styles.hint}>
                支持 {'{{变量名}}'} 插值、实时 AI 测试、一键优化建议、导入导出。
              </p>
            </div>
          )}

          {view === 'library' && activeTemplate && (
            <div style={styles.detailView}>
              <div style={styles.detailHeader}>
                <div>
                  <span
                    style={{
                      ...styles.categoryBadge,
                      background: CATEGORY_COLORS[activeTemplate.category] + '22',
                      color: CATEGORY_COLORS[activeTemplate.category],
                    }}
                  >
                    {CATEGORY_LABELS[activeTemplate.category]}
                  </span>
                  <h2 style={styles.detailTitle}>{activeTemplate.title}</h2>
                  {activeTemplate.description && (
                    <p style={styles.detailDesc}>{activeTemplate.description}</p>
                  )}
                </div>
                <div style={styles.detailActions}>
                  <button
                    style={styles.iconBtn}
                    onClick={() => toggleFavorite(activeTemplate.id)}
                    title={activeTemplate.favorite ? '取消收藏' : '收藏'}
                  >
                    {activeTemplate.favorite ? '★' : '☆'}
                  </button>
                  <button
                    style={styles.iconBtn}
                    onClick={() => startEdit(activeTemplate)}
                    title="编辑"
                  >
                    编辑
                  </button>
                  <button
                    style={styles.iconBtn}
                    onClick={() => setView('runner')}
                    title="运行测试"
                  >
                    运行
                  </button>
                  <button
                    style={{ ...styles.iconBtn, color: '#ef4444' }}
                    onClick={() => deleteTemplate(activeTemplate.id)}
                    title="删除"
                  >
                    删除
                  </button>
                </div>
              </div>

              <div style={styles.detailSection}>
                <div style={styles.sectionLabel}>提示词内容</div>
                <pre style={styles.codeBlock}>{activeTemplate.content}</pre>
              </div>

              {variableNames.length > 0 && (
                <div style={styles.detailSection}>
                  <div style={styles.sectionLabel}>变量列表 ({variableNames.length})</div>
                  <div style={styles.varList}>
                    {variableNames.map((v) => (
                      <span key={v} style={styles.varBadge}>
                        {'{{' + v + '}}'}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {activeTemplate.tags.length > 0 && (
                <div style={styles.detailSection}>
                  <div style={styles.sectionLabel}>标签</div>
                  <div style={styles.varList}>
                    {activeTemplate.tags.map((tag) => (
                      <span key={tag} style={styles.tagBadge}>
                        #{tag}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              <div style={styles.detailMeta}>
                <span>创建: {new Date(activeTemplate.createdAt).toLocaleString('zh-CN')}</span>
                <span>更新: {new Date(activeTemplate.updatedAt).toLocaleString('zh-CN')}</span>
                <span>使用: {activeTemplate.usageCount} 次</span>
              </div>
            </div>
          )}

          {view === 'editor' && (
            <div style={styles.editorView}>
              <div style={styles.formRow}>
                <label style={styles.formLabel}>标题</label>
                <input
                  style={styles.formInput}
                  value={editTitle}
                  onChange={(e) => setEditTitle(e.target.value)}
                  placeholder="例如：代码审查助手"
                />
              </div>
              <div style={styles.formRow}>
                <label style={styles.formLabel}>分类</label>
                <select
                  style={styles.formInput}
                  value={editCategory}
                  onChange={(e) => setEditCategory(e.target.value as Category)}
                >
                  {(Object.keys(CATEGORY_LABELS) as Category[]).map((c) => (
                    <option key={c} value={c}>
                      {CATEGORY_LABELS[c]}
                    </option>
                  ))}
                </select>
              </div>
              <div style={styles.formRow}>
                <label style={styles.formLabel}>描述（可选）</label>
                <input
                  style={styles.formInput}
                  value={editDescription}
                  onChange={(e) => setEditDescription(e.target.value)}
                  placeholder="一句话说明这个模板的用途"
                />
              </div>
              <div style={styles.formRow}>
                <label style={styles.formLabel}>
                  内容
                  <span style={styles.formHint}>（用 {'{{变量名}}'} 标记可插值变量）</span>
                </label>
                <textarea
                  style={{ ...styles.formInput, ...styles.textarea }}
                  value={editContent}
                  onChange={(e) => setEditContent(e.target.value)}
                  placeholder="例如：请把以下 {{language}} 代码改写成更简洁的版本：&#10;&#10;{{code}}"
                />
              </div>
              <div style={styles.formRow}>
                <label style={styles.formLabel}>标签（逗号分隔）</label>
                <input
                  style={styles.formInput}
                  value={editTags}
                  onChange={(e) => setEditTags(e.target.value)}
                  placeholder="例如：review, best-practice"
                />
              </div>
              {editContent && extractVariables(editContent).length > 0 && (
                <div style={styles.varPreview}>
                  <span style={styles.sectionLabel}>检测到的变量：</span>
                  {extractVariables(editContent).map((v) => (
                    <span key={v} style={styles.varBadge}>
                      {v}
                    </span>
                  ))}
                </div>
              )}
              <div style={styles.formActions}>
                <button style={styles.primaryBtn} onClick={saveEdit}>
                  保存
                </button>
                <button
                  style={styles.secondaryBtn}
                  onClick={() => {
                    if (editingId) {
                      setView('library')
                    } else {
                      setView(activeTemplate ? 'library' : 'library')
                    }
                  }}
                >
                  取消
                </button>
              </div>
            </div>
          )}

          {view === 'runner' && activeTemplate && (
            <div style={styles.runnerView}>
              <div style={styles.runnerLeft}>
                <div style={styles.sectionLabel}>变量填充</div>
                {variableNames.length === 0 ? (
                  <div style={styles.noVar}>该模板没有变量，可直接运行。</div>
                ) : (
                  variableNames.map((name) => (
                    <div key={name} style={styles.varField}>
                      <label style={styles.varLabel}>{'{'}{name}{'}'}</label>
                      <textarea
                        style={{ ...styles.formInput, ...styles.varTextarea }}
                        value={variables[name] || ''}
                        onChange={(e) =>
                          setVariables((prev) => ({ ...prev, [name]: e.target.value }))
                        }
                        placeholder={`请输入 ${name} 的值`}
                      />
                    </div>
                  ))
                )}

                <div style={styles.runnerSettings}>
                  <div style={styles.settingRow}>
                    <label style={styles.formLabel}>模型</label>
                    <select
                      style={styles.formInput}
                      value={model}
                      onChange={(e) => setModel(e.target.value)}
                    >
                      {AVAILABLE_TEXT_MODELS.map((m) => (
                        <option key={m.name} value={m.name}>
                          {m.name}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div style={styles.settingRow}>
                    <label style={styles.formLabel}>
                      温度: {temperature.toFixed(1)}
                    </label>
                    <input
                      type="range"
                      min="0"
                      max="2"
                      step="0.1"
                      value={temperature}
                      onChange={(e) => setTemperature(parseFloat(e.target.value))}
                      style={styles.slider}
                    />
                  </div>
                  <label style={styles.checkboxRow}>
                    <input
                      type="checkbox"
                      checked={streaming}
                      onChange={(e) => setStreaming(e.target.checked)}
                    />
                    <span>流式输出</span>
                  </label>
                </div>

                <div style={styles.runnerActions}>
                  <button
                    style={{ ...styles.primaryBtn, ...(running ? styles.disabledBtn : {}) }}
                    onClick={runPrompt}
                    disabled={running}
                  >
                    {running ? '运行中...' : '运行提示词'}
                  </button>
                  <button
                    style={{
                      ...styles.secondaryBtn,
                      ...(optimizing ? styles.disabledBtn : {}),
                    }}
                    onClick={optimizePrompt}
                    disabled={optimizing}
                    title="让 AI 反向优化当前提示词"
                  >
                    {optimizing ? '优化中...' : '一键优化'}
                  </button>
                </div>

                <div style={styles.previewBox}>
                  <div style={styles.sectionLabel}>填充后预览</div>
                  <pre style={styles.previewCode}>
                    {interpolate(activeTemplate.content, variables)}
                  </pre>
                </div>
              </div>

              <div style={styles.runnerRight}>
                <div style={styles.outputHeader}>
                  <div style={styles.sectionLabel}>AI 输出</div>
                  <div style={styles.outputActions}>
                    <button
                      style={styles.smallBtn}
                      onClick={copyOutput}
                      disabled={!output}
                    >
                      复制
                    </button>
                    <button
                      style={styles.smallBtn}
                      onClick={() => setOutput('')}
                      disabled={!output}
                    >
                      清空
                    </button>
                  </div>
                </div>
                {runError && <div style={styles.errorBox}>{runError}</div>}
                {!output && !runError && !running && (
                  <div style={styles.outputEmpty}>
                    <LightbulbIcon size={40} />
                    <p>点击"运行提示词"或"一键优化"查看 AI 输出</p>
                  </div>
                )}
                {output && (
                  <div
                    style={styles.outputContent}
                    dangerouslySetInnerHTML={renderOutputHtml(output)}
                  />
                )}
                {running && !output && <div style={styles.loading}>AI 正在思考...</div>}
              </div>
            </div>
          )}

          {view === 'history' && (
            <div style={styles.historyView}>
              {history.length === 0 ? (
                <div style={styles.emptyMain}>
                  <SparklesIcon size={48} />
                  <h3>暂无历史记录</h3>
                  <p>运行过的提示词会自动保存到这里（最多 50 条）。</p>
                </div>
              ) : (
                history.map((run) => {
                  const tpl = templates.find((t) => t.id === run.templateId)
                  return (
                    <div key={run.id} style={styles.historyCard}>
                      <div style={styles.historyHeader}>
                        <strong>{tpl?.title || '已删除的模板'}</strong>
                        <span style={styles.historyTime}>
                          {new Date(run.timestamp).toLocaleString('zh-CN')}
                        </span>
                      </div>
                      <div style={styles.historyMeta}>
                        <span>模型: {run.model}</span>
                        <span>温度: {run.temperature}</span>
                        <span>耗时: {(run.durationMs / 1000).toFixed(2)}s</span>
                        {run.error && <span style={styles.errorTag}>失败</span>}
                      </div>
                      <details style={styles.historyDetails}>
                        <summary style={styles.historySummary}>查看输入</summary>
                        <pre style={styles.historyPre}>{run.input}</pre>
                      </details>
                      {run.output && (
                        <details style={styles.historyDetails} open>
                          <summary style={styles.historySummary}>查看输出</summary>
                          <div
                            style={styles.historyOutput}
                            dangerouslySetInnerHTML={renderOutputHtml(run.output)}
                          />
                        </details>
                      )}
                    </div>
                  )
                })
              )}
            </div>
          )}
        </div>
      </div>

      {/* Toast */}
      {toast && (
        <div
          style={{
            ...styles.toast,
            ...(toast.type === 'success' ? styles.toastSuccess : {}),
            ...(toast.type === 'error' ? styles.toastError : {}),
            ...(toast.type === 'info' ? styles.toastInfo : {}),
          }}
        >
          {toast.msg}
        </div>
      )}
    </div>
  )
}

function variableCountLabel(content: string): string {
  const count = extractVariables(content).length
  return count === 0 ? '无变量' : `${count} 变量`
}

const styles: Record<string, React.CSSProperties> = {
  container: {
    display: 'flex',
    height: '100%',
    width: '100%',
    background: '#0f172a',
    color: '#e2e8f0',
    fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
    fontSize: 14,
    overflow: 'hidden',
  },
  sidebar: {
    width: 280,
    minWidth: 280,
    background: '#1e293b',
    borderRight: '1px solid #334155',
    display: 'flex',
    flexDirection: 'column',
  },
  sidebarHeader: {
    padding: '14px 14px 10px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderBottom: '1px solid #334155',
  },
  brand: {
    display: 'flex',
    alignItems: 'center',
    gap: 10,
  },
  brandIcon: {
    width: 32,
    height: 32,
    borderRadius: 8,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    color: '#fff',
    flexShrink: 0,
  },
  brandName: {
    fontWeight: 700,
    fontSize: 15,
    color: '#f1f5f9',
  },
  brandSub: {
    fontSize: 11,
    color: '#94a3b8',
  },
  newBtn: {
    width: 28,
    height: 28,
    borderRadius: 6,
    border: '1px solid #475569',
    background: '#334155',
    color: '#e2e8f0',
    cursor: 'pointer',
    fontSize: 16,
    lineHeight: 1,
  },
  searchBox: {
    padding: '10px 12px 6px',
  },
  searchInput: {
    width: '100%',
    padding: '6px 10px',
    background: '#0f172a',
    border: '1px solid #334155',
    borderRadius: 6,
    color: '#e2e8f0',
    fontSize: 13,
    outline: 'none',
    boxSizing: 'border-box',
  },
  filterRow: {
    padding: '0 12px 8px',
    display: 'flex',
    gap: 6,
  },
  filterSelect: {
    flex: 1,
    padding: '4px 8px',
    background: '#0f172a',
    border: '1px solid #334155',
    borderRadius: 6,
    color: '#e2e8f0',
    fontSize: 12,
    outline: 'none',
  },
  favBtn: {
    width: 32,
    padding: '4px 0',
    background: '#0f172a',
    border: '1px solid #334155',
    borderRadius: 6,
    color: '#94a3b8',
    cursor: 'pointer',
    fontSize: 13,
  },
  favBtnActive: {
    color: '#fbbf24',
    borderColor: '#fbbf24',
  },
  convList: {
    flex: 1,
    overflowY: 'auto',
    padding: '0 8px',
  },
  emptySidebar: {
    padding: 24,
    textAlign: 'center',
    color: '#64748b',
    fontSize: 13,
  },
  convItem: {
    padding: 10,
    borderRadius: 6,
    marginBottom: 4,
    cursor: 'pointer',
    border: '1px solid transparent',
  },
  convItemActive: {
    background: '#334155',
    borderColor: '#475569',
  },
  convTop: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  categoryBadge: {
    padding: '1px 6px',
    borderRadius: 4,
    fontSize: 10,
    fontWeight: 600,
  },
  star: {
    color: '#fbbf24',
    fontSize: 12,
  },
  convTitle: {
    fontWeight: 600,
    color: '#f1f5f9',
    fontSize: 13,
    marginBottom: 2,
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap',
  },
  convDesc: {
    color: '#94a3b8',
    fontSize: 11,
    marginBottom: 4,
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap',
  },
  convMetaRow: {
    display: 'flex',
    justifyContent: 'space-between',
    color: '#64748b',
    fontSize: 10,
  },
  sidebarFooter: {
    padding: 8,
    borderTop: '1px solid #334155',
    display: 'flex',
    gap: 6,
  },
  footerBtn: {
    flex: 1,
    padding: '6px 8px',
    background: '#334155',
    border: '1px solid #475569',
    borderRadius: 6,
    color: '#cbd5e1',
    cursor: 'pointer',
    fontSize: 12,
  },
  main: {
    flex: 1,
    display: 'flex',
    flexDirection: 'column',
    overflow: 'hidden',
  },
  tabBar: {
    display: 'flex',
    alignItems: 'center',
    padding: '0 12px',
    borderBottom: '1px solid #334155',
    background: '#1e293b',
    gap: 4,
  },
  tab: {
    padding: '10px 14px',
    background: 'transparent',
    border: 'none',
    borderBottom: '2px solid transparent',
    color: '#94a3b8',
    cursor: 'pointer',
    fontSize: 13,
  },
  tabActive: {
    color: '#e2e8f0',
    borderBottomColor: '#8b5cf6',
  },
  toolbarRight: {
    display: 'flex',
    alignItems: 'center',
  },
  poweredBy: {
    color: '#64748b',
    fontSize: 11,
  },
  content: {
    flex: 1,
    overflow: 'auto',
    padding: 20,
  },
  emptyMain: {
    height: '100%',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    textAlign: 'center',
    color: '#64748b',
    gap: 8,
  },
  hint: {
    color: '#475569',
    fontSize: 12,
    marginTop: 4,
  },
  detailView: {
    maxWidth: 900,
    margin: '0 auto',
  },
  detailHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 20,
    gap: 16,
  },
  detailTitle: {
    fontSize: 22,
    color: '#f1f5f9',
    margin: '8px 0 4px',
  },
  detailDesc: {
    color: '#94a3b8',
    fontSize: 13,
    margin: 0,
  },
  detailActions: {
    display: 'flex',
    gap: 6,
    flexShrink: 0,
  },
  iconBtn: {
    padding: '6px 10px',
    background: '#334155',
    border: '1px solid #475569',
    borderRadius: 6,
    color: '#cbd5e1',
    cursor: 'pointer',
    fontSize: 12,
  },
  detailSection: {
    marginBottom: 16,
  },
  sectionLabel: {
    fontSize: 12,
    color: '#94a3b8',
    marginBottom: 6,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  codeBlock: {
    background: '#0f172a',
    border: '1px solid #334155',
    borderRadius: 8,
    padding: 14,
    color: '#e2e8f0',
    fontFamily: 'ui-monospace, monospace',
    fontSize: 13,
    whiteSpace: 'pre-wrap',
    wordBreak: 'break-word',
    margin: 0,
  },
  varList: {
    display: 'flex',
    flexWrap: 'wrap',
    gap: 6,
  },
  varBadge: {
    padding: '3px 8px',
    background: '#1e293b',
    border: '1px solid #475569',
    borderRadius: 4,
    color: '#a78bfa',
    fontFamily: 'ui-monospace, monospace',
    fontSize: 12,
  },
  tagBadge: {
    padding: '3px 8px',
    background: '#1e293b',
    border: '1px solid #475569',
    borderRadius: 4,
    color: '#60a5fa',
    fontSize: 12,
  },
  detailMeta: {
    display: 'flex',
    gap: 16,
    color: '#64748b',
    fontSize: 12,
    marginTop: 16,
    paddingTop: 12,
    borderTop: '1px solid #334155',
  },
  editorView: {
    maxWidth: 800,
    margin: '0 auto',
  },
  formRow: {
    marginBottom: 14,
  },
  formLabel: {
    display: 'block',
    color: '#cbd5e1',
    fontSize: 13,
    marginBottom: 4,
    fontWeight: 500,
  },
  formHint: {
    color: '#64748b',
    fontSize: 11,
    marginLeft: 6,
    fontWeight: 400,
  },
  formInput: {
    width: '100%',
    padding: '8px 10px',
    background: '#0f172a',
    border: '1px solid #334155',
    borderRadius: 6,
    color: '#e2e8f0',
    fontSize: 13,
    outline: 'none',
    boxSizing: 'border-box',
    fontFamily: 'inherit',
  },
  textarea: {
    minHeight: 180,
    resize: 'vertical',
    fontFamily: 'ui-monospace, monospace',
    lineHeight: 1.5,
  },
  varPreview: {
    padding: 10,
    background: '#1e293b',
    border: '1px solid #475569',
    borderRadius: 6,
    marginBottom: 14,
    display: 'flex',
    flexWrap: 'wrap',
    gap: 6,
    alignItems: 'center',
  },
  formActions: {
    display: 'flex',
    gap: 8,
    marginTop: 20,
  },
  primaryBtn: {
    padding: '8px 18px',
    background: 'linear-gradient(135deg,#8b5cf6,#ec4899)',
    border: 'none',
    borderRadius: 6,
    color: '#fff',
    cursor: 'pointer',
    fontSize: 13,
    fontWeight: 600,
  },
  secondaryBtn: {
    padding: '8px 18px',
    background: '#334155',
    border: '1px solid #475569',
    borderRadius: 6,
    color: '#cbd5e1',
    cursor: 'pointer',
    fontSize: 13,
  },
  disabledBtn: {
    opacity: 0.5,
    cursor: 'not-allowed',
  },
  runnerView: {
    display: 'flex',
    gap: 16,
    height: '100%',
    alignItems: 'stretch',
  },
  runnerLeft: {
    flex: 1,
    minWidth: 300,
    display: 'flex',
    flexDirection: 'column',
    gap: 12,
  },
  noVar: {
    padding: 12,
    background: '#1e293b',
    borderRadius: 6,
    color: '#94a3b8',
    fontSize: 13,
    textAlign: 'center',
  },
  varField: {
    marginBottom: 8,
  },
  varLabel: {
    display: 'block',
    color: '#a78bfa',
    fontFamily: 'ui-monospace, monospace',
    fontSize: 12,
    marginBottom: 4,
  },
  varTextarea: {
    minHeight: 60,
    resize: 'vertical',
    fontFamily: 'ui-monospace, monospace',
  },
  runnerSettings: {
    padding: 12,
    background: '#1e293b',
    borderRadius: 8,
    border: '1px solid #334155',
  },
  settingRow: {
    marginBottom: 10,
  },
  slider: {
    width: '100%',
    accentColor: '#8b5cf6',
  },
  checkboxRow: {
    display: 'flex',
    alignItems: 'center',
    gap: 6,
    color: '#cbd5e1',
    fontSize: 13,
    cursor: 'pointer',
  },
  runnerActions: {
    display: 'flex',
    gap: 8,
  },
  previewBox: {
    flex: 1,
    display: 'flex',
    flexDirection: 'column',
    minHeight: 100,
  },
  previewCode: {
    flex: 1,
    background: '#0f172a',
    border: '1px solid #334155',
    borderRadius: 8,
    padding: 12,
    color: '#94a3b8',
    fontFamily: 'ui-monospace, monospace',
    fontSize: 12,
    whiteSpace: 'pre-wrap',
    wordBreak: 'break-word',
    margin: 0,
    overflow: 'auto',
  },
  runnerRight: {
    flex: 1,
    minWidth: 300,
    background: '#1e293b',
    border: '1px solid #334155',
    borderRadius: 8,
    padding: 12,
    display: 'flex',
    flexDirection: 'column',
    overflow: 'hidden',
  },
  outputHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  outputActions: {
    display: 'flex',
    gap: 4,
  },
  smallBtn: {
    padding: '3px 8px',
    background: '#334155',
    border: '1px solid #475569',
    borderRadius: 4,
    color: '#cbd5e1',
    cursor: 'pointer',
    fontSize: 11,
  },
  errorBox: {
    padding: 10,
    background: 'rgba(239,68,68,0.1)',
    border: '1px solid #ef4444',
    borderRadius: 6,
    color: '#fca5a5',
    fontSize: 12,
    marginBottom: 8,
  },
  outputEmpty: {
    flex: 1,
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    color: '#64748b',
    gap: 8,
    textAlign: 'center',
  },
  outputContent: {
    flex: 1,
    overflow: 'auto',
    color: '#e2e8f0',
    fontSize: 13,
    lineHeight: 1.6,
    padding: 4,
  },
  loading: {
    color: '#94a3b8',
    fontSize: 13,
    textAlign: 'center',
    padding: 20,
  },
  historyView: {
    display: 'flex',
    flexDirection: 'column',
    gap: 10,
    maxWidth: 900,
    margin: '0 auto',
  },
  historyCard: {
    background: '#1e293b',
    border: '1px solid #334155',
    borderRadius: 8,
    padding: 12,
  },
  historyHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  historyTime: {
    color: '#64748b',
    fontSize: 11,
  },
  historyMeta: {
    display: 'flex',
    gap: 12,
    color: '#94a3b8',
    fontSize: 11,
    marginBottom: 8,
  },
  errorTag: {
    color: '#fca5a5',
    background: 'rgba(239,68,68,0.15)',
    padding: '1px 6px',
    borderRadius: 3,
  },
  historyDetails: {
    marginBottom: 6,
  },
  historySummary: {
    cursor: 'pointer',
    color: '#cbd5e1',
    fontSize: 12,
    padding: '4px 0',
  },
  historyPre: {
    background: '#0f172a',
    border: '1px solid #334155',
    borderRadius: 6,
    padding: 10,
    color: '#94a3b8',
    fontFamily: 'ui-monospace, monospace',
    fontSize: 12,
    whiteSpace: 'pre-wrap',
    wordBreak: 'break-word',
    margin: '6px 0 0',
  },
  historyOutput: {
    background: '#0f172a',
    border: '1px solid #334155',
    borderRadius: 6,
    padding: 10,
    color: '#e2e8f0',
    fontSize: 13,
    lineHeight: 1.6,
    margin: '6px 0 0',
    overflow: 'auto',
  },
  toast: {
    position: 'absolute',
    bottom: 20,
    left: '50%',
    transform: 'translateX(-50%)',
    padding: '10px 18px',
    borderRadius: 6,
    color: '#fff',
    fontSize: 13,
    boxShadow: '0 4px 16px rgba(0,0,0,0.3)',
    zIndex: 100,
  },
  toastSuccess: {
    background: 'linear-gradient(135deg,#10b981,#059669)',
  },
  toastError: {
    background: 'linear-gradient(135deg,#ef4444,#dc2626)',
  },
  toastInfo: {
    background: 'linear-gradient(135deg,#3b82f6,#2563eb)',
  },
}

export default memo(PromptForge)
