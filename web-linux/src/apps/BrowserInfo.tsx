import { useState, useEffect, useCallback } from 'react'

interface SystemInfo {
  browser: {
    name: string
    version: string
    engine: string
    userAgent: string
  }
  device: {
    type: string
    screen: string
    viewport: string
    pixelRatio: number
    colorDepth: number
    touchSupport: boolean
  }
  system: {
    os: string
    cpuCores: number
    memory: string
    language: string
    languages: string[]
    timezone: string
    online: boolean
  }
  capabilities: {
    webGL: boolean
    webGL2: boolean
    webAssembly: boolean
    serviceWorker: boolean
    webWorker: boolean
    sharedArrayBuffer: boolean
    crypto: boolean
    geolocation: boolean
    notifications: boolean
    fullscreen: boolean
    fileAPI: boolean
    localStorage: boolean
    sessionStorage: boolean
    indexedDB: boolean
    webAudio: boolean
    webRTC: boolean
    webSerial: boolean
    fileSystemAccess: boolean
    webGPU: boolean
  }
  network: {
    type: string
    effectiveType: string
    downlink: number | null
    rtt: number | null
    saveData: boolean
  }
}

function detectBrowser() {
  const ua = navigator.userAgent
  let name = '未知', version = '未知', engine = '未知'
  
  if (/Edg\/([\d.]+)/.test(ua)) { name = 'Edge'; version = RegExp.$1 }
  else if (/Chrome\/([\d.]+)/.test(ua)) { name = 'Chrome'; version = RegExp.$1 }
  else if (/Firefox\/([\d.]+)/.test(ua)) { name = 'Firefox'; version = RegExp.$1 }
  else if (/Safari\/([\d.]+)/.test(ua)) { name = 'Safari'; version = RegExp.$1 }
  
  if (/WebKit/.test(ua)) engine = 'WebKit/Blink'
  else if (/Gecko/.test(ua)) engine = 'Gecko'
  else if (/Trident/.test(ua)) engine = 'Trident'
  
  return { name, version, engine, userAgent: ua }
}

function detectDevice() {
  const ua = navigator.userAgent
  let type = '桌面设备'
  if (/Mobile/.test(ua)) type = '移动设备'
  else if (/Tablet|iPad/.test(ua)) type = '平板设备'
  
  return {
    type,
    screen: `${screen.width} x ${screen.height}`,
    viewport: `${window.innerWidth} x ${window.innerHeight}`,
    pixelRatio: window.devicePixelRatio,
    colorDepth: screen.colorDepth,
    touchSupport: 'ontouchstart' in window || navigator.maxTouchPoints > 0,
  }
}

function detectSystem() {
  const ua = navigator.userAgent
  let os = '未知'
  if (/Windows NT 10/.test(ua)) os = 'Windows 10/11'
  else if (/Windows NT 6.3/.test(ua)) os = 'Windows 8.1'
  else if (/Windows NT 6.1/.test(ua)) os = 'Windows 7'
  else if (/Mac OS X ([\d_]+)/.test(ua)) os = 'macOS ' + RegExp.$1.replace(/_/g, '.')
  else if (/Android ([\d.]+)/.test(ua)) os = 'Android ' + RegExp.$1
  else if (/iPhone OS ([\d_]+)/.test(ua)) os = 'iOS ' + RegExp.$1.replace(/_/g, '.')
  else if (/Linux/.test(ua)) os = 'Linux'
  
  const cores = navigator.hardwareConcurrency || 0
  const memory = (navigator as any).deviceMemory ? `${(navigator as any).deviceMemory} GB` : '不可用'
  
  return {
    os,
    cpuCores: cores,
    memory,
    language: navigator.language,
    languages: Array.from(new Set([navigator.language, ...(navigator.languages || [])])),
    timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
    online: navigator.onLine,
  }
}

