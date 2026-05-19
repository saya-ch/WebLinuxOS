import { useState, useRef, useCallback } from 'react'

const welcomePage = `
<!DOCTYPE html>
<html lang="zh">
<head>
  <meta charset="UTF-8">
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; display: flex; align-items: center; justify-content: center; min-height: 100vh; background: linear-gradient(135deg, #1a1a2e 0%, #16213e 50%, #0f3460 100%); color: #fff; }
    .container { text-align: center; max-width: 600px; padding: 40px; }
    h1 { font-size: 36px; margin-bottom: 12px; background: linear-gradient(90deg, #e94560, #f5c542, #4ecca3); -webkit-background-clip: text; -webkit-text-fill-color: transparent; }
    .search-box { display: flex; margin: 24px 0; background: rgba(255,255,255,0.1); border-radius: 24px; padding: 4px; }
    .search-box input { flex: 1; padding: 12px 20px; border: none; outline: none; background: transparent; color: #fff; font-size: 16px; }
    .search-box button { padding: 10px 24px; border: none; border-radius: 20px; background: #e94560; color: #fff; cursor: pointer; font-size: 14px; }
    .links { display: grid; grid-template-columns: repeat(2, 1fr); gap: 12px; margin-top: 32px; }
    .link-card { padding: 16px; border-radius: 12px; background: rgba(255,255,255,0.08); cursor: pointer; transition: 0.2s; text-decoration: none; color: #ccc; text-align: left; }
    .link-card:hover { background: rgba(255,255,255,0.15); }
    .link-card .title { font-size: 14px; font-weight: 600; color: #fff; margin-bottom: 4px; }
    .link-card .url { font-size: 11px; color: #888; }
  </style>
  <title>Web Linux 浏览器</title>
</head>
<body>
  <div class="container">
    <h1>🌐 Web Linux 浏览器</h1>
    <p style="color:#aaa;margin-bottom:8px;">欢迎使用内置浏览器</p>
    <div class="search-box">
      <input type="text" placeholder="输入网址或搜索内容..." id="urlInput" />
      <button onclick="navigate()">前往</button>
    </div>
    <div class="links">
      <div class="link-card"><div class="title">📚 文档</div><div class="url">docs.example.com</div></div>
      <div class="link-card"><div class="title">💬 社区</div><div class="url">community.example.com</div></div>
      <div class="link-card"><div class="title">📦 资源</div><div class="url">resources.example.com</div></div>
      <div class="link-card"><div class="title">⚙️ 设置</div><div class="url">settings.example.com</div></div>
    </div>
  </div>
</body>
</html>`

const DEFAULT_BOOKMARKS = [
  { name: '🏠 主页', url: 'about:blank' },
  { name: '🔍 搜索', url: 'https://www.google.com' },
  { name: '📖 文档', url: 'https://developer.mozilla.org' },
  { name: '💻 GitHub', url: 'https://github.com' },
  { name: '📰 新闻', url: 'https://news.ycombinator.com' },
]

