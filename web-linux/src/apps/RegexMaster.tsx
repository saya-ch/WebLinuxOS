import { useState, useMemo, type ReactElement } from 'react'
import { Code2, Copy, Check, BookOpen, Play, Lightbulb, Layers, ChevronRight, RotateCcw, Star, Quote } from 'lucide-react'

interface RegexPreset {
  name: string
  pattern: string
  flags: string
  description: string
  category: string
  examples: string[]
}

const PRESETS: RegexPreset[] = [
  {
    name: '邮箱地址',
    pattern: '[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\\.[a-zA-Z]{2,}',
    flags: 'g',
    description: '匹配标准电子邮件地址格式',
    category: '常用验证',
    examples: ['user@example.com', 'test.user+tag@domain.co.uk'],
  },
  {
    name: 'URL链接',
    pattern: 'https?://[a-zA-Z0-9.-]+(?:/[a-zA-Z0-9._~:/?#\\[\\]@!$&\'()*+,;=-]*)?',
    flags: 'g',
    description: '匹配 HTTP/HTTPS URL',
    category: '常用验证',
    examples: ['https://example.com', 'http://localhost:3000/path?q=1'],
  },
  {
    name: '电话号码',
    pattern: '1[3-9]\\d{9}',
    flags: 'g',
    description: '匹配中国大陆手机号码',
    category: '常用验证',
    examples: ['13812345678', '15998765432'],
  },
  {
    name: 'IPv4地址',
    pattern: '(?:(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\\.){3}(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)',
    flags: 'g',
    description: '匹配 IPv4 地址',
    category: '网络相关',
    examples: ['192.168.1.1', '10.0.0.1', '255.255.255.0'],
  },
  {
    name: '日期 (YYYY-MM-DD)',
    pattern: '\\d{4}-(?:0[1-9]|1[0-2])-(?:0[1-9]|[12]\\d|3[01])',
    flags: 'g',
    description: '匹配 ISO 日期格式',
    category: '日期时间',
    examples: ['2024-01-15', '2023-12-31'],
  },
  {
    name: '时间 (HH:MM:SS)',
    pattern: '(?:[01]\\d|2[0-3]):[0-5]\\d:[0-5]\\d',
    flags: 'g',
    description: '匹配 24 小时制时间',
    category: '日期时间',
    examples: ['14:30:00', '23:59:59'],
  },
  {
    name: '中文字符',
    pattern: '[\\u4e00-\\u9fa5]+',
    flags: 'g',
    description: '匹配中文字符',
    category: '文本处理',
    examples: ['你好世界', '正则表达式'],
  },
  {
    name: 'HTML标签',
    pattern: '<[^>]+>',
    flags: 'g',
    description: '匹配 HTML 标签',
    category: '文本处理',
    examples: ['<div>', '<img src="test.jpg">'],
  },
  {
    name: 'Markdown链接',
    pattern: '\\[([^\\]]+)\\]\\(([^)]+)\\)',
    flags: 'g',
    description: '匹配 Markdown 格式链接',
    category: '文本处理',
    examples: ['[Google](https://google.com)'],
  },
  {
    name: '十六进制颜色',
    pattern: '#(?:[0-9a-fA-F]{3}){1,2}\\b',
    flags: 'g',
    description: '匹配十六进制颜色代码',
    category: '编程相关',
    examples: ['#fff', '#ff5733', '#000000'],
  },
  {
    name: 'UUID',
    pattern: '[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}',
    flags: 'g',
    description: '匹配 UUID v4 格式',
    category: '编程相关',
    examples: ['550e8400-e29b-41d4-a716-446655440000'],
  },
  {
    name: 'JWT令牌',
    pattern: 'eyJ[A-Za-z0-9_-]+\\.eyJ[A-Za-z0-9_-]+\\.[A-Za-z0-9_-]+',
    flags: 'g',
    description: '匹配 JWT Token',
    category: '编程相关',
    examples: ['eyJhbGciOi...payload.signature'],
  },
]

