import { useState, useRef, useCallback, useEffect } from 'react'

const welcomePage = `
<!DOCTYPE html>
<html lang="zh">
<head>
  <meta charset="UTF-8">
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; display: flex; align-items: center; justify-content: center; min-height: 100vh; background: linear-gradient(135deg, #1a1a2e 0%, #16213e 50%, #0f3460 100%); color: #fff; }
    .container { text-align: center; max-width: 700px; padding: 40px; }
    h1 { font-size: 36px; margin-bottom: 12px; background: linear-gradient(90deg, #e94560, #f5c542, #4ecca3); -webkit-background-clip: text; -webkit-text-fill-color: transparent; background-clip: text; }
    .search-box { display: flex; margin: 24px 0; background: rgba(255,255,255,0.1); border-radius: 24px; padding: 4px; }
    .search-box input { flex: 1; padding: 12px 20px; border: none; outline: none; background: transparent; color: #fff; font-size: 16px; }
    .search-box button { padding: 10px 24px; border: none; border-radius: 20px; background: #e94560; color: #fff; cursor: pointer; font-size: 14px; }
    .links { display: grid; grid-template-columns: repeat(4, 1fr); gap: 12px; margin-top: 32px; }
    .link-card { padding: 16px; border-radius: 12px; background: rgba(255,255,255,0.08); cursor: pointer; transition: 0.2s; text-decoration: none; color: #ccc; text-align: center; }
    .link-card:hover { background: rgba(255,255,255,0.15); transform: translateY(-2px); }
    .link-card .icon { font-size: 24px; margin-bottom: 8px; }
    .link-card .title { font-size: 13px; font-weight: 600; color: #fff; margin-bottom: 4px; }
    .link-card .url { font-size: 10px; color: #888; }
    .quick-links { margin-top: 24px; padding-top: 24px; border-top: 1px solid rgba(255,255,255,0.1); }
    .quick-links h3 { font-size: 14px; color: #aaa; margin-bottom: 12px; }
    .search-tips { margin-top: 24px; padding: 16px; background: rgba(255,255,255,0.05); border-radius: 12px; }
    .search-tips p { font-size: 12px; color: #888; }
    .search-engines { display: flex; gap: 8px; justify-content: center; margin-top: 12px; flex-wrap: wrap; }
    .search-engines button { padding: 6px 12px; border-radius: 12px; background: rgba(255,255,255,0.08); color: #ccc; border: 1px solid rgba(255,255,255,0.15); cursor: pointer; font-size: 12px; }
    .search-engines button:hover { background: rgba(255,255,255,0.15); color: #fff; }
    .search-engines button.active { background: rgba(233,69,96,0.3); color: #fff; border-color: #e94560; }
  </style>
  <title>Web Linux 浏览器</title>
  <script>
    let currentEngine = 'google';
    function navigate() {
      const input = document.getElementById('urlInput');
      const url = input.value.trim();
      if (url) {
        window.parent.postMessage({ type: 'navigate', url, engine: currentEngine }, '*');
      }
    }
    function setEngine(engine) {
      currentEngine = engine;
      document.querySelectorAll('.search-engines button').forEach(b => b.classList.remove('active'));
      const target = document.querySelector('.search-engines button[data-engine="' + engine + '"]');
      if (target) target.classList.add('active');
    }
    document.addEventListener('keydown', function(e) {
      if (e.key === 'Enter') navigate();
    });
  </script>
</head>
<body>
  <div class="container">
    <h1>Web Linux 浏览器</h1>
    <p style="color:#aaa;margin-bottom:8px;">欢迎使用内置浏览器 - 集成多搜索引擎与隐私模式</p>
    <div class="search-box">
      <input type="text" placeholder="输入网址或搜索内容..." id="urlInput" />
      <button onclick="navigate()">前往</button>
    </div>
    <div class="search-engines">
      <button class="active" data-engine="google" onclick="setEngine('google')">Google</button>
      <button data-engine="duckduckgo" onclick="setEngine('duckduckgo')">DuckDuckGo</button>
      <button data-engine="bing" onclick="setEngine('bing')">Bing</button>
      <button data-engine="brave" onclick="setEngine('brave')">Brave</button>
      <button data-engine="wikipedia" onclick="setEngine('wikipedia')">Wikipedia</button>
      <button data-engine="github" onclick="setEngine('github')">GitHub</button>
    </div>
    <div class="quick-links">
      <h3>快捷链接</h3>
      <div class="links">
        <div class="link-card" onclick="document.getElementById('urlInput').value='https://www.google.com'; navigate();"><div class="icon">🔍</div><div class="title">Google</div><div class="url">搜索</div></div>
        <div class="link-card" onclick="document.getElementById('urlInput').value='https://github.com'; navigate();"><div class="icon">💻</div><div class="title">GitHub</div><div class="url">代码托管</div></div>
        <div class="link-card" onclick="document.getElementById('urlInput').value='https://developer.mozilla.org'; navigate();"><div class="icon">📚</div><div class="title">MDN</div><div class="url">开发者文档</div></div>
        <div class="link-card" onclick="document.getElementById('urlInput').value='https://stackoverflow.com'; navigate();"><div class="icon">❓</div><div class="title">Stack Overflow</div><div class="url">技术问答</div></div>
        <div class="link-card" onclick="document.getElementById('urlInput').value='https://news.ycombinator.com'; navigate();"><div class="icon">📰</div><div class="title">HN</div><div class="url">科技新闻</div></div>
        <div class="link-card" onclick="document.getElementById('urlInput').value='https://codepen.io'; navigate();"><div class="icon">🎨</div><div class="title">CodePen</div><div class="url">代码演示</div></div>
        <div class="link-card" onclick="document.getElementById('urlInput').value='https://wikipedia.org'; navigate();"><div class="icon">📖</div><div class="title">Wikipedia</div><div class="url">百科</div></div>
        <div class="link-card" onclick="document.getElementById('urlInput').value='https://duckduckgo.com'; navigate();"><div class="icon">🦆</div><div class="title">DuckDuckGo</div><div class="url">隐私搜索</div></div>
      </div>
    </div>
    <div class="search-tips">
      <p>提示: 直接输入关键词进行搜索，或输入完整网址访问网站</p>
    </div>
  </div>
</body>
</html>`

