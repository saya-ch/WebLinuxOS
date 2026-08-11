import { useState, useEffect, useMemo, useCallback } from 'react'
import { marked } from 'marked'

const STORAGE_KEY = 'markdown-quick-note-content'

marked.setOptions({
  breaks: true,
  gfm: true,
})

const styles: Record<string, React.CSSProperties> = {
  container: {
    display: 'flex',
    flexDirection: 'column',
    height: '100%',
    background: '#fff',
    fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
    color: '#1e293b',
  },
  toolbar: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: '10px 16px',
    borderBottom: '1px solid #e2e8f0',
    background: '#f8fafc',
    flexShrink: 0,
  },
  toolbarLeft: {
    display: 'flex',
    alignItems: 'center',
    gap: 10,
  },
  toolbarRight: {
    display: 'flex',
    alignItems: 'center',
    gap: 8,
  },
  title: {
    fontSize: 15,
    fontWeight: 600,
    color: '#0f172a',
  },
  btn: {
    padding: '6px 12px',
    border: '1px solid #e2e8f0',
    borderRadius: 6,
    background: '#fff',
    cursor: 'pointer',
    fontSize: 13,
    color: '#475569',
    display: 'flex',
    alignItems: 'center',
    gap: 4,
  },
  btnPrimary: {
    padding: '6px 12px',
    border: 'none',
    borderRadius: 6,
    background: '#3b82f6',
    cursor: 'pointer',
    fontSize: 13,
    color: '#fff',
    display: 'flex',
    alignItems: 'center',
    gap: 4,
  },
  btnDanger: {
    padding: '6px 12px',
    border: '1px solid #fecaca',
    borderRadius: 6,
    background: '#fff',
    cursor: 'pointer',
    fontSize: 13,
    color: '#dc2626',
  },
  stats: {
    display: 'flex',
    alignItems: 'center',
    gap: 14,
    fontSize: 12,
    color: '#64748b',
  },
  statItem: {
    display: 'flex',
    alignItems: 'center',
    gap: 4,
  },
  splitView: {
    flex: 1,
    display: 'flex',
    overflow: 'hidden',
  },
  editorPane: {
    flex: 1,
    display: 'flex',
    flexDirection: 'column',
    borderRight: '1px solid #e2e8f0',
    overflow: 'hidden',
    minWidth: 0,
  },
  previewPane: {
    flex: 1,
    display: 'flex',
    flexDirection: 'column',
    overflow: 'hidden',
    minWidth: 0,
    background: '#fafbfc',
  },
  paneHeader: {
    padding: '6px 12px',
    fontSize: 11,
    fontWeight: 600,
    color: '#94a3b8',
    textTransform: 'uppercase',
    letterSpacing: '0.08em',
    background: '#f8fafc',
    borderBottom: '1px solid #e2e8f0',
  },
  textarea: {
    flex: 1,
    width: '100%',
    padding: 16,
    border: 'none',
    outline: 'none',
    resize: 'none',
    fontFamily: '"SF Mono", "Fira Code", "Fira Mono", "Roboto Mono", monospace',
    fontSize: 14,
    lineHeight: 1.7,
    color: '#0f172a',
    background: '#fff',
    tabSize: 2,
    overflow: 'auto',
  },
  previewContent: {
    flex: 1,
    padding: 20,
    overflow: 'auto',
    lineHeight: 1.7,
    fontSize: 15,
    color: '#1e293b',
  },
  statusBar: {
    padding: '4px 16px',
    background: '#f8fafc',
    borderTop: '1px solid #e2e8f0',
    fontSize: 11,
    color: '#94a3b8',
    display: 'flex',
    justifyContent: 'space-between',
    flexShrink: 0,
  },
  savedBadge: {
    color: '#22c55e',
  },
  unsavedBadge: {
    color: '#f59e0b',
  },
}

