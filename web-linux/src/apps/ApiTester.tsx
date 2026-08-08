import { useState, useCallback } from 'react'

interface ApiResponse {
  status: number
  statusText: string
  headers: Record<string, string>
  body: string
  time: number
  size: number
}

interface HistoryEntry {
  id: number
  method: string
  url: string
  response: ApiResponse
  timestamp: string
}

interface PresetTemplate {
  id: string
  name: string
  method: string
  url: string
  description: string
}

const PRESET_TEMPLATES: PresetTemplate[] = [
  {
    id: 'github-repo',
    name: 'GitHub 仓库信息',
    method: 'GET',
    url: 'https://api.github.com/repos/saya-ch/WebLinuxOS',
    description: '获取 GitHub 仓库详细信息',
  },
  {
    id: 'weather',
    name: 'wttr.in 天气',
    method: 'GET',
    url: 'https://wttr.in/Beijing?format=j1',
    description: '获取天气预报数据',
  },
  {
    id: 'crypto',
    name: 'CoinGecko 加密行情',
    method: 'GET',
    url: 'https://api.coingecko.com/api/v3/simple/price?ids=bitcoin,ethereum,solana&vs_currencies=usd',
    description: '获取加密货币实时价格',
  },
  {
    id: 'joke',
    name: '编程笑话',
    method: 'GET',
    url: 'https://v2.jokeapi.dev/joke/Programming',
    description: '获取随机编程笑话',
  },
  {
    id: 'quote',
    name: '每日箴言',
    method: 'GET',
    url: 'https://zenquotes.io/api/random',
    description: '获取随机励志名言',
  },
  {
    id: 'country',
    name: '国家信息',
    method: 'GET',
    url: 'https://restcountries.com/v3.1/name/china',
    description: '获取国家详细信息',
  },
  {
    id: 'ip',
    name: 'IP 地理信息',
    method: 'GET',
    url: 'https://ipapi.co/json/',
    description: '获取当前 IP 地理信息',
  },
  {
    id: 'color',
    name: '随机颜色 API',
    method: 'GET',
    url: 'https://www.thecolorapi.com/id?hex=FF6B6B',
    description: '获取颜色信息',
  },
]

