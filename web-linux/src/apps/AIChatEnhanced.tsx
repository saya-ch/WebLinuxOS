import { useState, useCallback, useEffect, useRef } from 'react'
import { Send, Bot, User, Sparkles, Trash2, Copy, Check, History, Download, Brain, Zap } from 'lucide-react'

interface Message {
  id: string
  role: 'user' | 'assistant'
  content: string
  timestamp: number
  category?: 'general' | 'code' | 'creative' | 'learning'
}

interface AIModel {
  id: string
  name: string
  description: string
  icon: React.ReactNode
}

const aiModels: AIModel[] = [
  { id: 'general', name: '智能助手', description: '日常对话和一般问答', icon: <Bot size={20} /> },
  { id: 'code', name: '编程助手', description: '代码编写和调试', icon: <Brain size={20} /> },
  { id: 'creative', name: '创作助手', description: '写作和创意内容', icon: <Sparkles size={20} /> },
  { id: 'learning', name: '学习导师', description: '知识讲解和技能指导', icon: <Zap size={20} /> },
]

const defaultResponses: Record<string, Record<string, string[]>> = {
  general: {
    greeting: [
      '你好！我是你的智能助手。我可以帮助你回答问题、提供建议或者进行有趣的对话。有什么想聊的吗？',
      '嗨！很高兴见到你。今天有什么我可以帮助你的吗？无论是工作问题还是生活建议，我都乐意为你服务！',
    ],
    thanks: [
      '不客气！很高兴能帮到你。如果还有其他问题，随时都可以问我。',
      '谢谢你的感谢！我会继续努力提供更好的帮助。',
    ],
    goodbye: [
      '再见！祝你一切顺利，期待下次与你聊天。',
      '下次见！如果还有问题，随时欢迎回来。',
    ],
    default: [
      '这是一个很有趣的问题。让我思考一下...\n\n从不同角度来看，这个问题涉及多个方面。首先，我们需要考虑...\n\n其次，还有...\n\n总的来说，我的建议是...',
      '我理解你的问题。基于我的分析，这里是我的看法...\n\n1. 首先...\n\n2. 其次...\n\n3. 最后...\n\n希望这个回答对你有帮助！',
    ],
  },
  code: {
    greeting: [
      '你好！我是编程助手。我可以帮助你编写代码、调试问题、解释概念，或者提供最佳实践建议。需要什么帮助？',
    ],
    default: [
      '关于这个编程问题，我来帮你分析...\n\n**问题分析：**\n需要解决的核心问题是...\n\n**解决方案：**\n```javascript\n// 这里是示例代码\nfunction solution() {\n  // 实现逻辑\n  return result;\n}\n```\n\n**关键要点：**\n- 注意数据类型\n- 考虑边界情况\n- 添加适当的错误处理',
      '我来帮你分析这个代码问题...\n\n**最佳实践建议：**\n\n1. **代码结构**\n   - 保持函数简洁\n   - 使用清晰的命名\n   - 添加必要注释\n\n2. **性能优化**\n   - 避免不必要的计算\n   - 使用适当的数据结构\n   - 注意内存使用\n\n3. **代码示例**\n```typescript\n// 推荐的实现方式\nconst optimizedFunction = (input: string) => {\n  // 处理逻辑\n  return processedOutput;\n};\n```',
    ],
  },
  creative: {
    greeting: [
      '你好！我是创作助手。我可以帮助你写作、构思创意、提供灵感。让我们一起创造些什么吧！',
    ],
    default: [
      '关于创作这个内容，我有以下建议...\n\n**创作思路：**\n\n首先，我们需要明确主题和目标受众...\n\n**内容结构：**\n\n1. **开头** - 吸引注意力\n2. **主体** - 详细阐述\n3. **结尾** - 总结升华\n\n**写作技巧：**\n- 使用生动的描述\n- 添加适当的比喻\n- 保持逻辑连贯',
      '这是一个很好的创作主题！让我为你提供一些创意方案...\n\n**创意方向 1：**\n\n可以尝试从这个角度切入...\n\n**创意方向 2：**\n\n或者可以这样构思...\n\n**创意方向 3：**\n\n还可以考虑...\n\n**建议：**\n选择最符合你目标的方案，然后逐步完善细节。',
    ],
  },
  learning: {
    greeting: [
      '你好！我是学习导师。我可以帮助你理解概念、掌握技能、制定学习计划。准备好学习了吗？',
    ],
    default: [
      '让我来为你解释这个概念...\n\n**核心概念：**\n\n首先，我们需要理解...\n\n**学习步骤：**\n\n1. **第一步** - 基础理解\n2. **第二步** - 实践应用\n3. **第三步** - 深入掌握\n\n**关键要点：**\n\n- 注意理解原理\n- 多做练习\n- 及时复习巩固',
      '这是一个很好的学习主题！让我为你设计一个学习路径...\n\n**学习目标：**\n\n设定明确的学习目标很重要...\n\n**学习计划：**\n\n第1周：基础知识\n第2周：实践练习\n第3周：高级应用\n第4周：项目实战\n\n**学习资源：**\n\n- 官方文档\n- 教程视频\n- 练习题库\n- 实战项目',
    ],
  },
}

