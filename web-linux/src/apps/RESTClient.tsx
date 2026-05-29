import { useState, useCallback, memo } from 'react'
import { useStore } from '../store'

interface RequestHistoryItem {
  id: string
  method: string
  url: string
  timestamp: number
  status: number
}

const RESTClient = memo(function RESTClient() {
  const addNotification = useStore((s) => s.addNotification)
  const [url, setUrl] = useState('https://jsonplaceholder.typicode.com/posts')
  const [method, setMethod] = useState('GET')
  const [headers, setHeaders] = useState<{ key: string; value: string; enabled: boolean }[]>([
    { key: 'Content-Type', value: 'application/json', enabled: true },
    { key: 'Accept', value: 'application/json', enabled: true },
  ])
  const [params, setParams] = useState<{ key: string; value: string; enabled: boolean }[]>([])
  const [body, setBody] = useState('')
  const [response, setResponse] = useState<any>(null)
  const [loading, setLoading] = useState(false)
  const [history, setHistory] = useState<RequestHistoryItem[]>([])
  const [responseTime, setResponseTime] = useState(0)
  const [activeTab, setActiveTab] = useState('params')

  const sendRequest = useCallback(async () => {
    if (!url.trim()) {
      addNotification({ title: '错误', message: '请输入 URL', type: 'error' })
      return
    }

    setLoading(true)
    const startTime = performance.now()

    try {
      let fullUrl = url
      const enabledParams = params.filter(p => p.enabled && p.key.trim())
      if (enabledParams.length > 0) {
        const queryString = enabledParams
          .map(p => `${encodeURIComponent(p.key)}=${encodeURIComponent(p.value)}`)
          .join('&')
        fullUrl += (fullUrl.includes('?') ? '&' : '?') + queryString
      }

      const requestHeaders: Record<string, string> = {}
      headers
        .filter(h => h.enabled && h.key.trim())
        .forEach(h => {
          requestHeaders[h.key] = h.value
        })

      const options: RequestInit = {
        method,
        headers: requestHeaders,
      }

      if (['POST', 'PUT', 'PATCH'].includes(method) && body.trim()) {
        options.body = body
      }

      const res = await fetch(fullUrl, options)
      const endTime = performance.now()
      setResponseTime(Math.round(endTime - startTime))

      let data
      const contentType = res.headers.get('content-type') || ''
      if (contentType.includes('application/json')) {
        data = await res.json()
      } else {
        data = await res.text()
      }

      setResponse({
        status: res.status,
        statusText: res.statusText,
        headers: Object.fromEntries(res.headers.entries()),
        data,
      })

      setHistory(prev => [
        {
          id: Date.now().toString(),
          method,
          url: fullUrl,
          timestamp: Date.now(),
          status: res.status,
        },
        ...prev.slice(0, 19),
      ])

      addNotification({
        title: '请求成功',
        message: `${res.status} ${res.statusText}`,
        type: 'success',
      })
    } catch (error) {
      addNotification({
        title: '请求失败',
        message: error instanceof Error ? error.message : '未知错误',
        type: 'error',
      })
      setResponse({
        error: error instanceof Error ? error.message : '请求失败',
      })
    } finally {
      setLoading(false)
    }
  }, [url, method, headers, params, body, addNotification])

  const addHeader = () => {
    setHeaders([...headers, { key: '', value: '', enabled: true }])
  }

  const updateHeader = (index: number, field: keyof typeof headers[0], value: any) => {
    const newHeaders = [...headers]
    newHeaders[index] = { ...newHeaders[index], [field]: value }
    setHeaders(newHeaders)
  }

  const removeHeader = (index: number) => {
    setHeaders(headers.filter((_, i) => i !== index))
  }

  const addParam = () => {
    setParams([...params, { key: '', value: '', enabled: true }])
  }

  const updateParam = (index: number, field: keyof typeof params[0], value: any) => {
    const newParams = [...params]
    newParams[index] = { ...newParams[index], [field]: value }
    setParams(newParams)
  }

  const removeParam = (index: number) => {
    setParams(params.filter((_, i) => i !== index))
  }

  const loadFromHistory = (item: RequestHistoryItem) => {
    setMethod(item.method)
    setUrl(item.url)
  }

  const formatBody = () => {
    try {
      setBody(JSON.stringify(JSON.parse(body), null, 2))
    } catch {
      addNotification({ title: '提示', message: 'JSON 格式无效', type: 'info' })
    }
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', background: 'var(--window-bg)', overflow: 'hidden' }}>
      <div style={{ padding: '16px', borderBottom: '1px solid var(--window-border)' }}>
        <div style={{ display: 'flex', gap: '8px', marginBottom: '12px', alignItems: 'center' }}>
          <select
            value={method}
            onChange={(e) => setMethod(e.target.value)}
            style={{
              padding: '8px 12px',
              borderRadius: '6px',
              border: '1px solid var(--window-border)',
              background: 'var(--window-bg)',
              color: method === 'GET' ? '#61affe' : 
                     method === 'POST' ? '#49cc90' : 
                     method === 'PUT' ? '#fca130' : 
                     method === 'DELETE' ? '#f93e3e' : '#9012fe',
              fontWeight: '600',
              cursor: 'pointer',
              minWidth: '100px',
            }}
          >
            <option value="GET">GET</option>
            <option value="POST">POST</option>
            <option value="PUT">PUT</option>
            <option value="PATCH">PATCH</option>
            <option value="DELETE">DELETE</option>
            <option value="HEAD">HEAD</option>
            <option value="OPTIONS">OPTIONS</option>
          </select>
          <input
            type="text"
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            placeholder="输入 API 地址..."
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
              if (e.key === 'Enter') sendRequest()
            }}
          />
          <button
            onClick={sendRequest}
            disabled={loading}
            style={{
              padding: '8px 24px',
              borderRadius: '6px',
              border: 'none',
              background: loading ? 'var(--text-secondary)' : '#49cc90',
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

      <div style={{ flex: 1, display: 'flex', overflow: 'hidden' }}>
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden', borderRight: '1px solid var(--window-border)' }}>
          <div style={{ display: 'flex', borderBottom: '1px solid var(--window-border)' }}>
            {[
              { id: 'params', label: '参数' },
              { id: 'headers', label: '请求头' },
              { id: 'body', label: '请求体' },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                style={{
                  flex: 1,
                  padding: '10px 16px',
                  border: 'none',
                  background: activeTab === tab.id ? 'var(--accent-bg)' : 'transparent',
                  color: activeTab === tab.id ? 'var(--accent)' : 'var(--text-secondary)',
                  cursor: 'pointer',
                  fontSize: '13px',
                  fontWeight: '500',
                }}
              >
                {tab.label}
              </button>
            ))}
          </div>

          <div style={{ flex: 1, padding: '12px', overflow: 'auto' }}>
            {activeTab === 'params' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                <button onClick={addParam} style={{ padding: '8px 16px', borderRadius: '4px', border: '1px dashed var(--window-border)', background: 'transparent', color: 'var(--text-secondary)', cursor: 'pointer', width: 'fit-content' }}>
                  + 添加参数
                </button>
                {params.map((param, index) => (
                  <div key={index} style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                    <input
                      type="checkbox"
                      checked={param.enabled}
                      onChange={(e) => updateParam(index, 'enabled', e.target.checked)}
                    />
                    <input
                      type="text"
                      placeholder="参数名"
                      value={param.key}
                      onChange={(e) => updateParam(index, 'key', e.target.value)}
                      style={{ flex: 1, padding: '6px 10px', borderRadius: '4px', border: '1px solid var(--window-border)', background: 'var(--window-bg)', color: 'var(--text-primary)' }}
                    />
                    <input
                      type="text"
                      placeholder="参数值"
                      value={param.value}
                      onChange={(e) => updateParam(index, 'value', e.target.value)}
                      style={{ flex: 1, padding: '6px 10px', borderRadius: '4px', border: '1px solid var(--window-border)', background: 'var(--window-bg)', color: 'var(--text-primary)' }}
                    />
                    <button onClick={() => removeParam(index)} style={{ padding: '6px 10px', borderRadius: '4px', border: 'none', background: 'var(--error)', color: '#fff', cursor: 'pointer' }}>
                      ×
                    </button>
                  </div>
                ))}
              </div>
            )}

            {activeTab === 'headers' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                <button onClick={addHeader} style={{ padding: '8px 16px', borderRadius: '4px', border: '1px dashed var(--window-border)', background: 'transparent', color: 'var(--text-secondary)', cursor: 'pointer', width: 'fit-content' }}>
                  + 添加请求头
                </button>
                {headers.map((header, index) => (
                  <div key={index} style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                    <input
                      type="checkbox"
                      checked={header.enabled}
                      onChange={(e) => updateHeader(index, 'enabled', e.target.checked)}
                    />
                    <input
                      type="text"
                      placeholder="Header 名"
                      value={header.key}
                      onChange={(e) => updateHeader(index, 'key', e.target.value)}
                      style={{ flex: 1, padding: '6px 10px', borderRadius: '4px', border: '1px solid var(--window-border)', background: 'var(--window-bg)', color: 'var(--text-primary)' }}
                    />
                    <input
                      type="text"
                      placeholder="Header 值"
                      value={header.value}
                      onChange={(e) => updateHeader(index, 'value', e.target.value)}
                      style={{ flex: 1, padding: '6px 10px', borderRadius: '4px', border: '1px solid var(--window-border)', background: 'var(--window-bg)', color: 'var(--text-primary)' }}
                    />
                    <button onClick={() => removeHeader(index)} style={{ padding: '6px 10px', borderRadius: '4px', border: 'none', background: 'var(--error)', color: '#fff', cursor: 'pointer' }}>
                      ×
                    </button>
                  </div>
                ))}
              </div>
            )}

            {activeTab === 'body' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                <div style={{ display: 'flex', gap: '8px' }}>
                  <button onClick={formatBody} style={{ padding: '8px 16px', borderRadius: '4px', border: '1px solid var(--window-border)', background: 'transparent', color: 'var(--text-secondary)', cursor: 'pointer' }}>
                    格式化 JSON
                  </button>
                </div>
                <textarea
                  value={body}
                  onChange={(e) => setBody(e.target.value)}
                  placeholder='{ "key": "value" }'
                  style={{
                    flex: 1,
                    minHeight: '200px',
                    padding: '12px',
                    borderRadius: '4px',
                    border: '1px solid var(--window-border)',
                    background: 'var(--titlebar-bg)',
                    color: 'var(--text-primary)',
                    fontFamily: 'JetBrains Mono, monospace',
                    fontSize: '13px',
                    lineHeight: '1.5',
                    resize: 'vertical',
                  }}
                />
              </div>
            )}
          </div>
        </div>

        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
          <div style={{ padding: '12px 16px', borderBottom: '1px solid var(--window-border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: '13px', fontWeight: '600' }}>响应</span>
            {response && (
              <div style={{ display: 'flex', gap: '16px', alignItems: 'center', fontSize: '12px' }}>
                <span style={{ color: response.status >= 200 && response.status < 300 ? '#49cc90' : '#f93e3e', fontWeight: '600' }}>
                  {response.status || 'Error'} {response.statusText || ''}
                </span>
                {responseTime > 0 && <span style={{ color: 'var(--text-secondary)' }}>{responseTime}ms</span>}
              </div>
            )}
          </div>

          <div style={{ flex: 1, padding: '12px', overflow: 'auto' }}>
            {loading && (
              <div style={{ textAlign: 'center', color: 'var(--text-secondary)', padding: '40px' }}>
                <div style={{ fontSize: '48px', marginBottom: '12px' }}>⏳</div>
                <div>正在发送请求...</div>
              </div>
            )}
            {!loading && response && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                {response.headers && (
                  <div>
                    <div style={{ fontSize: '12px', color: 'var(--text-secondary)', marginBottom: '8px', fontWeight: '600' }}>响应头</div>
                    <div style={{ background: 'var(--titlebar-bg)', padding: '12px', borderRadius: '6px', fontSize: '12px', fontFamily: 'JetBrains Mono, monospace' }}>
                      {Object.entries(response.headers).map(([key, value]) => (
                        <div key={key}><span style={{ color: 'var(--accent)' }}>{key}</span>: {String(value)}</div>
                      ))}
                    </div>
                  </div>
                )}
                {response.data !== undefined && (
                  <div>
                    <div style={{ fontSize: '12px', color: 'var(--text-secondary)', marginBottom: '8px', fontWeight: '600' }}>响应数据</div>
                    <pre style={{
                      background: 'var(--titlebar-bg)',
                      padding: '12px',
                      borderRadius: '6px',
                      margin: 0,
                      fontSize: '12px',
                      fontFamily: 'JetBrains Mono, monospace',
                      overflow: 'auto',
                      maxHeight: '400px',
                      whiteSpace: 'pre-wrap',
                      wordBreak: 'break-all',
                    }}>
                      {typeof response.data === 'string' ? response.data : JSON.stringify(response.data, null, 2)}
                    </pre>
                  </div>
                )}
                {response.error && (
                  <div style={{ color: '#f93e3e', padding: '16px', background: 'rgba(249, 62, 62, 0.1)', borderRadius: '6px' }}>
                    {response.error}
                  </div>
                )}
              </div>
            )}
            {!loading && !response && (
              <div style={{ textAlign: 'center', color: 'var(--text-secondary)', padding: '40px' }}>
                <div style={{ fontSize: '48px', marginBottom: '12px' }}>📡</div>
                <div>输入 URL 并点击发送开始测试 API</div>
              </div>
            )}
          </div>
        </div>
      </div>

      {history.length > 0 && (
        <div style={{ padding: '12px', borderTop: '1px solid var(--window-border)', maxHeight: '120px', overflow: 'auto' }}>
          <div style={{ fontSize: '11px', color: 'var(--text-secondary)', marginBottom: '8px' }}>历史记录</div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
            {history.map((item) => (
              <div
                key={item.id}
                onClick={() => loadFromHistory(item)}
                style={{
                  padding: '6px 10px',
                  borderRadius: '4px',
                  background: 'var(--titlebar-bg)',
                  fontSize: '11px',
                  cursor: 'pointer',
                  display: 'flex',
                  gap: '8px',
                  alignItems: 'center',
                  transition: 'all 0.2s',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = 'var(--accent-bg)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = 'var(--titlebar-bg)';
                }}
              >
                <span style={{ color: 
                  item.method === 'GET' ? '#61affe' :
                  item.method === 'POST' ? '#49cc90' :
                  item.method === 'PUT' ? '#fca130' :
                  item.method === 'DELETE' ? '#f93e3e' : '#9012fe', 
                  fontWeight: '600' }}>
                  {item.method}
                </span>
                <span style={{ color: 'var(--text-secondary)', maxWidth: '200px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {item.url}
                </span>
                <span style={{ color: item.status >= 200 && item.status < 300 ? '#49cc90' : '#f93e3e' }}>
                  {item.status}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
})

export default RESTClient
