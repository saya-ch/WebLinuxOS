import { useState, useEffect, useCallback, useMemo } from 'react'
import {
  Activity, Zap, Clock, Database, Globe, Layers,
  RefreshCw, AlertTriangle, CheckCircle, TrendingUp,
  Cpu, HardDrive, Timer,
} from 'lucide-react'

/* ================================================================
   Types
   ================================================================ */

interface NavigationMetrics {
  dns: number
  tcp: number
  ttfb: number
  download: number
  domParse: number
  domInteractive: number
  domComplete: number
  loadEvent: number
  transferSize: number
}

interface ResourceStats {
  total: number
  byType: Record<string, number>
  bySize: Record<string, number>
  slowest: { name: string; duration: number; size: number }[]
  totalTransfer: number
}

interface PaintMetrics {
  fp: number | null
  fcp: number | null
}

interface WebVitals {
  lcp: number | null
  cls: number | null
  fid: number | null
}

interface MemorySnapshot {
  usedJSHeapSize: number
  totalJSHeapSize: number
  jsHeapSizeLimit: number
}

interface PerformanceScore {
  overall: number
  navigation: number
  paint: number
  vitals: number
  resources: number
}

interface LongTaskEntry {
  duration: number
  startTime: number
}

/* ================================================================
   Helpers
   ================================================================ */

function formatBytes(bytes: number): string {
  if (bytes === 0) return '0 B'
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}

function formatMs(ms: number): string {
  if (ms < 1) return '<1 ms'
  if (ms < 1000) return `${ms.toFixed(0)} ms`
  return `${(ms / 1000).toFixed(2)} s`
}

function getScoreColor(score: number): string {
  if (score >= 90) return '#22c55e'
  if (score >= 70) return '#eab308'
  if (score >= 50) return '#f97316'
  return '#ef4444'
}

function getScoreLabel(score: number): string {
  if (score >= 90) return 'Excellent'
  if (score >= 70) return 'Good'
  if (score >= 50) return 'Needs Work'
  return 'Poor'
}

/* ================================================================
   Data Collection
   ================================================================ */

function collectNavigationMetrics(): NavigationMetrics | null {
  const entries = performance.getEntriesByType('navigation') as PerformanceNavigationTiming[]
  if (!entries.length) return null
  const nav = entries[0]
  return {
    dns: nav.domainLookupEnd - nav.domainLookupStart,
    tcp: nav.connectEnd - nav.connectStart,
    ttfb: nav.responseStart - nav.requestStart,
    download: nav.responseEnd - nav.responseStart,
    domParse: nav.domInteractive - nav.responseEnd,
    domInteractive: nav.domInteractive - nav.fetchStart,
    domComplete: nav.domComplete - nav.fetchStart,
    loadEvent: nav.loadEventEnd - nav.fetchStart,
    transferSize: nav.transferSize || 0,
  }
}

function collectResourceStats(): ResourceStats {
  const entries = performance.getEntriesByType('resource') as PerformanceResourceTiming[]
  const typeMap: Record<string, number> = {}
  const sizeMap: Record<string, number> = {}
  let totalTransfer = 0

  const slowest: { name: string; duration: number; size: number }[] = []

  for (const entry of entries) {
    const ext = entry.name.split('?')[0].split('.').pop()?.toLowerCase() || 'other'
    const type = ext.match(/^(js|css|woff2?|ttf|otf|woff)$/) ? ext : ext.match(/^(png|jpg|jpeg|gif|webp|svg|ico)$/) ? 'image' : 'other'
    typeMap[type] = (typeMap[type] || 0) + 1
    const size = entry.transferSize || 0
    sizeMap[type] = (sizeMap[type] || 0) + size
    totalTransfer += size

    slowest.push({
      name: entry.name.split('/').pop()?.split('?')[0] || entry.name,
      duration: entry.duration,
      size,
    })
  }

  slowest.sort((a, b) => b.duration - a.duration)

  return {
    total: entries.length,
    byType: typeMap,
    bySize: sizeMap,
    slowest: slowest.slice(0, 8),
    totalTransfer,
  }
}

function collectPaintMetrics(): PaintMetrics {
  const entries = performance.getEntriesByType('paint')
  const fp = entries.find(e => e.name === 'first-paint')
  const fcp = entries.find(e => e.name === 'first-contentful-paint')
  return {
    fp: fp?.startTime ?? null,
    fcp: fcp?.startTime ?? null,
  }
}

