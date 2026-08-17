import { useState, useEffect, useRef } from 'react'
import { useStore } from '../store'

interface MemoryInfo {
  usedJSHeapSize: number
  totalJSHeapSize?: number
  jsHeapSizeLimit?: number
}

interface PerformanceWithMemory extends Performance {
  memory?: MemoryInfo
}

interface BenchmarkStats {
  mean: number
  median: number
  stdDev: number
  min: number
  max: number
  opsPerSec: number
}

interface BenchmarkResult {
  id: string
  name: string
  timings: number[]
  stats: BenchmarkStats
  memoryBefore: number
  memoryAfter: number
  memoryDelta: number
  fpsImpact: number
  timestamp: number
  code: string
}

interface HistoryEntry {
  id: string
  nameA: string
  nameB: string
  statsA: BenchmarkStats
  statsB: BenchmarkStats
  winner: 'A' | 'B' | 'Tie'
  improvement: number
  timestamp: number
}

const DEFAULT_CODE_A = `// 示例: 计算数组平方和
const arr = new Array(1000).fill(0).map((_, i) => i);
let sum = 0;
for (let i = 0; i < arr.length; i++) {
  sum += arr[i] * arr[i];
}
return sum;`

const DEFAULT_CODE_B = `// 示例: 使用 reduce 计算平方和
const arr = new Array(1000).fill(0).map((_, i) => i);
return arr.reduce((acc, v) => acc + v * v, 0);`

const SAMPLE_SNIPPETS = [
  {
    label: '循环求和',
    code: `const n = 10000;
let s = 0;
for (let i = 0; i < n; i++) s += i;
return s;`,
  },
  {
    label: '数组反转',
    code: `const arr = new Array(5000).fill(0).map((_, i) => i);
const res = [];
for (let i = arr.length - 1; i >= 0; i--) res.push(arr[i]);
return res;`,
  },
  {
    label: '字符串拼接',
    code: `let s = '';
for (let i = 0; i < 1000; i++) s += 'x';
return s.length;`,
  },
  {
    label: '对象创建',
    code: `const objs = [];
for (let i = 0; i < 1000; i++) {
  objs.push({ id: i, value: \`item_\${i}\`, active: i % 2 === 0 });
}
return objs.length;`,
  },
]

function computeStats(timings: number[]): BenchmarkStats {
  if (timings.length === 0) {
    return { mean: 0, median: 0, stdDev: 0, min: 0, max: 0, opsPerSec: 0 }
  }
  const sorted = [...timings].sort((a, b) => a - b)
  const n = sorted.length
  const mean = sorted.reduce((a, b) => a + b, 0) / n
  const median =
    n % 2 === 0 ? (sorted[n / 2 - 1] + sorted[n / 2]) / 2 : sorted[Math.floor(n / 2)]
  const variance = sorted.reduce((acc, v) => acc + (v - mean) ** 2, 0) / n
  const stdDev = Math.sqrt(variance)
  const min = sorted[0]
  const max = sorted[n - 1]
  const opsPerSec = mean > 0 ? 1000 / mean : 0
  return { mean, median, stdDev, min, max, opsPerSec }
}

function getMemoryMB(): number {
  try {
    const perf = performance as PerformanceWithMemory
    if (perf.memory && typeof perf.memory.usedJSHeapSize === 'number') {
      return Math.round(perf.memory.usedJSHeapSize / 1048576)
    }
  } catch {
    // ignore
  }
  return 0
}

function formatMs(v: number): string {
  if (v < 1) return `${(v * 1000).toFixed(2)}µs`
  return `${v.toFixed(3)}ms`
}

function formatNum(v: number): string {
  if (v >= 1000) return `${(v / 1000).toFixed(2)}k`
  return v.toFixed(2)
}

