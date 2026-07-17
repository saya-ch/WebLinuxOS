import { useState, useCallback, useRef, useEffect } from 'react'

interface CodeFile {
  id: string
  name: string
  language: string
  content: string
}

const LANGUAGES = [
  { id: 'javascript', name: 'JavaScript', icon: '🟨', monaco: 'javascript', runSupport: true },
  { id: 'typescript', name: 'TypeScript', icon: '🟦', monaco: 'typescript', runSupport: true },
  { id: 'python', name: 'Python', icon: '🐍', monaco: 'python', runSupport: true },
  { id: 'html', name: 'HTML', icon: '🌐', monaco: 'html', runSupport: false },
  { id: 'css', name: 'CSS', icon: '🎨', monaco: 'css', runSupport: false },
  { id: 'json', name: 'JSON', icon: '📋', monaco: 'json', runSupport: false },
  { id: 'markdown', name: 'Markdown', icon: '📝', monaco: 'markdown', runSupport: false },
]

const CODE_TEMPLATES: Record<string, string> = {
  javascript: `// JavaScript 示例代码
function greet(name) {
  return \`Hello, \${name}!\`;
}

console.log(greet('WebLinuxOS'));

// 数组操作示例
const numbers = [1, 2, 3, 4, 5];
const doubled = numbers.map(n => n * 2);
console.log('Doubled:', doubled);

// 异步操作示例
async function fetchData() {
  return new Promise(resolve => {
    setTimeout(() => resolve({ data: 'Sample Data' }), 1000);
  });
}

fetchData().then(result => console.log('Fetched:', result));
`,
  typescript: `// TypeScript 示例代码
interface User {
  id: number;
  name: string;
  email: string;
}

function createUser(name: string, email: string): User {
  return {
    id: Date.now(),
    name,
    email
  };
}

const user = createUser('WebLinuxOS User', 'user@weblinux.os');
console.log('Created user:', user);

// 泛型示例
function identity<T>(arg: T): T {
  return arg;
}

console.log(identity<string>('Hello TypeScript'));
console.log(identity<number>(42));
`,
  python: `# Python 示例代码
def greet(name):
    return f"Hello, {name}!"

print(greet('WebLinuxOS'))

# 列表推导式
numbers = [1, 2, 3, 4, 5]
doubled = [n * 2 for n in numbers]
print('Doubled:', doubled)

# 类定义
class Calculator:
    def __init__(self):
        self.result = 0
    
    def add(self, x):
        self.result += x
        return self
    
    def multiply(self, x):
        self.result *= x
        return self

calc = Calculator()
print('Result:', calc.add(5).multiply(3).result)
`,
  html: `<!DOCTYPE html>
<html lang="zh-CN">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>WebLinuxOS HTML 示例</title>
    <style>
        body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            max-width: 800px;
            margin: 0 auto;
            padding: 20px;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: white;
        }
        .container {
            background: rgba(255, 255, 255, 0.1);
            padding: 30px;
            border-radius: 15px;
            backdrop-filter: blur(10px);
        }
        h1 {
            text-align: center;
        }
        .feature {
            background: rgba(255, 255, 255, 0.1);
            padding: 15px;
            margin: 10px 0;
            border-radius: 8px;
        }
    </style>
</head>
<body>
    <div class="container">
        <h1>🚀 WebLinuxOS HTML 示例</h1>
        <div class="feature">
            <h3>响应式设计</h3>
            <p>这个页面展示了现代HTML/CSS技术的应用。</p>
        </div>
        <div class="feature">
            <h3>渐变背景</h3>
            <p>使用CSS渐变创建视觉吸引力。</p>
        </div>
        <div class="feature">
            <h3>玻璃态效果</h3>
            <p>使用backdrop-filter实现毛玻璃效果。</p>
        </div>
    </div>
</body>
</html>
`,
  css: `/* CSS 示例 - 现代样式设计 */

:root {
  --primary-color: #667eea;
  --secondary-color: #764ba2;
  --text-color: #333;
  --bg-color: #f8f9fa;
}

body {
  font-family: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif;
  line-height: 1.6;
  color: var(--text-color);
  background-color: var(--bg-color);
}

/* 现代卡片设计 */
.card {
  background: white;
  border-radius: 12px;
  padding: 24px;
  box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
  transition: transform 0.2s, box-shadow 0.2s;
}

.card:hover {
  transform: translateY(-2px);
  box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.1);
}

/* 渐变按钮 */
.btn-gradient {
  background: linear-gradient(135deg, var(--primary-color), var(--secondary-color));
  color: white;
  border: none;
  padding: 12px 24px;
  border-radius: 8px;
  cursor: pointer;
  font-weight: 600;
  transition: opacity 0.2s;
}

.btn-gradient:hover {
  opacity: 0.9;
}

/* 响应式网格 */
.grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
  gap: 20px;
}

/* 动画 */
@keyframes fadeIn {
  from {
    opacity: 0;
    transform: translateY(20px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.fade-in {
  animation: fadeIn 0.5s ease-out;
}
`,
  json: `{
  "project": "WebLinuxOS",
  "version": "38.0.0",
  "description": "浏览器中运行的完整Linux桌面环境",
  "features": [
    "240+ 内置应用",
    "150+ 终端命令",
    "虚拟文件系统",
    "实时API集成",
    "Python运行时"
  ],
  "tech_stack": {
    "frontend": "React 19",
    "language": "TypeScript 6",
    "build": "Vite 8",
    "state": "Zustand 5"
  },
  "apps": {
    "total": 240,
    "categories": [
      "productivity",
      "development",
      "utilities",
      "media",
      "system"
    ]
  },
  "terminal": {
    "commands": 150,
    "python_support": true,
    "api_integrations": true
  }
}
`,
  markdown: `# WebLinuxOS 使用指南

## 项目介绍

WebLinuxOS是一个在浏览器中完整运行的Linux桌面环境。

### 核心特性

- **240+ 内置应用** - 涵盖生产力、开发、媒体等各个领域
- **150+ 终端命令** - 完整的命令行体验
- **虚拟文件系统** - 支持文件操作的持久化存储
- **实时API集成** - 天气、新闻、加密货币等
- **Python运行时** - 通过Pyodide在浏览器中运行Python

## 快速开始

1. 打开应用启动器 (\`Ctrl + Shift + L\`)
2. 选择您需要的应用
3. 开始使用!

## 键盘快捷键

| 快捷键 | 功能 |
|--------|------|
| Ctrl + Shift + L | 打开应用启动器 |
| Ctrl + T | 打开终端 |
| Ctrl + E | 打开文件管理器 |
| Ctrl + K | 全局搜索 |

## 更多信息

访问 [GitHub仓库](https://github.com/saya-ch/WebLinuxOS) 了解更多。
`
}

