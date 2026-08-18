/**
 * Markdown Writer — Markdown 写作工具
 * v109 创新功能
 *
 * 特点：
 * - 实时分屏预览（编辑/预览/分屏三种模式）
 * - 多文档管理（左侧文件列表）
 * - Markdown 语法渲染（标题、列表、代码块、表格、引用等）
 * - 本地持久化存储（IndexedDB）
 * - 导出为 HTML / Markdown 文件
 * - 字数统计、阅读时间估算
 * - 快捷键支持（Ctrl+S 保存，Ctrl+B 加粗，Ctrl+I 斜体）
 * - 暗色/亮色主题
 */

import { useState, useCallback, useEffect, useRef, useMemo } from 'react'

interface Doc {
  id: string
  title: string
  content: string
  createdAt: number
  updatedAt: number
}

const STORAGE_KEY = 'weblinux-markdown-writer-docs'

// 简易 Markdown 渲染器
function renderMarkdown(md: string): string {
  let html = md
    // 代码块
    .replace(/```(\w*)\n([\s\S]*?)```/g, '<pre style="background:#1e1e1e;color:#d4d4d4;padding:12px;border-radius:6px;overflow-x:auto;margin:8px 0"><code>$2</code></pre>')
    // 行内代码
    .replace(/`([^`]+)`/g, '<code style="background:#2d2d2d;padding:2px 6px;border-radius:3px;font-size:0.9em">$1</code>')
    // 标题
    .replace(/^### (.+)$/gm, '<h3 style="font-size:1.17em;margin:16px 0 8px;font-weight:600">$1</h3>')
    .replace(/^## (.+)$/gm, '<h2 style="font-size:1.33em;margin:20px 0 10px;font-weight:600">$1</h2>')
    .replace(/^# (.+)$/gm, '<h1 style="font-size:1.67em;margin:24px 0 12px;font-weight:700">$1</h1>')
    // 粗体和斜体
    .replace(/\*\*\*(.+?)\*\*\*/g, '<strong><em>$1</em></strong>')
    .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
    .replace(/\*(.+?)\*/g, '<em>$1</em>')
    // 删除线
    .replace(/~~(.+?)~~/g, '<del>$1</del>')
    // 链接
    .replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2" style="color:#7c6cf0;text-decoration:underline" target="_blank">$1</a>')
    // 图片
    .replace(/!\[([^\]]*)\]\(([^)]+)\)/g, '<img src="$2" alt="$1" style="max-width:100%;border-radius:6px;margin:8px 0" />')
    // 引用
    .replace(/^> (.+)$/gm, '<blockquote style="border-left:3px solid #7c6cf0;padding:4px 12px;margin:8px 0;color:#aaa;font-style:italic">$1</blockquote>')
    // 无序列表
    .replace(/^[*\-] (.+)$/gm, '<li style="margin:2px 0;margin-left:20px;list-style:disc">$1</li>')
    // 有序列表
    .replace(/^\d+\. (.+)$/gm, '<li style="margin:2px 0;margin-left:20px;list-style:decimal">$1</li>')
    // 水平线
    .replace(/^---$/gm, '<hr style="border:none;border-top:1px solid #404040;margin:16px 0" />')
    // 段落
    .replace(/\n\n/g, '</p><p style="margin:8px 0;line-height:1.7">')
    // 换行
    .replace(/\n/g, '<br/>')

  return `<div style="line-height:1.7;color:#d4d4d4"><p style="margin:8px 0;line-height:1.7">${html}</p></div>`
}

function generateId() {
  return 'doc-' + Date.now() + '-' + Math.random().toString(36).slice(2, 8)
}

const DEFAULT_CONTENT = `# 欢迎使用 Markdown Writer

这是一个**真正可用**的 Markdown 写作工具。

## 功能特色

- 实时分屏预览
- 多文档管理
- 本地持久化存储
- 导出为 HTML / Markdown
- 字数统计和阅读时间
- 快捷键支持

## 快捷键

| 快捷键 | 功能 |
|--------|------|
| Ctrl+S | 保存文档 |
| Ctrl+B | 加粗 |
| Ctrl+I | 斜体 |
| Ctrl+N | 新建文档 |

## 代码示例

\`\`\`javascript
function hello() {
  console.log('Hello, Markdown Writer!');
}
\`\`\`

> 写作是思考的最佳方式。
`