export default function CodePerfAnalyzer() {
  const theme = useStore((s) => s.resolvedTheme)
  const [codeA, setCodeA] = useState<string>(DEFAULT_CODE_A)
  const [codeB, setCodeB] = useState<string>(DEFAULT_CODE_B)
  const [iterations, setIterations] = useState<number>(100)
  const [isRunning, setIsRunning] = useState<boolean>(false)
  const [progress, setProgress] = useState<number>(0)
  const [resultA, setResultA] = useState<BenchmarkResult | null>(null)
  const [resultB, setResultB] = useState<BenchmarkResult | null>(null)
  const [fpsImpact, setFpsImpact] = useState<number>(0)
  const [history, setHistory] = useState<HistoryEntry[]>([])
  const [activeTab, setActiveTab] = useState<'compare' | 'memory' | 'fps' | 'history'>(
    'compare'
  )
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    try {
      const saved = localStorage.getItem('code-perf-analyzer-history')
      if (saved) {
        setHistory(JSON.parse(saved))
      }
    } catch {
      // ignore
    }
  }, [])

  const saveHistoryEntry = (entry: HistoryEntry) => {
    setHistory((prev) => {
      const next = [entry, ...prev].slice(0, 50)
      try {
        localStorage.setItem('code-perf-analyzer-history', JSON.stringify(next))
      } catch {
        // ignore
      }
      return next
    })
  }

  const clearHistory = () => {
    setHistory([])
    try {
      localStorage.removeItem('code-perf-analyzer-history')
    } catch {
      // ignore
    }
  }

  const buildRunner = (code: string): (() => unknown) | null => {
    try {
      // eslint-disable-next-line no-new-func
      const fn = new Function(`${code};`)
      return () => fn()
    } catch (e) {
      return null
    }
  }

  const measureFpsImpact = async (
    runner: () => unknown,
    durationMs: number
  ): Promise<number> => {
    return new Promise((resolve) => {
      let frames = 0
      let startTime = performance.now()
      let lastFrameTime = performance.now()
      let rafId = 0
      let stopped = false

      const loop = () => {
        const now = performance.now()
        if (now - lastFrameTime >= 1000) {
          // 1 second sample before
        }
        frames++
        lastFrameTime = now
        if (!stopped) rafId = requestAnimationFrame(loop)
      }
      rafId = requestAnimationFrame(loop)

      window.setTimeout(() => {
        stopped = true
        cancelAnimationFrame(rafId)
        const elapsed = performance.now() - startTime
        const fps = Math.round((frames * 1000) / elapsed)
        resolve(fps)
      }, durationMs)

      // small busy work interleaved with raf
      const intervalId = window.setInterval(() => {
        if (stopped) {
          clearInterval(intervalId)
          return
        }
        runner()
      }, 16)

      // safety cleanup
      window.setTimeout(() => {
        clearInterval(intervalId)
      }, durationMs)

      // ensure timer resolves even if interval somehow didn't
      window.setTimeout(() => {
        if (!stopped) {
          stopped = true
          cancelAnimationFrame(rafId)
          clearInterval(intervalId)
          const elapsed = performance.now() - startTime
          resolve(Math.round((frames * 1000) / elapsed))
        }
      }, durationMs + 50)
    })
  }

  const runBenchmark = async () => {
    if (isRunning) return
    setError(null)
    setIsRunning(true)
    setProgress(0)
    setResultA(null)
    setResultB(null)

    const runnerA = buildRunner(codeA)
    const runnerB = buildRunner(codeB)

    if (!runnerA) {
      setError('代码 A 语法错误,无法执行')
      setIsRunning(false)
      return
    }
    if (!runnerB) {
      setError('代码 B 语法错误,无法执行')
      setIsRunning(false)
      return
    }

    try {
      // warmup
      for (let i = 0; i < 5; i++) {
        runnerA()
        runnerB()
      }

      const memBeforeA = getMemoryMB()
      const timingsA: number[] = []
      for (let i = 0; i < iterations; i++) {
        const t0 = performance.now()
        runnerA()
        const t1 = performance.now()
        timingsA.push(t1 - t0)
        if (i % 10 === 0) setProgress(Math.round((i / iterations) * 50))
      }
      const memAfterA = getMemoryMB()

      const timingsB: number[] = []
      const memBeforeB = getMemoryMB()
      for (let i = 0; i < iterations; i++) {
        const t0 = performance.now()
        runnerB()
        const t1 = performance.now()
        timingsB.push(t1 - t0)
        if (i % 10 === 0) setProgress(50 + Math.round((i / iterations) * 50))
      }
      const memAfterB = getMemoryMB()

      const statsA = computeStats(timingsA)
      const statsB = computeStats(timingsB)

      const resultA: BenchmarkResult = {
        id: `r_${Date.now()}_a`,
        name: '代码 A',
        timings: timingsA,
        stats: statsA,
        memoryBefore: memBeforeA,
        memoryAfter: memAfterA,
        memoryDelta: memAfterA - memBeforeA,
        fpsImpact: 0,
        timestamp: Date.now(),
        code: codeA,
      }
      const resultB: BenchmarkResult = {
        id: `r_${Date.now()}_b`,
        name: '代码 B',
        timings: timingsB,
        stats: statsB,
        memoryBefore: memBeforeB,
        memoryAfter: memAfterB,
        memoryDelta: memAfterB - memBeforeB,
        fpsImpact: 0,
        timestamp: Date.now(),
        code: codeB,
      }

      setResultA(resultA)
      setResultB(resultB)

      // FPS impact measurement (baseline vs during work)
      const baselineFps = await measureFpsImpact(() => {
        let x = 0
        for (let i = 0; i < 1000; i++) x++
        return x
      }, 1500)
      const workFps = await measureFpsImpact(runnerA, 1500)
      const impact = Math.max(0, baselineFps - workFps)
      setFpsImpact(impact)

      const winner: 'A' | 'B' | 'Tie' =
        statsA.mean < statsB.mean ? 'A' : statsB.mean < statsA.mean ? 'B' : 'Tie'
      const improvement =
        winner === 'Tie'
          ? 0
          : winner === 'A'
          ? ((statsB.mean - statsA.mean) / statsB.mean) * 100
          : ((statsA.mean - statsB.mean) / statsA.mean) * 100

      const entry: HistoryEntry = {
        id: `h_${Date.now()}`,
        nameA: '代码 A',
        nameB: '代码 B',
        statsA,
        statsB,
        winner,
        improvement,
        timestamp: Date.now(),
      }
      saveHistoryEntry(entry)
    } catch (e) {
      setError(`执行出错: ${(e as Error).message}`)
    } finally {
      setIsRunning(false)
      setProgress(100)
    }
  }

  const clearResults = () => {
    setResultA(null)
    setResultB(null)
    setFpsImpact(0)
    setError(null)
  }

  const applySnippet = (label: string, code: string) => {
    if (label === '代码 A' || code === DEFAULT_CODE_A) {
      setCodeA(code)
    } else {
      setCodeB(code)
    }
  }

  const bg = theme === 'light' ? '#f5f5f7' : '#1a1a2e'
  const panel = theme === 'light' ? '#ffffff' : '#252536'
  const border = theme === 'light' ? '#e8e8ed' : '#3a3a5c'
  const textMuted = theme === 'light' ? '#6b6b70' : '#a0a0b0'
  const accent = '#6c5ce7'
  const colorA = '#6c5ce7'
  const colorB = '#00b894'

  return (
    <div
      className="app-container"
      style={{
        background: bg,
        color: theme === 'light' ? '#1c1c1e' : '#e0e0e8',
        padding: 20,
        overflow: 'auto',
        minHeight: '100%',
      }}
    >
      <div style={{ marginBottom: 20 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
          <h2 style={{ fontSize: 18, fontWeight: 600, margin: 0 }}>Code Performance Analyzer</h2>
          <div style={{ display: 'flex', gap: 8 }}>
            <button
              onClick={clearResults}
              disabled={isRunning}
              style={btnStyle(theme, border)}
            >
              清除结果
            </button>
            <button
              onClick={runBenchmark}
              disabled={isRunning}
              style={{
                ...btnStyle(theme, border),
                background: isRunning ? border : accent,
                color: '#fff',
                cursor: isRunning ? 'not-allowed' : 'pointer',
              }}
            >
              {isRunning ? `测试中 ${progress}%` : '开始基准测试'}
            </button>
          </div>
        </div>

        <div style={{ display: 'flex', gap: 16, marginBottom: 16, flexWrap: 'wrap' }}>
          <label style={{ fontSize: 13, display: 'flex', alignItems: 'center', gap: 8 }}>
            迭代次数
            <input
              type="number"
              min={10}
              max={5000}
              value={iterations}
              onChange={(e) => setIterations(Math.max(10, Math.min(5000, Number(e.target.value) || 10)))}
              style={{
                padding: '6px 10px',
                borderRadius: 8,
                border: `1px solid ${border}`,
                background: panel,
                color: 'inherit',
                width: 90,
                fontSize: 13,
              }}
            />
          </label>
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            {['compare', 'memory', 'fps', 'history'].map((t) => (
              <button
                key={t}
                onClick={() => setActiveTab(t as typeof activeTab)}
                style={{
                  ...btnStyle(theme, border),
                  background: activeTab === t ? accent : 'transparent',
                  color: activeTab === t ? '#fff' : 'inherit',
                }}
              >
                {t === 'compare' ? '对比测试' : t === 'memory' ? '内存分析' : t === 'fps' ? 'FPS 测试' : '历史记录'}
              </button>
            ))}
          </div>
        </div>

        {isRunning && (
          <div style={{ marginBottom: 12 }}>
            <div style={{ height: 6, background: border, borderRadius: 4, overflow: 'hidden' }}>
              <div style={{ width: `${progress}%`, height: '100%', background: accent, transition: 'width 0.2s' }} />
            </div>
          </div>
        )}

        {error && (
          <div
            style={{
              padding: '10px 14px',
              background: theme === 'light' ? '#ffe5e5' : '#3a1f2e',
              color: '#ef4444',
              borderRadius: 8,
              marginBottom: 12,
              fontSize: 13,
            }}
          >
            {error}
          </div>
        )}

        {activeTab === 'compare' && (
          <CompareTab
            theme={theme}
            border={border}
            panel={panel}
            textMuted={textMuted}
            codeA={codeA}
            codeB={codeB}
            setCodeA={setCodeA}
            setCodeB={setCodeB}
            resultA={resultA}
            resultB={resultB}
            isRunning={isRunning}
            onApplySnippet={applySnippet}
            accent={accent}
            colorA={colorA}
            colorB={colorB}
          />
        )}

        {activeTab === 'memory' && (
          <MemoryTab
            theme={theme}
            border={border}
            panel={panel}
            textMuted={textMuted}
            resultA={resultA}
            resultB={resultB}
          />
        )}

        {activeTab === 'fps' && (
          <FpsTab
            theme={theme}
            border={border}
            panel={panel}
            textMuted={textMuted}
            fpsImpact={fpsImpact}
            resultA={resultA}
          />
        )}

        {activeTab === 'history' && (
          <HistoryTab
            theme={theme}
            border={border}
            panel={panel}
            textMuted={textMuted}
            history={history}
            onClear={clearHistory}
          />
        )}
      </div>
    </div>
  )
}

function btnStyle(theme: 'light' | 'dark', border: string): React.CSSProperties {
  return {
    padding: '6px 12px',
    borderRadius: 8,
    border: `1px solid ${border}`,
    background: theme === 'light' ? '#e8e8ed' : '#2a2a3e',
    color: 'inherit',
    cursor: 'pointer',
    fontSize: 12,
    transition: 'all 0.15s',
  }
}

interface CompareTabProps {
  theme: 'light' | 'dark'
  border: string
  panel: string
  textMuted: string
  codeA: string
  codeB: string
  setCodeA: (v: string) => void
  setCodeB: (v: string) => void
  resultA: BenchmarkResult | null
  resultB: BenchmarkResult | null
  isRunning: boolean
  onApplySnippet: (label: string, code: string) => void
  accent: string
  colorA: string
  colorB: string
}

function CompareTab({
  theme,
  border,
  panel,
  textMuted,
  codeA,
  codeB,
  setCodeA,
  setCodeB,
  resultA,
  resultB,
  isRunning,
  onApplySnippet,
  colorA,
  colorB,
}: CompareTabProps) {
  return (
    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
      <div style={{ background: panel, borderRadius: 12, padding: 16, border: `1px solid ${border}` }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <span style={{ width: 10, height: 10, background: colorA, borderRadius: '50%' }} />
            <strong>代码 A</strong>
          </div>
          <select
            onChange={(e) => {
              const s = SAMPLE_SNIPPETS.find((x) => x.label === e.target.value)
              if (s) onApplySnippet('代码 A', s.code)
            }}
            defaultValue=""
            style={{
              padding: '4px 8px',
              borderRadius: 6,
              border: `1px solid ${border}`,
              background: theme === 'light' ? '#fff' : '#1a1a2e',
              color: 'inherit',
              fontSize: 12,
            }}
          >
            <option value="" disabled>
              选择示例
            </option>
            {SAMPLE_SNIPPETS.map((s) => (
              <option key={s.label} value={s.label}>
                {s.label}
              </option>
            ))}
          </select>
        </div>
        <textarea
          value={codeA}
          onChange={(e) => setCodeA(e.target.value)}
          disabled={isRunning}
          spellCheck={false}
          style={{
            width: '100%',
            minHeight: 220,
            padding: 12,
            borderRadius: 8,
            border: `1px solid ${border}`,
            background: theme === 'light' ? '#fafafa' : '#1a1a2e',
            color: theme === 'light' ? '#1c1c1e' : '#e0e0e8',
            fontFamily: 'Monaco, Menlo, monospace',
            fontSize: 12,
            resize: 'vertical',
            lineHeight: 1.5,
          }}
        />
        <ResultStats result={resultA} color={colorA} textMuted={textMuted} />
      </div>

      <div style={{ background: panel, borderRadius: 12, padding: 16, border: `1px solid ${border}` }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <span style={{ width: 10, height: 10, background: colorB, borderRadius: '50%' }} />
            <strong>代码 B</strong>
          </div>
          <select
            onChange={(e) => {
              const s = SAMPLE_SNIPPETS.find((x) => x.label === e.target.value)
              if (s) onApplySnippet('代码 B', s.code)
            }}
            defaultValue=""
            style={{
              padding: '4px 8px',
              borderRadius: 6,
              border: `1px solid ${border}`,
              background: theme === 'light' ? '#fff' : '#1a1a2e',
              color: 'inherit',
              fontSize: 12,
            }}
          >
            <option value="" disabled>
              选择示例
            </option>
            {SAMPLE_SNIPPETS.map((s) => (
              <option key={s.label} value={s.label}>
                {s.label}
              </option>
            ))}
          </select>
        </div>
        <textarea
          value={codeB}
          onChange={(e) => setCodeB(e.target.value)}
          disabled={isRunning}
          spellCheck={false}
          style={{
            width: '100%',
            minHeight: 220,
            padding: 12,
            borderRadius: 8,
            border: `1px solid ${border}`,
            background: theme === 'light' ? '#fafafa' : '#1a1a2e',
            color: theme === 'light' ? '#1c1c1e' : '#e0e0e8',
            fontFamily: 'Monaco, Menlo, monospace',
            fontSize: 12,
            resize: 'vertical',
            lineHeight: 1.5,
          }}
        />
        <ResultStats result={resultB} color={colorB} textMuted={textMuted} />
      </div>

      {resultA && resultB && (
        <div style={{ gridColumn: '1 / -1', background: panel, borderRadius: 12, padding: 16, border: `1px solid ${border}` }}>
          <h3 style={{ fontSize: 14, fontWeight: 600, marginTop: 0 }}>分布对比</h3>
          <DistributionChart
            a={resultA.timings}
            b={resultB.timings}
            colorA={colorA}
            colorB={colorB}
            theme={theme}
          />
          <div style={{ marginTop: 16 }}>
            <h3 style={{ fontSize: 14, fontWeight: 600 }}>性能赢家</h3>
            <WinnerCard a={resultA} b={resultB} textMuted={textMuted} theme={theme} border={border} />
          </div>
        </div>
      )}
    </div>
  )
}

interface ResultStatsProps {
  result: BenchmarkResult | null
  color: string
  textMuted: string
}

function ResultStats({ result, color, textMuted }: ResultStatsProps) {
  if (!result) {
    return (
      <div style={{ marginTop: 12, fontSize: 12, color: textMuted, textAlign: 'center', padding: '20px 0' }}>
        运行测试后显示结果
      </div>
    )
  }
  const { stats } = result
  return (
    <div style={{ marginTop: 12, display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 8 }}>
      <StatBox label="平均" value={formatMs(stats.mean)} color={color} textMuted={textMuted} />
      <StatBox label="中位数" value={formatMs(stats.median)} color={color} textMuted={textMuted} />
      <StatBox label="标准差" value={formatMs(stats.stdDev)} color={color} textMuted={textMuted} />
      <StatBox label="最小" value={formatMs(stats.min)} color={color} textMuted={textMuted} />
      <StatBox label="最大" value={formatMs(stats.max)} color={color} textMuted={textMuted} />
      <StatBox
        label="ops/s"
        value={stats.opsPerSec >= 1000 ? `${formatNum(stats.opsPerSec)}k` : stats.opsPerSec.toFixed(1)}
        color={color}
        textMuted={textMuted}
      />
    </div>
  )
}

function StatBox({
  label,
  value,
  color,
  textMuted,
}: {
  label: string
  value: string
  color: string
  textMuted: string
}) {
  return (
    <div
      style={{
        padding: '8px 10px',
        borderRadius: 8,
        background: 'rgba(108,92,231,0.06)',
        border: '1px solid rgba(108,92,231,0.15)',
      }}
    >
      <div style={{ fontSize: 11, color: textMuted, marginBottom: 4 }}>{label}</div>
      <div style={{ fontSize: 14, fontWeight: 600, color }}>{value}</div>
    </div>
  )
}

interface WinnerCardProps {
  a: BenchmarkResult
  b: BenchmarkResult
  textMuted: string
  theme: 'light' | 'dark'
  border: string
}

function WinnerCard({ a, b, textMuted, theme, border }: WinnerCardProps) {
  const aFaster = a.stats.mean < b.stats.mean
  const winner = aFaster ? 'A' : b.stats.mean < a.stats.mean ? 'B' : 'Tie'
  const speedup =
    winner === 'Tie' ? 0 : winner === 'A' ? (b.stats.mean / a.stats.mean) : (a.stats.mean / b.stats.mean)

  return (
    <div
      style={{
        padding: 16,
        borderRadius: 10,
        background: theme === 'light' ? '#f9f9ff' : '#1e1e35',
        border: `1px solid ${border}`,
        display: 'flex',
        alignItems: 'center',
        gap: 16,
      }}
    >
      <div style={{ fontSize: 36 }}>{winner === 'Tie' ? '🤝' : '🏆'}</div>
      <div style={{ flex: 1 }}>
        <div style={{ fontSize: 16, fontWeight: 600 }}>
          {winner === 'Tie'
            ? '两者性能相近'
            : `${winner === 'A' ? '代码 A' : '代码 B'} 胜出,快 ${speedup.toFixed(2)} 倍`}
        </div>
        <div style={{ fontSize: 12, color: textMuted, marginTop: 4 }}>
          A 平均 {formatMs(a.stats.mean)} · B 平均 {formatMs(b.stats.mean)}
        </div>
      </div>
    </div>
  )
}

interface DistributionChartProps {
  a: number[]
  b: number[]
  colorA: string
  colorB: string
  theme: 'light' | 'dark'
}

function DistributionChart({ a, b, colorA, colorB, theme }: DistributionChartProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    const W = canvas.width
    const H = canvas.height
    const padding = { top: 20, right: 20, bottom: 32, left: 48 }
    const plotW = W - padding.left - padding.right
    const plotH = H - padding.top - padding.bottom

    ctx.clearRect(0, 0, W, H)

    const bg = theme === 'light' ? '#f5f5f7' : '#1a1a2e'
    ctx.fillStyle = bg
    ctx.fillRect(0, 0, W, H)

    const all = [...a, ...b]
    if (all.length === 0) return

    const maxVal = Math.max(...all) * 1.1
    const minVal = Math.min(...all) * 0.9
    const range = maxVal - minVal || 1

    const bins = 20
    const binW = plotW / bins

    const drawHist = (data: number[], color: string, offsetX: number) => {
      const hist = new Array(bins).fill(0)
      data.forEach((v) => {
        const idx = Math.min(bins - 1, Math.max(0, Math.floor(((v - minVal) / range) * bins)))
        hist[idx]++
      })
      const maxCount = Math.max(...hist, 1)
      hist.forEach((count, i) => {
        const x = padding.left + i * binW + offsetX
        const h = (count / maxCount) * plotH * 0.9
        const y = padding.top + plotH - h
        ctx.fillStyle = color
        ctx.globalAlpha = 0.55
        ctx.fillRect(x, y, binW - 2, h)
      })
      ctx.globalAlpha = 1
    }

    drawHist(a, colorA, 0)
    drawHist(b, colorB, 1)

    // axes
    ctx.strokeStyle = theme === 'light' ? '#c8c8cc' : '#3a3a5c'
    ctx.lineWidth = 1
    ctx.beginPath()
    ctx.moveTo(padding.left, padding.top)
    ctx.lineTo(padding.left, padding.top + plotH)
    ctx.lineTo(padding.left + plotW, padding.top + plotH)
    ctx.stroke()

    // y-axis label
    ctx.fillStyle = theme === 'light' ? '#6b6b70' : '#a0a0b0'
    ctx.font = '10px sans-serif'
    ctx.fillText('频次', 6, padding.top + 10)

    // x-axis labels
    const tickCount = 5
    for (let i = 0; i <= tickCount; i++) {
      const v = minVal + (range * i) / tickCount
      const x = padding.left + (plotW * i) / tickCount
      ctx.fillText(v.toFixed(2) + 'ms', x - 16, padding.top + plotH + 14)
    }

    // legend
    ctx.fillStyle = colorA
    ctx.fillRect(W - 160, 6, 10, 10)
    ctx.fillStyle = theme === 'light' ? '#1c1c1e' : '#e0e0e8'
    ctx.fillText('代码 A', W - 145, 15)
    ctx.fillStyle = colorB
    ctx.fillRect(W - 90, 6, 10, 10)
    ctx.fillStyle = theme === 'light' ? '#1c1c1e' : '#e0e0e8'
    ctx.fillText('代码 B', W - 75, 15)
  }, [a, b, colorA, colorB, theme])

  return <canvas ref={canvasRef} width={720} height={220} style={{ width: '100%', height: 220, borderRadius: 8 }} />
}

interface MemoryTabProps {
  theme: 'light' | 'dark'
  border: string
  panel: string
  textMuted: string
  resultA: BenchmarkResult | null
  resultB: BenchmarkResult | null
}

function MemoryTab({ border, panel, textMuted, resultA, resultB }: MemoryTabProps) {
  const mem = (performance as PerformanceWithMemory).memory
  const [liveMem, setLiveMem] = useState(getMemoryMB())

  useEffect(() => {
    const id = window.setInterval(() => setLiveMem(getMemoryMB()), 1000)
    return () => clearInterval(id)
  }, [])

  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: 16 }}>
      <div style={{ background: panel, borderRadius: 12, padding: 16, border: `1px solid ${border}` }}>
        <h3 style={{ fontSize: 14, fontWeight: 600, marginTop: 0 }}>实时内存</h3>
        <div style={{ fontSize: 32, fontWeight: 700, color: '#6c5ce7' }}>{liveMem} MB</div>
        <div style={{ fontSize: 12, color: textMuted, marginTop: 4 }}>
          {mem
            ? `限制: ${mem.jsHeapSizeLimit ? Math.round(mem.jsHeapSizeLimit / 1048576) : '?'} MB · 总计: ${
                mem.totalJSHeapSize ? Math.round(mem.totalJSHeapSize / 1048576) : '?'
              } MB`
            : '当前浏览器不支持 performance.memory (需使用 Chrome 并启用相关实验特性)'}
        </div>
      </div>

      <MemoryBreakdown
        title="代码 A 内存变化"
        result={resultA}
        color="#6c5ce7"
        panel={panel}
        border={border}
        textMuted={textMuted}
      />
      <MemoryBreakdown
        title="代码 B 内存变化"
        result={resultB}
        color="#00b894"
        panel={panel}
        border={border}
        textMuted={textMuted}
      />
    </div>
  )
}

