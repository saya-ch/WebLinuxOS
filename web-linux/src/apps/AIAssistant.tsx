import { useState, useRef, useEffect, useCallback } from 'react'

interface Message {
  role: 'user' | 'assistant'
  content: string
  timestamp: Date
}

interface AIProvider {
  name: string
  description: string
  models: string[]
}

const AI_PROVIDERS: AIProvider[] = [
  { name: 'OpenAI', description: 'GPT系列模型', models: ['gpt-4', 'gpt-3.5-turbo'] },
  { name: 'Anthropic', description: 'Claude系列模型', models: ['claude-3', 'claude-2'] },
  { name: 'Google', description: 'Gemini系列模型', models: ['gemini-pro', 'gemini-flash'] },
  { name: 'Local', description: '本地模拟助手', models: ['web-linux-ai'] },
]

const PROMPT_SUGGESTIONS = [
  '帮我写一段Python代码',
  '解释什么是递归',
  '生成一个简单的HTML页面',
  '如何优化代码性能',
  '解释React的状态管理',
  '帮我写一个正则表达式',
  '生成一个JSON数据结构',
  '如何调试JavaScript代码',
]

const QUICK_ACTIONS = [
  { label: '代码生成', icon: '💻', prompt: '请帮我生成以下代码：' },
  { label: '代码解释', icon: '📖', prompt: '请解释以下代码：' },
  { label: '代码优化', icon: '⚡', prompt: '请优化以下代码：' },
  { label: 'Bug修复', icon: '🐛', prompt: '请帮我修复以下代码中的bug：' },
  { label: '文档生成', icon: '📝', prompt: '请为以下代码生成文档：' },
  { label: '翻译', icon: '🌐', prompt: '请翻译以下内容：' },
]

const LOCAL_RESPONSES: Record<string, string> = {
  'python': `Python是一种高级编程语言，以其简洁的语法和强大的功能著称。以下是一个简单的Python示例：

\`\`\`python
# Hello World
print("Hello, World!")

# 简单函数
def greet(name):
    return f"Hello, {name}!"

# 列表操作
numbers = [1, 2, 3, 4, 5]
squared = [x**2 for x in numbers]
print(squared)  # [1, 4, 9, 16, 25]
\`\`\`

Python常用于：
- Web开发 (Django, Flask)
- 数据科学 (NumPy, Pandas)
- 机器学习 (TensorFlow, PyTorch)
- 自动化脚本`,

  'html': `HTML是网页的基础结构语言。以下是一个简单的HTML页面示例：

\`\`\`html
<!DOCTYPE html>
<html lang="zh-CN">
<head>
  <meta charset="UTF-8">
  <title>我的网页</title>
  <style>
    body { font-family: sans-serif; }
    .container { max-width: 800px; margin: 0 auto; }
  </style>
</head>
<body>
  <div class="container">
    <h1>欢迎</h1>
    <p>这是一个简单的HTML页面。</p>
  </div>
</body>
</html>
\`\`\`

HTML基本元素：
- <h1>-<h6>: 标题
- <p>: 段落
- <div>: 容器
- <a>: 链接
- <img>: 图片`,

  'react': `React是一个用于构建用户界面的JavaScript库。以下是React的核心概念：

**组件**
\`\`\`jsx
function Welcome({ name }) {
  return <h1>Hello, {name}</h1>;
}
\`\`\`

**状态管理**
\`\`\`jsx
function Counter() {
  const [count, setCount] = useState(0);
  return (
    <button onClick={() => setCount(count + 1)}>
      Count: {count}
    </button>
  );
}
\`\`\`

**核心概念**
- 组件化开发
- 虚拟DOM
- 单向数据流
- Hooks (useState, useEffect, useContext)
- Props和State`,

  'regex': `正则表达式是用于匹配字符串模式的强大工具。以下是一些常用示例：

**基本语法**
- \`.\` 匹配任意字符
- \`\\d\` 匹配数字
- \`\\w\` 匹配字母、数字、下划线
- \`\\s\` 匹配空白字符
- \`[]\` 字符集
- \`()\` 分组
- \`*\` 0次或多次
- \`+\` 1次或多次
- \`?\` 0次或1次

**常用示例**
\`\`\`
邮箱: [a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\\.[a-zA-Z]{2,}
手机: ^1[3-9]\\d{9}$
URL: https?:\\/\\/[\\w\\.-]+\\.[a-zA-Z]{2,}[\\w\\.-]*
日期: \\d{4}-\\d{2}-\\d{2}
\`\`\``,
}

