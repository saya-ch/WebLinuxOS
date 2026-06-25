import { useState, useCallback, memo, useEffect } from 'react'
import { useStore } from '../store'

// API探索器 - 浏览常用公开API文档和示例
interface APIEndpoint {
  id: string
  name: string
  description: string
  baseUrl: string
  category: string
  authType: 'none' | 'apikey' | 'oauth' | 'bearer'
  free: boolean
  documentationUrl: string
  examples: APIExample[]
}

interface APIExample {
  method: 'GET' | 'POST' | 'PUT' | 'DELETE'
  path: string
  description: string
  params: string[]
  requestBody?: string
  responseExample: string
}

interface RequestState {
  loading: boolean
  response: string
  status: number | null
  responseTime: number | null
  error: string | null
}

const API_CATALOG: APIEndpoint[] = [
  {
    id: 'open-meteo',
    name: 'Open-Meteo Weather API',
    description: '免费开源天气数据API，无需API密钥',
    baseUrl: 'https://api.open-meteo.com/v1',
    category: 'weather',
    authType: 'none',
    free: true,
    documentationUrl: 'https://open-meteo.com/en/docs',
    examples: [
      {
        method: 'GET',
        path: '/forecast?latitude={lat}&longitude={lon}&current_weather=true',
        description: '获取当前天气',
        params: ['latitude', 'longitude'],
        responseExample: '{"latitude":39.9,"longitude":116.4,"current_weather":{"temperature":25,"windspeed":10,"weathercode":0}}'
      },
      {
        method: 'GET',
        path: '/forecast?latitude={lat}&longitude={lon}&daily=temperature_2m_max,temperature_2m_min',
        description: '获取7天预报',
        params: ['latitude', 'longitude'],
        responseExample: '{"daily":{"time":["2024-01-01","2024-01-02"],"temperature_2m_max":[25,26],"temperature_2m_min":[15,16]}}'
      }
    ]
  },
  {
    id: 'geocoding',
    name: 'Open-Meteo Geocoding API',
    description: '城市搜索和地理编码API',
    baseUrl: 'https://geocoding-api.open-meteo.com/v1',
    category: 'geocoding',
    authType: 'none',
    free: true,
    documentationUrl: 'https://open-meteo.com/en/docs/geocoding-api',
    examples: [
      {
        method: 'GET',
        path: '/search?name={city}&count=10&language=zh',
        description: '搜索城市',
        params: ['name'],
        responseExample: '{"results":[{"name":"北京","latitude":39.9,"longitude":116.4,"country":"中国"}]}'
      }
    ]
  },
  {
    id: 'coingecko',
    name: 'CoinGecko Crypto API',
    description: '加密货币市场数据API',
    baseUrl: 'https://api.coingecko.com/api/v3',
    category: 'finance',
    authType: 'none',
    free: true,
    documentationUrl: 'https://www.coingecko.com/en/api/documentation',
    examples: [
      {
        method: 'GET',
        path: '/coins/markets?vs_currency=usd&order=market_cap_desc&per_page=10',
        description: '获取加密货币列表',
        params: ['vs_currency', 'per_page'],
        responseExample: '[{"id":"bitcoin","symbol":"btc","name":"Bitcoin","current_price":45000,"market_cap":850000000000}]'
      },
      {
        method: 'GET',
        path: '/coins/{id}/market_chart?vs_currency=usd&days=7',
        description: '获取价格历史',
        params: ['id', 'vs_currency', 'days'],
        responseExample: '{"prices":[[1704067200000,45000],[1704153600000,45500]]}'
      }
    ]
  },
  {
    id: 'ipapi',
    name: 'ipapi.co IP Geolocation',
    description: 'IP地址地理位置查询API',
    baseUrl: 'https://ipapi.co',
    category: 'network',
    authType: 'none',
    free: true,
    documentationUrl: 'https://ipapi.co/api/',
    examples: [
      {
        method: 'GET',
        path: '/{ip}/json/',
        description: '查询IP地理位置',
        params: ['ip'],
        responseExample: '{"ip":"8.8.8.8","city":"Mountain View","region":"California","country":"US","latitude":37.4,"longitude":-122.1}'
      },
      {
        method: 'GET',
        path: '/json/',
        description: '查询当前IP',
        params: [],
        responseExample: '{"ip":"1.2.3.4","city":"Beijing","country":"CN"}'
      }
    ]
  },
  {
    id: 'frankfurter',
    name: 'Frankfurter Exchange Rates',
    description: '免费汇率数据API',
    baseUrl: 'https://api.frankfurter.app',
    category: 'finance',
    authType: 'none',
    free: true,
    documentationUrl: 'https://www.frankfurter.app/docs/',
    examples: [
      {
        method: 'GET',
        path: '/latest?from=USD&to=EUR,CNY',
        description: '获取最新汇率',
        params: ['from', 'to'],
        responseExample: '{"amount":1,"base":"USD","date":"2024-01-01","rates":{"EUR":0.85,"CNY":7.2}}'
      },
      {
        method: 'GET',
        path: '/{date}?from=USD&to=CNY',
        description: '获取历史汇率',
        params: ['date', 'from', 'to'],
        responseExample: '{"amount":1,"base":"USD","date":"2023-01-01","rates":{"CNY":6.9}}'
      }
    ]
  },
  {
    id: 'hn-algolia',
    name: 'Hacker News Algolia API',
    description: 'Hacker News搜索API',
    baseUrl: 'https://hn.algolia.com/api/v1',
    category: 'news',
    authType: 'none',
    free: true,
    documentationUrl: 'https://hn.algolia.com/api',
    examples: [
      {
        method: 'GET',
        path: '/search?query={query}&tags=story',
        description: '搜索文章',
        params: ['query'],
        responseExample: '{"hits":[{"title":"Show HN: My Project","url":"https://example.com","points":100,"author":"user"}]}'
      },
      {
        method: 'GET',
        path: '/search_by_date?tags=story&front_page=true',
        description: '获取热门文章',
        params: [],
        responseExample: '{"hits":[{"title":"Top Story","points":500}]}'
      }
    ]
  },
  {
    id: 'restcountries',
    name: 'REST Countries API',
    description: '国家信息数据API',
    baseUrl: 'https://restcountries.com/v3.1',
    category: 'reference',
    authType: 'none',
    free: true,
    documentationUrl: 'https://restcountries.com/',
    examples: [
      {
        method: 'GET',
        path: '/all?fields=name,capital,population,region',
        description: '获取所有国家',
        params: ['fields'],
        responseExample: '[{"name":{"common":"China"},"capital":["Beijing"],"population":1400000000,"region":"Asia"}]'
      },
      {
        method: 'GET',
        path: '/name/{name}',
        description: '按名称搜索国家',
        params: ['name'],
        responseExample: '[{"name":{"common":"Japan"},"capital":["Tokyo"]}]'
      }
    ]
  },
  {
    id: 'jsonplaceholder',
    name: 'JSONPlaceholder',
    description: '免费模拟REST API，用于测试和原型开发',
    baseUrl: 'https://jsonplaceholder.typicode.com',
    category: 'testing',
    authType: 'none',
    free: true,
    documentationUrl: 'https://jsonplaceholder.typicode.com/',
    examples: [
      {
        method: 'GET',
        path: '/posts',
        description: '获取文章列表',
        params: [],
        responseExample: '[{"id":1,"title":"Post Title","body":"Post content","userId":1}]'
      },
      {
        method: 'GET',
        path: '/users/{id}',
        description: '获取用户信息',
        params: ['id'],
        responseExample: '{"id":1,"name":"Leanne Graham","email":"Sincere@april.biz"}'
      },
      {
        method: 'POST',
        path: '/posts',
        description: '创建文章',
        params: ['title', 'body', 'userId'],
        responseExample: '{"id":101,"title":"New Post","body":"Content","userId":1}'
      }
    ]
  },
  {
    id: 'cloudflare-dns',
    name: 'Cloudflare DNS over HTTPS',
    description: 'DNS查询API',
    baseUrl: 'https://cloudflare-dns.com/dns-query',
    category: 'network',
    authType: 'none',
    free: true,
    documentationUrl: 'https://developers.cloudflare.com/1.1.1.1/encrypted-dns/dns-over-https/',
    examples: [
      {
        method: 'GET',
        path: '?name={domain}&type=A',
        description: '查询A记录',
        params: ['name', 'type'],
        responseExample: '{"Status":0,"Answer":[{"name":"example.com","type":1,"data":"1.2.3.4"}]}'
      }
    ]
  },
  {
    id: 'github',
    name: 'GitHub REST API',
    description: 'GitHub公共API',
    baseUrl: 'https://api.github.com',
    category: 'development',
    authType: 'none',
    free: true,
    documentationUrl: 'https://docs.github.com/en/rest',
    examples: [
      {
        method: 'GET',
        path: '/repos/{owner}/{repo}',
        description: '获取仓库信息',
        params: ['owner', 'repo'],
        responseExample: '{"name":"repo","full_name":"owner/repo","stargazers_count":1000,"language":"JavaScript"}'
      },
      {
        method: 'GET',
        path: '/users/{username}/repos',
        description: '获取用户仓库',
        params: ['username'],
        responseExample: '[{"name":"project1","description":"My project","html_url":"https://github.com/user/project1"}]'
      },
      {
        method: 'GET',
        path: '/search/repositories?q={query}&sort=stars',
        description: '搜索仓库',
        params: ['query', 'sort'],
        responseExample: '{"items":[{"name":"popular-repo","stargazers_count":50000}]}'
      }
    ]
  },
  {
    id: 'wikipedia',
    name: 'Wikipedia API',
    description: '维基百科内容API',
    baseUrl: 'https://en.wikipedia.org/w/api.php',
    category: 'reference',
    authType: 'none',
    free: true,
    documentationUrl: 'https://www.mediawiki.org/wiki/API:Main_page',
    examples: [
      {
        method: 'GET',
        path: '?action=query&format=json&titles={title}&prop=extracts&exintro=true',
        description: '获取文章摘要',
        params: ['titles'],
        responseExample: '{"query":{"pages":{"123":{"title":"Article","extract":"Article summary..."}}}}'
      },
      {
        method: 'GET',
        path: '?action=query&format=json&list=search&srsearch={query}',
        description: '搜索文章',
        params: ['srsearch'],
        responseExample: '{"query":{"search":[{"title":"Result1","snippet":"..."}]}}'
      }
    ]
  }
]

