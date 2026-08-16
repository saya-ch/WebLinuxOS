import { useState, useEffect, useCallback, useRef, useMemo } from 'react'
import { useStore } from '../store'

interface Snippet {
  id: string
  title: string
  code: string
  language: string
  description: string
  tags: string[]
  favorite: boolean
  createdAt: number
  updatedAt: number
  folderId: string
}

interface Folder {
  id: string
  name: string
  icon: string
  count: number
}

const LANGUAGES = [
  { id: 'javascript', name: 'JavaScript', icon: '🟨', keywords: ['js', 'javascript', 'es6'] },
  { id: 'typescript', name: 'TypeScript', icon: '🔷', keywords: ['ts', 'typescript'] },
  { id: 'python', name: 'Python', icon: '🐍', keywords: ['py', 'python'] },
  { id: 'java', name: 'Java', icon: '☕', keywords: ['java', 'jvm'] },
  { id: 'go', name: 'Go', icon: '🔵', keywords: ['go', 'golang'] },
  { id: 'rust', name: 'Rust', icon: '🦀', keywords: ['rust', 'rs'] },
  { id: 'cpp', name: 'C++', icon: '⚙️', keywords: ['cpp', 'c++', 'cxx'] },
  { id: 'html', name: 'HTML', icon: '📄', keywords: ['html', 'htm'] },
  { id: 'css', name: 'CSS', icon: '🎨', keywords: ['css', 'scss', 'sass'] },
  { id: 'sql', name: 'SQL', icon: '🗄️', keywords: ['sql', 'mysql', 'postgres'] },
  { id: 'bash', name: 'Bash/Shell', icon: '💻', keywords: ['bash', 'shell', 'sh', 'zsh'] },
  { id: 'json', name: 'JSON', icon: '📋', keywords: ['json'] },
  { id: 'markdown', name: 'Markdown', icon: '📝', keywords: ['md', 'markdown'] },
  { id: 'yaml', name: 'YAML', icon: '⚙️', keywords: ['yaml', 'yml'] },
  { id: 'dockerfile', name: 'Dockerfile', icon: '🐳', keywords: ['docker', 'dockerfile'] },
  { id: 'xml', name: 'XML', icon: '📄', keywords: ['xml'] },
  { id: 'php', name: 'PHP', icon: '🐘', keywords: ['php'] },
  { id: 'ruby', name: 'Ruby', icon: '💎', keywords: ['ruby', 'rb'] },
  { id: 'swift', name: 'Swift', icon: '🍎', keywords: ['swift'] },
  { id: 'kotlin', name: 'Kotlin', icon: '🟣', keywords: ['kotlin', 'kt'] },
]

const DEFAULT_FOLDERS: Folder[] = [
  { id: 'all', name: '全部', icon: '📚', count: 0 },
  { id: 'favorites', name: '收藏', icon: '⭐', count: 0 },
  { id: 'recent', name: '最近', icon: '🕐', count: 0 },
  { id: 'work', name: '工作', icon: '💼', count: 0 },
  { id: 'personal', name: '个人', icon: '🏠', count: 0 },
  { id: 'learning', name: '学习', icon: '🎓', count: 0 },
]

const EMBEDDED_SNIPPETS: Omit<Snippet, 'id' | 'createdAt' | 'updatedAt'>[] = [
  {
    title: '防抖函数',
    code: `function debounce(fn, delay = 300) {
  let timer = null;
  return function (...args) {
    if (timer) clearTimeout(timer);
    timer = setTimeout(() => {
      fn.apply(this, args);
    }, delay);
  };
}`,
    language: 'javascript',
    description: '通用防抖函数实现，支持上下文绑定',
    tags: ['工具函数', '性能优化'],
    favorite: true,
    folderId: 'work',
  },
  {
    title: '节流函数',
    code: `function throttle(fn, interval = 300) {
  let lastTime = 0;
  return function (...args) {
    const now = Date.now();
    if (now - lastTime >= interval) {
      lastTime = now;
      fn.apply(this, args);
    }
  };
}`,
    language: 'javascript',
    description: '节流函数实现，限制函数执行频率',
    tags: ['工具函数', '性能优化'],
    favorite: false,
    folderId: 'work',
  },
  {
    title: 'Deep Clone',
    code: `function deepClone(obj) {
  if (obj === null || typeof obj !== 'object') return obj;
  if (obj instanceof Date) return new Date(obj);
  if (obj instanceof RegExp) return new RegExp(obj);
  
  const clone = Array.isArray(obj) ? [] : {};
  for (let key in obj) {
    if (Object.prototype.hasOwnProperty.call(obj, key)) {
      clone[key] = deepClone(obj[key]);
    }
  }
  return clone;
}`,
    language: 'javascript',
    description: '深拷贝实现，支持日期和正则表达式',
    tags: ['工具函数', '对象操作'],
    favorite: true,
    folderId: 'work',
  },
  {
    title: 'Python 装饰器模式',
    code: `import functools
import time

def timer(func):
    @functools.wraps(func)
    def wrapper(*args, **kwargs):
        start = time.perf_counter()
        result = func(*args, **kwargs)
        elapsed = time.perf_counter() - start
        print(f'{func.__name__} took {elapsed:.4f}s')
        return result
    return wrapper

@timer
def slow_function():
    time.sleep(1)
    return 'done'`,
    language: 'python',
    description: 'Python 计时装饰器示例',
    tags: ['装饰器', '性能'],
    favorite: false,
    folderId: 'learning',
  },
  {
    title: 'React Hooks 模板',
    code: `import { useState, useEffect, useCallback } from 'react';

function useCustomHook(initialValue) {
  const [value, setValue] = useState(initialValue);
  
  useEffect(() => {
    // 副作用逻辑
    return () => {
      // 清理逻辑
    };
  }, []);
  
  const updateValue = useCallback((newValue) => {
    setValue(newValue);
  }, []);
  
  return [value, updateValue];
}`,
    language: 'javascript',
    description: 'React 自定义 Hook 模板',
    tags: ['react', 'hooks'],
    favorite: true,
    folderId: 'work',
  },
]

