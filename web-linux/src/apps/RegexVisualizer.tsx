import { useState, useMemo, useRef, useEffect } from 'react'

/**
 * 正则表达式可视化测试器
 *
 * 功能：
 *  - 实时高亮匹配结果
 *  - 支持所有 JavaScript 正则特性（包括 lookahead/lookbehind）
 *  - 捕获组独立显示
 *  - 命名捕获组展示
 *  - 字符类可视化
 *  - 匹配位置导航
 *  - 常见预设模板
 */

interface PresetItem {
  name: string
  pattern: string
  flags: string
  description: string
  sample: string
}

const PRESETS: PresetItem[] = [
  {
    name: '邮箱地址',
    pattern: '[\\w.+-]+@[\\w-]+\\.[\\w.-]+',
    flags: 'g',
    description: '匹配标准邮箱地址',
    sample: '联系我们: support@example.com 或 admin+test@my-domain.co.uk',
  },
  {
    name: 'URL',
    pattern: 'https?:\\/\\/[\\w.-]+(?:\\.[a-z]{2,})(?:[\\w._~:/?#\\[\\]@!$&\'()*+,;=-]*)',
    flags: 'gi',
    description: '匹配 HTTP/HTTPS URL',
    sample: '访问 https://github.com/user/repo 或 http://example.com:8080/path?query=1',
  },
  {
    name: 'IPv4 地址',
    pattern: '(?:25[0-5]|2[0-4]\\d|1\\d\\d|[1-9]?\\d)(?:\\.(?:25[0-5]|2[0-4]\\d|1\\d\\d|[1-9]?\\d)){3}',
    flags: 'g',
    description: '匹配标准 IPv4 地址',
    sample: '服务器: 192.168.1.1, 10.0.0.1, 255.255.255.255, 999.1.1.1',
  },
  {
    name: '十六进制颜色',
    pattern: '#(?:[0-9a-fA-F]{3}){1,2}\\b',
    flags: 'g',
    description: '匹配 #RGB 或 #RRGGBB 颜色',
    sample: '主题色: #ff6b6b, #06b, #00ff00, #FFAA00FF',
  },
  {
    name: '中国手机号',
    pattern: '\\b1[3-9]\\d{9}\\b',
    flags: 'g',
    description: '匹配中国大陆 11 位手机号',
    sample: '联系: 13800138000, 18612345678, 12345, 19012345678',
  },
  {
    name: '日期 (YYYY-MM-DD)',
    pattern: '\\b\\d{4}-(?:0[1-9]|1[0-2])-(?:0[1-9]|[12]\\d|3[01])\\b',
    flags: 'g',
    description: '匹配 ISO 8601 日期',
    sample: '发布: 2024-01-15, 2023-12-31, 2024-13-01, 2024-02-30',
  },
  {
    name: '时间 (HH:MM:SS)',
    pattern: '\\b(?:[01]\\d|2[0-3]):[0-5]\\d:[0-5]\\d\\b',
    flags: 'g',
    description: '匹配 24 小时制时间',
    sample: '启动时间: 09:30:00, 23:59:59, 24:00:00, 9:30:00',
  },
  {
    name: 'HTML 标签',
    pattern: '<\\/?[a-zA-Z][^>]*>',
    flags: 'g',
    description: '匹配 HTML 标签',
    sample: '<div class="foo">Hello <strong>World</strong></div>',
  },
  {
    name: 'Markdown 链接',
    pattern: '\\[([^\\]]+)\\]\\(([^)]+)\\)',
    flags: 'g',
    description: '匹配 [text](url) 格式',
    sample: '参考 [文档](https://example.com) 和 [源码](https://github.com)',
  },
  {
    name: '数字（含千分位）',
    pattern: '\\b\\d{1,3}(?:,\\d{3})+(?:\\.\\d+)?\\b|\\b\\d+(?:\\.\\d+)?\\b',
    flags: 'g',
    description: '匹配整数或带千分位分隔符的数字',
    sample: '收入: 1,234,567.89 元，人口 1,400,000,000，增长率 0.0234',
  },
  {
    name: '中文字符',
    pattern: '[\\u4e00-\\u9fa5]+',
    flags: 'g',
    description: '匹配连续中文字符',
    sample: 'Hello 世界，WebLinuxOS 是一款出色的工具',
  },
  {
    name: '空白行',
    pattern: '^\\s*$',
    flags: 'gm',
    description: '匹配完全空白的行',
    sample: '第一行\n\n第三行\n   \n第五行',
  },
]

