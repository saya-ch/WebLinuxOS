import { useState, useCallback } from 'react'
import {
  FileText, Sparkles, Copy,
  Search, BarChart3, Clock, Hash, Type,
  Wand2, Lightbulb,
  TrendingUp, CheckCircle
} from 'lucide-react'

interface AnalysisResult {
  wordCount: number
  charCount: number
  charCountNoSpaces: number
  lineCount: number
  paragraphCount: number
  avgWordLength: number
  readingTime: number
  speakingTime: number
  uniqueWords: number
  mostCommonWords: Array<{ word: string; count: number }>
  sentenceCount: number
  avgSentenceLength: number
}

interface ReadabilityScore {
  score: number
  level: string
  description: string
}

interface KeywordSuggestion {
  word: string
  relevance: number
}

const SAMPLE_TEXTS: Record<string, string> = {
  '技术文章': `WebLinuxOS 是一款基于浏览器的 Linux 桌面环境模拟器。它使用 React 19、TypeScript 和 Vite 构建，提供了 350 多个实际可用的应用程序。该项目的目标不是仅仅创建一个视觉外壳，而是提供一个真正有实用价值的操作环境。`,
  '产品描述': `我们的 AI 助手可以帮助您完成各种任务，包括文本生成、代码编写、数据分析和创意工作。它基于先进的大语言模型，能够理解上下文并生成高质量的内容。无论您是学生、开发者还是企业用户，都能从中受益。`,
  '营销文案': `在数字时代，用户体验至关重要。我们致力于打造流畅、直观的产品，让每一位用户都能轻松实现目标。立即体验，感受科技带来的无限可能。`
}

