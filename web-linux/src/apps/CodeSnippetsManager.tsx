import { useState, useCallback, useMemo } from 'react'

interface Snippet {
  id: string
  title: string
  description: string
  code: string
  language: string
  tags: string[]
  createdAt: number
  updatedAt: number
}

const LANGUAGES = [
  { value: 'javascript', label: 'JavaScript', color: '#f7df1e' },
  { value: 'typescript', label: 'TypeScript', color: '#3178c6' },
  { value: 'python', label: 'Python', color: '#3776ab' },
  { value: 'html', label: 'HTML', color: '#e34f26' },
  { value: 'css', label: 'CSS', color: '#1572b6' },
  { value: 'json', label: 'JSON', color: '#292929' },
  { value: 'bash', label: 'Bash', color: '#4eaa25' },
  { value: 'sql', label: 'SQL', color: '#e38c00' },
  { value: 'markdown', label: 'Markdown', color: '#083fa1' },
  { value: 'java', label: 'Java', color: '#ed8b00' },
  { value: 'cpp', label: 'C++', color: '#00599c' },
  { value: 'csharp', label: 'C#', color: '#239120' },
  { value: 'go', label: 'Go', color: '#00add8' },
  { value: 'rust', label: 'Rust', color: '#dea584' },
  { value: 'php', label: 'PHP', color: '#777bb4' },
  { value: 'ruby', label: 'Ruby', color: '#cc342d' },
]

const DEFAULT_SNIPPETS: Snippet[] = [
  {
    id: 'snippet-1',
    title: 'Debounce 函数',
    description: '限制函数执行频率的工具函数',
    code: 'function debounce(func, wait) {\n  let timeout;\n  return function executedFunction(...args) {\n    const later = () => {\n      clearTimeout(timeout);\n      func(...args);\n    };\n    clearTimeout(timeout);\n    timeout = setTimeout(later, wait);\n  };\n}',
    language: 'javascript',
    tags: ['utility', 'javascript'],
    createdAt: Date.now() - 86400000,
    updatedAt: Date.now() - 86400000,
  },
  {
    id: 'snippet-2',
    title: '快速排序算法',
    description: '经典的排序算法实现',
    code: 'def quicksort(arr):\n    if len(arr) <= 1:\n        return arr\n    pivot = arr[len(arr) // 2]\n    left = [x for x in arr if x < pivot]\n    middle = [x for x in arr if x == pivot]\n    right = [x for x in arr if x > pivot]\n    return quicksort(left) + middle + quicksort(right)',
    language: 'python',
    tags: ['algorithm', 'sorting'],
    createdAt: Date.now() - 172800000,
    updatedAt: Date.now() - 172800000,
  },
  {
    id: 'snippet-3',
    title: 'React Hooks 示例',
    description: '常用 React Hooks 使用模板',
    code: "import { useState, useEffect, useCallback } from 'react';\n\nfunction Counter() {\n  const [count, setCount] = useState(0);\n  \n  const increment = useCallback(() => {\n    setCount(prev => prev + 1);\n  }, []);\n  \n  useEffect(() => {\n    document.title = 'Count: ' + count;\n  }, [count]);\n  \n  return (\n    <div>\n      <p>{count}</p>\n      <button onClick={increment}>+</button>\n    </div>\n  );\n}",
    language: 'javascript',
    tags: ['react', 'hooks'],
    createdAt: Date.now() - 259200000,
    updatedAt: Date.now() - 259200000,
  },
]

const STORAGE_KEY = 'weblinux-snippets'

