import { useState, useRef, useEffect, useCallback } from 'react'
import { useStore } from '../store'
import type { FileNode } from '../types'

function findFileById(nodes: FileNode[], id: string): FileNode | null {
  for (const node of nodes) {
    if (node.id === id) return node
    if (node.children) {
      const found = findFileById(node.children, id)
      if (found) return found
    }
  }
  return null
}

function findFileInFolder(nodes: FileNode[], folderId: string, name: string): FileNode | null {
  const folder = findFileById(nodes, folderId)
  if (!folder || !folder.children) return null
  return folder.children.find(f => f.name === name) || null
}

export default function Notepad() {
  const { files, updateFileContent, addFile, renameFile } = useStore()
  const [content, setContent] = useState('')
  const [fileName, setFileName] = useState('未命名.txt')
  const [isModified, setIsModified] = useState(false)
  const [currentFileId, setCurrentFileId] = useState<string | null>(null)
  const [editingName, setEditingName] = useState(false)
  const [nameInput, setNameInput] = useState('')
  const [showFind, setShowFind] = useState(false)
  const [showReplace, setShowReplace] = useState(false)
  const [findText, setFindText] = useState('')
  const [replaceText, setReplaceText] = useState('')
  const [findIndex, setFindIndex] = useState(0)
  const [findCount, setFindCount] = useState(0)
  const [wordWrap, setWordWrap] = useState(true)
  const textareaRef = useRef<HTMLTextAreaElement>(null)
  const lineNumberRef = useRef<HTMLDivElement>(null)
  const nameInputRef = useRef<HTMLInputElement>(null)
  const findInputRef = useRef<HTMLInputElement>(null)

  const contentRef = useRef(content)
  const fileNameRef = useRef(fileName)
  const currentFileIdRef = useRef(currentFileId)
  const isModifiedRef = useRef(isModified)

  useEffect(() => { contentRef.current = content }, [content])
  useEffect(() => { fileNameRef.current = fileName }, [fileName])
  useEffect(() => { currentFileIdRef.current = currentFileId }, [currentFileId])
  useEffect(() => { isModifiedRef.current = isModified }, [isModified])

  useEffect(() => {
    const handler = (e: Event) => {
      const detail = (e as CustomEvent).detail
      if (detail.appId === 'notepad' && detail.fileId) {
        const file = findFileById(files, detail.fileId)
        if (file && file.type === 'file') {
          setContent(file.content || '')
          setFileName(file.name)
          setCurrentFileId(file.id)
          setIsModified(false)
        }
      }
    }
    window.addEventListener('open-file', handler)
    return () => window.removeEventListener('open-file', handler)
  }, [files])

  const handleSave = useCallback(() => {
    if (currentFileIdRef.current) {
      updateFileContent(currentFileIdRef.current, contentRef.current)
      setIsModified(false)
    } else {
      const name = fileNameRef.current
      addFile('documents', name, 'file')
      const updatedFiles = useStore.getState().files
      const added = findFileInFolder(updatedFiles, 'documents', name)
      if (added) {
        setCurrentFileId(added.id)
        updateFileContent(added.id, contentRef.current)
      }
      setIsModified(false)
    }
  }, [updateFileContent, addFile])

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 's') {
        e.preventDefault()
        handleSave()
      }
      if ((e.ctrlKey || e.metaKey) && e.key === 'f') {
        e.preventDefault()
        setShowFind(true)
        setShowReplace(false)
        setTimeout(() => findInputRef.current?.focus(), 0)
      }
      if ((e.ctrlKey || e.metaKey) && e.key === 'h') {
        e.preventDefault()
        setShowFind(true)
        setShowReplace(true)
        setTimeout(() => findInputRef.current?.focus(), 0)
      }
      if (e.key === 'Escape') {
        setShowFind(false)
        setShowReplace(false)
        setFindText('')
        setReplaceText('')
        setFindCount(0)
        setFindIndex(0)
      }
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [handleSave])

  useEffect(() => {
    if (editingName && nameInputRef.current) {
      nameInputRef.current.focus()
      nameInputRef.current.select()
    }
  }, [editingName])

  const performFind = useCallback((text: string, fromIndex?: number) => {
    if (!text) {
      setFindCount(0)
      setFindIndex(0)
      return
    }
    const lowerContent = contentRef.current.toLowerCase()
    const lowerFind = text.toLowerCase()
    const matches: number[] = []
    let pos = 0
    while ((pos = lowerContent.indexOf(lowerFind, pos)) !== -1) {
      matches.push(pos)
      pos += 1
    }
    setFindCount(matches.length)
    if (matches.length > 0) {
      let idx = findIndex
      if (fromIndex !== undefined) {
        idx = fromIndex
      }
      if (idx >= matches.length) idx = 0
      if (idx < 0) idx = matches.length - 1
      setFindIndex(idx)
      const matchPos = matches[idx]
      if (textareaRef.current) {
        textareaRef.current.focus()
        textareaRef.current.setSelectionRange(matchPos, matchPos + text.length)
        const linesBefore = contentRef.current.substring(0, matchPos).split('\n').length - 1
        const lineHeight = 22.4
        textareaRef.current.scrollTop = linesBefore * lineHeight - textareaRef.current.clientHeight / 2
      }
    } else {
      setFindIndex(0)
    }
  }, [findIndex])

  const handleFindNext = useCallback(() => {
    if (findCount === 0) {
      performFind(findText, 0)
    } else {
      const nextIdx = findIndex + 1 >= findCount ? 0 : findIndex + 1
      setFindIndex(nextIdx)
      performFind(findText, nextIdx)
    }
  }, [findText, findCount, findIndex, performFind])

  const handleFindPrev = useCallback(() => {
    if (findCount === 0) {
      performFind(findText, 0)
    } else {
      const prevIdx = findIndex - 1 < 0 ? findCount - 1 : findIndex - 1
      setFindIndex(prevIdx)
      performFind(findText, prevIdx)
    }
  }, [findText, findCount, findIndex, performFind])

  const handleReplaceCurrent = useCallback(() => {
    if (!findText || findCount === 0) return
    const lowerContent = content.toLowerCase()
    const lowerFind = findText.toLowerCase()
    const matches: number[] = []
    let pos = 0
    while ((pos = lowerContent.indexOf(lowerFind, pos)) !== -1) {
      matches.push(pos)
      pos += 1
    }
    if (matches.length > 0 && findIndex < matches.length) {
      const matchPos = matches[findIndex]
      const newContent = content.substring(0, matchPos) + replaceText + content.substring(matchPos + findText.length)
      setContent(newContent)
      setIsModified(true)
      setTimeout(() => performFind(findText, findIndex), 0)
    }
  }, [content, findText, replaceText, findCount, findIndex, performFind])

  const handleReplaceAll = useCallback(() => {
    if (!findText) return
    const lowerContent = content.toLowerCase()
    const lowerFind = findText.toLowerCase()
    if (lowerContent.indexOf(lowerFind) === -1) return
    const parts: string[] = []
    let lastIdx = 0
    let pos = 0
    while ((pos = lowerContent.indexOf(lowerFind, pos)) !== -1) {
      parts.push(content.substring(lastIdx, pos))
      parts.push(replaceText)
      lastIdx = pos + findText.length
      pos += 1
    }
    parts.push(content.substring(lastIdx))
    setContent(parts.join(''))
    setIsModified(true)
    setFindCount(0)
    setFindIndex(0)
  }, [content, findText, replaceText])

  function handleNew() {
    if (isModified) {
      if (!window.confirm('当前文件未保存，确定新建？')) return
    }
    setContent('')
    setFileName('未命名.txt')
    setCurrentFileId(null)
    setIsModified(false)
  }

  function handleOpen() {
    const input = document.createElement('input')
    input.type = 'file'
    input.accept = '.txt,.md,.js,.ts,.json,.html,.css'
    input.onchange = (e) => {
      const file = (e.target as HTMLInputElement).files?.[0]
      if (file) {
        const reader = new FileReader()
        reader.onload = () => {
          setContent(reader.result as string)
          setFileName(file.name)
          setCurrentFileId(null)
          setIsModified(false)
        }
        reader.readAsText(file)
      }
    }
    input.click()
  }

  function handleSaveAs() {
    const blob = new Blob([content], { type: 'text/plain' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = fileName
    a.click()
    URL.revokeObjectURL(url)
  }

  function handleCut() {
    const textarea = textareaRef.current
    if (!textarea) return
    const start = textarea.selectionStart
    const end = textarea.selectionEnd
    const selected = content.substring(start, end)
    navigator.clipboard.writeText(selected)
    const newContent = content.substring(0, start) + content.substring(end)
    setContent(newContent)
    setIsModified(true)
    setTimeout(() => {
      textarea.focus()
      textarea.setSelectionRange(start, start)
    }, 0)
  }

  function handleCopy() {
    const textarea = textareaRef.current
    if (!textarea) return
    const start = textarea.selectionStart
    const end = textarea.selectionEnd
    const selected = content.substring(start, end)
    if (selected) {
      navigator.clipboard.writeText(selected)
    }
  }

  function handlePaste() {
    navigator.clipboard.readText().then((text) => {
      const textarea = textareaRef.current
      if (!textarea) return
      const start = textarea.selectionStart
      const end = textarea.selectionEnd
      const newContent = content.substring(0, start) + text + content.substring(end)
      setContent(newContent)
      setIsModified(true)
      setTimeout(() => {
        textarea.focus()
        const pos = start + text.length
        textarea.setSelectionRange(pos, pos)
      }, 0)
    })
  }

  const handleNameSubmit = () => {
    const trimmed = nameInput.trim()
    if (trimmed) {
      setFileName(trimmed)
      if (currentFileId) {
        renameFile(currentFileId, trimmed)
      }
    }
    setEditingName(false)
  }

  const handleNameKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleNameSubmit()
    } else if (e.key === 'Escape') {
      setEditingName(false)
    }
  }

  const handleScrollSync = () => {
    if (lineNumberRef.current && textareaRef.current) {
      lineNumberRef.current.scrollTop = textareaRef.current.scrollTop
    }
  }

  const wordCount = content.trim() ? content.trim().split(/\s+/).length : 0
  const charCount = content.length
  const lineCount = content.split('\n').length
  const lineNumbers = Array.from({ length: lineCount }, (_, i) => i + 1)

  return (
    <div className="app-container app-notepad" style={{ background: '#1e1e2e', padding: 0, color: '#cdd6f4' }}>
      <div className="app-toolbar" style={{ borderBottom: '1px solid #313244', background: '#181825' }}>
        <button className="app-toolbar-btn" onClick={handleNew} title="新建">📄</button>
        <button className="app-toolbar-btn" onClick={handleOpen} title="打开">📂</button>
        <button className="app-toolbar-btn" onClick={handleSave} title="保存 (Ctrl+S)">💾</button>
        <button className="app-toolbar-btn" onClick={handleSaveAs} title="另存为">📥</button>
        <span className="app-toolbar-separator" />
        <button className="app-toolbar-btn" onClick={handleCut} title="剪切">✂️</button>
        <button className="app-toolbar-btn" onClick={handleCopy} title="复制">📋</button>
        <button className="app-toolbar-btn" onClick={handlePaste} title="粘贴">📌</button>
        <span className="app-toolbar-separator" />
        <button
          className="app-toolbar-btn"
          onClick={() => { setShowFind(true); setShowReplace(false); setTimeout(() => findInputRef.current?.focus(), 0) }}
          title="查找 (Ctrl+F)"
        >
          🔍
        </button>
        <button
          className="app-toolbar-btn"
          onClick={() => { setShowFind(true); setShowReplace(true); setTimeout(() => findInputRef.current?.focus(), 0) }}
          title="查找替换 (Ctrl+H)"
        >
          🔁
        </button>
        <span className="app-toolbar-separator" />
        <button
          className={`app-toolbar-btn${wordWrap ? ' active' : ''}`}
          onClick={() => setWordWrap(!wordWrap)}
          title="自动换行"
          style={wordWrap ? { background: '#89b4fa', color: '#1e1e2e' } : undefined}
        >
          ↩️
        </button>
        <span style={{ flex: 1 }} />
        {editingName ? (
          <input
            ref={nameInputRef}
            value={nameInput}
            onChange={(e) => setNameInput(e.target.value)}
            onBlur={handleNameSubmit}
            onKeyDown={handleNameKeyDown}
            style={{
              padding: '2px 6px',
              background: '#313244',
              border: '1px solid #89b4fa',
              borderRadius: '4px',
              color: '#cdd6f4',
              fontSize: '12px',
              outline: 'none',
              width: '160px',
            }}
          />
        ) : (
          <span
            onClick={() => { setEditingName(true); setNameInput(fileName) }}
            style={{ fontSize: 12, color: isModified ? '#f9e2af' : '#a6adc8', cursor: 'pointer', marginRight: 8 }}
            title="点击重命名"
          >
            {fileName}{isModified ? ' ●' : ''}
          </span>
        )}
      </div>

      {showFind && (
        <div style={{
          display: 'flex',
          flexDirection: 'column',
          gap: '4px',
          padding: '6px 8px',
          background: '#181825',
          borderBottom: '1px solid #313244',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
            <input
              ref={findInputRef}
              value={findText}
              onChange={(e) => {
                setFindText(e.target.value)
                performFind(e.target.value, 0)
              }}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault()
                  if (e.shiftKey) handleFindPrev()
                  else handleFindNext()
                }
              }}
              placeholder="查找..."
              style={{
                flex: 1,
                padding: '4px 8px',
                background: '#313244',
                border: '1px solid #45475a',
                borderRadius: '4px',
                color: '#cdd6f4',
                fontSize: '12px',
                outline: 'none',
              }}
            />
            <span style={{ fontSize: '11px', color: '#6c7086', minWidth: '60px', textAlign: 'center' }}>
              {findCount > 0 ? `${findIndex + 1}/${findCount}` : findText ? '无匹配' : ''}
            </span>
            <button
              onClick={handleFindPrev}
              style={{ padding: '2px 8px', background: '#45475a', border: 'none', borderRadius: '3px', color: '#cdd6f4', cursor: 'pointer', fontSize: '11px' }}
            >
              ↑
            </button>
            <button
              onClick={handleFindNext}
              style={{ padding: '2px 8px', background: '#45475a', border: 'none', borderRadius: '3px', color: '#cdd6f4', cursor: 'pointer', fontSize: '11px' }}
            >
              ↓
            </button>
            <button
              onClick={() => { setShowFind(false); setShowReplace(false); setFindText(''); setReplaceText(''); setFindCount(0); setFindIndex(0) }}
              style={{ padding: '2px 6px', background: 'transparent', border: 'none', borderRadius: '3px', color: '#6c7086', cursor: 'pointer', fontSize: '12px' }}
            >
              ✕
            </button>
          </div>
          {showReplace && (
            <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
              <input
                value={replaceText}
                onChange={(e) => setReplaceText(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault()
                    handleReplaceCurrent()
                  }
                }}
                placeholder="替换为..."
                style={{
                  flex: 1,
                  padding: '4px 8px',
                  background: '#313244',
                  border: '1px solid #45475a',
                  borderRadius: '4px',
                  color: '#cdd6f4',
                  fontSize: '12px',
                  outline: 'none',
                }}
              />
              <button
                onClick={handleReplaceCurrent}
                style={{ padding: '2px 8px', background: '#45475a', border: 'none', borderRadius: '3px', color: '#cdd6f4', cursor: 'pointer', fontSize: '11px' }}
              >
                替换
              </button>
              <button
                onClick={handleReplaceAll}
                style={{ padding: '2px 8px', background: '#45475a', border: 'none', borderRadius: '3px', color: '#cdd6f4', cursor: 'pointer', fontSize: '11px' }}
              >
                全部替换
              </button>
            </div>
          )}
        </div>
      )}

      <div style={{ display: 'flex', flex: 1, overflow: 'hidden' }}>
        <div
          ref={lineNumberRef}
          style={{
            width: '44px',
            background: '#181825',
            color: '#6c7086',
            textAlign: 'right',
            paddingRight: '8px',
            paddingTop: '16px',
            fontFamily: '"Fira Code", "Cascadia Code", Consolas, monospace',
            fontSize: 14,
            lineHeight: 1.6,
            overflow: 'hidden',
            userSelect: 'none',
            flexShrink: 0,
            borderRight: '1px solid #313244',
          }}
        >
          {lineNumbers.map((n) => (
            <div key={n}>{n}</div>
          ))}
        </div>
        <textarea
          ref={textareaRef}
          value={content}
          onChange={(e) => { setContent(e.target.value); setIsModified(true) }}
          onScroll={handleScrollSync}
          wrap={wordWrap ? 'soft' : 'off'}
          style={{
            flex: 1,
            background: '#1e1e2e',
            color: '#cdd6f4',
            border: 'none',
            outline: 'none',
            resize: 'none',
            padding: '16px',
            fontFamily: '"Fira Code", "Cascadia Code", Consolas, monospace',
            fontSize: 14,
            lineHeight: 1.6,
            tabSize: 2,
          }}
          placeholder="在此输入..."
          spellCheck={false}
        />
      </div>

      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        padding: '6px 16px',
        borderTop: '1px solid #313244',
        fontSize: 12,
        color: '#6c7086',
        background: '#181825',
      }}>
        <span>字数: {wordCount}</span>
        <span>字符: {charCount}</span>
        <span>行数: {lineCount}</span>
        <span style={{ color: isModified ? '#f9e2af' : '#a6adc8' }}>{isModified ? '已修改' : '已保存'}</span>
        <span>{currentFileId ? '已关联文件' : '本地文件'}</span>
      </div>
    </div>
  )
}
