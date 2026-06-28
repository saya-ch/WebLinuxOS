import { useState, useCallback, useEffect, useRef, memo } from 'react'
import { marked } from 'marked'

interface CollaboratorSession {
  id: string
  name: string
  cursorPosition: number
  lastActive: Date
  color: string
}

interface DocumentVersion {
  id: string
  content: string
  timestamp: Date
  author: string
}

const colors = ['#FF6B6B', '#4ECDC4', '#45B7D1', '#96CEB4', '#FFEAA7', '#DDA0DD', '#98D8C8', '#F7DC6F']

const MarkdownCollaborator = memo(function MarkdownCollaborator() {
  const [content, setContent] = useState(`# WebLinuxOS 实时协作编辑器

欢迎使用实时 Markdown 协作编辑器！

## 功能特性

- **实时协作**: 支持多人同时编辑
- **语法高亮**: Markdown 语法实时渲染
- **版本历史**: 自动保存编辑历史
- **导出功能**: 支持导出为 HTML 和 PDF

## 使用方法

1. 在左侧编辑 Markdown 内容
2. 右侧实时预览渲染效果
3. 使用工具栏快速插入常用元素

## 代码示例

\`\`\`javascript
function greet(name) {
  return \`Hello, \${name}!\`
}

console.log(greet('WebLinuxOS'))
\`\`\`

## 表格示例

| 功能 | 状态 | 描述 |
|------|------|------|
| 实时编辑 | ✓ | 即时渲染 |
| 协作模式 | ✓ | 多人编辑 |
| 版本控制 | ✓ | 自动保存 |

---

*开始你的创作之旅吧！*
`)
  
  const [preview, setPreview] = useState('')
  const [sessions, setSessions] = useState<CollaboratorSession[]>([
    { id: '1', name: '用户 A', cursorPosition: 120, lastActive: new Date(), color: colors[0] },
    { id: '2', name: '用户 B', cursorPosition: 350, lastActive: new Date(), color: colors[1] },
  ])
  const [versions, setVersions] = useState<DocumentVersion[]>([])
  const [currentVersion, setCurrentVersion] = useState<string | null>(null)
  const [showHistory, setShowHistory] = useState(false)
  const [showPreview, setShowPreview] = useState(true)
  const [wordCount, setWordCount] = useState(0)
  const [lineCount, setLineCount] = useState(0)
  const textareaRef = useRef<HTMLTextAreaElement>(null)
  const [autoSaveEnabled, setAutoSaveEnabled] = useState(true)

  // 配置 marked 选项
  marked.setOptions({
    breaks: true,
    gfm: true,
  })

  // 实时渲染 Markdown
  useEffect(() => {
    const html = marked(content) as string
    setPreview(html)
    
    // 统计字数和行数
    const words = content.trim().split(/\s+/).filter(w => w.length > 0).length
    const lines = content.split('\n').length
    setWordCount(words)
    setLineCount(lines)
  }, [content])

  // 自动保存版本
  useEffect(() => {
    if (!autoSaveEnabled) return
    
    const interval = setInterval(() => {
      const newVersion: DocumentVersion = {
        id: Date.now().toString(),
        content,
        timestamp: new Date(),
        author: '当前用户'
      }
      setVersions(prev => [...prev.slice(-9), newVersion])
    }, 30000) // 每30秒自动保存
    
    return () => clearInterval(interval)
  }, [content, autoSaveEnabled])

  // 手动保存版本
  const saveVersion = useCallback(() => {
    const newVersion: DocumentVersion = {
      id: Date.now().toString(),
      content,
      timestamp: new Date(),
      author: '当前用户'
    }
    setVersions(prev => [...prev, newVersion])
    setCurrentVersion(newVersion.id)
  }, [content])

  // 恢复到某个版本
  const restoreVersion = useCallback((version: DocumentVersion) => {
    setContent(version.content)
    setShowHistory(false)
  }, [])

  // 插入 Markdown 元素
  const insertElement = useCallback((element: string) => {
    if (!textareaRef.current) return
    
    const textarea = textareaRef.current
    const start = textarea.selectionStart
    const end = textarea.selectionEnd
    const selectedText = content.substring(start, end)
    
    let insertText = ''
    let cursorOffset = 0
    
    switch (element) {
      case 'bold':
        insertText = `**${selectedText || '粗体文本'}**`
        cursorOffset = selectedText ? insertText.length : 2
        break
      case 'italic':
        insertText = `*${selectedText || '斜体文本'}*`
        cursorOffset = selectedText ? insertText.length : 1
        break
      case 'code':
        insertText = `\`${selectedText || '代码'}\``
        cursorOffset = selectedText ? insertText.length : 1
        break
      case 'codeblock':
        insertText = `\n\`\`\`javascript\n${selectedText || '// 在此编写代码'}\n\`\`\`\n`
        cursorOffset = 14
        break
      case 'link':
        insertText = `[${selectedText || '链接文本'}](url)`
        cursorOffset = selectedText ? selectedText.length + 3 : 1
        break
      case 'image':
        insertText = `![${selectedText || '图片描述'}](url)`
        cursorOffset = selectedText ? selectedText.length + 4 : 2
        break
      case 'heading':
        insertText = `\n## ${selectedText || '标题'}\n`
        cursorOffset = 4
        break
      case 'quote':
        insertText = `\n> ${selectedText || '引用内容'}\n`
        cursorOffset = 3
        break
      case 'list':
        insertText = `\n- ${selectedText || '列表项'}\n`
        cursorOffset = 3
        break
      case 'table':
        insertText = `\n| 列1 | 列2 | 列3 |\n|------|------|------|\n| 内容 | 内容 | 内容 |\n`
        cursorOffset = 3
        break
      case 'hr':
        insertText = '\n---\n'
        cursorOffset = insertText.length
        break
    }
    
    const newContent = content.substring(0, start) + insertText + content.substring(end)
    setContent(newContent)
    
    // 设置光标位置
    setTimeout(() => {
      textarea.focus()
      textarea.setSelectionRange(start + cursorOffset, start + cursorOffset)
    }, 0)
  }, [content])

  // 导出为 HTML
  const exportHTML = useCallback(() => {
    const htmlContent = `<!DOCTYPE html>
<html lang="zh-CN">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Markdown Export</title>
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 800px; margin: 40px auto; padding: 20px; line-height: 1.6; color: #333; }
    h1, h2, h3 { margin-top: 24px; margin-bottom: 16px; font-weight: 600; line-height: 1.25; }
    h1 { font-size: 2em; border-bottom: 1px solid #eaecef; padding-bottom: .3em; }
    h2 { font-size: 1.5em; border-bottom: 1px solid #eaecef; padding-bottom: .3em; }
    code { padding: .2em .4em; margin: 0; font-size: 85%; background-color: rgba(27,31,35,.05); border-radius: 3px; }
    pre { padding: 16px; overflow: auto; font-size: 85%; line-height: 1.45; background-color: #f6f8fa; border-radius: 3px; }
    pre code { background: transparent; }
    table { border-spacing: 0; border-collapse: collapse; }
    table th, table td { padding: 6px 13px; border: 1px solid #dfe2e5; }
    table th { font-weight: 600; background: #f6f8fa; }
    table tr:nth-child(2n) { background: #f6f8fa; }
    blockquote { padding: 0 1em; color: #6a737d; border-left: .25em solid #dfe2e5; }
  </style>
</head>
<body>
${preview}
</body>
</html>`
    
    const blob = new Blob([htmlContent], { type: 'text/html' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = 'markdown-export.html'
    a.click()
    URL.revokeObjectURL(url)
  }, [preview])

  // 复制到剪贴板
  const copyToClipboard = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(content)
      alert('内容已复制到剪贴板')
    } catch {
      alert('复制失败，请检查浏览器权限')
    }
  }, [content])

  // 模拟协作光标更新
  useEffect(() => {
    const interval = setInterval(() => {
      setSessions(prev => prev.map(s => ({
        ...s,
        cursorPosition: s.cursorPosition + Math.floor(Math.random() * 10 - 5),
        lastActive: new Date()
      })))
    }, 2000)
    
    return () => clearInterval(interval)
  }, [])

  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      height: '100%',
      background: '#0d1117',
      color: '#c9d1d9',
      fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif'
    }}>
      {/* 顶部工具栏 */}
      <div style={{
        padding: '12px 20px',
        background: '#161b22',
        borderBottom: '1px solid #30363d',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        flexWrap: 'wrap',
        gap: '12px'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <span style={{ fontSize: '24px' }}>📝</span>
          <div>
            <h2 style={{ margin: 0, fontSize: '18px', fontWeight: 600 }}>实时 Markdown 协作编辑器</h2>
            <div style={{ fontSize: '12px', color: '#8b949e', marginTop: '4px' }}>
              多人实时协作 · 版本控制 · 即时渲染
            </div>
          </div>
        </div>
        
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          {/* 协作用户 */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            {sessions.map(s => (
              <div
                key={s.id}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  padding: '4px 10px',
                  background: 'rgba(255,255,255,0.05)',
                  borderRadius: '20px',
                  fontSize: '12px'
                }}
              >
                <div style={{
                  width: '8px',
                  height: '8px',
                  borderRadius: '50%',
                  background: s.color
                }} />
                <span>{s.name}</span>
              </div>
            ))}
            <button
              onClick={() => setSessions(prev => [...prev, {
                id: Date.now().toString(),
                name: `用户 ${prev.length + 1}`,
                cursorPosition: 100,
                lastActive: new Date(),
                color: colors[prev.length % colors.length]
              }])}
              style={{
                padding: '4px 10px',
                borderRadius: '20px',
                background: '#238636',
                border: 'none',
                color: '#fff',
                fontSize: '12px',
                cursor: 'pointer'
              }}
            >
              + 添加用户
            </button>
          </div>
          
          {/* 统计信息 */}
          <div style={{
            display: 'flex',
            gap: '12px',
            fontSize: '12px',
            color: '#8b949e'
          }}>
            <span>{wordCount} 字</span>
            <span>{lineCount} 行</span>
          </div>
        </div>
      </div>

      {/* Markdown 工具栏 */}
      <div style={{
        padding: '8px 16px',
        background: '#21262d',
        borderBottom: '1px solid #30363d',
        display: 'flex',
        alignItems: 'center',
        gap: '8px',
        flexWrap: 'wrap'
      }}>
        {[
          { icon: 'B', element: 'bold', title: '粗体' },
          { icon: 'I', element: 'italic', title: '斜体' },
          { icon: '<>', element: 'code', title: '代码' },
          { icon: '{ }', element: 'codeblock', title: '代码块' },
          { icon: '🔗', element: 'link', title: '链接' },
          { icon: '🖼', element: 'image', title: '图片' },
          { icon: 'H', element: 'heading', title: '标题' },
          { icon: '❝', element: 'quote', title: '引用' },
          { icon: '•', element: 'list', title: '列表' },
          { icon: '📊', element: 'table', title: '表格' },
          { icon: '—', element: 'hr', title: '分隔线' },
        ].map(btn => (
          <button
            key={btn.element}
            onClick={() => insertElement(btn.element)}
            title={btn.title}
            style={{
              padding: '6px 10px',
              borderRadius: '6px',
              border: '1px solid #30363d',
              background: '#21262d',
              color: '#c9d1d9',
              fontSize: '12px',
              fontWeight: 500,
              cursor: 'pointer',
              transition: 'all 0.2s'
            }}
          >
            {btn.icon}
          </button>
        ))}
        
        <div style={{ flex: 1 }} />
        
        <button
          onClick={() => setShowPreview(!showPreview)}
          style={{
            padding: '6px 12px',
            borderRadius: '6px',
            border: '1px solid #30363d',
            background: showPreview ? '#238636' : '#21262d',
            color: '#c9d1d9',
            fontSize: '12px',
            cursor: 'pointer'
          }}
        >
          {showPreview ? '✓ 预览' : '预览'}
        </button>
        
        <button
          onClick={() => setShowHistory(!showHistory)}
          style={{
            padding: '6px 12px',
            borderRadius: '6px',
            border: '1px solid #30363d',
            background: showHistory ? '#238636' : '#21262d',
            color: '#c9d1d9',
            fontSize: '12px',
            cursor: 'pointer'
          }}
        >
          {showHistory ? '✓ 历史' : `历史 (${versions.length})`}
        </button>
        
        <button
          onClick={() => setAutoSaveEnabled(!autoSaveEnabled)}
          style={{
            padding: '6px 12px',
            borderRadius: '6px',
            border: '1px solid #30363d',
            background: autoSaveEnabled ? '#238636' : '#21262d',
            color: '#c9d1d9',
            fontSize: '12px',
            cursor: 'pointer'
          }}
        >
          {autoSaveEnabled ? '✓ 自动保存' : '自动保存'}
        </button>
        
        <button
          onClick={saveVersion}
          style={{
            padding: '6px 12px',
            borderRadius: '6px',
            border: 'none',
            background: '#1f6feb',
            color: '#fff',
            fontSize: '12px',
            cursor: 'pointer'
          }}
        >
          💾 保存版本
        </button>
        
        <button
          onClick={copyToClipboard}
          style={{
            padding: '6px 12px',
            borderRadius: '6px',
            border: '1px solid #30363d',
            background: '#21262d',
            color: '#c9d1d9',
            fontSize: '12px',
            cursor: 'pointer'
          }}
        >
          📋 复制
        </button>
        
        <button
          onClick={exportHTML}
          style={{
            padding: '6px 12px',
            borderRadius: '6px',
            border: 'none',
            background: '#8957e5',
            color: '#fff',
            fontSize: '12px',
            cursor: 'pointer'
          }}
        >
          📥 导出 HTML
        </button>
      </div>

      {/* 主编辑区域 */}
      <div style={{
        flex: 1,
        display: 'flex',
        gap: showPreview ? '16px' : '0',
        padding: '16px',
        overflow: 'hidden'
      }}>
        {/* 编辑器 */}
        <div style={{
          flex: showPreview ? 1 : 2,
          display: 'flex',
          flexDirection: 'column',
          background: '#0d1117',
          borderRadius: '8px',
          border: '1px solid #30363d',
          overflow: 'hidden'
        }}>
          <div style={{
            padding: '8px 12px',
            background: '#161b22',
            borderBottom: '1px solid #30363d',
            fontSize: '12px',
            color: '#8b949e',
            fontWeight: 500
          }}>
            📝 编辑器
          </div>
          <textarea
            ref={textareaRef}
            value={content}
            onChange={(e) => setContent(e.target.value)}
            placeholder="在此编写 Markdown 内容..."
            spellCheck={false}
            style={{
              flex: 1,
              padding: '16px',
              background: '#0d1117',
              border: 'none',
              outline: 'none',
              resize: 'none',
              fontFamily: '"Fira Code", "Monaco", monospace',
              fontSize: '14px',
              lineHeight: 1.6,
              color: '#c9d1d9'
            }}
          />
        </div>

        {/* 预览 */}
        {showPreview && (
          <div style={{
            flex: 1,
            display: 'flex',
            flexDirection: 'column',
            background: '#0d1117',
            borderRadius: '8px',
            border: '1px solid #30363d',
            overflow: 'hidden'
          }}>
            <div style={{
              padding: '8px 12px',
              background: '#161b22',
              borderBottom: '1px solid #30363d',
              fontSize: '12px',
              color: '#8b949e',
              fontWeight: 500
            }}>
              👁 预览
            </div>
            <div
              style={{
                flex: 1,
                padding: '16px',
                overflow: 'auto',
                lineHeight: 1.6,
                fontSize: '14px'
              }}
            >
              <style>{`
                h1, h2, h3, h4, h5, h6 { color: #f0f6fc; margin-top: 24px; margin-bottom: 16px; font-weight: 600; }
                h1 { font-size: 2em; border-bottom: 1px solid #30363d; }
                h2 { font-size: 1.5em; border-bottom: 1px solid #30363d; }
                h3 { font-size: 1.25em; }
                p { margin: 16px 0; }
                code { background: #161b22; padding: 2px 6px; border-radius: 3px; font-family: monospace; color: #79c0ff; }
                pre { background: #161b22; padding: 16px; border-radius: 6px; overflow-x: auto; margin: 16px 0; }
                pre code { background: none; padding: 0; }
                blockquote { border-left: 4px solid #30363d; padding-left: 16px; color: #8b949e; margin: 16px 0; }
                ul, ol { margin: 16px 0; padding-left: 32px; }
                li { margin: 4px 0; }
                table { border-collapse: collapse; margin: 16px 0; }
                th, td { border: 1px solid #30363d; padding: 8px 12px; }
                th { background: #161b22; font-weight: 600; }
                tr:nth-child(even) { background: #161b22; }
                a { color: #58a6ff; text-decoration: none; }
                a:hover { text-decoration: underline; }
                hr { border: none; border-top: 1px solid #30363d; margin: 24px 0; }
                img { max-width: 100%; border-radius: 6px; }
              `}</style>
              <div dangerouslySetInnerHTML={{ __html: preview }} />
            </div>
          </div>
        )}

        {/* 版本历史 */}
        {showHistory && (
          <div style={{
            width: '300px',
            display: 'flex',
            flexDirection: 'column',
            background: '#161b22',
            borderRadius: '8px',
            border: '1px solid #30363d',
            overflow: 'hidden'
          }}>
            <div style={{
              padding: '12px 16px',
              background: '#21262d',
              borderBottom: '1px solid #30363d',
              fontSize: '14px',
              fontWeight: 600,
              color: '#f0f6fc'
            }}>
              📜 版本历史 ({versions.length})
            </div>
            <div style={{
              flex: 1,
              overflow: 'auto',
              padding: '8px'
            }}>
              {versions.length === 0 ? (
                <div style={{
                  textAlign: 'center',
                  padding: '32px',
                  color: '#8b949e'
                }}>
                  <div style={{ fontSize: '48px', marginBottom: '12px' }}>📭</div>
                  <p>暂无保存的版本</p>
                  <p style={{ fontSize: '12px', marginTop: '8px' }}>点击"保存版本"开始记录</p>
                </div>
              ) : (
                versions.map(v => (
                  <div
                    key={v.id}
                    onClick={() => restoreVersion(v)}
                    style={{
                      padding: '12px',
                      background: currentVersion === v.id ? '#238636' : '#21262d',
                      borderRadius: '6px',
                      margin: '4px 0',
                      cursor: 'pointer',
                      transition: 'background 0.2s'
                    }}
                  >
                    <div style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      fontSize: '12px',
                      color: '#8b949e',
                      marginBottom: '6px'
                    }}>
                      <span>{v.author}</span>
                      <span>{new Date(v.timestamp).toLocaleString('zh-CN', { 
                        hour: '2-digit',
                        minute: '2-digit'
                      })}</span>
                    </div>
                    <div style={{
                      fontSize: '11px',
                      color: '#c9d1d9',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      whiteSpace: 'nowrap'
                    }}>
                      {v.content.substring(0, 50)}...
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  )
})

export default MarkdownCollaborator