import { useState, useCallback, useRef, useEffect, memo } from 'react'

interface RequestConfig {
  method: string
  url: string
  headers: { key: string; value: string }[]
  body: string
  timeout: number
}

interface ResponseData {
  status: number
  statusText: string
  headers: Record<string, string>
  body: string
  bodyType: 'json' | 'text' | 'html' | 'xml' | 'binary'
  durationMs: number
  error?: string
}

const defaultRequest: RequestConfig = {
  method: 'GET',
  url: 'https://api.github.com/users/octocat',
  headers: [
    { key: 'Content-Type', value: 'application/json' },
    { key: 'Accept', value: 'application/json' }
  ],
  body: '',
  timeout: 30000
}

const presets = [
  { name: 'GitHub 用户信息', url: 'https://api.github.com/users/octocat', method: 'GET' },
  { name: 'JSONPlaceholder 帖子', url: 'https://jsonplaceholder.typicode.com/posts/1', method: 'GET' },
  { name: '天气查询', url: 'https://api.open-meteo.com/v1/forecast?latitude=31.2304&longitude=121.4737&current=temperature_2m,wind_speed_10m', method: 'GET' },
  { name: '随机笑话', url: 'https://api.chucknorris.io/jokes/random', method: 'GET' },
  { name: 'IP 信息', url: 'https://api.ipify.org?format=json', method: 'GET' },
]

const methods = ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS', 'HEAD']

function formatJsonHighlight(jsonStr: string): string {
  try {
    const parsed = JSON.parse(jsonStr)
    const formatted = JSON.stringify(parsed, null, 2)
    return formatted
      .replace(/"([^"]+)":/g, '<span style="color:#d7d9fc">"$1"</span>:')
      .replace(/: "([^"]+)"/g, ': <span style="color:#a5d6ff">"$1"</span>')
      .replace(/: (\d+)/g, ': <span style="color:#f78166">$1</span>')
      .replace(/: (true|false)/g, ': <span style="color:#d2a8ff">$1</span>')
      .replace(/: null/g, ': <span style="color:#8b949e">null</span>')
  } catch {
    return jsonStr.replace(/</g, '&lt;').replace(/>/g, '&gt;')
  }
}

function detectBodyType(body: string): 'json' | 'text' | 'html' | 'xml' | 'binary' {
  const trimmed = body.trim()
  if (trimmed.startsWith('{') || trimmed.startsWith('[')) return 'json'
  if (trimmed.startsWith('<!DOCTYPE') || trimmed.startsWith('<html')) return 'html'
  if (trimmed.startsWith('<')) return 'xml'
  if (trimmed.length > 0) return 'text'
  return 'text'
}

function copyToClipboard(text: string, onSuccess: () => void) {
  navigator.clipboard.writeText(text).then(onSuccess).catch(() => {})
}

