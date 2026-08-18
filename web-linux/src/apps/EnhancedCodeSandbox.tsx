import { useState, useCallback, useRef, type CSSProperties } from 'react'

interface ConsoleEntry {
  id: string
  type: 'log' | 'error' | 'warn' | 'info'
  content: string
  timestamp: number
}

interface ExecutionResult {
  success: boolean
  output: ConsoleEntry[]
  duration: number
}

const btnStyle: CSSProperties = {
  background: 'rgba(255,255,255,0.08)',
  color: '#fff',
  border: '1px solid rgba(255,255,255,0.18)',
  borderRadius: 6,
  padding: '5px 12px',
  fontSize: 12,
  cursor: 'pointer',
}

const TEMPLATES: Record<string, { label: string; code: string }> = {
  'array': {
    label: '数组方法',
    code: `const arr = [3, 1, 4, 1, 5, 9, 2, 6];
console.log('map:', arr.map(x => x * 2));
console.log('filter:', arr.filter(x => x % 2 === 0));
console.log('reduce sum:', arr.reduce((a, x) => a + x, 0));
console.log('sorted:', [...arr].sort((a, b) => a - b));
console.log('find > 4:', arr.find(x => x > 4));
console.log('unique:', [...new Set(arr)]);`,
  },
  'async': {
    label: '异步编程',
    code: `async function demo() {
  const start = Date.now();
  const p1 = new Promise(r => setTimeout(() => r('A'), 50));
  const p2 = new Promise(r => setTimeout(() => r('B'), 30));
  const [a, b] = await Promise.all([p1, p2]);
  console.log('results:', a, b);
  console.log('took:', Date.now() - start, 'ms');
}
demo().catch(e => console.error(e));`,
  },
  'math': {
    label: '数学计算',
    code: `function fib(n) {
  if (n < 2) return n;
  return fib(n - 1) + fib(n - 2);
}
console.log('fib(10):', fib(10));
console.log('fib(15):', fib(15));
const primes = [];
for (let i = 2; i < 50; i++) {
  let isPrime = true;
  for (let j = 2; j * j <= i; j++) {
    if (i % j === 0) { isPrime = false; break; }
  }
  if (isPrime) primes.push(i);
}
console.log('primes < 50:', primes);`,
  },
  'dom': {
    label: 'DOM 操作',
    code: `document.body.style.background = '#f0f2f5';
const count = document.querySelectorAll('*').length;
console.log('页面元素数:', count);
const title = document.querySelector('title');
console.log('标题:', title ? title.textContent : 'none');`,
  },
}

const METHOD_TEMPLATES = Object.entries(TEMPLATES).map(([key, t]) => ({ key, ...t }))

