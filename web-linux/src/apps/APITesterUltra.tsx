import { useState, useCallback, useRef, useEffect } from 'react'
import { Play, Trash2, Copy, Download, Clock, XCircle, Send, BookOpen, Star } from 'lucide-react'

interface RequestHistory {
  id: string
  method: string
  url: string
  timestamp: number
  status: number
  duration: number
}

interface SavedRequest {
  id: string
  name: string
  method: string
  url: string
  headers: Record<string, string>
  body: string
  starred: boolean
}

const API_TEMPLATES = [
  { name: 'GitHub 用户信息', method: 'GET', url: 'https://api.github.com/users/github', headers: {} },
  { name: 'JSONPlaceholder 文章', method: 'GET', url: 'https://jsonplaceholder.typicode.com/posts/1', headers: {} },
  { name: '随机名言', method: 'GET', url: 'https://api.quotable.io/random', headers: {} },
  { name: '国家信息', method: 'GET', url: 'https://restcountries.com/v3.1/name/china', headers: {} },
  { name: '汇率查询', method: 'GET', url: 'https://api.exchangerate-api.com/v4/latest/USD', headers: {} },
  { name: 'NASA 天文图片', method: 'GET', url: 'https://api.nasa.gov/planetary/apod?api_key=DEMO_KEY', headers: {} },
]

