import { useState, useCallback, useEffect, useMemo } from 'react'

type HttpMethod = 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE' | 'HEAD' | 'OPTIONS'
type TabType = 'params' | 'headers' | 'body' | 'code' | 'env'
type ResponseTab = 'body' | 'headers' | 'preview'
type CodeLang = 'fetch' | 'axios' | 'xhr'

interface HeaderEntry {
  id: string
  key: string
  value: string
  enabled: boolean
}

interface ApiResponse {
  status: number
  statusText: string
  headers: Record<string, string>
  body: string
  time: number
  size: number
  contentType: string
}

interface HistoryEntry {
  id: string
  method: HttpMethod
  url: string
  headers: HeaderEntry[]
  body: string
  response: ApiResponse | null
  timestamp: number
  envVars: Record<string, string>
}

interface CollectionItem {
  id: string
  name: string
  method: HttpMethod
  url: string
  headers: HeaderEntry[]
  body: string
}

interface Environment {
  id: string
  name: string
  variables: Record<string, string>
}

const METHODS: HttpMethod[] = ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'HEAD', 'OPTIONS']

const METHOD_COLORS: Record<HttpMethod, string> = {
  GET: '#22c55e',
  POST: '#3b82f6',
  PUT: '#f59e0b',
  PATCH: '#8b5cf6',
  DELETE: '#ef4444',
  HEAD: '#6b7280',
  OPTIONS: '#06b6d4',
}

const STORAGE_KEYS = {
  history: 'weblinux-api-testing-history',
  collections: 'weblinux-api-testing-collections',
  environments: 'weblinux-api-testing-environments',
  activeEnv: 'weblinux-api-testing-active-env',
}

const uid = () => Math.random().toString(36).slice(2, 10)

const createHeader = (key = '', value = ''): HeaderEntry => ({
  id: uid(),
  key,
  value,
  enabled: true,
})

const PRESET_COLLECTIONS: CollectionItem[] = [
  {
    id: uid(),
    name: 'GitHub 用户',
    method: 'GET',
    url: 'https://api.github.com/users/github',
    headers: [createHeader('Accept', 'application/json')],
    body: '',
  },
  {
    id: uid(),
    name: 'JSONPlaceholder 创建帖子',
    method: 'POST',
    url: 'https://jsonplaceholder.typicode.com/posts',
    headers: [
      createHeader('Content-Type', 'application/json'),
      createHeader('Accept', 'application/json'),
    ],
    body: JSON.stringify({ title: 'foo', body: 'bar', userId: 1 }, null, 2),
  },
  {
    id: uid(),
    name: 'Open-Meteo 天气',
    method: 'GET',
    url: 'https://api.open-meteo.com/v1/forecast?latitude=39.9&longitude=116.4&current=temperature_2m',
    headers: [],
    body: '',
  },
  {
    id: uid(),
    name: 'Hacker News 热门',
    method: 'GET',
    url: 'https://hn.algolia.com/api/v1/search?tags=front_page&hitsPerPage=10',
    headers: [],
    body: '',
  },
]

const DEFAULT_ENVIRONMENTS: Environment[] = [
  {
    id: uid(),
    name: '默认环境',
    variables: {
      baseUrl: 'https://api.example.com',
      token: 'your-token-here',
    },
  },
]

const isValidJSON = (str: string): boolean => {
  if (!str.trim()) return true
  try {
    JSON.parse(str)
    return true
  } catch {
    return false
  }
}

const formatSize = (bytes: number): string => {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(2)} KB`
  return `${(bytes / 1024 / 1024).toFixed(2)} MB`
}

const formatStatusColor = (status: number): string => {
  if (status === 0) return '#ef4444'
  if (status < 300) return '#22c55e'
  if (status < 400) return '#3b82f6'
  if (status < 500) return '#f59e0b'
  return '#ef4444'
}

const resolveEnvVars = (input: string, vars: Record<string, string>): string => {
  return input.replace(/\{\{\s*(\w+)\s*\}\}/g, (_, name) => {
    return vars[name] ?? `{{${name}}}`
  })
}

const generateCodeSnippet = (
  lang: CodeLang,
  method: HttpMethod,
  url: string,
  headers: HeaderEntry[],
  body: string,
): string => {
  const activeHeaders = headers.filter((h) => h.enabled && h.key.trim())
  const headerObj: Record<string, string> = {}
  activeHeaders.forEach((h) => {
    headerObj[h.key] = h.value
  })

  const hasBody = ['POST', 'PUT', 'PATCH', 'DELETE'].includes(method) && body.trim()

  if (lang === 'fetch') {
    const opts: string[] = [`  method: '${method}'`]
    if (activeHeaders.length > 0) {
      opts.push(`  headers: ${JSON.stringify(headerObj, null, 2)}`)
    }
    if (hasBody) {
      opts.push(`  body: ${JSON.stringify(body)}`)
    }
    return `// Fetch API
const response = await fetch('${url}', {
${opts.join(',\n')}
});

const data = await response.json();
console.log(data);`
  }

  if (lang === 'axios') {
    const lines: string[] = []
    lines.push(`// Axios`)
    lines.push(`const { data } = await axios.${method.toLowerCase()}('${url}'`)
    if (hasBody) {
      lines.push(`  , ${JSON.stringify(body)}`)
    }
    if (activeHeaders.length > 0) {
      lines.push(`  , {`)
      lines.push(`    headers: ${JSON.stringify(headerObj, null, 4)}`)
      lines.push(`  }`)
    }
    lines.push(`);`)
    lines.push(`console.log(data);`)
    return lines.join('\n')
  }

  // XMLHttpRequest
  const lines: string[] = []
  lines.push(`// XMLHttpRequest`)
  lines.push(`const xhr = new XMLHttpRequest();`)
  lines.push(`xhr.open('${method}', '${url}');`)
  activeHeaders.forEach((h) => {
    lines.push(`xhr.setRequestHeader('${h.key}', '${h.value}');`)
  })
  lines.push(`xhr.onload = function() {`)
  lines.push(`  console.log(xhr.responseText);`)
  lines.push(`};`)
  lines.push(`xhr.onerror = function() {`)
  lines.push(`  console.error('Request failed');`)
  lines.push(`};`)
  if (hasBody) {
    lines.push(`xhr.send(${JSON.stringify(body)});`)
  } else {
    lines.push(`xhr.send();`)
  }
  return lines.join('\n')
}

const highlightJSON = (json: string): string => {
  if (!json) return ''
  try {
    const formatted = JSON.stringify(JSON.parse(json), null, 2)
    return formatted
      .replace(/(".*?"\s*:\s*)(".*?")/g, '$1$2')
      .replace(/(".*?"\s*:\s*)(true|false)/g, '$1$2')
      .replace(/(".*?"\s*:\s*)(null)/g, '$1$2')
      .replace(/(".*?"\s*:\s*)(-?\d+\.?\d*)/g, '$1$2')
  } catch {
    return json
  }
}

