import { useState, useCallback } from 'react'
import { Globe, Send, Clock, Trash2, ChevronDown, ChevronRight, AlertTriangle, CheckCircle, XCircle } from 'lucide-react'

// 类型定义
type HttpMethod = 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH'

interface HeaderEntry {
  id: string
  key: string
  value: string
  enabled: boolean
}

interface RequestRecord {
  id: string
  url: string
  method: HttpMethod
  headers: HeaderEntry[]
  body?: string
  status?: number
  statusText?: string
  responseHeaders?: Record<string, string>
  responseBody?: string
  duration?: number
  timestamp: number
  error?: string
  corsAnalysis?: CorsAnalysis
}

interface CorsAnalysis {
  hasAccessControlAllowOrigin: boolean
  hasAccessControlAllowMethods: boolean
  hasAccessControlAllowHeaders: boolean
  allowOrigin?: string
  allowMethods?: string
  allowHeaders?: string
  allowCredentials?: string
  maxAge?: string
  exposeHeaders?: string
  isCorsEnabled: boolean
  verdict: string
}

interface ResponseInfo {
  status: number
  statusText: string
  headers: Record<string, string>
  body: string
  duration: number
  size: number
}

const HISTORY_KEY = 'weblinux-cors-proxy-history'
const MAX_HISTORY = 20

const CORS_PROXIES = [
  { name: '无代理（直连）', prefix: '' },
  { name: 'AllOrigins', prefix: 'https://api.allorigins.win/raw?url=' },
  { name: 'CorsProxy.io', prefix: 'https://corsproxy.io/?' },
]

const METHOD_COLORS: Record<HttpMethod, string> = {
  GET: '#a6e3a1',
  POST: '#89b4fa',
  PUT: '#f9e2af',
  DELETE: '#f38ba8',
  PATCH: '#cba6f7',
}

const CORS_HEADERS = [
  'Access-Control-Allow-Origin',
  'Access-Control-Allow-Methods',
  'Access-Control-Allow-Headers',
  'Access-Control-Allow-Credentials',
  'Access-Control-Max-Age',
  'Access-Control-Expose-Headers',
]

function analyzeCorsHeaders(headers: Record<string, string>): CorsAnalysis {
  const lowerHeaders: Record<string, string> = {}
  for (const [k, v] of Object.entries(headers)) {
    lowerHeaders[k.toLowerCase()] = v
  }

  const acao = lowerHeaders['access-control-allow-origin']
  const acam = lowerHeaders['access-control-allow-methods']
  const acah = lowerHeaders['access-control-allow-headers']
  const acac = lowerHeaders['access-control-allow-credentials']
  const acma = lowerHeaders['access-control-max-age']
  const aceh = lowerHeaders['access-control-expose-headers']

  const isCorsEnabled = !!(acao || acam || acah)

  let verdict = ''
  if (!isCorsEnabled) {
    verdict = '未检测到 CORS 响应头，目标服务器可能未配置 CORS 策略。跨域请求可能被浏览器拦截。'
  } else if (acao === '*') {
    verdict = '服务器允许任意来源访问（Access-Control-Allow-Origin: *）。注意：此模式下不支持携带凭证。'
  } else if (acao) {
    verdict = `服务器允许来自 ${acao} 的跨域请求。`
    if (acac === 'true') {
      verdict += ' 同时支持携带凭证（cookies 等）。'
    }
  }

  return {
    hasAccessControlAllowOrigin: !!acao,
    hasAccessControlAllowMethods: !!acam,
    hasAccessControlAllowHeaders: !!acah,
    allowOrigin: acao,
    allowMethods: acam,
    allowHeaders: acah,
    allowCredentials: acac,
    maxAge: acma,
    exposeHeaders: aceh,
    isCorsEnabled,
    verdict,
  }
}

