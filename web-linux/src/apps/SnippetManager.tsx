import { useState, useEffect, useCallback, useRef } from 'react'

const SNIPPET_STORAGE_KEY = 'weblinux-code-snippets'

interface Snippet {
  id: string
  title: string
  language: string
  code: string
  description: string
  tags: string[]
  createdAt: number
  updatedAt: number
  favorite: boolean
}

const LANGUAGES = [
  { value: 'javascript', label: 'JavaScript' },
  { value: 'typescript', label: 'TypeScript' },
  { value: 'python', label: 'Python' },
  { value: 'html', label: 'HTML' },
  { value: 'css', label: 'CSS' },
  { value: 'json', label: 'JSON' },
  { value: 'bash', label: 'Bash' },
  { value: 'sql', label: 'SQL' },
  { value: 'markdown', label: 'Markdown' },
  { value: 'rust', label: 'Rust' },
  { value: 'go', label: 'Go' },
  { value: 'java', label: 'Java' },
  { value: 'cpp', label: 'C++' },
  { value: 'php', label: 'PHP' },
]

const PRESET_SNIPPETS: Omit<Snippet, 'id' | 'createdAt' | 'updatedAt'>[] = [
  {
    title: 'React useState Hook',
    language: 'typescript',
    code: `import { useState } from 'react';

function Counter() {
  const [count, setCount] = useState<number>(0);
  const [name, setName] = useState<string>('');

  return (
    <div>
      <p>Count: {count}</p>
      <button onClick={() => setCount(c => c + 1)}>Increment</button>
      <input value={name} onChange={e => setName(e.target.value)} />
    </div>
  );
}`,
    description: 'React useState Hook 的基本用法示例',
    tags: ['react', 'hooks', 'state'],
    favorite: true,
  },
  {
    title: 'Debounce 函数',
    language: 'javascript',
    code: `function debounce(fn, delay) {
  let timer = null;
  return function (...args) {
    clearTimeout(timer);
    timer = setTimeout(() => fn.apply(this, args), delay);
  };
}

const debouncedSearch = debounce((query) => {
  console.log('Searching:', query);
}, 300);`,
    description: '通用防抖函数实现',
    tags: ['utility', 'performance'],
    favorite: false,
  },
  {
    title: 'Python 快速排序',
    language: 'python',
    code: `def quicksort(arr):
    if len(arr) <= 1:
        return arr
    pivot = arr[len(arr) // 2]
    left = [x for x in arr if x < pivot]
    middle = [x for x in arr if x == pivot]
    right = [x for x in arr if x > pivot]
    return quicksort(left) + middle + quicksort(right)

print(quicksort([3, 6, 8, 10, 1, 2, 1]))`,
    description: 'Python实现的快速排序算法',
    tags: ['algorithm', 'sorting'],
    favorite: false,
  },
  {
    title: 'CSS Flexbox 居中',
    language: 'css',
    code: `.flex-center {
  display: flex;
  justify-content: center;
  align-items: center;
  min-height: 100vh;
}

.grid-center {
  display: grid;
  place-items: center;
  min-height: 100vh;
}`,
    description: '使用 Flexbox 和 Grid 实现元素居中',
    tags: ['css', 'layout', 'centering'],
    favorite: true,
  },
  {
    title: 'Fetch API 封装',
    language: 'javascript',
    code: `async function apiCall(url, options = {}) {
  const response = await fetch(url, {
    headers: {
      'Content-Type': 'application/json',
      ...options.headers,
    },
    ...options,
  });

  if (!response.ok) {
    throw new Error(\`HTTP error! status: \${response.status}\`);
  }

  return response.json();
}

// 使用示例
apiCall('/api/users')
  .then(data => console.log(data))
  .catch(error => console.error(error));`,
    description: 'Fetch API 的优雅封装',
    tags: ['api', 'fetch', 'utility'],
    favorite: false,
  },
]