const STORAGE_KEY = 'weblinux_snippets'
const FOLDERS_KEY = 'weblinux_snippet_folders'

export default function CodeSnippetManager() {
  const addNotification = useStore((s) => s.addNotification)
  const [snippets, setSnippets] = useState<Snippet[]>([])
  const [folders, setFolders] = useState<Folder[]>(DEFAULT_FOLDERS)
  const [selectedFolder, setSelectedFolder] = useState('all')
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedLanguage, setSelectedLanguage] = useState('all')
  const [selectedSnippet, setSelectedSnippet] = useState<Snippet | null>(null)
  const [isEditing, setIsEditing] = useState(false)
  const [isCreating, setIsCreating] = useState(false)
  const [editForm, setEditForm] = useState({ title: '', code: '', language: 'javascript', description: '', tags: '' })
  const [viewMode, setViewMode] = useState<'list' | 'grid'>('list')
  const fileInputRef = useRef<HTMLInputElement>(null)
  const codeRef = useRef<HTMLTextAreaElement>(null)

  useEffect(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY)
      if (saved) {
        setSnippets(JSON.parse(saved) as Snippet[])
      } else {
        const initialSnippets = EMBEDDED_SNIPPETS.map((s) => ({
          ...s,
          id: `snippet-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
          createdAt: Date.now(),
          updatedAt: Date.now(),
        }))
        setSnippets(initialSnippets)
        localStorage.setItem(STORAGE_KEY, JSON.stringify(initialSnippets))
      }

      const savedFolders = localStorage.getItem(FOLDERS_KEY)
      if (savedFolders) {
        const userFolders = JSON.parse(savedFolders)
        setFolders([...DEFAULT_FOLDERS, ...userFolders])
      }
    } catch {
      setSnippets(EMBEDDED_SNIPPETS.map((s) => ({
        ...s,
        id: `snippet-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
        createdAt: Date.now(),
        updatedAt: Date.now(),
      })))
    }
  }, [])

  useEffect(() => {
    if (snippets.length > 0) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(snippets))
    }
  }, [snippets])

  const updateFolderCounts = useMemo(() => {
    return folders.map((folder) => ({
      ...folder,
      count: folder.id === 'all'
        ? snippets.length
        : folder.id === 'favorites'
        ? snippets.filter((s) => s.favorite).length
        : folder.id === 'recent'
        ? snippets.filter((s) => Date.now() - s.updatedAt < 7 * 24 * 60 * 60 * 1000).length
        : snippets.filter((s) => s.folderId === folder.id).length,
    }))
  }, [folders, snippets])

  const filteredSnippets = useMemo<Snippet[]>(() => {
    let result: Snippet[] = snippets

    if (selectedFolder === 'favorites') {
      result = result.filter((s) => s.favorite)
    } else if (selectedFolder === 'recent') {
      result = result.filter((s) => Date.now() - s.updatedAt < 7 * 24 * 60 * 60 * 1000)
    } else if (selectedFolder !== 'all') {
      result = result.filter((s) => s.folderId === selectedFolder)
    }

    if (selectedLanguage !== 'all') {
      result = result.filter((s) => s.language === selectedLanguage)
    }

    if (searchQuery) {
      const query = searchQuery.toLowerCase()
      result = result.filter(
        (s) =>
          s.title.toLowerCase().includes(query) ||
          s.code.toLowerCase().includes(query) ||
          s.description.toLowerCase().includes(query) ||
          s.tags.some((t) => t.toLowerCase().includes(query))
      )
    }

    return result.sort((a, b) => b.updatedAt - a.updatedAt)
  }, [snippets, selectedFolder, selectedLanguage, searchQuery])

  const handleCreate = useCallback(() => {
    setIsCreating(true)
    setIsEditing(false)
    setEditForm({
      title: '',
      code: '',
      language: 'javascript',
      description: '',
      tags: '',
    })
    setSelectedSnippet(null)
  }, [])

  const handleEdit = useCallback((snippet: Snippet) => {
    setIsEditing(true)
    setIsCreating(false)
    setEditForm({
      title: snippet.title,
      code: snippet.code,
      language: snippet.language,
      description: snippet.description,
      tags: snippet.tags.join(', '),
    })
    setSelectedSnippet(snippet)
  }, [])

  const handleSave = useCallback(() => {
    if (!editForm.title.trim()) {
      addNotification({ title: '警告', message: '请输入标题', type: 'warning' })
      return
    }

    const tags = editForm.tags
      .split(',')
      .map((t) => t.trim())
      .filter(Boolean)

    if (isCreating) {
      const newSnippet: Snippet = {
        id: `snippet-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
        title: editForm.title,
        code: editForm.code,
        language: editForm.language,
        description: editForm.description,
        tags,
        favorite: false,
        createdAt: Date.now(),
        updatedAt: Date.now(),
        folderId: selectedFolder === 'all' ? 'personal' : selectedFolder,
      }
      setSnippets((prev) => [...prev, newSnippet])
      setIsCreating(false)
      setSelectedSnippet(newSnippet)
      addNotification({ title: '成功', message: '代码片段已创建', type: 'success' })
    } else if (isEditing && selectedSnippet) {
      setSnippets((prev) =>
        prev.map((s) =>
          s.id === selectedSnippet.id
            ? {
                ...s,
                title: editForm.title,
                code: editForm.code,
                language: editForm.language,
                description: editForm.description,
                tags,
                updatedAt: Date.now(),
              }
            : s
        )
      )
      setIsEditing(false)
      addNotification({ title: '成功', message: '代码片段已更新', type: 'success' })
    }
  }, [editForm, isCreating, isEditing, selectedSnippet, selectedFolder, addNotification])

  const handleDelete = useCallback(
    (id: string) => {
      if (!confirm('确定要删除这个代码片段吗？')) return
      setSnippets((prev) => prev.filter((s) => s.id !== id))
      setSelectedSnippet(null)
      setIsEditing(false)
      setIsCreating(false)
      addNotification({ title: '成功', message: '代码片段已删除', type: 'success' })
    },
    [addNotification]
  )

  const handleToggleFavorite = useCallback(
    (id: string) => {
      setSnippets((prev) =>
        prev.map((s) => (s.id === id ? { ...s, favorite: !s.favorite } : s))
      )
    },
    []
  )

  const handleCopyCode = useCallback(
    (code: string) => {
      navigator.clipboard.writeText(code).then(
        () => addNotification({ title: '成功', message: '代码已复制到剪贴板', type: 'success' }),
        () => addNotification({ title: '错误', message: '复制失败', type: 'error' })
      )
    },
    [addNotification]
  )

  const handleExport = useCallback(
    (snippet: Snippet) => {
      const data = JSON.stringify(snippet, null, 2)
      const blob = new Blob([data], { type: 'application/json' })
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `${snippet.title}-${Date.now()}.json`
      a.click()
      URL.revokeObjectURL(url)
      addNotification({ title: '成功', message: '代码片段已导出', type: 'success' })
    },
    [addNotification]
  )

  const handleExportAll = useCallback(() => {
    const data = JSON.stringify(snippets, null, 2)
    const blob = new Blob([data], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `snippets-backup-${Date.now()}.json`
    a.click()
    URL.revokeObjectURL(url)
    addNotification({ title: '成功', message: '所有代码片段已导出', type: 'success' })
  }, [snippets, addNotification])

  const handleImport = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0]
      if (!file) return

      const reader = new FileReader()
      reader.onload = (event) => {
        try {
          const data = JSON.parse(event.target?.result as string)
          const importedSnippets = Array.isArray(data) ? data : [data]
          
          setSnippets((prev) => {
            const existingIds = new Set(prev.map((s) => s.id))
            const newSnippets = importedSnippets
              .filter((s: Snippet) => !existingIds.has(s.id))
              .map((s: Snippet) => ({
                ...s,
                id: s.id || `snippet-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
                createdAt: s.createdAt || Date.now(),
                updatedAt: Date.now(),
              }))
            return [...prev, ...newSnippets]
          })
          
          addNotification({
            title: '成功',
            message: `已导入 ${importedSnippets.length} 个代码片段`,
            type: 'success',
          })
        } catch {
          addNotification({ title: '错误', message: '导入失败，文件格式无效', type: 'error' })
        }
      }
      reader.readAsText(file)
    },
    [addNotification]
  )

  const handleExportAsCode = useCallback(
    (snippet: Snippet) => {
      const ext = getFileExtension(snippet.language)
      const blob = new Blob([snippet.code], { type: 'text/plain' })
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `${snippet.title}.${ext}`
      a.click()
      URL.revokeObjectURL(url)
      addNotification({ title: '成功', message: '代码文件已下载', type: 'success' })
    },
    [addNotification]
  )

  const getFileExtension = (language: string): string => {
    const extensions: Record<string, string> = {
      javascript: 'js',
      typescript: 'ts',
      python: 'py',
      java: 'java',
      go: 'go',
      rust: 'rs',
      cpp: 'cpp',
      html: 'html',
      css: 'css',
      sql: 'sql',
      bash: 'sh',
      json: 'json',
      markdown: 'md',
      yaml: 'yaml',
      dockerfile: 'dockerfile',
      xml: 'xml',
      php: 'php',
      ruby: 'rb',
      swift: 'swift',
      kotlin: 'kt',
    }
    return extensions[language] || 'txt'
  }

  const getLanguageDisplay = (langId: string) => {
    return LANGUAGES.find((l) => l.id === langId) || { name: langId, icon: '📄' }
  }

  const highlightCode = (code: string, language: string) => {
    const keywords: Record<string, string[]> = {
      javascript: ['const', 'let', 'var', 'function', 'return', 'if', 'else', 'for', 'while', 'import', 'export', 'class', 'async', 'await', 'new', 'this', 'try', 'catch'],
      typescript: ['const', 'let', 'var', 'function', 'return', 'if', 'else', 'for', 'while', 'import', 'export', 'class', 'async', 'await', 'new', 'this', 'try', 'catch', 'interface', 'type', 'extends', 'implements'],
      python: ['def', 'class', 'import', 'from', 'return', 'if', 'else', 'elif', 'for', 'while', 'try', 'except', 'with', 'as', 'lambda', 'yield'],
      java: ['public', 'private', 'protected', 'class', 'interface', 'extends', 'implements', 'void', 'int', 'String', 'boolean', 'return', 'new', 'if', 'else', 'for', 'while', 'import', 'static'],
      go: ['func', 'var', 'const', 'package', 'import', 'return', 'if', 'else', 'for', 'range', 'type', 'struct', 'interface', 'go', 'chan', 'defer'],
      rust: ['fn', 'let', 'mut', 'struct', 'enum', 'trait', 'impl', 'pub', 'mod', 'use', 'return', 'if', 'else', 'for', 'while', 'loop', 'match', 'self'],
    }

    const keywords_for_lang = keywords[language] || []
    const escaped = keywords_for_lang.map((k) => k.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'))
    const keywordPattern = escaped.length ? new RegExp(`\\b(${escaped.join('|')})\\b`, 'g') : null
    const stringPattern = /(["'`])((?:\\.|(?!\1).)*)\1/g
    const commentPatterns: Record<string, RegExp> = {
      javascript: /\/\/.*$|\/\*[\s\S]*?\*\//gm,
      typescript: /\/\/.*$|\/\*[\s\S]*?\*\//gm,
      python: /#.*$/gm,
      java: /\/\/.*$|\/\*[\s\S]*?\*\//gm,
      go: /\/\/.*$|\/\*[\s\S]*?\*\//gm,
      rust: /\/\/.*$|\/\*[\s\S]*?\*\//gm,
      cpp: /\/\/.*$|\/\*[\s\S]*?\*\//gm,
    }
    const commentPattern = commentPatterns[language] || null

    const lines = code.split('\n')
    return lines.map((line, lineIndex) => {
      let highlighted = line

      if (commentPattern) {
        const commentMatch = commentPattern.exec(line)
        if (commentMatch) {
          return `<span style="color: #6a9955">${escapeHtml(line)}</span>`
        }
        commentPattern.lastIndex = 0
      }

      highlighted = escapeHtml(highlighted)

      if (keywordPattern) {
        highlighted = highlighted.replace(keywordPattern, '<span style="color: #569cd6">$&</span>')
      }

      highlighted = highlighted.replace(
        stringPattern,
        '<span style="color: #ce9178">$&</span>'
      )

      return `<div style="min-height: 1.5em"><span style="color: #858585; display: inline-block; width: 2em; text-align: right; margin-right: 1em; user-select: none">${lineIndex + 1}</span>${highlighted}</div>`
    }).join('')
  }

  const escapeHtml = (str: string): string => {
    const div = document.createElement('div')
    div.textContent = str
    return div.innerHTML
  }

  const previewRef = useRef<HTMLDivElement>(null)

  const handleEditorKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Tab') {
      e.preventDefault()
      const target = e.target as HTMLTextAreaElement
      const start = target.selectionStart
      const end = target.selectionEnd
      const value = target.value
      const newValue = value.substring(0, start) + '  ' + value.substring(end)
      target.value = newValue
      target.selectionStart = target.selectionEnd = start + 2
      setEditForm((prev) => ({ ...prev, code: newValue }))
    }
  }

  return (
    <div style={{
      padding: 24,
      display: 'flex',
      flexDirection: 'column',
      gap: 16,
      height: '100%',
      overflow: 'auto',
    }}>
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginBottom: 8,
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <div style={{
            fontSize: 32,
            width: 48,
            height: 48,
            borderRadius: 12,
            background: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}>💻</div>
          <div>
            <h2 style={{ margin: 0, fontSize: 20, color: 'var(--text-primary)' }}>代码片段管理器</h2>
            <p style={{ margin: 0, fontSize: 12, color: 'var(--text-secondary)' }}>
              专业代码片段管理 · 语法高亮 · 标签分类 · 一键导出
            </p>
          </div>
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          <button onClick={() => fileInputRef.current?.click()} style={{
            padding: '8px 16px',
            borderRadius: 8,
            border: '1px solid var(--window-border)',
            background: 'var(--window-bg)',
            color: 'var(--text-primary)',
            cursor: 'pointer',
            fontSize: 13,
          }}>📥 导入</button>
          <input
            ref={fileInputRef}
            type="file"
            accept=".json"
            onChange={handleImport}
            style={{ display: 'none' }}
          />
          <button onClick={handleExportAll} style={{
            padding: '8px 16px',
            borderRadius: 8,
            border: '1px solid var(--window-border)',
            background: 'var(--window-bg)',
            color: 'var(--text-primary)',
            cursor: 'pointer',
            fontSize: 13,
          }}>📤 导出全部</button>
          <button onClick={handleCreate} style={{
            padding: '8px 16px',
            borderRadius: 8,
            border: 'none',
            background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
            color: '#fff',
            cursor: 'pointer',
            fontSize: 13,
            fontWeight: 500,
          }}>➕ 新建片段</button>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '200px 1fr', gap: 16 }}>
        <div style={{
          background: 'var(--window-bg)',
          borderRadius: 12,
          padding: 16,
          border: '1px solid var(--window-border)',
          display: 'flex',
          flexDirection: 'column',
          gap: 12,
        }}>
          <div>
            <h3 style={{ margin: '0 0 8px 0', fontSize: 12, color: 'var(--text-secondary)', textTransform: 'uppercase' }}>文件夹</h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
              {updateFolderCounts.map((folder) => (
                <button
                  key={folder.id}
                  onClick={() => setSelectedFolder(folder.id)}
                  style={{
                    padding: '8px 12px',
                    borderRadius: 8,
                    border: selectedFolder === folder.id ? '1px solid var(--accent)' : '1px solid transparent',
                    background: selectedFolder === folder.id ? 'var(--accent-bg)' : 'transparent',
                    color: selectedFolder === folder.id ? 'var(--accent)' : 'var(--text-primary)',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    fontSize: 13,
                  }}
                >
                  <span style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <span>{folder.icon}</span>
                    <span>{folder.name}</span>
                  </span>
                  <span style={{ fontSize: 11, color: 'var(--text-secondary)' }}>{folder.count}</span>
                </button>
              ))}
            </div>
          </div>

          <div>
            <h3 style={{ margin: '0 0 8px 0', fontSize: 12, color: 'var(--text-secondary)', textTransform: 'uppercase' }}>语言</h3>
            <select
              value={selectedLanguage}
              onChange={(e) => setSelectedLanguage(e.target.value)}
              style={{
                width: '100%',
                padding: '8px 12px',
                borderRadius: 8,
                border: '1px solid var(--window-border)',
                background: 'var(--window-bg)',
                color: 'var(--text-primary)',
                fontSize: 13,
              }}
            >
              <option value="all">全部语言</option>
              {LANGUAGES.map((lang) => (
                <option key={lang.id} value={lang.id}>
                  {lang.icon} {lang.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <h3 style={{ margin: '0 0 8px 0', fontSize: 12, color: 'var(--text-secondary)', textTransform: 'uppercase' }}>统计</h3>
            <div style={{
              padding: 12,
              borderRadius: 8,
              background: 'var(--window-bg)',
              border: '1px solid var(--window-border)',
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
                <span style={{ fontSize: 12, color: 'var(--text-secondary)' }}>总计</span>
                <span style={{ fontSize: 14, fontWeight: 600, color: 'var(--text-primary)' }}>{snippets.length}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
                <span style={{ fontSize: 12, color: 'var(--text-secondary)' }}>收藏</span>
                <span style={{ fontSize: 14, fontWeight: 600, color: '#f59e0b' }}>
                  {snippets.filter((s) => s.favorite).length}
                </span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ fontSize: 12, color: 'var(--text-secondary)' }}>语言数</span>
                <span style={{ fontSize: 14, fontWeight: 600, color: 'var(--accent)' }}>
                  {new Set(snippets.map((s) => s.language)).size}
                </span>
              </div>
            </div>
          </div>
        </div>

        <div style={{
          background: 'var(--window-bg)',
          borderRadius: 12,
          border: '1px solid var(--window-border)',
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden',
        }}>
          <div style={{
            padding: 16,
            borderBottom: '1px solid var(--window-border)',
            display: 'flex',
            gap: 12,
            alignItems: 'center',
          }}>
            <input
              type="text"
              placeholder="🔍 搜索代码片段..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              style={{
                flex: 1,
                padding: '10px 16px',
                borderRadius: 8,
                border: '1px solid var(--window-border)',
                background: 'var(--window-bg)',
                color: 'var(--text-primary)',
                fontSize: 14,
              }}
            />
            <div style={{ display: 'flex', gap: 4 }}>
              <button
                onClick={() => setViewMode('list')}
                style={{
                  padding: '8px 12px',
                  borderRadius: 6,
                  border: viewMode === 'list' ? '1px solid var(--accent)' : '1px solid var(--window-border)',
                  background: viewMode === 'list' ? 'var(--accent-bg)' : 'transparent',
                  color: viewMode === 'list' ? 'var(--accent)' : 'var(--text-primary)',
                  cursor: 'pointer',
                  fontSize: 13,
                }}
              >
                📋
              </button>
              <button
                onClick={() => setViewMode('grid')}
                style={{
                  padding: '8px 12px',
                  borderRadius: 6,
                  border: viewMode === 'grid' ? '1px solid var(--accent)' : '1px solid var(--window-border)',
                  background: viewMode === 'grid' ? 'var(--accent-bg)' : 'transparent',
                  color: viewMode === 'grid' ? 'var(--accent)' : 'var(--text-primary)',
                  cursor: 'pointer',
                  fontSize: 13,
                }}
              >
                ▦
              </button>
            </div>
          </div>

          {(isCreating || isEditing) ? (
            <div style={{ padding: 24, overflow: 'auto', flex: 1 }}>
              <h3 style={{ margin: '0 0 16px 0', fontSize: 18, color: 'var(--text-primary)' }}>
                {isCreating ? '创建新代码片段' : '编辑代码片段'}
              </h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                <div>
                  <label style={{ fontSize: 13, color: 'var(--text-secondary)', display: 'block', marginBottom: 6 }}>标题</label>
                  <input
                    type="text"
                    value={editForm.title}
                    onChange={(e) => setEditForm({ ...editForm, title: e.target.value })}
                    placeholder="输入代码片段标题..."
                    style={{
                      width: '100%',
                      padding: '10px 14px',
                      borderRadius: 8,
                      border: '1px solid var(--window-border)',
                      background: 'var(--window-bg)',
                      color: 'var(--text-primary)',
                      fontSize: 14,
                    }}
                  />
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                  <div>
                    <label style={{ fontSize: 13, color: 'var(--text-secondary)', display: 'block', marginBottom: 6 }}>编程语言</label>
                    <select
                      value={editForm.language}
                      onChange={(e) => setEditForm({ ...editForm, language: e.target.value })}
                      style={{
                        width: '100%',
                        padding: '10px 14px',
                        borderRadius: 8,
                        border: '1px solid var(--window-border)',
                        background: 'var(--window-bg)',
                        color: 'var(--text-primary)',
                        fontSize: 14,
                      }}
                    >
                      {LANGUAGES.map((lang) => (
                        <option key={lang.id} value={lang.id}>
                          {lang.icon} {lang.name}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label style={{ fontSize: 13, color: 'var(--text-secondary)', display: 'block', marginBottom: 6 }}>标签（逗号分隔）</label>
                    <input
                      type="text"
                      value={editForm.tags}
                      onChange={(e) => setEditForm({ ...editForm, tags: e.target.value })}
                      placeholder="标签1, 标签2, 标签3"
                      style={{
                        width: '100%',
                        padding: '10px 14px',
                        borderRadius: 8,
                        border: '1px solid var(--window-border)',
                        background: 'var(--window-bg)',
                        color: 'var(--text-primary)',
                        fontSize: 14,
                      }}
                    />
                  </div>
                </div>

                <div>
                  <label style={{ fontSize: 13, color: 'var(--text-secondary)', display: 'block', marginBottom: 6 }}>描述</label>
                  <input
                    type="text"
                    value={editForm.description}
                    onChange={(e) => setEditForm({ ...editForm, description: e.target.value })}
                    placeholder="简要描述这个代码片段的用途..."
                    style={{
                      width: '100%',
                      padding: '10px 14px',
                      borderRadius: 8,
                      border: '1px solid var(--window-border)',
                      background: 'var(--window-bg)',
                      color: 'var(--text-primary)',
                      fontSize: 14,
                    }}
                  />
                </div>

                <div>
                  <label style={{ fontSize: 13, color: 'var(--text-secondary)', display: 'block', marginBottom: 6 }}>
                    代码 <span style={{ color: 'var(--text-secondary)', fontSize: 11 }}>(按Tab键插入2个空格)</span>
                  </label>
                  <textarea
                    ref={codeRef}
                    value={editForm.code}
                    onChange={(e) => setEditForm({ ...editForm, code: e.target.value })}
                    onKeyDown={handleEditorKeyDown}
                    placeholder="在此输入或粘贴代码..."
                    style={{
                      width: '100%',
                      minHeight: 300,
                      padding: 14,
                      borderRadius: 8,
                      border: '1px solid var(--window-border)',
                      background: '#1e1e2e',
                      color: '#cdd6f4',
                      fontFamily: 'Consolas, Monaco, "Courier New", monospace',
                      fontSize: 13,
                      lineHeight: 1.6,
                      resize: 'vertical',
                    }}
                  />
                </div>

                <div style={{ display: 'flex', gap: 12, justifyContent: 'flex-end' }}>
                  <button
                    onClick={() => {
                      setIsCreating(false)
                      setIsEditing(false)
                      setSelectedSnippet(null)
                    }}
                    style={{
                      padding: '10px 20px',
                      borderRadius: 8,
                      border: '1px solid var(--window-border)',
                      background: 'var(--window-bg)',
                      color: 'var(--text-primary)',
                      cursor: 'pointer',
                      fontSize: 14,
                    }}
                  >
                    取消
                  </button>
                  <button
                    onClick={handleSave}
                    style={{
                      padding: '10px 24px',
                      borderRadius: 8,
                      border: 'none',
                      background: 'var(--accent)',
                      color: '#fff',
                      cursor: 'pointer',
                      fontSize: 14,
                      fontWeight: 500,
                    }}
                  >
                    {isCreating ? '创建' : '保存'}
                  </button>
                </div>
              </div>
            </div>
          ) : selectedSnippet ? (
            <div style={{ display: 'flex', flexDirection: 'column', height: '100%', overflow: 'auto' }}>
              <div style={{
                padding: 20,
                borderBottom: '1px solid var(--window-border)',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'flex-start',
              }}>
                <div style={{ flex: 1 }}>
                  <h3 style={{ margin: '0 0 8px 0', fontSize: 18, color: 'var(--text-primary)' }}>
                    {selectedSnippet.title}
                    <button
                      onClick={() => handleToggleFavorite(selectedSnippet.id)}
                      style={{ marginLeft: 8, background: 'none', border: 'none', cursor: 'pointer', fontSize: 18 }}
                    >
                      {selectedSnippet.favorite ? '⭐' : '☆'}
                    </button>
                  </h3>
                  <div style={{ display: 'flex', gap: 8, alignItems: 'center', marginBottom: 8 }}>
                    <span style={{
                      padding: '4px 10px',
                      borderRadius: 12,
                      background: 'var(--accent-bg)',
                      color: 'var(--accent)',
                      fontSize: 12,
                    }}>
                      {getLanguageDisplay(selectedSnippet.language).icon} {getLanguageDisplay(selectedSnippet.language).name}
                    </span>
                    <span style={{ fontSize: 12, color: 'var(--text-secondary)' }}>
                      更新于 {new Date(selectedSnippet.updatedAt).toLocaleString()}
                    </span>
                  </div>
                  {selectedSnippet.description && (
                    <p style={{ margin: '0 0 8px 0', fontSize: 14, color: 'var(--text-secondary)' }}>
                      {selectedSnippet.description}
                    </p>
                  )}
                  <div style={{ display: 'flex', gap: 6 }}>
                    {selectedSnippet.tags.map((tag) => (
                      <span key={tag} style={{
                        padding: '3px 10px',
                        borderRadius: 10,
                        background: 'var(--window-border)',
                        color: 'var(--text-secondary)',
                        fontSize: 11,
                      }}>
                        #{tag}
                      </span>
                    ))}
                  </div>
                </div>
                <div style={{ display: 'flex', gap: 8 }}>
                  <button onClick={() => handleCopyCode(selectedSnippet.code)} style={{
                    padding: '8px 14px',
                    borderRadius: 6,
                    border: '1px solid var(--window-border)',
                    background: 'var(--window-bg)',
                    color: 'var(--text-primary)',
                    cursor: 'pointer',
                    fontSize: 12,
                  }}>📋 复制</button>
                  <button onClick={() => handleExportAsCode(selectedSnippet)} style={{
                    padding: '8px 14px',
                    borderRadius: 6,
                    border: '1px solid var(--window-border)',
                    background: 'var(--window-bg)',
                    color: 'var(--text-primary)',
                    cursor: 'pointer',
                    fontSize: 12,
                  }}>💾 下载</button>
                  <button onClick={() => handleExport(selectedSnippet)} style={{
                    padding: '8px 14px',
                    borderRadius: 6,
                    border: '1px solid var(--window-border)',
                    background: 'var(--window-bg)',
                    color: 'var(--text-primary)',
                    cursor: 'pointer',
                    fontSize: 12,
                  }}>📦 JSON</button>
                  <button onClick={() => handleEdit(selectedSnippet)} style={{
                    padding: '8px 14px',
                    borderRadius: 6,
                    border: '1px solid var(--window-border)',
                    background: 'var(--window-bg)',
                    color: 'var(--text-primary)',
                    cursor: 'pointer',
                    fontSize: 12,
                  }}>✏️ 编辑</button>
                  <button onClick={() => handleDelete(selectedSnippet.id)} style={{
                    padding: '8px 14px',
                    borderRadius: 6,
                    border: '1px solid #ef4444',
                    background: 'transparent',
                    color: '#ef4444',
                    cursor: 'pointer',
                    fontSize: 12,
                  }}>🗑️ 删除</button>
                </div>
              </div>
              <div style={{ padding: 20, flex: 1 }}>
                <div
                  ref={previewRef}
                  style={{
                    background: '#1e1e2e',
                    borderRadius: 8,
                    padding: 16,
                    overflow: 'auto',
                    maxHeight: 'calc(100vh - 250px)',
                  }}
                  dangerouslySetInnerHTML={{
                    __html: highlightCode(selectedSnippet.code, selectedSnippet.language),
                  }}
                />
              </div>
            </div>
          ) : (
            <div style={{ flex: 1, padding: 16, overflow: 'auto' }}>
              {filteredSnippets.length === 0 ? (
                <div style={{
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  justifyContent: 'center',
                  padding: 60,
                  color: 'var(--text-secondary)',
                }}>
                  <div style={{ fontSize: 48, marginBottom: 16 }}>📝</div>
                  <div style={{ fontSize: 16, marginBottom: 8 }}>暂无代码片段</div>
                  <div style={{ fontSize: 13 }}>点击"新建片段"创建第一个代码片段</div>
                </div>
              ) : viewMode === 'list' ? (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                  {filteredSnippets.map((snippet: Snippet) => (
                    <div
                      key={snippet.id}
                      onClick={() => setSelectedSnippet(snippet)}
                      style={{
                        padding: 14,
                        borderRadius: 10,
                        border: '1px solid var(--window-border)',
                        background: (selectedSnippet as Snippet | null)?.id === snippet.id ? 'var(--accent-bg)' : 'var(--window-bg)',
                        cursor: 'pointer',
                        transition: 'all 0.2s',
                      }}
                      onMouseEnter={(e) => {
                        if ((selectedSnippet as Snippet | null)?.id !== snippet.id) {
                          e.currentTarget.style.borderColor = 'var(--accent)'
                        }
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.borderColor = 'var(--window-border)'
                      }}
                    >
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                        <div style={{ flex: 1 }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
                            <span style={{ fontSize: 16 }}>
                              {getLanguageDisplay(snippet.language).icon}
                            </span>
                            <span style={{ fontSize: 15, fontWeight: 500, color: 'var(--text-primary)' }}>
                              {snippet.title}
                            </span>
                            {snippet.favorite && <span style={{ fontSize: 14 }}>⭐</span>}
                          </div>
                          {snippet.description && (
                            <div style={{ fontSize: 12, color: 'var(--text-secondary)', marginBottom: 6 }}>
                              {snippet.description}
                            </div>
                          )}
                          <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap' }}>
                            {snippet.tags.slice(0, 3).map((tag) => (
                              <span key={tag} style={{
                                padding: '2px 8px',
                                borderRadius: 8,
                                background: 'var(--window-border)',
                                color: 'var(--text-secondary)',
                                fontSize: 10,
                              }}>
                                #{tag}
                              </span>
                            ))}
                            {snippet.tags.length > 3 && (
                              <span style={{ fontSize: 10, color: 'var(--text-secondary)' }}>
                                +{snippet.tags.length - 3}
                              </span>
                            )}
                          </div>
                        </div>
                        <div style={{ textAlign: 'right' }}>
                          <div style={{ fontSize: 11, color: 'var(--text-secondary)' }}>
                            {getLanguageDisplay(snippet.language).name}
                          </div>
                          <div style={{ fontSize: 11, color: 'var(--text-secondary)', marginTop: 4 }}>
                            {new Date(snippet.updatedAt).toLocaleDateString()}
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 12 }}>
                  {filteredSnippets.map((snippet: Snippet) => (
                    <div
                      key={snippet.id}
                      onClick={() => setSelectedSnippet(snippet)}
                      style={{
                        padding: 16,
                        borderRadius: 10,
                        border: '1px solid var(--window-border)',
                        background: 'var(--window-bg)',
                        cursor: 'pointer',
                        transition: 'all 0.2s',
                        display: 'flex',
                        flexDirection: 'column',
                        gap: 8,
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.borderColor = 'var(--accent)'
                        e.currentTarget.style.transform = 'translateY(-2px)'
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.borderColor = 'var(--window-border)'
                        e.currentTarget.style.transform = 'translateY(0)'
                      }}
                    >
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <span style={{ fontSize: 20 }}>{getLanguageDisplay(snippet.language).icon}</span>
                        {snippet.favorite && <span style={{ fontSize: 16 }}>⭐</span>}
                      </div>
                      <div style={{ fontSize: 14, fontWeight: 500, color: 'var(--text-primary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {snippet.title}
                      </div>
                      {snippet.description && (
                        <div style={{ fontSize: 12, color: 'var(--text-secondary)', overflow: 'hidden', textOverflow: 'ellipsis', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical' }}>
                          {snippet.description}
                        </div>
                      )}
                      <div style={{
                        background: '#1e1e2e',
                        borderRadius: 6,
                        padding: 8,
                        fontSize: 10,
                        color: '#6c7086',
                        fontFamily: 'monospace',
                        maxHeight: 60,
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        display: '-webkit-box',
                        WebkitLineClamp: 3,
                        WebkitBoxOrient: 'vertical',
                      }}>
                        {snippet.code.slice(0, 100)}...
                      </div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <span style={{ fontSize: 11, color: 'var(--text-secondary)' }}>
                          {getLanguageDisplay(snippet.language).name}
                        </span>
                        <span style={{ fontSize: 11, color: 'var(--text-secondary)' }}>
                          {snippet.tags.length} 标签
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
