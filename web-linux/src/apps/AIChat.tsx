import { useState, useCallback, useRef, useEffect, memo } from 'react'
import { API_CONFIG, fetchWithTimeout, handleApiError } from '../config/apiConfig'

interface Message {
  id: string
  role: 'user' | 'assistant' | 'system'
  content: string
  timestamp: Date
}

interface Conversation {
  id: string
  title: string
  messages: Message[]
  createdAt: Date
}

const SYSTEM_PROMPT = `你是 WebLinuxOS 智能助手，运行在浏览器中的 Linux 桌面环境中。你可以：
- 回答技术问题、提供编程建议和代码示例
- 帮助用户使用 WebLinuxOS 系统的各种功能
- 解释 Linux 命令和概念
- 翻译文本、写作、头脑风暴
- 使用简洁清晰的中文回答

WebLinuxOS 是一个基于 Web 的完整 Linux 桌面环境，拥有 560+ 应用、终端模拟器、文件系统、代码编辑器等。`

async function callPollinationsAPI(messages: Array<{role: string; content: string}>): Promise<string> {
  const url = `${API_CONFIG.pollinations.textBaseUrl}/openai/messages`
  const body = {
    model: API_CONFIG.pollinations.defaultModel,
    messages: [
      { role: 'system', content: SYSTEM_PROMPT },
      ...messages.filter(m => m.role !== 'system')
    ],
    temperature: 0.7,
    max_tokens: 2048,
  }

  try {
    const response = await fetchWithTimeout(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    }, 30000)

    if (!response.ok) {
      throw new Error(`API returned ${response.status}`)
    }

    const data = await response.json()
    
    if (data.choices && data.choices[0]?.message?.content) {
      return data.choices[0].message.content
    }
    if (data.content) {
      return typeof data.content === 'string' ? data.content : data.content[0]?.text || '抱歉，无法解析响应'
    }
    throw new Error('Unexpected response format')
  } catch (error) {
    const errMsg = handleApiError(error, 'AI')
    throw new Error(errMsg)
  }
}

