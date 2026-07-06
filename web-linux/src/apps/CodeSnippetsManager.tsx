import { useState, useCallback, useMemo } from 'react'
import { Copy, Trash2, Plus, Search, Code2, Bookmark, Star, Download, Upload, ChevronDown, ChevronUp } from 'lucide-react'

interface Snippet {
  id: string
  title: string
  code: string
  language: string
  tags: string[]
  createdAt: string
  updatedAt: string
  starred: boolean
}

const LANGUAGES = ['javascript', 'typescript', 'python', 'java', 'go', 'rust', 'cpp', 'c', 'ruby', 'php', 'html', 'css', 'json', 'yaml', 'sql', 'bash', 'markdown', 'xml']

const TAG_COLORS: Record<string, string> = {
  javascript: '#f7df1e',
  typescript: '#3178c6',
  python: '#3776ab',
  java: '#ed8b00',
  go: '#00add8',
  rust: '#dea584',
  cpp: '#00599c',
  c: '#555555',
  ruby: '#cc342d',
  php: '#777bb4',
  html: '#e34c26',
  css: '#563d7c',
  json: '#000000',
  yaml: '#cb171e',
  sql: '#e38c00',
  bash: '#4eaa25',
  markdown: '#083fa1',
  xml: '#e37400',
  react: '#61dafb',
  vue: '#42b883',
  next: '#000000',
  node: '#339933',
  express: '#000000',
  algorithm: '#ff6b6b',
  utility: '#4ecdc4',
  config: '#ffe66d',
  template: '#95e1d3',
  api: '#f38181',
  database: '#aa96da',
}

function getTagColor(tag: string): string {
  return TAG_COLORS[tag.toLowerCase()] || '#6b7280'
}