const ApiTester = () => {
  const [method, setMethod] = useState('GET')
  const [url, setUrl] = useState('https://api.github.com/repos/saya-ch/WebLinuxOS')
  const [headers, setHeaders] = useState('{\n  "Accept": "application/json",\n  "User-Agent": "WebLinuxOS"\n}')
  const [body, setBody] = useState('')
  const [response, setResponse] = useState<ApiResponse | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [activeTab, setActiveTab] = useState<'params' | 'headers' | 'body'>('params')
  const [responseTab, setResponseTab] = useState<'body' | 'headers'>('body')
  const [history, setHistory] = useState<HistoryEntry[]>([])
  const [activeTemplate, setActiveTemplate] = useState<string | null>(null)
  const [responseSize, setResponseSize] = useState<'compact' | 'formatted' | 'raw'>('formatted')

  const sendRequest = useCallback(async () => {
    setIsLoading(true)
    setResponse(null)

    const startTime = performance.now()
    try {
      const headerObj: Record<string, string> = {}
      try {
        const parsedHeaders = JSON.parse(headers || '{}')
        Object.assign(headerObj, parsedHeaders)
      } catch {
        headerObj['Accept'] = 'application/json'
      }

      const options: RequestInit = {
        method,
        headers: headerObj,
      }

      if (['POST', 'PUT', 'PATCH'].includes(method) && body) {
        options.body = body
      }

      const res = await fetch(url, options)
      const responseTime = Math.round(performance.now() - startTime)

      const responseHeaders: Record<string, string> = {}
      res.headers.forEach((value, key) => {
        responseHeaders[key] = value
      })

      const text = await res.text()
      const size = new Blob([text]).size

      const apiResponse: ApiResponse = {
        status: res.status,
        statusText: res.statusText,
        headers: responseHeaders,
        body: text,
        time: responseTime,
        size,
      }

      setResponse(apiResponse)

      const entry: HistoryEntry = {
        id: Date.now(),
        method,
        url,
        response: apiResponse,
        timestamp: new Date().toLocaleString(),
      }
      setHistory(prev => [entry, ...prev].slice(0, 20))
    } catch (err) {
      const errorTime = Math.round(performance.now() - startTime)
      setResponse({
        status: 0,
        statusText: '请求失败',
        headers: {},
        body: String(err),
        time: errorTime,
        size: 0,
      })
    } finally {
      setIsLoading(false)
    }
  }, [method, url, headers, body])

  const loadTemplate = (template: PresetTemplate) => {
    setMethod(template.method)
    setUrl(template.url)
    setActiveTemplate(template.id)
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

  const formatResponseBody = (): string => {
    if (!response) return ''
    if (responseSize === 'raw') return response.body
    try {
      return JSON.stringify(JSON.parse(response.body), null, responseSize === 'formatted' ? 2 : 0)
    } catch {
      return response.body
    }
  }

  return (
    <div className="api-app">
      <div className="api-header">
        <div className="api-title">
          <span className="api-icon">⚡</span>
          <div>
            <h1>API 测试器</h1>
            <p>真实 HTTP 请求测试工具</p>
          </div>
        </div>
      </div>

      <div className="api-request-bar">
        <select
          className="api-method"
          value={method}
          onChange={(e) => setMethod(e.target.value)}
        >
          {['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'HEAD'].map(m => (
            <option key={m} value={m}>{m}</option>
          ))}
        </select>
        <input
          className="api-url"
          value={url}
          onChange={(e) => { setUrl(e.target.value); setActiveTemplate(null) }}
          placeholder="https://api.example.com/endpoint"
          onKeyDown={(e) => { if (e.key === 'Enter') sendRequest() }}
        />
        <button
          className={`api-send-btn ${isLoading ? 'loading' : ''}`}
          onClick={sendRequest}
          disabled={isLoading || !url}
        >
          {isLoading ? '发送中...' : '发送请求'}
        </button>
      </div>

      <div className="api-body">
        <div className="api-sidebar">
          <div className="api-section">
            <h3>预设模板</h3>
            {PRESET_TEMPLATES.map(template => (
              <button
                key={template.id}
                className={`api-template ${activeTemplate === template.id ? 'active' : ''}`}
                onClick={() => loadTemplate(template)}
              >
                <span className="api-template-name">{template.name}</span>
                <span className="api-template-desc">{template.description}</span>
                <span className="api-template-method">{template.method}</span>
              </button>
            ))}
          </div>

          {history.length > 0 && (
            <div className="api-section">
              <h3>请求历史</h3>
              {history.map(entry => (
                <div
                  key={entry.id}
                  className="api-history-item"
                  onClick={() => {
                    setMethod(entry.method)
                    setUrl(entry.url)
                  }}
                >
                  <span className="api-history-method" style={{ color: formatStatusColor(entry.response.status) }}>
                    {entry.method}
                  </span>
                  <span className="api-history-url">{entry.url.length > 40 ? entry.url.slice(0, 40) + '...' : entry.url}</span>
                  <span className="api-history-status">{entry.response.status}</span>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="api-main">
          <div className="api-config">
            <div className="api-tabs">
              {(['params', 'headers', 'body'] as const).map(tab => (
                <button
                  key={tab}
                  className={`api-tab ${activeTab === tab ? 'active' : ''}`}
                  onClick={() => setActiveTab(tab)}
                >
                  {tab === 'params' ? '请求说明' : tab === 'headers' ? '请求头' : '请求体'}
                </button>
              ))}
            </div>

            {activeTab === 'params' && (
              <div className="api-params-help">
                <h4>使用说明</h4>
                <ul>
                  <li>选择 HTTP 方法并输入 API URL</li>
                  <li>在「请求头」中设置自定义 headers (JSON 格式)</li>
                  <li>在「请求体」中输入 POST/PUT 请求体</li>
                  <li>点击「发送请求」或按 Enter 执行</li>
                </ul>
                <h4>支持的方法</h4>
                <div className="api-methods-grid">
                  <span className="api-method-badge get">GET</span>
                  <span className="api-method-badge post">POST</span>
                  <span className="api-method-badge put">PUT</span>
                  <span className="api-method-badge delete">DELETE</span>
                  <span className="api-method-badge patch">PATCH</span>
                  <span className="api-method-badge head">HEAD</span>
                </div>
                <h4>注意事项</h4>
                <p className="api-notice">
                  由于浏览器 CORS 策略，部分 API 可能无法直接请求。建议使用支持 CORS 的公开 API。
                </p>
              </div>
            )}

            {activeTab === 'headers' && (
              <textarea
                className="api-json-editor"
                value={headers}
                onChange={(e) => setHeaders(e.target.value)}
                placeholder='{"Header-Name": "value"}'
                spellCheck={false}
              />
            )}

            {activeTab === 'body' && (
              <textarea
                className="api-json-editor"
                value={body}
                onChange={(e) => setBody(e.target.value)}
                placeholder='{"key": "value"}'
                spellCheck={false}
                disabled={!['POST', 'PUT', 'PATCH'].includes(method)}
              />
            )}
          </div>

          <div className="api-response">
            <div className="api-response-header">
              <div className="api-response-status">
                {response ? (
                  <>
                    <span
                      className="api-status-code"
                      style={{ color: formatStatusColor(response.status) }}
                    >
                      {response.status}
                    </span>
                    <span className="api-status-text">{response.statusText}</span>
                    <span className="api-response-time">{response.time}ms</span>
                    <span className="api-response-size">{formatSize(response.size)}</span>
                  </>
                ) : (
                  <span className="api-no-response">等待请求...</span>
                )}
              </div>
              <div className="api-response-tabs">
                {(['body', 'headers'] as const).map(tab => (
                  <button
                    key={tab}
                    className={`api-tab ${responseTab === tab ? 'active' : ''}`}
                    onClick={() => setResponseTab(tab)}
                  >
                    {tab === 'body' ? '响应体' : '响应头'}
                  </button>
                ))}
                {response && (
                  <select
                    className="api-size-select"
                    value={responseSize}
                    onChange={(e) => setResponseSize(e.target.value as 'compact' | 'formatted' | 'raw')}
                  >
                    <option value="formatted">格式化</option>
                    <option value="compact">压缩</option>
                    <option value="raw">原始</option>
                  </select>
                )}
              </div>
            </div>

            <div className="api-response-body">
              {!response ? (
                <div className="api-empty">
                  <span className="api-empty-icon">↗</span>
                  <p>发送请求以查看响应</p>
                </div>
              ) : responseTab === 'body' ? (
                <pre className="api-response-text">{formatResponseBody()}</pre>
              ) : (
                <div className="api-headers-list">
                  {Object.entries(response.headers).map(([key, value]) => (
                    <div key={key} className="api-header-row">
                      <span className="api-header-key">{key}</span>
                      <span className="api-header-value">{value}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      <style>{`
        .api-app {
          height: 100%;
          display: flex;
          flex-direction: column;
          background: #fafbfc;
          color: #24292f;
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Helvetica, sans-serif;
        }
        .api-header {
          display: flex;
          align-items: center;
          padding: 16px 24px;
          background: linear-gradient(135deg, #1f6feb, #0d6efd);
          color: white;
        }
        .api-title { display: flex; align-items: center; gap: 12px; }
        .api-icon {
          width: 40px; height: 40px;
          display: flex; align-items: center; justify-content: center;
          background: rgba(255,255,255,0.2);
          border-radius: 10px;
          font-size: 20px;
        }
        .api-title h1 { font-size: 16px; margin: 0; font-weight: 600; }
        .api-title p { font-size: 12px; margin: 0; opacity: 0.85; }
        .api-request-bar {
          display: flex;
          align-items: center;
          gap: 10px;
          padding: 16px 24px;
          background: white;
          border-bottom: 1px solid #d0d7de;
          box-shadow: 0 1px 2px rgba(0,0,0,0.05);
        }
        .api-method {
          padding: 8px 12px;
          border: 1px solid #d0d7de;
          border-radius: 6px;
          font-weight: 600;
          font-size: 13px;
          cursor: pointer;
          background: #f6f8fa;
        }
        .api-url {
          flex: 1;
          padding: 8px 14px;
          border: 1px solid #d0d7de;
          border-radius: 6px;
          font-size: 13px;
          font-family: monospace;
          outline: none;
          transition: border-color 0.2s;
        }
        .api-url:focus { border-color: #1f6feb; box-shadow: 0 0 0 3px rgba(31,111,235,0.1); }
        .api-send-btn {
          padding: 8px 20px;
          background: #1f6feb;
          border: none;
          color: white;
          border-radius: 6px;
          font-size: 13px;
          font-weight: 600;
          cursor: pointer;
          transition: background 0.2s;
        }
        .api-send-btn:hover:not(:disabled) { background: #1a5acb; }
        .api-send-btn:disabled { opacity: 0.6; cursor: not-allowed; }
        .api-send-btn.loading { background: #8b949e; }
        .api-body {
          flex: 1;
          display: grid;
          grid-template-columns: 240px 1fr;
          overflow: hidden;
        }
        .api-sidebar {
          background: #f6f8fa;
          border-right: 1px solid #d0d7de;
          overflow-y: auto;
          padding: 16px;
        }
        .api-section { margin-bottom: 20px; }
        .api-section h3 {
          font-size: 11px;
          color: #57606a;
          text-transform: uppercase;
          letter-spacing: 0.5px;
          margin: 0 0 10px;
        }
        .api-template {
          width: 100%;
          padding: 10px 12px;
          background: white;
          border: 1px solid #d0d7de;
          border-radius: 6px;
          margin-bottom: 8px;
          cursor: pointer;
          text-align: left;
          transition: all 0.2s;
          display: flex;
          flex-direction: column;
          gap: 2px;
          position: relative;
        }
        .api-template:hover { border-color: #1f6feb; box-shadow: 0 1px 3px rgba(31,111,235,0.1); }
        .api-template.active { border-color: #1f6feb; background: #ddf4ff; }
        .api-template-name { font-size: 12px; font-weight: 600; }
        .api-template-desc { font-size: 10px; color: #57606a; }
        .api-template-method {
          position: absolute;
          top: 8px;
          right: 10px;
          font-size: 10px;
          font-weight: 600;
          padding: 1px 6px;
          border-radius: 3px;
          background: #1f6feb;
          color: white;
        }
        .api-history-item {
          padding: 8px 12px;
          background: white;
          border: 1px solid #d0d7de;
          border-radius: 6px;
          margin-bottom: 6px;
          cursor: pointer;
          display: flex;
          align-items: center;
          gap: 8px;
          transition: border-color 0.2s;
        }
        .api-history-item:hover { border-color: #1f6feb; }
        .api-history-method { font-size: 10px; font-weight: 700; width: 40px; }
        .api-history-url { flex: 1; font-size: 11px; color: #57606a; overflow: hidden; white-space: nowrap; text-overflow: ellipsis; }
        .api-history-status { font-size: 10px; font-weight: 600; }
        .api-main {
          display: grid;
          grid-template-rows: 1fr 1fr;
          overflow: hidden;
        }
        .api-config, .api-response {
          display: flex;
          flex-direction: column;
          overflow: hidden;
        }
        .api-config {
          border-bottom: 1px solid #d0d7de;
          background: white;
        }
        .api-tabs {
          display: flex;
          gap: 0;
          padding: 0 16px;
          border-bottom: 1px solid #d0d7de;
        }
        .api-tab {
          padding: 10px 16px;
          background: none;
          border: none;
          border-bottom: 2px solid transparent;
          font-size: 13px;
          color: #57606a;
          cursor: pointer;
        }
        .api-tab.active { color: #1f6feb; border-bottom-color: #1f6feb; font-weight: 600; }
        .api-json-editor {
          flex: 1;
          padding: 16px;
          border: none;
          outline: none;
          font-family: 'SF Mono', 'Fira Code', monospace;
          font-size: 12px;
          line-height: 1.6;
          resize: none;
          background: white;
        }
        .api-params-help {
          padding: 16px 24px;
          overflow-y: auto;
        }
        .api-params-help h4 { font-size: 13px; margin: 12px 0 8px; }
        .api-params-help ul { padding-left: 20px; font-size: 12px; color: #57606a; line-height: 1.8; }
        .api-methods-grid { display: flex; gap: 8px; margin: 8px 0; }
        .api-method-badge {
          padding: 2px 8px;
          border-radius: 4px;
          font-size: 11px;
          font-weight: 700;
          color: white;
        }
        .api-method-badge.get { background: #22c55e; }
        .api-method-badge.post { background: #3b82f6; }
        .api-method-badge.put { background: #f59e0b; }
        .api-method-badge.delete { background: #ef4444; }
        .api-method-badge.patch { background: #8b5cf6; }
        .api-method-badge.head { background: #6b7280; }
        .api-notice {
          padding: 10px 14px;
          background: #fff8c5;
          border: 1px solid #d4a72c;
          border-radius: 6px;
          font-size: 12px;
          color: #9a6700;
          margin-top: 8px;
        }
        .api-response {
          background: #0d1117;
          color: #e6edf3;
        }
        .api-response-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 10px 16px;
          background: #161b22;
          border-bottom: 1px solid #30363d;
        }
        .api-response-status { display: flex; align-items: center; gap: 12px; }
        .api-status-code { font-size: 18px; font-weight: 700; }
        .api-status-text { font-size: 12px; color: #8b949e; }
        .api-response-time { font-size: 11px; color: #8b949e; }
        .api-response-size { font-size: 11px; color: #8b949e; }
        .api-no-response { color: #484f58; font-size: 13px; }
        .api-response-tabs { display: flex; align-items: center; gap: 12px; }
        .api-size-select {
          padding: 4px 8px;
          background: #21262d;
          border: 1px solid #30363d;
          color: #e6edf3;
          border-radius: 4px;
          font-size: 11px;
        }
        .api-response-body {
          flex: 1;
          overflow-y: auto;
          padding: 16px;
        }
        .api-empty {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          height: 100%;
          color: #484f58;
        }
        .api-empty-icon { font-size: 32px; margin-bottom: 8px; }
        .api-empty p { font-size: 13px; }
        .api-response-text {
          margin: 0;
          white-space: pre-wrap;
          word-break: break-all;
          font-family: 'SF Mono', 'Fira Code', monospace;
          font-size: 12px;
          line-height: 1.6;
        }
        .api-headers-list { display: flex; flex-direction: column; gap: 4px; }
        .api-header-row {
          display: flex;
          gap: 12px;
          padding: 6px 10px;
          background: #161b22;
          border-radius: 4px;
        }
        .api-header-key { color: #8b949e; font-size: 11px; min-width: 120px; }
        .api-header-value { color: #e6edf3; font-size: 11px; font-family: monospace; word-break: break-all; }
      `}</style>
    </div>
  )
}

export default ApiTester