interface MatchResult {
  full: string
  index: number
  end: number
  groups: string[]
  namedGroups: Record<string, string>
}

const RegexVisualizer = () => {
  const [pattern, setPattern] = useState(PRESETS[0].pattern)
  const [flags, setFlags] = useState(PRESETS[0].flags)
  const [text, setText] = useState(PRESETS[0].sample)
  const [error, setError] = useState<string | null>(null)
  const [matches, setMatches] = useState<MatchResult[]>([])
  const [activeMatch, setActiveMatch] = useState<number>(-1)
  const textRef = useRef<HTMLTextAreaElement>(null)
  const highlightRef = useRef<HTMLDivElement>(null)

  // 同步滚动
  useEffect(() => {
    if (textRef.current && highlightRef.current) {
      highlightRef.current.scrollTop = textRef.current.scrollTop
      highlightRef.current.scrollLeft = textRef.current.scrollLeft
    }
  }, [text])

  // 解析正则
  useEffect(() => {
    try {
      if (!pattern) {
        setMatches([])
        setError(null)
        return
      }
      const regex = new RegExp(pattern, flags)
      const results: MatchResult[] = []
      if (flags.includes('g')) {
        let m: RegExpExecArray | null
        let iterations = 0
        while ((m = regex.exec(text)) !== null && iterations < 1000) {
          results.push({
            full: m[0],
            index: m.index,
            end: m.index + m[0].length,
            groups: m.slice(1),
            namedGroups: m.groups || {},
          })
          if (m.index === regex.lastIndex) regex.lastIndex++
          iterations++
        }
      } else {
        const m = regex.exec(text)
        if (m) {
          results.push({
            full: m[0],
            index: m.index,
            end: m.index + m[0].length,
            groups: m.slice(1),
            namedGroups: m.groups || {},
          })
        }
      }
      setMatches(results)
      setError(null)
      if (activeMatch >= results.length) setActiveMatch(-1)
    } catch (e) {
      setError(e instanceof Error ? e.message : '正则表达式错误')
      setMatches([])
    }
  }, [pattern, flags, text, activeMatch])

  const highlighted = useMemo(() => {
    if (matches.length === 0) return null
    const segments: Array<{ text: string; type: 'plain' | 'match' | 'group'; matchIdx: number; groupIdx?: number }> = []
    let cursor = 0
    matches.forEach((m, idx) => {
      if (m.index > cursor) {
        segments.push({ text: text.slice(cursor, m.index), type: 'plain', matchIdx: idx })
      }
      segments.push({ text: m.full, type: 'match', matchIdx: idx })
      cursor = m.end
    })
    if (cursor < text.length) {
      segments.push({ text: text.slice(cursor), type: 'plain', matchIdx: -1 })
    }
    return segments
  }, [matches, text])

  const applyPreset = (preset: PresetItem) => {
    setPattern(preset.pattern)
    setFlags(preset.flags)
    setText(preset.sample)
    setActiveMatch(-1)
  }

  const toggleFlag = (f: string) => {
    if (flags.includes(f)) {
      setFlags(flags.replace(f, ''))
    } else {
      setFlags(flags + f)
    }
  }

  return (
    <div style={{
      display: 'grid',
      gridTemplateColumns: '240px 1fr',
      height: '100%',
      background: 'var(--window-bg, #1a1a2e)',
      color: 'var(--text-primary, #e0e0e8)',
    }}>
      {/* 左侧预设 */}
      <div style={{
        borderRight: '1px solid var(--window-border, rgba(255,255,255,0.08))',
        overflowY: 'auto',
        padding: 12,
      }}>
        <h3 style={{ fontSize: 13, fontWeight: 600, margin: '0 0 12px 0' }}>常用预设</h3>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
          {PRESETS.map((p) => (
            <button
              key={p.name}
              onClick={() => applyPreset(p)}
              style={{
                padding: '8px 10px',
                border: '1px solid var(--window-border, rgba(255,255,255,0.06))',
                background: pattern === p.pattern && flags === p.flags ? 'var(--accent-bg, rgba(139, 92, 246, 0.15))' : 'rgba(255,255,255,0.02)',
                borderColor: pattern === p.pattern && flags === p.flags ? 'var(--accent, #8b5cf6)' : 'var(--window-border, rgba(255,255,255,0.06))',
                color: 'inherit',
                borderRadius: 6,
                textAlign: 'left',
                cursor: 'pointer',
                fontSize: 12,
              }}
            >
              <div style={{ fontWeight: 500 }}>{p.name}</div>
              <div style={{ fontSize: 10, color: 'var(--text-secondary, #888)', marginTop: 2 }}>{p.description}</div>
            </button>
          ))}
        </div>
      </div>

      {/* 右侧主面板 */}
      <div style={{ display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
        {/* 顶部：正则表达式输入 */}
        <div style={{ padding: 16, borderBottom: '1px solid var(--window-border, rgba(255,255,255,0.08))' }}>
          <div style={{ display: 'flex', gap: 6, marginBottom: 8 }}>
            <div style={{
              display: 'flex',
              alignItems: 'center',
              padding: '0 10px',
              background: 'var(--accent, #8b5cf6)',
              color: '#fff',
              borderRadius: 6,
              fontSize: 16,
              fontFamily: 'monospace',
            }}>/</div>
            <input
              type="text"
              value={pattern}
              onChange={(e) => setPattern(e.target.value)}
              placeholder="正则表达式"
              style={{
                flex: 1,
                padding: '8px 10px',
                border: `1px solid ${error ? '#ef4444' : 'var(--window-border, rgba(255,255,255,0.1))'}`,
                background: 'rgba(0,0,0,0.2)',
                color: 'inherit',
                borderRadius: 6,
                fontSize: 14,
                fontFamily: 'monospace',
                outline: 'none',
              }}
            />
            <div style={{
              display: 'flex',
              alignItems: 'center',
              padding: '0 10px',
              background: 'var(--accent, #8b5cf6)',
              color: '#fff',
              borderRadius: 6,
              fontSize: 16,
              fontFamily: 'monospace',
            }}>/{flags}</div>
          </div>

          <div style={{ display: 'flex', gap: 6, alignItems: 'center', flexWrap: 'wrap' }}>
            <span style={{ fontSize: 11, color: 'var(--text-secondary, #888)' }}>标志:</span>
            {[
              { flag: 'g', label: '全局 (g)' },
              { flag: 'i', label: '忽略大小写 (i)' },
              { flag: 'm', label: '多行 (m)' },
              { flag: 's', label: '点匹配换行 (s)' },
              { flag: 'u', label: 'Unicode (u)' },
            ].map((f) => (
              <button
                key={f.flag}
                onClick={() => toggleFlag(f.flag)}
                style={{
                  padding: '4px 8px',
                  border: '1px solid',
                  borderColor: flags.includes(f.flag) ? 'var(--accent, #8b5cf6)' : 'var(--window-border, rgba(255,255,255,0.1))',
                  background: flags.includes(f.flag) ? 'var(--accent-bg, rgba(139, 92, 246, 0.15))' : 'transparent',
                  color: flags.includes(f.flag) ? 'var(--accent, #8b5cf6)' : 'var(--text-secondary, #888)',
                  borderRadius: 4,
                  fontSize: 11,
                  cursor: 'pointer',
                }}
              >{f.label}</button>
            ))}
            {error && (
              <span style={{ marginLeft: 'auto', color: '#ef4444', fontSize: 11 }}>⚠️ {error}</span>
            )}
            {!error && (
              <span style={{ marginLeft: 'auto', color: 'var(--text-secondary, #888)', fontSize: 11 }}>
                {matches.length} 个匹配
              </span>
            )}
          </div>
        </div>

        {/* 中部：文本编辑和高亮 */}
        <div style={{ flex: 1, display: 'grid', gridTemplateRows: '1fr 1fr', overflow: 'hidden' }}>
          <div style={{ position: 'relative', overflow: 'hidden' }}>
            <div
              ref={highlightRef}
              style={{
                position: 'absolute',
                inset: 0,
                padding: 16,
                fontFamily: 'monospace',
                fontSize: 13,
                lineHeight: 1.6,
                whiteSpace: 'pre-wrap',
                wordBreak: 'break-all',
                overflow: 'auto',
                pointerEvents: 'none',
                background: 'rgba(0,0,0,0.2)',
              }}
            >
              {highlighted ? (
                highlighted.map((seg, i) => {
                  if (seg.type === 'plain') {
                    return <span key={i}>{seg.text}</span>
                  }
                  return (
                    <span
                      key={i}
                      style={{
                        background: activeMatch === seg.matchIdx ? 'rgba(245, 158, 11, 0.4)' : 'rgba(139, 92, 246, 0.3)',
                        color: '#fff',
                        borderRadius: 2,
                        padding: '0 2px',
                      }}
                    >{seg.text}</span>
                  )
                })
              ) : (
                <span style={{ color: 'var(--text-secondary, #888)' }}>{text}</span>
              )}
            </div>
            <textarea
              ref={textRef}
              value={text}
              onChange={(e) => setText(e.target.value)}
              onScroll={(e) => {
                if (highlightRef.current) {
                  highlightRef.current.scrollTop = e.currentTarget.scrollTop
                  highlightRef.current.scrollLeft = e.currentTarget.scrollLeft
                }
              }}
              spellCheck={false}
              style={{
                position: 'absolute',
                inset: 0,
                padding: 16,
                fontFamily: 'monospace',
                fontSize: 13,
                lineHeight: 1.6,
                color: 'transparent',
                caretColor: 'var(--text-primary, #e0e0e8)',
                background: 'transparent',
                border: 'none',
                outline: 'none',
                resize: 'none',
                whiteSpace: 'pre-wrap',
                wordBreak: 'break-all',
                overflow: 'auto',
              }}
            />
          </div>

          <div style={{
            borderTop: '1px solid var(--window-border, rgba(255,255,255,0.08))',
            overflowY: 'auto',
            padding: 12,
          }}>
            <h3 style={{ fontSize: 13, fontWeight: 600, margin: '0 0 8px 0' }}>匹配详情</h3>
            {matches.length === 0 ? (
              <div style={{ fontSize: 12, color: 'var(--text-secondary, #888)', textAlign: 'center', padding: 20 }}>
                {error ? '正则表达式有错误' : '无匹配结果'}
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                {matches.map((m, idx) => (
                  <div
                    key={idx}
                    onClick={() => setActiveMatch(idx)}
                    style={{
                      padding: 8,
                      borderRadius: 6,
                      background: activeMatch === idx ? 'var(--accent-bg, rgba(139, 92, 246, 0.15))' : 'rgba(255,255,255,0.02)',
                      border: '1px solid',
                      borderColor: activeMatch === idx ? 'var(--accent, #8b5cf6)' : 'var(--window-border, rgba(255,255,255,0.06))',
                      cursor: 'pointer',
                    }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
                      <span style={{ fontSize: 11, color: 'var(--text-secondary, #888)' }}>匹配 #{idx + 1}</span>
                      <span style={{ fontSize: 10, color: 'var(--text-secondary, #888)', fontFamily: 'monospace' }}>
                        [{m.index}, {m.end})
                      </span>
                    </div>
                    <code style={{
                      display: 'block',
                      padding: 4,
                      background: 'rgba(0,0,0,0.3)',
                      borderRadius: 4,
                      fontSize: 12,
                      color: '#a5d6ff',
                      wordBreak: 'break-all',
                    }}>{m.full}</code>
                    {m.groups.length > 0 && (
                      <div style={{ marginTop: 6, fontSize: 11 }}>
                        {m.groups.map((g, gi) => (
                          <div key={gi} style={{ color: 'var(--text-secondary, #888)' }}>
                            组 {gi + 1}: <code style={{ color: '#f0a868' }}>{g || '(空)'}</code>
                          </div>
                        ))}
                      </div>
                    )}
                    {Object.keys(m.namedGroups).length > 0 && (
                      <div style={{ marginTop: 6, fontSize: 11 }}>
                        {Object.entries(m.namedGroups).map(([k, v]) => (
                          <div key={k} style={{ color: 'var(--text-secondary, #888)' }}>
                            <code style={{ color: '#f0a868' }}>{k}</code>: {v}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

export default RegexVisualizer
