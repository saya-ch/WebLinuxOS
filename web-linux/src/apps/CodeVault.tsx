import { useState, useCallback, useEffect, useMemo } from 'react'
import {
  CodeIcon, CopyIcon, CheckIcon, PlusIcon, TrashIcon,
  SearchIcon, StarIcon, DownloadIcon,
  UploadIcon, SaveIcon, TerminalIcon,
  FolderIcon, ClockIcon, LayersIcon
} from '../icons'
import {
  List as ListIcon,
  Pencil as EditIcon,
  EyeOff as EyeOffIcon,
  LayoutGrid as GridIcon,
} from 'lucide-react'

const LANGUAGES = [
  { id: 'javascript', name: 'JavaScript', color: '#f7df1e' },
  { id: 'typescript', name: 'TypeScript', color: '#3178c6' },
  { id: 'python', name: 'Python', color: '#3776ab' },
  { id: 'java', name: 'Java', color: '#ea2d2e' },
  { id: 'go', name: 'Go', color: '#00add8' },
  { id: 'rust', name: 'Rust', color: '#dea584' },
  { id: 'cpp', name: 'C++', color: '#00599c' },
  { id: 'csharp', name: 'C#', color: '#68217a' },
  { id: 'html', name: 'HTML', color: '#e34f26' },
  { id: 'css', name: 'CSS', color: '#1572b6' },
  { id: 'scss', name: 'SCSS', color: '#cc6699' },
  { id: 'sql', name: 'SQL', color: '#00758f' },
  { id: 'bash', name: 'Bash', color: '#4eaa25' },
  { id: 'json', name: 'JSON', color: '#8892bf' },
  { id: 'yaml', name: 'YAML', color: '#cb171e' },
  { id: 'markdown', name: 'Markdown', color: '#000000' },
  { id: 'react', name: 'React JSX', color: '#61dafb' },
  { id: 'vue', name: 'Vue', color: '#4fc08d' },
  { id: 'dockerfile', name: 'Docker', color: '#2496ed' },
  { id: 'other', name: '其他', color: '#999999' },
]

const CATEGORIES = [
  { id: 'all', name: '全部', icon: '📚' },
  { id: 'frontend', name: '前端', icon: '🎨' },
  { id: 'backend', name: '后端', icon: '⚙️' },
  { id: 'database', name: '数据库', icon: '🗄️' },
  { id: 'devops', name: 'DevOps', icon: '🚀' },
  { id: 'algorithm', name: '算法', icon: '🧮' },
  { id: 'utility', name: '工具', icon: '🛠️' },
  { id: 'snippet', name: '片段', icon: '💾' },
]

interface Snippet {
  id: string
  title: string
  description: string
  code: string
  language: string
  category: string
  tags: string[]
  isFavorite: boolean
  createdAt: number
  updatedAt: number
  usageCount: number
}

const STORAGE_KEY = 'weblinux-codevault-snippets'
const MAX_SNIPPETS = 500

