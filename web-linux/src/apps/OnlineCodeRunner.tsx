import { useState, useCallback, useRef, useEffect, memo } from 'react'

interface CodeResult {
  output: string
  error: string
  executionTime: number
  language: string
}

interface CodeTemplate {
  name: string
  language: string
  code: string
}

const templates: CodeTemplate[] = [
  {
    name: 'Hello World (JavaScript)',
    language: 'javascript',
    code: `// JavaScript Hello World
console.log("Hello, WebLinuxOS!");

// 计算斐波那契数列
function fibonacci(n) {
  if (n <= 1) return n;
  return fibonacci(n - 1) + fibonacci(n - 2);
}

console.log("斐波那契数列前10项:");
for (let i = 0; i < 10; i++) {
  console.log(\`F(\${i}) = \${fibonacci(i)}\`);
}`
  },
  {
    name: 'Hello World (Python)',
    language: 'python',
    code: `# Python Hello World
print("Hello, WebLinuxOS!")

# 计算斐波那契数列
def fibonacci(n):
    if n <= 1:
        return n
    return fibonacci(n - 1) + fibonacci(n - 2)

print("斐波那契数列前10项:")
for i in range(10):
    print(f"F({i}) = {fibonacci(i)}")`
  },
  {
    name: '数组操作 (JavaScript)',
    language: 'javascript',
    code: `// JavaScript 数组操作示例
const arr = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10];

console.log("原始数组:", arr);
console.log("过滤偶数:", arr.filter(x => x % 2 === 0));
console.log("映射平方:", arr.map(x => x * x));
console.log("求和:", arr.reduce((a, b) => a + b, 0));
console.log("排序降序:", [...arr].sort((a, b) => b - a));`
  },
  {
    name: '列表操作 (Python)',
    language: 'python',
    code: `# Python 列表操作示例
arr = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10]

print("原始列表:", arr)
print("过滤偶数:", [x for x in arr if x % 2 == 0])
print("映射平方:", [x * x for x in arr])
print("求和:", sum(arr))
print("排序降序:", sorted(arr, reverse=True))`
  },
  {
    name: 'HTTP请求模拟 (JavaScript)',
    language: 'javascript',
    code: `// 模拟 HTTP 请求（使用 fetch）
async function fetchData() {
  console.log("模拟 API 调用...");
  
  // 实际可用的公开 API
  const url = "https://api.ipify.org?format=json";
  
  try {
    const response = await fetch(url);
    const data = await response.json();
    console.log("获取到的 IP 地址:", data.ip);
    return data;
  } catch (error) {
    console.log("请求失败:", error.message);
  }
}

// 注意：异步函数需要调用
fetchData();`
  },
  {
    name: '数学计算 (Python)',
    language: 'python',
    code: `# Python 数学计算示例
import math

print("圆周率:", math.pi)
print("自然常数:", math.e)
print("sin(30°):", math.sin(math.radians(30)))
print("cos(60°):", math.cos(math.radians(60)))
print("log10(100):", math.log10(100))
print("sqrt(16):", math.sqrt(16))
print("pow(2, 10):", math.pow(2, 10))

# 统计计算
data = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10]
print("\\n数据统计:")
print("平均值:", sum(data) / len(data))
print("最大值:", max(data))
print("最小值:", min(data))`
  },
  {
    name: 'JSON处理 (JavaScript)',
    language: 'javascript',
    code: `// JSON 处理示例
const data = {
  name: "WebLinuxOS",
  version: "5.5.0",
  features: ["桌面环境", "文件管理", "代码编辑", "终端"],
  author: {
    name: "Developer",
    github: "saya-ch"
  }
};

console.log("原始对象:", JSON.stringify(data, null, 2));

// 解析 JSON
const jsonStr = '{"name":"Test","value":123}';
const parsed = JSON.parse(jsonStr);
console.log("解析结果:", parsed);

// 深拷贝
const deepCopy = JSON.parse(JSON.stringify(data));
deepCopy.name = "Modified";
console.log("深拷贝后修改:", deepCopy.name);
console.log("原对象不变:", data.name);`
  },
  {
    name: '字符串处理 (Python)',
    language: 'python',
    code: `# Python 字符串处理示例
text = "Hello, WebLinuxOS! 这是一个测试字符串。"

print("原始字符串:", text)
print("大写:", text.upper())
print("小写:", text.lower())
print("长度:", len(text))
print("分割:", text.split())
print("替换:", text.replace("测试", "示例"))
print("查找位置:", text.find("WebLinuxOS"))

# 格式化字符串
name = "用户"
version = 5.5
print(f"\\n格式化输出: {name} 正在使用版本 {version}")`
  }
]

