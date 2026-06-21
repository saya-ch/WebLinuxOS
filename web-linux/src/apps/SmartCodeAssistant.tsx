import { useState, useCallback, useMemo, memo } from 'react'

type AnalysisMode = 'explain' | 'review' | 'optimize' | 'security' | 'translate' | 'document'

interface AnalysisResult {
  title: string
  sections: { heading: string; content: string; items?: string[] }[]
  warnings?: string[]
  suggestions?: string[]
}

const SAMPLE_CODE: Record<string, string> = {
  JavaScript: `// 计算数组的平均值
function average(arr) {
  let sum = 0;
  for (let i = 0; i < arr.length; i++) {
    sum += arr[i];
  }
  return sum / arr.length;
}

const numbers = [1, 2, 3, 4, 5];
console.log(average(numbers));`,
  Python: `# 斐波那契数列
def fibonacci(n):
    if n <= 1:
        return n
    return fibonacci(n-1) + fibonacci(n-2)

for i in range(10):
    print(fibonacci(i))`,
  TypeScript: `interface User {
  id: number
  name: string
  email: string
}

function getUserEmails(users: User[]): string[] {
  return users.map(u => u.email).filter(e => e != null)
}`,
  SQL: `SELECT u.name, COUNT(o.id) as order_count, SUM(o.total) as total_spent
FROM users u
LEFT JOIN orders o ON u.id = o.user_id
WHERE u.created_at > '2024-01-01'
GROUP BY u.id, u.name
ORDER BY total_spent DESC
LIMIT 10;`,
  CSS: `.card {
  display: flex;
  flex-direction: column;
  padding: 20px;
  background: white;
  border-radius: 8px;
  box-shadow: 0 2px 10px rgba(0,0,0,0.1);
  max-width: 400px;
}

.card:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 20px rgba(0,0,0,0.15);
}`
}

const LANGUAGES = Object.keys(SAMPLE_CODE)

// 分析规则库 - 基于静态分析规则
function analyzeCode(code: string, language: string, mode: AnalysisMode): AnalysisResult {
  const lines = code.split('\n')
  const lineCount = lines.length
  const charCount = code.length
  const complexity = estimateComplexity(code, language)
  const hasComments = detectComments(code, language)
  const issues = detectIssues(code, language)

  if (mode === 'explain') {
    return {
      title: '代码解读',
      sections: [
        { heading: '📊 概览', content: `这是一段 ${language} 代码，共 ${lineCount} 行，${charCount} 个字符。` },
        { heading: '🔍 代码结构', content: analyzeStructure(code, language) },
        { heading: '🎯 核心逻辑', content: extractMainLogic(code, language) },
        { heading: '📈 复杂度评估', content: `循环复杂度: ${complexity.score} (${complexity.level})\n嵌套深度: ${complexity.nesting} 层\n函数/方法数量: ${countFunctions(code, language)}` },
        { heading: '💡 关键要点', content: '', items: extractKeyPoints(code, language) }
      ]
    }
  }

  if (mode === 'review') {
    return {
      title: '代码审查',
      sections: [
        { heading: '✅ 优点', content: '', items: findStrengths(code, language) },
        { heading: '⚠️ 潜在问题', content: '', items: issues.warnings.length > 0 ? issues.warnings : ['暂未发现明显问题'] },
        { heading: '📝 改进建议', content: '', items: issues.suggestions.length > 0 ? issues.suggestions : ['代码整体质量良好'] },
        { heading: '🎨 代码风格评估', content: evaluateStyle(code, language) },
        { heading: '📖 注释覆盖率', content: hasComments.percent > 0 ? `注释覆盖率: ${hasComments.percent.toFixed(1)}% (${hasComments.count} 行注释)` : '建议添加注释以提高代码可读性' }
      ]
    }
  }

  if (mode === 'optimize') {
    return {
      title: '性能优化建议',
      sections: [
        { heading: '⚡ 性能瓶颈', content: '', items: findBottlenecks(code, language) },
        { heading: '🔧 优化建议', content: '', items: issues.optimizations.length > 0 ? issues.optimizations : ['代码已相当优化，保持现有实现'] },
        { heading: '📉 复杂度分析', content: `当前复杂度: ${complexity.level}\n预估改进空间: ${Math.max(5, complexity.score * 10)}%` },
        { heading: '💾 内存/资源使用', content: analyzeMemoryUsage(code, language) }
      ]
    }
  }

  if (mode === 'security') {
    return {
      title: '安全分析',
      sections: [
        { heading: '🔒 安全风险', content: '', items: detectSecurityIssues(code, language) },
        { heading: '🛡️ 最佳实践', content: '', items: securityBestPractices(code, language) },
        { heading: '📋 输入验证', content: analyzeInputValidation(code, language) },
        { heading: '⚠️ 敏感信息检查', content: detectSensitiveInfo(code) }
      ]
    }
  }

  if (mode === 'translate') {
    return {
      title: '代码语言转换',
      sections: [
        { heading: '🎯 转换建议', content: generateTranslation(code, language) },
        { heading: '📌 注意事项', content: '', items: getTranslationNotes(language) }
      ]
    }
  }

  if (mode === 'document') {
    return {
      title: '文档生成',
      sections: [
        { heading: '📝 模块概述', content: generateOverview(code, language) },
        { heading: '🔧 函数/方法列表', content: '', items: listFunctions(code, language) },
        { heading: '📋 输入参数说明', content: analyzeParameters(code, language) },
        { heading: '↩️ 返回值说明', content: analyzeReturns(code, language) },
        { heading: '🎨 JSDoc / 文档字符串示例', content: generateDocStrings(code, language) },
        { heading: '📚 使用示例', content: generateUsageExample(code, language) }
      ]
    }
  }

  return { title: '分析', sections: [{ heading: '结果', content: '请选择分析模式' }] }
}

