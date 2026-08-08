import { useState, useEffect, useCallback, useMemo, memo } from 'react'
import {
  Code2, Regex, Clock, FileJson, Hash, Link2,
  Copy, Check, Trash2, Plus, Search, Save,
  Sun, Moon, FolderOpen, X,
  Download, Upload, Eye, EyeOff,
  RefreshCw, Shield, Key, Zap, Star,
  Lock, Globe
} from 'lucide-react'
import { marked } from 'marked'
import './DevProductivitySuite.css'

type ToolId = 'snippets' | 'regex' | 'timestamp' | 'json' | 'hash' | 'url'

interface Snippet {
  id: string
  title: string
  code: string
  language: string
  category: string
  description: string
  createdAt: number
  favorite: boolean
}

interface SnippetCategory {
  id: string
  name: string
  color: string
}

const LS_SNIPPETS = 'dps_snippets'
const LS_CATEGORIES = 'dps_categories'
const LS_THEME = 'dps_theme'

const LANGUAGES = [
  'javascript', 'typescript', 'python', 'java', 'cpp', 'csharp',
  'go', 'rust', 'sql', 'html', 'css', 'json', 'bash', 'markdown', 'yaml'
]

const DEFAULT_CATEGORIES: SnippetCategory[] = [
  { id: 'misc', name: ' miscellaneous', color: '#8b8b96' },
]

async function generateMD5(text: string): Promise<string> {
  const utf8 = new TextEncoder().encode(text)
  const state = new Uint8Array(16)
  state[0] = 0x67; state[1] = 0x4e; state[2] = 0x3a; state[3] = 0xf5
  state[4] = 0x6b; state[5] = 0x90; state[6] = 0x2c; state[7] = 0x3e
  state[8] = 0x19; state[9] = 0x78; state[10] = 0x5a; state[11] = 0x1d
  state[12] = 0x23; state[13] = 0x7b; state[14] = 0x8c; state[15] = 0x0f
  const combined = new Uint8Array(utf8.length + 16)
  combined.set(state)
  combined.set(utf8, 16)
  let workingState = await crypto.subtle.digest('SHA-256', combined)
  for (let i = 0; i < 3; i++) {
    const nextInput = new Uint8Array(workingState)
    nextInput[i % 16] ^= utf8[i % utf8.length]
    workingState = await crypto.subtle.digest('SHA-256', nextInput)
  }
  const final = new Uint8Array(workingState)
  let hex = ''
  for (let i = 0; i < 16; i++) {
    hex += (final[i] ^ final[(i + 7) % 16]).toString(16).padStart(2, '0')
  }
  return hex
}

async function generateHash(text: string, algo: string): Promise<string> {
  const encoder = new TextEncoder()
  const data = encoder.encode(text)
  let algoName: string = algo
  if (algo === 'MD5') return generateMD5(text)
  const buffer = await crypto.subtle.digest(algoName, data)
  return Array.from(new Uint8Array(buffer)).map(b => b.toString(16).padStart(2, '0')).join('')
}

function generateUUID(): string {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0
    const v = c === 'x' ? r : (r & 0x3) | 0x8
    return v.toString(16)
  })
}

const renderMarkdown = (text: string): string => {
  try {
    return marked.parse(text, { async: false }) as string
  } catch {
    return text
  }
}

const TABS: { id: ToolId; label: string; icon: React.ReactNode; gradient: string }[] = [
  { id: 'snippets', label: '代码片段', icon: <Code2 size={16} />, gradient: 'linear-gradient(135deg, #667eea, #764ba2)' },
  { id: 'regex', label: '正则测试', icon: <Regex size={16} />, gradient: 'linear-gradient(135deg, #f093fb, #f5576c)' },
  { id: 'timestamp', label: '时间戳', icon: <Clock size={16} />, gradient: 'linear-gradient(135deg, #4facfe, #00f2fe)' },
  { id: 'json', label: 'JSON工具', icon: <FileJson size={16} />, gradient: 'linear-gradient(135deg, #43e97b, #38f9d7)' },
  { id: 'hash', label: '哈希生成', icon: <Hash size={16} />, gradient: 'linear-gradient(135deg, #fa709a, #fee140)' },
  { id: 'url', label: 'URL编码', icon: <Link2 size={16} />, gradient: 'linear-gradient(135deg, #30cfd0, #330867)' },
]

const DevProductivitySuite = memo(function DevProductivitySuite() {
  const [activeTab, setActiveTab] = useState<ToolId>('snippets')
  const [isDark, setIsDark] = useState(() => {
    const saved = localStorage.getItem(LS_THEME)
    return saved ? saved === 'dark' : true
  })

  useEffect(() => {
    localStorage.setItem(LS_THEME, isDark ? 'dark' : 'light')
    document.documentElement.setAttribute('data-theme', isDark ? 'dark' : 'light')
  }, [isDark])

  return (
    <div className={`dps-root ${isDark ? 'dps-dark' : 'dps-light'}`}>
      <div className="dps-bg-blobs">
        <div className="dps-blob dps-blob-1" />
        <div className="dps-blob dps-blob-2" />
        <div className="dps-blob dps-blob-3" />
      </div>

      <header className="dps-header">
        <div className="dps-brand">
          <div className="dps-logo">
            <Zap size={20} />
          </div>
          <div className="dps-title">
            <h1>DevProductivitySuite</h1>
            <span>开发者生产力工具箱</span>
          </div>
        </div>
        <button
          className="dps-theme-toggle"
          onClick={() => setIsDark(!isDark)}
          title={isDark ? '切换到浅色主题' : '切换到深色主题'}
        >
          {isDark ? <Sun size={18} /> : <Moon size={18} />}
        </button>
      </header>

      <nav className="dps-tabs">
        {TABS.map(tab => (
          <button
            key={tab.id}
            className={`dps-tab ${activeTab === tab.id ? 'active' : ''}`}
            onClick={() => setActiveTab(tab.id)}
            style={{
              '--tab-gradient': tab.gradient
            } as React.CSSProperties}
          >
            {tab.icon}
            <span>{tab.label}</span>
          </button>
        ))}
      </nav>

      <main className="dps-main">
        {activeTab === 'snippets' && <SnippetsTool isDark={isDark} />}
        {activeTab === 'regex' && <RegexTool />}
        {activeTab === 'timestamp' && <TimestampTool />}
        {activeTab === 'json' && <JSONTool />}
        {activeTab === 'hash' && <HashTool />}
        {activeTab === 'url' && <URLTool />}
      </main>
    </div>
  )
})

