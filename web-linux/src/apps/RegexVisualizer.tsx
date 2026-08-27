import { useState, useMemo, useCallback, useRef } from 'react'
import { useStore } from '../store'

/* ─────────────────────────── 常量 & 数据 ─────────────────────────── */

/** 捕获组高亮颜色（最多 9 组） */
const MATCH_COLORS = [
  'rgba(139, 92, 246, 0.35)',   // 紫
  'rgba(59, 130, 246, 0.35)',   // 蓝
  'rgba(16, 185, 129, 0.35)',   // 绿
  'rgba(245, 158, 11, 0.35)',   // 琥珀
  'rgba(239, 68, 68, 0.35)',    // 红
  'rgba(236, 72, 153, 0.35)',   // 粉
  'rgba(6, 182, 212, 0.35)',    // 青
  'rgba(168, 85, 247, 0.35)',   // 紫罗兰
  'rgba(34, 197, 94, 0.35)',    // 翠绿
]

const MATCH_COLORS_SOLID = [
  '#8b5cf6', '#3b82f6', '#10b981', '#f59e0b', '#ef4444',
  '#ec4899', '#06b6d4', '#a855f7', '#22c55e',
]

/** 常用正则表达式模板 */
const TEMPLATES = [
  {
    name: '邮箱地址',
    pattern: '[\\w.+-]+@[\\w-]+\\.[\\w.-]+',
    flags: 'g',
    sample: '联系我们: support@example.com 或 admin+test@my-domain.co.uk',
  },
  {
    name: '手机号码',
    pattern: '\\b1[3-9]\\d{9}\\b',
    flags: 'g',
    sample: '联系: 13800138000, 18612345678, 12345, 19012345678',
  },
  {
    name: 'URL 链接',
    pattern: 'https?:\\/\\/[\\w.-]+(?:\\.[a-z]{2,})(?:[\\w._~:/?#\\[\\]@!$&\'()*+,;=-]*)',
    flags: 'gi',
    sample: '访问 https://github.com/user/repo 或 http://example.com:8080/path?q=1',
  },
  {
    name: 'IPv4 地址',
    pattern: '(?:25[0-5]|2[0-4]\\d|1\\d\\d|[1-9]?\\d)(?:\\.(?:25[0-5]|2[0-4]\\d|1\\d\\d|[1-9]?\\d)){3}',
    flags: 'g',
    sample: '服务器: 192.168.1.1, 10.0.0.1, 255.255.255.255, 999.1.1.1',
  },
  {
    name: '日期 YYYY-MM-DD',
    pattern: '\\b\\d{4}-(?:0[1-9]|1[0-2])-(?:0[1-9]|[12]\\d|3[01])\\b',
    flags: 'g',
    sample: '发布: 2024-01-15, 2023-12-31, 2024-13-01, 2024-02-30',
  },
  {
    name: '十六进制颜色',
    pattern: '#(?:[0-9a-fA-F]{3}){1,2}\\b',
    flags: 'g',
    sample: '主题色: #ff6b6b, #06b, #00ff00, #FFAA00FF',
  },
  {
    name: 'HTML 标签',
    pattern: '<\\/?[a-zA-Z][^>]*>',
    flags: 'g',
    sample: '<div class="foo">Hello <strong>World</strong></div>',
  },
  {
    name: '中文字符',
    pattern: '[\\u4e00-\\u9fa5]+',
    flags: 'g',
    sample: 'Hello 世界，WebLinuxOS 是一款出色的工具',
  },
  {
    name: '时间 HH:MM:SS',
    pattern: '\\b(?:[01]\\d|2[0-3]):[0-5]\\d:[0-5]\\d\\b',
    flags: 'g',
    sample: '启动: 09:30:00, 23:59:59, 24:00:00',
  },
  {
    name: 'Markdown 链接',
    pattern: '\\[([^\\]]+)\\]\\(([^)]+)\\)',
    flags: 'g',
    sample: '参考 [文档](https://example.com) 和 [源码](https://github.com)',
  },
]