const CATEGORY_NAMES: Record<string, string> = {
  weather: '天气',
  finance: '金融',
  network: '网络',
  news: '新闻',
  reference: '参考',
  testing: '测试',
  development: '开发',
  geocoding: '地理编码'
}

const CATEGORY_ICONS: Record<string, string> = {
  weather: '🌤️',
  finance: '💰',
  network: '🌐',
  news: '📰',
  reference: '📚',
  testing: '🧪',
  development: '💻',
  geocoding: '📍'
}

const APIExplorer = memo(function APIExplorer() {
  const [selectedCategory, setSelectedCategory] = useState<string>('all')
  const [selectedAPI, setSelectedAPI] = useState<APIEndpoint | null>(null)
  const [selectedExample, setSelectedExample] = useState<APIExample | null>(null)
  const [searchQuery, setSearchQuery] = useState('')
  const [paramValues, setParamValues] = useState<Record<string, string>>({})
  const [requestState, setRequestState] = useState<RequestState>({
    loading: false,
    response: '',
    status: null,
    responseTime: null,
    error: null,
  })
  const [customBody, setCustomBody] = useState('')
  const addNotification = useStore((s) => s.addNotification)

  const categories = ['all', ...new Set(API_CATALOG.map(api => api.category))]

  const filteredAPIs = API_CATALOG.filter(api => {
    if (selectedCategory !== 'all' && api.category !== selectedCategory) return false
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase()
      return api.name.toLowerCase().includes(query) || 
             api.description.toLowerCase().includes(query) ||
             api.baseUrl.toLowerCase().includes(query)
    }
    return true
  })

  const handleCopyUrl = useCallback((baseUrl: string, path: string) => {
    let fullUrl = baseUrl + path
    if (selectedExample) {
      selectedExample.params.forEach(param => {
        const value = paramValues[param] || ''
        fullUrl = fullUrl.replace(`{${param}}`, value)
      })
    }
    navigator.clipboard.writeText(fullUrl)
    addNotification({
      title: '已复制',
      message: `URL已复制到剪贴板`,
      type: 'success',
      duration: 2000
    })
  }, [addNotification, selectedExample, paramValues])

  const handleOpenDocs = useCallback((url: string) => {
    window.open(url, '_blank')
    addNotification({
      title: '打开文档',
      message: '正在打开官方文档...',
      type: 'info',
      duration: 2000
    })
  }, [addNotification])

  const handleSendRequest = useCallback(async () => {
    if (!selectedAPI || !selectedExample) return

    setRequestState({ loading: true, response: '', status: null, responseTime: null, error: null })

    const startTime = Date.now()

    let fullUrl = selectedAPI.baseUrl + selectedExample.path
    selectedExample.params.forEach(param => {
      const value = paramValues[param] || ''
      fullUrl = fullUrl.replace(`{${param}}`, encodeURIComponent(value))
    })

    try {
      const requestOptions: RequestInit = {
        method: selectedExample.method,
        headers: { 'Content-Type': 'application/json' },
      }

      if (selectedExample.method !== 'GET' && (customBody || selectedExample.requestBody)) {
        requestOptions.body = customBody || selectedExample.requestBody
      }

      const response = await fetch(fullUrl, requestOptions)
      const endTime = Date.now()

      const text = await response.text()
      let formattedResponse = text
      try {
        const json = JSON.parse(text)
        formattedResponse = JSON.stringify(json, null, 2)
      } catch {
        formattedResponse = text
      }

      setRequestState({
        loading: false,
        response: formattedResponse,
        status: response.status,
        responseTime: endTime - startTime,
        error: null,
      })

      if (response.ok) {
        addNotification({
          title: '请求成功',
          message: `HTTP ${response.status} · ${endTime - startTime}ms`,
          type: 'success',
          duration: 3000
        })
      } else {
        addNotification({
          title: '请求完成',
          message: `HTTP ${response.status}`,
          type: 'info',
          duration: 3000
        })
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error'
      setRequestState({
        loading: false,
        response: '',
        status: null,
        responseTime: null,
        error: errorMessage,
      })
      addNotification({
        title: '请求失败',
        message: errorMessage,
        type: 'error',
        duration: 3000
      })
    }
  }, [selectedAPI, selectedExample, paramValues, customBody, addNotification])

  const handleClearResponse = useCallback(() => {
    setRequestState({ loading: false, response: '', status: null, responseTime: null, error: null })
  }, [])

  const handleParamChange = useCallback((param: string, value: string) => {
    setParamValues(prev => ({ ...prev, [param]: value }))
  }, [])

  useEffect(() => {
    if (selectedExample) {
      const defaultParams: Record<string, string> = {}
      selectedExample.params.forEach(param => {
        if (param === 'city' || param === 'name') defaultParams[param] = 'Beijing'
        else if (param === 'query') defaultParams[param] = 'python'
        else if (param === 'id') defaultParams[param] = '1'
        else if (param === 'ip') defaultParams[param] = '8.8.8.8'
        else if (param === 'lat' || param === 'latitude') defaultParams[param] = '39.9'
        else if (param === 'lon' || param === 'longitude') defaultParams[param] = '116.4'
        else defaultParams[param] = ''
      })
      setParamValues(defaultParams)
      setCustomBody(selectedExample.requestBody || '')
    }
  }, [selectedExample])

  return (
    <div style={{
      height: '100%',
      overflow: 'hidden',
      display: 'flex',
      flexDirection: 'column',
      background: 'linear-gradient(135deg, #1a1a2e 0%, #16213e 100%)',
      color: '#e0e0e8'
    }}>
      {/* 顶部搜索和分类 */}
      <div style={{
        padding: 16,
        borderBottom: '1px solid rgba(255,255,255,0.08)'
      }}>
        <input
          type="text"
          placeholder="搜索API..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          style={{
            width: '100%',
            padding: '10px 14px',
            borderRadius: 10,
            border: '1px solid rgba(255,255,255,0.15)',
            background: 'rgba(255,255,255,0.08)',
            color: '#e0e0e8',
            outline: 'none',
            fontSize: 14,
            marginBottom: 12
          }}
        />
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          {categories.map(cat => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              style={{
                padding: '6px 12px',
                borderRadius: 20,
                border: '1px solid ' + (selectedCategory === cat ? 'rgba(124,108,240,0.6)' : 'rgba(255,255,255,0.15)'),
                background: selectedCategory === cat ? 'rgba(124,108,240,0.25)' : 'rgba(255,255,255,0.05)',
                color: '#e0e0e8',
                cursor: 'pointer',
                fontSize: 12,
                fontWeight: selectedCategory === cat ? 600 : 400
              }}
            >
              {cat === 'all' ? '全部' : `${CATEGORY_ICONS[cat] || ''} ${CATEGORY_NAMES[cat] || cat}`}
            </button>
          ))}
        </div>
      </div>

      {/* 主内容区 */}
      <div style={{
        flex: 1,
        overflow: 'auto',
        display: 'flex',
        gap: 16,
        padding: 16
      }}>
        {/* API列表 */}
        <div style={{
          flex: selectedAPI ? '0 0 300px' : 1,
          overflowY: 'auto'
        }}>
          <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 10 }}>
            公开API目录 ({filteredAPIs.length})
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {filteredAPIs.map(api => (
              <div
                key={api.id}
                onClick={() => {
                  setSelectedAPI(api)
                  setSelectedExample(null)
                }}
                style={{
                  padding: 14,
                  borderRadius: 10,
                  background: selectedAPI?.id === api.id 
                    ? 'rgba(124,108,240,0.2)' 
                    : 'rgba(255,255,255,0.05)',
                  border: '1px solid ' + (selectedAPI?.id === api.id 
                    ? 'rgba(124,108,240,0.4)' 
                    : 'rgba(255,255,255,0.08)'),
                  cursor: 'pointer',
                  transition: 'background 0.2s'
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
                  <div style={{ fontSize: 14, fontWeight: 600 }}>{api.name}</div>
                  <span style={{ 
                    fontSize: 11, 
                    padding: '2px 6px', 
                    borderRadius: 4,
                    background: api.free ? 'rgba(34,197,94,0.2)' : 'rgba(239,68,68,0.2)',
                    color: api.free ? '#22c55e' : '#ef4444'
                  }}>
                    {api.free ? '免费' : '付费'}
                  </span>
                </div>
                <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.6)', marginBottom: 4 }}>
                  {api.description}
                </div>
                <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.4)' }}>
                  {CATEGORY_ICONS[api.category]} {CATEGORY_NAMES[api.category]} · {api.authType === 'none' ? '无需认证' : api.authType}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* API详情 */}
        {selectedAPI && (
          <div style={{
            flex: 1,
            overflowY: 'auto',
            padding: 16,
            borderRadius: 12,
            background: 'rgba(255,255,255,0.05)',
            border: '1px solid rgba(255,255,255,0.08)'
          }}>
            <div style={{ marginBottom: 16 }}>
              <div style={{ fontSize: 18, fontWeight: 600, marginBottom: 8 }}>{selectedAPI.name}</div>
              <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.7)', marginBottom: 12 }}>{selectedAPI.description}</div>
              
              <div style={{ display: 'flex', gap: 12, marginBottom: 16 }}>
                <button
                  onClick={() => handleOpenDocs(selectedAPI.documentationUrl)}
                  style={{
                    padding: '8px 16px',
                    borderRadius: 8,
                    background: 'rgba(124,108,240,0.3)',
                    border: '1px solid rgba(124,108,240,0.5)',
                    color: '#e0e0e8',
                    cursor: 'pointer',
                    fontSize: 13
                  }}
                >
                  📖 打开官方文档
                </button>
                <button
                  onClick={() => handleCopyUrl(selectedAPI.baseUrl, '')}
                  style={{
                    padding: '8px 16px',
                    borderRadius: 8,
                    background: 'rgba(255,255,255,0.1)',
                    border: '1px solid rgba(255,255,255,0.15)',
                    color: '#e0e0e8',
                    cursor: 'pointer',
                    fontSize: 13
                  }}
                >
                  🔗 复制Base URL
                </button>
              </div>

              <div style={{
                padding: 12,
                borderRadius: 8,
                background: 'rgba(0,0,0,0.2)',
                marginBottom: 16
              }}>
                <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.5)', marginBottom: 4 }}>Base URL</div>
                <div style={{ fontSize: 14, color: '#7c6cf0' }}>{selectedAPI.baseUrl}</div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 8, marginBottom: 16 }}>
                <div style={{ padding: 10, borderRadius: 8, background: 'rgba(255,255,255,0.05)' }}>
                  <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.5)' }}>分类</div>
                  <div style={{ fontSize: 13 }}>{CATEGORY_ICONS[selectedAPI.category]} {CATEGORY_NAMES[selectedAPI.category]}</div>
                </div>
                <div style={{ padding: 10, borderRadius: 8, background: 'rgba(255,255,255,0.05)' }}>
                  <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.5)' }}>认证方式</div>
                  <div style={{ fontSize: 13 }}>{selectedAPI.authType === 'none' ? '无需认证' : selectedAPI.authType}</div>
                </div>
              </div>
            </div>

            {/* API示例 */}
            <div>
              <div style={{ fontSize: 14, fontWeight: 600, marginBottom: 10 }}>API端点示例 ({selectedAPI.examples.length})</div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                {selectedAPI.examples.map((example, idx) => (
                  <div
                    key={idx}
                    style={{
                      padding: 14,
                      borderRadius: 10,
                      background: selectedExample === example 
                        ? 'rgba(124,108,240,0.15)' 
                        : 'rgba(255,255,255,0.05)',
                      border: '1px solid rgba(255,255,255,0.08)',
                      cursor: 'pointer'
                    }}
                    onClick={() => setSelectedExample(example)}
                  >
                    <div style={{ display: 'flex', gap: 8, alignItems: 'center', marginBottom: 8 }}>
                      <span style={{
                        padding: '3px 8px',
                        borderRadius: 4,
                        background: example.method === 'GET' ? 'rgba(34,197,94,0.2)' : 
                                   example.method === 'POST' ? 'rgba(59,130,246,0.2)' : 
                                   example.method === 'PUT' ? 'rgba(245,158,11,0.2)' : 'rgba(239,68,68,0.2)',
                        color: example.method === 'GET' ? '#22c55e' : 
                               example.method === 'POST' ? '#3b82f6' : 
                               example.method === 'PUT' ? '#f59e0b' : '#ef4444',
                        fontSize: 11,
                        fontWeight: 600
                      }}>
                        {example.method}
                      </span>
                      <span style={{ fontSize: 13 }}>{example.description}</span>
                    </div>
                    <div style={{
                      padding: 8,
                      borderRadius: 6,
                      background: 'rgba(0,0,0,0.2)',
                      fontSize: 12,
                      color: '#7c6cf0',
                      marginBottom: 8
                    }}>
                      {selectedAPI.baseUrl}{example.path}
                    </div>
                    {example.params.length > 0 && (
                      <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.5)' }}>
                        参数: {example.params.join(', ')}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>

            {/* API测试面板 */}
            {selectedExample && (
              <div style={{ marginTop: 16 }}>
                <div style={{ fontSize: 14, fontWeight: 600, marginBottom: 12 }}>
                  ⚡ API 测试
                </div>

                {/* 参数输入 */}
                {selectedExample.params.length > 0 && (
                  <div style={{ marginBottom: 12 }}>
                    <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.6)', marginBottom: 8 }}>
                      参数值
                    </div>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: 8 }}>
                      {selectedExample.params.map(param => (
                        <div key={param}>
                          <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.5)', marginBottom: 4 }}>{param}</div>
                          <input
                            type="text"
                            value={paramValues[param] || ''}
                            onChange={(e) => handleParamChange(param, e.target.value)}
                            style={{
                              width: '100%',
                              padding: '8px 10px',
                              borderRadius: 6,
                              background: 'rgba(0,0,0,0.2)',
                              border: '1px solid rgba(255,255,255,0.1)',
                              color: '#e0e0e8',
                              fontSize: 12,
                              outline: 'none'
                            }}
                          />
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* 请求体 */}
                {selectedExample.method !== 'GET' && (
                  <div style={{ marginBottom: 12 }}>
                    <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.6)', marginBottom: 8 }}>
                      请求体 (JSON)
                    </div>
                    <textarea
                      value={customBody}
                      onChange={(e) => setCustomBody(e.target.value)}
                      placeholder='{"key": "value"}'
                      style={{
                        width: '100%',
                        minHeight: '80px',
                        padding: '10px',
                        borderRadius: 6,
                        background: 'rgba(0,0,0,0.2)',
                        border: '1px solid rgba(255,255,255,0.1)',
                        color: '#e0e0e8',
                        fontSize: 12,
                        fontFamily: 'monospace',
                        outline: 'none',
                        resize: 'vertical'
                      }}
                    />
                  </div>
                )}

                {/* 完整URL预览 */}
                <div style={{ marginBottom: 12 }}>
                  <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.6)', marginBottom: 6 }}>
                    请求 URL
                  </div>
                  <div style={{
                    padding: 10,
                    borderRadius: 6,
                    background: 'rgba(0,0,0,0.3)',
                    fontSize: 12,
                    color: '#7c6cf0',
                    overflow: 'auto'
                  }}>
                    {(() => {
                      let url = selectedAPI.baseUrl + selectedExample.path
                      selectedExample.params.forEach(param => {
                        const value = paramValues[param] || `{${param}}`
                        url = url.replace(`{${param}}`, encodeURIComponent(value))
                      })
                      return url
                    })()}
                  </div>
                </div>

                {/* 操作按钮 */}
                <div style={{ display: 'flex', gap: 8, marginBottom: 12 }}>
                  <button
                    onClick={handleSendRequest}
                    disabled={requestState.loading}
                    style={{
                      padding: '10px 20px',
                      borderRadius: 8,
                      background: requestState.loading 
                        ? 'rgba(124,108,240,0.3)' 
                        : 'rgba(124,108,240,0.5)',
                      border: '1px solid rgba(124,108,240,0.5)',
                      color: '#e0e0e8',
                      cursor: requestState.loading ? 'not-allowed' : 'pointer',
                      fontSize: 13,
                      fontWeight: 600
                    }}
                  >
                    {requestState.loading ? '发送中...' : '🚀 发送请求'}
                  </button>
                  <button
                    onClick={handleClearResponse}
                    disabled={!requestState.response && !requestState.error}
                    style={{
                      padding: '10px 16px',
                      borderRadius: 8,
                      background: 'rgba(255,255,255,0.1)',
                      border: '1px solid rgba(255,255,255,0.15)',
                      color: '#e0e0e8',
                      cursor: (!requestState.response && !requestState.error) ? 'not-allowed' : 'pointer',
                      fontSize: 12,
                      opacity: (!requestState.response && !requestState.error) ? 0.5 : 1
                    }}
                  >
                    清除响应
                  </button>
                </div>

                {/* 响应结果 */}
                {(requestState.response || requestState.error || requestState.status) && (
                  <div style={{ marginTop: 12 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                      <div style={{ fontSize: 13, fontWeight: 600, color: '#e0e0e8' }}>响应结果</div>
                      <div style={{ display: 'flex', gap: 12, fontSize: 12 }}>
                        {requestState.status && (
                          <span style={{ 
                            color: requestState.status >= 200 && requestState.status < 300 ? '#22c55e' : '#f59e0b'
                          }}>
                            HTTP {requestState.status}
                          </span>
                        )}
                        {requestState.responseTime && (
                          <span style={{ color: '#93c5fd' }}>
                            {requestState.responseTime}ms
                          </span>
                        )}
                      </div>
                    </div>
                    {requestState.error ? (
                      <div style={{
                        padding: 12,
                        borderRadius: 8,
                        background: 'rgba(239,68,68,0.15)',
                        fontSize: 12,
                        color: '#ef4444'
                      }}>
                        {requestState.error}
                      </div>
                    ) : (
                      <pre style={{
                        padding: 12,
                        borderRadius: 8,
                        background: 'rgba(0,0,0,0.3)',
                        fontSize: 12,
                        color: '#a6e3a1',
                        overflow: 'auto',
                        whiteSpace: 'pre-wrap',
                        wordBreak: 'break-all',
                        maxHeight: '300px'
                      }}>
                        {requestState.response}
                      </pre>
                    )}
                  </div>
                )}

                {/* 响应示例 */}
                <div style={{ marginTop: 16 }}>
                  <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 10 }}>📖 响应示例</div>
                  <pre style={{
                    padding: 12,
                    borderRadius: 8,
                    background: 'rgba(0,0,0,0.2)',
                    fontSize: 12,
                    color: '#9ca3af',
                    overflow: 'auto',
                    whiteSpace: 'pre-wrap',
                    wordBreak: 'break-all',
                    opacity: 0.7
                  }}>
                    {selectedExample.responseExample}
                  </pre>
                  <button
                    onClick={() => {
                      navigator.clipboard.writeText(selectedExample.responseExample)
                      addNotification({ title: '已复制', message: '响应示例已复制', type: 'success', duration: 2000 })
                    }}
                    style={{
                      marginTop: 8,
                      padding: '6px 12px',
                      borderRadius: 6,
                      background: 'rgba(255,255,255,0.1)',
                      border: '1px solid rgba(255,255,255,0.15)',
                      color: '#e0e0e8',
                      cursor: 'pointer',
                      fontSize: 12
                    }}
                  >
                    复制响应示例
                  </button>
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* 底部统计 */}
      <div style={{
        padding: 12,
        borderTop: '1px solid rgba(255,255,255,0.08)',
        fontSize: 12,
        color: 'rgba(255,255,255,0.5)',
        textAlign: 'center'
      }}>
        共收录 {API_CATALOG.length} 个免费公开API · 全部无需认证或免费使用 · 点击打开官方文档了解更多
      </div>
    </div>
  )
})

export default APIExplorer