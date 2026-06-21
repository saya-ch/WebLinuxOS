import { useState, useEffect, useCallback, useMemo, useRef, memo } from 'react'

// ============================================================
// WebClipper - 网页内容收藏与高亮注释
// 抓取 HTML → 转纯文本 → 智能摘要 → 高亮标注 → 标签 / 收藏
// 数据持久化到 localStorage，支持导入 / 导出 Markdown
// ============================================================

interface Highlight {
  id: string
  start: number
  end: number
  text: string
  note: string
  color: string
  createdAt: number
}

interface Clip {
  id: string
  url: string
  title: string
  author: string
  publishedAt: string
  description: string
  content: string
  highlights: Highlight[]
  tags: string[]
  archived: boolean
  favorite: boolean
  createdAt: number
  fetchStatus: 'pending' | 'success' | 'error' | 'manual'
  fetchError?: string
}

const STORAGE_KEY = 'weblinux-web-clipper-v1'
const HIGHLIGHT_COLORS = ['#fde68a', '#bbf7d0', '#bfdbfe', '#fbcfe8', '#fed7aa']

const loadClips = (): Clip[] => {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return []
    const parsed = JSON.parse(raw)
    if (!Array.isArray(parsed)) return []
    return parsed
  } catch {
    return []
  }
}

const saveClips = (clips: Clip[]) => {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(clips))
  } catch {
    // 容量溢出时静默失败
  }
}

// 简易 HTML → 文本转换（保留段落、列表结构）
const htmlToText = (html: string): string => {
  const div = document.createElement('div')
  div.innerHTML = html
  // 移除 script / style
  div.querySelectorAll('script, style, noscript, iframe').forEach((el) => el.remove())
  // 块级元素换行
  div.querySelectorAll('br').forEach((el) => el.replaceWith(document.createTextNode('\n')))
  div.querySelectorAll('p, div, li, h1, h2, h3, h4, h5, h6, blockquote, pre').forEach((el) => {
    el.appendChild(document.createTextNode('\n'))
  })
  let text = (div.textContent || '').replace(/\n{3,}/g, '\n\n')
  return text.trim()
}

// 从 HTML 提取正文（粗略）
const extractArticle = (html: string): { title: string; description: string; content: string; author: string; publishedAt: string } => {
  const doc = new DOMParser().parseFromString(html, 'text/html')

  const title =
    doc.querySelector('meta[property="og:title"]')?.getAttribute('content') ||
    doc.querySelector('meta[name="twitter:title"]')?.getAttribute('content') ||
    doc.querySelector('title')?.textContent ||
    '（无标题）'

  const description =
    doc.querySelector('meta[property="og:description"]')?.getAttribute('content') ||
    doc.querySelector('meta[name="twitter:description"]')?.getAttribute('content') ||
    doc.querySelector('meta[name="description"]')?.getAttribute('content') ||
    ''

  const author =
    doc.querySelector('meta[name="author"]')?.getAttribute('content') ||
    doc.querySelector('meta[property="article:author"]')?.getAttribute('content') ||
    ''

  const publishedAt =
    doc.querySelector('meta[property="article:published_time"]')?.getAttribute('content') ||
    doc.querySelector('meta[name="pubdate"]')?.getAttribute('content') ||
    doc.querySelector('meta[name="date"]')?.getAttribute('content') ||
    ''

  // 寻找主体
  const candidates = [
    'article',
    'main',
    '[role="main"]',
    '.post-content',
    '.article-content',
    '.article-body',
    '.content',
    '#content',
  ]
  let contentEl: Element | null = null
  for (const sel of candidates) {
    contentEl = doc.querySelector(sel)
    if (contentEl) break
  }
  const content = htmlToText(contentEl?.innerHTML || doc.body?.innerHTML || '')

  return { title: title.trim(), description: description.trim(), content, author: author.trim(), publishedAt: publishedAt.trim() }
}

// 通过 CORS 代理抓取（GitHub Pages 静态站，无后端）
const FETCH_PROXIES = [
  (url: string) => `https://corsproxy.io/?${encodeURIComponent(url)}`,
  (url: string) => `https://api.allorigins.win/raw?url=${encodeURIComponent(url)}`,
  (url: string) => `https://api.codetabs.com/v1/proxy?quest=${encodeURIComponent(url)}`,
]

