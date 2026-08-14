import { useState, useCallback, useRef, useEffect } from 'react'
import {
  Gauge,
  Play,
  Square,
  History,
  Clock,
  Zap,
  CheckCircle,
  XCircle,
  Timer,
  Activity,
  BarChart3,
  FileText,
  Trash2,
  Download,
  Send,
  Globe,
  Server,
} from 'lucide-react'

interface RequestResult {
  id: number
  status: number
  duration: number
  success: boolean
  error?: string
  timestamp: number
}

interface TestConfig {
  url: string
  method: string
  concurrency: number
  interval: number
  duration: number
  headers: Record<string, string>
  body: string
}

interface TestStats {
  totalRequests: number
  successCount: number
  failCount: number
  totalDuration: number
  avgDuration: number
  minDuration: number
  maxDuration: number
  p50Duration: number
  p95Duration: number
  p99Duration: number
  tps: number
  successRate: number
  statusCodes: Record<number, number>
  performanceScore: number
}

interface HistoryRecord {
  id: string
  config: TestConfig
  stats: TestStats
  timestamp: number
}

const METHODS = ['GET', 'POST', 'PUT', 'DELETE', 'PATCH']

const DEFAULT_CONFIG: TestConfig = {
  url: 'https://api.github.com/users/github',
  method: 'GET',
  concurrency: 5,
  interval: 200,
  duration: 5,
  headers: { 'Accept': 'application/json' },
  body: '',
}

const SAMPLE_APIS = [
  {
    name: 'GitHub API',
    url: 'https://api.github.com/users/github',
    method: 'GET',
    headers: { 'Accept': 'application/json' },
    body: '',
  },
  {
    name: 'Open-Meteo 天气',
    url: 'https://api.open-meteo.com/v1/forecast?latitude=39.9&longitude=116.4&current=temperature_2m',
    method: 'GET',
    headers: {},
    body: '',
  },
  {
    name: 'JSON 占位测试',
    url: 'https://jsonplaceholder.typicode.com/posts/1',
    method: 'GET',
    headers: {},
    body: '',
  },
]

function calculatePercentile(sorted: number[], p: number): number {
  if (sorted.length === 0) return 0
  const idx = (p / 100) * (sorted.length - 1)
  const lower = Math.floor(idx)
  const upper = Math.ceil(idx)
  if (lower === upper) return sorted[lower]
  return sorted[lower] + (sorted[upper] - sorted[lower]) * (idx - lower)
}

function calculatePerformanceScore(stats: Omit<TestStats, 'performanceScore'>): number {
  let score = 100
  if (stats.successRate < 100) score -= (100 - stats.successRate) * 0.5
  if (stats.avgDuration > 1000) score -= 20
  if (stats.avgDuration > 500) score -= 10
  if (stats.avgDuration > 200) score -= 5
  if (stats.p95Duration > 2000) score -= 15
  if (stats.p99Duration > 3000) score -= 10
  if (stats.tps < 1) score -= 10
  return Math.max(0, Math.min(100, Math.round(score)))
}

