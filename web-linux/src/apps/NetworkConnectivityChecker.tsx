import { useState, useCallback } from 'react'
import {
  Globe, CheckCircle, XCircle, Clock,
  RefreshCw, Zap, Search,
} from 'lucide-react'

/* ================================================================
   Types
   ================================================================ */

interface ServiceCheck {
  id: string
  name: string
  url: string
  category: 'cdn' | 'api' | 'social' | 'dev' | 'dns'
  icon: string
  status: 'pending' | 'checking' | 'online' | 'offline' | 'slow'
  latency: number | null
  lastCheck: number | null
  httpStatus: number | null
  error?: string
}

interface CheckResult {
  online: boolean
  latency: number
  httpStatus: number
  error?: string
}

/* ================================================================
   Services Configuration
   ================================================================ */

const SERVICES: Omit<ServiceCheck, 'status' | 'latency' | 'lastCheck' | 'httpStatus' | 'error'>[] = [
  // CDN
  { id: 'google-cdn', name: 'Google CDN', url: 'https://www.google.com/favicon.ico', category: 'cdn', icon: '🌐' },
  { id: 'cloudflare', name: 'Cloudflare', url: 'https://cdnjs.cloudflare.com/ajax/libs/jquery/3.7.1/jquery.min.js', category: 'cdn', icon: '☁️' },
  { id: 'jsdelivr', name: 'jsDelivr', url: 'https://cdn.jsdelivr.net/npm/react@19.2.6/umd/react.production.min.js', category: 'cdn', icon: '📦' },
  { id: 'unpkg', name: 'unpkg', url: 'https://unpkg.com/react@19.2.6/umd/react.production.min.js', category: 'cdn', icon: '📤' },

  // APIs
  { id: 'github-api', name: 'GitHub API', url: 'https://api.github.com/', category: 'api', icon: '🐙' },
  { id: 'httpbin', name: 'HTTPBin', url: 'https://httpbin.org/get', category: 'api', icon: '🔍' },
  { id: 'open-meteo', name: 'Open-Meteo Weather', url: 'https://api.open-meteo.com/v1/forecast?latitude=39.9&longitude=116.4&current_weather=true', category: 'api', icon: '🌤️' },
  { id: 'jsonplaceholder', name: 'JSONPlaceholder', url: 'https://jsonplaceholder.typicode.com/posts/1', category: 'api', icon: '📋' },

  // Social / Services
  { id: 'github', name: 'GitHub', url: 'https://github.com/favicon.ico', category: 'social', icon: '💻' },
  { id: 'wikipedia', name: 'Wikipedia', url: 'https://en.wikipedia.org/wiki/Main_Page', category: 'social', icon: '📚' },
  { id: 'hackernews', name: 'Hacker News', url: 'https://news.ycombinator.com/', category: 'social', icon: '📰' },

  // Developer Tools
  { id: 'npm', name: 'npm Registry', url: 'https://registry.npmjs.org/react/latest', category: 'dev', icon: '📝' },
  { id: 'pypi', name: 'PyPI', url: 'https://pypi.org/pypi/requests/json', category: 'dev', icon: '🐍' },
  { id: 'stackoverflow', name: 'Stack Overflow', url: 'https://stackoverflow.com/', category: 'dev', icon: '💡' },

  // DNS
  { id: 'cloudflare-dns', name: 'Cloudflare DNS', url: 'https://1.1.1.1/dns-query?name=example.com&type=A', category: 'dns', icon: '🔗' },
  { id: 'google-dns', name: 'Google DNS', url: 'https://dns.google/resolve?name=example.com&type=A', category: 'dns', icon: '🔌' },
]

const CATEGORY_LABELS: Record<string, { label: string; color: string }> = {
  cdn: { label: 'CDN', color: '#60a5fa' },
  api: { label: 'API', color: '#34d399' },
  social: { label: 'Social', color: '#facc15' },
  dev: { label: 'Developer', color: '#c084fc' },
  dns: { label: 'DNS', color: '#f97316' },
}

/* ================================================================
   Check Function
   ================================================================ */

async function checkService(url: string): Promise<CheckResult> {
  const start = performance.now()
  try {
    const controller = new AbortController()
    const timeout = setTimeout(() => controller.abort(), 10000)

    const response = await fetch(url, {
      mode: 'no-cors',
      cache: 'no-store',
      signal: controller.signal,
    })

    clearTimeout(timeout)
    const latency = performance.now() - start

    return {
      online: true,
      latency: Math.round(latency),
      httpStatus: response.status || 0, // 0 for opaque responses
      error: undefined,
    }
  } catch (err) {
    const latency = performance.now() - start
    const error = err instanceof Error ? err.message : 'Unknown error'

    // AbortError means timeout
    if (error.includes('abort') || error.includes('AbortError')) {
      return { online: false, latency: Math.round(latency), httpStatus: 0, error: 'Timeout (10s)' }
    }

    // Network error could still mean the server is reachable (CORS)
    return { online: false, latency: Math.round(latency), httpStatus: 0, error: error.slice(0, 60) }
  }
}

