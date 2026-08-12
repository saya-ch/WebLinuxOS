import { Copy, Check, Info } from 'lucide-react'

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

interface DiffStats {
  added: number
  removed: number
  changed: number
  same: number
}

const SEVERITY_COLORS = { high: '#ef4444', medium: '#f59e0b', low: '#3b82f6' }

const TYPE_ICONS: Record<string, string> = {
  variable: '📦', function: '🔧', class: '🏛️', constant: '🔒', parameter: '📎',
}

export function NamingPanel({
  issues, isDark, textPrimary, textSecondary, accentColor,
}: {
  issues: NamingIssue[]; isDark: boolean; textPrimary: string
  textSecondary: string; accentColor: string
}) {
  if (issues.length === 0) {
    return (
      <div style={{ textAlign: 'center', padding: '40px 20px', color: textSecondary }}>
        <div style={{ fontSize: 48, marginBottom: 12 }}>✅</div>
        <div style={{ fontWeight: 600, color: textPrimary }}>命名规范检查通过</div>
        <div style={{ fontSize: 13, marginTop: 4 }}>所有变量、函数和类的命名都符合规范</div>
      </div>
    )
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
      {issues.map(issue => (
        <div key={issue.id} style={{
          padding: '14px 16px', borderRadius: 14,
          background: isDark ? 'rgba(30, 41, 59, 0.5)' : 'rgba(255, 255, 255, 0.6)',
          border: `1px solid ${isDark ? 'rgba(148, 163, 184, 0.1)' : 'rgba(15, 23, 42, 0.08)'}`,
          backdropFilter: 'blur(10px)',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8 }}>
            <span style={{ fontSize: 18 }}>{TYPE_ICONS[issue.type]}</span>
            <span style={{ fontWeight: 600, fontSize: 14 }}>{issue.name}</span>
            <span style={{
              padding: '2px 8px', borderRadius: 6, fontSize: 11, fontWeight: 600,
              background: isDark ? 'rgba(148, 163, 184, 0.15)' : 'rgba(100, 116, 139, 0.1)',
              color: textSecondary,
            }}>第 {issue.line} 行</span>
            <span style={{
              padding: '2px 8px', borderRadius: 6, fontSize: 11, fontWeight: 600,
              background: `${SEVERITY_COLORS[issue.severity]}22`,
              color: SEVERITY_COLORS[issue.severity], marginLeft: 'auto',
            }}>
              {issue.severity === 'high' ? '高' : issue.severity === 'medium' ? '中' : '低'}
            </span>
          </div>
          <div style={{ fontSize: 13, color: textSecondary, marginBottom: 8, lineHeight: 1.5 }}>
            {issue.message}
          </div>
          <div style={{
            padding: '8px 12px', borderRadius: 8,
            background: isDark ? 'rgba(99, 102, 241, 0.1)' : 'rgba(99, 102, 241, 0.08)',
            borderLeft: `3px solid ${accentColor}`,
            fontSize: 12, fontFamily: '"JetBrains Mono", monospace',
            color: accentColor, fontWeight: 500,
          }}>
            💡 建议: {issue.suggestion}
          </div>
        </div>
      ))}
    </div>
  )
}

