import { useState, useCallback, memo } from 'react'

interface CodeSnippet {
  id: string
  title: string
  language: string
  code: string
  description: string
  tags: string[]
  author: string
  createdAt: Date
  views: number
  likes: number
  featured: boolean
}

const LANGUAGE_OPTIONS = [
  'JavaScript', 'TypeScript', 'Python', 'Java', 'C++', 'Go', 'Rust',
  'PHP', 'Ruby', 'Swift', 'Kotlin', 'HTML', 'CSS', 'SQL', 'Shell',
  'R', 'MATLAB', 'JSON', 'YAML', 'Markdown', 'React', 'Vue', 'Angular'
]

const TAG_OPTIONS = [
  '实用工具', '算法', '数据结构', '网络编程', '文件操作', '字符串处理',
  '数学计算', '日期时间', '正则表达式', '异步编程', '错误处理', '测试',
  '性能优化', '安全加密', 'UI组件', '动画效果', '数据可视化', '游戏开发',
  '机器学习', '数据库', 'API设计', '系统工具', '常用技巧', '最佳实践'
]

const SAMPLE_SNIPPETS: CodeSnippet[] = [
  {
    id: '1',
    title: '数组去重的多种方法',
    language: 'JavaScript',
    code: `// 方法1: 使用 Set (推荐)
const unique1 = arr => [...new Set(arr)];

// 方法2: 使用 filter
const unique2 = arr => arr.filter((item, index) => 
  arr.indexOf(item) === index
);

// 方法3: 使用 reduce
const unique3 = arr => arr.reduce((acc, cur) => 
  acc.includes(cur) ? acc : [...acc, cur], []
);

// 示例
const arr = [1, 2, 2, 3, 3, 3, 4];
console.log(unique1(arr)); // [1, 2, 3, 4]`,
    description: '展示 JavaScript 中数组去重的三种常见方法，包括 Set、filter 和 reduce。',
    tags: ['实用工具', '数组', '常用技巧'],
    author: 'WebLinuxOS',
    createdAt: new Date('2024-01-15'),
    views: 1284,
    likes: 89,
    featured: true
  },
  {
    id: '2',
    title: 'Python 列表推导式技巧',
    language: 'Python',
    code: `# 基本列表推导式
squares = [x**2 for x in range(10)]

# 带条件的列表推导式
even_squares = [x**2 for x in range(10) if x % 2 == 0]

# 嵌套列表推导式
matrix = [[i*j for j in range(5)] for i in range(5)]

# 字典推导式
word_lengths = {word: len(word) for word in ['hello', 'world', 'python']}

# 集合推导式
unique_lengths = {len(word) for word in ['a', 'ab', 'abc', 'ab']}`,
    description: 'Python 列表推导式的各种高级用法，包括嵌套推导和字典推导。',
    tags: ['实用工具', 'Python', '常用技巧'],
    author: 'WebLinuxOS',
    createdAt: new Date('2024-01-20'),
    views: 956,
    likes: 67,
    featured: true
  },
  {
    id: '3',
    title: '防抖和节流函数',
    language: 'JavaScript',
    code: `// 防抖函数 - 延迟执行，最后一次触发生效
function debounce(fn, delay = 300) {
  let timer = null;
  return function(...args) {
    if (timer) clearTimeout(timer);
    timer = setTimeout(() => {
      fn.apply(this, args);
    }, delay);
  };
}

// 节流函数 - 固定频率执行
function throttle(fn, interval = 300) {
  let lastTime = 0;
  return function(...args) {
    const now = Date.now();
    if (now - lastTime >= interval) {
      lastTime = now;
      fn.apply(this, args);
    }
  };
}

// 使用示例
const debouncedSearch = debounce(searchAPI, 500);
const throttledScroll = throttle(handleScroll, 200);`,
    description: '实现防抖和节流函数，用于优化高频触发的事件处理。',
    tags: ['性能优化', '异步编程', '常用技巧'],
    author: 'WebLinuxOS',
    createdAt: new Date('2024-01-25'),
    views: 2103,
    likes: 156,
    featured: true
  },
  {
    id: '4',
    title: '深拷贝实现',
    language: 'JavaScript',
    code: `// 递归深拷贝
function deepClone(obj, hash = new WeakMap()) {
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
}

// 使用 structuredClone (现代浏览器)
const cloned = structuredClone(original);

// 使用 JSON (简单场景)
const simpleClone = JSON.parse(JSON.stringify(obj));`,
    description: '多种深拷贝实现方式，包括递归、structuredClone 和 JSON 方法。',
    tags: ['实用工具', '数据结构', '最佳实践'],
    author: 'WebLinuxOS',
    createdAt: new Date('2024-02-01'),
    views: 1845,
    likes: 134,
    featured: false
  },
]

