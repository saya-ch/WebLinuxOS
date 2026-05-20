import { useState, useRef, useCallback, useMemo, useEffect } from 'react'
import { useStore } from '../store'
import type { FileNode } from '../types'

let pyodide: any = null

async function loadPyodide() {
  if (pyodide) return pyodide
  const script = document.createElement('script')
  script.src = 'https://cdn.jsdelivr.net/pyodide/v0.24.1/full/pyodide.js'
  document.head.appendChild(script)
  await new Promise<void>((resolve, reject) => {
    script.onload = () => resolve()
    script.onerror = () => reject(new Error('Failed to load Pyodide'))
  })
  pyodide = await (window as any).loadPyodide({ indexURL: 'https://cdn.jsdelivr.net/pyodide/v0.24.1/full/' })
  return pyodide
}

async function executePython(code: string): Promise<string> {
  try {
    const py = await loadPyodide()
    py.runPython('import io, sys; sys.stdout = io.StringIO(); sys.stderr = io.StringIO()')
    py.runPython(code)
    const stdout = py.runPython('sys.stdout.getvalue()')
    const stderr = py.runPython('sys.stderr.getvalue()')
    return stdout + (stderr ? '\n' + stderr : '')
  } catch (err: any) {
    return err.message || String(err)
  }
}

const PY_KEYWORDS = ['def', 'class', 'import', 'from', 'return', 'if', 'elif', 'else', 'for', 'while', 'try', 'except',
  'finally', 'with', 'as', 'yield', 'lambda', 'pass', 'break', 'continue', 'raise', 'and', 'or', 'not', 'in', 'is',
  'True', 'False', 'None', 'global', 'nonlocal', 'assert', 'del']

const JS_KEYWORDS = ['function', 'const', 'let', 'var', 'return', 'if', 'else', 'for', 'while', 'class', 'export',
  'import', 'from', 'default', 'new', 'this', 'async', 'await', 'try', 'catch', 'throw', 'typeof', 'instanceof',
  'switch', 'case', 'break', 'continue', 'void', 'null', 'undefined', 'true', 'false', 'of', 'in', 'yield']

const HTML_TAGS = ['html', 'head', 'body', 'div', 'span', 'p', 'a', 'img', 'ul', 'ol', 'li', 'h1', 'h2', 'h3',
  'h4', 'h5', 'h6', 'table', 'tr', 'td', 'th', 'form', 'input', 'button', 'script', 'style', 'link', 'meta', 'title']

const BUILTINS = ['console', 'Math', 'Array', 'Object', 'String', 'Number', 'Boolean', 'Date', 'JSON',
  'Promise', 'Set', 'Map', 'window', 'document', 'React', 'useState', 'useEffect', 'useCallback', 'useRef',
  'print', 'len', 'range', 'str', 'int', 'float', 'list', 'dict', 'tuple', 'set', 'type', 'isinstance',
  'enumerate', 'zip', 'map', 'filter', 'sorted', 'reversed', 'open', 'input', 'abs', 'max', 'min', 'sum']

function detectLang(name: string): string {
  const ext = name.split('.').pop()?.toLowerCase() || ''
  const map: Record<string, string> = {
    py: 'python', ts: 'typescript', tsx: 'typescript', js: 'javascript', jsx: 'javascript',
    html: 'html', css: 'css', json: 'json', md: 'markdown', txt: 'text', sh: 'shell',
    xml: 'xml', yml: 'yaml', yaml: 'yaml', sql: 'sql', java: 'java', cpp: 'cpp', c: 'c',
    go: 'go', rs: 'rust', php: 'php', rb: 'ruby'
  }
  return map[ext] || 'text'
}

