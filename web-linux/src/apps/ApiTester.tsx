import { useState, useCallback } from 'react'

type HttpRequest = {
  id: string
  method: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH' | 'HEAD' | 'OPTIONS'
  url: string
  headers: Record<string, string>
  body: string
  createdAt: number
}

type HttpResponse = {
  status: number
  statusText: string
  headers: Record<string, string>
  body: string
  time: number
  ok: boolean
}

export default function ApiTester() {
  const [method, setMethod] = useState<HttpRequest['method']>('GET')
  const [url, setUrl] = useState('https://jsonplaceholder.typicode.com/todos/1')
  const [headers, setHeaders] = useState<Record<string, string>>({ 'Content-Type': 'application/json' })
  const [body, setBody] = useState('')
  const [loading, setLoading] = useState(false)
  const [response, setResponse] = useState<HttpResponse | null>(null)
  const [history, setHistory] = useState<Array<{ request: HttpRequest; response: HttpResponse }>>([])

  const sendRequest = useCallback(async () => {
    if (!url.trim()) return
    
    setLoading(true)
    const startTime = Date.now()
    const requestId = `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
    
    const request: HttpRequest = {
      id: requestId,
      method,
      url,
      headers,
      body,
      createdAt: startTime,
    }
    
    try {
      const response = await fetch(url, {
        method,
        headers,
        body: method !== 'GET' && method !== 'HEAD' && body.trim() ? body : undefined,
      })
      
      const responseText = await response.text()
      const responseHeaders: Record<string, string> = {}
      response.headers.forEach((value, key) => {
        responseHeaders[key] = value
      })
      
      const httpResponse: HttpResponse = {
        status: response.status,
        statusText: response.statusText,
        headers: responseHeaders,
        body: responseText,
        time: Date.now() - startTime,
        ok: response.ok,
      }
      
      setResponse(httpResponse)
      setHistory((prev) => [{ request, response: httpResponse }, ...prev.slice(0, 19)])
    } catch (err) {
      const errorResponse: HttpResponse = {
        status: 0,
        statusText: 'Error',
        headers: {},
        body: err instanceof Error ? err.message : String(err),
        time: Date.now() - startTime,
        ok: false,
      }
      setResponse(errorResponse)
    } finally {
      setLoading(false)
    }
  }, [method, url, headers, body])

  const addHeader = useCallback(() => {
    setHeaders((prev) => ({ ...prev, '': '' }))
  }, [])

  const removeHeader = useCallback((key: string) => {
    setHeaders((prev) => {
      const newHeaders = { ...prev }
      delete newHeaders[key]
      return newHeaders
    })
  }, [])

  const updateHeader = useCallback((oldKey: string, newKey: string, value: string) => {
    setHeaders((prev) => {
      const newHeaders = { ...prev }
      if (oldKey !== newKey) {
        delete newHeaders[oldKey]
      }
      newHeaders[newKey] = value
      return newHeaders
    })
  }, [])

  const formatBody = useCallback(() => {
    try {
      const parsed = JSON.parse(body)
      setBody(JSON.stringify(parsed, null, 2))
    } catch (e) {
      alert('无效的 JSON')
    }
  }, [body])

  const clearResponse = useCallback(() => {
    setResponse(null)
  }, [])

  const loadFromHistory = useCallback((item: { request: HttpRequest; response: HttpResponse }) => {
    setMethod(item.request.method)
    setUrl(item.request.url)
    setHeaders(item.request.headers)
    setBody(item.request.body)
    setResponse(item.response)
  }, [])

  return (
    <div className="app-container" style={{ padding: '20px', height: '100%', overflow: 'auto' }}>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 300px', gap: '20px', height: '100%' }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
          <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
            <select
              value={method}
              onChange={(e) => setMethod(e.target.value as any)}
              style={{ padding: '10px 15px', borderRadius: '6px', border: '1px solid #444', background: '#2a2a2a', color: '#fff', fontSize: '14px' }}
            >
              <option value="GET">GET</option>
              <option value="POST">POST</option>
              <option value="PUT">PUT</option>
              <option value="DELETE">DELETE</option>
              <option value="PATCH">PATCH</option>
              <option value="HEAD">HEAD</option>
              <option value="OPTIONS">OPTIONS</option>
            </select>
            <input
              type="text"
              placeholder="Enter URL..."
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              style={{ flex: 1, padding: '10px 15px', borderRadius: '6px', border: '1px solid #444', background: '#2a2a2a', color: '#fff', fontSize: '14px' }}
              onKeyDown={(e) => e.key === 'Enter' && sendRequest()}
            />
            <button
              onClick={sendRequest}
              disabled={loading}
              style={{
                padding: '10px 20px',
                borderRadius: '6px',
                border: 'none',
                background: '#0066cc',
                color: '#fff',
                cursor: 'pointer',
                fontSize: '14px',
                fontWeight: 'bold',
              }}
            >
              {loading ? '发送中...' : '发送'}
            </button>
          </div>

          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
              <h4 style={{ margin: 0, color: '#fff', fontSize: '14px' }}>Headers</h4>
              <button
                onClick={addHeader}
                style={{
                  padding: '6px 12px',
                  borderRadius: '4px',
                  border: '1px solid #444',
                  background: '#333',
                  color: '#fff',
                  cursor: 'pointer',
                  fontSize: '12px',
                }}
              >
                + Add Header
              </button>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {Object.entries(headers).map(([key, value], index) => (
                <div key={index} style={{ display: 'flex', gap: '8px' }}>
                  <input
                    type="text"
                    placeholder="Key"
                    value={key}
                    onChange={(e) => updateHeader(key, e.target.value, value)}
                    style={{ flex: 1, padding: '8px 12px', borderRadius: '4px', border: '1px solid #444', background: '#2a2a2a', color: '#fff' }}
                  />
                  <input
                    type="text"
                    placeholder="Value"
                    value={value}
                    onChange={(e) => updateHeader(key, key, e.target.value)}
                    style={{ flex: 1, padding: '8px 12px', borderRadius: '4px', border: '1px solid #444', background: '#2a2a2a', color: '#fff' }}
                  />
                  <button
                    onClick={() => removeHeader(key)}
                    style={{
                      padding: '8px 12px',
                      borderRadius: '4px',
                      border: '1px solid #444',
                      background: '#333',
                      color: '#ff6b6b',
                      cursor: 'pointer',
                    }}
                  >
                    ×
                  </button>
                </div>
              ))}
            </div>
          </div>

          {method !== 'GET' && method !== 'HEAD' && (
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                <h4 style={{ margin: 0, color: '#fff', fontSize: '14px' }}>Body</h4>
                <button
                  onClick={formatBody}
                  style={{
                    padding: '6px 12px',
                    borderRadius: '4px',
                    border: '1px solid #444',
                    background: '#333',
                    color: '#fff',
                    cursor: 'pointer',
                    fontSize: '12px',
                  }}
                >
                  Format JSON
                </button>
              </div>
              <textarea
                value={body}
                onChange={(e) => setBody(e.target.value)}
                placeholder="Enter request body..."
                style={{
                  width: '100%',
                  minHeight: '150px',
                  padding: '12px',
                  borderRadius: '6px',
                  border: '1px solid #444',
                  background: '#2a2a2a',
                  color: '#fff',
                  fontFamily: 'monospace',
                  fontSize: '13px',
                  resize: 'vertical',
                }}
              />
            </div>
          )}

          {response && (
            <div style={{ flex: 1, overflow: 'auto', display: 'flex', flexDirection: 'column' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                <h4 style={{ margin: 0, color: '#fff', fontSize: '14px' }}>
                  Response {response.status !== 0 && `(${response.status} ${response.statusText} - ${response.time}ms)`}
                </h4>
                <button
                  onClick={clearResponse}
                  style={{
                    padding: '6px 12px',
                    borderRadius: '4px',
                    border: '1px solid #444',
                    background: '#333',
                    color: '#fff',
                    cursor: 'pointer',
                    fontSize: '12px',
                  }}
                >
                  Clear
                </button>
              </div>
              <div style={{ flex: 1, overflow: 'auto', padding: '12px', borderRadius: '6px', border: '1px solid #444', background: '#1a1a1a', fontFamily: 'monospace', fontSize: '13px', color: response.ok ? '#4ade80' : '#f44747' }}>
                <pre style={{ margin: 0, whiteSpace: 'pre-wrap', wordBreak: 'break-all' }}>{response.body}</pre>
              </div>
            </div>
          )}
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
          <h4 style={{ margin: 0, color: '#fff', fontSize: '14px' }}>History</h4>
          <div style={{ flex: 1, overflow: 'auto', display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {history.length === 0 ? (
              <div style={{ color: '#888', fontSize: '13px', textAlign: 'center', padding: '20px' }}>
                No requests yet
              </div>
            ) : (
              history.map((item, index) => (
                <div
                  key={index}
                  onClick={() => loadFromHistory(item)}
                  style={{
                    padding: '10px',
                    borderRadius: '6px',
                    border: '1px solid #444',
                    background: '#2a2a2a',
                    cursor: 'pointer',
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ fontWeight: 'bold', color: item.response.ok ? '#4ade80' : '#f44747' }}>
                      {item.request.method}
                    </span>
                    <span style={{ color: '#888', fontSize: '11px' }}>
                      {new Date(item.request.createdAt).toLocaleTimeString()}
                    </span>
                  </div>
                  <div style={{ fontSize: '11px', color: '#888', marginTop: '4px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {item.request.url}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
