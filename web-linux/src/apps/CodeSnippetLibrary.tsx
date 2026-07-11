import { useState, useCallback, useMemo } from 'react'
import { Code2Icon, SearchIcon, PlusIcon, CopyIcon, Trash2Icon, TagIcon, ClockIcon, StarIcon, StarOffIcon, CheckIcon } from '../icons'

interface CodeSnippet {
  id: string
  title: string
  language: string
  code: string
  tags: string[]
  starred: boolean
  createdAt: Date
  category: 'utility' | 'algorithm' | 'component' | 'pattern' | 'template'
}

const defaultSnippets: CodeSnippet[] = [
  {
    id: '1',
    title: '防抖函数',
    language: 'JavaScript',
    code: `function debounce(fn, delay = 300) {
  let timer = null;
  return function(...args) {
    clearTimeout(timer);
    timer = setTimeout(() => {
      fn.apply(this, args);
    }, delay);
  };
}`,
    tags: ['utility', 'performance'],
    starred: true,
    createdAt: new Date(),
    category: 'utility'
  },
  {
    id: '2',
    title: '深拷贝',
    language: 'JavaScript',
    code: `function deepClone(obj, hash = new WeakMap()) {
  if (obj === null || typeof obj !== 'object') return obj;
  if (hash.has(obj)) return hash.get(obj);
  
  const clone = Array.isArray(obj) ? [] : {};
  hash.set(obj, clone);
  
  for (const key in obj) {
    if (obj.hasOwnProperty(key)) {
      clone[key] = deepClone(obj[key], hash);
    }
  }
  return clone;
}`,
    tags: ['utility', 'algorithm'],
    starred: false,
    createdAt: new Date(),
    category: 'algorithm'
  },
  {
    id: '3',
    title: 'React useEffect 清理',
    language: 'TypeScript',
    code: `useEffect(() => {
  let isMounted = true;
  
  const fetchData = async () => {
    const result = await api.getData();
    if (isMounted) {
      setData(result);
    }
  };
  
  fetchData();
  
  return () => {
    isMounted = false;
  };
}, []);`,
    tags: ['react', 'pattern'],
    starred: true,
    createdAt: new Date(),
    category: 'pattern'
  },
  {
    id: '4',
    title: '数组去重',
    language: 'JavaScript',
    code: `// 方法1: Set
const unique = arr => [...new Set(arr)];

// 方法2: filter
const uniqueByFilter = arr => 
  arr.filter((v, i, a) => a.indexOf(v) === i);

// 方法3: reduce
const uniqueByReduce = arr => 
  arr.reduce((acc, v) => 
    acc.includes(v) ? acc : [...acc, v], []
  );`,
    tags: ['array', 'algorithm'],
    starred: false,
    createdAt: new Date(),
    category: 'algorithm'
  }
]

