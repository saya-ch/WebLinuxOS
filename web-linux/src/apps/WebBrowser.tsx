import { useState, useRef, useCallback, useEffect } from 'react'

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
    .links { display: grid; grid-template-columns: repeat(3, 1fr); gap: 12px; margin-top: 32px; }
    .link-card { padding: 16px; border-radius: 12px; background: rgba(255,255,255,0.08); cursor: pointer; transition: 0.2s; text-decoration: none; color: #ccc; text-align: left; }
    .link-card:hover { background: rgba(255,255,255,0.15); transform: translateY(-2px); }
    .link-card .title { font-size: 14px; font-weight: 600; color: #fff; margin-bottom: 4px; }
    .link-card .url { font-size: 11px; color: #888; }
    .tip { margin-top: 24px; font-size: 12px; color: #666; }
  </style>
</head>
<body>
  <div class="container">
    <h1>Web Linux 浏览器</h1>
    <p style="color:#aaa;margin-bottom:8px;">在上方地址栏输入网址即可浏览网页</p>
    <div class="links">
      <div class="link-card" onclick="parent.postMessage({type:'navigate',url:'https://www.wikipedia.org'},'*')"><div class="title">📚 维基百科</div><div class="url">wikipedia.org</div></div>
      <div class="link-card" onclick="parent.postMessage({type:'navigate',url:'https://developer.mozilla.org'},'*')"><div class="title">📖 MDN 文档</div><div class="url">developer.mozilla.org</div></div>
      <div class="link-card" onclick="parent.postMessage({type:'navigate',url:'https://github.com'},'*')"><div class="title">💻 GitHub</div><div class="url">github.com</div></div>
      <div class="link-card" onclick="parent.postMessage({type:'navigate',url:'https://news.ycombinator.com'},'*')"><div class="title">📰 Hacker News</div><div class="url">news.ycombinator.com</div></div>
      <div class="link-card" onclick="parent.postMessage({type:'navigate',url:'https://codepen.io'},'*')"><div class="title">🎨 CodePen</div><div class="url">codepen.io</div></div>
      <div class="link-card" onclick="parent.postMessage({type:'navigate',url:'https://stackoverflow.com'},'*')"><div class="title">💡 StackOverflow</div><div class="url">stackoverflow.com</div></div>
    </div>
    <p class="tip">提示：部分网站可能因安全策略无法在iframe中加载</p>
  </div>
</body>
</html>`

interface TabData {
  id: string
  title: string
  url: string
  history: string[]
  historyIndex: number
}

const DEFAULT_BOOKMARKS = [
  { name: '🏠 主页', url: 'about:blank' },
  { name: '📚 维基百科', url: 'https://www.wikipedia.org' },
  { name: '📖 MDN', url: 'https://developer.mozilla.org' },
  { name: '💻 GitHub', url: 'https://github.com' },
  { name: '📰 HN', url: 'https://news.ycombinator.com' },
  { name: '💡 SO', url: 'https://stackoverflow.com' },
]

export default function WebBrowser() {
  const [urlInput, setUrlInput] = useState('')
  const [bookmarks, setBookmarks] = useState(DEFAULT_BOOKMARKS)
  const [tabs, setTabs] = useState<TabData[]>([
    { id: 'tab-1', title: '新标签页', url: 'about:blank', history: ['about:blank'], historyIndex: 0 }
  ])
  const [activeTabId, setActiveTabId] = useState('tab-1')
  const [loading, setLoading] = useState(false)
  const [loadError, setLoadError] = useState(false)
  const [progress, setProgress] = useState(0)
  const tabCounter = useRef(1)
  const iframeRef = useRef<HTMLIFrameElement>(null)

  const activeTab = tabs.find((t) => t.id === activeTabId)

  const navigate = useCallback((targetUrl: string) => {
    let finalUrl = targetUrl.trim()
    if (!finalUrl) return
    if (finalUrl === 'about:blank') {
    } else if (!/^https?:\/\//i.test(finalUrl) && !finalUrl.startsWith('about:')) {
      if (finalUrl.includes('.') && !finalUrl.includes(' ')) {
        finalUrl = 'https://' + finalUrl
      } else {
        finalUrl = `https://www.google.com/search?igu=1&q=${encodeURIComponent(finalUrl)}`
      }
    }
    setUrlInput(finalUrl === 'about:blank' ? '' : finalUrl)
    setLoadError(false)
    setLoading(true)
    setProgress(0)

    const progressTimer = setInterval(() => {
      setProgress(p => {
        if (p >= 90) { clearInterval(progressTimer); return 90 }
        return p + Math.random() * 30
      })
    }, 200)

    setTimeout(() => {
      clearInterval(progressTimer)
      setProgress(100)
      setTimeout(() => {
        setLoading(false)
        setProgress(0)
      }, 300)
    }, 1500)

    setTabs(prev => prev.map(t => {
      if (t.id !== activeTabId) return t
      const newHistory = [...t.history.slice(0, t.historyIndex + 1), finalUrl]
      return {
        ...t,
        url: finalUrl,
        title: finalUrl === 'about:blank' ? '新标签页' : new URL(finalUrl).hostname,
        history: newHistory,
        historyIndex: newHistory.length - 1,
      }
    }))
  }, [activeTabId])

  useEffect(() => {
    const handler = (e: MessageEvent) => {
      if (e.data?.type === 'navigate' && e.data?.url) {
        navigate(e.data.url)
      }
    }
    window.addEventListener('message', handler)
    return () => window.removeEventListener('message', handler)
  }, [navigate])

  const goBack = () => {
    if (!activeTab || activeTab.historyIndex <= 0) return
    const newIdx = activeTab.historyIndex - 1
    const url = activeTab.history[newIdx]
    setUrlInput(url === 'about:blank' ? '' : url)
    setLoadError(false)
    setTabs(prev => prev.map(t =>
      t.id === activeTabId ? { ...t, url, historyIndex: newIdx, title: url === 'about:blank' ? '新标签页' : (() => { try { return new URL(url).hostname } catch { return url } })() } : t
    ))
  }

  const goForward = () => {
    if (!activeTab || activeTab.historyIndex >= activeTab.history.length - 1) return
    const newIdx = activeTab.historyIndex + 1
    const url = activeTab.history[newIdx]
    setUrlInput(url === 'about:blank' ? '' : url)
    setLoadError(false)
    setTabs(prev => prev.map(t =>
      t.id === activeTabId ? { ...t, url, historyIndex: newIdx, title: url === 'about:blank' ? '新标签页' : (() => { try { return new URL(url).hostname } catch { return url } })() } : t
    ))
  }

  const refresh = () => {
    if (!activeTab) return
    setLoading(true)
    setLoadError(false)
    setProgress(0)
    const iframe = iframeRef.current
    if (iframe) {
      try {
        iframe.src = iframe.src
      } catch {
      }
    }
    setTimeout(() => setLoading(false), 1000)
  }

  const goHome = () => {
    navigate('about:blank')
  }

  const addBookmark = () => {
    if (!activeTab || activeTab.url === 'about:blank') return
    const exists = bookmarks.some(b => b.url === activeTab.url)
    if (exists) {
      setBookmarks(prev => prev.filter(b => b.url !== activeTab.url))
    } else {
      try {
        const hostname = new URL(activeTab.url).hostname
        setBookmarks(prev => [...prev, { name: `⭐ ${hostname}`, url: activeTab.url }])
      } catch {
      }
    }
  }

  const addTab = () => {
    tabCounter.current++
    const id = `tab-${tabCounter.current}`
    setTabs(prev => [...prev, { id, title: '新标签页', url: 'about:blank', history: ['about:blank'], historyIndex: 0 }])
    setActiveTabId(id)
    setUrlInput('')
  }

  const closeTab = (id: string) => {
    if (tabs.length <= 1) return
    const idx = tabs.findIndex((t) => t.id === id)
    setTabs(prev => prev.filter(t => t.id !== id))
    if (activeTabId === id) {
      const next = tabs[idx + 1] || tabs[idx - 1]
      if (next) setActiveTabId(next.id)
    }
  }

  const handleIframeLoad = () => {
    setLoading(false)
    setProgress(100)
    setTimeout(() => setProgress(0), 300)
  }

  const handleIframeError = () => {
    setLoadError(true)
    setLoading(false)
  }

  const isBookmarked = activeTab ? bookmarks.some(b => b.url === activeTab.url) : false

  useEffect(() => {
    if (activeTab) {
      setUrlInput(activeTab.url === 'about:blank' ? '' : activeTab.url)
    }
  }, [activeTabId])

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
        <button onClick={goBack} disabled={!activeTab || activeTab.historyIndex <= 0} title="后退" style={{ ...navBtn, opacity: (!activeTab || activeTab.historyIndex <= 0) ? 0.3 : 1 }}>◀</button>
        <button onClick={goForward} disabled={!activeTab || activeTab.historyIndex >= activeTab.history.length - 1} title="前进" style={{ ...navBtn, opacity: (!activeTab || activeTab.historyIndex >= activeTab.history.length - 1) ? 0.3 : 1 }}>▶</button>
        <button onClick={refresh} title="刷新" style={navBtn}>🔄</button>
        <button onClick={goHome} title="主页" style={navBtn}>🏠</button>
        <span style={{ color: activeTab?.url.startsWith('https') ? '#4ecca3' : '#555', fontSize: 14, margin: '0 4px' }}>
          {activeTab?.url.startsWith('https') ? '🔒' : '⚠️'}
        </span>
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
        <button onClick={addBookmark} title={isBookmarked ? '移除书签' : '添加书签'} style={{ ...navBtn, color: isBookmarked ? '#f5c542' : '#888' }}>
          {isBookmarked ? '★' : '☆'}
        </button>
      </div>

      {(loading || progress > 0) && (
        <div style={{ height: 3, background: '#333', position: 'relative', overflow: 'hidden' }}>
          <div style={{
            height: '100%', width: `${progress}%`, background: 'linear-gradient(90deg, #007acc, #4ecca3)',
            transition: 'width 0.3s ease', borderRadius: 2
          }} />
        </div>
      )}

      <div style={{ display: 'flex', alignItems: 'center', gap: 2, padding: '3px 8px', background: '#252526', borderBottom: '1px solid #333', overflow: 'hidden', flexShrink: 0 }}>
        <span style={{ fontSize: 11, color: '#888', marginRight: 6 }}>📑</span>
        {bookmarks.map((bm, i) => (
          <span
            key={i}
            style={{ padding: '3px 10px', cursor: 'pointer', fontSize: 11, borderRadius: 12, background: '#333', whiteSpace: 'nowrap' }}
            onClick={() => {
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
        {loadError && (
          <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', background: '#1e1e1e', zIndex: 10 }}>
            <div style={{ fontSize: 48, marginBottom: 16 }}>🚫</div>
            <div style={{ fontSize: 18, fontWeight: 600, marginBottom: 8 }}>无法加载此页面</div>
            <div style={{ fontSize: 13, color: '#888', textAlign: 'center', maxWidth: 400 }}>
              该网站可能不允许在框架中显示，或网络连接出现问题。
            </div>
            <div style={{ fontSize: 12, color: '#666', marginTop: 8 }}>
              {activeTab?.url}
            </div>
            <button onClick={refresh} style={{ marginTop: 16, padding: '8px 24px', background: '#007acc', color: '#fff', border: 'none', borderRadius: 4, cursor: 'pointer' }}>
              重新加载
            </button>
          </div>
        )}
        {activeTab && activeTab.url === 'about:blank' ? (
          <iframe
            ref={iframeRef}
            srcDoc={welcomePage}
            style={{ width: '100%', height: '100%', border: 'none' }}
            title="browser-content"
            sandbox="allow-scripts allow-same-origin"
            onLoad={handleIframeLoad}
            onError={handleIframeError}
          />
        ) : (
          <iframe
            ref={iframeRef}
            src={activeTab?.url}
            style={{ width: '100%', height: '100%', border: 'none' }}
            title="browser-content"
            sandbox="allow-scripts allow-same-origin allow-forms allow-popups"
            onLoad={handleIframeLoad}
            onError={handleIframeError}
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
