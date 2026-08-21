import { useState, useEffect, useCallback, useMemo } from 'react'

interface Snippet {
  id: string
  title: string
  language: string
  code: string
  description: string
  tags: string[]
  createdAt: number
  updatedAt: number
  favorites: number
}

const LANGUAGES = [
  { value: 'javascript', label: 'JavaScript', icon: '🟨' },
  { value: 'typescript', label: 'TypeScript', icon: '🔵' },
  { value: 'python', label: 'Python', icon: '🐍' },
  { value: 'html', label: 'HTML', icon: '📄' },
  { value: 'css', label: 'CSS', icon: '🎨' },
  { value: 'json', label: 'JSON', icon: '📋' },
  { value: 'bash', label: 'Bash', icon: '💻' },
  { value: 'sql', label: 'SQL', icon: '🗃' },
  { value: 'rust', label: 'Rust', icon: '🦀' },
  { value: 'go', label: 'Go', icon: '🐹' },
]

const PRESET_SNIPPETS: Omit<Snippet, 'id' | 'createdAt' | 'updatedAt' | 'favorites'>[] = [
  {
    title: '防抖函数',
    language: 'javascript',
    code: `function debounce(fn, delay = 300) {
  let timer = null;
  return function (...args) {
    clearTimeout(timer);
    timer = setTimeout(() => fn.apply(this, args), delay);
  };
}`,
    description: '通用防抖函数，适用于搜索输入、窗口resize等场景',
    tags: ['工具', '性能优化'],
  },
  {
    title: '节流函数',
    language: 'javascript',
    code: `function throttle(fn, interval = 300) {
  let lastTime = 0;
  return function (...args) {
    const now = Date.now();
    if (now - lastTime >= interval) {
      fn.apply(this, args);
      lastTime = now;
    }
  };
}`,
    description: '通用节流函数，适用于滚动事件、拖拽等高频场景',
    tags: ['工具', '性能优化'],
  },
  {
    title: '深拷贝',
    language: 'javascript',
    code: `function deepClone(obj) {
  if (obj === null || typeof obj !== 'object') return obj;
  if (obj instanceof Date) return new Date(obj);
  if (obj instanceof Array) return obj.map(item => deepClone(item));
  if (obj instanceof Object) {
    const copy = {};
    Object.keys(obj).forEach(key => {
      copy[key] = deepClone(obj[key]);
    });
    return copy;
  }
}`,
    description: '递归实现深拷贝，支持Date、Array、Object等类型',
    tags: ['工具', '数据处理'],
  },
  {
    title: 'Pipeline 管道模式',
    language: 'javascript',
    code: `const pipe = (...fns) => (value) => fns.reduce((acc, fn) => fn(acc), value);

const add = (x) => x + 2;
const multiply = (x) => x * 3;
const toString = (x) => String(x);

const transform = pipe(add, multiply, toString);
console.log(transform(5)); // "21"`,
    description: '函数式编程管道模式，优雅组合多个函数操作',
    tags: ['函数式编程', '设计模式'],
  },
  {
    title: 'React Hook 防抖',
    language: 'typescript',
    code: `import { useState, useEffect } from 'react';

function useDebounce<T>(value: T, delay: number = 500): T {
  const [debounced, setDebounced] = useState<T>(value);

  useEffect(() => {
    const timer = setTimeout(() => setDebounced(value), delay);
    return () => clearTimeout(timer);
  }, [value, delay]);

  return debounced;
}`,
    description: 'React Hook版本的防抖实现，适用于搜索框等场景',
    tags: ['React', 'Hooks'],
  },
  {
    title: 'Python 装饰器',
    language: 'python',
    code: `import functools
import time

def timer(func):
    @functools.wraps(func)
    def wrapper(*args, **kwargs):
        start = time.time()
        result = func(*args, **kwargs)
        elapsed = time.time() - start
        print(f"{func.__name__} 执行耗时: {elapsed:.4f}秒")
        return result
    return wrapper

@timer
def slow_function():
    time.sleep(1)
    return "完成"`,
    description: '通用计时装饰器，测量函数执行时间',
    tags: ['Python', '装饰器'],
  },
]

const STORAGE_KEY = 'weblinux-snippets-v1'

