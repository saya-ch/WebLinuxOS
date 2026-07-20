import { useState, useCallback, useRef, useEffect, useMemo } from 'react'
import { marked } from 'marked'
import { useStore } from '../store'

// Configure marked for GFM support
marked.use({ gfm: true, breaks: true })

const STORAGE_KEY = 'markdown-previewer-content'

// XSS prevention: remove script tags and dangerous attributes/on-event handlers
const sanitizeHtml = (html: string): string => {
  return html
    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
    .replace(/<iframe\b[^<]*(?:(?!<\/iframe>)<[^<]*)*<\/iframe>/gi, '')
    .replace(/<object\b[^<]*(?:(?!<\/object>)<[^<]*)*<\/object>/gi, '')
    .replace(/<embed\b[^>]*>/gi, '')
    .replace(/\son\w+\s*=\s*["'][^"']*["']/gi, '')
    .replace(/\son\w+\s*=\s*[^\s>]+/gi, '')
    .replace(/\shref\s*=\s*["']\s*javascript:[^"']*["']/gi, ' href="#"')
    .replace(/\ssrc\s*=\s*["']\s*javascript:[^"']*["']/gi, '')
}

// Extract headings for Table of Contents
interface TocItem {
  id: string
  level: number
  text: string
}

const extractToc = (html: string): TocItem[] => {
  const toc: TocItem[] = []
  const regex = /<h([1-6])[^>]*>(.*?)<\/h\1>/gi
  let match
  while ((match = regex.exec(html)) !== null) {
    const level = parseInt(match[1], 10)
    const text = match[2].replace(/<[^>]+>/g, '').trim()
    const id = `heading-${toc.length}`
    toc.push({ id, level, text })
  }
  return toc
}

// Add IDs to heading tags for TOC linking
const addHeadingIds = (html: string): string => {
  let index = 0
  return html.replace(/<h([1-6])([^>]*)>(.*?)<\/h\1>/gi, (_match, level, attrs, content) => {
    const id = `heading-${index++}`
    return `<h${level}${attrs} id="${id}">${content}</h${level}>`
  })
}

// Default markdown cheat sheet content
const DEFAULT_CONTENT = `# Markdown 速查表

## 标题

# 一级标题
## 二级标题
### 三级标题
#### 四级标题
##### 五级标题
###### 六级标题

## 文本样式

**粗体文本** 和 __粗体文本__

*斜体文本* 和 _斜体文本_

~~删除线~~

**_粗斜体_** 组合

## 列表

### 无序列表
- 第一项
- 第二项
  - 嵌套项 A
  - 嵌套项 B
- 第三项

### 有序列表
1. 第一步
2. 第二步
3. 第三步

### 任务列表
- [x] 已完成任务
- [ ] 待办任务
- [ ] 另一个待办

## 链接与图片

[访问 GitHub](https://github.com)

![示例图片](https://via.placeholder.com/150)

## 引用

> 这是一段引用文本
>
> > 嵌套引用

## 代码

行内代码: \`const x = 42\`

\`\`\`javascript
// 代码块示例
function greet(name) {
  console.log(\`Hello, \${name}!\`);
  return true;
}
\`\`\`

## 表格

| 特性     | 支持情况 | 备注       |
| -------- | -------- | ---------- |
| GFM      | ✅       | GitHub 风格 |
| 表格     | ✅       | 完整支持   |
| 任务列表 | ✅       | 复选框     |
| 删除线   | ✅       | ~~文本~~   |

## 分割线

---

## 数学与特殊

脚注示例[^1]和缩写

[^1]: 这是一个脚注定义

---

*感谢使用 Markdown 预览器！*
`

// Load saved content from localStorage
const loadSavedContent = (): string => {
  try {
    const saved = localStorage.getItem(STORAGE_KEY)
    return saved !== null ? saved : DEFAULT_CONTENT
  } catch {
    return DEFAULT_CONTENT
  }
}

// Toolbar button definitions
interface ToolbarBtn {
  label: string
  title: string
  prefix: string
  suffix: string
  block?: boolean
}

