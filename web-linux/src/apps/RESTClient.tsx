import { useState, useEffect, useCallback, useRef } from 'react'
import { Send, Clock, Save, Trash2, Globe, AlertCircle, CheckCircle, Copy, Download } from 'lucide-react'

type HttpMethod = 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH' | 'HEAD' | 'OPTIONS'

interface RequestEntry {
  id: string
  name: string
  method: HttpMethod
  url: string
  headers: string
  body: string
  useCorsProxy: boolean
  timestamp: number
}

interface ResponseData {
  status: number
  statusText: string
  headers: Record<string, string>
  body: string
  time: number
  ok: boolean
}

const STORAGE_KEY = 'weblinux-rest-client'
const HISTORY_KEY = 'weblinux-rest-history'
const CORS_PROXIES = [
  'https://api.allorigins.win/raw?url=',
  'https://corsproxy.io/?',
]

const EXAMPLE_REQUESTS: RequestEntry[] = [
  {
    id: 'ex-jsonplaceholder',
    name: 'JSONPlaceholder - 获取待办',
    method: 'GET',
    url: 'https://jsonplaceholder.typicode.com/todos/1',
    headers: '{\n  "Accept": "application/json"\n}',
    body: '',
    useCorsProxy: false,
    timestamp: 0,
  },
  {
    id: 'ex-httpbin',
    name: 'HTTPBin - 测试 POST',
    method: 'POST',
    url: 'https://httpbin.org/post',
    headers: '{\n  "Content-Type": "application/json"\n}',
    body: '{\n  "hello": "weblinux",\n  "timestamp": 0\n}',
    useCorsProxy: false,
    timestamp: 0,
  },
  {
    id: 'ex-github',
    name: 'GitHub - 用户资料',
    method: 'GET',
    url: 'https://api.github.com/users/github',
    headers: '{\n  "Accept": "application/vnd.github+json"\n}',
    body: '',
    useCorsProxy: false,
    timestamp: 0,
  },
]

function formatJson(text: string): string {
  try {
    return JSON.stringify(JSON.parse(text), null, 2)
  } catch {
    return text
  }
}

function getMethodColor(method: HttpMethod): string {
  const colors: Record<HttpMethod, string> = {
    GET: '#a6e3a1',
    POST: '#89b4fa',
    PUT: '#f9e2af',
    DELETE: '#f38ba8',
    PATCH: '#cba6f7',
    HEAD: '#94e2d5',
    OPTIONS: '#fab387',
  }
  return colors[method] || '#cdd6f4'
}

