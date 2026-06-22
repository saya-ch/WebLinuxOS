import { useState, useCallback, memo, useEffect, useRef } from 'react'
import { useStore } from '../store'
import { SparklesIcon, CodeIcon, FileTextIcon, LanguagesIcon, CalculatorIcon, SearchIcon, LightbulbIcon, BookOpenIcon } from '../icons'

// AI智能中心 - 集成多种AI能力的统一入口
interface AIProvider {
  id: string
  name: string
  description: string
  icon: React.ReactNode
  capabilities: string[]
  endpoint?: string
  free: boolean
}

const AI_PROVIDERS: AIProvider[] = [
  {
    id: 'code-assistant',
    name: '代码助手',
    description: '代码解释、优化、调试、生成',
    icon: <CodeIcon />,
    capabilities: ['代码解释', '代码优化', 'Bug修复', '代码生成', '代码审查'],
    free: true
  },
  {
    id: 'text-assistant',
    name: '文本助手',
    description: '文本写作、润色、翻译、总结',
    icon: <FileTextIcon />,
    capabilities: ['文本生成', '文本润色', '文本翻译', '内容总结', '风格转换'],
    free: true
  },
  {
    id: 'translator',
    name: '智能翻译',
    description: '多语言实时翻译',
    icon: <LanguagesIcon />,
    capabilities: ['中英翻译', '多语言支持', '专业术语', '实时翻译'],
    free: true
  },
  {
    id: 'math-solver',
    name: '数学求解',
    description: '数学公式计算与解释',
    icon: <CalculatorIcon />,
    capabilities: ['公式计算', '方程求解', '数学解释', '图形绘制'],
    free: true
  },
  {
    id: 'knowledge-search',
    name: '知识搜索',
    description: '智能知识问答',
    icon: <SearchIcon />,
    capabilities: ['百科问答', '知识检索', '概念解释', '事实核查'],
    free: true
  },
  {
    id: 'idea-generator',
    name: '创意生成',
    description: '创意想法与灵感激发',
    icon: <LightbulbIcon />,
    capabilities: ['创意生成', '灵感激发', '头脑风暴', '方案设计'],
    free: true
  },
  {
    id: 'learning-assistant',
    name: '学习助手',
    description: '个性化学习辅导',
    icon: <BookOpenIcon />,
    capabilities: ['知识点讲解', '习题解答', '学习计划', '复习建议'],
    free: true
  }
]