const CATEGORIES = ['全部', ...new Set(PRESETS.map(p => p.category))]

interface MatchResult {
  start: number
  end: number
  text: string
  groups: string[]
}

export default function RegexMaster() {
  const [pattern, setPattern] = useState('')
  const [flags, setFlags] = useState('g')
  const [testText, setTestText] = useState(
    '示例文本：\n邮箱：user@example.com, admin@test.org\n网址：https://google.com, http://localhost:8080\n电话：13812345678, 15998765432\n日期：2024-01-15, 2023-12-31\nIP：192.168.1.1, 10.0.0.1\n颜色：#fff, #ff5733, #000000'
  )
  const [selectedCategory, setSelectedCategory] = useState('全部')
  const [copied, setCopied] = useState(false)
  const [savedPatterns, setSavedPatterns] = useState<{ name: string; pattern: string; flags: string }[]>([])

  const matches = useMemo<MatchResult[]>(() => {
    if (!pattern) return []
    try {
      const regex = new RegExp(pattern, flags)
      const results: MatchResult[] = []
      let match
      while ((match = regex.exec(testText)) !== null) {
        results.push({
          start: match.index,
          end: match.index + match[0].length,
          text: match[0],
          groups: match.slice(1),
        })
        if (!regex.global) break
        if (match[0].length === 0) regex.lastIndex++
      }
      return results
    } catch {
      return []
    }
  }, [pattern, flags, testText])

  const isValid = useMemo(() => {
    if (!pattern) return true
    try {
      new RegExp(pattern, flags)
      return true
    } catch {
      return false
    }
  }, [pattern, flags])

  const filteredPresets = selectedCategory === '全部' 
    ? PRESETS 
    : PRESETS.filter(p => p.category === selectedCategory)

  const loadPreset = (preset: RegexPreset) => {
    setPattern(preset.pattern)
    setFlags(preset.flags)
  }

  const copyPattern = async () => {
    if (!pattern) return
    try {
      await navigator.clipboard.writeText(`/${pattern}/${flags}`)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch {}
  }

  const savePattern = () => {
    if (!pattern) return
    const name = prompt('命名这个正则表达式：')
    if (!name) return
    const updated = [...savedPatterns, { name, pattern, flags }]
    setSavedPatterns(updated)
    localStorage.setItem('regexmaster-saved', JSON.stringify(updated))
  }

  const loadSavedPatterns = () => {
    try {
      const raw = localStorage.getItem('regexmaster-saved')
      return raw ? JSON.parse(raw) : []
    } catch {
      return []
    }
  }

  const toggleFlag = (flag: string) => {
    setFlags(prev => prev.includes(flag) ? prev.replace(flag, '') : prev + flag)
  }

  const renderHighlightedText = () => {
    if (matches.length === 0 || !isValid || !pattern) {
      return <span>{testText}</span>
    }

    const sortedMatches = [...matches].sort((a, b) => a.start - b.start)
    const parts: ReactElement[] = []
    let lastIndex = 0

    sortedMatches.forEach((match, idx) => {
      if (match.start > lastIndex) {
        parts.push(<span key={`text-${idx}`}>{testText.slice(lastIndex, match.start)}</span>)
      }
      parts.push(
        <mark
          key={`match-${idx}`}
          style={{
            background: 'rgba(34,197,94,0.4)',
            color: '#22c55e',
            padding: '2px 0',
            borderRadius: 2,
            fontWeight: 500,
          }}
        >
          {testText.slice(match.start, match.end)}
        </mark>
      )
      lastIndex = match.end
    })

    if (lastIndex < testText.length) {
      parts.push(<span key="text-end">{testText.slice(lastIndex)}</span>)
    }

    return <>{parts}</>
  }

  return (
    <div style={{
      width: '100%',
      height: '100%',
      display: 'flex',
      flexDirection: 'column',
      background: 'linear-gradient(135deg, #1a1a2e 0%, #16213e 100%)',
      color: '#fff',
      padding: 20,
      gap: 16,
      overflow: 'auto',
    }}>
      <div style={{ textAlign: 'center' }}>
        <h1 style={{ fontSize: 22, fontWeight: 700, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
          <Code2 size={22} />
          RegexMaster 正则大师
        </h1>
        <p style={{ opacity: 0.6, fontSize: 12, marginTop: 4 }}>
          正则表达式在线测试与学习
        </p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '280px 1fr', gap: 16, flex: 1 }}>
        {/* Left Sidebar - Presets */}
        <div style={{
          background: 'rgba(255,255,255,0.06)',
          borderRadius: 12,
          padding: 16,
          overflow: 'auto',
        }}>
          <h3 style={{ fontSize: 14, fontWeight: 600, marginBottom: 12, display: 'flex', alignItems: 'center', gap: 6 }}>
            <BookOpen size={14} />
            预设模板
          </h3>

          <div style={{ display: 'flex', gap: 4, marginBottom: 12, flexWrap: 'wrap' }}>
            {CATEGORIES.map(cat => (
              <button
                key={cat}
                onClick={() => setSelectedCategory(cat)}
                style={{
                  padding: '4px 10px',
                  borderRadius: 12,
                  border: 'none',
                  cursor: 'pointer',
                  fontSize: 11,
                  background: selectedCategory === cat ? '#3b82f6' : 'rgba(255,255,255,0.1)',
                  color: selectedCategory === cat ? '#fff' : 'rgba(255,255,255,0.7)',
                }}
              >
                {cat}
              </button>
            ))}
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {filteredPresets.map(preset => (
              <button
                key={preset.name}
                onClick={() => loadPreset(preset)}
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'flex-start',
                  padding: 10,
                  borderRadius: 8,
                  border: '1px solid rgba(255,255,255,0.1)',
                  cursor: 'pointer',
                  background: 'transparent',
                  color: '#fff',
                  fontSize: 13,
                  transition: 'all 0.2s',
                  textAlign: 'left',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = 'rgba(59,130,246,0.2)'
                  e.currentTarget.style.borderColor = '#3b82f6'
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = 'transparent'
                  e.currentTarget.style.borderColor = 'rgba(255,255,255,0.1)'
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: 6, width: '100%' }}>
                  <span style={{ fontWeight: 600 }}>{preset.name}</span>
                  <ChevronRight size={12} style={{ marginLeft: 'auto', opacity: 0.5 }} />
                </div>
                <div style={{ fontSize: 11, opacity: 0.6, marginTop: 4 }}>{preset.description}</div>
              </button>
            ))}
          </div>

          {loadSavedPatterns().length > 0 && (
            <div style={{ marginTop: 16 }}>
              <h4 style={{ fontSize: 12, fontWeight: 600, opacity: 0.7, marginBottom: 8, display: 'flex', alignItems: 'center', gap: 4 }}>
                <Star size={12} />
                我保存的
              </h4>
              {loadSavedPatterns().map((p: { name: string; pattern: string; flags: string }) => (
                <button
                  key={p.name}
                  onClick={() => { setPattern(p.pattern); setFlags(p.flags) }}
                  style={{
                    display: 'block',
                    width: '100%',
                    padding: '6px 10px',
                    marginBottom: 4,
                    borderRadius: 6,
                    border: 'none',
                    cursor: 'pointer',
                    fontSize: 12,
                    background: 'rgba(251,191,36,0.15)',
                    color: '#fbbf24',
                    textAlign: 'left',
                  }}
                >
                  {p.name}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Right Main Panel */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {/* Pattern Input */}
          <div style={{
            background: 'rgba(255,255,255,0.06)',
            borderRadius: 12,
            padding: 16,
          }}>
            <div style={{ display: 'flex', gap: 8, marginBottom: 12 }}>
              <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: 4,
                background: 'rgba(0,0,0,0.3)',
                borderRadius: 8,
                padding: '8px 12px',
                fontFamily: 'monospace',
                fontSize: 14,
              }}>
                <span style={{ opacity: 0.5 }}>/</span>
                <input
                  value={pattern}
                  onChange={(e) => setPattern(e.target.value)}
                  placeholder="输入正则表达式..."
                  style={{
                    background: 'transparent',
                    border: 'none',
                    color: isValid ? '#22c55e' : '#ef4444',
                    outline: 'none',
                    width: 300,
                    fontFamily: 'monospace',
                  }}
                />
                <span style={{ opacity: 0.5 }}>/</span>
                <span style={{ opacity: 0.5 }}>{flags}</span>
              </div>

              <button
                onClick={copyPattern}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 4,
                  padding: '8px 12px',
                  borderRadius: 8,
                  border: 'none',
                  cursor: 'pointer',
                  background: copied ? '#22c55e' : 'rgba(255,255,255,0.1)',
                  color: '#fff',
                }}
              >
                {copied ? <Check size={14} /> : <Copy size={14} />}
              </button>

              <button
                onClick={() => { setPattern(''); setFlags('g') }}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 4,
                  padding: '8px 12px',
                  borderRadius: 8,
                  border: 'none',
                  cursor: 'pointer',
                  background: 'rgba(255,255,255,0.1)',
                  color: '#fff',
                }}
              >
                <RotateCcw size={14} />
              </button>

              <button
                onClick={savePattern}
                disabled={!pattern}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 4,
                  padding: '8px 12px',
                  borderRadius: 8,
                  border: 'none',
                  cursor: pattern ? 'pointer' : 'not-allowed',
                  background: pattern ? 'rgba(251,191,36,0.2)' : 'rgba(255,255,255,0.05)',
                  color: pattern ? '#fbbf24' : 'rgba(255,255,255,0.5)',
                }}
              >
                <Star size={14} />
                保存
              </button>
            </div>

            {!isValid && (
              <div style={{
                padding: '8px 12px',
                background: 'rgba(239,68,68,0.2)',
                borderRadius: 8,
                color: '#ef4444',
                fontSize: 12,
                marginBottom: 12,
              }}>
                ⚠️ 正则表达式格式错误，请检查语法
              </div>
            )}

            {/* Flags */}
            <div style={{ display: 'flex', gap: 8 }}>
              {[
                { flag: 'g', label: '全局匹配', desc: 'Global' },
                { flag: 'i', label: '忽略大小写', desc: 'Ignore Case' },
                { flag: 'm', label: '多行模式', desc: 'Multiline' },
                { flag: 's', label: '单行模式', desc: 'Dot All' },
                { flag: 'u', label: 'Unicode', desc: 'Unicode' },
              ].map(({ flag, label }) => (
                <button
                  key={flag}
                  onClick={() => toggleFlag(flag)}
                  style={{
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    padding: '6px 10px',
                    borderRadius: 6,
                    border: `1px solid ${flags.includes(flag) ? '#3b82f6' : 'rgba(255,255,255,0.2)'}`,
                    cursor: 'pointer',
                    background: flags.includes(flag) ? 'rgba(59,130,246,0.2)' : 'transparent',
                    color: '#fff',
                    fontSize: 11,
                    transition: 'all 0.2s',
                  }}
                >
                  <span style={{ fontWeight: 600 }}>{flag}</span>
                  <span style={{ opacity: 0.6 }}>{label}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Test Text */}
          <div style={{
            background: 'rgba(255,255,255,0.06)',
            borderRadius: 12,
            padding: 16,
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
              <h3 style={{ fontSize: 14, fontWeight: 600, display: 'flex', alignItems: 'center', gap: 6 }}>
                <Quote size={14} />
                测试文本
              </h3>
              <span style={{ fontSize: 12, opacity: 0.6 }}>
                找到 {matches.length} 个匹配
              </span>
            </div>
            <textarea
              value={testText}
              onChange={(e) => setTestText(e.target.value)}
              style={{
                width: '100%',
                minHeight: 120,
                background: 'rgba(0,0,0,0.3)',
                border: 'none',
                borderRadius: 8,
                padding: 12,
                color: '#fff',
                fontSize: 13,
                fontFamily: 'monospace',
                resize: 'vertical',
                outline: 'none',
              }}
            />
          </div>

          {/* Highlighted Result */}
          <div style={{
            background: 'rgba(255,255,255,0.06)',
            borderRadius: 12,
            padding: 16,
          }}>
            <h3 style={{ fontSize: 14, fontWeight: 600, marginBottom: 8, display: 'flex', alignItems: 'center', gap: 6 }}>
              <Play size={14} />
              高亮结果
            </h3>
            <div style={{
              background: 'rgba(0,0,0,0.3)',
              borderRadius: 8,
              padding: 12,
              minHeight: 100,
              fontSize: 13,
              fontFamily: 'monospace',
              whiteSpace: 'pre-wrap',
              wordBreak: 'break-all',
            }}>
              {renderHighlightedText()}
            </div>
          </div>

          {/* Match Details */}
          {matches.length > 0 && (
            <div style={{
              background: 'rgba(255,255,255,0.06)',
              borderRadius: 12,
              padding: 16,
              maxHeight: 200,
              overflow: 'auto',
            }}>
              <h3 style={{ fontSize: 14, fontWeight: 600, marginBottom: 12, display: 'flex', alignItems: 'center', gap: 6 }}>
                <Layers size={14} />
                匹配详情
              </h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {matches.slice(0, 20).map((match, idx) => (
                  <div
                    key={idx}
                    style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      padding: '8px 12px',
                      background: 'rgba(34,197,94,0.1)',
                      borderRadius: 6,
                      fontSize: 12,
                      fontFamily: 'monospace',
                    }}
                  >
                    <span style={{ color: '#22c55e' }}>#{idx + 1}</span>
                    <span style={{ flex: 1, margin: '0 8px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {match.text}
                    </span>
                    <span style={{ opacity: 0.6 }}>
                      [{match.start}-{match.end}]
                    </span>
                  </div>
                ))}
                {matches.length > 20 && (
                  <div style={{ textAlign: 'center', opacity: 0.6, fontSize: 12 }}>
                    还有 {matches.length - 20} 个匹配...
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Tips */}
          <div style={{
            background: 'rgba(251,191,36,0.1)',
            borderRadius: 12,
            padding: 12,
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
              <Lightbulb size={16} style={{ color: '#fbbf24' }} />
              <span style={{ fontWeight: 600, color: '#fbbf24', fontSize: 13 }}>快速参考</span>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: 8, fontSize: 11 }}>
              {[
                { syntax: '.', meaning: '任意字符' },
                { syntax: '\\d', meaning: '数字 [0-9]' },
                { syntax: '\\w', meaning: '单词字符' },
                { syntax: '\\s', meaning: '空白字符' },
                { syntax: '*', meaning: '0次或多次' },
                { syntax: '+', meaning: '1次或多次' },
                { syntax: '?', meaning: '0次或1次' },
                { syntax: '{n}', meaning: '恰好n次' },
                { syntax: '[]', meaning: '字符集' },
                { syntax: '()', meaning: '捕获组' },
                { syntax: '^', meaning: '开始' },
                { syntax: '$', meaning: '结束' },
              ].map(({ syntax, meaning }) => (
                <div key={syntax} style={{ display: 'flex', gap: 8 }}>
                  <code style={{ color: '#fbbf24', background: 'rgba(0,0,0,0.3)', padding: '2px 6px', borderRadius: 4 }}>
                    {syntax}
                  </code>
                  <span style={{ opacity: 0.7 }}>{meaning}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
