import { useState, useCallback, useRef, useEffect, memo } from 'react'

interface Language {
  id: string
  name: string
  icon: string
  monacoLang: string
  template: string
  runCommand?: string
}

const languages: Language[] = [
  {
    id: 'javascript',
    name: 'JavaScript',
    icon: 'JS',
    monacoLang: 'javascript',
    template: `// JavaScript 示例代码
console.log("Hello, WebLinuxOS!");

// 数组操作示例
const numbers = [1, 2, 3, 4, 5];
const doubled = numbers.map(n => n * 2);
console.log("数组加倍:", doubled);

// 异步操作示例
async function fetchData() {
  try {
    const response = await fetch('https://api.github.com/users/github');
    const data = await response.json();
    console.log("GitHub用户数据:", data.login);
  } catch (error) {
    console.error("请求失败:", error.message);
  }
}

fetchData();
`
  },
  {
    id: 'python',
    name: 'Python',
    icon: 'PY',
    monacoLang: 'python',
    template: `# Python 示例代码
print("Hello, WebLinuxOS!")

# 列表操作示例
numbers = [1, 2, 3, 4, 5]
doubled = [n * 2 for n in numbers]
print(f"数组加倍: {doubled}")

# 类定义示例
class Calculator:
    def add(self, a, b):
        return a + b
    
    def multiply(self, a, b):
        return a * b

calc = Calculator()
print(f"5 + 3 = {calc.add(5, 3)}")
print(f"5 * 3 = {calc.multiply(5, 3)}")
`
  },
  {
    id: 'typescript',
    name: 'TypeScript',
    icon: 'TS',
    monacoLang: 'typescript',
    template: `// TypeScript 示例代码
interface User {
  id: number;
  name: string;
  email: string;
}

function greet(user: User): string {
  return \`Hello, \${user.name}!\`;
}

const user: User = {
  id: 1,
  name: "WebLinuxOS User",
  email: "user@example.com"
};

console.log(greet(user));

// 泛型示例
function identity<T>(arg: T): T {
  return arg;
}

console.log(identity<string>("TypeScript works!"));
console.log(identity<number>(42));
`
  },
  {
    id: 'html',
    name: 'HTML/CSS',
    icon: 'HTML',
    monacoLang: 'html',
    template: `<!DOCTYPE html>
<html lang="zh-CN">
<head>
  <meta charset="UTF-8">
  <title>WebLinuxOS Demo</title>
  <style>
    body {
      font-family: system-ui, sans-serif;
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      min-height: 100vh;
      display: flex;
      align-items: center;
      justify-content: center;
    }
    .card {
      background: white;
      padding: 2rem;
      border-radius: 1rem;
      box-shadow: 0 10px 40px rgba(0,0,0,0.2);
      text-align: center;
    }
    h1 { color: #333; }
    p { color: #666; }
  </style>
</head>
<body>
  <div class="card">
    <h1>Hello, WebLinuxOS!</h1>
    <p>这是一个HTML/CSS演示页面</p>
  </div>
</body>
</html>
`
  },
  {
    id: 'markdown',
    name: 'Markdown',
    icon: 'MD',
    monacoLang: 'markdown',
    template: `# WebLinuxOS 文档

## 简介

WebLinuxOS是一个基于Web的Linux桌面环境。

### 特性

- 多虚拟桌面
- 120+应用程序
- 90+终端命令

## 代码示例

\`\`\`javascript
console.log("Hello!");
\`\`\`

## 表格示例

| 功能 | 状态 |
|------|------|
| 桌面环境 | 完成 |
| 终端 | 完成 |
| 文件管理 | 完成 |

> 提示：这是一个Markdown演示文档。
`
  },
  {
    id: 'json',
    name: 'JSON',
    icon: 'JSON',
    monacoLang: 'json',
    template: `{
  "name": "WebLinuxOS",
  "version": "5.2.0",
  "description": "基于Web的Linux桌面环境",
  "features": [
    "多虚拟桌面",
    "120+应用程序",
    "90+终端命令"
  ],
  "author": {
    "name": "saya-ch",
    "url": "https://github.com/saya-ch"
  },
  "repository": "https://github.com/saya-ch/WebLinuxOS"
}
`
  },
  {
    id: 'sql',
    name: 'SQL',
    icon: 'SQL',
    monacoLang: 'sql',
    template: `-- SQL 示例查询

-- 创建表
CREATE TABLE users (
  id INT PRIMARY KEY,
  name VARCHAR(100),
  email VARCHAR(100),
  created_at TIMESTAMP
);

-- 插入数据
INSERT INTO users (id, name, email, created_at)
VALUES 
  (1, 'Alice', 'alice@example.com', NOW()),
  (2, 'Bob', 'bob@example.com', NOW());

-- 查询数据
SELECT * FROM users WHERE id = 1;

-- 更新数据
UPDATE users SET name = 'Alice Updated' WHERE id = 1;

-- 删除数据
DELETE FROM users WHERE id = 2;
`
  },
  {
    id: 'bash',
    name: 'Bash',
    icon: 'SH',
    monacoLang: 'shell',
    template: `#!/bin/bash

# Bash 示例脚本

echo "Hello, WebLinuxOS!"

# 变量示例
name="WebLinuxOS"
version="5.2.0"
echo "项目: $name, 版本: $version"

# 循环示例
for i in {1..5}; do
  echo "循环计数: $i"
done

# 条件判断示例
if [ "$version" == "5.2.0" ]; then
  echo "版本匹配成功!"
fi

# 函数示例
greet() {
  echo "欢迎, $1!"
}

greet "用户"
`
  }
]

