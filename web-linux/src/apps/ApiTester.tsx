import { useState, useCallback, memo } from 'react'
import { useStore } from '../store'

interface RequestHeader {
  key: string
  value: string
  enabled: boolean
}

interface RequestParam {
  key: string
  value: string
  enabled: boolean
}

interface ApiTemplate {
  name: string
  method: string
  url: string
  description: string
  headers?: RequestHeader[]
  params?: RequestParam[]
  body?: string
}

const apiTemplates: ApiTemplate[] = [
  {
    name: 'GitHub 仓库信息',
    method: 'GET',
    url: 'https://api.github.com/repos/facebook/react',
    description: '获取 React 仓库信息',
  },
  {
    name: 'GitHub 搜索仓库',
    method: 'GET',
    url: 'https://api.github.com/search/repositories?q=react&sort=stars',
    description: '搜索 GitHub 仓库',
  },
  {
    name: 'Open-Meteo 天气',
    method: 'GET',
    url: 'https://api.open-meteo.com/v1/forecast?latitude=39.9042&longitude=116.4074&current_weather=true',
    description: '获取北京实时天气',
  },
  {
    name: 'CoinGecko 加密货币',
    method: 'GET',
    url: 'https://api.coingecko.com/api/v3/coins/markets?vs_currency=usd&order=market_cap_desc&per_page=10',
    description: '获取加密货币市场数据',
  },
  {
    name: 'HTTPBin GET',
    method: 'GET',
    url: 'https://httpbin.org/get',
    description: '测试 GET 请求',
  },
  {
    name: 'HTTPBin POST',
    method: 'POST',
    url: 'https://httpbin.org/post',
    description: '测试 POST 请求',
    body: JSON.stringify({ message: 'Hello from WebLinuxOS', timestamp: new Date().toISOString() }, null, 2),
  },
  {
    name: 'HTTPBin Headers',
    method: 'GET',
    url: 'https://httpbin.org/headers',
    description: '显示请求头信息',
  },
  {
    name: 'JSONPlaceholder Posts',
    method: 'GET',
    url: 'https://jsonplaceholder.typicode.com/posts/1',
    description: '获取示例帖子',
  },
  {
    name: 'JSONPlaceholder Users',
    method: 'GET',
    url: 'https://jsonplaceholder.typicode.com/users',
    description: '获取用户列表',
  },
  {
    name: 'Dog CEO 随机狗图片',
    method: 'GET',
    url: 'https://dog.ceo/api/breeds/image/random',
    description: '获取随机狗图片 URL',
  },
]

function formatJson(str: string): string {
  try {
    return JSON.stringify(JSON.parse(str), null, 2)
  } catch {
    return str
  }
}

