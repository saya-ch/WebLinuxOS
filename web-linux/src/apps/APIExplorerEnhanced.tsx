import { useState, useCallback, memo, useEffect } from 'react'
import { useStore } from '../store'

// API类型定义
interface APIConfig {
  id: string
  name: string
  description: string
  category: string
  endpoint: string
  method: 'GET' | 'POST'
  params?: Record<string, { type: string; required: boolean; default?: string; description: string }>
  headers?: Record<string, string>
  requiresAuth: boolean
}

// 公开API配置列表
const PUBLIC_APIS: APIConfig[] = [
  {
    id: 'weather',
    name: '天气查询',
    description: '获取指定城市的天气信息',
    category: '天气',
    endpoint: 'https://api.open-meteo.com/v1/forecast',
    method: 'GET',
    params: {
      latitude: { type: 'number', required: true, default: '39.9042', description: '纬度' },
      longitude: { type: 'number', required: true, default: '116.4074', description: '经度' },
      current_weather: { type: 'boolean', required: false, default: 'true', description: '当前天气' }
    },
    requiresAuth: false
  },
  {
    id: 'ip-lookup',
    name: 'IP地理位置',
    description: '查询IP地址的地理位置信息',
    category: '网络',
    endpoint: 'https://ipapi.co/json/',
    method: 'GET',
    requiresAuth: false
  },
  {
    id: 'random-user',
    name: '随机用户',
    description: '生成随机用户数据',
    category: '测试数据',
    endpoint: 'https://randomuser.me/api/',
    method: 'GET',
    params: {
      results: { type: 'number', required: false, default: '1', description: '结果数量' },
      nat: { type: 'string', required: false, default: 'us', description: '国家代码' }
    },
    requiresAuth: false
  },
  {
    id: 'jokes',
    name: '随机笑话',
    description: '获取随机编程笑话',
    category: '娱乐',
    endpoint: 'https://v2.jokeapi.dev/joke/Programming',
    method: 'GET',
    params: {
      type: { type: 'string', required: false, default: 'single', description: '笑话类型' },
      amount: { type: 'number', required: false, default: '1', description: '数量' }
    },
    requiresAuth: false
  },
  {
    id: 'quotes',
    name: '名言警句',
    description: '获取随机励志名言',
    category: '励志',
    endpoint: 'https://api.quotable.io/random',
    method: 'GET',
    requiresAuth: false
  },
  {
    id: 'exchange-rate',
    name: '汇率查询',
    description: '查询货币汇率',
    category: '金融',
    endpoint: 'https://api.frankfurter.app/latest',
    method: 'GET',
    params: {
      from: { type: 'string', required: false, default: 'USD', description: '源货币' },
      to: { type: 'string', required: false, default: 'CNY,EUR,JPY', description: '目标货币' }
    },
    requiresAuth: false
  },
  {
    id: 'hacker-news',
    name: 'Hacker News',
    description: '获取热门技术新闻',
    category: '新闻',
    endpoint: 'https://hn.algolia.com/api/v1/search',
    method: 'GET',
    params: {
      query: { type: 'string', required: false, default: '', description: '搜索关键词' },
      tags: { type: 'string', required: false, default: 'story', description: '类型' }
    },
    requiresAuth: false
  },
  {
    id: 'cat-facts',
    name: '猫咪知识',
    description: '获取随机猫咪知识',
    category: '娱乐',
    endpoint: 'https://catfact.ninja/fact',
    method: 'GET',
    requiresAuth: false
  },
  {
    id: 'dog-images',
    name: '狗狗图片',
    description: '获取随机狗狗图片',
    category: '图片',
    endpoint: 'https://dog.ceo/api/breeds/image/random',
    method: 'GET',
    requiresAuth: false
  },
  {
    id: 'bored',
    name: '活动建议',
    description: '无聊时获取活动建议',
    category: '生活',
    endpoint: 'https://www.boredapi.com/api/activity',
    method: 'GET',
    params: {
      type: { type: 'string', required: false, default: '', description: '活动类型' }
    },
    requiresAuth: false
  }
]