export function FunctionPanel({
  issues, isDark, textPrimary, textSecondary, accentColor,
}: {
  issues: FunctionIssue[]; isDark: boolean; textPrimary: string
  textSecondary: string; accentColor: string
}) {
  if (issues.length === 0) {
    return (
      <div style={{ textAlign: 'center', padding: '40px 20px', color: textSecondary }}>
        <div style={{ fontSize: 48, marginBottom: 12 }}>✅</div>
        <div style={{ fontWeight: 600, color: textPrimary }}>函数拆分检查通过</div>
        <div style={{ fontSize: 13, marginTop: 4 }}>所有函数长度和复杂度都在合理范围内</div>
      </div>
    )
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
      {issues.map(issue => (
        <div key={issue.id} style={{
          padding: '14px 16px', borderRadius: 14,
          background: isDark ? 'rgba(30, 41, 59, 0.5)' : 'rgba(255, 255, 255, 0.6)',
          border: `1px solid ${isDark ? 'rgba(249, 115, 22, 0.2)' : 'rgba(249, 115, 22, 0.15)'}`,
          backdropFilter: 'blur(10px)',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 10 }}>
            <span style={{ fontSize: 18 }}>🔧</span>
            <span style={{ fontWeight: 600, fontSize: 14 }}>{issue.name}()</span>
            <span style={{
              padding: '2px 8px', borderRadius: 6, fontSize: 11, fontWeight: 600,
              background: isDark ? 'rgba(148, 163, 184, 0.15)' : 'rgba(100, 116, 139, 0.1)',
              color: textSecondary,
            }}>第 {issue.line} 行</span>
            <div style={{ marginLeft: 'auto', display: 'flex', gap: 6 }}>
              <span style={{
                padding: '2px 8px', borderRadius: 6, fontSize: 11, fontWeight: 600,
                background: issue.lineCount > 50 ? 'rgba(239, 68, 68, 0.15)' : 'rgba(249, 115, 22, 0.15)',
                color: issue.lineCount > 50 ? '#ef4444' : '#f97316',
              }}>{issue.lineCount} 行</span>
              <span style={{
                padding: '2px 8px', borderRadius: 6, fontSize: 11, fontWeight: 600,
                background: issue.complexity > 5 ? 'rgba(239, 68, 68, 0.15)' : 'rgba(34, 197, 94, 0.15)',
                color: issue.complexity > 5 ? '#ef4444' : '#22c55e',
              }}>复杂度 {issue.complexity}</span>
            </div>
          </div>
          <div style={{ fontSize: 13, color: textSecondary, marginBottom: 10, lineHeight: 1.6 }}>
            {issue.suggestion.split('\n').map((s, i) => (
              <div key={i} style={{ display: 'flex', gap: 6, marginBottom: 2 }}>
                <span style={{ color: accentColor }}>•</span>
                <span>{s}</span>
              </div>
            ))}
          </div>
          <div style={{
            padding: '10px 12px', borderRadius: 8,
            background: isDark ? 'rgba(15, 23, 42, 0.6)' : 'rgba(15, 23, 42, 0.05)',
            border: `1px solid ${isDark ? 'rgba(148, 163, 184, 0.1)' : 'rgba(15, 23, 42, 0.08)'}`,
            fontSize: 11, fontFamily: '"JetBrains Mono", monospace',
            color: textSecondary, whiteSpace: 'pre', lineHeight: 1.5, overflow: 'auto', maxHeight: 150,
          }}>
            {issue.refactoredCode}
          </div>
        </div>
      ))}
    </div>
  )
}

