import { useState, useCallback, useEffect, useRef } from 'react'
import { useStore } from '../store'
import { API_CONFIG, fetchWithTimeout, handleApiError } from '../config/apiConfig'
import {
  Sparkles,
  Wand2,
  Code,
  FileCode,
  Search,
  Trash2,
  Download,
  Copy,
  Check,
  Eye,
  Zap,
  Shield,
  AlertTriangle,
  GitMerge,
  Play,
  BarChart3,
  Lightbulb,
  ChevronRight,
  Loader2,
  FileText,
  Brain,
  Gauge,
  Rocket,
  ThumbsUp,
} from 'lucide-react'

type Language = 'javascript' | 'typescript' | 'python'
type TabType = 'overview' | 'issues' | 'refactor' | 'performance' | 'report'

interface RefactorIssue {
  id: string
  category: 'bug' | 'performance' | 'readability' | 'best-practice' | 'security'
  severity: 'critical' | 'high' | 'medium' | 'low'
  title: string
  description: string
  line?: number
  suggestion: string
  before: string
  after: string
}

interface QualityScore {
  overall: number
  readability: number
  maintainability: number
  performance: number
  security: number
  style: number
}

interface PerformanceTip {
  id: string
  title: string
  description: string
  impact: 'high' | 'medium' | 'low'
  before: string
  after: string
}

interface AnalysisResult {
  scores: QualityScore
  issues: RefactorIssue[]
  performanceTips: PerformanceTip[]
  summary: string
  refactoredCode: string
  rawAIResponse: string
}

const SAMPLE_CODE: Record<Language, string> = {
  javascript: `// 电商购物车计算模块
var taxRate = 0.08;
var discountThreshold = 100;

function calculateOrderTotal(items, user) {
    var subtotal = 0;
    var discount = 0;
    var shipping = 10;
    
    for (var i = 0; i < items.length; i++) {
        var item = items[i];
        var price = item.price;
        var qty = item.quantity;
        subtotal = subtotal + price * qty;
    }
    
    if (subtotal > discountThreshold) {
        discount = subtotal * 0.1;
    }
    
    var totalBeforeTax = subtotal - discount + shipping;
    var total = totalBeforeTax * (1 + taxRate);
    
    if (user.isVip == true) {
        total = total * 0.95;
    }
    
    return total.toFixed(2);
}

function validateCoupon(code) {
    var isValid = false;
    if (code.length > 0) {
        if (code.substring(0, 3) == 'SAVE') {
            isValid = true;
        }
    }
    return isValid;
}

var order = calculateOrderTotal([
    { name: "Widget", price: 29.99, quantity: 2 },
    { name: "Gadget", price: 49.99, quantity: 1 },
    { name: "Doohickey", price: 15.50, quantity: 5 }
], { name: "John", isVip: true });

console.log("Order total: $" + order);`,

  typescript: `// 数据处理管道
interface DataConfig {
  source: string;
  options: {
    transform?: boolean;
    validate?: boolean;
  };
}

var DEFAULT_CONFIG: DataConfig = {
  source: "api",
  options: {
    transform: true,
    validate: true
  }
};

function processData(config: DataConfig, callback: Function) {
    var results: any[] = [];
    var errors: any[] = [];
    
    for (var i = 0; i < 100; i++) {
        var dataPoint = fetchDataPoint(config.source, i);
        
        if (dataPoint != null) {
            if (config.options.transform) {
                var transformed = transformData(dataPoint);
                results.push(transformed);
            }
            
            if (config.options.validate) {
                var valid = validateData(dataPoint);
                if (!valid) {
                    errors.push({ index: i, reason: "validation failed" });
                }
            }
        }
    }
    
    if (errors.length > 0) {
        console.log("Warnings: " + errors.length + " items failed");
    }
    
    if (callback) {
        callback(null, results);
    } else {
        return results;
    }
}

function fetchDataPoint(source: string, id: number): any {
    return { id: id, value: Math.random() * 100, source: source };
}

function transformData(data: any): any {
    return {
        ...data,
        processed: true,
        timestamp: new Date().toISOString()
    };
}

function validateData(data: any): boolean {
    return data.value >= 0 && data.value <= 100;
}

var config: DataConfig = { ...DEFAULT_CONFIG, source: "stream" };
processData(config, function(err: any, results: any[]) {
    if (err) {
        console.error(err);
    } else {
        console.log("Processed " + results.length + " items");
    }
});`,

  python: `# 股票数据分析器
import datetime

MAX_RETRIES = 3
DEFAULT_TIMEOUT = 30

def fetch_stock_data(symbol, start_date, end_date, callback=None):
    data = []
    errors = []
    retries = 0
    
    for attempt in range(MAX_RETRIES):
        try:
            response = make_api_request(symbol, start_date, end_date)
            if response is not None:
                for record in response:
                    if record['price'] > 0:
                        processed = {
                            'symbol': symbol,
                            'date': record['date'],
                            'price': record['price'],
                            'volume': record.get('volume', 0),
                            'change': 0
                        }
                        data.append(processed)
                break
        except Exception as e:
            retries += 1
            errors.append({'attempt': retries, 'error': str(e)})
            if retries >= MAX_RETRIES:
                print("Max retries exceeded for " + symbol)
    
    if callback:
        callback(None, data)
    else:
        return data

def calculate_moving_average(prices, window):
    averages = []
    for i in range(len(prices)):
        if i >= window:
            slice_prices = prices[i - window:i]
            avg = sum(slice_prices) / len(slice_prices)
            averages.append(avg)
    return averages

def analyze_portfolio(holdings):
    total_value = 0
    total_cost = 0
    gains_losses = []
    
    for holding in holdings:
        symbol = holding['symbol']
        shares = holding['shares']
        cost_basis = holding['cost']
        
        stock_data = fetch_stock_data(symbol, "2024-01-01", "2024-12-31")
        
        if stock_data and len(stock_data) > 0:
            current_price = stock_data[-1]['price']
            value = current_price * shares
            cost = cost_basis * shares
            gain = value - cost
            
            total_value = total_value + value
            total_cost = total_cost + cost
            gains_losses.append({
                'symbol': symbol,
                'gain': gain,
                'percentage': (gain / cost) * 100
            })
    
    return {
        'total_value': total_value,
        'total_cost': total_cost,
        'gain_loss': total_value - total_cost,
        'holdings_detail': gains_losses
    }

portfolio = [
    {'symbol': 'AAPL', 'shares': 100, 'cost': 150.00},
    {'symbol': 'GOOGL', 'shares': 50, 'cost': 140.00},
    {'symbol': 'MSFT', 'shares': 75, 'cost': 300.00}
]

result = analyze_portfolio(portfolio)
print("Portfolio value: $" + str(result['total_value']))`
}

const LANGUAGE_META: Record<Language, { label: string; icon: string; color: string }> = {
  javascript: { label: 'JavaScript', icon: 'JS', color: '#f7df1e' },
  typescript: { label: 'TypeScript', icon: 'TS', color: '#3178c6' },
  python: { label: 'Python', icon: 'PY', color: '#3776ab' },
}

const SEVERITY_CONFIG = {
  critical: { label: '严重', color: '#ef4444', bg: 'rgba(239, 68, 68, 0.15)' },
  high: { label: '高', color: '#f97316', bg: 'rgba(249, 115, 22, 0.15)' },
  medium: { label: '中', color: '#f59e0b', bg: 'rgba(245, 158, 11, 0.15)' },
  low: { label: '低', color: '#3b82f6', bg: 'rgba(59, 130, 246, 0.15)' },
}

const CATEGORY_CONFIG = {
  bug: { label: '缺陷', icon: '🐛', color: '#ef4444' },
  performance: { label: '性能', icon: '⚡', color: '#f59e0b' },
  readability: { label: '可读性', icon: '📖', color: '#8b5cf6' },
  'best-practice': { label: '最佳实践', icon: '✨', color: '#10b981' },
  security: { label: '安全', icon: '🔒', color: '#ec4899' },
}

const PERFORMANCE_IMPACT = {
  high: { label: '高影响', color: '#ef4444' },
  medium: { label: '中影响', color: '#f59e0b' },
  low: { label: '低影响', color: '#3b82f6' },
}

async function pollinateText(prompt: string, systemPrompt = '', timeout = 60000): Promise<string> {
  const fullPrompt = systemPrompt
    ? `<|im_start|>system\n${systemPrompt}\n<|im_end|>\n<|im_start|>user\n${prompt}\n<|im_end|>\n<|im_start|>assistant\n`
    : prompt
  const res = await fetchWithTimeout(
    `${API_CONFIG.pollinations.textBaseUrl}/${encodeURIComponent(fullPrompt)}?model=${API_CONFIG.pollinations.defaultModel}&seed=-1&temperature=0.3`,
    { headers: { Accept: 'text/plain' } },
    timeout,
  )
  if (!res.ok) throw new Error(`HTTP ${res.status}`)
  return await res.text()
}