function estimateComplexity(code: string, _lang: string) {
  const loops = (code.match(/\b(for|while|foreach)\b/gi) || []).length
  const conditionals = (code.match(/\b(if|else|switch|case)\b/gi) || []).length
  const functions = (code.match(/\b(function|def|fn|fun|=>)\b/gi) || []).length
  const recursionMatches = code.match(/\{[^}]*\}/g) || []
  const nesting = Math.max(...recursionMatches.map(m => (m.match(/\{/g) || []).length), 0)
  const score = loops * 2 + conditionals + functions + nesting
  const level = score < 5 ? '低' : score < 15 ? '中等' : score < 30 ? '较高' : '高'
  return { score, level, nesting, loops, functions }
}

function detectComments(code: string, language: string) {
  let count = 0
  const lines = code.split('\n')
  for (const line of lines) {
    const trimmed = line.trim()
    if (language === 'Python') {
      if (trimmed.startsWith('#') || trimmed.startsWith('"""') || trimmed.startsWith("'''")) count++
    } else {
      if (trimmed.startsWith('//') || trimmed.startsWith('/*') || trimmed.startsWith('*') || trimmed.startsWith('--')) count++
    }
  }
  return { count, percent: (count / Math.max(lines.length, 1)) * 100 }
}

function detectIssues(code: string, _lang: string) {
  const warnings: string[] = []
  const suggestions: string[] = []
  const optimizations: string[] = []

  // 通用检查
  if (/console\.log\s*\(/.test(code) && /function|=>/.test(code)) {
    suggestions.push('考虑使用专门的日志框架替代 console.log')
  }
  if (code.includes('eval(')) {
    warnings.push('使用 eval() 存在安全风险，请谨慎使用')
  }
  if (/var\s+\w+\s*=/.test(code)) {
    suggestions.push('建议使用 const / let 替代 var')
  }
  if (/==\s*[^=]/.test(code)) {
    warnings.push('使用 == 可能导致类型转换问题，建议使用 ===')
  }
  if (code.includes('magic') || /\b\d{3,}\b/.test(code)) {
    suggestions.push('存在魔术数字，建议定义为常量以提高可维护性')
  }
  if (code.split('\n').filter(l => l.length > 120).length > 3) {
    suggestions.push('部分代码行过长，建议换行以提高可读性')
  }
  if (/\btimeout|delay|sleep|TODO|FIXME|HACK\b/i.test(code)) {
    warnings.push('代码中包含 TODO / FIXME / HACK 等标记，需要处理')
  }
  if (/for\s*\([^)]*length[^)]*\)/.test(code)) {
    optimizations.push('在循环中重复访问 .length 可优化为缓存变量')
  }
  if (code.includes('+') && (code.includes('"') || code.includes("'"))) {
    suggestions.push('考虑使用模板字符串来提升可读性')
  }

  return { warnings, suggestions, optimizations }
}

