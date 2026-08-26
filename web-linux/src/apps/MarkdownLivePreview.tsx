/**
 * Markdown Live Preview — Markdown 实时预览编辑器
 *
 * 特点：
 * - 分屏编辑（左侧源码 + 右侧实时预览）
 * - 使用 marked 库渲染 Markdown
 * - 工具栏快捷操作（加粗、斜体、标题、链接、图片、代码块、列表、引用）
 * - 导出为 HTML 文件
 * - 字数统计（字数、行数、字符数）
 * - 本地存储自动保存
 * - 全屏预览模式
 * - 亮色/暗色主题切换
 */

import { useState, useEffect, useCallback, useMemo, useRef } from 'react'
import { marked } from 'marked'
import {
  Bold, Italic, Heading1, Link, Image, Code,
  List, Quote, Download, Maximize2, Minimize2,
  Sun, Moon, Type, FileText, RotateCcw
} from 'lucide-react'

// ─── Config ──────────────────────────────────────────────────────────────────

const STORAGE_KEY = 'weblinux-markdown-live-preview'

marked.setOptions({
  breaks: true,
  gfm: true,
})

// ─── Default Content ─────────────────────────────────────────────────────────

const DEFAULT_CONTENT = `# Markdown Live Preview

欢迎使用 **Markdown 实时预览** 编辑器！

## 功能特色

- **分屏编辑** — 左侧编写 Markdown，右侧实时预览
- **工具栏** — 快捷插入 Markdown 语法
- **导出功能** — 将文档导出为 HTML 文件
- **字数统计** — 底部显示详细统计信息
- **本地存储** — 内容自动保存到浏览器
- **全屏预览** — 一键切换纯预览模式
- **主题切换** — 预览区支持亮色/暗色主题

## 代码示例

\`\`\`typescript
function greet(name: string): string {
  return \`Hello, \${name}!\`
}

console.log(greet('World'))
\`\`\`

## 表格

| 功能 | 快捷按钮 | 说明 |
|------|----------|------|
| 加粗 | **B** | 选中文本后点击 |
| 斜体 | *I* | 选中文本后点击 |
| 标题 | H1 | 插入标题语法 |
| 链接 | 🔗 | 插入链接语法 |

## 引用

> 这是一段引用文字。Markdown 让写作变得简单而优雅。

---

开始编辑吧！
`

// ─── Toolbar Button Component ────────────────────────────────────────────────

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
      style={{
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        width: 32, height: 32, border: 'none', borderRadius: 6,
        background: active ? 'rgba(124,108,240,0.2)' : 'transparent',
        color: active ? '#7c6cf0' : '#aaa',
        cursor: 'pointer', transition: 'all 0.15s',
        flexShrink: 0,
      }}
      onMouseEnter={e => {
        if (!active) {
          e.currentTarget.style.background = 'rgba(255,255,255,0.08)'
          e.currentTarget.style.color = '#fff'
        }
      }}
      onMouseLeave={e => {
        if (!active) {
          e.currentTarget.style.background = 'transparent'
          e.currentTarget.style.color = '#aaa'
        }
      }}
    >
      {icon}
    </button>
  )
}

// ─── Main Component ──────────────────────────────────────────────────────────

