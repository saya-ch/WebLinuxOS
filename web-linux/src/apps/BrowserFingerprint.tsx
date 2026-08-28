import { useState, useEffect, useCallback, useMemo } from 'react'

// ── 类型定义 ──

interface FingerprintSection {
  id: string
  title: string
  icon: string
  items: FingerprintItem[]
}

interface FingerprintItem {
  label: string
  value: string
  risk: 'low' | 'medium' | 'high'
  detail?: string
}

interface PrivacyScore {
  score: number
  grade: string
  label: string
  color: string
}

// ── 工具函数 ──

function getCanvasFingerprint(): string {
  try {
    const canvas = document.createElement('canvas')
    canvas.width = 200
    canvas.height = 50
    const ctx = canvas.getContext('2d')
    if (!ctx) return '不可用'
    ctx.textBaseline = 'top'
    ctx.font = '14px Arial'
    ctx.fillStyle = '#f60'
    ctx.fillRect(125, 1, 62, 20)
    ctx.fillStyle = '#069'
    ctx.fillText('Fingerprint', 2, 15)
    ctx.fillStyle = 'rgba(102,204,0,0.7)'
    ctx.fillText('Fingerprint', 4, 17)
    return canvas.toDataURL().slice(-32)
  } catch {
    return '受限'
  }
}

function getWebGLInfo(): { vendor: string; renderer: string } {
  try {
    const canvas = document.createElement('canvas')
    const gl = canvas.getContext('webgl') || canvas.getContext('experimental-webgl')
    if (!gl) return { vendor: '不可用', renderer: '不可用' }
    const ext = gl.getExtension('WEBGL_debug_renderer_info')
    if (!ext) {
      return {
        vendor: gl.getParameter(gl.VENDOR),
        renderer: gl.getParameter(gl.RENDERER),
      }
    }
    return {
      vendor: gl.getParameter(ext.UNMASKED_VENDOR_WEBGL),
      renderer: gl.getParameter(ext.UNMASKED_RENDERER_WEBGL),
    }
  } catch {
    return { vendor: '不可用', renderer: '不可用' }
  }
}

function getAudioFingerprint(): string {
  try {
    const AC = window.AudioContext || (window as Record<string, unknown>)['webkitAudioContext'] as typeof AudioContext | undefined
    if (!AC) return '不可用'
    const ctx = new AC()
    const osc = ctx.createOscillator()
    const analyser = ctx.createAnalyser()
    const gain = ctx.createGain()
    const scriptProcessor = ctx.createScriptProcessor(4096, 1, 1)

    gain.gain.value = 0
    osc.type = 'triangle'
    osc.frequency.setValueAtTime(10000, ctx.currentTime)

    osc.connect(analyser)
    analyser.connect(scriptProcessor)
    scriptProcessor.connect(gain)
    gain.connect(ctx.destination)

    osc.start(0)

    const data = new Float32Array(analyser.frequencyBinCount)
    analyser.getFloatFrequencyData(data)

    let sum = 0
    for (let i = 0; i < data.length; i++) {
      sum += Math.abs(data[i])
    }

    osc.disconnect()
    scriptProcessor.disconnect()
    gain.disconnect()
    ctx.close()

    return sum.toString(16).slice(0, 16)
  } catch {
    return '受限'
  }
}

function getScreenFingerprint(): string {
  const parts = [
    screen.width, screen.height, screen.availWidth, screen.availHeight,
    screen.colorDepth, screen.pixelDepth,
    window.devicePixelRatio,
  ]
  return parts.join('x')
}