// API Explorer - 探索和使用公开API
const APIExplorerEnhanced = memo(function APIExplorerEnhanced() {
  const [selectedAPI, setSelectedAPI] = useState<APIConfig | null>(null)
  const [paramValues, setParamValues] = useState<Record<string, string>>({})
  const [response, setResponse] = useState<string>('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string>('')
  const [history, setHistory] = useState<{ api: string; time: Date; success: boolean }[]>([])
  const [searchQuery, setSearchQuery] = useState('')
  const [categoryFilter, setCategoryFilter] = useState('all')
  
  const addNotification = useStore(s => s.addNotification)

  // 获取所有类别
  const categories = ['all', ...new Set(PUBLIC_APIS.map(api => api.category))]

  // 过滤API列表
  const filteredAPIs = PUBLIC_APIS.filter(api => {
    const matchesSearch = api.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          api.description.toLowerCase().includes(searchQuery.toLowerCase())
    const matchesCategory = categoryFilter === 'all' || api.category === categoryFilter
    return matchesSearch && matchesCategory
  })

  // 选择API时初始化参数
  useEffect(() => {
    if (selectedAPI?.params) {
      const defaults: Record<string, string> = {}
      Object.entries(selectedAPI.params).forEach(([key, config]) => {
        defaults[key] = config.default || ''
      })
      setParamValues(defaults)
    } else {
      setParamValues({})
    }
    setResponse('')
    setError('')
  }, [selectedAPI])

  // 调用API
  const callAPI = useCallback(async () => {
    if (!selectedAPI) return

    setLoading(true)
    setError('')
    setResponse('')

    try {
      // 构建URL
      let url = selectedAPI.endpoint
      
      if (selectedAPI.method === 'GET' && selectedAPI.params) {
        const queryParams = new URLSearchParams()
        Object.entries(paramValues).forEach(([key, value]) => {
          if (value) queryParams.append(key, value)
        })
        const queryString = queryParams.toString()
        if (queryString) url += `?${queryString}`
      }

      // 发送请求
      const options: RequestInit = {
        method: selectedAPI.method,
        headers: {
          'Accept': 'application/json',
          ...selectedAPI.headers
        }
      }

      if (selectedAPI.method === 'POST' && selectedAPI.params) {
        options.body = JSON.stringify(paramValues)
        options.headers = {
          ...options.headers,
          'Content-Type': 'application/json'
        }
      }

      const res = await fetch(url, options)
      
      if (!res.ok) {
        throw new Error(`HTTP ${res.status}: ${res.statusText}`)
      }

      const data = await res.json()
      setResponse(JSON.stringify(data, null, 2))
      
      setHistory(prev => [...prev.slice(-9), { 
        api: selectedAPI.name, 
        time: new Date(), 
        success: true 
      }])
      
      addNotification({
        title: 'API调用成功',
        message: `${selectedAPI.name} 返回数据`,
        type: 'success',
        duration: 2000
      })
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : '未知错误'
      setError(errorMsg)
      setHistory(prev => [...prev.slice(-9), { 
        api: selectedAPI.name, 
        time: new Date(), 
        success: false 
      }])
      
      addNotification({
        title: 'API调用失败',
        message: errorMsg,
        type: 'error',
        duration: 3000
      })
    } finally {
      setLoading(false)
    }
  }, [selectedAPI, paramValues, addNotification])

  // 复制响应
  const copyResponse = useCallback(async () => {
    if (response) {
      await navigator.clipboard.writeText(response)
      addNotification({ title: '已复制', message: '响应数据已复制', type: 'success', duration: 1500 })
    }
  }, [response, addNotification])

  // 样式定义 - 使用React.CSSProperties类型
  const containerStyle: React.CSSProperties = {
    height: '100%',
    display: 'flex',
    background: 'var(--window-bg)',
    color: 'var(--text-primary)',
    fontFamily: 'system-ui, -apple-system, sans-serif'
  }

  const sidebarStyle: React.CSSProperties = {
    width: '280px',
    borderRight: '1px solid var(--window-border)',
    display: 'flex',
    flexDirection: 'column',
    overflow: 'hidden'
  }

  const apiItemStyle = (selected: boolean): React.CSSProperties => ({
    padding: '12px 16px',
    background: selected ? 'var(--accent)' : 'transparent',
    color: selected ? '#fff' : 'var(--text-primary)',
    cursor: 'pointer',
    borderBottom: '1px solid var(--window-border)',
    transition: 'background 0.2s'
  })

  const inputStyle: React.CSSProperties = {
    width: '100%',
    padding: '8px 12px',
    background: 'var(--input-bg)',
    border: '1px solid var(--window-border)',
    borderRadius: '6px',
    color: 'var(--text-primary)',
    fontSize: '13px'
  }

  const buttonStyle: React.CSSProperties = {
    padding: '10px 20px',
    background: 'var(--accent)',
    color: '#fff',
    border: 'none',
    borderRadius: '8px',
    cursor: 'pointer',
    fontSize: '14px',
    fontWeight: 500,
    opacity: loading ? 0.6 : 1
  }

  return (
    <div style={containerStyle}>
      {/* 左侧API列表 */}
      <div style={sidebarStyle}>
        {/* 搜索和过滤 */}
        <div style={{ padding: '12px', borderBottom: '1px solid var(--window-border)' }}>
          <input
            type="text"
            placeholder="搜索API..."
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            style={inputStyle}
          />
          <div style={{ display: 'flex', gap: '4px', marginTop: '8px', flexWrap: 'wrap' }}>
            {categories.map(cat => (
              <button
                key={cat}
                style={{
                  padding: '4px 8px',
                  background: categoryFilter === cat ? 'var(--accent)' : 'var(--card-bg)',
                  color: categoryFilter === cat ? '#fff' : 'var(--text-secondary)',
                  border: 'none',
                  borderRadius: '4px',
                  cursor: 'pointer',
                  fontSize: '11px'
                }}
                onClick={() => setCategoryFilter(cat)}
              >
                {cat === 'all' ? '全部' : cat}
              </button>
            ))}
          </div>
        </div>

        {/* API列表 */}
        <div style={{ flex: 1, overflow: 'auto' }}>
          {filteredAPIs.map(api => (
            <div
              key={api.id}
              style={apiItemStyle(selectedAPI?.id === api.id)}
              onClick={() => setSelectedAPI(api)}
            >
              <div style={{ fontSize: '14px', fontWeight: 500 }}>{api.name}</div>
              <div style={{ fontSize: '12px', opacity: 0.7, marginTop: '4px' }}>{api.description}</div>
              <div style={{ fontSize: '11px', opacity: 0.5, marginTop: '4px' }}>
                {api.category} | {api.method}
              </div>
            </div>
          ))}
        </div>

        {/* 历史记录 */}
        {history.length > 0 && (
          <div style={{ padding: '12px', borderTop: '1px solid var(--window-border)', maxHeight: '150px', overflow: 'auto' }}>
            <div style={{ fontSize: '12px', color: 'var(--text-secondary)', marginBottom: '8px' }}>调用历史</div>
            {history.slice().reverse().map((h, i) => (
              <div key={i} style={{ fontSize: '11px', padding: '4px 0', color: h.success ? '#22c55e' : '#ef4444' }}>
                {h.api} - {h.time.toLocaleTimeString()}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* 右侧详情和结果 */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
        {selectedAPI ? (
          <>
            {/* API详情 */}
            <div style={{ padding: '16px', borderBottom: '1px solid var(--window-border)' }}>
              <div style={{ fontSize: '18px', fontWeight: 600, marginBottom: '8px' }}>{selectedAPI.name}</div>
              <div style={{ fontSize: '13px', color: 'var(--text-secondary)', marginBottom: '12px' }}>{selectedAPI.description}</div>
              
              <div style={{ padding: '12px', background: 'var(--card-bg)', borderRadius: '8px', fontSize: '12px' }}>
                <div style={{ marginBottom: '8px' }}>
                  <span style={{ color: 'var(--text-secondary)' }}>Endpoint: </span>
                  <span style={{ color: 'var(--accent)' }}>{selectedAPI.endpoint}</span>
                </div>
                <div>
                  <span style={{ color: 'var(--text-secondary)' }}>Method: </span>
                  <span style={{ color: selectedAPI.method === 'GET' ? '#22c55e' : '#f59e0b' }}>{selectedAPI.method}</span>
                </div>
              </div>

              {/* 参数输入 */}
              {selectedAPI.params && Object.keys(selectedAPI.params).length > 0 && (
                <div style={{ marginTop: '16px' }}>
                  <div style={{ fontSize: '14px', fontWeight: 500, marginBottom: '12px' }}>参数配置</div>
                  {Object.entries(selectedAPI.params).map(([key, config]) => (
                    <div key={key} style={{ marginBottom: '12px' }}>
                      <label style={{ fontSize: '12px', color: 'var(--text-secondary)', display: 'block', marginBottom: '4px' }}>
                        {key} {config.required && <span style={{ color: '#ef4444' }}>*</span>}
                        <span style={{ marginLeft: '8px', opacity: 0.6 }}>({config.description})</span>
                      </label>
                      <input
                        type={config.type === 'number' ? 'number' : 'text'}
                        value={paramValues[key] || ''}
                        onChange={e => setParamValues(prev => ({ ...prev, [key]: e.target.value }))}
                        placeholder={config.default || ''}
                        style={inputStyle}
                      />
                    </div>
                  ))}
                </div>
              )}

              {/* 调用按钮 */}
              <div style={{ marginTop: '16px', display: 'flex', gap: '8px' }}>
                <button style={buttonStyle} onClick={callAPI} disabled={loading}>
                  {loading ? '请求中...' : '调用API'}
                </button>
                {response && (
                  <button 
                    style={{ ...buttonStyle, background: 'var(--text-secondary)' }}
                    onClick={copyResponse}
                  >
                    复制结果
                  </button>
                )}
              </div>
            </div>

            {/* 响应结果 */}
            <div style={{ flex: 1, padding: '16px', overflow: 'auto' }}>
              {error && (
                <div style={{ padding: '16px', background: 'rgba(239, 68, 68, 0.1)', borderRadius: '8px', color: '#ef4444' }}>
                  <div style={{ fontWeight: 600, marginBottom: '8px' }}>错误</div>
                  <div style={{ fontSize: '13px' }}>{error}</div>
                </div>
              )}
              
              {response && (
                <div>
                  <div style={{ fontSize: '14px', fontWeight: 500, marginBottom: '12px' }}>响应结果</div>
                  <pre style={{
                    padding: '16px',
                    background: 'var(--card-bg)',
                    borderRadius: '8px',
                    fontSize: '12px',
                    overflow: 'auto',
                    whiteSpace: 'pre-wrap',
                    wordBreak: 'break-all',
                    maxHeight: '400px'
                  }}>
                    {response}
                  </pre>
                </div>
              )}

              {!response && !error && !loading && (
                <div style={{ textAlign: 'center', color: 'var(--text-secondary)', padding: '40px' }}>
                  <div style={{ fontSize: '48px', marginBottom: '16px' }}>📡</div>
                  <div style={{ fontSize: '14px' }}>点击"调用API"获取数据</div>
                </div>
              )}
            </div>
          </>
        ) : (
          <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-secondary)' }}>
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: '48px', marginBottom: '16px' }}>🔌</div>
              <div style={{ fontSize: '16px', marginBottom: '8px' }}>公开API探索器</div>
              <div style={{ fontSize: '13px' }}>从左侧选择一个API开始探索</div>
              <div style={{ fontSize: '12px', marginTop: '16px', opacity: 0.6 }}>
                共收录 {PUBLIC_APIS.length} 个免费公开API
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
})

export default APIExplorerEnhanced