function analyzeStructure(code: string, language: string): string {
  const functions = countFunctions(code, language)
  const classes = (code.match(/\b(class|struct)\s+\w+/g) || []).length
  const loops = (code.match(/\b(for|while)\b/gi) || []).length
  const conditionals = (code.match(/\b(if|switch)\b/gi) || []).length
  const imports = (code.match(/\b(import|require|from)\b/gi) || []).length

  return `检测到:\n• ${functions} 个函数/方法定义\n• ${classes} 个类/结构定义\n• ${loops} 个循环结构\n• ${conditionals} 个条件分支\n• ${imports} 个导入/引用`
}

function extractMainLogic(code: string, _language: string): string {
  const nonEmpty = code.split('\n').filter(l => l.trim())
  if (nonEmpty.length < 8) return '代码较短，主要执行简单的计算或输出操作'
  const meaningful = nonEmpty.filter(l => !l.trim().startsWith('//') && !l.trim().startsWith('#'))
  return `主要包含 ${meaningful.length} 行有效代码逻辑\n执行流程:\n1. 初始化数据/变量\n2. 执行核心计算或操作\n3. 处理结果或输出`
}

function extractKeyPoints(code: string, language: string): string[] {
  const points: string[] = []
  if (/\bfunction|=>|def|fn|fun\b/.test(code)) points.push('使用函数/方法封装逻辑')
  if (/\bfor|while\b/i.test(code)) points.push('包含循环迭代逻辑')
  if (/\bif|switch|match\b/i.test(code)) points.push('包含条件分支控制')
  if (/\breturn\b/i.test(code)) points.push('有返回值，可以作为模块使用')
  if (/\bconsole\.|print|console\.log|stdout|printf\b/i.test(code)) points.push('包含输出/调试语句')
  if (/\bArray|Object|List|Dict|Map|\[\]|\{\}/.test(code)) points.push('使用了复合数据结构')
  if (language === 'CSS') {
    if (/:hover|:active|:focus/.test(code)) points.push('包含交互状态样式')
    if (/flex|grid/.test(code)) points.push('使用现代布局方案')
    if (/transform|transition|animation/.test(code)) points.push('包含动画或变换效果')
  }
  if (language === 'SQL') {
    if (/JOIN/i.test(code)) points.push('使用了表连接')
    if (/GROUP\s+BY/i.test(code)) points.push('包含聚合查询')
    if (/ORDER\s+BY/i.test(code)) points.push('包含排序逻辑')
  }
  if (points.length === 0) points.push('代码简洁直接')
  return points
}

function countFunctions(code: string, language: string): number {
  if (language === 'Python') return (code.match(/^\s*def\s+\w+/gm) || []).length
  if (language === 'CSS') return 0
  if (language === 'SQL') return (code.match(/CREATE\s+(FUNCTION|PROCEDURE)/gi) || []).length
  const arrow = (code.match(/=>/g) || []).length
  const named = (code.match(/\bfunction\s+\w+/gi) || []).length
  const classMethods = (code.match(/^\s*\w+\s*\([^)]*\)\s*\{/gm) || []).length
  return named + Math.floor(arrow / 2) + classMethods
}

function findStrengths(code: string, _language: string): string[] {
  const strengths: string[] = []
  if (code.includes('const') || code.includes('final') || code.includes('readonly')) strengths.push('使用了不可变变量声明，提高安全性')
  if (/===\s|==\s/.test(code) === false || code.includes('===')) strengths.push('比较操作符使用得当')
  if (code.includes('\n\n')) strengths.push('代码有适当的空行分隔，可读性好')
  if (/[a-z][A-Z]/.test(code) || /[a-z]_[a-z]/.test(code)) strengths.push('变量命名风格相对一致')
  if (detectComments(code, _language).count > 0) strengths.push('包含注释，便于团队协作')
  if (code.length > 0 && !code.includes('TODO')) strengths.push('代码干净，无遗留标记')
  if (strengths.length === 0) strengths.push('基础代码结构完整')
  return strengths
}

function evaluateStyle(code: string, language: string): string {
  const lines = code.split('\n')
  const longLines = lines.filter(l => l.length > 100).length
  const consistentIndent = lines.filter(l => l.trim() && (l.startsWith('  ') || l.startsWith('\t'))).length
  const commentRatio = detectComments(code, language).percent

  return `代码风格评分: ${Math.max(40, 100 - longLines * 5 - Math.abs(commentRatio - 15))}/100\n• 行长度: ${longLines} 行超过 100 字符\n• 缩进规范: ${consistentIndent > 0 ? '良好' : '建议统一缩进'}\n• 注释比例: ${commentRatio.toFixed(1)}% (理想: 10-20%)`
}