const TOOLBAR_BUTTONS: ToolbarBtn[] = [
  { label: 'B', title: '粗体 (Ctrl+B)', prefix: '**', suffix: '**' },
  { label: 'I', title: '斜体 (Ctrl+I)', prefix: '*', suffix: '*' },
  { label: 'H', title: '标题', prefix: '# ', suffix: '', block: true },
  { label: '🔗', title: '链接', prefix: '[', suffix: '](url)' },
  { label: '🖼', title: '图片', prefix: '![alt](', suffix: ')' },
  { label: '</>', title: '代码', prefix: '```\n', suffix: '\n```', block: true },
  { label: '•', title: '列表', prefix: '- ', suffix: '', block: true },
  { label: '❝', title: '引用', prefix: '> ', suffix: '', block: true },
  { label: '⊞', title: '表格', prefix: '', suffix: '', block: true },
  { label: '―', title: '分割线', prefix: '\n---\n', suffix: '', block: true },
]

const MarkdownPreviewer = () => {
  const theme = useStore(s => s.theme)
  const [markdown, setMarkdown] = useState(loadSavedContent)
  const [splitRatio, setSplitRatio] = useState(0.4)
  const [copyFeedback, setCopyFeedback] = useState('')
  const textareaRef = useRef<HTMLTextAreaElement>(null)
  const containerRef = useRef<HTMLDivElement>(null)
  const draggingRef = useRef(false)
  const autoSaveTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  const isDark = theme === 'dark'

  // Theme colors
  const colors = useMemo(() => ({
    bg: isDark ? '#1a1a2e' : '#f5f5f7',
    bgGradient: isDark
      ? 'linear-gradient(180deg, #1a1a2e 0%, #16213e 100%)'
      : 'linear-gradient(180deg, #f5f5f7 0%, #e8e8ed 100%)',
    surface: isDark ? '#0f0f1a' : '#ffffff',
    surfaceLight: isDark ? '#1f1f2f' : '#fafafa',
    border: isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.12)',
    borderLight: isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.06)',
    text: isDark ? '#e0e0f0' : '#1d1d1f',
    textMuted: isDark ? '#9090a0' : '#86868b',
    accent: isDark ? '#60a5fa' : '#0071e3',
    accentPurple: isDark ? '#a78bfa' : '#7c3aed',
    accentPink: isDark ? '#f472b6' : '#e0245e',
    accentGreen: isDark ? '#34d399' : '#10b981',
    divider: isDark ? '#3b3b5c' : '#c7c7cc',
    toolbarBg: isDark ? 'rgba(15,15,26,0.9)' : 'rgba(255,255,255,0.9)',
    codeBg: isDark ? 'rgba(96,165,250,0.1)' : 'rgba(0,113,227,0.08)',
    preBg: isDark ? 'rgba(0,0,0,0.3)' : 'rgba(0,0,0,0.04)',
    btnHover: isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.05)',
    shadow: isDark ? 'inset 0 2px 8px rgba(0,0,0,0.2)' : 'inset 0 1px 4px rgba(0,0,0,0.06)',
    tocBg: isDark ? 'rgba(15,15,26,0.6)' : 'rgba(255,255,255,0.6)',
    lineNumber: isDark ? '#4a4a5c' : '#c7c7cc',
  }), [isDark])

  // Render markdown to HTML
  const { html, toc } = useMemo(() => {
    try {
      const rawHtml = marked.parse(markdown) as string
      const safeHtml = sanitizeHtml(rawHtml)
      const withIds = addHeadingIds(safeHtml)
      const extractedToc = extractToc(safeHtml)
      return { html: withIds, toc: extractedToc }
    } catch (err) {
      return { html: `<p style="color:red">渲染错误: ${String(err)}</p>`, toc: [] }
    }
  }, [markdown])

  // Word count and character count
  const stats = useMemo(() => {
    const text = markdown.trim()
    const chars = text.length
    const words = text ? text.split(/\s+/).filter(Boolean).length : 0
    const lines = markdown.split('\n').length
    return { chars, words, lines }
  }, [markdown])

  // Auto-save to localStorage
  useEffect(() => {
    if (autoSaveTimerRef.current) {
      clearTimeout(autoSaveTimerRef.current)
    }
    autoSaveTimerRef.current = setTimeout(() => {
      try {
        localStorage.setItem(STORAGE_KEY, markdown)
      } catch { /* ignore storage errors */ }
    }, 500)
    return () => {
      if (autoSaveTimerRef.current) {
        clearTimeout(autoSaveTimerRef.current)
      }
    }
  }, [markdown])

  // Insert formatting at cursor position
  const insertFormatting = useCallback((prefix: string, suffix: string, block?: boolean) => {
    const textarea = textareaRef.current
    if (!textarea) return

    const start = textarea.selectionStart
    const end = textarea.selectionEnd
    const selectedText = markdown.substring(start, end)
    const before = markdown.substring(0, start)
    const after = markdown.substring(end)

    let newPrefix = prefix
    let newSuffix = suffix

    if (block && start > 0 && before[start - 1] !== '\n') {
      newPrefix = '\n' + prefix
    }

    const newText = before + newPrefix + selectedText + newSuffix + after
    setMarkdown(newText)

    requestAnimationFrame(() => {
      textarea.focus()
      const cursorPos = start + newPrefix.length + selectedText.length
      textarea.setSelectionRange(
        selectedText ? cursorPos : start + newPrefix.length,
        selectedText ? cursorPos : start + newPrefix.length
      )
    })
  }, [markdown])

  // Insert table template
  const insertTable = useCallback(() => {
    const table = '\n| 列1 | 列2 | 列3 |\n|------|------|------|\n| 内容 | 内容 | 内容 |\n'
    insertFormatting(table, '')
  }, [insertFormatting])

  // Handle toolbar button click
  const handleToolbarClick = useCallback((btn: ToolbarBtn) => {
    if (btn.title === '表格') {
      insertTable()
      return
    }
    insertFormatting(btn.prefix, btn.suffix, btn.block)
  }, [insertFormatting, insertTable])

  // Export: Copy HTML
  const copyHtml = useCallback(() => {
    try {
      navigator.clipboard.writeText(html).then(() => {
        setCopyFeedback('已复制 HTML!')
        setTimeout(() => setCopyFeedback(''), 2000)
      }).catch(() => {
        setCopyFeedback('复制失败')
        setTimeout(() => setCopyFeedback(''), 2000)
      })
    } catch {
      setCopyFeedback('复制失败')
      setTimeout(() => setCopyFeedback(''), 2000)
    }
  }, [html])

  // Export: Download file
  const downloadFile = useCallback((content: string, filename: string, mimeType: string) => {
    try {
      const blob = new Blob([content], { type: mimeType })
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = filename
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      URL.revokeObjectURL(url)
    } catch { /* ignore download errors */ }
  }, [])

  // Keyboard shortcuts
  const handleKeyDown = useCallback((e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    const mod = e.ctrlKey || e.metaKey
    if (mod && e.key === 'b') {
      e.preventDefault()
      insertFormatting('**', '**')
    } else if (mod && e.key === 'i') {
      e.preventDefault()
      insertFormatting('*', '*')
    } else if (mod && e.key === 's') {
      e.preventDefault()
      downloadFile(markdown, 'document.md', 'text/markdown;charset=utf-8')
    }
  }, [insertFormatting, downloadFile, markdown])

  // Draggable divider
  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    e.preventDefault()
    draggingRef.current = true

    const container = containerRef.current
    if (!container) return

    const handleMouseMove = (ev: MouseEvent) => {
      if (!draggingRef.current) return
      const rect = container.getBoundingClientRect()
      const ratio = Math.max(0.15, Math.min(0.85, (ev.clientX - rect.left) / rect.width))
      setSplitRatio(ratio)
    }

    const handleMouseUp = () => {
      draggingRef.current = false
      document.removeEventListener('mousemove', handleMouseMove)
      document.removeEventListener('mouseup', handleMouseUp)
      document.body.style.cursor = ''
      document.body.style.userSelect = ''
    }

    document.body.style.cursor = 'col-resize'
    document.body.style.userSelect = 'none'
    document.addEventListener('mousemove', handleMouseMove)
    document.addEventListener('mouseup', handleMouseUp)
  }, [])

  // Line numbers for the editor
  const lineNumbers = useMemo(() => {
    const count = markdown.split('\n').length
    return Array.from({ length: count }, (_, i) => i + 1)
  }, [markdown])

  // Scroll line numbers with textarea
  const [lineScrollTop, setLineScrollTop] = useState(0)
  const handleScroll = useCallback((e: React.UIEvent<HTMLTextAreaElement>) => {
    setLineScrollTop(e.currentTarget.scrollTop)
  }, [])

  const toolbarBtnStyle = (): React.CSSProperties => ({
    background: 'transparent',
    border: 'none',
    color: colors.text,
    cursor: 'pointer',
    padding: '4px 8px',
    borderRadius: 4,
    fontSize: 13,
    fontWeight: 600,
    fontFamily: 'inherit',
    minWidth: 28,
    textAlign: 'center' as const,
    transition: 'background 0.15s',
  })

  return (
    <div
      style={{
        background: colors.bgGradient,
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        overflow: 'hidden',
      }}
    >
      {/* Header */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          padding: '8px 12px',
          borderBottom: `1px solid ${colors.border}`,
          flexShrink: 0,
        }}
      >
        <h3 style={{ color: colors.text, margin: 0, fontSize: 16, fontWeight: 600 }}>
          📝 Markdown 预览器
        </h3>
        <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
          <button
            onClick={copyHtml}
            style={{
              ...toolbarBtnStyle(),
              fontSize: 12,
              padding: '3px 10px',
              background: colors.btnHover,
              border: `1px solid ${colors.border}`,
            }}
            title="复制 HTML"
          >
            {copyFeedback || '复制 HTML'}
          </button>
          <button
            onClick={() => downloadFile(html, 'document.html', 'text/html;charset=utf-8')}
            style={{
              ...toolbarBtnStyle(),
              fontSize: 12,
              padding: '3px 10px',
              background: colors.btnHover,
              border: `1px solid ${colors.border}`,
            }}
            title="下载 HTML"
          >
            ⬇ HTML
          </button>
          <button
            onClick={() => downloadFile(markdown, 'document.md', 'text/markdown;charset=utf-8')}
            style={{
              ...toolbarBtnStyle(),
              fontSize: 12,
              padding: '3px 10px',
              background: colors.btnHover,
              border: `1px solid ${colors.border}`,
            }}
            title="下载 Markdown (Ctrl+S)"
          >
            ⬇ .md
          </button>
        </div>
      </div>

      {/* Toolbar */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          padding: '4px 8px',
          gap: 2,
          background: colors.toolbarBg,
          borderBottom: `1px solid ${colors.border}`,
          flexShrink: 0,
          flexWrap: 'wrap' as const,
        }}
      >
        {TOOLBAR_BUTTONS.map((btn) => (
          <button
            key={btn.title}
            onClick={() => handleToolbarClick(btn)}
            title={btn.title}
            style={toolbarBtnStyle()}
            onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.background = colors.btnHover }}
            onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.background = 'transparent' }}
          >
            {btn.label}
          </button>
        ))}
      </div>

      {/* Main split pane */}
      <div
        ref={containerRef}
        style={{
          flex: 1,
          display: 'flex',
          minHeight: 0,
          overflow: 'hidden',
        }}
      >
        {/* Editor pane */}
        <div
          style={{
            width: `${splitRatio * 100}%`,
            display: 'flex',
            flexDirection: 'column',
            minHeight: 0,
            overflow: 'hidden',
          }}
        >
          <div
            style={{
              color: colors.textMuted,
              fontSize: 11,
              fontWeight: 600,
              textTransform: 'uppercase' as const,
              letterSpacing: '0.5px',
              padding: '6px 12px',
              flexShrink: 0,
            }}
          >
            编辑器
          </div>
          <div
            style={{
              flex: 1,
              display: 'flex',
              minHeight: 0,
              background: colors.surface,
              border: `1px solid ${colors.border}`,
              borderRadius: 8,
              overflow: 'hidden',
              margin: '0 8px',
              boxShadow: colors.shadow,
            }}
          >
            {/* Line numbers */}
            <div
              style={{
                width: 44,
                flexShrink: 0,
                background: isDark ? 'rgba(0,0,0,0.2)' : 'rgba(0,0,0,0.02)',
                borderRight: `1px solid ${colors.borderLight}`,
                overflow: 'hidden',
                paddingTop: 12,
                paddingLeft: 4,
                paddingRight: 4,
              }}
            >
              <div
                style={{
                  transform: `translateY(${-lineScrollTop}px)`,
                  fontFamily: "'SF Mono', 'Fira Code', 'Cascadia Code', Consolas, monospace",
                  fontSize: 13,
                  lineHeight: 1.6,
                  color: colors.lineNumber,
                  textAlign: 'right' as const,
                  userSelect: 'none' as const,
                }}
              >
                {lineNumbers.map((n) => (
                  <div key={n}>{n}</div>
                ))}
              </div>
            </div>
            {/* Textarea */}
            <textarea
              ref={textareaRef}
              value={markdown}
              onChange={(e) => setMarkdown(e.target.value)}
              onScroll={handleScroll}
              onKeyDown={handleKeyDown}
              spellCheck={false}
              style={{
                flex: 1,
                background: 'transparent',
                color: colors.text,
                border: 'none',
                padding: '12px 12px',
                fontSize: 13,
                lineHeight: 1.6,
                resize: 'none',
                outline: 'none',
                fontFamily: "'SF Mono', 'Fira Code', 'Cascadia Code', Consolas, monospace",
                tabSize: 2,
                overflow: 'auto',
              }}
            />
          </div>
        </div>

        {/* Draggable divider */}
        <div
          onMouseDown={handleMouseDown}
          style={{
            width: 6,
            cursor: 'col-resize',
            background: colors.divider,
            flexShrink: 0,
            transition: 'background 0.15s',
            zIndex: 1,
          }}
          onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.background = colors.accent }}
          onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.background = colors.divider }}
        />

        {/* Preview pane */}
        <div
          style={{
            flex: 1,
            display: 'flex',
            flexDirection: 'column',
            minHeight: 0,
            overflow: 'hidden',
          }}
        >
          <div
            style={{
              color: colors.textMuted,
              fontSize: 11,
              fontWeight: 600,
              textTransform: 'uppercase' as const,
              letterSpacing: '0.5px',
              padding: '6px 12px',
              flexShrink: 0,
            }}
          >
            预览
          </div>
          <div
            style={{
              flex: 1,
              display: 'flex',
              minHeight: 0,
              overflow: 'hidden',
              margin: '0 8px',
              gap: 8,
            }}
          >
            {/* TOC */}
            {toc.length > 0 && (
              <div
                style={{
                  width: 180,
                  flexShrink: 0,
                  background: colors.tocBg,
                  border: `1px solid ${colors.border}`,
                  borderRadius: 8,
                  padding: '10px 8px',
                  overflow: 'auto',
                  fontSize: 12,
                }}
              >
                <div
                  style={{
                    fontWeight: 700,
                    color: colors.textMuted,
                    fontSize: 10,
                    textTransform: 'uppercase' as const,
                    letterSpacing: '0.5px',
                    marginBottom: 8,
                  }}
                >
                  目录
                </div>
                {toc.map((item) => (
                  <a
                    key={item.id}
                    href={`#${item.id}`}
                    onClick={(e) => {
                      e.preventDefault()
                      const el = document.getElementById(item.id)
                      if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' })
                    }}
                    style={{
                      display: 'block',
                      color: colors.textMuted,
                      textDecoration: 'none',
                      padding: `2px 0 2px ${(item.level - 1) * 10}px`,
                      lineHeight: 1.5,
                      cursor: 'pointer',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      whiteSpace: 'nowrap' as const,
                      transition: 'color 0.15s',
                    }}
                    onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.color = colors.accent }}
                    onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.color = colors.textMuted }}
                  >
                    {item.text}
                  </a>
                ))}
              </div>
            )}
            {/* Preview content */}
            <div
              style={{
                flex: 1,
                background: colors.surfaceLight,
                color: colors.text,
                border: `1px solid ${colors.border}`,
                borderRadius: 8,
                padding: '12px 16px',
                overflow: 'auto',
                boxShadow: colors.shadow,
                lineHeight: 1.6,
              }}
              dangerouslySetInnerHTML={{ __html: html }}
            />
          </div>
        </div>
      </div>

      {/* Status bar */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          padding: '4px 12px',
          background: colors.toolbarBg,
          borderTop: `1px solid ${colors.border}`,
          fontSize: 11,
          color: colors.textMuted,
          flexShrink: 0,
        }}
      >
        <div style={{ display: 'flex', gap: 16 }}>
          <span>字符: {stats.chars.toLocaleString()}</span>
          <span>词数: {stats.words.toLocaleString()}</span>
          <span>行数: {stats.lines}</span>
        </div>
        <div style={{ display: 'flex', gap: 12, fontSize: 10 }}>
          <span>Ctrl+B 粗体</span>
          <span>Ctrl+I 斜体</span>
          <span>Ctrl+S 保存</span>
        </div>
      </div>

      {/* Preview styling */}
      <style>{`
        h1, h2, h3, h4, h5, h6 { margin: 0.8em 0 0.3em 0; }
        h1 { font-size: 28px; color: ${colors.accent}; }
        h2 { font-size: 22px; color: ${colors.accentPurple}; }
        h3 { font-size: 18px; color: ${colors.accentPink}; }
        h4 { font-size: 16px; color: ${colors.text}; }
        h5 { font-size: 14px; color: ${colors.text}; }
        h6 { font-size: 13px; color: ${colors.textMuted}; }
        p { margin: 0.5em 0; line-height: 1.6; }
        ul, ol { padding-left: 2em; margin: 0.5em 0; }
        li { margin: 0.2em 0; }
        blockquote {
          border-left: 4px solid ${colors.accent};
          padding-left: 1em;
          margin: 0.8em 0;
          color: ${colors.textMuted};
        }
        code {
          background: ${colors.codeBg};
          padding: 2px 6px;
          border-radius: 4px;
          font-family: 'SF Mono', 'Fira Code', Consolas, monospace;
          font-size: 0.9em;
        }
        pre {
          background: ${colors.preBg};
          padding: 12px;
          border-radius: 8px;
          overflow-x: auto;
          margin: 0.8em 0;
        }
        pre code {
          background: transparent;
          padding: 0;
        }
        table {
          border-collapse: collapse;
          width: 100%;
          margin: 0.8em 0;
        }
        td, th {
          border: 1px solid ${colors.border};
          padding: 8px 12px;
          text-align: left;
        }
        th {
          font-weight: 600;
          background: ${isDark ? 'rgba(255,255,255,0.03)' : 'rgba(0,0,0,0.02)'};
        }
        a {
          color: ${colors.accent};
          text-decoration: none;
        }
        a:hover {
          text-decoration: underline;
        }
        hr {
          border: none;
          border-top: 1px solid ${colors.border};
          margin: 1em 0;
        }
        img {
          max-width: 100%;
          border-radius: 6px;
          margin: 0.5em 0;
        }
        input[type="checkbox"] {
          margin-right: 6px;
        }
        del {
          color: ${colors.textMuted};
        }
      `}</style>
    </div>
  )
}

export default MarkdownPreviewer