const ApiTester = memo(function ApiTester() {
  const addNotification = useStore((s) => s.addNotification)

  const [method, setMethod] = useState('GET')
  const [url, setUrl] = useState('https://api.github.com/repos/facebook/react')
  const [headers, setHeaders] = useState<RequestHeader[]>([
    { key: 'Accept', value: 'application/json', enabled: true },
    { key: 'User-Agent', value: 'WebLinuxOS-API-Tester', enabled: true },
  ])
  const [params, setParams] = useState<RequestParam[]>([])
  const [body, setBody] = useState('')
  const [response, setResponse] = useState<{ status: number; statusText: string; data: string; time: number; size: string } | null>(null)
  const [loading, setLoading] = useState(false)
  const [activeTab, setActiveTab] = useState<'headers' | 'params' | 'body'>('params')
  const [history, setHistory] = useState<{ method: string; url: string; status: number; time: number }[]>([])

  const handleSend = useCallback(async () => {
    if (!url.trim()) {
      addNotification({ title: '错误', message: '请输入 URL', type: 'error' })
      return
    }

    setLoading(true)
    const startTime = performance.now()

    try {
      const requestHeaders: Record<string, string> = {}
      headers.filter(h => h.enabled && h.key.trim()).forEach(h => {
        requestHeaders[h.key] = h.value
      })

      let fullUrl = url
      const enabledParams = params.filter(p => p.enabled && p.key.trim())
      if (enabledParams.length > 0) {
        const queryString = enabledParams.map(p => `${encodeURIComponent(p.key)}=${encodeURIComponent(p.value)}`).join('&')
        fullUrl += (fullUrl.includes('?') ? '&' : '?') + queryString
      }

      const options: RequestInit = {
        method,
        headers: requestHeaders,
      }

      if (['POST', 'PUT', 'PATCH'].includes(method) && body.trim()) {
        options.body = body
        if (!requestHeaders['Content-Type']) {
          requestHeaders['Content-Type'] = 'application/json'
        }
      }

      const res = await fetch(fullUrl, options)
      const endTime = performance.now()
      const responseTime = Math.round(endTime - startTime)

      let responseData = ''
      const contentType = res.headers.get('content-type') || ''

      if (contentType.includes('application/json')) {
        const json = await res.json()
        responseData = JSON.stringify(json, null, 2)
      } else {
        responseData = await res.text()
      }

      const sizeInBytes = new Blob([responseData]).size
      const size = sizeInBytes > 1024 ? `${(sizeInBytes / 1024).toFixed(2)} KB` : `${sizeInBytes} B`

      setResponse({
        status: res.status,
        statusText: res.statusText,
        data: responseData,
        time: responseTime,
        size,
      })

      setHistory(prev => [{
        method,
        url: fullUrl,
        status: res.status,
        time: responseTime,
      }, ...prev.slice(0, 19)])

      addNotification({
        title: '请求成功',
        message: `${res.status} ${res.statusText} - ${responseTime}ms`,
        type: 'success',
      })
    } catch (error) {
      addNotification({
        title: '请求失败',
        message: error instanceof Error ? error.message : '未知错误',
        type: 'error',
      })
      setResponse({
        status: 0,
        statusText: 'Error',
        data: error instanceof Error ? error.message : '请求失败',
        time: 0,
        size: '0 B',
      })
    } finally {
      setLoading(false)
    }
  }, [url, method, headers, params, body, addNotification])

  const addHeader = () => {
    setHeaders([...headers, { key: '', value: '', enabled: true }])
  }

  const updateHeader = (index: number, field: keyof RequestHeader, value: string | boolean) => {
    const newHeaders = [...headers]
    if (field === 'enabled') {
      newHeaders[index] = { ...newHeaders[index], enabled: value as boolean }
    } else {
      newHeaders[index] = { ...newHeaders[index], [field]: value }
    }
    setHeaders(newHeaders)
  }

  const removeHeader = (index: number) => {
    setHeaders(headers.filter((_, i) => i !== index))
  }

  const addParam = () => {
    setParams([...params, { key: '', value: '', enabled: true }])
  }

  const updateParam = (index: number, field: keyof RequestParam, value: string | boolean) => {
    const newParams = [...params]
    if (field === 'enabled') {
      newParams[index] = { ...newParams[index], enabled: value as boolean }
    } else {
      newParams[index] = { ...newParams[index], [field]: value }
    }
    setParams(newParams)
  }

  const removeParam = (index: number) => {
    setParams(params.filter((_, i) => i !== index))
  }

  const loadTemplate = (template: ApiTemplate) => {
    setMethod(template.method)
    setUrl(template.url)
    if (template.body) {
      setBody(template.body)
    }
    if (template.headers) {
      setHeaders(template.headers)
    }
    setResponse(null)
  }

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text)
    addNotification({ title: '已复制', message: '内容已复制到剪贴板', type: 'info' })
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', background: 'var(--window-bg)', overflow: 'hidden' }}>
      <div style={{ padding: '16px', borderBottom: '1px solid var(--window-border)' }}>
        <div style={{ marginBottom: '12px' }}>
          <label style={{ display: 'block', marginBottom: '6px', fontSize: '12px', color: 'var(--text-secondary)' }}>
            API 端点
          </label>
          <div style={{ display: 'flex', gap: '8px' }}>
            <select
              value={method}
              onChange={(e) => setMethod(e.target.value)}
              style={{
                padding: '8px 12px',
                borderRadius: '6px',
                border: '1px solid var(--window-border)',
                background: 'var(--window-bg)',
                color: method === 'GET' ? '#61affe' : method === 'POST' ? '#49cc90' : method === 'PUT' ? '#fca130' : method === 'DELETE' ? '#f93e3e' : '#9012fe',
                fontWeight: '600',
                cursor: 'pointer',
              }}
            >
              <option value="GET">GET</option>
              <option value="POST">POST</option>
              <option value="PUT">PUT</option>
              <option value="PATCH">PATCH</option>
              <option value="DELETE">DELETE</option>
            </select>
            <input
              type="text"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              placeholder="https://api.example.com/endpoint"
              style={{
                flex: 1,
                padding: '8px 12px',
                borderRadius: '6px',
                border: '1px solid var(--window-border)',
                background: 'var(--window-bg)',
                color: 'var(--text-primary)',
                fontFamily: 'JetBrains Mono, monospace',
                fontSize: '13px',
              }}
              onKeyDown={(e) => {
                if (e.key === 'Enter') handleSend()
              }}
            />
            <button
              onClick={handleSend}
              disabled={loading}
              style={{
                padding: '8px 24px',
                borderRadius: '6px',
                border: 'none',
                background: loading ? 'var(--text-secondary)' : 'var(--accent)',
                color: '#fff',
                fontWeight: '600',
                cursor: loading ? 'not-allowed' : 'pointer',
                transition: 'all 0.2s',
              }}
            >
              {loading ? '发送中...' : '发送'}
            </button>
          </div>
        </div>

        <div style={{ display: 'flex', gap: '8px', marginBottom: '8px' }}>
          <span style={{ fontSize: '11px', color: 'var(--text-secondary)', alignSelf: 'center' }}>快速模板:</span>
          {apiTemplates.slice(0, 5).map((template, idx) => (
            <button
              key={idx}
              onClick={() => loadTemplate(template)}
              style={{
                padding: '4px 10px',
                borderRadius: '4px',
                border: '1px solid var(--window-border)',
                background: 'transparent',
                color: 'var(--text-secondary)',
                fontSize: '11px',
                cursor: 'pointer',
              }}
            >
              {template.name}
            </button>
          ))}
        </div>
      </div>

      <div style={{ flex: 1, display: 'flex', overflow: 'hidden' }}>
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
          <div style={{ display: 'flex', borderBottom: '1px solid var(--window-border)' }}>
            {(['params', 'headers', 'body'] as const).map(tab => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                style={{
                  padding: '10px 20px',
                  border: 'none',
                  background: activeTab === tab ? 'var(--accent-bg)' : 'transparent',
                  color: activeTab === tab ? 'var(--accent)' : 'var(--text-secondary)',
                  cursor: 'pointer',
                  borderBottom: activeTab === tab ? '2px solid var(--accent)' : '2px solid transparent',
                  fontSize: '13px',
                  fontWeight: '500',
                }}
              >
                {tab === 'params' ? '参数' : tab === 'headers' ? '请求头' : '请求体'}
              </button>
            ))}
          </div>

          <div style={{ flex: 1, padding: '12px', overflow: 'auto' }}>
            {activeTab === 'params' && (
              <div>
                <button onClick={addParam} style={buttonStyle}>+ 添加参数</button>
                {params.map((param, idx) => (
                  <div key={idx} style={{ display: 'flex', gap: '8px', marginTop: '8px', alignItems: 'center' }}>
                    <input
                      type="checkbox"
                      checked={param.enabled}
                      onChange={(e) => updateParam(idx, 'enabled', e.target.checked)}
                    />
                    <input
                      type="text"
                      placeholder="键"
                      value={param.key}
                      onChange={(e) => updateParam(idx, 'key', e.target.value)}
                      style={inputStyle}
                    />
                    <input
                      type="text"
                      placeholder="值"
                      value={param.value}
                      onChange={(e) => updateParam(idx, 'value', e.target.value)}
                      style={inputStyle}
                    />
                    <button onClick={() => removeParam(idx)} style={removeButtonStyle}>×</button>
                  </div>
                ))}
              </div>
            )}

            {activeTab === 'headers' && (
              <div>
                <button onClick={addHeader} style={buttonStyle}>+ 添加请求头</button>
                {headers.map((header, idx) => (
                  <div key={idx} style={{ display: 'flex', gap: '8px', marginTop: '8px', alignItems: 'center' }}>
                    <input
                      type="checkbox"
                      checked={header.enabled}
                      onChange={(e) => updateHeader(idx, 'enabled', e.target.checked)}
                    />
                    <input
                      type="text"
                      placeholder="键"
                      value={header.key}
                      onChange={(e) => updateHeader(idx, 'key', e.target.value)}
                      style={inputStyle}
                    />
                    <input
                      type="text"
                      placeholder="值"
                      value={header.value}
                      onChange={(e) => updateHeader(idx, 'value', e.target.value)}
                      style={inputStyle}
                    />
                    <button onClick={() => removeHeader(idx)} style={removeButtonStyle}>×</button>
                  </div>
                ))}
              </div>
            )}

            {activeTab === 'body' && (
              <div>
                <textarea
                  value={body}
                  onChange={(e) => setBody(e.target.value)}
                  placeholder='{"key": "value"}'
                  style={{
                    ...inputStyle,
                    width: '100%',
                    minHeight: '150px',
                    fontFamily: 'JetBrains Mono, monospace',
                    fontSize: '13px',
                    resize: 'vertical',
                  }}
                />
                <button
                  onClick={() => setBody(formatJson(body))}
                  style={{ ...buttonStyle, marginTop: '8px' }}
                >
                  格式化 JSON
                </button>
              </div>
            )}
          </div>
        </div>

        <div style={{ width: '1px', background: 'var(--window-border)' }} />

        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
          <div style={{ padding: '12px', borderBottom: '1px solid var(--window-border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: '13px', fontWeight: '600' }}>响应</span>
            {response && (
              <div style={{ display: 'flex', gap: '12px', alignItems: 'center', fontSize: '12px' }}>
                <span style={{ color: response.status >= 200 && response.status < 300 ? '#49cc90' : '#f93e3e', fontWeight: '600' }}>
                  {response.status} {response.statusText}
                </span>
                <span style={{ color: 'var(--text-secondary)' }}>{response.time}ms</span>
                <span style={{ color: 'var(--text-secondary)' }}>{response.size}</span>
              </div>
            )}
          </div>

          <div style={{ flex: 1, padding: '12px', overflow: 'auto', position: 'relative' }}>
            {loading && (
              <div style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 10 }}>
                <div style={{ color: '#fff', fontSize: '16px' }}>发送请求中...</div>
              </div>
            )}
            {response ? (
              <div>
                <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '8px' }}>
                  <button
                    onClick={() => copyToClipboard(response.data)}
                    style={buttonStyle}
                  >
                    复制响应
                  </button>
                </div>
                <pre
                  style={{
                    margin: 0,
                    padding: '12px',
                    background: 'var(--titlebar-bg)',
                    borderRadius: '6px',
                    fontSize: '12px',
                    fontFamily: 'JetBrains Mono, monospace',
                    overflow: 'auto',
                    maxHeight: '400px',
                    whiteSpace: 'pre-wrap',
                    wordBreak: 'break-word',
                  }}
                >
                  {response.data}
                </pre>
              </div>
            ) : (
              <div style={{ textAlign: 'center', color: 'var(--text-secondary)', marginTop: '60px' }}>
                <div style={{ fontSize: '48px', marginBottom: '12px' }}>📡</div>
                <div>输入 URL 并点击发送开始测试 API</div>
              </div>
            )}
          </div>
        </div>
      </div>

      {history.length > 0 && (
        <div style={{ padding: '12px', borderTop: '1px solid var(--window-border)', maxHeight: '120px', overflow: 'auto' }}>
          <div style={{ fontSize: '11px', color: 'var(--text-secondary)', marginBottom: '6px' }}>历史记录</div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
            {history.map((item, idx) => (
              <div
                key={idx}
                onClick={() => {
                  setMethod(item.method)
                  setUrl(item.url)
                }}
                style={{
                  padding: '4px 8px',
                  borderRadius: '4px',
                  background: 'var(--titlebar-bg)',
                  fontSize: '11px',
                  cursor: 'pointer',
                  display: 'flex',
                  gap: '6px',
                  alignItems: 'center',
                }}
              >
                <span style={{ color: '#61affe', fontWeight: '600' }}>{item.method}</span>
                <span style={{ color: 'var(--text-secondary)', maxWidth: '150px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {item.url.split('?')[0].split('/').slice(-2).join('/')}
                </span>
                <span style={{ color: item.status >= 200 && item.status < 300 ? '#49cc90' : '#f93e3e' }}>{item.status}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
})

const buttonStyle: React.CSSProperties = {
  padding: '6px 12px',
  borderRadius: '4px',
  border: '1px solid var(--window-border)',
  background: 'transparent',
  color: 'var(--text-secondary)',
  fontSize: '12px',
  cursor: 'pointer',
}

const inputStyle: React.CSSProperties = {
  flex: 1,
  padding: '6px 10px',
  borderRadius: '4px',
  border: '1px solid var(--window-border)',
  background: 'var(--window-bg)',
  color: 'var(--text-primary)',
  fontSize: '13px',
}

const removeButtonStyle: React.CSSProperties = {
  padding: '4px 8px',
  borderRadius: '4px',
  border: 'none',
  background: 'var(--error)',
  color: '#fff',
  fontSize: '14px',
  cursor: 'pointer',
  lineHeight: 1,
}

export default ApiTester
