import { useState, useEffect, useCallback } from 'react'
import {
  Activity, Cpu, HardDrive, Network, Globe, Shield, Zap,
  Download, RefreshCw, CheckCircle, AlertTriangle, XCircle,
  Copy, FileJson, Gauge, BarChart3, Code,
  MemoryStick, Layers, Radio, Wifi, WifiOff,
  FileText, Database, Lock as LockIcon
} from 'lucide-react'

interface CPUInfo {
  cores: number
  logicalProcessors: number
  frequency: string
  cacheInfo: string
  instructionSet: string
  architecture: string
}

interface MemoryInfo {
  total: number | null
  used: number | null
  available: number | null
  swapTotal: number | null
  swapUsed: number | null
  cached: number | null
  buffers: number | null
  percentage: number
}

interface StorageInfo {
  totalSpace: number | null
  usedSpace: number | null
  availableSpace: number | null
  percentage: number
  partitions: { label: string; used: number; total: number }[]
  ioReadSpeed: number | null
  ioWriteSpeed: number | null
}

interface NetworkInfo {
  type: string
  effectiveType: string
  downlink: number | null
  uplink: number | null
  rtt: number | null
  saveData: boolean
  online: boolean
  latencyEstimate: number
  bandwidthEstimate: number
}

interface BrowserInfo {
  name: string
  version: string
  engine: string
  userAgent: string
  platform: string
  vendor: string
  language: string
  languages: string[]
  cookieEnabled: boolean
  doNotTrack: string | null
  availableAPIs: string[]
}

interface SecurityInfo {
  cspSupported: boolean
  cspHeader: string | null
  cookieSet: boolean
  localStorageQuota: number | null
  localStorageUsed: number | null
  sessionStorageAvailable: boolean
  insecureContext: boolean
  httpsReady: boolean
  mixedContent: boolean
}

interface PerfInfo {
  fps: number
  renderTime: number
  loadTime: number
  domReadyTime: number
  jsHeapUsed: number | null
  jsHeapTotal: number | null
  jsHeapLimit: number | null
  memoryPressure: number
  scriptExecutionSpeed: number
  domElements: number
}

interface DiagnosticReport {
  timestamp: string
  cpu: CPUInfo
  memory: MemoryInfo
  storage: StorageInfo
  network: NetworkInfo
  browser: BrowserInfo
  security: SecurityInfo
  performance: PerfInfo
  summary: {
    score: number
    issues: string[]
    highlights: string[]
  }
}

type TabId = 'cpu' | 'memory' | 'storage' | 'network' | 'browser' | 'security' | 'performance' | 'report'

function detectCPU(): CPUInfo {
  const cores = navigator.hardwareConcurrency || 1
  const logicalProcessors = cores
  let architecture = 'x86_64'
  if (/arm/i.test(navigator.userAgent)) architecture = 'ARM'
  else if (/64/i.test(navigator.userAgent)) architecture = 'x86_64'
  
  return {
    cores,
    logicalProcessors,
    frequency: 'N/A (浏览器限制)',
    cacheInfo: 'N/A (浏览器限制)',
    instructionSet: 'N/A',
    architecture,
  }
}

function detectBrowser(): BrowserInfo {
  const ua = navigator.userAgent
  let name = '未知', version = '未知', engine = '未知'

  if (/Edg\/([\d.]+)/.test(ua)) { name = 'Edge'; version = RegExp.$1 }
  else if (/Chrome\/([\d.]+)/.test(ua)) { name = 'Chrome'; version = RegExp.$1 }
  else if (/Firefox\/([\d.]+)/.test(ua)) { name = 'Firefox'; version = RegExp.$1 }
  else if (/Safari\/([\d.]+)/.test(ua)) { name = 'Safari'; version = RegExp.$1 }
  else if (/OPR\/([\d.]+)/.test(ua)) { name = 'Opera'; version = RegExp.$1 }

  if (/WebKit/.test(ua)) engine = 'WebKit/Blink'
  else if (/Gecko/.test(ua)) engine = 'Gecko'
  else if (/Trident/.test(ua)) engine = 'Trident'

  const apis: string[] = []
  if ('geolocation' in navigator) apis.push('地理定位')
  if ('mediaDevices' in navigator) apis.push('媒体设备')
  if ('serviceWorker' in navigator) apis.push('Service Worker')
  if ('wakeLock' in navigator) apis.push('唤醒锁')
  if ('bluetooth' in navigator) apis.push('蓝牙')
  if ('usb' in navigator) apis.push('USB')
  if ('webAssembly' in navigator) apis.push('WebAssembly')
  if ('webGL' in window) apis.push('WebGL')

  return {
    name, version, engine,
    userAgent: ua,
    platform: navigator.platform || '未知',
    vendor: navigator.vendor || 'N/A',
    language: navigator.language,
    languages: Array.from(new Set(navigator.languages || [navigator.language])),
    cookieEnabled: navigator.cookieEnabled,
    doNotTrack: navigator.doNotTrack,
    availableAPIs: apis,
  }
}

function detectMemory(): MemoryInfo {
  const perfMemory = (performance as unknown as { memory?: { jsHeapSizeLimit: number; totalJSHeapSize: number; usedJSHeapSize: number } }).memory
  const total = perfMemory?.jsHeapSizeLimit || null
  const used = perfMemory?.usedJSHeapSize || null
  const available = total && used ? total - used : null
  const percentage = total && used ? Math.round((used / total) * 100) : 0

  return {
    total,
    used,
    available,
    swapTotal: null,
    swapUsed: null,
    cached: null,
    buffers: null,
    percentage,
  }
}

async function detectStorage(): Promise<StorageInfo> {
  let totalSpace: number | null = null
  let usedSpace: number | null = null
  let availableSpace: number | null = null

  try {
    if ('storage' in navigator && 'estimate' in navigator.storage) {
      const estimate = await navigator.storage.estimate()
      totalSpace = estimate.quota || null
      usedSpace = estimate.usage || null
      availableSpace = totalSpace && usedSpace ? totalSpace - usedSpace : null
    }
  } catch {
    // ignore
  }

  const percentage = totalSpace && usedSpace ? Math.round((usedSpace / totalSpace) * 100) : 0

  return {
    totalSpace,
    usedSpace,
    availableSpace,
    percentage,
    partitions: [],
    ioReadSpeed: null,
    ioWriteSpeed: null,
  }
}

