import { useState, useEffect, useRef, useCallback } from 'react'

interface BatteryInfo {
  charging: boolean
  level: number
  chargingTime: number
  dischargingTime: number
}

interface NetworkInfo {
  online: boolean
  type: string
  effectiveType: string
  downlink: number
  rtt: number
  saveData: boolean
}

interface SystemInfo {
  userAgent: string
  platform: string
  language: string
  languages: string[]
  cookieEnabled: boolean
  onLine: boolean
  hardwareConcurrency: number
  deviceMemory: number | null
  maxTouchPoints: number
  viewportWidth: number
  viewportHeight: number
  screenWidth: number
  screenHeight: number
  colorDepth: number
  pixelDepth: number
  timeZone: string
  sessionStorage: boolean
  localStorage: boolean
  indexedDB: boolean
  serviceWorker: boolean
  webGL: boolean
  webGL2: boolean
  wasm: boolean
  webAssembly: boolean
  crypto: boolean
  webRTC: boolean
  webAudio: boolean
  mediaDevices: boolean
  fileSystemAccess: boolean
  webSerial: boolean
  webUSB: boolean
  webBluetooth: boolean
  webShare: boolean
  webNFC: boolean
}

function getSystemInfo(): SystemInfo {
  const nav = navigator as Navigator & {
    deviceMemory?: number
    hardwareConcurrency?: number
    maxTouchPoints?: number
    vendor?: string
  }
  const win = window as Window & {
    SharedArrayBuffer?: typeof SharedArrayBuffer
  }
  
  let webGL = false
  try {
    const canvas = document.createElement('canvas')
    webGL = !!(canvas.getContext('webgl') || canvas.getContext('experimental-webgl'))
  } catch {}

  let webGL2 = false
  try {
    const canvas = document.createElement('canvas')
    webGL2 = !!canvas.getContext('webgl2')
  } catch {}

  return {
    userAgent: nav.userAgent,
    platform: nav.platform || 'unknown',
    language: nav.language,
    languages: Array.from(new Set([nav.language, ...(nav.languages || [])])),
    cookieEnabled: nav.cookieEnabled,
    onLine: nav.onLine,
    hardwareConcurrency: nav.hardwareConcurrency || 0,
    deviceMemory: nav.deviceMemory ?? null,
    maxTouchPoints: nav.maxTouchPoints || 0,
    viewportWidth: window.innerWidth,
    viewportHeight: window.innerHeight,
    screenWidth: screen.width,
    screenHeight: screen.height,
    colorDepth: screen.colorDepth,
    pixelDepth: screen.pixelDepth,
    timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone,
    sessionStorage: typeof sessionStorage !== 'undefined',
    localStorage: typeof localStorage !== 'undefined',
    indexedDB: 'indexedDB' in window,
    serviceWorker: 'serviceWorker' in nav,
    webGL,
    webGL2,
    wasm: typeof WebAssembly !== 'undefined',
    webAssembly: typeof win.SharedArrayBuffer !== 'undefined',
    crypto: !!crypto?.subtle,
    webRTC: typeof RTCPeerConnection !== 'undefined',
    webAudio: typeof AudioContext !== 'undefined' || typeof (window as Window & { webkitAudioContext?: typeof AudioContext}).webkitAudioContext !== 'undefined',
    mediaDevices: !!nav.mediaDevices?.getUserMedia,
    fileSystemAccess: 'showDirectoryPicker' in window,
    webSerial: 'serial' in nav,
    webUSB: 'usb' in nav,
    webBluetooth: 'bluetooth' in nav,
    webShare: typeof (nav as Navigator & { canShare?: (data?: ShareData) => boolean }).canShare === 'function',
    webNFC: 'nfc' in nav,
  }
}

