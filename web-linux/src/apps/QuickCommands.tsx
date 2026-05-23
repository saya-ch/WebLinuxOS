import { useState, useEffect, useCallback, memo } from 'react'
import { useStore } from '../store'

interface QuickCommand {
  id: string
  name: string
  command: string
  category: string
  icon: string
  lastUsed?: Date
  useCount: number
}

const defaultCommands: QuickCommand[] = [
  { id: '1', name: '系统信息', command: 'uname -a && cat /etc/hostname', category: '系统', icon: '💻', useCount: 0 },
  { id: '2', name: '磁盘使用', command: 'df -h', category: '系统', icon: '💾', useCount: 0 },
  { id: '3', name: '进程列表', command: 'ps aux | head -20', category: '系统', icon: '📊', useCount: 0 },
  { id: '4', name: '网络状态', command: 'netstat -tuln', category: '网络', icon: '🌐', useCount: 0 },
  { id: '5', name: '当前用户', command: 'whoami && echo "---" && id', category: '用户', icon: '👤', useCount: 0 },
  { id: '6', name: '日历', command: 'cal && date', category: '工具', icon: '📅', useCount: 0 },
  { id: '7', name: '内存使用', command: 'free -m', category: '系统', icon: '🧠', useCount: 0 },
  { id: '8', name: '系统日志', command: 'tail -20 /var/log/syslog', category: '系统', icon: '📋', useCount: 0 },
]

