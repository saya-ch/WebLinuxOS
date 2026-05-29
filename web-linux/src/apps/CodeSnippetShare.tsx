import { useState, useCallback, useMemo } from 'react'
import { useStore } from '../store'

interface Snippet {
  id: string
  title: string
  code: string
  language: string
  description?: string
  tags: string[]
  createdAt: number
  shareId?: string
}

const languages = [
  { id: 'javascript', name: 'JavaScript', icon: '🟨' },
  { id: 'typescript', name: 'TypeScript', icon: '🔷' },
  { id: 'python', name: 'Python', icon: '🐍' },
  { id: 'html', name: 'HTML', icon: '📄' },
  { id: 'css', name: 'CSS', icon: '🎨' },
  { id: 'json', name: 'JSON', icon: '📋' },
  { id: 'markdown', name: 'Markdown', icon: '📝' },
  { id: 'bash', name: 'Bash', icon: '💻' },
  { id: 'sql', name: 'SQL', icon: '🗄️' },
  { id: 'java', name: 'Java', icon: '☕' },
  { id: 'cpp', name: 'C++', icon: '⚡' },
  { id: 'c', name: 'C', icon: '🔧' },
  { id: 'go', name: 'Go', icon: '🐹' },
  { id: 'rust', name: 'Rust', icon: '🦀' },
  { id: 'other', name: 'Other', icon: '📁' },
]