function collectWebVitals(): WebVitals {
  let lcp: number | null = null
  let cls = 0
  let fid: number | null = null

  const lcpEntries = performance.getEntriesByType('largest-contentful-paint') as PerformanceEntry[]
  if (lcpEntries.length) {
    lcp = lcpEntries[lcpEntries.length - 1].startTime
  }

  const clsEntries = performance.getEntriesByType('layout-shift') as PerformanceEntry[]
  for (const entry of clsEntries) {
    cls += (entry as PerformanceEntry & { hadRecentInput?: boolean; value?: number }).value || 0
  }

  const fidEntries = performance.getEntriesByType('first-input') as PerformanceEntry[]
  if (fidEntries.length) {
    const entry = fidEntries[0] as PerformanceEntry & { processingStart?: number }
    if (entry.processingStart) {
      fid = entry.processingStart - entry.startTime
    }
  }

  return { lcp, cls, fid }
}

function collectMemory(): MemorySnapshot | null {
  const perf = performance as Performance & { memory?: { usedJSHeapSize: number; totalJSHeapSize: number; jsHeapSizeLimit: number } }
  if (!perf.memory) return null
  return {
    usedJSHeapSize: perf.memory.usedJSHeapSize,
    totalJSHeapSize: perf.memory.totalJSHeapSize,
    jsHeapSizeLimit: perf.memory.jsHeapSizeLimit,
  }
}

function calculateScore(nav: NavigationMetrics | null, paint: PaintMetrics, vitals: WebVitals, res: ResourceStats): PerformanceScore {
  let navScore = 80
  if (nav) {
    navScore = 100
    if (nav.ttfb > 800) navScore -= 30
    else if (nav.ttfb > 400) navScore -= 15
    if (nav.domParse > 1000) navScore -= 20
    else if (nav.domParse > 500) navScore -= 10
    if (nav.loadEvent > 5000) navScore -= 20
    else if (nav.loadEvent > 3000) navScore -= 10
  }

  let paintScore = 70
  if (paint.fcp !== null) {
    paintScore = 100
    if (paint.fcp > 3000) paintScore -= 50
    else if (paint.fcp > 1800) paintScore -= 30
    else if (paint.fcp > 1000) paintScore -= 10
  }

  let vitalsScore = 80
  if (vitals.lcp !== null) {
    vitalsScore = 100
    if (vitals.lcp > 4000) vitalsScore -= 40
    else if (vitals.lcp > 2500) vitalsScore -= 20
    if (vitals.cls !== null && vitals.cls > 0.25) vitalsScore -= 30
    else if (vitals.cls !== null && vitals.cls > 0.1) vitalsScore -= 15
  }

  let resScore = 100
  if (res.total > 100) resScore -= 20
  else if (res.total > 60) resScore -= 10
  if (res.totalTransfer > 5 * 1024 * 1024) resScore -= 30
  else if (res.totalTransfer > 2 * 1024 * 1024) resScore -= 15

  const overall = Math.round(navScore * 0.3 + paintScore * 0.25 + vitalsScore * 0.3 + resScore * 0.15)

  return {
    overall: Math.max(0, Math.min(100, overall)),
    navigation: Math.max(0, Math.min(100, navScore)),
    paint: Math.max(0, Math.min(100, paintScore)),
    vitals: Math.max(0, Math.min(100, vitalsScore)),
    resources: Math.max(0, Math.min(100, resScore)),
  }
}

/* ================================================================
   Score Ring Component
   ================================================================ */

function ScoreRing({ score, size = 80 }: { score: number; size?: number }) {
  const radius = (size - 8) / 2
  const circumference = 2 * Math.PI * radius
  const offset = circumference * (1 - score / 100)
  const color = getScoreColor(score)

  return (
    <svg width={size} height={size} style={{ transform: 'rotate(-90deg)' }}>
      <circle
        cx={size / 2} cy={size / 2} r={radius}
        fill="none" stroke="currentColor" strokeWidth="4"
        style={{ opacity: 0.15 }}
      />
      <circle
        cx={size / 2} cy={size / 2} r={radius}
        fill="none" stroke={color} strokeWidth="4"
        strokeDasharray={circumference}
        strokeDashoffset={offset}
        strokeLinecap="round"
        style={{ transition: 'stroke-dashoffset 0.8s ease' }}
      />
      <text
        x={size / 2} y={size / 2}
        textAnchor="middle" dominantBaseline="central"
        fill={color}
        fontSize={size * 0.25}
        fontWeight="bold"
        style={{ transform: 'rotate(90deg)', transformOrigin: 'center' }}
      >
        {score}
      </text>
    </svg>
  )
}

