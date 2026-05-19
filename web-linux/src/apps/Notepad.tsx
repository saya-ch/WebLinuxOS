import { useState, useRef } from 'react'

export default function Notepad() {
  const [content, setContent] = useState('')
  const [fileName, setFileName] = useState('未命名.txt')
  const [isModified, setIsModified] = useState(false)
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  function handleNew() {
    if (isModified) {
      if (!window.confirm('当前文件未保存，确定新建？')) return
    }
    setContent('')
    setFileName('未命名.txt')
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
          setIsModified(false)
        }
        reader.readAsText(file)
      }
    }
    input.click()
  }

  function handleSave() {
    const blob = new Blob([content], { type: 'text/plain' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = fileName
    a.click()
    URL.revokeObjectURL(url)
    setIsModified(false)
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

  const wordCount = content.trim() ? content.trim().split(/\s+/).length : 0
  const charCount = content.length
  const lineCount = content.split('\n').length

  return (
    <div className="app-container app-notepad" style={{ background: '#1e1e1e', padding: 0 }}>
      <div className="app-toolbar" style={{ borderBottom: '1px solid #333' }}>
        <button className="app-toolbar-btn" onClick={handleNew} title="新建">📄</button>
        <button className="app-toolbar-btn" onClick={handleOpen} title="打开">📂</button>
        <button className="app-toolbar-btn" onClick={handleSave} title="保存">💾</button>
        <span className="app-toolbar-separator" />
        <button className="app-toolbar-btn" onClick={handleCut} title="剪切">✂️</button>
        <button className="app-toolbar-btn" onClick={handleCopy} title="复制">📋</button>
        <button className="app-toolbar-btn" onClick={handlePaste} title="粘贴">📌</button>
        <span style={{ flex: 1 }} />
        <span style={{ fontSize: 13, color: '#888', marginRight: 8 }}>{fileName}{isModified ? ' *' : ''}</span>
      </div>
      <textarea
        ref={textareaRef}
        value={content}
        onChange={(e) => { setContent(e.target.value); setIsModified(true) }}
        style={{
          flex: 1,
          background: '#1e1e1e',
          color: '#d4d4d4',
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
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        padding: '6px 16px',
        borderTop: '1px solid #333',
        fontSize: 12,
        color: '#888',
      }}>
        <span>字数: {wordCount}</span>
        <span>字符: {charCount}</span>
        <span>行数: {lineCount}</span>
        <span>{isModified ? '已修改' : '已保存'}</span>
      </div>
    </div>
  )
}