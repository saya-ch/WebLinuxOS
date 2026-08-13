import { useState, useCallback, useEffect, useRef } from 'react'

type ApiId = 
  | 'weather' | 'exchange' | 'crypto' | 'news' | 'quote'
  | 'joke' | 'wiki' | 'ip' | 'country' | 'github'

interface ApiDef {
  id: ApiId
  name: string
  icon: string
  category: string
  description: string
  endpoint: string
  needsInput: boolean
  inputPlaceholder?: string
  defaultInput?: string
}

const APIS: ApiDef[] = [
  { id: 'weather', name: '天气预报', icon: '🌤️', category: '天气', description: 'Open-Meteo 免费API，全球城市实时天气', endpoint: 'https://api.open-meteo.com/v1/forecast', needsInput: true, inputPlaceholder: '输入城市名称，如：北京、上海、London', defaultInput: '北京' },
  { id: 'exchange', name: '汇率转换', icon: '💱', category: '金融', description: 'Frankfurter API，150+货币实时汇率', endpoint: 'https://api.frankfurter.app/latest', needsInput: true, inputPlaceholder: '基础货币代码，如：USD、CNY、EUR', defaultInput: 'USD' },
  { id: 'crypto', name: '加密货币', icon: '🪙', category: '金融', description: 'CoinGecko API，100+币种实时行情', endpoint: 'https://api.coingecko.com/api/v3/simple/price', needsInput: true, inputPlaceholder: '货币ID（英文逗号分隔），如：bitcoin,ethereum', defaultInput: 'bitcoin,ethereum,solana' },
  { id: 'news', name: '科技新闻', icon: '📰', category: '资讯', description: 'Hacker News API，最新科技动态', endpoint: 'https://hacker-news.firebaseio.com/v0', needsInput: false },
  { id: 'quote', name: '励志名言', icon: '💬', category: '娱乐', description: 'ZenQuotes API，随机励志名言', endpoint: 'https://zenquotes.io/api/random', needsInput: false },
  { id: 'joke', name: '编程笑话', icon: '😄', category: '娱乐', description: 'JokeAPI，开发爆笑编程笑话', endpoint: 'https://v2.jokeapi.dev/joke/programming', needsInput: false },
  { id: 'wiki', name: '维基搜索', icon: '📚', category: '知识', description: 'Wikipedia API，百科搜索与摘要', endpoint: 'https://en.wikipedia.org/api/rest_v1/page/summary', needsInput: true, inputPlaceholder: '搜索关键词（英文），如：Python,React', defaultInput: 'React' },
  { id: 'ip', name: 'IP查询', icon: '🌐', category: '网络', description: 'IP-API，IP位置与运营商信息', endpoint: 'http://ip-api.com/json', needsInput: false },
  { id: 'country', name: '国家信息', icon: '🏳️', category: '知识', description: 'REST Countries API，各国详情', endpoint: 'https://restcountries.com/v3.1/name', needsInput: true, inputPlaceholder: '国家名称（英文），如：China,Japan', defaultInput: 'China' },
  { id: 'github', name: 'GitHub趋势', icon: '⭐', category: '开发', description: 'GitHub API，热门仓库探索', endpoint: 'https://api.github.com/search/repositories', needsInput: true, inputPlaceholder: '搜索关键词，如：react,vue,typescript', defaultInput: 'react' },
]

const CATEGORIES = ['全部', '天气', '金融', '资讯', '娱乐', '知识', '网络', '开发']

const copyText = async (text: string): Promise<boolean> => {
  try {
    await navigator.clipboard.writeText(text)
    return true
  } catch {
    return false
  }
}