function detectCapabilities() {
  const testWebGL = (version: number) => {
    try {
      const canvas = document.createElement('canvas')
      return !!canvas.getContext(version === 2 ? 'webgl2' : 'webgl')
    } catch { return false }
  }
  
  const testWebGPU = () => {
    try { return !!(navigator as any).gpu } catch { return false }
  }
  
  const testFileSystemAccess = () => {
    try { return !!(window as any).showDirectoryPicker } catch { return false }
  }
  
  const testWebSerial = () => {
    try { return !!(navigator as any).serial } catch { return false }
  }
  
  const testWebRTC = () => {
    try { return !!window.RTCPeerConnection } catch { return false }
  }
  
  const testSharedArrayBuffer = () => {
    try { return typeof SharedArrayBuffer !== 'undefined' } catch { return false }
  }
  
  return {
    webGL: testWebGL(1),
    webGL2: testWebGL(2),
    webAssembly: typeof WebAssembly !== 'undefined',
    serviceWorker: 'serviceWorker' in navigator,
    webWorker: typeof Worker !== 'undefined',
    sharedArrayBuffer: testSharedArrayBuffer(),
    crypto: typeof crypto !== 'undefined' && !!crypto.subtle,
    geolocation: 'geolocation' in navigator,
    notifications: 'Notification' in window,
    fullscreen: !!document.fullscreenEnabled || !!(document as any).webkitFullscreenEnabled,
    fileAPI: !!FileReader && !!File,
    localStorage: !!localStorage,
    sessionStorage: !!sessionStorage,
    indexedDB: !!window.indexedDB,
    webAudio: !!window.AudioContext || !!(window as any).webkitAudioContext,
    webRTC: testWebRTC(),
    webSerial: testWebSerial(),
    fileSystemAccess: testFileSystemAccess(),
    webGPU: testWebGPU(),
  }
}

function detectNetwork() {
  const conn = (navigator as any).connection || (navigator as any).mozConnection || (navigator as any).webkitConnection
  if (!conn) {
    return { type: '不可用', effectiveType: '不可用', downlink: null, rtt: null, saveData: false }
  }
  return {
    type: conn.type || '未知',
    effectiveType: conn.effectiveType || '未知',
    downlink: conn.downlink ?? null,
    rtt: conn.rtt ?? null,
    saveData: conn.saveData ?? false,
  }
}

const CAPABILITY_LABELS: Record<string, string> = {
  webGL: 'WebGL 图形渲染',
  webGL2: 'WebGL 2.0',
  webAssembly: 'WebAssembly',
  serviceWorker: 'Service Worker',
  webWorker: 'Web Workers',
  sharedArrayBuffer: 'SharedArrayBuffer',
  crypto: 'Web Crypto API',
  geolocation: '地理定位',
  notifications: '桌面通知',
  fullscreen: '全屏 API',
  fileAPI: '文件 API',
  localStorage: '本地存储',
  sessionStorage: '会话存储',
  indexedDB: 'IndexedDB',
  webAudio: 'Web Audio',
  webRTC: 'WebRTC',
  webSerial: 'Web Serial',
  fileSystemAccess: '文件系统访问',
  webGPU: 'WebGPU',
}