const CodeSnippetsManager = () => {
  const [snippets, setSnippets] = useState<Snippet[]>(() => {
    const stored = localStorage.getItem('weblinux_snippets')
    if (stored) {
      try {
        return JSON.parse(stored)
      } catch {
        return []
      }
    }
    return [
      {
        id: '1',
        title: 'React useEffect 模板',
        code: `import { useEffect, useState } from 'react'

function MyComponent() {
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true)
        const response = await fetch('/api/data')
        const result = await response.json()
        setData(result)
        setError(null)
      } catch (err) {
        setError(err.message)
        setData(null)
      } finally {
        setLoading(false)
      }
    }

    fetchData()

    return () => {
      // 清理函数
    }
  }, [])

  if (loading) return <div>Loading...</div>
  if (error) return <div>Error: {error}</div>

  return <div>{JSON.stringify(data)}</div>
}

export default MyComponent`,
        language: 'typescript',
        tags: ['react', 'hooks', 'api'],
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        starred: true,
      },
      {
        id: '2',
        title: 'JavaScript 防抖函数',
        code: `function debounce(func, wait) {
  let timeout = null
  return function executedFunction(...args) {
    const later = () => {
      clearTimeout(timeout)
      func(...args)
    }
    clearTimeout(timeout)
    timeout = setTimeout(later, wait)
  }
}

// 使用示例
const debouncedSearch = debounce(search, 300)
input.addEventListener('input', debouncedSearch)`,
        language: 'javascript',
        tags: ['javascript', 'utility'],
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        starred: true,
      },
      {
        id: '3',
        title: 'Python 装饰器',
        code: `def timer(func):
    import time
    def wrapper(*args, **kwargs):
        start = time.time()
        result = func(*args, **kwargs)
        end = time.time()
        print(f'{func.__name__} took {end - start:.2f}s')
        return result
    return wrapper

@timer
def slow_function():
    # 耗时操作
    time.sleep(2)
    return 'done'`,
        language: 'python',
        tags: ['python', 'decorator'],
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        starred: false,
      },
    ]
  })

  const [searchQuery, setSearchQuery] = useState('')
  const [selectedLanguage, setSelectedLanguage] = useState('all')
  const [showStarredOnly, setShowStarredOnly] = useState(false)
  const [expandedId, setExpandedId] = useState<string | null>(null)
  const [showModal, setShowModal] = useState(false)
  const [editingSnippet, setEditingSnippet] = useState<Snippet | null>(null)

  const saveSnippets = useCallback((newSnippets: Snippet[]) => {
    setSnippets(newSnippets)
    localStorage.setItem('weblinux_snippets', JSON.stringify(newSnippets))
  }, [])

  const filteredSnippets = useMemo(() => {
    return snippets.filter(snippet => {
      if (showStarredOnly && !snippet.starred) return false
      if (selectedLanguage !== 'all' && snippet.language !== selectedLanguage) return false
      if (searchQuery) {
        const query = searchQuery.toLowerCase()
        return (
          snippet.title.toLowerCase().includes(query) ||
          snippet.code.toLowerCase().includes(query) ||
          snippet.tags.some(tag => tag.toLowerCase().includes(query))
        )
      }
      return true
    })
  }, [snippets, searchQuery, selectedLanguage, showStarredOnly])

  const handleCopy = useCallback(async (code: string) => {
    try {
      await navigator.clipboard.writeText(code)
    } catch {
      const textarea = document.createElement('textarea')
      textarea.value = code
      document.body.appendChild(textarea)
      textarea.select()
      document.execCommand('copy')
      document.body.removeChild(textarea)
    }
  }, [])

  const handleDelete = useCallback((id: string) => {
    saveSnippets(snippets.filter(s => s.id !== id))
  }, [snippets, saveSnippets])

  const handleStar = useCallback((id: string) => {
    saveSnippets(snippets.map(s => s.id === id ? { ...s, starred: !s.starred } : s))
  }, [snippets, saveSnippets])

  const handleAdd = useCallback(() => {
    setEditingSnippet(null)
    setShowModal(true)
  }, [])

  const handleEdit = useCallback((snippet: Snippet) => {
    setEditingSnippet(snippet)
    setShowModal(true)
  }, [])

  const handleSave = useCallback((data: Omit<Snippet, 'id' | 'createdAt' | 'updatedAt'>) => {
    const now = new Date().toISOString()
    if (editingSnippet) {
      saveSnippets(snippets.map(s => s.id === editingSnippet.id ? { ...s, ...data, updatedAt: now } : s))
    } else {
      saveSnippets([...snippets, { ...data, id: Date.now().toString(), createdAt: now, updatedAt: now }])
    }
    setShowModal(false)
    setEditingSnippet(null)
  }, [editingSnippet, snippets, saveSnippets])

  const handleExport = useCallback(() => {
    const data = JSON.stringify(snippets, null, 2)
    const blob = new Blob([data], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = 'snippets.json'
    a.click()
    URL.revokeObjectURL(url)
  }, [snippets])

  const handleImport = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = (e) => {
      try {
        const imported = JSON.parse(e.target?.result as string)
        if (Array.isArray(imported)) {
          const merged = [...snippets]
          imported.forEach((item: Snippet) => {
            const existing = merged.find(s => s.id === item.id)
            if (!existing) {
              merged.push(item)
            }
          })
          saveSnippets(merged)
        }
      } catch {
        // ignore
      }
    }
    reader.readAsText(file)
  }, [snippets, saveSnippets])

  return (
    <div className="snippets-manager">
      <div className="snippets-header">
        <div className="header-left">
          <Code2 className="header-icon" />
          <h2>代码片段管理器</h2>
        </div>
        <div className="header-actions">
          <input type="file" accept=".json" onChange={handleImport} className="import-input" />
          <button onClick={() => (document.querySelector('.import-input') as HTMLInputElement)?.click()} className="action-btn import-btn">
            <Upload size={16} />
            导入
          </button>
          <button onClick={handleExport} className="action-btn export-btn">
            <Download size={16} />
            导出
          </button>
          <button onClick={handleAdd} className="action-btn add-btn">
            <Plus size={16} />
            新建
          </button>
        </div>
      </div>

      <div className="snippets-filters">
        <div className="search-box">
          <Search size={16} />
          <input
            type="text"
            placeholder="搜索片段..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
        <select value={selectedLanguage} onChange={(e) => setSelectedLanguage(e.target.value)}>
          <option value="all">所有语言</option>
          {LANGUAGES.map(lang => (
            <option key={lang} value={lang}>{lang}</option>
          ))}
        </select>
        <label className="star-filter">
          <input type="checkbox" checked={showStarredOnly} onChange={(e) => setShowStarredOnly(e.target.checked)} />
          <Star size={16} className={showStarredOnly ? 'filled' : ''} />
          仅收藏
        </label>
      </div>

      <div className="snippets-list">
        {filteredSnippets.length === 0 ? (
          <div className="empty-state">
            <Code2 size={48} className="empty-icon" />
            <p>暂无代码片段</p>
            <button onClick={handleAdd} className="empty-btn">
              <Plus size={16} />
              创建第一个片段
            </button>
          </div>
        ) : (
          filteredSnippets.map(snippet => (
            <div key={snippet.id} className={`snippet-card ${expandedId === snippet.id ? 'expanded' : ''}`}>
              <div className="snippet-header" onClick={() => setExpandedId(expandedId === snippet.id ? null : snippet.id)}>
                <button onClick={(e) => { e.stopPropagation(); handleStar(snippet.id) }} className="star-btn">
                  <Star size={16} className={snippet.starred ? 'filled' : ''} />
                </button>
                <div className="snippet-info">
                  <h3>{snippet.title}</h3>
                  <div className="snippet-meta">
                    <span className="language-tag" style={{ backgroundColor: getTagColor(snippet.language) }}>
                      {snippet.language}
                    </span>
                    <span className="date">{new Date(snippet.updatedAt).toLocaleDateString()}</span>
                  </div>
                </div>
                <div className="snippet-actions">
                  <button onClick={(e) => { e.stopPropagation(); handleCopy(snippet.code) }} className="action-icon">
                    <Copy size={14} />
                  </button>
                  <button onClick={(e) => { e.stopPropagation(); handleEdit(snippet) }} className="action-icon">
                    <Bookmark size={14} />
                  </button>
                  <button onClick={(e) => { e.stopPropagation(); handleDelete(snippet.id) }} className="action-icon delete">
                    <Trash2 size={14} />
                  </button>
                  {expandedId === snippet.id ? (
                    <ChevronUp size={16} />
                  ) : (
                    <ChevronDown size={16} />
                  )}
                </div>
              </div>

              {expandedId === snippet.id && (
                <div className="snippet-content">
                  <div className="snippet-tags">
                    {snippet.tags.map(tag => (
                      <span key={tag} className="tag" style={{ backgroundColor: getTagColor(tag) }}>
                        {tag}
                      </span>
                    ))}
                  </div>
                  <pre className="code-block"><code>{snippet.code}</code></pre>
                  <div className="content-actions">
                    <button onClick={() => handleCopy(snippet.code)} className="copy-btn">
                      <Copy size={14} />
                      复制代码
                    </button>
                  </div>
                </div>
              )}
            </div>
          ))
        )}
      </div>

      {showModal && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>{editingSnippet ? '编辑片段' : '新建片段'}</h3>
              <button onClick={() => { setShowModal(false); setEditingSnippet(null) }} className="close-btn">×</button>
            </div>
            <div className="modal-body">
              <div className="form-group">
                <label>标题</label>
                <input
                  type="text"
                  value={editingSnippet?.title || ''}
                  onChange={(e) => setEditingSnippet(prev => ({ ...(prev || {} as Snippet), title: e.target.value }))}
                  placeholder="输入片段标题"
                  required
                />
              </div>
              <div className="form-group">
                <label>语言</label>
                <select
                  value={editingSnippet?.language || 'javascript'}
                  onChange={(e) => setEditingSnippet(prev => ({ ...(prev || {} as Snippet), language: e.target.value }))}
                >
                  {LANGUAGES.map(lang => (
                    <option key={lang} value={lang}>{lang}</option>
                  ))}
                </select>
              </div>
              <div className="form-group">
                <label>标签（逗号分隔）</label>
                <input
                  type="text"
                  value={editingSnippet?.tags.join(', ') || ''}
                  onChange={(e) => setEditingSnippet(prev => ({ ...(prev || {} as Snippet), tags: e.target.value.split(',').map(t => t.trim()).filter(Boolean) }))}
                  placeholder="tag1, tag2, tag3"
                />
              </div>
              <div className="form-group">
                <label>代码</label>
                <textarea
                  value={editingSnippet?.code || ''}
                  onChange={(e) => setEditingSnippet(prev => ({ ...(prev || {} as Snippet), code: e.target.value }))}
                  placeholder="输入代码..."
                  rows={10}
                  required
                />
              </div>
            </div>
            <div className="modal-footer">
              <button onClick={() => { setShowModal(false); setEditingSnippet(null) }} className="cancel-btn">取消</button>
              <button
                onClick={() => {
                  if (editingSnippet) {
                    handleSave({ title: editingSnippet.title, code: editingSnippet.code, language: editingSnippet.language, tags: editingSnippet.tags, starred: editingSnippet.starred })
                  }
                }}
                className="save-btn"
              >
                保存
              </button>
            </div>
          </div>
        </div>
      )}

      <style>{`
        .snippets-manager {
          display: flex;
          flex-direction: column;
          height: 100%;
          background: var(--window-bg, #1a1a2e);
          color: var(--text-color, #e0e0e0);
          padding: 16px;
          overflow: hidden;
        }

        .snippets-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding-bottom: 16px;
          border-bottom: 1px solid var(--border-color, #333);
          margin-bottom: 16px;
        }

        .header-left {
          display: flex;
          align-items: center;
          gap: 8px;
        }

        .header-icon {
          width: 24px;
          height: 24px;
          color: #61afef;
        }

        .header-left h2 {
          margin: 0;
          font-size: 18px;
          font-weight: 600;
        }

        .header-actions {
          display: flex;
          gap: 8px;
        }

        .action-btn {
          display: flex;
          align-items: center;
          gap: 4px;
          padding: 6px 12px;
          border: none;
          border-radius: 4px;
          font-size: 13px;
          cursor: pointer;
          transition: background 0.2s;
        }

        .import-btn {
          background: #374151;
          color: #e0e0e0;
        }

        .import-btn:hover {
          background: #4b5563;
        }

        .export-btn {
          background: #374151;
          color: #e0e0e0;
        }

        .export-btn:hover {
          background: #4b5563;
        }

        .add-btn {
          background: #61afef;
          color: #1a1a2e;
        }

        .add-btn:hover {
          background: #78b8f0;
        }

        .import-input {
          display: none;
        }

        .snippets-filters {
          display: flex;
          gap: 12px;
          margin-bottom: 16px;
          flex-wrap: wrap;
        }

        .search-box {
          flex: 1;
          min-width: 200px;
          display: flex;
          align-items: center;
          background: var(--input-bg, #2d2d44);
          border-radius: 4px;
          padding: 6px 12px;
          gap: 8px;
          color: #9ca3af;
        }

        .search-box input {
          flex: 1;
          background: transparent;
          border: none;
          color: var(--text-color, #e0e0e0);
          outline: none;
          font-size: 13px;
        }

        .search-box input::placeholder {
          color: #6b7280;
        }

        .snippets-filters select {
          padding: 6px 12px;
          border: 1px solid var(--border-color, #333);
          border-radius: 4px;
          background: var(--input-bg, #2d2d44);
          color: var(--text-color, #e0e0e0);
          font-size: 13px;
          outline: none;
          cursor: pointer;
        }

        .star-filter {
          display: flex;
          align-items: center;
          gap: 6px;
          cursor: pointer;
          font-size: 13px;
          color: var(--text-color, #e0e0e0);
        }

        .star-filter input {
          cursor: pointer;
        }

        .star-filter .filled {
          fill: #fbbf24;
          color: #fbbf24;
        }

        .snippets-list {
          flex: 1;
          overflow-y: auto;
          display: flex;
          flex-direction: column;
          gap: 12px;
          padding-right: 4px;
        }

        .snippets-list::-webkit-scrollbar {
          width: 6px;
        }

        .snippets-list::-webkit-scrollbar-track {
          background: transparent;
        }

        .snippets-list::-webkit-scrollbar-thumb {
          background: var(--scrollbar-thumb, #4b5563);
          border-radius: 3px;
        }

        .empty-state {
          flex: 1;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          gap: 12px;
          color: #6b7280;
        }

        .empty-icon {
          opacity: 0.5;
        }

        .empty-btn {
          display: flex;
          align-items: center;
          gap: 6px;
          padding: 8px 16px;
          background: #61afef;
          color: #1a1a2e;
          border: none;
          border-radius: 4px;
          font-size: 14px;
          cursor: pointer;
          transition: background 0.2s;
        }

        .empty-btn:hover {
          background: #78b8f0;
        }

        .snippet-card {
          background: var(--card-bg, #2d2d44);
          border-radius: 8px;
          overflow: hidden;
          border: 1px solid var(--border-color, #333);
          transition: all 0.2s;
        }

        .snippet-card:hover {
          border-color: #61afef;
        }

        .snippet-header {
          display: flex;
          align-items: center;
          padding: 12px;
          cursor: pointer;
          gap: 8px;
        }

        .star-btn {
          background: none;
          border: none;
          cursor: pointer;
          color: #6b7280;
          padding: 4px;
          transition: color 0.2s;
        }

        .star-btn .filled {
          fill: #fbbf24;
          color: #fbbf24;
        }

        .snippet-info {
          flex: 1;
          min-width: 0;
        }

        .snippet-info h3 {
          margin: 0 0 4px 0;
          font-size: 14px;
          font-weight: 500;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }

        .snippet-meta {
          display: flex;
          align-items: center;
          gap: 8px;
          font-size: 12px;
          color: #6b7280;
        }

        .language-tag {
          padding: 2px 6px;
          border-radius: 3px;
          font-size: 11px;
          color: #1a1a2e;
          font-weight: 500;
        }

        .snippet-actions {
          display: flex;
          align-items: center;
          gap: 4px;
        }

        .action-icon {
          background: none;
          border: none;
          cursor: pointer;
          color: #6b7280;
          padding: 4px;
          transition: color 0.2s;
          border-radius: 4px;
        }

        .action-icon:hover {
          color: #e0e0e0;
          background: rgba(255, 255, 255, 0.1);
        }

        .action-icon.delete:hover {
          color: #ef4444;
        }

        .snippet-content {
          padding: 0 12px 12px;
          border-top: 1px solid var(--border-color, #333);
        }

        .snippet-tags {
          display: flex;
          flex-wrap: wrap;
          gap: 6px;
          padding: 12px 0;
        }

        .tag {
          padding: 2px 8px;
          border-radius: 12px;
          font-size: 12px;
          color: #1a1a2e;
          font-weight: 500;
        }

        .code-block {
          background: #1a1a2e;
          border-radius: 6px;
          padding: 12px;
          overflow-x: auto;
          font-family: 'Monaco', 'Menlo', 'Ubuntu Mono', monospace;
          font-size: 13px;
          line-height: 1.6;
          margin: 0 0 12px 0;
          white-space: pre;
        }

        .code-block code {
          color: #e0e0e0;
        }

        .content-actions {
          display: flex;
          justify-content: flex-end;
        }

        .copy-btn {
          display: flex;
          align-items: center;
          gap: 6px;
          padding: 6px 12px;
          background: #374151;
          color: #e0e0e0;
          border: none;
          border-radius: 4px;
          font-size: 13px;
          cursor: pointer;
          transition: background 0.2s;
        }

        .copy-btn:hover {
          background: #4b5563;
        }

        .modal-overlay {
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background: rgba(0, 0, 0, 0.5);
          display: flex;
          align-items: center;
          justify-content: center;
          z-index: 1000;
        }

        .modal {
          background: var(--window-bg, #1a1a2e);
          border-radius: 8px;
          width: 90%;
          max-width: 600px;
          max-height: 80vh;
          overflow: hidden;
          border: 1px solid var(--border-color, #333);
        }

        .modal-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 12px 16px;
          border-bottom: 1px solid var(--border-color, #333);
        }

        .modal-header h3 {
          margin: 0;
          font-size: 16px;
        }

        .close-btn {
          background: none;
          border: none;
          font-size: 24px;
          color: #6b7280;
          cursor: pointer;
          line-height: 1;
          padding: 0;
          width: 24px;
          height: 24px;
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .close-btn:hover {
          color: #e0e0e0;
        }

        .modal-body {
          padding: 16px;
          overflow-y: auto;
          max-height: 60vh;
        }

        .form-group {
          margin-bottom: 16px;
        }

        .form-group label {
          display: block;
          margin-bottom: 6px;
          font-size: 13px;
          color: #9ca3af;
        }

        .form-group input,
        .form-group select,
        .form-group textarea {
          width: 100%;
          padding: 8px 12px;
          border: 1px solid var(--border-color, #333);
          border-radius: 4px;
          background: var(--input-bg, #2d2d44);
          color: var(--text-color, #e0e0e0);
          font-size: 14px;
          outline: none;
          box-sizing: border-box;
        }

        .form-group textarea {
          resize: vertical;
          font-family: 'Monaco', 'Menlo', monospace;
        }

        .form-group input:focus,
        .form-group select:focus,
        .form-group textarea:focus {
          border-color: #61afef;
        }

        .modal-footer {
          display: flex;
          justify-content: flex-end;
          gap: 8px;
          padding: 12px 16px;
          border-top: 1px solid var(--border-color, #333);
        }

        .cancel-btn {
          padding: 8px 16px;
          background: #374151;
          color: #e0e0e0;
          border: none;
          border-radius: 4px;
          font-size: 14px;
          cursor: pointer;
          transition: background 0.2s;
        }

        .cancel-btn:hover {
          background: #4b5563;
        }

        .save-btn {
          padding: 8px 16px;
          background: #61afef;
          color: #1a1a2e;
          border: none;
          border-radius: 4px;
          font-size: 14px;
          cursor: pointer;
          transition: background 0.2s;
        }

        .save-btn:hover {
          background: #78b8f0;
        }

        @media (prefers-color-scheme: light) {
          .snippets-manager {
            background: #f5f5f5;
            color: #1f2937;
          }

          .snippet-card {
            background: white;
            border-color: #e5e7eb;
          }

          .search-box {
            background: white;
            border: 1px solid #e5e7eb;
          }

          .snippets-filters select {
            background: white;
            color: #1f2937;
            border-color: #e5e7eb;
          }

          .modal {
            background: white;
            border-color: #e5e7eb;
          }

          .form-group input,
          .form-group select,
          .form-group textarea {
            background: white;
            color: #1f2937;
            border-color: #e5e7eb;
          }

          .code-block {
            background: #1f2937;
          }

          .code-block code {
            color: #e5e7eb;
          }
        }
      `}</style>
    </div>
  )
}

export default CodeSnippetsManager