/* ================================================================
   Metric Card Component
   ================================================================ */

function MetricCard({ label, value, icon, color = '#60a5fa', sub }: {
  label: string; value: string; icon: React.ReactNode; color?: string; sub?: string
}) {
  return (
    <div style={{
      background: 'var(--bg-secondary, rgba(255,255,255,0.05))',
      borderRadius: 10, padding: '14px 16px',
      border: '1px solid var(--border-color, rgba(255,255,255,0.08))',
      display: 'flex', flexDirection: 'column', gap: 6,
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        <span style={{ color, fontSize: 16 }}>{icon}</span>
        <span style={{ fontSize: 12, color: 'var(--text-secondary, #999)', textTransform: 'uppercase', letterSpacing: 0.5 }}>{label}</span>
      </div>
      <div style={{ fontSize: 22, fontWeight: 700, color: 'var(--text-primary, #fff)' }}>{value}</div>
      {sub && <div style={{ fontSize: 11, color: 'var(--text-secondary, #888)' }}>{sub}</div>}
    </div>
  )
}

/* ================================================================
   Bar Chart Component
   ================================================================ */

function BarChart({ data, maxWidth = 400 }: { data: { label: string; value: number; color: string }[]; maxWidth?: number }) {
  const maxValue = Math.max(...data.map(d => d.value), 1)
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 6, width: '100%' }}>
      {data.map((item, i) => (
        <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <span style={{ fontSize: 11, color: 'var(--text-secondary, #999)', width: 60, textAlign: 'right', flexShrink: 0 }}>{item.label}</span>
          <div style={{
            height: 18, borderRadius: 4,
            width: `${(item.value / maxValue) * maxWidth}px`,
            minWidth: 2,
            background: item.color,
            transition: 'width 0.5s ease',
          }} />
          <span style={{ fontSize: 11, color: 'var(--text-secondary, #999)', flexShrink: 0 }}>{item.value}</span>
        </div>
      ))}
    </div>
  )
}

/* ================================================================
   Main Component
   ================================================================ */