export default function BrowserInfo() {
  const [info, setInfo] = useState<SystemInfo | null>(null)
  const [activeTab, setActiveTab] = useState<'browser' | 'device' | 'system' | 'capabilities' | 'network'>('browser')

  const refresh = useCallback(() => {
    setInfo({
      browser: detectBrowser(),
      device: detectDevice(),
      system: detectSystem(),
      capabilities: detectCapabilities(),
      network: detectNetwork(),
    })
  }, [])

  useEffect(() => {
    refresh()
    const handleOnline = () => refresh()
    const handleOffline = () => refresh()
    window.addEventListener('online', handleOnline)
    window.addEventListener('offline', handleOffline)
    return () => {
      window.removeEventListener('online', handleOnline)
      window.removeEventListener('offline', handleOffline)
    }
  }, [refresh])

  const copy = (text: string) => {
    navigator.clipboard.writeText(text)
  }

  const exportReport = () => {
    if (!info) return
    const report = `# 浏览器系统信息报告\n\n生成时间: ${new Date().toLocaleString('zh-CN')}\n\n## 浏览器信息\n- 名称: ${info.browser.name}\n- 版本: ${info.browser.version}\n- 引擎: ${info.browser.engine}\n\n## 设备信息\n- 类型: ${info.device.type}\n- 屏幕: ${info.device.screen}\n- 视口: ${info.device.viewport}\n- 像素比: ${info.device.pixelRatio}\n\n## 系统信息\n- 操作系统: ${info.system.os}\n- CPU核心: ${info.system.cpuCores}\n- 内存: ${info.system.memory}\n- 语言: ${info.system.language}\n- 时区: ${info.system.timezone}\n- 网络: ${info.system.online ? '在线' : '离线'}\n\n## 网络状态\n- 连接类型: ${info.network.type}\n- 有效类型: ${info.network.effectiveType}\n- 下行速率: ${info.network.downlink !== null ? info.network.downlink + ' Mbps' : 'N/A'}\n- RTT: ${info.network.rtt !== null ? info.network.rtt + ' ms' : 'N/A'}\n\n## 功能支持\n${Object.entries(info.capabilities).map(([k, v]) => `- ${CAPABILITY_LABELS[k] || k}: ${v ? '✓ 支持' : '✗ 不支持'}`).join('\n')}\n`
    const blob = new Blob([report], { type: 'text/markdown' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `browser-info-${Date.now()}.md`
    a.click()
    URL.revokeObjectURL(url)
  }

  if (!info) return <div style={{ padding: 40, textAlign: 'center', color: 'rgba(255,255,255,0.5)' }}>正在检测系统信息...</div>

  const tabs = [
    { id: 'browser', label: '浏览器', icon: '🌐' },
    { id: 'device', label: '设备', icon: '📱' },
    { id: 'system', label: '系统', icon: '💻' },
    { id: 'capabilities', label: '功能支持', icon: '⚡' },
    { id: 'network', label: '网络', icon: '📡' },
  ] as const

  return (
    <div style={{
      height: '100%',
      display: 'flex',
      flexDirection: 'column',
      background: 'linear-gradient(135deg, #0c1426 0%, #1a1a3e 50%, #0f0c29 100%)',
      color: '#f0f0ff',
      fontFamily: "'Inter', -apple-system, sans-serif",
      overflow: 'hidden',
    }}>
      <style>{`
        .bi-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 20px 24px;
          border-bottom: 1px solid rgba(255,255,255,0.1);
        }
        .bi-header h1 {
          font-size: 20px;
          font-weight: 700;
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          background-clip: text;
        }
        .bi-header p {
          font-size: 12px;
          color: rgba(255,255,255,0.5);
          margin-top: 2px;
        }
        .bi-header-actions {
          display: flex;
          gap: 8px;
        }
        .bi-header-actions button {
          padding: 8px 16px;
          background: rgba(255,255,255,0.05);
          border: 1px solid rgba(255,255,255,0.1);
          border-radius: 8px;
          color: #f0f0ff;
          font-size: 13px;
          cursor: pointer;
          transition: all 0.2s;
        }
        .bi-header-actions button:hover {
          background: rgba(124, 108, 240, 0.2);
          border-color: rgba(124, 108, 240, 0.5);
        }
        .bi-tabs {
          display: flex;
          gap: 4px;
          padding: 12px 24px 0;
          border-bottom: 1px solid rgba(255,255,255,0.1);
        }
        .bi-tab {
          padding: 10px 20px;
          background: transparent;
          border: none;
          border-bottom: 2px solid transparent;
          color: rgba(255,255,255,0.6);
          font-size: 14px;
          cursor: pointer;
          transition: all 0.2s;
        }
        .bi-tab:hover {
          color: rgba(255,255,255,0.9);
        }
        .bi-tab.active {
          color: #fff;
          border-bottom-color: #7c6cf0;
        }
        .bi-content {
          flex: 1;
          overflow-y: auto;
          padding: 24px;
        }
        .bi-card {
          background: rgba(255,255,255,0.03);
          border: 1px solid rgba(255,255,255,0.1);
          border-radius: 12px;
          padding: 20px;
          margin-bottom: 16px;
        }
        .bi-card h2 {
          font-size: 14px;
          font-weight: 600;
          margin-bottom: 16px;
          color: rgba(255,255,255,0.7);
        }
        .bi-info-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
          gap: 12px;
        }
        .bi-info-item {
          background: rgba(0,0,0,0.2);
          border-radius: 8px;
          padding: 12px 16px;
        }
        .bi-info-label {
          font-size: 11px;
          color: rgba(255,255,255,0.4);
          text-transform: uppercase;
          letter-spacing: 0.5px;
          margin-bottom: 4px;
        }
        .bi-info-value {
          font-size: 14px;
          font-weight: 500;
          color: #a5b4fc;
          word-break: break-all;
        }
        .bi-info-value.mono {
          font-family: 'JetBrains Mono', monospace;
          font-size: 12px;
        }
        .bi-full-width {
          grid-column: 1 / -1;
        }
        .bi-capability-list {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(220px, 1fr));
          gap: 10px;
        }
        .bi-capability-item {
          display: flex;
          align-items: center;
          gap: 10px;
          padding: 10px 14px;
          background: rgba(0,0,0,0.2);
          border-radius: 8px;
          font-size: 13px;
        }
        .bi-capability-status {
          width: 20px;
          height: 20px;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 11px;
          font-weight: bold;
        }
        .bi-capability-status.supported {
          background: rgba(34, 197, 94, 0.2);
          color: #22c55e;
        }
        .bi-capability-status.unsupported {
          background: rgba(239, 68, 68, 0.2);
          color: #ef4444;
        }
        .bi-badge {
          display: inline-block;
          padding: 2px 8px;
          border-radius: 10px;
          font-size: 11px;
          font-weight: 600;
        }
        .bi-badge.online {
          background: rgba(34, 197, 94, 0.2);
          color: #22c55e;
        }
        .bi-badge.offline {
          background: rgba(239, 68, 68, 0.2);
          color: #ef4444;
        }
        .bi-ua-display {
          padding: 12px;
          background: rgba(0,0,0,0.3);
          border-radius: 8px;
          font-family: 'JetBrains Mono', monospace;
          font-size: 11px;
          word-break: break-all;
          color: rgba(255,255,255,0.7);
          cursor: pointer;
          transition: background 0.2s;
        }
        .bi-ua-display:hover {
          background: rgba(0,0,0,0.5);
        }
        .bi-copy-toast {
          position: fixed;
          bottom: 20px;
          left: 50%;
          transform: translateX(-50%);
          padding: 10px 20px;
          background: rgba(34, 197, 94, 0.9);
          border-radius: 8px;
          color: #fff;
          font-size: 13px;
          z-index: 10000;
          animation: bi-fade-in 0.2s;
        }
        @keyframes bi-fade-in {
          from { opacity: 0; transform: translateX(-50%) translateY(10px); }
          to { opacity: 1; transform: translateX(-50%) translateY(0); }
        }
        .bi-network-meter {
          height: 6px;
          background: rgba(255,255,255,0.1);
          border-radius: 3px;
          overflow: hidden;
          margin-top: 8px;
        }
        .bi-network-bar {
          height: 100%;
          background: linear-gradient(90deg, #22c55e, #7c6cf0);
          border-radius: 3px;
          transition: width 0.3s;
        }
      `}</style>

      <div className="bi-header">
        <div>
          <h1>🔍 浏览器信息面板</h1>
          <p>全面的浏览器和系统环境检测</p>
        </div>
        <div className="bi-header-actions">
          <button onClick={() => { refresh() }}>🔄 刷新</button>
          <button onClick={exportReport}>📥 导出报告</button>
        </div>
      </div>

      <div className="bi-tabs">
        {tabs.map(tab => (
          <button
            key={tab.id}
            className={`bi-tab ${activeTab === tab.id ? 'active' : ''}`}
            onClick={() => setActiveTab(tab.id)}
          >
            {tab.icon} {tab.label}
          </button>
        ))}
      </div>

      <div className="bi-content">
        {activeTab === 'browser' && (
          <div>
            <div className="bi-card">
              <h2>浏览器详情</h2>
              <div className="bi-info-grid">
                <div className="bi-info-item">
                  <div className="bi-info-label">名称</div>
                  <div className="bi-info-value">{info.browser.name}</div>
                </div>
                <div className="bi-info-item">
                  <div className="bi-info-label">版本</div>
                  <div className="bi-info-value mono">{info.browser.version}</div>
                </div>
                <div className="bi-info-item">
                  <div className="bi-info-label">渲染引擎</div>
                  <div className="bi-info-value">{info.browser.engine}</div>
                </div>
                <div className="bi-info-item">
                  <div className="bi-info-label">在线状态</div>
                  <div className="bi-info-value">
                    <span className={`bi-badge ${info.system.online ? 'online' : 'offline'}`}>
                      {info.system.online ? '🟢 在线' : '🔴 离线'}
                    </span>
                  </div>
                </div>
                <div className="bi-info-item bi-full-width">
                  <div className="bi-info-label">User Agent</div>
                  <div 
                    className="bi-ua-display"
                    onClick={() => copy(info.browser.userAgent)}
                    title="点击复制"
                  >
                    {info.browser.userAgent}
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'device' && (
          <div>
            <div className="bi-card">
              <h2>设备信息</h2>
              <div className="bi-info-grid">
                <div className="bi-info-item">
                  <div className="bi-info-label">设备类型</div>
                  <div className="bi-info-value">{info.device.type}</div>
                </div>
                <div className="bi-info-item">
                  <div className="bi-info-label">屏幕分辨率</div>
                  <div className="bi-info-value mono">{info.device.screen}</div>
                </div>
                <div className="bi-info-item">
                  <div className="bi-info-label">视口尺寸</div>
                  <div className="bi-info-value mono">{info.device.viewport}</div>
                </div>
                <div className="bi-info-item">
                  <div className="bi-info-label">像素密度</div>
                  <div className="bi-info-value">{info.device.pixelRatio}x</div>
                </div>
                <div className="bi-info-item">
                  <div className="bi-info-label">色彩深度</div>
                  <div className="bi-info-value">{info.device.colorDepth}-bit</div>
                </div>
                <div className="bi-info-item">
                  <div className="bi-info-label">触摸支持</div>
                  <div className="bi-info-value">{info.device.touchSupport ? '✓ 支持' : '✗ 不支持'}</div>
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'system' && (
          <div>
            <div className="bi-card">
              <h2>系统信息</h2>
              <div className="bi-info-grid">
                <div className="bi-info-item">
                  <div className="bi-info-label">操作系统</div>
                  <div className="bi-info-value">{info.system.os}</div>
                </div>
                <div className="bi-info-item">
                  <div className="bi-info-label">CPU 核心数</div>
                  <div className="bi-info-value">{info.system.cpuCores}</div>
                </div>
                <div className="bi-info-item">
                  <div className="bi-info-label">预估内存</div>
                  <div className="bi-info-value">{info.system.memory}</div>
                </div>
                <div className="bi-info-item">
                  <div className="bi-info-label">主语言</div>
                  <div className="bi-info-value">{info.system.language}</div>
                </div>
                <div className="bi-info-item bi-full-width">
                  <div className="bi-info-label">支持的语言</div>
                  <div className="bi-info-value">{info.system.languages.join(', ')}</div>
                </div>
                <div className="bi-info-item">
                  <div className="bi-info-label">时区</div>
                  <div className="bi-info-value">{info.system.timezone}</div>
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'capabilities' && (
          <div>
            <div className="bi-card">
              <h2>功能支持检测</h2>
              <div className="bi-capability-list">
                {Object.entries(info.capabilities).map(([key, supported]) => (
                  <div key={key} className="bi-capability-item">
                    <div className={`bi-capability-status ${supported ? 'supported' : 'unsupported'}`}>
                      {supported ? '✓' : '✗'}
                    </div>
                    <span>{CAPABILITY_LABELS[key] || key}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {activeTab === 'network' && (
          <div>
            <div className="bi-card">
              <h2>网络状态</h2>
              <div className="bi-info-grid">
                <div className="bi-info-item">
                  <div className="bi-info-label">连接类型</div>
                  <div className="bi-info-value">{info.network.type}</div>
                </div>
                <div className="bi-info-item">
                  <div className="bi-info-label">有效类型</div>
                  <div className="bi-info-value">{info.network.effectiveType}</div>
                </div>
                <div className="bi-info-item">
                  <div className="bi-info-label">下行速率</div>
                  <div className="bi-info-value">{info.network.downlink !== null ? `${info.network.downlink} Mbps` : '不可用'}</div>
                  {info.network.downlink !== null && (
                    <div className="bi-network-meter">
                      <div className="bi-network-bar" style={{width: Math.min(info.network.downlink * 10, 100) + '%'}}></div>
                    </div>
                  )}
                </div>
                <div className="bi-info-item">
                  <div className="bi-info-label">往返延迟</div>
                  <div className="bi-info-value">{info.network.rtt !== null ? `${info.network.rtt} ms` : '不可用'}</div>
                </div>
                <div className="bi-info-item">
                  <div className="bi-info-label">节省流量模式</div>
                  <div className="bi-info-value">{info.network.saveData ? '已开启' : '未开启'}</div>
                </div>
                <div className="bi-info-item">
                  <div className="bi-info-label">在线状态</div>
                  <div className="bi-info-value">
                    <span className={`bi-badge ${info.system.online ? 'online' : 'offline'}`}>
                      {info.system.online ? '🟢 在线' : '🔴 离线'}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
