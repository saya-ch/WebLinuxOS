import { useState, useEffect, useCallback, useRef, useMemo } from 'react'
import {
  Clock, Trash2, Globe, AlertCircle, CheckCircle,
  Copy, Download, Code, Key, Shield, Zap, History,
  ChevronDown, X, Plus, Trash, Eye, EyeOff, FileJson, FileText,
  FormInput, Cpu, Lightbulb, Play, RotateCcw
} from 'lucide-react'

type HttpMethod = 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH'
type BodyType = 'none' | 'json' | 'form-data' | 'text'
type AuthType = 'none' | 'bearer' | 'apikey'
type CodeFormat = 'fetch' | 'axios' | 'curl'

interface HeaderEntry {
  id: string
  key: string
  value: string
  enabled: boolean
}

interface HistoryRecord {
  id: string
  method: HttpMethod
  url: string
  headers: HeaderEntry[]
  body: string
  bodyType: BodyType
  auth: AuthType
  authToken: string
  authHeaderName: string
  status: number
  time: number
  timestamp: number
}

interface ApiResponse {
  status: number
  statusText: string
  headers: Record<string, string>
  body: string
  time: number
  size: number
  ok: boolean
  contentType: string
}

interface TemplateApi {
  id: string
  name: string
  description: string
  method: HttpMethod
  url: string
  headers: HeaderEntry[]
  body: string
  bodyType: BodyType
  category: string
}

const STORAGE_KEY = 'weblinux-api-debugger-history'
const MAX_HISTORY = 30

const API_TEMPLATES: TemplateApi[] = [
  {
    id: 'github-user',
    name: 'GitHub 用户信息',
    description: '获取 GitHub 用户公开资料',
    method: 'GET',
    url: 'https://api.github.com/users/octocat',
    headers: [{ id: '1', key: 'Accept', value: 'application/vnd.github+json', enabled: true }],
    body: '',
    bodyType: 'none',
    category: 'GitHub',
  },
  {
    id: 'github-repo',
    name: 'GitHub 仓库信息',
    description: '获取指定仓库的详细信息',
    method: 'GET',
    url: 'https://api.github.com/repos/facebook/react',
    headers: [{ id: '1', key: 'Accept', value: 'application/vnd.github+json', enabled: true }],
    body: '',
    bodyType: 'none',
    category: 'GitHub',
  },
  {
    id: 'github-search',
    name: 'GitHub 搜索仓库',
    description: '按关键词搜索 GitHub 仓库',
    method: 'GET',
    url: 'https://api.github.com/search/repositories?q=react+typescript&sort=stars&per_page=5',
    headers: [{ id: '1', key: 'Accept', value: 'application/vnd.github+json', enabled: true }],
    body: '',
    bodyType: 'none',
    category: 'GitHub',
  },
  {
    id: 'jsonplaceholder-posts',
    name: 'JSONPlaceholder 文章列表',
    description: '获取模拟 REST API 文章列表',
    method: 'GET',
    url: 'https://jsonplaceholder.typicode.com/posts',
    headers: [],
    body: '',
    bodyType: 'none',
    category: 'JSONPlaceholder',
  },
  {
    id: 'jsonplaceholder-create',
    name: 'JSONPlaceholder 创建文章',
    description: '向模拟 API 发送 POST 请求',
    method: 'POST',
    url: 'https://jsonplaceholder.typicode.com/posts',
    headers: [{ id: '1', key: 'Content-Type', value: 'application/json', enabled: true }],
    body: '{\n  "title": "foo",\n  "body": "bar",\n  "userId": 1\n}',
    bodyType: 'json',
    category: 'JSONPlaceholder',
  },
  {
    id: 'weather',
    name: 'Open-Meteo 天气',
    description: '获取北京实时天气数据',
    method: 'GET',
    url: 'https://api.open-meteo.com/v1/forecast?latitude=39.9&longitude=116.4&current_weather=true&language=zh',
    headers: [],
    body: '',
    bodyType: 'none',
    category: '天气',
  },
  {
    id: 'weather-forecast',
    name: 'Open-Meteo 7天预报',
    description: '获取未来7天天气预报',
    method: 'GET',
    url: 'https://api.open-meteo.com/v1/forecast?latitude=39.9&longitude=116.4&daily=temperature_2m_max,temperature_2m_min,weathercode&timezone=Asia%2FShanghai',
    headers: [],
    body: '',
    bodyType: 'none',
    category: '天气',
  },
  {
    id: 'currency',
    name: '汇率查询',
    description: '获取实时货币汇率数据',
    method: 'GET',
    url: 'https://api.frankfurter.app/latest?from=USD&to=CNY,EUR,JPY,GBP',
    headers: [],
    body: '',
    bodyType: 'none',
    category: '汇率',
  },
  {
    id: 'ip-lookup',
    name: 'IP 地理位置查询',
    description: '查询当前 IP 的地理信息',
    method: 'GET',
    url: 'https://ipapi.co/json/',
    headers: [],
    body: '',
    bodyType: 'none',
    category: '网络',
  },
  {
    id: 'joke',
    name: '编程笑话',
    description: '获取随机编程笑话',
    method: 'GET',
    url: 'https://v2.jokeapi.dev/joke/Programming?safe-mode',
    headers: [],
    body: '',
    bodyType: 'none',
    category: '娱乐',
  },
]

const getMethodColor = (method: HttpMethod): string => {
  const map: Record<HttpMethod, string> = {
    GET: '#a6e3a1',
    POST: '#89b4fa',
    PUT: '#f9e2af',
    DELETE: '#f38ba8',
    PATCH: '#cba6f7',
  }
  return map[method] || '#cdd6f4'
}

const getStatusColor = (status: number): string => {
  if (status === 0) return '#f38ba8'
  if (status < 300) return '#a6e3a1'
  if (status < 400) return '#89b4fa'
  if (status < 500) return '#f9e2af'
  return '#f38ba8'
}

const generateId = () => Math.random().toString(36).slice(2, 10)