export default function MarkdownLivePreview() {
  // Editor content
  const [content, setContent] = useState<string>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY)
      if (saved !== null) return saved
    } catch { /* ignore */ }
    return DEFAULT_CONTENT
  })

  // UI state
  const [previewTheme, setPreviewTheme] = useState<'dark' | 'light'>('dark')
  const [fullscreen, setFullscreen] = useState(false)

  // Refs
  const textareaRef = useRef<HTMLTextAreaElement>(null)
  const previewRef = useRef<HTMLDivElement>(null)

  // ── Auto-save ──
  useEffect(() => {
    const timer = setTimeout(() => {
      try { localStorage.setItem(STORAGE_KEY, content) } catch { /* ignore */ }
    }, 600)
    return () => clearTimeout(timer)
  }, [content])

  // ── Rendered HTML ──
  const renderedHTML = useMemo(() => {
    if (!content) return ''
    return marked.parse(content) as string
  }, [content])

  // ── Stats ──
  const stats = useMemo(() => {
    const chars = content.length
    const words = content.trim() ? content.trim().split(/\s+/).length : 0
    const lines = content.split('\n').length
    const readTime = Math.max(1, Math.ceil(words / 200))
    return { chars, words, lines, readTime }
  }, [content])

  // ── Toolbar Actions ──
  const wrapSelection = useCallback((before: string, after: string) => {
    const ta = textareaRef.current
    if (!ta) return
    const start = ta.selectionStart
    const end = ta.selectionEnd
    const selected = content.substring(start, end)
    const newContent = content.substring(0, start) + before + selected + after + content.substring(end)
    setContent(newContent)
    setTimeout(() => {
      ta.focus()
      ta.selectionStart = start + before.length
      ta.selectionEnd = start + before.length + selected.length
    }, 0)
  }, [content])

  const insertAtCursor = useCallback((text: string) => {
    const ta = textareaRef.current
    if (!ta) return
    const start = ta.selectionStart
    const newContent = content.substring(0, start) + text + content.substring(start)
    setContent(newContent)
    setTimeout(() => {
      ta.focus()
      ta.selectionStart = start + text.length
      ta.selectionEnd = start + text.length
    }, 0)
  }, [content])

  const insertPrefixPerLine = useCallback((prefix: string) => {
    const ta = textareaRef.current
    if (!ta) return
    const start = ta.selectionStart
    const end = ta.selectionEnd
    const selected = content.substring(start, end)
    const lines = selected.split('\n')
    const newLines = lines.map(l => prefix + l)
    const newText = newLines.join('\n')
    const newContent = content.substring(0, start) + newText + content.substring(end)
    setContent(newContent)
    setTimeout(() => {
      ta.focus()
      ta.selectionStart = start
      ta.selectionEnd = start + newText.length
    }, 0)
  }, [content])

  const handleBold = useCallback(() => wrapSelection('**', '**'), [wrapSelection])
  const handleItalic = useCallback(() => wrapSelection('*', '*'), [wrapSelection])
  const handleH1 = useCallback(() => insertPrefixPerLine('# '), [insertPrefixPerLine])
  const handleH2 = useCallback(() => insertPrefixPerLine('## '), [insertPrefixPerLine])
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
  const handleImage = useCallback(() => insertAtCursor('![alt text](image-url)'), [insertAtCursor])
  const handleCode = useCallback(() => {
    const ta = textareaRef.current
    if (!ta) return
    const sel = content.substring(ta.selectionStart, ta.selectionEnd)
    if (sel && sel.includes('\n')) {
      wrapSelection('```\n', '\n```')
    } else if (sel) {
      wrapSelection('`', '`')
    } else {
      insertAtCursor('```\ncode\n```')
    }
  }, [content, wrapSelection, insertAtCursor])
  const handleList = useCallback(() => insertPrefixPerLine('- '), [insertPrefixPerLine])
  const handleQuote = useCallback(() => insertPrefixPerLine('> '), [insertPrefixPerLine])
  const handleHr = useCallback(() => insertAtCursor('\n---\n'), [insertAtCursor])

  // ── Export HTML ──
  const exportHTML = useCallback(() => {
    const previewStyles = previewTheme === 'light'
      ? 'body{background:#fff;color:#1a1a2e}'
      : 'body{background:#1a1a2e;color:#d4d4d4}'
    const html = `<!DOCTYPE html>
<html lang="zh-CN">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Markdown Export</title>
  <style>
    ${previewStyles}
    body{max-width:800px;margin:40px auto;padding:20px;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;line-height:1.7}
    h1,h2,h3,h4,h5,h6{margin:1.2em 0 0.6em;font-weight:600}
    h1{font-size:2em;border-bottom:1px solid rgba(128,128,128,0.3);padding-bottom:0.3em}
    h2{font-size:1.5em;border-bottom:1px solid rgba(128,128,128,0.2);padding-bottom:0.3em}
    pre{background:rgba(0,0,0,0.15);border-radius:8px;padding:16px;overflow-x:auto;margin:12px 0}
    code{font-family:'Fira Code','JetBrains Mono',monospace;font-size:0.9em}
    :not(pre)>code{background:rgba(0,0,0,0.1);padding:2px 6px;border-radius:4px}
    blockquote{border-left:4px solid #7c6cf0;padding:4px 16px;margin:12px 0;color:rgba(0,0,0,0.6);font-style:italic}
    table{border-collapse:collapse;width:100%;margin:12px 0}
    th,td{border:1px solid rgba(128,128,128,0.3);padding:8px 12px;text-align:left}
    th{font-weight:600;background:rgba(0,0,0,0.05)}
    a{color:#7c6cf0}
    img{max-width:100%;border-radius:8px}
    hr{border:none;border-top:1px solid rgba(128,128,128,0.3);margin:24px 0}
    ul,ol{padding-left:1.5em}
    li{margin:4px 0}
    li input[type="checkbox"]{margin-right:6px}
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
  }, [renderedHTML, previewTheme])

  // ── Reset ──
  const handleReset = useCallback(() => {
    if (confirm('确定要清空编辑器内容吗？')) {
      setContent('')
    }
  }, [])

  // ── Styles ──
  const isDark = previewTheme === 'dark'

  return (
    <div style={{
      display: 'flex', flexDirection: 'column',
      height: '100%', background: '#1e1e1e', color: '#d4d4d4',
      fontFamily: "'JetBrains Mono','Fira Code','Cascadia Code',monospace",
      overflow: 'hidden',
    }}>
      {/* ── Top Toolbar ── */}
      <div style={{
        display: 'flex', alignItems: 'center', gap: 2,
        padding: '6px 12px',
        background: '#252526',
        borderBottom: '1px solid #404040',
        flexShrink: 0,
      }}>
        {/* Toolbar icon group */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 1, padding: '0 4px' }}>
          <ToolbarBtn icon={<Bold size={15} />} label="加粗 (Ctrl+B)" onClick={handleBold} />
          <ToolbarBtn icon={<Italic size={15} />} label="斜体 (Ctrl+I)" onClick={handleItalic} />
        </div>

        <div style={{ width: 1, height: 20, background: '#404040', margin: '0 4px', flexShrink: 0 }} />

        <div style={{ display: 'flex', alignItems: 'center', gap: 1, padding: '0 4px' }}>
          <ToolbarBtn icon={<Heading1 size={15} />} label="一级标题" onClick={handleH1} />
          <button
            onClick={handleH2}
            title="二级标题"
            style={{
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              width: 32, height: 32, border: 'none', borderRadius: 6,
              background: 'transparent', color: '#aaa', cursor: 'pointer',
              fontSize: 13, fontWeight: 700, flexShrink: 0,
            }}
            onMouseEnter={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.08)'; e.currentTarget.style.color = '#fff' }}
            onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = '#aaa' }}
          >
            H2
          </button>
        </div>

        <div style={{ width: 1, height: 20, background: '#404040', margin: '0 4px', flexShrink: 0 }} />

        <div style={{ display: 'flex', alignItems: 'center', gap: 1, padding: '0 4px' }}>
          <ToolbarBtn icon={<Link size={15} />} label="链接" onClick={handleLink} />
          <ToolbarBtn icon={<Image size={15} />} label="图片" onClick={handleImage} />
          <ToolbarBtn icon={<Code size={15} />} label="代码块/行内代码" onClick={handleCode} />
        </div>

        <div style={{ width: 1, height: 20, background: '#404040', margin: '0 4px', flexShrink: 0 }} />

        <div style={{ display: 'flex', alignItems: 'center', gap: 1, padding: '0 4px' }}>
          <ToolbarBtn icon={<List size={15} />} label="无序列表" onClick={handleList} />
          <ToolbarBtn icon={<Quote size={15} />} label="引用" onClick={handleQuote} />
          <ToolbarBtn icon={<FileText size={15} />} label="水平分割线" onClick={handleHr} />
        </div>

        {/* Spacer */}
        <div style={{ flex: 1 }} />

        {/* Right actions */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 2 }}>
          <ToolbarBtn
            icon={isDark ? <Sun size={15} /> : <Moon size={15} />}
            label={isDark ? '切换到亮色主题' : '切换到暗色主题'}
            onClick={() => setPreviewTheme(isDark ? 'light' : 'dark')}
            active={!isDark}
          />
          <ToolbarBtn
            icon={fullscreen ? <Minimize2 size={15} /> : <Maximize2 size={15} />}
            label={fullscreen ? '退出全屏预览' : '全屏预览'}
            onClick={() => setFullscreen(f => !f)}
            active={fullscreen}
          />
          <ToolbarBtn
            icon={<Download size={15} />}
            label="导出 HTML"
            onClick={exportHTML}
          />
          <ToolbarBtn
            icon={<RotateCcw size={15} />}
            label="清空内容"
            onClick={handleReset}
          />
        </div>
      </div>

      {/* ── Main Content ── */}
      <div style={{ flex: 1, display: 'flex', overflow: 'hidden', minHeight: 0 }}>
        {/* Left: Editor */}
        {!fullscreen && (
          <div style={{
            flex: 1, display: 'flex', flexDirection: 'column',
            borderRight: '1px solid #404040', minWidth: 0,
          }}>
            {/* Editor header */}
            <div style={{
              padding: '6px 16px',
              background: '#252526',
              borderBottom: '1px solid #404040',
              fontSize: 12, color: '#888',
              display: 'flex', alignItems: 'center', gap: 6,
              flexShrink: 0,
            }}>
              <Type size={13} style={{ color: '#7c6cf0' }} />
              <span>Markdown 源码</span>
            </div>
            {/* Textarea */}
            <textarea
              ref={textareaRef}
              value={content}
              onChange={e => setContent(e.target.value)}
              spellCheck={false}
              style={{
                flex: 1, resize: 'none', border: 'none', outline: 'none',
                background: '#1e1e1e', color: '#d4d4d4',
                fontFamily: "'JetBrains Mono','Fira Code',monospace",
                fontSize: 14, lineHeight: 1.6,
                padding: '16px 20px',
                tabSize: 2,
                overflow: 'auto',
                width: '100%',
                minHeight: 0,
              }}
              onKeyDown={e => {
                // Ctrl+B bold
                if ((e.ctrlKey || e.metaKey) && e.key === 'b') {
                  e.preventDefault()
                  handleBold()
                }
                // Ctrl+I italic
                if ((e.ctrlKey || e.metaKey) && e.key === 'i') {
                  e.preventDefault()
                  handleItalic()
                }
                // Tab key inserts spaces
                if (e.key === 'Tab') {
                  e.preventDefault()
                  insertAtCursor('  ')
                }
              }}
            />
          </div>
        )}

        {/* Right: Preview */}
        <div style={{
          flex: fullscreen ? undefined : 1,
          width: fullscreen ? '100%' : undefined,
          display: 'flex', flexDirection: 'column',
          minWidth: 0,
          ...(fullscreen ? { position: 'absolute' as const, inset: 0, zIndex: 10 } : {}),
        }}>
          {/* Preview header */}
          <div style={{
            padding: '6px 16px',
            background: isDark ? '#252526' : '#f0f0f0',
            borderBottom: `1px solid ${isDark ? '#404040' : '#d0d0d0'}`,
            fontSize: 12, color: isDark ? '#888' : '#666',
            display: 'flex', alignItems: 'center', gap: 6,
            flexShrink: 0,
          }}>
            <FileText size={13} style={{ color: '#7c6cf0' }} />
            <span>实时预览</span>
            {fullscreen && (
              <button
                onClick={() => setFullscreen(false)}
                style={{
                  marginLeft: 'auto', background: 'none', border: 'none',
                  color: '#7c6cf0', cursor: 'pointer', fontSize: 12,
                  display: 'flex', alignItems: 'center', gap: 4,
                }}
              >
                <Minimize2 size={13} /> 退出全屏
              </button>
            )}
          </div>
          {/* Preview content */}
          <div
            ref={previewRef}
            style={{
              flex: 1, overflow: 'auto',
              background: isDark ? '#1a1a2e' : '#ffffff',
              color: isDark ? '#d4d4d4' : '#1a1a2e',
              padding: '20px 28px',
              fontFamily: "-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif",
              fontSize: 15, lineHeight: 1.8,
              minHeight: 0,
            }}
            dangerouslySetInnerHTML={{ __html: previewStyleHTML(isDark, renderedHTML) }}
          />
        </div>
      </div>

      {/* ── Bottom Status Bar ── */}
      <div style={{
        display: 'flex', alignItems: 'center', gap: 16,
        padding: '4px 16px',
        background: '#252526',
        borderTop: '1px solid #404040',
        fontSize: 11, color: '#888',
        flexShrink: 0,
        fontFamily: "'JetBrains Mono','Fira Code',monospace",
      }}>
        <span>字符: <b style={{ color: '#7c6cf0' }}>{stats.chars.toLocaleString()}</b></span>
        <span>词数: <b style={{ color: '#7c6cf0' }}>{stats.words.toLocaleString()}</b></span>
        <span>行数: <b style={{ color: '#7c6cf0' }}>{stats.lines}</b></span>
        <span>预计阅读: <b style={{ color: '#7c6cf0' }}>{stats.readTime} 分钟</b></span>
        <div style={{ flex: 1 }} />
        <span style={{ color: '#666' }}>
          主题: {isDark ? '🌙 暗色' : '☀️ 亮色'}
        </span>
      </div>
    </div>
  )
}

// ─── Preview HTML with Theme Styles ─────────────────────────────────────────

function previewStyleHTML(isDark: boolean, html: string): string {
  const bgColor = isDark ? '#1a1a2e' : '#ffffff'
  const textColor = isDark ? '#d4d4d4' : '#1a1a2e'
  const mutedColor = isDark ? '#8892b0' : '#555555'
  const borderColor = isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.1)'
  const codeBg = isDark ? 'rgba(0,0,0,0.3)' : 'rgba(0,0,0,0.06)'
  const inlineCodeBg = isDark ? 'rgba(124,108,240,0.12)' : 'rgba(124,108,240,0.08)'
  const linkColor = '#7c6cf0'
  const tableHoverBg = isDark ? 'rgba(255,255,255,0.03)' : 'rgba(0,0,0,0.02)'

  return `<style>
    .md-preview { background: ${bgColor}; padding: 24px 32px; min-height: 100%; }
    .md-preview h1,.md-preview h2,.md-preview h3,.md-preview h4,.md-preview h5,.md-preview h6 {
      margin: 1.3em 0 0.6em; font-weight: 700; line-height: 1.3;
      color: ${textColor};
    }
    .md-preview h1 { font-size: 2em; border-bottom: 2px solid ${borderColor}; padding-bottom: 0.3em; }
    .md-preview h2 { font-size: 1.5em; border-bottom: 1px solid ${borderColor}; padding-bottom: 0.3em; }
    .md-preview h3 { font-size: 1.25em; }
    .md-preview p { margin: 0.8em 0; }
    .md-preview a { color: ${linkColor}; text-decoration: none; border-bottom: 1px solid transparent; transition: border-color 0.2s; }
    .md-preview a:hover { border-bottom-color: ${linkColor}; }
    .md-preview strong { font-weight: 700; color: ${textColor}; }
    .md-preview em { font-style: italic; }
    .md-preview code {
      font-family: 'JetBrains Mono','Fira Code',monospace;
      font-size: 0.88em;
      background: ${inlineCodeBg};
      padding: 2px 7px;
      border-radius: 5px;
    }
    .md-preview pre {
      background: ${codeBg};
      border-radius: 10px;
      padding: 16px 20px;
      overflow-x: auto;
      margin: 14px 0;
      border: 1px solid ${borderColor};
    }
    .md-preview pre code { background: none; padding: 0; font-size: 0.85em; color: ${textColor}; }
    .md-preview blockquote {
      border-left: 4px solid ${linkColor};
      padding: 8px 16px;
      margin: 14px 0;
      color: ${mutedColor};
      background: ${isDark ? 'rgba(124,108,240,0.05)' : 'rgba(124,108,240,0.04)'};
      border-radius: 0 8px 8px 0;
      font-style: italic;
    }
    .md-preview ul, .md-preview ol { padding-left: 1.8em; margin: 8px 0; }
    .md-preview li { margin: 5px 0; line-height: 1.7; }
    .md-preview li input[type="checkbox"] { margin-right: 8px; accent-color: ${linkColor}; }
    .md-preview table { border-collapse: collapse; width: 100%; margin: 14px 0; border-radius: 8px; overflow: hidden; border: 1px solid ${borderColor}; }
    .md-preview th, .md-preview td { border: 1px solid ${borderColor}; padding: 10px 14px; text-align: left; }
    .md-preview th { font-weight: 600; background: ${isDark ? 'rgba(124,108,240,0.08)' : 'rgba(124,108,240,0.06)'}; }
    .md-preview tr:hover td { background: ${tableHoverBg}; }
    .md-preview img { max-width: 100%; border-radius: 10px; margin: 10px 0; }
    .md-preview hr { border: none; border-top: 1px solid ${borderColor}; margin: 24px 0; }
    .md-preview del { color: ${mutedColor}; }
  </style>
  <div class="md-preview">${html}</div>`
}
