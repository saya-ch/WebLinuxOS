import { useState, useCallback, useRef } from 'react'
import { useStore } from '../store'
import { SparklesIcon, Code2Icon, InfoIcon, CheckCircleIcon, LightbulbIcon, CopyIcon } from '../icons'

interface AnalysisResult {
  type: 'error' | 'warning' | 'suggestion' | 'info'
  line?: number
  message: string
  severity: 'critical' | 'high' | 'medium' | 'low'
}

interface CodeMetrics {
  lines: number
  characters: number
  functions: number
  complexity: number
  maintainability: string
}

export default function AICodeAnalyzerPro() {
  const addNotification = useStore((s) => s.addNotification)
  
  const [code, setCode] = useState('')
  const [language, setLanguage] = useState('javascript')
  const [analyzing, setAnalyzing] = useState(false)
  const [results, setResults] = useState<AnalysisResult[]>([])
  const [metrics, setMetrics] = useState<CodeMetrics | null>(null)
  const [score, setScore] = useState<number | null>(null)
  const [suggestions, setSuggestions] = useState<string[]>([])
  
  const textareaRef = useRef<HTMLTextAreaElement>(null)
  
  const LANGUAGES = [
    { value: 'javascript', label: 'JavaScript' },
    { value: 'typescript', label: 'TypeScript' },
    { value: 'python', label: 'Python' },
    { value: 'java', label: 'Java' },
    { value: 'cpp', label: 'C++' },
    { value: 'go', label: 'Go' },
    { value: 'rust', label: 'Rust' },
  ]
  
  // 分析代码
  const analyzeCode = useCallback(async () => {
    if (!code.trim()) {
      addNotification({
        title: '请输入代码',
        message: '代码输入框为空',
        type: 'warning',
        duration: 2000
      })
      return
    }
    
    setAnalyzing(true)
    setResults([])
    setMetrics(null)
    setScore(null)
    setSuggestions([])
    
    // 模拟分析延迟
    await new Promise(resolve => setTimeout(resolve, 800 + Math.random() * 1200))
    
    const analysisResults: AnalysisResult[] = []
    const codeSuggestions: string[] = []
    const lines = code.split('\n')
    
    // 计算基本指标
    const codeMetrics: CodeMetrics = {
      lines: lines.length,
      characters: code.length,
      functions: 0,
      complexity: 0,
      maintainability: '良好'
    }
    
    // 统计函数数量
    const functionPatterns = [
      /function\s+\w+\s*\(/g,  // JavaScript/TypeScript
      /def\s+\w+\s*\(/g,  // Python
      /public\s+\w+\s+\w+\s*\(/g,  // Java
      /void\s+\w+\s*\(/g,  // C++/Java
      /func\s+\w+\s*\(/g,  // Go
      /fn\s+\w+\s*\(/g,  // Rust
    ]
    
    for (const pattern of functionPatterns) {
      const matches = code.match(pattern)
      if (matches) {
        codeMetrics.functions += matches.length
      }
    }
    
    // 计算复杂度
    const complexityKeywords = ['if', 'else', 'for', 'while', 'switch', 'case', 'catch', 'try']
    let complexityScore = 0
    for (const keyword of complexityKeywords) {
      const regex = new RegExp(`\\b${keyword}\\b`, 'g')
      const matches = code.match(regex)
      if (matches) {
        complexityScore += matches.length * 2
      }
    }
    codeMetrics.complexity = complexityScore
    
    // 评估可维护性
    if (codeMetrics.lines > 500 || complexityScore > 50) {
      codeMetrics.maintainability = '需要改进'
      analysisResults.push({
        type: 'warning',
        message: '代码过长或复杂度过高，建议拆分为更小的函数',
        severity: 'high'
      })
    } else if (codeMetrics.lines > 200 || complexityScore > 20) {
      codeMetrics.maintainability = '中等'
      codeSuggestions.push('考虑将代码拆分为更小的模块以提高可读性')
    }
    
    // 检查常见问题
    lines.forEach((line, index) => {
      const lineNum = index + 1
      const trimmedLine = line.trim()
      
      // 检查console.log
      if (trimmedLine.includes('console.log') && !trimmedLine.startsWith('//')) {
        analysisResults.push({
          type: 'warning',
          line: lineNum,
          message: '生产代码中应避免使用 console.log',
          severity: 'medium'
        })
      }
      
      // 检查魔法数字
      const numberPattern = /\b\d{2,}\b/
      if (numberPattern.test(trimmedLine) && !trimmedLine.includes('const') && !trimmedLine.includes('let')) {
        analysisResults.push({
          type: 'suggestion',
          line: lineNum,
          message: '建议将魔法数字提取为常量',
          severity: 'low'
        })
      }
      
      // 检查长行
      if (line.length > 120) {
        analysisResults.push({
          type: 'warning',
          line: lineNum,
          message: '行长度超过120字符，建议适当换行',
          severity: 'medium'
        })
      }
      
      // 检查空行过多
      if (index > 0 && line === '' && lines[index - 1] === '') {
        analysisResults.push({
          type: 'suggestion',
          line: lineNum,
          message: '存在连续空行，建议删除多余空行',
          severity: 'low'
        })
      }
      
      // 检查TODO/FIXME
      if (trimmedLine.includes('TODO') || trimmedLine.includes('FIXME')) {
        analysisResults.push({
          type: 'info',
          line: lineNum,
          message: '存在待办事项或待修复标记',
          severity: 'medium'
        })
      }
      
      // 检查重复代码（简化检测）
      if (trimmedLine.length > 20) {
        const duplicateIndex = lines.findIndex((l, i) => 
          i !== index && l.trim() === trimmedLine && Math.abs(i - index) < 10
        )
        if (duplicateIndex !== -1) {
          analysisResults.push({
            type: 'warning',
            line: lineNum,
            message: `检测到可能的重复代码（与第${duplicateIndex + 1}行相同）`,
            severity: 'medium'
          })
        }
      }
    })
    
    // 语言特定检查
    if (language === 'javascript' || language === 'typescript') {
      // 检查var使用
      if (code.includes('var ')) {
        analysisResults.push({
          type: 'warning',
          message: '建议使用 let 或 const 替代 var',
          severity: 'high'
        })
      }
      
      // 检查==/!=
      if (code.includes('==') && !code.includes('===')) {
        analysisResults.push({
          type: 'warning',
          message: '建议使用 === 替代 == 以避免类型转换问题',
          severity: 'high'
        })
      }
    }
    
    if (language === 'python') {
      // 检查print语句
      if (code.includes('print(') && !code.trim().startsWith('#')) {
        analysisResults.push({
          type: 'info',
          message: '生产代码中应避免使用 print 调试语句',
          severity: 'medium'
        })
      }
    }
    
    // 计算代码质量分数
    let baseScore = 100
    const criticalErrors = analysisResults.filter(r => r.severity === 'critical').length
    const highErrors = analysisResults.filter(r => r.severity === 'high').length
    const mediumErrors = analysisResults.filter(r => r.severity === 'medium').length
    const lowErrors = analysisResults.filter(r => r.severity === 'low').length
    
    baseScore -= criticalErrors * 20
    baseScore -= highErrors * 10
    baseScore -= mediumErrors * 5
    baseScore -= lowErrors * 2
    
    baseScore = Math.max(0, Math.min(100, baseScore))
    
    // 生成改进建议
    if (baseScore < 70) {
      codeSuggestions.push('建议进行代码重构以提高质量')
    }
    if (codeMetrics.functions > 10) {
      codeSuggestions.push('函数数量较多，考虑按功能模块拆分文件')
    }
    if (codeMetrics.lines > 100 && codeMetrics.functions < 3) {
      codeSuggestions.push('代码较长但函数较少，建议拆分为多个小函数')
    }
    
    // 添加通用建议
    codeSuggestions.push('保持代码风格一致性')
    codeSuggestions.push('为复杂逻辑添加注释说明')
    codeSuggestions.push('定期进行代码审查和重构')
    
    setResults(analysisResults)
    setMetrics(codeMetrics)
    setScore(baseScore)
    setSuggestions(codeSuggestions)
    setAnalyzing(false)
    
    addNotification({
      title: '分析完成',
      message: `发现 ${analysisResults.length} 个问题，代码质量分数: ${baseScore}/100`,
      type: baseScore >= 70 ? 'success' : 'warning',
      duration: 3000
    })
  }, [code, language, addNotification])
  
  // 复制建议
  const copySuggestions = useCallback(async () => {
    const text = suggestions.map((s, i) => `${i + 1}. ${s}`).join('\n')
    try {
      await navigator.clipboard.writeText(text)
      addNotification({
        title: '复制成功',
        message: '改进建议已复制到剪贴板',
        type: 'success',
        duration: 2000
      })
    } catch {
      addNotification({
        title: '复制失败',
        message: '无法访问剪贴板',
        type: 'error',
        duration: 2000
      })
    }
  }, [suggestions, addNotification])
  
  // 获取结果图标
  const getResultIcon = (type: AnalysisResult['type']) => {
    switch (type) {
      case 'error':
        return <InfoIcon size={16} style={{ color: '#e74c3c' }} />
      case 'warning':
        return <InfoIcon size={16} style={{ color: '#f39c12' }} />
      case 'suggestion':
        return <LightbulbIcon size={16} style={{ color: '#3498db' }} />
      case 'info':
        return <CheckCircleIcon size={16} style={{ color: '#27ae60' }} />
    }
  }
  
  return (
    <div style={{
      height: '100%',
      display: 'flex',
      flexDirection: 'column',
      background: 'var(--bg-primary)',
      color: 'var(--text-primary)'
    }}>
      {/* 顶部工具栏 */}
      <div style={{
        padding: '12px 16px',
        borderBottom: '1px solid var(--border-color)',
        display: 'flex',
        alignItems: 'center',
        gap: '12px',
        background: 'var(--bg-secondary)'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <SparklesIcon size={18} />
          <select
            value={language}
            onChange={(e) => setLanguage(e.target.value)}
            style={{
              padding: '6px 12px',
              borderRadius: '6px',
              border: '1px solid var(--border-color)',
              background: 'var(--bg-primary)',
              color: 'var(--text-primary)',
              fontSize: '14px'
            }}
          >
            {LANGUAGES.map(lang => (
              <option key={lang.value} value={lang.value}>{lang.label}</option>
            ))}
          </select>
        </div>
        
        <button
          onClick={analyzeCode}
          disabled={analyzing}
          style={{
            marginLeft: 'auto',
            padding: '8px 16px',
            borderRadius: '6px',
            border: 'none',
            background: analyzing ? '#95a5a6' : 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
            color: 'white',
            fontSize: '14px',
            fontWeight: 'bold',
            cursor: analyzing ? 'not-allowed' : 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '6px'
          }}
        >
          <Code2Icon size={16} />
          {analyzing ? '分析中...' : '开始分析'}
        </button>
      </div>
      
      {/* 主内容区 */}
      <div style={{ flex: 1, display: 'flex', gap: '1px', overflow: 'hidden' }}>
        {/* 代码输入区 */}
        <div style={{
          flex: 1,
          display: 'flex',
          flexDirection: 'column',
          borderRight: '1px solid var(--border-color)'
        }}>
          <div style={{
            padding: '12px 16px',
            borderBottom: '1px solid var(--border-color)',
            fontWeight: 'bold'
          }}>
            代码输入
          </div>
          <textarea
            ref={textareaRef}
            value={code}
            onChange={(e) => setCode(e.target.value)}
            placeholder={`粘贴 ${LANGUAGES.find(l => l.value === language)?.label || language} 代码进行分析...`}
            spellCheck={false}
            style={{
              flex: 1,
              padding: '16px',
              border: 'none',
              background: 'var(--bg-primary)',
              color: 'var(--text-primary)',
              fontSize: '14px',
              fontFamily: 'Monaco, Menlo, "Ubuntu Mono", monospace',
              lineHeight: '1.6',
              resize: 'none',
              outline: 'none'
            }}
          />
        </div>
        
        {/* 分析结果区 */}
        <div style={{
          width: '400px',
          display: 'flex',
          flexDirection: 'column',
          background: 'var(--bg-secondary)'
        }}>
          {/* 指标卡片 */}
          {metrics && (
            <div style={{
              padding: '16px',
              borderBottom: '1px solid var(--border-color)'
            }}>
              <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(2, 1fr)',
                gap: '12px',
                marginBottom: '16px'
              }}>
                <div style={{
                  padding: '12px',
                  borderRadius: '8px',
                  background: 'var(--bg-primary)',
                  textAlign: 'center'
                }}>
                  <div style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>代码行数</div>
                  <div style={{ fontSize: '24px', fontWeight: 'bold' }}>{metrics.lines}</div>
                </div>
                <div style={{
                  padding: '12px',
                  borderRadius: '8px',
                  background: 'var(--bg-primary)',
                  textAlign: 'center'
                }}>
                  <div style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>字符数</div>
                  <div style={{ fontSize: '24px', fontWeight: 'bold' }}>{metrics.characters}</div>
                </div>
                <div style={{
                  padding: '12px',
                  borderRadius: '8px',
                  background: 'var(--bg-primary)',
                  textAlign: 'center'
                }}>
                  <div style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>函数数量</div>
                  <div style={{ fontSize: '24px', fontWeight: 'bold' }}>{metrics.functions}</div>
                </div>
                <div style={{
                  padding: '12px',
                  borderRadius: '8px',
                  background: 'var(--bg-primary)',
                  textAlign: 'center'
                }}>
                  <div style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>复杂度</div>
                  <div style={{ fontSize: '24px', fontWeight: 'bold' }}>{metrics.complexity}</div>
                </div>
              </div>
              
              {/* 代码质量分数 */}
              {score !== null && (
                <div style={{
                  padding: '16px',
                  borderRadius: '8px',
                  background: `linear-gradient(135deg, ${
                    score >= 80 ? '#27ae60, #2ecc71' :
                    score >= 60 ? '#f39c12, #e67e22' :
                    '#e74c3c, #c0392b'
                  })`,
                  color: 'white',
                  textAlign: 'center'
                }}>
                  <div style={{ fontSize: '14px', marginBottom: '4px' }}>代码质量分数</div>
                  <div style={{ fontSize: '36px', fontWeight: 'bold' }}>{score}/100</div>
                  <div style={{ fontSize: '12px', marginTop: '4px' }}>
                    可维护性: {metrics.maintainability}
                  </div>
                </div>
              )}
            </div>
          )}
          
          {/* 分析结果列表 */}
          <div style={{ flex: 1, overflow: 'auto' }}>
            {results.length > 0 && (
              <div style={{ padding: '12px 16px' }}>
                <h4 style={{ marginBottom: '12px' }}>分析结果 ({results.length})</h4>
                {results.map((result, i) => (
                  <div
                    key={i}
                    style={{
                      padding: '8px 12px',
                      marginBottom: '8px',
                      borderRadius: '6px',
                      background: 'var(--bg-primary)',
                      borderLeft: `3px solid ${
                        result.type === 'error' ? '#e74c3c' :
                        result.type === 'warning' ? '#f39c12' :
                        result.type === 'suggestion' ? '#3498db' : '#27ae60'
                      }`
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                      {getResultIcon(result.type)}
                      <span style={{ fontWeight: 'bold', fontSize: '13px' }}>
                        {result.type === 'error' ? '错误' :
                         result.type === 'warning' ? '警告' :
                         result.type === 'suggestion' ? '建议' : '信息'}
                        {result.line && ` (行 ${result.line})`}
                      </span>
                    </div>
                    <div style={{ fontSize: '13px', marginLeft: '24px' }}>
                      {result.message}
                    </div>
                  </div>
                ))}
              </div>
            )}
            
            {/* 改进建议 */}
            {suggestions.length > 0 && (
              <div style={{ padding: '12px 16px' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px' }}>
                  <h4>改进建议</h4>
                  <button
                    onClick={copySuggestions}
                    title="复制建议"
                    style={{
                      padding: '4px 8px',
                      borderRadius: '4px',
                      border: '1px solid var(--border-color)',
                      background: 'var(--bg-primary)',
                      color: 'var(--text-primary)',
                      fontSize: '12px',
                      cursor: 'pointer'
                    }}
                  >
                    <CopyIcon size={14} />
                  </button>
                </div>
                {suggestions.map((suggestion, i) => (
                  <div
                    key={i}
                    style={{
                      padding: '8px 12px',
                      marginBottom: '8px',
                      borderRadius: '6px',
                      background: 'var(--bg-primary)',
                      fontSize: '13px'
                    }}
                  >
                    {i + 1}. {suggestion}
                  </div>
                ))}
              </div>
            )}
            
            {!analyzing && results.length === 0 && (
              <div style={{
                padding: '40px',
                textAlign: 'center',
                color: 'var(--text-secondary)'
              }}>
                <Code2Icon size={48} style={{ marginBottom: '16px', opacity: 0.5 }} />
                <div>输入代码并点击"开始分析"</div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}