function detectNetwork(): NetworkInfo {
  const conn = (navigator as unknown as { connection?: { effectiveType: string; downlink?: number; uplink?: number; rtt?: number; saveData?: boolean; type?: string } }).connection
  const type = conn?.type || 'unknown'
  const effectiveType = conn?.effectiveType || 'unknown'
  const downlink = conn?.downlink || null
  const uplink = conn?.uplink || null
  const rtt = conn?.rtt || null
  const saveData = conn?.saveData || false
  const online = navigator.onLine

  const bandwidthMap: Record<string, number> = { 'slow-2g': 0.05, '2g': 0.1, '3g': 0.75, '4g': 10 }
  return {
    type,
    effectiveType,
    downlink,
    uplink,
    rtt,
    saveData,
    online,
    latencyEstimate: rtt || bandwidthMap[effectiveType] || 50,
    bandwidthEstimate: downlink || bandwidthMap[effectiveType] || 1,
  }
}

function detectSecurity(): SecurityInfo {
  const insecureContext = !window.isSecureContext
  const httpsReady = location.protocol === 'https:'
  
  let localStorageQuota: number | null = null
  let localStorageUsed: number | null = null

  try {
    let total = 0
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i)
      if (key) {
        const val = localStorage.getItem(key)
        total += key.length + (val ? val.length : 0)
      }
    }
    localStorageUsed = total

    const testKey = '__diag_quota_test__'
    try {
      let low = 0, high = 20 * 1024 * 1024
      while (low < high - 1) {
        const mid = Math.floor((low + high) / 2)
        try {
          localStorage.setItem(testKey, 'x'.repeat(mid))
          low = mid
        } catch {
          high = mid
        }
      }
      localStorage.removeItem(testKey)
      localStorageQuota = low
    } catch {
      localStorageQuota = total
    }
  } catch {
    // localStorage not available
  }

  return {
    cspSupported: true,
    cspHeader: null,
    cookieSet: navigator.cookieEnabled,
    localStorageQuota,
    localStorageUsed,
    sessionStorageAvailable: typeof sessionStorage !== 'undefined',
    insecureContext,
    httpsReady,
    mixedContent: false,
  }
}

function detectPerformance(): PerfInfo {
  const navEntry = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming | undefined
  const loadTime = navEntry ? Math.round(navEntry.loadEventEnd - navEntry.startTime) : 0
  const domReadyTime = navEntry ? Math.round(navEntry.domContentLoadedEventEnd - navEntry.startTime) : 0

  let scriptExecutionSpeed = 0
  try {
    const start = performance.now()
    let counter = 0
    for (let i = 0; i < 1000000; i++) counter++
    const elapsed = performance.now() - start
    scriptExecutionSpeed = Math.round(1000000 / elapsed)
  } catch {
    scriptExecutionSpeed = 0
  }

  const jsHeapUsed = (performance as unknown as { memory?: { usedJSHeapSize: number } }).memory?.usedJSHeapSize || null
  const jsHeapTotal = (performance as unknown as { memory?: { totalJSHeapSize: number } }).memory?.totalJSHeapSize || null
  const jsHeapLimit = (performance as unknown as { memory?: { jsHeapSizeLimit: number } }).memory?.jsHeapSizeLimit || null

  return {
    fps: 0,
    renderTime: 0,
    loadTime,
    domReadyTime,
    jsHeapUsed,
    jsHeapTotal,
    jsHeapLimit,
    memoryPressure: 0,
    scriptExecutionSpeed,
    domElements: document.querySelectorAll('*').length,
  }
}

