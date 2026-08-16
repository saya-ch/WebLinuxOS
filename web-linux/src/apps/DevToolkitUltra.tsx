import { useState, useEffect, useCallback } from 'react'
import { useStore } from '../store'

interface Snippet {
  id: string
  title: string
  language: string
  code: string
  description: string
  tags: string[]
  favorite: boolean
  createdAt: number
  updatedAt: number
}

const STORAGE_KEY = 'weblinux-devtoolkit-ultra-snippets'
const SNIPPETS_PER_PAGE = 12

const LANGUAGES = [
  'JavaScript', 'TypeScript', 'Python', 'HTML', 'CSS', 'React',
  'Node.js', 'Bash', 'SQL', 'JSON', 'Markdown', 'Go', 'Rust', 'Java', 'C++'
]

const PRESET_TEMPLATES: any = {
  JavaScript: [
    { title: '防抖函数', language: 'JavaScript', description: '通用防抖实现', code: `function debounce(fn, delay = 300) {
  let timer = null;
  return function (...args) {
    if (timer) clearTimeout(timer);
    timer = setTimeout(() => fn.apply(this, args), delay);
  };
}` },
    { title: '节流函数', language: 'JavaScript', description: '通用节流实现', code: `function throttle(fn, limit = 300) {
  let inThrottle = false;
  return function (...args) {
    if (!inThrottle) {
      fn.apply(this, args);
      inThrottle = true;
      setTimeout(() => inThrottle = false, limit);
    }
  };
}` },
    { title: '深拷贝', language: 'JavaScript', description: '递归深拷贝实现', code: `function deepClone(obj) {
  if (obj === null || typeof obj !== 'object') return obj;
  if (obj instanceof Date) return new Date(obj);
  if (obj instanceof Array) return obj.map(item => deepClone(item));
  if (obj instanceof Object) {
    const copy = {};
    for (const key in obj) {
      if (obj.hasOwnProperty(key)) {
        copy[key] = deepClone(obj[key]);
      }
    }
    return copy;
  }
}` },
  ],
  Python: [
    { title: '装饰器模板', language: 'Python', description: '通用装饰器模式', code: `import functools
import time

def timer(func):
    @functools.wraps(func)
    def wrapper(*args, **kwargs):
        start = time.time()
        result = func(*args, **kwargs)
        elapsed = time.time() - start
        print(f'{func.__name__} 耗时: {elapsed:.4f}s')
        return result
    return wrapper` },
    { title: '上下文管理器', language: 'Python', description: '自定义上下文管理器', code: `class DatabaseConnection:
    def __init__(self, host, port=5432):
        self.host = host
        self.port = port
    
    def __enter__(self):
        self.connection = self._connect()
        return self.connection
    
    def __exit__(self, exc_type, exc_val, exc_tb):
        if self.connection:
            self.connection.close()
        return False` },
  ],
  TypeScript: [
    { title: '类型安全事件总线', language: 'TypeScript', description: '泛型事件系统', code: `type EventMap = Record<string, unknown>;

class EventBus<T extends EventMap> {
  private listeners = new Map<keyof T, Set<(data: T[keyof T]) => void>>();

  on<K extends keyof T>(event: K, callback: (data: T[K]) => void) {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, new Set());
    }
    this.listeners.get(event)!.add(callback as any);
    return () => this.off(event, callback);
  }

  off<K extends keyof T>(event: K, callback: (data: T[K]) => void) {
    this.listeners.get(event)?.delete(callback as any);
  }

  emit<K extends keyof T>(event: K, data: T[K]) {
    this.listeners.get(event)?.forEach(cb => cb(data));
  }
}` },
  ],
  Bash: [
    { title: '进度条', language: 'Bash', description: 'Shell进度条实现', code: `#!/bin/bash
progress_bar() {
  local duration=50
  local bar_width=40
  for ((i=0; i<=duration; i++)); do
    sleep 0.1
    local pct=$((i * 100 / duration))
    local filled=$((pct * bar_width / 100))
    local empty=$((bar_width - filled))
    local bar=$(printf '%0.s#' $(seq 1 $filled))$(printf '%0.s-' $(seq 1 $empty))
    printf "\\r[%-*s] %d%%" "$bar_width" "$bar" "$pct"
  done
  echo
}` },
  ],
}

