import { useState, useCallback, useEffect } from 'react'
import { Search, Copy, Book, Code, Terminal, Zap, Layers, GitBranch, Globe, FileText, Settings, Star, Trash2, Plus, X } from 'lucide-react'

interface Shortcut {
  id: string
  category: string
  title: string
  keys: string
  description: string
  app?: string
  url?: string
  starred: boolean
}

const DEFAULT_SHORTCUTS: Shortcut[] = [
  // VS Code
  { id: '1', category: 'VS Code', title: '打开命令面板', keys: 'Cmd+Shift+P', description: '快速访问所有命令', app: 'VS Code', starred: false },
  { id: '2', category: 'VS Code', title: '快速打开文件', keys: 'Cmd+P', description: '模糊搜索文件', app: 'VS Code', starred: false },
  { id: '3', category: 'VS Code', title: '全局搜索', keys: 'Cmd+Shift+F', description: '在所有文件中搜索', app: 'VS Code', starred: false },
  { id: '4', category: 'VS Code', title: '打开终端', keys: 'Cmd+J', description: '显示/隐藏集成终端', app: 'VS Code', starred: false },
  { id: '5', category: 'VS Code', title: '多光标选择', keys: 'Cmd+D', description: '选中下一个匹配项', app: 'VS Code', starred: false },
  { id: '6', category: 'VS Code', title: '格式化代码', keys: 'Cmd+Shift+L', description: '格式化整个文档', app: 'VS Code', starred: false },
  { id: '7', category: 'VS Code', title: '跳转到定义', keys: 'F12', description: '跳转到符号定义', app: 'VS Code', starred: false },
  { id: '8', category: 'VS Code', title: '重命名符号', keys: 'F2', description: '重命名变量/函数', app: 'VS Code', starred: false },

  // Chrome
  { id: '9', category: 'Chrome', title: '开发者工具', keys: 'Cmd+Option+I', description: '打开开发者工具', app: 'Chrome', starred: false },
  { id: '10', category: 'Chrome', title: '清空缓存刷新', keys: 'Cmd+Shift+R', description: '硬刷新页面', app: 'Chrome', starred: false },
  { id: '11', category: 'Chrome', title: '打开新标签页', keys: 'Cmd+T', description: '打开新标签', app: 'Chrome', starred: false },
  { id: '12', category: 'Chrome', title: '关闭当前标签', keys: 'Cmd+W', description: '关闭标签', app: 'Chrome', starred: false },
  { id: '13', category: 'Chrome', title: '重新打开关闭标签', keys: 'Cmd+Shift+T', description: '恢复关闭的标签', app: 'Chrome', starred: false },
  { id: '14', category: 'Chrome', title: '地址栏聚焦', keys: 'Cmd+L', description: '快速输入URL', app: 'Chrome', starred: false },

  // Mac
  { id: '15', category: 'macOS', title: '截图区域', keys: 'Cmd+Shift+4', description: '截图选中区域', app: 'macOS', starred: false },
  { id: '16', category: 'macOS', title: '截图窗口', keys: 'Cmd+Shift+4+Space', description: '截图指定窗口', app: 'macOS', starred: false },
  { id: '17', category: 'macOS', title: '截图全屏', keys: 'Cmd+Shift+3', description: '全屏截图', app: 'macOS', starred: false },
  { id: '18', category: 'macOS', title: 'Spotlight搜索', keys: 'Cmd+Space', description: '全局搜索', app: 'macOS', starred: false },
  { id: '19', category: 'macOS', title: '切换应用', keys: 'Cmd+Tab', description: '应用切换器', app: 'macOS', starred: false },
  { id: '20', category: 'macOS', title: '强制退出', keys: 'Cmd+Option+Esc', description: '强制退出应用', app: 'macOS', starred: false },

  // Terminal
  { id: '21', category: 'Terminal', title: '清屏', keys: 'Cmd+K', description: '清空终端输出', app: 'Terminal', starred: false },
  { id: '22', category: 'Terminal', title: '中断进程', keys: 'Ctrl+C', description: '中断当前命令', app: 'Terminal', starred: false },
  { id: '23', category: 'Terminal', title: '挂起进程', keys: 'Ctrl+Z', description: '暂停当前进程', app: 'Terminal', starred: false },
  { id: '24', category: 'Terminal', title: '退出shell', keys: 'Ctrl+D', description: '退出当前shell', app: 'Terminal', starred: false },
  { id: '25', category: 'Terminal', title: '搜索历史', keys: 'Ctrl+R', description: '搜索命令历史', app: 'Terminal', starred: false },

  // Git
  { id: '26', category: 'Git', title: '查看状态', keys: 'git status', description: '查看文件状态', app: 'Git', starred: false },
  { id: '27', category: 'Git', title: '添加所有', keys: 'git add .', description: '添加所有更改', app: 'Git', starred: false },
  { id: '28', category: 'Git', title: '提交', keys: 'git commit -m', description: '提交更改', app: 'Git', starred: false },
  { id: '29', category: 'Git', title: '拉取更新', keys: 'git pull', description: '拉取远程更新', app: 'Git', starred: false },
  { id: '30', category: 'Git', title: '推送', keys: 'git push', description: '推送到远程', app: 'Git', starred: false },

  // Vim
  { id: '31', category: 'Vim', title: '保存退出', keys: ':wq', description: '保存并退出', app: 'Vim', starred: false },
  { id: '32', category: 'Vim', title: '强制退出', keys: ':q!', description: '不保存退出', app: 'Vim', starred: false },
  { id: '33', category: 'Vim', title: '插入模式', keys: 'i', description: '进入插入模式', app: 'Vim', starred: false },
  { id: '34', category: 'Vim', title: '删除行', keys: 'dd', description: '删除整行', app: 'Vim', starred: false },
  { id: '35', category: 'Vim', title: '复制行', keys: 'yy', description: '复制整行', app: 'Vim', starred: false },
  { id: '36', category: 'Vim', title: '粘贴', keys: 'p', description: '粘贴内容', app: 'Vim', starred: false },

  // Web Development
  { id: '37', category: 'Web Dev', title: 'React组件', keys: 'rafce', description: 'React箭头函数组件', app: 'React', starred: false },
  { id: '38', category: 'Web Dev', title: 'Console.log', keys: 'clg', description: 'console.log快捷输入', app: 'JS', starred: false },
  { id: '39', category: 'Web Dev', title: 'Import React', keys: 'imr', description: 'import React from react', app: 'React', starred: false },
  { id: '40', category: 'Web Dev', title: 'UseState', keys: 'useState', description: 'React Hook useState', app: 'React', starred: false },
]