function MemoryBreakdown({
  title,
  result,
  color,
  panel,
  border,
  textMuted,
}: {
  title: string
  result: BenchmarkResult | null
  color: string
  panel: string
  border: string
  textMuted: string
}) {
  return (
    <div style={{ background: panel, borderRadius: 12, padding: 16, border: `1px solid ${border}` }}>
      <h3 style={{ fontSize: 14, fontWeight: 600, marginTop: 0, color }}>{title}</h3>
      {!result ? (
        <div style={{ fontSize: 12, color: textMuted, textAlign: 'center', padding: '20px 0' }}>
          暂无数据
        </div>
      ) : (
        <div>
          <MemBar label="执行前" value={result.memoryBefore} max={Math.max(result.memoryAfter, result.memoryBefore, 1)} color={color} textMuted={textMuted} />
          <MemBar label="执行后" value={result.memoryAfter} max={Math.max(result.memoryAfter, result.memoryBefore, 1)} color={color} textMuted={textMuted} />
          <div style={{ marginTop: 12, fontSize: 13 }}>
            变化:{' '}
            <strong style={{ color: result.memoryDelta > 0 ? '#ef4444' : '#4ade80' }}>
              {result.memoryDelta > 0 ? '+' : ''}
              {result.memoryDelta} MB
            </strong>
          </div>
        </div>
      )}
    </div>
  )
}