export default function SnippetManager() {
  const [snippets, setSnippets] = useState<Snippet[]>(() => {
    try {
      const saved = localStorage.getItem(SNIPPET_STORAGE_KEY)
      if (saved) {
        return JSON.parse(saved)
      }
    } catch {}
    return PRESET_SNIPPETS.map((s, i) => ({
      ...s,
      id: `preset-${i}`,
      createdAt: Date.now() - i * 86400000,
      updatedAt: Date.now() - i * 3600000,
    }))
  })

  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [search, setSearch] = useState('')
  const [filter, setFilter] = useState('all')
  const [showEditor, setShowEditor] = useState(false)
  const [editingSnippet, setEditingSnippet] = useState<Snippet | null>(null)
  const [toast, setToast] = useState<string | null>(null)
  const editorRef = useRef<HTMLTextAreaElement>(null)

  useEffect(() => {
    localStorage.setItem(SNIPPET_STORAGE_KEY, JSON.stringify(snippets))
  }, [snippets])

  useEffect(() => {
    if (!selectedId && snippets.length > 0) {
      setSelectedId(snippets[0].id)
    }
  }, [snippets, selectedId])

  const showToast = (msg: string) => {
    setToast(msg)
    setTimeout(() => setToast(null), 2000)
  }

  const selectedSnippet = snippets.find((s) => s.id === selectedId)

  const filteredSnippets = snippets.filter((s) => {
    if (filter === 'favorites' && !s.favorite) return false
    if (filter !== 'all' && filter !== 'favorites' && s.language !== filter) return false
    if (!search) return true
    const q = search.toLowerCase()
    return (
      s.title.toLowerCase().includes(q) ||
      s.description.toLowerCase().includes(q) ||
      s.code.toLowerCase().includes(q) ||
      s.tags.some((t) => t.toLowerCase().includes(q))
    )
  })

  const sortedSnippets = [...filteredSnippets].sort((a, b) => {
    if (a.favorite !== b.favorite) return a.favorite ? -1 : 1
    return b.updatedAt - a.updatedAt
  })

  const saveSnippet = useCallback(
    (data: Omit<Snippet, 'id' | 'createdAt' | 'updatedAt'> & { id?: string }) => {
      const now = Date.now()
      if (data.id) {
        setSnippets((prev) =>
          prev.map((s) =>
            s.id === data.id
              ? { ...s, ...data, updatedAt: now }
              : s
          )
        )
        showToast('代码片段已更新')
      } else {
        const newSnippet: Snippet = {
          ...data,
          id: `snippet-${now}`,
          createdAt: now,
          updatedAt: now,
        }
        setSnippets((prev) => [newSnippet, ...prev])
        setSelectedId(newSnippet.id)
        showToast('代码片段已创建')
      }
      setShowEditor(false)
      setEditingSnippet(null)
    },
    []
  )

  const deleteSnippet = useCallback((id: string) => {
    setSnippets((prev) => prev.filter((s) => s.id !== id))
    if (selectedId === id) {
      setSelectedId(snippets.filter((s) => s.id !== id)[0]?.id || null)
    }
    showToast('代码片段已删除')
  }, [selectedId, snippets])

  const toggleFavorite = useCallback((id: string) => {
    setSnippets((prev) =>
      prev.map((s) => (s.id === id ? { ...s, favorite: !s.favorite } : s))
    )
  }, [])

  const copyToClipboard = useCallback(async (text: string) => {
    try {
      await navigator.clipboard.writeText(text)
      showToast('已复制到剪贴板')
    } catch {
      showToast('复制失败')
    }
  }, [])

  const runCode = useCallback((code: string, language: string) => {
    if (language === 'javascript' || language === 'typescript') {
      try {
        const result = new Function(code)()
        showToast(`执行成功: ${String(result).slice(0, 50)}`)
      } catch (err) {
        showToast(`执行错误: ${String(err).slice(0, 50)}`)
      }
    } else if (language === 'html') {
      showToast('HTML预览功能开发中')
    } else {
      showToast(`不支持执行 ${language} 代码`)
    }
  }, [])

  const formatDate = (timestamp: number) => {
    const d = new Date(timestamp)
    return `${d.getMonth() + 1}/${d.getDate()} ${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`
  }

  const languageCounts = LANGUAGES.reduce((acc, lang) => {
    acc[lang.value] = snippets.filter((s) => s.language === lang.value).length
    return acc
  }, {} as Record<string, number>)

  const languagesInUse = LANGUAGES.filter((l) => languageCounts[l.value] > 0)

  return (
    <div style={{
      display: 'flex',
      height: '100%',
      background: '#0f0f1a',
      color: '#e0e0f0',
      fontFamily: "'Inter', 'Segoe UI', sans-serif",
    }}>
      {/* Sidebar */}
      <div style={{
        width: '280px',
        background: '#13131f',
        borderRight: '1px solid rgba(139, 124, 240, 0.15)',
        display: 'flex',
        flexDirection: 'column',
      }}>
        {/* Header */}
        <div style={{
          padding: '16px',
          borderBottom: '1px solid rgba(139, 124, 240, 0.15)',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '12px' }}>
            <span style={{ fontSize: '22px' }}>📝</span>
            <span style={{ fontSize: '15px', fontWeight: 600 }}>代码片段管理器</span>
          </div>
          <button
            onClick={() => {
              setEditingSnippet(null)
              setShowEditor(true)
            }}
            style={{
              width: '100%',
              padding: '10px',
              background: 'linear-gradient(135deg, #7c6cf0 0%, #9b8af0 100%)',
              border: 'none',
              borderRadius: '8px',
              color: '#fff',
              fontSize: '13px',
              fontWeight: 500,
              cursor: 'pointer',
              marginBottom: '12px',
            }}
          >
            + 新建片段
          </button>
          <input
            type="text"
            placeholder="搜索代码片段..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            style={{
              width: '100%',
              padding: '8px 12px',
              background: 'rgba(255,255,255,0.05)',
              border: '1px solid rgba(255,255,255,0.1)',
              borderRadius: '6px',
              color: '#e0e0f0',
              fontSize: '12px',
              outline: 'none',
            }}
          />
        </div>

        {/* Filter */}
        <div style={{ padding: '12px 16px' }}>
          <div style={{ fontSize: '11px', color: '#6b7280', marginBottom: '8px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>筛选</div>
          {[
            { value: 'all', label: '全部', count: snippets.length, icon: '📋' },
            { value: 'favorites', label: '收藏', count: snippets.filter((s) => s.favorite).length, icon: '⭐' },
          ].map((item) => (
            <button
              key={item.value}
              onClick={() => setFilter(item.value)}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                width: '100%',
                padding: '8px 10px',
                background: filter === item.value ? 'rgba(139, 124, 240, 0.15)' : 'transparent',
                border: 'none',
                borderRadius: '6px',
                color: filter === item.value ? '#b8a8ff' : '#9090c0',
                fontSize: '12px',
                cursor: 'pointer',
                marginBottom: '2px',
              }}
            >
              <span>{item.icon}</span>
              <span style={{ flex: 1, textAlign: 'left' }}>{item.label}</span>
              <span style={{ fontSize: '11px', opacity: 0.7 }}>{item.count}</span>
            </button>
          ))}
        </div>

        {/* Languages */}
        {languagesInUse.length > 0 && (
          <div style={{ padding: '8px 16px' }}>
            <div style={{ fontSize: '11px', color: '#6b7280', marginBottom: '8px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>语言</div>
            {languagesInUse.map((lang) => (
              <button
                key={lang.value}
                onClick={() => setFilter(filter === lang.value ? 'all' : lang.value)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  width: '100%',
                  padding: '6px 10px',
                  background: filter === lang.value ? 'rgba(139, 124, 240, 0.15)' : 'transparent',
                  border: 'none',
                  borderRadius: '6px',
                  color: filter === lang.value ? '#b8a8ff' : '#9090c0',
                  fontSize: '12px',
                  cursor: 'pointer',
                  marginBottom: '2px',
                }}
              >
                <span style={{ flex: 1, textAlign: 'left' }}>{lang.label}</span>
                <span style={{ fontSize: '10px', opacity: 0.7 }}>{languageCounts[lang.value]}</span>
              </button>
            ))}
          </div>
        )}

        {/* Snippets list */}
        <div style={{
          flex: 1,
          overflow: 'auto',
          padding: '8px',
        }}>
          {sortedSnippets.length === 0 ? (
            <div style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              padding: '40px 20px',
              color: '#6b7280',
            }}>
              <span style={{ fontSize: '36px', marginBottom: '12px' }}>📭</span>
              <div style={{ fontSize: '13px' }}>没有代码片段</div>
              <div style={{ fontSize: '11px', marginTop: '4px' }}>点击"新建片段"开始</div>
            </div>
          ) : (
            sortedSnippets.map((snippet) => (
              <div
                key={snippet.id}
                onClick={() => setSelectedId(snippet.id)}
                style={{
                  padding: '10px 12px',
                  background: selectedId === snippet.id ? 'rgba(139, 124, 240, 0.2)' : 'transparent',
                  borderRadius: '6px',
                  cursor: 'pointer',
                  marginBottom: '2px',
                  transition: 'background 0.15s',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '4px' }}>
                  {snippet.favorite && <span style={{ fontSize: '12px' }}>⭐</span>}
                  <span style={{
                    fontSize: '13px',
                    fontWeight: 500,
                    color: selectedId === snippet.id ? '#b8a8ff' : '#e0e0f0',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    whiteSpace: 'nowrap',
                    flex: 1,
                  }}>
                    {snippet.title}
                  </span>
                </div>
                <div style={{ display: 'flex', gap: '6px', alignItems: 'center' }}>
                  <span style={{
                    fontSize: '10px',
                    padding: '2px 6px',
                    background: 'rgba(139, 124, 240, 0.2)',
                    borderRadius: '3px',
                    color: '#b8a8ff',
                  }}>
                    {LANGUAGES.find((l) => l.value === snippet.language)?.label || snippet.language}
                  </span>
                  <span style={{ fontSize: '10px', color: '#6b7280' }}>
                    {formatDate(snippet.updatedAt)}
                  </span>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Main content */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
        {selectedSnippet ? (
          <>
            {/* Header */}
            <div style={{
              padding: '16px 24px',
              borderBottom: '1px solid rgba(139, 124, 240, 0.15)',
              display: 'flex',
              alignItems: 'center',
              gap: '12px',
            }}>
              <span style={{ fontSize: '24px' }}>
                {selectedSnippet.favorite ? '⭐' : '📄'}
              </span>
              <div style={{ flex: 1 }}>
                <input
                  type="text"
                  value={selectedSnippet.title}
                  onChange={(e) => {
                    setSnippets((prev) =>
                      prev.map((s) =>
                        s.id === selectedSnippet.id ? { ...s, title: e.target.value } : s
                      )
                    )
                  }}
                  style={{
                    background: 'transparent',
                    border: 'none',
                    color: '#f0f0ff',
                    fontSize: '18px',
                    fontWeight: 600,
                    outline: 'none',
                    width: '100%',
                  }}
                />
                <div style={{ display: 'flex', gap: '8px', marginTop: '6px', alignItems: 'center' }}>
                  <span style={{
                    fontSize: '11px',
                    padding: '3px 8px',
                    background: 'rgba(139, 124, 240, 0.2)',
                    borderRadius: '4px',
                    color: '#b8a8ff',
                  }}>
                    {LANGUAGES.find((l) => l.value === selectedSnippet.language)?.label || selectedSnippet.language}
                  </span>
                  <span style={{ fontSize: '11px', color: '#6b7280' }}>
                    更新于 {formatDate(selectedSnippet.updatedAt)}
                  </span>
                </div>
              </div>
              <button
                onClick={() => toggleFavorite(selectedSnippet.id)}
                style={{
                  padding: '8px',
                  background: 'rgba(255,255,255,0.05)',
                  border: '1px solid rgba(255,255,255,0.1)',
                  borderRadius: '6px',
                  color: selectedSnippet.favorite ? '#fbbf24' : '#9090c0',
                  cursor: 'pointer',
                  fontSize: '16px',
                }}
              >
                {selectedSnippet.favorite ? '⭐' : '☆'}
              </button>
              <button
                onClick={() => copyToClipboard(selectedSnippet.code)}
                style={{
                  padding: '8px 14px',
                  background: 'rgba(139, 124, 240, 0.15)',
                  border: '1px solid rgba(139, 124, 240, 0.3)',
                  borderRadius: '6px',
                  color: '#b8a8ff',
                  cursor: 'pointer',
                  fontSize: '12px',
                }}
              >
                📋 复制
              </button>
              <button
                onClick={() => runCode(selectedSnippet.code, selectedSnippet.language)}
                style={{
                  padding: '8px 14px',
                  background: 'rgba(16, 185, 129, 0.15)',
                  border: '1px solid rgba(16, 185, 129, 0.3)',
                  borderRadius: '6px',
                  color: '#10b981',
                  cursor: 'pointer',
                  fontSize: '12px',
                }}
              >
                ▶ 运行
              </button>
              <button
                onClick={() => {
                  setEditingSnippet(selectedSnippet)
                  setShowEditor(true)
                }}
                style={{
                  padding: '8px',
                  background: 'rgba(255,255,255,0.05)',
                  border: '1px solid rgba(255,255,255,0.1)',
                  borderRadius: '6px',
                  color: '#9090c0',
                  cursor: 'pointer',
                  fontSize: '14px',
                }}
              >
                ✏️
              </button>
              <button
                onClick={() => deleteSnippet(selectedSnippet.id)}
                style={{
                  padding: '8px',
                  background: 'rgba(239, 68, 68, 0.1)',
                  border: '1px solid rgba(239, 68, 68, 0.2)',
                  borderRadius: '6px',
                  color: '#f87171',
                  cursor: 'pointer',
                  fontSize: '14px',
                }}
              >
                🗑️
              </button>
            </div>

            {/* Content */}
            <div style={{
              flex: 1,
              overflow: 'auto',
              padding: '24px',
              display: 'flex',
              flexDirection: 'column',
            }}>
              {selectedSnippet.description && (
                <div style={{
                  padding: '12px 16px',
                  background: 'rgba(139, 124, 240, 0.08)',
                  borderRadius: '8px',
                  border: '1px solid rgba(139, 124, 240, 0.15)',
                  marginBottom: '16px',
                  color: '#c0c0e0',
                  fontSize: '13px',
                  lineHeight: 1.6,
                }}>
                  {selectedSnippet.description}
                </div>
              )}

              {selectedSnippet.tags.length > 0 && (
                <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', marginBottom: '16px' }}>
                  {selectedSnippet.tags.map((tag) => (
                    <span
                      key={tag}
                      style={{
                        padding: '4px 10px',
                        background: 'rgba(255,255,255,0.05)',
                        borderRadius: '12px',
                        fontSize: '11px',
                        color: '#9090c0',
                        border: '1px solid rgba(255,255,255,0.08)',
                      }}
                    >
                      #{tag}
                    </span>
                  ))}
                </div>
              )}

              {/* Code display */}
              <div style={{
                background: '#0d0d16',
                borderRadius: '10px',
                border: '1px solid rgba(255,255,255,0.08)',
                overflow: 'hidden',
                flex: 1,
              }}>
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  padding: '10px 14px',
                  background: 'rgba(255,255,255,0.03)',
                  borderBottom: '1px solid rgba(255,255,255,0.05)',
                }}>
                  <span style={{ width: '10px', height: '10px', background: '#ff5f57', borderRadius: '50%' }} />
                  <span style={{ width: '10px', height: '10px', background: '#febc2e', borderRadius: '50%' }} />
                  <span style={{ width: '10px', height: '10px', background: '#28c840', borderRadius: '50%' }} />
                  <span style={{ marginLeft: '12px', fontSize: '12px', color: '#6b7280' }}>
                    {selectedSnippet.title}.{selectedSnippet.language === 'javascript' ? 'js' : selectedSnippet.language === 'typescript' ? 'ts' : selectedSnippet.language}
                  </span>
                </div>
                <pre style={{
                  padding: '20px',
                  overflow: 'auto',
                  fontFamily: "'JetBrains Mono', 'Fira Code', monospace",
                  fontSize: '13px',
                  lineHeight: 1.6,
                  color: '#d4d4e8',
                  whiteSpace: 'pre-wrap',
                  wordBreak: 'break-all',
                }}>
                  {selectedSnippet.code}
                </pre>
              </div>
            </div>
          </>
        ) : (
          <div style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            height: '100%',
            color: '#6b7280',
          }}>
            <span style={{ fontSize: '64px', marginBottom: '16px' }}>📝</span>
            <div style={{ fontSize: '16px', marginBottom: '8px' }}>选择或创建一个代码片段</div>
            <button
              onClick={() => {
                setEditingSnippet(null)
                setShowEditor(true)
              }}
              style={{
                padding: '10px 20px',
                background: 'linear-gradient(135deg, #7c6cf0 0%, #9b8af0 100%)',
                border: 'none',
                borderRadius: '8px',
                color: '#fff',
                fontSize: '13px',
                cursor: 'pointer',
              }}
            >
              + 创建新片段
            </button>
          </div>
        )}
      </div>

      {/* Editor modal */}
      {showEditor && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(0,0,0,0.6)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1000,
          }}
          onClick={() => {
            setShowEditor(false)
            setEditingSnippet(null)
          }}
        >
          <div
            style={{
              width: '600px',
              maxHeight: '80vh',
              background: '#1a1a2e',
              borderRadius: '12px',
              border: '1px solid rgba(139, 124, 240, 0.3)',
              overflow: 'hidden',
              display: 'flex',
              flexDirection: 'column',
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div style={{
              padding: '16px 20px',
              borderBottom: '1px solid rgba(139, 124, 240, 0.15)',
              display: 'flex',
              alignItems: 'center',
              gap: '12px',
            }}>
              <span style={{ fontSize: '20px' }}>
                {editingSnippet ? '✏️' : '➕'}
              </span>
              <span style={{ fontSize: '15px', fontWeight: 600 }}>
                {editingSnippet ? '编辑代码片段' : '新建代码片段'}
              </span>
            </div>
            <div style={{ padding: '20px', overflow: 'auto', flex: 1 }}>
              <div style={{ marginBottom: '16px' }}>
                <label style={{ display: 'block', fontSize: '12px', color: '#9090c0', marginBottom: '6px' }}>标题</label>
                <input
                  type="text"
                  defaultValue={editingSnippet?.title || ''}
                  ref={(el) => {
                    if (el) el.focus()
                  }}
                  onBlur={(e) => {
                    if (editingSnippet) {
                      editingSnippet.title = e.target.value
                    }
                  }}
                  placeholder="输入片段标题..."
                  style={{
                    width: '100%',
                    padding: '10px 12px',
                    background: 'rgba(255,255,255,0.05)',
                    border: '1px solid rgba(255,255,255,0.1)',
                    borderRadius: '6px',
                    color: '#e0e0f0',
                    fontSize: '13px',
                    outline: 'none',
                  }}
                />
              </div>
              <div style={{ marginBottom: '16px' }}>
                <label style={{ display: 'block', fontSize: '12px', color: '#9090c0', marginBottom: '6px' }}>语言</label>
                <select
                  defaultValue={editingSnippet?.language || 'javascript'}
                  onBlur={(e) => {
                    if (editingSnippet) {
                      editingSnippet.language = e.target.value
                    }
                  }}
                  style={{
                    width: '100%',
                    padding: '10px 12px',
                    background: 'rgba(255,255,255,0.05)',
                    border: '1px solid rgba(255,255,255,0.1)',
                    borderRadius: '6px',
                    color: '#e0e0f0',
                    fontSize: '13px',
                    outline: 'none',
                  }}
                >
                  {LANGUAGES.map((lang) => (
                    <option key={lang.value} value={lang.value} style={{ background: '#1a1a2e' }}>
                      {lang.label}
                    </option>
                  ))}
                </select>
              </div>
              <div style={{ marginBottom: '16px' }}>
                <label style={{ display: 'block', fontSize: '12px', color: '#9090c0', marginBottom: '6px' }}>描述（可选）</label>
                <textarea
                  defaultValue={editingSnippet?.description || ''}
                  onBlur={(e) => {
                    if (editingSnippet) {
                      editingSnippet.description = e.target.value
                    }
                  }}
                  placeholder="简要描述这个代码片段的用途..."
                  rows={2}
                  style={{
                    width: '100%',
                    padding: '10px 12px',
                    background: 'rgba(255,255,255,0.05)',
                    border: '1px solid rgba(255,255,255,0.1)',
                    borderRadius: '6px',
                    color: '#e0e0f0',
                    fontSize: '13px',
                    outline: 'none',
                    resize: 'vertical',
                  }}
                />
              </div>
              <div style={{ marginBottom: '16px' }}>
                <label style={{ display: 'block', fontSize: '12px', color: '#9090c0', marginBottom: '6px' }}>标签（用逗号分隔）</label>
                <input
                  type="text"
                  defaultValue={editingSnippet?.tags.join(', ') || ''}
                  onBlur={(e) => {
                    if (editingSnippet) {
                      editingSnippet.tags = e.target.value.split(',').map((t) => t.trim()).filter(Boolean)
                    }
                  }}
                  placeholder="react, hooks, state"
                  style={{
                    width: '100%',
                    padding: '10px 12px',
                    background: 'rgba(255,255,255,0.05)',
                    border: '1px solid rgba(255,255,255,0.1)',
                    borderRadius: '6px',
                    color: '#e0e0f0',
                    fontSize: '13px',
                    outline: 'none',
                  }}
                />
              </div>
              <div style={{ marginBottom: '16px' }}>
                <label style={{ display: 'block', fontSize: '12px', color: '#9090c0', marginBottom: '6px' }}>代码</label>
                <textarea
                  defaultValue={editingSnippet?.code || ''}
                  ref={editorRef}
                  placeholder="在此输入代码..."
                  rows={10}
                  style={{
                    width: '100%',
                    padding: '12px',
                    background: '#0d0d16',
                    border: '1px solid rgba(139, 124, 240, 0.2)',
                    borderRadius: '6px',
                    color: '#d4d4e8',
                    fontSize: '13px',
                    fontFamily: "'JetBrains Mono', 'Fira Code', monospace",
                    outline: 'none',
                    resize: 'vertical',
                  }}
                />
              </div>
            </div>
            <div style={{
              padding: '16px 20px',
              borderTop: '1px solid rgba(139, 124, 240, 0.15)',
              display: 'flex',
              justifyContent: 'flex-end',
              gap: '10px',
            }}>
              <button
                onClick={() => {
                  setShowEditor(false)
                  setEditingSnippet(null)
                }}
                style={{
                  padding: '10px 20px',
                  background: 'rgba(255,255,255,0.05)',
                  border: '1px solid rgba(255,255,255,0.1)',
                  borderRadius: '6px',
                  color: '#9090c0',
                  cursor: 'pointer',
                  fontSize: '13px',
                }}
              >
                取消
              </button>
              <button
                onClick={() => {
                  const titleEl = document.querySelector('input[placeholder="输入片段标题..."]') as HTMLInputElement
                  const langEl = document.querySelector('select[style]') as HTMLSelectElement
                  const descEl = document.querySelector('textarea[placeholder="简要描述这个代码片段的用途..."]') as HTMLTextAreaElement
                  const tagsEl = document.querySelector('input[placeholder="react, hooks, state"]') as HTMLInputElement
                  const codeEl = document.querySelector('textarea[placeholder="在此输入代码..."]') as HTMLTextAreaElement

                  const data = {
                    id: editingSnippet?.id,
                    title: titleEl?.value || '未命名片段',
                    language: langEl?.value || 'javascript',
                    description: descEl?.value || '',
                    tags: tagsEl?.value.split(',').map((t) => t.trim()).filter(Boolean) || [],
                    code: codeEl?.value || '',
                    favorite: editingSnippet?.favorite || false,
                  }

                  saveSnippet(data)
                }}
                style={{
                  padding: '10px 24px',
                  background: 'linear-gradient(135deg, #7c6cf0 0%, #9b8af0 100%)',
                  border: 'none',
                  borderRadius: '6px',
                  color: '#fff',
                  cursor: 'pointer',
                  fontSize: '13px',
                  fontWeight: 500,
                }}
              >
                {editingSnippet ? '保存' : '创建'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Toast */}
      {toast && (
        <div style={{
          position: 'fixed',
          bottom: '20px',
          left: '50%',
          transform: 'translateX(-50%)',
          padding: '10px 20px',
          background: 'rgba(139, 124, 240, 0.9)',
          color: '#fff',
          borderRadius: '8px',
          fontSize: '13px',
          zIndex: 2000,
          boxShadow: '0 4px 12px rgba(0,0,0,0.3)',
        }}>
          {toast}
        </div>
      )}
    </div>
  )
}
