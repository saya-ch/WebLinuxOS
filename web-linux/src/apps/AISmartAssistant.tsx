import { useState, useCallback, useRef, useEffect, memo } from 'react'

interface Message {
  id: string
  role: 'user' | 'assistant'
  content: string
  timestamp: Date
}

interface Conversation {
  id: string
  title: string
  messages: Message[]
  createdAt: Date
}

// 预设的AI响应模板 - 模拟智能助手
const aiResponses: Record<string, string[]> = {
  '代码': [
    '我可以帮你分析和编写代码。请告诉我你需要什么类型的代码，比如：\n- JavaScript/TypeScript\n- Python\n- HTML/CSS\n- 数据处理\n- API调用',
    '代码示例：\n```javascript\n// 异步数据获取示例\nasync function fetchData(url) {\n  try {\n    const response = await fetch(url);\n    const data = await response.json();\n    return data;\n  } catch (error) {\n    console.error("获取数据失败:", error);\n    return null;\n  }\n}\n```',
  ],
  '翻译': [
    '我可以帮你翻译文本。支持多种语言：\n- 中文 ↔ 英文\n- 中文 ↔ 日文\n- 中文 ↔ 法文\n- 中文 ↔ 德文\n\n请输入需要翻译的文本。',
  ],
  '解释': [
    '我可以解释各种概念、术语和技术。请告诉我你想了解什么？\n- 技术概念（如React、API、数据库）\n- 编程术语\n- 科学知识\n- 历史文化',
  ],
  '写作': [
    '我可以帮助你：\n- 撰写文档\n- 编写邮件\n- 创建报告\n- 生成创意内容\n\n请告诉我你的写作需求。',
  ],
  '数学': [
    '我可以帮你解决数学问题：\n- 基础运算\n- 代数方程\n- 函数分析\n- 统计计算\n- 几何问题\n\n请描述你的数学问题。',
  ],
  '学习': [
    '我可以作为你的学习助手：\n- 制定学习计划\n- 解释知识点\n- 提供练习建议\n- 推荐学习资源\n\n你想学习什么内容？',
  ],
  '帮助': [
    '我是WebLinuxOS智能助手，可以帮助你：\n\n📌 **代码助手** - 编写、解释、优化代码\n📌 **翻译助手** - 多语言翻译\n📌 **写作助手** - 文档、邮件、创意写作\n📌 **学习助手** - 知识解释、学习规划\n📌 **数学助手** - 数学问题解答\n📌 **技术问答** - 技术概念解释\n\n请告诉我你需要什么帮助！',
  ],
}

const quickActions = [
  { id: 'code', icon: '💻', label: '代码助手', prompt: '我需要代码帮助' },
  { id: 'translate', icon: '🌐', label: '翻译助手', prompt: '我需要翻译帮助' },
  { id: 'explain', icon: '💡', label: '概念解释', prompt: '我需要解释某个概念' },
  { id: 'write', icon: '📝', label: '写作助手', prompt: '我需要写作帮助' },
  { id: 'math', icon: '🔢', label: '数学助手', prompt: '我需要数学帮助' },
  { id: 'learn', icon: '📚', label: '学习助手', prompt: '我需要学习帮助' },
]

