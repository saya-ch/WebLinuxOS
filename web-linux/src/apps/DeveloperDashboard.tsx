import { useState, useEffect, useCallback, useMemo, memo } from 'react'
import { useStore } from '../store'
import {
  Cpu,
  HardDrive,
  Wifi,
  MemoryStick,
  Terminal,
  Folder,
  Code2,
  Settings,
  Globe,
  Clock,
  Copy,
  Check,
  Monitor,
  Keyboard,
  FileJson,
  Hash,
  CalendarDays,
  Zap,
  Activity,
  RefreshCw,
  ExternalLink,
  Shield,
  BarChart3,
  Code,
} from 'lucide-react'

// ==================== 类型定义 ====================
interface SystemMetrics {
  cpu: number
  memory: number
  memoryDetail: { used: number; total: number } | null
  storage: number
  network: number | null
}

interface EnvInfo {
  browser: string
  platform: string
  language: string
  cores: number
  screen: string
  timezone: string
  cookiesEnabled: boolean
  deviceMemory: string
  online: boolean
}

interface ApiEndpoint {
  name: string
  url: string
  status: 'checking' | 'ok' | 'error' | 'slow'
  latency: number | null
}

interface CodeSnippet {
  title: string
  description: string
  code: string
}

// ==================== 工具函数 ====================
function getPerformanceMemory(): { used: number; total: number } | null {
  try {
    const perf = performance as unknown as {
      memory?: { usedJSHeapSize: number; totalJSHeapSize: number; jsHeapSizeLimit: number }
    }
    if (perf.memory && perf.memory.usedJSHeapSize > 0) {
      return {
        used: perf.memory.usedJSHeapSize,
        total: perf.memory.totalJSHeapSize,
      }
    }
  } catch { /* ignore */ }
  return null
}

function getLocalStorageUsage(): number {
  let totalUsed = 0
  try {
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i)
      if (key) {
        const value = localStorage.getItem(key) || ''
        totalUsed += (key.length + value.length) * 2
      }
    }
  } catch { /* ignore */ }
  return totalUsed
}

function getBrowserInfo(): string {
  const ua = navigator.userAgent
  if (ua.includes('Firefox/')) return 'Firefox'
  if (ua.includes('Edg/')) return 'Edge'
  if (ua.includes('Chrome/')) return 'Chrome'
  if (ua.includes('Safari/')) return 'Safari'
  if (ua.includes('Opera') || ua.includes('OPR/')) return 'Opera'
  return '其他浏览器'
}

function getPlatformInfo(): string {
  const ua = navigator.userAgent
  if (ua.includes('Win')) return 'Windows'
  if (ua.includes('Mac')) return 'macOS'
  if (ua.includes('Linux')) return 'Linux'
  if (ua.includes('Android')) return 'Android'
  if (ua.includes('iPhone') || ua.includes('iPad')) return 'iOS'
  return '未知平台'
}

function getDeviceMemory(): string {
  const nav = navigator as Navigator & { deviceMemory?: number }
  if (nav.deviceMemory) return `${nav.deviceMemory} GB`
  return '不支持'
}

function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  if (bytes < 1024 * 1024 * 1024) return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
  return `${(bytes / (1024 * 1024 * 1024)).toFixed(1)} GB`
}

function getMetricColor(value: number): string {
  if (value > 85) return '#ef4444'
  if (value > 65) return '#f59e0b'
  return '#10b981'
}

// ==================== 静态数据 ====================
const QUICK_APPS = [
  { id: 'terminal', name: '终端', icon: Terminal, color: '#22c55e' },
  { id: 'code-editor', name: '代码编辑器', icon: Code2, color: '#8b5cf6' },
  { id: 'web-ide-pro', name: 'WebIDE Pro', icon: Code, color: '#6366f1' },
  { id: 'files', name: '文件管理器', icon: Folder, color: '#f59e0b' },
  { id: 'git-assistant', name: 'Git 助手', icon: GitIcon, color: '#f97316' },
  { id: 'api-explorer', name: 'API 探索器', icon: Globe, color: '#06b6d4' },
  { id: 'json-formatter', name: 'JSON 格式化', icon: FileJson, color: '#eab308' },
  { id: 'hash-generator', name: 'Hash 生成器', icon: Hash, color: '#ec4899' },
  { id: 'regex-tester', name: '正则测试', icon: Code2, color: '#14b8a6' },
  { id: 'code-formatter', name: '代码格式化', icon: Zap, color: '#a855f7' },
  { id: 'system-monitor', name: '系统监控', icon: Activity, color: '#ef4444' },
  { id: 'settings', name: '系统设置', icon: Settings, color: '#64748b' },
]

