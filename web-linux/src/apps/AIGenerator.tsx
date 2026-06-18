import { useState, useCallback, useRef, useEffect } from 'react'

interface AIGeneratorState {
  prompt: string
  response: string
  isGenerating: boolean
  history: Array<{ prompt: string; response: string; timestamp: number }>
  selectedModel: string
}

const models = [
  { id: 'text', name: '文本生成', description: '生成文章、故事、代码等' },
  { id: 'code', name: '代码生成', description: '生成、解释、调试代码' },
  { id: 'translate', name: '翻译助手', description: '多语言翻译' },
  { id: 'summarize', name: '文本摘要', description: '总结长篇内容' }
]

const sampleResponses: Record<string, Record<string, string>> = {
  text: {
    'hello': '你好！很高兴见到你。我是WebLinuxOS的AI助手。我可以帮你写作、编码、翻译，或者回答问题。有什么我可以帮你的吗？',
    'write a story': `在一个遥远的未来，有一个运行在浏览器中的操作系统...

## 第一章：起源

WebLinuxOS诞生于一个简单的想法：为什么桌面环境不能像网页一样轻量且可访问？

开发者们日夜工作，最终创造了一个奇迹——一个完全在浏览器中运行的完整操作系统，拥有90多个应用程序，从文本编辑器到代码工具，应有尽有。

这个系统改变了人们对计算的认知...`,
    'default': '这是一个示例AI响应。在实际部署中，这里会连接到真实的AI服务。\n\nWebLinuxOS提供了丰富的功能，包括：\n• 完整的桌面环境\n• 90+内置应用\n• 虚拟文件系统\n• 终端模拟器\n• 代码编辑器\n• 以及更多...'
  },
  code: {
    'hello': '你好！我可以帮你编写、解释和调试代码。\n\n```javascript\nconsole.log("Hello, WebLinuxOS!");\n```',
    'javascript function': `当然！这里是一个JavaScript函数示例：

\`\`\`javascript
// 计算阶乘的函数
function factorial(n) {
  if (n === 0 || n === 1) {
    return 1;
  }
  return n * factorial(n - 1);
}

// 使用示例
console.log(factorial(5)); // 输出: 120
\`\`\`

这个函数使用递归来计算阶乘，是编程中的经典示例。`,
    'default': `\`\`\`typescript
// 示例代码 - WebLinuxOS风格
interface App {
  id: string;
  name: string;
  icon: string;
  component: React.ComponentType;
}

const createApp = (app: App): App => {
  return {
    ...app,
    id: app.id.toLowerCase().replace(/[ \t\n\r\f\v]+/g, '-')
  };
};

export default createApp;
\`\`\`

这是一个TypeScript代码示例，展示了如何创建类型安全的应用定义。`
  },
  translate: {
    'hello': '你好！我可以帮你翻译文本。支持多种语言之间的互译。',
    'hello world': '"Hello World" 的翻译：\n• 中文：你好，世界\n• 法语：Bonjour le monde\n• 德语：Hallo Welt\n• 西班牙语：Hola mundo\n• 日语：こんにちは世界\n• 韩语：안녕하세요 세계',
    'default': '翻译示例：\n\n英文：Welcome to WebLinuxOS\n中文：欢迎来到 WebLinuxOS\n日语：WebLinuxOS へようこそ\n法语：Bienvenue sur WebLinuxOS'
  },
  summarize: {
    'hello': '你好！我可以帮你总结长文本。请粘贴你想要总结的内容。',
    'default': '文本摘要示例：\n\n原文：这是一段很长的内容，包含了很多信息...\n\n摘要：这段内容的核心要点是...'
  }
}

const generateResponse = (prompt: string, model: string): string => {
  const lowerPrompt = prompt.toLowerCase().trim()
  const modelResponses = sampleResponses[model] || sampleResponses.text
  
  for (const [key, response] of Object.entries(modelResponses)) {
    if (key !== 'default' && lowerPrompt.includes(key)) {
      return response
    }
  }
  
  return modelResponses.default
}

