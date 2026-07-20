import { useState, useEffect, useRef, useCallback, useMemo } from 'react'
import { Play, RotateCcw, Trash2, Code2, Globe, Clock, Terminal } from 'lucide-react'
import { useStore } from '../store'

// ─── Types ───────────────────────────────────────────────────────────────────

type Tab = 'javascript' | 'html'

interface ConsoleEntry {
  id: string
  type: 'log' | 'error' | 'warn' | 'info' | 'result'
  content: string
}

interface CodeTemplate {
  id: string
  name: string
  tab: Tab
  code: string
}

interface WorkerResult {
  success: boolean
  logs: Array<{ type: 'log' | 'error' | 'warn' | 'info' | 'result'; content: string }>
  error?: string
}

interface ThemeColors {
  bg: string
  bgSecondary: string
  bgTertiary: string
  bgElevated: string
  border: string
  borderSubtle: string
  text: string
  textSecondary: string
  textMuted: string
  accent: string
  accentDim: string
  accentText: string
  error: string
  warn: string
  info: string
  result: string
  editorBg: string
  editorText: string
}

// ─── Storage Keys ────────────────────────────────────────────────────────────

const STORAGE_KEY_JS = 'online-compiler:js'
const STORAGE_KEY_HTML = 'online-compiler:html'
const EXECUTION_TIMEOUT_MS = 3000

// ─── Default Code ────────────────────────────────────────────────────────────

const DEFAULT_JS = `// 在线代码编译器 - JavaScript
// 按 Ctrl+Enter 运行代码

console.log("Hello, Online Compiler!");

// 基本运算
const numbers = [1, 2, 3, 4, 5];
const sum = numbers.reduce((a, b) => a + b, 0);
const doubled = numbers.map(n => n * 2);

console.log("Sum:", sum);
console.log("Doubled:", doubled);
`

const DEFAULT_HTML = `<!DOCTYPE html>
<html>
<head>
<style>
  body {
    margin: 0;
    min-height: 100vh;
    display: flex;
    align-items: center;
    justify-content: center;
    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
    color: #fff;
    font-family: system-ui, sans-serif;
  }
  .card {
    background: rgba(255, 255, 255, 0.15);
    backdrop-filter: blur(20px);
    padding: 2rem 3rem;
    border-radius: 1rem;
    text-align: center;
    border: 1px solid rgba(255, 255, 255, 0.2);
  }
  h1 { margin: 0 0 0.5em; }
  button {
    margin-top: 1rem;
    padding: 0.6em 1.4em;
    border: none;
    border-radius: 999px;
    background: #fff;
    color: #764ba2;
    font-weight: 700;
    cursor: pointer;
  }
</style>
</head>
<body>
  <div class="card">
    <h1>Hello, HTML/CSS!</h1>
    <p>实时预览演示</p>
    <button onclick="alert('Clicked!')">点击我</button>
  </div>
</body>
</html>`

// ─── Code Templates ──────────────────────────────────────────────────────────

