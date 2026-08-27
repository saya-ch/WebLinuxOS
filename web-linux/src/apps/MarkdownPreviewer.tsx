import React, { useState, useMemo, useCallback, useRef } from 'react'
import { marked } from 'marked'
import { Copy, Download, FileText } from 'lucide-react'

marked.use({ gfm: true, breaks: true })

const COLORS = {
  bg: '#1a1a2e',
  editorBg: '#0d1117',
  previewBg: '#0d1117',
  text: '#e6e6e6',
  textMuted: '#8b949e',
  accent: '#7c6cf0',
  accentHover: '#6a5ce0',
  border: 'rgba(255,255,255,0.08)',
  headerBg: 'rgba(13,17,23,0.9)',
  toolbarBg: 'rgba(30,30,50,0.95)',
  codeBg: '#161b22',
  hoverBg: 'rgba(124,108,240,0.1)',
  btnBg: 'rgba(255,255,255,0.06)',
  scrollbar: '#30363d',
  scrollbarThumb: '#484f58',
}

const SAMPLE_MARKDOWN = `# Markdown 实时预览器

欢迎使用 Markdown 预览器！在左侧编辑 Markdown，右侧实时预览效果。

## 文本样式

**粗体文本** 和 *斜体文本* 以及 ~~删除线~~

## 代码

行内代码: \`const x = 42\`

\`\`\`javascript
function fibonacci(n) {
  if (n <= 1) return n;
  return fibonacci(n - 1) + fibonacci(n - 2);
}

console.log(fibonacci(10)); // 55
\`\`\`

## 列表

- 第一项
- 第二项
  - 嵌套项
- 第三项

## 有序列表

1. 步骤一
2. 步骤二
3. 步骤三

## 引用

> 这是一段引用文本。
> 
> > 嵌套引用也可以。

## 表格

| 语言 | 类型 | 用途 |
|------|------|------|
| TypeScript | 静态类型 | 前端开发 |
| Python | 动态类型 | 数据科学 |
| Rust | 系统编程 | 底层开发 |

## 链接与图片

[访问 GitHub](https://github.com)

---

*享受写作的乐趣！*
`

const PREVIEW_STYLES = `
  .md-preview { color: #e6e6e6; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Helvetica, Arial, sans-serif; line-height: 1.6; padding: 24px; }
  .md-preview h1, .md-preview h2, .md-preview h3, .md-preview h4, .md-preview h5, .md-preview h6 { color: #f0f0f0; margin-top: 24px; margin-bottom: 16px; font-weight: 600; line-height: 1.25; }
  .md-preview h1 { font-size: 2em; border-bottom: 1px solid ${COLORS.border}; padding-bottom: 0.3em; }
  .md-preview h2 { font-size: 1.5em; border-bottom: 1px solid ${COLORS.border}; padding-bottom: 0.3em; }
  .md-preview h3 { font-size: 1.25em; }
  .md-preview p { margin: 0 0 16px; }
  .md-preview a { color: ${COLORS.accent}; text-decoration: none; }
  .md-preview a:hover { text-decoration: underline; }
  .md-preview strong { color: #f0f0f0; }
  .md-preview blockquote { border-left: 4px solid ${COLORS.accent}; padding: 0 16px; margin: 0 0 16px; color: ${COLORS.textMuted}; background: rgba(124,108,240,0.05); padding: 12px 16px; border-radius: 0 6px 6px 0; }
  .md-preview code { background: ${COLORS.codeBg}; padding: 2px 6px; border-radius: 4px; font-family: 'SF Mono', 'Fira Code', monospace; font-size: 0.9em; color: #e06c75; }
  .md-preview pre { background: ${COLORS.codeBg}; border: 1px solid ${COLORS.border}; border-radius: 8px; padding: 16px; overflow-x: auto; margin: 0 0 16px; position: relative; }
  .md-preview pre code { background: transparent; padding: 0; color: #e6e6e6; font-size: 13px; line-height: 1.5; }
  .md-preview ul, .md-preview ol { padding-left: 24px; margin: 0 0 16px; }
  .md-preview li { margin: 4px 0; }
  .md-preview table { border-collapse: collapse; width: 100%; margin: 0 0 16px; }
  .md-preview th, .md-preview td { border: 1px solid ${COLORS.border}; padding: 8px 12px; text-align: left; }
  .md-preview th { background: rgba(124,108,240,0.1); color: #f0f0f0; font-weight: 600; }
  .md-preview tr:nth-child(even) { background: rgba(255,255,255,0.02); }
  .md-preview hr { border: none; border-top: 1px solid ${COLORS.border}; margin: 24px 0; }
  .md-preview img { max-width: 100%; border-radius: 8px; }
  .md-preview input[type="checkbox"] { margin-right: 6px; accent-color: ${COLORS.accent}; }
  .md-preview del { color: ${COLORS.textMuted}; }
  .code-block-wrapper { position: relative; }
  .code-lang-label { position: absolute; top: 8px; right: 12px; font-size: 11px; color: ${COLORS.textMuted}; text-transform: uppercase; letter-spacing: 0.5px; user-select: none; }
  .code-copy-btn { position: absolute; top: 6px; right: 60px; background: ${COLORS.btnBg}; border: 1px solid ${COLORS.border}; color: ${COLORS.textMuted}; padding: 2px 8px; border-radius: 4px; cursor: pointer; font-size: 11px; transition: all 0.2s; }
  .code-copy-btn:hover { background: ${COLORS.hoverBg}; color: ${COLORS.accent}; }
`

