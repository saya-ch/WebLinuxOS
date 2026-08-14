import { useState, useCallback, useEffect, useRef, type CSSProperties } from 'react'
import {
  Send, Trash2, Copy, History, Star,
  X, Plus, Clock,
  Zap, Globe, Code, FileJson, Eye, EyeOff,
  Maximize2, Minimize2, RotateCw, Filter
} from 'lucide-react'

interface HistoryItem {
  id: string
  method: string
  url: string
  time: Date
  status?: number
  responseTime?: number
  duration: number
}

interface Header {
  id: string
  key: string
  value: string
  enabled: boolean
}

interface ResponseData {
  status: number
  statusText: string
  headers: Record<string, string>
  body: string
  contentType: string
  responseTime: number
  size: number
}

type TabType = 'headers' | 'body' | 'params' | 'auth'
type ResponseTab = 'body' | 'headers' | 'preview'

const HTTP_METHODS = ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'HEAD', 'OPTIONS']

const PRESET_HEADERS: Header[] = [
  { id: '1', key: 'Content-Type', value: 'application/json', enabled: true },
  { id: '2', key: 'Accept', value: 'application/json', enabled: true },
]

const PRESET_TEMPLATES = [
  { name: 'GitHub API', url: 'https://api.github.com/repos/saya-ch/WebLinuxOS', method: 'GET' },
  { name: 'Open-Meteo Weather', url: 'https://api.open-meteo.com/v1/forecast?latitude=39.9&longitude=116.4&current=temperature_2m', method: 'GET' },
  { name: 'JSON Placeholder', url: 'https://jsonplaceholder.typicode.com/posts/1', method: 'GET' },
  { name: 'Post Example', url: 'https://httpbin.org/post', method: 'POST', body: '{"name": "WebLinuxOS"}' },
]

function generateId() {
  return Math.random().toString(36).substring(2, 9)
}

