import { useState, useCallback, useMemo } from 'react'
import { SparklesIcon, ZapIcon, TargetIcon, ClockIcon, TrendingUpIcon, LightbulbIcon, RefreshCwIcon, ArrowRightIcon, BookmarkIcon, BookmarkCheckIcon } from '../icons'

interface WorkflowSuggestion {
  id: string
  type: 'productivity' | 'focus' | 'automation' | 'optimization' | 'break'
  title: string
  description: string
  impact: 'high' | 'medium' | 'low'
  effort: 'easy' | 'medium' | 'hard'
  timeSavings: string
  actionable: boolean
  saved: boolean
}

interface DailyInsight {
  category: string
  value: string
  trend: 'up' | 'down' | 'stable'
  insight: string
}

const generateSuggestions = (): WorkflowSuggestion[] => {
  const suggestions: WorkflowSuggestion[] = [
    {
      id: '1',
      type: 'focus',
      title: '启用专注模式',
      description: '当前检测到多个应用窗口打开，建议开启专注模式以提高效率',
      impact: 'high',
      effort: 'easy',
      timeSavings: '30分钟/天',
      actionable: true,
      saved: false
    },
    {
      id: '2',
      type: 'automation',
      title: '自动化终端命令',
      description: '您经常使用的命令可以设置为快捷别名，节省重复输入时间',
      impact: 'medium',
      effort: 'easy',
      timeSavings: '15分钟/天',
      actionable: true,
      saved: false
    },
    {
      id: '3',
      type: 'productivity',
      title: '使用番茄工作法',
      description: '建议每25分钟专注工作后休息5分钟，保持高效状态',
      impact: 'high',
      effort: 'medium',
      timeSavings: '45分钟/天',
      actionable: true,
      saved: false
    },
    {
      id: '4',
      type: 'break',
      title: '安排休息时间',
      description: '您已连续工作超过2小时，建议休息10分钟保护眼睛',
      impact: 'high',
      effort: 'easy',
      timeSavings: '提升长期效率',
      actionable: true,
      saved: false
    },
    {
      id: '5',
      type: 'optimization',
      title: '整理桌面文件',
      description: '桌面文件较多，建议分类整理以提高查找效率',
      impact: 'medium',
      effort: 'medium',
      timeSavings: '10分钟/天',
      actionable: true,
      saved: false
    },
    {
      id: '6',
      type: 'automation',
      title: '设置自动备份',
      description: '重要文件建议启用自动备份功能，防止数据丢失',
      impact: 'high',
      effort: 'easy',
      timeSavings: '避免潜在损失',
      actionable: true,
      saved: false
    },
    {
      id: '7',
      type: 'productivity',
      title: '使用全局搜索',
      description: '按 Ctrl+K 快速搜索文件和应用，比手动查找更快',
      impact: 'medium',
      effort: 'easy',
      timeSavings: '5分钟/天',
      actionable: true,
      saved: false
    },
    {
      id: '8',
      type: 'focus',
      title: '关闭非必要通知',
      description: '减少通知干扰可以显著提升专注度',
      impact: 'high',
      effort: 'easy',
      timeSavings: '20分钟/天',
      actionable: true,
      saved: false
    }
  ]
  
  // 随机返回3-5条建议
  return suggestions.sort(() => Math.random() - 0.5).slice(0, 4)
}