const CodeSnippetShare = function () {
  const addNotification = useStore((s) => s.addNotification)

  const [snippets, setSnippets] = useState<Snippet[]>(() => {
    const saved = localStorage.getItem('weblinux-snippets')
    if (saved) {
      try {
        return JSON.parse(saved)
      } catch {
        return [
          {
            id: '1',
            title: '防抖函数',
            code: `function debounce(func, wait) {
  let timeout
  return function executedFunction(...args) {
    const later = () => {
      clearTimeout(timeout)
      func(...args)
    }
    clearTimeout(timeout)
    timeout = setTimeout(later, wait)
  }
}`,
            language: 'javascript',
            description: '一个简单但实用的防抖函数实现',
            tags: ['函数', '工具', 'JavaScript'],
            createdAt: Date.now(),
          },
          {
            id: '2',
            title: '快速排序',
            code: `def quicksort(arr):
    if len(arr) <= 1:
        return arr
    pivot = arr[len(arr) // 2]
    left = [x for x in arr if x < pivot]
    middle = [x for x in arr if x == pivot]
    right = [x for x in arr if x > pivot]
    return quicksort(left) + middle + quicksort(right)`,
            language: 'python',
            description: 'Python 实现的快速排序算法',
            tags: ['算法', '排序', 'Python'],
            createdAt: Date.now(),
          }
        ]
      }
    }
    return []
  })

  const [selectedSnippet, setSelectedSnippet] = useState<Snippet | null>(null)
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedLanguage, setSelectedLanguage] = useState<string>('all')
  const [showAddModal, setShowAddModal] = useState(false)
  const [editingSnippet, setEditingSnippet] = useState<Snippet | null>(null)
  const [newSnippet, setNewSnippet] = useState({ title: '', code: '', language: 'javascript', description: '', tags: '' })

  const saveSnippets = useCallback((newSnippets: Snippet[]) => {
    setSnippets(newSnippets)
    localStorage.setItem('weblinux-snippets', JSON.stringify(newSnippets))
  }, [])

  const filteredSnippets = useMemo(() => {
    return snippets.filter(s => {
      const matchesLang = selectedLanguage === 'all' || s.language === selectedLanguage
      const matchesSearch = searchQuery === '' ||
        s.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        s.code.toLowerCase().includes(searchQuery.toLowerCase()) ||
        s.tags.some(t => t.toLowerCase().includes(searchQuery.toLowerCase())) ||
        (s.description && s.description.toLowerCase().includes(searchQuery.toLowerCase()))
      return matchesLang && matchesSearch
    }).sort((a, b) => b.createdAt - a.createdAt)
  }, [snippets, selectedLanguage, searchQuery])



  const handleSaveSnippet = useCallback(() => {
    if (!newSnippet.title || !newSnippet.code) {
      addNotification({ title: '错误', message: '请填写标题和代码', type: 'error' })
      return
    }

    const snippet: Snippet = {
      id: editingSnippet ? editingSnippet.id : Date.now().toString(),
      title: newSnippet.title,
      code: newSnippet.code,
      language: newSnippet.language,
      description: newSnippet.description,
      tags: newSnippet.tags.split(',').map(t => t.trim()).filter(Boolean),
      createdAt: editingSnippet ? editingSnippet.createdAt : Date.now(),
      shareId: editingSnippet ? editingSnippet.shareId : undefined,
    }

    let newSnippets: Snippet[]
    if (editingSnippet) {
      newSnippets = snippets.map(s => s.id === editingSnippet.id ? snippet : s)
      addNotification({ title: '成功', message: '代码片段已更新', type: 'success' })
    } else {
      newSnippets = [snippet, ...snippets]
      addNotification({ title: '成功', message: '代码片段已添加', type: 'success' })
    }

    saveSnippets(newSnippets)
    setShowAddModal(false)
    setEditingSnippet(null)
    setNewSnippet({ title: '', code: '', language: 'javascript', description: '', tags: '' })
  }, [newSnippet, editingSnippet, snippets, saveSnippets, addNotification])

  const handleDeleteSnippet = useCallback((id: string) => {
    if (confirm('确定要删除这个代码片段吗？')) {
      saveSnippets(snippets.filter(s => s.id !== id))
      if (selectedSnippet?.id === id) setSelectedSnippet(null)
      addNotification({ title: '成功', message: '代码片段已删除', type: 'info' })
    }
  }, [snippets, selectedSnippet, saveSnippets, addNotification])

  const handleShareSnippet = useCallback((snippet: Snippet) => {
    const shareId = snippet.shareId || Math.random().toString(36).substring(2, 10)
    const shareUrl = `${window.location.origin}${window.location.pathname}#share=${shareId}`
    
    saveSnippets(snippets.map(s => 
      s.id === snippet.id ? { ...s, shareId } : s
    ))
    
    navigator.clipboard.writeText(shareUrl).then(() => {
      addNotification({ title: '分享链接已复制', message: shareUrl, type: 'success' })
    }).catch(() => {
      addNotification({ title: '分享链接', message: shareUrl, type: 'info' })
    })
  }, [snippets, saveSnippets, addNotification])

  const handleCopyCode = useCallback((code: string) => {
    navigator.clipboard.writeText(code).then(() => {
      addNotification({ title: '已复制', message: '代码已复制到剪贴板', type: 'success' })
    })
  }, [addNotification])

  const languageInfo = useMemo(() => {
    const map: Record<string, typeof languages[0]> = {}
    languages.forEach(l => map[l.id] = l)
    return map
  }, [])

  return (
    <div style={{ display: 'flex', height: '100%', background: 'var(--window-bg)', overflow: 'hidden' }}>
      <div style={{ width: '300px', borderRight: '1px solid var(--window-border)', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
        <div style={{ padding: '16px', borderBottom: '1px solid var(--window-border)' }}>
          <h2 style={{ margin: '0 0 12px 0', fontSize: '18px', fontWeight: '600', color: 'var(--text-primary)' }}>
            📜 代码片段分享
          </h2>
          <button
            onClick={() => { setEditingSnippet(null); setNewSnippet({ title: '', code: '', language: 'javascript', description: '', tags: '' }); setShowAddModal(true) }}
            style={{
              width: '100%',
              padding: '10px 16px',
              borderRadius: '8px',
              border: 'none',
              background: 'var(--accent)',
              color: '#fff',
              fontWeight: '600',
              cursor: 'pointer',
              fontSize: '14px',
            }}
          >
            + 创建新片段
          </button>
        </div>

        <div style={{ padding: '12px 16px', borderBottom: '1px solid var(--window-border)' }}>
          <input
            type="text"
            placeholder="搜索..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            style={{
              width: '100%',
              padding: '8px 12px',
              borderRadius: '6px',
              border: '1px solid var(--window-border)',
              background: 'var(--titlebar-bg)',
              color: 'var(--text-primary)',
              fontSize: '13px',
              marginBottom: '10px',
            }}
          />
          <select
            value={selectedLanguage}
            onChange={(e) => setSelectedLanguage(e.target.value)}
            style={{
              width: '100%',
              padding: '8px 12px',
              borderRadius: '6px',
              border: '1px solid var(--window-border)',
              background: 'var(--titlebar-bg)',
              color: 'var(--text-primary)',
              fontSize: '13px',
            }}
          >
            <option value="all">所有语言</option>
            {languages.map(lang => (
              <option key={lang.id} value={lang.id}>{lang.icon} {lang.name}</option>
            ))}
          </select>
        </div>

        <div style={{ flex: 1, overflow: 'auto', padding: '12px' }}>
          {filteredSnippets.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '32px', color: 'var(--text-secondary)', fontSize: '13px' }}>
              没有找到代码片段
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {filteredSnippets.map(snippet => (
                <div
                  key={snippet.id}
                  onClick={() => setSelectedSnippet(snippet)}
                  style={{
                    padding: '12px',
                    borderRadius: '8px',
                    border: selectedSnippet?.id === snippet.id ? '2px solid var(--accent)' : '1px solid var(--window-border)',
                    background: selectedSnippet?.id === snippet.id ? 'var(--accent-bg)' : 'var(--titlebar-bg)',
                    cursor: 'pointer',
                    transition: 'all 0.2s',
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                    <span style={{ fontWeight: '600', fontSize: '13px', color: 'var(--text-primary)' }}>
                      {snippet.title}
                    </span>
                    <span style={{ fontSize: '12px' }}>
                      {languageInfo[snippet.language]?.icon || '📁'}
                    </span>
                  </div>
                  {snippet.description && (
                    <div style={{ fontSize: '11px', color: 'var(--text-secondary)', marginBottom: '6px', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                      {snippet.description}
                    </div>
                  )}
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px' }}>
                    {snippet.tags.slice(0, 3).map(tag => (
                      <span key={tag} style={{ fontSize: '10px', padding: '2px 6px', borderRadius: '8px', background: 'var(--window-border)', color: 'var(--text-secondary)' }}>
                        {tag}
                      </span>
                    ))}
                  </div>
                  <div style={{ fontSize: '10px', color: 'var(--text-secondary)', marginTop: '6px' }}>
                    {new Date(snippet.createdAt).toLocaleDateString('zh-CN')}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
        {selectedSnippet ? (
          <>
            <div style={{ padding: '16px', borderBottom: '1px solid var(--window-border)', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
              <div style={{ flex: 1 }}>
                <h3 style={{ margin: '0 0 6px 0', fontSize: '18px', fontWeight: '600', color: 'var(--text-primary)' }}>
                  {languageInfo[selectedSnippet.language]?.icon} {selectedSnippet.title}
                </h3>
                {selectedSnippet.description && (
                  <p style={{ margin: '0 0 8px 0', fontSize: '13px', color: 'var(--text-secondary)' }}>
                    {selectedSnippet.description}
                  </p>
                )}
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                  {selectedSnippet.tags.map(tag => (
                    <span key={tag} style={{ fontSize: '11px', padding: '4px 10px', borderRadius: '10px', background: 'var(--accent-bg)', color: 'var(--accent)' }}>
                      {tag}
                    </span>
                  ))}
                </div>
              </div>
              <div style={{ display: 'flex', gap: '8px', marginLeft: '16px' }}>
                <button
                  onClick={() => handleCopyCode(selectedSnippet.code)}
                  style={{
                    padding: '8px 16px',
                    borderRadius: '6px',
                    border: '1px solid var(--window-border)',
                    background: 'transparent',
                    color: 'var(--text-primary)',
                    cursor: 'pointer',
                    fontSize: '13px',
                  }}
                >
                  📋 复制
                </button>
                <button
                  onClick={() => handleShareSnippet(selectedSnippet)}
                  style={{
                    padding: '8px 16px',
                    borderRadius: '6px',
                    border: '1px solid var(--window-border)',
                    background: 'transparent',
                    color: 'var(--text-primary)',
                    cursor: 'pointer',
                    fontSize: '13px',
                  }}
                >
                  🔗 分享
                </button>
                <button
                  onClick={() => {
                    setEditingSnippet(selectedSnippet)
                    setNewSnippet({
                      title: selectedSnippet.title,
                      code: selectedSnippet.code,
                      language: selectedSnippet.language,
                      description: selectedSnippet.description || '',
                      tags: selectedSnippet.tags.join(', '),
                    })
                    setShowAddModal(true)
                  }}
                  style={{
                    padding: '8px 16px',
                    borderRadius: '6px',
                    border: '1px solid var(--window-border)',
                    background: 'transparent',
                    color: 'var(--text-primary)',
                    cursor: 'pointer',
                    fontSize: '13px',
                  }}
                >
                  ✏️ 编辑
                </button>
                <button
                  onClick={() => handleDeleteSnippet(selectedSnippet.id)}
                  style={{
                    padding: '8px 16px',
                    borderRadius: '6px',
                    border: '1px solid var(--error)',
                    background: 'transparent',
                    color: 'var(--error)',
                    cursor: 'pointer',
                    fontSize: '13px',
                  }}
                >
                  🗑️ 删除
                </button>
              </div>
            </div>
            <div style={{ flex: 1, overflow: 'auto', padding: '16px' }}>
              <pre style={{
                margin: 0,
                padding: '20px',
                background: 'var(--titlebar-bg)',
                borderRadius: '10px',
                fontFamily: "'JetBrains Mono', 'Fira Code', 'Consolas', monospace",
                fontSize: '13px',
                lineHeight: '1.6',
                whiteSpace: 'pre-wrap',
                wordBreak: 'break-word',
                color: 'var(--text-primary)',
                border: '1px solid var(--window-border)',
              }}>
                <code>{selectedSnippet.code}</code>
              </pre>
            </div>
          </>
        ) : (
          <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column', gap: '16px', color: 'var(--text-secondary)' }}>
            <div style={{ fontSize: '64px' }}>📝</div>
            <div style={{ fontSize: '18px' }}>选择一个代码片段或创建新的</div>
          </div>
        )}
      </div>

      {showAddModal && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(0,0,0,0.5)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1000,
          }}
          onClick={() => setShowAddModal(false)}
        >
          <div
            style={{
              width: '700px',
              maxWidth: '90%',
              maxHeight: '85vh',
              background: 'var(--window-bg)',
              borderRadius: '12px',
              overflow: 'hidden',
              display: 'flex',
              flexDirection: 'column',
              boxShadow: '0 20px 50px rgba(0,0,0,0.3)',
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div style={{ padding: '20px', borderBottom: '1px solid var(--window-border)' }}>
              <h3 style={{ margin: 0, fontSize: '18px', fontWeight: '600', color: 'var(--text-primary)' }}>
                {editingSnippet ? '编辑代码片段' : '创建代码片段'}
              </h3>
            </div>
            <div style={{ flex: 1, overflow: 'auto', padding: '20px' }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                <div>
                  <label style={{ display: 'block', marginBottom: '6px', fontSize: '13px', fontWeight: '600', color: 'var(--text-secondary)' }}>标题</label>
                  <input
                    type="text"
                    placeholder="代码片段标题"
                    value={newSnippet.title}
                    onChange={(e) => setNewSnippet({ ...newSnippet, title: e.target.value })}
                    style={{
                      width: '100%',
                      padding: '10px 14px',
                      borderRadius: '8px',
                      border: '1px solid var(--window-border)',
                      background: 'var(--titlebar-bg)',
                      color: 'var(--text-primary)',
                      fontSize: '13px',
                    }}
                  />
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
                  <div>
                    <label style={{ display: 'block', marginBottom: '6px', fontSize: '13px', fontWeight: '600', color: 'var(--text-secondary)' }}>语言</label>
                    <select
                      value={newSnippet.language}
                      onChange={(e) => setNewSnippet({ ...newSnippet, language: e.target.value })}
                      style={{
                        width: '100%',
                        padding: '10px 14px',
                        borderRadius: '8px',
                        border: '1px solid var(--window-border)',
                        background: 'var(--titlebar-bg)',
                        color: 'var(--text-primary)',
                        fontSize: '13px',
                      }}
                    >
                      {languages.map(lang => (
                        <option key={lang.id} value={lang.id}>{lang.icon} {lang.name}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label style={{ display: 'block', marginBottom: '6px', fontSize: '13px', fontWeight: '600', color: 'var(--text-secondary)' }}>标签（用逗号分隔）</label>
                    <input
                      type="text"
                      placeholder="标签1, 标签2, 标签3"
                      value={newSnippet.tags}
                      onChange={(e) => setNewSnippet({ ...newSnippet, tags: e.target.value })}
                      style={{
                        width: '100%',
                        padding: '10px 14px',
                        borderRadius: '8px',
                        border: '1px solid var(--window-border)',
                        background: 'var(--titlebar-bg)',
                        color: 'var(--text-primary)',
                        fontSize: '13px',
                      }}
                    />
                  </div>
                </div>
                <div>
                  <label style={{ display: 'block', marginBottom: '6px', fontSize: '13px', fontWeight: '600', color: 'var(--text-secondary)' }}>描述（可选）</label>
                  <textarea
                    placeholder="代码片段描述"
                    value={newSnippet.description}
                    onChange={(e) => setNewSnippet({ ...newSnippet, description: e.target.value })}
                    style={{
                      width: '100%',
                      padding: '10px 14px',
                      borderRadius: '8px',
                      border: '1px solid var(--window-border)',
                      background: 'var(--titlebar-bg)',
                      color: 'var(--text-primary)',
                      fontSize: '13px',
                      minHeight: '60px',
                      resize: 'vertical',
                    }}
                  />
                </div>
                <div>
                  <label style={{ display: 'block', marginBottom: '6px', fontSize: '13px', fontWeight: '600', color: 'var(--text-secondary)' }}>代码</label>
                  <textarea
                    placeholder="在此输入代码..."
                    value={newSnippet.code}
                    onChange={(e) => setNewSnippet({ ...newSnippet, code: e.target.value })}
                    style={{
                      width: '100%',
                      padding: '14px',
                      borderRadius: '8px',
                      border: '1px solid var(--window-border)',
                      background: 'var(--titlebar-bg)',
                      color: 'var(--text-primary)',
                      fontFamily: "'JetBrains Mono', 'Fira Code', 'Consolas', monospace",
                      fontSize: '13px',
                      minHeight: '200px',
                      resize: 'vertical',
                      lineHeight: '1.6',
                    }}
                  />
                </div>
              </div>
            </div>
            <div style={{ padding: '16px 20px', borderTop: '1px solid var(--window-border)', display: 'flex', gap: '10px', justifyContent: 'flex-end' }}>
              <button
                onClick={() => setShowAddModal(false)}
                style={{
                  padding: '10px 20px',
                  borderRadius: '8px',
                  border: '1px solid var(--window-border)',
                  background: 'transparent',
                  color: 'var(--text-secondary)',
                  cursor: 'pointer',
                  fontSize: '14px',
                }}
              >
                取消
              </button>
              <button
                onClick={handleSaveSnippet}
                style={{
                  padding: '10px 20px',
                  borderRadius: '8px',
                  border: 'none',
                  background: 'var(--accent)',
                  color: '#fff',
                  cursor: 'pointer',
                  fontSize: '14px',
                  fontWeight: '600',
                }}
              >
                {editingSnippet ? '更新' : '保存'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default CodeSnippetShare
