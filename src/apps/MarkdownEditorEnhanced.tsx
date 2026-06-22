import { useState, useCallback, useRef, useEffect } from 'react'

export default function MarkdownEditorEnhanced() {
  const [markdown, setMarkdown] = useState('')
  const [preview, setPreview] = useState('')
  const [viewMode, setViewMode] = useState<'split' | 'edit' | 'preview'>('split')
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  // Simple markdown to HTML converter
  const parseMarkdown = useCallback((text: string): string => {
    let html = text
    
    // Headers
    html = html.replace(/^### (.*$)/gim, '<h3>$1</h3>')
    html = html.replace(/^## (.*$)/gim, '<h2>$1</h2>')
    html = html.replace(/^# (.*$)/gim, '<h1>$1</h1>')
    
    // Bold and italic
    html = html.replace(/\*\*\*(.*?)\*\*\*/gim, '<strong><em>$1</em></strong>')
    html = html.replace(/\*\*(.*?)\*\*/gim, '<strong>$1</strong>')
    html = html.replace(/\*(.*?)\*/gim, '<em>$1</em>')
    
    // Code blocks
    html = html.replace(/```(\w+)?\n([\s\S]*?)```/gim, '<pre><code class="language-$1">$2</code></pre>')
    html = html.replace(/`(.*?)`/gim, '<code>$1</code>')
    
    // Links
    html = html.replace(/\[([^\]]+)\]\(([^\)]+)\)/gim, '<a href="$2" target="_blank">$1</a>')
    
    // Images
    html = html.replace(/!\[([^\]]+)\]\(([^\)]+)\)/gim, '<img src="$2" alt="$1" style="max-width:100%">')
    
    // Lists
    html = html.replace(/^\s*[-]\s+(.*$)/gim, '<li>$1</li>')
    html = html.replace(/(<li>.*<\/li>)/s, '<ul>$1</ul>')
    
    // Ordered lists
    html = html.replace(/^\s*\d+\.\s+(.*$)/gim, '<li>$1</li>')
    
    // Blockquotes
    html = html.replace(/^>\s+(.*$)/gim, '<blockquote>$1</blockquote>')
    
    // Horizontal rule
    html = html.replace(/^---$/gim, '<hr>')
    
    // Paragraphs
    html = html.replace(/\n\n/gim, '</p><p>')
    html = '<p>' + html + '</p>'
    
    // Clean up empty paragraphs
    html = html.replace(/<p><\/p>/gim, '')
    html = html.replace(/<p>(<h[1-6]>)/gim, '$1')
    html = html.replace(/(<\/h[1-6]>)<\/p>/gim, '$1')
    
    return html
  }, [])

  useEffect(() => {
    setPreview(parseMarkdown(markdown))
  }, [markdown, parseMarkdown])

  const insertTemplate = useCallback((template: string) => {
    const textarea = textareaRef.current
    if (!textarea) return
    
    const start = textarea.selectionStart
    const end = textarea.selectionEnd
    const text = markdown.substring(0, start) + template + markdown.substring(end)
    setMarkdown(text)
    
    // Reset cursor position
    setTimeout(() => {
      textarea.focus()
      textarea.selectionStart = textarea.selectionEnd = start + template.length
    }, 0)
  }, [markdown])

  const templates = [
    { label: '标题', template: '# ' },
    { label: '粗体', template: '**粗体文本**' },
    { label: '斜体', template: '*斜体文本*' },
    { label: '链接', template: '[链接文本](https://example.com)' },
    { label: '图片', template: '![图片描述](图片URL)' },
    { label: '代码', template: '`代码`' },
    { label: '代码块', template: '```javascript\n代码内容\n```' },
    { label: '列表', template: '- 列表项\n- 列表项\n- 列表项' },
    { label: '引用', template: '> 引用内容' },
    { label: '分割线', template: '\n---\n' },
  ]

  const exportHTML = useCallback(() => {
    const fullHTML = `<!DOCTYPE html>
<html lang="zh-CN">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Markdown Export</title>
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 800px; margin: 40px auto; padding: 20px; line-height: 1.6; color: #333; }
    h1, h2, h3 { margin-top: 24px; margin-bottom: 16px; }
    h1 { font-size: 2em; border-bottom: 1px solid #eee; }
    h2 { font-size: 1.5em; border-bottom: 1px solid #eee; }
    h3 { font-size: 1.25em; }
    code { background: #f4f4f4; padding: 2px 6px; border-radius: 3px; font-family: monospace; }
    pre { background: #f4f4f4; padding: 16px; border-radius: 6px; overflow-x: auto; }
    pre code { background: none; padding: 0; }
    blockquote { border-left: 4px solid #ddd; margin: 0; padding-left: 16px; color: #666; }
    a { color: #0366d6; }
    img { max-width: 100%; }
    ul, ol { padding-left: 2em; }
    li { margin: 4px 0; }
    hr { border: none; border-top: 1px solid #eee; margin: 24px 0; }
  </style>
</head>
<body>
${preview}
</body>
</html>`
    
    const blob = new Blob([fullHTML], { type: 'text/html' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = 'markdown-export.html'
    a.click()
    URL.revokeObjectURL(url)
  }, [preview])

  const exportMarkdown = useCallback(() => {
    const blob = new Blob([markdown], { type: 'text/markdown' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = 'document.md'
    a.click()
    URL.revokeObjectURL(url)
  }, [markdown])

  const loadSample = useCallback(() => {
    const sample = `# WebLinuxOS Markdown 编辑器

这是一个功能强大的 **Markdown 编辑器**，支持实时预览。

## 功能特点

- 实时预览
- 快捷模板插入
- 导出 HTML 和 Markdown
- 多种视图模式

### 代码示例

\`\`\`javascript
function hello() {
  console.log('Hello, WebLinuxOS!');
}
\`\`\`

## 链接和图片

访问 [GitHub](https://github.com/saya-ch/WebLinuxOS) 查看项目。

> 提示：点击工具栏按钮快速插入 Markdown 格式。

---

*感谢使用 WebLinuxOS！*`
    setMarkdown(sample)
  }, [])

  return (
    <div className="app-container" style={{ 
      background: '#1e1e1e', 
      color: '#fff', 
      display: 'flex', 
      flexDirection: 'column',
      height: '100%',
    }}>
      {/* Toolbar */}
      <div style={{ 
        display: 'flex', 
        gap: 8, 
        padding: '8px 12px',
        background: '#252526',
        borderBottom: '1px solid #333',
        alignItems: 'center',
        flexWrap: 'wrap',
      }}>
        {/* View mode */}
        <div style={{ display: 'flex', gap: 4 }}>
          <button
            onClick={() => setViewMode('edit')}
            style={{
              padding: '6px 12px',
              background: viewMode === 'edit' ? '#0078d4' : '#2d2d2d',
              border: 'none',
              borderRadius: 4,
              color: '#fff',
              fontSize: 12,
              cursor: 'pointer',
            }}
          >
            编辑
          </button>
          <button
            onClick={() => setViewMode('split')}
            style={{
              padding: '6px 12px',
              background: viewMode === 'split' ? '#0078d4' : '#2d2d2d',
              border: 'none',
              borderRadius: 4,
              color: '#fff',
              fontSize: 12,
              cursor: 'pointer',
            }}
          >
            分屏
          </button>
          <button
            onClick={() => setViewMode('preview')}
            style={{
              padding: '6px 12px',
              background: viewMode === 'preview' ? '#0078d4' : '#2d2d2d',
              border: 'none',
              borderRadius: 4,
              color: '#fff',
              fontSize: 12,
              cursor: 'pointer',
            }}
          >
            预览
          </button>
        </div>

        <span style={{ width: 1, height: 20, background: '#444', margin: '0 8px' }} />

        {/* Templates */}
        {templates.slice(0, 6).map((t) => (
          <button
            key={t.label}
            onClick={() => insertTemplate(t.template)}
            style={{
              padding: '6px 10px',
              background: '#2d2d2d',
              border: '1px solid #444',
              borderRadius: 4,
              color: '#fff',
              fontSize: 12,
              cursor: 'pointer',
            }}
          >
            {t.label}
          </button>
        ))}

        <span style={{ width: 1, height: 20, background: '#444', margin: '0 8px' }} />

        {/* Export */}
        <button
          onClick={exportMarkdown}
          disabled={!markdown}
          style={{
            padding: '6px 12px',
            background: markdown ? '#27ae60' : '#333',
            border: 'none',
            borderRadius: 4,
            color: '#fff',
            fontSize: 12,
            cursor: markdown ? 'pointer' : 'not-allowed',
          }}
        >
          导出 .md
        </button>
        <button
          onClick={exportHTML}
          disabled={!markdown}
          style={{
            padding: '6px 12px',
            background: markdown ? '#e67e22' : '#333',
            border: 'none',
            borderRadius: 4,
            color: '#fff',
            fontSize: 12,
            cursor: markdown ? 'pointer' : 'not-allowed',
          }}
        >
          导出 HTML
        </button>
        <button
          onClick={loadSample}
          style={{
            padding: '6px 12px',
            background: '#2d2d2d',
            border: '1px solid #444',
            borderRadius: 4,
            color: '#fff',
            fontSize: 12,
            cursor: 'pointer',
          }}
        >
          示例
        </button>
      </div>

      {/* Content */}
      <div style={{ 
        display: 'flex', 
        flex: 1, 
        overflow: 'hidden',
        ...(viewMode === 'edit' ? { flexDirection: 'column' } : {}),
        ...(viewMode === 'preview' ? { flexDirection: 'column' } : {}),
      }}>
        {/* Editor */}
        {(viewMode === 'edit' || viewMode === 'split') && (
          <div style={{ 
            flex: viewMode === 'split' ? 1 : undefined,
            height: viewMode === 'edit' ? '100%' : undefined,
            display: 'flex',
            flexDirection: 'column',
          }}>
            <textarea
              ref={textareaRef}
              value={markdown}
              onChange={(e) => setMarkdown(e.target.value)}
              placeholder="输入 Markdown 内容..."
              style={{
                flex: 1,
                padding: 16,
                background: '#1e1e1e',
                border: 'none',
                color: '#d4d4d4',
                fontSize: 14,
                fontFamily: '"Fira Code", "Cascadia Code", Consolas, monospace',
                lineHeight: 1.6,
                resize: 'none',
                outline: 'none',
              }}
              spellCheck={false}
            />
          </div>
        )}

        {/* Preview */}
        {(viewMode === 'preview' || viewMode === 'split') && (
          <div style={{ 
            flex: viewMode === 'split' ? 1 : undefined,
            height: viewMode === 'preview' ? '100%' : undefined,
            background: '#252526',
            borderLeft: viewMode === 'split' ? '1px solid #333' : 'none',
            overflow: 'auto',
            padding: 16,
          }}>
            <div
              className="markdown-preview"
              style={{
                color: '#d4d4d4',
                fontSize: 14,
                lineHeight: 1.6,
              }}
              dangerouslySetInnerHTML={{ __html: preview }}
            />
            {!markdown && (
              <div style={{ color: '#666', textAlign: 'center', padding: 40 }}>
                输入 Markdown 内容以查看预览
              </div>
            )}
          </div>
        )}
      </div>

      {/* Status bar */}
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        padding: '6px 12px',
        background: '#007acc',
        color: '#fff',
        fontSize: 11,
      }}>
        <span>Markdown</span>
        <span>{markdown.length} 字符 | {markdown.split('\n').length} 行</span>
      </div>

      {/* Markdown preview styles */}
      <style>{`
        .markdown-preview h1 { font-size: 28px; margin: 16px 0; border-bottom: 1px solid #444; }
        .markdown-preview h2 { font-size: 24px; margin: 14px 0; border-bottom: 1px solid #444; }
        .markdown-preview h3 { font-size: 20px; margin: 12px 0; }
        .markdown-preview p { margin: 8px 0; }
        .markdown-preview code { background: #2d2d2d; padding: 2px 6px; border-radius: 3px; color: #ce9178; }
        .markdown-preview pre { background: #2d2d2d; padding: 12px; border-radius: 6px; overflow-x: auto; }
        .markdown-preview pre code { background: none; padding: 0; }
        .markdown-preview blockquote { border-left: 4px solid #6c5ce7; padding-left: 12px; color: #888; margin: 8px 0; }
        .markdown-preview a { color: #6c5ce7; }
        .markdown-preview ul { padding-left: 24px; margin: 8px 0; }
        .markdown-preview li { margin: 4px 0; }
        .markdown-preview hr { border: none; border-top: 1px solid #444; margin: 16px 0; }
        .markdown-preview img { max-width: 100%; border-radius: 6px; }
        .markdown-preview strong { color: #fff; }
        .markdown-preview em { color: #aaa; }
      `}</style>
    </div>
  )
}