export default function RESTClient() {
  const [method, setMethod] = useState<HttpMethod>('GET')
  const [url, setUrl] = useState('https://jsonplaceholder.typicode.com/todos/1')
  const [headers, setHeaders] = useState('{\n  "Accept": "application/json"\n}')
  const [body, setBody] = useState('')
  const [useCorsProxy, setUseCorsProxy] = useState(false)
  const [loading, setLoading] = useState(false)
  const [response, setResponse] = useState<ResponseData | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [savedRequests, setSavedRequests] = useState<RequestEntry[]>(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY)
      return raw ? JSON.parse(raw) : []
    } catch {
      return []
    }
  })
  const [history, setHistory] = useState<RequestEntry[]>(() => {
    try {
      const raw = localStorage.getItem(HISTORY_KEY)
      return raw ? JSON.parse(raw) : []
    } catch {
      return []
    }
  })
  const [activeTab, setActiveTab] = useState<'body' | 'headers' | 'saved' | 'history' | 'examples'>('body')
  const [requestName, setRequestName] = useState('')
  const [copied, setCopied] = useState(false)
  const abortRef = useRef<AbortController | null>(null)

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(savedRequests))
  }, [savedRequests])

  useEffect(() => {
    localStorage.setItem(HISTORY_KEY, JSON.stringify(history.slice(0, 50)))
  }, [history])

  const loadRequest = useCallback((entry: RequestEntry) => {
    setMethod(entry.method)
    setUrl(entry.url)
    setHeaders(entry.headers)
    setBody(entry.body)
    setUseCorsProxy(entry.useCorsProxy)
    setRequestName(entry.name)
    setResponse(null)
    setError(null)
  }, [])

  const buildUrl = useCallback((target: string, viaProxy: boolean): string => {
    if (!viaProxy) return target
    const proxy = CORS_PROXIES[0]
    return proxy + encodeURIComponent(target)
  }, [])

  const parseHeaders = useCallback((text: string): Record<string, string> => {
    try {
      const parsed = JSON.parse(text)
      if (parsed && typeof parsed === 'object' && !Array.isArray(parsed)) {
        return Object.fromEntries(
          Object.entries(parsed).map(([k, v]) => [k, String(v)])
        )
      }
    } catch {
      // ignore parse error
    }
    return { 'Accept': 'application/json' }
  }, [])

  const sendRequest = useCallback(async () => {
    if (!url.trim()) {
      setError('请输入请求 URL')
      return
    }

    setLoading(true)
    setResponse(null)
    setError(null)

    if (abortRef.current) {
      abortRef.current.abort()
    }
    const controller = new AbortController()
    abortRef.current = controller

    const startTime = performance.now()
    const finalUrl = buildUrl(url.trim(), useCorsProxy)
    const parsedHeaders = parseHeaders(headers)

    try {
      const options: RequestInit = {
        method,
        headers: parsedHeaders,
        signal: controller.signal,
      }

      if (!['GET', 'HEAD'].includes(method) && body.trim()) {
        options.body = body
      }

      const res = await fetch(finalUrl, options)
      const responseHeaders: Record<string, string> = {}
      res.headers.forEach((value, key) => {
        responseHeaders[key] = value
      })

      const text = await res.text()
      const formattedBody = formatJson(text)
      const time = Math.round(performance.now() - startTime)

      const responseData: ResponseData = {
        status: res.status,
        statusText: res.statusText,
        headers: responseHeaders,
        body: formattedBody,
        time,
        ok: res.ok,
      }

      setResponse(responseData)

      const entry: RequestEntry = {
        id: `req-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
        name: requestName || `${method} ${new URL(url).hostname}`,
        method,
        url,
        headers,
        body,
        useCorsProxy,
        timestamp: Date.now(),
      }
      setHistory((prev) => [entry, ...prev].slice(0, 50))
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err)
      if (message.includes('abort')) return
      setError(message)
    } finally {
      setLoading(false)
      abortRef.current = null
    }
  }, [url, method, headers, body, useCorsProxy, requestName, buildUrl, parseHeaders])

  const saveRequest = useCallback(() => {
    if (!requestName.trim()) {
      setError('请输入请求名称后再保存')
      return
    }
    const entry: RequestEntry = {
      id: `saved-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
      name: requestName.trim(),
      method,
      url,
      headers,
      body,
      useCorsProxy,
      timestamp: Date.now(),
    }
    setSavedRequests((prev) => [entry, ...prev.filter((r) => r.name !== entry.name)].slice(0, 30))
    setActiveTab('saved')
  }, [requestName, method, url, headers, body, useCorsProxy])

  const deleteSaved = useCallback((id: string) => {
    setSavedRequests((prev) => prev.filter((r) => r.id !== id))
  }, [])

  const clearHistory = useCallback(() => {
    setHistory([])
  }, [])

  const copyResponse = useCallback(() => {
    if (response?.body) {
      navigator.clipboard.writeText(response.body).then(() => {
        setCopied(true)
        setTimeout(() => setCopied(false), 1500)
      })
    }
  }, [response])

  const downloadResponse = useCallback(() => {
    if (!response?.body) return
    const blob = new Blob([response.body], { type: 'application/json' })
    const a = document.createElement('a')
    a.href = URL.createObjectURL(blob)
    a.download = `response-${Date.now()}.json`
    a.click()
    URL.revokeObjectURL(a.href)
  }, [response])

  useEffect(() => {
    return () => {
      abortRef.current?.abort()
    }
  }, [])

  const tabButton = (key: typeof activeTab, label: string) => (
    <button
      onClick={() => setActiveTab(key)}
      style={{
        padding: '8px 14px',
        border: 'none',
        background: activeTab === key ? '#313244' : 'transparent',
        color: activeTab === key ? '#cdd6f4' : '#a6adc8',
        borderRadius: 8,
        cursor: 'pointer',
        fontSize: 12,
        fontWeight: 600,
      }}
    >
      {label}
    </button>
  )

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', background: '#1e1e2e', color: '#cdd6f4', fontSize: 13 }}>
      <div style={{ padding: '16px 20px', borderBottom: '1px solid #313244', background: '#181825', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div>
          <h1 style={{ margin: '0 0 4px', fontSize: 18, fontWeight: 700, display: 'flex', alignItems: 'center', gap: 8 }}>
            <Globe size={18} /> REST 客户端
          </h1>
          <p style={{ margin: 0, fontSize: 12, color: '#a6adc8' }}>发送 HTTP 请求，测试 API 端点，保存常用请求</p>
        </div>
      </div>

      <div style={{ padding: '16px 20px', display: 'flex', flexDirection: 'column', gap: 12, borderBottom: '1px solid #313244' }}>
        <div style={{ display: 'flex', gap: 10 }}>
          <select
            value={method}
            onChange={(e) => setMethod(e.target.value as HttpMethod)}
            style={{
              padding: '10px 14px',
              background: '#313244',
              border: '1px solid #45475a',
              borderRadius: 8,
              color: getMethodColor(method),
              fontSize: 13,
              fontWeight: 700,
              minWidth: 90,
            }}
          >
            {(['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'HEAD', 'OPTIONS'] as HttpMethod[]).map((m) => (
              <option key={m} value={m}>{m}</option>
            ))}
          </select>
          <input
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            placeholder="输入 URL，例如 https://api.example.com/data"
            style={{
              flex: 1,
              padding: '10px 14px',
              background: '#313244',
              border: '1px solid #45475a',
              borderRadius: 8,
              color: '#cdd6f4',
              fontSize: 13,
              outline: 'none',
            }}
          />
          <button
            onClick={sendRequest}
            disabled={loading}
            style={{
              padding: '10px 22px',
              background: loading ? '#45475a' : 'linear-gradient(135deg, #89b4fa 0%, #74c7ec 100%)',
              border: 'none',
              borderRadius: 8,
              color: loading ? '#a6adc8' : '#1e1e2e',
              fontWeight: 700,
              cursor: loading ? 'not-allowed' : 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: 6,
              whiteSpace: 'nowrap',
            }}
          >
            <Send size={14} /> {loading ? '发送中...' : '发送'}
          </button>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 16, flexWrap: 'wrap' }}>
          <label style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer', color: '#a6adc8', fontSize: 12 }}>
            <input
              type="checkbox"
              checked={useCorsProxy}
              onChange={(e) => setUseCorsProxy(e.target.checked)}
              style={{ accentColor: '#89b4fa' }}
            />
            使用 CORS 代理（用于测试第三方 API）
          </label>
          <div style={{ flex: 1, display: 'flex', gap: 8 }}>
            <input
              value={requestName}
              onChange={(e) => setRequestName(e.target.value)}
              placeholder="请求名称（保存时使用）"
              style={{
                flex: 1,
                padding: '8px 12px',
                background: '#313244',
                border: '1px solid #45475a',
                borderRadius: 8,
                color: '#cdd6f4',
                fontSize: 12,
              }}
            />
            <button
              onClick={saveRequest}
              style={{
                padding: '8px 14px',
                background: '#313244',
                border: '1px solid #45475a',
                borderRadius: 8,
                color: '#cdd6f4',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: 6,
                fontSize: 12,
              }}
            >
              <Save size={14} /> 保存
            </button>
          </div>
        </div>
      </div>

      <div style={{ flex: 1, display: 'grid', gridTemplateColumns: '1fr 1fr', minHeight: 0 }}>
        <div style={{ borderRight: '1px solid #313244', display: 'flex', flexDirection: 'column' }}>
          <div style={{ display: 'flex', gap: 4, padding: '10px 14px', borderBottom: '1px solid #313244', background: '#181825' }}>
            {tabButton('body', '请求体')}
            {tabButton('headers', '请求头')}
            {tabButton('saved', `已保存 (${savedRequests.length})`)}
            {tabButton('history', `历史 (${history.length})`)}
            {tabButton('examples', '示例')}
          </div>

          <div style={{ flex: 1, padding: 14, overflow: 'auto' }}>
            {activeTab === 'body' && (
              <textarea
                value={body}
                onChange={(e) => setBody(e.target.value)}
                placeholder={['GET', 'HEAD'].includes(method) ? 'GET / HEAD 请求不支持请求体' : '{\n  "key": "value"\n}'}
                disabled={['GET', 'HEAD'].includes(method)}
                style={{
                  width: '100%',
                  height: 'calc(100% - 40px)',
                  minHeight: 160,
                  background: '#313244',
                  border: '1px solid #45475a',
                  borderRadius: 8,
                  padding: 12,
                  color: '#cdd6f4',
                  fontSize: 12,
                  fontFamily: 'monospace',
                  resize: 'none',
                  outline: 'none',
                }}
              />
            )}

            {activeTab === 'headers' && (
              <textarea
                value={headers}
                onChange={(e) => setHeaders(e.target.value)}
                placeholder='{\n  "Content-Type": "application/json"\n}'
                style={{
                  width: '100%',
                  height: 'calc(100% - 40px)',
                  minHeight: 160,
                  background: '#313244',
                  border: '1px solid #45475a',
                  borderRadius: 8,
                  padding: 12,
                  color: '#cdd6f4',
                  fontSize: 12,
                  fontFamily: 'monospace',
                  resize: 'none',
                  outline: 'none',
                }}
              />
            )}

            {(activeTab === 'saved' || activeTab === 'history' || activeTab === 'examples') && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {activeTab === 'history' && history.length > 0 && (
                  <button
                    onClick={clearHistory}
                    style={{
                      alignSelf: 'flex-end',
                      padding: '6px 12px',
                      background: 'transparent',
                      border: '1px solid #f38ba8',
                      borderRadius: 6,
                      color: '#f38ba8',
                      cursor: 'pointer',
                      fontSize: 12,
                    }}
                  >
                    清空历史
                  </button>
                )}
                {(activeTab === 'saved' ? savedRequests : activeTab === 'history' ? history : EXAMPLE_REQUESTS).length === 0 ? (
                  <div style={{ color: '#6c7086', textAlign: 'center', padding: '40px 0' }}>
                    {activeTab === 'saved' ? '暂无保存的请求' : activeTab === 'history' ? '暂无请求历史' : '暂无示例'}
                  </div>
                ) : (
                  (activeTab === 'saved' ? savedRequests : activeTab === 'history' ? history : EXAMPLE_REQUESTS).map((entry) => (
                    <div
                      key={entry.id}
                      style={{
                        padding: 12,
                        background: '#313244',
                        border: '1px solid #45475a',
                        borderRadius: 8,
                        cursor: 'pointer',
                      }}
                      onClick={() => loadRequest(entry)}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 4 }}>
                        <span style={{ fontWeight: 600, fontSize: 12, color: '#cdd6f4' }}>{entry.name}</span>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                          <span style={{ color: getMethodColor(entry.method), fontWeight: 700, fontSize: 11 }}>{entry.method}</span>
                          {activeTab === 'saved' && (
                            <button
                              onClick={(e) => { e.stopPropagation(); deleteSaved(entry.id) }}
                              style={{ background: 'transparent', border: 'none', color: '#f38ba8', cursor: 'pointer', padding: 0 }}
                            >
                              <Trash2 size={14} />
                            </button>
                          )}
                        </div>
                      </div>
                      <div style={{ fontSize: 11, color: '#6c7086', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {entry.url}
                      </div>
                      {entry.timestamp > 0 && (
                        <div style={{ fontSize: 10, color: '#6c7086', marginTop: 4, display: 'flex', alignItems: 'center', gap: 4 }}>
                          <Clock size={10} /> {new Date(entry.timestamp).toLocaleString('zh-CN')}
                        </div>
                      )}
                    </div>
                  ))
                )}
              </div>
            )}
          </div>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', minHeight: 0 }}>
          <div style={{ padding: '10px 14px', borderBottom: '1px solid #313244', background: '#181825', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <span style={{ fontWeight: 600, fontSize: 13 }}>响应</span>
            {response && (
              <div style={{ display: 'flex', alignItems: 'center', gap: 12, fontSize: 12 }}>
                <span style={{ display: 'flex', alignItems: 'center', gap: 4, color: response.ok ? '#a6e3a1' : '#f38ba8' }}>
                  {response.ok ? <CheckCircle size={12} /> : <AlertCircle size={12} />}
                  {response.status} {response.statusText}
                </span>
                <span style={{ color: '#f9e2af', display: 'flex', alignItems: 'center', gap: 4 }}>
                  <Clock size={12} /> {response.time}ms
                </span>
                <button onClick={copyResponse} style={{ background: 'transparent', border: 'none', color: copied ? '#a6e3a1' : '#89b4fa', cursor: 'pointer', padding: 0 }}>
                  <Copy size={14} />
                </button>
                <button onClick={downloadResponse} style={{ background: 'transparent', border: 'none', color: '#89b4fa', cursor: 'pointer', padding: 0 }}>
                  <Download size={14} />
                </button>
              </div>
            )}
          </div>

          <div style={{ flex: 1, padding: 14, overflow: 'auto' }}>
            {error && (
              <div style={{ padding: 12, background: 'rgba(243, 139, 168, 0.1)', border: '1px solid #f38ba8', borderRadius: 8, color: '#f38ba8', marginBottom: 12, fontSize: 12 }}>
                <strong>请求错误：</strong>{error}
                {error.includes('CORS') && (
                  <div style={{ marginTop: 8 }}>提示：如果目标 API 未启用 CORS，请勾选「使用 CORS 代理」后重试。</div>
                )}
              </div>
            )}

            {response && (
              <>
                <div style={{ marginBottom: 12 }}>
                  <div style={{ fontSize: 11, color: '#a6adc8', marginBottom: 6, fontWeight: 600 }}>响应头</div>
                  <div style={{ background: '#313244', borderRadius: 8, padding: 10, fontSize: 11, fontFamily: 'monospace', maxHeight: 120, overflow: 'auto' }}>
                    {Object.entries(response.headers).map(([k, v]) => (
                      <div key={k}><span style={{ color: '#89b4fa' }}>{k}:</span> <span style={{ color: '#cdd6f4' }}>{v}</span></div>
                    ))}
                  </div>
                </div>

                <div>
                  <div style={{ fontSize: 11, color: '#a6adc8', marginBottom: 6, fontWeight: 600 }}>响应体</div>
                  <pre
                    style={{
                      background: '#313244',
                      border: '1px solid #45475a',
                      borderRadius: 8,
                      padding: 12,
                      color: '#a6e3a1',
                      fontSize: 12,
                      fontFamily: 'monospace',
                      whiteSpace: 'pre-wrap',
                      wordBreak: 'break-word',
                      margin: 0,
                      minHeight: 160,
                    }}
                  >
                    {response.body}
                  </pre>
                </div>
              </>
            )}

            {!response && !error && !loading && (
              <div style={{ color: '#6c7086', textAlign: 'center', padding: '60px 0' }}>
                发送请求后，响应内容将显示在这里
              </div>
            )}

            {loading && (
              <div style={{ color: '#a6adc8', textAlign: 'center', padding: '60px 0' }}>
                正在请求 API，请稍候…
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
