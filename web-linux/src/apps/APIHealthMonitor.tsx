import { useState, useEffect, useCallback, useRef } from 'react'

/**
 * API 健康监控
 *
 * 监控一组公共 API 端点的健康状况和响应时间，实时显示可用性。
 * 数据来源：直接探测各 API 的 HEAD/GET 端点。
 * 默认监控 16 个常用免费 API。
 */

interface Endpoint {
  id: string
  name: string
  url: string
  method: 'GET' | 'HEAD'
  category: string
}

interface ProbeResult {
  id: string
  status: 'up' | 'down' | 'timeout' | 'error'
  latency: number | null
  statusCode: number | null
  checkedAt: number
}

const ENDPOINTS: Endpoint[] = [
  { id: 'github', name: 'GitHub API', url: 'https://api.github.com', method: 'GET', category: '代码' },
  { id: 'coingecko', name: 'CoinGecko', url: 'https://api.coingecko.com/api/v3/ping', method: 'GET', category: '金融' },
  { id: 'exchangerate', name: 'ExchangeRate-API', url: 'https://api.exchangerate-api.com/v4/latest/USD', method: 'GET', category: '金融' },
  { id: 'openweather', name: 'Open-Meteo', url: 'https://api.open-meteo.com/v1/forecast?latitude=0&longitude=0&current_weather=true', method: 'GET', category: '天气' },
  { id: 'hackernews', name: 'Hacker News', url: 'https://hacker-news.firebaseio.com/v0/topstories.json', method: 'GET', category: '新闻' },
  { id: 'wikipedia', name: 'Wikipedia', url: 'https://en.wikipedia.org/api/rest_v1/page/summary/Linux', method: 'GET', category: '知识' },
  { id: 'quotable', name: 'Quotable', url: 'https://api.quotable.io/random', method: 'GET', category: '知识' },
  { id: 'joke', name: 'JokeAPI', url: 'https://v2.jokeapi.dev/joke/Any?safe-mode', method: 'GET', category: '娱乐' },
  { id: 'advice', name: 'Advice Slip', url: 'https://api.adviceslip.com/advice', method: 'GET', category: '娱乐' },
  { id: 'catfact', name: 'Cat Facts', url: 'https://catfact.ninja/fact', method: 'GET', category: '娱乐' },
  { id: 'dogceo', name: 'Dog CEO', url: 'https://dog.ceo/api/breeds/image/random', method: 'GET', category: '娱乐' },
  { id: 'ipapi', name: 'IP API', url: 'https://ipapi.co/json/', method: 'GET', category: '工具' },
  { id: 'randomuser', name: 'Random User', url: 'https://randomuser.me/api/', method: 'GET', category: '工具' },
  { id: 'mymemory', name: 'MyMemory Translate', url: 'https://api.mymemory.translated.net/get?q=hello&langpair=en|zh', method: 'GET', category: '工具' },
  { id: 'nasa', name: 'NASA APOD', url: 'https://api.nasa.gov/planetary/apod?api_key=DEMO_KEY', method: 'GET', category: '科学' },
  { id: 'spaceflight', name: 'Spaceflight News', url: 'https://api.spaceflightnewsapi.net/v3/articles?_limit=1', method: 'GET', category: '科学' },
]

