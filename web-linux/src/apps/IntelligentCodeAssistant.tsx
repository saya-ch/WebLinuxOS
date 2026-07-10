import { useState, useCallback, useMemo } from 'react'
import { Sparkles, Code, Lightbulb, Zap, Copy, Check, Download } from 'lucide-react'

interface CodeTemplate {
  id: string
  name: string
  description: string
  language: string
  code: string
  category: string
}

interface GeneratedCode {
  code: string
  language: string
  explanation: string
  suggestions: string[]
}

const codeTemplates: CodeTemplate[] = [
  {
    id: 'react-component',
    name: 'React 函数组件',
    description: '创建一个基础的React函数组件模板',
    language: 'typescript',
    code: `import React, { useState, useCallback } from 'react'

interface Props {
  title: string
  initialValue?: number
  onSave?: (value: number) => void
}

export function MyComponent({ title, initialValue = 0, onSave }: Props) {
  const [value, setValue] = useState(initialValue)
  const [isLoading, setIsLoading] = useState(false)

  const handleIncrement = useCallback(() => {
    setValue(prev => prev + 1)
  }, [])

  const handleDecrement = useCallback(() => {
    setValue(prev => Math.max(0, prev - 1))
  }, [])

  const handleSave = useCallback(async () => {
    if (onSave) {
      setIsLoading(true)
      try {
        await onSave(value)
      } finally {
        setIsLoading(false)
      }
    }
  }, [value, onSave])

  return (
    <div className="my-component">
      <h2>{title}</h2>
      <div className="controls">
        <button onClick={handleDecrement}>-</button>
        <span>{value}</span>
        <button onClick={handleIncrement}>+</button>
      </div>
      <button onClick={handleSave} disabled={isLoading}>
        {isLoading ? '保存中...' : '保存'}
      </button>
    </div>
  )
}`,
    category: 'React'
  },
  {
    id: 'api-endpoint',
    name: 'REST API 端点',
    description: '创建Express.js REST API端点',
    language: 'typescript',
    code: `import express, { Request, Response, NextFunction } from 'express'

const router = express.Router()

interface User {
  id: string
  name: string
  email: string
  createdAt: Date
}

// 获取所有用户
router.get('/users', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { page = 1, limit = 10, search } = req.query
    
    // 模拟数据库查询
    const users: User[] = []
    
    res.json({
      success: true,
      data: users,
      pagination: {
        page: Number(page),
        limit: Number(limit),
        total: users.length
      }
    })
  } catch (error) {
    next(error)
  }
})

// 创建新用户
router.post('/users', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { name, email } = req.body
    
    if (!name || !email) {
      return res.status(400).json({
        success: false,
        error: '缺少必填字段'
      })
    }
    
    const newUser: User = {
      id: crypto.randomUUID(),
      name,
      email,
      createdAt: new Date()
    }
    
    res.status(201).json({
      success: true,
      data: newUser
    })
  } catch (error) {
    next(error)
  }
})

export default router`,
    category: 'Backend'
  },
  {
    id: 'custom-hook',
    name: '自定义React Hook',
    description: '创建可复用的自定义Hook',
    language: 'typescript',
    code: `import { useState, useEffect, useCallback, useRef } from 'react'

interface UseApiOptions<T> {
  url: string
  method?: 'GET' | 'POST' | 'PUT' | 'DELETE'
  body?: any
  headers?: Record<string, string>
  autoFetch?: boolean
  onSuccess?: (data: T) => void
  onError?: (error: Error) => void
}

interface UseApiReturn<T> {
  data: T | null
  error: Error | null
  isLoading: boolean
  refetch: () => Promise<void>
  abort: () => void
}

export function useApi<T>(options: UseApiOptions<T>): UseApiReturn<T> {
  const [data, setData] = useState<T | null>(null)
  const [error, setError] = useState<Error | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  
  const abortControllerRef = useRef<AbortController | null>(null)
  const optionsRef = useRef(options)
  
  useEffect(() => {
    optionsRef.current = options
  }, [options])

  const fetchData = useCallback(async () => {
    const { url, method = 'GET', body, headers = {}, autoFetch = true } = optionsRef.current
    
    if (!autoFetch) return

    abortControllerRef.current?.abort()
    abortControllerRef.current = new AbortController()
    
    setIsLoading(true)
    setError(null)
    
    try {
      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          ...headers
        },
        body: body ? JSON.stringify(body) : undefined,
        signal: abortControllerRef.current.signal
      })
      
      if (!response.ok) {
        throw new Error(\`HTTP error! status: \${response.status}\`)
      }
      
      const result = await response.json()
      setData(result)
      optionsRef.current.onSuccess?.(result)
    } catch (err) {
      if (err instanceof Error && err.name === 'AbortError') return
      const error = err instanceof Error ? err : new Error(String(err))
      setError(error)
      optionsRef.current.onError?.(error)
    } finally {
      setIsLoading(false)
    }
  }, [])

  const abort = useCallback(() => {
    abortControllerRef.current?.abort()
  }, [])

  useEffect(() => {
    fetchData()
    return abort
  }, [fetchData, abort])

  return { data, error, isLoading, refetch: fetchData, abort }
}`,
    category: 'React'
  },
  {
    id: 'css-grid-layout',
    name: 'CSS Grid 响应式布局',
    description: '创建响应式网格布局系统',
    language: 'css',
    code: `.grid-container {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
  gap: 24px;
  padding: 20px;
  max-width: 1400px;
  margin: 0 auto;
}

.grid-item {
  background: white;
  border-radius: 12px;
  padding: 24px;
  box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
  transition: transform 0.2s ease, box-shadow 0.2s ease;
}

.grid-item:hover {
  transform: translateY(-4px);
  box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1);
}

/* 响应式断点 */
@media (max-width: 768px) {
  .grid-container {
    grid-template-columns: 1fr;
    padding: 16px;
    gap: 16px;
  }
  
  .grid-item {
    padding: 16px;
  }
}

@media (min-width: 769px) and (max-width: 1024px) {
  .grid-container {
    grid-template-columns: repeat(2, 1fr);
  }
}

@media (min-width: 1025px) {
  .grid-container {
    grid-template-columns: repeat(3, 1fr);
  }
}

/* 侧边栏布局 */
.layout-with-sidebar {
  display: grid;
  grid-template-columns: 280px 1fr;
  grid-template-rows: auto 1fr auto;
  grid-template-areas:
    "header header"
    "sidebar main"
    "footer footer";
  min-height: 100vh;
}

.header {
  grid-area: header;
  background: #1a1a2e;
  color: white;
  padding: 16px 24px;
  position: sticky;
  top: 0;
  z-index: 100;
}

.sidebar {
  grid-area: sidebar;
  background: #16213e;
  color: white;
  padding: 24px;
  overflow-y: auto;
}

.main {
  grid-area: main;
  padding: 24px;
  background: #f5f5f5;
}

.footer {
  grid-area: footer;
  background: #1a1a2e;
  color: white;
  padding: 16px 24px;
}

@media (max-width: 768px) {
  .layout-with-sidebar {
    grid-template-columns: 1fr;
    grid-template-areas:
      "header"
      "main"
      "sidebar"
      "footer";
  }
}`,
    category: 'CSS'
  },
  {
    id: 'unit-test',
    name: '单元测试模板',
    description: '创建Jest/Vitest单元测试',
    language: 'typescript',
    code: `import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MyComponent } from './MyComponent'

describe('MyComponent', () => {
  const defaultProps = {
    title: '测试组件',
    initialValue: 5,
    onSave: vi.fn()
  }

  beforeEach(() => {
    vi.clearAllMocks()
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  it('should render with correct title', () => {
    render(<MyComponent {...defaultProps} />)
    expect(screen.getByText('测试组件')).toBeInTheDocument()
  })

  it('should display initial value', () => {
    render(<MyComponent {...defaultProps} />)
    expect(screen.getByText('5')).toBeInTheDocument()
  })

  it('should increment value when + button clicked', async () => {
    const user = userEvent.setup()
    render(<MyComponent {...defaultProps} />)
    
    await user.click(screen.getByRole('button', { name: '+' }))
    expect(screen.getByText('6')).toBeInTheDocument()
  })

  it('should decrement value when - button clicked', async () => {
    const user = userEvent.setup()
    render(<MyComponent {...defaultProps} />)
    
    await user.click(screen.getByRole('button', { name: '-' }))
    expect(screen.getByText('4')).toBeInTheDocument()
  })

  it('should not decrement below 0', async () => {
    const user = userEvent.setup()
    render(<MyComponent {...defaultProps} initialValue={0} />)
    
    await user.click(screen.getByRole('button', { name: '-' }))
    expect(screen.getByText('0')).toBeInTheDocument()
  })

  it('should call onSave with current value when save button clicked', async () => {
    const onSave = vi.fn()
    const user = userEvent.setup()
    render(<MyComponent {...defaultProps} onSave={onSave} />)
    
    await user.click(screen.getByRole('button', { name: '保存' }))
    expect(onSave).toHaveBeenCalledWith(5)
  })

  it('should show loading state during save', async () => {
    const onSave = vi.fn().mockImplementation(() => new Promise(resolve => setTimeout(resolve, 100)))
    const user = userEvent.setup()
    render(<MyComponent {...defaultProps} onSave={onSave} />)
    
    await user.click(screen.getByRole('button', { name: '保存' }))
    expect(screen.getByText('保存中...')).toBeInTheDocument()
    
    await waitFor(() => {
      expect(screen.getByRole('button', { name: '保存' })).toBeInTheDocument()
    })
  })
})`,
    category: 'Testing'
  },
  {
    id: 'websocket-chat',
    name: 'WebSocket 实时聊天',
    description: '创建WebSocket实时聊天功能',
    language: 'typescript',
    code: `import React, { useState, useEffect, useCallback, useRef } from 'react'

interface Message {
  id: string
  userId: string
  username: string
  content: string
  timestamp: Date
  type: 'text' | 'image' | 'file'
}

interface UseChatReturn {
  messages: Message[]
  sendMessage: (content: string, type?: Message['type']) => void
  isConnected: boolean
  onlineUsers: string[]
  error: string | null
}

export function useChat(roomId: string): UseChatReturn {
  const [messages, setMessages] = useState<Message[]>([])
  const [isConnected, setIsConnected] = useState(false)
  const [onlineUsers, setOnlineUsers] = useState<string[]>([])
  const [error, setError] = useState<string | null>(null)
  
  const wsRef = useRef<WebSocket | null>(null)
  const reconnectTimerRef = useRef<NodeJS.Timeout | null>(null)

  const connect = useCallback(() => {
    const wsUrl = \`\${process.env.REACT_APP_WS_URL}/chat/\${roomId}\`
    const ws = new WebSocket(wsUrl)
    
    ws.onopen = () => {
      setIsConnected(true)
      setError(null)
      console.log('WebSocket connected')
    }
    
    ws.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data)
        
        switch (data.type) {
          case 'message':
            setMessages(prev => [...prev, {
              ...data.payload,
              timestamp: new Date(data.payload.timestamp)
            }])
            break
          case 'user_joined':
            setOnlineUsers(prev => [...prev, data.payload.userId])
            break
          case 'user_left':
            setOnlineUsers(prev => prev.filter(id => id !== data.payload.userId))
            break
          case 'history':
            setMessages(data.payload.messages.map((msg: any) => ({
              ...msg,
              timestamp: new Date(msg.timestamp)
            })))
            break
        }
      } catch (err) {
        console.error('Failed to parse message:', err)
      }
    }
    
    ws.onerror = (err) => {
      console.error('WebSocket error:', err)
      setError('连接错误')
      setIsConnected(false)
    }
    
    ws.onclose = () => {
      setIsConnected(false)
      // 自动重连
      reconnectTimerRef.current = setTimeout(() => {
        connect()
      }, 3000)
    }
    
    wsRef.current = ws
  }, [roomId])

  useEffect(() => {
    connect()
    
    return () => {
      if (reconnectTimerRef.current) {
        clearTimeout(reconnectTimerRef.current)
      }
      wsRef.current?.close()
    }
  }, [connect])

  const sendMessage = useCallback((content: string, type: Message['type'] = 'text') => {
    if (!wsRef.current || wsRef.current.readyState !== WebSocket.OPEN) {
      setError('未连接到服务器')
      return
    }
    
    const message = {
      type: 'message',
      payload: { content, type }
    }
    
    wsRef.current.send(JSON.stringify(message))
  }, [])

  return { messages, sendMessage, isConnected, onlineUsers, error }
}

// 使用示例组件
export function ChatRoom({ roomId }: { roomId: string }) {
  const { messages, sendMessage, isConnected, onlineUsers, error } = useChat(roomId)
  const [input, setInput] = useState('')
  
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (input.trim()) {
      sendMessage(input.trim())
      setInput('')
    }
  }
  
  return (
    <div className="chat-room">
      <div className="header">
        <h2>聊天室 {roomId}</h2>
        <div className="status">
          {isConnected ? '已连接' : '未连接'}
          <span className="online-count">{onlineUsers.length} 在线</span>
        </div>
      </div>
      
      {error && <div className="error">{error}</div>}
      
      <div className="messages">
        {messages.map(msg => (
          <div key={msg.id} className="message">
            <span className="username">{msg.username}:</span>
            <span className="content">{msg.content}</span>
            <span className="time">{new Date(msg.timestamp).toLocaleTimeString()}</span>
          </div>
        ))}
      </div>
      
      <form onSubmit={handleSubmit} className="input-area">
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="输入消息..."
          disabled={!isConnected}
        />
        <button type="submit" disabled={!isConnected}>发送</button>
      </form>
    </div>
  )
}`,
    category: 'Real-time'
  }
]

