import { useState, useRef, useCallback, useMemo } from 'react'
import { useStore } from '../store'
import type { FileNode } from '../types'

const KEYWORDS = ['function', 'const', 'let', 'var', 'return', 'if', 'else', 'for', 'while', 'class', 'export', 'import',
  'from', 'default', 'new', 'this', 'async', 'await', 'try', 'catch', 'throw', 'typeof', 'instanceof', 'switch',
  'case', 'break', 'continue', 'void', 'null', 'undefined', 'true', 'false']

const BUILTINS = ['console', 'Math', 'Array', 'Object', 'String', 'Number', 'Boolean', 'Date', 'JSON',
  'Promise', 'Set', 'Map', 'window', 'document', 'React', 'useState', 'useEffect', 'useCallback', 'useRef']

function highlightCode(code: string): { html: string; lineCount: number } {
  const lines = code.split('\n')
  const highlighted = lines.map((line) => {
    let result = line
    const regex = /(\b[a-zA-Z_$][\w$]*\b|\/\/.*$|"(?:[^"\\]|\\.)*"|'(?:[^'\\]|\\.)*'|`(?:[^`\\]|\\.)*`|\d+)/g
    let html = ''
    let lastIdx = 0
    let match: RegExpExecArray | null
    while ((match = regex.exec(line)) !== null) {
      html += result.slice(lastIdx, match.index).replace(/</g, '&lt;').replace(/>/g, '&gt;')
      const token = match[0]
      if (token.startsWith('//')) {
        html += `<span style="color:#6a9955">${token.replace(/</g,'&lt;').replace(/>/g,'&gt;')}</span>`
      } else if (token.startsWith('"') || token.startsWith("'") || token.startsWith('`')) {
        html += `<span style="color:#ce9178">${token.replace(/</g,'&lt;').replace(/>/g,'&gt;')}</span>`
      } else if (/^\d+$/.test(token)) {
        html += `<span style="color:#b5cea8">${token}</span>`
      } else if (KEYWORDS.includes(token)) {
        html += `<span style="color:#569cd6">${token}</span>`
      } else if (BUILTINS.includes(token)) {
        html += `<span style="color:#dcdcaa">${token}</span>`
      } else {
        html += token.replace(/</g, '&lt;').replace(/>/g, '&gt;')
      }
      lastIdx = regex.lastIndex
    }
    html += result.slice(lastIdx).replace(/</g, '&lt;').replace(/>/g, '&gt;')
    return html
  })
  return { html: highlighted.join('\n'), lineCount: lines.length }
}

const sidebarItem: React.CSSProperties = {
  padding: '4px 8px', cursor: 'pointer', fontSize: 12, borderRadius: 2,
  display: 'flex', alignItems: 'center', gap: 6, whiteSpace: 'nowrap'
}

const tabStyle: React.CSSProperties = {
  padding: '5px 14px', cursor: 'pointer', fontSize: 12,
  background: '#2d2d2d', borderRight: '1px solid #444', display: 'flex', alignItems: 'center', gap: 6, whiteSpace: 'nowrap'
}

const tabActive: React.CSSProperties = {
  ...tabStyle, background: '#1e1e1e', borderTop: '2px solid #007acc'
}