function generateResponse(message: string, model: string): string {
  const responses = defaultResponses[model] || defaultResponses.general
  
  if (message.toLowerCase().includes('你好') || message.toLowerCase().includes('hi')) {
    return responses.greeting[Math.floor(Math.random() * responses.greeting.length)]
  }
  
  if (message.toLowerCase().includes('谢谢') || message.toLowerCase().includes('thanks')) {
    return responses.thanks[Math.floor(Math.random() * responses.thanks.length)]
  }
  
  if (message.toLowerCase().includes('再见') || message.toLowerCase().includes('bye')) {
    return responses.goodbye[Math.floor(Math.random() * responses.goodbye.length)]
  }
  
  return responses.default[Math.floor(Math.random() * responses.default.length)]
}

export default function AIChatEnhanced() {
  const [messages, setMessages] = useState<Message[]>(() => {
    const saved = localStorage.getItem('ai-chat-history')
    return saved ? JSON.parse(saved) : []
  })
  const [input, setInput] = useState('')
  const [isTyping, setIsTyping] = useState(false)
  const [copiedId, setCopiedId] = useState<string | null>(null)
  const [currentModel, setCurrentModel] = useState<string>('general')
  const [showHistory, setShowHistory] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    localStorage.setItem('ai-chat-history', JSON.stringify(messages))
  }, [messages])

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  const sendMessage = useCallback(() => {
    if (!input.trim()) return

    const userMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: input.trim(),
      timestamp: Date.now(),
      category: currentModel as any,
    }

    setMessages(prev => [...prev, userMessage])
    setInput('')
    setIsTyping(true)

    setTimeout(() => {
      const response = generateResponse(userMessage.content, currentModel)
      const assistantMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: response,
        timestamp: Date.now(),
        category: currentModel as any,
      }
      setMessages(prev => [...prev, assistantMessage])
      setIsTyping(false)
    }, 1500)
  }, [input, currentModel])

  const clearHistory = useCallback(() => {
    setMessages([])
    localStorage.removeItem('ai-chat-history')
  }, [])

  const copyMessage = useCallback((id: string, content: string) => {
    navigator.clipboard.writeText(content)
    setCopiedId(id)
    setTimeout(() => setCopiedId(null), 2000)
  }, [])

  const exportHistory = useCallback(() => {
    const data = JSON.stringify(messages, null, 2)
    const blob = new Blob([data], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `ai-chat-history-${new Date().toISOString().split('T')[0]}.json`
    a.click()
    URL.revokeObjectURL(url)
  }, [messages])

  const formatTime = (timestamp: number) => {
    return new Date(timestamp).toLocaleTimeString('zh-CN', {
      hour: '2-digit',
      minute: '2-digit',
    })
  }

  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      height: '100%',
      background: 'var(--bg-primary)',
      color: 'var(--text-primary)',
    }}>
      {/* Header */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '16px 20px',
        borderBottom: '1px solid var(--border-color)',
        background: 'var(--bg-secondary)',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <Brain size={24} style={{ color: 'var(--accent-color)' }} />
          <div>
            <h2 style={{ fontSize: '16px', fontWeight: '600', margin: 0 }}>
              AI智能助手
            </h2>
            <p style={{ fontSize: '12px', color: 'var(--text-secondary)', margin: 0 }}>
              {aiModels.find(m => m.id === currentModel)?.description}
            </p>
          </div>
        </div>
        <div style={{ display: 'flex', gap: '8px' }}>
          <button
            onClick={() => setShowHistory(!showHistory)}
            title="历史记录"
            style={{
              background: 'var(--button-bg)',
              border: 'none',
              borderRadius: '8px',
              padding: '8px',
              cursor: 'pointer',
              color: 'var(--text-primary)',
              display: 'flex',
              alignItems: 'center',
            }}
          >
            <History size={18} />
          </button>
          <button
            onClick={exportHistory}
            title="导出记录"
            disabled={messages.length === 0}
            style={{
              background: 'var(--button-bg)',
              border: 'none',
              borderRadius: '8px',
              padding: '8px',
              cursor: messages.length > 0 ? 'pointer' : 'not-allowed',
              color: messages.length > 0 ? 'var(--text-primary)' : 'var(--text-secondary)',
              display: 'flex',
              alignItems: 'center',
              opacity: messages.length > 0 ? 1 : 0.5,
            }}
          >
            <Download size={18} />
          </button>
          <button
            onClick={clearHistory}
            title="清空历史"
            disabled={messages.length === 0}
            style={{
              background: 'var(--button-bg)',
              border: 'none',
              borderRadius: '8px',
              padding: '8px',
              cursor: messages.length > 0 ? 'pointer' : 'not-allowed',
              color: messages.length > 0 ? 'var(--text-primary)' : 'var(--text-secondary)',
              display: 'flex',
              alignItems: 'center',
              opacity: messages.length > 0 ? 1 : 0.5,
            }}
          >
            <Trash2 size={18} />
          </button>
        </div>
      </div>

      {/* Model Selector */}
      <div style={{
        display: 'flex',
        gap: '8px',
        padding: '12px 20px',
        borderBottom: '1px solid var(--border-color)',
      }}>
        {aiModels.map(model => (
          <button
            key={model.id}
            onClick={() => setCurrentModel(model.id)}
            style={{
              background: currentModel === model.id ? 'var(--accent-color)' : 'var(--button-bg)',
              color: currentModel === model.id ? 'white' : 'var(--text-primary)',
              border: '1px solid var(--border-color)',
              borderRadius: '20px',
              padding: '8px 16px',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              fontSize: '13px',
              fontWeight: '500',
              transition: 'all 0.2s ease',
            }}
          >
            {model.icon}
            {model.name}
          </button>
        ))}
      </div>

      {/* Messages */}
      <div style={{
        flex: 1,
        overflowY: 'auto',
        padding: '20px',
        display: 'flex',
        flexDirection: 'column',
        gap: '16px',
      }}>
        {messages.length === 0 && (
          <div style={{
            textAlign: 'center',
            padding: '40px 20px',
            color: 'var(--text-secondary)',
          }}>
            <Bot size={48} style={{ marginBottom: '16px', opacity: 0.5 }} />
            <p style={{ fontSize: '16px', marginBottom: '8px' }}>
              开始一段新的对话吧！
            </p>
            <p style={{ fontSize: '14px' }}>
              选择不同的AI模式获得专业帮助
            </p>
          </div>
        )}

        {messages.map(message => (
          <div
            key={message.id}
            style={{
              display: 'flex',
              gap: '12px',
              alignItems: 'flex-start',
              flexDirection: message.role === 'user' ? 'row-reverse' : 'row',
            }}
          >
            <div style={{
              width: '36px',
              height: '36px',
              borderRadius: '50%',
              background: message.role === 'user' ? 'var(--accent-color)' : 'var(--bg-secondary)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexShrink: 0,
            }}>
              {message.role === 'user' ? (
                <User size={18} style={{ color: 'white' }} />
              ) : (
                <Bot size={18} style={{ color: 'var(--accent-color)' }} />
              )}
            </div>
            <div style={{
              flex: 1,
              maxWidth: '80%',
              background: message.role === 'user' ? 'var(--accent-color)' : 'var(--bg-secondary)',
              borderRadius: '12px',
              padding: '12px 16px',
              position: 'relative',
            }}>
              <div style={{
                fontSize: '14px',
                lineHeight: '1.6',
                whiteSpace: 'pre-wrap',
                wordBreak: 'break-word',
              }}>
                {message.content}
              </div>
              <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                marginTop: '8px',
                fontSize: '12px',
                color: message.role === 'user' ? 'rgba(255,255,255,0.7)' : 'var(--text-secondary)',
              }}>
                <span>{formatTime(message.timestamp)}</span>
                {message.role === 'assistant' && (
                  <button
                    onClick={() => copyMessage(message.id, message.content)}
                    style={{
                      background: 'none',
                      border: 'none',
                      cursor: 'pointer',
                      color: 'var(--text-secondary)',
                      padding: '2px',
                      display: 'flex',
                      alignItems: 'center',
                    }}
                  >
                    {copiedId === message.id ? <Check size={14} /> : <Copy size={14} />}
                  </button>
                )}
              </div>
            </div>
          </div>
        ))}

        {isTyping && (
          <div style={{
            display: 'flex',
            gap: '12px',
            alignItems: 'flex-start',
          }}>
            <div style={{
              width: '36px',
              height: '36px',
              borderRadius: '50%',
              background: 'var(--bg-secondary)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}>
              <Bot size={18} style={{ color: 'var(--accent-color)' }} />
            </div>
            <div style={{
              background: 'var(--bg-secondary)',
              borderRadius: '12px',
              padding: '12px 16px',
            }}>
              <div style={{ display: 'flex', gap: '4px' }}>
                <span style={{
                  width: '8px',
                  height: '8px',
                  borderRadius: '50%',
                  background: 'var(--accent-color)',
                  animation: 'bounce 1s infinite',
                }} />
                <span style={{
                  width: '8px',
                  height: '8px',
                  borderRadius: '50%',
                  background: 'var(--accent-color)',
                  animation: 'bounce 1s infinite',
                  animationDelay: '0.2s',
                }} />
                <span style={{
                  width: '8px',
                  height: '8px',
                  borderRadius: '50%',
                  background: 'var(--accent-color)',
                  animation: 'bounce 1s infinite',
                  animationDelay: '0.4s',
                }} />
              </div>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <div style={{
        padding: '16px 20px',
        borderTop: '1px solid var(--border-color)',
        background: 'var(--bg-secondary)',
      }}>
        <div style={{
          display: 'flex',
          gap: '12px',
          alignItems: 'center',
        }}>
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault()
                sendMessage()
              }
            }}
            placeholder={`向 ${aiModels.find(m => m.id === currentModel)?.name} 发送消息...`}
            style={{
              flex: 1,
              background: 'var(--bg-primary)',
              border: '1px solid var(--border-color)',
              borderRadius: '12px',
              padding: '12px 16px',
              fontSize: '14px',
              color: 'var(--text-primary)',
              outline: 'none',
            }}
          />
          <button
            onClick={sendMessage}
            disabled={!input.trim() || isTyping}
            style={{
              background: input.trim() && !isTyping ? 'var(--accent-color)' : 'var(--button-bg)',
              border: 'none',
              borderRadius: '12px',
              padding: '12px',
              cursor: input.trim() && !isTyping ? 'pointer' : 'not-allowed',
              color: input.trim() && !isTyping ? 'white' : 'var(--text-secondary)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              transition: 'all 0.2s ease',
            }}
          >
            <Send size={18} />
          </button>
        </div>
        <p style={{
          fontSize: '12px',
          color: 'var(--text-secondary)',
          marginTop: '8px',
          textAlign: 'center',
        }}>
          按 Enter 发送，AI聊天记录已自动保存
        </p>
      </div>

      <style>{`
        @keyframes bounce {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-4px); }
        }
      `}</style>
    </div>
  )
}