const parseBody = (body: string, bodyType: BodyType): BodyInit | undefined => {
  if (bodyType === 'none' || !body.trim()) return undefined
  if (bodyType === 'json' || bodyType === 'text') return body
  if (bodyType === 'form-data') {
    try {
      const formData = new FormData()
      const parsed = JSON.parse(body)
      if (parsed && typeof parsed === 'object') {
        Object.entries(parsed).forEach(([k, v]) => {
          formData.append(k, String(v))
        })
      }
      return formData
    } catch {
      return body
    }
  }
  return body
}

const formatJson = (text: string): string => {
  try {
    return JSON.stringify(JSON.parse(text), null, 2)
  } catch {
    return text
  }
}

const generateCode = (
  format: CodeFormat,
  method: HttpMethod,
  url: string,
  headers: HeaderEntry[],
  body: string,
  bodyType: BodyType,
  auth: AuthType,
  authToken: string,
  authHeaderName: string
): string => {
  const activeHeaders = headers.filter((h) => h.enabled && h.key.trim())
  const allHeaders: HeaderEntry[] = [...activeHeaders]
  if (auth === 'bearer' && authToken) {
    allHeaders.push({ id: 'auth', key: 'Authorization', value: `Bearer ${authToken}`, enabled: true })
  } else if (auth === 'apikey' && authToken) {
    allHeaders.push({ id: 'auth', key: authHeaderName || 'X-API-Key', value: authToken, enabled: true })
  }

  const headerObj: Record<string, string> = {}
  allHeaders.forEach((h) => { headerObj[h.key] = h.value })

  const hasBody = !['GET', 'HEAD'].includes(method) && body.trim() && bodyType !== 'none'

  if (format === 'curl') {
    let cmd = `curl -X ${method} '${url}'`
    allHeaders.forEach((h) => {
      cmd += ` \\\n  -H '${h.key}: ${h.value}'`
    })
    if (hasBody) {
      const bodyContent = bodyType === 'json' ? body : body
      cmd += ` \\\n  -d '${bodyContent.replace(/'/g, "'\\''")}'`
    }
    return cmd
  }

  if (format === 'axios') {
    const lines: string[] = []
    lines.push(`import axios from 'axios'`)
    lines.push('')
    lines.push(`const response = await axios.${method.toLowerCase()}('${url}', {`)
    if (Object.keys(headerObj).length > 0) {
      lines.push(`  headers: ${JSON.stringify(headerObj, null, 2)},`)
    }
    if (hasBody) {
      if (bodyType === 'json') {
        lines.push(`  data: ${body},`)
      } else {
        lines.push(`  data: \`${body}\`,`)
      }
    }
    lines.push(`})`)
    lines.push('')
    lines.push(`console.log(response.data)`)
    return lines.join('\n')
  }

  // fetch
  const lines: string[] = []
  lines.push(`const response = await fetch('${url}', {`)
  lines.push(`  method: '${method}',`)
  if (Object.keys(headerObj).length > 0) {
    lines.push(`  headers: ${JSON.stringify(headerObj, null, 2)},`)
  }
  if (hasBody) {
    const bodyStr = bodyType === 'json' ? body : `\`${body}\``
    lines.push(`  body: ${bodyStr},`)
  }
  lines.push(`})`)
  lines.push('')
  lines.push(`const data = await response.json()`)
  lines.push(`console.log(data)`)
  return lines.join('\n')
}

const SimpleJsonHighlighter: React.FC<{ code: string }> = ({ code }) => {
  const lines = code.split('\n')
  return (
    <pre style={{ margin: 0, padding: 0, fontFamily: 'monospace', fontSize: 12, lineHeight: 1.6, overflow: 'auto', whiteSpace: 'pre-wrap', wordBreak: 'break-all' }}>
      {lines.map((line, i) => {
        const highlighted = line
          .replace(/(".*?"|'.*?')(\s*:)/g, '<span style="color:#89b4fa">$1</span>$2')
          .replace(/:\s*("(?:[^"\\]|\\.)*")/g, ': <span style="color:#a6e3a1">$1</span>')
          .replace(/:\s*(true|false|null)/g, ': <span style="color:#cba6f7">$1</span>')
          .replace(/:\s*(-?\d+\.?\d*)/g, ': <span style="color:#f9e2af">$1</span>')
        return (
          <div key={i} dangerouslySetInnerHTML={{ __html: highlighted || '&nbsp;' }} />
        )
      })}
    </pre>
  )
}

