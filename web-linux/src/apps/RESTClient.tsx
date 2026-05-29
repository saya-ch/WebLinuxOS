import { useState } from 'react'

export default function RESTClient() {
  const [url, setUrl] = useState('https://jsonplaceholder.typicode.com/todos/1')
  const [method, setMethod] = useState<'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH'>('GET')
  const [requestBody, setRequestBody] = useState('')
  const [headers, setHeaders] = useState('{\n  "Content-Type": "application/json"\n}')
  const [response, setResponse] = useState<string>('')
  const [loading, setLoading] = useState(false)
  const [status, setStatus] = useState<number | null>(null)
  const [responseTime, setResponseTime] = useState<number | null>(null)

  const sendRequest = async () => {
    setLoading(true)
    setResponse('')
    setStatus(null)
    setResponseTime(null)

    const startTime = Date.now()

    try {
      let parsedHeaders: Record<string, string> = {}
      try {
        parsedHeaders = JSON.parse(headers)
      } catch {
        parsedHeaders = { 'Content-Type': 'application/json' }
      }

      const requestOptions: RequestInit = {
        method,
        headers: parsedHeaders,
      }

      if (method !== 'GET' && method !== 'DELETE' && requestBody.trim()) {
        requestOptions.body = requestBody
      }

      const res = await fetch(url, requestOptions)
      const endTime = Date.now()
      setResponseTime(endTime - startTime)
      setStatus(res.status)

      const text = await res.text()
      try {
        const json = JSON.parse(text)
        setResponse(JSON.stringify(json, null, 2))
      } catch {
        setResponse(text)
      }
    } catch (error) {
      setResponse(`请求错误: ${error}`)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', background: '#1e1e2e', color: '#cdd6f4' }}>
      <div style={{ padding: '16px 20px', borderBottom: '1px solid #313244', background: '#181825' }}>
        <h1 style={{ margin: '0 0 6px', fontSize: '20px', fontWeight: 700 }}>🌐 REST 客户端</h1>
        <p style={{ margin: 0, fontSize: '12px', color: '#a6adc8' }}>发送 HTTP 请求，测试 API 端点</p>
      </div>

      <div style={{ flex: 1, padding: '20px', overflow: 'auto', display: 'flex', flexDirection: 'column', gap: '16px' }}>
        <div style={{ display: 'flex', gap: '10px' }}>
          <select
            value={method}
            onChange={(e) => setMethod(e.target.value as any)}
            style={{
              padding: '10px 14px',
              background: '#313244',
              border: '1px solid #45475a',
              borderRadius: '10px',
              color: '#cdd6f4',
              fontSize: '13px',
              fontWeight: 600,
            }}
          >
            <option value="GET" style={{ color: '#1e1e2e' }}>GET</option>
            <option value="POST" style={{ color: '#1e1e2e' }}>POST</option>
            <option value="PUT" style={{ color: '#1e1e2e' }}>PUT</option>
            <option value="DELETE" style={{ color: '#1e1e2e' }}>DELETE</option>
            <option value="PATCH" style={{ color: '#1e1e2e' }}>PATCH</option>
          </select>
          <input
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            placeholder="输入 URL..."
            style={{
              flex: 1,
              padding: '10px 14px',
              background: '#313244',
              border: '1px solid #45475a',
              borderRadius: '10px',
              color: '#cdd6f4',
              fontSize: '13px',
            }}
          />
          <button
            onClick={sendRequest}
            disabled={loading}
            style={{
              padding: '10px 24px',
              background: loading ? '#45475a' : 'linear-gradient(135deg, #89b4fa 0%, #74c7ec 100%)',
              border: 'none',
              borderRadius: '10px',
              color: loading ? '#a6adc8' : '#1e1e2e',
              fontWeight: 700,
              cursor: loading ? 'not-allowed' : 'pointer',
            }}
          >
            {loading ? '发送中...' : '发送'}
          </button>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
          <div>
            <div style={{ fontSize: '13px', fontWeight: 600, marginBottom: '8px', color: '#a6adc8' }}>Headers (JSON)</div>
            <textarea
              value={headers}
              onChange={(e) => setHeaders(e.target.value)}
              style={{
                width: '100%',
                minHeight: '120px',
                background: '#313244',
                border: '1px solid #45475a',
                borderRadius: '10px',
                padding: '12px',
                color: '#cdd6f4',
                fontSize: '12px',
                fontFamily: 'monospace',
              }}
            />
          </div>
          <div>
            <div style={{ fontSize: '13px', fontWeight: 600, marginBottom: '8px', color: '#a6adc8' }}>Body</div>
            <textarea
              value={requestBody}
              onChange={(e) => setRequestBody(e.target.value)}
              placeholder='{ "key": "value" }'
              style={{
                width: '100%',
                minHeight: '120px',
                background: '#313244',
                border: '1px solid #45475a',
                borderRadius: '10px',
                padding: '12px',
                color: '#cdd6f4',
                fontSize: '12px',
                fontFamily: 'monospace',
              }}
            />
          </div>
        </div>

        <div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
            <div style={{ fontSize: '13px', fontWeight: 600, color: '#a6adc8' }}>响应</div>
            <div style={{ display: 'flex', gap: '12px', fontSize: '12px' }}>
              {status && (
                <span style={{ color: status >= 200 && status < 300 ? '#a6e3a1' : '#f38ba8' }}>
                  Status: {status}
                </span>
              )}
              {responseTime && <span style={{ color: '#f9e2af' }}>Time: {responseTime}ms</span>}
            </div>
          </div>
          <textarea
            value={response}
            readOnly
            placeholder="响应将显示在这里..."
            style={{
              width: '100%',
              minHeight: '200px',
              background: '#313244',
              border: '1px solid #45475a',
              borderRadius: '10px',
              padding: '14px',
              color: '#a6e3a1',
              fontSize: '12px',
              fontFamily: 'monospace',
            }}
          />
        </div>
      </div>
    </div>
  )
}
