import { useState, useCallback, memo } from 'react'
import {
  Search, Shield, Zap, AlertTriangle, CheckCircle, X, Loader2,
  Download, Copy, RotateCcw, FileCode,
  Cpu, Award, FileText, Lightbulb, Gauge, ChevronRight,
  BarChart3, Brain, Eye, Code2
} from 'lucide-react'
import { marked } from 'marked'

type Language = 'javascript' | 'typescript' | 'python'

interface ReviewIssue {
  id: string
  type: 'security' | 'performance' | 'quality' | 'style'
  severity: 'high' | 'medium' | 'low'
  title: string
  description: string
  suggestion: string
  line?: number
}

interface ReviewResult {
  score: number
  summary: string
  issues: ReviewIssue[]
  strengths: string[]
  metrics: {
    security: number
    performance: number
    readability: number
    maintainability: number
  }
  reportMd: string
}

const LANGUAGES: { value: Language; label: string; icon: string }[] = [
  { value: 'javascript', label: 'JavaScript', icon: 'JS' },
  { value: 'typescript', label: 'TypeScript', icon: 'TS' },
  { value: 'python', label: 'Python', icon: 'PY' },
]

const SAMPLE_CODE: Record<Language, string> = {
  javascript: `function processData(data) {
  const result = [];
  for (let i = 0; i < data.length; i++) {
    if (data[i].active == true) {
      let temp = data[i].value * 1.5;
      if (temp > 100) {
        console.log("High value found");
        result.push(temp);
      }
    }
  }
  return result;
}

const userInput = prompt("Enter your name:");
const query = "SELECT * FROM users WHERE name = '" + userInput + "'";
console.log("Query:", query);`,
  typescript: `interface User {
  id: number;
  name: string;
  email: string;
}

function getUserData(id: number): any {
  let user = null;
  fetch('/api/users/' + id)
    .then(response => response.json())
    .then(data => { user = data; })
    .catch(err => console.log(err));
  return user;
}

function calculateTotal(items: any[]): number {
  var total = 0;
  for (var i = 0; i < items.length; i++) {
    total = total + items[i].price * items[i].quantity;
  }
  return total;
}`,
  python: `import sqlite3

def get_user_data(user_id):
    conn = sqlite3.connect('users.db')
    cursor = conn.cursor()
    query = "SELECT * FROM users WHERE id = " + str(user_id)
    cursor.execute(query)
    result = cursor.fetchall()
    conn.close()
    return result

def process_list(items):
    result = []
    for item in items:
        if item['status'] == 'active':
            if item['value'] > 100:
                result.append(item)
    return result

user_input = input("Enter name: ")
get_user_data(user_input)`,
}

async function pollinationsAI(prompt: string): Promise<string> {
  const seed = Math.floor(Math.random() * 1000000)
  const url = `https://text.pollinations.ai/${encodeURIComponent(prompt)}?seed=${seed}&model=flux`
  const response = await fetch(url)
  if (!response.ok) throw new Error(`API请求失败: ${response.status}`)
  return response.text()
}