const APITestingPro = () => {
  const [method, setMethod] = useState<HttpMethod>('GET')
  const [url, setUrl] = useState('https://api.github.com/repos/saya-ch/WebLinuxOS')
  const [headers, setHeaders] = useState<HeaderEntry[]>([
    createHeader('Accept', 'application/json'),
    createHeader('Content-Type', 'application/json'),
  ])
  const [body, setBody] = useState('')
  const [response, setResponse] = useState<ApiResponse | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [activeTab, setActiveTab] = useState<TabType>('params')
  const [responseTab, setResponseTab] = useState<ResponseTab>('body')
  const [history, setHistory] = useState<HistoryEntry[]>([])
  const [collections, setCollections] = useState<CollectionItem[]>(PRESET_COLLECTIONS)
  const [collectionsOpen, setCollectionsOpen] = useState(false)
  const [environments, setEnvironments] = useState<Environment[]>(DEFAULT_ENVIRONMENTS)
  const [activeEnvId, setActiveEnvId] = useState<string>(DEFAULT_ENVIRONMENTS[0].id)
  const [codeLang, setCodeLang] = useState<CodeLang>('fetch')
  const [showEnvPanel, setShowEnvPanel] = useState(false)
  const [copied, setCopied] = useState(false)

  const activeEnv = useMemo(
    () => environments.find((e) => e.id === activeEnvId) ?? environments[0],
    [environments, activeEnvId],
  )

  const activeHeaders = useMemo(() => headers.filter((h) => h.enabled && h.key.trim()), [headers])

  useEffect(() => {
    try {
      const savedHistory = localStorage.getItem(STORAGE_KEYS.history)
      if (savedHistory) setHistory(JSON.parse(savedHistory))
      const savedCollections = localStorage.getItem(STORAGE_KEYS.collections)
      if (savedCollections) setCollections(JSON.parse(savedCollections))
      const savedEnvs = localStorage.getItem(STORAGE_KEYS.environments)
      if (savedEnvs) setEnvironments(JSON.parse(savedEnvs))
      const savedActiveEnv = localStorage.getItem(STORAGE_KEYS.activeEnv)
      if (savedActiveEnv) setActiveEnvId(savedActiveEnv)
    } catch {}
  }, [])

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEYS.history, JSON.stringify(history.slice(0, 20)))
    } catch {}
  }, [history])

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEYS.collections, JSON.stringify(collections))
    } catch {}
  }, [collections])

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEYS.environments, JSON.stringify(environments))
    } catch {}
  }, [environments])

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEYS.activeEnv, activeEnvId)
    } catch {}
  }, [activeEnvId])

  const updateHeader = useCallback((id: string, field: 'key' | 'value' | 'enabled', value: string | boolean) => {
    setHeaders((prev) => prev.map((h) => (h.id === id ? { ...h, [field]: value } : h)))
  }, [])

  const addHeader = useCallback(() => {
    setHeaders((prev) => [...prev, createHeader()])
  }, [])

  const removeHeader = useCallback((id: string) => {
    setHeaders((prev) => prev.filter((h) => h.id !== id))
  }, [])

  const sendRequest = useCallback(async () => {
    if (!url.trim()) return
    setIsLoading(true)
    setResponse(null)

    const resolvedUrl = resolveEnvVars(url, activeEnv?.variables ?? {})
    const resolvedHeaders = headers.map((h) => ({
      ...h,
      value: resolveEnvVars(h.value, activeEnv?.variables ?? {}),
    }))

    const headerObj: Record<string, string> = {}
    resolvedHeaders.forEach((h) => {
      if (h.enabled && h.key.trim()) headerObj[h.key] = h.value
    })

    const options: RequestInit = {
      method,
      headers: headerObj,
    }

    if (['POST', 'PUT', 'PATCH', 'DELETE'].includes(method) && body.trim()) {
      options.body = body
    }

    const startTime = performance.now()
    try {
      const res = await fetch(resolvedUrl, options)
      const responseTime = Math.round(performance.now() - startTime)

      const responseHeaders: Record<string, string> = {}
      res.headers.forEach((value, key) => {
        responseHeaders[key] = value
      })

      const text = await res.text()
      const size = new Blob([text]).size
      const contentType = res.headers.get('content-type') ?? ''

      const apiResponse: ApiResponse = {
        status: res.status,
        statusText: res.statusText,
        headers: responseHeaders,
        body: text,
        time: responseTime,
        size,
        contentType,
      }

      setResponse(apiResponse)

      const entry: HistoryEntry = {
        id: uid(),
        method,
        url,
        headers: [...headers],
        body,
        response: apiResponse,
        timestamp: Date.now(),
        envVars: { ...(activeEnv?.variables ?? {}) },
      }
      setHistory((prev) => [entry, ...prev].slice(0, 20))
    } catch (err) {
      const errorTime = Math.round(performance.now() - startTime)
      const errMsg = err instanceof Error ? err.message : String(err)
      setResponse({
        status: 0,
        statusText: '请求失败',
        headers: {},
        body: errMsg,
        time: errorTime,
        size: 0,
        contentType: '',
      })

      const entry: HistoryEntry = {
        id: uid(),
        method,
        url,
        headers: [...headers],
        body,
        response: {
          status: 0,
          statusText: '请求失败',
          headers: {},
          body: errMsg,
          time: errorTime,
          size: 0,
          contentType: '',
        },
        timestamp: Date.now(),
        envVars: { ...(activeEnv?.variables ?? {}) },
      }
      setHistory((prev) => [entry, ...prev].slice(0, 20))
    } finally {
      setIsLoading(false)
    }
  }, [url, method, headers, body, activeEnv])

  const loadFromHistory = useCallback((entry: HistoryEntry) => {
    setMethod(entry.method)
    setUrl(entry.url)
    setHeaders(entry.headers.map((h) => ({ ...h, id: uid() })))
    setBody(entry.body)
    if (entry.envVars && activeEnv) {
      const newEnvVars = { ...activeEnv.variables, ...entry.envVars }
      setEnvironments((prev) =>
        prev.map((e) => (e.id === activeEnv.id ? { ...e, variables: newEnvVars } : e)),
      )
    }
  }, [activeEnv])

  const loadFromCollection = useCallback((item: CollectionItem) => {
    setMethod(item.method)
    setUrl(item.url)
    setHeaders(item.headers.map((h) => ({ ...h, id: uid() })))
    setBody(item.body)
  }, [])

  const saveToCollections = useCallback(() => {
    const name = prompt('保存到集合的名称:')
    if (!name) return
    const newItem: CollectionItem = {
      id: uid(),
      name,
      method,
      url,
      headers: [...headers],
      body,
    }
    setCollections((prev) => [newItem, ...prev])
  }, [method, url, headers, body])

  const deleteFromCollections = useCallback((id: string) => {
    setCollections((prev) => prev.filter((c) => c.id !== id))
  }, [])

  const exportCollections = useCallback(() => {
    const data = JSON.stringify(collections, null, 2)
    const blob = new Blob([data], { type: 'application/json' })
    const downloadUrl = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = downloadUrl
    a.download = `api-collections-${Date.now()}.json`
    a.click()
    URL.revokeObjectURL(downloadUrl)
  }, [collections])

  const importCollections = useCallback(() => {
    const input = document.createElement('input')
    input.type = 'file'
    input.accept = 'application/json'
    input.onchange = (e) => {
      const file = (e.target as HTMLInputElement).files?.[0]
      if (!file) return
      const reader = new FileReader()
      reader.onload = (evt) => {
        try {
          const parsed = JSON.parse(evt.target?.result as string)
          if (Array.isArray(parsed)) {
            const items: CollectionItem[] = parsed.map((p: any) => ({
              id: uid(),
              name: p.name || '未命名',
              method: p.method || 'GET',
              url: p.url || '',
              headers: (p.headers || []).map((h: any) => createHeader(h.key || '', h.value || '')),
              body: p.body || '',
            }))
            setCollections((prev) => [...items, ...prev])
          }
        } catch {
          alert('导入失败：无效的 JSON 格式')
        }
      }
      reader.readAsText(file)
    }
    input.click()
  }, [])

  const copyToClipboard = useCallback((text: string) => {
    navigator.clipboard.writeText(text).then(() => {
      setCopied(true)
      setTimeout(() => setCopied(false), 1500)
    })
  }, [])

  const updateEnvVar = useCallback((envId: string, key: string, value: string) => {
    setEnvironments((prev) =>
      prev.map((e) => {
        if (e.id !== envId) return e
        const newVars = { ...e.variables }
        if (value === '') {
          delete newVars[key]
        } else {
          newVars[key] = value
        }
        return { ...e, variables: newVars }
      }),
    )
  }, [])

  const addEnvVar = useCallback((envId: string) => {
    const key = prompt('变量名:')
    if (!key) return
    const value = prompt('变量值:') || ''
    setEnvironments((prev) =>
      prev.map((e) =>
        e.id === envId ? { ...e, variables: { ...e.variables, [key]: value } } : e,
      ),
    )
  }, [])

  const addEnvironment = useCallback(() => {
    const name = prompt('环境名称:')
    if (!name) return
    const newEnv: Environment = { id: uid(), name, variables: {} }
    setEnvironments((prev) => [...prev, newEnv])
    setActiveEnvId(newEnv.id)
  }, [])

  const deleteEnvironment = useCallback((envId: string) => {
    if (!confirm('确定要删除此环境吗？')) return
    setEnvironments((prev) => {
      const next = prev.filter((e) => e.id !== envId)
      if (activeEnvId === envId && next.length > 0) {
        setActiveEnvId(next[0].id)
      }
      return next
    })
  }, [activeEnvId])

  const codeSnippet = useMemo(
    () => generateCodeSnippet(codeLang, method, url, headers, body),
    [codeLang, method, url, headers, body],
  )

  const responseBodyText = useMemo(() => {
    if (!response) return ''
    return responseTab === 'preview' && response.contentType.includes('json')
      ? highlightJSON(response.body)
      : response.body
  }, [response, responseTab])

  const bodyIsValidJSON = useMemo(() => {
    if (!['POST', 'PUT', 'PATCH', 'DELETE'].includes(method)) return true
    if (!body.trim()) return true
    return isValidJSON(body)
  }, [body, method])

  return (
    <div className="apit-app">
      <div className="apit-header">
        <div className="apit-title">
          <div className="apit-logo">⚡</div>
          <div>
            <h1>API Testing Pro</h1>
            <p>专业级 API 测试工具 · 支持真实 HTTP 请求</p>
          </div>
        </div>
        <div className="apit-header-actions">
          <span className="apit-env-badge" onClick={() => setShowEnvPanel((v) => !v)}>
            🌐 {activeEnv?.name ?? '无环境'}
          </span>
          <button className="apit-icon-btn" onClick={exportCollections} title="导出集合">
            📤
          </button>
          <button className="apit-icon-btn" onClick={importCollections} title="导入集合">
            📥
          </button>
        </div>
      </div>

      {showEnvPanel && (
        <div className="apit-env-panel">
          <div className="apit-env-header">
            <span>环境变量</span>
            <button className="apit-btn-small" onClick={addEnvironment}>
              + 新建环境
            </button>
          </div>
          <div className="apit-env-list">
            {environments.map((env) => (
              <div
                key={env.id}
                className={`apit-env-card ${env.id === activeEnvId ? 'active' : ''}`}
                onClick={() => setActiveEnvId(env.id)}
              >
                <div className="apit-env-name">
                  <span
                    onClick={(e) => {
                      e.stopPropagation()
                      const newName = prompt('环境名称:', env.name)
                      if (newName) {
                        setEnvironments((prev) =>
                          prev.map((e) => (e.id === env.id ? { ...e, name: newName } : e)),
                        )
                      }
                    }}
                  >
                    {env.name}
                  </span>
                  <button
                    className="apit-btn-del"
                    onClick={(e) => {
                      e.stopPropagation()
                      deleteEnvironment(env.id)
                    }}
                  >
                    ✕
                  </button>
                </div>
                <div className="apit-env-vars">
                  {Object.entries(env.variables).map(([k, v]) => (
                    <div key={k} className="apit-env-var-row">
                      <input
                        className="apit-env-key"
                        value={k}
                        onChange={(e) => {
                          const oldKey = k
                          const newKey = e.target.value
                          setEnvironments((prev) =>
                            prev.map((e) => {
                              if (e.id !== env.id) return e
                              const newVars: Record<string, string> = {}
                              Object.entries(e.variables).forEach(([key, val]) => {
                                if (key === oldKey) newVars[newKey] = val
                                else newVars[key] = val
                              })
                              return { ...e, variables: newVars }
                            }),
                          )
                        }}
                        onClick={(e) => e.stopPropagation()}
                      />
                      <input
                        className="apit-env-value"
                        value={v}
                        onChange={(e) => updateEnvVar(env.id, k, e.target.value)}
                        placeholder="值"
                        onClick={(e) => e.stopPropagation()}
                      />
                      <button
                        className="apit-btn-mini"
                        onClick={(e) => {
                          e.stopPropagation()
                          updateEnvVar(env.id, k, '')
                        }}
                      >
                        ✕
                      </button>
                    </div>
                  ))}
                  <button
                    className="apit-btn-add-var"
                    onClick={(e) => {
                      e.stopPropagation()
                      addEnvVar(env.id)
                    }}
                  >
                    + 添加变量
                  </button>
                </div>
                <div className="apit-env-hint">使用 {'{{variableName}}'} 在请求中引用变量</div>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="apit-request-bar">
        <div className="apit-method-wrap">
          <select
            className="apit-method"
            value={method}
            onChange={(e) => setMethod(e.target.value as HttpMethod)}
            style={{ borderColor: METHOD_COLORS[method] }}
          >
            {METHODS.map((m) => (
              <option key={m} value={m}>
                {m}
              </option>
            ))}
          </select>
        </div>
        <input
          className="apit-url"
          value={url}
          onChange={(e) => setUrl(e.target.value)}
          placeholder="https://api.example.com/endpoint  (支持 {{variable}} 变量)"
          onKeyDown={(e) => {
            if (e.key === 'Enter') sendRequest()
          }}
          spellCheck={false}
        />
        <button
          className={`apit-send ${isLoading ? 'loading' : ''}`}
          onClick={sendRequest}
          disabled={isLoading || !url.trim()}
          style={{
            background: isLoading
              ? 'linear-gradient(135deg, #374151, #1f2937)'
              : `linear-gradient(135deg, ${METHOD_COLORS[method]}, ${METHOD_COLORS[method]}cc)`,
          }}
        >
          {isLoading ? (
            <>
              <span className="apit-spinner" /> 发送中...
            </>
          ) : (
            <>
              <span>➤</span> 发送
            </>
          )}
        </button>
      </div>

      <div className="apit-body">
        <div className="apit-sidebar">
          <div className="apit-section">
            <div className="apit-section-header">
              <h3>📁 请求集合</h3>
              <button className="apit-link-btn" onClick={() => setCollectionsOpen((v) => !v)}>
                {collectionsOpen ? '收起' : '展开'}
              </button>
            </div>
            {collectionsOpen && (
              <div className="apit-collections">
                {collections.length === 0 && (
                  <p className="apit-empty-hint">暂无集合，发送请求后点击 ⭐ 保存</p>
                )}
                {collections.map((item) => (
                  <div key={item.id} className="apit-collection-item">
                    <div className="apit-collection-info" onClick={() => loadFromCollection(item)}>
                      <span
                        className="apit-method-tag"
                        style={{ background: METHOD_COLORS[item.method] }}
                      >
                        {item.method}
                      </span>
                      <div className="apit-collection-detail">
                        <span className="apit-collection-name">{item.name}</span>
                        <span className="apit-collection-url">
                          {item.url.length > 35 ? item.url.slice(0, 35) + '...' : item.url}
                        </span>
                      </div>
                    </div>
                    <button
                      className="apit-btn-del-item"
                      onClick={() => deleteFromCollections(item.id)}
                      title="删除"
                    >
                      ✕
                    </button>
                  </div>
                ))}
              </div>
            )}
            <button className="apit-save-btn" onClick={saveToCollections}>
              ⭐ 保存当前请求到集合
            </button>
          </div>

          <div className="apit-section">
            <h3>🕐 请求历史</h3>
            {history.length === 0 && <p className="apit-empty-hint">暂无历史记录</p>}
            {history.map((entry) => (
              <div
                key={entry.id}
                className="apit-history-item"
                onClick={() => loadFromHistory(entry)}
              >
                <span
                  className="apit-history-method"
                  style={{ color: METHOD_COLORS[entry.method] }}
                >
                  {entry.method}
                </span>
                <span className="apit-history-url">
                  {entry.url.length > 30 ? entry.url.slice(0, 30) + '...' : entry.url}
                </span>
                <span
                  className="apit-history-status"
                  style={{ color: entry.response ? formatStatusColor(entry.response.status) : '#6b7280' }}
                >
                  {entry.response?.status ?? '—'}
                </span>
                <span className="apit-history-time">
                  {new Date(entry.timestamp).toLocaleTimeString()}
                </span>
              </div>
            ))}
            {history.length > 0 && (
              <button
                className="apit-link-btn"
                onClick={() => {
                  if (confirm('确定清空所有历史记录？')) setHistory([])
                }}
              >
                清空历史
              </button>
            )}
          </div>
        </div>

        <div className="apit-main">
          <div className="apit-request-panel">
            <div className="apit-tabs">
              {(['params', 'headers', 'body', 'code', 'env'] as TabType[]).map((tab) => (
                <button
                  key={tab}
                  className={`apit-tab ${activeTab === tab ? 'active' : ''}`}
                  onClick={() => setActiveTab(tab)}
                >
                  {tab === 'params' && '📋 说明'}
                  {tab === 'headers' && (
                    <>
                      🔧 请求头{' '}
                      {activeHeaders.length > 0 && (
                        <span className="apit-tab-badge">{activeHeaders.length}</span>
                      )}
                    </>
                  )}
                  {tab === 'body' && (
                    <>
                      📝 请求体{' '}
                      {body && !bodyIsValidJSON && <span className="apit-tab-warn">⚠</span>}
                    </>
                  )}
                  {tab === 'code' && '💻 代码'}
                  {tab === 'env' && '🌐 环境'}
                </button>
              ))}
            </div>

            <div className="apit-tab-content">
              {activeTab === 'params' && (
                <div className="apit-params-help">
                  <h4>🚀 快速上手</h4>
                  <ul>
                    <li>选择 HTTP 方法并输入 API URL（支持 <code>{'{{variable}}'}</code> 环境变量）</li>
                    <li>在「请求头」中管理 Headers 键值对</li>
                    <li>在「请求体」中输入 POST/PUT/PATCH 请求体（支持 JSON 验证）</li>
                    <li>点击「发送」或按 Enter 键执行请求</li>
                  </ul>
                  <h4>📡 HTTP 方法</h4>
                  <div className="apit-methods-grid">
                    {METHODS.map((m) => (
                      <span
                        key={m}
                        className="apit-method-badge"
                        style={{ background: METHOD_COLORS[m] }}
                      >
                        {m}
                      </span>
                    ))}
                  </div>
                  <h4>💡 提示</h4>
                  <div className="apit-tips">
                    <p>
                      • 由于浏览器 CORS 策略，部分 API 可能无法直接请求。建议使用支持 CORS 的公开 API。
                    </p>
                    <p>• 使用 <code>{'{{baseUrl}}'}</code> 等变量在不同环境间切换。</p>
                    <p>• 所有数据均保存在浏览器本地存储中。</p>
                  </div>
                </div>
              )}

              {activeTab === 'headers' && (
                <div className="apit-headers-editor">
                  <div className="apit-headers-toolbar">
                    <button className="apit-btn-primary" onClick={addHeader}>
                      + 添加请求头
                    </button>
                    <span className="apit-headers-hint">启用的请求头将随请求一起发送</span>
                  </div>
                  <div className="apit-headers-list">
                    {headers.map((h) => (
                      <div key={h.id} className="apit-header-row">
                        <input
                          type="checkbox"
                          checked={h.enabled}
                          onChange={(e) => updateHeader(h.id, 'enabled', e.target.checked)}
                          className="apit-header-check"
                        />
                        <input
                          className="apit-header-key-input"
                          value={h.key}
                          onChange={(e) => updateHeader(h.id, 'key', e.target.value)}
                          placeholder="Header 名称"
                          spellCheck={false}
                        />
                        <input
                          className="apit-header-value-input"
                          value={h.value}
                          onChange={(e) => updateHeader(h.id, 'value', e.target.value)}
                          placeholder="Header 值"
                          spellCheck={false}
                        />
                        <button
                          className="apit-btn-del-item"
                          onClick={() => removeHeader(h.id)}
                          title="删除"
                        >
                          ✕
                        </button>
                      </div>
                    ))}
                    {headers.length === 0 && (
                      <p className="apit-empty-hint">暂无请求头，点击上方按钮添加</p>
                    )}
                  </div>
                </div>
              )}

              {activeTab === 'body' && (
                <div className="apit-body-editor">
                  {!['POST', 'PUT', 'PATCH', 'DELETE'].includes(method) && (
                    <div className="apit-body-disabled">
                      ⓘ <span>{method}</span> 方法通常不携带请求体
                    </div>
                  )}
                  {['POST', 'PUT', 'PATCH', 'DELETE'].includes(method) && (
                    <>
                      <div className="apit-body-toolbar">
                        <span className="apit-body-label">JSON 请求体</span>
                        <div className="apit-body-actions">
                          {body && !bodyIsValidJSON && (
                            <span className="apit-validation-warn">⚠ JSON 格式无效</span>
                          )}
                          {body && bodyIsValidJSON && (
                            <span className="apit-validation-ok">✓ JSON 格式有效</span>
                          )}
                          <button
                            className="apit-btn-small"
                            onClick={() => {
                              if (body.trim() && isValidJSON(body)) {
                                try {
                                  setBody(JSON.stringify(JSON.parse(body), null, 2))
                                } catch {}
                              }
                            }}
                            disabled={!body}
                          >
                            格式化
                          </button>
                          <button
                            className="apit-btn-small"
                            onClick={() => setBody('')}
                            disabled={!body}
                          >
                            清空
                          </button>
                        </div>
                      </div>
                      <textarea
                        className={`apit-body-textarea ${body && !bodyIsValidJSON ? 'invalid' : ''}`}
                        value={body}
                        onChange={(e) => setBody(e.target.value)}
                        placeholder='{\n  "key": "value"\n}'
                        spellCheck={false}
                      />
                    </>
                  )}
                </div>
              )}

              {activeTab === 'code' && (
                <div className="apit-code-panel">
                  <div className="apit-code-toolbar">
                    <div className="apit-code-tabs">
                      {(['fetch', 'axios', 'xhr'] as CodeLang[]).map((lang) => (
                        <button
                          key={lang}
                          className={`apit-code-tab ${codeLang === lang ? 'active' : ''}`}
                          onClick={() => setCodeLang(lang)}
                        >
                          {lang === 'fetch' && 'Fetch API'}
                          {lang === 'axios' && 'Axios'}
                          {lang === 'xhr' && 'XMLHttpRequest'}
                        </button>
                      ))}
                    </div>
                    <button className="apit-btn-copy" onClick={() => copyToClipboard(codeSnippet)}>
                      {copied ? '✓ 已复制' : '📋 复制代码'}
                    </button>
                  </div>
                  <pre className="apit-code-output">{codeSnippet}</pre>
                </div>
              )}

              {activeTab === 'env' && (
                <div className="apit-env-quick">
                  <h4>当前环境: {activeEnv?.name}</h4>
                  <p className="apit-env-desc">
                    使用 <code>{'{{variableName}}'}</code> 在 URL 和请求头中引用变量。
                  </p>
                  {activeEnv && (
                    <div className="apit-env-vars-list">
                      {Object.entries(activeEnv.variables).map(([k, v]) => (
                        <div key={k} className="apit-env-var-display">
                          <code>{'{{' + k + '}}'}</code>
                          <span className="apit-env-eq">=</span>
                          <code className="apit-env-val">{v || '(空)'}</code>
                        </div>
                      ))}
                      {Object.keys(activeEnv.variables).length === 0 && (
                        <p className="apit-empty-hint">当前环境暂无变量</p>
                      )}
                    </div>
                  )}
                  <button className="apit-btn-primary" onClick={() => setShowEnvPanel(true)}>
                    打开环境管理器
                  </button>
                </div>
              )}
            </div>
          </div>

          <div className="apit-response-panel">
            <div className="apit-response-header">
              <div className="apit-response-status">
                {response ? (
                  <>
                    <span
                      className="apit-status-code"
                      style={{ color: formatStatusColor(response.status) }}
                    >
                      {response.status || 'ERR'}
                    </span>
                    <span className="apit-status-text">{response.statusText}</span>
                    <span className="apit-response-meta">⏱ {response.time}ms</span>
                    <span className="apit-response-meta">📦 {formatSize(response.size)}</span>
                    {response.contentType && (
                      <span className="apit-response-meta">
                        📄 {response.contentType.split(';')[0]}
                      </span>
                    )}
                  </>
                ) : (
                  <span className="apit-no-response">
                    {isLoading ? '⏳ 请求中...' : '↗ 发送请求以查看响应'}
                  </span>
                )}
              </div>
              <div className="apit-response-tabs">
                {(['body', 'headers', 'preview'] as ResponseTab[]).map((tab) => (
                  <button
                    key={tab}
                    className={`apit-tab ${responseTab === tab ? 'active' : ''}`}
                    onClick={() => setResponseTab(tab)}
                    disabled={!response}
                  >
                    {tab === 'body' && '响应体'}
                    {tab === 'headers' && `响应头 ${response ? `(${Object.keys(response.headers).length})` : ''}`}
                    {tab === 'preview' && '🖼 预览'}
                  </button>
                ))}
                {response && (
                  <button
                    className="apit-btn-copy-sm"
                    onClick={() => copyToClipboard(response.body)}
                  >
                    📋
                  </button>
                )}
              </div>
            </div>

            <div className="apit-response-body">
              {!response ? (
                <div className="apit-empty">
                  <span className="apit-empty-icon">⚡</span>
                  <p>等待请求...</p>
                  <span className="apit-empty-hint-text">按 Enter 或点击发送按钮开始</span>
                </div>
              ) : responseTab === 'body' ? (
                <pre className="apit-response-text">{response.body}</pre>
              ) : responseTab === 'preview' ? (
                <pre className="apit-response-text">{responseBodyText}</pre>
              ) : (
                <div className="apit-headers-list">
                  {Object.entries(response.headers).map(([key, value]) => (
                    <div key={key} className="apit-header-row-view">
                      <span className="apit-header-key-view">{key}</span>
                      <span className="apit-header-value-view">{value}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      <style>{`
        .apit-app {
          height: 100%;
          display: flex;
          flex-direction: column;
          background: #0a0e1a;
          color: #e2e8f0;
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
          overflow: hidden;
        }
        .apit-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 14px 20px;
          background: linear-gradient(135deg, #0f172a 0%, #1e293b 50%, #334155 100%);
          border-bottom: 1px solid rgba(148, 163, 184, 0.1);
        }
        .apit-title {
          display: flex;
          align-items: center;
          gap: 12px;
        }
        .apit-logo {
          width: 40px;
          height: 40px;
          display: flex;
          align-items: center;
          justify-content: center;
          background: linear-gradient(135deg, #3b82f6, #8b5cf6);
          border-radius: 12px;
          font-size: 22px;
          box-shadow: 0 4px 12px rgba(59, 130, 246, 0.3);
        }
        .apit-title h1 {
          font-size: 16px;
          margin: 0;
          font-weight: 700;
          background: linear-gradient(135deg, #60a5fa, #a78bfa);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          background-clip: text;
        }
        .apit-title p {
          font-size: 11px;
          margin: 0;
          color: #94a3b8;
        }
        .apit-header-actions {
          display: flex;
          align-items: center;
          gap: 10px;
        }
        .apit-env-badge {
          padding: 6px 12px;
          background: rgba(59, 130, 246, 0.15);
          border: 1px solid rgba(59, 130, 246, 0.3);
          border-radius: 20px;
          font-size: 12px;
          cursor: pointer;
          color: #60a5fa;
          transition: all 0.2s;
        }
        .apit-env-badge:hover {
          background: rgba(59, 130, 246, 0.25);
        }
        .apit-icon-btn {
          width: 34px;
          height: 34px;
          border-radius: 8px;
          border: 1px solid rgba(148, 163, 184, 0.2);
          background: rgba(30, 41, 59, 0.6);
          color: #94a3b8;
          cursor: pointer;
          font-size: 14px;
          transition: all 0.2s;
          display: flex;
          align-items: center;
          justify-content: center;
        }
        .apit-icon-btn:hover {
          background: rgba(59, 130, 246, 0.2);
          border-color: rgba(59, 130, 246, 0.4);
          color: #60a5fa;
        }
        .apit-env-panel {
          max-height: 340px;
          overflow-y: auto;
          padding: 12px 20px;
          background: #0f172a;
          border-bottom: 1px solid rgba(148, 163, 184, 0.1);
        }
        .apit-env-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 10px;
        }
        .apit-env-header span {
          font-size: 13px;
          font-weight: 600;
          color: #e2e8f0;
        }
        .apit-env-list {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
          gap: 10px;
        }
        .apit-env-card {
          background: rgba(30, 41, 59, 0.6);
          border: 1px solid rgba(148, 163, 184, 0.15);
          border-radius: 10px;
          padding: 10px 12px;
          cursor: pointer;
          transition: all 0.2s;
        }
        .apit-env-card:hover {
          border-color: rgba(59, 130, 246, 0.4);
        }
        .apit-env-card.active {
          border-color: #3b82f6;
          background: rgba(59, 130, 246, 0.1);
          box-shadow: 0 0 0 1px rgba(59, 130, 246, 0.3);
        }
        .apit-env-name {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 8px;
        }
        .apit-env-name span {
          font-size: 13px;
          font-weight: 600;
          color: #e2e8f0;
        }
        .apit-env-vars {
          display: flex;
          flex-direction: column;
          gap: 4px;
        }
        .apit-env-var-row {
          display: flex;
          gap: 6px;
          align-items: center;
        }
        .apit-env-key, .apit-env-value {
          flex: 1;
          padding: 4px 8px;
          background: rgba(15, 23, 42, 0.6);
          border: 1px solid rgba(148, 163, 184, 0.15);
          border-radius: 5px;
          color: #e2e8f0;
          font-size: 12px;
          font-family: 'SF Mono', monospace;
          outline: none;
        }
        .apit-env-key {
          flex: 0 0 100px;
          color: #60a5fa;
        }
        .apit-env-key:focus, .apit-env-value:focus {
          border-color: #3b82f6;
        }
        .apit-btn-small {
          padding: 4px 10px;
          background: rgba(59, 130, 246, 0.2);
          border: 1px solid rgba(59, 130, 246, 0.3);
          border-radius: 5px;
          color: #60a5fa;
          font-size: 11px;
          cursor: pointer;
          transition: all 0.15s;
        }
        .apit-btn-small:hover {
          background: rgba(59, 130, 246, 0.3);
        }
        .apit-btn-small:disabled {
          opacity: 0.4;
          cursor: not-allowed;
        }
        .apit-btn-del {
          background: none;
          border: none;
          color: #64748b;
          cursor: pointer;
          font-size: 12px;
          padding: 2px 4px;
        }
        .apit-btn-del:hover {
          color: #ef4444;
        }
        .apit-btn-mini {
          background: none;
          border: none;
          color: #64748b;
          cursor: pointer;
          font-size: 11px;
          padding: 2px 4px;
        }
        .apit-btn-mini:hover {
          color: #ef4444;
        }
        .apit-btn-add-var {
          margin-top: 4px;
          background: none;
          border: 1px dashed rgba(148, 163, 184, 0.3);
          border-radius: 5px;
          color: #94a3b8;
          font-size: 11px;
          padding: 4px 8px;
          cursor: pointer;
          transition: all 0.15s;
          text-align: left;
        }
        .apit-btn-add-var:hover {
          border-color: #3b82f6;
          color: #60a5fa;
        }
        .apit-env-hint {
          margin-top: 8px;
          font-size: 10px;
          color: #64748b;
          font-family: monospace;
        }
        .apit-request-bar {
          display: flex;
          align-items: center;
          gap: 10px;
          padding: 14px 20px;
          background: #0f172a;
          border-bottom: 1px solid rgba(148, 163, 184, 0.1);
        }
        .apit-method-wrap {
          position: relative;
        }
        .apit-method {
          padding: 9px 16px;
          background: rgba(15, 23, 42, 0.8);
          border: 2px solid #3b82f6;
          border-radius: 8px;
          color: #e2e8f0;
          font-weight: 700;
          font-size: 13px;
          cursor: pointer;
          outline: none;
          transition: all 0.2s;
          min-width: 110px;
        }
        .apit-method:focus {
          box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.2);
        }
        .apit-url {
          flex: 1;
          padding: 10px 14px;
          background: rgba(15, 23, 42, 0.8);
          border: 1px solid rgba(148, 163, 184, 0.2);
          border-radius: 8px;
          color: #e2e8f0;
          font-size: 13px;
          font-family: 'SF Mono', 'Fira Code', monospace;
          outline: none;
          transition: all 0.2s;
        }
        .apit-url:focus {
          border-color: #3b82f6;
          box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.15);
        }
        .apit-send {
          padding: 10px 24px;
          border: none;
          color: white;
          border-radius: 8px;
          font-size: 13px;
          font-weight: 700;
          cursor: pointer;
          transition: all 0.2s;
          display: flex;
          align-items: center;
          gap: 6px;
          min-width: 110px;
          justify-content: center;
        }
        .apit-send:hover:not(:disabled) {
          transform: translateY(-1px);
          box-shadow: 0 6px 16px rgba(59, 130, 246, 0.3);
        }
        .apit-send:disabled {
          opacity: 0.5;
          cursor: not-allowed;
        }
        .apit-send.loading {
          cursor: wait;
        }
        .apit-spinner {
          width: 12px;
          height: 12px;
          border: 2px solid rgba(255, 255, 255, 0.3);
          border-top-color: white;
          border-radius: 50%;
          animation: apit-spin 0.8s linear infinite;
        }
        @keyframes apit-spin {
          to { transform: rotate(360deg); }
        }
        .apit-body {
          flex: 1;
          display: grid;
          grid-template-columns: 280px 1fr;
          overflow: hidden;
        }
        .apit-sidebar {
          background: #0f172a;
          border-right: 1px solid rgba(148, 163, 184, 0.1);
          overflow-y: auto;
          padding: 14px;
        }
        .apit-section {
          margin-bottom: 18px;
        }
        .apit-section-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 8px;
        }
        .apit-section h3 {
          font-size: 12px;
          color: #94a3b8;
          text-transform: uppercase;
          letter-spacing: 0.5px;
          margin: 0 0 10px;
          font-weight: 600;
        }
        .apit-link-btn {
          background: none;
          border: none;
          color: #3b82f6;
          font-size: 11px;
          cursor: pointer;
          padding: 4px 0;
          text-align: left;
        }
        .apit-link-btn:hover {
          color: #60a5fa;
        }
        .apit-collections {
          display: flex;
          flex-direction: column;
          gap: 6px;
          margin-bottom: 10px;
        }
        .apit-collection-item {
          display: flex;
          align-items: center;
          gap: 8px;
          padding: 8px 10px;
          background: rgba(30, 41, 59, 0.6);
          border: 1px solid rgba(148, 163, 184, 0.12);
          border-radius: 7px;
          transition: all 0.15s;
        }
        .apit-collection-item:hover {
          border-color: rgba(59, 130, 246, 0.4);
          background: rgba(30, 41, 59, 0.9);
        }
        .apit-collection-info {
          flex: 1;
          cursor: pointer;
          display: flex;
          align-items: center;
          gap: 8px;
          min-width: 0;
        }
        .apit-method-tag {
          padding: 2px 6px;
          border-radius: 4px;
          font-size: 9px;
          font-weight: 700;
          color: white;
          min-width: 38px;
          text-align: center;
          flex-shrink: 0;
        }
        .apit-collection-detail {
          display: flex;
          flex-direction: column;
          min-width: 0;
        }
        .apit-collection-name {
          font-size: 12px;
          font-weight: 600;
          color: #e2e8f0;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }
        .apit-collection-url {
          font-size: 10px;
          color: #64748b;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }
        .apit-btn-del-item {
          background: none;
          border: none;
          color: #64748b;
          cursor: pointer;
          font-size: 11px;
          padding: 2px 4px;
          transition: color 0.15s;
        }
        .apit-btn-del-item:hover {
          color: #ef4444;
        }
        .apit-save-btn {
          width: 100%;
          padding: 8px;
          background: rgba(59, 130, 246, 0.1);
          border: 1px dashed rgba(59, 130, 246, 0.3);
          border-radius: 7px;
          color: #60a5fa;
          font-size: 12px;
          cursor: pointer;
          transition: all 0.2s;
          margin-top: 8px;
        }
        .apit-save-btn:hover {
          background: rgba(59, 130, 246, 0.2);
          border-color: #3b82f6;
        }
        .apit-history-item {
          display: flex;
          align-items: center;
          gap: 6px;
          padding: 7px 10px;
          background: rgba(30, 41, 59, 0.4);
          border: 1px solid rgba(148, 163, 184, 0.1);
          border-radius: 6px;
          margin-bottom: 5px;
          cursor: pointer;
          transition: all 0.15s;
        }
        .apit-history-item:hover {
          border-color: rgba(59, 130, 246, 0.3);
          background: rgba(30, 41, 59, 0.8);
        }
        .apit-history-method {
          font-size: 10px;
          font-weight: 700;
          min-width: 36px;
        }
        .apit-history-url {
          flex: 1;
          font-size: 11px;
          color: #94a3b8;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }
        .apit-history-status {
          font-size: 10px;
          font-weight: 700;
        }
        .apit-history-time {
          font-size: 9px;
          color: #475569;
        }
        .apit-empty-hint {
          font-size: 11px;
          color: #64748b;
          padding: 6px 0;
        }
        .apit-main {
          display: grid;
          grid-template-rows: 1fr 1fr;
          overflow: hidden;
          background: #0a0e1a;
        }
        .apit-request-panel, .apit-response-panel {
          display: flex;
          flex-direction: column;
          overflow: hidden;
          min-height: 0;
        }
        .apit-request-panel {
          border-bottom: 1px solid rgba(148, 163, 184, 0.1);
        }
        .apit-tabs {
          display: flex;
          gap: 2px;
          padding: 0 16px;
          background: #0f172a;
          border-bottom: 1px solid rgba(148, 163, 184, 0.1);
        }
        .apit-tab {
          padding: 10px 14px;
          background: none;
          border: none;
          border-bottom: 2px solid transparent;
          font-size: 12px;
          color: #94a3b8;
          cursor: pointer;
          display: flex;
          align-items: center;
          gap: 5px;
          transition: all 0.15s;
        }
        .apit-tab:hover {
          color: #e2e8f0;
        }
        .apit-tab.active {
          color: #60a5fa;
          border-bottom-color: #3b82f6;
          font-weight: 600;
        }
        .apit-tab:disabled {
          opacity: 0.4;
          cursor: not-allowed;
        }
        .apit-tab-badge {
          background: #3b82f6;
          color: white;
          font-size: 9px;
          padding: 1px 5px;
          border-radius: 10px;
          font-weight: 700;
        }
        .apit-tab-warn {
          color: #f59e0b;
          font-size: 12px;
        }
        .apit-tab-content {
          flex: 1;
          overflow-y: auto;
          background: #0a0e1a;
        }
        .apit-params-help {
          padding: 20px 24px;
        }
        .apit-params-help h4 {
          font-size: 13px;
          margin: 14px 0 8px;
          color: #e2e8f0;
          font-weight: 600;
        }
        .apit-params-help ul {
          padding-left: 20px;
          font-size: 12px;
          color: #94a3b8;
          line-height: 1.9;
        }
        .apit-params-help code {
          background: rgba(59, 130, 246, 0.15);
          color: #60a5fa;
          padding: 1px 6px;
          border-radius: 3px;
          font-size: 11px;
          font-family: 'SF Mono', monospace;
        }
        .apit-methods-grid {
          display: flex;
          gap: 6px;
          flex-wrap: wrap;
          margin: 8px 0;
        }
        .apit-method-badge {
          padding: 3px 10px;
          border-radius: 5px;
          font-size: 11px;
          font-weight: 700;
          color: white;
        }
        .apit-tips p {
          font-size: 12px;
          color: #64748b;
          line-height: 1.8;
          margin: 4px 0;
        }
        .apit-tips code {
          background: rgba(59, 130, 246, 0.15);
          color: #60a5fa;
          padding: 1px 6px;
          border-radius: 3px;
          font-size: 11px;
        }
        .apit-headers-editor {
          padding: 16px 20px;
        }
        .apit-headers-toolbar {
          display: flex;
          align-items: center;
          gap: 12px;
          margin-bottom: 12px;
        }
        .apit-btn-primary {
          padding: 7px 14px;
          background: linear-gradient(135deg, #3b82f6, #2563eb);
          border: none;
          border-radius: 6px;
          color: white;
          font-size: 12px;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.2s;
        }
        .apit-btn-primary:hover {
          box-shadow: 0 4px 12px rgba(59, 130, 246, 0.3);
          transform: translateY(-1px);
        }
        .apit-headers-hint {
          font-size: 11px;
          color: #64748b;
        }
        .apit-headers-list {
          display: flex;
          flex-direction: column;
          gap: 6px;
        }
        .apit-header-row {
          display: flex;
          align-items: center;
          gap: 8px;
        }
        .apit-header-check {
          width: 15px;
          height: 15px;
          accent-color: #3b82f6;
          cursor: pointer;
        }
        .apit-header-key-input, .apit-header-value-input {
          flex: 1;
          padding: 7px 10px;
          background: rgba(15, 23, 42, 0.8);
          border: 1px solid rgba(148, 163, 184, 0.15);
          border-radius: 6px;
          color: #e2e8f0;
          font-size: 12px;
          font-family: 'SF Mono', monospace;
          outline: none;
          transition: border-color 0.15s;
        }
        .apit-header-key-input:focus, .apit-header-value-input:focus {
          border-color: #3b82f6;
        }
        .apit-body-editor {
          padding: 0;
          display: flex;
          flex-direction: column;
          height: 100%;
        }
        .apit-body-disabled {
          padding: 20px;
          text-align: center;
          color: #64748b;
          font-size: 12px;
          background: rgba(15, 23, 42, 0.4);
          margin: 10px;
          border-radius: 8px;
          border: 1px dashed rgba(148, 163, 184, 0.15);
        }
        .apit-body-disabled span {
          color: #60a5fa;
          font-weight: 700;
        }
        .apit-body-toolbar {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 10px 16px;
          background: #0f172a;
          border-bottom: 1px solid rgba(148, 163, 184, 0.1);
        }
        .apit-body-label {
          font-size: 12px;
          font-weight: 600;
          color: #e2e8f0;
        }
        .apit-body-actions {
          display: flex;
          align-items: center;
          gap: 10px;
        }
        .apit-validation-warn {
          font-size: 11px;
          color: #f59e0b;
        }
        .apit-validation-ok {
          font-size: 11px;
          color: #22c55e;
        }
        .apit-body-textarea {
          flex: 1;
          padding: 14px 16px;
          background: rgba(10, 14, 26, 0.8);
          border: none;
          outline: none;
          color: #e2e8f0;
          font-family: 'SF Mono', 'Fira Code', monospace;
          font-size: 12px;
          line-height: 1.7;
          resize: none;
        }
        .apit-body-textarea.invalid {
          background: rgba(245, 158, 11, 0.05);
        }
        .apit-code-panel {
          display: flex;
          flex-direction: column;
          height: 100%;
        }
        .apit-code-toolbar {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 8px 16px;
          background: #0f172a;
          border-bottom: 1px solid rgba(148, 163, 184, 0.1);
        }
        .apit-code-tabs {
          display: flex;
          gap: 4px;
        }
        .apit-code-tab {
          padding: 6px 12px;
          background: rgba(15, 23, 42, 0.6);
          border: 1px solid rgba(148, 163, 184, 0.15);
          border-radius: 5px;
          color: #94a3b8;
          font-size: 11px;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.15s;
        }
        .apit-code-tab.active {
          background: rgba(59, 130, 246, 0.2);
          border-color: #3b82f6;
          color: #60a5fa;
        }
        .apit-code-tab:hover:not(.active) {
          border-color: rgba(59, 130, 246, 0.3);
          color: #e2e8f0;
        }
        .apit-btn-copy {
          padding: 6px 12px;
          background: rgba(59, 130, 246, 0.15);
          border: 1px solid rgba(59, 130, 246, 0.3);
          border-radius: 5px;
          color: #60a5fa;
          font-size: 11px;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.15s;
        }
        .apit-btn-copy:hover {
          background: rgba(59, 130, 246, 0.25);
        }
        .apit-code-output {
          flex: 1;
          margin: 0;
          padding: 16px 20px;
          background: rgba(10, 14, 26, 0.6);
          color: #e2e8f0;
          font-family: 'SF Mono', 'Fira Code', monospace;
          font-size: 12px;
          line-height: 1.7;
          white-space: pre-wrap;
          word-break: break-all;
          overflow: auto;
        }
        .apit-env-quick {
          padding: 20px 24px;
        }
        .apit-env-quick h4 {
          font-size: 13px;
          margin: 0 0 6px;
          color: #e2e8f0;
        }
        .apit-env-desc {
          font-size: 12px;
          color: #94a3b8;
          margin-bottom: 12px;
        }
        .apit-env-desc code {
          background: rgba(59, 130, 246, 0.15);
          color: #60a5fa;
          padding: 1px 6px;
          border-radius: 3px;
          font-size: 11px;
        }
        .apit-env-vars-list {
          display: flex;
          flex-direction: column;
          gap: 6px;
          margin-bottom: 14px;
        }
        .apit-env-var-display {
          display: flex;
          align-items: center;
          gap: 8px;
          padding: 7px 12px;
          background: rgba(30, 41, 59, 0.5);
          border-radius: 6px;
          font-family: 'SF Mono', monospace;
          font-size: 12px;
        }
        .apit-env-var-display code {
          background: rgba(59, 130, 246, 0.15);
          color: #60a5fa;
          padding: 2px 8px;
          border-radius: 4px;
        }
        .apit-env-eq {
          color: #475569;
        }
        .apit-env-val {
          color: #22c55e !important;
        }
        .apit-response-panel {
          background: #060a14;
        }
        .apit-response-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 10px 16px;
          background: #0a0e1a;
          border-bottom: 1px solid rgba(148, 163, 184, 0.1);
        }
        .apit-response-status {
          display: flex;
          align-items: center;
          gap: 10px;
        }
        .apit-status-code {
          font-size: 18px;
          font-weight: 700;
        }
        .apit-status-text {
          font-size: 12px;
          color: #94a3b8;
        }
        .apit-response-meta {
          font-size: 11px;
          color: #64748b;
          padding: 2px 8px;
          background: rgba(30, 41, 59, 0.6);
          border-radius: 4px;
        }
        .apit-no-response {
          color: #475569;
          font-size: 12px;
        }
        .apit-response-tabs {
          display: flex;
          align-items: center;
          gap: 8px;
        }
        .apit-btn-copy-sm {
          background: none;
          border: 1px solid rgba(148, 163, 184, 0.15);
          border-radius: 5px;
          color: #94a3b8;
          cursor: pointer;
          font-size: 12px;
          padding: 4px 8px;
          transition: all 0.15s;
        }
        .apit-btn-copy-sm:hover {
          border-color: #3b82f6;
          color: #60a5fa;
        }
        .apit-response-body {
          flex: 1;
          overflow: auto;
          padding: 14px 18px;
        }
        .apit-empty {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          height: 100%;
          color: #475569;
        }
        .apit-empty-icon {
          font-size: 36px;
          margin-bottom: 10px;
          opacity: 0.5;
        }
        .apit-empty p {
          font-size: 13px;
          margin: 0 0 4px;
        }
        .apit-empty-hint-text {
          font-size: 11px;
          color: #334155;
        }
        .apit-response-text {
          margin: 0;
          white-space: pre-wrap;
          word-break: break-all;
          font-family: 'SF Mono', 'Fira Code', monospace;
          font-size: 12px;
          line-height: 1.7;
          color: #e2e8f0;
        }
        .apit-headers-list {
          display: flex;
          flex-direction: column;
          gap: 4px;
        }
        .apit-header-row-view {
          display: flex;
          gap: 12px;
          padding: 6px 10px;
          background: rgba(15, 23, 42, 0.5);
          border-radius: 5px;
          border-left: 2px solid rgba(59, 130, 246, 0.3);
        }
        .apit-header-key-view {
          color: #60a5fa;
          font-size: 11px;
          font-weight: 600;
          min-width: 140px;
          word-break: break-all;
        }
        .apit-header-value-view {
          color: #e2e8f0;
          font-size: 11px;
          font-family: monospace;
          word-break: break-all;
        }
      `}</style>
    </div>
  )
}

export default APITestingPro