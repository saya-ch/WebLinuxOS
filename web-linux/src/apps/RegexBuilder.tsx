import { useState, useCallback, useMemo } from 'react'
import { Code2, Copy, AlertCircle, BookOpen, Trash2, Play } from 'lucide-react'

interface RegexPattern {
  id: string
  name: string
  pattern: string
  description: string
  category: string
}

const commonPatterns: RegexPattern[] = [
  { id: '1', name: '邮箱地址', pattern: '[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\\.[a-zA-Z]{2,}', description: '匹配标准邮箱格式', category: '常用' },
  { id: '2', name: '手机号码', pattern: '1[3-9]\\d{9}', description: '匹配中国大陆手机号', category: '常用' },
  { id: '3', name: 'URL', pattern: 'https?:\\/\\/[\\w\\-._~:/?#[\\]@!$&\'()*+,;=%]+', description: '匹配HTTP/HTTPS URL', category: '常用' },
  { id: '4', name: 'IP地址', pattern: '(?:(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\\.){3}(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)', description: '匹配IPv4地址', category: '网络' },
  { id: '5', name: '日期(YYYY-MM-DD)', pattern: '\\d{4}-(?:0[1-9]|1[0-2])-(?:0[1-9]|[12][0-9]|3[01])', description: '匹配ISO日期格式', category: '日期时间' },
  { id: '6', name: '身份证号', pattern: '[1-9]\\d{5}(?:18|19|20)\\d{2}(?:0[1-9]|1[0-2])(?:0[1-9]|[12][0-9]|3[01])\\d{3}[0-9Xx]', description: '匹配18位身份证号', category: '常用' },
  { id: '7', name: '中文字符', pattern: '[\\u4e00-\\u9fa5]+', description: '匹配中文字符', category: '文本' },
  { id: '8', name: 'HTML标签', pattern: '<([a-zA-Z][a-zA-Z0-9]*)\\b[^>]*>([\\s\\S]*?)<\\/\\1>', description: '匹配HTML标签及其内容', category: '代码' },
  { id: '9', name: '十六进制颜色', pattern: '#(?:[0-9a-fA-F]{3}){1,2}', description: '匹配十六进制颜色值', category: '代码' },
  { id: '10', name: '数字', pattern: '-?\\d+(?:\\.\\d+)?', description: '匹配整数或小数', category: '常用' },
  { id: '11', name: '用户名', pattern: '[a-zA-Z][a-zA-Z0-9_]{2,15}', description: '字母开头，3-16位字母数字下划线', category: '常用' },
  { id: '12', name: '密码强度', pattern: '(?=.*[a-z])(?=.*[A-Z])(?=.*\\d)(?=.*[@$!%*?&])[A-Za-z\\d@$!%*?&]{8,}', description: '至少8位，包含大小写字母、数字和特殊字符', category: '安全' },
]

const regexFlags: { flag: string; name: string; description: string }[] = [
  { flag: 'g', name: 'global', description: '全局匹配' },
  { flag: 'i', name: 'ignoreCase', description: '忽略大小写' },
  { flag: 'm', name: 'multiline', description: '多行模式' },
  { flag: 's', name: 'dotAll', description: '.匹配换行符' },
  { flag: 'u', name: 'unicode', description: 'Unicode模式' },
]

