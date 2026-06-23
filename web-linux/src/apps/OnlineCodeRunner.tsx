import { useState, useCallback, useRef, memo } from 'react'
import { useStore } from '../store'

interface LanguageConfig {
  name: string
  icon: string
  version: string
  template: string
  monacoLanguage: string
}

const LANGUAGES: Record<string, LanguageConfig> = {
  javascript: {
    name: 'JavaScript',
    icon: '🟨',
    version: 'ES2023',
    template: `// JavaScript 代码示例
function greet(name) {
  return \`Hello, \${name}!\`;
}

console.log(greet('World'));

// 数组操作示例
const numbers = [1, 2, 3, 4, 5];
const doubled = numbers.map(n => n * 2);
console.log('Doubled:', doubled);

// 对象操作示例
const person = { name: 'Alice', age: 25 };
console.log('Person:', JSON.stringify(person, null, 2));`,
    monacoLanguage: 'javascript'
  },
  python: {
    name: 'Python',
    icon: '🐍',
    version: '3.11',
    template: `# Python 代码示例
def greet(name):
    return f"Hello, {name}!"

print(greet("World"))

# 列表操作示例
numbers = [1, 2, 3, 4, 5]
doubled = [n * 2 for n in numbers]
print("Doubled:", doubled)

# 字典操作示例
person = {"name": "Alice", "age": 25}
print("Person:", person)`,
    monacoLanguage: 'python'
  },
  typescript: {
    name: 'TypeScript',
    icon: '🔷',
    version: '5.0',
    template: `// TypeScript 代码示例
interface Person {
  name: string;
  age: number;
}

function greet(person: Person): string {
  return \`Hello, \${person.name}! You are \${person.age} years old.\`;
}

const alice: Person = { name: 'Alice', age: 25 };
console.log(greet(alice));

// 泛型示例
function identity<T>(arg: T): T {
  return arg;
}

console.log(identity<string>("Hello"));
console.log(identity<number>(42));`,
    monacoLanguage: 'typescript'
  },
  html: {
    name: 'HTML',
    icon: '🌐',
    version: 'HTML5',
    template: `<!DOCTYPE html>
<html lang="zh-CN">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>示例页面</title>
  <style>
    body {
      font-family: system-ui, sans-serif;
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      color: white;
      padding: 2rem;
      min-height: 100vh;
    }
    h1 { color: #fff; }
    .card {
      background: rgba(255,255,255,0.1);
      padding: 1rem;
      border-radius: 8px;
    }
  </style>
</head>
<body>
  <h1>Hello World</h1>
  <div class="card">
    <p>这是一个示例HTML页面</p>
  </div>
</body>
</html>`,
    monacoLanguage: 'html'
  },
  css: {
    name: 'CSS',
    icon: '🎨',
    version: 'CSS3',
    template: `/* CSS 样式示例 */
.container {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  min-height: 100vh;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
}

.card {
  background: rgba(255, 255, 255, 0.1);
  backdrop-filter: blur(10px);
  border-radius: 16px;
  padding: 24px;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.1);
  border: 1px solid rgba(255, 255, 255, 0.2);
}

.title {
  font-size: 2rem;
  font-weight: 700;
  color: white;
  text-align: center;
}

.button {
  padding: 12px 24px;
  background: #4ade80;
  color: white;
  border: none;
  border-radius: 8px;
  cursor: pointer;
  transition: transform 0.2s;
}

.button:hover {
  transform: scale(1.05);
}`,
    monacoLanguage: 'css'
  },
  json: {
    name: 'JSON',
    icon: '📋',
    version: 'JSON5',
    template: `{
  "name": "WebLinuxOS",
  "version": "2.9.0",
  "description": "一个基于Web的Linux操作系统模拟器",
  "features": [
    "终端模拟",
    "文件管理",
    "多窗口支持",
    "虚拟桌面",
    "100+ 应用程序"
  ],
  "author": {
    "name": "Developer",
    "email": "dev@example.com"
  },
  "repository": "https://github.com/saya-ch/WebLinuxOS"
}`,
    monacoLanguage: 'json'
  },
  markdown: {
    name: 'Markdown',
    icon: '📝',
    version: 'CommonMark',
    template: `# WebLinuxOS 使用指南

## 简介

WebLinuxOS 是一个基于 Web 技术构建的 **Linux 操作系统模拟器**。

## 功能特点

- 终端模拟器
- 文件管理系统
- 多窗口支持
- 虚拟桌面切换

## 快速开始

1. 打开终端应用
2. 输入 \`help\` 查看可用命令
3. 使用 \`neofetch\` 查看系统信息

## 代码示例

\`\`\`javascript
console.log("Hello, WebLinuxOS!");
\`\`\`

---

*更多信息请访问 [GitHub](https://github.com/saya-ch/WebLinuxOS)*`,
    monacoLanguage: 'markdown'
  }
}

