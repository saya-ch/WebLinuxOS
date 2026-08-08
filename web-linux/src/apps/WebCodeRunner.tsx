import { useState, useEffect, useRef, useCallback } from 'react'

interface ConsoleEntry {
  id: number
  type: 'log' | 'error' | 'warn' | 'info'
  content: string
  time: string
}

interface Snippet {
  id: string
  title: string
  code: string
  description: string
}

const DEFAULT_CODE = `// 欢迎使用 WebCodeRunner - 浏览器内代码执行环境
// 支持标准 JavaScript 语法，可直接访问浏览器 API

// 计算斐波那契数列
function fibonacci(n) {
  if (n <= 1) return n;
  return fibonacci(n - 1) + fibonacci(n - 2);
}

console.log('斐波那契数列前10项:');
for (let i = 0; i < 10; i++) {
  console.log(\`fib(\${i}) = \${fibonacci(i)}\`);
}

// 数组操作
const numbers = [3, 1, 4, 1, 5, 9, 2, 6, 5, 3, 5];
const sorted = [...numbers].sort((a, b) => a - b);
const unique = [...new Set(sorted)];
const sum = numbers.reduce((a, b) => a + b, 0);

console.log('\\n数组分析:');
console.log('原始数组:', numbers);
console.log('排序后:', sorted);
console.log('去重后:', unique);
console.log('总和:', sum);

// 异步操作示例
async function fetchData() {
  try {
    const response = await fetch('https://api.github.com/repos/saya-ch/WebLinuxOS');
    const data = await response.json();
    console.log('\\nGitHub 仓库信息:');
    console.log('名称:', data.full_name);
    console.log('Star 数:', data.stargazers_count);
    console.log('描述:', data.description);
  } catch (err) {
    console.error('请求失败:', err.message);
  }
}

fetchData();`