export default function ApiLabPro() {
  const [selectedId, setSelectedId] = useState<ApiId>('weather')
  const [inputValue, setInputValue] = useState('北京')
  const [result, setResult] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [history, setHistory] = useState<{ api: string; result: string; time: string }[]>([])
  const [category, setCategory] = useState('全部')
  const [searchQuery, setSearchQuery] = useState('')
  const [copied, setCopied] = useState('')
  
  const abortRef = useRef<AbortController | null>(null)

  const filteredApis = APIS.filter(api => {
    const matchCategory = category === '全部' || api.category === category
    const matchSearch = !searchQuery || 
      api.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      api.description.toLowerCase().includes(searchQuery.toLowerCase())
    return matchCategory && matchSearch
  })

  const selectedApi = APIS.find(a => a.id === selectedId)!

  const handleSelectApi = (api: ApiDef) => {
    setSelectedId(api.id)
    setInputValue(api.defaultInput || '')
    setResult('')
    setError('')
  }

  const handleCopy = async (text: string, label: string) => {
    const ok = await copyText(text)
    setCopied(ok ? `${label}已复制` : '复制失败')
    setTimeout(() => setCopied(''), 2000)
  }

  const fetchApi = useCallback(async () => {
    setLoading(true)
    setError('')
    setResult('')
    
    if (abortRef.current) {
      abortRef.current.abort()
    }
    abortRef.current = new AbortController()

    try {
      switch (selectedId) {
        case 'weather':
          const geoRes = await fetch(`https://api.open-meteo.com/v1/forecast?latitude=0&longitude=0&current_weather=true`, { signal: abortRef.current.signal })
          if (!geoRes.ok) throw new Error('API请求失败')
          // 使用Open-Meteo的城市地理编码
          const geoCodeRes = await fetch(`https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(inputValue)}&count=1&language=zh`, { signal: abortRef.current.signal })
          if (!geoCodeRes.ok) throw new Error('城市搜索失败')
          const geoData = await geoCodeRes.json()
          if (!geoData.results || geoData.results.length === 0) throw new Error('未找到该城市')
          const { latitude, longitude, name, country } = geoData.results[0]
          
          const weatherRes = await fetch(`https://api.open-meteo.com/v1/forecast?latitude=${latitude}&longitude=${longitude}&current_weather=true&hourly=temperature_2m,relative_humidity_2m&daily=weather_code,temperature_2m_max,temperature_2m_min`, { signal: abortRef.current.signal })
          const weatherData = await weatherRes.json()
          
          const formatted = {
            city: `${name}, ${country}`,
            current: {
              temperature: `${weatherData.current_weather?.temperature}°C`,
              windspeed: `${weatherData.current_weather?.windspeed} km/h`,
              humidity: weatherData.hourly?.relative_humidity_2m?.[0] + '%',
            },
            daily: weatherData.daily ? {
              maxTemp: `${weatherData.daily.temperature_2m_max?.[0]}°C`,
              minTemp: `${weatherData.daily.temperature_2m_min?.[0]}°C`,
            } : null
          }
          setResult(JSON.stringify(formatted, null, 2))
          break

        case 'exchange':
          const base = inputValue.toUpperCase() || 'USD'
          const ratesRes = await fetch(`https://api.frankfurter.app/latest?from=${base}`, { signal: abortRef.current.signal })
          if (!ratesRes.ok) throw new Error('汇率API请求失败')
          const ratesData = await ratesRes.json()
          setResult(JSON.stringify({ base: ratesData.base, date: ratesData.date, rates: ratesData.rates }, null, 2))
          break

        case 'crypto':
          const ids = inputValue.toLowerCase().split(',').map(s => s.trim()).filter(Boolean).join(',')
          const cryptoRes = await fetch(`https://api.coingecko.com/api/v3/simple/price?ids=${ids}&vs_currencies=usd&include_24hr_change=true&include_market_cap=true`, { signal: abortRef.current.signal })
          if (!cryptoRes.ok) throw new Error('加密货币API请求失败')
          const cryptoData = await cryptoRes.json()
          setResult(JSON.stringify(cryptoData, null, 2))
          break

        case 'news':
          const topRes = await fetch('https://hacker-news.firebaseio.com/v0/topstories.json', { signal: abortRef.current.signal })
          const topIds = await topRes.json()
          const storyIds = topIds.slice(0, 10)
          const abortSignal = abortRef.current?.signal
          const stories = await Promise.all(storyIds.map(async (id: number) => {
            const storyRes = await fetch(`https://hacker-news.firebaseio.com/v0/item/${id}.json`, abortSignal ? { signal: abortSignal } : {})
            return storyRes.json()
          }))
          const formattedNews = stories.map((s, i) => ({
            rank: i + 1,
            title: s.title,
            url: s.url || `https://news.ycombinator.com/item?id=${s.id}`,
            score: s.score,
            by: s.by,
            comments: s.descendants,
          }))
          setResult(JSON.stringify(formattedNews, null, 2))
          break

        case 'quote':
          const quoteRes = await fetch('https://zenquotes.io/api/random', { signal: abortRef.current.signal })
          const quoteData = await quoteRes.json()
          setResult(JSON.stringify(quoteData[0] || quoteData, null, 2))
          break

        case 'joke':
          const jokeRes = await fetch('https://v2.jokeapi.dev/joke/programming?safe-mode', { signal: abortRef.current.signal })
          const jokeData = await jokeRes.json()
          const formattedJoke = jokeData.type === 'single' 
            ? { joke: jokeData.joke } 
            : { setup: jokeData.setup, delivery: jokeData.delivery }
          setResult(JSON.stringify(formattedJoke, null, 2))
          break

        case 'wiki':
          const wikiRes = await fetch(`https://en.wikipedia.org/api/rest_v1/page/summary/${encodeURIComponent(inputValue)}`, { signal: abortRef.current.signal })
          if (!wikiRes.ok) throw new Error('维基百科请求失败，请检查关键词')
          const wikiData = await wikiRes.json()
          const formattedWiki = {
            title: wikiData.title,
            description: wikiData.description,
            extract: wikiData.extract,
            url: wikiData.content_urls?.desktop?.page,
            thumbnail: wikiData.thumbnail?.source,
          }
          setResult(JSON.stringify(formattedWiki, null, 2))
          break

        case 'ip':
          const ipRes = await fetch('http://ip-api.com/json', { signal: abortRef.current.signal })
          const ipData = await ipRes.json()
          setResult(JSON.stringify(ipData, null, 2))
          break

        case 'country':
          const countryRes = await fetch(`https://restcountries.com/v3.1/name/${encodeURIComponent(inputValue)}?fields=name,capital,population,area,currencies,languages,flag`, { signal: abortRef.current.signal })
          if (!countryRes.ok) throw new Error('国家信息请求失败，请检查国家名称')
          const countryData = await countryRes.json()
          setResult(JSON.stringify(countryData[0] || countryData, null, 2))
          break

        case 'github':
          const ghRes = await fetch(`https://api.github.com/search/repositories?q=${encodeURIComponent(inputValue)}&sort=stars&order=desc&per_page=10`, { signal: abortRef.current.signal })
          if (!ghRes.ok) throw new Error('GitHub API请求失败')
          const ghData = await ghRes.json()
          const formattedGh = ghData.items.map((item: {
            full_name: string; description: string; stargazers_count: number;
            forks_count: number; html_url: string; language: string;
            owner: { login: string };
          }) => ({
            repo: item.full_name,
            description: item.description,
            stars: item.stargazers_count,
            forks: item.forks_count,
            language: item.language,
            owner: item.owner.login,
            url: item.html_url,
          }))
          setResult(JSON.stringify({ total_count: ghData.total_count, items: formattedGh }, null, 2))
          break
      }

      const time = new Date().toLocaleTimeString('zh-CN')
      setHistory(prev => [{ api: selectedApi.name, result, time }, ...prev].slice(0, 20))

    } catch (err) {
      if (err instanceof DOMException && err.name === 'AbortError') {
        setError('请求已取消')
      } else {
        setError(err instanceof Error ? err.message : '请求失败')
      }
    } finally {
      setLoading(false)
    }
  }, [selectedId, inputValue, selectedApi.name])

  useEffect(() => {
    return () => {
      abortRef.current?.abort()
    }
  }, [])

  const formatResult = (data: string) => {
    try {
      const parsed = JSON.parse(data)
      return JSON.stringify(parsed, null, 2)
    } catch {
      return data
    }
  }

  return (
    <div style={{
      height: '100%',
      display: 'flex',
      flexDirection: 'column',
      background: 'linear-gradient(135deg, #0f0f1a 0%, #1a1a2e 50%, #16213e 100%)',
      color: '#e4e4e7',
      fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
      overflow: 'hidden',
    }}>
      <style>{`
        @keyframes fade-in { from { opacity: 0; transform: translateY(8px); } to { opacity: 1; transform: translateY(0); } }
        @keyframes pulse { 0%, 100% { opacity: 1; } 50% { opacity: 0.5; } }
        .fade-in { animation: fade-in 0.3s ease-out; }
        .pulse { animation: pulse 1.5s ease-in-out infinite; }
        .scroll-custom::-webkit-scrollbar { width: 6px; height: 6px; }
        .scroll-custom::-webkit-scrollbar-track { background: transparent; }
        .scroll-custom::-webkit-scrollbar-thumb { background: rgba(255,255,255,0.15); border-radius: 3px; }
        .scroll-custom::-webkit-scrollbar-thumb:hover { background: rgba(255,255,255,0.25); }
      `}</style>

      {/* Header */}
      <div style={{
        padding: '14px 20px',
        display: 'flex',
        alignItems: 'center',
        gap: '12px',
        borderBottom: '1px solid rgba(255,255,255,0.08)',
        flexShrink: 0,
      }}>
        <div style={{
          width: '36px', height: '36px',
          borderRadius: '10px',
          background: 'linear-gradient(135deg, #f59e0b 0%, #ef4444 100%)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: '18px',
        }}>🧪</div>
        <div style={{ flex: 1 }}>
          <h1 style={{ margin: 0, fontSize: '16px', fontWeight: 700 }}>API 测试实验室</h1>
          <p style={{ margin: 0, fontSize: '12px', color: '#94a3b8' }}>10+合规公开API · 零配置 · 实时数据</p>
        </div>
        {copied && (
          <div style={{
            padding: '6px 12px',
            background: 'rgba(34,197,94,0.2)',
            border: '1px solid rgba(34,197,94,0.3)',
            borderRadius: '6px',
            fontSize: '12px',
            color: '#22c55e',
          }}>{copied}</div>
        )}
      </div>

      {/* Main content */}
      <div style={{
        flex: 1,
        display: 'flex',
        overflow: 'hidden',
      }}>
        {/* Left sidebar */}
        <div style={{
          width: '280px',
          borderRight: '1px solid rgba(255,255,255,0.08)',
          display: 'flex',
          flexDirection: 'column',
          flexShrink: 0,
        }}>
          {/* Search */}
          <div style={{ padding: '12px' }}>
            <input
              type="text"
              placeholder="搜索API..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              style={{
                width: '100%',
                padding: '8px 12px',
                background: 'rgba(0,0,0,0.3)',
                border: '1px solid rgba(255,255,255,0.1)',
                borderRadius: '8px',
                color: '#e4e4e7',
                fontSize: '13px',
                outline: 'none',
                boxSizing: 'border-box',
              }}
            />
          </div>

          {/* Categories */}
          <div style={{
            display: 'flex',
            gap: '4px',
            padding: '0 12px 12px',
            flexWrap: 'wrap',
          }}>
            {CATEGORIES.map(cat => (
              <button
                key={cat}
                onClick={() => setCategory(cat)}
                style={{
                  padding: '4px 10px',
                  background: category === cat ? 'rgba(245,158,11,0.2)' : 'rgba(255,255,255,0.04)',
                  border: category === cat ? '1px solid rgba(245,158,11,0.4)' : '1px solid rgba(255,255,255,0.08)',
                  borderRadius: '6px',
                  color: category === cat ? '#fbbf24' : '#94a3b8',
                  fontSize: '11px',
                  cursor: 'pointer',
                  transition: 'all 0.15s',
                }}
              >
                {cat}
              </button>
            ))}
          </div>

          {/* API List */}
          <div style={{
            flex: 1,
            overflowY: 'auto',
            padding: '0 8px',
          }} className="scroll-custom">
            {filteredApis.map(api => (
              <button
                key={api.id}
                onClick={() => handleSelectApi(api)}
                style={{
                  width: '100%',
                  padding: '10px 12px',
                  marginBottom: '4px',
                  background: selectedId === api.id ? 'rgba(245,158,11,0.15)' : 'transparent',
                  border: selectedId === api.id ? '1px solid rgba(245,158,11,0.3)' : '1px solid transparent',
                  borderRadius: '8px',
                  color: selectedId === api.id ? '#fbbf24' : '#e4e4e7',
                  cursor: 'pointer',
                  textAlign: 'left',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '10px',
                  transition: 'all 0.15s',
                }}
              >
                <span style={{ fontSize: '18px' }}>{api.icon}</span>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: '13px', fontWeight: 500 }}>{api.name}</div>
                  <div style={{ fontSize: '11px', color: '#64748b', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                    {api.category} · {api.description.slice(0, 20)}...
                  </div>
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* Right content */}
        <div style={{
          flex: 1,
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden',
        }}>
          {/* API Info & Request */}
          <div style={{
            padding: '16px 20px',
            borderBottom: '1px solid rgba(255,255,255,0.08)',
            flexShrink: 0,
          }} className="fade-in" key={selectedId}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '12px' }}>
              <span style={{ fontSize: '28px' }}>{selectedApi.icon}</span>
              <div>
                <h2 style={{ margin: 0, fontSize: '18px', fontWeight: 600 }}>{selectedApi.name}</h2>
                <p style={{ margin: 0, fontSize: '12px', color: '#94a3b8' }}>{selectedApi.description}</p>
              </div>
            </div>

            {/* Endpoint */}
            <div style={{
              padding: '8px 12px',
              background: 'rgba(0,0,0,0.3)',
              borderRadius: '8px',
              marginBottom: '12px',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
            }}>
              <span style={{
                padding: '2px 8px',
                background: 'rgba(245,158,11,0.2)',
                color: '#fbbf24',
                borderRadius: '4px',
                fontSize: '11px',
                fontWeight: 600,
              }}>GET</span>
              <code style={{
                flex: 1,
                fontFamily: 'monospace',
                fontSize: '11px',
                color: '#94a3b8',
                whiteSpace: 'nowrap',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
              }}>{selectedApi.endpoint}</code>
            </div>

            {/* Input */}
            {selectedApi.needsInput ? (
              <div style={{ marginBottom: '12px' }}>
                <label style={{ fontSize: '12px', color: '#94a3b8', display: 'block', marginBottom: '6px' }}>
                  {selectedApi.inputPlaceholder}
                </label>
                <div style={{ display: 'flex', gap: '8px' }}>
                  <input
                    type="text"
                    value={inputValue}
                    onChange={(e) => setInputValue(e.target.value)}
                    placeholder={selectedApi.inputPlaceholder}
                    style={{
                      flex: 1,
                      padding: '10px 14px',
                      background: 'rgba(0,0,0,0.3)',
                      border: '1px solid rgba(255,255,255,0.1)',
                      borderRadius: '8px',
                      color: '#e4e4e7',
                      fontSize: '13px',
                      outline: 'none',
                      fontFamily: 'monospace',
                    }}
                    onKeyDown={(e) => e.key === 'Enter' && fetchApi()}
                  />
                  <button
                    onClick={fetchApi}
                    disabled={loading}
                    style={{
                      padding: '10px 24px',
                      background: loading 
                        ? 'linear-gradient(135deg, #6b7280 0%, #4b5563 100%)'
                        : 'linear-gradient(135deg, #f59e0b 0%, #ef4444 100%)',
                      border: 'none',
                      borderRadius: '8px',
                      color: '#fff',
                      fontWeight: 600,
                      fontSize: '13px',
                      cursor: loading ? 'not-allowed' : 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '6px',
                      transition: 'all 0.15s',
                    }}
                  >
                    {loading ? (
                      <>
                        <span className="pulse">●</span> 请求中
                      </>
                    ) : (
                      <>🚀 发送请求</>
                    )}
                  </button>
                </div>
              </div>
            ) : (
              <button
                onClick={fetchApi}
                disabled={loading}
                style={{
                  width: '100%',
                  padding: '12px',
                  background: loading 
                    ? 'linear-gradient(135deg, #6b7280 0%, #4b5563 100%)'
                    : 'linear-gradient(135deg, #f59e0b 0%, #ef4444 100%)',
                  border: 'none',
                  borderRadius: '8px',
                  color: '#fff',
                  fontWeight: 600,
                  fontSize: '14px',
                  cursor: loading ? 'not-allowed' : 'pointer',
                  marginBottom: '12px',
                  transition: 'all 0.15s',
                }}
              >
                {loading ? '⏳ 请求中...' : '🚀 立即获取数据'}
              </button>
            )}

            {error && (
              <div style={{
                padding: '10px 14px',
                background: 'rgba(239,68,68,0.15)',
                border: '1px solid rgba(239,68,68,0.3)',
                borderRadius: '8px',
                color: '#fca5a5',
                fontSize: '13px',
              }}>
                ⚠️ {error}
              </div>
            )}
          </div>

          {/* Result */}
          <div style={{
            flex: 1,
            display: 'flex',
            overflow: 'hidden',
          }}>
            <div style={{
              flex: 1,
              display: 'flex',
              flexDirection: 'column',
              borderRight: '1px solid rgba(255,255,255,0.08)',
            }}>
              <div style={{
                padding: '10px 16px',
                borderBottom: '1px solid rgba(255,255,255,0.08)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                flexShrink: 0,
              }}>
                <span style={{ fontSize: '13px', fontWeight: 600, color: '#94a3b8' }}>响应结果</span>
                {result && (
                  <button
                    onClick={() => handleCopy(result, '结果')}
                    style={{
                      padding: '4px 10px',
                      background: 'rgba(255,255,255,0.08)',
                      border: '1px solid rgba(255,255,255,0.1)',
                      borderRadius: '6px',
                      color: '#94a3b8',
                      fontSize: '11px',
                      cursor: 'pointer',
                    }}
                  >
                    📋 复制
                  </button>
                )}
              </div>
              <div style={{
                flex: 1,
                overflow: 'auto',
                padding: '16px',
              }} className="scroll-custom">
                {loading ? (
                  <div style={{
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'center',
                    height: '100%',
                    gap: '16px',
                    color: '#64748b',
                  }}>
                    <div style={{
                      width: '40px', height: '40px',
                      border: '3px solid rgba(255,255,255,0.1)',
                      borderTopColor: '#f59e0b',
                      borderRadius: '50%',
                      animation: 'spin 0.8s linear infinite',
                    }} />
                    <span>正在请求API...</span>
                  </div>
                ) : result ? (
                  <pre style={{
                    margin: 0,
                    padding: '16px',
                    background: 'rgba(0,0,0,0.4)',
                    borderRadius: '10px',
                    fontFamily: 'monospace',
                    fontSize: '12px',
                    color: '#a5b4fc',
                    whiteSpace: 'pre-wrap',
                    wordBreak: 'break-all',
                    lineHeight: 1.6,
                  }}>
                    {formatResult(result)}
                  </pre>
                ) : (
                  <div style={{
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'center',
                    height: '100%',
                    gap: '12px',
                    color: '#64748b',
                  }}>
                    <span style={{ fontSize: '48px' }}>📡</span>
                    <span>选择一个API并发送请求</span>
                    <span style={{ fontSize: '12px' }}>响应结果将显示在这里</span>
                  </div>
                )}
              </div>
            </div>

            {/* History Panel */}
            <div style={{
              width: '240px',
              display: 'flex',
              flexDirection: 'column',
              flexShrink: 0,
            }}>
              <div style={{
                padding: '10px 16px',
                borderBottom: '1px solid rgba(255,255,255,0.08)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                flexShrink: 0,
              }}>
                <span style={{ fontSize: '13px', fontWeight: 600, color: '#94a3b8' }}>历史记录</span>
                {history.length > 0 && (
                  <button
                    onClick={() => setHistory([])}
                    style={{
                      background: 'none',
                      border: 'none',
                      color: '#ef4444',
                      fontSize: '11px',
                      cursor: 'pointer',
                    }}
                  >
                    清空
                  </button>
                )}
              </div>
              <div style={{
                flex: 1,
                overflow: 'auto',
                padding: '8px',
              }} className="scroll-custom">
                {history.length === 0 ? (
                  <div style={{
                    textAlign: 'center',
                    padding: '20px',
                    color: '#64748b',
                    fontSize: '12px',
                  }}>
                    暂无历史记录
                  </div>
                ) : (
                  history.map((item, i) => (
                    <div
                      key={i}
                      onClick={() => {
                        setResult(item.result)
                      }}
                      style={{
                        padding: '10px',
                        marginBottom: '6px',
                        background: 'rgba(255,255,255,0.04)',
                        border: '1px solid rgba(255,255,255,0.06)',
                        borderRadius: '6px',
                        cursor: 'pointer',
                        transition: 'all 0.15s',
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.background = 'rgba(255,255,255,0.08)'
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.background = 'rgba(255,255,255,0.04)'
                      }}
                    >
                      <div style={{ fontSize: '12px', fontWeight: 500, marginBottom: '4px' }}>{item.api}</div>
                      <div style={{ fontSize: '10px', color: '#64748b' }}>{item.time}</div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      <style>{`
        @keyframes spin {
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  )
}
