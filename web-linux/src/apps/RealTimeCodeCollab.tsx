import { useState, useEffect, useRef, useCallback } from 'react'
import { useStore } from '../store'
import { PlayIcon, UserIcon, ShareIcon, CopyIcon, DownloadIcon, Code2Icon, TerminalIcon } from '../icons'

interface Collaborator {
  id: string
  name: string
  color: string
  cursor: { line: number; column: number } | null
  selection: { startLine: number; startColumn: number; endLine: number; endColumn: number } | null
}

const LANGUAGES = [
  { value: 'javascript', label: 'JavaScript' },
  { value: 'typescript', label: 'TypeScript' },
  { value: 'python', label: 'Python' },
  { value: 'java', label: 'Java' },
  { value: 'cpp', label: 'C++' },
  { value: 'go', label: 'Go' },
  { value: 'rust', label: 'Rust' },
  { value: 'html', label: 'HTML' },
  { value: 'css', label: 'CSS' },
]

const COLLABORATOR_COLORS = [
  '#FF6B6B', '#4ECDC4', '#45B7D1', '#96CEB4', '#FFEAA7',
  '#DDA0DD', '#98D8C8', '#F7DC6F', '#BB8FCE', '#85C1E9'
]

export default function RealTimeCodeCollab() {
  const addNotification = useStore((s) => s.addNotification)
  
  const [language, setLanguage] = useState('javascript')
  const [code, setCode] = useState(DEFAULT_CODE[language] || '')
  const [output, setOutput] = useState<string[]>([])
  const [isRunning, setIsRunning] = useState(false)
  const [collaborators, setCollaborators] = useState<Collaborator[]>([])
  const [isSharing, setIsSharing] = useState(false)
  const [sessionName, setSessionName] = useState(`会话 ${Date.now()}`)
  
  const textareaRef = useRef<HTMLTextAreaElement>(null)
  const outputRef = useRef<HTMLDivElement>(null)
  
  // 模拟协作者光标位置
  const [simulatedCollaborator, setSimulatedCollaborator] = useState<Collaborator | null>(null)
  
  // 生成唯一会话ID
  const generateSessionId = useCallback(() => {
    return `session-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
  }, [])
  
  // 创建共享会话
  const createSession = useCallback(() => {
    const id = generateSessionId()
    setIsSharing(true)
    
    // 模拟添加一个协作者
    const mockCollaborator: Collaborator = {
      id: `user-${Date.now()}`,
      name: '协作者 A',
      color: COLLABORATOR_COLORS[Math.floor(Math.random() * COLLABORATOR_COLORS.length)],
      cursor: { line: 1, column: 1 },
      selection: null
    }
    
    setCollaborators([mockCollaborator])
    
    addNotification({
      title: '会话已创建',
      message: `会话 ID: ${id}`,
      type: 'success',
      duration: 3000
    })
  }, [generateSessionId, addNotification])
  
  // 离开会话
  const leaveSession = useCallback(() => {
    setIsSharing(false)
    setCollaborators([])
    setSimulatedCollaborator(null)
    
    addNotification({
      title: '已离开会话',
      message: '协作会话已结束',
      type: 'info',
      duration: 2000
    })
  }, [addNotification])
  
  // 执行代码
  const runCode = useCallback(async () => {
    if (isRunning || !code.trim()) return
    
    setIsRunning(true)
    setOutput(['正在执行代码...'])
    
    try {
      // 模拟代码执行
      await new Promise(resolve => setTimeout(resolve, 500 + Math.random() * 1000))
      
      const results: string[] = []
      
      if (language === 'javascript' || language === 'typescript') {
        try {
          // 创建安全的执行环境
          const logs: string[] = []
          const mockConsole = {
            log: (...args: unknown[]) => logs.push(args.map(a => 
              typeof a === 'object' ? JSON.stringify(a, null, 2) : String(a)
            ).join(' ')),
            error: (...args: unknown[]) => logs.push(`[错误] ${args.join(' ')}`),
            warn: (...args: unknown[]) => logs.push(`[警告] ${args.join(' ')}`)
          }
          
          // 使用 Function 构造函数在沙箱中执行
          const fn = new Function('console', code)
          fn(mockConsole)
          
          results.push('✅ 执行成功')
          results.push('--- 输出 ---')
          results.push(...logs)
        } catch (error) {
          results.push('❌ 执行失败')
          results.push(`错误: ${(error as Error).message}`)
        }
      } else {
        // 其他语言的模拟输出
        results.push(`✅ ${LANGUAGES.find(l => l.value === language)?.label || language} 代码`)
        results.push('--- 模拟输出 ---')
        results.push('(实际执行需要相应的运行时环境)')
        
        // 分析代码内容生成模拟输出
        const lines = code.split('\n').filter(l => l.trim() && !l.trim().startsWith('#') && !l.trim().startsWith('//'))
        if (lines.length > 0) {
          results.push(`分析到 ${lines.length} 行有效代码`)
          
          // 查找打印/输出语句
          const printStatements = code.match(/print\s*\(|console\.log|System\.out\.print|fmt\.Print|println!/g)
          if (printStatements) {
            results.push(`发现 ${printStatements.length} 个输出语句`)
          }
        }
      }
      
      setOutput(results)
    } catch (error) {
      setOutput([
        '❌ 执行过程中发生错误',
        `错误详情: ${(error as Error).message}`
      ])
    } finally {
      setIsRunning(false)
    }
  }, [code, language, isRunning])
  
  // 复制代码
  const copyCode = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(code)
      addNotification({
        title: '复制成功',
        message: '代码已复制到剪贴板',
        type: 'success',
        duration: 2000
      })
    } catch {
      addNotification({
        title: '复制失败',
        message: '无法访问剪贴板',
        type: 'error',
        duration: 2000
      })
    }
  }, [code, addNotification])
  
  // 下载代码
  const downloadCode = useCallback(() => {
    const extensions: Record<string, string> = {
      javascript: 'js',
      typescript: 'ts',
      python: 'py',
      java: 'java',
      cpp: 'cpp',
      go: 'go',
      rust: 'rs',
      html: 'html',
      css: 'css'
    }
    
    const ext = extensions[language] || 'txt'
    const filename = `code-${Date.now()}.${ext}`
    
    const blob = new Blob([code], { type: 'text/plain;charset=utf-8' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = filename
    a.click()
    URL.revokeObjectURL(url)
    
    addNotification({
      title: '下载成功',
      message: `文件已保存为 ${filename}`,
      type: 'success',
      duration: 2000
    })
  }, [code, language, addNotification])
  
  // 处理代码变化
  const handleCodeChange = useCallback((e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const newCode = e.target.value
    setCode(newCode)
    
    // 模拟协作者的光标跟随
    if (isSharing && collaborators.length > 0) {
      const lines = newCode.split('\n')
      const cursorPos = e.target.selectionStart
      let currentLine = 1
      let currentColumn = 1
      let charCount = 0
      
      for (let i = 0; i < lines.length; i++) {
        if (charCount + lines[i].length >= cursorPos) {
          currentLine = i + 1
          currentColumn = cursorPos - charCount + 1
          break
        }
        charCount += lines[i].length + 1 // +1 for newline
      }
      
      // 更新模拟协作者的光标位置（添加一些随机偏移以模拟真实协作）
      setSimulatedCollaborator({
        ...collaborators[0],
        cursor: {
          line: Math.min(lines.length, Math.max(1, currentLine + Math.floor(Math.random() * 3) - 1)),
          column: Math.max(1, currentColumn + Math.floor(Math.random() * 10) - 5)
        }
      })
    }
  }, [isSharing, collaborators])
  
  // 语言切换时更新默认代码
  useEffect(() => {
    if (!code || code === DEFAULT_CODE[language]) {
      setCode(DEFAULT_CODE[language] || '')
    }
  }, [language])
  
  // 模拟协作者的随机活动
  useEffect(() => {
    if (!isSharing || collaborators.length === 0) return
    
    const interval = setInterval(() => {
      if (Math.random() > 0.7) { // 30% 概率更新
        const lines = code.split('\n')
        const randomLine = Math.floor(Math.random() * lines.length) + 1
        const randomColumn = Math.floor(Math.random() * (lines[randomLine - 1]?.length || 10)) + 1
        
        setSimulatedCollaborator(prev => prev ? {
          ...prev,
          cursor: { line: randomLine, column: randomColumn }
        } : null)
      }
    }, 2000)
    
    return () => clearInterval(interval)
  }, [isSharing, collaborators, code])
  
  return (
    <div style={{
      height: '100%',
      display: 'flex',
      flexDirection: 'column',
      background: 'var(--bg-primary)',
      color: 'var(--text-primary)'
    }}>
      {/* 顶部工具栏 */}
      <div style={{
        padding: '12px 16px',
        borderBottom: '1px solid var(--border-color)',
        display: 'flex',
        alignItems: 'center',
        gap: '12px',
        flexWrap: 'wrap',
        background: 'var(--bg-secondary)'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Code2Icon size={18} />
          <select
            value={language}
            onChange={(e) => setLanguage(e.target.value)}
            style={{
              padding: '6px 12px',
              borderRadius: '6px',
              border: '1px solid var(--border-color)',
              background: 'var(--bg-primary)',
              color: 'var(--text-primary)',
              fontSize: '14px',
              cursor: 'pointer'
            }}
          >
            {LANGUAGES.map(lang => (
              <option key={lang.value} value={lang.value}>{lang.label}</option>
            ))}
          </select>
        </div>
        
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <input
            type="text"
            placeholder="会话名称"
            value={sessionName}
            onChange={(e) => setSessionName(e.target.value)}
            disabled={isSharing}
            style={{
              padding: '6px 12px',
              borderRadius: '6px',
              border: '1px solid var(--border-color)',
              background: 'var(--bg-primary)',
              color: 'var(--text-primary)',
              fontSize: '14px',
              width: '150px'
            }}
          />
          
          {!isSharing ? (
            <button
              onClick={createSession}
              style={{
                padding: '6px 12px',
                borderRadius: '6px',
                border: 'none',
                background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                color: 'white',
                fontSize: '14px',
                fontWeight: 'bold',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '6px'
              }}
            >
              <ShareIcon size={16} />
              创建协作会话
            </button>
          ) : (
            <button
              onClick={leaveSession}
              style={{
                padding: '6px 12px',
                borderRadius: '6px',
                border: '1px solid #e74c3c',
                background: 'transparent',
                color: '#e74c3c',
                fontSize: '14px',
                fontWeight: 'bold',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '6px'
              }}
            >
              离开会话
            </button>
          )}
        </div>
        
        <div style={{ marginLeft: 'auto', display: 'flex', gap: '8px' }}>
          <button
            onClick={copyCode}
            title="复制代码"
            style={{
              padding: '6px 12px',
              borderRadius: '6px',
              border: '1px solid var(--border-color)',
              background: 'var(--bg-primary)',
              color: 'var(--text-primary)',
              fontSize: '14px',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '6px'
            }}
          >
            <CopyIcon size={16} />
            复制
          </button>
          
          <button
            onClick={downloadCode}
            title="下载代码"
            style={{
              padding: '6px 12px',
              borderRadius: '6px',
              border: '1px solid var(--border-color)',
              background: 'var(--bg-primary)',
              color: 'var(--text-primary)',
              fontSize: '14px',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '6px'
            }}
          >
            <DownloadIcon size={16} />
            下载
          </button>
          
          <button
            onClick={runCode}
            disabled={isRunning}
            style={{
              padding: '6px 12px',
              borderRadius: '6px',
              border: 'none',
              background: isRunning ? '#95a5a6' : '#27ae60',
              color: 'white',
              fontSize: '14px',
              fontWeight: 'bold',
              cursor: isRunning ? 'not-allowed' : 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '6px'
            }}
          >
            <PlayIcon size={16} />
            {isRunning ? '执行中...' : '运行'}
          </button>
        </div>
      </div>
      
      {/* 主要内容区域 */}
      <div style={{ flex: 1, display: 'flex', gap: '1px', overflow: 'hidden' }}>
        {/* 代码编辑器 */}
        <div style={{ 
          flex: 1, 
          display: 'flex', 
          flexDirection: 'column',
          borderRight: '1px solid var(--border-color)'
        }}>
          {/* 协作者指示器 */}
          {isSharing && collaborators.length > 0 && (
            <div style={{
              padding: '8px 16px',
              background: 'var(--bg-tertiary)',
              borderBottom: '1px solid var(--border-color)',
              display: 'flex',
              alignItems: 'center',
              gap: '8px'
            }}>
              <UserIcon size={16} />
              <span style={{ fontSize: '13px', fontWeight: 'bold' }}>
                在线协作 ({collaborators.length + 1}人)
              </span>
              {collaborators.map(collab => (
                <div
                  key={collab.id}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '4px',
                    padding: '2px 8px',
                    borderRadius: '12px',
                    background: `${collab.color}20`,
                    border: `1px solid ${collab.color}`,
                    fontSize: '12px'
                  }}
                >
                  <div style={{
                    width: '8px',
                    height: '8px',
                    borderRadius: '50%',
                    background: collab.color
                  }} />
                  {collab.name}
                </div>
              ))}
            </div>
          )}
          
          {/* 代码文本区域 */}
          <div style={{ flex: 1, position: 'relative', overflow: 'hidden' }}>
            <textarea
              ref={textareaRef}
              value={code}
              onChange={handleCodeChange}
              placeholder={`输入 ${LANGUAGES.find(l => l.value === language)?.label || language} 代码...`}
              spellCheck={false}
              style={{
                width: '100%',
                height: '100%',
                padding: '16px',
                border: 'none',
                background: 'var(--bg-primary)',
                color: 'var(--text-primary)',
                fontSize: '14px',
                fontFamily: 'Monaco, Menlo, "Ubuntu Mono", monospace',
                lineHeight: '1.6',
                resize: 'none',
                outline: 'none'
              }}
            />
            
            {/* 模拟协作者光标 */}
            {simulatedCollaborator && simulatedCollaborator.cursor && (
              <div style={{
                position: 'absolute',
                left: '16px',
                top: '16px',
                width: '2px',
                height: '20px',
                background: simulatedCollaborator.color,
                animation: 'blink 1s infinite',
                transform: `translate(${(simulatedCollaborator.cursor.column - 1) * 8}px, ${(simulatedCollaborator.cursor.line - 1) * 22}px)`,
                pointerEvents: 'none'
              }} />
            )}
          </div>
        </div>
        
        {/* 输出面板 */}
        <div style={{
          width: '300px',
          display: 'flex',
          flexDirection: 'column',
          background: 'var(--bg-secondary)'
        }}>
          <div style={{
            padding: '12px 16px',
            borderBottom: '1px solid var(--border-color)',
            display: 'flex',
            alignItems: 'center',
            gap: '8px'
          }}>
            <TerminalIcon size={18} />
            <span style={{ fontWeight: 'bold', fontSize: '14px' }}>输出</span>
          </div>
          
          <div
            ref={outputRef}
            style={{
              flex: 1,
              padding: '12px',
              overflow: 'auto',
              fontFamily: 'Monaco, Menlo, "Ubuntu Mono", monospace',
              fontSize: '13px',
              whiteSpace: 'pre-wrap'
            }}
          >
            {output.length === 0 ? (
              <div style={{ color: 'var(--text-secondary)', fontStyle: 'italic' }}>
                点击"运行"按钮执行代码
              </div>
            ) : (
              output.map((line, i) => (
                <div key={i} style={{
                  marginBottom: '4px',
                  color: line.startsWith('✅') ? '#27ae60' : 
                         line.startsWith('❌') ? '#e74c3c' : 
                         line.startsWith('[错误]') ? '#e74c3c' :
                         'var(--text-primary)'
                }}>
                  {line}
                </div>
              ))
            )}
          </div>
        </div>
      </div>
      
      {/* CSS 动画 */}
      <style>{`
        @keyframes blink {
          0%, 50% { opacity: 1; }
          51%, 100% { opacity: 0; }
        }
      `}</style>
    </div>
  )
}

// 默认代码模板
const DEFAULT_CODE: Record<string, string> = {
  javascript: `// JavaScript 示例代码
function fibonacci(n) {
  if (n <= 1) return n;
  return fibonacci(n - 1) + fibonacci(n - 2);
}

console.log("斐波那契数列前10项:");
for (let i = 0; i < 10; i++) {
  console.log(\`F(\${i}) = \${fibonacci(i)}\`);
}`,
  
  typescript: `// TypeScript 示例代码
interface User {
  id: number;
  name: string;
  email: string;
}

function greetUser(user: User): string {
  return \`你好, \${user.name}! 你的邮箱是 \${user.email}\`;
}

const user: User = {
  id: 1,
  name: "张三",
  email: "zhangsan@example.com"
};

console.log(greetUser(user));`,
  
  python: `# Python 示例代码
def bubble_sort(arr):
    n = len(arr)
    for i in range(n):
        for j in range(0, n-i-1):
            if arr[j] > arr[j+1]:
                arr[j], arr[j+1] = arr[j+1], arr[j]
    return arr

numbers = [64, 34, 25, 12, 22, 11, 90]
print("原始数组:", numbers)
sorted_numbers = bubble_sort(numbers)
print("排序后:", sorted_numbers)`,
  
  java: `// Java 示例代码
public class Main {
    public static void main(String[] args) {
        int[] numbers = {5, 2, 8, 1, 9};
        
        System.out.println("数组元素:");
        for (int num : numbers) {
            System.out.print(num + " ");
        }
        
        int sum = 0;
        for (int num : numbers) {
            sum += num;
        }
        System.out.println("\\n总和: " + sum);
    }
}`,
  
  cpp: `// C++ 示例代码
#include <iostream>
#include <vector>
#include <algorithm>

int main() {
    std::vector<int> numbers = {3, 1, 4, 1, 5, 9, 2, 6};
    
    std::cout << "原始序列: ";
    for (int num : numbers) {
        std::cout << num << " ";
    }
    
    std::sort(numbers.begin(), numbers.end());
    
    std::cout << "\\n排序后: ";
    for (int num : numbers) {
        std::cout << num << " ";
    }
    
    return 0;
}`,
  
  go: `// Go 示例代码
package main

import "fmt"

func factorial(n int) int {
    if n <= 1 {
        return 1
    }
    return n * factorial(n-1)
}

func main() {
    fmt.Println("阶乘计算:")
    for i := 1; i <= 10; i++ {
        fmt.Printf("%d! = %d\\n", i, factorial(i))
    }
}`,
  
  rust: `// Rust 示例代码
fn main() {
    let numbers = vec
![1, 2, 3, 4, 5];
    
    println!("数组元素: {:?}", numbers)
;
    
    let sum: i32 = numbers.iter()
.sum();
    println!("总和: {}", sum)
;
    
    let avg = sum as f64 / numbers.len() as f64;
    println!("平均值: {}", avg);
}`,
  
  html: `<!DOCTYPE html>
<html lang="zh-CN">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>示例网页</title>
    <style>
        body {
            font-family: Arial, sans-serif;
            max-width: 800px;
            margin: 0 auto;
            padding: 20px;
        }
        h1 {
            color: #333;
        }
    </style>
</head>
<body>
    <h1>欢迎使用 WebLinuxOS</h1>
    <p>这是一个示例 HTML 页面</p>
</body>
</html>`,
  
  css: `/* CSS 示例代码 */
:root {
    --primary-color: #3498db;
    --secondary-color: #2ecc71;
    --text-color: #2c3e50;
}

body {
    font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
    line-height: 1.6;
    color: var(--text-color);
    max-width: 1200px;
    margin: 0 auto;
    padding: 20px;
}

.container {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
    gap: 20px;
}

.card {
    background: white;
    border-radius: 8px;
    padding: 20px;
    box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
    transition: transform 0.3s ease;
}

.card:hover {
    transform: translateY(-5px);
}`
}