const sanitizeHtml = (html: string): string => {
  return html
    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
    .replace(/<iframe\b[^<]*(?:(?!<\/iframe>)<[^<]*)*<\/iframe>/gi, '')
    .replace(/\son\w+\s*=\s*["'][^"']*["']/gi, '')
    .replace(/\son\w+\s*=\s*[^\s>]+/gi, '')
}

function highlightCode(code: string, lang: string): string {
  let escaped = code
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')

  if (['javascript', 'js', 'typescript', 'ts', 'jsx', 'tsx'].includes(lang)) {
    escaped = escaped
      .replace(/(\/\/.*$)/gm, '<span style="color:#8b949e">$1</span>')
      .replace(/(\/\*[\s\S]*?\*\/)/g, '<span style="color:#8b949e">$1</span>')
      .replace(/\b(const|let|var|function|return|if|else|for|while|do|switch|case|break|continue|new|this|class|extends|import|export|from|default|async|await|try|catch|finally|throw|typeof|instanceof|in|of|true|false|null|undefined|void)\b/g, '<span style="color:#c678dd">$1</span>')
      .replace(/(&#39;[^&#39;]*&#39;|&quot;[^&quot;]*&quot;|`[^`]*`|"[^"]*"|'[^']*')/g, '<span style="color:#98c379">$1</span>')
      .replace(/\b(\d+\.?\d*)\b/g, '<span style="color:#d19a66">$1</span>')
  } else if (['python', 'py'].includes(lang)) {
    escaped = escaped
      .replace(/(#.*$)/gm, '<span style="color:#8b949e">$1</span>')
      .replace(/\b(def|class|return|if|elif|else|for|while|import|from|as|try|except|finally|raise|with|lambda|yield|pass|break|continue|True|False|None|and|or|not|in|is|print)\b/g, '<span style="color:#c678dd">$1</span>')
      .replace(/(&#39;[^&#39;]*&#39;|&quot;[^&quot;]*&quot;|"[^"]*"|'[^']*')/g, '<span style="color:#98c379">$1</span>')
      .replace(/\b(\d+\.?\d*)\b/g, '<span style="color:#d19a66">$1</span>')
  } else if (['css', 'scss'].includes(lang)) {
    escaped = escaped
      .replace(/(\/\*[\s\S]*?\*\/)/g, '<span style="color:#8b949e">$1</span>')
      .replace(/([\w-]+)\s*:/g, '<span style="color:#e06c75">$1</span>:')
      .replace(/:\s*([^;{]+)/g, ': <span style="color:#98c379">$1</span>')
  } else if (['html', 'xml'].includes(lang)) {
    escaped = escaped
      .replace(/(&lt;\/?)([\w-]+)/g, '$1<span style="color:#e06c75">$2</span>')
      .replace(/([\w-]+)=/g, '<span style="color:#d19a66">$1</span>=')
      .replace(/("[^"]*")/g, '<span style="color:#98c379">$1</span>')
  } else {
    escaped = escaped
      .replace(/(#.*$)/gm, '<span style="color:#8b949e">$1</span>')
      .replace(/\b(\d+\.?\d*)\b/g, '<span style="color:#d19a66">$1</span>')
  }
  return escaped
}

export default function MarkdownPreviewer() {
  const [markdown, setMarkdown] = useState(SAMPLE_MARKDOWN)
  const [copyFeedback, setCopyFeedback] = useState('')
  const textareaRef = useRef<HTMLTextAreaElement>(null)
  const containerRef = useRef<HTMLDivElement>(null)
  const [splitRatio, setSplitRatio] = useState(0.45)
  const draggingRef = useRef(false)

  const html = useMemo(() => {
    try {
      const raw = marked.parse(markdown) as string
      return sanitizeHtml(raw)
    } catch (err) {
      return `<p style="color:#e06c75">渲染错误: ${String(err)}</p>`
    }
  }, [markdown])

  const highlightedHtml = useMemo(() => {
    return html.replace(
      /<pre><code class="language-(\w+)">([\s\S]*?)<\/code><\/pre>/g,
      (_match, lang, code) => {
        const highlighted = highlightCode(code, lang)
        return `<div class="code-block-wrapper"><span class="code-lang-label">${lang}</span><button class="code-copy-btn" onclick="(function(btn){var code=btn.closest('.code-block-wrapper').querySelector('code');var text=code.textContent;navigator.clipboard.writeText(text).then(function(){btn.textContent='已复制';setTimeout(function(){btn.textContent='复制'},1500)});})(this)">复制</button><pre><code class="language-${lang}">${highlighted}</code></pre></div>`
      }
    )
  }, [html])

  const stats = useMemo(() => {
    const text = markdown.trim()
    return {
      chars: text.length,
      words: text ? text.split(/\s+/).filter(Boolean).length : 0,
      lines: markdown.split('\n').length,
    }
  }, [markdown])

  const handleExport = useCallback(() => {
    const fullHtml = `<!DOCTYPE html>
<html lang="zh-CN">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>Markdown 文档</title>
<style>
  body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Helvetica, Arial, sans-serif; max-width: 800px; margin: 0 auto; padding: 40px 20px; background: #0d1117; color: #e6e6e6; line-height: 1.6; }
  h1, h2, h3 { border-bottom: 1px solid rgba(255,255,255,0.08); padding-bottom: 0.3em; }
  a { color: #7c6cf0; }
  code { background: #161b22; padding: 2px 6px; border-radius: 4px; font-size: 0.9em; }
  pre { background: #161b22; padding: 16px; border-radius: 8px; overflow-x: auto; }
  pre code { background: transparent; padding: 0; }
  blockquote { border-left: 4px solid #7c6cf0; padding: 12px 16px; margin: 0 0 16px; color: #8b949e; background: rgba(124,108,240,0.05); border-radius: 0 6px 6px 0; }
  table { border-collapse: collapse; width: 100%; }
  th, td { border: 1px solid rgba(255,255,255,0.08); padding: 8px 12px; }
  th { background: rgba(124,108,240,0.1); }
  hr { border: none; border-top: 1px solid rgba(255,255,255,0.08); margin: 24px 0; }
</style>
</head>
<body>
${html}
</body>
</html>`
    const blob = new Blob([fullHtml], { type: 'text/html;charset=utf-8' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = 'document.html'
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
  }, [html])

  const handleCopy = useCallback(() => {
    navigator.clipboard.writeText(html).then(() => {
      setCopyFeedback('已复制!')
      setTimeout(() => setCopyFeedback(''), 2000)
    }).catch(() => {
      setCopyFeedback('复制失败')
      setTimeout(() => setCopyFeedback(''), 2000)
    })
  }, [html])

  const handleInsertFormat = useCallback((prefix: string, suffix: string) => {
    const textarea = textareaRef.current
    if (!textarea) return
    const start = textarea.selectionStart
    const end = textarea.selectionEnd
    const selected = markdown.substring(start, end)
    const newText = markdown.substring(0, start) + prefix + selected + suffix + markdown.substring(end)
    setMarkdown(newText)
    requestAnimationFrame(() => {
      textarea.focus()
      const cursorPos = start + prefix.length + selected.length
      textarea.setSelectionRange(cursorPos, cursorPos)
    })
  }, [markdown])

  const handleDragStart = useCallback((e: React.MouseEvent) => {
    e.preventDefault()
    draggingRef.current = true
    const container = containerRef.current
    if (!container) return
    const handleMove = (ev: MouseEvent) => {
      if (!draggingRef.current) return
      const rect = container.getBoundingClientRect()
      const ratio = Math.max(0.2, Math.min(0.8, (ev.clientX - rect.left) / rect.width))
      setSplitRatio(ratio)
    }
    const handleUp = () => {
      draggingRef.current = false
      document.removeEventListener('mousemove', handleMove)
      document.removeEventListener('mouseup', handleUp)
      document.body.style.cursor = ''
      document.body.style.userSelect = ''
    }
    document.body.style.cursor = 'col-resize'
    document.body.style.userSelect = 'none'
    document.addEventListener('mousemove', handleMove)
    document.addEventListener('mouseup', handleUp)
  }, [])

  const handleKeyDown = useCallback((e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    const mod = e.ctrlKey || e.metaKey
    if (mod && e.key === 'b') { e.preventDefault(); handleInsertFormat('**', '**') }
    else if (mod && e.key === 'i') { e.preventDefault(); handleInsertFormat('*', '*') }
  }, [handleInsertFormat])

  const lineNumbers = useMemo(() => {
    return Array.from({ length: markdown.split('\n').length }, (_, i) => i + 1)
  }, [markdown])

  return (
    <div style={{ background: COLORS.bg, height: '100%', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
      <style>{PREVIEW_STYLES}</style>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '8px 12px', background: COLORS.headerBg, borderBottom: `1px solid ${COLORS.border}`, flexShrink: 0 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <FileText size={16} color={COLORS.accent} />
          <span style={{ color: COLORS.text, fontSize: 14, fontWeight: 600 }}>Markdown 预览器</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <span style={{ color: COLORS.textMuted, fontSize: 11 }}>{stats.chars} 字符 · {stats.words} 词 · {stats.lines} 行</span>
          <div style={{ width: 1, height: 16, background: COLORS.border, margin: '0 4px' }} />
          <button onClick={handleCopy} style={{ display: 'flex', alignItems: 'center', gap: 4, background: COLORS.btnBg, border: `1px solid ${COLORS.border}`, color: COLORS.textMuted, padding: '3px 10px', borderRadius: 4, cursor: 'pointer', fontSize: 12, transition: 'all 0.2s' }}
            onMouseEnter={e => { e.currentTarget.style.background = COLORS.hoverBg; e.currentTarget.style.color = COLORS.accent }}
            onMouseLeave={e => { e.currentTarget.style.background = COLORS.btnBg; e.currentTarget.style.color = COLORS.textMuted }}>
            <Copy size={12} />
            {copyFeedback || '复制 HTML'}
          </button>
          <button onClick={handleExport} style={{ display: 'flex', alignItems: 'center', gap: 4, background: COLORS.accent, border: 'none', color: '#fff', padding: '3px 10px', borderRadius: 4, cursor: 'pointer', fontSize: 12, fontWeight: 500, transition: 'background 0.2s' }}
            onMouseEnter={e => { e.currentTarget.style.background = COLORS.accentHover }}
            onMouseLeave={e => { e.currentTarget.style.background = COLORS.accent }}>
            <Download size={12} />
            导出 HTML
          </button>
        </div>
      </div>
      {/* Toolbar */}
      <div style={{ display: 'flex', gap: 2, padding: '4px 12px', background: COLORS.toolbarBg, borderBottom: `1px solid ${COLORS.border}`, flexShrink: 0 }}>
        {[
          { label: 'B', title: '粗体', action: () => handleInsertFormat('**', '**') },
          { label: 'I', title: '斜体', action: () => handleInsertFormat('*', '*') },
          { label: 'H', title: '标题', action: () => handleInsertFormat('\n## ', '\n') },
          { label: '🔗', title: '链接', action: () => handleInsertFormat('[', '](url)') },
          { label: '🖼', title: '图片', action: () => handleInsertFormat('![alt](', ')') },
          { label: '</>', title: '代码块', action: () => handleInsertFormat('\n```\n', '\n```\n') },
          { label: '•', title: '列表', action: () => handleInsertFormat('\n- ', '\n') },
          { label: '❝', title: '引用', action: () => handleInsertFormat('\n> ', '\n') },
          { label: '―', title: '分割线', action: () => handleInsertFormat('\n---\n', '') },
        ].map(btn => (
          <button key={btn.title} title={btn.title} onClick={btn.action}
            style={{ background: 'transparent', border: 'none', color: COLORS.textMuted, cursor: 'pointer', padding: '4px 8px', borderRadius: 4, fontSize: 13, fontWeight: 600, minWidth: 28, textAlign: 'center' as const, transition: 'all 0.15s' }}
            onMouseEnter={e => { e.currentTarget.style.background = COLORS.hoverBg; e.currentTarget.style.color = COLORS.accent }}
            onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = COLORS.textMuted }}>
            {btn.label}
          </button>
        ))}
      </div>
      {/* Main Content */}
      <div ref={containerRef} style={{ flex: 1, display: 'flex', overflow: 'hidden' }}>
        {/* Editor */}
        <div style={{ width: `${splitRatio * 100}%`, display: 'flex', flexDirection: 'column', borderRight: `1px solid ${COLORS.border}`, minWidth: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', padding: '6px 12px', background: COLORS.editorBg, borderBottom: `1px solid ${COLORS.border}`, flexShrink: 0 }}>
            <span style={{ color: COLORS.textMuted, fontSize: 11, textTransform: 'uppercase' as const, letterSpacing: 1 }}>编辑器</span>
          </div>
          <div style={{ flex: 1, display: 'flex', overflow: 'hidden', background: COLORS.editorBg }}>
            <div style={{ padding: '12px 0', background: COLORS.editorBg, textAlign: 'right', userSelect: 'none', overflow: 'hidden', flexShrink: 0 }}>
              {lineNumbers.map(n => (
                <div key={n} style={{ padding: '0 12px 0 16px', fontSize: 12, lineHeight: '21px', color: '#3b4048', fontFamily: "'SF Mono','Fira Code',monospace" }}>{n}</div>
              ))}
            </div>
            <textarea
              ref={textareaRef}
              value={markdown}
              onChange={e => setMarkdown(e.target.value)}
              onKeyDown={handleKeyDown}
              style={{ flex: 1, background: 'transparent', color: COLORS.text, border: 'none', outline: 'none', resize: 'none', padding: '12px 16px', fontSize: 13, lineHeight: '21px', fontFamily: "'SF Mono','Fira Code',monospace", tabSize: 2, whiteSpace: 'pre', overflow: 'auto' }}
              spellCheck={false}
              placeholder="在此输入 Markdown..."
            />
          </div>
        </div>
        {/* Drag Handle */}
        <div
          onMouseDown={handleDragStart}
          style={{ width: 5, cursor: 'col-resize', background: COLORS.border, flexShrink: 0, transition: 'background 0.2s', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
          onMouseEnter={e => { e.currentTarget.style.background = COLORS.accent }}
          onMouseLeave={e => { e.currentTarget.style.background = COLORS.border }}
        >
          <div style={{ width: 2, height: 24, borderRadius: 1, background: COLORS.textMuted, opacity: 0.5 }} />
        </div>
        {/* Preview */}
        <div style={{ width: `${(1 - splitRatio) * 100}%`, display: 'flex', flexDirection: 'column', minWidth: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', padding: '6px 12px', background: COLORS.previewBg, borderBottom: `1px solid ${COLORS.border}`, flexShrink: 0 }}>
            <span style={{ color: COLORS.textMuted, fontSize: 11, textTransform: 'uppercase' as const, letterSpacing: 1 }}>预览</span>
          </div>
          <div style={{ flex: 1, overflow: 'auto', background: COLORS.previewBg }}>
            <div className="md-preview" dangerouslySetInnerHTML={{ __html: highlightedHtml }} />
          </div>
        </div>
      </div>
    </div>
  )
}