export default function AIGenerator() {
  const [state, setState] = useState<AIGeneratorState>({
    prompt: '',
    response: '',
    isGenerating: false,
    history: [],
    selectedModel: 'text'
  })
  
  const responseRef = useRef<HTMLDivElement>(null)
  
  useEffect(() => {
    if (responseRef.current) {
      responseRef.current.scrollTop = responseRef.current.scrollHeight
    }
  }, [state.response])
  
  const handleGenerate = useCallback(() => {
    if (!state.prompt.trim() || state.isGenerating) return
    
    const promptValue = state.prompt
    const modelValue = state.selectedModel
    
    setState(s => ({ ...s, isGenerating: true, response: '' }))
    
    let currentResponse = ''
    const fullResponse = generateResponse(promptValue, modelValue)
    const chars = fullResponse.split('')
    let index = 0
    
    const interval = setInterval(() => {
      if (index < chars.length) {
        currentResponse += chars[index]
        setState(s => ({ ...s, response: currentResponse }))
        index++
      } else {
        clearInterval(interval)
        setState(s => ({
          ...s,
          isGenerating: false,
          history: [...s.history, {
            prompt: s.prompt,
            response: fullResponse,
            timestamp: Date.now()
          }].slice(-20)
        }))
      }
    }, 20)
  }, [state.prompt, state.isGenerating, state.selectedModel])
  
  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if ((e.metaKey || e.ctrlKey) && e.key === 'Enter') {
      e.preventDefault()
      handleGenerate()
    }
  }, [handleGenerate])
  
  const handleClear = useCallback(() => {
    setState(s => ({ ...s, prompt: '', response: '' }))
  }, [])
  
  const handleCopyResponse = useCallback(() => {
    navigator.clipboard.writeText(state.response)
  }, [state.response])
  
  const handleLoadHistory = useCallback((item: typeof state.history[0]) => {
    setState(s => ({ ...s, prompt: item.prompt, response: item.response }))
  }, [setState])
  
  const formatTimestamp = (ts: number) => {
    return new Date(ts).toLocaleTimeString('zh-CN', {
      hour: '2-digit',
      minute: '2-digit'
    })
  }
  
  return (
    <div className="app-container" style={{
      height: '100%',
      display: 'flex',
      flexDirection: 'column',
      background: 'linear-gradient(135deg, #1e1e2e 0%, #2d2d44 100%)',
      color: '#e0e0e0'
    }}>
      <div style={{
        padding: '16px',
        borderBottom: '1px solid rgba(255,255,255,0.1)',
        background: 'rgba(0,0,0,0.2)'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '12px' }}>
          <span style={{ fontSize: '24px' }}>🤖</span>
          <div>
            <h2 style={{ margin: 0, fontSize: '18px', fontWeight: 600 }}>AI 文本生成器</h2>
            <p style={{ margin: '4px 0 0 0', fontSize: '12px', color: '#888' }}>
              智能创作、代码生成、翻译、摘要
            </p>
          </div>
        </div>
        
        <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
          {models.map(model => (
            <button
              key={model.id}
              onClick={() => setState(s => ({ ...s, selectedModel: model.id }))}
              style={{
                padding: '8px 16px',
                borderRadius: '8px',
                border: state.selectedModel === model.id 
                  ? '2px solid #8b7cf0' 
                  : '1px solid rgba(255,255,255,0.15)',
                background: state.selectedModel === model.id 
                  ? 'rgba(139,124,240,0.2)' 
                  : 'rgba(255,255,255,0.05)',
                color: '#fff',
                cursor: 'pointer',
                fontSize: '13px',
                transition: 'all 0.2s ease'
              }}
              title={model.description}
            >
              {model.name}
            </button>
          ))}
        </div>
      </div>
      
      <div style={{
        flex: 1,
        display: 'flex',
        overflow: 'hidden'
      }}>
        <div style={{
          width: '200px',
          borderRight: '1px solid rgba(255,255,255,0.1)',
          background: 'rgba(0,0,0,0.15)',
          overflowY: 'auto',
          padding: '12px'
        }}>
          <h3 style={{
            margin: '0 0 12px 0',
            fontSize: '13px',
            color: '#888',
            fontWeight: 500,
            textTransform: 'uppercase',
            letterSpacing: '0.5px'
          }}>
            历史记录
          </h3>
          
          {state.history.length === 0 ? (
            <div style={{
              textAlign: 'center',
              padding: '24px 12px',
              color: '#666',
              fontSize: '13px'
            }}>
              <div style={{ fontSize: '32px', marginBottom: '8px' }}>📝</div>
              暂无历史记录
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {state.history.slice().reverse().map((item, i) => (
                <button
                  key={i}
                  onClick={() => handleLoadHistory(item)}
                  style={{
                    width: '100%',
                    textAlign: 'left',
                    padding: '10px',
                    borderRadius: '8px',
                    border: 'none',
                    background: 'rgba(255,255,255,0.03)',
                    color: '#ccc',
                    cursor: 'pointer',
                    fontSize: '12px',
                    transition: 'background 0.2s ease'
                  }}
                >
                  <div style={{
                    whiteSpace: 'nowrap',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    marginBottom: '4px'
                  }}>
                    {item.prompt}
                  </div>
                  <div style={{ color: '#666', fontSize: '11px' }}>
                    {formatTimestamp(item.timestamp)}
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>
        
        <div style={{
          flex: 1,
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden'
        }}>
          <div style={{
            flex: 1,
            overflowY: 'auto',
            padding: '20px',
            background: 'linear-gradient(180deg, rgba(0,0,0,0.1) 0%, transparent 50px)'
          }} ref={responseRef}>
            {state.response ? (
              <div style={{
                background: 'rgba(255,255,255,0.03)',
                padding: '20px',
                borderRadius: '12px',
                border: '1px solid rgba(255,255,255,0.08)',
                lineHeight: '1.7',
                whiteSpace: 'pre-wrap',
                fontFamily: 'system-ui, -apple-system, sans-serif'
              }}>
                {state.response}
              </div>
            ) : (
              <div style={{
                textAlign: 'center',
                padding: '60px 20px',
                color: '#666'
              }}>
                <div style={{ fontSize: '64px', marginBottom: '16px', opacity: 0.5 }}>
                  ✨
                </div>
                <p style={{ fontSize: '16px', marginBottom: '8px' }}>
                  开始使用 AI 生成器
                </p>
                <p style={{ fontSize: '13px', color: '#555' }}>
                  选择一个模式，输入提示词，然后按生成
                </p>
              </div>
            )}
          </div>
          
          {state.response && (
            <div style={{
              padding: '8px 20px',
              borderTop: '1px solid rgba(255,255,255,0.08)',
              display: 'flex',
              justifyContent: 'flex-end',
              gap: '8px'
            }}>
              <button
                onClick={handleCopyResponse}
                style={{
                  padding: '6px 12px',
                  borderRadius: '6px',
                  border: '1px solid rgba(255,255,255,0.15)',
                  background: 'rgba(255,255,255,0.05)',
                  color: '#ddd',
                  cursor: 'pointer',
                  fontSize: '12px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px'
                }}
              >
                📋 复制
              </button>
            </div>
          )}
          
          <div style={{
            padding: '16px 20px 20px',
            background: 'rgba(0,0,0,0.2)',
            borderTop: '1px solid rgba(255,255,255,0.08)'
          }}>
            <div style={{
              display: 'flex',
              gap: '12px',
              alignItems: 'flex-end'
            }}>
              <div style={{ flex: 1 }}>
                <textarea
                  value={state.prompt}
                  onChange={(e) => setState(s => ({ ...s, prompt: e.target.value }))}
                  onKeyDown={handleKeyDown}
                  placeholder={`输入你的${models.find(m => m.id === state.selectedModel)?.name || '提示词'}... (Ctrl+Enter 生成)`}
                  style={{
                    width: '100%',
                    padding: '14px 16px',
                    borderRadius: '12px',
                    border: '1px solid rgba(255,255,255,0.15)',
                    background: 'rgba(255,255,255,0.05)',
                    color: '#fff',
                    fontSize: '14px',
                    resize: 'none',
                    minHeight: '80px',
                    fontFamily: 'system-ui, -apple-system, sans-serif',
                    outline: 'none'
                  }}
                />
                <div style={{
                  marginTop: '6px',
                  fontSize: '11px',
                  color: '#555',
                  textAlign: 'right'
                }}>
                  {state.prompt.length} 字符
                </div>
              </div>
              
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                <button
                  onClick={handleGenerate}
                  disabled={state.isGenerating || !state.prompt.trim()}
                  style={{
                    padding: '12px 24px',
                    borderRadius: '10px',
                    border: 'none',
                    background: 'linear-gradient(135deg, #8b7cf0 0%, #6c5ce7 100%)',
                    color: '#fff',
                    cursor: state.isGenerating || !state.prompt.trim() ? 'not-allowed' : 'pointer',
                    fontSize: '14px',
                    fontWeight: 500,
                    minWidth: '100px',
                    opacity: state.isGenerating || !state.prompt.trim() ? 0.6 : 1,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '8px'
                  }}
                >
                  {state.isGenerating ? (
                    <>
                      <span style={{ animation: 'spin 1s linear infinite' }}>⚙️</span>
                      生成中...
                    </>
                  ) : (
                    <>
                      <span>✨</span>
                      生成
                    </>
                  )}
                </button>
                
                <button
                  onClick={handleClear}
                  style={{
                    padding: '8px 16px',
                    borderRadius: '8px',
                    border: '1px solid rgba(255,255,255,0.15)',
                    background: 'rgba(255,255,255,0.03)',
                    color: '#aaa',
                    cursor: 'pointer',
                    fontSize: '12px'
                  }}
                >
                  清空
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
      
      <style>{`
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  )
}
