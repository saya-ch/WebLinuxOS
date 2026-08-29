import { useState, useEffect, useCallback, useRef } from 'react'
import {
  Globe, Monitor, Cpu, Wifi, Gauge, HardDrive,
  Shield, Puzzle, FileText, Copy, Check, RefreshCw
} from 'lucide-react'

/* ── 类型 ── */

interface InfoItem {
  label: string
  value: string
}

interface InfoSection {
  id: string
  title: string
  icon: React.ReactNode
  items: InfoItem[]
}

interface StorageEntry {
  key: string
  value: string
}

/* ── 工具函数 ── */

function detectBrowser() {
  const ua = navigator.userAgent
  let name = '未知', version = '未知', engine = '未知'

  if (/Edg\/([\d.]+)/.test(ua)) { name = 'Microsoft Edge'; version = RegExp.$1 }
  else if (/OPR\/([\d.]+)/.test(ua)) { name = 'Opera'; version = RegExp.$1 }
  else if (/Chrome\/([\d.]+)/.test(ua)) { name = 'Google Chrome'; version = RegExp.$1 }
  else if (/Firefox\/([\d.]+)/.test(ua)) { name = 'Mozilla Firefox'; version = RegExp.$1 }
  else if (/Safari\/([\d.]+)/.test(ua)) { name = 'Apple Safari'; version = RegExp.$1 }
  else if (/Trident\/([\d.]+)/.test(ua)) { name = 'Internet Explorer'; version = RegExp.$1 }

  if (/WebKit/.test(ua)) engine = 'WebKit / Blink'
  else if (/Gecko/.test(ua) && !/WebKit/.test(ua)) engine = 'Gecko'
  else if (/Trident/.test(ua)) engine = 'Trident'

  return { name, version, engine, userAgent: ua }
}

function detectDevice() {
  const ua = navigator.userAgent
  let type = '桌面设备'
  if (/Mobile|Android/i.test(ua)) type = '移动设备'
  else if (/Tablet|iPad/i.test(ua)) type = '平板设备'

  return {
    type,
    screen: `${screen.width} × ${screen.height}`,
    viewport: `${window.innerWidth} × ${window.innerHeight}`,
    pixelRatio: String(window.devicePixelRatio),
    colorDepth: String(screen.colorDepth),
    touchSupport: ('ontouchstart' in window || navigator.maxTouchPoints > 0) ? '支持' : '不支持',
  }
}

function detectSystem() {
  const ua = navigator.userAgent
  const cores = navigator.hardwareConcurrency || 0
  const mem = (navigator as Navigator & { deviceMemory?: number }).deviceMemory
  const memStr = mem ? `${mem} GB` : '不可用'
  const lang = navigator.language || '未知'
  const langs = navigator.languages?.join(', ') || lang
  const tz = Intl.DateTimeFormat().resolvedOptions().timeZone || '未知'

  return {
    cores: String(cores),
    memory: memStr,
    language: lang,
    languages: langs,
    timezone: tz,
    online: navigator.onLine ? '在线' : '离线',
    platform: navigator.platform || '未知',
    os: detectOS(ua),
  }
}

function detectOS(ua: string): string {
  if (/Windows NT 10/.test(ua)) return 'Windows 10/11'
  if (/Windows NT 6.3/.test(ua)) return 'Windows 8.1'
  if (/Windows NT 6.1/.test(ua)) return 'Windows 7'
  if (/Mac OS X ([\d_]+)/.test(ua)) return 'macOS ' + RegExp.$1.replace(/_/g, '.')
  if (/Android ([\d.]+)/.test(ua)) return 'Android ' + RegExp.$1
  if (/iPhone OS ([\d_]+)/.test(ua)) return 'iOS ' + RegExp.$1.replace(/_/g, '.')
  if (/iPad.*OS ([\d_]+)/.test(ua)) return 'iPadOS ' + RegExp.$1.replace(/_/g, '.')
  if (/Linux/.test(ua)) return 'Linux'
  return '未知'
}

