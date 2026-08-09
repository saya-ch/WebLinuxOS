import { useState, useCallback } from 'react'

interface ApiResponse {
  loading: boolean
  data: any
  error: string | null
  timestamp: Date | null
}

interface ApiPreset {
  id: string
  name: string
  icon: string
  category: string
  description: string
  endpoint: string
  params: Record<string, string>
  resultKey?: string
}

const API_PRESETS: ApiPreset[] = [
  {
    id: 'weather',
    name: '天气查询',
    icon: '🌤️',
    category: '天气',
    description: '全球城市天气预报',
    endpoint: 'https://api.open-meteo.com/v1/forecast',
    params: { latitude: '31.23', longitude: '121.47', current: 'temperature_2m', daily: 'temperature_2m_max,temperature_2m_min', timezone: 'auto' },
    resultKey: 'current',
  },
  {
    id: 'exchange',
    name: '实时汇率',
    icon: '💱',
    category: '金融',
    description: '全球货币汇率转换',
    endpoint: 'https://open.er-api.com/v6/latest/USD',
    params: {},
    resultKey: 'rates',
  },
  {
    id: 'quotes',
    name: '每日箴言',
    icon: '💬',
    category: '内容',
    description: '励志名言和智慧语句',
    endpoint: 'https://zenquotes.io/api/random',
    params: {},
  },
  {
    id: 'jokes',
    name: '编程笑话',
    icon: '😂',
    category: '内容',
    description: '开发者专属笑话',
    endpoint: 'https://v2.jokeapi.dev/joke/Programming',
    params: { safe: 'true' },
  },
  {
    id: 'facts',
    name: '冷知识',
    icon: '💡',
    category: '内容',
    description: '有趣的冷门知识',
    endpoint: 'https://uselessfacts.jsph.pl/api/v2/facts/random',
    params: { language: 'zh' },
  },
  {
    id: 'countries',
    name: '国家信息',
    icon: '🌍',
    category: '地理',
    description: '全球国家详细信息',
    endpoint: 'https://restcountries.com/v3.1/all',
    params: { fields: 'name,capital,population,flags,languages,currencies' },
  },
  {
    id: 'crypto',
    name: '加密货币',
    icon: '🪙',
    category: '金融',
    description: '实时加密货币行情',
    endpoint: 'https://api.coingecko.com/api/v3/simple/price',
    params: { ids: 'bitcoin,ethereum,solana', vs_currencies: 'usd' },
  },
  {
    id: 'github-trending',
    name: 'GitHub 热门',
    icon: '🔥',
    category: '开发',
    description: 'GitHub  trending 仓库',
    endpoint: 'https://api.github.com/search/repositories',
    params: { q: 'stars:>1000', sort: 'stars', order: 'desc', per_page: '10' },
  },
  {
    id: 'ip',
    name: 'IP 查询',
    icon: '📍',
    category: '网络',
    description: 'IP 地址归属地查询',
    endpoint: 'https://ipapi.co/json/',
    params: {},
  },
  {
    id: 'nasa-apod',
    name: 'NASA 每日图',
    icon: '🌌',
    category: '天文',
    description: 'NASA 每日天文图',
    endpoint: 'https://api.nasa.gov/planetary/apod',
    params: { api_key: 'DEMO_KEY' },
  },
  {
    id: 'hackernames',
    name: '黑客新闻',
    icon: '📰',
    category: '新闻',
    description: 'Hacker News 头条',
    endpoint: 'https://hacker-news.firebaseio.com/v0/topstories.json',
    params: {},
  },
  {
    id: 'placeholder',
    name: '占位图片',
    icon: '🖼️',
    category: '工具',
    description: '生成占位图 URL',
    endpoint: 'https://picsum.photos/400/300',
    params: {},
  },
]

