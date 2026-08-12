import { useState, useCallback, useEffect, useMemo } from 'react'
import { useStore } from '../store'
import {
  Search, Code, GitMerge, Wand2, Eye, Check, FileCode,
  RefreshCw, Sparkles, Layers, Trash2, AlertTriangle,
  Zap, Shield, PenTool, Split, Repeat,
} from 'lucide-react'
import {
  NamingPanel, FunctionPanel, DependencyPanel,
  MigrationPanel, DiffPanel,
} from './SmartRefactorPanels'

interface NamingIssue {
  id: string
  type: 'variable' | 'function' | 'class' | 'constant' | 'parameter'
  name: string
  line: number
  suggestion: string
  severity: 'high' | 'medium' | 'low'
  message: string
}

interface FunctionIssue {
  id: string
  name: string
  line: number
  lineCount: number
  complexity: number
  suggestion: string
  refactoredCode: string
}

interface DependencyIssue {
  id: string
  type: 'import' | 'export'
  module: string
  line: number
  issue: string
  suggestion: string
}

interface MigrationIssue {
  id: string
  category: 'es5-es6' | 'cjs-esm' | 'var-const' | 'arrow-function' | 'template-literal' | 'destructuring'
  title: string
  description: string
  original: string
  refactored: string
  line: number
}

interface DiffLine {
  type: 'same' | 'add' | 'remove' | 'change'
  content: string
  lineNum: number
  otherContent?: string
}

interface AnalysisResult {
  namingIssues: NamingIssue[]
  functionIssues: FunctionIssue[]
  dependencyIssues: DependencyIssue[]
  migrationIssues: MigrationIssue[]
  score: number
  summary: string
}

type TabType = 'naming' | 'function' | 'dependency' | 'migration' | 'diff'
type Language = 'javascript' | 'typescript'

const SAMPLE_CODE = `var utils = require('./utils');
var helper = require('./helper');

function doSomething(data, options) {
    var result = [];
    for (var i = 0; i < data.length; i++) {
        var item = data[i];
        if (item.active == true) {
            var processed = utils.process(item);
            result.push(processed);
        }
    }
    return result;
}

function handleData(data, config, callback) {
    var temp = [];
    var errors = [];
    for (var i = 0; i < data.length; i++) {
        try {
            var item = data[i];
            if (item.type === 'special') {
                var special = helper.transform(item);
                var validated = helper.validate(special);
                if (validated) {
                    temp.push(validated);
                }
            } else if (item.type === 'normal') {
                var normal = helper.handle(item);
                temp.push(normal);
            } else {
                var other = helper.processOther(item);
                temp.push(other);
            }
        } catch (e) {
            errors.push({ item: item, error: e.message });
        }
    }
    if (callback) {
        callback(null, temp);
    } else {
        return temp;
    }
}

function calculateTotal(items) {
    var total = 0;
    for (var i = 0; i < items.length; i++) {
        total = total + items[i].price * items[i].quantity;
    }
    return total;
}

var myApp = {
    name: "MyApp",
    version: "1.0.0",
    init: function() {
        console.log("Starting " + this.name + " v" + this.version);
        var items = [
            { name: "Item1", price: 10, quantity: 2, active: true, type: "special" },
            { name: "Item2", price: 20, quantity: 3, active: false, type: "normal" },
            { name: "Item3", price: 30, quantity: 1, active: true, type: "other" }
        ];
        var processed = doSomething(items);
        var total = calculateTotal(items);
        return { processed: processed, total: total };
    }
};

module.exports = myApp;`

const NAMING_CONVENTIONS = {
  variable: { pattern: /^[a-z][a-zA-Z0-9]*$/, name: 'camelCase', example: 'myVariable' },
  function: { pattern: /^[a-z][a-zA-Z0-9]*$/, name: 'camelCase', example: 'myFunction' },
  class: { pattern: /^[A-Z][a-zA-Z0-9]*$/, name: 'PascalCase', example: 'MyClass' },
  constant: { pattern: /^[A-Z][A-Z0-9_]*$/, name: 'UPPER_SNAKE_CASE', example: 'MAX_SIZE' },
  parameter: { pattern: /^[a-z][a-zA-Z0-9]*$/, name: 'camelCase', example: 'paramName' },
}

const PREDEFINED_CONSTANTS = ['Math','JSON','console','document','window','Array','Object','String','Number','Boolean','Date','Error','Promise','Map','Set','Symbol','undefined','null','NaN','Infinity']

function isClassLike(name: string): boolean {
  return /^[A-Z]/.test(name) && /class|manager|handler|controller|service|factory|adapter|wrapper|builder|proxy|observer|listener|provider|consumer|repository|strategy|singleton|instance|object|entity|model|view|presenter|component|plugin|module|system|engine|client|server|database|storage|collection|iterator|generator|decorator|mixin|template|bridge|facade|flyweight|interpreter|mediator|memento|prototype|state|visitor|command|chain/i.test(name)
}