export default function OnlineCodeRunnerEnhanced() {
  const [files, setFiles] = useState<CodeFile[]>([
    {
      id: '1',
      name: 'main.js',
      language: 'javascript',
      content: CODE_TEMPLATES.javascript
    }
  ])
  const [activeFileId, setActiveFileId] = useState('1')
  const [output, setOutput] = useState<string[]>([])
  const [isRunning, setIsRunning] = useState(false)
  const [showPreview, setShowPreview] = useState(false)
  const outputRef = useRef<HTMLDivElement>(null)
  const iframeRef = useRef<HTMLIFrameElement>(null)

  const activeFile = files.find(f => f.id === activeFileId)

  useEffect(() => {
    if (outputRef.current) {
      outputRef.current.scrollTop = outputRef.current.scrollHeight
    }
  }, [output])

  const runJavaScript = useCallback((code: string) => {
    setIsRunning(true)
    setOutput([])
    
    // 创建安全的执行环境
    const logs: string[] = []
    
    // 拦截console输出
    const mockConsole = {
      log: (...args: any[]) => {
        logs.push(args.map(arg => 
          typeof arg === 'object' ? JSON.stringify(arg, null, 2) : String(arg)
        ).join(' '))
        setOutput([...logs])
      },
      error: (...args: any[]) => {
        logs.push(`❌ ${args.map(arg => String(arg)).join(' ')}`)
        setOutput([...logs])
      },
      warn: (...args: any[]) => {
        logs.push(`⚠️ ${args.map(arg => String(arg)).join(' ')}`)
        setOutput([...logs])
      },
      info: (...args: any[]) => {
        logs.push(`ℹ️ ${args.map(arg => String(arg)).join(' ')}`)
        setOutput([...logs])
      }
    }

    try {
      // 创建函数并执行
      const func = new Function('console', code)
      func(mockConsole)
      logs.push('✅ 代码执行成功')
      setOutput([...logs])
    } catch (error) {
      logs.push(`❌ 错误: ${error instanceof Error ? error.message : String(error)}`)
      setOutput([...logs])
    } finally {
      setIsRunning(false)
    }
  }, [])

  const runCode = useCallback(() => {
    if (!activeFile) return
    
    const lang = LANGUAGES.find(l => l.id === activeFile.language)
    if (!lang?.runSupport) {
      setOutput(['❌ 该语言暂不支持在线运行'])
      return
    }

    if (activeFile.language === 'javascript' || activeFile.language === 'typescript') {
      runJavaScript(activeFile.content)
    } else if (activeFile.language === 'python') {
      // Python运行需要Pyodide，这里显示提示
      setOutput([
        '🐍 Python代码执行需要Pyodide运行时',
        '请使用Terminal应用运行Python代码:',
        '1. 打开终端 (Ctrl + T)',
        '2. 输入: python',
        '3. 粘贴代码并执行',
        '',
        '或者使用集成的Python运行命令:',
        '$ python -c "您的代码"'
      ])
    }
  }, [activeFile, runJavaScript])

  const updateFileContent = useCallback((fileId: string, content: string) => {
    setFiles(prev => prev.map(f => 
      f.id === fileId ? { ...f, content } : f
    ))
  }, [])

  const addNewFile = useCallback(() => {
    const newFile: CodeFile = {
      id: Date.now().toString(),
      name: `file-${files.length + 1}.js`,
      language: 'javascript',
      content: CODE_TEMPLATES.javascript
    }
    setFiles(prev => [...prev, newFile])
    setActiveFileId(newFile.id)
  }, [files.length])

  const deleteFile = useCallback((fileId: string) => {
    if (files.length <= 1) return
    setFiles(prev => prev.filter(f => f.id !== fileId))
    if (activeFileId === fileId) {
      setActiveFileId(files[0].id)
    }
  }, [files, activeFileId])

  const changeLanguage = useCallback((fileId: string, language: string) => {
    setFiles(prev => prev.map(f => 
      f.id === fileId ? { 
        ...f, 
        language,
        content: CODE_TEMPLATES[language] || ''
      } : f
    ))
  }, [])

  const handlePreview = useCallback(() => {
    if (activeFile?.language === 'html') {
      setShowPreview(true)
      if (iframeRef.current) {
        const blob = new Blob([activeFile.content], { type: 'text/html' })
        iframeRef.current.src = URL.createObjectURL(blob)
      }
    }
  }, [activeFile])

  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      height: '100%',
      background: 'var(--bg)',
      color: 'var(--fg)'
    }}>
      {/* 工具栏 */}
      <div style={{
        display: 'flex',
        gap: '8px',
        padding: '12px',
        borderBottom: '1px solid var(--border)',
        background: 'var(--card)',
        alignItems: 'center'
      }}>
        <button
          onClick={runCode}
          disabled={isRunning || !LANGUAGES.find(l => l.id === activeFile?.language)?.runSupport}
          style={{
            padding: '8px 16px',
            background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
            color: 'white',
            border: 'none',
            borderRadius: '6px',
            cursor: 'pointer',
            fontSize: '14px',
            fontWeight: 500,
            opacity: isRunning ? 0.7 : 1
          }}
        >
          {isRunning ? '⏳ 运行中...' : '▶ 运行'}
        </button>
        
        {activeFile?.language === 'html' && (
          <button
            onClick={handlePreview}
            style={{
              padding: '8px 16px',
              background: 'var(--accent)',
              color: 'white',
              border: 'none',
              borderRadius: '6px',
              cursor: 'pointer',
              fontSize: '14px'
            }}
          >
            👁 预览
          </button>
        )}
        
        <select
          value={activeFile?.language || 'javascript'}
          onChange={(e) => changeLanguage(activeFileId, e.target.value)}
          style={{
            padding: '8px 12px',
            background: 'var(--input-bg)',
            color: 'var(--fg)',
            border: '1px solid var(--border)',
            borderRadius: '6px',
            cursor: 'pointer'
          }}
        >
          {LANGUAGES.map(lang => (
            <option key={lang.id} value={lang.id}>
              {lang.icon} {lang.name}
            </option>
          ))}
        </select>
        
        <div style={{ flex: 1 }} />
        
        <button
          onClick={addNewFile}
          style={{
            padding: '8px 12px',
            background: 'var(--success)',
            color: 'white',
            border: 'none',
            borderRadius: '6px',
            cursor: 'pointer',
            fontSize: '14px'
          }}
        >
          ➕ 新文件
        </button>
      </div>

      {/* 文件标签 */}
      <div style={{
        display: 'flex',
        gap: '4px',
        padding: '8px 12px',
        background: 'var(--surface)',
        borderBottom: '1px solid var(--border)',
        overflowX: 'auto'
      }}>
        {files.map(file => (
          <div
            key={file.id}
            onClick={() => setActiveFileId(file.id)}
            style={{
              padding: '6px 12px',
              background: file.id === activeFileId ? 'var(--accent)' : 'var(--card)',
              color: file.id === activeFileId ? 'white' : 'var(--fg)',
              borderRadius: '4px',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              fontSize: '13px',
              whiteSpace: 'nowrap'
            }}
          >
            {LANGUAGES.find(l => l.id === file.language)?.icon} {file.name}
            {files.length > 1 && (
              <span
                onClick={(e) => {
                  e.stopPropagation()
                  deleteFile(file.id)
                }}
                style={{ opacity: 0.7, cursor: 'pointer' }}
              >
                ✕
              </span>
            )}
          </div>
        ))}
      </div>

      {/* 主内容区域 */}
      <div style={{ display: 'flex', flex: 1, overflow: 'hidden' }}>
        {/* 编辑器 */}
        <div style={{
          flex: 1,
          display: 'flex',
          flexDirection: 'column',
          borderRight: '1px solid var(--border)'
        }}>
          <div style={{
            padding: '8px 12px',
            borderBottom: '1px solid var(--border)',
            fontSize: '12px',
            opacity: 0.7
          }}>
            {activeFile?.name} - {activeFile?.content.length || 0} 字符
          </div>
          <textarea
            value={activeFile?.content || ''}
            onChange={(e) => updateFileContent(activeFileId, e.target.value)}
            spellCheck={false}
            style={{
              flex: 1,
              padding: '16px',
              background: 'var(--bg)',
              color: 'var(--fg)',
              border: 'none',
              resize: 'none',
              fontFamily: 'Consolas, Monaco, "Courier New", monospace',
              fontSize: '14px',
              lineHeight: 1.6,
              outline: 'none'
            }}
            placeholder="在此输入代码..."
          />
        </div>

        {/* 输出区域 */}
        <div style={{
          width: showPreview ? '600px' : '400px',
          display: 'flex',
          flexDirection: 'column',
          background: 'var(--surface)'
        }}>
          <div style={{
            padding: '8px 12px',
            borderBottom: '1px solid var(--border)',
            fontSize: '13px',
            fontWeight: 500
          }}>
            📤 输出
          </div>
          
          {showPreview ? (
            <iframe
              ref={iframeRef}
              style={{
                flex: 1,
                border: 'none',
                background: 'white'
              }}
              title="Preview"
              sandbox="allow-scripts"
            />
          ) : (
            <div
              ref={outputRef}
              style={{
                flex: 1,
                padding: '12px',
                overflow: 'auto',
                fontFamily: 'Consolas, Monaco, "Courier New", monospace',
                fontSize: '13px',
                lineHeight: 1.5,
                whiteSpace: 'pre-wrap'
              }}
            >
              {output.length === 0 ? (
                <div style={{ opacity: 0.5 }}>
                  点击"运行"按钮执行代码
                </div>
              ) : (
                output.map((line, i) => (
                  <div key={i}>{line}</div>
                ))
              )}
            </div>
          )}
        </div>
      </div>

      {/* 状态栏 */}
      <div style={{
        padding: '6px 12px',
        borderTop: '1px solid var(--border)',
        fontSize: '12px',
        display: 'flex',
        gap: '16px',
        background: 'var(--card)'
      }}>
        <span>📁 {files.length} 个文件</span>
        <span>📝 {activeFile?.language || 'Unknown'}</span>
        <span>📊 {activeFile?.content.split('\n').length || 0} 行</span>
      </div>
    </div>
  )
}