const DEFAULT_BOOKMARKS = [
  { name: '主页', url: 'about:blank' },
  { name: 'Google', url: 'https://www.google.com' },
  { name: 'MDN', url: 'https://developer.mozilla.org' },
  { name: 'GitHub', url: 'https://github.com' },
  { name: 'HN', url: 'https://news.ycombinator.com' },
  { name: 'SO', url: 'https://stackoverflow.com' },
]

const SEARCH_ENGINES: Record<string, (q: string) => string> = {
  google: (q) => `https://www.google.com/search?q=${encodeURIComponent(q)}`,
  duckduckgo: (q) => `https://duckduckgo.com/?q=${encodeURIComponent(q)}`,
  bing: (q) => `https://www.bing.com/search?q=${encodeURIComponent(q)}`,
  brave: (q) => `https://search.brave.com/search?q=${encodeURIComponent(q)}`,
  wikipedia: (q) => `https://wikipedia.org/w/index.php?search=${encodeURIComponent(q)}`,
  github: (q) => `https://github.com/search?q=${encodeURIComponent(q)}&type=repositories`,
}

const BM_STORAGE = 'weblinux-browser-bookmarks'
const HIST_STORAGE = 'weblinux-browser-history'

interface Tab {
  id: string
  title: string
  url: string
  favicon?: string
  loading: boolean
}

function loadBookmarks(): typeof DEFAULT_BOOKMARKS {
  try {
    const raw = localStorage.getItem(BM_STORAGE)
    if (!raw) return DEFAULT_BOOKMARKS
    const parsed = JSON.parse(raw)
    if (Array.isArray(parsed) && parsed.length > 0) return parsed
  } catch {}
  return DEFAULT_BOOKMARKS
}

function loadHistory(): string[] {
  try {
    const raw = localStorage.getItem(HIST_STORAGE)
    if (!raw) return []
    const parsed = JSON.parse(raw)
    if (Array.isArray(parsed)) return parsed
  } catch {}
  return []
}

