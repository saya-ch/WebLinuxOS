import React, { useState, useCallback, useMemo, useEffect, useRef } from 'react'
import {
  Activity, Zap, Clock, MemoryStick, BarChart3,
  RefreshCw, Download, AlertTriangle, CheckCircle, Timer,
} from 'lucide-react'

/* ================================================================
   Types
   ================================================================ */

interface NavigationMetrics {
  ttfb: number
  domContentLoaded: number
  loadComplete: number
  domInteractive: number
  networkTransfer: number
}

interface PaintMetrics { fp: number; fcp: number }

interface WebVitals { lcp: number; cls: number; fid: number }

interface MemorySnapshot { used: number; total: number; limit: number }

interface ResourceEntry {
  name: string
  shortName: string
  type: string
  duration: number
  size: number
  startTime: number
  transferSize: number
}

interface LongTask {
  name: string
  duration: number
  startTime: number
  timestamp: number
}

interface HistorySnapshot {
  timestamp: number
  label: string
  nav: NavigationMetrics
  paint: PaintMetrics
  vitals: WebVitals
  score: number
}

interface PerformanceWithMemory extends Performance {
  memory?: { usedJSHeapSize: number; totalJSHeapSize: number; jsHeapSizeLimit: number }
}

/* ================================================================
   Constants & Helpers
   ================================================================ */

const LS_KEY = 'wlp-perf-profiler-history'
const MAX_HISTORY = 30
const DARK_BG = 'rgba(12,12,22,0.97)'
const ACCENT = '#3b82f6'
const SUCCESS = '#10b981'
const WARNING = '#f59e0b'
const ERROR = '#ef4444'
const INFO = '#6366f1'

const mono: React.CSSProperties = { fontFamily: "'JetBrains Mono', monospace" }
const sans: React.CSSProperties = { fontFamily: "'Noto Sans SC', sans-serif" }

const fmt = (ms: number) =>
  ms < 1 ? '<1ms' : ms < 1000 ? `${Math.round(ms)}ms` : `${(ms / 1000).toFixed(2)}s`

const fmtBytes = (b: number) =>
  b === 0 ? '0 B' : b < 1024 ? `${b} B` : b < 1048576 ? `${(b / 1024).toFixed(1)} KB` : `${(b / 1048576).toFixed(2)} MB`

const shortName = (url: string) => {
  try {
    const parts = new URL(url, location.href).pathname.split('/')
    return parts[parts.length - 1] || 'index'
  } catch {
    return url.length > 40 ? url.slice(0, 37) + '...' : url
  }
}

const resTypeName = (t: string) =>
  ({ script: 'JS', css: 'CSS', link: 'CSS', img: 'Image', image: 'Image', font: 'Font', fetch: 'Fetch', xmlhttprequest: 'XHR', document: 'Doc' } as Record<string, string>)[t] || 'Other'

const clampColor = (v: number, good: number, bad: number) =>
  v <= good ? SUCCESS : v >= bad ? ERROR : WARNING

const TYPE_COLORS: Record<string, string> = {
  JS: '#f59e0b', CSS: '#8b5cf6', Image: '#10b981', Font: '#ec4899',
  XHR: '#3b82f6', Fetch: '#3b82f6', Doc: '#06b6d4', Other: '#94a3b8',
}

const toolBtnStyle: React.CSSProperties = {
  display: 'flex', alignItems: 'center', justifyContent: 'center',
  width: 30, height: 30, borderRadius: 7,
  border: '1px solid rgba(255,255,255,0.08)',
  background: 'rgba(255,255,255,0.05)',
  color: '#94a3b8', cursor: 'pointer', fontSize: 13,
}

/* ================================================================
   Mini SVG Bar Chart
   ================================================================ */

const MiniBarChart: React.FC<{
  values: number[]
  labels: string[]
  color: string
  height?: number
}> = ({ values, labels, color, height = 100 }) => {
  if (!values.length) return null
  const max = Math.max(...values, 1)
  const barW = Math.max(4, Math.floor(560 / values.length) - 2)
  return (
    <svg
      width="100%" height={height + 26}
      viewBox={`0 0 ${values.length * (barW + 2)} ${height + 26}`}
      style={{ display: 'block' }}
    >
      {values.map((v, i) => {
        const h = (v / max) * height
        const x = i * (barW + 2)
        return (
          <g key={i}>
            <rect x={x} y={height - h} width={barW} height={h} rx={2} fill={color} opacity={0.85} />
            {values.length <= 15 && (
              <text x={x + barW / 2} y={height + 12} textAnchor="middle" fill="#94a3b8"
                fontSize={7} fontFamily="'JetBrains Mono',monospace">{labels[i]}</text>
            )}
          </g>
        )
      })}
    </svg>
  )
}

