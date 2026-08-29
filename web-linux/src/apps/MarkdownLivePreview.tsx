/**
 * Markdown Live Preview — Markdown 实时预览编辑器
 *
 * - 左右分栏：左侧编辑器 + 右侧实时预览
 * - 深色/浅色主题切换（CSS 变量）
 * - 导出 HTML、清空内容、加载示例模板
 * - 使用 marked 渲染 Markdown
 * - 内联样式 + className（CSS-in-JS）
 */

import { useState, useEffect, useCallback, useMemo, useRef } from 'react'
import { marked } from 'marked'
import {
  Bold,
  Italic,
  Heading1,
  Heading2,
  Heading3,
  Link,
  Image,
  Code,
  List,
  ListOrdered,
  Quote,
  Minus,
  Download,
  Trash2,
  FileText,
  Sun,
  Moon,
  CheckSquare,
  Table,
} from 'lucide-react'

// ─── marked 配置 ─────────────────────────────────────────────────────────────

marked.setOptions({
  breaks: true,
  gfm: true,
})

// ─── CSS 变量定义（注入到组件根元素） ────────────────────────────────────────

const CSS_VARS_DARK: Record<string, string> = {
  '--window-bg': '#1e1e1e',
  '--accent': '#7c6cf0',
  '--accent-hover': '#6a5ce0',
  '--text-primary': '#d4d4d4',
  '--text-secondary': '#888888',
  '--border': '#3a3a3a',
  '--editor-bg': '#1e1e1e',
  '--preview-bg': '#1a1a2e',
  '--toolbar-bg': '#252526',
  '--status-bg': '#252526',
  '--code-bg': 'rgba(0,0,0,0.3)',
  '--inline-code-bg': 'rgba(124,108,240,0.12)',
  '--hover-bg': 'rgba(255,255,255,0.08)',
  '--scrollbar': '#3a3a3a',
  '--scrollbar-thumb': '#555555',
}

const CSS_VARS_LIGHT: Record<string, string> = {
  '--window-bg': '#f5f5f5',
  '--accent': '#7c6cf0',
  '--accent-hover': '#6a5ce0',
  '--text-primary': '#1a1a2e',
  '--text-secondary': '#666666',
  '--border': '#d0d0d0',
  '--editor-bg': '#ffffff',
  '--preview-bg': '#ffffff',
  '--toolbar-bg': '#f0f0f0',
  '--status-bg': '#f0f0f0',
  '--code-bg': 'rgba(0,0,0,0.06)',
  '--inline-code-bg': 'rgba(124,108,240,0.08)',
  '--hover-bg': 'rgba(0,0,0,0.06)',
  '--scrollbar': '#d0d0d0',
  '--scrollbar-thumb': '#aaaaaa',
}

// ─── 示例模板 ─────────────────────────────────────────────────────────────────

const SAMPLE_MARKDOWN = `# Markdown 实时预览编辑器

欢迎使用 **Markdown 实时预览** 编辑器！在左侧编写 Markdown，右侧即时查看渲染效果。

## 文本样式

这是一段普通文字。支持 **粗体**、*斜体*、***粗斜体***、~~删除线~~ 和 \`行内代码\`。

> 💡 提示：选中文本后点击工具栏按钮可以快速插入语法。

## 标题层级

### 三级标题

#### 四级标题

##### 五级标题

###### 六级标题

## 代码块

\`\`\`typescript
function fibonacci(n: number): number {
  if (n <= 1) return n;
  return fibonacci(n - 1) + fibonacci(n - 2);
}

// 计算前 10 项斐波那契数
const results = Array.from({ length: 10 }, (_, i) => fibonacci(i));
console.log(results); // [0, 1, 1, 2, 3, 5, 8, 13, 21, 34]
\`\`\`

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

## 列表

### 无序列表

- 前端开发：React、Vue、Svelte
- 后端开发：Node.js、Go、Rust
- 数据库：PostgreSQL、Redis、MongoDB

### 有序列表

1. 选择项目框架
2. 搭建开发环境
3. 编写核心功能
4. 测试与部署

### 任务列表

- [x] 实现 Markdown 解析
- [x] 实时预览渲染
- [x] 深色 / 浅色主题
- [ ] 多文档管理
- [ ] 导出 PDF

## 表格

| 功能 | 快捷操作 | 说明 |
|------|----------|------|
| 加粗 | Ctrl+B | 包裹选中文本为 **bold** |
| 斜体 | Ctrl+I | 包裹选中文本为 *italic* |
| 代码 | — | 行内或代码块 |
| 链接 | — | 插入链接语法 |
| 标题 | — | H1 / H2 / H3 |

## 引用

> 代码是写给人看的，只是顺便让机器执行。
>
> — Harold Abelson

> > 嵌套引用也是支持的哦！

## 链接与图片

[访问 GitHub](https://github.com) · [Markdown 语法指南](https://www.markdownguide.org)

## 水平分割线

---

## 综合示例

在实际项目中，你可以用这个编辑器来：

1. **编写技术文档** — 利用代码高亮和表格展示
2. **记录会议纪要** — 使用任务列表跟踪进度
3. **制作 README** — 快速预览项目说明文件
4. **学习 Markdown** — 即时查看语法效果

> 🎉 享受写作的乐趣吧！
`