const QuickCommands = memo(function QuickCommands() {
  const [commands, setCommands] = useState<QuickCommand[]>([])
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [showEditor, setShowEditor] = useState(false)
  const [editingCommand, setEditingCommand] = useState<Partial<QuickCommand> | null>(null)
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedCategory, setSelectedCategory] = useState<string>('全部')
  const [copiedId, setCopiedId] = useState<string | null>(null)

  useEffect(() => {
    const stored = localStorage.getItem('quick-commands')
    if (stored) {
      try {
        const parsed = JSON.parse(stored)
        setCommands(parsed)
      } catch (e) {
        setCommands(defaultCommands)
      }
    } else {
      setCommands(defaultCommands)
    }
  }, [])

  useEffect(() => {
    if (commands.length > 0) {
      localStorage.setItem('quick-commands', JSON.stringify(commands))
    }
  }, [commands])

  const categories = ['全部', ...Array.from(new Set(commands.map((c) => c.category)))]

  const filteredCommands = commands.filter((cmd) => {
    const matchSearch = cmd.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                       cmd.command.toLowerCase().includes(searchQuery.toLowerCase())
    const matchCategory = selectedCategory === '全部' || cmd.category === selectedCategory
    return matchSearch && matchCategory
  })

  const copyCommand = useCallback((command: QuickCommand) => {
    navigator.clipboard.writeText(command.command)
    setCommands((prev) =>
      prev.map((c) =>
        c.id === command.id ? { ...c, useCount: c.useCount + 1, lastUsed: new Date() } : c
      )
    )
    setCopiedId(command.id)
    setTimeout(() => setCopiedId(null), 2000)
  }, [])

  const saveCommand = useCallback(() => {
    if (!editingCommand?.name || !editingCommand?.command) return

    if (editingCommand.id) {
      setCommands((prev) =>
        prev.map((c) => (c.id === editingCommand.id ? { ...c, ...editingCommand } as QuickCommand : c))
      )
    } else {
      const newCommand: QuickCommand = {
        id: `cmd-${Date.now()}`,
        name: editingCommand.name,
        command: editingCommand.command,
        category: editingCommand.category || '自定义',
        icon: editingCommand.icon || '⚡',
        useCount: 0,
      }
      setCommands((prev) => [...prev, newCommand])
    }
    setShowEditor(false)
    setEditingCommand(null)
  }, [editingCommand])

  const deleteCommand = useCallback((id: string) => {
    setCommands((prev) => prev.filter((c) => c.id !== id))
    if (selectedId === id) setSelectedId(null)
  }, [selectedId])

  const formatLastUsed = (date?: Date) => {
    if (!date) return '从未使用'
    const now = new Date()
    const diff = now.getTime() - date.getTime()
    const minutes = Math.floor(diff / 60000)
    if (minutes < 1) return '刚刚'
    if (minutes < 60) return `${minutes}分钟前`
    return `${Math.floor(minutes / 60)}小时前`
  }

  const selectedCommand = commands.find((c) => c.id === selectedId)

  return (
    <div
      style={{
        display: 'flex',
        height: '100%',
        background: 'var(--bg-secondary)',
      }}
    >
      <div
        style={{
          width: '320px',
          borderRight: '1px solid var(--border)',
          display: 'flex',
          flexDirection: 'column',
        }}
      >
        <div style={{ padding: '12px', borderBottom: '1px solid var(--border)' }}>
          <input
            type="text"
            placeholder="🔍 搜索命令..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            style={{
              width: '100%',
              padding: '8px 12px',
              borderRadius: '6px',
              border: '1px solid var(--border)',
              background: 'var(--bg-primary)',
              color: 'var(--text-primary)',
              fontSize: '13px',
              outline: 'none',
              marginBottom: '8px',
            }}
          />
          <div style={{ display: 'flex', gap: '4px', flexWrap: 'wrap' }}>
            {categories.map((cat) => (
              <button
                key={cat}
                onClick={() => setSelectedCategory(cat)}
                style={{
                  padding: '4px 10px',
                  borderRadius: '12px',
                  border: 'none',
                  background: selectedCategory === cat ? 'var(--accent)' : 'var(--bg-primary)',
                  color: selectedCategory === cat ? '#fff' : 'var(--text-secondary)',
                  fontSize: '11px',
                  cursor: 'pointer',
                  transition: 'all 0.2s',
                }}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>

        <div style={{ flex: 1, overflowY: 'auto', padding: '8px' }}>
          {filteredCommands.map((cmd) => (
            <div
              key={cmd.id}
              onClick={() => setSelectedId(cmd.id)}
              style={{
                padding: '12px',
                marginBottom: '4px',
                borderRadius: '8px',
                cursor: 'pointer',
                background: selectedId === cmd.id ? 'var(--accent)' : 'var(--bg-primary)',
                color: selectedId === cmd.id ? '#fff' : 'var(--text-primary)',
                transition: 'all 0.2s',
                border: selectedId === cmd.id ? '2px solid var(--accent)' : '2px solid transparent',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                <span style={{ fontSize: '18px' }}>{cmd.icon}</span>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: '14px', fontWeight: 600 }}>{cmd.name}</div>
                  <div
                    style={{
                      fontSize: '11px',
                      color: selectedId === cmd.id ? 'rgba(255,255,255,0.7)' : 'var(--text-secondary)',
                    }}
                  >
                    {cmd.category}
                  </div>
                </div>
                <div
                  style={{
                    fontSize: '10px',
                    padding: '2px 6px',
                    borderRadius: '10px',
                    background: selectedId === cmd.id ? 'rgba(255,255,255,0.2)' : 'var(--bg-secondary)',
                    color: selectedId === cmd.id ? '#fff' : 'var(--text-secondary)',
                  }}
                >
                  {cmd.useCount}次
                </div>
              </div>
            </div>
          ))}
        </div>

        <div style={{ padding: '12px', borderTop: '1px solid var(--border)' }}>
          <button
            onClick={() => {
              setEditingCommand({ name: '', command: '', category: '自定义', icon: '⚡' })
              setShowEditor(true)
            }}
            style={{
              width: '100%',
              padding: '10px',
              borderRadius: '6px',
              border: 'none',
              background: 'var(--accent)',
              color: '#fff',
              cursor: 'pointer',
              fontSize: '14px',
              fontWeight: 600,
              transition: 'all 0.2s',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.opacity = '0.9'
              e.currentTarget.style.transform = 'scale(1.02)'
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.opacity = '1'
              e.currentTarget.style.transform = 'scale(1)'
            }}
          >
            ➕ 新建命令
          </button>
        </div>
      </div>

      <div style={{ flex: 1, padding: '16px', overflowY: 'auto' }}>
        {showEditor ? (
          <div>
            <h3 style={{ marginBottom: '16px', fontSize: '18px' }}>
              {editingCommand?.id ? '✏️ 编辑命令' : '➕ 新建命令'}
            </h3>
            <div style={{ marginBottom: '16px' }}>
              <label style={{ display: 'block', marginBottom: '6px', fontSize: '13px', fontWeight: 600 }}>
                命令名称
              </label>
              <input
                type="text"
                value={editingCommand?.name || ''}
                onChange={(e) => setEditingCommand((prev) => ({ ...prev, name: e.target.value }))}
                placeholder="例如：查看系统信息"
                style={{
                  width: '100%',
                  padding: '10px',
                  borderRadius: '6px',
                  border: '1px solid var(--border)',
                  background: 'var(--bg-primary)',
                  color: 'var(--text-primary)',
                  fontSize: '14px',
                }}
              />
            </div>
            <div style={{ marginBottom: '16px' }}>
              <label style={{ display: 'block', marginBottom: '6px', fontSize: '13px', fontWeight: 600 }}>
                命令内容
              </label>
              <textarea
                value={editingCommand?.command || ''}
                onChange={(e) => setEditingCommand((prev) => ({ ...prev, command: e.target.value }))}
                placeholder="输入终端命令..."
                style={{
                  width: '100%',
                  padding: '10px',
                  borderRadius: '6px',
                  border: '1px solid var(--border)',
                  background: 'var(--bg-primary)',
                  color: 'var(--text-primary)',
                  fontSize: '14px',
                  minHeight: '100px',
                  fontFamily: 'monospace',
                  resize: 'vertical',
                }}
              />
            </div>
            <div style={{ display: 'flex', gap: '12px', marginBottom: '16px' }}>
              <div style={{ flex: 1 }}>
                <label style={{ display: 'block', marginBottom: '6px', fontSize: '13px', fontWeight: 600 }}>
                  图标
                </label>
                <input
                  type="text"
                  value={editingCommand?.icon || ''}
                  onChange={(e) => setEditingCommand((prev) => ({ ...prev, icon: e.target.value }))}
                  placeholder="选择一个emoji"
                  style={{
                    width: '100%',
                    padding: '10px',
                    borderRadius: '6px',
                    border: '1px solid var(--border)',
                    background: 'var(--bg-primary)',
                    color: 'var(--text-primary)',
                    fontSize: '14px',
                  }}
                />
              </div>
              <div style={{ flex: 1 }}>
                <label style={{ display: 'block', marginBottom: '6px', fontSize: '13px', fontWeight: 600 }}>
                  分类
                </label>
                <input
                  type="text"
                  value={editingCommand?.category || ''}
                  onChange={(e) => setEditingCommand((prev) => ({ ...prev, category: e.target.value }))}
                  placeholder="例如：系统工具"
                  style={{
                    width: '100%',
                    padding: '10px',
                    borderRadius: '6px',
                    border: '1px solid var(--border)',
                    background: 'var(--bg-primary)',
                    color: 'var(--text-primary)',
                    fontSize: '14px',
                  }}
                />
              </div>
            </div>
            <div style={{ display: 'flex', gap: '12px' }}>
              <button
                onClick={saveCommand}
                style={{
                  flex: 1,
                  padding: '10px',
                  borderRadius: '6px',
                  border: 'none',
                  background: 'var(--accent)',
                  color: '#fff',
                  cursor: 'pointer',
                  fontSize: '14px',
                  fontWeight: 600,
                }}
              >
                💾 保存
              </button>
              <button
                onClick={() => {
                  setShowEditor(false)
                  setEditingCommand(null)
                }}
                style={{
                  flex: 1,
                  padding: '10px',
                  borderRadius: '6px',
                  border: '1px solid var(--border)',
                  background: 'transparent',
                  color: 'var(--text-secondary)',
                  cursor: 'pointer',
                  fontSize: '14px',
                }}
              >
                取消
              </button>
            </div>
          </div>
        ) : selectedCommand ? (
          <>
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'flex-start',
                marginBottom: '16px',
              }}
            >
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '8px' }}>
                  <span style={{ fontSize: '32px' }}>{selectedCommand.icon}</span>
                  <div>
                    <h2 style={{ margin: 0, fontSize: '20px', fontWeight: 600 }}>{selectedCommand.name}</h2>
                    <div style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>
                      分类: {selectedCommand.category} · 使用 {selectedCommand.useCount} 次
                    </div>
                  </div>
                </div>
              </div>
              <div style={{ display: 'flex', gap: '8px' }}>
                <button
                  onClick={() => copyCommand(selectedCommand)}
                  style={{
                    padding: '10px 20px',
                    borderRadius: '6px',
                    border: 'none',
                    background: copiedId === selectedCommand.id ? '#27ae60' : 'var(--accent)',
                    color: '#fff',
                    cursor: 'pointer',
                    fontSize: '14px',
                    fontWeight: 600,
                    transition: 'all 0.2s',
                  }}
                >
                  {copiedId === selectedCommand.id ? '✓ 已复制' : '📋 复制命令'}
                </button>
                <button
                  onClick={() => {
                    setEditingCommand(selectedCommand)
                    setShowEditor(true)
                  }}
                  style={{
                    padding: '10px 20px',
                    borderRadius: '6px',
                    border: '1px solid var(--border)',
                    background: 'transparent',
                    color: 'var(--text-secondary)',
                    cursor: 'pointer',
                    fontSize: '14px',
                  }}
                >
                  ✏️ 编辑
                </button>
                <button
                  onClick={() => deleteCommand(selectedCommand.id)}
                  style={{
                    padding: '10px 20px',
                    borderRadius: '6px',
                    border: '1px solid rgba(231, 76, 60, 0.3)',
                    background: 'transparent',
                    color: '#e74c3c',
                    cursor: 'pointer',
                    fontSize: '14px',
                  }}
                >
                  🗑️
                </button>
              </div>
            </div>
            <div
              style={{
                padding: '16px',
                borderRadius: '8px',
                background: 'var(--bg-primary)',
                border: '1px solid var(--border)',
                fontFamily: 'monospace',
                fontSize: '14px',
                lineHeight: 1.6,
                whiteSpace: 'pre-wrap',
                wordBreak: 'break-all',
                color: 'var(--text-primary)',
              }}
            >
              {selectedCommand.command}
            </div>
            <div
              style={{
                marginTop: '12px',
                fontSize: '12px',
                color: 'var(--text-secondary)',
              }}
            >
              最后使用: {formatLastUsed(selectedCommand.lastUsed)}
            </div>
          </>
        ) : (
          <div
            style={{
              textAlign: 'center',
              padding: '60px 20px',
              color: 'var(--text-secondary)',
            }}
          >
            <div style={{ fontSize: '64px', marginBottom: '16px' }}>⚡</div>
            <div style={{ fontSize: '16px' }}>选择或创建快捷命令</div>
            <div style={{ fontSize: '13px', marginTop: '8px' }}>
              点击左侧列表中的命令查看详情
            </div>
          </div>
        )}
      </div>
    </div>
  )
})

export default QuickCommands
