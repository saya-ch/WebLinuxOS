import { useState, useCallback } from 'react'

interface ApiResponse {
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
  method: string
  url: string
  headers?: Record<string, string>
  body?: string
}

const DEFAULT_TEMPLATES: RequestTemplate[] = [
  {
    id: 'weather',
    name: 'Open-Meteo 天气',
    method: 'GET',
    url: 'https://api.open-meteo.com/v1/forecast?latitude=39.9042&longitude=116.4074&current=temperature_2m&hourly=temperature_2m&daily=temperature_2m_max',
  },
  {
    id: 'crypto',
    name: 'CoinGecko 加密货币',
    method: 'GET',
    url: 'https://api.coingecko.com/api/v3/simple/price?ids=bitcoin,ethereum&vs_currencies=usd&include_24hr_change=true',
  },
  {
    id: 'github',
    name: 'GitHub 仓库',
    method: 'GET',
    url: 'https://api.github.com/repos/saya-ch/WebLinuxOS',
  },
  {
    id: 'joke',
    name: '编程笑话',
    method: 'GET',
    url: 'https://v2.jokeapi.dev/joke/Programming?safe-mode',
  },
  {
    id: 'quote',
    name: '每日名言',
    method: 'GET',
    url: 'https://api.zenquotes.io/api/random',
  },
  {
    id: 'news',
    name: 'Hacker News',
    method: 'GET',
    url: 'https://hacker-news.firebaseio.com/v0/topstories.json?print=pretty&limitToFirst=5&orderBy="$key"',
  },
  {
    id: 'ip',
    name: 'IP地理查询',
    method: 'GET',
    url: 'https://ipapi.co/json/',
  },
  {
    id: 'exchange',
    name: '汇率查询',
    method: 'GET',
    url: 'https://open.er-api.com/v6/latest/USD',
  },
]