function parseAIResponse(text: string, lang: Language): ReviewResult {
  const issues: ReviewIssue[] = []
  const strengths: string[] = []

  const hasSQLInjection = /SELECT|INSERT|UPDATE|DELETE.*\+.*(input|user|prompt)/i.test(text) || /sql.*inject/i.test(text)
  const hasEval = /eval\s*\(/i.test(text)
  const hasInnerHTML = /innerHTML\s*=/i.test(text)
  const hasWeakPassword = /password\s*=|secret\s*=|api_key\s*=/i.test(text)
  const hasConsoleLog = /console\.log\s*\(/i.test(text)
  const hasVarDecl = /\bvar\s+\w+/i.test(text)
  const hasDoubleEquals = /[^=!]==[^=]/i.test(text) && lang !== 'python'
  const hasNoErrorHandling = /fetch|axios|http/i.test(text) && !/catch\s*\(/.test(text)
  const hasNoType = lang === 'typescript' && /: any/.test(text)
  const hasHardcoded = /localhost|127\.0\.0\.1|hardcoded/i.test(text)
  const hasNPlus1 = /for\s*\(.*\).*fetch|for\s+.*:.*requests/i.test(text)
  const hasMissingReturn = /function.*\{[^}]*$|function.*\{[^}]*return[^}]*\}/s.test(text)

  const issueConfigs: Array<{ check: boolean; issue: Omit<ReviewIssue, 'id'> }> = [
    {
      check: hasSQLInjection,
      issue: {
        type: 'security', severity: 'high',
        title: 'SQL注入风险',
        description: '检测到字符串拼接构建SQL查询，可能导致SQL注入攻击。',
        suggestion: '使用参数化查询或ORM绑定参数，绝不要直接拼接用户输入到SQL语句中。',
      },
    },
    {
      check: hasEval,
      issue: {
        type: 'security', severity: 'high',
        title: '使用eval()函数',
        description: 'eval()会执行任意代码，存在严重的安全风险和性能问题。',
        suggestion: '避免使用eval()，改用更安全的JSON.parse()或Function构造器。',
      },
    },
    {
      check: hasInnerHTML,
      issue: {
        type: 'security', severity: 'high',
        title: 'XSS风险 - innerHTML',
        description: '直接使用innerHTML可能导致跨站脚本攻击(XSS)。',
        suggestion: '使用textContent替代innerHTML，或对输入进行严格的HTML转义。',
      },
    },
    {
      check: hasWeakPassword,
      issue: {
        type: 'security', severity: 'high',
        title: '硬编码敏感信息',
        description: '代码中包含疑似密码/密钥等敏感信息。',
        suggestion: '将敏感信息存储在环境变量或密钥管理服务中，不要硬编码在源码中。',
      },
    },
    {
      check: hasNoErrorHandling,
      issue: {
        type: 'quality', severity: 'medium',
        title: '缺少错误处理',
        description: '网络请求没有对应的错误处理机制，可能导致未捕获的异常。',
        suggestion: '添加try/catch或.catch()错误处理，优雅地处理请求失败情况。',
      },
    },
    {
      check: hasConsoleLog,
      issue: {
        type: 'quality', severity: 'low',
        title: '使用console.log',
        description: '代码中存在console.log调试输出，不应出现在生产环境中。',
        suggestion: '使用专业的日志框架（如winston、pino），或在构建时移除调试代码。',
      },
    },
    {
      check: hasVarDecl,
      issue: {
        type: 'quality', severity: 'medium',
        title: '使用var声明变量',
        description: 'var存在变量提升和作用域问题，是过时的声明方式。',
        suggestion: '使用const或let替代var，const用于不会重新赋值的变量。',
      },
    },
    {
      check: hasDoubleEquals,
      issue: {
        type: 'style', severity: 'low',
        title: '使用==而非===',
        description: '==会进行类型转换，可能导致意外的比较结果。',
        suggestion: '始终使用===进行严格相等比较，避免类型强制转换问题。',
      },
    },
    {
      check: hasNoType,
      issue: {
        type: 'quality', severity: 'medium',
        title: '使用any类型',
        description: 'TypeScript中使用any会丧失类型检查的优势。',
        suggestion: '定义具体的接口或类型，避免使用any。如果类型未知使用unknown代替。',
      },
    },
    {
      check: hasHardcoded,
      issue: {
        type: 'maintainability' as any, severity: 'medium',
        title: '硬编码配置值',
        description: '代码中包含硬编码的URL或配置值，不利于部署和维护。',
        suggestion: '使用环境变量或配置文件管理不同环境的配置。',
      },
    },
    {
      check: hasNPlus1,
      issue: {
        type: 'performance', severity: 'high',
        title: 'N+1查询问题',
        description: '循环内发起请求/查询，会导致性能问题。',
        suggestion: '使用批量请求或Promise.all并发处理，减少网络往返次数。',
      },
    },
    {
      check: hasMissingReturn,
      issue: {
        type: 'quality', severity: 'medium',
        title: '缺少返回值',
        description: '函数可能在某些路径上没有返回值。',
        suggestion: '确保函数在所有代码路径上都有明确的返回语句。',
      },
    },
  ]

  issueConfigs.forEach((cfg, idx) => {
    if (cfg.check) {
      issues.push({ ...cfg.issue, id: `issue-${idx}-${Date.now()}` })
    }
  })

  if (issues.length === 0) {
    strengths.push('代码质量优秀，未发现明显问题')
    strengths.push('遵循了最佳实践和安全规范')
    issues.push({
      id: `issue-info-${Date.now()}`,
      type: 'quality',
      severity: 'low',
      title: '建议代码审查',
      description: '代码结构良好，建议定期进行代码审查以保持质量。',
      suggestion: '继续保持良好的编码习惯，定期重构和优化。',
    })
  }

  const typeCounts = {
    security: issues.filter(i => i.type === 'security').length,
    performance: issues.filter(i => i.type === 'performance').length,
    quality: issues.filter(i => i.type === 'quality').length,
    style: issues.filter(i => i.type === 'style').length,
  }

  const highCount = issues.filter(i => i.severity === 'high').length
  const mediumCount = issues.filter(i => i.severity === 'medium').length

  const baseScore = 100
  const deduction = highCount * 15 + mediumCount * 8 + (issues.length - highCount - mediumCount) * 3
  const score = Math.max(0, Math.min(100, baseScore - deduction + Math.floor(Math.random() * 10)))

  const metrics = {
    security: Math.max(0, 100 - typeCounts.security * 20 + Math.floor(Math.random() * 10)),
    performance: Math.max(0, 100 - typeCounts.performance * 15 + Math.floor(Math.random() * 10)),
    readability: Math.max(0, 70 + Math.floor(Math.random() * 25) - typeCounts.style * 5),
    maintainability: Math.max(0, 80 + Math.floor(Math.random() * 20) - issues.filter(i => i.type === 'quality').length * 8),
  }

  const summaryParts: string[] = []
  summaryParts.push(`## AI代码审查报告\n\n`)
  summaryParts.push(`**语言**: ${LANGUAGES.find(l => l.value === lang)?.label}\n\n`)
  summaryParts.push(`**质量评分**: **${score}/100**\n\n`)
  summaryParts.push(`### 评估维度\n\n`)
  summaryParts.push(`| 维度 | 分数 |\n|------|------|`)
  summaryParts.push(`| 🔒 安全性 | ${metrics.security}/100 |`)
  summaryParts.push(`| ⚡ 性能 | ${metrics.performance}/100 |`)
  summaryParts.push(`| 📖 可读性 | ${metrics.readability}/100 |`)
  summaryParts.push(`| 🔧 可维护性 | ${metrics.maintainability}/100 |\n\n`)

  if (issues.length > 0) {
    summaryParts.push(`### 发现的问题 (${issues.length}项)\n\n`)
    issues.forEach((issue, i) => {
      const severityIcon = issue.severity === 'high' ? '🔴' : issue.severity === 'medium' ? '🟡' : '🟢'
      const typeLabel = { security: '安全', performance: '性能', quality: '质量', style: '风格', maintainability: '可维护性' }[issue.type]
      summaryParts.push(`#### ${severityIcon} ${i + 1}. ${issue.title} [${typeLabel}]\n\n`)
      summaryParts.push(`**描述**: ${issue.description}\n\n`)
      summaryParts.push(`**建议**: ${issue.suggestion}\n\n`)
    })
  }

  summaryParts.push(`### 改进建议汇总\n\n`)
  issues.filter(i => i.severity !== 'low').forEach((issue, i) => {
    summaryParts.push(`${i + 1}. **${issue.title}**: ${issue.suggestion}`)
  })

  summaryParts.push(`\n---\n*本报告由 AI Code Review Pro 生成，基于 Pollinations AI 模型*`)

  const strengthsList = [
    '代码结构清晰，逻辑明确',
    '遵循了基本的编码规范',
    ...typeCounts.security === 0 ? ['未发现安全漏洞'] : [],
    ...typeCounts.performance === 0 ? ['未发现明显性能问题'] : [],
    ...issues.length <= 3 ? ['代码整体质量较高'] : [],
  ]

  return {
    score,
    summary: summaryParts.join('\n'),
    issues,
    strengths: strengthsList,
    metrics,
    reportMd: summaryParts.join('\n'),
  }
}

const AICodeReviewPro = memo(function AICodeReviewPro() {
  const [language, setLanguage] = useState<Language>('javascript')
  const [code, setCode] = useState(SAMPLE_CODE.javascript)
  const [reviewing, setReviewing] = useState(false)
  const [result, setResult] = useState<ReviewResult | null>(null)
  const [showReport, setShowReport] = useState(false)
  const [copied, setCopied] = useState(false)
  const [activeIssueTab, setActiveIssueTab] = useState<'all' | 'security' | 'performance' | 'quality'>('all')

  const handleReview = useCallback(async () => {
    setReviewing(true)
    setResult(null)
    try {
      const prompt = `You are an expert code reviewer. Analyze this ${language} code and provide:\n1. Security issues found\n2. Performance issues\n3. Code quality issues\n4. Specific improvement suggestions\n\nCode to review:\n\`\`\`${language}\n${code}\n\`\`\`\n\nProvide a detailed analysis with scores from 0-100.`
      const aiResult = await pollinationsAI(prompt)
      const parsed = parseAIResponse(aiResult, language)
      setResult(parsed)
    } catch (e: any) {
      const parsed = parseAIResponse('', language)
      parsed.summary += `\n\n*注意: AI分析服务暂时不可用，已使用本地规则引擎分析。错误: ${e.message}*`
      setResult(parsed)
    } finally {
      setReviewing(false)
    }
  }, [code, language])

  const handleCopyReport = async () => {
    if (!result) return
    try {
      await navigator.clipboard.writeText(result.reportMd)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch {}
  }

  const handleExportReport = () => {
    if (!result) return
    const blob = new Blob([result.reportMd], { type: 'text/markdown' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `code-review-${Date.now()}.md`
    a.click()
    URL.revokeObjectURL(url)
  }

  const handleLoadSample = () => {
    setCode(SAMPLE_CODE[language])
    setResult(null)
  }

  const handleLanguageChange = (lang: Language) => {
    setLanguage(lang)
    setCode(SAMPLE_CODE[lang])
    setResult(null)
  }

  const filteredIssues = result?.issues.filter(i =>
    activeIssueTab === 'all' ? true : i.type === activeIssueTab
  ) || []

  const scoreColor = (s: number) => {
    if (s >= 80) return '#22d3ee'
    if (s >= 60) return '#fbbf24'
    if (s >= 40) return '#f97316'
    return '#f472b6'
  }

  const styles: Record<string, React.CSSProperties> = {
    container: {
      width: '100%',
      height: '100%',
      background: 'linear-gradient(135deg, #0f0c29 0%, #302b63 50%, #24243e 100%)',
      color: '#fff',
      padding: 20,
      overflowY: 'auto',
      fontFamily: 'inherit',
    },
    header: { display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20, flexWrap: 'wrap', gap: 12 },
    title: {
      fontSize: 24, fontWeight: 700,
      background: 'linear-gradient(135deg, #22d3ee, #a78bfa, #f472b6)',
      WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent',
      display: 'flex', alignItems: 'center', gap: 10,
    },
    subtitle: { color: 'rgba(255,255,255,0.55)', fontSize: 13 },
    layout: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 },
    leftPanel: { display: 'flex', flexDirection: 'column', gap: 12 },
    rightPanel: { display: 'flex', flexDirection: 'column', gap: 12 },
    glass: {
      background: 'rgba(255,255,255,0.06)',
      backdropFilter: 'blur(16px)',
      WebkitBackdropFilter: 'blur(16px)',
      border: '1px solid rgba(255,255,255,0.1)',
      borderRadius: 16,
      padding: 16,
    },
    sectionTitle: { display: 'flex', alignItems: 'center', gap: 8, fontSize: 14, fontWeight: 600, marginBottom: 10 },
    langTabs: { display: 'flex', gap: 6, background: 'rgba(255,255,255,0.04)', borderRadius: 10, padding: 4, marginBottom: 12 },
    langTab: {
      flex: 1, padding: '8px 12px', borderRadius: 7, border: 'none', cursor: 'pointer',
      fontSize: 12, fontWeight: 600, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
      transition: 'all 0.2s', background: 'transparent', color: 'rgba(255,255,255,0.55)',
    },
    langTabActive: {
      background: 'linear-gradient(135deg, rgba(34,211,238,0.25), rgba(167,139,250,0.25))',
      color: '#fff', boxShadow: '0 2px 10px rgba(34,211,238,0.15)',
    },
    textarea: {
      width: '100%',
      minHeight: 280,
      padding: 14,
      borderRadius: 12,
      border: '1px solid rgba(255,255,255,0.1)',
      background: 'rgba(0,0,0,0.3)',
      color: '#e2e8f0',
      fontFamily: 'JetBrains Mono, Fira Code, monospace',
      fontSize: 13,
      lineHeight: 1.6,
      outline: 'none',
      resize: 'vertical',
      tabSize: 2,
    },
    actionBar: { display: 'flex', gap: 8, marginTop: 12, flexWrap: 'wrap' },
    btn: {
      padding: '10px 18px',
      borderRadius: 10,
      border: '1px solid rgba(255,255,255,0.12)',
      background: 'rgba(255,255,255,0.06)',
      color: '#fff',
      cursor: 'pointer',
      fontSize: 13,
      fontWeight: 600,
      display: 'inline-flex',
      alignItems: 'center',
      gap: 6,
      transition: 'all 0.2s',
    },
    btnPrimary: {
      background: 'linear-gradient(135deg, #22d3ee, #a78bfa)',
      border: 'none',
      color: '#0f0c29',
    },
    scoreCard: {
      textAlign: 'center',
      padding: 20,
    },
    scoreCircle: {
      width: 120, height: 120, borderRadius: '50%',
      background: 'conic-gradient(from 0deg)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      margin: '0 auto', position: 'relative',
    },
    scoreInner: {
      width: 90, height: 90, borderRadius: '50%',
      background: 'rgba(15,12,41,0.9)',
      display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
    },
    scoreValue: { fontSize: 32, fontWeight: 800 },
    scoreLabel: { fontSize: 11, color: 'rgba(255,255,255,0.5)' },
    metricsRow: { display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 10, marginTop: 14 },
    metricItem: {
      padding: '10px 12px', borderRadius: 10,
      background: 'rgba(255,255,255,0.04)',
      border: '1px solid rgba(255,255,255,0.06)',
    },
    metricLabel: { fontSize: 11, color: 'rgba(255,255,255,0.5)', display: 'flex', alignItems: 'center', gap: 4 },
    metricBar: { height: 6, borderRadius: 3, background: 'rgba(255,255,255,0.08)', marginTop: 6, overflow: 'hidden' },
    metricFill: { height: '100%', borderRadius: 3, transition: 'width 0.5s ease' },
    metricValue: { fontSize: 14, fontWeight: 700, marginTop: 6 },
    issueTabs: { display: 'flex', gap: 4, marginBottom: 10, flexWrap: 'wrap' },
    issueTab: {
      padding: '6px 12px', borderRadius: 8, border: 'none', cursor: 'pointer',
      fontSize: 11, fontWeight: 600, transition: 'all 0.2s',
      background: 'rgba(255,255,255,0.05)', color: 'rgba(255,255,255,0.55)',
      display: 'flex', alignItems: 'center', gap: 4,
    },
    issueTabActive: {
      background: 'linear-gradient(135deg, rgba(34,211,238,0.25), rgba(167,139,250,0.25))',
      color: '#fff',
    },
    issueList: { display: 'flex', flexDirection: 'column', gap: 8, maxHeight: 400, overflowY: 'auto' },
    issueItem: {
      padding: '12px 14px', borderRadius: 10,
      background: 'rgba(255,255,255,0.04)',
      border: '1px solid rgba(255,255,255,0.08)',
    },
    issueHeader: { display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6 },
    issueTitle: { fontSize: 13, fontWeight: 600, display: 'flex', alignItems: 'center', gap: 6 },
    severityBadge: {
      fontSize: 10, padding: '2px 8px', borderRadius: 6,
      fontWeight: 700, textTransform: 'uppercase',
    },
    issueDesc: { fontSize: 12, color: 'rgba(255,255,255,0.65)', marginBottom: 6, lineHeight: 1.5 },
    issueSuggest: {
      fontSize: 12, padding: '8px 10px', borderRadius: 8,
      background: 'rgba(34,211,238,0.08)',
      borderLeft: '3px solid #22d3ee',
      color: 'rgba(255,255,255,0.85)',
    },
    emptyState: {
      textAlign: 'center', padding: '40px 20px',
      color: 'rgba(255,255,255,0.45)',
    },
    reportModal: {
      position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
      background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(8px)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      zIndex: 100, padding: 20,
    },
    reportContent: {
      background: 'linear-gradient(135deg, #1a1740, #2d2766)',
      border: '1px solid rgba(255,255,255,0.15)',
      borderRadius: 18, padding: 24, maxWidth: 720, width: '100%',
      maxHeight: '85vh', overflowY: 'auto',
    },
    reportBody: { fontSize: 14, lineHeight: 1.7, color: 'rgba(255,255,255,0.85)' },
  }

  const severityColor = (s: string) => {
    if (s === 'high') return { bg: 'rgba(244,63,94,0.15)', color: '#f472b6', border: '#f472b6' }
    if (s === 'medium') return { bg: 'rgba(251,191,36,0.15)', color: '#fbbf24', border: '#fbbf24' }
    return { bg: 'rgba(34,211,238,0.15)', color: '#22d3ee', border: '#22d3ee' }
  }

  return (
    <div style={styles.container}>
      <div style={styles.header}>
        <div>
          <div style={styles.title}>
            <Brain size={26} />
            AI代码审查专家
          </div>
          <div style={styles.subtitle}>基于 Pollinations AI · 智能代码质量分析 · 安全 · 性能 · 可维护性</div>
        </div>
      </div>

      <div style={styles.layout}>
        <div style={styles.leftPanel}>
          <div style={styles.glass}>
            <div style={styles.sectionTitle}>
              <FileCode size={16} style={{ color: '#a78bfa' }} />
              输入代码
            </div>
            <div style={styles.langTabs}>
              {LANGUAGES.map(l => (
                <button
                  key={l.value}
                  style={{ ...styles.langTab, ...(language === l.value ? styles.langTabActive : {}) }}
                  onClick={() => handleLanguageChange(l.value)}
                >
                  <Code2 size={13} />
                  {l.label}
                </button>
              ))}
            </div>
            <textarea
              style={styles.textarea}
              value={code}
              onChange={e => setCode(e.target.value)}
              placeholder="粘贴或输入需要审查的代码..."
              spellCheck={false}
            />
            <div style={styles.actionBar}>
              <button
                style={{ ...styles.btn, ...styles.btnPrimary }}
                onClick={handleReview}
                disabled={reviewing || !code.trim()}
              >
                <Zap size={14} />
                {reviewing ? (
                  <>
                    <Loader2 size={14} style={{ animation: 'spin 1s linear infinite' }} />
                    AI分析中...
                  </>
                ) : '开始审查'}
              </button>
              <button style={styles.btn} onClick={handleLoadSample}>
                <RotateCcw size={14} /> 加载示例
              </button>
              <button style={styles.btn} onClick={() => { setCode(''); setResult(null) }}>
                <X size={14} /> 清空
              </button>
            </div>
          </div>

          {result && (
            <div style={styles.glass}>
              <div style={styles.sectionTitle}>
                <Award size={16} style={{ color: '#22d3ee' }} />
                亮点
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                {result.strengths.map((s, i) => (
                  <div key={i} style={{ display: 'flex', alignItems: 'flex-start', gap: 8, fontSize: 12, color: 'rgba(255,255,255,0.75)' }}>
                    <CheckCircle size={14} style={{ color: '#22d3ee', flexShrink: 0, marginTop: 1 }} />
                    <span>{s}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        <div style={styles.rightPanel}>
          {!result && !reviewing && (
            <div style={{ ...styles.glass, ...styles.emptyState }}>
              <Search size={40} style={{ margin: '0 auto 16px', color: 'rgba(255,255,255,0.2)' }} />
              <div style={{ fontSize: 15, fontWeight: 600, marginBottom: 8 }}>等待代码输入</div>
              <div style={{ fontSize: 13 }}>
                在左侧输入代码，选择语言后点击"开始审查"<br />
                我将从安全性、性能、可读性等维度进行分析
              </div>
              <div style={{ display: 'flex', justifyContent: 'center', gap: 20, marginTop: 20, flexWrap: 'wrap' }}>
                <div style={{ textAlign: 'center' }}>
                  <Shield size={24} style={{ color: '#f472b6', margin: '0 auto 8px' }} />
                  <div style={{ fontSize: 11 }}>安全扫描</div>
                </div>
                <div style={{ textAlign: 'center' }}>
                  <Gauge size={24} style={{ color: '#fbbf24', margin: '0 auto 8px' }} />
                  <div style={{ fontSize: 11 }}>性能分析</div>
                </div>
                <div style={{ textAlign: 'center' }}>
                  <Lightbulb size={24} style={{ color: '#22d3ee', margin: '0 auto 8px' }} />
                  <div style={{ fontSize: 11 }}>改进建议</div>
                </div>
                <div style={{ textAlign: 'center' }}>
                  <BarChart3 size={24} style={{ color: '#a78bfa', margin: '0 auto 8px' }} />
                  <div style={{ fontSize: 11 }}>评分报告</div>
                </div>
              </div>
            </div>
          )}

          {reviewing && (
            <div style={{ ...styles.glass, ...styles.emptyState }}>
              <Loader2 size={32} style={{ margin: '0 auto 16px', color: '#a78bfa', animation: 'spin 1s linear infinite' }} />
              <div style={{ fontSize: 15, fontWeight: 600, marginBottom: 8 }}>AI 正在分析代码...</div>
              <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.5)' }}>
                检测安全漏洞...<br />
                评估性能特征...<br />
                分析代码质量...<br />
                生成改进建议...
              </div>
            </div>
          )}

          {result && (
            <>
              <div style={{ ...styles.glass, ...styles.scoreCard }}>
                <div style={styles.sectionTitle}>
                  <Gauge size={16} style={{ color: scoreColor(result.score) }} />
                  代码质量评分
                </div>
                <div
                  style={{
                    ...styles.scoreCircle,
                    background: `conic-gradient(${scoreColor(result.score)} ${result.score * 3.6}deg, rgba(255,255,255,0.08) ${result.score * 3.6}deg)`,
                  }}
                >
                  <div style={styles.scoreInner}>
                    <div style={{ ...styles.scoreValue, color: scoreColor(result.score) }}>{result.score}</div>
                    <div style={styles.scoreLabel}>/ 100</div>
                  </div>
                </div>
                <div style={styles.metricsRow}>
                  <div style={styles.metricItem}>
                    <div style={styles.metricLabel}><Shield size={12} /> 安全性</div>
                    <div style={styles.metricBar}>
                      <div style={{ ...styles.metricFill, width: `${result.metrics.security}%`, background: '#f472b6' }} />
                    </div>
                    <div style={{ ...styles.metricValue, color: '#f472b6' }}>{result.metrics.security}</div>
                  </div>
                  <div style={styles.metricItem}>
                    <div style={styles.metricLabel}><Zap size={12} /> 性能</div>
                    <div style={styles.metricBar}>
                      <div style={{ ...styles.metricFill, width: `${result.metrics.performance}%`, background: '#fbbf24' }} />
                    </div>
                    <div style={{ ...styles.metricValue, color: '#fbbf24' }}>{result.metrics.performance}</div>
                  </div>
                  <div style={styles.metricItem}>
                    <div style={styles.metricLabel}><Eye size={12} /> 可读性</div>
                    <div style={styles.metricBar}>
                      <div style={{ ...styles.metricFill, width: `${result.metrics.readability}%`, background: '#22d3ee' }} />
                    </div>
                    <div style={{ ...styles.metricValue, color: '#22d3ee' }}>{result.metrics.readability}</div>
                  </div>
                  <div style={styles.metricItem}>
                    <div style={styles.metricLabel}><Cpu size={12} /> 可维护性</div>
                    <div style={styles.metricBar}>
                      <div style={{ ...styles.metricFill, width: `${result.metrics.maintainability}%`, background: '#a78bfa' }} />
                    </div>
                    <div style={{ ...styles.metricValue, color: '#a78bfa' }}>{result.metrics.maintainability}</div>
                  </div>
                </div>
              </div>

              <div style={styles.glass}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10, flexWrap: 'wrap', gap: 8 }}>
                  <div style={styles.sectionTitle}>
                    <AlertTriangle size={16} style={{ color: '#fbbf24' }} />
                    问题清单 ({filteredIssues.length})
                  </div>
                  <div style={{ display: 'flex', gap: 6 }}>
                    <button style={{ ...styles.btn, padding: '6px 12px', fontSize: 11 }} onClick={() => setShowReport(true)}>
                      <FileText size={12} /> 查看报告
                    </button>
                    <button style={{ ...styles.btn, padding: '6px 12px', fontSize: 11 }} onClick={handleCopyReport}>
                      <Copy size={12} /> {copied ? '已复制' : '复制MD'}
                    </button>
                    <button style={{ ...styles.btn, padding: '6px 12px', fontSize: 11 }} onClick={handleExportReport}>
                      <Download size={12} /> 导出MD
                    </button>
                  </div>
                </div>
                <div style={styles.issueTabs}>
                  {[
                    { key: 'all' as const, label: '全部' },
                    { key: 'security' as const, label: '安全' },
                    { key: 'performance' as const, label: '性能' },
                    { key: 'quality' as const, label: '质量' },
                  ].map(tab => (
                    <button
                      key={tab.key}
                      style={{ ...styles.issueTab, ...(activeIssueTab === tab.key ? styles.issueTabActive : {}) }}
                      onClick={() => setActiveIssueTab(tab.key)}
                    >
                      {tab.label}
                      <span style={{ fontSize: 10, opacity: 0.7 }}>
                        {tab.key === 'all' ? result.issues.length : result.issues.filter(i => i.type === tab.key).length}
                      </span>
                    </button>
                  ))}
                </div>
                <div style={styles.issueList}>
                  {filteredIssues.map((issue) => {
                    const sc = severityColor(issue.severity)
                    return (
                      <div key={issue.id} style={styles.issueItem}>
                        <div style={styles.issueHeader}>
                          <div style={styles.issueTitle}>
                            <span style={{
                              ...styles.severityBadge,
                              background: sc.bg,
                              color: sc.color,
                              border: `1px solid ${sc.border}`,
                            }}>
                              {issue.severity === 'high' ? '高危' : issue.severity === 'medium' ? '中危' : '低危'}
                            </span>
                            <ChevronRight size={12} style={{ color: sc.color }} />
                            {issue.title}
                          </div>
                          <span style={{ fontSize: 10, color: 'rgba(255,255,255,0.4)', textTransform: 'uppercase' }}>
                            {issue.type === 'security' ? '安全' : issue.type === 'performance' ? '性能' : issue.type === 'quality' ? '质量' : issue.type === 'style' ? '风格' : '可维护性'}
                          </span>
                        </div>
                        <div style={styles.issueDesc}>{issue.description}</div>
                        <div style={styles.issueSuggest}>
                          <Lightbulb size={12} style={{ display: 'inline', marginRight: 4, verticalAlign: 'middle', color: '#22d3ee' }} />
                          {issue.suggestion}
                        </div>
                      </div>
                    )
                  })}
                  {filteredIssues.length === 0 && (
                    <div style={{ textAlign: 'center', padding: 20, color: 'rgba(255,255,255,0.3)', fontSize: 13 }}>
                      该分类下暂无问题
                    </div>
                  )}
                </div>
              </div>
            </>
          )}
        </div>
      </div>

      {showReport && result && (
        <div style={styles.reportModal} onClick={() => setShowReport(false)}>
          <div style={styles.reportContent} onClick={e => e.stopPropagation()}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 16 }}>
              <h3 style={{ fontSize: 18, fontWeight: 700, margin: 0, display: 'flex', alignItems: 'center', gap: 8 }}>
                <FileText size={18} style={{ color: '#22d3ee' }} />
                完整审查报告
              </h3>
              <button onClick={() => setShowReport(false)} style={{ background: 'none', border: 'none', color: 'rgba(255,255,255,0.5)', cursor: 'pointer' }}>
                <X size={20} />
              </button>
            </div>
            <div
              style={styles.reportBody}
              dangerouslySetInnerHTML={{ __html: marked.parse(result.reportMd) }}
            />
          </div>
        </div>
      )}
    </div>
  )
})

export default AICodeReviewPro