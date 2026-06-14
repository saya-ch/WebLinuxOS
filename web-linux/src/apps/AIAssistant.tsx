import { useState, useCallback, useRef, useEffect, memo } from 'react'

interface Message {
  id: string
  role: 'user' | 'assistant'
  content: string
  timestamp: Date
}

interface QuickAction {
  label: string
  prompt: string
  category: string
}

const quickActions: QuickAction[] = [
  { label: '代码解释', prompt: '请解释以下代码的功能和原理：', category: '开发' },
  { label: '代码优化', prompt: '请帮我优化以下代码，提高性能和可读性：', category: '开发' },
  { label: 'Bug分析', prompt: '请分析以下代码中可能存在的问题：', category: '开发' },
  { label: '翻译', prompt: '请将以下内容翻译成中文：', category: '语言' },
  { label: '语法检查', prompt: '请检查以下文本的语法和表达：', category: '语言' },
  { label: '摘要生成', prompt: '请为以下内容生成简洁的摘要：', category: '写作' },
  { label: '格式化', prompt: '请将以下内容格式化为更清晰的结构：', category: '写作' },
  { label: '概念解释', prompt: '请用通俗易懂的语言解释以下概念：', category: '学习' },
  { label: '学习建议', prompt: '请给我关于学习以下内容的建议：', category: '学习' },
]

// 预设的AI回复模板
const aiResponses: Record<string, string[]> = {
  '代码': [
    '这是一个很好的代码示例！让我来分析一下它的结构和功能。\n\n从代码来看，主要实现了以下几个功能：\n1. 数据处理和转换\n2. 用户交互逻辑\n3. 结果展示\n\n建议优化点：\n- 可以考虑添加错误处理\n- 使用更现代的语法特性\n- 优化性能瓶颈部分',
    '代码分析完成！这段代码展示了良好的编程实践。\n\n主要特点：\n- 结构清晰，易于理解\n- 功能模块化设计\n- 适当的注释说明\n\n可能的改进方向：\n- 增加单元测试\n- 优化内存使用\n- 提升代码复用性',
  ],
  '翻译': [
    '翻译结果：\n\n以下是您提供内容的中文翻译。翻译过程中保持了原文的语义和风格，同时确保表达流畅自然。\n\n如有特定术语或专业词汇，已采用行业标准译法。',
  ],
  '解释': [
    '概念解释：\n\n这个概念可以从以下几个层面来理解：\n\n1. **基础层面**：它是一个核心的技术/理论概念\n2. **应用层面**：在实际场景中用于解决特定问题\n3. **扩展层面**：与其他概念相互关联，形成完整的知识体系\n\n简单来说，就像...',
  ],
  'default': [
    '感谢您的提问！作为WebLinuxOS的AI助手，我很乐意帮助您。\n\n我可以协助您完成以下任务：\n- 代码分析和优化建议\n- 文本翻译和语法检查\n- 概念解释和学习建议\n- 内容摘要和格式化\n\n请告诉我您需要什么帮助？',
    '您好！我是WebLinuxOS内置的智能助手。\n\n虽然我目前是一个模拟版本，但我可以为您提供一些基础的帮助和建议。在实际应用中，您可以接入真正的AI服务来获得更强大的功能。\n\n有什么我可以帮助您的吗？',
    '收到您的消息！让我来思考一下如何最好地帮助您。\n\n根据您的问题，我建议：\n1. 首先明确问题的核心\n2. 分析可能的解决方案\n3. 选择最适合的方法\n\n如果您需要更具体的帮助，请提供更多细节。',
  ],
}

