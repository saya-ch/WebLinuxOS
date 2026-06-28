import { useState, useEffect, useCallback, useRef, memo } from 'react'

interface APIEndpoint {
  id: string
  name: string
  url: string
  method: 'GET' | 'POST' | 'PUT' | 'DELETE'
  status: 'healthy' | 'degraded' | 'down' | 'unknown'
  latency: number
  lastCheck: Date
  uptime: number
  responseCode: number | null
  enabled: boolean
  category: string
}

interface CheckHistory {
  timestamp: Date
  status: 'healthy' | 'degraded' | 'down' | 'unknown'
  latency: number
}

const DEFAULT_ENDPOINTS: APIEndpoint[] = [
  { id: '1', name: 'GitHub API', url: 'https://api.github.com', method: 'GET', status: 'unknown', latency: 0, lastCheck: new Date(), uptime: 100, responseCode: null, enabled: true, category: '开发工具' },
  { id: '2', name: 'Open-Meteo 天气', url: 'https://api.open-meteo.com/v1/forecast?latitude=39.9&longitude=116.4&current_weather=true', method: 'GET', status: 'unknown', latency: 0, lastCheck: new Date(), uptime: 100, responseCode: null, enabled: true, category: '天气服务' },
  { id: '3', name: 'ipapi.co 地理位置API', url: 'https://ipapi.co/json/', method: 'GET', status: 'unknown', latency: 0, lastCheck: new Date(), uptime: 100, responseCode: null, enabled: true, category: '网络工具' },
  { id: '4', name: 'CoinGecko API', url: 'https://api.coingecko.com/api/v3/ping', method: 'GET', status: 'unknown', latency: 0, lastCheck: new Date(), uptime: 100, responseCode: null, enabled: true, category: '加密货币' },
  { id: '5', name: 'Hacker News API', url: 'https://hacker-news.firebaseio.com/v0/topstories.json', method: 'GET', status: 'unknown', latency: 0, lastCheck: new Date(), uptime: 100, responseCode: null, enabled: true, category: '科技新闻' },
  { id: '6', name: 'Wikipedia API', url: 'https://en.wikipedia.org/api/rest_v1/', method: 'GET', status: 'unknown', latency: 0, lastCheck: new Date(), uptime: 100, responseCode: null, enabled: true, category: '知识库' },
]