export default function DevToolkitUltra() {
  const addNotification = useStore((s) => s.addNotification)
  const [snippets, setSnippets] = useState<Snippet[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY)
      return saved ? JSON.parse(saved) : []
    } catch { return [] }
  })
  const [searchQuery, setSearchQuery] = useState('')
  const [filterLanguage, setFilterLanguage] = useState<string>('all')
  const [editingSnippet, setEditingSnippet] = useState<Snippet | null>(null)
  const [showTemplates, setShowTemplates] = useState(false)
  const [activeTab, setActiveTab] = useState<'snippets' | 'templates' | 'generator' | 'formatter'>('snippets')
  const [currentPage, setCurrentPage] = useState(1)
  
  // Generator state
  const [genType, setGenType] = useState<'uuid' | 'nanoid' | 'cuid'>('uuid')
  const [genLength, setGenLength] = useState(21)
  const [genResult, setGenResult] = useState('')
  
  // Formatter state
  const [formatInput, setFormatInput] = useState('')
  const [formatOutput, setFormatOutput] = useState('')
  const [formatType, setFormatType] = useState<'json' | 'sql' | 'html' | 'css'>('json')

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(snippets))
  }, [snippets])

  const copyToClipboard = useCallback((text: string) => {
    try {
      navigator.clipboard.writeText(text)
      addNotification({ title: '已复制', message: '内容已复制到剪贴板', type: 'success' })
    } catch {
      addNotification({ title: '失败', message: '复制失败', type: 'error' })
    }
  }, [addNotification])

  const filteredSnippets = useCallback(() => {
    return snippets.filter(s => {
      const matchesSearch = !searchQuery || 
        s.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        s.code.toLowerCase().includes(searchQuery.toLowerCase()) ||
        s.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
        s.tags.some(t => t.toLowerCase().includes(searchQuery.toLowerCase()))
      const matchesLanguage = filterLanguage === 'all' || s.language === filterLanguage
      return matchesSearch && matchesLanguage
    })
  }, [snippets, searchQuery, filterLanguage])

  const paginatedSnippets = useCallback(() => {
    const filtered = filteredSnippets()
    const start = (currentPage - 1) * SNIPPETS_PER_PAGE
    return filtered.slice(start, start + SNIPPETS_PER_PAGE)
  }, [filteredSnippets, currentPage])

  const totalPages = Math.ceil(filteredSnippets().length / SNIPPETS_PER_PAGE) || 1

  const saveSnippet = (data: Omit<Snippet, 'id' | 'createdAt' | 'updatedAt'>) => {
    const now = Date.now()
    if (editingSnippet) {
      setSnippets(prev => prev.map(s => s.id === editingSnippet.id 
        ? { ...s, ...data, updatedAt: now } 
        : s))
      addNotification({ title: '已更新', message: '代码片段已更新', type: 'success' })
    } else {
      const newSnippet: Snippet = {
        ...data,
        id: `snippet-${now}-${Math.random().toString(36).slice(2, 8)}`,
        createdAt: now,
        updatedAt: now,
      }
      setSnippets(prev => [newSnippet, ...prev])
      addNotification({ title: '已创建', message: '新代码片段已保存', type: 'success' })
    }
    setEditingSnippet(null)
  }

  const deleteSnippet = (id: string) => {
    if (!confirm('确定删除此代码片段？')) return
    setSnippets(prev => prev.filter(s => s.id !== id))
    addNotification({ title: '已删除', message: '代码片段已删除', type: 'info' })
  }

  const toggleFavorite = (id: string) => {
    setSnippets(prev => prev.map(s => s.id === id 
      ? { ...s, favorite: !s.favorite } 
      : s))
  }

  const generateId = () => {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789'
    let result = ''
    const length = genType === 'uuid' ? 36 : genLength
    
    if (genType === 'uuid') {
      const bytes = new Uint8Array(16)
      crypto.getRandomValues(bytes)
      bytes[6] = (bytes[6] & 0x0f) | 0x40
      bytes[8] = (bytes[8] & 0x3f) | 0x80
      const hex = Array.from(bytes).map(b => b.toString(16).padStart(2, '0')).join('')
      result = `${hex.slice(0,8)}-${hex.slice(8,12)}-${hex.slice(12,16)}-${hex.slice(16,20)}-${hex.slice(20)}`
    } else {
      for (let i = 0; i < length; i++) {
        result += chars[Math.floor(Math.random() * chars.length)]
      }
      if (genType === 'cuid') {
        result = `cuid${Date.now().toString(36)}${result}`
      }
    }
    setGenResult(result)
    copyToClipboard(result)
  }

  const formatCode = () => {
    try {
      if (formatType === 'json') {
        const parsed = JSON.parse(formatInput)
        setFormatOutput(JSON.stringify(parsed, null, 2))
      } else if (formatType === 'sql') {
        setFormatOutput(formatInput
          .replace(/\s+/g, ' ')
          .replace(/\s*(SELECT|FROM|WHERE|AND|OR|INSERT|INTO|VALUES|UPDATE|SET|DELETE|JOIN|LEFT|RIGHT|INNER|OUTER|ON|GROUP BY|ORDER BY|HAVING|LIMIT|OFFSET)\s+/gi, '\n$1 ')
          .replace(/\s*(\()\s*/g, '$1')
          .replace(/\s*(\))\s*/g, '$1')
          .trim())
      } else if (formatType === 'html') {
        const formatted = formatInput
          .replace(/>\s*</g, '>\n<')
          .replace(/(<[^>]+>)/g, '\n$1')
          .replace(/\n+/g, '\n')
          .trim()
        setFormatOutput(formatted)
      } else if (formatType === 'css') {
        const formatted = formatInput
          .replace(/\s*\{\s*/g, ' {\n  ')
          .replace(/;\s*/g, ';\n  ')
          .replace(/\s*\}\s*/g, '\n}\n')
          .replace(/\n+/g, '\n')
          .replace(/\s+:\s+/g, ': ')
          .trim()
        setFormatOutput(formatted)
      }
      addNotification({ title: '格式化成功', message: '代码已格式化', type: 'success' })
    } catch (e) {
      addNotification({ title: '格式化失败', message: String(e), type: 'error' })
    }
  }

  const loadTemplate = (template: typeof PRESET_TEMPLATES[string][0]) => {
    setEditingSnippet(null)
    saveSnippet({
      title: template.title,
      language: template.language,
      code: template.code,
      description: template.description,
      tags: ['template', template.language.toLowerCase()],
      favorite: false,
    })
    setActiveTab('snippets')
    addNotification({ title: '模板已加载', message: `${template.title} 已保存到代码库`, type: 'success' })
  }

  const exportSnippets = () => {
    const dataStr = JSON.stringify(snippets, null, 2)
    const blob = new Blob([dataStr], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `devtoolkit-snippets-${Date.now()}.json`
    a.click()
    URL.revokeObjectURL(url)
    addNotification({ title: '导出成功', message: '所有代码片段已导出', type: 'success' })
  }

  const importSnippets = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = (event) => {
      try {
        const imported = JSON.parse(event.target?.result as string)
        if (Array.isArray(imported)) {
          setSnippets(prev => [...imported, ...prev])
          addNotification({ title: '导入成功', message: `导入 ${imported.length} 个代码片段`, type: 'success' })
        }
      } catch {
        addNotification({ title: '导入失败', message: '文件格式无效', type: 'error' })
      }
    }
    reader.readAsText(file)
  }

  const getLanguageBadgeColor = (lang: string) => {
    const colors: Record<string, string> = {
      JavaScript: '#f7df1e', TypeScript: '#3178c6', Python: '#3776ab',
      HTML: '#e34f26', CSS: '#2965f1', React: '#61dafb',
      'Node.js': '#339933', Bash: '#4eaa25', SQL: '#00758f',
      JSON: '#000000', Markdown: '#000000', Go: '#00add8',
      Rust: '#dea584', Java: '#f89820', 'C++': '#00599c'
    }
    return colors[lang] || '#666'
  }

  const styles: Record<string, any> = {
    container: {
      height: '100%', display: 'flex', flexDirection: 'column',
      background: 'var(--window-bg)', color: 'var(--text-primary)',
    },
    header: {
      padding: '14px 16px',
      borderBottom: '1px solid var(--window-border)',
      background: 'linear-gradient(135deg, var(--window-bg), var(--desktop-bg))',
      display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12, flexShrink: 0,
    },
    title: { fontSize: 15, fontWeight: 700, letterSpacing: '-0.01em' as const },
    subtitle: { fontSize: 11, color: 'var(--text-secondary)', marginTop: 2 },
    tabs: {
      display: 'flex', gap: 4, padding: '8px 12px',
      borderBottom: '1px solid var(--window-border)',
      background: 'rgba(0,0,0,0.1)', flexShrink: 0,
    },
    tab: (active: boolean) => ({
      padding: '6px 14px', fontSize: 12, fontWeight: 500,
      borderRadius: 6, cursor: 'pointer', border: 'none',
      background: active ? 'var(--accent)' : 'transparent',
      color: active ? '#fff' : 'var(--text-secondary)',
      transition: 'all 0.15s ease',
    }),
    toolbar: {
      padding: '10px 12px', display: 'flex', gap: 10, flexWrap: 'wrap',
      borderBottom: '1px solid var(--window-border)', flexShrink: 0,
    },
    searchInput: {
      flex: '1 1 200px', minWidth: 180, padding: '7px 12px',
      background: 'rgba(255,255,255,0.06)',
      border: '1px solid var(--window-border)', borderRadius: 8,
      color: 'var(--text-primary)', fontSize: 13, outline: 'none',
    },
    select: {
      padding: '7px 10px', background: 'rgba(255,255,255,0.06)',
      border: '1px solid var(--window-border)', borderRadius: 8,
      color: 'var(--text-primary)', fontSize: 12, outline: 'none',
    },
    btn: {
      padding: '7px 14px', background: 'var(--accent)', color: '#fff',
      border: 'none', borderRadius: 8, fontSize: 12, fontWeight: 600,
      cursor: 'pointer', transition: 'opacity 0.15s',
    },
    btnSecondary: {
      padding: '7px 14px', background: 'rgba(255,255,255,0.08)',
      color: 'var(--text-primary)', border: '1px solid var(--window-border)',
      borderRadius: 8, fontSize: 12, cursor: 'pointer',
    },
    content: {
      flex: 1, overflow: 'auto', padding: 16,
    },
    card: {
      background: 'rgba(255,255,255,0.04)',
      border: '1px solid var(--window-border)',
      borderRadius: 12, padding: 16, marginBottom: 12,
      transition: 'all 0.2s ease',
    },
    codeBlock: {
      background: 'rgba(0,0,0,0.35)',
      borderRadius: 8, padding: 12,
      fontFamily: 'JetBrains Mono, monospace', fontSize: 12,
      lineHeight: 1.6, overflow: 'auto', maxHeight: 250,
      whiteSpace: 'pre', color: '#e4e4e7',
    },
    badge: (color: string) => ({
      display: 'inline-block', padding: '2px 8px', borderRadius: 4,
      fontSize: 10, fontWeight: 600, background: color, color: '#fff',
    }),
    input: {
      width: '100%', padding: '8px 12px',
      background: 'rgba(255,255,255,0.06)',
      border: '1px solid var(--window-border)', borderRadius: 8,
      color: 'var(--text-primary)', fontSize: 13, marginBottom: 10,
      fontFamily: 'inherit',
    },
    textarea: {
      width: '100%', padding: 12,
      background: 'rgba(0,0,0,0.3)',
      border: '1px solid var(--window-border)', borderRadius: 8,
      color: '#e4e4e7', fontSize: 12,
      fontFamily: 'JetBrains Mono, monospace',
      minHeight: 120, resize: 'vertical' as const, outline: 'none',
    },
    empty: {
      textAlign: 'center', padding: '40px 20px',
      color: 'var(--text-secondary)', fontSize: 13,
    },
  }

  return (
    <div style={styles.container}>
      <div style={styles.header}>
        <div>
          <div style={styles.title}>DevToolkit Ultra</div>
          <div style={styles.subtitle}>开发者代码片段管理 + ID 生成 + 代码格式化</div>
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          <button style={styles.btnSecondary} onClick={() => setShowTemplates(!showTemplates)}>
            📚 模板库
          </button>
          <button style={styles.btnSecondary} onClick={exportSnippets}>
            📤 导出
          </button>
          <label style={{ ...styles.btnSecondary, cursor: 'pointer' }}>
            📥 导入
            <input type="file" accept=".json" style={{ display: 'none' }} onChange={importSnippets} />
          </label>
        </div>
      </div>

      <div style={styles.tabs}>
        <button style={styles.tab(activeTab === 'snippets')} onClick={() => setActiveTab('snippets')}>
          📝 代码片段 ({snippets.length})
        </button>
        <button style={styles.tab(activeTab === 'generator')} onClick={() => setActiveTab('generator')}>
          🆔 ID 生成器
        </button>
        <button style={styles.tab(activeTab === 'formatter')} onClick={() => setActiveTab('formatter')}>
          ✨ 代码格式化
        </button>
        <button style={styles.tab(activeTab === 'templates')} onClick={() => setActiveTab('templates')}>
          📚 预设模板
        </button>
      </div>

      {activeTab === 'snippets' && (
        <>
          <div style={styles.toolbar}>
            <input
              style={styles.searchInput}
              placeholder="🔍 搜索代码片段..."
              value={searchQuery}
              onChange={e => { setSearchQuery(e.target.value); setCurrentPage(1) }}
            />
            <select style={styles.select} value={filterLanguage} onChange={e => { setFilterLanguage(e.target.value); setCurrentPage(1) }}>
              <option value="all">所有语言</option>
              {LANGUAGES.map(l => <option key={l} value={l}>{l}</option>)}
            </select>
            <button style={styles.btn} onClick={() => { setEditingSnippet(null); setShowTemplates(true) }}>+ 新建</button>
          </div>

          <div style={styles.content}>
            {paginatedSnippets().length === 0 ? (
              <div style={styles.empty}>
                <div style={{ fontSize: 48, marginBottom: 12 }}>📭</div>
                <div>暂无代码片段，点击"新建"或"预设模板"开始</div>
              </div>
            ) : (
              <>
                {paginatedSnippets().map(snippet => (
                  <div key={snippet.id} style={styles.card}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 8 }}>
                      <div style={{ flex: 1 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                          <h3 style={{ fontSize: 14, fontWeight: 600 }}>{snippet.title}</h3>
                          <span style={styles.badge(getLanguageBadgeColor(snippet.language))}>{snippet.language}</span>
                          {snippet.favorite && <span style={{ fontSize: 14 }}>⭐</span>}
                        </div>
                        <p style={{ fontSize: 12, color: 'var(--text-secondary)', margin: 0 }}>{snippet.description}</p>
                      </div>
                      <div style={{ display: 'flex', gap: 4 }}>
                        <button style={{ ...styles.btnSecondary, padding: '4px 8px', fontSize: 11 }} onClick={() => toggleFavorite(snippet.id)}>
                          {snippet.favorite ? '⭐' : '☆'}
                        </button>
                        <button style={{ ...styles.btnSecondary, padding: '4px 8px', fontSize: 11 }} onClick={() => copyToClipboard(snippet.code)}>
                          📋
                        </button>
                        <button style={{ ...styles.btnSecondary, padding: '4px 8px', fontSize: 11 }} onClick={() => { setEditingSnippet(snippet); setShowTemplates(true) }}>
                          ✏️
                        </button>
                        <button style={{ ...styles.btnSecondary, padding: '4px 8px', fontSize: 11 }} onClick={() => deleteSnippet(snippet.id)}>
                          🗑️
                        </button>
                      </div>
                    </div>
                    <pre style={styles.codeBlock}>{snippet.code}</pre>
                    <div style={{ display: 'flex', gap: 6, marginTop: 8, flexWrap: 'wrap' }}>
                      {snippet.tags.map((tag, i) => (
                        <span key={i} style={{
                          padding: '2px 8px', fontSize: 10, borderRadius: 10,
                          background: 'rgba(127,127,127,0.2)', color: 'var(--text-secondary)',
                        }}>#{tag}</span>
                      ))}
                    </div>
                  </div>
                ))}
                
                {totalPages > 1 && (
                  <div style={{ display: 'flex', justifyContent: 'center', gap: 8, marginTop: 16 }}>
                    {Array.from({ length: totalPages }, (_, i) => i + 1).map(page => (
                      <button key={page} style={{
                        ...styles.btnSecondary,
                        padding: '4px 10px',
                        background: page === currentPage ? 'var(--accent)' : undefined,
                        color: page === currentPage ? '#fff' : undefined,
                      }} onClick={() => setCurrentPage(page)}>{page}</button>
                    ))}
                  </div>
                )}
              </>
            )}
          </div>
        </>
      )}

      {activeTab === 'generator' && (
        <div style={styles.content}>
          <div style={styles.card}>
            <h3 style={{ fontSize: 14, marginBottom: 12 }}>🆔 ID 生成器</h3>
            <div style={{ display: 'flex', gap: 12, marginBottom: 16, flexWrap: 'wrap' }}>
              <label style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12 }}>
                类型:
                <select style={styles.select} value={genType} onChange={e => setGenType(e.target.value as any)}>
                  <option value="uuid">UUID v4</option>
                  <option value="nanoid">NanoID</option>
                  <option value="cuid">CUID</option>
                </select>
              </label>
              {genType !== 'uuid' && (
                <label style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12 }}>
                  长度:
                  <input type="number" min={5} max={100} value={genLength}
                    onChange={e => setGenLength(parseInt(e.target.value) || 21)}
                    style={{ ...styles.input, width: 60, marginBottom: 0 }}
                  />
                </label>
              )}
              <button style={styles.btn} onClick={generateId}>🎲 生成</button>
            </div>
            {genResult && (
              <div style={{ marginTop: 12 }}>
                <div style={{ fontSize: 11, color: 'var(--text-secondary)', marginBottom: 6 }}>生成结果：</div>
                <div style={{ display: 'flex', gap: 8 }}>
                  <code style={{ ...styles.codeBlock, flex: 1 }}>{genResult}</code>
                  <button style={styles.btnSecondary} onClick={() => copyToClipboard(genResult)}>📋</button>
                </div>
              </div>
            )}
          </div>

          <div style={styles.card}>
            <h3 style={{ fontSize: 14, marginBottom: 12 }}>🔢 批量生成</h3>
            <p style={{ fontSize: 12, color: 'var(--text-secondary)', marginBottom: 12 }}>
              点击下方按钮一次性生成 10 个 ID
            </p>
            <button style={styles.btn} onClick={() => {
              const ids = Array.from({ length: 10 }, () => {
                const bytes = new Uint8Array(16)
                crypto.getRandomValues(bytes)
                bytes[6] = (bytes[6] & 0x0f) | 0x40
                bytes[8] = (bytes[8] & 0x3f) | 0x80
                const hex = Array.from(bytes).map(b => b.toString(16).padStart(2, '0')).join('')
                return `${hex.slice(0,8)}-${hex.slice(8,12)}-${hex.slice(12,16)}-${hex.slice(16,20)}-${hex.slice(20)}`
              })
              setGenResult(ids.join('\n'))
              addNotification({ title: '批量生成', message: '已生成 10 个 UUID', type: 'success' })
            }}>📊 生成 10 个 UUID</button>
          </div>
        </div>
      )}

      {activeTab === 'formatter' && (
        <div style={styles.content}>
          <div style={styles.card}>
            <div style={{ display: 'flex', gap: 10, marginBottom: 12, flexWrap: 'wrap' }}>
              <select style={styles.select} value={formatType} onChange={e => setFormatType(e.target.value as any)}>
                <option value="json">JSON</option>
                <option value="sql">SQL</option>
                <option value="html">HTML</option>
                <option value="css">CSS</option>
              </select>
              <button style={styles.btn} onClick={formatCode}>✨ 格式化</button>
              <button style={styles.btnSecondary} onClick={() => { setFormatInput(''); setFormatOutput('') }}>🗑️ 清空</button>
              <button style={styles.btnSecondary} onClick={() => copyToClipboard(formatOutput)}>📋 复制结果</button>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
              <div>
                <div style={{ fontSize: 11, color: 'var(--text-secondary)', marginBottom: 4 }}>输入：</div>
                <textarea style={styles.textarea} placeholder={`在此粘贴 ${formatType.toUpperCase()} 代码...`} value={formatInput} onChange={e => setFormatInput(e.target.value)} />
              </div>
              <div>
                <div style={{ fontSize: 11, color: 'var(--text-secondary)', marginBottom: 4 }}>格式化输出：</div>
                <pre style={{ ...styles.codeBlock, minHeight: 160 }}>{formatOutput || '// 格式化结果将在此显示'}</pre>
              </div>
            </div>
          </div>
        </div>
      )}

      {activeTab === 'templates' && (
        <div style={styles.content}>
          {(Object.entries(PRESET_TEMPLATES) as [string, any[]][]).map(([lang, templates]) => (
            <div key={lang} style={{ marginBottom: 20 }}>
              <h3 style={{ fontSize: 14, marginBottom: 10, color: getLanguageBadgeColor(lang) }}>{lang}</h3>
              {templates.map((tpl: any, idx: number) => (
                <div key={idx} style={{ ...styles.card, marginBottom: 8 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                    <div>
                      <strong style={{ fontSize: 13 }}>{tpl.title}</strong>
                      <span style={{ ...styles.badge(getLanguageBadgeColor(tpl.language)), marginLeft: 8 }}>{tpl.language}</span>
                    </div>
                    <button style={styles.btn} onClick={() => loadTemplate(tpl)}>📥 加载</button>
                  </div>
                  <p style={{ fontSize: 12, color: 'var(--text-secondary)', marginBottom: 8 }}>{tpl.description}</p>
                  <pre style={styles.codeBlock}>{tpl.code}</pre>
                </div>
              ))}
            </div>
          ))}
        </div>
      )}

      {showTemplates && editingSnippet !== null && activeTab === 'snippets' && (
        <div style={{
          position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          zIndex: 100, padding: 20,
        }} onClick={() => { setShowTemplates(false); setEditingSnippet(null) }}>
          <div style={{
            background: 'var(--window-bg)', border: '1px solid var(--window-border)',
            borderRadius: 12, padding: 20, maxWidth: 600, width: '100%',
            maxHeight: '80vh', overflow: 'auto',
          }} onClick={e => e.stopPropagation()}>
            <h3 style={{ marginBottom: 16 }}>{editingSnippet ? '编辑代码片段' : '新建代码片段'}</h3>
            <input style={styles.input} placeholder="标题"
              value={editingSnippet?.title || ''}
              onChange={e => setEditingSnippet(prev => prev ? { ...prev, title: e.target.value } : { id: '', title: e.target.value, language: 'JavaScript', code: '', description: '', tags: [], favorite: false, createdAt: Date.now(), updatedAt: Date.now() })}
            />
            <select style={{ ...styles.input, marginBottom: 10 }}
              value={editingSnippet?.language || 'JavaScript'}
              onChange={e => setEditingSnippet(prev => prev ? { ...prev, language: e.target.value } : { id: '', title: '', language: e.target.value, code: '', description: '', tags: [], favorite: false, createdAt: Date.now(), updatedAt: Date.now() })}
            >
              {LANGUAGES.map(l => <option key={l} value={l}>{l}</option>)}
            </select>
            <input style={styles.input} placeholder="描述（可选）"
              value={editingSnippet?.description || ''}
              onChange={e => setEditingSnippet(prev => prev ? { ...prev, description: e.target.value } : { id: '', title: '', language: 'JavaScript', code: '', description: e.target.value, tags: [], favorite: false, createdAt: Date.now(), updatedAt: Date.now() })}
            />
            <input style={styles.input} placeholder="标签（用逗号分隔）"
              value={editingSnippet?.tags?.join(',') || ''}
              onChange={e => setEditingSnippet(prev => prev ? { ...prev, tags: e.target.value.split(',').map(t => t.trim()).filter(Boolean) } : { id: '', title: '', language: 'JavaScript', code: '', description: '', tags: e.target.value.split(',').map(t => t.trim()).filter(Boolean), favorite: false, createdAt: Date.now(), updatedAt: Date.now() })}
            />
            <textarea style={{ ...styles.textarea, minHeight: 150 }} placeholder="在此输入代码..."
              value={editingSnippet?.code || ''}
              onChange={e => setEditingSnippet(prev => prev ? { ...prev, code: e.target.value } : { id: '', title: '', language: 'JavaScript', code: e.target.value, description: '', tags: [], favorite: false, createdAt: Date.now(), updatedAt: Date.now() })}
            />
            <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
              <button style={styles.btnSecondary} onClick={() => { setShowTemplates(false); setEditingSnippet(null) }}>取消</button>
              <button style={styles.btn} onClick={() => {
                if (editingSnippet && editingSnippet.title && editingSnippet.code) {
                  saveSnippet({
                    title: editingSnippet.title,
                    language: editingSnippet.language,
                    code: editingSnippet.code,
                    description: editingSnippet.description || '',
                    tags: editingSnippet.tags || [],
                    favorite: editingSnippet.favorite || false,
                  })
                  setShowTemplates(false)
                }
              }}>保存</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}