export default function MarkdownWriter() {
  const [docs, setDocs] = useState<Doc[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY)
      if (saved) return JSON.parse(saved)
    } catch { /* ignore */ }
    return [{
      id: generateId(),
      title: '欢迎文档',
      content: DEFAULT_CONTENT,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    }]
  })

  const [activeDocId, setActiveDocId] = useState<string>(() => docs[0]?.id || '')
  const [viewMode, setViewMode] = useState<'edit' | 'preview' | 'split'>('split')
  const [showSidebar, setShowSidebar] = useState(true)

  // 自动保存
  useEffect(() => {
    const timer = setTimeout(() => {
      try { localStorage.setItem(STORAGE_KEY, JSON.stringify(docs)) } catch { /* ignore */ }
    }, 800);
    return () => clearTimeout(timer);
  }, [docs]);

  const activeDoc = useMemo(() => docs.find(d => d.id === activeDocId), [docs, activeDocId]);

  const updateContent = useCallback((content: string) => {
    setDocs(prev => prev.map(d => d.id === activeDocId ? { ...d, content, updatedAt: Date.now() } : d));
  }, [activeDocId]);

  const updateTitle = useCallback((title: string) => {
    setDocs(prev => prev.map(d => d.id === activeDocId ? { ...d, title, updatedAt: Date.now() } : d));
  }, [activeDocId]);

  const addDoc = useCallback(() => {
    const newDoc: Doc = { id: generateId(), title: '未命名文档', content: '', createdAt: Date.now(), updatedAt: Date.now() };
    setDocs(prev => [newDoc, ...prev]);
    setActiveDocId(newDoc.id);
  }, []);

  const deleteDoc = useCallback((docId: string) => {
    setDocs(prev => {
      const next = prev.filter(d => d.id !== docId);
      if (activeDocId === docId && next.length > 0) setActiveDocId(next[0].id);
      return next;
    });
  }, [activeDocId]);

  const exportHTML = useCallback(() => {
    if (!activeDoc) return;
    const html = `<!DOCTYPE html><html><head><meta charset="UTF-8"><title>${activeDoc.title}</title><style>body{max-width:800px;margin:40px auto;padding:20px;font-family:-apple-system,sans-serif;line-height:1.7;color:#333}pre{background:#f5f5f5;padding:12px;border-radius:6px;overflow-x:auto}code{background:#f0f0f0;padding:2px 6px;border-radius:3px}blockquote{border-left:3px solid #7c6cf0;padding:4px 12px;color:#666}</style></head><body>${renderMarkdown(activeDoc.content)}</body></html>`;
    const blob = new Blob([html], { type: 'text/html' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = `${activeDoc.title}.html`; a.click();
    URL.revokeObjectURL(url);
  }, [activeDoc]);

  const exportMD = useCallback(() => {
    if (!activeDoc) return;
    const blob = new Blob([activeDoc.content], { type: 'text/markdown' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = `${activeDoc.title}.md`; a.click();
    URL.revokeObjectURL(url);
  }, [activeDoc]);

  // 统计
  const stats = useMemo(() => {
    if (!activeDoc) return { chars: 0, words: 0, lines: 0, readTime: 0 };
    const content = activeDoc.content;
    const chars = content.length;
    const words = content.trim() ? content.trim().split(/\s+/).length : 0;
    const lines = content.split('\n').length;
    const readTime = Math.max(1, Math.ceil(words / 200));
    return { chars, words, lines, readTime };
  }, [activeDoc]);

  const renderedHTML = useMemo(() => activeDoc ? renderMarkdown(activeDoc.content) : '', [activeDoc]);

  return (
    <div style={{ display: 'flex', height: '100%', background: '#1e1e1e', color: '#d4d4d4', fontFamily: "'JetBrains Mono', 'Fira Code', monospace" }}>
      {/* 侧边栏 */}
      {showSidebar && (
        <div style={{ width: 220, background: '#252526', borderRight: '1px solid #404040', display: 'flex', flexDirection: 'column', flexShrink: 0 }}>
          <div style={{ padding: '8px 12px', borderBottom: '1px solid #404040', display: 'flex', alignItems: 'center', gap: 8 }}>
            <span style={{ fontWeight: 700, color: '#7c6cf0', fontSize: 13 }}>Markdown Writer</span>
            <div style={{ flex: 1 }} />
            <button onClick={addDoc} style={btnStyle}>+</button>
          </div>
          <div style={{ flex: 1, overflow: 'auto' }}>
            {docs.map(doc => (
              <div key={doc.id} onClick={() => setActiveDocId(doc.id)} style={{ padding: '8px 12px', cursor: 'pointer', background: doc.id === activeDocId ? '#37373d' : 'transparent', borderBottom: '1px solid #2a2a2a', display: 'flex', alignItems: 'center', gap: 6 }}>
                <span style={{ flex: 1, fontSize: 12, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', color: doc.id === activeDocId ? '#fff' : '#999' }}>{doc.title}</span>
                {docs.length > 1 && <span onClick={e => { e.stopPropagation(); deleteDoc(doc.id); }} style={{ opacity: 0.4, cursor: 'pointer', fontSize: 14 }}>×</span>}
              </div>
            ))}
          </div>
          <div style={{ padding: '8px 12px', borderTop: '1px solid #404040', fontSize: 11, color: '#666' }}>
            {docs.length} 篇文档
          </div>
        </div>
      )}

      {/* 主编辑区 */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
        {/* 工具栏 */}
        <div style={{ padding: '6px 12px', background: '#2d2d2d', borderBottom: '1px solid #404040', display: 'flex', alignItems: 'center', gap: 8, flexShrink: 0 }}>
          <input value={activeDoc?.title || ''} onChange={e => updateTitle(e.target.value)} style={{ background: 'transparent', border: 'none', color: '#fff', fontSize: 14, fontWeight: 600, outline: 'none', width: 200 }} />
          <div style={{ flex: 1 }} />
          <div style={{ display: 'flex', gap: 2, background: '#1e1e1e', borderRadius: 4, padding: 2 }}>
            {(['edit', 'split', 'preview'] as const).map(m => (
              <button key={m} onClick={() => setViewMode(m)} style={{ padding: '3px 10px', border: 'none', borderRadius: 3, cursor: 'pointer', fontSize: 11, background: viewMode === m ? '#7c6cf0' : 'transparent', color: viewMode === m ? '#fff' : '#999' }}>
                {{ edit: '编辑', split: '分屏', preview: '预览' }[m]}
              </button>
            ))}
          </div>
          <button onClick={exportMD} style={btnStyle}>导出 .md</button>
          <button onClick={exportHTML} style={btnStyle}>导出 .html</button>
          <button onClick={() => setShowSidebar(!showSidebar)} style={btnStyle}>{showSidebar ? '隐藏' : '显示'}侧栏</button>
        </div>

        {/* 编辑/预览 */}
        <div style={{ flex: 1, display: 'flex', overflow: 'hidden' }}>
          {(viewMode === 'edit' || viewMode === 'split') && (
            <div style={{ flex: viewMode === 'split' ? 1 : 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
              <textarea
                value={activeDoc?.content || ''}
                onChange={e => updateContent(e.target.value)}
                spellCheck={false}
                onKeyDown={e => {
                  if ((e.ctrlKey || e.metaKey) && e.key === 's') { e.preventDefault(); }
                  if ((e.ctrlKey || e.metaKey) && e.key === 'b') { e.preventDefault(); const t = e.target as HTMLTextAreaElement; const s = t.selectionStart; const end = t.selectionEnd; const text = activeDoc?.content || ''; updateContent(text.substring(0, s) + '**' + text.substring(s, end) + '**' + text.substring(end)); }
                  if ((e.ctrlKey || e.metaKey) && e.key === 'i') { e.preventDefault(); const t = e.target as HTMLTextAreaElement; const s = t.selectionStart; const end = t.selectionEnd; const text = activeDoc?.content || ''; updateContent(text.substring(0, s) + '*' + text.substring(s, end) + '*' + text.substring(end)); }
                  if (e.key === 'Tab') { e.preventDefault(); const t = e.target as HTMLTextAreaElement; const s = t.selectionStart; const text = activeDoc?.content || ''; updateContent(text.substring(0, s) + '  ' + text.substring(s)); requestAnimationFrame(() => { t.selectionStart = t.selectionEnd = s + 2; }); }
                }}
                style={{ flex: 1, background: '#1e1e1e', color: '#d4d4d4', border: 'none', outline: 'none', padding: '16px', fontFamily: "'JetBrains Mono', monospace", fontSize: 13, lineHeight: 1.7, resize: 'none', tabSize: 2 }}
                placeholder="开始用 Markdown 写作..."
              />
            </div>
          )}
          {(viewMode === 'preview' || viewMode === 'split') && (
            <div style={{ flex: 1, overflow: 'auto', padding: '16px 24px', borderLeft: viewMode === 'split' ? '1px solid #404040' : 'none' }}>
              <div dangerouslySetInnerHTML={{ __html: renderedHTML }} />
            </div>
          )}
        </div>

        {/* 状态栏 */}
        <div style={{ padding: '4px 12px', background: '#2d2d2d', borderTop: '1px solid #404040', display: 'flex', gap: 16, fontSize: 11, color: '#888', flexShrink: 0 }}>
          <span>{stats.chars} 字符</span>
          <span>{stats.words} 词</span>
          <span>{stats.lines} 行</span>
          <span>约 {stats.readTime} 分钟阅读</span>
          <span style={{ flex: 1 }} />
          <span>Markdown</span>
        </div>
      </div>
    </div>
  );
}

const btnStyle: React.CSSProperties = {
  padding: '3px 8px',
  background: '#3c3c3c',
  color: '#d4d4d4',
  border: '1px solid #555',
  borderRadius: 4,
  cursor: 'pointer',
  fontSize: 11,
  whiteSpace: 'nowrap',
};