export default function WebBrowser() {
  const [, setUrl] = useState('about:blank')
  const [urlInput, setUrlInput] = useState('')
  const [history, setHistory] = useState<string[]>([])
  const [historyIndex, setHistoryIndex] = useState(-1)
  const [bookmarks] = useState(DEFAULT_BOOKMARKS)
  const [tabs, setTabs] = useState([{ id: 'tab-1', title: '新标签页', url: 'about:blank' }])
  const [activeTabId, setActiveTabId] = useState('tab-1')
  const [tabContents, setTabContents] = useState<Record<string, string>>({ 'tab-1': welcomePage })
  const [loading, setLoading] = useState(false)
  const tabCounter = useRef(1)
  const iframeRef = useRef<HTMLIFrameElement>(null)

  const activeTab = tabs.find((t) => t.id === activeTabId)

  const navigate = useCallback((targetUrl: string) => {
    let finalUrl = targetUrl.trim()
    if (finalUrl === 'about:blank') {
    } else if (!/^https?:\/\//i.test(finalUrl) && !finalUrl.startsWith('about:')) {
      finalUrl = 'https://' + finalUrl
    }
    setUrl(finalUrl)
    setUrlInput(finalUrl)
    const newHistory = history.slice(0, historyIndex + 1)
    newHistory.push(finalUrl)
    setHistory(newHistory)
    setHistoryIndex(newHistory.length - 1)
    setTabs((prev) => prev.map((t) => t.id === activeTabId ? { ...t, url: finalUrl, title: finalUrl } : t))
    setLoading(true)
    setTimeout(() => setLoading(false), 800)
  }, [history, historyIndex, activeTabId])

  const goBack = () => {
    if (historyIndex > 0) {
      const newIdx = historyIndex - 1
      setHistoryIndex(newIdx)
      setUrl(history[newIdx])
      setUrlInput(history[newIdx])
    }
  }

  const goForward = () => {
    if (historyIndex < history.length - 1) {
      const newIdx = historyIndex + 1
      setHistoryIndex(newIdx)
      setUrl(history[newIdx])
      setUrlInput(history[newIdx])
    }
  }

  const refresh = () => {
    setLoading(true)
    setTimeout(() => setLoading(false), 600)
  }

  const goHome = () => {
    setUrl('about:blank')
    setUrlInput('about:blank')
    setTabs((prev) => prev.map((t) => t.id === activeTabId ? { ...t, url: 'about:blank', title: '新标签页' } : t))
  }

  const addTab = () => {
    tabCounter.current++
    const id = `tab-${tabCounter.current}`
    setTabs((prev) => [...prev, { id, title: '新标签页', url: 'about:blank' }])
    setTabContents((prev) => ({ ...prev, [id]: welcomePage }))
    setActiveTabId(id)
  }

  const closeTab = (id: string) => {
    if (tabs.length <= 1) return
    const idx = tabs.findIndex((t) => t.id === id)
    setTabs((prev) => prev.filter((t) => t.id !== id))
    setTabContents((prev) => {
      const next = { ...prev }
      delete next[id]
      return next
    })
    if (activeTabId === id) {
      const next = tabs[idx + 1] || tabs[idx - 1]
      if (next) setActiveTabId(next.id)
    }
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', background: '#1e1e1e', color: '#d4d4d4' }}>
      <div style={{ display: 'flex', background: '#252526', borderBottom: '1px solid #333' }}>
        {tabs.map((tab) => (
          <div
            key={tab.id}
            style={{
              padding: '6px 12px', cursor: 'pointer', fontSize: 12,
              background: tab.id === activeTabId ? '#1e1e1e' : '#2d2d2d',
              borderRight: '1px solid #333', borderTop: tab.id === activeTabId ? '2px solid #007acc' : '2px solid transparent',
              display: 'flex', alignItems: 'center', gap: 6, whiteSpace: 'nowrap', maxWidth: 160,
              overflow: 'hidden', textOverflow: 'ellipsis'
            }}
            onClick={() => setActiveTabId(tab.id)}
          >
            <span style={{ overflow: 'hidden', textOverflow: 'ellipsis' }}>{tab.title}</span>
            <span
              style={{ fontSize: 14, lineHeight: 1, cursor: 'pointer', opacity: 0.5, flexShrink: 0 }}
              onClick={(e) => { e.stopPropagation(); closeTab(tab.id) }}
            >×</span>
          </div>
        ))}
        <div style={{ padding: '6px 10px', cursor: 'pointer', fontSize: 14, color: '#888' }} onClick={addTab}>+</div>
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: 4, padding: '6px 8px', background: '#2d2d2d', borderBottom: '1px solid #333' }}>
        <button onClick={goBack} title="后退" style={navBtn}>◀</button>
        <button onClick={goForward} title="前进" style={navBtn}>▶</button>
        <button onClick={refresh} title="刷新" style={navBtn}>🔄</button>
        <button onClick={goHome} title="主页" style={navBtn}>🏠</button>
        <span style={{ color: '#555', fontSize: 14, margin: '0 4px' }}>🔒</span>
        <input
          value={urlInput}
          onChange={(e) => setUrlInput(e.target.value)}
          onKeyDown={(e) => { if (e.key === 'Enter') navigate(urlInput) }}
          style={{
            flex: 1, padding: '5px 10px', border: '1px solid #555', borderRadius: 16,
            background: '#1e1e1e', color: '#d4d4d4', fontSize: 13, outline: 'none'
          }}
          placeholder="输入网址或搜索..."
        />
      </div>

      {loading && (
        <div style={{ height: 3, background: '#333', position: 'relative', overflow: 'hidden' }}>
          <div style={{ height: '100%', width: '60%', background: 'linear-gradient(90deg, #007acc, #4ecca3)', animation: 'progress 1.5s ease-in-out infinite', borderRadius: 2 }} />
          <style>{`@keyframes progress { 0% { transform: translateX(-100%); } 100% { transform: translateX(200%); } }`}</style>
        </div>
      )}

      <div style={{ display: 'flex', alignItems: 'center', gap: 2, padding: '3px 8px', background: '#252526', borderBottom: '1px solid #333', overflow: 'hidden' }}>
        <span style={{ fontSize: 11, color: '#888', marginRight: 6 }}>📑</span>
        {bookmarks.map((bm, i) => (
          <span
            key={i}
            style={{ padding: '3px 10px', cursor: 'pointer', fontSize: 11, borderRadius: 12, background: '#333', whiteSpace: 'nowrap' }}
            onClick={() => {
              setUrlInput(bm.url)
              if (bm.url === 'about:blank') goHome()
              else navigate(bm.url)
            }}
            onMouseEnter={(e) => (e.currentTarget.style.background = '#444')}
            onMouseLeave={(e) => (e.currentTarget.style.background = '#333')}
          >
            {bm.name}
          </span>
        ))}
      </div>

      <div style={{ flex: 1, overflow: 'hidden', position: 'relative' }}>
        {activeTab && activeTab.url === 'about:blank' ? (
          <iframe
            ref={iframeRef}
            srcDoc={tabContents[activeTabId] || welcomePage}
            style={{ width: '100%', height: '100%', border: 'none' }}
            title="browser-content"
            sandbox="allow-scripts"
          />
        ) : (
          <iframe
            ref={iframeRef}
            src={activeTab?.url}
            style={{ width: '100%', height: '100%', border: 'none' }}
            title="browser-content"
            sandbox="allow-scripts allow-same-origin allow-forms"
          />
        )}
      </div>
    </div>
  )
}

const navBtn: React.CSSProperties = {
  background: 'transparent', border: 'none', color: '#ccc', cursor: 'pointer',
  padding: '4px 8px', borderRadius: 3, fontSize: 12
}