function highlightCode(code: string, lang: string): { html: string; lineCount: number } {
  const lines = code.split('\n')
  const highlighted = lines.map((line) => {
    let html = ''
    let lastIdx = 0
    const regex = /(\b[a-zA-Z_$][\w$]*\b|\/\/.*$|#.*$|"(?:[^"\\]|\\.)*"|'(?:[^'\\]|\\.)*'|`(?:[^`\\]|\\.)*`|\d+\.?\d*|<\/?[a-zA-Z][\w-]*)/g
    let match: RegExpExecArray | null
    while ((match = regex.exec(line)) !== null) {
      html += line.slice(lastIdx, match.index).replace(/</g, '&lt;').replace(/>/g, '&gt;')
      const token = match[0]
      if (token.startsWith('//')) {
        html += `<span style="color:#6c7086">${token.replace(/</g,'&lt;').replace(/>/g,'&gt;')}</span>`
      } else if (lang === 'python' && token.startsWith('#')) {
        html += `<span style="color:#6c7086">${token.replace(/</g,'&lt;').replace(/>/g,'&gt;')}</span>`
      } else if (token.startsWith('"') || token.startsWith("'") || token.startsWith('`')) {
        html += `<span style="color:#a6e3a1">${token.replace(/</g,'&lt;').replace(/>/g,'&gt;')}</span>`
      } else if (/^\d/.test(token)) {
        html += `<span style="color:#fab387">${token}</span>`
      } else if (lang === 'python' && PY_KEYWORDS.includes(token)) {
        html += `<span style="color:#cba6f7">${token}</span>`
      } else if ((lang === 'javascript' || lang === 'typescript') && JS_KEYWORDS.includes(token)) {
        html += `<span style="color:#cba6f7">${token}</span>`
      } else if (lang === 'html' && (token.startsWith('<') || HTML_TAGS.includes(token))) {
        html += `<span style="color:#89b4fa">${token.replace(/</g,'&lt;').replace(/>/g,'&gt;')}</span>`
      } else if (BUILTINS.includes(token)) {
        html += `<span style="color:#f9e2af">${token}</span>`
      } else {
        html += token.replace(/</g, '&lt;').replace(/>/g, '&gt;')
      }
      lastIdx = regex.lastIndex
    }
    html += line.slice(lastIdx).replace(/</g, '&lt;').replace(/>/g, '&gt;')
    return html
  })
  return { html: highlighted.join('\n'), lineCount: lines.length }
}

export default function CodeEditor() {
  const files = useStore((s) => s.files)
  const updateFileContent = useStore((s) => s.updateFileContent)

  const [openTabs, setOpenTabs] = useState<FileNode[]>([])
  const [activeTabId, setActiveTabId] = useState<string | null>(null)
  const [tabContents, setTabContents] = useState<Record<string, string>>({})
  const [savedContents, setSavedContents] = useState<Record<string, string>>({})
  const [cursorPos, setCursorPos] = useState({ line: 1, col: 1 })
  const [expandedFolders, setExpandedFolders] = useState<Set<string>>(new Set(['home', 'user', 'documents', 'root']))
  const [output, setOutput] = useState('')
  const [showOutput, setShowOutput] = useState(false)
  const [isRunning, setIsRunning] = useState(false)
  const [pyodideLoading, setPyodideLoading] = useState(false)
  const textareaRef = useRef<HTMLTextAreaElement>(null)
  const syncScrollRef = useRef<HTMLDivElement>(null)

  const openFile = useCallback((file: FileNode) => {
    if (!openTabs.find((t) => t.id === file.id)) {
      setOpenTabs((prev) => [...prev, file])
      setTabContents((prev) => ({ ...prev, [file.id]: file.content || '' }))
      setSavedContents((prev) => ({ ...prev, [file.id]: file.content || '' }))
    }
    setActiveTabId(file.id)
  }, [openTabs])

  const closeTab = useCallback((fileId: string) => {
    const idx = openTabs.findIndex((t) => t.id === fileId)
    setOpenTabs((prev) => prev.filter((t) => t.id !== fileId))
    setTabContents((prev) => {
      const next = { ...prev }
      delete next[fileId]
      return next
    })
    setSavedContents((prev) => {
      const next = { ...prev }
      delete next[fileId]
      return next
    })
    if (activeTabId === fileId) {
      const next = openTabs[idx + 1] || openTabs[idx - 1]
      setActiveTabId(next?.id || null)
    }
  }, [openTabs, activeTabId])

  const activeTab = openTabs.find((t) => t.id === activeTabId)
  const code = activeTabId ? tabContents[activeTabId] || '' : ''
  const lang = activeTab ? detectLang(activeTab.name) : 'text'
  const highlighted = useMemo(() => highlightCode(code, lang), [code, lang])
  const isUnsaved = activeTabId ? tabContents[activeTabId] !== savedContents[activeTabId] : false

  const handleCursorChange = () => {
    const ta = textareaRef.current
    if (!ta) return
    const pos = ta.selectionStart
    const lines = ta.value.substring(0, pos).split('\n')
    setCursorPos({ line: lines.length, col: lines[lines.length - 1].length + 1 })
  }

  const handleScrollSync = () => {
    const ta = textareaRef.current
    const div = syncScrollRef.current
    if (ta && div) {
      div.scrollTop = ta.scrollTop
      div.scrollLeft = ta.scrollLeft
    }
  }

  const toggleFolder = (id: string) => {
    setExpandedFolders((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  const handleRun = async () => {
    if (!code) return
    if (lang !== 'python' && lang !== 'javascript') {
      setOutput('仅支持运行 Python 代码')
      setShowOutput(true)
      return
    }
    setIsRunning(true)
    setPyodideLoading(true)
    setShowOutput(true)
    setOutput('正在加载 Python 环境...')
    try {
      if (lang === 'python') {
        const result = await executePython(code)
        setOutput(result || '(无输出)')
      } else {
        const logs: string[] = []
        const origLog = console.log
        const origError = console.error
        console.log = (...args: any[]) => logs.push(args.map(String).join(' '))
        console.error = (...args: any[]) => logs.push('Error: ' + args.map(String).join(' '))
        try {
          const fn = new Function(code)
          fn()
          setOutput(logs.join('\n') || '(无输出)')
        } catch (err: any) {
          setOutput(logs.join('\n') + '\n' + (err.message || String(err)))
        }
        console.log = origLog
        console.error = origError
      }
    } catch (err: any) {
      setOutput(err.message || String(err))
    }
    setIsRunning(false)
    setPyodideLoading(false)
  }

  const renderTree = (nodes: FileNode[], depth: number = 0): React.ReactNode[] => {
    const folders = nodes.filter((n) => n.type === 'folder')
    const fileItems = nodes.filter((n) => n.type === 'file')
    const result: React.ReactNode[] = []
    for (const folder of folders) {
      const isExpanded = expandedFolders.has(folder.id)
      result.push(
        <div
          key={folder.id}
          style={{ padding: '4px 8px', paddingLeft: 8 + depth * 16, cursor: 'pointer', fontSize: 12, borderRadius: 3, display: 'flex', alignItems: 'center', gap: 6, whiteSpace: 'nowrap', color: '#cdd6f4' }}
          onClick={() => toggleFolder(folder.id)}
          onMouseEnter={(e) => (e.currentTarget.style.background = '#45475a')}
          onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
        >
          {isExpanded ? '📂' : '📁'} {folder.name}
        </div>
      )
      if (isExpanded && folder.children) {
        result.push(...renderTree(folder.children, depth + 1))
      }
    }
    for (const file of fileItems) {
      const isOpen = openTabs.find((t) => t.id === file.id)
      result.push(
        <div
          key={file.id}
          style={{ padding: '4px 8px', paddingLeft: 8 + depth * 16, cursor: 'pointer', fontSize: 12, borderRadius: 3, display: 'flex', alignItems: 'center', gap: 6, whiteSpace: 'nowrap', color: isOpen ? '#89b4fa' : '#cdd6f4' }}
          onClick={() => openFile(file)}
          onMouseEnter={(e) => (e.currentTarget.style.background = '#45475a')}
          onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
        >
          📄 {file.name}
        </div>
      )
    }
    return result
  }

  useEffect(() => {
    const handler = (e: Event) => {
      const detail = (e as CustomEvent).detail
      if (detail.appId === 'code-editor' && detail.fileId) {
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
        if (activeTabId) {
          updateFileContent(activeTabId, tabContents[activeTabId] || '')
          setSavedContents((prev) => ({ ...prev, [activeTabId]: tabContents[activeTabId] || '' }))
        }
      }
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [activeTabId, tabContents, updateFileContent])

  const langDisplay = activeTab ? (() => {
    const ext = activeTab.name.split('.').pop()?.toLowerCase() || ''
    const map: Record<string, string> = { ts: 'TypeScript', tsx: 'TypeScript React', js: 'JavaScript', jsx: 'JavaScript React', py: 'Python', html: 'HTML', css: 'CSS', json: 'JSON', md: 'Markdown', txt: 'Plain Text', sh: 'Shell', xml: 'XML', yml: 'YAML', yaml: 'YAML', sql: 'SQL', java: 'Java', cpp: 'C++', c: 'C', go: 'Go', rs: 'Rust', php: 'PHP', rb: 'Ruby' }
    return map[ext] || 'Plain Text'
  })() : 'Plain Text'

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', background: '#1e1e2e', color: '#cdd6f4' }}>
      <div style={{ display: 'flex', alignItems: 'center', background: '#313244', padding: '4px 8px', gap: 4, borderBottom: '1px solid #45475a' }}>
        <button
          onClick={handleRun}
          disabled={isRunning}
          style={{
            background: isRunning ? '#45475a' : '#89b4fa', color: isRunning ? '#6c7086' : '#1e1e2e',
            border: 'none', borderRadius: 4, padding: '4px 12px', cursor: isRunning ? 'not-allowed' : 'pointer',
            fontSize: 12, fontWeight: 600, display: 'flex', alignItems: 'center', gap: 4
          }}
        >
          ▶ 运行
        </button>
        <button
          onClick={() => setShowOutput(!showOutput)}
          style={{
            background: showOutput ? '#45475a' : 'transparent', color: '#cdd6f4',
            border: '1px solid #45475a', borderRadius: 4, padding: '4px 10px', cursor: 'pointer', fontSize: 12
          }}
        >
          输出面板
        </button>
        {pyodideLoading && <span style={{ fontSize: 11, color: '#f9e2af', marginLeft: 8 }}>⏳ 加载 Python 环境中...</span>}
      </div>

      <div style={{ display: 'flex', flex: 1, overflow: 'hidden' }}>
        <div style={{ width: 220, background: '#313244', borderRight: '1px solid #45475a', overflow: 'auto', flexShrink: 0, userSelect: 'none' }}>
          <div style={{ padding: '8px 10px', fontSize: 11, fontWeight: 600, color: '#6c7086', textTransform: 'uppercase', letterSpacing: 1 }}>
            资源管理器
          </div>
          {renderTree(files)}
        </div>

        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
          <div style={{ display: 'flex', background: '#1e1e2e', overflow: 'hidden', borderBottom: '1px solid #45475a' }}>
            {openTabs.map((tab) => {
              const tabUnsaved = tabContents[tab.id] !== savedContents[tab.id]
              const isActive = tab.id === activeTabId
              return (
                <div
                  key={tab.id}
                  style={{
                    padding: '6px 14px', cursor: 'pointer', fontSize: 12,
                    background: isActive ? '#313244' : '#1e1e2e',
                    borderTop: isActive ? '2px solid #89b4fa' : '2px solid transparent',
                    borderRight: '1px solid #45475a', display: 'flex', alignItems: 'center', gap: 6, whiteSpace: 'nowrap',
                    color: isActive ? '#cdd6f4' : '#6c7086'
                  }}
                  onClick={() => setActiveTabId(tab.id)}
                >
                  <span>{tab.name}</span>
                  {tabUnsaved && <span style={{ color: '#f9e2af', fontSize: 10 }}>●</span>}
                  <span
                    style={{ marginLeft: 4, fontSize: 14, lineHeight: 1, cursor: 'pointer', opacity: 0.6 }}
                    onClick={(e) => { e.stopPropagation(); closeTab(tab.id) }}
                  >
                    ×
                  </span>
                </div>
              )
            })}
            {openTabs.length === 0 && (
              <div style={{ padding: '8px 14px', fontSize: 12, color: '#6c7086' }}>打开一个文件以开始编辑</div>
            )}
          </div>

          <div style={{ flex: 1, position: 'relative', overflow: 'hidden' }}>
            {activeTab ? (
              <>
                <textarea
                  ref={textareaRef}
                  value={code}
                  onChange={(e) => {
                    setTabContents((prev) => ({ ...prev, [activeTabId!]: e.target.value }))
                    handleCursorChange()
                  }}
                  onKeyUp={handleCursorChange}
                  onClick={handleCursorChange}
                  onScroll={handleScrollSync}
                  style={{
                    position: 'absolute', top: 0, left: 0, width: '100%', height: '100%',
                    background: 'transparent', color: 'transparent', caretColor: '#cdd6f4',
                    border: 'none', outline: 'none', resize: 'none',
                    padding: '12px 12px 12px 52px', fontSize: 14, fontFamily: "'Fira Code', 'Cascadia Code', 'Consolas', monospace",
                    lineHeight: 1.6, boxSizing: 'border-box', zIndex: 2, whiteSpace: 'pre', overflow: 'auto',
                    tabSize: 2
                  }}
                  spellCheck={false}
                />
                <div
                  ref={syncScrollRef}
                  style={{
                    position: 'absolute', top: 0, left: 0, width: '100%', height: '100%',
                    padding: '12px 12px 12px 52px', fontSize: 14, fontFamily: "'Fira Code', 'Cascadia Code', 'Consolas', monospace",
                    lineHeight: 1.6, boxSizing: 'border-box', zIndex: 1, whiteSpace: 'pre', overflow: 'hidden',
                    pointerEvents: 'none', color: '#cdd6f4'
                  }}
                  dangerouslySetInnerHTML={{ __html: highlighted.html }}
                />
                <div style={{
                  position: 'absolute', top: 12, left: 0, width: 40,
                  fontFamily: "'Fira Code', 'Cascadia Code', 'Consolas', monospace",
                  fontSize: 14, lineHeight: 1.6, color: '#6c7086', textAlign: 'right', userSelect: 'none', zIndex: 0
                }}>
                  {Array.from({ length: highlighted.lineCount }, (_, i) => (
                    <div key={i}>{i + 1}</div>
                  ))}
                </div>
              </>
            ) : (
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', color: '#6c7086', fontSize: 14, flexDirection: 'column', gap: 8 }}>
                <div style={{ fontSize: 48, opacity: 0.3 }}>⚡</div>
                <div>从左侧文件浏览器中选择文件开始编辑</div>
                <div style={{ fontSize: 11, color: '#585b70' }}>Ctrl+S 保存 · ▶ 运行 Python</div>
              </div>
            )}
          </div>

          {showOutput && (
            <div style={{ height: 160, background: '#181825', borderTop: '1px solid #45475a', display: 'flex', flexDirection: 'column', flexShrink: 0 }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '4px 10px', background: '#313244', borderBottom: '1px solid #45475a' }}>
                <span style={{ fontSize: 11, color: '#6c7086', textTransform: 'uppercase', letterSpacing: 1 }}>输出</span>
                <button
                  onClick={() => { setOutput(''); setShowOutput(false) }}
                  style={{ background: 'transparent', border: 'none', color: '#6c7086', cursor: 'pointer', fontSize: 14 }}
                >
                  ×
                </button>
              </div>
              <pre style={{ flex: 1, overflow: 'auto', padding: 8, margin: 0, fontSize: 12, fontFamily: 'monospace', color: '#a6adc8', whiteSpace: 'pre-wrap' }}>
                {output || '(无输出)'}
              </pre>
            </div>
          )}
        </div>
      </div>

      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: '#89b4fa', color: '#1e1e2e', padding: '3px 12px', fontSize: 11, fontFamily: 'monospace', fontWeight: 600 }}>
        <div style={{ display: 'flex', gap: 16 }}>
          <span>行 {cursorPos.line}, 列 {cursorPos.col}</span>
          <span>空格: 2</span>
        </div>
        <div style={{ display: 'flex', gap: 16 }}>
          <span>{langDisplay}</span>
          <span>UTF-8</span>
          {isUnsaved && <span style={{ color: '#f9e2af' }}>● 未保存</span>}
        </div>
      </div>
    </div>
  )
}