function generateLocalResponse(input: string): string {
  const lowerInput = input.toLowerCase()
  
  if (lowerInput.includes('python') || lowerInput.includes('代码') && lowerInput.includes('python')) {
    return LOCAL_RESPONSES['python']
  }
  if (lowerInput.includes('html') || lowerInput.includes('网页')) {
    return LOCAL_RESPONSES['html']
  }
  if (lowerInput.includes('react') || lowerInput.includes('组件')) {
    return LOCAL_RESPONSES['react']
  }
  if (lowerInput.includes('正则') || lowerInput.includes('regex')) {
    return LOCAL_RESPONSES['regex']
  }
  
  // 通用响应
  const responses = [
    `我理解您的问题。作为一个本地AI助手，我可以帮助您：

1. **代码生成** - 生成Python、JavaScript、HTML等代码
2. **代码解释** - 解释代码的工作原理
3. **概念说明** - 解释编程概念和技术
4. **最佳实践** - 提供编码建议和优化技巧

请告诉我您需要什么帮助，我会尽力提供有用的信息。`,
    `感谢您的提问！WebLinuxOS AI助手可以协助您进行多种开发任务。

**我可以帮助您：**
- 编写和调试代码
- 解释技术概念
- 提供编程建议
- 生成文档和注释

请描述您的具体需求。`,
    `您好！我是WebLinuxOS内置的AI助手。

**功能特点：**
- 无需外部API，完全本地运行
- 支持代码生成和解释
- 提供编程知识问答
- 快速响应，无需等待

请输入您的问题或选择一个快捷操作。`,
  ]
  
  return responses[Math.floor(Math.random() * responses.length)]
}