const CATEGORY_ICONS: Record<string, React.ReactNode> = {
  'VS Code': <Code size={16} />,
  'Chrome': <Globe size={16} />,
  'macOS': <Settings size={16} />,
  'Terminal': <Terminal size={16} />,
  'Git': <GitBranch size={16} />,
  'Vim': <FileText size={16} />,
  'Web Dev': <Layers size={16} />,
}

const CATEGORY_COLORS: Record<string, string> = {
  'VS Code': '#007acc',
  'Chrome': '#4285f4',
  'macOS': '#555555',
  'Terminal': '#00ff00',
  'Git': '#f05032',
  'Vim': '#019733',
  'Web Dev': '#61dafb',
}

export default function DevShortcuts() {
  const [shortcuts, setShortcuts] = useState<Shortcut[]>([])
  const [search, setSearch] = useState('')
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null)
  const [showAddModal, setShowAddModal] = useState(false)
  const [editingShortcut, setEditingShortcut] = useState<Shortcut | null>(null)

  // Load from localStorage
  useEffect(() => {
    try {
      const saved = localStorage.getItem('weblinux-dev-shortcuts')
      if (saved) {
        const parsed = JSON.parse(saved)
        setShortcuts(parsed.length > 0 ? parsed : DEFAULT_SHORTCUTS)
      } else {
        setShortcuts(DEFAULT_SHORTCUTS)
      }
    } catch {
      setShortcuts(DEFAULT_SHORTCUTS)
    }
  }, [])

  // Save to localStorage
  useEffect(() => {
    localStorage.setItem('weblinux-dev-shortcuts', JSON.stringify(shortcuts))
  }, [shortcuts])

  const categories = Array.from(new Set(shortcuts.map(s => s.category)))

  const filteredShortcuts = shortcuts.filter(s => {
    const matchesSearch = !search ||
      s.title.toLowerCase().includes(search.toLowerCase()) ||
      s.keys.toLowerCase().includes(search.toLowerCase()) ||
      s.description.toLowerCase().includes(search.toLowerCase())
    const matchesCategory = !selectedCategory || s.category === selectedCategory
    return matchesSearch && matchesCategory
  })

  const copyToClipboard = useCallback((text: string) => {
    navigator.clipboard.writeText(text)
  }, [])

  const toggleStar = useCallback((id: string) => {
    setShortcuts(prev => prev.map(s => s.id === id ? { ...s, starred: !s.starred } : s))
  }, [])

  const deleteShortcut = useCallback((id: string) => {
    setShortcuts(prev => prev.filter(s => s.id !== id))
  }, [])

  const addShortcut = useCallback((shortcut: Omit<Shortcut, 'id' | 'starred'>) => {
    const newShortcut: Shortcut = {
      ...shortcut,
      id: Date.now().toString(),
      starred: false,
    }
    setShortcuts(prev => [...prev, newShortcut])
    setShowAddModal(false)
  }, [])

  const updateShortcut = useCallback((id: string, updates: Partial<Shortcut>) => {
    setShortcuts(prev => prev.map(s => s.id === id ? { ...s, ...updates } : s))
    setEditingShortcut(null)
  }, [])

  return (
    <div style={{
      height: '100%',
      display: 'flex',
      flexDirection: 'column',
      background: 'var(--window-bg)',
      color: 'var(--text-primary)',
    }}>
      {/* Header */}
      <div style={{
        padding: '12px 16px',
        borderBottom: '1px solid var(--window-border)',
        display: 'flex',
        gap: '12px',
        alignItems: 'center',
      }}>
        <div style={{ position: 'relative', flex: 1 }}>
          <Search size={14} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-secondary)' }} />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="搜索快捷键..."
            style={{
              width: '100%',
              padding: '8px 12px 8px 32px',
              borderRadius: '6px',
              border: '1px solid var(--window-border)',
              background: 'var(--window-bg)',
              color: 'var(--text-primary)',
              fontSize: '13px',
            }}
          />
        </div>

        <button
          onClick={() => setShowAddModal(true)}
          style={{
            padding: '8px 12px',
            borderRadius: '6px',
            border: 'none',
            background: 'var(--accent)',
            color: 'white',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '4px',
            fontSize: '13px',
          }}
        >
          <Plus size={14} />
          添加
        </button>
      </div>

      {/* Categories */}
      <div style={{
        padding: '12px 16px',
        display: 'flex',
        gap: '8px',
        overflowX: 'auto',
        borderBottom: '1px solid var(--window-border)',
      }}>
        <button
          onClick={() => setSelectedCategory(null)}
          style={{
            padding: '6px 12px',
            borderRadius: '6px',
            border: '1px solid var(--window-border)',
            background: selectedCategory === null ? 'var(--accent)' : 'var(--window-bg)',
            color: selectedCategory === null ? 'white' : 'var(--text-primary)',
            cursor: 'pointer',
            fontSize: '12px',
            whiteSpace: 'nowrap',
          }}
        >
          全部 ({shortcuts.length})
        </button>
        {categories.map(cat => (
          <button
            key={cat}
            onClick={() => setSelectedCategory(cat)}
            style={{
              padding: '6px 12px',
              borderRadius: '6px',
              border: '1px solid var(--window-border)',
              background: selectedCategory === cat ? CATEGORY_COLORS[cat] || 'var(--accent)' : 'var(--window-bg)',
              color: selectedCategory === cat ? 'white' : 'var(--text-primary)',
              cursor: 'pointer',
              fontSize: '12px',
              whiteSpace: 'nowrap',
              display: 'flex',
              alignItems: 'center',
              gap: '4px',
            }}
          >
            {CATEGORY_ICONS[cat]}
            {cat}
          </button>
        ))}
      </div>

      {/* Shortcuts List */}
      <div style={{ flex: 1, overflow: 'auto', padding: '12px' }}>
        {/* Starred Section */}
        {shortcuts.filter(s => s.starred).length > 0 && !selectedCategory && (
          <div style={{ marginBottom: '16px' }}>
            <div style={{
              fontSize: '11px',
              color: 'var(--text-secondary)',
              marginBottom: '8px',
              fontWeight: '600',
            }}>
              ⭐ 已收藏
            </div>
            <div style={{ display: 'grid', gap: '8px' }}>
              {shortcuts.filter(s => s.starred).map(s => (
                <ShortcutCard
                  key={s.id}
                  shortcut={s}
                  onCopy={copyToClipboard}
                  onToggleStar={() => toggleStar(s.id)}
                  onDelete={() => deleteShortcut(s.id)}
                  onEdit={() => setEditingShortcut(s)}
                />
              ))}
            </div>
          </div>
        )}

        {/* All Shortcuts */}
        <div style={{ display: 'grid', gap: '8px' }}>
          {filteredShortcuts.map(s => (
            <ShortcutCard
              key={s.id}
              shortcut={s}
              onCopy={copyToClipboard}
              onToggleStar={() => toggleStar(s.id)}
              onDelete={() => deleteShortcut(s.id)}
              onEdit={() => setEditingShortcut(s)}
            />
          ))}
        </div>

        {filteredShortcuts.length === 0 && (
          <div style={{
            textAlign: 'center',
            padding: '40px 20px',
            color: 'var(--text-secondary)',
          }}>
            <Book size={32} style={{ marginBottom: '12px', opacity: 0.5 }} />
            <div>没有找到匹配的快捷键</div>
          </div>
        )}
      </div>

      {/* Add Modal */}
      {showAddModal && (
        <AddShortcutModal
          onClose={() => setShowAddModal(false)}
          onAdd={addShortcut}
          categories={categories}
        />
      )}

      {/* Edit Modal */}
      {editingShortcut && (
        <EditShortcutModal
          shortcut={editingShortcut}
          onClose={() => setEditingShortcut(null)}
          onSave={(updates) => updateShortcut(editingShortcut.id, updates)}
          categories={categories}
        />
      )}
    </div>
  )
}

