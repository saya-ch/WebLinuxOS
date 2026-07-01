import { useState, useCallback, useMemo } from 'react'

interface APIEndpoint {
  id: string
  name: string
  category: string
  description: string
  baseUrl: string
  method: 'GET' | 'POST'
  endpoints: {
    path: string
    name: string
    description: string
    params?: { key: string; label: string; type: 'text' | 'number' | 'select'; options?: string[]; defaultValue?: string }[]
    demo?: Record<string, string>
  }[]
  documentation?: string
}

const APIS: APIEndpoint[] = [
  {
    id: 'open-meteo',
    name: 'Open-Meteo 天气',
    category: '天气',
    description: '免费的开源天气 API，提供全球天气预报数据',
    baseUrl: 'https://api.open-meteo.com/v1',
    method: 'GET',
    documentation: 'https://open-meteo.com/',
    endpoints: [
      {
        path: '/forecast',
        name: '天气预报',
        description: '获取指定位置的天气预报数据',
        params: [
          { key: 'latitude', label: '纬度', type: 'number', defaultValue: '39.9042' },
          { key: 'longitude', label: '经度', type: 'number', defaultValue: '116.4074' },
          { key: 'current_weather', label: '当前天气', type: 'select', options: ['true', 'false'], defaultValue: 'true' },
          { key: 'daily', label: '每日预报', type: 'text', defaultValue: 'temperature_2m_max,temperature_2m_min,weathercode' },
          { key: 'timezone', label: '时区', type: 'text', defaultValue: 'Asia/Shanghai' },
        ],
        demo: { latitude: '39.9042', longitude: '116.4074', current_weather: 'true' },
      },
    ],
  },
  {
    id: 'coingecko',
    name: 'CoinGecko 加密货币',
    category: '金融',
    description: '加密货币价格和市场数据 API',
    baseUrl: 'https://api.coingecko.com/api/v3',
    method: 'GET',
    documentation: 'https://www.coingecko.com/en/api/documentation',
    endpoints: [
      {
        path: '/coins/markets',
        name: '市场行情',
        description: '获取加密货币市场行情数据',
        params: [
          { key: 'vs_currency', label: '计价货币', type: 'select', options: ['usd', 'cny', 'eur', 'jpy', 'gbp'], defaultValue: 'usd' },
          { key: 'order', label: '排序方式', type: 'select', options: ['market_cap_desc', 'volume_desc', 'id_desc', 'name_desc'], defaultValue: 'market_cap_desc' },
          { key: 'per_page', label: '每页数量', type: 'number', defaultValue: '10' },
          { key: 'page', label: '页码', type: 'number', defaultValue: '1' },
          { key: 'sparkline', label: '价格曲线', type: 'select', options: ['true', 'false'], defaultValue: 'false' },
        ],
        demo: { vs_currency: 'usd', per_page: '10' },
      },
      {
        path: '/simple/price',
        name: '简单价格',
        description: '获取指定加密货币的简单价格',
        params: [
          { key: 'ids', label: '币种ID(逗号分隔)', type: 'text', defaultValue: 'bitcoin,ethereum' },
          { key: 'vs_currencies', label: '计价货币', type: 'text', defaultValue: 'usd,cny' },
        ],
        demo: { ids: 'bitcoin,ethereum', vs_currencies: 'usd,cny' },
      },
      {
        path: '/coins/bitcoin',
        name: '比特币详情',
        description: '获取比特币的详细信息',
        params: [
          { key: 'localization', label: '本地化', type: 'select', options: ['true', 'false'], defaultValue: 'false' },
          { key: 'tickers', label: '交易对', type: 'select', options: ['true', 'false'], defaultValue: 'false' },
          { key: 'community_data', label: '社区数据', type: 'select', options: ['true', 'false'], defaultValue: 'false' },
          { key: 'developer_data', label: '开发者数据', type: 'select', options: ['true', 'false'], defaultValue: 'false' },
        ],
      },
    ],
  },
  {
    id: 'hn-algolia',
    name: 'Hacker News 搜索',
    category: '新闻',
    description: '通过 Algolia API 搜索 Hacker News 文章',
    baseUrl: 'https://hn.algolia.com/api/v1',
    method: 'GET',
    documentation: 'https://hn.algolia.com/api',
    endpoints: [
      {
        path: '/search',
        name: '搜索文章',
        description: '按关键词搜索 Hacker News 文章',
        params: [
          { key: 'query', label: '搜索关键词', type: 'text', defaultValue: 'react' },
          { key: 'tags', label: '标签(可选)', type: 'text', defaultValue: 'story' },
          { key: 'hitsPerPage', label: '每页结果', type: 'number', defaultValue: '20' },
          { key: 'page', label: '页码', type: 'number', defaultValue: '0' },
        ],
        demo: { query: 'react', hitsPerPage: '10' },
      },
      {
        path: '/search_by_date',
        name: '按日期搜索',
        description: '按日期排序搜索文章',
        params: [
          { key: 'query', label: '搜索关键词', type: 'text', defaultValue: 'javascript' },
          { key: 'hitsPerPage', label: '每页结果', type: 'number', defaultValue: '20' },
        ],
        demo: { query: 'javascript', hitsPerPage: '10' },
      },
    ],
  },
  {
    id: 'rest-countries',
    name: 'REST Countries',
    category: '信息',
    description: '获取世界各国信息的免费 API',
    baseUrl: 'https://restcountries.com/v3.1',
    method: 'GET',
    documentation: 'https://restcountries.com/',
    endpoints: [
      {
        path: '/all',
        name: '所有国家',
        description: '获取所有国家的信息',
        params: [
          { key: 'fields', label: '返回字段(逗号分隔)', type: 'text', defaultValue: 'name,capital,population,region,flags' },
        ],
        demo: { fields: 'name,capital,population,region,flags' },
      },
      {
        path: '/name/china',
        name: '搜索国家(中国)',
        description: '按名称搜索国家',
        params: [
          { key: 'fullText', label: '完整匹配', type: 'select', options: ['true', 'false'], defaultValue: 'true' },
        ],
      },
      {
        path: '/region/asia',
        name: '按地区查询',
        description: '按地区查询国家列表',
        params: [
          { key: 'fields', label: '返回字段', type: 'text', defaultValue: 'name,capital,population' },
        ],
      },
    ],
  },
  {
    id: 'frankfurter',
    name: 'Frankfurter 汇率',
    category: '金融',
    description: '免费开源的汇率转换 API，基于欧洲央行数据',
    baseUrl: 'https://api.frankfurter.app',
    method: 'GET',
    documentation: 'https://www.frankfurter.app/',
    endpoints: [
      {
        path: '/latest',
        name: '最新汇率',
        description: '获取最新的汇率数据',
        params: [
          { key: 'from', label: '源货币', type: 'text', defaultValue: 'USD' },
          { key: 'to', label: '目标货币(逗号分隔)', type: 'text', defaultValue: 'CNY,EUR,GBP,JPY' },
        ],
        demo: { from: 'USD', to: 'CNY,EUR,GBP' },
      },
      {
        path: '/currencies',
        name: '货币列表',
        description: '获取支持的所有货币列表',
        params: [],
      },
    ],
  },
  {
    id: 'httpbin',
    name: 'HTTPBin 测试',
    category: '工具',
    description: 'HTTP 请求和响应测试工具',
    baseUrl: 'https://httpbin.org',
    method: 'GET',
    documentation: 'https://httpbin.org/',
    endpoints: [
      {
        path: '/ip',
        name: '获取 IP',
        description: '获取请求来源 IP 地址',
        params: [],
      },
      {
        path: '/user-agent',
        name: 'User-Agent',
        description: '获取请求的 User-Agent',
        params: [],
      },
      {
        path: '/headers',
        name: '请求头',
        description: '获取请求的所有 HTTP 头',
        params: [],
      },
      {
        path: '/get',
        name: 'GET 请求',
        description: '返回 GET 请求的详细信息',
        params: [
          { key: 'foo', label: '测试参数 foo', type: 'text', defaultValue: 'bar' },
        ],
      },
      {
        path: '/status/200',
        name: '状态码测试',
        description: '返回指定的 HTTP 状态码',
        params: [],
      },
    ],
  },
  {
    id: 'jsonplaceholder',
    name: 'JSONPlaceholder',
    category: '开发',
    description: '免费的 REST API 用于测试和原型开发',
    baseUrl: 'https://jsonplaceholder.typicode.com',
    method: 'GET',
    documentation: 'https://jsonplaceholder.typicode.com/',
    endpoints: [
      {
        path: '/posts',
        name: '文章列表',
        description: '获取示例文章列表',
        params: [
          { key: '_limit', label: '数量限制', type: 'number', defaultValue: '10' },
        ],
        demo: { _limit: '5' },
      },
      {
        path: '/posts/1',
        name: '单篇文章',
        description: '获取单篇文章详情',
        params: [],
      },
      {
        path: '/users',
        name: '用户列表',
        description: '获取示例用户列表',
        params: [],
      },
      {
        path: '/comments',
        name: '评论列表',
        description: '获取示例评论',
        params: [
          { key: 'postId', label: '文章ID', type: 'number', defaultValue: '1' },
          { key: '_limit', label: '数量限制', type: 'number', defaultValue: '5' },
        ],
        demo: { postId: '1', _limit: '3' },
      },
      {
        path: '/todos',
        name: '待办事项',
        description: '获取示例待办事项',
        params: [
          { key: '_limit', label: '数量限制', type: 'number', defaultValue: '10' },
        ],
        demo: { _limit: '5' },
      },
    ],
  },
  {
    id: 'public-apis',
    name: '公开 API 目录',
    category: '发现',
    description: '搜索和发现各种公开可用的 API',
    baseUrl: 'https://api.publicapis.org',
    method: 'GET',
    documentation: 'https://www.publicapis.org/',
    endpoints: [
      {
        path: '/entries',
        name: 'API 列表',
        description: '获取公开 API 列表',
        params: [
          { key: 'category', label: '分类(可选)', type: 'text', defaultValue: '' },
          { key: 'title', label: '标题搜索', type: 'text', defaultValue: '' },
        ],
      },
      {
        path: '/categories',
        name: '分类列表',
        description: '获取所有可用的 API 分类',
        params: [],
      },
      {
        path: '/random',
        name: '随机 API',
        description: '获取一个随机的 API',
        params: [],
      },
    ],
  },
]