const TEMPLATES: CodeTemplate[] = [
  {
    id: 'js-hello',
    name: 'JS: Hello World',
    tab: 'javascript',
    code: `// Hello World 示例
console.log("Hello, Online Compiler!");

// 基本运算
const a = 10, b = 20;
console.log("a + b =", a + b);
console.log("a * b =", a * b);

// 字符串操作
console.log("Welcome".toUpperCase());
console.log("length:", "WebLinuxOS".length);`,
  },
  {
    id: 'js-fibonacci',
    name: 'JS: 斐波那契',
    tab: 'javascript',
    code: `// 斐波那契数列
function fibonacci(n) {
  if (n <= 1) return n;
  let a = 0, b = 1;
  for (let i = 2; i <= n; i++) {
    [a, b] = [b, a + b];
  }
  return b;
}

// 生成前 10 项
const sequence = [];
for (let i = 0; i < 10; i++) {
  sequence.push(fibonacci(i));
}
console.log("斐波那契数列:", sequence.join(", "));

// 数组操作
const doubled = sequence.map(n => n * 2);
const sum = sequence.reduce((a, b) => a + b, 0);
console.log("翻倍:", doubled);
console.log("求和:", sum);`,
  },
  {
    id: 'js-array',
    name: 'JS: 数组操作',
    tab: 'javascript',
    code: `// 数组高阶函数示例
const numbers = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10];

// filter - 过滤偶数
const evens = numbers.filter(n => n % 2 === 0);
console.log("偶数:", evens);

// map - 平方
const squared = numbers.map(n => n * n);
console.log("平方:", squared);

// reduce - 求和
const total = numbers.reduce((acc, n) => acc + n, 0);
console.log("总和:", total);

// 对象数组
const users = [
  { name: "Alice", age: 25 },
  { name: "Bob", age: 30 },
  { name: "Charlie", age: 35 }
];
const names = users.map(u => u.name);
console.log("用户名:", names);`,
  },
  {
    id: 'html-card',
    name: 'HTML: 渐变卡片',
    tab: 'html',
    code: `<!DOCTYPE html>
<html>
<head>
<style>
  body {
    margin: 0;
    min-height: 100vh;
    display: flex;
    align-items: center;
    justify-content: center;
    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
    font-family: system-ui, sans-serif;
  }
  .card {
    background: rgba(255, 255, 255, 0.15);
    backdrop-filter: blur(20px);
    padding: 2rem 3rem;
    border-radius: 1rem;
    box-shadow: 0 10px 40px rgba(0, 0, 0, 0.3);
    text-align: center;
    color: white;
    border: 1px solid rgba(255, 255, 255, 0.2);
  }
  h1 { margin: 0 0 0.5em; font-size: 2rem; }
  p { margin: 0; opacity: 0.9; }
  button {
    margin-top: 1rem;
    padding: 0.6em 1.4em;
    border: none;
    border-radius: 999px;
    background: white;
    color: #764ba2;
    font-weight: 700;
    cursor: pointer;
    transition: transform 0.2s;
  }
  button:hover { transform: translateY(-2px); }
</style>
</head>
<body>
  <div class="card">
    <h1>Hello, World!</h1>
    <p>HTML/CSS 实时预览演示</p>
    <button onclick="alert('Clicked!')">点击我</button>
  </div>
</body>
</html>`,
  },
  {
    id: 'html-grid',
    name: 'HTML: 网格布局',
    tab: 'html',
    code: `<!DOCTYPE html>
<html>
<head>
<style>
  * { margin: 0; padding: 0; box-sizing: border-box; }
  body {
    font-family: system-ui, sans-serif;
    background: #1e1e2e;
    color: #cdd6f4;
    padding: 2rem;
  }
  h1 { margin-bottom: 1.5rem; color: #a6e3a1; }
  .grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
    gap: 1rem;
  }
  .item {
    background: #313244;
    padding: 1.5rem;
    border-radius: 0.75rem;
    border-left: 4px solid #a6e3a1;
    transition: transform 0.2s;
  }
  .item:hover { transform: translateY(-4px); }
  .item h3 { color: #a6e3a1; margin-bottom: 0.5rem; }
  .item p { color: #a6adc8; font-size: 0.9rem; }
</style>
</head>
<body>
  <h1>特性卡片</h1>
  <div class="grid">
    <div class="item"><h3>快速</h3><p>毫秒级响应</p></div>
    <div class="item"><h3>简单</h3><p>易于使用</p></div>
    <div class="item"><h3>强大</h3><p>功能丰富</p></div>
    <div class="item"><h3>美观</h3><p>现代设计</p></div>
  </div>
</body>
</html>`,
  },
]

// ─── Web Worker Code (timeout-protected execution via new Function) ───────────