function formatBytes(bytes: number | null): string {
  if (bytes === null || bytes === undefined) return '不可用'
  if (bytes === 0) return '0 B'
  const k = 1024
  const sizes = ['B', 'KB', 'MB', 'GB', 'TB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
}

function formatSpeed(mbps: number | null): string {
  if (mbps === null || mbps === undefined) return '不可用'
  if (mbps >= 1) return `${mbps.toFixed(1)} Mbps`
  return `${Math.round(mbps * 1000)} Kbps`
}

function getDefaultReport(): DiagnosticReport {
  return {
    timestamp: '',
    cpu: { cores: 0, logicalProcessors: 0, frequency: 'N/A', cacheInfo: 'N/A', instructionSet: 'N/A', architecture: 'N/A' },
    memory: { total: null, used: null, available: null, swapTotal: null, swapUsed: null, cached: null, buffers: null, percentage: 0 },
    storage: { totalSpace: null, usedSpace: null, availableSpace: null, percentage: 0, partitions: [], ioReadSpeed: null, ioWriteSpeed: null },
    network: { type: 'N/A', effectiveType: 'N/A', downlink: null, uplink: null, rtt: null, saveData: false, online: true, latencyEstimate: 0, bandwidthEstimate: 0 },
    browser: { name: 'N/A', version: 'N/A', engine: 'N/A', userAgent: '', platform: 'N/A', vendor: 'N/A', language: 'N/A', languages: [], cookieEnabled: false, doNotTrack: null, availableAPIs: [] },
    security: { cspSupported: false, cspHeader: null, cookieSet: false, localStorageQuota: null, localStorageUsed: null, sessionStorageAvailable: false, insecureContext: true, httpsReady: false, mixedContent: false },
    performance: { fps: 0, renderTime: 0, loadTime: 0, domReadyTime: 0, scriptExecutionSpeed: 0, memoryPressure: 0, domElements: 0, jsHeapUsed: null, jsHeapTotal: null, jsHeapLimit: null },
    summary: { score: 0, issues: [], highlights: [] },
  }
}

function calculateScore(report: DiagnosticReport): { score: number; issues: string[]; highlights: string[] } {
  let score = 100
  const issues: string[] = []
  const highlights: string[] = []

  if (report.security.insecureContext) { score -= 20; issues.push('当前页面不在安全上下文(HTTPS)中') }
  else { highlights.push('安全上下文(HTTPS)') }

  if (report.security.httpsReady) highlights.push('HTTPS已启用')
  else { score -= 15; issues.push('HTTPS未启用') }

  if (report.memory.percentage > 80) { score -= 10; issues.push(`内存使用率过高: ${report.memory.percentage}%`) }
  else if (report.memory.percentage > 50) { score -= 5 }
  else if (report.memory.percentage > 0) highlights.push(`内存使用正常(${report.memory.percentage}%)`)

  if (report.storage.percentage > 90) { score -= 10; issues.push(`存储空间严重不足: ${report.storage.percentage}%`) }
  else if (report.storage.percentage > 70) { score -= 5 }

  if (!report.network.online) { score -= 10; issues.push('当前离线状态') }
  else if (report.network.effectiveType === 'slow-2g' || report.network.effectiveType === '2g') {
    score -= 5; issues.push(`网络连接较慢: ${report.network.effectiveType}`)
  }

  if (report.browser.cookieEnabled) highlights.push('Cookie已启用')
  else { score -= 5; issues.push('Cookie未启用') }

  if (report.browser.availableAPIs.length >= 5) highlights.push(`支持 ${report.browser.availableAPIs.length} 个高级API`)

  if (report.performance.loadTime > 5000) { score -= 10; issues.push(`页面加载时间过长: ${report.performance.loadTime}ms`) }
  else if (report.performance.loadTime > 2000) { score -= 5 }
  else if (report.performance.loadTime > 0) highlights.push(`页面加载较快: ${report.performance.loadTime}ms`)

  if (score < 0) score = 0
  if (score > 100) score = 100

  return { score, issues, highlights }
}

export default function SystemDiagnostics() {
  const [activeTab, setActiveTab] = useState<TabId>('cpu')
  const [report, setReport] = useState<DiagnosticReport>(getDefaultReport())
  const [showExport, setShowExport] = useState(false)
  const [isRunning, setIsRunning] = useState(false)
  const [progress, setProgress] = useState(0)
  const [copiedId, setCopiedId] = useState<string | null>(null)

  const runFullDiagnostics = useCallback(async () => {
    setIsRunning(true)
    setProgress(15)

    const cpu = detectCPU()
    setProgress(25)

    const browser = detectBrowser()
    setProgress(40)

    const memory = detectMemory()
    setProgress(55)

    const storage = await detectStorage()
    setProgress(70)

    const network = detectNetwork()
    setProgress(80)

    const security = detectSecurity()
    setProgress(90)

    const perfData = detectPerformance()
    setProgress(95)

    const newReport: DiagnosticReport = {
      timestamp: new Date().toISOString(),
      cpu,
      memory,
      storage,
      network,
      browser,
      security,
      performance: perfData,
      summary: { score: 0, issues: [], highlights: [] },
    }

    const summary = calculateScore(newReport)
    newReport.summary = summary

    setReport(newReport)
    setProgress(100)
    setIsRunning(false)
  }, [])

  useEffect(() => {
    runFullDiagnostics()
  }, [runFullDiagnostics])

  const copyToClipboard = (text: string, id: string) => {
    navigator.clipboard.writeText(text).then(() => {
      setCopiedId(id)
      setTimeout(() => setCopiedId(null), 2000)
    })
  }

  const exportAsJSON = () => {
    const jsonString = JSON.stringify(report, null, 2)
    const blob = new Blob([jsonString], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `system-diagnostics-${Date.now()}.json`
    a.click()
    URL.revokeObjectURL(url)
  }

  const isDark = true
  const bg = isDark ? '#0f0f1a' : '#f5f5fa'
  const cardBg = isDark ? 'rgba(30,30,50,0.8)' : 'rgba(255,255,255,0.9)'
  const glassBg = isDark ? 'rgba(255,255,255,0.05)' : 'rgba(255,255,255,0.7)'
  const glassBorder = isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.08)'
  const textPrimary = isDark ? '#e0e0e8' : '#1a1a2e'
  const textSecondary = isDark ? '#9ca3af' : '#6b7280'
  const accentColor = '#6366f1'
  const divider = isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.06)'

  const tabs: { id: TabId; label: string; icon: React.ReactNode }[] = [
    { id: 'cpu', label: 'CPU', icon: <Cpu size={16} /> },
    { id: 'memory', label: '内存', icon: <MemoryStick size={16} /> },
    { id: 'storage', label: '存储', icon: <HardDrive size={16} /> },
    { id: 'network', label: '网络', icon: <Network size={16} /> },
    { id: 'browser', label: '浏览器', icon: <Globe size={16} /> },
    { id: 'security', label: '安全', icon: <Shield size={16} /> },
    { id: 'performance', label: '性能', icon: <Gauge size={16} /> },
    { id: 'report', label: '报告', icon: <FileText size={16} /> },
  ]

  return (
    <div style={{
      height: '100%',
      background: bg,
      color: textPrimary,
      display: 'flex',
      flexDirection: 'column',
      overflow: 'hidden',
      fontFamily: 'system-ui, -apple-system, "Segoe UI", sans-serif',
      fontSize: 13,
    }}>
      {/* Header */}
      <div style={{
        padding: '16px 20px',
        background: glassBg,
        backdropFilter: 'blur(12px)',
        borderBottom: `1px solid ${glassBorder}`,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        flexShrink: 0,
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <div style={{
            width: 40, height: 40, borderRadius: 12,
            background: `linear-gradient(135deg, ${accentColor}, #a78bfa)`,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            boxShadow: `0 4px 12px rgba(99,102,241,0.4)`,
          }}>
            <Activity size={22} color="#fff" />
          </div>
          <div>
            <div style={{ fontSize: 17, fontWeight: 700, letterSpacing: '-0.02em' }}>系统诊断分析</div>
            <div style={{ fontSize: 12, color: textSecondary }}>全面检测系统状态 · 性能分析 · 安全评估</div>
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          {isRunning && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <RefreshCw size={14} color={accentColor} style={{ animation: 'spin 1s linear infinite' }} />
              <span style={{ fontSize: 12, color: textSecondary }}>检测中... {progress}%</span>
            </div>
          )}
          <button onClick={runFullDiagnostics} disabled={isRunning} style={{
            display: 'flex', alignItems: 'center', gap: 6,
            padding: '8px 16px',
            background: isRunning ? textSecondary : `linear-gradient(135deg, ${accentColor}, #a78bfa)`,
            border: 'none', borderRadius: 10,
            color: '#fff', cursor: isRunning ? 'not-allowed' : 'pointer',
            fontSize: 12, fontWeight: 600,
          }}>
            <RefreshCw size={14} style={{ animation: isRunning ? 'spin 1s linear infinite' : 'none' }} />
            {isRunning ? '检测中' : '重新检测'}
          </button>
          <button onClick={() => setShowExport(!showExport)} style={{
            display: 'flex', alignItems: 'center', gap: 6,
            padding: '8px 16px',
            background: glassBg,
            border: `1px solid ${glassBorder}`,
            borderRadius: 10,
            color: textPrimary,
            cursor: 'pointer',
            fontSize: 12, fontWeight: 500,
          }}>
            <Download size={14} /> 导出
          </button>
        </div>
      </div>

      {/* Progress bar */}
      {isRunning && (
        <div style={{
          height: 3, background: divider, flexShrink: 0,
        }}>
          <div style={{
            height: '100%',
            width: `${progress}%`,
            background: `linear-gradient(90deg, ${accentColor}, #a78bfa)`,
            transition: 'width 0.3s ease',
          }} />
        </div>
      )}

      {/* Tabs */}
      <div style={{
        display: 'flex', padding: '0 20px',
        borderBottom: `1px solid ${divider}`,
        flexShrink: 0,
        overflowX: 'auto',
      }}>
        {tabs.map(tab => (
          <button key={tab.id} onClick={() => setActiveTab(tab.id)} style={{
            display: 'flex', alignItems: 'center', gap: 6,
            padding: '12px 16px',
            background: 'transparent', border: 'none',
            color: activeTab === tab.id ? accentColor : textSecondary,
            borderBottom: activeTab === tab.id ? `2px solid ${accentColor}` : '2px solid transparent',
            cursor: 'pointer', fontSize: 13, fontWeight: activeTab === tab.id ? 600 : 400,
            transition: 'all 0.2s',
            whiteSpace: 'nowrap',
          }}>
            {tab.icon}
            {tab.label}
          </button>
        ))}
      </div>

      {/* Content */}
      <div style={{ flex: 1, overflow: 'auto', padding: 20 }}>
        {activeTab === 'cpu' && (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: 16 }}>
            <div style={{
              padding: 20, background: cardBg, borderRadius: 12,
              border: `1px solid ${glassBorder}`, backdropFilter: 'blur(8px)',
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 16 }}>
                <Cpu size={20} color={accentColor} />
                <span style={{ fontSize: 14, fontWeight: 600 }}>CPU 信息</span>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ color: textSecondary }}>核心数</span>
                  <span style={{ fontWeight: 600 }}>{report.cpu.cores}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ color: textSecondary }}>逻辑处理器</span>
                  <span style={{ fontWeight: 600 }}>{report.cpu.logicalProcessors}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ color: textSecondary }}>架构</span>
                  <span style={{ fontWeight: 600 }}>{report.cpu.architecture}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ color: textSecondary }}>频率</span>
                  <span style={{ fontWeight: 600 }}>{report.cpu.frequency}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ color: textSecondary }}>缓存</span>
                  <span style={{ fontWeight: 600 }}>{report.cpu.cacheInfo}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ color: textSecondary }}>指令集</span>
                  <span style={{ fontWeight: 600 }}>{report.cpu.instructionSet}</span>
                </div>
              </div>
            </div>

            <div style={{
              padding: 20, background: cardBg, borderRadius: 12,
              border: `1px solid ${glassBorder}`, backdropFilter: 'blur(8px)',
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 16 }}>
                <BarChart3 size={20} color={accentColor} />
                <span style={{ fontSize: 14, fontWeight: 600 }}>性能估算</span>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ color: textSecondary }}>CPU 核心数</span>
                  <span style={{ fontWeight: 600 }}>{report.cpu.cores}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ color: textSecondary }}>并发能力</span>
                  <span style={{ fontWeight: 600 }}>{report.cpu.logicalProcessors} 线程</span>
                </div>
                <div style={{
                  padding: '12px',
                  background: glassBg, borderRadius: 8,
                  border: `1px solid ${glassBorder}`, marginTop: 8,
                }}>
                  <div style={{ fontSize: 11, color: textSecondary, marginBottom: 4 }}>说明</div>
                  <div style={{ fontSize: 12, lineHeight: 1.6 }}>
                    浏览器环境限制了CPU的详细信息访问。实际性能请参考桌面端工具。
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'memory' && (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: 16 }}>
            <div style={{
              padding: 20, background: cardBg, borderRadius: 12,
              border: `1px solid ${glassBorder}`, backdropFilter: 'blur(8px)',
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 16 }}>
                <MemoryStick size={20} color={accentColor} />
                <span style={{ fontSize: 14, fontWeight: 600 }}>内存使用</span>
              </div>
              <div style={{ textAlign: 'center', marginBottom: 20 }}>
                <div style={{ position: 'relative', width: 120, height: 120, margin: '0 auto' }}>
                  <svg width="120" height="120">
                    <circle cx="60" cy="60" r="50" fill="none" stroke={divider} strokeWidth="10" />
                    <circle
                      cx="60" cy="60" r="50" fill="none"
                      stroke={report.memory.percentage > 80 ? '#ef4444' : accentColor}
                      strokeWidth="10"
                      strokeDasharray={`${(report.memory.percentage / 100) * 314} 314`}
                      strokeDashoffset="0"
                      transform="rotate(-90 60 60)"
                      strokeLinecap="round"
                    />
                  </svg>
                  <div style={{
                    position: 'absolute', top: '50%', left: '50%',
                    transform: 'translate(-50%, -50%)',
                    textAlign: 'center',
                  }}>
                    <div style={{ fontSize: 28, fontWeight: 700 }}>{report.memory.percentage}%</div>
                    <div style={{ fontSize: 11, color: textSecondary }}>使用率</div>
                  </div>
                </div>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ color: textSecondary }}>总容量</span>
                  <span style={{ fontWeight: 600 }}>{formatBytes(report.memory.total)}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ color: textSecondary }}>已使用</span>
                  <span style={{ fontWeight: 600, color: report.memory.percentage > 80 ? '#ef4444' : textPrimary }}>
                    {formatBytes(report.memory.used)}
                  </span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ color: textSecondary }}>可用</span>
                  <span style={{ fontWeight: 600 }}>{formatBytes(report.memory.available)}</span>
                </div>
              </div>
            </div>

            <div style={{
              padding: 20, background: cardBg, borderRadius: 12,
              border: `1px solid ${glassBorder}`, backdropFilter: 'blur(8px)',
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 16 }}>
                <Database size={20} color={accentColor} />
                <span style={{ fontSize: 14, fontWeight: 600 }}>内存详情</span>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ color: textSecondary }}>Swap 总量</span>
                  <span style={{ fontWeight: 600 }}>{formatBytes(report.memory.swapTotal)}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ color: textSecondary }}>Swap 已用</span>
                  <span style={{ fontWeight: 600 }}>{formatBytes(report.memory.swapUsed)}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ color: textSecondary }}>缓存</span>
                  <span style={{ fontWeight: 600 }}>{formatBytes(report.memory.cached)}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ color: textSecondary }}>缓冲区</span>
                  <span style={{ fontWeight: 600 }}>{formatBytes(report.memory.buffers)}</span>
                </div>
                <div style={{
                  padding: '12px',
                  background: glassBg, borderRadius: 8,
                  border: `1px solid ${glassBorder}`, marginTop: 8,
                }}>
                  <div style={{ fontSize: 11, color: textSecondary, marginBottom: 4 }}>提示</div>
                  <div style={{ fontSize: 12, lineHeight: 1.6 }}>
                    浏览器只能访问 JavaScript 堆内存信息。系统级内存详情需要操作系统权限。
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'storage' && (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: 16 }}>
            <div style={{
              padding: 20, background: cardBg, borderRadius: 12,
              border: `1px solid ${glassBorder}`, backdropFilter: 'blur(8px)',
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 16 }}>
                <HardDrive size={20} color={accentColor} />
                <span style={{ fontSize: 14, fontWeight: 600 }}>存储空间</span>
              </div>
              <div style={{ textAlign: 'center', marginBottom: 20 }}>
                <div style={{ position: 'relative', width: 120, height: 120, margin: '0 auto' }}>
                  <svg width="120" height="120">
                    <circle cx="60" cy="60" r="50" fill="none" stroke={divider} strokeWidth="10" />
                    <circle
                      cx="60" cy="60" r="50" fill="none"
                      stroke={report.storage.percentage > 90 ? '#ef4444' : report.storage.percentage > 70 ? '#f59e0b' : accentColor}
                      strokeWidth="10"
                      strokeDasharray={`${(report.storage.percentage / 100) * 314} 314`}
                      strokeDashoffset="0"
                      transform="rotate(-90 60 60)"
                      strokeLinecap="round"
                    />
                  </svg>
                  <div style={{
                    position: 'absolute', top: '50%', left: '50%',
                    transform: 'translate(-50%, -50%)',
                    textAlign: 'center',
                  }}>
                    <div style={{ fontSize: 28, fontWeight: 700 }}>{report.storage.percentage}%</div>
                    <div style={{ fontSize: 11, color: textSecondary }}>使用率</div>
                  </div>
                </div>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ color: textSecondary }}>总空间</span>
                  <span style={{ fontWeight: 600 }}>{formatBytes(report.storage.totalSpace)}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ color: textSecondary }}>已使用</span>
                  <span style={{ fontWeight: 600 }}>{formatBytes(report.storage.usedSpace)}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ color: textSecondary }}>可用</span>
                  <span style={{ fontWeight: 600 }}>{formatBytes(report.storage.availableSpace)}</span>
                </div>
              </div>
            </div>

            <div style={{
              padding: 20, background: cardBg, borderRadius: 12,
              border: `1px solid ${glassBorder}`, backdropFilter: 'blur(8px)',
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 16 }}>
                <Zap size={20} color={accentColor} />
                <span style={{ fontSize: 14, fontWeight: 600 }}>IO 性能</span>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                <div style={{
                  padding: 16,
                  background: glassBg, borderRadius: 10,
                  border: `1px solid ${glassBorder}`,
                  textAlign: 'center',
                }}>
                  <div style={{ fontSize: 24, fontWeight: 700, color: accentColor }}>
                    {report.storage.ioReadSpeed !== null ? `${report.storage.ioReadSpeed} MB/s` : 'N/A'}
                  </div>
                  <div style={{ fontSize: 12, color: textSecondary }}>读取速度</div>
                </div>
                <div style={{
                  padding: 16,
                  background: glassBg, borderRadius: 10,
                  border: `1px solid ${glassBorder}`,
                  textAlign: 'center',
                }}>
                  <div style={{ fontSize: 24, fontWeight: 700, color: '#10b981' }}>
                    {report.storage.ioWriteSpeed !== null ? `${report.storage.ioWriteSpeed} MB/s` : 'N/A'}
                  </div>
                  <div style={{ fontSize: 12, color: textSecondary }}>写入速度</div>
                </div>
                <div style={{
                  padding: '12px',
                  background: glassBg, borderRadius: 8,
                  border: `1px solid ${glassBorder}`,
                }}>
                  <div style={{ fontSize: 12, lineHeight: 1.6 }}>
                    浏览器环境下无法直接测量IO速度。此功能需要在操作系统级别进行测试。
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'network' && (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: 16 }}>
            <div style={{
              padding: 20, background: cardBg, borderRadius: 12,
              border: `1px solid ${glassBorder}`, backdropFilter: 'blur(8px)',
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 16 }}>
                <Network size={20} color={accentColor} />
                <span style={{ fontSize: 14, fontWeight: 600 }}>网络状态</span>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                <div style={{
                  display: 'flex', alignItems: 'center', gap: 12,
                  padding: 14,
                  background: report.network.online ? 'rgba(16,185,129,0.1)' : 'rgba(239,68,68,0.1)',
                  borderRadius: 10,
                  border: `1px solid ${report.network.online ? '#10b981' : '#ef4444'}`,
                }}>
                  {report.network.online ? <Wifi size={24} color="#10b981" /> : <WifiOff size={24} color="#ef4444" />}
                  <div>
                    <div style={{ fontWeight: 600 }}>{report.network.online ? '在线' : '离线'}</div>
                    <div style={{ fontSize: 12, color: textSecondary }}>
                      {report.network.type} · {report.network.effectiveType}
                    </div>
                  </div>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ color: textSecondary }}>下行速率</span>
                  <span style={{ fontWeight: 600 }}>{formatSpeed(report.network.downlink)}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ color: textSecondary }}>上行速率</span>
                  <span style={{ fontWeight: 600 }}>{formatSpeed(report.network.uplink)}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ color: textSecondary }}>往返延迟</span>
                  <span style={{ fontWeight: 600 }}>{report.network.rtt !== null ? `${report.network.rtt} ms` : 'N/A'}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ color: textSecondary }}>数据节省</span>
                  <span style={{ fontWeight: 600 }}>{report.network.saveData ? '已启用' : '未启用'}</span>
                </div>
              </div>
            </div>

            <div style={{
              padding: 20, background: cardBg, borderRadius: 12,
              border: `1px solid ${glassBorder}`, backdropFilter: 'blur(8px)',
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 16 }}>
                <Radio size={20} color={accentColor} />
                <span style={{ fontSize: 14, fontWeight: 600 }}>连接预估</span>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                <div style={{
                  padding: 16,
                  background: glassBg, borderRadius: 10,
                  border: `1px solid ${glassBorder}`,
                }}>
                  <div style={{ fontSize: 12, color: textSecondary, marginBottom: 4 }}>预估带宽</div>
                  <div style={{ fontSize: 24, fontWeight: 700, color: accentColor }}>
                    {report.network.bandwidthEstimate >= 1
                      ? `${report.network.bandwidthEstimate.toFixed(1)} Mbps`
                      : `${Math.round(report.network.bandwidthEstimate * 1000)} Kbps`}
                  </div>
                </div>
                <div style={{
                  padding: 16,
                  background: glassBg, borderRadius: 10,
                  border: `1px solid ${glassBorder}`,
                }}>
                  <div style={{ fontSize: 12, color: textSecondary, marginBottom: 4 }}>预估延迟</div>
                  <div style={{ fontSize: 24, fontWeight: 700, color: '#f59e0b' }}>
                    {report.network.latencyEstimate} ms
                  </div>
                </div>
                <div style={{
                  padding: '12px',
                  background: glassBg, borderRadius: 8,
                  border: `1px solid ${glassBorder}`,
                }}>
                  <div style={{ fontSize: 12, lineHeight: 1.6 }}>
                    这些值基于浏览器网络信息API的估算。实际网络性能可能有所不同。
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'browser' && (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: 16 }}>
            <div style={{
              padding: 20, background: cardBg, borderRadius: 12,
              border: `1px solid ${glassBorder}`, backdropFilter: 'blur(8px)',
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 16 }}>
                <Globe size={20} color={accentColor} />
                <span style={{ fontSize: 14, fontWeight: 600 }}>浏览器信息</span>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ color: textSecondary }}>名称</span>
                  <span style={{ fontWeight: 600 }}>{report.browser.name}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ color: textSecondary }}>版本</span>
                  <span style={{ fontWeight: 600 }}>{report.browser.version}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ color: textSecondary }}>引擎</span>
                  <span style={{ fontWeight: 600 }}>{report.browser.engine}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ color: textSecondary }}>平台</span>
                  <span style={{ fontWeight: 600 }}>{report.browser.platform}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ color: textSecondary }}>语言</span>
                  <span style={{ fontWeight: 600 }}>{report.browser.language}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ color: textSecondary }}>Cookie</span>
                  <span style={{ fontWeight: 600, color: report.browser.cookieEnabled ? '#10b981' : '#ef4444' }}>
                    {report.browser.cookieEnabled ? '已启用' : '已禁用'}
                  </span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ color: textSecondary }}>Do Not Track</span>
                  <span style={{ fontWeight: 600 }}>
                    {report.browser.doNotTrack === '1' ? '已开启' : report.browser.doNotTrack === '0' ? '已关闭' : '未设置'}
                  </span>
                </div>
              </div>
            </div>

            <div style={{
              padding: 20, background: cardBg, borderRadius: 12,
              border: `1px solid ${glassBorder}`, backdropFilter: 'blur(8px)',
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 16 }}>
                <Layers size={20} color={accentColor} />
                <span style={{ fontSize: 14, fontWeight: 600 }}>可用 API ({report.browser.availableAPIs.length})</span>
              </div>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                {report.browser.availableAPIs.map((api, idx) => (
                  <div key={idx} style={{
                    padding: '6px 12px',
                    background: glassBg,
                    border: `1px solid ${glassBorder}`,
                    borderRadius: 20,
                    fontSize: 12,
                    fontWeight: 500,
                  }}>
                    {api}
                  </div>
                ))}
              </div>
              <div style={{
                marginTop: 16, padding: 12,
                background: glassBg, borderRadius: 8,
                border: `1px solid ${glassBorder}`,
              }}>
                <div style={{ fontSize: 11, color: textSecondary, marginBottom: 4 }}>User Agent</div>
                <div style={{
                  fontSize: 11,
                  fontFamily: 'monospace',
                  wordBreak: 'break-all',
                  maxHeight: 80,
                  overflow: 'auto',
                }}>{report.browser.userAgent}</div>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'security' && (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: 16 }}>
            <div style={{
              padding: 20, background: cardBg, borderRadius: 12,
              border: `1px solid ${glassBorder}`, backdropFilter: 'blur(8px)',
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 16 }}>
                <Shield size={20} color={accentColor} />
                <span style={{ fontSize: 14, fontWeight: 600 }}>安全状态</span>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                <div style={{
                  display: 'flex', alignItems: 'center', gap: 12,
                  padding: 14,
                  background: report.security.httpsReady ? 'rgba(16,185,129,0.1)' : 'rgba(239,68,68,0.1)',
                  borderRadius: 10,
                  border: `1px solid ${report.security.httpsReady ? '#10b981' : '#ef4444'}`,
                }}>
                  {report.security.httpsReady ? <CheckCircle size={24} color="#10b981" /> : <XCircle size={24} color="#ef4444" />}
                  <div>
                    <div style={{ fontWeight: 600 }}>HTTPS</div>
                    <div style={{ fontSize: 12, color: textSecondary }}>
                      {report.security.httpsReady ? '连接已加密' : '连接未加密'}
                    </div>
                  </div>
                </div>
                <div style={{
                  display: 'flex', alignItems: 'center', gap: 12,
                  padding: 14,
                  background: !report.security.insecureContext ? 'rgba(16,185,129,0.1)' : 'rgba(239,68,68,0.1)',
                  borderRadius: 10,
                  border: `1px solid ${!report.security.insecureContext ? '#10b981' : '#ef4444'}`,
                }}>
                  {!report.security.insecureContext ? <CheckCircle size={24} color="#10b981" /> : <AlertTriangle size={24} color="#f59e0b" />}
                  <div>
                    <div style={{ fontWeight: 600 }}>安全上下文</div>
                    <div style={{ fontSize: 12, color: textSecondary }}>
                      {report.security.insecureContext ? '非安全上下文' : '安全上下文'}
                    </div>
                  </div>
                </div>
                <div style={{
                  display: 'flex', alignItems: 'center', gap: 12,
                  padding: 14,
                  background: report.security.cookieSet ? 'rgba(16,185,129,0.1)' : 'rgba(239,68,68,0.1)',
                  borderRadius: 10,
                  border: `1px solid ${report.security.cookieSet ? '#10b981' : '#ef4444'}`,
                }}>
                  {report.security.cookieSet ? <CheckCircle size={24} color="#10b981" /> : <XCircle size={24} color="#ef4444" />}
                  <div>
                    <div style={{ fontWeight: 600 }}>Cookie</div>
                    <div style={{ fontSize: 12, color: textSecondary }}>
                      {report.security.cookieSet ? '已启用' : '已禁用'}
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div style={{
              padding: 20, background: cardBg, borderRadius: 12,
              border: `1px solid ${glassBorder}`, backdropFilter: 'blur(8px)',
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 16 }}>
                <LockIcon size={20} color={accentColor} />
                <span style={{ fontSize: 14, fontWeight: 600 }}>存储安全</span>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ color: textSecondary }}>LocalStorage 配额</span>
                  <span style={{ fontWeight: 600 }}>{formatBytes(report.security.localStorageQuota)}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ color: textSecondary }}>LocalStorage 已用</span>
                  <span style={{ fontWeight: 600 }}>{formatBytes(report.security.localStorageUsed)}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ color: textSecondary }}>SessionStorage</span>
                  <span style={{
                    fontWeight: 600,
                    color: report.security.sessionStorageAvailable ? '#10b981' : '#ef4444',
                  }}>
                    {report.security.sessionStorageAvailable ? '可用' : '不可用'}
                  </span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ color: textSecondary }}>混合内容</span>
                  <span style={{
                    fontWeight: 600,
                    color: !report.security.mixedContent ? '#10b981' : '#ef4444',
                  }}>
                    {report.security.mixedContent ? '已检测到' : '未检测到'}
                  </span>
                </div>
                <div style={{
                  padding: '12px',
                  background: glassBg, borderRadius: 8,
                  border: `1px solid ${glassBorder}`,
                }}>
                  <div style={{ fontSize: 12, lineHeight: 1.6 }}>
                    <strong style={{ color: accentColor }}>安全建议:</strong><br />
                    {report.security.httpsReady ? '保持 HTTPS 连接' : '启用 HTTPS 加密'}<br />
                    {report.security.cookieSet ? '合理管理 Cookie 设置' : '启用 Cookie 以获得完整功能'}
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'performance' && (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: 16 }}>
            <div style={{
              padding: 20, background: cardBg, borderRadius: 12,
              border: `1px solid ${glassBorder}`, backdropFilter: 'blur(8px)',
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 16 }}>
                <Gauge size={20} color={accentColor} />
                <span style={{ fontSize: 14, fontWeight: 600 }}>性能指标</span>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                <div style={{
                  padding: 16,
                  background: glassBg, borderRadius: 10,
                  border: `1px solid ${glassBorder}`,
                  textAlign: 'center',
                }}>
                  <div style={{ fontSize: 32, fontWeight: 700, color: accentColor }}>
                    {report.performance.fps > 0 ? report.performance.fps : 'N/A'}
                  </div>
                  <div style={{ fontSize: 12, color: textSecondary }}>FPS (预估)</div>
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                  <div style={{
                    padding: '12px',
                    background: glassBg, borderRadius: 8,
                    border: `1px solid ${glassBorder}`,
                    textAlign: 'center',
                  }}>
                    <div style={{ fontSize: 20, fontWeight: 700 }}>{report.performance.loadTime}ms</div>
                    <div style={{ fontSize: 11, color: textSecondary }}>页面加载</div>
                  </div>
                  <div style={{
                    padding: '12px',
                    background: glassBg, borderRadius: 8,
                    border: `1px solid ${glassBorder}`,
                    textAlign: 'center',
                  }}>
                    <div style={{ fontSize: 20, fontWeight: 700 }}>{report.performance.domReadyTime}ms</div>
                    <div style={{ fontSize: 11, color: textSecondary }}>DOM 就绪</div>
                  </div>
                </div>
                <div style={{
                  padding: '12px',
                  background: glassBg, borderRadius: 8,
                  border: `1px solid ${glassBorder}`,
                }}>
                  <div style={{ fontSize: 12, lineHeight: 1.6 }}>
                    <div><strong>JS 执行速度:</strong> {report.performance.scriptExecutionSpeed.toLocaleString()} ops/ms</div>
                    <div><strong>DOM 节点数:</strong> {report.performance.domElements.toLocaleString()}</div>
                  </div>
                </div>
              </div>
            </div>

            <div style={{
              padding: 20, background: cardBg, borderRadius: 12,
              border: `1px solid ${glassBorder}`, backdropFilter: 'blur(8px)',
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 16 }}>
                <BarChart3 size={20} color={accentColor} />
                <span style={{ fontSize: 14, fontWeight: 600 }}>内存性能</span>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                <div style={{
                  padding: 16,
                  background: glassBg, borderRadius: 10,
                  border: `1px solid ${glassBorder}`,
                }}>
                  <div style={{ fontSize: 12, color: textSecondary, marginBottom: 8 }}>JavaScript 堆内存</div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                      <span style={{ color: textSecondary, fontSize: 12 }}>已使用</span>
                      <span style={{ fontWeight: 600, fontSize: 13 }}>{formatBytes(report.performance.jsHeapUsed)}</span>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                      <span style={{ color: textSecondary, fontSize: 12 }}>总分配</span>
                      <span style={{ fontWeight: 600, fontSize: 13 }}>{formatBytes(report.performance.jsHeapTotal)}</span>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                      <span style={{ color: textSecondary, fontSize: 12 }}>限制</span>
                      <span style={{ fontWeight: 600, fontSize: 13 }}>{formatBytes(report.performance.jsHeapLimit)}</span>
                    </div>
                  </div>
                </div>
                <div style={{
                  padding: '12px',
                  background: glassBg, borderRadius: 8,
                  border: `1px solid ${glassBorder}`,
                }}>
                  <div style={{ fontSize: 12, lineHeight: 1.6 }}>
                    <strong style={{ color: accentColor }}>性能建议:</strong><br />
                    {report.performance.loadTime > 3000 ? '• 页面加载时间过长，建议优化' : '• 页面加载性能良好'}<br />
                    {report.performance.domElements > 5000 ? '• DOM 节点过多，可能影响性能' : '• DOM 节点数量合理'}<br />
                    {report.performance.scriptExecutionSpeed < 100000 ? '• JS 执行速度较慢' : '• JS 执行速度良好'}
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'report' && (
          <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: 16 }}>
            {/* Score Card */}
            <div style={{
              padding: 24, background: cardBg, borderRadius: 12,
              border: `1px solid ${glassBorder}`, backdropFilter: 'blur(8px)',
              display: 'flex', alignItems: 'center', gap: 24,
            }}>
              <div style={{
                width: 120, height: 120, borderRadius: '50%',
                background: `conic-gradient(${accentColor} ${report.summary.score * 3.6}deg, ${divider} 0deg)`,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                flexShrink: 0,
              }}>
                <div style={{
                  width: 100, height: 100, borderRadius: '50%',
                  background: cardBg,
                  display: 'flex', flexDirection: 'column',
                  alignItems: 'center', justifyContent: 'center',
                }}>
                  <div style={{ fontSize: 32, fontWeight: 700 }}>{report.summary.score}</div>
                  <div style={{ fontSize: 11, color: textSecondary }}>/ 100</div>
                </div>
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 18, fontWeight: 600, marginBottom: 8 }}>系统健康评分</div>
                <div style={{ fontSize: 13, color: textSecondary, marginBottom: 16 }}>
                  基于安全性、性能、资源使用等多维度评估
                </div>
                <div style={{ display: 'flex', gap: 12 }}>
                  {report.summary.highlights.length > 0 && (
                    <div style={{ flex: 1 }}>
                      <div style={{ fontSize: 12, fontWeight: 600, color: '#10b981', marginBottom: 8 }}>亮点</div>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                        {report.summary.highlights.slice(0, 3).map((h, i) => (
                          <div key={i} style={{ fontSize: 11, color: textSecondary }}>• {h}</div>
                        ))}
                      </div>
                    </div>
                  )}
                  {report.summary.issues.length > 0 && (
                    <div style={{ flex: 1 }}>
                      <div style={{ fontSize: 12, fontWeight: 600, color: '#f59e0b', marginBottom: 8 }}>问题</div>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                        {report.summary.issues.slice(0, 3).map((issue, i) => (
                          <div key={i} style={{ fontSize: 11, color: textSecondary }}>• {issue}</div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Export Section */}
            {showExport && (
              <div style={{
                padding: 24, background: cardBg, borderRadius: 12,
                border: `1px solid ${glassBorder}`, backdropFilter: 'blur(8px)',
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 16 }}>
                  <FileJson size={20} color={accentColor} />
                  <span style={{ fontSize: 14, fontWeight: 600 }}>导出报告</span>
                </div>
                <div style={{ display: 'flex', gap: 12 }}>
                  <button onClick={exportAsJSON} style={{
                    display: 'flex', alignItems: 'center', gap: 6,
                    padding: '10px 20px',
                    background: `linear-gradient(135deg, ${accentColor}, #a78bfa)`,
                    border: 'none', borderRadius: 8,
                    color: '#fff', cursor: 'pointer',
                    fontSize: 13, fontWeight: 600,
                  }}>
                    <Download size={16} /> 下载 JSON 报告
                  </button>
                  <button onClick={() => copyToClipboard(JSON.stringify(report, null, 2), 'report')} style={{
                    display: 'flex', alignItems: 'center', gap: 6,
                    padding: '10px 20px',
                    background: glassBg,
                    border: `1px solid ${glassBorder}`,
                    borderRadius: 8,
                    color: textPrimary,
                    cursor: 'pointer',
                    fontSize: 13, fontWeight: 500,
                  }}>
                    <Copy size={16} /> {copiedId === 'report' ? '已复制' : '复制到剪贴板'}
                  </button>
                </div>
                <div style={{ marginTop: 16, fontSize: 12, color: textSecondary, lineHeight: 1.6 }}>
                  <strong>报告内容:</strong><br />
                  • CPU、内存、存储、网络、浏览器、安全、性能七维分析<br />
                  • 基于真实浏览器 API 数据<br />
                  • 系统健康评分 (0-100)<br />
                  • 亮点与问题总结
                </div>
              </div>
            )}

            {/* Raw Data Preview */}
            <div style={{
              padding: 24, background: cardBg, borderRadius: 12,
              border: `1px solid ${glassBorder}`, backdropFilter: 'blur(8px)',
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 16 }}>
                <Code style={{ marginRight: 4 }} size={18} color={accentColor} />
                <span style={{ fontSize: 14, fontWeight: 600 }}>原始数据</span>
              </div>
              <div style={{
                padding: 16,
                background: 'rgba(0,0,0,0.3)',
                borderRadius: 8,
                maxHeight: 300,
                overflow: 'auto',
                fontFamily: 'monospace',
                fontSize: 11,
                lineHeight: 1.6,
              }}>
                <pre style={{ margin: 0, whiteSpace: 'pre-wrap', wordBreak: 'break-all' }}>
                  {JSON.stringify(report, null, 2).substring(0, 3000)}
                  {JSON.stringify(report, null, 2).length > 3000 ? '...' : ''}
                </pre>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Footer */}
      <div style={{
        padding: '12px 20px',
        background: glassBg,
        borderTop: `1px solid ${divider}`,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        fontSize: 11,
        color: textSecondary,
        flexShrink: 0,
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <Activity size={12} />
          <span>系统诊断分析 v1.0</span>
        </div>
        <div>
          报告时间: {report.timestamp ? new Date(report.timestamp).toLocaleString('zh-CN') : '-'}
        </div>
      </div>
    </div>
  )
}