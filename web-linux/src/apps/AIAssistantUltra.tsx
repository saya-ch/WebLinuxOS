import { useState } from 'react'
import { SparklesIcon, CodeIcon, BookIcon, RefreshCwIcon, ZapIcon } from '../icons'

const AIAssistantUltra = () => {
  const [messages, setMessages] = useState<Array<{ role: 'user' | 'assistant', content: string, timestamp: Date }>>([
    {
      role: 'assistant',
      content: '你好！我是 WebLinuxOS 的智能助手。我可以帮助你：\n\n• 📝 编写和优化代码\n• 💡 提供创意灵感\n• 📚 解释技术概念\n• 🔍 分析数据结构\n• 🌐 提供实时信息\n\n请告诉我你需要什么帮助！',
      timestamp: new Date()
    }
  ])
  const [input, setInput] = useState('')
  const [mode, setMode] = useState<'chat' | 'code' | 'analyze'>('chat')
  const [isLoading, setIsLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!input.trim() || isLoading) return

    const userMessage: { role: 'user' | 'assistant', content: string, timestamp: Date } = {
      role: 'user',
      content: input,
      timestamp: new Date()
    }

    setMessages(prev => [...prev, userMessage])
    setInput('')
    setIsLoading(true)

    try {
      // 模拟AI响应（实际应用中可以接入真实AI API）
      const response = await generateResponse(input, mode)
      const assistantMessage: { role: 'user' | 'assistant', content: string, timestamp: Date } = {
        role: 'assistant',
        content: response,
        timestamp: new Date()
      }
      setMessages(prev => [...prev, assistantMessage])
    } catch (error) {
      const errorMessage: { role: 'user' | 'assistant', content: string, timestamp: Date } = {
        role: 'assistant',
        content: '抱歉，我遇到了一些问题。请稍后再试。',
        timestamp: new Date()
      }
      setMessages(prev => [...prev, errorMessage])
    } finally {
      setIsLoading(false)
    }
  }

  const generateResponse = async (userInput: string, currentMode: string): Promise<string> => {
    // 基于模式生成不同类型的响应
    await new Promise(resolve => setTimeout(resolve, 1000 + Math.random() * 1000))

    const responses = {
      chat: [
        `关于"${userInput}"的问题，我可以从多个角度来分析：\n\n首先，这是一个很好的话题。从技术角度来看，我们可以考虑以下几个方面...\n\n希望这个回答对你有帮助！如果需要更深入的分析，请告诉我。`,
        `理解你的需求。让我为你提供一个详细的解决方案：\n\n1. 核心思路\n2. 具体步骤\n3. 可能遇到的挑战\n\n你想要更详细地讨论哪个方面？`,
        `这是一个很有价值的问题！基于我的分析，我建议：\n\n• 考虑问题的核心要素\n• 分析潜在的解决方案\n• 制定具体的行动计划\n\n需要我详细展开某个部分吗？`
      ],
      code: [
        `// 基于你的需求"${userInput}",我提供一个代码解决方案：\n\n// 基础实现\nfunction solution() {\n  // 核心逻辑\n  console.log("实现步骤...");\n  return {\n    success: true,\n    message: "代码已生成"\n  };\n}\n\n// 使用示例\nconst result = solution();\nconsole.log(result);`,
        `// 代码优化建议：\n\n// 原代码分析\n// 改进点：\n// 1. 性能优化\n// 2. 错误处理\n// 3. 可读性提升\n\n// 优化后的实现\nconst optimizedSolution = () => {\n  try {\n    // 高效的实现\n    return { status: 'success' };\n  } catch (error) {\n    console.error('处理错误:', error);\n    return { status: 'error', message: error.message };\n  }\n};`,
        `// 代码结构设计：\n\ninterface DataStructure {\n  id: string;\n  value: any;\n  metadata?: object;\n}\n\nclass Solution {\n  private data: DataStructure[];\n\n  constructor() {\n    this.data = [];  \n  }\n\n  process(input: any): DataStructure {\n    return {\n      id: this.generateId(),\n      value: input,\n      metadata: { timestamp: Date.now() }\n    };\n  }\n\n  private generateId(): string {\n    return Math.random().toString(36).substr(2, 9);\n  }\n}`
      ],
      analyze: [
        `📊 数据分析结果：\n\n输入: "${userInput}"\n\n分析维度：\n• 结构完整性: 85%\n• 逻辑一致性: 90%\n• 可扩展性: 75%\n\n建议：\n1. 增强模块化设计\n2. 添加容错机制\n3. 优化性能瓶颈`,
        `🔍 深度分析：\n\n"${userInput}"\n\n关键发现：\n• 数据模式清晰\n• 存在优化空间\n• 需要补充边缘情况处理\n\n优化路径：\n第一步：识别核心问题\n第二步：制定解决方案\n第三步：验证改进效果`,
        `📈 趋势分析：\n\n基于"${userInput}"的分析：\n\n• 当前状态：稳定\n• 发展趋势：积极\n• 潜在风险：可控\n\n下一步建议：\n• 继续监测关键指标\n• 适时调整策略\n• 建立反馈机制`
      ]
    }

    const modeResponses = responses[currentMode as keyof typeof responses]
    return modeResponses[Math.floor(Math.random() * modeResponses.length)]
  }

  const clearMessages = () => {
    const initMessage: { role: 'user' | 'assistant', content: string, timestamp: Date } = {
      role: 'assistant',
      content: '对话已清空。准备好为你提供新的帮助！',
      timestamp: new Date()
    }
    setMessages([initMessage])
  }

  const modes = [
    { id: 'chat', name: '智能对话', icon: <SparklesIcon /> },
    { id: 'code', name: '代码助手', icon: <CodeIcon /> },
    { id: 'analyze', name: '数据分析', icon: <BookIcon /> }
  ]

  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      height: '100%',
      background: 'var(--window-bg)',
      borderRadius: '12px',
      overflow: 'hidden'
    }}>
      {/* Header */}
      <div style={{
        padding: '16px 20px',
        borderBottom: '1px solid var(--window-border)',
        display: 'flex',
        alignItems: 'center',
        gap: '12px',
        background: 'var(--titlebar-bg)'
      }}>
        <SparklesIcon style={{ color: 'var(--accent)' }} />
        <span style={{
          fontSize: '18px',
          fontWeight: 600,
          color: 'var(--text-primary)'
        }}>AI智能助手</span>
        <div style={{
          marginLeft: 'auto',
          display: 'flex',
          gap: '8px'
        }}>
          <button
            onClick={clearMessages}
            style={{
              padding: '8px 12px',
              background: 'var(--glass-bg)',
              border: '1px solid var(--glass-border)',
              borderRadius: '8px',
              color: 'var(--text-secondary)',
              fontSize: '13px',
              cursor: 'pointer',
              transition: 'var(--transition-smooth)'
            }}
          >
            <RefreshCwIcon style={{ marginRight: '6px' }} />
            清空对话
          </button>
        </div>
      </div>

      {/* Mode selector */}
      <div style={{
        padding: '12px 20px',
        borderBottom: '1px solid var(--window-border)',
        display: 'flex',
        gap: '8px'
      }}>
        {modes.map(m => (
          <button
            key={m.id}
            onClick={() => setMode(m.id as typeof mode)}
            style={{
              padding: '8px 16px',
              background: mode === m.id ? 'var(--accent-bg)' : 'var(--glass-bg)',
              border: `1px solid ${mode === m.id ? 'var(--accent)' : 'var(--glass-border)'}`,
              borderRadius: '8px',
              color: mode === m.id ? 'var(--accent)' : 'var(--text-secondary)',
              fontSize: '14px',
              cursor: 'pointer',
              transition: 'var(--transition-smooth)',
              display: 'flex',
              alignItems: 'center',
              gap: '6px'
            }}
          >
            {m.icon}
            {m.name}
          </button>
        ))}
      </div>

      {/* Messages */}
      <div style={{
        flex: 1,
        overflow: 'auto',
        padding: '20px',
        display: 'flex',
        flexDirection: 'column',
        gap: '16px'
      }}>
        {messages.map((msg, idx) => (
          <div
            key={idx}
            style={{
              display: 'flex',
              flexDirection: 'column',
              gap: '8px',
              alignItems: msg.role === 'user' ? 'flex-end' : 'flex-start'
            }}
          >
            <div style={{
              maxWidth: '80%',
              padding: '12px 16px',
              background: msg.role === 'user'
                ? 'var(--accent-bg)'
                : 'var(--glass-bg)',
              border: `1px solid ${msg.role === 'user'
                ? 'var(--accent)'
                : 'var(--glass-border)'}`,
              borderRadius: '12px',
              color: 'var(--text-primary)',
              fontSize: '14px',
              lineHeight: 1.6,
              whiteSpace: 'pre-wrap'
            }}>
              {msg.content}
            </div>
            <div style={{
              fontSize: '12px',
              color: 'var(--text-secondary)',
              opacity: 0.6
            }}>
              {msg.timestamp.toLocaleTimeString()}
            </div>
          </div>
        ))}
        {isLoading && (
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            color: 'var(--text-secondary)'
          }}>
            <div className="spinner" style={{
              width: '16px',
              height: '16px',
              border: '2px solid var(--glass-border)',
              borderTop: '2px solid var(--accent)',
              borderRadius: '50%',
              animation: 'spin 1s linear infinite'
            }} />
            <span style={{ fontSize: '14px' }}>正在思考...</span>
          </div>
        )}
      </div>

      {/* Input */}
      <form
        onSubmit={handleSubmit}
        style={{
          padding: '16px 20px',
          borderTop: '1px solid var(--window-border)',
          display: 'flex',
          gap: '12px'
        }}
      >
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder={`在${modes.find(m => m.id === mode)?.name}模式下提问...`}
          disabled={isLoading}
          style={{
            flex: 1,
            padding: '12px 16px',
            background: 'var(--glass-bg)',
            border: '1px solid var(--glass-border)',
            borderRadius: '10px',
            color: 'var(--text-primary)',
            fontSize: '14px',
            outline: 'none',
            transition: 'var(--transition-smooth)'
          }}
          onFocus={(e) => {
            e.target.style.borderColor = 'var(--accent)'
            e.target.style.boxShadow = 'var(--glow-accent)'
          }}
          onBlur={(e) => {
            e.target.style.borderColor = 'var(--glass-border)'
            e.target.style.boxShadow = 'none'
          }}
        />
        <button
          type="submit"
          disabled={isLoading || !input.trim()}
          style={{
            padding: '12px 20px',
            background: 'var(--accent-bg)',
            border: '1px solid var(--accent)',
            borderRadius: '10px',
            color: 'var(--accent)',
            fontSize: '14px',
            cursor: isLoading || !input.trim() ? 'not-allowed' : 'pointer',
            opacity: isLoading || !input.trim() ? 0.5 : 1,
            transition: 'var(--transition-smooth)',
            display: 'flex',
            alignItems: 'center',
            gap: '6px'
          }}
        >
          <ZapIcon />
          发送
        </button>
      </form>

      <style>{`
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  )
}

export default AIAssistantUltra