const SystemInfoPro = () => {
  const [info, setInfo] = useState<SystemInfo>(() => getSystemInfo())
  const [battery, setBattery] = useState<BatteryInfo | null>(null)
  const [network, setNetwork] = useState<NetworkInfo>({
    online: navigator.onLine,
    type: 'unknown',
    effectiveType: 'unknown',
    downlink: 0,
    rtt: 0,
    saveData: false,
  })
  const [fps, setFps] = useState(60)
  const [memory, setMemory] = useState<{ used: number; total: number } | null>(null)
  const [uptime, setUptime] = useState(0)
  const [tab, setTab] = useState<'overview' | 'hardware' | 'network' | 'features' | 'memory'>('overview')

  const framesRef = useRef(0)
  const lastTimeRef = useRef(performance.now())

  useEffect(() => {
    let batteryManager: {
      charging: boolean
      level: number
      chargingTime: number
      dischargingTime: number
      addEventListener: (type: string, listener: () => void) => void
      removeEventListener?: (type: string, listener: () => void) => void
    } | null = null
    const nav = navigator as Navigator & {
      getBattery?: () => Promise<{
        charging: boolean
        level: number
        chargingTime: number
        dischargingTime: number
        addEventListener: (type: string, listener: () => void) => void
        removeEventListener?: (type: string, listener: () => void) => void
      }>
    }

    const initBattery = async () => {
      if (nav.getBattery) {
        try {
          const bm = await nav.getBattery()
          batteryManager = bm
          const update = () => {
            setBattery({
              charging: bm.charging,
              level: bm.level,
              chargingTime: bm.chargingTime,
              dischargingTime: bm.dischargingTime,
            })
          }
          update()
          bm.addEventListener('levelchange', update)
          bm.addEventListener('chargingchange', update)
          bm.addEventListener('chargingtimechange', update)
          bm.addEventListener('dischargingtimechange', update)
        } catch {}
      }
    }

    initBattery()

    const connection = (navigator as Navigator & {
      connection?: {
        type: string
        effectiveType: string
        downlink: number
        rtt: number
        saveData: boolean
        addEventListener: (type: string, listener: () => void) => void
        removeEventListener: (type: string, listener: () => void) => void
      }
    }).connection

    if (connection) {
      const updateNetwork = () => {
        setNetwork({
          online: navigator.onLine,
          type: connection.type,
          effectiveType: connection.effectiveType,
          downlink: connection.downlink,
          rtt: connection.rtt,
          saveData: connection.saveData,
        })
      }
      updateNetwork()
      connection.addEventListener('change', updateNetwork)
      connection.addEventListener('typechange', updateNetwork)
      connection.addEventListener('effectiveTypechange', updateNetwork)
    }

    const handleOnline = () => setNetwork(n => ({ ...n, online: true }))
    const handleOffline = () => setNetwork(n => ({ ...n, online: false }))
    window.addEventListener('online', handleOnline)
    window.addEventListener('offline', handleOffline)

    return () => {
      if (batteryManager) {
        batteryManager.removeEventListener?.('levelchange', () => {})
        batteryManager.removeEventListener?.('chargingchange', () => {})
      }
      window.removeEventListener('online', handleOnline)
      window.removeEventListener('offline', handleOffline)
    }
  }, [])

  useEffect(() => {
    let animId: number
    const measureFps = (now: number) => {
      framesRef.current++
      if (now - lastTimeRef.current >= 1000) {
        setFps(framesRef.current)
        framesRef.current = 0
        lastTimeRef.current = now
      }
      animId = requestAnimationFrame(measureFps)
    }
    animId = requestAnimationFrame(measureFps)
    return () => cancelAnimationFrame(animId)
  }, [])

  useEffect(() => {
    const interval = setInterval(() => {
      const perf = performance as unknown as {
        memory?: { usedJSHeapSize: number; totalJSHeapSize: number; jsHeapSizeLimit: number }
      }
      if (perf.memory) {
        setMemory({
          used: Math.round(perf.memory.usedJSHeapSize / 1024 / 1024),
          total: Math.round(perf.memory.totalJSHeapSize / 1024 / 1024),
        })
      }
      setUptime(Math.floor(performance.now() / 1000))
    }, 1000)
    return () => clearInterval(interval)
  }, [])

  const refresh = useCallback(() => {
    setInfo(getSystemInfo())
  }, [])

  const formatUptime = (seconds: number): string => {
    const h = Math.floor(seconds / 3600)
    const m = Math.floor((seconds % 3600) / 60)
    const s = seconds % 60
    return `${h}h ${m}m ${s}s`
  }

  const FeatureRow = ({ label, available, description }: { label: string; available: boolean; description?: string }) => (
    <div className="si-feature-row">
      <span className={`si-feature-status ${available ? 'available' : 'unavailable'}`}>
        {available ? '✓' : '✗'}
      </span>
      <div className="si-feature-info">
        <span className="si-feature-label">{label}</span>
        {description && <span className="si-feature-desc">{description}</span>}
      </div>
    </div>
  )

  const CopyButton = ({ text }: { text: string }) => {
    const [copied, setCopied] = useState(false)
    return (
      <button
        className="si-copy-btn"
        onClick={() => {
          navigator.clipboard.writeText(text)
          setCopied(true)
          setTimeout(() => setCopied(false), 2000)
        }}
      >
        {copied ? '已复制' : '复制 UA'}
      </button>
    )
  }

  return (
    <div className="si-app">
      <div className="si-header">
        <div className="si-title">
          <span className="si-icon">⚙</span>
          <div>
            <h1>SystemInfo Pro</h1>
            <p>浏览器系统信息诊断</p>
          </div>
        </div>
        <button className="si-refresh-btn" onClick={refresh}>
          刷新数据
        </button>
      </div>

      <div className="si-tabs">
        {(['overview', 'hardware', 'network', 'memory', 'features'] as const).map(t => (
          <button
            key={t}
            className={`si-tab ${tab === t ? 'active' : ''}`}
            onClick={() => setTab(t)}
          >
            {t === 'overview' && '概览'}
            {t === 'hardware' && '硬件'}
            {t === 'network' && '网络'}
            {t === 'memory' && '性能'}
            {t === 'features' && '功能'}
          </button>
        ))}
      </div>

      <div className="si-content">
        {tab === 'overview' && (
          <div className="si-grid">
            <div className="si-card">
              <h3>运行状态</h3>
              <div className="si-stat">
                <span className="si-stat-value si-fps">{fps}</span>
                <span className="si-stat-label">FPS</span>
              </div>
              <div className="si-stat">
                <span className="si-stat-value">{formatUptime(uptime)}</span>
                <span className="si-stat-label">运行时长</span>
              </div>
              <div className="si-stat">
                <span className="si-stat-value">{info.onLine ? '在线' : '离线'}</span>
                <span className="si-stat-label">网络状态</span>
              </div>
            </div>

            <div className="si-card">
              <h3>设备能力</h3>
              <div className="si-stat">
                <span className="si-stat-value">{info.hardwareConcurrency || 'N/A'}</span>
                <span className="si-stat-label">CPU 核心</span>
              </div>
              <div className="si-stat">
                <span className="si-stat-value">{info.deviceMemory ? `${info.deviceMemory}GB` : 'N/A'}</span>
                <span className="si-stat-label">设备内存</span>
              </div>
              <div className="si-stat">
                <span className="si-stat-value">{info.maxTouchPoints > 0 ? '触控屏' : '无触控'}</span>
                <span className="si-stat-label">输入方式</span>
              </div>
            </div>

            <div className="si-card">
              <h3>浏览器</h3>
              <div className="si-ua-row">
                <span className="si-ua-label">平台</span>
                <span className="si-ua-value">{info.platform}</span>
              </div>
              <div className="si-ua-row">
                <span className="si-ua-label">语言</span>
                <span className="si-ua-value">{info.language}</span>
              </div>
              <div className="si-ua-row">
                <span className="si-ua-label">时区</span>
                <span className="si-ua-value">{info.timeZone}</span>
              </div>
              <div className="si-ua-row">
                <span className="si-ua-label">UserAgent</span>
                <div className="si-ua-value-wrap">
                  <span className="si-ua-value si-ua-text">{info.userAgent}</span>
                  <CopyButton text={info.userAgent} />
                </div>
              </div>
            </div>
          </div>
        )}

        {tab === 'hardware' && (
          <div className="si-grid">
            <div className="si-card">
              <h3>显示信息</h3>
              <div className="si-stat-grid">
                <div className="si-stat">
                  <span className="si-stat-value">{info.screenWidth}×{info.screenHeight}</span>
                  <span className="si-stat-label">屏幕分辨率</span>
                </div>
                <div className="si-stat">
                  <span className="si-stat-value">{info.viewportWidth}×{info.viewportHeight}</span>
                  <span className="si-stat-label">视口</span>
                </div>
                <div className="si-stat">
                  <span className="si-stat-value">{info.colorDepth}-bit</span>
                  <span className="si-stat-label">色深</span>
                </div>
                <div className="si-stat">
                  <span className="si-stat-value">{info.pixelDepth}-bit</span>
                  <span className="si-stat-label">像素深度</span>
                </div>
              </div>
            </div>

            <div className="si-card">
              <h3>电池状态</h3>
              {battery ? (
                <>
                  <div className="si-battery-bar">
                    <div
                      className="si-battery-fill"
                      style={{
                        width: `${battery.level * 100}%`,
                        background: battery.charging ? 'linear-gradient(90deg, #22c55e, #16a34a)' : battery.level < 0.2 ? '#ef4444' : '#3b82f6'
                      }}
                    />
                    <span className="si-battery-text">{Math.round(battery.level * 100)}%</span>
                  </div>
                  <div className="si-stat">
                    <span className="si-stat-value">{battery.charging ? '充电中' : '放电中'}</span>
                    <span className="si-stat-label">状态</span>
                  </div>
                  {battery.chargingTime > 0 && (
                    <div className="si-stat">
                      <span className="si-stat-value">{Math.round(battery.chargingTime / 60)}分钟</span>
                      <span className="si-stat-label">充电至满</span>
                    </div>
                  )}
                  {battery.dischargingTime > 0 && !battery.charging && (
                    <div className="si-stat">
                      <span className="si-stat-value">{Math.round(battery.dischargingTime / 60)}分钟</span>
                      <span className="si-stat-label">剩余时间</span>
                    </div>
                  )}
                </>
              ) : (
                <p className="si-unavailable">不支持电池 API 或无法获取</p>
              )}
            </div>

            <div className="si-card">
              <h3>CPU 与内存</h3>
              <div className="si-stat">
                <span className="si-stat-value">{info.hardwareConcurrency || 'N/A'}</span>
                <span className="si-stat-label">逻辑核心数</span>
              </div>
              <div className="si-stat">
                <span className="si-stat-value">{info.deviceMemory ? `${info.deviceMemory}GB` : 'N/A'}</span>
                <span className="si-stat-label">设备内存</span>
              </div>
            </div>
          </div>
        )}

        {tab === 'network' && (
          <div className="si-grid">
            <div className="si-card">
              <h3>网络状态</h3>
              <div className="si-stat">
                <span className={`si-stat-value ${network.online ? 'si-online' : 'si-offline'}`}>
                  {network.online ? '● 在线' : '● 离线'}
                </span>
                <span className="si-stat-label">连接状态</span>
              </div>
              <div className="si-stat">
                <span className="si-stat-value">{network.effectiveType.toUpperCase()}</span>
                <span className="si-stat-label">有效类型</span>
              </div>
              <div className="si-stat">
                <span className="si-stat-value">{network.downlink.toFixed(2)} Mbps</span>
                <span className="si-stat-label">下行速率</span>
              </div>
              <div className="si-stat">
                <span className="si-stat-value">{network.rtt} ms</span>
                <span className="si-stat-label">往返延迟</span>
              </div>
              <div className="si-stat">
                <span className="si-stat-value">{network.saveData ? '已开启' : '未开启'}</span>
                <span className="si-stat-label">省流模式</span>
              </div>
            </div>

            <div className="si-card">
              <h3>连接类型</h3>
              <div className="si-stat">
                <span className="si-stat-value">{network.type || 'unknown'}</span>
                <span className="si-stat-label">网络类型</span>
              </div>
              <p className="si-hint">
                Connection API 仅在 Chrome/Edge 中可用。Firefox/Safari 可能显示默认值。
              </p>
            </div>
          </div>
        )}

        {tab === 'memory' && (
          <div className="si-grid">
            <div className="si-card">
              <h3>内存使用</h3>
              {memory ? (
                <>
                  <div className="si-memory-bar">
                    <div
                      className="si-memory-fill"
                      style={{ width: `${memory.total > 0 ? (memory.used / memory.total) * 100 : 0}%` }}
                    />
                    <span className="si-memory-text">
                      {memory.used} / {memory.total} MB
                    </span>
                  </div>
                  <div className="si-stat">
                    <span className="si-stat-value">
                      {memory.total > 0 ? Math.round((memory.used / memory.total) * 100) : 0}%
                    </span>
                    <span className="si-stat-label">使用率</span>
                  </div>
                  <p className="si-hint">
                    仅 Chrome 支持 performance.memory。此数据为 JavaScript 堆内存。
                  </p>
                </>
              ) : (
                <p className="si-unavailable">当前浏览器不支持内存监控</p>
              )}
            </div>

            <div className="si-card">
              <h3>性能指标</h3>
              <div className="si-stat">
                <span className={`si-stat-value ${fps >= 55 ? 'si-good' : fps >= 30 ? 'si-warn' : 'si-bad'}`}>
                  {fps} FPS
                </span>
                <span className="si-stat-label">帧率</span>
              </div>
              <div className="si-stat">
                <span className="si-stat-value">{formatUptime(uptime)}</span>
                <span className="si-stat-label">运行时长</span>
              </div>
            </div>
          </div>
        )}

        {tab === 'features' && (
          <div className="si-grid">
            <div className="si-card">
              <h3>核心 Web API</h3>
              <FeatureRow label="WebGL" available={info.webGL} description="3D 图形渲染" />
              <FeatureRow label="WebGL 2" available={info.webGL2} description="增强 3D 渲染" />
              <FeatureRow label="WebAssembly" available={info.webAssembly} description="高性能代码执行" />
              <FeatureRow label="SharedArrayBuffer" available={info.webAssembly} description="多线程内存共享" />
              <FeatureRow label="Web Crypto" available={info.crypto} description="加密与哈希" />
              <FeatureRow label="WebRTC" available={info.webRTC} description="实时通信" />
            </div>

            <div className="si-card">
              <h3>媒体与设备</h3>
              <FeatureRow label="Web Audio" available={info.webAudio} description="音频处理" />
              <FeatureRow label="MediaDevices" available={info.mediaDevices} description="摄像头/麦克风" />
              <FeatureRow label="Web Bluetooth" available={info.webBluetooth} description="蓝牙设备" />
              <FeatureRow label="Web USB" available={info.webUSB} description="USB 设备" />
              <FeatureRow label="File System Access" available={info.fileSystemAccess} description="本地文件系统" />
              <FeatureRow label="Web Serial" available={info.webSerial} description="串口通信" />
            </div>

            <div className="si-card">
              <h3>存储与服务</h3>
              <FeatureRow label="IndexedDB" available={info.indexedDB} description="索引数据库" />
              <FeatureRow label="LocalStorage" available={info.localStorage} description="本地存储" />
              <FeatureRow label="SessionStorage" available={info.sessionStorage} description="会话存储" />
              <FeatureRow label="Service Worker" available={info.serviceWorker} description="离线缓存" />
              <FeatureRow label="Web Share" available={info.webShare} description="系统分享" />
              <FeatureRow label="Web NFC" available={info.webNFC} description="NFC 通信" />
            </div>
          </div>
        )}
      </div>

      <style>{`
        .si-app {
          height: 100%;
          display: flex;
          flex-direction: column;
          background: linear-gradient(145deg, #0f0f1a 0%, #1a1a2e 100%);
          color: #e2e8f0;
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
          overflow: hidden;
        }
        .si-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 20px 24px;
          background: rgba(255,255,255,0.03);
          border-bottom: 1px solid rgba(255,255,255,0.08);
        }
        .si-title { display: flex; align-items: center; gap: 14px; }
        .si-icon {
          font-size: 28px;
          width: 48px; height: 48px;
          display: flex; align-items: center; justify-content: center;
          background: linear-gradient(135deg, #8b5cf6, #6366f1);
          border-radius: 12px;
        }
        .si-title h1 { font-size: 18px; margin: 0; font-weight: 600; }
        .si-title p { font-size: 12px; margin: 0; color: #94a3b8; }
        .si-refresh-btn {
          padding: 8px 16px;
          background: rgba(139, 92, 246, 0.15);
          border: 1px solid rgba(139, 92, 246, 0.3);
          color: #a78bfa;
          border-radius: 8px;
          cursor: pointer;
          font-size: 13px;
          transition: all 0.2s;
        }
        .si-refresh-btn:hover { background: rgba(139, 92, 246, 0.25); }
        .si-tabs {
          display: flex; gap: 4px;
          padding: 12px 24px 0;
          border-bottom: 1px solid rgba(255,255,255,0.08);
          overflow-x: auto;
        }
        .si-tab {
          padding: 10px 20px;
          background: none;
          border: none;
          color: #94a3b8;
          font-size: 13px;
          cursor: pointer;
          border-bottom: 2px solid transparent;
          transition: all 0.2s;
          white-space: nowrap;
        }
        .si-tab.active { color: #a78bfa; border-bottom-color: #8b5cf6; }
        .si-tab:hover { color: #cbd5e1; }
        .si-content {
          flex: 1;
          overflow-y: auto;
          padding: 24px;
        }
        .si-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
          gap: 20px;
        }
        .si-card {
          background: rgba(255,255,255,0.04);
          border: 1px solid rgba(255,255,255,0.08);
          border-radius: 14px;
          padding: 20px;
          backdrop-filter: blur(10px);
        }
        .si-card h3 {
          font-size: 14px;
          font-weight: 600;
          margin: 0 0 16px;
          color: #cbd5e1;
          text-transform: uppercase;
          letter-spacing: 0.5px;
        }
        .si-stat {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 10px 0;
          border-bottom: 1px solid rgba(255,255,255,0.04);
        }
        .si-stat:last-child { border-bottom: none; }
        .si-stat-value { font-size: 15px; font-weight: 600; color: #e2e8f0; }
        .si-stat-label { font-size: 12px; color: #94a3b8; }
        .si-fps { color: #22d3ee; }
        .si-online { color: #22c55e; }
        .si-offline { color: #ef4444; }
        .si-good { color: #22c55e; }
        .si-warn { color: #f59e0b; }
        .si-bad { color: #ef4444; }
        .si-stat-grid {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 8px;
        }
        .si-battery-bar {
          position: relative;
          height: 28px;
          background: rgba(255,255,255,0.08);
          border-radius: 6px;
          overflow: hidden;
          margin-bottom: 16px;
        }
        .si-battery-fill {
          height: 100%;
          border-radius: 6px;
          transition: width 0.3s ease;
        }
        .si-battery-text {
          position: absolute;
          inset: 0;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 12px;
          font-weight: 700;
          color: white;
          text-shadow: 0 1px 2px rgba(0,0,0,0.5);
        }
        .si-feature-row {
          display: flex;
          align-items: flex-start;
          gap: 12px;
          padding: 10px 0;
          border-bottom: 1px solid rgba(255,255,255,0.04);
        }
        .si-feature-row:last-child { border-bottom: none; }
        .si-feature-status {
          width: 24px; height: 24px;
          display: flex; align-items: center; justify-content: center;
          border-radius: 6px;
          font-size: 12px; font-weight: 700;
          flex-shrink: 0;
        }
        .si-feature-status.available {
          background: rgba(34, 197, 94, 0.15);
          color: #22c55e;
        }
        .si-feature-status.unavailable {
          background: rgba(239, 68, 68, 0.15);
          color: #ef4444;
        }
        .si-feature-info { display: flex; flex-direction: column; gap: 2px; }
        .si-feature-label { font-size: 13px; font-weight: 500; }
        .si-feature-desc { font-size: 11px; color: #64748b; }
        .si-ua-row {
          display: flex;
          justify-content: space-between;
          padding: 8px 0;
          border-bottom: 1px solid rgba(255,255,255,0.04);
        }
        .si-ua-row:last-child { border-bottom: none; }
        .si-ua-label { font-size: 12px; color: #64748b; }
        .si-ua-value { font-size: 13px; font-weight: 500; }
        .si-ua-value-wrap {
          display: flex;
          align-items: center;
          gap: 8px;
          max-width: 100%;
        }
        .si-ua-text {
          font-family: monospace;
          font-size: 11px;
          color: #94a3b8;
          word-break: break-all;
          max-width: 300px;
        }
        .si-copy-btn {
          padding: 4px 10px;
          background: rgba(139, 92, 246, 0.15);
          border: 1px solid rgba(139, 92, 246, 0.3);
          color: #a78bfa;
          border-radius: 4px;
          cursor: pointer;
          font-size: 11px;
          white-space: nowrap;
        }
        .si-memory-bar {
          position: relative;
          height: 24px;
          background: rgba(255,255,255,0.08);
          border-radius: 6px;
          overflow: hidden;
          margin-bottom: 16px;
        }
        .si-memory-fill {
          height: 100%;
          background: linear-gradient(90deg, #3b82f6, #8b5cf6);
          transition: width 0.3s ease;
        }
        .si-memory-text {
          position: absolute;
          inset: 0;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 12px;
          font-weight: 600;
          color: white;
          text-shadow: 0 1px 2px rgba(0,0,0,0.5);
        }
        .si-unavailable {
          text-align: center;
          color: #64748b;
          font-size: 13px;
          padding: 20px 0;
        }
        .si-hint {
          font-size: 11px;
          color: #64748b;
          margin-top: 12px;
          line-height: 1.5;
        }
      `}</style>
    </div>
  )
}

export default SystemInfoPro
