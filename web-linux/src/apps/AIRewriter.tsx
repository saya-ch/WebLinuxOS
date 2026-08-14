import { useState, useEffect, useCallback, useMemo } from 'react'
import { Sparkles, Copy, History, Star, Trash2, RefreshCw, Languages, Zap, FileText, Download, Eye, EyeOff, ArrowRight, Wand2, BookOpen, Users } from 'lucide-react'

interface HistoryItem {
  id: string
  input: string
  output: string
  mode: string
  timestamp: number
  tokens?: number
}

interface Template {
  id: string
  name: string
  icon: string
  prompt: string
  description: string
}

const POLLINATIONS_API = 'https://text.pollinations.ai'

const REWRITE_MODES = [
  { id: 'improve', name: '润色改进', prompt: '请润色改进以下文本，使其更加流畅、专业、富有表现力。保持原意不变，但提升语言质量。', icon: '✨' },
  { id: 'simplify', name: '简化易懂', prompt: '请将以下复杂文本简化，使其更易于理解。使用简单的词汇和短句。', icon: '📝' },
  { id: 'expand', name: '扩展内容', prompt: '请扩展以下文本，添加更多细节、例证和解释，使其更加详尽和充实。', icon: '📈' },
  { id: 'summarize', name: '生成摘要', prompt: '请为以下文本生成简洁的摘要，提取关键信息和核心要点。', icon: '📋' },
  { id: 'translate-en', name: '翻译(英文)', prompt: '请将以下中文文本翻译成地道的英文。保持原意和语气。', icon: '🌍' },
  { id: 'translate-zh', name: '翻译(中文)', prompt: '请将以下英文文本翻译成地道的中文。保持原意和语气。', icon: '🌏' },
  { id: 'professional', name: '专业风格', prompt: '请将以下文本改写为专业的商务/学术风格，使用恰当的术语和正式表达。', icon: '💼' },
  { id: 'creative', name: '创意风格', prompt: '请将以下文本改写为富有创意和想象力的风格，使用生动的比喻和独特的表达。', icon: '🎨' },
  { id: 'bullet', name: '要点列表', prompt: '请将以下文本转换为清晰的要点列表格式，每个要点不超过20字。', icon: '📌' },
  { id: 'title', name: '生成标题', prompt: '请为以下文本生成5个吸引眼球的标题，风格各异。', icon: '📰' }
]

const TEMPLATES: Template[] = [
  { id: 'email', name: '商务邮件', icon: '📧', prompt: '撰写一封专业的商务邮件', description: '专业、礼貌、简洁' },
  { id: 'article', name: '博客文章', icon: '📄', prompt: '撰写一篇结构清晰的博客文章', description: '引人入胜、条理分明' },
  { id: 'tweet', name: '社交媒体', icon: '💬', prompt: '撰写一条社交媒体帖子', description: '简洁有力、引发共鸣' },
  { id: 'product', name: '产品描述', icon: '🛍️', prompt: '撰写一个吸引人的产品描述', description: '突出特点、激发购买欲' },
  { id: 'resume', name: '简历要点', icon: '📋', prompt: '将经历改写为简历要点', description: '量化成就、展现价值' },
  { id: 'press', name: '新闻稿', icon: '📰', prompt: '撰写一篇新闻稿', description: '客观、专业、结构清晰' }
]

const STORAGE_KEY = 'weblinux-ai-rewriter-history'
const FAVORITES_KEY = 'weblinux-ai-rewriter-favorites'

function loadHistory(): HistoryItem[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (raw) return JSON.parse(raw)
  } catch { /* ignore */ }
  return []
}

function loadFavorites(): HistoryItem[] {
  try {
    const raw = localStorage.getItem(FAVORITES_KEY)
    if (raw) return JSON.parse(raw)
  } catch { /* ignore */ }
  return []
}

