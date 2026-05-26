import { useState } from 'react'

const MarkdownPreviewer = () => {
  const [markdown, setMarkdown] = useState(
    '# 欢迎使用 Markdown 预览器\n\n这是一个实时 Markdown 编辑器和预览器！\n\n## 功能特点\n\n- **实时预览**: 编辑时即时渲染\n- **语法高亮**: 支持代码块\n- **现代化设计**: 美观的界面\n\n### 代码示例\n\n```javascript\nfunction hello() {\n  console.log("Hello, WebLinux!");\n}\n```\n\n### 列表\n\n1. 第一项\n2. 第二项\n3. 第三项\n\n> 这是一个引用块\n\n[访问 GitHub](https://github.com)\n\n| 列1 | 列2 | 列3 |\n|-----|-----|-----|\n| A   | B   | C   |\n| D   | E   | F   |\n'
  )

  const renderMarkdown = (text: string) => {
    return text
      // Headers
      .replace(/^### (.*$)/gm, '<h3>$1</h3>')
      .replace(/^## (.*$)/gm, '<h2>$1</h2>')
      .replace(/^# (.*$)/gm, '<h1>$1</h1>')
      // Bold & Italic
      .replace(/\*\*\*(.*?)\*\*\*/g, '<strong><em>$1</em></strong>')
      .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
      .replace(/\*(.*?)\*/g, '<em>$1</em>')
      // Code blocks
      .replace(/```([\s\S]*?)```/g, (_match: string, code: string) => {
        return `<pre><code>${code.trim()}</code></pre>`
      })
      // Inline code
      .replace(/`([^`]+)`/g, '<code>$1</code>')
      // Links
      .replace(/\[([^\]]+)\]\(([^\)]+)\)/g, '<a href="$2" target="_blank" rel="noopener noreferrer">$1</a>')
      // Blockquotes
      .replace(/^> (.*$)/gm, '<blockquote>$1</blockquote>')
      // Lists
      .replace(/^- (.*$)/gm, '<li>$1</li>')
      .replace(/^\d+\. (.*$)/gm, '<li>$1</li>')
      // Tables
      .replace(/^\|(.*)\|$/gm, (_match: string, content: string) => {
        const cells = content.split('|').map((c: string) => c.trim())
        return `<tr>${cells.map((cell: string) => `<td>${cell}</td>`).join('')}</tr>`
      })
      // Horizontal rule
      .replace(/^---$/gm, '<hr>')
      // Paragraphs
      .replace(/^(?!<[h|p|b|i|a|pre|blockquote|ul|ol|tr])(.*)$/gm, '<p>$1</p>')
      // Line breaks
      .replace(/\n/g, '<br>')
  }

  return (
    <div
      style={{
        background: 'linear-gradient(180deg, #1a1a2e 0%, #16213e 100%)',
        padding: 16,
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        gap: 16,
      }}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <h3 style={{ color: '#fff', margin: 0, fontSize: 20, fontWeight: 600 }}>
          📝 Markdown 预览器
        </h3>
      </div>

      <div
        style={{
          flex: 1,
          display: 'flex',
          gap: 16,
          minHeight: 0,
        }}
      >
        <div
          style={{
            flex: 1,
            display: 'flex',
            flexDirection: 'column',
            gap: 8,
          }}
        >
          <div
            style={{
              color: '#9090a0',
              fontSize: 13,
              fontWeight: 600,
              textTransform: 'uppercase' as const,
              letterSpacing: '0.5px',
            }}
          >
            编辑器
          </div>
          <textarea
            value={markdown}
            onChange={(e) => setMarkdown(e.target.value)}
            style={{
              flex: 1,
              background: 'linear-gradient(145deg, #0f0f1a, #0a0a12)',
              color: '#fff',
              border: '1px solid rgba(255,255,255,0.1)',
              borderRadius: 12,
              padding: 16,
              fontSize: 14,
              lineHeight: 1.6,
              resize: 'none',
              outline: 'none',
              boxShadow: 'inset 0 2px 8px rgba(0,0,0,0.2)',
            }}
          />
        </div>

        <div
          style={{
            flex: 1,
            display: 'flex',
            flexDirection: 'column',
            gap: 8,
          }}
        >
          <div
            style={{
              color: '#9090a0',
              fontSize: 13,
              fontWeight: 600,
              textTransform: 'uppercase' as const,
              letterSpacing: '0.5px',
            }}
          >
            预览
          </div>
          <div
            style={{
              flex: 1,
              background: 'linear-gradient(145deg, #1f1f2f, #1a1a2a)',
              color: '#e0e0f0',
              border: '1px solid rgba(255,255,255,0.1)',
              borderRadius: 12,
              padding: 16,
              overflow: 'auto',
              boxShadow: 'inset 0 2px 8px rgba(0,0,0,0.2)',
            }}
            dangerouslySetInnerHTML={{ __html: renderMarkdown(markdown) }}
          />
        </div>
      </div>

      <style>{`
        h1, h2, h3 { margin: 0.8em 0 0.3em 0; }
        h1 { font-size: 28px; color: #60a5fa; }
        h2 { font-size: 22px; color: #a78bfa; }
        h3 { font-size: 18px; color: #f472b6; }
        p { margin: 0.5em 0; line-height: 1.6; }
        ul, ol { padding-left: 2em; margin: 0.5em 0; }
        blockquote {
          border-left: 4px solid #60a5fa;
          padding-left: 1em;
          margin: 0.8em 0;
          color: #9090a0;
        }
        code {
          background: rgba(96, 165, 250, 0.1);
          padding: 2px 6px;
          border-radius: 4px;
          font-family: monospace;
        }
        pre {
          background: rgba(0, 0, 0, 0.3);
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
          border: 1px solid rgba(255,255,255,0.1);
          padding: 8px 12px;
          text-align: left;
        }
        a {
          color: #60a5fa;
          text-decoration: none;
        }
        a:hover {
          text-decoration: underline;
        }
      `}</style>
    </div>
  )
}

export default MarkdownPreviewer