const WORKER_CODE = `
self.onmessage = function(e) {
  var code = e.data;
  var logs = [];

  var capture = function(type, args) {
    var parts = [];
    for (var i = 0; i < args.length; i++) {
      var a = args[i];
      if (a === null) parts.push('null');
      else if (a === undefined) parts.push('undefined');
      else if (typeof a === 'object') {
        try { parts.push(JSON.stringify(a, null, 2)); }
        catch (err) { parts.push(String(a)); }
      } else {
        parts.push(String(a));
      }
    }
    logs.push({ type: type, content: parts.join(' ') });
  };

  console.log = function() { capture('log', arguments); };
  console.error = function() { capture('error', arguments); };
  console.warn = function() { capture('warn', arguments); };
  console.info = function() { capture('info', arguments); };

  try {
    var fn = new Function(code);
    var result = fn();

    var finish = function(r) {
      if (r !== undefined && r !== null) {
        var s;
        if (typeof r === 'object') {
          try { s = JSON.stringify(r, null, 2); } catch (e) { s = String(r); }
        } else {
          s = String(r);
        }
        logs.push({ type: 'result', content: s });
      }
      self.postMessage({ success: true, logs: logs });
    };

    if (result && typeof result.then === 'function') {
      result.then(finish).catch(function(err) {
        self.postMessage({
          success: false,
          error: err.name + ': ' + err.message,
          logs: logs
        });
      });
    } else {
      finish(result);
    }
  } catch (err) {
    self.postMessage({
      success: false,
      error: err.name + ': ' + err.message,
      logs: logs
    });
  }
};
`

// ─── Main Component ──────────────────────────────────────────────────────────