function MemBar({
  label,
  value,
  max,
  color,
  textMuted,
}: {
  label: string
  value: number
  max: number
  color: string
  textMuted: string
}) {
  const pct = max > 0 ? (value / max) * 100 : 0
  return (
    <div style={{ marginBottom: 10 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, color: textMuted, marginBottom: 4 }}>
        <span>{label}</span>
        <span>{value} MB</span>
      </div>
      <div style={{ height: 8, background: 'rgba(108,92,231,0.1)', borderRadius: 4 }}>
        <div style={{ width: `${pct}%`, height: '100%', background: color, borderRadius: 4, transition: 'width 0.3s' }} />
      </div>
    </div>
  )
}

interface FpsTabProps {
  theme: 'light' | 'dark'
  border: string
  panel: string
  textMuted: string
  fpsImpact: number
  resultA: BenchmarkResult | null
}

function FpsTab({ theme, border, panel, textMuted, fpsImpact, resultA }: FpsTabProps) {
  const [liveFps, setLiveFps] = useState(60)
  const [fpsHistory, setFpsHistory] = useState<number[]>([])
  const rafRef = useRef<number | null>(null)

  useEffect(() => {
    let frames = 0
    let last = performance.now()
    const loop = () => {
      frames++
      const now = performance.now()
      if (now - last >= 1000) {
        const fps = Math.round((frames * 1000) / (now - last))
        setLiveFps(fps)
        setFpsHistory((prev) => [...prev.slice(-59), fps])
        frames = 0
        last = now
      }
      rafRef.current = requestAnimationFrame(loop)
    }
    rafRef.current = requestAnimationFrame(loop)
    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current)
    }
  }, [])

  const fpsColor = liveFps >= 55 ? '#4ade80' : liveFps >= 30 ? '#facc15' : '#ef4444'

  return (
    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
      <div style={{ background: panel, borderRadius: 12, padding: 16, border: `1px solid ${border}` }}>
        <h3 style={{ fontSize: 14, fontWeight: 600, marginTop: 0 }}>实时 FPS</h3>
        <div style={{ fontSize: 48, fontWeight: 700, color: fpsColor, textAlign: 'center', margin: '12px 0' }}>
          {liveFps}
        </div>
        <FpsChart data={fpsHistory} theme={theme} />
        <div style={{ marginTop: 8, fontSize: 12, color: textMuted }}>
          {liveFps >= 55 ? '运行流畅' : liveFps >= 30 ? '轻度卡顿' : '严重卡顿'}
        </div>
      </div>

      <div style={{ background: panel, borderRadius: 12, padding: 16, border: `1px solid ${border}` }}>
        <h3 style={{ fontSize: 14, fontWeight: 600, marginTop: 0 }}>测试对帧率的影响</h3>
        <div style={{ padding: 16 }}>
          <div style={{ fontSize: 12, color: textMuted, marginBottom: 8 }}>代码 A 运行期间的 FPS 下降</div>
          <div style={{ fontSize: 32, fontWeight: 700, color: fpsImpact > 5 ? '#ef4444' : '#4ade80' }}>
            {fpsImpact > 0 ? `-${fpsImpact}` : '0'} fps
          </div>
          <div style={{ marginTop: 12, fontSize: 13 }}>
            {fpsImpact === 0
              ? '运行基准测试以测量帧率影响'
              : fpsImpact < 5
              ? '对帧率影响很小,代码执行基本不会阻塞主线程'
              : fpsImpact < 15
              ? '对帧率有一定影响,建议优化循环或使用 Web Worker'
              : '严重影响帧率,强烈建议将耗时任务放入 Web Worker'}
          </div>
          {resultA && (
            <div style={{ marginTop: 16, fontSize: 12, color: textMuted }}>
              平均执行时间 {formatMs(resultA.stats.mean)},每次运行都会占用主线程
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

function FpsChart({ data, theme }: { data: number[]; theme: 'light' | 'dark' }) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return
    const W = canvas.width
    const H = canvas.height
    ctx.clearRect(0, 0, W, H)
    ctx.fillStyle = theme === 'light' ? '#f5f5f7' : '#1a1a2e'
    ctx.fillRect(0, 0, W, H)

    // grid
    ctx.strokeStyle = theme === 'light' ? '#e8e8ed' : '#3a3a5c'
    ctx.lineWidth = 1
    for (let i = 1; i < 4; i++) {
      const y = (H * i) / 4
      ctx.beginPath()
      ctx.moveTo(0, y)
      ctx.lineTo(W, y)
      ctx.stroke()
    }

    if (data.length < 2) return
    const maxFps = 60
    ctx.strokeStyle = '#6c5ce7'
    ctx.lineWidth = 2
    ctx.beginPath()
    data.forEach((v, i) => {
      const x = (i / 59) * W
      const y = H - (Math.min(v, maxFps) / maxFps) * H
      if (i === 0) ctx.moveTo(x, y)
      else ctx.lineTo(x, y)
    })
    ctx.stroke()

    // fill
    ctx.lineTo(W, H)
    ctx.lineTo(0, H)
    ctx.closePath()
    ctx.fillStyle = 'rgba(108,92,231,0.15)'
    ctx.fill()
  }, [data, theme])

  return <canvas ref={canvasRef} width={400} height={140} style={{ width: '100%', height: 140, borderRadius: 8 }} />
}

