import { useState, useMemo, memo } from 'react'

interface ApiEndpoint {
  method: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH'
  path: string
  description: string
  parameters?: { name: string; type: string; required: boolean; description: string }[]
  response?: string
  example?: string
}

interface ApiCategory {
  name: string
  icon: string
  description: string
  endpoints: ApiEndpoint[]
}

const apiDocumentation: ApiCategory[] = [
  {
    name: '天气 API',
    icon: '🌤️',
    description: 'Open-Meteo 天气数据接口',
    endpoints: [
      {
        method: 'GET',
        path: '/v1/forecast',
        description: '获取天气预报数据',
        parameters: [
          { name: 'latitude', type: 'number', required: true, description: '纬度' },
          { name: 'longitude', type: 'number', required: true, description: '经度' },
          { name: 'hourly', type: 'string', required: false, description: '小时数据字段' },
          { name: 'daily', type: 'string', required: false, description: '每日数据字段' },
          { name: 'timezone', type: 'string', required: false, description: '时区' },
        ],
        response: `{
  "latitude": 39.9042,
  "longitude": 116.4074,
  "timezone": "Asia/Shanghai",
  "hourly": {
    "temperature_2m": [12, 14, 16, ...],
    "weathercode": [0, 0, 1, ...]
  }
}`,
        example: 'https://api.open-meteo.com/v1/forecast?latitude=39.9042&longitude=116.4074&hourly=temperature_2m',
      },
      {
        method: 'GET',
        path: '/v1/geocoding/search',
        description: '地理位置搜索',
        parameters: [
          { name: 'name', type: 'string', required: true, description: '城市名称' },
          { name: 'count', type: 'number', required: false, description: '返回结果数量' },
          { name: 'language', type: 'string', required: false, description: '语言' },
        ],
        response: `{
  "results": [
    {
      "id": 1283240,
      "name": "Beijing",
      "latitude": 39.9042,
      "longitude": 116.4074
    }
  ]
}`,
      },
    ],
  },
  {
    name: 'IP 查询 API',
    icon: '🌐',
    description: 'ipapi.co IP地理位置服务',
    endpoints: [
      {
        method: 'GET',
        path: '/{ip_address}/json/',
        description: '获取IP地理位置信息',
        parameters: [
          { name: 'ip_address', type: 'string', required: false, description: 'IP地址，留空查询当前IP' },
        ],
        response: `{
  "ip": "8.8.8.8",
  "city": "Mountain View",
  "region": "California",
  "country": "US",
  "latitude": 37.4056,
  "longitude": -122.0775,
  "timezone": "America/Los_Angeles"
}`,
        example: 'https://ipapi.co/json/',
      },
    ],
  },
  {
    name: '货币转换 API',
    icon: '💱',
    description: 'ExchangeRate-API 货币汇率服务',
    endpoints: [
      {
        method: 'GET',
        path: '/v6/{api_key}/latest/{base_currency}',
        description: '获取货币汇率',
        parameters: [
          { name: 'api_key', type: 'string', required: true, description: 'API密钥' },
          { name: 'base_currency', type: 'string', required: true, description: '基准货币代码' },
        ],
        response: `{
  "result": "success",
  "base_code": "USD",
  "conversion_rates": {
    "CNY": 7.24,
    "EUR": 0.92,
    "JPY": 149.50
  }
}`,
      },
    ],
  },
  {
    name: '加密货币 API',
    icon: '₿',
    description: 'CoinGecko 加密货币数据',
    endpoints: [
      {
        method: 'GET',
        path: '/api/v3/coins/markets',
        description: '获取加密货币市场数据',
        parameters: [
          { name: 'vs_currency', type: 'string', required: true, description: '报价货币' },
          { name: 'ids', type: 'string', required: false, description: '加密货币ID' },
          { name: 'order', type: 'string', required: false, description: '排序方式' },
          { name: 'per_page', type: 'number', required: false, description: '每页数量' },
        ],
        response: `[
  {
    "id": "bitcoin",
    "symbol": "btc",
    "name": "Bitcoin",
    "current_price": 67500.00,
    "market_cap": 1320000000000,
    "price_change_percentage_24h": 2.5
  }
]`,
        example: 'https://api.coingecko.com/api/v3/coins/markets?vs_currency=usd&order=market_cap_desc',
      },
    ],
  },
  {
    name: 'GitHub API',
    icon: '🐙',
    description: 'GitHub 开发者API',
    endpoints: [
      {
        method: 'GET',
        path: '/repos/{owner}/{repo}',
        description: '获取仓库信息',
        parameters: [
          { name: 'owner', type: 'string', required: true, description: '仓库所有者' },
          { name: 'repo', type: 'string', required: true, description: '仓库名称' },
        ],
        response: `{
  "id": 449650424,
  "name": "WebLinuxOS",
  "full_name": "saya-ch/WebLinuxOS",
  "description": "Web Linux Desktop Environment",
  "stargazers_count": 1250,
  "forks_count": 180,
  "language": "TypeScript"
}`,
        example: 'https://api.github.com/repos/saya-ch/WebLinuxOS',
      },
      {
        method: 'GET',
        path: '/search/repositories',
        description: '搜索仓库',
        parameters: [
          { name: 'q', type: 'string', required: true, description: '搜索关键词' },
          { name: 'sort', type: 'string', required: false, description: '排序字段' },
          { name: 'order', type: 'string', required: false, description: '排序方向' },
          { name: 'per_page', type: 'number', required: false, description: '每页数量' },
        ],
        response: `{
  "total_count": 1250,
  "items": [
    {
      "full_name": "saya-ch/WebLinuxOS",
      "description": "...",
      "stargazers_count": 1250
    }
  ]
}`,
        example: 'https://api.github.com/search/repositories?q=web+os&sort=stars&order=desc',
      },
    ],
  },
]

