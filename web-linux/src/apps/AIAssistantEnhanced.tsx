import { useState, useCallback, memo, useRef } from 'react'
import type { ReactNode } from 'react'
import { useStore } from '../store'
import { SparklesIcon, CodeIcon, FileTextIcon, LanguagesIcon, CalculatorIcon, BookIcon } from '../icons'
import { Lightbulb } from 'lucide-react'

// AI智能助手增强版 - 集成多种AI功能
type AIMode = 'chat' | 'code' | 'translate' | 'summarize' | 'math' | 'creative' | 'learn'

const AIAssistantEnhanced = memo(function AIAssistantEnhanced() {
  const [activeMode, setActiveMode] = useState<AIMode>('chat')
  const [input, setInput] = useState('')
  const [output, setOutput] = useState('')
  const [history, setHistory] = useState<{role: 'user' | 'assistant'; content: string}[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const addNotification = useStore(s => s.addNotification)
  const outputRef = useRef<HTMLDivElement>(null)

  // 模式配置
  const modes: { id: AIMode; label: string; icon: ReactNode; description: string }[] = [
    { id: 'chat', label: '对话', icon: <SparklesIcon size={16} />, description: '智能对话问答' },
    { id: 'code', label: '代码', icon: <CodeIcon size={16} />, description: '代码解释/生成/优化' },
    { id: 'translate', label: '翻译', icon: <LanguagesIcon size={16} />, description: '多语言翻译' },
    { id: 'summarize', label: '摘要', icon: <FileTextIcon size={16} />, description: '文本摘要提取' },
    { id: 'math', label: '数学', icon: <CalculatorIcon size={16} />, description: '数学计算/公式解释' },
    { id: 'creative', label: '创意', icon: <Lightbulb size={16} />, description: '创意写作/头脑风暴' },
    { id: 'learn', label: '学习', icon: <BookIcon size={16} />, description: '知识问答/学习辅助' },
  ]

  // 模拟AI响应
  const generateResponse = useCallback(async () => {
    if (!input.trim()) {
      addNotification({ title: '请输入内容', message: '输入框不能为空', type: 'warning', duration: 2000 })
      return
    }

    setIsLoading(true)
    setHistory(prev => [...prev, { role: 'user', content: input }])

    await new Promise(resolve => setTimeout(resolve, 500 + Math.random() * 1000))

    let response = ''
    
    switch (activeMode) {
      case 'chat':
        response = generateChatResponse(input)
        break
      case 'code':
        response = generateCodeResponse(input)
        break
      case 'translate':
        response = generateTranslateResponse(input)
        break
      case 'summarize':
        response = generateSummarizeResponse(input)
        break
      case 'math':
        response = generateMathResponse(input)
        break
      case 'creative':
        response = generateCreativeResponse(input)
        break
      case 'learn':
        response = generateLearnResponse(input)
        break
    }

    setOutput(response)
    setHistory(prev => [...prev, { role: 'assistant', content: response }])
    setIsLoading(false)
    setInput('')
  }, [input, activeMode, addNotification])

  function generateChatResponse(query: string): string {
    const responses = [
      '关于"' + query + '"，这是一个很好的问题。让我来详细分析一下...\n\n从多个角度来看，这个问题涉及到几个关键方面。首先，我们需要考虑基础概念的理解。其次，实际应用场景也是非常重要的考量因素。\n\n建议您可以从以下几个方面深入了解：\n1. 基础理论知识\n2. 实践应用案例\n3. 相关工具和资源',
      '我理解您想了解"' + query + '"相关的内容。这是一个值得深入探讨的话题。\n\n根据我的分析，这个领域有几个重要的趋势和发展方向。您可能对以下内容感兴趣：\n- 核心概念和原理\n- 最佳实践方法\n- 常见问题和解决方案',
      '"' + query + '"是一个很有深度的话题。\n\n从专业角度来看，我建议您关注以下几个要点：\n\n1. **基础理解**: 先掌握核心概念\n2. **实践应用**: 通过实际案例加深理解\n3. **持续学习**: 关注最新发展和趋势\n\n有什么具体方面您想深入了解吗？',
    ]
    return responses[Math.floor(Math.random() * responses.length)]
  }

  function generateCodeResponse(query: string): string {
    if (query.toLowerCase().includes('解释') || query.toLowerCase().includes('explain')) {
      return '**代码分析**\n\n这段代码的主要功能是...\n\n---代码块---\n// 代码示例\nfunction example() {\n  // 实现逻辑\n  return result;\n}\n---代码块结束---\n\n**关键点说明**:\n1. 输入处理逻辑\n2. 核心算法实现\n3. 输出格式化\n\n**优化建议**:\n- 可以添加错误处理\n- 考虑性能优化\n- 增加单元测试'
    }
    if (query.toLowerCase().includes('生成') || query.toLowerCase().includes('generate')) {
      return '**代码生成结果**\n\n根据您的需求，这里是一个实现方案：\n\n---代码块---\n// 生成的代码\nfunction solution(input: string): Result {\n  // 步骤1: 数据预处理\n  const processed = preprocess(input);\n  // 步骤2: 核心逻辑\n  const result = calculate(processed);\n  // 步骤3: 结果返回\n  return formatOutput(result);\n}\n---代码块结束---\n\n**使用说明**:\n- 输入参数类型\n- 返回值结构\n- 异常处理方式'
    }
    return '**代码助手**\n\n我可以帮助您：\n\n1. **代码解释**: 分析代码逻辑和功能\n2. **代码生成**: 根据需求生成代码\n3. **代码优化**: 提出改进建议\n4. **Bug修复**: 定位和解决问题\n5. **代码审查**: 检查代码质量\n\n请告诉我您需要什么帮助？'
  }

  function generateTranslateResponse(text: string): string {
    const isChinese = /[\u4e00-\u9fa5]/.test(text)
    if (isChinese) {
      return '**翻译结果 (中文 → 英文)**\n\n' + text + '\n\n---\n\n**English Translation**:\n\n[模拟翻译结果]\n\nThe provided Chinese text has been translated to English above.\n\n**备注**: 实际翻译需要接入专业翻译API'
    } else {
      return '**翻译结果 (英文 → 中文)**\n\n' + text + '\n\n---\n\n**中文翻译**:\n\n[模拟翻译结果]\n\n上述英文文本已翻译为中文。\n\n**备注**: 实际翻译需要接入专业翻译API'
    }
  }

  function generateSummarizeResponse(text: string): string {
    return '**文本摘要**\n\n原文长度: ' + text.length + ' 字符\n\n**核心要点**:\n\n1. **主要观点**: 文本的核心论述\n2. **关键信息**: 重要数据和事实\n3. **结论建议**: 最终结论或建议\n\n**摘要内容**:\n\n[根据原文生成的精简摘要]\n\n**关键词提取**: 关键词1, 关键词2, 关键词3\n\n---\n\n*提示: 实际摘要功能需要接入NLP服务*'
  }

  function generateMathResponse(query: string): string {
    try {
      if (/^[\d\s+\-*/.()]+$/.test(query)) {
        // eslint-disable-next-line no-eval
        const result = eval(query)
        return '**计算结果**\n\n表达式: ' + query + '\n\n结果: **' + result + '**\n\n---\n\n**计算步骤**:\n1. 解析表达式\n2. 按运算优先级计算\n3. 得出最终结果'
      }
    } catch {
      // 继续其他处理
    }

    return '**数学助手**\n\n我可以帮助您：\n\n1. **表达式计算**: 直接计算数学表达式\n2. **公式解释**: 解释数学公式的含义\n3. **概念讲解**: 讲解数学概念\n4. **解题步骤**: 提供解题思路\n5. **图形分析**: 分析几何问题\n\n**示例**:\n- 输入 2+3*4 直接计算\n- 输入 解释勾股定理 获取概念解释\n- 输入 解方程 x^2-5x+6=0 获取解题步骤'
  }

  function generateCreativeResponse(query: string): string {
    return '**创意助手**\n\n根据您的需求 "' + query + '"，这里是一些创意建议：\n\n**创意方向**:\n\n1. **方案A**: 创新角度一\n   - 特点描述\n   - 适用场景\n\n2. **方案B**: 创新角度二\n   - 特点描述\n   - 适用场景\n\n3. **方案C**: 创新角度三\n   - 特点描述\n   - 适用场景\n\n**灵感提示**:\n- 可以尝试结合不同元素\n- 考虑用户体验优化\n- 关注独特性和差异化\n\n---\n\n*需要更具体的创意？请提供更多上下文信息*'
  }

  function generateLearnResponse(query: string): string {
    return '**学习助手**\n\n关于 "' + query + '" 的学习资源：\n\n**基础知识**:\n\n1. **概念定义**: 核心概念解释\n2. **历史背景**: 发展历程概述\n3. **应用领域**: 实际应用场景\n\n**学习路径**:\n\n- **入门阶段**: 基础概念学习\n- **进阶阶段**: 深入原理理解\n- **实践阶段**: 项目实战应用\n\n**推荐资源**:\n\n1. 教程和文档\n2. 实践项目\n3. 社区和论坛\n\n---\n\n*有具体问题？继续提问获取更详细的解答*'
  }

  const clearHistory = useCallback(() => {
    setHistory([])
    setOutput('')
    addNotification({ title: '已清空', message: '对话历史已清空', type: 'info', duration: 1500 })
  }, [addNotification])

  const copyOutput = useCallback(async () => {
    if (output) {
      await navigator.clipboard.writeText(output)
      addNotification({ title: '已复制', message: '输出内容已复制', type: 'success', duration: 1500 })
    }
  }, [output, addNotification])

  const containerStyle: React.CSSProperties = {
    height: '100%',
    display: 'flex',
    flexDirection: 'column',
    background: 'var(--window-bg)',
    color: 'var(--text-primary)',
    fontFamily: 'system-ui, -apple-system, sans-serif'
  }

  const modeButtonStyle = (active: boolean): React.CSSProperties => ({
    display: 'flex',
    alignItems: 'center',
    gap: '6px',
    padding: '8px 12px',
    background: active ? 'var(--accent)' : 'var(--card-bg)',
    color: active ? '#fff' : 'var(--text-secondary)',
    border: 'none',
    borderRadius: '6px',
    cursor: 'pointer',
    fontSize: '12px',
    fontWeight: active ? 600 : 400,
    transition: 'all 0.2s',
    flex: 1,
    justifyContent: 'center'
  })

  const inputStyle: React.CSSProperties = {
    width: '100%',
    padding: '12px',
    background: 'var(--input-bg)',
    border: '1px solid var(--window-border)',
    borderRadius: '8px',
    color: 'var(--text-primary)',
    fontSize: '14px',
    resize: 'none',
    minHeight: '60px',
    maxHeight: '200px'
  }

  const messageStyle = (isUser: boolean): React.CSSProperties => ({
    padding: '12px 16px',
    borderRadius: '12px',
    background: isUser ? 'var(--accent)' : 'var(--card-bg)',
    color: isUser ? '#fff' : 'var(--text-primary)',
    maxWidth: '80%',
    alignSelf: isUser ? 'flex-end' : 'flex-start',
    fontSize: '14px',
    lineHeight: 1.6,
    whiteSpace: 'pre-wrap'
  })

  return (
    <div style={containerStyle}>
      <div style={{ padding: '12px', borderBottom: '1px solid var(--window-border)' }}>
        <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
          {modes.map(mode => (
            <button
              key={mode.id}
              style={modeButtonStyle(activeMode === mode.id)}
              onClick={() => setActiveMode(mode.id)}
              title={mode.description}
            >
              {mode.icon}
              <span>{mode.label}</span>
            </button>
          ))}
        </div>
        <div style={{ marginTop: '8px', fontSize: '12px', color: 'var(--text-secondary)', textAlign: 'center' }}>
          {modes.find(m => m.id === activeMode)?.description}
        </div>
      </div>

      <div 
        ref={outputRef}
        style={{ 
          flex: 1, 
          padding: '16px', 
          overflow: 'auto',
          display: 'flex',
          flexDirection: 'column',
          gap: '12px'
        }}
      >
        {history.length === 0 && (
          <div style={{ textAlign: 'center', color: 'var(--text-secondary)', padding: '40px 20px' }}>
            <SparklesIcon size={48} style={{ opacity: 0.3, marginBottom: '16px' }} />
            <div style={{ fontSize: '16px', marginBottom: '8px' }}>AI智能助手</div>
            <div style={{ fontSize: '13px' }}>选择模式后输入内容开始对话</div>
          </div>
        )}
        
        {history.map((msg, i) => (
          <div key={i} style={messageStyle(msg.role === 'user')}>
            {msg.content}
          </div>
        ))}
        
        {isLoading && (
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '12px', color: 'var(--text-secondary)' }}>
            <div style={{ 
              width: '16px', 
              height: '16px', 
              border: '2px solid var(--window-border)',
              borderTopColor: 'var(--accent)',
              borderRadius: '50%',
              animation: 'spin 1s linear infinite'
            }} />
            <span style={{ fontSize: '13px' }}>正在思考...</span>
          </div>
        )}
      </div>

      <div style={{ padding: '12px', borderTop: '1px solid var(--window-border)', background: 'var(--card-bg)' }}>
        <textarea
          style={inputStyle}
          placeholder={'输入内容 (' + (modes.find(m => m.id === activeMode)?.label) + '模式)...'}
          value={input}
          onChange={e => setInput(e.target.value)}
          onKeyDown={e => {
            if (e.key === 'Enter' && !e.shiftKey) {
              e.preventDefault()
              generateResponse()
            }
          }}
        />
        <div style={{ display: 'flex', gap: '8px', marginTop: '8px' }}>
          <button
            style={{
              flex: 1,
              padding: '10px',
              background: 'var(--accent)',
              color: '#fff',
              border: 'none',
              borderRadius: '8px',
              cursor: 'pointer',
              fontSize: '14px',
              fontWeight: 500,
              opacity: isLoading ? 0.6 : 1
            }}
            onClick={generateResponse}
            disabled={isLoading}
          >
            {isLoading ? '处理中...' : '发送'}
          </button>
          {history.length > 0 && (
            <button
              style={{
                padding: '10px 16px',
                background: 'var(--text-secondary)',
                color: '#fff',
                border: 'none',
                borderRadius: '8px',
                cursor: 'pointer',
                fontSize: '14px'
              }}
              onClick={clearHistory}
            >
              清空
            </button>
          )}
          {output && (
            <button
              style={{
                padding: '10px 16px',
                background: 'var(--card-bg)',
                color: 'var(--text-primary)',
                border: '1px solid var(--window-border)',
                borderRadius: '8px',
                cursor: 'pointer',
                fontSize: '14px'
              }}
              onClick={copyOutput}
            >
              复制
            </button>
          )}
        </div>
        <div style={{ marginTop: '8px', fontSize: '11px', color: 'var(--text-secondary)', textAlign: 'center' }}>
          提示: 按 Enter 发送，Shift+Enter 换行 | 当前为模拟响应
        </div>
      </div>
    </div>
  )
})

export default AIAssistantEnhanced