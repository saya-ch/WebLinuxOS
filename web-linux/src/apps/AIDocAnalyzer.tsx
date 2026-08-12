import { useState, useMemo, useCallback, useRef, useEffect } from 'react'
import {
  FileCode, Gauge, Layers, Copy, Download, ChevronDown, ChevronRight,
  X, Check, ListChecks, Sparkles, BarChart3, Activity, FileText,
  RefreshCw, Wand2, Lightbulb, Code2, GitCompare, Target, Hash, AlertTriangle,
} from 'lucide-react'

type Language = 'javascript' | 'typescript' | 'python' | 'java'
type Theme = 'dark' | 'light'

interface FunctionMetrics {
  name: string
  lineStart: number
  lineEnd: number
  length: number
  complexity: number
  nestingDepth: number
}

interface ComplexityResult {
  cyclomaticComplexity: number
  nestingDepth: number
  functionLength: number
  totalFunctions: number
  maxComplexity: number
  avgComplexity: number
  functions: FunctionMetrics[]
}

interface DocIssue {
  line: number
  type: 'missing-jsdoc' | 'low-coverage' | 'empty-comment' | 'todo-fixme'
  message: string
  severity: 'high' | 'medium' | 'low'
}

interface DocQualityResult {
  commentCoverage: number
  totalLines: number
  commentLines: number
  jsdocCount: number
  undocumentedFunctions: string[]
  qualityIssues: DocIssue[]
}

interface DuplicateBlock {
  id: string
  pattern: string
  occurrences: { line: number; snippet: string }[]
  similarity: number
}

interface AnalysisReport {
  complexity: ComplexityResult
  docQuality: DocQualityResult
  duplicates: DuplicateBlock[]
  overallScore: number
  grade: string
  suggestions: string[]
}

const LANG_META: Record<Language, { label: string; ext: string }> = {
  javascript: { label: 'JavaScript', ext: 'js' },
  typescript: { label: 'TypeScript', ext: 'ts' },
  python: { label: 'Python', ext: 'py' },
  java: { label: 'Java', ext: 'java' },
}

const uid = () => Math.random().toString(36).slice(2, 10)