export default function AITextAnalyzer() {
  const [text, setText] = useState('')
  const [analysis, setAnalysis] = useState<AnalysisResult | null>(null)
  const [keywordSuggestions, setKeywordSuggestions] = useState<KeywordSuggestion[]>([])
  const [readability, setReadability] = useState<ReadabilityScore | null>(null)
  const [aiSuggestions, setAiSuggestions] = useState<string[]>([])
  const [activeTab, setActiveTab] = useState<'overview' | 'readability' | 'keywords' | 'suggestions'>('overview')
  const [loading, setLoading] = useState(false)

  const analyzeText = useCallback(() => {
    if (!text.trim()) return
    setLoading(true)

    // Word count (supports both English and Chinese)
    const words = text.trim().split(/\s+/)
    const chineseChars = text.match(/[\u4e00-\u9fa5]/g) || []
    const totalWords = chineseChars.length + (chineseChars.length > 0 ? 0 : words.filter(w => w.length > 0).length)

    // Character counts
    const charCount = text.length
    const charCountNoSpaces = text.replace(/\s/g, '').length

    // Line and paragraph count
    const lines = text.split('\n')
    const paragraphs = text.split(/\n\s*\n/).filter(p => p.trim().length > 0)

    // Sentence count
    const sentences = text.split(/[。.!?！？]+/).filter(s => s.trim().length > 0)
    const sentenceCount = sentences.length || 1

    // Word frequency analysis (for English text)
    const wordFreq: Record<string, number> = {}
    text.toLowerCase()
      .replace(/[^a-z0-9\s]/g, ' ')
      .split(/\s+/)
      .filter(w => w.length > 2)
      .forEach(w => { wordFreq[w] = (wordFreq[w] || 0) + 1 })

    const mostCommonWords = Object.entries(wordFreq)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 10)
      .map(([word, count]) => ({ word, count }))

    // Reading time (average 200 words per minute for English, 300 chars for Chinese)
    const readingTime = chineseChars.length > 0
      ? Math.ceil(charCount / 300)
      : Math.ceil(totalWords / 200)

    // Speaking time (average 130 words per minute)
    const speakingTime = Math.ceil(totalWords / 130)

    const result: AnalysisResult = {
      wordCount: totalWords,
      charCount,
      charCountNoSpaces,
      lineCount: lines.length,
      paragraphCount: paragraphs.length,
      avgWordLength: totalWords > 0 ? Math.round((charCountNoSpaces / totalWords) * 10) / 10 : 0,
      readingTime,
      speakingTime,
      uniqueWords: Object.keys(wordFreq).length,
      mostCommonWords,
      sentenceCount,
      avgSentenceLength: Math.round((totalWords / sentenceCount) * 10) / 10 || 0,
    }

    setAnalysis(result)

    // Readability scoring
    const avgSentenceLen = result.avgSentenceLength || 1
    let score = 100 - avgSentenceLen * 2
    score = Math.max(0, Math.min(100, score))

    let level = '中等', description = '文本可读性适中'
    if (score >= 70) {
      level = '简单'
      description = '文本简单易懂，适合大多数读者'
    } else if (score >= 50) {
      level = '中等'
      description = '文本复杂度适中，需要一定背景知识'
    } else if (score >= 30) {
      level = '较难'
      description = '文本较为复杂，建议简化表达'
    } else {
      level = '困难'
      description = '文本非常复杂，专业度较高'
    }

    setReadability({ score, level, description })

    // Keyword extraction (simple TF-based)
    const totalWordsCount = text.toLowerCase().split(/\s+/).filter(w => w.length > 0).length
    const keywords = Object.entries(wordFreq)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 15)
      .map(([word, count]) => ({
        word,
        relevance: Math.round((count / Math.max(totalWordsCount, 1)) * 1000) / 10
      }))
    setKeywordSuggestions(keywords)

    // AI suggestions
    const suggestions: string[] = []
    if (sentenceCount < 3) {
      suggestions.push('考虑添加更多句子以丰富内容')
    }
    if (paragraphs.length < 2) {
      suggestions.push('建议将内容分成多个段落，提高可读性')
    }
    if (avgSentenceLen > 30) {
      suggestions.push('部分句子较长，建议拆分以提高可读性')
    }
    if (result.wordCount < 50) {
      suggestions.push('内容较短，可以考虑扩展更多细节')
    }
    if (score < 40) {
      suggestions.push('文本较为复杂，建议使用更简单的词汇')
    }
    if (chineseChars.length > 0 && result.wordCount < 100) {
      suggestions.push('中文文本较短，可以添加更多说明和例子')
    }
    if (suggestions.length === 0) {
      suggestions.push('文本结构良好，继续保持！')
      suggestions.push('可以考虑添加例子或数据支撑观点')
    }

    setAiSuggestions(suggestions)
    setLoading(false)
  }, [text])

  const loadSampleText = (key: string) => {
    setText(SAMPLE_TEXTS[key])
  }

  const clearText = () => {
    setText('')
    setAnalysis(null)
    setKeywordSuggestions([])
    setReadability(null)
    setAiSuggestions([])
  }

  const copyAnalysis = () => {
    if (!analysis) return
    const report = `文本分析报告
============
字数统计: ${analysis.wordCount}
字符数: ${analysis.charCount}
无空格字符数: ${analysis.charCountNoSpaces}
段落数: ${analysis.paragraphCount}
句子数: ${analysis.sentenceCount}
平均句长: ${analysis.avgSentenceLength}

阅读时间: ${analysis.readingTime} 分钟
演讲时间: ${analysis.speakingTime} 分钟

${readability ? `可读性评分: ${readability.score}/100 (${readability.level})` : ''}

高频词汇:
${analysis.mostCommonWords.map((w, i) => `${i + 1}. ${w.word}: ${w.count}次`).join('\n')}

AI建议:
${aiSuggestions.map((s, i) => `${i + 1}. ${s}`).join('\n')}`

    navigator.clipboard.writeText(report)
  }

  const StatCard = ({ label, value, icon: Icon, color }: {
    label: string; value: string | number; icon: React.ElementType; color: string
  }) => (
    <div style={{
      padding: 14, borderRadius: 10, background: 'var(--bg-hover, #2a2a3e)',
      border: '1px solid var(--border-color, #444)'
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
        <div style={{
          width: 32, height: 32, borderRadius: 8,
          background: color + '22', display: 'flex',
          alignItems: 'center', justifyContent: 'center'
        }}>
          <Icon size={16} color={color} />
        </div>
        <span style={{ fontSize: 12, color: 'var(--text-secondary, #888)' }}>{label}</span>
      </div>
      <div style={{ fontSize: 22, fontWeight: 700 }}>{value}</div>
    </div>
  )

  const keywordColor = (relevance: number) => {
    if (relevance >= 20) return '#ef4444'
    if (relevance >= 10) return '#f59e0b'
    return '#7c6cf0'
  }

  return (
    <div style={{
      width: '100%', height: '100%', display: 'flex', flexDirection: 'column',
      background: 'var(--bg-primary, #1a1a2e)', color: 'var(--text-primary, #fff)',
      fontFamily: 'system-ui, -apple-system, sans-serif', fontSize: 13
    }}>
      {/* Header */}
      <div style={{
        padding: '12px 16px', borderBottom: '1px solid var(--border-color, #333)',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        background: 'var(--bg-secondary, #16213e)'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <Sparkles size={20} color="#7c6cf0" />
          <span style={{ fontWeight: 600, fontSize: 15 }}>AI 文本分析器</span>
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          <button onClick={copyAnalysis} disabled={!analysis} style={{
            padding: '6px 12px', borderRadius: 6, border: '1px solid var(--border-color, #555)',
            background: 'var(--bg-hover, #2a2a3e)', color: analysis ? '#fff' : '#666',
            cursor: analysis ? 'pointer' : 'not-allowed',
            display: 'flex', alignItems: 'center', gap: 6, fontSize: 12
          }}>
            <Copy size={14} /> 复制报告
          </button>
          <button onClick={clearText} style={{
            padding: '6px 12px', borderRadius: 6, border: '1px solid var(--border-color, #555)',
            background: 'var(--bg-hover, #2a2a3e)', color: '#fff',
            cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6, fontSize: 12
          }}>
            清除
          </button>
        </div>
      </div>

      <div style={{ flex: 1, display: 'flex', overflow: 'hidden' }}>
        {/* Input Section */}
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', padding: 16, borderRight: '1px solid var(--border-color, #333)' }}>
          <div style={{ display: 'flex', gap: 8, marginBottom: 12 }}>
            {Object.keys(SAMPLE_TEXTS).map(key => (
              <button key={key} onClick={() => loadSampleText(key)} style={{
                padding: '4px 10px', borderRadius: 12, border: '1px solid var(--border-color, #555)',
                background: 'transparent', color: '#888', cursor: 'pointer', fontSize: 11
              }}>
                {key}
              </button>
            ))}
          </div>

          <textarea
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder="在此输入或粘贴要分析的文本...

支持中英文混合分析，自动识别语言特征。"
            style={{
              flex: 1, padding: 14, borderRadius: 10,
              border: '1px solid var(--border-color, #555)',
              background: 'var(--bg-hover, #2a2a3e)', color: '#fff',
              fontFamily: 'system-ui, -apple-system, sans-serif',
              fontSize: 14, lineHeight: 1.6, resize: 'none',
              outline: 'none'
            }}
          />

          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 12 }}>
            <span style={{ color: 'var(--text-secondary, #888)', fontSize: 12 }}>
              {text.length} 字符
            </span>
            <button onClick={analyzeText} disabled={!text.trim() || loading} style={{
              padding: '10px 24px', borderRadius: 8, border: 'none',
              background: !text.trim() || loading ? '#333' : 'linear-gradient(135deg, #7c6cf0 0%, #5b4cd8 100%)',
              color: '#fff', cursor: !text.trim() || loading ? 'not-allowed' : 'pointer',
              fontWeight: 600, display: 'flex', alignItems: 'center', gap: 8
            }}>
              <Wand2 size={16} /> {loading ? '分析中...' : '开始分析'}
            </button>
          </div>
        </div>

        {/* Results Section */}
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'auto', padding: 16 }}>
          {!analysis ? (
            <div style={{ color: 'var(--text-secondary, #888)', textAlign: 'center', padding: 60 }}>
              <BarChart3 size={48} style={{ marginBottom: 16, opacity: 0.5 }} />
              <div style={{ fontSize: 16, marginBottom: 8 }}>等待分析</div>
              <div style={{ fontSize: 13 }}>在左侧输入文本，然后点击"开始分析"</div>
            </div>
          ) : (
            <>
              {/* Overview Tab */}
              {activeTab === 'overview' && (
                <div>
                  <h3 style={{ marginBottom: 16, fontSize: 16 }}>📊 统计概览</h3>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12, marginBottom: 20 }}>
                    <StatCard label="总字数" value={analysis.wordCount} icon={Type} color="#7c6cf0" />
                    <StatCard label="总字符数" value={analysis.charCount} icon={Hash} color="#10b981" />
                    <StatCard label="段落数" value={analysis.paragraphCount} icon={FileText} color="#f59e0b" />
                    <StatCard label="句子数" value={analysis.sentenceCount} icon={Search} color="#0ea5e9" />
                    <StatCard label="唯一词汇" value={analysis.uniqueWords} icon={Sparkles} color="#ec4899" />
                    <StatCard label="平均句长" value={analysis.avgSentenceLength} icon={BarChart3} color="#8b5cf6" />
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 12, marginBottom: 20 }}>
                    <StatCard label="阅读时间" value={`${analysis.readingTime} 分钟`} icon={Clock} color="#06b6d4" />
                    <StatCard label="演讲时间" value={`${analysis.speakingTime} 分钟`} icon={TrendingUp} color="#f97316" />
                  </div>

                  {readability && (
                    <div style={{
                      padding: 16, borderRadius: 10,
                      background: readability.score >= 60 ? 'rgba(16, 185, 129, 0.1)' :
                        readability.score >= 40 ? 'rgba(245, 158, 11, 0.1)' : 'rgba(239, 68, 68, 0.1)',
                      border: `1px solid ${readability.score >= 60 ? '#10b981' : readability.score >= 40 ? '#f59e0b' : '#ef4444'}33`
                    }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 8 }}>
                        <div style={{ fontSize: 32, fontWeight: 700, color: readability.score >= 60 ? '#10b981' : readability.score >= 40 ? '#f59e0b' : '#ef4444' }}>
                          {readability.score}
                        </div>
                        <div>
                          <div style={{ fontSize: 14, fontWeight: 600 }}>可读性评分</div>
                          <div style={{ fontSize: 12, color: 'var(--text-secondary, #888)' }}>
                            等级: {readability.level}
                          </div>
                        </div>
                      </div>
                      <div style={{ fontSize: 12, color: 'var(--text-secondary, #aaa)' }}>
                        {readability.description}
                      </div>
                    </div>
                  )}

                  {/* Common Words */}
                  {analysis.mostCommonWords.length > 0 && (
                    <div style={{ marginTop: 20 }}>
                      <h4 style={{ marginBottom: 12, fontSize: 14 }}>高频词汇 TOP 10</h4>
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                        {analysis.mostCommonWords.map(w => (
                          <span key={w.word} style={{
                            padding: '6px 12px', borderRadius: 16,
                            background: 'var(--bg-hover, #2a2a3e)',
                            border: '1px solid var(--border-color, #444)',
                            fontSize: 13
                          }}>
                            {w.word} <span style={{ color: '#888' }}>×{w.count}</span>
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Readability Tab */}
              {activeTab === 'readability' && readability && (
                <div>
                  <h3 style={{ marginBottom: 16, fontSize: 16 }}>📖 可读性分析</h3>

                  <div style={{
                    padding: 24, borderRadius: 12, textAlign: 'center',
                    background: 'var(--bg-hover, #2a2a3e)',
                    border: `1px solid ${readability.score >= 60 ? '#10b981' : readability.score >= 40 ? '#f59e0b' : '#ef4444'}33`
                  }}>
                    <div style={{
                      fontSize: 64, fontWeight: 700,
                      color: readability.score >= 60 ? '#10b981' : readability.score >= 40 ? '#f59e0b' : '#ef4444'
                    }}>
                      {readability.score}
                    </div>
                    <div style={{ fontSize: 18, fontWeight: 600, margin: '8px 0' }}>
                      {readability.level}
                    </div>
                    <div style={{ color: 'var(--text-secondary, #888)' }}>
                      {readability.description}
                    </div>
                  </div>

                  <div style={{ marginTop: 20 }}>
                    <h4 style={{ marginBottom: 12 }}>分析指标</h4>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                      <StatCard label="平均句长" value={analysis.avgSentenceLength} icon={Clock} color="#7c6cf0" />
                      <StatCard label="词汇丰富度" value={`${Math.round((analysis.uniqueWords / Math.max(analysis.wordCount, 1)) * 100)}%`} icon={Sparkles} color="#10b981" />
                    </div>
                  </div>
                </div>
              )}

              {/* Keywords Tab */}
              {activeTab === 'keywords' && (
                <div>
                  <h3 style={{ marginBottom: 16, fontSize: 16 }}>🔑 关键词提取</h3>
                  {keywordSuggestions.length === 0 ? (
                    <div style={{ color: 'var(--text-secondary, #888)', textAlign: 'center', padding: 40 }}>
                      文本太短，无法提取关键词
                    </div>
                  ) : (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                      {keywordSuggestions.map((kw, idx) => (
                        <div key={kw.word} style={{
                          display: 'flex', alignItems: 'center', gap: 12,
                          padding: '10px 14px', borderRadius: 8,
                          background: 'var(--bg-hover, #2a2a3e)',
                          border: '1px solid var(--border-color, #444)'
                        }}>
                          <span style={{ width: 24, color: '#888', fontSize: 12 }}>{idx + 1}</span>
                          <span style={{ flex: 1, fontWeight: 500 }}>{kw.word}</span>
                          <div style={{
                            width: `${kw.relevance * 2}px`, height: 6, borderRadius: 3,
                            background: keywordColor(kw.relevance)
                          }} />
                          <span style={{ color: 'var(--text-secondary, #888)', fontSize: 12, minWidth: 40, textAlign: 'right' }}>
                            {kw.relevance}%
                          </span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* Suggestions Tab */}
              {activeTab === 'suggestions' && (
                <div>
                  <h3 style={{ marginBottom: 16, fontSize: 16 }}>💡 AI 改进建议</h3>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                    {aiSuggestions.map((suggestion, idx) => (
                      <div key={idx} style={{
                        padding: 14, borderRadius: 10,
                        background: idx === 0 && aiSuggestions.length === 1 ? 'rgba(16, 185, 129, 0.1)' :
                          'var(--bg-hover, #2a2a3e)',
                        border: `1px solid ${idx === 0 && aiSuggestions.length === 1 ? '#10b98133' : 'var(--border-color, #444)'}`,
                        display: 'flex', gap: 12
                      }}>
                        <div style={{
                          width: 36, height: 36, borderRadius: 8,
                          background: idx === 0 && aiSuggestions.length === 1 ? '#10b98122' : '#7c6cf022',
                          display: 'flex', alignItems: 'center', justifyContent: 'center',
                          flexShrink: 0
                        }}>
                          {idx === 0 && aiSuggestions.length === 1 ? (
                            <CheckCircle size={18} color="#10b981" />
                          ) : (
                            <Lightbulb size={18} color="#7c6cf0" />
                          )}
                        </div>
                        <div style={{ flex: 1 }}>
                          <div style={{ fontSize: 13 }}>{suggestion}</div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Tabs Navigation */}
              <div style={{
                position: 'sticky', bottom: 0, left: 0, right: 0,
                display: 'flex', gap: 4, padding: '12px 0',
                background: 'var(--bg-primary, #1a1a2e)',
                borderTop: '1px solid var(--border-color, #333)',
                marginTop: 20
              }}>
                {([
                  { id: 'overview', label: '📊 概览' },
                  { id: 'readability', label: '📖 可读性' },
                  { id: 'keywords', label: '🔑 关键词' },
                  { id: 'suggestions', label: '💡 建议' },
                ] as const).map(tab => (
                  <button key={tab.id} onClick={() => setActiveTab(tab.id)} style={{
                    flex: 1, padding: '10px',
                    borderRadius: 6, border: 'none',
                    background: activeTab === tab.id ? 'rgba(124, 108, 192, 0.2)' : 'var(--bg-hover, #2a2a3e)',
                    color: activeTab === tab.id ? '#7c6cf0' : '#888',
                    cursor: 'pointer', fontSize: 12, fontWeight: activeTab === tab.id ? 600 : 400
                  }}>
                    {tab.label}
                  </button>
                ))}
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  )
}
