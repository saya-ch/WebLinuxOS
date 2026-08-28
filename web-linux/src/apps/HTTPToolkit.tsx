import { useState, useCallback, useRef, memo, useEffect, useMemo } from 'react'
import {
  Send, Clock, AlertCircle, Copy,
  ChevronDown, Plus, Trash2, Globe, Zap,
  Loader2, History
} from 'lucide-react'

// ==================== 类型定义 ====================

type HttpMethod = 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH' | 'HEAD' | 'OPTIONS'

interface RequestHeader {
  key: string
  value: string
  enabled: boolean
}

interface HttpResponse {
  status: number
  statusText: string
  headers: Record<string, string>
  body: string
  time: number
  size: number
}

interface RequestTemplate {
  id: string
  name: string
  method: HttpMethod
  url: string
  headers: RequestHeader[]
  body?: string
  category: string
  description: string
}

interface HistoryItem {
  id: string
  method: HttpMethod
  url: string
  status: number
  time: number
  timestamp: number
}

// ==================== 预设API模板 ====================

const API_TEMPLATES: RequestTemplate[] = [
  {
    id: 'httpbin-get',
    name: 'HTTPBin GET',
    method: 'GET',
    url: 'https://httpbin.org/get',
    headers: [],
    category: 'Testing',
    description: '测试GET请求，返回请求信息'
  },
  {
    id: 'httpbin-post',
    name: 'HTTPBin POST',
    method: 'POST',
    url: 'https://httpbin.org/post',
    headers: [{ key: 'Content-Type', value: 'application/json', enabled: true }],
    body: '{"hello": "world", "timestamp": "2024-01-01"}',
    category: 'Testing',
    description: '测试POST请求，返回提交的数据'
  },
  {
    id: 'jsonplaceholder-todos',
    name: 'Get Todos',
    method: 'GET',
    url: 'https://jsonplaceholder.typicode.com/todos?_limit=10',
    headers: [],
    category: 'JSONPlaceholder',
    description: '获取待办事项列表（前10条）'
  },
  {
    id: 'jsonplaceholder-users',
    name: 'Get Users',
    method: 'GET',
    url: 'https://jsonplaceholder.typicode.com/users',
    headers: [],
    category: 'JSONPlaceholder',
    description: '获取用户列表'
  },
  {
    id: 'jsonplaceholder-posts',
    name: 'Create Post',
    method: 'POST',
    url: 'https://jsonplaceholder.typicode.com/posts',
    headers: [{ key: 'Content-Type', value: 'application/json', enabled: true }],
    body: '{"title": "Test Post", "body": "This is a test post from HTTPToolkit", "userId": 1}',
    category: 'JSONPlaceholder',
    description: '创建新文章'
  },
  {
    id: 'github-repos',
    name: 'GitHub Trending',
    method: 'GET',
    url: 'https://api.github.com/search/repositories?q=stars:>1000&sort=stars&order=desc&per_page=5',
    headers: [],
    category: 'GitHub',
    description: '搜索GitHub热门仓库'
  },
  {
    id: 'weather-api',
    name: 'Weather (Beijing)',
    method: 'GET',
    url: 'https://api.open-meteo.com/v1/forecast?latitude=39.9042&longitude=116.4074&current_weather=true&timezone=Asia/Shanghai',
    headers: [],
    category: 'Weather',
    description: '获取北京实时天气'
  },
  {
    id: 'cat-facts',
    name: 'Random Cat Fact',
    method: 'GET',
    url: 'https://catfact.ninja/fact',
    headers: [],
    category: 'Fun',
    description: '随机获取一条猫咪知识'
  },
  {
    id: 'dog-api',
    name: 'Random Dog',
    method: 'GET',
    url: 'https://dog.ceo/api/breeds/image/random',
    headers: [],
    category: 'Fun',
    description: '随机获取一张狗狗图片'
  },
  {
    id: 'ip-api',
    name: 'IP Geolocation',
    method: 'GET',
    url: 'https://ipapi.co/json/',
    headers: [],
    category: 'Network',
    description: '获取当前IP地理信息'
  },
  {
    id: 'httpbin-headers',
    name: 'Custom Headers',
    method: 'GET',
    url: 'https://httpbin.org/headers',
    headers: [
      { key: 'X-Custom-Header', value: 'HTTPToolkit', enabled: true },
      { key: 'Authorization', value: 'Bearer test-token-123', enabled: true }
    ],
    category: 'Testing',
    description: '测试自定义请求头'
  },
  {
    id: 'httpbin-delay',
    name: 'Slow Response (3s)',
    method: 'GET',
    url: 'https://httpbin.org/delay/3',
    headers: [],
    category: 'Testing',
    description: '测试延迟3秒的响应'
  }
]