const CATEGORIES = ['全部', '天气', '金融', '新闻', '信息', '工具', '开发', '发现']

function formatJson(obj: unknown): string {
  try {
    return JSON.stringify(obj, null, 2)
  } catch {
    return String(obj)
  }
}

export default function APIPlayground() {
  const [selectedApi, setSelectedApi] = useState<APIEndpoint>(APIS[0])
  const [selectedEndpoint, setSelectedEndpoint] = useState(APIS[0].endpoints[0])
  const [params, setParams] = useState<Record<string, string>>(() => {
    const initial: Record<string, string> = {}
    APIS[0].endpoints[0].params?.forEach(p => {
      initial[p.key] = p.defaultValue || ''
    })
    return initial
  })
  const [response, setResponse] = useState<string>('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [responseStatus, setResponseStatus] = useState<number | null>(null)
  const [responseTime, setResponseTime] = useState<number | null>(null)
  const [activeTab, setActiveTab] = useState<'body' | 'headers'>('body')
  const [responseHeaders, setResponseHeaders] = useState<string>('')
  const [categoryFilter, setCategoryFilter] = useState('全部')
  const [searchQuery, setSearchQuery] = useState('')

  const filteredApis = useMemo(() => {
    return APIS.filter(api => {
      const categoryMatch = categoryFilter === '全部' || api.category === categoryFilter
      const searchMatch = searchQuery === '' ||
        api.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        api.description.toLowerCase().includes(searchQuery.toLowerCase())
      return categoryMatch && searchMatch
    })
  }, [categoryFilter, searchQuery])

  const selectApi = useCallback((api: APIEndpoint) => {
    setSelectedApi(api)
    setSelectedEndpoint(api.endpoints[0])
    const initial: Record<string, string> = {}
    api.endpoints[0].params?.forEach(p => {
      initial[p.key] = p.defaultValue || ''
    })
    setParams(initial)
    setResponse('')
    setError('')
    setResponseStatus(null)
    setResponseTime(null)
    setResponseHeaders('')
  }, [])

  const selectEndpoint = useCallback((endpoint: typeof selectedEndpoint) => {
    setSelectedEndpoint(endpoint)
    const initial: Record<string, string> = {}
    endpoint.params?.forEach(p => {
      initial[p.key] = p.defaultValue || ''
    })
    setParams(initial)
    setResponse('')
    setError('')
    setResponseStatus(null)
    setResponseTime(null)
    setResponseHeaders('')
  }, [])

  const handleParamChange = useCallback((key: string, value: string) => {
    setParams(prev => ({ ...prev, [key]: value }))
  }, [])

  const buildUrl = useCallback(() => {
    const url = new URL(selectedApi.baseUrl + selectedEndpoint.path)
    Object.entries(params).forEach(([key, value]) => {
      if (value.trim()) {
        url.searchParams.append(key, value)
      }
    })
    return url.toString()
  }, [selectedApi, selectedEndpoint, params])

  const sendRequest = useCallback(async () => {
    setLoading(true)
    setError('')
    setResponse('')
    setResponseStatus(null)
    setResponseTime(null)
    setResponseHeaders('')
    setActiveTab('body')

    const startTime = Date.now()

    try {
      const url = buildUrl()
      const res = await fetch(url, {
        method: selectedApi.method,
        headers: {
          'Accept': 'application/json',
        },
      })

      const endTime = Date.now()
      setResponseTime(endTime - startTime)
      setResponseStatus(res.status)

      const headers: Record<string, string> = {}
      res.headers.forEach((value, key) => {
        headers[key] = value
      })
      setResponseHeaders(formatJson(headers))

      const contentType = res.headers.get('content-type') || ''
      let body: string

      if (contentType.includes('application/json')) {
        const data = await res.json()
        body = formatJson(data)
      } else {
        body = await res.text()
      }

      setResponse(body)

      if (!res.ok) {
        setError(`请求失败: HTTP ${res.status}`)
      }
    } catch (e: unknown) {
      const errorMsg = e instanceof Error ? e.message : String(e)
      setError(`请求错误: ${errorMsg}`)
      setResponseTime(Date.now() - startTime)
    } finally {
      setLoading(false)
    }
  }, [buildUrl, selectedApi.method])

  const loadDemo = useCallback(() => {
    if (selectedEndpoint.demo) {
      setParams({ ...selectedEndpoint.demo })
    }
  }, [selectedEndpoint])

  const copyUrl = useCallback(() => {
    navigator.clipboard?.writeText(buildUrl())
  }, [buildUrl])

  return (
    <div style={{ height: '100%', display: 'flex', flexDirection: 'column', background: 'var(--bg-primary)' }}>
      <div style={{
        padding: '12px 16px',
        borderBottom: '1px solid var(--border-color)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        background: 'var(--bg-secondary)',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <span style={{ fontWeight: 600, fontSize: 15, color: 'var(--text-primary)' }}>
            🌐 API 游乐场
          </span>
          <span style={{ fontSize: 12, color: 'var(--text-secondary)' }}>
            探索公开 API，实时测试请求
          </span>
        </div>
        {responseStatus !== null && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, fontSize: 12 }}>
            <span style={{
              padding: '3px 10px',
              borderRadius: 12,
              background: responseStatus >= 200 && responseStatus < 300
                ? 'rgba(0, 200, 120, 0.15)'
                : 'rgba(255, 80, 80, 0.15)',
              color: responseStatus >= 200 && responseStatus < 300 ? '#00c878' : '#ff5050',
              fontWeight: 600,
            }}>
              {responseStatus}
            </span>
            {responseTime !== null && (
              <span style={{ color: 'var(--text-secondary)' }}>
                {responseTime}ms
              </span>
            )}
          </div>
        )}
      </div>

      <div style={{ flex: 1, display: 'flex', overflow: 'hidden' }}>
        <div style={{
          width: 260,
          borderRight: '1px solid var(--border-color)',
          display: 'flex',
          flexDirection: 'column',
          background: 'var(--bg-secondary)',
        }}>
          <div style={{ padding: '10px 12px', borderBottom: '1px solid var(--border-color)' }}>
            <input
              type="text"
              placeholder="搜索 API..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              style={{
                width: '100%',
                padding: '8px 10px',
                fontSize: 12,
                borderRadius: 6,
                border: '1px solid var(--border-color)',
                background: 'var(--bg-primary)',
                color: 'var(--text-primary)',
                outline: 'none',
                boxSizing: 'border-box',
              }}
            />
          </div>

          <div style={{
            padding: '8px 12px',
            display: 'flex',
            flexWrap: 'wrap',
            gap: 4,
            borderBottom: '1px solid var(--border-color)',
          }}>
            {CATEGORIES.map(cat => (
              <button
                key={cat}
                onClick={() => setCategoryFilter(cat)}
                style={{
                  padding: '3px 8px',
                  fontSize: 10,
                  borderRadius: 10,
                  border: 'none',
                  cursor: 'pointer',
                  background: categoryFilter === cat ? 'var(--accent)' : 'var(--bg-tertiary)',
                  color: categoryFilter === cat ? 'white' : 'var(--text-secondary)',
                }}
              >
                {cat}
              </button>
            ))}
          </div>

          <div style={{ flex: 1, overflowY: 'auto', padding: 6 }}>
            {filteredApis.map(api => (
              <div
                key={api.id}
                onClick={() => selectApi(api)}
                style={{
                  padding: '10px 12px',
                  borderRadius: 8,
                  cursor: 'pointer',
                  marginBottom: 2,
                  background: selectedApi.id === api.id
                    ? 'rgba(139, 124, 240, 0.15)'
                    : 'transparent',
                  transition: 'background 0.15s',
                }}
                onMouseEnter={(e) => {
                  if (selectedApi.id !== api.id) {
                    e.currentTarget.style.background = 'var(--bg-tertiary)'
                  }
                }}
                onMouseLeave={(e) => {
                  if (selectedApi.id !== api.id) {
                    e.currentTarget.style.background = 'transparent'
                  }
                }}
              >
                <div style={{
                  fontSize: 13,
                  fontWeight: 500,
                  color: 'var(--text-primary)',
                  marginBottom: 3,
                }}>
                  {api.name}
                </div>
                <div style={{
                  fontSize: 11,
                  color: 'var(--text-tertiary)',
                  marginBottom: 4,
                  lineHeight: 1.4,
                }}>
                  {api.description}
                </div>
                <span style={{
                  fontSize: 10,
                  padding: '2px 6px',
                  borderRadius: 8,
                  background: 'var(--bg-tertiary)',
                  color: 'var(--text-secondary)',
                }}>
                  {api.category}
                </span>
              </div>
            ))}
          </div>
        </div>

        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
          <div style={{
            padding: '12px 16px',
            borderBottom: '1px solid var(--border-color)',
          }}>
            <div style={{
              fontSize: 16,
              fontWeight: 600,
              color: 'var(--text-primary)',
              marginBottom: 4,
            }}>
              {selectedApi.name}
            </div>
            <div style={{ fontSize: 12, color: 'var(--text-secondary)', marginBottom: 10 }}>
              {selectedApi.description}
            </div>

            <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 12 }}>
              {selectedApi.endpoints.map(ep => (
                <button
                  key={ep.path}
                  onClick={() => selectEndpoint(ep)}
                  style={{
                    padding: '6px 12px',
                    fontSize: 11,
                    borderRadius: 6,
                    border: '1px solid var(--border-color)',
                    background: selectedEndpoint.path === ep.path
                      ? 'rgba(139, 124, 240, 0.15)'
                      : 'var(--bg-tertiary)',
                    color: selectedEndpoint.path === ep.path ? 'var(--accent)' : 'var(--text-secondary)',
                    cursor: 'pointer',
                    fontWeight: selectedEndpoint.path === ep.path ? 600 : 400,
                  }}
                >
                  <span style={{
                    color: selectedApi.method === 'GET' ? '#00c878' : '#ffb400',
                    marginRight: 6,
                    fontWeight: 700,
                  }}>
                    {selectedApi.method}
                  </span>
                  {ep.name}
                </button>
              ))}
            </div>

            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: 8,
              padding: '8px 10px',
              borderRadius: 6,
              background: 'var(--bg-secondary)',
              border: '1px solid var(--border-color)',
              fontFamily: "'JetBrains Mono', monospace",
              fontSize: 12,
              marginBottom: 12,
            }}>
              <span style={{
                padding: '2px 8px',
                borderRadius: 4,
                background: selectedApi.method === 'GET' ? 'rgba(0, 200, 120, 0.2)' : 'rgba(255, 180, 0, 0.2)',
                color: selectedApi.method === 'GET' ? '#00c878' : '#ffb400',
                fontWeight: 700,
                fontSize: 10,
              }}>
                {selectedApi.method}
              </span>
              <span style={{
                flex: 1,
                color: 'var(--text-primary)',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                whiteSpace: 'nowrap',
              }}>
                {buildUrl()}
              </span>
              <button
                onClick={copyUrl}
                style={{
                  padding: '4px 8px',
                  fontSize: 11,
                  borderRadius: 4,
                  border: '1px solid var(--border-color)',
                  background: 'var(--bg-primary)',
                  color: 'var(--text-secondary)',
                  cursor: 'pointer',
                }}
              >
                复制
              </button>
            </div>

            {selectedEndpoint.params && selectedEndpoint.params.length > 0 && (
              <div>
                <div style={{
                  fontSize: 12,
                  fontWeight: 500,
                  color: 'var(--text-primary)',
                  marginBottom: 8,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                }}>
                  <span>请求参数</span>
                  {selectedEndpoint.demo && (
                    <button
                      onClick={loadDemo}
                      style={{
                        padding: '3px 10px',
                        fontSize: 11,
                        borderRadius: 4,
                        border: '1px solid var(--accent)',
                        background: 'transparent',
                        color: 'var(--accent)',
                        cursor: 'pointer',
                      }}
                    >
                      加载示例
                    </button>
                  )}
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
                  {selectedEndpoint.params.map(param => (
                    <div key={param.key}>
                      <label style={{
                        display: 'block',
                        fontSize: 11,
                        color: 'var(--text-secondary)',
                        marginBottom: 4,
                      }}>
                        {param.label}
                      </label>
                      {param.type === 'select' ? (
                        <select
                          value={params[param.key] || ''}
                          onChange={(e) => handleParamChange(param.key, e.target.value)}
                          style={{
                            width: '100%',
                            padding: '7px 10px',
                            fontSize: 12,
                            borderRadius: 6,
                            border: '1px solid var(--border-color)',
                            background: 'var(--bg-primary)',
                            color: 'var(--text-primary)',
                            outline: 'none',
                            boxSizing: 'border-box',
                          }}
                        >
                          {param.options?.map(opt => (
                            <option key={opt} value={opt}>{opt}</option>
                          ))}
                        </select>
                      ) : (
                        <input
                          type={param.type}
                          value={params[param.key] || ''}
                          onChange={(e) => handleParamChange(param.key, e.target.value)}
                          placeholder={param.key}
                          style={{
                            width: '100%',
                            padding: '7px 10px',
                            fontSize: 12,
                            borderRadius: 6,
                            border: '1px solid var(--border-color)',
                            background: 'var(--bg-primary)',
                            color: 'var(--text-primary)',
                            outline: 'none',
                            boxSizing: 'border-box',
                            fontFamily: "'JetBrains Mono', monospace",
                          }}
                        />
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div style={{ display: 'flex', gap: 8, marginTop: 12 }}>
              <button
                onClick={sendRequest}
                disabled={loading}
                style={{
                  padding: '8px 20px',
                  fontSize: 13,
                  borderRadius: 6,
                  border: 'none',
                  background: 'var(--accent)',
                  color: 'white',
                  cursor: loading ? 'not-allowed' : 'pointer',
                  fontWeight: 500,
                  opacity: loading ? 0.7 : 1,
                }}
              >
                {loading ? '请求中...' : '发送请求'}
              </button>
              {selectedApi.documentation && (
                <a
                  href={selectedApi.documentation}
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{
                    padding: '8px 16px',
                    fontSize: 12,
                    borderRadius: 6,
                    border: '1px solid var(--border-color)',
                    background: 'transparent',
                    color: 'var(--text-secondary)',
                    cursor: 'pointer',
                    textDecoration: 'none',
                    display: 'inline-flex',
                    alignItems: 'center',
                  }}
                >
                  📚 API 文档
                </a>
              )}
            </div>
          </div>

          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
            <div style={{
              display: 'flex',
              borderBottom: '1px solid var(--border-color)',
              background: 'var(--bg-secondary)',
            }}>
              <button
                onClick={() => setActiveTab('body')}
                style={{
                  padding: '10px 16px',
                  fontSize: 12,
                  border: 'none',
                  background: 'transparent',
                  color: activeTab === 'body' ? 'var(--accent)' : 'var(--text-secondary)',
                  cursor: 'pointer',
                  borderBottom: activeTab === 'body' ? '2px solid var(--accent)' : '2px solid transparent',
                  fontWeight: activeTab === 'body' ? 600 : 400,
                }}
              >
                响应体
              </button>
              <button
                onClick={() => setActiveTab('headers')}
                style={{
                  padding: '10px 16px',
                  fontSize: 12,
                  border: 'none',
                  background: 'transparent',
                  color: activeTab === 'headers' ? 'var(--accent)' : 'var(--text-secondary)',
                  cursor: 'pointer',
                  borderBottom: activeTab === 'headers' ? '2px solid var(--accent)' : '2px solid transparent',
                  fontWeight: activeTab === 'headers' ? 600 : 400,
                }}
              >
                响应头
              </button>
            </div>

            <div style={{ flex: 1, overflow: 'auto', padding: 0 }}>
              {error && (
                <div style={{
                  padding: '12px 16px',
                  margin: 12,
                  borderRadius: 8,
                  background: 'rgba(255, 80, 80, 0.1)',
                  border: '1px solid rgba(255, 80, 80, 0.3)',
                  color: '#ff5050',
                  fontSize: 13,
                }}>
                  {error}
                </div>
              )}
              {!loading && !response && !error && (
                <div style={{
                  height: '100%',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: 'var(--text-tertiary)',
                  fontSize: 13,
                  flexDirection: 'column',
                  gap: 8,
                }}>
                  <span style={{ fontSize: 32 }}>🚀</span>
                  <span>点击「发送请求」开始探索 API</span>
                </div>
              )}
              {loading && (
                <div style={{
                  height: '100%',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: 'var(--text-secondary)',
                  fontSize: 13,
                }}>
                  请求中...
                </div>
              )}
              {response && (
                <pre style={{
                  margin: 0,
                  padding: 16,
                  fontFamily: "'JetBrains Mono', monospace",
                  fontSize: 12,
                  lineHeight: 1.6,
                  color: 'var(--text-primary)',
                  whiteSpace: 'pre-wrap',
                  wordBreak: 'break-all',
                }}>
                  {activeTab === 'body' ? response : responseHeaders}
                </pre>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