export default function APILoadTester() {
  const [config, setConfig] = useState<TestConfig>(DEFAULT_CONFIG)
  const [isRunning, setIsRunning] = useState(false)
  const [results, setResults] = useState<RequestResult[]>([])
  const [currentStats, setCurrentStats] = useState<TestStats | null>(null)
  const [history, setHistory] = useState<HistoryRecord[]>([])
  const [elapsed, setElapsed] = useState(0)
  const [showHistory, setShowHistory] = useState(false)
  const abortRef = useRef<AbortController | null>(null)
  const resultsRef = useRef<RequestResult[]>([])
  const counterRef = useRef(0)

  useEffect(() => {
    const saved = localStorage.getItem('api-load-test-history')
    if (saved) {
      try {
        setHistory(JSON.parse(saved))
      } catch {}
    }
  }, [])

  const saveHistory = useCallback((record: HistoryRecord) => {
    const updated = [record, ...history].slice(0, 20)
    setHistory(updated)
    try {
      localStorage.setItem('api-load-test-history', JSON.stringify(updated))
    } catch {}
  }, [history])

  const clearHistory = useCallback(() => {
    setHistory([])
    try {
      localStorage.removeItem('api-load-test-history')
    } catch {}
  }, [])

  const updateConfig = useCallback((key: keyof TestConfig, value: unknown) => {
    setConfig((prev) => ({ ...prev, [key]: value }))
  }, [])

  const updateHeader = useCallback((key: string, value: string) => {
    setConfig((prev) => {
      const newHeaders = { ...prev.headers }
      if (value) newHeaders[key] = value
      else delete newHeaders[key]
      return { ...prev, headers: newHeaders }
    })
  }, [])

  const addHeader = useCallback(() => {
    setConfig((prev) => ({
      ...prev,
      headers: { ...prev.headers, 'X-Custom': 'value' },
    }))
  }, [])

  const sendRequest = useCallback(
    async (id: number, signal: AbortSignal): Promise<RequestResult> => {
      const start = performance.now()
      try {
        const init: RequestInit = {
          method: config.method,
          headers: config.headers,
          signal,
        }
        if (config.method !== 'GET' && config.body) {
          init.body = config.body
        }
        const response = await fetch(config.url, init)
        const duration = performance.now() - start
        return {
          id,
          status: response.status,
          duration,
          success: response.ok,
          timestamp: Date.now(),
        }
      } catch (e) {
        const duration = performance.now() - start
        const errMsg = e instanceof Error ? e.message : '未知错误'
        return {
          id,
          status: 0,
          duration,
          success: false,
          error: errMsg,
          timestamp: Date.now(),
        }
      }
    },
    [config]
  )

  const runTest = useCallback(async () => {
    if (isRunning) return
    setIsRunning(true)
    setResults([])
    resultsRef.current = []
    counterRef.current = 0
    setElapsed(0)
    setCurrentStats(null)

    const controller = new AbortController()
    abortRef.current = controller

    const startTime = performance.now()
    const { concurrency, interval, duration } = config
    const durationMs = duration * 1000

    void new Map<number, Promise<void>>()
    let batchTimer: ReturnType<typeof setTimeout>

    const runBatch = () => {
      const endTime = performance.now()
      if (endTime - startTime >= durationMs) return

      const batchSize = Math.min(concurrency, concurrency)
      const batchPromises: Promise<void>[] = []

      for (let i = 0; i < batchSize; i++) {
        counterRef.current++
        const id = counterRef.current
        const promise = sendRequest(id, controller.signal).then((result) => {
          resultsRef.current.push(result)
          setResults([...resultsRef.current])
        })
        batchPromises.push(promise)
      }

      Promise.all(batchPromises).then(() => {
        if (performance.now() - startTime < durationMs) {
          batchTimer = setTimeout(runBatch, interval)
        }
      })
    }

    runBatch()

    const progressTimer = setInterval(() => {
      const elapsedSec = (performance.now() - startTime) / 1000
      setElapsed(elapsedSec)
      if (elapsedSec >= durationMs / 1000) {
        clearInterval(progressTimer)
      }
    }, 50)

    return new Promise<void>((resolve) => {
      setTimeout(() => {
        clearInterval(progressTimer)
        clearTimeout(batchTimer)
        controller.abort()

        const allResults = resultsRef.current
        const durations = allResults.map((r) => r.duration).sort((a, b) => a - b)
        const totalDuration = (performance.now() - startTime) / 1000

        const successCount = allResults.filter((r) => r.success).length
        const failCount = allResults.length - successCount

        const baseStats: Omit<TestStats, 'performanceScore'> = {
          totalRequests: allResults.length,
          successCount,
          failCount,
          totalDuration,
          avgDuration: durations.length ? durations.reduce((a, b) => a + b, 0) / durations.length : 0,
          minDuration: durations.length ? durations[0] : 0,
          maxDuration: durations.length ? durations[durations.length - 1] : 0,
          p50Duration: calculatePercentile(durations, 50),
          p95Duration: calculatePercentile(durations, 95),
          p99Duration: calculatePercentile(durations, 99),
          tps: totalDuration > 0 ? allResults.length / totalDuration : 0,
          successRate: allResults.length > 0 ? (successCount / allResults.length) * 100 : 0,
          statusCodes: allResults.reduce((acc, r) => {
            const code = r.status || 0
            acc[code] = (acc[code] || 0) + 1
            return acc
          }, {} as Record<number, number>),
        }

        const finalStats: TestStats = {
          ...baseStats,
          performanceScore: calculatePerformanceScore(baseStats),
        }

        setCurrentStats(finalStats)
        setIsRunning(false)

        if (allResults.length > 0) {
          saveHistory({
            id: Date.now().toString(),
            config,
            stats: finalStats,
            timestamp: Date.now(),
          })
        }

        resolve()
      }, durationMs)
    })
  }, [isRunning, config, sendRequest, saveHistory])

  const stopTest = useCallback(() => {
    abortRef.current?.abort()
    setIsRunning(false)
  }, [])

  // copyToClipboard helper removed as unused

  const exportResults = useCallback(() => {
    if (!currentStats) return
    const data = {
      config,
      stats: currentStats,
      results: results.map((r) => ({
        id: r.id,
        status: r.status,
        duration: Math.round(r.duration),
        success: r.success,
        timestamp: r.timestamp,
      })),
      exportedAt: new Date().toISOString(),
    }
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `load-test-${Date.now()}.json`
    a.click()
    URL.revokeObjectURL(url)
  }, [config, currentStats, results])

  const loadPreset = useCallback((api: typeof SAMPLE_APIS[number]) => {
    setConfig((prev) => ({
      ...prev,
      url: api.url,
      method: api.method,
      headers: api.headers as Record<string, string>,
      body: api.body,
    }))
  }, [])

  const progress = isRunning && config.duration > 0 ? Math.min((elapsed / config.duration) * 100, 100) : 0

  return (
    <div className="flex flex-col h-full bg-gradient-to-br from-slate-950 via-gray-900 to-slate-900 text-gray-100 overflow-hidden">
      <div className="shrink-0 px-6 py-4 border-b border-white/5 bg-white/[0.02] backdrop-blur-xl">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-orange-500 to-red-600 flex items-center justify-center shadow-lg shadow-orange-500/20">
              <Gauge className="w-5 h-5 text-white" />
            </div>
            <div>
              <h1 className="text-xl font-bold bg-gradient-to-r from-orange-300 to-red-300 bg-clip-text text-transparent">
                API 负载测试工具
              </h1>
              <p className="text-xs text-gray-400">并发测试 · 实时统计 · 性能分析</p>
            </div>
          </div>
          <button
            onClick={() => setShowHistory(!showHistory)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-xs text-gray-300 transition-colors"
          >
            <History className="w-3.5 h-3.5" />
            历史 ({history.length})
          </button>
        </div>

        <div className="mt-4 rounded-2xl bg-white/[0.03] border border-white/10 p-4 backdrop-blur-xl">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
            <div className="lg:col-span-2">
              <label className="text-xs text-gray-400 mb-1.5 flex items-center gap-1.5">
                <Globe className="w-3 h-3" />
                请求URL
              </label>
              <input
                type="text"
                value={config.url}
                onChange={(e) => updateConfig('url', e.target.value)}
                placeholder="https://api.example.com/endpoint"
                className="w-full px-3 py-2 rounded-lg bg-black/30 border border-white/10 text-sm text-gray-200 placeholder-gray-500 focus:outline-none focus:border-orange-500/50 font-mono"
              />
            </div>

            <div>
              <label className="text-xs text-gray-400 mb-1.5 flex items-center gap-1.5">
                <Send className="w-3 h-3" />
                请求方法
              </label>
              <select
                value={config.method}
                onChange={(e) => updateConfig('method', e.target.value)}
                className="w-full px-3 py-2 rounded-lg bg-black/30 border border-white/10 text-sm text-gray-200 focus:outline-none focus:border-orange-500/50"
              >
                {METHODS.map((m) => (
                  <option key={m} value={m}>
                    {m}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="text-xs text-gray-400 mb-1.5 flex items-center gap-1.5">
                <Server className="w-3 h-3" />
                并发数: {config.concurrency}
              </label>
              <input
                type="range"
                min={1}
                max={50}
                value={config.concurrency}
                onChange={(e) => updateConfig('concurrency', parseInt(e.target.value))}
                className="w-full accent-orange-500"
              />
            </div>

            <div>
              <label className="text-xs text-gray-400 mb-1.5 flex items-center gap-1.5">
                <Clock className="w-3 h-3" />
                间隔(ms): {config.interval}
              </label>
              <input
                type="range"
                min={0}
                max={2000}
                step={50}
                value={config.interval}
                onChange={(e) => updateConfig('interval', parseInt(e.target.value))}
                className="w-full accent-orange-500"
              />
            </div>

            <div>
              <label className="text-xs text-gray-400 mb-1.5 flex items-center gap-1.5">
                <Timer className="w-3 h-3" />
                持续时间(s): {config.duration}
              </label>
              <input
                type="range"
                min={1}
                max={60}
                value={config.duration}
                onChange={(e) => updateConfig('duration', parseInt(e.target.value))}
                className="w-full accent-orange-500"
              />
            </div>

            <div className="lg:col-span-1 flex items-end gap-2">
              {!isRunning ? (
                <button
                  onClick={runTest}
                  disabled={!config.url}
                  className="flex-1 flex items-center justify-center gap-2 px-4 py-2 rounded-lg bg-gradient-to-r from-orange-500 to-red-600 text-white text-sm font-medium hover:opacity-90 transition-all shadow-lg shadow-orange-500/20 disabled:opacity-50"
                >
                  <Play className="w-4 h-4" />
                  开始测试
                </button>
              ) : (
                <button
                  onClick={stopTest}
                  className="flex-1 flex items-center justify-center gap-2 px-4 py-2 rounded-lg bg-red-600 text-white text-sm font-medium hover:opacity-90 transition-all"
                >
                  <Square className="w-4 h-4" />
                  停止
                </button>
              )}
            </div>
          </div>

          <div className="flex items-center gap-2 mt-3 flex-wrap">
            <span className="text-xs text-gray-500">快速测试:</span>
            {SAMPLE_APIS.map((api, i) => (
              <button
                key={i}
                onClick={() => loadPreset(api)}
                className="text-xs px-2 py-1 rounded-md bg-white/5 hover:bg-white/10 text-gray-400 hover:text-gray-200 transition-colors"
              >
                {api.name}
              </button>
            ))}
          </div>

          {isRunning && (
            <div className="mt-3">
              <div className="flex items-center justify-between text-xs text-gray-400 mb-1.5">
                <span className="flex items-center gap-1.5">
                  <Activity className="w-3 h-3 text-orange-400 animate-pulse" />
                  测试进行中...
                </span>
                <span>
                  {elapsed.toFixed(1)}s / {config.duration}s
                </span>
              </div>
              <div className="h-1.5 bg-black/30 rounded-full overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-orange-500 to-red-500 transition-all"
                  style={{ width: `${progress}%` }}
                />
              </div>
            </div>
          )}
        </div>

        {showHistory && (
          <div className="mt-3 rounded-xl bg-black/20 border border-white/10 p-3 max-h-48 overflow-y-auto">
            {history.length === 0 ? (
              <div className="text-xs text-gray-500 text-center py-4">暂无历史记录</div>
            ) : (
              <div className="space-y-2">
                {history.map((h) => (
                  <div key={h.id} className="flex items-center gap-3 text-xs p-2 rounded-lg bg-white/5">
                    <div className="flex-1 min-w-0">
                      <div className="font-mono text-gray-300 truncate">{h.config.url}</div>
                      <div className="text-[10px] text-gray-500 mt-0.5">
                        {new Date(h.timestamp).toLocaleString()} · TPS: {h.stats.tps.toFixed(1)} · 成功率: {h.stats.successRate.toFixed(1)}%
                      </div>
                    </div>
                    <div
                      className={`w-8 h-8 rounded-md flex items-center justify-center shrink-0 ${
                        h.stats.performanceScore > 80
                          ? 'bg-emerald-500/20 text-emerald-400'
                          : h.stats.performanceScore > 50
                          ? 'bg-amber-500/20 text-amber-400'
                          : 'bg-red-500/20 text-red-400'
                      }`}
                    >
                      {h.stats.performanceScore}
                    </div>
                  </div>
                ))}
              </div>
            )}
            {history.length > 0 && (
              <button
                onClick={clearHistory}
                className="w-full mt-2 text-xs text-gray-500 hover:text-red-400 transition-colors"
              >
                清除历史
              </button>
            )}
          </div>
        )}
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <MetricCard
            icon={<Zap className="w-4 h-4" />}
            label="TPS"
            value={currentStats ? currentStats.tps.toFixed(2) : (isRunning ? (results.length / Math.max(elapsed, 0.1)).toFixed(2) : '0.00')}
            color="cyan"
          />
          <MetricCard
            icon={<CheckCircle className="w-4 h-4" />}
            label="成功率"
            value={currentStats ? `${currentStats.successRate.toFixed(1)}%` : (isRunning && results.length > 0 ? `${((results.filter((r) => r.success).length / results.length) * 100).toFixed(1)}%` : '0.0%')}
            color="emerald"
          />
          <MetricCard
            icon={<Clock className="w-4 h-4" />}
            label="平均响应"
            value={currentStats ? `${currentStats.avgDuration.toFixed(0)}ms` : '0ms'}
            color="blue"
          />
          <MetricCard
            icon={<Gauge className="w-4 h-4" />}
            label="性能评分"
            value={currentStats ? currentStats.performanceScore.toString() : '-'}
            color={currentStats && currentStats.performanceScore > 80 ? 'emerald' : currentStats && currentStats.performanceScore > 50 ? 'amber' : 'red'}
          />
        </div>

        <div className="rounded-2xl bg-white/[0.03] border border-white/10 backdrop-blur-xl overflow-hidden">
          <div className="flex items-center justify-between px-4 py-3 border-b border-white/5">
            <div className="flex items-center gap-2">
              <BarChart3 className="w-4 h-4 text-orange-400" />
              <span className="text-sm font-medium text-gray-300">响应时间分布</span>
            </div>
            <div className="flex items-center gap-2">
              {currentStats && (
                <button
                  onClick={exportResults}
                  className="flex items-center gap-1 px-2 py-1 rounded-md bg-white/5 hover:bg-white/10 text-xs text-gray-400 transition-colors"
                >
                  <Download className="w-3 h-3" />
                  导出
                </button>
              )}
            </div>
          </div>

          <div className="p-4 space-y-3">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              <StatItem label="最小" value={currentStats ? `${currentStats.minDuration.toFixed(0)}ms` : '-'} />
              <StatItem label="P50" value={currentStats ? `${currentStats.p50Duration.toFixed(0)}ms` : '-'} />
              <StatItem label="P95" value={currentStats ? `${currentStats.p95Duration.toFixed(0)}ms` : '-'} />
              <StatItem label="P99" value={currentStats ? `${currentStats.p99Duration.toFixed(0)}ms` : '-'} />
            </div>

            {currentStats && (
              <div className="space-y-2">
                {[
                  { label: 'P50', value: currentStats.p50Duration, color: 'bg-cyan-500' },
                  { label: 'P95', value: currentStats.p95Duration, color: 'bg-amber-500' },
                  { label: 'P99', value: currentStats.p99Duration, color: 'bg-red-500' },
                ].map((item) => (
                  <div key={item.label} className="flex items-center gap-3">
                    <span className="text-xs text-gray-400 w-10">{item.label}</span>
                    <div className="flex-1 h-4 bg-black/30 rounded-full overflow-hidden">
                      <div
                        className={`h-full ${item.color} rounded-full transition-all flex items-center justify-end pr-2`}
                        style={{ width: `${Math.min((item.value / Math.max(currentStats.maxDuration, 1)) * 100, 100)}%` }}
                      >
                        <span className="text-[10px] text-white font-mono">{item.value.toFixed(0)}ms</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        <div className="rounded-2xl bg-white/[0.03] border border-white/10 backdrop-blur-xl overflow-hidden">
          <div className="flex items-center justify-between px-4 py-3 border-b border-white/5">
            <div className="flex items-center gap-2">
              <Activity className="w-4 h-4 text-purple-400" />
              <span className="text-sm font-medium text-gray-300">
                实时请求日志 ({results.length})
              </span>
            </div>
            {results.length > 0 && (
              <span className="text-xs text-gray-500">
                {results.filter((r) => r.success).length} 成功 ·{' '}
                {results.filter((r) => !r.success).length} 失败
              </span>
            )}
          </div>
          <div className="max-h-48 overflow-y-auto">
            {results.length === 0 ? (
              <div className="px-4 py-8 text-center text-gray-600 text-xs">
                {isRunning ? '等待请求...' : '开始测试查看结果'}
              </div>
            ) : (
              <div className="divide-y divide-white/5">
                {[...results].reverse().slice(0, 50).map((r) => (
                  <div key={r.id} className="px-4 py-2 flex items-center gap-3 text-xs font-mono">
                    {r.success ? (
                      <CheckCircle className="w-3 h-3 text-emerald-400 shrink-0" />
                    ) : (
                      <XCircle className="w-3 h-3 text-red-400 shrink-0" />
                    )}
                    <span className={`w-12 ${r.success ? 'text-emerald-400' : 'text-red-400'}`}>
                      {r.status || 'ERR'}
                    </span>
                    <span className="text-gray-400 flex-1 truncate">
                      {r.success ? 'OK' : r.error || 'FAILED'}
                    </span>
                    <span className="text-gray-500">{r.duration.toFixed(1)}ms</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        <div className="rounded-2xl bg-white/[0.03] border border-white/10 backdrop-blur-xl overflow-hidden">
          <div className="flex items-center justify-between px-4 py-3 border-b border-white/5">
            <div className="flex items-center gap-2">
              <FileText className="w-4 h-4 text-pink-400" />
              <span className="text-sm font-medium text-gray-300">请求配置</span>
            </div>
          </div>
          <div className="p-4 space-y-3">
            <div>
              <div className="text-xs text-gray-400 mb-2">请求头</div>
              <div className="space-y-1.5">
                {Object.entries(config.headers).map(([key, value]) => (
                  <div key={key} className="flex items-center gap-2">
                    <input
                      type="text"
                      value={key}
                      onChange={(e) => {
                        const newKey = e.target.value
                        const newHeaders = { ...config.headers }
                        delete newHeaders[key]
                        newHeaders[newKey] = value
                        setConfig((prev) => ({ ...prev, headers: newHeaders }))
                      }}
                      className="flex-1 px-2 py-1.5 rounded-md bg-black/30 border border-white/10 text-xs text-gray-300 font-mono focus:outline-none focus:border-orange-500/50"
                    />
                    <span className="text-gray-500">:</span>
                    <input
                      type="text"
                      value={value}
                      onChange={(e) => updateHeader(key, e.target.value)}
                      className="flex-1 px-2 py-1.5 rounded-md bg-black/30 border border-white/10 text-xs text-gray-300 font-mono focus:outline-none focus:border-orange-500/50"
                    />
                    <button
                      onClick={() => {
                        const newHeaders = { ...config.headers }
                        delete newHeaders[key]
                        setConfig((prev) => ({ ...prev, headers: newHeaders }))
                      }}
                      className="p-1.5 rounded-md hover:bg-white/10 text-gray-500 hover:text-red-400 transition-colors"
                    >
                      <Trash2 className="w-3 h-3" />
                    </button>
                  </div>
                ))}
                <button
                  onClick={addHeader}
                  className="text-xs text-orange-400 hover:text-orange-300 transition-colors"
                >
                  + 添加请求头
                </button>
              </div>
            </div>

            {config.method !== 'GET' && config.method !== 'HEAD' && (
              <div>
                <div className="text-xs text-gray-400 mb-2">请求体</div>
                <textarea
                  value={config.body}
                  onChange={(e) => updateConfig('body', e.target.value)}
                  placeholder='{"key": "value"}'
                  rows={4}
                  className="w-full px-3 py-2 rounded-lg bg-black/30 border border-white/10 text-sm text-gray-200 placeholder-gray-600 focus:outline-none focus:border-orange-500/50 font-mono resize-none"
                />
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

function MetricCard({
  icon,
  label,
  value,
  color,
}: {
  icon: React.ReactNode
  label: string
  value: string
  color: string
}) {
  const colorMap: Record<string, string> = {
    cyan: 'text-cyan-400 border-cyan-500/20 bg-cyan-500/10',
    emerald: 'text-emerald-400 border-emerald-500/20 bg-emerald-500/10',
    blue: 'text-blue-400 border-blue-500/20 bg-blue-500/10',
    amber: 'text-amber-400 border-amber-500/20 bg-amber-500/10',
    red: 'text-red-400 border-red-500/20 bg-red-500/10',
  }
  return (
    <div className={`rounded-xl border p-3 ${colorMap[color]}`}>
      <div className="flex items-center gap-1.5 mb-1">
        {icon}
        <span className="text-[10px] opacity-80">{label}</span>
      </div>
      <div className="text-xl font-bold font-mono">{value}</div>
    </div>
  )
}

function StatItem({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg bg-black/20 p-2.5 border border-white/5">
      <div className="text-[10px] text-gray-500 mb-0.5">{label}</div>
      <div className="text-sm font-mono text-gray-200">{value}</div>
    </div>
  )
}