export default function CodeEditor() {
  const { files } = useStore()
  const [openTabs, setOpenTabs] = useState<FileNode[]>([])
  const [activeTabId, setActiveTabId] = useState<string | null>(null)
  const [tabContents, setTabContents] = useState<Record<string, string>>({})
  const [cursorPos, setCursorPos] = useState({ line: 1, col: 1 })
  const [expandedFolders, setExpandedFolders] = useState<Set<string>>(new Set(['home', 'user', 'documents', 'root']))
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  const openFile = useCallback((file: FileNode) => {
    if (!openTabs.find((t) => t.id === file.id)) {
      setOpenTabs((prev) => [...prev, file])
      setTabContents((prev) => ({ ...prev, [file.id]: file.content || '' }))
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
    if (activeTabId === fileId) {
      const next = openTabs[idx + 1] || openTabs[idx - 1]
      setActiveTabId(next?.id || null)
    }
  }, [openTabs, activeTabId])

  const activeTab = openTabs.find((t) => t.id === activeTabId)
  const code = activeTabId ? tabContents[activeTabId] || '' : ''
  const highlighted = useMemo(() => highlightCode(code), [code])

  const handleCursorChange = () => {
    const ta = textareaRef.current
    if (!ta) return
    const pos = ta.selectionStart
    const lines = ta.value.substring(0, pos).split('\n')
    setCursorPos({ line: lines.length, col: lines[lines.length - 1].length + 1 })
  }

  const detectLanguage = (name: string) => {
    const ext = name.split('.').pop()?.toLowerCase()
    const map: Record<string, string> = { ts: 'TypeScript', tsx: 'TypeScript React', js: 'JavaScript', jsx: 'JavaScript React', py: 'Python', html: 'HTML', css: 'CSS', json: 'JSON', md: 'Markdown', txt: 'Plain Text', sh: 'Shell Script', xml: 'XML', yml: 'YAML', yaml: 'YAML', sql: 'SQL', java: 'Java', cpp: 'C++', c: 'C', go: 'Go', rs: 'Rust', php: 'PHP', rb: 'Ruby' }
    return map[ext || ''] || 'Plain Text'
  }

  const toggleFolder = (id: string) => {
    setExpandedFolders((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  const renderTree = (nodes: FileNode[], depth: number = 0): React.ReactNode[] => {
    const groups: { folder: FileNode; children: FileNode[] }[] = []
    const filesList: FileNode[] = []
    for (const node of nodes) {
      if (node.type === 'folder') {
        groups.push({ folder: node, children: node.children || [] })
      } else {
        filesList.push(node)
      }
    }
    const all: React.ReactNode[] = []
    for (const group of groups) {
      const isExpanded = expandedFolders.has(group.folder.id)
      all.push(
        <div
          key={group.folder.id}
          style={{ ...sidebarItem, paddingLeft: 8 + depth * 16 }}
          onClick={() => toggleFolder(group.folder.id)}
          onMouseEnter={(e) => (e.currentTarget.style.background = '#2a2d2e')}
          onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
        >
          {isExpanded ? '📂' : '📁'} {group.folder.name}
        </div>
      )
      if (isExpanded) {
        all.push(...renderTree(group.children, depth + 1))
      }
    }
    for (const file of filesList) {
      all.push(
        <div
          key={file.id}
          style={{ ...sidebarItem, paddingLeft: 8 + depth * 16, color: openTabs.find((t) => t.id === file.id) ? '#569cd6' : '#ccc' }}
          onClick={() => openFile(file)}
          onMouseEnter={(e) => (e.currentTarget.style.background = '#2a2d2e')}
          onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
        >
          📄 {file.name}
        </div>
      )
    }
    return all
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', background: '#1e1e1e', color: '#d4d4d4' }}>
      <div style={{ display: 'flex', flex: 1, overflow: 'hidden' }}>
        <div style={{ width: 220, background: '#252526', borderRight: '1px solid #333', overflow: 'auto', flexShrink: 0, userSelect: 'none' }}>
          <div style={{ padding: '8px 10px', fontSize: 11, fontWeight: 600, color: '#888', textTransform: 'uppercase', letterSpacing: 1 }}>
            资源管理器
          </div>
          {renderTree(files)}
        </div>

        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
          <div style={{ display: 'flex', background: '#252526', overflow: 'hidden' }}>
            {openTabs.map((tab) => (
              <div
                key={tab.id}
                style={tab.id === activeTabId ? tabActive : tabStyle}
                onClick={() => setActiveTabId(tab.id)}
              >
                <span>{tab.name}</span>
                <span
                  style={{ marginLeft: 4, fontSize: 14, lineHeight: 1, cursor: 'pointer', opacity: 0.6 }}
                  onClick={(e) => { e.stopPropagation(); closeTab(tab.id) }}
                >
                  ×
                </span>
              </div>
            ))}
            {openTabs.length === 0 && (
              <div style={{ padding: '8px 14px', fontSize: 12, color: '#888' }}>打开一个文件以开始编辑</div>
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
                  style={{
                    position: 'absolute', top: 0, left: 0, width: '100%', height: '100%',
                    background: 'transparent', color: 'transparent', caretColor: '#fff',
                    border: 'none', outline: 'none', resize: 'none',
                    padding: '12px 12px 12px 52px', fontSize: 14, fontFamily: "'Fira Code', 'Cascadia Code', 'Consolas', monospace",
                    lineHeight: 1.6, boxSizing: 'border-box', zIndex: 2, whiteSpace: 'pre', overflow: 'auto'
                  }}
                  spellCheck={false}
                />
                <div style={{
                  position: 'absolute', top: 0, left: 0, width: '100%', height: '100%',
                  padding: '12px 12px 12px 52px', fontSize: 14, fontFamily: "'Fira Code', 'Cascadia Code', 'Consolas', monospace",
                  lineHeight: 1.6, boxSizing: 'border-box', zIndex: 1, whiteSpace: 'pre', overflow: 'auto',
                  pointerEvents: 'none', color: '#d4d4d4'
                }} dangerouslySetInnerHTML={{ __html: highlighted.html }} />
                <div style={{
                  position: 'absolute', top: 12, left: 0, width: 40,
                  fontFamily: "'Fira Code', 'Cascadia Code', 'Consolas', monospace",
                  fontSize: 14, lineHeight: 1.6, color: '#858585', textAlign: 'right', userSelect: 'none'
                }}>
                  {Array.from({ length: highlighted.lineCount }, (_, i) => (
                    <div key={i}>{i + 1}</div>
                  ))}
                </div>
              </>
            ) : (
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', color: '#888', fontSize: 14, flexDirection: 'column', gap: 8 }}>
                <div style={{ fontSize: 48, opacity: 0.3 }}>⚡</div>
                <div>从左侧文件浏览器中选择文件开始编辑</div>
                <div style={{ fontSize: 11, color: '#555' }}>Ctrl+S 保存 · Ctrl+Z 撤销</div>
              </div>
            )}
          </div>

          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: '#007acc', color: '#fff', padding: '3px 12px', fontSize: 11, fontFamily: 'monospace' }}>
            <div style={{ display: 'flex', gap: 16 }}>
              <span>行 {cursorPos.line}, 列 {cursorPos.col}</span>
            </div>
            <div style={{ display: 'flex', gap: 16 }}>
              <span>{activeTab ? detectLanguage(activeTab.name) : 'Plain Text'}</span>
              <span>空格: 2</span>
              <span>UTF-8</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}