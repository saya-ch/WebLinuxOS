import { useState, useCallback, useEffect, memo } from 'react'

interface RequestHistory {
  id: string
  method: string
  url: string
  timestamp: Date
  status: number
  duration: number
  responseSize: number
}

interface SavedRequest {
  id: string
  name: string
  method: string
  url: string
  headers: Record<string, string>
  body: string
  createdAt: Date
}

interface ResponseData {
  status: number
  statusText: string
  headers: Record<string, string>
  body: string
  duration: number
  size: number
}

const METHODS = ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'HEAD', 'OPTIONS']

const COMMON_HEADERS = [
  { key: 'Content-Type', value: 'application/json' },
  { key: 'Authorization', value: 'Bearer <token>' },
  { key: 'Accept', value: 'application/json' },
  { key: 'User-Agent', value: 'WebLinuxOS-API-Tester' },
  { key: 'X-API-Key', value: '<api-key>' },
]

const SAMPLE_APIS = [
  {
    name: 'GitHub 用户信息',
    method: 'GET',
    url: 'https://api.github.com/users/github',
    headers: {},
    body: '',
    description: '获取GitHub用户公开信息',
  },
  {
    name: 'Open-Meteo 天气',
    method: 'GET',
    url: 'https://api.open-meteo.com/v1/forecast?latitude=39.9&longitude=116.4&current=temperature_2m',
    headers: {},
    body: '',
    description: '获取北京当前天气',
  },
  {
    name: 'Hacker News 热门',
    method: 'GET',
    url: 'https://hn.algolia.com/api/v1/search?tags=front_page&hitsPerPage=10',
    headers: {},
    body: '',
    description: '获取Hacker News热门文章',
  },
  {
    name: 'JSONPlaceholder 用户',
    method: 'GET',
    url: 'https://jsonplaceholder.typicode.com/users/1',
    headers: {},
    body: '',
    description: '测试API - 获取用户数据',
  },
  {
    name: 'JSONPlaceholder 创建帖子',
    method: 'POST',
    url: 'https://jsonplaceholder.typicode.com/posts',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ title: 'Test Post', body: 'This is a test', userId: 1 }),
    description: '测试API - 创建新帖子',
  },
  {
    name: 'IP信息查询',
    method: 'GET',
    url: 'https://ipapi.co/json/',
    headers: {},
    body: '',
    description: '获取当前IP地址信息',
  },
  {
    name: '汇率查询',
    method: 'GET',
    url: 'https://open.er-api.com/v6/latest/USD',
    headers: {},
    body: '',
    description: '获取USD汇率信息',
  },
  {
    name: '随机名言',
    method: 'GET',
    url: 'https://api.quotable.io/random',
    headers: {},
    body: '',
    description: '获取随机名言',
  },
]