const SNIPPETS: Snippet[] = [
  {
    id: 'fibonacci',
    title: '斐波那契数列',
    description: '递归与迭代实现',
    code: `// 斐波那契数列
function fib(n) {
  if (n <= 1) return n;
  return fib(n - 1) + fib(n - 2);
}

// 输出前20项
for (let i = 0; i < 20; i++) {
  process.stdout.write(fib(i) + ' ');
}
console.log();`,
  },
  {
    id: 'sorting',
    title: '排序算法对比',
    description: '快速排序、归并排序、冒泡排序',
    code: `// 排序算法对比
const arr = [64, 34, 25, 12, 22, 11, 90];

// 快速排序
function quickSort(arr) {
  if (arr.length <= 1) return arr;
  const pivot = arr[0];
  const left = arr.slice(1).filter(x => x < pivot);
  const right = arr.slice(1).filter(x => x >= pivot);
  return [...quickSort(left), pivot, ...quickSort(right)];
}

// 归并排序
function mergeSort(arr) {
  if (arr.length <= 1) return arr;
  const mid = Math.floor(arr.length / 2);
  const left = mergeSort(arr.slice(0, mid));
  const right = mergeSort(arr.slice(mid));
  return merge(left, right);
}

function merge(left, right) {
  const result = [];
  let i = 0, j = 0;
  while (i < left.length && j < right.length) {
    if (left[i] <= right[j]) result.push(left[i++]);
    else result.push(right[j++]);
  }
  return [...result, ...left.slice(i), ...right.slice(j)];
}

// 性能测试
const testData = Array.from({length: 1000}, () => Math.random() * 10000);

console.time('快速排序');
const qs = quickSort([...testData]);
console.timeEnd('快速排序');

console.time('归并排序');
const ms = mergeSort([...testData]);
console.timeEnd('归并排序');

console.log('数组长度:', arr.length);`,
  },
  {
    id: 'fetch-api',
    title: 'API 请求示例',
    description: '调用公开 API 获取数据',
    code: `// 调用公开 API
async function fetchWeather(city) {
  try {
    const url = \`https://wttr.in/\${encodeURIComponent(city)}?format=j1\`;
    const response = await fetch(url);
    const data = await response.json();
    const current = data.current_condition[0];
    console.log(\`城市: \${city}\`);
    console.log(\`温度: \${current.temp_C}°C\`);
    console.log(\`天气: \${current.weatherDesc[0].value}\`);
    console.log(\`湿度: \${current.humidity}%\`);
  } catch (err) {
    console.error('请求失败:', err.message);
  }
}

fetchWeather('Beijing');
fetchWeather('Shanghai');`,
  },
  {
    id: 'dom-manipulation',
    title: 'DOM 操作',
    description: '浏览器 DOM 操作示例',
    code: `// DOM 操作示例
// 创建元素
const div = document.createElement('div');
div.style.cssText = 'padding: 20px; background: linear-gradient(135deg, #667eea, #764ba2); color: white; border-radius: 12px;';
div.innerHTML = '<h2>Hello from WebCodeRunner!</h2><p>当前时间: ' + new Date().toLocaleString() + '</p>';

// 输出到控制台
console.log('DOM 元素已创建:', div);
console.log('元素信息:', {
  tag: div.tagName,
  className: div.className,
  childCount: div.children.length
});

// CSS 选择器
console.log('页面元素统计:');
console.log('- 标题数:', document.querySelectorAll('h1, h2, h3').length);
console.log('- 链接数:', document.querySelectorAll('a').length);
console.log('- 图片数:', document.querySelectorAll('img').length);`,
  },
  {
    id: 'promises',
    title: 'Promise 与 async',
    description: '异步编程示例',
    code: `// Promise 与 async/await
// 示例1: 顺序执行
async function sequentialDemo() {
  const start = Date.now();
  
  const result1 = await new Promise(resolve => {
    setTimeout(() => resolve('第一步完成'), 500);
  });
  console.log(result1);
  
  const result2 = await new Promise(resolve => {
    setTimeout(() => resolve('第二步完成'), 300);
  });
  console.log(result2);
  
  console.log('总耗时:', Date.now() - start, 'ms');
}

// 示例2: 并行执行
async function parallelDemo() {
  const start = Date.now();
  
  const [r1, r2, r3] = await Promise.all([
    new Promise(res => setTimeout(() => res('任务1'), 1000)),
    new Promise(res => setTimeout(() => res('任务2'), 1500)),
    new Promise(res => setTimeout(() => res('任务3'), 800)),
  ]);
  
  console.log('并行完成:', r1, r2, r3);
  console.log('总耗时:', Date.now() - start, 'ms (并行执行节省时间)');
}

// 示例3: Promise 竞速
async function raceDemo() {
  const result = await Promise.race([
    new Promise(res => setTimeout(() => res('快速获胜'), 100)),
    new Promise(res => setTimeout(() => res('慢速失败'), 5000)),
  ]);
  console.log('竞速结果:', result);
}

sequentialDemo();`,
  },
  {
    id: 'crypto',
    title: 'Web Crypto 加密',
    description: '使用 Web Crypto API',
    code: `// Web Crypto API 示例
async function cryptoDemo() {
  const text = 'Hello WebLinuxOS!';
  const encoder = new TextEncoder();
  const data = encoder.encode(text);
  
  // SHA-256 哈希
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const hashArray = new Uint8Array(hashBuffer);
  const hashHex = Array.from(hashArray)
    .map(b => b.toString(16).padStart(2, '0'))
    .join('');
  
  console.log('SHA-256 哈希:', hashHex);
  console.log('原始文本:', text);
  
  // 生成随机密钥
  const key = await crypto.subtle.generateKey(
    { name: 'AES-GCM', length: 256 },
    true,
    ['encrypt', 'decrypt']
  );
  
  console.log('AES-GCM 密钥对已生成');
  console.log('可用于:', key.usages.join(', '));
}

cryptoDemo().catch(console.error);`,
  },
]

