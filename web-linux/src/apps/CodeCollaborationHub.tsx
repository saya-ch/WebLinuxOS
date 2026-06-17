import { useState, useCallback, useEffect, memo } from 'react'

interface CodeSnippet {
  id: string
  title: string
  language: string
  code: string
  description: string
  tags: string[]
  createdAt: Date
  views: number
}

const LANGUAGES = [
  { id: 'javascript', name: 'JavaScript', icon: 'JS', color: '#f7df1e' },
  { id: 'typescript', name: 'TypeScript', icon: 'TS', color: '#3178c6' },
  { id: 'python', name: 'Python', icon: 'PY', color: '#3776ab' },
  { id: 'java', name: 'Java', icon: 'JV', color: '#b07219' },
  { id: 'csharp', name: 'C#', icon: 'C#', color: '#239120' },
  { id: 'cpp', name: 'C++', icon: 'C+', color: '#00599c' },
  { id: 'go', name: 'Go', icon: 'GO', color: '#00add8' },
  { id: 'rust', name: 'Rust', icon: 'RS', color: '#dea584' },
  { id: 'php', name: 'PHP', icon: 'PHP', color: '#777bb4' },
  { id: 'ruby', name: 'Ruby', icon: 'RB', color: '#cc342d' },
  { id: 'swift', name: 'Swift', icon: 'SW', color: '#fa7343' },
  { id: 'kotlin', name: 'Kotlin', icon: 'KT', color: '#7f52ff' },
  { id: 'html', name: 'HTML', icon: 'HT', color: '#e34c26' },
  { id: 'css', name: 'CSS', icon: 'CS', color: '#1572b6' },
  { id: 'sql', name: 'SQL', icon: 'SQ', color: '#336791' },
  { id: 'bash', name: 'Bash', icon: 'SH', color: '#4eaa25' },
  { id: 'json', name: 'JSON', icon: 'JS', color: '#292929' },
  { id: 'yaml', name: 'YAML', icon: 'YA', color: '#cb171e' },
  { id: 'markdown', name: 'Markdown', icon: 'MD', color: '#083fa1' },
  { id: 'dockerfile', name: 'Dockerfile', icon: 'DK', color: '#2496ed' },
]

const SAMPLE_SNIPPETS: CodeSnippet[] = [
  {
    id: '1',
    title: 'React useEffect 清理',
    language: 'javascript',
    code: `// React useEffect 清理函数示例
useEffect(() => {
  const timer = setInterval(() => {
    console.log('定时执行');
  }, 1000);
  
  // 清理函数 - 组件卸载时执行
  return () => {
    clearInterval(timer);
    console.log('定时器已清理');
  };
}, []);`,
    description: '演示如何在 useEffect 中正确清理副作用',
    tags: ['react', 'hooks', 'cleanup'],
    createdAt: new Date(),
    views: 156,
  },
  {
    id: '2',
    title: 'Python 快速排序',
    language: 'python',
    code: `def quicksort(arr):
    """快速排序算法实现"""
    if len(arr) <= 1:
        return arr
    
    pivot = arr[len(arr) // 2]
    left = [x for x in arr if x < pivot]
    middle = [x for x in arr if x == pivot]
    right = [x for x in arr if x > pivot]
    
    return quicksort(left) + middle + quicksort(right)

# 使用示例
numbers = [3, 6, 8, 10, 1, 2, 1]
print(quicksort(numbers))  # [1, 1, 2, 3, 6, 8, 10]`,
    description: 'Python实现的快速排序算法',
    tags: ['python', 'algorithm', 'sorting'],
    createdAt: new Date(),
    views: 89,
  },
  {
    id: '3',
    title: 'TypeScript 泛型工具',
    language: 'typescript',
    code: `// TypeScript 泛型工具类型示例

// 深度可选类型
type DeepPartial<T> = {
  [P in keyof T]?: T[P] extends object ? DeepPartial<T[P]> : T[P];
};

// 深度必选类型
type DeepRequired<T> = {
  [P in keyof T]-?: T[P] extends object ? DeepRequired<T[P>] : T[P];
};

// 深度只读类型
type DeepReadonly<T> = {
  readonly [P in keyof T]: T[P] extends object ? DeepReadonly<T[P]> : T[P];
};

// 使用示例
interface User {
  id: number;
  name: string;
  profile: {
    age: number;
    email: string;
  };
}

type PartialUser = DeepPartial<User>;
type RequiredUser = DeepRequired<User>;
type ReadonlyUser = DeepReadonly<User>;`,
    description: 'TypeScript高级泛型工具类型定义',
    tags: ['typescript', 'generics', 'utility-types'],
    createdAt: new Date(),
    views: 234,
  },
]