// ─── localStorage 持久化 key ──────────────────────────────────────────────────

const STORAGE_KEY = 'weblinux-markdown-live-preview-v2'
const THEME_KEY = 'weblinux-markdown-live-preview-theme'

// ─── 工具栏按钮 ──────────────────────────────────────────────────────────────

interface ToolbarBtnProps {
  icon: React.ReactNode
  label: string
  onClick: () => void
  active?: boolean
}

function ToolbarBtn({ icon, label, onClick, active }: ToolbarBtnProps) {
  return (
    <button
      onClick={onClick}
      title={label}
      className="md-toolbar-btn"
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        width: 30,
        height: 30,
        border: 'none',
        borderRadius: 5,
        background: active ? 'rgba(124,108,240,0.2)' : 'transparent',
        color: active ? 'var(--accent)' : 'var(--text-secondary)',
        cursor: 'pointer',
        transition: 'all 0.15s',
        flexShrink: 0,
        padding: 0,
      }}
    >
      {icon}
    </button>
  )
}

function ToolbarSep() {
  return (
    <div
      style={{
        width: 1,
        height: 18,
        background: 'var(--border)',
        margin: '0 4px',
        flexShrink: 0,
      }}
    />
  )
}

// ─── 预览 HTML 渲染函数 ──────────────────────────────────────────────────────

