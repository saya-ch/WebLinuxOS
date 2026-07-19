import { useState, useMemo, useCallback, useEffect } from 'react'

/**
 * PrivacyGuard 隐私守护者
 *
 * 一个完全在浏览器本地运行的 PII（个人身份信息）检测与脱敏工具。
 *
 * 核心价值：
 *  - 17 类常见敏感信息识别（邮箱、手机号、身份证、银行卡、IP、API Key、私钥等）
 *  - 四种处理模式：仅检测 / 部分掩码 / 哈希替换 / 完全移除
 *  - 全程本地处理，零网络请求，可放心粘贴敏感数据
 *  - 实时统计、按类别高亮、一键复制结果
 */

type Mode = 'detect' | 'mask' | 'hash' | 'redact'

interface PIIPattern {
  id: string
  label: string
  description: string
  // 正则表达式（注意：使用全局匹配，且不跨行匹配）
  regex: RegExp
  // 掩码函数：将匹配到的原文转换为掩码形式
  mask: (raw: string) => string
  // 危险等级（用于上色）
  severity: 'critical' | 'high' | 'medium' | 'low'
  // 类别（用于分组统计）
  category: 'identity' | 'contact' | 'finance' | 'network' | 'secret'
}

const PATTERNS: PIIPattern[] = [
  {
    id: 'email',
    label: '邮箱地址',
    description: '电子邮件地址',
    regex: /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g,
    mask: (raw) => {
      const [name, domain] = raw.split('@')
      if (!domain) return raw
      const maskedName = name.length <= 2 ? name[0] + '*' : name.slice(0, 2) + '*'.repeat(Math.max(2, name.length - 2))
      return `${maskedName}@${domain}`
    },
    severity: 'medium',
    category: 'contact',
  },
  {
    id: 'phone_cn',
    label: '中国大陆手机号',
    description: '11 位中国大陆手机号',
    regex: /(?<!\d)1[3-9]\d{9}(?!\d)/g,
    mask: (raw) => raw.slice(0, 3) + '****' + raw.slice(7),
    severity: 'high',
    category: 'contact',
  },
  {
    id: 'phone_intl',
    label: '国际电话号码',
    description: '带国家代码的国际电话号码',
    regex: /\+\d{1,3}[\s-]?\d{1,4}[\s-]?\d{3,4}[\s-]?\d{3,4}/g,
    mask: (raw) => {
      const digits = raw.replace(/\D/g, '')
      if (digits.length < 4) return raw
      return raw.slice(0, raw.length - 4).replace(/\d/g, '*') + raw.slice(-4)
    },
    severity: 'high',
    category: 'contact',
  },
  {
    id: 'idcard_cn',
    label: '中国大陆身份证号',
    description: '18 位身份证号（支持末位 X）',
    regex: /(?<!\d)\d{6}(?:19|20)\d{2}(?:0[1-9]|1[0-2])(?:0[1-9]|[12]\d|3[01])\d{3}[\dXx](?!\d)/g,
    mask: (raw) => raw.slice(0, 6) + '********' + raw.slice(14),
    severity: 'critical',
    category: 'identity',
  },
  {
    id: 'credit_card_visa',
    label: 'Visa 信用卡号',
    description: '16 位 Visa 卡号',
    regex: /(?<!\d)4\d{3}(?:[\s-]?\d{4}){3}(?!\d)/g,
    mask: (raw) => '4*** **** **** ' + raw.replace(/\D/g, '').slice(-4),
    severity: 'critical',
    category: 'finance',
  },
  {
    id: 'credit_card_master',
    label: 'Mastercard 信用卡号',
    description: '16 位 Mastercard 卡号',
    regex: /(?<!\d)(?:5[1-5]\d{2}|2[2-7]\d{2})(?:[\s-]?\d{4}){3}(?!\d)/g,
    mask: (raw) => '5*** **** **** ' + raw.replace(/\D/g, '').slice(-4),
    severity: 'critical',
    category: 'finance',
  },
  {
    id: 'credit_card_unionpay',
    label: '银联卡号',
    description: '62 开头的银联卡号',
    regex: /(?<!\d)62\d{14,17}(?!\d)/g,
    mask: (raw) => '62** **** **** ' + raw.slice(-4),
    severity: 'critical',
    category: 'finance',
  },
  {
    id: 'ssn_us',
    label: '美国社会安全号 (SSN)',
    description: 'XXX-XX-XXXX 格式的美国 SSN',
    regex: /(?<!\d)\d{3}-\d{2}-\d{4}(?!\d)/g,
    mask: (raw) => '***-**-' + raw.slice(-4),
    severity: 'critical',
    category: 'identity',
  },
  {
    id: 'ipv4',
    label: 'IPv4 地址',
    description: '公网 IPv4 地址',
    regex: /(?<!\d)(?:(?:25[0-5]|2[0-4]\d|1?\d?\d)\.){3}(?:25[0-5]|2[0-4]\d|1?\d?\d)(?!\d)/g,
    mask: (raw) => {
      const parts = raw.split('.')
      return parts[0] + '.*.*.' + parts[3]
    },
    severity: 'medium',
    category: 'network',
  },
  {
    id: 'ipv6',
    label: 'IPv6 地址',
    description: 'IPv6 地址',
    regex: /(?<![0-9A-Fa-f:])(?:[0-9A-Fa-f]{1,4}:){7}[0-9A-Fa-f]{1,4}(?![0-9A-Fa-f:])/g,
    mask: (raw) => raw.split(':').map((p, i) => (i === 0 || i === 7 ? p : '*')).join(':'),
    severity: 'medium',
    category: 'network',
  },
  {
    id: 'mac_address',
    label: 'MAC 地址',
    description: '网络设备 MAC 地址',
    regex: /(?<![0-9A-Fa-f:])(?:[0-9A-Fa-f]{2}[:-]){5}[0-9A-Fa-f]{2}(?![0-9A-Fa-f:])/g,
    mask: (raw) => {
      const sep = raw.includes(':') ? ':' : '-'
      const parts = raw.split(sep)
      return parts[0] + sep + parts[1] + sep + '*'.repeat(5).split('').join(sep) + sep + parts[5]
    },
    severity: 'low',
    category: 'network',
  },
  {
    id: 'aws_key',
    label: 'AWS Access Key',
    description: 'AWS 访问密钥 ID',
    regex: /(?<![A-Z0-9])AKIA[0-9A-Z]{16}(?![A-Z0-9])/g,
    mask: (_raw) => 'AKIA' + '*'.repeat(16),
    severity: 'critical',
    category: 'secret',
  },
  {
    id: 'github_token',
    label: 'GitHub Token',
    description: 'GitHub Personal Access Token',
    regex: /(?<![A-Za-z0-9_])gh[pousr]_[A-Za-z0-9]{36,255}(?![A-Za-z0-9_])/g,
    mask: (raw) => raw.slice(0, 4) + '_<redacted>_' + raw.slice(-4),
    severity: 'critical',
    category: 'secret',
  },
  {
    id: 'slack_token',
    label: 'Slack Token',
    description: 'Slack API Token',
    regex: /(?<![A-Za-z0-9-])xox[baprs]-[A-Za-z0-9-]{10,}(?![A-Za-z0-9-])/g,
    mask: (raw) => raw.split('-')[0] + '-<redacted>',
    severity: 'critical',
    category: 'secret',
  },
  {
    id: 'google_api_key',
    label: 'Google API Key',
    description: 'Google API Key (AIza 开头)',
    regex: /(?<![A-Za-z0-9_])AIza[0-9A-Za-z_\-]{35}(?![A-Za-z0-9_])/g,
    mask: (raw) => 'AIza<redacted>' + raw.slice(-4),
    severity: 'critical',
    category: 'secret',
  },
  {
    id: 'jwt',
    label: 'JWT Token',
    description: 'JSON Web Token',
    regex: /(?<![A-Za-z0-9_-])eyJ[A-Za-z0-9_-]+\.eyJ[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+(?![A-Za-z0-9_-])/g,
    mask: (raw) => {
      const parts = raw.split('.')
      return parts[0] + '.<redacted>.' + parts[2]
    },
    severity: 'critical',
    category: 'secret',
  },
  {
    id: 'private_key',
    label: 'PEM 私钥',
    description: 'PEM 格式的私钥（含 BEGIN/END 标记）',
    regex: /-----BEGIN (?:RSA |EC |DSA |OPENSSH |PGP )?PRIVATE KEY-----[\s\S]*?-----END (?:RSA |EC |DSA |OPENSSH |PGP )?PRIVATE KEY-----/g,
    mask: (_raw) => '-----BEGIN PRIVATE KEY-----\n<REDACTED>\n-----END PRIVATE KEY-----',
    severity: 'critical',
    category: 'secret',
  },
  {
    id: 'bitcoin',
    label: '比特币地址',
    description: 'Bitcoin 钱包地址',
    regex: /(?<![A-Za-z0-9])(?:bc1[a-z0-9]{39,59}|[13][a-km-zA-HJ-NP-Z1-9]{25,34})(?![A-Za-z0-9])/g,
    mask: (raw) => raw.slice(0, 4) + '***' + raw.slice(-4),
    severity: 'high',
    category: 'finance',
  },
]

const CATEGORY_LABELS: Record<PIIPattern['category'], string> = {
  identity: '身份信息',
  contact: '联系方式',
  finance: '金融信息',
  network: '网络信息',
  secret: '密钥凭据',
}

const SEVERITY_LABELS: Record<PIIPattern['severity'], string> = {
  critical: '极高风险',
  high: '高风险',
  medium: '中等风险',
  low: '低风险',
}

const SEVERITY_COLORS: Record<PIIPattern['severity'], string> = {
  critical: '#ef4444',
  high: '#f97316',
  medium: '#eab308',
  low: '#22c55e',
}

interface Match {
  pattern: PIIPattern
  raw: string
  start: number
  end: number
}

interface DetectionResult {
  matches: Match[]
  output: string
}

function detect(text: string, mode: Mode): DetectionResult {
  const matches: Match[] = []

  // 收集所有匹配（避免重叠：按位置排序后过滤重叠）
  for (const pattern of PATTERNS) {
    const regex = new RegExp(pattern.regex.source, pattern.regex.flags)
    let m: RegExpExecArray | null
    while ((m = regex.exec(text)) !== null) {
      matches.push({
        pattern,
        raw: m[0],
        start: m.index,
        end: m.index + m[0].length,
      })
      // 防止零长度匹配导致死循环
      if (m.index === regex.lastIndex) regex.lastIndex++
    }
  }

  // 按位置排序，并过滤掉重叠的匹配（保留先出现的）
  matches.sort((a, b) => a.start - b.start)
  const filtered: Match[] = []
  let lastEnd = 0
  for (const mt of matches) {
    if (mt.start >= lastEnd) {
      filtered.push(mt)
      lastEnd = mt.end
    }
  }

  // 根据模式生成输出
  if (mode === 'detect') {
    return { matches: filtered, output: text }
  }

  // 反向替换以避免偏移问题
  const sorted = [...filtered].sort((a, b) => b.start - a.start)
  let output = text
  for (const mt of sorted) {
    let replacement = ''
    if (mode === 'mask') replacement = mt.pattern.mask(mt.raw)
    else if (mode === 'hash') {
      // 简单哈希：基于字符串内容生成稳定的短哈希
      let h = 0
      for (let i = 0; i < mt.raw.length; i++) {
        h = (Math.imul(31, h) + mt.raw.charCodeAt(i)) | 0
      }
      replacement = `[REDACTED:${(h >>> 0).toString(16).padStart(8, '0')}]`
    } else if (mode === 'redact') replacement = '[REDACTED]'

    output = output.slice(0, mt.start) + replacement + output.slice(mt.end)
  }

  return { matches: filtered, output }
}

function highlightHtml(text: string, matches: Match[]): string {
  if (matches.length === 0) return escapeHtml(text)
  // 正向替换，但需要计算偏移
  let result = ''
  let pos = 0
  const sorted = [...matches].sort((a, b) => a.start - b.start)
  for (const mt of sorted) {
    result += escapeHtml(text.slice(pos, mt.start))
    const color = SEVERITY_COLORS[mt.pattern.severity]
    result += `<mark style="background:${color}33;color:${color};border-bottom:2px solid ${color};padding:1px 2px;border-radius:3px;" title="${escapeHtml(mt.pattern.label)}">${escapeHtml(mt.raw)}</mark>`
    pos = mt.end
  }
  result += escapeHtml(text.slice(pos))
  return result
}

function escapeHtml(s: string): string {
  return s.replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]!)
}

