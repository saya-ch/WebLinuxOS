// @ts-nocheck
import { useState, useCallback, useRef, useEffect, memo } from 'react'
import {
  Code2Icon, SparklesIcon, SendIcon, RefreshCwIcon, CopyIcon,
  DownloadIcon, CheckIcon, AlertTriangleIcon, InfoIcon, ZapIcon,
  SearchIcon, WandIcon, FileCodeIcon, GitBranchIcon, ActivityIcon,
  BarChart3Icon, LayersIcon
} from '../icons'

interface ReviewIssue {
  id: string
  severity: 'critical' | 'warning' | 'suggestion'
  title: string
  description: string
  line?: number
  code?: string
  suggestion?: string
}

interface ReviewResult {
  score: number
  summary: string
  issues: ReviewIssue[]
  metrics: {
    complexity: string
    maintainability: string
    security: string
    performance: string
  }
}

const LANGUAGES = [
  { value: 'javascript', label: 'JavaScript' },
  { value: 'typescript', label: 'TypeScript' },
  { value: 'python', label: 'Python' },
  { value: 'go', label: 'Go' },
  { value: 'rust', label: 'Rust' },
  { value: 'java', label: 'Java' },
  { value: 'cpp', label: 'C++' },
  { value: 'html', label: 'HTML' },
  { value: 'css', label: 'CSS' },
  { value: 'sql', label: 'SQL' },
  { value: 'bash', label: 'Bash' },
]

const SEVERITY_COLORS: Record<string, string> = {
  critical: '#ef4444',
  warning: '#f59e0b',
  suggestion: '#3b82f6',
}

const SEVERITY_LABELS: Record<string, string> = {
  critical: '严重',
  warning: '警告',
  suggestion: '建议',
}

const AI_REVIEW_PROMPT = `You are an expert code reviewer. Analyze the following code and provide:
1. Overall score (0-100)
2. Summary of findings
3. Issues found with severity (critical/warning/suggestion), description, line number, and suggestion
4. Metrics: complexity, maintainability, security, performance (each rated 1-10)

Respond in JSON format:
{
  "score": number,
  "summary": "string",
  "issues": [{"severity": "critical|warning|suggestion", "title": "string", "description": "string", "line": number, "code": "string", "suggestion": "string"}],
  "metrics": {"complexity": "string", "maintainability": "string", "security": "string", "performance": "string"}
}`

const SAMPLE_CODES: Record<string, string> = {
  javascript: `// Sample: Potential issues
function getData(url) {
  return fetch(url).then(res => res.json())
}
// Issue: no error handling
// Issue: no type checking`,
  python: `def process_data(data):
    result = []
    for item in data:
        if item['status'] == 'active':
            result.append(item)
    return result
# Issue: no type hints
# Issue: could use list comprehension`,
  typescript: `interface User {
  name: string
  age: number
}
const user: User = { name: "John" }
// Issue: missing age property
// Issue: no error handling`,
}

async function callPollinationsAI(prompt: string, code: string, language: string): Promise<string> {
  const fullPrompt = `${prompt}\n\nLanguage: ${language}\n\nCode:\n${code}\n\nPlease analyze:`
  const response = await fetch('https://text.pollinations.ai/', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      messages: [
        { role: 'system', content: 'You are a professional code reviewer. Always respond with valid JSON.' },
        { role: 'user', content: fullPrompt }
      ],
      model: 'openai',
      stream: false
    })
  })
  
  if (!response.ok) {
    throw new Error('AI服务请求失败')
  }
  
  return await response.text()
}