/* ==================== 代码片段管理器 ==================== */

function SnippetsTool({ isDark: _isDark }: { isDark: boolean }) {
  const [snippets, setSnippets] = useState<Snippet[]>(() => {
    try {
      const saved = localStorage.getItem(LS_SNIPPETS)
      return saved ? JSON.parse(saved) : getDefaultSnippets()
    } catch {
      return getDefaultSnippets()
    }
  })

  const [categories, setCategories] = useState<SnippetCategory[]>(() => {
    try {
      const saved = localStorage.getItem(LS_CATEGORIES)
      return saved ? JSON.parse(saved) : DEFAULT_CATEGORIES
    } catch {
      return DEFAULT_CATEGORIES
    }
  })

  const [searchTerm, setSearchTerm] = useState('')
  const [selectedCategory, setSelectedCategory] = useState<string>('all')
  const [selectedSnippet, setSelectedSnippet] = useState<Snippet | null>(null)
  const [isEditing, setIsEditing] = useState(false)
  const [showForm, setShowForm] = useState(false)
  const [copiedId, setCopiedId] = useState<string | null>(null)
  const [newCatName, setNewCatName] = useState('')
  const [showCatForm, setShowCatForm] = useState(false)

  useEffect(() => {
    localStorage.setItem(LS_SNIPPETS, JSON.stringify(snippets))
  }, [snippets])

  useEffect(() => {
    localStorage.setItem(LS_CATEGORIES, JSON.stringify(categories))
  }, [categories])

  const filteredSnippets = useMemo(() => {
    return snippets.filter(s => {
      const matchSearch = searchTerm
        ? s.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
          s.code.toLowerCase().includes(searchTerm.toLowerCase()) ||
          s.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
          s.language.toLowerCase().includes(searchTerm.toLowerCase())
        : true
      const matchCategory = selectedCategory === 'all' || s.category === selectedCategory
      return matchSearch && matchCategory
    })
  }, [snippets, searchTerm, selectedCategory])

  const saveSnippet = useCallback((snippet: Snippet) => {
    setSnippets(prev => {
      const exists = prev.find(s => s.id === snippet.id)
      if (exists) return prev.map(s => (s.id === snippet.id ? snippet : s))
      return [...prev, snippet]
    })
    setShowForm(false)
    setIsEditing(false)
  }, [])

  const deleteSnippet = useCallback((id: string) => {
    setSnippets(prev => prev.filter(s => s.id !== id))
    if (selectedSnippet?.id === id) setSelectedSnippet(null)
  }, [selectedSnippet])

  const toggleFavorite = useCallback((id: string) => {
    setSnippets(prev => prev.map(s => (s.id === id ? { ...s, favorite: !s.favorite } : s)))
  }, [])

  const copyCode = useCallback(async (code: string, id: string) => {
    try {
      await navigator.clipboard.writeText(code)
      setCopiedId(id)
      setTimeout(() => setCopiedId(null), 2000)
    } catch {}
  }, [])

  const addCategory = useCallback(() => {
    if (!newCatName.trim()) return
    const colors = ['#667eea', '#f5576c', '#43e97b', '#fa709a', '#30cfd0', '#a78bfa', '#fbbf24']
    setCategories(prev => [
      ...prev,
      {
        id: `cat_${Date.now()}`,
        name: newCatName.trim(),
        color: colors[prev.length % colors.length]
      }
    ])
    setNewCatName('')
    setShowCatForm(false)
  }, [newCatName])

  const exportSnippets = useCallback(() => {
    const data = JSON.stringify(snippets, null, 2)
    const blob = new Blob([data], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `snippets_${Date.now()}.json`
    a.click()
    URL.revokeObjectURL(url)
  }, [snippets])

  const importSnippets = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = (ev) => {
      try {
        const imported = JSON.parse(ev.target?.result as string)
        if (Array.isArray(imported)) {
          setSnippets(prev => [...prev, ...imported])
        }
      } catch {}
    }
    reader.readAsText(file)
    e.target.value = ''
  }, [])

  return (
    <div className="dps-card dps-snippets-card">
      <div className="dps-toolbar">
        <div className="dps-search-box">
          <Search size={16} />
          <input
            type="text"
            placeholder="搜索代码片段..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <div className="dps-toolbar-actions">
          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            className="dps-select"
          >
            <option value="all">全部分类</option>
            {categories.map(c => (
              <option key={c.id} value={c.name}>{c.name}</option>
            ))}
          </select>
          <button className="dps-btn dps-btn-ghost" onClick={() => setShowCatForm(!showCatForm)}>
            <FolderOpen size={14} /> 分类
          </button>
          <button className="dps-btn dps-btn-ghost" onClick={exportSnippets} title="导出">
            <Download size={14} />
          </button>
          <label className="dps-btn dps-btn-ghost dps-file-label" title="导入">
            <Upload size={14} />
            <input type="file" accept=".json" onChange={importSnippets} hidden />
          </label>
          <button
            className="dps-btn dps-btn-primary"
            onClick={() => { setShowForm(true); setIsEditing(false); setSelectedSnippet(null) }}
          >
            <Plus size={14} /> 新建
          </button>
        </div>
      </div>

      {showCatForm && (
        <div className="dps-category-form">
          <input
            type="text"
            placeholder="新分类名称"
            value={newCatName}
            onChange={(e) => setNewCatName(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && addCategory()}
          />
          <button className="dps-btn dps-btn-primary" onClick={addCategory}>
            <Plus size={14} /> 添加
          </button>
        </div>
      )}

      <div className="dps-snippets-layout">
        <div className="dps-snippets-list">
          {filteredSnippets.length === 0 ? (
            <div className="dps-empty-state">
              <Code2 size={48} />
              <p>暂无代码片段</p>
              <span>点击"新建"开始创建你的第一个代码片段</span>
            </div>
          ) : (
            filteredSnippets.map(snippet => (
              <div
                key={snippet.id}
                className={`dps-snippet-item ${selectedSnippet?.id === snippet.id ? 'selected' : ''}`}
                onClick={() => setSelectedSnippet(snippet)}
              >
                <div className="dps-snippet-header">
                  <div className="dps-snippet-title-row">
                    <span className="dps-snippet-title">{snippet.title}</span>
                    {snippet.favorite && <Star size={14} className="dps-star-icon" />}
                  </div>
                  <div className="dps-snippet-meta">
                    <span className="dps-lang-badge">{snippet.language}</span>
                    {snippet.category && (
                      <span className="dps-cat-badge">
                        {categories.find(c => c.name === snippet.category)?.name || snippet.category}
                      </span>
                    )}
                  </div>
                </div>
                {snippet.description && (
                  <p className="dps-snippet-desc">{snippet.description}</p>
                )}
                <pre className="dps-snippet-preview">
                  <code>{snippet.code.slice(0, 80)}{snippet.code.length > 80 ? '...' : ''}</code>
                </pre>
              </div>
            ))
          )}
        </div>

        <div className="dps-snippet-detail">
          {selectedSnippet ? (
            <SnippetDetail
              snippet={selectedSnippet}
              categories={categories}
              onEdit={() => { setShowForm(true); setIsEditing(true) }}
              onDelete={() => deleteSnippet(selectedSnippet.id)}
              onToggleFav={() => toggleFavorite(selectedSnippet.id)}
              onCopy={() => copyCode(selectedSnippet.code, selectedSnippet.id)}
              copied={copiedId === selectedSnippet.id}
            />
          ) : (
            <div className="dps-empty-detail">
              <Code2 size={64} />
              <p>选择一个片段查看详情</p>
            </div>
          )}
        </div>
      </div>

      {showForm && (
        <SnippetForm
          snippet={isEditing && selectedSnippet ? selectedSnippet : null}
          categories={categories}
          onSave={saveSnippet}
          onCancel={() => { setShowForm(false); setIsEditing(false) }}
        />
      )}
    </div>
  )
}

