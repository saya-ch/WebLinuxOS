import { useState, useMemo } from 'react'

interface Match {
  text: string
  index: number
  groups?: Record<string, string>
}

interface RegexTest {
  pattern: string
  flags: string
  testString: string
  matches: Match[]
  error: string | null
  replaceText: string
  replaceResult: string
}

export default function RegexTester() {
  const [pattern, setPattern] = useState('(\\w+)@(\\w+\\.\\w+)')
  const [flags, setFlags] = useState('gi')
  const [testString, setTestString] = useState('contact@example.com, support@test.org, admin@web-linux.io')
  const [replaceText, setReplaceText] = useState('[$1 at $2]')
  
  const { matches, error, replaceResult } = useMemo((): RegexTest => {
    let currentError: string | null = null
    const currentMatches: Match[] = []
    let currentReplaceResult = ''

    let regex: RegExp
    try {
      regex = new RegExp(pattern, flags)
    } catch (e) {
      currentError = e instanceof Error ? e.message : 'Invalid regex pattern'
      return { pattern, flags, testString, matches: [], error: currentError, replaceText, replaceResult: '' }
    }

    try {
      // Find all matches
      if (regex.global) {
        let match: RegExpExecArray | null
        while ((match = regex.exec(testString)) !== null) {
          const groups: Record<string, string> = {}
          if (match.groups) {
            Object.entries(match.groups).forEach(([key, value]) => {
              groups[key] = value || ''
            })
          }
          currentMatches.push({
            text: match[0],
            index: match.index,
            groups
          })
        }
      } else {
        const match = regex.exec(testString)
        if (match) {
          const groups: Record<string, string> = {}
          if (match.groups) {
            Object.entries(match.groups).forEach(([key, value]) => {
              groups[key] = value || ''
            })
          }
          currentMatches.push({
            text: match[0],
            index: match.index,
            groups
          })
        }
      }

      // Replace
      currentReplaceResult = testString.replace(regex, replaceText)
    } catch (e) {
      currentError = e instanceof Error ? e.message : 'Error executing regex'
    }

    return { pattern, flags, testString, matches: currentMatches, error: currentError, replaceText, replaceResult: currentReplaceResult }
  }, [pattern, flags, testString, replaceText])

  // Highlight matches in test string
  const highlightedText = useMemo(() => {
    if (!matches.length) return <span>{testString}</span>

    const parts: React.ReactNode[] = []
    let lastIndex = 0

    matches.forEach((match, i) => {
      if (match.index > lastIndex) {
        parts.push(<span key={`text-${i}`}>{testString.slice(lastIndex, match.index)}</span>)
      }
      parts.push(
        <mark key={`match-${i}`} style={{
          background: 'linear-gradient(135deg, #6c5ce7, #a29bfe)',
          color: 'white',
          padding: '2px 4px',
          borderRadius: '3px',
          fontWeight: '600'
        }}>
          {match.text}
        </mark>
      )
      lastIndex = match.index + match.text.length
    })

    if (lastIndex < testString.length) {
      parts.push(<span key="text-end">{testString.slice(lastIndex)}</span>)
    }

    return <>{parts}</>
  }, [testString, matches])

  const presets = [
    { name: 'Email', pattern: '(\\w+)@(\\w+\\.\\w+)', flags: 'gi' },
    { name: 'URL', pattern: 'https?://([\\w-]+\\.)+[\\w-]+(/[\\w-./?%&=]*)?', flags: 'gi' },
    { name: 'Phone (US)', pattern: '\\d{3}-\\d{3}-\\d{4}', flags: 'g' },
    { name: 'Date (YYYY-MM-DD)', pattern: '\\d{4}-\\d{2}-\\d{2}', flags: 'g' },
    { name: 'IP Address', pattern: '\\b(?:\\d{1,3}\\.){3}\\d{1,3}\\b', flags: 'g' },
    { name: 'Color Hex', pattern: '#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})', flags: 'gi' },
  ]

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', background: '#1e1e2e', color: '#e0e0e0' }}>
      {/* Header */}
      <div style={{ 
        padding: '12px 16px', 
        background: '#252536', 
        borderBottom: '1px solid #3a3a5c',
        display: 'flex',
        alignItems: 'center',
        gap: '12px'
      }}>
        <span style={{ fontSize: '20px' }}>🔍</span>
        <div>
          <div style={{ fontWeight: 600 }}>正则表达式测试工具</div>
          <div style={{ fontSize: '12px', color: '#9090a4' }}>测试、验证和调试正则表达式</div>
        </div>
      </div>

      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden', padding: '16px', gap: '16px' }}>
        {/* Presets */}
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
          <span style={{ fontSize: '12px', color: '#9090a4', padding: '4px 0' }}>快速预设:</span>
          {presets.map((preset, i) => (
            <button
              key={i}
              onClick={() => {
                setPattern(preset.pattern)
                setFlags(preset.flags)
              }}
              style={{
                padding: '6px 12px',
                borderRadius: '6px',
                border: '1px solid #3a3a5c',
                background: '#252536',
                color: '#e0e0e0',
                cursor: 'pointer',
                fontSize: '12px',
                transition: 'all 0.2s'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = '#3a3a5c'
                e.currentTarget.style.borderColor = '#6c5ce7'
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = '#252536'
                e.currentTarget.style.borderColor = '#3a3a5c'
              }}
            >
              {preset.name}
            </button>
          ))}
        </div>

        {/* Regex Pattern Input */}
        <div>
          <div style={{ fontSize: '12px', color: '#9090a4', marginBottom: '8px', fontWeight: 600 }}>正则表达式</div>
          <div style={{ display: 'flex', gap: '8px' }}>
            <span style={{
              display: 'flex',
              alignItems: 'center',
              padding: '0 12px',
              background: '#2d2d3e',
              border: '1px solid #3a3a5c',
              borderRadius: '8px 0 0 8px',
              color: '#9090a4',
              fontSize: '16px',
              fontWeight: 'bold'
            }}>/</span>
            <input
              type="text"
              value={pattern}
              onChange={(e) => setPattern(e.target.value)}
              placeholder="输入正则表达式..."
              style={{
                flex: 1,
                padding: '10px 12px',
                background: '#2d2d3e',
                border: error ? '1px solid #f38ba8' : '1px solid #3a3a5c',
                borderRadius: 0,
                color: '#e0e0e0',
                fontSize: '14px',
                fontFamily: 'Consolas, Monaco, monospace',
                outline: 'none'
              }}
            />
            <span style={{
              display: 'flex',
              alignItems: 'center',
              padding: '0 12px',
              background: '#2d2d3e',
              border: '1px solid #3a3a5c',
              borderLeft: 'none',
              color: '#9090a4',
              fontSize: '16px',
              fontWeight: 'bold'
            }}>/</span>
            <input
              type="text"
              value={flags}
              onChange={(e) => setFlags(e.target.value)}
              placeholder="gi"
              style={{
                width: '80px',
                padding: '10px 12px',
                background: '#2d2d3e',
                border: '1px solid #3a3a5c',
                borderLeft: 'none',
                borderRadius: '0 8px 8px 0',
                color: '#6c5ce7',
                fontSize: '14px',
                fontFamily: 'Consolas, Monaco, monospace',
                outline: 'none',
                fontWeight: 'bold'
              }}
            />
          </div>
          {error && (
            <div style={{
              marginTop: '8px',
              padding: '8px 12px',
              background: 'rgba(243, 139, 168, 0.15)',
              border: '1px solid #f38ba8',
              borderRadius: '6px',
              color: '#f38ba8',
              fontSize: '12px'
            }}>
              ❌ {error}
            </div>
          )}
        </div>

        {/* Test String */}
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minHeight: '120px' }}>
          <div style={{ fontSize: '12px', color: '#9090a4', marginBottom: '8px', fontWeight: 600 }}>测试文本</div>
          <textarea
            value={testString}
            onChange={(e) => setTestString(e.target.value)}
            placeholder="输入要测试的文本..."
            style={{
              flex: 1,
              padding: '12px',
              background: '#2d2d3e',
              border: '1px solid #3a3a5c',
              borderRadius: '8px',
              color: '#e0e0e0',
              fontSize: '14px',
              fontFamily: 'Consolas, Monaco, monospace',
              resize: 'none',
              outline: 'none'
            }}
          />
        </div>

        {/* Results */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
          {/* Matches */}
          <div>
            <div style={{ fontSize: '12px', color: '#9090a4', marginBottom: '8px', fontWeight: 600, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span>匹配结果</span>
              <span style={{
                background: matches.length ? 'rgba(166, 227, 161, 0.2)' : 'rgba(243, 139, 168, 0.2)',
                padding: '2px 8px',
                borderRadius: '4px',
                color: matches.length ? '#a6e3a1' : '#f38ba8'
              }}>
                {matches.length} 个匹配
              </span>
            </div>
            <div style={{
              background: '#252536',
              border: '1px solid #3a3a5c',
              borderRadius: '8px',
              padding: '12px',
              fontFamily: 'Consolas, Monaco, monospace',
              fontSize: '13px',
              lineHeight: '1.6',
              wordBreak: 'break-all'
            }}>
              {highlightedText}
            </div>

            {/* Match Details */}
            {matches.length > 0 && (
              <div style={{ marginTop: '12px' }}>
                <div style={{ fontSize: '12px', color: '#9090a4', marginBottom: '8px', fontWeight: 600 }}>匹配详情</div>
                <div style={{ maxHeight: '150px', overflow: 'auto' }}>
                  {matches.map((match, i) => (
                    <div key={i} style={{
                      padding: '8px',
                      background: '#252536',
                      border: '1px solid #3a3a5c',
                      borderRadius: '6px',
                      marginBottom: '6px',
                      fontSize: '13px'
                    }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                        <span style={{ color: '#6c5ce7', fontWeight: 600 }}>匹配 #{i + 1}</span>
                        <span style={{ color: '#9090a4', fontSize: '11px' }}>索引: {match.index}</span>
                      </div>
                      <div style={{ color: '#e0e0e0', fontFamily: 'monospace' }}>"{match.text}"</div>
                      {Object.keys(match.groups || {}).length > 0 && (
                        <div style={{ marginTop: '6px', paddingTop: '6px', borderTop: '1px solid #3a3a5c' }}>
                          <div style={{ color: '#9090a4', fontSize: '11px', marginBottom: '4px' }}>捕获组:</div>
                          {Object.entries(match.groups || {}).map(([key, value], j) => (
                            <div key={j} style={{ fontSize: '12px', color: '#a6e3a1' }}>
                              {key}: "{value}"
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Replace */}
          <div>
            <div style={{ fontSize: '12px', color: '#9090a4', marginBottom: '8px', fontWeight: 600 }}>替换</div>
            <input
              type="text"
              value={replaceText}
              onChange={(e) => setReplaceText(e.target.value)}
              placeholder="替换文本 ($1, $2 用于分组)"
              style={{
                width: '100%',
                padding: '10px 12px',
                marginBottom: '8px',
                background: '#2d2d3e',
                border: '1px solid #3a3a5c',
                borderRadius: '8px',
                color: '#e0e0e0',
                fontSize: '14px',
                fontFamily: 'Consolas, Monaco, monospace',
                outline: 'none',
                boxSizing: 'border-box'
              }}
            />
            <div style={{ fontSize: '12px', color: '#9090a4', marginBottom: '8px', fontWeight: 600 }}>替换结果</div>
            <div style={{
              background: '#252536',
              border: '1px solid #3a3a5c',
              borderRadius: '8px',
              padding: '12px',
              fontFamily: 'Consolas, Monaco, monospace',
              fontSize: '13px',
              lineHeight: '1.6',
              wordBreak: 'break-all'
            }}>
              {replaceResult}
            </div>
          </div>
        </div>

        {/* Quick Reference */}
        <div>
          <div style={{ fontSize: '12px', color: '#9090a4', marginBottom: '8px', fontWeight: 600 }}>快速参考</div>
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(150px, 1fr))',
            gap: '8px',
            fontSize: '12px'
          }}>
            {[
              { sym: '.', desc: '任意字符' },
              { sym: '\\d', desc: '数字' },
              { sym: '\\w', desc: '单词字符' },
              { sym: '\\s', desc: '空白' },
              { sym: '^', desc: '开头' },
              { sym: '$', desc: '结尾' },
              { sym: '*', desc: '0+次' },
              { sym: '+', desc: '1+次' },
              { sym: '?', desc: '0/1次' },
              { sym: '()', desc: '分组' },
              { sym: '[^]', desc: '否定' },
              { sym: '|', desc: '或' },
            ].map((item, i) => (
              <div key={i} style={{
                background: '#252536',
                border: '1px solid #3a3a5c',
                borderRadius: '6px',
                padding: '8px',
                display: 'flex',
                gap: '8px',
                alignItems: 'center'
              }}>
                <code style={{ color: '#6c5ce7', fontWeight: 'bold' }}>{item.sym}</code>
                <span style={{ color: '#9090a4' }}>{item.desc}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