const AIChat = memo(function AIChat() {
  const [conversations, setConversations] = useState<Conversation[]>(() => {
    try {
      const saved = localStorage.getItem('weblinux-ai-chat-conversations')
      return saved ? JSON.parse(saved) : []
    } catch {
      return []
    }
  })
  const [currentConversationId, setCurrentConversationId] = useState<string | null>(null)
  const [input, setInput] = useState('')
  const [isTyping, setIsTyping] = useState(false)
  const [showSidebar, setShowSidebar] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [useRealAI, setUseRealAI] = useState(true)
  const abortRef = useRef<AbortController | null>(null)

  const messagesEndRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  const currentConversation = conversations.find(c => c.id === currentConversationId)

  useEffect(() => {
    if (conversations.length > 0) {
      localStorage.setItem('weblinux-ai-chat-conversations', JSON.stringify(conversations.slice(-20)))
    }
  }, [conversations])

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [currentConversation?.messages])

  const createNewConversation = useCallback(() => {
    const newConv: Conversation = {
      id: `conv-${Date.now()}`,
      title: '新对话',
      messages: [
        {
          id: `msg-${Date.now()}`,
          role: 'system',
          content: '欢迎使用 WebLinuxOS 智能助手！我由 Pollinations AI 驱动，可以回答技术问题、提供编程建议、帮助使用系统等。有什么我可以帮助你的吗？',
          timestamp: new Date()
        }
      ],
      createdAt: new Date()
    }
    setConversations(prev => [newConv, ...prev])
    setCurrentConversationId(newConv.id)
    setInput('')
    setError(null)
    setTimeout(() => inputRef.current?.focus(), 100)
  }, [])

  const sendMessage = useCallback(async () => {
    if (!input.trim() || !currentConversationId || isTyping) return
    setError(null)

    const userMessage: Message = {
      id: `msg-${Date.now()}`,
      role: 'user',
      content: input.trim(),
      timestamp: new Date()
    }

    setConversations(prev => prev.map(conv => {
      if (conv.id === currentConversationId) {
        const updatedMessages = [...conv.messages, userMessage]
        const title = conv.messages.length <= 1 ? input.trim().slice(0, 30) : conv.title
        return { ...conv, messages: updatedMessages, title }
      }
      return conv
    }))

    setInput('')
    setIsTyping(true)

    try {
      if (useRealAI) {
        const conv = conversations.find(c => c.id === currentConversationId)
        const chatMessages = [
          ...(conv?.messages || []).filter(m => m.role !== 'system').map(m => ({
            role: m.role,
            content: m.content
          })),
          { role: 'user' as const, content: userMessage.content }
        ]

        abortRef.current = new AbortController()
        const aiContent = await callPollinationsAPI(chatMessages)

        const assistantMessage: Message = {
          id: `msg-${Date.now() + 1}`,
          role: 'assistant',
          content: aiContent,
          timestamp: new Date()
        }

        setConversations(prev => prev.map(conv => {
          if (conv.id === currentConversationId) {
            return { ...conv, messages: [...conv.messages, assistantMessage] }
          }
          return conv
        }))
      } else {
        await new Promise(resolve => setTimeout(resolve, 500 + Math.random() * 1000))
        const fallbackResponse = 'AI 服务暂不可用（已切换到离线模式）。请尝试重新开启 AI 连接。你可以直接使用终端、文件管理器等应用，或在启动器中搜索 "Pollinations" 使用完整的 AI 工作台。'

        const assistantMessage: Message = {
          id: `msg-${Date.now() + 1}`,
          role: 'assistant',
          content: fallbackResponse,
          timestamp: new Date()
        }

        setConversations(prev => prev.map(conv => {
          if (conv.id === currentConversationId) {
            return { ...conv, messages: [...conv.messages, assistantMessage] }
          }
          return conv
        }))
      }
    } catch (err) {
      const errMsg = err instanceof Error ? err.message : '未知错误'
      setError(errMsg)
      const errorMessage: Message = {
        id: `msg-${Date.now() + 1}`,
        role: 'assistant',
        content: `请求出错：${errMsg}\n\n请检查网络连接，或尝试切换 AI 模式。你也可以打开 Pollinations AI 应用获得更完整的 AI 体验。`,
        timestamp: new Date()
      }
      setConversations(prev => prev.map(conv => {
        if (conv.id === currentConversationId) {
          return { ...conv, messages: [...conv.messages, errorMessage] }
        }
        return conv
      }))
    } finally {
      setIsTyping(false)
      abortRef.current = null
    }
  }, [input, currentConversationId, isTyping, conversations, useRealAI])

  const stopGeneration = useCallback(() => {
    abortRef.current?.abort()
    setIsTyping(false)
  }, [])

  const deleteConversation = useCallback((convId: string) => {
    setConversations(prev => prev.filter(c => c.id !== convId))
    if (currentConversationId === convId) {
      setCurrentConversationId(null)
    }
  }, [currentConversationId])

  const formatTime = (date: Date) => {
    return new Date(date).toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' })
  }

  const renderMarkdown = (text: string) => {
    let html = text
      .replace(/```(\w*)\n([\s\S]*?)```/g, '<pre style="background:rgba(0,0,0,0.3);padding:12px;border-radius:8px;overflow-x:auto;margin:8px 0;font-size:13px"><code>$2</code></pre>')
      .replace(/`([^`]+)`/g, '<code style="background:rgba(0,0,0,0.2);padding:2px 6px;border-radius:4px;font-size:13px">$1</code>')
      .replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>')
      .replace(/\n/g, '<br/>')
    return html
  }

  if (!currentConversation) {
    return (
      <div style={{
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        background: 'var(--window-bg)',
        color: 'var(--text-primary)',
        fontFamily: 'system-ui, -apple-system, sans-serif'
      }}>
        <div style={{
          flex: 1,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          flexDirection: 'column',
          gap: 24,
          padding: 40
        }}>
          <div style={{
            fontSize: 64,
            background: 'var(--accent-gradient)',
            borderRadius: 24,
            padding: 20,
            boxShadow: '0 8px 32px var(--accent-bg)'
          }}>
            🤖
          </div>
          <h1 style={{
            fontSize: 28,
            fontWeight: 600,
            margin: 0,
            color: 'var(--text-primary)'
          }}>
            WebLinuxOS AI 助手
          </h1>
          <p style={{
            fontSize: 14,
            color: 'var(--text-secondary)',
            margin: 0,
            textAlign: 'center',
            maxWidth: 400,
            lineHeight: 1.6
          }}>
            由 Pollinations AI 驱动的智能对话助手，可以回答问题、提供编程建议、翻译文本等。
          </p>
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: 8,
            padding: '8px 16px',
            borderRadius: 20,
            background: useRealAI ? 'rgba(34,197,94,0.15)' : 'rgba(239,68,68,0.15)',
            border: `1px solid ${useRealAI ? 'rgba(34,197,94,0.3)' : 'rgba(239,68,68,0.3)'}`,
            fontSize: 13,
          }}>
            <span style={{
              width: 8,
              height: 8,
              borderRadius: '50%',
              background: useRealAI ? '#22c55e' : '#ef4444',
            }} />
            <span style={{ color: useRealAI ? '#22c55e' : '#ef4444' }}>
              {useRealAI ? 'AI 已连接 (Pollinations)' : '离线模式'}
            </span>
          </div>
          <div style={{ display: 'flex', gap: 12, marginTop: 8 }}>
            <button
              onClick={createNewConversation}
              style={{
                padding: '14px 32px',
                borderRadius: 12,
                border: 'none',
                background: 'var(--accent-gradient)',
                color: '#fff',
                cursor: 'pointer',
                fontSize: 15,
                fontWeight: 600,
                boxShadow: '0 4px 16px var(--accent-bg)',
                transition: 'all 0.2s'
              }}
            >
              开始新对话
            </button>
            <button
              onClick={() => setUseRealAI(!useRealAI)}
              style={{
                padding: '14px 24px',
                borderRadius: 12,
                border: '1px solid var(--border-color)',
                background: 'var(--color-surface)',
                color: 'var(--text-secondary)',
                cursor: 'pointer',
                fontSize: 14,
                transition: 'all 0.2s'
              }}
            >
              {useRealAI ? '切换离线' : '切换在线'}
            </button>
          </div>
          {conversations.length > 0 && (
            <button
              onClick={() => setShowSidebar(!showSidebar)}
              style={{
                padding: '10px 20px',
                borderRadius: 10,
                border: '1px solid var(--border-color)',
                background: 'transparent',
                color: 'var(--text-secondary)',
                cursor: 'pointer',
                fontSize: 13,
              }}
            >
              查看历史对话
            </button>
          )}
          <div style={{ marginTop: 24, display: 'flex', gap: 8, flexWrap: 'wrap', maxWidth: 500, justifyContent: 'center' }}>
            {['如何使用终端？', '推荐编程工具', 'Python 快速入门', '解释 Linux 权限'].map(suggestion => (
              <button
                key={suggestion}
                onClick={() => {
                  createNewConversation()
                  setTimeout(() => setInput(suggestion), 100)
                }}
                style={{
                  padding: '8px 16px',
                  borderRadius: 20,
                  border: '1px solid var(--border-color)',
                  background: 'var(--color-surface)',
                  color: 'var(--text-secondary)',
                  cursor: 'pointer',
                  fontSize: 13,
                  transition: 'all 0.2s'
                }}
              >
                {suggestion}
              </button>
            ))}
          </div>
        </div>

        {showSidebar && conversations.length > 0 && (
          <div style={{
            position: 'absolute',
            right: 0,
            top: 0,
            bottom: 0,
            width: 280,
            background: 'var(--window-bg)',
            borderLeft: '1px solid var(--border-color)',
            padding: 16,
            overflowY: 'auto'
          }}>
            <h3 style={{ color: 'var(--text-primary)', fontSize: 14, margin: '0 0 12px 0' }}>历史对话</h3>
            {conversations.slice(0, 10).map(conv => (
              <div
                key={conv.id}
                onClick={() => setCurrentConversationId(conv.id)}
                style={{
                  padding: 12,
                  borderRadius: 8,
                  background: currentConversationId === conv.id ? 'var(--accent-bg)' : 'transparent',
                  border: currentConversationId === conv.id ? '1px solid var(--accent)' : '1px solid transparent',
                  cursor: 'pointer',
                  marginBottom: 8,
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center'
                }}
              >
                <span style={{ fontSize: 13, color: 'var(--text-primary)' }}>{conv.title}</span>
                <button
                  onClick={(e) => { e.stopPropagation(); deleteConversation(conv.id) }}
                  style={{ background: 'none', border: 'none', color: 'var(--text-secondary)', cursor: 'pointer', fontSize: 12, padding: 4 }}
                >
                  ✕
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    )
  }

  return (
    <div style={{
      height: '100%',
      display: 'flex',
      flexDirection: 'column',
      background: 'var(--window-bg)',
      color: 'var(--text-primary)',
      fontFamily: 'system-ui, -apple-system, sans-serif'
    }}>
      {/* Header */}
      <div style={{
        padding: '10px 16px',
        background: 'var(--color-surface)',
        borderBottom: '1px solid var(--border-color)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: 12
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <span style={{ fontSize: 22 }}>🤖</span>
          <div>
            <div style={{ fontSize: 14, fontWeight: 600 }}>{currentConversation.title}</div>
            <div style={{ fontSize: 11, color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', gap: 4 }}>
              <span style={{ width: 6, height: 6, borderRadius: '50%', background: useRealAI ? '#22c55e' : '#ef4444' }} />
              {useRealAI ? 'Pollinations AI' : '离线模式'}
            </div>
          </div>
        </div>
        <div style={{ display: 'flex', gap: 6 }}>
          <button
            onClick={() => setUseRealAI(!useRealAI)}
            title={useRealAI ? '切换到离线模式' : '切换到AI模式'}
            style={{
              padding: '6px 12px',
              borderRadius: 6,
              border: '1px solid var(--border-color)',
              background: useRealAI ? 'rgba(34,197,94,0.1)' : 'var(--color-surface)',
              color: useRealAI ? '#22c55e' : 'var(--text-secondary)',
              cursor: 'pointer',
              fontSize: 12,
            }}
          >
            {useRealAI ? '🟢 AI' : '🔴 离线'}
          </button>
          <button
            onClick={createNewConversation}
            style={{
              padding: '6px 12px',
              borderRadius: 6,
              border: '1px solid var(--border-color)',
              background: 'transparent',
              color: 'var(--text-primary)',
              cursor: 'pointer',
              fontSize: 12,
            }}
          >
            + 新对话
          </button>
          <button
            onClick={() => deleteConversation(currentConversationId!)}
            style={{
              padding: '6px 12px',
              borderRadius: 6,
              border: '1px solid var(--border-color)',
              background: 'transparent',
              color: 'var(--text-secondary)',
              cursor: 'pointer',
              fontSize: 12,
            }}
          >
            删除
          </button>
        </div>
      </div>

      {/* Messages */}
      <div style={{
        flex: 1,
        overflowY: 'auto',
        padding: 16,
        display: 'flex',
        flexDirection: 'column',
        gap: 12
      }}>
        {currentConversation.messages.map(message => (
          <div
            key={message.id}
            style={{
              display: 'flex',
              gap: 10,
              alignSelf: message.role === 'user' ? 'flex-end' : 'flex-start',
              maxWidth: '85%'
            }}
          >
            {message.role !== 'user' && (
              <div style={{
                width: 32,
                height: 32,
                borderRadius: 10,
                background: message.role === 'system' ? 'var(--accent-gradient)' : 'var(--color-surface)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: 16,
                flexShrink: 0,
              }}>
                {message.role === 'system' ? '🌟' : '🤖'}
              </div>
            )}
            <div style={{
              padding: '10px 14px',
              borderRadius: message.role === 'user' ? '14px 14px 4px 14px' : '14px 14px 14px 4px',
              background: message.role === 'user'
                ? 'var(--accent-gradient)'
                : message.role === 'system'
                  ? 'var(--accent-bg)'
                  : 'var(--color-surface)',
              color: message.role === 'user' ? '#fff' : 'var(--text-primary)',
              fontSize: 14,
              lineHeight: 1.6,
              whiteSpace: 'pre-wrap',
              border: message.role === 'assistant' ? '1px solid var(--border-color)' : 'none',
            }}>
              <div dangerouslySetInnerHTML={{
                __html: message.role === 'assistant' ? renderMarkdown(message.content) : message.content
              }} />
              <div style={{
                fontSize: 10,
                color: message.role === 'user' ? 'rgba(255,255,255,0.6)' : 'var(--text-secondary)',
                marginTop: 6,
                opacity: 0.7,
              }}>
                {formatTime(message.timestamp)}
              </div>
            </div>
            {message.role === 'user' && (
              <div style={{
                width: 32,
                height: 32,
                borderRadius: 10,
                background: 'var(--color-surface)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: 16,
                flexShrink: 0,
              }}>
                👤
              </div>
            )}
          </div>
        ))}

        {isTyping && (
          <div style={{ display: 'flex', gap: 10, alignSelf: 'flex-start' }}>
            <div style={{
              width: 32, height: 32, borderRadius: 10,
              background: 'var(--color-surface)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: 16, flexShrink: 0,
            }}>🤖</div>
            <div style={{
              padding: '10px 14px',
              borderRadius: '14px 14px 14px 4px',
              background: 'var(--color-surface)',
              border: '1px solid var(--border-color)',
              color: 'var(--text-secondary)',
              fontSize: 14,
            }}>
              <div style={{ display: 'flex', gap: 4, alignItems: 'center' }}>
                <span className="typing-dot" style={{ animationDelay: '0ms' }}>●</span>
                <span className="typing-dot" style={{ animationDelay: '200ms' }}>●</span>
                <span className="typing-dot" style={{ animationDelay: '400ms' }}>●</span>
                <span style={{ marginLeft: 8 }}>思考中...</span>
              </div>
            </div>
          </div>
        )}

        {error && (
          <div style={{
            padding: '10px 14px',
            borderRadius: 8,
            background: 'rgba(239,68,68,0.1)',
            border: '1px solid rgba(239,68,68,0.3)',
            color: '#ef4444',
            fontSize: 13,
            textAlign: 'center',
          }}>
            {error}
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <div style={{
        padding: '12px 16px',
        background: 'var(--color-surface)',
        borderTop: '1px solid var(--border-color)',
        display: 'flex',
        gap: 10,
        alignItems: 'center'
      }}>
        <input
          ref={inputRef}
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter' && !e.shiftKey) {
              e.preventDefault()
              sendMessage()
            }
          }}
          placeholder={useRealAI ? '输入你的问题... (Pollinations AI)' : '输入你的问题... (离线模式)'}
          disabled={isTyping}
          style={{
            flex: 1,
            padding: '10px 14px',
            borderRadius: 10,
            border: '1px solid var(--border-color)',
            background: 'var(--window-bg)',
            color: 'var(--text-primary)',
            fontSize: 14,
            outline: 'none',
            opacity: isTyping ? 0.7 : 1
          }}
        />
        {isTyping ? (
          <button
            onClick={stopGeneration}
            style={{
              padding: '10px 18px',
              borderRadius: 10,
              border: '1px solid rgba(239,68,68,0.3)',
              background: 'rgba(239,68,68,0.1)',
              color: '#ef4444',
              cursor: 'pointer',
              fontSize: 13,
              fontWeight: 600,
            }}
          >
            停止
          </button>
        ) : (
          <button
            onClick={sendMessage}
            disabled={!input.trim()}
            style={{
              padding: '10px 20px',
              borderRadius: 10,
              border: 'none',
              background: input.trim() ? 'var(--accent-gradient)' : 'var(--color-surface)',
              color: '#fff',
              cursor: input.trim() ? 'pointer' : 'not-allowed',
              fontSize: 14,
              fontWeight: 600,
              opacity: input.trim() ? 1 : 0.5,
            }}
          >
            发送
          </button>
        )}
      </div>

      {/* Quick suggestions */}
      <div style={{
        padding: '8px 16px',
        background: 'var(--window-bg)',
        display: 'flex',
        gap: 6,
        flexWrap: 'wrap'
      }}>
        {['编程问题', 'Linux 命令', '翻译文本', '代码审查', '写作辅助', '技术架构'].map(suggestion => (
          <button
            key={suggestion}
            onClick={() => setInput(suggestion)}
            style={{
              padding: '5px 10px',
              borderRadius: 14,
              border: '1px solid var(--border-color)',
              background: 'transparent',
              color: 'var(--text-secondary)',
              cursor: 'pointer',
              fontSize: 11,
              transition: 'all 0.2s'
            }}
          >
            {suggestion}
          </button>
        ))}
      </div>
    </div>
  )
})

export default AIChat
