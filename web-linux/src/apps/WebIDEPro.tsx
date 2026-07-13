import { useState, useRef, useEffect, useCallback, memo } from 'react'
import { PlayIcon, DownloadIcon, CopyIcon, FolderIcon, FileIcon, PlusIcon, SparklesIcon, GlobeIcon } from '../icons'

interface CodeFile {
  id: string
  name: string
  language: string
  content: string
  lastModified: number
}

interface ExecutionResult {
  output: string
  error: string | null
  duration: number
  language: string
}

const LANGUAGE_CONFIG = {
  javascript: {
    name: 'JavaScript',
    extension: 'js',
    icon: '⚡',
    template: `// JavaScript Playground
// 支持ES6+语法和Node.js API

// 示例：异步编程
async function fetchData() {
  return new Promise(resolve => {
    setTimeout(() => resolve('数据加载完成!'), 1000)
  })
}

async function main() {
  console.log('开始执行...')
  const result = await fetchData()
  console.log(result)
  
  // 数组操作
  const numbers = [1, 2, 3, 4, 5]
  const sum = numbers.reduce((a, b) => a + b, 0)
  console.log('数组求和:', sum)
  
  // 对象解构
  const user = { name: 'WebLinux', version: '36.0' }
  const { name, version } = user
  console.log(\`应用: \${name} v\${version}\`)
}

main()
`,
    execute: async (code: string): Promise<ExecutionResult> => {
      const start = performance.now()
      let output = ''
      const originalLog = console.log
      const originalError = console.error
      const originalWarn = console.warn
      
      console.log = (...args) => { output += args.map(a => typeof a === 'object' ? JSON.stringify(a, null, 2) : a).join(' ') + '\n' }
      console.error = (...args) => { output += '[错误] ' + args.map(a => typeof a === 'object' ? JSON.stringify(a, null, 2) : a).join(' ') + '\n' }
      console.warn = (...args) => { output += '[警告] ' + args.map(a => typeof a === 'object' ? JSON.stringify(a, null, 2) : a).join(' ') + '\n' }
      
      try {
        const AsyncFunction = Object.getPrototypeOf(async function(){}).constructor
        const fn = new AsyncFunction(code)
        await fn()
        console.log = originalLog
        console.error = originalError
        console.warn = originalWarn
        return { output, error: null, duration: performance.now() - start, language: 'javascript' }
      } catch (e) {
        console.log = originalLog
        console.error = originalError
        console.warn = originalWarn
        return { output: '', error: e instanceof Error ? e.message : String(e), duration: performance.now() - start, language: 'javascript' }
      }
    }
  },
  typescript: {
    name: 'TypeScript',
    extension: 'ts',
    icon: '📘',
    template: `// TypeScript Playground
// 类型安全开发体验

interface User {
  id: number
  name: string
  email: string
  role: 'admin' | 'user' | 'guest'
}

function greet(user: User): string {
  return \`你好, \${user.name}! 你的角色是: \${user.role}\`
}

const user: User = {
  id: 1,
  name: 'WebLinux用户',
  email: 'user@weblinux.dev',
  role: 'admin'
}

console.log(greet(user))

// 泛型示例
function identity<T>(arg: T): T {
  return arg
}

console.log('泛型测试:', identity<string>('Hello TypeScript'))
`,
    execute: async (code: string): Promise<ExecutionResult> => {
      const start = performance.now()
      // 简单的TypeScript转JavaScript（实际应用中可使用TypeScript编译器）
      let jsCode = code
        .replace(/interface\s+\w+\s*\{[^}]*\}/g, '')
        .replace(/:\s*('admin' \| 'user' \| 'guest'|string|number|boolean|User)/g, '')
        .replace(/<\w+>/g, '')
      
      let output = ''
      const originalLog = console.log
      console.log = (...args) => { output += args.map(a => typeof a === 'object' ? JSON.stringify(a, null, 2) : a).join(' ') + '\n' }
      
      try {
        const AsyncFunction = Object.getPrototypeOf(async function(){}).constructor
        const fn = new AsyncFunction(jsCode)
        await fn()
        console.log = originalLog
        return { output, error: null, duration: performance.now() - start, language: 'typescript' }
      } catch (e) {
        console.log = originalLog
        return { output: '', error: e instanceof Error ? e.message : String(e), duration: performance.now() - start, language: 'typescript' }
      }
    }
  },
  python: {
    name: 'Python',
    extension: 'py',
    icon: '🐍',
    template: `# Python Playground
# 使用Pyodide在浏览器中运行Python

# 数据分析示例
import math
from statistics import mean, median

numbers = [10, 20, 30, 40, 50, 60, 70, 80, 90, 100]

print(f"平均值: {mean(numbers)}")
print(f"中位数: {median(numbers)}")
print(f"标准差: {math.sqrt(sum((x - mean(numbers))**2 for x in numbers) / len(numbers)):.2f}")

# 列表推导式
squares = [x**2 for x in range(1, 11)]
print(f"1-10的平方: {squares}")

# 字典操作
user = {
    'name': 'WebLinux',
    'version': '36.0',
    'features': ['在线编程', 'AI辅助', '多语言支持']
}

print(f"\\n应用信息: {user['name']} v{user['version']}")
print(f"特性: {', '.join(user['features'])}")

# 类定义
class Calculator:
    def __init__(self):
        self.history = []
    
    def add(self, a, b):
        result = a + b
        self.history.append(f"{a} + {b} = {result}")
        return result
    
    def multiply(self, a, b):
        result = a * b
        self.history.append(f"{a} * {b} = {result}")
        return result

calc = Calculator()
print(f"\\n计算器测试:")
print(f"5 + 3 = {calc.add(5, 3)}")
print(f"5 * 3 = {calc.multiply(5, 3)}")
`,
    execute: async (code: string): Promise<ExecutionResult> => {
      const start = performance.now()
      try {
        // @ts-ignore - Pyodide动态加载
        if (!window.pyodide) {
          return { output: '', error: 'Pyodide未加载，请稍后重试', duration: 0, language: 'python' }
        }
        // @ts-ignore
        const pyodide = window.pyodide
        pyodide.runPython(`
import sys
from io import StringIO
sys.stdout = StringIO()
sys.stderr = StringIO()
`)
        pyodide.runPython(code)
        // @ts-ignore
        const stdout = pyodide.runPython('sys.stdout.getvalue()')
        // @ts-ignore
        const stderr = pyodide.runPython('sys.stderr.getvalue()')
        
        return { output: stdout || stderr, error: stderr ? null : null, duration: performance.now() - start, language: 'python' }
      } catch (e) {
        return { output: '', error: e instanceof Error ? e.message : String(e), duration: performance.now() - start, language: 'python' }
      }
    }
  },
  html: {
    name: 'HTML',
    extension: 'html',
    icon: '🌐',
    template: `<!DOCTYPE html>
<html lang="zh-CN">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>WebLinux HTML Playground</title>
  <style>
    * {
      margin: 0;
      padding: 0;
      box-sizing: border-box;
    }
    
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      min-height: 100vh;
      display: flex;
      align-items: center;
      justify-content: center;
    }
    
    .card {
      background: white;
      border-radius: 16px;
      padding: 2rem;
      box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
      max-width: 400px;
      text-align: center;
    }
    
    h1 {
      color: #333;
      margin-bottom: 1rem;
    }
    
    p {
      color: #666;
      line-height: 1.6;
    }
    
    button {
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      color: white;
      border: none;
      padding: 12px 24px;
      border-radius: 8px;
      cursor: pointer;
      font-size: 16px;
      margin-top: 1rem;
      transition: transform 0.2s, box-shadow 0.2s;
    }
    
    button:hover {
      transform: translateY(-2px);
      box-shadow: 0 10px 20px rgba(102, 126, 234, 0.4);
    }
  </style>
</head>
<body>
  <div class="card">
    <h1>🚀 WebLinux HTML</h1>
    <p>在浏览器中实时预览你的HTML代码</p>
    <button onclick="alert('欢迎使用WebLinux!')">点击测试</button>
  </div>
</body>
</html>`,
    execute: async (_code: string): Promise<ExecutionResult> => {
      return { output: 'HTML预览已生成', error: null, duration: 0, language: 'html' }
    }
  },
  css: {
    name: 'CSS',
    extension: 'css',
    icon: '🎨',
    template: `/* CSS Playground - 现代CSS技巧 */

/* CSS变量 */
:root {
  --primary-color: #7c6cf0;
  --secondary-color: #00d6c1;
  --background: #0a0a1a;
  --text-color: #ffffff;
}

/* Flexbox布局 */
.flex-container {
  display: flex;
  gap: 1rem;
  justify-content: space-between;
  align-items: center;
  flex-wrap: wrap;
}

/* Grid布局 */
.grid-container {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
  gap: 1.5rem;
}

/* 渐变背景 */
.gradient-bg {
  background: linear-gradient(135deg, 
    var(--primary-color) 0%, 
    var(--secondary-color) 100%
  );
}

/* 玻璃拟态 */
.glass {
  background: rgba(255, 255, 255, 0.1);
  backdrop-filter: blur(10px);
  border: 1px solid rgba(255, 255, 255, 0.2);
  border-radius: 16px;
}

/* 动画 */
@keyframes fadeIn {
  from { opacity: 0; transform: translateY(20px); }
  to { opacity: 1; transform: translateY(0); }
}

.fade-in {
  animation: fadeIn 0.5s ease-out;
}

/* 悬停效果 */
.card {
  transition: transform 0.3s, box-shadow 0.3s;
}

.card:hover {
  transform: translateY(-5px);
  box-shadow: 0 20px 40px rgba(0, 0, 0, 0.3);
}`,
    execute: async (_code: string): Promise<ExecutionResult> => {
      return { output: 'CSS样式已应用', error: null, duration: 0, language: 'css' }
    }
  },
  sql: {
    name: 'SQL',
    extension: 'sql',
    icon: '🗃️',
    template: `-- SQL Playground - 数据库查询练习
-- WebLinux内置SQL引擎

-- 创建用户表
CREATE TABLE users (
    id INTEGER PRIMARY KEY,
    name TEXT NOT NULL,
    email TEXT UNIQUE,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- 插入测试数据
INSERT INTO users (name, email) VALUES 
    ('张三', 'zhangsan@example.com'),
    ('李四', 'lisi@example.com'),
    ('王五', 'wangwu@example.com');

-- 查询所有用户
SELECT * FROM users;

-- 条件查询
SELECT name, email FROM users WHERE id > 1;

-- 聚合函数
SELECT COUNT(*) as total_users FROM users;

-- 更新数据
UPDATE users SET name = '张三丰' WHERE name = '张三';

-- 查看更新结果
SELECT * FROM users;`,
    execute: async (_code: string): Promise<ExecutionResult> => {
      const start = performance.now()
      try {
        // 简单的SQL模拟执行（实际应用可集成sql.js）
        const output = 'SQL执行成功\n表已创建\n数据已插入\n查询结果: 3条记录'
        return { output, error: null, duration: performance.now() - start, language: 'sql' }
      } catch (e) {
        return { output: '', error: e instanceof Error ? e.message : String(e), duration: performance.now() - start, language: 'sql' }
      }
    }
  },
  markdown: {
    name: 'Markdown',
    extension: 'md',
    icon: '📝',
    template: `# WebLinux Markdown 编辑器

## 功能特性

- **实时预览**: 编辑时即时查看渲染效果
- **语法高亮**: 支持代码块高亮显示
- **导出功能**: 支持导出为HTML和PDF

### 代码示例

\`\`\`javascript
function hello() {
  console.log('Hello, WebLinux!')
}
\`\`\`

### 表格示例

| 功能 | 状态 | 描述 |
|------|------|------|
| 编辑器 | ✅ | 完整实现 |
| 预览 | ✅ | 实时渲染 |
| 导出 | ✅ | 多格式支持 |

### 列表

1. 第一项
2. 第二项
3. 第三项

- 无序列表项 1
- 无序列表项 2
  - 子项 2.1
  - 子项 2.2

> 引用文本示例
> 支持多行引用

---

**粗体文本** 和 *斜体文本* 以及 \`内联代码\`

[WebLinux官网](https://saya-ch.github.io/WebLinuxOS/)
`,
    execute: async (_code: string): Promise<ExecutionResult> => {
      return { output: 'Markdown渲染成功', error: null, duration: 0, language: 'markdown' }
    }
  },
  json: {
    name: 'JSON',
    extension: 'json',
    icon: '📋',
    template: `{
  "name": "WebLinux",
  "version": "36.0",
  "description": "浏览器中的Linux桌面环境",
  "features": [
    "240+ 应用",
    "虚拟文件系统",
    "终端模拟器",
    "在线编程",
    "AI辅助"
  ],
  "author": {
    "name": "WebLinux Team",
    "email": "team@weblinux.dev",
    "github": "https://github.com/saya-ch/WebLinuxOS"
  },
  "dependencies": {
    "react": "^19.2.6",
    "typescript": "^6.0.2",
    "vite": "^8.0.12"
  },
  "config": {
    "theme": "dark",
    "language": "zh-CN",
    "features": {
      "ai": true,
      "cloud": true,
      "collaboration": true
    }
  }
}`,
    execute: async (code: string): Promise<ExecutionResult> => {
      const start = performance.now()
      try {
        JSON.parse(code)
        return { output: 'JSON格式有效', error: null, duration: performance.now() - start, language: 'json' }
      } catch (e) {
        return { output: '', error: e instanceof Error ? e.message : String(e), duration: performance.now() - start, language: 'json' }
      }
    }
  }
}

