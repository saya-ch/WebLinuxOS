import { useState, useCallback, useRef } from 'react'

interface Tab {
  id: string
  name: string
  content: string
  language: string
}

const LANGUAGES = [
  { id: 'javascript', name: 'JavaScript', ext: 'js' },
  { id: 'typescript', name: 'TypeScript', ext: 'ts' },
  { id: 'python', name: 'Python', ext: 'py' },
  { id: 'html', name: 'HTML', ext: 'html' },
  { id: 'css', name: 'CSS', ext: 'css' },
  { id: 'json', name: 'JSON', ext: 'json' },
  { id: 'markdown', name: 'Markdown', ext: 'md' },
  { id: 'sql', name: 'SQL', ext: 'sql' },
  { id: 'bash', name: 'Bash', ext: 'sh' },
  { id: 'xml', name: 'XML', ext: 'xml' },
  { id: 'yaml', name: 'YAML', ext: 'yaml' },
]

// Simple syntax highlighting
const highlightSyntax = (code: string, language: string): string => {
  let highlighted = code
  
  // Keywords
  const keywords: Record<string, string[]> = {
    javascript: ['const', 'let', 'var', 'function', 'return', 'if', 'else', 'for', 'while', 'class', 'import', 'export', 'from', 'async', 'await', 'try', 'catch', 'throw', 'new', 'this', 'typeof', 'instanceof'],
    typescript: ['const', 'let', 'var', 'function', 'return', 'if', 'else', 'for', 'while', 'class', 'import', 'export', 'from', 'async', 'await', 'try', 'catch', 'throw', 'new', 'this', 'interface', 'type', 'enum', 'extends', 'implements', 'public', 'private', 'protected', 'readonly'],
    python: ['def', 'class', 'if', 'else', 'elif', 'for', 'while', 'return', 'import', 'from', 'as', 'try', 'except', 'finally', 'with', 'lambda', 'yield', 'True', 'False', 'None', 'and', 'or', 'not', 'in', 'is'],
    sql: ['SELECT', 'FROM', 'WHERE', 'INSERT', 'UPDATE', 'DELETE', 'CREATE', 'DROP', 'ALTER', 'TABLE', 'JOIN', 'ON', 'AND', 'OR', 'ORDER', 'BY', 'GROUP', 'HAVING', 'LIMIT', 'OFFSET', 'UNION', 'INTO', 'VALUES', 'SET', 'PRIMARY', 'KEY', 'FOREIGN', 'REFERENCES', 'INDEX', 'VIEW', 'DATABASE'],
    bash: ['if', 'then', 'else', 'fi', 'for', 'do', 'done', 'while', 'until', 'case', 'esac', 'function', 'return', 'exit', 'echo', 'read', 'export', 'source', 'alias', 'unset', 'true', 'false', 'cd', 'ls', 'mkdir', 'rm', 'cp', 'mv', 'cat', 'grep', 'find', 'chmod', 'chown', 'sudo', 'apt', 'yum', 'npm', 'pip'],
  }
  
  const kw = keywords[language] || []
  kw.forEach(k => {
    highlighted = highlighted.replace(new RegExp(`\\b(${k})\\b`, 'g'), `<span style="color:#c586c0">${k}</span>`)
  })
  
  // Strings
  highlighted = highlighted.replace(/(["'`])(.*?)\1/g, '<span style="color:#ce9178">$1$2$1</span>')
  highlighted = highlighted.replace(/("""|'''|")(.*?)\1/g, '<span style="color:#ce9178">$1$2$1</span>')
  
  // Numbers
  highlighted = highlighted.replace(/\b(\d+\.?\d*)\b/g, '<span style="color:#b5cea8">$1</span>')
  
  // Comments
  if (['javascript', 'typescript', 'python', 'bash', 'sql'].includes(language)) {
    highlighted = highlighted.replace(/(#.*$)/gm, '<span style="color:#6a9955">$1</span>')
    highlighted = highlighted.replace(/(\/\/.*$)/gm, '<span style="color:#6a9955">$1</span>')
  }
  if (['html', 'xml', 'markdown'].includes(language)) {
    highlighted = highlighted.replace(/(&lt;!--.*?--&gt;)/g, '<span style="color:#6a9955">$1</span>')
  }
  
  // HTML/XML tags
  if (['html', 'xml'].includes(language)) {
    highlighted = highlighted.replace(/(&lt;\/?)([\w-]+)/g, '$1<span style="color:#569cd6">$2</span>')
    highlighted = highlighted.replace(/([\w-]+)(=)/g, '<span style="color:#9cdcfe">$1</span>$2')
  }
  
  // CSS
  if (language === 'css') {
    highlighted = highlighted.replace(/([\w-]+)(:)/g, '<span style="color:#9cdcfe">$1</span>$2')
    highlighted = highlighted.replace(/(#[\w-]+)/g, '<span style="color:#d7ba7d">$1</span>')
  }
  
  return highlighted
}

export default function CodeEditorEnhanced() {
  const [tabs, setTabs] = useState<Tab[]>([
    { id: '1', name: 'main.js', content: '// Welcome to WebLinuxOS Code Editor\n\nfunction hello() {\n  console.log("Hello, World!");\n}\n\nhello();', language: 'javascript' }
  ])
  const [activeTab, setActiveTab] = useState('1')
  const [lineNumbers, setLineNumbers] = useState(true)
  const [fontSize, setFontSize] = useState(14)
  const textareaRef = useRef<HTMLTextAreaElement>(null)
  const highlightRef = useRef<HTMLDivElement>(null)

  const currentTab = tabs.find(t => t.id === activeTab)

  const updateContent = useCallback((content: string) => {
    setTabs(prev => prev.map(t => 
      t.id === activeTab ? { ...t, content } : t
    ))
  }, [activeTab])

  const addTab = useCallback(() => {
    const newId = String(Date.now())
    const newTab: Tab = {
      id: newId,
      name: `untitled.${LANGUAGES.find(l => l.id === 'javascript')?.ext || 'js'}`,
      content: '',
      language: 'javascript'
    }
    setTabs(prev => [...prev, newTab])
    setActiveTab(newId)
  }, [])

  const closeTab = useCallback((id: string) => {
    if (tabs.length <= 1) return
    setTabs(prev => prev.filter(t => t.id !== id))
    if (activeTab === id) {
      setActiveTab(tabs.find(t => t.id !== id)?.id || '')
    }
  }, [tabs, activeTab])

  const renameTab = useCallback((id: string) => {
    const tab = tabs.find(t => t.id === id)
    if (!tab) return
    
    const newName = prompt('输入新文件名:', tab.name)
    if (newName && newName.trim()) {
      const ext = newName.split('.').pop() || ''
      const lang = LANGUAGES.find(l => l.ext === ext) || LANGUAGES[0]
      setTabs(prev => prev.map(t => 
        t.id === id ? { ...t, name: newName, language: lang.id } : t
      ))
    }
  }, [tabs])

  const changeLanguage = useCallback((language: string) => {
    setTabs(prev => prev.map(t => 
      t.id === activeTab ? { ...t, language } : t
    ))
  }, [activeTab])

  const downloadFile = useCallback(() => {
    if (!currentTab) return
    const blob = new Blob([currentTab.content], { type: 'text/plain' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = currentTab.name
    a.click()
    URL.revokeObjectURL(url)
  }, [currentTab])

  const copyContent = useCallback(() => {
    if (currentTab) {
      navigator.clipboard.writeText(currentTab.content)
    }
  }, [currentTab])

  // Sync scroll between textarea and highlight layer
  const handleScroll = useCallback((e: React.UIEvent<HTMLTextAreaElement>) => {
    if (highlightRef.current) {
      highlightRef.current.scrollTop = e.currentTarget.scrollTop
      highlightRef.current.scrollLeft = e.currentTarget.scrollLeft
    }
  }, [])

  // Get highlighted code
  const getHighlightedCode = useCallback(() => {
    if (!currentTab) return ''
    // Escape HTML entities
    let escaped = currentTab.content
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
    return highlightSyntax(escaped, currentTab.language)
  }, [currentTab])

  // Line count
  const lineCount = currentTab?.content.split('\n').length || 1

  return (
    <div className="app-container" style={{ 
      background: '#1e1e1e', 
      color: '#d4d4d4', 
      display: 'flex', 
      flexDirection: 'column',
      height: '100%',
      fontFamily: '"Fira Code", "Cascadia Code", Consolas, monospace',
    }}>
      {/* Tab bar */}
      <div style={{
        display: 'flex',
        background: '#252526',
        borderBottom: '1px solid #333',
        alignItems: 'center',
        overflow: 'hidden',
      }}>
        {tabs.map(tab => (
          <div
            key={tab.id}
            style={{
              display: 'flex',
              alignItems: 'center',
              padding: '8px 12px',
              background: tab.id === activeTab ? '#1e1e1e' : '#2d2d2d',
              borderRight: '1px solid #333',
              cursor: 'pointer',
              minWidth: 100,
              maxWidth: 150,
            }}
            onClick={() => setActiveTab(tab.id)}
            onDoubleClick={() => renameTab(tab.id)}
          >
            <span style={{ 
              fontSize: 12, 
              overflow: 'hidden', 
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap',
              flex: 1,
            }}>
              {tab.name}
            </span>
            {tabs.length > 1 && (
              <span
                onClick={(e) => { e.stopPropagation(); closeTab(tab.id) }}
                style={{ 
                  marginLeft: 8, 
                  fontSize: 14, 
                  opacity: 0.6,
                  cursor: 'pointer',
                }}
              >
                ×
              </span>
            )}
          </div>
        ))}
        <button
          onClick={addTab}
          style={{
            padding: '8px 12px',
            background: 'transparent',
            border: 'none',
            color: '#888',
            fontSize: 16,
            cursor: 'pointer',
          }}
        >
          +
        </button>
      </div>

      {/* Toolbar */}
      <div style={{
        display: 'flex',
        gap: 8,
        padding: '6px 12px',
        background: '#2d2d2d',
        borderBottom: '1px solid #333',
        alignItems: 'center',
      }}>
        <select
          value={currentTab?.language || 'javascript'}
          onChange={(e) => changeLanguage(e.target.value)}
          style={{
            padding: '4px 8px',
            background: '#1e1e1e',
            border: '1px solid #444',
            borderRadius: 4,
            color: '#d4d4d4',
            fontSize: 12,
          }}
        >
          {LANGUAGES.map(l => (
            <option key={l.id} value={l.id}>{l.name}</option>
          ))}
        </select>
        
        <span style={{ width: 1, height: 16, background: '#444' }} />
        
        <button
          onClick={() => setLineNumbers(!lineNumbers)}
          style={{
            padding: '4px 8px',
            background: lineNumbers ? '#0078d4' : '#1e1e1e',
            border: '1px solid #444',
            borderRadius: 4,
            color: '#d4d4d4',
            fontSize: 12,
            cursor: 'pointer',
          }}
        >
          行号
        </button>
        
        <select
          value={fontSize}
          onChange={(e) => setFontSize(Number(e.target.value))}
          style={{
            padding: '4px 8px',
            background: '#1e1e1e',
            border: '1px solid #444',
            borderRadius: 4,
            color: '#d4d4d4',
            fontSize: 12,
          }}
        >
          {[12, 14, 16, 18, 20].map(s => (
            <option key={s} value={s}>{s}px</option>
          ))}
        </select>
        
        <span style={{ width: 1, height: 16, background: '#444' }} />
        
        <button onClick={copyContent} style={{ padding: '4px 8px', background: '#1e1e1e', border: '1px solid #444', borderRadius: 4, color: '#d4d4d4', fontSize: 12, cursor: 'pointer' }}>
          复制
        </button>
        <button onClick={downloadFile} style={{ padding: '4px 8px', background: '#1e1e1e', border: '1px solid #444', borderRadius: 4, color: '#d4d4d4', fontSize: 12, cursor: 'pointer' }}>
          下载
        </button>
      </div>

      {/* Editor */}
      <div style={{ 
        flex: 1, 
        display: 'flex', 
        overflow: 'hidden',
        position: 'relative',
      }}>
        {/* Line numbers */}
        {lineNumbers && (
          <div style={{
            padding: '12px 8px',
            background: '#1e1e1e',
            borderRight: '1px solid #333',
            textAlign: 'right',
            color: '#858585',
            fontSize: fontSize,
            lineHeight: 1.5,
            userSelect: 'none',
            overflow: 'hidden',
          }}>
            {Array.from({ length: lineCount }, (_, i) => i + 1).map(n => (
              <div key={n}>{n}</div>
            ))}
          </div>
        )}

        {/* Code area */}
        <div style={{ flex: 1, position: 'relative', overflow: 'hidden' }}>
          {/* Highlighted layer */}
          <div
            ref={highlightRef}
            style={{
              position: 'absolute',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              padding: '12px',
              fontSize: fontSize,
              lineHeight: 1.5,
              whiteSpace: 'pre',
              overflow: 'auto',
              pointerEvents: 'none',
              color: 'transparent',
            }}
          >
            <pre style={{ margin: 0, fontFamily: 'inherit' }} dangerouslySetInnerHTML={{ __html: getHighlightedCode() }} />
          </div>
          
          {/* Textarea */}
          <textarea
            ref={textareaRef}
            value={currentTab?.content || ''}
            onChange={(e) => updateContent(e.target.value)}
            onScroll={handleScroll}
            style={{
              position: 'absolute',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              padding: '12px',
              background: 'transparent',
              border: 'none',
              color: 'transparent',
              caretColor: '#d4d4d4',
              fontSize: fontSize,
              lineHeight: 1.5,
              fontFamily: 'inherit',
              resize: 'none',
              outline: 'none',
              whiteSpace: 'pre',
              overflow: 'auto',
            }}
            spellCheck={false}
          />
        </div>
      </div>

      {/* Status bar */}
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        padding: '4px 12px',
        background: '#007acc',
        color: '#fff',
        fontSize: 11,
      }}>
        <span>{currentTab?.language || 'plaintext'}</span>
        <span>
          {currentTab?.content.length || 0} 字符 | {lineCount} 行 | UTF-8
        </span>
      </div>
    </div>
  )
}