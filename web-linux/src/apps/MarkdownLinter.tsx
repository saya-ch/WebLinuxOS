import { useState, useCallback, useMemo, useRef } from 'react'
import { CheckCircle, AlertTriangle, AlertCircle, Info, Wrench, FileText, Hash, Link, Image, Space, List, ChevronRight, Copy, Trash2 } from 'lucide-react'

type Severity = 'error' | 'warning' | 'info'

interface LintIssue {
  line: number
  type: string
  severity: Severity
  message: string
  fix: string
}

interface Stats {
  lines: number
  characters: number
  words: number
  issues: number
}

const SAMPLE_MD = `# 标题一

这是一段示例 Markdown 文档。

## 标题二

### 小标题

这是一段普通文本。

- 列表项一
  - 嵌套列表项
* 列表项二（混用了 * 标记）
  + 另一种标记

## 另一个标题

### 这里跳了一级

段落前面缺少空行
# 标题前面缺少空行

\`\`\`javascript
function hello() {
  console.log("world")
}

一些行尾有空格的文本   
一些行尾有空格的文本   

[链接格式](正确)
[链接格式]（错误的括号）
![图片](正确)
! [图片格式] 错误




代码块未闭合：\`\`\`python
def foo():
    pass

正常段落。
`

export default function MarkdownLinter() {
  const [input, setInput] = useState(SAMPLE_MD)
  const [issues, setIssues] = useState<LintIssue[]>([])
  const [hasRun, setHasRun] = useState(false)
  const [fixedText, setFixedText] = useState('')
  const [activeFilter, setActiveFilter] = useState<Severity | 'all'>('all')
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  const stats = useMemo((): Stats => {
    const text = input
    const lines = text.split('\n')
    const characters = text.length
    const words = text.trim() === '' ? 0 : text.trim().split(/\s+/).length
    return { lines: lines.length, characters, words, issues: issues.length }
  }, [input, issues])

  const runLint = useCallback(() => {
    const lines = input.split('\n')
    const found: LintIssue[] = []
    let inCodeBlock = false
    const listMarkers: Set<string> = new Set()
    let prevLineEmpty = false

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i]
      const lineNum = i + 1

      // Track code block state
      if (line.trimStart().startsWith('```')) {
        inCodeBlock = !inCodeBlock
        continue
      }

      // Skip lines inside code blocks
      if (inCodeBlock) continue

      // 1. Heading level skip (e.g., # jumping to ###)
      const headingMatch = line.match(/^(#{1,6})\s/)
      if (headingMatch) {
        const level = headingMatch[1].length
        if (i > 0) {
          // Find previous heading
          for (let j = i - 1; j >= 0; j--) {
            const prevMatch = lines[j].match(/^(#{1,6})\s/)
            if (prevMatch) {
              const prevLevel = prevMatch[1].length
              if (level > prevLevel + 1) {
                found.push({
                  line: lineNum,
                  type: '标题层级跳跃',
                  severity: 'warning',
                  message: `标题从 h${prevLevel} 跳到了 h${level}`,
                  fix: `将 "${headingMatch[1]}" 改为 "${'#'.repeat(prevLevel + 1)}"`
                })
              }
              break
            }
          }
        }

        // 2. Heading missing blank line before
        if (i > 0 && lines[i - 1].trim() !== '' && !lines[i - 1].match(/^(#{1,6})\s/)) {
          found.push({
            line: lineNum,
            type: '标题前缺少空行',
            severity: 'info',
            message: '标题前应有空行',
            fix: `在第 ${lineNum} 行前插入空行`
          })
        }

        // 3. Heading missing blank line after
        if (i < lines.length - 1 && lines[i + 1].trim() !== '' && !lines[i + 1].match(/^(#{1,6})\s/)) {
          found.push({
            line: lineNum,
            type: '标题后缺少空行',
            severity: 'info',
            message: '标题后应有空行',
            fix: `在第 ${lineNum} 行后插入空行`
          })
        }
      }

      // 4. Trailing whitespace
      if (line.length > 0 && /\s+$/.test(line)) {
        found.push({
          line: lineNum,
          type: '行尾多余空格',
          severity: 'info',
          message: `行尾有 ${line.length - line.trimEnd().length} 个多余空格`,
          fix: '移除行尾空格'
        })
      }

      // 5. Multiple consecutive blank lines
      if (line.trim() === '') {
        if (prevLineEmpty) {
          found.push({
            line: lineNum,
            type: '多余空行',
            severity: 'info',
            message: '存在连续空行',
            fix: '删除多余空行'
          })
        }
        prevLineEmpty = true
      } else {
        prevLineEmpty = false
      }

      // 6. Inconsistent list markers
      const listMatch = line.match(/^(\s*)([-*+])\s/)
      if (listMatch) {
        const marker = listMatch[2]
        listMarkers.add(marker)
      }

      // 7. Link format errors
      // Wrong parentheses: [text]（url） using fullwidth parentheses
      if (/\[[^\]]*\]（[^)]*\)/.test(line) || /\[[^\]]*\]\([^（]*\）/.test(line)) {
        found.push({
          line: lineNum,
          type: '链接格式错误',
          severity: 'error',
          message: '链接使用了全角括号，应使用半角括号',
          fix: '将全角括号替换为半角括号'
        })
      }

      // Mismatched link brackets
      const linkRegex = /\[([^\]]*)\]\(([^)]*)\)/g
      let linkMatch
      while ((linkMatch = linkRegex.exec(line)) !== null) {
        if (linkMatch[1].trim() === '') {
          found.push({
            line: lineNum,
            type: '链接格式错误',
            severity: 'error',
            message: '链接文本为空',
            fix: '填写链接文本'
          })
        }
      }

      // 8. Image format errors
      // ! [text] (url) - space after !
      if (/!\s+\[/.test(line)) {
        found.push({
          line: lineNum,
          type: '图片格式错误',
          severity: 'error',
          message: '"!" 和 "[" 之间不应有空格',
          fix: '移除 "!" 后的空格'
        })
      }

      // !text(url) without brackets
      if (/!\([^)]*\)/.test(line) && !/!\[/.test(line)) {
        found.push({
          line: lineNum,
          type: '图片格式错误',
          severity: 'error',
          message: '图片缺少方括号语法',
          fix: '改为 ![alt](url) 格式'
        })
      }

      // 9. Trailing content after heading marker without space (only non-empty content)
      if (/^#{1,6}[^ #]/.test(line) && !inCodeBlock) {
        found.push({
          line: lineNum,
          type: '标题格式错误',
          severity: 'warning',
          message: '标题标记后缺少空格',
          fix: '在标题标记和文本之间添加空格'
        })
      }
    }

    // 10. Unclosed code block
    if (inCodeBlock) {
      found.push({
        line: lines.length,
        type: '代码块未闭合',
        severity: 'error',
        message: '检测到未闭合的代码块',
        fix: '在文档末尾添加 ```'
      })
    }

    // 11. Inconsistent list markers (check globally)
    if (listMarkers.size > 1) {
      const markers = Array.from(listMarkers).join(', ')
      found.push({
        line: 1,
        type: '列表标记不一致',
        severity: 'warning',
        message: `混用了多种无序列表标记: ${markers}`,
        fix: '统一使用同一种列表标记'
      })
    }

    // Sort by line number
    found.sort((a, b) => a.line - b.line)
    setIssues(found)
    setHasRun(true)
    setFixedText('')
  }, [input])

  const applyFixes = useCallback(() => {
    const lines = input.split('\n')
    let result: string[] = []
    let inCodeBlock = false

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i]

      // Track code block
      if (line.trimStart().startsWith('```')) {
        inCodeBlock = !inCodeBlock
        result.push(line)
        continue
      }

      if (inCodeBlock) {
        result.push(line)
        continue
      }

      let fixedLine = line

      // Fix trailing whitespace
      fixedLine = fixedLine.replace(/\s+$/, '')

      // Fix fullwidth parentheses in links
      fixedLine = fixedLine.replace(/\[([^\]]*)\]（/g, '[$1](')
      fixedLine = fixedLine = fixedLine.replace(/\[([^\]]*)\]\(([^（]*)\）/g, '[$1]($2)')

      // Fix space after ! in images
      fixedLine = fixedLine.replace(/!\s+\[/g, '![')

      // Fix missing space after heading marker
      const headingFix = fixedLine.match(/^(#{1,6})([^ #\n])/)
      if (headingFix) {
        fixedLine = headingFix[1] + ' ' + fixedLine.slice(headingFix[1].length)
      }

      result.push(fixedLine)
    }

    // Remove extra blank lines (consecutive blank lines -> single blank line)
    const cleaned: string[] = []
    let prevBlank = false
    for (const line of result) {
      if (line.trim() === '') {
        if (!prevBlank) {
          cleaned.push(line)
        }
        prevBlank = true
      } else {
        cleaned.push(line)
        prevBlank = false
      }
    }

    // Add blank lines around headings
    const withHeadings: string[] = []
    for (let i = 0; i < cleaned.length; i++) {
      const isHeading = /^(#{1,6})\s/.test(cleaned[i])
      if (isHeading) {
        // Add blank line before if needed
        if (withHeadings.length > 0 && withHeadings[withHeadings.length - 1].trim() !== '') {
          withHeadings.push('')
        }
        withHeadings.push(cleaned[i])
        // Add blank line after if needed
        if (i < cleaned.length - 1 && cleaned[i + 1].trim() !== '' && !/^(#{1,6})\s/.test(cleaned[i + 1])) {
          withHeadings.push('')
        }
      } else {
        withHeadings.push(cleaned[i])
      }
    }

    // Normalize list markers to -
    const normalized = withHeadings.map(line => {
      const listMatch = line.match(/^(\s*)([*+])\s/)
      if (listMatch) {
        return line.replace(/^(\s*)[*+]\s/, '$1- ')
      }
      return line
    })

    // Fix unclosed code block
    let codeOpen = false
    for (const line of normalized) {
      if (line.trimStart().startsWith('```')) {
        codeOpen = !codeOpen
      }
    }
    if (codeOpen) {
      normalized.push('```')
    }

    setFixedText(normalized.join('\n'))
    setInput(normalized.join('\n'))
    setIssues([])
    setHasRun(false)
  }, [input])

  const handleCopy = useCallback(() => {
    navigator.clipboard.writeText(fixedText || input)
  }, [fixedText, input])

  const handleClear = useCallback(() => {
    setInput('')
    setIssues([])
    setHasRun(false)
    setFixedText('')
  }, [])

  const filteredIssues = useMemo(() => {
    if (activeFilter === 'all') return issues
    return issues.filter(i => i.severity === activeFilter)
  }, [issues, activeFilter])

  const scrollToLine = useCallback((line: number) => {
    if (textareaRef.current) {
      const lines = input.split('\n')
      let pos = 0
      for (let i = 0; i < line - 1 && i < lines.length; i++) {
        pos += lines[i].length + 1
      }
      textareaRef.current.focus()
      textareaRef.current.setSelectionRange(pos, pos + (lines[line - 1]?.length || 0))
    }
  }, [input])

  const severityIcon = (sev: Severity) => {
    switch (sev) {
      case 'error': return <AlertCircle size={14} color="#f38ba8" />
      case 'warning': return <AlertTriangle size={14} color="#f9e2af" />
      case 'info': return <Info size={14} color="#89b4fa" />
    }
  }

  const severityColor = (sev: Severity) => {
    switch (sev) {
      case 'error': return '#f38ba8'
      case 'warning': return '#f9e2af'
      case 'info': return '#89b4fa'
    }
  }

  const typeIcon = (type: string) => {
    if (type.includes('标题')) return <Hash size={13} />
    if (type.includes('链接')) return <Link size={13} />
    if (type.includes('图片')) return <Image size={13} />
    if (type.includes('空格') || type.includes('空行')) return <Space size={13} />
    if (type.includes('列表')) return <List size={13} />
    if (type.includes('代码')) return <FileText size={13} />
    return <AlertTriangle size={13} />
  }

  const countBySeverity = (sev: Severity) => issues.filter(i => i.severity === sev).length

  return (
    <div style={{
      height: '100%',
      display: 'flex',
      flexDirection: 'column',
      background: '#1e1e2e',
      color: '#cdd6f4',
      fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, monospace',
      fontSize: '13px',
      overflow: 'hidden'
    }}>
      {/* Toolbar */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        gap: '8px',
        padding: '8px 12px',
        background: '#181825',
        borderBottom: '1px solid #313244',
        flexShrink: 0,
        flexWrap: 'wrap'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginRight: '8px' }}>
          <CheckCircle size={18} color='#a6e3a1' />
          <span style={{ fontWeight: 600, fontSize: '14px', color: '#cba6f7' }}>MarkdownLinter</span>
        </div>
        <button onClick={runLint} style={{
          display: 'flex', alignItems: 'center', gap: '4px',
          padding: '5px 12px', background: '#89b4fa', color: '#1e1e2e',
          border: 'none', borderRadius: '4px', cursor: 'pointer',
          fontWeight: 600, fontSize: '12px'
        }}>
          <CheckCircle size={13} /> 检查
        </button>
        <button onClick={applyFixes} disabled={!hasRun || issues.length === 0} style={{
          display: 'flex', alignItems: 'center', gap: '4px',
          padding: '5px 12px',
          background: (!hasRun || issues.length === 0) ? '#45475a' : '#a6e3a1',
          color: (!hasRun || issues.length === 0) ? '#6c7086' : '#1e1e2e',
          border: 'none', borderRadius: '4px', cursor: (!hasRun || issues.length === 0) ? 'default' : 'pointer',
          fontWeight: 600, fontSize: '12px'
        }}>
          <Wrench size={13} /> 一键修复
        </button>
        <button onClick={handleCopy} style={{
          display: 'flex', alignItems: 'center', gap: '4px',
          padding: '5px 10px', background: '#45475a', color: '#cdd6f4',
          border: 'none', borderRadius: '4px', cursor: 'pointer', fontSize: '12px'
        }}>
          <Copy size={13} /> 复制
        </button>
        <button onClick={handleClear} style={{
          display: 'flex', alignItems: 'center', gap: '4px',
          padding: '5px 10px', background: '#45475a', color: '#cdd6f4',
          border: 'none', borderRadius: '4px', cursor: 'pointer', fontSize: '12px'
        }}>
          <Trash2 size={13} /> 清空
        </button>
        <div style={{ flex: 1 }} />
        <div style={{
          display: 'flex', gap: '12px', fontSize: '11px', color: '#6c7086',
          background: '#181825', padding: '4px 10px', borderRadius: '4px',
          border: '1px solid #313244'
        }}>
          <span>行数: <b style={{ color: '#89b4fa' }}>{stats.lines}</b></span>
          <span>字符: <b style={{ color: '#89b4fa' }}>{stats.characters}</b></span>
          <span>单词: <b style={{ color: '#89b4fa' }}>{stats.words}</b></span>
          <span>问题: <b style={{ color: issues.length > 0 ? '#f38ba8' : '#a6e3a1' }}>{stats.issues}</b></span>
        </div>
      </div>

      {/* Main content */}
      <div style={{ display: 'flex', flex: 1, overflow: 'hidden' }}>
        {/* Left: Editor */}
        <div style={{
          flex: 1, display: 'flex', flexDirection: 'column',
          borderRight: '1px solid #313244', minWidth: 0
        }}>
          <div style={{
            display: 'flex', alignItems: 'center', gap: '6px',
            padding: '6px 12px', background: '#181825',
            borderBottom: '1px solid #313244', fontSize: '11px',
            color: '#6c7086', fontWeight: 600, textTransform: 'uppercase',
            letterSpacing: '0.5px'
          }}>
            <FileText size={13} />
            <span>Markdown 编辑器</span>
          </div>
          <div style={{ flex: 1, display: 'flex', overflow: 'hidden' }}>
            {/* Line numbers */}
            <div style={{
              width: '45px', background: '#11111b',
              borderRight: '1px solid #313244',
              overflow: 'hidden', padding: '8px 0',
              textAlign: 'right', userSelect: 'none'
            }}>
              {(input || '').split('\n').map((_, i) => (
                <div key={i} style={{
                  padding: '0 8px 0 0',
                  lineHeight: '20px',
                  fontSize: '11px',
                  color: '#45475a'
                }}>
                  {i + 1}
                </div>
              ))}
            </div>
            <textarea
              ref={textareaRef}
              value={input}
              onChange={(e) => {
                setInput(e.target.value)
                setHasRun(false)
                setIssues([])
                setFixedText('')
              }}
              spellCheck={false}
              style={{
                flex: 1, background: '#1e1e2e', color: '#cdd6f4',
                border: 'none', outline: 'none', resize: 'none',
                padding: '8px 12px', fontFamily: '"Cascadia Code", "Fira Code", "JetBrains Mono", monospace',
                fontSize: '13px', lineHeight: '20px', tabSize: 2,
                overflow: 'auto'
              }}
              placeholder="在此粘贴或输入 Markdown 文本..."
            />
          </div>
        </div>

        {/* Right: Issues panel */}
        <div style={{
          width: '360px', minWidth: '280px', display: 'flex',
          flexDirection: 'column', overflow: 'hidden'
        }}>
          <div style={{
            display: 'flex', alignItems: 'center', gap: '6px',
            padding: '6px 12px', background: '#181825',
            borderBottom: '1px solid #313244', fontSize: '11px',
            color: '#6c7086', fontWeight: 600, textTransform: 'uppercase',
            letterSpacing: '0.5px', flexShrink: 0
          }}>
            <AlertTriangle size={13} />
            <span>问题列表</span>
            {hasRun && (
              <span style={{
                marginLeft: 'auto',
                background: issues.length === 0 ? '#a6e3a1' : '#f38ba8',
                color: '#1e1e2e',
                padding: '1px 8px', borderRadius: '10px',
                fontSize: '11px', fontWeight: 700
              }}>
                {issues.length === 0 ? '无问题' : `${issues.length}`}
              </span>
            )}
          </div>

          {/* Filter tabs */}
          <div style={{
            display: 'flex', gap: '4px', padding: '6px 8px',
            borderBottom: '1px solid #313244', flexShrink: 0
          }}>
            {([
              { key: 'all' as const, label: '全部', color: '#cdd6f4' },
              { key: 'error' as const, label: `错误 (${countBySeverity('error')})`, color: '#f38ba8' },
              { key: 'warning' as const, label: `警告 (${countBySeverity('warning')})`, color: '#f9e2af' },
              { key: 'info' as const, label: `提示 (${countBySeverity('info')})`, color: '#89b4fa' }
            ]).map(tab => (
              <button key={tab.key} onClick={() => setActiveFilter(tab.key)} style={{
                padding: '3px 8px',
                background: activeFilter === tab.key ? '#313244' : 'transparent',
                color: activeFilter === tab.key ? tab.color : '#6c7086',
                border: 'none', borderRadius: '3px', cursor: 'pointer',
                fontSize: '11px', fontWeight: activeFilter === tab.key ? 600 : 400
              }}>
                {tab.label}
              </button>
            ))}
          </div>

          {/* Issues list */}
          <div style={{ flex: 1, overflow: 'auto', padding: '4px 0' }}>
            {!hasRun && (
              <div style={{
                display: 'flex', flexDirection: 'column', alignItems: 'center',
                justifyContent: 'center', height: '100%', color: '#6c7086',
                gap: '8px', padding: '20px', textAlign: 'center'
              }}>
                <CheckCircle size={32} color='#45475a' />
                <span style={{ fontSize: '13px' }}>点击「检查」按钮开始分析</span>
                <span style={{ fontSize: '11px', color: '#45475a' }}>
                  支持检测 9 种常见格式问题
                </span>
              </div>
            )}
            {hasRun && filteredIssues.length === 0 && (
              <div style={{
                display: 'flex', flexDirection: 'column', alignItems: 'center',
                justifyContent: 'center', height: '100%', color: '#a6e3a1',
                gap: '8px', padding: '20px', textAlign: 'center'
              }}>
                <CheckCircle size={32} />
                <span style={{ fontSize: '13px', fontWeight: 600 }}>
                  {activeFilter === 'all' ? '未发现任何问题' : `${activeFilter === 'error' ? '错误' : activeFilter === 'warning' ? '警告' : '提示'}数量为 0`}
                </span>
                <span style={{ fontSize: '11px', color: '#a6e3a1' }}>
                  Markdown 格式看起来不错！
                </span>
              </div>
            )}
            {filteredIssues.map((issue, idx) => (
              <div key={idx} onClick={() => scrollToLine(issue.line)} style={{
                display: 'flex', gap: '8px', padding: '8px 12px',
                cursor: 'pointer', borderBottom: '1px solid #181825',
                transition: 'background 0.15s',
                background: 'transparent'
              }}
              onMouseEnter={e => (e.currentTarget.style.background = '#313244')}
              onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
              >
                <div style={{ flexShrink: 0, paddingTop: '2px' }}>
                  {severityIcon(issue.severity)}
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{
                    display: 'flex', alignItems: 'center', gap: '6px',
                    marginBottom: '2px'
                  }}>
                    <span style={{
                      background: '#313244', color: '#cdd6f4',
                      padding: '0 5px', borderRadius: '3px',
                      fontSize: '10px', fontWeight: 600,
                      fontVariantNumeric: 'tabular-nums'
                    }}>
                      L{issue.line}
                    </span>
                    <span style={{
                      color: severityColor(issue.severity),
                      fontSize: '11px', fontWeight: 600,
                      display: 'flex', alignItems: 'center', gap: '3px'
                    }}>
                      {typeIcon(issue.type)}
                      {issue.type}
                    </span>
                  </div>
                  <div style={{ color: '#a6adc8', fontSize: '12px', marginBottom: '3px' }}>
                    {issue.message}
                  </div>
                  <div style={{
                    display: 'flex', alignItems: 'center', gap: '4px',
                    color: '#a6e3a1', fontSize: '11px'
                  }}>
                    <ChevronRight size={11} />
                    {issue.fix}
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Severity legend */}
          <div style={{
            padding: '6px 12px', borderTop: '1px solid #313244',
            background: '#181825', display: 'flex', gap: '12px',
            fontSize: '10px', color: '#6c7086', flexShrink: 0
          }}>
            <span style={{ display: 'flex', alignItems: 'center', gap: '3px' }}>
              <AlertCircle size={10} color='#f38ba8' /> 严重
            </span>
            <span style={{ display: 'flex', alignItems: 'center', gap: '3px' }}>
              <AlertTriangle size={10} color='#f9e2af' /> 警告
            </span>
            <span style={{ display: 'flex', alignItems: 'center', gap: '3px' }}>
              <Info size={10} color='#89b4fa' /> 提示
            </span>
          </div>
        </div>
      </div>
    </div>
  )
}