function computePrivacyScore(sections: FingerprintSection[]): PrivacyScore {
  let riskCount = 0
  let totalItems = 0
  for (const section of sections) {
    for (const item of section.items) {
      totalItems++
      if (item.risk === 'high') riskCount += 3
      else if (item.risk === 'medium') riskCount += 1
    }
  }
  const maxRisk = totalItems * 3
  const rawScore = maxRisk > 0 ? Math.round(((maxRisk - riskCount) / maxRisk) * 100) : 50

  if (rawScore >= 80) return { score: rawScore, grade: 'A', label: '优秀 - 隐私保护良好', color: '#10b981' }
  if (rawScore >= 60) return { score: rawScore, grade: 'B', label: '良好 - 有改进空间', color: '#3b82f6' }
  if (rawScore >= 40) return { score: rawScore, grade: 'C', label: '一般 - 建议加强防护', color: '#f59e0b' }
  if (rawScore >= 20) return { score: rawScore, grade: 'D', label: '较差 - 隐私暴露明显', color: '#f97316' }
  return { score: rawScore, grade: 'F', label: '危险 - 高度可追踪', color: '#ef4444' }
}

// ── 主组件 ──

export default function BrowserFingerprint() {
  const [sections, setSections] = useState<FingerprintSection[]>([])
  const [scanning, setScanning] = useState(true)
  const [expandedSections, setExpandedSections] = useState<Set<string>>(new Set(['browser', 'canvas']))
  const [copiedAll, setCopiedAll] = useState(false)

  const toggleSection = useCallback((id: string) => {
    setExpandedSections(prev => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }, [])

  const collectFingerprint = useCallback(() => {
    setScanning(true)

    setTimeout(() => {
      const ua = navigator.userAgent
      const platform = navigator.platform || '未知'
      const language = navigator.language || '未知'
      const languages = navigator.languages?.join(', ') || language
      const cookies = navigator.cookieEnabled ? '已启用' : '已禁用'
      const doNotTrack = navigator.doNotTrack === '1' ? '是' : navigator.doNotTrack === '0' ? '否' : '未设置'
      const touchPoints = String(navigator.maxTouchPoints || 0)

      const timezone = Intl.DateTimeFormat().resolvedOptions().timeZone
      const timezoneOffset = String(new Date().getTimezoneOffset())

      const screenFp = getScreenFingerprint()
      const webgl = getWebGLInfo()
      const canvasFp = getCanvasFingerprint()
      const audioFp = getAudioFingerprint()

      const hasWekbit = typeof window.webkitMediaDevices !== 'undefined'
      const hasWebBluetooth = typeof navigator.bluetooth !== 'undefined'
      const hasWebUSB = typeof navigator.usb !== 'undefined'
      const hasWebGPU = typeof navigator.gpu !== 'undefined'
      const hasServiceWorker = 'serviceWorker' in navigator
      const hasIndexedDB = typeof indexedDB !== 'undefined'
      const hasLocalStorage = typeof localStorage !== 'undefined'
      const hasSessionStorage = typeof sessionStorage !== 'undefined'

      let localStorageCount = 0
      let sessionStorageCount = 0
      try { localStorageCount = localStorage.length } catch { /* ignore */ }
      try { sessionStorageCount = sessionStorage.length } catch { /* ignore */ }

      const perfMemory = (performance as Record<string, unknown>)['memory'] as { jsHeapSizeLimit?: number } | undefined
      const jsHeapSizeLimit = perfMemory?.jsHeapSizeLimit

      const hwConcurrency = navigator.hardwareConcurrency || 0
      const deviceMemory = (navigator as Record<string, unknown>)['deviceMemory'] as number | undefined

      const webglInfo = getWebGLInfo()

      const sections: FingerprintSection[] = [
        {
          id: 'browser',
          title: '浏览器信息',
          icon: '\u{1F310}',
          items: [
            { label: 'User-Agent', value: ua.length > 80 ? ua.slice(0, 80) + '...' : ua, risk: 'high', detail: '可被用于追踪浏览器和操作系统信息' },
            { label: '平台', value: platform, risk: 'medium' },
            { label: '硬件线程数', value: String(hwConcurrency), risk: 'low', detail: 'CPU核心数可缩小设备识别范围' },
            { label: '设备内存', value: deviceMemory ? `${deviceMemory} GB` : '不可用', risk: 'medium', detail: '可缩小设备型号范围' },
            { label: '语言', value: language, risk: 'low' },
            { label: '语言列表', value: languages, risk: 'low' },
            { label: 'Cookie', value: cookies, risk: 'medium' },
            { label: 'Do Not Track', value: doNotTrack, risk: 'low', detail: 'DNT请求头可作为追踪信号' },
            { label: '触控点数', value: touchPoints, risk: 'low' },
          ],
        },
        {
          id: 'screen',
          title: '屏幕与显示',
          icon: '\u{1F5A5}',
          items: [
            { label: '屏幕尺寸', value: screenFp, risk: 'medium', detail: '分辨率组合可缩小设备范围' },
            { label: '设备像素比', value: String(window.devicePixelRatio), risk: 'medium' },
            { label: '色彩深度', value: String(screen.colorDepth), risk: 'low' },
          ],
        },
        {
          id: 'canvas',
          title: 'Canvas 指纹',
          icon: '\u{1F3A8}',
          items: [
            { label: 'Canvas 指纹', value: canvasFp, risk: 'high', detail: 'Canvas渲染结果因设备和驱动不同而异，是强追踪信号' },
          ],
        },
        {
          id: 'webgl',
          title: 'WebGL 指纹',
          icon: '\u{1F4E1}',
          items: [
            { label: 'GPU 厂商', value: webgl.vendor, risk: 'high', detail: 'WebGL信息可精确识别显卡型号' },
            { label: 'GPU 渲染器', value: webgl.renderer, risk: 'high', detail: 'GPU渲染字符串是强设备指纹' },
          ],
        },
        {
          id: 'audio',
          title: 'Audio 指纹',
          icon: '\u{1F3B5}',
          items: [
            { label: 'AudioContext 指纹', value: audioFp, risk: 'high', detail: '音频处理管线差异可产生唯一指纹' },
          ],
        },
        {
          id: 'datetime',
          title: '日期时间与时区',
          icon: '\u{1F552}',
          items: [
            { label: '时区', value: timezone, risk: 'medium', detail: '时区可缩小用户地理位置范围' },
            { label: 'UTC偏移', value: timezoneOffset + ' 分钟', risk: 'low' },
          ],
        },
        {
          id: 'storage',
          title: '存储与持久化',
          icon: '\u{1F4BE}',
          items: [
            { label: 'localStorage', value: hasLocalStorage ? `已启用 (${localStorageCount}项)` : '不可用', risk: 'low' },
            { label: 'sessionStorage', value: hasSessionStorage ? `已启用 (${sessionStorageCount}项)` : '不可用', risk: 'low' },
            { label: 'IndexedDB', value: hasIndexedDB ? '已启用' : '不可用', risk: 'low' },
            { label: 'Service Worker', value: hasServiceWorker ? '支持' : '不支持', risk: 'low' },
            { label: 'JS Heap 上限', value: jsHeapSizeLimit ? `${Math.round(jsHeapSizeLimit / 1024 / 1024)} MB` : '不可用', risk: 'low' },
          ],
        },
        {
          id: 'api',
          title: 'Web API 可用性',
          icon: '\u{1F527}',
          items: [
            { label: 'WebGPU', value: hasWebGPU ? '支持' : '不支持', risk: 'low' },
            { label: 'Web Bluetooth', value: hasWebBluetooth ? '支持' : '不支持', risk: 'medium', detail: '可被用于设备识别' },
            { label: 'WebUSB', value: hasWebUSB ? '支持' : '不支持', risk: 'medium', detail: '可被用于设备识别' },
            { label: 'MediaDevices', value: hasWekbit ? '支持' : '不可用', risk: 'medium' },
          ],
        },
      ]

      setSections(sections)
      setScanning(false)
    }, 800)
  }, [])

  useEffect(() => {
    collectFingerprint()
  }, [collectFingerprint])

  const privacyScore = useMemo(() => computePrivacyScore(sections), [sections])

  const allValues = useMemo(() => {
    const result: Record<string, string> = {}
    for (const section of sections) {
      for (const item of section.items) {
        result[item.label] = item.value
      }
    }
    return result
  }, [sections])

  const copyAll = useCallback(async () => {
    const text = Object.entries(allValues)
      .map(([k, v]) => `${k}: ${v}`)
      .join('\n')
    try {
      await navigator.clipboard.writeText(text)
      setCopiedAll(true)
      setTimeout(() => setCopiedAll(false), 2000)
    } catch {
      // fallback
    }
  }, [allValues])

  const expandedCount = expandedSections.size

  return (
    <div style={{
      height: '100%', display: 'flex', flexDirection: 'column',
      background: 'var(--bg-primary, #0a0a1a)', color: 'var(--text-primary, #e0e0e8)',
      fontFamily: 'system-ui, -apple-system, sans-serif', fontSize: 13,
    }}>
      {/* 顶栏 */}
      <div style={{
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        padding: '12px 20px', borderBottom: '1px solid rgba(255,255,255,0.08)',
        background: 'rgba(255,255,255,0.02)', flexShrink: 0,
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <span style={{ fontSize: 20 }}>{'\u{1F50D}'}</span>
          <span style={{ fontWeight: 700, fontSize: 15 }}>浏览器指纹识别与隐私分析</span>
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          <button
            onClick={collectFingerprint}
            disabled={scanning}
            style={{
              padding: '6px 14px', borderRadius: 6, border: 'none',
              background: scanning ? 'rgba(124,108,240,0.3)' : 'var(--accent, #7c6cf0)',
              color: '#fff', fontSize: 12, fontWeight: 600, cursor: scanning ? 'not-allowed' : 'pointer',
              transition: 'background 0.2s',
            }}
          >
            {scanning ? '扫描中...' : '重新扫描'}
          </button>
          <button
            onClick={copyAll}
            style={{
              padding: '6px 14px', borderRadius: 6,
              border: '1px solid rgba(255,255,255,0.15)',
              background: copiedAll ? 'rgba(16,185,129,0.2)' : 'transparent',
              color: copiedAll ? '#10b981' : 'var(--text-secondary, #a0a0c8)',
              fontSize: 12, fontWeight: 600, cursor: 'pointer', transition: 'all 0.2s',
            }}
          >
            {copiedAll ? '已复制' : '复制全部'}
          </button>
        </div>
      </div>

      {/* 评分卡片 */}
      {sections.length > 0 && (
        <div style={{
          display: 'flex', alignItems: 'center', gap: 20, padding: '16px 20px',
          borderBottom: '1px solid rgba(255,255,255,0.08)',
          background: `linear-gradient(135deg, ${privacyScore.color}10, transparent)`,
          flexShrink: 0,
        }}>
          <div style={{
            width: 64, height: 64, borderRadius: '50%',
            border: `3px solid ${privacyScore.color}`,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            flexDirection: 'column', flexShrink: 0,
          }}>
            <span style={{ fontSize: 22, fontWeight: 800, color: privacyScore.color, lineHeight: 1 }}>{privacyScore.grade}</span>
            <span style={{ fontSize: 9, color: 'var(--text-secondary, #a0a0c8)', marginTop: 2 }}>{privacyScore.score}/100</span>
          </div>
          <div>
            <div style={{ fontSize: 14, fontWeight: 600, marginBottom: 4, color: privacyScore.color }}>{privacyScore.label}</div>
            <div style={{ fontSize: 12, color: 'var(--text-secondary, #a0a0c8)' }}>
              已检测 {sections.length} 个类别，{expandedCount} 个展开
            </div>
          </div>
          {/* 风险分布柱 */}
          <div style={{ marginLeft: 'auto', display: 'flex', gap: 6, alignItems: 'center', fontSize: 11 }}>
            <span style={{ color: '#ef4444' }}>
              {'\u25CF'} 高风险: {sections.reduce((a, s) => a + s.items.filter(i => i.risk === 'high').length, 0)}
            </span>
            <span style={{ color: '#f59e0b' }}>
              {'\u25CF'} 中风险: {sections.reduce((a, s) => a + s.items.filter(i => i.risk === 'medium').length, 0)}
            </span>
            <span style={{ color: '#10b981' }}>
              {'\u25CF'} 低风险: {sections.reduce((a, s) => a + s.items.filter(i => i.risk === 'low').length, 0)}
            </span>
          </div>
        </div>
      )}

      {/* 内容区 */}
      <div style={{ flex: 1, overflow: 'auto', padding: '8px 12px' }}>
        {scanning ? (
          <div style={{
            display: 'flex', flexDirection: 'column', alignItems: 'center',
            justifyContent: 'center', height: '100%', gap: 16,
          }}>
            <div style={{
              width: 48, height: 48, border: '3px solid rgba(124,108,240,0.2)',
              borderTopColor: '#7c6cf0', borderRadius: '50%',
              animation: 'spin 1s linear infinite',
            }} />
            <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
            <span style={{ color: 'var(--text-secondary, #a0a0c8)' }}>正在采集浏览器指纹...</span>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            {sections.map(section => {
              const isExpanded = expandedSections.has(section.id)
              return (
                <div key={section.id} style={{
                  border: '1px solid rgba(255,255,255,0.06)',
                  borderRadius: 8, overflow: 'hidden',
                  background: 'rgba(255,255,255,0.02)',
                }}>
                  <button
                    onClick={() => toggleSection(section.id)}
                    style={{
                      width: '100%', display: 'flex', alignItems: 'center',
                      gap: 10, padding: '10px 14px', border: 'none',
                      background: isExpanded ? 'rgba(124,108,240,0.06)' : 'transparent',
                      color: 'var(--text-primary, #e0e0e8)', cursor: 'pointer',
                      fontSize: 13, fontWeight: 600, textAlign: 'left',
                      transition: 'background 0.15s',
                    }}
                  >
                    <span>{section.icon}</span>
                    <span style={{ flex: 1 }}>{section.title}</span>
                    <span style={{
                      fontSize: 11, padding: '2px 8px', borderRadius: 10,
                      background: 'rgba(255,255,255,0.06)', color: 'var(--text-secondary, #a0a0c8)',
                    }}>
                      {section.items.length} 项
                    </span>
                    <span style={{
                      transform: isExpanded ? 'rotate(90deg)' : 'rotate(0)',
                      transition: 'transform 0.15s', fontSize: 10,
                    }}>
                      {'\u25B6'}
                    </span>
                  </button>
                  {isExpanded && (
                    <div style={{ padding: '0 14px 12px' }}>
                      {section.items.map((item, idx) => (
                        <div key={idx} style={{
                          display: 'flex', alignItems: 'flex-start', gap: 10,
                          padding: '8px 0',
                          borderBottom: idx < section.items.length - 1 ? '1px solid rgba(255,255,255,0.04)' : 'none',
                        }}>
                          <span style={{
                            marginTop: 3, width: 6, height: 6, borderRadius: '50%', flexShrink: 0,
                            background: item.risk === 'high' ? '#ef4444' : item.risk === 'medium' ? '#f59e0b' : '#10b981',
                          }} />
                          <div style={{ flex: 1, minWidth: 0 }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 2 }}>
                              <span style={{ fontWeight: 500, color: 'var(--text-primary, #e0e0e8)' }}>{item.label}</span>
                            </div>
                            <div style={{
                              fontSize: 12, color: 'var(--text-secondary, #a0a0c8)',
                              wordBreak: 'break-all', lineHeight: 1.5,
                              fontFamily: item.value.length > 30 ? 'monospace' : 'inherit',
                              fontSize: item.value.length > 30 ? 11 : 12,
                            }}>
                              {item.value}
                            </div>
                            {item.detail && (
                              <div style={{
                                fontSize: 11, color: 'var(--text-tertiary, #6a6a8a)',
                                marginTop: 3, fontStyle: 'italic',
                              }}>
                                {item.detail}
                              </div>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}