const fetchWithProxy = async (url: string, signal?: AbortSignal): Promise<string> => {
  let lastError = ''
  for (const make of FETCH_PROXIES) {
    try {
      const res = await fetch(make(url), { signal })
      if (!res.ok) {
        lastError = `HTTP ${res.status}`
        continue
      }
      const text = await res.text()
      if (text && text.length > 100) return text
      lastError = '响应为空'
    } catch (e) {
      if ((e as Error).name === 'AbortError') throw e
      lastError = (e as Error).message
    }
  }
  throw new Error(lastError || '所有代理均不可用')
}

// 简易摘要：取前几句话作为预览
const summarize = (text: string, maxLen = 240): string => {
  const clean = text.replace(/\s+/g, ' ').trim()
  if (clean.length <= maxLen) return clean
  const cut = clean.slice(0, maxLen)
  const lastPeriod = Math.max(cut.lastIndexOf('。'), cut.lastIndexOf('.'), cut.lastIndexOf('！'), cut.lastIndexOf('!'))
  if (lastPeriod > 80) return cut.slice(0, lastPeriod + 1)
  return cut + '...'
}

const formatDate = (ts: number) => {
  const d = new Date(ts)
  const now = Date.now()
  const diff = now - ts
  if (diff < 60_000) return '刚刚'
  if (diff < 3_600_000) return `${Math.floor(diff / 60_000)} 分钟前`
  if (diff < 86_400_000) return `${Math.floor(diff / 3_600_000)} 小时前`
  if (diff < 7 * 86_400_000) return `${Math.floor(diff / 86_400_000)} 天前`
  return d.toLocaleDateString()
}