function highlightSyntax(text: string): string {
  let result = text
  result = result.replace(/```(\w*)\n([\s\S]*?)```/g, (_m, lang, code) => {
    return `<pre style="background:#0f172a;color:#e2e8f0;padding:14px;border-radius:8px;overflow-x:auto;font-size:13px;line-height:1.5;"><code class="language-${lang}">${code}</code></pre>`
  })
  result = result.replace(/`([^`]+)`/g, '<code style="background:#f1f5f9;color:#db2777;padding:2px 6px;border-radius:4px;font-size:0.9em;">$1</code>')
  result = result.replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>')
  result = result.replace(/\*([^*]+)\*/g, '<em>$1</em>')
  result = result.replace(/^### (.+)$/gm, '<h3 style="font-size:1.1em;margin:1em 0 0.5em;color:#0f172a;">$1</h3>')
  result = result.replace(/^## (.+)$/gm, '<h2 style="font-size:1.3em;margin:1em 0 0.5em;color:#0f172a;border-bottom:1px solid #e2e8f0;padding-bottom:6px;">$1</h2>')
  result = result.replace(/^# (.+)$/gm, '<h1 style="font-size:1.6em;margin:0.6em 0 0.4em;color:#0f172a;">$1</h1>')
  result = result.replace(/\n\n/g, '</p><p style="margin:0.6em 0;">')
  result = `<p style="margin:0.6em 0;">${result}</p>`
  result = result.replace(/<\/p><\/pre>/g, '</pre>')
  result = result.replace(/<p style="margin:0.6em 0;"><\/pre>/g, '</pre>')
  return result
}

export default function MarkdownQuickNote() {
  const [content, setContent] = useState(() => {
    try {
      return localStorage.getItem(STORAGE_KEY) || '# 欢迎使用 Markdown 速记\n\n开始记录你的想法...\n\n## 功能特性\n\n- 实时预览\n- 语法高亮\n- 字数统计\n- 阅读时间\n- 导出 MD 文件\n- 自动保存\n'
    } catch {
      return ''
    }
  })
  const [saved, setSaved] = useState(true)
  const [lastSaved, setLastSaved] = useState<string>('')

  useEffect(() => {
    const timer = setTimeout(() => {
      try {
        localStorage.setItem(STORAGE_KEY, content)
        setSaved(true)
        setLastSaved(new Date().toLocaleTimeString())
      } catch {}
    }, 500)
    return () => clearTimeout(timer)
  }, [content])

  const handleChange = useCallback((e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setContent(e.target.value)
    setSaved(false)
  }, [])

  const wordCount = useMemo(() => {
    const text = content.trim()
    if (!text) return { words: 0, chars: 0, lines: 0 }
    const words = text.split(/\s+/).filter(Boolean).length
    const chars = text.length
    const lines = text.split('\n').length
    return { words, chars, lines }
  }, [content])

  const readingTime = useMemo(() => {
    const minutes = Math.ceil(wordCount.words / 200)
    if (minutes === 0) return '< 1 分钟'
    if (minutes === 1) return '1 分钟'
    return `${minutes} 分钟`
  }, [wordCount.words])

  const renderedHTML = useMemo(() => {
    try {
      const raw = marked.parse(content) as string
      return highlightSyntax(raw)
    } catch {
      return '<p style="color:#94a3b8;">预览渲染出错</p>'
    }
  }, [content])

  const downloadMD = useCallback(() => {
    const blob = new Blob([content], { type: 'text/markdown;charset=utf-8' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `note-${new Date().toISOString().slice(0, 10)}.md`
    a.click()
    URL.revokeObjectURL(url)
  }, [content])

  const downloadHTML = useCallback(() => {
    const html = `<!DOCTYPE html>