const APITesterPro = memo(function APITesterPro() {
  const [method, setMethod] = useState('GET')
  const [url, setUrl] = useState('')
  const [headers, setHeaders] = useState<{ key: string; value: string }[]>([
    { key: 'Content-Type', value: 'application/json' },
  ])
  const [body, setBody] = useState('')
  const [response, setResponse] = useState<ResponseData | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [history, setHistory] = useState<RequestHistory[]>([])
  const [savedRequests, setSavedRequests] = useState<SavedRequest[]>([])
  const [activeTab, setActiveTab] = useState<'request' | 'response' | 'history' | 'saved'>('request')
  const [responseView, setResponseView] = useState<'pretty' | 'raw' | 'headers'>('pretty')
  const [showApiList, setShowApiList] = useState(false)

  // Load saved requests from localStorage
  useEffect(() => {
    try {
      const saved = localStorage.getItem('weblinux-api-saved-requests')
      if (saved) {
        setSavedRequests(JSON.parse(saved))
      }
      const hist = localStorage.getItem('weblinux-api-history')
      if (hist) {
        setHistory(JSON.parse(hist).map((h: any) => ({ ...h, timestamp: new Date(h.timestamp) })))
      }
    } catch {
      // ignore
    }
  }, [])

  // Save to localStorage
  useEffect(() => {
    try {
      localStorage.setItem('weblinux-api-saved-requests', JSON.stringify(savedRequests))
    } catch {
      // ignore
    }
  }, [savedRequests])

  useEffect(() => {
    try {
      localStorage.setItem('weblinux-api-history', JSON.stringify(history.slice(0, 50)))
    } catch {
      // ignore
    }
  }, [history])

  const addHeader = useCallback(() => {
    setHeaders(prev => [...prev, { key: '', value: '' }])
  }, [])

  const removeHeader = useCallback((index: number) => {
    setHeaders(prev => prev.filter((_, i) => i !== index))
  }, [])

  const updateHeader = useCallback((index: number, key: string, value: string) => {
    setHeaders(prev => prev.map((h, i) => i === index ? { key, value } : h))
  }, [])

  const addCommonHeader = useCallback((header: { key: string; value: string }) => {
    setHeaders(prev => [...prev, header])
  }, [])

  const sendRequest = useCallback(async () => {
    if (!url.trim()) {
      setError('请输入URL')
      return
    }

    setLoading(true)
    setError(null)
    setResponse(null)

    const startTime = performance.now()

    try {
      const headerObj: Record<string, string> = {}
      headers.forEach(h => {
        if (h.key.trim()) {
          headerObj[h.key] = h.value
        }
      })

      const options: RequestInit = {
        method,
        headers: headerObj,
      }

      if (method !== 'GET' && method !== 'HEAD' && body.trim()) {
        options.body = body
      }

      const res = await fetch(url, options)
      const endTime = performance.now()
      const duration = Math.round(endTime - startTime)

      const responseHeaders: Record<string, string> = {}
      res.headers.forEach((value, key) => {
        responseHeaders[key] = value
      })

      let responseBody = ''
      try {
        responseBody = await res.text()
      } catch {
        responseBody = '无法读取响应内容'
      }

      const responseSize = new Blob([responseBody]).size

      const responseData: ResponseData = {
        status: res.status,
        statusText: res.statusText,
        headers: responseHeaders,
        body: responseBody,
        duration,
        size: responseSize,
      }

      setResponse(responseData)

      // Add to history
      const historyEntry: RequestHistory = {
        id: Date.now().toString(),
        method,
        url,
        timestamp: new Date(),
        status: res.status,
        duration,
        responseSize,
      }
      setHistory(prev => [historyEntry, ...prev.slice(0, 49)])

    } catch (err) {
      const endTime = performance.now()
      const duration = Math.round(endTime - startTime)
      
      setError(err instanceof Error ? err.message : '请求失败')
      
      // Add failed request to history
      const historyEntry: RequestHistory = {
        id: Date.now().toString(),
        method,
        url,
        timestamp: new Date(),
        status: 0,
        duration,
        responseSize: 0,
      }
      setHistory(prev => [historyEntry, ...prev.slice(0, 49)])
    } finally {
      setLoading(false)
    }
  }, [url, method, headers, body])

  const saveRequest = useCallback(() => {
    if (!url.trim()) return
    
    const saved: SavedRequest = {
      id: Date.now().toString(),
      name: url.split('/').pop() || url,
      method,
      url,
      headers: headers.reduce((acc, h) => {
        if (h.key.trim()) acc[h.key] = h.value
        return acc
      }, {} as Record<string, string>),
      body,
      createdAt: new Date(),
    }
    
    setSavedRequests(prev => [saved, ...prev])
  }, [url, method, headers, body])

  const loadSavedRequest = useCallback((saved: SavedRequest) => {
    setMethod(saved.method)
    setUrl(saved.url)
    setHeaders(Object.entries(saved.headers).map(([key, value]) => ({ key, value })))
    setBody(saved.body)
    setActiveTab('request')
  }, [])

  const loadSampleApi = useCallback((api: typeof SAMPLE_APIS[0]) => {
    setMethod(api.method)
    setUrl(api.url)
    setHeaders(Object.entries(api.headers).map(([key, value]) => ({ key, value })))
    setBody(api.body)
    setShowApiList(false)
    setActiveTab('request')
  }, [])

  const deleteSavedRequest = useCallback((id: string) => {
    setSavedRequests(prev => prev.filter(r => r.id !== id))
  }, [])

  const clearHistory = useCallback(() => {
    setHistory([])
  }, [])

  const formatJson = (str: string): string => {
    try {
      const parsed = JSON.parse(str)
      return JSON.stringify(parsed, null, 2)
    } catch {
      return str
    }
  }

  const getStatusColor = (status: number) => {
    if (status >= 200 && status < 300) return '#22c55e'
    if (status >= 300 && status < 400) return '#f59e0b'
    if (status >= 400 && status < 500) return '#ef4444'
    if (status >= 500) return '#dc2626'
    return '#6b7280'
  }

  const formatSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
    return `${(bytes / 1024 / 1024).toFixed(2)} MB`
  }

  return (
    <div style={{
      height: '100%',
      background: '#0d1117',
      color: '#c9d1d9',
      fontFamily: 'system-ui, -apple-system, sans-serif',
      display: 'flex',
      flexDirection: 'column',
    }}>
      {/* Header */}
      <div style={{
        padding: '12px 20px',
        background: '#161b22',
        borderBottom: '1px solid #30363d',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
      }}>
        <div>
          <h1 style={{ fontSize: 18, fontWeight: 600, margin: 0, color: '#f0f6fc' }}>
            API 测试器 Pro
          </h1>
          <p style={{ fontSize: 12, color: '#8b949e', margin: '4px 0 0 0' }}>
            测试REST API，支持多种请求方法和自定义头
          </p>
        </div>
        <button
          onClick={() => setShowApiList(!showApiList)}
          style={{
            padding: '6px 12px',
            borderRadius: 6,
            border: '1px solid #30363d',
            background: 'transparent',
            color: '#c9d1d9',
            cursor: 'pointer',
            fontSize: 13,
          }}
        >
          示例 API
        </button>
      </div>

      {/* Sample API Dropdown */}
      {showApiList && (
        <div style={{
          position: 'absolute',
          top: 60,
          right: 20,
          background: '#161b22',
          borderRadius: 12,
          border: '1px solid #30363d',
          padding: 12,
          width: 300,
          maxHeight: 400,
          overflow: 'auto',
          zIndex: 100,
        }}>
          <h3 style={{ fontSize: 14, fontWeight: 600, margin: '0 0 12px 0', color: '#f0f6fc' }}>
            示例 API 请求
          </h3>
          {SAMPLE_APIS.map((api, i) => (
            <div
              key={i}
              onClick={() => loadSampleApi(api)}
              style={{
                padding: '10px 12px',
                borderRadius: 8,
                cursor: 'pointer',
                marginBottom: 8,
                background: '#21262d',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <span style={{
                  background: api.method === 'GET' ? '#22c55e' : api.method === 'POST' ? '#3b82f6' : '#f59e0b',
                  color: '#fff',
                  padding: '2px 6px',
                  borderRadius: 4,
                  fontSize: 11,
                  fontWeight: 600,
                }}>
                  {api.method}
                </span>
                <span style={{ fontSize: 13, fontWeight: 500 }}>{api.name}</span>
              </div>
              <p style={{ fontSize: 11, color: '#8b949e', margin: '4px 0 0 0' }}>
                {api.description}
              </p>
            </div>
          ))}
        </div>
      )}

      {/* Tabs */}
      <div style={{
        display: 'flex',
        background: '#161b22',
        borderBottom: '1px solid #30363d',
      }}>
        {(['request', 'response', 'history', 'saved'] as const).map(tab => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            style={{
              padding: '10px 20px',
              border: 'none',
              background: activeTab === tab ? '#21262d' : 'transparent',
              color: activeTab === tab ? '#f0f6fc' : '#8b949e',
              cursor: 'pointer',
              fontSize: 14,
              borderBottom: activeTab === tab ? '2px solid #f78166' : '2px solid transparent',
            }}
          >
            {tab === 'request' ? '请求' : tab === 'response' ? '响应' : tab === 'history' ? '历史' : '已保存'}
            {tab === 'history' && history.length > 0 && (
              <span style={{ marginLeft: 6, fontSize: 12, color: '#8b949e' }}>
                ({history.length})
              </span>
            )}
            {tab === 'saved' && savedRequests.length > 0 && (
              <span style={{ marginLeft: 6, fontSize: 12, color: '#8b949e' }}>
                ({savedRequests.length})
              </span>
            )}
          </button>
        ))}
      </div>

      {/* Content */}
      <div style={{ flex: 1, overflow: 'auto', padding: 20 }}>
        {activeTab === 'request' && (
          <div>
            {/* Method and URL */}
            <div style={{ display: 'flex', gap: 12, marginBottom: 20 }}>
              <select
                value={method}
                onChange={(e) => setMethod(e.target.value)}
                style={{
                  padding: '10px 12px',
                  borderRadius: 6,
                  border: '1px solid #30363d',
                  background: '#21262d',
                  color: method === 'GET' ? '#22c55e' : method === 'POST' ? '#3b82f6' : method === 'DELETE' ? '#ef4444' : '#f59e0b',
                  fontSize: 14,
                  fontWeight: 600,
                  width: 100,
                }}
              >
                {METHODS.map(m => (
                  <option key={m} value={m}>{m}</option>
                ))}
              </select>
              <input
                type="text"
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                placeholder="输入 API URL (例如: https://api.example.com/users)"
                style={{
                  flex: 1,
                  padding: '10px 12px',
                  borderRadius: 6,
                  border: '1px solid #30363d',
                  background: '#0d1117',
                  color: '#c9d1d9',
                  fontSize: 14,
                }}
              />
              <button
                onClick={sendRequest}
                disabled={loading || !url.trim()}
                style={{
                  padding: '10px 24px',
                  borderRadius: 6,
                  border: 'none',
                  background: loading ? '#21262d' : '#238636',
                  color: '#fff',
                  cursor: loading ? 'wait' : 'pointer',
                  fontSize: 14,
                  fontWeight: 600,
                }}
              >
                {loading ? '发送中...' : '发送'}
              </button>
              <button
                onClick={saveRequest}
                disabled={!url.trim()}
                style={{
                  padding: '10px 16px',
                  borderRadius: 6,
                  border: '1px solid #30363d',
                  background: 'transparent',
                  color: '#c9d1d9',
                  cursor: 'pointer',
                  fontSize: 14,
                }}
              >
                保存
              </button>
            </div>

            {/* Headers */}
            <div style={{ marginBottom: 20 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                <h3 style={{ fontSize: 14, fontWeight: 600, margin: 0 }}>请求头</h3>
                <div style={{ display: 'flex', gap: 8 }}>
                  <select
                    onChange={(e) => {
                      const header = COMMON_HEADERS.find(h => h.key === e.target.value)
                      if (header) addCommonHeader(header)
                    }}
                    style={{
                      padding: '6px 10px',
                      borderRadius: 4,
                      border: '1px solid #30363d',
                      background: 'transparent',
                      color: '#8b949e',
                      fontSize: 12,
                    }}
                  >
                    <option value="">添加常用头...</option>
                    {COMMON_HEADERS.map(h => (
                      <option key={h.key} value={h.key}>{h.key}</option>
                    ))}
                  </select>
                  <button
                    onClick={addHeader}
                    style={{
                      padding: '6px 10px',
                      borderRadius: 4,
                      border: '1px solid #30363d',
                      background: 'transparent',
                      color: '#c9d1d9',
                      cursor: 'pointer',
                      fontSize: 12,
                    }}
                  >
                    + 自定义
                  </button>
                </div>
              </div>
              {headers.map((header, i) => (
                <div key={i} style={{ display: 'flex', gap: 8, marginBottom: 8 }}>
                  <input
                    type="text"
                    value={header.key}
                    onChange={(e) => updateHeader(i, e.target.value, header.value)}
                    placeholder="Header Name"
                    style={{
                      flex: 1,
                      padding: '8px 12px',
                      borderRadius: 6,
                      border: '1px solid #30363d',
                      background: '#0d1117',
                      color: '#c9d1d9',
                      fontSize: 13,
                    }}
                  />
                  <input
                    type="text"
                    value={header.value}
                    onChange={(e) => updateHeader(i, header.key, e.target.value)}
                    placeholder="Header Value"
                    style={{
                      flex: 2,
                      padding: '8px 12px',
                      borderRadius: 6,
                      border: '1px solid #30363d',
                      background: '#0d1117',
                      color: '#c9d1d9',
                      fontSize: 13,
                    }}
                  />
                  <button
                    onClick={() => removeHeader(i)}
                    style={{
                      padding: '8px 12px',
                      borderRadius: 6,
                      border: '1px solid #30363d',
                      background: 'transparent',
                      color: '#f85149',
                      cursor: 'pointer',
                      fontSize: 13,
                    }}
                  >
                    删除
                  </button>
                </div>
              ))}
            </div>

            {/* Body */}
            {method !== 'GET' && method !== 'HEAD' && (
              <div>
                <h3 style={{ fontSize: 14, fontWeight: 600, margin: '0 0 12px 0' }}>请求体</h3>
                <textarea
                  value={body}
                  onChange={(e) => setBody(e.target.value)}
                  placeholder="输入请求体 (JSON 格式)"
                  style={{
                    width: '100%',
                    minHeight: 150,
                    padding: 12,
                    borderRadius: 6,
                    border: '1px solid #30363d',
                    background: '#0d1117',
                    color: '#c9d1d9',
                    fontSize: 14,
                    fontFamily: 'ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace',
                    resize: 'vertical',
                  }}
                />
              </div>
            )}
          </div>
        )}

        {activeTab === 'response' && (
          <div>
            {error && (
              <div style={{
                background: '#f8514920',
                borderRadius: 12,
                padding: 16,
                marginBottom: 20,
                border: '1px solid #f85149',
              }}>
                <h3 style={{ fontSize: 14, fontWeight: 600, margin: '0 0 8px 0', color: '#f85149' }}>
                  请求失败
                </h3>
                <p style={{ fontSize: 13, margin: 0 }}>{error}</p>
              </div>
            )}

            {response && (
              <div>
                {/* Response Summary */}
                <div style={{
                  background: '#161b22',
                  borderRadius: 12,
                  padding: 16,
                  marginBottom: 20,
                  display: 'flex',
                  gap: 24,
                }}>
                  <div>
                    <span style={{ fontSize: 12, color: '#8b949e' }}>状态码</span>
                    <div style={{
                      fontSize: 24,
                      fontWeight: 700,
                      color: getStatusColor(response.status),
                    }}>
                      {response.status} {response.statusText}
                    </div>
                  </div>
                  <div>
                    <span style={{ fontSize: 12, color: '#8b949e' }}>耗时</span>
                    <div style={{ fontSize: 24, fontWeight: 700, color: '#c9d1d9' }}>
                      {response.duration}ms
                    </div>
                  </div>
                  <div>
                    <span style={{ fontSize: 12, color: '#8b949e' }}>大小</span>
                    <div style={{ fontSize: 24, fontWeight: 700, color: '#c9d1d9' }}>
                      {formatSize(response.size)}
                    </div>
                  </div>
                </div>

                {/* Response View Tabs */}
                <div style={{ display: 'flex', gap: 8, marginBottom: 12 }}>
                  {(['pretty', 'raw', 'headers'] as const).map(view => (
                    <button
                      key={view}
                      onClick={() => setResponseView(view)}
                      style={{
                        padding: '6px 12px',
                        borderRadius: 6,
                        border: '1px solid #30363d',
                        background: responseView === view ? '#21262d' : 'transparent',
                        color: responseView === view ? '#f0f6fc' : '#8b949e',
                        cursor: 'pointer',
                        fontSize: 13,
                      }}
                    >
                      {view === 'pretty' ? '格式化' : view === 'raw' ? '原始' : '响应头'}
                    </button>
                  ))}
                  <button
                    onClick={() => navigator.clipboard.writeText(response.body)}
                    style={{
                      padding: '6px 12px',
                      borderRadius: 6,
                      border: '1px solid #30363d',
                      background: 'transparent',
                      color: '#c9d1d9',
                      cursor: 'pointer',
                      fontSize: 13,
                    }}
                  >
                    复制响应
                  </button>
                </div>

                {/* Response Content */}
                <pre style={{
                  background: '#161b22',
                  borderRadius: 12,
                  padding: 16,
                  fontSize: 13,
                  lineHeight: 1.6,
                  fontFamily: 'ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace',
                  whiteSpace: 'pre-wrap',
                  wordBreak: 'break-word',
                  maxHeight: 400,
                  overflow: 'auto',
                }}>
                  {responseView === 'pretty' 
                    ? formatJson(response.body)
                    : responseView === 'raw'
                      ? response.body
                      : Object.entries(response.headers).map(([k, v]) => `${k}: ${v}`).join('\n')}
                </pre>
              </div>
            )}

            {!response && !error && (
              <div style={{
                textAlign: 'center',
                padding: 60,
                color: '#8b949e',
              }}>
                <div style={{ fontSize: 48, marginBottom: 16 }}>📡</div>
                <p>发送请求后查看响应结果</p>
              </div>
            )}
          </div>
        )}

        {activeTab === 'history' && (
          <div>
            {history.length > 0 && (
              <button
                onClick={clearHistory}
                style={{
                  padding: '6px 12px',
                  borderRadius: 6,
                  border: '1px solid #30363d',
                  background: 'transparent',
                  color: '#f85149',
                  cursor: 'pointer',
                  fontSize: 13,
                  marginBottom: 16,
                }}
              >
                清空历史
              </button>
            )}
            {history.length === 0 ? (
              <div style={{
                textAlign: 'center',
                padding: 60,
                color: '#8b949e',
              }}>
                <div style={{ fontSize: 48, marginBottom: 16 }}>📜</div>
                <p>暂无请求历史</p>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {history.map(h => (
                  <div key={h.id} style={{
                    background: '#161b22',
                    borderRadius: 8,
                    padding: '12px 16px',
                    display: 'flex',
                    alignItems: 'center',
                    gap: 12,
                  }}>
                    <span style={{
                      background: h.status === 0 ? '#6b7280' : getStatusColor(h.status),
                      color: '#fff',
                      padding: '2px 6px',
                      borderRadius: 4,
                      fontSize: 11,
                      fontWeight: 600,
                    }}>
                      {h.method}
                    </span>
                    <span style={{ flex: 1, fontSize: 13, color: '#c9d1d9' }}>
                      {h.url}
                    </span>
                    <span style={{
                      color: h.status === 0 ? '#f85149' : getStatusColor(h.status),
                      fontSize: 13,
                      fontWeight: 600,
                    }}>
                      {h.status === 0 ? '失败' : h.status}
                    </span>
                    <span style={{ fontSize: 12, color: '#8b949e' }}>
                      {h.duration}ms
                    </span>
                    <span style={{ fontSize: 11, color: '#8b949e' }}>
                      {h.timestamp.toLocaleTimeString()}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {activeTab === 'saved' && (
          <div>
            {savedRequests.length === 0 ? (
              <div style={{
                textAlign: 'center',
                padding: 60,
                color: '#8b949e',
              }}>
                <div style={{ fontSize: 48, marginBottom: 16 }}>💾</div>
                <p>暂无保存的请求</p>
                <p style={{ fontSize: 12, marginTop: 8 }}>
                  在请求面板点击"保存"按钮保存常用请求
                </p>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                {savedRequests.map(saved => (
                  <div key={saved.id} style={{
                    background: '#161b22',
                    borderRadius: 12,
                    padding: '16px 20px',
                    display: 'flex',
                    alignItems: 'center',
                    gap: 12,
                  }}>
                    <span style={{
                      background: saved.method === 'GET' ? '#22c55e' : saved.method === 'POST' ? '#3b82f6' : '#f59e0b',
                      color: '#fff',
                      padding: '4px 8px',
                      borderRadius: 4,
                      fontSize: 12,
                      fontWeight: 600,
                    }}>
                      {saved.method}
                    </span>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontSize: 14, fontWeight: 500, color: '#c9d1d9' }}>
                        {saved.name}
                      </div>
                      <div style={{ fontSize: 12, color: '#8b949e', marginTop: 4 }}>
                        {saved.url}
                      </div>
                    </div>
                    <button
                      onClick={() => loadSavedRequest(saved)}
                      style={{
                        padding: '6px 12px',
                        borderRadius: 6,
                        border: '1px solid #30363d',
                        background: 'transparent',
                        color: '#c9d1d9',
                        cursor: 'pointer',
                        fontSize: 13,
                      }}
                    >
                      加载
                    </button>
                    <button
                      onClick={() => deleteSavedRequest(saved.id)}
                      style={{
                        padding: '6px 12px',
                        borderRadius: 6,
                        border: '1px solid #30363d',
                        background: 'transparent',
                        color: '#f85149',
                        cursor: 'pointer',
                        fontSize: 13,
                      }}
                    >
                      删除
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
})

export default APITesterPro