function detectLanguage(code: string): Language {
  const lines = code.split('\n')
  let jsScore = 0, tsScore = 0, pyScore = 0, javaScore = 0
  for (const line of lines) {
    if (/^\s*(import|from)\s+.*['"]/.test(line) || /\b(const|let|var)\s+\w+/.test(line)) jsScore++
    if (/:\s*(string|number|boolean|any|interface|type|void)\b/.test(line) || /\binterface\s+\w+/.test(line)) tsScore += 2
    if (/\bfunction\s+\w+/.test(line) || /=>\s*[{(]/.test(line)) jsScore++
    if (/^\s*(def |class |import |from )/.test(line)) pyScore += 2
    if (/^\s*#/.test(line)) pyScore++
    if (/\bprint\s*\(/.test(line)) pyScore++
    if (/^\s*(if|for|while|try|except)\s+.*:\s*$/.test(line)) pyScore++
    if (/\bpublic\s+(static\s+)?(class|void|\w+)\s+\w+/.test(line) || /\bpackage\s+\w+/.test(line)) javaScore += 2
    if (/\bSystem\.out\./.test(line)) javaScore++
    if (/\bString\s+\w+\s*[=;]/.test(line)) javaScore++
  }
  const scores: Record<Language, number> = { javascript: jsScore, typescript: tsScore + jsScore * 0.5, python: pyScore, java: javaScore }
  const best = (Object.entries(scores) as [Language, number][]).sort((a, b) => b[1] - a[1])[0]
  return best[1] > 0 ? best[0] : 'javascript'
}

function analyzeComplexity(code: string, lang: Language): ComplexityResult {
  const lines = code.split('\n')
  const functions: FunctionMetrics[] = []
  let cyclomaticComplexity = 1
  let nestingDepth = 0
  let funcStart = -1
  let funcName = ''
  let funcComplexity = 1
  let funcNesting = 0
  let braceDepth = 0

  const funcPatterns: Record<Language, RegExp[]> = {
    javascript: [
      /function\s+(\w+)\s*\(/,
      /(?:const|let|var)\s+(\w+)\s*=\s*(?:async\s+)?[(](\w+)[)]/,
      /(\w+)\s*[:=]\s*(?:async\s+)?(?:function|[(])/,
    ],
    typescript: [
      /function\s+(\w+)\s*\(/,
      /(?:const|let|var)\s+(\w+)\s*[:=]\s*(?:async\s+)?[(](\w+)[)]/,
      /(\w+)\s*[:=]\s*(?:async\s+)?(?:function|[(])/,
    ],
    python: [/^\s*def\s+(\w+)\s*\(/],
    java: [
      /(?:public|private|protected|static|\s)+(?:[\w<>\[\]]+)\s+(\w+)\s*\(/,
      /(?:public|private|protected|static|\s)+void\s+(\w+)\s*\(/,
    ],
  }

  const controlFlowPatterns = [
    /\bif\b/, /\belse\s+if\b/, /\bfor\b/, /\bwhile\b/, /\bcase\b/,
    /\bcatch\b/, /\?[^:]*:/, /&&|\|\|/,
  ]

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i]

    if (lang === 'python') {
      const indent = line.match(/^(\s*)/)?.[1].length || 0
      const level = Math.floor(indent / 4)
      if (level > nestingDepth) nestingDepth = level

      if (/^\s*def\s+/.test(line)) {
        if (funcStart >= 0) {
          functions.push({
            name: funcName,
            lineStart: funcStart + 1,
            lineEnd: i,
            length: i - funcStart,
            complexity: funcComplexity,
            nestingDepth: funcNesting,
          })
        }
        const m = line.match(/def\s+(\w+)/)
        funcStart = i
        funcName = m ? m[1] : 'anonymous'
        funcComplexity = 1
        funcNesting = level
      }

      if (funcStart >= 0 && funcStart < i) {
        for (const pat of controlFlowPatterns) {
          if (pat.test(line)) funcComplexity++
        }
        if (/^\s*elif\b|^\s*else\b|^\s*except\b|^\s*finally\b/.test(line) && level > funcNesting) {
          funcNesting = level
        }
      }
    } else {
      for (const pat of funcPatterns[lang]) {
        const m = line.match(pat)
        if (m) {
          if (funcStart >= 0 && braceDepth <= 1) {
            functions.push({
              name: funcName,
              lineStart: funcStart + 1,
              lineEnd: i,
              length: i - funcStart,
              complexity: funcComplexity,
              nestingDepth: funcNesting,
            })
          }
          funcStart = i
          funcName = m[1] || 'anonymous'
          funcComplexity = 1
          funcNesting = 0
          braceDepth = 0
          break
        }
      }

      const opens = (line.match(/\{/g) || []).length
      const closes = (line.match(/\}/g) || []).length
      braceDepth += opens - closes

      if (opens > 0 && braceDepth > nestingDepth) nestingDepth = braceDepth
      if (funcStart >= 0) {
        if (opens > 0 && braceDepth > funcNesting) funcNesting = braceDepth
        for (const pat of controlFlowPatterns) {
          if (pat.test(line)) {
            cyclomaticComplexity++
            funcComplexity++
          }
        }
        if (closes > 0 && braceDepth <= 0) {
          functions.push({
            name: funcName,
            lineStart: funcStart + 1,
            lineEnd: i + 1,
            length: i - funcStart + 1,
            complexity: funcComplexity,
            nestingDepth: funcNesting,
          })
          funcStart = -1
          funcName = ''
        }
      } else {
        for (const pat of controlFlowPatterns) {
          if (pat.test(line)) cyclomaticComplexity++
        }
      }
    }
  }

  if (funcStart >= 0) {
    functions.push({
      name: funcName,
      lineStart: funcStart + 1,
      lineEnd: lines.length,
      length: lines.length - funcStart,
      complexity: funcComplexity,
      nestingDepth: funcNesting,
    })
  }

  const maxComplexity = functions.length > 0 ? Math.max(...functions.map(f => f.complexity)) : cyclomaticComplexity
  const avgComplexity = functions.length > 0
    ? Math.round((functions.reduce((s, f) => s + f.complexity, 0) / functions.length) * 10) / 10
    : cyclomaticComplexity

  return {
    cyclomaticComplexity,
    nestingDepth,
    functionLength: functions.length > 0 ? Math.max(...functions.map(f => f.length)) : 0,
    totalFunctions: functions.length,
    maxComplexity,
    avgComplexity,
    functions: functions.sort((a, b) => b.complexity - a.complexity),
  }
}

function analyzeDocQuality(code: string, lang: Language): DocQualityResult {
  const lines = code.split('\n')
  const totalLines = lines.length
  let commentLines = 0
  let jsdocCount = 0
  const undocumentedFunctions: string[] = []
  const qualityIssues: DocIssue[] = []

  const commentPatterns: Record<Language, RegExp[]> = {
    javascript: [/^\s*\/\//, /^\s*\/\*/, /^\s*\*\//, /^\s*\*\s/],
    typescript: [/^\s*\/\//, /^\s*\/\*/, /^\s*\*\//, /^\s*\*\s/],
    python: [/^\s*#/],
    java: [/^\s*\/\//, /^\s*\/\*/, /^\s*\*\//, /^\s*\*\s/],
  }

  const jsdocPatterns: Record<Language, RegExp> = {
    javascript: /^\s*\/\*\*/,
    typescript: /^\s*\/\*\*/,
    python: /^\s*""".*"""|^\s*'''.*'''|^\s*"""$|^\s*'''$/,
    java: /^\s*\/\*\*/,
  }

  const funcLinePatterns: Record<Language, RegExp[]> = {
    javascript: [
      /function\s+(\w+)\s*\(/,
      /(?:const|let|var)\s+(\w+)\s*=\s*(?:async\s+)?[(](\w+)[)]/,
    ],
    typescript: [
      /function\s+(\w+)\s*\(/,
      /(?:const|let|var)\s+(\w+)\s*[:=]\s*(?:async\s+)?[(](\w+)[)]/,
    ],
    python: [/^\s*def\s+(\w+)\s*\(/],
    java: [
      /(?:public|private|protected|static|\s)+(?:[\w<>\[\]]+)\s+(\w+)\s*\(/,
      /(?:public|private|protected|static|\s)+void\s+(\w+)\s*\(/,
    ],
  }

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i]
    const trimmed = line.trim()
    if (!trimmed) continue

    const isComment = commentPatterns[lang].some(p => p.test(line))
    const isJsdoc = jsdocPatterns[lang].test(line)

    if (isComment) {
      commentLines++
      if (isJsdoc) jsdocCount++

      if (/TODO|FIXME|HACK|XXX/.test(trimmed)) {
        qualityIssues.push({
          line: i + 1,
          type: 'todo-fixme',
          message: '存在 TODO/FIXME/HACK 待办注释',
          severity: 'low',
        })
      }
    }

    for (const pat of funcLinePatterns[lang]) {
      const m = line.match(pat)
      if (m) {
        const funcName = m[1] || 'anonymous'
        const hasJsdocPrev = jsdocPatterns[lang].test(lines[i - 1] || '')
        const hasCommentPrev = commentPatterns[lang].some(p => p.test(lines[i - 1] || ''))
        const prevIsEmpty = !(lines[i - 1] || '').trim()

        if (!hasJsdocPrev && !hasCommentPrev) {
          if (prevIsEmpty && i >= 2) {
            const hasCommentBehind = commentPatterns[lang].some(p =>
              lines.slice(Math.max(0, i - 3), i).some(l => p.test(l))
            )
            if (!hasCommentBehind) {
              undocumentedFunctions.push(funcName)
              qualityIssues.push({
                line: i + 1,
                type: 'missing-jsdoc',
                message: `函数 "${funcName}" 缺少文档注释/JSDoc`,
                severity: 'medium',
              })
            }
          } else if (!prevIsEmpty && !hasCommentPrev) {
            undocumentedFunctions.push(funcName)
            qualityIssues.push({
              line: i + 1,
              type: 'missing-jsdoc',
              message: `函数 "${funcName}" 缺少文档注释/JSDoc`,
              severity: 'medium',
            })
          }
        }
        break
      }
    }
  }

  const commentCoverage = totalLines > 0 ? Math.round((commentLines / totalLines) * 100) : 0

  if (commentCoverage < 10 && totalLines > 20) {
    qualityIssues.push({
      line: 1,
      type: 'low-coverage',
      message: `注释覆盖率仅 ${commentCoverage}%，建议至少达到 20%`,
      severity: 'high',
    })
  } else if (commentCoverage < 20 && totalLines > 50) {
    qualityIssues.push({
      line: 1,
      type: 'low-coverage',
      message: `注释覆盖率 ${commentCoverage}%，低于推荐的 20%`,
      severity: 'medium',
    })
  }

  return {
    commentCoverage,
    totalLines,
    commentLines,
    jsdocCount,
    undocumentedFunctions,
    qualityIssues,
  }
}

function detectDuplicates(code: string, lang: Language): DuplicateBlock[] {
  const lines = code.split('\n')
  const blocks: Map<string, DuplicateBlock> = new Map()
  const minBlockSize = 3

  const normalize = (s: string) => s.trim().replace(/\s+/g, ' ')

  const isSignificantLine = (line: string) => {
    const t = line.trim()
    if (!t) return false
    if (lang === 'python') return /^\s*(def |class |import |from |if |for |while |try|except|with )/.test(line) || /[=+\-*/]/.test(t)
    return /[=+\-*/({[\w]/.test(t) && !/^\/\//.test(t) && !/^\s*#/.test(t) && !/^\s*\/\*/.test(t)
  }

  for (let size = minBlockSize; size <= 5; size++) {
    for (let i = 0; i <= lines.length - size; i++) {
      const blockLines = lines.slice(i, i + size)
      if (!blockLines.every(isSignificantLine)) continue
      const key = blockLines.map(normalize).join('||')
      if (key.split('||').some(k => k.length < 6)) continue

      if (!blocks.has(key)) {
        blocks.set(key, {
          id: uid(),
          pattern: blockLines.map(l => l.trim().slice(0, 60)).join(' / '),
          occurrences: [],
          similarity: 100,
        })
      }
      const block = blocks.get(key)!
      block.occurrences.push({
        line: i + 1,
        snippet: blockLines.map(l => l.trim().slice(0, 80)).join('\n'),
      })
    }
  }

  const result: DuplicateBlock[] = []
  const seenKeys = new Set<string>()

  for (const [, block] of blocks) {
    if (block.occurrences.length < 2) continue
    const linesKey = block.occurrences.map(o => o.line).sort((a, b) => a - b).join(',')
    if (seenKeys.has(linesKey)) continue

    const isSubset = result.some(r =>
      r.occurrences.every(occ =>
        block.occurrences.some(bo => Math.abs(bo.line - occ.line) < 2)
      )
    )
    if (isSubset) continue

    seenKeys.add(linesKey)
    result.push(block)
  }

  return result.sort((a, b) => b.occurrences.length - a.occurrences.length).slice(0, 8)
}

function generateSuggestions(
  lang: Language,
  complexity: ComplexityResult,
  docQuality: DocQualityResult,
  duplicates: DuplicateBlock[],
): string[] {
  const suggestions: string[] = []

  if (complexity.maxComplexity > 15) {
    suggestions.push(`🔴 圈复杂度过高（最高 ${complexity.maxComplexity}）：建议将大函数拆分为多个职责单一的小函数，使用策略模式或表驱动替代复杂的 if-else 分支`)
  } else if (complexity.maxComplexity > 10) {
    suggestions.push(`🟡 圈复杂度偏高（最高 ${complexity.maxComplexity}）：考虑将条件分支拆分为独立函数，使用卫语句（guard clause）减少嵌套`)
  }

  if (complexity.nestingDepth > 4) {
    suggestions.push(`🔴 嵌套层级过深（${complexity.nestingDepth} 层）：建议使用提前返回模式、提取内层逻辑为独立函数，将嵌套层级控制在 3 层以内`)
  } else if (complexity.nestingDepth > 3) {
    suggestions.push(`🟡 嵌套层级偏深（${complexity.nestingDepth} 层）：考虑提取嵌套逻辑为独立函数或使用卫语句模式减少嵌套`)
  }

  const longFuncs = complexity.functions.filter(f => f.length > 50)
  if (longFuncs.length > 0) {
    suggestions.push(`🔴 有 ${longFuncs.length} 个函数超过 50 行（最长 ${complexity.functionLength} 行）：按单一职责原则拆分为多个小函数，每个函数建议 10-30 行`)
  } else if (complexity.functionLength > 30) {
    suggestions.push(`🟡 最长函数 ${complexity.functionLength} 行：可考虑拆分为更小的函数以提高可读性和可维护性`)
  }

  if (docQuality.commentCoverage < 10 && docQuality.totalLines > 20) {
    suggestions.push(`🔴 注释覆盖率仅 ${docQuality.commentCoverage}%：建议添加函数文档、算法说明和关键逻辑注释，目标覆盖率 ≥ 20%`)
  } else if (docQuality.commentCoverage < 20 && docQuality.totalLines > 50) {
    suggestions.push(`🟡 注释覆盖率 ${docQuality.commentCoverage}%：在函数定义、复杂逻辑处添加注释说明意图，推荐覆盖率 ≥ 20%`)
  } else if (docQuality.commentCoverage >= 30) {
    suggestions.push(`🟢 注释覆盖率 ${docQuality.commentCoverage}%，表现优秀！继续保持良好的文档习惯`)
  }

  if (docQuality.undocumentedFunctions.length > 0) {
    const preview = docQuality.undocumentedFunctions.slice(0, 3).join('、')
    const more = docQuality.undocumentedFunctions.length > 3 ? ` 等 ${docQuality.undocumentedFunctions.length} 个` : ''
    suggestions.push(`🟡 以下函数缺少文档注释：${preview}${more}。建议为公开/复杂函数添加 JSDoc 或文档字符串`)
  }

  if (lang === 'javascript' || lang === 'typescript') {
    if (docQuality.jsdocCount === 0 && complexity.totalFunctions > 3) {
      suggestions.push(`🟡 未检测到 JSDoc 注释：为公开函数添加 @param、@returns、@example 等 JSDoc 标签可大幅提升 IDE 智能提示`)
    }
  } else if (lang === 'python') {
    if (docQuality.jsdocCount === 0 && complexity.totalFunctions > 3) {
      suggestions.push(`🟡 未检测到文档字符串（docstring）：为函数/类添加三引号文档字符串可自动生成 API 文档`)
    }
  }

  if (duplicates.length > 0) {
    suggestions.push(`🔴 检测到 ${duplicates.length} 组重复代码：共 ${duplicates.reduce((s, d) => s + d.occurrences.length, 0)} 处重复。建议提取为公共函数/工具方法，遵循 DRY 原则`)
  }

  if (suggestions.length === 0) {
    suggestions.push(`🟢 代码质量优秀！复杂度、文档、重复率均在合理范围内。继续保持良好的编码习惯`)
  }

  return suggestions
}

function computeScore(
  complexity: ComplexityResult,
  docQuality: DocQualityResult,
  duplicates: DuplicateBlock[],
): number {
  let score = 100

  if (complexity.maxComplexity > 20) score -= 25
  else if (complexity.maxComplexity > 15) score -= 18
  else if (complexity.maxComplexity > 10) score -= 10
  else if (complexity.maxComplexity > 5) score -= 5

  if (complexity.nestingDepth > 5) score -= 15
  else if (complexity.nestingDepth > 4) score -= 10
  else if (complexity.nestingDepth > 3) score -= 5

  if (complexity.functionLength > 100) score -= 12
  else if (complexity.functionLength > 50) score -= 8
  else if (complexity.functionLength > 30) score -= 3

  if (docQuality.commentCoverage < 5) score -= 15
  else if (docQuality.commentCoverage < 10) score -= 10
  else if (docQuality.commentCoverage < 20) score -= 5

  if (docQuality.undocumentedFunctions.length > 5) score -= 8
  else if (docQuality.undocumentedFunctions.length > 2) score -= 4

  const dupPenalty = duplicates.reduce((s, d) => s + (d.occurrences.length - 1) * 3, 0)
  score -= Math.min(dupPenalty, 15)

  return Math.max(0, Math.min(100, score))
}

function getGrade(score: number): string {
  if (score >= 90) return 'S'
  if (score >= 80) return 'A'
  if (score >= 70) return 'B'
  if (score >= 60) return 'C'
  if (score >= 50) return 'D'
  return 'F'
}

function generateMarkdownReport(
  lang: Language,
  code: string,
  report: AnalysisReport,
): string {
  const c = report.complexity
  const d = report.docQuality
  const md = report.duplicates
  const codePreview = code.length > 200 ? code.slice(0, 200) + '...' : code

  let output = '# AI 文档分析报告\n\n'
  output += `**生成时间：** ${new Date().toLocaleString('zh-CN')}  \n`
  output += `**检测语言：** ${LANG_META[lang].label}  \n`
  output += `**代码行数：** ${d.totalLines}  \n\n`
  output += '## 代码摘要\n\n```\n' + codePreview + '\n```\n\n'

  output += '## 总体评分\n\n'
  const barLen = 20
  const filled = Math.round(report.overallScore / 100 * barLen)
  output += `**代码质量：${report.overallScore} / 100（等级 ${report.grade}）**  \n`
  output += `[${'█'.repeat(filled)}${'░'.repeat(barLen - filled)}]\n\n`

  output += '## 一、代码复杂度评估\n\n'
  output += '| 指标 | 值 | 评估 |\n|---|---|---|\n'
  output += `| 圈复杂度 | ${c.cyclomaticComplexity} | ${c.maxComplexity > 15 ? '⚠️ 过高' : c.maxComplexity > 10 ? '⚡ 偏高' : '✅ 良好'} |\n`
  output += `| 最大圈复杂度 | ${c.maxComplexity} | ${c.maxComplexity > 15 ? '⚠️ 过高' : c.maxComplexity > 10 ? '⚡ 偏高' : '✅ 良好'} |\n`
  output += `| 平均圈复杂度 | ${c.avgComplexity} | - |\n`
  output += `| 最大嵌套深度 | ${c.nestingDepth} | ${c.nestingDepth > 4 ? '⚠️ 过深' : c.nestingDepth > 3 ? '⚡ 偏深' : '✅ 良好'} |\n`
  output += `| 函数总数 | ${c.totalFunctions} | - |\n`
  output += `| 最长函数行数 | ${c.functionLength} | ${c.functionLength > 50 ? '⚠️ 过长' : c.functionLength > 30 ? '⚡ 偏长' : '✅ 良好'} |\n\n`

  if (c.functions.length > 0) {
    output += '### 函数复杂度排行（Top 5）\n\n'
    output += '| 函数 | 行号 | 行数 | 复杂度 | 嵌套 |\n|---|---|---|---|---|\n'
    c.functions.slice(0, 5).forEach(f => {
      output += `| ${f.name} | L${f.lineStart}-L${f.lineEnd} | ${f.length} | ${f.complexity} | ${f.nestingDepth} |\n`
    })
    output += '\n'
  }

  output += '## 二、文档质量检查\n\n'
  output += '| 指标 | 值 |\n|---|---|\n'
  output += `| 注释覆盖率 | ${d.commentCoverage}% |\n`
  output += `| 注释行数 | ${d.commentLines} / ${d.totalLines} |\n`
  output += `| JSDoc/文档字符串数 | ${d.jsdocCount} |\n`
  output += `| 缺少文档的函数 | ${d.undocumentedFunctions.length} |\n\n`

  if (d.undocumentedFunctions.length > 0) {
    output += '### 缺少文档的函数\n\n'
    d.undocumentedFunctions.slice(0, 10).forEach(name => {
      output += `- \`${name}\`\n`
    })
    if (d.undocumentedFunctions.length > 10) {
      output += `- ... 等共 ${d.undocumentedFunctions.length} 个\n`
    }
    output += '\n'
  }

  if (d.qualityIssues.length > 0) {
    output += '### 文档质量问题\n\n'
    d.qualityIssues.forEach(issue => {
      const icon = issue.severity === 'high' ? '🔴' : issue.severity === 'medium' ? '🟡' : '🟢'
      output += `- ${icon} **L${issue.line}**: ${issue.message}\n`
    })
    output += '\n'
  }

  output += '## 三、重复代码检测\n\n'
  if (md.length > 0) {
    output += `检测到 **${md.length}** 组重复代码：\n\n`
    md.forEach((block, i) => {
      output += `### 重复组 ${i + 1}\n\n`
      output += `- 出现次数：${block.occurrences.length}\n`
      output += `- 出现位置：${block.occurrences.map(o => `L${o.line}`).join(', ')}\n`
      output += '```\n' + block.occurrences[0].snippet.split('\n').slice(0, 3).join('\n') + '\n```\n\n'
    })
  } else {
    output += '✅ 未检测到明显的重复代码块\n\n'
  }

  output += '## 四、改进建议\n\n'
  report.suggestions.forEach((s, i) => {
    output += `${i + 1}. ${s}\n`
  })
  output += '\n'

  output += '---\n'
  output += '*报告由 AIDocAnalyzer 自动生成 · 纯前端本地分析 · 数据安全无泄露*\n'

  return output
}

const SAMPLE_CODES: Record<Language, { name: string; code: string }> = {
  javascript: {
    name: 'JavaScript 示例',
    code: `// 用户数据处理模块
// TODO: 添加输入验证
const MAX_RETRIES = 3;
const DEFAULT_TIMEOUT = 5000;

function processUserData(users) {
  var result = [];
  for (var i = 0; i < users.length; i++) {
    for (var j = 0; j < users.length; j++) {
      if (users[i].id === users[j].managerId) {
        var el = document.getElementById("user-" + users[i].id);
        el.innerHTML = "<div>" + users[i].name + "</div>";
      }
    }
    document.getElementById("count-" + i).textContent = result.length;
  }
  if (users.length > 0) {
    if (users[0].role) {
      if (users[0].role === "admin") {
        if (users[0].active) {
          if (users[0].verified) {
            console.log("Super admin found:", users[0]);
          }
        }
      }
    }
  }
  return result;
}

function calculateScore(data) {
  var score = 0;
  if (data.type === "premium") { score += 100; }
  if (data.type === "basic") { score += 50; }
  if (data.active) { score += 20; }
  if (data.verified) { score += 30; }
  return score;
}

function formatDate(d) {
  var year = d.getFullYear();
  var month = d.getMonth() + 1;
  var day = d.getDate();
  return year + "-" + month + "-" + day;
}

function formatDateAlt(d) {
  var year = d.getFullYear();
  var month = d.getMonth() + 1;
  var day = d.getDate();
  return year + "/" + month + "/" + day;
}
`,
  },
  typescript: {
    name: 'TypeScript 示例',
    code: `import * as _ from 'lodash';

const SECRET_TOKEN = "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...";

export interface UserData {
  id: number;
  user_name: string;
  is_Active: boolean;
}

export class UserService {
  private apiUrl: string = "http://api.example.com";
  private cache: any = {};

  GetUser(id: number): UserData | null {
    let result = null;
    if (id > 0) {
      if (this.cache[id]) {
        result = this.cache[id];
      } else {
        if (id < 1000) {
          if (this.apiUrl) {
            try {
              const xhr = new XMLHttpRequest();
              xhr.open("GET", this.apiUrl + "/user/" + id, false);
              xhr.send();
              result = JSON.parse(xhr.responseText);
              document.getElementById('user-card')!.innerHTML = "<b>" + result.user_name + "</b>";
            } catch(err) {
            }
          }
        }
      }
    }
    return result;
  }

  ProcessAll(list: UserData[]) {
    for (let i = 0; i < list.length; i++) {
      document.getElementById("row-" + i)!.style.color = "#ff0000";
      document.getElementById("row-" + i)!.style.fontSize = "14px";
    }
    return 7;
  }
}
`,
  },
  python: {
    name: 'Python 示例',
    code: `import os
import random

API_PASSWORD = "MySecurePass123!"

def get_user_data(user_id, user_name):
    sql = "SELECT * FROM users WHERE id = " + str(user_id)
    result = []
    if user_id > 0:
        if user_name:
            if len(user_name) > 3:
                if user_name.isalnum():
                    if '@' in user_name:
                        for i in range(100):
                            for j in range(100):
                                random.random()
    return result

def process_users(user_list):
    result = {}
    for user_a in user_list:
        for user_b in user_list:
            if user_a["id"] == user_b["manager_id"]:
                user_a["token"] = "sk-test-" + str(random.randint(1000, 9999))
    return result

def process_users_v2(user_list):
    result = {}
    for user in user_list:
        result[user["id"]] = user["name"]
    return result

class UserDataManager:
    def __init__(self):
        self.cache = {}

    def save_user(self, user_data):
        sql = f"INSERT INTO users VALUES ({user_data['id']})"
        return True

def handle_request(req):
    import math
    return 3.1415926
`,
  },
  java: {
    name: 'Java 示例',
    code: `package com.example.service;

public class UserService {
    private String apiUrl = "http://api.example.com";
    private Map<String, Object> cache = new HashMap<>();

    public UserData getUser(int id) {
        UserData result = null;
        if (id > 0) {
            if (cache.containsKey(id)) {
                result = (UserData) cache.get(id);
            } else {
                if (id < 1000) {
                    if (apiUrl != null) {
                        try {
                            URL url = new URL(apiUrl + "/user/" + id);
                            HttpURLConnection conn = (HttpURLConnection) url.openConnection();
                            conn.setRequestMethod("GET");
                            BufferedReader br = new BufferedReader(new InputStreamReader(conn.getInputStream()));
                            String line;
                            StringBuilder sb = new StringBuilder();
                            while ((line = br.readLine()) != null) {
                                sb.append(line);
                            }
                            result = JSON.parseObject(sb.toString(), UserData.class);
                        } catch (Exception e) {
                        }
                    }
                }
            }
        }
        return result;
    }

    public void processAll(List<UserData> list) {
        for (int i = 0; i < list.size(); i++) {
            System.out.println("Processing: " + list.get(i).getName());
        }
    }

    private String formatDate(Date d) {
        Calendar cal = Calendar.getInstance();
        cal.setTime(d);
        return cal.get(Calendar.YEAR) + "-" + (cal.get(Calendar.MONTH) + 1);
    }

    private String formatDateAlt(Date d) {
        SimpleDateFormat sdf = new SimpleDateFormat("yyyy/MM/dd");
        return sdf.format(d);
    }
}
`,
  },
}

export default function AIDocAnalyzer() {
  const [code, setCode] = useState<string>(SAMPLE_CODES.javascript.code)
  const [language, setLanguage] = useState<Language>('javascript')
  const [theme, setTheme] = useState<Theme>('dark')
  const [report, setReport] = useState<AnalysisReport | null>(null)
  const [analyzing, setAnalyzing] = useState(false)
  const [expandedFunc, setExpandedFunc] = useState<string | null>(null)
  const [expandedDup, setExpandedDup] = useState<string | null>(null)
  const [copied, setCopied] = useState(false)
  const [showSamples, setShowSamples] = useState(false)
  const [autoDetect, setAutoDetect] = useState(true)
  const [activeTab, setActiveTab] = useState<'complexity' | 'doc' | 'duplicates' | 'suggestions'>('complexity')
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  useEffect(() => {
    if (autoDetect && code.trim()) {
      const detected = detectLanguage(code)
      setLanguage(detected)
    }
  }, [code, autoDetect])

  const runAnalysis = useCallback(() => {
    if (!code.trim()) return
    setAnalyzing(true)
    setTimeout(() => {
      const l = autoDetect ? detectLanguage(code) : language
      if (autoDetect) setLanguage(l)
      const complexity = analyzeComplexity(code, l)
      const docQuality = analyzeDocQuality(code, l)
      const duplicates = detectDuplicates(code, l)
      const overallScore = computeScore(complexity, docQuality, duplicates)
      const grade = getGrade(overallScore)
      const suggestions = generateSuggestions(l, complexity, docQuality, duplicates)
      setReport({ complexity, docQuality, duplicates, overallScore, grade, suggestions })
      setAnalyzing(false)
    }, 100)
  }, [code, language, autoDetect])

  useEffect(() => {
    runAnalysis()
  }, [])

  const markdownReport = useMemo(() => {
    if (!report) return ''
    return generateMarkdownReport(language, code, report)
  }, [report, language, code])

  const copyReport = async () => {
    try {
      await navigator.clipboard.writeText(markdownReport)
      setCopied(true)
      setTimeout(() => setCopied(false), 1500)
    } catch {}
  }

  const downloadMarkdown = () => {
    if (!report) return
    const md = generateMarkdownReport(language, code, report)
    const blob = new Blob([md], { type: 'text/markdown;charset=utf-8' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `ai-doc-analysis-${Date.now()}.md`
    a.click()
    URL.revokeObjectURL(url)
  }

  const loadSample = (lang: Language) => {
    setCode(SAMPLE_CODES[lang].code)
    setLanguage(lang)
    setAutoDetect(false)
    setShowSamples(false)
  }

  const scoreColor = (() => {
    if (!report) return '#6366f1'
    const s = report.overallScore
    if (s >= 85) return '#10b981'
    if (s >= 65) return '#eab308'
    if (s >= 40) return '#f97316'
    return '#ef4444'
  })()

  const isDark = theme === 'dark'

  const colors = isDark
    ? {
        bg: 'linear-gradient(135deg, #0f0f23 0%, #151533 50%, #0f1830 100%)',
        text: '#e8e8ff',
        textSecondary: '#8080b0',
        glass: 'rgba(255,255,255,0.04)',
        glassBorder: 'rgba(255,255,255,0.08)',
        glassStrong: 'rgba(255,255,255,0.06)',
        headerGrad: 'linear-gradient(90deg, rgba(99,102,241,0.15), rgba(14,165,233,0.1))',
        accent: '#818cf8',
        accent2: '#22d3ee',
        codeBg: 'linear-gradient(180deg, #0a0a18, #0d0d20)',
        codeText: '#d4d4ff',
        green: '#10b981',
        yellow: '#eab308',
        red: '#ef4444',
        orange: '#f97316',
        blue: '#3b82f6',
        purple: '#8b5cf6',
      }
    : {
        bg: 'linear-gradient(135deg, #f5f7fa 0%, #e8ecf3 50%, #f0f4f8 100%)',
        text: '#1e293b',
        textSecondary: '#64748b',
        glass: 'rgba(255,255,255,0.6)',
        glassBorder: 'rgba(255,255,255,0.8)',
        glassStrong: 'rgba(255,255,255,0.8)',
        headerGrad: 'linear-gradient(90deg, rgba(99,102,241,0.1), rgba(14,165,233,0.08))',
        accent: '#6366f1',
        accent2: '#0ea5e9',
        codeBg: 'linear-gradient(180deg, #ffffff, #f8fafc)',
        codeText: '#334155',
        green: '#059669',
        yellow: '#d97706',
        red: '#dc2626',
        orange: '#ea580c',
        blue: '#2563eb',
        purple: '#7c3aed',
      }

  return (
    <div className="w-full h-full flex flex-col overflow-hidden" style={{
      background: colors.bg,
      fontFamily: "-apple-system, BlinkMacSystemFont, 'Noto Sans SC', 'PingFang SC', sans-serif",
      color: colors.text,
    }}>
      {/* Header */}
      <div className="flex items-center justify-between px-5 py-3 flex-shrink-0" style={{
        background: colors.headerGrad,
        borderBottom: `1px solid ${colors.glassBorder}`,
        backdropFilter: 'blur(10px)',
      }}>
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{
            background: 'linear-gradient(135deg, #6366f1, #0ea5e9)',
            boxShadow: '0 4px 20px rgba(99,102,241,0.35)',
          }}>
            <FileText size={20} color="#fff" />
          </div>
          <div>
            <div className="text-base font-bold" style={{
              background: 'linear-gradient(135deg, #818cf8, #22d3ee)',
              WebkitBackgroundClip: 'text',
              backgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
            }}>
              AIDocAnalyzer · AI 文档分析工具
            </div>
            <div className="text-[11px]" style={{ color: colors.textSecondary }}>
              复杂度评估 · 文档质量检查 · 重复代码检测 · 一键改进建议
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setTheme(isDark ? 'light' : 'dark')}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs transition-all hover:opacity-90"
            style={{
              background: colors.glass,
              color: colors.textSecondary,
              border: `1px solid ${colors.glassBorder}`,
            }}
          >
            {isDark ? '🌙' : '☀️'} {isDark ? '深色' : '浅色'}
          </button>
          <button
            onClick={() => setShowSamples(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs transition-all hover:opacity-90"
            style={{
              background: colors.glass,
              color: colors.textSecondary,
              border: `1px solid ${colors.glassBorder}`,
            }}
          >
            <ListChecks size={12} /> 示例
          </button>
          <button
            onClick={runAnalysis}
            disabled={analyzing}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs transition-all hover:opacity-90"
            style={{
              background: analyzing ? '#95a5a6' : 'linear-gradient(135deg, #6366f1, #0ea5e9)',
              color: '#fff',
              border: 'none',
              boxShadow: '0 2px 12px rgba(99,102,241,0.3)',
              cursor: analyzing ? 'not-allowed' : 'pointer',
            }}
          >
            {analyzing ? <RefreshCw size={12} style={{ animation: 'spin 1s linear infinite' }} /> : <Sparkles size={12} />}
            {analyzing ? '分析中...' : '开始分析'}
          </button>
          {report && (
            <>
              <button
                onClick={copyReport}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs transition-all hover:opacity-90"
                style={{
                  background: colors.glass,
                  color: colors.textSecondary,
                  border: `1px solid ${colors.glassBorder}`,
                }}
              >
                {copied ? <Check size={12} /> : <Copy size={12} />}
                {copied ? '已复制' : '复制MD'}
              </button>
              <button
                onClick={downloadMarkdown}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs transition-all hover:opacity-90"
                style={{
                  background: 'rgba(16,185,129,0.1)',
                  color: colors.green,
                  border: '1px solid rgba(16,185,129,0.3)',
                }}
              >
                <Download size={12} /> 导出MD
              </button>
            </>
          )}
        </div>
      </div>

      {/* Main content */}
      <div className="flex-1 flex overflow-hidden min-h-0">
        {/* Left: Code Editor */}
        <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
          <div className="flex items-center justify-between px-4 py-2" style={{ borderBottom: `1px solid ${colors.glassBorder}` }}>
            <div className="flex items-center gap-2">
              <Code2 size={14} style={{ color: colors.accent }} />
              <span className="text-sm font-semibold" style={{ color: colors.text }}>代码编辑器</span>
              <select
                value={language}
                onChange={e => { setLanguage(e.target.value as Language); setAutoDetect(false) }}
                className="text-[11px] px-2 py-1 rounded-md outline-none"
                style={{
                  background: isDark ? 'rgba(0,0,0,0.3)' : 'rgba(255,255,255,0.6)',
                  border: `1px solid ${colors.glassBorder}`,
                  color: colors.accent,
                }}
              >
                {(Object.keys(LANG_META) as Language[]).map(l => (
                  <option key={l} value={l}>{LANG_META[l].label}</option>
                ))}
              </select>
              <label className="flex items-center gap-1 text-[11px] cursor-pointer" style={{ color: colors.textSecondary }}>
                <input
                  type="checkbox"
                  checked={autoDetect}
                  onChange={e => setAutoDetect(e.target.checked)}
                  style={{ accentColor: colors.accent }}
                />
                自动检测
              </label>
              <span className="text-[10px] px-2 py-0.5 rounded" style={{ background: colors.glass, color: colors.textSecondary }}>
                {code.split('\n').length} 行
              </span>
            </div>
            <div className="flex items-center gap-1.5">
              <button
                onClick={() => { setCode(''); setReport(null) }}
                className="flex items-center gap-1 text-[11px] px-2.5 py-1 rounded transition-all hover:opacity-90"
                style={{
                  background: 'rgba(239,68,68,0.08)',
                  color: colors.red,
                  border: '1px solid rgba(239,68,68,0.2)',
                }}
              >
                <X size={11} /> 清空
              </button>
            </div>
          </div>
          <div className="flex-1 flex min-h-0 overflow-hidden" style={{ background: colors.codeBg }}>
            <textarea
              ref={textareaRef}
              value={code}
              onChange={e => setCode(e.target.value)}
              spellCheck={false}
              placeholder={`粘贴 ${LANG_META[language].label} 代码或加载示例开始分析...\n支持自动检测语言，纯前端本地分析，数据安全无泄露`}
              className="flex-1 p-4 outline-none resize-none font-mono"
              style={{
                fontSize: 13,
                lineHeight: '20px',
                tabSize: 2,
                background: 'transparent',
                color: colors.codeText,
                caretColor: colors.accent,
              }}
            />
          </div>
        </div>

        {/* Right: Analysis Panel */}
        <div className="flex flex-col flex-shrink-0 overflow-hidden" style={{ width: 480, borderLeft: `1px solid ${colors.glassBorder}` }}>
          {!report ? (
            <div className="flex-1 flex flex-col items-center justify-center p-8" style={{ color: colors.textSecondary }}>
              <div className="w-20 h-20 rounded-2xl flex items-center justify-center mb-4" style={{
                background: `linear-gradient(135deg, ${colors.glassStrong}, ${colors.glass})`,
                border: `1px solid ${colors.glassBorder}`,
              }}>
                <Gauge size={36} style={{ color: colors.accent }} />
              </div>
              <div className="text-sm font-semibold" style={{ color: colors.text }}>等待分析</div>
              <div className="text-[12px] mt-2 text-center max-w-[260px]">
                在左侧输入代码，点击"开始分析"按钮即可获取复杂度评估、文档质量检查和重复代码检测结果
              </div>
              <button
                onClick={() => setShowSamples(true)}
                className="mt-4 flex items-center gap-1.5 px-4 py-2 rounded-lg text-xs transition-all hover:opacity-90"
                style={{
                  background: `linear-gradient(135deg, ${colors.accent}, ${colors.accent2})`,
                  color: '#fff',
                  boxShadow: '0 2px 12px rgba(99,102,241,0.25)',
                }}
              >
                <ListChecks size={12} /> 加载示例代码
              </button>
            </div>
          ) : (
            <>
              {/* Score Header */}
              <div className="p-4 flex-shrink-0" style={{
                background: `linear-gradient(180deg, ${isDark ? 'rgba(99,102,241,0.12)' : 'rgba(99,102,241,0.08)'} , transparent)`,
                borderBottom: `1px solid ${colors.glassBorder}`,
              }}>
                <div className="flex items-start gap-4">
                  <div className="flex-shrink-0 w-20 h-20 rounded-xl flex items-center justify-center relative" style={{
                    background: `conic-gradient(${scoreColor} ${report.overallScore * 3.6}deg, ${isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.05)'} 0)`,
                    boxShadow: `0 0 30px ${scoreColor}25`,
                  }}>
                    <div className="w-[72%] h-[72%] rounded-full flex items-center justify-center" style={{ background: isDark ? '#0f0f23' : '#fff' }}>
                      <div className="text-2xl font-extrabold" style={{ color: scoreColor }}>{report.overallScore}</div>
                    </div>
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-[11px]" style={{ color: colors.textSecondary }}>代码质量评分</div>
                    <div className="text-sm font-bold mt-0.5" style={{ color: scoreColor }}>
                      {report.grade} 级 ·{' '}
                      {report.overallScore >= 85 ? '✨ 优秀' : report.overallScore >= 65 ? '👍 良好' : report.overallScore >= 40 ? '⚠️ 需改进' : '🚨 严重'}
                    </div>
                    <div className="flex gap-2 mt-3">
                      <div className="flex-1 text-center py-1.5 rounded-lg" style={{ background: colors.glass, border: `1px solid ${colors.glassBorder}` }}>
                        <div className="text-lg font-extrabold" style={{ color: colors.accent }}>{report.complexity.totalFunctions}</div>
                        <div className="text-[9px]" style={{ color: colors.textSecondary }}>函数数</div>
                      </div>
                      <div className="flex-1 text-center py-1.5 rounded-lg" style={{ background: colors.glass, border: `1px solid ${colors.glassBorder}` }}>
                        <div className="text-lg font-extrabold" style={{ color: report.complexity.maxComplexity > 15 ? colors.red : report.complexity.maxComplexity > 10 ? colors.yellow : colors.green }}>{report.complexity.maxComplexity}</div>
                        <div className="text-[9px]" style={{ color: colors.textSecondary }}>最大复杂度</div>
                      </div>
                      <div className="flex-1 text-center py-1.5 rounded-lg" style={{ background: colors.glass, border: `1px solid ${colors.glassBorder}` }}>
                        <div className="text-lg font-extrabold" style={{ color: colors.green }}>{report.docQuality.commentCoverage}%</div>
                        <div className="text-[9px]" style={{ color: colors.textSecondary }}>注释覆盖</div>
                      </div>
                      <div className="flex-1 text-center py-1.5 rounded-lg" style={{ background: colors.glass, border: `1px solid ${colors.glassBorder}` }}>
                        <div className="text-lg font-extrabold" style={{ color: report.duplicates.length > 0 ? colors.orange : colors.green }}>{report.duplicates.length}</div>
                        <div className="text-[9px]" style={{ color: colors.textSecondary }}>重复组</div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Tabs */}
              <div className="flex flex-shrink-0 px-3 pt-2" style={{ borderBottom: `1px solid ${colors.glassBorder}` }}>
                {([
                  { key: 'complexity', label: '复杂度', color: colors.accent },
                  { key: 'doc', label: '文档质量', color: colors.green },
                  { key: 'duplicates', label: '重复代码', color: colors.orange },
                  { key: 'suggestions', label: '改进建议', color: colors.yellow },
                ] as const).map(tab => (
                  <button
                    key={tab.key}
                    onClick={() => setActiveTab(tab.key)}
                    className="flex items-center gap-1.5 px-3 py-2 text-[11px] font-medium transition-all"
                    style={{
                      color: activeTab === tab.key ? tab.color : colors.textSecondary,
                      borderBottom: activeTab === tab.key ? `2px solid ${tab.color}` : '2px solid transparent',
                    }}
                  >
                    {tab.key === 'complexity' && <Gauge size={12} />}
                    {tab.key === 'doc' && <FileText size={12} />}
                    {tab.key === 'duplicates' && <GitCompare size={12} />}
                    {tab.key === 'suggestions' && <Lightbulb size={12} />}
                    {tab.label}
                  </button>
                ))}
              </div>

              {/* Tab Content */}
              <div className="flex-1 overflow-y-auto p-3 space-y-3" style={{ scrollbarWidth: 'thin' }}>
                {activeTab === 'complexity' && (
                  <>
                    <div className="grid grid-cols-2 gap-3">
                      <div className="rounded-xl p-3" style={{ background: colors.glass, border: `1px solid ${colors.glassBorder}` }}>
                        <div className="flex items-center gap-1.5 text-[11px]" style={{ color: colors.textSecondary }}>
                          <Target size={11} /> 圈复杂度
                        </div>
                        <div className="text-2xl font-extrabold mt-1" style={{ color: report.complexity.maxComplexity > 15 ? colors.red : report.complexity.maxComplexity > 10 ? colors.yellow : colors.green }}>
                          {report.complexity.maxComplexity}
                        </div>
                        <div className="text-[10px] mt-0.5" style={{ color: colors.textSecondary }}>
                          {report.complexity.maxComplexity > 15 ? '⚠️ 过高' : report.complexity.maxComplexity > 10 ? '⚡ 偏高' : '✅ 良好'}
                        </div>
                      </div>
                      <div className="rounded-xl p-3" style={{ background: colors.glass, border: `1px solid ${colors.glassBorder}` }}>
                        <div className="flex items-center gap-1.5 text-[11px]" style={{ color: colors.textSecondary }}>
                          <Layers size={11} /> 嵌套深度
                        </div>
                        <div className="text-2xl font-extrabold mt-1" style={{ color: report.complexity.nestingDepth > 4 ? colors.red : report.complexity.nestingDepth > 3 ? colors.yellow : colors.green }}>
                          {report.complexity.nestingDepth}
                        </div>
                        <div className="text-[10px] mt-0.5" style={{ color: colors.textSecondary }}>
                          {report.complexity.nestingDepth > 4 ? '⚠️ 过深' : report.complexity.nestingDepth > 3 ? '⚡ 偏深' : '✅ 良好'}
                        </div>
                      </div>
                      <div className="rounded-xl p-3" style={{ background: colors.glass, border: `1px solid ${colors.glassBorder}` }}>
                        <div className="flex items-center gap-1.5 text-[11px]" style={{ color: colors.textSecondary }}>
                          <FileCode size={11} /> 最长函数
                        </div>
                        <div className="text-2xl font-extrabold mt-1" style={{ color: report.complexity.functionLength > 50 ? colors.red : report.complexity.functionLength > 30 ? colors.yellow : colors.green }}>
                          {report.complexity.functionLength}<span className="text-sm ml-0.5">行</span>
                        </div>
                        <div className="text-[10px] mt-0.5" style={{ color: colors.textSecondary }}>
                          {report.complexity.functionLength > 50 ? '⚠️ 过长' : report.complexity.functionLength > 30 ? '⚡ 偏长' : '✅ 良好'}
                        </div>
                      </div>
                      <div className="rounded-xl p-3" style={{ background: colors.glass, border: `1px solid ${colors.glassBorder}` }}>
                        <div className="flex items-center gap-1.5 text-[11px]" style={{ color: colors.textSecondary }}>
                          <BarChart3 size={11} /> 平均复杂度
                        </div>
                        <div className="text-2xl font-extrabold mt-1" style={{ color: colors.accent }}>
                          {report.complexity.avgComplexity}
                        </div>
                        <div className="text-[10px] mt-0.5" style={{ color: colors.textSecondary }}>
                          {report.complexity.totalFunctions} 个函数
                        </div>
                      </div>
                    </div>

                    {report.complexity.functions.length > 0 && (
                      <div className="rounded-xl overflow-hidden" style={{ background: colors.glass, border: `1px solid ${colors.glassBorder}` }}>
                        <div className="px-3 py-2 flex items-center justify-between" style={{ borderBottom: `1px solid ${colors.glassBorder}` }}>
                          <span className="text-xs font-semibold" style={{ color: colors.text }}>函数复杂度排行</span>
                          <span className="text-[10px] px-1.5 rounded" style={{ background: colors.glassStrong, color: colors.textSecondary }}>
                            {report.complexity.functions.length} 个
                          </span>
                        </div>
                        <div className="px-2 pb-2 space-y-1" style={{ maxHeight: 280, overflowY: 'auto' }}>
                          {report.complexity.functions.map((f, i) => (
                            <div
                              key={i}
                              className="rounded-lg p-2 cursor-pointer transition-all"
                              style={{ background: colors.glassStrong, border: `1px solid ${colors.glassBorder}` }}
                              onClick={() => setExpandedFunc(expandedFunc === f.name ? null : f.name)}
                            >
                              <div className="flex items-center justify-between">
                                <div className="flex items-center gap-2 min-w-0">
                                  <span className="text-[10px] font-mono px-1 rounded flex-shrink-0" style={{
                                    background: f.complexity > 15 ? colors.red + '30' : f.complexity > 10 ? colors.yellow + '30' : colors.green + '30',
                                    color: f.complexity > 15 ? colors.red : f.complexity > 10 ? colors.yellow : colors.green,
                                  }}>
                                    CC={f.complexity}
                                  </span>
                                  <span className="text-xs font-medium truncate" style={{ color: colors.text }}>{f.name}</span>
                                </div>
                                <div className="flex items-center gap-2 flex-shrink-0">
                                  <span className="text-[10px]" style={{ color: colors.textSecondary }}>{f.length}行</span>
                                  {expandedFunc === f.name ? <ChevronDown size={10} style={{ color: colors.textSecondary }} /> : <ChevronRight size={10} style={{ color: colors.textSecondary }} />}
                                </div>
                              </div>
                              {expandedFunc === f.name && (
                                <div className="mt-2 pt-2 space-y-1.5" style={{ borderTop: `1px dashed ${colors.glassBorder}` }}>
                                  <div className="flex justify-between text-[10px]" style={{ color: colors.textSecondary }}>
                                    <span>位置：L{f.lineStart} - L{f.lineEnd}</span>
                                    <span>嵌套：{f.nestingDepth} 层</span>
                                  </div>
                                  <div className="h-1.5 rounded-full overflow-hidden" style={{ background: colors.glassStrong }}>
                                    <div
                                      style={{
                                        width: `${Math.min(100, (f.complexity / 20) * 100)}%`,
                                        height: '100%',
                                        background: f.complexity > 15 ? colors.red : f.complexity > 10 ? colors.yellow : colors.green,
                                        borderRadius: '999px',
                                      }}
                                    />
                                  </div>
                                </div>
                              )}
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </>
                )}

                {activeTab === 'doc' && (
                  <>
                    <div className="grid grid-cols-2 gap-3">
                      <div className="rounded-xl p-3" style={{ background: colors.glass, border: `1px solid ${colors.glassBorder}` }}>
                        <div className="flex items-center gap-1.5 text-[11px]" style={{ color: colors.textSecondary }}>
                          <FileText size={11} /> 注释覆盖率
                        </div>
                        <div className="text-2xl font-extrabold mt-1" style={{ color: report.docQuality.commentCoverage < 10 ? colors.red : report.docQuality.commentCoverage < 20 ? colors.yellow : colors.green }}>
                          {report.docQuality.commentCoverage}%
                        </div>
                        <div className="text-[10px] mt-0.5" style={{ color: colors.textSecondary }}>
                          {report.docQuality.commentLines} / {report.docQuality.totalLines} 行
                        </div>
                      </div>
                      <div className="rounded-xl p-3" style={{ background: colors.glass, border: `1px solid ${colors.glassBorder}` }}>
                        <div className="flex items-center gap-1.5 text-[11px]" style={{ color: colors.textSecondary }}>
                          <Hash size={11} /> JSDoc 数
                        </div>
                        <div className="text-2xl font-extrabold mt-1" style={{ color: colors.accent }}>
                          {report.docQuality.jsdocCount}
                        </div>
                        <div className="text-[10px] mt-0.5" style={{ color: colors.textSecondary }}>
                          文档注释总数
                        </div>
                      </div>
                      <div className="rounded-xl p-3" style={{ background: colors.glass, border: `1px solid ${colors.glassBorder}` }}>
                        <div className="flex items-center gap-1.5 text-[11px]" style={{ color: colors.textSecondary }}>
                          <AlertTriangle size={11} /> 缺少文档
                        </div>
                        <div className="text-2xl font-extrabold mt-1" style={{ color: report.docQuality.undocumentedFunctions.length > 3 ? colors.red : report.docQuality.undocumentedFunctions.length > 0 ? colors.yellow : colors.green }}>
                          {report.docQuality.undocumentedFunctions.length}
                        </div>
                        <div className="text-[10px] mt-0.5" style={{ color: colors.textSecondary }}>
                          未记录的函数
                        </div>
                      </div>
                      <div className="rounded-xl p-3" style={{ background: colors.glass, border: `1px solid ${colors.glassBorder}` }}>
                        <div className="flex items-center gap-1.5 text-[11px]" style={{ color: colors.textSecondary }}>
                          <Activity size={11} /> 质量问题
                        </div>
                        <div className="text-2xl font-extrabold mt-1" style={{ color: report.docQuality.qualityIssues.length > 3 ? colors.red : report.docQuality.qualityIssues.length > 0 ? colors.yellow : colors.green }}>
                          {report.docQuality.qualityIssues.length}
                        </div>
                        <div className="text-[10px] mt-0.5" style={{ color: colors.textSecondary }}>
                          检测到的问题
                        </div>
                      </div>
                    </div>

                    {/* Progress Bar */}
                    <div className="rounded-xl p-3" style={{ background: colors.glass, border: `1px solid ${colors.glassBorder}` }}>
                      <div className="flex items-center justify-between text-[11px] mb-2" style={{ color: colors.textSecondary }}>
                        <span>注释覆盖率</span>
                        <span style={{ color: report.docQuality.commentCoverage < 10 ? colors.red : report.docQuality.commentCoverage < 20 ? colors.yellow : colors.green }}>
                          {report.docQuality.commentCoverage}%
                        </span>
                      </div>
                      <div className="h-2 rounded-full overflow-hidden" style={{ background: colors.glassStrong }}>
                        <div
                          style={{
                            width: `${Math.min(100, report.docQuality.commentCoverage)}%`,
                            height: '100%',
                            background: `linear-gradient(90deg, ${colors.accent}, ${colors.accent2})`,
                            borderRadius: '999px',
                          }}
                        />
                      </div>
                      <div className="flex justify-between text-[9px] mt-1.5" style={{ color: colors.textSecondary }}>
                        <span>0%</span>
                        <span style={{ color: colors.yellow }}>20% 推荐</span>
                        <span>100%</span>
                      </div>
                    </div>

                    {/* Undocumented Functions */}
                    {report.docQuality.undocumentedFunctions.length > 0 && (
                      <div className="rounded-xl overflow-hidden" style={{ background: colors.glass, border: `1px solid ${colors.glassBorder}` }}>
                        <div className="px-3 py-2" style={{ borderBottom: `1px solid ${colors.glassBorder}` }}>
                          <span className="text-xs font-semibold" style={{ color: colors.text }}>缺少文档的函数</span>
                        </div>
                        <div className="px-3 py-2 space-y-1" style={{ maxHeight: 180, overflowY: 'auto' }}>
                          {report.docQuality.undocumentedFunctions.slice(0, 15).map((name, i) => (
                            <div key={i} className="flex items-center gap-2 text-[11px]" style={{ color: colors.text }}>
                              <span className="w-1.5 h-1.5 rounded-full" style={{ background: colors.yellow }} />
                              <span className="font-mono">{name}</span>
                            </div>
                          ))}
                          {report.docQuality.undocumentedFunctions.length > 15 && (
                            <div className="text-[10px]" style={{ color: colors.textSecondary }}>
                              ... 等共 {report.docQuality.undocumentedFunctions.length} 个
                            </div>
                          )}
                        </div>
                      </div>
                    )}

                    {/* Quality Issues */}
                    {report.docQuality.qualityIssues.length > 0 && (
                      <div className="rounded-xl overflow-hidden" style={{ background: colors.glass, border: `1px solid ${colors.glassBorder}` }}>
                        <div className="px-3 py-2" style={{ borderBottom: `1px solid ${colors.glassBorder}` }}>
                          <span className="text-xs font-semibold" style={{ color: colors.text }}>文档质量问题</span>
                        </div>
                        <div className="px-2 pb-2 space-y-1.5" style={{ maxHeight: 220, overflowY: 'auto' }}>
                          {report.docQuality.qualityIssues.map((issue, i) => (
                            <div
                              key={i}
                              className="rounded-lg p-2"
                              style={{
                                background: colors.glassStrong,
                                borderLeft: `3px solid ${issue.severity === 'high' ? colors.red : issue.severity === 'medium' ? colors.yellow : colors.green}`,
                              }}
                            >
                              <div className="text-[11px] leading-relaxed" style={{ color: colors.text }}>
                                {issue.severity === 'high' ? '🔴' : issue.severity === 'medium' ? '🟡' : '🟢'} L{issue.line}: {issue.message}
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </>
                )}

                {activeTab === 'duplicates' && (
                  <>
                    {report.duplicates.length === 0 ? (
                      <div className="flex flex-col items-center justify-center py-12" style={{ color: colors.textSecondary }}>
                        <div className="w-14 h-14 rounded-xl flex items-center justify-center mb-3" style={{ background: colors.glass, border: `1px solid ${colors.glassBorder}` }}>
                          <GitCompare size={24} style={{ color: colors.green }} />
                        </div>
                        <div className="text-sm font-semibold" style={{ color: colors.green }}>太棒了！</div>
                        <div className="text-[11px] mt-1">未检测到明显的重复代码块</div>
                      </div>
                    ) : (
                      <>
                        <div className="rounded-xl p-3" style={{ background: colors.glass, border: `1px solid ${colors.glassBorder}` }}>
                          <div className="flex items-center justify-between">
                            <div>
                              <div className="text-[11px]" style={{ color: colors.textSecondary }}>检测到重复代码</div>
                              <div className="text-2xl font-extrabold mt-0.5" style={{ color: colors.orange }}>
                                {report.duplicates.length} 组
                              </div>
                            </div>
                            <div className="text-right">
                              <div className="text-[11px]" style={{ color: colors.textSecondary }}>总重复次数</div>
                              <div className="text-2xl font-extrabold mt-0.5" style={{ color: colors.accent }}>
                                {report.duplicates.reduce((s, d) => s + d.occurrences.length, 0)}
                              </div>
                            </div>
                          </div>
                        </div>
                        {report.duplicates.map((block, i) => (
                          <div
                            key={block.id}
                            className="rounded-xl overflow-hidden"
                            style={{ background: colors.glass, border: `1px solid ${colors.glassBorder}` }}
                          >
                            <button
                              onClick={() => setExpandedDup(expandedDup === block.id ? null : block.id)}
                              className="w-full flex items-center justify-between px-3 py-2 text-left"
                            >
                              <div className="flex items-center gap-2">
                                <span className="text-[10px] font-mono px-1.5 py-0.5 rounded" style={{ background: colors.orange + '30', color: colors.orange }}>
                                  #{i + 1}
                                </span>
                                <span className="text-xs font-semibold truncate" style={{ color: colors.text }}>
                                  {block.occurrences.length} 处重复
                                </span>
                              </div>
                              <div className="flex items-center gap-2">
                                <span className="text-[10px]" style={{ color: colors.textSecondary }}>
                                  {block.occurrences.map(o => `L${o.line}`).join(', ')}
                                </span>
                                {expandedDup === block.id ? <ChevronDown size={10} style={{ color: colors.textSecondary }} /> : <ChevronRight size={10} style={{ color: colors.textSecondary }} />}
                              </div>
                            </button>
                            {expandedDup === block.id && (
                              <div className="px-3 pb-2 space-y-2" style={{ borderTop: `1px solid ${colors.glassBorder}` }}>
                                <pre className="text-[10px] p-2 rounded font-mono leading-relaxed" style={{
                                  background: colors.glassStrong,
                                  color: colors.text,
                                  overflow: 'auto',
                                  maxHeight: 150,
                                }}>
                                  {block.occurrences[0].snippet}
                                </pre>
                                <div className="flex flex-wrap gap-1">
                                  {block.occurrences.map((o, j) => (
                                    <span key={j} className="text-[10px] px-1.5 py-0.5 rounded" style={{
                                      background: colors.orange + '20',
                                      color: colors.orange,
                                      border: `1px solid ${colors.orange}40`,
                                    }}>
                                      第 {o.line} 行
                                    </span>
                                  ))}
                                </div>
                              </div>
                            )}
                          </div>
                        ))}
                      </>
                    )}
                  </>
                )}

                {activeTab === 'suggestions' && (
                  <>
                    <div className="rounded-xl p-3" style={{ background: `linear-gradient(135deg, ${colors.glassStrong}, ${colors.glass})`, border: `1px solid ${colors.glassBorder}` }}>
                      <div className="flex items-center gap-2 mb-2">
                        <Wand2 size={14} style={{ color: colors.yellow }} />
                        <span className="text-xs font-semibold" style={{ color: colors.text }}>AI 智能改进建议</span>
                      </div>
                      <div className="text-[11px]" style={{ color: colors.textSecondary }}>
                        基于分析结果生成的 {report.suggestions.length} 条优化建议
                      </div>
                    </div>
                    {report.suggestions.map((s, i) => (
                      <div
                        key={i}
                        className="rounded-xl p-3"
                        style={{
                          background: colors.glass,
                          border: `1px solid ${colors.glassBorder}`,
                          borderLeft: `3px solid ${colors.yellow}`,
                        }}
                      >
                        <div className="flex items-start gap-2">
                          <span className="flex-shrink-0 w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold" style={{ background: colors.yellow + '30', color: colors.yellow }}>
                            {i + 1}
                          </span>
                          <div className="text-[11px] leading-relaxed" style={{ color: colors.text }}>
                            {s.replace(/^[🔴🟡🟢]\s*/, '')}
                          </div>
                        </div>
                      </div>
                    ))}
                    <div className="rounded-xl p-3" style={{ background: colors.glassStrong, border: `1px dashed ${colors.glassBorder}` }}>
                      <div className="flex items-center gap-2 mb-2">
                        <Sparkles size={12} style={{ color: colors.accent }} />
                        <span className="text-[11px] font-semibold" style={{ color: colors.text }}>一键生成完整报告</span>
                      </div>
                      <div className="text-[10px] mb-3" style={{ color: colors.textSecondary }}>
                        导出为 Markdown 格式，包含所有分析数据和改进建议
                      </div>
                      <div className="flex gap-2">
                        <button
                          onClick={copyReport}
                          className="flex-1 flex items-center justify-center gap-1 text-[11px] py-1.5 rounded-lg transition-all hover:opacity-90"
                          style={{ background: colors.accent + '20', color: colors.accent, border: `1px solid ${colors.accent}40` }}
                        >
                          {copied ? <Check size={11} /> : <Copy size={11} />}
                          {copied ? '已复制' : '复制 Markdown'}
                        </button>
                        <button
                          onClick={downloadMarkdown}
                          className="flex-1 flex items-center justify-center gap-1 text-[11px] py-1.5 rounded-lg transition-all hover:opacity-90"
                          style={{ background: colors.green + '20', color: colors.green, border: `1px solid ${colors.green}40` }}
                        >
                          <Download size={11} /> 导出 MD 文件
                        </button>
                      </div>
                    </div>
                  </>
                )}
              </div>
            </>
          )}
        </div>
      </div>

      {/* Sample Modal */}
      {showSamples && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: 'rgba(0,0,0,0.65)', backdropFilter: 'blur(8px)' }}>
          <div className="rounded-2xl w-full max-w-2xl max-h-[80vh] flex flex-col overflow-hidden" style={{
            background: isDark ? 'linear-gradient(180deg, #151533, #0f0f23)' : 'linear-gradient(180deg, #ffffff, #f8fafc)',
            border: `1px solid ${colors.glassBorder}`,
            boxShadow: '0 20px 80px rgba(0,0,0,0.3)',
          }}>
            <div className="flex items-center justify-between p-4" style={{ borderBottom: `1px solid ${colors.glassBorder}` }}>
              <div className="flex items-center gap-2">
                <ListChecks size={16} style={{ color: colors.accent }} />
                <div className="font-semibold" style={{ color: colors.text }}>加载示例代码</div>
              </div>
              <button onClick={() => setShowSamples(false)} className="p-1.5 rounded-lg transition-all hover:bg-white/10" style={{ color: colors.textSecondary }}>
                <X size={16} />
              </button>
            </div>
            <div className="flex-1 overflow-y-auto p-4 space-y-3">
              {(Object.keys(SAMPLE_CODES) as Language[]).map(lang => (
                <button
                  key={lang}
                  onClick={() => loadSample(lang)}
                  className="w-full text-left p-4 rounded-xl transition-all hover:scale-[1.01]"
                  style={{ background: colors.glass, border: `1px solid ${colors.glassBorder}` }}
                >
                  <div className="flex items-center justify-between mb-2">
                    <div className="text-sm font-bold" style={{ color: colors.text }}>
                      {SAMPLE_CODES[lang].name}
                    </div>
                    <span className="text-[10px] px-2 py-0.5 rounded font-mono" style={{
                      background: `linear-gradient(135deg, ${colors.accent}20, ${colors.accent2}20)`,
                      color: colors.accent,
                      border: `1px solid ${colors.accent}40`,
                    }}>
                      {SAMPLE_CODES[lang].code.split('\n').length} 行
                    </span>
                  </div>
                  <div className="text-[11px] leading-relaxed" style={{ color: colors.textSecondary }}>
                    该示例包含故意设计的复杂逻辑、嵌套结构、缺少文档的函数和重复代码，用于演示分析效果
                  </div>
                </button>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