export default function CodeSnippetLibrary() {
  const [snippets, setSnippets] = useState<CodeSnippet[]>(defaultSnippets)
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedLanguage, setSelectedLanguage] = useState<string>('all')
  const [selectedCategory, setSelectedCategory] = useState<string>('all')
  const [selectedSnippet, setSelectedSnippet] = useState<CodeSnippet | null>(null)
  const [copiedId, setCopiedId] = useState<string | null>(null)
  const [showFavorites, setShowFavorites] = useState(false)
  const [showAddModal, setShowAddModal] = useState(false)
  const [newSnippet, setNewSnippet] = useState({
    title: '',
    language: 'JavaScript',
    code: '',
    tags: '',
    category: 'utility' as const
  })

  const languages = useMemo(() => {
    const langs = new Set(snippets.map(s => s.language))
    return ['all', ...Array.from(langs)]
  }, [snippets])

  const filteredSnippets = useMemo(() => {
    return snippets.filter(snippet => {
      const matchesSearch = snippet.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        snippet.tags.some(tag => tag.toLowerCase().includes(searchQuery.toLowerCase())) ||
        snippet.code.toLowerCase().includes(searchQuery.toLowerCase())
      
      const matchesLanguage = selectedLanguage === 'all' || snippet.language === selectedLanguage
      const matchesCategory = selectedCategory === 'all' || snippet.category === selectedCategory
      const matchesFavorite = !showFavorites || snippet.starred
      
      return matchesSearch && matchesLanguage && matchesCategory && matchesFavorite
    })
  }, [snippets, searchQuery, selectedLanguage, selectedCategory, showFavorites])

  const handleCopy = useCallback((id: string, code: string) => {
    navigator.clipboard.writeText(code)
    setCopiedId(id)
    setTimeout(() => setCopiedId(null), 2000)
  }, [])

  const toggleStar = useCallback((id: string) => {
    setSnippets(prev => prev.map(s => 
      s.id === id ? { ...s, starred: !s.starred } : s
    ))
  }, [])

  const deleteSnippet = useCallback((id: string) => {
    setSnippets(prev => prev.filter(s => s.id !== id))
    if (selectedSnippet?.id === id) {
      setSelectedSnippet(null)
    }
  }, [selectedSnippet])

  const handleAddSnippet = useCallback(() => {
    if (!newSnippet.title || !newSnippet.code) return
    
    const snippet: CodeSnippet = {
      id: Date.now().toString(),
      title: newSnippet.title,
      language: newSnippet.language,
      code: newSnippet.code,
      tags: newSnippet.tags.split(',').map(t => t.trim()).filter(Boolean),
      starred: false,
      createdAt: new Date(),
      category: newSnippet.category
    }
    
    setSnippets(prev => [snippet, ...prev])
    setShowAddModal(false)
    setNewSnippet({
      title: '',
      language: 'JavaScript',
      code: '',
      tags: '',
      category: 'utility'
    })
  }, [newSnippet])

  const getCategoryLabel = (cat: string) => {
    const labels: Record<string, string> = {
      utility: '工具函数',
      algorithm: '算法',
      component: '组件',
      pattern: '设计模式',
      template: '模板'
    }
    return labels[cat] || cat
  }

  return (
    <div style={{
      height: '100%',
      display: 'flex',
      flexDirection: 'column',
      background: '#0d1117',
      color: '#c9d1d9',
      fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Helvetica, Arial, sans-serif'
    }}>
      {/* 头部 */}
      <div style={{
        padding: '12px 16px',
        borderBottom: '1px solid #21262d',
        background: '#161b22'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <Code2Icon size={20} style={{ color: '#58a6ff' }} />
            <h1 style={{ fontSize: 16, fontWeight: 600, margin: 0 }}>代码片段库</h1>
          </div>
          <button
            onClick={() => setShowAddModal(true)}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 6,
              padding: '6px 12px',
              background: '#238636',
              border: 'none',
              borderRadius: 6,
              color: '#fff',
              fontSize: 13,
              fontWeight: 500,
              cursor: 'pointer'
            }}
          >
            <PlusIcon size={14} />
            新建
          </button>
        </div>
        
        {/* 搜索和筛选 */}
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          <div style={{ flex: 1, minWidth: 200, position: 'relative' }}>
            <SearchIcon size={14} style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', color: '#8b949e' }} />
            <input
              type="text"
              placeholder="搜索片段..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              style={{
                width: '100%',
                padding: '6px 10px 6px 32px',
                background: '#0d1117',
                border: '1px solid #30363d',
                borderRadius: 6,
                color: '#c9d1d9',
                fontSize: 13
              }}
            />
          </div>
          
          <select
            value={selectedLanguage}
            onChange={(e) => setSelectedLanguage(e.target.value)}
            style={{
              padding: '6px 10px',
              background: '#21262d',
              border: '1px solid #30363d',
              borderRadius: 6,
              color: '#c9d1d9',
              fontSize: 13
            }}
          >
            {languages.map(lang => (
              <option key={lang} value={lang}>
                {lang === 'all' ? '所有语言' : lang}
              </option>
            ))}
          </select>
          
          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            style={{
              padding: '6px 10px',
              background: '#21262d',
              border: '1px solid #30363d',
              borderRadius: 6,
              color: '#c9d1d9',
              fontSize: 13
            }}
          >
            <option value="all">所有分类</option>
            <option value="utility">工具函数</option>
            <option value="algorithm">算法</option>
            <option value="component">组件</option>
            <option value="pattern">设计模式</option>
            <option value="template">模板</option>
          </select>
          
          <button
            onClick={() => setShowFavorites(!showFavorites)}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 6,
              padding: '6px 12px',
              background: showFavorites ? '#21262d' : 'transparent',
              border: '1px solid #30363d',
              borderRadius: 6,
              color: showFavorites ? '#f0883e' : '#8b949e',
              fontSize: 13,
              cursor: 'pointer'
            }}
          >
            <StarIcon size={14} fill={showFavorites ? '#f0883e' : 'none'} />
            收藏
          </button>
        </div>
      </div>

      {/* 内容区 */}
      <div style={{ display: 'flex', flex: 1, overflow: 'hidden' }}>
        {/* 列表 */}
        <div style={{
          width: 280,
          borderRight: '1px solid #21262d',
          overflow: 'auto',
          background: '#0d1117'
        }}>
          {filteredSnippets.map(snippet => (
            <div
              key={snippet.id}
              onClick={() => setSelectedSnippet(snippet)}
              style={{
                padding: '10px 14px',
                borderBottom: '1px solid #21262d',
                cursor: 'pointer',
                background: selectedSnippet?.id === snippet.id ? '#161b22' : 'transparent',
                transition: 'background 0.15s'
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 4 }}>
                <span style={{ fontSize: 13, fontWeight: 500, color: '#c9d1d9' }}>
                  {snippet.title}
                </span>
                <span style={{
                  padding: '2px 6px',
                  background: '#21262d',
                  borderRadius: 4,
                  fontSize: 10,
                  color: '#8b949e'
                }}>
                  {snippet.language}
                </span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <span style={{
                  fontSize: 11,
                  color: '#8b949e'
                }}>
                  {getCategoryLabel(snippet.category)}
                </span>
                {snippet.starred && <StarIcon size={10} style={{ color: '#f0883e' }} fill="#f0883e" />}
              </div>
            </div>
          ))}
          
          {filteredSnippets.length === 0 && (
            <div style={{ padding: 20, textAlign: 'center', color: '#8b949e', fontSize: 13 }}>
              没有找到匹配的片段
            </div>
          )}
        </div>

        {/* 详情 */}
        <div style={{ flex: 1, overflow: 'auto', background: '#0d1117' }}>
          {selectedSnippet ? (
            <div style={{ padding: 16 }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
                <h2 style={{ fontSize: 18, fontWeight: 600, margin: 0 }}>{selectedSnippet.title}</h2>
                <div style={{ display: 'flex', gap: 8 }}>
                  <button
                    onClick={() => toggleStar(selectedSnippet.id)}
                    style={{
                      padding: 6,
                      background: 'transparent',
                      border: '1px solid #30363d',
                      borderRadius: 6,
                      color: selectedSnippet.starred ? '#f0883e' : '#8b949e',
                      cursor: 'pointer'
                    }}
                  >
                    {selectedSnippet.starred ? <StarOffIcon size={14} /> : <StarIcon size={14} />}
                  </button>
                  <button
                    onClick={() => handleCopy(selectedSnippet.id, selectedSnippet.code)}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 6,
                      padding: '6px 12px',
                      background: copiedId === selectedSnippet.id ? '#238636' : '#21262d',
                      border: '1px solid #30363d',
                      borderRadius: 6,
                      color: '#c9d1d9',
                      fontSize: 12,
                      cursor: 'pointer'
                    }}
                  >
                    {copiedId === selectedSnippet.id ? <CheckIcon size={14} /> : <CopyIcon size={14} />}
                    {copiedId === selectedSnippet.id ? '已复制' : '复制'}
                  </button>
                  <button
                    onClick={() => deleteSnippet(selectedSnippet.id)}
                    style={{
                      padding: 6,
                      background: 'transparent',
                      border: '1px solid #f85149',
                      borderRadius: 6,
                      color: '#f85149',
                      cursor: 'pointer'
                    }}
                  >
                    <Trash2Icon size={14} />
                  </button>
                </div>
              </div>
              
              <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 16 }}>
                <span style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 4,
                  padding: '3px 8px',
                  background: '#f0883e22',
                  borderRadius: 4,
                  fontSize: 12,
                  color: '#f0883e'
                }}>
                  {selectedSnippet.language}
                </span>
                <span style={{ fontSize: 12, color: '#8b949e', display: 'flex', alignItems: 'center', gap: 4 }}>
                  <TagIcon size={12} />
                  {getCategoryLabel(selectedSnippet.category)}
                </span>
                <span style={{ fontSize: 12, color: '#8b949e', display: 'flex', alignItems: 'center', gap: 4 }}>
                  <ClockIcon size={12} />
                  {selectedSnippet.createdAt.toLocaleDateString()}
                </span>
              </div>
              
              {/* 标签 */}
              <div style={{ display: 'flex', gap: 6, marginBottom: 16 }}>
                {selectedSnippet.tags.map((tag, i) => (
                  <span key={i} style={{
                    padding: '2px 8px',
                    background: '#21262d',
                    borderRadius: 12,
                    fontSize: 11,
                    color: '#8b949e'
                  }}>
                    {tag}
                  </span>
                ))}
              </div>
              
              {/* 代码 */}
              <pre style={{
                background: '#161b22',
                border: '1px solid #30363d',
                borderRadius: 8,
                padding: 16,
                margin: 0,
                fontSize: 13,
                lineHeight: 1.6,
                overflow: 'auto',
                color: '#c9d1d9',
                fontFamily: '"Fira Code", "Cascadia Code", Consolas, monospace'
              }}>
                <code>{selectedSnippet.code}</code>
              </pre>
            </div>
          ) : (
            <div style={{
              height: '100%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#8b949e',
              fontSize: 14
            }}>
              选择一个片段查看详情
            </div>
          )}
        </div>
      </div>

      {/* 新建模态框 */}
      {showAddModal && (
        <div style={{
          position: 'fixed',
          inset: 0,
          background: 'rgba(0,0,0,0.7)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000
        }}>
          <div style={{
            background: '#161b22',
            border: '1px solid #30363d',
            borderRadius: 12,
            padding: 20,
            width: 500,
            maxHeight: '80vh',
            overflow: 'auto'
          }}>
            <h3 style={{ marginTop: 0, marginBottom: 16, fontSize: 16 }}>新建代码片段</h3>
            
            <div style={{ marginBottom: 12 }}>
              <label style={{ display: 'block', fontSize: 12, color: '#8b949e', marginBottom: 4 }}>标题</label>
              <input
                type="text"
                value={newSnippet.title}
                onChange={(e) => setNewSnippet({ ...newSnippet, title: e.target.value })}
                style={{
                  width: '100%',
                  padding: 8,
                  background: '#0d1117',
                  border: '1px solid #30363d',
                  borderRadius: 6,
                  color: '#c9d1d9',
                  fontSize: 13
                }}
              />
            </div>
            
            <div style={{ marginBottom: 12 }}>
              <label style={{ display: 'block', fontSize: 12, color: '#8b949e', marginBottom: 4 }}>语言</label>
              <select
                value={newSnippet.language}
                onChange={(e) => setNewSnippet({ ...newSnippet, language: e.target.value })}
                style={{
                  width: '100%',
                  padding: 8,
                  background: '#0d1117',
                  border: '1px solid #30363d',
                  borderRadius: 6,
                  color: '#c9d1d9',
                  fontSize: 13
                }}
              >
                <option>JavaScript</option>
                <option>TypeScript</option>
                <option>Python</option>
                <option>Go</option>
                <option>Rust</option>
                <option>HTML</option>
                <option>CSS</option>
                <option>SQL</option>
              </select>
            </div>
            
            <div style={{ marginBottom: 12 }}>
              <label style={{ display: 'block', fontSize: 12, color: '#8b949e', marginBottom: 4 }}>分类</label>
              <select
                value={newSnippet.category}
                onChange={(e) => setNewSnippet({ ...newSnippet, category: e.target.value as any })}
                style={{
                  width: '100%',
                  padding: 8,
                  background: '#0d1117',
                  border: '1px solid #30363d',
                  borderRadius: 6,
                  color: '#c9d1d9',
                  fontSize: 13
                }}
              >
                <option value="utility">工具函数</option>
                <option value="algorithm">算法</option>
                <option value="component">组件</option>
                <option value="pattern">设计模式</option>
                <option value="template">模板</option>
              </select>
            </div>
            
            <div style={{ marginBottom: 12 }}>
              <label style={{ display: 'block', fontSize: 12, color: '#8b949e', marginBottom: 4 }}>代码</label>
              <textarea
                value={newSnippet.code}
                onChange={(e) => setNewSnippet({ ...newSnippet, code: e.target.value })}
                style={{
                  width: '100%',
                  height: 200,
                  padding: 10,
                  background: '#0d1117',
                  border: '1px solid #30363d',
                  borderRadius: 6,
                  color: '#c9d1d9',
                  fontSize: 13,
                  fontFamily: 'monospace',
                  resize: 'vertical'
                }}
              />
            </div>
            
            <div style={{ marginBottom: 16 }}>
              <label style={{ display: 'block', fontSize: 12, color: '#8b949e', marginBottom: 4 }}>标签 (逗号分隔)</label>
              <input
                type="text"
                value={newSnippet.tags}
                onChange={(e) => setNewSnippet({ ...newSnippet, tags: e.target.value })}
                placeholder="react, hooks, utility"
                style={{
                  width: '100%',
                  padding: 8,
                  background: '#0d1117',
                  border: '1px solid #30363d',
                  borderRadius: 6,
                  color: '#c9d1d9',
                  fontSize: 13
                }}
              />
            </div>
            
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10 }}>
              <button
                onClick={() => setShowAddModal(false)}
                style={{
                  padding: '8px 16px',
                  background: 'transparent',
                  border: '1px solid #30363d',
                  borderRadius: 6,
                  color: '#c9d1d9',
                  fontSize: 13,
                  cursor: 'pointer'
                }}
              >
                取消
              </button>
              <button
                onClick={handleAddSnippet}
                disabled={!newSnippet.title || !newSnippet.code}
                style={{
                  padding: '8px 16px',
                  background: '#238636',
                  border: 'none',
                  borderRadius: 6,
                  color: '#fff',
                  fontSize: 13,
                  cursor: 'pointer',
                  opacity: !newSnippet.title || !newSnippet.code ? 0.5 : 1
                }}
              >
                保存
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}