export default function APILab() {
  const [selectedApi, setSelectedApi] = useState<ApiPreset>(API_PRESETS[0])
  const [params, setParams] = useState<Record<string, string>>(API_PRESETS[0].params)
  const [response, setResponse] = useState<ApiResponse>({ loading: false, data: null, error: null, timestamp: null })
  const [history, setHistory] = useState<Array<{api: string; time: Date; success: boolean}>>([])
  const [sidebarCategory, setSidebarCategory] = useState<string>('全部')

  const categories = ['全部', ...new Set(API_PRESETS.map(a => a.category))]
  
  const filteredApis = sidebarCategory === '全部' 
    ? API_PRESETS 
    : API_PRESETS.filter(a => a.category === sidebarCategory)

  const executeApi = useCallback(async (api?: ApiPreset) => {
    const target = api || selectedApi
    const currentParams = api ? api.params : params
    
    setResponse(prev => ({ ...prev, loading: true, error: null }))
    
    try {
      const queryString = Object.entries(currentParams)
        .map(([k, v]) => `${encodeURIComponent(k)}=${encodeURIComponent(v)}`)
        .join('&')
      const url = `${target.endpoint}${queryString ? '?' + queryString : ''}`
      
      const res = await fetch(url, {
        headers: { 'Accept': 'application/json' }
      })
      
      if (!res.ok) throw new Error(`HTTP ${res.status}: ${res.statusText}`)
      
      let data: any
      const contentType = res.headers.get('content-type') || ''
      if (contentType.includes('application/json')) {
        data = await res.json()
      } else {
        data = await res.text()
      }
      
      setResponse({
        loading: false,
        data,
        error: null,
        timestamp: new Date(),
      })
      
      setHistory(prev => [{
        api: target.name,
        time: new Date(),
        success: true,
      }, ...prev].slice(0, 20))
      
    } catch (e: any) {
      setResponse({
        loading: false,
        data: null,
        error: e.message || '请求失败',
        timestamp: new Date(),
      })
      
      setHistory(prev => [{
        api: target.name,
        time: new Date(),
        success: false,
      }, ...prev].slice(0, 20))
    }
  }, [selectedApi, params])

  const selectApi = (api: ApiPreset) => {
    setSelectedApi(api)
    setParams(api.params)
    setResponse({ loading: false, data: null, error: null, timestamp: null })
  }

  const updateParam = (key: string, value: string) => {
    setParams(prev => ({ ...prev, [key]: value }))
  }

  const formatJson = (data: any): string => {
    try {
      return JSON.stringify(data, null, 2)
    } catch {
      return String(data)
    }
  }

  const renderResponse = () => {
    if (response.loading) {
      return (
        <div style={{ textAlign: 'center', padding: '40px', color: 'rgba(255,255,255,0.6)' }}>
          <div style={{ fontSize: '24px', marginBottom: '12px' }}>⏳</div>
          <div>正在请求 API...</div>
        </div>
      )
    }
    
    if (response.error) {
      return (
        <div style={{ padding: '20px', color: '#ef4444' }}>
          <div style={{ marginBottom: '8px', fontWeight: 600 }}>❌ 请求失败</div>
          <div style={{ fontSize: '13px' }}>{response.error}</div>
        </div>
      )
    }
    
    if (response.data === null) {
      return (
        <div style={{ textAlign: 'center', padding: '40px', color: 'rgba(255,255,255,0.4)' }}>
          <div style={{ fontSize: '48px', marginBottom: '16px' }}>🚀</div>
          <div style={{ fontSize: '16px' }}>选择一个 API 并点击发送请求开始探索</div>
        </div>
      )
    }
    
    return (
      <div style={{ padding: '16px' }}>
        {response.timestamp && (
          <div style={{ fontSize: '12px', color: 'rgba(255,255,255,0.5)', marginBottom: '12px' }}>
            ✅ 请求成功 · {response.timestamp.toLocaleTimeString('zh-CN')}
          </div>
        )}
        <pre style={{
          background: 'rgba(0,0,0,0.3)',
          padding: '16px',
          borderRadius: '8px',
          fontFamily: "'JetBrains Mono', monospace",
          fontSize: '12px',
          lineHeight: '1.6',
          overflow: 'auto',
          maxHeight: '400px',
          color: '#a5b4fc',
        }}>
          {typeof response.data === 'string' 
            ? response.data 
            : formatJson(response.data)}
        </pre>
        <div style={{ marginTop: '12px', display: 'flex', gap: '8px' }}>
          <button 
            onClick={() => navigator.clipboard.writeText(formatJson(response.data))}
            style={{
              padding: '6px 14px',
              background: 'rgba(124, 108, 240, 0.2)',
              border: '1px solid rgba(124, 108, 240, 0.5)',
              borderRadius: '6px',
              color: '#fff',
              cursor: 'pointer',
              fontSize: '12px',
            }}
          >
            📋 复制结果
          </button>
        </div>
      </div>
    )
  }

  return (
    <div style={{
      height: '100%',
      display: 'flex',
      background: 'linear-gradient(135deg, #1a1a2e 0%, #16213e 50%, #0f3460 100%)',
      color: '#f0f0ff',
      fontFamily: "'Inter', -apple-system, sans-serif",
      overflow: 'hidden',
    }}>
      <style>{`
        .apilab-sidebar {
          width: 240px;
          background: rgba(0,0,0,0.4);
          border-right: 1px solid rgba(255,255,255,0.1);
          display: flex;
          flex-direction: column;
        }
        .apilab-header {
          padding: 16px;
          border-bottom: 1px solid rgba(255,255,255,0.1);
        }
        .apilab-header h1 {
          font-size: 18px;
          font-weight: 700;
          background: linear-gradient(135deg, #00d6c1 0%, #7c6cf0 100%);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          background-clip: text;
        }
        .apilab-categories {
          display: flex;
          flex-wrap: wrap;
          gap: 6px;
          padding: 12px;
        }
        .apilab-categories button {
          padding: 4px 10px;
          background: rgba(255,255,255,0.05);
          border: 1px solid rgba(255,255,255,0.1);
          border-radius: 12px;
          color: rgba(255,255,255,0.7);
          font-size: 11px;
          cursor: pointer;
        }
        .apilab-categories button.active {
          background: #00d6c1;
          color: #0a0a1a;
        }
        .apilab-api-list {
          flex: 1;
          overflow-y: auto;
          padding: 8px;
        }
        .apilab-api-item {
          display: flex;
          align-items: center;
          gap: 10px;
          padding: 10px 12px;
          margin-bottom: 4px;
          background: transparent;
          border: none;
          border-radius: 8px;
          color: rgba(255,255,255,0.8);
          cursor: pointer;
          width: 100%;
          text-align: left;
          transition: all 0.2s;
        }
        .apilab-api-item:hover {
          background: rgba(255,255,255,0.05);
        }
        .apilab-api-item.active {
          background: rgba(0, 214, 193, 0.15);
          color: #fff;
        }
        .apilab-api-icon {
          font-size: 18px;
        }
        .apilab-api-info {
          flex: 1;
          min-width: 0;
        }
        .apilab-api-name {
          font-size: 13px;
          font-weight: 500;
        }
        .apilab-api-desc {
          font-size: 11px;
          color: rgba(255,255,255,0.4);
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }
        .apilab-main {
          flex: 1;
          display: flex;
          flex-direction: column;
          overflow: hidden;
        }
        .apilab-toolbar {
          padding: 20px 24px;
          border-bottom: 1px solid rgba(255,255,255,0.1);
        }
        .apilab-api-title {
          display: flex;
          align-items: center;
          gap: 12px;
          margin-bottom: 16px;
        }
        .apilab-api-title h2 {
          font-size: 20px;
        }
        .apilab-endpoint {
          font-family: 'JetBrains Mono', monospace;
          font-size: 12px;
          padding: 8px 12px;
          background: rgba(0,0,0,0.3);
          border-radius: 6px;
          color: rgba(255,255,255,0.7);
          margin-bottom: 12px;
          word-break: break-all;
        }
        .apilab-params {
          margin-bottom: 16px;
        }
        .apilab-param-row {
          display: flex;
          gap: 8px;
          margin-bottom: 8px;
        }
        .apilab-param-row input {
          flex: 1;
          padding: 8px 12px;
          background: rgba(0,0,0,0.3);
          border: 1px solid rgba(255,255,255,0.1);
          border-radius: 6px;
          color: #f0f0ff;
          font-family: 'JetBrains Mono', monospace;
          font-size: 13px;
        }
        .apilab-param-row input:first-child {
          flex: 0 0 150px;
          color: #00d6c1;
        }
        .apilab-send-btn {
          padding: 10px 24px;
          background: linear-gradient(135deg, #00d6c1, #7c6cf0);
          border: none;
          border-radius: 8px;
          color: #fff;
          font-size: 14px;
          font-weight: 600;
          cursor: pointer;
          transition: opacity 0.2s;
        }
        .apilab-send-btn:hover {
          opacity: 0.9;
        }
        .apilab-send-btn:disabled {
          opacity: 0.5;
          cursor: not-allowed;
        }
        .apilab-response {
          flex: 1;
          overflow: hidden;
          display: flex;
          flex-direction: column;
        }
        .apilab-response-header {
          padding: 16px 24px 8px;
          font-size: 13px;
          color: rgba(255,255,255,0.6);
          font-weight: 600;
        }
        .apilab-response-body {
          flex: 1;
          overflow-y: auto;
          padding: 0 24px 24px;
        }
        .apilab-history {
          max-height: 120px;
          overflow-y: auto;
          border-top: 1px solid rgba(255,255,255,0.1);
          padding: 8px 24px;
        }
        .apilab-history-item {
          display: flex;
          justify-content: space-between;
          font-size: 11px;
          padding: 4px 0;
          color: rgba(255,255,255,0.5);
        }
      `}</style>
      
      <aside className="apilab-sidebar">
        <div className="apilab-header">
          <h1>🧪 API Lab</h1>
          <p style={{fontSize: '11px', color: 'rgba(255,255,255,0.5)', marginTop: '4px'}}>探索公开 API</p>
        </div>
        <div className="apilab-categories">
          {categories.map(cat => (
            <button 
              key={cat}
              className={sidebarCategory === cat ? 'active' : ''}
              onClick={() => setSidebarCategory(cat)}
            >
              {cat}
            </button>
          ))}
        </div>
        <div className="apilab-api-list">
          {filteredApis.map(api => (
            <button
              key={api.id}
              className={`apilab-api-item ${selectedApi.id === api.id ? 'active' : ''}`}
              onClick={() => selectApi(api)}
            >
              <span className="apilab-api-icon">{api.icon}</span>
              <div className="apilab-api-info">
                <div className="apilab-api-name">{api.name}</div>
                <div className="apilab-api-desc">{api.description}</div>
              </div>
            </button>
          ))}
        </div>
      </aside>
      
      <main className="apilab-main">
        <div className="apilab-toolbar">
          <div className="apilab-api-title">
            <span style={{fontSize: '28px'}}>{selectedApi.icon}</span>
            <div>
              <h2>{selectedApi.name}</h2>
              <p style={{fontSize: '13px', color: 'rgba(255,255,255,0.6)'}}>{selectedApi.description}</p>
            </div>
          </div>
          <div className="apilab-endpoint">
            {selectedApi.endpoint}
            {Object.entries(params).length > 0 && '?' + 
              Object.entries(params)
                .map(([k, v]) => `${k}=${v}`)
                .join('&')}
          </div>
          <div className="apilab-params">
            {Object.entries(params).length > 0 ? (
              Object.entries(params).map(([key, value]) => (
                <div key={key} className="apilab-param-row">
                  <input 
                    value={key} 
                    readOnly 
                  />
                  <input 
                    value={value} 
                    onChange={(e) => updateParam(key, e.target.value)}
                  />
                </div>
              ))
            ) : (
              <div style={{fontSize: '13px', color: 'rgba(255,255,255,0.4)', padding: '8px 0'}}>
                此 API 无需参数
              </div>
            )}
          </div>
          <button 
            className="apilab-send-btn"
            onClick={() => executeApi()}
            disabled={response.loading}
          >
            {response.loading ? '⏳ 请求中...' : '🚀 发送请求'}
          </button>
        </div>
        
        <div className="apilab-response">
          <div className="apilab-response-header">📦 响应结果</div>
          <div className="apilab-response-body">
            {renderResponse()}
          </div>
          {history.length > 0 && (
            <div className="apilab-history">
              <div style={{fontSize: '12px', color: 'rgba(255,255,255,0.6)', marginBottom: '4px'}}>
                📊 最近请求历史
              </div>
              {history.slice(0, 5).map((h, i) => (
                <div key={i} className="apilab-history-item">
                  <span>{h.api}</span>
                  <span style={{color: h.success ? '#22c55e' : '#ef4444'}}>
                    {h.success ? '✓' : '✗'} {h.time.toLocaleTimeString('zh-CN')}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      </main>
    </div>
  )
}