<html><head><meta charset="utf-8"><title>Exported Note</title>
<style>body{font-family:-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,sans-serif;max-width:760px;margin:40px auto;padding:0 20px;line-height:1.7;color:#1e293b}h1,h2,h3{color:#0f172a}pre{background:#0f172a;color:#e2e8f0;padding:14px;border-radius:8px;overflow-x:auto}code{background:#f1f5f9;color:#db2777;padding:2px 6px;border-radius:4px}blockquote{border-left:4px solid #e2e8f0;margin:0;padding-left:16px;color:#64748b}table{border-collapse:collapse;width:100%}th,td{border:1px solid #e2e8f0;padding:8px 12px;text-align:left}th{background:#f8fafc}</style>
</head><body>${renderedHTML}</body></html>`
    const blob = new Blob([html], { type: 'text/html;charset=utf-8' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `note-${new Date().toISOString().slice(0, 10)}.html`
    a.click()
    URL.revokeObjectURL(url)
  }, [renderedHTML])

  const clearNote = useCallback(() => {
    if (confirm('确定要清空笔记内容吗？此操作不可撤销。')) {
      setContent('')
    }
  }, [])

  const insertMarkdown = useCallback((before: string, after = '') => {
    const textarea = document.querySelector('.md-quick-note-textarea') as HTMLTextAreaElement
    if (!textarea) return
    const start = textarea.selectionStart
    const end = textarea.selectionEnd
    const selected = content.substring(start, end)
    const newText = content.substring(0, start) + before + selected + after + content.substring(end)
    setContent(newText)
    setTimeout(() => {
      textarea.focus()
      textarea.setSelectionRange(start + before.length, start + before.length + selected.length)
    }, 0)
  }, [content])

  const toolbarBtns: Array<{ label: string; action: () => void; title: string }> = [
    { label: 'B', action: () => insertMarkdown('**', '**'), title: '粗体' },
    { label: 'I', action: () => insertMarkdown('*', '*'), title: '斜体' },
    { label: 'H1', action: () => insertMarkdown('\n# ', ''), title: '标题' },
    { label: 'H2', action: () => insertMarkdown('\n## ', ''), title: '副标题' },
    { label: '•', action: () => insertMarkdown('\n- ', ''), title: '列表' },
    { label: '1.', action: () => insertMarkdown('\n1. ', ''), title: '有序列表' },
    { label: '>', action: () => insertMarkdown('\n> ', ''), title: '引用' },
    { label: '</>', action: () => insertMarkdown('\n```\n', '\n```\n'), title: '代码块' },
    { label: '🔗', action: () => insertMarkdown('[', '](https://)'), title: '链接' },
  ]

  return (
    <div style={styles.container}>
      <div style={styles.toolbar}>
        <div style={styles.toolbarLeft}>
          <span style={styles.title}>📝 Markdown 速记</span>
          <div style={{ display: 'flex', gap: 2 }}>
            {toolbarBtns.map((btn) => (
              <button
                key={btn.title}
                style={{ ...styles.btn, padding: '4px 8px', fontSize: 12 }}
                onClick={btn.action}
                title={btn.title}
              >
                {btn.label}
              </button>
            ))}
          </div>
        </div>
        <div style={styles.toolbarRight}>
          <div style={styles.stats}>
            <span style={styles.statItem}>📝 {wordCount.words} 词</span>
            <span style={styles.statItem}>🔤 {wordCount.chars} 字符</span>
            <span style={styles.statItem}>📖 {readingTime}</span>
          </div>
          <button style={styles.btn} onClick={downloadMD} title="导出为 Markdown 文件">
            ⬇ .md
          </button>
          <button style={styles.btn} onClick={downloadHTML} title="导出为 HTML 文件">
            ⬇ .html
          </button>
          <button style={styles.btnDanger} onClick={clearNote}>
            清空
          </button>
        </div>
      </div>

      <div style={styles.splitView}>
        <div style={styles.editorPane}>
          <div style={styles.paneHeader}>编辑</div>
          <textarea
            className="md-quick-note-textarea"
            style={styles.textarea}
            value={content}
            onChange={handleChange}
            placeholder="在此输入 Markdown 内容..."
            spellCheck={false}
          />
        </div>
        <div style={styles.previewPane}>
          <div style={styles.paneHeader}>实时预览</div>
          <div
            style={styles.previewContent}
            dangerouslySetInnerHTML={{ __html: renderedHTML }}
          />
        </div>
      </div>

      <div style={styles.statusBar}>
        <span className={saved ? 'saved' : 'unsaved'} style={saved ? styles.savedBadge : styles.unsavedBadge}>
          {saved ? `✓ 已保存 ${lastSaved ? `· ${lastSaved}` : ''}` : '● 编辑中...'}
        </span>
        <span>
          共 {wordCount.lines} 行 · {wordCount.words} 词 · {wordCount.chars} 字符 · 阅读约 {readingTime}
        </span>
      </div>
    </div>
  )
}