function detectNetwork() {
  const conn = (navigator as Navigator & { connection?: { type?: string; effectiveType?: string; downlink?: number; rtt?: number; saveData?: boolean } }).connection
  return {
    type: conn?.type || '未知',
    effectiveType: conn?.effectiveType || '未知',
    downlink: conn?.downlink != null ? `${conn.downlink} Mbps` : '未知',
    rtt: conn?.rtt != null ? `${conn.rtt} ms` : '未知',
    online: navigator.onLine ? '在线' : '离线',
    saveData: conn?.saveData ? '已启用' : '未启用',
  }
}

function getStorageEntries(storage: Storage): StorageEntry[] {
  const entries: StorageEntry[] = []
  for (let i = 0; i < storage.length; i++) {
    const key = storage.key(i)
    if (key !== null) {
      const val = storage.getItem(key) || ''
      entries.push({ key, value: val.length > 80 ? val.slice(0, 80) + '...' : val })
    }
  }
  return entries
}

function estimateIndexedDB(): Promise<string> {
  return new Promise((resolve) => {
    if (!('indexedDB' in window)) {
      resolve('不可用')
      return
    }
    try {
      const estimate = (navigator as Navigator & { storage?: { estimate?: () => Promise<{ usage?: number }> } }).storage?.estimate
      if (estimate) {
        estimate().then((est) => {
          const usage = est.usage || 0
          if (usage >= 1048576) resolve(`${(usage / 1048576).toFixed(2)} MB`)
          else if (usage >= 1024) resolve(`${(usage / 1024).toFixed(1)} KB`)
          else resolve(`${usage} B`)
        }).catch(() => resolve('估算失败'))
      } else {
        resolve('API 不可用')
      }
    } catch {
      resolve('估算失败')
    }
  })
}

function detectSecurity() {
  const cookies = document.cookie.split(';').filter(c => c.trim().length > 0)
  const dnt = navigator.doNotTrack
  let dntStr = '未知'
  if (dnt === '1') dntStr = '已启用'
  else if (dnt === '0') dntStr = '已禁用'

  let csp = '未检测到'
  try {
    const meta = document.querySelector('meta[http-equiv="Content-Security-Policy"]')
    if (meta) csp = meta.getAttribute('content') || '已设置（空）'
  } catch { /* ignore */ }

  return {
    https: location.protocol === 'https:' ? '安全 (HTTPS)' : '不安全 (HTTP)',
    cookieCount: String(cookies.length),
    doNotTrack: dntStr,
    csp: csp.length > 60 ? csp.slice(0, 60) + '...' : csp,
    cookies: cookies.map(c => c.trim().split('=')[0]).join(', ') || '无',
  }
}

function detectWebAPIs() {
  return {
    serviceWorker: 'serviceWorker' in navigator,
    webGL: (() => { try { return !!document.createElement('canvas').getContext('webgl') } catch { return false } })(),
    webGL2: (() => { try { return !!document.createElement('canvas').getContext('webgl2') } catch { return false } })(),
    webAssembly: typeof WebAssembly === 'object',
    webWorker: typeof Worker !== 'undefined',
    sharedWorker: typeof SharedWorker !== 'undefined',
    intersectionObserver: typeof IntersectionObserver !== 'undefined',
    resizeObserver: typeof ResizeObserver !== 'undefined',
    mutationObserver: typeof MutationObserver !== 'undefined',
    webSocket: typeof WebSocket !== 'undefined',
    webRTC: typeof RTCPeerConnection !== 'undefined',
    webAudio: typeof (window as Window & { AudioContext?: unknown; webkitAudioContext?: unknown }).AudioContext !== 'undefined' ||
      typeof (window as Window & { webkitAudioContext?: unknown }).webkitAudioContext !== 'undefined',
    geolocation: 'geolocation' in navigator,
    notifications: 'Notification' in window,
    clipboard: 'clipboard' in navigator,
    crypto: 'crypto' in window,
    localStorage: (() => { try { localStorage.setItem('__t', '1'); localStorage.removeItem('__t'); return true } catch { return false } })(),
    sessionStorage: (() => { try { sessionStorage.setItem('__t', '1'); sessionStorage.removeItem('__t'); return true } catch { return false } })(),
    indexedDB: 'indexedDB' in window,
    webGPU: 'gpu' in navigator,
    gamepad: 'getGamepads' in navigator,
  }
}