function isConstantLike(name: string): boolean {
  return (name === name.toUpperCase() && name.includes('_')) || /^(MAX|MIN|DEFAULT|CONFIG|SETTINGS|OPTIONS|FLAGS|CONST|VERSION|ENV|URL|PATH|KEY|TOKEN|SECRET|PASSWORD|HOST|PORT|TIMEOUT|RETRY|LIMIT|THRESHOLD|BUFFER|CACHE|POOL|STACK|QUEUE)/.test(name)
}

function analyzeNaming(code: string, _lang: Language): NamingIssue[] {
  const issues: NamingIssue[] = []
  const lines = code.split('\n')

  lines.forEach((line, lineIdx) => {
    const lineNum = lineIdx + 1

    const varRegex = /(?:var|let|const)\s+([a-zA-Z_$][a-zA-Z0-9_$]*)\s*=/g
    let varMatch: RegExpExecArray | null
    const varRe = new RegExp(varRegex.source, 'g')
    while ((varMatch = varRe.exec(line)) !== null) {
      const name = varMatch[1]
      if (PREDEFINED_CONSTANTS.includes(name)) continue

      if (isClassLike(name)) {
        if (!NAMING_CONVENTIONS.class.pattern.test(name)) {
          issues.push({ id: `cls-${lineNum}-${name}`, type: 'class', name, line: lineNum,
            suggestion: name.charAt(0).toUpperCase() + name.slice(1), severity: 'high',
            message: `变量 "${name}" 疑似类名，应使用 PascalCase` })
        }
      } else if (isConstantLike(name)) {
        if (!NAMING_CONVENTIONS.constant.pattern.test(name)) {
          issues.push({ id: `const-${lineNum}-${name}`, type: 'constant', name, line: lineNum,
            suggestion: name.replace(/([A-Z])/g, '_$1').toUpperCase().replace(/^_/, ''), severity: 'medium',
            message: `变量 "${name}" 疑似常量，应使用 UPPER_SNAKE_CASE` })
        }
      } else if (!NAMING_CONVENTIONS.variable.pattern.test(name) && !name.startsWith('_') && !/^[A-Z]/.test(name)) {
        issues.push({ id: `var-${lineNum}-${name}`, type: 'variable', name, line: lineNum,
          suggestion: name.charAt(0).toLowerCase() + name.slice(1), severity: 'low',
          message: `变量 "${name}" 建议使用 camelCase` })
      }
    }

    const funcRegex = /function\s+([a-zA-Z_$][a-zA-Z0-9_$]*)\s*\(/g
    let funcMatch: RegExpExecArray | null
    const funcRe = new RegExp(funcRegex.source, 'g')
    while ((funcMatch = funcRe.exec(line)) !== null) {
      const name = funcMatch[1]
      if (!NAMING_CONVENTIONS.function.pattern.test(name)) {
        issues.push({ id: `func-${lineNum}-${name}`, type: 'function', name, line: lineNum,
          suggestion: name.charAt(0).toLowerCase() + name.slice(1), severity: 'medium',
          message: `函数名 "${name}" 建议使用 camelCase` })
      }
    }

    const classRegex = /class\s+([a-zA-Z_$][a-zA-Z0-9_$]*)/g
    let classMatch: RegExpExecArray | null
    const classRe = new RegExp(classRegex.source, 'g')
    while ((classMatch = classRe.exec(line)) !== null) {
      const name = classMatch[1]
      if (!NAMING_CONVENTIONS.class.pattern.test(name)) {
        issues.push({ id: `class-${lineNum}-${name}`, type: 'class', name, line: lineNum,
          suggestion: name.charAt(0).toUpperCase() + name.slice(1), severity: 'high',
          message: `类名 "${name}" 应使用 PascalCase` })
      }
    }

    const paramRegex = /function\s+[a-zA-Z_$][a-zA-Z0-9_$]*\s*\(([^)]*)\)/g
    let paramMatch: RegExpExecArray | null
    const paramRe = new RegExp(paramRegex.source, 'g')
    while ((paramMatch = paramRe.exec(line)) !== null) {
      const paramsStr = paramMatch[1]
      if (!paramsStr.trim()) continue
      const params = paramsStr.split(',').map(p => p.trim())
      params.forEach(param => {
        const paramName = param.split(':')[0].trim().replace(/[?]/g, '')
        if (paramName && !NAMING_CONVENTIONS.parameter.pattern.test(paramName) && !paramName.startsWith('_')) {
          issues.push({ id: `param-${lineNum}-${paramName}`, type: 'parameter', name: paramName, line: lineNum,
            suggestion: paramName.charAt(0).toLowerCase() + paramName.slice(1), severity: 'low',
            message: `参数 "${paramName}" 建议使用 camelCase` })
        }
      })
    }
  })

  return issues
}