export default function RealHTTPClient() {
  const [method, setMethod] = useState('GET')
  const [url, setUrl] = useState('https://api.github.com/repos/saya-ch/WebLinuxOS')
  const [headers, setHeaders] = useState<Header[]>(PRESET_HEADERS)
  const [body, setBody] = useState('')
  const [activeTab, setActiveTab] = useState<TabType>('headers')
  const [responseTab, setResponseTab] = useState<ResponseTab>('body')
  const [response, setResponse] = useState<ResponseData | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [history, setHistory] = useState<HistoryItem[]>([])
  const [favorites, setFavorites] = useState<HistoryItem[]>([])
  const [showHistory, setShowHistory] = useState(false)
  const [showFavorites, setShowFavorites] = useState(false)
  const [responseSize, setResponseSize] = useState<'normal' | 'large'>('normal')
  const [autoFormat, setAutoFormat] = useState(true)
  const abortControllerRef = useRef<AbortController | null>(null)

  useEffect(() => {
    const saved = localStorage.getItem('weblinux-http-client-history')
    if (saved) {
      try { setHistory(JSON.parse(saved)) } catch {}
    }
    const favSaved = localStorage.getItem('weblinux-http-client-favorites')
    if (favSaved) {
      try { setFavorites(JSON.parse(favSaved)) } catch {}
    }
  }, [])

  useEffect(() => {
    localStorage.setItem('weblinux-http-client-history', JSON.stringify(history.slice(0, 50)))
  }, [history])

  useEffect(() => {
    localStorage.setItem('weblinux-http-client-favorites', JSON.stringify(favorites))
  }, [favorites])

  const updateHeader = useCallback((id: string, field: 'key' | 'value' | 'enabled', value: string | boolean) => {
    setHeaders(prev => prev.map(h => h.id === id ? { ...h, [field]: value } : h))
  }, [])

  const addHeader = useCallback(() => {
    setHeaders(prev => [...prev, { id: generateId(), key: '', value: '', enabled: true }])
  }, [])

  const removeHeader = useCallback((id: string) => {
    setHeaders(prev => prev.filter(h => h.id !== id))
  }, [])

  const formatBody = useCallback(() => {
    try {
      if (body.trim().startsWith('{') || body.trim().startsWith('[')) {
        setBody(JSON.stringify(JSON.parse(body), null, 2))
      }
    } catch {}
  }, [body])

  const parseResponseHeaders = (headers: Headers): Record<string, string> => {
    const result: Record<string, string> = {}
    headers.forEach((value, key) => {
      result[key] = value
    })
    return result
  }

  const sendRequest = useCallback(async () => {
    if (!url.trim()) return
    setLoading(true)
    setError(null)
    setResponse(null)

    if (abortControllerRef.current) {
      abortControllerRef.current.abort()
    }
    abortControllerRef.current = new AbortController()

    const startTime = performance.now()

    try {
      const headerObj: Record<string, string> = {}
      headers.filter(h => h.enabled && h.key.trim()).forEach(h => {
        headerObj[h.key.trim()] = h.value
      })

      const fetchOptions: RequestInit = {
        method,
        headers: headerObj,
        signal: abortControllerRef.current.signal,
      }

      if (method !== 'GET' && method !== 'HEAD' && body.trim()) {
        fetchOptions.body = body
      }

      const response = await fetch(url.trim(), fetchOptions)
      const responseTime = Math.round(performance.now() - startTime)

      const text = await response.text()
      const contentType = response.headers.get('content-type') || ''

      setResponse({
        status: response.status,
        statusText: response.statusText,
        headers: parseResponseHeaders(response.headers),
        body: text,
        contentType,
        responseTime,
        size: new Blob([text]).size,
      })

      setHistory(prev => [{
        id: generateId(),
        method,
        url,
        time: new Date(),
        status: response.status,
        responseTime,
        duration: responseTime,
      }, ...prev.filter(h => h.url !== url)].slice(0, 50))

    } catch (err) {
      if ((err as Error).name === 'AbortError') {
        setError('请求已取消')
      } else {
        setError((err as Error).message || '请求失败，请检查网络连接和URL')
      }
    } finally {
      setLoading(false)
    }
  }, [method, url, headers, body])

  const cancelRequest = useCallback(() => {
    abortControllerRef.current?.abort()
  }, [])

  const addToFavorites = useCallback(() => {
    const item: HistoryItem = {
      id: generateId(),
      method,
      url,
      time: new Date(),
      duration: 0,
    }
    if (!favorites.some(f => f.url === url && f.method === method)) {
      setFavorites(prev => [item, ...prev])
    }
  }, [method, url, favorites])

  const isFavorite = favorites.some(f => f.url === url && f.method === method)

  const loadFromHistory = (item: HistoryItem) => {
    setMethod(item.method)
    setUrl(item.url)
    setShowHistory(false)
  }

  const applyTemplate = (template: typeof PRESET_TEMPLATES[0]) => {
    setMethod(template.method)
    setUrl(template.url)
    if ('body' in template && template.body) {
      setBody(template.body)
      setActiveTab('body')
    }
  }

  const formatResponseBody = (): string => {
    if (!response?.body) return ''
    if (!autoFormat) return response.body
    try {
      if (response.contentType.includes('json') || response.body.trim().startsWith('{') || response.body.trim().startsWith('[')) {
        return JSON.stringify(JSON.parse(response.body), null, 2)
      }
    } catch {}
    return response.body
  }

  const getStatusColor = (status: number) => {
    if (status >= 200 && status < 300) return '#10b981'
    if (status >= 300 && status < 400) return '#f59e0b'
    if (status >= 400) return '#ef4444'
    return '#6b7280'
  }

  const formatSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
    return `${(bytes / 1024 / 1024).toFixed(2)} MB`
  }

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text)
  }

  return (
    <div style={{
      width: '100%', height: '100%', display: 'flex', flexDirection: 'column',
      background: 'var(--bg-primary, #1a1a2e)', color: 'var(--text-primary, #fff)',
      fontFamily: 'system-ui, -apple-system, sans-serif', fontSize: 13
    }}>
      {/* Header */}
      <div style={{
        padding: '12px 16px', borderBottom: '1px solid var(--border-color, #333)',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        background: 'var(--bg-secondary, #16213e)'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <Zap size={20} color="#7c6cf0" />
          <span style={{ fontWeight: 600, fontSize: 15 }}>HTTP 客户端 Pro</span>
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          <button onClick={() => setShowHistory(!showHistory)} style={iconBtnStyle(showHistory)} title="历史记录">
            <History size={16} />
          </button>
          <button onClick={() => setShowFavorites(!showFavorites)} style={iconBtnStyle(showFavorites)} title="收藏">
            <Star size={16} />
          </button>
          <button onClick={() => setResponseSize(responseSize === 'normal' ? 'large' : 'normal')} style={iconBtnStyle()} title="调整大小">
            {responseSize === 'normal' ? <Maximize2 size={16} /> : <Minimize2 size={16} />}
          </button>
        </div>
      </div>

      <div style={{ display: 'flex', flex: 1, overflow: 'hidden' }}>
        {/* Left Sidebar - History/Favorites */}
        {(showHistory || showFavorites) && (
          <div style={{
            width: 280, borderRight: '1px solid var(--border-color, #333)',
            display: 'flex', flexDirection: 'column', background: 'var(--bg-secondary, #16213e)'
          }}>
            <div style={{
              padding: '10px 12px', borderBottom: '1px solid var(--border-color, #333)',
              display: 'flex', alignItems: 'center', justifyContent: 'space-between'
            }}>
              <span style={{ fontWeight: 500 }}>{showHistory ? '历史记录' : '收藏夹'}</span>
              <button onClick={() => showHistory ? setShowHistory(false) : setShowFavorites(false)} style={iconBtnStyle()}>
                <X size={14} />
              </button>
            </div>
            <div style={{ flex: 1, overflowY: 'auto', padding: '8px' }}>
              {(showHistory ? history : favorites).length === 0 ? (
                <div style={{ color: 'var(--text-secondary, #888)', textAlign: 'center', padding: 20 }}>
                  暂无记录
                </div>
              ) : (
                (showHistory ? history : favorites).map(item => (
                  <button key={item.id} onClick={() => loadFromHistory(item)} style={{
                    display: 'block', width: '100%', padding: '8px', marginBottom: 4,
                    background: 'var(--bg-hover, #2a2a3e)', border: 'none', borderRadius: 6,
                    color: 'inherit', textAlign: 'left', cursor: 'pointer', fontSize: 12
                  }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                      <span style={{
                        padding: '2px 6px', borderRadius: 4, fontSize: 10,
                        background: item.status ? getStatusColor(item.status) + '33' : '#333',
                        color: item.status ? getStatusColor(item.status) : '#888',
                        fontWeight: 600
                      }}>{item.method}</span>
                      <span style={{ flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {item.url.replace('https://', '').replace('http://', '')}
                      </span>
                    </div>
                    <div style={{ fontSize: 10, color: 'var(--text-secondary, #888)', marginTop: 2 }}>
                      {item.status ? `${item.status} · ` : ''}{item.duration}ms · {new Date(item.time).toLocaleTimeString()}
                    </div>
                  </button>
                ))
              )}
            </div>
          </div>
        )}

        {/* Main Content */}
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'auto' }}>
          {/* Request Section */}
          <div style={{ padding: 16, borderBottom: '1px solid var(--border-color, #333)' }}>
            <div style={{ display: 'flex', gap: 8, marginBottom: 12 }}>
              {/* Method Selector */}
              <select value={method} onChange={(e) => setMethod(e.target.value)} style={{
                padding: '8px 12px', borderRadius: 6, border: '1px solid var(--border-color, #555)',
                background: 'var(--bg-hover, #2a2a3e)', color: '#fff', fontWeight: 600,
                cursor: 'pointer', minWidth: 90
              }}>
                {HTTP_METHODS.map(m => <option key={m} value={m}>{m}</option>)}
              </select>

              {/* URL Input */}
              <input value={url} onChange={(e) => setUrl(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && sendRequest()}
                placeholder="输入请求URL..."
                style={{
                  flex: 1, padding: '8px 12px', borderRadius: 6, border: '1px solid var(--border-color, #555)',
                  background: 'var(--bg-hover, #2a2a3e)', color: '#fff', outline: 'none'
                }} />

              {/* Send Button */}
              {loading ? (
                <button onClick={cancelRequest} style={{
                  padding: '8px 20px', borderRadius: 6, border: 'none',
                  background: '#ef4444', color: '#fff', cursor: 'pointer', fontWeight: 600,
                  display: 'flex', alignItems: 'center', gap: 6
                }}>
                  <X size={14} /> 取消
                </button>
              ) : (
                <button onClick={sendRequest} style={{
                  padding: '8px 20px', borderRadius: 6, border: 'none',
                  background: 'linear-gradient(135deg, #7c6cf0 0%, #5b4cd8 100%)',
                  color: '#fff', cursor: 'pointer', fontWeight: 600,
                  display: 'flex', alignItems: 'center', gap: 6
                }}>
                  <Send size={14} /> 发送
                </button>
              )}

              <button onClick={addToFavorites} disabled={isFavorite} style={{
                padding: '8px 12px', borderRadius: 6, border: '1px solid var(--border-color, #555)',
                background: 'var(--bg-hover, #2a2a3e)', color: isFavorite ? '#f59e0b' : '#888',
                cursor: isFavorite ? 'default' : 'pointer'
              }} title={isFavorite ? '已收藏' : '添加到收藏'}>
                <Star size={16} fill={isFavorite ? '#f59e0b' : 'none'} />
              </button>
            </div>

            {/* Preset Templates */}
            <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 12 }}>
              <span style={{ fontSize: 11, color: 'var(--text-secondary, #888)', alignSelf: 'center', marginRight: 4 }}>快速模板:</span>
              {PRESET_TEMPLATES.map(template => (
                <button key={template.name} onClick={() => applyTemplate(template)} style={{
                  padding: '4px 10px', borderRadius: 12, border: '1px solid var(--border-color, #555)',
                  background: 'transparent', color: '#888', cursor: 'pointer', fontSize: 11
                }}>
                  {template.name}
                </button>
              ))}
            </div>

            {/* Tabs */}
            <div style={{ display: 'flex', gap: 4, borderBottom: '1px solid var(--border-color, #333)' }}>
              {(['params', 'headers', 'body'] as TabType[]).map(tab => (
                <button key={tab} onClick={() => setActiveTab(tab)} style={{
                  padding: '8px 16px', background: 'transparent', border: 'none',
                  borderBottom: activeTab === tab ? '2px solid #7c6cf0' : '2px solid transparent',
                  color: activeTab === tab ? '#fff' : '#888',
                  cursor: 'pointer', fontWeight: 500
                }}>
                  {tab === 'params' ? '参数' : tab === 'headers' ? '请求头' : '请求体'}
                  {tab === 'headers' && headers.filter(h => h.enabled).length > 0 && (
                    <span style={{ marginLeft: 4, padding: '0 6px', background: '#7c6cf0', borderRadius: 10, fontSize: 10 }}>
                      {headers.filter(h => h.enabled).length}
                    </span>
                  )}
                </button>
              ))}
            </div>

            {/* Tab Content */}
            <div style={{ padding: '12px 0' }}>
              {activeTab === 'params' && (
                <div style={{ color: 'var(--text-secondary, #888)', textAlign: 'center', padding: 20 }}>
                  <Filter size={24} style={{ marginBottom: 8 }} />
                  <div>URL参数会自动从请求URL中解析和发送</div>
                </div>
              )}

              {activeTab === 'headers' && (
                <div>
                  {headers.map((header, idx) => (
                    <div key={header.id} style={{ display: 'flex', gap: 8, marginBottom: 8, alignItems: 'center' }}>
                      <input type="checkbox" checked={header.enabled}
                        onChange={(e) => updateHeader(header.id, 'enabled', e.target.checked)}
                        style={{ width: 16, height: 16 }} />
                      <input value={header.key} onChange={(e) => updateHeader(header.id, 'key', e.target.value)}
                        placeholder="Header名称"
                        style={{
                          flex: 1, padding: '6px 10px', borderRadius: 4,
                          border: '1px solid var(--border-color, #555)',
                          background: 'var(--bg-hover, #2a2a3e)', color: '#fff'
                        }} />
                      <input value={header.value} onChange={(e) => updateHeader(header.id, 'value', e.target.value)}
                        placeholder="Header值"
                        style={{
                          flex: 2, padding: '6px 10px', borderRadius: 4,
                          border: '1px solid var(--border-color, #555)',
                          background: 'var(--bg-hover, #2a2a3e)', color: '#fff'
                        }} />
                      {idx > 1 && (
                        <button onClick={() => removeHeader(header.id)} style={iconBtnStyle()}>
                          <Trash2 size={14} />
                        </button>
                      )}
                    </div>
                  ))}
                  <button onClick={addHeader} style={{
                    padding: '6px 12px', borderRadius: 4, border: '1px dashed var(--border-color, #555)',
                    background: 'transparent', color: '#888', cursor: 'pointer',
                    display: 'flex', alignItems: 'center', gap: 4, fontSize: 12
                  }}>
                    <Plus size={14} /> 添加Header
                  </button>
                </div>
              )}

              {activeTab === 'body' && (
                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
                    <span style={{ fontSize: 12, color: 'var(--text-secondary, #888)' }}>
                      {method === 'GET' || method === 'HEAD' ? 'GET/HEAD请求通常没有请求体' : '请求体内容 (支持JSON/XML/文本)'}
                    </span>
                    <button onClick={formatBody} style={{
                      padding: '4px 10px', borderRadius: 4, border: '1px solid var(--border-color, #555)',
                      background: 'var(--bg-hover, #2a2a3e)', color: '#888',
                      cursor: 'pointer', fontSize: 11, display: 'flex', alignItems: 'center', gap: 4
                    }}>
                      <Code size={12} /> 格式化JSON
                    </button>
                  </div>
                  <textarea value={body} onChange={(e) => setBody(e.target.value)}
                    disabled={method === 'GET' || method === 'HEAD'}
                    placeholder={method === 'GET' || method === 'HEAD' ? '此方法通常没有请求体' : '{"key": "value"}'}
                    style={{
                      width: '100%', minHeight: 120, padding: '10px', borderRadius: 6,
                      border: '1px solid var(--border-color, #555)',
                      background: 'var(--bg-hover, #2a2a3e)', color: '#fff',
                      fontFamily: 'monospace', fontSize: 12, resize: 'vertical',
                      opacity: method === 'GET' || method === 'HEAD' ? 0.5 : 1
                    }} />
                </div>
              )}
            </div>
          </div>

          {/* Response Section */}
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', padding: 16, overflow: 'auto' }}>
            {error && (
              <div style={{
                padding: '12px 16px', borderRadius: 8, marginBottom: 16,
                background: 'rgba(239, 68, 68, 0.1)', border: '1px solid rgba(239, 68, 68, 0.3)',
                color: '#ef4444'
              }}>
                <div style={{ fontWeight: 600, marginBottom: 4 }}>请求错误</div>
                <div style={{ fontSize: 12 }}>{error}</div>
              </div>
            )}

            {response && (
              <div>
                {/* Response Status */}
                <div style={{
                  display: 'flex', gap: 16, marginBottom: 16,
                  padding: '12px 16px', borderRadius: 8,
                  background: 'var(--bg-secondary, #16213e)'
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <div style={{
                      width: 8, height: 8, borderRadius: '50%',
                      background: getStatusColor(response.status)
                    }} />
                    <span style={{ fontWeight: 700, fontSize: 16, color: getStatusColor(response.status) }}>
                      {response.status}
                    </span>
                    <span style={{ color: 'var(--text-secondary, #888)' }}>{response.statusText}</span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6, color: 'var(--text-secondary, #888)' }}>
                    <Clock size={14} />
                    <span>{response.responseTime}ms</span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6, color: 'var(--text-secondary, #888)' }}>
                    <FileJson size={14} />
                    <span>{formatSize(response.size)}</span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6, color: 'var(--text-secondary, #888)' }}>
                    <Globe size={14} />
                    <span>{response.contentType.split(';')[0]}</span>
                  </div>
                </div>

                {/* Response Tabs */}
                <div style={{ display: 'flex', gap: 4, borderBottom: '1px solid var(--border-color, #333)' }}>
                  {(['body', 'headers'] as ResponseTab[]).map(tab => (
                    <button key={tab} onClick={() => setResponseTab(tab)} style={{
                      padding: '8px 16px', background: 'transparent', border: 'none',
                      borderBottom: responseTab === tab ? '2px solid #10b981' : '2px solid transparent',
                      color: responseTab === tab ? '#fff' : '#888',
                      cursor: 'pointer', fontWeight: 500
                    }}>
                      {tab === 'body' ? '响应体' : '响应头'}
                    </button>
                  ))}
                  <div style={{ marginLeft: 'auto', display: 'flex', gap: 8 }}>
                    <button onClick={() => copyToClipboard(response.body)} style={iconBtnStyle()}>
                      <Copy size={14} />
                    </button>
                    <button onClick={() => setResponseSize(responseSize === 'normal' ? 'large' : 'normal')} style={iconBtnStyle()}>
                      {responseSize === 'normal' ? <Maximize2 size={14} /> : <Minimize2 size={14} />}
                    </button>
                    <button onClick={() => setAutoFormat(!autoFormat)} style={iconBtnStyle(autoFormat)} title="自动格式化">
                      {autoFormat ? <Eye size={14} /> : <EyeOff size={14} />}
                    </button>
                  </div>
                </div>

                {/* Response Content */}
                <div style={{
                  marginTop: 12,
                  height: responseSize === 'large' ? 500 : 300,
                  overflow: 'auto', padding: 12, borderRadius: 6,
                  background: 'var(--bg-hover, #2a2a3e)',
                  fontFamily: 'monospace', fontSize: 12, lineHeight: 1.6
                }}>
                  {responseTab === 'body' ? (
                    <pre style={{ margin: 0, whiteSpace: 'pre-wrap', wordBreak: 'break-all' }}>
                      {formatResponseBody()}
                    </pre>
                  ) : (
                    Object.entries(response.headers).map(([key, value]) => (
                      <div key={key} style={{ display: 'flex', marginBottom: 4 }}>
                        <span style={{ color: '#7c6cf0', minWidth: 150 }}>{key}:</span>
                        <span style={{ color: '#fff' }}>{value}</span>
                      </div>
                    ))
                  )}
                </div>
              </div>
            )}

            {!response && !error && !loading && (
              <div style={{ color: 'var(--text-secondary, #888)', textAlign: 'center', padding: 60 }}>
                <Globe size={48} style={{ marginBottom: 16, opacity: 0.5 }} />
                <div style={{ fontSize: 16, marginBottom: 8 }}>还没有请求</div>
                <div style={{ fontSize: 13 }}>输入URL并点击"发送"按钮开始</div>
              </div>
            )}

            {loading && (
              <div style={{ color: 'var(--text-secondary, #888)', textAlign: 'center', padding: 60 }}>
                <RotateCw size={32} style={{ marginBottom: 16, animation: 'spin 1s linear infinite' }} />
                <div>正在发送请求...</div>
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

function iconBtnStyle(active?: boolean): CSSProperties {
  return {
    padding: '6px 8px',
    borderRadius: 4,
    border: '1px solid ' + (active ? '#7c6cf0' : 'var(--border-color, #555)'),
    background: active ? 'rgba(124, 108, 192, 0.2)' : 'transparent',
    color: active ? '#7c6cf0' : '#888',
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  }
}
