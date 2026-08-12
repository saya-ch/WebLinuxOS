import { useState, useRef, useEffect, useCallback } from 'react'
import {
  Send, Code, History, Clock, Copy, Check, Download,
  Rocket, Server, Globe, X, Plus, Key, FileJson,
  FormInput, Trash, Sparkles
} from 'lucide-react'

type HttpMethod = 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH' | 'HEAD' | 'OPTIONS'
type BodyType = 'none' | 'json' | 'form-data'
type CodeLang = 'fetch' | 'axios' | 'curl'
type TabKey = 'response' | 'headers' | 'body'

interface HeaderEntry {
  id: string
  key: string
  value: string
  enabled: boolean
}

interface HistoryEntry {
  id: string
  method: HttpMethod
  url: string
  headers: HeaderEntry[]
  body: string
  bodyType: BodyType
  status: number
  time: number
  timestamp: number
}

interface ResponseData {
  status: number
  statusText: string
  headers: Record<string, string>
  body: string
  time: number
  size: number
  contentType: string
}

const STORAGE_KEY = 'weblinux-web-request-lab-history'
const MAX_HISTORY = 50

const METHODS: HttpMethod[] = ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'HEAD', 'OPTIONS']

const METHOD_COLORS: Record<HttpMethod, string> = {
  GET: '#00e896',
  POST: '#40a9ff',
  PUT: '#ffc400',
  DELETE: '#ff4d5f',
  PATCH: '#c084fc',
  HEAD: '#22d3ee',
  OPTIONS: '#fb923c',
}

const getStatusColor = (status: number): string => {
  if (status >= 200 && status < 300) return 'var(--success)'
  if (status >= 300 && status < 400) return 'var(--info)'
  if (status >= 400 && status < 500) return 'var(--warning)'
  if (status >= 500) return 'var(--error)'
  return 'var(--text-secondary)'
}

const getStatusBg = (status: number): string => {
  if (status >= 200 && status < 300) return 'var(--success-bg)'
  if (status >= 300 && status < 400) return 'var(--info-bg)'
  if (status >= 400 && status < 500) return 'var(--warning-bg)'
  if (status >= 500) return 'var(--error-bg)'
  return 'rgba(255,255,255,0.05)'
}

function genId(): string {
  return Math.random().toString(36).slice(2, 10) + Date.now().toString(36)
}

function formatJson(text: string): string {
  try {
    return JSON.stringify(JSON.parse(text), null, 2)
  } catch {
    return text
  }
}

function formatSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(2)} KB`
  return `${(bytes / 1024 / 1024).toFixed(2)} MB`
}

export default function WebRequestLab() {
  const [method, setMethod] = useState<HttpMethod>('GET')
  const [url, setUrl] = useState('https://jsonplaceholder.typicode.com/todos/1')
  const [headers, setHeaders] = useState<HeaderEntry[]>([
    { id: genId(), key: 'Accept', value: 'application/json', enabled: true },
  ])
  const [bodyType, setBodyType] = useState<BodyType>('json')
  const [body, setBody] = useState('')
  const [useProxy, setUseProxy] = useState(false)
  const [loading, setLoading] = useState(false)
  const [response, setResponse] = useState<ResponseData | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [activeTab, setActiveTab] = useState<TabKey>('response')
  const [codeLang, setCodeLang] = useState<CodeLang>('fetch')
  const [copied, setCopied] = useState(false)
  const [history, setHistory] = useState<HistoryEntry[]>(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY)
      return raw ? JSON.parse(raw) : []
    } catch {
      return []
    }
  })
  const [showHistory, setShowHistory] = useState(false)
  const [showCode, setShowCode] = useState(false)

  const abortRef = useRef<AbortController | null>(null)
  const urlInputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(history.slice(0, MAX_HISTORY)))
    } catch {}
  }, [history])

  useEffect(() => {
    return () => {
      abortRef.current?.abort()
    }
  }, [])

  const parseHeaders = useCallback((entries: HeaderEntry[]): Record<string, string> => {
    const result: Record<string, string> = {}
    entries.forEach((h) => {
      if (h.enabled && h.key.trim()) {
        result[h.key.trim()] = h.value
      }
    })
    return result
  }, [])

  const getFinalUrl = useCallback((target: string): string => {
    if (!useProxy) return target
    return `https://api.allorigins.win/get?url=${encodeURIComponent(target)}`
  }, [useProxy])

  const buildFetchCode = useCallback((target: string): string => {
    const headerObj = parseHeaders(headers)
    const lines: string[] = []
    lines.push(`const res = await fetch("${target}", {`)
    lines.push(`  method: "${method}",`)
    if (Object.keys(headerObj).length > 0) {
      lines.push(`  headers: ${JSON.stringify(headerObj, null, 2)},`)
    }
    if (!['GET', 'HEAD'].includes(method) && body.trim()) {
      lines.push(`  body: ${JSON.stringify(body)},`)
    }
    lines.push(`});`)
    lines.push(`const data = await res.json();`)
    lines.push(`console.log(data);`)
    return lines.join('\n')
  }, [method, headers, body, parseHeaders])

  const buildAxiosCode = useCallback((target: string): string => {
    const headerObj = parseHeaders(headers)
    const lines: string[] = []
    lines.push(`import axios from "axios";`)
    lines.push(``)
    lines.push(`const { data } = await axios({`)
    lines.push(`  method: "${method.toLowerCase()}",`)
    lines.push(`  url: "${target}",`)
    if (Object.keys(headerObj).length > 0) {
      lines.push(`  headers: ${JSON.stringify(headerObj, null, 2)},`)
    }
    if (!['GET', 'HEAD'].includes(method) && body.trim()) {
      lines.push(`  data: ${JSON.stringify(body)},`)
    }
    lines.push(`});`)
    lines.push(`console.log(data);`)
    return lines.join('\n')
  }, [method, headers, body, parseHeaders])

  const buildCurlCode = useCallback((target: string): string => {
    const parts: string[] = [`curl -X ${method}`]
    const headerObj = parseHeaders(headers)
    Object.entries(headerObj).forEach(([k, v]) => {
      parts.push(`  -H "${k}: ${v}"`)
    })
    if (!['GET', 'HEAD'].includes(method) && body.trim()) {
      const escaped = body.replace(/"/g, '\\"')
      parts.push(`  -d '${escaped}'`)
    }
    parts.push(`  "${target}"`)
    return parts.join(' \\\n')
  }, [method, headers, body, parseHeaders])

  const generateCode = useCallback((): string => {
    const target = url.trim() || 'https://api.example.com'
    if (codeLang === 'fetch') return buildFetchCode(target)
    if (codeLang === 'axios') return buildAxiosCode(target)
    return buildCurlCode(target)
  }, [codeLang, url, buildFetchCode, buildAxiosCode, buildCurlCode])

  const copyToClipboard = useCallback((text: string) => {
    navigator.clipboard.writeText(text).then(() => {
      setCopied(true)
      setTimeout(() => setCopied(false), 1500)
    })
  }, [])

  const sendRequest = useCallback(async () => {
    if (!url.trim()) {
      setError('请输入请求 URL')
      return
    }

    setLoading(true)
    setResponse(null)
    setError(null)
    setActiveTab('response')

    if (abortRef.current) {
      abortRef.current.abort()
    }
    const controller = new AbortController()
    abortRef.current = controller

    const startTime = performance.now()
    const finalUrl = getFinalUrl(url.trim())
    const headerObj = parseHeaders(headers)

    try {
      const options: RequestInit = {
        method,
        headers: headerObj,
        signal: controller.signal,
      }

      if (!['GET', 'HEAD'].includes(method)) {
        if (bodyType === 'form-data' && body.trim()) {
          const formData = new FormData()
          body.split('\n').forEach((line) => {
            const idx = line.indexOf('=')
            if (idx > 0) {
              formData.append(line.slice(0, idx).trim(), line.slice(idx + 1))
            }
          })
          options.body = formData
          delete (options.headers as Record<string, string>)['Content-Type']
        } else if (bodyType === 'json' && body.trim()) {
          options.body = body
          if (!headerObj['Content-Type']) {
            ;(options.headers as Record<string, string>)['Content-Type'] = 'application/json'
          }
        }
      }

      const res = await fetch(finalUrl, options)

      const respHeaders: Record<string, string> = {}
      res.headers.forEach((value, key) => {
        respHeaders[key] = value
      })

      const text = await res.text()
      const time = Math.round(performance.now() - startTime)
      const size = new Blob([text]).size
      const contentType = res.headers.get('content-type') || 'text/plain'

      let formattedBody = text
      if (contentType.includes('application/json')) {
        formattedBody = formatJson(text)
      }

      const responseData: ResponseData = {
        status: res.status,
        statusText: res.statusText,
        headers: respHeaders,
        body: formattedBody,
        time,
        size,
        contentType,
      }

      setResponse(responseData)

      const entry: HistoryEntry = {
        id: genId(),
        method,
        url: url.trim(),
        headers: JSON.parse(JSON.stringify(headers)),
        body,
        bodyType,
        status: res.status,
        time,
        timestamp: Date.now(),
      }
      setHistory((prev) => [entry, ...prev].slice(0, MAX_HISTORY))
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err)
      if (message.includes('abort')) return
      setError(message)
    } finally {
      setLoading(false)
      abortRef.current = null
    }
  }, [url, method, headers, body, bodyType, getFinalUrl, parseHeaders])

  const loadFromHistory = useCallback((entry: HistoryEntry) => {
    setMethod(entry.method)
    setUrl(entry.url)
    setHeaders(entry.headers.map((h) => ({ ...h, id: genId() })))
    setBody(entry.body)
    setBodyType(entry.bodyType)
    setResponse(null)
    setError(null)
    setShowHistory(false)
  }, [])

  const clearHistory = useCallback(() => {
    setHistory([])
  }, [])

  const downloadResponse = useCallback(() => {
    if (!response) return
    const blob = new Blob([response.body], {
      type: response.contentType || 'application/json',
    })
    const a = document.createElement('a')
    a.href = URL.createObjectURL(blob)
    a.download = `response-${Date.now()}.json`
    a.click()
    URL.revokeObjectURL(a.href)
  }, [response])

  const addHeader = useCallback(() => {
    setHeaders((prev) => [...prev, { id: genId(), key: '', value: '', enabled: true }])
  }, [])

  const removeHeader = useCallback((id: string) => {
    setHeaders((prev) => prev.filter((h) => h.id !== id))
  }, [])

  const updateHeader = useCallback((id: string, field: 'key' | 'value', value: string) => {
    setHeaders((prev) => prev.map((h) => (h.id === id ? { ...h, [field]: value } : h)))
  }, [])

  const toggleHeader = useCallback((id: string) => {
    setHeaders((prev) => prev.map((h) => (h.id === id ? { ...h, enabled: !h.enabled } : h)))
  }, [])

  const canSend = url.trim().length > 0 && !loading

  const styles = {
    container: {
      display: 'flex',
      flexDirection: 'column',
      height: '100%',
      background: 'var(--window-bg)',
      color: 'var(--text-primary)',
      overflow: 'hidden',
      fontFamily: 'var(--font-sans, system-ui, sans-serif)',
    } as React.CSSProperties,

    glassPanel: {
      background: 'var(--glass-bg)',
      border: '1px solid var(--glass-border)',
      borderRadius: 'var(--radius-md)',
      backdropFilter: 'blur(12px)',
      WebkitBackdropFilter: 'blur(12px)',
    } as React.CSSProperties,

    header: {
      padding: '16px 20px',
      borderBottom: '1px solid var(--window-border)',
      background: 'linear-gradient(135deg, rgba(124,108,240,0.12) 0%, rgba(0,214,193,0.06) 100%)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      gap: 12,
    } as React.CSSProperties,

    titleGroup: {
      display: 'flex',
      alignItems: 'center',
      gap: 10,
    } as React.CSSProperties,

    title: {
      margin: 0,
      fontSize: 17,
      fontWeight: 700,
      letterSpacing: '-0.02em',
      display: 'flex',
      alignItems: 'center',
      gap: 8,
      background: 'var(--accent-gradient)',
      WebkitBackgroundClip: 'text',
      WebkitTextFillColor: 'transparent',
    } as React.CSSProperties,

    subtitle: {
      margin: 0,
      fontSize: 12,
      color: 'var(--text-secondary)',
    } as React.CSSProperties,

    toolbar: {
      padding: '14px 20px',
      display: 'flex',
      flexDirection: 'column',
      gap: 10,
      borderBottom: '1px solid var(--window-border)',
      background: 'var(--glass-bg)',
      backdropFilter: 'blur(8px)',
      WebkitBackdropFilter: 'blur(8px)',
    } as React.CSSProperties,

    requestRow: {
      display: 'flex',
      gap: 10,
      alignItems: 'stretch',
    } as React.CSSProperties,

    methodSelect: {
      padding: '0 14px',
      minWidth: 110,
      background: 'rgba(20,20,35,0.8)',
      border: '1px solid var(--window-border)',
      borderRadius: 'var(--radius-sm)',
      color: 'var(--text-primary)',
      fontSize: 13,
      fontWeight: 700,
      cursor: 'pointer',
      outline: 'none',
    } as React.CSSProperties,

    urlInput: {
      flex: 1,
      padding: '10px 14px',
      background: 'rgba(20,20,35,0.6)',
      border: '1px solid var(--window-border)',
      borderRadius: 'var(--radius-sm)',
      color: 'var(--text-primary)',
      fontSize: 13,
      outline: 'none',
      transition: 'border-color 0.2s',
    } as React.CSSProperties,

    sendBtn: {
      padding: '0 22px',
      background: loading
        ? 'rgba(108,92,231,0.4)'
        : 'var(--accent-gradient)',
      border: 'none',
      borderRadius: 'var(--radius-sm)',
      color: '#fff',
      fontWeight: 700,
      fontSize: 13,
      cursor: canSend ? 'pointer' : 'not-allowed',
      display: 'flex',
      alignItems: 'center',
      gap: 6,
      boxShadow: canSend ? '0 4px 20px rgba(124,108,240,0.35)' : 'none',
      transition: 'all 0.2s',
      whiteSpace: 'nowrap',
    } as React.CSSProperties,

    proxyRow: {
      display: 'flex',
      alignItems: 'center',
      gap: 16,
      flexWrap: 'wrap',
    } as React.CSSProperties,

    checkboxLabel: {
      display: 'flex',
      alignItems: 'center',
      gap: 8,
      cursor: 'pointer',
      color: 'var(--text-secondary)',
      fontSize: 12,
      userSelect: 'none',
    } as React.CSSProperties,

    mainArea: {
      flex: 1,
      display: 'grid',
      gridTemplateColumns: '1fr 1fr',
      minHeight: 0,
      overflow: 'hidden',
    } as React.CSSProperties,

    leftPanel: {
      borderRight: '1px solid var(--window-border)',
      display: 'flex',
      flexDirection: 'column',
      minHeight: 0,
      overflow: 'hidden',
    } as React.CSSProperties,

    rightPanel: {
      display: 'flex',
      flexDirection: 'column',
      minHeight: 0,
      overflow: 'hidden',
    } as React.CSSProperties,

    tabsBar: {
      display: 'flex',
      gap: 2,
      padding: '8px 14px',
      borderBottom: '1px solid var(--window-border)',
      background: 'rgba(18,18,30,0.6)',
    } as React.CSSProperties,

    tabBtn: (active: boolean): React.CSSProperties => ({
      padding: '7px 14px',
      border: 'none',
      background: active ? 'var(--accent-bg)' : 'transparent',
      color: active ? 'var(--accent)' : 'var(--text-secondary)',
      borderRadius: 'var(--radius-sm)',
      cursor: 'pointer',
      fontSize: 12,
      fontWeight: 600,
      display: 'flex',
      alignItems: 'center',
      gap: 6,
      transition: 'all 0.2s',
    }),

    tabBtnActive: {
      background: 'var(--accent-bg)',
      color: 'var(--accent)',
    } as React.CSSProperties,

    scrollArea: {
      flex: 1,
      overflow: 'auto',
      padding: 14,
    } as React.CSSProperties,

    section: {
      marginBottom: 14,
    } as React.CSSProperties,

    sectionLabel: {
      fontSize: 11,
      color: 'var(--text-secondary)',
      marginBottom: 8,
      fontWeight: 600,
      textTransform: 'uppercase' as const,
      letterSpacing: '0.05em',
      display: 'flex',
      alignItems: 'center',
      gap: 6,
    } as React.CSSProperties,

    headerRow: {
      display: 'flex',
      gap: 8,
      alignItems: 'center',
      marginBottom: 6,
    } as React.CSSProperties,

    headerInput: {
      flex: 1,
      padding: '7px 10px',
      background: 'rgba(20,20,35,0.6)',
      border: '1px solid var(--window-border)',
      borderRadius: 'var(--radius-sm)',
      color: 'var(--text-primary)',
      fontSize: 12,
      fontFamily: 'monospace',
      outline: 'none',
    } as React.CSSProperties,

    addBtn: {
      padding: '7px 12px',
      background: 'var(--accent-bg)',
      border: '1px dashed var(--window-border)',
      borderRadius: 'var(--radius-sm)',
      color: 'var(--accent)',
      cursor: 'pointer',
      fontSize: 12,
      display: 'flex',
      alignItems: 'center',
      gap: 5,
      transition: 'all 0.2s',
    } as React.CSSProperties,

    bodyTypeSelector: {
      display: 'flex',
      gap: 6,
      marginBottom: 10,
    } as React.CSSProperties,

    bodyTypeBtn: (active: boolean): React.CSSProperties => ({
      padding: '6px 12px',
      background: active ? 'var(--accent-bg)' : 'rgba(20,20,35,0.4)',
      border: active ? '1px solid var(--accent)' : '1px solid var(--window-border)',
      borderRadius: 'var(--radius-sm)',
      color: active ? 'var(--accent)' : 'var(--text-secondary)',
      cursor: 'pointer',
      fontSize: 12,
      fontWeight: 600,
      display: 'flex',
      alignItems: 'center',
      gap: 5,
      transition: 'all 0.2s',
    }),

    textarea: {
      width: '100%',
      minHeight: 180,
      padding: 12,
      background: 'rgba(20,20,35,0.6)',
      border: '1px solid var(--window-border)',
      borderRadius: 'var(--radius-sm)',
      color: 'var(--text-primary)',
      fontSize: 12,
      fontFamily: 'monospace',
      resize: 'vertical',
      outline: 'none',
      lineHeight: 1.6,
    } as React.CSSProperties,

    responseHeader: {
      padding: '10px 14px',
      borderBottom: '1px solid var(--window-border)',
      background: 'rgba(18,18,30,0.6)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      gap: 12,
    } as React.CSSProperties,

    responseTitle: {
      fontWeight: 600,
      fontSize: 13,
      display: 'flex',
      alignItems: 'center',
      gap: 8,
    } as React.CSSProperties,

    statusBadge: (status: number): React.CSSProperties => ({
      padding: '4px 10px',
      background: getStatusBg(status),
      color: getStatusColor(status),
      borderRadius: 'var(--radius-sm)',
      fontSize: 12,
      fontWeight: 700,
      display: 'flex',
      alignItems: 'center',
      gap: 6,
    }),

    metaItem: {
      display: 'flex',
      alignItems: 'center',
      gap: 4,
      fontSize: 12,
      color: 'var(--text-secondary)',
    } as React.CSSProperties,

    actionBtn: {
      background: 'transparent',
      border: 'none',
      color: 'var(--text-secondary)',
      cursor: 'pointer',
      padding: 4,
      borderRadius: 4,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      transition: 'color 0.2s',
    } as React.CSSProperties,

    codeBlock: {
      background: 'rgba(20,20,35,0.8)',
      border: '1px solid var(--window-border)',
      borderRadius: 'var(--radius-sm)',
      padding: 12,
      color: '#a6e3a1',
      fontSize: 12,
      fontFamily: 'monospace',
      whiteSpace: 'pre-wrap',
      wordBreak: 'break-word',
      margin: 0,
      minHeight: 200,
      maxHeight: '100%',
      overflow: 'auto',
      lineHeight: 1.6,
    } as React.CSSProperties,

    historyItem: {
      padding: 10,
      background: 'rgba(20,20,35,0.5)',
      border: '1px solid var(--window-border)',
      borderRadius: 'var(--radius-sm)',
      cursor: 'pointer',
      marginBottom: 6,
      transition: 'all 0.2s',
    } as React.CSSProperties,

    errorBox: {
      padding: 12,
      background: 'var(--error-bg)',
      border: '1px solid var(--error)',
      borderRadius: 'var(--radius-sm)',
      color: 'var(--error)',
      marginBottom: 12,
      fontSize: 12,
    } as React.CSSProperties,

    emptyState: {
      color: 'var(--text-secondary)',
      textAlign: 'center',
      padding: '40px 20px',
      fontSize: 13,
    } as React.CSSProperties,

    modal: {
      position: 'fixed' as const,
      inset: 0,
      background: 'rgba(0,0,0,0.6)',
      backdropFilter: 'blur(6px)',
      WebkitBackdropFilter: 'blur(6px)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 10000,
      padding: 20,
    } as React.CSSProperties,

    modalContent: {
      background: 'var(--window-bg)',
      border: '1px solid var(--window-border)',
      borderRadius: 'var(--radius-md)',
      width: '100%',
      maxWidth: 720,
      maxHeight: '80vh',
      display: 'flex',
      flexDirection: 'column',
      overflow: 'hidden',
      boxShadow: 'var(--shadow-strong)',
    } as React.CSSProperties,

    modalHeader: {
      padding: '14px 18px',
      borderBottom: '1px solid var(--window-border)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
    } as React.CSSProperties,

    modalBody: {
      flex: 1,
      overflow: 'auto',
      padding: 16,
    } as React.CSSProperties,

    codeLangTabs: {
      display: 'flex',
      gap: 4,
      marginBottom: 12,
    } as React.CSSProperties,
  }

  return (
    <div style={styles.container}>
      <div style={styles.header}>
        <div style={styles.titleGroup}>
          <div style={{
            width: 36,
            height: 36,
            borderRadius: 'var(--radius-sm)',
            background: 'var(--accent-gradient)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            boxShadow: '0 4px 16px rgba(124,108,240,0.35)',
          }}>
            <Rocket size={18} color="#fff" />
          </div>
          <div>
            <h1 style={styles.title}>Web 请求实验室</h1>
            <p style={styles.subtitle}>HTTP 请求调试器 · Headers · Body · 代码生成</p>
          </div>
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          <button
            onClick={() => setShowCode(true)}
            style={{
              ...styles.actionBtn,
              color: 'var(--accent)',
              padding: '8px 12px',
              gap: 6,
              fontWeight: 600,
              fontSize: 12,
              border: '1px solid var(--window-border)',
              background: 'var(--accent-bg)',
              borderRadius: 'var(--radius-sm)',
            }}
          >
            <Code size={14} /> 生成代码
          </button>
          <button
            onClick={() => setShowHistory((v) => !v)}
            style={{
              ...styles.actionBtn,
              color: showHistory ? 'var(--accent)' : 'var(--text-secondary)',
              padding: '8px 12px',
              gap: 6,
              fontWeight: 600,
              fontSize: 12,
              border: '1px solid var(--window-border)',
              background: showHistory ? 'var(--accent-bg)' : 'rgba(20,20,35,0.4)',
              borderRadius: 'var(--radius-sm)',
            }}
          >
            <History size={14} /> 历史 ({history.length})
          </button>
        </div>
      </div>

      <div style={styles.toolbar}>
        <div style={styles.requestRow}>
          <select
            value={method}
            onChange={(e) => setMethod(e.target.value as HttpMethod)}
            style={{
              ...styles.methodSelect,
              color: METHOD_COLORS[method],
            }}
          >
            {METHODS.map((m) => (
              <option key={m} value={m} style={{ background: 'rgba(20,20,35,0.9)' }}>
                {m}
              </option>
            ))}
          </select>
          <input
            ref={urlInputRef}
            type="text"
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && canSend && sendRequest()}
            placeholder="输入 URL，例如 https://jsonplaceholder.typicode.com/todos/1"
            style={styles.urlInput}
          />
          <button
            onClick={sendRequest}
            disabled={!canSend}
            style={styles.sendBtn}
          >
            {loading ? (
              <>
                <Sparkles size={14} style={{ animation: 'pulse 1.5s infinite' }} />
                请求中...
              </>
            ) : (
              <>
                <Send size={14} />
                发送
              </>
            )}
          </button>
        </div>

        <div style={styles.proxyRow}>
          <label style={styles.checkboxLabel}>
            <input
              type="checkbox"
              checked={useProxy}
              onChange={(e) => setUseProxy(e.target.checked)}
              style={{ accentColor: 'var(--accent)' }}
            />
            <Globe size={13} /> 使用 CORS 代理
          </label>
          <span style={{ fontSize: 11, color: 'var(--text-secondary)', opacity: 0.7 }}>
            代理: https://api.allorigins.win/get?url=
          </span>
          <span style={{ fontSize: 11, color: 'var(--text-secondary)', opacity: 0.7, marginLeft: 'auto' }}>
            按 Enter 快速发送
          </span>
        </div>
      </div>

      <div style={styles.mainArea}>
        <div style={styles.leftPanel}>
          <div style={styles.tabsBar}>
            <button
              style={styles.tabBtn(activeTab === 'body')}
              onClick={() => setActiveTab('body')}
            >
              <FileJson size={13} /> Body
            </button>
            <button
              style={styles.tabBtn(activeTab === 'headers')}
              onClick={() => setActiveTab('headers')}
            >
              <Key size={13} /> Headers ({headers.filter((h) => h.enabled && h.key.trim()).length})
            </button>
            {showHistory && (
              <button
                style={styles.tabBtn(false)}
                onClick={() => setShowHistory(false)}
              >
                <History size={13} /> 隐藏历史
              </button>
            )}
          </div>

          <div style={styles.scrollArea}>
            {activeTab === 'body' && !['GET', 'HEAD'].includes(method) && (
              <div>
                <div style={styles.sectionLabel}>
                  <Server size={12} /> Body
                </div>
                <div style={styles.bodyTypeSelector}>
                  <button
                    style={styles.bodyTypeBtn(bodyType === 'none')}
                    onClick={() => setBodyType('none')}
                  >
                    无
                  </button>
                  <button
                    style={styles.bodyTypeBtn(bodyType === 'json')}
                    onClick={() => setBodyType('json')}
                  >
                    <FileJson size={13} /> JSON
                  </button>
                  <button
                    style={styles.bodyTypeBtn(bodyType === 'form-data')}
                    onClick={() => setBodyType('form-data')}
                  >
                    <FormInput size={13} /> Form-Data
                  </button>
                </div>
                {bodyType !== 'none' && (
                  <>
                    {bodyType === 'json' && body.trim() && (
                      <button
                        onClick={() => setBody(formatJson(body))}
                        style={{
                          ...styles.actionBtn,
                          color: 'var(--accent)',
                          marginBottom: 8,
                          padding: '4px 10px',
                          border: '1px solid var(--window-border)',
                          borderRadius: 4,
                          fontSize: 11,
                          fontWeight: 600,
                        }}
                      >
                        格式化 JSON
                      </button>
                    )}
                    <textarea
                      value={body}
                      onChange={(e) => setBody(e.target.value)}
                      placeholder={
                        bodyType === 'json'
                          ? '{\n  "key": "value"\n}'
                          : 'key1=value1\nkey2=value2'
                      }
                      style={styles.textarea}
                    />
                  </>
                )}
                {bodyType === 'none' && (
                  <div style={styles.emptyState}>
                    此请求不包含 Body
                  </div>
                )}
              </div>
            )}

            {activeTab === 'body' && ['GET', 'HEAD'].includes(method) && (
              <div style={styles.emptyState}>
                {method} 请求通常不包含 Body
              </div>
            )}

            {activeTab === 'headers' && (
              <div>
                <div style={styles.sectionLabel}>
                  <Key size={12} /> Headers ({headers.filter((h) => h.enabled && h.key.trim()).length})
                </div>
                {headers.map((h) => (
                  <div key={h.id} style={styles.headerRow}>
                    <input
                      type="checkbox"
                      checked={h.enabled}
                      onChange={() => toggleHeader(h.id)}
                      style={{ accentColor: 'var(--accent)', width: 14, height: 14 }}
                    />
                    <input
                      value={h.key}
                      onChange={(e) => updateHeader(h.id, 'key', e.target.value)}
                      placeholder="Header 名称"
                      style={styles.headerInput}
                    />
                    <input
                      value={h.value}
                      onChange={(e) => updateHeader(h.id, 'value', e.target.value)}
                      placeholder="Header 值"
                      style={{ ...styles.headerInput, flex: 1.5 }}
                    />
                    <button
                      onClick={() => removeHeader(h.id)}
                      style={{
                        ...styles.actionBtn,
                        color: 'var(--error)',
                      }}
                    >
                      <X size={14} />
                    </button>
                  </div>
                ))}
                <button onClick={addHeader} style={styles.addBtn}>
                  <Plus size={14} /> 添加 Header
                </button>
              </div>
            )}
          </div>
        </div>

        <div style={styles.rightPanel}>
          <div style={styles.responseHeader}>
            <div style={styles.responseTitle}>
              <Code size={14} color="var(--accent)" />
              响应
              {response && (
                <span style={styles.statusBadge(response.status)}>
                  {response.status} {response.statusText}
                </span>
              )}
            </div>
            {response && (
              <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
                <div style={styles.metaItem}>
                  <Clock size={12} />
                  {response.time}ms
                </div>
                <div style={styles.metaItem}>
                  <Server size={12} />
                  {formatSize(response.size)}
                </div>
                <button
                  onClick={() => copyToClipboard(response.body)}
                  style={{ ...styles.actionBtn, color: 'var(--accent)' }}
                  title="复制响应"
                >
                  {copied ? <Check size={14} /> : <Copy size={14} />}
                </button>
                <button
                  onClick={downloadResponse}
                  style={{ ...styles.actionBtn, color: 'var(--accent)' }}
                  title="下载响应"
                >
                  <Download size={14} />
                </button>
              </div>
            )}
          </div>

          <div style={styles.scrollArea}>
            {error && (
              <div style={styles.errorBox}>
                <strong>请求错误：</strong>
                <span>{error}</span>
                {error.toLowerCase().includes('cors') && (
                  <div style={{ marginTop: 8, fontSize: 11 }}>
                    提示：目标 API 可能未启用 CORS，勾选「使用 CORS 代理」后重试。
                  </div>
                )}
              </div>
            )}

            {loading && (
              <div style={styles.emptyState}>
                <Sparkles size={24} style={{ margin: '0 auto 10px', display: 'block' }} />
                正在发送请求，请稍候...
              </div>
            )}

            {!loading && !response && !error && (
              <div style={styles.emptyState}>
                <Send size={32} style={{ margin: '0 auto 12px', display: 'block', opacity: 0.5 }} />
                发送请求后，响应内容将显示在这里
              </div>
            )}

            {response && (
              <>
                <div style={styles.section}>
                  <div style={styles.sectionLabel}>
                    <Server size={12} /> 响应头
                  </div>
                  <div
                    style={{
                      background: 'rgba(20,20,35,0.6)',
                      border: '1px solid var(--window-border)',
                      borderRadius: 'var(--radius-sm)',
                      padding: 10,
                      fontSize: 11,
                      fontFamily: 'monospace',
                      maxHeight: 140,
                      overflow: 'auto',
                    }}
                  >
                    {Object.entries(response.headers).length === 0 ? (
                      <div style={{ color: 'var(--text-secondary)' }}>无响应头</div>
                    ) : (
                      Object.entries(response.headers).map(([k, v]) => (
                        <div key={k} style={{ marginBottom: 2 }}>
                          <span style={{ color: 'var(--accent)' }}>{k}:</span>{' '}
                          <span style={{ color: 'var(--text-primary)' }}>{v}</span>
                        </div>
                      ))
                    )}
                  </div>
                </div>

                <div>
                  <div style={styles.sectionLabel}>
                    <FileJson size={12} /> 响应体
                  </div>
                  <pre style={styles.codeBlock}>{response.body}</pre>
                </div>
              </>
            )}
          </div>
        </div>
      </div>

      {showHistory && (
        <div
          style={{
            position: 'absolute',
            right: 20,
            top: 90,
            width: 360,
            maxHeight: 'calc(100% - 120px)',
            background: 'var(--window-bg)',
            border: '1px solid var(--window-border)',
            borderRadius: 'var(--radius-md)',
            boxShadow: 'var(--shadow-strong)',
            display: 'flex',
            flexDirection: 'column',
            overflow: 'hidden',
            zIndex: 1000,
            backdropFilter: 'blur(12px)',
            WebkitBackdropFilter: 'blur(12px)',
          }}
        >
          <div
            style={{
              padding: '12px 14px',
              borderBottom: '1px solid var(--window-border)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontWeight: 600, fontSize: 13 }}>
              <History size={14} color="var(--accent)" /> 请求历史
            </div>
            <div style={{ display: 'flex', gap: 6 }}>
              {history.length > 0 && (
                <button
                  onClick={clearHistory}
                  style={{
                    ...styles.actionBtn,
                    color: 'var(--error)',
                    padding: '4px 8px',
                    gap: 4,
                    fontSize: 11,
                  }}
                >
                  <Trash size={12} /> 清空
                </button>
              )}
              <button
                onClick={() => setShowHistory(false)}
                style={styles.actionBtn}
              >
                <X size={14} />
              </button>
            </div>
          </div>
          <div style={{ flex: 1, overflow: 'auto', padding: 10 }}>
            {history.length === 0 ? (
              <div style={styles.emptyState}>暂无请求历史</div>
            ) : (
              history.map((entry) => (
                <div
                  key={entry.id}
                  style={styles.historyItem}
                  onClick={() => loadFromHistory(entry)}
                >
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 4 }}>
                    <span
                      style={{
                        color: METHOD_COLORS[entry.method],
                        fontWeight: 700,
                        fontSize: 11,
                      }}
                    >
                      {entry.method}
                    </span>
                    <span style={styles.statusBadge(entry.status)}>
                      {entry.status}
                    </span>
                  </div>
                  <div
                    style={{
                      fontSize: 11,
                      color: 'var(--text-secondary)',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      whiteSpace: 'nowrap',
                      marginBottom: 4,
                    }}
                  >
                    {entry.url}
                  </div>
                  <div
                    style={{
                      fontSize: 10,
                      color: 'var(--text-secondary)',
                      display: 'flex',
                      gap: 10,
                      opacity: 0.7,
                    }}
                  >
                    <span style={{ display: 'flex', alignItems: 'center', gap: 3 }}>
                      <Clock size={10} />
                      {new Date(entry.timestamp).toLocaleString('zh-CN')}
                    </span>
                    <span>{entry.time}ms</span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {showCode && (
        <div style={styles.modal} onClick={() => setShowCode(false)}>
          <div style={styles.modalContent} onClick={(e) => e.stopPropagation()}>
            <div style={styles.modalHeader}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontWeight: 600, fontSize: 14 }}>
                <Code size={16} color="var(--accent)" /> 生成代码
              </div>
              <button onClick={() => setShowCode(false)} style={styles.actionBtn}>
                <X size={18} />
              </button>
            </div>
            <div style={styles.modalBody}>
              <div style={styles.codeLangTabs}>
                {(['fetch', 'axios', 'curl'] as CodeLang[]).map((lang) => (
                  <button
                    key={lang}
                    onClick={() => setCodeLang(lang)}
                    style={{
                      padding: '6px 14px',
                      background: codeLang === lang ? 'var(--accent-bg)' : 'rgba(20,20,35,0.5)',
                      border: codeLang === lang ? '1px solid var(--accent)' : '1px solid var(--window-border)',
                      borderRadius: 'var(--radius-sm)',
                      color: codeLang === lang ? 'var(--accent)' : 'var(--text-secondary)',
                      cursor: 'pointer',
                      fontSize: 12,
                      fontWeight: 600,
                      textTransform: 'capitalize' as const,
                    }}
                  >
                    {lang === 'curl' ? 'cURL' : lang}
                  </button>
                ))}
              </div>
              <pre style={{ ...styles.codeBlock, maxHeight: 'calc(80vh - 220px)' }}>
                {generateCode()}
              </pre>
              <div style={{ marginTop: 12, display: 'flex', gap: 8 }}>
                <button
                  onClick={() => copyToClipboard(generateCode())}
                  style={{
                    padding: '8px 16px',
                    background: 'var(--accent-gradient)',
                    border: 'none',
                    borderRadius: 'var(--radius-sm)',
                    color: '#fff',
                    fontWeight: 600,
                    cursor: 'pointer',
                    fontSize: 12,
                    display: 'flex',
                    alignItems: 'center',
                    gap: 6,
                  }}
                >
                  {copied ? <Check size={14} /> : <Copy size={14} />}
                  {copied ? '已复制' : '复制代码'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}