function ShortcutCard({
  shortcut,
  onCopy,
  onToggleStar,
  onDelete,
  onEdit,
}: {
  shortcut: Shortcut
  onCopy: (text: string) => void
  onToggleStar: () => void
  onDelete: () => void
  onEdit: () => void
}) {
  return (
    <div style={{
      padding: '12px',
      borderRadius: '8px',
      border: '1px solid var(--window-border)',
      background: 'var(--window-bg)',
      display: 'flex',
      alignItems: 'center',
      gap: '12px',
    }}>
      <div style={{
        padding: '6px',
        borderRadius: '6px',
        background: CATEGORY_COLORS[shortcut.category] || 'var(--accent)',
        color: 'white',
        display: 'flex',
      }}>
        {CATEGORY_ICONS[shortcut.category] || <Zap size={16} />}
      </div>

      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          marginBottom: '4px',
        }}>
          <span style={{ fontWeight: '600', fontSize: '13px' }}>{shortcut.title}</span>
          <span style={{
            padding: '2px 6px',
            borderRadius: '4px',
            background: 'var(--window-header-bg)',
            fontSize: '11px',
            color: 'var(--text-secondary)',
          }}>
            {shortcut.category}
          </span>
        </div>
        <div style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>
          {shortcut.description}
        </div>
      </div>

      <button
        onClick={() => onCopy(shortcut.keys)}
        style={{
          padding: '6px 12px',
          borderRadius: '6px',
          border: '1px solid var(--window-border)',
          background: 'var(--window-bg)',
          color: 'var(--text-primary)',
          cursor: 'pointer',
          fontFamily: 'JetBrains Mono, monospace',
          fontSize: '12px',
          fontWeight: '600',
          display: 'flex',
          alignItems: 'center',
          gap: '6px',
        }}
      >
        <Copy size={12} />
        {shortcut.keys}
      </button>

      <button
        onClick={onToggleStar}
        style={{
          padding: '6px',
          border: 'none',
          background: 'transparent',
          color: shortcut.starred ? '#fbbf24' : 'var(--text-secondary)',
          cursor: 'pointer',
        }}
      >
        <Star size={14} fill={shortcut.starred ? '#fbbf24' : 'transparent'} />
      </button>

      <button
        onClick={onEdit}
        style={{
          padding: '6px',
          border: 'none',
          background: 'transparent',
          color: 'var(--text-secondary)',
          cursor: 'pointer',
        }}
      >
        <Settings size={14} />
      </button>

      <button
        onClick={onDelete}
        style={{
          padding: '6px',
          border: 'none',
          background: 'transparent',
          color: 'var(--error)',
          cursor: 'pointer',
        }}
      >
        <Trash2 size={14} />
      </button>
    </div>
  )
}

