import { useState, useRef, useEffect, useCallback } from 'react'

interface NoteBlock {
  id: string
  type: 'text' | 'code' | 'heading' | 'checklist'
  content: string
  checked?: boolean
  language?: string
}

interface CollaborativeNotebook {
  id: string
  title: string
  blocks: NoteBlock[]
  collaborators: string[]
  lastModified: Date
  version: number
}

const LANGUAGES = ['javascript', 'typescript', 'python', 'java', 'cpp', 'go', 'rust', 'html', 'css']

export default function OnlineCollabNotebook() {
  const [notebook, setNotebook] = useState<CollaborativeNotebook>({
    id: 'default',
    title: '我的笔记本',
    blocks: [
      { id: '1', type: 'heading', content: '欢迎使用在线协作笔记本' },
      { id: '2', type: 'text', content: '这是一个功能强大的在线笔记本，支持文本、代码块、标题和待办事项。您可以添加多个笔记本，并且内容会自动保存到浏览器。' },
      { id: '3', type: 'heading', content: '功能特点' },
      { id: '4', type: 'checklist', content: '支持多种内容类型', checked: true },
      { id: '5', type: 'checklist', content: '实时自动保存', checked: true },
      { id: '6', type: 'checklist', content: '代码高亮显示', checked: true },
      { id: '7', type: 'code', content: '// 示例代码\nfunction greet(name) {\n  return `Hello, ${name}!`;\n}', language: 'javascript' },
    ],
    collaborators: ['User'],
    lastModified: new Date(),
    version: 1
  })
  
  const [saving, setSaving] = useState(false)
  const [showShare, setShowShare] = useState(false)
  const contentRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const saved = localStorage.getItem('collab-notebook')
    if (saved) {
      try {
        const parsed = JSON.parse(saved)
        setNotebook(parsed)
      } catch (e) {
        console.error('Failed to load notebook', e)
      }
    }
  }, [])

  const saveNotebook = useCallback(() => {
    setSaving(true)
    setTimeout(() => {
      localStorage.setItem('collab-notebook', JSON.stringify(notebook))
      setSaving(false)
    }, 500)
  }, [notebook])

  useEffect(() => {
    const timer = setTimeout(saveNotebook, 1000)
    return () => clearTimeout(timer)
  }, [notebook, saveNotebook])

  const addBlock = (type: NoteBlock['type'], afterId?: string) => {
    const newBlock: NoteBlock = {
      id: Date.now().toString(),
      type,
      content: '',
      checked: false,
      language: type === 'code' ? 'javascript' : undefined
    }
    
    const insertIndex = afterId
      ? notebook.blocks.findIndex(b => b.id === afterId) + 1
      : notebook.blocks.length
    
    const newBlocks = [...notebook.blocks]
    newBlocks.splice(insertIndex, 0, newBlock)
    
    setNotebook(prev => ({
      ...prev,
      blocks: newBlocks,
      lastModified: new Date(),
      version: prev.version + 1
    }))
  }

  const updateBlock = (id: string, updates: Partial<NoteBlock>) => {
    setNotebook(prev => ({
      ...prev,
      blocks: prev.blocks.map(block =>
        block.id === id ? { ...block, ...updates } : block
      ),
      lastModified: new Date(),
      version: prev.version + 1
    }))
  }

  const deleteBlock = (id: string) => {
    if (notebook.blocks.length <= 1) return
    
    setNotebook(prev => ({
      ...prev,
      blocks: prev.blocks.filter(block => block.id !== id),
      lastModified: new Date(),
      version: prev.version + 1
    }))
  }

  const moveBlock = (id: string, direction: 'up' | 'down') => {
    const blocks = [...notebook.blocks]
    const index = blocks.findIndex(b => b.id === id)
    
    if (direction === 'up' && index > 0) {
      [blocks[index - 1], blocks[index]] = [blocks[index], blocks[index - 1]]
    } else if (direction === 'down' && index < blocks.length - 1) {
      [blocks[index + 1], blocks[index]] = [blocks[index], blocks[index + 1]]
    }
    
    setNotebook(prev => ({
      ...prev,
      blocks,
      lastModified: new Date(),
      version: prev.version + 1
    }))
  }

  const renderBlock = (block: NoteBlock, index: number) => {
    const isFirst = index === 0
    const isLast = index === notebook.blocks.length - 1
    
    return (
      <div
        key={block.id}
        style={{
          position: 'relative',
          marginBottom: '12px',
          display: 'flex',
          alignItems: 'flex-start',
          gap: '12px',
          padding: '12px',
          backgroundColor: 'var(--bg-secondary)',
          borderRadius: '8px',
          border: '1px solid var(--border-color)',
          transition: 'all 0.2s'
        }}
      >
        {/* 操作按钮 */}
        <div style={{
          display: 'flex',
          flexDirection: 'column',
          gap: '4px',
          opacity: 0.3,
          transition: 'opacity 0.2s'
        }}>
          <button
            onClick={() => moveBlock(block.id, 'up')}
            disabled={isFirst}
            style={{
              padding: '4px 8px',
              backgroundColor: 'transparent',
              border: '1px solid var(--border-color)',
              borderRadius: '4px',
              cursor: isFirst ? 'not-allowed' : 'pointer',
              fontSize: '12px'
            }}
          >
            ↑
          </button>
          <button
            onClick={() => moveBlock(block.id, 'down')}
            disabled={isLast}
            style={{
              padding: '4px 8px',
              backgroundColor: 'transparent',
              border: '1px solid var(--border-color)',
              borderRadius: '4px',
              cursor: isLast ? 'not-allowed' : 'pointer',
              fontSize: '12px'
            }}
          >
            ↓
          </button>
        </div>
        
        {/* 内容区域 */}
        <div style={{ flex: 1 }}>
          {block.type === 'heading' && (
            <input
              type="text"
              value={block.content}
              onChange={(e) => updateBlock(block.id, { content: e.target.value })}
              placeholder="标题..."
              style={{
                width: '100%',
                padding: '8px 12px',
                backgroundColor: 'var(--bg-tertiary)',
                border: 'none',
                borderRadius: '6px',
                color: 'var(--text-color)',
                fontSize: '20px',
                fontWeight: 600,
                fontFamily: 'inherit'
              }}
            />
          )}
          
          {block.type === 'text' && (
            <textarea
              value={block.content}
              onChange={(e) => updateBlock(block.id, { content: e.target.value })}
              placeholder="输入文本内容..."
              style={{
                width: '100%',
                minHeight: '80px',
                padding: '8px 12px',
                backgroundColor: 'var(--bg-tertiary)',
                border: 'none',
                borderRadius: '6px',
                color: 'var(--text-color)',
                fontSize: '14px',
                fontFamily: 'inherit',
                resize: 'vertical'
              }}
            />
          )}
          
          {block.type === 'checklist' && (
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <input
                type="checkbox"
                checked={block.checked || false}
                onChange={(e) => updateBlock(block.id, { checked: e.target.checked })}
                style={{ width: '18px', height: '18px', cursor: 'pointer' }}
              />
              <input
                type="text"
                value={block.content}
                onChange={(e) => updateBlock(block.id, { content: e.target.value })}
                placeholder="待办事项..."
                style={{
                  flex: 1,
                  padding: '8px 12px',
                  backgroundColor: 'var(--bg-tertiary)',
                  border: 'none',
                  borderRadius: '6px',
                  color: 'var(--text-color)',
                  fontSize: '14px',
                  textDecoration: block.checked ? 'line-through' : 'none',
                  opacity: block.checked ? 0.6 : 1
                }}
              />
            </div>
          )}
          
          {block.type === 'code' && (
            <div>
              <div style={{ marginBottom: '8px', display: 'flex', gap: '8px', alignItems: 'center' }}>
                <select
                  value={block.language || 'javascript'}
                  onChange={(e) => updateBlock(block.id, { language: e.target.value })}
                  style={{
                    padding: '4px 8px',
                    backgroundColor: 'var(--bg-tertiary)',
                    border: '1px solid var(--border-color)',
                    borderRadius: '4px',
                    color: 'var(--text-color)',
                    fontSize: '12px'
                  }}
                >
                  {LANGUAGES.map(lang => (
                    <option key={lang} value={lang}>{lang}</option>
                  ))}
                </select>
                <span style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>
                  代码块
                </span>
              </div>
              <textarea
                value={block.content}
                onChange={(e) => updateBlock(block.id, { content: e.target.value })}
                placeholder="输入代码..."
                style={{
                  width: '100%',
                  minHeight: '120px',
                  padding: '12px',
                  backgroundColor: 'var(--bg-tertiary)',
                  border: '1px solid var(--border-color)',
                  borderRadius: '6px',
                  color: 'var(--text-color)',
                  fontSize: '13px',
                  fontFamily: 'monospace',
                  resize: 'vertical'
                }}
              />
            </div>
          )}
        </div>
        
        {/* 删除按钮 */}
        <button
          onClick={() => deleteBlock(block.id)}
          style={{
            padding: '8px',
            backgroundColor: 'transparent',
            border: 'none',
            color: 'var(--text-secondary)',
            cursor: 'pointer',
            fontSize: '16px',
            opacity: 0.3,
            transition: 'opacity 0.2s'
          }}
        >
          ×
        </button>
      </div>
    )
  }

  return (
    <div style={{
      height: '100%',
      display: 'flex',
      flexDirection: 'column',
      backgroundColor: 'var(--bg-color)',
      color: 'var(--text-color)'
    }}>
      {/* 顶部工具栏 */}
      <div style={{
        padding: '12px 20px',
        backgroundColor: 'var(--bg-secondary)',
        borderBottom: '1px solid var(--border-color)',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          <input
            type="text"
            value={notebook.title}
            onChange={(e) => setNotebook(prev => ({ ...prev, title: e.target.value }))}
            style={{
              padding: '8px 12px',
              backgroundColor: 'transparent',
              border: 'none',
              color: 'var(--text-color)',
              fontSize: '18px',
              fontWeight: 600,
              fontFamily: 'inherit'
            }}
          />
          {saving && (
            <span style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>
              保存中...
            </span>
          )}
        </div>
        
        <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
          <div style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>
            版本 {notebook.version} | 最后修改: {notebook.lastModified.toLocaleTimeString()}
          </div>
          <button
            onClick={() => setShowShare(!showShare)}
            style={{
              padding: '6px 12px',
              backgroundColor: 'var(--accent-color)',
              color: 'white',
              border: 'none',
              borderRadius: '6px',
              cursor: 'pointer',
              fontSize: '12px',
              fontWeight: 500
            }}
          >
            分享
          </button>
        </div>
      </div>
      
      {/* 添加内容工具栏 */}
      <div style={{
        padding: '12px 20px',
        backgroundColor: 'var(--bg-secondary)',
        borderBottom: '1px solid var(--border-color)',
        display: 'flex',
        gap: '12px'
      }}>
        <button
          onClick={() => addBlock('heading')}
          style={{
            padding: '8px 16px',
            backgroundColor: 'var(--bg-tertiary)',
            border: '1px solid var(--border-color)',
            borderRadius: '6px',
            cursor: 'pointer',
            fontSize: '13px',
            display: 'flex',
            alignItems: 'center',
            gap: '6px'
          }}
        >
          <span style={{ fontSize: '16px' }}>H</span> 标题
        </button>
        <button
          onClick={() => addBlock('text')}
          style={{
            padding: '8px 16px',
            backgroundColor: 'var(--bg-tertiary)',
            border: '1px solid var(--border-color)',
            borderRadius: '6px',
            cursor: 'pointer',
            fontSize: '13px'
          }}
        >
          文本
        </button>
        <button
          onClick={() => addBlock('checklist')}
          style={{
            padding: '8px 16px',
            backgroundColor: 'var(--bg-tertiary)',
            border: '1px solid var(--border-color)',
            borderRadius: '6px',
            cursor: 'pointer',
            fontSize: '13px',
            display: 'flex',
            alignItems: 'center',
            gap: '6px'
          }}
        >
          ☑ 待办
        </button>
        <button
          onClick={() => addBlock('code')}
          style={{
            padding: '8px 16px',
            backgroundColor: 'var(--bg-tertiary)',
            border: '1px solid var(--border-color)',
            borderRadius: '6px',
            cursor: 'pointer',
            fontSize: '13px',
            display: 'flex',
            alignItems: 'center',
            gap: '6px'
          }}
        >
          {'</>'} 代码
        </button>
      </div>
      
      {/* 内容区域 */}
      <div
        ref={contentRef}
        style={{
          flex: 1,
          overflowY: 'auto',
          padding: '20px'
        }}
      >
        {notebook.blocks.map((block, index) => renderBlock(block, index))}
        
        {/* 快速添加按钮 */}
        <div style={{
          textAlign: 'center',
          padding: '20px',
          color: 'var(--text-secondary)',
          fontSize: '13px'
        }}>
          点击上方按钮添加内容
        </div>
      </div>
      
      {/* 分享对话框 */}
      {showShare && (
        <div style={{
          position: 'absolute',
          top: '50%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
          backgroundColor: 'var(--bg-secondary)',
          padding: '24px',
          borderRadius: '12px',
          border: '1px solid var(--border-color)',
          boxShadow: '0 4px 20px rgba(0,0,0,0.3)',
          zIndex: 1000
        }}>
          <h3 style={{ margin: '0 0 16px', fontSize: '16px' }}>分享笔记本</h3>
          <p style={{ fontSize: '13px', color: 'var(--text-secondary)', marginBottom: '16px' }}>
            当前为本地笔记本。未来可接入云服务实现多人协作。
          </p>
          <button
            onClick={() => setShowShare(false)}
            style={{
              width: '100%',
              padding: '10px',
              backgroundColor: 'var(--accent-color)',
              color: 'white',
              border: 'none',
              borderRadius: '6px',
              cursor: 'pointer',
              fontSize: '13px'
            }}
          >
            关闭
          </button>
        </div>
      )}
    </div>
  )
}