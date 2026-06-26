import { useState, useCallback, useEffect } from 'react'
import { useStore } from '../store'

interface CodeMetrics {
  complexity: number
  readability: number
  maintainability: number
  linesOfCode: number
  functions: number
  comments: number
}

interface AnalysisIssue {
  id: string
  type: 'bug' | 'warning' | 'suggestion' | 'style'
  severity: 'high' | 'medium' | 'low'
  line?: number
  title: string
  description: string
  fix?: string
}

interface ImprovementSuggestion {
  category: string
  suggestion: string
  priority: 'high' | 'medium' | 'low'
  impact: string
}

interface AnalysisResult {
  metrics: CodeMetrics
  issues: AnalysisIssue[]
  suggestions: ImprovementSuggestion[]
  summary: string
  score: number
}

const SAMPLE_CODE: Record<string, string> = {
  JavaScript: `// JavaScript 示例代码
function calculateTotal(items) {
  var total = 0;
  for (var i = 0; i < items.length; i++) {
    total = total + items[i].price * items[i].quantity;
  }
  return total;
}

const cartItems = [
  { name: '商品A', price: 100, quantity: 2 },
  { name: '商品B', price: 50, quantity: 3 }
];

console.log(calculateTotal(cartItems));`,
  Python: `# Python 示例代码
def process_data(data):
    result = []
    for item in data:
        if item > 0:
            result.append(item * 2)
    return result

numbers = [1, -2, 3, 4, -5]
processed = process_data(numbers)
print(processed)`,
  TypeScript: `// TypeScript 示例代码
interface User {
  id: number
  name: string
  email: string
  age: number
}

function filterAdultUsers(users: User[]): User[] {
  const adults = []
  for (const user of users) {
    if (user.age >= 18) {
      adults.push(user)
    }
  }
  return adults
}

const userList: User[] = [
  { id: 1, name: '张三', email: 'zhang@example.com', age: 25 },
  { id: 2, name: '李四', email: 'li@example.com', age: 16 }
]

console.log(filterAdultUsers(userList))`
}

const LANGUAGES = ['JavaScript', 'Python', 'TypeScript']