export default function RegexBuilder() {
  const [pattern, setPattern] = useState('')
  const [testString, setTestString] = useState('')
  const [flags, setFlags] = useState<string[]>(['g'])
  const [matches, setMatches] = useState<string[]>([])
  const [error, setError] = useState<string | null>(null)
  const [savedPatterns, setSavedPatterns] = useState<RegexPattern[]>([])

  const toggleFlag = useCallback((flag: string) => {
    setFlags(prev => 
      prev.includes(flag) 
        ? prev.filter(f => f !== flag)
        : [...prev, flag]
    )
  }, [])

  const validateRegex = useCallback(() => {
    if (!pattern) {
      setError(null)
      setMatches([])
      return
    }
    try {
      new RegExp(pattern, flags.join(''))
      setError(null)
    } catch (e) {
      setError((e as Error).message)
      setMatches([])
    }
  }, [pattern, flags])

  const executeTest = useCallback(() => {
    if (!pattern || !testString) {
      setMatches([])
      return
    }
    try {
      const regex = new RegExp(pattern, flags.join(''))
      const results: string[] = []
      let match

      if (flags.includes('g')) {
        while ((match = regex.exec(testString)) !== null) {
          results.push(match[0])
          if (match[0].length === 0) regex.lastIndex++
        }
      } else {
        match = regex.exec(testString)
        if (match) results.push(match[0])
      }
      
      setMatches(results)
      setError(null)
    } catch (e) {
      setError((e as Error).message)
      setMatches([])
    }
  }, [pattern, testString, flags])

  const copyPattern = useCallback(() => {
    navigator.clipboard.writeText(pattern)
  }, [pattern])

  const savePattern = useCallback(() => {
    if (!pattern) return
    const newPattern: RegexPattern = {
      id: Date.now().toString(),
      name: `自定义模式 ${savedPatterns.length + 1}`,
      pattern,
      description: '自定义正则表达式',
      category: '自定义'
    }
    setSavedPatterns(prev => [...prev, newPattern])
  }, [pattern, savedPatterns.length])

  const loadPattern = useCallback((p: RegexPattern) => {
    setPattern(p.pattern)
  }, [])

  const deletePattern = useCallback((id: string) => {
    setSavedPatterns(prev => prev.filter(p => p.id !== id))
  }, [])

  const highlightedText = useMemo(() => {
    if (!pattern || !testString || matches.length === 0) {
      return testString
    }

    try {
      const parts: React.ReactNode[] = []
      let lastIndex = 0
      let match

      const tempString = testString
      const testRegex = new RegExp(pattern, flags.includes('g') ? flags.join('') : flags.join('') + 'g')
      
      while ((match = testRegex.exec(tempString)) !== null) {
        if (match.index > lastIndex) {
          parts.push(<span key={`text-${lastIndex}`}>{tempString.slice(lastIndex, match.index)}</span>)
        }
        parts.push(
          <mark 
            key={`match-${match.index}`}
            style={{ 
              backgroundColor: '#fbbf24', 
              color: '#1f2937', 
              padding: '2px 4px', 
              borderRadius: '4px',
              fontWeight: 500
            }}
          >
            {match[0]}
          </mark>
        )
        lastIndex = match.index + match[0].length
        if (match[0].length === 0) testRegex.lastIndex++
      }

      if (lastIndex < tempString.length) {
        parts.push(<span key={`text-end`}>{tempString.slice(lastIndex)}</span>)
      }

      return parts
    } catch {
      return testString
    }
  }, [pattern, testString, matches, flags])

  const categories = [...new Set([...commonPatterns, ...savedPatterns].map(p => p.category))]

  return (
    <div className="app-container app-regex-builder" style={{
      background: 'linear-gradient(180deg, #1e1b4b 0%, #312e81 100%)',
      padding: 20,
      height: '100%',
      overflowY: 'auto',
      color: '#fff'
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 24 }}>
        <div style={{ padding: 12, background: 'rgba(255,255,255,0.1)', borderRadius: 12 }}>
          <Code2 size={28} />
        </div>
        <div>
          <h2 style={{ margin: 0, fontSize: 22, fontWeight: 700 }}>正则表达式构建器</h2>
          <p style={{ margin: 4, fontSize: 13, color: 'rgba(255,255,255,0.6)' }}>可视化构建和测试正则表达式</p>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 20 }}>
        <div>
          <label style={{ display: 'block', fontSize: 14, fontWeight: 600, marginBottom: 8 }}>正则表达式</label>
          <div style={{ display: 'flex', gap: 8 }}>
            <div style={{ flex: 1, display: 'flex', background: 'rgba(0,0,0,0.3)', borderRadius: 12, overflow: 'hidden' }}>
              <span style={{ padding: '14px 12px', background: 'rgba(255,255,255,0.1)', fontSize: 16 }}>/</span>
              <input
                type="text"
                value={pattern}
                onChange={(e) => {
                  setPattern(e.target.value)
                  validateRegex()
                }}
                placeholder="输入正则表达式..."
                style={{
                  flex: 1,
                  padding: '14px 12px',
                  background: 'transparent',
                  border: 'none',
                  color: '#fff',
                  fontSize: 16,
                  fontFamily: 'monospace'
                }}
              />
              <span style={{ padding: '14px 12px', background: 'rgba(255,255,255,0.1)', fontSize: 16 }}>/{flags.join('')}</span>
            </div>
            <button
              onClick={copyPattern}
              disabled={!pattern}
              style={{
                padding: '14px 16px',
                background: 'rgba(255,255,255,0.15)',
                border: 'none',
                borderRadius: 12,
                color: '#fff',
                cursor: pattern ? 'pointer' : 'not-allowed',
                transition: 'all 0.2s',
                opacity: pattern ? 1 : 0.5
              }}
              title="复制正则表达式"
            >
              <Copy size={18} />
            </button>
          </div>
          
          {error && (
            <div style={{ 
              marginTop: 12, 
              padding: 12, 
              background: 'rgba(239, 68, 68, 0.2)', 
              borderRadius: 8,
              display: 'flex',
              alignItems: 'center',
              gap: 8,
              color: '#fca5a5'
            }}>
              <AlertCircle size={16} />
              <span style={{ fontSize: 13 }}>{error}</span>
            </div>
          )}
        </div>

        <div>
          <label style={{ display: 'block', fontSize: 14, fontWeight: 600, marginBottom: 8 }}>标志位</label>
          <div style={{ display: 'flex', gap: 8 }}>
            {regexFlags.map(({ flag, name, description }) => (
              <button
                key={flag}
                onClick={() => toggleFlag(flag)}
                style={{
                  padding: '10px 14px',
                  background: flags.includes(flag) 
                    ? 'linear-gradient(145deg, #8b5cf6, #7c3aed)' 
                    : 'rgba(255,255,255,0.1)',
                  border: 'none',
                  borderRadius: 8,
                  color: '#fff',
                  cursor: 'pointer',
                  fontSize: 13,
                  transition: 'all 0.2s',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  gap: 2
                }}
                title={description}
              >
                <span style={{ fontWeight: 600 }}>{flag}</span>
                <span style={{ fontSize: 10, opacity: 0.8 }}>{name}</span>
              </button>
            ))}
          </div>
        </div>
      </div>

      <div style={{ marginBottom: 20 }}>
        <label style={{ display: 'block', fontSize: 14, fontWeight: 600, marginBottom: 8 }}>测试文本</label>
        <textarea
          value={testString}
          onChange={(e) => {
            setTestString(e.target.value)
            executeTest()
          }}
          placeholder="在此输入要测试的文本..."
          rows={4}
          style={{
            width: '100%',
            padding: 14,
            background: 'rgba(0,0,0,0.3)',
            border: '1px solid rgba(255,255,255,0.1)',
            borderRadius: 12,
            color: '#fff',
            fontSize: 14,
            fontFamily: 'monospace',
            resize: 'vertical'
          }}
        />
      </div>

      <div style={{ marginBottom: 20 }}>
        <label style={{ display: 'block', fontSize: 14, fontWeight: 600, marginBottom: 8 }}>匹配结果</label>
        <div 
          style={{
            padding: 14,
            background: 'rgba(0,0,0,0.3)',
            border: '1px solid rgba(255,255,255,0.1)',
            borderRadius: 12,
            minHeight: 80,
            fontFamily: 'monospace',
            fontSize: 14,
            whiteSpace: 'pre-wrap',
            wordBreak: 'break-all'
          }}
        >
          {testString ? highlightedText : <span style={{ color: 'rgba(255,255,255,0.4)' }}>匹配结果将在此显示...</span>}
        </div>
        {matches.length > 0 && (
          <div style={{ marginTop: 12, display: 'flex', alignItems: 'center', gap: 12 }}>
            <span style={{ fontSize: 13, color: 'rgba(255,255,255,0.6)' }}>
              找到 <span style={{ color: '#4ade80', fontWeight: 600 }}>{matches.length}</span> 个匹配
            </span>
            <button
              onClick={savePattern}
              style={{
                padding: '8px 16px',
                background: 'linear-gradient(145deg, #4ade80, #22c55e)',
                border: 'none',
                borderRadius: 8,
                color: '#1f2937',
                cursor: 'pointer',
                fontSize: 13,
                fontWeight: 600,
                transition: 'all 0.2s'
              }}
            >
              <SaveIcon /> 保存模式
            </button>
          </div>
        )}
      </div>

      <div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
          <BookOpen size={18} />
          <h3 style={{ margin: 0, fontSize: 16, fontWeight: 600 }}>常用模式库</h3>
        </div>
        
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginBottom: 16 }}>
          {categories.map(cat => (
            <button
              key={cat}
              style={{
                padding: '6px 14px',
                background: 'rgba(255,255,255,0.1)',
                border: 'none',
                borderRadius: 20,
                color: '#fff',
                cursor: 'pointer',
                fontSize: 13,
                transition: 'all 0.2s'
              }}
            >
              {cat}
            </button>
          ))}
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
          {[...commonPatterns, ...savedPatterns].map((p) => (
            <div
              key={p.id}
              style={{
                padding: 16,
                background: 'rgba(255,255,255,0.08)',
                borderRadius: 12,
                border: '1px solid rgba(255,255,255,0.05)',
                transition: 'all 0.2s',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'flex-start'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = 'rgba(255,255,255,0.12)'
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = 'rgba(255,255,255,0.08)'
              }}
            >
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                  <span style={{ fontWeight: 600, fontSize: 14 }}>{p.name}</span>
                  <span style={{ fontSize: 10, padding: '2px 6px', background: 'rgba(139, 92, 246, 0.3)', borderRadius: 4 }}>{p.category}</span>
                </div>
                <code style={{ fontSize: 12, color: '#a5b4fc', fontFamily: 'monospace', wordBreak: 'break-all' }}>
                  {p.pattern}
                </code>
                <p style={{ fontSize: 12, color: 'rgba(255,255,255,0.5)', margin: '8px 0 0' }}>{p.description}</p>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                <button
                  onClick={() => loadPattern(p)}
                  style={{
                    padding: '6px 12px',
                    background: 'linear-gradient(145deg, #6366f1, #4f46e5)',
                    border: 'none',
                    borderRadius: 6,
                    color: '#fff',
                    cursor: 'pointer',
                    fontSize: 12,
                    transition: 'all 0.2s'
                  }}
                >
                  <Play size={14} />
                </button>
                {savedPatterns.find(sp => sp.id === p.id) && (
                  <button
                    onClick={() => deletePattern(p.id)}
                    style={{
                      padding: '6px 12px',
                      background: 'rgba(239, 68, 68, 0.3)',
                      border: 'none',
                      borderRadius: 6,
                      color: '#fca5a5',
                      cursor: 'pointer',
                      fontSize: 12,
                      transition: 'all 0.2s'
                    }}
                  >
                    <Trash2 size={14} />
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      <style>{`
        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.5; }
        }
      `}</style>
    </div>
  )
}

function SaveIcon() {
  return (
    <svg viewBox="0 0 24 24" width="16" height="16" stroke="currentColor" strokeWidth="2" fill="none">
      <path d="M19 12V7a2 2 0 0 0-2-2H7a2 2 0 0 0-2 2v10a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2z" />
      <polyline points="12 15 15 18 21 12" />
      <line x1="19" y1="9" x2="5" y2="9" />
    </svg>
  )
}