const AIAssistant = memo(function AIAssistant() {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      role: 'assistant',
      content: '欢迎使用 WebLinuxOS AI 助手！\n\n我可以帮助您进行代码分析、文本处理、概念解释等工作。\n\n虽然这是一个模拟演示版本，但它展示了AI助手在操作系统中的集成方式。\n\n请输入您的问题，或选择下方的快捷操作开始使用。',
      timestamp: new Date()
    }
  ])
  const [input, setInput] = useState('')
  const [isTyping, setIsTyping] = useState(false)
  const [showActions, setShowActions] = useState(true)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  
  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [])
  
  useEffect(() => {
    scrollToBottom()
  }, [messages, scrollToBottom])
  
  const generateResponse = useCallback((userMessage: string): string => {
    // 根据用户消息内容选择合适的回复
    const lowerMessage = userMessage.toLowerCase()
    
    if (lowerMessage.includes('代码') || lowerMessage.includes('code') || lowerMessage.includes('function')) {
      return aiResponses['代码'][Math.floor(Math.random() * aiResponses['代码'].length)]
    }
    if (lowerMessage.includes('翻译') || lowerMessage.includes('translate')) {
      return aiResponses['翻译'][0]
    }
    if (lowerMessage.includes('解释') || lowerMessage.includes('explain') || lowerMessage.includes('什么是')) {
      return aiResponses['解释'][0]
    }
    
    return aiResponses['default'][Math.floor(Math.random() * aiResponses['default'].length)]
  }, [])
  
  const handleSend = useCallback(async () => {
    if (!input.trim()) return
    
    const userMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: input.trim(),
      timestamp: new Date()
    }
    
    setMessages(prev => [...prev, userMessage])
    setInput('')
    setShowActions(false)
    setIsTyping(true)
    
    // 模拟AI思考延迟
    await new Promise(resolve => setTimeout(resolve, 1000 + Math.random() * 1000))
    
    const aiMessage: Message = {
      id: (Date.now() + 1).toString(),
      role: 'assistant',
      content: generateResponse(userMessage.content),
      timestamp: new Date()
    }
    
    setIsTyping(false)
    setMessages(prev => [...prev, aiMessage])
  }, [input, generateResponse])
  
  const handleQuickAction = useCallback((action: QuickAction) => {
    setInput(action.prompt + '\n\n')
    setShowActions(false)
  }, [])
  
  const handleClear = useCallback(() => {
    setMessages([
      {
        id: Date.now().toString(),
        role: 'assistant',
        content: '对话已清空。请输入新的问题开始对话。',
        timestamp: new Date()
      }
    ])
    setShowActions(true)
  }, [])
  
  const formatTime = useCallback((date: Date) => {
    return date.toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' })
  }, [])
  
  return (
    <div style={{
      height: '100%',
      display: 'flex',
      flexDirection: 'column',
      background: '#0f0f23',
      color: '#e0e0e0',
      fontFamily: 'system-ui, -apple-system, sans-serif'
    }}>
      {/* 头部 */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '12px 16px',
        background: '#1a1a2e',
        borderBottom: '1px solid #2d2d44'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <div style={{
            width: 36,
            height: 36,
            borderRadius: 8,
            background: 'linear-gradient(135deg, #6366f1, #8b5cf6)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: 18
          }}>
            AI
          </div>
          <div>
            <div style={{ fontWeight: 600 }}>AI 助手</div>
            <div style={{ fontSize: 12, color: '#6b7280' }}>智能对话助手 (模拟版)</div>
          </div>
        </div>
        <button
          onClick={handleClear}
          style={{
            padding: '6px 12px',
            borderRadius: 6,
            border: '1px solid #2d2d44',
            background: 'transparent',
            color: '#9ca3af',
            cursor: 'pointer',
            fontSize: 12
          }}
        >
          清空对话
        </button>
      </div>
      
      {/* 消息区域 */}
      <div style={{
        flex: 1,
        overflow: 'auto',
        padding: 16
      }}>
        {messages.map(message => (
          <div
            key={message.id}
            style={{
              display: 'flex',
              gap: 12,
              marginBottom: 16,
              flexDirection: message.role === 'user' ? 'row-reverse' : 'row'
            }}
          >
            {/* 头像 */}
            <div style={{
              width: 32,
              height: 32,
              borderRadius: 8,
              background: message.role === 'user' 
                ? 'linear-gradient(135deg, #3b82f6, #1d4ed8)'
                : 'linear-gradient(135deg, #6366f1, #8b5cf6)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: 14,
              fontWeight: 600,
              color: '#fff'
            }}>
              {message.role === 'user' ? 'U' : 'AI'}
            </div>
            
            {/* 消息内容 */}
            <div style={{
              maxWidth: '70%',
              padding: '12px 16px',
              borderRadius: 12,
              background: message.role === 'user' ? '#3b82f6' : '#1a1a2e',
              color: message.role === 'user' ? '#fff' : '#e0e0e0',
              border: message.role === 'assistant' ? '1px solid #2d2d44' : 'none'
            }}>
              <div style={{
                whiteSpace: 'pre-wrap',
                lineHeight: 1.6,
                fontSize: 14
              }}>
                {message.content}
              </div>
              <div style={{
                fontSize: 11,
                color: message.role === 'user' ? '#bfdbfe' : '#6b7280',
                marginTop: 8,
                textAlign: message.role === 'user' ? 'right' : 'left'
              }}>
                {formatTime(message.timestamp)}
              </div>
            </div>
          </div>
        ))}
        
        {/* AI正在输入 */}
        {isTyping && (
          <div style={{
            display: 'flex',
            gap: 12,
            marginBottom: 16
          }}>
            <div style={{
              width: 32,
              height: 32,
              borderRadius: 8,
              background: 'linear-gradient(135deg, #6366f1, #8b5cf6)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: 14,
              fontWeight: 600,
              color: '#fff'
            }}>
              AI
            </div>
            <div style={{
              padding: '12px 16px',
              borderRadius: 12,
              background: '#1a1a2e',
              border: '1px solid #2d2d44'
            }}>
              <div style={{ display: 'flex', gap: 4 }}>
                <span style={{ animation: 'bounce 1s infinite', animationDelay: '0s' }}>.</span>
                <span style={{ animation: 'bounce 1s infinite', animationDelay: '0.2s' }}>.</span>
                <span style={{ animation: 'bounce 1s infinite', animationDelay: '0.4s' }}>.</span>
              </div>
            </div>
          </div>
        )}
        
        <div ref={messagesEndRef} />
      </div>
      
      {/* 快捷操作 */}
      {showActions && messages.length <= 1 && (
        <div style={{
          padding: '12px 16px',
          background: '#1a1a2e',
          borderTop: '1px solid #2d2d44'
        }}>
          <div style={{ fontSize: 12, color: '#6b7280', marginBottom: 8 }}>快捷操作</div>
          <div style={{
            display: 'flex',
            gap: 8,
            flexWrap: 'wrap'
          }}>
            {quickActions.slice(0, 6).map(action => (
              <button
                key={action.label}
                onClick={() => handleQuickAction(action)}
                style={{
                  padding: '8px 12px',
                  borderRadius: 8,
                  border: '1px solid #2d2d44',
                  background: '#0f0f23',
                  color: '#9ca3af',
                  cursor: 'pointer',
                  fontSize: 12,
                  transition: 'all 0.2s'
                }}
              >
                {action.label}
              </button>
            ))}
          </div>
        </div>
      )}
      
      {/* 输入区域 */}
      <div style={{
        padding: '12px 16px',
        background: '#1a1a2e',
        borderTop: '1px solid #2d2d44'
      }}>
        <div style={{
          display: 'flex',
          gap: 12,
          alignItems: 'flex-end'
        }}>
          <textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault()
                handleSend()
              }
            }}
            placeholder="输入消息... (Enter发送, Shift+Enter换行)"
            style={{
              flex: 1,
              padding: '12px 16px',
              borderRadius: 12,
              border: '1px solid #2d2d44',
              background: '#0f0f23',
              color: '#e0e0e0',
              resize: 'none',
              minHeight: 44,
              maxHeight: 120,
              fontSize: 14,
              lineHeight: 1.5
            }}
          />
          <button
            onClick={handleSend}
            disabled={!input.trim() || isTyping}
            style={{
              padding: '12px 20px',
              borderRadius: 12,
              border: 'none',
              background: input.trim() && !isTyping ? '#6366f1' : '#2d2d44',
              color: '#fff',
              cursor: input.trim() && !isTyping ? 'pointer' : 'not-allowed',
              fontSize: 14,
              fontWeight: 600,
              transition: 'background 0.2s'
            }}
          >
            发送
          </button>
        </div>
        <div style={{
          fontSize: 11,
          color: '#6b7280',
          marginTop: 8,
          textAlign: 'center'
        }}>
          WebLinuxOS AI Assistant - 模拟演示版本
        </div>
      </div>
      
      <style>{`
        @keyframes bounce {
          0%, 80%, 100% { transform: translateY(0); }
          40% { transform: translateY(-8px); }
        }
      `}</style>
    </div>
  )
})

export default AIAssistant