const DEFAULT_SNIPPETS: Snippet[] = [
  {
    id: 'default-1',
    title: '防抖函数 (debounce)',
    description: '通用防抖函数实现，适用于输入框搜索、窗口resize等场景',
    code: `export function debounce<T extends (...args: unknown[]) => void>(
  fn: T,
  delay: number
): (...args: Parameters<T>) => void {
  let timer: ReturnType<typeof setTimeout> | null = null
  return function (this: unknown, ...args: Parameters<T>) {
    if (timer) clearTimeout(timer)
    timer = setTimeout(() => fn.apply(this, args), delay)
  }
}`,
    language: 'typescript',
    category: 'utility',
    tags: ['工具函数', '防抖'],
    isFavorite: true,
    createdAt: Date.now() - 86400000,
    updatedAt: Date.now() - 86400000,
    usageCount: 15,
  },
  {
    id: 'default-2',
    title: '深拷贝 (deepClone)',
    description: '支持循环引用的深拷贝实现，使用WeakMap避免内存泄漏',
    code: `function deepClone<T>(obj: T, hash = new WeakMap()): T {
  if (obj === null || typeof obj !== 'object') return obj
  if (hash.has(obj)) return hash.get(obj)
  
  const clone = Array.isArray(obj) ? [] : {}
  hash.set(obj, clone)
  
  for (const key in obj) {
    if (Object.prototype.hasOwnProperty.call(obj, key)) {
      clone[key] = deepClone(obj[key], hash)
    }
  }
  
  return clone as T
}`,
    language: 'javascript',
    category: 'utility',
    tags: ['工具函数', '拷贝'],
    isFavorite: false,
    createdAt: Date.now() - 172800000,
    updatedAt: Date.now() - 172800000,
    usageCount: 8,
  },
  {
    id: 'default-3',
    title: '数组去重 (unique)',
    description: '多种方式实现数组去重：Set、filter、reduce',
    code: `// 方式1: Set
const unique1 = [...new Set(array)]

// 方式2: filter + indexOf
const unique2 = array.filter((item, i) => array.indexOf(item) === i)

// 方式3: reduce + includes
const unique3 = array.reduce((acc, item) => {
  if (!acc.includes(item)) acc.push(item)
  return acc
}, [])

// 对象数组按属性去重
const uniqueByKey = (arr, key) => 
  [...new Map(arr.map(item => [item[key], item])).values()]`,
    language: 'javascript',
    category: 'algorithm',
    tags: ['数组', '去重'],
    isFavorite: true,
    createdAt: Date.now() - 259200000,
    updatedAt: Date.now() - 259200000,
    usageCount: 23,
  },
  {
    id: 'default-4',
    title: '快速排序 (quickSort)',
    description: '经典快速排序实现，支持泛型',
    code: `function quickSort<T>(arr: T[], compare: (a: T, b: T) => number): T[] {
  if (arr.length <= 1) return arr
  
  const pivot = arr[Math.floor(arr.length / 2)]
  const left = arr.filter(x => compare(x, pivot) < 0)
  const middle = arr.filter(x => compare(x, pivot) === 0)
  const right = arr.filter(x => compare(x, pivot) > 0)
  
  return [...quickSort(left, compare), ...middle, ...quickSort(right, compare)]
}

// 使用示例
const numbers = [3, 6, 8, 10, 1, 2, 1]
const sorted = quickSort(numbers, (a, b) => a - b)`,
    language: 'typescript',
    category: 'algorithm',
    tags: ['排序', '算法'],
    isFavorite: false,
    createdAt: Date.now() - 345600000,
    updatedAt: Date.now() - 345600000,
    usageCount: 12,
  },
  {
    id: 'default-5',
    title: 'fetch API 封装',
    description: '支持超时、重试、错误处理的fetch封装',
    code: `async function fetchWithRetry(
  url: string,
  options: RequestInit & { retries?: number; timeout?: number } = {}
): Promise<Response> {
  const { retries = 3, timeout = 5000, ...fetchOptions } = options
  
  const controller = new AbortController()
  const timeoutId = setTimeout(() => controller.abort(), timeout)
  
  try {
    const response = await fetch(url, {
      ...fetchOptions,
      signal: controller.signal,
    })
    clearTimeout(timeoutId)
    return response
  } catch (error) {
    clearTimeout(timeoutId)
    
    if (retries > 0 && error instanceof Error) {
      console.warn(\`请求失败，剩余重试次数: \${retries}\`)
      return fetchWithRetry(url, { ...options, retries: retries - 1 })
    }
    throw error
  }
}`,
    language: 'typescript',
    category: 'backend',
    tags: ['fetch', '网络请求'],
    isFavorite: false,
    createdAt: Date.now() - 432000000,
    updatedAt: Date.now() - 432000000,
    usageCount: 5,
  },
]

function loadSnippets(): Snippet[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (raw) {
      const parsed = JSON.parse(raw)
      if (Array.isArray(parsed)) return parsed
    }
  } catch { /* ignore */ }
  return DEFAULT_SNIPPETS
}

function saveSnippets(snippets: Snippet[]) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(snippets))
  } catch { /* ignore */ }
}