// ==================== 工具函数 ====================

function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}

function formatTime(ms: number): string {
  if (ms < 1000) return `${ms}ms`
  return `${(ms / 1000).toFixed(2)}s`
}

function getStatusColor(status: number): string {
  if (status >= 200 && status < 300) return '#22c55e'
  if (status >= 300 && status < 400) return '#f59e0b'
  if (status >= 400 && status < 500) return '#f97316'
  if (status >= 500) return '#ef4444'
  return '#6b7280'
}

function getStatusLabel(status: number): string {
  const labels: Record<number, string> = {
    200: 'OK', 201: 'Created', 204: 'No Content',
    301: 'Moved', 304: 'Not Modified',
    400: 'Bad Request', 401: 'Unauthorized', 403: 'Forbidden',
    404: 'Not Found', 405: 'Method Not Allowed', 429: 'Too Many Requests',
    500: 'Internal Error', 502: 'Bad Gateway', 503: 'Unavailable'
  }
  return labels[status] || ''
}

function generateId(): string {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 8)
}

// ==================== 子组件 ====================

const MethodBadge = memo(({ method }: { method: HttpMethod }) => {
  const colors: Record<HttpMethod, string> = {
    GET: '#22c55e',
    POST: '#3b82f6',
    PUT: '#f59e0b',
    DELETE: '#ef4444',
    PATCH: '#a855f7',
    HEAD: '#6b7280',
    OPTIONS: '#6b7280'
  }
  return (
    <span style={{
      padding: '2px 8px',
      borderRadius: 4,
      fontSize: 11,
      fontWeight: 700,
      fontFamily: "'JetBrains Mono', monospace",
      color: colors[method],
      background: `${colors[method]}18`,
      border: `1px solid ${colors[method]}30`,
      letterSpacing: '0.05em'
    }}>
      {method}
    </span>
  )
})

const StatusBadge = memo(({ status }: { status: number }) => (
  <span style={{
    padding: '2px 10px',
    borderRadius: 4,
    fontSize: 12,
    fontWeight: 600,
    fontFamily: "'JetBrains Mono', monospace",
    color: getStatusColor(status),
    background: `${getStatusColor(status)}18`,
    border: `1px solid ${getStatusColor(status)}30`
  }}>
    {status} {getStatusLabel(status)}
  </span>
))

// ==================== 主组件 ====================

