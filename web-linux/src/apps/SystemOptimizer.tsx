import { useState, useEffect, useCallback, useRef } from 'react'

// ─── Types ───────────────────────────────────────────────────────────────────

interface StorageItem {
  key: string
  size: number
  source: 'localStorage' | 'sessionStorage'
  value: string
}

interface CacheEntry {
  name: string
  url: string
  size: number
}

interface CacheInfo {
  name: string
  entries: CacheEntry[]
  totalSize: number
}

interface NavTiming {
  dns: number
  tcp: number
  ttfb: number
  download: number
  domParse: number
  domReady: number
  loadComplete: number
  total: number
}

interface ResourceEntry {
  name: string
  type: string
  duration: number
  size: number
  startTime: number
}

interface PerformanceAudit {
  pageLoadTime: number
  domReadyTime: number
  ttfb: number
  memoryUsed: number
  memoryTotal: number
  memoryPercent: number
  longTasksCount: number
  longTasks: PerformanceEntry[]
  resources: ResourceEntry[]
  navTiming: NavTiming | null
  fps: number
  timestamp: number
}

interface ConnectionInfo {
  effectiveType: string
  downlink: number
  rtt: number
  saveData: boolean
  type: string
}

interface Recommendation {
  id: string
  title: string
  description: string
  severity: 'info' | 'warning' | 'critical'
  category: 'storage' | 'performance' | 'memory' | 'network' | 'startup' | 'cleanup'
  impact: 'low' | 'medium' | 'high'
  action?: string
}

interface BeforeAfter {
  storageBefore: number
  storageAfter: number
  memoryBefore: number
  memoryAfter: number
  itemsBefore: number
  itemsAfter: number
  scoreBefore: number
  scoreAfter: number
}

type TabKey = 'overview' | 'storage' | 'cache' | 'audit' | 'memory' | 'network' | 'startup' | 'cleanup'

// ─── Constants ───────────────────────────────────────────────────────────────

const GREEN = '#22c55e'
const BLUE = '#3b82f6'
const BG = '#0c1220'
const BG_CARD = '#111a2e'
const BORDER = '#1e293b'
const TEXT = '#e2e8f0'
const TEXT_DIM = '#64748b'
const TEXT_MID = '#94a3b8'
const RED = '#ef4444'
const YELLOW = '#eab308'
const ORANGE = '#f97316'
const CYAN = '#06b6d4'
const MONO = "'SF Mono', 'Cascadia Code', 'Fira Code', Consolas, monospace"

// ─── Helpers ─────────────────────────────────────────────────────────────────

const uid = () => Math.random().toString(36).slice(2, 10)
const formatSize = (bytes: number) => bytes < 1024 ? `${bytes}B` : bytes < 1048576 ? `${(bytes / 1024).toFixed(1)}KB` : `${(bytes / 1048576).toFixed(1)}MB`
const formatTime = (ms: number) => ms < 1000 ? `${Math.round(ms)}ms` : `${(ms / 1000).toFixed(2)}s`
const clamp = (v: number, lo: number, hi: number) => Math.max(lo, Math.min(hi, v))

const getByteLength = (str: string): number => {
  try { return new Blob([str]).size } catch { return str.length * 2 }
}

const scoreColor = (score: number) => score >= 80 ? GREEN : score >= 60 ? YELLOW : score >= 40 ? ORANGE : RED

// ─── Sub-components ──────────────────────────────────────────────────────────

function TabBar({ active, onChange }: { active: TabKey; onChange: (k: TabKey) => void }) {
  const tabs: { key: TabKey; label: string; icon: string }[] = [
    { key: 'overview', label: '总览', icon: '◉' },
    { key: 'storage', label: '存储分析', icon: '▣' },
    { key: 'cache', label: '缓存管理', icon: '▤' },
    { key: 'audit', label: '性能审计', icon: '◈' },
    { key: 'memory', label: '内存优化', icon: '◆' },
    { key: 'network', label: '网络优化', icon: '⇌' },
    { key: 'startup', label: '启动优化', icon: '▷' },
    { key: 'cleanup', label: '清理工具', icon: '✦' },
  ]
  return (
    <div style={{ display: 'flex', gap: 2, background: BG, padding: '8px 12px', borderBottom: `1px solid ${BORDER}`, overflowX: 'auto' }}>
      {tabs.map(t => (
        <button key={t.key} onClick={() => onChange(t.key)} style={{
          display: 'flex', alignItems: 'center', gap: 6, padding: '6px 14px',
          background: active === t.key ? `${BLUE}22` : 'transparent',
          border: active === t.key ? `1px solid ${BLUE}44` : '1px solid transparent',
          borderRadius: 6, cursor: 'pointer', fontSize: 13, fontWeight: active === t.key ? 600 : 400,
          color: active === t.key ? BLUE : TEXT_MID, whiteSpace: 'nowrap', transition: 'all 0.2s',
        }}>
          <span style={{ fontSize: 10 }}>{t.icon}</span>{t.label}
        </button>
      ))}
    </div>
  )
}

function Card({ title, children, accent, rightHeader }: { title: string; children: React.ReactNode; accent?: string; rightHeader?: React.ReactNode }) {
  return (
    <div style={{ background: BG_CARD, borderRadius: 10, border: `1px solid ${BORDER}`, overflow: 'hidden', marginBottom: 12 }}>
      <div style={{
        display: 'flex', justifyContent: 'space-between', alignItems: 'center',
        padding: '10px 16px', borderBottom: `1px solid ${BORDER}`,
        background: `${accent || BLUE}08`,
      }}>
        <span style={{ fontSize: 14, fontWeight: 600, color: TEXT, fontFamily: MONO }}>{title}</span>
        {rightHeader}
      </div>
      <div style={{ padding: 16 }}>{children}</div>
    </div>
  )
}

function ProgressBar({ value, max, color, height = 8, label }: { value: number; max: number; color: string; height?: number; label?: string }) {
  const pct = clamp((value / max) * 100, 0, 100)
  return (
    <div>
      <div style={{ width: '100%', height, borderRadius: height / 2, background: `${BORDER}`, overflow: 'hidden' }}>
        <div style={{
          width: `${pct}%`, height: '100%', borderRadius: height / 2,
          background: `linear-gradient(90deg, ${color}, ${color}cc)`,
          transition: 'width 0.5s ease',
        }} />
      </div>
      {label && <div style={{ fontSize: 11, color: TEXT_DIM, marginTop: 2 }}>{label}</div>}
    </div>
  )
}

function HealthGauge({ score, size = 140 }: { score: number; size?: number }) {
  const radius = (size - 16) / 2
  const circumference = 2 * Math.PI * radius
  const offset = circumference - (score / 100) * circumference
  const color = scoreColor(score)
  return (
    <div style={{ textAlign: 'center' }}>
      <div style={{ position: 'relative', width: size, height: size, margin: '0 auto' }}>
        <svg width={size} height={size} style={{ transform: 'rotate(-90deg)' }}>
          <circle cx={size / 2} cy={size / 2} r={radius} fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth="10" />
          <circle cx={size / 2} cy={size / 2} r={radius} fill="none" stroke={color} strokeWidth="10"
            strokeDasharray={circumference} strokeDashoffset={offset} strokeLinecap="round"
            style={{ transition: 'stroke-dashoffset 0.6s ease, stroke 0.3s ease' }} />
        </svg>
        <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
          <div style={{ fontSize: 32, fontWeight: 800, color, fontFamily: MONO }}>{score}</div>
          <div style={{ fontSize: 10, color: TEXT_DIM, marginTop: 1 }}>健康评分</div>
        </div>
      </div>
    </div>
  )
}

