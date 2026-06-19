import { useState, useMemo, useRef, useEffect } from 'react'
import { marked } from 'marked'

marked.setOptions({
  gfm: true,
  breaks: true,
})

const SAMPLE_MD = `# 欢迎使用 Markdown 编辑器 Pro

这是一个功能齐全的 **Markdown** 编辑器，支持实时预览、导出和保存。

## ✨ 主要功能

- ✅ 实时预览（左侧编辑，右侧渲染）
- ✅ 工具栏快捷操作
- ✅ 字数统计与阅读时间估算
- ✅ 亮色/暗色主题切换
- ✅ 导出 HTML / 纯文本 Markdown
- ✅ 保存为虚拟文件

## 📝 语法示例

### 列表

1. 有序项 A
2. 有序项 B
   - 嵌套无序

### 引用

> 代码即诗歌，结构即思想。
> —— 佚名

### 代码块

\`\`\`javascript
function greet(name) {
  console.log('Hello, ' + name + '!')
}
greet('WebLinuxOS')
\`\`\`

### 表格

| 功能 | 状态 | 说明 |
| --- | --- | --- |
| 预览 | ✅ | 实时 |
| 导出 | ✅ | HTML / MD |
| 主题 | ✅ | 亮色/暗色 |

### 链接与图片

[访问示例站点](https://example.com)

### 分割线

---

> 💡 **提示**：点击右上角按钮切换主题，或保存为虚拟文件以在文件管理器中查看。
`

