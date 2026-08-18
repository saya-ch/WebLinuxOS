import { useState, useEffect, useCallback, useRef } from 'react'

// ─── Types ───────────────────────────────────────────────────────────────────

interface ServiceCheck {
  name: string
  url: string
  status: 'up' | 'down' | 'checking'
  responseTime: number | null
  uptime: number
  lastChecked: number | null
  error?: string
}

interface PipelineStage {
  name: string
  status: 'success' | 'running' | 'failed' | 'pending' | 'skipped'
  duration: number
  timestamp: number
}

interface PipelineRun {
  id: string
  branch: string
  commit: string
  stages: PipelineStage[]
  triggeredBy: string
  startedAt: number
  status: 'success' | 'running' | 'failed' | 'pending'
}

interface Container {
  id: string
  name: string
  image: string
  status: 'running' | 'stopped' | 'restarting'
  cpu: number
  memory: number
  ports: string
  created: number
}

interface LogEntry {
  id: string
  timestamp: number
  level: 'INFO' | 'WARN' | 'ERROR' | 'DEBUG'
  source: string
  message: string
}

interface AlertRule {
  id: string
  name: string
  condition: string
  severity: 'critical' | 'warning' | 'info'
  enabled: boolean
  threshold: number
}

interface ActiveAlert {
  id: string
  ruleId: string
  name: string
  severity: 'critical' | 'warning' | 'info'
  message: string
  startedAt: number
  value: number
}

interface EnvConfig {
  env: 'dev' | 'staging' | 'prod'
  variables: Record<string, string>
  lastUpdated: number
}

interface ApiRoute {
  path: string
  method: string
  rateLimit: number
  requestCount: number
  avgLatency: number
  errorRate: number
  status: 'healthy' | 'degraded' | 'down'
}

type TabKey = 'services' | 'pipeline' | 'containers' | 'logs' | 'metrics' | 'alerts' | 'env' | 'gateway'

// ─── Constants ───────────────────────────────────────────────────────────────

const CYAN = '#06b6d4'
const ROSE = '#f43f5e'
const BG = '#0a0e17'
const BG_CARD = '#111827'
const BORDER = '#1e293b'
const TEXT = '#e2e8f0'
const TEXT_DIM = '#64748b'
const TEXT_MID = '#94a3b8'
const GREEN = '#22c55e'
const YELLOW = '#eab308'
const ORANGE = '#f97316'
const MONO = "'SF Mono', 'Cascadia Code', 'Fira Code', Consolas, monospace"

const SERVICE_ENDPOINTS: { name: string; url: string }[] = [
  { name: 'GitHub', url: 'https://github.com' },
  { name: 'npm Registry', url: 'https://registry.npmjs.org' },
  { name: 'PyPI', url: 'https://pypi.org' },
  { name: 'Cloudflare', url: 'https://1.1.1.1' },
  { name: 'jsDelivr CDN', url: 'https://cdn.jsdelivr.net' },
  { name: 'DNS.Google', url: 'https://dns.google/resolve?name=example.com' },
]

const LOG_SOURCES = ['api-gateway', 'auth-service', 'user-service', 'payment-service', 'notification', 'scheduler']

const LOG_MESSAGES: Record<string, string[]> = {
  'INFO': [
    'Request processed successfully',
    'User session started',
    'Cache hit for key: user_profile_1234',
    'Database query completed in 12ms',
    'WebSocket connection established',
    'Background job queued: send_email',
    'Rate limiter initialized: 100 req/min',
    'Health check passed',
  ],
  'WARN': [
    'Cache miss for key: config_v2',
    'Slow query detected: 450ms',
    'Rate limit approaching: 85% used',
    'Deprecated API endpoint called: /v1/users',
    'Retry attempt 2/3 for external service',
    'Memory usage at 78%',
  ],
  'ERROR': [
    'Connection refused to database replica',
    'Failed to parse JWT token: invalid signature',
    'Timeout waiting for payment gateway response',
    'Unhandled exception in worker thread',
    'DNS resolution failed for api.external.io',
  ],
  'DEBUG': [
    'Request headers: Content-Type=application/json',
    'SQL: SELECT * FROM users WHERE id = $1',
    'Cache TTL remaining: 2847s',
    'WebSocket ping/pong: 32ms',
    'Config reload triggered',
  ],
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

const uid = () => Math.random().toString(36).slice(2, 10)

const formatTime = (ts: number) => new Date(ts).toLocaleTimeString('zh-CN', { hour12: false })
const formatDate = (ts: number) => new Date(ts).toLocaleDateString('zh-CN', { hour12: false })
const formatDuration = (ms: number) => ms < 1000 ? `${ms}ms` : ms < 60000 ? `${(ms / 1000).toFixed(1)}s` : `${(ms / 60000).toFixed(1)}m`

const levelColor = (level: string) => {
  switch (level) {
    case 'ERROR': return ROSE
    case 'WARN': return YELLOW
    case 'INFO': return CYAN
    case 'DEBUG': return TEXT_DIM
    default: return TEXT
  }
}

const severityColor = (sev: string) => {
  switch (sev) {
    case 'critical': return ROSE
    case 'warning': return YELLOW
    case 'info': return CYAN
    default: return TEXT
  }
}

const statusColor = (s: string) => {
  switch (s) {
    case 'up': case 'running': case 'success': case 'healthy': return GREEN
    case 'down': case 'failed': return ROSE
    case 'checking': case 'restarting': case 'degraded': return YELLOW
    case 'pending': case 'skipped': case 'stopped': return TEXT_DIM
    default: return TEXT
  }
}

// ─── Sub-components ──────────────────────────────────────────────────────────

function TabBar({ active, onChange }: { active: TabKey; onChange: (k: TabKey) => void }) {
  const tabs: { key: TabKey; label: string; icon: string }[] = [
    { key: 'services', label: '服务监控', icon: '●' },
    { key: 'pipeline', label: '部署流水线', icon: '⟳' },
    { key: 'containers', label: '容器管理', icon: '□' },
    { key: 'logs', label: '日志聚合', icon: '☰' },
    { key: 'metrics', label: '指标仪表盘', icon: '◈' },
    { key: 'alerts', label: '告警管理', icon: '⚡' },
    { key: 'env', label: '环境配置', icon: '⚙' },
    { key: 'gateway', label: 'API 网关', icon: '⇌' },
  ]
  return (
    <div style={{ display: 'flex', gap: 2, background: BG, padding: '8px 12px', borderBottom: `1px solid ${BORDER}`, overflowX: 'auto' }}>
      {tabs.map(t => (
        <button key={t.key} onClick={() => onChange(t.key)} style={{
          display: 'flex', alignItems: 'center', gap: 6, padding: '6px 14px',
          background: active === t.key ? `${CYAN}22` : 'transparent',
          border: active === t.key ? `1px solid ${CYAN}44` : `1px solid transparent`,
          borderRadius: 6, cursor: 'pointer', fontSize: 13, fontWeight: active === t.key ? 600 : 400,
          color: active === t.key ? CYAN : TEXT_MID, whiteSpace: 'nowrap', transition: 'all 0.2s',
        }}>
          <span style={{ fontSize: 10 }}>{t.icon}</span>{t.label}
        </button>
      ))}
    </div>
  )
}

function Card({ title, children, accent, rightHeader }: { title: string; children: React.ReactNode; accent?: string; rightHeader?: React.ReactNode }) {
  return (
    <div style={{
      background: BG_CARD, borderRadius: 10, border: `1px solid ${BORDER}`,
      overflow: 'hidden', marginBottom: 12,
    }}>
      <div style={{
        display: 'flex', justifyContent: 'space-between', alignItems: 'center',
        padding: '10px 16px', borderBottom: `1px solid ${BORDER}`,
        background: `${accent || CYAN}08`,
      }}>
        <span style={{ fontSize: 14, fontWeight: 600, color: TEXT, fontFamily: MONO }}>{title}</span>
        {rightHeader}
      </div>
      <div style={{ padding: 16 }}>{children}</div>
    </div>
  )
}

function StatusDot({ status }: { status: string }) {
  const c = statusColor(status)
  return (
    <span style={{
      display: 'inline-block', width: 8, height: 8, borderRadius: '50%',
      background: c, boxShadow: `0 0 6px ${c}88`, marginRight: 6,
    }} />
  )
}

function MiniSparkline({ data, color, height = 30 }: { data: number[]; color: string; height?: number }) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas || data.length < 2) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return
    const w = canvas.width
    const h = canvas.height
    ctx.clearRect(0, 0, w, h)
    const max = Math.max(...data, 1)
    const min = Math.min(...data, 0)
    const range = max - min || 1
    const step = w / (data.length - 1)
    ctx.beginPath()
    ctx.strokeStyle = color
    ctx.lineWidth = 1.5
    data.forEach((v, i) => {
      const x = i * step
      const y = h - ((v - min) / range) * (h - 4) - 2
      i === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y)
    })
    ctx.stroke()
    // fill gradient
    const lastX = (data.length - 1) * step
    ctx.lineTo(lastX, h)
    ctx.lineTo(0, h)
    ctx.closePath()
    const grad = ctx.createLinearGradient(0, 0, 0, h)
    grad.addColorStop(0, `${color}33`)
    grad.addColorStop(1, `${color}05`)
    ctx.fillStyle = grad
    ctx.fill()
  }, [data, color, height])
  return <canvas ref={canvasRef} width={120} height={height} style={{ display: 'block' }} />
}