// 模拟AI响应（实际项目中可接入真实AI API）
function simulateAIResponse(provider: string, input: string): string {
  const responses: Record<string, (input: string) => string> = {
    'code-assistant': (input) => {
      if (input.includes('解释') || input.includes('explain')) {
        return `代码分析结果：

这段代码的主要功能是：
1. 数据处理与转换
2. 状态管理与更新
3. 用户交互响应

关键点：
- 使用了React Hooks进行状态管理
- 实现了组件的生命周期管理
- 包含错误处理机制

优化建议：
- 可以添加类型检查增强安全性
- 考虑使用useCallback优化性能
- 建议添加单元测试覆盖`
      }
      if (input.includes('优化') || input.includes('optimize')) {
        return `优化建议：

性能优化：
1. 使用React.memo避免不必要的重渲染
2. 使用useCallback缓存回调函数
3. 虚拟化长列表提升渲染性能

代码质量：
1. 添加TypeScript类型定义
2. 使用ESLint规则检查
3. 添加单元测试覆盖

可读性：
1. 添加清晰的注释说明
2. 使用语义化的变量命名
3. 模块化拆分复杂逻辑`
      }
      return `我已收到您的代码相关请求。请提供具体的代码片段或详细描述您需要的功能，我将为您提供：

1. 代码解释与分析
2. 优化建议
3. Bug修复方案
4. 新代码生成
5. 代码审查报告

请详细描述您的需求，我将给出专业的回答。`
    },
    'text-assistant': (input) => {
      if (input.length > 50) {
        return `文本分析结果：

主要内容总结：
${input.slice(0, 100)}...

关键要点：
1. 主题明确，逻辑清晰
2. 语言表达流畅
3. 结构层次分明

润色建议：
- 开头可以更加引人入胜
- 中间段落可以增加过渡句
- 结尾可以强化总结

优化后的版本：
[此处显示润色后的文本]`
      }
      return `文本助手已就绪。我可以帮助您：

1. 生成各类文本内容
2. 润色和优化现有文本
3. 进行多语言翻译
4. 总结长文本要点
5. 转换文本风格

请提供您需要处理的文本内容。`
    },
    'translator': (input) => {
      return `翻译结果：

原文：${input}
译文：[Translation of "${input}"]

翻译说明：
- 保持原文语义完整性
- 适应目标语言表达习惯
- 专业术语准确对应

支持语言：
中文、英文、日文、韩文、法文、德文、西班牙文等`
    },
    'math-solver': (input) => {
      if (input.match(/[\d+\-*/^()]/)) {
        try {
          // 安全的数学表达式计算
          const sanitized = input.replace(/[^0-9+\-*/^().eE\s]/g, '')
          const result = Function(`"use strict"; return (${sanitized})`)()
          return `数学计算结果：

表达式：${input}
结果：${result}

计算步骤：
1. 解析表达式结构
2. 按运算优先级计算
3. 验证结果正确性

详细解释：
该表达式包含基本运算，按照数学运算规则进行计算得到上述结果。`
        } catch {
          return `无法解析该数学表达式。请确保：
1. 表达式格式正确
2. 使用标准数学符号
3. 括号匹配完整

支持的操作：
- 基本运算：+ - * /
- 幂运算：^ 或 **
- 科学计数法：e 或 E`
        }
      }
      return `数学求解助手已就绪。我可以帮助您：

1. 计算数学表达式
2. 解方程
3. 解释数学概念
4. 绘制函数图形
5. 提供学习建议

请输入您的数学问题或表达式。`
    },
    'knowledge-search': (input) => {
      return `知识检索结果：

查询：${input}

相关知识：
1. 基本概念定义
2. 历史发展脉络
3. 应用领域介绍
4. 相关概念关联

详细解释：
[此处显示详细的知识解释内容]

参考来源：
- 维基百科
- 学术文献
- 专业资料库`
    },
    'idea-generator': (input) => {
      return `创意生成结果：

基于您的输入"${input.slice(0, 30)}"，我为您生成以下创意：

创意方案一：
- 核心理念：创新突破
- 实现路径：技术驱动
- 预期效果：效率提升

创意方案二：
- 核心理念：用户导向
- 实现路径：体验优化
- 预期效果：满意度提升

创意方案三：
- 核心理念：可持续发展
- 实现路径：资源整合
- 预期效果：长期价值

建议选择最适合当前需求的方案进行深入开发。`
    },
    'learning-assistant': (input) => {
      return `学习辅导结果：

针对您的问题"${input.slice(0, 30)}"，提供以下学习建议：

知识点讲解：
1. 基础概念理解
2. 核心原理分析
3. 实际应用案例

学习方法：
1. 循序渐进学习
2. 理论结合实践
3. 定期复习巩固

推荐资源：
- 入门教程
- 进阶资料
- 实践项目

建议制定学习计划，按步骤系统学习。`
    }
  }
  
  return responses[provider]?.(input) || '我已收到您的请求，正在处理中...'
}