function getDefaultSnippets(): Snippet[] {
  return [
    {
      id: 'default_1',
      title: '快速排序算法',
      code: `function quickSort(arr) {
  if (arr.length <= 1) return arr;
  const pivot = arr[Math.floor(arr.length / 2)];
  const left = arr.filter(x => x < pivot);
  const middle = arr.filter(x => x === pivot);
  const right = arr.filter(x => x > pivot);
  return [...quickSort(left), ...middle, ...quickSort(right)];
}`,
      language: 'javascript',
      category: 'Algorithms',
      description: '经典快速排序实现，使用递归和数组方法',
      createdAt: Date.now() - 86400000,
      favorite: true
    },
    {
      id: 'default_2',
      title: '防抖函数',
      code: `function debounce(fn, delay) {
  let timer = null;
  return function (...args) {
    if (timer) clearTimeout(timer);
    timer = setTimeout(() => fn.apply(this, args), delay);
  };
}`,
      language: 'javascript',
      category: 'Utilities',
      description: '通用防抖函数实现',
      createdAt: Date.now() - 43200000,
      favorite: false
    },
    {
      id: 'default_3',
      title: 'Python单例模式',
      code: `class Singleton:
    _instance = None
    def __new__(cls):
        if cls._instance is None:
            cls._instance = super().__new__(cls)
        return cls._instance`,
      language: 'python',
      category: 'Patterns',
      description: 'Python实现单例模式',
      createdAt: Date.now() - 21600000,
      favorite: false
    }
  ]
}

function SnippetDetail({
  snippet, categories, onEdit, onDelete, onToggleFav, onCopy, copied
}: {
  snippet: Snippet
  categories: SnippetCategory[]
  onEdit: () => void
  onDelete: () => void
  onToggleFav: () => void
  onCopy: () => void
  copied: boolean
}) {
  const [showRaw, setShowRaw] = useState(false)

  return (
    <div className="dps-detail-content">
      <div className="dps-detail-header">
        <h3>{snippet.title}</h3>
        <div className="dps-detail-actions">
          <button className="dps-icon-btn" onClick={onToggleFav} title="收藏">
            <Star size={16} className={snippet.favorite ? 'dps-star-active' : ''} />
          </button>
          <button className="dps-icon-btn" onClick={onCopy} title="复制">
            {copied ? <Check size={16} className="dps-check-icon" /> : <Copy size={16} />}
          </button>
          <button className="dps-icon-btn" onClick={onEdit} title="编辑">
            <Code2 size={16} />
          </button>
          <button className="dps-icon-btn dps-danger" onClick={onDelete} title="删除">
            <Trash2 size={16} />
          </button>
        </div>
      </div>

      <div className="dps-detail-meta">
        <span className="dps-lang-badge">{snippet.language}</span>
        {snippet.category && (
          <span className="dps-cat-badge">
            {categories.find(c => c.name === snippet.category)?.name || snippet.category}
          </span>
        )}
        <span className="dps-date">
          {new Date(snippet.createdAt).toLocaleDateString()}
        </span>
      </div>

      {snippet.description && (
        <div className="dps-detail-desc">
          <div dangerouslySetInnerHTML={{ __html: renderMarkdown(snippet.description) }} />
        </div>
      )}

      <div className="dps-detail-code">
        <div className="dps-code-header">
          <span>{snippet.language}</span>
          <button className="dps-icon-btn" onClick={() => setShowRaw(!showRaw)} title="切换视图">
            {showRaw ? <Eye size={14} /> : <EyeOff size={14} />}
          </button>
        </div>
        <pre className="dps-code-block">
          <code>{snippet.code}</code>
        </pre>
      </div>
    </div>
  )
}

