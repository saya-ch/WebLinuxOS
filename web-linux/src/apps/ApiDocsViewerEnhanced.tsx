import { memo, useState, useEffect } from 'react'

interface Parameter {
  name: string
  in: 'query' | 'path' | 'header' | 'cookie'
  required?: boolean
  type?: string
  schema?: {
    type?: string
    format?: string
    enum?: string[]
  }
  description?: string
}

interface RequestBody {
  description?: string
  required?: boolean
  content?: {
    [key: string]: {
      schema?: {
        type?: string
        properties?: {
          [key: string]: {
            type?: string
            description?: string
            example?: any
          }
        }
      }
    }
  }
}

interface Endpoint {
  method: string
  path: string
  summary?: string
  description?: string
  parameters?: Parameter[]
  requestBody?: RequestBody
  responses?: {
    [code: string]: {
      description?: string
    }
  }
  tags?: string[]
}

export default memo(function ApiDocsViewer() {
  const [apiUrl, setApiUrl] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [apiData, setApiData] = useState<any>(null)
  const [selectedTag, setSelectedTag] = useState<string>('')
  const [expandedEndpoints, setExpandedEndpoints] = useState<Set<string>>(new Set())
  const [filter, setFilter] = useState('')

  const loadApiDocs = async () => {
    if (!apiUrl.trim()) {
      setError('Please enter an API URL')
      return
    }

    setLoading(true)
    setError('')

    try {
      let url = apiUrl.trim()

      if (!url.startsWith('http://') && !url.startsWith('https://')) {
        url = 'https://' + url
      }

      const response = await fetch(url)

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }

      const data = await response.json()

      if (!data.openapi && !data.swagger) {
        throw new Error('Invalid OpenAPI or Swagger specification')
      }

      setApiData(data)
      setSelectedTag('')
      setExpandedEndpoints(new Set())
    } catch (err: any) {
      setError(err.message || 'Failed to load API documentation')
      setApiData(null)
    } finally {
      setLoading(false)
    }
  }

  const getEndpoints = (): Endpoint[] => {
    if (!apiData?.paths) return []

    const endpoints: Endpoint[] = []

    Object.entries(apiData.paths).forEach(([path, methods]) => {
      Object.entries(methods as Record<string, any>).forEach(([method, details]) => {
        if (['get', 'post', 'put', 'delete', 'patch', 'options', 'head'].includes(method)) {
          endpoints.push({
            method: method.toUpperCase(),
            path,
            summary: details.summary,
            description: details.description,
            parameters: details.parameters,
            requestBody: details.requestBody,
            responses: details.responses,
            tags: details.tags || ['default']
          })
        }
      })
    })

    return endpoints
  }

  const allEndpoints = getEndpoints()

  const tags = [...new Set(allEndpoints.flatMap(e => e.tags || ['default']))]

  const filteredEndpoints = allEndpoints.filter(endpoint => {
    const matchesTag = !selectedTag || endpoint.tags?.includes(selectedTag)
    const matchesFilter = !filter ||
      endpoint.path.toLowerCase().includes(filter.toLowerCase()) ||
      endpoint.summary?.toLowerCase().includes(filter.toLowerCase()) ||
      endpoint.method.toLowerCase().includes(filter.toLowerCase())

    return matchesTag && matchesFilter
  })

  const toggleEndpoint = (key: string) => {
    const newExpanded = new Set(expandedEndpoints)
    if (newExpanded.has(key)) {
      newExpanded.delete(key)
    } else {
      newExpanded.add(key)
    }
    setExpandedEndpoints(newExpanded)
  }

  const getMethodColor = (method: string) => {
    const colors: Record<string, string> = {
      GET: '#00d084',
      POST: '#3498db',
      PUT: '#f39c12',
      DELETE: '#ff4757',
      PATCH: '#9b59b6'
    }
    return colors[method] || '#95a5a6'
  }

  const loadSampleApi = () => {
    setApiUrl('https://petstore.swagger.io/v2/swagger.json')
    setTimeout(() => loadApiDocs(), 100)
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', background: 'var(--bg-secondary)' }}>
      <div style={{
        padding: '16px',
        borderBottom: '1px solid var(--border-color)',
        background: 'var(--bg-primary)'
      }}>
        <div style={{ display: 'flex', gap: '12px', marginBottom: '12px' }}>
          <input
            type="text"
            value={apiUrl}
            onChange={(e) => setApiUrl(e.target.value)}
            placeholder="Enter OpenAPI/Swagger URL (e.g., https://petstore.swagger.io/v2/swagger.json)"
            style={{
              flex: 1,
              padding: '10px 12px',
              border: '1px solid var(--border-color)',
              borderRadius: '6px',
              background: 'var(--bg-secondary)',
              color: 'var(--text-primary)',
              fontSize: '13px',
              outline: 'none'
            }}
            onKeyDown={(e) => {
              if (e.key === 'Enter') loadApiDocs()
            }}
          />
          <button
            onClick={loadApiDocs}
            disabled={loading}
            style={{
              padding: '10px 20px',
              background: loading ? 'var(--bg-tertiary)' : 'var(--accent-color)',
              color: 'white',
              border: 'none',
              borderRadius: '6px',
              cursor: loading ? 'not-allowed' : 'pointer',
              fontSize: '13px',
              fontWeight: '500'
            }}
          >
            {loading ? 'Loading...' : 'Load API'}
          </button>
          <button
            onClick={loadSampleApi}
            style={{
              padding: '10px 16px',
              background: 'var(--bg-tertiary)',
              color: 'var(--text-primary)',
              border: '1px solid var(--border-color)',
              borderRadius: '6px',
              cursor: 'pointer',
              fontSize: '13px'
            }}
          >
            Load Sample
          </button>
        </div>

        {error && (
          <div style={{
            padding: '12px',
            background: 'rgba(255, 71, 87, 0.1)',
            border: '1px solid #ff4757',
            borderRadius: '6px',
            color: '#ff4757',
            fontSize: '13px'
          }}>
            {error}
          </div>
        )}
      </div>

      {apiData && (
        <div style={{ flex: 1, display: 'flex', overflow: 'hidden' }}>
          <div style={{
            width: '250px',
            borderRight: '1px solid var(--border-color)',
            background: 'var(--bg-primary)',
            overflow: 'auto'
          }}>
            <div style={{ padding: '12px' }}>
              <div style={{ marginBottom: '16px' }}>
                <div style={{ fontSize: '12px', color: 'var(--text-secondary)', marginBottom: '8px', fontWeight: '500' }}>
                  FILTER ENDPOINTS
                </div>
                <input
                  type="text"
                  value={filter}
                  onChange={(e) => setFilter(e.target.value)}
                  placeholder="Search endpoints..."
                  style={{
                    width: '100%',
                    padding: '8px',
                    border: '1px solid var(--border-color)',
                    borderRadius: '4px',
                    background: 'var(--bg-secondary)',
                    color: 'var(--text-primary)',
                    fontSize: '12px',
                    outline: 'none',
                    boxSizing: 'border-box'
                  }}
                />
              </div>

              <div style={{ fontSize: '12px', color: 'var(--text-secondary)', marginBottom: '8px', fontWeight: '500' }}>
                TAGS
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                <button
                  onClick={() => setSelectedTag('')}
                  style={{
                    padding: '8px 12px',
                    background: !selectedTag ? 'var(--accent-color)' : 'transparent',
                    color: !selectedTag ? 'white' : 'var(--text-primary)',
                    border: 'none',
                    borderRadius: '4px',
                    cursor: 'pointer',
                    textAlign: 'left',
                    fontSize: '13px'
                  }}
                >
                  All ({allEndpoints.length})
                </button>
                {tags.map(tag => (
                  <button
                    key={tag}
                    onClick={() => setSelectedTag(tag)}
                    style={{
                      padding: '8px 12px',
                      background: selectedTag === tag ? 'var(--accent-color)' : 'transparent',
                      color: selectedTag === tag ? 'white' : 'var(--text-primary)',
                      border: 'none',
                      borderRadius: '4px',
                      cursor: 'pointer',
                      textAlign: 'left',
                      fontSize: '13px'
                    }}
                  >
                    {tag} ({allEndpoints.filter(e => e.tags?.includes(tag)).length})
                  </button>
                ))}
              </div>
            </div>
          </div>

          <div style={{ flex: 1, overflow: 'auto', padding: '16px' }}>
            <div style={{ marginBottom: '16px' }}>
              <h2 style={{ margin: '0 0 8px 0', fontSize: '18px', color: 'var(--text-primary)' }}>
                {apiData.info?.title || 'API Documentation'}
              </h2>
              <p style={{ margin: '0', fontSize: '13px', color: 'var(--text-secondary)' }}>
                {apiData.info?.description || 'No description available'}
              </p>
              <div style={{ marginTop: '8px', fontSize: '12px', color: 'var(--text-secondary)' }}>
                Version: {apiData.info?.version || 'N/A'}
              </div>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {filteredEndpoints.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '40px', color: 'var(--text-secondary)' }}>
                  No endpoints found
                </div>
              ) : (
                filteredEndpoints.map((endpoint, index) => {
                  const key = `${endpoint.method}-${endpoint.path}`
                  const isExpanded = expandedEndpoints.has(key)

                  return (
                    <div
                      key={index}
                      style={{
                        background: 'var(--bg-primary)',
                        border: '1px solid var(--border-color)',
                        borderRadius: '8px',
                        overflow: 'hidden'
                      }}
                    >
                      <div
                        onClick={() => toggleEndpoint(key)}
                        style={{
                          padding: '12px 16px',
                          cursor: 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '12px',
                          background: isExpanded ? 'var(--bg-tertiary)' : 'transparent'
                        }}
                      >
                        <span style={{
                          padding: '4px 8px',
                          background: getMethodColor(endpoint.method),
                          color: 'white',
                          borderRadius: '4px',
                          fontSize: '11px',
                          fontWeight: 'bold',
                          minWidth: '50px',
                          textAlign: 'center'
                        }}>
                          {endpoint.method}
                        </span>
                        <span style={{
                          flex: 1,
                          fontFamily: 'monospace',
                          fontSize: '13px',
                          color: 'var(--text-primary)'
                        }}>
                          {endpoint.path}
                        </span>
                        <span style={{
                          color: 'var(--text-secondary)',
                          fontSize: '16px',
                          transform: isExpanded ? 'rotate(90deg)' : 'none',
                          transition: 'transform 0.2s'
                        }}>
                          ›
                        </span>
                      </div>

                      {isExpanded && (
                        <div style={{ padding: '16px', borderTop: '1px solid var(--border-color)' }}>
                          {endpoint.summary && (
                            <div style={{ marginBottom: '12px' }}>
                              <div style={{ fontSize: '11px', color: 'var(--text-secondary)', marginBottom: '4px', fontWeight: '500' }}>
                                SUMMARY
                              </div>
                              <div style={{ fontSize: '13px', color: 'var(--text-primary)' }}>
                                {endpoint.summary}
                              </div>
                            </div>
                          )}

                          {endpoint.description && (
                            <div style={{ marginBottom: '12px' }}>
                              <div style={{ fontSize: '11px', color: 'var(--text-secondary)', marginBottom: '4px', fontWeight: '500' }}>
                                DESCRIPTION
                              </div>
                              <div style={{ fontSize: '13px', color: 'var(--text-primary)' }}>
                                {endpoint.description}
                              </div>
                            </div>
                          )}

                          {endpoint.parameters && endpoint.parameters.length > 0 && (
                            <div style={{ marginBottom: '12px' }}>
                              <div style={{ fontSize: '11px', color: 'var(--text-secondary)', marginBottom: '8px', fontWeight: '500' }}>
                                PARAMETERS
                              </div>
                              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                                {endpoint.parameters.map((param, i) => (
                                  <div key={i} style={{
                                    padding: '8px 12px',
                                    background: 'var(--bg-secondary)',
                                    borderRadius: '4px',
                                    fontSize: '13px'
                                  }}>
                                    <div style={{ display: 'flex', gap: '8px', marginBottom: '4px' }}>
                                      <code style={{ color: 'var(--accent-color)' }}>{param.name}</code>
                                      <span style={{
                                        padding: '2px 6px',
                                        background: 'var(--bg-tertiary)',
                                        borderRadius: '3px',
                                        fontSize: '10px',
                                        color: 'var(--text-secondary)'
                                      }}>
                                        {param.in}
                                      </span>
                                      {param.required && (
                                        <span style={{
                                          padding: '2px 6px',
                                          background: '#ff4757',
                                          borderRadius: '3px',
                                          fontSize: '10px',
                                          color: 'white'
                                        }}>
                                          required
                                        </span>
                                      )}
                                    </div>
                                    {param.description && (
                                      <div style={{ color: 'var(--text-secondary)', fontSize: '12px' }}>
                                        {param.description}
                                      </div>
                                    )}
                                    {param.schema?.type && (
                                      <div style={{ color: 'var(--text-secondary)', fontSize: '12px', marginTop: '4px' }}>
                                        Type: <code>{param.schema.type}</code>
                                      </div>
                                    )}
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}

                          {endpoint.responses && (
                            <div>
                              <div style={{ fontSize: '11px', color: 'var(--text-secondary)', marginBottom: '8px', fontWeight: '500' }}>
                                RESPONSES
                              </div>
                              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                                {Object.entries(endpoint.responses).map(([code, response]: [string, any]) => (
                                  <div key={code} style={{
                                    padding: '8px 12px',
                                    background: 'var(--bg-secondary)',
                                    borderRadius: '4px',
                                    fontSize: '13px'
                                  }}>
                                    <code style={{
                                      color: code.startsWith('2') ? '#00d084' : '#ff4757',
                                      fontWeight: 'bold'
                                    }}>
                                      {code}
                                    </code>
                                    <span style={{ marginLeft: '8px', color: 'var(--text-primary)' }}>
                                      {response.description}
                                    </span>
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  )
                })
              )}
            </div>
          </div>
        </div>
      )}

      {!apiData && !loading && !error && (
        <div style={{
          flex: 1,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: 'var(--text-secondary)',
          fontSize: '14px'
        }}>
          <div style={{ textAlign: 'center' }}>
            <div style={{ marginBottom: '12px' }}>Enter an OpenAPI/Swagger URL to view API documentation</div>
            <button
              onClick={loadSampleApi}
              style={{
                padding: '8px 16px',
                background: 'var(--accent-color)',
                color: 'white',
                border: 'none',
                borderRadius: '6px',
                cursor: 'pointer',
                fontSize: '13px'
              }}
            >
              Try with Sample API
            </button>
          </div>
        </div>
      )}
    </div>
  )
})
