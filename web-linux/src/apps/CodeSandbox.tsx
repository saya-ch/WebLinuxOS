import { useState, useCallback, memo, useRef } from 'react'
import { useStore } from '../store'

interface CodeTemplate {
  name: string
  language: string
  code: string
  description: string
}

const codeTemplates: CodeTemplate[] = [
  {
    name: 'Hello World (JavaScript)',
    language: 'javascript',
    code: `// Hello World - JavaScript
console.log('Hello, World!');

// 计算斐波那契数列
function fibonacci(n) {
  if (n <= 1) return n;
  return fibonacci(n - 1) + fibonacci(n - 2);
}

console.log('Fibonacci(10):', fibonacci(10));`,
    description: '简单的 JavaScript 示例'
  },
  {
    name: 'Hello World (Python)',
    language: 'python',
    code: `# Hello World - Python
print('Hello, World!')

# 计算斐波那契数列
def fibonacci(n):
    if n <= 1:
        return n
    return fibonacci(n - 1) + fibonacci(n - 2)

print('Fibonacci(10):', fibonacci(10))`,
    description: '简单的 Python 示例'
  },
  {
    name: 'HTML/CSS/JS Demo',
    language: 'html',
    code: `<!DOCTYPE html>
<html>
<head>
  <title>Demo</title>
  <style>
    body { font-family: Arial, sans-serif; padding: 20px; background: #f0f0f0; }
    .card { background: white; padding: 20px; border-radius: 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.1); }
    button { background: #4CAF50; color: white; border: none; padding: 10px 20px; border-radius: 4px; cursor: pointer; }
    button:hover { background: #45a049; }
  </style>
</head>
<body>
  <div class="card">
    <h1>交互式演示</h1>
    <p>点击按钮查看效果</p>
    <button onclick="showMessage()">点击我</button>
    <p id="message"></p>
  </div>
  <script>
    function showMessage() {
      document.getElementById('message').textContent = 
        'Hello from ' + new Date().toLocaleTimeString();
    }
  </script>
</body>
</html>`,
    description: 'HTML/CSS/JS 完整网页'
  },
  {
    name: 'React Component',
    language: 'javascript',
    code: `// React 计数器组件
function Counter() {
  const [count, setCount] = React.useState(0);
  
  return (
    <div style={{ padding: '20px', textAlign: 'center' }}>
      <h2>计数器: {count}</h2>
      <button onClick={() => setCount(count + 1)} 
        style={{ padding: '10px 20px', margin: '5px', fontSize: '16px' }}>
        +
      </button>
      <button onClick={() => setCount(count - 1)} 
        style={{ padding: '10px 20px', margin: '5px', fontSize: '16px' }}>
        -
      </button>
    </div>
  );
}

// 渲染组件
ReactDOM.createRoot(document.getElementById('root')).render(<Counter />);`,
    description: 'React 组件示例'
  },
  {
    name: '数据可视化',
    language: 'javascript',
    code: `// 使用 Canvas 绘制图表
const canvas = document.createElement('canvas');
canvas.width = 400;
canvas.height = 300;
document.body.appendChild(canvas);

const ctx = canvas.getContext('2d');

// 绘制背景
ctx.fillStyle = '#f0f0f0';
ctx.fillRect(0, 0, 400, 300);

// 数据
const data = [65, 45, 80, 55, 90, 70, 85];
const colors = ['#FF6B6B', '#4ECDC4', '#45B7D1', '#96CEB4', '#FFEAA7', '#DDA0DD', '#98D8C8'];

// 绘制柱状图
const barWidth = 40;
const gap = 15;
const maxValue = Math.max(...data);

data.forEach((value, index) => {
  const height = (value / maxValue) * 200;
  const x = 50 + index * (barWidth + gap);
  const y = 250 - height;
  
  ctx.fillStyle = colors[index];
  ctx.fillRect(x, y, barWidth, height);
  
  // 绘制数值
  ctx.fillStyle = '#333';
  ctx.font = '12px Arial';
  ctx.textAlign = 'center';
  ctx.fillText(value, x + barWidth / 2, y - 5);
});

// 绘制标题
ctx.fillStyle = '#333';
ctx.font = 'bold 18px Arial';
ctx.textAlign = 'center';
ctx.fillText('每周数据统计', 200, 30);`,
    description: '使用 Canvas 绘制图表'
  }
]