export default function AIWorkflowAssistant() {
  const [suggestions, setSuggestions] = useState<WorkflowSuggestion[]>([])
  const [insights, setInsights] = useState<DailyInsight[]>([])
  const [isAnalyzing, setIsAnalyzing] = useState(false)
  const [analysisProgress, setAnalysisProgress] = useState(0)

  const runAnalysis = useCallback(async () => {
    setIsAnalyzing(true)
    setAnalysisProgress(0)
    
    // 模拟AI分析过程
    for (let i = 0; i <= 100; i += 10) {
      await new Promise(resolve => setTimeout(resolve, 100))
      setAnalysisProgress(i)
    }
    
    setSuggestions(generateSuggestions())
    setInsights([
      { category: '今日工作时长', value: '6.5小时', trend: 'up', insight: '比昨天增加了30分钟' },
      { category: '专注时间占比', value: '72%', trend: 'stable', insight: '保持良好状态' },
      { category: '任务完成率', value: '85%', trend: 'up', insight: '效率持续提升' },
      { category: '工具使用次数', value: '47次', trend: 'down', insight: '熟练度提升' }
    ])
    
    setIsAnalyzing(false)
  }, [])

  useMemo(() => {
    runAnalysis()
  }, [runAnalysis])

  const toggleSave = useCallback((id: string) => {
    setSuggestions(prev => prev.map(s => 
      s.id === id ? { ...s, saved: !s.saved } : s
    ))
  }, [])

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'focus': return <TargetIcon size={14} />
      case 'automation': return <ZapIcon size={14} />
      case 'productivity': return <TrendingUpIcon size={14} />
      case 'optimization': return <RefreshCwIcon size={14} />
      case 'break': return <ClockIcon size={14} />
      default: return <LightbulbIcon size={14} />
    }
  }

  const getImpactColor = (impact: string) => {
    switch (impact) {
      case 'high': return '#22c55e'
      case 'medium': return '#f59e0b'
      case 'low': return '#6b7280'
      default: return '#6b7280'
    }
  }

  return (
    <div style={{
      height: '100%',
      background: 'linear-gradient(135deg, #0c0a1d 0%, #1a1442 50%, #0f0d24 100%)',
      color: '#f0f0ff',
      fontFamily: 'Inter, system-ui, sans-serif',
      overflow: 'hidden',
      display: 'flex',
      flexDirection: 'column'
    }}>
      {/* 头部 */}
      <div style={{
        padding: '16px 20px',
        borderBottom: '1px solid rgba(139, 92, 246, 0.2)',
        background: 'rgba(0,0,0,0.3)'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 8 }}>
          <div style={{
            padding: 8,
            borderRadius: 10,
            background: 'linear-gradient(135deg, #8b5cf6 0%, #a855f7 100%)',
            boxShadow: '0 4px 20px rgba(139, 92, 246, 0.4)'
          }}>
            <SparklesIcon size={20} style={{ color: '#fff' }} />
          </div>
          <div>
            <h1 style={{ fontSize: 18, fontWeight: 600, margin: 0 }}>AI 智能工作流助手</h1>
            <p style={{ fontSize: 12, color: '#a78bfa', margin: 0 }}>
              基于您的工作习惯智能分析并提供建议
            </p>
          </div>
        </div>
        
        {isAnalyzing && (
          <div style={{ marginTop: 12 }}>
            <div style={{
              height: 4,
              background: 'rgba(139, 92, 246, 0.2)',
              borderRadius: 2,
              overflow: 'hidden'
            }}>
              <div style={{
                height: '100%',
                width: `${analysisProgress}%`,
                background: 'linear-gradient(90deg, #8b5cf6, #a855f7)',
                borderRadius: 2,
                transition: 'width 0.1s'
              }} />
            </div>
            <div style={{ fontSize: 12, color: '#a78bfa', marginTop: 6 }}>
              正在分析工作习惯... {analysisProgress}%
            </div>
          </div>
        )}
      </div>

      {/* 内容 */}
      <div style={{ flex: 1, overflow: 'auto', padding: 16 }}>
        {/* 今日洞察 */}
        {!isAnalyzing && insights.length > 0 && (
          <div style={{ marginBottom: 20 }}>
            <h2 style={{ fontSize: 14, fontWeight: 600, marginBottom: 12, color: '#a78bfa' }}>
              今日洞察
            </h2>
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))',
              gap: 10
            }}>
              {insights.map((insight, i) => (
                <div key={i} style={{
                  background: 'rgba(139, 92, 246, 0.08)',
                  borderRadius: 10,
                  padding: 12,
                  border: '1px solid rgba(139, 92, 246, 0.15)'
                }}>
                  <div style={{ fontSize: 11, color: '#a78bfa', marginBottom: 4 }}>{insight.category}</div>
                  <div style={{ fontSize: 20, fontWeight: 600, marginBottom: 4 }}>{insight.value}</div>
                  <div style={{ 
                    fontSize: 10, 
                    color: insight.trend === 'up' ? '#22c55e' : insight.trend === 'down' ? '#ef4444' : '#94a3b8'
                  }}>
                    {insight.insight}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* 智能建议 */}
        {!isAnalyzing && suggestions.length > 0 && (
          <div>
            <h2 style={{ fontSize: 14, fontWeight: 600, marginBottom: 12, color: '#a78bfa' }}>
              为您推荐的优化建议
            </h2>
            <div style={{ display: 'grid', gap: 10 }}>
              {suggestions.map((suggestion) => (
                <div key={suggestion.id} style={{
                  background: 'rgba(255,255,255,0.03)',
                  borderRadius: 12,
                  padding: 14,
                  border: `1px solid ${getImpactColor(suggestion.impact)}20`,
                  transition: 'all 0.2s',
                  cursor: 'pointer'
                }}>
                  <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12 }}>
                    <div style={{
                      padding: 8,
                      borderRadius: 8,
                      background: 'rgba(139, 92, 246, 0.15)',
                      color: '#a78bfa'
                    }}>
                      {getTypeIcon(suggestion.type)}
                    </div>
                    <div style={{ flex: 1 }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 6 }}>
                        <div style={{ fontSize: 14, fontWeight: 500 }}>{suggestion.title}</div>
                        <div style={{ display: 'flex', gap: 6 }}>
                          <span style={{
                            padding: '2px 6px',
                            borderRadius: 4,
                            fontSize: 10,
                            background: `${getImpactColor(suggestion.impact)}20`,
                            color: getImpactColor(suggestion.impact)
                          }}>
                            {suggestion.impact === 'high' ? '高影响' : suggestion.impact === 'medium' ? '中影响' : '低影响'}
                          </span>
                          <button
                            onClick={(e) => {
                              e.stopPropagation()
                              toggleSave(suggestion.id)
                            }}
                            style={{
                              padding: 4,
                              border: 'none',
                              background: 'transparent',
                              cursor: 'pointer',
                              color: suggestion.saved ? '#a855f7' : '#6b7280'
                            }}
                          >
                            {suggestion.saved ? <BookmarkCheckIcon size={14} /> : <BookmarkIcon size={14} />}
                          </button>
                        </div>
                      </div>
                      <div style={{ fontSize: 12, color: '#94a3b8', marginBottom: 8, lineHeight: 1.4 }}>
                        {suggestion.description}
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                        <span style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: 4,
                          fontSize: 11,
                          color: '#22c55e'
                        }}>
                          <ClockIcon size={12} />
                          {suggestion.timeSavings}
                        </span>
                        <span style={{ fontSize: 11, color: '#6b7280' }}>
                          难度: {suggestion.effort === 'easy' ? '简单' : suggestion.effort === 'medium' ? '中等' : '复杂'}
                        </span>
                      </div>
                    </div>
                  </div>
                  
                  {suggestion.actionable && (
                    <div style={{ marginTop: 12, display: 'flex', justifyContent: 'flex-end' }}>
                      <button style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: 6,
                        padding: '6px 12px',
                        background: 'linear-gradient(135deg, #8b5cf6, #a855f7)',
                        border: 'none',
                        borderRadius: 6,
                        color: '#fff',
                        fontSize: 12,
                        fontWeight: 500,
                        cursor: 'pointer'
                      }}>
                        立即执行
                        <ArrowRightIcon size={12} />
                      </button>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* 重新分析按钮 */}
        {!isAnalyzing && suggestions.length > 0 && (
          <div style={{ marginTop: 20, textAlign: 'center' }}>
            <button
              onClick={runAnalysis}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 8,
                padding: '10px 20px',
                background: 'rgba(139, 92, 246, 0.1)',
                border: '1px solid rgba(139, 92, 246, 0.3)',
                borderRadius: 8,
                color: '#a78bfa',
                fontSize: 13,
                cursor: 'pointer'
              }}
            >
              <RefreshCwIcon size={14} />
              重新分析
            </button>
          </div>
        )}
      </div>
    </div>
  )
}