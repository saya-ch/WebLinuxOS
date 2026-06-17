import { useState, useCallback, useRef, useEffect, memo } from 'react'

interface Message {
  id: string
  role: 'user' | 'assistant'
  content: string
  timestamp: Date
}

interface AIResponse {
  type: 'text' | 'code' | 'command' | 'suggestion'
  content: string
  language?: string
}

const MessageBubble = memo(function MessageBubble({ message }: { message: Message }) {
  const isUser = message.role === 'user'
  
  return (
    <div className={`app-message ${isUser ? 'app-message-user' : 'app-message-assistant'}`}>
      <div className="app-message-header">
        <span className="app-message-role">{isUser ? '用户' : 'AI助手'}</span>
        <span className="app-message-time">{message.timestamp.toLocaleTimeString()}</span>
      </div>
      <div className="app-message-content">
        {message.content}
      </div>
    </div>
  )
})

// 模拟AI响应生成器
function generateAIResponse(input: string): AIResponse {
  const lowerInput = input.toLowerCase()
  
  // 代码生成
  if (lowerInput.includes('生成代码') || lowerInput.includes('写代码') || lowerInput.includes('帮我写')) {
    const language = lowerInput.includes('python') ? 'python' : 
                     lowerInput.includes('javascript') || lowerInput.includes('js') ? 'javascript' :
                     lowerInput.includes('html') ? 'html' : 'javascript'
    
    const templates: Record<string, string> = {
      python: `# Python 示例代码
def fibonacci(n):
    """计算斐波那契数列"""
    if n <= 0:
        return []
    elif n == 1:
        return [0]
    elif n == 2:
        return [0, 1]
    
    fib = [0, 1]
    for i in range(2, n):
        fib.append(fib[i-1] + fib[i-2])
    return fib

# 使用示例
print(fibonacci(10))`,
      javascript: `// JavaScript 示例代码
function fibonacci(n) {
  if (n <= 0) return [];
  if (n === 1) return [0];
  if (n === 2) return [0, 1];
  
  const fib = [0, 1];
  for (let i = 2; i < n; i++) {
    fib.push(fib[i-1] + fib[i-2]);
  }
  return fib;
}

// 使用示例
console.log(fibonacci(10));`,
      html: `<!DOCTYPE html>
<html lang="zh-CN">
<head>
  <meta charset="UTF-8">
  <title>示例页面</title>
  <style>
    body { font-family: sans-serif; padding: 20px; }
    .container { max-width: 800px; margin: 0 auto; }
  </style>
</head>
<body>
  <div class="container">
    <h1>示例页面</h1>
    <p>这是一个示例HTML页面</p>
  </div>
</body>
</html>`
    }
    
    return {
      type: 'code',
      content: templates[language] || templates.javascript,
      language
    }
  }
  
  // 命令建议
  if (lowerInput.includes('命令') || lowerInput.includes('终端') || lowerInput.includes('shell')) {
    const commands = [
      'ls -la - 列出所有文件和详细信息',
      'cd <目录> - 切换目录',
      'cat <文件> - 查看文件内容',
      'grep <模式> <文件> - 搜索文本',
      'find . -name "*.txt" - 查找文件',
      'ps aux - 显示所有进程',
      'top - 实时系统监控',
      'df -h - 磁盘使用情况',
      'free -m - 内存使用情况',
      'curl <URL> - 发送HTTP请求',
      'weather <城市> - 查询天气',
      'crypto <币种> - 查询加密货币价格',
      'github <关键词> - 搜索GitHub仓库',
      'hn - Hacker News热门',
      'cowsay <消息> - 让牛说话'
    ]
    
    return {
      type: 'command',
      content: `常用终端命令:\n\n${commands.join('\n')}`
    }
  }
  
  // 系统信息
  if (lowerInput.includes('系统') || lowerInput.includes('性能') || lowerInput.includes('状态')) {
    return {
      type: 'suggestion',
      content: `系统状态信息:

浏览器: ${navigator.userAgent.split(' ').slice(-2).join(' ')}
平台: ${navigator.platform}
语言: ${navigator.language}
屏幕: ${window.screen.width} x ${window.screen.height}
在线: ${navigator.onLine ? '是' : '否'}
Cookies: ${navigator.cookieEnabled ? '启用' : '禁用'}

建议:
- 使用 Ctrl+Shift+L 打开启动器
- 使用 Ctrl+K 打开全局搜索
- 使用 Ctrl+P 打开命令面板
- 使用 Ctrl+Alt+1-9 切换虚拟桌面`
    }
  }
  
  // 文件操作
  if (lowerInput.includes('文件') || lowerInput.includes('目录') || lowerInput.includes('文件夹')) {
    return {
      type: 'suggestion',
      content: `文件操作指南:

1. 打开文件管理器 (Ctrl+E 或点击桌面图标)
2. 基本操作:
   - 双击打开文件/文件夹
   - 右键菜单: 复制、剪切、删除、重命名
   - Ctrl+C/X/V: 复制/剪切/粘贴
   - Delete: 删除选中文件
   - Ctrl+A: 全选
   
3. 文件上传:
   - 点击上传按钮或拖拽文件到窗口
   
4. 文件搜索:
   - 使用搜索框或 Ctrl+F
   
5. 文件编辑:
   - 文本文件: 使用文本编辑器
   - 代码文件: 使用代码编辑器
   - Markdown: 使用Markdown编辑器`
    }
  }
  
  // 应用推荐
  if (lowerInput.includes('应用') || lowerInput.includes('推荐') || lowerInput.includes('工具')) {
    return {
      type: 'suggestion',
      content: `推荐应用:

开发工具:
- 代码编辑器 (Ctrl+G) - 支持语法高亮
- 代码运行器 - 执行JS/Python代码
- API测试器 - REST API测试
- 正则表达式测试器

生产力工具:
- 笔记应用 - 快速记录想法
- 待办事项 - 任务管理
- 番茄钟 - 时间管理
- 日历 - 日期管理

实用工具:
- 计算器 (Ctrl+A) - 数学计算
- 天气应用 - 实时天气
- 翻译器 - 多语言翻译
- 密码生成器 - 安全密码

娱乐:
- 贪吃蛇 - 经典游戏
- 俄罗斯方块 - 经典游戏
- 虚拟宠物 - 互动宠物`
    }
  }
  
  // 默认响应
  const responses = [
    `我理解您的问题。以下是一些可能有用的信息:

WebLinuxOS 是一个完整的浏览器内Linux桌面环境，包含:
- 150+ 应用程序
- 完整的窗口管理系统
- 虚拟文件系统
- 终端模拟器（90+命令）
- 多虚拟桌面支持

您可以:
1. 使用 Ctrl+Shift+L 打开应用启动器
2. 使用 Ctrl+K 进行全局搜索
3. 在终端中输入 "help" 查看所有命令
4. 双击桌面图标打开应用`,
    `很高兴为您提供帮助！

WebLinuxOS 提供了丰富的功能:
- 文件管理: 创建、编辑、删除文件
- 代码开发: 在浏览器中运行代码
- 网络工具: 天气查询、GitHub搜索等
- 生产力工具: 笔记、待办、日历等

有什么具体需要我帮助的吗？`,
    `我是一个智能助手，可以帮助您:

1. 生成代码示例
2. 推荐合适的工具和应用
3. 解释系统功能
4. 提供操作指南
5. 解答常见问题

请告诉我您需要什么帮助！`
  ]
  
  return {
    type: 'text',
    content: responses[Math.floor(Math.random() * responses.length)]
  }
}

