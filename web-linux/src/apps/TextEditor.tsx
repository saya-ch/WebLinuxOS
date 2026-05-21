import { useState, useRef, useCallback, useEffect, useMemo } from 'react'
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

export default function TextEditor() {
  const files = useStore((s) => s.files)
  const updateFileContent = useStore((s) => s.updateFileContent)

  const allFiles = useMemo(() => flattenFiles(files).filter((f) => f.type === 'file'), [files])

  const [openFileId, setOpenFileId] = useState<string | null>(null)
  const [content, setContent] = useState('')
  const [savedContent, setSavedContent] = useState('')
  const [cursorPos, setCursorPos] = useState({ line: 1, col: 1 })
  const [showOpenDialog, setShowOpenDialog] = useState(false)
  const [activeMenu, setActiveMenu] = useState<string | null>(null)
  const [findText, setFindText] = useState('')
  const [showFind, setShowFind] = useState(false)
  const [wordWrap, setWordWrap] = useState(true)
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  const openFile = useCallback((file: FileNode) => {
    setOpenFileId(file.id)
    setContent(file.content || '')
    setSavedContent(file.content || '')
  }, [])

  const handleSave = useCallback(() => {
    if (openFileId) {
      updateFileContent(openFileId, content)
      setSavedContent(content)
    }
  }, [openFileId, content, updateFileContent])

  const handleNew = useCallback(() => {
    setOpenFileId(null)
    setContent('')
    setSavedContent('')
  }, [])

  const handleUndo = useCallback(() => document.execCommand('undo'), [])
  const handleRedo = useCallback(() => document.execCommand('redo'), [])
  const handleCut = useCallback(() => document.execCommand('cut'), [])
  const handleCopy = useCallback(() => document.execCommand('copy'), [])
  const handlePaste = useCallback(() => document.execCommand('paste'), [])

  const handleFind = useCallback(() => {
    setShowFind(true)
  }, [])

  const handleFindNext = useCallback(() => {
    if (!findText || !textareaRef.current) return
    const ta = textareaRef.current
    const idx = ta.value.indexOf(findText, ta.selectionEnd)
    if (idx !== -1) {
      ta.setSelectionRange(idx, idx + findText.length)
      ta.focus()
    }
  }, [findText])

  const handleCursorChange = useCallback(() => {
    const ta = textareaRef.current
    if (!ta) return
    const pos = ta.selectionStart
    const lines = ta.value.substring(0, pos).split('\n')
    setCursorPos({ line: lines.length, col: lines[lines.length - 1].length + 1 })
  }, [])

  const isUnsaved = content !== savedContent

  const currentFileName = openFileId ? allFiles.find((f) => f.id === openFileId)?.name || '未命名' : '未命名'

  useEffect(() => {
    const handler = (e: Event) => {
      const detail = (e as CustomEvent).detail
      if (detail.appId === 'text-editor' && detail.fileId) {
        const findFile = (nodes: FileNode[]): FileNode | undefined => {
          for (const n of nodes) {
            if (n.id === detail.fileId) return n
            if (n.children) { const f = findFile(n.children); if (f) return f }
          }
          return undefined
        }
        const file = findFile(files)
        if (file && file.type === 'file') openFile(file)
      }
    }
    window.addEventListener('open-file', handler)
    return () => window.removeEventListener('open-file', handler)
  }, [files, openFile])

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 's') {
        e.preventDefault()
        handleSave()
      }
      if ((e.ctrlKey || e.metaKey) && e.key === 'f') {
        e.preventDefault()
        setShowFind(true)
      }
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [handleSave])

  useEffect(() => {
    const handler = () => setActiveMenu(null)
    window.addEventListener('click', handler)
    return () => window.removeEventListener('click', handler)
  }, [])

  // handleSelectAll 不使用 useCallback 避免依赖问题，直接实现简单功能
  const handleWordCount = useCallback(() => {
    alert(`字数: ${content.length} | 行数: ${content.split('\n').length}`)
  }, [content])

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', background: '#1e1e2e', color: '#cdd6f4', fontFamily: 'sans-serif' }}>
      <div style={{ display: 'flex', alignItems: 'center', background: '#313244', color: '#cdd6f4', padding: '2px 0', borderBottom: '1px solid #45475a', fontSize: 12, userSelect: 'none' }}>
        {/* 文件菜单 */}
        <div style={{ position: 'relative' }}>
          <div
            style={{ padding: '4px 12px', cursor: 'pointer', borderRadius: 3, background: activeMenu === '文件' ? '#45475a' : 'transparent' }}
            onClick={(e) => { e.stopPropagation(); setActiveMenu(activeMenu === '文件' ? null : '文件') }}
            onMouseEnter={() => { if (activeMenu) setActiveMenu('文件') }}
          >
            文件
          </div>
          {activeMenu === '文件' && (
            <div style={{ position: 'absolute', top: '100%', left: 0, background: '#313244', border: '1px solid #45475a', minWidth: 200, zIndex: 100, borderRadius: 6, boxShadow: '0 4px 12px rgba(0,0,0,0.4)', padding: '4px 0' }}>
              <div
                style={{ padding: '6px 16px', cursor: 'pointer', fontSize: 12, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}
                onClick={(e) => { e.stopPropagation(); handleNew(); setActiveMenu(null) }}
                onMouseEnter={(e) => (e.currentTarget.style.background = '#45475a')}
                onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
              >
                <span>新建</span>
                <span style={{ color: '#6c7086', fontSize: 11, marginLeft: 24 }}>Ctrl+N</span>
              </div>
              <div
                style={{ padding: '6px 16px', cursor: 'pointer', fontSize: 12, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}
                onClick={(e) => { e.stopPropagation(); setShowOpenDialog(true); setActiveMenu(null) }}
                onMouseEnter={(e) => (e.currentTarget.style.background = '#45475a')}
                onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
              >
                <span>打开...</span>
                <span style={{ color: '#6c7086', fontSize: 11, marginLeft: 24 }}>Ctrl+O</span>
              </div>
              <div
                style={{ padding: '6px 16px', cursor: 'pointer', fontSize: 12, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}
                onClick={(e) => { e.stopPropagation(); handleSave(); setActiveMenu(null) }}
                onMouseEnter={(e) => (e.currentTarget.style.background = '#45475a')}
                onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
              >
                <span>保存</span>
                <span style={{ color: '#6c7086', fontSize: 11, marginLeft: 24 }}>Ctrl+S</span>
              </div>
              <div style={{ height: 1, background: '#45475a', margin: '4px 8px' }} />
              <div
                style={{ padding: '6px 16px', cursor: 'pointer', fontSize: 12, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}
                onClick={(e) => { e.stopPropagation(); setActiveMenu(null) }}
                onMouseEnter={(e) => (e.currentTarget.style.background = '#45475a')}
                onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
              >
                <span>退出</span>
              </div>
            </div>
          )}
        </div>

        {/* 编辑菜单 */}
        <div style={{ position: 'relative' }}>
          <div
            style={{ padding: '4px 12px', cursor: 'pointer', borderRadius: 3, background: activeMenu === '编辑' ? '#45475a' : 'transparent' }}
            onClick={(e) => { e.stopPropagation(); setActiveMenu(activeMenu === '编辑' ? null : '编辑') }}
            onMouseEnter={() => { if (activeMenu) setActiveMenu('编辑') }}
          >
            编辑
          </div>
          {activeMenu === '编辑' && (
            <div style={{ position: 'absolute', top: '100%', left: 0, background: '#313244', border: '1px solid #45475a', minWidth: 200, zIndex: 100, borderRadius: 6, boxShadow: '0 4px 12px rgba(0,0,0,0.4)', padding: '4px 0' }}>
              <div
                style={{ padding: '6px 16px', cursor: 'pointer', fontSize: 12, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}
                onClick={(e) => { e.stopPropagation(); handleUndo(); setActiveMenu(null) }}
                onMouseEnter={(e) => (e.currentTarget.style.background = '#45475a')}
                onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
              >
                <span>撤销</span>
                <span style={{ color: '#6c7086', fontSize: 11, marginLeft: 24 }}>Ctrl+Z</span>
              </div>
              <div
                style={{ padding: '6px 16px', cursor: 'pointer', fontSize: 12, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}
                onClick={(e) => { e.stopPropagation(); handleRedo(); setActiveMenu(null) }}
                onMouseEnter={(e) => (e.currentTarget.style.background = '#45475a')}
                onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
              >
                <span>重做</span>
                <span style={{ color: '#6c7086', fontSize: 11, marginLeft: 24 }}>Ctrl+Y</span>
              </div>
              <div style={{ height: 1, background: '#45475a', margin: '4px 8px' }} />
              <div
                style={{ padding: '6px 16px', cursor: 'pointer', fontSize: 12, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}
                onClick={(e) => { e.stopPropagation(); handleCut(); setActiveMenu(null) }}
                onMouseEnter={(e) => (e.currentTarget.style.background = '#45475a')}
                onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
              >
                <span>剪切</span>
                <span style={{ color: '#6c7086', fontSize: 11, marginLeft: 24 }}>Ctrl+X</span>
              </div>
              <div
                style={{ padding: '6px 16px', cursor: 'pointer', fontSize: 12, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}
                onClick={(e) => { e.stopPropagation(); handleCopy(); setActiveMenu(null) }}
                onMouseEnter={(e) => (e.currentTarget.style.background = '#45475a')}
                onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
              >
                <span>复制</span>
                <span style={{ color: '#6c7086', fontSize: 11, marginLeft: 24 }}>Ctrl+C</span>
              </div>
              <div
                style={{ padding: '6px 16px', cursor: 'pointer', fontSize: 12, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}
                onClick={(e) => { e.stopPropagation(); handlePaste(); setActiveMenu(null) }}
                onMouseEnter={(e) => (e.currentTarget.style.background = '#45475a')}
                onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
              >
                <span>粘贴</span>
                <span style={{ color: '#6c7086', fontSize: 11, marginLeft: 24 }}>Ctrl+V</span>
              </div>
              <div style={{ height: 1, background: '#45475a', margin: '4px 8px' }} />
              <div
                style={{ padding: '6px 16px', cursor: 'pointer', fontSize: 12, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}
                onClick={(e) => { e.stopPropagation(); if (textareaRef.current) textareaRef.current.select(); setActiveMenu(null) }}
                onMouseEnter={(e) => (e.currentTarget.style.background = '#45475a')}
                onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
              >
                <span>全选</span>
                <span style={{ color: '#6c7086', fontSize: 11, marginLeft: 24 }}>Ctrl+A</span>
              </div>
              <div
                style={{ padding: '6px 16px', cursor: 'pointer', fontSize: 12, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}
                onClick={(e) => { e.stopPropagation(); handleFind(); setActiveMenu(null) }}
                onMouseEnter={(e) => (e.currentTarget.style.background = '#45475a')}
                onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
              >
                <span>查找...</span>
                <span style={{ color: '#6c7086', fontSize: 11, marginLeft: 24 }}>Ctrl+F</span>
              </div>
            </div>
          )}
        </div>

        {/* 查看菜单 */}
        <div style={{ position: 'relative' }}>
          <div
            style={{ padding: '4px 12px', cursor: 'pointer', borderRadius: 3, background: activeMenu === '查看' ? '#45475a' : 'transparent' }}
            onClick={(e) => { e.stopPropagation(); setActiveMenu(activeMenu === '查看' ? null : '查看') }}
            onMouseEnter={() => { if (activeMenu) setActiveMenu('查看') }}
          >
            查看
          </div>
          {activeMenu === '查看' && (
            <div style={{ position: 'absolute', top: '100%', left: 0, background: '#313244', border: '1px solid #45475a', minWidth: 200, zIndex: 100, borderRadius: 6, boxShadow: '0 4px 12px rgba(0,0,0,0.4)', padding: '4px 0' }}>
              <div
                style={{ padding: '6px 16px', cursor: 'pointer', fontSize: 12, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}
                onClick={(e) => { e.stopPropagation(); setWordWrap(!wordWrap); setActiveMenu(null) }}
                onMouseEnter={(e) => (e.currentTarget.style.background = '#45475a')}
                onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
              >
                <span>{wordWrap ? '取消自动换行' : '自动换行'}</span>
              </div>
              <div
                style={{ padding: '6px 16px', cursor: 'pointer', fontSize: 12, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}
                onClick={(e) => { e.stopPropagation(); setActiveMenu(null) }}
                onMouseEnter={(e) => (e.currentTarget.style.background = '#45475a')}
                onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
              >
                <span>状态栏</span>
              </div>
            </div>
          )}
        </div>

        {/* 工具菜单 */}
        <div style={{ position: 'relative' }}>
          <div
            style={{ padding: '4px 12px', cursor: 'pointer', borderRadius: 3, background: activeMenu === '工具' ? '#45475a' : 'transparent' }}
            onClick={(e) => { e.stopPropagation(); setActiveMenu(activeMenu === '工具' ? null : '工具') }}
            onMouseEnter={() => { if (activeMenu) setActiveMenu('工具') }}
          >
            工具
          </div>
          {activeMenu === '工具' && (
            <div style={{ position: 'absolute', top: '100%', left: 0, background: '#313244', border: '1px solid #45475a', minWidth: 200, zIndex: 100, borderRadius: 6, boxShadow: '0 4px 12px rgba(0,0,0,0.4)', padding: '4px 0' }}>
              <div
                style={{ padding: '6px 16px', cursor: 'pointer', fontSize: 12, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}
                onClick={(e) => { e.stopPropagation(); handleWordCount(); setActiveMenu(null) }}
                onMouseEnter={(e) => (e.currentTarget.style.background = '#45475a')}
                onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
              >
                <span>字数统计</span>
              </div>
            </div>
          )}
        </div>
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: 2, background: '#313244', padding: '4px 6px', borderBottom: '1px solid #45475a' }}>
        <button onClick={handleNew} style={{ background: 'transparent', border: 'none', color: '#cdd6f4', cursor: 'pointer', padding: '4px 8px', borderRadius: 3, fontSize: 12 }} title="新建">📄</button>
        <button onClick={() => setShowOpenDialog(true)} style={{ background: 'transparent', border: 'none', color: '#cdd6f4', cursor: 'pointer', padding: '4px 8px', borderRadius: 3, fontSize: 12 }} title="打开">📂</button>
        <button onClick={handleSave} style={{ background: 'transparent', border: 'none', color: '#cdd6f4', cursor: 'pointer', padding: '4px 8px', borderRadius: 3, fontSize: 12 }} title="保存">💾</button>
        <div style={{ width: 1, height: 18, background: '#45475a', margin: '0 4px' }} />
        <button onClick={handleUndo} style={{ background: 'transparent', border: 'none', color: '#cdd6f4', cursor: 'pointer', padding: '4px 8px', borderRadius: 3, fontSize: 12 }} title="撤销">↩</button>
        <button onClick={handleRedo} style={{ background: 'transparent', border: 'none', color: '#cdd6f4', cursor: 'pointer', padding: '4px 8px', borderRadius: 3, fontSize: 12 }} title="重做">↪</button>
        <div style={{ width: 1, height: 18, background: '#45475a', margin: '0 4px' }} />
        <button onClick={handleCut} style={{ background: 'transparent', border: 'none', color: '#cdd6f4', cursor: 'pointer', padding: '4px 8px', borderRadius: 3, fontSize: 12 }} title="剪切">✂</button>
        <button onClick={handleCopy} style={{ background: 'transparent', border: 'none', color: '#cdd6f4', cursor: 'pointer', padding: '4px 8px', borderRadius: 3, fontSize: 12 }} title="复制">📋</button>
        <button onClick={handlePaste} style={{ background: 'transparent', border: 'none', color: '#cdd6f4', cursor: 'pointer', padding: '4px 8px', borderRadius: 3, fontSize: 12 }} title="粘贴">📌</button>
        <div style={{ width: 1, height: 18, background: '#45475a', margin: '0 4px' }} />
        <button onClick={handleFind} style={{ background: 'transparent', border: 'none', color: '#cdd6f4', cursor: 'pointer', padding: '4px 8px', borderRadius: 3, fontSize: 12 }} title="查找">🔍</button>
      </div>

      {showFind && (
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, background: '#313244', padding: '6px 12px', borderBottom: '1px solid #45475a' }}>
          <span style={{ fontSize: 12, color: '#6c7086' }}>查找:</span>
          <input
            value={findText}
            onChange={(e) => setFindText(e.target.value)}
            onKeyDown={(e) => { if (e.key === 'Enter') handleFindNext() }}
            style={{ flex: 1, padding: '4px 8px', background: '#1e1e2e', border: '1px solid #45475a', borderRadius: 4, color: '#cdd6f4', fontSize: 12, outline: 'none' }}
            autoFocus
          />
          <button onClick={handleFindNext} style={{ background: '#45475a', border: 'none', color: '#cdd6f4', padding: '4px 10px', borderRadius: 4, cursor: 'pointer', fontSize: 12 }}>下一个</button>
          <button onClick={() => { setShowFind(false); setFindText('') }} style={{ background: 'transparent', border: 'none', color: '#6c7086', cursor: 'pointer', fontSize: 14 }}>×</button>
        </div>
      )}

      <div style={{ flex: 1, position: 'relative', overflow: 'hidden' }}>
        {showOpenDialog && (
          <div style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.6)', zIndex: 50, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <div style={{ background: '#313244', border: '1px solid #45475a', borderRadius: 8, padding: 16, minWidth: 400, maxHeight: 400, overflow: 'auto' }}>
              <h3 style={{ margin: '0 0 12px', fontSize: 14, color: '#cdd6f4' }}>打开文件</h3>
              {allFiles.map((f) => (
                <div
                  key={f.id}
                  style={{ padding: '8px 12px', cursor: 'pointer', borderRadius: 4, fontSize: 13, color: openFileId === f.id ? '#89b4fa' : '#cdd6f4', display: 'flex', alignItems: 'center', gap: 8 }}
                  onClick={() => { openFile(f); setShowOpenDialog(false) }}
                  onMouseEnter={(e) => (e.currentTarget.style.background = '#45475a')}
                  onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
                >
                  📄 {f.name}
                </div>
              ))}
              {allFiles.length === 0 && (
                <div style={{ padding: 16, textAlign: 'center', color: '#6c7086', fontSize: 13 }}>没有可打开的文件</div>
              )}
              <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 12 }}>
                <button
                  style={{ padding: '6px 16px', background: '#45475a', border: 'none', color: '#cdd6f4', borderRadius: 4, cursor: 'pointer', fontSize: 12 }}
                  onClick={() => setShowOpenDialog(false)}
                >
                  取消
                </button>
              </div>
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
            width: '100%', height: '100%', background: '#1e1e2e', color: '#cdd6f4',
            border: 'none', outline: 'none', resize: 'none', padding: 12,
            fontSize: 14, fontFamily: 'monospace', lineHeight: 1.6, boxSizing: 'border-box',
            whiteSpace: wordWrap ? 'pre-wrap' : 'pre',
            overflowWrap: wordWrap ? 'break-word' : 'normal'
          }}
          placeholder="在此输入文本..."
        />
      </div>

      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: '#89b4fa', color: '#1e1e2e', padding: '3px 12px', fontSize: 11, fontFamily: 'monospace', fontWeight: 600 }}>
        <div style={{ display: 'flex', gap: 16 }}>
          <span>行 {cursorPos.line}, 列 {cursorPos.col}</span>
          <span>{content.length} 字符</span>
        </div>
        <div style={{ display: 'flex', gap: 16 }}>
          <span>{currentFileName}</span>
          <span>纯文本</span>
          <span>UTF-8</span>
          {isUnsaved && <span style={{ color: '#1e1e2e', fontWeight: 700 }}>● 未保存</span>}
        </div>
      </div>
    </div>
  )
}
