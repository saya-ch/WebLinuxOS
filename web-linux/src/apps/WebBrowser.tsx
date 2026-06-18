import { useState, useCallback, useRef, useEffect, memo } from 'react'

interface HistoryItem {
  url: string
  title: string
  timestamp: Date
}

interface Bookmark {
  url: string
  title: string
  addedAt: Date
}

// 预设的快速访问网站
const QUICK_ACCESS = [
  { url: 'https://www.google.com', title: 'Google', icon: '🔍' },
  { url: 'https://www.github.com', title: 'GitHub', icon: '🐙' },
  { url: 'https://www.wikipedia.org', title: 'Wikipedia', icon: '📚' },
  { url: 'https://www.youtube.com', title: 'YouTube', icon: '📺' },
  { url: 'https://www.reddit.com', title: 'Reddit', icon: '🔴' },
  { url: 'https://www.twitter.com', title: 'Twitter', icon: '🐦' },
  { url: 'https://www.stackoverflow.com', title: 'Stack Overflow', icon: '💻' },
  { url: 'https://www.medium.com', title: 'Medium', icon: '📝' },
  { url: 'https://www.hackernews.com', title: 'Hacker News', icon: '📰' },
  { url: 'https://www.producthunt.com', title: 'Product Hunt', icon: '🚀' },
]