/* ================================================================
   Main Component
   ================================================================ */

export default function NetworkConnectivityChecker() {
  const [services, setServices] = useState<ServiceCheck[]>(
    SERVICES.map(s => ({ ...s, status: 'pending' as const, latency: null, lastCheck: null, httpStatus: null }))
  )
  const [checking, setChecking] = useState(false)
  const [filter, setFilter] = useState<string>('all')
  const [searchQuery, setSearchQuery] = useState('')

  const updateService = useCallback((id: string, updates: Partial<ServiceCheck>) => {
    setServices(prev => prev.map(s => s.id === id ? { ...s, ...updates } : s))
  }, [])

  const checkOne = useCallback(async (id: string) => {
    const svc = services.find(s => s.id === id)
    if (!svc) return

    updateService(id, { status: 'checking' })
    const result = await checkService(svc.url)
    updateService(id, {
      status: result.online ? (result.latency > 2000 ? 'slow' : 'online') : 'offline',
      latency: result.latency,
      lastCheck: Date.now(),
      httpStatus: result.httpStatus,
      error: result.error,
    })
  }, [services, updateService])

  const checkAll = useCallback(async () => {
    setChecking(true)
    const promises = services.map(async (svc) => {
      updateService(svc.id, { status: 'checking' })
      const result = await checkService(svc.url)
      updateService(svc.id, {
        status: result.online ? (result.latency > 2000 ? 'slow' : 'online') : 'offline',
        latency: result.latency,
        lastCheck: Date.now(),
        httpStatus: result.httpStatus,
        error: result.error,
      })
    })
    await Promise.all(promises)
    setChecking(false)
  }, [services, updateService])

  const filteredServices = services.filter(s => {
    if (filter !== 'all' && s.category !== filter) return false
    if (searchQuery && !s.name.toLowerCase().includes(searchQuery.toLowerCase())) return false
    return true
  })

  const onlineCount = services.filter(s => s.status === 'online' || s.status === 'slow').length
  const offlineCount = services.filter(s => s.status === 'offline').length
  const avgLatency = services
    .filter(s => s.latency !== null && s.status !== 'offline')
    .reduce((sum, s, _, arr) => sum + (s.latency || 0) / arr.length, 0)

  const statusIcon = (status: ServiceCheck['status']) => {
    switch (status) {
      case 'pending': return <Clock size={14} style={{ color: '#888' }} />
      case 'checking': return <RefreshCw size={14} style={{ color: '#60a5fa', animation: 'spin 1s linear infinite' }} />
      case 'online': return <CheckCircle size={14} style={{ color: '#22c55e' }} />
      case 'slow': return <Zap size={14} style={{ color: '#eab308' }} />
      case 'offline': return <XCircle size={14} style={{ color: '#ef4444' }} />
    }
  }

  return (
    <div style={{ height: '100%', display: 'flex', flexDirection: 'column', background: 'var(--bg-primary, #0f0f0f)', color: 'var(--text-primary, #e5e5e5)', fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif' }}>
      <style>{`@keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }`}</style>

      {/* Header */}
      <div style={{
        padding: '12px 20px',
        borderBottom: '1px solid var(--border-color, rgba(255,255,255,0.08))',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        background: 'var(--bg-secondary, rgba(255,255,255,0.03))',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <Globe size={18} style={{ color: '#60a5fa' }} />
          <span style={{ fontSize: 15, fontWeight: 600 }}>Network Connectivity Checker</span>
        </div>
        <button onClick={checkAll} disabled={checking} style={{
          background: checking ? 'rgba(96,165,250,0.08)' : 'rgba(96,165,250,0.15)',
          border: 'none', borderRadius: 6, padding: '6px 14px',
          cursor: checking ? 'wait' : 'pointer',
          display: 'flex', alignItems: 'center', gap: 6,
          color: '#60a5fa', fontSize: 12, fontWeight: 600,
        }}>
          <RefreshCw size={13} className={checking ? 'spinning' : ''} />
          {checking ? 'Checking...' : 'Check All Services'}
        </button>
      </div>

      {/* Stats Bar */}
      <div style={{
        padding: '10px 20px',
        borderBottom: '1px solid var(--border-color, rgba(255,255,255,0.08))',
        display: 'flex', gap: 24, alignItems: 'center',
        fontSize: 12,
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <CheckCircle size={13} style={{ color: '#22c55e' }} />
          <span><strong>{onlineCount}</strong> online</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <XCircle size={13} style={{ color: '#ef4444' }} />
          <span><strong>{offlineCount}</strong> offline</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <Zap size={13} style={{ color: '#facc15' }} />
          <span>Avg: <strong>{avgLatency > 0 ? Math.round(avgLatency) : '-'}</strong> ms</span>
        </div>
        <div style={{ flex: 1 }} />
        {/* Search */}
        <div style={{
          display: 'flex', alignItems: 'center', gap: 6,
          background: 'rgba(255,255,255,0.05)', borderRadius: 6,
          padding: '4px 10px', border: '1px solid rgba(255,255,255,0.08)',
        }}>
          <Search size={13} style={{ color: '#888' }} />
          <input
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            placeholder="Filter services..."
            style={{
              background: 'none', border: 'none', outline: 'none',
              color: 'var(--text-primary, #e5e5e5)', fontSize: 12, width: 140,
            }}
          />
        </div>
      </div>

      {/* Category Filter */}
      <div style={{
        padding: '8px 20px',
        borderBottom: '1px solid var(--border-color, rgba(255,255,255,0.08))',
        display: 'flex', gap: 6, flexWrap: 'wrap',
      }}>
        {[{ id: 'all', label: 'All', color: '#94a3b8' }, ...Object.entries(CATEGORY_LABELS).map(([id, { label, color }]) => ({ id, label, color }))].map(cat => (
          <button key={cat.id} onClick={() => setFilter(cat.id)} style={{
            background: filter === cat.id ? cat.color + '22' : 'rgba(255,255,255,0.03)',
            border: `1px solid ${filter === cat.id ? cat.color + '44' : 'rgba(255,255,255,0.08)'}`,
            borderRadius: 6, padding: '4px 12px', cursor: 'pointer',
            color: filter === cat.id ? cat.color : 'var(--text-secondary, #888)',
            fontSize: 12, fontWeight: filter === cat.id ? 600 : 400,
            transition: 'all 0.2s',
          }}>
            {cat.label}
          </button>
        ))}
      </div>

      {/* Service List */}
      <div style={{ flex: 1, overflow: 'auto', padding: '12px 20px' }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(340px, 1fr))', gap: 10 }}>
          {filteredServices.map(svc => (
            <div key={svc.id} style={{
              background: 'var(--bg-secondary, rgba(255,255,255,0.05))',
              borderRadius: 8, padding: '12px 14px',
              border: `1px solid ${
                svc.status === 'online' ? '#22c55e22' :
                svc.status === 'slow' ? '#eab30822' :
                svc.status === 'offline' ? '#ef444422' :
                'var(--border-color, rgba(255,255,255,0.08))'
              }`,
              transition: 'all 0.3s',
            }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <span style={{ fontSize: 16 }}>{svc.icon}</span>
                  <span style={{ fontSize: 13, fontWeight: 600 }}>{svc.name}</span>
                  {statusIcon(svc.status)}
                </div>
                <button onClick={() => checkOne(svc.id)} style={{
                  background: 'rgba(255,255,255,0.05)', border: 'none', borderRadius: 4,
                  padding: '4px 8px', cursor: 'pointer', color: 'var(--text-secondary, #888)', fontSize: 11,
                }}>
                  <RefreshCw size={11} />
                </button>
              </div>

              <div style={{ display: 'flex', gap: 16, fontSize: 11, color: 'var(--text-secondary, #888)' }}>
                <span>Latency: <strong style={{ color: svc.latency !== null ? (svc.latency > 2000 ? '#eab308' : svc.latency > 1000 ? '#f97316' : '#22c55e') : '#888' }}>
                  {svc.latency !== null ? `${svc.latency} ms` : '-'}
                </strong></span>
                <span>HTTP: <strong style={{ color: svc.httpStatus ? (svc.httpStatus < 400 ? '#22c55e' : '#ef4444') : '#888' }}>
                  {svc.httpStatus || (svc.status === 'checking' ? '...' : '-')}
                </strong></span>
                <span style={{ textTransform: 'capitalize' }}>
                  <span style={{
                    padding: '1px 6px', borderRadius: 3,
                    background: CATEGORY_LABELS[svc.category]?.color + '22',
                    color: CATEGORY_LABELS[svc.category]?.color,
                  }}>{svc.category}</span>
                </span>
              </div>

              {svc.error && (
                <div style={{ marginTop: 6, fontSize: 11, color: '#ef4444', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {svc.error}
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