export function DependencyPanel({
  issues, isDark, textPrimary, textSecondary, accentColor,
}: {
  issues: DependencyIssue[]; isDark: boolean; textPrimary: string
  textSecondary: string; accentColor: string
}) {
  if (issues.length === 0) {
    return (
      <div style={{ textAlign: 'center', padding: '40px 20px', color: textSecondary }}>
        <div style={{ fontSize: 48, marginBottom: 12 }}>✅</div>
        <div style={{ fontWeight: 600, color: textPrimary }}>依赖关系检查通过</div>
        <div style={{ fontSize: 13, marginTop: 4 }}>模块导入导出使用规范</div>
      </div>
    )
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
      {issues.map(issue => (
        <div key={issue.id} style={{
          padding: '14px 16px', borderRadius: 14,
          background: isDark ? 'rgba(30, 41, 59, 0.5)' : 'rgba(255, 255, 255, 0.6)',
          border: `1px solid ${isDark ? 'rgba(59, 130, 246, 0.2)' : 'rgba(59, 130, 246, 0.15)'}`,
          backdropFilter: 'blur(10px)',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8 }}>
            <span style={{ fontSize: 18 }}>{issue.type === 'import' ? '📥' : '📤'}</span>
            <span style={{ fontWeight: 600, fontSize: 14 }}>{issue.module}</span>
            {issue.line > 0 && (
              <span style={{
                padding: '2px 8px', borderRadius: 6, fontSize: 11, fontWeight: 600,
                background: isDark ? 'rgba(148, 163, 184, 0.15)' : 'rgba(100, 116, 139, 0.1)',
                color: textSecondary,
              }}>第 {issue.line} 行</span>
            )}
            <span style={{
              padding: '2px 8px', borderRadius: 6, fontSize: 11, fontWeight: 600,
              background: isDark ? 'rgba(139, 92, 246, 0.15)' : 'rgba(139, 92, 246, 0.1)',
              color: '#8b5cf6', marginLeft: 'auto',
            }}>
              {issue.type === 'import' ? '导入' : '导出'}
            </span>
          </div>
          <div style={{ fontSize: 13, color: textSecondary, marginBottom: 8, lineHeight: 1.5 }}>
            {issue.issue}
          </div>
          <div style={{
            padding: '8px 12px', borderRadius: 8,
            background: isDark ? 'rgba(99, 102, 241, 0.1)' : 'rgba(99, 102, 241, 0.08)',
            borderLeft: `3px solid ${accentColor}`,
            fontSize: 12, fontFamily: '"JetBrains Mono", monospace',
            color: accentColor, fontWeight: 500,
          }}>
            💡 {issue.suggestion}
          </div>
        </div>
      ))}
    </div>
  )
}

export function MigrationPanel({
  issues, isDark, textPrimary, textSecondary, accentColor,
}: {
  issues: MigrationIssue[]; isDark: boolean; textPrimary: string
  textSecondary: string; accentColor: string
}) {
  if (issues.length === 0) {
    return (
      <div style={{ textAlign: 'center', padding: '40px 20px', color: textSecondary }}>
        <div style={{ fontSize: 48, marginBottom: 12 }}>✅</div>
        <div style={{ fontWeight: 600, color: textPrimary }}>代码迁移检查通过</div>
        <div style={{ fontSize: 13, marginTop: 4 }}>代码已使用现代语法和模块系统</div>
      </div>
    )
  }

  const categoryLabels: Record<string, { label: string; color: string }> = {
    'var-const': { label: 'var → const/let', color: '#f59e0b' },
    'es5-es6': { label: 'ES5 → ES6+', color: '#3b82f6' },
    'cjs-esm': { label: 'CJS → ESM', color: '#8b5cf6' },
    'arrow-function': { label: '箭头函数', color: '#22c55e' },
    'template-literal': { label: '模板字符串', color: '#ec4899' },
    'destructuring': { label: '解构赋值', color: '#06b6d4' },
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
      {issues.map(issue => {
        const cat = categoryLabels[issue.category] || { label: issue.category, color: '#64748b' }
        return (
          <div key={issue.id} style={{
            padding: '14px 16px', borderRadius: 14,
            background: isDark ? 'rgba(30, 41, 59, 0.5)' : 'rgba(255, 255, 255, 0.6)',
            border: `1px solid ${isDark ? `${cat.color}33` : `${cat.color}22`}`,
            backdropFilter: 'blur(10px)',
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8 }}>
              <span style={{ fontSize: 16 }}>
                {issue.category === 'cjs-esm' ? '🔄' : issue.category === 'var-const' ? '📦' : issue.category === 'arrow-function' ? '➡️' : issue.category === 'template-literal' ? '📝' : issue.category === 'destructuring' ? '🎯' : '💡'}
              </span>
              <span style={{ fontWeight: 600, fontSize: 14 }}>{issue.title}</span>
              <span style={{
                padding: '2px 8px', borderRadius: 6, fontSize: 11, fontWeight: 600,
                background: `${cat.color}22`, color: cat.color, marginLeft: 'auto',
              }}>{cat.label}</span>
            </div>
            <div style={{ fontSize: 13, color: textSecondary, marginBottom: 10, lineHeight: 1.5 }}>
              {issue.description}
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              <div>
                <div style={{ fontSize: 11, color: textSecondary, marginBottom: 4, fontWeight: 600 }}>原始代码:</div>
                <div style={{
                  padding: '8px 12px', borderRadius: 8,
                  background: isDark ? 'rgba(239, 68, 68, 0.1)' : 'rgba(239, 68, 68, 0.08)',
                  borderLeft: '3px solid #ef4444',
                  fontSize: 12, fontFamily: '"JetBrains Mono", monospace',
                  color: textPrimary, whiteSpace: 'pre', overflow: 'auto',
                }}>{issue.original}</div>
              </div>
              <div>
                <div style={{ fontSize: 11, color: accentColor, marginBottom: 4, fontWeight: 600 }}>重构后:</div>
                <div style={{
                  padding: '8px 12px', borderRadius: 8,
                  background: isDark ? 'rgba(34, 197, 94, 0.1)' : 'rgba(34, 197, 94, 0.08)',
                  borderLeft: '3px solid #22c55e',
                  fontSize: 12, fontFamily: '"JetBrains Mono", monospace',
                  color: textPrimary, whiteSpace: 'pre', overflow: 'auto',
                }}>{issue.refactored}</div>
              </div>
            </div>
          </div>
        )
      })}
    </div>
  )
}