const languages = ['TypeScript', 'JavaScript', 'Python', 'Go', 'Rust', 'Java', 'CSS', 'HTML']

export default function IntelligentCodeAssistant() {
  const [activeTab, setActiveTab] = useState<'templates' | 'generator' | 'optimizer'>('templates')
  const [selectedTemplate, setSelectedTemplate] = useState<CodeTemplate | null>(null)
  const [generatedCode, setGeneratedCode] = useState<GeneratedCode | null>(null)
  const [copiedId, setCopiedId] = useState<string | null>(null)
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedCategory, setSelectedCategory] = useState<string>('all')

  // Generator state
  const [generatorPrompt, setGeneratorPrompt] = useState('')
  const [generatorLanguage, setGeneratorLanguage] = useState('TypeScript')
  const [isGenerating, setIsGenerating] = useState(false)

  // Optimizer state
  const [codeToOptimize, setCodeToOptimize] = useState('')
  const [optimizedCode, setOptimizedCode] = useState('')

  const categories = useMemo(() => {
    const cats = new Set(codeTemplates.map(t => t.category))
    return ['all', ...Array.from(cats)]
  }, [])

  const filteredTemplates = useMemo(() => {
    return codeTemplates.filter(template => {
      const matchesSearch = template.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                            template.description.toLowerCase().includes(searchQuery.toLowerCase())
      const matchesCategory = selectedCategory === 'all' || template.category === selectedCategory
      return matchesSearch && matchesCategory
    })
  }, [searchQuery, selectedCategory])

  const handleCopyCode = useCallback((code: string, id: string) => {
    navigator.clipboard.writeText(code)
    setCopiedId(id)
    setTimeout(() => setCopiedId(null), 2000)
  }, [])

  const handleDownloadCode = useCallback((code: string, filename: string) => {
    const blob = new Blob([code], { type: 'text/plain' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = filename
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
  }, [])

  const handleGenerateCode = useCallback(() => {
    if (!generatorPrompt.trim()) return
    
    setIsGenerating(true)
    
    // Simulate AI code generation (in production, this would call an AI API)
    setTimeout(() => {
      const generated: GeneratedCode = {
        code: `// 基于提示生成的代码：${generatorPrompt}\n\nfunction generatedFunction() {\n  // 实现逻辑\n  console.log('AI生成的代码')\n}`,
        language: generatorLanguage,
        explanation: '这段代码实现了基本的功能框架，包含输入验证和错误处理。',
        suggestions: [
          '考虑添加类型定义以提高代码可维护性',
          '可以添加单元测试来验证功能正确性',
          '建议添加文档注释说明函数用途'
        ]
      }
      setGeneratedCode(generated)
      setIsGenerating(false)
    }, 1500)
  }, [generatorPrompt, generatorLanguage])

  const handleOptimizeCode = useCallback(() => {
    if (!codeToOptimize.trim()) return
    
    // Simulate code optimization
    setTimeout(() => {
      const optimized = `// 优化后的代码\n${codeToOptimize}\n\n// 优化说明：\n// 1. 添加了类型注解\n// 2. 改进了错误处理\n// 3. 优化了性能`
      setOptimizedCode(optimized)
    }, 1000)
  }, [codeToOptimize])

  return (
    <div className="intelligent-code-assistant" style={{
      height: '100%',
      display: 'flex',
      flexDirection: 'column',
      background: 'linear-gradient(135deg, #1a1a2e 0%, #16213e 100%)',
      color: '#e94560',
      padding: '20px'
    }}>
      <div className="header" style={{
        textAlign: 'center',
        marginBottom: '24px',
        paddingBottom: '16px',
        borderBottom: '1px solid rgba(233, 69, 96, 0.3)'
      }}>
        <h1 style={{ 
          fontSize: '28px', 
          fontWeight: 'bold',
          margin: 0,
          color: '#e94560',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: '12px'
        }}>
          <Sparkles size={32} />
          智能代码助手
        </h1>
        <p style={{ margin: '8px 0 0', opacity: 0.7 }}>
          AI驱动的代码生成、优化和模板库
        </p>
      </div>

      <div className="tabs" style={{
        display: 'flex',
        gap: '8px',
        marginBottom: '20px',
        padding: '8px',
        background: 'rgba(255,255,255,0.05)',
        borderRadius: '12px'
      }}>
        <button
          onClick={() => setActiveTab('templates')}
          style={{
            flex: 1,
            padding: '12px',
            border: 'none',
            borderRadius: '8px',
            cursor: 'pointer',
            background: activeTab === 'templates' ? '#e94560' : 'transparent',
            color: activeTab === 'templates' ? '#fff' : '#aaa',
            transition: 'all 0.2s',
            fontWeight: activeTab === 'templates' ? 'bold' : 'normal'
          }}
        >
          <Code size={16} style={{ marginRight: '6px' }} />
          代码模板
        </button>
        <button
          onClick={() => setActiveTab('generator')}
          style={{
            flex: 1,
            padding: '12px',
            border: 'none',
            borderRadius: '8px',
            cursor: 'pointer',
            background: activeTab === 'generator' ? '#e94560' : 'transparent',
            color: activeTab === 'generator' ? '#fff' : '#aaa',
            transition: 'all 0.2s',
            fontWeight: activeTab === 'generator' ? 'bold' : 'normal'
          }}
        >
          <Lightbulb size={16} style={{ marginRight: '6px' }} />
          智能生成
        </button>
        <button
          onClick={() => setActiveTab('optimizer')}
          style={{
            flex: 1,
            padding: '12px',
            border: 'none',
            borderRadius: '8px',
            cursor: 'pointer',
            background: activeTab === 'optimizer' ? '#e94560' : 'transparent',
            color: activeTab === 'optimizer' ? '#fff' : '#aaa',
            transition: 'all 0.2s',
            fontWeight: activeTab === 'optimizer' ? 'bold' : 'normal'
          }}
        >
          <Zap size={16} style={{ marginRight: '6px' }} />
          代码优化
        </button>
      </div>

      <div className="content" style={{ flex: 1, overflow: 'auto' }}>
        {activeTab === 'templates' && (
          <div>
            <div style={{ marginBottom: '16px', display: 'flex', gap: '12px' }}>
              <input
                type="text"
                placeholder="搜索模板..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                style={{
                  flex: 1,
                  padding: '10px 16px',
                  borderRadius: '8px',
                  border: '1px solid rgba(233, 69, 96, 0.3)',
                  background: 'rgba(255,255,255,0.05)',
                  color: '#fff',
                  outline: 'none'
                }}
              />
              <select
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                style={{
                  padding: '10px 16px',
                  borderRadius: '8px',
                  border: '1px solid rgba(233, 69, 96, 0.3)',
                  background: 'rgba(255,255,255,0.05)',
                  color: '#fff',
                  outline: 'none',
                  cursor: 'pointer'
                }}
              >
                {categories.map(cat => (
                  <option key={cat} value={cat}>
                    {cat === 'all' ? '所有分类' : cat}
                  </option>
                ))}
              </select>
            </div>

            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
              gap: '16px'
            }}>
              {filteredTemplates.map(template => (
                <div
                  key={template.id}
                  onClick={() => setSelectedTemplate(selectedTemplate?.id === template.id ? null : template)}
                  style={{
                    padding: '16px',
                    borderRadius: '12px',
                    background: selectedTemplate?.id === template.id 
                      ? 'rgba(233, 69, 96, 0.2)' 
                      : 'rgba(255,255,255,0.05)',
                    border: selectedTemplate?.id === template.id 
                      ? '2px solid #e94560' 
                      : '1px solid rgba(233, 69, 96, 0.2)',
                    cursor: 'pointer',
                    transition: 'all 0.2s'
                  }}
                >
                  <h3 style={{ margin: '0 0 8px', color: '#fff' }}>{template.name}</h3>
                  <p style={{ margin: '0 0 8px', fontSize: '12px', opacity: 0.7 }}>
                    {template.description}
                  </p>
                  <div style={{ display: 'flex', gap: '8px', fontSize: '11px' }}>
                    <span style={{
                      padding: '2px 8px',
                      borderRadius: '4px',
                      background: 'rgba(233, 69, 96, 0.2)',
                      color: '#e94560'
                    }}>
                      {template.category}
                    </span>
                    <span style={{ opacity: 0.6 }}>
                      {template.language}
                    </span>
                  </div>
                </div>
              ))}
            </div>

            {selectedTemplate && (
              <div style={{
                marginTop: '20px',
                padding: '16px',
                borderRadius: '12px',
                background: 'rgba(0,0,0,0.3)',
                border: '1px solid rgba(233, 69, 96, 0.3)'
              }}>
                <div style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  marginBottom: '12px'
                }}>
                  <h3 style={{ margin: 0, color: '#fff' }}>{selectedTemplate.name}</h3>
                  <div style={{ display: 'flex', gap: '8px' }}>
                    <button
                      onClick={() => handleCopyCode(selectedTemplate.code, selectedTemplate.id)}
                      style={{
                        padding: '6px 12px',
                        borderRadius: '6px',
                        border: '1px solid rgba(233, 69, 96, 0.3)',
                        background: 'transparent',
                        color: copiedId === selectedTemplate.id ? '#4ade80' : '#fff',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '4px'
                      }}
                    >
                      {copiedId === selectedTemplate.id ? <Check size={14} /> : <Copy size={14} />}
                      {copiedId === selectedTemplate.id ? '已复制' : '复制'}
                    </button>
                    <button
                      onClick={() => handleDownloadCode(selectedTemplate.code, `${selectedTemplate.id}.${selectedTemplate.language === 'typescript' ? 'ts' : selectedTemplate.language === 'javascript' ? 'js' : selectedTemplate.language}`)}
                      style={{
                        padding: '6px 12px',
                        borderRadius: '6px',
                        border: '1px solid rgba(233, 69, 96, 0.3)',
                        background: 'transparent',
                        color: '#fff',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '4px'
                      }}
                    >
                      <Download size={14} />
                      下载
                    </button>
                  </div>
                </div>
                <pre style={{
                  margin: 0,
                  padding: '16px',
                  borderRadius: '8px',
                  background: 'rgba(0,0,0,0.5)',
                  overflow: 'auto',
                  fontSize: '13px',
                  lineHeight: '1.5',
                  color: '#a5f3fc'
                }}>
                  <code>{selectedTemplate.code}</code>
                </pre>
              </div>
            )}
          </div>
        )}

        {activeTab === 'generator' && (
          <div>
            <div style={{ marginBottom: '16px' }}>
              <label style={{ display: 'block', marginBottom: '8px', color: '#fff' }}>
                选择编程语言:
              </label>
              <select
                value={generatorLanguage}
                onChange={(e) => setGeneratorLanguage(e.target.value)}
                style={{
                  width: '100%',
                  padding: '10px 16px',
                  borderRadius: '8px',
                  border: '1px solid rgba(233, 69, 96, 0.3)',
                  background: 'rgba(255,255,255,0.05)',
                  color: '#fff',
                  outline: 'none'
                }}
              >
                {languages.map(lang => (
                  <option key={lang} value={lang}>{lang}</option>
                ))}
              </select>
            </div>

            <div style={{ marginBottom: '16px' }}>
              <label style={{ display: 'block', marginBottom: '8px', color: '#fff' }}>
                描述你想要生成的代码:
              </label>
              <textarea
                value={generatorPrompt}
                onChange={(e) => setGeneratorPrompt(e.target.value)}
                placeholder="例如：创建一个React组件，实现用户登录表单，包含邮箱验证和密码强度检查..."
                rows={4}
                style={{
                  width: '100%',
                  padding: '12px',
                  borderRadius: '8px',
                  border: '1px solid rgba(233, 69, 96, 0.3)',
                  background: 'rgba(255,255,255,0.05)',
                  color: '#fff',
                  outline: 'none',
                  resize: 'vertical',
                  fontFamily: 'inherit'
                }}
              />
            </div>

            <button
              onClick={handleGenerateCode}
              disabled={isGenerating || !generatorPrompt.trim()}
              style={{
                width: '100%',
                padding: '12px',
                borderRadius: '8px',
                border: 'none',
                background: isGenerating ? '#666' : '#e94560',
                color: '#fff',
                cursor: isGenerating ? 'wait' : 'pointer',
                fontSize: '16px',
                fontWeight: 'bold',
                opacity: isGenerating || !generatorPrompt.trim() ? 0.7 : 1
              }}
            >
              {isGenerating ? '生成中...' : '生成代码'}
            </button>

            {generatedCode && (
              <div style={{ marginTop: '20px' }}>
                <div style={{
                  padding: '16px',
                  borderRadius: '12px',
                  background: 'rgba(0,0,0,0.3)',
                  border: '1px solid rgba(233, 69, 96, 0.3)',
                  marginBottom: '16px'
                }}>
                  <h4 style={{ margin: '0 0 12px', color: '#fff' }}>生成的代码:</h4>
                  <pre style={{
                    margin: 0,
                    padding: '12px',
                    borderRadius: '8px',
                    background: 'rgba(0,0,0,0.5)',
                    overflow: 'auto',
                    fontSize: '13px',
                    color: '#a5f3fc'
                  }}>
                    <code>{generatedCode.code}</code>
                  </pre>
                </div>

                <div style={{
                  padding: '16px',
                  borderRadius: '12px',
                  background: 'rgba(0,0,0,0.3)',
                  border: '1px solid rgba(233, 69, 96, 0.3)'
                }}>
                  <h4 style={{ margin: '0 0 8px', color: '#fff' }}>代码说明:</h4>
                  <p style={{ margin: 0, opacity: 0.8 }}>{generatedCode.explanation}</p>
                </div>

                {generatedCode.suggestions.length > 0 && (
                  <div style={{
                    marginTop: '16px',
                    padding: '16px',
                    borderRadius: '12px',
                    background: 'rgba(0,0,0,0.3)',
                    border: '1px solid rgba(233, 69, 96, 0.3)'
                  }}>
                    <h4 style={{ margin: '0 0 12px', color: '#fff' }}>改进建议:</h4>
                    <ul style={{ margin: 0, paddingLeft: '20px' }}>
                      {generatedCode.suggestions.map((suggestion, index) => (
                        <li key={index} style={{ marginBottom: '8px', opacity: 0.8 }}>
                          {suggestion}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {activeTab === 'optimizer' && (
          <div>
            <div style={{ marginBottom: '16px' }}>
              <label style={{ display: 'block', marginBottom: '8px', color: '#fff' }}>
                输入需要优化的代码:
              </label>
              <textarea
                value={codeToOptimize}
                onChange={(e) => setCodeToOptimize(e.target.value)}
                placeholder="粘贴你的代码..."
                rows={10}
                style={{
                  width: '100%',
                  padding: '12px',
                  borderRadius: '8px',
                  border: '1px solid rgba(233, 69, 96, 0.3)',
                  background: 'rgba(255,255,255,0.05)',
                  color: '#fff',
                  outline: 'none',
                  resize: 'vertical',
                  fontFamily: 'monospace',
                  fontSize: '13px'
                }}
              />
            </div>

            <button
              onClick={handleOptimizeCode}
              disabled={!codeToOptimize.trim()}
              style={{
                width: '100%',
                padding: '12px',
                borderRadius: '8px',
                border: 'none',
                background: '#e94560',
                color: '#fff',
                cursor: 'pointer',
                fontSize: '16px',
                fontWeight: 'bold',
                opacity: !codeToOptimize.trim() ? 0.7 : 1
              }}
            >
              优化代码
            </button>

            {optimizedCode && (
              <div style={{ marginTop: '20px' }}>
                <div style={{
                  padding: '16px',
                  borderRadius: '12px',
                  background: 'rgba(0,0,0,0.3)',
                  border: '1px solid rgba(233, 69, 96, 0.3)'
                }}>
                  <h4 style={{ margin: '0 0 12px', color: '#fff' }}>优化后的代码:</h4>
                  <pre style={{
                    margin: 0,
                    padding: '12px',
                    borderRadius: '8px',
                    background: 'rgba(0,0,0,0.5)',
                    overflow: 'auto',
                    fontSize: '13px',
                    color: '#a5f3fc'
                  }}>
                    <code>{optimizedCode}</code>
                  </pre>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}