const WebClipper = () => {
  const [clips, setClips] = useState<Clip[]>(() => loadClips())
  const [activeId, setActiveId] = useState<string | null>(null)
  const [urlInput, setUrlInput] = useState('')
  const [search, setSearch] = useState('')
  const [tagFilter, setTagFilter] = useState<string | null>(null)
  const [showFavorites, setShowFavorites] = useState(false)
  const [fetching, setFetching] = useState(false)
  const [fetchProgress, setFetchProgress] = useState('')
  const [showAdd, setShowAdd] = useState(false)
  const [manualContent, setManualContent] = useState('')
  const [manualTitle, setManualTitle] = useState('')
  const [editTags, setEditTags] = useState('')
  const containerRef = useRef<HTMLDivElement>(null)

  // 持久化
  useEffect(() => {
    saveClips(clips)
  }, [clips])

  // 选中文本 → 高亮
  useEffect(() => {
    if (!activeId) return
    const handler = () => {
      const sel = window.getSelection()
      if (!sel || sel.isCollapsed) return
      const text = sel.toString()
      if (!text || text.length < 2) return
      // 检查选区是否在 clipper 容器内
      const node = sel.anchorNode
      if (!node || !containerRef.current?.contains(node)) return
      // 显示添加高亮按钮
      const range = sel.getRangeAt(0)
      const rect = range.getBoundingClientRect()
      const floater = document.getElementById('kg-floater')
      if (floater) {
        floater.style.display = 'block'
        floater.style.left = `${rect.left + window.scrollX}px`
        floater.style.top = `${rect.bottom + window.scrollY + 6}px`
      }
    }
    document.addEventListener('mouseup', handler)
    return () => document.removeEventListener('mouseup', handler)
  }, [activeId])

  // 全部标签
  const allTags = useMemo(() => {
    const m = new Map<string, number>()
    for (const c of clips) for (const t of c.tags) m.set(t, (m.get(t) || 0) + 1)
    return Array.from(m.entries()).sort((a, b) => b[1] - a[1])
  }, [clips])

  // 过滤
  const visibleClips = useMemo(() => {
    const q = search.trim().toLowerCase()
    return clips
      .filter((c) => {
        if (showFavorites && !c.favorite) return false
        if (c.archived) return false
        if (tagFilter && !c.tags.includes(tagFilter)) return false
        if (!q) return true
        return (
          c.title.toLowerCase().includes(q) ||
          c.content.toLowerCase().includes(q) ||
          c.description.toLowerCase().includes(q) ||
          c.tags.some((t) => t.toLowerCase().includes(q))
        )
      })
      .sort((a, b) => b.createdAt - a.createdAt)
  }, [clips, search, tagFilter, showFavorites])

  const activeClip = activeId ? clips.find((c) => c.id === activeId) || null : null

  // 抓取 URL
  const doFetch = useCallback(async () => {
    const url = urlInput.trim()
    if (!url) return
    if (!/^https?:\/\//i.test(url)) {
      alert('请输入以 http:// 或 https:// 开头的 URL')
      return
    }
    setFetching(true)
    setFetchProgress('通过 CORS 代理抓取...')
    try {
      const html = await fetchWithProxy(url)
      setFetchProgress('解析 HTML...')
      const article = extractArticle(html)
      const id = 'clip-' + Date.now().toString(36) + Math.random().toString(36).slice(2, 6)
      const clip: Clip = {
        id,
        url,
        title: article.title,
        description: article.description || summarize(article.content),
        content: article.content,
        highlights: [],
        tags: extractTags(article.title + ' ' + article.description + ' ' + article.content),
        archived: false,
        favorite: false,
        createdAt: Date.now(),
        fetchStatus: 'success',
        author: article.author,
        publishedAt: article.publishedAt,
      }
      setClips((prev) => [clip, ...prev])
      setActiveId(id)
      setUrlInput('')
      setShowAdd(false)
    } catch (e) {
      const errMsg = (e as Error).message
      setFetchProgress(`抓取失败：${errMsg}。你可以手动粘贴内容。`)
    } finally {
      setFetching(false)
      setTimeout(() => setFetchProgress(''), 3500)
    }
  }, [urlInput])

  // 手动添加
  const doManualAdd = useCallback(() => {
    if (!manualTitle.trim() || !manualContent.trim()) {
      alert('请填写标题和内容')
      return
    }
    const id = 'clip-' + Date.now().toString(36) + Math.random().toString(36).slice(2, 6)
    const clip: Clip = {
      id,
      url: '',
      title: manualTitle.trim(),
      description: summarize(manualContent),
      content: manualContent.trim(),
      highlights: [],
      tags: extractTags(manualTitle + ' ' + manualContent),
      archived: false,
      favorite: false,
      createdAt: Date.now(),
      fetchStatus: 'manual',
      author: '',
      publishedAt: '',
    }
    setClips((prev) => [clip, ...prev])
    setActiveId(id)
    setManualContent('')
    setManualTitle('')
    setShowAdd(false)
  }, [manualTitle, manualContent])

  // 简易关键词提取（高频词）
  const STOP_WORDS = new Set([
    'the', 'a', 'an', 'is', 'are', 'was', 'were', 'be', 'been', 'being', 'to', 'of', 'in', 'on',
    'for', 'with', 'at', 'by', 'from', 'as', 'and', 'or', 'but', 'if', 'this', 'that', 'it',
    'we', 'you', 'i', 'he', 'she', 'they', 'them', 'our', 'your', 'my', 'his', 'her', 'its',
    '的', '了', '在', '是', '我', '你', '他', '她', '它', '们', '和', '与', '或', '但', '就',
    '也', '都', '很', '有', '没', '不', '对', '这', '那', '一个', '一些', '可以', '应该',
  ])

  const extractTags = (text: string): string[] => {
    const words = text.toLowerCase().match(/[\p{L}][\p{L}\d]{2,}/gu) || []
    const freq = new Map<string, number>()
    for (const w of words) {
      if (STOP_WORDS.has(w)) continue
      if (w.length < 3) continue
      freq.set(w, (freq.get(w) || 0) + 1)
    }
    return Array.from(freq.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([w]) => w)
  }

  // 添加高亮
  const addHighlight = useCallback(
    (text: string, color: string) => {
      if (!activeClip) return
      const start = activeClip.content.indexOf(text)
      if (start === -1) {
        alert('选区文本未在正文中找到，可能跨段或被截断。')
        return
      }
      const highlight: Highlight = {
        id: 'hl-' + Date.now().toString(36),
        start,
        end: start + text.length,
        text,
        note: '',
        color,
        createdAt: Date.now(),
      }
      setClips((prev) =>
        prev.map((c) => (c.id === activeClip.id ? { ...c, highlights: [...c.highlights, highlight] } : c))
      )
      const floater = document.getElementById('kg-floater')
      if (floater) floater.style.display = 'none'
      window.getSelection()?.removeAllRanges()
    },
    [activeClip]
  )

  // 渲染带高亮的正文
  const renderContent = useMemo(() => {
    if (!activeClip) return ''
    if (activeClip.highlights.length === 0) {
      return activeClip.content
        .split('\n\n')
        .map((p) => `<p>${escapeHtml(p).replace(/\n/g, '<br/>')}</p>`)
        .join('')
    }
    // 合并高亮区间
    const sorted = [...activeClip.highlights].sort((a, b) => a.start - b.start)
    const merged: { start: number; end: number; color: string; note: string; id: string }[] = []
    for (const h of sorted) {
      const last = merged[merged.length - 1]
      if (last && h.start < last.end) {
        // 重叠：合并
        last.end = Math.max(last.end, h.end)
        last.color = h.color
        last.note = h.note || last.note
        last.id += ',' + h.id
      } else {
        merged.push({ start: h.start, end: h.end, color: h.color, note: h.note, id: h.id })
      }
    }
    const text = activeClip.content
    let result = ''
    let cursor = 0
    for (const seg of merged) {
      if (cursor < seg.start) {
        result += escapeHtml(text.slice(cursor, seg.start))
      }
      const slice = text.slice(seg.start, seg.end)
      const title = seg.note ? ` title="${escapeHtml(seg.note)}"` : ''
      result += `<mark class="hl" data-id="${seg.id}" style="background:${seg.color};cursor:pointer;padding:0 2px;border-radius:2px;"${title}>${escapeHtml(slice)}</mark>`
      cursor = seg.end
    }
    if (cursor < text.length) {
      result += escapeHtml(text.slice(cursor))
    }
    // 按段落包装
    return result.split(/\n{2,}/).map((p) => `<p>${p.replace(/\n/g, '<br/>')}</p>`).join('')
  }, [activeClip])

  // 删除 / 归档 / 收藏
  const toggleArchive = useCallback((id: string) => {
    setClips((prev) => prev.map((c) => (c.id === id ? { ...c, archived: !c.archived } : c)))
  }, [])
  const toggleFavorite = useCallback((id: string) => {
    setClips((prev) => prev.map((c) => (c.id === id ? { ...c, favorite: !c.favorite } : c)))
  }, [])
  const deleteClip = useCallback((id: string) => {
    if (!confirm('确定要永久删除这条收藏？')) return
    setClips((prev) => prev.filter((c) => c.id !== id))
    setActiveId((cur) => (cur === id ? null : cur))
  }, [])

  // 更新标签
  const saveTags = useCallback(() => {
    if (!activeClip) return
    const tags = editTags
      .split(/[,，]/)
      .map((s) => s.trim())
      .filter(Boolean)
    setClips((prev) => prev.map((c) => (c.id === activeClip.id ? { ...c, tags } : c)))
  }, [activeClip, editTags])

  useEffect(() => {
    if (activeClip) setEditTags(activeClip.tags.join(', '))
  }, [activeClip?.id])

  // 导出 Markdown
  const exportMarkdown = useCallback(() => {
    if (!activeClip) return
    const md = generateMarkdown(activeClip)
    const blob = new Blob([md], { type: 'text/markdown' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `${activeClip.title.replace(/[^\w\u4e00-\u9fa5]+/g, '-').slice(0, 50)}.md`
    a.click()
    URL.revokeObjectURL(url)
  }, [activeClip])

  const generateMarkdown = (c: Clip): string => {
    const lines: string[] = []
    lines.push(`# ${c.title}`)
    lines.push('')
    if (c.url) lines.push(`> 来源：${c.url}`)
    if (c.author) lines.push(`> 作者：${c.author}`)
    if (c.publishedAt) lines.push(`> 发布：${c.publishedAt}`)
    if (c.tags.length) lines.push(`> 标签：${c.tags.map((t) => '#' + t).join(' ')}`)
    lines.push('')
    if (c.description) {
      lines.push(`## 摘要`)
      lines.push(c.description)
      lines.push('')
    }
    if (c.highlights.length) {
      lines.push(`## 高亮笔记`)
      for (const h of c.highlights) {
        lines.push(`- > ${h.text}${h.note ? `\n  - 💡 ${h.note}` : ''}`)
      }
      lines.push('')
    }
    lines.push(`## 正文`)
    lines.push(c.content)
    return lines.join('\n')
  }

  // 一键导出全部
  const exportAllMarkdown = useCallback(() => {
    if (clips.length === 0) return
    const all = clips.map(generateMarkdown).join('\n\n---\n\n')
    const blob = new Blob([all], { type: 'text/markdown' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `web-clips-${new Date().toISOString().slice(0, 10)}.md`
    a.click()
    URL.revokeObjectURL(url)
  }, [clips])

  return (
    <div
      ref={containerRef}
      className="app-container"
      style={{
        display: 'grid',
        gridTemplateColumns: '320px 1fr',
        height: '100%',
        background: 'linear-gradient(180deg, #0f0f1a 0%, #1a1a2e 100%)',
        color: '#e0e0e8',
        fontSize: 14,
      }}
    >
      {/* === 左侧：收藏列表 === */}
      <aside
        style={{
          borderRight: '1px solid rgba(255,255,255,0.06)',
          background: 'rgba(0,0,0,0.25)',
          display: 'flex',
          flexDirection: 'column',
        }}
      >
        <div style={{ padding: 12, borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
          <button
            onClick={() => setShowAdd(!showAdd)}
            style={{
              width: '100%',
              padding: '10px',
              background: 'linear-gradient(135deg, #8b7cf0, #6c5ce7)',
              border: 'none',
              borderRadius: 6,
              color: '#fff',
              fontSize: 13,
              cursor: 'pointer',
              fontWeight: 600,
            }}
          >
            {showAdd ? '收起' : '+ 抓取新网页'}
          </button>
          {showAdd && (
            <div style={{ marginTop: 8, padding: 10, background: 'rgba(255,255,255,0.04)', borderRadius: 6 }}>
              <input
                type="text"
                value={urlInput}
                onChange={(e) => setUrlInput(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && doFetch()}
                placeholder="https://example.com/article"
                disabled={fetching}
                style={{
                  width: '100%',
                  padding: '6px 8px',
                  background: 'rgba(0,0,0,0.3)',
                  border: '1px solid rgba(255,255,255,0.1)',
                  borderRadius: 4,
                  color: '#e0e0e8',
                  fontSize: 12,
                  outline: 'none',
                  marginBottom: 6,
                }}
              />
              <div style={{ display: 'flex', gap: 4 }}>
                <button
                  onClick={doFetch}
                  disabled={fetching}
                  style={{
                    flex: 1,
                    padding: '6px',
                    background: fetching ? '#555' : 'rgba(139,124,240,0.6)',
                    border: 'none',
                    borderRadius: 4,
                    color: '#fff',
                    fontSize: 12,
                    cursor: fetching ? 'not-allowed' : 'pointer',
                  }}
                >
                  {fetching ? '抓取中...' : '抓取'}
                </button>
                <button
                  onClick={() => {
                    setShowAdd(false)
                    setFetchProgress('')
                  }}
                  style={{
                    padding: '6px 10px',
                    background: 'rgba(255,255,255,0.05)',
                    border: '1px solid rgba(255,255,255,0.1)',
                    borderRadius: 4,
                    color: '#aaa',
                    fontSize: 12,
                    cursor: 'pointer',
                  }}
                >
                  取消
                </button>
              </div>
              {fetchProgress && (
                <div style={{ marginTop: 6, fontSize: 11, color: fetchProgress.includes('失败') ? '#f87171' : '#a29bfe' }}>
                  {fetchProgress}
                </div>
              )}
              <div style={{ marginTop: 10, paddingTop: 8, borderTop: '1px solid rgba(255,255,255,0.05)' }}>
                <div style={{ fontSize: 11, color: '#888', marginBottom: 4 }}>或手动添加：</div>
                <input
                  type="text"
                  value={manualTitle}
                  onChange={(e) => setManualTitle(e.target.value)}
                  placeholder="标题"
                  style={manualInputStyle}
                />
                <textarea
                  value={manualContent}
                  onChange={(e) => setManualContent(e.target.value)}
                  placeholder="粘贴文章内容..."
                  rows={3}
                  style={{ ...manualInputStyle, resize: 'vertical', fontFamily: 'inherit' }}
                />
                <button onClick={doManualAdd} style={{ ...manualInputStyle, background: 'rgba(139,124,240,0.4)', cursor: 'pointer', color: '#fff' }}>
                  保存
                </button>
              </div>
            </div>
          )}
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="搜索收藏..."
            style={{
              width: '100%',
              marginTop: 8,
              padding: '6px 8px',
              background: 'rgba(255,255,255,0.05)',
              border: '1px solid rgba(255,255,255,0.1)',
              borderRadius: 4,
              color: '#e0e0e8',
              fontSize: 12,
              outline: 'none',
            }}
          />
          <div style={{ display: 'flex', gap: 4, marginTop: 6 }}>
            <button
              onClick={() => setShowFavorites(false)}
              style={{
                flex: 1,
                padding: '4px',
                fontSize: 11,
                background: !showFavorites ? 'rgba(139,124,240,0.3)' : 'rgba(255,255,255,0.05)',
                border: '1px solid rgba(255,255,255,0.1)',
                borderRadius: 4,
                color: '#ccc',
                cursor: 'pointer',
              }}
            >
              全部 ({clips.filter((c) => !c.archived).length})
            </button>
            <button
              onClick={() => setShowFavorites(true)}
              style={{
                flex: 1,
                padding: '4px',
                fontSize: 11,
                background: showFavorites ? 'rgba(139,124,240,0.3)' : 'rgba(255,255,255,0.05)',
                border: '1px solid rgba(255,255,255,0.1)',
                borderRadius: 4,
                color: '#ccc',
                cursor: 'pointer',
              }}
            >
              收藏 ({clips.filter((c) => c.favorite).length})
            </button>
          </div>
        </div>

        <div style={{ flex: 1, overflowY: 'auto', padding: 8 }}>
          {visibleClips.length === 0 ? (
            <div style={{ color: '#666', padding: 16, fontSize: 12, textAlign: 'center' }}>
              {search ? '没有匹配的收藏' : '还没有收藏\n点击上方按钮开始抓取'}
            </div>
          ) : (
            visibleClips.map((c) => (
              <div
                key={c.id}
                onClick={() => setActiveId(c.id)}
                style={{
                  padding: 10,
                  marginBottom: 6,
                  borderRadius: 6,
                  cursor: 'pointer',
                  background: c.id === activeId ? 'rgba(139,124,240,0.2)' : 'rgba(255,255,255,0.03)',
                  border: c.id === activeId ? '1px solid rgba(139,124,240,0.4)' : '1px solid transparent',
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 6 }}>
                  <div style={{ fontSize: 13, fontWeight: 600, color: '#fff', flex: 1, lineHeight: 1.4 }}>
                    {c.favorite && <span style={{ color: '#fbbf24' }}>★ </span>}
                    {c.title}
                  </div>
                </div>
                <div style={{ fontSize: 11, color: '#888', marginTop: 4, lineHeight: 1.4 }}>
                  {c.description.slice(0, 80)}
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 6, fontSize: 10, color: '#666' }}>
                  <span>{formatDate(c.createdAt)}</span>
                  <span>{c.highlights.length} 个高亮</span>
                </div>
                {c.tags.length > 0 && (
                  <div style={{ display: 'flex', gap: 3, flexWrap: 'wrap', marginTop: 4 }}>
                    {c.tags.slice(0, 3).map((t) => (
                      <span
                        key={t}
                        style={{
                          background: 'rgba(139,124,240,0.15)',
                          color: '#a29bfe',
                          padding: '0 5px',
                          borderRadius: 3,
                          fontSize: 10,
                        }}
                      >
                        #{t}
                      </span>
                    ))}
                  </div>
                )}
              </div>
            ))
          )}
        </div>

        <div style={{ padding: 8, borderTop: '1px solid rgba(255,255,255,0.06)' }}>
          <button
            onClick={exportAllMarkdown}
            disabled={clips.length === 0}
            style={{
              width: '100%',
              padding: '6px',
              background: 'rgba(255,255,255,0.05)',
              border: '1px solid rgba(255,255,255,0.1)',
              borderRadius: 4,
              color: clips.length === 0 ? '#555' : '#ccc',
              fontSize: 11,
              cursor: clips.length === 0 ? 'not-allowed' : 'pointer',
            }}
          >
            导出全部为 Markdown
          </button>
        </div>
      </aside>

      {/* === 右侧：详情视图 === */}
      <main style={{ display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
        {!activeClip ? (
          <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column', color: '#666' }}>
            <div style={{ fontSize: 64, marginBottom: 16 }}>📎</div>
            <div style={{ fontSize: 16 }}>选择一个收藏，或点击左上角抓取新网页</div>
            <div style={{ fontSize: 12, marginTop: 8, maxWidth: 400, textAlign: 'center', lineHeight: 1.6 }}>
              支持通过 CORS 代理抓取任意网页正文，提取关键内容保存到本地。选中文本可添加高亮笔记，标签基于关键词自动提取。
            </div>
          </div>
        ) : (
          <>
            <div
              style={{
                padding: '14px 24px',
                borderBottom: '1px solid rgba(255,255,255,0.06)',
                background: 'rgba(0,0,0,0.15)',
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 12 }}>
                <div style={{ flex: 1 }}>
                  <h1 style={{ margin: 0, fontSize: 22, color: '#fff', lineHeight: 1.3 }}>{activeClip.title}</h1>
                  <div style={{ display: 'flex', gap: 12, marginTop: 6, fontSize: 11, color: '#888', flexWrap: 'wrap' }}>
                    {activeClip.url && (
                      <a href={activeClip.url} target="_blank" rel="noreferrer" style={{ color: '#a29bfe' }}>
                        🔗 {(() => {
                          try {
                            return new URL(activeClip.url).hostname
                          } catch {
                            return activeClip.url
                          }
                        })()}
                      </a>
                    )}
                    {activeClip.author && <span>👤 {activeClip.author}</span>}
                    {activeClip.publishedAt && <span>📅 {activeClip.publishedAt.slice(0, 10)}</span>}
                    <span>📥 {formatDate(activeClip.createdAt)}</span>
                  </div>
                </div>
                <div style={{ display: 'flex', gap: 6, flexShrink: 0 }}>
                  <button onClick={() => toggleFavorite(activeClip.id)} style={toolbarBtn}>
                    {activeClip.favorite ? '★ 已收藏' : '☆ 收藏'}
                  </button>
                  <button onClick={() => toggleArchive(activeClip.id)} style={toolbarBtn}>
                    {activeClip.archived ? '↩ 取消归档' : '📥 归档'}
                  </button>
                  <button onClick={exportMarkdown} style={toolbarBtn}>
                    导出 MD
                  </button>
                  <button onClick={() => deleteClip(activeClip.id)} style={{ ...toolbarBtn, color: '#f87171' }}>
                    删除
                  </button>
                </div>
              </div>
              <div style={{ marginTop: 10, display: 'flex', gap: 6, alignItems: 'center' }}>
                <input
                  type="text"
                  value={editTags}
                  onChange={(e) => setEditTags(e.target.value)}
                  onBlur={saveTags}
                  placeholder="标签（逗号分隔）"
                  style={{
                    flex: 1,
                    padding: '4px 8px',
                    background: 'rgba(255,255,255,0.05)',
                    border: '1px solid rgba(255,255,255,0.1)',
                    borderRadius: 4,
                    color: '#e0e0e8',
                    fontSize: 12,
                    outline: 'none',
                  }}
                />
                {allTags.slice(0, 6).map(([t]) => (
                  <span
                    key={t}
                    onClick={() => setTagFilter(t)}
                    style={{
                      cursor: 'pointer',
                      background: tagFilter === t ? 'rgba(139,124,240,0.4)' : 'rgba(255,255,255,0.05)',
                      color: tagFilter === t ? '#fff' : '#888',
                      padding: '2px 8px',
                      borderRadius: 10,
                      fontSize: 10,
                    }}
                  >
                    #{t}
                  </span>
                ))}
              </div>
            </div>

            <div
              style={{
                flex: 1,
                overflowY: 'auto',
                padding: '24px 32px',
                fontSize: 15,
                lineHeight: 1.8,
              }}
            >
              {activeClip.description && (
                <blockquote
                  style={{
                    borderLeft: '3px solid #8b7cf0',
                    paddingLeft: 16,
                    color: '#a0a0c8',
                    margin: '0 0 20px 0',
                    fontStyle: 'italic',
                  }}
                >
                  {activeClip.description}
                </blockquote>
              )}
              {activeClip.highlights.length > 0 && (
                <div
                  style={{
                    background: 'rgba(139,124,240,0.08)',
                    border: '1px solid rgba(139,124,240,0.2)',
                    borderRadius: 8,
                    padding: 12,
                    marginBottom: 20,
                    fontSize: 13,
                  }}
                >
                  <div style={{ fontSize: 11, color: '#a29bfe', textTransform: 'uppercase', marginBottom: 6 }}>
                    高亮笔记 ({activeClip.highlights.length})
                  </div>
                  {activeClip.highlights.map((h) => (
                    <div
                      key={h.id}
                      style={{
                        padding: '6px 8px',
                        background: h.color + '40',
                        borderLeft: `3px solid ${h.color}`,
                        marginBottom: 4,
                        borderRadius: 3,
                      }}
                    >
                      "{h.text}"{h.note && <div style={{ fontSize: 11, color: '#c4b5fd', marginTop: 4 }}>💡 {h.note}</div>}
                    </div>
                  ))}
                </div>
              )}
              <div
                className="clip-content"
                dangerouslySetInnerHTML={{ __html: renderContent }}
                style={{ userSelect: 'text' }}
              />
            </div>
          </>
        )}
      </main>

      {/* === 浮动添加高亮按钮 === */}
      <div
        id="kg-floater"
        style={{
          position: 'absolute',
          background: '#1a1a2e',
          border: '1px solid rgba(139,124,240,0.5)',
          borderRadius: 6,
          padding: '4px',
          boxShadow: '0 4px 16px rgba(0,0,0,0.5)',
          zIndex: 1000,
          display: 'flex',
          gap: 4,
        }}
      >
        {HIGHLIGHT_COLORS.map((color) => (
          <button
            key={color}
            onClick={() => {
              const sel = window.getSelection()
              if (sel) addHighlight(sel.toString(), color)
            }}
            style={{
              width: 24,
              height: 24,
              background: color,
              border: 'none',
              borderRadius: 3,
              cursor: 'pointer',
            }}
            title="添加高亮"
          />
        ))}
      </div>

      <style>{`
        .clip-content p { margin: 0 0 1em 0; }
        .clip-content mark.hl { transition: filter 0.15s; }
        .clip-content mark.hl:hover { filter: brightness(0.9); }
      `}</style>
    </div>
  )
}

const escapeHtml = (s: string) =>
  s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&#39;')

const manualInputStyle: React.CSSProperties = {
  width: '100%',
  padding: '5px 8px',
  background: 'rgba(0,0,0,0.3)',
  border: '1px solid rgba(255,255,255,0.1)',
  borderRadius: 4,
  color: '#e0e0e8',
  fontSize: 12,
  outline: 'none',
  marginBottom: 4,
}

const toolbarBtn: React.CSSProperties = {
  padding: '5px 10px',
  background: 'rgba(255,255,255,0.05)',
  border: '1px solid rgba(255,255,255,0.1)',
  borderRadius: 4,
  color: '#ccc',
  fontSize: 11,
  cursor: 'pointer',
}

export default memo(WebClipper)