const CodeSandbox = memo(function CodeSandbox() {
  const addNotification = useStore((s) => s.addNotification)
  const [code, setCode] = useState(codeTemplates[0].code)
  const [language, setLanguage] = useState('javascript')
  const [output, setOutput] = useState('')
  const [running, setRunning] = useState(false)
  const [activeTab, setActiveTab] = useState<'code' | 'output' | 'preview'>('code')
  const iframeRef = useRef<HTMLIFrameElement>(null)
  const [outputHistory, setOutputHistory] = useState<string[]>([])

  const runCode = useCallback(async () => {
    if (!code.trim()) {
      addNotification({ title: '提示', message: '请输入代码', type: 'info' })
      return
    }

    setRunning(true)
    setOutput('')
    const startTime = Date.now()

    try {
      if (language === 'javascript') {
        // 捕获 console.log
        const logs: string[] = []
        const originalLog = console.log
        console.log = (...args: any[]) => {
          logs.push(args.map(arg => 
            typeof arg === 'object' ? JSON.stringify(arg, null, 2) : String(arg)
          ).join(' '))
        }

        try {
          // 执行代码
          const result = new Function(code)()
          if (result !== undefined) {
            logs.push(String(result))
          }
        } finally {
          console.log = originalLog
        }

        const duration = Date.now() - startTime
        setOutput(logs.join('\\n'))
        setOutputHistory(prev => [...prev.slice(-9), `[${new Date().toLocaleTimeString()}] JavaScript\\n${logs.join('\\n')}`])
        addNotification({ title: '执行成功', message: `耗时 ${duration}ms`, type: 'success' })
      } else if (language === 'html') {
        // 在 iframe 中预览
        if (iframeRef.current) {
          iframeRef.current.srcdoc = code
        }
        setOutput('HTML 已在预览标签页中渲染')
        addNotification({ title: '渲染完成', message: 'HTML 页面已渲染', type: 'success' })
      } else if (language === 'python') {
        // 简单的 Python 模拟
        setOutput('Python 运行时正在初始化...\\n\\n' +
                 '提示：WebLinuxOS 终端支持完整的 Python 环境，\\n' +
                 '请使用终端应用运行 Python 代码。')
        addNotification({ title: '提示', message: '请使用终端应用运行 Python', type: 'info' })
      }
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : String(error)
      setOutput(`错误：${errorMsg}`)
      addNotification({ title: '执行错误', message: errorMsg, type: 'error' })
    } finally {
      setRunning(false)
    }
  }, [code, language, addNotification])

  const loadTemplate = (template: CodeTemplate) => {
    setCode(template.code)
    setLanguage(template.language)
    setActiveTab('code')
  }

  const clearOutput = () => {
    setOutput('')
  }

  const copyToClipboard = () => {
    navigator.clipboard.writeText(code)
    addNotification({ title: '已复制', message: '代码已复制到剪贴板', type: 'info' })
  }

  const downloadCode = () => {
    const extension = language === 'javascript' ? 'js' : language === 'html' ? 'html' : 'py'
    const blob = new Blob([code], { type: 'text/plain' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `code-sandbox.${extension}`
    a.click()
    URL.revokeObjectURL(url)
    addNotification({ title: '下载成功', message: '代码已下载', type: 'success' })
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', background: 'var(--window-bg)', overflow: 'hidden' }}>
      <div style={{ padding: '16px', borderBottom: '1px solid var(--window-border)' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
          <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
            <select
              value={language}
              onChange={(e) => setLanguage(e.target.value)}
              style={{
                padding: '8px 12px',
                borderRadius: '6px',
                border: '1px solid var(--window-border)',
                background: 'var(--window-bg)',
                color: 'var(--text-primary)',
                cursor: 'pointer',
              }}
            >
              <option value="javascript">JavaScript</option>
              <option value="html">HTML/CSS/JS</option>
              <option value="python">Python</option>
            </select>
            <button
              onClick={runCode}
              disabled={running}
              style={{
                padding: '8px 24px',
                borderRadius: '6px',
                border: 'none',
                background: running ? 'var(--text-secondary)' : '#4CAF50',
                color: '#fff',
                fontWeight: '600',
                cursor: running ? 'not-allowed' : 'pointer',
                transition: 'all 0.2s',
              }}
            >
              {running ? '运行中...' : '▶ 运行'}
            </button>
          </div>
          <div style={{ display: 'flex', gap: '8px' }}>
            <button onClick={copyToClipboard} style={buttonStyle}>复制</button>
            <button onClick={downloadCode} style={buttonStyle}>下载</button>
            <button onClick={clearOutput} style={buttonStyle}>清空输出</button>
          </div>
        </div>

        <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
          <span style={{ fontSize: '11px', color: 'var(--text-secondary)', alignSelf: 'center', marginRight: '8px' }}>快速模板:</span>
          {codeTemplates.map((template, idx) => (
            <button
              key={idx}
              onClick={() => loadTemplate(template)}
              title={template.description}
              style={{
                padding: '4px 10px',
                borderRadius: '4px',
                border: '1px solid var(--window-border)',
                background: 'transparent',
                color: 'var(--text-secondary)',
                fontSize: '11px',
                cursor: 'pointer',
              }}
            >
              {template.name}
            </button>
          ))}
        </div>
      </div>

      <div style={{ flex: 1, display: 'flex', overflow: 'hidden' }}>
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
          <div style={{ display: 'flex', borderBottom: '1px solid var(--window-border)' }}>
            {(['code', 'output', 'preview'] as const).map(tab => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                style={{
                  padding: '10px 20px',
                  border: 'none',
                  background: activeTab === tab ? 'var(--accent-bg)' : 'transparent',
                  color: activeTab === tab ? 'var(--accent)' : 'var(--text-secondary)',
                  cursor: 'pointer',
                  borderBottom: activeTab === tab ? '2px solid var(--accent)' : '2px solid transparent',
                  fontSize: '13px',
                  fontWeight: '500',
                }}
              >
                {tab === 'code' ? '代码' : tab === 'output' ? '输出' : '预览'}
              </button>
            ))}
          </div>

          <div style={{ flex: 1, overflow: 'hidden' }}>
            {activeTab === 'code' && (
              <textarea
                value={code}
                onChange={(e) => setCode(e.target.value)}
                spellCheck={false}
                style={{
                  width: '100%',
                  height: '100%',
                  padding: '12px',
                  border: 'none',
                  background: 'var(--titlebar-bg)',
                  color: 'var(--text-primary)',
                  fontFamily: 'JetBrains Mono, monospace',
                  fontSize: '13px',
                  lineHeight: '1.6',
                  resize: 'none',
                }}
              />
            )}

            {activeTab === 'output' && (
              <div style={{ 
                flex: 1, 
                padding: '12px', 
                overflow: 'auto',
                background: '#1e1e1e',
                color: '#d4d4d4',
                fontFamily: 'JetBrains Mono, monospace',
                fontSize: '13px',
                height: '100%',
              }}>
                {output ? (
                  <pre style={{ margin: 0, whiteSpace: 'pre-wrap', wordBreak: 'break-word' }}>{output}</pre>
                ) : (
                  <div style={{ color: '#666', textAlign: 'center', marginTop: '60px' }}>
                    点击「运行」按钮执行代码
                  </div>
                )}
              </div>
            )}

            {activeTab === 'preview' && (
              <div style={{ flex: 1, height: '100%', overflow: 'hidden' }}>
                <iframe
                  ref={iframeRef}
                  title="Code Preview"
                  sandbox="allow-scripts allow-same-origin"
                  style={{
                    width: '100%',
                    height: '100%',
                    border: 'none',
                    background: 'white',
                  }}
                />
              </div>
            )}
          </div>
        </div>
      </div>

      {outputHistory.length > 0 && (
        <div style={{ 
          padding: '12px', 
          borderTop: '1px solid var(--window-border)', 
          maxHeight: '100px', 
          overflow: 'auto',
          background: 'var(--titlebar-bg)',
        }}>
          <div style={{ fontSize: '11px', color: 'var(--text-secondary)', marginBottom: '6px' }}>历史记录</div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
            {outputHistory.slice(-5).reverse().map((item, idx) => (
              <div
                key={idx}
                onClick={() => setOutput(item.split('\\n').slice(1).join('\\n'))}
                style={{
                  padding: '4px 8px',
                  borderRadius: '4px',
                  background: 'var(--window-bg)',
                  fontSize: '11px',
                  cursor: 'pointer',
                }}
              >
                {item.split('\\n')[0]}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
})

const buttonStyle: React.CSSProperties = {
  padding: '6px 12px',
  borderRadius: '4px',
  border: '1px solid var(--window-border)',
  background: 'transparent',
  color: 'var(--text-secondary)',
  fontSize: '12px',
  cursor: 'pointer',
}

export default CodeSandbox
