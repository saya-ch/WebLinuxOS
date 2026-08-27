/**
 * 浏览器信息与系统工具函数库
 * 从 About.tsx 提取并完善，提供可测试的纯函数
 */

// ============ UA 解析 ============

export interface UAInfo {
  browser: string
  version: string
  engine: string
  os: string
}

export function parseUA(ua?: string): UAInfo {
  const raw = ua || (typeof navigator !== 'undefined' ? navigator.userAgent : '')
  let browser = '未知'
  let version = ''
  let engine = '未知'
  let os = '未知'

  if (raw.includes('Firefox/')) {
    browser = 'Firefox'
    version = raw.split('Firefox/')[1]?.split(' ')[0] || ''
    engine = 'Gecko'
  } else if (raw.includes('Edg/')) {
    browser = 'Edge'
    version = raw.split('Edg/')[1]?.split(' ')[0] || ''
    engine = 'Blink'
  } else if (raw.includes('OPR/') || raw.includes('Opera/')) {
    browser = 'Opera'
    version = raw.split('OPR/')[1]?.split(' ')[0] || ''
    engine = 'Blink'
  } else if (raw.includes('Chrome/')) {
    browser = 'Chrome'
    version = raw.split('Chrome/')[1]?.split(' ')[0] || ''
    engine = 'Blink'
  } else if (raw.includes('Safari/') && raw.includes('Version/')) {
    browser = 'Safari'
    version = raw.split('Version/')[1]?.split(' ')[0] || ''
    engine = 'WebKit'
  }

  if (raw.includes('Windows NT 10')) os = 'Windows 10/11'
  else if (raw.includes('Windows NT')) os = 'Windows'
  else if (raw.includes('Mac OS X')) {
    const m = raw.match(/Mac OS X (\d+[._]\d+[._]?\d*)/)
    os = m ? `macOS ${m[1].replace(/_/g, '.')}` : 'macOS'
  } else if (raw.includes('Android')) {
    const m = raw.match(/Android (\d+\.?\d*)/)
    os = m ? `Android ${m[1]}` : 'Android'
  } else if (raw.includes('iPhone') || raw.includes('iPad')) {
    const m = raw.match(/OS (\d+[._]\d+)/)
    os = m ? `iOS ${m[1].replace(/_/g, '.')}` : 'iOS'
  } else if (raw.includes('Linux')) os = 'Linux'
  else if (raw.includes('CrOS')) os = 'Chrome OS'

  return { browser, version, engine, os }
}

// ============ 页面加载时间 ============

export function getLoadTime(): string {
  try {
    // 优先使用 PerformanceNavigationTiming API
    if (typeof performance !== 'undefined' && performance.getEntriesByType) {
      const nav = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming | undefined
      if (nav && nav.loadEventEnd > 0) {
        return `${Math.round(nav.loadEventEnd)} ms`
      }
    }
    // 回退到已弃用的 performance.timing
    const timing = (performance as unknown as Record<string, unknown>).timing as {
      loadEventEnd?: number
      navigationStart?: number
    } | undefined
    if (timing && timing.loadEventEnd && timing.navigationStart && timing.loadEventEnd > 0) {
      const loadTime = timing.loadEventEnd - timing.navigationStart
      return `${loadTime} ms`
    }
  } catch { /* ignore */ }
  return '加载中...'
}

// ============ localStorage 用量估算 ============

export function estimateLocalStorageUsage(): string {
  try {
    let total = 0
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i)
      if (key) {
        total += key.length + (localStorage.getItem(key)?.length || 0)
      }
    }
    // UTF-16 每个 char 2 bytes
    const bytes = total * 2
    if (bytes < 1024) return `${bytes} B`
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
    return `${(bytes / (1024 * 1024)).toFixed(2)} MB`
  } catch { /* ignore */ }
  return '未知'
}

// ============ 文件节点计数 ============

export function countFileNodes(nodes: { children?: any[] }[]): number {
  let count = 0
  for (const n of nodes) {
    count++
    if (n.children) count += countFileNodes(n.children)
  }
  return count
}

// ============ 运行时间格式化 ============

export function formatUptime(seconds: number): string {
  const h = Math.floor(seconds / 3600)
  const m = Math.floor((seconds % 3600) / 60)
  const s = seconds % 60
  return `${h}h ${m}m ${s}s`
}

// ============ GPU 信息 ============

export function getGPUInfo(): string {
  try {
    const canvas = document.createElement('canvas')
    const gl = canvas.getContext('webgl') || canvas.getContext('experimental-webgl')
    if (!gl) return '不可用'
    const debugInfo = (gl as WebGLRenderingContext).getExtension('WEBGL_debug_renderer_info')
    if (debugInfo) {
      return (gl as WebGLRenderingContext).getParameter(debugInfo.UNMASKED_RENDERER_WEBGL) || '未知'
    }
    return 'WebGL 支持'
  } catch {
    return '不可用'
  }
}

// ============ 性能内存估算 ============

export function getPerformanceMemory(): string {
  try {
    const perf = performance as unknown as Record<string, unknown>
    const memory = perf.memory as { usedJSHeapSize?: number; jsHeapSizeLimit?: number } | undefined
    if (memory && memory.usedJSHeapSize && memory.jsHeapSizeLimit) {
      const used = (memory.usedJSHeapSize / (1024 * 1024)).toFixed(1)
      const total = (memory.jsHeapSizeLimit / (1024 * 1024)).toFixed(1)
      return `${used} / ${total} MB`
    }
  } catch { /* ignore */ }
  return '不可用'
}