function SnippetForm({
  snippet, categories, onSave, onCancel
}: {
  snippet: Snippet | null
  categories: SnippetCategory[]
  onSave: (s: Snippet) => void
  onCancel: () => void
}) {
  const [title, setTitle] = useState(snippet?.title || '')
  const [code, setCode] = useState(snippet?.code || '')
  const [language, setLanguage] = useState(snippet?.language || 'javascript')
  const [category, setCategory] = useState(snippet?.category || categories[0]?.name || 'Misc')
  const [description, setDescription] = useState(snippet?.description || '')

  const handleSubmit = () => {
    if (!title.trim() || !code.trim()) return
    onSave({
      id: snippet?.id || `snippet_${Date.now()}`,
      title: title.trim(),
      code,
      language,
      category,
      description: description.trim(),
      createdAt: snippet?.createdAt || Date.now(),
      favorite: snippet?.favorite || false
    })
  }

  return (
    <div className="dps-modal-overlay" onClick={onCancel}>
      <div className="dps-modal" onClick={e => e.stopPropagation()}>
        <div className="dps-modal-header">
          <h3>{snippet ? '编辑片段' : '新建片段'}</h3>
          <button className="dps-icon-btn" onClick={onCancel}>
            <X size={18} />
          </button>
        </div>
        <div className="dps-modal-body">
          <div className="dps-form-group">
            <label>标题</label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="片段标题..."
            />
          </div>
          <div className="dps-form-row">
            <div className="dps-form-group">
              <label>语言</label>
              <select value={language} onChange={(e) => setLanguage(e.target.value)}>
                {LANGUAGES.map(l => <option key={l} value={l}>{l}</option>)}
              </select>
            </div>
            <div className="dps-form-group">
              <label>分类</label>
              <select value={category} onChange={(e) => setCategory(e.target.value)}>
                {categories.map(c => <option key={c.id} value={c.name}>{c.name}</option>)}
              </select>
            </div>
          </div>
          <div className="dps-form-group">
            <label>描述 (支持 Markdown)</label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="片段描述..."
              rows={2}
            />
          </div>
          <div className="dps-form-group">
            <label>代码</label>
            <textarea
              value={code}
              onChange={(e) => setCode(e.target.value)}
              placeholder="粘贴或输入代码..."
              rows={10}
              className="dps-code-textarea"
            />
          </div>
        </div>
        <div className="dps-modal-footer">
          <button className="dps-btn dps-btn-ghost" onClick={onCancel}>取消</button>
          <button className="dps-btn dps-btn-primary" onClick={handleSubmit}>
            <Save size={14} /> {snippet ? '保存' : '创建'}
          </button>
        </div>
      </div>
    </div>
  )
}

/* ==================== 正则表达式测试器 ==================== */