const CodeSnippetHub = memo(function CodeSnippetHub() {
  const [snippets, setSnippets] = useState<CodeSnippet[]>(SAMPLE_SNIPPETS)
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedLanguage, setSelectedLanguage] = useState<string>('all')
  const [selectedTags, setSelectedTags] = useState<string[]>([])
  const [sortBy, setSortBy] = useState<'popular' | 'recent' | 'likes'>('popular')
  const [selectedSnippet, setSelectedSnippet] = useState<CodeSnippet | null>(null)
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [newSnippet, setNewSnippet] = useState({
    title: '',
    language: 'JavaScript',
    code: '',
    description: '',
    tags: [] as string[]
  })

  // 过滤和排序
  const filteredSnippets = useCallback(() => {
    let result = snippets
    
    // 搜索过滤
    if (searchQuery) {
      const query = searchQuery.toLowerCase()
      result = result.filter(s =>
        s.title.toLowerCase().includes(query) ||
        s.description.toLowerCase().includes(query) ||
        s.tags.some(t => t.toLowerCase().includes(query)) ||
        s.code.toLowerCase().includes(query)
      )
    }
    
    // 语言过滤
    if (selectedLanguage !== 'all') {
      result = result.filter(s => s.language === selectedLanguage)
    }
    
    // 标签过滤
    if (selectedTags.length > 0) {
      result = result.filter(s =>
        selectedTags.some(t => s.tags.includes(t))
      )
    }
    
    // 排序
    if (sortBy === 'popular') {
      result = [...result].sort((a, b) => b.views - a.views)
    } else if (sortBy === 'recent') {
      result = [...result].sort((a, b) =>
        new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      )
    } else if (sortBy === 'likes') {
      result = [...result].sort((a, b) => b.likes - a.likes)
    }
    
    return result
  }, [snippets, searchQuery, selectedLanguage, selectedTags, sortBy])

  // 创建新片段
  const createSnippet = useCallback(() => {
    if (!newSnippet.title || !newSnippet.code) return
    
    const snippet: CodeSnippet = {
      id: Date.now().toString(),
      title: newSnippet.title,
      language: newSnippet.language,
      code: newSnippet.code,
      description: newSnippet.description,
      tags: newSnippet.tags,
      author: '当前用户',
      createdAt: new Date(),
      views: 0,
      likes: 0,
      featured: false
    }
    
    setSnippets(prev => [snippet, ...prev])
    setShowCreateModal(false)
    setNewSnippet({
      title: '',
      language: 'JavaScript',
      code: '',
      description: '',
      tags: []
    })
  }, [newSnippet])

  // 复制代码
  const copyCode = useCallback(async (code: string) => {
    try {
      await navigator.clipboard.writeText(code)
      alert('代码已复制到剪贴板')
    } catch {
      alert('复制失败')
    }
  }, [])

  // 喜欢
  const likeSnippet = useCallback((id: string) => {
    setSnippets(prev => prev.map(s =>
      s.id === id ? { ...s, likes: s.likes + 1 } : s
    ))
  }, [])

  // 获取语言图标
  const getLanguageIcon = (lang: string) => {
    const icons: Record<string, string> = {
      'JavaScript': '⚡',
      'TypeScript': '📘',
      'Python': '🐍',
      'Java': '☕',
      'C++': '⚙️',
      'Go': '🔵',
      'Rust': '🦀',
      'PHP': '🐘',
      'Ruby': '💎',
      'Swift': '🍎',
      'Kotlin': '🎯',
      'HTML': '🌐',
      'CSS': '🎨',
      'SQL': '🗃️',
      'Shell': '🖥️',
      'R': '📊',
      'MATLAB': '📈',
      'JSON': '📋',
      'YAML': '📝',
      'Markdown': '📖',
      'React': '⚛️',
      'Vue': '💚',
      'Angular': '🅰️'
    }
    return icons[lang] || '📝'
  }

  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      height: '100%',
      background: '#0d1117',
      color: '#c9d1d9',
      fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
      overflow: 'hidden'
    }}>
      {/* 顶部栏 */}
      <div style={{
        padding: '16px 20px',
        background: '#161b22',
        borderBottom: '1px solid #30363d',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <span style={{ fontSize: '28px' }}>💡</span>
          <div>
            <h2 style={{ margin: 0, fontSize: '18px', fontWeight: 600 }}>代码片段分享中心</h2>
            <div style={{ fontSize: '12px', color: '#8b949e', marginTop: '4px' }}>
              分享、发现、学习高质量代码片段
            </div>
          </div>
        </div>
        
        <button
          onClick={() => setShowCreateModal(true)}
          style={{
            padding: '10px 20px',
            background: '#238636',
            border: 'none',
            borderRadius: '6px',
            color: '#fff',
            fontSize: '13px',
            fontWeight: 500,
            cursor: 'pointer'
          }}
        >
          ✨ 分享代码
        </button>
      </div>

      {/* 搜索和过滤 */}
      <div style={{
        padding: '12px 16px',
        background: '#21262d',
        borderBottom: '1px solid #30363d',
        display: 'flex',
        alignItems: 'center',
        gap: '12px',
        flexWrap: 'wrap'
      }}>
        <input
          type="text"
          placeholder="搜索代码片段..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          style={{
            flex: 1,
            minWidth: '200px',
            padding: '10px 14px',
            background: '#0d1117',
            border: '1px solid #30363d',
            borderRadius: '6px',
            color: '#c9d1d9',
            fontSize: '13px'
          }}
        />
        
        <select
          value={selectedLanguage}
          onChange={(e) => setSelectedLanguage(e.target.value)}
          style={{
            padding: '8px 12px',
            background: '#21262d',
            border: '1px solid #30363d',
            borderRadius: '6px',
            color: '#c9d1d9',
            fontSize: '12px'
          }}
        >
          <option value="all">全部语言</option>
          {LANGUAGE_OPTIONS.map(lang => (
            <option key={lang} value={lang}>{lang}</option>
          ))}
        </select>
        
        <select
          value={sortBy}
          onChange={(e) => setSortBy(e.target.value as any)}
          style={{
            padding: '8px 12px',
            background: '#21262d',
            border: '1px solid #30363d',
            borderRadius: '6px',
            color: '#c9d1d9',
            fontSize: '12px'
          }}
        >
          <option value="popular">按热度</option>
          <option value="recent">按时间</option>
          <option value="likes">按点赞</option>
        </select>
        
        <div style={{ display: 'flex', gap: '6px', alignItems: 'center' }}>
          <span style={{ fontSize: '12px', color: '#8b949e' }}>标签:</span>
          {selectedTags.length === 0 && (
            <span style={{ fontSize: '12px', color: '#58a6ff', cursor: 'pointer' }}
              onClick={() => setSelectedTags(TAG_OPTIONS.slice(0, 3))}>
              选择标签
            </span>
          )}
          {selectedTags.map(tag => (
            <span
              key={tag}
              onClick={() => setSelectedTags(prev => prev.filter(t => t !== tag))}
              style={{
                padding: '4px 10px',
                background: '#388bfd26',
                borderRadius: '20px',
                fontSize: '12px',
                color: '#58a6ff',
                cursor: 'pointer'
              }}
            >
              {tag} ✕
            </span>
          ))}
        </div>
        
        <div style={{ fontSize: '12px', color: '#8b949e' }}>
          共 {filteredSnippets().length} 个片段
        </div>
      </div>

      {/* 主内容区 */}
      <div style={{
        flex: 1,
        display: 'flex',
        gap: '16px',
        padding: '16px',
        overflow: 'hidden'
      }}>
        {/* 片段列表 */}
        <div style={{
          flex: selectedSnippet ? 1 : 2,
          display: 'flex',
          flexDirection: 'column',
          gap: '12px',
          overflow: 'auto'
        }}>
          {filteredSnippets().map(snippet => (
            <div
              key={snippet.id}
              onClick={() => setSelectedSnippet(snippet)}
              style={{
                padding: '16px',
                background: '#161b22',
                borderRadius: '8px',
                border: `1px solid ${selectedSnippet?.id === snippet.id ? '#30363d' : 'transparent'}`,
                cursor: 'pointer',
                transition: 'all 0.2s'
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '12px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <span style={{ fontSize: '24px' }}>{getLanguageIcon(snippet.language)}</span>
                  <div>
                    <h3 style={{ margin: 0, fontSize: '15px', fontWeight: 600 }}>
                      {snippet.featured && <span style={{ color: '#f9e2af', marginRight: '6px' }}>★</span>}
                      {snippet.title}
                    </h3>
                    <div style={{ fontSize: '12px', color: '#8b949e', marginTop: '4px' }}>
                      {snippet.language} · {snippet.author} · {new Date(snippet.createdAt).toLocaleDateString('zh-CN')}
                    </div>
                  </div>
                </div>
                
                <div style={{ display: 'flex', gap: '16px', fontSize: '12px', color: '#8b949e' }}>
                  <span>👁 {snippet.views}</span>
                  <span style={{ color: '#f85149' }}>❤ {snippet.likes}</span>
                </div>
              </div>
              
              <div style={{
                fontSize: '12px',
                color: '#8b949e',
                marginBottom: '12px',
                lineHeight: 1.5
              }}>
                {snippet.description.substring(0, 80)}...
              </div>
              
              <div style={{ display: 'flex', gap: '6px' }}>
                {snippet.tags.slice(0, 3).map(tag => (
                  <span
                    key={tag}
                    style={{
                      padding: '4px 8px',
                      background: '#21262d',
                      borderRadius: '4px',
                      fontSize: '11px',
                      color: '#8b949e'
                    }}
                  >
                    {tag}
                  </span>
                ))}
              </div>
              
              {/* 代码预览 */}
              <div style={{
                marginTop: '12px',
                padding: '12px',
                background: '#0d1117',
                borderRadius: '6px',
                fontFamily: 'monospace',
                fontSize: '12px',
                color: '#7ee787',
                overflow: 'hidden',
                maxHeight: '60px',
                position: 'relative'
              }}>
                <pre style={{
                  margin: 0,
                  whiteSpace: 'pre-wrap',
                  overflow: 'hidden'
                }}>
                  {snippet.code.split('\n').slice(0, 3).join('\n')}
                </pre>
                <div style={{
                  position: 'absolute',
                  bottom: 0,
                  left: 0,
                  right: 0,
                  height: '20px',
                  background: 'linear-gradient(transparent, #0d1117)'
                }} />
              </div>
            </div>
          ))}
          
          {filteredSnippets().length === 0 && (
            <div style={{
              textAlign: 'center',
              padding: '60px',
              color: '#8b949e'
            }}>
              <div style={{ fontSize: '48px', marginBottom: '16px' }}>🔍</div>
              <p>没有找到匹配的代码片段</p>
            </div>
          )}
        </div>

        {/* 详情面板 */}
        {selectedSnippet && (
          <div style={{
            width: '500px',
            display: 'flex',
            flexDirection: 'column',
            background: '#161b22',
            borderRadius: '8px',
            border: '1px solid #30363d',
            overflow: 'hidden'
          }}>
            <div style={{
              padding: '12px 16px',
              borderBottom: '1px solid #30363d',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <span style={{ fontSize: '20px' }}>{getLanguageIcon(selectedSnippet.language)}</span>
                <span style={{ fontWeight: 600 }}>{selectedSnippet.title}</span>
              </div>
              
              <button
                onClick={() => setSelectedSnippet(null)}
                style={{
                  padding: '4px 8px',
                  background: 'transparent',
                  border: '1px solid #30363d',
                  borderRadius: '4px',
                  color: '#8b949e',
                  fontSize: '12px',
                  cursor: 'pointer'
                }}
              >
                ✕
              </button>
            </div>
            
            <div style={{ padding: '16px', flex: 1, overflow: 'auto' }}>
              <div style={{
                fontSize: '13px',
                color: '#8b949e',
                marginBottom: '16px',
                lineHeight: 1.6
              }}>
                {selectedSnippet.description}
              </div>
              
              <div style={{ display: 'flex', gap: '6px', marginBottom: '16px' }}>
                {selectedSnippet.tags.map(tag => (
                  <span
                    key={tag}
                    style={{
                      padding: '6px 12px',
                      background: '#388bfd26',
                      borderRadius: '20px',
                      fontSize: '12px',
                      color: '#58a6ff'
                    }}
                  >
                    {tag}
                  </span>
                ))}
              </div>
              
              <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                marginBottom: '16px',
                fontSize: '12px',
                color: '#8b949e'
              }}>
                <span>作者: {selectedSnippet.author}</span>
                <span>{new Date(selectedSnippet.createdAt).toLocaleDateString('zh-CN')}</span>
              </div>
              
              {/* 代码区域 */}
              <div style={{
                background: '#0d1117',
                borderRadius: '8px',
                border: '1px solid #30363d',
                overflow: 'hidden'
              }}>
                <div style={{
                  padding: '8px 12px',
                  background: '#21262d',
                  borderBottom: '1px solid #30363d',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center'
                }}>
                  <span style={{ fontSize: '12px', color: '#8b949e' }}>
                    {selectedSnippet.language}
                  </span>
                  
                  <button
                    onClick={() => copyCode(selectedSnippet.code)}
                    style={{
                      padding: '4px 12px',
                      background: '#238636',
                      border: 'none',
                      borderRadius: '4px',
                      color: '#fff',
                      fontSize: '12px',
                      cursor: 'pointer'
                    }}
                  >
                    📋 复制代码
                  </button>
                </div>
                
                <pre style={{
                  margin: 0,
                  padding: '16px',
                  fontFamily: '"Fira Code", monospace',
                  fontSize: '13px',
                  lineHeight: 1.6,
                  color: '#7ee787',
                  overflow: 'auto',
                  maxHeight: '400px'
                }}>
                  {selectedSnippet.code}
                </pre>
              </div>
              
              {/* 操作按钮 */}
              <div style={{
                marginTop: '16px',
                display: 'flex',
                gap: '12px'
              }}>
                <button
                  onClick={() => likeSnippet(selectedSnippet.id)}
                  style={{
                    flex: 1,
                    padding: '12px',
                    background: '#21262d',
                    border: '1px solid #30363d',
                    borderRadius: '6px',
                    color: '#f85149',
                    fontSize: '13px',
                    fontWeight: 500,
                    cursor: 'pointer'
                  }}
                >
                  ❤ 点赞 ({selectedSnippet.likes})
                </button>
                
                <button
                  onClick={() => setSnippets(prev => prev.map(s =>
                    s.id === selectedSnippet.id ? { ...s, views: s.views + 1 } : s
                  ))}
                  style={{
                    flex: 1,
                    padding: '12px',
                    background: '#21262d',
                    border: '1px solid #30363d',
                    borderRadius: '6px',
                    color: '#c9d1d9',
                    fontSize: '13px',
                    cursor: 'pointer'
                  }}
                >
                  👁 查看 ({selectedSnippet.views})
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* 创建片段模态框 */}
      {showCreateModal && (
        <div style={{
          position: 'fixed',
          inset: 0,
          background: 'rgba(0,0,0,0.8)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 9999
        }}>
          <div style={{
            width: '600px',
            maxHeight: '80vh',
            background: '#161b22',
            borderRadius: '12px',
            border: '1px solid #30363d',
            overflow: 'auto'
          }}>
            <div style={{
              padding: '16px 20px',
              borderBottom: '1px solid #30363d',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center'
            }}>
              <h2 style={{ margin: 0, fontSize: '18px' }}>✨ 分享代码片段</h2>
              <button
                onClick={() => setShowCreateModal(false)}
                style={{
                  padding: '6px 12px',
                  background: 'transparent',
                  border: '1px solid #30363d',
                  borderRadius: '6px',
                  color: '#c9d1d9',
                  cursor: 'pointer'
                }}
              >
                ✕
              </button>
            </div>
            
            <div style={{ padding: '20px' }}>
              <div style={{ marginBottom: '16px' }}>
                <label style={{ fontSize: '12px', color: '#8b949e', marginBottom: '6px', display: 'block' }}>
                  片段标题 *
                </label>
                <input
                  type="text"
                  value={newSnippet.title}
                  onChange={(e) => setNewSnippet(prev => ({ ...prev, title: e.target.value }))}
                  placeholder="例如：数组去重的多种方法"
                  style={{
                    width: '100%',
                    padding: '10px 14px',
                    background: '#0d1117',
                    border: '1px solid #30363d',
                    borderRadius: '6px',
                    color: '#c9d1d9',
                    fontSize: '14px'
                  }}
                />
              </div>
              
              <div style={{ marginBottom: '16px' }}>
                <label style={{ fontSize: '12px', color: '#8b949e', marginBottom: '6px', display: 'block' }}>
                  编程语言 *
                </label>
                <select
                  value={newSnippet.language}
                  onChange={(e) => setNewSnippet(prev => ({ ...prev, language: e.target.value }))}
                  style={{
                    width: '100%',
                    padding: '10px 14px',
                    background: '#0d1117',
                    border: '1px solid #30363d',
                    borderRadius: '6px',
                    color: '#c9d1d9',
                    fontSize: '14px'
                  }}
                >
                  {LANGUAGE_OPTIONS.map(lang => (
                    <option key={lang} value={lang}>{lang}</option>
                  ))}
                </select>
              </div>
              
              <div style={{ marginBottom: '16px' }}>
                <label style={{ fontSize: '12px', color: '#8b949e', marginBottom: '6px', display: 'block' }}>
                  代码内容 *
                </label>
                <textarea
                  value={newSnippet.code}
                  onChange={(e) => setNewSnippet(prev => ({ ...prev, code: e.target.value }))}
                  placeholder="// 在此编写你的代码..."
                  style={{
                    width: '100%',
                    minHeight: '200px',
                    padding: '14px',
                    background: '#0d1117',
                    border: '1px solid #30363d',
                    borderRadius: '6px',
                    color: '#7ee787',
                    fontFamily: '"Fira Code", monospace',
                    fontSize: '14px',
                    lineHeight: 1.6,
                    resize: 'vertical'
                  }}
                />
              </div>
              
              <div style={{ marginBottom: '16px' }}>
                <label style={{ fontSize: '12px', color: '#8b949e', marginBottom: '6px', display: 'block' }}>
                  描述说明
                </label>
                <textarea
                  value={newSnippet.description}
                  onChange={(e) => setNewSnippet(prev => ({ ...prev, description: e.target.value }))}
                  placeholder="简要描述代码的功能和用法..."
                  style={{
                    width: '100%',
                    minHeight: '80px',
                    padding: '14px',
                    background: '#0d1117',
                    border: '1px solid #30363d',
                    borderRadius: '6px',
                    color: '#c9d1d9',
                    fontSize: '14px',
                    resize: 'vertical'
                  }}
                />
              </div>
              
              <div style={{ marginBottom: '20px' }}>
                <label style={{ fontSize: '12px', color: '#8b949e', marginBottom: '6px', display: 'block' }}>
                  标签 (选择最多3个)
                </label>
                <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                  {TAG_OPTIONS.map(tag => (
                    <span
                      key={tag}
                      onClick={() => {
                        if (newSnippet.tags.includes(tag)) {
                          setNewSnippet(prev => ({ ...prev, tags: prev.tags.filter(t => t !== tag) }))
                        } else if (newSnippet.tags.length < 3) {
                          setNewSnippet(prev => ({ ...prev, tags: [...prev.tags, tag] }))
                        }
                      }}
                      style={{
                        padding: '6px 12px',
                        background: newSnippet.tags.includes(tag) ? '#388bfd26' : '#21262d',
                        border: '1px solid #30363d',
                        borderRadius: '20px',
                        fontSize: '12px',
                        color: newSnippet.tags.includes(tag) ? '#58a6ff' : '#8b949e',
                        cursor: newSnippet.tags.length >= 3 && !newSnippet.tags.includes(tag) ? 'not-allowed' : 'pointer',
                        opacity: newSnippet.tags.length >= 3 && !newSnippet.tags.includes(tag) ? 0.5 : 1
                      }}
                    >
                      {tag}
                    </span>
                  ))}
                </div>
              </div>
              
              <div style={{ display: 'flex', gap: '12px' }}>
                <button
                  onClick={createSnippet}
                  disabled={!newSnippet.title || !newSnippet.code}
                  style={{
                    flex: 1,
                    padding: '12px',
                    background: (!newSnippet.title || !newSnippet.code) ? '#21262d' : '#238636',
                    border: 'none',
                    borderRadius: '6px',
                    color: '#fff',
                    fontSize: '14px',
                    fontWeight: 500,
                    cursor: (!newSnippet.title || !newSnippet.code) ? 'not-allowed' : 'pointer'
                  }}
                >
                  🚀 发布片段
                </button>
                
                <button
                  onClick={() => setShowCreateModal(false)}
                  style={{
                    padding: '12px 24px',
                    background: 'transparent',
                    border: '1px solid #30363d',
                    borderRadius: '6px',
                    color: '#c9d1d9',
                    fontSize: '14px',
                    cursor: 'pointer'
                  }}
                >
                  取消
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
})

export default CodeSnippetHub