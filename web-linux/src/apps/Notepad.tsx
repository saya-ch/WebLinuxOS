import { useState, useRef, useEffect, useCallback } from 'react'
import { useStore } from '../store'
import type { FileNode } from '../types'

export default function Notepad() {
  const files = useStore((s) => s.files)
  const updateFileContent = useStore((s) => s.updateFileContent)
  const addFile = useStore((s) => s.addFile)
  const renameFile = useStore((s) => s.renameFile)

  const [content, setContent] = useState('')
  const [fileId, setFileId] = useState<string | null>(null)
  const [fileName, setFileName] = useState('未命名.txt')
  const [isModified, setIsModified] = useState(false)
  const [editingName, setEditingName] = useState(false)
  const [nameInput, setNameInput] = useState('')
  const [showSearch, setShowSearch] = useState(false)
  const [showReplace, setShowReplace] = useState(false)
  const [searchText, setSearchText] = useState('')
  const [replaceText, setReplaceText] = useState('')
  const [matchCount, setMatchCount] = useState(0)
  const [currentMatch, setCurrentMatch] = useState(0)
  const [wordWrap, setWordWrap] = useState(true)
  const textareaRef = useRef<HTMLTextAreaElement>(null)
  const lineNumRef = useRef<HTMLDivElement>(null)

  const loadFile = useCallback((id: string) => {
    const findFile = (nodes: FileNode[]): FileNode | undefined => {
      for (const n of nodes) {
        if (n.id === id) return n
        if (n.children) { const f = findFile(n.children); if (f) return f }
      }
      return undefined
    }
    const file = findFile(files)
    if (file && file.type === 'file') {
      setFileId(file.id)
      setFileName(file.name)
      setContent(file.content || '')
      setIsModified(false)
    }
  }, [files])

  useEffect(() => {
    const handler = (e: Event) => {
      const detail = (e as CustomEvent).detail
      if (detail.appId === 'notepad' && detail.fileId) loadFile(detail.fileId)
    }
    window.addEventListener('open-file', handler)
    return () => window.removeEventListener('open-file', handler)
  }, [loadFile])

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 's') { e.preventDefault(); handleSave() }
      if ((e.ctrlKey || e.metaKey) && e.key === 'f') { e.preventDefault(); setShowSearch(true); setShowReplace(false) }
      if ((e.ctrlKey || e.metaKey) && e.key === 'h') { e.preventDefault(); setShowSearch(true); setShowReplace(true) }
      if (e.key === 'Escape') { setShowSearch(false); setShowReplace(false) }
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  })

  const handleSave = () => {
    if (fileId) {
      updateFileContent(fileId, content)
      setIsModified(false)
    } else {
      const documentsFolder = findFolderByName(files, '文档') || findFolderByName(files, 'documents')
      if (documentsFolder) {
        addFile(documentsFolder.id, fileName, 'file')
      }
      setIsModified(false)
    }
  }

  const findFolderByName = (nodes: FileNode[], name: string): FileNode | undefined => {
    for (const n of nodes) {
      if (n.name === name && n.type === 'folder') return n
      if (n.children) { const f = findFolderByName(n.children, name); if (f) return f }
    }
    return undefined
  }

  const handleNameSubmit = () => {
    if (nameInput.trim()) {
      if (fileId) renameFile(fileId, nameInput.trim())
      else setFileName(nameInput.trim())
    }
    setEditingName(false)
  }

  useEffect(() => {
    if (searchText) {
      const lower = content.toLowerCase()
      const searchLower = searchText.toLowerCase()
      let count = 0; let idx = lower.indexOf(searchLower)
      while (idx !== -1) { count++; idx = lower.indexOf(searchLower, idx + 1) }
      setMatchCount(count); setCurrentMatch(count > 0 ? 1 : 0)
    } else { setMatchCount(0); setCurrentMatch(0) }
  }, [searchText, content])

  const handleReplace = () => {
    if (!searchText || !fileId) return
    const lower = content.toLowerCase()
    const idx = lower.indexOf(searchText.toLowerCase())
    if (idx !== -1) {
      const newContent = content.substring(0, idx) + replaceText + content.substring(idx + searchText.length)
      setContent(newContent); setIsModified(true)
    }
  }

  const handleReplaceAll = () => {
    if (!searchText) return
    const newContent = content.split(new RegExp(searchText, 'gi')).join(replaceText)
    setContent(newContent); setIsModified(true)
  }

  const handleScroll = () => {
    if (textareaRef.current && lineNumRef.current) {
      lineNumRef.current.scrollTop = textareaRef.current.scrollTop
    }
  }

  const lines = content.split('\n')
  const wordCount = content.trim() ? content.trim().split(/\s+/).length : 0
  const charCount = content.length

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', background: '#1e1e2e', color: '#cdd6f4' }}>
      <div style={{ display: 'flex', alignItems: 'center', padding: '4px 8px', borderBottom: '1px solid #313244', gap: 4, background: '#181825' }}>
        <button onClick={() => { setContent(''); setFileId(null); setFileName('未命名.txt'); setIsModified(false) }} style={tbBtn} title="新建">新建</button>
        <button onClick={handleSave} style={tbBtn} title="保存">保存</button>
        <button onClick={() => { const blob = new Blob([content], { type: 'text/plain' }); const a = document.createElement('a'); a.href = URL.createObjectURL(blob); a.download = fileName; a.click() }} style={tbBtn} title="另存为">另存为</button>
        <div style={{ width: 1, height: 16, background: '#45475a' }} />
        <button onClick={() => setShowSearch(true)} style={tbBtn}>查找</button>
        <button onClick={() => { setShowSearch(true); setShowReplace(true) }} style={tbBtn}>替换</button>
        <div style={{ width: 1, height: 16, background: '#45475a' }} />
        <button onClick={() => setWordWrap(!wordWrap)} style={{ ...tbBtn, background: wordWrap ? '#45475a' : 'transparent' }}>换行</button>
        <div style={{ flex: 1 }} />
        {editingName ? (
          <input value={nameInput} onChange={(e) => setNameInput(e.target.value)} onBlur={handleNameSubmit} onKeyDown={(e) => { if (e.key === 'Enter') handleNameSubmit(); if (e.key === 'Escape') setEditingName(false) }} autoFocus style={{ padding: '2px 6px', background: '#313244', border: '1px solid #89b4fa', borderRadius: 3, color: '#cdd6f4', fontSize: 12, width: 150, outline: 'none' }} />
        ) : (
          <span onClick={() => { setEditingName(true); setNameInput(fileName) }} style={{ fontSize: 12, cursor: 'pointer', color: isModified ? '#f9e2af' : '#cdd6f4' }}>
            {fileName}{isModified ? ' *' : ''}
          </span>
        )}
      </div>

      {(showSearch || showReplace) && (
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '4px 8px', background: '#181825', borderBottom: '1px solid #313244', flexWrap: 'wrap' }}>
          <input value={searchText} onChange={(e) => setSearchText(e.target.value)} placeholder="查找..." style={{ padding: '3px 8px', background: '#313244', border: '1px solid #45475a', borderRadius: 3, color: '#cdd6f4', fontSize: 12, width: 120, outline: 'none' }} />
          <span style={{ fontSize: 11, color: '#6c7086' }}>{matchCount > 0 ? `${currentMatch}/${matchCount}` : '无匹配'}</span>
          {showReplace && (
            <>
              <input value={replaceText} onChange={(e) => setReplaceText(e.target.value)} placeholder="替换..." style={{ padding: '3px 8px', background: '#313244', border: '1px solid #45475a', borderRadius: 3, color: '#cdd6f4', fontSize: 12, width: 120, outline: 'none' }} />
              <button onClick={handleReplace} style={tbBtn}>替换</button>
              <button onClick={handleReplaceAll} style={tbBtn}>全部替换</button>
            </>
          )}
          <button onClick={() => { setShowSearch(false); setShowReplace(false) }} style={{ ...tbBtn, marginLeft: 'auto' }}>关闭</button>
        </div>
      )}

      <div style={{ flex: 1, display: 'flex', overflow: 'hidden' }}>
        <div ref={lineNumRef} style={{ width: 40, background: '#181825', color: '#6c7086', textAlign: 'right', padding: '8px 6px 8px 0', fontSize: 13, fontFamily: 'monospace', lineHeight: 1.5, userSelect: 'none', overflow: 'hidden', borderRight: '1px solid #313244' }}>
          {lines.map((_, i) => <div key={i}>{i + 1}</div>)}
        </div>
        <textarea
          ref={textareaRef}
          value={content}
          onChange={(e) => { setContent(e.target.value); setIsModified(true) }}
          onScroll={handleScroll}
          style={{ flex: 1, background: '#1e1e2e', color: '#cdd6f4', border: 'none', outline: 'none', resize: 'none', padding: 8, fontSize: 13, fontFamily: 'monospace', lineHeight: 1.5, whiteSpace: wordWrap ? 'pre-wrap' : 'pre', overflow: wordWrap ? 'auto' : 'auto', tabSize: 2 }}
          placeholder="在此输入..."
          spellCheck={false}
        />
      </div>

      <div style={{ display: 'flex', justifyContent: 'space-between', padding: '4px 12px', background: '#181825', borderTop: '1px solid #313244', fontSize: 11, color: '#6c7086' }}>
        <span>字数: {wordCount} | 字符: {charCount} | 行数: {lines.length}</span>
        <span>{isModified ? '已修改' : '已保存'} | {fileId ? '已关联文件' : '新文件'}</span>
      </div>
    </div>
  )
}

const tbBtn: React.CSSProperties = { background: 'transparent', border: 'none', color: '#cdd6f4', cursor: 'pointer', padding: '3px 8px', borderRadius: 3, fontSize: 12 }