function buildPreviewHTML(isDark: boolean, html: string): string {
  const borderColor = isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.1)'
  const mutedColor = isDark ? '#8892b0' : '#555555'
  const linkColor = 'var(--accent, #7c6cf0)'
  const codeBg = isDark ? 'rgba(0,0,0,0.3)' : 'rgba(0,0,0,0.06)'
  const inlineCodeBg = isDark ? 'rgba(124,108,240,0.12)' : 'rgba(124,108,240,0.08)'
  const tableHoverBg = isDark ? 'rgba(255,255,255,0.03)' : 'rgba(0,0,0,0.02)'

  return `
    <style>
      .md-prose {
        color: var(--text-primary, ${isDark ? '#d4d4d4' : '#1a1a2e'});
        font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Noto Sans SC', sans-serif;
        line-height: 1.75;
        padding: 24px 28px;
      }
      .md-prose > :first-child { margin-top: 0; }
      .md-prose h1, .md-prose h2, .md-prose h3, .md-prose h4, .md-prose h5, .md-prose h6 {
        margin: 1.4em 0 0.6em;
        font-weight: 700;
        line-height: 1.3;
        color: var(--text-primary, ${isDark ? '#e0e0e0' : '#111111'});
      }
      .md-prose h1 { font-size: 2em; border-bottom: 2px solid ${borderColor}; padding-bottom: 0.3em; }
      .md-prose h2 { font-size: 1.5em; border-bottom: 1px solid ${borderColor}; padding-bottom: 0.3em; }
      .md-prose h3 { font-size: 1.25em; }
      .md-prose h4 { font-size: 1.1em; }
      .md-prose p { margin: 0.75em 0; }
      .md-prose a {
        color: ${linkColor};
        text-decoration: none;
        border-bottom: 1px solid transparent;
        transition: border-color 0.2s;
      }
      .md-prose a:hover { border-bottom-color: ${linkColor}; }
      .md-prose strong { font-weight: 700; color: var(--text-primary, ${isDark ? '#f0f0f0' : '#111111'}); }
      .md-prose em { font-style: italic; }
      .md-prose del { color: ${mutedColor}; }
      .md-prose code {
        font-family: 'JetBrains Mono', 'Fira Code', 'Cascadia Code', monospace;
        font-size: 0.88em;
        background: ${inlineCodeBg};
        padding: 2px 7px;
        border-radius: 5px;
      }
      .md-prose pre {
        background: ${codeBg};
        border-radius: 10px;
        padding: 16px 20px;
        overflow-x: auto;
        margin: 14px 0;
        border: 1px solid ${borderColor};
        position: relative;
      }
      .md-prose pre code {
        background: none;
        padding: 0;
        font-size: 0.85em;
        color: var(--text-primary, ${isDark ? '#d4d4d4' : '#1a1a2e'});
        line-height: 1.6;
      }
      .md-prose blockquote {
        border-left: 4px solid var(--accent, #7c6cf0);
        padding: 10px 16px;
        margin: 14px 0;
        color: ${mutedColor};
        background: ${isDark ? 'rgba(124,108,240,0.05)' : 'rgba(124,108,240,0.04)'};
        border-radius: 0 8px 8px 0;
        font-style: italic;
      }
      .md-prose blockquote blockquote {
        margin: 8px 0;
        border-radius: 0 6px 6px 0;
      }
      .md-prose ul, .md-prose ol { padding-left: 1.8em; margin: 8px 0; }
      .md-prose li { margin: 5px 0; line-height: 1.7; }
      .md-prose li input[type="checkbox"] { margin-right: 8px; accent-color: var(--accent, #7c6cf0); }
      .md-prose table {
        border-collapse: collapse;
        width: 100%;
        margin: 14px 0;
        border-radius: 8px;
        overflow: hidden;
        border: 1px solid ${borderColor};
      }
      .md-prose th, .md-prose td {
        border: 1px solid ${borderColor};
        padding: 10px 14px;
        text-align: left;
      }
      .md-prose th {
        font-weight: 600;
        background: ${isDark ? 'rgba(124,108,240,0.08)' : 'rgba(124,108,240,0.06)'};
      }
      .md-prose tr:hover td { background: ${tableHoverBg}; }
      .md-prose img { max-width: 100%; border-radius: 10px; margin: 10px 0; }
      .md-prose hr { border: none; border-top: 1px solid ${borderColor}; margin: 24px 0; }
    </style>
    <div class="md-prose">${html}</div>
  `
}

// ─── 主组件 ──────────────────────────────────────────────────────────────────

