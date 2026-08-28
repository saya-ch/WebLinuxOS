import { useState, useRef, useCallback, memo, useMemo } from 'react'
import {
  Bold, Italic, Code, Link, Image, List, ListOrdered,
  Quote, Heading1, Heading2, Heading3, Minus, Eye, Edit3,
  Download, Copy, Check, Type, Hash
} from 'lucide-react'
import { marked } from 'marked'

// ==================== 类型定义 ====================

interface MarkdownToolbarAction {
  icon: React.ReactNode
  label: string
  action: string
  prefix?: string
  suffix?: string
}

// ==================== 默认内容 ====================

const DEFAULT_CONTENT = `# Welcome to MarkdownLiveStudio

A real-time Markdown editor with live preview, multiple themes, and export capabilities.

## Features

- **Real-time preview** as you type
- **Multiple themes** for preview
- **Toolbar** with common formatting actions
- **Export** to HTML file
- **Copy** formatted HTML to clipboard
- **Keyboard shortcuts** support

## Code Examples

### JavaScript

\`\`\`javascript
function fibonacci(n) {
  if (n <= 1) return n;
  return fibonacci(n - 1) + fibonacci(n - 2);
}

console.log(fibonacci(10)); // 55
\`\`\`

### Python

\`\`\`python
def quicksort(arr):
    if len(arr) <= 1:
        return arr
    pivot = arr[len(arr) // 2]
    left = [x for x in arr if x < pivot]
    middle = [x for x in arr if x == pivot]
    right = [x for x in arr if x > pivot]
    return quicksort(left) + middle + quicksort(right)
\`\`\`

## Tables

| Feature | Status |
|---------|--------|
| Live Preview | Done |
| Theme Switching | Done |
| Export HTML | Done |
| Toolbar | Done |

## Blockquotes

> "The best way to predict the future is to invent it."
> — Alan Kay

## Task List

- [x] Real-time preview
- [x] Theme switching
- [x] Export functionality
- [ ] PDF export
- [ ] Mermaid diagrams

---

Start editing on the left panel to see changes in real-time!
`

// ==================== 工具函数 ====================

function getToolbarActions(): MarkdownToolbarAction[] {
  return [
    { icon: <Heading1 size={16} />, label: 'H1', action: 'h1', prefix: '# ' },
    { icon: <Heading2 size={16} />, label: 'H2', action: 'h2', prefix: '## ' },
    { icon: <Heading3 size={16} />, label: 'H3', action: 'h3', prefix: '### ' },
    { icon: null, label: '|', action: 'divider' },
    { icon: <Bold size={16} />, label: 'Bold', action: 'bold', prefix: '**', suffix: '**' },
    { icon: <Italic size={16} />, label: 'Italic', action: 'italic', prefix: '_', suffix: '_' },
    { icon: <Code size={16} />, label: 'Code', action: 'code', prefix: '`', suffix: '`' },
    { icon: null, label: '|', action: 'divider' },
    { icon: <Link size={16} />, label: 'Link', action: 'link', prefix: '[', suffix: '](url)' },
    { icon: <Image size={16} />, label: 'Image', action: 'image', prefix: '![alt](', suffix: ')' },
    { icon: null, label: '|', action: 'divider' },
    { icon: <List size={16} />, label: 'UL', action: 'ul', prefix: '- ' },
    { icon: <ListOrdered size={16} />, label: 'OL', action: 'ol', prefix: '1. ' },
    { icon: <Quote size={16} />, label: 'Quote', action: 'quote', prefix: '> ' },
    { icon: <Minus size={16} />, label: 'HR', action: 'hr', prefix: '\n---\n' },
  ]
}

function getWordCount(text: string): { chars: number; words: number; lines: number; readTime: string } {
  const chars = text.length
  const words = text.trim() ? text.trim().split(/\s+/).length : 0
  const lines = text.split('\n').length
  const minutes = Math.ceil(words / 200)
  const readTime = minutes < 1 ? '<1 min read' : `${minutes} min read`
  return { chars, words, lines, readTime }
}

function getHtmlContent(markdown: string): string {
  try {
    return marked.parse(markdown) as string
  } catch {
    return '<p>Error parsing markdown</p>'
  }
}

// ==================== 预览主题 ====================