const MarkdownEditorPro: React.FC = () => {
  const [markdown, setMarkdown] = useState<string>(SAMPLE_MD)
  const [theme, setTheme] = useState<'light' | 'dark'>('dark')
  const [fileName, setFileName] = useState<string>('untitled.md')
  const [saveMsg, setSaveMsg] = useState<string>('')
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  useEffect(() => {
    if (saveMsg) {
      const id = setTimeout(() => setSaveMsg(''), 2500)
      return () => clearTimeout(id)
    }
  }, [saveMsg])

  const html = useMemo(() => {
    try {
      return (marked.parse(markdown) as string) || ''
    } catch {
      return '<p style="color:#ef4444">解析错误</p>'
    }
  }, [markdown])

  const stats = useMemo(() => {
    const chars = markdown.length
    const chineseMatch = markdown.match(/[\u4e00-\u9fa5\u3400-\u4dbf]/g) || []
    const chineseCount = chineseMatch.length
    const words = markdown
      .replace(/[\u4e00-\u9fa5\u3400-\u4dbf]/g, ' ')
      .split(/\s+/)
      .filter(Boolean).length
    const lines = markdown.split('\n').length
    const readMinutes = Math.max(1, Math.ceil(chineseCount / 300 + words / 200))
    return { chars, chineseCount, words, lines, readMinutes }
  }, [markdown])

  const wrapSelection = (prefix: string, suffix: string = prefix, placeholder: string = '') => {
    const ta = textareaRef.current
    if (!ta) return
    const start = ta.selectionStart
    const end = ta.selectionEnd
    const selected = markdown.slice(start, end) || placeholder
    const newText = markdown.slice(0, start) + prefix + selected + suffix + markdown.slice(end)
    setMarkdown(newText)
    requestAnimationFrame(() => {
      ta.focus()
      const pos = start + prefix.length
      ta.setSelectionRange(pos, pos + selected.length)
    })
  }

  const insertAtLineStart = (prefix: string) => {
    const ta = textareaRef.current
    if (!ta) return
    const start = ta.selectionStart
    const lineStart = markdown.lastIndexOf('\n', start - 1) + 1
    const newText = markdown.slice(0, lineStart) + prefix + markdown.slice(lineStart)
    setMarkdown(newText)
    requestAnimationFrame(() => {
      ta.focus()
      const pos = start + prefix.length
      ta.setSelectionRange(pos, pos)
    })
  }

  const downloadFile = (content: string, name: string, mime: string) => {
    const blob = new Blob([content], { type: mime })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = name
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    setTimeout(() => URL.revokeObjectURL(url), 1000)
  }

  const exportHTML = () => {
    const title = fileName.replace(/\.md$/i, '') || 'Document'
    const fullHTML = `<!DOCTYPE html>
<html lang="zh-CN">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${title}</title>
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'PingFang SC', 'Hiragino Sans GB', 'Microsoft YaHei', sans-serif; max-width: 820px; margin: 0 auto; padding: 40px 24px; line-height: 1.7; color: #1f2937; background: #fff; }
    h1, h2, h3, h4, h5, h6 { margin-top: 1.5em; margin-bottom: 0.5em; line-height: 1.25; }
    h1 { font-size: 2rem; border-bottom: 2px solid #e5e7eb; padding-bottom: 0.3em; }
    h2 { font-size: 1.6rem; border-bottom: 1px solid #e5e7eb; padding-bottom: 0.3em; }
    h3 { font-size: 1.3rem; }
    p { margin: 0.8em 0; }
    a { color: #2563eb; text-decoration: none; }
    a:hover { text-decoration: underline; }
    code { background: #f3f4f6; padding: 2px 6px; border-radius: 4px; font-family: 'SFMono-Regular', Consolas, monospace; font-size: 0.9em; }
    pre { background: #1f2937; color: #f9fafb; padding: 16px; border-radius: 8px; overflow-x: auto; }
    pre code { background: transparent; color: inherit; padding: 0; }
    blockquote { border-left: 4px solid #7c6cf0; background: #f5f3ff; margin: 1em 0; padding: 0.5em 1em; color: #4b5563; }
    ul, ol { padding-left: 1.5em; margin: 0.6em 0; }
    li { margin: 0.3em 0; }
    table { border-collapse: collapse; width: 100%; margin: 1em 0; }
    th, td { border: 1px solid #e5e7eb; padding: 8px 12px; text-align: left; }
    th { background: #f9fafb; font-weight: 600; }
    hr { border: none; border-top: 1px solid #e5e7eb; margin: 2em 0; }
    img { max-width: 100%; border-radius: 8px; }
  </style>
</head>
<body>
${html}
</body>
</html>`
    downloadFile(fullHTML, fileName.replace(/\.md$/i, '') + '.html', 'text/html;charset=utf-8')
  }

  const exportMarkdown = () => {
    downloadFile(markdown, fileName, 'text/markdown;charset=utf-8')
  }

  const saveToVirtual = () => {
    try {
      const win = window as unknown as { addFileToDesktop?: (name: string, content: string) => void }
      if (typeof win.addFileToDesktop === 'function') {
        win.addFileToDesktop(fileName, markdown)
      } else {
        const evt = new CustomEvent('weblinux-create-file', { detail: { name: fileName, content: markdown, type: 'text/markdown' } })
        window.dispatchEvent(evt)
      }
      setSaveMsg(`✓ 已保存为 ${fileName}`)
    } catch {
      setSaveMsg('⚠️ 保存失败')
    }
  }

  const previewStyle = theme === 'light'
    ? { color: '#1f2937', background: '#fff' }
    : { color: '#e5e7eb', background: '#111827' }

  const editorStyle = theme === 'light'
    ? { color: '#1f2937', background: '#f9fafb', caretColor: '#111' }
    : { color: '#e5e7eb', background: '#1a1a2e', caretColor: '#fff' }

  const toolBtn = {
    padding: '6px 10px',
    fontSize: 13,
    background: 'transparent',
    border: '1px solid var(--window-border)',
    color: 'var(--text-primary)',
    borderRadius: 6,
    cursor: 'pointer',
    fontFamily: 'inherit',
    transition: 'all 0.15s',
  }

  return (
    <div className="app-shell" style={{ gap: 0 }}>
      <div
        style={{
          display: 'flex',
          gap: 6,
          padding: '8px 12px',
          borderBottom: '1px solid var(--window-border)',
          flexWrap: 'wrap',
          alignItems: 'center',
          flexShrink: 0,
        }}
      >
        <input
          value={fileName}
          onChange={(e) => setFileName(e.target.value)}
          className="app-input"
          placeholder="文件名.md"
          style={{ width: 180, padding: '6px 10px', fontSize: 12 }}
        />

        <div style={{ width: 1, height: 20, background: 'var(--window-border)', margin: '0 4px' }} />

        <button onClick={() => wrapSelection('**', '**', '加粗文本')} style={toolBtn} title="加粗"><b>B</b></button>
        <button onClick={() => wrapSelection('*', '*', '斜体文本')} style={toolBtn} title="斜体"><i>I</i></button>
        <button onClick={() => wrapSelection('~~', '~~', '删除线')} style={toolBtn} title="删除线"><s>S</s></button>
        <button onClick={() => insertAtLineStart('# ')} style={toolBtn} title="标题">H1</button>
        <button onClick={() => insertAtLineStart('## ')} style={toolBtn} title="二级标题">H2</button>
        <button onClick={() => wrapSelection('[', '](https://)', '链接文本')} style={toolBtn} title="链接">🔗 链接</button>
        <button onClick={() => wrapSelection('![', '](https://)', '图片')} style={toolBtn} title="图片">🖼️ 图片</button>
        <button onClick={() => insertAtLineStart('> ')} style={toolBtn} title="引用">❝ 引用</button>
        <button onClick={() => insertAtLineStart('- ')} style={toolBtn} title="无序列表">• 列表</button>
        <button onClick={() => insertAtLineStart('1. ')} style={toolBtn} title="有序列表">1. 列表</button>
        <button onClick={() => wrapSelection('\n```\n', '\n```\n', '代码')} style={toolBtn} title="代码块">{'</>'} 代码</button>
        <button onClick={() => insertAtLineStart('\n---\n')} style={toolBtn} title="分割线">— 分割线</button>

        <div style={{ flex: 1 }} />

        <button
          onClick={() => setTheme(theme === 'light' ? 'dark' : 'light')}
          style={toolBtn}
          title="切换主题"
        >
          {theme === 'light' ? '🌙 暗色' : '☀️ 亮色'}
        </button>
        <button onClick={exportMarkdown} style={toolBtn} title="导出为 Markdown 文件">📥 导出 MD</button>
        <button onClick={exportHTML} style={toolBtn} title="导出为完整 HTML 文档">📄 导出 HTML</button>
        <button
          onClick={saveToVirtual}
          style={{ ...toolBtn, background: 'var(--accent)', color: '#fff', borderColor: 'var(--accent)' }}
          title="保存为虚拟文件"
        >
          💾 保存到桌面
        </button>

        {saveMsg && (
          <span style={{ fontSize: 12, color: '#10b981', marginLeft: 6 }}>{saveMsg}</span>
        )}
      </div>

      <div style={{ display: 'flex', gap: 0, flex: 1, minHeight: 0 }}>
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minWidth: 0, borderRight: '1px solid var(--window-border)' }}>
          <div style={{ padding: '6px 12px', fontSize: 11, color: 'var(--text-secondary)', borderBottom: '1px solid var(--window-border)', display: 'flex', justifyContent: 'space-between' }}>
            <span>📝 Markdown 源码</span>
            <span>
              {stats.chars} 字符 · {stats.words} 词 · {stats.chineseCount} 汉字 · {stats.lines} 行
            </span>
          </div>
          <textarea
            ref={textareaRef}
            value={markdown}
            onChange={(e) => setMarkdown(e.target.value)}
            spellCheck={false}
            style={{
              flex: 1,
              padding: 16,
              border: 'none',
              outline: 'none',
              resize: 'none',
              fontSize: 14,
              lineHeight: 1.7,
              fontFamily: "'JetBrains Mono', 'Fira Code', 'Source Code Pro', ui-monospace, monospace",
              ...editorStyle,
            }}
            placeholder="在这里编写 Markdown..."
          />
        </div>

        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minWidth: 0 }}>
          <div style={{ padding: '6px 12px', fontSize: 11, color: 'var(--text-secondary)', borderBottom: '1px solid var(--window-border)', display: 'flex', justifyContent: 'space-between' }}>
            <span>👁️ 实时预览</span>
            <span>⏱️ 预计阅读约 {stats.readMinutes} 分钟</span>
          </div>
          <div
            className="markdown-preview"
            style={{
              flex: 1,
              overflow: 'auto',
              padding: 24,
              ...previewStyle,
              lineHeight: 1.7,
              fontSize: 15,
            }}
            dangerouslySetInnerHTML={{ __html: html }}
          />
        </div>
      </div>

      <style>{`
        .markdown-preview h1, .markdown-preview h2, .markdown-preview h3, .markdown-preview h4, .markdown-preview h5, .markdown-preview h6 { margin-top: 1.5em; margin-bottom: 0.5em; line-height: 1.25; font-weight: 600; }
        .markdown-preview h1 { font-size: 1.9rem; border-bottom: 2px solid var(--window-border); padding-bottom: 0.3em; }
        .markdown-preview h2 { font-size: 1.5rem; border-bottom: 1px solid var(--window-border); padding-bottom: 0.3em; }
        .markdown-preview h3 { font-size: 1.25rem; }
        .markdown-preview h4 { font-size: 1.1rem; }
        .markdown-preview p { margin: 0.8em 0; }
        .markdown-preview a { color: var(--accent); text-decoration: none; }
        .markdown-preview a:hover { text-decoration: underline; }
        .markdown-preview code {
          background: ${theme === 'light' ? '#f1f5f9' : '#1f2937'};
          padding: 2px 6px;
          border-radius: 4px;
          font-family: 'JetBrains Mono', 'Fira Code', monospace;
          font-size: 0.88em;
          color: ${theme === 'light' ? '#e11d48' : '#fbbf24'};
        }
        .markdown-preview pre {
          background: ${theme === 'light' ? '#f8fafc' : '#0f172a'};
          padding: 16px;
          border-radius: 8px;
          overflow-x: auto;
          border: 1px solid var(--window-border);
        }
        .markdown-preview pre code { background: transparent; color: inherit; padding: 0; font-size: 0.88em; }
        .markdown-preview blockquote {
          border-left: 4px solid var(--accent);
          background: ${theme === 'light' ? 'rgba(124,108,240,0.08)' : 'rgba(124,108,240,0.12)'};
          margin: 1em 0;
          padding: 0.5em 1em;
          color: ${theme === 'light' ? '#4b5563' : '#a5b4fc'};
          border-radius: 0 6px 6px 0;
        }
        .markdown-preview ul, .markdown-preview ol { padding-left: 1.8em; margin: 0.6em 0; }
        .markdown-preview li { margin: 0.3em 0; }
        .markdown-preview li input[type="checkbox"] { margin-right: 0.4em; }
        .markdown-preview table { border-collapse: collapse; width: 100%; margin: 1em 0; font-size: 0.95em; }
        .markdown-preview th, .markdown-preview td { border: 1px solid var(--window-border); padding: 8px 12px; text-align: left; }
        .markdown-preview th { background: ${theme === 'light' ? '#f1f5f9' : '#1f2937'}; font-weight: 600; }
        .markdown-preview hr { border: none; border-top: 1px solid var(--window-border); margin: 2em 0; }
        .markdown-preview img { max-width: 100%; border-radius: 8px; }
        .markdown-preview strong { font-weight: 700; }
        .markdown-preview em { font-style: italic; }
        .markdown-preview del { text-decoration: line-through; opacity: 0.6; }
        .markdown-preview input[type="checkbox"] { cursor: default; }
      `}</style>
    </div>
  )
}

export default MarkdownEditorPro
