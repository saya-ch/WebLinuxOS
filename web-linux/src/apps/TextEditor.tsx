import { useState, useRef, useCallback } from 'react'
import { useStore } from '../store'
import type { FileNode } from '../types'

function flattenFiles(nodes: FileNode[]): FileNode[] {
  const result: FileNode[] = []
  const walk = (list: FileNode[]) => {
    for (const node of list) {
      result.push(node)
      if (node.children) walk(node.children)
    }
  }
  walk(nodes)
  return result
}

const menuStyle: React.CSSProperties = {
  display: 'flex', alignItems: 'center', gap: 0,
  background: '#2d2d2d', color: '#ccc', padding: '2px 0', borderBottom: '1px solid #444',
  fontSize: 12, userSelect: 'none'
}

const menuItemStyle: React.CSSProperties = {
  padding: '3px 10px', cursor: 'pointer', borderRadius: 3
}

const toolbarStyle: React.CSSProperties = {
  display: 'flex', alignItems: 'center', gap: 2,
  background: '#3a3a3a', padding: '4px 6px', borderBottom: '1px solid #444'
}

const toolbarBtn: React.CSSProperties = {
  background: 'transparent', border: 'none', color: '#ccc', cursor: 'pointer',
  padding: '4px 8px', borderRadius: 3, fontSize: 12, fontWeight: 600
}

const separatorStyle: React.CSSProperties = {
  width: 1, height: 18, background: '#555', margin: '0 4px'
}