function analyzeFunctions(code: string): FunctionIssue[] {
  const issues: FunctionIssue[] = []
  const lines = code.split('\n')
  const funcRegex = /function\s+([a-zA-Z_$][a-zA-Z0-9_$]*)\s*\(([^)]*)\)\s*\{/g

  lines.forEach((line, lineIdx) => {
    const match = line.match(funcRegex)
    if (!match) return

    const name = match[1]
    const lineNum = lineIdx + 1

    let braceCount = 0
    let endLine = lineIdx
    let inFunction = false

    for (let i = lineIdx; i < lines.length; i++) {
      for (const ch of lines[i]) {
        if (ch === '{') braceCount++
        if (ch === '}') braceCount--
      }
      if (braceCount === 0 && inFunction) { endLine = i; break }
      if (braceCount > 0) inFunction = true
    }

    const funcLineCount = endLine - lineIdx + 1

    if (funcLineCount > 30) {
      const funcBody = lines.slice(lineIdx, endLine + 1).join('\n')
      const ifCount = (funcBody.match(/\bif\b/g) || []).length
      const forCount = (funcBody.match(/\bfor\b/g) || []).length
      const whileCount = (funcBody.match(/\bwhile\b/g) || []).length
      const switchCount = (funcBody.match(/\bswitch\b/g) || []).length
      const complexity = ifCount + forCount * 2 + whileCount * 2 + switchCount * 3

      const paramStr = match[2]
      const hasCallback = /callback|cb|done|next/.test(paramStr)
      const hasMultipleLoops = forCount + whileCount > 1
      const hasConditionals = ifCount > 2

      const suggestions: string[] = []
      if (funcLineCount > 50) suggestions.push('函数超过50行，建议拆分为多个子函数')
      else if (funcLineCount > 30) suggestions.push('函数超过30行，考虑提取重复逻辑')
      if (hasCallback) suggestions.push('使用 Promise 或 async/await 替代回调模式')
      if (hasMultipleLoops) suggestions.push('嵌套循环，考虑使用数组方法优化')
      if (hasConditionals) suggestions.push('过多条件分支，考虑使用策略模式或提前返回')

      const refactoredParts: string[] = [
        `// 建议拆分: ${name} (${funcLineCount}行, 复杂度${complexity})`,
        `// 1. 提取数据处理逻辑为 processData()`,
        `// 2. 提取错误处理逻辑为 handleErrors()`,
        ...(hasCallback ? [`// 3. 使用 async/await 替代回调`] : []),
        '',
        `async function ${name}(${paramStr}) {`,
        `  const result = await processData(${paramStr.split(',')[0]})`,
        `  return result`,
        `}`,
      ]

      issues.push({
        id: `func-${lineNum}-${name}`, name, line: lineNum,
        lineCount: funcLineCount, complexity,
        suggestion: suggestions.join('\n'),
        refactoredCode: refactoredParts.join('\n'),
      })
    }
  })

  return issues
}

function analyzeDependencies(code: string): DependencyIssue[] {
  const issues: DependencyIssue[] = []
  const lines = code.split('\n')

  const importedModules = new Set<string>()

  lines.forEach((line, lineIdx) => {
    const lineNum = lineIdx + 1

    const requireMatch = line.match(/(?:const|let|var)\s+([a-zA-Z_$][a-zA-Z0-9_$]*)\s*=\s*require\s*\(\s*['"]([^'"]+)['"]\s*\)/)
    if (requireMatch) {
      const module = requireMatch[2]
      importedModules.add(module)
      issues.push({
        id: `cjs-import-${lineNum}`, type: 'import', module, line: lineNum,
        issue: `使用 CommonJS require 导入 "${module}"`,
        suggestion: `改为 ES Module: import ${requireMatch[1]} from '${module}'`,
      })
    }

    const importMatch = line.match(/import\s+(?:\{([^}]+)\}|([a-zA-Z_$][a-zA-Z0-9_$]*))\s+from\s+['"]([^'"]+)['"]/)
    if (importMatch) {
      const named = importMatch[1]
      const module = importMatch[3]
      importedModules.add(module)
      if (named) {
        const names = named.split(',').map(n => n.trim()).filter(Boolean)
        if (names.length > 5) {
          issues.push({
            id: `many-imports-${lineNum}`, type: 'import', module, line: lineNum,
            issue: `从 "${module}" 导入超过5个导出`,
            suggestion: `考虑合并为命名空间导入或拆分模块`,
          })
        }
      }
    }

    if (/module\.exports\s*=/.test(line)) {
      issues.push({
        id: `cjs-export-${lineNum}`, type: 'export', module: 'module.exports', line: lineNum,
        issue: '使用 CommonJS module.exports',
        suggestion: '改为 ES Module: export default 或 export',
      })
    }
  })

  if (importedModules.size > 10) {
    issues.push({
      id: 'many-deps-0', type: 'import', module: 'multiple', line: 0,
      issue: `模块依赖过多 (${importedModules.size}个)`,
      suggestion: '考虑拆分文件或合并相似依赖',
    })
  }

  return issues
}