export default function APIDebugger() {
  const [method, setMethod] = useState<HttpMethod>('GET')
  const [url, setUrl] = useState('https://jsonplaceholder.typicode.com/todos/1')
  const [headers, setHeaders] = useState<HeaderEntry[]>([
    { id: generateId(), key: 'Accept', value: 'application/json', enabled: true },
  ])
  const [body, setBody] = useState('')
  const [bodyType, setBodyType] = useState<BodyType>('none')
  const [authType, setAuthType] = useState<AuthType>('none')
  const [authToken, setAuthToken] = useState('')
  const [authHeaderName, setAuthHeaderName] = useState('X-API-Key')
  const [showToken, setShowToken] = useState(false)

  const [loading, setLoading] = useState(false)
  const [response, setResponse] = useState<ApiResponse | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [history, setHistory] = useState<HistoryRecord[]>(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY)
      return raw ? JSON.parse(raw) : []
    } catch {
      return []
    }
  })

  const [activeTab, setActiveTab] = useState<'params' | 'headers' | 'body' | 'auth'>('params')
  const [responseTab, setResponseTab] = useState<'body' | 'headers'>('body')
  const [sideTab, setSideTab] = useState<'templates' | 'history'>('templates')
  const [codeFormat, setCodeFormat] = useState<CodeFormat>('fetch')
  const [copied, setCopied] = useState(false)
  const [activeTemplateId, setActiveTemplateId] = useState<string | null>(null)

  const abortRef = useRef<AbortController | null>(null)

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(history.slice(0, MAX_HISTORY)))
  }, [history])

  const addHeader = useCallback(() => {
    setHeaders((prev) => [...prev, { id: generateId(), key: '', value: '', enabled: true }])
  }, [])

  const updateHeader = useCallback((id: string, field: 'key' | 'value' | 'enabled', value: string | boolean) => {
    setHeaders((prev) => prev.map((h) => (h.id === id ? { ...h, [field]: value } : h)))
  }, [])

  const removeHeader = useCallback((id: string) => {
    setHeaders((prev) => prev.filter((h) => h.id !== id))
  }, [])

  const loadTemplate = useCallback((template: TemplateApi) => {
    setMethod(template.method)
    setUrl(template.url)
    setHeaders(template.headers.map((h) => ({ ...h })))
    setBody(template.body)
    setBodyType(template.bodyType)
    setAuthType('none')
    setAuthToken('')
    setActiveTemplateId(template.id)
    setResponse(null)
    setError(null)
  }, [])

  const loadHistory = useCallback((record: HistoryRecord) => {
    setMethod(record.method)
    setUrl(record.url)
    setHeaders(record.headers.map((h) => ({ ...h })))
    setBody(record.body)
    setBodyType(record.bodyType)
    setAuthType(record.auth)
    setAuthToken(record.authToken)
    setAuthHeaderName(record.authHeaderName)
    setResponse(null)
    setError(null)
  }, [])

  const sendRequest = useCallback(async () => {
    if (!url.trim()) {
      setError('请输入请求 URL')
      return
    }

    setLoading(true)
    setResponse(null)
    setError(null)

    if (abortRef.current) abortRef.current.abort()
    const controller = new AbortController()
    abortRef.current = controller

    const startTime = performance.now()

    try {
      const headerObj: Record<string, string> = {}
      headers.filter((h) => h.enabled && h.key.trim()).forEach((h) => {
        headerObj[h.key] = h.value
      })

      if (authType === 'bearer' && authToken) {
        headerObj['Authorization'] = `Bearer ${authToken}`
      } else if (authType === 'apikey' && authToken) {
        headerObj[authHeaderName || 'X-API-Key'] = authToken
      }

      const options: RequestInit = {
        method,
        headers: headerObj,
        signal: controller.signal,
      }

      const parsedBody = parseBody(body, bodyType)
      if (parsedBody && !['GET', 'HEAD'].includes(method)) {
        options.body = parsedBody
      }

      if (bodyType === 'json' && parsedBody && !headerObj['Content-Type']) {
        headerObj['Content-Type'] = 'application/json'
        options.headers = headerObj
      }

      const res = await fetch(url.trim(), options)
      const responseHeaders: Record<string, string> = {}
      res.headers.forEach((value, key) => {
        responseHeaders[key] = value
      })

      const text = await res.text()
      const time = Math.round(performance.now() - startTime)
      const size = new Blob([text]).size
      const contentType = res.headers.get('content-type') || ''

      const formattedBody = contentType.includes('json')
        ? formatJson(text)
        : text

      const responseData: ApiResponse = {
        status: res.status,
        statusText: res.statusText,
        headers: responseHeaders,
        body: formattedBody,
        time,
        size,
        ok: res.ok,
        contentType,
      }

      setResponse(responseData)

      const record: HistoryRecord = {
        id: generateId(),
        method,
        url: url.trim(),
        headers: headers.map((h) => ({ ...h })),
        body,
        bodyType,
        auth: authType,
        authToken,
        authHeaderName,
        status: res.status,
        time,
        timestamp: Date.now(),
      }
      setHistory((prev) => [record, ...prev].slice(0, MAX_HISTORY))
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err)
      if (message.includes('abort')) return
      setError(message)
    } finally {
      setLoading(false)
      abortRef.current = null
    }
  }, [url, method, headers, body, bodyType, authType, authToken, authHeaderName])

  const cancelRequest = useCallback(() => {
    abortRef.current?.abort()
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
    const ext = response.contentType.includes('json') ? 'json' : 'txt'
    const blob = new Blob([response.body], { type: 'application/octet-stream' })
    const a = document.createElement('a')
    a.href = URL.createObjectURL(blob)
    a.download = `response-${Date.now()}.${ext}`
    a.click()
    URL.revokeObjectURL(a.href)
  }, [response])

  const generatedCode = useMemo(
    () => generateCode(codeFormat, method, url, headers, body, bodyType, authType, authToken, authHeaderName),
    [codeFormat, method, url, headers, body, bodyType, authType, authToken, authHeaderName]
  )

  const copyCode = useCallback(() => {
    navigator.clipboard.writeText(generatedCode).then(() => {
      setCopied(true)
      setTimeout(() => setCopied(false), 1500)
    })
  }, [generatedCode])

  const bodyDisabled = ['GET', 'HEAD'].includes(method)
  const needsBody = !bodyDisabled

  const sidebarGroups = useMemo(() => {
    const groups: Record<string, TemplateApi[]> = {}
    API_TEMPLATES.forEach((t) => {
      if (!groups[t.category]) groups[t.category] = []
      groups[t.category].push(t)
    })
    return groups
  }, [])

  const inputStyle: React.CSSProperties = {
    width: '100%',
    padding: '10px 14px',
    background: 'rgba(49, 50, 68, 0.6)',
    border: '1px solid rgba(69, 71, 90, 0.8)',
    borderRadius: 10,
    color: '#cdd6f4',
    fontSize: 13,
    outline: 'none',
    backdropFilter: 'blur(12px)',
    WebkitBackdropFilter: 'blur(12px)',
    transition: 'border-color 0.2s, box-shadow 0.2s',
  }

  const glassCardStyle: React.CSSProperties = {
    background: 'rgba(30, 30, 46, 0.6)',
    border: '1px solid rgba(69, 71, 90, 0.5)',
    borderRadius: 12,
    backdropFilter: 'blur(16px)',
    WebkitBackdropFilter: 'blur(16px)',
    boxShadow: '0 4px 24px rgba(0, 0, 0, 0.2)',
  }

  const tabButton = (key: typeof activeTab, label: string, icon?: React.ReactNode) => (
    <button
      onClick={() => setActiveTab(key)}
      style={{
        padding: '8px 14px',
        border: 'none',
        background: activeTab === key ? 'rgba(137, 180, 250, 0.15)' : 'transparent',
        color: activeTab === key ? '#89b4fa' : '#a6adc8',
        borderRadius: 8,
        cursor: 'pointer',
        fontSize: 12,
        fontWeight: activeTab === key ? 600 : 500,
        display: 'flex',
        alignItems: 'center',
        gap: 6,
        transition: 'all 0.2s',
      }}
    >
      {icon} {label}
    </button>
  )

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        height: '100%',
        background: 'linear-gradient(135deg, #1a1b26 0%, #24283b 50%, #1f2335 100%)',
        color: '#cdd6f4',
        fontSize: 13,
        overflow: 'hidden',
      }}
    >
      <div
        style={{
          padding: '14px 20px',
          borderBottom: '1px solid rgba(69, 71, 90, 0.4)',
          background: 'rgba(24, 24, 37, 0.5)',
          backdropFilter: 'blur(12px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div
            style={{
              width: 36,
              height: 36,
              borderRadius: 10,
              background: 'linear-gradient(135deg, #89b4fa 0%, #cba6f7 100%)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <Zap size={18} color="#1e1e2e" />
          </div>
          <div>
            <h1 style={{ margin: 0, fontSize: 17, fontWeight: 700 }}>API 调试器</h1>
            <p style={{ margin: 0, fontSize: 11, color: '#a6adc8' }}>专业的 API 开发与调试工具</p>
          </div>
        </div>
      </div>

      <div style={{ flex: 1, display: 'grid', gridTemplateColumns: '260px 1fr', minHeight: 0 }}>
        {/* 侧边栏 */}
        <div
          style={{
            borderRight: '1px solid rgba(69, 71, 90, 0.4)',
            display: 'flex',
            flexDirection: 'column',
            background: 'rgba(24, 24, 37, 0.3)',
            overflow: 'hidden',
          }}
        >
          <div style={{ display: 'flex', padding: '10px', gap: 4 }}>
            <button
              onClick={() => setSideTab('templates')}
              style={{
                flex: 1,
                padding: '8px',
                border: 'none',
                borderRadius: 8,
                background: sideTab === 'templates' ? 'rgba(137, 180, 250, 0.2)' : 'transparent',
                color: sideTab === 'templates' ? '#89b4fa' : '#a6adc8',
                cursor: 'pointer',
                fontSize: 12,
                fontWeight: sideTab === 'templates' ? 600 : 500,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 6,
              }}
            >
              <Lightbulb size={14} /> 模板
            </button>
            <button
              onClick={() => setSideTab('history')}
              style={{
                flex: 1,
                padding: '8px',
                border: 'none',
                borderRadius: 8,
                background: sideTab === 'history' ? 'rgba(137, 180, 250, 0.2)' : 'transparent',
                color: sideTab === 'history' ? '#89b4fa' : '#a6adc8',
                cursor: 'pointer',
                fontSize: 12,
                fontWeight: sideTab === 'history' ? 600 : 500,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 6,
              }}
            >
              <History size={14} /> 历史 ({history.length})
            </button>
          </div>

          <div style={{ flex: 1, overflow: 'auto', padding: '0 10px 10px' }}>
            {sideTab === 'templates' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                {Object.entries(sidebarGroups).map(([cat, templates]) => (
                  <div key={cat}>
                    <div
                      style={{
                        fontSize: 10,
                        fontWeight: 700,
                        textTransform: 'uppercase',
                        letterSpacing: '0.8px',
                        color: '#6c7086',
                        marginBottom: 6,
                        paddingLeft: 4,
                      }}
                    >
                      {cat}
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                      {templates.map((tpl) => (
                        <button
                          key={tpl.id}
                          onClick={() => loadTemplate(tpl)}
                          style={{
                            padding: '8px 10px',
                            background: activeTemplateId === tpl.id
                              ? 'rgba(137, 180, 250, 0.12)'
                              : 'rgba(49, 50, 68, 0.4)',
                            border: activeTemplateId === tpl.id
                              ? '1px solid rgba(137, 180, 250, 0.5)'
                              : '1px solid rgba(69, 71, 90, 0.4)',
                            borderRadius: 8,
                            cursor: 'pointer',
                            textAlign: 'left',
                            color: '#cdd6f4',
                            fontSize: 12,
                            transition: 'all 0.2s',
                          }}
                        >
                          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 2 }}>
                            <span
                              style={{
                                fontSize: 10,
                                fontWeight: 700,
                                padding: '2px 6px',
                                borderRadius: 4,
                                background: `${getMethodColor(tpl.method)}22`,
                                color: getMethodColor(tpl.method),
                              }}
                            >
                              {tpl.method}
                            </span>
                            <span style={{ fontWeight: 600 }}>{tpl.name}</span>
                          </div>
                          <div style={{ fontSize: 11, color: '#a6adc8', marginLeft: 4 }}>
                            {tpl.description}
                          </div>
                        </button>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            )}

            {sideTab === 'history' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                {history.length > 0 && (
                  <button
                    onClick={clearHistory}
                    style={{
                      alignSelf: 'flex-end',
                      padding: '4px 10px',
                      background: 'transparent',
                      border: '1px solid rgba(243, 139, 168, 0.4)',
                      borderRadius: 6,
                      color: '#f38ba8',
                      cursor: 'pointer',
                      fontSize: 11,
                      display: 'flex',
                      alignItems: 'center',
                      gap: 4,
                    }}
                  >
                    <Trash2 size={12} /> 清空
                  </button>
                )}
                {history.length === 0 ? (
                  <div style={{ color: '#6c7086', textAlign: 'center', padding: '30px 10px', fontSize: 12 }}>
                    暂无历史记录
                  </div>
                ) : (
                  history.map((record) => (
                    <button
                      key={record.id}
                      onClick={() => loadHistory(record)}
                      style={{
                        padding: '8px 10px',
                        background: 'rgba(49, 50, 68, 0.4)',
                        border: '1px solid rgba(69, 71, 90, 0.4)',
                        borderRadius: 8,
                        cursor: 'pointer',
                        textAlign: 'left',
                        color: '#cdd6f4',
                        fontSize: 11,
                        transition: 'all 0.2s',
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 3 }}>
                        <span style={{ color: getMethodColor(record.method), fontWeight: 700, fontSize: 10 }}>
                          {record.method}
                        </span>
                        <span
                          style={{
                            color: getStatusColor(record.status),
                            fontSize: 10,
                            fontWeight: 600,
                          }}
                        >
                          {record.status}
                        </span>
                        <span style={{ color: '#6c7086', fontSize: 10, marginLeft: 'auto' }}>
                          {record.time}ms
                        </span>
                      </div>
                      <div
                        style={{
                          fontSize: 11,
                          color: '#a6adc8',
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                          whiteSpace: 'nowrap',
                        }}
                      >
                        {record.url}
                      </div>
                      <div style={{ fontSize: 10, color: '#6c7086', marginTop: 2 }}>
                        {new Date(record.timestamp).toLocaleString('zh-CN')}
                      </div>
                    </button>
                  ))
                )}
              </div>
            )}
          </div>
        </div>

        {/* 主内容区 */}
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minWidth: 0, overflow: 'hidden' }}>
          {/* URL 栏 */}
          <div
            style={{
              padding: '14px 20px',
              display: 'flex',
              flexDirection: 'column',
              gap: 10,
              borderBottom: '1px solid rgba(69, 71, 90, 0.4)',
              background: 'rgba(24, 24, 37, 0.3)',
            }}
          >
            <div style={{ display: 'flex', gap: 10 }}>
              <div
                style={{
                  position: 'relative',
                  minWidth: 110,
                }}
              >
                <select
                  value={method}
                  onChange={(e) => setMethod(e.target.value as HttpMethod)}
                  style={{
                    width: '100%',
                    padding: '10px 32px 10px 14px',
                    background: 'rgba(49, 50, 68, 0.8)',
                    border: '1px solid rgba(69, 71, 90, 0.8)',
                    borderRadius: 10,
                    color: getMethodColor(method),
                    fontSize: 13,
                    fontWeight: 700,
                    cursor: 'pointer',
                    appearance: 'none',
                    outline: 'none',
                  }}
                >
                  {(['GET', 'POST', 'PUT', 'DELETE', 'PATCH'] as HttpMethod[]).map((m) => (
                    <option key={m} value={m} style={{ color: '#cdd6f4' }}>{m}</option>
                  ))}
                </select>
                <ChevronDown
                  size={14}
                  style={{
                    position: 'absolute',
                    right: 10,
                    top: '50%',
                    transform: 'translateY(-50%)',
                    color: '#a6adc8',
                    pointerEvents: 'none',
                  }}
                />
              </div>
              <input
                value={url}
                onChange={(e) => { setUrl(e.target.value); setActiveTemplateId(null) }}
                onKeyDown={(e) => { if (e.key === 'Enter' && !loading) sendRequest() }}
                placeholder="https://api.example.com/endpoint"
                style={{
                  flex: 1,
                  ...inputStyle,
                  fontFamily: 'monospace',
                }}
              />
              {!loading ? (
                <button
                  onClick={sendRequest}
                  disabled={!url.trim()}
                  style={{
                    padding: '10px 24px',
                    background: url.trim()
                      ? 'linear-gradient(135deg, #89b4fa 0%, #74c7ec 100%)'
                      : 'rgba(69, 71, 90, 0.5)',
                    border: 'none',
                    borderRadius: 10,
                    color: url.trim() ? '#1e1e2e' : '#6c7086',
                    fontWeight: 700,
                    cursor: url.trim() ? 'pointer' : 'not-allowed',
                    display: 'flex',
                    alignItems: 'center',
                    gap: 6,
                    whiteSpace: 'nowrap',
                    transition: 'all 0.2s',
                    boxShadow: url.trim() ? '0 4px 16px rgba(137, 180, 250, 0.3)' : 'none',
                  }}
                >
                  <Play size={14} /> 发送
                </button>
              ) : (
                <button
                  onClick={cancelRequest}
                  style={{
                    padding: '10px 24px',
                    background: 'rgba(243, 139, 168, 0.2)',
                    border: '1px solid rgba(243, 139, 168, 0.4)',
                    borderRadius: 10,
                    color: '#f38ba8',
                    fontWeight: 600,
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: 6,
                    whiteSpace: 'nowrap',
                  }}
                >
                  <X size={14} /> 取消
                </button>
              )}
            </div>
          </div>

          {/* 请求体 + 响应 */}
          <div style={{ flex: 1, display: 'grid', gridTemplateRows: 'auto 1fr', minHeight: 0 }}>
            {/* 请求配置 Tabs */}
            <div
              style={{
                display: 'flex',
                flexDirection: 'column',
                borderBottom: '1px solid rgba(69, 71, 90, 0.4)',
                background: 'rgba(24, 24, 37, 0.2)',
              }}
            >
              <div style={{ display: 'flex', gap: 4, padding: '8px 16px', borderBottom: '1px solid rgba(69, 71, 90, 0.3)' }}>
                {tabButton('params', '概述', <FileText size={13} />)}
                {tabButton('headers', `请求头 (${headers.filter((h) => h.enabled).length})`, <Key size={13} />)}
                {tabButton('body', '请求体', <FormInput size={13} />)}
                {tabButton('auth', '认证', <Shield size={13} />)}
              </div>

              <div style={{ padding: '16px 20px', maxHeight: 240, overflow: 'auto' }}>
                {activeTab === 'params' && (
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12 }}>
                    <div style={glassCardStyle as React.CSSProperties}>
                      <div style={{ padding: 12 }}>
                        <div style={{ fontSize: 11, color: '#a6adc8', marginBottom: 4 }}>HTTP 方法</div>
                        <div style={{ fontSize: 14, fontWeight: 700, color: getMethodColor(method) }}>{method}</div>
                      </div>
                    </div>
                    <div style={glassCardStyle as React.CSSProperties}>
                      <div style={{ padding: 12 }}>
                        <div style={{ fontSize: 11, color: '#a6adc8', marginBottom: 4 }}>请求头数量</div>
                        <div style={{ fontSize: 14, fontWeight: 700, color: '#89b4fa' }}>
                          {headers.filter((h) => h.enabled).length}
                        </div>
                      </div>
                    </div>
                    <div style={glassCardStyle as React.CSSProperties}>
                      <div style={{ padding: 12 }}>
                        <div style={{ fontSize: 11, color: '#a6adc8', marginBottom: 4 }}>请求体</div>
                        <div style={{ fontSize: 14, fontWeight: 700, color: bodyType !== 'none' && needsBody ? '#a6e3a1' : '#6c7086' }}>
                          {bodyType === 'none' ? '无' : bodyType.toUpperCase()}
                          {bodyType !== 'none' && needsBody && ` (${new Blob([body]).size} B)`}
                        </div>
                      </div>
                    </div>
                    <div style={{ ...glassCardStyle as React.CSSProperties, gridColumn: '1 / -1' }}>
                      <div style={{ padding: 12 }}>
                        <div style={{ fontSize: 11, color: '#a6adc8', marginBottom: 8, fontWeight: 600 }}>
                          <Code size={12} style={{ display: 'inline', marginRight: 4 }} />
                          生成代码
                        </div>
                        <div style={{ display: 'flex', gap: 6, marginBottom: 10 }}>
                          {(['fetch', 'axios', 'curl'] as CodeFormat[]).map((fmt) => (
                            <button
                              key={fmt}
                              onClick={() => setCodeFormat(fmt)}
                              style={{
                                padding: '4px 12px',
                                background: codeFormat === fmt ? 'rgba(137, 180, 250, 0.2)' : 'rgba(49, 50, 68, 0.5)',
                                border: codeFormat === fmt ? '1px solid rgba(137, 180, 250, 0.5)' : '1px solid rgba(69, 71, 90, 0.4)',
                                borderRadius: 6,
                                color: codeFormat === fmt ? '#89b4fa' : '#a6adc8',
                                cursor: 'pointer',
                                fontSize: 11,
                                fontWeight: 600,
                                textTransform: 'uppercase',
                              }}
                            >
                              {fmt}
                            </button>
                          ))}
                          <button
                            onClick={copyCode}
                            style={{
                              marginLeft: 'auto',
                              padding: '4px 10px',
                              background: copied ? 'rgba(166, 227, 161, 0.2)' : 'rgba(137, 180, 250, 0.2)',
                              border: `1px solid ${copied ? 'rgba(166, 227, 161, 0.4)' : 'rgba(137, 180, 250, 0.4)'}`,
                              borderRadius: 6,
                              color: copied ? '#a6e3a1' : '#89b4fa',
                              cursor: 'pointer',
                              fontSize: 11,
                              display: 'flex',
                              alignItems: 'center',
                              gap: 4,
                            }}
                          >
                            <Copy size={11} /> {copied ? '已复制' : '复制'}
                          </button>
                        </div>
                        <pre
                          style={{
                            margin: 0,
                            padding: 12,
                            background: 'rgba(17, 17, 27, 0.6)',
                            borderRadius: 8,
                            border: '1px solid rgba(69, 71, 90, 0.3)',
                            fontSize: 11,
                            fontFamily: 'monospace',
                            color: '#a6e3a1',
                            maxHeight: 120,
                            overflow: 'auto',
                            lineHeight: 1.5,
                          }}
                        >
                          {generatedCode}
                        </pre>
                      </div>
                    </div>
                  </div>
                )}

                {activeTab === 'headers' && (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                    <button
                      onClick={addHeader}
                      style={{
                        alignSelf: 'flex-start',
                        padding: '6px 12px',
                        background: 'rgba(137, 180, 250, 0.15)',
                        border: '1px solid rgba(137, 180, 250, 0.4)',
                        borderRadius: 6,
                        color: '#89b4fa',
                        cursor: 'pointer',
                        fontSize: 12,
                        display: 'flex',
                        alignItems: 'center',
                        gap: 4,
                      }}
                    >
                      <Plus size={12} /> 添加请求头
                    </button>
                    {headers.length === 0 && (
                      <div style={{ color: '#6c7086', textAlign: 'center', padding: '20px 0', fontSize: 12 }}>
                        暂无自定义请求头
                      </div>
                    )}
                    {headers.map((h) => (
                      <div
                        key={h.id}
                        style={{
                          display: 'flex',
                          gap: 8,
                          alignItems: 'center',
                          padding: '8px',
                          background: 'rgba(49, 50, 68, 0.5)',
                          borderRadius: 8,
                          border: '1px solid rgba(69, 71, 90, 0.4)',
                        }}
                      >
                        <button
                          onClick={() => updateHeader(h.id, 'enabled', !h.enabled)}
                          style={{
                            background: 'transparent',
                            border: 'none',
                            cursor: 'pointer',
                            color: h.enabled ? '#a6e3a1' : '#6c7086',
                            padding: 0,
                            display: 'flex',
                            alignItems: 'center',
                          }}
                        >
                          {h.enabled ? <CheckCircle size={16} /> : <X size={16} />}
                        </button>
                        <input
                          value={h.key}
                          onChange={(e) => updateHeader(h.id, 'key', e.target.value)}
                          placeholder="Header 名称"
                          style={{
                            flex: 1,
                            padding: '6px 10px',
                            background: 'rgba(17, 17, 27, 0.5)',
                            border: '1px solid rgba(69, 71, 90, 0.3)',
                            borderRadius: 6,
                            color: '#89b4fa',
                            fontSize: 12,
                            fontFamily: 'monospace',
                            outline: 'none',
                          }}
                        />
                        <input
                          value={h.value}
                          onChange={(e) => updateHeader(h.id, 'value', e.target.value)}
                          placeholder="Header 值"
                          style={{
                            flex: 2,
                            padding: '6px 10px',
                            background: 'rgba(17, 17, 27, 0.5)',
                            border: '1px solid rgba(69, 71, 90, 0.3)',
                            borderRadius: 6,
                            color: '#cdd6f4',
                            fontSize: 12,
                            fontFamily: 'monospace',
                            outline: 'none',
                          }}
                        />
                        <button
                          onClick={() => removeHeader(h.id)}
                          style={{
                            background: 'transparent',
                            border: 'none',
                            cursor: 'pointer',
                            color: '#f38ba8',
                            padding: 0,
                          }}
                        >
                          <Trash size={14} />
                        </button>
                      </div>
                    ))}
                  </div>
                )}

                {activeTab === 'body' && (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                    <div style={{ display: 'flex', gap: 8 }}>
                      {(['none', 'json', 'form-data', 'text'] as BodyType[]).map((bt) => (
                        <button
                          key={bt}
                          onClick={() => setBodyType(bt)}
                          disabled={bodyDisabled && bt !== 'none'}
                          style={{
                            padding: '6px 14px',
                            background: bodyType === bt ? 'rgba(137, 180, 250, 0.2)' : 'rgba(49, 50, 68, 0.5)',
                            border: bodyType === bt ? '1px solid rgba(137, 180, 250, 0.5)' : '1px solid rgba(69, 71, 90, 0.4)',
                            borderRadius: 6,
                            color: bodyType === bt ? '#89b4fa' : '#a6adc8',
                            cursor: bodyDisabled && bt !== 'none' ? 'not-allowed' : 'pointer',
                            fontSize: 12,
                            fontWeight: bodyType === bt ? 600 : 400,
                            display: 'flex',
                            alignItems: 'center',
                            gap: 4,
                            opacity: bodyDisabled && bt !== 'none' ? 0.5 : 1,
                          }}
                        >
                          {bt === 'json' && <FileJson size={12} />}
                          {bt === 'form-data' && <FormInput size={12} />}
                          {bt === 'text' && <FileText size={12} />}
                          {bt === 'none' && <X size={12} />}
                          {bt === 'none' ? '无' : bt === 'form-data' ? 'Form-Data' : bt.toUpperCase()}
                        </button>
                      ))}
                    </div>
                    {bodyType === 'none' ? (
                      <div style={{ color: '#6c7086', textAlign: 'center', padding: '30px 0', fontSize: 12 }}>
                        {bodyDisabled ? 'GET/HEAD 请求不支持请求体' : '此请求不包含请求体'}
                      </div>
                    ) : (
                      <textarea
                        value={body}
                        onChange={(e) => setBody(e.target.value)}
                        placeholder={
                          bodyType === 'json'
                            ? '{\n  "key": "value"\n}'
                            : bodyType === 'form-data'
                            ? '{\n  "field1": "value1",\n  "field2": "value2"\n}'
                            : '输入纯文本内容...'
                        }
                        disabled={bodyDisabled}
                        style={{
                          width: '100%',
                          minHeight: 120,
                          padding: 12,
                          background: 'rgba(17, 17, 27, 0.5)',
                          border: '1px solid rgba(69, 71, 90, 0.4)',
                          borderRadius: 8,
                          color: '#cdd6f4',
                          fontSize: 12,
                          fontFamily: 'monospace',
                          resize: 'vertical',
                          outline: 'none',
                          lineHeight: 1.6,
                        }}
                      />
                    )}
                  </div>
                )}

                {activeTab === 'auth' && (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 12, maxWidth: 500 }}>
                    <div style={{ display: 'flex', gap: 8 }}>
                      {(['none', 'bearer', 'apikey'] as AuthType[]).map((at) => (
                        <button
                          key={at}
                          onClick={() => setAuthType(at)}
                          style={{
                            padding: '6px 14px',
                            background: authType === at ? 'rgba(137, 180, 250, 0.2)' : 'rgba(49, 50, 68, 0.5)',
                            border: authType === at ? '1px solid rgba(137, 180, 250, 0.5)' : '1px solid rgba(69, 71, 90, 0.4)',
                            borderRadius: 6,
                            color: authType === at ? '#89b4fa' : '#a6adc8',
                            cursor: 'pointer',
                            fontSize: 12,
                            fontWeight: authType === at ? 600 : 400,
                            display: 'flex',
                            alignItems: 'center',
                            gap: 4,
                          }}
                        >
                          {at === 'bearer' && <Key size={12} />}
                          {at === 'apikey' && <Shield size={12} />}
                          {at === 'none' && <X size={12} />}
                          {at === 'none' ? '无认证' : at === 'bearer' ? 'Bearer Token' : 'API Key'}
                        </button>
                      ))}
                    </div>

                    {authType !== 'none' && (
                      <>
                        {authType === 'apikey' && (
                          <div>
                            <label style={{ fontSize: 12, color: '#a6adc8', display: 'block', marginBottom: 6 }}>
                              Header 名称
                            </label>
                            <input
                              value={authHeaderName}
                              onChange={(e) => setAuthHeaderName(e.target.value)}
                              placeholder="X-API-Key"
                              style={inputStyle}
                            />
                          </div>
                        )}
                        <div>
                          <label style={{ fontSize: 12, color: '#a6adc8', display: 'block', marginBottom: 6 }}>
                            {authType === 'bearer' ? 'Token' : 'API Key'}
                          </label>
                          <div style={{ position: 'relative' }}>
                            <input
                              type={showToken ? 'text' : 'password'}
                              value={authToken}
                              onChange={(e) => setAuthToken(e.target.value)}
                              placeholder={authType === 'bearer' ? '输入 Bearer Token' : '输入 API Key'}
                              style={{ ...inputStyle, paddingRight: 40 }}
                            />
                            <button
                              onClick={() => setShowToken(!showToken)}
                              style={{
                                position: 'absolute',
                                right: 10,
                                top: '50%',
                                transform: 'translateY(-50%)',
                                background: 'transparent',
                                border: 'none',
                                color: '#a6adc8',
                                cursor: 'pointer',
                              }}
                            >
                              {showToken ? <EyeOff size={16} /> : <Eye size={16} />}
                            </button>
                          </div>
                        </div>
                        <div
                          style={{
                            padding: '10px 12px',
                            background: 'rgba(137, 180, 250, 0.08)',
                            border: '1px solid rgba(137, 180, 250, 0.2)',
                            borderRadius: 6,
                            fontSize: 11,
                            color: '#a6adc8',
                          }}
                        >
                          <strong style={{ color: '#89b4fa' }}>提示：</strong>
                          {authType === 'bearer'
                            ? '将自动添加 Authorization: Bearer {"<token>"} 请求头'
                            : `将自动添加 ${authHeaderName || 'X-API-Key'} 请求头`}
                        </div>
                      </>
                    )}
                  </div>
                )}
              </div>
            </div>

            {/* 响应区域 */}
            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minHeight: 0, background: 'rgba(24, 24, 37, 0.2)' }}>
              <div
                style={{
                  padding: '10px 20px',
                  borderBottom: '1px solid rgba(69, 71, 90, 0.4)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  background: 'rgba(24, 24, 37, 0.4)',
                  backdropFilter: 'blur(8px)',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
                  <span style={{ fontWeight: 600, fontSize: 13, display: 'flex', alignItems: 'center', gap: 6 }}>
                    <Cpu size={14} /> 响应
                  </span>
                  {response && (
                    <>
                      <span style={{ display: 'flex', alignItems: 'center', gap: 6, color: getStatusColor(response.status), fontWeight: 700 }}>
                        {response.ok ? <CheckCircle size={14} /> : <AlertCircle size={14} />}
                        {response.status} {response.statusText}
                      </span>
                      <span style={{ color: '#f9e2af', display: 'flex', alignItems: 'center', gap: 4, fontSize: 12 }}>
                        <Clock size={12} /> {response.time}ms
                      </span>
                      <span style={{ color: '#a6adc8', fontSize: 12 }}>
                        {(response.size < 1024 ? `${response.size} B` : `${(response.size / 1024).toFixed(2)} KB`)}
                      </span>
                    </>
                  )}
                </div>
                {response && (
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <div style={{ display: 'flex', gap: 4 }}>
                      {(['body', 'headers'] as const).map((tab) => (
                        <button
                          key={tab}
                          onClick={() => setResponseTab(tab)}
                          style={{
                            padding: '5px 12px',
                            background: responseTab === tab ? 'rgba(137, 180, 250, 0.2)' : 'transparent',
                            border: responseTab === tab ? '1px solid rgba(137, 180, 250, 0.4)' : '1px solid rgba(69, 71, 90, 0.3)',
                            borderRadius: 6,
                            color: responseTab === tab ? '#89b4fa' : '#a6adc8',
                            cursor: 'pointer',
                            fontSize: 12,
                            fontWeight: responseTab === tab ? 600 : 400,
                          }}
                        >
                          {tab === 'body' ? '响应体' : `响应头 (${Object.keys(response.headers).length})`}
                        </button>
                      ))}
                    </div>
                    <button
                      onClick={copyResponse}
                      style={{
                        background: 'transparent',
                        border: 'none',
                        color: copied ? '#a6e3a1' : '#89b4fa',
                        cursor: 'pointer',
                        padding: 4,
                        display: 'flex',
                        alignItems: 'center',
                      }}
                      title="复制响应"
                    >
                      <Copy size={15} />
                    </button>
                    <button
                      onClick={downloadResponse}
                      style={{
                        background: 'transparent',
                        border: 'none',
                        color: '#89b4fa',
                        cursor: 'pointer',
                        padding: 4,
                        display: 'flex',
                        alignItems: 'center',
                      }}
                      title="下载响应"
                    >
                      <Download size={15} />
                    </button>
                  </div>
                )}
              </div>

              <div style={{ flex: 1, padding: '16px 20px', overflow: 'auto' }}>
                {error && (
                  <div
                    style={{
                      padding: 14,
                      background: 'rgba(243, 139, 168, 0.08)',
                      border: '1px solid rgba(243, 139, 168, 0.3)',
                      borderRadius: 10,
                      color: '#f38ba8',
                      marginBottom: 12,
                      fontSize: 12,
                    }}
                  >
                    <strong style={{ display: 'block', marginBottom: 4 }}>请求错误</strong>
                    {error}
                    {error.includes('Failed to fetch') && (
                      <div style={{ marginTop: 8, color: '#f9e2af', fontSize: 11 }}>
                        提示：目标 API 可能未启用 CORS 或网络不可达。请检查 URL 或使用支持 CORS 的 API。
                      </div>
                    )}
                  </div>
                )}

                {loading && !response && (
                  <div style={{ color: '#a6adc8', textAlign: 'center', padding: '60px 0', fontSize: 13 }}>
                    <RotateCcw size={24} style={{ animation: 'spin 1s linear infinite', margin: '0 auto 10px' }} />
                    <div>正在发送请求...</div>
                    <div style={{ fontSize: 11, color: '#6c7086', marginTop: 4 }}>点击"取消"可中止请求</div>
                  </div>
                )}

                {response && responseTab === 'body' && (
                  <div style={{ ...glassCardStyle as React.CSSProperties, padding: 14 }}>
                    {response.contentType.includes('json') ? (
                      <SimpleJsonHighlighter code={response.body} />
                    ) : (
                      <pre
                        style={{
                          margin: 0,
                          fontFamily: 'monospace',
                          fontSize: 12,
                          lineHeight: 1.6,
                          color: '#cdd6f4',
                          whiteSpace: 'pre-wrap',
                          wordBreak: 'break-all',
                        }}
                      >
                        {response.body}
                      </pre>
                    )}
                  </div>
                )}

                {response && responseTab === 'headers' && (
                  <div style={{ ...glassCardStyle as React.CSSProperties, padding: 14 }}>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                      {Object.entries(response.headers).map(([k, v]) => (
                        <div
                          key={k}
                          style={{
                            display: 'flex',
                            gap: 12,
                            padding: '6px 10px',
                            background: 'rgba(17, 17, 27, 0.4)',
                            borderRadius: 6,
                            fontSize: 12,
                          }}
                        >
                          <span style={{ color: '#89b4fa', fontWeight: 600, minWidth: 140, wordBreak: 'break-all' }}>
                            {k}:
                          </span>
                          <span style={{ color: '#cdd6f4', fontFamily: 'monospace', wordBreak: 'break-all' }}>
                            {v}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {!response && !error && !loading && (
                  <div style={{ color: '#6c7086', textAlign: 'center', padding: '60px 0', fontSize: 13 }}>
                    <Globe size={32} style={{ margin: '0 auto 12px', opacity: 0.5 }} />
                    <div>发送请求后，响应内容将显示在这里</div>
                    <div style={{ fontSize: 11, marginTop: 6 }}>
                      选择左侧模板快速开始，或直接输入 URL 发送请求
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      <style>{`
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
        ::-webkit-scrollbar {
          width: 8px;
          height: 8px;
        }
        ::-webkit-scrollbar-track {
          background: rgba(30, 30, 46, 0.3);
        }
        ::-webkit-scrollbar-thumb {
          background: rgba(69, 71, 90, 0.6);
          border-radius: 4px;
        }
        ::-webkit-scrollbar-thumb:hover {
          background: rgba(88, 91, 116, 0.8);
        }
        select option {
          background: #1e1e2e;
          color: #cdd6f4;
        }
      `}</style>
    </div>
  )
}