export default function AIAssistantPro() {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      role: 'assistant',
      content: '欢迎使用AI智能助手！我可以帮助您:\n\n• 生成代码示例\n• 推荐应用和工具\n• 提供操作指南\n• 解答系统问题\n\n请输入您的问题或需求，我会尽力帮助您。',
      timestamp: new Date()
    }
  ])
  const [input, setInput] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)
  const messagesRef = useRef<HTMLDivElement>(null)
  
  useEffect(() => {
    if (messagesRef.current) {
      messagesRef.current.scrollTop = messagesRef.current.scrollHeight
    }
  }, [messages])
  
  const handleSubmit = useCallback(async (e: React.FormEvent) => {
    e.preventDefault()
    if (!input.trim() || isLoading) return
    
    const userMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: input.trim(),
      timestamp: new Date()
    }
    
    setMessages(prev => [...prev, userMessage])
    setInput('')
    setIsLoading(true)
    
    // 模拟AI响应延迟
    await new Promise(resolve => setTimeout(resolve, 500 + Math.random() * 1000))
    
    const response = generateAIResponse(userMessage.content)
    
    const assistantMessage: Message = {
      id: (Date.now() + 1).toString(),
      role: 'assistant',
      content: response.content,
      timestamp: new Date()
    }
    
    setMessages(prev => [...prev, assistantMessage])
    setIsLoading(false)
  }, [input, isLoading])
  
  const quickActions = [
    { label: '生成代码', prompt: '帮我生成一个Python代码示例' },
    { label: '查看命令', prompt: '有哪些常用的终端命令？' },
    { label: '系统状态', prompt: '显示系统状态信息' },
    { label: '文件操作', prompt: '如何进行文件操作？' },
    { label: '应用推荐', prompt: '推荐一些实用的应用' },
  ]
  
  const handleQuickAction = useCallback((prompt: string) => {
    setInput(prompt)
    inputRef.current?.focus()
  }, [])
  
  return (
    <div className="app-container app-ai-assistant-pro">
      <div className="app-ai-header">
        <div className="app-ai-title">
          <span className="app-ai-icon">🤖</span>
          AI智能助手
        </div>
        <div className="app-ai-status">
          {isLoading ? '思考中...' : '就绪'}
        </div>
      </div>
      
      <div className="app-ai-messages" ref={messagesRef}>
        {messages.map((message) => (
          <MessageBubble key={message.id} message={message} />
        ))}
        {isLoading && (
          <div className="app-message app-message-assistant app-message-loading">
            <div className="app-loading-dots">
              <span></span><span></span><span></span>
            </div>
          </div>
        )}
      </div>
      
      <div className="app-ai-quick-actions">
        {quickActions.map((action, index) => (
          <button
            key={index}
            className="app-quick-action-btn"
            onClick={() => handleQuickAction(action.prompt)}
          >
            {action.label}
          </button>
        ))}
      </div>
      
      <form className="app-ai-input-form" onSubmit={handleSubmit}>
        <input
          ref={inputRef}
          type="text"
          className="app-ai-input"
          placeholder="输入您的问题或需求..."
          value={input}
          onChange={(e) => setInput(e.target.value)}
          disabled={isLoading}
        />
        <button
          type="submit"
          className="app-ai-send-btn"
          disabled={!input.trim() || isLoading}
        >
          发送
        </button>
      </form>
      
      <div className="app-ai-tips">
        提示: 您可以询问代码生成、命令列表、系统信息、文件操作、应用推荐等
      </div>
    </div>
  )
}