const previewThemes = {
  github: {
    name: 'GitHub',
    bg: '#ffffff',
    color: '#24292f',
    heading: '#1f2328',
    link: '#0969da',
    code: '#f6f8fa',
    border: '#d0d7de',
    blockquote: '#57606a',
    table: '#f6f8fa',
  },
  dark: {
    name: 'Dark',
    bg: '#0d1117',
    color: '#e6edf3',
    heading: '#f0f6fc',
    link: '#58a6ff',
    code: '#161b22',
    border: '#30363d',
    blockquote: '#8b949e',
    table: '#161b22',
  },
  minimal: {
    name: 'Minimal',
    bg: '#fafafa',
    color: '#333333',
    heading: '#111111',
    link: '#0066cc',
    code: '#f5f5f5',
    border: '#e0e0e0',
    blockquote: '#666666',
    table: '#f5f5f5',
  },
  solarized: {
    name: 'Solarized',
    bg: '#fdf6e3',
    color: '#657b83',
    heading: '#073642',
    link: '#268bd2',
    code: '#eee8d5',
    border: '#93a1a1',
    blockquote: '#93a1a1',
    table: '#eee8d5',
  }
}

type ThemeName = keyof typeof previewThemes

// ==================== Markdown样式 ====================

function getMarkdownStyles(theme: typeof previewThemes.github, fontSize: number) {
  return `
    .md-preview {
      font-family: 'Noto Sans SC', -apple-system, BlinkMacSystemFont, sans-serif;
      font-size: ${fontSize}px;
      line-height: 1.7;
      color: ${theme.color};
      background: ${theme.bg};
      padding: 24px;
      max-width: 100%;
      word-wrap: break-word;
    }
    .md-preview h1 { font-size: 2em; font-weight: 800; margin: 0.8em 0 0.4em; color: ${theme.heading}; border-bottom: 2px solid ${theme.border}; padding-bottom: 0.3em; }
    .md-preview h2 { font-size: 1.5em; font-weight: 700; margin: 0.8em 0 0.4em; color: ${theme.heading}; border-bottom: 1px solid ${theme.border}; padding-bottom: 0.3em; }
    .md-preview h3 { font-size: 1.25em; font-weight: 700; margin: 0.8em 0 0.4em; color: ${theme.heading}; }
    .md-preview h4 { font-size: 1.1em; font-weight: 600; margin: 0.6em 0 0.3em; color: ${theme.heading}; }
    .md-preview p { margin: 0.6em 0; }
    .md-preview a { color: ${theme.link}; text-decoration: none; }
    .md-preview a:hover { text-decoration: underline; }
    .md-preview strong { font-weight: 700; }
    .md-preview code {
      font-family: 'JetBrains Mono', monospace;
      background: ${theme.code};
      padding: 2px 6px;
      border-radius: 4px;
      font-size: 0.9em;
      color: ${theme.heading};
    }
    .md-preview pre {
      background: ${theme.code};
      border: 1px solid ${theme.border};
      border-radius: 8px;
      padding: 16px;
      overflow-x: auto;
      margin: 1em 0;
    }
    .md-preview pre code { background: none; padding: 0; border-radius: 0; }
    .md-preview blockquote {
      border-left: 4px solid ${theme.border};
      padding: 8px 16px;
      margin: 1em 0;
      color: ${theme.blockquote};
      background: ${theme.code};
      border-radius: 0 8px 8px 0;
    }
    .md-preview ul, .md-preview ol { padding-left: 24px; margin: 0.6em 0; }
    .md-preview li { margin: 0.3em 0; }
    .md-preview hr { border: none; border-top: 2px solid ${theme.border}; margin: 2em 0; }
    .md-preview table { border-collapse: collapse; width: 100%; margin: 1em 0; }
    .md-preview th, .md-preview td { border: 1px solid ${theme.border}; padding: 8px 12px; text-align: left; }
    .md-preview th { background: ${theme.table}; font-weight: 600; }
    .md-preview img { max-width: 100%; border-radius: 8px; }
    .md-preview input[type="checkbox"] { margin-right: 8px; }
    .md-preview h1 .anchor, .md-preview h2 .anchor { display: none; }
  `
}

// ==================== 主组件 ====================

