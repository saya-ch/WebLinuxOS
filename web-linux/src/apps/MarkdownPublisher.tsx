import { useState, useCallback, useEffect, useRef, useMemo } from 'react'
import { useStore } from '../store'
import { marked } from 'marked'
import {
  FileText, Eye, Download, Copy, Check, Trash2,
  Plus, Code, Layout,
  Sun, Moon, BookOpen, ChevronDown
} from 'lucide-react'

interface Document {
  id: string
  title: string
  content: string
  createdAt: number
  updatedAt: number
  template: string
}

type TemplateKey = 'minimal' | 'article' | 'magazine' | 'technical' | 'notebook'

interface TemplateConfig {
  name: string
  fontFamily: string
  accent: string
  bgClass: string
  maxWidth: string
  lineHeight: string
  fontSize: string
}

const TEMPLATES: Record<TemplateKey, TemplateConfig> = {
  minimal: {
    name: '极简白',
    fontFamily: "'Noto Serif SC', Georgia, serif",
    accent: '#0f172a',
    bgClass: '#ffffff',
    maxWidth: '720px',
    lineHeight: '1.85',
    fontSize: '17px',
  },
  article: {
    name: '文章深读',
    fontFamily: "'Fraunces', Georgia, serif",
    accent: '#1e40af',
    bgClass: '#fefefe',
    maxWidth: '680px',
    lineHeight: '1.9',
    fontSize: '18px',
  },
  magazine: {
    name: '杂志风',
    fontFamily: "'Outfit', 'Noto Sans SC', sans-serif",
    accent: '#dc2626',
    bgClass: '#fafaf9',
    maxWidth: '820px',
    lineHeight: '1.75',
    fontSize: '16px',
  },
  technical: {
    name: '技术文档',
    fontFamily: "'JetBrains Mono', 'Sora', monospace",
    accent: '#0ea5e9',
    bgClass: '#0b1020',
    maxWidth: '900px',
    lineHeight: '1.7',
    fontSize: '15px',
  },
  notebook: {
    name: '手账笔记',
    fontFamily: "'Plus Jakarta Sans', 'Noto Sans SC', sans-serif",
    accent: '#7c3aed',
    bgClass: '#fffbeb',
    maxWidth: '760px',
    lineHeight: '1.85',
    fontSize: '16px',
  },
}

const SAMPLE_DOC = `# 欢迎使用 Markdown 发布器

> 将你的想法一键变为精美的可分享页面。

## 特性亮点

- **多模板切换**：极简白、文章深读、杂志风、技术文档、手账笔记，五种版式任你选
- **实时预览**：左侧编辑，右侧渲染，所见即所得
- **一键导出**：生成独立的 HTML 文件，包含样式、无需依赖
- **文档管理**：本地存储多份文档，随时切换编辑
- **暗色阅读**：预览模式下支持一键切换明暗主题

## 代码块示例

\`\`\`typescript
function greet(name: string): string {
  return \`Hello, \${name}! 欢迎来到 WebLinuxOS.\`;
}
console.log(greet('开发者'));
\`\`\`

## 引用与列表

> 简洁是复杂的终极形式。
> —— 达芬奇

1. 写下你的想法
2. 选择适合的版式
3. 导出为独立 HTML
4. 分享给全世界

## 表格示例

| 模板 | 适用场景 | 字体 |
| ---- | -------- | ---- |
| 极简白 | 日常写作 | Noto Serif |
| 文章深读 | 长文阅读 | Fraunces |
| 技术文档 | 编程教程 | JetBrains Mono |

---

*开始你的创作之旅吧。*
`

const STORAGE_KEY = 'weblinux-md-publisher-docs'

function uid() {
  return Math.random().toString(36).slice(2, 10) + Date.now().toString(36)
}