export default function SnippetForge() {
  const [snippets, setSnippets] = useState<Snippet[]>([])
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedLanguage, setSelectedLanguage] = useState('all')
  const [selectedTags, setSelectedTags] = useState<string[]>([])
  const [isEditing, setIsEditing] = useState(false)
  const [editingSnippet, setEditingSnippet] = useState<Snippet | null>(null)
  const [form, setForm] = useState({ title: '', language: 'javascript', code: '', description: '', tags: '' })
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid')

  useEffect(() => {
    const stored = localStorage.getItem(STORAGE_KEY)
    if (stored) {
      try {
        setSnippets(JSON.parse(stored))
      } catch {
        setSnippets([])
      }
    } else {
      const now = Date.now()
      const initial = PRESET_SNIPPETS.map((s, i) => ({
        ...s,
        id: `preset-${i}`,
        createdAt: now - (PRESET_SNIPPETS.length - i) * 1000000,
        updatedAt: now - (PRESET_SNIPPETS.length - i) * 1000000,
        favorites: 0,
      }))
      setSnippets(initial)
      localStorage.setItem(STORAGE_KEY, JSON.stringify(initial))
    }
  }, [])

  useEffect(() => {
    if (snippets.length > 0) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(snippets))
    }
  }, [snippets])

  const allTags = useCallback(() => {
    const tagSet = new Set<string>()
    snippets.forEach(s => s.tags.forEach(t => tagSet.add(t)))
    return Array.from(tagSet).sort()
  }, [snippets])

  const filteredSnippets = useMemo(() => {
    return snippets.filter(s => {
      if (searchQuery) {
        const q = searchQuery.toLowerCase()
        if (!s.title.toLowerCase().includes(q) &&
            !s.code.toLowerCase().includes(q) &&
            !s.description.toLowerCase().includes(q)) {
          return false
        }
      }
      if (selectedLanguage !== 'all' && s.language !== selectedLanguage) {
        return false
      }
      if (selectedTags.length > 0) {
        if (!selectedTags.some((tag: string) => s.tags.includes(tag))) {
          return false
        }
      }
      return true
    }).sort((a, b) => b.updatedAt - a.updatedAt)
  }, [snippets, searchQuery, selectedLanguage, selectedTags])

  const openNewSnippet = () => {
    setIsEditing(true)
    setEditingSnippet(null)
    setForm({ title: '', language: 'javascript', code: '', description: '', tags: '' })
  }

  const openEditSnippet = (snippet: Snippet) => {
    setIsEditing(true)
    setEditingSnippet(snippet)
    setForm({
      title: snippet.title,
      language: snippet.language,
      code: snippet.code,
      description: snippet.description,
      tags: snippet.tags.join(', '),
    })
  }

  const saveSnippet = () => {
    if (!form.title.trim() || !form.code.trim()) {
      alert('请填写标题和代码')
      return
    }
    const now = Date.now()
    const tags = form.tags.split(/[,，]/).map(t => t.trim()).filter(Boolean)

    if (editingSnippet) {
      setSnippets(prev => prev.map(s => s.id === editingSnippet.id ? {
        ...s,
        title: form.title,
        language: form.language,
        code: form.code,
        description: form.description,
        tags,
        updatedAt: now,
      } : s))
    } else {
      const newSnippet: Snippet = {
        id: `snippet-${now}`,
        title: form.title,
        language: form.language,
        code: form.code,
        description: form.description,
        tags,
        createdAt: now,
        updatedAt: now,
        favorites: 0,
      }
      setSnippets(prev => [newSnippet, ...prev])
    }
    setIsEditing(false)
    setEditingSnippet(null)
  }

  const deleteSnippet = (id: string) => {
    if (confirm('确定要删除这个代码片段吗？')) {
      setSnippets(prev => prev.filter(s => s.id !== id))
    }
  }

  const toggleFavorite = (id: string) => {
    setSnippets(prev => prev.map(s => s.id === id ? {
      ...s,
      favorites: s.favorites > 0 ? 0 : 1,
      updatedAt: Date.now(),
    } : s))
  }

  const copyToClipboard = (code: string) => {
    navigator.clipboard.writeText(code).then(() => {
      alert('已复制到剪贴板')
    })
  }

  const exportSnippets = () => {
    const data = JSON.stringify(snippets, null, 2)
    const blob = new Blob([data], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `snippets-export-${Date.now()}.json`
    a.click()
    URL.revokeObjectURL(url)
  }

  const importSnippets = () => {
    const input = document.createElement('input')
    input.type = 'file'
    input.accept = '.json'
    input.onchange = (e) => {
      const file = (e.target as HTMLInputElement).files?.[0]
      if (!file) return
      const reader = new FileReader()
      reader.onload = (evt) => {
        try {
          const data = JSON.parse(evt.target?.result as string)
          if (Array.isArray(data)) {
            setSnippets(prev => [...data, ...prev])
            alert(`成功导入 ${data.length} 个代码片段`)
          }
        } catch {
          alert('导入失败：文件格式不正确')
        }
      }
      reader.readAsText(file)
    }
    input.click()
  }

  return (
    <div style={styles.container}>
      <div style={styles.header}>
        <div style={styles.headerLeft}>
          <span style={styles.logo}>⚒️</span>
          <div>
            <h1 style={styles.title}>代码片段锻造炉</h1>
            <p style={styles.subtitle}>Snippet Forge · {snippets.length} 个片段 · 本地存储</p>
          </div>
        </div>
        <div style={styles.headerRight}>
          <button onClick={importSnippets} style={styles.secondaryBtn}>📥 导入</button>
          <button onClick={exportSnippets} style={styles.secondaryBtn}>📤 导出</button>
          <button onClick={openNewSnippet} style={styles.primaryBtn}>+ 新建片段</button>
        </div>
      </div>

      <div style={styles.toolbar}>
        <input
          type="text"
          placeholder="🔍 搜索代码片段..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          style={styles.searchInput}
        />
        <select
          value={selectedLanguage}
          onChange={(e) => setSelectedLanguage(e.target.value)}
          style={styles.select}
        >
          <option value="all">所有语言</option>
          {LANGUAGES.map(l => (
            <option key={l.value} value={l.value}>{l.icon} {l.label}</option>
          ))}
        </select>
        <div style={styles.tagFilter}>
          {allTags().map(tag => (
            <button
              key={tag}
              onClick={() => {
                setSelectedTags(prev =>
                  prev.includes(tag)
                    ? prev.filter(t => t !== tag)
                    : [...prev, tag]
                )
              }}
              style={{
                ...styles.tag,
                ...(selectedTags.includes(tag) ? styles.tagActive : {}),
              }}
            >
              {tag}
            </button>
          ))}
        </div>
        <div style={styles.viewToggle}>
          <button
            onClick={() => setViewMode('grid')}
            style={{ ...styles.viewBtn, ...(viewMode === 'grid' ? styles.viewBtnActive : {}) }}
          >▦</button>
          <button
            onClick={() => setViewMode('list')}
            style={{ ...styles.viewBtn, ...(viewMode === 'list' ? styles.viewBtnActive : {}) }}
          >☰</button>
        </div>
      </div>

      <div style={styles.content}>
        {filteredSnippets.length === 0 ? (
          <div style={styles.emptyState}>
            <span style={styles.emptyIcon}>📭</span>
            <p style={styles.emptyText}>没有找到匹配的代码片段</p>
            <button onClick={openNewSnippet} style={styles.primaryBtn}>创建第一个片段</button>
          </div>
        ) : (
          <div style={viewMode === 'grid' ? styles.grid : styles.list}>
            {filteredSnippets.map(snippet => (
              <div key={snippet.id} style={styles.card}>
                <div style={styles.cardHeader}>
                  <div style={styles.cardTitle}>{snippet.title}</div>
                  <div style={styles.cardActions}>
                    <button
                      onClick={() => toggleFavorite(snippet.id)}
                      style={{ ...styles.iconBtn, color: snippet.favorites > 0 ? '#fbbf24' : '#8b8b9e' }}
                      title="收藏"
                    >
                      {snippet.favorites > 0 ? '⭐' : '☆'}
                    </button>
                    <button
                      onClick={() => copyToClipboard(snippet.code)}
                      style={styles.iconBtn}
                      title="复制"
                    >📋</button>
                    <button
                      onClick={() => openEditSnippet(snippet)}
                      style={styles.iconBtn}
                      title="编辑"
                    >✏️</button>
                    <button
                      onClick={() => deleteSnippet(snippet.id)}
                      style={{ ...styles.iconBtn, color: '#ef4444' }}
                      title="删除"
                    >🗑</button>
                  </div>
                </div>
                <div style={styles.cardMeta}>
                  <span style={styles.badge}>{getLanguageIcon(snippet.language)} {getLanguageLabel(snippet.language)}</span>
                  <span style={styles.date}>{formatDate(snippet.updatedAt)}</span>
                </div>
                <pre style={styles.codePreview}>{snippet.code}</pre>
                {snippet.description && (
                  <p style={styles.description}>{snippet.description}</p>
                )}
                {snippet.tags.length > 0 && (
                  <div style={styles.cardTags}>
                    {snippet.tags.map(tag => (
                      <span key={tag} style={styles.smallTag}>{tag}</span>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {isEditing && (
        <div style={styles.modalOverlay} onClick={() => setIsEditing(false)}>
          <div style={styles.modal} onClick={(e) => e.stopPropagation()}>
            <div style={styles.modalHeader}>
              <h2 style={styles.modalTitle}>{editingSnippet ? '编辑片段' : '新建片段'}</h2>
              <button onClick={() => setIsEditing(false)} style={styles.closeBtn}>✕</button>
            </div>
            <div style={styles.modalBody}>
              <input
                type="text"
                placeholder="片段标题"
                value={form.title}
                onChange={(e) => setForm(prev => ({ ...prev, title: e.target.value }))}
                style={styles.input}
              />
              <select
                value={form.language}
                onChange={(e) => setForm(prev => ({ ...prev, language: e.target.value }))}
                style={styles.select}
              >
                {LANGUAGES.map(l => (
                  <option key={l.value} value={l.value}>{l.icon} {l.label}</option>
                ))}
              </select>
              <textarea
                placeholder="代码内容"
                value={form.code}
                onChange={(e) => setForm(prev => ({ ...prev, code: e.target.value }))}
                style={styles.codeTextarea}
                spellCheck={false}
              />
              <textarea
                placeholder="描述（可选）"
                value={form.description}
                onChange={(e) => setForm(prev => ({ ...prev, description: e.target.value }))}
                style={styles.textarea}
              />
              <input
                type="text"
                placeholder="标签（用逗号分隔）"
                value={form.tags}
                onChange={(e) => setForm(prev => ({ ...prev, tags: e.target.value }))}
                style={styles.input}
              />
            </div>
            <div style={styles.modalFooter}>
              <button onClick={() => setIsEditing(false)} style={styles.secondaryBtn}>取消</button>
              <button onClick={saveSnippet} style={styles.primaryBtn}>保存</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

function getLanguageIcon(lang: string): string {
  return LANGUAGES.find(l => l.value === lang)?.icon || '📄'
}

function getLanguageLabel(lang: string): string {
  return LANGUAGES.find(l => l.value === lang)?.label || lang
}

function formatDate(timestamp: number): string {
  const date = new Date(timestamp)
  const now = new Date()
  const diff = now.getTime() - timestamp
  if (diff < 60000) return '刚刚'
  if (diff < 3600000) return `${Math.floor(diff / 60000)} 分钟前`
  if (diff < 86400000) return `${Math.floor(diff / 3600000)} 小时前`
  if (diff < 604800000) return `${Math.floor(diff / 86400000)} 天前`
  return date.toLocaleDateString('zh-CN')
}

const styles: Record<string, React.CSSProperties> = {
  container: {
    display: 'flex',
    flexDirection: 'column',
    height: '100%',
    background: '#0f0f1a',
    color: '#e0e0e8',
    fontFamily: "'Noto Sans SC', system-ui, sans-serif",
  },
  header: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '16px 24px',
    background: 'rgba(255,255,255,0.05)',
    borderBottom: '1px solid rgba(255,255,255,0.1)',
  },
  headerLeft: { display: 'flex', alignItems: 'center', gap: 16 },
  headerRight: { display: 'flex', gap: 8 },
  logo: { fontSize: 28 },
  title: { margin: 0, fontSize: 18, fontWeight: 700 },
  subtitle: { margin: 0, fontSize: 12, color: '#8b8b9e' },
  primaryBtn: { padding: '8px 16px', background: 'linear-gradient(135deg, #8b5cf6, #6366f1)', border: 'none', borderRadius: 8, color: 'white', cursor: 'pointer', fontSize: 14, fontWeight: 500 },
  secondaryBtn: { padding: '8px 16px', background: 'rgba(255,255,255,0.1)', border: '1px solid rgba(255,255,255,0.2)', borderRadius: 8, color: '#e0e0e8', cursor: 'pointer', fontSize: 14 },
  toolbar: { display: 'flex', gap: 12, padding: '12px 24px', alignItems: 'center', flexWrap: 'wrap', borderBottom: '1px solid rgba(255,255,255,0.1)' },
  searchInput: { flex: '1', minWidth: 200, padding: '10px 16px', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 8, color: '#e0e0e8', fontSize: 14, outline: 'none' },
  select: { padding: '10px 12px', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 8, color: '#e0e0e8', fontSize: 14 },
  tagFilter: { display: 'flex', gap: 6, flexWrap: 'wrap', flex: 1 },
  tag: { padding: '4px 10px', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 12, color: '#8b8b9e', cursor: 'pointer', fontSize: 12 },
  tagActive: { background: 'rgba(139,92,246,0.2)', borderColor: '#8b5cf6', color: '#c4b5fd' },
  viewToggle: { display: 'flex', gap: 4 },
  viewBtn: { padding: '8px 12px', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 8, color: '#8b8b9e', cursor: 'pointer', fontSize: 16 },
  viewBtnActive: { background: 'rgba(139,92,246,0.2)', color: '#c4b5fd' },
  content: { flex: 1, padding: 24, overflowY: 'auto' },
  grid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(340px, 1fr))', gap: 20 },
  list: { display: 'flex', flexDirection: 'column', gap: 12 },
  card: { background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 12, padding: 16 },
  cardHeader: { display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 },
  cardTitle: { fontSize: 16, fontWeight: 600, flex: 1, marginRight: 12 },
  cardActions: { display: 'flex', gap: 4 },
  iconBtn: { background: 'transparent', border: 'none', cursor: 'pointer', fontSize: 16, padding: 4, color: '#8b8b9e' },
  cardMeta: { display: 'flex', gap: 12, alignItems: 'center', marginBottom: 12 },
  badge: { padding: '4px 10px', background: 'rgba(139,92,246,0.2)', borderRadius: 6, fontSize: 12, color: '#c4b5fd' },
  date: { fontSize: 12, color: '#5a5a72' },
  codePreview: {
    margin: 0, padding: 12, background: '#1a1a2e', borderRadius: 8,
    fontSize: 13, fontFamily: "'JetBrains Mono', monospace",
    overflow: 'auto', maxHeight: 200, whiteSpace: 'pre', color: '#c4c4d4',
  },
  description: { margin: '12px 0 0', fontSize: 13, color: '#8b8b9e', lineHeight: 1.5 },
  cardTags: { display: 'flex', gap: 6, marginTop: 12, flexWrap: 'wrap' },
  smallTag: { padding: '3px 8px', background: 'rgba(255,255,255,0.05)', borderRadius: 10, fontSize: 11, color: '#8b8b9e' },
  emptyState: { display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: 400, gap: 16 },
  emptyIcon: { fontSize: 64 },
  emptyText: { color: '#8b8b9e', fontSize: 16 },
  modalOverlay: { position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 999 },
  modal: { background: '#1a1a2e', borderRadius: 16, width: '90%', maxWidth: 600, maxHeight: '90vh', overflow: 'auto', border: '1px solid rgba(255,255,255,0.1)' },
  modalHeader: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '16px 24px', borderBottom: '1px solid rgba(255,255,255,0.1)' },
  modalTitle: { margin: 0, fontSize: 18, fontWeight: 600 },
  closeBtn: { background: 'transparent', border: 'none', color: '#8b8b9e', cursor: 'pointer', fontSize: 18 },
  modalBody: { padding: 24, display: 'flex', flexDirection: 'column', gap: 12 },
  modalFooter: { display: 'flex', justifyContent: 'flex-end', gap: 8, padding: '16px 24px', borderTop: '1px solid rgba(255,255,255,0.1)' },
  input: { padding: '10px 14px', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 8, color: '#e0e0e8', fontSize: 14, outline: 'none', fontFamily: 'inherit' },
  textarea: { padding: '10px 14px', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 8, color: '#e0e0e8', fontSize: 14, outline: 'none', resize: 'vertical', minHeight: 60, fontFamily: 'inherit' },
  codeTextarea: { padding: '12px 14px', background: '#0d0d1a', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 8, color: '#c4c4d4', fontSize: 14, outline: 'none', resize: 'vertical', minHeight: 200, fontFamily: "'JetBrains Mono', monospace" },
}