function detectPageInfo() {
  return {
    url: location.href,
    title: document.title || '无标题',
    referrer: document.referrer || '无',
    charset: document.characterSet || document.charset || '未知',
    cookieCount: document.cookie.split(';').filter(c => c.trim()).length,
    readyState: document.readyState,
    lastModified: document.lastModified || '未知',
  }
}

/* ── 组件 ── */

export default function DevInfoDashboard() {
  const [sections, setSections] = useState<InfoSection[]>([])
  const [lsEntries, setLsEntries] = useState<StorageEntry[]>([])
  const [ssEntries, setSsEntries] = useState<StorageEntry[]>([])
  const [copiedKey, setCopiedKey] = useState<string | null>(null)
  const fpsRef = useRef({ count: 0, lastTime: performance.now() })
  const animRef = useRef<number>(0)
  const fpsValueRef = useRef(0)
  const indexedDBSizeRef = useRef('加载中...')
  const [timestamp, setTimestamp] = useState(new Date().toLocaleString('zh-CN'))

  // FPS 测量
  useEffect(() => {
    const measure = () => {
      fpsRef.current.count++
      const now = performance.now()
      if (now - fpsRef.current.lastTime >= 1000) {
        fpsValueRef.current = Math.round((fpsRef.current.count * 1000) / (now - fpsRef.current.lastTime))
        fpsRef.current.count = 0
        fpsRef.current.lastTime = now
      }
      animRef.current = requestAnimationFrame(measure)
    }
    animRef.current = requestAnimationFrame(measure)
    return () => cancelAnimationFrame(animRef.current)
  }, [])

  // 数据采集函数
  const collectData = useCallback(() => {
    const browser = detectBrowser()
    const device = detectDevice()
    const sys = detectSystem()
    const net = detectNetwork()
    const sec = detectSecurity()
    const apis = detectWebAPIs()
    const page = detectPageInfo()

    // 性能数据
    const perf = performance as Performance & { memory?: { usedJSHeapSize: number } }
    const mem = perf.memory
    const jsHeapStr = mem ? `${(mem.usedJSHeapSize / 1048576).toFixed(1)} MB` : '不可用'

    const lsKeys = Object.keys(localStorage)
    const lsSize = lsKeys.reduce((acc, key) => {
      const item = localStorage.getItem(key) || ''
      return acc + key.length + item.length
    }, 0)
    const lsUsageStr = `${(lsSize / 1024).toFixed(1)} KB (${lsKeys.length} 项)`

    let perfTimingStr = '不可用'
    try {
      const timing = performance.timing
      if (timing && timing.navigationStart) {
        const ttfb = timing.responseStart - timing.navigationStart
        const domReady = timing.domContentLoadedEventEnd - timing.navigationStart
        const loadTime = timing.loadEventEnd - timing.navigationStart
        perfTimingStr = `TTFB: ${ttfb}ms | DOM: ${domReady}ms | Load: ${loadTime}ms`
      }
    } catch { /* ignore */ }

    // 存储
    const newLsEntries = getStorageEntries(localStorage)
    const newSsEntries = getStorageEntries(sessionStorage)
    setLsEntries(newLsEntries)
    setSsEntries(newSsEntries)
    estimateIndexedDB().then((size) => { indexedDBSizeRef.current = size })

    const newSections: InfoSection[] = [
      {
        id: 'browser',
        title: '浏览器信息',
        icon: <Globe size={18} />,
        items: [
          { label: '浏览器', value: browser.name },
          { label: '版本', value: browser.version },
          { label: '引擎', value: browser.engine },
          { label: 'User-Agent', value: browser.userAgent.length > 100 ? browser.userAgent.slice(0, 100) + '...' : browser.userAgent },
        ],
      },
      {
        id: 'device',
        title: '设备信息',
        icon: <Monitor size={18} />,
        items: [
          { label: '设备类型', value: device.type },
          { label: '屏幕分辨率', value: device.screen },
          { label: '视口大小', value: device.viewport },
          { label: '像素比', value: device.pixelRatio },
          { label: '色彩深度', value: device.colorDepth },
          { label: '触控支持', value: device.touchSupport },
        ],
      },
      {
        id: 'system',
        title: '系统信息',
        icon: <Cpu size={18} />,
        items: [
          { label: '操作系统', value: sys.os },
          { label: '平台', value: sys.platform },
          { label: 'CPU 核心数', value: sys.cores },
          { label: '设备内存', value: sys.memory },
          { label: '语言', value: sys.language },
          { label: '语言列表', value: sys.languages },
          { label: '时区', value: sys.timezone },
          { label: '在线状态', value: sys.online },
        ],
      },
      {
        id: 'network',
        title: '网络信息',
        icon: <Wifi size={18} />,
        items: [
          { label: '连接类型', value: net.type },
          { label: '有效类型', value: net.effectiveType },
          { label: '下行速度', value: net.downlink },
          { label: 'RTT', value: net.rtt },
          { label: '在线状态', value: net.online },
          { label: '节省流量', value: net.saveData },
        ],
      },
      {
        id: 'performance',
        title: '性能指标',
        icon: <Gauge size={18} />,
        items: [
          { label: 'FPS', value: String(fpsValueRef.current) },
          { label: 'JS 堆内存', value: jsHeapStr },
          { label: 'localStorage 用量', value: lsUsageStr },
          { label: 'Performance Timing', value: perfTimingStr },
        ],
      },
      {
        id: 'storage',
        title: '存储信息',
        icon: <HardDrive size={18} />,
        items: [
          { label: 'IndexedDB 用量', value: indexedDBSizeRef.current },
          { label: 'localStorage 项数', value: `${newLsEntries.length} 项` },
          { label: 'sessionStorage 项数', value: `${newSsEntries.length} 项` },
        ],
      },
      {
        id: 'security',
        title: '安全信息',
        icon: <Shield size={18} />,
        items: [
          { label: 'HTTPS 状态', value: sec.https },
          { label: 'Cookie 数量', value: sec.cookieCount },
          { label: 'Cookie 名称', value: sec.cookies },
          { label: 'Do Not Track', value: sec.doNotTrack },
          { label: 'CSP 策略', value: sec.csp },
        ],
      },
      {
        id: 'webapi',
        title: 'Web API 支持',
        icon: <Puzzle size={18} />,
        items: [
          { label: 'Service Worker', value: apis.serviceWorker ? '✓ 支持' : '✗ 不支持' },
          { label: 'WebGL', value: apis.webGL ? '✓ 支持' : '✗ 不支持' },
          { label: 'WebGL 2', value: apis.webGL2 ? '✓ 支持' : '✗ 不支持' },
          { label: 'WebAssembly', value: apis.webAssembly ? '✓ 支持' : '✗ 不支持' },
          { label: 'Web Workers', value: apis.webWorker ? '✓ 支持' : '✗ 不支持' },
          { label: 'Shared Workers', value: apis.sharedWorker ? '✓ 支持' : '✗ 不支持' },
          { label: 'IntersectionObserver', value: apis.intersectionObserver ? '✓ 支持' : '✗ 不支持' },
          { label: 'ResizeObserver', value: apis.resizeObserver ? '✓ 支持' : '✗ 不支持' },
          { label: 'WebSocket', value: apis.webSocket ? '✓ 支持' : '✗ 不支持' },
          { label: 'WebRTC', value: apis.webRTC ? '✓ 支持' : '✗ 不支持' },
          { label: 'Web Audio', value: apis.webAudio ? '✓ 支持' : '✗ 不支持' },
          { label: 'Geolocation', value: apis.geolocation ? '✓ 支持' : '✗ 不支持' },
          { label: 'Notifications', value: apis.notifications ? '✓ 支持' : '✗ 不支持' },
          { label: 'Clipboard API', value: apis.clipboard ? '✓ 支持' : '✗ 不支持' },
          { label: 'Web Crypto', value: apis.crypto ? '✓ 支持' : '✗ 不支持' },
          { label: 'WebGPU', value: apis.webGPU ? '✓ 支持' : '✗ 不支持' },
          { label: 'Gamepad', value: apis.gamepad ? '✓ 支持' : '✗ 不支持' },
        ],
      },
      {
        id: 'page',
        title: '页面信息',
        icon: <FileText size={18} />,
        items: [
          { label: '当前 URL', value: page.url.length > 80 ? page.url.slice(0, 80) + '...' : page.url },
          { label: '页面标题', value: page.title },
          { label: 'Referrer', value: page.referrer.length > 80 ? page.referrer.slice(0, 80) + '...' : page.referrer },
          { label: '字符编码', value: page.charset },
          { label: 'Cookie 数量', value: String(page.cookieCount) },
          { label: '文档状态', value: page.readyState },
          { label: '最后修改', value: page.lastModified },
        ],
      },
    ]

    setSections(newSections)
    setTimestamp(new Date().toLocaleString('zh-CN'))
  }, [])

  // 自动刷新
  useEffect(() => {
    collectData()
    const timer = setInterval(collectData, 5000)
    return () => clearInterval(timer)
  }, [collectData])

  const handleCopy = useCallback(async (key: string, value: string) => {
    try {
      await navigator.clipboard.writeText(value)
    } catch {
      // fallback
    }
    setCopiedKey(key)
    setTimeout(() => setCopiedKey(null), 1500)
  }, [])

  /* ── 渲染 ── */

  const styles = {
    container: {
      height: '100%',
      display: 'flex',
      flexDirection: 'column' as const,
      background: 'linear-gradient(135deg, #0f172a, #1e293b)',
      color: '#e2e8f0',
      fontFamily: 'system-ui, -apple-system, sans-serif',
      fontSize: 13,
      overflow: 'auto',
    } as React.CSSProperties,
    header: {
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      padding: '14px 20px',
      borderBottom: '1px solid rgba(148, 163, 184, 0.1)',
      background: 'rgba(15, 23, 42, 0.9)',
      flexShrink: 0,
      position: 'sticky' as const,
      top: 0,
      zIndex: 10,
      backdropFilter: 'blur(8px)',
    } as React.CSSProperties,
    headerLeft: {
      display: 'flex',
      alignItems: 'center',
      gap: 10,
    } as React.CSSProperties,
    headerTitle: {
      fontWeight: 700,
      fontSize: 16,
      background: 'linear-gradient(135deg, #a78bfa, #818cf8)',
      WebkitBackgroundClip: 'text',
      WebkitTextFillColor: 'transparent',
    } as React.CSSProperties,
    refreshBtn: {
      display: 'flex',
      alignItems: 'center',
      gap: 6,
      padding: '6px 14px',
      borderRadius: 8,
      border: '1px solid rgba(167, 139, 250, 0.3)',
      background: 'rgba(167, 139, 250, 0.1)',
      color: '#a78bfa',
      fontSize: 12,
      fontWeight: 600,
      cursor: 'pointer',
      transition: 'all 0.2s',
    } as React.CSSProperties,
    grid: {
      display: 'grid',
      gridTemplateColumns: 'repeat(auto-fill, minmax(380px, 1fr))',
      gap: 16,
      padding: 16,
    } as React.CSSProperties,
    card: {
      background: 'rgba(30, 41, 59, 0.8)',
      border: '1px solid rgba(148, 163, 184, 0.1)',
      borderRadius: 12,
      overflow: 'hidden',
      transition: 'border-color 0.2s',
    } as React.CSSProperties,
    cardHeader: {
      display: 'flex',
      alignItems: 'center',
      gap: 8,
      padding: '12px 16px',
      borderBottom: '1px solid rgba(148, 163, 184, 0.08)',
      background: 'rgba(167, 139, 250, 0.04)',
    } as React.CSSProperties,
    cardIcon: {
      color: '#a78bfa',
      flexShrink: 0,
    } as React.CSSProperties,
    cardTitle: {
      fontWeight: 600,
      fontSize: 14,
      color: '#e2e8f0',
    } as React.CSSProperties,
    cardBody: {
      padding: '8px 0',
    } as React.CSSProperties,
    row: {
      display: 'flex',
      alignItems: 'flex-start',
      justifyContent: 'space-between',
      padding: '6px 16px',
      gap: 12,
      minHeight: 28,
    } as React.CSSProperties,
    label: {
      color: '#94a3b8',
      fontSize: 12,
      flexShrink: 0,
      minWidth: 120,
    } as React.CSSProperties,
    valueWrap: {
      display: 'flex',
      alignItems: 'center',
      gap: 6,
      flex: 1,
      minWidth: 0,
    } as React.CSSProperties,
    value: {
      fontFamily: 'ui-monospace, SFMono-Regular, "SF Mono", Menlo, Consolas, monospace',
      fontSize: 12,
      color: '#a78bfa',
      wordBreak: 'break-all',
      lineHeight: 1.4,
    } as React.CSSProperties,
    copyBtn: {
      background: 'none',
      border: 'none',
      padding: 2,
      cursor: 'pointer',
      color: '#64748b',
      flexShrink: 0,
      display: 'flex',
      alignItems: 'center',
      transition: 'color 0.2s',
    } as React.CSSProperties,
    storageSection: {
      padding: '8px 16px 12px',
    } as React.CSSProperties,
    storageTitle: {
      fontSize: 11,
      color: '#64748b',
      fontWeight: 600,
      textTransform: 'uppercase' as const,
      letterSpacing: '0.05em',
      marginBottom: 6,
      marginTop: 8,
    } as React.CSSProperties,
    storageTable: {
      width: '100%',
      borderCollapse: 'collapse' as const,
      fontSize: 11,
    } as React.CSSProperties,
    storageTh: {
      textAlign: 'left' as const,
      padding: '4px 8px',
      color: '#64748b',
      borderBottom: '1px solid rgba(148, 163, 184, 0.08)',
      fontWeight: 600,
      fontFamily: 'system-ui, sans-serif',
    } as React.CSSProperties,
    storageTd: {
      padding: '3px 8px',
      color: '#a78bfa',
      fontFamily: 'ui-monospace, SFMono-Regular, monospace',
      borderBottom: '1px solid rgba(148, 163, 184, 0.05)',
      maxWidth: 160,
      overflow: 'hidden',
      textOverflow: 'ellipsis',
      whiteSpace: 'nowrap' as const,
    } as React.CSSProperties,
    apiTag: (supported: boolean) => ({
      display: 'inline-block',
      padding: '1px 8px',
      borderRadius: 4,
      fontSize: 11,
      fontWeight: 600,
      fontFamily: 'ui-monospace, monospace',
      background: supported ? 'rgba(34, 197, 94, 0.12)' : 'rgba(239, 68, 68, 0.12)',
      color: supported ? '#4ade80' : '#f87171',
    } as React.CSSProperties),
    statusDot: (online: boolean) => ({
      width: 8,
      height: 8,
      borderRadius: '50%',
      background: online ? '#4ade80' : '#ef4444',
      display: 'inline-block',
      marginRight: 6,
      flexShrink: 0,
    } as React.CSSProperties),
    footer: {
      padding: '8px 20px',
      textAlign: 'center' as const,
      fontSize: 11,
      color: '#475569',
      borderTop: '1px solid rgba(148, 163, 184, 0.08)',
      flexShrink: 0,
    } as React.CSSProperties,
  }

  const renderValue = (item: InfoItem) => {
    const isOnline = (item.label === '在线状态') && item.value === '在线'
    const isHttps = (item.label === 'HTTPS 状态') && item.value.includes('安全')
    const isApiItem = item.value.startsWith('✓') || item.value.startsWith('✗')
    const isSupported = item.value.startsWith('✓')

    return (
      <div style={styles.valueWrap}>
        {isOnline && <span style={styles.statusDot(true)} />}
        {isApiItem && <span style={styles.apiTag(isSupported)}>{item.value}</span>}
        {isHttps && <span style={{ color: '#4ade80', ...styles.value }}>{item.value}</span>}
        {!isApiItem && !isOnline && !isHttps && (
          <span style={styles.value}>{item.value}</span>
        )}
        <button
          style={styles.copyBtn}
          onClick={() => handleCopy(item.label, item.value)}
          title={`复制 ${item.label}`}
        >
          {copiedKey === item.label ? <Check size={13} color="#4ade80" /> : <Copy size={13} />}
        </button>
      </div>
    )
  }

  return (
    <div style={styles.container}>
      {/* 顶栏 */}
      <div style={styles.header}>
        <div style={styles.headerLeft}>
          <span style={{ fontSize: 20 }}>🔬</span>
          <span style={styles.headerTitle}>开发者信息仪表盘</span>
          <span style={{ fontSize: 11, color: '#64748b', marginLeft: 4 }}>DevInfoDashboard</span>
        </div>
        <button style={styles.refreshBtn} onClick={collectData}>
          <RefreshCw size={13} />
          刷新
        </button>
      </div>

      {/* 信息卡片网格 */}
      <div style={styles.grid}>
        {sections.map((section) => (
          <div
            key={section.id}
            style={styles.card}
            onMouseEnter={(e) => { (e.currentTarget as HTMLDivElement).style.borderColor = 'rgba(167, 139, 250, 0.3)' }}
            onMouseLeave={(e) => { (e.currentTarget as HTMLDivElement).style.borderColor = 'rgba(148, 163, 184, 0.1)' }}
          >
            <div style={styles.cardHeader}>
              <span style={styles.cardIcon}>{section.icon}</span>
              <span style={styles.cardTitle}>{section.title}</span>
              {section.id === 'performance' && (
                <span style={{
                  marginLeft: 'auto',
                  fontSize: 11,
                  color: '#475569',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 4,
                }}>
                  <span style={{
                    width: 6, height: 6, borderRadius: '50%',
                    background: '#4ade80',
                    animation: 'pulse 2s infinite',
                  }} />
                  实时
                </span>
              )}
            </div>
            <div style={styles.cardBody}>
              {section.items.map((item) => (
                <div key={item.label} style={styles.row}>
                  <span style={styles.label}>{item.label}</span>
                  {renderValue(item)}
                </div>
              ))}
            </div>

            {/* 存储卡片额外展示 key-value 表 */}
            {section.id === 'storage' && (
              <div style={styles.storageSection}>
                {lsEntries.length > 0 && (
                  <>
                    <div style={styles.storageTitle}>localStorage ({lsEntries.length} 项)</div>
                    <table style={styles.storageTable}>
                      <thead>
                        <tr>
                          <th style={styles.storageTh}>Key</th>
                          <th style={styles.storageTh}>Value</th>
                        </tr>
                      </thead>
                      <tbody>
                        {lsEntries.slice(0, 10).map((e) => (
                          <tr key={e.key}>
                            <td style={styles.storageTd}>{e.key}</td>
                            <td style={styles.storageTd}>{e.value}</td>
                          </tr>
                        ))}
                        {lsEntries.length > 10 && (
                          <tr>
                            <td style={{ ...styles.storageTd, color: '#64748b' }} colSpan={2}>
                              ... 还有 {lsEntries.length - 10} 项
                            </td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </>
                )}
                {ssEntries.length > 0 && (
                  <>
                    <div style={styles.storageTitle}>sessionStorage ({ssEntries.length} 项)</div>
                    <table style={styles.storageTable}>
                      <thead>
                        <tr>
                          <th style={styles.storageTh}>Key</th>
                          <th style={styles.storageTh}>Value</th>
                        </tr>
                      </thead>
                      <tbody>
                        {ssEntries.slice(0, 10).map((e) => (
                          <tr key={e.key}>
                            <td style={styles.storageTd}>{e.key}</td>
                            <td style={styles.storageTd}>{e.value}</td>
                          </tr>
                        ))}
                        {ssEntries.length > 10 && (
                          <tr>
                            <td style={{ ...styles.storageTd, color: '#64748b' }} colSpan={2}>
                              ... 还有 {ssEntries.length - 10} 项
                            </td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </>
                )}
                {lsEntries.length === 0 && ssEntries.length === 0 && (
                  <div style={{ padding: '8px 0', color: '#64748b', fontSize: 12, textAlign: 'center' }}>
                    暂无存储数据
                  </div>
                )}
              </div>
            )}
          </div>
        ))}
      </div>

      {/* 底部 */}
      <div style={styles.footer}>
        自动刷新间隔: 5s | 数据采集时间: {timestamp}
      </div>
    </div>
  )
}