const CodeCollaborationHub = memo(function CodeCollaborationHub() {
  const [snippets, setSnippets] = useState<CodeSnippet[]>(SAMPLE_SNIPPETS)
  const [selectedSnippet, setSelectedSnippet] = useState<CodeSnippet | null>(null)
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedLanguage, setSelectedLanguage] = useState<string | null>(null)
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [newSnippet, setNewSnippet] = useState<Partial<CodeSnippet>>({
    title: '',
    language: 'javascript',
    code: '',
    description: '',
    tags: [],
  })
  const [newTag, setNewTag] = useState('')
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid')

  // Load from localStorage
  useEffect(() => {
    try {
      const saved = localStorage.getItem('weblinux-code-snippets')
      if (saved) {
        const parsed = JSON.parse(saved)
        setSnippets([...SAMPLE_SNIPPETS, ...parsed.map((s: any) => ({
          ...s,
          createdAt: new Date(s.createdAt),
        }))])
      }
    } catch {
      // ignore
    }
  }, [])

  // Save to localStorage
  useEffect(() => {
    const userSnippets = snippets.filter(s => !SAMPLE_SNIPPETS.some(ss => ss.id === s.id))
    try {
      localStorage.setItem('weblinux-code-snippets', JSON.stringify(userSnippets))
    } catch {
      // ignore
    }
  }, [snippets])

  const filteredSnippets = snippets.filter(s => {
    const matchesSearch = s.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      s.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
      s.tags.some(t => t.toLowerCase().includes(searchQuery.toLowerCase())) ||
      s.code.toLowerCase().includes(searchQuery.toLowerCase())
    const matchesLanguage = !selectedLanguage || s.language === selectedLanguage
    return matchesSearch && matchesLanguage
  })

  const createSnippet = useCallback(() => {
    if (!newSnippet.title || !newSnippet.code) return
    
    const snippet: CodeSnippet = {
      id: Date.now().toString(),
      title: newSnippet.title,
      language: newSnippet.language || 'javascript',
      code: newSnippet.code,
      description: newSnippet.description || '',
      tags: newSnippet.tags || [],
      createdAt: new Date(),
      views: 0,
    }
    
    setSnippets(prev => [snippet, ...prev])
    setShowCreateModal(false)
    setNewSnippet({
      title: '',
      language: 'javascript',
      code: '',
      description: '',
      tags: [],
    })
  }, [newSnippet])

  const deleteSnippet = useCallback((id: string) => {
    setSnippets(prev => prev.filter(s => s.id !== id))
    if (selectedSnippet?.id === id) {
      setSelectedSnippet(null)
    }
  }, [selectedSnippet])

  const copyCode = useCallback((code: string) => {
    navigator.clipboard.writeText(code)
  }, [])

  const shareSnippet = useCallback((snippet: CodeSnippet) => {
    const shareUrl = `${window.location.origin}/WebLinuxOS/#snippet-${snippet.id}`
    navigator.clipboard.writeText(shareUrl)
  }, [])

  const addTag = useCallback(() => {
    if (!newTag.trim()) return
    setNewSnippet(prev => ({
      ...prev,
      tags: [...(prev.tags || []), newTag.trim().toLowerCase()],
    }))
    setNewTag('')
  }, [newTag])

  const removeTag = useCallback((tag: string) => {
    setNewSnippet(prev => ({
      ...prev,
      tags: (prev.tags || []).filter(t => t !== tag),
    }))
  }, [])

  const getLanguageInfo = (langId: string) => {
    return LANGUAGES.find(l => l.id === langId) || LANGUAGES[0]
  }

  return (
    <div style={{
      height: '100%',
      background: '#0d1117',
      color: '#c9d1d9',
      fontFamily: 'system-ui, -apple-system, sans-serif',
      display: 'flex',
      flexDirection: 'column',
    }}>
      {/* Header */}
      <div style={{
        padding: '16px 24px',
        background: '#161b22',
        borderBottom: '1px solid #30363d',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
      }}>
        <div>
          <h1 style={{ fontSize: 20, fontWeight: 600, margin: 0, color: '#f0f6fc' }}>
            代码协作中心
          </h1>
          <p style={{ fontSize: 13, color: '#8b949e', margin: '4px 0 0 0' }}>
            分享、发现和管理代码片段
          </p>
        </div>
        <button
          onClick={() => setShowCreateModal(true)}
          style={{
            padding: '8px 16px',
            borderRadius: 6,
            border: 'none',
            background: '#238636',
            color: '#fff',
            cursor: 'pointer',
            fontSize: 14,
            fontWeight: 600,
          }}
        >
          + 创建片段
        </button>
      </div>

      {/* Filters */}
      <div style={{
        padding: '12px 24px',
        background: '#161b22',
        borderBottom: '1px solid #30363d',
        display: 'flex',
        gap: 12,
        alignItems: 'center',
      }}>
        <input
          type="text"
          placeholder="搜索代码片段..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          style={{
            padding: '8px 12px',
            borderRadius: 6,
            border: '1px solid #30363d',
            background: '#0d1117',
            color: '#c9d1d9',
            fontSize: 14,
            width: 300,
          }}
        />
        <select
          value={selectedLanguage || ''}
          onChange={(e) => setSelectedLanguage(e.target.value || null)}
          style={{
            padding: '8px 12px',
            borderRadius: 6,
            border: '1px solid #30363d',
            background: '#0d1117',
            color: '#c9d1d9',
            fontSize: 14,
          }}
        >
          <option value="">所有语言</option>
          {LANGUAGES.map(lang => (
            <option key={lang.id} value={lang.id}>{lang.name}</option>
          ))}
        </select>
        <div style={{ display: 'flex', gap: 4 }}>
          <button
            onClick={() => setViewMode('grid')}
            style={{
              padding: '6px 10px',
              borderRadius: 4,
              border: '1px solid #30363d',
              background: viewMode === 'grid' ? '#21262d' : 'transparent',
              color: '#c9d1d9',
              cursor: 'pointer',
            }}
          >
            网格
          </button>
          <button
            onClick={() => setViewMode('list')}
            style={{
              padding: '6px 10px',
              borderRadius: 4,
              border: '1px solid #30363d',
              background: viewMode === 'list' ? '#21262d' : 'transparent',
              color: '#c9d1d9',
              cursor: 'pointer',
            }}
          >
            列表
          </button>
        </div>
        <span style={{ fontSize: 13, color: '#8b949e' }}>
          {filteredSnippets.length} 个片段
        </span>
      </div>

      {/* Main Content */}
      <div style={{ flex: 1, overflow: 'auto', padding: 24 }}>
        {selectedSnippet ? (
          // Detail View
          <div>
            <button
              onClick={() => setSelectedSnippet(null)}
              style={{
                padding: '6px 12px',
                borderRadius: 6,
                border: '1px solid #30363d',
                background: 'transparent',
                color: '#8b949e',
                cursor: 'pointer',
                fontSize: 13,
                marginBottom: 16,
              }}
            >
              ← 返回列表
            </button>
            
            <div style={{
              background: '#161b22',
              borderRadius: 12,
              border: '1px solid #30363d',
            }}>
              <div style={{
                padding: '16px 20px',
                borderBottom: '1px solid #30363d',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                  <span style={{
                    background: getLanguageInfo(selectedSnippet.language).color,
                    color: '#fff',
                    padding: '4px 8px',
                    borderRadius: 4,
                    fontSize: 12,
                    fontWeight: 600,
                  }}>
                    {getLanguageInfo(selectedSnippet.language).icon}
                  </span>
                  <h2 style={{ fontSize: 18, fontWeight: 600, margin: 0 }}>
                    {selectedSnippet.title}
                  </h2>
                </div>
                <div style={{ display: 'flex', gap: 8 }}>
                  <button
                    onClick={() => copyCode(selectedSnippet.code)}
                    style={{
                      padding: '6px 12px',
                      borderRadius: 6,
                      border: '1px solid #30363d',
                      background: 'transparent',
                      color: '#c9d1d9',
                      cursor: 'pointer',
                      fontSize: 13,
                    }}
                  >
                    复制代码
                  </button>
                  <button
                    onClick={() => shareSnippet(selectedSnippet)}
                    style={{
                      padding: '6px 12px',
                      borderRadius: 6,
                      border: '1px solid #30363d',
                      background: 'transparent',
                      color: '#c9d1d9',
                      cursor: 'pointer',
                      fontSize: 13,
                    }}
                  >
                    分享
                  </button>
                  {!SAMPLE_SNIPPETS.some(s => s.id === selectedSnippet.id) && (
                    <button
                      onClick={() => deleteSnippet(selectedSnippet.id)}
                      style={{
                        padding: '6px 12px',
                        borderRadius: 6,
                        border: '1px solid #30363d',
                        background: 'transparent',
                        color: '#f85149',
                        cursor: 'pointer',
                        fontSize: 13,
                      }}
                    >
                      删除
                    </button>
                  )}
                </div>
              </div>
              
              {selectedSnippet.description && (
                <div style={{ padding: '12px 20px', borderBottom: '1px solid #30363d' }}>
                  <p style={{ fontSize: 14, color: '#8b949e', margin: 0 }}>
                    {selectedSnippet.description}
                  </p>
                </div>
              )}
              
              <div style={{ padding: '12px 20px', borderBottom: '1px solid #30363d' }}>
                <div style={{ display: 'flex', gap: 8 }}>
                  {selectedSnippet.tags.map(tag => (
                    <span key={tag} style={{
                      background: '#21262d',
                      color: '#8b949e',
                      padding: '4px 10px',
                      borderRadius: 20,
                      fontSize: 12,
                    }}>
                      #{tag}
                    </span>
                  ))}
                </div>
              </div>
              
              <pre style={{
                padding: 20,
                margin: 0,
                background: '#0d1117',
                borderRadius: '0 0 12px 12px',
                fontSize: 14,
                lineHeight: 1.6,
                fontFamily: 'ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace',
                whiteSpace: 'pre-wrap',
                wordBreak: 'break-word',
              }}>
                {selectedSnippet.code}
              </pre>
            </div>
            
            <div style={{
              marginTop: 16,
              fontSize: 12,
              color: '#8b949e',
            }}>
              创建时间: {selectedSnippet.createdAt.toLocaleDateString()} | 
              浏览次数: {selectedSnippet.views}
            </div>
          </div>
        ) : (
          // List/Grid View
          <div style={{
            display: viewMode === 'grid' ? 'grid' : 'flex',
            gridTemplateColumns: viewMode === 'grid' ? 'repeat(auto-fill, minmax(300px, 1fr))' : undefined,
            flexDirection: viewMode === 'list' ? 'column' : undefined,
            gap: 16,
          }}>
            {filteredSnippets.map(snippet => (
              <div
                key={snippet.id}
                onClick={() => {
                  setSelectedSnippet(snippet)
                  setSnippets(prev => prev.map(s => 
                    s.id === snippet.id ? { ...s, views: s.views + 1 } : s
                  ))
                }}
                style={{
                  background: '#161b22',
                  borderRadius: 12,
                  border: '1px solid #30363d',
                  cursor: 'pointer',
                  transition: 'border-color 0.2s',
                }}
              >
                <div style={{
                  padding: '16px 20px',
                  borderBottom: '1px solid #30363d',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 12,
                }}>
                  <span style={{
                    background: getLanguageInfo(snippet.language).color,
                    color: '#fff',
                    padding: '4px 8px',
                    borderRadius: 4,
                    fontSize: 11,
                    fontWeight: 600,
                  }}>
                    {getLanguageInfo(snippet.language).icon}
                  </span>
                  <h3 style={{ fontSize: 16, fontWeight: 600, margin: 0, flex: 1 }}>
                    {snippet.title}
                  </h3>
                  <span style={{ fontSize: 12, color: '#8b949e' }}>
                    {snippet.views} 次浏览
                  </span>
                </div>
                
                <div style={{ padding: '12px 20px' }}>
                  <p style={{ fontSize: 13, color: '#8b949e', margin: '0 0 8px 0' }}>
                    {snippet.description || '暂无描述'}
                  </p>
                  <div style={{ display: 'flex', gap: 6 }}>
                    {snippet.tags.slice(0, 3).map(tag => (
                      <span key={tag} style={{
                        background: '#21262d',
                        color: '#8b949e',
                        padding: '2px 8px',
                        borderRadius: 12,
                        fontSize: 11,
                      }}>
                        #{tag}
                      </span>
                    ))}
                    {snippet.tags.length > 3 && (
                      <span style={{ fontSize: 11, color: '#8b949e' }}>
                        +{snippet.tags.length - 3}
                      </span>
                    )}
                  </div>
                </div>
                
                <pre style={{
                  padding: '12px 20px',
                  margin: 0,
                  background: '#0d1117',
                  borderRadius: '0 0 12px 12px',
                  fontSize: 12,
                  lineHeight: 1.4,
                  fontFamily: 'ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace',
                  maxHeight: 100,
                  overflow: 'hidden',
                  whiteSpace: 'pre-wrap',
                  wordBreak: 'break-word',
                }}>
                  {snippet.code.slice(0, 200)}...
                </pre>
              </div>
            ))}
            
            {filteredSnippets.length === 0 && (
              <div style={{
                textAlign: 'center',
                padding: 60,
                color: '#8b949e',
              }}>
                <div style={{ fontSize: 48, marginBottom: 16 }}>📭</div>
                <p>没有找到匹配的代码片段</p>
                <button
                  onClick={() => setShowCreateModal(true)}
                  style={{
                    marginTop: 16,
                    padding: '8px 16px',
                    borderRadius: 6,
                    border: '1px solid #30363d',
                    background: 'transparent',
                    color: '#c9d1d9',
                    cursor: 'pointer',
                  }}
                >
                  创建新片段
                </button>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Create Modal */}
      {showCreateModal && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'rgba(0, 0, 0, 0.8)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000,
        }}>
          <div style={{
            background: '#161b22',
            borderRadius: 16,
            border: '1px solid #30363d',
            width: 600,
            maxHeight: '80vh',
            overflow: 'auto',
          }}>
            <div style={{
              padding: '20px 24px',
              borderBottom: '1px solid #30363d',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
            }}>
              <h2 style={{ fontSize: 18, fontWeight: 600, margin: 0 }}>创建代码片段</h2>
              <button
                onClick={() => setShowCreateModal(false)}
                style={{
                  background: 'none',
                  border: 'none',
                  color: '#8b949e',
                  cursor: 'pointer',
                  fontSize: 20,
                }}
              >
                ×
              </button>
            </div>
            
            <div style={{ padding: 24 }}>
              <div style={{ marginBottom: 16 }}>
                <label style={{ fontSize: 14, color: '#8b949e', marginBottom: 8, display: 'block' }}>
                  标题
                </label>
                <input
                  type="text"
                  value={newSnippet.title}
                  onChange={(e) => setNewSnippet(prev => ({ ...prev, title: e.target.value }))}
                  placeholder="代码片段标题"
                  style={{
                    width: '100%',
                    padding: '10px 12px',
                    borderRadius: 6,
                    border: '1px solid #30363d',
                    background: '#0d1117',
                    color: '#c9d1d9',
                    fontSize: 14,
                    boxSizing: 'border-box',
                  }}
                />
              </div>
              
              <div style={{ marginBottom: 16 }}>
                <label style={{ fontSize: 14, color: '#8b949e', marginBottom: 8, display: 'block' }}>
                  语言
                </label>
                <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                  {LANGUAGES.slice(0, 10).map(lang => (
                    <button
                      key={lang.id}
                      onClick={() => setNewSnippet(prev => ({ ...prev, language: lang.id }))}
                      style={{
                        padding: '6px 12px',
                        borderRadius: 6,
                        border: newSnippet.language === lang.id ? '1px solid ' + lang.color : '1px solid #30363d',
                        background: newSnippet.language === lang.id ? lang.color + '20' : 'transparent',
                        color: '#c9d1d9',
                        cursor: 'pointer',
                        fontSize: 13,
                      }}
                    >
                      {lang.name}
                    </button>
                  ))}
                </div>
              </div>
              
              <div style={{ marginBottom: 16 }}>
                <label style={{ fontSize: 14, color: '#8b949e', marginBottom: 8, display: 'block' }}>
                  描述
                </label>
                <input
                  type="text"
                  value={newSnippet.description}
                  onChange={(e) => setNewSnippet(prev => ({ ...prev, description: e.target.value }))}
                  placeholder="简要描述这个代码片段"
                  style={{
                    width: '100%',
                    padding: '10px 12px',
                    borderRadius: 6,
                    border: '1px solid #30363d',
                    background: '#0d1117',
                    color: '#c9d1d9',
                    fontSize: 14,
                    boxSizing: 'border-box',
                  }}
                />
              </div>
              
              <div style={{ marginBottom: 16 }}>
                <label style={{ fontSize: 14, color: '#8b949e', marginBottom: 8, display: 'block' }}>
                  标签
                </label>
                <div style={{ display: 'flex', gap: 8, marginBottom: 8 }}>
                  {(newSnippet.tags || []).map(tag => (
                    <span key={tag} style={{
                      background: '#21262d',
                      color: '#8b949e',
                      padding: '4px 10px',
                      borderRadius: 20,
                      fontSize: 12,
                      cursor: 'pointer',
                    }}
                    onClick={() => removeTag(tag)}
                    >
                      #{tag} ×
                    </span>
                  ))}
                </div>
                <div style={{ display: 'flex', gap: 8 }}>
                  <input
                    type="text"
                    value={newTag}
                    onChange={(e) => setNewTag(e.target.value)}
                    placeholder="添加标签"
                    style={{
                      flex: 1,
                      padding: '8px 12px',
                      borderRadius: 6,
                      border: '1px solid #30363d',
                      background: '#0d1117',
                      color: '#c9d1d9',
                      fontSize: 13,
                    }}
                  />
                  <button
                    onClick={addTag}
                    style={{
                      padding: '8px 12px',
                      borderRadius: 6,
                      border: '1px solid #30363d',
                      background: 'transparent',
                      color: '#c9d1d9',
                      cursor: 'pointer',
                    }}
                  >
                    添加
                  </button>
                </div>
              </div>
              
              <div style={{ marginBottom: 24 }}>
                <label style={{ fontSize: 14, color: '#8b949e', marginBottom: 8, display: 'block' }}>
                  代码
                </label>
                <textarea
                  value={newSnippet.code}
                  onChange={(e) => setNewSnippet(prev => ({ ...prev, code: e.target.value }))}
                  placeholder="粘贴或输入代码..."
                  style={{
                    width: '100%',
                    minHeight: 200,
                    padding: 12,
                    borderRadius: 6,
                    border: '1px solid #30363d',
                    background: '#0d1117',
                    color: '#c9d1d9',
                    fontSize: 14,
                    fontFamily: 'ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace',
                    lineHeight: 1.6,
                    resize: 'vertical',
                    boxSizing: 'border-box',
                  }}
                />
              </div>
              
              <div style={{ display: 'flex', gap: 12, justifyContent: 'flex-end' }}>
                <button
                  onClick={() => setShowCreateModal(false)}
                  style={{
                    padding: '10px 20px',
                    borderRadius: 6,
                    border: '1px solid #30363d',
                    background: 'transparent',
                    color: '#c9d1d9',
                    cursor: 'pointer',
                    fontSize: 14,
                  }}
                >
                  取消
                </button>
                <button
                  onClick={createSnippet}
                  disabled={!newSnippet.title || !newSnippet.code}
                  style={{
                    padding: '10px 20px',
                    borderRadius: 6,
                    border: 'none',
                    background: !newSnippet.title || !newSnippet.code ? '#21262d' : '#238636',
                    color: '#fff',
                    cursor: !newSnippet.title || !newSnippet.code ? 'not-allowed' : 'pointer',
                    fontSize: 14,
                    fontWeight: 600,
                  }}
                >
                  创建片段
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
})

export default CodeCollaborationHub