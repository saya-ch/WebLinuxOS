import { useState, useMemo, useCallback, useEffect } from 'react'
import { marked } from 'marked'
import { Copy, Download, RefreshCw, Eye, EyeOff, FileText, Palette, Check } from 'lucide-react'

interface Theme {
  id: string
  name: string
  description: string
  styles: string
}

const THEMES: Theme[] = [
  {
    id: 'github',
    name: 'GitHub',
    description: '经典Markdown风格',
    styles: `
body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Helvetica, Arial, sans-serif; line-height: 1.6; color: #24292f; max-width: 980px; margin: 0 auto; padding: 45px; }
h1 { border-bottom: 1px solid #d0d7de; padding-bottom: 0.3em; font-size: 2em; }
h2 { border-bottom: 1px solid #d0d7de; padding-bottom: 0.3em; font-size: 1.5em; }
h3 { font-size: 1.25em; }
a { color: #0969da; }
code { background: rgba(175,184,193,0.2); padding: 0.2em 0.4em; border-radius: 6px; font-size: 85%; }
pre { background: #f6f8fa; padding: 16px; border-radius: 6px; overflow: auto; }
pre code { background: transparent; padding: 0; }
blockquote { border-left: .25em solid #d0d7de; color: #57606a; padding: 0 1em; }
table { border-collapse: collapse; width: 100%; }
th, td { border: 1px solid #d0d7de; padding: 6px 13px; }
th { background: #f6f8fa; }
img { max-width: 100%; }
hr { background-color: #d0d7de; border: 0; height: .25em; margin: 24px 0; }
`,
  },
  {
    id: 'dark',
    name: '暗色主题',
    description: '优雅的深色背景',
    styles: `
body { font-family: 'Inter', -apple-system, sans-serif; line-height: 1.7; color: #e0e0e0; max-width: 880px; margin: 0 auto; padding: 50px; background: #1a1a2e; }
h1, h2, h3, h4 { color: #fff; font-weight: 700; }
h1 { border-bottom: 1px solid #333; padding-bottom: 15px; }
a { color: #64b5f6; }
code { background: #2a2a4a; padding: 3px 8px; border-radius: 4px; font-size: 90%; }
pre { background: #0f0f1a; padding: 20px; border-radius: 8px; overflow: auto; }
pre code { background: transparent; padding: 0; }
blockquote { border-left: 4px solid #64b5f6; color: #aaa; padding: 10px 20px; background: rgba(100,181,246,0.05); margin: 20px 0; }
table { border-collapse: collapse; width: 100%; }
th, td { border: 1px solid #333; padding: 10px; }
th { background: #2a2a4a; color: #fff; }
img { max-width: 100%; border-radius: 8px; }
hr { border: none; border-top: 1px solid #333; margin: 30px 0; }
`,
  },
  {
    id: 'modern',
    name: '现代极简',
    description: '简洁的现代风格',
    styles: `
body { font-family: 'Helvetica Neue', Arial, sans-serif; line-height: 1.8; color: #333; max-width: 760px; margin: 0 auto; padding: 60px 40px; background: #fafafa; }
h1 { font-size: 2.5em; font-weight: 800; margin-bottom: 20px; letter-spacing: -0.02em; }
h2 { font-size: 1.8em; font-weight: 700; margin-top: 40px; }
h3 { font-size: 1.4em; font-weight: 600; }
p { margin: 16px 0; }
a { color: #1e88e5; text-decoration: none; border-bottom: 1px solid transparent; transition: border-bottom 0.2s; }
a:hover { border-bottom-color: #1e88e5; }
code { background: #f0f0f0; padding: 2px 6px; border-radius: 4px; font-size: 0.9em; }
pre { background: #282c34; color: #abb2bf; padding: 24px; border-radius: 12px; overflow: auto; box-shadow: 0 4px 16px rgba(0,0,0,0.1); }
pre code { background: transparent; padding: 0; color: inherit; }
blockquote { border-left: 3px solid #1e88e5; background: #fff; padding: 16px 24px; margin: 24px 0; border-radius: 0 8px 8px 0; box-shadow: 0 2px 8px rgba(0,0,0,0.04); }
img { max-width: 100%; border-radius: 8px; box-shadow: 0 4px 12px rgba(0,0,0,0.1); }
`,
  },
  {
    id: 'elegant',
    name: '优雅衬线',
    description: '传统衬线风格',
    styles: `
body { font-family: 'Georgia', 'Times New Roman', serif; line-height: 1.8; color: #2c3e50; max-width: 720px; margin: 0 auto; padding: 70px 50px; background: #fdfaf5; }
h1 { font-size: 2.2em; font-weight: 400; text-align: center; margin-bottom: 30px; letter-spacing: 0.05em; }
h2 { font-size: 1.6em; font-weight: 400; margin-top: 40px; color: #1a252f; }
h3 { font-size: 1.3em; font-style: italic; }
a { color: #8e44ad; text-decoration: none; }
a:hover { text-decoration: underline; }
code { background: #f5f0eb; padding: 2px 8px; border-radius: 3px; font-size: 0.9em; }
pre { background: #2c3e50; color: #ecf0f1; padding: 20px; border-radius: 4px; overflow: auto; }
pre code { background: transparent; color: inherit; padding: 0; }
blockquote { border-left: 3px double #8e44ad; margin: 24px 0; padding: 10px 20px; font-style: italic; color: #555; }
img { max-width: 100%; }
`,
  },
  {
    id: 'blue',
    name: '商务蓝',
    description: '专业商务风格',
    styles: `
body { font-family: 'Segoe UI', system-ui, sans-serif; line-height: 1.7; color: #1a2a3a; max-width: 820px; margin: 0 auto; padding: 50px 40px; background: #ffffff; }
h1 { font-size: 2.2em; font-weight: 700; color: #0d47a1; padding-bottom: 12px; border-bottom: 3px solid #0d47a1; display: inline-block; }
h2 { font-size: 1.6em; font-weight: 600; color: #1565c0; margin-top: 36px; }
h3 { font-size: 1.3em; color: #1976d2; }
a { color: #0d47a1; }
a:hover { color: #1565c0; }
code { background: #e3f2fd; color: #0d47a1; padding: 2px 8px; border-radius: 4px; font-size: 0.9em; }
pre { background: #263238; color: #eceff1; padding: 20px; border-radius: 8px; overflow: auto; }
pre code { background: transparent; color: inherit; padding: 0; }
blockquote { border-left: 4px solid #0d47a1; background: #e3f2fd; padding: 16px 20px; margin: 24px 0; border-radius: 0 8px 8px 0; }
blockquote p { margin: 0; }
img { max-width: 100%; border-radius: 6px; }
table { border-collapse: collapse; width: 100%; margin: 24px 0; }
th { background: #0d47a1; color: white; padding: 10px 14px; text-align: left; }
td { border: 1px solid #cfd8dc; padding: 10px 14px; }
`,
  },
]