const AISmartAssistant = memo(function AISmartAssistant() {
  const [conversations, setConversations] = useState<Conversation[]>([
    {
      id: 'default',
      title: '新对话',
      messages: [
        {
          id: 'welcome',
          role: 'assistant',
          content: '你好！我是WebLinuxOS智能助手 🤖\n\n我可以帮助你进行代码编写、翻译、写作、学习等多种任务。\n\n请选择下方快捷操作，或直接输入你的问题开始对话！',
          timestamp: new Date(),
        },
      ],
      createdAt: new Date(),
    },
  ])
  const [activeConversationId, setActiveConversationId] = useState('default')
  const [input, setInput] = useState('')
  const [isTyping, setIsTyping] = useState(false)
  const [showSidebar, setShowSidebar] = useState(true)
  
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLTextAreaElement>(null)
  
  const activeConversation = conversations.find(c => c.id === activeConversationId)
  
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [activeConversation?.messages])
  
  const generateAIResponse = useCallback((userMessage: string): string => {
    const lowerMessage = userMessage.toLowerCase()
    
    // 匹配关键词
    for (const [key, responses] of Object.entries(aiResponses)) {
      if (lowerMessage.includes(key) || 
          quickActions.some(a => a.id === key && lowerMessage.includes(a.prompt.toLowerCase()))) {
        const randomIndex = Math.floor(Math.random() * responses.length)
        return responses[randomIndex]
      }
    }
    
    // 默认响应
    if (lowerMessage.includes('你好') || lowerMessage.includes('hi') || lowerMessage.includes('hello')) {
      return '你好！很高兴见到你。有什么我可以帮助的吗？'
    }
    
    if (lowerMessage.includes('谢谢') || lowerMessage.includes('感谢')) {
      return '不客气！如果还有其他问题，随时可以问我。😊'
    }
    
    if (lowerMessage.includes('再见') || lowerMessage.includes('bye')) {
      return '再见！祝你使用愉快，有问题随时回来找我。👋'
    }
    
    // 智能默认响应
    return `我理解你的问题是："${userMessage}"\n\n作为智能助手，我可以帮你：\n1. 详细解释这个问题\n2. 提供相关示例\n3. 给出解决方案\n\n请告诉我你更希望哪种形式的回答，或者选择下方的快捷操作来获取更精准的帮助。`
  }, [])
  
  const sendMessage = useCallback(() => {
    if (!input.trim() || isTyping) return
    
    const userMessage: Message = {
      id: `user-${Date.now()}`,
      role: 'user',
      content: input.trim(),
      timestamp: new Date(),
    }
    
    // 添加用户消息
    setConversations(prev => prev.map(conv => {
      if (conv.id === activeConversationId) {
        return {
          ...conv,
          messages: [...conv.messages, userMessage],
          title: conv.messages.length === 1 ? input.trim().slice(0, 20) + '...' : conv.title,
        }
      }
      return conv
    }))
    
    setInput('')
    setIsTyping(true)
    
    // 模拟AI响应延迟
    setTimeout(() => {
      const aiResponse: Message = {
        id: `ai-${Date.now()}`,
        role: 'assistant',
        content: generateAIResponse(userMessage.content),
        timestamp: new Date(),
      }
      
      setConversations(prev => prev.map(conv => {
        if (conv.id === activeConversationId) {
          return {
            ...conv,
            messages: [...conv.messages, aiResponse],
          }
        }
        return conv
      }))
      
      setIsTyping(false)
    }, 800 + Math.random() * 400)
  }, [input, isTyping, activeConversationId, generateAIResponse])
  
  const handleQuickAction = useCallback((action: typeof quickActions[0]) => {
    setInput(action.prompt)
    inputRef.current?.focus()
  }, [])
  
  const createNewConversation = useCallback(() => {
    const newId = `conv-${Date.now()}`
    const newConversation: Conversation = {
      id: newId,
      title: '新对话',
      messages: [
        {
          id: 'welcome',
          role: 'assistant',
          content: '你好！我是WebLinuxOS智能助手 🤖\n\n有什么我可以帮助你的吗？',
          timestamp: new Date(),
        },
      ],
      createdAt: new Date(),
    }
    setConversations(prev => [...prev, newConversation])
    setActiveConversationId(newId)
  }, [])
  
  const deleteConversation = useCallback((id: string) => {
    if (id === 'default') return
    setConversations(prev => prev.filter(c => c.id !== id))
    if (activeConversationId === id) {
      setActiveConversationId('default')
    }
  }, [activeConversationId])
  
  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      sendMessage()
    }
  }, [sendMessage])
  
  return (
    <div style={{
      height: '100%',
      display: 'flex',
      background: 'linear-gradient(135deg, #1a1a2e 0%, #16213e 100%)',
      color: '#fff',
      fontFamily: 'system-ui, -apple-system, sans-serif',
    }}>
      {/* Sidebar */}
      {showSidebar && (
        <div style={{
          width: 260,
          background: 'rgba(0,0,0,0.3)',
          borderRight: '1px solid rgba(255,255,255,0.1)',
          display: 'flex',
          flexDirection: 'column',
        }}>
          <div style={{
            padding: '16px',
            borderBottom: '1px solid rgba(255,255,255,0.1)',
          }}>
            <button
              onClick={createNewConversation}
              style={{
                width: '100%',
                padding: '12px',
                background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                border: 'none',
                borderRadius: 8,
                color: '#fff',
                fontSize: 14,
                fontWeight: 600,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 8,
              }}
            >
              <span>➕</span> 新对话
            </button>
          </div>
          
          <div style={{
            flex: 1,
            overflow: 'auto',
            padding: '8px',
          }}>
            {conversations.map(conv => (
              <div
                key={conv.id}
                onClick={() => setActiveConversationId(conv.id)}
                style={{
                  padding: '12px',
                  borderRadius: 8,
                  cursor: 'pointer',
                  marginBottom: 4,
                  background: activeConversationId === conv.id 
                    ? 'rgba(102,126,234,0.3)' 
                    : 'transparent',
                  border: activeConversationId === conv.id 
                    ? '1px solid rgba(102,126,234,0.5)' 
                    : '1px solid transparent',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  transition: 'all 0.2s',
                }}
              >
                <div style={{ flex: 1, overflow: 'hidden' }}>
                  <div style={{
                    fontSize: 14,
                    fontWeight: 500,
                    whiteSpace: 'nowrap',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                  }}>
                    {conv.title}
                  </div>
                  <div style={{
                    fontSize: 11,
                    color: 'rgba(255,255,255,0.5)',
                    marginTop: 4,
                  }}>
                    {conv.messages.length} 条消息
                  </div>
                </div>
                {conv.id !== 'default' && (
                  <button
                    onClick={(e) => {
                      e.stopPropagation()
                      deleteConversation(conv.id)
                    }}
                    style={{
                      background: 'none',
                      border: 'none',
                      color: 'rgba(255,255,255,0.4)',
                      cursor: 'pointer',
                      padding: 4,
                      fontSize: 14,
                    }}
                  >
                    ✕
                  </button>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
      
      {/* Main Chat Area */}
      <div style={{
        flex: 1,
        display: 'flex',
        flexDirection: 'column',
      }}>
        {/* Header */}
        <div style={{
          padding: '12px 16px',
          borderBottom: '1px solid rgba(255,255,255,0.1)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <button
              onClick={() => setShowSidebar(!showSidebar)}
              style={{
                background: 'rgba(255,255,255,0.1)',
                border: 'none',
                borderRadius: 8,
                padding: 8,
                color: '#fff',
                cursor: 'pointer',
              }}
            >
              {showSidebar ? '◀' : '▶'}
            </button>
            <div style={{
              fontSize: 18,
              fontWeight: 600,
            }}>
              🤖 AI智能助手
            </div>
          </div>
          <div style={{
            fontSize: 12,
            color: 'rgba(255,255,255,0.5)',
          }}>
            WebLinuxOS v6.0
          </div>
        </div>
        
        {/* Messages */}
        <div style={{
          flex: 1,
          overflow: 'auto',
          padding: '16px',
        }}>
          {activeConversation?.messages.map(msg => (
            <div
              key={msg.id}
              style={{
                display: 'flex',
                marginBottom: 16,
                gap: 12,
              }}
            >
              <div style={{
                width: 36,
                height: 36,
                borderRadius: '50%',
                background: msg.role === 'user' 
                  ? 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)'
                  : 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: 18,
              }}>
                {msg.role === 'user' ? '👤' : '🤖'}
              </div>
              <div style={{
                flex: 1,
                maxWidth: '80%',
              }}>
                <div style={{
                  background: msg.role === 'user'
                    ? 'rgba(102,126,234,0.2)'
                    : 'rgba(0,0,0,0.3)',
                  borderRadius: 12,
                  padding: '12px 16px',
                  fontSize: 14,
                  lineHeight: 1.6,
                  whiteSpace: 'pre-wrap',
                  border: msg.role === 'user'
                    ? '1px solid rgba(102,126,234,0.3)'
                    : '1px solid rgba(255,255,255,0.1)',
                }}>
                  {msg.content}
                </div>
                <div style={{
                  fontSize: 11,
                  color: 'rgba(255,255,255,0.4)',
                  marginTop: 4,
                }}>
                  {msg.timestamp.toLocaleTimeString()}
                </div>
              </div>
            </div>
          ))}
          
          {isTyping && (
            <div style={{
              display: 'flex',
              marginBottom: 16,
              gap: 12,
            }}>
              <div style={{
                width: 36,
                height: 36,
                borderRadius: '50%',
                background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: 18,
              }}>
                🤖
              </div>
              <div style={{
                background: 'rgba(0,0,0,0.3)',
                borderRadius: 12,
                padding: '12px 16px',
                display: 'flex',
                gap: 4,
              }}>
                <span style={{ animation: 'bounce 1s infinite', animationDelay: '0s' }}>●</span>
                <span style={{ animation: 'bounce 1s infinite', animationDelay: '0.2s' }}>●</span>
                <span style={{ animation: 'bounce 1s infinite', animationDelay: '0.4s' }}>●</span>
              </div>
            </div>
          )}
          
          <div ref={messagesEndRef} />
        </div>
        
        {/* Quick Actions */}
        <div style={{
          padding: '8px 16px',
          display: 'flex',
          gap: 8,
          overflowX: 'auto',
          borderBottom: '1px solid rgba(255,255,255,0.1)',
        }}>
          {quickActions.map(action => (
            <button
              key={action.id}
              onClick={() => handleQuickAction(action)}
              style={{
                padding: '8px 12px',
                background: 'rgba(255,255,255,0.1)',
                border: '1px solid rgba(255,255,255,0.2)',
                borderRadius: 20,
                color: '#fff',
                fontSize: 12,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: 6,
                whiteSpace: 'nowrap',
                transition: 'all 0.2s',
              }}
            >
              <span>{action.icon}</span>
              <span>{action.label}</span>
            </button>
          ))}
        </div>
        
        {/* Input Area */}
        <div style={{
          padding: '16px',
          background: 'rgba(0,0,0,0.2)',
        }}>
          <div style={{
            display: 'flex',
            gap: 12,
            alignItems: 'flex-end',
          }}>
            <textarea
              ref={inputRef}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="输入你的问题... (Enter发送, Shift+Enter换行)"
              style={{
                flex: 1,
                minHeight: 44,
                maxHeight: 120,
                padding: '12px',
                background: 'rgba(255,255,255,0.1)',
                border: '1px solid rgba(255,255,255,0.2)',
                borderRadius: 12,
                color: '#fff',
                fontSize: 14,
                resize: 'none',
                outline: 'none',
                fontFamily: 'inherit',
              }}
              disabled={isTyping}
            />
            <button
              onClick={sendMessage}
              disabled={!input.trim() || isTyping}
              style={{
                padding: '12px 20px',
                background: input.trim() && !isTyping
                  ? 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)'
                  : 'rgba(255,255,255,0.1)',
                border: 'none',
                borderRadius: 12,
                color: '#fff',
                fontSize: 14,
                fontWeight: 600,
                cursor: input.trim() && !isTyping ? 'pointer' : 'not-allowed',
                opacity: input.trim() && !isTyping ? 1 : 0.5,
                transition: 'all 0.2s',
              }}
            >
              发送 ➤
            </button>
          </div>
        </div>
      </div>
      
      <style>{`
        @keyframes bounce {
          0%, 100% { opacity: 0.3; transform: translateY(0); }
          50% { opacity: 1; transform: translateY(-4px); }
        }
      `}</style>
    </div>
  )
})

export default AISmartAssistant