const methodColors: Record<string, string> = {
  GET: '#61affe',
  POST: '#49cc90',
  PUT: '#fca130',
  DELETE: '#f93e3e',
  PATCH: '#50e3c2',
}

const ApiDocsViewer = memo(function ApiDocsViewer() {
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null)
  const [expandedEndpoint, setExpandedEndpoint] = useState<string | null>(null)
  const [searchQuery, setSearchQuery] = useState('')

  const filteredCategories = useMemo(() => {
    if (!searchQuery) return apiDocumentation
    const query = searchQuery.toLowerCase()
    return apiDocumentation
      .map(cat => ({
        ...cat,
        endpoints: cat.endpoints.filter(
          ep =>
            ep.path.toLowerCase().includes(query) ||
            ep.description.toLowerCase().includes(query)
        ),
      }))
      .filter(cat => cat.endpoints.length > 0)
  }, [searchQuery])

  const selectedEndpoint = useMemo(() => {
    if (!expandedEndpoint) return null
    for (const cat of apiDocumentation) {
      const endpoint = cat.endpoints.find(ep => `${cat.name}-${ep.path}` === expandedEndpoint)
      if (endpoint) return { ...endpoint, category: cat.name }
    }
    return null
  }, [expandedEndpoint])

  return (
    <div style={{ display: 'flex', height: '100%', overflow: 'hidden' }}>
      <div
        style={{
          width: '300px',
          borderRight: '1px solid var(--window-border)',
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden',
        }}
      >
        <div style={{ padding: '16px', borderBottom: '1px solid var(--window-border)' }}>
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="搜索API..."
            style={{
              width: '100%',
              padding: '8px 12px',
              border: '1px solid var(--window-border)',
              borderRadius: '6px',
              background: 'var(--bg-secondary)',
              color: 'var(--text-primary)',
              fontSize: '13px',
            }}
          />
        </div>
        <div style={{ flex: 1, overflow: 'auto', padding: '8px' }}>
          {filteredCategories.map((cat) => (
            <div key={cat.name} style={{ marginBottom: '16px' }}>
              <button
                onClick={() => setSelectedCategory(selectedCategory === cat.name ? null : cat.name)}
                style={{
                  width: '100%',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  padding: '10px 12px',
                  border: 'none',
                  borderRadius: '6px',
                  background: selectedCategory === cat.name ? 'var(--accent)' : 'transparent',
                  color: 'var(--text-primary)',
                  cursor: 'pointer',
                  fontSize: '14px',
                  fontWeight: 500,
                  textAlign: 'left',
                  transition: 'background 0.2s',
                }}
              >
                <span style={{ fontSize: '18px' }}>{cat.icon}</span>
                <span style={{ flex: 1 }}>{cat.name}</span>
                <span style={{ fontSize: '12px', opacity: 0.7 }}>
                  {cat.endpoints.length}
                </span>
              </button>
              {selectedCategory === cat.name && (
                <div style={{ marginTop: '8px', paddingLeft: '12px' }}>
                  {cat.endpoints.map((endpoint) => (
                    <button
                      key={endpoint.path}
                      onClick={() =>
                        setExpandedEndpoint(
                          expandedEndpoint === `${cat.name}-${endpoint.path}`
                            ? null
                            : `${cat.name}-${endpoint.path}`
                        )
                      }
                      style={{
                        width: '100%',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '8px',
                        padding: '8px 10px',
                        marginBottom: '4px',
                        border: 'none',
                        borderRadius: '4px',
                        background:
                          expandedEndpoint === `${cat.name}-${endpoint.path}`
                            ? 'var(--bg-secondary)'
                            : 'transparent',
                        color: 'var(--text-primary)',
                        cursor: 'pointer',
                        fontSize: '12px',
                        textAlign: 'left',
                      }}
                    >
                      <span
                        style={{
                          padding: '2px 6px',
                          borderRadius: '4px',
                          background: methodColors[endpoint.method],
                          color: '#fff',
                          fontSize: '10px',
                          fontWeight: 600,
                          minWidth: '50px',
                          textAlign: 'center',
                        }}
                      >
                        {endpoint.method}
                      </span>
                      <span
                        style={{
                          fontFamily: 'monospace',
                          fontSize: '11px',
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                          whiteSpace: 'nowrap',
                        }}
                      >
                        {endpoint.path}
                      </span>
                    </button>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      <div style={{ flex: 1, overflow: 'auto', padding: '24px' }}>
        {selectedEndpoint ? (
          <div>
            <div style={{ marginBottom: '24px' }}>
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '12px',
                  marginBottom: '12px',
                }}
              >
                <span
                  style={{
                    padding: '6px 12px',
                    borderRadius: '6px',
                    background: methodColors[selectedEndpoint.method],
                    color: '#fff',
                    fontSize: '14px',
                    fontWeight: 600,
                  }}
                >
                  {selectedEndpoint.method}
                </span>
                <code
                  style={{
                    fontSize: '16px',
                    fontFamily: 'monospace',
                    color: 'var(--text-primary)',
                  }}
                >
                  {selectedEndpoint.path}
                </code>
              </div>
              <h3 style={{ fontSize: '18px', marginBottom: '8px', color: 'var(--text-primary)' }}>
                {selectedEndpoint.description}
              </h3>
              <p style={{ fontSize: '14px', color: 'var(--text-secondary)' }}>
                分类: {selectedEndpoint.category}
              </p>
            </div>

            {selectedEndpoint.parameters && selectedEndpoint.parameters.length > 0 && (
              <div style={{ marginBottom: '24px' }}>
                <h4 style={{ fontSize: '16px', marginBottom: '12px', color: 'var(--text-primary)' }}>
                  参数
                </h4>
                <div
                  style={{
                    border: '1px solid var(--window-border)',
                    borderRadius: '8px',
                    overflow: 'hidden',
                  }}
                >
                  <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px' }}>
                    <thead>
                      <tr style={{ background: 'var(--bg-secondary)' }}>
                        <th style={{ padding: '10px 12px', textAlign: 'left', fontWeight: 600 }}>
                          名称
                        </th>
                        <th style={{ padding: '10px 12px', textAlign: 'left', fontWeight: 600 }}>
                          类型
                        </th>
                        <th style={{ padding: '10px 12px', textAlign: 'left', fontWeight: 600 }}>
                          必填
                        </th>
                        <th style={{ padding: '10px 12px', textAlign: 'left', fontWeight: 600 }}>
                          描述
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {selectedEndpoint.parameters.map((param, i) => (
                        <tr
                          key={param.name}
                          style={{
                            borderTop:
                              i > 0 ? '1px solid var(--window-border)' : 'none',
                          }}
                        >
                          <td style={{ padding: '10px 12px' }}>
                            <code style={{ color: 'var(--accent)' }}>{param.name}</code>
                          </td>
                          <td style={{ padding: '10px 12px', color: 'var(--text-secondary)' }}>
                            {param.type}
                          </td>
                          <td style={{ padding: '10px 12px' }}>
                            {param.required ? (
                              <span
                                style={{
                                  padding: '2px 8px',
                                  borderRadius: '4px',
                                  background: '#f93e3e',
                                  color: '#fff',
                                  fontSize: '11px',
                                }}
                              >
                                必填
                              </span>
                            ) : (
                              <span
                                style={{
                                  padding: '2px 8px',
                                  borderRadius: '4px',
                                  background: 'var(--bg-secondary)',
                                  color: 'var(--text-secondary)',
                                  fontSize: '11px',
                                }}
                              >
                                可选
                              </span>
                            )}
                          </td>
                          <td style={{ padding: '10px 12px', color: 'var(--text-secondary)' }}>
                            {param.description}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {selectedEndpoint.response && (
              <div style={{ marginBottom: '24px' }}>
                <h4 style={{ fontSize: '16px', marginBottom: '12px', color: 'var(--text-primary)' }}>
                  响应示例
                </h4>
                <pre
                  style={{
                    padding: '16px',
                    borderRadius: '8px',
                    background: 'var(--bg-secondary)',
                    border: '1px solid var(--window-border)',
                    fontSize: '12px',
                    fontFamily: 'monospace',
                    color: 'var(--text-primary)',
                    overflow: 'auto',
                    maxHeight: '300px',
                  }}
                >
                  {selectedEndpoint.response}
                </pre>
              </div>
            )}

            {selectedEndpoint.example && (
              <div>
                <h4 style={{ fontSize: '16px', marginBottom: '12px', color: 'var(--text-primary)' }}>
                  示例请求
                </h4>
                <pre
                  style={{
                    padding: '16px',
                    borderRadius: '8px',
                    background: 'var(--bg-secondary)',
                    border: '1px solid var(--window-border)',
                    fontSize: '12px',
                    fontFamily: 'monospace',
                    color: 'var(--accent)',
                    wordBreak: 'break-all',
                  }}
                >
                  {selectedEndpoint.example}
                </pre>
              </div>
            )}
          </div>
        ) : (
          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              height: '100%',
              color: 'var(--text-secondary)',
            }}
          >
            <div style={{ fontSize: '48px', marginBottom: '16px' }}>📚</div>
            <div style={{ fontSize: '16px', marginBottom: '8px' }}>选择左侧API查看详情</div>
            <div style={{ fontSize: '13px' }}>
              共 {apiDocumentation.length} 个分类，{apiDocumentation.reduce((acc, cat) => acc + cat.endpoints.length, 0)} 个接口
            </div>
          </div>
        )}
      </div>
    </div>
  )
})

export default ApiDocsViewer