const CodeVault = () => {
  const [snippets, setSnippets] = useState<Snippet[]>(loadSnippets)
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedCategory, setSelectedCategory] = useState('all')
  const [selectedLanguage, setSelectedLanguage] = useState('all')
  const [showFavoritesOnly, setShowFavoritesOnly] = useState(false)
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid')
  const [selectedSnippet, setSelectedSnippet] = useState<Snippet | null>(null)
  const [isEditing, setIsEditing] = useState(false)
  const [isCreating, setIsCreating] = useState(false)
  const [copiedId, setCopiedId] = useState<string | null>(null)

  useEffect(() => {
    saveSnippets(snippets)
  }, [snippets])

  const filteredSnippets = useMemo(() => {
    return snippets.filter(s => {
      if (selectedCategory !== 'all' && s.category !== selectedCategory) return false
      if (selectedLanguage !== 'all' && s.language !== selectedLanguage) return false
      if (showFavoritesOnly && !s.isFavorite) return false
      if (searchQuery) {
        const q = searchQuery.toLowerCase()
        return (
          s.title.toLowerCase().includes(q) ||
          s.description.toLowerCase().includes(q) ||
          s.code.toLowerCase().includes(q) ||
          s.tags.some(t => t.toLowerCase().includes(q))
        )
      }
      return true
    }).sort((a, b) => b.updatedAt - a.updatedAt)
  }, [snippets, searchQuery, selectedCategory, selectedLanguage, showFavoritesOnly])

  const copySnippet = useCallback(async (snippet: Snippet) => {
    try {
      await navigator.clipboard.writeText(snippet.code)
      setCopiedId(snippet.id)
      setSnippets(prev => prev.map(s => s.id === snippet.id ? { ...s, usageCount: s.usageCount + 1 } : s))
      setTimeout(() => setCopiedId(null), 2000)
    } catch {
      const textarea = document.createElement('textarea')
      textarea.value = snippet.code
      document.body.appendChild(textarea)
      textarea.select()
      document.execCommand('copy')
      document.body.removeChild(textarea)
      setCopiedId(snippet.id)
      setTimeout(() => setCopiedId(null), 2000)
    }
  }, [])

  const toggleFavorite = useCallback((id: string) => {
    setSnippets(prev => prev.map(s => s.id === id ? { ...s, isFavorite: !s.isFavorite } : s))
    if (selectedSnippet?.id === id) {
      setSelectedSnippet(prev => prev ? { ...prev, isFavorite: !prev.isFavorite } : null)
    }
  }, [selectedSnippet])

  const deleteSnippet = useCallback((id: string) => {
    if (confirm('确定要删除此代码片段吗？')) {
      setSnippets(prev => prev.filter(s => s.id !== id))
      setSelectedSnippet(null)
    }
  }, [])

  const createSnippet = useCallback((data: Omit<Snippet, 'id' | 'createdAt' | 'updatedAt' | 'usageCount'>) => {
    const newSnippet: Snippet = {
      ...data,
      id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
      createdAt: Date.now(),
      updatedAt: Date.now(),
      usageCount: 0,
    }
    setSnippets(prev => [newSnippet, ...prev].slice(0, MAX_SNIPPETS))
    setIsCreating(false)
  }, [])

  const updateSnippet = useCallback((id: string, data: Partial<Snippet>) => {
    setSnippets(prev => prev.map(s => s.id === id ? { ...s, ...data, updatedAt: Date.now() } : s))
    setIsEditing(false)
    setSelectedSnippet(prev => prev ? { ...prev, ...data, updatedAt: Date.now() } : null)
  }, [])

  const exportSnippets = useCallback(() => {
    const data = JSON.stringify(snippets, null, 2)
    const blob = new Blob([data], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `codevault-snippets-${Date.now()}.json`
    a.click()
    URL.revokeObjectURL(url)
  }, [snippets])

  const importSnippets = useCallback(() => {
    const input = document.createElement('input')
    input.type = 'file'
    input.accept = '.json'
    input.onchange = (e) => {
      const file = (e.target as HTMLInputElement).files?.[0]
      if (!file) return
      const reader = new FileReader()
      reader.onload = (event) => {
        try {
          const imported = JSON.parse(event.target?.result as string)
          if (Array.isArray(imported)) {
            const valid = imported.filter(s => s.title && s.code)
            setSnippets(prev => {
              const existingIds = new Set(prev.map(s => s.id))
              const newOnes = valid.filter(s => !existingIds.has(s.id))
              return [...newOnes, ...prev].slice(0, MAX_SNIPPETS)
            })
            alert(`成功导入 ${valid.length} 个代码片段`)
          }
        } catch {
          alert('导入失败：文件格式错误')
        }
      }
      reader.readAsText(file)
    }
    input.click()
  }, [])

  const getLanguageInfo = (langId: string) => LANGUAGES.find(l => l.id === langId) || LANGUAGES[LANGUAGES.length - 1]
  const getCategoryInfo = (catId: string) => CATEGORIES.find(c => c.id === catId) || CATEGORIES[0]

  const formatDate = (ts: number) => {
    const d = new Date(ts)
    const now = new Date()
    const diff = now.getTime() - ts
    if (diff < 60000) return '刚刚'
    if (diff < 3600000) return `${Math.floor(diff / 60000)}分钟前`
    if (diff < 86400000) return `${Math.floor(diff / 3600000)}小时前`
    if (diff < 604800000) return `${Math.floor(diff / 86400000)}天前`
    return `${d.getMonth() + 1}/${d.getDate()}`
  }

  const stats = useMemo(() => ({
    total: snippets.length,
    favorites: snippets.filter(s => s.isFavorite).length,
    languages: new Set(snippets.map(s => s.language)).size,
    usage: snippets.reduce((sum, s) => sum + s.usageCount, 0),
  }), [snippets])

  const styles: Record<string, React.CSSProperties> = {
    container: {
      display: 'flex',
      flexDirection: 'column',
      height: '100%',
      background: 'var(--window-bg)',
      color: 'var(--text-primary)',
      overflow: 'hidden',
    },
    header: {
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      padding: '14px 20px',
      borderBottom: '1px solid var(--window-border)',
      background: 'linear-gradient(135deg, rgba(59, 130, 246, 0.12) 0%, rgba(147, 51, 234, 0.1) 100%)',
    },
    title: {
      display: 'flex',
      alignItems: 'center',
      gap: '10px',
      fontSize: '16px',
      fontWeight: 600,
    },
    headerStats: {
      display: 'flex',
      gap: '16px',
      fontSize: '12px',
      color: 'var(--text-secondary)',
    },
    stat: {
      display: 'flex',
      alignItems: 'center',
      gap: '4px',
    },
    mainContent: {
      display: 'flex',
      flex: 1,
      overflow: 'hidden',
    },
    sidebar: {
      width: '240px',
      borderRight: '1px solid var(--window-border)',
      padding: '16px',
      display: 'flex',
      flexDirection: 'column',
      gap: '16px',
      overflowY: 'auto',
    },
    sectionTitle: {
      fontSize: '12px',
      fontWeight: 600,
      color: 'var(--text-secondary)',
      marginBottom: '8px',
      textTransform: 'uppercase' as const,
      letterSpacing: '0.5px',
    },
    categoryList: {
      display: 'flex',
      flexDirection: 'column',
      gap: '2px',
    },
    categoryItem: {
      padding: '8px 12px',
      borderRadius: '8px',
      cursor: 'pointer',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      fontSize: '13px',
      transition: 'background 0.15s',
    },
    categoryActive: {
      background: 'linear-gradient(135deg, rgba(59, 130, 246, 0.2) 0%, rgba(147, 51, 234, 0.15) 100%)',
      color: 'var(--accent)',
    },
    categoryCount: {
      fontSize: '11px',
      color: 'var(--text-secondary)',
      background: 'rgba(255,255,255,0.1)',
      padding: '2px 8px',
      borderRadius: '10px',
    },
    toolbar: {
      padding: '16px',
      borderBottom: '1px solid var(--window-border)',
      display: 'flex',
      alignItems: 'center',
      gap: '12px',
      flexWrap: 'wrap',
    },
    searchInput: {
      flex: 1,
      minWidth: '200px',
      padding: '10px 14px',
      borderRadius: '10px',
      border: '1px solid var(--window-border)',
      background: 'rgba(255,255,255,0.03)',
      color: 'var(--text-primary)',
      fontSize: '14px',
      outline: 'none',
    },
    filterBtn: {
      padding: '8px 12px',
      borderRadius: '8px',
      border: '1px solid var(--window-border)',
      background: 'transparent',
      color: 'var(--text-secondary)',
      cursor: 'pointer',
      fontSize: '12px',
      display: 'flex',
      alignItems: 'center',
      gap: '6px',
    },
    filterBtnActive: {
      background: 'var(--accent-bg)',
      color: 'var(--accent)',
      borderColor: 'var(--accent)',
    },
    viewToggle: {
      display: 'flex',
      background: 'rgba(255,255,255,0.05)',
      borderRadius: '8px',
      padding: '3px',
    },
    viewBtn: {
      padding: '6px 10px',
      borderRadius: '6px',
      border: 'none',
      background: 'transparent',
      color: 'var(--text-secondary)',
      cursor: 'pointer',
    },
    viewBtnActive: {
      background: 'var(--accent)',
      color: '#fff',
    },
    newBtn: {
      padding: '10px 20px',
      borderRadius: '10px',
      border: 'none',
      background: 'linear-gradient(135deg, #3b82f6 0%, #8b5cf6 100%)',
      color: '#fff',
      cursor: 'pointer',
      fontSize: '14px',
      fontWeight: 600,
      display: 'flex',
      alignItems: 'center',
      gap: '8px',
      boxShadow: '0 4px 15px rgba(59, 130, 246, 0.3)',
    },
    content: {
      flex: 1,
      padding: '16px',
      overflowY: 'auto',
    },
    grid: {
      display: 'grid',
      gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))',
      gap: '16px',
    },
    list: {
      display: 'flex',
      flexDirection: 'column',
      gap: '12px',
    },
    card: {
      borderRadius: '12px',
      border: '1px solid var(--window-border)',
      background: 'rgba(255,255,255,0.03)',
      overflow: 'hidden',
      cursor: 'pointer',
      transition: 'all 0.2s',
    },
    cardHover: {
      borderColor: 'var(--accent)',
      transform: 'translateY(-2px)',
      boxShadow: '0 8px 25px rgba(0,0,0,0.2)',
    },
    cardHeader: {
      padding: '12px 14px',
      borderBottom: '1px solid var(--window-border)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
    },
    cardTitle: {
      fontSize: '14px',
      fontWeight: 600,
      overflow: 'hidden',
      textOverflow: 'ellipsis',
      whiteSpace: 'nowrap',
    },
    cardDesc: {
      padding: '10px 14px',
      fontSize: '12px',
      color: 'var(--text-secondary)',
      lineHeight: 1.5,
      overflow: 'hidden',
      textOverflow: 'ellipsis',
      display: '-webkit-box',
      WebkitLineClamp: 2,
      WebkitBoxOrient: 'vertical',
    },
    codePreview: {
      padding: '12px 14px',
      background: 'rgba(0,0,0,0.3)',
      fontFamily: 'monospace',
      fontSize: '11px',
      lineHeight: 1.5,
      color: '#a0aec0',
      overflow: 'hidden',
      textOverflow: 'ellipsis',
      display: '-webkit-box',
      WebkitLineClamp: 4,
      WebkitBoxOrient: 'vertical',
      whiteSpace: 'pre',
    },
    cardFooter: {
      padding: '10px 14px',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      borderTop: '1px solid var(--window-border)',
      fontSize: '11px',
      color: 'var(--text-secondary)',
    },
    langBadge: {
      padding: '3px 8px',
      borderRadius: '4px',
      fontSize: '10px',
      fontWeight: 600,
    },
    tag: {
      display: 'inline-block',
      padding: '2px 8px',
      borderRadius: '10px',
      background: 'rgba(255,255,255,0.1)',
      fontSize: '10px',
      marginRight: '4px',
      marginTop: '4px',
    },
    empty: {
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      height: '100%',
      color: 'var(--text-secondary)',
      gap: '12px',
    },
    modal: {
      position: 'fixed',
      inset: 0,
      background: 'rgba(0,0,0,0.6)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 1000,
      padding: '20px',
    },
    modalContent: {
      background: 'var(--window-bg)',
      borderRadius: '16px',
      border: '1px solid var(--window-border)',
      width: '100%',
      maxWidth: '900px',
      maxHeight: '90vh',
      display: 'flex',
      flexDirection: 'column',
      overflow: 'hidden',
    },
    modalHeader: {
      padding: '16px 20px',
      borderBottom: '1px solid var(--window-border)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
    },
    modalBody: {
      flex: 1,
      overflowY: 'auto',
      padding: '20px',
    },
    modalFooter: {
      padding: '16px 20px',
      borderTop: '1px solid var(--window-border)',
      display: 'flex',
      justifyContent: 'flex-end',
      gap: '12px',
    },
    formGroup: {
      marginBottom: '16px',
    },
    label: {
      display: 'block',
      fontSize: '12px',
      fontWeight: 600,
      color: 'var(--text-secondary)',
      marginBottom: '6px',
    },
    input: {
      width: '100%',
      padding: '10px 12px',
      borderRadius: '8px',
      border: '1px solid var(--window-border)',
      background: 'rgba(255,255,255,0.03)',
      color: 'var(--text-primary)',
      fontSize: '14px',
      outline: 'none',
      fontFamily: 'inherit',
    },
    textarea: {
      width: '100%',
      minHeight: '200px',
      padding: '12px',
      borderRadius: '8px',
      border: '1px solid var(--window-border)',
      background: 'rgba(0,0,0,0.2)',
      color: '#e2e8f0',
      fontSize: '13px',
      fontFamily: 'monospace',
      resize: 'vertical',
      outline: 'none',
      lineHeight: 1.6,
    },
    select: {
      width: '100%',
      padding: '10px 12px',
      borderRadius: '8px',
      border: '1px solid var(--window-border)',
      background: 'rgba(255,255,255,0.03)',
      color: 'var(--text-primary)',
      fontSize: '14px',
      outline: 'none',
      cursor: 'pointer',
    },
    row: {
      display: 'flex',
      gap: '12px',
    },
    smallBtn: {
      padding: '6px 12px',
      borderRadius: '6px',
      border: '1px solid var(--window-border)',
      background: 'transparent',
      color: 'var(--text-secondary)',
      cursor: 'pointer',
      fontSize: '12px',
      display: 'flex',
      alignItems: 'center',
      gap: '6px',
    },
    primaryBtn: {
      padding: '10px 20px',
      borderRadius: '8px',
      border: 'none',
      background: 'linear-gradient(135deg, #3b82f6 0%, #8b5cf6 100%)',
      color: '#fff',
      cursor: 'pointer',
      fontSize: '14px',
      fontWeight: 600,
    },
    detailHeader: {
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      marginBottom: '16px',
    },
    detailTitle: {
      fontSize: '20px',
      fontWeight: 700,
      marginBottom: '8px',
    },
    detailMeta: {
      display: 'flex',
      gap: '12px',
      fontSize: '12px',
      color: 'var(--text-secondary)',
      marginBottom: '16px',
    },
    detailDesc: {
      fontSize: '14px',
      color: 'var(--text-secondary)',
      lineHeight: 1.6,
      marginBottom: '16px',
    },
    detailCode: {
      background: 'rgba(0,0,0,0.3)',
      borderRadius: '10px',
      padding: '16px',
      fontFamily: 'monospace',
      fontSize: '13px',
      lineHeight: 1.6,
      color: '#e2e8f0',
      overflow: 'auto',
      maxHeight: '400px',
      position: 'relative',
    },
    codeActions: {
      position: 'absolute',
      top: '12px',
      right: '12px',
      display: 'flex',
      gap: '8px',
    },
    actionBtn: {
      width: '32px',
      height: '32px',
      borderRadius: '8px',
      border: '1px solid var(--window-border)',
      background: 'rgba(0,0,0,0.4)',
      color: 'var(--text-secondary)',
      cursor: 'pointer',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
    },
  }

  if (isCreating || isEditing) {
    const editingSnippet = isEditing && selectedSnippet ? selectedSnippet : null
    return (
      <div style={styles.container}>
        <div style={styles.header}>
          <div style={styles.title}>
            <CodeIcon size={20} style={{ color: 'var(--accent)' }} />
            <span>{isEditing ? '编辑代码片段' : '创建新代码片段'}</span>
          </div>
          <button style={styles.smallBtn} onClick={() => { setIsCreating(false); setIsEditing(false); setSelectedSnippet(null) }}>
            <EyeOffIcon size={14} />返回
          </button>
        </div>
        <div style={styles.modalBody}>
          <div style={styles.formGroup}>
            <label style={styles.label}>标题</label>
            <input
              style={styles.input}
              defaultValue={editingSnippet?.title || ''}
              placeholder="输入代码片段标题..."
              onBlur={(e) => { if (editingSnippet) editingSnippet.title = e.target.value }}
            />
          </div>
          <div style={styles.formGroup}>
            <label style={styles.label}>描述</label>
            <input
              style={styles.input}
              defaultValue={editingSnippet?.description || ''}
              placeholder="简要描述这个代码片段的用途..."
              onBlur={(e) => { if (editingSnippet) editingSnippet.description = e.target.value }}
            />
          </div>
          <div style={{ ...styles.formGroup, ...styles.row }}>
            <div style={{ flex: 1 }}>
              <label style={styles.label}>编程语言</label>
              <select
                style={styles.select}
                defaultValue={editingSnippet?.language || 'javascript'}
                onChange={(e) => { if (editingSnippet) editingSnippet.language = e.target.value }}
              >
                {LANGUAGES.map(l => (
                  <option key={l.id} value={l.id}>{l.name}</option>
                ))}
              </select>
            </div>
            <div style={{ flex: 1 }}>
              <label style={styles.label}>分类</label>
              <select
                style={styles.select}
                defaultValue={editingSnippet?.category || 'utility'}
                onChange={(e) => { if (editingSnippet) editingSnippet.category = e.target.value }}
              >
                {CATEGORIES.filter(c => c.id !== 'all').map(c => (
                  <option key={c.id} value={c.id}>{c.icon} {c.name}</option>
                ))}
              </select>
            </div>
          </div>
          <div style={styles.formGroup}>
            <label style={styles.label}>标签（用逗号分隔）</label>
            <input
              style={styles.input}
              defaultValue={editingSnippet?.tags?.join(', ') || ''}
              placeholder="例如: 工具函数, 防抖, 搜索"
              onBlur={(e) => { if (editingSnippet) editingSnippet.tags = e.target.value.split(',').map(t => t.trim()).filter(Boolean) }}
            />
          </div>
          <div style={styles.formGroup}>
            <label style={styles.label}>代码</label>
            <textarea
              style={styles.textarea}
              defaultValue={editingSnippet?.code || ''}
              placeholder="粘贴或编写你的代码..."
              onBlur={(e) => { if (editingSnippet) editingSnippet.code = e.target.value }}
            />
          </div>
        </div>
        <div style={styles.modalFooter}>
          <button
            style={styles.smallBtn}
            onClick={() => { setIsCreating(false); setIsEditing(false); setSelectedSnippet(null) }}
          >
            取消
          </button>
          <button
            style={styles.primaryBtn}
            onClick={() => {
              // 重新获取值
              const inputs = document.querySelectorAll('input, select, textarea')
              const values: Record<string, string> = {}
              inputs.forEach((el) => {
                const placeholder = (el as HTMLElement).getAttribute('placeholder')
                if (placeholder) values[placeholder] = (el as HTMLInputElement).value
              })
              
              if (isEditing && editingSnippet) {
                updateSnippet(editingSnippet.id, {
                  title: values['输入代码片段标题...'] || editingSnippet.title,
                  description: values['简要描述这个代码片段的用途...'] || editingSnippet.description,
                  tags: (values['例如: 工具函数, 防抖, 搜索'] || '').split(',').map(t => t.trim()).filter(Boolean),
                })
              } else {
                createSnippet({
                  title: values['输入代码片段标题...'] || '未命名片段',
                  description: values['简要描述这个代码片段的用途...'] || '',
                  code: (document.querySelector('textarea[placeholder="粘贴或编写你的代码..."]') as HTMLTextAreaElement)?.value || '',
                  language: 'javascript',
                  category: 'utility',
                  tags: (values['例如: 工具函数, 防抖, 搜索'] || '').split(',').map(t => t.trim()).filter(Boolean),
                  isFavorite: false,
                })
              }
            }}
          >
            <SaveIcon size={14} />保存
          </button>
        </div>
      </div>
    )
  }

  return (
    <div style={styles.container}>
      <div style={styles.header}>
        <div style={styles.title}>
          <CodeIcon size={20} style={{ color: 'var(--accent)' }} />
          <span>CodeVault 代码保险库</span>
        </div>
        <div style={styles.headerStats}>
          <div style={styles.stat}><FolderIcon size={12} /> {stats.total} 片段</div>
          <div style={styles.stat}><StarIcon size={12} style={{ color: '#fbbf24' }} /> {stats.favorites} 收藏</div>
          <div style={styles.stat}><LayersIcon size={12} /> {stats.languages} 语言</div>
          <div style={styles.stat}><TerminalIcon size={12} /> {stats.usage} 次使用</div>
        </div>
      </div>

      <div style={styles.mainContent}>
        <div style={styles.sidebar}>
          <button style={styles.newBtn} onClick={() => setIsCreating(true)}>
            <PlusIcon size={16} />新建片段
          </button>

          <div>
            <div style={styles.sectionTitle}>分类</div>
            <div style={styles.categoryList}>
              {CATEGORIES.map(cat => {
                const count = cat.id === 'all' 
                  ? snippets.length 
                  : snippets.filter(s => s.category === cat.id).length
                return (
                  <div
                    key={cat.id}
                    style={{
                      ...styles.categoryItem,
                      ...(selectedCategory === cat.id ? styles.categoryActive : {}),
                    }}
                    onClick={() => setSelectedCategory(cat.id)}
                  >
                    <span>{cat.icon} {cat.name}</span>
                    <span style={styles.categoryCount}>{count}</span>
                  </div>
                )
              })}
            </div>
          </div>

          <div>
            <div style={styles.sectionTitle}>编程语言</div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
              <button
                style={{
                  padding: '6px 10px',
                  borderRadius: '16px',
                  border: '1px solid var(--window-border)',
                  background: selectedLanguage === 'all' ? 'var(--accent)' : 'transparent',
                  color: selectedLanguage === 'all' ? '#fff' : 'var(--text-secondary)',
                  cursor: 'pointer',
                  fontSize: '11px',
                }}
                onClick={() => setSelectedLanguage('all')}
              >
                全部
              </button>
              {LANGUAGES.map(l => (
                <button
                  key={l.id}
                  style={{
                    padding: '6px 10px',
                    borderRadius: '16px',
                    border: `1px solid ${selectedLanguage === l.id ? l.color : 'var(--window-border)'}`,
                    background: selectedLanguage === l.id ? l.color : 'transparent',
                    color: selectedLanguage === l.id ? '#fff' : 'var(--text-secondary)',
                    cursor: 'pointer',
                    fontSize: '11px',
                  }}
                  onClick={() => setSelectedLanguage(l.id)}
                >
                  {l.name}
                </button>
              ))}
            </div>
          </div>

          <div style={{ marginTop: 'auto', display: 'flex', flexDirection: 'column', gap: '8px' }}>
            <div style={styles.sectionTitle}>数据管理</div>
            <button style={styles.smallBtn} onClick={exportSnippets}>
              <DownloadIcon size={12} />导出 JSON
            </button>
            <button style={styles.smallBtn} onClick={importSnippets}>
              <UploadIcon size={12} />导入 JSON
            </button>
          </div>
        </div>

        <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
          <div style={styles.toolbar}>
            <div style={{ position: 'relative', flex: 1 }}>
              <SearchIcon size={16} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-secondary)' }} />
              <input
                style={{ ...styles.searchInput, paddingLeft: '40px' }}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="搜索代码片段（标题、描述、标签或代码内容）..."
              />
            </div>
            <button
              style={{
                ...styles.filterBtn,
                ...(showFavoritesOnly ? styles.filterBtnActive : {}),
              }}
              onClick={() => setShowFavoritesOnly(!showFavoritesOnly)}
            >
              <StarIcon size={14} style={{ color: showFavoritesOnly ? '#fbbf24' : undefined }} />
              仅收藏
            </button>
            <div style={styles.viewToggle}>
              <button
                style={{ ...styles.viewBtn, ...(viewMode === 'grid' ? styles.viewBtnActive : {}) }}
                onClick={() => setViewMode('grid')}
              >
                <GridIcon size={14} />
              </button>
              <button
                style={{ ...styles.viewBtn, ...(viewMode === 'list' ? styles.viewBtnActive : {}) }}
                onClick={() => setViewMode('list')}
              >
                <ListIcon size={14} />
              </button>
            </div>
          </div>

          <div style={styles.content}>
            {filteredSnippets.length === 0 ? (
              <div style={styles.empty}>
                <CodeIcon size={64} style={{ opacity: 0.3 }} />
                <p style={{ fontSize: '16px', fontWeight: 600 }}>没有找到代码片段</p>
                <p style={{ fontSize: '13px' }}>
                  {searchQuery ? '尝试修改搜索条件' : '点击"新建片段"添加第一个代码片段'}
                </p>
              </div>
            ) : (
              <div style={viewMode === 'grid' ? styles.grid : styles.list}>
                {filteredSnippets.map(snippet => {
                  const langInfo = getLanguageInfo(snippet.language)
                  const catInfo = getCategoryInfo(snippet.category)
                  return (
                    <div
                      key={snippet.id}
                      style={styles.card}
                      onClick={() => setSelectedSnippet(snippet)}
                      onMouseEnter={(e) => Object.assign(e.currentTarget.style, styles.cardHover)}
                      onMouseLeave={(e) => Object.assign(e.currentTarget.style, {
                        borderColor: 'var(--window-border)',
                        transform: 'none',
                        boxShadow: 'none',
                      })}
                    >
                      <div style={styles.cardHeader}>
                        <span style={styles.cardTitle}>{snippet.title}</span>
                        <button
                          style={{ ...styles.actionBtn, width: '28px', height: '28px' }}
                          onClick={(e) => { e.stopPropagation(); toggleFavorite(snippet.id) }}
                          title={snippet.isFavorite ? '取消收藏' : '收藏'}
                        >
                          <StarIcon size={14} style={{ color: snippet.isFavorite ? '#fbbf24' : 'var(--text-secondary)' }} />
                        </button>
                      </div>
                      <div style={styles.cardDesc}>{snippet.description || '无描述'}</div>
                      <div style={styles.codePreview}>{snippet.code}</div>
                      <div style={{ padding: '8px 14px 0' }}>
                        {snippet.tags.slice(0, 3).map(tag => (
                          <span key={tag} style={styles.tag}>{tag}</span>
                        ))}
                      </div>
                      <div style={styles.cardFooter}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                          <span
                            style={{
                              ...styles.langBadge,
                              background: langInfo.color + '20',
                              color: langInfo.color,
                            }}
                          >
                            {langInfo.name}
                          </span>
                          <span>{catInfo.icon} {catInfo.name}</span>
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                          <span><ClockIcon size={10} /> {formatDate(snippet.updatedAt)}</span>
                          <span><CopyIcon size={10} /> {snippet.usageCount}</span>
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </div>
        </div>
      </div>

      {selectedSnippet && !isEditing && !isCreating && (
        <div style={styles.modal} onClick={() => setSelectedSnippet(null)}>
          <div style={styles.modalContent} onClick={(e) => e.stopPropagation()}>
            <div style={styles.modalHeader}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <CodeIcon size={20} style={{ color: 'var(--accent)' }} />
                <span style={{ fontSize: '16px', fontWeight: 600 }}>{selectedSnippet.title}</span>
                <span
                  style={{
                    ...styles.langBadge,
                    background: getLanguageInfo(selectedSnippet.language).color + '20',
                    color: getLanguageInfo(selectedSnippet.language).color,
                  }}
                >
                  {getLanguageInfo(selectedSnippet.language).name}
                </span>
              </div>
              <div style={{ display: 'flex', gap: '8px' }}>
                <button
                  style={styles.smallBtn}
                  onClick={() => toggleFavorite(selectedSnippet.id)}
                >
                  <StarIcon size={14} style={{ color: selectedSnippet.isFavorite ? '#fbbf24' : undefined }} />
                  {selectedSnippet.isFavorite ? '已收藏' : '收藏'}
                </button>
                <button
                  style={styles.smallBtn}
                  onClick={() => { setIsEditing(true) }}
                >
                  <EditIcon size={14} />编辑
                </button>
                <button
                  style={{ ...styles.smallBtn, color: '#ef4444' }}
                  onClick={() => deleteSnippet(selectedSnippet.id)}
                >
                  <TrashIcon size={14} />删除
                </button>
                <button
                  style={styles.smallBtn}
                  onClick={() => setSelectedSnippet(null)}
                >
                  ✕
                </button>
              </div>
            </div>
            <div style={styles.modalBody}>
              {selectedSnippet.description && (
                <p style={styles.detailDesc}>{selectedSnippet.description}</p>
              )}
              <div style={styles.detailMeta}>
                <span>📁 {getCategoryInfo(selectedSnippet.category).name}</span>
                <span>⏱️ {formatDate(selectedSnippet.updatedAt)} 更新</span>
                <span>📊 使用 {selectedSnippet.usageCount} 次</span>
                {selectedSnippet.tags.map(t => (
                  <span key={t} style={styles.tag}>{t}</span>
                ))}
              </div>
              <div style={styles.detailCode}>
                <div style={styles.codeActions}>
                  <button
                    style={styles.actionBtn}
                    onClick={() => copySnippet(selectedSnippet)}
                    title="复制代码"
                  >
                    {copiedId === selectedSnippet.id ? <CheckIcon size={14} style={{ color: '#22c55e' }} /> : <CopyIcon size={14} />}
                  </button>
                </div>
                <pre style={{ margin: 0, whiteSpace: 'pre-wrap' }}>{selectedSnippet.code}</pre>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default CodeVault