function analyzeMigration(code: string): MigrationIssue[] {
  const issues: MigrationIssue[] = []
  const lines = code.split('\n')

  lines.forEach((line, lineIdx) => {
    const lineNum = lineIdx + 1

    if (/\bvar\s+[a-zA-Z_$][a-zA-Z0-9_$]*\s*=/.test(line)) {
      issues.push({
        id: `var-${lineNum}`, category: 'var-const',
        title: '使用 var 声明变量',
        description: 'var 存在变量提升问题，建议使用 const 或 let',
        original: line.trim(),
        refactored: line.replace('var ', 'const '),
        line: lineNum,
      })
    }

    if (/==[^=]/.test(line) && !/===/.test(line) && !/!==/.test(line)) {
      issues.push({
        id: `loose-eq-${lineNum}`, category: 'es5-es6',
        title: '使用宽松相等 ==',
        description: '== 会进行类型转换，建议使用 === 严格相等',
        original: line.trim(),
        refactored: line.replace(/==/g, '===').replace(/!==+/g, '!=='),
        line: lineNum,
      })
    }

    if (/function\s*\([^)]*\)\s*\{/.test(line) && /=/.test(line) && !/=>/.test(line)) {
      issues.push({
        id: `func-expr-${lineNum}`, category: 'arrow-function',
        title: '使用传统函数表达式',
        description: '建议使用箭头函数，解决 this 绑定问题并简化代码',
        original: line.trim(),
        refactored: line.replace(/function\s*\(([^)]*)\)\s*\{/, '($1) => {'),
        line: lineNum,
      })
    }

    if (/for\s*\(\s*(var|let|const)\s+\w+\s*=\s*0\s*;\s*\w+\s*<\s*\w+\.length\s*;\s*\w+\+\+\s*\)/.test(line)) {
      issues.push({
        id: `for-loop-${lineNum}`, category: 'es5-es6',
        title: '传统 for 循环',
        description: '建议使用 for...of 循环或数组方法 forEach/map/filter',
        original: line.trim(),
        refactored: line.replace(/for\s*\(\s*(var|let|const)\s+(\w+)\s*=\s*0\s*;\s*\2\s*<\s*(\w+)\.length\s*;\s*\2\+\+\s*\)/, 'for (const $2 of $3) {'),
        line: lineNum,
      })
    }

    const cjsImportMatch = line.match(/(?:const|let|var)\s+(\w+)\s*=\s*require\s*\(\s*['"]([^'"]+)['"]\s*\)/)
    if (cjsImportMatch) {
      issues.push({
        id: `cjs-import-${lineNum}`, category: 'cjs-esm',
        title: 'CommonJS require 导入',
        description: '建议迁移到 ES Module 的 import 语法',
        original: line.trim(),
        refactored: `import ${cjsImportMatch[1]} from '${cjsImportMatch[2]}'`,
        line: lineNum,
      })
    }

    if (/module\.exports\s*=/.test(line)) {
      issues.push({
        id: `cjs-export-${lineNum}`, category: 'cjs-esm',
        title: 'CommonJS module.exports',
        description: '建议迁移到 ES Module 的 export 语法',
        original: line.trim(),
        refactored: line.replace(/module\.exports\s*=\s*/, 'export default '),
        line: lineNum,
      })
    }

    if (/"[^"]*"\s*\+\s*\w+/.test(line) || /'[^']*'\s*\+\s*\w+/.test(line)) {
      issues.push({
        id: `template-${lineNum}`, category: 'template-literal',
        title: '使用字符串拼接',
        description: '建议使用模板字符串 (Template Literals) 提高可读性',
        original: line.trim(),
        refactored: line.replace(/"/g, '`').replace(/\+\s*"/g, '${').replace(/"\s*\+/g, '}'),
        line: lineNum,
      })
    }
  })

  return issues
}

function generateRefactoredCode(code: string, result: AnalysisResult): string {
  let refactored = code
  result.migrationIssues.forEach(issue => {
    if (issue.category === 'var-const') {
      refactored = refactored.replace(/\bvar\s+/g, 'const ')
    }
    if (issue.category === 'cjs-esm') {
      refactored = refactored.replace(
        /(?:const|let|var)\s+(\w+)\s*=\s*require\s*\(\s*['"]([^'"]+)['"]\s*\)/g,
        "import $1 from '$2'"
      )
      refactored = refactored.replace(/module\.exports\s*=\s*/g, 'export default ')
    }
  })
  return refactored
}

function computeDiff(original: string, modified: string): DiffLine[] {
  const origLines = original.split('\n')
  const modLines = modified.split('\n')
  const result: DiffLine[] = []
  const maxLines = Math.max(origLines.length, modLines.length)

  for (let i = 0; i < maxLines; i++) {
    const origLine = origLines[i]
    const modLine = modLines[i]
    if (origLine === modLine) {
      result.push({ type: 'same', lineNum: i + 1, content: origLine || '' })
    } else if (origLine === undefined) {
      result.push({ type: 'add', lineNum: i + 1, content: modLine })
    } else if (modLine === undefined) {
      result.push({ type: 'remove', lineNum: i + 1, content: origLine })
    } else {
      result.push({ type: 'change', lineNum: i + 1, content: origLine, otherContent: modLine })
    }
  }
  return result
}

function computeScore(result: AnalysisResult): number {
  let score = 100
  score -= result.namingIssues.filter(i => i.severity === 'high').length * 10
  score -= result.namingIssues.filter(i => i.severity === 'medium').length * 5
  score -= result.namingIssues.filter(i => i.severity === 'low').length * 3
  score -= result.functionIssues.length * 8
  score -= result.dependencyIssues.filter(i => i.type === 'import').length * 4
  score -= result.migrationIssues.length * 2
  return Math.max(0, Math.min(100, score))
}

