import { useState, useRef, useEffect, useCallback } from 'react'
import { useStore } from '../store'

interface Message {
  id: string
  role: 'user' | 'assistant' | 'system'
  content: string
  timestamp: Date
  model?: string
}

interface Conversation {
  id: string
  title: string
  messages: Message[]
  createdAt: Date
  updatedAt: Date
}

const AI_MODELS = [
  { id: 'general', name: '通用助手', icon: '🤖', description: '智能问答和日常助手' },
  { id: 'code', name: '代码专家', icon: '💻', description: '编程问题解答和代码审查' },
  { id: 'writing', name: '写作助手', icon: '✍️', description: '文档撰写和内容创作' },
  { id: 'analysis', name: '数据分析师', icon: '📊', description: '数据分析和可视化建议' },
  { id: 'translator', name: '翻译专家', icon: '🌐', description: '多语言翻译和本地化' },
]

const QUICK_PROMPTS = [
  { text: '帮我写一个函数', category: 'code' },
  { text: '解释这段代码', category: 'code' },
  { text: '优化这个算法', category: 'code' },
  { text: '写一个README', category: 'writing' },
  { text: '生成API文档', category: 'writing' },
  { text: '分析这个数据', category: 'analysis' },
  { text: '翻译成英文', category: 'translator' },
  { text: '创建单元测试', category: 'code' },
]