function findBottlenecks(code: string, _language: string): string[] {
  const issues: string[] = []
  // 嵌套循环检测
  const nestedLoopMatch = code.match(/for[^{]*\{[\s\S]{0,500}for[\s\S]{0,500}\}/i)
  if (nestedLoopMatch) issues.push('存在嵌套循环，可能造成 O(n2) 时间复杂度')
  // 正则
  if ((code.match(/\brecursion|递归\b/) || []).length > 0) issues.push('可能包含递归逻辑，注意栈溢出风险')
  // DOM 操作
  if ((code.match(/document\.|getElement|querySelector|innerHTML/g) || []).length > 3) {
    issues.push('频繁的 DOM 操作，建议合并操作或使用文档片段')
  }
  // JSON 解析
  if ((code.match(/JSON\.parse|JSON\.stringify/g) || []).length > 2) {
    issues.push('多次 JSON 序列化/反序列化，考虑缓存结果')
  }
  if (issues.length === 0) issues.push('未发现明显性能瓶颈，代码质量良好')
  return issues
}

function analyzeMemoryUsage(code: string, _language: string): string {
  const arrays = (code.match(/\[\s*\d|Array|new\s+(Set|Map|List|Dict)/g) || []).length
  const strings = (code.match(/['"]\s*\+\s*\w+|\w+\s*\+\s*['"]/g) || []).length
  return `数据结构使用:\n• ${arrays} 个集合/数组初始化\n• ${strings} 处字符串拼接\n\n优化方向:\n• 避免在循环中频繁拼接字符串\n• 使用合适大小预分配的集合\n• 注意及时释放不再需要的对象引用`
}

function detectSecurityIssues(code: string, _language: string): string[] {
  const issues: string[] = []
  if (code.includes('eval(')) issues.push('⚠️ 使用 eval() 可能导致代码注入风险')
  if (/\binnerHTML\b|html\s*=/.test(code)) issues.push('⚠️ 直接操作 HTML 可能存在 XSS 风险')
  if (/document\.write/.test(code)) issues.push('⚠️ document.write 不推荐使用，存在安全隐患')
  if (/password|secret|token|api[_-]?key/i.test(code)) issues.push('⚠️ 代码中疑似包含敏感信息关键字，请勿硬编码')
  if (/http:\/\/(?!localhost|127\.0\.0\.1)/.test(code)) issues.push('⚠️ 使用了 HTTP 协议，建议升级到 HTTPS')
  if (/SELECT|INSERT|UPDATE|DELETE/i.test(code) && /\$|\+\s*\w+/.test(code)) issues.push('⚠️ 可能存在 SQL 注入风险，使用参数化查询')
  if (issues.length === 0) issues.push('✅ 未发现明显安全问题')
  return issues
}

function securityBestPractices(_code: string, language: string): string[] {
  const practices: string[] = [
    '✅ 永远校验外部输入，不要信任用户数据',
    '✅ 使用参数化查询/ORM 防止 SQL 注入',
    '✅ 使用安全的随机数生成器 (crypto.getRandomValues, secrets)',
    '✅ 密码必须使用 bcrypt / argon2 等慢速哈希算法',
  ]
  if (language !== 'CSS' && language !== 'SQL') {
    practices.push('✅ 避免在前端存储敏感信息')
  }
  return practices
}

function analyzeInputValidation(code: string, _language: string): string {
  const hasValidation = /typeof|instanceof|Array\.isArray|isNaN|parseInt|if\s*\([^)]*[!=]=/.test(code)
  if (hasValidation) {
    return '✅ 代码中包含一些类型检查和验证逻辑\n建议: 确保所有外部输入都有完整的校验，并使用断言或类型守卫'
  }
  return '⚠️ 缺少输入验证\n建议:\n• 对所有函数参数进行类型检查\n• 使用 typeof / instanceof / Array.isArray 等\n• 校验数字范围和字符串格式\n• 考虑使用 Zod / Joi 等校验库'
}

function detectSensitiveInfo(code: string): string {
  const patterns: [RegExp, string][] = [
    [/password|pwd|passwd/i, '密码相关'],
    [/api[_-]?key|api[_-]?secret/i, 'API Key'],
    [/secret[_-]?key|private[_-]?key/i, '密钥相关'],
    [/Bearer|eyJ[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+\./, 'JWT Token'],
    [/\b\d{13,19}\b/, '疑似卡号'],
    [/AKIA[A-Z0-9]{16}/, 'AWS Access Key'],
  ]
  const found: string[] = []
  for (const [pattern, name] of patterns) {
    if (pattern.test(code)) found.push(name)
  }
  if (found.length > 0) return `⚠️ 检测到: ${found.join(', ')}\n请不要在代码中硬编码敏感信息，使用环境变量或密钥管理服务`
  return '✅ 未检测到明显的敏感信息'
}

function generateTranslation(code: string, language: string): string {
  const tips: Record<string, string> = {
    JavaScript: `建议转换为 TypeScript 以获得类型安全\n\n主要改动:\n• 添加类型注解 (变量、参数、返回值)\n• 定义接口 interface\n• 使用泛型提升复用性\n\n当前 ${code.length} 字符，预计转换需要 15-30 分钟`,
    Python: `建议检查是否可以利用 Python 特性\n\n• 使用列表推导式替代简单循环\n• 使用 with 语句管理资源\n• 利用 collections 模块优化数据处理\n• 添加类型注解 (Type Hints)`,
    TypeScript: `可考虑转换为 JavaScript 以获得更广兼容性\n或保留 TS 但使用更严格的 tsconfig 配置`,
    CSS: `可考虑:\n• 迁移到 SCSS / Sass 以获得变量和 mixin\n• 使用 Tailwind CSS 原子化类名\n• 使用 CSS 变量 (custom properties)`,
    SQL: `可优化:\n• 添加必要的索引\n• 检查执行计划\n• 使用 CTE (WITH 子句) 提升可读性`
  }
  return tips[language] || '请参考目标语言的最佳实践进行转换'
}

function getTranslationNotes(_language: string): string[] {
  return [
    '保留原始代码的逻辑和行为',
    '注意不同语言之间的性能差异',
    '检查跨语言的数据类型映射',
    '处理好异常/错误传递机制',
    '重新运行测试验证功能正确性'
  ]
}

function generateOverview(code: string, language: string): string {
  const purpose = extractMainLogic(code, language)
  return `这是一个 ${language} 代码模块\n\n功能概述: ${purpose}\n\n规模: ${code.split('\n').length} 行 / ${code.length} 字符\n\n此模块可被其他组件调用或独立运行`
}

function listFunctions(code: string, language: string): string[] {
  const items: string[] = []
  if (language === 'Python') {
    const matches = code.match(/^\s*def\s+(\w+)\s*\(([^)]*)\)/gm) || []
    matches.forEach(m => items.push(m.trim()))
  } else if (language === 'JavaScript' || language === 'TypeScript') {
    const named = code.match(/^\s*(?:export\s+)?function\s+(\w+)\s*\(([^)]*)\)/gm) || []
    named.forEach(m => items.push(m.trim()))
  } else if (language === 'SQL') {
    return ['SQL 查询无需函数级文档，建议关注表结构和索引']
  } else if (language === 'CSS') {
    const classes = code.match(/\.[a-z][\w-]*/gi) || []
    return [...new Set(classes)].slice(0, 10).map(c => `选择器: ${c}`)
  }
  if (items.length === 0) items.push('无显式函数定义 (代码为脚本/配置)')
  return items
}

function analyzeParameters(code: string, _language: string): string {
  const params = code.match(/\(([^)]*)\)/g) || []
  if (params.length === 0) return '未检测到明确的参数列表'
  const paramSet = new Set<string>()
  params.slice(0, 8).forEach(p => {
    const inner = p.slice(1, -1).trim()
    if (inner && inner.length < 80) paramSet.add(inner)
  })
  return `检测到的参数签名:\n${[...paramSet].map(p => '• ' + p).join('\n')}\n\n建议: 为每个参数添加类型说明和默认值`
}

function analyzeReturns(code: string, _language: string): string {
  const returns = code.match(/\breturn\b[^;{]{0,80}/gi) || []
  if (returns.length === 0) return '代码未显式返回值，可能是纯过程代码'
  return `检测到 ${returns.length} 处 return 语句\n\n部分返回示例:\n${returns.slice(0, 5).map(r => '• ' + r.trim()).join('\n')}\n\n建议: 在文档中明确说明返回类型和可能的 null/undefined 情况`
}

function generateDocStrings(_code: string, language: string): string {
  if (language === 'Python') {
    return `"""模块说明\n\n功能描述: [填写功能]\n\n模块变量:\n    [变量名]: [说明]\n\n函数/方法:\n    [函数名]([参数]) -> [返回类型]:\n        [功能描述]\n        \n        Args:\n            [参数名] ([类型]): [说明]\n            \n        Returns:\n            [类型]: [说明]\n            \n        Raises:\n            [异常类型]: [说明]\n\n示例:\n    >>> [使用示例]\n    [预期输出]\n\n作者: [您的名字]\n日期: ${new Date().toISOString().slice(0, 10)}\n"""`
  }
  if (language === 'CSS') {
    return `/* =========================================\n * CSS Module: [模块名]\n * Author: [您的名字]\n * Updated: ${new Date().toISOString().slice(0, 10)}\n * =========================================\n * \n * Description:\n *   [描述]\n *\n * Changelog:\n *   v1.0 - Initial version\n *\n * ========================================= */\n\n/* Component: Card */\n/* Usage: <div class="card">...</div> */\n.card { }\n\n/* State: Hover */\n.card:hover { }\n\n/* Responsive: Mobile */\n@media (max-width: 640px) { .card { } }`
  }
  return `/**\n * [函数/模块名] - 简短描述\n * \n * @description\n * 详细的功能描述，说明用途、设计意图\n * \n * @param {string} param1 - 参数1说明\n * @param {Object} [options] - 可选配置对象\n * @param {boolean} [options.enabled=true] - 可选配置项\n * @returns {Promise<Object>} 返回值说明\n * \n * @example\n * const result = myFunction("input", { enabled: true });\n * console.log(result);\n *\n * @throws {TypeError} 当输入参数类型错误时\n * @throws {Error} 当操作失败时\n * \n * @author Your Name\n * @since 1.0.0\n * @see {@link related-function}\n */`
}

function generateUsageExample(_code: string, language: string): string {
  if (language === 'Python') {
    return `# 使用示例\n# ==============\n\n# 1. 导入模块\n# from your_module import your_function\n\n# 2. 准备输入数据\n# input_data = [...]\n\n# 3. 调用函数\n# result = your_function(input_data)\n\n# 4. 处理结果\n# print(result)\n\n# ============ 完整示例 ============\n# if __name__ == \"__main__\":\n#     result = your_function([1, 2, 3])\n#     print(f\"Result: {result}\")`
  }
  if (language === 'CSS') {
    return `<!-- HTML 使用示例 -->\n<div class="card">\n  <h2>标题</h2>\n  <p>内容描述</p>\n  <button>操作</button>\n</div>`
  }
  if (language === 'SQL') {
    return `-- 使用示例\n-- 直接执行此查询，或作为子查询\n\n-- 常见的调用场景:\n-- 1. 作为报告查询\n-- 2. 与其他查询 JOIN 组合\n-- 3. 在应用程序 ORM 中执行`
  }
  return `// 使用示例\n// ============\n\n// 1. 准备输入\nconst input = { /* ... */ };\n\n// 2. 调用函数/方法\nconst output = yourFunction(input);\n\n// 3. 处理结果\nconsole.log(output);\n\n// ============ 完整的单元测试示例 ============\n// describe('yourFunction', () => {\n//   it('should handle basic case', () => {\n//     expect(yourFunction([1, 2, 3])).toBe(expected);\n//   });\n// });`
}

function SmartCodeAssistant() {
  const [code, setCode] = useState(SAMPLE_CODE.JavaScript)
  const [language, setLanguage] = useState('JavaScript')
  const [mode, setMode] = useState<AnalysisMode>('explain')
  const [result, setResult] = useState<AnalysisResult | null>(null)
  const [isAnalyzing, setIsAnalyzing] = useState(false)
  const [history, setHistory] = useState<{ language: string; mode: AnalysisMode; time: string; snippet: string }[]>([])

  const modes: { id: AnalysisMode; label: string; icon: string; description: string }[] = [
    { id: 'explain', label: '解释代码', icon: '📖', description: '逐行解读代码逻辑' },
    { id: 'review', label: '代码审查', icon: '🔍', description: '发现潜在问题和改进建议' },
    { id: 'optimize', label: '性能优化', icon: '⚡', description: '分析性能瓶颈并建议优化' },
    { id: 'security', label: '安全分析', icon: '🔒', description: '检测安全漏洞和风险' },
    { id: 'document', label: '生成文档', icon: '📝', description: '自动生成代码文档' },
    { id: 'translate', label: '代码转换', icon: '🔄', description: '转换为其他语言/风格' },
  ]

  const handleAnalyze = useCallback(() => {
    if (!code.trim()) return
    setIsAnalyzing(true)
    setTimeout(() => {
      const analysis = analyzeCode(code, language, mode)
      setResult(analysis)
      setHistory(prev => [
        {
          language,
          mode,
          time: new Date().toLocaleTimeString(),
          snippet: code.slice(0, 60).replace(/\n/g, ' ') + (code.length > 60 ? '...' : '')
        },
        ...prev.slice(0, 9)
      ])
      setIsAnalyzing(false)
    }, 500)
  }, [code, language, mode])

  const handleSampleLoad = useCallback((lang: string) => {
    setLanguage(lang)
    setCode(SAMPLE_CODE[lang] || '')
    setResult(null)
  }, [])

  const stats = useMemo(() => {
    const lines = code.split('\n').length
    const chars = code.length
    const words = code.split(/\s+/).filter(w => w.length > 0).length
    const complexity = estimateComplexity(code, language)
    return { lines, chars, words, complexity }
  }, [code, language])

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', background: 'var(--bg)' }}>
      {/* Header */}
      <div style={{
        display: 'flex', alignItems: 'center', padding: '12px 20px',
        borderBottom: '1px solid var(--border)', background: 'var(--bg-secondary)'
      }}>
        <div style={{ fontSize: 18, fontWeight: 600, display: 'flex', alignItems: 'center', gap: 8 }}>
          <span>🤖</span> 智能代码助手
        </div>
        <div style={{ marginLeft: 'auto', fontSize: 12, color: 'var(--text-muted)' }}>
          {stats.lines} 行 · {stats.words} 词 · {stats.chars} 字符 · 复杂度: {stats.complexity.level}
        </div>
      </div>

      {/* Main Content */}
      <div style={{ flex: 1, display: 'flex', overflow: 'hidden' }}>
        {/* Left: Code Editor */}
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', borderRight: '1px solid var(--border)', minWidth: 300 }}>
          {/* Toolbar */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '8px 12px', background: 'var(--bg-secondary)', borderBottom: '1px solid var(--border)' }}>
            <select
              value={language}
              onChange={(e) => setLanguage(e.target.value)}
              style={{ padding: '6px 10px', background: 'var(--bg)', color: 'var(--text)', border: '1px solid var(--border)', borderRadius: 4, fontSize: 12 }}
            >
              {LANGUAGES.map(l => <option key={l} value={l}>{l}</option>)}
            </select>
            <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>示例:</div>
            {LANGUAGES.map(l => (
              <button
                key={l}
                onClick={() => handleSampleLoad(l)}
                style={{
                  padding: '4px 10px', fontSize: 11, background: language === l ? 'var(--accent)' : 'transparent',
                  color: language === l ? 'white' : 'var(--text-muted)',
                  border: '1px solid var(--border)', borderRadius: 4, cursor: 'pointer'
                }}
              >
                {l}
              </button>
            ))}
          </div>

          {/* Code area */}
          <textarea
            value={code}
            onChange={(e) => setCode(e.target.value)}
            spellCheck={false}
            placeholder="在此粘贴或输入代码..."
            style={{
              flex: 1, padding: 16, fontSize: 13,
              fontFamily: "'SF Mono', Monaco, Menlo, Consolas, monospace",
              background: 'var(--bg)', color: 'var(--text)', border: 'none', outline: 'none',
              resize: 'none', lineHeight: 1.6, whiteSpace: 'pre'
            }}
          />

          {/* Mode buttons */}
          <div style={{ padding: 12, borderTop: '1px solid var(--border)', background: 'var(--bg-secondary)' }}>
            <div style={{ fontSize: 11, color: 'var(--text-muted)', marginBottom: 8 }}>选择分析模式:</div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 8, marginBottom: 12 }}>
              {modes.map(m => (
                <button
                  key={m.id}
                  onClick={() => setMode(m.id)}
                  style={{
                    padding: '10px 8px', fontSize: 12, textAlign: 'left',
                    background: mode === m.id ? 'var(--accent)' : 'var(--bg)',
                    color: mode === m.id ? 'white' : 'var(--text)',
                    border: '1px solid ' + (mode === m.id ? 'var(--accent)' : 'var(--border)'),
                    borderRadius: 6, cursor: 'pointer', fontWeight: 500
                  }}
                >
                  <div style={{ fontSize: 14, marginBottom: 2 }}>{m.icon} {m.label}</div>
                  <div style={{ fontSize: 10, opacity: 0.7 }}>{m.description}</div>
                </button>
              ))}
            </div>
            <button
              onClick={handleAnalyze}
              disabled={isAnalyzing || !code.trim()}
              style={{
                width: '100%', padding: '12px', fontSize: 14, fontWeight: 600,
                background: isAnalyzing ? 'var(--text-muted)' : 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                color: 'white', border: 'none', borderRadius: 6, cursor: isAnalyzing ? 'wait' : 'pointer'
              }}
            >
              {isAnalyzing ? '🔄 分析中...' : '✨ 开始分析'}
            </button>
          </div>
        </div>

        {/* Right: Results / History */}
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minWidth: 300, overflow: 'hidden' }}>
          {result && (
            <div style={{ padding: 16, overflowY: 'auto', flex: 1 }}>
              <h3 style={{ fontSize: 16, margin: '0 0 12px', color: 'var(--accent)' }}>
                {result.title}
              </h3>
              {result.sections.map((section, idx) => (
                <div key={idx} style={{ marginBottom: 16, background: 'var(--bg-secondary)', padding: 14, borderRadius: 8 }}>
                  <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 8, color: 'var(--text)' }}>
                    {section.heading}
                  </div>
                  {section.content && (
                    <div style={{ fontSize: 12, whiteSpace: 'pre-wrap', color: 'var(--text-muted)', lineHeight: 1.7 }}>
                      {section.content}
                    </div>
                  )}
                  {section.items && section.items.length > 0 && (
                    <ul style={{ margin: '8px 0', padding: 0, listStyle: 'none', fontSize: 12 }}>
                      {section.items.map((item, i) => (
                        <li key={i} style={{
                          padding: '4px 0 4px 14px', color: 'var(--text-muted)',
                          position: 'relative', lineHeight: 1.6
                        }}>
                          <span style={{ position: 'absolute', left: 0, top: 4 }}>›</span>
                          {item}
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              ))}
            </div>
          )}

          {!result && history.length === 0 && (
            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: 20, color: 'var(--text-muted)', fontSize: 13, textAlign: 'center' }}>
              <div style={{ fontSize: 48, marginBottom: 16, opacity: 0.3 }}>🤖</div>
              <div style={{ fontSize: 15, color: 'var(--text)', marginBottom: 8 }}>欢迎使用智能代码助手</div>
              <div style={{ maxWidth: 300 }}>从左侧选择或粘贴代码，然后选择分析模式开始分析。支持 JavaScript、TypeScript、Python、SQL、CSS 等多种语言。</div>
            </div>
          )}

          {!result && history.length === 0 && (
            <div style={{ padding: 12, borderTop: '1px solid var(--border)', fontSize: 11, color: 'var(--text-muted)' }}>
              <div style={{ marginBottom: 8, fontWeight: 600 }}>💡 快速提示</div>
              <div style={{ lineHeight: 1.8 }}>• 将完整代码粘贴到左侧进行分析<br/>• 分析模式涵盖代码理解、审查、优化、安全等<br/>• 分析结果仅供参考，建议结合人工判断</div>
            </div>
          )}

          {history.length > 0 && (
            <div style={{ borderTop: '1px solid var(--border)', padding: 12, maxHeight: 200, overflowY: 'auto', background: 'var(--bg-secondary)' }}>
              <div style={{ fontSize: 11, color: 'var(--text-muted)', marginBottom: 8, fontWeight: 600 }}>📜 分析历史</div>
              {history.map((h, i) => (
                <div key={i} style={{ fontSize: 11, padding: '6px 0', borderBottom: i < history.length - 1 ? '1px solid var(--border)' : 'none', color: 'var(--text-muted)' }}>
                  <span style={{ color: 'var(--accent)', marginRight: 6 }}>[{h.time}]</span>
                  {h.language} · {({ explain: '解读', review: '审查', optimize: '优化', security: '安全', document: '文档', translate: '转换' } as Record<string, string>)[h.mode]}
                  <div style={{ fontSize: 10, opacity: 0.7, marginLeft: 80 }}>{h.snippet}</div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default memo(SmartCodeAssistant)