/** flags 元数据 */
const FLAG_OPTIONS = [
  { flag: 'g', label: '全局匹配', short: 'g' },
  { flag: 'i', label: '忽略大小写', short: 'i' },
  { flag: 'm', label: '多行模式', short: 'm' },
  { flag: 's', label: '点匹配换行', short: 's' },
  { flag: 'u', label: 'Unicode', short: 'u' },
] as const

/* ───────────────────── 正则表达式分解解释 ───────────────────── */

function explainRegex(pattern: string): Array<{ token: string; description: string }> {
  if (!pattern) return []
  const result: Array<{ token: string; description: string }> = []

  const rules: Array<{ re: RegExp; desc: string | ((...args: any[]) => string) }> = [
    // 量词
    { re: /\{(\d+)\}/g, desc: '恰好匹配 $1 次' },
    { re: /\{(\d+),(\d+)\}/g, desc: '匹配 $1 到 $2 次' },
    { re: /\{(\d+),\}/g, desc: '匹配至少 $1 次' },
    { re: /\+/g, desc: '匹配前一个字符一次或多次' },
    { re: /\*/g, desc: '匹配前一个字符零次或多次' },
    { re: /\?/g, desc: '匹配前一个字符零次或一次' },
    // 分组与引用
    { re: /\(\?:/g, desc: '非捕获分组开始' },
    { re: /\(\?<([^>]+)>/g, desc: '命名捕获组 "$1" 开始' },
    { re: /\(/g, desc: '捕获分组开始' },
    { re: /\)/g, desc: '分组结束' },
    // 断言
    { re: /\(\?=/g, desc: '正向先行断言' },
    { re: /\(\?!/g, desc: '负向先行断言' },
    { re: /\(\?<=/g, desc: '正向后行断言' },
    { re: /\(\?<!/g, desc: '负向后行断言' },
    // 字符类
    { re: /\[(\^?)([^\]]*)\]/g, desc: (_, neg, chars) => neg ? `排除字符集 [^${chars}]` : `字符集 [${chars}]` },
    // 转义序列
    { re: /\\d/g, desc: '一位数字 [0-9]' },
    { re: /\\D/g, desc: '一位非数字' },
    { re: /\\w/g, desc: '一个字母/数字/下划线 [A-Za-z0-9_]' },
    { re: /\\W/g, desc: '一个非字母数字字符' },
    { re: /\\s/g, desc: '一个空白字符（空格、制表符等）' },
    { re: /\\S/g, desc: '一个非空白字符' },
    { re: /\\b/g, desc: '单词边界' },
    { re: /\\B/g, desc: '非单词边界' },
    { re: /\\n/g, desc: '换行符' },
    { re: /\\t/g, desc: '制表符' },
    { re: /\\r/g, desc: '回车符' },
    { re: /\\f/g, desc: '换页符' },
    { re: /\\v/g, desc: '垂直制表符' },
    { re: /\\0/g, desc: '空字符 (NUL)' },
    // 特殊字符
    { re: /\./g, desc: '匹配任意字符（除换行符外）' },
    { re: /\^/g, desc: '字符串/行的开始' },
    { re: /\$/g, desc: '字符串/行的结束' },
    { re: /\|/g, desc: '或（选择匹配）' },
    { re: /\\(.)/g, desc: (_, ch) => `转义字符 "${ch}"` },
  ]

  // Tokenize the pattern by scanning character-by-character
  let i = 0
  while (i < pattern.length) {
    let matched = false
    // Try to match the longest token first
    for (const rule of rules) {
      rule.re.lastIndex = 0
      const remaining = pattern.slice(i)
      const m = rule.re.exec(remaining)
      if (m && m.index === 0) {
        const token = m[0]
        const desc = typeof rule.desc === 'function' ? rule.desc(...m.slice(1) as [string]) : rule.desc
        result.push({ token, description: desc })
        i += token.length
        matched = true
        break
      }
    }
    if (!matched) {
      // Accumulate plain characters
      let plain = pattern[i]
      i++
      while (i < pattern.length) {
        const c = pattern[i]
        if (c === '\\' || c === '(' || c === '[' || c === '{' || c === '.' || c === '^' || c === '$' || c === '|' || c === '*' || c === '+' || c === '?') break
        plain += c
        i++
      }
      result.push({ token: plain, description: `文字 "${plain}"` })
    }
  }

  return result
}

/* ──────────────────────── 匹配结果类型 ──────────────────────── */

interface MatchResult {
  full: string
  index: number
  end: number
  groups: string[]
  namedGroups: Record<string, string>
}

/* ──────────────────────── 高亮段落类型 ──────────────────────── */

interface HighlightSegment {
  text: string
  type: 'plain' | 'match'
  matchIdx: number
}

/* ──────────────────────── 组件 ──────────────────────── */

const RegexVisualizer = () => {
  const theme = useStore((s) => s.theme)
  const isDark =
    theme === 'dark' ||
    (theme === 'auto' && typeof window !== 'undefined' && window.matchMedia('(prefers-color-scheme: dark)').matches)

  /* ─── State ─── */
  const [pattern, setPattern] = useState('')
  const [flags, setFlags] = useState('g')
  const [testText, setTestText] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [activeMatch, setActiveMatch] = useState<number>(-1)
  const [selectedTemplate, setSelectedTemplate] = useState<number>(-1)

  const textareaRef = useRef<HTMLTextAreaElement>(null)
  const highlightRef = useRef<HTMLDivElement>(null)

  /* ─── 执行正则匹配 (useMemo) ─── */
  const matches: MatchResult[] = useMemo(() => {
    if (!pattern) return []
    try {
      const regex = new RegExp(pattern, flags)
      const results: MatchResult[] = []
      if (flags.includes('g')) {
        let m: RegExpExecArray | null
        let iterations = 0
        while ((m = regex.exec(testText)) !== null && iterations < 1000) {
          results.push({
            full: m[0],
            index: m.index,
            end: m.index + m[0].length,
            groups: m.slice(1).map((g) => g ?? ''),
            namedGroups: m.groups || {},
          })
          if (m.index === regex.lastIndex) regex.lastIndex++
          iterations++
        }
      } else {
        const m = regex.exec(testText)
        if (m) {
          results.push({
            full: m[0],
            index: m.index,
            end: m.index + m[0].length,
            groups: m.slice(1).map((g) => g ?? ''),
            namedGroups: m.groups || {},
          })
        }
      }
      setError(null)
      return results
    } catch (e) {
      setError(e instanceof Error ? e.message : '正则表达式语法错误')
      return []
    }
  }, [pattern, flags, testText])

  /* ─── 正则表达式分解说明 (useMemo) ─── */
  const explanation = useMemo(() => explainRegex(pattern), [pattern])

  /* ─── 生成高亮段落 (useMemo) ─── */
  const highlightSegments: HighlightSegment[] = useMemo(() => {
    if (matches.length === 0 || !testText) return []
    const segments: HighlightSegment[] = []
    let cursor = 0
    matches.forEach((m, idx) => {
      if (m.index > cursor) {
        segments.push({ text: testText.slice(cursor, m.index), type: 'plain', matchIdx: -1 })
      }
      segments.push({ text: m.full, type: 'match', matchIdx: idx })
      cursor = m.end
    })
    if (cursor < testText.length) {
      segments.push({ text: testText.slice(cursor), type: 'plain', matchIdx: -1 })
    }
    return segments
  }, [matches, testText])

  /* ─── 回调函数 ─── */
  const toggleFlag = useCallback(
    (f: string) => {
      setFlags((prev) => (prev.includes(f) ? prev.replace(f, '') : prev + f))
    },
    [],
  )

  const applyTemplate = useCallback(
    (index: number) => {
      const t = TEMPLATES[index]
      if (!t) return
      setPattern(t.pattern)
      setFlags(t.flags)
      setTestText(t.sample)
      setActiveMatch(-1)
      setSelectedTemplate(index)
    },
    [],
  )

  const syncScroll = useCallback(() => {
    if (textareaRef.current && highlightRef.current) {
      highlightRef.current.scrollTop = textareaRef.current.scrollTop
      highlightRef.current.scrollLeft = textareaRef.current.scrollLeft
    }
  }, [])

  /* ─── 样式 ─── */
  const s = useMemo(() => {
    const bg = isDark ? '#0f0f1a' : '#f8f9fc'
    const surface = isDark ? 'rgba(255,255,255,0.04)' : 'rgba(0,0,0,0.03)'
    const surface2 = isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.05)'
    const border = isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.1)'
    const text1 = isDark ? '#e0e0e8' : '#1a1a2e'
    const text2 = isDark ? '#888' : '#6b7280'
    const accent = '#8b5cf6'
    const accentBg = isDark ? 'rgba(139,92,246,0.15)' : 'rgba(139,92,246,0.1)'
    const inputBg = isDark ? 'rgba(0,0,0,0.3)' : 'rgba(255,255,255,0.8)'
    const errorColor = '#ef4444'

    return { bg, surface, surface2, border, text1, text2, accent, accentBg, inputBg, errorColor }
  }, [isDark])

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        height: '100%',
        background: `var(--window-bg, ${s.bg})`,
        color: `var(--text-primary, ${s.text1})`,
        fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
        overflow: 'hidden',
      }}
    >
      {/* ═══════ 顶部：正则输入 + flags + 模板选择 ═══════ */}
      <div
        style={{
          padding: '14px 16px',
          borderBottom: `1px solid var(--window-border, ${s.border})`,
          background: `var(--color-surface, ${s.surface})`,
        }}
      >
        {/* 正则输入行 */}
        <div style={{ display: 'flex', gap: 6, marginBottom: 10 }}>
          <span
            style={{
              display: 'flex',
              alignItems: 'center',
              padding: '0 10px',
              background: s.accent,
              color: '#fff',
              borderRadius: 6,
              fontSize: 16,
              fontFamily: 'monospace',
              fontWeight: 700,
            }}
          >
            /
          </span>
          <input
            type="text"
            value={pattern}
            onChange={(e) => {
              setPattern(e.target.value)
              setSelectedTemplate(-1)
            }}
            placeholder="输入正则表达式..."
            style={{
              flex: 1,
              padding: '8px 12px',
              border: `1px solid ${error ? s.errorColor : `var(--window-border, ${s.border})`}`,
              background: s.inputBg,
              color: `var(--text-primary, ${s.text1})`,
              borderRadius: 6,
              fontSize: 14,
              fontFamily: 'monospace',
              outline: 'none',
              transition: 'border-color 0.2s',
            }}
          />
          <span
            style={{
              display: 'flex',
              alignItems: 'center',
              padding: '0 10px',
              background: s.accent,
              color: '#fff',
              borderRadius: 6,
              fontSize: 16,
              fontFamily: 'monospace',
              fontWeight: 700,
            }}
          >
            /{flags || '-'}
          </span>
        </div>

        {/* Flags + 模板选择 + 状态 */}
        <div style={{ display: 'flex', gap: 6, alignItems: 'center', flexWrap: 'wrap' }}>
          {FLAG_OPTIONS.map((f) => (
            <button
              key={f.flag}
              onClick={() => toggleFlag(f.flag)}
              title={f.label}
              style={{
                padding: '4px 10px',
                border: `1px solid ${flags.includes(f.flag) ? s.accent : `var(--window-border, ${s.border})`}`,
                background: flags.includes(f.flag) ? s.accentBg : 'transparent',
                color: flags.includes(f.flag) ? s.accent : s.text2,
                borderRadius: 4,
                fontSize: 11,
                fontWeight: flags.includes(f.flag) ? 600 : 400,
                cursor: 'pointer',
                transition: 'all 0.15s',
              }}
            >
              {f.short}
            </button>
          ))}

          <span style={{ width: 1, height: 16, background: s.border, margin: '0 4px' }} />

          <select
            value={selectedTemplate}
            onChange={(e) => {
              const idx = Number(e.target.value)
              if (idx >= 0) applyTemplate(idx)
            }}
            style={{
              padding: '4px 8px',
              border: `1px solid var(--window-border, ${s.border})`,
              background: s.inputBg,
              color: `var(--text-primary, ${s.text1})`,
              borderRadius: 4,
              fontSize: 11,
              cursor: 'pointer',
              outline: 'none',
            }}
          >
            <option value={-1}>常用模板...</option>
            {TEMPLATES.map((t, i) => (
              <option key={i} value={i}>
                {t.name}
              </option>
            ))}
          </select>

          <span style={{ marginLeft: 'auto', fontSize: 11, color: s.text2, display: 'flex', alignItems: 'center', gap: 6 }}>
            {error ? (
              <span style={{ color: s.errorColor }}>⚠ {error}</span>
            ) : (
              <span>
                {matches.length > 0 ? (
                  <>
                    <span style={{ color: s.accent, fontWeight: 600 }}>{matches.length}</span> 个匹配
                  </>
                ) : (
                  '输入正则表达式和测试文本以开始'
                )}
              </span>
            )}
          </span>
        </div>
      </div>

      {/* ═══════ 中部：测试文本 + 匹配结果 ═══════ */}
      <div style={{ flex: 1, display: 'grid', gridTemplateColumns: '1fr 320px', overflow: 'hidden', minHeight: 0 }}>
        {/* 左侧：测试文本 + 高亮 */}
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            borderRight: `1px solid var(--window-border, ${s.border})`,
            overflow: 'hidden',
          }}
        >
          <div
            style={{
              padding: '8px 16px',
              fontSize: 11,
              fontWeight: 600,
              color: s.text2,
              borderBottom: `1px solid var(--window-border, ${s.border})`,
              textTransform: 'uppercase',
              letterSpacing: '0.5px',
            }}
          >
            测试文本
          </div>
          <div style={{ flex: 1, position: 'relative', minHeight: 0 }}>
            {/* 高亮层 */}
            <div
              ref={highlightRef}
              onScroll={syncScroll}
              style={{
                position: 'absolute',
                inset: 0,
                padding: 16,
                fontFamily: 'monospace',
                fontSize: 13,
                lineHeight: 1.7,
                whiteSpace: 'pre-wrap',
                wordBreak: 'break-all',
                overflow: 'auto',
                pointerEvents: 'none',
                background: 'transparent',
              }}
            >
              {highlightSegments.length > 0 ? (
                highlightSegments.map((seg, i) => {
                  if (seg.type === 'plain') {
                    return <span key={i}>{seg.text}</span>
                  }
                  const colorIdx = seg.matchIdx % MATCH_COLORS.length
                  const isActive = activeMatch === seg.matchIdx
                  return (
                    <span
                      key={i}
                      style={{
                        background: isActive ? 'rgba(245, 158, 11, 0.45)' : MATCH_COLORS[colorIdx],
                        color: isActive ? '#fff' : '#fff',
                        borderRadius: 2,
                        padding: '1px 2px',
                        boxShadow: isActive ? `0 0 0 2px ${MATCH_COLORS_SOLID[colorIdx]}` : 'none',
                        transition: 'background 0.15s, box-shadow 0.15s',
                      }}
                    >
                      {seg.text}
                    </span>
                  )
                })
              ) : testText ? (
                <span style={{ color: s.text2 }}>{testText}</span>
              ) : (
                <span style={{ color: s.text2, fontStyle: 'italic' }}>在此输入要测试的文本...</span>
              )}
            </div>
            {/* 透明 textarea（可编辑） */}
            <textarea
              ref={textareaRef}
              value={testText}
              onChange={(e) => setTestText(e.target.value)}
              onScroll={syncScroll}
              spellCheck={false}
              placeholder="在此输入要测试的文本..."
              style={{
                position: 'absolute',
                inset: 0,
                padding: 16,
                fontFamily: 'monospace',
                fontSize: 13,
                lineHeight: 1.7,
                color: 'transparent',
                caretColor: `var(--text-primary, ${s.text1})`,
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
        </div>

        {/* 右侧：匹配结果详情列表 */}
        <div style={{ display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
          <div
            style={{
              padding: '8px 16px',
              fontSize: 11,
              fontWeight: 600,
              color: s.text2,
              borderBottom: `1px solid var(--window-border, ${s.border})`,
              textTransform: 'uppercase',
              letterSpacing: '0.5px',
              display: 'flex',
              justifyContent: 'space-between',
            }}
          >
            <span>匹配结果</span>
            {matches.length > 0 && (
              <span style={{ fontWeight: 400, color: s.text2 }}>
                共 {matches.length} 项
              </span>
            )}
          </div>
          <div style={{ flex: 1, overflowY: 'auto', padding: 12 }}>
            {!pattern ? (
              <div
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  justifyContent: 'center',
                  height: '100%',
                  color: s.text2,
                  fontSize: 12,
                  gap: 8,
                }}
              >
                <span style={{ fontSize: 32, opacity: 0.3 }}>🔍</span>
                <span>请输入正则表达式开始匹配</span>
              </div>
            ) : error ? (
              <div
                style={{
                  padding: 12,
                  borderRadius: 8,
                  background: 'rgba(239,68,68,0.1)',
                  border: '1px solid rgba(239,68,68,0.2)',
                  color: s.errorColor,
                  fontSize: 12,
                }}
              >
                <div style={{ fontWeight: 600, marginBottom: 4 }}>正则语法错误</div>
                <div style={{ fontFamily: 'monospace', wordBreak: 'break-all' }}>{error}</div>
              </div>
            ) : matches.length === 0 ? (
              <div
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  justifyContent: 'center',
                  height: '100%',
                  color: s.text2,
                  fontSize: 12,
                  gap: 8,
                }}
              >
                <span style={{ fontSize: 32, opacity: 0.3 }}>∅</span>
                <span>无匹配结果</span>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                {matches.map((m, idx) => {
                  const colorIdx = idx % MATCH_COLORS.length
                  const isActive = activeMatch === idx
                  const hasGroups = m.groups.length > 0
                  const hasNamed = Object.keys(m.namedGroups).length > 0

                  return (
                    <div
                      key={idx}
                      onClick={() => setActiveMatch(isActive ? -1 : idx)}
                      style={{
                        padding: '8px 10px',
                        borderRadius: 8,
                        background: isActive ? s.accentBg : s.surface,
                        border: `1px solid ${isActive ? s.accent : `var(--window-border, ${s.border})`}`,
                        cursor: 'pointer',
                        transition: 'all 0.15s',
                      }}
                    >
                      {/* 头部：编号 + 位置 */}
                      <div
                        style={{
                          display: 'flex',
                          justifyContent: 'space-between',
                          alignItems: 'center',
                          marginBottom: 4,
                        }}
                      >
                        <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                          <span
                            style={{
                              width: 8,
                              height: 8,
                              borderRadius: '50%',
                              background: MATCH_COLORS_SOLID[colorIdx],
                              display: 'inline-block',
                            }}
                          />
                          <span style={{ fontSize: 11, fontWeight: 600, color: s.text1 }}>
                            匹配 #{idx + 1}
                          </span>
                        </span>
                        <span style={{ fontSize: 10, color: s.text2, fontFamily: 'monospace' }}>
                          [{m.index}, {m.end})
                        </span>
                      </div>

                      {/* 匹配内容 */}
                      <code
                        style={{
                          display: 'block',
                          padding: '4px 8px',
                          background: s.inputBg,
                          borderRadius: 4,
                          fontSize: 12,
                          color: MATCH_COLORS_SOLID[colorIdx],
                          wordBreak: 'break-all',
                          marginBottom: hasGroups || hasNamed ? 6 : 0,
                        }}
                      >
                        {m.full || '(空字符串)'}
                      </code>

                      {/* 捕获组 */}
                      {hasGroups && (
                        <div style={{ fontSize: 11, marginTop: 4 }}>
                          {m.groups.map((g, gi) => (
                            <div
                              key={gi}
                              style={{
                                display: 'flex',
                                alignItems: 'center',
                                gap: 6,
                                padding: '2px 0',
                                color: s.text2,
                              }}
                            >
                              <span
                                style={{
                                  fontSize: 9,
                                  padding: '1px 5px',
                                  borderRadius: 3,
                                  background: `rgba(255,255,255,0.06)`,
                                  color: MATCH_COLORS_SOLID[gi % MATCH_COLORS_SOLID.length],
                                  fontWeight: 600,
                                  fontFamily: 'monospace',
                                }}
                              >
                                G{gi + 1}
                              </span>
                              <code style={{ color: MATCH_COLORS_SOLID[gi % MATCH_COLORS_SOLID.length], fontSize: 11 }}>
                                {g || '(空)'}
                              </code>
                            </div>
                          ))}
                        </div>
                      )}

                      {/* 命名捕获组 */}
                      {hasNamed && (
                        <div style={{ fontSize: 11, marginTop: 4 }}>
                          {Object.entries(m.namedGroups).map(([k, v]) => (
                            <div
                              key={k}
                              style={{
                                display: 'flex',
                                alignItems: 'center',
                                gap: 6,
                                padding: '2px 0',
                                color: s.text2,
                              }}
                            >
                              <code
                                style={{
                                  fontSize: 10,
                                  color: '#f59e0b',
                                  fontWeight: 600,
                                }}
                              >
                                {k}
                              </code>
                              <span>:</span>
                              <code style={{ color: '#f59e0b', fontSize: 11 }}>
                                {v || '(空)'}
                              </code>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  )
                })}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ═══════ 底部：正则表达式分解说明 ═══════ */}
      {pattern && (
        <div
          style={{
            borderTop: `1px solid var(--window-border, ${s.border})`,
            background: `var(--color-surface, ${s.surface})`,
            maxHeight: 160,
            overflow: 'auto',
          }}
        >
          <div
            style={{
              padding: '8px 16px',
              fontSize: 11,
              fontWeight: 600,
              color: s.text2,
              borderBottom: `1px solid var(--window-border, ${s.border})`,
              textTransform: 'uppercase',
              letterSpacing: '0.5px',
              position: 'sticky',
              top: 0,
              background: `var(--color-surface, ${s.surface})`,
              zIndex: 1,
            }}
          >
            正则表达式分解
          </div>
          <div style={{ padding: '8px 16px 12px', display: 'flex', flexWrap: 'wrap', gap: 4 }}>
            {explanation.map((item, i) => (
              <div
                key={i}
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 6,
                  padding: '3px 8px',
                  borderRadius: 4,
                  background: s.surface2,
                  fontSize: 11,
                }}
              >
                <code
                  style={{
                    color: s.accent,
                    fontFamily: 'monospace',
                    fontWeight: 600,
                  }}
                >
                  {item.token}
                </code>
                <span style={{ color: s.text2 }}>→</span>
                <span style={{ color: s.text1 }}>{item.description}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

export default RegexVisualizer