export default function CodeSnippetsManager() {
  const [snippets, setSnippets] = useState<Snippet[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY)
      return saved ? JSON.parse(saved) : DEFAULT_SNIPPETS
    } catch {
      return DEFAULT_SNIPPETS
    }
  })
  
  const [selectedSnippet, setSelectedSnippet] = useState<Snippet | null>(null)
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedTags, setSelectedTags] = useState<string[]>([])
  const [isCreating, setIsCreating] = useState(false)
  const [isEditing, setIsEditing] = useState(false)
  const [isSidebarOpen, setIsSidebarOpen] = useState(true)
  
  const [newSnippet, setNewSnippet] = useState<Partial<Snippet>>({
    title: '',
    description: '',
    code: '',
    language: 'javascript',
    tags: [],
  })
  
  const [tagInput, setTagInput] = useState('')

  const allTags = useMemo(() => {
    const tags = new Set<string>()
    snippets.forEach(s => s.tags.forEach(t => tags.add(t)))
    return Array.from(tags).sort()
  }, [snippets])

  const filteredSnippets = useMemo(() => {
    let filtered = [...snippets]
    
    if (searchQuery) {
      const q = searchQuery.toLowerCase()
      filtered = filtered.filter(s => 
        s.title.toLowerCase().includes(q) ||
        s.description.toLowerCase().includes(q) ||
        s.code.toLowerCase().includes(q) ||
        s.tags.some(t => t.toLowerCase().includes(q))
      )
    }
    
    if (selectedTags.length > 0) {
      filtered = filtered.filter(s => 
        selectedTags.every(tag => s.tags.includes(tag))
      )
    }
    
    return filtered.sort((a, b) => b.updatedAt - a.updatedAt)
  }, [snippets, searchQuery, selectedTags])

  const saveSnippets = useCallback((newSnippets: Snippet[]) => {
    setSnippets(newSnippets)
    localStorage.setItem(STORAGE_KEY, JSON.stringify(newSnippets))
  }, [])

  const createSnippet = useCallback(() => {
    if (!newSnippet.title) return
    
    const snippet: Snippet = {
      id: `snippet-${Date.now()}`,
      title: newSnippet.title,
      description: newSnippet.description || '',
      code: newSnippet.code || '',
      language: newSnippet.language || 'javascript',
      tags: newSnippet.tags || [],
      createdAt: Date.now(),
      updatedAt: Date.now(),
    }
    
    saveSnippets([snippet, ...snippets])
    setIsCreating(false)
    setSelectedSnippet(snippet)
    setNewSnippet({ title: '', description: '', code: '', language: 'javascript', tags: [] })
  }, [newSnippet, snippets, saveSnippets])

  const updateSnippet = useCallback(() => {
    if (!selectedSnippet || !newSnippet.title) return
    
    const updated: Snippet = {
      ...selectedSnippet,
      title: newSnippet.title,
      description: newSnippet.description || '',
      code: newSnippet.code || '',
      language: newSnippet.language || 'javascript',
      tags: newSnippet.tags || [],
      updatedAt: Date.now(),
    }
    
    saveSnippets(snippets.map(s => s.id === selectedSnippet.id ? updated : s))
    setIsEditing(false)
    setSelectedSnippet(updated)
  }, [selectedSnippet, newSnippet, snippets, saveSnippets])

  const deleteSnippet = useCallback((id: string) => {
    if (!confirm('确定要删除这个代码片段吗？')) return
    saveSnippets(snippets.filter(s => s.id !== id))
    if (selectedSnippet?.id === id) {
      setSelectedSnippet(null)
    }
  }, [snippets, selectedSnippet, saveSnippets])

  const copyCode = useCallback((code: string) => {
    navigator.clipboard.writeText(code).then(() => {
      alert('代码已复制到剪贴板！')
    })
  }, [])

  const exportSnippets = useCallback(() => {
    const data = JSON.stringify(snippets, null, 2)
    const blob = new Blob([data], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `code-snippets-${new Date().toISOString().split('T')[0]}.json`
    a.click()
    URL.revokeObjectURL(url)
  }, [snippets])

  const importSnippets = useCallback(() => {
    const input = document.createElement('input')
    input.type = 'file'
    input.accept = '.json'
    input.onchange = () => {
      const file = input.files?.[0]
      if (file) {
        const reader = new FileReader()
        reader.onload = (event) => {
          try {
            const imported = JSON.parse(event.target?.result as string)
            if (Array.isArray(imported)) {
              saveSnippets([...imported, ...snippets])
              alert(`成功导入 ${imported.length} 个代码片段！`)
            }
          } catch {
            alert('导入失败，请检查文件格式！')
          }
        }
        reader.readAsText(file)
      }
    }
    input.click()
  }, [snippets, saveSnippets])

  const addTag = useCallback(() => {
    if (tagInput && !newSnippet.tags?.includes(tagInput)) {
      setNewSnippet({
        ...newSnippet,
        tags: [...(newSnippet.tags || []), tagInput],
      })
      setTagInput('')
    }
  }, [tagInput, newSnippet])

  const removeTag = useCallback((tag: string) => {
    setNewSnippet({
      ...newSnippet,
      tags: (newSnippet.tags || []).filter(t => t !== tag),
    })
  }, [newSnippet])

  const toggleTagFilter = useCallback((tag: string) => {
    setSelectedTags(prev => 
      prev.includes(tag) 
        ? prev.filter(t => t !== tag)
        : [...prev, tag]
    )
  }, [])

  const startEdit = useCallback((snippet: Snippet) => {
    setNewSnippet({
      title: snippet.title,
      description: snippet.description,
      code: snippet.code,
      language: snippet.language,
      tags: [...snippet.tags],
    })
    setIsEditing(true)
  }, [])

  const cancelEdit = useCallback(() => {
    setIsEditing(false)
    setIsCreating(false)
    setNewSnippet({ title: '', description: '', code: '', language: 'javascript', tags: [] })
  }, [])

  return (
    <div style={{ display: 'flex', height: '100%', width: '100%', background: '#1e1e2e', color: '#cdd6f4' }}>
      {isSidebarOpen && (
        <div style={{ width: 320, borderRight: '1px solid #313244', display: 'flex', flexDirection: 'column', background: '#181825' }}>
          <div style={{ padding: 16, borderBottom: '1px solid #313244' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
              <h2 style={{ fontSize: 18, margin: 0, color: '#cdd6f4' }}>代码片段</h2>
              <button
                onClick={() => setIsSidebarOpen(false)}
                style={{
                  background: 'transparent',
                  border: 'none',
                  color: '#6c7086',
                  cursor: 'pointer',
                  padding: 4,
                  fontSize: 16,
                }}
              >
                ×
              </button>
            </div>
            <div style={{ display: 'flex', gap: 8 }}>
              <button
                onClick={() => setIsCreating(true)}
                style={{
                  flex: 1,
                  background: '#89b4fa',
                  color: '#1e1e2e',
                  border: 'none',
                  padding: '8px 16px',
                  borderRadius: 6,
                  cursor: 'pointer',
                  fontWeight: 600,
                  fontSize: 13,
                }}
              >
                + 新建
              </button>
            </div>
          </div>
          
          <div style={{ padding: 12, borderBottom: '1px solid #313244' }}>
            <input
              type="text"
              placeholder="搜索代码片段..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              style={{
                width: '100%',
                background: '#313244',
                border: '1px solid #45475a',
                borderRadius: 6,
                padding: '8px 12px',
                color: '#cdd6f4',
                fontSize: 13,
                outline: 'none',
              }}
            />
          </div>
          
          {allTags.length > 0 && (
            <div style={{ padding: 12, borderBottom: '1px solid #313244' }}>
              <div style={{ fontSize: 12, color: '#6c7086', marginBottom: 8, fontWeight: 600 }}>标签筛选</div>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                {allTags.map(tag => (
                  <span
                    key={tag}
                    onClick={() => toggleTagFilter(tag)}
                    style={{
                      fontSize: 12,
                      padding: '4px 10px',
                      borderRadius: 12,
                      background: selectedTags.includes(tag) ? '#89b4fa' : '#313244',
                      color: selectedTags.includes(tag) ? '#1e1e2e' : '#cdd6f4',
                      cursor: 'pointer',
                      transition: 'all 0.2s',
                    }}
                  >
                    {tag}
                  </span>
                ))}
              </div>
            </div>
          )}
          
          <div style={{ flex: 1, overflowY: 'auto', padding: 8 }}>
            {filteredSnippets.length === 0 ? (
              <div style={{ padding: 40, textAlign: 'center', color: '#6c7086', fontSize: 13 }}>
                {searchQuery || selectedTags.length > 0 ? '没有找到匹配的代码片段' : '暂无代码片段'}
              </div>
            ) : (
              filteredSnippets.map(snippet => (
                <div
                  key={snippet.id}
                  onClick={() => setSelectedSnippet(snippet)}
                  style={{
                    padding: 12,
                    marginBottom: 8,
                    borderRadius: 8,
                    background: selectedSnippet?.id === snippet.id ? '#313244' : '#1e1e2e',
                    cursor: 'pointer',
                    border: selectedSnippet?.id === snippet.id ? '1px solid #89b4fa' : '1px solid transparent',
                    transition: 'all 0.2s',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 4 }}>
                    <span style={{ fontSize: 14, fontWeight: 600, color: '#cdd6f4' }}>{snippet.title}</span>
                    <span
                      style={{
                        fontSize: 11,
                        padding: '2px 8px',
                        borderRadius: 4,
                        background: LANGUAGES.find(l => l.value === snippet.language)?.color || '#6c7086',
                        color: '#1e1e2e',
                        fontWeight: 600,
                      }}
                    >
                      {LANGUAGES.find(l => l.value === snippet.language)?.label}
                    </span>
                  </div>
                  {snippet.description && (
                    <p style={{ fontSize: 12, color: '#6c7086', margin: '4px 0 8px 0' }}>
                      {snippet.description}
                    </p>
                  )}
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4 }}>
                    {snippet.tags.map(tag => (
                      <span
                        key={tag}
                        style={{
                          fontSize: 11,
                          padding: '2px 8px',
                          borderRadius: 10,
                          background: '#313244',
                          color: '#a6adc8',
                        }}
                      >
                        {tag}
                      </span>
                    ))}
                  </div>
                  <div style={{ fontSize: 11, color: '#6c7086', marginTop: 8 }}>
                    更新于 {new Date(snippet.updatedAt).toLocaleDateString()}
                  </div>
                </div>
              ))
            )}
          </div>
          
          <div style={{ padding: 12, borderTop: '1px solid #313244', display: 'flex', gap: 8 }}>
            <button
              onClick={importSnippets}
              style={{
                flex: 1,
                background: '#313244',
                color: '#cdd6f4',
                border: '1px solid #45475a',
                padding: '8px 12px',
                borderRadius: 6,
                cursor: 'pointer',
                fontSize: 12,
              }}
            >
              导入
            </button>
            <button
              onClick={exportSnippets}
              style={{
                flex: 1,
                background: '#313244',
                color: '#cdd6f4',
                border: '1px solid #45475a',
                padding: '8px 12px',
                borderRadius: 6,
                cursor: 'pointer',
                fontSize: 12,
              }}
            >
              导出
            </button>
          </div>
        </div>
      )}
      
      {!isSidebarOpen && (
        <button
          onClick={() => setIsSidebarOpen(true)}
          style={{
            position: 'absolute',
            top: 12,
            left: 12,
            zIndex: 10,
            background: '#313244',
            border: '1px solid #45475a',
            color: '#cdd6f4',
            padding: '8px 12px',
            borderRadius: 6,
            cursor: 'pointer',
            fontSize: 14,
          }}
        >
          ☰
        </button>
      )}
      
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
        {(isCreating || isEditing) ? (
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', padding: 24, overflow: 'auto' }}>
            <h2 style={{ fontSize: 20, margin: '0 0 20px 0', color: '#cdd6f4' }}>
              {isCreating ? '新建代码片段' : '编辑代码片段'}
            </h2>
            
            <div style={{ marginBottom: 16 }}>
              <label style={{ display: 'block', fontSize: 13, color: '#a6adc8', marginBottom: 6 }}>标题 *</label>
              <input
                type="text"
                value={newSnippet.title}
                onChange={(e) => setNewSnippet({ ...newSnippet, title: e.target.value })}
                placeholder="输入代码片段标题"
                style={{
                  width: '100%',
                  background: '#181825',
                  border: '1px solid #313244',
                  borderRadius: 6,
                  padding: 12,
                  color: '#cdd6f4',
                  fontSize: 14,
                  outline: 'none',
                }}
              />
            </div>
            
            <div style={{ marginBottom: 16 }}>
              <label style={{ display: 'block', fontSize: 13, color: '#a6adc8', marginBottom: 6 }}>描述</label>
              <input
                type="text"
                value={newSnippet.description}
                onChange={(e) => setNewSnippet({ ...newSnippet, description: e.target.value })}
                placeholder="输入代码片段描述"
                style={{
                  width: '100%',
                  background: '#181825',
                  border: '1px solid #313244',
                  borderRadius: 6,
                  padding: 12,
                  color: '#cdd6f4',
                  fontSize: 14,
                  outline: 'none',
                }}
              />
            </div>
            
            <div style={{ marginBottom: 16 }}>
              <label style={{ display: 'block', fontSize: 13, color: '#a6adc8', marginBottom: 6 }}>编程语言</label>
              <select
                value={newSnippet.language}
                onChange={(e) => setNewSnippet({ ...newSnippet, language: e.target.value })}
                style={{
                  width: '100%',
                  background: '#181825',
                  border: '1px solid #313244',
                  borderRadius: 6,
                  padding: 12,
                  color: '#cdd6f4',
                  fontSize: 14,
                  outline: 'none',
                }}
              >
                {LANGUAGES.map(lang => (
                  <option key={lang.value} value={lang.value}>{lang.label}</option>
                ))}
              </select>
            </div>
            
            <div style={{ marginBottom: 16 }}>
              <label style={{ display: 'block', fontSize: 13, color: '#a6adc8', marginBottom: 6 }}>标签</label>
              <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 8 }}>
                {(newSnippet.tags || []).map(tag => (
                  <span
                    key={tag}
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: 6,
                      fontSize: 12,
                      padding: '4px 10px',
                      borderRadius: 12,
                      background: '#313244',
                      color: '#cdd6f4',
                    }}
                  >
                    {tag}
                    <span
                      onClick={() => removeTag(tag)}
                      style={{ cursor: 'pointer', color: '#f38ba8' }}
                    >
                      ×
                    </span>
                  </span>
                ))}
              </div>
              <div style={{ display: 'flex', gap: 8 }}>
                <input
                  type="text"
                  value={tagInput}
                  onChange={(e) => setTagInput(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && addTag()}
                  placeholder="输入标签后按 Enter"
                  style={{
                    flex: 1,
                    background: '#181825',
                    border: '1px solid #313244',
                    borderRadius: 6,
                    padding: 12,
                    color: '#cdd6f4',
                    fontSize: 14,
                    outline: 'none',
                  }}
                />
                <button
                  onClick={addTag}
                  style={{
                    background: '#89b4fa',
                    color: '#1e1e2e',
                    border: 'none',
                    padding: '0 16px',
                    borderRadius: 6,
                    cursor: 'pointer',
                    fontWeight: 600,
                  }}
                >
                  添加
                </button>
              </div>
            </div>
            
            <div style={{ marginBottom: 20, flex: 1, display: 'flex', flexDirection: 'column' }}>
              <label style={{ display: 'block', fontSize: 13, color: '#a6adc8', marginBottom: 6 }}>代码 *</label>
              <textarea
                value={newSnippet.code}
                onChange={(e) => setNewSnippet({ ...newSnippet, code: e.target.value })}
                placeholder="输入你的代码..."
                style={{
                  flex: 1,
                  width: '100%',
                  minHeight: 200,
                  background: '#181825',
                  border: '1px solid #313244',
                  borderRadius: 6,
                  padding: 12,
                  color: '#cdd6f4',
                  fontSize: 13,
                  fontFamily: 'monospace',
                  outline: 'none',
                  resize: 'none',
                }}
              />
            </div>
            
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 12 }}>
              <button
                onClick={cancelEdit}
                style={{
                  background: '#313244',
                  color: '#cdd6f4',
                  border: '1px solid #45475a',
                  padding: '10px 24px',
                  borderRadius: 6,
                  cursor: 'pointer',
                  fontSize: 14,
                }}
              >
                取消
              </button>
              <button
                onClick={isCreating ? createSnippet : updateSnippet}
                style={{
                  background: '#a6e3a1',
                  color: '#1e1e2e',
                  border: 'none',
                  padding: '10px 24px',
                  borderRadius: 6,
                  cursor: 'pointer',
                  fontSize: 14,
                  fontWeight: 600,
                }}
              >
                {isCreating ? '创建' : '保存'}
              </button>
            </div>
          </div>
        ) : selectedSnippet ? (
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
            <div style={{ padding: '20px 24px', borderBottom: '1px solid #313244', background: '#181825' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
                <h2 style={{ fontSize: 20, margin: 0, color: '#cdd6f4' }}>{selectedSnippet.title}</h2>
                <div style={{ display: 'flex', gap: 8 }}>
                  <button
                    onClick={() => startEdit(selectedSnippet)}
                    style={{
                      background: '#89b4fa',
                      color: '#1e1e2e',
                      border: 'none',
                      padding: '8px 16px',
                      borderRadius: 6,
                      cursor: 'pointer',
                      fontSize: 13,
                      fontWeight: 600,
                    }}
                  >
                    编辑
                  </button>
                  <button
                    onClick={() => deleteSnippet(selectedSnippet.id)}
                    style={{
                      background: '#f38ba8',
                      color: '#1e1e2e',
                      border: 'none',
                      padding: '8px 16px',
                      borderRadius: 6,
                      cursor: 'pointer',
                      fontSize: 13,
                      fontWeight: 600,
                    }}
                  >
                    删除
                  </button>
                </div>
              </div>
              
              {selectedSnippet.description && (
                <p style={{ fontSize: 14, color: '#a6adc8', margin: 0 }}>{selectedSnippet.description}</p>
              )}
              
              <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginTop: 12, flexWrap: 'wrap' }}>
                <span
                  style={{
                    fontSize: 12,
                    padding: '4px 12px',
                    borderRadius: 12,
                    background: LANGUAGES.find(l => l.value === selectedSnippet.language)?.color || '#6c7086',
                    color: '#1e1e2e',
                    fontWeight: 600,
                  }}
                >
                  {LANGUAGES.find(l => l.value === selectedSnippet.language)?.label}
                </span>
                {selectedSnippet.tags.map(tag => (
                  <span
                    key={tag}
                    style={{
                      fontSize: 12,
                      padding: '4px 10px',
                      borderRadius: 12,
                      background: '#313244',
                      color: '#a6adc8',
                    }}
                  >
                    {tag}
                  </span>
                ))}
              </div>
            </div>
            
            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
              <div style={{ padding: '8px 16px', background: '#181825', display: 'flex', justifyContent: 'flex-end', borderBottom: '1px solid #313244' }}>
                <button
                  onClick={() => copyCode(selectedSnippet.code)}
                  style={{
                    background: '#313244',
                    color: '#cdd6f4',
                    border: '1px solid #45475a',
                    padding: '6px 12px',
                    borderRadius: 6,
                    cursor: 'pointer',
                    fontSize: 12,
                  }}
                >
                  📋 复制代码
                </button>
              </div>
              <pre style={{
                flex: 1,
                margin: 0,
                padding: 24,
                background: '#181825',
                overflow: 'auto',
                color: '#cdd6f4',
                fontSize: 14,
                fontFamily: 'monospace',
                lineHeight: 1.6,
              }}>
                <code>{selectedSnippet.code}</code>
              </pre>
            </div>
            
            <div style={{ padding: '12px 24px', borderTop: '1px solid #313244', fontSize: 12, color: '#6c7086', display: 'flex', justifyContent: 'space-between' }}>
              <span>创建于: {new Date(selectedSnippet.createdAt).toLocaleString()}</span>
              <span>更新于: {new Date(selectedSnippet.updatedAt).toLocaleString()}</span>
            </div>
          </div>
        ) : (
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', color: '#6c7086' }}>
            <div style={{ fontSize: 48, marginBottom: 16 }}>📝</div>
            <h3 style={{ fontSize: 20, marginBottom: 8, color: '#a6adc8' }}>选择一个代码片段</h3>
            <p style={{ fontSize: 14 }}>从左侧列表中选择或创建新的代码片段</p>
          </div>
        )}
      </div>
    </div>
  )
}