let pyodideInstance: unknown = null
let pyodideLoading = false

async function loadPyodideOnce(): Promise<unknown> {
  if (pyodideInstance) return pyodideInstance
  if (pyodideLoading) {
    await new Promise(resolve => setTimeout(resolve, 100))
    return loadPyodideOnce()
  }
  
  pyodideLoading = true
  try {
    const script = document.createElement('script')
    script.src = 'https://cdn.jsdelivr.net/pyodide/v0.24.1/full/pyodide.js'
    document.head.appendChild(script)
    await new Promise<void>((resolve, reject) => {
      script.onload = () => resolve()
      script.onerror = () => reject(new Error('Pyodide 加载失败'))
    })
    pyodideInstance = await (window as unknown as { loadPyodide: (opts: { indexURL: string }) => Promise<unknown> })
      .loadPyodide({ indexURL: 'https://cdn.jsdelivr.net/pyodide/v0.24.1/full/' })
    return pyodideInstance
  } finally {
    pyodideLoading = false
  }
}

async function runJavaScript(code: string): Promise<CodeResult> {
  const startTime = performance.now()
  const logs: string[] = []
  const errors: string[] = []
  
  const originalConsole = {
    log: console.log,
    error: console.error,
    warn: console.warn,
    info: console.info
  }
  
  console.log = (...args: unknown[]) => logs.push(args.map(a => {
    if (typeof a === 'object') return JSON.stringify(a, null, 2)
    return String(a)
  }).join(' '))
  console.error = (...args: unknown[]) => errors.push(args.map(String).join(' '))
  console.warn = (...args: unknown[]) => logs.push('[WARN] ' + args.map(String).join(' '))
  console.info = (...args: unknown[]) => logs.push('[INFO] ' + args.map(String).join(' '))
  
  try {
    // 创建异步函数包装器
    const AsyncFunction = Object.getPrototypeOf(async function(){}).constructor
    const fn = new AsyncFunction(code)
    await fn()
    
    return {
      output: logs.join('\n'),
      error: '',
      executionTime: performance.now() - startTime,
      language: 'javascript'
    }
  } catch (err) {
    const error = err as Error
    return {
      output: logs.join('\n'),
      error: error.message || String(error),
      executionTime: performance.now() - startTime,
      language: 'javascript'
    }
  } finally {
    console.log = originalConsole.log
    console.error = originalConsole.error
    console.warn = originalConsole.warn
    console.info = originalConsole.info
  }
}

async function runPython(code: string): Promise<CodeResult> {
  const startTime = performance.now()
  
  try {
    const py = await loadPyodideOnce() as {
      runPython: (code: string) => unknown
      runPythonAsync: (code: string) => Promise<unknown>
    }
    
    // 重定向输出
    py.runPython(`
import io, sys
sys.stdout = io.StringIO()
sys.stderr = io.StringIO()
`)
    
    await py.runPythonAsync(code)
    
    const stdout = String(py.runPython('sys.stdout.getvalue()'))
    const stderr = String(py.runPython('sys.stderr.getvalue()'))
    
    return {
      output: stdout,
      error: stderr,
      executionTime: performance.now() - startTime,
      language: 'python'
    }
  } catch (err) {
    const error = err as Error
    return {
      output: '',
      error: error.message || String(error),
      executionTime: performance.now() - startTime,
      language: 'python'
    }
  }
}

