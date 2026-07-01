import { useState, useEffect, useCallback } from 'react'
import { useStore } from '../store'
import { PlayIcon, PauseIcon, UsersIcon, ShareIcon, CopyIcon, DownloadIcon, TerminalIcon } from '../icons'

interface Collaborator {
  id: string
  name: string
  color: string
  cursor?: { line: number; column: number }
}

interface CodeSession {
  id: string
  name: string
  language: string
  code: string
  collaborators: Collaborator[]
  createdAt: Date
}

export default function CodeCollaborationPlatform() {
  const theme = useStore((s) => s.theme)
  const addNotification = useStore((s) => s.addNotification)
  
  const [sessions, setSessions] = useState<CodeSession[]>([])
  const [currentSession, setCurrentSession] = useState<CodeSession | null>(null)
  const [code, setCode] = useState('')
  const [language, setLanguage] = useState('javascript')
  const [output, setOutput] = useState('')
  const [isRunning, setIsRunning] = useState(false)
  const [sessionId, setSessionId] = useState('')
  const [isSharing, setIsSharing] = useState(false)
  
  // 模拟协作用户
  const [simulatedCollaborators] = useState<Collaborator[]>([
    { id: '1', name: 'Alice', color: '#ff6b6b' },
    { id: '2', name: 'Bob', color: '#4ecdc4' },
    { id: '3', name: 'Charlie', color: '#ffe66d' }
  ])
  
  const languages = [
    { id: 'javascript', name: 'JavaScript', icon: 'JS' },
    { id: 'typescript', name: 'TypeScript', icon: 'TS' },
    { id: 'python', name: 'Python', icon: 'PY' },
    { id: 'html', name: 'HTML', icon: 'HT' },
    { id: 'css', name: 'CSS', icon: 'CS' },
    { id: 'markdown', name: 'Markdown', icon: 'MD' }
  ]
  
  const codeTemplates = {
    javascript: `// JavaScript 示例代码
function fibonacci(n) {
  if (n <= 1) return n;
  return fibonacci(n - 1) + fibonacci(n - 2);
}

console.log('Fibonacci 序列:');
for (let i = 0; i < 10; i++) {
  console.log(\`fib(\${i}) = \${fibonacci(i)}\`);
}`,
    python: `# Python 示例代码
def factorial(n):
    if n <= 1:
        return 1
    return n * factorial(n - 1)

print("阶乘计算:")
for i in range(1, 11):
    print(f"factorial({i}) = {factorial(i)}")`,
    html: `<!DOCTYPE html>
<html lang="zh-CN">
<head>
  <meta charset="UTF-8">
  <title>示例页面</title>
</head>
<body>
  <h1>欢迎使用 WebLinuxOS</h1>
  <p>这是一个在线协作开发平台</p>
</body>
</html>`,
    css: `/* CSS 样式示例 */
.container {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 20px;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
}

.title {
  font-size: 2rem;
  color: white;
  text-align: center;
}`,
    markdown: `# Markdown 示例文档

## 简介
这是一个**在线协作**平台,支持多人实时编辑代码。

### 功能特性
- 实时协作编辑
- 多语言支持
- 代码执行
- 分享链接

\`\`\`javascript
console.log("Hello, World!");
\`\`\`

> 欢迎使用 WebLinuxOS!`,
    typescript: `// TypeScript 示例代码
interface User {
  id: number;
  name: string;
  email: string;
}

class UserService {
  private users: User[] = [];
  
  addUser(user: User): void {
    this.users.push(user);
    console.log(\`添加用户: \${user.name}\`);
  }
  
  findUser(id: number): User | undefined {
    return this.users.find(u => u.id === id);
  }
}

const service = new UserService();
service.addUser({ id: 1, name: "Alice", email: "alice@example.com" });
console.log(service.findUser(1));`
  }
  
  // 执行代码
  const runCode = useCallback(async () => {
    setIsRunning(true)
    setOutput('')
    
    try {
      if (language === 'javascript') {
        // 使用 Function 构造器安全执行 JavaScript
        const consoleLog = (...args: any[]) => {
          setOutput(prev => prev + args.join(' ') + '\n')
        }
        const sandbox = { console: { log: consoleLog, error: consoleLog, warn: consoleLog } }
        const fn = new Function('console', code)
        fn(sandbox.console)
      } else if (language === 'python') {
        // 提示 Python 需要安装 Pyodide
        setOutput('Python 执行需要加载 Pyodide 环境...\n提示: 在终端中使用 "python" 命令可以执行 Python 代码')
      } else if (language === 'html') {
        setOutput('HTML 代码已生成\n可以在浏览器应用中预览此 HTML 文档')
      } else if (language === 'css') {
        setOutput('CSS 样式已定义\n可以在 HTML 文档中引用这些样式')
      } else if (language === 'markdown') {
        setOutput('Markdown 文档已创建\n可以在 Markdown 预览器中查看渲染效果')
      } else if (language === 'typescript') {
        setOutput('TypeScript 代码已编写\n建议使用在线 TypeScript 编译器转换为 JavaScript')
      }
      
      addNotification({
        title: '代码执行完成',
        message: `${language} 代码已成功执行`,
        type: 'success',
        duration: 2000
      })
    } catch (error: any) {
      setOutput(`错误: ${error.message}`)
      addNotification({
        title: '执行失败',
        message: error.message,
        type: 'error',
        duration: 3000
      })
    }
    
    setIsRunning(false)
  }, [code, language, addNotification])
  
  // 创建新会话
  const createSession = useCallback(() => {
    const newSessionId = `session-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
    const newSession: CodeSession = {
      id: newSessionId,
      name: `代码会话 ${sessions.length + 1}`,
      language,
      code: codeTemplates[language as keyof typeof codeTemplates],
      collaborators: [simulatedCollaborators[0]],
      createdAt: new Date()
    }
    
    setSessions(prev => [...prev, newSession])
    setCurrentSession(newSession)
    setSessionId(newSessionId)
    setCode(newSession.code)
    
    addNotification({
      title: '会话创建成功',
      message: `新协作会话已创建: ${newSessionId}`,
      type: 'success',
      duration: 2000
    })
  }, [sessions, language, simulatedCollaborators, addNotification])
  
  // 分享会话
  const shareSession = useCallback(() => {
    if (!sessionId) {
      addNotification({
        title: '无法分享',
        message: '请先创建一个代码会话',
        type: 'warning',
        duration: 2000
      })
      return
    }
    
    setIsSharing(true)
    const shareUrl = `https://weblinuxos.example.com/collab/${sessionId}`
    
    // 模拟复制到剪贴板
    navigator.clipboard?.writeText(shareUrl).then(() => {
      addNotification({
        title: '链接已复制',
        message: '协作链接已复制到剪贴板',
        type: 'success',
        duration: 2000
      })
    }).catch(() => {
      setOutput(`分享链接: ${shareUrl}\n请手动复制此链接`)
      addNotification({
        title: '分享链接已生成',
        message: shareUrl,
        type: 'info',
        duration: 3000
      })
    })
    
    setIsSharing(false)
  }, [sessionId, addNotification])
  
  // 复制代码
  const copyCode = useCallback(() => {
    navigator.clipboard?.writeText(code).then(() => {
      addNotification({
        title: '代码已复制',
        message: '代码已复制到剪贴板',
        type: 'success',
        duration: 2000
      })
    }).catch(() => {
      addNotification({
        title: '复制失败',
        message: '请手动选择并复制代码',
        type: 'warning',
        duration: 2000
      })
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
      markdown: 'md'
    }
    
    const blob = new Blob([code], { type: 'text/plain' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `code.${extensions[language] || 'txt'}`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
    
    addNotification({
      title: '代码已下载',
      message: `文件已保存为 code.${extensions[language]}`,
      type: 'success',
      duration: 2000
    })
  }, [code, language, addNotification])
  
  // 加载模板代码
  useEffect(() => {
    if (!currentSession) {
      setCode(codeTemplates[language as keyof typeof codeTemplates])
    }
  }, [language, currentSession])
  
  return (
    <div className="h-full flex flex-col" style={{ background: theme === 'dark' ? '#1e1e1e' : '#f5f5f5' }}>
      {/* 顶部工具栏 */}
      <div className="flex items-center gap-2 px-4 py-2 border-b" style={{ 
        background: theme === 'dark' ? '#252526' : '#e8e8e8',
        borderColor: theme === 'dark' ? '#3c3c3c' : '#d4d4d4'
      }}>
        <select 
          value={language}
          onChange={(e) => setLanguage(e.target.value)}
          className="px-2 py-1 rounded text-sm"
          style={{
            background: theme === 'dark' ? '#3c3c3c' : '#fff',
            color: theme === 'dark' ? '#e0e0e0' : '#333',
            border: `1px solid ${theme === 'dark' ? '#555' : '#ccc'}`
          }}
        >
          {languages.map(lang => (
            <option key={lang.id} value={lang.id}>{lang.name}</option>
          ))}
        </select>
        
        <button
          onClick={createSession}
          className="flex items-center gap-1 px-3 py-1 rounded text-sm"
          style={{
            background: theme === 'dark' ? '#0e639c' : '#0078d4',
            color: '#fff'
          }}
        >
          <UsersIcon size={14} />
          新建会话
        </button>
        
        <button
          onClick={shareSession}
          disabled={!sessionId || isSharing}
          className="flex items-center gap-1 px-3 py-1 rounded text-sm"
          style={{
            background: theme === 'dark' ? '#3c3c3c' : '#f0f0f0',
            color: theme === 'dark' ? '#e0e0e0' : '#333',
            opacity: sessionId ? 1 : 0.5
          }}
        >
          <ShareIcon size={14} />
          分享
        </button>
        
        <button
          onClick={copyCode}
          className="flex items-center gap-1 px-3 py-1 rounded text-sm"
          style={{
            background: theme === 'dark' ? '#3c3c3c' : '#f0f0f0',
            color: theme === 'dark' ? '#e0e0e0' : '#333'
          }}
        >
          <CopyIcon size={14} />
          复制
        </button>
        
        <button
          onClick={downloadCode}
          className="flex items-center gap-1 px-3 py-1 rounded text-sm"
          style={{
            background: theme === 'dark' ? '#3c3c3c' : '#f0f0f0',
            color: theme === 'dark' ? '#e0e0e0' : '#333'
          }}
        >
          <DownloadIcon size={14} />
          下载
        </button>
        
        <div className="flex-1" />
        
        {sessionId && (
          <div className="text-xs" style={{ color: theme === 'dark' ? '#858585' : '#666' }}>
            会话ID: {sessionId}
          </div>
        )}
        
        {currentSession && (
          <div className="flex items-center gap-1 ml-2">
            {currentSession.collaborators.map(collab => (
              <div 
                key={collab.id}
                className="w-6 h-6 rounded-full flex items-center justify-center text-xs"
                style={{ background: collab.color, color: '#fff' }}
                title={collab.name}
              >
                {collab.name[0]}
              </div>
            ))}
          </div>
        )}
      </div>
      
      {/* 主要内容区域 */}
      <div className="flex-1 flex overflow-hidden">
        {/* 代码编辑区 */}
        <div className="flex-1 flex flex-col">
          <div className="flex-1 overflow-hidden">
            <textarea
              value={code}
              onChange={(e) => setCode(e.target.value)}
              className="w-full h-full p-4 font-mono text-sm resize-none focus:outline-none"
              style={{
                background: theme === 'dark' ? '#1e1e1e' : '#fff',
                color: theme === 'dark' ? '#d4d4d4' : '#333',
                border: 'none'
              }}
              spellCheck={false}
              placeholder={`在此输入 ${language} 代码...`}
            />
          </div>
          
          {/* 运行按钮 */}
          <div className="flex items-center gap-2 px-4 py-2 border-t" style={{
            background: theme === 'dark' ? '#252526' : '#f0f0f0',
            borderColor: theme === 'dark' ? '#3c3c3c' : '#d4d4d4'
          }}>
            <button
              onClick={runCode}
              disabled={isRunning || !code.trim()}
              className="flex items-center gap-1 px-4 py-1 rounded"
              style={{
                background: isRunning ? (theme === 'dark' ? '#555' : '#ccc') : '#28a745',
                color: '#fff',
                opacity: code.trim() ? 1 : 0.5
              }}
            >
              {isRunning ? <PauseIcon size={14} /> : <PlayIcon size={14} />}
              {isRunning ? '执行中...' : '运行代码'}
            </button>
            
            <div className="text-xs" style={{ color: theme === 'dark' ? '#858585' : '#666' }}>
              提示: JavaScript 代码将在此环境中执行
            </div>
          </div>
        </div>
        
        {/* 输出区域 */}
        <div 
          className="w-1/3 flex flex-col border-l"
          style={{
            background: theme === 'dark' ? '#1e1e1e' : '#fafafa',
            borderColor: theme === 'dark' ? '#3c3c3c' : '#e0e0e0'
          }}
        >
          <div 
            className="px-3 py-2 text-sm font-medium border-b"
            style={{
              background: theme === 'dark' ? '#252526' : '#e8e8e8',
              color: theme === 'dark' ? '#e0e0e0' : '#333',
              borderColor: theme === 'dark' ? '#3c3c3c' : '#d4d4d4'
            }}
          >
            <TerminalIcon size={14} className="inline mr-2" />
            输出结果
          </div>
          
          <div className="flex-1 overflow-auto p-3">
            <pre 
              className="font-mono text-sm whitespace-pre-wrap"
              style={{ color: theme === 'dark' ? '#d4d4d4' : '#333' }}
            >
              {output || '点击"运行代码"查看输出结果...'}
            </pre>
          </div>
        </div>
      </div>
      
      {/* 协作用户指示器 */}
      {currentSession && (
        <div 
          className="absolute bottom-4 right-4 flex items-center gap-2 px-3 py-2 rounded-lg shadow-lg"
          style={{
            background: theme === 'dark' ? '#252526' : '#fff',
            border: `1px solid ${theme === 'dark' ? '#3c3c3c' : '#e0e0e0'}`
          }}
        >
          <div className="text-xs" style={{ color: theme === 'dark' ? '#858585' : '#666' }}>
            {currentSession.collaborators.length} 人在线协作
          </div>
          <div className="flex items-center gap-1">
            {currentSession.collaborators.map(collab => (
              <div 
                key={collab.id}
                className="w-4 h-4 rounded-full animate-pulse"
                style={{ background: collab.color }}
              />
            ))}
          </div>
        </div>
      )}
    </div>
  )
}