export default function OnlineCompiler() {
  const theme = useStore((state) => state.theme)

  const [activeTab, setActiveTab] = useState<Tab>('javascript')
  const [jsCode, setJsCode] = useState<string>(() => {
    try {
      return localStorage.getItem(STORAGE_KEY_JS) ?? DEFAULT_JS
    } catch {
      return DEFAULT_JS
    }
  })
  const [htmlCode, setHtmlCode] = useState<string>(() => {
    try {
      return localStorage.getItem(STORAGE_KEY_HTML) ?? DEFAULT_HTML
    } catch {
      return DEFAULT_HTML
    }
  })
  const [consoleEntries, setConsoleEntries] = useState<ConsoleEntry[]>([])
  const [isRunning, setIsRunning] = useState<boolean>(false)
  const [executionTime, setExecutionTime] = useState<number | null>(null)

  const textareaRef = useRef<HTMLTextAreaElement>(null)
  const lineNumbersRef = useRef<HTMLDivElement>(null)
  const consoleEndRef = useRef<HTMLDivElement>(null)

  // Auto-save to localStorage
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY_JS, jsCode)
    } catch {
      // ignore storage errors gracefully
    }
  }, [jsCode])

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY_HTML, htmlCode)
    } catch {
      // ignore storage errors gracefully
    }
  }, [htmlCode])

  // Auto-scroll console to bottom
  useEffect(() => {
    consoleEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [consoleEntries])

  const addEntry = useCallback((type: ConsoleEntry['type'], content: string): void => {
    setConsoleEntries((prev) => [
      ...prev,
      {
        id: `entry-${Date.now()}-${Math.random().toString(36).slice(2)}`,
        type,
        content,
      },
    ])
  }, [])

  const clearConsole = useCallback((): void => {
    setConsoleEntries([])
    setExecutionTime(null)
  }, [])

  // Run JavaScript with timeout protection via Web Worker
  const runJavaScript = useCallback(
    async (code: string): Promise<void> => {
      setIsRunning(true)
      addEntry('info', '▶ Running JavaScript...')

      const startTime = performance.now()
      let worker: Worker | null = null
      let workerUrl: string | null = null

      try {
        const blob = new Blob([WORKER_CODE], { type: 'application/javascript' })
        workerUrl = URL.createObjectURL(blob)
        worker = new Worker(workerUrl)

        const result = await new Promise<WorkerResult>((resolve) => {
          const timeoutId = window.setTimeout(() => {
            if (worker) {
              worker.terminate()
            }
            resolve({
              success: false,
              error: `执行超时 (${EXECUTION_TIMEOUT_MS}ms)`,
              logs: [],
            })
          }, EXECUTION_TIMEOUT_MS)

          worker!.onmessage = (e: MessageEvent<WorkerResult>) => {
            window.clearTimeout(timeoutId)
            resolve(e.data)
          }

          worker!.onerror = () => {
            window.clearTimeout(timeoutId)
            resolve({
              success: false,
              error: 'Worker 执行错误',
              logs: [],
            })
          }

          worker!.postMessage(code)
        })

        const elapsed = Math.round(performance.now() - startTime)
        setExecutionTime(elapsed)

        result.logs.forEach((log) => {
          addEntry(log.type, log.content)
        })

        if (result.success) {
          addEntry('info', `✓ 执行完成 (${elapsed}ms)`)
        } else if (result.error) {
          addEntry('error', result.error)
        }
      } catch (err) {
        const elapsed = Math.round(performance.now() - startTime)
        setExecutionTime(elapsed)
        const message = err instanceof Error ? `${err.name}: ${err.message}` : String(err)
        addEntry('error', message)
      } finally {
        if (worker) {
          worker.terminate()
        }
        if (workerUrl) {
          URL.revokeObjectURL(workerUrl)
        }
        setIsRunning(false)
      }
    },
    [addEntry]
  )

  const runCode = useCallback((): void => {
    if (isRunning) return
    if (activeTab === 'javascript') {
      void runJavaScript(jsCode)
    } else {
      // HTML/CSS preview is live; just acknowledge
      addEntry('info', '▶ HTML/CSS 预览已更新')
      setExecutionTime(0)
    }
  }, [activeTab, jsCode, isRunning, runJavaScript, addEntry])

  // Ctrl+Enter to run code
  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLDivElement>): void => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
        e.preventDefault()
        runCode()
      }
    },
    [runCode]
  )

  // Tab key inserts 2 spaces in textarea
  const handleTextareaKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLTextAreaElement>): void => {
      if (e.key === 'Tab') {
        e.preventDefault()
        const textarea = e.currentTarget
        const start = textarea.selectionStart
        const end = textarea.selectionEnd
        const value = textarea.value
        const newValue = value.substring(0, start) + '  ' + value.substring(end)
        if (activeTab === 'javascript') {
          setJsCode(newValue)
        } else {
          setHtmlCode(newValue)
        }
        requestAnimationFrame(() => {
          textarea.selectionStart = textarea.selectionEnd = start + 2
        })
      }
    },
    [activeTab]
  )

  // Sync line numbers scroll with textarea
  const handleScroll = useCallback((e: React.UIEvent<HTMLTextAreaElement>): void => {
    if (lineNumbersRef.current) {
      lineNumbersRef.current.scrollTop = e.currentTarget.scrollTop
    }
  }, [])

  const loadTemplate = useCallback((template: CodeTemplate): void => {
    setActiveTab(template.tab)
    if (template.tab === 'javascript') {
      setJsCode(template.code)
    } else {
      setHtmlCode(template.code)
    }
    setConsoleEntries([])
    setExecutionTime(null)
  }, [])

  const resetCode = useCallback((): void => {
    if (activeTab === 'javascript') {
      setJsCode(DEFAULT_JS)
    } else {
      setHtmlCode(DEFAULT_HTML)
    }
    setConsoleEntries([])
    setExecutionTime(null)
  }, [activeTab])

  const currentCode = activeTab === 'javascript' ? jsCode : htmlCode
  const setCurrentCode = activeTab === 'javascript' ? setJsCode : setHtmlCode

  const lineCount = useMemo(() => currentCode.split('\n').length, [currentCode])

  // Theme-aware colors
  const isDark = theme === 'dark'
  const colors: ThemeColors = isDark
    ? {
        bg: '#1e1e2e',
        bgSecondary: '#181825',
        bgTertiary: '#313244',
        bgElevated: '#45475a',
        border: '#45475a',
        borderSubtle: '#313244',
        text: '#cdd6f4',
        textSecondary: '#a6adc8',
        textMuted: '#6c7086',
        accent: '#a6e3a1',
        accentDim: 'rgba(166, 227, 161, 0.15)',
        accentText: '#1e1e2e',
        error: '#f38ba8',
        warn: '#fab387',
        info: '#89b4fa',
        result: '#cba6f7',
        editorBg: '#1e1e2e',
        editorText: '#cdd6f4',
      }
    : {
        bg: '#ffffff',
        bgSecondary: '#f5f5f5',
        bgTertiary: '#ebebeb',
        bgElevated: '#e0e0e0',
        border: '#d0d0d0',
        borderSubtle: '#e8e8e8',
        text: '#1f2328',
        textSecondary: '#656d76',
        textMuted: '#b1bac4',
        accent: '#40a02b',
        accentDim: 'rgba(64, 160, 43, 0.12)',
        accentText: '#ffffff',
        error: '#d20f39',
        warn: '#df8e1d',
        info: '#1e66f5',
        result: '#8839ef',
        editorBg: '#1e1e2e',
        editorText: '#cdd6f4',
      }

  const c = colors

  const entryColor = (type: ConsoleEntry['type']): string => {
    switch (type) {
      case 'error':
        return c.error
      case 'warn':
        return c.warn
      case 'info':
        return c.info
      case 'result':
        return c.result
      default:
        return c.text
    }
  }

  const entryPrefix = (type: ConsoleEntry['type']): string => {
    switch (type) {
      case 'error':
        return '✕'
      case 'warn':
        return '⚠'
      case 'info':
        return 'ℹ'
      case 'result':
        return '←'
      default:
        return '›'
    }
  }

  return (
    <div
      onKeyDown={handleKeyDown}
      tabIndex={0}
      style={{
        display: 'flex',
        flexDirection: 'column',
        height: '100%',
        width: '100%',
        background: c.bg,
        color: c.text,
        fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", system-ui, sans-serif',
        overflow: 'hidden',
        outline: 'none',
      }}
    >
      {/* ─── Top Bar ─────────────────────────────────────────────────── */}
      <header
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '0 12px',
          height: 48,
          background: c.bgSecondary,
          borderBottom: `1px solid ${c.borderSubtle}`,
          flexShrink: 0,
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <Code2 size={20} color={c.accent} />
          <span style={{ fontSize: 14, fontWeight: 700 }}>在线编译器</span>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <button
            onClick={runCode}
            disabled={isRunning}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 6,
              padding: '6px 16px',
              border: 'none',
              background: isRunning ? c.accentDim : c.accent,
              color: isRunning ? c.accent : c.accentText,
              fontSize: 13,
              fontWeight: 700,
              borderRadius: 6,
              cursor: isRunning ? 'not-allowed' : 'pointer',
              opacity: isRunning ? 0.7 : 1,
            }}
          >
            <Play size={14} fill="currentColor" />
            {isRunning ? '运行中...' : '运行'}
          </button>
          <span style={{ fontSize: 11, color: c.textMuted }}>Ctrl+Enter</span>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
          <button
            onClick={resetCode}
            title="重置代码"
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              width: 32,
              height: 32,
              border: 'none',
              background: 'transparent',
              color: c.textSecondary,
              borderRadius: 6,
              cursor: 'pointer',
            }}
          >
            <RotateCcw size={16} />
          </button>
        </div>
      </header>

      {/* ─── Language Tabs ───────────────────────────────────────────── */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          background: c.bgSecondary,
          borderBottom: `1px solid ${c.borderSubtle}`,
          flexShrink: 0,
        }}
      >
        <button
          onClick={() => setActiveTab('javascript')}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 6,
            padding: '10px 16px',
            border: 'none',
            borderBottom:
              activeTab === 'javascript' ? `2px solid ${c.accent}` : '2px solid transparent',
            background: activeTab === 'javascript' ? c.bg : 'transparent',
            color: activeTab === 'javascript' ? c.accent : c.textSecondary,
            fontSize: 13,
            fontWeight: 600,
            cursor: 'pointer',
          }}
        >
          <Terminal size={14} />
          JavaScript
        </button>
        <button
          onClick={() => setActiveTab('html')}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 6,
            padding: '10px 16px',
            border: 'none',
            borderBottom: activeTab === 'html' ? `2px solid ${c.accent}` : '2px solid transparent',
            background: activeTab === 'html' ? c.bg : 'transparent',
            color: activeTab === 'html' ? c.accent : c.textSecondary,
            fontSize: 13,
            fontWeight: 600,
            cursor: 'pointer',
          }}
        >
          <Globe size={14} />
          HTML/CSS
        </button>
      </div>

      {/* ─── Templates ───────────────────────────────────────────────── */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 8,
          padding: '8px 12px',
          background: c.bgTertiary,
          borderBottom: `1px solid ${c.borderSubtle}`,
          overflowX: 'auto',
          flexShrink: 0,
        }}
      >
        <span style={{ fontSize: 12, color: c.textMuted, whiteSpace: 'nowrap' }}>示例:</span>
        {TEMPLATES.map((tpl) => (
          <button
            key={tpl.id}
            onClick={() => loadTemplate(tpl)}
            style={{
              padding: '4px 10px',
              border: `1px solid ${c.border}`,
              background: c.bgSecondary,
              color: c.textSecondary,
              fontSize: 12,
              borderRadius: 4,
              cursor: 'pointer',
              whiteSpace: 'nowrap',
            }}
          >
            {tpl.name}
          </button>
        ))}
      </div>

      {/* ─── Main Body ───────────────────────────────────────────────── */}
      <div
        style={{
          display: 'flex',
          flex: 1,
          overflow: 'hidden',
          minHeight: 0,
        }}
      >
        {/* Editor Area */}
        <div
          style={{
            flex: 1,
            display: 'flex',
            flexDirection: 'column',
            minWidth: 0,
            overflow: 'hidden',
          }}
        >
          <div style={{ display: 'flex', flex: 1, overflow: 'hidden', minHeight: 0 }}>
            {/* Line Numbers */}
            <div
              ref={lineNumbersRef}
              style={{
                width: 44,
                padding: '12px 8px 12px 0',
                textAlign: 'right',
                fontFamily: '"JetBrains Mono", "Fira Code", "Consolas", monospace',
                fontSize: 13,
                lineHeight: 1.6,
                color: c.textMuted,
                background: c.editorBg,
                overflow: 'hidden',
                userSelect: 'none',
                flexShrink: 0,
              }}
            >
              {Array.from({ length: lineCount }, (_, i) => i + 1).map((n) => (
                <div key={n} style={{ height: '1.6em' }}>
                  {n}
                </div>
              ))}
            </div>
            {/* Code Textarea */}
            <textarea
              ref={textareaRef}
              value={currentCode}
              onChange={(e) => setCurrentCode(e.target.value)}
              onKeyDown={handleTextareaKeyDown}
              onScroll={handleScroll}
              spellCheck={false}
              autoCapitalize="off"
              autoCorrect="off"
              style={{
                flex: 1,
                padding: '12px 16px',
                background: c.editorBg,
                color: c.editorText,
                border: 'none',
                outline: 'none',
                resize: 'none',
                fontFamily: '"JetBrains Mono", "Fira Code", "Consolas", monospace',
                fontSize: 13,
                lineHeight: 1.6,
                tabSize: 2,
                whiteSpace: 'pre',
                overflow: 'auto',
              }}
            />
          </div>
        </div>

        {/* Output / Preview Panel */}
        <div
          style={{
            width: 380,
            display: 'flex',
            flexDirection: 'column',
            borderLeft: `1px solid ${c.borderSubtle}`,
            overflow: 'hidden',
            flexShrink: 0,
          }}
        >
          {activeTab === 'javascript' ? (
            <>
              {/* Console Header */}
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: '0 12px',
                  height: 36,
                  background: c.bgSecondary,
                  borderBottom: `1px solid ${c.borderSubtle}`,
                  flexShrink: 0,
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  <Terminal size={14} color={c.textSecondary} />
                  <span style={{ fontSize: 12, fontWeight: 600, color: c.textSecondary }}>
                    控制台
                  </span>
                  {isRunning && (
                    <span
                      style={{
                        width: 6,
                        height: 6,
                        background: c.accent,
                        borderRadius: '50%',
                        animation: 'oc-pulse 1s ease-in-out infinite',
                      }}
                    />
                  )}
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  {executionTime !== null && (
                    <span
                      style={{
                        fontSize: 11,
                        color: c.textMuted,
                        display: 'flex',
                        alignItems: 'center',
                        gap: 4,
                      }}
                    >
                      <Clock size={11} />
                      {executionTime}ms
                    </span>
                  )}
                  <button
                    onClick={clearConsole}
                    title="清空控制台"
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 4,
                      padding: '3px 8px',
                      border: 'none',
                      background: 'transparent',
                      color: c.textMuted,
                      fontSize: 11,
                      borderRadius: 4,
                      cursor: 'pointer',
                    }}
                  >
                    <Trash2 size={12} />
                    清空
                  </button>
                </div>
              </div>
              {/* Console Body */}
              <div
                style={{
                  flex: 1,
                  padding: '8px 0',
                  overflowY: 'auto',
                  fontFamily: '"JetBrains Mono", "Fira Code", "Consolas", monospace',
                  fontSize: 12,
                }}
              >
                {consoleEntries.length === 0 ? (
                  <div style={{ padding: '12px 16px', color: c.textMuted, fontSize: 12 }}>
                    &gt;_ 控制台输出将显示在此处
                  </div>
                ) : (
                  consoleEntries.map((entry) => (
                    <div
                      key={entry.id}
                      style={{
                        display: 'flex',
                        alignItems: 'flex-start',
                        gap: 8,
                        padding: '3px 16px',
                        lineHeight: 1.5,
                        color: entryColor(entry.type),
                      }}
                    >
                      <span
                        style={{ flexShrink: 0, width: 14, textAlign: 'center' }}
                      >
                        {entryPrefix(entry.type)}
                      </span>
                      <span style={{ whiteSpace: 'pre-wrap', wordBreak: 'break-word' }}>
                        {entry.content}
                      </span>
                    </div>
                  ))
                )}
                <div ref={consoleEndRef} />
              </div>
            </>
          ) : (
            <>
              {/* Preview Header */}
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: '0 12px',
                  height: 36,
                  background: c.bgSecondary,
                  borderBottom: `1px solid ${c.borderSubtle}`,
                  flexShrink: 0,
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  <Globe size={14} color={c.textSecondary} />
                  <span style={{ fontSize: 12, fontWeight: 600, color: c.textSecondary }}>
                    预览
                  </span>
                </div>
                <div style={{ display: 'flex', gap: 5 }}>
                  <span style={{ width: 8, height: 8, borderRadius: '50%', background: '#ff5f57' }} />
                  <span style={{ width: 8, height: 8, borderRadius: '50%', background: '#febc2e' }} />
                  <span style={{ width: 8, height: 8, borderRadius: '50%', background: '#28c840' }} />
                </div>
              </div>
              {/* Preview Body */}
              <div style={{ flex: 1, background: '#fff', overflow: 'hidden' }}>
                <iframe
                  srcDoc={htmlCode}
                  title="预览"
                  sandbox="allow-scripts allow-modals"
                  style={{
                    width: '100%',
                    height: '100%',
                    border: 'none',
                  }}
                />
              </div>
            </>
          )}
        </div>
      </div>

      {/* ─── Status Bar ──────────────────────────────────────────────── */}
      <footer
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          height: 24,
          padding: '0 12px',
          background: c.bgSecondary,
          borderTop: `1px solid ${c.borderSubtle}`,
          fontSize: 11,
          color: c.textMuted,
          flexShrink: 0,
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <span
            style={{
              width: 6,
              height: 6,
              borderRadius: '50%',
              background: isRunning ? c.warn : c.accent,
            }}
          />
          <span>{isRunning ? '运行中...' : '就绪'}</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <span>{activeTab === 'javascript' ? 'JavaScript' : 'HTML/CSS'}</span>
          <span>UTF-8</span>
          <span>Ctrl+Enter 运行</span>
        </div>
      </footer>

      <style>{`
        @keyframes oc-pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.3; }
        }
      `}</style>
    </div>
  )
}