function parseAIResponse(raw: string): AnalysisResult {
  const issues: RefactorIssue[] = []
  const performanceTips: PerformanceTip[] = []
  let scores: QualityScore = {
    overall: 70, readability: 70, maintainability: 65,
    performance: 75, security: 80, style: 60,
  }
  let summary = ''
  let refactoredCode = ''

  try {
    const jsonMatch = raw.match(/```json\s*([\s\S]*?)```/) || raw.match(/```\s*([\s\S]*?)```/)
    if (jsonMatch) {
      const parsed = JSON.parse(jsonMatch[1].trim())
      if (parsed.scores) scores = { ...scores, ...parsed.scores }
      if (Array.isArray(parsed.issues)) {
        for (const iss of parsed.issues) {
          issues.push({
            id: iss.id || `issue-${Math.random().toString(36).slice(2, 8)}`,
            category: iss.category || 'best-practice',
            severity: iss.severity || 'medium',
            title: iss.title || '未命名问题',
            description: iss.description || '',
            line: iss.line,
            suggestion: iss.suggestion || '',
            before: iss.before || '',
            after: iss.after || '',
          })
        }
      }
      if (Array.isArray(parsed.performanceTips)) {
        for (const tip of parsed.performanceTips) {
          performanceTips.push({
            id: tip.id || `perf-${Math.random().toString(36).slice(2, 8)}`,
            title: tip.title || '',
            description: tip.description || '',
            impact: tip.impact || 'medium',
            before: tip.before || '',
            after: tip.after || '',
          })
        }
      }
      summary = parsed.summary || ''
      refactoredCode = parsed.refactoredCode || ''
    }
  } catch {
    summary = raw.slice(0, 300)
  }

  if (!summary) {
    const grade = scores.overall >= 85 ? '优秀' : scores.overall >= 70 ? '良好' : scores.overall >= 50 ? '一般' : '需重构'
    summary = `代码质量评级: ${grade}（${scores.overall}/100）。发现 ${issues.length} 个改进建议，${performanceTips.length} 个性能优化机会。`
  }

  return { scores, issues, performanceTips, summary, refactoredCode, rawAIResponse: raw }
}

function generateAnalysisPrompt(code: string, language: Language): string {
  return `请作为一位资深的全栈代码审查专家，对以下${LANGUAGE_META[language].label}代码进行深度分析。

请从以下维度进行评估:
1. 代码质量评分（0-100分）
2. 发现的问题（缺陷、性能、可读性、最佳实践、安全）
3. 性能优化建议
4. 重构后的优化代码

请以严格的 JSON 格式输出，结构如下:
\`\`\`json
{
  "scores": {
    "overall": 85,
    "readability": 88,
    "maintainability": 82,
    "performance": 90,
    "security": 95,
    "style": 80
  },
  "issues": [
    {
      "id": "issue-1",
      "category": "performance",
      "severity": "medium",
      "title": "问题标题",
      "description": "问题详细描述",
      "line": 10,
      "suggestion": "改进建议",
      "before": "原代码片段",
      "after": "优化后代码片段"
    }
  ],
  "performanceTips": [
    {
      "id": "perf-1",
      "title": "优化建议标题",
      "description": "详细说明",
      "impact": "high",
      "before": "原实现",
      "after": "优化实现"
    }
  ],
  "summary": "总体评价摘要",
  "refactoredCode": "完整的重构后代码"
}
\`\`\`

要求:
- issues 数组中每个问题必须包含 before 和 after 代码片段
- performanceTips 聚焦于循环优化、数据结构选择、算法复杂度等
- refactoredCode 是完整的重构后代码，保持原有功能
- category 可选值: bug, performance, readability, best-practice, security
- severity 可选值: critical, high, medium, low
- impact 可选值: high, medium, low

代码:
\`\`\`${language}
${code}
\`\`\``
}

function generateMarkdownReport(result: AnalysisResult, language: Language, code: string): string {
  const now = new Date().toLocaleString('zh-CN')
  const scoreColor = result.scores.overall >= 85 ? '🟢' : result.scores.overall >= 70 ? '🟡' : result.scores.overall >= 50 ? '🟠' : '🔴'

  let md = `# AI 代码重构分析报告

> 生成时间: ${now}  
> 编程语言: ${LANGUAGE_META[language].label}  
> 代码行数: ${code.split('\n').length} 行

---

## 📊 质量总评

${scoreColor} **综合评分: ${result.scores.overall}/100**

| 维度 | 分数 | 评价 |
|------|------|------|
| 可读性 | ${result.scores.readability}/100 | ${result.scores.readability >= 80 ? '优秀' : result.scores.readability >= 60 ? '良好' : '需要改进'} |
| 可维护性 | ${result.scores.maintainability}/100 | ${result.scores.maintainability >= 80 ? '优秀' : result.scores.maintainability >= 60 ? '良好' : '需要改进'} |
| 性能 | ${result.scores.performance}/100 | ${result.scores.performance >= 80 ? '优秀' : result.scores.performance >= 60 ? '良好' : '需要改进'} |
| 安全性 | ${result.scores.security}/100 | ${result.scores.security >= 80 ? '优秀' : result.scores.security >= 60 ? '良好' : '需要改进'} |
| 代码风格 | ${result.scores.style}/100 | ${result.scores.style >= 80 ? '优秀' : result.scores.style >= 60 ? '良好' : '需要改进'} |

### 总体摘要

${result.summary}

---

## 🔍 发现的问题 (${result.issues.length})

`
  if (result.issues.length === 0) {
    md += '✅ 未发现明显问题。\n\n'
  } else {
    for (const issue of result.issues) {
      const sev = SEVERITY_CONFIG[issue.severity]
      const cat = CATEGORY_CONFIG[issue.category]
      md += `### ${cat.icon} [${cat.label}] ${issue.title}

- **严重程度**: ${sev.label}
${issue.line ? `- **位置**: 第 ${issue.line} 行` : ''}
- **描述**: ${issue.description}
- **建议**: ${issue.suggestion}

**优化前:**
\`\`\`${language}
${issue.before}
\`\`\`

**优化后:**
\`\`\`${language}
${issue.after}
\`\`\`

---

`
    }
  }

  md += `## ⚡ 性能优化建议 (${result.performanceTips.length})

`
  if (result.performanceTips.length === 0) {
    md += '✅ 暂无性能优化建议。\n\n'
  } else {
    for (const tip of result.performanceTips) {
      const impact = PERFORMANCE_IMPACT[tip.impact]
      md += `### 💡 ${tip.title}

- **影响程度**: ${impact.label}
- **说明**: ${tip.description}

**原实现:**
\`\`\`${language}
${tip.before}
\`\`\`

**优化实现:**
\`\`\`${language}
${tip.after}
\`\`\`

---

`
    }
  }

  if (result.refactoredCode) {
    md += `## 🎯 重构后完整代码

\`\`\`${language}
${result.refactoredCode}
\`\`\`

---

*本报告由 Pollinations AI 代码分析引擎自动生成*
`
  }

  return md
}

