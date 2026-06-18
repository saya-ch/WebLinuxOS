import { useState, useCallback } from 'react'
import { useStore } from '../../store'

interface CodeAnalysis {
  language: string
  complexity: 'low' | 'medium' | 'high'
  lines: number
  functions: number
  classes: number
  imports: number
  explanation: string
  suggestions: string[]
  securityIssues: string[]
  performanceTips: string[]
}

const LANGUAGE_PATTERNS = {
  javascript: {
    patterns: [/^(import|export|const|let|var|function|class|async|await)/, /\.js$/, /\.jsx$/, /\.ts$/, /\.tsx$/],
    functionPattern: /function\s+\w+|const\s+\w+\s*=\s*(?:async\s*)?\(|\w+\s*=>\s*{/g,
    classPattern: /class\s+\w+/g,
    importPattern: /import\s+.*from|require\s*\(/g,
    complexityKeywords: ['async', 'await', 'Promise', 'callback', 'recursive']
  },
  python: {
    patterns: [/^(import|from|def|class|if|for|while)/, /\.py$/],
    functionPattern: /def\s+\w+/g,
    classPattern: /class\s+\w+/g,
    importPattern: /import\s+\w+|from\s+\w+\s+import/g,
    complexityKeywords: ['async', 'await', 'threading', 'multiprocessing', 'recursion']
  },
  java: {
    patterns: [/^(package|import|public|private|class|interface)/, /\.java$/],
    functionPattern: /(public|private|protected)\s+\w+\s+\w+\s*\(/g,
    classPattern: /(public|private)?\s*class\s+\w+/g,
    importPattern: /import\s+\w+/g,
    complexityKeywords: ['synchronized', 'volatile', 'thread', 'concurrent']
  },
  html: {
    patterns: [/^<!DOCTYPE|^<html|^<head|^<body/, /\.html$/, /\.htm$/],
    functionPattern: /<script.*?>|on\w+\s*=/g,
    classPattern: /class\s*=\s*"/g,
    importPattern: /<link|<script\s+src/g,
    complexityKeywords: []
  },
  css: {
    patterns: [/^[\s]*[\w.-]+\s*{/, /\.css$/, /\.scss$/, /\.less$/],
    functionPattern: /@media|@keyframes/g,
    classPattern: /\.[\w-]+/g,
    importPattern: /@import/g,
    complexityKeywords: ['animation', 'transition', 'transform']
  },
  sql: {
    patterns: [/^(SELECT|INSERT|UPDATE|DELETE|CREATE|ALTER|DROP)/i, /\.sql$/],
    functionPattern: /(CREATE\s+FUNCTION|CREATE\s+PROCEDURE)/gi,
    classPattern: null,
    importPattern: null,
    complexityKeywords: ['JOIN', 'SUBQUERY', 'UNION', 'GROUP BY', 'HAVING']
  },
  bash: {
    patterns: [/^(#!|if|for|while|case|function)/, /\.sh$/, /\.bash$/],
    functionPattern: /function\s+\w+|\w+\s*\(\)\s*{/g,
    classPattern: null,
    importPattern: /source\s+|\.\s+/g,
    complexityKeywords: ['pipe', 'grep', 'sed', 'awk', 'xargs']
  }
}

function detectLanguage(code: string): string {
  for (const [lang, config] of Object.entries(LANGUAGE_PATTERNS)) {
    for (const pattern of config.patterns) {
      if (pattern.test(code)) {
        return lang
      }
    }
  }
  return 'unknown'
}

function analyzeComplexity(code: string, language: string): 'low' | 'medium' | 'high' {
  const config = LANGUAGE_PATTERNS[language as keyof typeof LANGUAGE_PATTERNS]
  if (!config) return 'low'
  
  let complexityScore = 0
  
  // 基础复杂度：行数
  const lines = code.split('\n').length
  complexityScore += lines > 100 ? 2 : lines > 50 ? 1 : 0
  
  // 关键词复杂度
  for (const keyword of config.complexityKeywords) {
    if (code.toLowerCase().includes(keyword.toLowerCase())) {
      complexityScore += 1
    }
  }
  
  // 嵌套深度
  let maxNesting = 0
  let currentNesting = 0
  for (const char of code) {
    if (char === '{' || char === '(') currentNesting++
    if (char === '}' || char === ')') currentNesting--
    maxNesting = Math.max(maxNesting, currentNesting)
  }
  complexityScore += maxNesting > 5 ? 2 : maxNesting > 3 ? 1 : 0
  
  return complexityScore > 5 ? 'high' : complexityScore > 2 ? 'medium' : 'low'
}

function generateExplanation(code: string, language: string, analysis: Partial<CodeAnalysis>): string {
  const explanations: string[] = []
  
  explanations.push(`这段代码使用 ${language.toUpperCase()} 语言编写。`)
  explanations.push(`代码包含 ${analysis.lines || 0} 行，定义了 ${analysis.functions || 0} 个函数/方法。`)
  
  if (analysis.classes && analysis.classes > 0) {
    explanations.push(`包含 ${analysis.classes} 个类定义，表明这是一个面向对象的程序结构。`)
  }
  
  if (analysis.imports && analysis.imports > 0) {
    explanations.push(`引入了 ${analysis.imports} 个外部模块/库，说明代码依赖外部功能。`)
  }
  
  const complexity = analysis.complexity || 'low'
  if (complexity === 'high') {
    explanations.push(`代码复杂度较高，建议考虑模块化重构以提高可维护性。`)
  } else if (complexity === 'medium') {
    explanations.push(`代码复杂度适中，结构较为清晰。`)
  } else {
    explanations.push(`代码复杂度较低，结构简洁明了。`)
  }
  
  // 语言特定分析
  if (language === 'javascript') {
    if (code.includes('async') || code.includes('await')) {
      explanations.push(`使用了异步编程模式，适合处理I/O密集型操作。`)
    }
    if (code.includes('React') || code.includes('useState')) {
      explanations.push(`这是一个React组件，使用了React Hooks进行状态管理。`)
    }
  }
  
  if (language === 'python') {
    if (code.includes('class')) {
      explanations.push(`采用面向对象设计，便于代码组织和复用。`)
    }
    if (code.includes('import pandas') || code.includes('import numpy')) {
      explanations.push(`使用了数据分析库，适合数据处理和科学计算任务。`)
    }
  }
  
  return explanations.join('\n')
}

function generateSuggestions(code: string, language: string): string[] {
  const suggestions: string[] = []
  
  // 通用建议
  if (code.split('\n').length > 100) {
    suggestions.push('建议将长文件拆分为多个模块，提高可维护性')
  }
  
  if (!code.includes('//') && !code.includes('#') && !code.includes('/*')) {
    suggestions.push('建议添加注释以提高代码可读性')
  }
  
  // 语言特定建议
  if (language === 'javascript') {
    if (code.includes('var ')) {
      suggestions.push('建议使用 const/let 替代 var，遵循现代JavaScript最佳实践')
    }
    if (code.includes('console.log')) {
      suggestions.push('生产环境建议移除或替换 console.log，使用专业日志库')
    }
  }
  
  if (language === 'python') {
    if (!code.includes('"""') && !code.includes("'''")) {
      suggestions.push('建议添加docstring文档，提高函数/类的可理解性')
    }
  }
  
  if (language === 'html') {
    if (!code.includes('<meta') || !code.includes('viewport')) {
      suggestions.push('建议添加响应式meta标签，优化移动端显示')
    }
  }
  
  return suggestions
}

function detectSecurityIssues(code: string, language: string): string[] {
  const issues: string[] = []
  
  // SQL注入检测
  if (code.includes('eval(') || code.includes('exec(')) {
    issues.push('检测到 eval/exec 使用，存在代码注入风险')
  }
  
  // 硬编码敏感信息
  if (code.match(/password\s*=\s*['"].+['"]/i) || 
      code.match(/api_key\s*=\s*['"].+['"]/i) ||
      code.match(/secret\s*=\s*['"].+['"]/i)) {
    issues.push('检测到硬编码的敏感信息，建议使用环境变量')
  }
  
  // XSS风险
  if (language === 'javascript' && code.includes('innerHTML')) {
    issues.push('innerHTML 可能导致XSS攻击，建议使用textContent')
  }
  
  // 未加密传输
  if (code.includes('http://') && !code.includes('localhost')) {
    issues.push('检测到HTTP协议，建议使用HTTPS确保安全传输')
  }
  
  return issues
}

function generatePerformanceTips(code: string, language: string): string[] {
  const tips: string[] = []
  
  if (language === 'javascript') {
    if (code.includes('document.querySelector') && code.split('querySelector').length > 5) {
      tips.push('频繁DOM查询建议缓存结果，减少重排重绘')
    }
    if (code.includes('for') && code.includes('await')) {
      tips.push('循环中的异步操作建议使用Promise.all并行处理')
    }
  }
  
  if (language === 'python') {
    if (code.includes('for') && code.includes('append')) {
      tips.push('列表构建建议使用列表推导式，性能更优')
    }
  }
  
  if (language === 'sql') {
    if (code.toLowerCase().includes('select *')) {
      tips.push('SELECT * 建议改为指定字段，减少数据传输')
    }
  }
  
  return tips
}

function analyzeCode(code: string): CodeAnalysis {
  const language = detectLanguage(code)
  const config = LANGUAGE_PATTERNS[language as keyof typeof LANGUAGE_PATTERNS]
  
  const lines = code.split('\n').filter(l => l.trim()).length
  const functions = config?.functionPattern ? (code.match(config.functionPattern) || []).length : 0
  const classes = config?.classPattern ? (code.match(config.classPattern) || []).length : 0
  const imports = config?.importPattern ? (code.match(config.importPattern) || []).length : 0
  const complexity = analyzeComplexity(code, language)
  
  const partialAnalysis = { language, complexity, lines, functions, classes, imports }
  
  return {
    ...partialAnalysis,
    explanation: generateExplanation(code, language, partialAnalysis),
    suggestions: generateSuggestions(code, language),
    securityIssues: detectSecurityIssues(code, language),
    performanceTips: generatePerformanceTips(code, language)
  }
}

export default function CodeInterpreter() {
  const theme = useStore((s) => s.theme)
  const [code, setCode] = useState('')
  const [analysis, setAnalysis] = useState<CodeAnalysis | null>(null)
  const [isAnalyzing, setIsAnalyzing] = useState(false)
  const [activeTab, setActiveTab] = useState<'overview' | 'suggestions' | 'security' | 'performance'>('overview')
  
  const handleAnalyze = useCallback(() => {
    if (!code.trim()) return
    
    setIsAnalyzing(true)
    
    // 模拟分析延迟，增加用户体验
    setTimeout(() => {
      const result = analyzeCode(code)
      setAnalysis(result)
      setIsAnalyzing(false)
    }, 500)
  }, [code])
  
  const handleClear = useCallback(() => {
    setCode('')
    setAnalysis(null)
  }, [])
  
  const handleLoadSample = useCallback((sampleType: string) => {
    const samples: Record<string, string> = {
      javascript: `// React组件示例
import React, { useState, useEffect } from 'react';

function Counter() {
  const [count, setCount] = useState(0);
  
  useEffect(() => {
    document.title = \`Count: \${count}\`;
  }, [count]);
  
  const handleClick = () => {
    setCount(prev => prev + 1);
  };
  
  return (
    <div className="counter">
      <h1>计数器</h1>
      <p>当前计数: {count}</p>
      <button onClick={handleClick}>
        增加
      </button>
    </div>
  );
}

export default Counter;`,
      python: `# Python数据分析示例
import pandas as pd
import numpy as np

class DataAnalyzer:
    def __init__(self, data_path):
        self.data = pd.read_csv(data_path)
        self.results = {}
    
    def analyze(self):
        """执行数据分析"""
        self.results['mean'] = self.data.mean()
        self.results['std'] = self.data.std()
        self.results['correlation'] = self.data.corr()
        return self.results
    
    def filter_outliers(self, column, threshold=3):
        """过滤异常值"""
        z_scores = np.abs(
            (self.data[column] - self.data[column].mean()) 
            / self.data[column].std()
        )
        return self.data[z_scores < threshold]

# 使用示例
analyzer = DataAnalyzer('data.csv')
results = analyzer.analyze()`,
      html: `<!DOCTYPE html>
<html lang="zh-CN">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>现代网页示例</title>
  <style>
    .container {
      max-width: 1200px;
      margin: 0 auto;
      padding: 20px;
    }
    .card {
      background: #fff;
      border-radius: 8px;
      box-shadow: 0 2px 10px rgba(0,0,0,0.1);
    }
  </style>
</head>
<body>
  <div class="container">
    <header>
      <h1>网站标题</h1>
      <nav>
        <a href="#home">首页</a>
        <a href="#about">关于</a>
      </nav>
    </header>
    <main>
      <article class="card">
        <h2>文章标题</h2>
        <p>文章内容...</p>
      </article>
    </main>
  </div>
  <script>
    console.log('页面加载完成');
  </script>
</body>
</html>`
    }
    
    setCode(samples[sampleType] || '')
    setAnalysis(null)
  }, [])
  
  return (
    <div className="code-interpreter" style={{
      padding: '20px',
      height: '100%',
      display: 'flex',
      flexDirection: 'column',
      gap: '16px',
      background: theme === 'dark' ? '#1a1a2e' : '#f5f5f5',
      color: theme === 'dark' ? '#e0e0e0' : '#333'
    }}>
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginBottom: '8px'
      }}>
        <h2 style={{
          margin: 0,
          fontSize: '20px',
          fontWeight: 600,
          color: theme === 'dark' ? '#fff' : '#333'
        }}>
          AI 代码解释器
        </h2>
        <div style={{ display: 'flex', gap: '8px' }}>
          <button
            onClick={() => handleLoadSample('javascript')}
            style={{
              padding: '6px 12px',
              borderRadius: '6px',
              border: 'none',
              background: theme === 'dark' ? '#3a3a5e' : '#e0e0e0',
              color: theme === 'dark' ? '#fff' : '#333',
              cursor: 'pointer',
              fontSize: '12px'
            }}
          >
            JS示例
          </button>
          <button
            onClick={() => handleLoadSample('python')}
            style={{
              padding: '6px 12px',
              borderRadius: '6px',
              border: 'none',
              background: theme === 'dark' ? '#3a3a5e' : '#e0e0e0',
              color: theme === 'dark' ? '#fff' : '#333',
              cursor: 'pointer',
              fontSize: '12px'
            }}
          >
            Python示例
          </button>
          <button
            onClick={() => handleLoadSample('html')}
            style={{
              padding: '6px 12px',
              borderRadius: '6px',
              border: 'none',
              background: theme === 'dark' ? '#3a3a5e' : '#e0e0e0',
              color: theme === 'dark' ? '#fff' : '#333',
              cursor: 'pointer',
              fontSize: '12px'
            }}
          >
            HTML示例
          </button>
        </div>
      </div>
      
      <div style={{
        display: 'flex',
        gap: '16px',
        flex: 1,
        minHeight: 0
      }}>
        {/* 代码输入区 */}
        <div style={{
          flex: 1,
          display: 'flex',
          flexDirection: 'column',
          gap: '8px'
        }}>
          <div style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center'
          }}>
            <span style={{ fontSize: '14px', fontWeight: 500 }}>代码输入</span>
            <div style={{ display: 'flex', gap: '8px' }}>
              <button
                onClick={handleClear}
                style={{
                  padding: '8px 16px',
                  borderRadius: '6px',
                  border: 'none',
                  background: theme === 'dark' ? '#4a4a6e' : '#ddd',
                  color: theme === 'dark' ? '#fff' : '#333',
                  cursor: 'pointer',
                  fontSize: '13px'
                }}
              >
                清空
              </button>
              <button
                onClick={handleAnalyze}
                disabled={isAnalyzing || !code.trim()}
                style={{
                  padding: '8px 16px',
                  borderRadius: '6px',
                  border: 'none',
                  background: isAnalyzing ? '#666' : '#6366f1',
                  color: '#fff',
                  cursor: isAnalyzing ? 'wait' : 'pointer',
                  fontSize: '13px',
                  fontWeight: 500,
                  opacity: !code.trim() ? 0.5 : 1
                }}
              >
                {isAnalyzing ? '分析中...' : '开始分析'}
              </button>
            </div>
          </div>
          
          <textarea
            value={code}
            onChange={(e) => setCode(e.target.value)}
            placeholder="在此粘贴或输入代码..."
            style={{
              flex: 1,
              padding: '12px',
              borderRadius: '8px',
              border: `1px solid ${theme === 'dark' ? '#3a3a5e' : '#ddd'}`,
              background: theme === 'dark' ? '#0d0d1a' : '#fff',
              color: theme === 'dark' ? '#e0e0e0' : '#333',
              fontSize: '13px',
              fontFamily: 'Monaco, Menlo, monospace',
              resize: 'none',
              lineHeight: 1.6
            }}
          />
        </div>
        
        {/* 分析结果区 */}
        <div style={{
          flex: 1,
          display: 'flex',
          flexDirection: 'column',
          gap: '8px',
          borderRadius: '8px',
          border: `1px solid ${theme === 'dark' ? '#3a3a5e' : '#ddd'}`,
          background: theme === 'dark' ? '#0d0d1a' : '#fff',
          overflow: 'hidden'
        }}>
          {analysis ? (
            <>
              {/* 标签页导航 */}
              <div style={{
                display: 'flex',
                gap: '4px',
                padding: '8px 12px',
                borderBottom: `1px solid ${theme === 'dark' ? '#3a3a5e' : '#ddd'}`,
                background: theme === 'dark' ? '#1a1a2e' : '#f5f5f5'
              }}>
                {(['overview', 'suggestions', 'security', 'performance'] as const).map(tab => (
                  <button
                    key={tab}
                    onClick={() => setActiveTab(tab)}
                    style={{
                      padding: '6px 12px',
                      borderRadius: '4px',
                      border: 'none',
                      background: activeTab === tab 
                        ? '#6366f1' 
                        : (theme === 'dark' ? '#3a3a5e' : '#e0e0e0'),
                      color: activeTab === tab ? '#fff' : (theme === 'dark' ? '#ccc' : '#666'),
                      cursor: 'pointer',
                      fontSize: '12px',
                      fontWeight: activeTab === tab ? 500 : 400
                    }}
                  >
                    {tab === 'overview' ? '概览' : 
                     tab === 'suggestions' ? '建议' : 
                     tab === 'security' ? '安全' : '性能'}
                  </button>
                ))}
              </div>
              
              {/* 内容区 */}
              <div style={{
                flex: 1,
                padding: '16px',
                overflow: 'auto'
              }}>
                {activeTab === 'overview' && (
                  <div>
                    {/* 语言和复杂度指标 */}
                    <div style={{
                      display: 'grid',
                      gridTemplateColumns: 'repeat(2, 1fr)',
                      gap: '12px',
                      marginBottom: '16px'
                    }}>
                      <div style={{
                        padding: '12px',
                        borderRadius: '6px',
                        background: theme === 'dark' ? '#1a1a2e' : '#f0f0f0'
                      }}>
                        <div style={{ fontSize: '12px', color: '#888', marginBottom: '4px' }}>语言</div>
                        <div style={{ fontSize: '18px', fontWeight: 600 }}>{analysis.language.toUpperCase()}</div>
                      </div>
                      <div style={{
                        padding: '12px',
                        borderRadius: '6px',
                        background: theme === 'dark' ? '#1a1a2e' : '#f0f0f0'
                      }}>
                        <div style={{ fontSize: '12px', color: '#888', marginBottom: '4px' }}>复杂度</div>
                        <div style={{ 
                          fontSize: '18px', 
                          fontWeight: 600,
                          color: analysis.complexity === 'high' ? '#f44' : 
                                 analysis.complexity === 'medium' ? '#fa0' : '#4a4'
                        }}>
                          {analysis.complexity === 'high' ? '高' : 
                           analysis.complexity === 'medium' ? '中' : '低'}
                        </div>
                      </div>
                      <div style={{
                        padding: '12px',
                        borderRadius: '6px',
                        background: theme === 'dark' ? '#1a1a2e' : '#f0f0f0'
                      }}>
                        <div style={{ fontSize: '12px', color: '#888', marginBottom: '4px' }}>代码行数</div>
                        <div style={{ fontSize: '18px', fontWeight: 600 }}>{analysis.lines}</div>
                      </div>
                      <div style={{
                        padding: '12px',
                        borderRadius: '6px',
                        background: theme === 'dark' ? '#1a1a2e' : '#f0f0f0'
                      }}>
                        <div style={{ fontSize: '12px', color: '#888', marginBottom: '4px' }}>函数数量</div>
                        <div style={{ fontSize: '18px', fontWeight: 600 }}>{analysis.functions}</div>
                      </div>
                    </div>
                    
                    {/* 解释 */}
                    <div style={{
                      padding: '12px',
                      borderRadius: '6px',
                      background: theme === 'dark' ? '#1a1a2e' : '#f0f0f0',
                      whiteSpace: 'pre-wrap',
                      lineHeight: 1.6
                    }}>
                      {analysis.explanation}
                    </div>
                  </div>
                )}
                
                {activeTab === 'suggestions' && (
                  <div>
                    {analysis.suggestions.length > 0 ? (
                      <ul style={{ 
                        margin: 0, 
                        padding: 0, 
                        listStyle: 'none',
                        display: 'flex',
                        flexDirection: 'column',
                        gap: '8px'
                      }}>
                        {analysis.suggestions.map((s, i) => (
                          <li key={i} style={{
                            padding: '12px',
                            borderRadius: '6px',
                            background: theme === 'dark' ? '#1a1a2e' : '#f0f0f0',
                            display: 'flex',
                            alignItems: 'flex-start',
                            gap: '8px'
                          }}>
                            <span style={{ color: '#6366f1' }}>💡</span>
                            <span>{s}</span>
                          </li>
                        ))}
                      </ul>
                    ) : (
                      <div style={{
                        padding: '20px',
                        textAlign: 'center',
                        color: '#888'
                      }}>
                        未发现改进建议，代码质量良好
                      </div>
                    )}
                  </div>
                )}
                
                {activeTab === 'security' && (
                  <div>
                    {analysis.securityIssues.length > 0 ? (
                      <ul style={{ 
                        margin: 0, 
                        padding: 0, 
                        listStyle: 'none',
                        display: 'flex',
                        flexDirection: 'column',
                        gap: '8px'
                      }}>
                        {analysis.securityIssues.map((issue, i) => (
                          <li key={i} style={{
                            padding: '12px',
                            borderRadius: '6px',
                            background: '#fee2e2',
                            border: '1px solid #fecaca',
                            color: '#dc2626',
                            display: 'flex',
                            alignItems: 'flex-start',
                            gap: '8px'
                          }}>
                            <span>⚠️</span>
                            <span>{issue}</span>
                          </li>
                        ))}
                      </ul>
                    ) : (
                      <div style={{
                        padding: '20px',
                        textAlign: 'center',
                        background: '#dcfce7',
                        borderRadius: '6px',
                        color: '#16a34a'
                      }}>
                        ✅ 未发现安全问题
                      </div>
                    )}
                  </div>
                )}
                
                {activeTab === 'performance' && (
                  <div>
                    {analysis.performanceTips.length > 0 ? (
                      <ul style={{ 
                        margin: 0, 
                        padding: 0, 
                        listStyle: 'none',
                        display: 'flex',
                        flexDirection: 'column',
                        gap: '8px'
                      }}>
                        {analysis.performanceTips.map((tip, i) => (
                          <li key={i} style={{
                            padding: '12px',
                            borderRadius: '6px',
                            background: theme === 'dark' ? '#1a1a2e' : '#f0f0f0',
                            display: 'flex',
                            alignItems: 'flex-start',
                            gap: '8px'
                          }}>
                            <span style={{ color: '#f59e0b' }}>⚡</span>
                            <span>{tip}</span>
                          </li>
                        ))}
                      </ul>
                    ) : (
                      <div style={{
                        padding: '20px',
                        textAlign: 'center',
                        color: '#888'
                      }}>
                        未发现性能优化建议
                      </div>
                    )}
                  </div>
                )}
              </div>
            </>
          ) : (
            <div style={{
              flex: 1,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#888',
              fontSize: '14px'
            }}>
              输入代码并点击"开始分析"查看结果
            </div>
          )}
        </div>
      </div>
    </div>
  )
}