export default function AIUltimateAssistant() {
  const [conversations, setConversations] = useState<Conversation[]>([])
  const [currentConversation, setCurrentConversation] = useState<Conversation | null>(null)
  const [input, setInput] = useState('')
  const [selectedModel, setSelectedModel] = useState('general')
  const [isTyping, setIsTyping] = useState(false)
  const [showSidebar, setShowSidebar] = useState(true)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLTextAreaElement>(null)

  useEffect(() => {
    // 加载历史对话
    const saved = localStorage.getItem('ai-conversations')
    if (saved) {
      setConversations(JSON.parse(saved))
    } else {
      // 创建默认对话
      const defaultConv: Conversation = {
        id: 'default',
        title: '新对话',
        messages: [{
          id: 'welcome',
          role: 'assistant',
          content: '您好!我是WebLinuxOS AI助手。我可以帮助您:\n\n• 📝 撰写和编辑代码\n• 📊 分析数据\n• ✍️ 创作文档和内容\n• 🌐 翻译文本\n• 💡 提供创意建议\n\n请选择一个模式或直接输入您的问题!',
          timestamp: new Date(),
          model: 'general'
        }],
        createdAt: new Date(),
        updatedAt: new Date()
      }
      setConversations([defaultConv])
      setCurrentConversation(defaultConv)
    }
  }, [])

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [currentConversation?.messages])

  const generateResponse = useCallback(async (userMessage: string, model: string): Promise<string> => {
    // 模拟AI响应 (实际应用中可接入真实API)
    await new Promise(resolve => setTimeout(resolve, 1000 + Math.random() * 2000))
    
    const responses: Record<string, string[]> = {
      general: [
        '我理解您的问题。这是一个很好的观点!让我为您详细解答...',
        '根据您的需求,我建议您考虑以下方案...',
        '这个问题很有深度。让我从几个角度来分析...',
        '我可以帮您解决这个问题。以下是详细的步骤说明...',
      ],
      code: [
        '```typescript\n// 这里是一个示例实现\nfunction solution(input: any) {\n  // 处理逻辑\n  return result;\n}\n```\n\n这段代码实现了您需要的功能。主要特点包括...',
        '我注意到您在代码中可以优化的地方:\n\n1. 使用更高效的算法\n2. 添加类型检查\n3. 增加错误处理\n\n需要我提供具体代码吗?',
        '这是一个常见的编程问题。最佳实践是使用设计模式来解决...',
      ],
      writing: [
        '# 标题\n\n## 概述\n\n根据您的要求,我为您撰写了以下内容...\n\n## 详细说明\n\n...',
        '我已经为您生成了专业的文档结构:\n\n1. 引言\n2. 方法论\n3. 实施步骤\n4. 总结\n\n需要我展开任何一个部分吗?',
      ],
      analysis: [
        '基于数据分析,我发现以下关键趋势:\n\n• 数据点A: 增长趋势明显\n• 数据点B: 季节性波动\n• 数据点C: 异常值需要关注\n\n建议使用可视化图表展示...',
        '让我为您生成数据分析报告:\n\n**关键指标**\n- 平均值: XX\n- 标准差: XX\n- 趋势: 上升/下降\n\n需要我进一步分析吗?',
      ],
      translator: [
        '**翻译结果:**\n\n[Translated text would appear here]\n\n**注释:** 翻译保留了原文的语气和风格...',
        '已为您完成翻译:\n\n原文: [Original]\n译文: [Translated]\n\n还提供了发音指南和文化背景说明...',
      ]
    }
    
    const modelResponses = responses[model] || responses.general
    return modelResponses[Math.floor(Math.random() * modelResponses.length)]
  }, [])

  const handleSend = async () => {
    if (!input.trim() || !currentConversation) return
    
    const userMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: input.trim(),
      timestamp: new Date()
    }
    
    setInput('')
    setIsTyping(true)
    
    // 添加用户消息
    const updatedConv = {
      ...currentConversation,
      messages: [...currentConversation.messages, userMessage],
      updatedAt: new Date()
    }
    
    setCurrentConversation(updatedConv)
    setConversations(prev => prev.map(c => c.id === updatedConv.id ? updatedConv : c))
    
    // 生成AI响应
    const response = await generateResponse(userMessage.content, selectedModel)
    
    const assistantMessage: Message = {
      id: (Date.now() + 1).toString(),
      role: 'assistant',
      content: response,
      timestamp: new Date(),
      model: selectedModel
    }
    
    const finalConv = {
      ...updatedConv,
      messages: [...updatedConv.messages, assistantMessage],
      updatedAt: new Date()
    }
    
    setCurrentConversation(finalConv)
    setConversations(prev => prev.map(c => c.id === finalConv.id ? finalConv : c))
    setIsTyping(false)
    
    // 保存到localStorage
    localStorage.setItem('ai-conversations', JSON.stringify(conversations.map(c => c.id === finalConv.id ? finalConv : c)))
  }

  const handleNewConversation = () => {
    const newConv: Conversation = {
      id: Date.now().toString(),
      title: `对话 ${conversations.length + 1}`,
      messages: [{
        id: 'welcome',
        role: 'assistant',
        content: '新对话已创建!请选择助手模式或直接输入您的问题。',
        timestamp: new Date(),
        model: selectedModel
      }],
      createdAt: new Date(),
      updatedAt: new Date()
    }
    
    setConversations(prev => [...prev, newConv])
    setCurrentConversation(newConv)
  }

  const handleDeleteConversation = (id: string) => {
    setConversations(prev => prev.filter(c => c.id !== id))
    if (currentConversation?.id === id) {
      setCurrentConversation(conversations.find(c => c.id !== id) || null)
    }
  }

  const handleQuickPrompt = (prompt: string) => {
    setInput(prompt)
    inputRef.current?.focus()
  }

  return (
    <div style={{
      display: 'flex',
      height: '100%',
      backgroundColor: 'var(--bg-color)',
      color: 'var(--text-color)'
    }}>
      {/* 侧边栏 */}
      {showSidebar && (
        <div style={{
          width: '280px',
          backgroundColor: 'var(--bg-secondary)',
          borderRight: '1px solid var(--border-color)',
          display: 'flex',
          flexDirection: 'column',
          padding: '16px'
        }}>
          <button
            onClick={handleNewConversation}
            style={{
              padding: '12px',
              backgroundColor: 'var(--accent-color)',
              color: 'white',
              border: 'none',
              borderRadius: '8px',
              cursor: 'pointer',
              marginBottom: '16px',
              fontSize: '14px',
              fontWeight: 500
            }}
          >
            + 新对话
          </button>
          
          {/* AI模型选择 */}
          <div style={{ marginBottom: '16px' }}>
            <div style={{ fontSize: '12px', color: 'var(--text-secondary)', marginBottom: '8px' }}>
              选择助手类型
            </div>
            {AI_MODELS.map(model => (
              <button
                key={model.id}
                onClick={() => setSelectedModel(model.id)}
                style={{
                  width: '100%',
                  padding: '10px',
                  marginBottom: '4px',
                  backgroundColor: selectedModel === model.id ? 'var(--accent-color)' : 'transparent',
                  color: selectedModel === model.id ? 'white' : 'var(--text-color)',
                  border: '1px solid var(--border-color)',
                  borderRadius: '6px',
                  cursor: 'pointer',
                  textAlign: 'left',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  fontSize: '13px'
                }}
              >
                <span style={{ fontSize: '18px' }}>{model.icon}</span>
                <div>
                  <div style={{ fontWeight: 500 }}>{model.name}</div>
                  <div style={{ fontSize: '11px', opacity: 0.7 }}>{model.description}</div>
                </div>
              </button>
            ))}
          </div>
          
          {/* 对话历史 */}
          <div style={{ flex: 1, overflowY: 'auto' }}>
            <div style={{ fontSize: '12px', color: 'var(--text-secondary)', marginBottom: '8px' }}>
              对话历史
            </div>
            {conversations.slice().reverse().map(conv => (
              <div
                key={conv.id}
                onClick={() => setCurrentConversation(conv)}
                style={{
                  padding: '10px',
                  marginBottom: '4px',
                  backgroundColor: currentConversation?.id === conv.id ? 'var(--bg-hover)' : 'transparent',
                  borderRadius: '6px',
                  cursor: 'pointer',
                  fontSize: '13px',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center'
                }}
              >
                <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {conv.title}
                </span>
                <button
                  onClick={(e) => {
                    e.stopPropagation()
                    handleDeleteConversation(conv.id)
                  }}
                  style={{
                    padding: '2px 6px',
                    backgroundColor: 'transparent',
                    border: 'none',
                    color: 'var(--text-secondary)',
                    cursor: 'pointer',
                    fontSize: '12px'
                  }}
                >
                  ×
                </button>
              </div>
            ))}
          </div>
        </div>
      )}
      
      {/* 主聊天区域 */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
        {/* 顶部工具栏 */}
        <div style={{
          padding: '12px 16px',
          borderBottom: '1px solid var(--border-color)',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <button
              onClick={() => setShowSidebar(!showSidebar)}
              style={{
                padding: '6px 12px',
                backgroundColor: 'var(--bg-secondary)',
                border: '1px solid var(--border-color)',
                borderRadius: '6px',
                cursor: 'pointer',
                fontSize: '12px'
              }}
            >
              {showSidebar ? '◀ 隐藏' : '▶ 显示'}
            </button>
            <span style={{ fontSize: '16px', fontWeight: 500 }}>
              {AI_MODELS.find(m => m.id === selectedModel)?.icon} {AI_MODELS.find(m => m.id === selectedModel)?.name}
            </span>
          </div>
          <div style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>
            WebLinuxOS AI助手 v37.3
          </div>
        </div>
        
        {/* 消息列表 */}
        <div style={{
          flex: 1,
          overflowY: 'auto',
          padding: '16px',
          display: 'flex',
          flexDirection: 'column',
          gap: '16px'
        }}>
          {currentConversation?.messages.map(msg => (
            <div
              key={msg.id}
              style={{
                display: 'flex',
                gap: '12px',
                alignSelf: msg.role === 'user' ? 'flex-end' : 'flex-start'
              }}
            >
              {msg.role === 'assistant' && (
                <div style={{
                  width: '32px',
                  height: '32px',
                  borderRadius: '50%',
                  backgroundColor: 'var(--accent-color)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '16px'
                }}>
                  🤖
                </div>
              )}
              <div style={{
                maxWidth: '70%',
                padding: '12px 16px',
                borderRadius: '12px',
                backgroundColor: msg.role === 'user' ? 'var(--accent-color)' : 'var(--bg-secondary)',
                color: msg.role === 'user' ? 'white' : 'var(--text-color)',
                whiteSpace: 'pre-wrap',
                fontFamily: msg.content.includes('```') ? 'monospace' : 'inherit',
                fontSize: '14px',
                lineHeight: 1.6
              }}>
                {msg.content}
              </div>
              {msg.role === 'user' && (
                <div style={{
                  width: '32px',
                  height: '32px',
                  borderRadius: '50%',
                  backgroundColor: 'var(--bg-tertiary)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '16px'
                }}>
                  👤
                </div>
              )}
            </div>
          ))}
          {isTyping && (
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--text-secondary)' }}>
              <div className="typing-indicator">●●●</div>
              <span style={{ fontSize: '12px' }}>AI正在思考...</span>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>
        
        {/* 快捷提示 */}
        <div style={{
          padding: '8px 16px',
          borderTop: '1px solid var(--border-color)',
          display: 'flex',
          gap: '8px',
          flexWrap: 'wrap'
        }}>
          {QUICK_PROMPTS.slice(0, 4).map(prompt => (
            <button
              key={prompt.text}
              onClick={() => handleQuickPrompt(prompt.text)}
              style={{
                padding: '6px 12px',
                backgroundColor: 'var(--bg-secondary)',
                border: '1px solid var(--border-color)',
                borderRadius: '16px',
                cursor: 'pointer',
                fontSize: '12px',
                color: 'var(--text-color)'
              }}
            >
              {prompt.text}
            </button>
          ))}
        </div>
        
        {/* 输入区域 */}
        <div style={{ padding: '16px', borderTop: '1px solid var(--border-color)' }}>
          <div style={{ display: 'flex', gap: '12px' }}>
            <textarea
              ref={inputRef}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault()
                  handleSend()
                }
              }}
              placeholder="输入您的问题... (Enter发送, Shift+Enter换行)"
              style={{
                flex: 1,
                padding: '12px',
                backgroundColor: 'var(--bg-secondary)',
                border: '1px solid var(--border-color)',
                borderRadius: '8px',
                color: 'var(--text-color)',
                resize: 'none',
                fontSize: '14px',
                minHeight: '60px',
                maxHeight: '200px'
              }}
            />
            <button
              onClick={handleSend}
              disabled={!input.trim() || isTyping}
              style={{
                padding: '12px 24px',
                backgroundColor: input.trim() && !isTyping ? 'var(--accent-color)' : 'var(--bg-tertiary)',
                color: 'white',
                border: 'none',
                borderRadius: '8px',
                cursor: input.trim() && !isTyping ? 'pointer' : 'not-allowed',
                fontSize: '14px',
                fontWeight: 500
              }}
            >
              发送
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}