function getScoreGrade(score: number): { label: string; color: string } {
  if (score >= 85) return { label: '优秀', color: '#22c55e' }
  if (score >= 70) return { label: '良好', color: '#84cc16' }
  if (score >= 55) return { label: '一般', color: '#f59e0b' }
  if (score >= 40) return { label: '较差', color: '#f97316' }
  return { label: '需重构', color: '#ef4444' }
}

export default function SmartRefactor() {
  const theme = useStore((s) => s.theme)
  const [code, setCode] = useState(SAMPLE_CODE)
  const [language, setLanguage] = useState<Language>('javascript')
  const [activeTab, setActiveTab] = useState<TabType>('naming')
  const [isAnalyzing, setIsAnalyzing] = useState(false)
  const [analysisResult, setAnalysisResult] = useState<AnalysisResult | null>(null)
  const [refactoredCode, setRefactoredCode] = useState('')
  const [copied, setCopied] = useState(false)

  const isDark = theme === 'dark'

  const runAnalysis = useCallback(() => {
    if (!code.trim()) return
    setIsAnalyzing(true)
    setTimeout(() => {
      const namingIssues = analyzeNaming(code, language)
      const functionIssues = analyzeFunctions(code)
      const dependencyIssues = analyzeDependencies(code)
      const migrationIssues = analyzeMigration(code)

      const result: AnalysisResult = {
        namingIssues, functionIssues, dependencyIssues, migrationIssues,
        score: 0, summary: '',
      }
      result.score = computeScore(result)
      const grade = getScoreGrade(result.score)
      const totalIssues = namingIssues.length + functionIssues.length + dependencyIssues.length + migrationIssues.length
      result.summary = totalIssues === 0
        ? '代码质量优秀，无需重构'
        : `发现 ${totalIssues} 个问题，代码质量${grade.label}（${result.score}分）`

      setAnalysisResult(result)
      setRefactoredCode(generateRefactoredCode(code, result))
      setIsAnalyzing(false)
    }, 300)
  }, [code, language])

  useEffect(() => {
    const timer = setTimeout(() => { runAnalysis() }, 500)
    return () => clearTimeout(timer)
  }, [code, runAnalysis])

  const diffResult = useMemo(() => {
    if (!analysisResult) return []
    return computeDiff(code, refactoredCode)
  }, [analysisResult, code, refactoredCode])

  const diffStats = useMemo(() => ({
    added: diffResult.filter(d => d.type === 'add').length,
    removed: diffResult.filter(d => d.type === 'remove').length,
    changed: diffResult.filter(d => d.type === 'change').length,
    same: diffResult.filter(d => d.type === 'same').length,
  }), [diffResult])

  const copyToClipboard = useCallback((text: string) => {
    navigator.clipboard.writeText(text)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }, [])

  const applyRefactoring = useCallback(() => { setCode(refactoredCode) }, [refactoredCode])
  const loadSampleCode = useCallback(() => { setCode(SAMPLE_CODE) }, [])
  const clearCode = useCallback(() => {
    setCode(''); setAnalysisResult(null); setRefactoredCode('')
  }, [])

  const score = analysisResult?.score ?? 0
  const grade = getScoreGrade(score)

  const glassBg = isDark ? 'rgba(15, 23, 42, 0.6)' : 'rgba(255, 255, 255, 0.65)'
  const glassBorder = isDark ? 'rgba(148, 163, 184, 0.15)' : 'rgba(15, 23, 42, 0.1)'
  const textPrimary = isDark ? '#f1f5f9' : '#0f172a'
  const textSecondary = isDark ? '#94a3b8' : '#64748b'
  const accentColor = '#6366f1'

  const totalIssues = analysisResult
    ? analysisResult.namingIssues.length + analysisResult.functionIssues.length +
      analysisResult.dependencyIssues.length + analysisResult.migrationIssues.length
    : 0

  const tabs: { id: TabType; label: string; icon: React.ReactNode; count?: number }[] = [
    { id: 'naming', label: '命名规范', icon: <PenTool size={14} />, count: analysisResult?.namingIssues.length },
    { id: 'function', label: '函数拆分', icon: <Split size={14} />, count: analysisResult?.functionIssues.length },
    { id: 'dependency', label: '依赖分析', icon: <Layers size={14} />, count: analysisResult?.dependencyIssues.length },
    { id: 'migration', label: '迁移建议', icon: <Repeat size={14} />, count: analysisResult?.migrationIssues.length },
    { id: 'diff', label: '差异预览', icon: <Eye size={14} /> },
  ]

  return (
    <div
      className="app-container"
      style={{
        display: 'flex', flexDirection: 'column', height: '100%', overflow: 'hidden',
        background: isDark
          ? 'linear-gradient(135deg, #0f0c29 0%, #1a1a3e 50%, #24243e 100%)'
          : 'linear-gradient(135deg, #e0e7ff 0%, #f0f4ff 50%, #e0f2fe 100%)',
        color: textPrimary,
        fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
      }}
    >
      {/* Header */}
      <div style={{
        padding: '14px 20px', background: glassBg, backdropFilter: 'blur(20px)',
        WebkitBackdropFilter: 'blur(20px)', borderBottom: `1px solid ${glassBorder}`,
        display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexShrink: 0,
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div style={{
            width: 42, height: 42, borderRadius: 12,
            background: 'linear-gradient(135deg, #6366f1, #8b5cf6)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            boxShadow: '0 4px 12px rgba(99, 102, 241, 0.4)',
          }}>
            <Wand2 size={22} color="white" />
          </div>
          <div>
            <div style={{ fontWeight: 700, fontSize: 17, display: 'flex', alignItems: 'center', gap: 6 }}>
              智能代码重构助手
              <Sparkles size={14} style={{ color: accentColor }} />
            </div>
            <div style={{ fontSize: 12, color: textSecondary }}>分析代码，提供智能化重构建议</div>
          </div>
        </div>
        <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
          <select value={language} onChange={(e) => setLanguage(e.target.value as Language)}
            style={{
              padding: '8px 14px', borderRadius: 10, border: `1px solid ${glassBorder}`,
              background: glassBg, backdropFilter: 'blur(10px)', color: textPrimary,
              fontSize: 13, cursor: 'pointer', outline: 'none', fontWeight: 500,
            }}>
            <option value="javascript">JavaScript</option>
            <option value="typescript">TypeScript</option>
          </select>
          <button onClick={loadSampleCode}
            style={{
              padding: '8px 14px', borderRadius: 10, border: `1px solid ${glassBorder}`,
              background: glassBg, backdropFilter: 'blur(10px)', color: textPrimary,
              cursor: 'pointer', fontSize: 13, display: 'flex', alignItems: 'center', gap: 6,
              transition: 'all 0.2s', fontWeight: 500,
            }}
            onMouseEnter={(e) => (e.currentTarget.style.background = isDark ? 'rgba(99, 102, 241, 0.2)' : 'rgba(99, 102, 241, 0.1)')}
            onMouseLeave={(e) => (e.currentTarget.style.background = glassBg)}>
            <FileCode size={14} /> 示例
          </button>
          <button onClick={clearCode}
            style={{
              padding: '8px 14px', borderRadius: 10, border: `1px solid ${glassBorder}`,
              background: glassBg, backdropFilter: 'blur(10px)', color: textSecondary,
              cursor: 'pointer', fontSize: 13, display: 'flex', alignItems: 'center', gap: 6,
            }}
            onMouseEnter={(e) => (e.currentTarget.style.background = isDark ? 'rgba(239, 68, 68, 0.15)' : 'rgba(239, 68, 68, 0.1)')}
            onMouseLeave={(e) => (e.currentTarget.style.background = glassBg)}>
            <Trash2 size={14} /> 清空
          </button>
          <button onClick={runAnalysis} disabled={isAnalyzing || !code.trim()}
            style={{
              padding: '10px 20px', borderRadius: 12, border: 'none',
              background: isAnalyzing ? 'linear-gradient(135deg, #64748b, #475569)' : 'linear-gradient(135deg, #6366f1, #8b5cf6)',
              color: 'white', cursor: isAnalyzing ? 'not-allowed' : 'pointer',
              fontSize: 14, fontWeight: 600, display: 'flex', alignItems: 'center', gap: 8,
              boxShadow: isAnalyzing ? 'none' : '0 4px 14px rgba(99, 102, 241, 0.4)',
            }}>
            {isAnalyzing ? (<><RefreshCw size={16} style={{ animation: 'spin 1s linear infinite' }} />分析中</>) : (<><Search size={16} />分析代码</>)}
          </button>
        </div>
      </div>

      {/* Main */}
      <div style={{ display: 'flex', flex: 1, overflow: 'hidden' }}>
        {/* Left: code editor */}
        <div style={{
          flex: 1, display: 'flex', flexDirection: 'column',
          borderRight: `1px solid ${glassBorder}`, overflow: 'hidden',
        }}>
          <div style={{
            padding: '12px 16px', background: glassBg, backdropFilter: 'blur(10px)',
            borderBottom: `1px solid ${glassBorder}`, display: 'flex',
            justifyContent: 'space-between', alignItems: 'center', flexShrink: 0,
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <Code size={16} style={{ color: accentColor }} />
              <span style={{ fontWeight: 600, fontSize: 13 }}>源代码</span>
            </div>
            <div style={{ display: 'flex', gap: 12, fontSize: 12, color: textSecondary }}>
              <span>{code.split('\n').length} 行</span>
              <span>{code.length} 字符</span>
              <span style={{ color: accentColor, fontWeight: 600 }}>{language === 'javascript' ? 'JS' : 'TS'}</span>
            </div>
          </div>
          <textarea value={code} onChange={(e) => setCode(e.target.value)}
            placeholder="在此粘贴 JavaScript 或 TypeScript 代码进行智能分析..."
            spellCheck={false}
            style={{
              flex: 1, padding: 16, border: 'none', outline: 'none', resize: 'none',
              fontFamily: '"JetBrains Mono", "Fira Code", "SF Mono", Consolas, monospace',
              fontSize: 13, lineHeight: 1.7,
              background: isDark ? 'rgba(15, 23, 42, 0.4)' : 'rgba(255, 255, 255, 0.5)',
              color: textPrimary, whiteSpace: 'pre', backdropFilter: 'blur(10px)',
            }}
          />
          <div style={{
            padding: '10px 16px', background: glassBg, backdropFilter: 'blur(10px)',
            borderTop: `1px solid ${glassBorder}`, display: 'flex', gap: 16,
            fontSize: 12, color: textSecondary, flexShrink: 0,
          }}>
            <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}><Shield size={12} />本地分析</span>
            <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}><Zap size={12} />实时检测</span>
            {analysisResult && totalIssues > 0 && (
              <span style={{ display: 'flex', alignItems: 'center', gap: 4, marginLeft: 'auto', color: grade.color, fontWeight: 600 }}>
                <AlertTriangle size={12} />发现 {totalIssues} 个问题
              </span>
            )}
          </div>
        </div>

        {/* Right: results */}
        <div style={{
          width: 520, display: 'flex', flexDirection: 'column', overflow: 'hidden',
          background: isDark ? 'rgba(15, 23, 42, 0.3)' : 'rgba(255, 255, 255, 0.3)',
          backdropFilter: 'blur(10px)',
        }}>
          {analysisResult ? (
            <>
              <div style={{
                padding: '16px 20px', background: glassBg, backdropFilter: 'blur(20px)',
                borderBottom: `1px solid ${glassBorder}`, display: 'flex',
                justifyContent: 'space-between', alignItems: 'center', flexShrink: 0,
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
                  <div style={{
                    width: 64, height: 64, borderRadius: 16,
                    background: isDark ? 'rgba(15, 23, 42, 0.5)' : 'rgba(255, 255, 255, 0.7)',
                    border: `1px solid ${glassBorder}`, display: 'flex',
                    alignItems: 'center', justifyContent: 'center', position: 'relative', overflow: 'hidden',
                  }}>
                    <div style={{
                      position: 'absolute', inset: 0,
                      background: `conic-gradient(${grade.color} ${score * 3.6}deg, transparent ${score * 3.6}deg)`,
                      opacity: 0.2,
                    }} />
                    <span style={{ fontSize: 24, fontWeight: 800, color: grade.color, zIndex: 1 }}>{score}</span>
                  </div>
                  <div>
                    <div style={{ fontWeight: 700, fontSize: 16, marginBottom: 4 }}>
                      代码质量: <span style={{ color: grade.color }}>{grade.label}</span>
                    </div>
                    <div style={{ fontSize: 13, color: textSecondary, maxWidth: 280 }}>{analysisResult.summary}</div>
                    <div style={{ display: 'flex', gap: 10, marginTop: 8 }}>
                      {analysisResult.namingIssues.length > 0 && (
                        <span style={{ fontSize: 11, padding: '2px 8px', borderRadius: 6, background: isDark ? 'rgba(245, 158, 11, 0.15)' : 'rgba(245, 158, 11, 0.1)', color: '#f59e0b' }}>命名 {analysisResult.namingIssues.length}</span>
                      )}
                      {analysisResult.functionIssues.length > 0 && (
                        <span style={{ fontSize: 11, padding: '2px 8px', borderRadius: 6, background: isDark ? 'rgba(249, 115, 22, 0.15)' : 'rgba(249, 115, 22, 0.1)', color: '#f97316' }}>函数 {analysisResult.functionIssues.length}</span>
                      )}
                      {analysisResult.dependencyIssues.length > 0 && (
                        <span style={{ fontSize: 11, padding: '2px 8px', borderRadius: 6, background: isDark ? 'rgba(59, 130, 246, 0.15)' : 'rgba(59, 130, 246, 0.1)', color: '#3b82f6' }}>依赖 {analysisResult.dependencyIssues.length}</span>
                      )}
                      {analysisResult.migrationIssues.length > 0 && (
                        <span style={{ fontSize: 11, padding: '2px 8px', borderRadius: 6, background: isDark ? 'rgba(139, 92, 246, 0.15)' : 'rgba(139, 92, 246, 0.1)', color: '#8b5cf6' }}>迁移 {analysisResult.migrationIssues.length}</span>
                      )}
                    </div>
                  </div>
                </div>
                <button onClick={applyRefactoring}
                  disabled={!refactoredCode || refactoredCode === code}
                  style={{
                    padding: '10px 18px', borderRadius: 12, border: 'none',
                    background: !refactoredCode || refactoredCode === code ? 'linear-gradient(135deg, #64748b, #475569)' : 'linear-gradient(135deg, #22c55e, #16a34a)',
                    color: 'white',
                    cursor: !refactoredCode || refactoredCode === code ? 'not-allowed' : 'pointer',
                    fontSize: 13, fontWeight: 600, display: 'flex', alignItems: 'center', gap: 6,
                    boxShadow: !refactoredCode || refactoredCode === code ? 'none' : '0 4px 14px rgba(34, 197, 94, 0.4)',
                    whiteSpace: 'nowrap',
                  }}>
                  <GitMerge size={14} /> 应用重构
                </button>
              </div>

              {/* Tabs */}
              <div style={{
                display: 'flex', padding: '8px 12px', background: glassBg, backdropFilter: 'blur(10px)',
                borderBottom: `1px solid ${glassBorder}`, flexShrink: 0, overflowX: 'auto',
              }}>
                {tabs.map((tab) => (
                  <button key={tab.id} onClick={() => setActiveTab(tab.id)}
                    style={{
                      padding: '10px 14px', border: 'none', borderRadius: 10,
                      background: activeTab === tab.id ? (isDark ? 'rgba(99, 102, 241, 0.25)' : 'rgba(99, 102, 241, 0.12)') : 'transparent',
                      color: activeTab === tab.id ? accentColor : textSecondary,
                      cursor: 'pointer', fontSize: 13,
                      fontWeight: activeTab === tab.id ? 600 : 500,
                      display: 'flex', alignItems: 'center', gap: 6, transition: 'all 0.2s', whiteSpace: 'nowrap',
                    }}>
                    {tab.icon} {tab.label}
                    {tab.count !== undefined && tab.count > 0 && (
                      <span style={{
                        padding: '1px 6px', borderRadius: 8,
                        background: activeTab === tab.id ? accentColor : (isDark ? '#334155' : '#e2e8f0'),
                        color: activeTab === tab.id ? 'white' : textSecondary,
                        fontSize: 11, fontWeight: 700, minWidth: 18, textAlign: 'center',
                      }}>{tab.count}</span>
                    )}
                  </button>
                ))}
              </div>

              {/* Panel content */}
              <div style={{ flex: 1, overflow: 'auto', padding: 16 }}>
                {activeTab === 'naming' && (
                  <NamingPanel issues={analysisResult.namingIssues} isDark={isDark} textPrimary={textPrimary} textSecondary={textSecondary} accentColor={accentColor} />
                )}
                {activeTab === 'function' && (
                  <FunctionPanel issues={analysisResult.functionIssues} isDark={isDark} textPrimary={textPrimary} textSecondary={textSecondary} accentColor={accentColor} />
                )}
                {activeTab === 'dependency' && (
                  <DependencyPanel issues={analysisResult.dependencyIssues} isDark={isDark} textPrimary={textPrimary} textSecondary={textSecondary} accentColor={accentColor} />
                )}
                {activeTab === 'migration' && (
                  <MigrationPanel issues={analysisResult.migrationIssues} isDark={isDark} textPrimary={textPrimary} textSecondary={textSecondary} accentColor={accentColor} />
                )}
                {activeTab === 'diff' && (
                  <DiffPanel
                    diffResult={diffResult}
                    stats={diffStats}
                    original={code}
                    refactored={refactoredCode}
                    isDark={isDark}
                    textPrimary={textPrimary}
                    textSecondary={textSecondary}
                    onCopy={copyToClipboard}
                    copied={copied}
                  />
                )}
              </div>
            </>
          ) : (
            <div style={{
              flex: 1, display: 'flex', flexDirection: 'column',
              alignItems: 'center', justifyContent: 'center',
              color: textSecondary, padding: 40, textAlign: 'center',
            }}>
              <div style={{
                width: 100, height: 100, borderRadius: 24, background: glassBg, backdropFilter: 'blur(20px)',
                border: `1px solid ${glassBorder}`, display: 'flex',
                alignItems: 'center', justifyContent: 'center', marginBottom: 24,
                boxShadow: '0 8px 32px rgba(99, 102, 241, 0.15)',
              }}>
                <Wand2 size={42} style={{ color: accentColor, opacity: 0.6 }} />
              </div>
              <div style={{ fontSize: 18, fontWeight: 600, marginBottom: 8, color: textPrimary }}>输入代码开始分析</div>
              <div style={{ fontSize: 14, maxWidth: 320, lineHeight: 1.6 }}>
                支持 JavaScript 和 TypeScript，实时检测命名规范、函数拆分、依赖关系和代码迁移建议
              </div>
              <div style={{ display: 'flex', gap: 16, marginTop: 24, fontSize: 12 }}>
                <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}><Check size={12} style={{ color: '#22c55e' }} /> 本地分析</span>
                <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}><Zap size={12} style={{ color: '#f59e0b' }} /> 实时反馈</span>
                <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}><Eye size={12} style={{ color: '#3b82f6' }} /> Diff 预览</span>
              </div>
            </div>
          )}
        </div>
      </div>

      <style>{`
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
        ::-webkit-scrollbar { width: 8px; height: 8px; }
        ::-webkit-scrollbar-track { background: transparent; }
        ::-webkit-scrollbar-thumb { background: ${isDark ? 'rgba(148, 163, 184, 0.2)' : 'rgba(100, 116, 139, 0.2)'}; border-radius: 4px; }
        ::-webkit-scrollbar-thumb:hover { background: ${isDark ? 'rgba(148, 163, 184, 0.3)' : 'rgba(100, 116, 139, 0.3)'}; }
      `}</style>
    </div>
  )
}