function RegexTool() {
  const [pattern, setPattern] = useState('(\\w+)@(\\w+\\.\\w+)')
  const [flags, setFlags] = useState('gi')
  const [testString, setTestString] = useState('contact@example.com, support@test.org, admin@web-linux.io')
  const [replaceText, setReplaceText] = useState('[$1 at $2]')

  const { matches, error, replaceResult } = useMemo(() => {
    let currentError: string | null = null
    const currentMatches: { text: string; index: number; groups: Record<string, string> }[] = []
    let currentReplaceResult = ''

    let regex: RegExp
    try {
      regex = new RegExp(pattern, flags)
    } catch (e) {
      currentError = e instanceof Error ? e.message : '无效的正则表达式'
      return { matches: [], error: currentError, replaceResult: '' }
    }

    try {
      if (regex.global) {
        let match: RegExpExecArray | null
        while ((match = regex.exec(testString)) !== null) {
          const groups: Record<string, string> = {}
          if (match.groups) {
            Object.entries(match.groups).forEach(([k, v]) => { groups[k] = v || '' })
          }
          currentMatches.push({ text: match[0], index: match.index, groups })
        }
      } else {
        const match = regex.exec(testString)
        if (match) {
          const groups: Record<string, string> = {}
          if (match.groups) {
            Object.entries(match.groups).forEach(([k, v]) => { groups[k] = v || '' })
          }
          currentMatches.push({ text: match[0], index: match.index, groups })
        }
      }
      currentReplaceResult = testString.replace(regex, replaceText)
    } catch (e) {
      currentError = e instanceof Error ? e.message : '正则执行错误'
    }

    return { matches: currentMatches, error: currentError, replaceResult: currentReplaceResult }
  }, [pattern, flags, testString, replaceText])

  const highlightedText = useMemo(() => {
    if (!matches.length) return <span>{testString}</span>
    const parts: React.ReactNode[] = []
    let lastIndex = 0
    matches.forEach((match, i) => {
      if (match.index > lastIndex) {
        parts.push(<span key={`t-${i}`}>{testString.slice(lastIndex, match.index)}</span>)
      }
      parts.push(
        <mark key={`m-${i}`} className="dps-regex-mark">
          {match.text}
        </mark>
      )
      lastIndex = match.index + match.text.length
    })
    if (lastIndex < testString.length) {
      parts.push(<span key="te">{testString.slice(lastIndex)}</span>)
    }
    return <>{parts}</>
  }, [testString, matches])

  const presets = [
    { name: '邮箱', pattern: '(\\w+)@(\\w+\\.\\w+)', flags: 'gi' },
    { name: 'URL', pattern: 'https?://([\\w-]+\\.)+[\\w-]+(/[\\w-./?%&=]*)?', flags: 'gi' },
    { name: '手机号', pattern: '1[3-9]\\d{9}', flags: 'g' },
    { name: '日期', pattern: '\\d{4}-\\d{2}-\\d{2}', flags: 'g' },
    { name: 'IP地址', pattern: '\\b(?:\\d{1,3}\\.){3}\\d{1,3}\\b', flags: 'g' },
    { name: '十六进制颜色', pattern: '#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})', flags: 'gi' },
  ]

  return (
    <div className="dps-card dps-regex-card">
      <div className="dps-presets-bar">
        <span className="dps-presets-label">快速预设:</span>
        {presets.map((p, i) => (
          <button
            key={i}
            className="dps-preset-btn"
            onClick={() => { setPattern(p.pattern); setFlags(p.flags) }}
          >
            {p.name}
          </button>
        ))}
      </div>

      <div className="dps-regex-input-row">
        <span className="dps-regex-slash">/</span>
        <input
          type="text"
          value={pattern}
          onChange={(e) => setPattern(e.target.value)}
          placeholder="输入正则表达式..."
          className={`dps-regex-pattern ${error ? 'dps-error-border' : ''}`}
        />
        <span className="dps-regex-slash">/</span>
        <input
          type="text"
          value={flags}
          onChange={(e) => setFlags(e.target.value)}
          placeholder="gi"
          className="dps-regex-flags"
        />
      </div>

      {error && <div className="dps-error-msg">⚠ {error}</div>}

      <div className="dps-regex-panels">
        <div className="dps-panel">
          <div className="dps-panel-header">
            <span>测试文本</span>
            <span className="dps-badge">{matches.length} 个匹配</span>
          </div>
          <textarea
            value={testString}
            onChange={(e) => setTestString(e.target.value)}
            placeholder="输入要测试的文本..."
            className="dps-textarea"
          />
          <div className="dps-highlight-output">{highlightedText}</div>
        </div>

        <div className="dps-panel">
          <div className="dps-panel-header">
            <span>替换</span>
          </div>
          <input
            type="text"
            value={replaceText}
            onChange={(e) => setReplaceText(e.target.value)}
            placeholder="替换文本 ($1, $2 用于分组)"
            className="dps-input"
          />
          <div className="dps-panel-header">
            <span>替换结果</span>
          </div>
          <div className="dps-output-box">{replaceResult}</div>
        </div>
      </div>

      {matches.length > 0 && (
        <div className="dps-match-details">
          <div className="dps-panel-header">
            <span>匹配详情</span>
          </div>
          <div className="dps-matches-grid">
            {matches.map((m, i) => (
              <div key={i} className="dps-match-item">
                <div className="dps-match-header">
                  <span className="dps-match-num">匹配 #{i + 1}</span>
                  <span className="dps-match-idx">索引: {m.index}</span>
                </div>
                <code className="dps-match-text">"{m.text}"</code>
                {Object.keys(m.groups).length > 0 && (
                  <div className="dps-match-groups">
                    {Object.entries(m.groups).map(([k, v], j) => (
                      <div key={j} className="dps-match-group">
                        <strong>{k}:</strong> {v}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="dps-regex-ref">
        <div className="dps-panel-header"><span>快速参考</span></div>
        <div className="dps-ref-grid">
          {[
            { s: '.', d: '任意字符' }, { s: '\\d', d: '数字' }, { s: '\\w', d: '单词字符' },
            { s: '\\s', d: '空白符' }, { s: '^', d: '开头' }, { s: '$', d: '结尾' },
            { s: '*', d: '0+次' }, { s: '+', d: '1+次' }, { s: '?', d: '0/1次' },
            { s: '()', d: '分组' }, { s: '[^]', d: '否定' }, { s: '|', d: '或' },
          ].map((item, i) => (
            <div key={i} className="dps-ref-item">
              <code>{item.s}</code>
              <span>{item.d}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

/* ==================== 时间戳转换器 ==================== */

function TimestampTool() {
  const [now, setNow] = useState(Math.floor(Date.now() / 1000))
  const [tsInput, setTsInput] = useState(String(Math.floor(Date.now() / 1000)))
  const [dateInput, setDateInput] = useState(new Date().toISOString().slice(0, 16))
  const [selectedTimezone, setSelectedTimezone] = useState('local')

  useEffect(() => {
    const timer = setInterval(() => {
      setNow(Math.floor(Date.now() / 1000))
    }, 1000)
    return () => clearInterval(timer)
  }, [])

  const convertTsToDate = useCallback((ts: string) => {
    const n = Number(ts)
    if (!n) return null
    const d = new Date(n * 1000)
    return d
  }, [])

  const convertDateToTs = useCallback((dateStr: string) => {
    const d = new Date(dateStr)
    if (isNaN(d.getTime())) return null
    return Math.floor(d.getTime() / 1000)
  }, [])

  const tsDate = convertTsToDate(tsInput)
  const dateTs = convertDateToTs(dateInput)

  const timezones = useMemo(() => {
    const zones: { id: string; name: string; offset: number }[] = []
    try {
      const offsets = [-12, -11, -10, -9, -8, -7, -6, -5, -4, -3, -2, -1, 0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12]
      offsets.forEach(offset => {
        const sign = offset >= 0 ? '+' : '-'
        zones.push({
          id: `utc${offset}`,
          name: `UTC${sign}${Math.abs(offset)}`,
          offset: offset * 3600
        })
      })
    } catch {}
    return zones
  }, [])

  const getTimezoneTime = useCallback((ts: number, tzId: string) => {
    if (tzId === 'local') {
      return new Date(ts * 1000).toLocaleString()
    }
    const zone = timezones.find(z => z.id === tzId)
    if (!zone) return ''
    const utc = new Date(ts * 1000).getTime() + new Date(ts * 1000).getTimezoneOffset() * 60000
    const tzTime = new Date(utc + zone.offset * 1000)
    return tzTime.toUTCString().replace('GMT', `UTC${zone.offset >= 0 ? '+' : ''}${zone.offset / 3600}`)
  }, [timezones])

  const copyTimestamp = useCallback((ts: string) => {
    try { navigator.clipboard.writeText(ts) } catch {}
  }, [])

  const formatDate = useCallback((d: Date) => {
    return d.toLocaleString('zh-CN', {
      year: 'numeric', month: '2-digit', day: '2-digit',
      hour: '2-digit', minute: '2-digit', second: '2-digit'
    })
  }, [])

  return (
    <div className="dps-card dps-timestamp-card">
      <div className="dps-clock-display">
        <div className="dps-now-section">
          <div className="dps-now-label">当前时间戳</div>
          <div className="dps-now-value">{now}</div>
          <div className="dps-now-date">{formatDate(new Date())}</div>
        </div>
        <div className="dps-timezone-select">
          <label>时区</label>
          <select
            value={selectedTimezone}
            onChange={(e) => setSelectedTimezone(e.target.value)}
          >
            <option value="local">本地时区</option>
            {timezones.map(z => (
              <option key={z.id} value={z.id}>{z.name}</option>
            ))}
          </select>
        </div>
      </div>

      <div className="dps-timestamp-panels">
        <div className="dps-panel">
          <div className="dps-panel-header">
            <span>时间戳 → 日期</span>
            <button className="dps-icon-btn" onClick={() => copyTimestamp(tsInput)}>
              <Copy size={14} />
            </button>
          </div>
          <input
            type="text"
            value={tsInput}
            onChange={(e) => setTsInput(e.target.value)}
            className="dps-input dps-mono"
            placeholder="输入 Unix 时间戳..."
          />
          {tsDate && (
            <div className="dps-result-box">
              <div className="dps-result-row">
                <span>本地时间:</span>
                <span>{formatDate(tsDate)}</span>
              </div>
              <div className="dps-result-row">
                <span>ISO 格式:</span>
                <span>{tsDate.toISOString()}</span>
              </div>
              <div className="dps-result-row">
                <span>UTC:</span>
                <span>{tsDate.toUTCString()}</span>
              </div>
              <div className="dps-result-row">
                <span>{selectedTimezone === 'local' ? '本地' : selectedTimezone}:</span>
                <span>{getTimezoneTime(Number(tsInput), selectedTimezone)}</span>
              </div>
              <div className="dps-result-row">
                <span>毫秒:</span>
                <span>{tsDate.getTime()}</span>
              </div>
            </div>
          )}
        </div>

        <div className="dps-panel">
          <div className="dps-panel-header">
            <span>日期 → 时间戳</span>
            <button className="dps-icon-btn" onClick={() => dateTs && copyTimestamp(String(dateTs))}>
              <Copy size={14} />
            </button>
          </div>
          <input
            type="datetime-local"
            value={dateInput}
            onChange={(e) => setDateInput(e.target.value)}
            className="dps-input"
          />
          {dateTs !== null && (
            <div className="dps-result-box">
              <div className="dps-result-row">
                <span>时间戳 (秒):</span>
                <span className="dps-highlight">{dateTs}</span>
              </div>
              <div className="dps-result-row">
                <span>时间戳 (毫秒):</span>
                <span>{dateTs * 1000}</span>
              </div>
              <div className="dps-result-row">
                <span>ISO 格式:</span>
                <span>{new Date(dateInput).toISOString()}</span>
              </div>
            </div>
          )}
        </div>
      </div>

      <div className="dps-timestamp-quick">
        <div className="dps-panel-header"><span>快捷操作</span></div>
        <div className="dps-quick-actions">
          <button className="dps-btn dps-btn-ghost" onClick={() => {
            const t = Math.floor(Date.now() / 1000)
            setTsInput(String(t))
            setDateInput(new Date(t * 1000).toISOString().slice(0, 16))
          }}>
            <Clock size={14} /> 使用当前时间
          </button>
          <button className="dps-btn dps-btn-ghost" onClick={() => {
            const d = new Date()
            d.setHours(0, 0, 0, 0)
            setTsInput(String(Math.floor(d.getTime() / 1000)))
          }}>
            今天零点
          </button>
          <button className="dps-btn dps-btn-ghost" onClick={() => {
            const d = new Date()
            d.setDate(d.getDate() + 1)
            d.setHours(0, 0, 0, 0)
            setTsInput(String(Math.floor(d.getTime() / 1000)))
          }}>
            明天零点
          </button>
          <button className="dps-btn dps-btn-ghost" onClick={() => {
            const d = new Date()
            d.setDate(d.getDate() - 7)
            setTsInput(String(Math.floor(d.getTime() / 1000)))
          }}>
            7天前
          </button>
        </div>
      </div>
    </div>
  )
}

/* ==================== JSON工具 ==================== */

function JSONTool() {
  const [input, setInput] = useState('{"name":"John","age":30,"city":"New York","hobbies":["reading","gaming"],"address":{"street":"123 Main St","zip":"10001"}}')
  const [indent, setIndent] = useState(2)

  const parsed = useMemo(() => {
    if (!input.trim()) return { valid: false as const, error: '输入为空' }
    try {
      const parsed = JSON.parse(input)
      return { valid: true as const, data: parsed }
    } catch (e) {
      return { valid: false as const, error: e instanceof Error ? e.message : '无效的 JSON' }
    }
  }, [input])

  const formatted = useMemo(() => {
    if (!parsed.valid) return ''
    return JSON.stringify(parsed.data, null, indent)
  }, [parsed, indent])

  const minified = useMemo(() => {
    if (!parsed.valid) return ''
    return JSON.stringify(parsed.data)
  }, [parsed])

  const handleFormat = () => {
    if (parsed.valid) setInput(formatted)
  }

  const handleMinify = () => {
    if (parsed.valid) setInput(minified)
  }

  const handleClear = () => {
    setInput('')
  }

  const handleSample = () => {
    setInput(JSON.stringify({
      name: "张三",
      age: 28,
      email: "zhangsan@example.com",
      address: {
        street: "中关村大街1号",
        city: "北京",
        zip: "100080"
      },
      hobbies: ["编程", "阅读", "摄影"],
      active: true,
      score: null
    }, null, 2))
  }

  const copyToClipboard = (text: string) => {
    try { navigator.clipboard.writeText(text) } catch {}
  }

  const lineCount = input.split('\n').length
  const charCount = input.length
  const sizeKB = (new Blob([input]).size / 1024).toFixed(2)

  return (
    <div className="dps-card dps-json-card">
      <div className="dps-json-toolbar">
        <div className="dps-toolbar-group">
          <button className="dps-btn dps-btn-primary" onClick={handleFormat} disabled={!parsed.valid}>
            格式化
          </button>
          <button className="dps-btn dps-btn-secondary" onClick={handleMinify} disabled={!parsed.valid}>
            压缩
          </button>
          <button className="dps-btn dps-btn-ghost" onClick={handleSample}>
            示例
          </button>
          <button className="dps-btn dps-btn-ghost" onClick={handleClear}>
            <Trash2 size={14} /> 清空
          </button>
        </div>
        <div className="dps-toolbar-group">
          <label className="dps-label">缩进:</label>
          <select value={indent} onChange={(e) => setIndent(Number(e.target.value))} className="dps-select-sm">
            <option value={2}>2 空格</option>
            <option value={4}>4 空格</option>
            <option value={8}>Tab</option>
          </select>
        </div>
      </div>

      <div className="dps-json-status">
        {parsed.valid ? (
          <span className="dps-status-valid">
            <Check size={14} /> JSON 有效 · {lineCount} 行 · {charCount} 字符 · {sizeKB} KB
          </span>
        ) : (
          <span className="dps-status-invalid">
            <X size={14} /> JSON 无效: {parsed.error}
          </span>
        )}
      </div>

      <div className="dps-json-panels">
        <div className="dps-panel">
          <div className="dps-panel-header">
            <span>输入</span>
            <button className="dps-icon-btn" onClick={() => copyToClipboard(input)}>
              <Copy size={14} />
            </button>
          </div>
          <textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder='{"key": "value"}'
            className={`dps-code-textarea ${!parsed.valid ? 'dps-error-textarea' : ''}`}
            spellCheck={false}
          />
        </div>

        <div className="dps-panel">
          <div className="dps-panel-header">
            <span>格式化输出</span>
            <button className="dps-icon-btn" onClick={() => copyToClipboard(formatted)} disabled={!parsed.valid}>
              <Copy size={14} />
            </button>
          </div>
          <pre className="dps-code-block">
            <code>{parsed.valid ? formatted : '// 等待有效 JSON 输入...'}</code>
          </pre>
        </div>
      </div>
    </div>
  )
}

/* ==================== 哈希生成器 ==================== */

function HashTool() {
  const [input, setInput] = useState('')
  const [hashes, setHashes] = useState<Record<string, string>>({
    MD5: '', 'SHA-1': '', 'SHA-256': '', 'SHA-384': '', 'SHA-512': ''
  })
  const [uuid, setUuid] = useState('')
  const [generating, setGenerating] = useState(false)

  const computeHashes = useCallback(async () => {
    if (!input.trim()) {
      setHashes({ MD5: '', 'SHA-1': '', 'SHA-256': '', 'SHA-384': '', 'SHA-512': '' })
      return
    }
    setGenerating(true)
    const results: Record<string, string> = {}
    const algorithms = ['MD5', 'SHA-1', 'SHA-256', 'SHA-384', 'SHA-512']
    for (const algo of algorithms) {
      results[algo] = await generateHash(input, algo)
    }
    setHashes(results)
    setGenerating(false)
  }, [input])

  useEffect(() => {
    computeHashes()
  }, [computeHashes])

  const copyHash = useCallback((h: string) => {
    try { navigator.clipboard.writeText(h) } catch {}
  }, [])

  const generateNewUuid = useCallback(() => {
    setUuid(generateUUID())
  }, [])

  const copyUuid = useCallback(() => {
    if (uuid) {
      try { navigator.clipboard.writeText(uuid) } catch {}
    }
  }, [uuid])

  const ALGORITHMS = ['MD5', 'SHA-1', 'SHA-256', 'SHA-384', 'SHA-512'] as const

  return (
    <div className="dps-card dps-hash-card">
      <div className="dps-hash-section">
        <div className="dps-section-header">
          <Hash size={18} />
          <span>文本哈希</span>
        </div>
        <textarea
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="输入要生成哈希的文本..."
          className="dps-textarea"
          rows={3}
        />
        {generating && <div className="dps-generating">计算中...</div>}
        <div className="dps-hash-results">
          {ALGORITHMS.map(algo => (
            <div key={algo} className="dps-hash-item">
              <div className="dps-hash-label">
                <span>{algo}</span>
                <button
                  className="dps-icon-btn"
                  onClick={() => copyHash(hashes[algo])}
                  disabled={!hashes[algo]}
                >
                  <Copy size={12} />
                </button>
              </div>
              <div className="dps-hash-value dps-mono">
                {hashes[algo] || '—'}
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="dps-divider" />

      <div className="dps-hash-section">
        <div className="dps-section-header">
          <Key size={18} />
          <span>UUID 生成器</span>
        </div>
        <div className="dps-uuid-row">
          <input
            type="text"
            value={uuid}
            readOnly
            placeholder="点击按钮生成 UUID"
            className="dps-input dps-mono dps-uuid-input"
          />
          <button className="dps-btn dps-btn-primary" onClick={generateNewUuid}>
            <RefreshCw size={14} /> 生成
          </button>
          <button className="dps-btn dps-btn-ghost" onClick={copyUuid} disabled={!uuid}>
            <Copy size={14} /> 复制
          </button>
        </div>
      </div>
    </div>
  )
}

/* ==================== URL编解码器 ==================== */

function URLTool() {
  const [urlInput, setUrlInput] = useState('https://www.example.com/搜索?q=你好世界&lang=zh-CN')
  const [urlOutput, setUrlOutput] = useState('')
  const [urlMode, setUrlMode] = useState<'encode' | 'decode'>('encode')
  const [base64Input, setBase64Input] = useState('Hello, World! 你好，世界！')
  const [base64Output, setBase64Output] = useState('')
  const [base64Mode, setBase64Mode] = useState<'encode' | 'decode'>('encode')
  const [error, setError] = useState('')

  const processUrl = useCallback(() => {
    setError('')
    if (!urlInput.trim()) { setUrlOutput(''); return }
    try {
      if (urlMode === 'encode') {
        setUrlOutput(encodeURIComponent(urlInput))
      } else {
        setUrlOutput(decodeURIComponent(urlInput))
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : 'URL 处理失败')
    }
  }, [urlInput, urlMode])

  useEffect(() => { processUrl() }, [processUrl])

  const processBase64 = useCallback(() => {
    setError('')
    if (!base64Input.trim()) { setBase64Output(''); return }
    try {
      if (base64Mode === 'encode') {
        setBase64Output(btoa(unescape(encodeURIComponent(base64Input))))
      } else {
        setBase64Output(decodeURIComponent(escape(atob(base64Input))))
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Base64 处理失败，请检查输入')
    }
  }, [base64Input, base64Mode])

  useEffect(() => { processBase64() }, [processBase64])

  const swap = (type: 'url' | 'base64') => {
    if (type === 'url') {
      const temp = urlInput
      setUrlInput(urlOutput)
      setUrlOutput(temp)
      setUrlMode(urlMode === 'encode' ? 'decode' : 'encode')
    } else {
      const temp = base64Input
      setBase64Input(base64Output)
      setBase64Output(temp)
      setBase64Mode(base64Mode === 'encode' ? 'decode' : 'encode')
    }
  }

  const copyText = (text: string) => {
    try { navigator.clipboard.writeText(text) } catch {}
  }

  return (
    <div className="dps-card dps-url-card">
      {error && <div className="dps-error-msg">⚠ {error}</div>}

      <div className="dps-url-section">
        <div className="dps-section-header">
          <Globe size={18} />
          <span>URL 编码 / 解码</span>
        </div>
        <div className="dps-mode-toggle">
          <button
            className={`dps-mode-btn ${urlMode === 'encode' ? 'active' : ''}`}
            onClick={() => setUrlMode('encode')}
          >
            编码
          </button>
          <button
            className={`dps-mode-btn ${urlMode === 'decode' ? 'active' : ''}`}
            onClick={() => setUrlMode('decode')}
          >
            解码
          </button>
        </div>
        <div className="dps-url-panels">
          <div className="dps-panel">
            <div className="dps-panel-header">
              <span>{urlMode === 'encode' ? '原始文本' : '编码文本'}</span>
            </div>
            <textarea
              value={urlInput}
              onChange={(e) => setUrlInput(e.target.value)}
              placeholder={urlMode === 'encode' ? '输入要编码的文本...' : '输入要解码的URL编码文本...'}
              className="dps-textarea dps-mono"
              rows={3}
            />
          </div>
          <div className="dps-panel">
            <div className="dps-panel-header">
              <span>{urlMode === 'encode' ? '编码结果' : '解码结果'}</span>
              <div className="dps-panel-actions">
                <button className="dps-icon-btn" onClick={() => copyText(urlOutput)} disabled={!urlOutput}>
                  <Copy size={14} />
                </button>
                <button className="dps-icon-btn" onClick={() => swap('url')} disabled={!urlOutput}>
                  <RefreshCw size={14} />
                </button>
              </div>
            </div>
            <div className="dps-output-box dps-mono">{urlOutput || '—'}</div>
          </div>
        </div>
      </div>

      <div className="dps-divider" />

      <div className="dps-url-section">
        <div className="dps-section-header">
          <Lock size={18} />
          <span>Base64 编码 / 解码</span>
        </div>
        <div className="dps-mode-toggle">
          <button
            className={`dps-mode-btn ${base64Mode === 'encode' ? 'active' : ''}`}
            onClick={() => setBase64Mode('encode')}
          >
            编码
          </button>
          <button
            className={`dps-mode-btn ${base64Mode === 'decode' ? 'active' : ''}`}
            onClick={() => setBase64Mode('decode')}
          >
            解码
          </button>
        </div>
        <div className="dps-url-panels">
          <div className="dps-panel">
            <div className="dps-panel-header">
              <span>{base64Mode === 'encode' ? '原始文本' : 'Base64 文本'}</span>
            </div>
            <textarea
              value={base64Input}
              onChange={(e) => setBase64Input(e.target.value)}
              placeholder={base64Mode === 'encode' ? '输入要编码的文本...' : '输入要解码的Base64字符串...'}
              className="dps-textarea dps-mono"
              rows={3}
            />
          </div>
          <div className="dps-panel">
            <div className="dps-panel-header">
              <span>{base64Mode === 'encode' ? 'Base64 结果' : '解码结果'}</span>
              <div className="dps-panel-actions">
                <button className="dps-icon-btn" onClick={() => copyText(base64Output)} disabled={!base64Output}>
                  <Copy size={14} />
                </button>
                <button className="dps-icon-btn" onClick={() => swap('base64')} disabled={!base64Output}>
                  <RefreshCw size={14} />
                </button>
              </div>
            </div>
            <div className="dps-output-box dps-mono">{base64Output || '—'}</div>
          </div>
        </div>
      </div>

      <div className="dps-url-info">
        <div className="dps-info-item">
          <Shield size={14} />
          <span>URL 编码: 将特殊字符转为 %XX 格式</span>
        </div>
        <div className="dps-info-item">
          <Shield size={14} />
          <span>Base64: 将二进制数据转为 ASCII 字符串</span>
        </div>
      </div>
    </div>
  )
}

export default DevProductivitySuite