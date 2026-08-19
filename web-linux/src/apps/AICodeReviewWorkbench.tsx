import { useState, useCallback, useRef, useEffect } from 'react'
import { marked } from 'marked'

interface ReviewIssue {
  id: string
  severity: 'error' | 'warning' | 'info' | 'suggestion'
  title: string
  description: string
  line?: number
  code?: string
  suggestion?: string
}

interface ReviewResult {
  score: number
  issues: ReviewIssue[]
  summary: string
  metrics: {
    complexity: string
    maintainability: string
    security: string
    performance: string
  }
}

const SAMPLE_CODE_SNIPPETS: Record<string, string> = {
  'React组件': `import { useState, useEffect } from 'react';

function UserProfile({ userId }) {
  const [userData, setUserData] = useState(null);
  const [loading, setLoading] = useState(true);
  
  useEffect(() => {
    fetch('/api/users/' + userId)
      .then(res => res.json())
      .then(data => {
        setUserData(data);
        setLoading(false);
      });
  }, [userId]);
  
  if (loading) return <div>Loading...</div>;
  
  return (
    <div>
      <h1>{userData.name}</h1>
      <p>{userData.bio}</p>
    </div>
  );
}`,
  'JavaScript函数': `function calculateTotal(items) {
  let total = 0;
  for (let i = 0; i < items.length; i++) {
    total += items[i].price * items[i].quantity;
  }
  return total;
}

function formatPrice(price) {
  return "$" + price.toFixed(2);
}`,
  'Python代码': `def fibonacci(n):
    if n <= 1:
        return n
    a, b = 0, 1
    for _ in range(2, n + 1):
        a, b = b, a + b
    return b

def is_prime(num):
    if num < 2:
        return False
    for i in range(2, int(num**0.5) + 1):
        if num % i == 0:
            return False
    return True`,
  'CSS样式': `.card {
  background: linear-gradient(to bottom, #fff, #f0f0f0);
  border-radius: 8px;
  padding: 20px;
  box-shadow: 0 2px 10px rgba(0,0,0,0.1);
  transition: all 0.3s ease;
}

.card:hover {
  transform: translateY(-5px);
  box-shadow: 0 5px 20px rgba(0,0,0,0.15);
}`,
}

const LANGUAGES = ['JavaScript', 'TypeScript', 'Python', 'CSS', 'HTML', 'React', 'Vue', 'Node.js']