const WebCodeRunner = () => {
  const [code, setCode] = useState(DEFAULT_CODE)
  const [consoleOutput, setConsoleOutput] = useState<ConsoleEntry[]>([])
  const [isRunning, setIsRunning] = useState(false)
  const [activeSnippet, setActiveSnippet] = useState<string | null>(null)
  const [autoRun, setAutoRun] = useState(false)
  const editorRef = useRef<HTMLTextAreaElement>(null)
  const outputRef = useRef<HTMLDivElement>(null)
  const nextIdRef = useRef(1)

  const appendOutput = useCallback((type: ConsoleEntry['type'], ...args: unknown[]) => {
    const time = new Date().toLocaleTimeString('zh-CN', { hour12: false })
    const entries: ConsoleEntry[] = args.map(arg => {
      let content: string
      if (typeof arg === 'string') {
        content = arg
      } else if (typeof arg === 'object' && arg !== null) {
        try {
          content = JSON.stringify(arg, null, 2)
        } catch {
          content = String(arg)
        }
      } else {
        content = String(arg)
      }
      return {
        id: nextIdRef.current++,
        type,
        content,
        time,
      }
    })
    setConsoleOutput(prev => [...prev, ...entries])
  }, [])

  const runCode = useCallback(() => {
    setIsRunning(true)
    setConsoleOutput([])
    nextIdRef.current = 1

    const customConsole = {
      log: (...args: unknown[]) => appendOutput('log', ...args),
      error: (...args: unknown[]) => appendOutput('error', ...args),
      warn: (...args: unknown[]) => appendOutput('warn', ...args),
      info: (...args: unknown[]) => appendOutput('info', ...args),
    }

    const timeoutId = setTimeout(() => {
      appendOutput('warn', '执行超时 (15秒)，可能存在无限循环')
      setIsRunning(false)
    }, 15000)

    try {
      const codeToRun = code
      const fn = new Function('console', `
        try {
          ${codeToRun}
        } catch(e) {
          console.error(e.message || e);
        }
      `)
      fn(customConsole)
    } catch (err) {
      appendOutput('error', String(err))
    } finally {
      clearTimeout(timeoutId)
      setIsRunning(false)
    }
  }, [code, appendOutput])

  useEffect(() => {
    if (outputRef.current) {
      outputRef.current.scrollTop = outputRef.current.scrollHeight
    }
  }, [consoleOutput])

  const loadSnippet = (snippet: Snippet) => {
    setCode(snippet.code)
    setActiveSnippet(snippet.id)
  }

  const clearOutput = () => {
    setConsoleOutput([])
    nextIdRef.current = 1
  }

  const formatConsoleStyle = (type: ConsoleEntry['type']) => {
    switch (type) {
      case 'error': return { color: '#ef4444', borderColor: 'rgba(239,68,68,0.3)' }
      case 'warn': return { color: '#f59e0b', borderColor: 'rgba(245,158,11,0.3)' }
      case 'info': return { color: '#3b82f6', borderColor: 'rgba(59,130,246,0.3)' }
      default: return { color: '#e2e8f0', borderColor: 'rgba(255,255,255,0.08)' }
    }
  }

  return (
    <div className="wcr-app">
      <div className="wcr-header">
        <div className="wcr-title">
          <span className="wcr-icon">{'{}'}</span>
          <div>
            <h1>WebCodeRunner</h1>
            <p>浏览器内 JavaScript 执行环境</p>
          </div>
        </div>
        <div className="wcr-actions">
          <label className="wcr-autorun">
            <input type="checkbox" checked={autoRun} onChange={e => setAutoRun(e.target.checked)} />
            <span>自动运行</span>
          </label>
          <button
            className={`wcr-run-btn ${isRunning ? 'running' : ''}`}
            onClick={runCode}
            disabled={isRunning}
          >
            {isRunning ? '执行中...' : '▶ 运行代码'}
          </button>
        </div>
      </div>

      <div className="wcr-body">
        <div className="wcr-sidebar">
          <div className="wcr-sidebar-section">
            <h3>预设代码片段</h3>
            {SNIPPETS.map(snippet => (
              <button
                key={snippet.id}
                className={`wcr-snippet ${activeSnippet === snippet.id ? 'active' : ''}`}
                onClick={() => loadSnippet(snippet)}
              >
                <span className="wcr-snippet-title">{snippet.title}</span>
                <span className="wcr-snippet-desc">{snippet.description}</span>
              </button>
            ))}
          </div>
          <div className="wcr-sidebar-section">
            <h3>快捷键</h3>
            <div className="wcr-hint">Ctrl/Cmd + Enter 运行代码</div>
            <div className="wcr-hint">Tab 键 插入缩进</div>
          </div>
        </div>

        <div className="wcr-editor">
          <div className="wcr-editor-header">
            <span>JavaScript</span>
            <div className="wcr-editor-actions">
              <button className="wcr-small-btn" onClick={() => setCode('')}>清空</button>
              <button className="wcr-small-btn" onClick={() => setCode(DEFAULT_CODE)}>重置</button>
            </div>
          </div>
          <textarea
            ref={editorRef}
            className="wcr-code-input"
            value={code}
            onChange={(e) => {
              setCode(e.target.value)
              setActiveSnippet(null)
              if (autoRun) {
                setTimeout(() => runCode(), 500)
              }
            }}
            onKeyDown={(e) => {
              if ((e.metaKey || e.ctrlKey) && e.key === 'Enter') {
                e.preventDefault()
                runCode()
              }
              if (e.key === 'Tab') {
                e.preventDefault()
                const start = e.currentTarget.selectionStart
                const end = e.currentTarget.selectionEnd
                const newCode = code.substring(0, start) + '  ' + code.substring(end)
                setCode(newCode)
                requestAnimationFrame(() => {
                  if (editorRef.current) {
                    editorRef.current.selectionStart = start + 2
                    editorRef.current.selectionEnd = start + 2
                  }
                })
              }
            }}
            spellCheck={false}
            placeholder="在此输入 JavaScript 代码..."
          />
        </div>

        <div className="wcr-output">
          <div className="wcr-output-header">
            <span>控制台输出</span>
            <button className="wcr-small-btn" onClick={clearOutput}>清空</button>
          </div>
          <div ref={outputRef} className="wcr-output-body">
            {consoleOutput.length === 0 ? (
              <div className="wcr-empty">
                <span className="wcr-empty-icon">›</span>
                <p>点击「运行代码」开始执行</p>
              </div>
            ) : (
              consoleOutput.map(entry => {
                const style = formatConsoleStyle(entry.type)
                return (
                  <div key={entry.id} className="wcr-output-entry" style={{ borderLeftColor: style.borderColor }}>
                    <span className="wcr-output-time">{entry.time}</span>
                    <span className="wcr-output-text" style={{ color: style.color }}>{entry.content}</span>
                  </div>
                )
              })
            )}
          </div>
        </div>
      </div>

      <style>{`
        .wcr-app {
          height: 100%;
          display: flex;
          flex-direction: column;
          background: #0d1117;
          color: #e6edf3;
          font-family: 'SF Mono', 'Fira Code', 'JetBrains Mono', monospace;
        }
        .wcr-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 16px 20px;
          background: #161b22;
          border-bottom: 1px solid #30363d;
        }
        .wcr-title { display: flex; align-items: center; gap: 12px; }
        .wcr-icon {
          width: 40px; height: 40px;
          display: flex; align-items: center; justify-content: center;
          background: linear-gradient(135deg, #f78166, #da3633);
          border-radius: 8px;
          font-weight: 700;
          font-size: 14px;
        }
        .wcr-title h1 { font-size: 16px; margin: 0; }
        .wcr-title p { font-size: 12px; margin: 0; color: #8b949e; }
        .wcr-actions { display: flex; align-items: center; gap: 16px; }
        .wcr-autorun { display: flex; align-items: center; gap: 6px; font-size: 13px; color: #8b949e; cursor: pointer; }
        .wcr-run-btn {
          padding: 8px 20px;
          background: linear-gradient(135deg, #238636, #2ea043);
          border: none;
          color: white;
          border-radius: 6px;
          font-size: 14px;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.2s;
        }
        .wcr-run-btn:hover:not(:disabled) { background: linear-gradient(135deg, #2ea043, #3fb950); }
        .wcr-run-btn:disabled { opacity: 0.6; cursor: not-allowed; }
        .wcr-run-btn.running { background: #1f6feb; }
        .wcr-body {
          flex: 1;
          display: grid;
          grid-template-columns: 200px 1fr 1fr;
          overflow: hidden;
        }
        .wcr-sidebar {
          background: #0d1117;
          border-right: 1px solid #30363d;
          overflow-y: auto;
          padding: 16px 12px;
        }
        .wcr-sidebar-section { margin-bottom: 24px; }
        .wcr-sidebar-section h3 {
          font-size: 11px;
          color: #8b949e;
          text-transform: uppercase;
          letter-spacing: 0.5px;
          margin: 0 0 12px;
        }
        .wcr-snippet {
          width: 100%;
          padding: 10px 12px;
          background: #21262d;
          border: 1px solid #30363d;
          border-radius: 6px;
          margin-bottom: 8px;
          cursor: pointer;
          text-align: left;
          transition: all 0.2s;
          display: flex;
          flex-direction: column;
          gap: 2px;
        }
        .wcr-snippet:hover { background: #30363d; border-color: #58a6ff; }
        .wcr-snippet.active { background: #1f6feb33; border-color: #58a6ff; }
        .wcr-snippet-title { font-size: 12px; font-weight: 600; color: #e6edf3; }
        .wcr-snippet-desc { font-size: 10px; color: #8b949e; }
        .wcr-hint { font-size: 11px; color: #6e7681; margin-bottom: 4px; }
        .wcr-editor {
          display: flex;
          flex-direction: column;
          border-right: 1px solid #30363d;
          overflow: hidden;
        }
        .wcr-editor-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 8px 16px;
          background: #161b22;
          border-bottom: 1px solid #30363d;
          font-size: 12px;
          color: #8b949e;
        }
        .wcr-editor-actions { display: flex; gap: 8px; }
        .wcr-small-btn {
          padding: 4px 10px;
          background: transparent;
          border: 1px solid #30363d;
          color: #8b949e;
          border-radius: 4px;
          font-size: 11px;
          cursor: pointer;
          transition: all 0.2s;
        }
        .wcr-small-btn:hover { background: #21262d; color: #e6edf3; }
        .wcr-code-input {
          flex: 1;
          background: #0d1117;
          border: none;
          padding: 16px;
          color: #e6edf3;
          font-family: 'SF Mono', 'Fira Code', 'JetBrains Mono', monospace;
          font-size: 13px;
          line-height: 1.6;
          resize: none;
          outline: none;
          tab-size: 2;
        }
        .wcr-code-input::placeholder { color: #484f58; }
        .wcr-output {
          display: flex;
          flex-direction: column;
          overflow: hidden;
        }
        .wcr-output-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 8px 16px;
          background: #161b22;
          border-bottom: 1px solid #30363d;
          font-size: 12px;
          color: #8b949e;
        }
        .wcr-output-body {
          flex: 1;
          overflow-y: auto;
          padding: 12px 16px;
          background: #010409;
        }
        .wcr-empty {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          height: 100%;
          color: #484f58;
        }
        .wcr-empty-icon { font-size: 48px; margin-bottom: 8px; }
        .wcr-empty p { font-size: 13px; }
        .wcr-output-entry {
          padding: 6px 12px;
          margin-bottom: 4px;
          background: #0d1117;
          border-left: 3px solid #30363d;
          border-radius: 4px;
          font-size: 12px;
          line-height: 1.5;
          white-space: pre-wrap;
          word-break: break-all;
        }
        .wcr-output-time {
          color: #484f58;
          font-size: 10px;
          margin-right: 8px;
        }
      `}</style>
    </div>
  )
}

export default WebCodeRunner