export default function WebBrowser() {
  const [, setUrl] = useState('about:blank')
  const [urlInput, setUrlInput] = useState('')
  const [history, setHistory] = useState<string[]>(loadHistory)
  const [historyIndex, setHistoryIndex] = useState(-1)
  const [bookmarks, setBookmarks] = useState(loadBookmarks)
  const [searchEngine, setSearchEngine] = useState<string>(() => {
    try {
      return localStorage.getItem('weblinux-browser-engine') || 'google'
    } catch {
      return 'google'
    }
  })
  const [tabs, setTabs] = useState<Tab[]>([{ id: 'tab-1', title: '新标签页', url: 'about:blank', loading: false }])
  const [activeTabId, setActiveTabId] = useState('tab-1')
  const [tabContents, setTabContents] = useState<Record<string, string>>({ 'tab-1': welcomePage })
  const [showBookmarksBar, setShowBookmarksBar] = useState(true)
  const [showHistoryPanel, setShowHistoryPanel] = useState(false)
  const [searchSuggestions, setSearchSuggestions] = useState<string[]>([])
  const tabCounter = useRef(1)
  const urlInputRef = useRef<HTMLInputElement>(null)

  const activeTab = tabs.find((t) => t.id === activeTabId)

  useEffect(() => {
    try {
      localStorage.setItem(BM_STORAGE, JSON.stringify(bookmarks))
    } catch {}
  }, [bookmarks])

  useEffect(() => {
    try {
      localStorage.setItem(HIST_STORAGE, JSON.stringify(history))
    } catch {}
  }, [history])

  useEffect(() => {
    try {
      localStorage.setItem('weblinux-browser-engine', searchEngine)
    } catch {}
  }, [searchEngine])

  const navigate = useCallback((targetUrl: string, tabId?: string, engine?: string) => {
    const currentTabId = tabId || activeTabId
    const useEngine = engine || searchEngine
    let finalUrl = targetUrl.trim()

    if (!/^[a-zA-Z][a-zA-Z\d+\-.]*:/.test(finalUrl)) {
      if (finalUrl.includes('.') && !finalUrl.includes(' ') && finalUrl.includes('.')) {
        finalUrl = 'https://' + finalUrl
      } else {
        const builder = SEARCH_ENGINES[useEngine] || SEARCH_ENGINES.google
        finalUrl = builder(finalUrl)
      }
    }

    setUrl(finalUrl)
    setUrlInput(finalUrl)
    setSearchSuggestions([])

    setHistory(prev => {
      const truncated = prev.slice(0, historyIndex + 1)
      const next = [...truncated, finalUrl].slice(-200)
      setHistoryIndex(next.length - 1)
      return next
    })

    setTabs((prev) => prev.map((t) =>
      t.id === currentTabId ? { ...t, url: finalUrl, title: finalUrl, loading: true, favicon: undefined } : t
    ))

    setTimeout(() => {
      setTabs((prev) => prev.map((t) =>
        t.id === currentTabId ? { ...t, loading: false } : t
      ))
    }, 1500)
  }, [historyIndex, activeTabId, searchEngine])

  const goBack = useCallback(() => {
    if (historyIndex > 0) {
      const newIdx = historyIndex - 1
      setHistoryIndex(newIdx)
      setUrl(history[newIdx])
      setUrlInput(history[newIdx])
    }
  }, [history, historyIndex])

  const goForward = useCallback(() => {
    if (historyIndex < history.length - 1) {
      const newIdx = historyIndex + 1
      setHistoryIndex(newIdx)
      setUrl(history[newIdx])
      setUrlInput(history[newIdx])
    }
  }, [history, historyIndex])

  const refresh = useCallback(() => {
    if (activeTab && activeTab.url !== 'about:blank') {
      setTabs((prev) => prev.map((t) => 
        t.id === activeTabId ? { ...t, loading: true } : t
      ))
      setTimeout(() => {
        setTabs((prev) => prev.map((t) => 
          t.id === activeTabId ? { ...t, loading: false } : t
        ))
      }, 1000)
    }
  }, [activeTab, activeTabId])

  const goHome = useCallback(() => {
    setUrl('about:blank')
    setUrlInput('')
    setTabs((prev) => prev.map((t) => 
      t.id === activeTabId ? { ...t, url: 'about:blank', title: '新标签页', loading: false } : t
    ))
  }, [activeTabId])

  const addTab = useCallback(() => {
    tabCounter.current++
    const id = `tab-${tabCounter.current}`
    setTabs((prev) => [...prev, { id, title: '新标签页', url: 'about:blank', loading: false }])
    setTabContents((prev) => ({ ...prev, [id]: welcomePage }))
    setActiveTabId(id)
    setUrlInput('')
    setShowHistoryPanel(false)
  }, [])

  const closeTab = useCallback((id: string) => {
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
      if (next) {
        setActiveTabId(next.id)
        setUrlInput(next.url !== 'about:blank' ? next.url : '')
      }
    }
  }, [tabs, activeTabId])

  const addBookmark = useCallback(() => {
    if (activeTab && activeTab.url !== 'about:blank') {
      const existing = bookmarks.find(b => b.url === activeTab.url)
      if (!existing) {
        try {
          const hostname = new URL(activeTab.url).hostname.replace('www.', '')
          const newBookmark = { name: hostname, url: activeTab.url }
          setBookmarks([...bookmarks, newBookmark])
        } catch {
          setBookmarks([...bookmarks, { name: '书签', url: activeTab.url }])
        }
      }
    }
  }, [activeTab, bookmarks])

  const removeBookmark = useCallback((url: string) => {
    setBookmarks(bookmarks.filter(b => b.url !== url))
  }, [bookmarks])

  const handleUrlInputChange = useCallback((value: string) => {
    setUrlInput(value)
    if (value.length > 2) {
      const v = value.trim()
      const suggestions: string[] = []
      if (!v.includes(' ')) {
        suggestions.push(`https://${v}`)
        if (!v.startsWith('www.') && !v.includes('.')) {
          suggestions.push(`https://www.${v}.com`)
          suggestions.push(`https://${v}.com`)
        } else if (!v.startsWith('www.')) {
          suggestions.push(`https://www.${v}`)
        }
      } else {
        suggestions.push(`${SEARCH_ENGINES[searchEngine] ? Object.keys(SEARCH_ENGINES).find(k => k === searchEngine) || 'Google' : 'Google'} 搜索`)
      }
      setSearchSuggestions(suggestions.slice(0, 5))
    } else {
      setSearchSuggestions([])
    }
  }, [searchEngine])

  useEffect(() => {
    const handleMessage = (event: MessageEvent) => {
      if (event.data && event.data.type === 'navigate') {
        navigate(event.data.url, undefined, event.data.engine)
      }
    }
    window.addEventListener('message', handleMessage)
    return () => window.removeEventListener('message', handleMessage)
  }, [navigate])

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', background: '#1e1e1e', color: '#d4d4d4' }}>
      <div style={{ display: 'flex', background: '#252526', borderBottom: '1px solid #333', overflow: 'hidden' }}>
        {tabs.map((tab) => (
          <div
            key={tab.id}
            style={{
              padding: '8px 14px',
              cursor: 'pointer',
              fontSize: 12,
              background: tab.id === activeTabId ? '#1e1e1e' : '#2d2d2d',
              borderRight: '1px solid #333',
              borderTop: tab.id === activeTabId ? '2px solid #007acc' : '2px solid transparent',
              display: 'flex',
              alignItems: 'center',
              gap: 8,
              whiteSpace: 'nowrap',
              maxWidth: 180,
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              transition: 'background 0.15s',
            }}
            onClick={() => {
              setActiveTabId(tab.id)
              setUrlInput(tab.url !== 'about:blank' ? tab.url : '')
            }}
            onMouseEnter={(e) => {
              if (tab.id !== activeTabId) {
                (e.currentTarget as HTMLElement).style.background = '#333'
              }
            }}
            onMouseLeave={(e) => {
              if (tab.id !== activeTabId) {
                (e.currentTarget as HTMLElement).style.background = '#2d2d2d'
              }
            }}
          >
            {tab.loading && (
              <span style={{ fontSize: 12, animation: 'spin 1s linear infinite' }}>⏳</span>
            )}
            {!tab.loading && tab.favicon && (
              <img src={tab.favicon} alt="" style={{ width: 14, height: 14, borderRadius: 2 }} />
            )}
            {!tab.loading && !tab.favicon && (
              <span>🌐</span>
            )}
            <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', flex: 1 }}>
              {tab.title.length > 30 ? tab.title.slice(0, 30) + '...' : tab.title}
            </span>
            <span
              style={{ fontSize: 16, lineHeight: 1, cursor: 'pointer', opacity: 0.5, flexShrink: 0 }}
              onClick={(e) => { e.stopPropagation(); closeTab(tab.id) }}
              onMouseEnter={(e) => (e.currentTarget as HTMLElement).style.opacity = '1'}
              onMouseLeave={(e) => (e.currentTarget as HTMLElement).style.opacity = '0.5'}
            >×</span>
          </div>
        ))}
        <div 
          style={{ 
            padding: '8px 12px', 
            cursor: 'pointer', 
            fontSize: 16, 
            color: '#888',
            borderLeft: '1px solid #333',
            transition: 'background 0.15s'
          }} 
          onClick={addTab}
          onMouseEnter={(e) => (e.currentTarget as HTMLElement).style.background = '#333'}
          onMouseLeave={(e) => (e.currentTarget as HTMLElement).style.background = 'transparent'}
        >
          +
        </div>
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: 4, padding: '6px 10px', background: '#2d2d2d', borderBottom: '1px solid #333' }}>
        <button
          onClick={goBack}
          disabled={historyIndex <= 0}
          title="后退"
          style={{...navBtn, opacity: historyIndex <= 0 ? 0.3 : 1, cursor: historyIndex <= 0 ? 'not-allowed' : 'pointer'}}
        >◀</button>
        <button
          onClick={goForward}
          disabled={historyIndex >= history.length - 1}
          title="前进"
          style={{...navBtn, opacity: historyIndex >= history.length - 1 ? 0.3 : 1, cursor: historyIndex >= history.length - 1 ? 'not-allowed' : 'pointer'}}
        >▶</button>
        <button onClick={refresh} title="刷新" style={navBtn}>🔄</button>
        <button onClick={goHome} title="主页" style={navBtn}>🏠</button>
        <button onClick={() => setShowHistoryPanel(!showHistoryPanel)} title="历史记录" style={{...navBtn, opacity: showHistoryPanel ? 1 : 0.5}}>📜</button>

        <select
          value={searchEngine}
          onChange={(e) => setSearchEngine(e.target.value)}
          title="默认搜索引擎"
          style={{
            padding: '4px 8px',
            border: '1px solid #444',
            borderRadius: 4,
            background: '#1e1e1e',
            color: '#d4d4d4',
            fontSize: 11,
            outline: 'none',
            cursor: 'pointer',
          }}
        >
          <option value="google">Google</option>
          <option value="duckduckgo">DuckDuckGo</option>
          <option value="bing">Bing</option>
          <option value="brave">Brave</option>
          <option value="wikipedia">Wikipedia</option>
          <option value="github">GitHub</option>
        </select>

        <div style={{ flex: 1, margin: '0 8px', position: 'relative' }}>
          <input
            ref={urlInputRef}
            value={urlInput}
            onChange={(e) => handleUrlInputChange(e.target.value)}
            onKeyDown={(e) => { 
              if (e.key === 'Enter') navigate(urlInput) 
              if (e.key === 'ArrowDown' && searchSuggestions.length > 0) {
                e.preventDefault()
              }
            }}
            style={{
              width: '100%',
              padding: '6px 12px',
              border: '1px solid #444',
              borderRadius: 16,
              background: '#1e1e1e',
              color: '#d4d4d4',
              fontSize: 13,
              outline: 'none',
              transition: 'border-color 0.2s',
            }}
            placeholder="输入网址或搜索内容..."
          />
          {searchSuggestions.length > 0 && (
            <div style={{
              position: 'absolute',
              top: '100%',
              left: 0,
              right: 0,
              background: '#252526',
              border: '1px solid #333',
              borderTop: 'none',
              borderRadius: '0 0 8px 8px',
              zIndex: 100,
              boxShadow: '0 4px 12px rgba(0,0,0,0.3)',
            }}>
              {searchSuggestions.map((suggestion, i) => (
                <div 
                  key={i}
                  style={{
                    padding: '8px 12px',
                    cursor: 'pointer',
                    fontSize: 13,
                  }}
                  onClick={() => {
                    navigate(suggestion)
                    setSearchSuggestions([])
                  }}
                  onMouseEnter={(e) => (e.currentTarget as HTMLElement).style.background = '#333'}
                  onMouseLeave={(e) => (e.currentTarget as HTMLElement).style.background = 'transparent'}
                >
                  🔍 {suggestion}
                </div>
              ))}
            </div>
          )}
        </div>
        
        <button onClick={addBookmark} title="添加书签" style={navBtn}>⭐</button>
        <button onClick={() => setShowBookmarksBar(!showBookmarksBar)} title="书签栏" style={{...navBtn, opacity: showBookmarksBar ? 1 : 0.5}}>📑</button>
      </div>

      {showBookmarksBar && (
        <div style={{ display: 'flex', alignItems: 'center', gap: 4, padding: '4px 10px', background: '#252526', borderBottom: '1px solid #333', overflowX: 'auto', overflowY: 'hidden' }}>
          {bookmarks.map((bm, i) => (
            <div
              key={i}
              style={{ 
                padding: '4px 10px', 
                cursor: 'pointer', 
                fontSize: 12, 
                borderRadius: 10, 
                background: '#333',
                whiteSpace: 'nowrap',
                display: 'flex',
                alignItems: 'center',
                gap: 4,
                transition: 'background 0.15s'
              }}
              onClick={() => {
                setUrlInput(bm.url)
                if (bm.url === 'about:blank') goHome()
                else navigate(bm.url)
              }}
              onMouseEnter={(e) => (e.currentTarget as HTMLElement).style.background = '#444'}
              onMouseLeave={(e) => (e.currentTarget as HTMLElement).style.background = '#333'}
              onContextMenu={(e) => {
                e.preventDefault()
                removeBookmark(bm.url)
              }}
            >
              {bm.name}
            </div>
          ))}
        </div>
      )}

      <div style={{ flex: 1, display: 'flex', overflow: 'hidden' }}>
        {showHistoryPanel && (
          <div style={{ width: 220, background: '#252526', borderRight: '1px solid #333', overflowY: 'auto' }}>
            <div style={{ padding: '12px', borderBottom: '1px solid #333', fontWeight: 'bold', fontSize: 13 }}>
              📜 历史记录
            </div>
            <div style={{ padding: '8px' }}>
              {history.length === 0 ? (
                <div style={{ padding: '16px', textAlign: 'center', color: '#666', fontSize: 12 }}>
                  暂无历史记录
                </div>
              ) : (
                [...history].reverse().slice(0, 50).map((url, i) => (
                  <div
                    key={i}
                    style={{
                      padding: '8px',
                      cursor: 'pointer',
                      fontSize: 12,
                      borderRadius: 4,
                      marginBottom: 2,
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      whiteSpace: 'nowrap',
                    }}
                    onClick={() => {
                      navigate(url)
                      setShowHistoryPanel(false)
                    }}
                    onMouseEnter={(e) => (e.currentTarget as HTMLElement).style.background = '#333'}
                    onMouseLeave={(e) => (e.currentTarget as HTMLElement).style.background = 'transparent'}
                  >
                    🌐 {url.length > 50 ? url.slice(0, 50) + '...' : url}
                  </div>
                ))
              )}
            </div>
          </div>
        )}
        
        <div style={{ flex: 1, overflow: 'hidden', position: 'relative' }}>
          {activeTab && activeTab.url === 'about:blank' ? (
            <iframe
              srcDoc={tabContents[activeTabId] || welcomePage}
              style={{ width: '100%', height: '100%', border: 'none' }}
              title="browser-content"
              sandbox="allow-scripts allow-same-origin allow-forms allow-popups"
            />
          ) : (
            <iframe
              src={activeTab?.url}
              style={{ width: '100%', height: '100%', border: 'none' }}
              title="browser-content"
              sandbox="allow-scripts allow-same-origin allow-forms allow-popups allow-top-navigation"
              onLoad={() => {
                setTabs((prev) => prev.map((t) => 
                  t.id === activeTabId ? { ...t, loading: false } : t
                ))
              }}
            />
          )}
          
          {activeTab?.loading && (
            <div style={{ 
              position: 'absolute', 
              top: 0, 
              left: 0, 
              right: 0, 
              height: 3, 
              background: '#333',
              zIndex: 10,
              overflow: 'hidden'
            }}>
              <div style={{ 
                height: '100%', 
                width: '30%', 
                background: 'linear-gradient(90deg, #007acc, #4ecca3)', 
                animation: 'progress 1s ease-in-out infinite',
                borderRadius: 2 
              }} />
              <style>{`@keyframes progress { 0% { transform: translateX(-100%); } 100% { transform: translateX(400%); } }`}</style>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

const navBtn: React.CSSProperties = {
  background: 'transparent',
  border: 'none',
  color: '#ccc',
  cursor: 'pointer',
  padding: '4px 8px',
  borderRadius: 3,
  fontSize: 12,
  transition: 'opacity 0.15s',
}
