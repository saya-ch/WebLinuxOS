import { useState, useCallback, memo, useEffect, useRef } from 'react'

const searchEngines = [
  { name: 'Google', icon: '🔍', baseUrl: 'https://www.google.com/search?q=' },
  { name: 'Bing', icon: '🌐', baseUrl: 'https://www.bing.com/search?q=' },
  { name: 'DuckDuckGo', icon: '🦆', baseUrl: 'https://duckduckgo.com/?q=' },
  { name: 'Baidu', icon: '🌸', baseUrl: 'https://www.baidu.com/s?wd=' },
  { name: 'Wikipedia', icon: '📚', baseUrl: 'https://en.wikipedia.org/w/index.php?search=' },
  { name: 'GitHub', icon: '🐙', baseUrl: 'https://github.com/search?q=' },
  { name: 'Stack Overflow', icon: '💼', baseUrl: 'https://stackoverflow.com/search?q=' },
  { name: 'MDN', icon: '📖', baseUrl: 'https://developer.mozilla.org/search?q=' },
]

const quickLinks = [
  { name: 'ChatGPT', url: 'https://chat.openai.com', icon: '🤖', category: 'AI' },
  { name: 'Claude', url: 'https://claude.ai', icon: '🧠', category: 'AI' },
  { name: 'Gemini', url: 'https://gemini.google.com', icon: '✨', category: 'AI' },
  { name: 'DeepL', url: 'https://www.deepl.com/translator', icon: '🌍', category: '翻译' },
  { name: 'Canva', url: 'https://www.canva.com', icon: '🎨', category: '设计' },
  { name: 'Figma', url: 'https://figma.com', icon: '✏️', category: '设计' },
  { name: 'CodePen', url: 'https://codepen.io', icon: '💻', category: '代码' },
  { name: 'Replit', url: 'https://replit.com', icon: '🚀', category: '代码' },
  { name: 'Notion', url: 'https://www.notion.so', icon: '📝', category: '效率' },
  { name: 'Linear', url: 'https://linear.app', icon: '📊', category: '效率' },
  { name: 'Vercel', url: 'https://vercel.com', icon: '▲', category: '部署' },
  { name: 'Netlify', url: 'https://www.netlify.com', icon: '🌐', category: '部署' },
]

