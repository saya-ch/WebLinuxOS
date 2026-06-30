import { useState, useRef, useCallback, useEffect, useMemo, memo } from 'react'
import { useStore } from '../store'
import type { FileNode } from '../types'

let pyodide: unknown = null

async function loadPyodide() {
  if (pyodide) return pyodide
  const script = document.createElement('script')
  script.src = 'https://cdn.jsdelivr.net/pyodide/v0.26.1/full/pyodide.js'
  document.head.appendChild(script)
  await new Promise<void>((resolve, reject) => {
    script.onload = () => resolve()
    script.onerror = () => reject(new Error('Failed to load Pyodide'))
  })
  pyodide = await (window as unknown as { loadPyodide: (options: { indexURL: string }) => Promise<unknown> }).loadPyodide({ indexURL: 'https://cdn.jsdelivr.net/pyodide/v0.26.1/full/' })
  return pyodide
}

async function executePython(code: string): Promise<string> {
  try {
    const py = await loadPyodide() as { runPython: (code: string) => string }
    py.runPython('import io, sys; sys.stdout = io.StringIO(); sys.stderr = io.StringIO()')
    py.runPython(code)
    const stdout = py.runPython('sys.stdout.getvalue()')
    const stderr = py.runPython('sys.stderr.getvalue()')
    return stdout + (stderr ? '\n' + stderr : '')
  } catch (err) {
    const error = err as { message?: string }
    return error.message || String(err)
  }
}

// 增强的语法高亮关键词
const PY_KEYWORDS = ['def', 'class', 'import', 'from', 'return', 'if', 'elif', 'else', 'for', 'while', 'try', 'except',
  'finally', 'with', 'as', 'yield', 'lambda', 'pass', 'break', 'continue', 'raise', 'and', 'or', 'not', 'in', 'is',
  'True', 'False', 'None', 'global', 'nonlocal', 'assert', 'del', 'async', 'await']

const JS_KEYWORDS = ['function', 'const', 'let', 'var', 'return', 'if', 'else', 'for', 'while', 'class', 'export',
  'import', 'from', 'default', 'new', 'this', 'async', 'await', 'try', 'catch', 'throw', 'typeof', 'instanceof',
  'switch', 'case', 'break', 'continue', 'void', 'null', 'undefined', 'true', 'false', 'of', 'in', 'yield',
  'static', 'extends', 'super', 'get', 'set', 'implements', 'interface', 'private', 'public', 'protected']

const CSS_KEYWORDS = ['important', 'inherit', 'initial', 'none', 'auto', 'block', 'inline', 'flex', 'grid',
  'absolute', 'relative', 'fixed', 'sticky', 'hidden', 'visible', 'scroll', 'center', 'left', 'right',
  'top', 'bottom', 'width', 'height', 'min-width', 'max-width', 'min-height', 'max-height', 'margin',
  'padding', 'border', 'background', 'color', 'font-size', 'font-weight', 'display', 'position', 'z-index']

const HTML_TAGS = ['html', 'head', 'body', 'div', 'span', 'p', 'a', 'img', 'ul', 'ol', 'li', 'h1', 'h2', 'h3',
  'h4', 'h5', 'h6', 'table', 'tr', 'td', 'th', 'form', 'input', 'button', 'script', 'style', 'link', 'meta',
  'title', 'header', 'footer', 'nav', 'section', 'article', 'aside', 'main', 'figure', 'figcaption',
  'video', 'audio', 'canvas', 'svg', 'path', 'rect', 'circle', 'ellipse', 'line', 'polygon', 'polyline']

const BUILTINS = ['console', 'Math', 'Array', 'Object', 'String', 'Number', 'Boolean', 'Date', 'JSON',
  'Promise', 'Set', 'Map', 'window', 'document', 'React', 'useState', 'useEffect', 'useCallback', 'useRef',
  'print', 'len', 'range', 'str', 'int', 'float', 'list', 'dict', 'tuple', 'set', 'type', 'isinstance',
  'enumerate', 'zip', 'map', 'filter', 'sorted', 'reversed', 'open', 'input', 'abs', 'max', 'min', 'sum',
  'any', 'all', 'iter', 'next', 'hasattr', 'getattr', 'setattr', 'delattr', 'property', 'staticmethod',
  'classmethod', 'super', 'isinstance', 'issubclass', 'callable', 'repr', 'hash', 'id', 'dir', 'vars',
  'locals', 'globals', '__init__', '__str__', '__repr__', '__eq__', '__lt__', '__gt__']

// 自动补全关键词
const PY_BUILTINS = ['print()', 'len()', 'range()', 'str()', 'int()', 'float()', 'list()', 'dict()', 'set()',
  'tuple()', 'open()', 'input()', 'abs()', 'max()', 'min()', 'sum()', 'any()', 'all()', 'sorted()', 'reversed()',
  'enumerate()', 'zip()', 'map()', 'filter()', 'isinstance()', 'hasattr()', 'getattr()', 'setattr()']

const JS_BUILTINS = ['console.log()', 'document.getElementById()', 'document.querySelector()', 'JSON.stringify()',
  'JSON.parse()', 'Array.isArray()', 'Object.keys()', 'Object.values()', 'Object.entries()',
  'setTimeout()', 'setInterval()', 'fetch()', 'Promise.resolve()', 'Promise.reject()', 'new Array()',
  'new Object()', 'new Date()', 'new Map()', 'new Set()']

const HTML_SNIPPETS = ['<div></div>', '<span></span>', '<p></p>', '<a href=""></a>', '<img src="" alt="" />',
  '<ul><li></li></ul>', '<ol><li></li></ol>', '<table><tr><td></td></tr></table>',
  '<form><input type="text" /><button></button></form>', '<script></script>', '<style></style>']

const CSS_SNIPPETS = ['display: flex;', 'display: grid;', 'display: block;', 'display: inline;',
  'position: absolute;', 'position: relative;', 'position: fixed;', 'margin: 0 auto;',
  'padding: 10px;', 'border: 1px solid;', 'background-color:;', 'color:;',
  'font-size: 16px;', 'font-weight: bold;', 'text-align: center;', 'width: 100%;', 'height: 100%;']