export default function APITesterUltra() {
  const [method, setMethod] = useState('GET')
  const [url, setUrl] = useState('')
  const [headers, setHeaders] = useState<{ key: string; value: string }[]>([
    { key: 'Content-Type', value: 'application/json' }
  ])
  const [body, setBody] = useState('')
  const [response, setResponse] = useState<string | null>(null)
  const [status, setStatus] = useState<number | null>(null)
  const [duration, setDuration] = useState<number | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [activeTab, setActiveTab] = useState<'params' | 'headers' | 'body'>('headers')
  const [history, setHistory] = useState<RequestHistory[]>([])
  const [savedRequests, setSavedRequests] = useState<SavedRequest[]>([])
  const [showTemplates, setShowTemplates] = useState(false)
  
  const responseRef = useRef<HTMLDivElement>(null)

  // Load saved requests from localStorage
  useEffect(() => {
    try {
      const saved = localStorage.getItem('weblinux-api-saved')
      if (saved) {
        setSavedRequests(JSON.parse(saved))
      }
      const hist = localStorage.getItem('weblinux-api-history')
      if (hist) {
        setHistory(JSON.parse(hist))
      }
    } catch {
      // Ignore errors
    }
  }, [])

  // Save to localStorage
  useEffect(() => {
    localStorage.setItem('weblinux-api-saved', JSON.stringify(savedRequests))
  }, [savedRequests])

  useEffect(() => {
    localStorage.setItem('weblinux-api-history', JSON.stringify(history.slice(0, 50)))
  }, [history])

  const executeRequest = useCallback(async () => {
    if (!url.trim()) {
      setError('请输入 URL')
      return
    }

    setLoading(true)
    setError(null)
    setResponse(null)
    setStatus(null)
    setDuration(null)

    const startTime = performance.now()

    try {
      const headerObj: Record<string, string> = {}
      headers.forEach(h => {
        if (h.key.trim()) {
          headerObj[h.key.trim()] = h.value
        }
      })

      const options: RequestInit = {
        method,
        headers: headerObj,
        mode: 'cors',
      }

      if (method !== 'GET' && method !== 'HEAD' && body.trim()) {
        options.body = body
      }

      const res = await fetch(url, options)
      const endTime = performance.now()
      const requestDuration = Math.round(endTime - startTime)

      let data: unknown
      const contentType = res.headers.get('content-type') || ''

      if (contentType.includes('application/json')) {
        data = await res.json()
      } else if (contentType.includes('text/')) {
        data = await res.text()
      } else {
        data = await res.blob()
      }

      setStatus(res.status)
      setDuration(requestDuration)
      setResponse(contentType.includes('application/json')
        ? JSON.stringify(data, null, 2)
        : String(data))

      // Add to history
      const historyEntry: RequestHistory = {
        id: Date.now().toString(),
        method,
        url,
        timestamp: Date.now(),
        status: res.status,
        duration: requestDuration,
      }
      setHistory(prev => [historyEntry, ...prev.slice(0, 49)])
    } catch (err) {
      const endTime = performance.now()
      setDuration(Math.round(endTime - startTime))
      setError(err instanceof Error ? err.message : '请求失败')
    } finally {
      setLoading(false)
    }
  }, [url, method, headers, body])

  const addHeader = useCallback(() => {
    setHeaders(prev => [...prev, { key: '', value: '' }])
  }, [])

  const removeHeader = useCallback((index: number) => {
    setHeaders(prev => prev.filter((_, i) => i !== index))
  }, [])

  const updateHeader = useCallback((index: number, field: 'key' | 'value', value: string) => {
    setHeaders(prev => prev.map((h, i) => i === index ? { ...h, [field]: value } : h))
  }, [])

  const saveCurrentRequest = useCallback(() => {
    if (!url.trim()) return

    const headerObj: Record<string, string> = {}
    headers.forEach(h => {
      if (h.key.trim()) {
        headerObj[h.key.trim()] = h.value
      }
    })

    const saved: SavedRequest = {
      id: Date.now().toString(),
      name: url.split('/').pop() || url,
      method,
      url,
      headers: headerObj,
      body,
      starred: false,
    }
    setSavedRequests(prev => [saved, ...prev])
  }, [url, method, headers, body])

  const loadRequest = useCallback((req: SavedRequest | typeof API_TEMPLATES[0]) => {
    setMethod(req.method)
    setUrl(req.url)
    if ('headers' in req && Object.keys(req.headers).length > 0) {
      setHeaders(Object.entries(req.headers).map(([key, value]) => ({ key, value: String(value) })))
    }
    if ('body' in req && req.body) {
      setBody(req.body)
    }
    setShowTemplates(false)
  }, [])

  const copyResponse = useCallback(() => {
    if (response) {
      navigator.clipboard.writeText(response)
    }
  }, [response])

  const downloadResponse = useCallback(() => {
    if (!response) return
    const blob = new Blob([response], { type: 'application/json' })
    const a = document.createElement('a')
    a.href = URL.createObjectURL(blob)
    a.download = `response-${Date.now()}.json`
    a.click()
  }, [response])

  const getStatusColor = (s: number) => {
    if (s >= 200 && s < 300) return 'var(--success)'
    if (s >= 300 && s < 400) return 'var(--accent)'
    if (s >= 400 && s < 500) return 'var(--warning)'
    return 'var(--error)'
  }

  const methods = ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'HEAD', 'OPTIONS']

  return (
    <div style={{
      height: '100%',
      display: 'flex',
      flexDirection: 'column',
      background: 'var(--window-bg)',
      color: 'var(--text-primary)',
      overflow: 'hidden',
    }}>
      {/* Header */}
      <div style={{
        padding: '12px 16px',
        borderBottom: '1px solid var(--window-border)',
        display: 'flex',
        alignItems: 'center',
        gap: '12px',
        background: 'var(--window-header-bg)',
      }}>
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
        }}>
          <select
            value={method}
            onChange={(e) => setMethod(e.target.value)}
            style={{
              padding: '8px 12px',
              borderRadius: '6px',
              border: '1px solid var(--window-border)',
              background: method === 'GET' ? '#22c55e' :
                         method === 'POST' ? '#3b82f6' :
                         method === 'PUT' ? '#f59e0b' :
                         method === 'DELETE' ? '#ef4444' : '#8b5cf6',
              color: 'white',
              fontWeight: '600',
              fontSize: '12px',
              cursor: 'pointer',
            }}
          >
            {methods.map(m => (
              <option key={m} value={m} style={{ background: 'var(--window-bg)', color: 'var(--text-primary)' }}>
                {m}
              </option>
            ))}
          </select>
        </div>

        <input
          type="text"
          value={url}
          onChange={(e) => setUrl(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && executeRequest()}
          placeholder="输入 API URL (支持 CORS 的公开 API)"
          style={{
            flex: 1,
            padding: '8px 12px',
            borderRadius: '6px',
            border: '1px solid var(--window-border)',
            background: 'var(--window-bg)',
            color: 'var(--text-primary)',
            fontSize: '13px',
          }}
        />

        <button
          onClick={executeRequest}
          disabled={loading}
          style={{
            padding: '8px 16px',
            borderRadius: '6px',
            border: 'none',
            background: 'var(--accent)',
            color: 'white',
            fontWeight: '600',
            cursor: loading ? 'not-allowed' : 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            opacity: loading ? 0.6 : 1,
          }}
        >
          <Send size={14} />
          {loading ? '请求中...' : '发送'}
        </button>

        <button
          onClick={() => setShowTemplates(!showTemplates)}
          title="API 模板库"
          style={{
            padding: '8px 12px',
            borderRadius: '6px',
            border: '1px solid var(--window-border)',
            background: 'var(--window-bg)',
            color: 'var(--text-primary)',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '4px',
          }}
        >
          <BookOpen size={14} />
          模板
        </button>

        <button
          onClick={saveCurrentRequest}
          title="保存请求"
          style={{
            padding: '8px 12px',
            borderRadius: '6px',
            border: '1px solid var(--window-border)',
            background: 'var(--window-bg)',
            color: 'var(--text-primary)',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '4px',
          }}
        >
          <Star size={14} />
          保存
        </button>
      </div>

      {/* Templates Panel */}
      {showTemplates && (
        <div style={{
          padding: '12px 16px',
          background: 'var(--window-header-bg)',
          borderBottom: '1px solid var(--window-border)',
        }}>
          <div style={{ fontSize: '12px', color: 'var(--text-secondary)', marginBottom: '8px' }}>
            选择预设 API 模板（均为公开 CORS API，可直接调用）
          </div>
          <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
            {API_TEMPLATES.map((t, i) => (
              <button
                key={i}
                onClick={() => loadRequest(t)}
                style={{
                  padding: '6px 12px',
                  borderRadius: '6px',
                  border: '1px solid var(--window-border)',
                  background: 'var(--window-bg)',
                  color: 'var(--text-primary)',
                  cursor: 'pointer',
                  fontSize: '12px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '4px',
                }}
              >
                <span style={{
                  padding: '2px 6px',
                  borderRadius: '3px',
                  background: '#22c55e',
                  color: 'white',
                  fontSize: '10px',
                  fontWeight: '600',
                }}>
                  {t.method}
                </span>
                {t.name}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Main Content */}
      <div style={{ flex: 1, display: 'flex', overflow: 'hidden' }}>
        {/* Left Panel - Request */}
        <div style={{
          flex: 1,
          display: 'flex',
          flexDirection: 'column',
          borderRight: '1px solid var(--window-border)',
        }}>
          {/* Tabs */}
          <div style={{
            display: 'flex',
            borderBottom: '1px solid var(--window-border)',
          }}>
            {(['headers', 'body'] as const).map(tab => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                style={{
                  padding: '10px 16px',
                  border: 'none',
                  borderBottom: activeTab === tab ? '2px solid var(--accent)' : '2px solid transparent',
                  background: 'transparent',
                  color: activeTab === tab ? 'var(--text-primary)' : 'var(--text-secondary)',
                  cursor: 'pointer',
                  fontSize: '13px',
                  fontWeight: activeTab === tab ? '600' : '400',
                  transition: 'all 0.2s',
                }}
              >
                {tab === 'headers' ? '请求头' : '请求体'}
              </button>
            ))}
          </div>

          {/* Tab Content */}
          <div style={{ flex: 1, overflow: 'auto', padding: '12px' }}>
            {activeTab === 'headers' && (
              <div>
                <div style={{ marginBottom: '8px', display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>HTTP Headers</span>
                  <button
                    onClick={addHeader}
                    style={{
                      padding: '4px 8px',
                      fontSize: '11px',
                      border: '1px solid var(--window-border)',
                      background: 'var(--window-bg)',
                      color: 'var(--text-primary)',
                      borderRadius: '4px',
                      cursor: 'pointer',
                    }}
                  >
                    + 添加
                  </button>
                </div>
                {headers.map((h, i) => (
                  <div key={i} style={{ display: 'flex', gap: '8px', marginBottom: '8px' }}>
                    <input
                      type="text"
                      value={h.key}
                      onChange={(e) => updateHeader(i, 'key', e.target.value)}
                      placeholder="Header Name"
                      style={{
                        flex: 1,
                        padding: '8px',
                        borderRadius: '4px',
                        border: '1px solid var(--window-border)',
                        background: 'var(--window-bg)',
                        color: 'var(--text-primary)',
                        fontSize: '12px',
                      }}
                    />
                    <input
                      type="text"
                      value={h.value}
                      onChange={(e) => updateHeader(i, 'value', e.target.value)}
                      placeholder="Value"
                      style={{
                        flex: 1,
                        padding: '8px',
                        borderRadius: '4px',
                        border: '1px solid var(--window-border)',
                        background: 'var(--window-bg)',
                        color: 'var(--text-primary)',
                        fontSize: '12px',
                      }}
                    />
                    <button
                      onClick={() => removeHeader(i)}
                      style={{
                        padding: '8px',
                        border: '1px solid var(--window-border)',
                        background: 'var(--window-bg)',
                        color: 'var(--error)',
                        borderRadius: '4px',
                        cursor: 'pointer',
                      }}
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                ))}
              </div>
            )}

            {activeTab === 'body' && (
              <div>
                <div style={{ marginBottom: '8px', fontSize: '12px', color: 'var(--text-secondary)' }}>
                  Request Body (JSON)
                </div>
                <textarea
                  value={body}
                  onChange={(e) => setBody(e.target.value)}
                  placeholder='{"key": "value"}'
                  style={{
                    width: '100%',
                    height: '200px',
                    padding: '12px',
                    borderRadius: '6px',
                    border: '1px solid var(--window-border)',
                    background: 'var(--window-bg)',
                    color: 'var(--text-primary)',
                    fontSize: '12px',
                    fontFamily: 'JetBrains Mono, monospace',
                    resize: 'vertical',
                  }}
                />
              </div>
            )}
          </div>

          {/* Saved Requests */}
          {savedRequests.length > 0 && (
            <div style={{
              borderTop: '1px solid var(--window-border)',
              padding: '12px',
              maxHeight: '150px',
              overflow: 'auto',
            }}>
              <div style={{ fontSize: '12px', color: 'var(--text-secondary)', marginBottom: '8px' }}>
                已保存的请求 ({savedRequests.length})
              </div>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                {savedRequests.map(req => (
                  <button
                    key={req.id}
                    onClick={() => loadRequest(req)}
                    style={{
                      padding: '4px 8px',
                      fontSize: '11px',
                      border: '1px solid var(--window-border)',
                      background: 'var(--window-bg)',
                      color: 'var(--text-primary)',
                      borderRadius: '4px',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '4px',
                    }}
                  >
                    <span style={{
                      padding: '1px 4px',
                      borderRadius: '2px',
                      background: req.method === 'GET' ? '#22c55e' :
                                 req.method === 'POST' ? '#3b82f6' : '#8b5cf6',
                      color: 'white',
                      fontSize: '9px',
                      fontWeight: '600',
                    }}>
                      {req.method}
                    </span>
                    {req.name}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Right Panel - Response */}
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
          {/* Response Header */}
          <div style={{
            padding: '10px 16px',
            borderBottom: '1px solid var(--window-border)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <span style={{ fontSize: '13px', fontWeight: '600' }}>响应</span>
              {status && (
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <span style={{
                    padding: '3px 8px',
                    borderRadius: '4px',
                    background: getStatusColor(status),
                    color: 'white',
                    fontSize: '11px',
                    fontWeight: '600',
                  }}>
                    {status}
                  </span>
                  {duration && (
                    <span style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '4px',
                      fontSize: '11px',
                      color: 'var(--text-secondary)',
                    }}>
                      <Clock size={12} />
                      {duration}ms
                    </span>
                  )}
                </div>
              )}
            </div>
            {response && (
              <div style={{ display: 'flex', gap: '6px' }}>
                <button
                  onClick={copyResponse}
                  title="复制响应"
                  style={{
                    padding: '4px 8px',
                    fontSize: '11px',
                    border: '1px solid var(--window-border)',
                    background: 'var(--window-bg)',
                    color: 'var(--text-primary)',
                    borderRadius: '4px',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '4px',
                  }}
                >
                  <Copy size={12} />
                  复制
                </button>
                <button
                  onClick={downloadResponse}
                  title="下载响应"
                  style={{
                    padding: '4px 8px',
                    fontSize: '11px',
                    border: '1px solid var(--window-border)',
                    background: 'var(--window-bg)',
                    color: 'var(--text-primary)',
                    borderRadius: '4px',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '4px',
                  }}
                >
                  <Download size={12} />
                  下载
                </button>
              </div>
            )}
          </div>

          {/* Response Content */}
          <div
            ref={responseRef}
            style={{
              flex: 1,
              overflow: 'auto',
              padding: '12px',
              fontFamily: 'JetBrains Mono, monospace',
              fontSize: '12px',
              whiteSpace: 'pre-wrap',
              wordBreak: 'break-word',
            }}
          >
            {loading && (
              <div style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                height: '100%',
                color: 'var(--text-secondary)',
              }}>
                <div style={{ textAlign: 'center' }}>
                  <div style={{
                    width: '40px',
                    height: '40px',
                    border: '3px solid var(--window-border)',
                    borderTopColor: 'var(--accent)',
                    borderRadius: '50%',
                    animation: 'spin 1s linear infinite',
                    margin: '0 auto 12px',
                  }} />
                  <div>请求中...</div>
                </div>
              </div>
            )}

            {error && (
              <div style={{
                padding: '12px',
                background: 'rgba(239, 68, 68, 0.1)',
                border: '1px solid rgba(239, 68, 68, 0.3)',
                borderRadius: '6px',
                color: 'var(--error)',
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
              }}>
                <XCircle size={16} />
                <div>
                  <div style={{ fontWeight: '600' }}>请求失败</div>
                  <div style={{ fontSize: '11px', marginTop: '4px' }}>{error}</div>
                </div>
              </div>
            )}

            {!loading && !error && !response && (
              <div style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                height: '100%',
                color: 'var(--text-secondary)',
                textAlign: 'center',
              }}>
                <div>
                  <Play size={32} style={{ opacity: 0.3, marginBottom: '12px' }} />
                  <div>输入 URL 并点击"发送"</div>
                  <div style={{ fontSize: '11px', marginTop: '4px', opacity: 0.7 }}>
                    支持所有公开 CORS API
                  </div>
                </div>
              </div>
            )}

            {response && !loading && (
              <pre style={{ margin: 0 }}>{response}</pre>
            )}
          </div>
        </div>
      </div>

      {/* History Panel */}
      {history.length > 0 && (
        <div style={{
          borderTop: '1px solid var(--window-border)',
          padding: '8px 16px',
          maxHeight: '80px',
          overflow: 'auto',
          background: 'var(--window-header-bg)',
        }}>
          <div style={{ fontSize: '11px', color: 'var(--text-secondary)', marginBottom: '6px' }}>
            请求历史 ({history.length})
          </div>
          <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
            {history.slice(0, 10).map(h => (
              <div
                key={h.id}
                style={{
                  padding: '4px 8px',
                  fontSize: '10px',
                  background: 'var(--window-bg)',
                  border: '1px solid var(--window-border)',
                  borderRadius: '4px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '4px',
                }}
              >
                <span style={{
                  padding: '1px 3px',
                  borderRadius: '2px',
                  background: h.method === 'GET' ? '#22c55e' : '#3b82f6',
                  color: 'white',
                  fontSize: '9px',
                }}>
                  {h.method}
                </span>
                <span style={{ maxWidth: '80px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {h.url.split('/').pop()}
                </span>
                <span style={{
                  color: getStatusColor(h.status),
                }}>
                  {h.status}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      <style>{`
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  )
}