function AISmartHub() {
  const [selectedProvider, setSelectedProvider] = useState<string | null>(null)
  const [input, setInput] = useState('')
  const [output, setOutput] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [history, setHistory] = useState<Array<{ provider: string; input: string; output: string; timestamp: Date }>>([])
  const [favorites, setFavorites] = useState<Array<{ provider: string; input: string; output: string }>>([])
  const inputRef = useRef<HTMLTextAreaElement>(null)
  const addNotification = useStore((s) => s.addNotification)

  // 加载历史记录
  useEffect(() => {
    const savedHistory = localStorage.getItem('ai-smart-hub-history')
    if (savedHistory) {
      try {
        setHistory(JSON.parse(savedHistory).map((h: any) => ({
          ...h,
          timestamp: new Date(h.timestamp)
        })))
      } catch {}
    }
    const savedFavorites = localStorage.getItem('ai-smart-hub-favorites')
    if (savedFavorites) {
      try {
        setFavorites(JSON.parse(savedFavorites))
      } catch {}
    }
  }, [])

  // 保存历史记录
  useEffect(() => {
    if (history.length > 0) {
      localStorage.setItem('ai-smart-hub-history', JSON.stringify(history.slice(-50)))
    }
  }, [history])

  // 保存收藏
  useEffect(() => {
    if (favorites.length > 0) {
      localStorage.setItem('ai-smart-hub-favorites', JSON.stringify(favorites))
    }
  }, [favorites])

  const handleProcess = useCallback(() => {
    if (!selectedProvider || !input.trim()) {
      addNotification({
        title: '提示',
        message: '请选择AI助手并输入内容',
        type: 'warning',
        duration: 3000
      })
      return
    }

    setIsLoading(true)
    
    // 模拟AI处理延迟
    setTimeout(() => {
      const response = simulateAIResponse(selectedProvider, input)
      setOutput(response)
      setIsLoading(false)
      
      // 添加到历史记录
      setHistory(prev => [...prev, {
        provider: selectedProvider,
        input: input.trim(),
        output: response,
        timestamp: new Date()
      }])
      
      addNotification({
        title: '处理完成',
        message: 'AI助手已生成响应',
        type: 'success',
        duration: 2000
      })
    }, 500 + Math.random() * 1000)
  }, [selectedProvider, input, addNotification])

  const handleFavorite = useCallback(() => {
    if (!output) return
    
    setFavorites(prev => {
      const exists = prev.some(f => f.input === input && f.output === output)
      if (exists) {
        addNotification({
          title: '已取消收藏',
          message: '该结果已从收藏中移除',
          type: 'info',
          duration: 2000
        })
        return prev.filter(f => f.input !== input || f.output !== output)
      }
      addNotification({
        title: '已收藏',
        message: '结果已添加到收藏',
        type: 'success',
        duration: 2000
      })
      return [...prev, { provider: selectedProvider || '', input, output }]
    })
  }, [output, input, selectedProvider, addNotification])

  const handleCopy = useCallback(() => {
    if (!output) return
    navigator.clipboard.writeText(output)
    addNotification({
      title: '已复制',
      message: '结果已复制到剪贴板',
      type: 'success',
      duration: 2000
    })
  }, [output, addNotification])

  const handleClear = useCallback(() => {
    setInput('')
    setOutput('')
    if (inputRef.current) {
      inputRef.current.focus()
    }
  }, [])

  const handleHistoryClick = useCallback((item: typeof history[0]) => {
    setSelectedProvider(item.provider)
    setInput(item.input)
    setOutput(item.output)
  }, [])

  const handleFavoriteClick = useCallback((item: typeof favorites[0]) => {
    setSelectedProvider(item.provider)
    setInput(item.input)
    setOutput(item.output)
  }, [])

  const clearHistory = useCallback(() => {
    setHistory([])
    localStorage.removeItem('ai-smart-hub-history')
    addNotification({
      title: '已清空',
      message: '历史记录已清空',
      type: 'info',
      duration: 2000
    })
  }, [addNotification])

  const clearFavorites = useCallback(() => {
    setFavorites([])
    localStorage.removeItem('ai-smart-hub-favorites')
    addNotification({
      title: '已清空',
      message: '收藏已清空',
      type: 'info',
      duration: 2000
    })
  }, [addNotification])

  const currentProvider = AI_PROVIDERS.find(p => p.id === selectedProvider)

  return (
    <div className="ai-smart-hub" style={{
      display: 'flex',
      height: '100%',
      gap: '16px',
      padding: '16px',
      background: 'var(--bg-secondary)'
    }}>
      {/* 左侧：AI助手选择 */}
      <div style={{
        width: '280px',
        display: 'flex',
        flexDirection: 'column',
        gap: '12px',
        overflow: 'auto'
      }}>
        <div style={{
          padding: '12px',
          background: 'var(--bg-primary)',
          borderRadius: '8px',
          fontSize: '14px',
          fontWeight: 600,
          color: 'var(--text-primary)'
        }}>
          <SparklesIcon /> AI智能助手中心
        </div>
        
        <div style={{
          display: 'flex',
          flexDirection: 'column',
          gap: '8px'
        }}>
          {AI_PROVIDERS.map(provider => (
            <button
              key={provider.id}
              onClick={() => setSelectedProvider(provider.id)}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '12px',
                padding: '12px',
                background: selectedProvider === provider.id 
                  ? 'var(--accent-primary)' 
                  : 'var(--bg-primary)',
                borderRadius: '8px',
                border: 'none',
                cursor: 'pointer',
                transition: 'all 0.2s',
                color: selectedProvider === provider.id 
                  ? 'white' 
                  : 'var(--text-primary)'
              }}
            >
              <span style={{ fontSize: '18px' }}>{provider.icon}</span>
              <div style={{ flex: 1 }}>
                <div style={{ fontWeight: 500, fontSize: '13px' }}>{provider.name}</div>
                <div style={{ fontSize: '11px', opacity: 0.7 }}>{provider.description}</div>
              </div>
              {provider.free && (
                <span style={{
                  fontSize: '10px',
                  padding: '2px 6px',
                  background: selectedProvider === provider.id 
                    ? 'rgba(255,255,255,0.2)' 
                    : 'var(--accent-success)',
                  borderRadius: '4px',
                  color: selectedProvider === provider.id ? 'white' : 'var(--text-primary)'
                }}>
                  免费
                </span>
              )}
            </button>
          ))}
        </div>
        
        {/* 历史记录 */}
        {history.length > 0 && (
          <div style={{
            marginTop: '12px',
            padding: '12px',
            background: 'var(--bg-primary)',
            borderRadius: '8px'
          }}>
            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              marginBottom: '8px'
            }}>
              <span style={{ fontSize: '12px', fontWeight: 500 }}>历史记录</span>
              <button
                onClick={clearHistory}
                style={{
                  fontSize: '10px',
                  padding: '2px 8px',
                  background: 'var(--bg-secondary)',
                  border: 'none',
                  borderRadius: '4px',
                  cursor: 'pointer',
                  color: 'var(--text-secondary)'
                }}
              >
                清空
              </button>
            </div>
            <div style={{
              maxHeight: '200px',
              overflow: 'auto',
              display: 'flex',
              flexDirection: 'column',
              gap: '4px'
            }}>
              {history.slice(-10).reverse().map((item, idx) => (
                <button
                  key={idx}
                  onClick={() => handleHistoryClick(item)}
                  style={{
                    padding: '6px 8px',
                    background: 'var(--bg-secondary)',
                    borderRadius: '4px',
                    border: 'none',
                    cursor: 'pointer',
                    fontSize: '11px',
                    color: 'var(--text-secondary)',
                    textAlign: 'left',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    whiteSpace: 'nowrap'
                  }}
                >
                  {AI_PROVIDERS.find(p => p.id === item.provider)?.name}: {item.input.slice(0, 20)}...
                </button>
              ))}
            </div>
          </div>
        )}
        
        {/* 收藏 */}
        {favorites.length > 0 && (
          <div style={{
            marginTop: '12px',
            padding: '12px',
            background: 'var(--bg-primary)',
            borderRadius: '8px'
          }}>
            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              marginBottom: '8px'
            }}>
              <span style={{ fontSize: '12px', fontWeight: 500 }}>收藏</span>
              <button
                onClick={clearFavorites}
                style={{
                  fontSize: '10px',
                  padding: '2px 8px',
                  background: 'var(--bg-secondary)',
                  border: 'none',
                  borderRadius: '4px',
                  cursor: 'pointer',
                  color: 'var(--text-secondary)'
                }}
              >
                清空
              </button>
            </div>
            <div style={{
              maxHeight: '150px',
              overflow: 'auto',
              display: 'flex',
              flexDirection: 'column',
              gap: '4px'
            }}>
              {favorites.map((item, idx) => (
                <button
                  key={idx}
                  onClick={() => handleFavoriteClick(item)}
                  style={{
                    padding: '6px 8px',
                    background: 'var(--bg-secondary)',
                    borderRadius: '4px',
                    border: 'none',
                    cursor: 'pointer',
                    fontSize: '11px',
                    color: 'var(--text-secondary)',
                    textAlign: 'left',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    whiteSpace: 'nowrap'
                  }}
                >
                  {AI_PROVIDERS.find(p => p.id === item.provider)?.name}: {item.input.slice(0, 20)}...
                </button>
              ))}
            </div>
          </div>
        )}
      </div>
      
      {/* 中间：输入与输出 */}
      <div style={{
        flex: 1,
        display: 'flex',
        flexDirection: 'column',
        gap: '12px'
      }}>
        {/* 当前助手信息 */}
        {currentProvider && (
          <div style={{
            padding: '16px',
            background: 'var(--bg-primary)',
            borderRadius: '8px',
            display: 'flex',
            alignItems: 'center',
            gap: '12px'
          }}>
            <span style={{ fontSize: '24px' }}>{currentProvider.icon}</span>
            <div>
              <div style={{ fontWeight: 600, fontSize: '16px' }}>{currentProvider.name}</div>
              <div style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>
                {currentProvider.description}
              </div>
              <div style={{
                display: 'flex',
                gap: '8px',
                marginTop: '8px'
              }}>
                {currentProvider.capabilities.map(cap => (
                  <span key={cap} style={{
                    fontSize: '10px',
                    padding: '2px 8px',
                    background: 'var(--bg-secondary)',
                    borderRadius: '4px',
                    color: 'var(--text-secondary)'
                  }}>
                    {cap}
                  </span>
                ))}
              </div>
            </div>
          </div>
        )}
        
        {/* 输入区域 */}
        <div style={{
          flex: 1,
          display: 'flex',
          flexDirection: 'column',
          gap: '12px'
        }}>
          <div style={{
            padding: '12px',
            background: 'var(--bg-primary)',
            borderRadius: '8px',
            display: 'flex',
            flexDirection: 'column',
            gap: '8px'
          }}>
            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center'
            }}>
              <span style={{ fontSize: '12px', fontWeight: 500 }}>输入内容</span>
              <button
                onClick={handleClear}
                style={{
                  fontSize: '10px',
                  padding: '4px 12px',
                  background: 'var(--bg-secondary)',
                  border: 'none',
                  borderRadius: '4px',
                  cursor: 'pointer',
                  color: 'var(--text-secondary)'
                }}
              >
                清空
              </button>
            </div>
            <textarea
              ref={inputRef}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder={currentProvider 
                ? `请输入您需要${currentProvider.name}处理的内容...` 
                : '请先选择一个AI助手...'}
              style={{
                width: '100%',
                minHeight: '120px',
                padding: '12px',
                background: 'var(--bg-secondary)',
                border: '1px solid var(--border-color)',
                borderRadius: '6px',
                fontSize: '14px',
                color: 'var(--text-primary)',
                resize: 'vertical',
                fontFamily: 'inherit'
              }}
            />
            <div style={{
              display: 'flex',
              gap: '8px',
              justifyContent: 'flex-end'
            }}>
              <button
                onClick={handleProcess}
                disabled={!selectedProvider || !input.trim() || isLoading}
                style={{
                  padding: '8px 24px',
                  background: selectedProvider && input.trim() && !isLoading
                    ? 'var(--accent-primary)'
                    : 'var(--bg-secondary)',
                  border: 'none',
                  borderRadius: '6px',
                  cursor: selectedProvider && input.trim() && !isLoading ? 'pointer' : 'not-allowed',
                  fontSize: '14px',
                  fontWeight: 500,
                  color: selectedProvider && input.trim() && !isLoading
                    ? 'white'
                    : 'var(--text-secondary)',
                  transition: 'all 0.2s'
                }}
              >
                {isLoading ? '处理中...' : '开始处理'}
              </button>
            </div>
          </div>
          
          {/* 输出区域 */}
          <div style={{
            flex: 1,
            padding: '12px',
            background: 'var(--bg-primary)',
            borderRadius: '8px',
            display: 'flex',
            flexDirection: 'column',
            gap: '8px',
            minHeight: '200px'
          }}>
            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center'
            }}>
              <span style={{ fontSize: '12px', fontWeight: 500 }}>AI响应结果</span>
              <div style={{ display: 'flex', gap: '8px' }}>
                <button
                  onClick={handleFavorite}
                  disabled={!output}
                  style={{
                    fontSize: '10px',
                    padding: '4px 12px',
                    background: output ? 'var(--bg-secondary)' : 'var(--bg-secondary)',
                    border: 'none',
                    borderRadius: '4px',
                    cursor: output ? 'pointer' : 'not-allowed',
                    color: 'var(--text-secondary)',
                    opacity: output ? 1 : 0.5
                  }}
                >
                  {favorites.some(f => f.input === input && f.output === output) ? '取消收藏' : '收藏'}
                </button>
                <button
                  onClick={handleCopy}
                  disabled={!output}
                  style={{
                    fontSize: '10px',
                    padding: '4px 12px',
                    background: output ? 'var(--bg-secondary)' : 'var(--bg-secondary)',
                    border: 'none',
                    borderRadius: '4px',
                    cursor: output ? 'pointer' : 'not-allowed',
                    color: 'var(--text-secondary)',
                    opacity: output ? 1 : 0.5
                  }}
                >
                  复制
                </button>
              </div>
            </div>
            <div style={{
              flex: 1,
              padding: '12px',
              background: 'var(--bg-secondary)',
              borderRadius: '6px',
              overflow: 'auto',
              fontSize: '13px',
              lineHeight: '1.6',
              color: 'var(--text-primary)',
              whiteSpace: 'pre-wrap',
              fontFamily: 'inherit'
            }}>
              {isLoading ? (
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  height: '100%',
                  gap: '8px'
                }}>
                  <SparklesIcon />
                  <span>AI正在思考...</span>
                </div>
              ) : output ? (
                output
              ) : (
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  height: '100%',
                  color: 'var(--text-secondary)'
                }}>
                  {selectedProvider 
                    ? '等待输入内容...' 
                    : '请选择一个AI助手开始'}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default memo(AISmartHub)