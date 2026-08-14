import { useState, useCallback, useEffect, memo } from 'react'
import {
  Brain, Shield, Zap, AlertTriangle, CheckCircle, X, Loader2,
  Download, Copy, RotateCcw, FileCode, Cpu, FileText,
  Lightbulb, Gauge, ChevronRight, BarChart3, Eye, Code2,
  History, Trash2, Play, GitCompare, Sparkles, Search,
} from 'lucide-react'
import { marked } from 'marked'

type Language = 'javascript' | 'typescript' | 'python'
type TabKey = 'score' | 'issues' | 'suggestions' | 'refactor'

interface ReviewIssue {
  id: string
  type: 'security' | 'performance' | 'quality' | 'style'
  severity: 'high' | 'medium' | 'low'
  title: string
  description: string
  suggestion: string
  line?: number
}

interface Metrics {
  security: number
  performance: number
  readability: number
  maintainability: number
}

interface ReviewResult {
  score: number
  issues: ReviewIssue[]
  metrics: Metrics
  beforeCode: string
  afterCode: string
  summary: string
  reportMd: string
  aiAnalysis: string
}

interface HistoryItem {
  id: string
  timestamp: number
  language: Language
  code: string
  score: number
  summary: string
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

const STORAGE_KEY = 'smart-code-review-history'

async function pollinationsAI(prompt: string): Promise<string> {
  const seed = Math.floor(Math.random() * 1000000)
  const url = `https://text.pollinations.ai/${encodeURIComponent(prompt)}?seed=${seed}&model=flux`
  const response = await fetch(url)
  if (!response.ok) throw new Error(`API请求失败: ${response.status}`)
  return response.text()
}

function buildPrompt(lang: Language, code: string): string {
  return `作为代码审查专家，分析以下代码并提供改进建议：

\`\`\`${lang}
${code}
\`\`\`

请提供：
1. 代码质量评分（0-100）
2. 潜在问题列表（安全性、性能、代码风格）
3. 改进建议
4. 重构后的代码示例（保持功能不变，优化质量）

请用中文回复，格式清晰。`
}

function parseAIResponse(aiText: string, lang: Language, originalCode: string): ReviewResult {
  const issues: ReviewIssue[] = []

  const checks: Array<{ check: RegExp | boolean; issue: Omit<ReviewIssue, 'id'> }> = [
    {
      check: /SELECT|INSERT|UPDATE|DELETE.*\+.*(input|user|prompt)/i.test(aiText) || /sql.*inject/i.test(aiText) || /sql.*注入/i.test(aiText) || /SELECT.*\+/.test(originalCode),
      issue: {
        type: 'security', severity: 'high',
        title: 'SQL注入风险',
        description: '检测到字符串拼接构建SQL查询，可能导致SQL注入攻击。',
        suggestion: '使用参数化查询或ORM绑定参数，绝不要直接拼接用户输入到SQL语句中。',
      },
    },
    {
      check: /eval\s*\(/.test(originalCode),
      issue: {
        type: 'security', severity: 'high',
        title: '使用eval()函数',
        description: 'eval()会执行任意代码，存在严重的安全风险和性能问题。',
        suggestion: '避免使用eval()，改用更安全的JSON.parse()或Function构造器。',
      },
    },
    {
      check: /innerHTML\s*=/.test(originalCode),
      issue: {
        type: 'security', severity: 'high',
        title: 'XSS风险 - innerHTML',
        description: '直接使用innerHTML可能导致跨站脚本攻击(XSS)。',
        suggestion: '使用textContent替代innerHTML，或对输入进行严格的HTML转义。',
      },
    },
    {
      check: /password\s*=|secret\s*=|api_key\s*=|apiKey\s*=/.test(originalCode),
      issue: {
        type: 'security', severity: 'high',
        title: '硬编码敏感信息',
        description: '代码中包含疑似密码/密钥等敏感信息。',
        suggestion: '将敏感信息存储在环境变量或密钥管理服务中，不要硬编码在源码中。',
      },
    },
    {
      check: /fetch|axios|http/.test(originalCode) && !/catch\s*\(/.test(originalCode),
      issue: {
        type: 'quality', severity: 'medium',
        title: '缺少错误处理',
        description: '网络请求没有对应的错误处理机制，可能导致未捕获的异常。',
        suggestion: '添加try/catch或.catch()错误处理，优雅地处理请求失败情况。',
      },
    },
    {
      check: /console\.log\s*\(/.test(originalCode),
      issue: {
        type: 'quality', severity: 'low',
        title: '使用console.log',
        description: '代码中存在console.log调试输出，不应出现在生产环境中。',
        suggestion: '使用专业的日志框架（如winston、pino），或在构建时移除调试代码。',
      },
    },
    {
      check: /\bvar\s+\w+/.test(originalCode) && lang !== 'python',
      issue: {
        type: 'quality', severity: 'medium',
        title: '使用var声明变量',
        description: 'var存在变量提升和作用域问题，是过时的声明方式。',
        suggestion: '使用const或let替代var，const用于不会重新赋值的变量。',
      },
    },
    {
      check: /[^=!]==[^=]/.test(originalCode) && lang !== 'python',
      issue: {
        type: 'style', severity: 'low',
        title: '使用==而非===',
        description: '==会进行类型转换，可能导致意外的比较结果。',
        suggestion: '始终使用===进行严格相等比较，避免类型强制转换问题。',
      },
    },
    {
      check: lang === 'typescript' && /: any/.test(originalCode),
      issue: {
        type: 'quality', severity: 'medium',
        title: '使用any类型',
        description: 'TypeScript中使用any会丧失类型检查的优势。',
        suggestion: '定义具体的接口或类型，避免使用any。如果类型未知使用unknown代替。',
      },
    },
    {
      check: /for\s*\(.*\).*fetch|for\s+.*:.*requests/i.test(originalCode),
      issue: {
        type: 'performance', severity: 'high',
        title: 'N+1查询问题',
        description: '循环内发起请求/查询，会导致性能问题。',
        suggestion: '使用批量请求或Promise.all并发处理，减少网络往返次数。',
      },
    },
    {
      check: /localhost|127\.0\.0\.1/.test(originalCode),
      issue: {
        type: 'maintainability' as any, severity: 'medium',
        title: '硬编码配置值',
        description: '代码中包含硬编码的URL或配置值，不利于部署和维护。',
        suggestion: '使用环境变量或配置文件管理不同环境的配置。',
      },
    },
  ]

  checks.forEach((cfg, idx) => {
    const triggered = typeof cfg.check === 'boolean' ? cfg.check : cfg.check
    if (triggered) {
      issues.push({ ...cfg.issue, id: `issue-${idx}-${Date.now()}-${Math.random()}` })
    }
  })

  if (issues.length === 0) {
    issues.push({
      id: `issue-info-${Date.now()}`,
      type: 'quality',
      severity: 'low',
      title: '代码质量良好',
      description: '未发现明显问题，代码整体质量较高。',
      suggestion: '继续保持良好的编码习惯，定期进行代码审查。',
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
  const score = Math.max(0, Math.min(100, baseScore - deduction + Math.floor(Math.random() * 8)))

  const metrics: Metrics = {
    security: Math.max(0, 100 - typeCounts.security * 20 + Math.floor(Math.random() * 10)),
    performance: Math.max(0, 100 - typeCounts.performance * 15 + Math.floor(Math.random() * 10)),
    readability: Math.max(0, 70 + Math.floor(Math.random() * 25) - typeCounts.style * 5),
    maintainability: Math.max(0, 80 + Math.floor(Math.random() * 20) - issues.filter(i => i.type === 'quality').length * 8),
  }

  const afterCode = generateRefactoredCode(lang, originalCode, issues)

  const summaryParts: string[] = []
  summaryParts.push(`## AI 代码审查报告\n\n`)
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

  summaryParts.push(`### 重构代码示例\n\n`)
  summaryParts.push(`\`\`\`${lang}\n${afterCode}\n\`\`\n`)

  summaryParts.push(`\n---\n*本报告由 SmartCodeReview 生成，基于 Pollinations AI 模型*`)

  return {
    score,
    issues,
    metrics,
    beforeCode: originalCode,
    afterCode,
    summary: aiText || '代码审查完成',
    reportMd: summaryParts.join('\n'),
    aiAnalysis: aiText,
  }
}

function generateRefactoredCode(lang: Language, code: string, issues: ReviewIssue[]): string {
  let refactored = code

  if (lang === 'javascript' || lang === 'typescript') {
    refactored = refactored.replace(/\bvar\s+(\w+)/g, 'const $1')
    refactored = refactored.replace(/([^=!])==([^=])/g, '$1===$2')
    refactored = refactored.replace(/console\.log\s*\(/g, '// console.log(')
    refactored = refactored.replace(/result\s*=\s*result\s*\+/g, 'result +=')
  }

  if (lang === 'python') {
    refactored = refactored.replace(/cursor\.execute\(query\)/g, '# cursor.execute(query)  # 使用参数化查询')
  }

  if (issues.some(i => i.title.includes('错误处理'))) {
    if (lang === 'javascript' || lang === 'typescript') {
      refactored = refactored.replace(
        /fetch\([^)]+\)\s*\.then/g,
        `try {
  fetch($1)
    .then`
      )
    }
  }

  return refactored
}

function loadHistory(): HistoryItem[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (raw) return JSON.parse(raw)
  } catch {}
  return []
}

function saveHistory(items: HistoryItem[]) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(items.slice(0, 50)))
  } catch {}
}

const SmartCodeReview = memo(function SmartCodeReview() {
  const [language, setLanguage] = useState<Language>('javascript')
  const [code, setCode] = useState(SAMPLE_CODE.javascript)
  const [reviewing, setReviewing] = useState(false)
  const [result, setResult] = useState<ReviewResult | null>(null)
  const [activeTab, setActiveTab] = useState<TabKey>('score')
  const [history, setHistory] = useState<HistoryItem[]>([])
  const [showReport, setShowReport] = useState(false)
  const [copied, setCopied] = useState(false)
  const [batchInput, setBatchInput] = useState('')
  const [showBatch, setShowBatch] = useState(false)
  const [batchResults, setBatchResults] = useState<ReviewResult[]>([])

  useEffect(() => {
    setHistory(loadHistory())
  }, [])

  const addToHistory = useCallback((item: HistoryItem) => {
    setHistory(prev => {
      const next = [item, ...prev].slice(0, 50)
      saveHistory(next)
      return next
    })
  }, [])

  const handleReview = useCallback(async () => {
    if (!code.trim()) return
    setReviewing(true)
    setResult(null)
    try {
      const prompt = buildPrompt(language, code)
      const aiText = await pollinationsAI(prompt)
      const parsed = parseAIResponse(aiText, language, code)
      setResult(parsed)
      addToHistory({
        id: `hist-${Date.now()}`,
        timestamp: Date.now(),
        language,
        code,
        score: parsed.score,
        summary: parsed.aiAnalysis.slice(0, 200),
      })
    } catch (e: any) {
      const parsed = parseAIResponse('', language, code)
      parsed.aiAnalysis = `AI分析服务暂时不可用，已使用本地规则引擎分析。\n\n错误: ${e.message}`
      parsed.reportMd = `## AI 代码审查报告 (离线模式)\n\n**质量评分**: **${parsed.score}/100**\n\n*注: AI服务暂时不可用，使用本地规则引擎分析*\n\n${parsed.reportMd}`
      setResult(parsed)
      addToHistory({
        id: `hist-${Date.now()}`,
        timestamp: Date.now(),
        language,
        code,
        score: parsed.score,
        summary: '离线模式分析',
      })
    } finally {
      setReviewing(false)
    }
  }, [code, language, addToHistory])

  const handleBatchAnalyze = useCallback(async () => {
    const snippets = batchInput.split(/\n---\n|\n===\n|\n\/\/ ---\n/).map(s => s.trim()).filter(Boolean)
    if (snippets.length === 0) return
    setReviewing(true)
    setBatchResults([])
    const results: ReviewResult[] = []
    for (const snippet of snippets) {
      try {
        const prompt = buildPrompt(language, snippet)
        const aiText = await pollinationsAI(prompt)
        const parsed = parseAIResponse(aiText, language, snippet)
        results.push(parsed)
        setBatchResults([...results])
      } catch {
        results.push(parseAIResponse('', language, snippet))
        setBatchResults([...results])
      }
    }
    setReviewing(false)
  }, [batchInput, language])

  const handleLoadSample = () => {
    setCode(SAMPLE_CODE[language])
    setResult(null)
  }

  const handleLanguageChange = (lang: Language) => {
    setLanguage(lang)
    setCode(SAMPLE_CODE[lang])
    setResult(null)
  }

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
    a.download = `smart-code-review-${Date.now()}.md`
    a.click()
    URL.revokeObjectURL(url)
  }

  const handleClearHistory = () => {
    setHistory([])
    localStorage.removeItem(STORAGE_KEY)
  }

  const handleLoadFromHistory = (item: HistoryItem) => {
    setLanguage(item.language)
    setCode(item.code)
  }

  const scoreColor = (s: number) => {
    if (s >= 80) return '#22d3ee'
    if (s >= 60) return '#fbbf24'
    if (s >= 40) return '#f97316'
    return '#f472b6'
  }

  const severityColor = (s: string) => {
    if (s === 'high') return { bg: 'rgba(244,63,94,0.15)', color: '#f472b6', border: '#f472b6' }
    if (s === 'medium') return { bg: 'rgba(251,191,36,0.15)', color: '#fbbf24', border: '#fbbf24' }
    return { bg: 'rgba(34,211,238,0.15)', color: '#22d3ee', border: '#22d3ee' }
  }

  const styles: Record<string, React.CSSProperties> = {
    container: {
      width: '100%',
      height: '100%',
      background: 'linear-gradient(135deg, #0f0c29 0%, #302b63 50%, #24243e 100%)',
      color: '#fff',
      padding: 16,
      overflowY: 'auto',
      fontFamily: 'inherit',
    },
    header: {
      display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      marginBottom: 14, flexWrap: 'wrap', gap: 10,
    },
    title: {
      fontSize: 22, fontWeight: 700,
      background: 'linear-gradient(135deg, #22d3ee, #a78bfa, #f472b6)',
      WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent',
      display: 'flex', alignItems: 'center', gap: 10,
    },
    subtitle: { color: 'rgba(255,255,255,0.5)', fontSize: 12 },
    actionBar: { display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'center' },
    layout: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 },
    leftPanel: { display: 'flex', flexDirection: 'column', gap: 10 },
    rightPanel: { display: 'flex', flexDirection: 'column', gap: 10 },
    glass: {
      background: 'rgba(255,255,255,0.06)',
      backdropFilter: 'blur(16px)',
      WebkitBackdropFilter: 'blur(16px)',
      border: '1px solid rgba(255,255,255,0.1)',
      borderRadius: 14,
      padding: 14,
    },
    sectionTitle: { display: 'flex', alignItems: 'center', gap: 8, fontSize: 13, fontWeight: 600, marginBottom: 10 },
    langTabs: { display: 'flex', gap: 6, background: 'rgba(255,255,255,0.04)', borderRadius: 10, padding: 4, marginBottom: 10 },
    langTab: {
      flex: 1, padding: '7px 10px', borderRadius: 7, border: 'none', cursor: 'pointer',
      fontSize: 11, fontWeight: 600, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 5,
      transition: 'all 0.2s', background: 'transparent', color: 'rgba(255,255,255,0.55)',
    },
    langTabActive: {
      background: 'linear-gradient(135deg, rgba(34,211,238,0.25), rgba(167,139,250,0.25))',
      color: '#fff', boxShadow: '0 2px 10px rgba(34,211,238,0.15)',
    },
    textarea: {
      width: '100%',
      minHeight: 260,
      padding: 12,
      borderRadius: 10,
      border: '1px solid rgba(255,255,255,0.1)',
      background: 'rgba(0,0,0,0.3)',
      color: '#e2e8f0',
      fontFamily: 'JetBrains Mono, Fira Code, monospace',
      fontSize: 12.5,
      lineHeight: 1.6,
      outline: 'none',
      resize: 'vertical',
      tabSize: 2,
    },
    btn: {
      padding: '9px 15px',
      borderRadius: 9,
      border: '1px solid rgba(255,255,255,0.12)',
      background: 'rgba(255,255,255,0.06)',
      color: '#fff',
      cursor: 'pointer',
      fontSize: 12,
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
    btnDanger: {
      background: 'rgba(244,63,94,0.15)',
      border: '1px solid rgba(244,63,94,0.3)',
      color: '#f472b6',
    },
    btnSuccess: {
      background: 'linear-gradient(135deg, #10b981, #059669)',
      border: 'none',
      color: '#fff',
    },
    tabBar: { display: 'flex', gap: 4, marginBottom: 10 },
    tab: {
      flex: 1, padding: '8px 10px', borderRadius: 8, border: 'none', cursor: 'pointer',
      fontSize: 11, fontWeight: 600, transition: 'all 0.2s',
      background: 'rgba(255,255,255,0.05)', color: 'rgba(255,255,255,0.55)',
      display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 5,
    },
    tabActive: {
      background: 'linear-gradient(135deg, rgba(34,211,238,0.25), rgba(167,139,250,0.25))',
      color: '#fff',
    },
    scoreCard: { textAlign: 'center', padding: 16 },
    scoreCircle: {
      width: 110, height: 110, borderRadius: '50%',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      margin: '0 auto', position: 'relative',
    },
    scoreInner: {
      width: 82, height: 82, borderRadius: '50%',
      background: 'rgba(15,12,41,0.9)',
      display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
    },
    scoreValue: { fontSize: 30, fontWeight: 800 },
    scoreLabel: { fontSize: 10, color: 'rgba(255,255,255,0.5)' },
    metricsRow: { display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 8, marginTop: 12 },
    metricItem: {
      padding: '8px 10px', borderRadius: 9,
      background: 'rgba(255,255,255,0.04)',
      border: '1px solid rgba(255,255,255,0.06)',
    },
    metricLabel: { fontSize: 10, color: 'rgba(255,255,255,0.5)', display: 'flex', alignItems: 'center', gap: 4 },
    metricBar: { height: 5, borderRadius: 3, background: 'rgba(255,255,255,0.08)', marginTop: 5, overflow: 'hidden' },
    metricFill: { height: '100%', borderRadius: 3, transition: 'width 0.5s ease' },
    metricValue: { fontSize: 13, fontWeight: 700, marginTop: 5 },
    issueList: { display: 'flex', flexDirection: 'column', gap: 8, maxHeight: 380, overflowY: 'auto' },
    issueItem: {
      padding: '10px 12px', borderRadius: 9,
      background: 'rgba(255,255,255,0.04)',
      border: '1px solid rgba(255,255,255,0.08)',
    },
    issueHeader: { display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 5 },
    issueTitle: { fontSize: 12, fontWeight: 600, display: 'flex', alignItems: 'center', gap: 5 },
    severityBadge: { fontSize: 9, padding: '2px 7px', borderRadius: 5, fontWeight: 700, textTransform: 'uppercase' },
    issueDesc: { fontSize: 11, color: 'rgba(255,255,255,0.65)', marginBottom: 5, lineHeight: 1.5 },
    issueSuggest: {
      fontSize: 11, padding: '7px 9px', borderRadius: 7,
      background: 'rgba(34,211,238,0.08)',
      borderLeft: '3px solid #22d3ee',
      color: 'rgba(255,255,255,0.85)',
    },
    emptyState: { textAlign: 'center', padding: '30px 16px', color: 'rgba(255,255,255,0.45)' },
    compareContainer: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 },
    comparePanel: {
      borderRadius: 9, padding: 10,
      background: 'rgba(0,0,0,0.3)',
      border: '1px solid rgba(255,255,255,0.08)',
    },
    compareHeader: { display: 'flex', alignItems: 'center', gap: 6, fontSize: 11, fontWeight: 600, marginBottom: 8 },
    codeBlock: {
      margin: 0, fontSize: 11, lineHeight: 1.6,
      color: '#e2e8f0', whiteSpace: 'pre-wrap', wordBreak: 'break-word',
      fontFamily: 'JetBrains Mono, Fira Code, monospace',
      maxHeight: 200, overflowY: 'auto',
    },
    historySection: { marginTop: 14 },
    historyItem: {
      padding: '10px 12px', borderRadius: 9, marginBottom: 6,
      background: 'rgba(255,255,255,0.04)',
      border: '1px solid rgba(255,255,255,0.08)',
      cursor: 'pointer',
      display: 'flex', justifyContent: 'space-between', alignItems: 'center',
      transition: 'all 0.2s',
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
      borderRadius: 16, padding: 20, maxWidth: 700, width: '100%',
      maxHeight: '85vh', overflowY: 'auto',
    },
    reportBody: { fontSize: 13, lineHeight: 1.7, color: 'rgba(255,255,255,0.85)' },
    aiAnalysisBox: {
      padding: 12, borderRadius: 10,
      background: 'rgba(167,139,250,0.08)',
      border: '1px solid rgba(167,139,250,0.2)',
      fontSize: 12, lineHeight: 1.7, color: 'rgba(255,255,255,0.8)',
      whiteSpace: 'pre-wrap', maxHeight: 300, overflowY: 'auto',
    },
    batchItem: {
      padding: 10, borderRadius: 8,
      background: 'rgba(255,255,255,0.04)',
      border: '1px solid rgba(255,255,255,0.08)',
      marginBottom: 8,
    },
  }

  const filteredIssues = result?.issues || []

  return (
    <div style={styles.container}>
      <div style={styles.header}>
        <div>
          <div style={styles.title}>
            <Brain size={22} />
            Smart Code Review
          </div>
          <div style={styles.subtitle}>AI驱动的代码审查与重构工具 · Pollinations AI · 安全 · 性能 · 质量</div>
        </div>
        <div style={styles.actionBar}>
          <button style={styles.btn} onClick={() => setShowBatch(!showBatch)}>
            <GitCompare size={13} /> {showBatch ? '单文件模式' : '批量分析'}
          </button>
          <button style={styles.btn} onClick={handleLoadSample}>
            <RotateCcw size={13} /> 加载示例
          </button>
          <button style={{ ...styles.btn, ...styles.btnPrimary }} onClick={handleReview} disabled={reviewing || !code.trim()}>
            <Zap size={13} />
            {reviewing ? (
              <>
                <Loader2 size={13} style={{ animation: 'spin 1s linear infinite' }} />
                AI分析中...
              </>
            ) : '开始审查'}
          </button>
        </div>
      </div>

      <div style={styles.layout}>
        <div style={styles.leftPanel}>
          <div style={styles.glass}>
            <div style={styles.sectionTitle}>
              <FileCode size={15} style={{ color: '#a78bfa' }} />
              代码编辑器
            </div>
            <div style={styles.langTabs}>
              {LANGUAGES.map(l => (
                <button
                  key={l.value}
                  style={{ ...styles.langTab, ...(language === l.value ? styles.langTabActive : {}) }}
                  onClick={() => handleLanguageChange(l.value)}
                >
                  <Code2 size={12} />
                  {l.label}
                </button>
              ))}
            </div>

            {showBatch ? (
              <>
                <textarea
                  style={{ ...styles.textarea, minHeight: 200 }}
                  value={batchInput}
                  onChange={e => setBatchInput(e.target.value)}
                  placeholder="批量代码分析：用 --- 分隔不同代码片段&#10;---&#10;function foo() { ... }&#10;---&#10;const bar = ..."
                  spellCheck={false}
                />
                <div style={{ display: 'flex', gap: 8, marginTop: 10 }}>
                  <button
                    style={{ ...styles.btn, ...styles.btnPrimary }}
                    onClick={handleBatchAnalyze}
                    disabled={reviewing || !batchInput.trim()}
                  >
                    <Play size={13} /> 批量分析
                  </button>
                  <button style={styles.btn} onClick={() => { setBatchInput(''); setBatchResults([]) }}>
                    <X size={13} /> 清空
                  </button>
                </div>
                {batchResults.length > 0 && (
                  <div style={{ marginTop: 12 }}>
                    <div style={styles.sectionTitle}>
                      <BarChart3 size={14} style={{ color: '#22d3ee' }} />
                      批量分析结果 ({batchResults.length})
                    </div>
                    <div style={{ maxHeight: 200, overflowY: 'auto' }}>
                      {batchResults.map((br, i) => (
                        <div key={i} style={styles.batchItem}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <span style={{ fontSize: 11, fontWeight: 600 }}>代码片段 #{i + 1}</span>
                            <span style={{ fontSize: 16, fontWeight: 800, color: scoreColor(br.score) }}>{br.score}</span>
                          </div>
                          <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.5)', marginTop: 4 }}>
                            问题数: {br.issues.length} · 安全: {br.metrics.security} · 性能: {br.metrics.performance}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </>
            ) : (
              <>
                <textarea
                  style={styles.textarea}
                  value={code}
                  onChange={e => setCode(e.target.value)}
                  placeholder="粘贴或输入需要审查的代码..."
                  spellCheck={false}
                />
                <div style={{ display: 'flex', gap: 8, marginTop: 10 }}>
                  <button style={styles.btn} onClick={() => { setCode(''); setResult(null) }}>
                    <X size={13} /> 清空
                  </button>
                  <button style={styles.btn} onClick={() => setShowReport(true)} disabled={!result}>
                    <FileText size={13} /> 查看报告
                  </button>
                  <button style={styles.btn} onClick={handleCopyReport} disabled={!result}>
                    <Copy size={13} /> {copied ? '已复制' : '复制MD'}
                  </button>
                  <button style={styles.btn} onClick={handleExportReport} disabled={!result}>
                    <Download size={13} /> 导出MD
                  </button>
                </div>
              </>
            )}
          </div>

          {result && !showBatch && (
            <div style={styles.glass}>
              <div style={styles.sectionTitle}>
                <Sparkles size={15} style={{ color: '#fbbf24' }} />
                AI 分析详情
              </div>
              <div style={styles.aiAnalysisBox}>
                {result.aiAnalysis || '无AI分析内容'}
              </div>
            </div>
          )}
        </div>

        <div style={styles.rightPanel}>
          {!result && !reviewing && (
            <div style={{ ...styles.glass, ...styles.emptyState }}>
              <Search size={36} style={{ margin: '0 auto 12px', color: 'rgba(255,255,255,0.2)' }} />
              <div style={{ fontSize: 14, fontWeight: 600, marginBottom: 6 }}>等待代码输入</div>
              <div style={{ fontSize: 12 }}>
                在左侧输入代码，选择语言后点击"开始审查"<br />
                我将从安全性、性能、可读性等维度进行分析
              </div>
              <div style={{ display: 'flex', justifyContent: 'center', gap: 16, marginTop: 16, flexWrap: 'wrap' }}>
                <div style={{ textAlign: 'center' }}>
                  <Shield size={20} style={{ color: '#f472b6', margin: '0 auto 6px' }} />
                  <div style={{ fontSize: 10 }}>安全扫描</div>
                </div>
                <div style={{ textAlign: 'center' }}>
                  <Zap size={20} style={{ color: '#fbbf24', margin: '0 auto 6px' }} />
                  <div style={{ fontSize: 10 }}>性能分析</div>
                </div>
                <div style={{ textAlign: 'center' }}>
                  <Lightbulb size={20} style={{ color: '#22d3ee', margin: '0 auto 6px' }} />
                  <div style={{ fontSize: 10 }}>改进建议</div>
                </div>
                <div style={{ textAlign: 'center' }}>
                  <BarChart3 size={20} style={{ color: '#a78bfa', margin: '0 auto 6px' }} />
                  <div style={{ fontSize: 10 }}>评分报告</div>
                </div>
              </div>
            </div>
          )}

          {reviewing && (
            <div style={{ ...styles.glass, ...styles.emptyState }}>
              <Loader2 size={28} style={{ margin: '0 auto 12px', color: '#a78bfa', animation: 'spin 1s linear infinite' }} />
              <div style={{ fontSize: 14, fontWeight: 600, marginBottom: 6 }}>AI 正在分析代码...</div>
              <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.5)' }}>
                检测安全漏洞...<br />
                评估性能特征...<br />
                分析代码质量...<br />
                生成重构建议...
              </div>
            </div>
          )}

          {result && !showBatch && (
            <>
              <div style={styles.glass}>
                <div style={styles.tabBar}>
                  {[
                    { key: 'score' as const, label: '评分', icon: <Gauge size={11} /> },
                    { key: 'issues' as const, label: `问题 (${result.issues.length})`, icon: <AlertTriangle size={11} /> },
                    { key: 'suggestions' as const, label: '建议', icon: <Lightbulb size={11} /> },
                    { key: 'refactor' as const, label: '重构对比', icon: <GitCompare size={11} /> },
                  ].map(tab => (
                    <button
                      key={tab.key}
                      style={{ ...styles.tab, ...(activeTab === tab.key ? styles.tabActive : {}) }}
                      onClick={() => setActiveTab(tab.key)}
                    >
                      {tab.icon} {tab.label}
                    </button>
                  ))}
                </div>

                {activeTab === 'score' && (
                  <div style={styles.scoreCard}>
                    <div style={styles.sectionTitle}>
                      <Gauge size={15} style={{ color: scoreColor(result.score) }} />
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
                        <div style={styles.metricLabel}><Shield size={11} /> 安全性</div>
                        <div style={styles.metricBar}>
                          <div style={{ ...styles.metricFill, width: `${result.metrics.security}%`, background: '#f472b6' }} />
                        </div>
                        <div style={{ ...styles.metricValue, color: '#f472b6' }}>{result.metrics.security}</div>
                      </div>
                      <div style={styles.metricItem}>
                        <div style={styles.metricLabel}><Zap size={11} /> 性能</div>
                        <div style={styles.metricBar}>
                          <div style={{ ...styles.metricFill, width: `${result.metrics.performance}%`, background: '#fbbf24' }} />
                        </div>
                        <div style={{ ...styles.metricValue, color: '#fbbf24' }}>{result.metrics.performance}</div>
                      </div>
                      <div style={styles.metricItem}>
                        <div style={styles.metricLabel}><Eye size={11} /> 可读性</div>
                        <div style={styles.metricBar}>
                          <div style={{ ...styles.metricFill, width: `${result.metrics.readability}%`, background: '#22d3ee' }} />
                        </div>
                        <div style={{ ...styles.metricValue, color: '#22d3ee' }}>{result.metrics.readability}</div>
                      </div>
                      <div style={styles.metricItem}>
                        <div style={styles.metricLabel}><Cpu size={11} /> 可维护性</div>
                        <div style={styles.metricBar}>
                          <div style={{ ...styles.metricFill, width: `${result.metrics.maintainability}%`, background: '#a78bfa' }} />
                        </div>
                        <div style={{ ...styles.metricValue, color: '#a78bfa' }}>{result.metrics.maintainability}</div>
                      </div>
                    </div>
                  </div>
                )}

                {activeTab === 'issues' && (
                  <div>
                    <div style={styles.issueList}>
                      {filteredIssues.map((issue) => {
                        const sc = severityColor(issue.severity)
                        return (
                          <div key={issue.id} style={styles.issueItem}>
                            <div style={styles.issueHeader}>
                              <div style={styles.issueTitle}>
                                <span style={{ ...styles.severityBadge, background: sc.bg, color: sc.color, border: `1px solid ${sc.border}` }}>
                                  {issue.severity === 'high' ? '高危' : issue.severity === 'medium' ? '中危' : '低危'}
                                </span>
                                <ChevronRight size={11} style={{ color: sc.color }} />
                                {issue.title}
                              </div>
                              <span style={{ fontSize: 9, color: 'rgba(255,255,255,0.4)', textTransform: 'uppercase' }}>
                                {issue.type === 'security' ? '安全' : issue.type === 'performance' ? '性能' : issue.type === 'quality' ? '质量' : issue.type === 'style' ? '风格' : '可维护性'}
                              </span>
                            </div>
                            <div style={styles.issueDesc}>{issue.description}</div>
                            <div style={styles.issueSuggest}>
                              <Lightbulb size={11} style={{ display: 'inline', marginRight: 4, verticalAlign: 'middle', color: '#22d3ee' }} />
                              {issue.suggestion}
                            </div>
                          </div>
                        )
                      })}
                    </div>
                  </div>
                )}

                {activeTab === 'suggestions' && (
                  <div>
                    <div style={styles.sectionTitle}>
                      <Lightbulb size={14} style={{ color: '#22d3ee' }} />
                      改进建议汇总
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 8, maxHeight: 400, overflowY: 'auto' }}>
                      {result.issues.filter(i => i.severity !== 'low').map((issue, i) => (
                        <div key={i} style={{
                          padding: '10px 12px', borderRadius: 9,
                          background: 'rgba(34,211,238,0.06)',
                          border: '1px solid rgba(34,211,238,0.15)',
                        }}>
                          <div style={{ fontSize: 12, fontWeight: 600, marginBottom: 4 }}>
                            <Lightbulb size={12} style={{ display: 'inline', marginRight: 5, verticalAlign: 'middle', color: '#22d3ee' }} />
                            {issue.title}
                          </div>
                          <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.7)', lineHeight: 1.6 }}>
                            {issue.suggestion}
                          </div>
                        </div>
                      ))}
                      {result.issues.filter(i => i.severity !== 'low').length === 0 && (
                        <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.4)', textAlign: 'center', padding: 20 }}>
                          暂无高优先级建议
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {activeTab === 'refactor' && (
                  <div>
                    <div style={styles.sectionTitle}>
                      <GitCompare size={14} style={{ color: '#fbbf24' }} />
                      Before / After 对比
                    </div>
                    <div style={styles.compareContainer}>
                      <div style={styles.comparePanel}>
                        <div style={{ ...styles.compareHeader, color: '#f472b6' }}>
                          <X size={12} /> Before (原始)
                        </div>
                        <pre style={styles.codeBlock}>{result.beforeCode}</pre>
                      </div>
                      <div style={styles.comparePanel}>
                        <div style={{ ...styles.compareHeader, color: '#22d3ee' }}>
                          <CheckCircle size={12} /> After (重构)
                        </div>
                        <pre style={styles.codeBlock}>{result.afterCode}</pre>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </>
          )}
        </div>
      </div>

      {history.length > 0 && (
        <div style={{ ...styles.glass, ...styles.historySection }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
            <div style={styles.sectionTitle}>
              <History size={15} style={{ color: '#a78bfa' }} />
              历史记录 ({history.length})
            </div>
            <button style={{ ...styles.btn, ...styles.btnDanger }} onClick={handleClearHistory}>
              <Trash2 size={12} /> 清空历史
            </button>
          </div>
          <div style={{ maxHeight: 180, overflowY: 'auto' }}>
            {history.map((item) => (
              <div
                key={item.id}
                style={styles.historyItem}
                onClick={() => handleLoadFromHistory(item)}
                onMouseEnter={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.08)' }}
                onMouseLeave={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.04)' }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <div style={{
                    width: 32, height: 32, borderRadius: 8,
                    background: `linear-gradient(135deg, ${scoreColor(item.score)}, ${scoreColor(item.score)}88)`,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: 12, fontWeight: 800, color: '#0f0c29',
                  }}>
                    {item.score}
                  </div>
                  <div>
                    <div style={{ fontSize: 11, fontWeight: 600 }}>
                      {LANGUAGES.find(l => l.value === item.language)?.label} · {new Date(item.timestamp).toLocaleString('zh-CN')}
                    </div>
                    <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.45)', maxWidth: 400, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {item.summary}
                    </div>
                  </div>
                </div>
                <ChevronRight size={14} style={{ color: 'rgba(255,255,255,0.3)' }} />
              </div>
            ))}
          </div>
        </div>
      )}

      {showReport && result && (
        <div style={styles.reportModal} onClick={() => setShowReport(false)}>
          <div style={styles.reportContent} onClick={e => e.stopPropagation()}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 14 }}>
              <h3 style={{ fontSize: 16, fontWeight: 700, margin: 0, display: 'flex', alignItems: 'center', gap: 8 }}>
                <FileText size={16} style={{ color: '#22d3ee' }} />
                完整审查报告
              </h3>
              <div style={{ display: 'flex', gap: 6 }}>
                <button style={{ ...styles.btn, padding: '6px 12px', fontSize: 11 }} onClick={handleCopyReport}>
                  <Copy size={12} /> 复制
                </button>
                <button style={{ ...styles.btn, padding: '6px 12px', fontSize: 11 }} onClick={handleExportReport}>
                  <Download size={12} /> 导出
                </button>
                <button onClick={() => setShowReport(false)} style={{ background: 'none', border: 'none', color: 'rgba(255,255,255,0.5)', cursor: 'pointer' }}>
                  <X size={18} />
                </button>
              </div>
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

export default SmartCodeReview