// ─── Main Component ──────────────────────────────────────────────────────────

export default function DevOpsDashboard() {
  const [activeTab, setActiveTab] = useState<TabKey>('services')

  // ── Services ──
  const [services, setServices] = useState<ServiceCheck[]>(
    SERVICE_ENDPOINTS.map(s => ({ ...s, status: 'checking' as const, responseTime: null, uptime: 100, lastChecked: null }))
  )
  const [checkingServices, setCheckingServices] = useState(false)

  // ── Pipeline ──
  const [pipelines, setPipelines] = useState<PipelineRun[]>([])

  // ── Containers ──
  const [containers, setContainers] = useState<Container[]>([])
  const [selectedContainer, setSelectedContainer] = useState<string | null>(null)
  const [containerLogs, setContainerLogs] = useState<string[]>([])

  // ── Logs ──
  const [logs, setLogs] = useState<LogEntry[]>([])
  const [logFilter, setLogFilter] = useState<'ALL' | 'INFO' | 'WARN' | 'ERROR' | 'DEBUG'>('ALL')
  const [logSearch, setLogSearch] = useState('')
  const [autoScroll, setAutoScroll] = useState(true)
  const logsEndRef = useRef<HTMLDivElement>(null)

  // ── Metrics ──
  const [metricsData, setMetricsData] = useState({
    requestRate: [] as number[], errorRate: [] as number[],
    latencyP50: [] as number[], latencyP95: [] as number[], latencyP99: [] as number[],
    throughput: [] as number[],
  })
  const metricsCanvasRef = useRef<HTMLCanvasElement>(null)

  // ── Alerts ──
  const [alertRules, setAlertRules] = useState<AlertRule[]>([])
  const [activeAlerts, setActiveAlerts] = useState<ActiveAlert[]>([])
  const [alertHistory, setAlertHistory] = useState<ActiveAlert[]>([])

  // ── Env ──
  const [envConfigs, setEnvConfigs] = useState<EnvConfig[]>([])
  const [activeEnv, setActiveEnv] = useState<'dev' | 'staging' | 'prod'>('dev')
  const [newEnvKey, setNewEnvKey] = useState('')
  const [newEnvVal, setNewEnvVal] = useState('')

  // ── Gateway ──
  const [apiRoutes, setApiRoutes] = useState<ApiRoute[]>([])

  // ──────────── Initialize mock data ────────────

  useEffect(() => {
    const now = Date.now()

    // Pipelines
    const initPipelines: PipelineRun[] = [
      {
        id: 'pl-001', branch: 'main', commit: 'a3f2c1d', triggeredBy: 'CI Bot',
        startedAt: now - 360000, status: 'success',
        stages: [
          { name: 'Build', status: 'success', duration: 45000, timestamp: now - 360000 },
          { name: 'Test', status: 'success', duration: 120000, timestamp: now - 315000 },
          { name: 'Deploy', status: 'success', duration: 30000, timestamp: now - 195000 },
        ]
      },
      {
        id: 'pl-002', branch: 'feature/auth', commit: 'b7e4f2a', triggeredBy: 'dev-user',
        startedAt: now - 120000, status: 'running',
        stages: [
          { name: 'Build', status: 'success', duration: 52000, timestamp: now - 120000 },
          { name: 'Test', status: 'running', duration: Date.now() - (now - 68000), timestamp: now - 68000 },
          { name: 'Deploy', status: 'pending', duration: 0, timestamp: 0 },
        ]
      },
      {
        id: 'pl-003', branch: 'hotfix/db-conn', commit: 'c9d1e3f', triggeredBy: 'ops-admin',
        startedAt: now - 600000, status: 'failed',
        stages: [
          { name: 'Build', status: 'success', duration: 38000, timestamp: now - 600000 },
          { name: 'Test', status: 'failed', duration: 85000, timestamp: now - 562000 },
          { name: 'Deploy', status: 'skipped', duration: 0, timestamp: 0 },
        ]
      },
    ]
    setPipelines(initPipelines)

    // Containers
    const initContainers: Container[] = [
      { id: 'c-01', name: 'api-gateway', image: 'nginx:1.25-alpine', status: 'running', cpu: 12, memory: 128, ports: '80:80', created: now - 86400000 },
      { id: 'c-02', name: 'auth-service', image: 'node:20-slim', status: 'running', cpu: 8, memory: 256, ports: '3001:3001', created: now - 72000000 },
      { id: 'c-03', name: 'user-db', image: 'postgres:16', status: 'running', cpu: 25, memory: 512, ports: '5432:5432', created: now - 172800000 },
      { id: 'c-04', name: 'redis-cache', image: 'redis:7-alpine', status: 'running', cpu: 5, memory: 64, ports: '6379:6379', created: now - 172800000 },
      { id: 'c-05', name: 'worker-queue', image: 'python:3.12-slim', status: 'stopped', cpu: 0, memory: 0, ports: '-', created: now - 43200000 },
      { id: 'c-06', name: 'log-collector', image: 'fluent/fluentd:v1.16', status: 'running', cpu: 15, memory: 192, ports: '24224:24224', created: now - 36000000 },
    ]
    setContainers(initContainers)

    // Logs - initial batch
    const initLogs: LogEntry[] = []
    for (let i = 0; i < 50; i++) {
      const level = (['INFO', 'INFO', 'INFO', 'WARN', 'DEBUG', 'ERROR'][Math.floor(Math.random() * 6)] as LogEntry['level'])
      const source = LOG_SOURCES[Math.floor(Math.random() * LOG_SOURCES.length)]
      const msgs = LOG_MESSAGES[level]
      initLogs.push({
        id: uid(), timestamp: now - (50 - i) * 2000 + Math.random() * 1000,
        level, source, message: msgs[Math.floor(Math.random() * msgs.length)],
      })
    }
    setLogs(initLogs)

    // Alert Rules
    setAlertRules([
      { id: 'ar-01', name: 'CPU 使用率过高', condition: 'cpu_usage > threshold', severity: 'critical', enabled: true, threshold: 80 },
      { id: 'ar-02', name: '内存使用告警', condition: 'memory_usage > threshold', severity: 'warning', enabled: true, threshold: 70 },
      { id: 'ar-03', name: 'API 错误率飙升', condition: 'error_rate > threshold', severity: 'critical', enabled: true, threshold: 5 },
      { id: 'ar-04', name: '响应延迟过大', condition: 'latency_p95 > threshold', severity: 'warning', enabled: true, threshold: 500 },
      { id: 'ar-05', name: '磁盘空间不足', condition: 'disk_usage > threshold', severity: 'warning', enabled: false, threshold: 90 },
    ])
    setActiveAlerts([
      { id: 'aa-01', ruleId: 'ar-02', name: '内存使用告警', severity: 'warning', message: 'auth-service 内存使用达到 78%', startedAt: now - 300000, value: 78 },
      { id: 'aa-02', ruleId: 'ar-04', name: '响应延迟过大', severity: 'warning', message: 'P95 延迟 620ms，超过阈值', startedAt: now - 180000, value: 620 },
    ])

    // Env Configs
    setEnvConfigs([
      { env: 'dev', variables: { DATABASE_URL: 'postgres://localhost:5432/dev', REDIS_URL: 'redis://localhost:6379', LOG_LEVEL: 'debug', API_VERSION: 'v2', JWT_SECRET: 'dev-secret-key', PORT: '3000' }, lastUpdated: now - 86400000 },
      { env: 'staging', variables: { DATABASE_URL: 'postgres://staging-db:5432/staging', REDIS_URL: 'redis://staging-redis:6379', LOG_LEVEL: 'info', API_VERSION: 'v2', JWT_SECRET: '***', PORT: '3000', CDN_URL: 'https://staging-cdn.example.com' }, lastUpdated: now - 43200000 },
      { env: 'prod', variables: { DATABASE_URL: 'postgres://prod-db:5432/prod', REDIS_URL: 'redis://prod-redis:6379', LOG_LEVEL: 'warn', API_VERSION: 'v2', JWT_SECRET: '***', PORT: '8080', CDN_URL: 'https://cdn.example.com', SENTRY_DSN: '***' }, lastUpdated: now - 7200000 },
    ])

    // API Gateway
    setApiRoutes([
      { path: '/api/v2/users', method: 'GET', rateLimit: 100, requestCount: 12458, avgLatency: 45, errorRate: 0.2, status: 'healthy' },
      { path: '/api/v2/users', method: 'POST', rateLimit: 30, requestCount: 3214, avgLatency: 120, errorRate: 1.5, status: 'healthy' },
      { path: '/api/v2/auth/login', method: 'POST', rateLimit: 10, requestCount: 8921, avgLatency: 85, errorRate: 2.1, status: 'degraded' },
      { path: '/api/v2/orders', method: 'GET', rateLimit: 50, requestCount: 6742, avgLatency: 95, errorRate: 0.5, status: 'healthy' },
      { path: '/api/v2/payments', method: 'POST', rateLimit: 5, requestCount: 2147, avgLatency: 320, errorRate: 4.8, status: 'degraded' },
      { path: '/api/v2/notifications', method: 'POST', rateLimit: 20, requestCount: 5432, avgLatency: 55, errorRate: 0.1, status: 'healthy' },
      { path: '/api/v2/search', method: 'GET', rateLimit: 30, requestCount: 9876, avgLatency: 180, errorRate: 0.8, status: 'healthy' },
      { path: '/api/v2/health', method: 'GET', rateLimit: 200, requestCount: 45230, avgLatency: 5, errorRate: 0, status: 'healthy' },
    ])
  }, [])

  // ──────────── Service Health Checks (real fetch) ────────────

  const checkServices = useCallback(async () => {
    setCheckingServices(true)
    const results = await Promise.allSettled(
      SERVICE_ENDPOINTS.map(async (ep) => {
        const start = performance.now()
        try {
          const controller = new AbortController()
          const timeout = setTimeout(() => controller.abort(), 5000)
          await fetch(ep.url, { mode: 'no-cors', signal: controller.signal })
          clearTimeout(timeout)
          const elapsed = Math.round(performance.now() - start)
          return { ...ep, status: 'up' as const, responseTime: elapsed, uptime: 100, lastChecked: Date.now() }
        } catch {
          const elapsed = Math.round(performance.now() - start)
          return { ...ep, status: 'down' as const, responseTime: elapsed, uptime: 0, lastChecked: Date.now(), error: '连接失败' }
        }
      })
    )
    setServices(results.map((r, i) =>
      r.status === 'fulfilled' ? r.value : { ...SERVICE_ENDPOINTS[i], status: 'down' as const, responseTime: null, uptime: 0, lastChecked: Date.now(), error: '检查失败' }
    ))
    setCheckingServices(false)
  }, [])

  // ──────────── Auto-refresh services ────────────

  useEffect(() => {
    checkServices()
    const interval = setInterval(checkServices, 30000)
    return () => clearInterval(interval)
  }, [checkServices])

  // ──────────── Log stream ────────────

  useEffect(() => {
    const interval = setInterval(() => {
      const level = (['INFO', 'INFO', 'INFO', 'WARN', 'DEBUG', 'ERROR'][Math.floor(Math.random() * 6)] as LogEntry['level'])
      const source = LOG_SOURCES[Math.floor(Math.random() * LOG_SOURCES.length)]
      const msgs = LOG_MESSAGES[level]
      const entry: LogEntry = {
        id: uid(), timestamp: Date.now(), level, source,
        message: msgs[Math.floor(Math.random() * msgs.length)],
      }
      setLogs(prev => [...prev.slice(-200), entry])
    }, 1500)
    return () => clearInterval(interval)
  }, [])

  useEffect(() => {
    if (autoScroll && logsEndRef.current) {
      logsEndRef.current.scrollIntoView({ behavior: 'smooth' })
    }
  }, [logs, autoScroll])

  // ──────────── Metrics simulation ────────────

  useEffect(() => {
    const interval = setInterval(() => {
      setMetricsData(prev => ({
        requestRate: [...prev.requestRate.slice(-59), Math.round(800 + Math.random() * 400)],
        errorRate: [...prev.errorRate.slice(-59), Math.round(Math.random() * 50) / 10],
        latencyP50: [...prev.latencyP50.slice(-59), Math.round(30 + Math.random() * 40)],
        latencyP95: [...prev.latencyP95.slice(-59), Math.round(100 + Math.random() * 200)],
        latencyP99: [...prev.latencyP99.slice(-59), Math.round(200 + Math.random() * 400)],
        throughput: [...prev.throughput.slice(-59), Math.round(500 + Math.random() * 300)],
      }))
    }, 2000)
    return () => clearInterval(interval)
  }, [])

  // ──────────── Draw metrics canvas ────────────

  useEffect(() => {
    const canvas = metricsCanvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return
    const W = canvas.width
    const H = canvas.height
    ctx.clearRect(0, 0, W, H)

    const charts: { label: string; data: number[]; color: string; max: number }[] = [
      { label: '请求速率 (req/s)', data: metricsData.requestRate, color: CYAN, max: 1400 },
      { label: '错误率 (%)', data: metricsData.errorRate, color: ROSE, max: 6 },
      { label: 'P50 延迟 (ms)', data: metricsData.latencyP50, color: GREEN, max: 100 },
      { label: 'P95 延迟 (ms)', data: metricsData.latencyP95, color: YELLOW, max: 400 },
      { label: 'P99 延迟 (ms)', data: metricsData.latencyP99, color: ORANGE, max: 700 },
      { label: '吞吐量 (KB/s)', data: metricsData.throughput, color: '#a78bfa', max: 900 },
    ]

    const cols = 3
    const rows = 2
    const cellW = W / cols
    const cellH = H / rows

    charts.forEach((chart, idx) => {
      const col = idx % cols
      const row = Math.floor(idx / cols)
      const x0 = col * cellW
      const y0 = row * cellH
      const padL = 8
      const padR = 8
      const padT = 22
      const padB = 18
      const chartW = cellW - padL - padR
      const chartH = cellH - padT - padB

      // label
      ctx.fillStyle = '#94a3b8'
      ctx.font = '11px sans-serif'
      ctx.fillText(chart.label, x0 + padL, y0 + 14)

      // grid
      ctx.strokeStyle = '#1e293b'
      ctx.lineWidth = 0.5
      for (let g = 0; g <= 4; g++) {
        const gy = y0 + padT + (chartH / 4) * g
        ctx.beginPath()
        ctx.moveTo(x0 + padL, gy)
        ctx.lineTo(x0 + padL + chartW, gy)
        ctx.stroke()
      }

      // data
      if (chart.data.length > 1) {
        const step = chartW / Math.max(chart.data.length - 1, 1)
        ctx.beginPath()
        ctx.strokeStyle = chart.color
        ctx.lineWidth = 1.5
        chart.data.forEach((v, i) => {
          const x = x0 + padL + i * step
          const y = y0 + padT + chartH - (v / chart.max) * chartH
          i === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y)
        })
        ctx.stroke()

        // fill
        const lastX = x0 + padL + (chart.data.length - 1) * step
        ctx.lineTo(lastX, y0 + padT + chartH)
        ctx.lineTo(x0 + padL, y0 + padT + chartH)
        ctx.closePath()
        const grad = ctx.createLinearGradient(0, y0 + padT, 0, y0 + padT + chartH)
        grad.addColorStop(0, `${chart.color}22`)
        grad.addColorStop(1, `${chart.color}05`)
        ctx.fillStyle = grad
        ctx.fill()

        // current value
        const last = chart.data[chart.data.length - 1]
        ctx.fillStyle = chart.color
        ctx.font = 'bold 12px sans-serif'
        ctx.fillText(String(Math.round(last * 10) / 10), x0 + padL + chartW - 40, y0 + padT + 14)
      }
    })
  }, [metricsData])

  // ──────────── Container actions ────────────

  const handleContainerAction = useCallback((id: string, action: 'start' | 'stop' | 'restart') => {
    setContainers(prev => prev.map(c => {
      if (c.id !== id) return c
      switch (action) {
        case 'start': return { ...c, status: 'running', cpu: Math.round(5 + Math.random() * 20), memory: Math.round(64 + Math.random() * 256) }
        case 'stop': return { ...c, status: 'stopped', cpu: 0, memory: 0 }
        case 'restart': return { ...c, status: 'restarting', cpu: 0, memory: 0 }
        default: return c
      }
    }))
    if (action === 'restart') {
      setTimeout(() => {
        setContainers(prev => prev.map(c => c.id === id ? { ...c, status: 'running', cpu: Math.round(5 + Math.random() * 20), memory: Math.round(64 + Math.random() * 256) } : c))
      }, 2000)
    }
    const now = Date.now()
    setContainerLogs(prev => [...prev.slice(-50), `[${formatTime(now)}] ${action} container ${id}`])
  }, [])

  const showContainerLogs = useCallback((id: string) => {
    setSelectedContainer(id)
    const c = containers.find(ct => ct.id === id)
    if (!c) return
    const lines: string[] = []
    const now = Date.now()
    for (let i = 0; i < 20; i++) {
      lines.push(`[${formatTime(now - (20 - i) * 5000)}] ${c.name} ${['INFO: request handled', 'DEBUG: heartbeat', 'WARN: slow query', 'INFO: connection pool stats'][Math.floor(Math.random() * 4)]}`)
    }
    setContainerLogs(lines)
  }, [containers])

  // ──────────── Env management ────────────

  const addEnvVar = useCallback(() => {
    if (!newEnvKey.trim()) return
    setEnvConfigs(prev => prev.map(ec => ec.env === activeEnv ? {
      ...ec, variables: { ...ec.variables, [newEnvKey.trim()]: newEnvVal }, lastUpdated: Date.now()
    } : ec))
    setNewEnvKey('')
    setNewEnvVal('')
  }, [activeEnv, newEnvKey, newEnvVal])

  const deleteEnvVar = useCallback((key: string) => {
    setEnvConfigs(prev => prev.map(ec => ec.env === activeEnv ? {
      ...ec, variables: Object.fromEntries(Object.entries(ec.variables).filter(([k]) => k !== key)), lastUpdated: Date.now()
    } : ec))
  }, [activeEnv])

  // ──────────── Alert actions ────────────

  const toggleAlertRule = useCallback((id: string) => {
    setAlertRules(prev => prev.map(r => r.id === id ? { ...r, enabled: !r.enabled } : r))
  }, [])

  const dismissAlert = useCallback((id: string) => {
    setActiveAlerts(prev => {
      const alert = prev.find(a => a.id === id)
      if (alert) setAlertHistory(h => [...h, { ...alert, message: `${alert.message} [已解除]` }])
      return prev.filter(a => a.id !== id)
    })
  }, [])

  // ──────────── Real performance info ────────────

  const perfInfo = useRef({ navTiming: null as PerformanceNavigationTiming | null, longTasks: [] as PerformanceEntry[] })

  useEffect(() => {
    try {
      const entries = performance.getEntriesByType('navigation') as PerformanceNavigationTiming[]
      if (entries.length > 0) perfInfo.current.navTiming = entries[0]
    } catch { /* ignore */ }
    try {
      const obs = new PerformanceObserver((list) => {
        perfInfo.current.longTasks = [...perfInfo.current.longTasks, ...list.getEntries()].slice(-20)
      })
      obs.observe({ type: 'longtask', buffered: true })
      return () => obs.disconnect()
    } catch { /* ignore */ }
  }, [])

  // ─── Render ───

  const renderServices = () => (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
        <span style={{ fontSize: 13, color: TEXT_MID }}>
          {services.filter(s => s.status === 'up').length}/{services.length} 服务正常
          {checkingServices && <span style={{ marginLeft: 8, color: YELLOW }}>⟳ 检查中...</span>}
        </span>
        <button onClick={checkServices} disabled={checkingServices} style={{
          padding: '4px 12px', fontSize: 12, borderRadius: 6,
          background: `${CYAN}22`, color: CYAN, border: `1px solid ${CYAN}44`, cursor: 'pointer',
        }}>刷新</button>
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 10 }}>
        {services.map(s => (
          <div key={s.name} style={{
            background: BG, borderRadius: 8, border: `1px solid ${BORDER}`, padding: '12px 16px',
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
              <div style={{ display: 'flex', alignItems: 'center' }}>
                <StatusDot status={s.status} />
                <span style={{ fontSize: 14, fontWeight: 600, color: TEXT, fontFamily: MONO }}>{s.name}</span>
              </div>
              <span style={{ fontSize: 12, color: statusColor(s.status), fontWeight: 600, textTransform: 'uppercase' }}>
                {s.status === 'checking' ? '检查中' : s.status === 'up' ? '正常' : '异常'}
              </span>
            </div>
            <div style={{ fontSize: 11, color: TEXT_DIM, fontFamily: MONO, marginBottom: 4 }}>{s.url}</div>
            <div style={{ display: 'flex', gap: 16, fontSize: 12, color: TEXT_MID }}>
              <span>响应: <b style={{ color: s.responseTime && s.responseTime < 300 ? GREEN : s.responseTime && s.responseTime < 1000 ? YELLOW : ROSE }}>
                {s.responseTime !== null ? `${s.responseTime}ms` : '-'}
              </b></span>
              <span>可用率: <b style={{ color: s.uptime >= 99 ? GREEN : s.uptime >= 95 ? YELLOW : ROSE }}>{s.uptime}%</b></span>
            </div>
            {s.lastChecked && <div style={{ fontSize: 10, color: TEXT_DIM, marginTop: 4 }}>最后检查: {formatTime(s.lastChecked)}</div>}
            {s.error && <div style={{ fontSize: 11, color: ROSE, marginTop: 4 }}>⚠ {s.error}</div>}
          </div>
        ))}
      </div>
      {perfInfo.current.navTiming && (
        <div style={{ marginTop: 12, padding: '10px 16px', background: BG, borderRadius: 8, border: `1px solid ${BORDER}` }}>
          <div style={{ fontSize: 13, fontWeight: 600, color: TEXT, marginBottom: 6 }}>真实导航时序 (Performance API)</div>
          {(() => {
            const nav = perfInfo.current.navTiming!
            const items = [
              ['DNS 查询', nav.domainLookupEnd - nav.domainLookupStart],
              ['TCP 连接', nav.connectEnd - nav.connectStart],
              ['TTFB', nav.responseStart - nav.requestStart],
              ['内容下载', nav.responseEnd - nav.responseStart],
              ['DOM 解析', nav.domInteractive - nav.responseEnd],
              ['DOM 完成', nav.domContentLoadedEventEnd - nav.domContentLoadedEventStart],
            ]
            return (
              <div style={{ display: 'flex', gap: 20, flexWrap: 'wrap' }}>
                {items.map(([label, dur]) => (
                  <span key={String(label)} style={{ fontSize: 12, color: TEXT_MID }}>{label}: <b style={{ color: CYAN }}>{Math.round(Number(dur))}ms</b></span>
                ))}
              </div>
            )
          })()}
        </div>
      )}
    </div>
  )

  const renderPipeline = () => (
    <div>
      {pipelines.map(pl => (
        <div key={pl.id} style={{ background: BG, borderRadius: 8, border: `1px solid ${BORDER}`, padding: '12px 16px', marginBottom: 10 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <StatusDot status={pl.status} />
              <span style={{ fontSize: 14, fontWeight: 600, color: TEXT, fontFamily: MONO }}>{pl.id}</span>
              <span style={{ fontSize: 12, padding: '2px 8px', borderRadius: 4, background: `${CYAN}22`, color: CYAN, fontFamily: MONO }}>{pl.branch}</span>
              <span style={{ fontSize: 11, color: TEXT_DIM, fontFamily: MONO }}>{pl.commit}</span>
            </div>
            <span style={{ fontSize: 11, color: TEXT_DIM }}>{formatTime(pl.startedAt)}</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
            {pl.stages.map((stage, i) => (
              <div key={stage.name} style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                <div style={{
                  padding: '6px 14px', borderRadius: 6, fontSize: 12, fontWeight: 500,
                  background: stage.status === 'success' ? `${GREEN}15` : stage.status === 'running' ? `${CYAN}15` : stage.status === 'failed' ? `${ROSE}15` : stage.status === 'pending' ? `${TEXT_DIM}10` : `${TEXT_DIM}08`,
                  border: `1px solid ${statusColor(stage.status)}44`,
                  color: statusColor(stage.status),
                  fontFamily: MONO,
                  animation: stage.status === 'running' ? 'pulse 2s infinite' : undefined,
                }}>
                  {stage.status === 'running' ? '⟳ ' : stage.status === 'success' ? '✓ ' : stage.status === 'failed' ? '✗ ' : '○ '}{stage.name}
                  {stage.duration > 0 && <span style={{ marginLeft: 6, opacity: 0.7 }}>({formatDuration(stage.duration)})</span>}
                </div>
                {i < pl.stages.length - 1 && <span style={{ color: TEXT_DIM, fontSize: 14 }}>→</span>}
              </div>
            ))}
          </div>
          <div style={{ fontSize: 11, color: TEXT_DIM, marginTop: 6 }}>触发者: {pl.triggeredBy}</div>
        </div>
      ))}
    </div>
  )

  const renderContainers = () => (
    <div>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 12 }}>
        <div style={{ padding: '12px 16px', background: BG, borderRadius: 8, border: `1px solid ${BORDER}`, textAlign: 'center' }}>
          <div style={{ fontSize: 28, fontWeight: 700, color: GREEN }}>{containers.filter(c => c.status === 'running').length}</div>
          <div style={{ fontSize: 12, color: TEXT_MID }}>运行中</div>
        </div>
        <div style={{ padding: '12px 16px', background: BG, borderRadius: 8, border: `1px solid ${BORDER}`, textAlign: 'center' }}>
          <div style={{ fontSize: 28, fontWeight: 700, color: TEXT_DIM }}>{containers.filter(c => c.status === 'stopped').length}</div>
          <div style={{ fontSize: 12, color: TEXT_MID }}>已停止</div>
        </div>
      </div>
      <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12, fontFamily: MONO }}>
        <thead>
          <tr style={{ borderBottom: `1px solid ${BORDER}` }}>
            {['名称', '镜像', '状态', 'CPU%', '内存(MB)', '端口', '操作'].map(h => (
              <th key={h} style={{ padding: '8px 6px', textAlign: 'left', color: TEXT_DIM, fontWeight: 500 }}>{h}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {containers.map(c => (
            <tr key={c.id} style={{ borderBottom: `1px solid ${BORDER}44` }}>
              <td style={{ padding: '6px', color: TEXT }}>
                <StatusDot status={c.status} />{c.name}
              </td>
              <td style={{ padding: '6px', color: TEXT_MID }}>{c.image}</td>
              <td style={{ padding: '6px', color: statusColor(c.status), fontWeight: 600 }}>{c.status}</td>
              <td style={{ padding: '6px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                  <div style={{ width: 40, height: 6, borderRadius: 3, background: `${BORDER}`, overflow: 'hidden' }}>
                    <div style={{ width: `${c.cpu}%`, height: '100%', background: c.cpu > 70 ? ROSE : c.cpu > 40 ? YELLOW : GREEN, borderRadius: 3 }} />
                  </div>
                  <span style={{ color: TEXT_MID, fontSize: 10 }}>{c.cpu}</span>
                </div>
              </td>
              <td style={{ padding: '6px', color: TEXT_MID }}>{c.memory}</td>
              <td style={{ padding: '6px', color: TEXT_DIM }}>{c.ports}</td>
              <td style={{ padding: '6px' }}>
                <div style={{ display: 'flex', gap: 4 }}>
                  {c.status === 'stopped' && <button onClick={() => handleContainerAction(c.id, 'start')} style={{ padding: '2px 8px', fontSize: 10, borderRadius: 4, background: `${GREEN}22`, color: GREEN, border: `1px solid ${GREEN}44`, cursor: 'pointer' }}>启动</button>}
                  {c.status === 'running' && <button onClick={() => handleContainerAction(c.id, 'stop')} style={{ padding: '2px 8px', fontSize: 10, borderRadius: 4, background: `${ROSE}22`, color: ROSE, border: `1px solid ${ROSE}44`, cursor: 'pointer' }}>停止</button>}
                  {(c.status === 'running' || c.status === 'stopped') && <button onClick={() => handleContainerAction(c.id, 'restart')} style={{ padding: '2px 8px', fontSize: 10, borderRadius: 4, background: `${YELLOW}22`, color: YELLOW, border: `1px solid ${YELLOW}44`, cursor: 'pointer' }}>重启</button>}
                  <button onClick={() => showContainerLogs(c.id)} style={{ padding: '2px 8px', fontSize: 10, borderRadius: 4, background: `${CYAN}22`, color: CYAN, border: `1px solid ${CYAN}44`, cursor: 'pointer' }}>日志</button>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      {selectedContainer && (
        <div style={{ marginTop: 12, background: BG, borderRadius: 8, border: `1px solid ${BORDER}`, padding: 12 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
            <span style={{ fontSize: 13, fontWeight: 600, color: TEXT, fontFamily: MONO }}>日志: {containers.find(c => c.id === selectedContainer)?.name}</span>
            <button onClick={() => setSelectedContainer(null)} style={{ padding: '2px 8px', fontSize: 10, borderRadius: 4, background: `${TEXT_DIM}22`, color: TEXT_DIM, border: `1px solid ${BORDER}`, cursor: 'pointer' }}>关闭</button>
          </div>
          <div style={{ maxHeight: 150, overflow: 'auto', fontFamily: MONO, fontSize: 11 }}>
            {containerLogs.map((line, i) => <div key={i} style={{ color: TEXT_MID, padding: '1px 0' }}>{line}</div>)}
          </div>
        </div>
      )}
    </div>
  )

  const renderLogs = () => {
    const filtered = logs.filter(l => {
      if (logFilter !== 'ALL' && l.level !== logFilter) return false
      if (logSearch && !l.message.toLowerCase().includes(logSearch.toLowerCase()) && !l.source.toLowerCase().includes(logSearch.toLowerCase())) return false
      return true
    })
    return (
      <div>
        <div style={{ display: 'flex', gap: 8, marginBottom: 10, alignItems: 'center' }}>
          <div style={{ display: 'flex', gap: 4 }}>
            {(['ALL', 'INFO', 'WARN', 'ERROR', 'DEBUG'] as const).map(lev => (
              <button key={lev} onClick={() => setLogFilter(lev)} style={{
                padding: '4px 10px', fontSize: 11, borderRadius: 5, fontFamily: MONO,
                background: logFilter === lev ? `${levelColor(lev === 'ALL' ? 'INFO' : lev)}22` : 'transparent',
                color: logFilter === lev ? (lev === 'ALL' ? CYAN : levelColor(lev)) : TEXT_DIM,
                border: `1px solid ${logFilter === lev ? (lev === 'ALL' ? CYAN : levelColor(lev)) : BORDER}44`,
                cursor: 'pointer', fontWeight: logFilter === lev ? 600 : 400,
              }}>{lev === 'ALL' ? '全部' : lev}</button>
            ))}
          </div>
          <input type="text" value={logSearch} onChange={e => setLogSearch(e.target.value)} placeholder="搜索日志..."
            style={{ flex: 1, padding: '4px 10px', fontSize: 11, borderRadius: 5, background: BG, border: `1px solid ${BORDER}`, color: TEXT, fontFamily: MONO, outline: 'none' }} />
          <label style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 11, color: TEXT_MID, cursor: 'pointer' }}>
            <input type="checkbox" checked={autoScroll} onChange={e => setAutoScroll(e.target.checked)} style={{ cursor: 'pointer' }} />
            自动滚动
          </label>
        </div>
        <div style={{ background: BG, borderRadius: 8, border: `1px solid ${BORDER}`, padding: 8, maxHeight: 400, overflow: 'auto', fontFamily: MONO, fontSize: 11 }}>
          {filtered.map(l => (
            <div key={l.id} style={{ display: 'flex', gap: 8, padding: '2px 4px', borderBottom: `1px solid ${BORDER}22` }}>
              <span style={{ color: TEXT_DIM, whiteSpace: 'nowrap' }}>{formatTime(l.timestamp)}</span>
              <span style={{ color: levelColor(l.level), fontWeight: 600, width: 44, textAlign: 'center' }}>{l.level}</span>
              <span style={{ color: CYAN, width: 120, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{l.source}</span>
              <span style={{ color: TEXT }}>{l.message}</span>
            </div>
          ))}
          <div ref={logsEndRef} />
        </div>
        <div style={{ fontSize: 11, color: TEXT_DIM, marginTop: 6, display: 'flex', justifyContent: 'space-between' }}>
          <span>共 {filtered.length} 条日志</span>
          <span>日志速率: ~{Math.round(60 / 1.5)}/min</span>
        </div>
      </div>
    )
  }

  const renderMetrics = () => (
    <div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(160px, 1fr))', gap: 8, marginBottom: 12 }}>
        {[
          { label: '请求速率', value: metricsData.requestRate, unit: 'req/s', color: CYAN },
          { label: '错误率', value: metricsData.errorRate, unit: '%', color: ROSE },
          { label: 'P50 延迟', value: metricsData.latencyP50, unit: 'ms', color: GREEN },
          { label: 'P95 延迟', value: metricsData.latencyP95, unit: 'ms', color: YELLOW },
          { label: 'P99 延迟', value: metricsData.latencyP99, unit: 'ms', color: ORANGE },
          { label: '吞吐量', value: metricsData.throughput, unit: 'KB/s', color: '#a78bfa' },
        ].map(m => {
          const last = m.value.length > 0 ? m.value[m.value.length - 1] : 0
          return (
            <div key={m.label} style={{ background: BG, borderRadius: 8, border: `1px solid ${BORDER}`, padding: 10 }}>
              <div style={{ fontSize: 11, color: TEXT_DIM, marginBottom: 4 }}>{m.label}</div>
              <div style={{ fontSize: 22, fontWeight: 700, color: m.color }}>{Math.round(last * 10) / 10}</div>
              <div style={{ fontSize: 10, color: TEXT_DIM, marginBottom: 6 }}>{m.unit}</div>
              <MiniSparkline data={m.value} color={m.color} height={24} />
            </div>
          )
        })}
      </div>
      <div style={{ background: BG, borderRadius: 8, border: `1px solid ${BORDER}`, overflow: 'hidden' }}>
        <div style={{ padding: '8px 16px', borderBottom: `1px solid ${BORDER}`, fontSize: 13, fontWeight: 600, color: TEXT }}>
          实时指标趋势
          {perfInfo.current.longTasks.length > 0 && <span style={{ marginLeft: 12, fontSize: 11, color: YELLOW }}>⚠ 检测到 {perfInfo.current.longTasks.length} 个长任务</span>}
        </div>
        <canvas ref={metricsCanvasRef} width={780} height={320} style={{ display: 'block', width: '100%', height: 320 }} />
      </div>
      <div style={{ marginTop: 8, fontSize: 11, color: TEXT_DIM, fontFamily: MONO }}>
        性能数据采样间隔: 2s | 基于 performance.now() 真实时间戳
      </div>
    </div>
  )

  const renderAlerts = () => (
    <div>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 12 }}>
        <Card title="活跃告警" accent={ROSE} rightHeader={<span style={{ fontSize: 12, color: ROSE, fontWeight: 600 }}>{activeAlerts.length}</span>}>
          {activeAlerts.length === 0 ? <div style={{ color: TEXT_DIM, fontSize: 13 }}>✓ 无活跃告警</div> : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {activeAlerts.map(a => (
                <div key={a.id} style={{ padding: '8px 12px', background: `${severityColor(a.severity)}08`, borderRadius: 6, border: `1px solid ${severityColor(a.severity)}33` }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ fontSize: 13, fontWeight: 600, color: severityColor(a.severity) }}>{a.name}</span>
                    <button onClick={() => dismissAlert(a.id)} style={{ padding: '2px 8px', fontSize: 10, borderRadius: 4, background: `${TEXT_DIM}22`, color: TEXT_MID, border: `1px solid ${BORDER}`, cursor: 'pointer' }}>解除</button>
                  </div>
                  <div style={{ fontSize: 11, color: TEXT_MID, marginTop: 2 }}>{a.message}</div>
                  <div style={{ fontSize: 10, color: TEXT_DIM, marginTop: 2 }}>触发于 {formatTime(a.startedAt)}</div>
                </div>
              ))}
            </div>
          )}
        </Card>
        <Card title="告警规则">
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            {alertRules.map(r => (
              <div key={r.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '6px 10px', background: BG, borderRadius: 6, border: `1px solid ${BORDER}` }}>
                <div>
                  <div style={{ fontSize: 12, fontWeight: 500, color: TEXT }}>{r.name}</div>
                  <div style={{ fontSize: 10, color: TEXT_DIM }}>{r.condition.replace('threshold', String(r.threshold))}</div>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <span style={{ fontSize: 10, padding: '2px 6px', borderRadius: 3, background: `${severityColor(r.severity)}15`, color: severityColor(r.severity) }}>{r.severity}</span>
                  <button onClick={() => toggleAlertRule(r.id)} style={{
                    padding: '2px 8px', fontSize: 10, borderRadius: 4, cursor: 'pointer',
                    background: r.enabled ? `${GREEN}22` : `${TEXT_DIM}22`,
                    color: r.enabled ? GREEN : TEXT_DIM,
                    border: `1px solid ${r.enabled ? GREEN : TEXT_DIM}44`,
                  }}>{r.enabled ? '启用' : '禁用'}</button>
                </div>
              </div>
            ))}
          </div>
        </Card>
      </div>
      {alertHistory.length > 0 && (
        <Card title="告警历史">
          <div style={{ maxHeight: 150, overflow: 'auto' }}>
            {alertHistory.map((a, i) => (
              <div key={i} style={{ padding: '4px 0', fontSize: 11, color: TEXT_DIM, borderBottom: `1px solid ${BORDER}33`, fontFamily: MONO }}>
                [{formatTime(a.startedAt)}] <span style={{ color: severityColor(a.severity) }}>{a.name}</span> — {a.message}
              </div>
            ))}
          </div>
        </Card>
      )}
    </div>
  )

  const renderEnv = () => {
    const config = envConfigs.find(e => e.env === activeEnv)
    if (!config) return null
    return (
      <div>
        <div style={{ display: 'flex', gap: 8, marginBottom: 12 }}>
          {(['dev', 'staging', 'prod'] as const).map(env => (
            <button key={env} onClick={() => setActiveEnv(env)} style={{
              padding: '6px 16px', fontSize: 12, borderRadius: 6, fontFamily: MONO, cursor: 'pointer',
              background: activeEnv === env ? (env === 'prod' ? `${ROSE}22` : env === 'staging' ? `${YELLOW}22` : `${GREEN}22`) : 'transparent',
              color: activeEnv === env ? (env === 'prod' ? ROSE : env === 'staging' ? YELLOW : GREEN) : TEXT_DIM,
              border: `1px solid ${activeEnv === env ? (env === 'prod' ? ROSE : env === 'staging' ? YELLOW : GREEN) : BORDER}44`,
              fontWeight: activeEnv === env ? 600 : 400,
            }}>{env.toUpperCase()}</button>
          ))}
        </div>
        <Card title={`${activeEnv.toUpperCase()} 环境变量`} rightHeader={<span style={{ fontSize: 11, color: TEXT_DIM }}>更新于 {formatTime(config.lastUpdated)}</span>}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 4, marginBottom: 12 }}>
            {Object.entries(config.variables).map(([key, val]) => (
              <div key={key} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '4px 8px', background: BG, borderRadius: 4, fontFamily: MONO, fontSize: 12 }}>
                <span style={{ color: CYAN, minWidth: 150, fontWeight: 600 }}>{key}</span>
                <span style={{ color: TEXT, flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>= {val}</span>
                <button onClick={() => deleteEnvVar(key)} style={{ padding: '1px 6px', fontSize: 10, borderRadius: 3, background: `${ROSE}15`, color: ROSE, border: 'none', cursor: 'pointer' }}>✗</button>
              </div>
            ))}
          </div>
          <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
            <input type="text" value={newEnvKey} onChange={e => setNewEnvKey(e.target.value)} placeholder="KEY"
              style={{ padding: '4px 8px', fontSize: 11, borderRadius: 4, background: BG, border: `1px solid ${BORDER}`, color: TEXT, fontFamily: MONO, width: 120, outline: 'none' }} />
            <span style={{ color: TEXT_DIM }}>=</span>
            <input type="text" value={newEnvVal} onChange={e => setNewEnvVal(e.target.value)} placeholder="VALUE"
              style={{ padding: '4px 8px', fontSize: 11, borderRadius: 4, background: BG, border: `1px solid ${BORDER}`, color: TEXT, fontFamily: MONO, flex: 1, outline: 'none' }} />
            <button onClick={addEnvVar} style={{ padding: '4px 12px', fontSize: 11, borderRadius: 4, background: `${GREEN}22`, color: GREEN, border: `1px solid ${GREEN}44`, cursor: 'pointer' }}>添加</button>
          </div>
        </Card>
      </div>
    )
  }

  const renderGateway = () => (
    <div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 8, marginBottom: 12 }}>
        <div style={{ padding: '12px 16px', background: BG, borderRadius: 8, border: `1px solid ${BORDER}`, textAlign: 'center' }}>
          <div style={{ fontSize: 22, fontWeight: 700, color: GREEN }}>{apiRoutes.filter(r => r.status === 'healthy').length}</div>
          <div style={{ fontSize: 11, color: TEXT_MID }}>健康路由</div>
        </div>
        <div style={{ padding: '12px 16px', background: BG, borderRadius: 8, border: `1px solid ${BORDER}`, textAlign: 'center' }}>
          <div style={{ fontSize: 22, fontWeight: 700, color: YELLOW }}>{apiRoutes.filter(r => r.status === 'degraded').length}</div>
          <div style={{ fontSize: 11, color: TEXT_MID }}>降级路由</div>
        </div>
        <div style={{ padding: '12px 16px', background: BG, borderRadius: 8, border: `1px solid ${BORDER}`, textAlign: 'center' }}>
          <div style={{ fontSize: 22, fontWeight: 700, color: CYAN }}>{apiRoutes.reduce((s, r) => s + r.requestCount, 0).toLocaleString()}</div>
          <div style={{ fontSize: 11, color: TEXT_MID }}>总请求数</div>
        </div>
      </div>
      <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12, fontFamily: MONO }}>
        <thead>
          <tr style={{ borderBottom: `1px solid ${BORDER}` }}>
            {['路由', '方法', '速率限制', '请求数', '平均延迟', '错误率', '状态'].map(h => (
              <th key={h} style={{ padding: '8px 6px', textAlign: 'left', color: TEXT_DIM, fontWeight: 500 }}>{h}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {apiRoutes.map((r, i) => (
            <tr key={i} style={{ borderBottom: `1px solid ${BORDER}44` }}>
              <td style={{ padding: '6px', color: CYAN }}>{r.path}</td>
              <td style={{ padding: '6px' }}>
                <span style={{ padding: '2px 6px', borderRadius: 3, fontSize: 10, fontWeight: 600,
                  background: r.method === 'GET' ? `${GREEN}15` : r.method === 'POST' ? `${CYAN}15` : `${YELLOW}15`,
                  color: r.method === 'GET' ? GREEN : r.method === 'POST' ? CYAN : YELLOW,
                }}>{r.method}</span>
              </td>
              <td style={{ padding: '6px', color: TEXT_MID }}>{r.rateLimit}/min</td>
              <td style={{ padding: '6px', color: TEXT }}>{r.requestCount.toLocaleString()}</td>
              <td style={{ padding: '6px', color: r.avgLatency > 200 ? YELLOW : TEXT }}>{r.avgLatency}ms</td>
              <td style={{ padding: '6px', color: r.errorRate > 3 ? ROSE : r.errorRate > 1 ? YELLOW : GREEN }}>{r.errorRate}%</td>
              <td style={{ padding: '6px' }}><StatusDot status={r.status} /><span style={{ color: statusColor(r.status) }}>{r.status === 'healthy' ? '健康' : r.status === 'degraded' ? '降级' : '离线'}</span></td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )

  const tabContent: Record<TabKey, () => React.ReactNode> = {
    services: renderServices,
    pipeline: renderPipeline,
    containers: renderContainers,
    logs: renderLogs,
    metrics: renderMetrics,
    alerts: renderAlerts,
    env: renderEnv,
    gateway: renderGateway,
  }

  return (
    <div style={{ height: '100%', display: 'flex', flexDirection: 'column', background: BG, color: TEXT, fontFamily: '-apple-system, BlinkMacSystemFont, sans-serif', fontSize: 14, overflow: 'hidden' }}>
      <style>{`@keyframes pulse { 0%, 100% { opacity: 1; } 50% { opacity: 0.6; } }`}</style>
      {/* Header */}
      <div style={{
        padding: '12px 16px', borderBottom: `1px solid ${BORDER}`,
        background: `linear-gradient(135deg, ${CYAN}10, ${ROSE}08)`,
        display: 'flex', justifyContent: 'space-between', alignItems: 'center',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <span style={{ fontSize: 18, fontWeight: 700, fontFamily: MONO, background: `linear-gradient(135deg, ${CYAN}, ${ROSE})`, WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
            ⬡ DevOps Dashboard
          </span>
          <span style={{ fontSize: 11, color: TEXT_DIM, fontFamily: MONO }}>
            {formatDate(Date.now())} {formatTime(Date.now())}
          </span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <span style={{ fontSize: 11, color: TEXT_MID, fontFamily: MONO }}>
            性能时间戳: {Math.round(performance.now())}ms
          </span>
          {activeAlerts.length > 0 && (
            <span style={{ padding: '3px 10px', borderRadius: 6, background: `${ROSE}22`, color: ROSE, fontSize: 11, fontWeight: 600, fontFamily: MONO }}>
              ⚡ {activeAlerts.length} 告警
            </span>
          )}
        </div>
      </div>
      {/* Tab Bar */}
      <TabBar active={activeTab} onChange={setActiveTab} />
      {/* Content */}
      <div style={{ flex: 1, overflow: 'auto', padding: 16 }}>
        {tabContent[activeTab]()}
      </div>
    </div>
  )
}
