import { useState, useEffect, useCallback, memo } from 'react'

interface MemoryInfo {
  usedJSHeapSize: number
  totalJSHeapSize: number
  jsHeapSizeLimit: number
  available: boolean
}

interface PagePerformance {
  fps: number
  loadTime: number
  domNodes: number
  domDepth: number
}

interface NetworkInfo {
  online: boolean
  effectiveType: string
  downlink: number | null
  rtt: number | null
  saveData: boolean
  available: boolean
}

interface StorageInfo {
  localStorageSize: number
  sessionStorageSize: number
  cookieCount: number
}

interface BrowserInfo {
  name: string
  version: string
  engine: string
  language: string
  languages: string[]
  platform: string
  userAgent: string
  vendor: string
  onLine: boolean
  cookieEnabled: boolean
}

interface SystemData {
  memory: MemoryInfo
  performance: PagePerformance
  network: NetworkInfo
  storage: StorageInfo
  cpuCores: number
  browser: BrowserInfo
  timestamp: number
}

const formatBytes = (bytes: number): string => {
  if (bytes === 0) return '0 B'
  const k = 1024
  const sizes = ['B', 'KB', 'MB', 'GB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
}

const getStorageSize = (storage: Storage | null): number => {
  if (!storage) return 0
  let size = 0
  try {
    for (let i = 0; i < storage.length; i++) {
      const key = storage.key(i)
      if (key) {
        const value = storage.getItem(key) || ''
        size += new Blob([key + value]).size
      }
    }
  } catch {
    return size
  }
  return size
}

const getCookieCount = (): number => {
  try {
    return document.cookie ? document.cookie.split(';').filter(c => c.trim()).length : 0
  } catch {
    return 0
  }
}

const detectBrowser = (): { name: string; version: string; engine: string } => {
  const ua = navigator.userAgent
  let name = '未知浏览器'
  let version = '未知'
  let engine = '未知'

  if (/Edg\/([\d.]+)/.test(ua)) {
    name = 'Microsoft Edge'
    version = RegExp.$1
  } else if (/OPR\/([\d.]+)/.test(ua) || /Opera\/([\d.]+)/.test(ua)) {
    name = 'Opera'
    version = RegExp.$1
  } else if (/Chrome\/([\d.]+)/.test(ua)) {
    name = 'Google Chrome'
    version = RegExp.$1
  } else if (/Firefox\/([\d.]+)/.test(ua)) {
    name = 'Mozilla Firefox'
    version = RegExp.$1
  } else if (/Safari\/([\d.]+)/.test(ua)) {
    name = 'Apple Safari'
    version = RegExp.$1
  } else if (/MSIE ([\d.]+)/.test(ua) || /Trident\/.*rv:([\d.]+)/.test(ua)) {
    name = 'Microsoft Internet Explorer'
    version = RegExp.$1
  }

  if (/Gecko\/\d/.test(ua) && /Firefox/.test(ua)) {
    engine = 'Gecko'
  } else if (/WebKit\/\d/.test(ua)) {
    engine = 'WebKit/Blink'
  } else if (/Trident/.test(ua)) {
    engine = 'Trident'
  } else if (/Presto/.test(ua)) {
    engine = 'Presto'
  }

  return { name, version, engine }
}

const getDOMDepth = (): number => {
  let maxDepth = 0
  const traverse = (el: Element, depth: number) => {
    if (depth > maxDepth) maxDepth = depth
    let child = el.firstElementChild
    while (child) {
      traverse(child, depth + 1)
      child = child.nextElementSibling
    }
  }
  if (document.body) traverse(document.body, 0)
  return maxDepth
}

const collectData = (): SystemData => {
  const perfMemory = (performance as any).memory
  const memory: MemoryInfo = perfMemory
    ? {
        usedJSHeapSize: perfMemory.usedJSHeapSize,
        totalJSHeapSize: perfMemory.totalJSHeapSize,
        jsHeapSizeLimit: perfMemory.jsHeapSizeLimit,
        available: true,
      }
    : {
        usedJSHeapSize: 0,
        totalJSHeapSize: 0,
        jsHeapSizeLimit: 0,
        available: false,
      }

  const navConnection = (navigator as any).connection || (navigator as any).mozConnection || (navigator as any).webkitConnection
  const network: NetworkInfo = navConnection
    ? {
        online: navigator.onLine,
        effectiveType: navConnection.effectiveType || '未知',
        downlink: typeof navConnection.downlink === 'number' ? navConnection.downlink : null,
        rtt: typeof navConnection.rtt === 'number' ? navConnection.rtt : null,
        saveData: navConnection.saveData || false,
        available: true,
      }
    : {
        online: navigator.onLine,
        effectiveType: '未知',
        downlink: null,
        rtt: null,
        saveData: false,
        available: false,
      }

  const browserDetect = detectBrowser()

  return {
    memory,
    performance: {
      fps: 0,
      loadTime: Math.round(performance.now()),
      domNodes: document.querySelectorAll('*').length,
      domDepth: getDOMDepth(),
    },
    network,
    storage: {
      localStorageSize: getStorageSize(localStorage),
      sessionStorageSize: getStorageSize(sessionStorage),
      cookieCount: getCookieCount(),
    },
    cpuCores: navigator.hardwareConcurrency || 0,
    browser: {
      name: browserDetect.name,
      version: browserDetect.version,
      engine: browserDetect.engine,
      language: navigator.language,
      languages: Array.from(navigator.languages || [navigator.language]),
      platform: navigator.platform || '未知',
      userAgent: navigator.userAgent,
      vendor: navigator.vendor || '未知',
      onLine: navigator.onLine,
      cookieEnabled: navigator.cookieEnabled,
    },
    timestamp: Date.now(),
  }
}

const SystemHealthCheck = memo(function SystemHealthCheck() {
  const [data, setData] = useState<SystemData>(() => collectData())
  const [fps, setFps] = useState(0)
  const [refreshCount, setRefreshCount] = useState(0)

  useEffect(() => {
    let frameCount = 0
    let lastFrameTime = performance.now()
    let rafId: number

    const measure = () => {
      frameCount++
      const now = performance.now()
      if (now - lastFrameTime >= 1000) {
        setFps(Math.round((frameCount * 1000) / (now - lastFrameTime)))
        frameCount = 0
        lastFrameTime = now
      }
      rafId = requestAnimationFrame(measure)
    }

    rafId = requestAnimationFrame(measure)
    return () => cancelAnimationFrame(rafId)
  }, [])

  const refresh = useCallback(() => {
    setData(collectData())
    setRefreshCount(c => c + 1)
  }, [])

  useEffect(() => {
    const id = setInterval(refresh, 2000)
    return () => clearInterval(id)
  }, [refresh])

  useEffect(() => {
    const handleOnline = () => refresh()
    const handleOffline = () => refresh()
    window.addEventListener('online', handleOnline)
    window.addEventListener('offline', handleOffline)
    return () => {
      window.removeEventListener('online', handleOnline)
      window.removeEventListener('offline', handleOffline)
    }
  }, [refresh])

  const memoryPercent = data.memory.available
    ? ((data.memory.usedJSHeapSize / data.memory.jsHeapSizeLimit) * 100).toFixed(1)
    : '0.0'

  const memoryBarPercent = data.memory.available
    ? Math.min((data.memory.usedJSHeapSize / data.memory.jsHeapSizeLimit) * 100, 100)
    : 0

  const totalStorage = data.storage.localStorageSize + data.storage.sessionStorageSize

  const getMemoryColor = (percent: number) => {
    if (percent >= 85) return { from: '#ef4444', to: '#f87171', label: '危险' }
    if (percent >= 70) return { from: '#f59e0b', to: '#fbbf24', label: '警告' }
    return { from: '#10b981', to: '#34d399', label: '良好' }
  }

  const memColor = getMemoryColor(memoryBarPercent)

  const cardStyle = (delay: number): React.CSSProperties => ({
    background: 'rgba(255, 255, 255, 0.04)',
    borderRadius: 16,
    padding: 20,
    border: '1px solid rgba(255, 255, 255, 0.08)',
    backdropFilter: 'blur(12px)',
    WebkitBackdropFilter: 'blur(12px)',
    animation: `fadeInUp 0.5s ease ${delay}ms both`,
  })

  const progressWrapStyle: React.CSSProperties = {
    height: 8,
    background: 'rgba(255, 255, 255, 0.08)',
    borderRadius: 4,
    overflow: 'hidden',
    marginTop: 12,
  }

  const progressBarStyle = (percent: number, from: string, to: string): React.CSSProperties => ({
    height: '100%',
    width: `${percent}%`,
    background: `linear-gradient(90deg, ${from}, ${to})`,
    borderRadius: 4,
    transition: 'width 0.6s cubic-bezier(0.4, 0, 0.2, 1)',
    boxShadow: `0 0 10px ${from}66`,
  })

  const labelStyle: React.CSSProperties = {
    fontSize: 12,
    color: 'rgba(255, 255, 255, 0.5)',
    marginTop: 6,
  }

  const valueStyle: React.CSSProperties = {
    fontSize: 32,
    fontWeight: 800,
    color: '#fff',
    letterSpacing: '-0.5px',
    lineHeight: 1.1,
  }

  const sectionTitleStyle: React.CSSProperties = {
    fontSize: 18,
    fontWeight: 700,
    color: 'rgba(255, 255, 255, 0.9)',
    margin: 0,
    display: 'flex',
    alignItems: 'center',
    gap: 8,
  }

  const rowStyle: React.CSSProperties = {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '8px 0',
    borderBottom: '1px solid rgba(255, 255, 255, 0.04)',
  }

  const rowLabelStyle: React.CSSProperties = {
    fontSize: 13,
    color: 'rgba(255, 255, 255, 0.55)',
  }

  const rowValueStyle: React.CSSProperties = {
    fontSize: 13,
    fontWeight: 600,
    color: 'rgba(255, 255, 255, 0.9)',
    fontFamily: 'monospace',
    maxWidth: '60%',
    textAlign: 'right',
    wordBreak: 'break-all',
  }

  return (
    <div
      style={{
        background: 'linear-gradient(180deg, #0b0f1a 0%, #111827 40%, #0b0f1a 100%)',
        color: '#fff',
        padding: 20,
        overflow: 'auto',
        minHeight: '100%',
        fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif',
      }}
    >
      <style>{`
        @keyframes fadeInUp {
          from { opacity: 0; transform: translateY(12px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @keyframes pulse-dot {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.4; }
        }
      `}</style>

      <div style={{ textAlign: 'center', marginBottom: 24, animation: 'fadeInUp 0.6s ease' }}>
        <h2 style={{ fontSize: 24, fontWeight: 700, marginBottom: 6, background: 'linear-gradient(90deg, #60a5fa, #a78bfa, #f472b6)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text' }}>
          🩺 系统健康检查
        </h2>
        <p style={{ color: 'rgba(255, 255, 255, 0.45)', fontSize: 13 }}>
          实时监控浏览器运行状态 · 每 2 秒自动刷新
        </p>
        <div style={{ marginTop: 8, fontSize: 12, color: 'rgba(255,255,255,0.35)' }}>
          上次更新：{new Date(data.timestamp).toLocaleTimeString('zh-CN')} · 已刷新 {refreshCount} 次
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 14 }}>
        {/* 堆内存 */}
        <div style={cardStyle(0)}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
            <div style={sectionTitleStyle}>
              <span style={{ fontSize: 20 }}>🧠</span>
              <span>堆内存</span>
            </div>
            <span
              style={{
                fontSize: 11,
                fontWeight: 700,
                color: memColor.from,
                background: `${memColor.from}22`,
                padding: '4px 10px',
                borderRadius: 8,
                border: `1px solid ${memColor.from}33`,
              }}
            >
              {memColor.label}
            </span>
          </div>

          {data.memory.available ? (
            <>
              <div style={{ display: 'flex', alignItems: 'baseline', gap: 6 }}>
                <span style={{ ...valueStyle, color: memColor.from }}>{memoryPercent}</span>
                <span style={{ fontSize: 16, fontWeight: 600, color: 'rgba(255,255,255,0.4)' }}>%</span>
              </div>
              <div style={progressWrapStyle}>
                <div style={progressBarStyle(memoryBarPercent, memColor.from, memColor.to)} />
              </div>
              <div style={{ marginTop: 14 }}>
                <div style={rowStyle}>
                  <span style={rowLabelStyle}>已使用</span>
                  <span style={rowValueStyle}>{formatBytes(data.memory.usedJSHeapSize)}</span>
                </div>
                <div style={rowStyle}>
                  <span style={rowLabelStyle}>已分配</span>
                  <span style={rowValueStyle}>{formatBytes(data.memory.totalJSHeapSize)}</span>
                </div>
                <div style={{ ...rowStyle, borderBottom: 'none' }}>
                  <span style={rowLabelStyle}>内存上限</span>
                  <span style={rowValueStyle}>{formatBytes(data.memory.jsHeapSizeLimit)}</span>
                </div>
              </div>
              <div style={{ ...labelStyle, textAlign: 'center', marginTop: 10 }}>
                ⚠️ 此 API 仅在 Chromium 浏览器中可用
              </div>
            </>
          ) : (
            <div style={{ textAlign: 'center', padding: '20px 0', color: 'rgba(255,255,255,0.4)' }}>
              <div style={{ fontSize: 36, marginBottom: 8 }}>🔒</div>
              <div style={{ fontSize: 13 }}>当前浏览器不支持<br/>内存信息 API</div>
            </div>
          )}
        </div>

        {/* 页面性能 */}
        <div style={cardStyle(80)}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
            <div style={sectionTitleStyle}>
              <span style={{ fontSize: 20 }}>⚡</span>
              <span>页面性能</span>
            </div>
            <span
              style={{
                fontSize: 11,
                fontWeight: 700,
                color: fps >= 55 ? '#10b981' : fps >= 30 ? '#f59e0b' : '#ef4444',
                background: fps >= 55 ? 'rgba(16,185,129,0.15)' : fps >= 30 ? 'rgba(245,158,11,0.15)' : 'rgba(239,68,68,0.15)',
                padding: '4px 10px',
                borderRadius: 8,
              }}
            >
              {fps >= 55 ? '流畅' : fps >= 30 ? '一般' : '卡顿'}
            </span>
          </div>

          <div style={{ display: 'flex', gap: 16, marginBottom: 8 }}>
            <div style={{ flex: 1 }}>
              <div style={{ display: 'flex', alignItems: 'baseline', gap: 4 }}>
                <span style={{ ...valueStyle, fontSize: 28 }}>{fps}</span>
                <span style={{ fontSize: 14, color: 'rgba(255,255,255,0.4)' }}>FPS</span>
              </div>
              <div style={labelStyle}>帧率</div>
            </div>
            <div style={{ flex: 1 }}>
              <div style={{ display: 'flex', alignItems: 'baseline', gap: 4 }}>
                <span style={{ ...valueStyle, fontSize: 28 }}>{(data.performance.loadTime / 1000).toFixed(1)}</span>
                <span style={{ fontSize: 14, color: 'rgba(255,255,255,0.4)' }}>s</span>
              </div>
              <div style={labelStyle}>页面加载</div>
            </div>
          </div>

          <div style={{ marginTop: 10 }}>
            <div style={rowStyle}>
              <span style={rowLabelStyle}>DOM 节点数</span>
              <span style={rowValueStyle}>{data.performance.domNodes.toLocaleString()}</span>
            </div>
            <div style={{ ...rowStyle, borderBottom: 'none' }}>
              <span style={rowLabelStyle}>DOM 最大深度</span>
              <span style={rowValueStyle}>{data.performance.domDepth} 层</span>
            </div>
          </div>

          <div style={progressWrapStyle}>
            <div
              style={progressBarStyle(
                Math.min((fps / 60) * 100, 100),
                '#60a5fa',
                '#818cf8'
              )}
            />
          </div>
        </div>

        {/* 网络状态 */}
        <div style={cardStyle(160)}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
            <div style={sectionTitleStyle}>
              <span style={{ fontSize: 20 }}>🌐</span>
              <span>网络状态</span>
            </div>
            <span
              style={{
                fontSize: 11,
                fontWeight: 700,
                color: data.network.online ? '#10b981' : '#ef4444',
                background: data.network.online ? 'rgba(16,185,129,0.15)' : 'rgba(239,68,68,0.15)',
                padding: '4px 10px',
                borderRadius: 8,
                display: 'flex',
                alignItems: 'center',
                gap: 4,
              }}
            >
              <span
                style={{
                  width: 6,
                  height: 6,
                  borderRadius: '50%',
                  background: data.network.online ? '#10b981' : '#ef4444',
                  animation: 'pulse-dot 1.5s infinite',
                }}
              />
              {data.network.online ? '在线' : '离线'}
            </span>
          </div>

          {data.network.available ? (
            <>
              <div style={rowStyle}>
                <span style={rowLabelStyle}>有效连接类型</span>
                <span style={{ ...rowValueStyle, textTransform: 'uppercase' }}>{data.network.effectiveType}</span>
              </div>
              <div style={rowStyle}>
                <span style={rowLabelStyle}>下行速度</span>
                <span style={rowValueStyle}>
                  {data.network.downlink !== null ? `${data.network.downlink.toFixed(2)} Mbps` : '未知'}
                </span>
              </div>
              <div style={rowStyle}>
                <span style={rowLabelStyle}>往返时间</span>
                <span style={rowValueStyle}>
                  {data.network.rtt !== null ? `${data.network.rtt} ms` : '未知'}
                </span>
              </div>
              <div style={{ ...rowStyle, borderBottom: 'none' }}>
                <span style={rowLabelStyle}>节省流量模式</span>
                <span style={{ ...rowValueStyle, color: data.network.saveData ? '#f59e0b' : 'rgba(255,255,255,0.7)' }}>
                  {data.network.saveData ? '已开启' : '未开启'}
                </span>
              </div>

              {data.network.downlink !== null && (
                <div style={progressWrapStyle}>
                  <div
                    style={progressBarStyle(
                      Math.min((data.network.downlink / 10) * 100, 100),
                      '#06b6d4',
                      '#3b82f6'
                    )}
                  />
                </div>
              )}
            </>
          ) : (
            <div style={{ textAlign: 'center', padding: '20px 0', color: 'rgba(255,255,255,0.4)' }}>
              <div style={{ fontSize: 36, marginBottom: 8 }}>🔒</div>
              <div style={{ fontSize: 13 }}>当前浏览器不支持<br/>网络信息 API</div>
            </div>
          )}
        </div>

        {/* 存储信息 */}
        <div style={cardStyle(240)}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
            <div style={sectionTitleStyle}>
              <span style={{ fontSize: 20 }}>💾</span>
              <span>存储信息</span>
            </div>
            <span
              style={{
                fontSize: 11,
                fontWeight: 700,
                color: '#a78bfa',
                background: 'rgba(167,139,250,0.15)',
                padding: '4px 10px',
                borderRadius: 8,
              }}
            >
              {formatBytes(totalStorage)}
            </span>
          </div>

          <div style={rowStyle}>
            <span style={rowLabelStyle}>LocalStorage</span>
            <span style={rowValueStyle}>{formatBytes(data.storage.localStorageSize)}</span>
          </div>
          <div style={rowStyle}>
            <span style={rowLabelStyle}>SessionStorage</span>
            <span style={rowValueStyle}>{formatBytes(data.storage.sessionStorageSize)}</span>
          </div>
          <div style={rowStyle}>
            <span style={rowLabelStyle}>Cookie 数量</span>
            <span style={rowValueStyle}>{data.storage.cookieCount} 个</span>
          </div>
          <div style={{ ...rowStyle, borderBottom: 'none' }}>
            <span style={rowLabelStyle}>Cookie 可用</span>
            <span style={{ ...rowValueStyle, color: data.browser.cookieEnabled ? '#10b981' : '#ef4444' }}>
              {data.browser.cookieEnabled ? '已启用' : '已禁用'}
            </span>
          </div>

          <div style={{ marginTop: 14 }}>
            <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.45)', marginBottom: 6 }}>LocalStorage 占用</div>
            <div style={progressWrapStyle}>
              <div
                style={progressBarStyle(
                  totalStorage > 0 ? Math.min((data.storage.localStorageSize / totalStorage) * 100, 100) : 0,
                  '#a78bfa',
                  '#f472b6'
                )}
              />
            </div>
          </div>
        </div>

        {/* CPU 核心数 */}
        <div style={cardStyle(320)}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
            <div style={sectionTitleStyle}>
              <span style={{ fontSize: 20 }}>⚙️</span>
              <span>CPU 信息</span>
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
            <div
              style={{
                width: 80,
                height: 80,
                borderRadius: '50%',
                background: 'linear-gradient(135deg, #3b82f6 0%, #8b5cf6 100%)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: 28,
                fontWeight: 800,
                boxShadow: '0 0 30px rgba(59,130,246,0.4)',
              }}
            >
              {data.cpuCores || '?'}
            </div>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 14, color: 'rgba(255,255,255,0.7)', marginBottom: 4 }}>
                逻辑核心数
              </div>
              <div style={{ fontSize: 24, fontWeight: 800, color: '#fff' }}>
                {data.cpuCores > 0 ? `${data.cpuCores} 核` : '未知'}
              </div>
              <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.4)', marginTop: 4 }}>
                navigator.hardwareConcurrency
              </div>
            </div>
          </div>
        </div>

        {/* 浏览器信息 */}
        <div style={cardStyle(400)}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
            <div style={sectionTitleStyle}>
              <span style={{ fontSize: 20 }}>🌍</span>
              <span>浏览器信息</span>
            </div>
          </div>

          <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 14 }}>
              <div
                style={{
                  width: 52,
                  height: 52,
                  borderRadius: 14,
                  background: 'linear-gradient(135deg, rgba(96,165,250,0.3), rgba(167,139,250,0.3))',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: 26,
                  border: '1px solid rgba(255,255,255,0.1)',
                }}
              >
                🌐
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 16, fontWeight: 700, color: '#fff' }}>
                  {data.browser.name}
                </div>
                <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.5)' }}>
                  版本 {data.browser.version} · {data.browser.engine}
                </div>
              </div>
            </div>

            <div style={rowStyle}>
              <span style={rowLabelStyle}>语言</span>
              <span style={rowValueStyle}>{data.browser.language}</span>
            </div>
            <div style={rowStyle}>
              <span style={rowLabelStyle}>支持语言</span>
              <span style={{ ...rowValueStyle, fontSize: 11 }}>
                {data.browser.languages.slice(0, 3).join(', ')}
                {data.browser.languages.length > 3 ? ` +${data.browser.languages.length - 3}` : ''}
              </span>
            </div>
            <div style={rowStyle}>
              <span style={rowLabelStyle}>操作系统</span>
              <span style={rowValueStyle}>{data.browser.platform}</span>
            </div>
            <div style={{ ...rowStyle, borderBottom: 'none' }}>
              <span style={rowLabelStyle}>在线状态</span>
              <span style={{ ...rowValueStyle, color: data.browser.onLine ? '#10b981' : '#ef4444' }}>
                {data.browser.onLine ? '在线' : '离线'}
              </span>
            </div>
          </div>
        </div>
      </div>

      <div
        style={{
          marginTop: 20,
          padding: 14,
          background: 'rgba(59,130,246,0.08)',
          borderRadius: 12,
          border: '1px solid rgba(59,130,246,0.15)',
          fontSize: 12,
          color: 'rgba(255,255,255,0.5)',
          textAlign: 'center',
          animation: 'fadeInUp 0.5s ease 500ms both',
        }}
      >
        💡 所有数据均通过浏览器原生 API 实时获取，无需任何外部请求。
        部分高级指标（如内存信息、网络详情）仅在特定浏览器中支持。
      </div>
    </div>
  )
})

export default SystemHealthCheck