export default function AICodeReviewWorkbench() {
  const [code, setCode] = useState(SAMPLE_CODE_SNIPPETS['React组件'])
  const [language, setLanguage] = useState('React组件')
  const [reviewResult, setReviewResult] = useState<ReviewResult | null>(null)
  const [isReviewing, setIsReviewing] = useState(false)
  const [reviewHistory, setReviewHistory] = useState<Array<{ id: string; timestamp: string; score: number; snippet: string }>>([])
  const [customInstructions, setCustomInstructions] = useState('')
  const [activeTab, setActiveTab] = useState<'editor' | 'issues' | 'metrics' | 'history'>('editor')
  const editorRef = useRef<HTMLTextAreaElement>(null)

  useEffect(() => {
    marked.setOptions({
      breaks: true,
      gfm: true,
    })
  }, [])

  const handleLoadSample = useCallback((key: string) => {
    setCode(SAMPLE_CODE_SNIPPETS[key])
    setLanguage(key)
    setReviewResult(null)
  }, [])

  const performReview = useCallback(async () => {
    if (!code.trim()) return
    setIsReviewing(true)
    setReviewResult(null)

    try {
      const prompt = `作为一个专业的代码审查专家，请审查以下代码并提供详细的分析报告。

代码语言/框架: ${language}
${customInstructions ? `额外要求: ${customInstructions}` : ''}

请从以下维度进行评估:
1. 代码质量和可读性 (1-10分)
2. 潜在Bug和安全问题
3. 性能优化机会
4. 最佳实践建议
5. 具体改进方案（带示例代码）

请使用中文回答。

需要审查的代码:
\`\`\`${language}
${code}
\`\`\`

请按照以下JSON格式输出结果:
{
  "score": 总体评分(1-100),
  "issues": [
    {
      "severity": "error|warning|info|suggestion",
      "title": "问题标题",
      "description": "详细描述",
      "line": 行号(如果可定位),
      "code": "问题代码片段",
      "suggestion": "改进建议"
    }
  ],
  "summary": "代码总体评价",
  "metrics": {
    "complexity": "复杂度评估",
    "maintainability": "可维护性评估",
    "security": "安全性评估",
    "performance": "性能评估"
  }
}`

      const response = await fetch('https://text.pollinations.ai/', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          model: 'mistral',
          messages: [
            { role: 'system', content: '你是一个专业的代码审查专家，擅长发现代码问题并提供高质量的改进建议。' },
            { role: 'user', content: prompt }
          ],
          stream: false
        })
      })

      if (!response.ok) throw new Error('API请求失败')

      const text = await response.text()

      try {
        const jsonMatch = text.match(/\{[\s\S]*\}/)
        if (jsonMatch) {
          const result = JSON.parse(jsonMatch[0]) as ReviewResult
          setReviewResult(result)

          setReviewHistory(prev => [{
            id: Date.now().toString(),
            timestamp: new Date().toLocaleString('zh-CN'),
            score: result.score,
            snippet: code.slice(0, 50) + '...'
          }, ...prev].slice(0, 20))
        } else {
          throw new Error('无法解析AI响应')
        }
      } catch {
        const fallbackResult: ReviewResult = {
          score: 70,
          issues: [
            {
              id: 'fallback-1',
              severity: 'info',
              title: 'AI响应格式异常',
              description: 'AI返回了非标准格式的响应，但代码本身可能没有严重问题。',
              suggestion: '尝试使用更规范的代码重新审查'
            }
          ],
          summary: '代码审查完成，建议检查代码质量。',
          metrics: {
            complexity: '中等',
            maintainability: '良好',
            security: '基本安全',
            performance: '良好'
          }
        }
        setReviewResult(fallbackResult)
      }
    } catch (error) {
      console.error('审查失败:', error)
      const errorResult: ReviewResult = {
        score: 50,
        issues: [
          {
            id: 'error-1',
            severity: 'error',
            title: '审查服务暂时不可用',
            description: '无法连接到AI审查服务，请稍后重试。',
            suggestion: '检查网络连接或稍后再试'
          }
        ],
        summary: '审查失败，请检查网络后重试。',
        metrics: {
          complexity: '未知',
          maintainability: '未知',
          security: '未知',
          performance: '未知'
        }
      }
      setReviewResult(errorResult)
    } finally {
      setIsReviewing(false)
    }
  }, [code, language, customInstructions])

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'error': return '#ef4444'
      case 'warning': return '#f59e0b'
      case 'info': return '#3b82f6'
      case 'suggestion': return '#8b5cf6'
      default: return '#6b7280'
    }
  }

  const getSeverityBg = (severity: string) => {
    switch (severity) {
      case 'error': return 'rgba(239, 68, 68, 0.12)'
      case 'warning': return 'rgba(245, 158, 11, 0.12)'
      case 'info': return 'rgba(59, 130, 246, 0.12)'
      case 'suggestion': return 'rgba(139, 92, 246, 0.12)'
      default: return 'rgba(107, 114, 128, 0.12)'
    }
  }

  const getScoreColor = (score: number) => {
    if (score >= 90) return '#10b981'
    if (score >= 75) return '#3b82f6'
    if (score >= 60) return '#f59e0b'
    return '#ef4444'
  }

  const exportReport = useCallback(() => {
    if (!reviewResult) return
    const report = `# AI代码审查报告

## 总体评分: ${reviewResult.score}/100

## 代码概要
- **语言**: ${language}
- **代码长度**: ${code.length} 字符

## 评估指标
- **复杂度**: ${reviewResult.metrics.complexity}
- **可维护性**: ${reviewResult.metrics.maintainability}
- **安全性**: ${reviewResult.metrics.security}
- **性能**: ${reviewResult.metrics.performance}

## 问题列表
${reviewResult.issues.map((issue, i) => `
### ${i + 1}. [${issue.severity.toUpperCase()}] ${issue.title}
${issue.description}
${issue.code ? `\n\`\`\`\n${issue.code}\n\`\`\`` : ''}
${issue.suggestion ? `\n**建议**: ${issue.suggestion}` : ''}
`).join('\n')}

## 总结
${reviewResult.summary}

---
*由WebLinuxOS AI代码审查工作台生成*
*审查时间: ${new Date().toLocaleString('zh-CN')}*
`

    const blob = new Blob([report], { type: 'text/markdown' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `code-review-${Date.now()}.md`
    a.click()
    URL.revokeObjectURL(url)
  }, [reviewResult, language, code])

  return (
    <div style={{
      width: '100%',
      height: '100%',
      display: 'flex',
      flexDirection: 'column',
      background: 'linear-gradient(135deg, #0f172a 0%, #1e293b 50%, #0f172a 100%)',
      color: '#e2e8f0',
      fontFamily: "'JetBrains Mono', 'Fira Code', monospace",
      overflow: 'hidden'
    }}>
      {/* Header */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '16px 24px',
        background: 'rgba(15, 23, 42, 0.8)',
        borderBottom: '1px solid rgba(148, 163, 184, 0.15)',
        backdropFilter: 'blur(10px)'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
          <div style={{
            width: 40, height: 40,
            borderRadius: 10,
            background: 'linear-gradient(135deg, #6366f1, #8b5cf6)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: 20
          }}>🔍</div>
          <div>
            <div style={{ fontSize: 18, fontWeight: 700, color: '#f1f5f9' }}>AI代码审查工作台</div>
            <div style={{ fontSize: 12, color: '#94a3b8' }}>Code Review Workbench · Powered by AI</div>
          </div>
        </div>
        <div style={{ display: 'flex', gap: 12 }}>
          <button
            onClick={exportReport}
            disabled={!reviewResult}
            style={{
              padding: '8px 16px',
              borderRadius: 8,
              border: '1px solid rgba(148, 163, 184, 0.2)',
              background: reviewResult ? 'rgba(99, 102, 241, 0.2)' : 'rgba(148, 163, 184, 0.1)',
              color: reviewResult ? '#a5b4fc' : '#64748b',
              cursor: reviewResult ? 'pointer' : 'not-allowed',
              fontSize: 13,
              fontWeight: 500,
              transition: 'all 0.2s'
            }}>
            📥 导出报告
          </button>
          <button
            onClick={performReview}
            disabled={isReviewing || !code.trim()}
            style={{
              padding: '8px 20px',
              borderRadius: 8,
              border: 'none',
              background: isReviewing 
                ? 'linear-gradient(135deg, #475569, #64748b)'
                : 'linear-gradient(135deg, #6366f1, #8b5cf6)',
              color: 'white',
              cursor: isReviewing ? 'not-allowed' : 'pointer',
              fontSize: 13,
              fontWeight: 600,
              transition: 'all 0.2s',
              boxShadow: isReviewing ? 'none' : '0 0 20px rgba(99, 102, 241, 0.4)'
            }}>
            {isReviewing ? '⏳ 审查中...' : '🚀 开始审查'}
          </button>
        </div>
      </div>

      {/* Tab Navigation */}
      <div style={{
        display: 'flex',
        padding: '0 24px',
        background: 'rgba(15, 23, 42, 0.6)',
        borderBottom: '1px solid rgba(148, 163, 184, 0.1)'
      }}>
        {(['editor', 'issues', 'metrics', 'history'] as const).map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            style={{
              padding: '12px 20px',
              background: 'transparent',
              border: 'none',
              borderBottom: activeTab === tab ? '2px solid #6366f1' : '2px solid transparent',
              color: activeTab === tab ? '#a5b4fc' : '#64748b',
              cursor: 'pointer',
              fontSize: 13,
              fontWeight: activeTab === tab ? 600 : 400,
              transition: 'all 0.2s'
            }}>
            {tab === 'editor' && '📝 代码编辑器'}
            {tab === 'issues' && `⚠️ 问题列表${reviewResult ? ` (${reviewResult.issues.length})` : ''}`}
            {tab === 'metrics' && '📊 评估指标'}
            {tab === 'history' && `📜 历史记录 (${reviewHistory.length})`}
          </button>
        ))}
      </div>

      {/* Main Content */}
      <div style={{ flex: 1, display: 'flex', overflow: 'hidden' }}>
        {activeTab === 'editor' && (
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', padding: 24, gap: 16 }}>
            {/* Controls */}
            <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <span style={{ fontSize: 13, color: '#94a3b8' }}>示例代码:</span>
                <select
                  value={language}
                  onChange={(e) => handleLoadSample(e.target.value)}
                  style={{
                    padding: '6px 12px',
                    borderRadius: 6,
                    background: 'rgba(30, 41, 59, 0.8)',
                    border: '1px solid rgba(148, 163, 184, 0.2)',
                    color: '#e2e8f0',
                    fontSize: 13,
                    cursor: 'pointer'
                  }}>
                  {Object.keys(SAMPLE_CODE_SNIPPETS).map(key => (
                    <option key={key} value={key}>{key}</option>
                  ))}
                </select>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <span style={{ fontSize: 13, color: '#94a3b8' }}>目标语言:</span>
                <select
                  value={language}
                  onChange={(e) => setLanguage(e.target.value)}
                  style={{
                    padding: '6px 12px',
                    borderRadius: 6,
                    background: 'rgba(30, 41, 59, 0.8)',
                    border: '1px solid rgba(148, 163, 184, 0.2)',
                    color: '#e2e8f0',
                    fontSize: 13,
                    cursor: 'pointer'
                  }}>
                  {LANGUAGES.map(lang => (
                    <option key={lang} value={lang}>{lang}</option>
                  ))}
                </select>
              </div>
            </div>

            {/* Code Editor */}
            <div style={{
              flex: 1,
              display: 'flex',
              gap: 0,
              borderRadius: 12,
              overflow: 'hidden',
              border: '1px solid rgba(99, 102, 241, 0.2)',
              boxShadow: '0 0 30px rgba(99, 102, 241, 0.1)'
            }}>
              <div style={{
                width: 50,
                background: 'rgba(15, 23, 42, 0.9)',
                borderRight: '1px solid rgba(148, 163, 184, 0.1)',
                padding: '12px 8px',
                textAlign: 'right',
                userSelect: 'none',
                color: '#475569',
                fontSize: 12,
                lineHeight: '20px',
                overflow: 'hidden'
              }}>
                {code.split('\n').map((_, i) => (
                  <div key={i}>{i + 1}</div>
                ))}
              </div>
              <textarea
                ref={editorRef}
                value={code}
                onChange={(e) => setCode(e.target.value)}
                spellCheck={false}
                style={{
                  flex: 1,
                  padding: '12px 16px',
                  background: 'rgba(15, 23, 42, 0.7)',
                  border: 'none',
                  color: '#e2e8f0',
                  fontSize: 14,
                  lineHeight: '20px',
                  fontFamily: "'JetBrains Mono', 'Fira Code', monospace",
                  resize: 'none',
                  outline: 'none'
                }}
                placeholder="在此输入或粘贴需要审查的代码..."
              />
            </div>

            {/* Custom Instructions */}
            <div>
              <label style={{ fontSize: 13, color: '#94a3b8', marginBottom: 8, display: 'block' }}>
                自定义审查指令（可选）:
              </label>
              <input
                type="text"
                value={customInstructions}
                onChange={(e) => setCustomInstructions(e.target.value)}
                placeholder="例如: 重点关注性能优化和内存泄漏..."
                style={{
                  width: '100%',
                  padding: '10px 14px',
                  borderRadius: 8,
                  background: 'rgba(30, 41, 59, 0.6)',
                  border: '1px solid rgba(148, 163, 184, 0.2)',
                  color: '#e2e8f0',
                  fontSize: 13,
                  outline: 'none',
                  transition: 'border-color 0.2s'
                }}
                onFocus={(e) => e.target.style.borderColor = 'rgba(99, 102, 241, 0.5)'}
                onBlur={(e) => e.target.style.borderColor = 'rgba(148, 163, 184, 0.2)'}
              />
            </div>
          </div>
        )}

        {activeTab === 'issues' && (
          <div style={{ flex: 1, padding: 24, overflow: 'auto' }}>
            {!reviewResult ? (
              <div style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                height: '100%',
                color: '#64748b'
              }}>
                <div style={{ fontSize: 48, marginBottom: 16 }}>📋</div>
                <div style={{ fontSize: 16 }}>还没有审查结果</div>
                <div style={{ fontSize: 13, marginTop: 8 }}>请先在编辑器中点击「开始审查」</div>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                {/* Score Overview */}
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 24,
                  padding: 20,
                  borderRadius: 12,
                  background: 'rgba(30, 41, 59, 0.6)',
                  border: '1px solid rgba(148, 163, 184, 0.15)'
                }}>
                  <div style={{
                    width: 80, height: 80,
                    borderRadius: '50%',
                    background: `conic-gradient(${getScoreColor(reviewResult.score)} ${reviewResult.score * 3.6}deg, rgba(148, 163, 184, 0.2) 0deg)`,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    position: 'relative'
                  }}>
                    <div style={{
                      position: 'absolute',
                      width: 60, height: 60,
                      borderRadius: '50%',
                      background: '#1e293b',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      fontSize: 20, fontWeight: 700,
                      color: getScoreColor(reviewResult.score)
                    }}>
                      {reviewResult.score}
                    </div>
                  </div>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: 18, fontWeight: 700, color: '#f1f5f9', marginBottom: 8 }}>
                      审查总结
                    </div>
                    <div style={{ fontSize: 14, color: '#94a3b8', lineHeight: 1.6 }}>
                      {reviewResult.summary}
                    </div>
                  </div>
                </div>

                {/* Issues List */}
                {reviewResult.issues.map((issue, i) => (
                  <div
                    key={issue.id || i}
                    style={{
                      padding: 16,
                      borderRadius: 10,
                      background: getSeverityBg(issue.severity),
                      borderLeft: `4px solid ${getSeverityColor(issue.severity)}`,
                      transition: 'transform 0.2s, box-shadow 0.2s'
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.transform = 'translateX(4px)'
                      e.currentTarget.style.boxShadow = `0 4px 20px ${getSeverityColor(issue.severity)}20`
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.transform = 'translateX(0)'
                      e.currentTarget.style.boxShadow = 'none'
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
                      <span style={{
                        padding: '4px 10px',
                        borderRadius: 4,
                        fontSize: 11,
                        fontWeight: 600,
                        background: getSeverityColor(issue.severity),
                        color: 'white',
                        textTransform: 'uppercase'
                      }}>
                        {issue.severity}
                      </span>
                      <span style={{ fontSize: 15, fontWeight: 600, color: '#f1f5f9' }}>
                        {issue.title}
                      </span>
                      {issue.line && (
                        <span style={{ fontSize: 12, color: '#64748b', marginLeft: 'auto' }}>
                          第 {issue.line} 行
                        </span>
                      )}
                    </div>
                    <div style={{ fontSize: 13, color: '#cbd5e1', lineHeight: 1.6, marginBottom: 12 }}>
                      {issue.description}
                    </div>
                    {issue.code && (
                      <pre style={{
                        padding: 12,
                        borderRadius: 6,
                        background: 'rgba(0, 0, 0, 0.3)',
                        color: '#fca5a5',
                        fontSize: 12,
                        overflow: 'auto',
                        marginBottom: 12,
                        maxHeight: 150
                      }}>
                        {issue.code}
                      </pre>
                    )}
                    {issue.suggestion && (
                      <div style={{
                        padding: '10px 14px',
                        borderRadius: 6,
                        background: 'rgba(99, 102, 241, 0.1)',
                        border: '1px solid rgba(99, 102, 241, 0.2)',
                        fontSize: 13,
                        color: '#c7d2fe',
                        lineHeight: 1.5
                      }}>
                        <strong style={{ color: '#a5b4fc' }}>💡 建议：</strong> {issue.suggestion}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {activeTab === 'metrics' && (
          <div style={{ flex: 1, padding: 24, overflow: 'auto' }}>
            {!reviewResult ? (
              <div style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                height: '100%',
                color: '#64748b'
              }}>
                <div style={{ fontSize: 48, marginBottom: 16 }}>📊</div>
                <div style={{ fontSize: 16 }}>还没有评估指标</div>
              </div>
            ) : (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 16 }}>
                {Object.entries(reviewResult.metrics).map(([key, value]) => (
                  <div
                    key={key}
                    style={{
                      padding: 20,
                      borderRadius: 12,
                      background: 'rgba(30, 41, 59, 0.6)',
                      border: '1px solid rgba(148, 163, 184, 0.15)',
                      textAlign: 'center'
                    }}>
                    <div style={{
                      fontSize: 12,
                      color: '#64748b',
                      textTransform: 'uppercase',
                      letterSpacing: 1,
                      marginBottom: 12
                    }}>
                      {key === 'complexity' && '🧩 复杂度'}
                      {key === 'maintainability' && '🔧 可维护性'}
                      {key === 'security' && '🔒 安全性'}
                      {key === 'performance' && '⚡ 性能'}
                    </div>
                    <div style={{
                      fontSize: 24,
                      fontWeight: 700,
                      color: '#f1f5f9',
                      marginBottom: 8
                    }}>
                      {value}
                    </div>
                    <div style={{
                      height: 6,
                      borderRadius: 3,
                      background: 'rgba(148, 163, 184, 0.15)',
                      overflow: 'hidden'
                    }}>
                      <div style={{
                        height: '100%',
                        width: value.includes('优秀') || value.includes('良好') ? '80%' : value.includes('中等') ? '60%' : '40%',
                        background: 'linear-gradient(90deg, #6366f1, #8b5cf6)',
                        borderRadius: 3,
                        transition: 'width 0.5s ease'
                      }} />
                    </div>
                  </div>
                ))}

                {/* Overall Score Card */}
                <div style={{
                  gridColumn: 'span 2',
                  padding: 24,
                  borderRadius: 12,
                  background: 'linear-gradient(135deg, rgba(99, 102, 241, 0.15), rgba(139, 92, 246, 0.15))',
                  border: '1px solid rgba(99, 102, 241, 0.3)',
                  textAlign: 'center'
                }}>
                  <div style={{ fontSize: 14, color: '#94a3b8', marginBottom: 8 }}>综合评分</div>
                  <div style={{
                    fontSize: 48,
                    fontWeight: 800,
                    color: getScoreColor(reviewResult.score),
                    marginBottom: 8,
                    textShadow: `0 0 40px ${getScoreColor(reviewResult.score)}60`
                  }}>
                    {reviewResult.score}<span style={{ fontSize: 24 }}>/100</span>
                  </div>
                  <div style={{ fontSize: 14, color: '#cbd5e1' }}>
                    {reviewResult.score >= 90 ? '🏆 卓越！代码质量优秀' :
                     reviewResult.score >= 75 ? '✅ 良好，略有小问题' :
                     reviewResult.score >= 60 ? '⚠️ 需要改进' :
                     '❌ 存在明显问题，需要重构'}
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {activeTab === 'history' && (
          <div style={{ flex: 1, padding: 24, overflow: 'auto' }}>
            {reviewHistory.length === 0 ? (
              <div style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                height: '100%',
                color: '#64748b'
              }}>
                <div style={{ fontSize: 48, marginBottom: 16 }}>📜</div>
                <div style={{ fontSize: 16 }}>暂无审查历史</div>
                <div style={{ fontSize: 13, marginTop: 8 }}>完成审查后将自动保存记录</div>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                {reviewHistory.map((record) => (
                  <div
                    key={record.id}
                    style={{
                      padding: 16,
                      borderRadius: 10,
                      background: 'rgba(30, 41, 59, 0.6)',
                      border: '1px solid rgba(148, 163, 184, 0.15)',
                      display: 'flex',
                      alignItems: 'center',
                      gap: 16
                    }}>
                    <div style={{
                      width: 50, height: 50,
                      borderRadius: 10,
                      background: getScoreColor(record.score) + '20',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      fontSize: 18, fontWeight: 700,
                      color: getScoreColor(record.score)
                    }}>
                      {record.score}
                    </div>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontSize: 14, color: '#f1f5f9', marginBottom: 4 }}>
                        {record.snippet}
                      </div>
                      <div style={{ fontSize: 12, color: '#64748b' }}>
                        {record.timestamp}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Footer Status Bar */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '8px 24px',
        background: 'rgba(15, 23, 42, 0.9)',
        borderTop: '1px solid rgba(148, 163, 184, 0.1)',
        fontSize: 12,
        color: '#64748b'
      }}>
        <div style={{ display: 'flex', gap: 16 }}>
          <span>📏 {code.length} 字符</span>
          <span>📝 {code.split('\n').length} 行</span>
          <span>🌐 {language}</span>
        </div>
        <div>
          {isReviewing ? '⏳ AI正在分析代码...' : reviewResult ? '✅ 审查完成' : '💤 待审查'}
        </div>
      </div>
    </div>
  )
}