export default function TextEditor() {
  const { files, updateFileContent } = useStore()
  const allFiles = flattenFiles(files).filter((f) => f.type === 'file')

  const [openFileId, setOpenFileId] = useState<string | null>(null)
  const [content, setContent] = useState('')
  const [cursorPos, setCursorPos] = useState({ line: 1, col: 1 })
  const [showOpenDialog, setShowOpenDialog] = useState(false)
  const [activeMenu, setActiveMenu] = useState<string | null>(null)
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  const openFile = useCallback((file: FileNode) => {
    setOpenFileId(file.id)
    setContent(file.content || '')
  }, [])

  const handleSave = useCallback(() => {
    if (openFileId) {
      updateFileContent(openFileId, content)
    }
  }, [openFileId, content, updateFileContent])

  const handleUndo = () => document.execCommand('undo')
  const handleRedo = () => document.execCommand('redo')
  const handleCut = () => document.execCommand('cut')
  const handleCopy = () => document.execCommand('copy')
  const handlePaste = () => document.execCommand('paste')

  const handleCursorChange = () => {
    const ta = textareaRef.current
    if (!ta) return
    const pos = ta.selectionStart
    const lines = ta.value.substring(0, pos).split('\n')
    setCursorPos({ line: lines.length, col: lines[lines.length - 1].length + 1 })
  }

  const menuItems = ['文件', '编辑', '查看', '工具']
  const menuContent: Record<string, string[]> = {
    '文件': ['新建', '打开...', '保存', '另存为...', '──', '退出'],
    '编辑': ['撤销', '重做', '──', '剪切', '复制', '粘贴', '──', '全选', '查找替换...'],
    '查看': ['工具栏', '状态栏', '──', '自动换行'],
    '工具': ['字数统计', '拼写检查'],
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', background: '#1e1e1e', color: '#d4d4d4', fontFamily: 'sans-serif' }}>
      <div style={menuStyle}>
        {menuItems.map((item) => (
          <div key={item} style={{ position: 'relative' }}>
            <div
              style={{ ...menuItemStyle, background: activeMenu === item ? '#444' : 'transparent' }}
              onClick={() => setActiveMenu(activeMenu === item ? null : item)}
            >
              {item}
            </div>
            {activeMenu === item && (
              <div style={{ position: 'absolute', top: '100%', left: 0, background: '#333', border: '1px solid #555', minWidth: 150, zIndex: 100, borderRadius: 4 }}>
                {menuContent[item].map((action, i) =>
                  action === '──' ? (
                    <div key={i} style={{ height: 1, background: '#555', margin: '3px 6px' }} />
                  ) : (
                    <div
                      key={action}
                      style={{ padding: '5px 16px', cursor: 'pointer', fontSize: 12 }}
                      onClick={() => {
                        if (action === '打开...') setShowOpenDialog(true)
                        if (action === '保存') handleSave()
                        setActiveMenu(null)
                      }}
                      onMouseEnter={(e) => (e.currentTarget.style.background = '#094771')}
                      onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
                    >
                      {action}
                    </div>
                  )
                )}
              </div>
            )}
          </div>
        ))}
      </div>

      <div style={toolbarStyle}>
        <button style={toolbarBtn} onClick={handleSave} title="新建">📄</button>
        <button style={toolbarBtn} onClick={() => setShowOpenDialog(true)} title="打开">📂</button>
        <button style={toolbarBtn} onClick={handleSave} title="保存">💾</button>
        <div style={separatorStyle} />
        <button style={toolbarBtn} onClick={handleUndo} title="撤销">↩</button>
        <button style={toolbarBtn} onClick={handleRedo} title="重做">↪</button>
        <div style={separatorStyle} />
        <button style={toolbarBtn} onClick={handleCut} title="剪切">✂</button>
        <button style={toolbarBtn} onClick={handleCopy} title="复制">📋</button>
        <button style={toolbarBtn} onClick={handlePaste} title="粘贴">📌</button>
        <div style={separatorStyle} />
        <button style={toolbarBtn} title="查找替换">🔍</button>
      </div>

      <div style={{ flex: 1, position: 'relative', overflow: 'hidden' }}>
        {showOpenDialog && (
          <div style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.6)', zIndex: 50, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <div style={{ background: '#2d2d2d', border: '1px solid #555', borderRadius: 8, padding: 16, minWidth: 400, maxHeight: 400, overflow: 'auto' }}>
              <h3 style={{ margin: '0 0 10px', fontSize: 14 }}>打开文件</h3>
              {allFiles.map((f) => (
                <div
                  key={f.id}
                  style={{ padding: '6px 10px', cursor: 'pointer', borderRadius: 3, fontSize: 13 }}
                  onClick={() => { openFile(f); setShowOpenDialog(false) }}
                  onMouseEnter={(e) => (e.currentTarget.style.background = '#094771')}
                  onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
                >
                  📄 {f.name}
                </div>
              ))}
              <button
                style={{ marginTop: 10, padding: '5px 14px', background: '#555', border: 'none', color: '#ccc', borderRadius: 4, cursor: 'pointer' }}
                onClick={() => setShowOpenDialog(false)}
              >
                取消
              </button>
            </div>
          </div>
        )}

        <textarea
          ref={textareaRef}
          value={content}
          onChange={(e) => { setContent(e.target.value); handleCursorChange() }}
          onKeyUp={handleCursorChange}
          onClick={handleCursorChange}
          style={{
            width: '100%', height: '100%', background: '#1e1e1e', color: '#d4d4d4',
            border: 'none', outline: 'none', resize: 'none', padding: 12,
            fontSize: 14, fontFamily: 'monospace', lineHeight: 1.6, boxSizing: 'border-box'
          }}
          placeholder="在此输入文本..."
        />
      </div>

      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: '#007acc', color: '#fff', padding: '2px 10px', fontSize: 11, fontFamily: 'monospace' }}>
        <div style={{ display: 'flex', gap: 16 }}>
          <span>行 {cursorPos.line}, 列 {cursorPos.col}</span>
        </div>
        <div style={{ display: 'flex', gap: 16 }}>
          <span>{openFileId ? allFiles.find((f) => f.id === openFileId)?.name || '未命名' : '未命名'}</span>
          <span>纯文本</span>
          <span>UTF-8</span>
        </div>
      </div>
    </div>
  )
}