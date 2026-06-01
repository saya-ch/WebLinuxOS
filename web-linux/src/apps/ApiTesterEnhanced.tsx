import { useState, useEffect, useCallback, memo } from 'react'

interface RequestHistory {
  id: string
  method: string
  url: string
  status: number
  timestamp: number
  responseTime: number
}

interface Environment {
  id: string
  name: string
  variables: Record<string, string>
}

const ApiTester = memo(function ApiTester() {
  const [method, setMethod] = useState<'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH' | 'HEAD' | 'OPTIONS'>('GET')
  const [url, setUrl] = useState('')
  const [headers, setHeaders] = useState<{ key: string; value: string; enabled: boolean }[]>([
    { key: 'Content-Type', value: 'application/json', enabled: true }
  ])
  const [body, setBody] = useState('')
  const [response, setResponse] = useState<{
    status: number
    statusText: string
    headers: Record<string, string>
    data: any
    time: number
    size: number
  } | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [activeTab, setActiveTab] = useState<'params' | 'headers' | 'body' | 'auth'>('params')
  const [queryParams, setQueryParams] = useState<{ key: string; value: string; enabled: boolean }[]>([])
  const [history, setHistory] = useState<RequestHistory[]>(() => {
    const saved = localStorage.getItem('weblinux-api-tester-history')
    return saved ? JSON.parse(saved) : []
  })
  const [environments, setEnvironments] = useState<Environment[]>(() => {
    const saved = localStorage.getItem('weblinux-api-tester-envs')
    return saved ? JSON.parse(saved) : [
      {
        id: 'default',
        name: '默认环境',
        variables: {
          baseUrl: 'https://jsonplaceholder.typicode.com',
          apiKey: ''
        }
      }
    ]
  })
  const [activeEnv, setActiveEnv] = useState('default')

  const getEnvVariable = (key: string): string => {
    const env = environments.find(e => e.id === activeEnv)
    return env?.variables[key] || ''
  }

  const replaceVariables = (str: string): string => {
    return str.replace(/\{\{(\w+)\}\}/g, (_, key) => getEnvVariable(key) || `{{${key}}}`)
  }

  const sendRequest = useCallback(async () => {
    if (!url) {
      setError('请输入请求URL')
      return
    }

    setLoading(true)
    setError('')
    setResponse(null)

    const startTime = performance.now()

    try {
      const finalUrl = replaceVariables(url)
      const enabledHeaders = headers
        .filter(h => h.enabled && h.key)
        .reduce((acc, h) => {
          acc[replaceVariables(h.key)] = replaceVariables(h.value)
          return acc
        }, {} as Record<string, string>)

      const enabledParams = queryParams
        .filter(p => p.enabled && p.key)
        .map(p => `${encodeURIComponent(replaceVariables(p.key))}=${encodeURIComponent(replaceVariables(p.value))}`)
        .join('&')

      const finalUrlWithParams = enabledParams ? `${finalUrl}${finalUrl.includes('?') ? '&' : '?'}${enabledParams}` : finalUrl

      const fetchOptions: RequestInit = {
        method,
        headers: enabledHeaders,
      }

      if (['POST', 'PUT', 'PATCH'].includes(method) && body) {
        fetchOptions.body = replaceVariables(body)
      }

      const res = await fetch(finalUrlWithParams, fetchOptions)
      const endTime = performance.now()

      const responseText = await res.text()
      const responseSize = new Blob([responseText]).size

      let responseData: any
      try {
        responseData = JSON.parse(responseText)
      } catch {
        responseData = responseText
      }

      const responseHeaders: Record<string, string> = {}
      res.headers.forEach((value, key) => {
        responseHeaders[key] = value
      })

      const newResponse = {
        status: res.status,
        statusText: res.statusText,
        headers: responseHeaders,
        data: responseData,
        time: Math.round(endTime - startTime),
        size: responseSize
      }

      setResponse(newResponse)

      const historyItem: RequestHistory = {
        id: Date.now().toString(),
        method,
        url: finalUrlWithParams,
        status: res.status,
        timestamp: Date.now(),
        responseTime: Math.round(endTime - startTime)
      }
      const updatedHistory = [historyItem, ...history.slice(0, 99)]
      setHistory(updatedHistory)
      localStorage.setItem('weblinux-api-tester-history', JSON.stringify(updatedHistory))

    } catch (err: any) {
      setError(err.message || '请求失败')
    } finally {
      setLoading(false)
    }
  }, [method, url, headers, body, queryParams, history, activeEnv])

  const formatSize = (bytes: number): string => {
    if (bytes < 1024) return `${bytes} B`
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(2)} KB`
    return `${(bytes / (1024 * 1024)).toFixed(2)} MB`
  }

  const formatJson = (data: any): string => {
    try {
      return JSON.stringify(data, null, 2)
    } catch {
      return String(data)
    }
  }

  const getStatusColor = (status: number): string => {
    if (status >= 200 && status < 300) return '#48bb78'
    if (status >= 300 && status < 400) return '#ed8936'
    if (status >= 400 && status < 500) return '#f6e05e'
    return '#fc8181'
  }

  const loadFromHistory = (item: RequestHistory) => {
    setUrl(item.url)
    setMethod(item.method as any)
  }

  const addHeader = () => {
    setHeaders([...headers, { key: '', value: '', enabled: true }])
  }

  const removeHeader = (index: number) => {
    setHeaders(headers.filter((_, i) => i !== index))
  }

  const addParam = () => {
    setQueryParams([...queryParams, { key: '', value: '', enabled: true }])
  }

  const removeParam = (index: number) => {
    setQueryParams(queryParams.filter((_, i) => i !== index))
  }

  return (
    <div style={{ height: '100%', background: '#f7fafc', display: 'flex', flexDirection: 'column' }}>
      <div style={{ padding: 16, background: '#fff', borderBottom: '1px solid #e2e8f0' }}>
        <div style={{ display: 'flex', gap: 8, marginBottom: 12 }}>
          <select
            value={method}
            onChange={(e) => setMethod(e.target.value as any)}
            style={{
              padding: '10px 16px',
              borderRadius: 8,
              border: '1px solid #e2e8f0',
              background: method === 'GET' ? '#48bb78' :
                         method === 'POST' ? '#4299e1' :
                         method === 'PUT' ? '#ed8936' :
                         method === 'DELETE' ? '#fc8181' :
                         '#718096',
              color: '#fff',
              fontWeight: 600,
              cursor: 'pointer',
              fontSize: 14
            }}
          >
            {['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'HEAD', 'OPTIONS'].map(m => (
              <option key={m} value={m}>{m}</option>
            ))}
          </select>
          <input
            type="text"
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            placeholder="输入请求URL，支持 {{variable}} 变量"
            style={{
              flex: 1,
              padding: '10px 16px',
              borderRadius: 8,
              border: '1px solid #e2e8f0',
              fontSize: 14,
              outline: 'none'
            }}
            onKeyDown={(e) => {
              if (e.key === 'Enter') sendRequest()
            }}
          />
          <button
            onClick={sendRequest}
            disabled={loading}
            style={{
              padding: '10px 32px',
              borderRadius: 8,
              border: 'none',
              background: loading ? '#a0aec0' : '#667eea',
              color: '#fff',
              fontWeight: 600,
              fontSize: 14,
              cursor: loading ? 'not-allowed' : 'pointer',
              transition: 'all 0.2s'
            }}
          >
            {loading ? '发送中...' : '发送'}
          </button>
        </div>

        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div style={{ display: 'flex', gap: 8 }}>
            {['params', 'headers', 'body', 'auth'].map(tab => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab as any)}
                style={{
                  padding: '6px 16px',
                  borderRadius: 6,
                  border: 'none',
                  background: activeTab === tab ? '#edf2f7' : 'transparent',
                  color: activeTab === tab ? '#2d3748' : '#718096',
                  fontSize: 13,
                  fontWeight: activeTab === tab ? 600 : 400,
                  cursor: 'pointer'
                }}
              >
                {tab === 'params' ? '参数' : tab === 'headers' ? '请求头' : tab === 'body' ? '请求体' : '认证'}
              </button>
            ))}
          </div>
          <div style={{ fontSize: 12, color: '#718096' }}>
            环境:
            <select
              value={activeEnv}
              onChange={(e) => setActiveEnv(e.target.value)}
              style={{
                marginLeft: 8,
                padding: '4px 8px',
                borderRadius: 4,
                border: '1px solid #e2e8f0',
                fontSize: 12
              }}
            >
              {environments.map(env => (
                <option key={env.id} value={env.id}>{env.name}</option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {activeTab === 'params' && (
        <div style={{ padding: 16, background: '#fff', margin: 16, borderRadius: 8 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
            <h3 style={{ fontSize: 14, margin: 0 }}>查询参数</h3>
            <button onClick={addParam} style={{ padding: '4px 12px', borderRadius: 4, border: 'none', background: '#48bb78', color: '#fff', fontSize: 12, cursor: 'pointer' }}>
              + 添加参数
            </button>
          </div>
          {queryParams.map((param, index) => (
            <div key={index} style={{ display: 'flex', gap: 8, marginBottom: 8 }}>
              <input
                type="checkbox"
                checked={param.enabled}
                onChange={(e) => {
                  const newParams = [...queryParams]
                  newParams[index].enabled = e.target.checked
                  setQueryParams(newParams)
                }}
              />
              <input
                type="text"
                value={param.key}
                onChange={(e) => {
                  const newParams = [...queryParams]
                  newParams[index].key = e.target.value
                  setQueryParams(newParams)
                }}
                placeholder="参数名"
                style={{ flex: 1, padding: '6px 12px', borderRadius: 4, border: '1px solid #e2e8f0', fontSize: 13 }}
              />
              <input
                type="text"
                value={param.value}
                onChange={(e) => {
                  const newParams = [...queryParams]
                  newParams[index].value = e.target.value
                  setQueryParams(newParams)
                }}
                placeholder="参数值"
                style={{ flex: 1, padding: '6px 12px', borderRadius: 4, border: '1px solid #e2e8f0', fontSize: 13 }}
              />
              <button onClick={() => removeParam(index)} style={{ padding: '6px 12px', borderRadius: 4, border: 'none', background: '#fc8181', color: '#fff', fontSize: 12, cursor: 'pointer' }}>
                删除
              </button>
            </div>
          ))}
        </div>
      )}

      {activeTab === 'headers' && (
        <div style={{ padding: 16, background: '#fff', margin: 16, borderRadius: 8 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
            <h3 style={{ fontSize: 14, margin: 0 }}>请求头</h3>
            <button onClick={addHeader} style={{ padding: '4px 12px', borderRadius: 4, border: 'none', background: '#48bb78', color: '#fff', fontSize: 12, cursor: 'pointer' }}>
              + 添加请求头
            </button>
          </div>
          {headers.map((header, index) => (
            <div key={index} style={{ display: 'flex', gap: 8, marginBottom: 8 }}>
              <input
                type="checkbox"
                checked={header.enabled}
                onChange={(e) => {
                  const newHeaders = [...headers]
                  newHeaders[index].enabled = e.target.checked
                  setHeaders(newHeaders)
                }}
              />
              <input
                type="text"
                value={header.key}
                onChange={(e) => {
                  const newHeaders = [...headers]
                  newHeaders[index].key = e.target.value
                  setHeaders(newHeaders)
                }}
                placeholder="Header名称"
                style={{ flex: 1, padding: '6px 12px', borderRadius: 4, border: '1px solid #e2e8f0', fontSize: 13 }}
              />
              <input
                type="text"
                value={header.value}
                onChange={(e) => {
                  const newHeaders = [...headers]
                  newHeaders[index].value = e.target.value
                  setHeaders(newHeaders)
                }}
                placeholder="Header值"
                style={{ flex: 2, padding: '6px 12px', borderRadius: 4, border: '1px solid #e2e8f0', fontSize: 13 }}
              />
              <button onClick={() => removeHeader(index)} style={{ padding: '6px 12px', borderRadius: 4, border: 'none', background: '#fc8181', color: '#fff', fontSize: 12, cursor: 'pointer' }}>
                删除
              </button>
            </div>
          ))}
        </div>
      )}

      {activeTab === 'body' && (
        <div style={{ padding: 16, background: '#fff', margin: 16, borderRadius: 8 }}>
          <h3 style={{ fontSize: 14, marginBottom: 12 }}>请求体 (JSON)</h3>
          <textarea
            value={body}
            onChange={(e) => setBody(e.target.value)}
            placeholder='{"key": "value"}'
            rows={10}
            style={{
              width: '100%',
              padding: 12,
              borderRadius: 8,
              border: '1px solid #e2e8f0',
              fontSize: 13,
              fontFamily: 'Monaco, Consolas, monospace',
              resize: 'vertical',
              outline: 'none'
            }}
          />
        </div>
      )}

      {activeTab === 'auth' && (
        <div style={{ padding: 16, background: '#fff', margin: 16, borderRadius: 8 }}>
          <h3 style={{ fontSize: 14, marginBottom: 12 }}>环境变量</h3>
          <p style={{ fontSize: 13, color: '#718096', marginBottom: 16 }}>
            在URL中使用 {'{{variableName}}'} 来引用环境变量
          </p>
          <div style={{ background: '#f7fafc', padding: 16, borderRadius: 8 }}>
            <h4 style={{ fontSize: 13, marginBottom: 8 }}>当前环境: {environments.find(e => e.id === activeEnv)?.name}</h4>
            {Object.entries(environments.find(e => e.id === activeEnv)?.variables || {}).map(([key, value]) => (
              <div key={key} style={{ marginBottom: 8 }}>
                <label style={{ fontSize: 12, color: '#4a5568' }}>{key}</label>
                <input
                  type="text"
                  value={value}
                  onChange={(e) => {
                    const newEnvs = environments.map(env => {
                      if (env.id === activeEnv) {
                        return {
                          ...env,
                          variables: { ...env.variables, [key]: e.target.value }
                        }
                      }
                      return env
                    })
                    setEnvironments(newEnvs)
                    localStorage.setItem('weblinux-api-tester-envs', JSON.stringify(newEnvs))
                  }}
                  style={{ width: '100%', padding: '6px 12px', borderRadius: 4, border: '1px solid #e2e8f0', fontSize: 13 }}
                />
              </div>
            ))}
          </div>
        </div>
      )}

      <div style={{ flex: 1, overflow: 'auto', padding: 16 }}>
        {error && (
          <div style={{ background: '#fed7d7', border: '1px solid #fc8181', borderRadius: 8, padding: 16, marginBottom: 16, color: '#c53030' }}>
            {error}
          </div>
        )}

        {response && (
          <div style={{ background: '#fff', borderRadius: 8, overflow: 'hidden' }}>
            <div style={{ padding: 16, background: '#f7fafc', borderBottom: '1px solid #e2e8f0', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div style={{ display: 'flex', gap: 16, alignItems: 'center' }}>
                <span style={{
                  padding: '4px 12px',
                  borderRadius: 4,
                  background: getStatusColor(response.status),
                  color: '#fff',
                  fontSize: 13,
                  fontWeight: 600
                }}>
                  {response.status} {response.statusText}
                </span>
                <span style={{ fontSize: 13, color: '#718096' }}>
                  {response.time}ms
                </span>
                <span style={{ fontSize: 13, color: '#718096' }}>
                  {formatSize(response.size)}
                </span>
              </div>
            </div>

            <div style={{ padding: 16 }}>
              <h4 style={{ fontSize: 14, marginBottom: 12 }}>响应头</h4>
              <div style={{ background: '#f7fafc', padding: 12, borderRadius: 6, marginBottom: 16, fontSize: 12, fontFamily: 'Monaco, Consolas, monospace' }}>
                {Object.entries(response.headers).map(([key, value]) => (
                  <div key={key} style={{ marginBottom: 4 }}>
                    <span style={{ color: '#667eea' }}>{key}</span>: {value}
                  </div>
                ))}
              </div>

              <h4 style={{ fontSize: 14, marginBottom: 12 }}>响应体</h4>
              <pre style={{
                background: '#2d3748',
                color: '#e2e8f0',
                padding: 16,
                borderRadius: 6,
                overflow: 'auto',
                fontSize: 12,
                fontFamily: 'Monaco, Consolas, monospace',
                maxHeight: 400
              }}>
                {formatJson(response.data)}
              </pre>
            </div>
          </div>
        )}

        {history.length > 0 && (
          <div style={{ marginTop: 16 }}>
            <h3 style={{ fontSize: 14, marginBottom: 12 }}>请求历史</h3>
            <div style={{ display: 'grid', gap: 8 }}>
              {history.slice(0, 10).map(item => (
                <div
                  key={item.id}
                  onClick={() => loadFromHistory(item)}
                  style={{
                    padding: 12,
                    background: '#fff',
                    borderRadius: 6,
                    cursor: 'pointer',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    border: '1px solid #e2e8f0'
                  }}
                >
                  <div>
                    <span style={{
                      padding: '2px 8px',
                      borderRadius: 4,
                      background: item.method === 'GET' ? '#48bb78' :
                                 item.method === 'POST' ? '#4299e1' :
                                 item.method === 'PUT' ? '#ed8936' :
                                 item.method === 'DELETE' ? '#fc8181' : '#718096',
                      color: '#fff',
                      fontSize: 11,
                      fontWeight: 600,
                      marginRight: 8
                    }}>
                      {item.method}
                    </span>
                    <span style={{ fontSize: 13, color: '#4a5568' }}>
                      {item.url.substring(0, 60)}{item.url.length > 60 ? '...' : ''}
                    </span>
                  </div>
                  <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
                    <span style={{
                      padding: '2px 8px',
                      borderRadius: 4,
                      background: getStatusColor(item.status),
                      color: '#fff',
                      fontSize: 11,
                      fontWeight: 600
                    }}>
                      {item.status}
                    </span>
                    <span style={{ fontSize: 11, color: '#a0aec0' }}>
                      {item.responseTime}ms
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  )
})

export default ApiTester