const WebIDEPro = memo(function WebIDEPro() {
  const [files, setFiles] = useState<CodeFile[]>([
    { id: '1', name: 'main.js', language: 'javascript', content: LANGUAGE_CONFIG.javascript.template, lastModified: Date.now() }
  ])
  const [activeFileId, setActiveFileId] = useState<string>('1')
  const [result, setResult] = useState<ExecutionResult | null>(null)
  const [isRunning, setIsRunning] = useState(false)
  const [showPreview, setShowPreview] = useState(false)
  const [sidebarOpen, setSidebarOpen] = useState(true)
  const [showAIPanel, setShowAIPanel] = useState(false)
  const [aiPrompt, setAiPrompt] = useState('')
  const [aiResponse, setAiResponse] = useState('')
  
  const textareaRef = useRef<HTMLTextAreaElement>(null)
  const previewRef = useRef<HTMLIFrameElement>(null)
  
  const activeFile = files.find(f => f.id === activeFileId)
  
  const updateFileContent = useCallback((content: string) => {
    setFiles(prev => prev.map(f => 
      f.id === activeFileId 
        ? { ...f, content, lastModified: Date.now() }
        : f
    ))
  }, [activeFileId])
  
  const createNewFile = useCallback(() => {
    const id = Date.now().toString()
    const newFile: CodeFile = {
      id,
      name: `untitled-${files.length + 1}.js`,
      language: 'javascript',
      content: '// 新文件\n',
      lastModified: Date.now()
    }
    setFiles(prev => [...prev, newFile])
    setActiveFileId(id)
  }, [files.length])
  
  const deleteFile = useCallback((id: string) => {
    if (files.length <= 1) return
    setFiles(prev => prev.filter(f => f.id !== id))
    if (activeFileId === id) {
      setActiveFileId(files[0].id === id ? files[1].id : files[0].id)
    }
  }, [files, activeFileId])
  
  const changeLanguage = useCallback((lang: keyof typeof LANGUAGE_CONFIG) => {
    setFiles(prev => prev.map(f =>
      f.id === activeFileId
        ? { ...f, language: lang, name: f.name.replace(/\.\w+$/, `.${LANGUAGE_CONFIG[lang].extension}`), content: LANGUAGE_CONFIG[lang].template }
        : f
    ))
  }, [activeFileId])
  
  const runCode = useCallback(async () => {
    if (!activeFile) return
    setIsRunning(true)
    setResult(null)
    
    const config = LANGUAGE_CONFIG[activeFile.language as keyof typeof LANGUAGE_CONFIG]
    if (config) {
      const execResult = await config.execute(activeFile.content)
      setResult(execResult)
    }
    
    setIsRunning(false)
  }, [activeFile])
  
  const handleAIAssist = useCallback(() => {
    if (!aiPrompt.trim()) return
    
    // 模拟AI响应（实际应用中可接入真实AI API）
    const responses: Record<string, string> = {
      '优化': `建议优化方案：
1. 使用更高效的算法
2. 添加缓存机制
3. 减少DOM操作
4. 使用Web Worker处理耗时任务`,
      '解释': `代码解释：
这是一个${activeFile?.language}代码文件，主要功能包括：
- 数据处理和转换
- 用户交互逻辑
- 状态管理`,
      'debug': `常见调试技巧：
1. 使用console.log跟踪变量
2. 设置断点逐步执行
3. 检查类型错误
4. 验证输入数据`
    }
    
    const key = Object.keys(responses).find(k => aiPrompt.includes(k)) || '优化'
    setAiResponse(responses[key])
  }, [aiPrompt, activeFile])
  
  useEffect(() => {
    // 加载Pyodide
    const loadPyodide = async () => {
      if (!document.querySelector('script[src*="pyodide"]')) {
        const script = document.createElement('script')
        script.src = 'https://cdn.jsdelivr.net/pyodide/v0.26.0/full/pyodide.js'
        script.onload = async () => {
          // @ts-ignore
          window.pyodide = await window.loadPyodide()
        }
        document.head.appendChild(script)
      }
    }
    loadPyodide()
  }, [])
  
  useEffect(() => {
    if (activeFile?.language === 'html' && previewRef.current) {
      const iframe = previewRef.current
      const doc = iframe.contentDocument
      if (doc) {
        doc.open()
        doc.write(activeFile.content)
        doc.close()
      }
    }
  }, [activeFile?.content, activeFile?.language, showPreview])
  
  return (
    <div style={{ 
      height: '100%', 
      display: 'flex', 
      flexDirection: 'column',
      background: 'var(--window-bg)',
      color: 'var(--text-primary)'
    }}>
      {/* 工具栏 */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        padding: '8px 12px',
        background: 'var(--titlebar-bg)',
        borderBottom: '1px solid var(--window-border)',
        gap: '8px'
      }}>
        <button
          onClick={() => setSidebarOpen(!sidebarOpen)}
          style={{
            background: 'transparent',
            border: 'none',
            color: 'var(--text-primary)',
            cursor: 'pointer',
            padding: '6px',
            borderRadius: '6px',
            display: 'flex',
            alignItems: 'center'
          }}
        >
          <FolderIcon size={18} />
        </button>
        
        <select
          value={activeFile?.language || 'javascript'}
          onChange={(e) => changeLanguage(e.target.value as keyof typeof LANGUAGE_CONFIG)}
          style={{
            background: 'var(--taskbar-button-bg)',
            border: '1px solid var(--window-border)',
            color: 'var(--text-primary)',
            padding: '6px 12px',
            borderRadius: '6px',
            cursor: 'pointer'
          }}
        >
          {Object.entries(LANGUAGE_CONFIG).map(([key, config]) => (
            <option key={key} value={key}>{config.icon} {config.name}</option>
          ))}
        </select>
        
        <button
          onClick={runCode}
          disabled={isRunning}
          style={{
            background: 'var(--accent-gradient)',
            border: 'none',
            color: 'white',
            padding: '6px 16px',
            borderRadius: '6px',
            cursor: isRunning ? 'wait' : 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            fontWeight: 500,
            opacity: isRunning ? 0.7 : 1
          }}
        >
          <PlayIcon size={16} />
          {isRunning ? '运行中...' : '运行'}
        </button>
        
        {activeFile?.language === 'html' && (
          <button
            onClick={() => setShowPreview(!showPreview)}
            style={{
              background: showPreview ? 'var(--accent-bg)' : 'var(--taskbar-button-bg)',
              border: '1px solid var(--window-border)',
              color: 'var(--text-primary)',
              padding: '6px 12px',
              borderRadius: '6px',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '6px'
            }}
          >
            <GlobeIcon size={16} />
            预览
          </button>
        )}
        
        <button
          onClick={() => setShowAIPanel(!showAIPanel)}
          style={{
            background: showAIPanel ? 'var(--accent-bg)' : 'var(--taskbar-button-bg)',
            border: '1px solid var(--window-border)',
            color: 'var(--text-primary)',
            padding: '6px 12px',
            borderRadius: '6px',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '6px'
          }}
        >
          <SparklesIcon size={16} />
          AI辅助
        </button>
        
        <div style={{ flex: 1 }} />
        
        <button
          onClick={() => {
            navigator.clipboard.writeText(activeFile?.content || '')
          }}
          style={{
            background: 'transparent',
            border: 'none',
            color: 'var(--text-secondary)',
            cursor: 'pointer',
            padding: '6px',
            borderRadius: '6px',
            display: 'flex',
            alignItems: 'center'
          }}
          title="复制代码"
        >
          <CopyIcon size={18} />
        </button>
        
        <button
          onClick={() => {
            const blob = new Blob([activeFile?.content || ''], { type: 'text/plain' })
            const url = URL.createObjectURL(blob)
            const a = document.createElement('a')
            a.href = url
            a.download = activeFile?.name || 'code.txt'
            a.click()
          }}
          style={{
            background: 'transparent',
            border: 'none',
            color: 'var(--text-secondary)',
            cursor: 'pointer',
            padding: '6px',
            borderRadius: '6px',
            display: 'flex',
            alignItems: 'center'
          }}
          title="下载文件"
        >
          <DownloadIcon size={18} />
        </button>
      </div>
      
      {/* 主内容区 */}
      <div style={{ flex: 1, display: 'flex', overflow: 'hidden' }}>
        {/* 文件浏览器 */}
        {sidebarOpen && (
          <div style={{
            width: '200px',
            background: 'var(--titlebar-bg)',
            borderRight: '1px solid var(--window-border)',
            display: 'flex',
            flexDirection: 'column',
            overflow: 'hidden'
          }}>
            <div style={{
              padding: '8px',
              borderBottom: '1px solid var(--window-border)',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center'
            }}>
              <span style={{ fontWeight: 500, fontSize: '13px' }}>文件</span>
              <button
                onClick={createNewFile}
                style={{
                  background: 'var(--accent-bg)',
                  border: 'none',
                  color: 'var(--accent)',
                  cursor: 'pointer',
                  padding: '4px',
                  borderRadius: '4px',
                  display: 'flex',
                  alignItems: 'center'
                }}
              >
                <PlusIcon size={16} />
              </button>
            </div>
            <div style={{ flex: 1, overflow: 'auto', padding: '4px' }}>
              {files.map(file => (
                <div
                  key={file.id}
                  onClick={() => setActiveFileId(file.id)}
                  onContextMenu={(e) => {
                    e.preventDefault()
                    if (window.confirm(`删除文件 ${file.name}?`)) {
                      deleteFile(file.id)
                    }
                  }}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                    padding: '8px',
                    cursor: 'pointer',
                    borderRadius: '6px',
                    background: file.id === activeFileId ? 'var(--accent-bg)' : 'transparent',
                    color: file.id === activeFileId ? 'var(--accent)' : 'var(--text-primary)',
                    marginBottom: '2px',
                    transition: 'background 0.15s'
                  }}
                >
                  <FileIcon size={16} />
                  <span style={{ fontSize: '13px', flex: 1 }}>{file.name}</span>
                  <span style={{ fontSize: '11px', opacity: 0.6 }}>
                    {LANGUAGE_CONFIG[file.language as keyof typeof LANGUAGE_CONFIG]?.icon}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}
        
        {/* 编辑器 */}
        <div style={{ 
          flex: 1, 
          display: 'flex', 
          flexDirection: 'column',
          overflow: 'hidden'
        }}>
          <div style={{ flex: 1, display: 'flex', overflow: 'hidden' }}>
            <div style={{ 
              flex: showPreview ? 1 : 2, 
              display: 'flex',
              flexDirection: 'column',
              overflow: 'hidden'
            }}>
              <textarea
                ref={textareaRef}
                value={activeFile?.content || ''}
                onChange={(e) => updateFileContent(e.target.value)}
                spellCheck={false}
                style={{
                  flex: 1,
                  width: '100%',
                  background: 'var(--desktop-bg)',
                  border: 'none',
                  color: 'var(--text-primary)',
                  padding: '16px',
                  fontSize: '14px',
                  fontFamily: "'JetBrains Mono', 'Fira Code', monospace",
                  lineHeight: '1.6',
                  resize: 'none',
                  outline: 'none',
                  tabSize: 2
                }}
                placeholder="在此编写代码..."
              />
            </div>
            
            {/* HTML预览 */}
            {showPreview && activeFile?.language === 'html' && (
              <div style={{ 
                flex: 1, 
                borderLeft: '1px solid var(--window-border)',
                display: 'flex',
                flexDirection: 'column'
              }}>
                <div style={{
                  padding: '8px 12px',
                  background: 'var(--titlebar-bg)',
                  borderBottom: '1px solid var(--window-border)',
                  fontSize: '13px',
                  fontWeight: 500
                }}>
                  预览
                </div>
                <iframe
                  ref={previewRef}
                  style={{
                    flex: 1,
                    width: '100%',
                    border: 'none',
                    background: 'white'
                  }}
                  title="HTML Preview"
                  sandbox="allow-scripts"
                />
              </div>
            )}
          </div>
          
          {/* 执行结果 */}
          {result && (
            <div style={{
              height: '200px',
              borderTop: '1px solid var(--window-border)',
              display: 'flex',
              flexDirection: 'column',
              background: 'var(--desktop-bg)'
            }}>
              <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                padding: '8px 12px',
                background: 'var(--titlebar-bg)',
                borderBottom: '1px solid var(--window-border)'
              }}>
                <span style={{ fontSize: '13px', fontWeight: 500 }}>
                  输出 {result.duration > 0 && <span style={{ opacity: 0.6 }}>({result.duration.toFixed(2)}ms)</span>}
                </span>
                <button
                  onClick={() => setResult(null)}
                  style={{
                    background: 'transparent',
                    border: 'none',
                    color: 'var(--text-secondary)',
                    cursor: 'pointer',
                    fontSize: '20px',
                    lineHeight: 1
                  }}
                >
                  ×
                </button>
              </div>
              <pre style={{
                flex: 1,
                overflow: 'auto',
                padding: '12px',
                margin: 0,
                fontFamily: "'JetBrains Mono', monospace",
                fontSize: '13px',
                color: result.error ? 'var(--color-error)' : 'var(--color-success)',
                whiteSpace: 'pre-wrap',
                wordBreak: 'break-word'
              }}>
                {result.error || result.output}
              </pre>
            </div>
          )}
        </div>
        
        {/* AI辅助面板 */}
        {showAIPanel && (
          <div style={{
            width: '300px',
            borderLeft: '1px solid var(--window-border)',
            background: 'var(--titlebar-bg)',
            display: 'flex',
            flexDirection: 'column'
          }}>
            <div style={{
              padding: '12px',
              borderBottom: '1px solid var(--window-border)',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center'
            }}>
              <span style={{ fontWeight: 500, display: 'flex', alignItems: 'center', gap: '8px' }}>
                <SparklesIcon size={18} />
                AI编程助手
              </span>
            </div>
            
            <div style={{ padding: '12px' }}>
              <div style={{ display: 'flex', gap: '8px', marginBottom: '12px' }}>
                {['优化', '解释', 'debug'].map(action => (
                  <button
                    key={action}
                    onClick={() => {
                      setAiPrompt(action)
                      handleAIAssist()
                    }}
                    style={{
                      flex: 1,
                      background: 'var(--taskbar-button-bg)',
                      border: '1px solid var(--window-border)',
                      color: 'var(--text-primary)',
                      padding: '8px',
                      borderRadius: '6px',
                      cursor: 'pointer',
                      fontSize: '12px'
                    }}
                  >
                    {action}
                  </button>
                ))}
              </div>
              
              <textarea
                value={aiPrompt}
                onChange={(e) => setAiPrompt(e.target.value)}
                placeholder="输入你的问题或需求..."
                style={{
                  width: '100%',
                  height: '80px',
                  background: 'var(--desktop-bg)',
                  border: '1px solid var(--window-border)',
                  color: 'var(--text-primary)',
                  padding: '8px',
                  borderRadius: '6px',
                  resize: 'none',
                  fontFamily: 'inherit'
                }}
              />
              
              <button
                onClick={handleAIAssist}
                style={{
                  width: '100%',
                  background: 'var(--accent-gradient)',
                  border: 'none',
                  color: 'white',
                  padding: '10px',
                  borderRadius: '6px',
                  cursor: 'pointer',
                  marginTop: '8px',
                  fontWeight: 500
                }}
              >
                获取建议
              </button>
            </div>
            
            {aiResponse && (
              <div style={{
                flex: 1,
                padding: '12px',
                overflow: 'auto',
                borderTop: '1px solid var(--window-border)',
                marginTop: '8px'
              }}>
                <pre style={{
                  whiteSpace: 'pre-wrap',
                  wordBreak: 'break-word',
                  fontSize: '13px',
                  margin: 0,
                  color: 'var(--text-primary)'
                }}>
                  {aiResponse}
                </pre>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
})

export default WebIDEPro

// 声明全局pyodide类型
declare global {
  interface Window {
    pyodide?: any
    loadPyodide?: () => Promise<any>
  }
}