const AICodeReviewWorkbench = memo(function AICodeReviewWorkbench() {
  const [code, setCode] = useState<string>(SAMPLE_CODES.javascript)
  const [language, setLanguage] = useState<string>('javascript')
  const [isAnalyzing, setIsAnalyzing] = useState(false)
  const [result, setResult] = useState<ReviewResult | null>(null)
  const [error, setError] = useState<string>('')
  const [copiedId, setCopiedId] = useState<string>('')
  const [history, setHistory] = useState<Array<{ time: string; score: number; language: string; snippet: string }>>([])
  const [activeTab, setActiveTab] = useState<'editor' | 'result' | 'metrics' | 'history'>('editor')
  const codeRef = useRef<HTMLTextAreaElement>(null)

  const handleAnalyze = useCallback(async () => {
    if (!code.trim()) {
      setError('请输入需要审查的代码')
      return
    }

    setIsAnalyzing(true)
    setError('')
    setResult(null)

    try {
      const aiResponse = await callPollinationsAI(AI_REVIEW_PROMPT, code, language)
      
      let parsedResult: ReviewResult
      try {
        const jsonMatch = aiResponse.match(/\{[\s\S]*\}/)
        const jsonStr = jsonMatch ? jsonMatch[0] : aiResponse
        parsedResult = JSON.parse(jsonStr)
      } catch {
        // If AI response is not valid JSON, create a basic result
        parsedResult = {
          score: 60,
          summary: aiResponse.substring(0, 500),
          issues: [],
          metrics: {
            complexity: '中等',
            maintainability: '一般',
            security: '良好',
            performance: '一般'
          }
        }
      }

      setResult(parsedResult)
      setActiveTab('result')
      
      // Add to history
      setHistory(prev => [{
        time: new Date().toLocaleTimeString(),
        score: parsedResult.score,
        language,
        snippet: code.substring(0, 50) + (code.length > 50 ? '...' : '')
      }, ...prev].slice(0, 10))

    } catch (err) {
      setError(err instanceof Error ? err.message : '分析失败，请重试')
    } finally {
      setIsAnalyzing(false)
    }
  }, [code, language])

  const handleCopy = useCallback(async (text: string, id: string) => {
    try {
      await navigator.clipboard.writeText(text)
      setCopiedId(id)
      setTimeout(() => setCopiedId(''), 2000)
    } catch {}
  }, [])

  const handleLoadSample = useCallback(() => {
    setCode(SAMPLE_CODES[language] || SAMPLE_CODES.javascript)
    setResult(null)
    setError('')
  }, [language])

  const handleDownloadReport = useCallback(() => {
    if (!result) return
    const report = `# 代码审查报告

## 评分: ${result.score}/100

## 概述
${result.summary}

## 指标
- 复杂度: ${result.metrics.complexity}
- 可维护性: ${result.metrics.maintainability}
- 安全性: ${result.metrics.security}
- 性能: ${result.metrics.performance}

## 发现的问题
${result.issues.map((issue, i) => `
### ${i + 1}. [${SEVERITY_LABELS[issue.severity]}] ${issue.title}
${issue.description}
${issue.line ? `\n行号: ${issue.line}` : ''}
${issue.code ? `\n\`\`\`${language}\n${issue.code}\n\`\`\`` : ''}
${issue.suggestion ? `\n**建议**: ${issue.suggestion}` : ''}
`).join('\n')}

生成时间: ${new Date().toLocaleString()}
语言: ${language}
`

    const blob = new Blob([report], { type: 'text/markdown' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `code-review-${Date.now()}.md`
    a.click()
    URL.revokeObjectURL(url)
  }, [result, language])

  const getScoreColor = (score: number) => {
    if (score >= 80) return '#10b981'
    if (score >= 60) return '#f59e0b'
    return '#ef4444'
  }

  return (
    <div style={styles.container}>
      <div style={styles.header}>
        <div style={styles.title}>
          <Code2Icon size={24} color="#8b74f0" />
          <span>AI 代码审查工作台</span>
          <span style={styles.versionBadge}>Pro</span>
        </div>
        <div style={styles.headerActions}>
          <button style={styles.iconBtn} onClick={handleLoadSample} title="加载示例">
            <RefreshCwIcon size={16} />
          </button>
          {result && (
            <button style={styles.iconBtn} onClick={handleDownloadReport} title="下载报告">
              <DownloadIcon size={16} />
            </button>
          )}
        </div>
      </div>

      <div style={styles.tabs}>
        {([['editor', '代码编辑'], ['result', '审查结果'], ['metrics', '指标分析'], ['history', '历史记录']] as const).map(([key, label]) => (
          <button
            key={key}
            style={{
              ...styles.tab,
              ...(activeTab === key ? styles.tabActive : {}),
            }}
            onClick={() => setActiveTab(key)}
          >
            {label}
            {key === 'result' && result && (
              <span style={styles.tabBadge}>{result.issues.length}</span>
            )}
          </button>
        ))}
      </div>

      {activeTab === 'editor' && (
        <div style={styles.editorPanel}>
          <div style={styles.editorToolbar}>
            <div style={styles.selectWrapper}>
              <FileCodeIcon size={14} style={{ marginRight: 6 }} />
              <select
                value={language}
                onChange={(e) => setLanguage(e.target.value)}
                style={styles.select}
              >
                {LANGUAGES.map(lang => (
                  <option key={lang.value} value={lang.value}>{lang.label}</option>
                ))}
              </select>
            </div>
            <span style={styles.charCount}>{code.length} 字符</span>
          </div>

          <textarea
            ref={codeRef}
            value={code}
            onChange={(e) => setCode(e.target.value)}
            placeholder="在此粘贴您的代码进行AI审查..."
            spellCheck={false}
            style={styles.codeEditor}
          />

          <div style={styles.editorActions}>
            <button
              style={{
                ...styles.analyzeBtn,
                ...(isAnalyzing ? styles.analyzeBtnDisabled : {}),
              }}
              onClick={handleAnalyze}
              disabled={isAnalyzing}
            >
              {isAnalyzing ? (
                <>
                  <RefreshCwIcon size={16} className="spin" style={{ animation: 'spin 1s linear infinite' }} />
                  AI 分析中...
                </>
              ) : (
                <>
                  <SparklesIcon size={16} />
                  AI 代码审查
                </>
              )}
            </button>
          </div>

          {error && (
            <div style={styles.error}>
              <AlertTriangleIcon size={16} />
              {error}
            </div>
          )}
        </div>
      )}

      {activeTab === 'result' && result && (
        <div style={styles.resultPanel}>
          <div style={styles.scoreCard}>
            <div style={{
              ...styles.scoreCircle,
              borderColor: getScoreColor(result.score),
            }}>
              <span style={{ color: getScoreColor(result.score) }}>{result.score}</span>
              <small>/100</small>
            </div>
            <div style={styles.scoreInfo}>
              <h3 style={styles.scoreTitle}>代码质量评分</h3>
              <p style={styles.scoreSummary}>{result.summary}</p>
            </div>
          </div>

          <div style={styles.issuesList}>
            <h4 style={styles.issuesTitle}>
              <AlertTriangleIcon size={16} />
              发现的问题 ({result.issues.length})
            </h4>
            {result.issues.length === 0 ? (
              <div style={styles.noIssues}>
                <CheckIcon size={24} />
                <p>太棒了！没有发现明显问题。</p>
              </div>
            ) : (
              result.issues.map((issue, idx) => (
                <div key={idx} style={{
                  ...styles.issueCard,
                  borderLeftColor: SEVERITY_COLORS[issue.severity],
                }}>
                  <div style={styles.issueHeader}>
                    <span style={{
                      ...styles.severityBadge,
                      backgroundColor: SEVERITY_COLORS[issue.severity],
                    }}>
                      {SEVERITY_LABELS[issue.severity]}
                    </span>
                    <span style={styles.issueTitle}>{issue.title}</span>
                    <div style={styles.issueActions}>
                      {copiedId === `issue-${idx}` ? (
                        <CheckIcon size={14} color="#10b981" />
                      ) : (
                        <button
                          style={styles.copyBtn}
                          onClick={() => handleCopy(issue.suggestion || issue.description, `issue-${idx}`)}
                        >
                          <CopyIcon size={14} />
                        </button>
                      )}
                    </div>
                  </div>
                  <p style={styles.issueDesc}>{issue.description}</p>
                  {issue.line && (
                    <div style={styles.issueLine}>
                      <GitBranchIcon size={12} /> 行 {issue.line}
                    </div>
                  )}
                  {issue.code && (
                    <pre style={styles.issueCode}>{issue.code}</pre>
                  )}
                  {issue.suggestion && (
                    <div style={styles.suggestionBox}>
                      <WandIcon size={14} color="#8b74f0" />
                      <span>{issue.suggestion}</span>
                    </div>
                  )}
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {activeTab === 'result' && !result && (
        <div style={styles.emptyState}>
          <SearchIcon size={48} />
          <p>尚未生成审查结果</p>
          <button style={styles.primaryBtn} onClick={() => setActiveTab('editor')}>
            前往编辑器
          </button>
        </div>
      )}

      {activeTab === 'metrics' && result && (
        <div style={styles.metricsPanel}>
          <h4 style={styles.metricsTitle}>
            <BarChart3Icon size={16} />
            代码质量指标
          </h4>
          <div style={styles.metricsGrid}>
            {Object.entries(result.metrics).map(([key, value]) => (
              <div key={key} style={styles.metricCard}>
                <div style={styles.metricIcon}>
                  {key === 'complexity' && <LayersIcon size={20} color="#8b74f0" />}
                  {key === 'maintainability' && <ActivityIcon size={20} color="#3b82f6" />}
                  {key === 'security' && <ZapIcon size={20} color="#10b981" />}
                  {key === 'performance' && <SparklesIcon size={20} color="#f59e0b" />}
                </div>
                <div style={styles.metricInfo}>
                  <span style={styles.metricLabel}>
                    {key === 'complexity' && '复杂度'}
                    {key === 'maintainability' && '可维护性'}
                    {key === 'security' && '安全性'}
                    {key === 'performance' && '性能'}
                  </span>
                  <span style={styles.metricValue}>{value}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {activeTab === 'metrics' && !result && (
        <div style={styles.emptyState}>
          <BarChart3Icon size={48} />
          <p>尚未生成指标数据</p>
        </div>
      )}

      {activeTab === 'history' && (
        <div style={styles.historyPanel}>
          <h4 style={styles.historyTitle}>
            <InfoIcon size={16} />
            审查历史 ({history.length})
          </h4>
          {history.length === 0 ? (
            <div style={styles.emptyState}>
              <InfoIcon size={48} />
              <p>暂无历史记录</p>
            </div>
          ) : (
            <div style={styles.historyList}>
              {history.map((item, idx) => (
                <div key={idx} style={styles.historyItem}>
                  <div style={styles.historyScore}>{item.score}</div>
                  <div style={styles.historyInfo}>
                    <span style={styles.historyTime}>{item.time}</span>
                    <span style={styles.historyLang}>{item.language}</span>
                    <span style={styles.historySnippet}>{item.snippet}</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  )
})

const styles: Record<string, React.CSSProperties> = {
  container: {
    display: 'flex',
    flexDirection: 'column',
    height: '100%',
    background: 'linear-gradient(135deg, #1a1a2e 0%, #16213e 100%)',
    color: '#e0e0e0',
    fontFamily: "'Inter', -apple-system, sans-serif",
    overflow: 'hidden',
  },
  header: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '14px 20px',
    borderBottom: '1px solid rgba(255,255,255,0.08)',
    background: 'rgba(0,0,0,0.2)',
    flexShrink: 0,
  },
  title: {
    display: 'flex',
    alignItems: 'center',
    gap: 10,
    fontSize: 16,
    fontWeight: 600,
  },
  versionBadge: {
    fontSize: 10,
    padding: '2px 6px',
    borderRadius: 4,
    background: 'linear-gradient(135deg, #8b74f0, #6366f1)',
    color: 'white',
    fontWeight: 700,
  },
  headerActions: {
    display: 'flex',
    gap: 8,
  },
  iconBtn: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    width: 32,
    height: 32,
    borderRadius: 6,
    background: 'rgba(255,255,255,0.08)',
    border: 'none',
    color: '#8b74f0',
    cursor: 'pointer',
    transition: 'all 0.2s',
  },
  tabs: {
    display: 'flex',
    gap: 4,
    padding: '8px 20px',
    borderBottom: '1px solid rgba(255,255,255,0.08)',
    flexShrink: 0,
  },
  tab: {
    padding: '8px 16px',
    background: 'transparent',
    border: 'none',
    color: 'rgba(255,255,255,0.6)',
    cursor: 'pointer',
    borderRadius: 6,
    fontSize: 13,
    fontWeight: 500,
    display: 'flex',
    alignItems: 'center',
    gap: 6,
    transition: 'all 0.2s',
  },
  tabActive: {
    background: 'rgba(139,116,240,0.15)',
    color: '#8b74f0',
  },
  tabBadge: {
    background: '#ef4444',
    color: 'white',
    fontSize: 10,
    padding: '1px 5px',
    borderRadius: 8,
  },
  editorPanel: {
    flex: 1,
    display: 'flex',
    flexDirection: 'column',
    padding: 20,
    gap: 12,
    overflow: 'auto',
  },
  editorToolbar: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  selectWrapper: {
    display: 'flex',
    alignItems: 'center',
  },
  select: {
    padding: '6px 12px',
    borderRadius: 6,
    background: 'rgba(255,255,255,0.08)',
    border: '1px solid rgba(255,255,255,0.1)',
    color: '#e0e0e0',
    fontSize: 13,
    cursor: 'pointer',
  },
  charCount: {
    fontSize: 12,
    color: 'rgba(255,255,255,0.5)',
  },
  codeEditor: {
    flex: 1,
    minHeight: 300,
    padding: 16,
    borderRadius: 8,
    background: 'rgba(0,0,0,0.3)',
    border: '1px solid rgba(255,255,255,0.1)',
    color: '#e0e0e0',
    fontFamily: "'JetBrains Mono', 'Fira Code', monospace",
    fontSize: 13,
    lineHeight: 1.6,
    resize: 'none',
    outline: 'none',
    tabSize: 2,
  },
  editorActions: {
    display: 'flex',
    justifyContent: 'flex-end',
  },
  analyzeBtn: {
    display: 'flex',
    alignItems: 'center',
    gap: 8,
    padding: '12px 24px',
    borderRadius: 8,
    background: 'linear-gradient(135deg, #8b74f0, #6366f1)',
    border: 'none',
    color: 'white',
    fontSize: 14,
    fontWeight: 600,
    cursor: 'pointer',
    transition: 'all 0.2s',
    boxShadow: '0 4px 15px rgba(139,116,240,0.3)',
  },
  analyzeBtnDisabled: {
    opacity: 0.7,
    cursor: 'not-allowed',
  },
  error: {
    display: 'flex',
    alignItems: 'center',
    gap: 8,
    padding: '10px 14px',
    borderRadius: 6,
    background: 'rgba(239,68,68,0.15)',
    color: '#ef4444',
    fontSize: 13,
  },
  resultPanel: {
    flex: 1,
    display: 'flex',
    flexDirection: 'column',
    padding: 20,
    gap: 20,
    overflow: 'auto',
  },
  scoreCard: {
    display: 'flex',
    alignItems: 'center',
    gap: 24,
    padding: 20,
    borderRadius: 12,
    background: 'rgba(255,255,255,0.05)',
    border: '1px solid rgba(255,255,255,0.1)',
  },
  scoreCircle: {
    width: 80,
    height: 80,
    borderRadius: '50%',
    border: '4px solid',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: 28,
    fontWeight: 700,
  },
  scoreInfo: {
    flex: 1,
  },
  scoreTitle: {
    margin: '0 0 8px 0',
    fontSize: 16,
    fontWeight: 600,
  },
  scoreSummary: {
    margin: 0,
    fontSize: 14,
    color: 'rgba(255,255,255,0.7)',
    lineHeight: 1.6,
  },
  issuesList: {
    display: 'flex',
    flexDirection: 'column',
    gap: 12,
  },
  issuesTitle: {
    display: 'flex',
    alignItems: 'center',
    gap: 8,
    margin: 0,
    fontSize: 14,
    color: 'rgba(255,255,255,0.7)',
  },
  issueCard: {
    padding: 16,
    borderRadius: 8,
    background: 'rgba(255,255,255,0.03)',
    border: '1px solid rgba(255,255,255,0.1)',
    borderLeft: '4px solid',
  },
  issueHeader: {
    display: 'flex',
    alignItems: 'center',
    gap: 10,
    marginBottom: 8,
  },
  severityBadge: {
    padding: '2px 8px',
    borderRadius: 4,
    fontSize: 11,
    fontWeight: 600,
    color: 'white',
  },
  issueTitle: {
    flex: 1,
    fontSize: 14,
    fontWeight: 600,
  },
  issueActions: {
    display: 'flex',
    gap: 8,
  },
  copyBtn: {
    background: 'transparent',
    border: 'none',
    color: 'rgba(255,255,255,0.5)',
    cursor: 'pointer',
    padding: 4,
  },
  issueDesc: {
    margin: '0 0 8px 0',
    fontSize: 13,
    color: 'rgba(255,255,255,0.8)',
    lineHeight: 1.5,
  },
  issueLine: {
    display: 'flex',
    alignItems: 'center',
    gap: 4,
    fontSize: 12,
    color: 'rgba(255,255,255,0.5)',
    marginBottom: 8,
  },
  issueCode: {
    padding: 12,
    borderRadius: 6,
    background: 'rgba(0,0,0,0.3)',
    fontSize: 12,
    fontFamily: "'JetBrains Mono', monospace",
    overflow: 'auto',
    margin: '8px 0',
  },
  suggestionBox: {
    display: 'flex',
    alignItems: 'flex-start',
    gap: 8,
    padding: 10,
    borderRadius: 6,
    background: 'rgba(139,116,240,0.1)',
    fontSize: 13,
    color: '#c4b5fd',
    marginTop: 8,
  },
  noIssues: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: 12,
    padding: 40,
    color: 'rgba(255,255,255,0.6)',
  },
  emptyState: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 16,
    padding: 40,
    color: 'rgba(255,255,255,0.5)',
    flex: 1,
  },
  primaryBtn: {
    padding: '10px 20px',
    borderRadius: 8,
    background: 'linear-gradient(135deg, #8b74f0, #6366f1)',
    border: 'none',
    color: 'white',
    fontSize: 14,
    fontWeight: 600,
    cursor: 'pointer',
  },
  metricsPanel: {
    padding: 20,
    overflow: 'auto',
    flex: 1,
  },
  metricsTitle: {
    display: 'flex',
    alignItems: 'center',
    gap: 8,
    margin: '0 0 20px 0',
    fontSize: 14,
    color: 'rgba(255,255,255,0.7)',
  },
  metricsGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
    gap: 16,
  },
  metricCard: {
    display: 'flex',
    alignItems: 'center',
    gap: 16,
    padding: 20,
    borderRadius: 12,
    background: 'rgba(255,255,255,0.05)',
    border: '1px solid rgba(255,255,255,0.1)',
  },
  metricIcon: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    width: 48,
    height: 48,
    borderRadius: 10,
    background: 'rgba(255,255,255,0.05)',
  },
  metricInfo: {
    display: 'flex',
    flexDirection: 'column',
    gap: 4,
  },
  metricLabel: {
    fontSize: 13,
    color: 'rgba(255,255,255,0.6)',
  },
  metricValue: {
    fontSize: 18,
    fontWeight: 600,
    color: '#8b74f0',
  },
  historyPanel: {
    padding: 20,
    overflow: 'auto',
    flex: 1,
  },
  historyTitle: {
    display: 'flex',
    alignItems: 'center',
    gap: 8,
    margin: '0 0 16px 0',
    fontSize: 14,
    color: 'rgba(255,255,255,0.7)',
  },
  historyList: {
    display: 'flex',
    flexDirection: 'column',
    gap: 8,
  },
  historyItem: {
    display: 'flex',
    alignItems: 'center',
    gap: 16,
    padding: 12,
    borderRadius: 8,
    background: 'rgba(255,255,255,0.03)',
    border: '1px solid rgba(255,255,255,0.1)',
  },
  historyScore: {
    width: 40,
    height: 40,
    borderRadius: '50%',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    background: 'rgba(139,116,240,0.15)',
    color: '#8b74f0',
    fontWeight: 700,
  },
  historyInfo: {
    display: 'flex',
    alignItems: 'center',
    gap: 12,
    flex: 1,
    fontSize: 12,
    color: 'rgba(255,255,255,0.5)',
  },
  historyTime: {
    padding: '2px 8px',
    borderRadius: 4,
    background: 'rgba(255,255,255,0.05)',
  },
  historyLang: {
    padding: '2px 8px',
    borderRadius: 4,
    background: 'rgba(139,116,240,0.1)',
    color: '#8b74f0',
  },
  historySnippet: {
    flex: 1,
    whiteSpace: 'nowrap',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
  },
}

export default AICodeReviewWorkbench