/* ================================================================
   Section & MetricCard
   ================================================================ */

const Section: React.FC<{
  title: string; icon: React.ReactNode; children: React.ReactNode
}> = ({ title, icon, children }) => (
  <div style={{
    background: 'rgba(255,255,255,0.04)', borderRadius: 12,
    padding: '14px 18px', border: '1px solid rgba(255,255,255,0.06)',
  }}>
    <div style={{
      display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12,
      fontSize: 14, fontWeight: 600, color: '#e2e8f0', ...sans,
    }}>{icon}{title}</div>
    {children}
  </div>
)

const MetricCard: React.FC<{
  label: string; value: string; color: string; icon: React.ReactNode; sub?: string
}> = ({ label, value, color, icon, sub }) => (
  <div style={{
    background: 'rgba(255,255,255,0.03)', borderRadius: 10,
    padding: '10px 12px', border: '1px solid rgba(255,255,255,0.06)',
    display: 'flex', flexDirection: 'column', gap: 4,
  }}>
    <div style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: 11, color: '#94a3b8', ...sans }}>
      <span style={{ color }}>{icon}</span>{label}
    </div>
    <div style={{ fontSize: 20, fontWeight: 700, color, ...mono, lineHeight: 1.2 }}>{value}</div>
    {sub && <div style={{ fontSize: 10, color: '#64748b', ...mono }}>{sub}</div>}
  </div>
)

/* ================================================================
   Score Ring
   ================================================================ */

const ScoreRing: React.FC<{ score: number; size?: number }> = ({ score, size = 88 }) => {
  const r = (size - 10) / 2
  const circ = 2 * Math.PI * r
  const color = score >= 90 ? SUCCESS : score >= 50 ? WARNING : ERROR
  return (
    <svg width={size} height={size}>
      <circle cx={size / 2} cy={size / 2} r={r} fill="none"
        stroke="rgba(255,255,255,0.08)" strokeWidth={6} />
      <circle cx={size / 2} cy={size / 2} r={r} fill="none"
        stroke={color} strokeWidth={6} strokeLinecap="round"
        strokeDasharray={circ}
        strokeDashoffset={circ - (score / 100) * circ}
        transform={`rotate(-90 ${size / 2} ${size / 2})`}
        style={{ transition: 'stroke-dashoffset 0.6s ease' }} />
      <text x={size / 2} y={size / 2 + 2} textAnchor="middle" dominantBaseline="middle"
        fill={color} fontSize={size * 0.28} fontWeight={700}
        fontFamily="'JetBrains Mono',monospace">{score}</text>
    </svg>
  )
}

/* ================================================================
   Waterfall Row
   ================================================================ */

const WaterfallRow: React.FC<{
  r: ResourceEntry; maxDur: number; maxStart: number
}> = ({ r, maxDur, maxStart }) => {
  const range = maxStart + maxDur || 1
  const pctLeft = (r.startTime / range) * 100
  const pctW = Math.max(1, (r.duration / range) * 100)
  const st = resTypeName(r.type)
  const barColor = TYPE_COLORS[st] || '#94a3b8'

  return (
    <div style={{
      display: 'flex', alignItems: 'center', gap: 8,
      padding: '4px 0', borderBottom: '1px solid rgba(255,255,255,0.04)',
    }}>
      <div style={{
        width: 44, fontSize: 10, color: barColor, fontWeight: 600,
        textAlign: 'center', ...mono, flexShrink: 0,
      }}>{st}</div>
      <div style={{
        flex: 1, minWidth: 0, overflow: 'hidden', textOverflow: 'ellipsis',
        whiteSpace: 'nowrap', fontSize: 11, color: '#cbd5e1', ...mono,
      }} title={r.name}>{r.shortName}</div>
      <div style={{
        width: 200, height: 12, position: 'relative', flexShrink: 0,
        background: 'rgba(255,255,255,0.03)', borderRadius: 3,
      }}>
        <div style={{
          position: 'absolute', left: `${pctLeft}%`, width: `${pctW}%`,
          height: '100%', background: barColor, borderRadius: 3, opacity: 0.8,
        }} />
      </div>
      <div style={{ width: 56, textAlign: 'right', fontSize: 11, color: '#94a3b8', ...mono, flexShrink: 0 }}>
        {fmt(r.duration)}
      </div>
      <div style={{ width: 56, textAlign: 'right', fontSize: 11, color: '#64748b', ...mono, flexShrink: 0 }}>
        {fmtBytes(r.transferSize || r.size)}
      </div>
    </div>
  )
}

