import { useState, useCallback, useMemo } from 'react'
import { ApiLabIcon, SearchIcon, RefreshCwIcon, CheckIcon, XIcon, CopyIcon, ServerIcon } from '../icons'

interface APIEndpoint {
  name: string
  url: string
  method: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH'
  headers?: Record<string, string>
  body?: string
  description: string
  category: 'public' | 'mock' | 'test' | 'custom'
}

interface ApiResponse {
  status: number
  statusText: string
  headers: Record<string, string>
  body: string
  time: number
  size: number
}

const presetEndpoints: APIEndpoint[] = [
  {
    name: 'Open-Meteo 天气',
    url: 'https://api.open-meteo.com/v1/forecast?latitude=39.9&longitude=116.4&current_weather=true',
    method: 'GET',
    description: '获取北京当前天气数据',
    category: 'public'
  },
  {
    name: 'GitHub 用户',
    url: 'https://api.github.com/users/github',
    method: 'GET',
    description: '获取GitHub用户信息',
    category: 'public'
  },
  {
    name: 'CoinGecko BTC',
    url: 'https://api.coingecko.com/api/v3/simple/price?ids=bitcoin&vs_currencies=usd',
    method: 'GET',
    description: '获取比特币价格',
    category: 'public'
  },
  {
    name: 'Hacker News Top',
    url: 'https://hacker-news.firebaseio.com/v0/topstories.json',
    method: 'GET',
    description: '获取Hacker News热门文章ID',
    category: 'public'
  },
  {
    name: 'JSONPlaceholder Users',
    url: 'https://jsonplaceholder.typicode.com/users',
    method: 'GET',
    description: '测试API获取用户列表',
    category: 'test'
  },
  {
    name: 'HTTPBin GET',
    url: 'https://httpbin.org/get',
    method: 'GET',
    description: '测试GET请求',
    category: 'test'
  },
  {
    name: 'HTTPBin POST',
    url: 'https://httpbin.org/post',
    method: 'POST',
    body: '{"test": "data"}',
    headers: { 'Content-Type': 'application/json' },
    description: '测试POST请求',
    category: 'test'
  },
]