export default function AIAssistant() {
  const [messages, setMessages] = useState<Message[]>([
    {
      role: 'assistant',
      content: `欢迎使用 WebLinuxOS AI助手！

我是一个内置的智能助手，可以帮助您：
- 生成和解释代码
- 解答编程问题
- 提供技术建议
- 翻译和文档生成

请输入您的问题，或点击下方快捷按钮开始。`,
      timestamp: new Date()
    }
  ])
  const [input, setInput] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [selectedProvider, setSelectedProvider] = useState('Local')
  const [showSettings, setShowSettings] = useState(false)
  
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLTextAreaElement>(null)

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  const handleSend = useCallback(async () => {
    if (!input.trim() || isLoading) return
    
    const userMessage: Message = {
      role: 'user',
      content: input.trim(),
      timestamp: new Date()
    }
    
    setMessages(prev => [...prev, userMessage])
    setInput('')
    setIsLoading(true)

    // 模拟AI响应延迟
    await new Promise(resolve => setTimeout(resolve, 500 + Math.random() * 1000))

    const response = generateLocalResponse(input.trim())
    
    const assistantMessage: Message = {
      role: 'assistant',
      content: response,
      timestamp: new Date()
    }
    
    setMessages(prev => [...prev, assistantMessage])
    setIsLoading(false)
  }, [input, isLoading])

  const handleQuickAction = useCallback((prompt: string) => {
    setInput(prompt + '\n')
    inputRef.current?.focus()
  }, [])

  const handleSuggestion = useCallback((suggestion: string) => {
    setInput(suggestion)
    inputRef.current?.focus()
  }, [])

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSend()
    }
  }

  const clearHistory = () => {
    setMessages([
      {
        role: 'assistant',
        content: '对话已清空。请继续您的提问。',
        timestamp: new Date()
      }
    ])
  }

  return (
    <div style={{
      height: '100%',
      display: 'flex',
      flexDirection: 'column',
      background: 'linear-gradient(180deg, #1a1a2e 0%, #16162e 100%)',
      color: '#e8e8f4',
      fontFamily: '"Plus Jakarta Sans", system-ui, sans-serif'
    }}>
      {/* Header */}
      <div style={{
        padding: '16px 20px',
        borderBottom: '1px solid rgba(139, 92, 246, 0.2)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div style={{
            width: '40px',
            height: '40px',
            borderRadius: '12px',
            background: 'linear-gradient(135deg, #8b5cf6, #06b6d4)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '20px'
          }}>
            🤖
          </div>
          <div>
            <div style={{ fontWeight: '600', fontSize: '16px' }}>AI助手</div>
            <div style={{ fontSize: '12px', color: '#a0a0c8' }}>
              {selectedProvider === 'Local' ? '本地模式' : `${selectedProvider} API`}
            </div>
          </div>
        </div>
        <div style={{ display: 'flex', gap: '8px' }}>
          <button
            onClick={() => setShowSettings(!showSettings)}
            style={{
              padding: '8px 12px',
              background: 'rgba(255, 255, 255, 0.05)',
              border: '1px solid rgba(255, 255, 255, 0.1)',
              borderRadius: '8px',
              color: '#a0a0c8',
              cursor: 'pointer',
              fontSize: '13px',
              transition: 'all 0.2s'
            }}
          >
            ⚙️ 设置
          </button>
          <button
            onClick={clearHistory}
            style={{
              padding: '8px 12px',
              background: 'rgba(255, 255, 255, 0.05)',
              border: '1px solid rgba(255, 255, 255, 0.1)',
              borderRadius: '8px',
              color: '#a0a0c8',
              cursor: 'pointer',
              fontSize: '13px',
              transition: 'all 0.2s'
            }}
          >
            🗑️ 清空
          </button>
        </div>
      </div>

      {/* Settings Panel */}
      {showSettings && (
        <div style={{
          padding: '16px 20px',
          background: 'rgba(139, 92, 246, 0.1)',
          borderBottom: '1px solid rgba(139, 92, 246, 0.2)'
        }}>
          <div style={{ marginBottom: '12px', fontWeight: '600', fontSize: '14px' }}>
            选择AI提供商
          </div>
          <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
            {AI_PROVIDERS.map(provider => (
              <button
                key={provider.name}
                onClick={() => setSelectedProvider(provider.name)}
                style={{
                  padding: '8px 16px',
                  background: selectedProvider === provider.name 
                    ? 'rgba(139, 92, 246, 0.3)' 
                    : 'rgba(255, 255, 255, 0.05)',
                  border: `1px solid ${selectedProvider === provider.name 
                    ? 'rgba(139, 92, 246, 0.5)' 
                    : 'rgba(255, 255, 255, 0.1)'}`,
                  borderRadius: '8px',
                  color: selectedProvider === provider.name ? '#e8e8f4' : '#a0a0c8',
                  cursor: 'pointer',
                  fontSize: '13px',
                  transition: 'all 0.2s'
                }}
              >
                {provider.name}
              </button>
            ))}
          </div>
          {selectedProvider !== 'Local' && (
            <div style={{
              marginTop: '12px',
              padding: '12px',
              background: 'rgba(255, 255, 255, 0.03)',
              borderRadius: '8px',
              fontSize: '12px',
              color: '#a0a0c8'
            }}>
              💡 提示：外部API需要配置API密钥。当前使用本地模拟模式。
            </div>
          )}
        </div>
      )}

      {/* Messages */}
      <div style={{
        flex: 1,
        overflow: 'auto',
        padding: '20px'
      }}>
        {messages.map((msg, index) => (
          <div key={index} style={{
            display: 'flex',
            gap: '12px',
            marginBottom: '16px',
            alignItems: 'flex-start'
          }}>
            <div style={{
              width: '36px',
              height: '36px',
              borderRadius: '10px',
              background: msg.role === 'user' 
                ? 'rgba(16, 185, 129, 0.2)' 
                : 'linear-gradient(135deg, #8b5cf6, #06b6d4)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '16px',
              flexShrink: 0
            }}>
              {msg.role === 'user' ? '👤' : '🤖'}
            </div>
            <div style={{
              flex: 1,
              background: msg.role === 'user' 
                ? 'rgba(16, 185, 129, 0.1)' 
                : 'rgba(139, 92, 246, 0.1)',
              borderRadius: '12px',
              padding: '12px 16px',
              border: `1px solid ${msg.role === 'user' 
                ? 'rgba(16, 185, 129, 0.2)' 
                : 'rgba(139, 92, 246, 0.2)'}`,
            }}>
              <div style={{
                fontSize: '13px',
                lineHeight: '1.6',
                whiteSpace: 'pre-wrap',
                wordBreak: 'break-word'
              }}>
                {msg.content}
              </div>
              <div style={{
                fontSize: '11px',
                color: '#a0a0c8',
                marginTop: '8px'
              }}>
                {msg.timestamp.toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' })}
              </div>
            </div>
          </div>
        ))}
        
        {isLoading && (
          <div style={{
            display: 'flex',
            gap: '12px',
            marginBottom: '16px',
            alignItems: 'flex-start'
          }}>
            <div style={{
              width: '36px',
              height: '36px',
              borderRadius: '10px',
              background: 'linear-gradient(135deg, #8b5cf6, #06b6d4)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '16px'
            }}>
              🤖
            </div>
            <div style={{
              background: 'rgba(139, 92, 246, 0.1)',
              borderRadius: '12px',
              padding: '12px 16px',
              border: '1px solid rgba(139, 92, 246, 0.2)'
            }}>
              <div style={{ display: 'flex', gap: '4px' }}>
                <span style={{ animation: 'bounce 1s infinite', color: '#8b5cf6' }}>●</span>
                <span style={{ animation: 'bounce 1s infinite 0.2s', color: '#8b5cf6' }}>●</span>
                <span style={{ animation: 'bounce 1s infinite 0.4s', color: '#8b5cf6' }}>●</span>
              </div>
            </div>
          </div>
        )}
        
        <div ref={messagesEndRef} />
      </div>

      {/* Quick Actions */}
      <div style={{
        padding: '12px 20px',
        borderTop: '1px solid rgba(139, 92, 246, 0.1)',
        display: 'flex',
        gap: '8px',
        flexWrap: 'wrap'
      }}>
        {QUICK_ACTIONS.slice(0, 4).map(action => (
          <button
            key={action.label}
            onClick={() => handleQuickAction(action.prompt)}
            style={{
              padding: '6px 12px',
              background: 'rgba(255, 255, 255, 0.05)',
              border: '1px solid rgba(255, 255, 255, 0.1)',
              borderRadius: '6px',
              color: '#a0a0c8',
              cursor: 'pointer',
              fontSize: '12px',
              transition: 'all 0.2s',
              display: 'flex',
              alignItems: 'center',
              gap: '4px'
            }}
          >
            <span>{action.icon}</span>
            <span>{action.label}</span>
          </button>
        ))}
      </div>

      {/* Suggestions */}
      <div style={{
        padding: '8px 20px',
        display: 'flex',
        gap: '6px',
        flexWrap: 'wrap'
      }}>
        {PROMPT_SUGGESTIONS.slice(0, 4).map(suggestion => (
          <button
            key={suggestion}
            onClick={() => handleSuggestion(suggestion)}
            style={{
              padding: '4px 10px',
              background: 'rgba(139, 92, 246, 0.1)',
              border: '1px solid rgba(139, 92, 246, 0.2)',
              borderRadius: '4px',
              color: '#a0a0c8',
              cursor: 'pointer',
              fontSize: '11px',
              transition: 'all 0.2s'
            }}
          >
            {suggestion}
          </button>
        ))}
      </div>

      {/* Input Area */}
      <div style={{
        padding: '16px 20px',
        borderTop: '1px solid rgba(139, 92, 246, 0.2)',
        background: 'rgba(0, 0, 0, 0.2)'
      }}>
        <div style={{
          display: 'flex',
          gap: '12px',
          alignItems: 'flex-end'
        }}>
          <textarea
            ref={inputRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="输入您的问题... (Enter发送, Shift+Enter换行)"
            style={{
              flex: 1,
              minHeight: '44px',
              maxHeight: '120px',
              padding: '12px 16px',
              background: 'rgba(255, 255, 255, 0.05)',
              border: '1px solid rgba(139, 92, 246, 0.3)',
              borderRadius: '12px',
              color: '#e8e8f4',
              fontSize: '14px',
              resize: 'none',
              outline: 'none',
              fontFamily: 'inherit',
              lineHeight: '1.5'
            }}
            disabled={isLoading}
          />
          <button
            onClick={handleSend}
            disabled={!input.trim() || isLoading}
            style={{
              padding: '12px 20px',
              background: input.trim() && !isLoading
                ? 'linear-gradient(135deg, #8b5cf6, #06b6d4)'
                : 'rgba(139, 92, 246, 0.2)',
              border: 'none',
              borderRadius: '12px',
              color: '#e8e8f4',
              cursor: input.trim() && !isLoading ? 'pointer' : 'not-allowed',
              fontSize: '14px',
              fontWeight: '600',
              transition: 'all 0.2s',
              opacity: input.trim() && !isLoading ? 1 : 0.5
            }}
          >
            发送
          </button>
        </div>
      </div>

      <style>{`
        @keyframes bounce {
          0%, 80%, 100% { transform: translateY(0); }
          40% { transform: translateY(-6px); }
        }
      `}</style>
    </div>
  )
}