const SmartSearch = memo(function SmartSearch() {
  const [query, setQuery] = useState('')
  const [selectedEngine, setSelectedEngine] = useState(searchEngines[0])
  const [showEngineMenu, setShowEngineMenu] = useState(false)
  const [showQuickLinks, setShowQuickLinks] = useState(false)
  const [searchHistory, setSearchHistory] = useState<string[]>([])
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    const saved = localStorage.getItem('weblinux-search-history')
    if (saved) {
      setSearchHistory(JSON.parse(saved))
    }
    inputRef.current?.focus()
  }, [])

  const saveToHistory = useCallback((term: string) => {
    const newHistory = [term, ...searchHistory.filter(t => t !== term)].slice(0, 10)
    setSearchHistory(newHistory)
    localStorage.setItem('weblinux-search-history', JSON.stringify(newHistory))
  }, [searchHistory])

  const handleSearch = useCallback((e: React.FormEvent) => {
    e.preventDefault()
    if (!query.trim()) return
    
    saveToHistory(query.trim())
    
    const url = selectedEngine.baseUrl + encodeURIComponent(query)
    window.open(url, '_blank')
  }, [query, selectedEngine, saveToHistory])

  const handleQuickSearch = useCallback((engine: typeof searchEngines[0]) => {
    if (!query.trim()) return
    saveToHistory(query.trim())
    const url = engine.baseUrl + encodeURIComponent(query)
    window.open(url, '_blank')
  }, [query, saveToHistory])

  const clearHistory = useCallback(() => {
    setSearchHistory([])
    localStorage.removeItem('weblinux-search-history')
  }, [])

  const getSuggestion = useCallback((input: string) => {
    if (!input.trim()) return null
    const suggestions = [
      'how to learn react in 2024',
      'best vscode extensions for web development',
      'python machine learning tutorial',
      'docker compose nodejs mysql',
      'linux command line basics',
      'git merge vs rebase',
      'typescript best practices',
      'react hooks complete guide',
    ]
    return suggestions.find(s => 
      s.toLowerCase().includes(input.toLowerCase()) && 
      s.toLowerCase() !== input.toLowerCase()
    )
  }, [])

  const suggestion = getSuggestion(query)

  return (
    <div style={{
      height: '100%',
      background: 'linear-gradient(135deg, #0f0c29 0%, #302b63 50%, #24243e 100%)',
      display: 'flex',
      flexDirection: 'column',
      overflow: 'hidden'
    }}>
      <div style={{
        padding: '32px 24px',
        background: 'rgba(0,0,0,0.2)',
        borderBottom: '1px solid rgba(255,255,255,0.1)'
      }}>
        <div style={{
          fontSize: 32,
          fontWeight: 700,
          color: '#fff',
          marginBottom: 24,
          display: 'flex',
          alignItems: 'center',
          gap: 12
        }}>
          <span style={{ fontSize: 40 }}>🔍</span>
          <span style={{
            background: 'linear-gradient(90deg, #667eea 0%, #764ba2 100%)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent'
          }}>Smart Search</span>
        </div>

        <form onSubmit={handleSearch} style={{ position: 'relative' }}>
          <div style={{ display: 'flex', gap: 8, marginBottom: 12 }}>
            <button
              type="button"
              onClick={() => setShowEngineMenu(!showEngineMenu)}
              style={{
                padding: '12px 16px',
                background: 'rgba(255,255,255,0.1)',
                border: '1px solid rgba(255,255,255,0.2)',
                borderRadius: 12,
                color: '#fff',
                cursor: 'pointer',
                fontSize: 18,
                display: 'flex',
                alignItems: 'center',
                gap: 8,
                minWidth: 120,
                transition: 'all 0.2s'
              }}
            >
              <span>{selectedEngine.icon}</span>
              <span>{selectedEngine.name}</span>
              <span style={{ fontSize: 12 }}>▼</span>
            </button>

            {showEngineMenu && (
              <div style={{
                position: 'absolute',
                top: '100%',
                left: 0,
                marginTop: 4,
                background: 'rgba(30, 30, 50, 0.98)',
                border: '1px solid rgba(255,255,255,0.2)',
                borderRadius: 12,
                padding: 8,
                zIndex: 1000,
                minWidth: 200,
                backdropFilter: 'blur(20px)',
                boxShadow: '0 8px 32px rgba(0,0,0,0.4)'
              }}>
                {searchEngines.map((engine) => (
                  <button
                    key={engine.name}
                    onClick={() => {
                      setSelectedEngine(engine)
                      setShowEngineMenu(false)
                    }}
                    style={{
                      width: '100%',
                      padding: '10px 12px',
                      background: selectedEngine.name === engine.name ? 'rgba(102, 126, 234, 0.3)' : 'transparent',
                      border: 'none',
                      borderRadius: 8,
                      color: '#fff',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      gap: 8,
                      fontSize: 14,
                      transition: 'background 0.2s'
                    }}
                    onMouseEnter={(e) => e.currentTarget.style.background = 'rgba(255,255,255,0.1)'}
                    onMouseLeave={(e) => e.currentTarget.style.background = selectedEngine.name === engine.name ? 'rgba(102, 126, 234, 0.3)' : 'transparent'}
                  >
                    <span>{engine.icon}</span>
                    <span>{engine.name}</span>
                  </button>
                ))}
              </div>
            )}

            <input
              ref={inputRef}
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="搜索 anything..."
              style={{
                flex: 1,
                padding: '12px 16px',
                background: 'rgba(255,255,255,0.1)',
                border: '1px solid rgba(255,255,255,0.2)',
                borderRadius: 12,
                color: '#fff',
                fontSize: 16,
                outline: 'none',
                transition: 'all 0.2s'
              }}
              onFocus={(e) => {
                e.target.style.borderColor = '#667eea'
                e.target.style.boxShadow = '0 0 0 3px rgba(102, 126, 234, 0.3)'
              }}
              onBlur={(e) => {
                e.target.style.borderColor = 'rgba(255,255,255,0.2)'
                e.target.style.boxShadow = 'none'
              }}
            />

            <button
              type="submit"
              disabled={!query.trim()}
              style={{
                padding: '12px 24px',
                background: query.trim() ? 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)' : 'rgba(255,255,255,0.1)',
                border: 'none',
                borderRadius: 12,
                color: '#fff',
                fontSize: 16,
                fontWeight: 600,
                cursor: query.trim() ? 'pointer' : 'not-allowed',
                transition: 'all 0.2s'
              }}
            >
              Search
            </button>
          </div>

          {suggestion && (
            <div style={{
              marginTop: 8,
              fontSize: 13,
              color: 'rgba(255,255,255,0.6)'
            }}>
              Did you mean: <button
                onClick={() => setQuery(suggestion)}
                style={{
                  background: 'none',
                  border: 'none',
                  color: '#667eea',
                  cursor: 'pointer',
                  textDecoration: 'underline',
                  fontSize: 13
                }}
              >
                {suggestion}
              </button>
            </div>
          )}

          <div style={{ display: 'flex', gap: 8, marginTop: 12, flexWrap: 'wrap' }}>
            {searchEngines.slice(0, 4).map((engine) => (
              <button
                key={engine.name}
                type="button"
                onClick={() => handleQuickSearch(engine)}
                disabled={!query.trim()}
                style={{
                  padding: '6px 12px',
                  background: query.trim() ? 'rgba(255,255,255,0.1)' : 'rgba(255,255,255,0.05)',
                  border: '1px solid rgba(255,255,255,0.2)',
                  borderRadius: 8,
                  color: query.trim() ? '#fff' : 'rgba(255,255,255,0.5)',
                  fontSize: 12,
                  cursor: query.trim() ? 'pointer' : 'not-allowed',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 4,
                  transition: 'all 0.2s'
                }}
              >
                <span>{engine.icon}</span>
                <span>via {engine.name}</span>
              </button>
            ))}
          </div>
        </form>
      </div>

      <div style={{ flex: 1, overflow: 'auto', padding: 24 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
          <h3 style={{ color: '#fff', margin: 0, fontSize: 18, fontWeight: 600 }}>Quick Links</h3>
          <button
            onClick={() => setShowQuickLinks(!showQuickLinks)}
            style={{
              padding: '6px 12px',
              background: 'rgba(255,255,255,0.1)',
              border: 'none',
              borderRadius: 6,
              color: '#fff',
              fontSize: 12,
              cursor: 'pointer'
            }}
          >
            {showQuickLinks ? 'Hide' : 'Show'} All
          </button>
        </div>

        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(150px, 1fr))',
          gap: 12,
          marginBottom: 24
        }}>
          {(showQuickLinks ? quickLinks : quickLinks.slice(0, 6)).map((link) => (
            <a
              key={link.name}
              href={link.url}
              target="_blank"
              rel="noopener noreferrer"
              style={{
                padding: 16,
                background: 'rgba(255,255,255,0.05)',
                border: '1px solid rgba(255,255,255,0.1)',
                borderRadius: 12,
                color: '#fff',
                textDecoration: 'none',
                transition: 'all 0.2s',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: 8,
                fontSize: 13
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = 'rgba(255,255,255,0.1)'
                e.currentTarget.style.transform = 'translateY(-2px)'
                e.currentTarget.style.boxShadow = '0 4px 12px rgba(0,0,0,0.3)'
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = 'rgba(255,255,255,0.05)'
                e.currentTarget.style.transform = 'translateY(0)'
                e.currentTarget.style.boxShadow = 'none'
              }}
            >
              <span style={{ fontSize: 28 }}>{link.icon}</span>
              <span>{link.name}</span>
              <span style={{ fontSize: 11, color: 'rgba(255,255,255,0.5)' }}>{link.category}</span>
            </a>
          ))}
        </div>

        {searchHistory.length > 0 && (
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
              <h3 style={{ color: '#fff', margin: 0, fontSize: 18, fontWeight: 600 }}>Recent Searches</h3>
              <button
                onClick={clearHistory}
                style={{
                  padding: '4px 8px',
                  background: 'rgba(239, 68, 68, 0.2)',
                  border: 'none',
                  borderRadius: 4,
                  color: '#ef4444',
                  fontSize: 12,
                  cursor: 'pointer'
                }}
              >
                Clear All
              </button>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {searchHistory.map((term, index) => (
                <button
                  key={index}
                  onClick={() => setQuery(term)}
                  style={{
                    padding: '10px 16px',
                    background: 'rgba(255,255,255,0.05)',
                    border: '1px solid rgba(255,255,255,0.1)',
                    borderRadius: 8,
                    color: '#fff',
                    textAlign: 'left',
                    cursor: 'pointer',
                    fontSize: 14,
                    display: 'flex',
                    alignItems: 'center',
                    gap: 8,
                    transition: 'all 0.2s'
                  }}
                  onMouseEnter={(e) => e.currentTarget.style.background = 'rgba(255,255,255,0.1)'}
                  onMouseLeave={(e) => e.currentTarget.style.background = 'rgba(255,255,255,0.05)'}
                >
                  <span style={{ fontSize: 14 }}>🕐</span>
                  <span>{term}</span>
                </button>
              ))}
            </div>
          </div>
        )}

        <div style={{
          marginTop: 32,
          padding: 20,
          background: 'rgba(102, 126, 234, 0.1)',
          borderRadius: 12,
          border: '1px solid rgba(102, 126, 234, 0.3)'
        }}>
          <h4 style={{ color: '#fff', margin: '0 0 12px 0', fontSize: 16, fontWeight: 600 }}>
            Pro Tips
          </h4>
          <ul style={{ color: 'rgba(255,255,255,0.8)', margin: 0, paddingLeft: 20, fontSize: 13, lineHeight: 1.8 }}>
            <li>Use <code style={{ background: 'rgba(0,0,0,0.3)', padding: '2px 6px', borderRadius: 4 }}>site:</code> to search within a specific website</li>
            <li>Use <code style={{ background: 'rgba(0,0,0,0.3)', padding: '2px 6px', borderRadius: 4 }}>"exact phrase"</code> for exact matches</li>
            <li>Use <code style={{ background: 'rgba(0,0,0,0.3)', padding: '2px 6px', borderRadius: 4 }}>-exclude</code> to filter results</li>
            <li>Use <code style={{ background: 'rgba(0,0,0,0.3)', padding: '2px 6px', borderRadius: 4 }}>filetype:pdf</code> to find specific file types</li>
          </ul>
        </div>
      </div>
    </div>
  )
})

export default SmartSearch