export default function WebPerformanceInsights() {
  const [nav, setNav] = useState<NavigationMetrics | null>(null)
  const [resources, setResources] = useState<ResourceStats>({ total: 0, byType: {}, bySize: {}, slowest: [], totalTransfer: 0 })
  const [paint, setPaint] = useState<PaintMetrics>({ fp: null, fcp: null })
  const [vitals, setVitals] = useState<WebVitals>({ lcp: null, cls: null, fid: null })
  const [memory, setMemory] = useState<MemorySnapshot | null>(null)
  const [longTasks, setLongTasks] = useState<LongTaskEntry[]>([])
  const [tab, setTab] = useState<'overview' | 'navigation' | 'resources' | 'memory'>('overview')
  const [lastRefresh, setLastRefresh] = useState<Date>(new Date())

  const collectAll = useCallback(() => {
    setNav(collectNavigationMetrics())
    setResources(collectResourceStats())
    setPaint(collectPaintMetrics())
    setVitals(collectWebVitals())
    setMemory(collectMemory())
    setLastRefresh(new Date())
  }, [])

  useEffect(() => {
    collectAll()
    const obs = new PerformanceObserver((list) => {
      const tasks = list.getEntries().map(e => ({
        duration: e.duration,
        startTime: e.startTime,
      }))
      setLongTasks(prev => [...prev, ...tasks].slice(-20))
    })
    try { obs.observe({ type: 'longtask', buffered: true }) } catch { /* not supported */ }
    return () => obs.disconnect()
  }, [collectAll])

  const score = useMemo(() => calculateScore(nav, paint, vitals, resources), [nav, paint, vitals, resources])

  const memPercent = memory ? ((memory.usedJSHeapSize / memory.jsHeapSizeLimit) * 100).toFixed(1) : null

  const typeColors: Record<string, string> = {
    js: '#facc15',
    css: '#60a5fa',
    image: '#34d399',
    font: '#c084fc',
    other: '#94a3b8',
  }

  const tabs = [
    { id: 'overview' as const, label: 'Overview' },
    { id: 'navigation' as const, label: 'Navigation' },
    { id: 'resources' as const, label: 'Resources' },
    { id: 'memory' as const, label: 'Memory' },
  ]

  return (
    <div style={{ height: '100%', display: 'flex', flexDirection: 'column', background: 'var(--bg-primary, #0f0f0f)', color: 'var(--text-primary, #e5e5e5)', fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif' }}>
      {/* Header */}
      <div style={{
        padding: '12px 20px',
        borderBottom: '1px solid var(--border-color, rgba(255,255,255,0.08))',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        background: 'var(--bg-secondary, rgba(255,255,255,0.03))',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <Activity size={18} style={{ color: '#60a5fa' }} />
          <span style={{ fontSize: 15, fontWeight: 600 }}>Web Performance Insights</span>
          <span style={{
            fontSize: 11, padding: '2px 8px', borderRadius: 10,
            background: getScoreColor(score.overall) + '22',
            color: getScoreColor(score.overall),
            fontWeight: 600,
          }}>
            {getScoreLabel(score.overall)}
          </span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <span style={{ fontSize: 11, color: 'var(--text-secondary, #888)' }}>
            Updated: {lastRefresh.toLocaleTimeString()}
          </span>
          <button onClick={collectAll} style={{
            background: 'rgba(96,165,250,0.15)', border: 'none', borderRadius: 6,
            padding: '6px 10px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 4,
            color: '#60a5fa', fontSize: 12,
          }}>
            <RefreshCw size={13} /> Refresh
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div style={{
        display: 'flex', gap: 0, padding: '0 20px',
        borderBottom: '1px solid var(--border-color, rgba(255,255,255,0.08))',
      }}>
        {tabs.map(t => (
          <button key={t.id} onClick={() => setTab(t.id)} style={{
            background: 'none', border: 'none', padding: '10px 16px',
            color: tab === t.id ? '#60a5fa' : 'var(--text-secondary, #888)',
            borderBottom: tab === t.id ? '2px solid #60a5fa' : '2px solid transparent',
            cursor: 'pointer', fontSize: 13, fontWeight: tab === t.id ? 600 : 400,
            transition: 'all 0.2s',
          }}>
            {t.label}
          </button>
        ))}
      </div>

      {/* Content */}
      <div style={{ flex: 1, overflow: 'auto', padding: '20px' }}>
        {tab === 'overview' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
            {/* Score Section */}
            <div style={{ display: 'flex', gap: 24, alignItems: 'flex-start' }}>
              <div style={{
                background: 'var(--bg-secondary, rgba(255,255,255,0.05))',
                borderRadius: 12, padding: 20, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8,
                border: '1px solid var(--border-color, rgba(255,255,255,0.08))',
              }}>
                <ScoreRing score={score.overall} size={100} />
                <span style={{ fontSize: 13, fontWeight: 600, color: getScoreColor(score.overall) }}>{getScoreLabel(score.overall)}</span>
                <span style={{ fontSize: 11, color: 'var(--text-secondary, #888)' }}>Overall Score</span>
              </div>
              <div style={{ flex: 1, display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 12 }}>
                {[
                  { label: 'Navigation', score: score.navigation, icon: <Clock size={14} /> },
                  { label: 'Paint', score: score.paint, icon: <Zap size={14} /> },
                  { label: 'Web Vitals', score: score.vitals, icon: <TrendingUp size={14} /> },
                  { label: 'Resources', score: score.resources, icon: <Layers size={14} /> },
                ].map((item, i) => (
                  <div key={i} style={{
                    background: 'var(--bg-secondary, rgba(255,255,255,0.05))',
                    borderRadius: 10, padding: '14px 16px',
                    border: '1px solid var(--border-color, rgba(255,255,255,0.08))',
                    display: 'flex', flexDirection: 'column', gap: 8,
                  }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                      <span style={{ color: getScoreColor(item.score) }}>{item.icon}</span>
                      <span style={{ fontSize: 11, color: 'var(--text-secondary, #999)', textTransform: 'uppercase' }}>{item.label}</span>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'baseline', gap: 4 }}>
                      <span style={{ fontSize: 24, fontWeight: 700, color: getScoreColor(item.score) }}>{item.score}</span>
                      <span style={{ fontSize: 11, color: 'var(--text-secondary, #888)' }}>/100</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Key Metrics */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 12 }}>
              <MetricCard label="TTFB" value={nav ? formatMs(nav.ttfb) : 'N/A'} icon={<Clock size={16} />} color="#60a5fa" sub="Time to First Byte" />
              <MetricCard label="FCP" value={paint.fcp !== null ? formatMs(paint.fcp) : 'N/A'} icon={<Zap size={16} />} color="#facc15" sub="First Contentful Paint" />
              <MetricCard label="LCP" value={vitals.lcp !== null ? formatMs(vitals.lcp) : 'N/A'} icon={<TrendingUp size={16} />} color="#34d399" sub="Largest Contentful Paint" />
              <MetricCard label="CLS" value={vitals.cls !== null ? vitals.cls.toFixed(3) : 'N/A'} icon={<Activity size={16} />} color="#c084fc" sub="Cumulative Layout Shift" />
            </div>

            {/* Memory & Resources */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
              {memory && (
                <div style={{
                  background: 'var(--bg-secondary, rgba(255,255,255,0.05))',
                  borderRadius: 10, padding: 16,
                  border: '1px solid var(--border-color, rgba(255,255,255,0.08))',
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
                    <HardDrive size={14} style={{ color: '#60a5fa' }} />
                    <span style={{ fontSize: 13, fontWeight: 600 }}>Memory Usage</span>
                  </div>
                  <div style={{ fontSize: 28, fontWeight: 700, marginBottom: 4 }}>
                    {formatBytes(memory.usedJSHeapSize)}
                  </div>
                  <div style={{ fontSize: 12, color: 'var(--text-secondary, #888)', marginBottom: 12 }}>
                    of {formatBytes(memory.jsHeapSizeLimit)} limit ({memPercent}%)
                  </div>
                  <div style={{ height: 6, borderRadius: 3, background: 'rgba(255,255,255,0.08)', overflow: 'hidden' }}>
                    <div style={{
                      height: '100%', borderRadius: 3,
                      width: `${memPercent || 0}%`,
                      background: parseFloat(memPercent || '0') > 80 ? '#ef4444' : parseFloat(memPercent || '0') > 50 ? '#eab308' : '#22c55e',
                      transition: 'width 0.5s ease',
                    }} />
                  </div>
                </div>
              )}

              <div style={{
                background: 'var(--bg-secondary, rgba(255,255,255,0.05))',
                borderRadius: 10, padding: 16,
                border: '1px solid var(--border-color, rgba(255,255,255,0.08))',
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
                  <Globe size={14} style={{ color: '#34d399' }} />
                  <span style={{ fontSize: 13, fontWeight: 600 }}>Resource Summary</span>
                </div>
                <div style={{ fontSize: 28, fontWeight: 700, marginBottom: 4 }}>
                  {resources.total}
                </div>
                <div style={{ fontSize: 12, color: 'var(--text-secondary, #888)', marginBottom: 12 }}>
                  requests | {formatBytes(resources.totalTransfer)} transferred
                </div>
                <BarChart
                  data={Object.entries(resources.byType).map(([type, count]) => ({
                    label: type.toUpperCase(),
                    value: count,
                    color: typeColors[type] || '#94a3b8',
                  }))}
                  maxWidth={200}
                />
              </div>
            </div>
          </div>
        )}

        {tab === 'navigation' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
            {nav ? (
              <>
                <div style={{
                  background: 'var(--bg-secondary, rgba(255,255,255,0.05))',
                  borderRadius: 10, padding: 20,
                  border: '1px solid var(--border-color, rgba(255,255,255,0.08))',
                }}>
                  <h3 style={{ margin: '0 0 16px', fontSize: 14, fontWeight: 600 }}>Navigation Timing Waterfall</h3>
                  {[
                    { label: 'DNS Lookup', value: nav.dns, color: '#60a5fa' },
                    { label: 'TCP Connect', value: nav.tcp, color: '#34d399' },
                    { label: 'TTFB', value: nav.ttfb, color: '#facc15' },
                    { label: 'Download', value: nav.download, color: '#c084fc' },
                    { label: 'DOM Parse', value: nav.domParse, color: '#f97316' },
                  ].map((item, i) => (
                    <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 10 }}>
                      <span style={{ fontSize: 12, color: 'var(--text-secondary, #999)', width: 100, textAlign: 'right', flexShrink: 0 }}>{item.label}</span>
                      <div style={{ flex: 1, position: 'relative', height: 24 }}>
                        <div style={{
                          position: 'absolute', left: 0, top: 0, height: '100%',
                          width: `${Math.min(100, (item.value / Math.max(nav.loadEvent, 1)) * 100)}%`,
                          background: item.color + '33',
                          borderRadius: 4,
                        }} />
                        <div style={{
                          position: 'absolute', left: 0, top: 4, height: 16,
                          width: `${Math.min(100, (item.value / Math.max(nav.loadEvent, 1)) * 100)}%`,
                          background: item.color,
                          borderRadius: 3,
                          transition: 'width 0.5s ease',
                        }} />
                      </div>
                      <span style={{ fontSize: 12, fontWeight: 600, width: 80, flexShrink: 0 }}>{formatMs(item.value)}</span>
                    </div>
                  ))}
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12 }}>
                  <MetricCard label="DOM Interactive" value={formatMs(nav.domInteractive)} icon={<Layers size={16} />} color="#f97316" />
                  <MetricCard label="DOM Complete" value={formatMs(nav.domComplete)} icon={<CheckCircle size={16} />} color="#22c55e" />
                  <MetricCard label="Load Event" value={formatMs(nav.loadEvent)} icon={<Timer size={16} />} color="#60a5fa" />
                </div>
              </>
            ) : (
              <div style={{ textAlign: 'center', padding: 40, color: 'var(--text-secondary, #888)' }}>
                <AlertTriangle size={32} style={{ marginBottom: 12, color: '#eab308' }} />
                <p>Navigation timing data not available. Reload the page to collect metrics.</p>
              </div>
            )}
          </div>
        )}

        {tab === 'resources' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
            {resources.slowest.length > 0 ? (
              <>
                <div style={{
                  background: 'var(--bg-secondary, rgba(255,255,255,0.05))',
                  borderRadius: 10, padding: 16,
                  border: '1px solid var(--border-color, rgba(255,255,255,0.08))',
                }}>
                  <h3 style={{ margin: '0 0 12px', fontSize: 14, fontWeight: 600 }}>Slowest Resources</h3>
                  {resources.slowest.map((res, i) => (
                    <div key={i} style={{
                      display: 'flex', alignItems: 'center', gap: 12, padding: '8px 0',
                      borderBottom: i < resources.slowest.length - 1 ? '1px solid var(--border-color, rgba(255,255,255,0.05))' : 'none',
                    }}>
                      <span style={{
                        fontSize: 11, width: 24, height: 24, borderRadius: 4,
                        background: 'rgba(255,255,255,0.05)', display: 'flex', alignItems: 'center', justifyContent: 'center',
                        fontWeight: 600, color: 'var(--text-secondary, #888)',
                      }}>{i + 1}</span>
                      <span style={{ flex: 1, fontSize: 13, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{res.name}</span>
                      <span style={{ fontSize: 12, color: 'var(--text-secondary, #888)', width: 80, textAlign: 'right', flexShrink: 0 }}>{formatBytes(res.size)}</span>
                      <span style={{ fontSize: 12, fontWeight: 600, width: 80, textAlign: 'right', flexShrink: 0, color: res.duration > 1000 ? '#ef4444' : res.duration > 500 ? '#eab308' : '#22c55e' }}>{formatMs(res.duration)}</span>
                    </div>
                  ))}
                </div>

                <div style={{
                  background: 'var(--bg-secondary, rgba(255,255,255,0.05))',
                  borderRadius: 10, padding: 16,
                  border: '1px solid var(--border-color, rgba(255,255,255,0.08))',
                }}>
                  <h3 style={{ margin: '0 0 12px', fontSize: 14, fontWeight: 600 }}>Transfer Size by Type</h3>
                  <BarChart
                    data={Object.entries(resources.bySize)
                      .filter(([_, size]) => size > 0)
                      .map(([type, size]) => ({
                        label: type.toUpperCase(),
                        value: size,
                        color: typeColors[type] || '#94a3b8',
                      }))}
                    maxWidth={300}
                  />
                </div>
              </>
            ) : (
              <div style={{ textAlign: 'center', padding: 40, color: 'var(--text-secondary, #888)' }}>
                <Globe size={32} style={{ marginBottom: 12 }} />
                <p>No resource timing data available yet.</p>
              </div>
            )}
          </div>
        )}

        {tab === 'memory' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
            {memory ? (
              <>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12 }}>
                  <MetricCard label="Used Heap" value={formatBytes(memory.usedJSHeapSize)} icon={<Database size={16} />} color="#60a5fa" sub={`${memPercent}% of limit`} />
                  <MetricCard label="Total Heap" value={formatBytes(memory.totalJSHeapSize)} icon={<HardDrive size={16} />} color="#facc15" />
                  <MetricCard label="Heap Limit" value={formatBytes(memory.jsHeapSizeLimit)} icon={<Cpu size={16} />} color="#c084fc" sub={`${(navigator.hardwareConcurrency || '?')} CPU cores`} />
                </div>

                <div style={{
                  background: 'var(--bg-secondary, rgba(255,255,255,0.05))',
                  borderRadius: 10, padding: 16,
                  border: '1px solid var(--border-color, rgba(255,255,255,0.08))',
                }}>
                  <h3 style={{ margin: '0 0 12px', fontSize: 14, fontWeight: 600 }}>Memory Breakdown</h3>
                  <div style={{ display: 'flex', height: 30, borderRadius: 6, overflow: 'hidden', marginBottom: 12 }}>
                    <div style={{ width: `${(memory.usedJSHeapSize / memory.jsHeapSizeLimit) * 100}%`, background: '#60a5fa', transition: 'width 0.5s ease' }} />
                    <div style={{ width: `${((memory.totalJSHeapSize - memory.usedJSHeapSize) / memory.jsHeapSizeLimit) * 100}%`, background: '#facc15', transition: 'width 0.5s ease' }} />
                    <div style={{ flex: 1, background: 'rgba(255,255,255,0.05)' }} />
                  </div>
                  <div style={{ display: 'flex', gap: 20, fontSize: 12 }}>
                    <span style={{ color: '#60a5fa' }}>Used: {formatBytes(memory.usedJSHeapSize)}</span>
                    <span style={{ color: '#facc15' }}>Allocated: {formatBytes(memory.totalJSHeapSize - memory.usedJSHeapSize)}</span>
                    <span style={{ color: 'var(--text-secondary, #888)' }}>Free: {formatBytes(memory.jsHeapSizeLimit - memory.totalJSHeapSize)}</span>
                  </div>
                </div>

                {longTasks.length > 0 && (
                  <div style={{
                    background: 'var(--bg-secondary, rgba(255,255,255,0.05))',
                    borderRadius: 10, padding: 16,
                    border: '1px solid var(--border-color, rgba(255,255,255,0.08))',
                  }}>
                    <h3 style={{ margin: '0 0 12px', fontSize: 14, fontWeight: 600, display: 'flex', alignItems: 'center', gap: 8 }}>
                      <AlertTriangle size={14} style={{ color: '#f97316' }} />
                      Long Tasks ({longTasks.length})
                    </h3>
                    {longTasks.slice(-10).map((task, i) => (
                      <div key={i} style={{
                        display: 'flex', alignItems: 'center', gap: 12, padding: '6px 0',
                        borderBottom: i < Math.min(longTasks.length, 10) - 1 ? '1px solid var(--border-color, rgba(255,255,255,0.05))' : 'none',
                      }}>
                        <span style={{
                          fontSize: 11, padding: '2px 6px', borderRadius: 4,
                          background: task.duration > 100 ? '#ef444422' : '#eab30822',
                          color: task.duration > 100 ? '#ef4444' : '#eab308',
                        }}>{formatMs(task.duration)}</span>
                        <span style={{ fontSize: 12, color: 'var(--text-secondary, #888)' }}>at {formatMs(task.startTime)}</span>
                      </div>
                    ))}
                  </div>
                )}
              </>
            ) : (
              <div style={{ textAlign: 'center', padding: 40, color: 'var(--text-secondary, #888)' }}>
                <HardDrive size={32} style={{ marginBottom: 12 }} />
                <p>Memory API not available in this browser. Try Chrome or Edge.</p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