function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(2)} MB`
}

function formatTimestamp(ts: number): string {
  const d = new Date(ts)
  return d.toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit', second: '2-digit' })
}

function loadHistory(): RequestRecord[] {
  try {
    const raw = localStorage.getItem(HISTORY_KEY)
    return raw ? JSON.parse(raw) : []
  } catch {
    return []
  }
}

function saveHistory(records: RequestRecord[]) {
  try {
    localStorage.setItem(HISTORY_KEY, JSON.stringify(records))
  } catch {
    // ignore
  }
}

const CORSProxy: React.FC = () => {
  // 请求构建状态
  const [url, setUrl] = useState('https://jsonplaceholder.typicode.com/todos/1')
  const [method, setMethod] = useState<HttpMethod>('GET')
  const [headers, setHeaders] = useState<HeaderEntry[]>([
    { id: 'h1', key: 'Accept', value: 'application/json', enabled: true },
  ])
  const [body, setBody] = useState('')
  const [proxyIndex, setProxyIndex] = useState(0)
  const [loading, setLoading] = useState(false)

  // 响应状态
  const [response, setResponse] = useState<ResponseInfo | null>(null)
  const [corsAnalysis, setCorsAnalysis] = useState<CorsAnalysis | null>(null)
  const [error, setError] = useState<string | null>(null)

  // 历史记录
  const [history, setHistory] = useState<RequestRecord[]>(loadHistory)
  const [historyExpanded, setHistoryExpanded] = useState(false)
  const [responseTab, setResponseTab] = useState<'body' | 'headers' | 'cors'>('body')

  // 当前展开的历史项
  const [expandedHistoryId, setExpandedHistoryId] = useState<string | null>(null)

  const showBodyEditor = method === 'POST' || method === 'PUT' || method === 'PATCH'

  const addHeader = useCallback(() => {
    setHeaders(prev => [...prev, { id: `h${Date.now()}`, key: '', value: '', enabled: true }])
  }, [])

  const removeHeader = useCallback((id: string) => {
    setHeaders(prev => prev.filter(h => h.id !== id))
  }, [])

  const updateHeader = useCallback((id: string, field: 'key' | 'value' | 'enabled', val: string | boolean) => {
    setHeaders(prev => prev.map(h => (h.id === id ? { ...h, [field]: val } : h)))
  }, [])

  const sendRequest = useCallback(async () => {
    if (!url.trim()) {
      setError('请输入目标 URL')
      return
    }

    setLoading(true)
    setError(null)
    setResponse(null)
    setCorsAnalysis(null)
    setResponseTab('body')

    const proxy = CORS_PROXIES[proxyIndex]
    const targetUrl = proxy.prefix ? `${proxy.prefix}${encodeURIComponent(url)}` : url
    const enabledHeaders = headers.filter(h => h.enabled && h.key.trim())

    const startTime = performance.now()

    try {
      const fetchOptions: RequestInit = {
        method,
        headers: {} as Record<string, string>,
        mode: 'cors',
      }

      for (const h of enabledHeaders) {
        if (h.key) (fetchOptions.headers as Record<string, string>)[h.key] = h.value
      }

      if (showBodyEditor && body.trim()) {
        fetchOptions.body = body
      }

      const res = await fetch(targetUrl, fetchOptions)
      const endTime = performance.now()
      const duration = Math.round(endTime - startTime)

      // 解析响应头
      const resHeaders: Record<string, string> = {}
      res.headers.forEach((value, key) => {
        resHeaders[key] = value
      })

      const text = await res.text()
      const size = new TextEncoder().encode(text).length

      const responseInfo: ResponseInfo = {
        status: res.status,
        statusText: res.statusText,
        headers: resHeaders,
        body: text,
        duration,
        size,
      }

      setResponse(responseInfo)
      setCorsAnalysis(analyzeCorsHeaders(resHeaders))

      // 保存到历史
      const record: RequestRecord = {
        id: `req-${Date.now()}`,
        url,
        method,
        headers: enabledHeaders.map(h => ({ ...h })),
        body: showBodyEditor ? body : undefined,
        status: res.status,
        statusText: res.statusText,
        responseHeaders: resHeaders,
        responseBody: text.length > 2000 ? text.slice(0, 2000) + '\n... (截断)' : text,
        duration,
        timestamp: Date.now(),
        corsAnalysis: analyzeCorsHeaders(resHeaders),
      }

      setHistory(prev => {
        const next = [record, ...prev].slice(0, MAX_HISTORY)
        saveHistory(next)
        return next
      })
    } catch (err: any) {
      const endTime = performance.now()
      const duration = Math.round(endTime - startTime)
      const errorMsg = err?.message || '请求失败'

      setError(errorMsg)

      const record: RequestRecord = {
        id: `req-${Date.now()}`,
        url,
        method,
        headers: enabledHeaders.map(h => ({ ...h })),
        body: showBodyEditor ? body : undefined,
        duration,
        timestamp: Date.now(),
        error: errorMsg,
      }

      setHistory(prev => {
        const next = [record, ...prev].slice(0, MAX_HISTORY)
        saveHistory(next)
        return next
      })
    } finally {
      setLoading(false)
    }
  }, [url, method, headers, body, proxyIndex, showBodyEditor])

  const clearHistory = useCallback(() => {
    setHistory([])
    saveHistory([])
    setExpandedHistoryId(null)
  }, [])

  const loadFromHistory = useCallback((record: RequestRecord) => {
    setUrl(record.url)
    setMethod(record.method)
    setHeaders(record.headers.length > 0 ? record.headers.map(h => ({ ...h, id: `h${Date.now()}-${Math.random()}` })) : [])
    if (record.body !== undefined) setBody(record.body)
  }, [])

  const tryPreFlight = useCallback(async () => {
    if (!url.trim()) {
      setError('请输入目标 URL')
      return
    }

    setLoading(true)
    setError(null)
    setResponse(null)
    setCorsAnalysis(null)
    setResponseTab('cors')

    const proxy = CORS_PROXIES[proxyIndex]
    const targetUrl = proxy.prefix ? `${proxy.prefix}${encodeURIComponent(url)}` : url
    const enabledHeaders = headers.filter(h => h.enabled && h.key.trim())

    const startTime = performance.now()

    try {
      const preflightHeaders: Record<string, string> = {}
      for (const h of enabledHeaders) {
        if (h.key) preflightHeaders[h.key] = h.value
      }

      // 确保有常见的 CORS 预检头
      if (!preflightHeaders['Access-Control-Request-Method']) {
        preflightHeaders['Access-Control-Request-Method'] = method
      }
      if (!preflightHeaders['Access-Control-Request-Headers']) {
        preflightHeaders['Access-Control-Request-Headers'] = enabledHeaders.map(h => h.key).join(', ')
      }

      const res = await fetch(targetUrl, {
        method: 'OPTIONS',
        headers: preflightHeaders,
        mode: 'cors',
      })
      const endTime = performance.now()
      const duration = Math.round(endTime - startTime)

      const resHeaders: Record<string, string> = {}
      res.headers.forEach((value, key) => {
        resHeaders[key] = value
      })

      const text = await res.text()
      const size = new TextEncoder().encode(text).length

      const responseInfo: ResponseInfo = {
        status: res.status,
        statusText: res.statusText,
        headers: resHeaders,
        body: text,
        duration,
        size,
      }

      setResponse(responseInfo)
      setCorsAnalysis(analyzeCorsHeaders(resHeaders))

      const record: RequestRecord = {
        id: `req-${Date.now()}`,
        url,
        method: 'GET' as HttpMethod,
        headers: enabledHeaders.map(h => ({ ...h })),
        status: res.status,
        statusText: res.statusText,
        responseHeaders: resHeaders,
        responseBody: text.length > 2000 ? text.slice(0, 2000) + '\n... (截断)' : text,
        duration,
        timestamp: Date.now(),
        corsAnalysis: analyzeCorsHeaders(resHeaders),
      }

      setHistory(prev => {
        const next = [record, ...prev].slice(0, MAX_HISTORY)
        saveHistory(next)
        return next
      })
    } catch (err: any) {
      setError(err?.message || '预检请求失败')
    } finally {
      setLoading(false)
    }
  }, [url, method, headers, proxyIndex])

  const styles = {
    container: {
      display: 'flex',
      flexDirection: 'column' as const,
      height: '100%',
      backgroundColor: '#1e1e2e',
      color: '#cdd6f4',
      fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, monospace',
      fontSize: '13px',
    },
    toolbar: {
      display: 'flex',
      alignItems: 'center',
      gap: '8px',
      padding: '8px 12px',
      borderBottom: '1px solid #313244',
      backgroundColor: '#181825',
    },
    title: {
      display: 'flex',
      alignItems: 'center',
      gap: '6px',
      fontWeight: 600,
      fontSize: '14px',
      color: '#89b4fa',
    },
    badge: {
      fontSize: '10px',
      padding: '1px 6px',
      borderRadius: '4px',
      backgroundColor: '#313244',
      color: '#a6adc8',
    },
    main: {
      display: 'flex',
      flex: 1,
      overflow: 'hidden',
    },
    leftPanel: {
      width: '45%',
      display: 'flex',
      flexDirection: 'column' as const,
      borderRight: '1px solid #313244',
      overflow: 'auto',
    },
    rightPanel: {
      width: '55%',
      display: 'flex',
      flexDirection: 'column' as const,
      overflow: 'auto',
    },
    section: {
      padding: '10px 12px',
      borderBottom: '1px solid #313244',
    },
    sectionTitle: {
      fontSize: '11px',
      fontWeight: 600,
      textTransform: 'uppercase' as const,
      letterSpacing: '0.5px',
      color: '#a6adc8',
      marginBottom: '6px',
    },
    urlRow: {
      display: 'flex',
      gap: '6px',
      alignItems: 'center',
    },
    methodSelect: {
      padding: '7px 8px',
      borderRadius: '6px',
      border: '1px solid #45475a',
      backgroundColor: '#313244',
      color: METHOD_COLORS[method],
      fontWeight: 700,
      fontSize: '13px',
      cursor: 'pointer',
      minWidth: '80px',
    },
    urlInput: {
      flex: 1,
      padding: '7px 10px',
      borderRadius: '6px',
      border: '1px solid #45475a',
      backgroundColor: '#313244',
      color: '#cdd6f4',
      fontSize: '13px',
      outline: 'none',
    },
    proxySelect: {
      padding: '7px 8px',
      borderRadius: '6px',
      border: '1px solid #45475a',
      backgroundColor: '#313244',
      color: '#cdd6f4',
      fontSize: '12px',
      cursor: 'pointer',
    },
    button: {
      padding: '7px 14px',
      borderRadius: '6px',
      border: 'none',
      fontSize: '13px',
      fontWeight: 600,
      cursor: 'pointer',
      display: 'flex',
      alignItems: 'center',
      gap: '5px',
      transition: 'all 0.15s',
    },
    sendBtn: {
      backgroundColor: '#89b4fa',
      color: '#1e1e2e',
    },
    preflightBtn: {
      backgroundColor: '#f9e2af',
      color: '#1e1e2e',
    },
    secondaryBtn: {
      backgroundColor: '#45475a',
      color: '#cdd6f4',
    },
    dangerBtn: {
      backgroundColor: '#45475a',
      color: '#f38ba8',
    },
    headerRow: {
      display: 'flex',
      gap: '6px',
      alignItems: 'center',
      marginBottom: '4px',
    },
    headerInput: {
      flex: 1,
      padding: '5px 8px',
      borderRadius: '4px',
      border: '1px solid #45475a',
      backgroundColor: '#181825',
      color: '#cdd6f4',
      fontSize: '12px',
      outline: 'none',
    },
    checkbox: {
      accentColor: '#89b4fa',
      cursor: 'pointer',
    },
    removeBtn: {
      background: 'none',
      border: 'none',
      color: '#f38ba8',
      cursor: 'pointer',
      padding: '2px',
      display: 'flex',
      alignItems: 'center',
    },
    bodyTextarea: {
      width: '100%',
      minHeight: '100px',
      padding: '8px',
      borderRadius: '6px',
      border: '1px solid #45475a',
      backgroundColor: '#181825',
      color: '#cdd6f4',
      fontSize: '12px',
      fontFamily: 'monospace',
      resize: 'vertical' as const,
      outline: 'none',
      boxSizing: 'border-box' as const,
    },
    statusBar: {
      display: 'flex',
      alignItems: 'center',
      gap: '12px',
      padding: '8px 12px',
      backgroundColor: '#181825',
      borderBottom: '1px solid #313244',
      fontSize: '12px',
    },
    statusBadge: (status: number) => ({
      padding: '2px 8px',
      borderRadius: '4px',
      fontWeight: 700,
      fontSize: '12px',
      backgroundColor: status >= 200 && status < 300 ? '#a6e3a133' : status >= 400 ? '#f38ba833' : '#f9e2af33',
      color: status >= 200 && status < 300 ? '#a6e3a1' : status >= 400 ? '#f38ba8' : '#f9e2af',
    }),
    tabRow: {
      display: 'flex',
      borderBottom: '1px solid #313244',
    },
    tab: (active: boolean) => ({
      padding: '8px 16px',
      fontSize: '12px',
      fontWeight: active ? 600 : 400,
      color: active ? '#89b4fa' : '#6c7086',
      borderBottom: active ? '2px solid #89b4fa' : '2px solid transparent',
      cursor: 'pointer',
      background: 'none',
      border: 'none',
      borderBottomWidth: '2px',
      borderBottomStyle: 'solid' as const,
    }),
    responseBody: {
      flex: 1,
      padding: '12px',
      overflow: 'auto',
      fontFamily: 'monospace',
      fontSize: '12px',
      whiteSpace: 'pre-wrap' as const,
      wordBreak: 'break-all' as const,
      lineHeight: '1.5',
    },
    headerTable: {
      width: '100%',
      borderCollapse: 'collapse' as const,
      fontSize: '12px',
    },
    headerTableTd: {
      padding: '5px 10px',
      borderBottom: '1px solid #313244',
      verticalAlign: 'top' as const,
    },
    corsSection: {
      padding: '12px',
    },
    corsCard: {
      padding: '10px 12px',
      borderRadius: '6px',
      backgroundColor: '#181825',
      marginBottom: '8px',
      border: '1px solid #313244',
    },
    corsLabel: {
      fontSize: '11px',
      color: '#a6adc8',
      marginBottom: '2px',
    },
    corsValue: {
      fontSize: '13px',
      color: '#cdd6f4',
      fontFamily: 'monospace',
    },
    historySection: {
      borderTop: '1px solid #313244',
      backgroundColor: '#181825',
    },
    historyHeader: {
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      padding: '8px 12px',
      cursor: 'pointer',
      userSelect: 'none' as const,
    },
    historyItem: {
      padding: '8px 12px',
      borderBottom: '1px solid #313244',
      cursor: 'pointer',
      transition: 'background 0.1s',
    },
    historyItemExpanded: {
      backgroundColor: '#31324422',
    },
    historyMeta: {
      display: 'flex',
      alignItems: 'center',
      gap: '8px',
      fontSize: '12px',
    },
    methodBadge: (m: string) => ({
      fontSize: '10px',
      fontWeight: 700,
      padding: '1px 5px',
      borderRadius: '3px',
      backgroundColor: `${METHOD_COLORS[m as HttpMethod] || '#cdd6f4'}22`,
      color: METHOD_COLORS[m as HttpMethod] || '#cdd6f4',
    }),
    statusDot: (status: number) => ({
      width: '6px',
      height: '6px',
      borderRadius: '50%',
      backgroundColor: status >= 200 && status < 300 ? '#a6e3a1' : status >= 400 ? '#f38ba8' : '#f9e2af',
      display: 'inline-block',
    }),
    emptyState: {
      display: 'flex',
      flexDirection: 'column' as const,
      alignItems: 'center',
      justifyContent: 'center',
      height: '100%',
      color: '#6c7086',
      gap: '8px',
      padding: '40px',
      textAlign: 'center' as const,
    },
    errorBanner: {
      padding: '8px 12px',
      backgroundColor: '#f38ba822',
      borderLeft: '3px solid #f38ba8',
      color: '#f38ba8',
      fontSize: '12px',
      display: 'flex',
      alignItems: 'center',
      gap: '6px',
    },
  }

  return (
    <div style={styles.container}>
      {/* 工具栏 */}
      <div style={styles.toolbar}>
        <div style={styles.title}>
          <Globe size={16} />
          CORS Proxy 调试工具
        </div>
        <span style={styles.badge}>开发者工具</span>
        <div style={{ flex: 1 }} />
        <span style={{ fontSize: '11px', color: '#6c7086' }}>
          跨域请求调试 · CORS 策略分析
        </span>
      </div>

      <div style={styles.main}>
        {/* 左侧：请求构建 */}
        <div style={styles.leftPanel}>
          {/* URL 与方法 */}
          <div style={styles.section}>
            <div style={styles.sectionTitle}>请求配置</div>
            <div style={styles.urlRow}>
              <select
                value={method}
                onChange={e => setMethod(e.target.value as HttpMethod)}
                style={styles.methodSelect}
              >
                <option value="GET">GET</option>
                <option value="POST">POST</option>
                <option value="PUT">PUT</option>
                <option value="DELETE">DELETE</option>
                <option value="PATCH">PATCH</option>
              </select>
              <input
                type="text"
                value={url}
                onChange={e => setUrl(e.target.value)}
                placeholder="https://api.example.com/data"
                style={styles.urlInput}
                onKeyDown={e => e.key === 'Enter' && sendRequest()}
              />
            </div>
          </div>

          {/* 代理选择 */}
          <div style={styles.section}>
            <div style={styles.sectionTitle}>CORS 代理</div>
            <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' as const }}>
              {CORS_PROXIES.map((p, i) => (
                <button
                  key={i}
                  onClick={() => setProxyIndex(i)}
                  style={{
                    ...styles.button,
                    ...(proxyIndex === i ? styles.sendBtn : styles.secondaryBtn),
                    fontSize: '11px',
                    padding: '5px 10px',
                  }}
                >
                  {p.name}
                </button>
              ))}
            </div>
            <div style={{ marginTop: '6px', fontSize: '11px', color: '#6c7086' }}>
              {proxyIndex === 0
                ? '直连模式：部分 API 支持 CORS，跨域行为取决于目标服务器配置'
                : `使用代理：${CORS_PROXIES[proxyIndex].name}，请求将通过第三方代理转发`}
            </div>
          </div>

          {/* 请求头 */}
          <div style={styles.section}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '6px' }}>
              <div style={styles.sectionTitle}>请求头</div>
              <button onClick={addHeader} style={{ ...styles.button, ...styles.secondaryBtn, fontSize: '11px', padding: '3px 8px' }}>
                + 添加
              </button>
            </div>
            {headers.map(h => (
              <div key={h.id} style={styles.headerRow}>
                <input
                  type="checkbox"
                  checked={h.enabled}
                  onChange={e => updateHeader(h.id, 'enabled', e.target.checked)}
                  style={styles.checkbox}
                />
                <input
                  type="text"
                  value={h.key}
                  onChange={e => updateHeader(h.id, 'key', e.target.value)}
                  placeholder="Header Name"
                  style={{ ...styles.headerInput, flex: 2 }}
                />
                <input
                  type="text"
                  value={h.value}
                  onChange={e => updateHeader(h.id, 'value', e.target.value)}
                  placeholder="Header Value"
                  style={{ ...styles.headerInput, flex: 3 }}
                />
                <button onClick={() => removeHeader(h.id)} style={styles.removeBtn}>
                  <Trash2 size={14} />
                </button>
              </div>
            ))}
          </div>

          {/* 请求体 */}
          {showBodyEditor && (
            <div style={styles.section}>
              <div style={styles.sectionTitle}>请求体</div>
              <textarea
                value={body}
                onChange={e => setBody(e.target.value)}
                placeholder={method === 'POST' ? '{"key": "value"}' : '请求体内容...'}
                style={styles.bodyTextarea}
              />
            </div>
          )}

          {/* 发送按钮 */}
          <div style={{ ...styles.section, display: 'flex', gap: '8px' }}>
            <button
              onClick={sendRequest}
              disabled={loading}
              style={{
                ...styles.button,
                ...styles.sendBtn,
                opacity: loading ? 0.6 : 1,
                flex: 1,
                justifyContent: 'center',
              }}
            >
              <Send size={14} />
              {loading ? '发送中...' : '发送请求'}
            </button>
            <button
              onClick={tryPreFlight}
              disabled={loading}
              style={{
                ...styles.button,
                ...styles.preflightBtn,
                opacity: loading ? 0.6 : 1,
              }}
            >
              <AlertTriangle size={14} />
              预检分析
            </button>
          </div>

          {/* 提示 */}
          <div style={{ ...styles.section, fontSize: '11px', color: '#6c7086', lineHeight: '1.6' }}>
            <AlertTriangle size={12} style={{ display: 'inline', verticalAlign: 'middle', marginRight: '4px' }} />
            提示：实际跨域行为取决于目标服务器的 CORS 策略。公共 CORS 代理可绕过部分限制用于调试，
            但生产环境请确保服务器正确配置 CORS 响应头。
          </div>
        </div>

        {/* 右侧：响应展示 */}
        <div style={styles.rightPanel}>
          {error && (
            <div style={styles.errorBanner}>
              <XCircle size={14} />
              {error}
            </div>
          )}

          {response && (
            <>
              {/* 状态栏 */}
              <div style={styles.statusBar}>
                <span style={styles.statusBadge(response.status)}>
                  {response.status} {response.statusText}
                </span>
                <span style={{ color: '#a6adc8' }}>
                  <Clock size={12} style={{ display: 'inline', verticalAlign: 'middle', marginRight: '3px' }} />
                  {response.duration}ms
                </span>
                <span style={{ color: '#a6adc8' }}>
                  {formatBytes(response.size)}
                </span>
                {corsAnalysis && (
                  <span style={{ color: corsAnalysis.isCorsEnabled ? '#a6e3a1' : '#fab387', display: 'flex', alignItems: 'center', gap: '4px' }}>
                    {corsAnalysis.isCorsEnabled ? <CheckCircle size={12} /> : <AlertTriangle size={12} />}
                    CORS: {corsAnalysis.isCorsEnabled ? '已启用' : '未检测到'}
                  </span>
                )}
              </div>

              {/* 标签页 */}
              <div style={styles.tabRow}>
                <button style={styles.tab(responseTab === 'body')} onClick={() => setResponseTab('body')}>
                  响应体
                </button>
                <button style={styles.tab(responseTab === 'headers')} onClick={() => setResponseTab('headers')}>
                  响应头 ({Object.keys(response.headers).length})
                </button>
                <button style={styles.tab(responseTab === 'cors')} onClick={() => setResponseTab('cors')}>
                  CORS 分析
                </button>
              </div>

              {/* 标签内容 */}
              {responseTab === 'body' && (
                <div style={styles.responseBody}>
                  {(() => {
                    try {
                      return JSON.stringify(JSON.parse(response.body), null, 2)
                    } catch {
                      return response.body || '(空响应)'
                    }
                  })()}
                </div>
              )}

              {responseTab === 'headers' && (
                <div style={{ padding: '12px' }}>
                  <table style={styles.headerTable}>
                    <tbody>
                      {Object.entries(response.headers).map(([key, value]) => (
                        <tr key={key}>
                          <td style={{ ...styles.headerTableTd, color: '#89b4fa', fontWeight: 600, whiteSpace: 'nowrap' as const }}>
                            {key}
                          </td>
                          <td style={styles.headerTableTd}>{value}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}

              {responseTab === 'cors' && corsAnalysis && (
                <div style={styles.corsSection}>
                  <div style={{
                    ...styles.corsCard,
                    borderLeft: `3px solid ${corsAnalysis.isCorsEnabled ? '#a6e3a1' : '#f9e2af'}`,
                  }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '6px' }}>
                      {corsAnalysis.isCorsEnabled ? (
                        <CheckCircle size={16} color="#a6e3a1" />
                      ) : (
                        <AlertTriangle size={16} color="#f9e2af" />
                      )}
                      <span style={{ fontWeight: 600, color: corsAnalysis.isCorsEnabled ? '#a6e3a1' : '#f9e2af' }}>
                        {corsAnalysis.isCorsEnabled ? 'CORS 策略已配置' : '未检测到 CORS 策略'}
                      </span>
                    </div>
                    <div style={{ fontSize: '12px', color: '#a6adc8', lineHeight: '1.6' }}>
                      {corsAnalysis.verdict}
                    </div>
                  </div>

                  <div style={{ marginTop: '10px' }}>
                    <div style={styles.sectionTitle}>CORS 响应头详情</div>
                    {CORS_HEADERS.map(headerName => {
                      const value = response.headers[headerName] || response.headers[headerName.toLowerCase()]
                      return (
                        <div key={headerName} style={styles.corsCard}>
                          <div style={styles.corsLabel}>{headerName}</div>
                          <div style={{
                            ...styles.corsValue,
                            color: value ? '#a6e3a1' : '#6c7086',
                          }}>
                            {value || '未设置'}
                          </div>
                        </div>
                      )
                    })}
                  </div>

                  <div style={{ marginTop: '10px' }}>
                    <div style={styles.sectionTitle}>常见 CORS 问题排查</div>
                    <div style={{ fontSize: '12px', color: '#a6adc8', lineHeight: '1.8' }}>
                      <div>• <strong style={{ color: '#f38ba8' }}>No 'Access-Control-Allow-Origin'</strong> — 服务器未返回 CORS 头，检查服务器配置</div>
                      <div>• <strong style={{ color: '#f9e2af' }}>Origin not allowed</strong> — 请求来源不在白名单中，检查服务器允许的来源</div>
                      <div>• <strong style={{ color: '#89b4fa' }}>Method not allowed</strong> — 请求方法未被允许，检查 Access-Control-Allow-Methods</div>
                      <div>• <strong style={{ color: '#cba6f7' }}>Header not allowed</strong> — 自定义头未被允许，检查 Access-Control-Allow-Headers</div>
                      <div>• <strong style={{ color: '#f38ba8' }}>Credentials not supported</strong> — 携带凭证时不能使用 * 作为 Origin</div>
                    </div>
                  </div>
                </div>
              )}
            </>
          )}

          {!response && !error && !loading && (
            <div style={styles.emptyState}>
              <Globe size={48} strokeWidth={1} />
              <div style={{ fontSize: '14px', fontWeight: 500 }}>发送请求以查看响应</div>
              <div style={{ fontSize: '12px' }}>
                输入 URL 并点击发送，工具将自动分析 CORS 响应头
              </div>
              <div style={{ marginTop: '16px', display: 'flex', flexDirection: 'column' as const, gap: '6px', fontSize: '11px', color: '#585b70' }}>
                <span>支持 GET / POST / PUT / DELETE / PATCH</span>
                <span>支持自定义请求头和请求体</span>
                <span>支持 CORS 预检请求分析</span>
              </div>
            </div>
          )}

          {loading && (
            <div style={styles.emptyState}>
              <div style={{
                width: '32px',
                height: '32px',
                border: '3px solid #313244',
                borderTopColor: '#89b4fa',
                borderRadius: '50%',
                animation: 'spin 0.8s linear infinite',
              }} />
              <div style={{ fontSize: '13px' }}>正在发送请求...</div>
            </div>
          )}
        </div>
      </div>

      {/* 底部：请求历史 */}
      <div style={styles.historySection}>
        <div
          style={styles.historyHeader}
          onClick={() => setHistoryExpanded(!historyExpanded)}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '13px', fontWeight: 500 }}>
            {historyExpanded ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
            <Clock size={14} />
            请求历史 ({history.length})
          </div>
          {history.length > 0 && (
            <button
              onClick={e => { e.stopPropagation(); clearHistory() }}
              style={{ ...styles.button, ...styles.dangerBtn, fontSize: '11px', padding: '3px 8px' }}
            >
              <Trash2 size={12} />
              清空
            </button>
          )}
        </div>

        {historyExpanded && (
          <div style={{ maxHeight: '250px', overflow: 'auto' }}>
            {history.length === 0 ? (
              <div style={{ padding: '16px', textAlign: 'center', color: '#6c7086', fontSize: '12px' }}>
                暂无历史记录
              </div>
            ) : (
              history.map(record => (
                <div
                  key={record.id}
                  style={{
                    ...styles.historyItem,
                    ...(expandedHistoryId === record.id ? styles.historyItemExpanded : {}),
                  }}
                  onClick={() => setExpandedHistoryId(expandedHistoryId === record.id ? null : record.id)}
                >
                  <div style={styles.historyMeta}>
                    {expandedHistoryId === record.id ? <ChevronDown size={12} /> : <ChevronRight size={12} />}
                    <span style={styles.methodBadge(record.method)}>{record.method}</span>
                    <span style={{
                      ...styles.statusDot(record.status || 0),
                      display: record.status ? 'inline-block' : 'none',
                    }} />
                    <span style={{ color: record.status ? '#cdd6f4' : '#f38ba8' }}>
                      {record.status ? `${record.status} ${record.statusText}` : record.error || '错误'}
                    </span>
                    <span style={{
                      flex: 1,
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      whiteSpace: 'nowrap' as const,
                      color: '#6c7086',
                      fontSize: '11px',
                    }}>
                      {record.url}
                    </span>
                    {record.duration !== undefined && (
                      <span style={{ color: '#a6adc8', fontSize: '11px' }}>{record.duration}ms</span>
                    )}
                    {record.corsAnalysis && (
                      <span style={{
                        fontSize: '10px',
                        padding: '1px 5px',
                        borderRadius: '3px',
                        backgroundColor: record.corsAnalysis.isCorsEnabled ? '#a6e3a122' : '#f9e2af22',
                        color: record.corsAnalysis.isCorsEnabled ? '#a6e3a1' : '#f9e2af',
                      }}>
                        CORS {record.corsAnalysis.isCorsEnabled ? '✓' : '✗'}
                      </span>
                    )}
                    <span style={{ color: '#585b70', fontSize: '10px' }}>
                      {formatTimestamp(record.timestamp)}
                    </span>
                  </div>

                  {expandedHistoryId === record.id && (
                    <div style={{ marginTop: '8px', paddingLeft: '18px' }}>
                      <div style={{ display: 'flex', gap: '6px', marginBottom: '6px' }}>
                        <button
                          onClick={e => { e.stopPropagation(); loadFromHistory(record) }}
                          style={{ ...styles.button, ...styles.secondaryBtn, fontSize: '11px', padding: '3px 8px' }}
                        >
                          加载到编辑器
                        </button>
                      </div>
                      {record.responseHeaders && (
                        <div style={{ fontSize: '11px', color: '#a6adc8', lineHeight: '1.6' }}>
                          <strong style={{ color: '#89b4fa' }}>CORS 头：</strong>
                          {CORS_HEADERS.map(h => {
                            const val = record.responseHeaders![h] || record.responseHeaders![h.toLowerCase()]
                            return val ? (
                              <div key={h} style={{ paddingLeft: '8px' }}>
                                {h}: <span style={{ color: '#a6e3a1' }}>{val}</span>
                              </div>
                            ) : null
                          })}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              ))
            )}
          </div>
        )}
      </div>

      {/* 旋转动画 CSS */}
      <style>{`
        @keyframes spin {
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  )
}

export default CORSProxy
