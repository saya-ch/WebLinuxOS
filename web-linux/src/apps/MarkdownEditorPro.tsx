import { useState, useCallback, useMemo, useRef, useEffect } from 'react'
import {
  FileText,
  Eye,
  Code,
  Columns,
  Download,
  Copy,
  Bold,
  Italic,
  Strikethrough,
  List,
  ListOrdered,
  Quote,
  Link,
  Image,
  Code as CodeIcon,
  Heading1,
  Heading2,
  Heading3,
  Table,
  Minus,
  CheckSquare,
  FilePlus,
  Trash2,
  Sparkles,
} from 'lucide-react'
import { marked } from 'marked'

const SAMPLE_MARKDOWN = `# 欢迎使用 Markdown 编辑器

这是一个功能强大的 **Markdown 编辑器**，支持实时预览。

## 功能特性

- 实时预览
- 分栏编辑
- 语法高亮
- 导出 HTML
- 本地存储

### 代码示例

\`\`\`javascript
function greet(name) {
  console.log(\`Hello, \${name}!\`);
}

greet('World');
\`\`\`

### 表格示例

| 功能 | 描述 | 状态 |
|------|------|------|
| 实时预览 | 即时渲染 Markdown | ✅ 完成 |
| 导出功能 | 导出为 HTML 文件 | ✅ 完成 |
| 本地存储 | 自动保存文档 | ✅ 完成 |

### 引用

> 代码是写给人看的，只是顺便让机器执行。
> 
> — Harold Abelson

### 任务列表

- [x] 实现编辑器核心功能
- [x] 添加实时预览
- [ ] 更多主题支持
- [ ] 协作编辑

---

## 快速开始

1. 在左侧编辑 Markdown
2. 右侧实时查看预览
3. 使用工具栏快速插入语法

**享受写作的乐趣！** 🎉
`

interface Document {
  id: string
  name: string
  content: string
  createdAt: number
  updatedAt: number
}