function AIRewriter() {
  const [input, setInput] = useState('')
  const [output, setOutput] = useState('')
  const [mode, setMode] = useState(REWRITE_MODES[0])
  const [isLoading, setIsLoading] = useState(false)
  const [history, setHistory] = useState<HistoryItem[]>(() => loadHistory())
  const [favorites, setFavorites] = useState<HistoryItem[]>(() => loadFavorites())
  const [activeTab, setActiveTab] = useState<'rewriter' | 'history' | 'favorites' | 'templates'>('rewriter')
  const [wordCount, setWordCount] = useState(0)
  const [showTokenInfo, setShowTokenInfo] = useState(false)

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(history.slice(0, 100)))
  }, [history])

  useEffect(() => {
    localStorage.setItem(FAVORITES_KEY, JSON.stringify(favorites))
  }, [favorites])

  useEffect(() => {
    setWordCount(input.length)
  }, [input])

  const estimatedTokens = useMemo(() => Math.ceil(wordCount / 4), [wordCount])

  const processText = useCallback(async () => {
    if (!input.trim() || isLoading) return

    setIsLoading(true)
    setOutput('')

    try {
      const fullPrompt = `${mode.prompt}\n\n原文：\n${input}\n\n改写结果：`
      
      const response = await fetch(
        `${POLLINATIONS_API}/${encodeURIComponent(fullPrompt)}?prompt=${encodeURIComponent(fullPrompt)}&seed=${Date.now()}&nologo=true&enhance=true`
      )

      if (!response.ok) {
        throw new Error(`请求失败: ${response.status}`)
      }

      const text = await response.text()
      setOutput(text)

      const item: HistoryItem = {
        id: 'h_' + Date.now() + '_' + Math.random().toString(36).slice(2, 6),
        input,
        output: text,
        mode: mode.name,
        timestamp: Date.now(),
        tokens: estimatedTokens
      }

      setHistory(prev => [item, ...prev].slice(0, 100))
    } catch (err) {
      console.error('AI 处理失败:', err)
      setOutput('❌ 处理失败，请检查网络连接后重试。\n\n' + (err instanceof Error ? err.message : String(err)))
    } finally {
      setIsLoading(false)
    }
  }, [input, mode, isLoading, estimatedTokens])

  const copyOutput = useCallback(() => {
    if (output) {
      navigator.clipboard.writeText(output)
    }
  }, [output])

  const addToFavorites = useCallback((item: HistoryItem) => {
    const exists = favorites.some(f => f.id === item.id)
    if (exists) {
      setFavorites(prev => prev.filter(f => f.id !== item.id))
    } else {
      setFavorites(prev => [{ ...item, id: 'f_' + Date.now() + '_' + Math.random().toString(36).slice(2, 6) }, ...prev])
    }
  }, [favorites])

  const useHistoryItem = useCallback((item: HistoryItem) => {
    setInput(item.input)
    setOutput(item.output)
    setMode(REWRITE_MODES.find(m => m.name === item.mode) || REWRITE_MODES[0])
    setActiveTab('rewriter')
  }, [])

  const clearHistory = useCallback(() => {
    if (confirm('确定要清空历史记录吗？')) {
      setHistory([])
    }
  }, [])

  const useTemplate = useCallback((template: Template) => {
    setInput(template.prompt + '：\n\n')
    setActiveTab('rewriter')
  }, [])

  const downloadOutput = useCallback(() => {
    if (!output) return
    const blob = new Blob([output], { type: 'text/plain;charset=utf-8' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `rewritten-${Date.now()}.txt`
    a.click()
    URL.revokeObjectURL(url)
  }, [output])

  const exportFavorites = useCallback(() => {
    if (favorites.length === 0) return
    const data = JSON.stringify(favorites, null, 2)
    const blob = new Blob([data], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `ai-rewriter-favorites-${Date.now()}.json`
    a.click()
    URL.revokeObjectURL(url)
  }, [favorites])

  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      height: '100%',
      background: 'linear-gradient(135deg, #0f0f1a 0%, #1a1a2e 50%, #16213e 100%)',
      color: '#e0e0e8',
      fontFamily: 'system-ui, -apple-system, sans-serif'
    }}>
      {/* 顶部栏 */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        padding: '12px 20px',
        background: 'rgba(20, 20, 40, 0.9)',
        borderBottom: '1px solid rgba(124, 108, 240, 0.2)',
        gap: '12px',
        flexWrap: 'wrap'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <div style={{
            width: '36px',
            height: '36px',
            borderRadius: '10px',
            background: 'linear-gradient(135deg, #7c6cf0 0%, #5b4cd8 100%)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}>
            <Sparkles size={20} color="white" />
          </div>
          <div>
            <div style={{ fontSize: '16px', fontWeight: 600 }}>AI 智能文本改写</div>
            <div style={{ fontSize: '11px', color: '#6b7280' }}>Pollinations AI · 真实模型驱动</div>
          </div>
        </div>

        <div style={{ marginLeft: 'auto', display: 'flex', gap: '8px' }}>
          {(['rewriter', 'history', 'favorites', 'templates'] as const).map(tab => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              style={{
                padding: '6px 14px',
                borderRadius: '8px',
                background: activeTab === tab ? 'rgba(124, 108, 240, 0.3)' : 'rgba(30, 30, 50, 0.6)',
                border: `1px solid ${activeTab === tab ? 'rgba(124, 108, 240, 0.5)' : 'rgba(124, 108, 240, 0.15)'}`,
                color: activeTab === tab ? '#c4b5fd' : '#9ca3af',
                cursor: 'pointer',
                fontSize: '13px',
                fontWeight: activeTab === tab ? 500 : 400,
                display: 'flex',
                alignItems: 'center',
                gap: '6px'
              }}
            >
              {tab === 'rewriter' && <Wand2 size={14} />}
              {tab === 'history' && <History size={14} />}
              {tab === 'favorites' && <Star size={14} />}
              {tab === 'templates' && <BookOpen size={14} />}
              {tab === 'rewriter' && '改写'}
              {tab === 'history' && `历史(${history.length})`}
              {tab === 'favorites' && `收藏(${favorites.length})`}
              {tab === 'templates' && '模板'}
            </button>
          ))}
        </div>
      </div>

      {/* 主内容区 */}
      <div style={{ flex: 1, overflow: 'auto', padding: '20px' }}>
        {activeTab === 'rewriter' && (
          <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
            {/* 模式选择 */}
            <div style={{ marginBottom: '20px' }}>
              <div style={{ fontSize: '13px', color: '#9ca3af', marginBottom: '10px', fontWeight: 500 }}>
                选择改写模式
              </div>
              <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fill, minmax(150px, 1fr))',
                gap: '10px'
              }}>
                {REWRITE_MODES.map(modeOption => (
                  <button
                    key={modeOption.id}
                    onClick={() => setMode(modeOption)}
                    style={{
                      padding: '12px',
                      borderRadius: '10px',
                      background: mode.id === modeOption.id 
                        ? 'rgba(124, 108, 240, 0.25)' 
                        : 'rgba(30, 30, 50, 0.5)',
                      border: `1px solid ${mode.id === modeOption.id ? 'rgba(124, 108, 240, 0.5)' : 'rgba(124, 108, 240, 0.15)'}`,
                      color: mode.id === modeOption.id ? '#e0e0e8' : '#9ca3af',
                      cursor: 'pointer',
                      transition: 'all 0.2s',
                      textAlign: 'left'
                    }}
                    onMouseEnter={(e) => {
                      if (mode.id !== modeOption.id) {
                        (e.currentTarget as HTMLButtonElement).style.background = 'rgba(124, 108, 240, 0.15)'
                      }
                    }}
                    onMouseLeave={(e) => {
                      if (mode.id !== modeOption.id) {
                        (e.currentTarget as HTMLButtonElement).style.background = 'rgba(30, 30, 50, 0.5)'
                      }
                    }}
                  >
                    <div style={{ fontSize: '18px', marginBottom: '4px' }}>{modeOption.icon}</div>
                    <div style={{ fontSize: '13px', fontWeight: 500 }}>{modeOption.name}</div>
                  </button>
                ))}
              </div>
            </div>

            {/* 输入输出区域 */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
              {/* 输入区 */}
              <div style={{
                background: 'rgba(20, 20, 40, 0.6)',
                borderRadius: '12px',
                border: '1px solid rgba(124, 108, 240, 0.2)',
                overflow: 'hidden'
              }}>
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: '12px 16px',
                  background: 'rgba(30, 30, 50, 0.5)',
                  borderBottom: '1px solid rgba(124, 108, 240, 0.15)'
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <FileText size={16} style={{ color: '#7c6cf0' }} />
                    <span style={{ fontSize: '13px', fontWeight: 500 }}>原文输入</span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px', fontSize: '12px', color: '#6b7280' }}>
                    <span>{wordCount} 字符</span>
                    <button
                      onClick={() => setShowTokenInfo(!showTokenInfo)}
                      style={{
                        background: 'none',
                        border: 'none',
                        color: '#6b7280',
                        cursor: 'pointer',
                        padding: 0
                      }}
                    >
                      {showTokenInfo ? <EyeOff size={14} /> : <Eye size={14} />}
                    </button>
                  </div>
                </div>
                {showTokenInfo && (
                  <div style={{
                    padding: '8px 16px',
                    background: 'rgba(124, 108, 240, 0.08)',
                    fontSize: '11px',
                    color: '#9ca3af',
                    borderBottom: '1px solid rgba(124, 108, 240, 0.1)',
                    display: 'flex',
                    justifyContent: 'space-around'
                  }}>
                    <span>预估 Tokens: ~{estimatedTokens}</span>
                    <span>使用模型: Pollinations AI</span>
                  </div>
                )}
                <textarea
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  placeholder="在此输入需要改写的文本...&#10;&#10;支持中英文混合输入，建议不超过2000字以获得最佳效果。"
                  style={{
                    width: '100%',
                    padding: '16px',
                    background: 'transparent',
                    border: 'none',
                    color: '#e0e0e8',
                    fontSize: '14px',
                    lineHeight: '1.7',
                    outline: 'none',
                    resize: 'none',
                    minHeight: '350px',
                    fontFamily: 'inherit',
                    boxSizing: 'border-box'
                  }}
                />
                <div style={{
                  padding: '12px 16px',
                  background: 'rgba(30, 30, 50, 0.3)',
                  borderTop: '1px solid rgba(124, 108, 240, 0.1)',
                  display: 'flex',
                  gap: '10px'
                }}>
                  <button
                    onClick={() => setInput('')}
                    style={{
                      padding: '8px 16px',
                      borderRadius: '8px',
                      background: 'rgba(239, 68, 68, 0.15)',
                      border: '1px solid rgba(239, 68, 68, 0.3)',
                      color: '#ef4444',
                      cursor: 'pointer',
                      fontSize: '13px',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '6px'
                    }}
                  >
                    <Trash2 size={14} /> 清空
                  </button>
                  <button
                    onClick={processText}
                    disabled={!input.trim() || isLoading}
                    style={{
                      flex: 1,
                      padding: '8px 16px',
                      borderRadius: '8px',
                      background: (!input.trim() || isLoading) 
                        ? 'rgba(124, 108, 240, 0.3)' 
                        : 'linear-gradient(135deg, #7c6cf0 0%, #5b4cd8 100%)',
                      border: 'none',
                      color: 'white',
                      cursor: (!input.trim() || isLoading) ? 'not-allowed' : 'pointer',
                      fontSize: '14px',
                      fontWeight: 500,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '8px'
                    }}
                  >
                    {isLoading ? (
                      <>
                        <RefreshCw size={16} style={{ animation: 'spin 1s linear infinite' }} />
                        AI 处理中...
                      </>
                    ) : (
                      <>
                        <Zap size={16} />
                        AI {mode.name}
                      </>
                    )}
                  </button>
                </div>
              </div>

              {/* 输出区 */}
              <div style={{
                background: 'rgba(20, 20, 40, 0.6)',
                borderRadius: '12px',
                border: '1px solid rgba(124, 108, 240, 0.2)',
                overflow: 'hidden',
                display: 'flex',
                flexDirection: 'column'
              }}>
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: '12px 16px',
                  background: 'rgba(30, 30, 50, 0.5)',
                  borderBottom: '1px solid rgba(124, 108, 240, 0.15)'
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <Sparkles size={16} style={{ color: '#10b981' }} />
                    <span style={{ fontSize: '13px', fontWeight: 500 }}>AI 改写结果</span>
                  </div>
                  {output && (
                    <div style={{ display: 'flex', gap: '8px' }}>
                      <button
                        onClick={() => addToFavorites({
                          id: 'fav_' + Date.now(),
                          input,
                          output,
                          mode: mode.name,
                          timestamp: Date.now()
                        })}
                        style={{
                          background: 'rgba(245, 158, 11, 0.15)',
                          border: 'none',
                          color: '#f59e0b',
                          cursor: 'pointer',
                          padding: '4px',
                          borderRadius: '4px'
                        }}
                      >
                        <Star size={14} />
                      </button>
                      <button
                        onClick={copyOutput}
                        style={{
                          background: 'rgba(124, 108, 240, 0.15)',
                          border: 'none',
                          color: '#7c6cf0',
                          cursor: 'pointer',
                          padding: '4px',
                          borderRadius: '4px'
                        }}
                      >
                        <Copy size={14} />
                      </button>
                      <button
                        onClick={downloadOutput}
                        style={{
                          background: 'rgba(16, 185, 129, 0.15)',
                          border: 'none',
                          color: '#10b981',
                          cursor: 'pointer',
                          padding: '4px',
                          borderRadius: '4px'
                        }}
                      >
                        <Download size={14} />
                      </button>
                    </div>
                  )}
                </div>
                <div style={{ flex: 1, padding: '16px', minHeight: '300px', overflow: 'auto' }}>
                  {output ? (
                    <div style={{
                      fontSize: '14px',
                      lineHeight: '1.8',
                      color: '#d1d5db',
                      whiteSpace: 'pre-wrap'
                    }}>
                      {output}
                    </div>
                  ) : (
                    <div style={{
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center',
                      justifyContent: 'center',
                      height: '250px',
                      color: '#4b5563'
                    }}>
                      <Languages size={48} style={{ opacity: 0.3, marginBottom: '16px' }} />
                      <div style={{ fontSize: '14px' }}>AI 改写结果将显示在此处</div>
                      <div style={{ fontSize: '12px', marginTop: '8px' }}>
                        在左侧输入文本，选择模式后点击「AI 改写」
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* 使用提示 */}
            <div style={{
              marginTop: '20px',
              padding: '16px',
              background: 'rgba(124, 108, 240, 0.08)',
              borderRadius: '10px',
              border: '1px solid rgba(124, 108, 240, 0.15)',
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
              gap: '16px'
            }}>
              <div style={{ display: 'flex', alignItems: 'flex-start', gap: '10px' }}>
                <div style={{
                  width: '32px',
                  height: '32px',
                  borderRadius: '8px',
                  background: 'rgba(124, 108, 240, 0.2)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  flexShrink: 0
                }}>
                  <Sparkles size={16} style={{ color: '#7c6cf0' }} />
                </div>
                <div>
                  <div style={{ fontSize: '13px', fontWeight: 500, marginBottom: '4px' }}>AI 驱动</div>
                  <div style={{ fontSize: '12px', color: '#9ca3af' }}>基于 Pollinations AI 真实模型</div>
                </div>
              </div>
              <div style={{ display: 'flex', alignItems: 'flex-start', gap: '10px' }}>
                <div style={{
                  width: '32px',
                  height: '32px',
                  borderRadius: '8px',
                  background: 'rgba(16, 185, 129, 0.2)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  flexShrink: 0
                }}>
                  <Zap size={16} style={{ color: '#10b981' }} />
                </div>
                <div>
                  <div style={{ fontSize: '13px', fontWeight: 500, marginBottom: '4px' }}>实时处理</div>
                  <div style={{ fontSize: '12px', color: '#9ca3af' }}>无需等待，即时获取结果</div>
                </div>
              </div>
              <div style={{ display: 'flex', alignItems: 'flex-start', gap: '10px' }}>
                <div style={{
                  width: '32px',
                  height: '32px',
                  borderRadius: '8px',
                  background: 'rgba(245, 158, 11, 0.2)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  flexShrink: 0
                }}>
                  <Users size={16} style={{ color: '#f59e0b' }} />
                </div>
                <div>
                  <div style={{ fontSize: '13px', fontWeight: 500, marginBottom: '4px' }}>隐私安全</div>
                  <div style={{ fontSize: '12px', color: '#9ca3af' }}>处理历史保存在本地</div>
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'history' && (
          <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              marginBottom: '20px'
            }}>
              <div>
                <div style={{ fontSize: '16px', fontWeight: 600, marginBottom: '4px' }}>改写历史</div>
                <div style={{ fontSize: '12px', color: '#6b7280' }}>
                  共 {history.length} 条记录，最近的 {Math.min(history.length, 100)} 条
                </div>
              </div>
              {history.length > 0 && (
                <button
                  onClick={clearHistory}
                  style={{
                    padding: '8px 16px',
                    borderRadius: '8px',
                    background: 'rgba(239, 68, 68, 0.15)',
                    border: '1px solid rgba(239, 68, 68, 0.3)',
                    color: '#ef4444',
                    cursor: 'pointer',
                    fontSize: '13px',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px'
                  }}
                >
                  <Trash2 size={14} /> 清空历史
                </button>
              )}
            </div>

            {history.length === 0 ? (
              <div style={{
                textAlign: 'center',
                padding: '60px 20px',
                color: '#4b5563'
              }}>
                <History size={48} style={{ margin: '0 auto 16px', opacity: 0.3 }} />
                <div style={{ fontSize: '14px' }}>暂无改写历史</div>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                {history.map(item => (
                  <div
                    key={item.id}
                    onClick={() => useHistoryItem(item)}
                    style={{
                      padding: '16px',
                      background: 'rgba(20, 20, 40, 0.6)',
                      borderRadius: '10px',
                      border: '1px solid rgba(124, 108, 240, 0.15)',
                      cursor: 'pointer',
                      transition: 'all 0.2s'
                    }}
                    onMouseEnter={(e) => {
                      const el = e.currentTarget as unknown as HTMLElement
                      el.style.borderColor = 'rgba(124, 108, 240, 0.4)'
                      el.style.background = 'rgba(124, 108, 240, 0.1)'
                    }}
                    onMouseLeave={(e) => {
                      const el = e.currentTarget as unknown as HTMLElement
                      el.style.borderColor = 'rgba(124, 108, 240, 0.15)'
                      el.style.background = 'rgba(20, 20, 40, 0.6)'
                    }}
                  >
                    <div style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      marginBottom: '8px'
                    }}>
                      <span style={{
                        padding: '3px 10px',
                        borderRadius: '12px',
                        background: 'rgba(124, 108, 240, 0.2)',
                        color: '#a78bfa',
                        fontSize: '12px',
                        fontWeight: 500
                      }}>
                        {item.mode}
                      </span>
                      <span style={{ fontSize: '11px', color: '#6b7280' }}>
                        {new Date(item.timestamp).toLocaleString()}
                      </span>
                    </div>
                    <div style={{
                      fontSize: '13px',
                      color: '#9ca3af',
                      marginBottom: '8px',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      whiteSpace: 'nowrap'
                    }}>
                      <span style={{ color: '#6b7280' }}>原文：</span>{item.input}
                    </div>
                    <div style={{
                      fontSize: '13px',
                      color: '#d1d5db',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      whiteSpace: 'nowrap'
                    }}>
                      <span style={{ color: '#10b981' }}>结果：</span>{item.output}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {activeTab === 'favorites' && (
          <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              marginBottom: '20px'
            }}>
              <div>
                <div style={{ fontSize: '16px', fontWeight: 600, marginBottom: '4px' }}>收藏夹</div>
                <div style={{ fontSize: '12px', color: '#6b7280' }}>
                  共 {favorites.length} 条收藏
                </div>
              </div>
              {favorites.length > 0 && (
                <button
                  onClick={exportFavorites}
                  style={{
                    padding: '8px 16px',
                    borderRadius: '8px',
                    background: 'rgba(16, 185, 129, 0.15)',
                    border: '1px solid rgba(16, 185, 129, 0.3)',
                    color: '#10b981',
                    cursor: 'pointer',
                    fontSize: '13px',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px'
                  }}
                >
                  <Download size={14} /> 导出收藏
                </button>
              )}
            </div>

            {favorites.length === 0 ? (
              <div style={{
                textAlign: 'center',
                padding: '60px 20px',
                color: '#4b5563'
              }}>
                <Star size={48} style={{ margin: '0 auto 16px', opacity: 0.3 }} />
                <div style={{ fontSize: '14px' }}>暂无收藏</div>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                {favorites.map(item => (
                  <div
                    key={item.id}
                    style={{
                      padding: '20px',
                      background: 'rgba(20, 20, 40, 0.6)',
                      borderRadius: '12px',
                      border: '1px solid rgba(245, 158, 11, 0.2)'
                    }}
                  >
                    <div style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      marginBottom: '12px'
                    }}>
                      <span style={{
                        padding: '4px 12px',
                        borderRadius: '12px',
                        background: 'rgba(245, 158, 11, 0.2)',
                        color: '#f59e0b',
                        fontSize: '12px',
                        fontWeight: 500
                      }}>
                        {item.mode}
                      </span>
                      <div style={{ display: 'flex', gap: '8px' }}>
                        <button
                          onClick={() => {
                            navigator.clipboard.writeText(item.output)
                          }}
                          style={{
                            padding: '6px',
                            borderRadius: '6px',
                            background: 'rgba(124, 108, 240, 0.15)',
                            border: 'none',
                            color: '#7c6cf0',
                            cursor: 'pointer'
                          }}
                        >
                          <Copy size={14} />
                        </button>
                        <button
                          onClick={() => addToFavorites(item)}
                          style={{
                            padding: '6px',
                            borderRadius: '6px',
                            background: 'rgba(239, 68, 68, 0.15)',
                            border: 'none',
                            color: '#ef4444',
                            cursor: 'pointer'
                          }}
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </div>
                    <div style={{
                      padding: '12px',
                      background: 'rgba(0, 0, 0, 0.3)',
                      borderRadius: '8px',
                      marginBottom: '12px',
                      fontSize: '12px',
                      color: '#6b7280',
                      maxHeight: '80px',
                      overflow: 'auto'
                    }}>
                      <strong>原文：</strong>{item.input}
                    </div>
                    <div style={{
                      padding: '12px',
                      background: 'rgba(16, 185, 129, 0.1)',
                      borderRadius: '8px',
                      fontSize: '13px',
                      color: '#d1d5db',
                      whiteSpace: 'pre-wrap'
                    }}>
                      {item.output}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {activeTab === 'templates' && (
          <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
            <div style={{ marginBottom: '20px' }}>
              <div style={{ fontSize: '16px', fontWeight: 600, marginBottom: '4px' }}>写作模板</div>
              <div style={{ fontSize: '12px', color: '#6b7280' }}>
                点击模板快速设置写作场景
              </div>
            </div>
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
              gap: '16px'
            }}>
              {TEMPLATES.map(template => (
                <div
                  key={template.id}
                  onClick={() => useTemplate(template)}
                  style={{
                    padding: '20px',
                    background: 'rgba(20, 20, 40, 0.6)',
                    borderRadius: '12px',
                    border: '1px solid rgba(124, 108, 240, 0.2)',
                    cursor: 'pointer',
                    transition: 'all 0.2s'
                  }}
                  onMouseEnter={(e) => {
                    const el = e.currentTarget as unknown as HTMLElement
                    el.style.transform = 'translateY(-2px)'
                    el.style.borderColor = 'rgba(124, 108, 240, 0.5)'
                  }}
                  onMouseLeave={(e) => {
                    const el = e.currentTarget as unknown as HTMLElement
                    el.style.transform = 'translateY(0)'
                    el.style.borderColor = 'rgba(124, 108, 240, 0.2)'
                  }}
                >
                  <div style={{ fontSize: '32px', marginBottom: '12px' }}>{template.icon}</div>
                  <div style={{ fontSize: '16px', fontWeight: 500, marginBottom: '8px' }}>
                    {template.name}
                  </div>
                  <div style={{ fontSize: '12px', color: '#6b7280', marginBottom: '12px' }}>
                    {template.description}
                  </div>
                  <div style={{
                    fontSize: '12px',
                    color: '#7c6cf0',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '4px'
                  }}>
                    <ArrowRight size={14} /> 使用此模板
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
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

export default AIRewriter