const MarkdownLiveStudio = memo(function MarkdownLiveStudio() {
  const [content, setContent] = useState(DEFAULT_CONTENT)
  const [previewTheme, setPreviewTheme] = useState<ThemeName>('github')
  const [showPreview, setShowPreview] = useState(true)
  const [copied, setCopied] = useState(false)
  const [fontSize, setFontSize] = useState(14)
  const editorRef = useRef<HTMLTextAreaElement>(null)

  const stats = useMemo(() => getWordCount(content), [content])
  const htmlContent = useMemo(() => getHtmlContent(content), [content])
  const theme = previewThemes[previewTheme]
  const themeStyles = useMemo(() => getMarkdownStyles(theme, fontSize), [theme, fontSize])

  // 工具栏操作
  const handleToolbarAction = useCallback((action: MarkdownToolbarAction) => {
    const textarea = editorRef.current
    const prefix = action.prefix
    if (!textarea || !prefix) return

    const start = textarea.selectionStart
    const end = textarea.selectionEnd
    const selected = content.substring(start, end)
    const replacement = prefix + (selected || action.label) + (action.suffix || '')

    setContent(prev => prev.substring(0, start) + replacement + prev.substring(end))

    // 恢复光标位置
    requestAnimationFrame(() => {
      textarea.focus()
      const newStart = start + prefix.length
      const newEnd = newStart + (selected || action.label).length
      textarea.setSelectionRange(newStart, newEnd)
    })
  }, [content])

  // 复制HTML到剪贴板
  const copyHtml = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(htmlContent)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch {}
  }, [htmlContent])

  // 导出HTML文件
  const exportHtml = useCallback(() => {
    const fullHtml = `<!DOCTYPE html>
<html lang="zh-CN">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Markdown Export</title>
  <style>
    body { max-width: 800px; margin: 0 auto; padding: 40px 20px; font-family: 'Noto Sans SC', sans-serif; line-height: 1.7; color: #24292f; }
    h1 { border-bottom: 2px solid #d0d7de; padding-bottom: 0.3em; }
    code { background: #f6f8fa; padding: 2px 6px; border-radius: 4px; font-size: 0.9em; }
    pre { background: #f6f8fa; border: 1px solid #d0d7de; border-radius: 8px; padding: 16px; overflow-x: auto; }
    pre code { background: none; padding: 0; }
    blockquote { border-left: 4px solid #d0d7de; padding: 8px 16px; color: #57606a; margin: 1em 0; }
    table { border-collapse: collapse; width: 100%; }
    th, td { border: 1px solid #d0d7de; padding: 8px 12px; }
    th { background: #f6f8fa; }
    img { max-width: 100%; }
  </style>
</head>
<body>
${htmlContent}
</body>
</html>`
    const blob = new Blob([fullHtml], { type: 'text/html' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = 'markdown-export.html'
    a.click()
    URL.revokeObjectURL(url)
  }, [htmlContent])

  // Tab键支持
  const handleKeyDown = useCallback((e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Tab') {
      e.preventDefault()
      const textarea = e.currentTarget
      const start = textarea.selectionStart
      const end = textarea.selectionEnd
      setContent(prev => prev.substring(0, start) + '  ' + prev.substring(end))
      requestAnimationFrame(() => {
        textarea.selectionStart = textarea.selectionEnd = start + 2
      })
    }
  }, [])

  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      height: '100%',
      background: 'var(--window-bg)',
      color: 'var(--text-primary)',
      fontFamily: "'Noto Sans SC', sans-serif",
      overflow: 'hidden'
    }}>
      {/* 工具栏 */}
      <div style={{
        padding: '8px 12px',
        borderBottom: '1px solid var(--window-border)',
        display: 'flex',
        alignItems: 'center',
        gap: 4,
        flexShrink: 0,
        background: 'var(--surface-bg)',
        flexWrap: 'wrap'
      }}>
        {getToolbarActions().map((action, i) => {
          if (action.action === 'divider') {
            return <div key={i} style={{ width: 1, height: 20, background: 'var(--window-border)', margin: '0 4px' }} />
          }
          return (
            <button
              key={action.action}
              onClick={() => handleToolbarAction(action)}
              title={action.label}
              style={{
                padding: '4px 8px',
                borderRadius: 4,
                border: 'none',
                background: 'transparent',
                color: 'var(--text-secondary)',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                transition: 'all 0.15s'
              }}
              onMouseEnter={e => {
                e.currentTarget.style.background = 'var(--accent-bg)'
                e.currentTarget.style.color = 'var(--accent)'
              }}
              onMouseLeave={e => {
                e.currentTarget.style.background = 'transparent'
                e.currentTarget.style.color = 'var(--text-secondary)'
              }}
            >
              {action.icon}
            </button>
          )
        })}

        <div style={{ flex: 1 }} />

        {/* 预览主题选择 */}
        <div style={{ display: 'flex', gap: 2, marginRight: 8 }}>
          {(Object.keys(previewThemes) as ThemeName[]).map(name => (
            <button
              key={name}
              onClick={() => setPreviewTheme(name)}
              style={{
                padding: '4px 8px',
                borderRadius: 4,
                border: previewTheme === name ? '1px solid var(--accent)' : '1px solid var(--window-border)',
                background: previewTheme === name ? 'var(--accent-bg)' : 'transparent',
                color: previewTheme === name ? 'var(--accent)' : 'var(--text-secondary)',
                cursor: 'pointer',
                fontSize: 11,
                fontWeight: 600
              }}
            >
              {previewThemes[name].name}
            </button>
          ))}
        </div>

        {/* 字号控制 */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 4, marginRight: 8 }}>
          <Type size={14} style={{ color: 'var(--text-secondary)' }} />
          <button
            onClick={() => setFontSize(s => Math.max(10, s - 1))}
            style={{ padding: '2px 6px', borderRadius: 3, border: '1px solid var(--window-border)', background: 'var(--surface-bg)', color: 'var(--text-secondary)', cursor: 'pointer', fontSize: 12 }}
          >
            -
          </button>
          <span style={{ fontSize: 11, color: 'var(--text-secondary)', minWidth: 24, textAlign: 'center' }}>{fontSize}</span>
          <button
            onClick={() => setFontSize(s => Math.min(24, s + 1))}
            style={{ padding: '2px 6px', borderRadius: 3, border: '1px solid var(--window-border)', background: 'var(--surface-bg)', color: 'var(--text-secondary)', cursor: 'pointer', fontSize: 12 }}
          >
            +
          </button>
        </div>

        {/* 预览切换 */}
        <button
          onClick={() => setShowPreview(!showPreview)}
          style={{
            padding: '4px 8px',
            borderRadius: 4,
            border: '1px solid var(--window-border)',
            background: showPreview ? 'var(--accent-bg)' : 'transparent',
            color: showPreview ? 'var(--accent)' : 'var(--text-secondary)',
            cursor: 'pointer',
            fontSize: 11,
            fontWeight: 600,
            display: 'flex',
            alignItems: 'center',
            gap: 4,
            marginRight: 8
          }}
        >
          {showPreview ? <Eye size={14} /> : <Edit3 size={14} />}
          Preview
        </button>

        {/* 复制HTML */}
        <button
          onClick={copyHtml}
          style={{
            padding: '4px 10px',
            borderRadius: 4,
            border: '1px solid var(--window-border)',
            background: copied ? '#22c55e18' : 'transparent',
            color: copied ? '#22c55e' : 'var(--text-secondary)',
            cursor: 'pointer',
            fontSize: 11,
            fontWeight: 600,
            display: 'flex',
            alignItems: 'center',
            gap: 4,
            marginRight: 4
          }}
        >
          {copied ? <Check size={14} /> : <Copy size={14} />}
          {copied ? 'Copied!' : 'Copy HTML'}
        </button>

        {/* 导出 */}
        <button
          onClick={exportHtml}
          style={{
            padding: '4px 10px',
            borderRadius: 4,
            border: '1px solid var(--window-border)',
            background: 'var(--surface-bg)',
            color: 'var(--text-secondary)',
            cursor: 'pointer',
            fontSize: 11,
            fontWeight: 600,
            display: 'flex',
            alignItems: 'center',
            gap: 4
          }}
        >
          <Download size={14} /> Export
        </button>
      </div>

      {/* 主内容区 */}
      <div style={{ flex: 1, display: 'flex', overflow: 'hidden' }}>
        {/* 编辑区 */}
        <div style={{
          flex: 1,
          display: 'flex',
          flexDirection: 'column',
          borderRight: showPreview ? '1px solid var(--window-border)' : 'none'
        }}>
          <textarea
            ref={editorRef}
            value={content}
            onChange={e => setContent(e.target.value)}
            onKeyDown={handleKeyDown}
            spellCheck={false}
            style={{
              flex: 1,
              padding: 16,
              border: 'none',
              background: 'var(--window-bg)',
              color: 'var(--text-primary)',
              fontSize: 14,
              fontFamily: "'JetBrains Mono', monospace",
              lineHeight: 1.7,
              resize: 'none',
              outline: 'none',
              width: '100%',
              tabSize: 2
            }}
          />
        </div>

        {/* 预览区 */}
        {showPreview && (
          <div style={{
            flex: 1,
            overflow: 'auto',
            background: theme.bg,
          }}>
            <div
              dangerouslySetInnerHTML={{ __html: htmlContent }}
              style={{
                fontFamily: "'Noto Sans SC', sans-serif",
                fontSize: fontSize,
                lineHeight: 1.7,
                color: theme.color,
                padding: 24,
                maxWidth: '100%',
              }}
            />
            <style>{themeStyles}</style>
            <style>{`.md-preview { padding: 24px; }`}</style>
          </div>
        )}
      </div>

      {/* 底部状态栏 */}
      <div style={{
        padding: '6px 16px',
        borderTop: '1px solid var(--window-border)',
        display: 'flex',
        alignItems: 'center',
        gap: 16,
        fontSize: 11,
        color: 'var(--text-secondary)',
        background: 'var(--surface-bg)',
        flexShrink: 0
      }}>
        <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
          <Hash size={12} />
          {stats.chars} chars
        </span>
        <span>{stats.words} words</span>
        <span>{stats.lines} lines</span>
        <span style={{ color: 'var(--accent)' }}>{stats.readTime}</span>
        <div style={{ flex: 1 }} />
        <span>MarkdownLiveStudio · {previewThemes[previewTheme].name} theme</span>
      </div>
    </div>
  )
})

export default MarkdownLiveStudio