function detectLang(name: string): string {
  const ext = name.split('.').pop()?.toLowerCase() || ''
  const map: Record<string, string> = {
    py: 'python', ts: 'typescript', tsx: 'typescript', js: 'javascript', jsx: 'javascript',
    html: 'html', css: 'css', json: 'json', md: 'markdown', txt: 'text', sh: 'shell',
    xml: 'xml', yml: 'yaml', yaml: 'yaml', sql: 'sql', java: 'java', cpp: 'cpp', c: 'c',
    go: 'go', rs: 'rust', php: 'php', rb: 'ruby', vue: 'vue', scss: 'scss', sass: 'sass',
    less: 'less'
  }
  return map[ext] || 'text'
}

// 增强的语法高亮（支持CSS、JSON等更多语言）
function highlightCode(code: string, lang: string): { html: string; lineCount: number } {
  const lines = code.split('\n')
  const highlighted = lines.map((line) => {
    let html = ''
    let lastIdx = 0
    let regex: RegExp

    // 根据语言选择不同的正则表达式
    if (lang === 'css') {
      regex = /(\b[a-zA-Z-]+\b|\/\/.*$|#.*$|"(?:[^"\\]|\\.)*"|'(?:[^'\\]|\\.)*'|\d+\.?\d*(px|em|rem|%|vh|vw|s|ms)?|[:;{}])/g
    } else if (lang === 'json') {
      regex = /("(?:[^"\\]|\\.)*"|'(?:[^'\\]|\\.)*'|\d+\.?\d*|[:{}\[\],]|true|false|null)/g
    } else if (lang === 'html') {
      regex = /(<\/?[a-zA-Z][\w-]*[^>]*>|\/\/.*$|#.*$|"(?:[^"\\]|\\.)*"|'(?:[^'\\]|\\.)*'|\d+\.?\d*)/g
    } else {
      regex = /(\b[a-zA-Z_$][\w$]*\b|\/\/.*$|#.*$|"(?:[^"\\]|\\.)*"|'(?:[^'\\]|\\.)*'|`(?:[^`\\]|\\.)*`|\d+\.?\d*|<\/?[a-zA-Z][\w-]*)/g
    }

    let match: RegExpExecArray | null
    while ((match = regex.exec(line)) !== null) {
      html += line.slice(lastIdx, match.index).replace(/</g, '&lt;').replace(/>/g, '&gt;')
      const token = match[0]

      // 注释处理
      if (token.startsWith('//') || (lang === 'python' && token.startsWith('#')) ||
          (lang === 'css' && token.startsWith('/*'))) {
        html += `<span style="color:#6c7086">${token.replace(/</g,'&lt;').replace(/>/g,'&gt;')}</span>`
      }
      // 字符串处理
      else if (token.startsWith('"') || token.startsWith("'") || token.startsWith('`')) {
        html += `<span style="color:#a6e3a1">${token.replace(/</g,'&lt;').replace(/>/g,'&gt;')}</span>`
      }
      // 数字处理
      else if (/^\d/.test(token)) {
        html += `<span style="color:#fab387">${token}</span>`
      }
      // Python 关键词
      else if (lang === 'python' && PY_KEYWORDS.includes(token)) {
        html += `<span style="color:#cba6f7">${token}</span>`
      }
      // JavaScript/TypeScript 关键词
      else if ((lang === 'javascript' || lang === 'typescript') && JS_KEYWORDS.includes(token)) {
        html += `<span style="color:#cba6f7">${token}</span>`
      }
      // CSS 关键词和属性
      else if (lang === 'css' && CSS_KEYWORDS.includes(token)) {
        html += `<span style="color:#89b4fa">${token}</span>`
      }
      // HTML 标签
      else if (lang === 'html' && (token.startsWith('<') || HTML_TAGS.some(tag =>
        token === tag || token.startsWith('<' + tag) || token.startsWith('</' + tag)))) {
        html += `<span style="color:#89b4fa">${token.replace(/</g,'&lt;').replace(/>/g,'&gt;')}</span>`
      }
      // JSON 特殊值
      else if (lang === 'json' && (token === 'true' || token === 'false' || token === 'null')) {
        html += `<span style="color:#f38ba8">${token}</span>`
      }
      // 内置函数/对象
      else if (BUILTINS.includes(token)) {
        html += `<span style="color:#f9e2af">${token}</span>`
      }
      // 普通文本
      else {
        html += token.replace(/</g, '&lt;').replace(/>/g, '&gt;')
      }
      lastIdx = regex.lastIndex
    }
    html += line.slice(lastIdx).replace(/</g, '&lt;').replace(/>/g, '&gt;')
    return html
  })
  return { html: highlighted.join('\n'), lineCount: lines.length }
}

// 自动缩进计算
function calculateIndent(code: string, cursorLine: number): string {
  const lines = code.split('\n')
  if (cursorLine === 0) return ''

  const prevLine = lines[cursorLine - 1] || ''
  const prevIndent = prevLine.match(/^\s*/)?.[0] || ''

  // 需要增加缩进的情况
  const increasePatterns = [
    /:\s*$/,                    // Python: def/class/if/else/for/while/try
    /{\s*$/,                    // JS/TS/JSON/CSS: block start
    /\(\s*$/,                   // 函数参数
    /\[\s*$/,                   // 数组开始
    /<[^/>]*>\s*$/,             // HTML 标签开始
    /elseif\s*$/,               // Lua elseif
  ]

  let indent = prevIndent

  for (const pattern of increasePatterns) {
    if (pattern.test(prevLine)) {
      indent += '  '  // 增加2个空格
      break
    }
  }

  return indent
}

// 获取自动补全建议
function getCompletions(text: string, lang: string): string[] {
  const lastWord = text.match(/[\w$]*$/)?.[0] || ''
  if (lastWord.length < 2) return []

  const suggestions: string[] = []

  // 根据语言添加不同的补全建议
  if (lang === 'python') {
    suggestions.push(...PY_KEYWORDS, ...PY_BUILTINS)
  } else if (lang === 'javascript' || lang === 'typescript') {
    suggestions.push(...JS_KEYWORDS, ...JS_BUILTINS)
  } else if (lang === 'html') {
    suggestions.push(...HTML_TAGS, ...HTML_SNIPPETS)
  } else if (lang === 'css') {
    suggestions.push(...CSS_KEYWORDS, ...CSS_SNIPPETS)
  }

  // 过滤匹配当前输入的选项
  return suggestions.filter(s =>
    s.toLowerCase().startsWith(lastWord.toLowerCase()) &&
    s.toLowerCase() !== lastWord.toLowerCase()
  ).slice(0, 10)
}

// 查找替换组件
const FindReplace = memo(({ onFind, onReplace, onClose }: {
  onFind: (search: string) => void
  onReplace: (search: string, replace: string, all: boolean) => void
  onClose: () => void
}) => {
  const [searchText, setSearchText] = useState('')
  const [replaceText, setReplaceText] = useState('')
  const [matchCount] = useState(0)

  return (
    <div style={{
      background: '#313244',
      borderBottom: '1px solid #45475a',
      padding: '8px 12px',
      display: 'flex',
      gap: 12,
      alignItems: 'center',
      flexWrap: 'wrap'
    }}>
      <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
        <input
          type="text"
          placeholder="查找..."
          value={searchText}
          onChange={(e) => setSearchText(e.target.value)}
          style={{
            background: '#1e1e2e',
            border: '1px solid #45475a',
            borderRadius: 4,
            padding: '4px 8px',
            color: '#cdd6f4',
            fontSize: 13,
            width: 180,
            fontFamily: 'monospace'
          }}
        />
        <span style={{ color: '#6c7086', fontSize: 12 }}>
          {matchCount > 0 ? `${matchCount} 个匹配` : ''}
        </span>
      </div>
      <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
        <input
          type="text"
          placeholder="替换..."
          value={replaceText}
          onChange={(e) => setReplaceText(e.target.value)}
          style={{
            background: '#1e1e2e',
            border: '1px solid #45475a',
            borderRadius: 4,
            padding: '4px 8px',
            color: '#cdd6f4',
            fontSize: 13,
            width: 180,
            fontFamily: 'monospace'
          }}
        />
      </div>
      <div style={{ display: 'flex', gap: 6 }}>
        <button
          onClick={() => onFind(searchText)}
          disabled={!searchText}
          style={{
            background: searchText ? '#89b4fa' : '#45475a',
            color: searchText ? '#1e1e2e' : '#6c7086',
            border: 'none',
            borderRadius: 4,
            padding: '4px 10px',
            cursor: searchText ? 'pointer' : 'not-allowed',
            fontSize: 12,
            fontWeight: 600
          }}
        >
          查找下一个
        </button>
        <button
          onClick={() => onReplace(searchText, replaceText, false)}
          disabled={!searchText}
          style={{
            background: '#45475a',
            color: '#cdd6f4',
            border: '1px solid #585b70',
            borderRadius: 4,
            padding: '4px 10px',
            cursor: searchText ? 'pointer' : 'not-allowed',
            fontSize: 12
          }}
        >
          替换
        </button>
        <button
          onClick={() => onReplace(searchText, replaceText, true)}
          disabled={!searchText}
          style={{
            background: '#45475a',
            color: '#cdd6f4',
            border: '1px solid #585b70',
            borderRadius: 4,
            padding: '4px 10px',
            cursor: searchText ? 'pointer' : 'not-allowed',
            fontSize: 12
          }}
        >
          全部替换
        </button>
      </div>
      <button
        onClick={onClose}
        style={{
          background: 'transparent',
          border: 'none',
          color: '#6c7086',
          cursor: 'pointer',
          fontSize: 16,
          marginLeft: 'auto'
        }}
      >
        ×
      </button>
    </div>
  )
})

// 自动补全提示组件
const AutocompletePopup = memo(({ suggestions, onSelect }: {
  suggestions: string[]
  onSelect: (suggestion: string) => void
}) => {
  if (suggestions.length === 0) return null

  return (
    <div style={{
      position: 'absolute',
      background: '#313244',
      border: '1px solid #45475a',
      borderRadius: 6,
      boxShadow: '0 4px 12px rgba(0,0,0,0.3)',
      maxHeight: 200,
      overflowY: 'auto',
      zIndex: 100,
      minWidth: 200
    }}>
      {suggestions.map((s, i) => (
        <div
          key={i}
          onClick={() => onSelect(s)}
          style={{
            padding: '6px 12px',
            cursor: 'pointer',
            fontSize: 13,
            color: '#cdd6f4',
            borderBottom: i < suggestions.length - 1 ? '1px solid #45475a' : 'none',
            transition: 'background 0.15s'
          }}
          onMouseEnter={(e) => e.currentTarget.style.background = '#45475a'}
          onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
        >
          {s}
        </div>
      ))}
    </div>
  )
})

// 快捷键提示组件
const ShortcutsHelp = memo(({ onClose }: { onClose: () => void }) => {
  const shortcuts = [
    { key: 'Ctrl+S', desc: '保存文件' },
    { key: 'Ctrl+F', desc: '查找替换' },
    { key: 'Ctrl+N', desc: '新建文件' },
    { key: 'Ctrl+W', desc: '关闭当前标签' },
    { key: 'Ctrl+Tab', desc: '切换标签' },
    { key: 'Tab', desc: '自动缩进/补全' },
    { key: 'Ctrl+/', desc: '注释/取消注释' },
    { key: 'Ctrl+D', desc: '删除当前行' },
  ]

  return (
    <div style={{
      position: 'absolute',
      top: '50%',
      left: '50%',
      transform: 'translate(-50%, -50%)',
      background: '#313244',
      border: '1px solid #45475a',
      borderRadius: 8,
      padding: 16,
      minWidth: 300,
      boxShadow: '0 8px 24px rgba(0,0,0,0.4)',
      zIndex: 200
    }}>
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        marginBottom: 12,
        borderBottom: '1px solid #45475a',
        paddingBottom: 8
      }}>
        <span style={{ fontSize: 14, fontWeight: 600, color: '#cdd6f4' }}>快捷键</span>
        <button onClick={onClose} style={{
          background: 'transparent',
          border: 'none',
          color: '#6c7086',
          cursor: 'pointer',
          fontSize: 16
        }}>×</button>
      </div>
      {shortcuts.map((s, i) => (
        <div key={i} style={{
          display: 'flex',
          justifyContent: 'space-between',
          padding: '6px 0',
          color: '#cdd6f4'
        }}>
          <span style={{
            background: '#1e1e2e',
            padding: '2px 8px',
            borderRadius: 4,
            fontSize: 12,
            fontFamily: 'monospace',
            color: '#89b4fa'
          }}>{s.key}</span>
          <span style={{ fontSize: 13 }}>{s.desc}</span>
        </div>
      ))}
    </div>
  )
})

export default function CodeEditor() {
  const files = useStore((s) => s.files)
  const updateFileContent = useStore((s) => s.updateFileContent)
  const addFile = useStore((s) => s.addFile)
  const addNotification = useStore((s) => s.addNotification)

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
  const [showFindReplace, setShowFindReplace] = useState(false)
  const [showShortcuts, setShowShortcuts] = useState(false)
  const [autocompleteSuggestions, setAutocompleteSuggestions] = useState<string[]>([])
  const [autocompletePosition, setAutocompletePosition] = useState({ top: 0, left: 0 })
  const [sidebarWidth] = useState(220)
  const [isNewFileDialogOpen, setIsNewFileDialogOpen] = useState(false)
  const [newFileName, setNewFileName] = useState('')
  const [newFileParentId, setNewFileParentId] = useState<string | null>(null)

  const textareaRef = useRef<HTMLTextAreaElement>(null)
  const syncScrollRef = useRef<HTMLDivElement>(null)
  const autocompleteRef = useRef<HTMLDivElement>(null)

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

  // 性能优化：大文件使用延迟高亮
  const highlighted = useMemo(() => {
    const lineCount = code.split('\n').length
    if (lineCount > 500) {
      // 大文件只显示行号，不做语法高亮
      return { html: code.replace(/</g, '&lt;').replace(/>/g, '&gt;'), lineCount }
    }
    return highlightCode(code, lang)
  }, [code, lang])

  const isUnsaved = activeTabId ? tabContents[activeTabId] !== savedContents[activeTabId] : false

  const handleCursorChange = useCallback(() => {
    const ta = textareaRef.current
    if (!ta) return
    const pos = ta.selectionStart
    const lines = ta.value.substring(0, pos).split('\n')
    setCursorPos({ line: lines.length, col: lines[lines.length - 1].length + 1 })

    // 更新自动补全位置
    if (ta) {
      const textBeforeCursor = ta.value.substring(0, pos)
      const currentLine = lines[lines.length - 1]
      const lineHeight = 22.4 // 14px * 1.6
      const charWidth = 8.4  // 估算

      setAutocompletePosition({
        top: lines.length * lineHeight + 12,
        left: currentLine.length * charWidth + 52
      })

      // 获取补全建议
      const suggestions = getCompletions(textBeforeCursor, lang)
      setAutocompleteSuggestions(suggestions)
    }
  }, [lang])

  const handleScrollSync = useCallback(() => {
    const ta = textareaRef.current
    const div = syncScrollRef.current
    if (ta && div) {
      div.scrollTop = ta.scrollTop
      div.scrollLeft = ta.scrollLeft
    }
  }, [])

  const toggleFolder = useCallback((id: string) => {
    setExpandedFolders((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }, [])

  const handleRun = useCallback(async () => {
    if (!code) return
    if (lang !== 'python' && lang !== 'javascript') {
      setOutput('仅支持运行 Python 和 JavaScript 代码')
      setShowOutput(true)
      return
    }
    setIsRunning(true)
    setPyodideLoading(true)
    setShowOutput(true)
    setOutput('正在加载运行环境...')
    try {
      if (lang === 'python') {
        const result = await executePython(code)
        setOutput(result || '(无输出)')
      } else {
        const logs: string[] = []
        const origLog = console.log
        const origError = console.error
        console.log = (...args: unknown[]) => logs.push(args.map(String).join(' '))
        console.error = (...args: unknown[]) => logs.push('Error: ' + args.map(String).join(' '))
        try {
          const fn = new Function(code)
          fn()
          setOutput(logs.join('\n') || '(无输出)')
        } catch (err) {
          const error = err as { message?: string }
          setOutput(logs.join('\n') + '\n' + (error.message || String(err)))
        }
        console.log = origLog
        console.error = origError
      }
    } catch (err) {
      const error = err as { message?: string }
      setOutput(error.message || String(err))
    }
    setIsRunning(false)
    setPyodideLoading(false)
  }, [code, lang])

  const handleSave = useCallback(() => {
    if (activeTabId) {
      updateFileContent(activeTabId, tabContents[activeTabId] || '')
      setSavedContents((prev) => ({ ...prev, [activeTabId]: tabContents[activeTabId] || '' }))
      addNotification({
        title: '保存成功',
        message: `文件 ${activeTab?.name || ''} 已保存`,
        type: 'success',
        duration: 2000
      })
    }
  }, [activeTabId, tabContents, updateFileContent, addNotification, activeTab])

  const handleKeyDown = useCallback((e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    const ta = textareaRef.current
    if (!ta) return

    // Tab 键：自动缩进或补全
    if (e.key === 'Tab') {
      e.preventDefault()
      const start = ta.selectionStart
      const end = ta.selectionEnd
      const lines = ta.value.substring(0, start).split('\n')
      const currentLineIdx = lines.length - 1
      const indent = calculateIndent(ta.value, currentLineIdx + 1)

      // 如果有补全建议，使用第一个
      if (autocompleteSuggestions.length > 0) {
        const suggestion = autocompleteSuggestions[0]
        const lastWord = ta.value.substring(0, start).match(/[\w$]*$/)?.[0] || ''
        const newValue = ta.value.substring(0, start - lastWord.length) + suggestion + ta.value.substring(end)
        setTabContents((prev) => ({ ...prev, [activeTabId!]: newValue }))
        setAutocompleteSuggestions([])
        setTimeout(() => {
          ta.selectionStart = ta.selectionEnd = start - lastWord.length + suggestion.length
        }, 0)
      } else {
        // 否则插入缩进
        const newValue = ta.value.substring(0, start) + indent + ta.value.substring(end)
        setTabContents((prev) => ({ ...prev, [activeTabId!]: newValue }))
        setTimeout(() => {
          ta.selectionStart = ta.selectionEnd = start + indent.length
        }, 0)
      }
    }

    // Enter 键：自动缩进
    if (e.key === 'Enter') {
      const start = ta.selectionStart
      const lines = ta.value.substring(0, start).split('\n')
      const currentLineIdx = lines.length - 1
      const indent = calculateIndent(ta.value, currentLineIdx + 1)
      const newValue = ta.value.substring(0, start) + '\n' + indent + ta.value.substring(ta.selectionEnd)
      setTabContents((prev) => ({ ...prev, [activeTabId!]: newValue }))
      e.preventDefault()
      setTimeout(() => {
        ta.selectionStart = ta.selectionEnd = start + 1 + indent.length
        handleCursorChange()
      }, 0)
    }

    // Ctrl+/：注释/取消注释
    if ((e.ctrlKey || e.metaKey) && e.key === '/') {
      e.preventDefault()
      const start = ta.selectionStart
      const end = ta.selectionEnd
      const lines = ta.value.split('\n')
      const startLine = ta.value.substring(0, start).split('\n').length - 1
      const endLine = ta.value.substring(0, end).split('\n').length - 1

      const commentPrefix = lang === 'python' ? '# ' : '// '
      const newLines = lines.map((line, i) => {
        if (i >= startLine && i <= endLine) {
          if (line.trim().startsWith(commentPrefix.trim())) {
            return line.replace(commentPrefix.trim(), '')
          } else {
            return commentPrefix + line
          }
        }
        return line
      })

      const newValue = newLines.join('\n')
      setTabContents((prev) => ({ ...prev, [activeTabId!]: newValue }))
    }

    // Ctrl+D：删除当前行
    if ((e.ctrlKey || e.metaKey) && e.key === 'd') {
      e.preventDefault()
      const start = ta.selectionStart
      const lines = ta.value.split('\n')
      const currentLineIdx = ta.value.substring(0, start).split('\n').length - 1
      const newLines = lines.filter((_, i) => i !== currentLineIdx)
      const newValue = newLines.join('\n')
      setTabContents((prev) => ({ ...prev, [activeTabId!]: newValue }))
    }

    // Escape：关闭补全提示
    if (e.key === 'Escape') {
      setAutocompleteSuggestions([])
      setShowFindReplace(false)
      setShowShortcuts(false)
    }
  }, [activeTabId, lang, autocompleteSuggestions, handleCursorChange])

  // 查找功能
  const handleFind = useCallback((search: string) => {
    const ta = textareaRef.current
    if (!ta || !search) return

    const text = ta.value
    const start = ta.selectionEnd
    const idx = text.indexOf(search, start)

    if (idx !== -1) {
      ta.selectionStart = idx
      ta.selectionEnd = idx + search.length
      ta.focus()
    } else {
      // 从头开始查找
      const idxFromStart = text.indexOf(search, 0)
      if (idxFromStart !== -1) {
        ta.selectionStart = idxFromStart
        ta.selectionEnd = idxFromStart + search.length
        ta.focus()
      }
    }
    handleCursorChange()
  }, [handleCursorChange])

  // 替换功能
  const handleReplace = useCallback((search: string, replace: string, all: boolean) => {
    if (!search || !activeTabId) return

    const currentCode = tabContents[activeTabId] || ''
    let newCode: string

    if (all) {
      newCode = currentCode.split(search).join(replace)
    } else {
      const ta = textareaRef.current
      if (ta && ta.selectionStart !== ta.selectionEnd) {
        const selected = ta.value.substring(ta.selectionStart, ta.selectionEnd)
        if (selected === search) {
          newCode = currentCode.substring(0, ta.selectionStart) + replace + currentCode.substring(ta.selectionEnd)
        } else {
          newCode = currentCode
        }
      } else {
        newCode = currentCode.replace(search, replace)
      }
    }

    setTabContents((prev) => ({ ...prev, [activeTabId!]: newCode }))
  }, [activeTabId, tabContents])

  // 补全选择
  const handleAutocompleteSelect = useCallback((suggestion: string) => {
    const ta = textareaRef.current
    if (!ta || !activeTabId) return

    const start = ta.selectionStart
    const lastWord = ta.value.substring(0, start).match(/[\w$]*$/)?.[0] || ''
    const newValue = ta.value.substring(0, start - lastWord.length) + suggestion + ta.value.substring(ta.selectionEnd)
    setTabContents((prev) => ({ ...prev, [activeTabId!]: newValue }))
    setAutocompleteSuggestions([])

    setTimeout(() => {
      ta.selectionStart = ta.selectionEnd = start - lastWord.length + suggestion.length
      ta.focus()
    }, 0)
  }, [activeTabId])

  // 新建文件
  const handleNewFile = useCallback(() => {
    if (newFileName && newFileParentId) {
      addFile(newFileParentId, newFileName, 'file')
      setIsNewFileDialogOpen(false)
      setNewFileName('')
      setNewFileParentId(null)

      // 找到新创建的文件并打开
      setTimeout(() => {
        const newFile = findFileById(files, newFileName)
        if (newFile) openFile(newFile)
      }, 100)
    }
  }, [newFileName, newFileParentId, addFile, files, openFile])

  const findFileById = (nodes: FileNode[], name: string): FileNode | undefined => {
    for (const n of nodes) {
      if (n.name === name && n.type === 'file') return n
      if (n.children) { const f = findFileById(n.children, name); if (f) return f }
    }
    return undefined
  }

  const renderTree = (nodes: FileNode[], depth: number = 0): React.ReactNode[] => {
    const folders = nodes.filter((n) => n.type === 'folder')
    const fileItems = nodes.filter((n) => n.type === 'file')
    const result: React.ReactNode[] = []

    for (const folder of folders) {
      const isExpanded = expandedFolders.has(folder.id)
      const isOpen = openTabs.find((t) => t.id === folder.id)
      result.push(
        <div
          key={folder.id}
          style={{
            padding: '4px 8px',
            paddingLeft: 8 + depth * 16,
            cursor: 'pointer',
            fontSize: 12,
            borderRadius: 3,
            display: 'flex',
            alignItems: 'center',
            gap: 6,
            whiteSpace: 'nowrap',
            color: isOpen ? '#89b4fa' : '#cdd6f4',
            background: 'transparent',
            transition: 'background 0.15s'
          }}
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
          style={{
            padding: '4px 8px',
            paddingLeft: 8 + depth * 16,
            cursor: 'pointer',
            fontSize: 12,
            borderRadius: 3,
            display: 'flex',
            alignItems: 'center',
            gap: 6,
            whiteSpace: 'nowrap',
            color: isOpen ? '#89b4fa' : '#cdd6f4',
            background: 'transparent',
            transition: 'background 0.15s'
          }}
          onClick={() => openFile(file)}
          onMouseEnter={(e) => (e.currentTarget.style.background = '#45475a')}
          onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
          onContextMenu={(e) => {
            e.preventDefault()
            // 可以添加右键菜单功能
          }}
        >
          {getFileIcon(file.name)} {file.name}
        </div>
      )
    }
    return result
  }

  const getFileIcon = (name: string): string => {
    const ext = name.split('.').pop()?.toLowerCase() || ''
    const icons: Record<string, string> = {
      py: '🐍', js: '📜', ts: '🔷', jsx: '⚛️', tsx: '⚛️',
      html: '🌐', css: '🎨', json: '📋', md: '📝', txt: '📄',
      sh: '🔧', xml: '📄', yml: '⚙️', yaml: '⚙️', sql: '🗃️',
      java: '☕', cpp: '⚙️', c: '⚙️', go: '🔵', rs: '🦀',
      php: '🐘', rb: '💎', vue: '💚', scss: '🎨', sass: '🎨'
    }
    return icons[ext] || '📄'
  }

  const langDisplay = activeTab ? (() => {
    const ext = activeTab.name.split('.').pop()?.toLowerCase() || ''
    const map: Record<string, string> = {
      ts: 'TypeScript', tsx: 'TypeScript React', js: 'JavaScript', jsx: 'JavaScript React',
      py: 'Python', html: 'HTML', css: 'CSS', json: 'JSON', md: 'Markdown', txt: 'Plain Text',
      sh: 'Shell', xml: 'XML', yml: 'YAML', yaml: 'YAML', sql: 'SQL', java: 'Java',
      cpp: 'C++', c: 'C', go: 'Go', rs: 'Rust', php: 'PHP', rb: 'Ruby',
      vue: 'Vue', scss: 'SCSS', sass: 'Sass'
    }
    return map[ext] || 'Plain Text'
  })() : 'Plain Text'

  const lineCount = code.split('\n').length
  const fileSizeKB = (new Blob([code]).size / 1024).toFixed(1)

  // 监听全局快捷键
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 's') {
        e.preventDefault()
        handleSave()
      }
      if ((e.ctrlKey || e.metaKey) && e.key === 'f') {
        e.preventDefault()
        setShowFindReplace(true)
      }
      if ((e.ctrlKey || e.metaKey) && e.key === 'n') {
        e.preventDefault()
        setIsNewFileDialogOpen(true)
      }
      if ((e.ctrlKey || e.metaKey) && e.key === 'w') {
        e.preventDefault()
        if (activeTabId) closeTab(activeTabId)
      }
      if ((e.ctrlKey || e.metaKey) && e.key === '?') {
        e.preventDefault()
        setShowShortcuts(true)
      }
      if (e.ctrlKey && e.key === 'Tab') {
        e.preventDefault()
        const idx = openTabs.findIndex((t) => t.id === activeTabId)
        const nextTab = openTabs[(idx + 1) % openTabs.length]
        if (nextTab) setActiveTabId(nextTab.id)
      }
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [handleSave, activeTabId, closeTab, openTabs])

  // 监听 open-file 事件
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

  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      height: '100%',
      background: '#1e1e2e',
      color: '#cdd6f4',
      fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif'
    }}>
      {/* 工具栏 */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        background: '#313244',
        padding: '6px 10px',
        gap: 6,
        borderBottom: '1px solid #45475a',
        flexWrap: 'wrap'
      }}>
        <button
          onClick={() => setIsNewFileDialogOpen(true)}
          style={{
            background: 'transparent',
            color: '#cdd6f4',
            border: '1px solid #45475a',
            borderRadius: 4,
            padding: '5px 10px',
            cursor: 'pointer',
            fontSize: 12,
            display: 'flex',
            alignItems: 'center',
            gap: 4,
            transition: 'all 0.15s'
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.background = '#45475a'
            e.currentTarget.style.borderColor = '#585b70'
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.background = 'transparent'
            e.currentTarget.style.borderColor = '#45475a'
          }}
        >
          📄 新建
        </button>
        <button
          onClick={handleSave}
          disabled={!activeTabId || !isUnsaved}
          style={{
            background: isUnsaved ? '#89b4fa' : '#45475a',
            color: isUnsaved ? '#1e1e2e' : '#6c7086',
            border: 'none',
            borderRadius: 4,
            padding: '5px 10px',
            cursor: isUnsaved ? 'pointer' : 'not-allowed',
            fontSize: 12,
            fontWeight: 600,
            display: 'flex',
            alignItems: 'center',
            gap: 4
          }}
        >
          💾 保存
        </button>
        <button
          onClick={() => setShowFindReplace(!showFindReplace)}
          style={{
            background: showFindReplace ? '#45475a' : 'transparent',
            color: '#cdd6f4',
            border: '1px solid #45475a',
            borderRadius: 4,
            padding: '5px 10px',
            cursor: 'pointer',
            fontSize: 12,
            display: 'flex',
            alignItems: 'center',
            gap: 4
          }}
        >
          🔍 查找
        </button>
        <button
          onClick={handleRun}
          disabled={isRunning}
          style={{
            background: isRunning ? '#45475a' : '#a6e3a1',
            color: isRunning ? '#6c7086' : '#1e1e2e',
            border: 'none',
            borderRadius: 4,
            padding: '5px 10px',
            cursor: isRunning ? 'not-allowed' : 'pointer',
            fontSize: 12,
            fontWeight: 600,
            display: 'flex',
            alignItems: 'center',
            gap: 4
          }}
        >
          ▶ 运行
        </button>
        <button
          onClick={() => setShowOutput(!showOutput)}
          style={{
            background: showOutput ? '#45475a' : 'transparent',
            color: '#cdd6f4',
            border: '1px solid #45475a',
            borderRadius: 4,
            padding: '5px 10px',
            cursor: 'pointer',
            fontSize: 12
          }}
        >
          💻 输出
        </button>
        <button
          onClick={() => setShowShortcuts(!showShortcuts)}
          style={{
            background: 'transparent',
            color: '#6c7086',
            border: '1px solid #45475a',
            borderRadius: 4,
            padding: '5px 10px',
            cursor: 'pointer',
            fontSize: 12
          }}
        >
          ⌨️ 快捷键
        </button>
        {pyodideLoading && (
          <span style={{ fontSize: 11, color: '#f9e2af', marginLeft: 8, display: 'flex', alignItems: 'center', gap: 4 }}>
            <span style={{ animation: 'spin 1s linear infinite' }}>⏳</span> 加载环境...
          </span>
        )}
      </div>

      {/* 查找替换面板 */}
      {showFindReplace && (
        <FindReplace
          onFind={handleFind}
          onReplace={handleReplace}
          onClose={() => setShowFindReplace(false)}
        />
      )}

      {/* 快捷键提示 */}
      {showShortcuts && <ShortcutsHelp onClose={() => setShowShortcuts(false)} />}

      {/* 新建文件对话框 */}
      {isNewFileDialogOpen && (
        <div style={{
          position: 'absolute',
          top: '50%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
          background: '#313244',
          border: '1px solid #45475a',
          borderRadius: 8,
          padding: 16,
          minWidth: 320,
          boxShadow: '0 8px 24px rgba(0,0,0,0.4)',
          zIndex: 200
        }}>
          <div style={{ marginBottom: 12, fontSize: 14, fontWeight: 600, color: '#cdd6f4' }}>
            新建文件
          </div>
          <input
            type="text"
            placeholder="文件名（如：script.py）"
            value={newFileName}
            onChange={(e) => setNewFileName(e.target.value)}
            style={{
              width: '100%',
              background: '#1e1e2e',
              border: '1px solid #45475a',
              borderRadius: 4,
              padding: '8px 12px',
              color: '#cdd6f4',
              fontSize: 13,
              marginBottom: 12,
              boxSizing: 'border-box'
            }}
          />
          <div style={{ marginBottom: 12 }}>
            <label style={{ fontSize: 12, color: '#6c7086', marginRight: 8 }}>父目录:</label>
            <select
              value={newFileParentId || ''}
              onChange={(e) => setNewFileParentId(e.target.value)}
              style={{
                background: '#1e1e2e',
                border: '1px solid #45475a',
                borderRadius: 4,
                padding: '6px 8px',
                color: '#cdd6f4',
                fontSize: 12,
                minWidth: 180
              }}
            >
              <option value="">选择目录</option>
              {files.filter(f => f.type === 'folder').map(f => (
                <option key={f.id} value={f.id}>{f.name}</option>
              ))}
            </select>
          </div>
          <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
            <button
              onClick={() => setIsNewFileDialogOpen(false)}
              style={{
                background: '#45475a',
                color: '#cdd6f4',
                border: 'none',
                borderRadius: 4,
                padding: '6px 12px',
                cursor: 'pointer',
                fontSize: 12
              }}
            >
              取消
            </button>
            <button
              onClick={handleNewFile}
              disabled={!newFileName || !newFileParentId}
              style={{
                background: newFileName && newFileParentId ? '#89b4fa' : '#45475a',
                color: newFileName && newFileParentId ? '#1e1e2e' : '#6c7086',
                border: 'none',
                borderRadius: 4,
                padding: '6px 12px',
                cursor: newFileName && newFileParentId ? 'pointer' : 'not-allowed',
                fontSize: 12,
                fontWeight: 600
              }}
            >
              创建
            </button>
          </div>
        </div>
      )}

      {/* 主编辑区域 */}
      <div style={{ display: 'flex', flex: 1, overflow: 'hidden' }}>
        {/* 侧边栏文件树 */}
        <div style={{
          width: sidebarWidth,
          background: '#313244',
          borderRight: '1px solid #45475a',
          overflow: 'auto',
          flexShrink: 0,
          userSelect: 'none',
          resize: 'horizontal',
          minWidth: 150,
          maxWidth: 400
        }}>
          <div style={{
            padding: '8px 10px',
            fontSize: 11,
            fontWeight: 600,
            color: '#6c7086',
            textTransform: 'uppercase',
            letterSpacing: 1,
            borderBottom: '1px solid #45475a'
          }}>
            📁 文件浏览器
          </div>
          {renderTree(files)}
        </div>

        {/* 编辑器主体 */}
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
          {/* 标签页 */}
          <div style={{
            display: 'flex',
            background: '#1e1e2e',
            overflow: 'auto',
            borderBottom: '1px solid #45475a',
            minHeight: 36,
            flexShrink: 0
          }}>
            {openTabs.map((tab) => {
              const tabUnsaved = tabContents[tab.id] !== savedContents[tab.id]
              const isActive = tab.id === activeTabId
              return (
                <div
                  key={tab.id}
                  style={{
                    padding: '6px 14px',
                    cursor: 'pointer',
                    fontSize: 12,
                    background: isActive ? '#313244' : '#1e1e2e',
                    borderTop: isActive ? '2px solid #89b4fa' : '2px solid transparent',
                    borderRight: '1px solid #45475a',
                    display: 'flex',
                    alignItems: 'center',
                    gap: 6,
                    whiteSpace: 'nowrap',
                    color: isActive ? '#cdd6f4' : '#6c7086',
                    transition: 'all 0.15s',
                    minWidth: 80
                  }}
                  onClick={() => setActiveTabId(tab.id)}
                >
                  <span>{getFileIcon(tab.name)}</span>
                  <span>{tab.name}</span>
                  {tabUnsaved && <span style={{ color: '#f9e2af', fontSize: 10 }}>●</span>}
                  <span
                    style={{
                      marginLeft: 4,
                      fontSize: 14,
                      lineHeight: 1,
                      cursor: 'pointer',
                      opacity: 0.6,
                      transition: 'opacity 0.15s'
                    }}
                    onClick={(e) => { e.stopPropagation(); closeTab(tab.id) }}
                    onMouseEnter={(e) => e.currentTarget.style.opacity = '1'}
                    onMouseLeave={(e) => e.currentTarget.style.opacity = '0.6'}
                  >
                    ×
                  </span>
                </div>
              )
            })}
            {openTabs.length === 0 && (
              <div style={{ padding: '8px 14px', fontSize: 12, color: '#6c7086' }}>
                打开文件开始编辑
              </div>
            )}
          </div>

          {/* 编辑区域 */}
          <div style={{ flex: 1, position: 'relative', overflow: 'hidden' }}>
            {activeTab ? (
              <>
                {/* 行号 */}
                <div style={{
                  position: 'absolute',
                  top: 12,
                  left: 0,
                  width: 40,
                  fontFamily: "'Fira Code', 'Cascadia Code', 'Consolas', monospace",
                  fontSize: 14,
                  lineHeight: 1.6,
                  color: '#6c7086',
                  textAlign: 'right',
                  userSelect: 'none',
                  zIndex: 0,
                  paddingRight: 8,
                  background: '#181825'
                }}>
                  {Array.from({ length: Math.min(highlighted.lineCount, 500) }, (_, i) => (
                    <div key={i} style={{
                      color: cursorPos.line === i + 1 ? '#89b4fa' : '#6c7086',
                      fontWeight: cursorPos.line === i + 1 ? 600 : 400
                    }}>
                      {i + 1}
                    </div>
                  ))}
                  {highlighted.lineCount > 500 && (
                    <div style={{ color: '#f9e2af', fontSize: 11 }}>...</div>
                  )}
                </div>

                {/* 语法高亮层 */}
                <div
                  ref={syncScrollRef}
                  style={{
                    position: 'absolute',
                    top: 0,
                    left: 0,
                    width: '100%',
                    height: '100%',
                    padding: '12px 12px 12px 52px',
                    fontSize: 14,
                    fontFamily: "'Fira Code', 'Cascadia Code', 'Consolas', monospace",
                    lineHeight: 1.6,
                    boxSizing: 'border-box',
                    zIndex: 1,
                    whiteSpace: 'pre',
                    overflow: 'hidden',
                    pointerEvents: 'none',
                    color: '#cdd6f4'
                  }}
                  dangerouslySetInnerHTML={{ __html: highlighted.html }}
                />

                {/* 编辑器输入层 */}
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
                  onKeyDown={handleKeyDown}
                  style={{
                    position: 'absolute',
                    top: 0,
                    left: 0,
                    width: '100%',
                    height: '100%',
                    background: 'transparent',
                    color: 'transparent',
                    caretColor: '#cdd6f4',
                    border: 'none',
                    outline: 'none',
                    resize: 'none',
                    padding: '12px 12px 12px 52px',
                    fontSize: 14,
                    fontFamily: "'Fira Code', 'Cascadia Code', 'Consolas', monospace",
                    lineHeight: 1.6,
                    boxSizing: 'border-box',
                    zIndex: 2,
                    whiteSpace: 'pre',
                    overflow: 'auto',
                    tabSize: 2
                  }}
                  spellCheck={false}
                  autoComplete="off"
                  autoCorrect="off"
                  autoCapitalize="off"
                />

                {/* 自动补全提示 */}
                {autocompleteSuggestions.length > 0 && (
                  <div
                    ref={autocompleteRef}
                    style={{
                      position: 'absolute',
                      top: autocompletePosition.top,
                      left: autocompletePosition.left,
                      zIndex: 100
                    }}
                  >
                    <AutocompletePopup
                      suggestions={autocompleteSuggestions}
                      onSelect={handleAutocompleteSelect}
                    />
                  </div>
                )}
              </>
            ) : (
              <div style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                height: '100%',
                color: '#6c7086',
                fontSize: 14,
                flexDirection: 'column',
                gap: 12,
                background: '#1e1e2e'
              }}>
                <div style={{ fontSize: 64, opacity: 0.2 }}>⚡</div>
                <div style={{ fontSize: 16 }}>从左侧文件浏览器选择文件开始编辑</div>
                <div style={{ fontSize: 12, color: '#585b70', display: 'flex', gap: 16 }}>
                  <span>Ctrl+N 新建</span>
                  <span>Ctrl+S 保存</span>
                  <span>Ctrl+F 查找</span>
                  <span>▶ 运行 Python/JS</span>
                </div>
              </div>
            )}
          </div>

          {/* 输出面板 */}
          {showOutput && (
            <div style={{
              height: 180,
              background: '#181825',
              borderTop: '1px solid #45475a',
              display: 'flex',
              flexDirection: 'column',
              flexShrink: 0
            }}>
              <div style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '4px 10px',
                background: '#313244',
                borderBottom: '1px solid #45475a'
              }}>
                <span style={{ fontSize: 11, color: '#6c7086', textTransform: 'uppercase', letterSpacing: 1 }}>
                  💻 输出
                </span>
                <button
                  onClick={() => { setOutput(''); setShowOutput(false) }}
                  style={{
                    background: 'transparent',
                    border: 'none',
                    color: '#6c7086',
                    cursor: 'pointer',
                    fontSize: 14
                  }}
                >
                  ×
                </button>
              </div>
              <pre style={{
                flex: 1,
                overflow: 'auto',
                padding: 12,
                margin: 0,
                fontSize: 13,
                fontFamily: "'Fira Code', 'Cascadia Code', monospace",
                color: '#a6adc8',
                whiteSpace: 'pre-wrap',
                wordBreak: 'break-word'
              }}>
                {output || '(无输出)'}
              </pre>
            </div>
          )}
        </div>
      </div>

      {/* 状态栏 */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        background: '#89b4fa',
        color: '#1e1e2e',
        padding: '3px 12px',
        fontSize: 11,
        fontFamily: 'monospace',
        fontWeight: 600,
        flexShrink: 0
      }}>
        <div style={{ display: 'flex', gap: 16 }}>
          <span>📍 行 {cursorPos.line}, 列 {cursorPos.col}</span>
          <span>📝 {lineCount} 行</span>
          <span>📦 {fileSizeKB} KB</span>
          <span>⚙️ 空格: 2</span>
        </div>
        <div style={{ display: 'flex', gap: 16, alignItems: 'center' }}>
          <span>{langDisplay}</span>
          <span>UTF-8</span>
          {isUnsaved && <span style={{ color: '#1e1e2e', background: '#f9e2af', padding: '1px 6px', borderRadius: 3 }}>未保存</span>}
          {activeTab && <span style={{ opacity: 0.8 }}>{activeTab.name}</span>}
        </div>
      </div>

      {/* CSS动画 */}
      <style>{`
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  )
}