function AddShortcutModal({
  onClose,
  onAdd,
  categories,
}: {
  onClose: () => void
  onAdd: (shortcut: Omit<Shortcut, 'id' | 'starred'>) => void
  categories: string[]
}) {
  const [category, setCategory] = useState(categories[0] || 'Custom')
  const [title, setTitle] = useState('')
  const [keys, setKeys] = useState('')
  const [description, setDescription] = useState('')

  return (
    <div style={{
      position: 'absolute',
      inset: 0,
      background: 'rgba(0, 0, 0, 0.5)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 1000,
    }}>
      <div style={{
        background: 'var(--window-bg)',
        borderRadius: '12px',
        padding: '24px',
        width: '400px',
        maxWidth: '90%',
      }}>
        <div style={{ marginBottom: '16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <h3 style={{ margin: 0 }}>添加快捷键</h3>
          <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer' }}>
            <X size={18} />
          </button>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          <div>
            <label style={{ display: 'block', marginBottom: '4px', fontSize: '12px' }}>分类</label>
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              style={{
                width: '100%',
                padding: '8px 12px',
                borderRadius: '6px',
                border: '1px solid var(--window-border)',
                background: 'var(--window-bg)',
                color: 'var(--text-primary)',
              }}
            >
              {categories.map(c => <option key={c} value={c}>{c}</option>)}
              <option value="Custom">自定义</option>
            </select>
          </div>

          <div>
            <label style={{ display: 'block', marginBottom: '4px', fontSize: '12px' }}>名称</label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="快捷键名称"
              style={{
                width: '100%',
                padding: '8px 12px',
                borderRadius: '6px',
                border: '1px solid var(--window-border)',
                background: 'var(--window-bg)',
                color: 'var(--text-primary)',
              }}
            />
          </div>

          <div>
            <label style={{ display: 'block', marginBottom: '4px', fontSize: '12px' }}>按键/命令</label>
            <input
              type="text"
              value={keys}
              onChange={(e) => setKeys(e.target.value)}
              placeholder="Cmd+Shift+P"
              style={{
                width: '100%',
                padding: '8px 12px',
                borderRadius: '6px',
                border: '1px solid var(--window-border)',
                background: 'var(--window-bg)',
                color: 'var(--text-primary)',
                fontFamily: 'JetBrains Mono, monospace',
              }}
            />
          </div>

          <div>
            <label style={{ display: 'block', marginBottom: '4px', fontSize: '12px' }}>描述</label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="快捷键描述..."
              rows={2}
              style={{
                width: '100%',
                padding: '8px 12px',
                borderRadius: '6px',
                border: '1px solid var(--window-border)',
                background: 'var(--window-bg)',
                color: 'var(--text-primary)',
                resize: 'none',
              }}
            />
          </div>

          <div style={{ display: 'flex', gap: '8px', marginTop: '8px' }}>
            <button
              onClick={onClose}
              style={{
                flex: 1,
                padding: '8px 12px',
                borderRadius: '6px',
                border: '1px solid var(--window-border)',
                background: 'var(--window-bg)',
                color: 'var(--text-primary)',
                cursor: 'pointer',
              }}
            >
              取消
            </button>
            <button
              onClick={() => onAdd({ category, title, keys, description })}
              disabled={!title || !keys}
              style={{
                flex: 1,
                padding: '8px 12px',
                borderRadius: '6px',
                border: 'none',
                background: 'var(--accent)',
                color: 'white',
                cursor: 'pointer',
                opacity: !title || !keys ? 0.5 : 1,
              }}
            >
              添加
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

function EditShortcutModal({
  shortcut,
  onClose,
  onSave,
  categories,
}: {
  shortcut: Shortcut
  onClose: () => void
  onSave: (updates: Partial<Shortcut>) => void
  categories: string[]
}) {
  const [category, setCategory] = useState(shortcut.category)
  const [title, setTitle] = useState(shortcut.title)
  const [keys, setKeys] = useState(shortcut.keys)
  const [description, setDescription] = useState(shortcut.description)

  return (
    <div style={{
      position: 'absolute',
      inset: 0,
      background: 'rgba(0, 0, 0, 0.5)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 1000,
    }}>
      <div style={{
        background: 'var(--window-bg)',
        borderRadius: '12px',
        padding: '24px',
        width: '400px',
        maxWidth: '90%',
      }}>
        <div style={{ marginBottom: '16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <h3 style={{ margin: 0 }}>编辑快捷键</h3>
          <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer' }}>
            <X size={18} />
          </button>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          <div>
            <label style={{ display: 'block', marginBottom: '4px', fontSize: '12px' }}>分类</label>
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              style={{
                width: '100%',
                padding: '8px 12px',
                borderRadius: '6px',
                border: '1px solid var(--window-border)',
                background: 'var(--window-bg)',
                color: 'var(--text-primary)',
              }}
            >
              {categories.map(c => <option key={c} value={c}>{c}</option>)}
              <option value="Custom">自定义</option>
            </select>
          </div>

          <div>
            <label style={{ display: 'block', marginBottom: '4px', fontSize: '12px' }}>名称</label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              style={{
                width: '100%',
                padding: '8px 12px',
                borderRadius: '6px',
                border: '1px solid var(--window-border)',
                background: 'var(--window-bg)',
                color: 'var(--text-primary)',
              }}
            />
          </div>

          <div>
            <label style={{ display: 'block', marginBottom: '4px', fontSize: '12px' }}>按键/命令</label>
            <input
              type="text"
              value={keys}
              onChange={(e) => setKeys(e.target.value)}
              style={{
                width: '100%',
                padding: '8px 12px',
                borderRadius: '6px',
                border: '1px solid var(--window-border)',
                background: 'var(--window-bg)',
                color: 'var(--text-primary)',
                fontFamily: 'JetBrains Mono, monospace',
              }}
            />
          </div>

          <div>
            <label style={{ display: 'block', marginBottom: '4px', fontSize: '12px' }}>描述</label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={2}
              style={{
                width: '100%',
                padding: '8px 12px',
                borderRadius: '6px',
                border: '1px solid var(--window-border)',
                background: 'var(--window-bg)',
                color: 'var(--text-primary)',
                resize: 'none',
              }}
            />
          </div>

          <div style={{ display: 'flex', gap: '8px', marginTop: '8px' }}>
            <button
              onClick={onClose}
              style={{
                flex: 1,
                padding: '8px 12px',
                borderRadius: '6px',
                border: '1px solid var(--window-border)',
                background: 'var(--window-bg)',
                color: 'var(--text-primary)',
                cursor: 'pointer',
              }}
            >
              取消
            </button>
            <button
              onClick={() => onSave({ category, title, keys, description })}
              style={{
                flex: 1,
                padding: '8px 12px',
                borderRadius: '6px',
                border: 'none',
                background: 'var(--accent)',
                color: 'white',
                cursor: 'pointer',
              }}
            >
              保存
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}