export default function MarkdownLivePreview() {
  // 编辑器内容
  const [content, setContent] = useState<string>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY)
      if (saved !== null) return saved
    } catch { /* ignore */ }
    return SAMPLE_MARKDOWN
  })

  // 主题
  const [isDark, setIsDark] = useState<boolean>(() => {
    try {
      const saved = localStorage.getItem(THEME_KEY)
      if (saved === 'light') return false
    } catch { /* ignore */ }
    return true
  })

  // 分栏比例 (编辑器宽度占比 0~1)
  const [splitRatio, setSplitRatio] = useState(0.5)
  const isDragging = useRef(false)
  const containerRef = useRef<HTMLDivElement>(null)

  // Refs
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  // ── 持久化 ──
  useEffect(() => {
    const timer = setTimeout(() => {
      try { localStorage.setItem(STORAGE_KEY, content) } catch { /* ignore */ }
    }, 500)
    return () => clearTimeout(timer)
  }, [content])

  useEffect(() => {
    try { localStorage.setItem(THEME_KEY, isDark ? 'dark' : 'light') } catch { /* ignore */ }
  }, [isDark])

  // ── 分栏拖拽 ──
  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    e.preventDefault()
    isDragging.current = true
    document.body.style.cursor = 'col-resize'
    document.body.style.userSelect = 'none'
  }, [])

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!isDragging.current || !containerRef.current) return
      const rect = containerRef.current.getBoundingClientRect()
      const x = e.clientX - rect.left
      const ratio = Math.min(0.8, Math.max(0.2, x / rect.width))
      setSplitRatio(ratio)
    }
    const handleMouseUp = () => {
      isDragging.current = false
      document.body.style.cursor = ''
      document.body.style.userSelect = ''
    }
    document.addEventListener('mousemove', handleMouseMove)
    document.addEventListener('mouseup', handleMouseUp)
    return () => {
      document.removeEventListener('mousemove', handleMouseMove)
      document.removeEventListener('mouseup', handleMouseUp)
    }
  }, [])

  // ── 渲染 HTML ──
  const renderedHTML = useMemo(() => {
    if (!content) return ''
    return marked.parse(content) as string
  }, [content])

  // ── 统计信息 ──
  const stats = useMemo(() => {
    const chars = content.length
    const words = content.trim() ? content.trim().split(/\s+/).length : 0
    const lines = content.split('\n').length
    const readTime = Math.max(1, Math.ceil(words / 200))
    return { chars, words, lines, readTime }
  }, [content])

  // ── 光标操作工具 ──
  const wrapSelection = useCallback((before: string, after: string) => {
    const ta = textareaRef.current
    if (!ta) return
    const start = ta.selectionStart
    const end = ta.selectionEnd
    const selected = content.substring(start, end)
    const newContent =
      content.substring(0, start) + before + selected + after + content.substring(end)
    setContent(newContent)
    requestAnimationFrame(() => {
      ta.focus()
      ta.selectionStart = start + before.length
      ta.selectionEnd = start + before.length + selected.length
    })
  }, [content])

  const insertAtCursor = useCallback((text: string) => {
    const ta = textareaRef.current
    if (!ta) return
    const start = ta.selectionStart
    const newContent = content.substring(0, start) + text + content.substring(start)
    setContent(newContent)
    requestAnimationFrame(() => {
      ta.focus()
      ta.selectionStart = start + text.length
      ta.selectionEnd = start + text.length
    })
  }, [content])

  const insertPrefixPerLine = useCallback((prefix: string) => {
    const ta = textareaRef.current
    if (!ta) return
    const start = ta.selectionStart
    const end = ta.selectionEnd
    const selected = content.substring(start, end)
    const newText = selected.split('\n').map(l => prefix + l).join('\n')
    const newContent = content.substring(0, start) + newText + content.substring(end)
    setContent(newContent)
    requestAnimationFrame(() => {
      ta.focus()
      ta.selectionStart = start
      ta.selectionEnd = start + newText.length
    })
  }, [content])

  // ── 工具栏动作 ──
  const handleBold = useCallback(() => wrapSelection('**', '**'), [wrapSelection])
  const handleItalic = useCallback(() => wrapSelection('*', '*'), [wrapSelection])
  const handleStrikethrough = useCallback(() => wrapSelection('~~', '~~'), [wrapSelection])
  const handleInlineCode = useCallback(() => wrapSelection('`', '`'), [wrapSelection])
  const handleH1 = useCallback(() => insertPrefixPerLine('# '), [insertPrefixPerLine])
  const handleH2 = useCallback(() => insertPrefixPerLine('## '), [insertPrefixPerLine])
  const handleH3 = useCallback(() => insertPrefixPerLine('### '), [insertPrefixPerLine])
  const handleLink = useCallback(() => {
    const ta = textareaRef.current
    if (!ta) return
    const sel = content.substring(ta.selectionStart, ta.selectionEnd)
    if (sel) {
      wrapSelection('[', '](url)')
    } else {
      insertAtCursor('[链接文本](url)')
    }
  }, [content, wrapSelection, insertAtCursor])
  const handleImage = useCallback(() => insertAtCursor('![alt](image-url)'), [insertAtCursor])
  const handleCodeBlock = useCallback(() => insertAtCursor('```\ncode\n```'), [insertAtCursor])
  const handleUnorderedList = useCallback(() => insertPrefixPerLine('- '), [insertPrefixPerLine])
  const handleOrderedList = useCallback(() => {
    const ta = textareaRef.current
    if (!ta) return
    const start = ta.selectionStart
    const end = ta.selectionEnd
    const selected = content.substring(start, end)
    const newText = selected.split('\n').map((l, i) => `${i + 1}. ${l}`).join('\n')
    const newContent = content.substring(0, start) + newText + content.substring(end)
    setContent(newContent)
    requestAnimationFrame(() => {
      ta.focus()
      ta.selectionStart = start
      ta.selectionEnd = start + newText.length
    })
  }, [content])
  const handleQuote = useCallback(() => insertPrefixPerLine('> '), [insertPrefixPerLine])
  const handleHr = useCallback(() => insertAtCursor('\n---\n'), [insertAtCursor])
  const handleCheckbox = useCallback(() => insertPrefixPerLine('- [ ] '), [insertPrefixPerLine])
  const handleTable = useCallback(() => {
    insertAtCursor('\n| 列1 | 列2 | 列3 |\n|------|------|------|\n| 内容 | 内容 | 内容 |\n')
  }, [insertAtCursor])

  // ── 加载示例 ──
  const loadSample = useCallback(() => {
    if (content.trim() && !confirm('当前内容将被覆盖，确定加载示例模板吗？')) return
    setContent(SAMPLE_MARKDOWN)
  }, [content])

  // ── 清空 ──
  const handleClear = useCallback(() => {
    if (confirm('确定要清空编辑器内容吗？')) {
      setContent('')
    }
  }, [])

  // ── 导出 HTML ──
  const exportHTML = useCallback(() => {
    const previewStyles = isDark
      ? 'body{background:#1a1a2e;color:#d4d4d4}'
      : 'body{background:#ffffff;color:#1a1a2e}'
    const html = `<!DOCTYPE html>
<html lang="zh-CN">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Markdown Export</title>
  <style>
    ${previewStyles}
    body{max-width:820px;margin:40px auto;padding:20px 28px;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,'Noto Sans SC',sans-serif;line-height:1.75}
    h1,h2,h3,h4,h5,h6{margin:1.3em 0 0.6em;font-weight:700;line-height:1.3}
    h1{font-size:2em;border-bottom:2px solid rgba(128,128,128,0.25);padding-bottom:0.3em}
    h2{font-size:1.5em;border-bottom:1px solid rgba(128,128,128,0.2);padding-bottom:0.3em}
    p{margin:0.75em 0}
    pre{background:rgba(0,0,0,0.15);border-radius:10px;padding:16px 20px;overflow-x:auto;margin:14px 0;border:1px solid rgba(128,128,128,0.15)}
    code{font-family:'JetBrains Mono','Fira Code',monospace;font-size:0.88em}
    :not(pre)>code{background:rgba(124,108,240,0.08);padding:2px 7px;border-radius:5px}
    blockquote{border-left:4px solid #7c6cf0;padding:10px 16px;margin:14px 0;color:rgba(0,0,0,0.5);font-style:italic;border-radius:0 8px 8px 0}
    table{border-collapse:collapse;width:100%;margin:14px 0;border-radius:8px;overflow:hidden;border:1px solid rgba(128,128,128,0.2)}
    th,td{border:1px solid rgba(128,128,128,0.2);padding:10px 14px;text-align:left}
    th{font-weight:600;background:rgba(124,108,240,0.06)}
    a{color:#7c6cf0;text-decoration:none}
    a:hover{text-decoration:underline}
    img{max-width:100%;border-radius:10px;margin:10px 0}
    hr{border:none;border-top:1px solid rgba(128,128,128,0.2);margin:24px 0}
    ul,ol{padding-left:1.8em;margin:8px 0}
    li{margin:5px 0;line-height:1.7}
    li input[type="checkbox"]{margin-right:8px;accent-color:#7c6cf0}
    del{color:#888}
  </style>
</head>
<body>${renderedHTML}</body>
</html>`
    const blob = new Blob([html], { type: 'text/html;charset=utf-8' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = 'markdown-export.html'
    a.click()
    URL.revokeObjectURL(url)
  }, [renderedHTML, isDark])

  // ── 预览 HTML ──
  const previewContent = useMemo(
    () => buildPreviewHTML(isDark, renderedHTML),
    [isDark, renderedHTML],
  )

  // ── 根样式变量 ──
  const rootVars = isDark ? CSS_VARS_DARK : CSS_VARS_LIGHT

  // ── 渲染 ──
  return (
    <div
      ref={containerRef}
      className="markdown-live-preview"
      style={{
        display: 'flex',
        flexDirection: 'column',
        height: '100%',
        overflow: 'hidden',
        ...rootVars,
      } as React.CSSProperties}
    >
      {/* ── 全局 CSS ── */}
      <style>{`
        .markdown-live-preview {
          background: var(--window-bg);
          color: var(--text-primary);
          font-family: 'JetBrains Mono', 'Fira Code', 'Cascadia Code', monospace;
        }
        .md-toolbar-btn {
          transition: all 0.15s ease;
        }
        .md-toolbar-btn:hover {
          background: var(--hover-bg) !important;
          color: var(--text-primary) !important;
        }
        .md-editor-textarea {
          font-family: 'JetBrains Mono', 'Fira Code', 'Cascadia Code', monospace;
          font-size: 14px;
          line-height: 1.65;
          color: var(--text-primary);
          background: var(--editor-bg);
          caret-color: var(--accent);
          tab-size: 2;
        }
        .md-editor-textarea::selection {
          background: rgba(124, 108, 240, 0.25);
        }
        .md-editor-textarea::-webkit-scrollbar {
          width: 8px;
          height: 8px;
        }
        .md-editor-textarea::-webkit-scrollbar-track {
          background: var(--scrollbar);
        }
        .md-editor-textarea::-webkit-scrollbar-thumb {
          background: var(--scrollbar-thumb);
          border-radius: 4px;
        }
        .md-preview-pane {
          overflow-y: auto;
          background: var(--preview-bg);
        }
        .md-preview-pane::-webkit-scrollbar {
          width: 8px;
          height: 8px;
        }
        .md-preview-pane::-webkit-scrollbar-track {
          background: var(--scrollbar);
        }
        .md-preview-pane::-webkit-scrollbar-thumb {
          background: var(--scrollbar-thumb);
          border-radius: 4px;
        }
        .md-split-handle {
          width: 5px;
          cursor: col-resize;
          background: var(--border);
          transition: background 0.2s;
          flex-shrink: 0;
          z-index: 5;
        }
        .md-split-handle:hover,
        .md-split-handle:active {
          background: var(--accent);
        }
      `}</style>

      {/* ── 顶部工具栏 ── */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 2,
          padding: '5px 10px',
          background: 'var(--toolbar-bg)',
          borderBottom: '1px solid var(--border)',
          flexShrink: 0,
        }}
      >
        {/* 文本格式 */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <ToolbarBtn icon={<Bold size={14} />} label="加粗 Ctrl+B" onClick={handleBold} />
          <ToolbarBtn icon={<Italic size={14} />} label="斜体 Ctrl+I" onClick={handleItalic} />
          <ToolbarBtn
            icon={
              <span style={{ fontSize: 13, fontWeight: 700, fontFamily: 'inherit' }}>
                S
              </span>
            }
            label="删除线"
            onClick={handleStrikethrough}
          />
          <ToolbarBtn icon={<Code size={14} />} label="行内代码" onClick={handleInlineCode} />
        </div>

        <ToolbarSep />

        {/* 标题 */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <ToolbarBtn icon={<Heading1 size={14} />} label="一级标题" onClick={handleH1} />
          <ToolbarBtn icon={<Heading2 size={14} />} label="二级标题" onClick={handleH2} />
          <ToolbarBtn icon={<Heading3 size={14} />} label="三级标题" onClick={handleH3} />
        </div>

        <ToolbarSep />

        {/* 结构 */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <ToolbarBtn icon={<Link size={14} />} label="链接" onClick={handleLink} />
          <ToolbarBtn icon={<Image size={14} />} label="图片" onClick={handleImage} />
          <ToolbarBtn icon={<Code size={14} />} label="代码块" onClick={handleCodeBlock} />
          <ToolbarBtn icon={<Table size={14} />} label="表格" onClick={handleTable} />
        </div>

        <ToolbarSep />

        {/* 列表与引用 */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <ToolbarBtn icon={<List size={14} />} label="无序列表" onClick={handleUnorderedList} />
          <ToolbarBtn icon={<ListOrdered size={14} />} label="有序列表" onClick={handleOrderedList} />
          <ToolbarBtn icon={<CheckSquare size={14} />} label="任务列表" onClick={handleCheckbox} />
          <ToolbarBtn icon={<Quote size={14} />} label="引用" onClick={handleQuote} />
          <ToolbarBtn icon={<Minus size={14} />} label="水平分割线" onClick={handleHr} />
        </div>

        <ToolbarSep />

        {/* 文件操作 */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <ToolbarBtn
            icon={<FileText size={14} />}
            label="加载示例模板"
            onClick={loadSample}
          />
          <ToolbarBtn
            icon={<Download size={14} />}
            label="导出 HTML"
            onClick={exportHTML}
          />
          <ToolbarBtn
            icon={<Trash2 size={14} />}
            label="清空内容"
            onClick={handleClear}
          />
        </div>

        <div style={{ flex: 1 }} />

        {/* 右侧：主题切换 */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
          <ToolbarBtn
            icon={isDark ? <Sun size={14} /> : <Moon size={14} />}
            label={isDark ? '切换到浅色主题' : '切换到深色主题'}
            onClick={() => setIsDark(d => !d)}
            active={!isDark}
          />
        </div>
      </div>

      {/* ── 主内容区（分栏） ── */}
      <div style={{ flex: 1, display: 'flex', overflow: 'hidden', minHeight: 0 }}>
        {/* 左：编辑器 */}
        <div
          style={{
            flex: `0 0 ${splitRatio * 100}%`,
            display: 'flex',
            flexDirection: 'column',
            minWidth: 0,
            overflow: 'hidden',
          }}
        >
          {/* 编辑器标签 */}
          <div
            style={{
              padding: '5px 14px',
              background: 'var(--toolbar-bg)',
              borderBottom: '1px solid var(--border)',
              fontSize: 11,
              color: 'var(--text-secondary)',
              display: 'flex',
              alignItems: 'center',
              gap: 6,
              flexShrink: 0,
              fontFamily: "'JetBrains Mono', monospace",
            }}
          >
            <FileText size={12} style={{ color: 'var(--accent)' }} />
            <span>MARKDOWN EDITOR</span>
          </div>
          {/* 文本编辑器 */}
          <textarea
            ref={textareaRef}
            className="md-editor-textarea"
            value={content}
            onChange={e => setContent(e.target.value)}
            spellCheck={false}
            style={{
              flex: 1,
              resize: 'none',
              border: 'none',
              outline: 'none',
              padding: '14px 18px',
              width: '100%',
              minHeight: 0,
            }}
            onKeyDown={e => {
              if ((e.ctrlKey || e.metaKey) && e.key === 'b') {
                e.preventDefault()
                handleBold()
              }
              if ((e.ctrlKey || e.metaKey) && e.key === 'i') {
                e.preventDefault()
                handleItalic()
              }
              if (e.key === 'Tab') {
                e.preventDefault()
                insertAtCursor('  ')
              }
            }}
          />
        </div>

        {/* 拖拽分隔条 */}
        <div
          className="md-split-handle"
          onMouseDown={handleMouseDown}
          role="separator"
          aria-orientation="vertical"
          aria-valuenow={Math.round(splitRatio * 100)}
        />

        {/* 右：预览 */}
        <div
          style={{
            flex: 1,
            display: 'flex',
            flexDirection: 'column',
            minWidth: 0,
            overflow: 'hidden',
          }}
        >
          {/* 预览标签 */}
          <div
            style={{
              padding: '5px 14px',
              background: 'var(--toolbar-bg)',
              borderBottom: '1px solid var(--border)',
              fontSize: 11,
              color: 'var(--text-secondary)',
              display: 'flex',
              alignItems: 'center',
              gap: 6,
              flexShrink: 0,
              fontFamily: "'JetBrains Mono', monospace",
            }}
          >
            <FileText size={12} style={{ color: 'var(--accent)' }} />
            <span>PREVIEW</span>
          </div>
          {/* 预览内容 */}
          <div
            className="md-preview-pane"
            style={{
              flex: 1,
              minHeight: 0,
              fontSize: 15,
            }}
            dangerouslySetInnerHTML={{ __html: previewContent }}
          />
        </div>
      </div>

      {/* ── 底部状态栏 ── */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 16,
          padding: '3px 14px',
          background: 'var(--status-bg)',
          borderTop: '1px solid var(--border)',
          fontSize: 11,
          color: 'var(--text-secondary)',
          flexShrink: 0,
          fontFamily: "'JetBrains Mono', monospace",
        }}
      >
        <span>
          字符: <b style={{ color: 'var(--accent)' }}>{stats.chars.toLocaleString()}</b>
        </span>
        <span>
          词数: <b style={{ color: 'var(--accent)' }}>{stats.words.toLocaleString()}</b>
        </span>
        <span>
          行数: <b style={{ color: 'var(--accent)' }}>{stats.lines}</b>
        </span>
        <span>
          阅读: <b style={{ color: 'var(--accent)' }}>{stats.readTime} 分钟</b>
        </span>
        <div style={{ flex: 1 }} />
        <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
          {isDark ? '🌙 深色' : '☀️ 浅色'} · 分栏 {Math.round(splitRatio * 100)}:{Math.round((1 - splitRatio) * 100)}
        </span>
      </div>
    </div>
  )
}