interface OutputLine {
  type: 'stdout' | 'stderr' | 'info' | 'error'
  content: string
  timestamp: Date
}

const CodeRunner = memo(function CodeRunner() {
  const [selectedLang, setSelectedLang] = useState<Language>(languages[0])
  const [code, setCode] = useState(selectedLang.template)
  const [output, setOutput] = useState<OutputLine[]>([])
  const [isRunning, setIsRunning] = useState(false)
  const [showPreview, setShowPreview] = useState(false)
  const codeRef = useRef<HTMLTextAreaElement>(null)
  const previewRef = useRef<HTMLIFrameElement>(null)

  useEffect(() => {
    setCode(selectedLang.template)
    setOutput([])
    setShowPreview(selectedLang.id === 'html')
  }, [selectedLang])

  const addOutput = useCallback((type: OutputLine['type'], content: string) => {
    setOutput(prev => [...prev, {
      type,
      content,
      timestamp: new Date()
    }])
  }, [])

  const runJavaScript = useCallback(async (jsCode: string) => {
    const logs: string[] = []
    const originalConsole = {
      log: console.log,
      error: console.error,
      warn: console.warn,
      info: console.info
    }

    // 重写console方法捕获输出
    console.log = (...args) => {
      logs.push(args.map(arg => 
        typeof arg === 'object' ? JSON.stringify(arg, null, 2) : String(arg)
      ).join(' '))
    }
    console.error = (...args) => {
      logs.push('[ERROR] ' + args.map(arg => 
        typeof arg === 'object' ? JSON.stringify(arg, null, 2) : String(arg)
      ).join(' '))
    }
    console.warn = (...args) => {
      logs.push('[WARN] ' + args.join(' '))
    }
    console.info = (...args) => {
      logs.push('[INFO] ' + args.join(' '))
    }

    try {
      // 使用Function构造器执行代码
      const fn = new Function(jsCode)
      await fn()
      
      logs.forEach(log => addOutput('stdout', log))
      addOutput('info', '代码执行完成')
    } catch (error) {
      addOutput('error', `执行错误: ${error instanceof Error ? error.message : String(error)}`)
    }

    // 恢复原始console
    Object.assign(console, originalConsole)
  }, [addOutput])

  const runPython = useCallback(async (pyCode: string) => {
    addOutput('info', '正在加载Python运行环境...')
    
    try {
      // 动态加载Pyodide
      if (!window.pyodide) {
        const script = document.createElement('script')
        script.src = 'https://cdn.jsdelivr.net/pyodide/v0.24.1/full/pyodide.js'
        document.head.appendChild(script)
        
        await new Promise<void>((resolve, reject) => {
          script.onload = () => resolve()
          script.onerror = () => reject(new Error('Pyodide加载失败'))
        })
        
        if (window.loadPyodide) {
          window.pyodide = await window.loadPyodide({
            indexURL: 'https://cdn.jsdelivr.net/pyodide/v0.24.1/full/'
          })
        }
      }

      addOutput('info', 'Python环境已就绪')
      
      if (!window.pyodide) {
        throw new Error('Python环境未加载')
      }
      
      // 运行Python代码
      const result = await window.pyodide.runPythonAsync(pyCode)
      
      if (result !== undefined && result !== null) {
        addOutput('stdout', String(result))
      }
      
      // 获取Python的stdout输出
      const stdout = window.pyodide.runPython('import sys; sys.stdout.getvalue() if hasattr(sys.stdout, "getvalue") else ""')
      if (stdout) {
        stdout.split('\n').filter(Boolean).forEach((line: string) => addOutput('stdout', line))
      }
      
      addOutput('info', 'Python代码执行完成')
    } catch (error) {
      addOutput('error', `Python执行错误: ${error instanceof Error ? error.message : String(error)}`)
    }
  }, [addOutput])

  const runHTML = useCallback(() => {
    if (previewRef.current) {
      const iframe = previewRef.current
      const doc = iframe.contentDocument || iframe.contentWindow?.document
      if (doc) {
        doc.open()
        doc.write(code)
        doc.close()
        addOutput('info', 'HTML预览已更新')
      }
    }
  }, [code, addOutput])

  const runCode = useCallback(async () => {
    setIsRunning(true)
    setOutput([])
    addOutput('info', `开始执行 ${selectedLang.name} 代码...`)
    addOutput('info', `执行时间: ${new Date().toLocaleTimeString()}`)

    const startTime = performance.now()

    try {
      switch (selectedLang.id) {
        case 'javascript':
          await runJavaScript(code)
          break
        case 'typescript':
          // TypeScript需要编译，这里简化处理为JavaScript
          addOutput('info', 'TypeScript代码将作为JavaScript执行')
          await runJavaScript(code)
          break
        case 'python':
          await runPython(code)
          break
        case 'html':
          runHTML()
          break
        case 'markdown':
          // Markdown渲染
          addOutput('stdout', 'Markdown内容:')
          addOutput('stdout', code)
          addOutput('info', 'Markdown文档已显示')
          break
        case 'json':
          try {
            const parsed = JSON.parse(code)
            addOutput('stdout', 'JSON解析成功:')
            addOutput('stdout', JSON.stringify(parsed, null, 2))
          } catch {
            addOutput('error', 'JSON格式错误')
          }
          break
        case 'sql':
          addOutput('info', 'SQL查询模拟执行:')
          addOutput('stdout', code)
          addOutput('info', '(SQL在浏览器中为模拟演示)')
          break
        case 'bash':
          addOutput('info', 'Bash脚本模拟执行:')
          addOutput('stdout', code)
          addOutput('info', '(Bash在浏览器中为模拟演示)')
          break
        default:
          addOutput('stdout', code)
      }
    } catch (error) {
      addOutput('error', `执行失败: ${error instanceof Error ? error.message : String(error)}`)
    }

    const endTime = performance.now()
    addOutput('info', `执行耗时: ${(endTime - startTime).toFixed(2)}ms`)
    setIsRunning(false)
  }, [selectedLang, code, addOutput, runJavaScript, runPython, runHTML])

  const clearOutput = useCallback(() => {
    setOutput([])
  }, [])

  const formatTime = useCallback((date: Date) => {
    return date.toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit', second: '2-digit' })
  }, [])

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
        justifyContent: 'space-between',
        padding: '8px 12px',
        background: '#161b22',
        borderBottom: '1px solid #30363d'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          {/* 语言选择 */}
          <div style={{
            display: 'flex',
            gap: 4,
            flexWrap: 'wrap'
          }}>
            {languages.map(lang => (
              <button
                key={lang.id}
                onClick={() => setSelectedLang(lang)}
                style={{
                  padding: '6px 12px',
                  borderRadius: 6,
                  border: selectedLang.id === lang.id ? '1px solid #58a6ff' : '1px solid #30363d',
                  background: selectedLang.id === lang.id ? '#21262d' : 'transparent',
                  color: selectedLang.id === lang.id ? '#58a6ff' : '#8b949e',
                  cursor: 'pointer',
                  fontSize: 12,
                  fontWeight: selectedLang.id === lang.id ? 600 : 400,
                  transition: 'all 0.2s',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 4
                }}
              >
                <span style={{
                  background: selectedLang.id === lang.id ? '#58a6ff' : '#30363d',
                  padding: '2px 4px',
                  borderRadius: 3,
                  fontSize: 10,
                  fontWeight: 600
                }}>
                  {lang.icon}
                </span>
                {lang.name}
              </button>
            ))}
          </div>
        </div>
        
        <div style={{ display: 'flex', gap: 8 }}>
          <button
            onClick={() => setCode(selectedLang.template)}
            style={{
              padding: '6px 12px',
              borderRadius: 6,
              border: '1px solid #30363d',
              background: 'transparent',
              color: '#8b949e',
              cursor: 'pointer',
              fontSize: 12
            }}
          >
            重置模板
          </button>
          <button
            onClick={runCode}
            disabled={isRunning}
            style={{
              padding: '6px 16px',
              borderRadius: 6,
              border: 'none',
              background: isRunning ? '#21262d' : '#238636',
              color: '#fff',
              cursor: isRunning ? 'not-allowed' : 'pointer',
              fontSize: 12,
              fontWeight: 600,
              display: 'flex',
              alignItems: 'center',
              gap: 6
            }}
          >
            {isRunning ? (
              <>
                <span style={{ animation: 'spin 1s linear infinite', display: 'inline-block' }}>⏳</span>
                执行中...
              </>
            ) : (
              <>
                <span>▶</span>
                运行代码
              </>
            )}
          </button>
        </div>
      </div>

      {/* 主内容区 */}
      <div style={{
        flex: 1,
        display: 'flex',
        gap: 0,
        overflow: 'hidden'
      }}>
        {/* 代码编辑区 */}
        <div style={{
          flex: 1,
          display: 'flex',
          flexDirection: 'column',
          borderRight: '1px solid #30363d'
        }}>
          <div style={{
            padding: '8px 12px',
            background: '#161b22',
            borderBottom: '1px solid #30363d',
            display: 'flex',
            alignItems: 'center',
            gap: 8
          }}>
            <span style={{
              background: '#30363d',
              padding: '2px 6px',
              borderRadius: 4,
              fontSize: 11,
              fontWeight: 600
            }}>
              {selectedLang.icon}
            </span>
            <span style={{ fontSize: 13, fontWeight: 500 }}>代码编辑器</span>
            <span style={{ fontSize: 11, color: '#8b949e' }}>
              ({code.length} 字符)
            </span>
          </div>
          <textarea
            ref={codeRef}
            value={code}
            onChange={(e) => setCode(e.target.value)}
            spellCheck={false}
            style={{
              flex: 1,
              padding: 12,
              background: '#0d1117',
              color: '#c9d1d9',
              border: 'none',
              resize: 'none',
              fontSize: 14,
              lineHeight: 1.6,
              fontFamily: 'ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace',
              outline: 'none',
              tabSize: 2
            }}
            placeholder={`在此输入 ${selectedLang.name} 代码...`}
          />
        </div>

        {/* 输出/预览区 */}
        <div style={{
          width: showPreview ? '50%' : '40%',
          display: 'flex',
          flexDirection: 'column',
          minWidth: 300
        }}>
          <div style={{
            padding: '8px 12px',
            background: '#161b22',
            borderBottom: '1px solid #30363d',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <span style={{ fontSize: 13, fontWeight: 500 }}>
                {showPreview ? '预览' : '输出'}
              </span>
              {output.length > 0 && (
                <span style={{ fontSize: 11, color: '#8b949e' }}>
                  ({output.length} 行)
                </span>
              )}
            </div>
            <button
              onClick={clearOutput}
              style={{
                padding: '4px 8px',
                borderRadius: 4,
                border: '1px solid #30363d',
                background: 'transparent',
                color: '#8b949e',
                cursor: 'pointer',
                fontSize: 11
              }}
            >
              清空
            </button>
          </div>

          {showPreview && selectedLang.id === 'html' ? (
            <iframe
              ref={previewRef}
              style={{
                flex: 1,
                background: '#fff',
                border: 'none'
              }}
              title="HTML预览"
              sandbox="allow-scripts"
            />
          ) : (
            <div style={{
              flex: 1,
              overflow: 'auto',
              padding: 12,
              background: '#0d1117',
              fontFamily: 'ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace',
              fontSize: 13,
              lineHeight: 1.5
            }}>
              {output.length === 0 ? (
                <div style={{
                  color: '#8b949e',
                  textAlign: 'center',
                  padding: 40,
                  fontSize: 13
                }}>
                  点击"运行代码"查看输出结果
                </div>
              ) : (
                output.map((line, index) => (
                  <div
                    key={index}
                    style={{
                      padding: '4px 0',
                      color: line.type === 'error' ? '#f85149' 
                        : line.type === 'info' ? '#58a6ff'
                        : line.type === 'stderr' ? '#f85149'
                        : '#c9d1d9',
                      whiteSpace: 'pre-wrap',
                      wordBreak: 'break-all'
                    }}
                  >
                    <span style={{
                      fontSize: 11,
                      color: '#30363d',
                      marginRight: 8
                    }}>
                      [{formatTime(line.timestamp)}]
                    </span>
                    {line.content}
                  </div>
                ))
              )}
            </div>
          )}
        </div>
      </div>

      {/* 底部状态栏 */}
      <div style={{
        padding: '6px 12px',
        background: '#161b22',
        borderTop: '1px solid #30363d',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        fontSize: 11,
        color: '#8b949e'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <span>语言: {selectedLang.name}</span>
          <span>|</span>
          <span>行数: {code.split('\n').length}</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <span style={{ color: '#238636' }}>WebLinuxOS CodeRunner</span>
          <span>|</span>
          <span>支持 JavaScript, Python, TypeScript, HTML, Markdown, JSON, SQL, Bash</span>
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

// 声明全局pyodide类型
declare global {
  interface Window {
    pyodide?: any
    loadPyodide?: (config: { indexURL: string }) => Promise<any>
  }
}

export default CodeRunner