export default function EnhancedApiDebugger() {
  const [method, setMethod] = useState('GET')
  const [url, setUrl] = useState('https://api.open-meteo.com/v1/forecast?latitude=39.9042&longitude=116.4074&current=temperature_2m')
  const [headers, setHeaders] = useState('{"Accept": "application/json"}')
  const [body, setBody] = useState('')
  const [response, setResponse] = useState<ApiResponse | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [activeTab, setActiveTab] = useState<'headers' | 'body' | 'response'>('response')
  const [responseFormat, setResponseFormat] = useState<'raw' | 'formatted'>('formatted')
  const [history, setHistory] = useState<Array<{ method: string; url: string; time: number; status?: number }>>([])

  const sendRequest = useCallback(async () => {
    setIsLoading(true)
    setResponse(null)
    setActiveTab('response')

    const startTime = performance.now()
    const timer = setTimeout(() => {
      setIsLoading(false)
      setResponse({
        status: 0,
        statusText: '请求超时',
        headers: {},
        body: '请求超过15秒未完成',
        time: 15000,
        size: 0,
      })
    }, 15000)

    try {
      const headerObj: Record<string, string> = {}
      try {
        if (headers.trim()) {
          const parsed = JSON.parse(headers)
          Object.assign(headerObj, parsed)
        }
      } catch {
        // headers parse failed
      }

      const options: RequestInit = {
        method,
        headers: headerObj,
      }

      if (method !== 'GET' && method !== 'DELETE' && body) {
        options.body = body
        if (!Object.keys(headerObj).some(k => k.toLowerCase() === 'content-type')) {
          headerObj['Content-Type'] = 'application/json'
        }
      }

      const response = await fetch(url, options)
      const elapsed = performance.now() - startTime
      clearTimeout(timer)

      const responseHeaders: Record<string, string> = {}
      response.headers.forEach((value, key) => {
        responseHeaders[key] = value
      })

      const responseText = await response.text()
      const responseSize = new Blob([responseText]).size

      setResponse({
        status: response.status,
        statusText: response.statusText,
        headers: responseHeaders,
        body: responseText,
        time: Math.round(elapsed),
        size: responseSize,
      })

      setHistory(prev => [
        { method, url, time: Date.now(), status: response.status },
        ...prev.slice(0, 19),
      ])
    } catch (e) {
      clearTimeout(timer)
      setResponse({
        status: 0,
        statusText: '请求失败',
        headers: {},
        body: e instanceof Error ? e.message : String(e),
        time: Math.round(performance.now() - startTime),
        size: 0,
      })
      setHistory(prev => [
        { method, url, time: Date.now() },
        ...prev.slice(0, 19),
      ])
    } finally {
      setIsLoading(false)
    }
  }, [method, url, headers, body])

  const loadTemplate = useCallback((template: RequestTemplate) => {
    setMethod(template.method)
    setUrl(template.url)
    setHeaders(JSON.stringify(template.headers || { Accept: 'application/json' }, null, 2))
    setBody(template.body || '')
  }, [])

  const formatBody = useCallback(() => {
    try {
      const formatted = JSON.stringify(JSON.parse(body), null, 2)
      setBody(formatted)
    } catch {
      // not valid JSON
    }
  }, [body])

  const formatResponse = useCallback((resp: ApiResponse | null) => {
    if (!resp) return ''
    try {
      return JSON.stringify(JSON.parse(resp.body), null, 2)
    } catch {
      return resp.body
    }
  }, [])

  const getStatusColor = (status: number) => {
    if (status >= 200 && status < 300) return '#10b981'
    if (status >= 300 && status < 400) return '#f59e0b'
    if (status >= 400) return '#ef4444'
    return '#6b7280'
  }

  return (
    <div className="api-debugger">
      <div className="api-header">
        <h2>🔧 增强 API 调试器</h2>
        <div className="quick-templates">
          <select onChange={(e) => {
            const t = DEFAULT_TEMPLATES.find(t => t.id === e.target.value)
            if (t) loadTemplate(t)
          }} defaultValue="">
            <option value="">📋 选择模板</option>
            {DEFAULT_TEMPLATES.map(t => (
              <option key={t.id} value={t.id}>{t.name}</option>
            ))}
          </select>
        </div>
      </div>

      <div className="api-request">
        <div className="request-row">
          <select value={method} onChange={(e) => setMethod(e.target.value)} className="method-select">
            {['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'HEAD', 'OPTIONS'].map(m => (
              <option key={m} value={m}>{m}</option>
            ))}
          </select>
          <input
            type="text"
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            placeholder="输入 API URL..."
            className="url-input"
          />
          <button onClick={sendRequest} disabled={isLoading} className="send-btn">
            {isLoading ? '⏳ 发送中...' : '🚀 发送'}
          </button>
        </div>

        <div className="request-body">
          <div className="tabs">
            <button
              className={activeTab === 'headers' ? 'active' : ''}
              onClick={() => setActiveTab('headers')}
            >Headers</button>
            <button
              className={activeTab === 'body' ? 'active' : ''}
              onClick={() => setActiveTab('body')}
            >Body</button>
          </div>

          {activeTab === 'headers' && (
            <div className="tab-content">
              <textarea
                value={headers}
                onChange={(e) => setHeaders(e.target.value)}
                placeholder='{"Accept": "application/json", "Authorization": "Bearer ..."}'
                spellCheck={false}
              />
            </div>
          )}

          {activeTab === 'body' && (
            <div className="tab-content">
              <textarea
                value={body}
                onChange={(e) => setBody(e.target.value)}
                placeholder='请求体 (JSON)'
                spellCheck={false}
              />
              <button onClick={formatBody} className="format-btn">格式化 JSON</button>
            </div>
          )}

          {activeTab === 'response' && (
            <div className="tab-content response-tab">
              {response ? (
                <>
                  <div className="response-meta">
                    <span className="status" style={{ color: getStatusColor(response.status) }}>
                      {response.status} {response.statusText}
                    </span>
                    <span className="time">⏱️ {response.time}ms</span>
                    <span className="size">📦 {(response.size / 1024).toFixed(1)}KB</span>
                    <div className="format-toggle">
                      <button
                        className={responseFormat === 'formatted' ? 'active' : ''}
                        onClick={() => setResponseFormat('formatted')}
                      >格式化</button>
                      <button
                        className={responseFormat === 'raw' ? 'active' : ''}
                        onClick={() => setResponseFormat('raw')}
                      >原始</button>
                    </div>
                  </div>
                  <pre className="response-body">
                    {responseFormat === 'formatted' ? formatResponse(response) : response.body}
                  </pre>
                  <details className="response-headers">
                    <summary>响应头 ({Object.keys(response.headers).length})</summary>
                    {Object.entries(response.headers).map(([key, value]) => (
                      <div key={key} className="header-row">
                        <span className="header-key">{key}:</span>
                        <span className="header-value">{value}</span>
                      </div>
                    ))}
                  </details>
                </>
              ) : (
                <div className="no-response">
                  {isLoading ? '正在发送请求...' : '等待请求...'}
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      <div className="api-history">
        <h3>📜 请求历史</h3>
        <div className="history-list">
          {history.length === 0 ? (
            <div className="no-history">暂无请求历史</div>
          ) : (
            history.map((item, idx) => (
              <div
                key={idx}
                className="history-item"
                onClick={() => { setMethod(item.method); setUrl(item.url) }}
              >
                <span className="method">{item.method}</span>
                <span className="url">{item.url}</span>
                {item.status && (
                  <span className="status" style={{ color: getStatusColor(item.status) }}>
                    {item.status}
                  </span>
                )}
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  )
}
