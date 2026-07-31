import { useState, useCallback, useMemo } from 'react'
import {
  Code2, CheckCircle, XCircle, Lightbulb, Trophy, ChevronRight, Target, Zap,
} from 'lucide-react'

interface Challenge {
  id: number
  title: string
  description: string
  category: string
  mustMatch: string[]
  mustNotMatch: string[]
  hint: string
  difficulty: number
}

const challenges: Challenge[] = [
  // Basics
  { id: 1, title: '匹配所有', description: '匹配任何非空字符串', category: '基础', mustMatch: ['hello', 'world', 'x', '123'], mustNotMatch: [''], hint: '试试 .+', difficulty: 1 },
  { id: 2, title: '仅数字', description: '只匹配纯数字字符串', category: '基础', mustMatch: ['123', '0', '999'], mustNotMatch: ['abc', '12a', 'a1', ''], hint: '使用 \\d 和量词', difficulty: 1 },
  { id: 3, title: '仅字母', description: '只匹配纯字母字符串', category: '基础', mustMatch: ['abc', 'Hello', 'z'], mustNotMatch: ['123', 'a1', '1a', ''], hint: '使用 [a-zA-Z] 和量词', difficulty: 1 },
  // Character Classes
  { id: 4, title: '元音字母', description: '只包含元音字母的字符串', category: '字符类', mustMatch: ['aeiou', 'a', 'eee'], mustNotMatch: ['bcd', 'abc', 'xyz', ''], hint: '使用 [aeiou]', difficulty: 2 },
  { id: 5, title: '十六进制', description: '匹配十六进制数字(0-9, a-f, A-F)', category: '字符类', mustMatch: ['1A2B', 'ff00', '0'], mustNotMatch: ['GH', '1G', 'xyz', ''], hint: '使用 [0-9a-fA-F]', difficulty: 2 },
  { id: 6, title: '非元音', description: '只包含辅音字母的字符串', category: '字符类', mustMatch: ['bcdfg', 'xyz', 'b'], mustNotMatch: ['aeiou', 'ba', 'abc', ''], hint: '使用 [b-df-hj-np-tv-z]', difficulty: 2 },
  // Quantifiers
  { id: 7, title: '三个字符', description: '恰好三个字符的字符串', category: '量词', mustMatch: ['abc', '123', 'xyz'], mustNotMatch: ['ab', 'abcd', 'a', ''], hint: '使用 {3}', difficulty: 2 },
  { id: 8, title: '重复字符', description: '包含连续重复字符的字符串', category: '量词', mustMatch: ['aab', 'hello', 'book'], mustNotMatch: ['abc', 'xyz', 'ab'], hint: '使用反向引用: (.)\\1', difficulty: 3 },
  { id: 9, title: '偶数长度', description: '匹配长度为偶数的字符串', category: '量词', mustMatch: ['ab', 'abcd', '1234'], mustNotMatch: ['a', 'abc', 'abcde', ''], hint: '使用(..)+ 匹配成对字符', difficulty: 3 },
  // Groups
  { id: 10, title: '回文两字符', description: '匹配两个字符的回文(如 aa, bb)', category: '分组', mustMatch: ['aa', 'bb', 'zz'], mustNotMatch: ['ab', 'ba', 'abc', ''], hint: '使用 (.)\\1', difficulty: 3 },
  { id: 11, title: 'IP样式', description: '匹配形如 X.X.X.X 的格式(每段1-3位数字)', category: '分组', mustMatch: ['192.168.1.1', '0.0.0.0', '255.255.255.255'], mustNotMatch: ['1.2', 'a.b.c.d', '1.2.3', ''], hint: '使用 \\d{1,3} 和重复分组', difficulty: 4 },
  // Lookahead
  { id: 12, title: '包含数字和字母', description: '同时包含至少一个数字和一个字母', category: '前瞻', mustMatch: ['a1', '1a', 'abc123'], mustNotMatch: ['123', 'abc', '!!!', ''], hint: '使用前瞻断言 (?=.*\\d)(?=.*[a-zA-Z])', difficulty: 4 },
  { id: 13, title: '无连续重复', description: '没有连续相同字符的字符串', category: '前瞻', mustMatch: ['abc', '121', 'abab'], mustNotMatch: ['aab', '112', 'abb'], hint: '使用负向前瞻 (?!.*(.)\\1)', difficulty: 5 },
  // Advanced
  { id: 14, title: '有效日期', description: '匹配 YYYY-MM-DD 格式日期', category: '高级', mustMatch: ['2024-01-15', '2000-12-31', '1999-06-01'], mustNotMatch: ['2024-13-01', '24-1-1', 'abcd-ef-gh', ''], hint: '使用 \\d{4}-(?:0[1-9]|1[0-2])-(?:0[1-9]|[12]\\d|3[01])', difficulty: 5 },
  { id: 15, title: '平衡括号', description: '匹配只含括号且基本平衡的短字符串', category: '高级', mustMatch: ['()', '(())', '()()'], mustNotMatch: [')(', '(()', '())', ''], hint: '正则无法完美匹配平衡括号，但可以匹配简单情况', difficulty: 5 },
  { id: 16, title: '邮箱简易', description: '匹配简易邮箱格式 x@x.x', category: '高级', mustMatch: ['a@b.c', 'test@mail.com', 'x@y.z'], mustNotMatch: ['@b.c', 'a@b', 'a@.c', ''], hint: '使用 \\S+@\\S+\\.\\S+', difficulty: 4 },
]