const ApiHealthMonitor = () => {
  const [results, setResults] = useState<Record<string, ProbeResult>>({})
  const [probing, setProbing] = useState(false)
  const [autoRefresh, setAutoRefresh] = useState(false)
  const [filter, setFilter] = useState<string>('all')
  const timerRef = useRef<number | null>(null)

  const probeAll = useCallback(async () => {
    setProbing(true)
    const newResults: Record<string, ProbeResult> = {}
    await Promise.all(ENDPOINTS.map(async (ep) => {
      const start = performance.now()
      const controller = new AbortController()
      const timeoutId = setTimeout(() => controller.abort(), 8000)
      try {
        const res = await fetch(ep.url, { method: ep.method, signal: controller.signal })
        const latency = Math.round(performance.now() - start)
        newResults[ep.id] = {
          id: ep.id,
          status: res.ok ? 'up' : 'down',
          latency,
          statusCode: res.status,
          checkedAt: Date.now(),
        }
      } catch (e) {
        const isTimeout = e instanceof Error && e.name === 'AbortError'
        newResults[ep.id] = {
          id: ep.id,
          status: isTimeout ? 'timeout' : 'error',
          latency: isTimeout ? null : Math.round(performance.now() - start),
          statusCode: null,
          checkedAt: Date.now(),
        }
      } finally {
        clearTimeout(timeoutId)
      }
    }))
    setResults(newResults)
    setProbing(false)
  }, [])

  useEffect(() => {
    probeAll()
  }, [probeAll])

  useEffect(() => {
    if (autoRefresh) {
      timerRef.current = window.setInterval(probeAll, 30000)
    } else if (timerRef.current) {
      clearInterval(timerRef.current)
      timerRef.current = null
    }
    return () => {
      if (timerRef.current) clearInterval(timerRef.current)
    }
  }, [autoRefresh, probeAll])

  const categories = Array.from(new Set(ENDPOINTS.map(e => e.category)))
  const filtered = filter === 'all' ? ENDPOINTS : ENDPOINTS.filter(e => e.category === filter)

  const summary = {
    up: ENDPOINTS.filter(e => results[e.id]?.status === 'up').length,
    down: ENDPOINTS.filter(e => results[e.id]?.status === 'down').length,
    timeout: ENDPOINTS.filter(e => results[e.id]?.status === 'timeout').length,
    avgLatency: Math.round(
      ENDPOINTS
        .map(e => results[e.id]?.latency)
        .filter((l): l is number => typeof l === 'number')
        .reduce((a, b) => a + b, 0) /
      Math.max(1, ENDPOINTS.filter(e => typeof results[e.id]?.latency === 'number').length)
    ),
  }

  const statusColor = (status: ProbeResult['status']) => {
    switch (status) {
      case 'up': return '#10b981'
      case 'down': return '#ef4444'
      case 'timeout': return '#f59e0b'
      default: return '#6b7280'
    }
  }

  const statusText = (status: ProbeResult['status']) => {
    switch (status) {
      case 'up': return '正常'
      case 'down': return '异常'
      case 'timeout': return '超时'
      default: return '错误'
    }
  }

  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      height: '100%',
      background: 'var(--window-bg, #1a1a2e)',
      color: 'var(--text-primary, #e0e0e8)',
    }}>
      <div style={{ padding: 16, borderBottom: '1px solid var(--window-border, rgba(255,255,255,0.08))' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
          <h2 style={{ margin: 0, fontSize: 16, fontWeight: 600 }}>API 健康监控</h2>
          <div style={{ display: 'flex', gap: 8 }}>
            <label style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 12, color: 'var(--text-secondary, #888)' }}>
              <input
                type="checkbox"
                checked={autoRefresh}
                onChange={(e) => setAutoRefresh(e.target.checked)}
              />
              30秒自动刷新
            </label>
            <button
              onClick={probeAll}
              disabled={probing}
              style={{
                padding: '6px 12px',
                border: '1px solid var(--window-border, rgba(255,255,255,0.1))',
                background: 'var(--accent, #8b5cf6)',
                color: '#fff',
                borderRadius: 4,
                fontSize: 12,
                cursor: probing ? 'wait' : 'pointer',
                opacity: probing ? 0.6 : 1,
              }}
            >
              {probing ? '检测中…' : '立即检测'}
            </button>
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 8 }}>
          <SummaryCard label="在线" value={summary.up} color="#10b981" />
          <SummaryCard label="离线" value={summary.down} color="#ef4444" />
          <SummaryCard label="超时" value={summary.timeout} color="#f59e0b" />
          <SummaryCard label="平均延迟" value={`${summary.avgLatency}ms`} color="#0ea5e9" />
        </div>

        <div style={{ display: 'flex', gap: 4, marginTop: 12, flexWrap: 'wrap' }}>
          <CategoryBtn active={filter === 'all'} onClick={() => setFilter('all')} label={`全部 (${ENDPOINTS.length})`} />
          {categories.map(cat => (
            <CategoryBtn
              key={cat}
              active={filter === cat}
              onClick={() => setFilter(cat)}
              label={`${cat} (${ENDPOINTS.filter(e => e.category === cat).length})`}
            />
          ))}
        </div>
      </div>

      <div style={{ flex: 1, overflowY: 'auto', padding: 16 }}>
        {filtered.map(ep => {
          const r = results[ep.id]
          return (
            <div
              key={ep.id}
              style={{
                display: 'grid',
                gridTemplateColumns: '16px 1fr auto auto',
                gap: 12,
                alignItems: 'center',
                padding: 12,
                marginBottom: 6,
                borderRadius: 8,
                background: 'rgba(255,255,255,0.02)',
                border: '1px solid var(--window-border, rgba(255,255,255,0.06))',
              }}
            >
              <div
                style={{
                  width: 12,
                  height: 12,
                  borderRadius: '50%',
                  background: r ? statusColor(r.status) : '#6b7280',
                  boxShadow: r ? `0 0 8px ${statusColor(r.status)}80` : 'none',
                  transition: 'all 0.3s',
                }}
              />
              <div>
                <div style={{ fontSize: 13, fontWeight: 500 }}>{ep.name}</div>
                <div style={{ fontSize: 11, color: 'var(--text-secondary, #888)', fontFamily: 'monospace' }}>
                  {ep.method} {ep.url.slice(0, 60)}{ep.url.length > 60 ? '…' : ''}
                </div>
              </div>
              <div style={{ textAlign: 'right' }}>
                <div style={{ fontSize: 12, color: r ? statusColor(r.status) : 'var(--text-secondary, #888)', fontWeight: 600 }}>
                  {r ? statusText(r.status) : '检测中…'}
                </div>
                <div style={{ fontSize: 11, color: 'var(--text-secondary, #888)' }}>
                  {r?.latency !== null && r?.latency !== undefined ? `${r.latency}ms` : '-'}
                  {r?.statusCode ? ` · HTTP ${r.statusCode}` : ''}
                </div>
              </div>
              <span style={{
                fontSize: 10,
                padding: '2px 6px',
                borderRadius: 4,
                background: 'rgba(255,255,255,0.05)',
                color: 'var(--text-secondary, #888)',
              }}>{ep.category}</span>
            </div>
          )
        })}
      </div>

      {Object.keys(results).length > 0 && (
        <div style={{
          padding: '8px 16px',
          borderTop: '1px solid var(--window-border, rgba(255,255,255,0.08))',
          fontSize: 11,
          color: 'var(--text-secondary, #888)',
        }}>
          最后更新: {new Date(Math.max(...Object.values(results).map(r => r.checkedAt))).toLocaleTimeString('zh-CN')}
        </div>
      )}
    </div>
  )
}

const SummaryCard = ({ label, value, color }: { label: string; value: string | number; color: string }) => (
  <div style={{
    padding: 12,
    borderRadius: 8,
    background: `${color}10`,
    border: `1px solid ${color}40`,
  }}>
    <div style={{ fontSize: 11, color: 'var(--text-secondary, #888)' }}>{label}</div>
    <div style={{ fontSize: 20, fontWeight: 700, color, marginTop: 2 }}>{value}</div>
  </div>
)

const CategoryBtn = ({ active, onClick, label }: { active: boolean; onClick: () => void; label: string }) => (
  <button
    onClick={onClick}
    style={{
      padding: '4px 10px',
      border: '1px solid',
      borderColor: active ? 'var(--accent, #8b5cf6)' : 'var(--window-border, rgba(255,255,255,0.1))',
      background: active ? 'var(--accent-bg, rgba(139, 92, 246, 0.15))' : 'transparent',
      color: active ? 'var(--accent, #8b5cf6)' : 'var(--text-secondary, #888)',
      borderRadius: 4,
      fontSize: 11,
      cursor: 'pointer',
    }}
  >{label}</button>
)

export default ApiHealthMonitor