function StatusIcon({ ok }: { ok: boolean }) {
  return <span style={{ color: ok ? GREEN : RED, fontSize: 14 }}>{ok ? '✓' : '✗'}</span>
}

// ─── Main Component ──────────────────────────────────────────────────────────

export default function SystemOptimizer() {
  const [activeTab, setActiveTab] = useState<TabKey>('overview')

  // ── Storage ──
  const [storageItems, setStorageItems] = useState<StorageItem[]>([])
  const [storageTotal, setStorageTotal] = useState(0)
  const [selectedStorageKey, setSelectedStorageKey] = useState<string | null>(null)

  // ── Cache ──
  const [caches, setCaches] = useState<CacheInfo[]>([])
  const [cacheLoading, setCacheLoading] = useState(false)

  // ── Performance Audit ──
  const [audit, setAudit] = useState<PerformanceAudit | null>(null)
  const [isAuditing, setIsAuditing] = useState(false)
  const [fpsHistory, setFpsHistory] = useState<number[]>([])
  const rafRef = useRef<number | null>(null)

  // ── Memory ──
  const [memoryInfo, setMemoryInfo] = useState({ used: 0, total: 0, percent: 0 })

  // ── Network ──
  const [connectionInfo, setConnectionInfo] = useState<ConnectionInfo | null>(null)

  // ── Startup ──
  const [startupMetrics, setStartupMetrics] = useState<NavTiming | null>(null)
  const [resourceWaterfall, setResourceWaterfall] = useState<ResourceEntry[]>([])

  // ── Health Score ──
  const [healthScore, setHealthScore] = useState(0)

  // ── Recommendations ──
  const [recommendations, setRecommendations] = useState<Recommendation[]>([])

  // ── Before/After ──
  const [beforeAfter, setBeforeAfter] = useState<BeforeAfter | null>(null)
  const [isOptimizing, setIsOptimizing] = useState(false)

  // ──────────── Scan Storage ────────────

  const scanStorage = useCallback(() => {
    const items: StorageItem[] = []
    let total = 0

    try {
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i)
        if (key) {
          const val = localStorage.getItem(key) || ''
          const size = getByteLength(key) + getByteLength(val)
          items.push({ key, size, source: 'localStorage', value: val })
          total += size
        }
      }
    } catch { /* ignore */ }

    try {
      for (let i = 0; i < sessionStorage.length; i++) {
        const key = sessionStorage.key(i)
        if (key) {
          const val = sessionStorage.getItem(key) || ''
          const size = getByteLength(key) + getByteLength(val)
          items.push({ key, size, source: 'sessionStorage', value: val })
          total += size
        }
      }
    } catch { /* ignore */ }

    items.sort((a, b) => b.size - a.size)
    setStorageItems(items)
    setStorageTotal(total)
  }, [])

  // ──────────── Scan Caches ────────────

  const scanCaches = useCallback(async () => {
    setCacheLoading(true)
    try {
      if ('caches' in window) {
        const cacheNames = await caches.keys()
        const results: CacheInfo[] = []
        for (const name of cacheNames) {
          try {
            const cache = await caches.open(name)
            const keys = await cache.keys()
            const entries: CacheEntry[] = []
            let totalSize = 0
            for (const req of keys.slice(0, 50)) {
              try {
                const response = await cache.match(req)
                const size = response ? parseInt(response.headers.get('content-length') || '0') : 0
                entries.push({ name: req.url.split('/').pop() || req.url, url: req.url, size })
                totalSize += size
              } catch { /* ignore */ }
            }
            results.push({ name, entries, totalSize })
          } catch { /* ignore */ }
        }
        setCaches(results)
      }
    } catch { /* ignore */ }
    setCacheLoading(false)
  }, [])

  // ──────────── FPS Measurement ────────────

  const measureFps = useCallback((): Promise<number> => {
    return new Promise(resolve => {
      let frames = 0
      const start = performance.now()
      const count = () => {
        frames++
        if (performance.now() - start >= 1000) resolve(Math.round(frames))
        else requestAnimationFrame(count)
      }
      requestAnimationFrame(count)
    })
  }, [])

  // ──────────── Performance Audit ────────────

  const runAudit = useCallback(async () => {
    setIsAuditing(true)
    const now = performance.now()

    // Nav timing
    let navTiming: NavTiming | null = null
    try {
      const navEntries = performance.getEntriesByType('navigation') as PerformanceNavigationTiming[]
      if (navEntries.length > 0) {
        const nav = navEntries[0]
        navTiming = {
          dns: nav.domainLookupEnd - nav.domainLookupStart,
          tcp: nav.connectEnd - nav.connectStart,
          ttfb: nav.responseStart - nav.requestStart,
          download: nav.responseEnd - nav.responseStart,
          domParse: nav.domInteractive - nav.responseEnd,
          domReady: nav.domContentLoadedEventEnd - nav.startTime,
          loadComplete: nav.loadEventEnd - nav.startTime,
          total: nav.loadEventEnd - nav.startTime,
        }
      }
    } catch { /* ignore */ }

    // Memory
    const perfAny = performance as unknown as { memory?: { usedJSHeapSize: number; totalJSHeapSize: number; jsHeapSizeLimit: number } }
    let memUsed = 0, memTotal = 0, memPct = 0
    if (perfAny.memory) {
      memUsed = Math.round(perfAny.memory.usedJSHeapSize / 1024 / 1024)
      memTotal = Math.round(perfAny.memory.jsHeapSizeLimit / 1024 / 1024)
      memPct = Math.round((perfAny.memory.usedJSHeapSize / perfAny.memory.jsHeapSizeLimit) * 100)
      setMemoryInfo({ used: memUsed, total: memTotal, percent: memPct })
    }

    // Long tasks
    let longTasks: PerformanceEntry[] = []
    try {
      longTasks = performance.getEntriesByType('longtask')
    } catch { /* ignore */ }

    // Resources
    const resources: ResourceEntry[] = []
    try {
      const resEntries = performance.getEntriesByType('resource') as PerformanceResourceTiming[]
      for (const r of resEntries.slice(-50)) {
        resources.push({
          name: r.name.split('/').pop() || r.name,
          type: r.initiatorType || 'unknown',
          duration: Math.round(r.duration),
          size: r.transferSize || 0,
          startTime: Math.round(r.startTime),
        })
      }
      resources.sort((a, b) => a.startTime - b.startTime)
    } catch { /* ignore */ }

    // FPS
    const fps = await measureFps()
    setFpsHistory(prev => [...prev.slice(-29), fps])

    const result: PerformanceAudit = {
      pageLoadTime: navTiming ? navTiming.total : 0,
      domReadyTime: navTiming ? navTiming.domReady : 0,
      ttfb: navTiming ? navTiming.ttfb : 0,
      memoryUsed: memUsed,
      memoryTotal: memTotal,
      memoryPercent: memPct,
      longTasksCount: longTasks.length,
      longTasks: longTasks.slice(-10),
      resources,
      navTiming,
      fps,
      timestamp: Date.now(),
    }
    setAudit(result)
    setIsAuditing(false)
  }, [measureFps])

  // ──────────── Compute Health Score ────────────

  const computeScore = useCallback((): number => {
    let score = 100

    // Storage factor
    if (storageTotal > 2 * 1024 * 1024) score -= 10
    else if (storageTotal > 1024 * 1024) score -= 5

    // Memory factor
    if (memoryInfo.percent > 80) score -= 20
    else if (memoryInfo.percent > 60) score -= 10
    else if (memoryInfo.percent > 40) score -= 5

    // FPS factor
    const lastFps = fpsHistory.length > 0 ? fpsHistory[fpsHistory.length - 1] : 60
    if (lastFps < 30) score -= 20
    else if (lastFps < 50) score -= 10

    // Audit factors
    if (audit) {
      if (audit.pageLoadTime > 3000) score -= 10
      else if (audit.pageLoadTime > 1500) score -= 5
      if (audit.longTasksCount > 5) score -= 10
      else if (audit.longTasksCount > 2) score -= 5
      if (audit.resources.length > 40) score -= 5
    }

    return clamp(Math.round(score), 0, 100)
  }, [storageTotal, memoryInfo, fpsHistory, audit])

  // ──────────── Generate Recommendations ────────────

  const generateRecs = useCallback((): Recommendation[] => {
    const recs: Recommendation[] = []

    if (storageTotal > 2 * 1024 * 1024) {
      recs.push({ id: 'r-storage', title: '存储空间过大', description: `总存储占用 ${formatSize(storageTotal)}，超过 2MB 建议值`, severity: 'warning', category: 'storage', impact: 'medium', action: '清理大型或过期存储项' })
    }
    if (storageItems.length > 50) {
      recs.push({ id: 'r-items', title: '存储项过多', description: `共 ${storageItems.length} 个存储项，可能影响查询性能`, severity: 'info', category: 'storage', impact: 'low', action: '清理不再使用的存储项' })
    }

    if (memoryInfo.percent > 80) {
      recs.push({ id: 'r-mem', title: '内存使用率过高', description: `JS 堆内存 ${memoryInfo.percent}%，有泄漏风险`, severity: 'critical', category: 'memory', impact: 'high', action: '清理缓存或刷新页面' })
    } else if (memoryInfo.percent > 60) {
      recs.push({ id: 'r-mem2', title: '内存使用率偏高', description: `当前 ${memoryInfo.percent}%，建议关注增长趋势`, severity: 'warning', category: 'memory', impact: 'medium' })
    }

    const lastFps = fpsHistory.length > 0 ? fpsHistory[fpsHistory.length - 1] : 60
    if (lastFps < 30) {
      recs.push({ id: 'r-fps', title: '帧率严重不足', description: `仅 ${lastFps} FPS，严重影响交互体验`, severity: 'critical', category: 'performance', impact: 'high', action: '减少 DOM 操作和动画' })
    } else if (lastFps < 50) {
      recs.push({ id: 'r-fps2', title: '帧率偏低', description: `${lastFps} FPS，低于 60 标准`, severity: 'warning', category: 'performance', impact: 'medium' })
    }

    if (connectionInfo && (connectionInfo.effectiveType === '2g' || connectionInfo.effectiveType === 'slow-2g')) {
      recs.push({ id: 'r-net', title: '网络连接缓慢', description: `当前 ${connectionInfo.effectiveType}，建议减少资源请求`, severity: 'warning', category: 'network', impact: 'medium', action: '启用数据压缩和懒加载' })
    }

    if (audit && audit.pageLoadTime > 3000) {
      recs.push({ id: 'r-start', title: '页面加载过慢', description: `加载耗时 ${formatTime(audit.pageLoadTime)}，超过 3 秒`, severity: 'warning', category: 'startup', impact: 'high', action: '优化关键渲染路径，代码分割' })
    }

    if (audit && audit.longTasksCount > 3) {
      recs.push({ id: 'r-lt', title: '主线程阻塞', description: `检测到 ${audit.longTasksCount} 个长任务 (>50ms)`, severity: 'warning', category: 'performance', impact: 'medium', action: '将长计算拆分为小块' })
    }

    if (caches.length > 5) {
      recs.push({ id: 'r-cache', title: '缓存数量过多', description: `${caches.length} 个 Service Worker 缓存`, severity: 'info', category: 'cleanup', impact: 'low', action: '清理旧版缓存' })
    }

    if (recs.length === 0) {
      recs.push({ id: 'r-ok', title: '系统状态良好', description: '所有指标均在正常范围', severity: 'info', category: 'performance', impact: 'low' })
    }

    return recs
  }, [storageTotal, storageItems, memoryInfo, fpsHistory, connectionInfo, audit, caches])

  // ──────────── Cleanup Actions ────────────

  const performCleanup = useCallback(async () => {
    setIsOptimizing(true)
    const scoreBefore = healthScore
    const memBefore = memoryInfo.percent
    const itemsBefore = storageItems.length
    const storageBefore = storageTotal

    // 1. Clear sessionStorage
    try { sessionStorage.clear() } catch { /* ignore */ }

    // 2. Remove large localStorage items (>100KB)
    try {
      for (let i = localStorage.length - 1; i >= 0; i--) {
        const key = localStorage.key(i)
        if (key) {
          const val = localStorage.getItem(key) || ''
          if (getByteLength(val) > 100 * 1024) {
            localStorage.removeItem(key)
          }
        }
      }
    } catch { /* ignore */ }

    // 3. Remove duplicate entries (same value)
    try {
      const seen = new Map<string, string[]>()
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i)
        if (key) {
          const val = localStorage.getItem(key) || ''
          const existing = seen.get(val)
          if (existing) existing.push(key)
          else seen.set(val, [key])
        }
      }
      for (const [, keys] of seen) {
        if (keys.length > 1) {
          for (let i = 1; i < keys.length; i++) {
            localStorage.removeItem(keys[i])
          }
        }
      }
    } catch { /* ignore */ }

    // 4. Clear old caches
    try {
      if ('caches' in window) {
        const keys = await caches.keys()
        for (const key of keys) {
          if (key.includes('old') || key.includes('v1') || key.includes('temp')) {
            await caches.delete(key)
          }
        }
      }
    } catch { /* ignore */ }

    // Re-scan
    scanStorage()
    await scanCaches()

    const memAfter = (performance as unknown as { memory?: { usedJSHeapSize: number; jsHeapSizeLimit: number } }).memory
      ? Math.round(((performance as unknown as { memory: { usedJSHeapSize: number; jsHeapSizeLimit: number } }).memory.usedJSHeapSize / (performance as unknown as { memory: { usedJSHeapSize: number; jsHeapSizeLimit: number } }).memory.jsHeapSizeLimit) * 100)
      : 0

    setIsOptimizing(false)

    // Recompute score after cleanup
    setTimeout(() => {
      setBeforeAfter({
        storageBefore, storageAfter: storageTotal,
        memoryBefore: memBefore, memoryAfter: memAfter,
        itemsBefore, itemsAfter: storageItems.length,
        scoreBefore, scoreAfter: healthScore,
      })
    }, 100)
  }, [healthScore, memoryInfo, storageItems, storageTotal, scanStorage, scanCaches])

  // ──────────── Clear specific cache ────────────

  const clearCache = useCallback(async (name: string) => {
    try {
      if ('caches' in window) {
        await caches.delete(name)
        await scanCaches()
      }
    } catch { /* ignore */ }
  }, [scanCaches])

  // ──────────── Delete storage item ────────────

  const deleteStorageItem = useCallback((item: StorageItem) => {
    try {
      if (item.source === 'localStorage') localStorage.removeItem(item.key)
      else sessionStorage.removeItem(item.key)
      scanStorage()
    } catch { /* ignore */ }
  }, [scanStorage])

  // ──────────── Initialize ────────────

  useEffect(() => {
    scanStorage()
    scanCaches()
    runAudit()

    // Connection info
    const nav = navigator as Navigator & { connection?: { effectiveType?: string; downlink?: number; rtt?: number; saveData?: boolean; type?: string } }
    if (nav.connection) {
      setConnectionInfo({
        effectiveType: nav.connection.effectiveType || 'unknown',
        downlink: nav.connection.downlink || 0,
        rtt: nav.connection.rtt || 0,
        saveData: nav.connection.saveData || false,
        type: nav.connection.type || 'unknown',
      })
    }

    // Startup metrics
    try {
      const navEntries = performance.getEntriesByType('navigation') as PerformanceNavigationTiming[]
      if (navEntries.length > 0) {
        const nav = navEntries[0]
        setStartupMetrics({
          dns: nav.domainLookupEnd - nav.domainLookupStart,
          tcp: nav.connectEnd - nav.connectStart,
          ttfb: nav.responseStart - nav.requestStart,
          download: nav.responseEnd - nav.responseStart,
          domParse: nav.domInteractive - nav.responseEnd,
          domReady: nav.domContentLoadedEventEnd - nav.startTime,
          loadComplete: nav.loadEventEnd - nav.startTime,
          total: nav.loadEventEnd - nav.startTime,
        })
      }
    } catch { /* ignore */ }

    // Resource waterfall
    try {
      const resEntries = performance.getEntriesByType('resource') as PerformanceResourceTiming[]
      const waterfall: ResourceEntry[] = resEntries.slice(-30).map(r => ({
        name: r.name.split('/').pop() || r.name,
        type: r.initiatorType || 'unknown',
        duration: Math.round(r.duration),
        size: r.transferSize || 0,
        startTime: Math.round(r.startTime),
      }))
      waterfall.sort((a, b) => a.startTime - b.startTime)
      setResourceWaterfall(waterfall)
    } catch { /* ignore */ }
  }, [scanStorage, scanCaches, runAudit])

  // ──────────── Periodic FPS measurement ────────────

  useEffect(() => {
    const interval = setInterval(async () => {
      const fps = await measureFps()
      setFpsHistory(prev => [...prev.slice(-29), fps])
    }, 2000)
    return () => clearInterval(interval)
  }, [measureFps])

  // ──────────── Update health score & recommendations ────────────

  useEffect(() => {
    const score = computeScore()
    setHealthScore(score)
    setRecommendations(generateRecs())
  }, [computeScore, generateRecs])

  // ──────────── Storage usage estimate ────────────

  const [storageEstimate, setStorageEstimate] = useState({ usage: 0, quota: 0 })

  useEffect(() => {
    if ('storage' in navigator && 'estimate' in navigator.storage) {
      navigator.storage.estimate().then(est => {
        setStorageEstimate({ usage: est.usage || 0, quota: est.quota || 0 })
      }).catch(() => {})
    }
  }, [])

  // ─── Render ───

  const renderOverview = () => (
    <div>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 16 }}>
        {/* Health Score */}
        <div style={{ background: BG_CARD, borderRadius: 12, border: `1px solid ${BORDER}`, padding: 20, display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
          <HealthGauge score={healthScore} size={160} />
          <div style={{ marginTop: 8, fontSize: 13, color: scoreColor(healthScore), fontWeight: 600 }}>
            {healthScore >= 80 ? '系统健康' : healthScore >= 60 ? '需要关注' : healthScore >= 40 ? '性能较差' : '严重异常'}
          </div>
        </div>

        {/* Quick Stats */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
          {[
            { label: '存储占用', value: formatSize(storageTotal), color: storageTotal > 1024 * 1024 ? YELLOW : GREEN },
            { label: '内存使用', value: `${memoryInfo.percent}%`, color: memoryInfo.percent > 70 ? YELLOW : GREEN },
            { label: '帧率', value: `${fpsHistory.length > 0 ? fpsHistory[fpsHistory.length - 1] : '-'} FPS`, color: (fpsHistory.length > 0 ? fpsHistory[fpsHistory.length - 1] : 60) < 50 ? YELLOW : GREEN },
            { label: '存储项数', value: String(storageItems.length), color: storageItems.length > 50 ? YELLOW : GREEN },
            { label: '缓存数', value: String(caches.length), color: caches.length > 5 ? YELLOW : GREEN },
            { label: '网络类型', value: connectionInfo?.effectiveType || 'N/A', color: BLUE },
          ].map(s => (
            <div key={s.label} style={{ background: BG_CARD, borderRadius: 8, border: `1px solid ${BORDER}`, padding: 10, textAlign: 'center' }}>
              <div style={{ fontSize: 18, fontWeight: 700, color: s.color, fontFamily: MONO }}>{s.value}</div>
              <div style={{ fontSize: 11, color: TEXT_DIM, marginTop: 2 }}>{s.label}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Recommendations */}
      <Card title="智能建议" accent={GREEN}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {recommendations.slice(0, 5).map(r => (
            <div key={r.id} style={{ display: 'flex', gap: 10, padding: '8px 12px', background: BG, borderRadius: 8, border: `1px solid ${BORDER}` }}>
              <span style={{ fontSize: 16 }}>{r.severity === 'critical' ? '🔴' : r.severity === 'warning' ? '🟡' : '🟢'}</span>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 13, fontWeight: 600, color: TEXT }}>{r.title}</div>
                <div style={{ fontSize: 11, color: TEXT_MID, marginTop: 2 }}>{r.description}</div>
                {r.action && <div style={{ fontSize: 11, color: BLUE, marginTop: 2 }}>→ {r.action}</div>}
              </div>
              <span style={{ fontSize: 10, padding: '2px 6px', borderRadius: 3, background: `${r.impact === 'high' ? RED : r.impact === 'medium' ? YELLOW : GREEN}15`, color: r.impact === 'high' ? RED : r.impact === 'medium' ? YELLOW : GREEN, alignSelf: 'flex-start' }}>
                {r.impact === 'high' ? '高' : r.impact === 'medium' ? '中' : '低'}
              </span>
            </div>
          ))}
        </div>
      </Card>

      {/* Before/After */}
      {beforeAfter && (
        <Card title="优化前后对比" accent={BLUE}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 12, textAlign: 'center' }}>
            {[
              { label: '健康评分', before: beforeAfter.scoreBefore, after: beforeAfter.scoreAfter, unit: '' },
              { label: '存储大小', before: beforeAfter.storageBefore, after: beforeAfter.storageAfter, unit: 'B', format: true },
              { label: '内存%', before: beforeAfter.memoryBefore, after: beforeAfter.memoryAfter, unit: '%' },
              { label: '存储项数', before: beforeAfter.itemsBefore, after: beforeAfter.itemsAfter, unit: '' },
            ].map(m => {
              const improved = m.after < m.before || (m.label === '健康评分' && m.after > m.before)
              return (
                <div key={m.label}>
                  <div style={{ fontSize: 11, color: TEXT_DIM, marginBottom: 4 }}>{m.label}</div>
                  <div style={{ fontSize: 13, color: TEXT_DIM, textDecoration: 'line-through' }}>{m.format ? formatSize(m.before) : `${m.before}${m.unit}`}</div>
                  <div style={{ fontSize: 18, fontWeight: 700, color: improved ? GREEN : RED }}>{m.format ? formatSize(m.after) : `${m.after}${m.unit}`}</div>
                </div>
              )
            })}
          </div>
        </Card>
      )}
    </div>
  )

  const renderStorage = () => (
    <div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 8, marginBottom: 12 }}>
        <div style={{ background: BG_CARD, borderRadius: 8, border: `1px solid ${BORDER}`, padding: 12, textAlign: 'center' }}>
          <div style={{ fontSize: 20, fontWeight: 700, color: GREEN, fontFamily: MONO }}>{formatSize(storageTotal)}</div>
          <div style={{ fontSize: 11, color: TEXT_DIM }}>总占用</div>
        </div>
        <div style={{ background: BG_CARD, borderRadius: 8, border: `1px solid ${BORDER}`, padding: 12, textAlign: 'center' }}>
          <div style={{ fontSize: 20, fontWeight: 700, color: BLUE, fontFamily: MONO }}>{storageItems.length}</div>
          <div style={{ fontSize: 11, color: TEXT_DIM }}>存储项数</div>
        </div>
        <div style={{ background: BG_CARD, borderRadius: 8, border: `1px solid ${BORDER}`, padding: 12, textAlign: 'center' }}>
          <div style={{ fontSize: 20, fontWeight: 700, color: CYAN, fontFamily: MONO }}>
            {storageEstimate.quota > 0 ? `${((storageEstimate.usage / storageEstimate.quota) * 100).toFixed(1)}%` : 'N/A'}
          </div>
          <div style={{ fontSize: 11, color: TEXT_DIM }}>配额使用</div>
        </div>
      </div>

      {storageEstimate.quota > 0 && (
        <div style={{ marginBottom: 12 }}>
          <ProgressBar
            value={storageEstimate.usage}
            max={storageEstimate.quota}
            color={storageEstimate.usage / storageEstimate.quota > 0.8 ? RED : storageEstimate.usage / storageEstimate.quota > 0.5 ? YELLOW : GREEN}
            height={10}
            label={`${formatSize(storageEstimate.usage)} / ${formatSize(storageEstimate.quota)}`}
          />
        </div>
      )}

      <div style={{ background: BG_CARD, borderRadius: 8, border: `1px solid ${BORDER}`, overflow: 'hidden' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12, fontFamily: MONO }}>
          <thead>
            <tr style={{ borderBottom: `1px solid ${BORDER}`, background: `${BLUE}08` }}>
              {['键名', '大小', '来源', '值预览', '操作'].map(h => (
                <th key={h} style={{ padding: '8px 6px', textAlign: 'left', color: TEXT_DIM, fontWeight: 500 }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {storageItems.slice(0, 30).map(item => (
              <tr key={`${item.source}-${item.key}`} style={{ borderBottom: `1px solid ${BORDER}33` }}>
                <td style={{ padding: '4px 6px', color: CYAN, maxWidth: 200, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{item.key}</td>
                <td style={{ padding: '4px 6px', color: item.size > 100 * 1024 ? RED : item.size > 10 * 1024 ? YELLOW : TEXT_MID }}>
                  {formatSize(item.size)}
                </td>
                <td style={{ padding: '4px 6px' }}>
                  <span style={{ padding: '1px 6px', borderRadius: 3, fontSize: 10, background: item.source === 'localStorage' ? `${GREEN}15` : `${ORANGE}15`, color: item.source === 'localStorage' ? GREEN : ORANGE }}>
                    {item.source === 'localStorage' ? 'LS' : 'SS'}
                  </span>
                </td>
                <td style={{ padding: '4px 6px', color: TEXT_DIM, maxWidth: 200, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {item.value.slice(0, 50)}
                </td>
                <td style={{ padding: '4px 6px' }}>
                  <button onClick={() => deleteStorageItem(item)} style={{ padding: '2px 8px', fontSize: 10, borderRadius: 4, background: `${RED}22`, color: RED, border: `1px solid ${RED}44`, cursor: 'pointer' }}>删除</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {storageItems.length > 30 && <div style={{ padding: 8, textAlign: 'center', fontSize: 11, color: TEXT_DIM }}>... 还有 {storageItems.length - 30} 项</div>}
      </div>
    </div>
  )

  const renderCache = () => (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
        <span style={{ fontSize: 13, color: TEXT_MID }}>{caches.length} 个 Service Worker 缓存</span>
        <button onClick={scanCaches} disabled={cacheLoading} style={{ padding: '4px 12px', fontSize: 12, borderRadius: 6, background: `${BLUE}22`, color: BLUE, border: `1px solid ${BLUE}44`, cursor: 'pointer' }}>
          {cacheLoading ? '扫描中...' : '刷新'}
        </button>
      </div>
      {caches.length === 0 ? (
        <div style={{ padding: 30, textAlign: 'center', color: TEXT_DIM, background: BG_CARD, borderRadius: 8, border: `1px solid ${BORDER}` }}>
          未检测到 Service Worker 缓存
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {caches.map(cache => (
            <div key={cache.name} style={{ background: BG_CARD, borderRadius: 8, border: `1px solid ${BORDER}`, padding: 12 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                <div>
                  <span style={{ fontSize: 14, fontWeight: 600, color: TEXT, fontFamily: MONO }}>{cache.name}</span>
                  <span style={{ marginLeft: 10, fontSize: 12, color: TEXT_MID }}>{cache.entries.length} 条目 | {formatSize(cache.totalSize)}</span>
                </div>
                <button onClick={() => clearCache(cache.name)} style={{ padding: '3px 10px', fontSize: 11, borderRadius: 5, background: `${RED}22`, color: RED, border: `1px solid ${RED}44`, cursor: 'pointer' }}>清除</button>
              </div>
              <div style={{ maxHeight: 100, overflow: 'auto', fontSize: 11, fontFamily: MONO }}>
                {cache.entries.map((entry, i) => (
                  <div key={i} style={{ padding: '2px 0', color: TEXT_DIM, borderBottom: `1px solid ${BORDER}22` }}>
                    <span style={{ color: CYAN }}>{entry.name}</span>
                    {entry.size > 0 && <span style={{ marginLeft: 8, color: TEXT_DIM }}>({formatSize(entry.size)})</span>}
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )

  const renderAudit = () => (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
        <span style={{ fontSize: 13, color: TEXT_MID }}>
          {audit ? `上次审计: ${new Date(audit.timestamp).toLocaleTimeString('zh-CN', { hour12: false })}` : '尚未审计'}
        </span>
        <button onClick={runAudit} disabled={isAuditing} style={{ padding: '6px 16px', fontSize: 12, borderRadius: 6, background: `${GREEN}22`, color: GREEN, border: `1px solid ${GREEN}44`, cursor: 'pointer', fontWeight: 600 }}>
          {isAuditing ? '审计中...' : '▶ 运行审计'}
        </button>
      </div>

      {audit && (
        <>
          {/* Key Metrics */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(150px, 1fr))', gap: 8, marginBottom: 12 }}>
            {[
              { label: '页面加载', value: formatTime(audit.pageLoadTime), ok: audit.pageLoadTime < 3000, icon: '⏱' },
              { label: 'DOM 就绪', value: formatTime(audit.domReadyTime), ok: audit.domReadyTime < 1500, icon: '🏗' },
              { label: 'TTFB', value: formatTime(audit.ttfb), ok: audit.ttfb < 600, icon: '⚡' },
              { label: 'FPS', value: `${audit.fps}`, ok: audit.fps >= 50, icon: '🎬' },
              { label: '内存使用', value: `${audit.memoryPercent}%`, ok: audit.memoryPercent < 70, icon: '💾' },
              { label: '长任务', value: `${audit.longTasksCount}`, ok: audit.longTasksCount <= 2, icon: '⚠' },
              { label: '资源数', value: `${audit.resources.length}`, ok: audit.resources.length < 40, icon: '📦' },
              { label: '内存(MB)', value: `${audit.memoryUsed}/${audit.memoryTotal}`, ok: audit.memoryPercent < 70, icon: '🧮' },
            ].map(m => (
              <div key={m.label} style={{ background: BG_CARD, borderRadius: 8, border: `1px solid ${m.ok ? GREEN : RED}33`, padding: 10 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontSize: 11, color: TEXT_DIM }}>{m.icon} {m.label}</span>
                  <StatusIcon ok={m.ok} />
                </div>
                <div style={{ fontSize: 18, fontWeight: 700, color: m.ok ? GREEN : RED, fontFamily: MONO, marginTop: 4 }}>{m.value}</div>
              </div>
            ))}
          </div>

          {/* FPS Chart */}
          <Card title="帧率趋势 (FPS)">
            <div style={{ height: 60, position: 'relative' }}>
              {fpsHistory.length > 1 && (() => {
                const max = Math.max(...fpsHistory, 60)
                return (
                  <svg width="100%" height={60} style={{ display: 'block' }}>
                    <polyline
                      fill="none"
                      stroke={GREEN}
                      strokeWidth={2}
                      points={fpsHistory.map((v, i) => `${(i / (fpsHistory.length - 1)) * 100}%,${60 - (v / max) * 55}`).join(' ')}
                    />
                    <line x1="0" y1={60 - (60 / max) * 55} x2="100%" y2={60 - (60 / max) * 55} stroke={`${YELLOW}44`} strokeWidth={1} strokeDasharray="4 4" />
                  </svg>
                )
              })()}
            </div>
          </Card>

          {/* Resource Waterfall */}
          {resourceWaterfall.length > 0 && (
            <Card title="资源加载瀑布流">
              <div style={{ maxHeight: 250, overflow: 'auto' }}>
                {resourceWaterfall.slice(0, 20).map((r, i) => {
                  const maxStart = Math.max(...resourceWaterfall.slice(0, 20).map(x => x.startTime + x.duration), 1)
                  const leftPct = (r.startTime / maxStart) * 100
                  const widthPct = Math.max((r.duration / maxStart) * 100, 0.5)
                  const typeColor = r.type === 'script' ? YELLOW : r.type === 'css' ? CYAN : r.type === 'img' ? GREEN : r.type === 'fetch' ? ORANGE : TEXT_DIM
                  return (
                    <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '2px 0', fontSize: 10, fontFamily: MONO }}>
                      <span style={{ width: 30, color: TEXT_DIM, textAlign: 'right' }}>{i + 1}</span>
                      <span style={{ width: 120, color: typeColor, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{r.name}</span>
                      <div style={{ flex: 1, height: 8, borderRadius: 4, background: `${BORDER}`, position: 'relative' }}>
                        <div style={{ position: 'absolute', left: `${leftPct}%`, width: `${widthPct}%`, height: '100%', borderRadius: 4, background: typeColor, minWidth: 2 }} />
                      </div>
                      <span style={{ width: 50, color: TEXT_DIM, textAlign: 'right' }}>{r.duration}ms</span>
                    </div>
                  )
                })}
              </div>
            </Card>
          )}

          {/* Long Tasks */}
          {audit.longTasks.length > 0 && (
            <Card title={"长任务 (>50ms)"} accent={RED}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                {audit.longTasks.map((t, i) => (
                  <div key={i} style={{ padding: '4px 8px', background: `${RED}08`, borderRadius: 4, fontSize: 12, fontFamily: MONO, color: TEXT_MID }}>
                    ⚠ 耗时 {Math.round(t.duration)}ms @ {Math.round(t.startTime)}ms
                  </div>
                ))}
              </div>
            </Card>
          )}
        </>
      )}
    </div>
  )

  const renderMemory = () => (
    <div>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 12 }}>
        <Card title="内存使用">
          <div style={{ textAlign: 'center', marginBottom: 12 }}>
            <div style={{ fontSize: 36, fontWeight: 800, color: scoreColor(100 - memoryInfo.percent), fontFamily: MONO }}>
              {memoryInfo.percent}%
            </div>
            <div style={{ fontSize: 12, color: TEXT_DIM }}>{memoryInfo.used}MB / {memoryInfo.total}MB</div>
          </div>
          <ProgressBar value={memoryInfo.percent} max={100} color={memoryInfo.percent > 70 ? RED : memoryInfo.percent > 50 ? YELLOW : GREEN} height={12} />
        </Card>
        <Card title="优化操作">
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            <button onClick={() => { try { (performance as any).gc?.() } catch { /* only in Chrome with flag */ } }} style={{
              padding: '10px 16px', fontSize: 13, borderRadius: 8, cursor: 'pointer',
              background: `${GREEN}15`, color: GREEN, border: `1px solid ${GREEN}33`, textAlign: 'left',
            }}>
              ♻ 强制 GC 提示 <span style={{ fontSize: 10, color: TEXT_DIM, display: 'block', marginTop: 2 }}>需要 Chrome --expose-gc 标志</span>
            </button>
            <button onClick={() => { try { sessionStorage.clear() } catch { /* ignore */ }; scanStorage() }} style={{
              padding: '10px 16px', fontSize: 13, borderRadius: 8, cursor: 'pointer',
              background: `${BLUE}15`, color: BLUE, border: `1px solid ${BLUE}33`, textAlign: 'left',
            }}>
              🗑 清除 SessionStorage <span style={{ fontSize: 10, color: TEXT_DIM, display: 'block', marginTop: 2 }}>释放会话级存储内存</span>
            </button>
            <button onClick={runAudit} style={{
              padding: '10px 16px', fontSize: 13, borderRadius: 8, cursor: 'pointer',
              background: `${CYAN}15`, color: CYAN, border: `1px solid ${CYAN}33`, textAlign: 'left',
            }}>
              📊 重新审计 <span style={{ fontSize: 10, color: TEXT_DIM, display: 'block', marginTop: 2 }}>刷新内存和性能指标</span>
            </button>
          </div>
        </Card>
      </div>

      {/* JS Heap Visualization */}
      <Card title="JS 堆内存分布">
        {(() => {
          const perfAny = performance as unknown as { memory?: { usedJSHeapSize: number; totalJSHeapSize: number; jsHeapSizeLimit: number } }
          if (!perfAny.memory) return <div style={{ color: TEXT_DIM }}>当前浏览器不支持 performance.memory API</div>
          const m = perfAny.memory
          const usedPct = (m.usedJSHeapSize / m.jsHeapSizeLimit) * 100
          const totalPct = (m.totalJSHeapSize / m.jsHeapSizeLimit) * 100
          return (
            <div>
              <div style={{ position: 'relative', height: 30, borderRadius: 6, background: BORDER, overflow: 'hidden' }}>
                <div style={{ position: 'absolute', inset: 0, width: `${totalPct}%`, background: `${BLUE}33`, borderRadius: 6 }} />
                <div style={{ position: 'absolute', inset: 0, width: `${usedPct}%`, background: `${BLUE}88`, borderRadius: 6 }} />
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 6, fontSize: 11, fontFamily: MONO }}>
                <span style={{ color: BLUE }}>已用: {formatSize(m.usedJSHeapSize)}</span>
                <span style={{ color: TEXT_DIM }}>已分配: {formatSize(m.totalJSHeapSize)}</span>
                <span style={{ color: TEXT_DIM }}>上限: {formatSize(m.jsHeapSizeLimit)}</span>
              </div>
            </div>
          )
        })()}
      </Card>
    </div>
  )

  const renderNetwork = () => (
    <div>
      <Card title="网络连接信息" accent={BLUE}>
        {connectionInfo ? (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 12 }}>
            {[
              { label: '有效类型', value: connectionInfo.effectiveType, color: ['4g', '5g'].includes(connectionInfo.effectiveType) ? GREEN : connectionInfo.effectiveType === '3g' ? YELLOW : RED },
              { label: '下行带宽', value: `${connectionInfo.downlink} Mbps`, color: connectionInfo.downlink > 5 ? GREEN : connectionInfo.downlink > 1 ? YELLOW : RED },
              { label: 'RTT', value: `${connectionInfo.rtt}ms`, color: connectionInfo.rtt < 100 ? GREEN : connectionInfo.rtt < 300 ? YELLOW : RED },
              { label: '省流量模式', value: connectionInfo.saveData ? '开启' : '关闭', color: connectionInfo.saveData ? ORANGE : TEXT_MID },
              { label: '连接类型', value: connectionInfo.type, color: TEXT },
              { label: '在线状态', value: navigator.onLine ? '在线' : '离线', color: navigator.onLine ? GREEN : RED },
            ].map(m => (
              <div key={m.label} style={{ background: BG, borderRadius: 8, border: `1px solid ${BORDER}`, padding: 10 }}>
                <div style={{ fontSize: 11, color: TEXT_DIM, marginBottom: 4 }}>{m.label}</div>
                <div style={{ fontSize: 18, fontWeight: 700, color: m.color, fontFamily: MONO }}>{m.value}</div>
              </div>
            ))}
          </div>
        ) : (
          <div style={{ color: TEXT_DIM, textAlign: 'center', padding: 20 }}>
            当前浏览器不支持 Network Information API (navigator.connection)
          </div>
        )}
      </Card>

      <Card title="优化建议">
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {connectionInfo && ([
            connectionInfo.effectiveType === '2g' || connectionInfo.effectiveType === 'slow-2g' ? { text: '网络极慢，建议启用激进的数据压缩和资源懒加载', color: RED } : null,
            connectionInfo.rtt > 300 ? { text: `RTT ${connectionInfo.rtt}ms 较高，建议减少请求数和使用 CDN`, color: YELLOW } : null,
            connectionInfo.saveData ? { text: '用户开启了省流量模式，应减少资源传输', color: ORANGE } : null,
            !navigator.onLine ? { text: '当前离线，应启用 Service Worker 离线缓存', color: RED } : null,
            connectionInfo.downlink > 10 ? { text: '网络状况良好，可以预加载关键资源', color: GREEN } : null,
          ].filter(Boolean).map((r, i) => r && (
            <div key={i} style={{ padding: '8px 12px', background: `${r.color}08`, borderRadius: 6, border: `1px solid ${r.color}33`, fontSize: 12, color: TEXT }}>
              <span style={{ color: r.color, marginRight: 6 }}>●</span>{r.text}
            </div>
          )))}
          {(!connectionInfo || (connectionInfo.effectiveType !== '2g' && connectionInfo.effectiveType !== 'slow-2g' && connectionInfo.rtt <= 300 && navigator.onLine)) && (
            <div style={{ padding: '8px 12px', background: `${GREEN}08`, borderRadius: 6, border: `1px solid ${GREEN}33`, fontSize: 12, color: TEXT }}>
              <span style={{ color: GREEN, marginRight: 6 }}>●</span>网络状态良好，无特殊优化建议
            </div>
          )}
        </div>
      </Card>
    </div>
  )

  const renderStartup = () => (
    <div>
      <Card title="启动时序分析" accent={CYAN}>
        {startupMetrics ? (
          <div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(140px, 1fr))', gap: 8, marginBottom: 12 }}>
              {[
                { label: 'DNS 查询', value: startupMetrics.dns, ok: startupMetrics.dns < 50 },
                { label: 'TCP 连接', value: startupMetrics.tcp, ok: startupMetrics.tcp < 100 },
                { label: 'TTFB', value: startupMetrics.ttfb, ok: startupMetrics.ttfb < 600 },
                { label: '内容下载', value: startupMetrics.download, ok: startupMetrics.download < 1000 },
                { label: 'DOM 解析', value: startupMetrics.domParse, ok: startupMetrics.domParse < 1000 },
                { label: 'DOM 就绪', value: startupMetrics.domReady, ok: startupMetrics.domReady < 1500 },
                { label: '加载完成', value: startupMetrics.loadComplete, ok: startupMetrics.loadComplete < 3000 },
              ].map(m => (
                <div key={m.label} style={{ background: BG, borderRadius: 6, border: `1px solid ${m.ok ? GREEN : RED}33`, padding: 8 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ fontSize: 11, color: TEXT_DIM }}>{m.label}</span>
                    <StatusIcon ok={m.ok} />
                  </div>
                  <div style={{ fontSize: 16, fontWeight: 700, color: m.ok ? GREEN : RED, fontFamily: MONO, marginTop: 2 }}>{Math.round(m.value)}ms</div>
                </div>
              ))}
            </div>

            {/* Waterfall visualization */}
            <div style={{ fontSize: 12, fontWeight: 600, color: TEXT, marginBottom: 8 }}>启动瀑布流</div>
            {(() => {
              const phases = [
                { label: 'DNS', start: 0, duration: startupMetrics.dns, color: YELLOW },
                { label: 'TCP', start: startupMetrics.dns, duration: startupMetrics.tcp, color: ORANGE },
                { label: 'TTFB', start: startupMetrics.dns + startupMetrics.tcp, duration: startupMetrics.ttfb, color: CYAN },
                { label: '下载', start: startupMetrics.dns + startupMetrics.tcp + startupMetrics.ttfb, duration: startupMetrics.download, color: GREEN },
                { label: 'DOM', start: startupMetrics.dns + startupMetrics.tcp + startupMetrics.ttfb + startupMetrics.download, duration: startupMetrics.domParse, color: BLUE },
              ]
              const total = startupMetrics.total || 1
              return phases.map((p, i) => (
                <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                  <span style={{ width: 40, fontSize: 10, color: TEXT_DIM, fontFamily: MONO, textAlign: 'right' }}>{p.label}</span>
                  <div style={{ flex: 1, height: 14, borderRadius: 3, background: BORDER, position: 'relative' }}>
                    <div style={{ position: 'absolute', left: `${(p.start / total) * 100}%`, width: `${Math.max((p.duration / total) * 100, 0.5)}%`, height: '100%', borderRadius: 3, background: p.color }} />
                  </div>
                  <span style={{ width: 60, fontSize: 10, color: TEXT_DIM, fontFamily: MONO, textAlign: 'right' }}>{Math.round(p.duration)}ms</span>
                </div>
              ))
            })()}
          </div>
        ) : (
          <div style={{ color: TEXT_DIM, textAlign: 'center', padding: 20 }}>
            无法获取导航时序数据
          </div>
        )}
      </Card>

      <Card title="懒加载分析">
        <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
          {resourceWaterfall.slice(0, 10).map((r, i) => {
            const isLazyCandidate = r.type === 'img' || r.type === 'script' || r.startTime > 1000
            return (
              <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '4px 8px', background: BG, borderRadius: 4, fontSize: 11, fontFamily: MONO }}>
                <span style={{ color: isLazyCandidate ? YELLOW : GREEN }}>{isLazyCandidate ? '⚠' : '✓'}</span>
                <span style={{ color: CYAN, width: 120, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{r.name}</span>
                <span style={{ color: TEXT_DIM }}>{r.type}</span>
                <span style={{ color: TEXT_MID, marginLeft: 'auto' }}>{r.startTime}ms</span>
                {isLazyCandidate && <span style={{ color: YELLOW, fontSize: 10 }}>可懒加载</span>}
              </div>
            )
          })}
        </div>
      </Card>
    </div>
  )

  const renderCleanup = () => (
    <div>
      <Card title="一键清理" accent={GREEN}>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 12 }}>
          <button onClick={performCleanup} disabled={isOptimizing} style={{
            padding: '14px 20px', fontSize: 14, borderRadius: 10, cursor: 'pointer',
            background: `linear-gradient(135deg, ${GREEN}22, ${BLUE}22)`,
            color: GREEN, border: `1px solid ${GREEN}33`, fontWeight: 600, textAlign: 'center',
          }}>
            {isOptimizing ? '⟳ 优化中...' : '✦ 一键优化'}
            <span style={{ fontSize: 10, color: TEXT_DIM, display: 'block', marginTop: 4, fontWeight: 400 }}>清除过期存储、重复项、旧缓存</span>
          </button>
          <div style={{ padding: 14, background: BG, borderRadius: 10, border: `1px solid ${BORDER}` }}>
            <div style={{ fontSize: 12, color: TEXT_DIM, marginBottom: 6 }}>优化将执行以下操作：</div>
            <div style={{ fontSize: 11, color: TEXT_MID, lineHeight: 1.6 }}>
              1. 清空 SessionStorage<br />
              2. 删除 {'>'}100KB 的 localStorage 项<br />
              3. 移除重复值条目<br />
              4. 清理旧版 Service Worker 缓存
            </div>
          </div>
        </div>
      </Card>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 12 }}>
        <button onClick={() => { try { sessionStorage.clear() } catch { /* ignore */ }; scanStorage() }} style={{
          padding: '12px 16px', fontSize: 13, borderRadius: 8, cursor: 'pointer',
          background: BG_CARD, color: TEXT, border: `1px solid ${BORDER}`, textAlign: 'left',
        }}>
          🗑 清空 SessionStorage
          <span style={{ fontSize: 10, color: TEXT_DIM, display: 'block', marginTop: 2 }}>移除所有会话级存储</span>
        </button>
        <button onClick={() => {
          try {
            const large = storageItems.filter(i => i.size > 10 * 1024 && i.source === 'localStorage')
            large.forEach(i => localStorage.removeItem(i.key))
            scanStorage()
          } catch { /* ignore */ }
        }} style={{
          padding: '12px 16px', fontSize: 13, borderRadius: 8, cursor: 'pointer',
          background: BG_CARD, color: TEXT, border: `1px solid ${BORDER}`, textAlign: 'left',
        }}>
          📦 移除大型存储项
          <span style={{ fontSize: 10, color: TEXT_DIM, display: 'block', marginTop: 2 }}>删除 {'>'}10KB 的 localStorage 条目</span>
        </button>
        <button onClick={async () => {
          if ('caches' in window) {
            try { const keys = await caches.keys(); for (const k of keys) await caches.delete(k); await scanCaches() } catch { /* ignore */ }
          }
        }} style={{
          padding: '12px 16px', fontSize: 13, borderRadius: 8, cursor: 'pointer',
          background: BG_CARD, color: TEXT, border: `1px solid ${BORDER}`, textAlign: 'left',
        }}>
          🧹 清除所有缓存
          <span style={{ fontSize: 10, color: TEXT_DIM, display: 'block', marginTop: 2 }}>删除所有 Service Worker 缓存</span>
        </button>
        <button onClick={() => {
          try {
            const seen = new Map<string, string[]>()
            for (let i = 0; i < localStorage.length; i++) {
              const key = localStorage.key(i)
              if (key) {
                const val = localStorage.getItem(key) || ''
                const arr = seen.get(val)
                if (arr) arr.push(key)
                else seen.set(val, [key])
              }
            }
            for (const [, keys] of seen) {
              if (keys.length > 1) for (let i = 1; i < keys.length; i++) localStorage.removeItem(keys[i])
            }
            scanStorage()
          } catch { /* ignore */ }
        }} style={{
          padding: '12px 16px', fontSize: 13, borderRadius: 8, cursor: 'pointer',
          background: BG_CARD, color: TEXT, border: `1px solid ${BORDER}`, textAlign: 'left',
        }}>
          🔍 去除重复条目
          <span style={{ fontSize: 10, color: TEXT_DIM, display: 'block', marginTop: 2 }}>移除 localStorage 中重复值</span>
        </button>
      </div>

      {beforeAfter && (
        <Card title="优化结果" accent={BLUE}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 12, textAlign: 'center' }}>
            {[
              { label: '评分', before: beforeAfter.scoreBefore, after: beforeAfter.scoreAfter, higher: true },
              { label: '存储', before: formatSize(beforeAfter.storageBefore), after: formatSize(beforeAfter.storageAfter), higher: false },
              { label: '内存%', before: beforeAfter.memoryBefore, after: beforeAfter.memoryAfter, higher: false, suffix: '%' },
              { label: '项数', before: beforeAfter.itemsBefore, after: beforeAfter.itemsAfter, higher: false },
            ].map(m => (
              <div key={m.label} style={{ background: BG, borderRadius: 6, border: `1px solid ${BORDER}`, padding: 8 }}>
                <div style={{ fontSize: 10, color: TEXT_DIM }}>{m.label}</div>
                <div style={{ fontSize: 12, color: TEXT_DIM, textDecoration: 'line-through', fontFamily: MONO }}>
                  {typeof m.before === 'number' ? `${m.before}${m.suffix || ''}` : m.before}
                </div>
                <div style={{ fontSize: 16, fontWeight: 700, color: GREEN, fontFamily: MONO }}>
                  {typeof m.after === 'number' ? `${m.after}${m.suffix || ''}` : m.after}
                </div>
              </div>
            ))}
          </div>
        </Card>
      )}
    </div>
  )

  const tabRenderers: Record<TabKey, () => React.ReactNode> = {
    overview: renderOverview,
    storage: renderStorage,
    cache: renderCache,
    audit: renderAudit,
    memory: renderMemory,
    network: renderNetwork,
    startup: renderStartup,
    cleanup: renderCleanup,
  }

  return (
    <div style={{ height: '100%', display: 'flex', flexDirection: 'column', background: BG, color: TEXT, fontFamily: '-apple-system, BlinkMacSystemFont, sans-serif', fontSize: 14, overflow: 'hidden' }}>
      {/* Header */}
      <div style={{
        padding: '12px 16px', borderBottom: `1px solid ${BORDER}`,
        background: `linear-gradient(135deg, ${GREEN}08, ${BLUE}08)`,
        display: 'flex', justifyContent: 'space-between', alignItems: 'center',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <span style={{ fontSize: 18, fontWeight: 700, fontFamily: MONO, background: `linear-gradient(135deg, ${GREEN}, ${BLUE})`, WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
            ⚙ System Optimizer
          </span>
          <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
            <span style={{ width: 8, height: 8, borderRadius: '50%', background: scoreColor(healthScore), boxShadow: `0 0 8px ${scoreColor(healthScore)}66` }} />
            <span style={{ fontSize: 12, color: TEXT_MID, fontFamily: MONO }}>评分 {healthScore}</span>
          </div>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          {memoryInfo.percent > 0 && (
            <span style={{ fontSize: 11, color: TEXT_DIM, fontFamily: MONO }}>内存 {memoryInfo.percent}%</span>
          )}
          {fpsHistory.length > 0 && (
            <span style={{ fontSize: 11, color: TEXT_DIM, fontFamily: MONO }}>{fpsHistory[fpsHistory.length - 1]} FPS</span>
          )}
          <span style={{ fontSize: 11, color: TEXT_DIM, fontFamily: MONO }}>
            {new Date().toLocaleTimeString('zh-CN', { hour12: false })}
          </span>
        </div>
      </div>
      {/* Tab Bar */}
      <TabBar active={activeTab} onChange={setActiveTab} />
      {/* Content */}
      <div style={{ flex: 1, overflow: 'auto', padding: 16 }}>
        {tabRenderers[activeTab]()}
      </div>
    </div>
  )
}