export default function CodeRefactorAI() {
  const theme = useStore((s) => s.theme)
  const [code, setCode] = useState(SAMPLE_CODE.javascript)
  const [language, setLanguage] = useState<Language>('javascript')
  const [isAnalyzing, setIsAnalyzing] = useState(false)
  const [result, setResult] = useState<AnalysisResult | null>(null)
  const [activeTab, setActiveTab] = useState<TabType>('overview')
  const [comparisonMode, setComparisonMode] = useState<'before' | 'after' | 'split'>('split')
  const [copied, setCopied] = useState(false)
  const [toast, setToast] = useState<string | null>(null)
  const toastTimer = useRef<ReturnType<typeof setTimeout> | null>(null)

  const isDark = theme === 'dark'

  const showToast = useCallback((msg: string) => {
    setToast(msg)
    if (toastTimer.current) clearTimeout(toastTimer.current)
    toastTimer.current = setTimeout(() => setToast(null), 2200)
  }, [])

  const runAnalysis = useCallback(async () => {
    if (!code.trim()) return
    setIsAnalyzing(true)
    setResult(null)

    try {
      const raw = await pollinateText(
        generateAnalysisPrompt(code, language),
        '你是一位资深的全栈代码审查专家和性能优化专家。请严格按照 JSON 格式输出分析结果。确保所有代码片段都是有效的。',
        90000,
      )
      const parsed = parseAIResponse(raw)
      setResult(parsed)
      setActiveTab('overview')
      showToast('分析完成')
    } catch (e) {
      showToast(`分析失败: ${handleApiError(e, 'AI 代码分析')}`)
    } finally {
      setIsAnalyzing(false)
    }
  }, [code, language, showToast])

  const loadSampleCode = useCallback((lang: Language) => {
    setLanguage(lang)
    setCode(SAMPLE_CODE[lang])
    setResult(null)
  }, [])

  const clearCode = useCallback(() => {
    setCode('')
    setResult(null)
  }, [])

  const copyToClipboard = useCallback((text: string) => {
    if (!text) return
    navigator.clipboard.writeText(text).then(() => {
      setCopied(true)
      showToast('已复制到剪贴板')
      setTimeout(() => setCopied(false), 2000)
    }).catch(() => showToast('复制失败'))
  }, [showToast])

  const exportReport = useCallback(() => {
    if (!result) return
    const md = generateMarkdownReport(result, language, code)
    const blob = new Blob([md], { type: 'text/markdown' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `refactoring-report-${Date.now()}.md`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
    showToast('报告已导出')
  }, [result, language, code, showToast])

  const applyRefactoredCode = useCallback(() => {
    if (result?.refactoredCode) {
      setCode(result.refactoredCode)
      showToast('已应用重构代码')
    }
  }, [result, showToast])

  const totalIssues = result?.issues.length ?? 0
  const criticalCount = result?.issues.filter(i => i.severity === 'critical').length ?? 0
  const highCount = result?.issues.filter(i => i.severity === 'high').length ?? 0

  const getScoreGrade = (score: number) => {
    if (score >= 85) return { label: '优秀', color: '#22c55e' }
    if (score >= 70) return { label: '良好', color: '#84cc16' }
    if (score >= 50) return { label: '一般', color: '#f59e0b' }
    if (score >= 30) return { label: '较差', color: '#f97316' }
    return { label: '需重构', color: '#ef4444' }
  }

  const glassBg = isDark ? 'rgba(15, 23, 42, 0.55)' : 'rgba(255, 255, 255, 0.65)'
  const glassBorder = isDark ? 'rgba(148, 163, 184, 0.15)' : 'rgba(15, 23, 42, 0.1)'
  const textPrimary = isDark ? '#f1f5f9' : '#0f172a'
  const textSecondary = isDark ? '#94a3b8' : '#64748b'
  const accentColor = '#8b5cf6'
  const accentGradient = 'linear-gradient(135deg, #6366f1, #8b5cf6)'

  const tabs: { id: TabType; label: string; icon: React.ReactNode; count?: number }[] = [
    { id: 'overview', label: '总览', icon: <Gauge size={14} /> },
    { id: 'issues', label: '问题', icon: <AlertTriangle size={14} />, count: totalIssues },
    { id: 'refactor', label: '重构对比', icon: <GitMerge size={14} /> },
    { id: 'performance', label: '性能优化', icon: <Zap size={14} />, count: result?.performanceTips.length },
    { id: 'report', label: '报告', icon: <FileText size={14} /> },
  ]

  return (
    <div
      className="app-container"
      style={{
        display: 'flex',
        flexDirection: 'column',
        height: '100%',
        overflow: 'hidden',
        background: isDark
          ? 'linear-gradient(135deg, #0f0c29 0%, #1a1a3e 50%, #24243e 100%)'
          : 'linear-gradient(135deg, #e0e7ff 0%, #f0f4ff 50%, #e0f2fe 100%)',
        color: textPrimary,
        fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
      }}
    >
      {/* Header */}
      <div style={{
        padding: '14px 20px',
        background: glassBg,
        backdropFilter: 'blur(20px)',
        WebkitBackdropFilter: 'blur(20px)',
        borderBottom: `1px solid ${glassBorder}`,
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        flexShrink: 0,
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <div style={{
            width: 42,
            height: 42,
            borderRadius: 12,
            background: 'linear-gradient(135deg, #6366f1, #8b5cf6)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            boxShadow: '0 4px 12px rgba(99, 102, 241, 0.4)',
          }}>
            <Brain size={22} color="white" />
          </div>
          <div>
            <div style={{ fontWeight: 700, fontSize: 17, display: 'flex', alignItems: 'center', gap: 6 }}>
              AI 代码重构引擎
              <Sparkles size={14} style={{ color: accentColor }} />
            </div>
            <div style={{ fontSize: 12, color: textSecondary }}>
              Pollinations AI 驱动 · 智能分析代码质量，提供重构建议
            </div>
          </div>
        </div>
        <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
          <div style={{
            display: 'flex',
            background: isDark ? 'rgba(255,255,255,0.04)' : 'rgba(0,0,0,0.03)',
            borderRadius: 10,
            padding: 3,
            gap: 2,
          }}>
            {(Object.keys(LANGUAGE_META) as Language[]).map(lang => (
              <button
                key={lang}
                onClick={() => loadSampleCode(lang)}
                style={{
                  padding: '6px 12px',
                  borderRadius: 8,
                  border: 'none',
                  background: language === lang ? accentGradient : 'transparent',
                  color: language === lang ? 'white' : textSecondary,
                  cursor: 'pointer',
                  fontSize: 12,
                  fontWeight: 600,
                  transition: 'all 0.2s',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 4,
                }}
              >
                {LANGUAGE_META[lang].icon}
              </button>
            ))}
          </div>
          <button
            onClick={() => loadSampleCode(language)}
            style={{
              padding: '8px 14px',
              borderRadius: 10,
              border: `1px solid ${glassBorder}`,
              background: glassBg,
              backdropFilter: 'blur(10px)',
              color: textPrimary,
              cursor: 'pointer',
              fontSize: 13,
              display: 'flex',
              alignItems: 'center',
              gap: 6,
              transition: 'all 0.2s',
              fontWeight: 500,
            }}
            onMouseEnter={(e) => (e.currentTarget.style.background = isDark ? 'rgba(99, 102, 241, 0.2)' : 'rgba(99, 102, 241, 0.1)')}
            onMouseLeave={(e) => (e.currentTarget.style.background = glassBg)}
          >
            <FileCode size={14} /> 示例
          </button>
          <button
            onClick={clearCode}
            style={{
              padding: '8px 14px',
              borderRadius: 10,
              border: `1px solid ${glassBorder}`,
              background: glassBg,
              backdropFilter: 'blur(10px)',
              color: textSecondary,
              cursor: 'pointer',
              fontSize: 13,
              display: 'flex',
              alignItems: 'center',
              gap: 6,
            }}
            onMouseEnter={(e) => (e.currentTarget.style.background = isDark ? 'rgba(239, 68, 68, 0.15)' : 'rgba(239, 68, 68, 0.1)')}
            onMouseLeave={(e) => (e.currentTarget.style.background = glassBg)}
          >
            <Trash2 size={14} /> 清空
          </button>
          <button
            onClick={runAnalysis}
            disabled={isAnalyzing || !code.trim()}
            style={{
              padding: '10px 20px',
              borderRadius: 12,
              border: 'none',
              background: isAnalyzing
                ? 'linear-gradient(135deg, #64748b, #475569)'
                : 'linear-gradient(135deg, #6366f1, #8b5cf6)',
              color: 'white',
              cursor: isAnalyzing ? 'not-allowed' : 'pointer',
              fontSize: 14,
              fontWeight: 600,
              display: 'flex',
              alignItems: 'center',
              gap: 8,
              boxShadow: isAnalyzing ? 'none' : '0 4px 14px rgba(99, 102, 241, 0.4)',
              transition: 'all 0.2s',
            }}
          >
            {isAnalyzing ? (
              <><Loader2 size={16} style={{ animation: 'spin 1s linear infinite' }} />AI 分析中...</>
            ) : (
              <><Search size={16} />AI 分析</>
            )}
          </button>
        </div>
      </div>

      {/* Main */}
      <div style={{ display: 'flex', flex: 1, overflow: 'hidden' }}>
        {/* Left: code editor */}
        <div style={{
          flex: 1,
          display: 'flex',
          flexDirection: 'column',
          borderRight: `1px solid ${glassBorder}`,
          overflow: 'hidden',
          minWidth: 0,
        }}>
          <div style={{
            padding: '12px 16px',
            background: glassBg,
            backdropFilter: 'blur(10px)',
            borderBottom: `1px solid ${glassBorder}`,
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            flexShrink: 0,
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <Code size={16} style={{ color: accentColor }} />
              <span style={{ fontWeight: 600, fontSize: 13 }}>源代码</span>
              <span style={{
                padding: '2px 8px',
                borderRadius: 6,
                background: isDark ? 'rgba(139, 92, 246, 0.15)' : 'rgba(139, 92, 246, 0.1)',
                color: accentColor,
                fontSize: 11,
                fontWeight: 600,
              }}>
                {LANGUAGE_META[language].label}
              </span>
            </div>
            <div style={{ display: 'flex', gap: 12, fontSize: 12, color: textSecondary }}>
              <span>{code.split('\n').length} 行</span>
              <span>{code.length} 字符</span>
            </div>
          </div>
          <textarea
            value={code}
            onChange={(e) => setCode(e.target.value)}
            placeholder={`在此粘贴 ${LANGUAGE_META[language].label} 代码进行 AI 智能分析...`}
            spellCheck={false}
            style={{
              flex: 1,
              padding: 16,
              border: 'none',
              outline: 'none',
              resize: 'none',
              fontFamily: '"JetBrains Mono", "Fira Code", "SF Mono", Consolas, monospace',
              fontSize: 13,
              lineHeight: 1.7,
              background: isDark ? 'rgba(15, 23, 42, 0.4)' : 'rgba(255, 255, 255, 0.5)',
              color: textPrimary,
              whiteSpace: 'pre',
              backdropFilter: 'blur(10px)',
            }}
          />
          <div style={{
            padding: '10px 16px',
            background: glassBg,
            backdropFilter: 'blur(10px)',
            borderTop: `1px solid ${glassBorder}`,
            display: 'flex',
            gap: 16,
            fontSize: 12,
            color: textSecondary,
            flexShrink: 0,
          }}>
            <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
              <Shield size={12} /> AI 驱动
            </span>
            <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
              <Zap size={12} /> 多维度分析
            </span>
            {result && totalIssues > 0 && (
              <span style={{
                display: 'flex',
                alignItems: 'center',
                gap: 4,
                marginLeft: 'auto',
                color: getScoreGrade(result.scores.overall).color,
                fontWeight: 600,
              }}>
                <AlertTriangle size={12} /> 发现 {totalIssues} 个问题
                {criticalCount > 0 && (
                  <span style={{ color: '#ef4444', marginLeft: 8 }}>
                    · {criticalCount} 严重
                  </span>
                )}
                {highCount > 0 && (
                  <span style={{ color: '#f97316', marginLeft: 4 }}>
                    · {highCount} 高
                  </span>
                )}
              </span>
            )}
          </div>
        </div>

        {/* Right: results */}
        <div style={{
          width: 560,
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden',
          background: isDark ? 'rgba(15, 23, 42, 0.3)' : 'rgba(255, 255, 255, 0.3)',
          backdropFilter: 'blur(10px)',
        }}>
          {isAnalyzing && !result ? (
            <div style={{
              flex: 1,
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 16,
              padding: 40,
            }}>
              <div style={{
                width: 80,
                height: 80,
                borderRadius: 20,
                background: glassBg,
                backdropFilter: 'blur(20px)',
                border: `1px solid ${glassBorder}`,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                boxShadow: '0 8px 32px rgba(139, 92, 246, 0.2)',
              }}>
                <Loader2 size={36} style={{ color: accentColor, animation: 'spin 1s linear infinite' }} />
              </div>
              <div style={{ fontSize: 16, fontWeight: 600, color: textPrimary }}>
                AI 正在深度分析代码...
              </div>
              <div style={{ fontSize: 13, color: textSecondary, textAlign: 'center', maxWidth: 300 }}>
                Pollinations AI 正在从可读性、性能、安全性等多个维度评估代码
              </div>
              <div style={{ display: 'flex', gap: 6, marginTop: 8 }}>
                {[0, 1, 2, 3, 4].map(i => (
                  <span key={i} style={{
                    width: 8,
                    height: 8,
                    borderRadius: 99,
                    background: accentColor,
                    animation: `bounce 1.4s ${i * 0.12}s infinite`,
                  }} />
                ))}
              </div>
            </div>
          ) : result ? (
            <>
              {/* Score Card */}
              <div style={{
                padding: '16px 20px',
                background: glassBg,
                backdropFilter: 'blur(20px)',
                borderBottom: `1px solid ${glassBorder}`,
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                flexShrink: 0,
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
                  <div style={{
                    width: 72,
                    height: 72,
                    borderRadius: 18,
                    background: isDark ? 'rgba(15, 23, 42, 0.5)' : 'rgba(255, 255, 255, 0.7)',
                    border: `1px solid ${glassBorder}`,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    position: 'relative',
                    overflow: 'hidden',
                  }}>
                    <div style={{
                      position: 'absolute',
                      inset: 0,
                      background: `conic-gradient(${getScoreGrade(result.scores.overall).color} ${result.scores.overall * 3.6}deg, transparent ${result.scores.overall * 3.6}deg)`,
                      opacity: 0.2,
                    }} />
                    <div style={{ textAlign: 'center', zIndex: 1 }}>
                      <div style={{ fontSize: 26, fontWeight: 800, color: getScoreGrade(result.scores.overall).color }}>
                        {result.scores.overall}
                      </div>
                      <div style={{ fontSize: 9, color: textSecondary }}>SCORE</div>
                    </div>
                  </div>
                  <div>
                    <div style={{ fontWeight: 700, fontSize: 16, marginBottom: 4 }}>
                      代码质量: <span style={{ color: getScoreGrade(result.scores.overall).color }}>
                        {getScoreGrade(result.scores.overall).label}
                      </span>
                    </div>
                    <div style={{ fontSize: 13, color: textSecondary, maxWidth: 300, lineHeight: 1.5 }}>
                      {result.summary}
                    </div>
                  </div>
                </div>
                <div style={{ display: 'flex', gap: 8 }}>
                  {result.refactoredCode && (
                    <button
                      onClick={applyRefactoredCode}
                      style={{
                        padding: '10px 16px',
                        borderRadius: 12,
                        border: 'none',
                        background: 'linear-gradient(135deg, #22c55e, #16a34a)',
                        color: 'white',
                        cursor: 'pointer',
                        fontSize: 13,
                        fontWeight: 600,
                        display: 'flex',
                        alignItems: 'center',
                        gap: 6,
                        boxShadow: '0 4px 14px rgba(34, 197, 94, 0.4)',
                      }}
                    >
                      <Play size={14} /> 应用重构
                    </button>
                  )}
                  <button
                    onClick={exportReport}
                    style={{
                      padding: '10px 16px',
                      borderRadius: 12,
                      border: `1px solid ${glassBorder}`,
                      background: glassBg,
                      backdropFilter: 'blur(10px)',
                      color: textPrimary,
                      cursor: 'pointer',
                      fontSize: 13,
                      fontWeight: 600,
                      display: 'flex',
                      alignItems: 'center',
                      gap: 6,
                    }}
                  >
                    <Download size={14} /> 导出
                  </button>
                </div>
              </div>

              {/* Tabs */}
              <div style={{
                display: 'flex',
                padding: '8px 12px',
                background: glassBg,
                backdropFilter: 'blur(10px)',
                borderBottom: `1px solid ${glassBorder}`,
                flexShrink: 0,
                overflowX: 'auto',
              }}>
                {tabs.map(tab => (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    style={{
                      padding: '10px 14px',
                      border: 'none',
                      borderRadius: 10,
                      background: activeTab === tab.id
                        ? (isDark ? 'rgba(139, 92, 246, 0.25)' : 'rgba(139, 92, 246, 0.12)')
                        : 'transparent',
                      color: activeTab === tab.id ? accentColor : textSecondary,
                      cursor: 'pointer',
                      fontSize: 13,
                      fontWeight: activeTab === tab.id ? 600 : 500,
                      display: 'flex',
                      alignItems: 'center',
                      gap: 6,
                      transition: 'all 0.2s',
                      whiteSpace: 'nowrap',
                    }}
                  >
                    {tab.icon} {tab.label}
                    {tab.count !== undefined && tab.count > 0 && (
                      <span style={{
                        padding: '1px 6px',
                        borderRadius: 8,
                        background: activeTab === tab.id ? accentColor : (isDark ? '#334155' : '#e2e8f0'),
                        color: activeTab === tab.id ? 'white' : textSecondary,
                        fontSize: 11,
                        fontWeight: 700,
                        minWidth: 18,
                        textAlign: 'center',
                      }}>
                        {tab.count}
                      </span>
                    )}
                  </button>
                ))}
              </div>

              {/* Tab content */}
              <div style={{ flex: 1, overflow: 'auto', padding: 16 }}>
                {activeTab === 'overview' && (
                  <OverviewPanel
                    result={result}
                    isDark={isDark}
                    textPrimary={textPrimary}
                    textSecondary={textSecondary}
                    accentColor={accentColor}
                    glassBorder={glassBorder}
                    glassBg={glassBg}
                  />
                )}

                {activeTab === 'issues' && (
                  <IssuesPanel
                    issues={result.issues}
                    isDark={isDark}
                    textPrimary={textPrimary}
                    textSecondary={textSecondary}
                    glassBorder={glassBorder}
                    onCopy={copyToClipboard}
                    copied={copied}
                  />
                )}

                {activeTab === 'refactor' && (
                  <RefactorPanel
                    originalCode={code}
                    refactoredCode={result.refactoredCode}
                    isDark={isDark}
                    textPrimary={textPrimary}
                    textSecondary={textSecondary}
                    glassBorder={glassBorder}
                    comparisonMode={comparisonMode}
                    setComparisonMode={setComparisonMode}
                    onCopy={copyToClipboard}
                    copied={copied}
                    applyRefactoredCode={applyRefactoredCode}
                  />
                )}

                {activeTab === 'performance' && (
                  <PerformancePanel
                    tips={result.performanceTips}
                    isDark={isDark}
                    textPrimary={textPrimary}
                    textSecondary={textSecondary}
                    glassBorder={glassBorder}
                    onCopy={copyToClipboard}
                    copied={copied}
                  />
                )}

                {activeTab === 'report' && (
                  <ReportPanel
                    result={result}
                    language={language}
                    code={code}
                    isDark={isDark}
                    textPrimary={textPrimary}
                    textSecondary={textSecondary}
                    glassBorder={glassBorder}
                    onExport={exportReport}
                    onCopy={copyToClipboard}
                    copied={copied}
                  />
                )}
              </div>
            </>
          ) : (
            <div style={{
              flex: 1,
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              color: textSecondary,
              padding: 40,
              textAlign: 'center',
            }}>
              <div style={{
                width: 100,
                height: 100,
                borderRadius: 24,
                background: glassBg,
                backdropFilter: 'blur(20px)',
                border: `1px solid ${glassBorder}`,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                marginBottom: 24,
                boxShadow: '0 8px 32px rgba(139, 92, 246, 0.15)',
              }}>
                <Wand2 size={42} style={{ color: accentColor, opacity: 0.6 }} />
              </div>
              <div style={{ fontSize: 18, fontWeight: 600, marginBottom: 8, color: textPrimary }}>
                输入代码开始 AI 分析
              </div>
              <div style={{ fontSize: 14, maxWidth: 320, lineHeight: 1.6 }}>
                支持 JavaScript、TypeScript 和 Python，从代码质量、性能、安全等维度提供智能重构建议
              </div>
              <div style={{ display: 'flex', gap: 16, marginTop: 24, fontSize: 12, flexWrap: 'wrap', justifyContent: 'center' }}>
                <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                  <Gauge size={12} style={{ color: '#22c55e' }} /> 质量评分
                </span>
                <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                  <GitMerge size={12} style={{ color: '#8b5cf6' }} /> 重构对比
                </span>
                <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                  <Zap size={12} style={{ color: '#f59e0b' }} /> 性能优化
                </span>
                <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                  <Download size={12} style={{ color: '#3b82f6' }} /> 导出报告
                </span>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Toast */}
      {toast && (
        <div style={{
          position: 'absolute',
          left: '50%',
          bottom: 20,
          transform: 'translateX(-50%)',
          padding: '10px 16px',
          background: 'rgba(16, 185, 129, 0.95)',
          color: '#fff',
          borderRadius: 10,
          fontSize: 12,
          fontWeight: 600,
          boxShadow: '0 8px 24px rgba(16,185,129,0.35)',
          display: 'flex',
          alignItems: 'center',
          gap: 6,
          zIndex: 999,
          animation: 'toastIn 0.25s ease-out',
        }}>
          <Check size={14} />
          {toast}
        </div>
      )}

      <style>{`
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
        @keyframes bounce {
          0%, 80%, 100% { transform: scale(0.6); opacity: 0.4; }
          40% { transform: scale(1); opacity: 1; }
        }
        @keyframes toastIn {
          from { opacity: 0; transform: translate(-50%, 10px); }
          to { opacity: 1; transform: translate(-50%, 0); }
        }
        ::-webkit-scrollbar { width: 8px; height: 8px; }
        ::-webkit-scrollbar-track { background: transparent; }
        ::-webkit-scrollbar-thumb {
          background: ${isDark ? 'rgba(148, 163, 184, 0.2)' : 'rgba(100, 116, 139, 0.2)'};
          border-radius: 4px;
        }
        ::-webkit-scrollbar-thumb:hover {
          background: ${isDark ? 'rgba(148, 163, 184, 0.3)' : 'rgba(100, 116, 139, 0.3)'};
        }
      `}</style>
    </div>
  )
}

/* ─────────── Overview Panel ─────────── */
function OverviewPanel({
  result,
  isDark,
  textPrimary,
  textSecondary,
  accentColor,
  glassBorder,
  glassBg,
}: {
  result: AnalysisResult
  isDark: boolean
  textPrimary: string
  textSecondary: string
  accentColor: string
  glassBorder: string
  glassBg: string
}) {
  const scoreItems = [
    { label: '可读性', value: result.scores.readability, icon: '📖' },
    { label: '可维护性', value: result.scores.maintainability, icon: '🔧' },
    { label: '性能', value: result.scores.performance, icon: '⚡' },
    { label: '安全性', value: result.scores.security, icon: '🔒' },
    { label: '代码风格', value: result.scores.style, icon: '🎨' },
  ]

  const getScoreColor = (score: number) => {
    if (score >= 85) return '#22c55e'
    if (score >= 70) return '#84cc16'
    if (score >= 50) return '#f59e0b'
    if (score >= 30) return '#f97316'
    return '#ef4444'
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      {/* Score radar */}
      <div style={{
        padding: 16,
        borderRadius: 14,
        background: glassBg,
        backdropFilter: 'blur(10px)',
        border: `1px solid ${glassBorder}`,
      }}>
        <div style={{ fontSize: 13, fontWeight: 700, marginBottom: 12, display: 'flex', alignItems: 'center', gap: 6 }}>
          <BarChart3 size={14} style={{ color: accentColor }} /> 多维度评分
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
          {scoreItems.map(item => (
            <div key={item.label} style={{
              display: 'flex',
              flexDirection: 'column',
              gap: 4,
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: 12, color: textSecondary }}>
                  {item.icon} {item.label}
                </span>
                <span style={{ fontSize: 14, fontWeight: 700, color: getScoreColor(item.value) }}>
                  {item.value}
                </span>
              </div>
              <div style={{
                height: 6,
                background: isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.05)',
                borderRadius: 3,
                overflow: 'hidden',
              }}>
                <div style={{
                  height: '100%',
                  width: `${item.value}%`,
                  background: getScoreColor(item.value),
                  borderRadius: 3,
                  transition: 'width 0.6s ease',
                }} />
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Summary stats */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12 }}>
        <StatCard
          icon={<AlertTriangle size={18} />}
          label="问题总数"
          value={result.issues.length}
          color="#f97316"
          isDark={isDark}
          glassBg={glassBg}
          glassBorder={glassBorder}
        />
        <StatCard
          icon={<Zap size={18} />}
          label="性能建议"
          value={result.performanceTips.length}
          color="#8b5cf6"
          isDark={isDark}
          glassBg={glassBg}
          glassBorder={glassBorder}
        />
        <StatCard
          icon={<ThumbsUp size={18} />}
          label="代码质量"
          value={getScoreGrade(result.scores.overall).label}
          color={getScoreGrade(result.scores.overall).color}
          isDark={isDark}
          glassBg={glassBg}
          glassBorder={glassBorder}
          isText
        />
      </div>

      {/* Summary text */}
      <div style={{
        padding: 16,
        borderRadius: 14,
        background: glassBg,
        backdropFilter: 'blur(10px)',
        border: `1px solid ${glassBorder}`,
      }}>
        <div style={{ fontSize: 13, fontWeight: 700, marginBottom: 8, display: 'flex', alignItems: 'center', gap: 6 }}>
          <Lightbulb size={14} style={{ color: '#f59e0b' }} /> AI 分析摘要
        </div>
        <div style={{ fontSize: 13, lineHeight: 1.7, color: textPrimary }}>
          {result.summary}
        </div>
      </div>

      {/* Quick actions */}
      <div style={{
        padding: 16,
        borderRadius: 14,
        background: glassBg,
        backdropFilter: 'blur(10px)',
        border: `1px solid ${glassBorder}`,
      }}>
        <div style={{ fontSize: 13, fontWeight: 700, marginBottom: 12, display: 'flex', alignItems: 'center', gap: 6 }}>
          <Rocket size={14} style={{ color: '#22c55e' }} /> 快捷操作
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          <ActionChip label="查看所有问题" icon={<AlertTriangle size={12} />} />
          <ActionChip label="查看重构对比" icon={<GitMerge size={12} />} />
          <ActionChip label="性能优化建议" icon={<Zap size={12} />} />
        </div>
      </div>
    </div>
  )
}

function StatCard({
  icon,
  label,
  value,
  color,
  isDark,
  glassBg,
  glassBorder,
  isText,
}: {
  icon: React.ReactNode
  label: string
  value: number | string
  color: string
  isDark: boolean
  glassBg: string
  glassBorder: string
  isText?: boolean
}) {
  return (
    <div style={{
      padding: 14,
      borderRadius: 12,
      background: glassBg,
      backdropFilter: 'blur(10px)',
      border: `1px solid ${glassBorder}`,
      textAlign: 'center',
    }}>
      <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 6 }}>
        <div style={{
          width: 36,
          height: 36,
          borderRadius: 10,
          background: `${color}22`,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          color,
        }}>
          {icon}
        </div>
      </div>
      <div style={{
        fontSize: 22,
        fontWeight: 800,
        color,
        marginBottom: 2,
      }}>
        {isText ? value : value}
      </div>
      <div style={{ fontSize: 11, color: isDark ? '#94a3b8' : '#64748b' }}>{label}</div>
    </div>
  )
}

function ActionChip({ label, icon }: { label: string; icon: React.ReactNode }) {
  return (
    <button style={{
      flex: 1,
      padding: '10px 12px',
      borderRadius: 10,
      border: '1px solid rgba(139, 92, 246, 0.2)',
      background: 'rgba(139, 92, 246, 0.08)',
      color: '#c4b5fd',
      fontSize: 12,
      fontWeight: 500,
      cursor: 'pointer',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      gap: 6,
      transition: 'all 0.2s',
    }}
    onMouseEnter={(e) => { e.currentTarget.style.background = 'rgba(139, 92, 246, 0.15)' }}
    onMouseLeave={(e) => { e.currentTarget.style.background = 'rgba(139, 92, 246, 0.08)' }}
    >
      {icon} {label}
    </button>
  )
}

function getScoreGrade(score: number) {
  if (score >= 85) return { label: '优秀', color: '#22c55e' }
  if (score >= 70) return { label: '良好', color: '#84cc16' }
  if (score >= 50) return { label: '一般', color: '#f59e0b' }
  if (score >= 30) return { label: '较差', color: '#f97316' }
  return { label: '需重构', color: '#ef4444' }
}

/* ─────────── Issues Panel ─────────── */
function IssuesPanel({
  issues,
  isDark,
  textPrimary,
  textSecondary,
  glassBorder,
  onCopy,
  copied,
}: {
  issues: RefactorIssue[]
  isDark: boolean
  textPrimary: string
  textSecondary: string
  glassBorder: string
  onCopy: (text: string) => void
  copied: boolean
}) {
  const [expandedId, setExpandedId] = useState<string | null>(null)

  if (issues.length === 0) {
    return (
      <div style={{
        textAlign: 'center',
        padding: 40,
        color: textSecondary,
      }}>
        <div style={{ fontSize: 48, marginBottom: 12 }}>✅</div>
        <div style={{ fontWeight: 600, fontSize: 16, color: textPrimary, marginBottom: 4 }}>
          代码质量优秀
        </div>
        <div style={{ fontSize: 13 }}>AI 未发现需要改进的问题</div>
      </div>
    )
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
      {issues.map(issue => {
        const sev = SEVERITY_CONFIG[issue.severity]
        const cat = CATEGORY_CONFIG[issue.category]
        const isExpanded = expandedId === issue.id

        return (
          <div key={issue.id} style={{
            borderRadius: 12,
            border: `1px solid ${glassBorder}`,
            overflow: 'hidden',
            transition: 'all 0.2s',
          }}>
            <button
              onClick={() => setExpandedId(isExpanded ? null : issue.id)}
              style={{
                width: '100%',
                padding: '14px 16px',
                background: isDark ? 'rgba(30, 41, 59, 0.5)' : 'rgba(255,255,255,0.5)',
                border: 'none',
                color: textPrimary,
                cursor: 'pointer',
                textAlign: 'left',
                display: 'flex',
                alignItems: 'center',
                gap: 10,
              }}
            >
              <div style={{
                width: 28,
                height: 28,
                borderRadius: 8,
                background: cat.color + '22',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0,
              }}>
                <span style={{ fontSize: 14 }}>{cat.icon}</span>
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 2 }}>
                  {issue.title}
                </div>
                <div style={{ fontSize: 11, color: textSecondary, display: 'flex', gap: 8 }}>
                  <span>{cat.label}</span>
                  {issue.line && <span>第 {issue.line} 行</span>}
                </div>
              </div>
              <span style={{
                padding: '4px 10px',
                borderRadius: 6,
                fontSize: 11,
                fontWeight: 700,
                background: sev.bg,
                color: sev.color,
              }}>
                {sev.label}
              </span>
              <ChevronRight size={16} style={{
                transform: isExpanded ? 'rotate(90deg)' : 'rotate(0deg)',
                transition: 'transform 0.2s',
                color: textSecondary,
              }} />
            </button>

            {isExpanded && (
              <div style={{
                padding: '0 16px 16px',
                background: isDark ? 'rgba(15, 23, 42, 0.3)' : 'rgba(255,255,255,0.3)',
              }}>
                <div style={{
                  padding: '10px 14px',
                  borderRadius: 8,
                  background: isDark ? 'rgba(139, 92, 246, 0.08)' : 'rgba(139, 92, 246, 0.06)',
                  border: '1px solid rgba(139, 92, 246, 0.15)',
                  marginBottom: 12,
                  fontSize: 12,
                  lineHeight: 1.6,
                  color: textPrimary,
                }}>
                  {issue.description}
                </div>

                <div style={{
                  padding: '10px 14px',
                  borderRadius: 8,
                  background: isDark ? 'rgba(59, 130, 246, 0.08)' : 'rgba(59, 130, 246, 0.06)',
                  border: '1px solid rgba(59, 130, 246, 0.15)',
                  marginBottom: 12,
                  fontSize: 12,
                  lineHeight: 1.6,
                  color: textPrimary,
                }}>
                  💡 <strong>建议:</strong> {issue.suggestion}
                </div>

                {issue.before && (
                  <div style={{ marginBottom: 10 }}>
                    <div style={{ fontSize: 11, fontWeight: 600, marginBottom: 6, color: textSecondary, display: 'flex', alignItems: 'center', gap: 4 }}>
                      <span style={{ color: '#ef4444' }}>●</span> 优化前
                    </div>
                    <pre style={{
                      margin: 0,
                      padding: 12,
                      borderRadius: 8,
                      background: isDark ? 'rgba(239, 68, 68, 0.08)' : 'rgba(239, 68, 68, 0.06)',
                      border: '1px solid rgba(239, 68, 68, 0.2)',
                      fontSize: 12,
                      lineHeight: 1.6,
                      color: textPrimary,
                      overflow: 'auto',
                      fontFamily: '"JetBrains Mono", "Fira Code", monospace',
                    }}>{issue.before}</pre>
                  </div>
                )}

                {issue.after && (
                  <div style={{ marginBottom: 10 }}>
                    <div style={{ fontSize: 11, fontWeight: 600, marginBottom: 6, color: textSecondary, display: 'flex', alignItems: 'center', gap: 4 }}>
                      <span style={{ color: '#22c55e' }}>●</span> 优化后
                    </div>
                    <pre style={{
                      margin: 0,
                      padding: 12,
                      borderRadius: 8,
                      background: isDark ? 'rgba(34, 197, 94, 0.08)' : 'rgba(34, 197, 94, 0.06)',
                      border: '1px solid rgba(34, 197, 94, 0.2)',
                      fontSize: 12,
                      lineHeight: 1.6,
                      color: textPrimary,
                      overflow: 'auto',
                      fontFamily: '"JetBrains Mono", "Fira Code", monospace',
                    }}>{issue.after}</pre>
                  </div>
                )}

                <div style={{ display: 'flex', gap: 8, marginTop: 8 }}>
                  <button
                    onClick={() => onCopy(issue.after || issue.suggestion)}
                    style={{
                      padding: '6px 12px',
                      borderRadius: 8,
                      border: `1px solid ${glassBorder}`,
                      background: isDark ? 'rgba(139, 92, 246, 0.1)' : 'rgba(139, 92, 246, 0.08)',
                      color: '#c4b5fd',
                      fontSize: 11,
                      fontWeight: 600,
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      gap: 4,
                    }}
                  >
                    {copied ? <Check size={12} /> : <Copy size={12} />}
                    {copied ? '已复制' : '复制代码'}
                  </button>
                </div>
              </div>
            )}
          </div>
        )
      })}
    </div>
  )
}

/* ─────────── Refactor Panel ─────────── */
function RefactorPanel({
  originalCode,
  refactoredCode,
  isDark,
  textPrimary,
  textSecondary,
  glassBorder,
  comparisonMode,
  setComparisonMode,
  onCopy,
  copied,
  applyRefactoredCode,
}: {
  originalCode: string
  refactoredCode: string
  isDark: boolean
  textPrimary: string
  textSecondary: string
  glassBorder: string
  comparisonMode: 'before' | 'after' | 'split'
  setComparisonMode: (mode: 'before' | 'after' | 'split') => void
  onCopy: (text: string) => void
  copied: boolean
  applyRefactoredCode: () => void
}) {
  if (!refactoredCode) {
    return (
      <div style={{
        textAlign: 'center',
        padding: 40,
        color: textSecondary,
      }}>
        <div style={{ fontSize: 48, marginBottom: 12 }}>🎯</div>
        <div style={{ fontWeight: 600, fontSize: 16, color: textPrimary, marginBottom: 4 }}>
          暂无重构代码
        </div>
        <div style={{ fontSize: 13 }}>AI 没有提供重构后的代码</div>
      </div>
    )
  }

  const modeButtons: { key: 'before' | 'after' | 'split'; label: string; icon: React.ReactNode }[] = [
    { key: 'before', label: '原代码', icon: <Eye size={12} /> },
    { key: 'after', label: '重构后', icon: <GitMerge size={12} /> },
    { key: 'split', label: '并排对比', icon: <Code size={12} /> },
  ]

  const codeBoxStyle = (): React.CSSProperties => ({
    flex: 1,
    display: 'flex',
    flexDirection: 'column',
    minWidth: 0,
    borderRadius: 12,
    overflow: 'hidden',
    border: `1px solid ${glassBorder}`,
  })

  const codeHeaderStyle = (color: string): React.CSSProperties => ({
    padding: '10px 14px',
    background: isDark ? `${color}15` : `${color}10`,
    borderBottom: `1px solid ${glassBorder}`,
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
  })

  const codePreStyle: React.CSSProperties = {
    margin: 0,
    padding: 14,
    fontSize: 12,
    lineHeight: 1.7,
    color: textPrimary,
    whiteSpace: 'pre',
    overflow: 'auto',
    flex: 1,
    fontFamily: '"JetBrains Mono", "Fira Code", monospace',
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', gap: 12 }}>
      <div style={{ display: 'flex', gap: 8 }}>
        {modeButtons.map(m => (
          <button
            key={m.key}
            onClick={() => setComparisonMode(m.key)}
            style={{
              padding: '8px 14px',
              borderRadius: 10,
              border: 'none',
              background: comparisonMode === m.key
                ? 'linear-gradient(135deg, #6366f1, #8b5cf6)'
                : (isDark ? 'rgba(255,255,255,0.04)' : 'rgba(0,0,0,0.03)'),
              color: comparisonMode === m.key ? 'white' : textSecondary,
              cursor: 'pointer',
              fontSize: 12,
              fontWeight: 600,
              display: 'flex',
              alignItems: 'center',
              gap: 6,
              transition: 'all 0.2s',
            }}
          >
            {m.icon} {m.label}
          </button>
        ))}
        <div style={{ flex: 1 }} />
        <button
          onClick={applyRefactoredCode}
          style={{
            padding: '8px 14px',
            borderRadius: 10,
            border: 'none',
            background: 'linear-gradient(135deg, #22c55e, #16a34a)',
            color: 'white',
            cursor: 'pointer',
            fontSize: 12,
            fontWeight: 600,
            display: 'flex',
            alignItems: 'center',
            gap: 6,
            boxShadow: '0 4px 14px rgba(34, 197, 94, 0.3)',
          }}
        >
          <Play size={12} /> 应用到编辑器
        </button>
      </div>

      {comparisonMode === 'split' ? (
        <div style={{ display: 'flex', gap: 12, flex: 1, minHeight: 0 }}>
          <div style={codeBoxStyle()}>
            <div style={codeHeaderStyle('#ef4444')}>
              <span style={{ fontSize: 12, fontWeight: 600, color: '#ef4444' }}>
                原代码
              </span>
              <button
                onClick={() => onCopy(originalCode)}
                style={{
                  padding: '4px 8px',
                  borderRadius: 6,
                  border: 'none',
                  background: 'rgba(255,255,255,0.06)',
                  color: textSecondary,
                  cursor: 'pointer',
                  fontSize: 11,
                  display: 'flex',
                  alignItems: 'center',
                  gap: 4,
                }}
              >
                {copied ? <Check size={10} /> : <Copy size={10} />} 复制
              </button>
            </div>
            <pre style={{
              ...codePreStyle,
              background: isDark ? 'rgba(15, 23, 42, 0.4)' : 'rgba(255,255,255,0.5)',
            }}>{originalCode}</pre>
          </div>

          <div style={codeBoxStyle()}>
            <div style={codeHeaderStyle('#22c55e')}>
              <span style={{ fontSize: 12, fontWeight: 600, color: '#22c55e' }}>
                重构后
              </span>
              <button
                onClick={() => onCopy(refactoredCode)}
                style={{
                  padding: '4px 8px',
                  borderRadius: 6,
                  border: 'none',
                  background: 'rgba(255,255,255,0.06)',
                  color: textSecondary,
                  cursor: 'pointer',
                  fontSize: 11,
                  display: 'flex',
                  alignItems: 'center',
                  gap: 4,
                }}
              >
                {copied ? <Check size={10} /> : <Copy size={10} />} 复制
              </button>
            </div>
            <pre style={{
              ...codePreStyle,
              background: isDark ? 'rgba(15, 23, 42, 0.4)' : 'rgba(255,255,255,0.5)',
            }}>{refactoredCode}</pre>
          </div>
        </div>
      ) : comparisonMode === 'before' ? (
        <div style={codeBoxStyle()}>
          <div style={codeHeaderStyle('#ef4444')}>
            <span style={{ fontSize: 12, fontWeight: 600, color: '#ef4444' }}>原代码</span>
          </div>
          <pre style={{
            ...codePreStyle,
            background: isDark ? 'rgba(15, 23, 42, 0.4)' : 'rgba(255,255,255,0.5)',
          }}>{originalCode}</pre>
        </div>
      ) : (
        <div style={codeBoxStyle()}>
          <div style={codeHeaderStyle('#22c55e')}>
            <span style={{ fontSize: 12, fontWeight: 600, color: '#22c55e' }}>重构后代码</span>
          </div>
          <pre style={{
            ...codePreStyle,
            background: isDark ? 'rgba(15, 23, 42, 0.4)' : 'rgba(255,255,255,0.5)',
          }}>{refactoredCode}</pre>
        </div>
      )}
    </div>
  )
}

/* ─────────── Performance Panel ─────────── */
function PerformancePanel({
  tips,
  isDark,
  textPrimary,
  textSecondary,
  glassBorder,
  onCopy,
  copied,
}: {
  tips: PerformanceTip[]
  isDark: boolean
  textPrimary: string
  textSecondary: string
  glassBorder: string
  onCopy: (text: string) => void
  copied: boolean
}) {
  const [expandedId, setExpandedId] = useState<string | null>(null)

  if (tips.length === 0) {
    return (
      <div style={{
        textAlign: 'center',
        padding: 40,
        color: textSecondary,
      }}>
        <div style={{ fontSize: 48, marginBottom: 12 }}>⚡</div>
        <div style={{ fontWeight: 600, fontSize: 16, color: textPrimary, marginBottom: 4 }}>
          性能表现良好
        </div>
        <div style={{ fontSize: 13 }}>AI 未发现明显的性能优化机会</div>
      </div>
    )
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
      {tips.map(tip => {
        const impact = PERFORMANCE_IMPACT[tip.impact]
        const isExpanded = expandedId === tip.id

        return (
          <div key={tip.id} style={{
            borderRadius: 12,
            border: `1px solid ${glassBorder}`,
            overflow: 'hidden',
            transition: 'all 0.2s',
          }}>
            <button
              onClick={() => setExpandedId(isExpanded ? null : tip.id)}
              style={{
                width: '100%',
                padding: '14px 16px',
                background: isDark ? 'rgba(30, 41, 59, 0.5)' : 'rgba(255,255,255,0.5)',
                border: 'none',
                color: textPrimary,
                cursor: 'pointer',
                textAlign: 'left',
                display: 'flex',
                alignItems: 'center',
                gap: 10,
              }}
            >
              <div style={{
                width: 28,
                height: 28,
                borderRadius: 8,
                background: impact.color + '22',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0,
              }}>
                <Zap size={14} style={{ color: impact.color }} />
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 2 }}>
                  {tip.title}
                </div>
                <div style={{ fontSize: 11, color: textSecondary }}>
                  {tip.description}
                </div>
              </div>
              <span style={{
                padding: '4px 10px',
                borderRadius: 6,
                fontSize: 11,
                fontWeight: 700,
                background: impact.color + '22',
                color: impact.color,
              }}>
                {impact.label}
              </span>
              <ChevronRight size={16} style={{
                transform: isExpanded ? 'rotate(90deg)' : 'rotate(0deg)',
                transition: 'transform 0.2s',
                color: textSecondary,
              }} />
            </button>

            {isExpanded && (
              <div style={{
                padding: '0 16px 16px',
                background: isDark ? 'rgba(15, 23, 42, 0.3)' : 'rgba(255,255,255,0.3)',
              }}>
                {tip.before && (
                  <div style={{ marginBottom: 10 }}>
                    <div style={{ fontSize: 11, fontWeight: 600, marginBottom: 6, color: textSecondary }}>
                      <span style={{ color: '#ef4444' }}>●</span> 原实现
                    </div>
                    <pre style={{
                      margin: 0,
                      padding: 12,
                      borderRadius: 8,
                      background: isDark ? 'rgba(239, 68, 68, 0.08)' : 'rgba(239, 68, 68, 0.06)',
                      border: '1px solid rgba(239, 68, 68, 0.2)',
                      fontSize: 12,
                      lineHeight: 1.6,
                      color: textPrimary,
                      overflow: 'auto',
                      fontFamily: '"JetBrains Mono", "Fira Code", monospace',
                    }}>{tip.before}</pre>
                  </div>
                )}
                {tip.after && (
                  <div style={{ marginBottom: 10 }}>
                    <div style={{ fontSize: 11, fontWeight: 600, marginBottom: 6, color: textSecondary }}>
                      <span style={{ color: '#22c55e' }}>●</span> 优化实现
                    </div>
                    <pre style={{
                      margin: 0,
                      padding: 12,
                      borderRadius: 8,
                      background: isDark ? 'rgba(34, 197, 94, 0.08)' : 'rgba(34, 197, 94, 0.06)',
                      border: '1px solid rgba(34, 197, 94, 0.2)',
                      fontSize: 12,
                      lineHeight: 1.6,
                      color: textPrimary,
                      overflow: 'auto',
                      fontFamily: '"JetBrains Mono", "Fira Code", monospace',
                    }}>{tip.after}</pre>
                  </div>
                )}
                <div style={{ display: 'flex', gap: 8, marginTop: 8 }}>
                  <button
                    onClick={() => onCopy(tip.after)}
                    style={{
                      padding: '6px 12px',
                      borderRadius: 8,
                      border: `1px solid ${glassBorder}`,
                      background: isDark ? 'rgba(139, 92, 246, 0.1)' : 'rgba(139, 92, 246, 0.08)',
                      color: '#c4b5fd',
                      fontSize: 11,
                      fontWeight: 600,
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      gap: 4,
                    }}
                  >
                    {copied ? <Check size={12} /> : <Copy size={12} />}
                    {copied ? '已复制' : '复制优化代码'}
                  </button>
                </div>
              </div>
            )}
          </div>
        )
      })}
    </div>
  )
}

/* ─────────── Report Panel ─────────── */
function ReportPanel({
  result,
  language,
  code,
  isDark,
  textPrimary,
  textSecondary,
  glassBorder,
  onExport,
  onCopy,
  copied,
}: {
  result: AnalysisResult
  language: Language
  code: string
  isDark: boolean
  textPrimary: string
  textSecondary: string
  glassBorder: string
  onExport: () => void
  onCopy: (text: string) => void
  copied: boolean
}) {
  const [reportText, setReportText] = useState('')

  useEffect(() => {
    setReportText(generateMarkdownReport(result, language, code))
  }, [result, language, code])

  const scoreColor = result.scores.overall >= 85 ? '#22c55e' : result.scores.overall >= 70 ? '#84cc16' : result.scores.overall >= 50 ? '#f59e0b' : '#ef4444'

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12, height: '100%' }}>
      <div style={{
        padding: 16,
        borderRadius: 14,
        background: isDark ? 'rgba(15, 23, 42, 0.4)' : 'rgba(255,255,255,0.5)',
        border: `1px solid ${glassBorder}`,
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <FileText size={18} style={{ color: '#8b5cf6' }} />
            <span style={{ fontSize: 14, fontWeight: 700 }}>重构分析报告</span>
          </div>
          <div style={{ display: 'flex', gap: 8 }}>
            <button
              onClick={() => onCopy(reportText)}
              style={{
                padding: '8px 14px',
                borderRadius: 10,
                border: `1px solid ${glassBorder}`,
                background: isDark ? 'rgba(139, 92, 246, 0.1)' : 'rgba(139, 92, 246, 0.08)',
                color: '#c4b5fd',
                cursor: 'pointer',
                fontSize: 12,
                fontWeight: 600,
                display: 'flex',
                alignItems: 'center',
                gap: 6,
              }}
            >
              {copied ? <Check size={14} /> : <Copy size={14} />}
              {copied ? '已复制' : '复制报告'}
            </button>
            <button
              onClick={onExport}
              style={{
                padding: '8px 14px',
                borderRadius: 10,
                border: 'none',
                background: 'linear-gradient(135deg, #6366f1, #8b5cf6)',
                color: 'white',
                cursor: 'pointer',
                fontSize: 12,
                fontWeight: 600,
                display: 'flex',
                alignItems: 'center',
                gap: 6,
                boxShadow: '0 4px 14px rgba(99, 102, 241, 0.3)',
              }}
            >
              <Download size={14} /> 导出 MD
            </button>
          </div>
        </div>

        <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
          <div style={{
            padding: '6px 12px',
            borderRadius: 8,
            background: scoreColor + '15',
            color: scoreColor,
            fontSize: 12,
            fontWeight: 600,
          }}>
            综合评分: {result.scores.overall}/100
          </div>
          <div style={{
            padding: '6px 12px',
            borderRadius: 8,
            background: isDark ? 'rgba(239, 68, 68, 0.1)' : 'rgba(239, 68, 68, 0.08)',
            color: '#ef4444',
            fontSize: 12,
            fontWeight: 600,
          }}>
            问题: {result.issues.length}
          </div>
          <div style={{
            padding: '6px 12px',
            borderRadius: 8,
            background: isDark ? 'rgba(139, 92, 246, 0.1)' : 'rgba(139, 92, 246, 0.08)',
            color: '#8b5cf6',
            fontSize: 12,
            fontWeight: 600,
          }}>
            性能建议: {result.performanceTips.length}
          </div>
          <div style={{
            padding: '6px 12px',
            borderRadius: 8,
            background: isDark ? 'rgba(34, 197, 94, 0.1)' : 'rgba(34, 197, 94, 0.08)',
            color: '#22c55e',
            fontSize: 12,
            fontWeight: 600,
          }}>
            语言: {LANGUAGE_META[language].label}
          </div>
        </div>
      </div>

      <div style={{
        flex: 1,
        borderRadius: 14,
        border: `1px solid ${glassBorder}`,
        overflow: 'hidden',
        display: 'flex',
        flexDirection: 'column',
      }}>
        <div style={{
          padding: '10px 16px',
          background: isDark ? 'rgba(30, 41, 59, 0.5)' : 'rgba(255,255,255,0.5)',
          borderBottom: `1px solid ${glassBorder}`,
          fontSize: 12,
          fontWeight: 600,
          color: textSecondary,
          display: 'flex',
          alignItems: 'center',
          gap: 6,
        }}>
          <FileText size={13} /> Markdown 预览
        </div>
        <pre style={{
          margin: 0,
          padding: 16,
          fontSize: 12,
          lineHeight: 1.7,
          color: textPrimary,
          whiteSpace: 'pre-wrap',
          wordBreak: 'break-word',
          overflow: 'auto',
          flex: 1,
          fontFamily: '"JetBrains Mono", "Fira Code", monospace',
          background: isDark ? 'rgba(15, 23, 42, 0.3)' : 'rgba(255,255,255,0.3)',
        }}>{reportText}</pre>
      </div>
    </div>
  )
}