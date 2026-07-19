import { useState, useEffect, useCallback } from 'react'
import { useStore } from '../store'

/**
 * SystemDiagnosticsPro - 系统诊断增强版
 * 提供全面的系统健康检查和性能分析
 */

interface DiagnosticResult {
  category: string
  name: string
  status: 'pass' | 'warn' | 'fail' | 'info'
  message: string
  value?: string | number
  recommendation?: string
}

interface SystemInfo {
  platform: string
  userAgent: string
  language: string
  cookiesEnabled: boolean
  doNotTrack: string | null
  hardwareConcurrency: number
  deviceMemory: number | undefined
  maxTouchPoints: number
  colorDepth: number
  pixelDepth: number
  screenWidth: number
  screenHeight: number
  innerWidth: number
  innerHeight: number
  devicePixelRatio: number
  connection: {
    effectiveType: string
    downlink: number
    rtt: number
    saveData: boolean
  } | null
}

export default function SystemDiagnosticsPro() {
  const theme = useStore((s) => s.theme)
  const [diagnostics, setDiagnostics] = useState<DiagnosticResult[]>([])
  const [systemInfo, setSystemInfo] = useState<SystemInfo | null>(null)
  const [isRunning, setIsRunning] = useState(false)
  const [progress, setProgress] = useState(0)

  const gatherSystemInfo = useCallback((): SystemInfo => {
    const nav = navigator as Navigator & {
      deviceMemory?: number
      connection?: {
        effectiveType: string
        downlink: number
        rtt: number
        saveData: boolean
      }
    }

    return {
      platform: navigator.platform,
      userAgent: navigator.userAgent,
      language: navigator.language,
      cookiesEnabled: navigator.cookieEnabled,
      doNotTrack: navigator.doNotTrack,
      hardwareConcurrency: navigator.hardwareConcurrency || 1,
      deviceMemory: nav.deviceMemory,
      maxTouchPoints: navigator.maxTouchPoints || 0,
      colorDepth: screen.colorDepth,
      pixelDepth: screen.pixelDepth,
      screenWidth: screen.width,
      screenHeight: screen.height,
      innerWidth: window.innerWidth,
      innerHeight: window.innerHeight,
      devicePixelRatio: window.devicePixelRatio,
      connection: nav.connection ? {
        effectiveType: nav.connection.effectiveType,
        downlink: nav.connection.downlink,
        rtt: nav.connection.rtt,
        saveData: nav.connection.saveData
      } : null
    }
  }, [])

  const runDiagnostics = useCallback(async () => {
    setIsRunning(true)
    setDiagnostics([])
    setProgress(0)

    const results: DiagnosticResult[] = []
    const info = gatherSystemInfo()
    setSystemInfo(info)

    // 1. 浏览器兼容性检查
    results.push({
      category: '浏览器',
      name: 'Cookie 支持',
      status: info.cookiesEnabled ? 'pass' : 'fail',
      message: info.cookiesEnabled ? 'Cookies 已启用' : 'Cookies 被禁用',
      value: info.cookiesEnabled ? '已启用' : '已禁用',
      recommendation: info.cookiesEnabled ? undefined : '建议启用 Cookies 以获得最佳体验'
    })
    setProgress(10)

    // 2. 硬件检查
    results.push({
      category: '硬件',
      name: 'CPU 核心',
      status: info.hardwareConcurrency >= 4 ? 'pass' : info.hardwareConcurrency >= 2 ? 'warn' : 'fail',
      message: `检测到 ${info.hardwareConcurrency} 个逻辑核心`,
      value: info.hardwareConcurrency,
      recommendation: info.hardwareConcurrency < 2 ? '建议使用至少双核处理器' : undefined
    })
    setProgress(20)

    // 3. 内存检查
    if (info.deviceMemory) {
      results.push({
        category: '硬件',
        name: '设备内存',
        status: info.deviceMemory >= 8 ? 'pass' : info.deviceMemory >= 4 ? 'warn' : 'fail',
        message: `检测到约 ${info.deviceMemory}GB 内存`,
        value: `${info.deviceMemory}GB`,
        recommendation: info.deviceMemory < 4 ? '建议使用至少 8GB 内存以获得流畅体验' : undefined
      })
    } else {
      results.push({
        category: '硬件',
        name: '设备内存',
        status: 'info',
        message: '无法检测设备内存'
      })
    }
    setProgress(30)

    // 4. 显示检查
    results.push({
      category: '显示',
      name: '屏幕分辨率',
      status: 'info',
      message: `${info.screenWidth}x${info.screenHeight} 像素`,
      value: `${info.screenWidth}x${info.screenHeight}`
    })

    results.push({
      category: '显示',
      name: '设备像素比',
      status: 'info',
      message: `DPR: ${info.devicePixelRatio}`,
      value: info.devicePixelRatio
    })

    results.push({
      category: '显示',
      name: '色彩深度',
      status: info.colorDepth >= 24 ? 'pass' : 'warn',
      message: `${info.colorDepth} 位色深`,
      value: `${info.colorDepth}bit`,
      recommendation: info.colorDepth < 24 ? '建议使用真彩色显示' : undefined
    })
    setProgress(40)

    // 5. 网络检查
    if (info.connection) {
      results.push({
        category: '网络',
        name: '连接类型',
        status: info.connection.effectiveType === '4g' ? 'pass' : 'warn',
        message: `当前连接类型: ${info.connection.effectiveType}`,
        value: info.connection.effectiveType,
        recommendation: info.connection.effectiveType !== '4g' ? '建议使用高速网络连接' : undefined
      })

      results.push({
        category: '网络',
        name: '下行速度',
        status: info.connection.downlink >= 10 ? 'pass' : info.connection.downlink >= 5 ? 'warn' : 'fail',
        message: `估计下行速度: ${info.connection.downlink}Mbps`,
        value: `${info.connection.downlink}Mbps`
      })

      results.push({
        category: '网络',
        name: '往返时间',
        status: info.connection.rtt <= 100 ? 'pass' : info.connection.rtt <= 300 ? 'warn' : 'fail',
        message: `估计 RTT: ${info.connection.rtt}ms`,
        value: `${info.connection.rtt}ms`
      })
    } else {
      results.push({
        category: '网络',
        name: '网络信息',
        status: 'info',
        message: '无法获取网络连接信息'
      })
    }
    setProgress(50)

    // 6. 存储检查
    try {
      if (navigator.storage && navigator.storage.estimate) {
        const estimate = await navigator.storage.estimate()
        const usedMB = Math.round((estimate.usage || 0) / (1024 * 1024))
        const quotaMB = Math.round((estimate.quota || 0) / (1024 * 1024))
        const usagePercent = quotaMB > 0 ? Math.round((usedMB / quotaMB) * 100) : 0

        results.push({
          category: '存储',
          name: '存储配额',
          status: usagePercent < 80 ? 'pass' : usagePercent < 95 ? 'warn' : 'fail',
          message: `已使用 ${usedMB}MB / ${quotaMB}MB (${usagePercent}%)`,
          value: `${usedMB}MB / ${quotaMB}MB`,
          recommendation: usagePercent > 80 ? '建议清理部分数据释放存储空间' : undefined
        })
      }
    } catch {
      results.push({
        category: '存储',
        name: '存储检查',
        status: 'warn',
        message: '无法获取存储信息'
      })
    }
    setProgress(60)

    // 7. WebGL 检查
    try {
      const canvas = document.createElement('canvas')
      const gl = canvas.getContext('webgl') || canvas.getContext('experimental-webgl')
      if (gl) {
        const debugInfo = (gl as WebGLRenderingContext).getExtension('WEBGL_debug_renderer_info')
        if (debugInfo) {
          const renderer = (gl as WebGLRenderingContext).getParameter(debugInfo.UNMASKED_RENDERER_WEBGL)
          results.push({
            category: '图形',
            name: 'WebGL 渲染器',
            status: 'pass',
            message: `GPU: ${renderer}`,
            value: renderer
          })
        }
      } else {
        results.push({
          category: '图形',
          name: 'WebGL',
          status: 'fail',
          message: 'WebGL 不可用',
          recommendation: '请启用 WebGL 支持'
        })
      }
    } catch {
      results.push({
        category: '图形',
        name: 'WebGL',
        status: 'warn',
        message: '无法检测 WebGL'
      })
    }
    setProgress(70)

    // 8. 性能检查
    try {
      const start = performance.now()
      for (let i = 0; i < 1000000; i++) {
        Math.sqrt(i)
      }
      const duration = performance.now() - start
      
      results.push({
        category: '性能',
        name: 'CPU 性能测试',
        status: duration < 50 ? 'pass' : duration < 100 ? 'warn' : 'fail',
        message: `计算测试耗时 ${duration.toFixed(2)}ms`,
        value: `${duration.toFixed(2)}ms`,
        recommendation: duration > 100 ? '系统性能可能影响使用体验' : undefined
      })
    } catch {
      results.push({
        category: '性能',
        name: '性能测试',
        status: 'info',
        message: '无法执行性能测试'
      })
    }
    setProgress(80)

    // 9. 本地存储检查
    try {
      const testKey = '__weblinuxos_test__'
      localStorage.setItem(testKey, 'test')
      localStorage.removeItem(testKey)
      results.push({
        category: '存储',
        name: 'localStorage',
        status: 'pass',
        message: 'localStorage 可用'
      })
    } catch {
      results.push({
        category: '存储',
        name: 'localStorage',
        status: 'fail',
        message: 'localStorage 不可用或已满',
        recommendation: '请清理浏览器缓存或检查存储配额'
      })
    }
    setProgress(90)

    // 10. 触控支持
    results.push({
      category: '输入',
      name: '触控支持',
      status: 'info',
      message: info.maxTouchPoints > 0 ? `支持触控 (${info.maxTouchPoints} 点)` : '不支持触控',
      value: info.maxTouchPoints > 0 ? `${info.maxTouchPoints} 点触控` : '无'
    })
    setProgress(100)

    setDiagnostics(results)
    setIsRunning(false)
  }, [gatherSystemInfo])

  useEffect(() => {
    runDiagnostics()
  }, [runDiagnostics])

  const getStatusColor = (status: DiagnosticResult['status']) => {
    switch (status) {
      case 'pass': return theme === 'light' ? '#10b981' : '#34d399'
      case 'warn': return theme === 'light' ? '#f59e0b' : '#fbbf24'
      case 'fail': return theme === 'light' ? '#ef4444' : '#f87171'
      default: return theme === 'light' ? '#6b7280' : '#9ca3af'
    }
  }

  const getStatusIcon = (status: DiagnosticResult['status']) => {
    switch (status) {
      case 'pass': return '✓'
      case 'warn': return '!'
      case 'fail': return '✗'
      default: return 'i'
    }
  }

  const groupedDiagnostics = diagnostics.reduce((acc, d) => {
    if (!acc[d.category]) acc[d.category] = []
    acc[d.category].push(d)
    return acc
  }, {} as Record<string, DiagnosticResult[]>)

  const passCount = diagnostics.filter(d => d.status === 'pass').length
  const warnCount = diagnostics.filter(d => d.status === 'warn').length
  const failCount = diagnostics.filter(d => d.status === 'fail').length

  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      height: '100%',
      background: theme === 'light' ? '#f9fafb' : '#0f0f1a',
      color: theme === 'light' ? '#1f2937' : '#e5e7eb',
      fontFamily: '"Inter", "Noto Sans SC", sans-serif',
      fontSize: 13
    }}>
      {/* 头部 */}
      <div style={{
        padding: '16px 20px',
        borderBottom: `1px solid ${theme === 'light' ? '#e5e7eb' : '#1f2937'}`,
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center'
      }}>
        <div>
          <h2 style={{ margin: 0, fontSize: 18, fontWeight: 600 }}>系统诊断</h2>
          <p style={{ margin: '4px 0 0', fontSize: 12, color: theme === 'light' ? '#6b7280' : '#9ca3af' }}>
            全面的系统健康检查和性能分析
          </p>
        </div>
        <button
          onClick={runDiagnostics}
          disabled={isRunning}
          style={{
            padding: '8px 20px',
            background: isRunning ? '#6b7280' : '#3b82f6',
            color: 'white',
            border: 'none',
            borderRadius: 6,
            cursor: isRunning ? 'not-allowed' : 'pointer',
            fontWeight: 500,
            fontSize: 13
          }}
        >
          {isRunning ? '诊断中...' : '重新诊断'}
        </button>
      </div>

      {/* 进度条 */}
      {isRunning && (
        <div style={{ padding: '0 20px', marginTop: 12 }}>
          <div style={{
            height: 4,
            background: theme === 'light' ? '#e5e7eb' : '#1f2937',
            borderRadius: 2,
            overflow: 'hidden'
          }}>
            <div style={{
              width: `${progress}%`,
              height: '100%',
              background: 'linear-gradient(90deg, #3b82f6, #8b5cf6)',
              transition: 'width 0.3s ease'
            }} />
          </div>
        </div>
      )}

      {/* 统计摘要 */}
      {!isRunning && diagnostics.length > 0 && (
        <div style={{
          display: 'flex',
          gap: 16,
          padding: '12px 20px',
          borderBottom: `1px solid ${theme === 'light' ? '#e5e7eb' : '#1f2937'}`
        }}>
          <div style={{
            padding: '12px 16px',
            background: theme === 'light' ? '#ecfdf5' : '#064e3b',
            borderRadius: 8,
            flex: 1,
            textAlign: 'center'
          }}>
            <div style={{ fontSize: 24, fontWeight: 700, color: getStatusColor('pass') }}>{passCount}</div>
            <div style={{ fontSize: 11, color: theme === 'light' ? '#6b7280' : '#9ca3af' }}>通过</div>
          </div>
          <div style={{
            padding: '12px 16px',
            background: theme === 'light' ? '#fffbeb' : '#78350f',
            borderRadius: 8,
            flex: 1,
            textAlign: 'center'
          }}>
            <div style={{ fontSize: 24, fontWeight: 700, color: getStatusColor('warn') }}>{warnCount}</div>
            <div style={{ fontSize: 11, color: theme === 'light' ? '#6b7280' : '#9ca3af' }}>警告</div>
          </div>
          <div style={{
            padding: '12px 16px',
            background: theme === 'light' ? '#fef2f2' : '#7f1d1d',
            borderRadius: 8,
            flex: 1,
            textAlign: 'center'
          }}>
            <div style={{ fontSize: 24, fontWeight: 700, color: getStatusColor('fail') }}>{failCount}</div>
            <div style={{ fontSize: 11, color: theme === 'light' ? '#6b7280' : '#9ca3af' }}>失败</div>
          </div>
        </div>
      )}

      {/* 诊断结果 */}
      <div style={{ flex: 1, overflow: 'auto', padding: '12px 20px' }}>
        {Object.entries(groupedDiagnostics).map(([category, items]) => (
          <div key={category} style={{ marginBottom: 16 }}>
            <h3 style={{
              margin: '0 0 8px',
              fontSize: 14,
              fontWeight: 600,
              color: theme === 'light' ? '#374151' : '#d1d5db',
              paddingBottom: 6,
              borderBottom: `1px solid ${theme === 'light' ? '#e5e7eb' : '#1f2937'}`
            }}>
              {category}
            </h3>
            {items.map((item, i) => (
              <div key={i} style={{
                display: 'flex',
                alignItems: 'flex-start',
                padding: '10px 12px',
                background: theme === 'light' ? '#ffffff' : '#1a1a2e',
                borderRadius: 6,
                marginBottom: 6,
                gap: 12
              }}>
                <div style={{
                  width: 24,
                  height: 24,
                  borderRadius: '50%',
                  background: getStatusColor(item.status),
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: 'white',
                  fontSize: 12,
                  fontWeight: 700,
                  flexShrink: 0
                }}>
                  {getStatusIcon(item.status)}
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontWeight: 500, marginBottom: 2 }}>{item.name}</div>
                  <div style={{ fontSize: 12, color: theme === 'light' ? '#6b7280' : '#9ca3af' }}>
                    {item.message}
                  </div>
                  {item.recommendation && (
                    <div style={{
                      marginTop: 6,
                      padding: '6px 10px',
                      background: theme === 'light' ? '#fef3c7' : '#78350f',
                      borderRadius: 4,
                      fontSize: 11,
                      color: theme === 'light' ? '#92400e' : '#fcd34d'
                    }}>
                      建议: {item.recommendation}
                    </div>
                  )}
                </div>
                {item.value && (
                  <div style={{
                    padding: '4px 10px',
                    background: theme === 'light' ? '#f3f4f6' : '#1f2937',
                    borderRadius: 4,
                    fontSize: 12,
                    fontFamily: '"JetBrains Mono", monospace'
                  }}>
                    {item.value}
                  </div>
                )}
              </div>
            ))}
          </div>
        ))}
      </div>

      {/* 系统信息摘要 */}
      {systemInfo && (
        <div style={{
          padding: '12px 20px',
          borderTop: `1px solid ${theme === 'light' ? '#e5e7eb' : '#1f2937'}`,
          fontSize: 11,
          color: theme === 'light' ? '#6b7280' : '#9ca3af',
          fontFamily: '"JetBrains Mono", monospace'
        }}>
          <div style={{ display: 'flex', gap: 24, flexWrap: 'wrap' }}>
            <span>平台: {systemInfo.platform}</span>
            <span>语言: {systemInfo.language}</span>
            <span>窗口: {systemInfo.innerWidth}x{systemInfo.innerHeight}</span>
            <span>DPR: {systemInfo.devicePixelRatio}x</span>
          </div>
        </div>
      )}
    </div>
  )
}