const DEFAULT_MD = `# Markdown 转 HTML 生成器

欢迎使用 **Markdown 转 HTML 生成器**！这是一个功能强大的在线工具，可以将您的 Markdown 内容转换为独立的 HTML 文件。

## 主要功能

- **实时预览**：边写边看，即时效果
- **多种主题**：5 种精美主题供选择
- **代码高亮**：代码块自动格式化
- **独立导出**：生成包含所有样式的完整 HTML 文件

## 代码示例

\`\`\`javascript
function greet(name) {
  return \`Hello, \${name}!\`;
}

console.log(greet('WebLinuxOS'));
// 输出: Hello, WebLinuxOS!
\`\`\`

## 表格支持

| 功能 | 状态 | 说明 |
|------|------|------|
| 实时预览 | ✓ | 即时渲染 |
| 主题切换 | ✓ | 5种主题 |
| 文件导出 | ✓ | 独立HTML |

## 引用

> 这是一个非常实用的工具，让 Markdown 到 HTML 的转换变得轻松愉快。

## 列表

1. 第一点
2. 第二点
   - 子项 A
   - 子项 B
3. 第三点

---

开始使用吧！`

export default function MarkdownToHTML() {
  const [markdown, setMarkdown] = useState(DEFAULT_MD)
  const [themeId, setThemeId] = useState('github')
  const [showPreview, setShowPreview] = useState(true)
  const [copied, setCopied] = useState(false)
  const [title, setTitle] = useState('WebLinuxOS Document')

  const currentTheme = useMemo(() => THEMES.find(t => t.id === themeId) || THEMES[0], [themeId])

  const htmlContent = useMemo(() => {
    try {
      return marked.parse(markdown, { async: false }) as string
    } catch {
      return '<p>解析错误</p>'
    }
  }, [markdown])

  const fullHTML = useMemo(() => {
    return `<!DOCTYPE html>
<html lang="zh-CN">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${title}</title>
  <style>
    * { box-sizing: border-box; }
    ${currentTheme.styles}
  </style>
</head>
<body>
${htmlContent}
</body>
</html>`
  }, [htmlContent, currentTheme, title])

  const copyToClipboard = useCallback(async (text: string) => {
    try {
      await navigator.clipboard.writeText(text)
      setCopied(true)
      setTimeout(() => setCopied(false), 1500)
    } catch {}
  }, [])

  const downloadHTML = useCallback(() => {
    const blob = new Blob([fullHTML], { type: 'text/html' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `${title || 'document'}.html`
    a.click()
    URL.revokeObjectURL(url)
  }, [fullHTML, title])

  const loadSample = useCallback(() => {
    setMarkdown(DEFAULT_MD)
  }, [])

  useEffect(() => {
    try {
      const saved = localStorage.getItem('md-html-content')
      if (saved) setMarkdown(saved)
      const savedTitle = localStorage.getItem('md-html-title')
      if (savedTitle) setTitle(savedTitle)
      const savedTheme = localStorage.getItem('md-html-theme')
      if (savedTheme && THEMES.find(t => t.id === savedTheme)) setThemeId(savedTheme)
    } catch {}
  }, [])

  useEffect(() => {
    try {
      localStorage.setItem('md-html-content', markdown)
      localStorage.setItem('md-html-title', title)
      localStorage.setItem('md-html-theme', themeId)
    } catch {}
  }, [markdown, title, themeId])

  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      height: '100%',
      background: '#0f0f1a',
      color: '#e2e8f0',
    }}>
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '10px 20px',
        background: 'rgba(255,255,255,0.03)',
        borderBottom: '1px solid rgba(255,255,255,0.08)',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <FileText size={18} color="#64b5f6" />
          <span style={{ fontSize: 14, fontWeight: 600 }}>Markdown 转 HTML 生成器</span>
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="文档标题"
            style={{
              background: 'rgba(255,255,255,0.06)',
              border: '1px solid rgba(255,255,255,0.1)',
              borderRadius: 6,
              padding: '5px 12px',
              color: '#e2e8f0',
              fontSize: 12,
              width: 200,
              outline: 'none',
            }}
          />
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <Palette size={13} color="#94a3b8" />
            <div style={{ display: 'flex', gap: 4 }}>
              {THEMES.map(t => (
                <button
                  key={t.id}
                  onClick={() => setThemeId(t.id)}
                  title={t.description}
                  style={{
                    padding: '4px 10px',
                    fontSize: 11,
                    borderRadius: 5,
                    border: themeId === t.id ? '1px solid #64b5f6' : '1px solid rgba(255,255,255,0.1)',
                    background: themeId === t.id ? 'rgba(100,181,246,0.15)' : 'transparent',
                    color: themeId === t.id ? '#64b5f6' : '#94a3b8',
                    cursor: 'pointer',
                    transition: 'all 0.2s',
                  }}
                >
                  {t.name}
                </button>
              ))}
            </div>
          </div>
          <div style={{ width: 1, background: 'rgba(255,255,255,0.1)' }} />
          <button
            onClick={loadSample}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 5,
              padding: '5px 10px',
              fontSize: 11,
              borderRadius: 5,
              border: '1px solid rgba(255,255,255,0.1)',
              background: 'transparent',
              color: '#94a3b8',
              cursor: 'pointer',
            }}
          >
            <RefreshCw size={12} /> 示例
          </button>
          <button
            onClick={() => setShowPreview(!showPreview)}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 5,
              padding: '5px 10px',
              fontSize: 11,
              borderRadius: 5,
              border: '1px solid rgba(255,255,255,0.1)',
              background: 'transparent',
              color: '#94a3b8',
              cursor: 'pointer',
            }}
          >
            {showPreview ? <EyeOff size={12} /> : <Eye size={12} />}
            {showPreview ? '隐藏预览' : '显示预览'}
          </button>
          <button
            onClick={() => copyToClipboard(fullHTML)}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 5,
              padding: '5px 10px',
              fontSize: 11,
              borderRadius: 5,
              border: '1px solid rgba(100,181,246,0.3)',
              background: 'transparent',
              color: '#64b5f6',
              cursor: 'pointer',
            }}
          >
            {copied ? <Check size={12} color="#22c55e" /> : <Copy size={12} />}
            {copied ? '已复制' : '复制HTML'}
          </button>
          <button
            onClick={downloadHTML}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 5,
              padding: '5px 14px',
              fontSize: 12,
              borderRadius: 5,
              border: 'none',
              background: 'linear-gradient(135deg, #1976d2, #2196f3)',
              color: 'white',
              cursor: 'pointer',
              fontWeight: 600,
            }}
          >
            <Download size={13} /> 下载 HTML
          </button>
        </div>
      </div>

      <div style={{ flex: 1, display: 'flex', overflow: 'hidden' }}>
        <div style={{
          width: showPreview ? '50%' : '100%',
          display: 'flex',
          flexDirection: 'column',
          borderRight: showPreview ? '1px solid rgba(255,255,255,0.08)' : 'none',
        }}>
          <div style={{
            padding: '6px 20px',
            background: 'rgba(255,255,255,0.02)',
            borderBottom: '1px solid rgba(255,255,255,0.05)',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
          }}>
            <span style={{ fontSize: 11, color: '#94a3b8' }}>Markdown 编辑</span>
            <span style={{ fontSize: 10, color: '#64748b' }}>{markdown.length} 字符</span>
          </div>
          <textarea
            value={markdown}
            onChange={(e) => setMarkdown(e.target.value)}
            spellCheck={false}
            style={{
              flex: 1,
              padding: '16px 20px',
              background: 'rgba(0,0,0,0.3)',
              color: '#e2e8f0',
              border: 'none',
              outline: 'none',
              resize: 'none',
              fontSize: 13,
              lineHeight: 1.7,
              fontFamily: "'JetBrains Mono', 'Fira Code', monospace",
            }}
            placeholder="在此输入 Markdown 内容..."
          />
        </div>

        {showPreview && (
          <div style={{ width: '50%', display: 'flex', flexDirection: 'column' }}>
            <div style={{
              padding: '6px 20px',
              background: 'rgba(255,255,255,0.02)',
              borderBottom: '1px solid rgba(255,255,255,0.05)',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
            }}>
              <span style={{ fontSize: 11, color: '#94a3b8' }}>HTML 预览 ({currentTheme.name} 主题)</span>
              <button
                onClick={() => copyToClipboard(htmlContent)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 4,
                  padding: '3px 8px',
                  fontSize: 10,
                  borderRadius: 4,
                  border: '1px solid rgba(255,255,255,0.1)',
                  background: 'transparent',
                  color: '#94a3b8',
                  cursor: 'pointer',
                }}
              >
                <Copy size={10} /> 复制
              </button>
            </div>
            <div style={{
              flex: 1,
              overflow: 'auto',
              background: '#fff',
            }}>
              <div style={
                currentTheme.id === 'dark'
                  ? { background: '#1a1a2e' }
                  : {}
              }>
                <div
                  style={{
                    minHeight: '100%',
                    ...(currentTheme.id === 'dark' ? { background: '#1a1a2e', color: '#e0e0e0' } : {}),
                  }}
                  dangerouslySetInnerHTML={{ __html: htmlContent }}
                />
              </div>
            </div>
          </div>
        )}
      </div>

      <style>{`
        ::-webkit-scrollbar { width: 6px; height: 6px; }
        ::-webkit-scrollbar-track { background: transparent; }
        ::-webkit-scrollbar-thumb { background: rgba(255,255,255,0.15); border-radius: 3px; }
        ::-webkit-scrollbar-thumb:hover { background: rgba(255,255,255,0.25); }
      `}</style>
    </div>
  )
}