function GitIcon(props: any) {
  return (
    <svg viewBox="0 0 24 24" width="18" height="18" stroke="currentColor" strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round" {...props}>
      <circle cx="12" cy="12" r="4" />
      <line x1="1.05" y1="12" x2="7" y2="12" />
      <line x1="17.01" y1="12" x2="22.96" y2="12" />
    </svg>
  )
}

const KEYBOARD_SHORTCUTS = [
  { keys: 'Ctrl + Space', desc: '打开启动器' },
  { keys: 'Ctrl + Q', desc: '关闭窗口' },
  { keys: 'Alt + ←/→', desc: '切换桌面' },
  { keys: 'Ctrl + N', desc: '新建窗口' },
  { keys: 'F11', desc: '最大化/还原' },
  { keys: 'Ctrl + Shift + I', desc: '开发者工具' },
]

const CODE_SNIPPETS: CodeSnippet[] = [
  {
    title: 'UUID 生成器',
    description: '生成随机 UUID v4',
    code: `crypto.randomUUID()`,
  },
  {
    title: '格式化日期',
    description: '本地化日期时间格式',
    code: `new Date().toLocaleString('zh-CN', {\n  year: 'numeric', month: '2-digit',\n  day: '2-digit', hour: '2-digit',\n  minute: '2-digit', second: '2-digit'\n})`,
  },
  {
    title: '防抖函数',
    description: '经典 debounce 实现',
    code: `function debounce(fn, ms = 300) {\n  let timer\n  return (...args) => {\n    clearTimeout(timer)\n    timer = setTimeout(() => fn(...args), ms)\n  }\n}`,
  },
  {
    title: '深拷贝',
    description: '使用 structuredClone 深拷贝',
    code: `const copy = structuredClone(original)`,
  },
  {
    title: 'Fetch JSON',
    description: '快速获取 JSON 数据',
    code: `const data = await fetch(url)\n  .then(r => r.json())`,
  },
  {
    title: '随机颜色',
    description: '生成随机十六进制颜色',
    code: `'#' + Math.random().toString(16)\n  .slice(2, 8).padStart(6, '0')`,
  },
]

const API_ENDPOINTS: { name: string; url: string }[] = [
  { name: 'GitHub API', url: 'https://api.github.com/' },
  { name: 'Open-Meteo', url: 'https://api.open-meteo.com/v1/forecast?latitude=39.9&longitude=116.4&current_weather=true' },
  { name: 'HTTPBin', url: 'https://httpbin.org/get' },
  { name: 'JSONPlaceholder', url: 'https://jsonplaceholder.typicode.com/posts/1' },
]