export default function AICodeAnalyzer() {
  const theme = useStore((s) => s.theme)
  const [code, setCode] = useState(SAMPLE_CODE.JavaScript)
  const [language, setLanguage] = useState('JavaScript')
  const [isAnalyzing, setIsAnalyzing] = useState(false)
  const [result, setResult] = useState<AnalysisResult | null>(null)
  const [activeTab, setActiveTab] = useState<'issues' | 'suggestions' | 'metrics'>('issues')

  const analyzeCode = useCallback(() => {
    if (!code.trim()) return

    setIsAnalyzing(true)

    // 模拟AI分析过程
    setTimeout(() => {
      const lines = code.split('\n')
      const lineCount = lines.length
      const nonEmptyLines = lines.filter(l => l.trim()).length
      const commentLines = lines.filter(l => {
        const trimmed = l.trim()
        if (language === 'Python') return trimmed.startsWith('#')
        return trimmed.startsWith('//') || trimmed.startsWith('/*') || trimmed.startsWith('*')
      }).length

      // 计算函数数量
      let functionCount = 0
      if (language === 'Python') {
        functionCount = (code.match(/def\s+\w+/g) || []).length
      } else {
        functionCount = (code.match(/function\s+\w+|=>/g) || []).length
      }

      // 计算复杂度
      const loops = (code.match(/\b(for|while)\b/gi) || []).length
      const conditionals = (code.match(/\b(if|else|switch|case)\b/gi) || []).length
      const complexity = loops * 2 + conditionals

      // 生成问题列表
      const issues: AnalysisIssue[] = []

      // JavaScript/TypeScript 特定检查
      if (language === 'JavaScript' || language === 'TypeScript') {
        if (code.includes('var ')) {
          const varLine = lines.findIndex(l => l.includes('var '))
          issues.push({
            id: 'var-usage',
            type: 'style',
            severity: 'medium',
            line: varLine + 1,
            title: '使用 var 声明变量',
            description: 'var 声明存在变量提升问题，可能导致意外的行为',
            fix: '将 var 替换为 const 或 let'
          })
        }

        if (/==[^=]/.test(code) && !code.includes('===')) {
          const eqLine = lines.findIndex(l => /==[^=]/.test(l))
          issues.push({
            id: 'loose-equality',
            type: 'bug',
            severity: 'high',
            line: eqLine + 1,
            title: '使用宽松相等比较',
            description: '使用 == 可能导致类型转换问题，例如 0 == "" 为 true',
            fix: '使用 === 进行严格相等比较'
          })
        }

        if (code.includes('console.log') && functionCount > 0) {
          issues.push({
            id: 'console-log',
            type: 'suggestion',
            severity: 'low',
            title: '生产环境中的 console.log',
            description: 'console.log 调用在生产环境可能影响性能',
            fix: '使用条件编译或移除调试代码'
          })
        }
      }

      // Python 特定检查
      if (language === 'Python') {
        if (code.includes('print(') && code.includes('def ')) {
          issues.push({
            id: 'print-statement',
            type: 'suggestion',
            severity: 'low',
            title: '使用 print 输出',
            description: '建议使用 logging 模块替代 print 进行日志记录',
            fix: '使用 import logging 和 logging.info()'
          })
        }

        if (!code.includes('"""') && !code.includes("'''") && functionCount > 0) {
          issues.push({
            id: 'missing-docstring',
            type: 'suggestion',
            severity: 'medium',
            title: '缺少函数文档字符串',
            description: 'Python 函数建议添加 docstring 说明功能',
            fix: '在函数定义后添加 """说明"""'
          })
        }
      }

      // 通用检查
      if (loops > 2) {
        issues.push({
          id: 'nested-loops',
          type: 'warning',
          severity: 'medium',
          title: '多个循环结构',
          description: '多个循环可能增加代码复杂度，考虑使用数组方法优化',
          fix: '考虑使用 map、reduce、filter 等高阶函数'
        })
      }

      if (commentLines < nonEmptyLines * 0.1) {
        issues.push({
          id: 'low-comments',
          type: 'suggestion',
          severity: 'low',
          title: '注释覆盖率较低',
          description: `当前仅有 ${commentLines} 行注释，建议增加关键逻辑说明`,
          fix: '添加注释说明复杂逻辑和关键步骤'
        })
      }

      if (nonEmptyLines > 50 && functionCount < 2) {
        issues.push({
          id: 'large-function',
          type: 'warning',
          severity: 'medium',
          title: '代码过于冗长',
          description: '建议将长代码拆分为多个函数以提高可维护性',
          fix: '提取重复逻辑为独立函数'
        })
      }

      // 检查潜在bug
      if (/for\s*\([^)]*\.\s*length/.test(code)) {
        issues.push({
          id: 'length-in-loop',
          type: 'warning',
          severity: 'low',
          line: lines.findIndex(l => /for\s*\([^)]*\.\s*length/.test(l)) + 1,
          title: '循环中访问 .length',
          description: '每次迭代都访问 .length 属性，可能影响性能',
          fix: '缓存 length 到局部变量: const len = arr.length'
        })
      }

      // 生成改进建议
      const suggestions: ImprovementSuggestion[] = []

      if (language === 'JavaScript' || language === 'TypeScript') {
        suggestions.push({
          category: '现代语法',
          suggestion: '使用箭头函数替代传统函数表达式',
          priority: 'medium',
          impact: '提高代码简洁性和可读性'
        })

        suggestions.push({
          category: '数组操作',
          suggestion: '使用 reduce 方法替代手动累加循环',
          priority: 'high',
          impact: '代码更简洁，减少出错概率'
        })

        suggestions.push({
          category: '类型安全',
          suggestion: '添加 TypeScript 类型注解以获得更好的类型检查',
          priority: 'high',
          impact: '在编译时发现潜在类型错误'
        })
      }

      if (language === 'Python') {
        suggestions.push({
          category: '列表操作',
          suggestion: '使用列表推导式替代手动 append 循环',
          priority: 'high',
          impact: '代码更简洁高效'
        })

        suggestions.push({
          category: '类型提示',
          suggestion: '添加 Type Hints 提高代码可读性',
          priority: 'medium',
          impact: '更好的 IDE 支持和代码文档'
        })
      }

      // 通用建议
      suggestions.push({
        category: '代码组织',
        suggestion: '将代码拆分为多个模块/文件以提高可维护性',
        priority: 'medium',
        impact: '便于测试和维护'
      })

      suggestions.push({
        category: '测试覆盖',
        suggestion: '添加单元测试确保代码功能正确',
        priority: 'high',
        impact: '提高代码可靠性和质量'
      })

      suggestions.push({
        category: '错误处理',
        suggestion: '添加适当的错误处理和边界检查',
        priority: 'medium',
        impact: '提高代码健壮性'
      })

      // 计算指标分数
      const readabilityScore = Math.min(100, 100 - (complexity * 3) + (commentLines * 2))
      const maintainabilityScore = Math.min(100, 
        100 - (lineCount > 50 ? 20 : 0) - (complexity * 2) + (functionCount > 1 ? 10 : 0)
      )
      const overallScore = Math.round((readabilityScore + maintainabilityScore) / 2)

      const metrics: CodeMetrics = {
        complexity: Math.min(10, complexity),
        readability: Math.max(0, readabilityScore),
        maintainability: Math.max(0, maintainabilityScore),
        linesOfCode: lineCount,
        functions: functionCount,
        comments: commentLines
      }

      const summary = overallScore >= 80 
        ? '代码质量优秀！结构清晰，建议保持当前编码风格。'
        : overallScore >= 60
        ? '代码质量良好，有一些可以改进的地方。'
        : overallScore >= 40
        ? '代码质量一般，建议重点关注高优先级问题。'
        : '代码需要改进，请仔细审查发现的问题。'

      setResult({
        metrics,
        issues,
        suggestions,
        summary,
        score: overallScore
      })

      setIsAnalyzing(false)
    }, 1500)
  }, [code, language])

  // 自动分析（带防抖）
  useEffect(() => {
    const timer = setTimeout(() => {
      if (code.trim()) {
        analyzeCode()
      }
    }, 2000)
    return () => clearTimeout(timer)
  }, [code, language, analyzeCode])

  const loadSampleCode = useCallback((lang: string) => {
    setLanguage(lang)
    setCode(SAMPLE_CODE[lang])
    setResult(null)
  }, [])

  const getScoreColor = (score: number) => {
    if (score >= 80) return '#4ade80'
    if (score >= 60) return '#facc15'
    if (score >= 40) return '#f97316'
    return '#ef4444'
  }

  const getIssueTypeIcon = (type: AnalysisIssue['type']) => {
    switch (type) {
      case 'bug': return '🐛'
      case 'warning': return '⚠️'
      case 'suggestion': return '💡'
      case 'style': return '🎨'
      default: return '📝'
    }
  }

  const getSeverityColor = (severity: AnalysisIssue['severity']) => {
    switch (severity) {
      case 'high': return '#ef4444'
      case 'medium': return '#f97316'
      case 'low': return '#facc15'
      default: return '#94a3b8'
    }
  }

  const getPriorityColor = (priority: ImprovementSuggestion['priority']) => {
    switch (priority) {
      case 'high': return '#ef4444'
      case 'medium': return '#f97316'
      case 'low': return '#facc15'
      default: return '#94a3b8'
    }
  }

  const isDark = theme === 'dark'
  const bgColor = isDark ? '#0f172a' : '#f8fafc'
  const textColor = isDark ? '#e2e8f0' : '#1e293b'
  const borderColor = isDark ? '#1e293b' : '#e2e8f0'
  const cardBg = isDark ? '#1e293b' : '#ffffff'
  const accentColor = '#6366f1'

  return (
    <div 
      className="app-container"
      style={{
        display: 'flex',
        flexDirection: 'column',
        height: '100%',
        background: bgColor,
        color: textColor,
        overflow: 'hidden'
      }}
    >
      {/* Header */}
      <div style={{
        padding: '16px 20px',
        borderBottom: `1px solid ${borderColor}`,
        background: cardBg,
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        flexShrink: 0
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <span style={{ fontSize: '28px' }}>🤖</span>
          <div>
            <div style={{ fontWeight: 700, fontSize: '18px' }}>AI 代码分析器</div>
            <div style={{ fontSize: '12px', color: isDark ? '#94a3b8' : '#64748b' }}>
              专业代码质量分析与改进建议
            </div>
          </div>
        </div>

        <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
          <select
            value={language}
            onChange={(e) => setLanguage(e.target.value)}
            style={{
              padding: '8px 12px',
              borderRadius: '6px',
              border: `1px solid ${borderColor}`,
              background: bgColor,
              color: textColor,
              fontSize: '13px',
              cursor: 'pointer'
            }}
          >
            {LANGUAGES.map(lang => (
              <option key={lang} value={lang}>{lang}</option>
            ))}
          </select>

          <button
            onClick={analyzeCode}
            disabled={isAnalyzing || !code.trim()}
            style={{
              padding: '10px 20px',
              borderRadius: '8px',
              border: 'none',
              background: isAnalyzing ? '#64748b' : accentColor,
              color: '#fff',
              cursor: isAnalyzing ? 'not-allowed' : 'pointer',
              fontSize: '14px',
              fontWeight: 600,
              display: 'flex',
              alignItems: 'center',
              gap: '8px'
            }}
          >
            {isAnalyzing ? (
              <>
                <span style={{ animation: 'spin 1s linear infinite' }}>⏳</span>
                分析中...
              </>
            ) : (
              <>
                <span>🔍</span>
                开始分析
              </>
            )}
          </button>
        </div>
      </div>

      {/* Main Content */}
      <div style={{ display: 'flex', flex: 1, overflow: 'hidden' }}>
        {/* Left: Code Editor */}
        <div style={{ 
          flex: 1, 
          display: 'flex', 
          flexDirection: 'column', 
          borderRight: `1px solid ${borderColor}` 
        }}>
          {/* Editor Toolbar */}
          <div style={{
            padding: '12px 16px',
            borderBottom: `1px solid ${borderColor}`,
            background: isDark ? '#1a2332' : '#f1f5f9',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center'
          }}>
            <span style={{ fontWeight: 600, fontSize: '13px' }}>代码输入</span>
            <div style={{ display: 'flex', gap: '8px' }}>
              {LANGUAGES.map(lang => (
                <button
                  key={lang}
                  onClick={() => loadSampleCode(lang)}
                  style={{
                    padding: '6px 12px',
                    borderRadius: '6px',
                    border: `1px solid ${borderColor}`,
                    background: language === lang ? accentColor : 'transparent',
                    color: language === lang ? '#fff' : textColor,
                    cursor: 'pointer',
                    fontSize: '12px',
                    transition: 'all 0.2s'
                  }}
                >
                  {lang} 示例
                </button>
              ))}
            </div>
          </div>

          {/* Code Area */}
          <textarea
            value={code}
            onChange={(e) => setCode(e.target.value)}
            placeholder="在此粘贴或输入代码进行分析..."
            spellCheck={false}
            style={{
              flex: 1,
              padding: '16px',
              border: 'none',
              outline: 'none',
              resize: 'none',
              fontFamily: '"JetBrains Mono", "Fira Code", "Monaco", monospace',
              fontSize: '14px',
              lineHeight: '1.6',
              background: bgColor,
              color: textColor,
              whiteSpace: 'pre'
            }}
          />

          {/* Stats Bar */}
          <div style={{
            padding: '10px 16px',
            borderTop: `1px solid ${borderColor}`,
            background: isDark ? '#1a2332' : '#f1f5f9',
            fontSize: '12px',
            color: isDark ? '#94a3b8' : '#64748b',
            display: 'flex',
            gap: '16px'
          }}>
            <span>📊 {code.split('\n').length} 行</span>
            <span>📝 {code.length} 字符</span>
            <span>🔧 {language}</span>
          </div>
        </div>

        {/* Right: Results */}
        <div style={{ 
          width: '480px', 
          display: 'flex', 
          flexDirection: 'column', 
          background: isDark ? '#111827' : '#f8fafc',
          overflow: 'hidden'
        }}>
          {/* Score Section */}
          {result && (
            <div style={{
              padding: '20px',
              borderBottom: `1px solid ${borderColor}`,
              background: cardBg
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                  <div style={{ fontWeight: 600, fontSize: '14px', marginBottom: '4px' }}>
                    代码质量评分
                  </div>
                  <div style={{ fontSize: '12px', color: isDark ? '#94a3b8' : '#64748b' }}>
                    {result.summary}
                  </div>
                </div>
                <div 
                  style={{
                    fontSize: '48px',
                    fontWeight: 800,
                    color: getScoreColor(result.score),
                    textShadow: `0 0 20px ${getScoreColor(result.score)}33`
                  }}
                >
                  {result.score}
                </div>
              </div>

              <div style={{
                height: '8px',
                background: isDark ? '#334155' : '#e2e8f0',
                borderRadius: '4px',
                overflow: 'hidden',
                marginTop: '12px'
              }}>
                <div 
                  style={{
                    height: '100%',
                    width: `${result.score}%`,
                    background: `linear-gradient(90deg, ${getScoreColor(result.score)}, ${getScoreColor(result.score)}99)`,
                    borderRadius: '4px',
                    transition: 'width 0.5s ease'
                  }}
                />
              </div>
            </div>
          )}

          {/* Tabs */}
          {result && (
            <div style={{
              display: 'flex',
              borderBottom: `1px solid ${borderColor}`,
              background: isDark ? '#1a2332' : '#f1f5f9'
            }}>
              <button
                onClick={() => setActiveTab('issues')}
                style={{
                  flex: 1,
                  padding: '12px',
                  border: 'none',
                  background: activeTab === 'issues' ? accentColor : 'transparent',
                  color: activeTab === 'issues' ? '#fff' : textColor,
                  cursor: 'pointer',
                  fontSize: '13px',
                  fontWeight: 600
                }}
              >
                🐛 问题 ({result.issues.length})
              </button>
              <button
                onClick={() => setActiveTab('suggestions')}
                style={{
                  flex: 1,
                  padding: '12px',
                  border: 'none',
                  background: activeTab === 'suggestions' ? accentColor : 'transparent',
                  color: activeTab === 'suggestions' ? '#fff' : textColor,
                  cursor: 'pointer',
                  fontSize: '13px',
                  fontWeight: 600
                }}
              >
                💡 建议 ({result.suggestions.length})
              </button>
              <button
                onClick={() => setActiveTab('metrics')}
                style={{
                  flex: 1,
                  padding: '12px',
                  border: 'none',
                  background: activeTab === 'metrics' ? accentColor : 'transparent',
                  color: activeTab === 'metrics' ? '#fff' : textColor,
                  cursor: 'pointer',
                  fontSize: '13px',
                  fontWeight: 600
                }}
              >
                📊 指标
              </button>
            </div>
          )}

          {/* Content Area */}
          <div style={{ flex: 1, overflow: 'auto', padding: '16px' }}>
            {isAnalyzing && !result && (
              <div style={{
                textAlign: 'center',
                padding: '60px 20px',
                color: isDark ? '#94a3b8' : '#64748b'
              }}>
                <div style={{ fontSize: '48px', marginBottom: '16px', animation: 'spin 1s linear infinite' }}>
                  ⏳
                </div>
                <div style={{ fontSize: '16px' }}>正在分析代码...</div>
              </div>
            )}

            {!isAnalyzing && !result && (
              <div style={{
                textAlign: 'center',
                padding: '60px 20px',
                color: isDark ? '#94a3b8' : '#64748b'
              }}>
                <div style={{ fontSize: '64px', marginBottom: '16px' }}>🤖</div>
                <div style={{ fontSize: '16px', marginBottom: '8px', fontWeight: 600 }}>
                  输入代码开始分析
                </div>
                <div style={{ fontSize: '13px' }}>
                  支持 JavaScript、Python、TypeScript
                </div>
              </div>
            )}

            {result && activeTab === 'issues' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                {result.issues.length === 0 ? (
                  <div style={{
                    textAlign: 'center',
                    padding: '40px 20px',
                    background: isDark ? '#1e293b' : '#ffffff',
                    borderRadius: '12px',
                    border: `1px solid ${borderColor}`
                  }}>
                    <div style={{ fontSize: '40px', marginBottom: '12px' }}>✅</div>
                    <div style={{ fontWeight: 600 }}>未发现明显问题</div>
                    <div style={{ fontSize: '12px', color: isDark ? '#94a3b8' : '#64748b', marginTop: '4px' }}>
                      代码质量良好，继续保持！
                    </div>
                  </div>
                ) : (
                  result.issues.map((issue) => (
                    <div 
                      key={issue.id}
                      style={{
                        padding: '16px',
                        borderRadius: '12px',
                        background: cardBg,
                        border: `1px solid ${borderColor}`
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '8px' }}>
                        <span style={{ fontSize: '20px' }}>{getIssueTypeIcon(issue.type)}</span>
                        <span style={{ fontWeight: 600, fontSize: '14px' }}>{issue.title}</span>
                        {issue.line && (
                          <span style={{
                            padding: '2px 8px',
                            borderRadius: '4px',
                            fontSize: '11px',
                            fontWeight: 600,
                            background: isDark ? '#334155' : '#f1f5f9',
                            color: isDark ? '#94a3b8' : '#64748b'
                          }}>
                            第 {issue.line} 行
                          </span>
                        )}
                        <span style={{
                          padding: '2px 8px',
                          borderRadius: '4px',
                          fontSize: '11px',
                          fontWeight: 600,
                          background: `${getSeverityColor(issue.severity)}22`,
                          color: getSeverityColor(issue.severity),
                          marginLeft: 'auto'
                        }}>
                          {issue.severity === 'high' ? '高优先级' : issue.severity === 'medium' ? '中优先级' : '低优先级'}
                        </span>
                      </div>
                      <p style={{ 
                        margin: '0 0 8px 0', 
                        fontSize: '13px', 
                        color: isDark ? '#94a3b8' : '#64748b',
                        lineHeight: '1.5'
                      }}>
                        {issue.description}
                      </p>
                      {issue.fix && (
                        <div style={{
                          padding: '8px 12px',
                          borderRadius: '6px',
                          background: isDark ? '#1a2d1e' : '#f0fdf4',
                          color: '#4ade80',
                          fontSize: '12px',
                          fontWeight: 500
                        }}>
                          🔧 修复建议: {issue.fix}
                        </div>
                      )}
                    </div>
                  ))
                )}
              </div>
            )}

            {result && activeTab === 'suggestions' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                {result.suggestions.map((suggestion, index) => (
                  <div 
                    key={index}
                    style={{
                      padding: '16px',
                      borderRadius: '12px',
                      background: isDark ? '#2d2a14' : '#fef3c7',
                      border: `1px solid ${isDark ? '#4d4420' : '#fcd34d'}`
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
                      <span style={{ fontSize: '18px' }}>💡</span>
                      <span style={{ fontWeight: 600, fontSize: '14px' }}>{suggestion.category}</span>
                      <span style={{
                        padding: '2px 8px',
                        borderRadius: '4px',
                        fontSize: '11px',
                        fontWeight: 600,
                        background: `${getPriorityColor(suggestion.priority)}22`,
                        color: getPriorityColor(suggestion.priority),
                        marginLeft: 'auto'
                      }}>
                        {suggestion.priority === 'high' ? '高优先' : suggestion.priority === 'medium' ? '中优先' : '低优先'}
                      </span>
                    </div>
                    <p style={{ 
                      margin: '0 0 6px 0', 
                      fontSize: '13px',
                      lineHeight: '1.5'
                    }}>
                      {suggestion.suggestion}
                    </p>
                    <div style={{ fontSize: '12px', color: isDark ? '#94a3b8' : '#64748b' }}>
                      📈 影响: {suggestion.impact}
                    </div>
                  </div>
                ))}
              </div>
            )}

            {result && activeTab === 'metrics' && (
              <div>
                {/* Metrics Grid */}
                <div style={{ 
                  display: 'grid', 
                  gridTemplateColumns: 'repeat(2, 1fr)', 
                  gap: '12px',
                  marginBottom: '16px'
                }}>
                  <div style={{
                    padding: '16px',
                    borderRadius: '12px',
                    background: cardBg,
                    border: `1px solid ${borderColor}`,
                    textAlign: 'center'
                  }}>
                    <div style={{ fontSize: '32px', fontWeight: 700, color: getScoreColor(result.metrics.readability) }}>
                      {result.metrics.readability}
                    </div>
                    <div style={{ fontSize: '12px', color: isDark ? '#94a3b8' : '#64748b', marginTop: '4px' }}>
                      可读性评分
                    </div>
                  </div>
                  <div style={{
                    padding: '16px',
                    borderRadius: '12px',
                    background: cardBg,
                    border: `1px solid ${borderColor}`,
                    textAlign: 'center'
                  }}>
                    <div style={{ fontSize: '32px', fontWeight: 700, color: getScoreColor(result.metrics.maintainability) }}>
                      {result.metrics.maintainability}
                    </div>
                    <div style={{ fontSize: '12px', color: isDark ? '#94a3b8' : '#64748b', marginTop: '4px' }}>
                      可维护性评分
                    </div>
                  </div>
                </div>

                {/* Detailed Metrics */}
                <div style={{
                  padding: '16px',
                  borderRadius: '12px',
                  background: cardBg,
                  border: `1px solid ${borderColor}`
                }}>
                  <h4 style={{ margin: '0 0 16px 0', fontSize: '14px', fontWeight: 700 }}>
                    详细指标
                  </h4>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span style={{ fontSize: '13px' }}>循环复杂度</span>
                      <span style={{ fontWeight: 600, color: result.metrics.complexity > 5 ? '#f97316' : '#4ade80' }}>
                        {result.metrics.complexity}
                      </span>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span style={{ fontSize: '13px' }}>代码行数</span>
                      <span style={{ fontWeight: 600 }}>{result.metrics.linesOfCode}</span>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span style={{ fontSize: '13px' }}>函数数量</span>
                      <span style={{ fontWeight: 600 }}>{result.metrics.functions}</span>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span style={{ fontSize: '13px' }}>注释行数</span>
                      <span style={{ fontWeight: 600 }}>{result.metrics.comments}</span>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span style={{ fontSize: '13px' }}>注释覆盖率</span>
                      <span style={{ fontWeight: 600 }}>
                        {((result.metrics.comments / Math.max(result.metrics.linesOfCode, 1)) * 100).toFixed(1)}%
                      </span>
                    </div>
                  </div>
                </div>

                {/* Quality Assessment */}
                <div style={{
                  padding: '16px',
                  borderRadius: '12px',
                  background: isDark ? '#1e293b' : '#f0f9ff',
                  border: `1px solid ${isDark ? '#334155' : '#bae6fd'}`,
                  marginTop: '12px'
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px' }}>
                    <span style={{ fontSize: '18px' }}>📊</span>
                    <span style={{ fontWeight: 600, fontSize: '14px' }}>质量评估</span>
                  </div>
                  <div style={{ fontSize: '13px', lineHeight: '1.6' }}>
                    {result.metrics.complexity <= 3 && '✅ 代码复杂度较低，易于理解维护'}
                    {result.metrics.complexity > 3 && result.metrics.complexity <= 6 && '⚠️ 代码复杂度适中，建议适当简化'}
                    {result.metrics.complexity > 6 && '❌ 代码复杂度较高，建议重构'}
                    <br />
                    {result.metrics.readability >= 70 && '✅ 可读性良好，代码结构清晰'}
                    {result.metrics.readability < 70 && result.metrics.readability >= 50 && '⚠️ 可读性一般，建议增加注释'}
                    {result.metrics.readability < 50 && '❌ 可读性较低，需要改进'}
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Animation styles */}
      <style>{`
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  )
}