export default function APIExplorerPro() {
  const [selectedEndpoint, setSelectedEndpoint] = useState<APIEndpoint | null>(null)
  const [customUrl, setCustomUrl] = useState('')
  const [customMethod, setCustomMethod] = useState<'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH'>('GET')
  const [customBody, setCustomBody] = useState('')
  const [customHeaders, setCustomHeaders] = useState('')
  const [response, setResponse] = useState<ApiResponse | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedCategory, setSelectedCategory] = useState<string>('all')

  const filteredEndpoints = useMemo(() => {
    return presetEndpoints.filter(ep => {
      const matchesSearch = ep.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        ep.url.toLowerCase().includes(searchQuery.toLowerCase())
      const matchesCategory = selectedCategory === 'all' || ep.category === selectedCategory
      return matchesSearch && matchesCategory
    })
  }, [searchQuery, selectedCategory])

  const executeRequest = useCallback(async (endpoint: APIEndpoint) => {
    setIsLoading(true)
    setError(null)
    setResponse(null)
    setSelectedEndpoint(endpoint)

    const startTime = Date.now()
    
    try {
      const headers = endpoint.headers || {}
      if (customHeaders) {
        try {
          const parsed = JSON.parse(customHeaders)
          Object.assign(headers, parsed)
        } catch {}
      }

      const options: RequestInit = {
        method: endpoint.method,
        headers
      }

      if (endpoint.method !== 'GET' && (endpoint.body || customBody)) {
        options.body = customBody || endpoint.body || ''
      }

      const res = await fetch(endpoint.url, options)
      const endTime = Date.now()
      
      const responseHeaders: Record<string, string> = {}
      res.headers.forEach((value, key) => {
        responseHeaders[key] = value
      })

      let body = ''
      try {
        body = await res.text()
        // Try to format as JSON
        try {
          const json = JSON.parse(body)
          body = JSON.stringify(json, null, 2)
        } catch {}
      } catch {
        body = 'Unable to read response body'
      }

      const apiResponse: ApiResponse = {
        status: res.status,
        statusText: res.statusText,
        headers: responseHeaders,
        body,
        time: endTime - startTime,
        size: body.length
      }

      setResponse(apiResponse)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Request failed')
    } finally {
      setIsLoading(false)
    }
  }, [customHeaders, customBody])

  const executeCustom = useCallback(async () => {
    if (!customUrl) return
    
    const endpoint: APIEndpoint = {
      name: 'Custom Request',
      url: customUrl,
      method: customMethod,
      body: customBody,
      description: 'User defined request',
      category: 'custom'
    }
    
    await executeRequest(endpoint)
  }, [customUrl, customMethod, customBody, executeRequest])

  const getStatusColor = (status: number) => {
    if (status >= 200 && status < 300) return '#22c55e'
    if (status >= 300 && status < 400) return '#f59e0b'
    if (status >= 400) return '#ef4444'
    return '#6b7280'
  }

  const copyToClipboard = useCallback((text: string) => {
    navigator.clipboard.writeText(text)
  }, [])

  return (
    <div style={{
      height: '100%',
      display: 'flex',
      flexDirection: 'column',
      background: '#0d1117',
      color: '#c9d1d9',
      fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Helvetica, Arial, sans-serif'
    }}>
      {/* 头部 */}
      <div style={{
        padding: '12px 16px',
        borderBottom: '1px solid #21262d',
        background: '#161b22'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <ApiLabIcon size={20} style={{ color: '#58a6ff' }} />
          <div>
            <h1 style={{ fontSize: 16, fontWeight: 600, margin: 0 }}>API Explorer Pro</h1>
            <p style={{ fontSize: 12, color: '#8b949e', margin: 0 }}>探索和测试公共API</p>
          </div>
        </div>
      </div>

      {/* 内容 */}
      <div style={{ flex: 1, display: 'flex', overflow: 'hidden' }}>
        {/* 左侧：API列表 */}
        <div style={{
          width: 280,
          borderRight: '1px solid #21262d',
          overflow: 'auto',
          background: '#0d1117'
        }}>
          {/* 搜索 */}
          <div style={{ padding: 12 }}>
            <div style={{ position: 'relative' }}>
              <SearchIcon size={14} style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', color: '#8b949e' }} />
              <input
                type="text"
                placeholder="搜索API..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                style={{
                  width: '100%',
                  padding: '6px 10px 6px 32px',
                  background: '#21262d',
                  border: '1px solid #30363d',
                  borderRadius: 6,
                  color: '#c9d1d9',
                  fontSize: 13
                }}
              />
            </div>
            
            {/* 分类筛选 */}
            <div style={{ display: 'flex', gap: 6, marginTop: 8 }}>
              {['all', 'public', 'test', 'mock'].map(cat => (
                <button
                  key={cat}
                  onClick={() => setSelectedCategory(cat)}
                  style={{
                    padding: '4px 8px',
                    background: selectedCategory === cat ? '#21262d' : 'transparent',
                    border: '1px solid #30363d',
                    borderRadius: 4,
                    color: selectedCategory === cat ? '#c9d1d9' : '#8b949e',
                    fontSize: 11,
                    cursor: 'pointer'
                  }}
                >
                  {cat === 'all' ? '全部' : cat === 'public' ? '公共' : cat === 'test' ? '测试' : '模拟'}
                </button>
              ))}
            </div>
          </div>

          {/* API列表 */}
          <div>
            {filteredEndpoints.map((ep, i) => (
              <div
                key={i}
                onClick={() => executeRequest(ep)}
                style={{
                  padding: '10px 12px',
                  borderBottom: '1px solid #21262d',
                  cursor: 'pointer',
                  background: selectedEndpoint?.url === ep.url ? '#161b22' : 'transparent',
                  transition: 'background 0.15s'
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 4 }}>
                  <span style={{ fontSize: 13, fontWeight: 500 }}>{ep.name}</span>
                  <span style={{
                    padding: '2px 6px',
                    background: ep.method === 'GET' ? '#238636' : ep.method === 'POST' ? '#1f6feb' : '#f0883e',
                    borderRadius: 4,
                    fontSize: 10,
                    fontWeight: 600,
                    color: '#fff'
                  }}>
                    {ep.method}
                  </span>
                </div>
                <div style={{ fontSize: 11, color: '#8b949e', marginBottom: 4 }}>{ep.description}</div>
                <div style={{ fontSize: 10, color: '#6e7681', fontFamily: 'monospace' }}>{ep.url.slice(0, 50)}...</div>
              </div>
            ))}
          </div>
        </div>

        {/* 右侧：请求和响应 */}
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'auto' }}>
          {/* 自定义请求 */}
          <div style={{ padding: 16, borderBottom: '1px solid #21262d' }}>
            <h3 style={{ fontSize: 14, fontWeight: 600, marginBottom: 12 }}>自定义请求</h3>
            <div style={{ display: 'flex', gap: 8, marginBottom: 8 }}>
              <select
                value={customMethod}
                onChange={(e) => setCustomMethod(e.target.value as any)}
                style={{
                  padding: '6px 10px',
                  background: '#21262d',
                  border: '1px solid #30363d',
                  borderRadius: 6,
                  color: '#c9d1d9',
                  fontSize: 13,
                  width: 80
                }}
              >
                <option>GET</option>
                <option>POST</option>
                <option>PUT</option>
                <option>DELETE</option>
                <option>PATCH</option>
              </select>
              <input
                type="text"
                placeholder="输入URL..."
                value={customUrl}
                onChange={(e) => setCustomUrl(e.target.value)}
                style={{
                  flex: 1,
                  padding: '6px 10px',
                  background: '#21262d',
                  border: '1px solid #30363d',
                  borderRadius: 6,
                  color: '#c9d1d9',
                  fontSize: 13
                }}
              />
              <button
                onClick={executeCustom}
                disabled={!customUrl || isLoading}
                style={{
                  padding: '6px 12px',
                  background: '#238636',
                  border: 'none',
                  borderRadius: 6,
                  color: '#fff',
                  fontSize: 13,
                  fontWeight: 500,
                  cursor: !customUrl || isLoading ? 'not-allowed' : 'pointer',
                  opacity: !customUrl || isLoading ? 0.5 : 1
                }}
              >
                {isLoading ? <RefreshCwIcon size={14} style={{ animation: 'spin 1s linear infinite' }} /> : '发送'}
              </button>
            </div>

            {customMethod !== 'GET' && (
              <div style={{ marginBottom: 8 }}>
                <label style={{ display: 'block', fontSize: 11, color: '#8b949e', marginBottom: 4 }}>Body (JSON)</label>
                <textarea
                  value={customBody}
                  onChange={(e) => setCustomBody(e.target.value)}
                  placeholder='{"key": "value"}'
                  style={{
                    width: '100%',
                    height: 60,
                    padding: 8,
                    background: '#21262d',
                    border: '1px solid #30363d',
                    borderRadius: 6,
                    color: '#c9d1d9',
                    fontSize: 12,
                    fontFamily: 'monospace',
                    resize: 'vertical'
                  }}
                />
              </div>
            )}

            <div>
              <label style={{ display: 'block', fontSize: 11, color: '#8b949e', marginBottom: 4 }}>Headers (JSON)</label>
              <input
                type="text"
                value={customHeaders}
                onChange={(e) => setCustomHeaders(e.target.value)}
                placeholder='{"Authorization": "Bearer token"}'
                style={{
                  width: '100%',
                  padding: 8,
                  background: '#21262d',
                  border: '1px solid #30363d',
                  borderRadius: 6,
                  color: '#c9d1d9',
                  fontSize: 12,
                  fontFamily: 'monospace'
                }}
              />
            </div>
          </div>

          {/* 响应区域 */}
          <div style={{ flex: 1, overflow: 'auto', padding: 16 }}>
            {isLoading && (
              <div style={{ textAlign: 'center', padding: 40, color: '#8b949e' }}>
                <RefreshCwIcon size={24} style={{ animation: 'spin 1s linear infinite', marginBottom: 12 }} />
                <div>正在请求...</div>
              </div>
            )}

            {error && (
              <div style={{
                background: '#f8514920',
                border: '1px solid #f85149',
                borderRadius: 8,
                padding: 16,
                color: '#f85149'
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
                  <XIcon size={16} />
                  <span style={{ fontWeight: 500 }}>请求失败</span>
                </div>
                <div style={{ fontSize: 13 }}>{error}</div>
              </div>
            )}

            {response && !isLoading && !error && (
              <div>
                {/* 响应状态 */}
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 16,
                  marginBottom: 16,
                  padding: 12,
                  background: '#161b22',
                  borderRadius: 8,
                  border: '1px solid #21262d'
                }}>
                  <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 8
                  }}>
                    <CheckIcon size={16} style={{ color: getStatusColor(response.status) }} />
                    <span style={{
                      fontSize: 16,
                      fontWeight: 600,
                      color: getStatusColor(response.status)
                    }}>
                      {response.status} {response.statusText}
                    </span>
                  </div>
                  <div style={{ fontSize: 12, color: '#8b949e' }}>
                    耗时: {response.time}ms | 大小: {response.size} bytes
                  </div>
                </div>

                {/* 响应头 */}
                <div style={{ marginBottom: 16 }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
                    <h4 style={{ fontSize: 13, fontWeight: 600 }}>响应头</h4>
                    <button
                      onClick={() => copyToClipboard(JSON.stringify(response.headers, null, 2))}
                      style={{
                        padding: '4px 8px',
                        background: 'transparent',
                        border: '1px solid #30363d',
                        borderRadius: 4,
                        color: '#8b949e',
                        fontSize: 11,
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        gap: 4
                      }}
                    >
                      <CopyIcon size={12} />
                      复制
                    </button>
                  </div>
                  <pre style={{
                    background: '#161b22',
                    border: '1px solid #21262d',
                    borderRadius: 6,
                    padding: 12,
                    fontSize: 12,
                    overflow: 'auto',
                    maxHeight: 150,
                    color: '#8b949e',
                    fontFamily: 'monospace',
                    margin: 0
                  }}>
                    {JSON.stringify(response.headers, null, 2)}
                  </pre>
                </div>

                {/* 响应体 */}
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
                    <h4 style={{ fontSize: 13, fontWeight: 600 }}>响应体</h4>
                    <button
                      onClick={() => copyToClipboard(response.body)}
                      style={{
                        padding: '4px 8px',
                        background: 'transparent',
                        border: '1px solid #30363d',
                        borderRadius: 4,
                        color: '#8b949e',
                        fontSize: 11,
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        gap: 4
                      }}
                    >
                      <CopyIcon size={12} />
                      复制
                    </button>
                  </div>
                  <pre style={{
                    background: '#161b22',
                    border: '1px solid #21262d',
                    borderRadius: 6,
                    padding: 12,
                    fontSize: 12,
                    overflow: 'auto',
                    maxHeight: 400,
                    color: '#c9d1d9',
                    fontFamily: 'monospace',
                    margin: 0,
                    whiteSpace: 'pre-wrap'
                  }}>
                    {response.body}
                  </pre>
                </div>
              </div>
            )}

            {!response && !isLoading && !error && (
              <div style={{ textAlign: 'center', padding: 40, color: '#8b949e' }}>
                <ServerIcon size={32} style={{ marginBottom: 12 }} />
                <div>选择左侧API或输入自定义URL开始测试</div>
              </div>
            )}
          </div>
        </div>
      </div>

      <style>{`
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  )
}