const WebBrowser = memo(function WebBrowser() {
  const [url, setUrl] = useState('https://www.google.com')
  const [inputUrl, setInputUrl] = useState('https://www.google.com')
  const [isLoading, setIsLoading] = useState(false)
  const [history, setHistory] = useState<HistoryItem[]>(() => {
    try {
      const saved = localStorage.getItem('weblinux-browser-history')
      return saved ? JSON.parse(saved) : []
    } catch {
      return []
    }
  })
  const [bookmarks, setBookmarks] = useState<Bookmark[]>(() => {
    try {
      const saved = localStorage.getItem('weblinux-browser-bookmarks')
      return saved ? JSON.parse(saved) : []
    } catch {
      return []
    }
  })
  const [showHistory, setShowHistory] = useState(false)
  const [showBookmarks, setShowBookmarks] = useState(false)
  const [historyIndex, setHistoryIndex] = useState(-1)
  const [currentTitle, setCurrentTitle] = useState('Web Browser')
  const [error, setError] = useState<string | null>(null)
  
  const iframeRef = useRef<HTMLIFrameElement>(null)
  
  // 保存历史到localStorage
  useEffect(() => {
    if (history.length > 0) {
      localStorage.setItem('weblinux-browser-history', JSON.stringify(history.slice(-50)))
    }
  }, [history])
  
  // 保存书签到localStorage
  useEffect(() => {
    if (bookmarks.length > 0) {
      localStorage.setItem('weblinux-browser-bookmarks', JSON.stringify(bookmarks))
    }
  }, [bookmarks])
  
  // 导航到URL
  const navigateTo = useCallback((targetUrl: string) => {
    let finalUrl = targetUrl.trim()
    
    // 如果没有协议，添加https
    if (!finalUrl.startsWith('http://') && !finalUrl.startsWith('https://')) {
      // 检查是否是域名
      if (finalUrl.includes('.') && !finalUrl.includes(' ')) {
        finalUrl = 'https://' + finalUrl
      } else {
        // 作为搜索查询
        finalUrl = `https://www.google.com/search?q=${encodeURIComponent(finalUrl)}`
      }
    }
    
    setUrl(finalUrl)
    setInputUrl(finalUrl)
    setIsLoading(true)
    setError(null)
    
    // 添加到历史
    const newHistoryItem: HistoryItem = {
      url: finalUrl,
      title: finalUrl.split('/')[2] || finalUrl,
      timestamp: new Date()
    }
    setHistory(prev => [...prev.slice(historyIndex + 1), newHistoryItem])
    setHistoryIndex(prev => prev + 1)
    
    // 模拟加载完成
    setTimeout(() => {
      setIsLoading(false)
      setCurrentTitle(finalUrl.split('/')[2] || 'Web Browser')
    }, 500)
  }, [historyIndex])
  
  // 返回上一页
  const goBack = useCallback(() => {
    if (historyIndex > 0) {
      const prevItem = history[historyIndex - 1]
      setUrl(prevItem.url)
      setInputUrl(prevItem.url)
      setHistoryIndex(prev => prev - 1)
      setIsLoading(true)
      setTimeout(() => setIsLoading(false), 300)
    }
  }, [historyIndex, history])
  
  // 前进下一页
  const goForward = useCallback(() => {
    if (historyIndex < history.length - 1) {
      const nextItem = history[historyIndex + 1]
      setUrl(nextItem.url)
      setInputUrl(nextItem.url)
      setHistoryIndex(prev => prev + 1)
      setIsLoading(true)
      setTimeout(() => setIsLoading(false), 300)
    }
  }, [historyIndex, history])
  
  // 刷新页面
  const refresh = useCallback(() => {
    setIsLoading(true)
    setError(null)
    // 重新加载iframe
    if (iframeRef.current) {
      iframeRef.current.src = url
    }
    setTimeout(() => setIsLoading(false), 500)
  }, [url])
  
  // 添加书签
  const addBookmark = useCallback(() => {
    const exists = bookmarks.some(b => b.url === url)
    if (!exists) {
      const newBookmark: Bookmark = {
        url,
        title: currentTitle,
        addedAt: new Date()
      }
      setBookmarks(prev => [...prev, newBookmark])
    }
  }, [url, currentTitle, bookmarks])
  
  // 删除书签
  const removeBookmark = useCallback((targetUrl: string) => {
    setBookmarks(prev => prev.filter(b => b.url !== targetUrl))
  }, [])
  
  // 清除历史
  const clearHistory = useCallback(() => {
    setHistory([])
    setHistoryIndex(-1)
    localStorage.removeItem('weblinux-browser-history')
  }, [])
  
  // 处理iframe加载错误
  const handleIframeError = useCallback(() => {
    setError('无法加载此页面。某些网站可能阻止在iframe中显示。')
    setIsLoading(false)
  }, [])
  
  // 检查是否已收藏
  const isBookmarked = bookmarks.some(b => b.url === url)
  
  return (
    <div style={{
      height: '100%',
      display: 'flex',
      flexDirection: 'column',
      background: '#1a1a2e',
      color: '#e6edf3',
      fontFamily: 'system-ui, -apple-system, sans-serif'
    }}>
      {/* 工具栏 */}
      <div style={{
        padding: '8px 12px',
        background: '#161b22',
        borderBottom: '1px solid #30363d',
        display: 'flex',
        alignItems: 'center',
        gap: 8,
        flexWrap: 'wrap'
      }}>
        {/* 导航按钮 */}
        <div style={{ display: 'flex', gap: 4 }}>
          <button
            onClick={goBack}
            disabled={historyIndex <= 0}
            style={{
              padding: '8px 12px',
              borderRadius: 6,
              border: '1px solid #30363d',
              background: historyIndex > 0 ? 'transparent' : 'rgba(48,54,61,0.5)',
              color: historyIndex > 0 ? '#c9d1d9' : '#6e7681',
              cursor: historyIndex > 0 ? 'pointer' : 'not-allowed',
              fontSize: 14,
              transition: 'all 0.2s'
            }}
          >
            ←
          </button>
          <button
            onClick={goForward}
            disabled={historyIndex >= history.length - 1}
            style={{
              padding: '8px 12px',
              borderRadius: 6,
              border: '1px solid #30363d',
              background: historyIndex < history.length - 1 ? 'transparent' : 'rgba(48,54,61,0.5)',
              color: historyIndex < history.length - 1 ? '#c9d1d9' : '#6e7681',
              cursor: historyIndex < history.length - 1 ? 'pointer' : 'not-allowed',
              fontSize: 14,
              transition: 'all 0.2s'
            }}
          >
            →
          </button>
          <button
            onClick={refresh}
            style={{
              padding: '8px 12px',
              borderRadius: 6,
              border: '1px solid #30363d',
              background: 'transparent',
              color: '#c9d1d9',
              cursor: 'pointer',
              fontSize: 14,
              transition: 'all 0.2s'
            }}
          >
            {isLoading ? '⏳' : '🔄'}
          </button>
        </div>
        
        {/* URL输入框 */}
        <div style={{
          flex: 1,
          minWidth: 200,
          position: 'relative'
        }}>
          <input
            type="text"
            value={inputUrl}
            onChange={(e) => setInputUrl(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                navigateTo(inputUrl)
              }
            }}
            placeholder="输入网址或搜索..."
            style={{
              width: '100%',
              padding: '10px 14px',
              borderRadius: 8,
              border: '1px solid #30363d',
              background: '#0d1117',
              color: '#e6edf3',
              fontSize: 14,
              outline: 'none',
              transition: 'border-color 0.2s'
            }}
          />
          {isLoading && (
            <div style={{
              position: 'absolute',
              right: 10,
              top: '50%',
              transform: 'translateY(-50%)',
              color: '#667eea',
              fontSize: 12
            }}>
              加载中...
            </div>
          )}
        </div>
        
        {/* 操作按钮 */}
        <div style={{ display: 'flex', gap: 4 }}>
          <button
            onClick={addBookmark}
            style={{
              padding: '8px 12px',
              borderRadius: 6,
              border: '1px solid #30363d',
              background: isBookmarked ? 'rgba(102,126,234,0.2)' : 'transparent',
              color: isBookmarked ? '#667eea' : '#c9d1d9',
              cursor: 'pointer',
              fontSize: 14,
              transition: 'all 0.2s'
            }}
          >
            {isBookmarked ? '★' : '☆'}
          </button>
          <button
            onClick={() => setShowBookmarks(!showBookmarks)}
            style={{
              padding: '8px 12px',
              borderRadius: 6,
              border: '1px solid #30363d',
              background: showBookmarks ? 'rgba(102,126,234,0.2)' : 'transparent',
              color: '#c9d1d9',
              cursor: 'pointer',
              fontSize: 14,
              transition: 'all 0.2s'
            }}
          >
            📚
          </button>
          <button
            onClick={() => setShowHistory(!showHistory)}
            style={{
              padding: '8px 12px',
              borderRadius: 6,
              border: '1px solid #30363d',
              background: showHistory ? 'rgba(102,126,234,0.2)' : 'transparent',
              color: '#c9d1d9',
              cursor: 'pointer',
              fontSize: 14,
              transition: 'all 0.2s'
            }}
          >
            📜
          </button>
        </div>
      </div>
      
      {/* 主内容区 */}
      <div style={{
        flex: 1,
        display: 'flex',
        overflow: 'hidden'
      }}>
        {/* 侧边栏 */}
        {(showHistory || showBookmarks) && (
          <div style={{
            width: 280,
            background: '#161b22',
            borderRight: '1px solid #30363d',
            display: 'flex',
            flexDirection: 'column',
            overflow: 'hidden'
          }}>
            <div style={{
              padding: '12px 16px',
              borderBottom: '1px solid #30363d',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center'
            }}>
              <h3 style={{ fontSize: 14, fontWeight: 600, margin: 0 }}>
                {showHistory ? '浏览历史' : '书签'}
              </h3>
              <button
                onClick={() => {
                  if (showHistory) clearHistory()
                  else setBookmarks([])
                }}
                style={{
                  padding: '4px 8px',
                  borderRadius: 4,
                  border: '1px solid #30363d',
                  background: 'transparent',
                  color: '#8b949e',
                  cursor: 'pointer',
                  fontSize: 12
                }}
              >
                清空
              </button>
            </div>
            <div style={{
              flex: 1,
              overflowY: 'auto',
              padding: 8
            }}>
              {showHistory ? (
                history.length === 0 ? (
                  <div style={{
                    color: '#8b949e',
                    textAlign: 'center',
                    padding: 20,
                    fontSize: 13
                  }}>
                    暂无浏览历史
                  </div>
                ) : (
                  history.slice().reverse().map((item, i) => (
                    <div
                      key={i}
                      onClick={() => {
                        navigateTo(item.url)
                        setShowHistory(false)
                      }}
                      style={{
                        padding: '10px 12px',
                        borderRadius: 6,
                        background: url === item.url ? 'rgba(102,126,234,0.2)' : 'transparent',
                        cursor: 'pointer',
                        marginBottom: 4,
                        border: '1px solid transparent',
                        transition: 'all 0.2s'
                      }}
                    >
                      <div style={{ fontSize: 13, color: '#e6edf3', marginBottom: 4 }}>
                        {item.title}
                      </div>
                      <div style={{ fontSize: 11, color: '#8b949e' }}>
                        {item.url}
                      </div>
                    </div>
                  ))
                )
              ) : (
                bookmarks.length === 0 ? (
                  <div style={{
                    color: '#8b949e',
                    textAlign: 'center',
                    padding: 20,
                    fontSize: 13
                  }}>
                    暂无书签
                  </div>
                ) : (
                  bookmarks.map((bookmark, i) => (
                    <div
                      key={i}
                      style={{
                        padding: '10px 12px',
                        borderRadius: 6,
                        background: 'transparent',
                        cursor: 'pointer',
                        marginBottom: 4,
                        border: '1px solid transparent',
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        transition: 'all 0.2s'
                      }}
                    >
                      <div
                        onClick={() => {
                          navigateTo(bookmark.url)
                          setShowBookmarks(false)
                        }}
                        style={{ flex: 1 }}
                      >
                        <div style={{ fontSize: 13, color: '#e6edf3', marginBottom: 4 }}>
                          {bookmark.title}
                        </div>
                        <div style={{ fontSize: 11, color: '#8b949e' }}>
                          {bookmark.url}
                        </div>
                      </div>
                      <button
                        onClick={() => removeBookmark(bookmark.url)}
                        style={{
                          background: 'none',
                          border: 'none',
                          color: '#8b949e',
                          cursor: 'pointer',
                          fontSize: 12,
                          padding: 4
                        }}
                      >
                        ✕
                      </button>
                    </div>
                  ))
                )
              )}
            </div>
          </div>
        )}
        
        {/* 浏览器内容 */}
        <div style={{
          flex: 1,
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden'
        }}>
          {error ? (
            <div style={{
              flex: 1,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexDirection: 'column',
              gap: 16,
              padding: 40
            }}>
              <div style={{ fontSize: 48 }}>⚠️</div>
              <div style={{ fontSize: 16, color: '#e6edf3', textAlign: 'center' }}>
                {error}
              </div>
              <div style={{ fontSize: 13, color: '#8b949e', textAlign: 'center', maxWidth: 400 }}>
                这是由于网站的安全策略限制。你可以尝试访问其他网站，或使用外部浏览器打开此链接。
              </div>
              <button
                onClick={() => window.open(url, '_blank')}
                style={{
                  padding: '10px 20px',
                  borderRadius: 8,
                  border: 'none',
                  background: 'linear-gradient(135deg, #667eea, #764ba2)',
                  color: '#fff',
                  cursor: 'pointer',
                  fontSize: 14,
                  fontWeight: 600
                }}
              >
                在外部浏览器打开
              </button>
            </div>
          ) : (
            <iframe
              ref={iframeRef}
              src={url}
              title="Web Browser"
              sandbox="allow-same-origin allow-scripts allow-popups allow-forms allow-modals"
              style={{
                flex: 1,
                width: '100%',
                height: '100%',
                border: 'none',
                background: '#fff'
              }}
              onError={handleIframeError}
            />
          )}
        </div>
      </div>
      
      {/* 快速访问栏 */}
      <div style={{
        padding: '8px 12px',
        background: '#161b22',
        borderTop: '1px solid #30363d',
        display: 'flex',
        gap: 8,
        flexWrap: 'wrap',
        alignItems: 'center'
      }}>
        <span style={{ fontSize: 12, color: '#8b949e' }}>快速访问:</span>
        {QUICK_ACCESS.map(site => (
          <button
            key={site.url}
            onClick={() => navigateTo(site.url)}
            style={{
              padding: '6px 10px',
              borderRadius: 6,
              border: '1px solid #30363d',
              background: 'transparent',
              color: '#c9d1d9',
              cursor: 'pointer',
              fontSize: 12,
              display: 'flex',
              alignItems: 'center',
              gap: 4,
              transition: 'all 0.2s'
            }}
          >
            <span>{site.icon}</span>
            <span>{site.title}</span>
          </button>
        ))}
      </div>
      
      {/* 状态栏 */}
      <div style={{
        padding: '6px 12px',
        background: '#0d1117',
        borderTop: '1px solid #30363d',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        fontSize: 11,
        color: '#8b949e'
      }}>
        <span>{currentTitle}</span>
        <span>{url}</span>
      </div>
    </div>
  )
})

export default WebBrowser