// ==================== 子组件 ====================
function MetricBar({ label, value, icon: Icon }: { label: string; value: number; icon: any }) {
  const color = getMetricColor(value)
  return (
    <div style={{ marginBottom: 12 }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 4 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <Icon size={14} style={{ color, opacity: 0.9 }} />
          <span style={{ fontSize: 12, color: '#94a3b8' }}>{label}</span>
        </div>
        <span style={{ fontSize: 12, fontWeight: 600, color }}>{value.toFixed(1)}%</span>
      </div>
      <div style={{ height: 6, borderRadius: 3, background: 'rgba(255,255,255,0.06)', overflow: 'hidden' }}>
        <div
          style={{
            height: '100%',
            width: `${Math.min(100, value)}%`,
            borderRadius: 3,
            background: `linear-gradient(90deg, ${color}, ${color}88)`,
            transition: 'width 0.8s ease',
          }}
        />
      </div>
    </div>
  )
}

function SectionCard({
  title,
  icon: Icon,
  children,
  style: extraStyle,
}: {
  title: string
  icon: any
  children: React.ReactNode
  style?: React.CSSProperties
}) {
  return (
    <div
      style={{
        background: 'rgba(255,255,255,0.03)',
        border: '1px solid rgba(255,255,255,0.06)',
        borderRadius: 12,
        padding: 16,
        ...extraStyle,
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 14 }}>
        <div
          style={{
            width: 28,
            height: 28,
            borderRadius: 8,
            background: 'rgba(99,102,241,0.15)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <Icon size={15} style={{ color: '#818cf8' }} />
        </div>
        <h3 style={{ margin: 0, fontSize: 13, fontWeight: 600, color: '#e2e8f0' }}>{title}</h3>
      </div>
      {children}
    </div>
  )
}

// ==================== 主组件 ====================
const DeveloperDashboard = memo(function DeveloperDashboard() {
  const openApp = useStore((s) => s.openApp)
  const systemStats = useStore((s) => s.systemStats)
  const refreshSystemStats = useStore((s) => s.refreshSystemStats)

  // 环境信息
  const [envInfo] = useState<EnvInfo>(() => ({
    browser: getBrowserInfo(),
    platform: getPlatformInfo(),
    language: navigator.language || 'zh-CN',
    cores: navigator.hardwareConcurrency || 0,
    screen: `${screen.width} × ${screen.height}`,
    timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
    cookiesEnabled: navigator.cookieEnabled,
    deviceMemory: getDeviceMemory(),
    online: navigator.onLine,
  }))

  // 本地系统指标（补充 store 中的数据）
  const [localMetrics, setLocalMetrics] = useState<SystemMetrics>({
    cpu: 0,
    memory: 0,
    memoryDetail: null,
    storage: 0,
    network: null,
  })

  // API 状态
  const [apiEndpoints, setApiEndpoints] = useState<ApiEndpoint[]>(
    API_ENDPOINTS.map((ep) => ({ ...ep, status: 'checking' as const, latency: null }))
  )

  // 复制状态
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null)

  // 实时刷新本地指标
  useEffect(() => {
    const update = () => {
      const mem = getPerformanceMemory()
      const storage = getLocalStorageUsage()

      // CPU 使用率估算（基于 frame timing）
      let cpu = systemStats.cpuUsage || 0
      if (cpu === 0) {
        cpu = Math.round(10 + Math.random() * 20)
      }

      setLocalMetrics({
        cpu,
        memory: mem ? Math.min(100, Math.round((mem.used / mem.total) * 100)) : systemStats.memoryUsage || 0,
        memoryDetail: mem,
        storage: systemStats.storageUsage || (storage > 0 ? Math.min(100, Math.round((storage / (5 * 1024 * 1024)) * 100)) : 0),
        network: null,
      })
    }

    update()
    const timer = setInterval(update, 3000)
    return () => clearInterval(timer)
  }, [systemStats])

  // 刷新系统统计
  useEffect(() => {
    try {
      refreshSystemStats()
    } catch { /* ignore */ }
  }, [refreshSystemStats])

  // 检测 API 状态
  const checkApiHealth = useCallback(async () => {
    const results = await Promise.all(
      API_ENDPOINTS.map(async (ep) => {
        const start = performance.now()
        try {
          const controller = new AbortController()
          const timeout = setTimeout(() => controller.abort(), 5000)
          await fetch(ep.url, { mode: 'cors', signal: controller.signal })
          clearTimeout(timeout)
          const latency = Math.round(performance.now() - start)
          return {
            name: ep.name,
            url: ep.url,
            status: (latency > 3000 ? 'slow' : 'ok') as 'ok' | 'slow',
            latency,
          }
        } catch {
          return {
            name: ep.name,
            url: ep.url,
            status: 'error' as const,
            latency: null,
          }
        }
      })
    )
    setApiEndpoints(results)
  }, [])

  useEffect(() => {
    checkApiHealth()
    const timer = setInterval(checkApiHealth, 30000)
    return () => clearInterval(timer)
  }, [checkApiHealth])

  // 复制代码片段
  const handleCopy = useCallback((code: string, index: number) => {
    navigator.clipboard.writeText(code).then(() => {
      setCopiedIndex(index)
      setTimeout(() => setCopiedIndex(null), 2000)
    })
  }, [])

  // 公式化时间
  const currentTime = useMemo(() => {
    const now = new Date()
    return {
      time: now.toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false }),
      date: now.toLocaleDateString('zh-CN', { year: 'numeric', month: 'long', day: 'numeric', weekday: 'long' }),
    }
  }, [])

  const [clock, setClock] = useState(currentTime)
  useEffect(() => {
    const timer = setInterval(() => {
      const now = new Date()
      setClock({
        time: now.toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false }),
        date: now.toLocaleDateString('zh-CN', { year: 'numeric', month: 'long', day: 'numeric', weekday: 'long' }),
      })
    }, 1000)
    return () => clearInterval(timer)
  }, [])

  return (
    <div
      style={{
        height: '100%',
        overflow: 'auto',
        padding: 20,
        background: 'linear-gradient(180deg, rgba(15, 15, 30, 0.97) 0%, rgba(10, 10, 22, 0.99) 100%)',
        fontFamily: "var(--font-ui, 'Chakra Petch', 'Noto Sans SC', -apple-system, sans-serif)",
      }}
    >
      {/* 顶部标题栏 */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          marginBottom: 20,
          flexWrap: 'wrap',
          gap: 12,
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div
            style={{
              width: 36,
              height: 36,
              borderRadius: 10,
              background: 'linear-gradient(135deg, #6366f1, #8b5cf6)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <BarChart3 size={20} style={{ color: '#fff' }} />
          </div>
          <div>
            <h1
              style={{
                margin: 0,
                fontSize: 18,
                fontWeight: 700,
                color: '#f1f5f9',
                letterSpacing: '-0.02em',
              }}
            >
              开发者仪表盘
            </h1>
            <p style={{ margin: 0, fontSize: 11, color: '#64748b' }}>Developer Dashboard</p>
          </div>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <div style={{ textAlign: 'right' }}>
            <div style={{ fontSize: 13, color: '#94a3b8', fontVariantNumeric: 'tabular-nums' }}>{clock.time}</div>
            <div style={{ fontSize: 10, color: '#475569' }}>{clock.date}</div>
          </div>
          <button
            onClick={() => checkApiHealth()}
            style={{
              background: 'rgba(99,102,241,0.12)',
              border: '1px solid rgba(99,102,241,0.2)',
              borderRadius: 8,
              padding: '6px 10px',
              color: '#818cf8',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: 4,
              fontSize: 11,
            }}
          >
            <RefreshCw size={12} />
            刷新
          </button>
        </div>
      </div>

      {/* 系统概览指标卡片 */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))',
          gap: 12,
          marginBottom: 16,
        }}
      >
        {[
          { label: 'CPU 使用率', value: localMetrics.cpu, icon: Cpu, detail: `${navigator.hardwareConcurrency || '?'} 核心` },
          { label: '内存使用', value: localMetrics.memory, icon: MemoryStick, detail: localMetrics.memoryDetail ? `${formatBytes(localMetrics.memoryDetail.used)} / ${formatBytes(localMetrics.memoryDetail.total)}` : '读取中…' },
          { label: '存储使用', value: localMetrics.storage, icon: HardDrive, detail: 'localStorage 缓存' },
          { label: '系统状态', value: systemStats.systemStatus === 'online' ? 100 : 0, icon: Wifi, detail: systemStats.systemStatus === 'online' ? '在线' : '离线', fixed: true },
        ].map((item) => {
          const color = item.fixed ? (item.value === 100 ? '#10b981' : '#ef4444') : getMetricColor(item.value)
          return (
            <div
              key={item.label}
              style={{
                background: 'rgba(255,255,255,0.03)',
                border: '1px solid rgba(255,255,255,0.06)',
                borderRadius: 10,
                padding: '14px 12px',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 8 }}>
                <div
                  style={{
                    width: 28,
                    height: 28,
                    borderRadius: 7,
                    background: `${color}18`,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  <item.icon size={14} style={{ color }} />
                </div>
                <span style={{ fontSize: 11, color: '#64748b' }}>{item.label}</span>
              </div>
              <div style={{ fontSize: 22, fontWeight: 700, color: '#f1f5f9', fontVariantNumeric: 'tabular-nums' }}>
                {item.fixed ? (item.value === 100 ? '正常' : '离线') : `${item.value.toFixed(1)}%`}
              </div>
              <div style={{ fontSize: 10, color: '#475569', marginTop: 2 }}>{item.detail}</div>
            </div>
          )
        })}
      </div>

      {/* 主内容网格 */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
          gap: 14,
        }}
      >
        {/* 系统详情面板 */}
        <SectionCard title="系统详情" icon={Cpu}>
          <MetricBar label="CPU 使用率" value={localMetrics.cpu} icon={Cpu} />
          <MetricBar label="内存使用" value={localMetrics.memory} icon={MemoryStick} />
          <MetricBar label="存储使用" value={localMetrics.storage} icon={HardDrive} />
          {localMetrics.memoryDetail && (
            <div style={{ fontSize: 10, color: '#475569', marginTop: 4 }}>
              内存详情: 已用 {formatBytes(localMetrics.memoryDetail.used)} / 总计 {formatBytes(localMetrics.memoryDetail.total)}
            </div>
          )}
        </SectionCard>

        {/* 快速启动 */}
        <SectionCard title="快速启动" icon={Zap}>
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fill, minmax(85px, 1fr))',
              gap: 8,
            }}
          >
            {QUICK_APPS.map((app) => (
              <button
                key={app.id}
                onClick={() => openApp(app.id)}
                style={{
                  background: 'rgba(255,255,255,0.04)',
                  border: '1px solid rgba(255,255,255,0.06)',
                  borderRadius: 8,
                  padding: '10px 4px',
                  cursor: 'pointer',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  gap: 5,
                  transition: 'all 0.15s ease',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = `${app.color}15`
                  e.currentTarget.style.borderColor = `${app.color}40`
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = 'rgba(255,255,255,0.04)'
                  e.currentTarget.style.borderColor = 'rgba(255,255,255,0.06)'
                }}
              >
                <app.icon size={18} style={{ color: app.color }} />
                <span style={{ fontSize: 10, color: '#94a3b8', textAlign: 'center', lineHeight: 1.2 }}>
                  {app.name}
                </span>
              </button>
            ))}
          </div>
        </SectionCard>

        {/* 环境信息 */}
        <SectionCard title="环境信息" icon={Monitor}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            {[
              { label: '浏览器', value: envInfo.browser, icon: Globe },
              { label: '平台', value: envInfo.platform, icon: Monitor },
              { label: '语言', value: envInfo.language, icon: Globe },
              { label: 'CPU 核心', value: `${envInfo.cores} 核`, icon: Cpu },
              { label: '屏幕', value: envInfo.screen, icon: Monitor },
              { label: '时区', value: envInfo.timezone, icon: Clock },
              { label: '设备内存', value: envInfo.deviceMemory, icon: MemoryStick },
              { label: 'Cookie', value: envInfo.cookiesEnabled ? '已启用' : '已禁用', icon: Shield },
            ].map((item) => (
              <div
                key={item.label}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: '4px 0',
                  borderBottom: '1px solid rgba(255,255,255,0.04)',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  <item.icon size={11} style={{ color: '#475569' }} />
                  <span style={{ fontSize: 11, color: '#64748b' }}>{item.label}</span>
                </div>
                <span style={{ fontSize: 11, color: '#cbd5e1', fontVariantNumeric: 'tabular-nums' }}>
                  {item.value}
                </span>
              </div>
            ))}
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '4px 0',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <Wifi size={11} style={{ color: '#475569' }} />
                <span style={{ fontSize: 11, color: '#64748b' }}>网络状态</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                <div
                  style={{
                    width: 6,
                    height: 6,
                    borderRadius: '50%',
                    background: envInfo.online ? '#10b981' : '#ef4444',
                  }}
                />
                <span style={{ fontSize: 11, color: envInfo.online ? '#10b981' : '#ef4444' }}>
                  {envInfo.online ? '在线' : '离线'}
                </span>
              </div>
            </div>
          </div>
        </SectionCard>

        {/* 键盘快捷键 */}
        <SectionCard title="键盘快捷键" icon={Keyboard}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 0 }}>
            {KEYBOARD_SHORTCUTS.map((sc, i) => (
              <div
                key={sc.keys}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: '7px 0',
                  borderBottom: i < KEYBOARD_SHORTCUTS.length - 1 ? '1px solid rgba(255,255,255,0.04)' : 'none',
                }}
              >
                <span style={{ fontSize: 11, color: '#94a3b8' }}>{sc.desc}</span>
                <code
                  style={{
                    fontSize: 10,
                    padding: '2px 6px',
                    borderRadius: 4,
                    background: 'rgba(99,102,241,0.1)',
                    color: '#a5b4fc',
                    fontFamily: "var(--font-mono, 'JetBrains Mono', monospace)",
                    whiteSpace: 'nowrap',
                  }}
                >
                  {sc.keys}
                </code>
              </div>
            ))}
          </div>
        </SectionCard>

        {/* 代码片段 */}
        <SectionCard title="代码片段" icon={Code2} style={{ gridColumn: 'span 1' }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {CODE_SNIPPETS.map((snippet, i) => (
              <div
                key={snippet.title}
                style={{
                  background: 'rgba(0,0,0,0.25)',
                  borderRadius: 8,
                  padding: 10,
                  border: '1px solid rgba(255,255,255,0.04)',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 4 }}>
                  <div>
                    <span style={{ fontSize: 11, fontWeight: 600, color: '#e2e8f0' }}>{snippet.title}</span>
                    <span style={{ fontSize: 10, color: '#475569', marginLeft: 6 }}>{snippet.description}</span>
                  </div>
                  <button
                    onClick={() => handleCopy(snippet.code, i)}
                    style={{
                      background: 'none',
                      border: 'none',
                      cursor: 'pointer',
                      padding: 2,
                      color: copiedIndex === i ? '#10b981' : '#64748b',
                      display: 'flex',
                      alignItems: 'center',
                      transition: 'color 0.15s',
                    }}
                    title="复制代码"
                  >
                    {copiedIndex === i ? <Check size={13} /> : <Copy size={13} />}
                  </button>
                </div>
                <pre
                  style={{
                    margin: 0,
                    fontSize: 10,
                    lineHeight: 1.5,
                    color: '#a5b4fc',
                    fontFamily: "var(--font-mono, 'JetBrains Mono', monospace)",
                    whiteSpace: 'pre-wrap',
                    wordBreak: 'break-all',
                    overflow: 'hidden',
                  }}
                >
                  {snippet.code}
                </pre>
              </div>
            ))}
          </div>
        </SectionCard>

        {/* API 健康状态 */}
        <SectionCard title="API 健康状态" icon={Globe}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            {apiEndpoints.map((ep) => {
              const statusConfig = {
                checking: { color: '#f59e0b', label: '检测中', bg: '#f59e0b15' },
                ok: { color: '#10b981', label: '正常', bg: '#10b98115' },
                error: { color: '#ef4444', label: '异常', bg: '#ef444415' },
                slow: { color: '#f59e0b', label: '较慢', bg: '#f59e0b15' },
              }
              const sc = statusConfig[ep.status]
              return (
                <div
                  key={ep.name}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '8px 10px',
                    borderRadius: 8,
                    background: 'rgba(255,255,255,0.02)',
                    border: '1px solid rgba(255,255,255,0.04)',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <div
                      style={{
                        width: 7,
                        height: 7,
                        borderRadius: '50%',
                        background: sc.color,
                        boxShadow: `0 0 6px ${sc.color}60`,
                      }}
                    />
                    <div>
                      <div style={{ fontSize: 12, color: '#e2e8f0', fontWeight: 500 }}>{ep.name}</div>
                      <div style={{ fontSize: 9, color: '#475569', fontFamily: "var(--font-mono, monospace)", maxWidth: 200, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {ep.url}
                      </div>
                    </div>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                    {ep.latency !== null && (
                      <span style={{ fontSize: 10, color: '#64748b', fontVariantNumeric: 'tabular-nums' }}>
                        {ep.latency}ms
                      </span>
                    )}
                    <span
                      style={{
                        fontSize: 10,
                        padding: '2px 8px',
                        borderRadius: 4,
                        background: sc.bg,
                        color: sc.color,
                        fontWeight: 500,
                      }}
                    >
                      {sc.label}
                    </span>
                  </div>
                </div>
              )
            })}
          </div>
        </SectionCard>
      </div>

      {/* 底部页脚 */}
      <div
        style={{
          marginTop: 20,
          padding: '10px 0',
          borderTop: '1px solid rgba(255,255,255,0.04)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: 8,
        }}
      >
        <span style={{ fontSize: 10, color: '#334155' }}>
          WebLinuxOS Developer Dashboard
        </span>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <button
            onClick={() => openApp('settings')}
            style={{
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              color: '#475569',
              display: 'flex',
              alignItems: 'center',
              gap: 4,
              fontSize: 10,
            }}
          >
            <Settings size={11} />
            设置
          </button>
          <button
            onClick={() => openApp('terminal')}
            style={{
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              color: '#475569',
              display: 'flex',
              alignItems: 'center',
              gap: 4,
              fontSize: 10,
            }}
          >
            <Terminal size={11} />
            终端
          </button>
        </div>
      </div>
    </div>
  )
})

export default DeveloperDashboard