export default function MarkdownEditor() {
  const [documents, setDocuments] = useState<Document[]>(() => {
    const saved = localStorage.getItem('weblinux-md-docs')
    if (saved) {
      try { return JSON.parse(saved) } catch { /* ignore */ }
    }
    return [{
      id: 'default',
      name: '未命名文档.md',
      content: SAMPLE_MARKDOWN,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    }]
  })
  const [currentDocId, setCurrentDocId] = useState('default')
  const [viewMode, setViewMode] = useState<'split' | 'edit' | 'preview'>('split')
  const [showSidebar, setShowSidebar] = useState(true)
  const [fileName, setFileName] = useState('未命名文档.md')
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  const currentDoc = useMemo(
    () => documents.find(d => d.id === currentDocId) || documents[0],
    [documents, currentDocId]
  )

  const content = currentDoc?.content || ''

  useEffect(() => {
    if (currentDoc) {
      setFileName(currentDoc.name)
    }
  }, [currentDocId])

  useEffect(() => {
    localStorage.setItem('weblinux-md-docs', JSON.stringify(documents))
  }, [documents])

  const updateContent = useCallback((newContent: string) => {
    setDocuments(docs => docs.map(doc =>
      doc.id === currentDocId
        ? { ...doc, content: newContent, updatedAt: Date.now() }
        : doc
    ))
  }, [currentDocId])

  const updateFileName = useCallback((name: string) => {
    setFileName(name)
    setDocuments(docs => docs.map(doc =>
      doc.id === currentDocId
        ? { ...doc, name, updatedAt: Date.now() }
        : doc
    ))
  }, [currentDocId])

  const renderedHTML = useMemo(() => {
    try {
      return marked.parse(content) as string
    } catch {
      return '<p>渲染错误</p>'
    }
  }, [content])

  const newDocument = useCallback(() => {
    const newDoc: Document = {
      id: `doc-${Date.now()}`,
      name: '未命名文档.md',
      content: '# 新文档\n\n开始写作...',
      createdAt: Date.now(),
      updatedAt: Date.now(),
    }
    setDocuments(docs => [...docs, newDoc])
    setCurrentDocId(newDoc.id)
  }, [])

  const deleteDocument = useCallback((id: string) => {
    if (documents.length <= 1) return
    setDocuments(docs => {
      const filtered = docs.filter(d => d.id !== id)
      if (id === currentDocId && filtered.length > 0) {
        setCurrentDocId(filtered[0].id)
      }
      return filtered
    })
  }, [documents.length, currentDocId])

  const insertSyntax = useCallback((before: string, after = '') => {
    const textarea = textareaRef.current
    if (!textarea) return

    const start = textarea.selectionStart
    const end = textarea.selectionEnd
    const selected = content.substring(start, end)
    const newContent = content.substring(0, start) + before + selected + after + content.substring(end)
    
    updateContent(newContent)
    
    setTimeout(() => {
      textarea.focus()
      const newPos = start + before.length + selected.length
      textarea.setSelectionRange(newPos, newPos + after.length)
    }, 0)
  }, [content, updateContent])

  const insertLink = useCallback(() => {
    const url = prompt('请输入链接地址：', 'https://')
    if (url) {
      insertSyntax('[', `](${url})`)
    }
  }, [insertSyntax])

  const insertImage = useCallback(() => {
    const url = prompt('请输入图片地址：', 'https://')
    if (url) {
      insertSyntax('![描述](', `${url})`)
    }
  }, [insertSyntax])

  const insertTable = useCallback(() => {
    const table = `| 列1 | 列2 | 列3 |
|-----|-----|-----|
| 内容 | 内容 | 内容 |
| 内容 | 内容 | 内容 |
`
    insertSyntax(table)
  }, [insertSyntax])

  const exportHTML = useCallback(() => {
    const html = `<!DOCTYPE html>
<html lang="zh-CN">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${currentDoc?.name || '文档'}</title>
  <style>
    body {
      max-width: 800px;
      margin: 0 auto;
      padding: 40px 20px;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      line-height: 1.6;
      color: #333;
    }
    h1, h2, h3, h4, h5, h6 { margin-top: 24px; margin-bottom: 16px; font-weight: 600; }
    h1 { font-size: 2em; border-bottom: 1px solid #eee; padding-bottom: 10px; }
    h2 { font-size: 1.5em; border-bottom: 1px solid #eee; padding-bottom: 6px; }
    code { background: #f4f4f4; padding: 2px 6px; border-radius: 4px; font-family: monospace; }
    pre { background: #1e1e1e; color: #d4d4d4; padding: 16px; border-radius: 8px; overflow-x: auto; }
    pre code { background: none; padding: 0; color: inherit; }
    blockquote { border-left: 4px solid #ddd; margin: 0; padding-left: 16px; color: #666; }
    table { border-collapse: collapse; width: 100%; }
    th, td { border: 1px solid #ddd; padding: 8px 12px; text-align: left; }
    th { background: #f5f5f5; }
    img { max-width: 100%; }
    a { color: #0066cc; text-decoration: none; }
    a:hover { text-decoration: underline; }
  </style>
</head>
<body>
${renderedHTML}
</body>
</html>`

    const blob = new Blob([html], { type: 'text/html' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = (currentDoc?.name || 'document').replace(/\.md$/, '.html')
    a.click()
    URL.revokeObjectURL(url)
  }, [renderedHTML, currentDoc])

  const exportMarkdown = useCallback(() => {
    const blob = new Blob([content], { type: 'text/markdown' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = currentDoc?.name || 'document.md'
    a.click()
    URL.revokeObjectURL(url)
  }, [content, currentDoc])

  const copyHTML = useCallback(() => {
    navigator.clipboard.writeText(renderedHTML)
  }, [renderedHTML])

  const wordCount = useMemo(() => {
    const text = content.trim()
    if (!text) return { chars: 0, words: 0, lines: 0 }
    return {
      chars: text.length,
      words: text.split(/\s+/).filter(Boolean).length,
      lines: text.split('\n').length,
    }
  }, [content])

  const ToolbarButton = ({ icon: Icon, onClick, title }: { icon: any; onClick: () => void; title: string }) => (
    <button className="toolbar-btn" onClick={onClick} title={title}>
      <Icon size={16} />
    </button>
  )

  return (
    <div className="markdown-editor">
      {showSidebar && (
        <div className="sidebar">
          <div className="sidebar-header">
            <div className="sidebar-title">
              <FileText size={16} />
              <span>文档</span>
            </div>
            <button className="sidebar-new-btn" onClick={newDocument} title="新建文档">
              <FilePlus size={16} />
            </button>
          </div>
          <div className="sidebar-list">
            {documents.map(doc => (
              <div
                key={doc.id}
                className={`doc-item ${doc.id === currentDocId ? 'active' : ''}`}
                onClick={() => setCurrentDocId(doc.id)}
              >
                <FileText size={14} />
                <span className="doc-name">{doc.name}</span>
                {documents.length > 1 && (
                  <button
                    className="doc-delete"
                    onClick={(e) => { e.stopPropagation(); deleteDocument(doc.id) }}
                    title="删除"
                  >
                    <Trash2 size={12} />
                  </button>
                )}
              </div>
            ))}
          </div>
          <div className="sidebar-footer">
            <div className="word-count">
              <span>{wordCount.chars} 字符</span>
              <span>{wordCount.lines} 行</span>
            </div>
          </div>
        </div>
      )}

      <div className="editor-main">
        <div className="editor-header">
          <div className="header-left">
            <button
              className="sidebar-toggle"
              onClick={() => setShowSidebar(!showSidebar)}
              title="切换侧边栏"
            >
              <List size={18} />
            </button>
            <input
              type="text"
              className="filename-input"
              value={fileName}
              onChange={(e) => updateFileName(e.target.value)}
              spellCheck={false}
            />
          </div>
          <div className="header-right">
            <div className="view-toggle">
              <button
                className={viewMode === 'edit' ? 'active' : ''}
                onClick={() => setViewMode('edit')}
                title="编辑模式"
              >
                <Code size={16} />
              </button>
              <button
                className={viewMode === 'split' ? 'active' : ''}
                onClick={() => setViewMode('split')}
                title="分栏模式"
              >
                <Columns size={16} />
              </button>
              <button
                className={viewMode === 'preview' ? 'active' : ''}
                onClick={() => setViewMode('preview')}
                title="预览模式"
              >
                <Eye size={16} />
              </button>
            </div>
            <div className="export-buttons">
              <button className="header-btn" onClick={exportMarkdown} title="导出 Markdown">
                <Download size={16} />
                <span>导出</span>
              </button>
              <button className="header-btn primary" onClick={exportHTML} title="导出 HTML">
                <Sparkles size={16} />
                <span>HTML</span>
              </button>
            </div>
          </div>
        </div>

        <div className="toolbar">
          <ToolbarButton icon={Bold} onClick={() => insertSyntax('**', '**')} title="加粗" />
          <ToolbarButton icon={Italic} onClick={() => insertSyntax('*', '*')} title="斜体" />
          <ToolbarButton icon={Strikethrough} onClick={() => insertSyntax('~~', '~~')} title="删除线" />
          <span className="toolbar-divider" />
          <ToolbarButton icon={Heading1} onClick={() => insertSyntax('# ')} title="一级标题" />
          <ToolbarButton icon={Heading2} onClick={() => insertSyntax('## ')} title="二级标题" />
          <ToolbarButton icon={Heading3} onClick={() => insertSyntax('### ')} title="三级标题" />
          <span className="toolbar-divider" />
          <ToolbarButton icon={List} onClick={() => insertSyntax('- ')} title="无序列表" />
          <ToolbarButton icon={ListOrdered} onClick={() => insertSyntax('1. ')} title="有序列表" />
          <ToolbarButton icon={CheckSquare} onClick={() => insertSyntax('- [ ] ')} title="任务列表" />
          <span className="toolbar-divider" />
          <ToolbarButton icon={Quote} onClick={() => insertSyntax('> ')} title="引用" />
          <ToolbarButton icon={CodeIcon} onClick={() => insertSyntax('`', '`')} title="行内代码" />
          <ToolbarButton icon={Link} onClick={insertLink} title="链接" />
          <ToolbarButton icon={Image} onClick={insertImage} title="图片" />
          <ToolbarButton icon={Table} onClick={insertTable} title="表格" />
          <ToolbarButton icon={Minus} onClick={() => insertSyntax('\n---\n')} title="分割线" />
          <span className="toolbar-divider" />
          <button className="toolbar-btn copy-btn" onClick={copyHTML} title="复制 HTML">
            <Copy size={14} />
            <span>复制 HTML</span>
          </button>
        </div>

        <div className="editor-body">
          {viewMode !== 'preview' && (
            <div className="editor-pane">
              <textarea
                ref={textareaRef}
                value={content}
                onChange={(e) => updateContent(e.target.value)}
                className="markdown-textarea"
                spellCheck={false}
                placeholder="在这里输入 Markdown..."
              />
            </div>
          )}
          {viewMode === 'split' && <div className="pane-divider" />}
          {viewMode !== 'edit' && (
            <div className="preview-pane">
              <div
                className="markdown-preview"
                dangerouslySetInnerHTML={{ __html: renderedHTML }}
              />
            </div>
          )}
        </div>
      </div>

      <style>{`
        .markdown-editor {
          height: 100%;
          display: flex;
          background: #fafafa;
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
          color: #333;
          overflow: hidden;
        }
        .sidebar {
          width: 220px;
          background: #fff;
          border-right: 1px solid #e5e5e5;
          display: flex;
          flex-direction: column;
          flex-shrink: 0;
        }
        .sidebar-header {
          padding: 12px 14px;
          border-bottom: 1px solid #eee;
          display: flex;
          justify-content: space-between;
          align-items: center;
        }
        .sidebar-title {
          display: flex;
          align-items: center;
          gap: 8px;
          font-size: 13px;
          font-weight: 600;
          color: #555;
        }
        .sidebar-new-btn {
          width: 28px;
          height: 28px;
          border: none;
          background: #f0f0f0;
          border-radius: 6px;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          color: #666;
          transition: all 0.2s;
        }
        .sidebar-new-btn:hover {
          background: #e0e0e0;
          color: #333;
        }
        .sidebar-list {
          flex: 1;
          overflow-y: auto;
          padding: 6px;
        }
        .doc-item {
          display: flex;
          align-items: center;
          gap: 8px;
          padding: 8px 10px;
          border-radius: 6px;
          cursor: pointer;
          transition: background 0.15s;
          margin-bottom: 2px;
        }
        .doc-item:hover {
          background: #f5f5f5;
        }
        .doc-item.active {
          background: #e8f0fe;
          color: #1a73e8;
        }
        .doc-item svg {
          flex-shrink: 0;
        }
        .doc-name {
          flex: 1;
          font-size: 13px;
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
        }
        .doc-delete {
          opacity: 0;
          border: none;
          background: transparent;
          cursor: pointer;
          color: #999;
          padding: 2px;
          border-radius: 4px;
          transition: all 0.15s;
        }
        .doc-item:hover .doc-delete {
          opacity: 1;
        }
        .doc-delete:hover {
          background: rgba(234, 67, 53, 0.1);
          color: #ea4335;
        }
        .sidebar-footer {
          padding: 10px 14px;
          border-top: 1px solid #eee;
        }
        .word-count {
          display: flex;
          justify-content: space-between;
          font-size: 11px;
          color: #999;
        }
        .editor-main {
          flex: 1;
          display: flex;
          flex-direction: column;
          overflow: hidden;
        }
        .editor-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 8px 16px;
          background: #fff;
          border-bottom: 1px solid #e5e5e5;
          gap: 12px;
        }
        .header-left {
          display: flex;
          align-items: center;
          gap: 10px;
          flex: 1;
        }
        .sidebar-toggle {
          width: 32px;
          height: 32px;
          border: none;
          background: transparent;
          cursor: pointer;
          border-radius: 6px;
          display: flex;
          align-items: center;
          justify-content: center;
          color: #666;
          transition: background 0.15s;
        }
        .sidebar-toggle:hover {
          background: #f0f0f0;
        }
        .filename-input {
          border: none;
          outline: none;
          font-size: 14px;
          font-weight: 500;
          padding: 4px 8px;
          border-radius: 4px;
          background: transparent;
          min-width: 0;
          flex: 1;
          max-width: 300px;
        }
        .filename-input:hover,
        .filename-input:focus {
          background: #f5f5f5;
        }
        .header-right {
          display: flex;
          align-items: center;
          gap: 12px;
        }
        .view-toggle {
          display: flex;
          background: #f0f0f0;
          border-radius: 6px;
          padding: 2px;
        }
        .view-toggle button {
          width: 32px;
          height: 28px;
          border: none;
          background: transparent;
          cursor: pointer;
          border-radius: 4px;
          display: flex;
          align-items: center;
          justify-content: center;
          color: #666;
          transition: all 0.15s;
        }
        .view-toggle button:hover {
          color: #333;
        }
        .view-toggle button.active {
          background: #fff;
          color: #1a73e8;
          box-shadow: 0 1px 3px rgba(0,0,0,0.1);
        }
        .export-buttons {
          display: flex;
          gap: 6px;
        }
        .header-btn {
          display: flex;
          align-items: center;
          gap: 6px;
          padding: 6px 12px;
          border: 1px solid #ddd;
          background: #fff;
          border-radius: 6px;
          cursor: pointer;
          font-size: 13px;
          color: #555;
          transition: all 0.15s;
        }
        .header-btn:hover {
          background: #f5f5f5;
          border-color: #ccc;
        }
        .header-btn.primary {
          background: #1a73e8;
          border-color: #1a73e8;
          color: #fff;
        }
        .header-btn.primary:hover {
          background: #1557b0;
          border-color: #1557b0;
        }
        .toolbar {
          display: flex;
          align-items: center;
          gap: 2px;
          padding: 6px 12px;
          background: #fff;
          border-bottom: 1px solid #eee;
          flex-wrap: wrap;
        }
        .toolbar-btn {
          width: 30px;
          height: 30px;
          border: none;
          background: transparent;
          cursor: pointer;
          border-radius: 4px;
          display: flex;
          align-items: center;
          justify-content: center;
          color: #555;
          transition: all 0.15s;
        }
        .toolbar-btn:hover {
          background: #f0f0f0;
          color: #333;
        }
        .toolbar-btn.copy-btn {
          width: auto;
          padding: 0 10px;
          gap: 6px;
          font-size: 12px;
        }
        .toolbar-divider {
          width: 1px;
          height: 20px;
          background: #e0e0e0;
          margin: 0 6px;
        }
        .editor-body {
          flex: 1;
          display: flex;
          overflow: hidden;
        }
        .editor-pane {
          flex: 1;
          display: flex;
          min-width: 0;
        }
        .markdown-textarea {
          flex: 1;
          border: none;
          outline: none;
          padding: 20px 24px;
          font-family: 'JetBrains Mono', 'Fira Code', 'SF Mono', Menlo, Consolas, monospace;
          font-size: 14px;
          line-height: 1.6;
          resize: none;
          background: #fafafa;
          color: #333;
          tab-size: 2;
        }
        .pane-divider {
          width: 1px;
          background: #e5e5e5;
          flex-shrink: 0;
        }
        .preview-pane {
          flex: 1;
          overflow-y: auto;
          background: #fff;
          min-width: 0;
        }
        .markdown-preview {
          padding: 24px 32px;
          line-height: 1.7;
        }
        .markdown-preview h1,
        .markdown-preview h2,
        .markdown-preview h3,
        .markdown-preview h4,
        .markdown-preview h5,
        .markdown-preview h6 {
          margin-top: 24px;
          margin-bottom: 12px;
          font-weight: 600;
          line-height: 1.3;
        }
        .markdown-preview h1 {
          font-size: 2em;
          border-bottom: 1px solid #eee;
          padding-bottom: 10px;
          margin-top: 0;
        }
        .markdown-preview h2 {
          font-size: 1.5em;
          border-bottom: 1px solid #eee;
          padding-bottom: 6px;
        }
        .markdown-preview h3 { font-size: 1.25em; }
        .markdown-preview p { margin: 12px 0; }
        .markdown-preview code {
          background: #f4f4f4;
          padding: 2px 6px;
          border-radius: 4px;
          font-family: 'JetBrains Mono', monospace;
          font-size: 0.9em;
        }
        .markdown-preview pre {
          background: #1e1e1e;
          color: #d4d4d4;
          padding: 16px;
          border-radius: 8px;
          overflow-x: auto;
          margin: 16px 0;
        }
        .markdown-preview pre code {
          background: none;
          padding: 0;
          color: inherit;
          font-size: 13px;
        }
        .markdown-preview blockquote {
          border-left: 4px solid #d0d0d0;
          margin: 16px 0;
          padding-left: 16px;
          color: #666;
        }
        .markdown-preview table {
          border-collapse: collapse;
          width: 100%;
          margin: 16px 0;
        }
        .markdown-preview th,
        .markdown-preview td {
          border: 1px solid #e0e0e0;
          padding: 8px 12px;
          text-align: left;
        }
        .markdown-preview th {
          background: #f5f5f5;
          font-weight: 600;
        }
        .markdown-preview img { max-width: 100%; border-radius: 4px; }
        .markdown-preview a { color: #1a73e8; text-decoration: none; }
        .markdown-preview a:hover { text-decoration: underline; }
        .markdown-preview ul,
        .markdown-preview ol {
          padding-left: 24px;
          margin: 12px 0;
        }
        .markdown-preview li { margin: 4px 0; }
        .markdown-preview hr {
          border: none;
          border-top: 1px solid #eee;
          margin: 24px 0;
        }
        .markdown-preview input[type="checkbox"] {
          margin-right: 8px;
        }
      `}</style>
    </div>
  )
}