export default function EnhancedCodeSandbox() {
  const [code, setCode] = useState<string>(TEMPLATES['array'].code)
  const [output, setOutput] = useState<ConsoleEntry[]>([])
  const [isRunning, setIsRunning] = useState(false)
  const [lastResult, setLastResult] = useState<ExecutionResult | null>(null)
  const iframeRef = useRef<HTMLIFrameElement>(null)

  const runCode = useCallback(() => {
    setIsRunning(true)
    setOutput([])
    const startTime = performance.now()
    const entries: ConsoleEntry[] = []

    try {
      const sandboxKey = '__ecs_console__'
      ;(window as unknown as Record<string, unknown>)[sandboxKey] = (type: string, ...args: unknown[]) => {
        const content = args.map((arg) => {
          if (typeof arg === 'object' && arg !== null) {
            try { return JSON.stringify(arg, null, 2) } catch { return String(arg) }
          }
          return String(arg)
        }).join(' ')
        entries.push({
          id: `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
          type: type as ConsoleEntry['type'],
          content,
          timestamp: Date.now(),
        })
        setOutput([...entries])
      }

      const wrappedCode = `
        const console = {
          log: (...a) => window.parent.${sandboxKey}('log', ...a),
          error: (...a) => window.parent.${sandboxKey}('error', ...a),
          warn: (...a) => window.parent.${sandboxKey}('warn', ...a),
          info: (...a) => window.parent.${sandboxKey}('info', ...a),
        };
        try {
          ${code}
        } catch(e) {
          console.error('错误:', e && e.message ? e.message : String(e));
        }
      `

      const iframe = iframeRef.current
      if (iframe && iframe.contentWindow) {
        const win = iframe.contentWindow as unknown as { eval: (c: string) => void }
        win.eval(wrappedCode)
      } else {
        entries.push({
          id: `${Date.now()}-no-frame`,
          type: 'error',
          content: '沙盒 iframe 未就绪',
          timestamp: Date.now(),
        })
      }

      setOutput([...entries])
      setLastResult({
        success: !entries.some((e) => e.type === 'error'),
        output: entries,
        duration: Math.round(performance.now() - startTime),
      })
    } catch (e) {
      const errMsg = e instanceof Error ? e.message : String(e)
      setOutput([{
        id: `${Date.now()}-fatal`,
        type: 'error',
        content: `严重错误: ${errMsg}`,
        timestamp: Date.now(),
      }])
      setLastResult({
        success: false,
        output: [],
        duration: Math.round(performance.now() - startTime),
      })
    } finally {
      setIsRunning(false)
    }
  }, [code])

  const clearOutput = useCallback(() => {
    setOutput([])
    setLastResult(null)
  }, [])

  const copyCode = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(code)
    } catch {
      // ignore
    }
  }, [code])

  const downloadCode = useCallback(() => {
    try {
      const blob = new Blob([code], { type: 'text/javascript' })
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = 'snippet.js'
      a.click()
      URL.revokeObjectURL(url)
    } catch {
      // ignore
    }
  }, [code])

  const loadTemplate = useCallback((key: string) => {
    const t = TEMPLATES[key]
    if (t) {
      setCode(t.code)
      setOutput([])
      setLastResult(null)
    }
  }, [])

  return (
    <div style={{
      display: 'flex', flexDirection: 'column', width: '100%', height: '100%',
      background: '#16162a', color: '#e0e0ff', fontFamily: 'system-ui, sans-serif',
    }}>
      <div style={{
        display: 'flex', alignItems: 'center', gap: 8, padding: '10px 14px',
        borderBottom: '1px solid rgba(255,255,255,0.08)',
      }}>
        <div style={{ fontWeight: 700, fontSize: 14 }}>🔒 增强代码沙盒</div>
        <div style={{ flex: 1 }} />
        <select
          value=""
          onChange={(e) => loadTemplate(e.target.value)}
          style={{
            background: 'rgba(255,255,255,0.08)', color: '#fff', border: '1px solid rgba(255,255,255,0.18)',
            borderRadius: 6, padding: '5px 10px', fontSize: 12,
          }}
        >
          <option value="">📚 加载模板</option>
          {METHOD_TEMPLATES.map((t) => (
            <option key={t.key} value={t.key}>{t.label}</option>
          ))}
        </select>
        <button onClick={copyCode} style={btnStyle}>📋 复制</button>
        <button onClick={downloadCode} style={btnStyle}>💾 下载</button>
        <button onClick={clearOutput} style={btnStyle}>🗑️ 清空</button>
        <button
          onClick={runCode}
          disabled={isRunning}
          style={{ ...btnStyle, background: isRunning ? '#555' : 'linear-gradient(135deg, #6366f1, #8b5cf6)' }}
        >
          {isRunning ? '⏳ 运行中' : '▶️ 运行代码'}
        </button>
      </div>

      <div style={{ display: 'flex', gap: 0, flex: 1, minHeight: 0 }}>
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minWidth: 0 }}>
          <textarea
            value={code}
            onChange={(e) => setCode(e.target.value)}
            spellCheck={false}
            placeholder="在这里输入 JavaScript 代码..."
            style={{
              flex: 1, width: '100%', padding: 14,
              background: '#0f0f1e', color: '#c8d8ff', border: 'none',
              fontFamily: 'Consolas, Monaco, monospace', fontSize: 13, lineHeight: 1.6,
              resize: 'none', outline: 'none',
            }}
          />
        </div>
        <div style={{ width: '50%', display: 'flex', flexDirection: 'column', borderLeft: '1px solid rgba(255,255,255,0.08)' }}>
          <div style={{
            padding: '8px 14px', borderBottom: '1px solid rgba(255,255,255,0.08)',
            display: 'flex', alignItems: 'center', gap: 8, fontSize: 12,
          }}>
            <span>📤 控制台输出</span>
            {lastResult && (
              <span style={{ color: '#8b5cf6' }}>
                ⏱️ {lastResult.duration.toFixed(0)}ms
              </span>
            )}
          </div>
          <div style={{
            flex: 1, padding: 10, overflow: 'auto',
            background: '#0a0a18', fontFamily: 'Consolas, Monaco, monospace', fontSize: 12,
          }}>
            {output.length === 0 ? (
              <div style={{ color: '#6b7280', fontStyle: 'italic' }}>点击"运行代码"开始执行...</div>
            ) : (
              output.map((entry) => (
                <div key={entry.id} style={{
                  padding: '3px 0',
                  color: entry.type === 'error' ? '#f87171'
                    : entry.type === 'warn' ? '#fbbf24'
                    : entry.type === 'info' ? '#60a5fa' : '#d1d5db',
                }}>
                  <span style={{ color: '#6b7280', marginRight: 6 }}>[{entry.type}]</span>
                  <span style={{ whiteSpace: 'pre-wrap' }}>{entry.content}</span>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      <iframe
        ref={iframeRef}
        sandbox="allow-scripts allow-same-origin"
        style={{
          position: 'absolute', width: 0, height: 0,
          border: 'none', visibility: 'hidden',
        }}
        title="sandbox"
      />
    </div>
  )
}