export function DiffPanel({
  diffResult, stats, original, refactored, isDark,
  textPrimary, textSecondary, onCopy, copied,
}: {
  diffResult: DiffLine[]; stats: DiffStats; original: string; refactored: string
  isDark: boolean; textPrimary: string; textSecondary: string
  onCopy: (text: string) => void; copied: boolean
}) {
  const formatUnifiedDiff = () => {
    let output = ''
    diffResult.forEach((d) => {
      if (d.type === 'same') {
        output += `  ${d.content}\n`
      } else if (d.type === 'remove') {
        output += `- ${d.content}\n`
      } else if (d.type === 'add') {
        output += `+ ${d.content}\n`
      } else if (d.type === 'change') {
        output += `- ${d.content}\n`
        output += `+ ${d.otherContent}\n`
      }
    })
    return output
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
      <div style={{
        padding: 14, borderRadius: 14,
        background: isDark ? 'rgba(30, 41, 59, 0.5)' : 'rgba(255, 255, 255, 0.6)',
        border: `1px solid ${isDark ? 'rgba(148, 163, 184, 0.1)' : 'rgba(15, 23, 42, 0.08)'}`,
        backdropFilter: 'blur(10px)',
      }}>
        <div style={{ display: 'flex', gap: 20, marginBottom: 12 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <span style={{
              padding: '2px 8px', borderRadius: 6, fontSize: 12, fontWeight: 700,
              background: isDark ? 'rgba(239, 68, 68, 0.15)' : 'rgba(239, 68, 68, 0.1)',
              color: '#ef4444',
            }}>-{stats.removed}</span>
            <span style={{ fontSize: 12, color: textSecondary }}>删除</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <span style={{
              padding: '2px 8px', borderRadius: 6, fontSize: 12, fontWeight: 700,
              background: isDark ? 'rgba(34, 197, 94, 0.15)' : 'rgba(34, 197, 94, 0.1)',
              color: '#22c55e',
            }}>+{stats.added}</span>
            <span style={{ fontSize: 12, color: textSecondary }}>新增</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <span style={{
              padding: '2px 8px', borderRadius: 6, fontSize: 12, fontWeight: 700,
              background: isDark ? 'rgba(249, 115, 22, 0.15)' : 'rgba(249, 115, 22, 0.1)',
              color: '#f97316',
            }}>~{stats.changed}</span>
            <span style={{ fontSize: 12, color: textSecondary }}>修改</span>
          </div>
          <button onClick={() => onCopy(formatUnifiedDiff())}
            style={{
              padding: '4px 10px', borderRadius: 6, border: 'none',
              background: copied ? '#22c55e' : (isDark ? 'rgba(99, 102, 241, 0.2)' : 'rgba(99, 102, 241, 0.12)'),
              color: copied ? 'white' : '#6366f1',
              cursor: 'pointer', fontSize: 12, fontWeight: 600,
              display: 'flex', alignItems: 'center', gap: 4, marginLeft: 'auto',
            }}>
            {copied ? <Check size={12} /> : <Copy size={12} />}
            {copied ? '已复制' : '复制Diff'}
          </button>
        </div>

        <div style={{
          maxHeight: 400, overflow: 'auto', borderRadius: 10,
          background: isDark ? 'rgba(15, 23, 42, 0.6)' : 'rgba(15, 23, 42, 0.04)',
          border: `1px solid ${isDark ? 'rgba(148, 163, 184, 0.1)' : 'rgba(15, 23, 42, 0.08)'}`,
        }}>
          <div style={{ fontFamily: '"JetBrains Mono", monospace', fontSize: 12, lineHeight: 1.6 }}>
            {diffResult.map((line, i) => {
              let bgColor = 'transparent'
              let borderColor = 'transparent'
              let prefix = ' '
              let contentColor = textPrimary

              if (line.type === 'add') {
                bgColor = isDark ? 'rgba(34, 197, 94, 0.1)' : 'rgba(34, 197, 94, 0.12)'
                borderColor = '#22c55e'
                prefix = '+'
                contentColor = '#22c55e'
              } else if (line.type === 'remove') {
                bgColor = isDark ? 'rgba(239, 68, 68, 0.1)' : 'rgba(239, 68, 68, 0.12)'
                borderColor = '#ef4444'
                prefix = '-'
                contentColor = '#ef4444'
              } else if (line.type === 'change') {
                bgColor = isDark ? 'rgba(249, 115, 22, 0.1)' : 'rgba(249, 115, 22, 0.12)'
                borderColor = '#f97316'
                prefix = '~'
                contentColor = '#f97316'
              }

              return (
                <div key={i} style={{
                  padding: '2px 12px',
                  background: bgColor,
                  borderLeft: `3px solid ${borderColor}`,
                  whiteSpace: 'pre-wrap',
                  wordBreak: 'break-all',
                  display: 'flex',
                }}>
                  <span style={{ color: textSecondary, marginRight: 12, minWidth: 30, textAlign: 'right', flexShrink: 0 }}>
                    {line.lineNum}
                  </span>
                  <span style={{ color: contentColor, flex: 1 }}>
                    {prefix} {line.content}
                    {line.type === 'change' && line.otherContent && (
                      <>
                        {'\n'}
                        <span style={{ color: '#22c55e' }}>+ {line.otherContent}</span>
                      </>
                    )}
                  </span>
                </div>
              )
            })}
          </div>
        </div>
      </div>

      <div style={{
        padding: 14, borderRadius: 14,
        background: isDark ? 'rgba(30, 41, 59, 0.5)' : 'rgba(255, 255, 255, 0.6)',
        border: `1px solid ${isDark ? 'rgba(148, 163, 184, 0.1)' : 'rgba(15, 23, 42, 0.08)'}`,
        backdropFilter: 'blur(10px)',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10 }}>
          <Info size={14} style={{ color: '#6366f1' }} />
          <span style={{ fontSize: 13, fontWeight: 600 }}>重构预览摘要</span>
        </div>
        <div style={{ display: 'flex', gap: 16, fontSize: 12, color: textSecondary, flexWrap: 'wrap' }}>
          <span>原始: {original.split('\n').length} 行</span>
          <span>重构后: {refactored.split('\n').length} 行</span>
          <span>净变化: {refactored.split('\n').length - original.split('\n').length >= 0 ? '+' : ''}{refactored.split('\n').length - original.split('\n').length} 行</span>
        </div>
      </div>
    </div>
  )
}