const APIHealthMonitor = memo(function APIHealthMonitor() {
  const [endpoints, setEndpoints] = useState<APIEndpoint[]>(DEFAULT_ENDPOINTS)
  const [histories, setHistories] = useState<Record<string, CheckHistory[]>>({})
  const [checking, setChecking] = useState(false)
  const [autoCheckEnabled, setAutoCheckEnabled] = useState(true)
  const [checkInterval, setCheckInterval] = useState(60) // seconds
  const [selectedEndpoint, setSelectedEndpoint] = useState<APIEndpoint | null>(null)
  const [filterCategory, setFilterCategory] = useState<string>('all')
  const [stats, setStats] = useState({ healthy: 0, degraded: 0, down: 0, avgLatency: 0 })
  const canvasRef = useRef<HTMLCanvasElement>(null)

  // 检查单个 API
  const checkEndpoint = useCallback(async (endpoint: APIEndpoint): Promise<APIEndpoint> => {
    const startTime = Date.now()
    
    try {
      const response = await fetch(endpoint.url, {
        method: endpoint.method,
        mode: 'cors',
        cache: 'no-cache',
      })
      
      const latency = Date.now() - startTime
      
      let status: 'healthy' | 'degraded' | 'down'
      if (response.ok && latency < 500) {
        status = 'healthy'
      } else if (response.ok || response.status < 500) {
        status = 'degraded'
      } else {
        status = 'down'
      }
      
      return {
        ...endpoint,
        status,
        latency,
        lastCheck: new Date(),
        responseCode: response.status,
        uptime: status === 'healthy' ? endpoint.uptime : Math.max(0, endpoint.uptime - 1)
      }
    } catch {
      return {
        ...endpoint,
        status: 'down',
        latency: Date.now() - startTime,
        lastCheck: new Date(),
        responseCode: null,
        uptime: Math.max(0, endpoint.uptime - 5)
      }
    }
  }, [])

  // 检查所有 API
  const checkAllEndpoints = useCallback(async () => {
    setChecking(true)
    
    const results = await Promise.all(
      endpoints
        .filter(e => e.enabled)
        .map(checkEndpoint)
    )
    
    const newEndpoints = endpoints.map(e => {
      const result = results.find(r => r.id === e.id)
      return result || e
    })
    
    setEndpoints(newEndpoints)
    
    // 更新历史记录
    const newHistories: Record<string, CheckHistory[]> = {}
    newEndpoints.forEach(e => {
      const prevHistory = histories[e.id] || []
      newHistories[e.id] = [...prevHistory.slice(-59), {
        timestamp: e.lastCheck,
        status: e.status,
        latency: e.latency
      }]
    })
    setHistories(newHistories)
    
    // 计算统计数据
    const healthy = newEndpoints.filter(e => e.status === 'healthy').length
    const degraded = newEndpoints.filter(e => e.status === 'degraded').length
    const down = newEndpoints.filter(e => e.status === 'down').length
    const avgLatency = newEndpoints.reduce((acc, e) => acc + e.latency, 0) / newEndpoints.length
    
    setStats({ healthy, degraded, down, avgLatency })
    
    setChecking(false)
  }, [endpoints, histories, checkEndpoint])

  // 自动检查
  useEffect(() => {
    if (!autoCheckEnabled) return
    
    const interval = setInterval(checkAllEndpoints, checkInterval * 1000)
    return () => clearInterval(interval)
  }, [autoCheckEnabled, checkInterval, checkAllEndpoints])

  // 初始检查
  useEffect(() => {
    checkAllEndpoints()
  }, [])

  // 绘制图表
  useEffect(() => {
    if (!selectedEndpoint || !canvasRef.current) return
    
    const canvas = canvasRef.current
    const ctx = canvas.getContext('2d')
    if (!ctx) return
    
    const history = histories[selectedEndpoint.id] || []
    const width = canvas.width
    const height = canvas.height
    
    ctx.clearRect(0, 0, width, height)
    
    // 背景
    ctx.fillStyle = '#0d1117'
    ctx.fillRect(0, 0, width, height)
    
    if (history.length < 2) return
    
    // 绘制延迟曲线
    const maxLatency = Math.max(...history.map(h => h.latency), 1000)
    
    ctx.strokeStyle = '#58a6ff'
    ctx.lineWidth = 2
    ctx.beginPath()
    
    history.forEach((h, i) => {
      const x = (i / (history.length - 1)) * width
      const y = height - (h.latency / maxLatency) * height * 0.9
      
      if (i === 0) ctx.moveTo(x, y)
      else ctx.lineTo(x, y)
    })
    
    ctx.stroke()
    
    // 绘制状态点
    history.forEach((h, i) => {
      const x = (i / (history.length - 1)) * width
      const y = height - (h.latency / maxLatency) * height * 0.9
      
      ctx.beginPath()
      ctx.arc(x, y, 3, 0, Math.PI * 2)
      ctx.fillStyle = h.status === 'healthy' ? '#22c55e' : h.status === 'degraded' ? '#f59e0b' : '#ef4444'
      ctx.fill()
    })
    
    // Y轴标签
    ctx.fillStyle = '#8b949e'
    ctx.font = '11px system-ui'
    for (let i = 0; i <= 4; i++) {
      const value = Math.round(maxLatency * (1 - i / 4))
      ctx.fillText(`${value}ms`, 5, height * (i / 4) + 12)
    }
  }, [selectedEndpoint, histories])

  const getStatusColor = (status: string) => {
    if (status === 'healthy') return '#22c55e'
    if (status === 'degraded') return '#f59e0b'
    if (status === 'down') return '#ef4444'
    return '#8b949e'
  }

  const categories = ['all', ...Array.from(new Set(endpoints.map(e => e.category)))]

  const filteredEndpoints = filterCategory === 'all' 
    ? endpoints 
    : endpoints.filter(e => e.category === filterCategory)

  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      height: '100%',
      background: '#0d1117',
      color: '#c9d1d9',
      fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
      overflow: 'hidden'
    }}>
      {/* 顶部栏 */}
      <div style={{
        padding: '16px 20px',
        background: '#161b22',
        borderBottom: '1px solid #30363d',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <span style={{ fontSize: '28px' }}>🌐</span>
          <div>
            <h2 style={{ margin: 0, fontSize: '18px', fontWeight: 600 }}>API 健康监控中心</h2>
            <div style={{ fontSize: '12px', color: '#8b949e', marginTop: '4px' }}>
              实时监控公开 API 状态
            </div>
          </div>
        </div>
        
        <div style={{ display: 'flex', gap: '16px', alignItems: 'center' }}>
          {/* 统计概览 */}
          <div style={{ display: 'flex', gap: '12px' }}>
            <div style={{
              padding: '8px 16px',
              background: 'rgba(34,197,94,0.1)',
              borderRadius: '8px',
              display: 'flex',
              alignItems: 'center',
              gap: '8px'
            }}>
              <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#22c55e' }} />
              <span style={{ fontWeight: 600 }}>{stats.healthy}</span>
              <span style={{ fontSize: '12px', color: '#8b949e' }}>健康</span>
            </div>
            
            <div style={{
              padding: '8px 16px',
              background: 'rgba(245,158,11,0.1)',
              borderRadius: '8px',
              display: 'flex',
              alignItems: 'center',
              gap: '8px'
            }}>
              <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#f59e0b' }} />
              <span style={{ fontWeight: 600 }}>{stats.degraded}</span>
              <span style={{ fontSize: '12px', color: '#8b949e' }}>降级</span>
            </div>
            
            <div style={{
              padding: '8px 16px',
              background: 'rgba(239,68,68,0.1)',
              borderRadius: '8px',
              display: 'flex',
              alignItems: 'center',
              gap: '8px'
            }}>
              <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#ef4444' }} />
              <span style={{ fontWeight: 600 }}>{stats.down}</span>
              <span style={{ fontSize: '12px', color: '#8b949e' }}>宕机</span>
            </div>
            
            <div style={{
              padding: '8px 16px',
              background: 'rgba(88,166,255,0.1)',
              borderRadius: '8px',
              display: 'flex',
              alignItems: 'center',
              gap: '8px'
            }}>
              <span style={{ fontSize: '12px', color: '#8b949e' }}>平均延迟</span>
              <span style={{ fontWeight: 600 }}>{Math.round(stats.avgLatency)}ms</span>
            </div>
          </div>
        </div>
      </div>

      {/* 控制栏 */}
      <div style={{
        padding: '10px 16px',
        background: '#21262d',
        borderBottom: '1px solid #30363d',
        display: 'flex',
        alignItems: 'center',
        gap: '12px',
        flexWrap: 'wrap'
      }}>
        <button
          onClick={checkAllEndpoints}
          disabled={checking}
          style={{
            padding: '8px 16px',
            background: checking ? '#21262d' : '#238636',
            border: 'none',
            borderRadius: '6px',
            color: '#fff',
            fontSize: '13px',
            fontWeight: 500,
            cursor: checking ? 'not-allowed' : 'pointer',
            opacity: checking ? 0.5 : 1
          }}
        >
          {checking ? '⏳ 检查中...' : '🔄 立即检查'}
        </button>
        
        <button
          onClick={() => setAutoCheckEnabled(!autoCheckEnabled)}
          style={{
            padding: '8px 16px',
            background: autoCheckEnabled ? '#238636' : '#21262d',
            border: '1px solid #30363d',
            borderRadius: '6px',
            color: '#c9d1d9',
            fontSize: '13px',
            cursor: 'pointer'
          }}
        >
          {autoCheckEnabled ? '✓ 自动监控' : '自动监控'}
        </button>
        
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span style={{ fontSize: '12px', color: '#8b949e' }}>检查间隔:</span>
          <select
            value={checkInterval}
            onChange={(e) => setCheckInterval(parseInt(e.target.value))}
            style={{
              padding: '6px 12px',
              background: '#21262d',
              border: '1px solid #30363d',
              borderRadius: '6px',
              color: '#c9d1d9',
              fontSize: '12px'
            }}
          >
            <option value={30}>30秒</option>
            <option value={60}>1分钟</option>
            <option value={120}>2分钟</option>
            <option value={300}>5分钟</option>
          </select>
        </div>
        
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span style={{ fontSize: '12px', color: '#8b949e' }}>分类:</span>
          <select
            value={filterCategory}
            onChange={(e) => setFilterCategory(e.target.value)}
            style={{
              padding: '6px 12px',
              background: '#21262d',
              border: '1px solid #30363d',
              borderRadius: '6px',
              color: '#c9d1d9',
              fontSize: '12px'
            }}
          >
            {categories.map(c => (
              <option key={c} value={c}>{c === 'all' ? '全部' : c}</option>
            ))}
          </select>
        </div>
      </div>

      {/* 主内容区 */}
      <div style={{
        flex: 1,
        display: 'flex',
        gap: '16px',
        padding: '16px',
        overflow: 'hidden'
      }}>
        {/* API 列表 */}
        <div style={{
          flex: 1,
          display: 'flex',
          flexDirection: 'column',
          background: '#161b22',
          borderRadius: '8px',
          border: '1px solid #30363d',
          overflow: 'hidden'
        }}>
          <div style={{
            padding: '12px 16px',
            borderBottom: '1px solid #30363d',
            fontSize: '14px',
            fontWeight: 600,
            color: '#f0f6fc'
          }}>
            监控的 API ({filteredEndpoints.length})
          </div>
          
          <div style={{ flex: 1, overflow: 'auto', padding: '8px' }}>
            {filteredEndpoints.map(endpoint => (
              <div
                key={endpoint.id}
                onClick={() => setSelectedEndpoint(endpoint)}
                style={{
                  padding: '12px',
                  background: selectedEndpoint?.id === endpoint.id ? '#21262d' : 'transparent',
                  borderRadius: '6px',
                  cursor: 'pointer',
                  marginBottom: '4px',
                  transition: 'background 0.2s',
                  border: `1px solid ${selectedEndpoint?.id === endpoint.id ? '#30363d' : 'transparent'}`
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <div style={{
                      width: '10px',
                      height: '10px',
                      borderRadius: '50%',
                      background: getStatusColor(endpoint.status),
                      boxShadow: `0 0 8px ${getStatusColor(endpoint.status)}`
                    }} />
                    <div>
                      <div style={{ fontWeight: 500, fontSize: '14px' }}>{endpoint.name}</div>
                      <div style={{ fontSize: '11px', color: '#8b949e', marginTop: '4px' }}>{endpoint.category}</div>
                    </div>
                  </div>
                  
                  <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                    <div style={{ textAlign: 'right' }}>
                      <div style={{ fontWeight: 600, fontSize: '13px', color: getStatusColor(endpoint.status) }}>
                        {endpoint.latency}ms
                      </div>
                      <div style={{ fontSize: '11px', color: '#8b949e' }}>
                        {endpoint.responseCode || 'N/A'}
                      </div>
                    </div>
                    
                    <div style={{
                      padding: '4px 8px',
                      borderRadius: '4px',
                      fontSize: '12px',
                      background: endpoint.uptime >= 95 ? 'rgba(34,197,94,0.1)' : endpoint.uptime >= 80 ? 'rgba(245,158,11,0.1)' : 'rgba(239,68,68,0.1)',
                      color: endpoint.uptime >= 95 ? '#22c55e' : endpoint.uptime >= 80 ? '#f59e0b' : '#ef4444'
                    }}>
                      {endpoint.uptime}% 可用
                    </div>
                  </div>
                </div>
                
                <div style={{
                  marginTop: '8px',
                  fontSize: '11px',
                  color: '#58a6ff',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  whiteSpace: 'nowrap'
                }}>
                  {endpoint.method} {endpoint.url}
                </div>
                
                <div style={{
                  marginTop: '8px',
                  fontSize: '11px',
                  color: '#8b949e'
                }}>
                  最后检查: {new Date(endpoint.lastCheck).toLocaleString('zh-CN', {
                    hour: '2-digit',
                    minute: '2-digit',
                    second: '2-digit'
                  })}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* 详情面板 */}
        {selectedEndpoint && (
          <div style={{
            width: '400px',
            display: 'flex',
            flexDirection: 'column',
            background: '#161b22',
            borderRadius: '8px',
            border: '1px solid #30363d',
            overflow: 'hidden'
          }}>
            <div style={{
              padding: '12px 16px',
              borderBottom: '1px solid #30363d',
              fontSize: '14px',
              fontWeight: 600,
              color: '#f0f6fc'
            }}>
              📊 {selectedEndpoint.name} 详情
            </div>
            
            <div style={{ padding: '16px', flex: 1, overflow: 'auto' }}>
              {/* 状态卡片 */}
              <div style={{
                padding: '16px',
                background: '#21262d',
                borderRadius: '8px',
                marginBottom: '16px'
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '12px' }}>
                  <div>
                    <div style={{ fontSize: '12px', color: '#8b949e', marginBottom: '4px' }}>当前状态</div>
                    <div style={{
                      fontSize: '18px',
                      fontWeight: 600,
                      color: getStatusColor(selectedEndpoint.status)
                    }}>
                      {selectedEndpoint.status === 'healthy' ? '健康' : 
                       selectedEndpoint.status === 'degraded' ? '降级' : '宕机'}
                    </div>
                  </div>
                  
                  <div>
                    <div style={{ fontSize: '12px', color: '#8b949e', marginBottom: '4px' }}>响应时间</div>
                    <div style={{
                      fontSize: '18px',
                      fontWeight: 600,
                      color: '#58a6ff'
                    }}>
                      {selectedEndpoint.latency}ms
                    </div>
                  </div>
                  
                  <div>
                    <div style={{ fontSize: '12px', color: '#8b949e', marginBottom: '4px' }}>可用率</div>
                    <div style={{
                      fontSize: '18px',
                      fontWeight: 600,
                      color: selectedEndpoint.uptime >= 95 ? '#22c55e' : '#f59e0b'
                    }}>
                      {selectedEndpoint.uptime}%
                    </div>
                  </div>
                </div>
                
                <div style={{ fontSize: '12px', color: '#8b949e' }}>
                  URL: {selectedEndpoint.url}
                </div>
              </div>
              
              {/* 延迟图表 */}
              <div style={{
                background: '#21262d',
                borderRadius: '8px',
                marginBottom: '16px',
                overflow: 'hidden'
              }}>
                <div style={{
                  padding: '12px',
                  borderBottom: '1px solid #30363d',
                  fontSize: '12px',
                  color: '#8b949e',
                  fontWeight: 500
                }}>
                  响应时间趋势 (最近60次检查)
                </div>
                <canvas
                  ref={canvasRef}
                  width={360}
                  height={120}
                  style={{ display: 'block' }}
                />
              </div>
              
              {/* 检查历史 */}
              <div style={{
                background: '#21262d',
                borderRadius: '8px',
                overflow: 'hidden'
              }}>
                <div style={{
                  padding: '12px',
                  borderBottom: '1px solid #30363d',
                  fontSize: '12px',
                  color: '#8b949e',
                  fontWeight: 500
                }}>
                  最近检查记录
                </div>
                
                <div style={{ padding: '8px' }}>
                  {(histories[selectedEndpoint.id] || []).slice(-10).reverse().map((h, i) => (
                    <div
                      key={i}
                      style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        padding: '8px',
                        fontSize: '12px',
                        borderBottom: i < 9 ? '1px solid #30363d' : 'none'
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <div style={{
                          width: '6px',
                          height: '6px',
                          borderRadius: '50%',
                          background: getStatusColor(h.status)
                        }} />
                        <span style={{ color: '#c9d1d9' }}>{h.latency}ms</span>
                      </div>
                      <span style={{ color: '#8b949e' }}>
                        {new Date(h.timestamp).toLocaleString('zh-CN', {
                          hour: '2-digit',
                          minute: '2-digit',
                          second: '2-digit'
                        })}
                      </span>
                    </div>
                  ))}
                  
                  {(histories[selectedEndpoint.id] || []).length === 0 && (
                    <div style={{
                      textAlign: 'center',
                      padding: '24px',
                      color: '#8b949e',
                      fontSize: '12px'
                    }}>
                      暂无检查记录
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
})

export default APIHealthMonitor