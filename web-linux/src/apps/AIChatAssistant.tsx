import React, { useState, useRef, useEffect } from 'react'

interface Message {
  id: string
  role: 'user' | 'assistant'
  content: string
  timestamp: Date
}

const AIChatAssistant: React.FC = () => {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: 'welcome',
      role: 'assistant',
      content: '你好！我是 AI 助手。我可以帮你解答问题、写代码、翻译、提供建议，或者只是聊天。你想聊些什么？',
      timestamp: new Date()
    }
  ])
  const [input, setInput] = useState('')
  const [isTyping, setIsTyping] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  useEffect(() => {
    scrollToBottom()
  }, [messages, isTyping])

  const generateResponse = async (userMessage: string): Promise<string> => {
    const lowerMsg = userMessage.toLowerCase()
    
    if (lowerMsg.includes('你好') || lowerMsg.includes('hi') || lowerMsg.includes('hello')) {
      return '你好！很高兴见到你！有什么我可以帮助你的吗？\n\n我可以帮你：\n- 解答问题\n- 写代码\n- 翻译\n- 提供建议\n- 或者只是聊天'
    }

    if (lowerMsg.includes('代码') || lowerMsg.includes('code')) {
      return '以下是一个简单的 React 组件示例：\n\n```typescript\nimport React, { useState } from \'react\'\n\nconst Counter = () => {\n  const [count, setCount] = useState(0)\n  \n  return (\n    <div>\n      <p>Count: {count}</p>\n      <button onClick={() => setCount(c => c + 1)}>Increment</button>\n    </div>\n  )\n}\n\nexport default Counter\n```\n\n需要我帮你写其他代码吗？'
    }

    if (lowerMsg.includes('翻译') || lowerMsg.includes('translate')) {
      return '我可以帮你翻译！请告诉我你想翻译什么内容，或者你可以说 "翻译 [内容]" 来让我翻译。'
    }

    if (lowerMsg.includes('时间') || lowerMsg.includes('time')) {
      const now = new Date()
      const timeStr = now.toLocaleTimeString('zh-CN')
      const dateStr = now.toLocaleDateString('zh-CN', { 
        year: 'numeric', 
        month: 'long', 
        day: 'numeric',
        weekday: 'long'
      })
      return `现在的时间是：${timeStr}\n今天是：${dateStr}`
    }

    if (lowerMsg.includes('笑话') || lowerMsg.includes('joke')) {
      const jokes = [
        '为什么程序员总是分不清万圣节和圣诞节？因为 Oct 31 = Dec 25',
        '有两种人：一种是能从不完整的数据中得出结论的人。',
        '世界上只有 10 种人，一种懂二进制，一种不懂。',
        'CSS 是什么？Can not Style Shit',
        '程序员的读书方式：从第 0 页开始。'
      ]
      return jokes[Math.floor(Math.random() * jokes.length)]
    }

    if (lowerMsg.includes('天气')) {
      return '我无法获取实时天气数据，但你可以打开 WebLinuxOS 中的 "天气" 应用来查看天气信息！'
    }

    return `收到你的消息："${userMessage}"\n\n我正在努力学习中，目前还不能提供真正的 AI 回答，但我可以：\n\n1. 提供代码示例\n2. 告诉你时间\n3. 讲笑话\n4. 回答简单问题\n\n试试问我"讲个笑话"或"现在几点"吧！`
  }

  const sendMessage = async () => {
    if (!input.trim()) return

    const userMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: input.trim(),
      timestamp: new Date()
    }

    setMessages(prev => [...prev, userMessage])
    setInput('')
    setIsTyping(true)

    try {
      const response = await generateResponse(userMessage.content)
      const assistantMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: response,
        timestamp: new Date()
      }
      setMessages(prev => [...prev, assistantMessage])
    } catch (error) {
      const errorMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: '抱歉，我遇到了一个问题。请稍后再试。',
        timestamp: new Date()
      }
      setMessages(prev => [...prev, errorMessage])
    } finally {
      setIsTyping(false)
    }
  }

  const clearChat = () => {
    if (window.confirm('确定要清空聊天记录吗？')) {
      setMessages([
        {
          id: 'welcome',
          role: 'assistant',
          content: '你好！我是 AI 助手。我可以帮你解答问题、写代码、翻译、提供建议，或者只是聊天。你想聊些什么？',
          timestamp: new Date()
        }
      ])
    }
  }

  const quickQuestions = [
    '你好',
    '讲个笑话',
    '现在几点',
    '写个代码示例'
  ]

  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      height: '100%',
      background: 'linear-gradient(180deg, #1a1a2e 0%, #16162d 100%)'
    }}>
      <div style={{
        padding: '16px',
        background: 'rgba(139, 124, 240, 0.1)',
        borderBottom: '1px solid rgba(139, 124, 240, 0.2)',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div style={{
            width: '40px',
            height: '40px',
            borderRadius: '50%',
            background: 'linear-gradient(135deg, #8b7cf0 0%, #00cec9 100%)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '20px'
          }}>
            🤖
          </div>
          <div>
            <div style={{ fontWeight: 600, color: '#fff' }}>AI 助手</div>
            <div style={{ fontSize: '12px', color: 'rgba(255,255,255,0.6)' }}>在线</div>
          </div>
        </div>
        <button onClick={clearChat} style={{
          padding: '8px 16px',
          borderRadius: '8px',
          border: '1px solid rgba(139, 124, 240, 0.3)',
          background: 'rgba(139, 124, 240, 0.1)',
          color: '#8b7cf0',
          cursor: 'pointer',
          fontSize: '12px'
        }}>
          清空聊天
        </button>
      </div>

      <div style={{
        flex: 1,
        overflowY: 'auto',
        padding: '16px',
        display: 'flex',
        flexDirection: 'column',
        gap: '12px'
      }}>
        {messages.map((message) => (
          <div key={message.id} style={{
            display: 'flex',
            justifyContent: message.role === 'user' ? 'flex-end' : 'flex-start',
            maxWidth: '80%',
            marginLeft: message.role === 'user' ? 'auto' : '0',
            marginRight: message.role === 'user' ? '0' : 'auto'
          }}>
            <div style={{
              padding: '12px 16px',
              borderRadius: message.role === 'user' 
                ? '16px 16px 4px 16px' 
                : '16px 16px 16px 4px',
              background: message.role === 'user' 
                ? 'linear-gradient(135deg, #8b7cf0 0%, #7c6ed6 100%)'
                : 'rgba(255,255,255,0.08)',
              color: message.role === 'user' ? '#fff' : '#e0e0e0',
              fontSize: '14px',
              lineHeight: '1.6',
              wordBreak: 'break-word',
              whiteSpace: 'pre-wrap'
            }}>
              {message.content}
            </div>
          </div>
        ))}

        {isTyping && (
          <div style={{
            display: 'flex',
            justifyContent: 'flex-start',
            maxWidth: '80%'
          }}>
            <div style={{
              padding: '12px 16px',
              borderRadius: '16px 16px 16px 4px',
              background: 'rgba(255,255,255,0.08)',
              display: 'flex',
              gap: '4px'
            }}>
              <span style={{
                width: '8px',
                height: '8px',
                borderRadius: '50%',
                background: '#8b7cf0',
                animation: 'typing 1.4s infinite ease-in-out both'
              }} />
              <span style={{
                width: '8px',
                height: '8px',
                borderRadius: '50%',
                background: '#8b7cf0',
                animation: 'typing 1.4s infinite ease-in-out both',
                animationDelay: '0.2s'
              }} />
              <span style={{
                width: '8px',
                height: '8px',
                borderRadius: '50%',
                background: '#8b7cf0',
                animation: 'typing 1.4s infinite ease-in-out both',
                animationDelay: '0.4s'
              }} />
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      <div style={{
        padding: '12px 16px',
        borderTop: '1px solid rgba(139, 124, 240, 0.2)',
        background: 'rgba(0,0,0,0.2)'
      }}>
        <div style={{
          display: 'flex',
          gap: '8px',
          marginBottom: '12px',
          flexWrap: 'wrap'
        }}>
          {quickQuestions.map((q) => (
            <button key={q} onClick={() => setInput(q)} style={{
              padding: '6px 12px',
              borderRadius: '16px',
              border: '1px solid rgba(139, 124, 240, 0.3)',
              background: 'rgba(139, 124, 240, 0.1)',
              color: '#8b7cf0',
              cursor: 'pointer',
              fontSize: '12px'
            }}>
              {q}
            </button>
          ))}
        </div>

        <div style={{ display: 'flex', gap: '12px', alignItems: 'flex-end' }}>
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && !e.shiftKey && sendMessage()}
            placeholder="输入消息..."
            style={{
              flex: 1,
              padding: '12px 16px',
              borderRadius: '24px',
              border: '1px solid rgba(139, 124, 240, 0.3)',
              background: 'rgba(255,255,255,0.05)',
              color: '#fff',
              fontSize: '14px',
              outline: 'none'
            }}
          />
          <button onClick={sendMessage} disabled={isTyping || !input.trim()} style={{
            width: '48px',
            height: '48px',
            borderRadius: '50%',
            border: 'none',
            background: 'linear-gradient(135deg, #8b7cf0 0%, #7c6ed6 100%)',
            color: '#fff',
            cursor: input.trim() && !isTyping ? 'pointer' : 'not-allowed',
            fontSize: '20px',
            opacity: input.trim() && !isTyping ? 1 : 0.5
          }}>
            ➤
          </button>
        </div>
      </div>

      <style>{`
        @keyframes typing {
          0%, 80%, 100% { transform: scale(0); opacity: 0.5; }
          40% { transform: scale(1); opacity: 1; }
        }
      `}</style>
    </div>
  )
}

export default AIChatAssistant