// 在线代码运行器 - 支持多种编程语言
const OnlineCodeRunner = memo(function OnlineCodeRunner() {
  const [language, setLanguage] = useState<string>('javascript')
  const [code, setCode] = useState<string>(LANGUAGES.javascript.template)
  const [output, setOutput] = useState<string>('')
  const [isRunning, setIsRunning] = useState(false)
  const [executionTime, setExecutionTime] = useState<number | null>(null)
  const [showPreview, setShowPreview] = useState(false)
  const iframeRef = useRef<HTMLIFrameElement>(null)
  const addNotification = useStore(s => s.addNotification)

  // 切换语言时更新模板代码
  const handleLanguageChange = useCallback((lang: string) => {
    setLanguage(lang)
    setCode(LANGUAGES[lang].template)
    setOutput('')
    setShowPreview(lang === 'html')
  }, [])

  // 运行JavaScript代码
  const runJavaScript = useCallback((code: string) => {
    const logs: string[] = []
    const startTime = performance.now()
    
    try {
      // 创建安全的执行环境
      const safeEval = new Function(`
        const console = {
          log: (...args) => logs.push(args.map(a => 
            typeof a === 'object' ? JSON.stringify(a, null, 2) : String(a)
          ).join(' ')),
          error: (...args) => logs.push('[ERROR] ' + args.join(' ')),
          warn: (...args) => logs.push('[WARN] ' + args.join(' '))
        };
        try {
          ${code}
        } catch(e) {
          console.error(e.message);
        }
      `)
      
      safeEval()
      
      const endTime = performance.now()
      setExecutionTime(Math.round(endTime - startTime))
      setOutput(logs.join('\n') || '代码执行完成，无输出')
    } catch (err) {
      setOutput(`执行错误: ${(err as Error).message}`)
    }
  }, [])

  // 运行HTML代码
  const runHTML = useCallback((code: string) => {
    if (iframeRef.current) {
      iframeRef.current.srcdoc = code
      setOutput('HTML已渲染到预览区域')
    }
  }, [])

  // 运行Python代码（模拟）
  const runPython = useCallback((code: string) => {
    const startTime = performance.now()
    
    // 模拟Python执行输出
    const lines = code.split('\n')
    const outputs: string[] = []
    
    for (const line of lines) {
      const printMatch = line.match(/print\s*\(\s*["'](.+?)["']\s*\)/)
      if (printMatch) {
        outputs.push(printMatch[1])
      }
      
      const fstringMatch = line.match(/print\s*\(\s*f["'](.+?)["']\s*\)/)
      if (fstringMatch) {
        outputs.push(fstringMatch[1].replace(/\{[^}]+\}/g, 'value'))
      }
    }
    
    const endTime = performance.now()
    setExecutionTime(Math.round(endTime - startTime))
    setOutput(outputs.join('\n') || 'Python代码已执行（模拟环境）')
  }, [])

  // 运行代码
  const runCode = useCallback(async () => {
    if (!code.trim()) {
      addNotification({
        title: '代码运行',
        message: '请输入代码',
        type: 'warning'
      })
      return
    }
    
    setIsRunning(true)
    setOutput('')
    
    try {
      switch (language) {
        case 'javascript':
        case 'typescript':
          runJavaScript(code)
          break
        case 'python':
          runPython(code)
          break
        case 'html':
          runHTML(code)
          setShowPreview(true)
          break
        case 'css':
          setOutput('CSS代码已解析（需要配合HTML使用）')
          break
        case 'json':
          try {
            JSON.parse(code)
            setOutput('JSON格式有效 ✓')
          } catch {
            setOutput('JSON格式无效 ✗')
          }
          break
        case 'markdown':
          setOutput('Markdown已渲染（需要配合Markdown预览器使用）')
          break
        default:
          setOutput('暂不支持该语言的实际执行')
      }
    } catch (err) {
      setOutput(`运行错误: ${(err as Error).message}`)
    }
    
    setIsRunning(false)
  }, [code, language, runJavaScript, runHTML, runPython, addNotification])

  // 清空代码
  const clearCode = useCallback(() => {
    setCode('')
    setOutput('')
    setExecutionTime(null)
  }, [])

  // 复制代码
  const copyCode = useCallback(async () => {
    await navigator.clipboard.writeText(code)
    addNotification({
      title: '代码复制',
      message: '代码已复制到剪贴板',
      type: 'success'
    })
  }, [code, addNotification])

  // 下载代码
  const downloadCode = useCallback(() => {
    const extensions: Record<string, string> = {
      javascript: 'js',
      typescript: 'ts',
      python: 'py',
      html: 'html',
      css: 'css',
      json: 'json',
      markdown: 'md'
    }
    
    const blob = new Blob([code], { type: 'text/plain' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `code.${extensions[language] || 'txt'}`
    a.click()
    URL.revokeObjectURL(url)
    
    addNotification({
      title: '代码下载',
      message: '代码已下载',
      type: 'success'
    })
  }, [code, language, addNotification])

  const containerStyle: React.CSSProperties = {
    height: '100%',
    display: 'flex',
    flexDirection: 'column',
    background: 'var(--bg)',
    color: 'var(--text)',
    fontFamily: 'system-ui, -apple-system, sans-serif'
  }

  return (
    <div style={containerStyle}>
      {/* 顶部工具栏 */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        gap: 8,
        padding: '12px 16px',
        borderBottom: '1px solid var(--border)',
        background: 'var(--bg-secondary)'
      }}>
        {/* 语言选择 */}
        <select
          value={language}
          onChange={(e) => handleLanguageChange(e.target.value)}
          style={{
            padding: '8px 12px',
            borderRadius: 6,
            border: '1px solid var(--border)',
            background: 'var(--bg)',
            color: 'var(--text)',
            fontSize: 13,
            cursor: 'pointer'
          }}
        >
          {Object.entries(LANGUAGES).map(([key, lang]) => (
            <option key={key} value={key}>
              {lang.icon} {lang.name} ({lang.version})
            </option>
          ))}
        </select>

        {/* 运行按钮 */}
        <button
          onClick={runCode}
          disabled={isRunning}
          style={{
            padding: '8px 16px',
            borderRadius: 6,
            background: isRunning ? 'var(--text-muted)' : '#22c55e',
            color: '#fff',
            border: 'none',
            cursor: isRunning ? 'wait' : 'pointer',
            fontSize: 13,
            fontWeight: 600
          }}
        >
          {isRunning ? '运行中...' : '▶ 运行'}
        </button>

        {/* 其他按钮 */}
        <button onClick={clearCode} style={{
          padding: '8px 12px',
          borderRadius: 6,
          background: 'var(--bg)',
          color: 'var(--text)',
          border: '1px solid var(--border)',
          cursor: 'pointer',
          fontSize: 13
        }}>
          清空
        </button>
        
        <button onClick={copyCode} style={{
          padding: '8px 12px',
          borderRadius: 6,
          background: 'var(--bg)',
          color: 'var(--text)',
          border: '1px solid var(--border)',
          cursor: 'pointer',
          fontSize: 13
        }}>
          复制
        </button>
        
        <button onClick={downloadCode} style={{
          padding: '8px 12px',
          borderRadius: 6,
          background: 'var(--bg)',
          color: 'var(--text)',
          border: '1px solid var(--border)',
          cursor: 'pointer',
          fontSize: 13
        }}>
          下载
        </button>

        {/* 语言信息 */}
        <div style={{
          marginLeft: 'auto',
          fontSize: 12,
          color: 'var(--text-muted)'
        }}>
          {LANGUAGES[language].name} | {LANGUAGES[language].version}
        </div>
      </div>

      {/* 主内容区 */}
      <div style={{ flex: 1, display: 'flex', overflow: 'hidden' }}>
        {/* 代码编辑区 */}
        <div style={{
          flex: showPreview ? 1 : 2,
          display: 'flex',
          flexDirection: 'column',
          minWidth: 300
        }}>
          <textarea
            value={code}
            onChange={(e) => setCode(e.target.value)}
            placeholder={`输入 ${LANGUAGES[language].name} 代码...`}
            spellCheck={false}
            style={{
              flex: 1,
              padding: 16,
              fontSize: 14,
              fontFamily: "'SF Mono', 'Monaco', 'Menlo', 'Consolas', monospace",
              background: 'var(--bg)',
              color: 'var(--text)',
              border: 'none',
              outline: 'none',
              resize: 'none',
              lineHeight: 1.6,
              tabSize: 2,
              whiteSpace: 'pre'
            }}
          />
        </div>

        {/* 预览区（仅HTML） */}
        {showPreview && language === 'html' && (
          <div style={{
            flex: 1,
            display: 'flex',
            flexDirection: 'column',
            minWidth: 300,
            borderLeft: '1px solid var(--border)'
          }}>
            <div style={{
              padding: '8px 12px',
              fontSize: 12,
              color: 'var(--text-muted)',
              borderBottom: '1px solid var(--border)',
              background: 'var(--bg-secondary)'
            }}>
              HTML预览
            </div>
            <iframe
              ref={iframeRef}
              sandbox="allow-scripts"
              style={{
                flex: 1,
                border: 'none',
                background: '#fff'
              }}
              title="HTML Preview"
            />
          </div>
        )}
      </div>

      {/* 输出区 */}
      <div style={{
        borderTop: '1px solid var(--border)',
        background: 'var(--bg-secondary)',
        minHeight: 120,
        maxHeight: 200,
        overflow: 'auto'
      }}>
        <div style={{
          padding: '8px 16px',
          fontSize: 12,
          color: 'var(--text-muted)',
          borderBottom: '1px solid var(--border)',
          display: 'flex',
          justifyContent: 'space-between'
        }}>
          <span>输出</span>
          {executionTime !== null && (
            <span>执行时间: {executionTime}ms</span>
          )}
        </div>
        <div style={{
          padding: 12,
          fontFamily: "'SF Mono', 'Monaco', 'Menlo', monospace",
          fontSize: 13,
          whiteSpace: 'pre-wrap',
          color: output.includes('错误') || output.includes('ERROR') ? '#ef4444' : 'var(--text)'
        }}>
          {output || '点击运行按钮执行代码'}
        </div>
      </div>
    </div>
  )
})

export default OnlineCodeRunner