const categories = ['基础', '字符类', '量词', '分组', '前瞻', '高级']

const categoryColors: Record<string, string> = {
  '基础': '#4ade80',
  '字符类': '#60a5fa',
  '量词': '#f59e0b',
  '分组': '#a78bfa',
  '前瞻': '#f472b6',
  '高级': '#ef4444',
}

export default function RegexGolf() {
  const [currentId, setCurrentId] = useState(1)
  const [regex, setRegex] = useState('')
  const [showHint, setShowHint] = useState(false)
  const [completed, setCompleted] = useState<Set<number>>(new Set())
  const [celebrate, setCelebrate] = useState(false)
  const [filterCategory, setFilterCategory] = useState<string | null>(null)

  const current = challenges.find(c => c.id === currentId)!

  const testResults = useMemo(() => {
    if (!regex) return null
    try {
      const re = new RegExp(`^(?:${regex})$`)
      const matchResults = current.mustMatch.map(s => ({
        str: s, passed: re.test(s), expected: true,
      }))
      const notMatchResults = current.mustNotMatch.map(s => ({
        str: s, passed: !re.test(s), expected: false,
      }))
      return [...matchResults, ...notMatchResults]
    } catch {
      return 'error'
    }
  }, [regex, current])

  const isComplete = useMemo(() => {
    if (!testResults || testResults === 'error') return false
    return testResults.every(r => r.passed)
  }, [testResults])

  const score = useMemo(() => {
    if (!isComplete) return null
    return regex.length
  }, [isComplete, regex])

  const handleComplete = useCallback(() => {
    if (isComplete && !completed.has(currentId)) {
      setCompleted(prev => new Set(prev).add(currentId))
      setCelebrate(true)
      setTimeout(() => setCelebrate(false), 2000)
    }
  }, [isComplete, completed, currentId])

  useMemo(() => { handleComplete() }, [handleComplete])

  const totalCompleted = completed.size
  const totalChallenges = challenges.length

  const filteredChallenges = useMemo(() => {
    if (!filterCategory) return challenges
    return challenges.filter(c => c.category === filterCategory)
  }, [filterCategory])

  return (
    <div style={{
      background: 'linear-gradient(180deg, #1a1b2e 0%, #1e1f3a 100%)',
      padding: 20, height: '100%', overflowY: 'auto', color: '#e0e0e0',
    }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 20 }}>
        <div style={{ padding: 10, background: 'rgba(99, 102, 241, 0.15)', borderRadius: 10 }}>
          <Target size={24} style={{ color: '#6366f1' }} />
        </div>
        <div style={{ flex: 1 }}>
          <h2 style={{ margin: 0, fontSize: 20, fontWeight: 700 }}>Regex Golf</h2>
          <p style={{ margin: '2px 0 0', fontSize: 12, color: '#94a3b8' }}>
            用最短的正则表达式匹配目标字符串 — 完成 {totalCompleted}/{totalChallenges}
          </p>
        </div>
        {totalCompleted === totalChallenges && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, color: '#fbbf24' }}>
            <Trophy size={20} />
            <span style={{ fontWeight: 700 }}>全部通关!</span>
          </div>
        )}
      </div>

      {/* Progress bar */}
      <div style={{ marginBottom: 20, background: 'rgba(0,0,0,0.3)', borderRadius: 8, overflow: 'hidden', height: 8 }}>
        <div style={{
          height: '100%', borderRadius: 8,
          background: 'linear-gradient(90deg, #6366f1, #4ade80)',
          width: `${(totalCompleted / totalChallenges) * 100}%`,
          transition: 'width 0.5s ease',
        }} />
      </div>

      {/* Category filter */}
      <div style={{ display: 'flex', gap: 6, marginBottom: 16, flexWrap: 'wrap' }}>
        <button
          onClick={() => setFilterCategory(null)}
          style={{
            padding: '5px 12px', background: !filterCategory ? 'rgba(99,102,241,0.3)' : 'rgba(255,255,255,0.06)',
            border: 'none', borderRadius: 16, color: !filterCategory ? '#818cf8' : '#94a3b8',
            cursor: 'pointer', fontSize: 12,
          }}
        >
          全部
        </button>
        {categories.map(cat => (
          <button
            key={cat}
            onClick={() => setFilterCategory(filterCategory === cat ? null : cat)}
            style={{
              padding: '5px 12px', background: filterCategory === cat ? `${categoryColors[cat]}22` : 'rgba(255,255,255,0.06)',
              border: 'none', borderRadius: 16, color: filterCategory === cat ? categoryColors[cat] : '#94a3b8',
              cursor: 'pointer', fontSize: 12,
            }}
          >
            {cat}
          </button>
        ))}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '280px 1fr', gap: 16 }}>
        {/* Left: Challenge list */}
        <div style={{
          background: 'rgba(0,0,0,0.2)', borderRadius: 12, padding: 8,
          overflowY: 'auto', maxHeight: 'calc(100vh - 280px)',
        }}>
          {filteredChallenges.map(c => {
            const isDone = completed.has(c.id)
            const isCurrent = c.id === currentId
            return (
              <div
                key={c.id}
                onClick={() => { setCurrentId(c.id); setRegex(''); setShowHint(false); setCelebrate(false) }}
                style={{
                  display: 'flex', alignItems: 'center', gap: 8,
                  padding: '8px 10px', marginBottom: 2,
                  background: isCurrent ? 'rgba(99,102,241,0.15)' : 'transparent',
                  borderRadius: 8, cursor: 'pointer', fontSize: 13,
                  transition: 'background 0.15s',
                }}
                onMouseEnter={(e) => { if (!isCurrent) e.currentTarget.style.background = 'rgba(255,255,255,0.04)' }}
                onMouseLeave={(e) => { if (!isCurrent) e.currentTarget.style.background = 'transparent' }}
              >
                {isDone ? (
                  <CheckCircle size={14} style={{ color: '#4ade80', flexShrink: 0 }} />
                ) : (
                  <div style={{
                    width: 14, height: 14, borderRadius: '50%',
                    border: `2px solid ${categoryColors[c.category]}`, flexShrink: 0,
                  }} />
                )}
                <span style={{ flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {c.title}
                </span>
                <span style={{
                  fontSize: 10, padding: '1px 5px',
                  background: `${categoryColors[c.category]}22`, borderRadius: 4,
                  color: categoryColors[c.category], flexShrink: 0,
                }}>
                  {c.category}
                </span>
              </div>
            )
          })}
        </div>

        {/* Right: Challenge detail */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          {/* Challenge info */}
          <div style={{
            padding: 16, background: 'rgba(0,0,0,0.2)', borderRadius: 12,
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
              <span style={{
                fontSize: 10, padding: '2px 8px',
                background: `${categoryColors[current.category]}22`, borderRadius: 4,
                color: categoryColors[current.category],
              }}>
                {current.category}
              </span>
              <span style={{ fontSize: 11, color: '#64748b' }}>
                {'★'.repeat(current.difficulty)}{'☆'.repeat(5 - current.difficulty)}
              </span>
            </div>
            <h3 style={{ margin: '0 0 4px', fontSize: 18, fontWeight: 700 }}>{current.title}</h3>
            <p style={{ margin: 0, fontSize: 13, color: '#94a3b8' }}>{current.description}</p>
          </div>

          {/* Regex input */}
          <div style={{
            padding: 16, background: 'rgba(0,0,0,0.2)', borderRadius: 12,
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
              <Code2 size={14} style={{ color: '#6366f1' }} />
              <span style={{ fontSize: 13, fontWeight: 600 }}>你的正则表达式</span>
              {score !== null && (
                <span style={{
                  marginLeft: 'auto', padding: '2px 8px',
                  background: 'rgba(74, 222, 128, 0.15)', borderRadius: 4,
                  color: '#4ade80', fontSize: 12, fontWeight: 600,
                }}>
                  长度: {score}
                </span>
              )}
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <div style={{
                flex: 1, display: 'flex', background: 'rgba(0,0,0,0.3)',
                borderRadius: 8, overflow: 'hidden',
              }}>
                <span style={{ padding: '12px 10px', background: 'rgba(255,255,255,0.06)', fontSize: 15, color: '#6366f1', fontWeight: 700 }}>/^</span>
                <input
                  value={regex}
                  onChange={(e) => setRegex(e.target.value)}
                  placeholder="输入正则表达式..."
                  style={{
                    flex: 1, padding: '12px 10px', background: 'transparent',
                    border: 'none', color: '#e0e0e0', fontSize: 15, fontFamily: 'monospace',
                    outline: 'none',
                  }}
                />
                <span style={{ padding: '12px 10px', background: 'rgba(255,255,255,0.06)', fontSize: 15, color: '#6366f1', fontWeight: 700 }}>$/</span>
              </div>
              <button
                onClick={() => setShowHint(!showHint)}
                style={{
                  padding: 10, background: showHint ? 'rgba(251,191,36,0.2)' : 'rgba(255,255,255,0.08)',
                  border: 'none', borderRadius: 8, color: showHint ? '#fbbf24' : '#94a3b8',
                  cursor: 'pointer',
                }}
                title="提示"
              >
                <Lightbulb size={16} />
              </button>
            </div>
            {showHint && (
              <div style={{
                marginTop: 10, padding: 10, background: 'rgba(251,191,36,0.08)',
                borderRadius: 8, color: '#fbbf24', fontSize: 13,
                display: 'flex', alignItems: 'center', gap: 8,
              }}>
                <Lightbulb size={14} />
                {current.hint}
              </div>
            )}
          </div>

          {/* Test results */}
          <div style={{
            padding: 16, background: 'rgba(0,0,0,0.2)', borderRadius: 12, flex: 1,
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
              <Zap size={14} style={{ color: '#6366f1' }} />
              <span style={{ fontSize: 13, fontWeight: 600 }}>测试结果</span>
            </div>

            {testResults === 'error' ? (
              <div style={{ color: '#fca5a5', fontSize: 13, padding: 12, background: 'rgba(239,68,68,0.1)', borderRadius: 8 }}>
                正则表达式语法错误
              </div>
            ) : testResults ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                {/* Must match section */}
                <div style={{ marginBottom: 8 }}>
                  <div style={{ fontSize: 11, color: '#64748b', marginBottom: 4, fontWeight: 600 }}>应该匹配 ✓</div>
                  {current.mustMatch.map((s, i) => {
                    const result = testResults.find(r => r.str === s && r.expected === true)
                    const passed = result?.passed ?? false
                    return (
                      <div key={`match-${i}`} style={{
                        display: 'flex', alignItems: 'center', gap: 8, padding: '6px 10px',
                        background: passed ? 'rgba(74,222,128,0.08)' : 'rgba(239,68,68,0.08)',
                        borderRadius: 6, marginBottom: 3,
                      }}>
                        {passed ? <CheckCircle size={14} style={{ color: '#4ade80' }} /> : <XCircle size={14} style={{ color: '#ef4444' }} />}
                        <code style={{ fontSize: 13, fontFamily: 'monospace', color: passed ? '#4ade80' : '#ef4444' }}>
                          "{s}"
                        </code>
                      </div>
                    )
                  })}
                </div>
                {/* Must not match section */}
                <div>
                  <div style={{ fontSize: 11, color: '#64748b', marginBottom: 4, fontWeight: 600 }}>不应匹配 ✗</div>
                  {current.mustNotMatch.filter(s => s !== '').map((s, i) => {
                    const result = testResults.find(r => r.str === s && r.expected === false)
                    const passed = result?.passed ?? false
                    return (
                      <div key={`nomatch-${i}`} style={{
                        display: 'flex', alignItems: 'center', gap: 8, padding: '6px 10px',
                        background: passed ? 'rgba(74,222,128,0.08)' : 'rgba(239,68,68,0.08)',
                        borderRadius: 6, marginBottom: 3,
                      }}>
                        {passed ? <CheckCircle size={14} style={{ color: '#4ade80' }} /> : <XCircle size={14} style={{ color: '#ef4444' }} />}
                        <code style={{ fontSize: 13, fontFamily: 'monospace', color: passed ? '#4ade80' : '#ef4444' }}>
                          "{s}"
                        </code>
                      </div>
                    )
                  })}
                </div>
              </div>
            ) : (
              <div style={{ color: '#64748b', textAlign: 'center', padding: 20, fontSize: 14 }}>
                输入正则表达式开始测试
              </div>
            )}
          </div>

          {/* Celebrate */}
          {celebrate && (
            <div style={{
              padding: 16, background: 'linear-gradient(135deg, rgba(74,222,128,0.15), rgba(99,102,241,0.15))',
              borderRadius: 12, display: 'flex', alignItems: 'center', gap: 12,
              animation: 'pulse 1s ease-in-out',
            }}>
              <Trophy size={24} style={{ color: '#fbbf24' }} />
              <div>
                <div style={{ fontWeight: 700, fontSize: 16, color: '#4ade80' }}>挑战完成!</div>
                <div style={{ fontSize: 13, color: '#94a3b8' }}>
                  正则长度: {score} {score && score <= 10 ? '— 太棒了!' : score && score <= 20 ? '— 不错!' : '— 可以更短'}
                </div>
              </div>
              <button
                onClick={() => {
                  const next = challenges.find(c => c.id > currentId && !completed.has(c.id))
                  if (next) { setCurrentId(next.id); setRegex(''); setShowHint(false); setCelebrate(false) }
                }}
                style={{
                  marginLeft: 'auto', padding: '8px 16px',
                  background: 'linear-gradient(135deg, #6366f1, #4f46e5)',
                  border: 'none', borderRadius: 8, color: '#fff', cursor: 'pointer',
                  fontSize: 13, fontWeight: 600, display: 'flex', alignItems: 'center', gap: 4,
                }}
              >
                下一关 <ChevronRight size={14} />
              </button>
            </div>
          )}
        </div>
      </div>

      <style>{`
        @keyframes pulse {
          0%, 100% { opacity: 1; transform: scale(1); }
          50% { opacity: 0.8; transform: scale(1.02); }
        }
      `}</style>
    </div>
  )
}