const OnlineCodeRunner = memo(function OnlineCodeRunner() {
  const [code, setCode] = useState(templates[0].code)
  const [language, setLanguage] = useState<'javascript' | 'python'>('javascript')
  const [result, setResult] = useState<CodeResult | null>(null)
  const [isRunning, setIsRunning] = useState(false)
  const [pyodideStatus, setPyodideStatus] = useState<'not-loaded' | 'loading' | 'loaded'>('not-loaded')
  const [showTemplates, setShowTemplates] = useState(false)
  
  const textareaRef = useRef<HTMLTextAreaElement>(null)
  
  useEffect(() => {
    if (language === 'python' && pyodideStatus === 'not-loaded') {
      setPyodideStatus('loading')
      loadPyodideOnce().then(() => setPyodideStatus('loaded')).catch(() => setPyodideStatus('not-loaded'))
    }
  }, [language, pyodideStatus])
  
  const handleRun = useCallback(async () => {
    setIsRunning(true)
    setResult(null)
    
    try {
      if (language === 'javascript') {
        const res = await runJavaScript(code)
        setResult(res)
      } else {
        if (pyodideStatus !== 'loaded') {
          setPyodideStatus('loading')
          await loadPyodideOnce()
          setPyodideStatus('loaded')
        }
        const res = await runPython(code)
        setResult(res)
      }
    } catch (err) {
      setResult({
        output: '',
        error: String(err),
        executionTime: 0,
        language
      })
    }
    
    setIsRunning(false)
  }, [code, language, pyodideStatus])
  
  const handleClear = useCallback(() => {
    setCode('')
    setResult(null)
  }, [])
  
  const handleTemplateSelect = useCallback((template: CodeTemplate) => {
    setCode(template.code)
    setLanguage(template.language as 'javascript' | 'python')
    setShowTemplates(false)
  }, [])
  
  const lineCount = code.split('\n').length
  
  return (
    <div style={{
      height: '100%',
      display: 'flex',
      flexDirection: 'column',
      background: '#0d1117',
      color: '#c9d1d9',
      fontFamily: 'system-ui, -apple-system, sans-serif'
    }}>
      {/* 工具栏 */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        gap: 12,
        padding: '12px 16px',
        background: '#161b22',
        borderBottom: '1px solid #30363d'
      }}>
        <select
          value={language}
          onChange={(e) => setLanguage(e.target.value as 'javascript' | 'python')}
          style={{
            padding: '6px 12px',
            borderRadius: 6,
            border: '1px solid #30363d',
            background: '#21262d',
            color: '#c9d1d9',
            fontSize: 13,
            cursor: 'pointer'
          }}
        >
          <option value="javascript">JavaScript</option>
          <option value="python">Python</option>
        </select>
        
        <button
          onClick={handleRun}
          disabled={isRunning}
          style={{
            padding: '6px 16px',
            borderRadius: 6,
            border: 'none',
            background: isRunning ? '#21262d' : '#238636',
            color: '#fff',
            fontSize: 13,
            fontWeight: 600,
            cursor: isRunning ? 'not-allowed' : 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: 6
          }}
        >
          {isRunning ? (
            <>
              <span style={{ animation: 'spin 1s linear infinite', display: 'inline-block' }}>⏳</span>
              运行中...
            </>
          ) : '▶ 运行'}
        </button>
        
        <button
          onClick={handleClear}
          style={{
            padding: '6px 12px',
            borderRadius: 6,
            border: '1px solid #30363d',
            background: '#21262d',
            color: '#c9d1d9',
            fontSize: 13,
            cursor: 'pointer'
          }}
        >
          清空
        </button>
        
        <button
          onClick={() => setShowTemplates(!showTemplates)}
          style={{
            padding: '6px 12px',
            borderRadius: 6,
            border: '1px solid #30363d',
            background: showTemplates ? '#30363d' : '#21262d',
            color: '#c9d1d9',
            fontSize: 13,
            cursor: 'pointer'
          }}
        >
          📋 示例代码
        </button>
        
        {language === 'python' && (
          <span style={{
            fontSize: 12,
            color: pyodideStatus === 'loaded' ? '#3fb950' : pyodideStatus === 'loading' ? '#f0883e' : '#8b949e'
          }}>
            {pyodideStatus === 'loaded' ? '✓ Python环境已加载' : 
             pyodideStatus === 'loading' ? '⏳ Python环境加载中...' : 'Python环境未加载'}
          </span>
        )}
        
        <span style={{ marginLeft: 'auto', fontSize: 12, color: '#8b949e' }}>
          {lineCount} 行
        </span>
      </div>
      
      {/* 示例代码面板 */}
      {showTemplates && (
        <div style={{
          background: '#161b22',
          borderBottom: '1px solid #30363d',
          padding: '8px 16px',
          display: 'flex',
          gap: 8,
          flexWrap: 'wrap'
        }}>
          {templates.map((template, idx) => (
            <button
              key={idx}
              onClick={() => handleTemplateSelect(template)}
              style={{
                padding: '6px 10px',
                borderRadius: 6,
                border: '1px solid #30363d',
                background: template.language === language ? '#30363d' : '#21262d',
                color: '#c9d1d9',
                fontSize: 12,
                cursor: 'pointer',
                whiteSpace: 'nowrap'
              }}
            >
              {template.name}
            </button>
          ))}
        </div>
      )}
      
      {/* 主内容区 */}
      <div style={{ display: 'flex', flex: 1, overflow: 'hidden' }}>
        {/* 代码编辑区 */}
        <div style={{
          flex: 1,
          display: 'flex',
          flexDirection: 'column',
          borderRight: '1px solid #30363d'
        }}>
          <div style={{
            padding: '8px 16px',
            fontSize: 12,
            color: '#8b949e',
            borderBottom: '1px solid #30363d'
          }}>
            代码输入
          </div>
          <div style={{ flex: 1, display: 'flex', overflow: 'hidden' }}>
            {/* 行号 */}
            <div style={{
              width: 40,
              background: '#0d1117',
              padding: '12px 8px',
              textAlign: 'right',
              color: '#484f58',
              fontSize: 13,
              fontFamily: "'Fira Code', monospace",
              lineHeight: 1.6,
              userSelect: 'none',
              overflow: 'hidden'
            }}>
              {Array.from({ length: Math.max(lineCount, 20) }, (_, i) => (
                <div key={i}>{i + 1}</div>
              ))}
            </div>
            {/* 编辑器 */}
            <textarea
              ref={textareaRef}
              value={code}
              onChange={(e) => setCode(e.target.value)}
              style={{
                flex: 1,
                background: '#0d1117',
                color: '#c9d1d9',
                border: 'none',
                outline: 'none',
                resize: 'none',
                padding: '12px',
                fontSize: 13,
                fontFamily: "'Fira Code', 'Consolas', monospace",
                lineHeight: 1.6,
                tabSize: 2
              }}
              spellCheck={false}
              placeholder={`输入 ${language} 代码...`}
            />
          </div>
        </div>
        
        {/* 输出区 */}
        <div style={{
          width: '40%',
          display: 'flex',
          flexDirection: 'column',
          background: '#161b22'
        }}>
          <div style={{
            padding: '8px 16px',
            fontSize: 12,
            color: '#8b949e',
            borderBottom: '1px solid #30363d',
            display: 'flex',
            justifyContent: 'space-between'
          }}>
            <span>输出结果</span>
            {result && (
              <span style={{ color: '#3fb950' }}>
                执行时间: {result.executionTime.toFixed(2)}ms
              </span>
            )}
          </div>
          <div style={{
            flex: 1,
            overflow: 'auto',
            padding: '12px',
            fontSize: 13,
            fontFamily: "'Fira Code', monospace",
            lineHeight: 1.6
          }}>
            {isRunning ? (
              <div style={{ textAlign: 'center', padding: 40, color: '#8b949e' }}>
                <div style={{ fontSize: 32, animation: 'spin 1s linear infinite' }}>⏳</div>
                <div style={{ marginTop: 12 }}>正在执行代码...</div>
              </div>
            ) : result ? (
              <>
                {result.output && (
                  <pre style={{
                    margin: 0,
                    padding: '8px 12px',
                    background: '#0d1117',
                    borderRadius: 6,
                    color: '#3fb950',
                    whiteSpace: 'pre-wrap',
                    wordBreak: 'break-word'
                  }}>
                    {result.output}
                  </pre>
                )}
                {result.error && (
                  <pre style={{
                    margin: result.output ? '12px 0 0 0' : 0,
                    padding: '8px 12px',
                    background: 'rgba(248,81,73,0.1)',
                    borderRadius: 6,
                    color: '#f85149',
                    border: '1px solid rgba(248,81,73,0.3)',
                    whiteSpace: 'pre-wrap',
                    wordBreak: 'break-word'
                  }}>
                    {result.error}
                  </pre>
                )}
                {!result.output && !result.error && (
                  <div style={{ textAlign: 'center', color: '#8b949e' }}>
                    ✓ 执行成功（无输出）
                  </div>
                )}
              </>
            ) : (
              <div style={{ textAlign: 'center', padding: 40, color: '#8b949e' }}>
                <div style={{ fontSize: 32 }}>⚡</div>
                <div style={{ marginTop: 12 }}>点击"运行"执行代码</div>
                <div style={{ marginTop: 8, fontSize: 12 }}>
                  支持 JavaScript 和 Python
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
      
      {/* 状态栏 */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '6px 16px',
        background: '#21262d',
        borderTop: '1px solid #30363d',
        fontSize: 11,
        color: '#8b949e'
      }}>
        <div style={{ display: 'flex', gap: 16 }}>
          <span>{language === 'javascript' ? 'ES2020' : 'Python 3.11'}</span>
          <span>UTF-8</span>
        </div>
        <div>
          WebLinuxOS Online Code Runner
        </div>
      </div>
      
      <style>{`
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  )
})

export default OnlineCodeRunner