const HTTPToolkit = memo(function HTTPToolkit() {
  const [method, setMethod] = useState<HttpMethod>('GET')
  const [url, setUrl] = useState('https://httpbin.org/get')
  const [headers, setHeaders] = useState<RequestHeader[]>([
    { key: 'Accept', value: 'application/json', enabled: true }
  ])
  const [body, setBody] = useState('')
  const [response, setResponse] = useState<HttpResponse | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [history, setHistory] = useState<HistoryItem[]>([])
  const [activeTab, setActiveTab] = useState<'headers' | 'body' | 'history' | 'templates'>('templates')
  const [responseTab, setResponseTab] = useState<'body' | 'headers'>('body')
  const [showMethodDropdown, setShowMethodDropdown] = useState(false)
  const abortRef = useRef<AbortController | null>(null)
  const urlInputRef = useRef<HTMLInputElement>(null)

  const templateCategories = useMemo(() => {
    const cats = new Map<string, RequestTemplate[]>()
    API_TEMPLATES.forEach(t => {
      const arr = cats.get(t.category) || []
      arr.push(t)
      cats.set(t.category, arr)
    })
    return cats
  }, [])

  // 发送请求
  const sendRequest = useCallback(async () => {
    if (!url.trim()) {
      setError('请输入URL地址')
      return
    }

    // 验证URL格式
    let targetUrl = url.trim()
    if (!targetUrl.startsWith('http://') && !targetUrl.startsWith('https://')) {
      targetUrl = 'https://' + targetUrl
      setUrl(targetUrl)
    }

    setLoading(true)
    setError(null)
    setResponse(null)
    setActiveTab('body')

    // 取消上一个请求
    if (abortRef.current) {
      abortRef.current.abort()
    }
    abortRef.current = new AbortController()

    const startTime = performance.now()

    try {
      const requestHeaders: Record<string, string> = {}
      headers.filter(h => h.enabled && h.key.trim()).forEach(h => {
        requestHeaders[h.key.trim()] = h.value
      })

      const fetchOptions: RequestInit = {
        method,
        headers: requestHeaders,
        signal: abortRef.current.signal,
      }

      if (['POST', 'PUT', 'PATCH'].includes(method) && body.trim()) {
        fetchOptions.body = body
      }

      const res = await fetch(targetUrl, fetchOptions)
      const endTime = performance.now()
      const elapsed = Math.round(endTime - startTime)

      const responseText = await res.text()
      const responseHeaders: Record<string, string> = {}
      res.headers.forEach((value, key) => {
        responseHeaders[key] = value
      })

      const result: HttpResponse = {
        status: res.status,
        statusText: res.statusText,
        headers: responseHeaders,
        body: responseText,
        time: elapsed,
        size: new TextEncoder().encode(responseText).length
      }

      setResponse(result)

      // 添加到历史记录
      const historyItem: HistoryItem = {
        id: generateId(),
        method,
        url: targetUrl,
        status: res.status,
        time: elapsed,
        timestamp: Date.now()
      }
      setHistory(prev => [historyItem, ...prev].slice(0, 50))
    } catch (err: unknown) {
      const endTime = performance.now()
      if (err instanceof DOMException && err.name === 'AbortError') {
        setError('请求已取消')
      } else {
        setError(err instanceof Error ? err.message : '网络请求失败')
        // 即使失败也记录到历史
        setHistory(prev => [{
          id: generateId(),
          method,
          url: targetUrl,
          status: 0,
          time: Math.round(endTime - startTime),
          timestamp: Date.now()
        }, ...prev].slice(0, 50))
      }
    } finally {
      setLoading(false)
    }
  }, [method, url, headers, body])

  // 加载模板
  const loadTemplate = useCallback((template: RequestTemplate) => {
    setMethod(template.method)
    setUrl(template.url)
    setHeaders(template.headers.length > 0 ? [...template.headers] : [{ key: 'Accept', value: 'application/json', enabled: true }])
    setBody(template.body || '')
    setActiveTab('headers')
  }, [])

  // 添加Header
  const addHeader = useCallback(() => {
    setHeaders(prev => [...prev, { key: '', value: '', enabled: true }])
  }, [])

  // 删除Header
  const removeHeader = useCallback((index: number) => {
    setHeaders(prev => prev.filter((_, i) => i !== index))
  }, [])

  // 更新Header
  const updateHeader = useCallback((index: number, field: 'key' | 'value' | 'enabled', value: string | boolean) => {
    setHeaders(prev => prev.map((h, i) => i === index ? { ...h, [field]: value } : h))
  }, [])

  // 复制到剪贴板
  const copyToClipboard = useCallback((text: string) => {
    navigator.clipboard.writeText(text).catch(() => {})
  }, [])

  // 格式化响应体
  const formattedBody = useMemo(() => {
    if (!response?.body) return ''
    try {
      return JSON.stringify(JSON.parse(response.body), null, 2)
    } catch {
      return response.body
    }
  }, [response?.body])

  // 键盘快捷键
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'Enter') {
        e.preventDefault()
        sendRequest()
      }
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [sendRequest])

  const METHODS: HttpMethod[] = ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'HEAD', 'OPTIONS']

  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      height: '100%',
      background: 'var(--window-bg)',
      color: 'var(--text-primary)',
      fontFamily: "'Noto Sans SC', sans-serif",
      overflow: 'hidden'
    }}>
      {/* 顶部标题栏 */}
      <div style={{
        padding: '12px 16px',
        borderBottom: '1px solid var(--window-border)',
        display: 'flex',
        alignItems: 'center',
        gap: 10,
        background: 'var(--surface-bg)',
        flexShrink: 0
      }}>
        <Globe size={18} style={{ color: 'var(--accent)' }} />
        <span style={{ fontSize: 14, fontWeight: 600 }}>HTTP Toolkit</span>
        <span style={{ fontSize: 11, color: 'var(--text-secondary)' }}>
          实用HTTP客户端 · 真实API集成 · Ctrl+Enter发送
        </span>
      </div>

      {/* URL栏 */}
      <div style={{
        padding: '12px 16px',
        borderBottom: '1px solid var(--window-border)',
        display: 'flex',
        gap: 8,
        alignItems: 'center',
        flexShrink: 0
      }}>
        {/* 方法选择 */}
        <div style={{ position: 'relative' }}>
          <button
            onClick={() => setShowMethodDropdown(!showMethodDropdown)}
            style={{
              padding: '8px 12px',
              borderRadius: 6,
              border: '1px solid var(--window-border)',
              background: 'var(--surface-bg)',
              color: 'var(--text-primary)',
              cursor: 'pointer',
              fontSize: 13,
              fontWeight: 700,
              fontFamily: "'JetBrains Mono', monospace",
              display: 'flex',
              alignItems: 'center',
              gap: 4,
              minWidth: 90,
              justifyContent: 'space-between'
            }}
          >
            {method}
            <ChevronDown size={14} />
          </button>
          {showMethodDropdown && (
            <div style={{
              position: 'absolute',
              top: '100%',
              left: 0,
              marginTop: 4,
              background: 'var(--surface-bg)',
              border: '1px solid var(--window-border)',
              borderRadius: 6,
              zIndex: 100,
              minWidth: 120,
              boxShadow: '0 4px 12px rgba(0,0,0,0.2)'
            }}>
              {METHODS.map(m => (
                <button
                  key={m}
                  onClick={() => { setMethod(m); setShowMethodDropdown(false) }}
                  style={{
                    display: 'block',
                    width: '100%',
                    padding: '8px 12px',
                    border: 'none',
                    background: m === method ? 'var(--accent-bg)' : 'transparent',
                    color: 'var(--text-primary)',
                    cursor: 'pointer',
                    fontSize: 13,
                    fontWeight: 600,
                    fontFamily: "'JetBrains Mono', monospace",
                    textAlign: 'left'
                  }}
                >
                  <MethodBadge method={m} />
                </button>
              ))}
            </div>
          )}
        </div>

        {/* URL输入 */}
        <input
          ref={urlInputRef}
          value={url}
          onChange={e => setUrl(e.target.value)}
          onKeyDown={e => { if (e.key === 'Enter') sendRequest() }}
          placeholder="输入URL地址，如 https://api.example.com/data"
          style={{
            flex: 1,
            padding: '8px 12px',
            borderRadius: 6,
            border: '1px solid var(--window-border)',
            background: 'var(--input-bg)',
            color: 'var(--text-primary)',
            fontSize: 13,
            fontFamily: "'JetBrains Mono', monospace",
            outline: 'none'
          }}
        />

        {/* 发送按钮 */}
        <button
          onClick={sendRequest}
          disabled={loading}
          style={{
            padding: '8px 20px',
            borderRadius: 6,
            border: 'none',
            background: loading ? 'var(--text-secondary)' : 'var(--accent)',
            color: '#fff',
            cursor: loading ? 'not-allowed' : 'pointer',
            fontSize: 13,
            fontWeight: 600,
            display: 'flex',
            alignItems: 'center',
            gap: 6,
            transition: 'background 0.2s'
          }}
        >
          {loading ? <Loader2 size={14} className="spin" /> : <Send size={14} />}
          {loading ? '发送中' : '发送'}
        </button>
      </div>

      {/* 主内容区 */}
      <div style={{ flex: 1, display: 'flex', overflow: 'hidden' }}>
        {/* 左侧面板 - Headers/Body */}
        <div style={{
          width: 380,
          borderRight: '1px solid var(--window-border)',
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden'
        }}>
          {/* Tab栏 */}
          <div style={{
            display: 'flex',
            borderBottom: '1px solid var(--window-border)',
            flexShrink: 0
          }}>
            {(['headers', 'body', 'templates', 'history'] as const).map(tab => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                style={{
                  flex: 1,
                  padding: '10px 8px',
                  border: 'none',
                  borderBottom: activeTab === tab ? '2px solid var(--accent)' : '2px solid transparent',
                  background: activeTab === tab ? 'var(--accent-bg)' : 'transparent',
                  color: activeTab === tab ? 'var(--accent)' : 'var(--text-secondary)',
                  cursor: 'pointer',
                  fontSize: 12,
                  fontWeight: 600,
                  textTransform: 'capitalize',
                  transition: 'all 0.15s'
                }}
              >
                {tab === 'headers' && 'Headers'}
                {tab === 'body' && 'Body'}
                {tab === 'templates' && 'Templates'}
                {tab === 'history' && 'History'}
              </button>
            ))}
          </div>

          {/* Tab内容 */}
          <div style={{ flex: 1, overflow: 'auto', padding: 12 }}>
            {/* Headers */}
            {activeTab === 'headers' && (
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
                  <span style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-secondary)' }}>
                    Request Headers
                  </span>
                  <button
                    onClick={addHeader}
                    style={{
                      padding: '4px 8px',
                      borderRadius: 4,
                      border: '1px solid var(--window-border)',
                      background: 'var(--surface-bg)',
                      color: 'var(--text-primary)',
                      cursor: 'pointer',
                      fontSize: 11,
                      display: 'flex',
                      alignItems: 'center',
                      gap: 4
                    }}
                  >
                    <Plus size={12} /> Add
                  </button>
                </div>
                {headers.map((h, i) => (
                  <div key={i} style={{ display: 'flex', gap: 6, marginBottom: 6, alignItems: 'center' }}>
                    <input
                      checked={h.enabled}
                      onChange={e => updateHeader(i, 'enabled', e.target.checked)}
                      type="checkbox"
                      style={{ accentColor: 'var(--accent)' }}
                    />
                    <input
                      value={h.key}
                      onChange={e => updateHeader(i, 'key', e.target.value)}
                      placeholder="Header name"
                      style={{
                        flex: 1,
                        padding: '6px 8px',
                        borderRadius: 4,
                        border: '1px solid var(--window-border)',
                        background: 'var(--input-bg)',
                        color: 'var(--text-primary)',
                        fontSize: 12,
                        fontFamily: "'JetBrains Mono', monospace",
                        outline: 'none'
                      }}
                    />
                    <input
                      value={h.value}
                      onChange={e => updateHeader(i, 'value', e.target.value)}
                      placeholder="Value"
                      style={{
                        flex: 1,
                        padding: '6px 8px',
                        borderRadius: 4,
                        border: '1px solid var(--window-border)',
                        background: 'var(--input-bg)',
                        color: 'var(--text-primary)',
                        fontSize: 12,
                        fontFamily: "'JetBrains Mono', monospace",
                        outline: 'none'
                      }}
                    />
                    <button
                      onClick={() => removeHeader(i)}
                      style={{
                        padding: '4px',
                        border: 'none',
                        background: 'transparent',
                        color: 'var(--text-secondary)',
                        cursor: 'pointer',
                        borderRadius: 4
                      }}
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                ))}
                {headers.length === 0 && (
                  <div style={{ textAlign: 'center', padding: 20, color: 'var(--text-secondary)', fontSize: 12 }}>
                    无自定义请求头
                  </div>
                )}
              </div>
            )}

            {/* Body */}
            {activeTab === 'body' && (
              <div>
                <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-secondary)', marginBottom: 8 }}>
                  Request Body {['GET', 'HEAD'].includes(method) && '(GET/HEAD不支持Body)'}
                </div>
                <textarea
                  value={body}
                  onChange={e => setBody(e.target.value)}
                  placeholder={method === 'GET' ? 'GET请求通常不需要Body' : '输入请求体，如 JSON: {"key": "value"}'}
                  disabled={['GET', 'HEAD'].includes(method)}
                  style={{
                    width: '100%',
                    height: 300,
                    padding: 10,
                    borderRadius: 6,
                    border: '1px solid var(--window-border)',
                    background: 'var(--input-bg)',
                    color: 'var(--text-primary)',
                    fontSize: 12,
                    fontFamily: "'JetBrains Mono', monospace",
                    resize: 'vertical',
                    outline: 'none',
                    opacity: ['GET', 'HEAD'].includes(method) ? 0.5 : 1
                  }}
                />
              </div>
            )}

            {/* Templates */}
            {activeTab === 'templates' && (
              <div>
                <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-secondary)', marginBottom: 10 }}>
                  API Templates · 真实公开API
                </div>
                {Array.from(templateCategories.entries()).map(([category, templates]) => (
                  <div key={category} style={{ marginBottom: 14 }}>
                    <div style={{
                      fontSize: 11,
                      fontWeight: 700,
                      color: 'var(--accent)',
                      textTransform: 'uppercase',
                      letterSpacing: '0.08em',
                      marginBottom: 6,
                      display: 'flex',
                      alignItems: 'center',
                      gap: 4
                    }}>
                      <Zap size={12} />
                      {category}
                    </div>
                    {templates.map(t => (
                      <button
                        key={t.id}
                        onClick={() => loadTemplate(t)}
                        style={{
                          display: 'block',
                          width: '100%',
                          padding: '8px 10px',
                          marginBottom: 4,
                          borderRadius: 6,
                          border: '1px solid var(--window-border)',
                          background: 'var(--surface-bg)',
                          color: 'var(--text-primary)',
                          cursor: 'pointer',
                          textAlign: 'left',
                          transition: 'all 0.15s'
                        }}
                        onMouseEnter={e => {
                          e.currentTarget.style.borderColor = 'var(--accent)'
                          e.currentTarget.style.background = 'var(--accent-bg)'
                        }}
                        onMouseLeave={e => {
                          e.currentTarget.style.borderColor = 'var(--window-border)'
                          e.currentTarget.style.background = 'var(--surface-bg)'
                        }}
                      >
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 2 }}>
                          <MethodBadge method={t.method} />
                          <span style={{ fontSize: 12, fontWeight: 600 }}>{t.name}</span>
                        </div>
                        <div style={{ fontSize: 11, color: 'var(--text-secondary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                          {t.description}
                        </div>
                      </button>
                    ))}
                  </div>
                ))}
              </div>
            )}

            {/* History */}
            {activeTab === 'history' && (
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
                  <span style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-secondary)' }}>
                    Request History ({history.length})
                  </span>
                  {history.length > 0 && (
                    <button
                      onClick={() => setHistory([])}
                      style={{
                        padding: '4px 8px',
                        borderRadius: 4,
                        border: 'none',
                        background: 'transparent',
                        color: 'var(--text-secondary)',
                        cursor: 'pointer',
                        fontSize: 11,
                        display: 'flex',
                        alignItems: 'center',
                        gap: 4
                      }}
                    >
                      <Trash2 size={12} /> Clear
                    </button>
                  )}
                </div>
                {history.map(item => (
                  <button
                    key={item.id}
                    onClick={() => { setMethod(item.method); setUrl(item.url); }}
                    style={{
                      display: 'block',
                      width: '100%',
                      padding: '8px 10px',
                      marginBottom: 4,
                      borderRadius: 6,
                      border: '1px solid var(--window-border)',
                      background: 'var(--surface-bg)',
                      color: 'var(--text-primary)',
                      cursor: 'pointer',
                      textAlign: 'left',
                      transition: 'all 0.15s'
                    }}
                    onMouseEnter={e => e.currentTarget.style.borderColor = 'var(--accent)'}
                    onMouseLeave={e => e.currentTarget.style.borderColor = 'var(--window-border)'}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 2 }}>
                      <MethodBadge method={item.method} />
                      <span style={{
                        fontSize: 11,
                        fontWeight: 600,
                        color: getStatusColor(item.status),
                        fontFamily: "'JetBrains Mono', monospace"
                      }}>
                        {item.status || 'ERR'}
                      </span>
                      <span style={{ fontSize: 10, color: 'var(--text-secondary)', marginLeft: 'auto' }}>
                        {formatTime(item.time)}
                      </span>
                    </div>
                    <div style={{
                      fontSize: 11,
                      color: 'var(--text-secondary)',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      whiteSpace: 'nowrap',
                      fontFamily: "'JetBrains Mono', monospace"
                    }}>
                      {item.url}
                    </div>
                    <div style={{ fontSize: 10, color: 'var(--text-tertiary)', marginTop: 2 }}>
                      {new Date(item.timestamp).toLocaleTimeString()}
                    </div>
                  </button>
                ))}
                {history.length === 0 && (
                  <div style={{ textAlign: 'center', padding: 30, color: 'var(--text-secondary)', fontSize: 12 }}>
                    <History size={32} style={{ opacity: 0.3, marginBottom: 8 }} />
                    <div>暂无请求历史</div>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        {/* 右侧 - 响应区 */}
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
          {/* 响应状态栏 */}
          <div style={{
            padding: '10px 16px',
            borderBottom: '1px solid var(--window-border)',
            display: 'flex',
            alignItems: 'center',
            gap: 12,
            flexShrink: 0,
            background: 'var(--surface-bg)'
          }}>
            <span style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-secondary)' }}>Response</span>
            {response && (
              <>
                <StatusBadge status={response.status} />
                <span style={{
                  fontSize: 11,
                  color: 'var(--text-secondary)',
                  fontFamily: "'JetBrains Mono', monospace",
                  display: 'flex',
                  alignItems: 'center',
                  gap: 4
                }}>
                  <Clock size={12} />
                  {formatTime(response.time)}
                </span>
                <span style={{
                  fontSize: 11,
                  color: 'var(--text-secondary)',
                  fontFamily: "'JetBrains Mono', monospace"
                }}>
                  {formatBytes(response.size)}
                </span>
                <button
                  onClick={() => copyToClipboard(formattedBody || response.body)}
                  style={{
                    padding: '4px 8px',
                    borderRadius: 4,
                    border: '1px solid var(--window-border)',
                    background: 'var(--surface-bg)',
                    color: 'var(--text-secondary)',
                    cursor: 'pointer',
                    fontSize: 11,
                    display: 'flex',
                    alignItems: 'center',
                    gap: 4,
                    marginLeft: 'auto'
                  }}
                >
                  <Copy size={12} /> Copy
                </button>
              </>
            )}
            {error && (
              <span style={{ fontSize: 12, color: '#ef4444', display: 'flex', alignItems: 'center', gap: 4 }}>
                <AlertCircle size={14} />
                {error}
              </span>
            )}
          </div>

          {/* 响应内容Tab */}
          {response && (
            <div style={{ display: 'flex', borderBottom: '1px solid var(--window-border)', flexShrink: 0 }}>
              {(['body', 'headers'] as const).map(tab => (
                <button
                  key={tab}
                  onClick={() => setResponseTab(tab)}
                  style={{
                    padding: '8px 16px',
                    border: 'none',
                    borderBottom: responseTab === tab ? '2px solid var(--accent)' : '2px solid transparent',
                    background: responseTab === tab ? 'var(--accent-bg)' : 'transparent',
                    color: responseTab === tab ? 'var(--accent)' : 'var(--text-secondary)',
                    cursor: 'pointer',
                    fontSize: 12,
                    fontWeight: 600,
                    textTransform: 'capitalize'
                  }}
                >
                  {tab === 'body' ? 'Body' : `Headers (${Object.keys(response.headers).length})`}
                </button>
              ))}
            </div>
          )}

          {/* 响应内容 */}
          <div style={{ flex: 1, overflow: 'auto', padding: 0 }}>
            {loading && !response && (
              <div style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                height: '100%',
                gap: 12,
                color: 'var(--text-secondary)'
              }}>
                <Loader2 size={32} className="spin" style={{ color: 'var(--accent)' }} />
                <span style={{ fontSize: 13 }}>请求发送中...</span>
              </div>
            )}

            {!loading && !response && !error && (
              <div style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                height: '100%',
                gap: 12,
                color: 'var(--text-secondary)'
              }}>
                <Globe size={48} style={{ opacity: 0.2 }} />
                <div style={{ fontSize: 14, fontWeight: 600 }}>HTTP Toolkit</div>
                <div style={{ fontSize: 12, maxWidth: 300, textAlign: 'center', lineHeight: 1.6 }}>
                  选择左侧的API模板快速开始，或直接输入URL发送请求。
                  <br />
                  支持 GET / POST / PUT / DELETE / PATCH 等方法。
                  <br />
                  快捷键: <kbd style={{
                    padding: '2px 6px',
                    borderRadius: 3,
                    border: '1px solid var(--window-border)',
                    background: 'var(--surface-bg)',
                    fontSize: 11,
                    fontFamily: "'JetBrains Mono', monospace"
                  }}>Ctrl+Enter</kbd> 发送请求
                </div>
              </div>
            )}

            {response && responseTab === 'body' && (
              <pre style={{
                margin: 0,
                padding: 16,
                fontSize: 12,
                fontFamily: "'JetBrains Mono', monospace",
                lineHeight: 1.6,
                color: 'var(--text-primary)',
                whiteSpace: 'pre-wrap',
                wordBreak: 'break-all',
                background: 'var(--surface-bg)'
              }}>
                {formattedBody || response.body}
              </pre>
            )}

            {response && responseTab === 'headers' && (
              <div style={{ padding: 16 }}>
                {Object.entries(response.headers).map(([key, value]) => (
                  <div key={key} style={{
                    display: 'flex',
                    gap: 12,
                    padding: '6px 0',
                    borderBottom: '1px solid var(--window-border)',
                    fontSize: 12,
                    fontFamily: "'JetBrains Mono', monospace"
                  }}>
                    <span style={{ fontWeight: 600, color: 'var(--accent)', minWidth: 200, flexShrink: 0 }}>
                      {key}
                    </span>
                    <span style={{ color: 'var(--text-primary)', wordBreak: 'break-all' }}>
                      {value}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* CSS动画 */}
      <style>{`
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
        .spin { animation: spin 1s linear infinite; }
      `}</style>
    </div>
  )
})

export default HTTPToolkit