const SAMPLE_TEXT = `用户登录日志（示例数据）：

用户 alice@gmail.com 在 2024-03-15 14:23:11 登录。
联系手机：13812345678，备用国际号码：+1-415-555-1234。
身份证号：110101199001011234。

服务器信息：
- 公网IP: 203.0.113.42
- 内网IPv6: 2001:0db8:85a3:0000:0000:8a2e:0370:7334
- MAC: 00:1A:2B:3C:4D:5E

API 凭据（请勿外泄）：
- AWS: AKIAIOSFODNN7EXAMPLE
- GitHub: ghp_abcdef1234567890abcdefghijklmnopqrstuvwxyz
- Google: AIzaSyA1234567890abcdefghijklmnopqrstuv_xyz
- JWT: eyJhbGciOiJIUzI1NiJ9.eyJzdWIiOiIxMjM0NTY3ODkwIn0.SflKxwRJSMeKKF2QT4fwpMeJf36POk6yJV_adQssw5c

钱包地址：1A1zP1eP5QGefi2DMPTfTL5SLmv7DivfNa
`

export default function PrivacyGuard() {
  const [input, setInput] = useState('')
  const [mode, setMode] = useState<Mode>('mask')
  const [copied, setCopied] = useState(false)

  const result = useMemo(() => detect(input, mode), [input, mode])

  const stats = useMemo(() => {
    const byCategory: Record<string, number> = {}
    const byPattern: Record<string, number> = {}
    for (const mt of result.matches) {
      byCategory[mt.pattern.category] = (byCategory[mt.pattern.category] || 0) + 1
      byPattern[mt.pattern.id] = (byPattern[mt.pattern.id] || 0) + 1
    }
    return { byCategory, byPattern, total: result.matches.length }
  }, [result.matches])

  const handleCopy = useCallback(async () => {
    if (!result.output) return
    try {
      await navigator.clipboard.writeText(result.output)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch {
      // ignore
    }
  }, [result.output])

  const handleDownload = useCallback(() => {
    if (!result.output) return
    const blob = new Blob([result.output], { type: 'text/plain;charset=utf-8' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `sanitized-${Date.now()}.txt`
    a.click()
    URL.revokeObjectURL(url)
  }, [result.output])

  const handleClear = useCallback(() => {
    setInput('')
  }, [])

  // 键盘快捷键：Ctrl+Enter 复制结果
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
        e.preventDefault()
        handleCopy()
      }
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [handleCopy])

  return (
    <div style={containerStyle}>
      {/* Header */}
      <header style={headerStyle}>
        <div style={titleRowStyle}>
          <div style={logoStyle}>
            <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M12 2L4 6v6c0 5 3.5 9.5 8 10 4.5-.5 8-5 8-10V6l-8-4z" />
              <path d="M9 12l2 2 4-4" />
            </svg>
          </div>
          <div>
            <h1 style={titleStyle}>PrivacyGuard</h1>
            <p style={subtitleStyle}>本地 PII 检测与脱敏 · 全程零网络请求</p>
          </div>
        </div>
        <div style={badgeStyle}>
          <span style={{ width: 8, height: 8, background: '#22c55e', borderRadius: '50%', display: 'inline-block' }} />
          <span style={{ fontSize: 11, color: '#94a3b8' }}>本地运行 · 数据不离开浏览器</span>
        </div>
      </header>

      {/* Mode tabs */}
      <div style={tabsStyle}>
        {([
          { id: 'detect' as Mode, label: '仅检测', hint: '仅高亮，不修改文本' },
          { id: 'mask' as Mode, label: '部分掩码', hint: '保留可辨识部分（推荐）' },
          { id: 'hash' as Mode, label: '哈希替换', hint: '生成稳定哈希，可对账' },
          { id: 'redact' as Mode, label: '完全移除', hint: '替换为 [REDACTED]' },
        ]).map((tab) => (
          <button
            key={tab.id}
            onClick={() => setMode(tab.id)}
            style={{
              ...tabStyle,
              background: mode === tab.id ? 'linear-gradient(135deg, #10b981 0%, #059669 100%)' : 'transparent',
              color: mode === tab.id ? '#fff' : '#94a3b8',
              boxShadow: mode === tab.id ? '0 4px 14px rgba(16,185,129,0.3)' : 'none',
            }}
            title={tab.hint}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Stats bar */}
      <div style={statsBarStyle}>
        <div style={{ display: 'flex', gap: 24, alignItems: 'center', flexWrap: 'wrap' }}>
          <StatBlock label="检测到的敏感项" value={stats.total} color={stats.total > 0 ? '#ef4444' : '#94a3b8'} />
          {Object.entries(stats.byCategory).map(([cat, count]) => (
            <StatBlock key={cat} label={CATEGORY_LABELS[cat as PIIPattern['category']]} value={count} color="#10b981" />
          ))}
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          <button onClick={() => setInput(SAMPLE_TEXT)} style={secondaryBtnStyle}>载入示例</button>
          <button onClick={handleClear} style={secondaryBtnStyle}>清空</button>
          <button onClick={handleCopy} disabled={!result.output} style={copied ? copiedBtnStyle : primaryBtnStyle}>
            {copied ? '已复制 ✓' : '复制结果'}
          </button>
          <button onClick={handleDownload} disabled={!result.output} style={secondaryBtnStyle}>下载</button>
        </div>
      </div>

      {/* Main content: input + output side by side */}
      <div style={mainStyle}>
        <div style={panelStyle}>
          <div style={panelHeaderStyle}>
            <span>原始文本</span>
            <span style={{ color: '#64748b', fontSize: 11 }}>{input.length} 字符</span>
          </div>
          <textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="在此粘贴包含敏感信息的文本…&#10;&#10;支持识别：邮箱、手机号、身份证、银行卡、IP、MAC、API Key、JWT、PEM 私钥、比特币地址等 17 类 PII。"
            style={textareaStyle}
            spellCheck={false}
          />
        </div>

        <div style={{ ...panelStyle, background: 'linear-gradient(180deg, #0f1f1a 0%, #0a1612 100%)' }}>
          <div style={{ ...panelHeaderStyle, borderBottomColor: 'rgba(16,185,129,0.2)' }}>
            <span style={{ color: '#10b981' }}>{mode === 'detect' ? '高亮结果' : '脱敏结果'}</span>
            <span style={{ color: '#64748b', fontSize: 11 }}>{result.output.length} 字符</span>
          </div>
          <div
            style={{
              ...outputStyle,
              background: mode === 'detect' ? '#0a1410' : '#0a1612',
              border: `1px solid ${stats.total > 0 ? 'rgba(16,185,129,0.3)' : 'rgba(255,255,255,0.06)'}`,
            }}
          >
            {input ? (
              mode === 'detect' ? (
                <div
                  style={{ whiteSpace: 'pre-wrap', wordBreak: 'break-word', fontFamily: 'JetBrains Mono, monospace', fontSize: 13, lineHeight: 1.7 }}
                  dangerouslySetInnerHTML={{ __html: highlightHtml(input, result.matches) }}
                />
              ) : (
                <pre style={{ margin: 0, whiteSpace: 'pre-wrap', wordBreak: 'break-word', fontFamily: 'JetBrains Mono, monospace', fontSize: 13, lineHeight: 1.7, color: '#cbd5e1' }}>
                  {result.output || '<空>'}
                </pre>
              )
            ) : (
              <div style={{ color: '#475569', textAlign: 'center', padding: '60px 20px', fontSize: 13 }}>
                粘贴文本后将自动开始检测
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Detection details */}
      {result.matches.length > 0 && (
        <div style={detailsStyle}>
          <div style={{ fontSize: 12, color: '#94a3b8', marginBottom: 10, letterSpacing: '0.05em', textTransform: 'uppercase' }}>
            检测详情（按类别分组）
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 8 }}>
            {Object.entries(
              result.matches.reduce<Record<string, Match[]>>((acc, mt) => {
                ;(acc[mt.pattern.id] = acc[mt.pattern.id] || []).push(mt)
                return acc
              }, {})
            ).map(([pid, mts]) => {
              const p = mts[0].pattern
              const color = SEVERITY_COLORS[p.severity]
              return (
                <div key={pid} style={{
                  background: 'rgba(255,255,255,0.03)',
                  border: `1px solid ${color}33`,
                  borderRadius: 8,
                  padding: '10px 12px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  gap: 10,
                }}>
                  <div style={{ minWidth: 0, flex: 1 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <span style={{ width: 6, height: 6, background: color, borderRadius: '50%', flexShrink: 0 }} />
                      <span style={{ color: '#e2e8f0', fontSize: 13, fontWeight: 600 }}>{p.label}</span>
                      <span style={{ color: '#64748b', fontSize: 10, padding: '1px 6px', background: `${color}1a`, borderRadius: 4 }}>
                        {SEVERITY_LABELS[p.severity]}
                      </span>
                    </div>
                    <div style={{ color: '#64748b', fontSize: 11, marginTop: 4, fontFamily: 'JetBrains Mono, monospace', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {mts[0].raw.length > 50 ? mts[0].raw.slice(0, 50) + '…' : mts[0].raw}
                    </div>
                  </div>
                  <span style={{ color, fontSize: 18, fontWeight: 700, fontVariantNumeric: 'tabular-nums' }}>×{mts.length}</span>
                </div>
              )
            })}
          </div>
        </div>
      )}

      {/* Footer */}
      <footer style={footerStyle}>
        <span>共识别 {PATTERNS.length} 类 PII 模式</span>
        <span style={{ color: '#475569' }}>·</span>
        <span>所有数据均在浏览器本地处理，不会发送到任何服务器</span>
      </footer>
    </div>
  )
}

const containerStyle: React.CSSProperties = {
  height: '100%',
  display: 'flex',
  flexDirection: 'column',
  background: 'radial-gradient(ellipse at top, #0a1f1a 0%, #050d0a 50%, #020806 100%)',
  color: '#e2e8f0',
  fontFamily: "'JetBrains Mono', 'Cabinet Grotesk', monospace",
  padding: 20,
  overflow: 'auto',
  boxSizing: 'border-box',
}

const headerStyle: React.CSSProperties = {
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'flex-start',
  marginBottom: 20,
  flexWrap: 'wrap',
  gap: 12,
}

const titleRowStyle: React.CSSProperties = { display: 'flex', alignItems: 'center', gap: 14 }

const logoStyle: React.CSSProperties = {
  width: 48,
  height: 48,
  borderRadius: 12,
  background: 'linear-gradient(135deg, #10b981 0%, #047857 100%)',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  color: '#fff',
  boxShadow: '0 8px 24px rgba(16,185,129,0.35)',
}

const titleStyle: React.CSSProperties = {
  margin: 0,
  fontSize: 24,
  fontWeight: 800,
  letterSpacing: '-0.02em',
  background: 'linear-gradient(135deg, #6ee7b7 0%, #34d399 50%, #10b981 100%)',
  WebkitBackgroundClip: 'text',
  WebkitTextFillColor: 'transparent',
  backgroundClip: 'text',
}

const subtitleStyle: React.CSSProperties = { margin: '2px 0 0 0', fontSize: 12, color: '#94a3b8' }

const badgeStyle: React.CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  gap: 8,
  padding: '6px 12px',
  background: 'rgba(16,185,129,0.08)',
  border: '1px solid rgba(16,185,129,0.2)',
  borderRadius: 999,
}

const tabsStyle: React.CSSProperties = {
  display: 'flex',
  gap: 4,
  background: 'rgba(255,255,255,0.03)',
  padding: 4,
  borderRadius: 10,
  marginBottom: 16,
  width: 'fit-content',
}

const tabStyle: React.CSSProperties = {
  padding: '8px 18px',
  borderRadius: 7,
  border: 'none',
  cursor: 'pointer',
  fontSize: 13,
  fontWeight: 600,
  transition: 'all 0.2s',
  fontFamily: 'inherit',
}

const statsBarStyle: React.CSSProperties = {
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'center',
  marginBottom: 16,
  padding: '14px 18px',
  background: 'rgba(255,255,255,0.025)',
  border: '1px solid rgba(255,255,255,0.06)',
  borderRadius: 12,
  flexWrap: 'wrap',
  gap: 12,
}

function StatBlock({ label, value, color }: { label: string; value: number; color: string }) {
  return (
    <div style={{ display: 'flex', alignItems: 'baseline', gap: 6 }}>
      <span style={{ fontSize: 22, fontWeight: 800, color, fontVariantNumeric: 'tabular-nums' }}>{value}</span>
      <span style={{ fontSize: 11, color: '#64748b' }}>{label}</span>
    </div>
  )
}

const mainStyle: React.CSSProperties = {
  display: 'grid',
  gridTemplateColumns: '1fr 1fr',
  gap: 14,
  flex: 1,
  minHeight: 320,
}

const panelStyle: React.CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
  background: 'rgba(255,255,255,0.02)',
  border: '1px solid rgba(255,255,255,0.06)',
  borderRadius: 12,
  overflow: 'hidden',
  minHeight: 0,
}

const panelHeaderStyle: React.CSSProperties = {
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'center',
  padding: '10px 14px',
  borderBottom: '1px solid rgba(255,255,255,0.06)',
  fontSize: 12,
  color: '#94a3b8',
  fontWeight: 600,
  letterSpacing: '0.05em',
  textTransform: 'uppercase',
}

const textareaStyle: React.CSSProperties = {
  flex: 1,
  background: 'transparent',
  border: 'none',
  color: '#e2e8f0',
  padding: 14,
  fontFamily: "'JetBrains Mono', monospace",
  fontSize: 13,
  lineHeight: 1.7,
  resize: 'none',
  outline: 'none',
  minHeight: 280,
}

const outputStyle: React.CSSProperties = {
  flex: 1,
  padding: 14,
  overflow: 'auto',
  minHeight: 280,
}

const detailsStyle: React.CSSProperties = {
  marginTop: 14,
  padding: 14,
  background: 'rgba(255,255,255,0.02)',
  border: '1px solid rgba(255,255,255,0.06)',
  borderRadius: 12,
}

const primaryBtnStyle: React.CSSProperties = {
  padding: '8px 16px',
  borderRadius: 8,
  border: 'none',
  background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
  color: '#fff',
  cursor: 'pointer',
  fontSize: 13,
  fontWeight: 600,
  fontFamily: 'inherit',
  transition: 'all 0.2s',
}

const copiedBtnStyle: React.CSSProperties = {
  ...primaryBtnStyle,
  background: 'linear-gradient(135deg, #22c55e 0%, #16a34a 100%)',
}

const secondaryBtnStyle: React.CSSProperties = {
  padding: '8px 14px',
  borderRadius: 8,
  border: '1px solid rgba(255,255,255,0.1)',
  background: 'rgba(255,255,255,0.03)',
  color: '#cbd5e1',
  cursor: 'pointer',
  fontSize: 13,
  fontWeight: 500,
  fontFamily: 'inherit',
  transition: 'all 0.2s',
}

const footerStyle: React.CSSProperties = {
  marginTop: 14,
  padding: '10px 14px',
  display: 'flex',
  gap: 8,
  alignItems: 'center',
  fontSize: 11,
  color: '#64748b',
}