/* ================================================================
   Main Component
   ================================================================ */

const WebPerformanceProfilerInner: React.FC<{ onClose: () => void }> = ({ onClose }) => {
  /* ---- State ---- */
  const [nav, setNav] = useState<NavigationMetrics>({
    ttfb: 0, domContentLoaded: 0, loadComplete: 0, domInteractive: 0, networkTransfer: 0,
  })
  const [paint, setPaint] = useState<PaintMetrics>({ fp: 0, fcp: 0 })
  const [vitals, setVitals] = useState<WebVitals>({ lcp: 0, cls: 0, fid: 0 })
  const [mem, setMem] = useState<MemorySnapshot | null>(null)
  const [resources, setResources] = useState<ResourceEntry[]>([])
  const [longTasks, setLongTasks] = useState<LongTask[]>([])
  const [history, setHistory] = useState<HistorySnapshot[]>(() => {
    try { const raw = localStorage.getItem(LS_KEY); return raw ? JSON.parse(raw) : [] } catch { return [] }
  })
  const [tab, setTab] = useState<'overview' | 'resources' | 'longtasks' | 'history'>('overview')
  const [monitoring, setMonitoring] = useState(false)
  const [collectedAt, setCollectedAt] = useState<Date | null>(null)
  const obsRef = useRef<PerformanceObserver[]>([])

  /* ---- Collectors ---- */
  const collectNav = useCallback(() => {
    const entries = performance.getEntriesByType('navigation') as PerformanceNavigationTiming[]
    if (!entries.length) return
    const e = entries[0], t0 = e.startTime
    setNav({
      ttfb: e.responseStart - e.requestStart,
      domContentLoaded: e.domContentLoadedEventEnd - t0,
      loadComplete: e.loadEventEnd > 0 ? e.loadEventEnd - t0 : 0,
      domInteractive: e.domInteractive - t0,
      networkTransfer: e.responseEnd - e.requestStart,
    })
  }, [])

  const collectPaint = useCallback(() => {
    for (const e of performance.getEntriesByType('paint') as PerformancePaintTiming[]) {
      if (e.name === 'first-paint') setPaint(p => ({ ...p, fp: e.startTime }))
      if (e.name === 'first-contentful-paint') setPaint(p => ({ ...p, fcp: e.startTime }))
    }
  }, [])

  const collectRes = useCallback(() => {
    setResources(
      (performance.getEntriesByType('resource') as PerformanceResourceTiming[]).map(e => ({
        name: e.name, shortName: shortName(e.name), type: e.initiatorType,
        duration: e.duration, size: e.transferSize || 0,
        startTime: e.startTime, transferSize: e.transferSize,
      })),
    )
  }, [])

  const collectMem = useCallback(() => {
    const p = performance as PerformanceWithMemory
    if (p.memory) {
      setMem({
        used: Math.round(p.memory.usedJSHeapSize / 1048576),
        total: Math.round(p.memory.totalJSHeapSize / 1048576),
        limit: Math.round(p.memory.jsHeapSizeLimit / 1048576),
      })
    }
  }, [])

  const collectAll = useCallback(() => {
    collectNav(); collectPaint(); collectRes(); collectMem()
    setCollectedAt(new Date())
  }, [collectNav, collectPaint, collectRes, collectMem])

  /* Auto-collect on mount & every 5s */
  useEffect(() => {
    collectAll()
    const id = setInterval(collectAll, 5000)
    return () => clearInterval(id)
  }, [collectAll])

  /* ---- PerformanceObserver: LCP / CLS / FID ---- */
  useEffect(() => {
    const tryObserve = (type: string, cb: (list: PerformanceObserverEntryList) => void) => {
      try {
        const obs = new PerformanceObserver(cb)
        obs.observe({ type, buffered: true } as PerformanceObserverInit)
        obsRef.current.push(obs)
      } catch { /* not supported */ }
    }

    tryObserve('largest-contentful-paint', list => {
      const entries = list.getEntries() as LargestContentfulPaint[]
      if (entries.length) setVitals(v => ({ ...v, lcp: entries[entries.length - 1].startTime }))
    })

    try {
      let clsValue = 0
      const obs = new PerformanceObserver(list => {
        for (const entry of list.getEntries()) {
          const e = entry as unknown as { hadRecentInput?: boolean; value: number }
          if (!e.hadRecentInput) {
            clsValue += e.value
            setVitals(v => ({ ...v, cls: clsValue }))
          }
        }
      })
      obs.observe({ type: 'layout-shift', buffered: true } as PerformanceObserverInit)
      obsRef.current.push(obs)
    } catch { /* not supported */ }

    tryObserve('first-input', list => {
      const entries = list.getEntries() as (PerformanceEntry & { processingStart: number })[]
      if (entries.length) setVitals(v => ({ ...v, fid: entries[0].processingStart - entries[0].startTime }))
    })

    return () => {
      obsRef.current.forEach(o => { try { o.disconnect() } catch { /* */ } })
      obsRef.current = []
    }
  }, [])

  /* ---- Long-task monitoring ---- */
  const startMonitoring = useCallback(() => {
    try {
      const obs = new PerformanceObserver(list => {
        for (const entry of list.getEntries()) {
          const e = entry as PerformanceEntry & { duration: number }
          if (e.duration > 50) {
            setLongTasks(prev => [
              { name: e.name || 'Main Thread', duration: e.duration, startTime: e.startTime, timestamp: Date.now() },
              ...prev.slice(0, 99),
            ])
          }
        }
      })
      obs.observe({ type: 'longtask', buffered: false } as PerformanceObserverInit)
      obsRef.current.push(obs)
      setMonitoring(true)
    } catch { /* not supported */ }
  }, [])

  const stopMonitoring = useCallback(() => {
    obsRef.current.forEach(o => { try { o.disconnect() } catch { /* */ } })
    obsRef.current = []
    setMonitoring(false)
  }, [])

  /* ---- Score (0-100) ---- */
  const score = useMemo(() => {
    let s = 100
    if (vitals.lcp > 2500) s -= Math.min(30, (vitals.lcp - 2500) / 100)
    if (vitals.cls > 0.1) s -= Math.min(25, vitals.cls * 100)
    if (vitals.fid > 100) s -= Math.min(15, (vitals.fid - 100) / 20)
    if (nav.ttfb > 800) s -= Math.min(15, (nav.ttfb - 800) / 50)
    if (paint.fp > 3000) s -= Math.min(10, (paint.fp - 3000) / 200)
    return Math.max(0, Math.min(100, Math.round(s)))
  }, [vitals, nav, paint])

  /* ---- History ---- */
  const saveSnapshot = useCallback(() => {
    const snap: HistorySnapshot = {
      timestamp: Date.now(),
      label: new Date().toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
      nav: { ...nav }, paint: { ...paint }, vitals: { ...vitals }, score,
    }
    setHistory(prev => {
      const next = [...prev, snap].slice(-MAX_HISTORY)
      try { localStorage.setItem(LS_KEY, JSON.stringify(next)) } catch { /* quota */ }
      return next
    })
  }, [nav, paint, vitals, score])

  const clearHistory = useCallback(() => {
    setHistory([])
    try { localStorage.removeItem(LS_KEY) } catch { /* */ }
  }, [])

  /* ---- Export ---- */
  const exportReport = useCallback(() => {
    const report = {
      generatedAt: new Date().toISOString(),
      score,
      navigationTiming: nav,
      paintTiming: paint,
      webVitals: vitals,
      memory: mem,
      resourceCount: resources.length,
      totalTransferSize: resources.reduce((a, r) => a + (r.transferSize || 0), 0),
      longTaskCount: longTasks.length,
      resources: resources.slice(0, 100),
      longTasks: longTasks.slice(0, 50),
    }
    const blob = new Blob([JSON.stringify(report, null, 2)], { type: 'application/json' })
    const a = document.createElement('a')
    a.href = URL.createObjectURL(blob)
    a.download = `perf-report-${Date.now()}.json`
    a.click()
  }, [score, nav, paint, vitals, mem, resources, longTasks])

  /* ---- Resource stats ---- */
  const resStats = useMemo(() => {
    const map: Record<string, { count: number; size: number }> = {}
    let totalSize = 0
    for (const r of resources) {
      const t = resTypeName(r.type)
      if (!map[t]) map[t] = { count: 0, size: 0 }
      map[t].count++
      map[t].size += r.transferSize || r.size
      totalSize += r.transferSize || r.size
    }
    return { map, totalSize }
  }, [resources])

  const maxDur = useMemo(() => Math.max(...resources.map(e => e.duration), 1), [resources])
  const maxStart = useMemo(() => Math.max(...resources.map(e => e.startTime), 1), [resources])

  /* ---- Tab config ---- */
  const tabs = [
    { key: 'overview' as const, label: '总览', icon: <Activity size={14} /> },
    { key: 'resources' as const, label: '资源瀑布', icon: <BarChart3 size={14} /> },
    { key: 'longtasks' as const, label: '长任务', icon: <AlertTriangle size={14} /> },
    { key: 'history' as const, label: '历史趋势', icon: <Clock size={14} /> },
  ]

  /* ================================================================
     Render
     ================================================================ */
  return (
    <div style={{
      width: '100%', height: '100%', background: DARK_BG, borderRadius: 16,
      color: '#e2e8f0', display: 'flex', flexDirection: 'column', overflow: 'hidden', ...sans,
    }}>
      {/* ---- Header ---- */}
      <div style={{
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        padding: '12px 18px', borderBottom: '1px solid rgba(255,255,255,0.06)',
        background: 'rgba(255,255,255,0.02)', flexShrink: 0,
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <Activity size={18} style={{ color: ACCENT }} />
          <span style={{ fontSize: 15, fontWeight: 700, color: '#f1f5f9' }}>Web 性能分析器</span>
          {collectedAt && (
            <span style={{ fontSize: 11, color: '#64748b', ...mono }}>
              更新于 {collectedAt.toLocaleTimeString('zh-CN')}
            </span>
          )}
        </div>
        <div style={{ display: 'flex', gap: 6 }}>
          <button onClick={collectAll} style={toolBtnStyle} title="重新采集"><RefreshCw size={14} /></button>
          <button onClick={saveSnapshot} style={toolBtnStyle} title="保存快照"><Clock size={14} /></button>
          <button onClick={exportReport} style={toolBtnStyle} title="导出 JSON 报告"><Download size={14} /></button>
          <button onClick={onClose} style={{ ...toolBtnStyle, marginLeft: 2 }} title="关闭">✕</button>
        </div>
      </div>

      {/* ---- Tabs ---- */}
      <div style={{
        display: 'flex', padding: '0 18px',
        borderBottom: '1px solid rgba(255,255,255,0.06)', flexShrink: 0,
      }}>
        {tabs.map(t => (
          <button key={t.key} onClick={() => setTab(t.key)} style={{
            display: 'flex', alignItems: 'center', gap: 5, padding: '10px 14px',
            fontSize: 13, fontWeight: tab === t.key ? 600 : 400,
            color: tab === t.key ? ACCENT : '#94a3b8',
            background: 'transparent', border: 'none',
            borderBottom: tab === t.key ? `2px solid ${ACCENT}` : '2px solid transparent',
            cursor: 'pointer', ...sans,
          }}>{t.icon}{t.label}</button>
        ))}
      </div>

      {/* ---- Content ---- */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '14px 18px' }}>

        {/* ===== OVERVIEW TAB ===== */}
        {tab === 'overview' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            {/* Score + Memory + Long Tasks summary */}
            <div style={{ display: 'flex', gap: 14, flexWrap: 'wrap' }}>
              <div style={{
                background: 'rgba(255,255,255,0.04)', borderRadius: 12,
                padding: '18px 24px', border: '1px solid rgba(255,255,255,0.06)',
                display: 'flex', alignItems: 'center', gap: 18,
              }}>
                <ScoreRing score={score} />
                <div>
                  <div style={{ fontSize: 18, fontWeight: 700, color: '#f1f5f9', ...sans }}>性能评分</div>
                  <div style={{ fontSize: 12, color: '#64748b', marginTop: 2, ...sans }}>
                    {score >= 90 ? '优秀 — 页面性能极佳' : score >= 50 ? '一般 — 存在优化空间' : '较差 — 需要优化'}
                  </div>
                </div>
              </div>

              {mem && (
                <div style={{
                  background: 'rgba(255,255,255,0.04)', borderRadius: 12,
                  padding: '18px 24px', border: '1px solid rgba(255,255,255,0.06)',
                  display: 'flex', alignItems: 'center', gap: 14,
                }}>
                  <MemoryStick size={26} style={{ color: INFO }} />
                  <div>
                    <div style={{ fontSize: 11, color: '#94a3b8', ...sans }}>内存使用</div>
                    <div style={{ fontSize: 20, fontWeight: 700, color: INFO, ...mono }}>
                      {mem.used} <span style={{ fontSize: 11, color: '#64748b' }}>MB</span>
                    </div>
                    <div style={{ fontSize: 10, color: '#64748b', ...mono }}>
                      / {mem.total} MB (限制 {mem.limit} MB)
                    </div>
                  </div>
                </div>
              )}

              <div style={{
                background: 'rgba(255,255,255,0.04)', borderRadius: 12,
                padding: '18px 24px', border: '1px solid rgba(255,255,255,0.06)',
                display: 'flex', alignItems: 'center', gap: 14,
              }}>
                <Zap size={26} style={{ color: WARNING }} />
                <div>
                  <div style={{ fontSize: 11, color: '#94a3b8', ...sans }}>长任务检测</div>
                  <div style={{ fontSize: 20, fontWeight: 700, color: longTasks.length > 0 ? WARNING : SUCCESS, ...mono }}>
                    {longTasks.length}
                  </div>
                </div>
              </div>
            </div>

            {/* Navigation Timing */}
            <Section title="导航时序 (Navigation Timing)" icon={<Timer size={15} style={{ color: ACCENT }} />}>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(160px, 1fr))', gap: 8 }}>
                <MetricCard label="TTFB" value={fmt(nav.ttfb)} color={clampColor(nav.ttfb, 200, 800)}
                  icon={<Clock size={12} />} sub="首字节时间" />
                <MetricCard label="DOM Interactive" value={fmt(nav.domInteractive)}
                  color={clampColor(nav.domInteractive, 1000, 3000)} icon={<Activity size={12} />} />
                <MetricCard label="DOMContentLoaded" value={fmt(nav.domContentLoaded)}
                  color={clampColor(nav.domContentLoaded, 1500, 4000)} icon={<Activity size={12} />} />
                <MetricCard label="Load Complete" value={fmt(nav.loadComplete)}
                  color={clampColor(nav.loadComplete, 2000, 5000)} icon={<CheckCircle size={12} />} />
                <MetricCard label="Network Transfer" value={fmt(nav.networkTransfer)}
                  color={clampColor(nav.networkTransfer, 300, 1500)} icon={<Zap size={12} />} />
              </div>
            </Section>

            {/* Paint Timing + Core Web Vitals */}
            <Section title="绘制时序与核心 Web 指标" icon={<Zap size={15} style={{ color: WARNING }} />}>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(160px, 1fr))', gap: 8 }}>
                <MetricCard label="First Paint" value={fmt(paint.fp)}
                  color={clampColor(paint.fp, 1000, 3000)} icon={<Activity size={12} />} />
                <MetricCard label="FCP" value={fmt(paint.fcp)}
                  color={clampColor(paint.fcp, 1800, 3000)} icon={<CheckCircle size={12} />} />
                <MetricCard label="LCP" value={vitals.lcp > 0 ? fmt(vitals.lcp) : '—'}
                  color={vitals.lcp > 0 ? clampColor(vitals.lcp, 2500, 4000) : '#64748b'}
                  icon={<Zap size={12} />} sub="Core Web Vital" />
                <MetricCard label="CLS" value={vitals.cls > 0 ? vitals.cls.toFixed(3) : '—'}
                  color={vitals.cls > 0 ? (vitals.cls <= 0.1 ? SUCCESS : vitals.cls <= 0.25 ? WARNING : ERROR) : '#64748b'}
                  icon={<AlertTriangle size={12} />} sub="Core Web Vital" />
                <MetricCard label="FID" value={vitals.fid > 0 ? fmt(vitals.fid) : '—'}
                  color={vitals.fid > 0 ? clampColor(vitals.fid, 50, 300) : '#64748b'}
                  icon={<Timer size={12} />} sub="Core Web Vital" />
              </div>
            </Section>

            {/* Resource overview */}
            <Section title="资源概览" icon={<BarChart3 size={15} style={{ color: INFO }} />}>
              <div style={{
                display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(140px, 1fr))',
                gap: 8, marginBottom: 10,
              }}>
                <MetricCard label="总资源数" value={String(resources.length)} color={ACCENT} icon={<BarChart3 size={12} />} />
                <MetricCard label="总传输量" value={fmtBytes(resStats.totalSize)} color={INFO} icon={<Zap size={12} />} />
              </div>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                {Object.entries(resStats.map).map(([type, info]) => (
                  <div key={type} style={{
                    background: 'rgba(255,255,255,0.04)', borderRadius: 7,
                    padding: '6px 12px', border: '1px solid rgba(255,255,255,0.06)',
                    ...mono, fontSize: 11,
                  }}>
                    <span style={{ color: TYPE_COLORS[type] || '#94a3b8', fontWeight: 600 }}>{type}</span>{' '}
                    <span style={{ color: '#e2e8f0' }}>{info.count}</span>{' '}
                    <span style={{ color: '#64748b' }}>({fmtBytes(info.size)})</span>
                  </div>
                ))}
              </div>
            </Section>
          </div>
        )}

        {/* ===== RESOURCES TAB ===== */}
        {tab === 'resources' && (
          <Section title="资源瀑布图" icon={<BarChart3 size={15} style={{ color: ACCENT }} />}>
            {/* Column headers */}
            <div style={{
              display: 'flex', alignItems: 'center', gap: 8, padding: '4px 0',
              borderBottom: '2px solid rgba(255,255,255,0.08)', marginBottom: 4,
            }}>
              <div style={{ width: 44, fontSize: 9, color: '#64748b', textAlign: 'center', ...mono, flexShrink: 0 }}>类型</div>
              <div style={{ flex: 1, fontSize: 9, color: '#64748b', ...mono }}>名称</div>
              <div style={{ width: 200, fontSize: 9, color: '#64748b', ...mono, flexShrink: 0 }}>耗时分布</div>
              <div style={{ width: 56, fontSize: 9, color: '#64748b', textAlign: 'right', ...mono, flexShrink: 0 }}>耗时</div>
              <div style={{ width: 56, fontSize: 9, color: '#64748b', textAlign: 'right', ...mono, flexShrink: 0 }}>大小</div>
            </div>

            {!resources.length && (
              <div style={{ textAlign: 'center', padding: 28, color: '#64748b', fontSize: 13 }}>
                暂无资源数据，页面加载后自动收集
              </div>
            )}

            {resources
              .slice().sort((a, b) => a.startTime - b.startTime)
              .slice(0, 80)
              .map((r, i) => (
                <WaterfallRow key={i} r={r} maxDur={maxDur} maxStart={maxStart} />
              ))}

            {resources.length > 80 && (
              <div style={{ textAlign: 'center', padding: 8, color: '#64748b', fontSize: 11 }}>
                仅显示前 80 项（共 {resources.length} 项）
              </div>
            )}

            {/* Legend */}
            <div style={{
              display: 'flex', flexWrap: 'wrap', gap: 10, marginTop: 12,
              paddingTop: 10, borderTop: '1px solid rgba(255,255,255,0.06)',
            }}>
              {Object.entries(TYPE_COLORS).map(([type, color]) => (
                <div key={type} style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 10, color: '#94a3b8', ...mono }}>
                  <div style={{ width: 8, height: 8, borderRadius: 2, background: color }} />
                  {type}
                </div>
              ))}
            </div>
          </Section>
        )}

        {/* ===== LONG TASKS TAB ===== */}
        {tab === 'longtasks' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <button
                onClick={monitoring ? stopMonitoring : startMonitoring}
                style={{
                  display: 'flex', alignItems: 'center', gap: 6,
                  padding: '8px 16px', borderRadius: 8, border: 'none',
                  background: monitoring ? ERROR : SUCCESS,
                  color: '#fff', fontSize: 13, fontWeight: 600, cursor: 'pointer', ...sans,
                }}
              >
                {monitoring
                  ? <><AlertTriangle size={14} />停止监测</>
                  : <><Activity size={14} />开始监测长任务</>}
              </button>
              <span style={{ fontSize: 12, color: '#64748b' }}>
                长任务指执行时间 &gt;50ms 的主线程任务
              </span>
            </div>

            <Section title={`已检测长任务 (${longTasks.length})`} icon={<AlertTriangle size={15} style={{ color: WARNING }} />}>
              {!longTasks.length && (
                <div style={{ textAlign: 'center', padding: 28, color: '#64748b', fontSize: 13 }}>
                  {monitoring ? '等待长任务出现...' : '点击上方按钮开始监测'}
                </div>
              )}
              {longTasks.map((t, i) => (
                <div key={i} style={{
                  display: 'flex', alignItems: 'center', gap: 10,
                  padding: '7px 0', borderBottom: '1px solid rgba(255,255,255,0.04)',
                }}>
                  <AlertTriangle size={13} style={{
                    color: t.duration > 200 ? ERROR : WARNING, flexShrink: 0,
                  }} />
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{
                      fontSize: 12, color: '#e2e8f0', ...mono,
                      overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                    }}>{t.name || 'Long Task'}</div>
                    <div style={{ fontSize: 10, color: '#64748b', ...mono }}>
                      开始于 {fmt(t.startTime)}
                    </div>
                  </div>
                  <div style={{
                    fontSize: 14, fontWeight: 700,
                    color: t.duration > 200 ? ERROR : WARNING, ...mono, flexShrink: 0,
                  }}>{fmt(t.duration)}</div>
                </div>
              ))}
            </Section>
          </div>
        )}

        {/* ===== HISTORY TAB ===== */}
        {tab === 'history' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <span style={{ fontSize: 13, color: '#94a3b8' }}>
                历史快照 ({history.length}/{MAX_HISTORY})
              </span>
              <button onClick={clearHistory} style={{
                fontSize: 12, color: ERROR, background: 'rgba(239,68,68,0.1)',
                border: 'none', borderRadius: 6, padding: '4px 12px', cursor: 'pointer', ...sans,
              }}>清除历史</button>
            </div>

            {!history.length && (
              <div style={{ textAlign: 'center', padding: 36, color: '#64748b', fontSize: 13 }}>
                点击顶部"保存快照"按钮来记录性能数据
              </div>
            )}

            {history.length > 0 && (
              <>
                <Section title="性能评分趋势" icon={<BarChart3 size={15} style={{ color: SUCCESS }} />}>
                  <MiniBarChart
                    values={history.map(h => h.score)} labels={history.map(h => h.label)}
                    color={SUCCESS} height={90}
                  />
                </Section>
                <Section title="TTFB 趋势" icon={<Clock size={15} style={{ color: ACCENT }} />}>
                  <MiniBarChart values={history.map(h => h.nav.ttfb)} labels={history.map(h => h.label)} color={ACCENT} />
                </Section>
                <Section title="FCP 趋势" icon={<Zap size={15} style={{ color: WARNING }} />}>
                  <MiniBarChart values={history.map(h => h.paint.fcp)} labels={history.map(h => h.label)} color={WARNING} />
                </Section>
                <Section title="LCP 趋势" icon={<Activity size={15} style={{ color: INFO }} />}>
                  <MiniBarChart values={history.map(h => h.vitals.lcp || 0)} labels={history.map(h => h.label)} color={INFO} />
                </Section>

                <Section title="快照列表" icon={<Clock size={15} style={{ color: '#94a3b8' }} />}>
                  <div style={{ overflowX: 'auto' }}>
                    <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 11, ...mono }}>
                      <thead>
                        <tr style={{ color: '#64748b', borderBottom: '2px solid rgba(255,255,255,0.08)' }}>
                          {['时间', '评分', 'TTFB', 'FCP', 'LCP', 'CLS', 'Load'].map(h => (
                            <th key={h} style={{ textAlign: h === '时间' ? 'left' : 'right', padding: '5px 6px' }}>{h}</th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {history.slice().reverse().map((h, i) => (
                          <tr key={i} style={{ borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
                            <td style={{ padding: '5px 6px', color: '#94a3b8' }}>{h.label}</td>
                            <td style={{ padding: '5px 6px', textAlign: 'right', color: h.score >= 90 ? SUCCESS : h.score >= 50 ? WARNING : ERROR, fontWeight: 600 }}>
                              {h.score}
                            </td>
                            <td style={{ padding: '5px 6px', textAlign: 'right', color: '#e2e8f0' }}>{fmt(h.nav.ttfb)}</td>
                            <td style={{ padding: '5px 6px', textAlign: 'right', color: '#e2e8f0' }}>{fmt(h.paint.fcp)}</td>
                            <td style={{ padding: '5px 6px', textAlign: 'right', color: '#e2e8f0' }}>{h.vitals.lcp > 0 ? fmt(h.vitals.lcp) : '—'}</td>
                            <td style={{ padding: '5px 6px', textAlign: 'right', color: '#e2e8f0' }}>{h.vitals.cls > 0 ? h.vitals.cls.toFixed(3) : '—'}</td>
                            <td style={{ padding: '5px 6px', textAlign: 'right', color: '#e2e8f0' }}>{fmt(h.nav.loadComplete)}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </Section>
              </>
            )}
          </div>
        )}
      </div>
    </div>
  )
}

export default React.memo(WebPerformanceProfilerInner)