interface HistoryTabProps {
  theme: 'light' | 'dark'
  border: string
  panel: string
  textMuted: string
  history: HistoryEntry[]
  onClear: () => void
}

function HistoryTab({ theme, border, panel, textMuted, history, onClear }: HistoryTabProps) {
  return (
    <div style={{ background: panel, borderRadius: 12, padding: 16, border: `1px solid ${border}` }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
        <h3 style={{ fontSize: 14, fontWeight: 600, margin: 0 }}>
          历史记录 <span style={{ fontSize: 12, color: textMuted, fontWeight: 400 }}>(最近 {history.length} 条)</span>
        </h3>
        {history.length > 0 && (
          <button onClick={onClear} style={btnStyle(theme, border)}>
            清空
          </button>
        )}
      </div>

      {history.length === 0 ? (
        <div style={{ textAlign: 'center', padding: 40, color: textMuted, fontSize: 13 }}>
          暂无历史记录,运行基准测试后将自动保存
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8, maxHeight: 500, overflow: 'auto' }}>
          {history.map((h) => (
            <div
              key={h.id}
              style={{
                padding: 12,
                borderRadius: 8,
                background: theme === 'light' ? '#f9f9ff' : '#1e1e35',
                border: `1px solid ${border}`,
                display: 'grid',
                gridTemplateColumns: '120px 1fr 1fr 100px',
                gap: 12,
                alignItems: 'center',
                fontSize: 13,
              }}
            >
              <div style={{ color: textMuted, fontSize: 12 }}>
                {new Date(h.timestamp).toLocaleTimeString()}
              </div>
              <div>
                <div style={{ color: '#6c5ce7', fontWeight: 600 }}>A: {formatMs(h.statsA.mean)}</div>
                <div style={{ fontSize: 11, color: textMuted }}>std {formatMs(h.statsA.stdDev)}</div>
              </div>
              <div>
                <div style={{ color: '#00b894', fontWeight: 600 }}>B: {formatMs(h.statsB.mean)}</div>
                <div style={{ fontSize: 11, color: textMuted }}>std {formatMs(h.statsB.stdDev)}</div>
              </div>
              <div style={{ textAlign: 'right' }}>
                <div
                  style={{
                    display: 'inline-block',
                    padding: '3px 8px',
                    borderRadius: 6,
                    background:
                      h.winner === 'Tie'
                        ? theme === 'light' ? '#eee' : '#333'
                        : h.winner === 'A'
                        ? 'rgba(108,92,231,0.2)'
                        : 'rgba(0,184,148,0.2)',
                    color:
                      h.winner === 'Tie'
                        ? 'inherit'
                        : h.winner === 'A'
                        ? '#6c5ce7'
                        : '#00b894',
                    fontWeight: 600,
                    fontSize: 12,
                  }}
                >
                  {h.winner === 'Tie' ? '平局' : `${h.winner} 胜 ${h.improvement.toFixed(1)}%`}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