export default function MarkdownPublisher() {
  const addNotification = useStore(s => s.addNotification)
  const [docs, setDocs] = useState<Document[]>(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY)
      if (raw) return JSON.parse(raw)
    } catch {}
    const first: Document = {
      id: uid(),
      title: '我的第一篇文章',
      content: SAMPLE_DOC,
      createdAt: Date.now(),
      updatedAt: Date.now(),
      template: 'article',
    }
    return [first]
  })
  const [activeId, setActiveId] = useState<string>(() => docs[0]?.id ?? '')
  const [viewMode, setViewMode] = useState<'split' | 'edit' | 'preview'>('split')
  const [darkPreview, setDarkPreview] = useState(false)
  const [copied, setCopied] = useState(false)
  const [sidebarOpen, setSidebarOpen] = useState(true)
  const previewRef = useRef<HTMLDivElement>(null)

  const activeDoc = useMemo(
    () => docs.find(d => d.id === activeId) ?? docs[0],
    [docs, activeId]
  )

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(docs))
    } catch {}
  }, [docs])

  const updateDoc = useCallback((patch: Partial<Document>) => {
    if (!activeDoc) return
    setDocs(prev => prev.map(d =>
      d.id === activeDoc.id
        ? { ...d, ...patch, updatedAt: Date.now() }
        : d
    ))
  }, [activeDoc])

  const newDoc = useCallback(() => {
    const doc: Document = {
      id: uid(),
      title: '未命名文章 ' + (docs.length + 1),
      content: '# 新标题\n\n在这里开始写作……',
      createdAt: Date.now(),
      updatedAt: Date.now(),
      template: 'article',
    }
    setDocs(prev => [doc, ...prev])
    setActiveId(doc.id)
  }, [docs.length])

  const deleteDoc = useCallback((id: string) => {
    if (docs.length <= 1) {
      addNotification({ title: '无法删除', message: '至少保留一份文档', type: 'warning', duration: 2000 })
      return
    }
    const next = docs.find(d => d.id !== id)
    setDocs(prev => prev.filter(d => d.id !== id))
    if (next) setActiveId(next.id)
  }, [docs, addNotification])

  const renderedHTML = useMemo(() => {
    if (!activeDoc) return ''
    try {
      return marked.parse(activeDoc.content, { async: false }) as string
    } catch {
      return activeDoc.content
    }
  }, [activeDoc])

  const tpl = activeDoc ? TEMPLATES[activeDoc.template as TemplateKey] ?? TEMPLATES.article : TEMPLATES.article

  const previewStyle = useMemo((): React.CSSProperties => {
    const bg = darkPreview
      ? (activeDoc?.template === 'technical' ? '#020617' : '#0f172a')
      : tpl.bgClass
    const fg = darkPreview ? '#e2e8f0' : (activeDoc?.template === 'technical' ? '#e2e8f0' : '#111827')
    return {
      background: bg,
      color: fg,
      fontFamily: tpl.fontFamily,
      fontSize: tpl.fontSize,
      lineHeight: tpl.lineHeight,
      padding: '56px 40px',
      minHeight: '100%',
      transition: 'background 0.3s, color 0.3s',
    }
  }, [tpl, darkPreview, activeDoc])

  const innerWrapStyle: React.CSSProperties = {
    maxWidth: tpl.maxWidth,
    margin: '0 auto',
  }

  const buildStandaloneHTML = useCallback(() => {
    if (!activeDoc) return ''
    const bg = darkPreview
      ? (activeDoc.template === 'technical' ? '#020617' : '#0f172a')
      : tpl.bgClass
    const fg = darkPreview ? '#e2e8f0' : (activeDoc.template === 'technical' ? '#e2e8f0' : '#111827')
    return `<!doctype html>
<html lang="zh-CN">
<head>
<meta charset="utf-8" />
<meta name="viewport" content="width=device-width, initial-scale=1" />
<title>${activeDoc.title}</title>
<link rel="preconnect" href="https://fonts.googleapis.com" />
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />
<link href="https://fonts.googleapis.com/css2?family=Fraunces:ital,opsz,wght@0,9..144,400;0,9..144,600;0,9..144,700;1,9..144,400&family=JetBrains+Mono:wght@400;600&family=Outfit:wght@300;400;500;600;700&family=Plus+Jakarta+Sans:wght@400;500;600;700&family=Noto+Serif+SC:wght@400;500;600;700&family=Noto+Sans+SC:wght@400;500;600&display=swap" rel="stylesheet" />
<style>
  :root { color-scheme: ${darkPreview ? 'dark' : 'light'}; }
  * { box-sizing: border-box; }
  body {
    margin: 0;
    background: ${bg};
    color: ${fg};
    font-family: ${tpl.fontFamily};
    font-size: ${tpl.fontSize};
    line-height: ${tpl.lineHeight};
    -webkit-font-smoothing: antialiased;
    -moz-osx-font-smoothing: grayscale;
    padding: 64px 24px 96px;
  }
  main { max-width: ${tpl.maxWidth}; margin: 0 auto; }
  h1 { font-size: 2.2em; font-weight: 700; line-height: 1.2; margin: 0 0 .4em; letter-spacing: -0.02em; }
  h2 { font-size: 1.55em; font-weight: 650; margin: 1.8em 0 .6em; padding-bottom: .3em; border-bottom: 1px solid ${darkPreview ? 'rgba(255,255,255,.1)' : 'rgba(0,0,0,.08)'}; }
  h3 { font-size: 1.22em; font-weight: 600; margin: 1.5em 0 .5em; }
  h4,h5,h6 { margin: 1.3em 0 .4em; }
  p { margin: 1em 0; }
  a { color: ${tpl.accent}; text-decoration: none; border-bottom: 1px dashed currentColor; }
  a:hover { border-bottom-style: solid; }
  strong { font-weight: 650; }
  em { font-style: italic; }
  blockquote {
    margin: 1.4em 0;
    padding: .2em 1.2em;
    border-left: 4px solid ${tpl.accent};
    background: ${darkPreview ? 'rgba(255,255,255,0.04)' : 'rgba(0,0,0,0.03)'};
    border-radius: 0 8px 8px 0;
    color: ${darkPreview ? '#cbd5e1' : '#475569'};
  }
  blockquote p:first-child { margin-top: .5em; }
  blockquote p:last-child { margin-bottom: .5em; }
  ul, ol { padding-left: 1.5em; margin: 1em 0; }
  li { margin: .3em 0; }
  code {
    font-family: 'JetBrains Mono', ui-monospace, monospace;
    font-size: .92em;
    padding: .15em .4em;
    background: ${darkPreview ? 'rgba(255,255,255,0.07)' : 'rgba(0,0,0,0.06)'};
    border-radius: 5px;
  }
  pre {
    margin: 1.4em 0;
    padding: 1.1em 1.2em;
    background: ${darkPreview ? '#020617' : '#0b1020'};
    color: #e2e8f0;
    border-radius: 10px;
    overflow-x: auto;
    box-shadow: 0 8px 30px rgba(0,0,0,.2);
  }
  pre code { background: transparent; padding: 0; color: inherit; font-size: .9em; line-height: 1.7; }
  hr { border: 0; border-top: 1px solid ${darkPreview ? 'rgba(255,255,255,.1)' : 'rgba(0,0,0,.08)'}; margin: 2.4em 0; }
  table { width: 100%; border-collapse: collapse; margin: 1.4em 0; border-radius: 8px; overflow: hidden; font-size: .95em; }
  th, td { padding: .7em 1em; text-align: left; border-bottom: 1px solid ${darkPreview ? 'rgba(255,255,255,.08)' : 'rgba(0,0,0,.07)'}; }
  th { background: ${darkPreview ? 'rgba(255,255,255,.05)' : 'rgba(0,0,0,.04)'}; font-weight: 600; }
  img { max-width: 100%; border-radius: 8px; }
  .doc-title { margin-bottom: .1em; }
  .doc-meta { color: ${darkPreview ? '#64748b' : '#94a3b8'}; font-size: .85em; margin-bottom: 3em; letter-spacing: .02em; }
  ::selection { background: ${tpl.accent}33; }
</style>
</head>
<body>
<main>
  <h1 class="doc-title">${activeDoc.title}</h1>
  <div class="doc-meta">发布于 ${new Date(activeDoc.updatedAt).toLocaleDateString('zh-CN', { year: 'numeric', month: 'long', day: 'numeric' })} · 由 WebLinuxOS Markdown Publisher 生成</div>
  ${renderedHTML}
</main>
</body>
</html>`
  }, [activeDoc, darkPreview, renderedHTML, tpl])

  const copyHTML = useCallback(async () => {
    const html = buildStandaloneHTML()
    try {
      await navigator.clipboard.writeText(html)
      setCopied(true)
      addNotification({ title: '已复制', message: '独立 HTML 已写入剪贴板', type: 'success', duration: 1600 })
      setTimeout(() => setCopied(false), 1800)
    } catch {
      addNotification({ title: '复制失败', message: '请手动使用下载功能', type: 'error', duration: 2000 })
    }
  }, [buildStandaloneHTML, addNotification])

  const downloadHTML = useCallback(() => {
    const html = buildStandaloneHTML()
    const blob = new Blob([html], { type: 'text/html;charset=utf-8' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = (activeDoc?.title ?? 'document').replace(/[^\w\u4e00-\u9fa5-]+/g, '_') + '.html'
    document.body.appendChild(a)
    a.click()
    a.remove()
    URL.revokeObjectURL(url)
    addNotification({ title: '已下载', message: 'HTML 文件已导出', type: 'success', duration: 1600 })
  }, [buildStandaloneHTML, activeDoc, addNotification])

  if (!activeDoc) return null

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', background: 'var(--window-bg)', color: 'var(--text-primary)' }}>
      {/* Top bar */}
      <div style={{
        display: 'flex', alignItems: 'center', gap: 8,
        padding: '10px 14px', borderBottom: '1px solid var(--window-border)',
        background: 'var(--titlebar-bg)',
      }}>
        <button
          onClick={() => setSidebarOpen(s => !s)}
          style={iconBtn}
          title="文档列表"
        >
          <Layout size={15} />
        </button>
        <div style={{ position: 'relative', flex: '0 1 360px' }}>
          <input
            value={activeDoc.title}
            onChange={e => updateDoc({ title: e.target.value })}
            placeholder="文档标题"
            style={{
              width: '100%',
              padding: '7px 12px 7px 34px',
              borderRadius: 8,
              border: '1px solid var(--window-border)',
              background: 'var(--input-bg, rgba(255,255,255,0.04))',
              color: 'var(--text-primary)',
              fontSize: 13,
              outline: 'none',
            }}
          />
          <FileText size={14} style={{ position: 'absolute', left: 11, top: '50%', transform: 'translateY(-50%)', opacity: .5 }} />
        </div>
        <div style={{ flex: 1 }} />
        {/* View toggles */}
        <div style={{
          display: 'inline-flex', padding: 3, borderRadius: 8,
          background: 'rgba(255,255,255,0.04)', border: '1px solid var(--window-border)',
        }}>
          {([
            ['edit', '编辑', Code],
            ['split', '分屏', Eye],
            ['preview', '预览', BookOpen],
          ] as const).map(([mode, label, Icon]) => (
            <button
              key={mode}
              onClick={() => setViewMode(mode)}
              style={{
                ...pillBtn,
                background: viewMode === mode ? 'var(--accent)' : 'transparent',
                color: viewMode === mode ? '#fff' : 'var(--text-primary)',
              }}
            >
              <Icon size={13} />
              <span style={{ fontSize: 12 }}>{label}</span>
            </button>
          ))}
        </div>
        <div style={{ width: 1, height: 22, background: 'var(--window-border)' }} />
        {/* Template picker */}
        <div style={{ position: 'relative' }}>
          <select
            value={activeDoc.template}
            onChange={e => updateDoc({ template: e.target.value })}
            style={selectStyle}
          >
            {(Object.keys(TEMPLATES) as TemplateKey[]).map(k => (
              <option key={k} value={k}>{TEMPLATES[k].name}</option>
            ))}
          </select>
          <ChevronDown size={13} style={{ position: 'absolute', right: 8, top: '50%', transform: 'translateY(-50%)', opacity: .5, pointerEvents: 'none' }} />
        </div>
        <button onClick={() => setDarkPreview(d => !d)} style={iconBtn} title="明暗主题">
          {darkPreview ? <Sun size={15} /> : <Moon size={15} />}
        </button>
        <button onClick={copyHTML} style={iconBtn} title="复制 HTML">
          {copied ? <Check size={15} color="#22c55e" /> : <Copy size={15} />}
        </button>
        <button onClick={downloadHTML} style={{ ...iconBtn, background: 'var(--accent)', color: '#fff' }} title="下载 HTML">
          <Download size={15} />
        </button>
      </div>

      <div style={{ display: 'flex', flex: 1, minHeight: 0 }}>
        {/* Sidebar */}
        {sidebarOpen && (
          <div style={{
            width: 230, borderRight: '1px solid var(--window-border)',
            background: 'rgba(255,255,255,0.02)',
            display: 'flex', flexDirection: 'column',
          }}>
            <div style={{ padding: '10px 12px', display: 'flex', gap: 6 }}>
              <button onClick={newDoc} style={{ ...primaryBtn, flex: 1 }}>
                <Plus size={14} />
                <span style={{ fontSize: 12 }}>新建文档</span>
              </button>
            </div>
            <div style={{
              padding: '4px 8px', fontSize: 10, letterSpacing: .08,
              color: 'var(--text-secondary)', textTransform: 'uppercase',
            }}>
              文档 · {docs.length}
            </div>
            <div style={{ overflow: 'auto', padding: '0 6px 10px', flex: 1 }}>
              {docs.map(d => {
                const isActive = d.id === activeId
                return (
                  <div
                    key={d.id}
                    onClick={() => setActiveId(d.id)}
                    style={{
                      display: 'flex', alignItems: 'center', gap: 8,
                      padding: '8px 10px', borderRadius: 7,
                      cursor: 'pointer', marginBottom: 2,
                      background: isActive ? 'color-mix(in srgb, var(--accent) 20%, transparent)' : 'transparent',
                      border: '1px solid ' + (isActive ? 'color-mix(in srgb, var(--accent) 50%, transparent)' : 'transparent'),
                    }}
                  >
                    <FileText size={14} style={{ opacity: .6, flexShrink: 0 }} />
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{
                        fontSize: 13, fontWeight: 500,
                        overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                      }}>{d.title || '（无标题）'}</div>
                      <div style={{ fontSize: 10, color: 'var(--text-secondary)', marginTop: 1 }}>
                        {new Date(d.updatedAt).toLocaleDateString('zh-CN')}
                      </div>
                    </div>
                    <button
                      onClick={e => { e.stopPropagation(); deleteDoc(d.id) }}
                      style={{ ...iconBtn, padding: 3, opacity: .6 }}
                      title="删除"
                    >
                      <Trash2 size={12} />
                    </button>
                  </div>
                )
              })}
            </div>
          </div>
        )}

        {/* Main content */}
        <div style={{ flex: 1, display: 'flex', minWidth: 0 }}>
          {/* Editor */}
          {(viewMode === 'edit' || viewMode === 'split') && (
            <div style={{
              flex: 1, display: 'flex', flexDirection: 'column',
              borderRight: viewMode === 'split' ? '1px solid var(--window-border)' : 'none',
              minWidth: 0,
            }}>
              <div style={editorHeader}>
                <Code size={13} style={{ opacity: .6 }} />
                <span>Markdown</span>
                <div style={{ flex: 1 }} />
                <span style={{ fontSize: 11, color: 'var(--text-secondary)' }}>
                  {activeDoc.content.length} 字符
                </span>
              </div>
              <textarea
                value={activeDoc.content}
                onChange={e => updateDoc({ content: e.target.value })}
                spellCheck={false}
                style={{
                  flex: 1, resize: 'none', border: 0, outline: 'none',
                  padding: '20px 28px', fontFamily: "'JetBrains Mono', ui-monospace, monospace",
                  fontSize: 14, lineHeight: 1.7, background: 'transparent',
                  color: 'var(--text-primary)',
                }}
              />
            </div>
          )}
          {/* Preview */}
          {(viewMode === 'preview' || viewMode === 'split') && (
            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minWidth: 0, overflow: 'auto' }} ref={previewRef}>
              <div style={editorHeader}>
                <Eye size={13} style={{ opacity: .6 }} />
                <span>预览 · {tpl.name}</span>
                <div style={{ flex: 1 }} />
                <span style={{ fontSize: 11, color: 'var(--text-secondary)' }}>
                  {darkPreview ? '暗色' : '亮色'}
                </span>
              </div>
              <div style={previewStyle}>
                <div style={innerWrapStyle} dangerouslySetInnerHTML={{ __html: renderedHTML }} />
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

const iconBtn: React.CSSProperties = {
  width: 32, height: 32, display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
  borderRadius: 7, border: '1px solid var(--window-border)',
  background: 'rgba(255,255,255,0.03)', color: 'var(--text-primary)',
  cursor: 'pointer', transition: 'all .15s',
}

const primaryBtn: React.CSSProperties = {
  display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: 6,
  padding: '7px 12px', borderRadius: 7, border: 0, cursor: 'pointer',
  background: 'var(--accent)', color: '#fff', fontSize: 12, fontWeight: 500,
}

const pillBtn: React.CSSProperties = {
  display: 'inline-flex', alignItems: 'center', gap: 5, padding: '5px 10px',
  borderRadius: 6, border: 0, cursor: 'pointer', fontWeight: 500,
}

const selectStyle: React.CSSProperties = {
  padding: '7px 28px 7px 10px', borderRadius: 7,
  border: '1px solid var(--window-border)',
  background: 'rgba(255,255,255,0.03)', color: 'var(--text-primary)',
  fontSize: 12, outline: 'none', appearance: 'none', cursor: 'pointer',
}

const editorHeader: React.CSSProperties = {
  display: 'flex', alignItems: 'center', gap: 8,
  padding: '8px 16px', fontSize: 12,
  color: 'var(--text-secondary)',
  borderBottom: '1px solid var(--window-border)',
  background: 'rgba(255,255,255,0.02)',
}
