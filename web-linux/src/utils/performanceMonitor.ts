// 性能监控和优化工具
// 用于跟踪组件渲染性能和优化关键路径

interface PerformanceMetric {
  name: string
  duration: number
  timestamp: number
  type: 'render' | 'api' | 'interaction'
}

class PerformanceMonitor {
  private metrics: PerformanceMetric[] = []
  private observers: PerformanceObserver[] = []
  private enabled: boolean = true

  constructor() {
    this.setupPerformanceObserver()
  }

  private setupPerformanceObserver() {
    if (typeof window === 'undefined' || !('PerformanceObserver' in window)) {
      return
    }

    try {
      // 监控长任务
      const longTaskObserver = new PerformanceObserver((list) => {
        for (const entry of list.getEntries()) {
          if (entry.duration > 50) {
            console.warn(`[Performance] Long task detected: ${entry.duration}ms`)
          }
        }
      })
      longTaskObserver.observe({ entryTypes: ['longtask'] })
      this.observers.push(longTaskObserver)
    } catch {
      // 忽略不支持的浏览器
    }
  }

  // 开始计时
  startTimer(name: string): () => void {
    if (!this.enabled) return () => {}
    
    const startTime = performance.now()
    
    return () => {
      const duration = performance.now() - startTime
      this.recordMetric(name, duration, 'render')
    }
  }

  // 记录性能指标
  recordMetric(name: string, duration: number, type: PerformanceMetric['type']) {
    if (!this.enabled) return

    this.metrics.push({
      name,
      duration,
      timestamp: Date.now(),
      type
    })

    // 保持最近100条记录
    if (this.metrics.length > 100) {
      this.metrics.shift()
    }
  }

  // 获取性能统计
  getStats(): {
    avgRenderTime: number
    slowRenders: number
    apiCalls: number
  } {
    const renderMetrics = this.metrics.filter(m => m.type === 'render')
    const avgRenderTime = renderMetrics.length > 0
      ? renderMetrics.reduce((sum, m) => sum + m.duration, 0) / renderMetrics.length
      : 0
    
    const slowRenders = renderMetrics.filter(m => m.duration > 16).length
    const apiCalls = this.metrics.filter(m => m.type === 'api').length

    return {
      avgRenderTime,
      slowRenders,
      apiCalls
    }
  }

  // 清空记录
  clear() {
    this.metrics = []
  }

  // 启用/禁用监控
  setEnabled(enabled: boolean) {
    this.enabled = enabled
  }

  // 销毁
  destroy() {
    this.observers.forEach(observer => observer.disconnect())
    this.observers = []
  }
}

// 单例实例
export const perfMonitor = new PerformanceMonitor()

// React性能优化辅助函数
export function measureRenderTime(componentName: string) {
  return perfMonitor.startTimer(`render:${componentName}`)
}

// API调用性能跟踪
export function trackApiCall(apiName: string, duration: number) {
  perfMonitor.recordMetric(`api:${apiName}`, duration, 'api')
}

// 交互性能跟踪
export function trackInteraction(interactionName: string, duration: number) {
  perfMonitor.recordMetric(`interaction:${interactionName}`, duration, 'interaction')
}

export default perfMonitor