const ApiTester = memo(function ApiTester() {
  const [request, setRequest] = useState<RequestConfig>(defaultRequest)
  const [response, setResponse] = useState<ResponseData | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [activeTab, setActiveTab] = useState<'body' | 'headers' | 'preview'>('body')
  const [copied, setCopied] = useState(false)
  const [history, setHistory] = useState<{ url: string; method: string; status: number; timestamp: Date }[]>([])
  
  const bodyRef = useRef<HTMLTextAreaElement>(null)

  useEffect(() => {
    const saved = localStorage.getItem('apitester-history')
    if (saved) {
      try {
        setHistory(JSON.parse(saved))
      } catch {}
    }
  }, [])

  useEffect(() => {
    localStorage.setItem('apitester-history', JSON.stringify(history.slice(-50)))
  }, [history])

  const addHeader = useCallback(() => {
    setRequest(prev => ({
      ...prev,
      headers: [...prev.headers, { key: '', value: '' }]
    }))
  }, [])

  const removeHeader = useCallback((index: number) => {
    setRequest(prev => ({
      ...prev,
      headers: prev.headers.filter((_, i) => i !== index)
    }))
  }, [])

  const updateHeader = useCallback((index: number, key: string, value: string) => {
    setRequest(prev => ({
      ...prev,
      headers: prev.headers.map((h, i) => i === index ? { key, value } : h)
    }))
  }, [])

  const updateMethod = useCallback((method: string) => {
    setRequest(prev => ({ ...prev, method }))
  }, [])

  const updateUrl = useCallback((url: string) => {
    setRequest(prev => ({ ...prev, url }))
  }, [])

  const updateBody = useCallback((body: string) => {
    setRequest(prev => ({ ...prev, body }))
  }, [])

  const applyPreset = useCallback((preset: typeof presets[0]) => {
    setRequest(prev => ({
      ...prev,
      url: preset.url,
      method: preset.method,
      body: ''
    }))
  }, [])

  const sendRequest = useCallback(async () => {
    if (!request.url.trim()) return
    
    setIsLoading(true)
    setResponse(null)
    const startTime = performance.now()
    const abortController = new AbortController()
    const timeoutId = setTimeout(() => abortController.abort(), request.timeout)

    try {
      const headers: Record<string, string> = {}
      request.headers.forEach(h => {
        if (h.key.trim()) {
          headers[h.key.trim()] = h.value.trim()
        }
      })

      const config: RequestInit = {
        method: request.method,
        headers,
        signal: abortController.signal
      }

      if (['POST', 'PUT', 'PATCH'].includes(request.method) && request.body.trim()) {
        config.body = request.body
      }

      const res = await fetch(request.url, config)
      const duration = performance.now() - startTime
      
      let body = ''
      try {
        body = await res.text()
      } catch {
        body = '(无法读取响应体)'
      }

      const responseHeaders: Record<string, string> = {}
      res.headers.forEach((value, key) => {
        responseHeaders[key] = value
      })

      const responseData: ResponseData = {
        status: res.status,
        statusText: res.statusText,
        headers: responseHeaders,
        body,
        bodyType: detectBodyType(body),
        durationMs: duration
      }

      setResponse(responseData)
      
      setHistory(prev => [{
        url: request.url,
        method: request.method,
        status: res.status,
        timestamp: new Date()
      }, ...prev])

    } catch (error) {
      const duration = performance.now() - startTime
      let errorMsg = '请求失败'
      if (error instanceof Error) {
        errorMsg = error.message
      }
      if (errorMsg.includes('abort')) {
        errorMsg = '请求超时'
      }
      
      setResponse({
        status: 0,
        statusText: '',
        headers: {},
        body: '',
        bodyType: 'text',
        durationMs: duration,
        error: errorMsg
      })
    } finally {
      clearTimeout(timeoutId)
      setIsLoading(false)
    }
  }, [request])

  const clearHistory = useCallback(() => {
    setHistory([])
    localStorage.removeItem('apitester-history')
  }, [])

  const statusColor = (status: number) => {
    if (status >= 200 && status < 300) return '#10b981'
    if (status >= 300 && status < 400) return '#f59e0b'
    if (status >= 400 && status < 500) return '#ef4444'
    if (status >= 500) return '#991b1b'
    return '#8b949e'
  }

  return (
    <div style={{
      height: '100%',
      display: 'flex',
      flexDirection: 'column',
      background: '#0d1117',
      color: '#c9d1d9',
      fontFamily: 'system-ui, -apple-system, sans-serif',
      overflow: 'hidden'
    }}>
      <div style={{
        display: 'flex',
        alignItems: 'center',
        padding: '10px 14px',
        background: '#161b22',
        borderBottom: '1px solid #30363d',
        gap: 12,
        flexWrap: 'wrap'
      }}>
        <div style={{
          background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
          color: '#fff',
          padding: '4px 10px',
          borderRadius: 6,
          fontSize: 12,
          fontWeight: 700,
          letterSpacing: 0.3
        }}>
          API Tester
        </div>
        
        <div style={{ display: 'flex', gap: 4 }}>
          {methods.map(m => (
            <button
              key={m}
              onClick={() => updateMethod(m)}
              style={{
                padding: '6px 12px',
                borderRadius: 6,
                border: request.method === m ? '1px solid #764ba2' : '1px solid #30363d',
                background: request.method === m
                  ? 'linear-gradient(135deg, rgba(102,126,234,0.25), rgba(118,75,162,0.25))'
                  : 'transparent',
                color: request.method === m ? '#d7d9fc' : '#8b949e',
                cursor: 'pointer',
                fontSize: 12,
                fontWeight: request.method === m ? 600 : 400,
                transition: 'all 0.2s'
              }}
            >
              {m}
            </button>
          ))}
        </div>

        <div style={{ flex: 1, display: 'flex', minWidth: 200 }}>
          <input
            type="text"
            value={request.url}
            onChange={(e) => updateUrl(e.target.value)}
            placeholder="输入 API URL..."
            style={{
              flex: 1,
              padding: '8px 12px',
              borderRadius: 6,
              border: '1px solid #30363d',
              background: '#0d1117',
              color: '#e6edf3',
              fontSize: 13,
              outline: 'none',
              transition: 'border-color 0.2s'
            }}
            onFocus={(e) => e.target.style.borderColor = '#764ba2'}
            onBlur={(e) => e.target.style.borderColor = '#30363d'}
          />
        </div>

        <button
          onClick={sendRequest}
          disabled={isLoading || !request.url.trim()}
          style={{
            padding: '8px 16px',
            borderRadius: 6,
            border: 'none',
            background: 'linear-gradient(135deg, #667eea, #764ba2)',
            color: '#fff',
            cursor: isLoading || !request.url.trim() ? 'not-allowed' : 'pointer',
            fontSize: 13,
            fontWeight: 600,
            opacity: isLoading || !request.url.trim() ? 0.7 : 1,
            transition: 'opacity 0.2s'
          }}
        >
          {isLoading ? (
            <>⏳ 发送中...</>
          ) : (
            <>▶ 发送请求</>
          )}
        </button>
      </div>

      <div style={{
        flex: 1,
        display: 'flex',
        overflow: 'hidden'
      }}>
        <div style={{
          flex: 1,
          display: 'flex',
          flexDirection: 'column',
          borderRight: '1px solid #30363d',
          minWidth: 0
        }}>
          <div style={{
            padding: '8px 12px',
            background: '#161b22',
            borderBottom: '1px solid #30363d',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            fontSize: 12,
            fontWeight: 500
          }}>
            <span>请求配置</span>
            <div style={{ display: 'flex', gap: 8, fontSize: 11 }}>
              <span>超时: {request.timeout}ms</span>
            </div>
          </div>

          <div style={{ padding: 12, maxHeight: 150, overflow: 'auto' }}>
            <div style={{ fontSize: 11, color: '#8b949e', marginBottom: 6 }}>请求头</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
              {request.headers.map((h, i) => (
                <div key={i} style={{ display: 'flex', gap: 4 }}>
                  <input
                    type="text"
                    value={h.key}
                    onChange={(e) => updateHeader(i, e.target.value, h.value)}
                    placeholder="Key"
                    style={{
                      width: 120,
                      padding: '4px 8px',
                      borderRadius: 4,
                      border: '1px solid #30363d',
                      background: '#0d1117',
                      color: '#e6edf3',
                      fontSize: 12,
                      outline: 'none'
                    }}
                  />
                  <input
                    type="text"
                    value={h.value}
                    onChange={(e) => updateHeader(i, h.key, e.target.value)}
                    placeholder="Value"
                    style={{
                      flex: 1,
                      padding: '4px 8px',
                      borderRadius: 4,
                      border: '1px solid #30363d',
                      background: '#0d1117',
                      color: '#e6edf3',
                      fontSize: 12,
                      outline: 'none'
                    }}
                  />
                  <button
                    onClick={() => removeHeader(i)}
                    style={{
                      padding: '4px 8px',
                      borderRadius: 4,
                      border: '1px solid #30363d',
                      background: 'transparent',
                      color: '#8b949e',
                      cursor: 'pointer',
                      fontSize: 12
                    }}
                  >
                    ✕
                  </button>
                </div>
              ))}
              <button
                onClick={addHeader}
                style={{
                  padding: '4px 8px',
                  borderRadius: 4,
                  border: '1px dashed #30363d',
                  background: 'transparent',
                  color: '#8b949e',
                  cursor: 'pointer',
                  fontSize: 12,
                  marginTop: 4
                }}
              >
                + 添加请求头
              </button>
            </div>
          </div>

          {['POST', 'PUT', 'PATCH'].includes(request.method) && (
            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minHeight: 0 }}>
              <div style={{
                padding: '6px 12px',
                background: '#161b22',
                borderBottom: '1px solid #30363d',
                fontSize: 12,
                fontWeight: 500
              }}>
                请求体
              </div>
              <textarea
                ref={bodyRef}
                value={request.body}
                onChange={(e) => updateBody(e.target.value)}
                placeholder='输入请求体 (JSON格式)...'
                style={{
                  flex: 1,
                  padding: 12,
                  background: '#0d1117',
                  color: '#e6edf3',
                  border: 'none',
                  resize: 'none',
                  fontSize: 13,
                  fontFamily: 'ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace',
                  outline: 'none',
                  lineHeight: 1.6
                }}
              />
            </div>
          )}

          <div style={{
            padding: '8px 12px',
            background: '#161b22',
            borderTop: '1px solid #30363d'
          }}>
            <div style={{ fontSize: 11, color: '#8b949e', marginBottom: 6 }}>快捷预设</div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4 }}>
              {presets.map((p, i) => (
                <button
                  key={i}
                  onClick={() => applyPreset(p)}
                  style={{
                    padding: '4px 10px',
                    borderRadius: 4,
                    border: '1px solid #30363d',
                    background: 'transparent',
                    color: '#8b949e',
                    cursor: 'pointer',
                    fontSize: 11,
                    transition: 'all 0.2s'
                  }}
                >
                  {p.name}
                </button>
              ))}
            </div>
          </div>
        </div>

        <div style={{
          flex: 1,
          display: 'flex',
          flexDirection: 'column',
          minWidth: 0
        }}>
          <div style={{
            padding: '6px 12px',
            background: '#161b22',
            borderBottom: '1px solid #30363d',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between'
          }}>
            <div style={{ display: 'flex', gap: 4 }}>
              <button
                onClick={() => setActiveTab('body')}
                style={{
                  padding: '5px 12px',
                  borderRadius: 6,
                  border: activeTab === 'body' ? '1px solid #764ba2' : '1px solid transparent',
                  background: activeTab === 'body'
                    ? 'linear-gradient(135deg, rgba(102,126,234,0.25), rgba(118,75,162,0.25))'
                    : 'transparent',
                  color: activeTab === 'body' ? '#d7d9fc' : '#8b949e',
                  cursor: 'pointer',
                  fontSize: 12,
                  fontWeight: activeTab === 'body' ? 700 : 500
                }}
              >
                响应体
              </button>
              <button
                onClick={() => setActiveTab('headers')}
                style={{
                  padding: '5px 12px',
                  borderRadius: 6,
                  border: activeTab === 'headers' ? '1px solid #764ba2' : '1px solid transparent',
                  background: activeTab === 'headers'
                    ? 'linear-gradient(135deg, rgba(102,126,234,0.25), rgba(118,75,162,0.25))'
                    : 'transparent',
                  color: activeTab === 'headers' ? '#d7d9fc' : '#8b949e',
                  cursor: 'pointer',
                  fontSize: 12,
                  fontWeight: activeTab === 'headers' ? 700 : 500
                }}
              >
                响应头
              </button>
              {response?.bodyType === 'json' && (
                <button
                  onClick={() => setActiveTab('preview')}
                  style={{
                    padding: '5px 12px',
                    borderRadius: 6,
                    border: activeTab === 'preview' ? '1px solid #764ba2' : '1px solid transparent',
                    background: activeTab === 'preview'
                      ? 'linear-gradient(135deg, rgba(102,126,234,0.25), rgba(118,75,162,0.25))'
                      : 'transparent',
                    color: activeTab === 'preview' ? '#d7d9fc' : '#8b949e',
                    cursor: 'pointer',
                    fontSize: 12,
                    fontWeight: activeTab === 'preview' ? 700 : 500
                  }}
                >
                  预览
                </button>
              )}
            </div>

            {response && (
              <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
                <button
                  onClick={() => copyToClipboard(response.body, () => setCopied(true))}
                  style={{
                    padding: '4px 8px',
                    borderRadius: 4,
                    border: '1px solid #30363d',
                    background: 'transparent',
                    color: '#8b949e',
                    cursor: 'pointer',
                    fontSize: 11
                  }}
                >
                  {copied ? '已复制 ✓' : '复制'}
                </button>
              </div>
            )}
          </div>

          {response && response.error ? (
            <div style={{
              flex: 1,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              padding: 20,
              color: '#f85149',
              fontSize: 14
            }}>
              <div style={{ textAlign: 'center' }}>
                <div style={{ fontSize: 32, marginBottom: 12 }}>✕</div>
                <div>{response.error}</div>
                <div style={{ fontSize: 12, color: '#8b949e', marginTop: 8 }}>
                  耗时: {response.durationMs.toFixed(1)} ms
                </div>
              </div>
            </div>
          ) : response && activeTab === 'body' ? (
            <div style={{
              flex: 1,
              overflow: 'auto',
              padding: 12,
              background: '#0d1117',
              fontFamily: 'ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace',
              fontSize: 12.5,
              lineHeight: 1.6
            }}>
              {response.bodyType === 'json' ? (
                <pre dangerouslySetInnerHTML={{ __html: formatJsonHighlight(response.body) }} />
              ) : (
                <pre style={{ whiteSpace: 'pre-wrap', wordBreak: 'break-all' }}>{response.body}</pre>
              )}
            </div>
          ) : response && activeTab === 'headers' ? (
            <div style={{
              flex: 1,
              overflow: 'auto',
              padding: 12,
              background: '#0d1117'
            }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                {Object.entries(response.headers).map(([key, value]) => (
                  <div key={key} style={{ display: 'flex', gap: 8 }}>
                    <span style={{ color: '#d7d9fc', fontWeight: 500, minWidth: 150 }}>{key}</span>
                    <span style={{ color: '#e6edf3' }}>{value}</span>
                  </div>
                ))}
              </div>
            </div>
          ) : response && activeTab === 'preview' ? (
            <div style={{
              flex: 1,
              overflow: 'auto',
              padding: 12,
              background: '#0d1117'
            }}>
              <JsonPreview json={response.body} />
            </div>
          ) : (
            <div style={{
              flex: 1,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              padding: 20,
              color: '#8b949e',
              fontSize: 13
            }}>
              <div style={{ textAlign: 'center' }}>
                <div style={{ fontSize: 48, marginBottom: 16, opacity: 0.5 }}>📡</div>
                <div>选择一个预设或输入 URL，然后点击 "发送请求"</div>
                <div style={{ fontSize: 12, marginTop: 8 }}>
                  支持 GET / POST / PUT / DELETE / PATCH / OPTIONS / HEAD
                </div>
              </div>
            </div>
          )}

          {response && !response.error && (
            <div style={{
              padding: '6px 12px',
              background: '#161b22',
              borderTop: '1px solid #30363d',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              fontSize: 11,
              color: '#8b949e'
            }}>
              <div style={{ display: 'flex', gap: 12 }}>
                <span>状态: <span style={{ color: statusColor(response.status), fontWeight: 600 }}>{response.status} {response.statusText}</span></span>
                <span>|</span>
                <span>类型: {response.bodyType.toUpperCase()}</span>
              </div>
              <div style={{ display: 'flex', gap: 12 }}>
                <span>耗时: <span style={{ color: '#d7d9fc' }}>{response.durationMs.toFixed(1)} ms</span></span>
                <span>|</span>
                <span>大小: {response.body.length.toLocaleString()} 字符</span>
              </div>
            </div>
          )}
        </div>
      </div>

      {history.length > 0 && (
        <div style={{
          height: 80,
          borderTop: '1px solid #30363d',
          display: 'flex',
          flexDirection: 'column'
        }}>
          <div style={{
            padding: '4px 12px',
            background: '#161b22',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            fontSize: 11,
            fontWeight: 500,
            color: '#8b949e'
          }}>
            <span>历史记录 ({history.length})</span>
            <button onClick={clearHistory} style={{
              padding: '2px 8px',
              borderRadius: 4,
              border: '1px solid #30363d',
              background: 'transparent',
              color: '#8b949e',
              cursor: 'pointer',
              fontSize: 10
            }}>
              清空
            </button>
          </div>
          <div style={{
            flex: 1,
            overflowX: 'auto',
            padding: '4px 12px',
            display: 'flex',
            gap: 4
          }}>
            {history.map((item, i) => (
              <button
                key={i}
                onClick={() => { updateUrl(item.url); updateMethod(item.method); }}
                style={{
                  padding: '4px 8px',
                  borderRadius: 4,
                  border: '1px solid #30363d',
                  background: '#0d1117',
                  color: '#8b949e',
                  cursor: 'pointer',
                  fontSize: 11,
                  whiteSpace: 'nowrap',
                  textAlign: 'left',
                  maxWidth: 200
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  <span style={{ color: statusColor(item.status), fontWeight: 600 }}>{item.method}</span>
                  <span style={{ overflow: 'hidden', textOverflow: 'ellipsis' }}>{item.url}</span>
                </div>
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  )
})

function JsonPreview({ json }: { json: string }) {
  try {
    const data = JSON.parse(json)
    return <JsonTree data={data} />
  } catch {
    return <div style={{ color: '#8b949e' }}>无法解析 JSON</div>
  }
}

function JsonTree({ data, keyName }: { data: unknown; keyName?: string }) {
  const isObj = typeof data === 'object' && data !== null
  const isArray = Array.isArray(data)

  if (!isObj) {
    return (
      <div style={{ display: 'flex', gap: 4 }}>
        {keyName && <span style={{ color: '#d7d9fc' }}>"{keyName}": </span>}
        <span style={typeof data === 'string' ? { color: '#a5d6ff' } : typeof data === 'number' ? { color: '#f78166' } : typeof data === 'boolean' ? { color: '#d2a8ff' } : { color: '#8b949e' }}>
          {typeof data === 'string' ? `"${data}"` : String(data)}
        </span>
      </div>
    )
  }

  return (
    <div style={{ paddingLeft: keyName ? 0 : 12 }}>
      <div style={{ display: 'flex', gap: 4 }}>
        {keyName && <span style={{ color: '#d7d9fc' }}>"{keyName}": </span>}
        <span style={{ color: '#8b949e' }}>{isArray ? '[' : '{'}</span>
      </div>
      <div style={{ paddingLeft: 16 }}>
        {isArray
          ? (data as unknown[]).map((item, i) => <JsonTree key={i} data={item} keyName={String(i)} />)
          : Object.entries(data as Record<string, unknown>).map(([key, value]) => (
              <JsonTree key={key} data={value} keyName={key} />
            ))}
      </div>
      <span style={{ color: '#8b949e' }}>{isArray ? ']' : '}'}</span>
    </div>
  )
}

export default ApiTester