import { useState, useMemo, useCallback, memo } from 'react'

interface JwtHeader {
  alg: string
  typ?: string
  [key: string]: unknown
}

interface JwtPayload {
  sub?: string
  name?: string
  iat?: number
  exp?: number
  nbf?: number
  iss?: string
  aud?: string | string[]
  jti?: string
  [key: string]: unknown
}

const SAMPLE_JWT =
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIiwibmFtZSI6IkpvaG4gRG9lIiwiaWF0IjoxNTE2MjM5MDIyfQ.SflKxwRJSMeKKF2QT4fwpMeJf36POk6yJV_adQssw5c'

// Base64 URL 解码
function base64UrlDecode(input: string): string {
  let str = input.replace(/-/g, '+').replace(/_/g, '/')
  // 补齐 padding
  while (str.length % 4) str += '='
  try {
    // 优先用 atob 配合 TextDecoder 处理 UTF-8
    const binary = atob(str)
    const bytes = new Uint8Array(binary.length)
    for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i)
    return new TextDecoder('utf-8').decode(bytes)
  } catch {
    return ''
  }
}

function formatTimestamp(ts: number): string {
  if (!Number.isFinite(ts) || ts < 0) return '—'
  const date = new Date(ts * 1000)
  return date.toLocaleString()
}

function relativeTime(ts: number): string {
  if (!Number.isFinite(ts)) return '—'
  const now = Math.floor(Date.now() / 1000)
  const diff = ts - now
  const abs = Math.abs(diff)
  const units: [number, Intl.RelativeTimeFormatUnit][] = [
    [60, 'second'],
    [3600, 'minute'],
    [86400, 'hour'],
    [604800, 'day'],
    [2592000, 'week'],
    [31536000, 'month'],
  ]
  let value = abs
  let unit: Intl.RelativeTimeFormatUnit = 'second'
  for (let i = 0; i < units.length; i++) {
    if (abs < units[i][0]) {
      value = Math.floor(abs / (i === 0 ? 1 : units[i - 1][0]))
      unit = units[i - 1][1] as Intl.RelativeTimeFormatUnit
      break
    }
    value = abs
    unit = units[i][1] as Intl.RelativeTimeFormatUnit
  }
  const rtf = new Intl.RelativeTimeFormat('zh-CN', { numeric: 'auto' })
  return rtf.format(diff < 0 ? -value : value, unit)
}

interface StatusRowProps {
  label: string
  status: 'ok' | 'warn' | 'err' | 'idle'
  value: string
}

const StatusRow = memo(function StatusRow({ label, status, value }: StatusRowProps) {
  const colorMap = {
    ok: { bg: 'rgba(34, 197, 94, 0.1)', border: 'rgba(34, 197, 94, 0.4)', text: '#22c55e' },
    warn: { bg: 'rgba(251, 191, 36, 0.1)', border: 'rgba(251, 191, 36, 0.4)', text: '#fbbf24' },
    err: { bg: 'rgba(239, 68, 68, 0.1)', border: 'rgba(239, 68, 68, 0.4)', text: '#ef4444' },
    idle: { bg: 'rgba(148, 163, 184, 0.1)', border: 'rgba(148, 163, 184, 0.3)', text: '#94a3b8' },
  }
  const c = colorMap[status]
  return (
    <div
      style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: '10px 14px',
        background: c.bg,
        border: `1px solid ${c.border}`,
        borderRadius: 8,
        fontSize: 13,
      }}
    >
      <span style={{ color: '#cdd6f4' }}>{label}</span>
      <span style={{ color: c.text, fontWeight: 500 }}>{value}</span>
    </div>
  )
})

interface HighlightedJsonProps {
  data: unknown
}

function HighlightedJson({ data }: HighlightedJsonProps) {
  // 简易语法高亮：键、字符串、数字、布尔、null
  const json = useMemo(() => JSON.stringify(data, null, 2), [data])
  if (!json) return null
  const parts: React.ReactNode[] = []
  const regex = /("(?:\\.|[^"\\])*")(\s*:)?|(\btrue\b|\bfalse\b|\bnull\b)|(-?\d+(?:\.\d+)?)/g
  let lastIndex = 0
  let match: RegExpExecArray | null
  let key = 0
  while ((match = regex.exec(json)) !== null) {
    if (match.index > lastIndex) parts.push(json.slice(lastIndex, match.index))
    if (match[1]) {
      const isKey = Boolean(match[2])
      parts.push(
        <span key={key++} style={{ color: isKey ? '#89b4fa' : '#a6e3a1' }}>
          {match[1]}
          {match[2] || ''}
        </span>,
      )
    } else if (match[3]) {
      parts.push(<span key={key++} style={{ color: '#fab387' }}>{match[3]}</span>)
    } else if (match[4]) {
      parts.push(<span key={key++} style={{ color: '#fab387' }}>{match[4]}</span>)
    }
    lastIndex = regex.lastIndex
  }
  if (lastIndex < json.length) parts.push(json.slice(lastIndex))
  return (
    <pre
      style={{
        margin: 0,
        fontFamily: 'JetBrains Mono, monospace',
        fontSize: 12.5,
        lineHeight: 1.6,
        color: '#cdd6f4',
        whiteSpace: 'pre',
        wordBreak: 'normal',
        overflow: 'auto',
        maxHeight: '100%',
      }}
    >
      {parts}
    </pre>
  )
}

export default function JwtDecoder() {
  const [token, setToken] = useState(SAMPLE_JWT)
  const [showSample, setShowSample] = useState(true)

  const parsed = useMemo(() => {
    const trimmed = token.trim()
    if (!trimmed) {
      return { ok: false as const, error: '请输入 JWT 字符串' }
    }
    const segments = trimmed.split('.')
    if (segments.length !== 3) {
      return { ok: false as const, error: `JWT 必须由 3 段组成（当前 ${segments.length} 段），以英文句点分隔` }
    }
    let header: JwtHeader
    let payload: JwtPayload
    try {
      const headerStr = base64UrlDecode(segments[0])
      if (!headerStr) throw new Error('header 解码失败')
      header = JSON.parse(headerStr) as JwtHeader
    } catch {
      return { ok: false as const, error: 'Header 段不是合法的 Base64URL / JSON' }
    }
    try {
      const payloadStr = base64UrlDecode(segments[1])
      if (!payloadStr) throw new Error('payload 解码失败')
      payload = JSON.parse(payloadStr) as JwtPayload
    } catch {
      return { ok: false as const, error: 'Payload 段不是合法的 Base64URL / JSON' }
    }
    return { ok: true as const, header, payload, signature: segments[2], headerRaw: segments[0], payloadRaw: segments[1] }
  }, [token])

  const now = Math.floor(Date.now() / 1000)
  const expired = parsed.ok && parsed.payload.exp ? parsed.payload.exp < now : null
  const notYetValid = parsed.ok && parsed.payload.nbf ? parsed.payload.nbf > now : null
  const hasIat = parsed.ok && typeof parsed.payload.iat === 'number'

  const handleClear = useCallback(() => {
    setToken('')
  }, [])

  const handleLoadSample = useCallback(() => {
    setToken(SAMPLE_JWT)
  }, [])

  const handleCopy = useCallback(async (text: string) => {
    try {
      await navigator.clipboard.writeText(text)
    } catch {
      /* ignore */
    }
  }, [])

  return (
    <div
      className="app-container"
      style={{
        background: 'linear-gradient(180deg, #1a1a2e 0%, #16213e 100%)',
        padding: 16,
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        gap: 12,
        overflow: 'hidden',
      }}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h3 style={{ color: '#fff', margin: 0, fontSize: 18, fontWeight: 600 }}>JWT 解码与验证</h3>
          <p style={{ color: '#8b93b8', margin: '4px 0 0', fontSize: 12 }}>
            完全在浏览器本地解析 JWT，不会上传 Token 到任何服务器
          </p>
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          <button
            onClick={handleLoadSample}
            style={{
              padding: '6px 12px',
              fontSize: 12,
              background: 'rgba(139, 124, 240, 0.15)',
              border: '1px solid rgba(139, 124, 240, 0.3)',
              borderRadius: 6,
              color: '#a29bfe',
              cursor: 'pointer',
            }}
          >
            加载示例
          </button>
          <button
            onClick={handleClear}
            style={{
              padding: '6px 12px',
              fontSize: 12,
              background: 'rgba(239, 68, 68, 0.12)',
              border: '1px solid rgba(239, 68, 68, 0.3)',
              borderRadius: 6,
              color: '#fca5a5',
              cursor: 'pointer',
            }}
          >
            清空
          </button>
        </div>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
        <label style={{ color: '#a0a8c0', fontSize: 12, fontWeight: 500 }}>JWT 字符串</label>
        <textarea
          value={token}
          onChange={(e) => {
            setToken(e.target.value)
            setShowSample(false)
          }}
          placeholder="粘贴 JWT，例如 eyJhbGciOi..."
          spellCheck={false}
          style={{
            width: '100%',
            minHeight: 90,
            padding: 10,
            fontFamily: 'JetBrains Mono, monospace',
            fontSize: 12.5,
            background: 'rgba(15, 15, 26, 0.7)',
            color: '#cdd6f4',
            border: '1px solid rgba(139, 124, 240, 0.2)',
            borderRadius: 8,
            outline: 'none',
            resize: 'vertical',
          }}
        />
        {showSample && (
          <span style={{ color: '#6c7086', fontSize: 11 }}>已加载示例 Token，可直接编辑或粘贴自己的 Token</span>
        )}
      </div>

      {!parsed.ok ? (
        <div
          style={{
            padding: 14,
            background: 'rgba(239, 68, 68, 0.1)',
            border: '1px solid rgba(239, 68, 68, 0.4)',
            borderRadius: 8,
            color: '#fca5a5',
            fontSize: 13,
          }}
        >
          {parsed.error}
        </div>
      ) : (
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'minmax(0, 1fr) minmax(0, 1fr)',
            gap: 12,
            flex: 1,
            minHeight: 0,
          }}
        >
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8, minHeight: 0, overflow: 'auto' }}>
            <SectionTitle>Header · 算法与类型</SectionTitle>
            <div
              style={{
                background: 'rgba(15, 15, 26, 0.7)',
                border: '1px solid rgba(139, 124, 240, 0.18)',
                borderRadius: 8,
                padding: 12,
                maxHeight: 220,
                overflow: 'auto',
              }}
            >
              <HighlightedJson data={parsed.header} />
            </div>

            <SectionTitle>Payload · 业务数据与声明</SectionTitle>
            <div
              style={{
                background: 'rgba(15, 15, 26, 0.7)',
                border: '1px solid rgba(139, 124, 240, 0.18)',
                borderRadius: 8,
                padding: 12,
                maxHeight: 280,
                overflow: 'auto',
              }}
            >
              <HighlightedJson data={parsed.payload} />
            </div>

            <SectionTitle>Signature · 签名段（Base64URL）</SectionTitle>
            <div
              onClick={() => handleCopy(parsed.signature)}
              title="点击复制"
              style={{
                background: 'rgba(15, 15, 26, 0.7)',
                border: '1px solid rgba(139, 124, 240, 0.18)',
                borderRadius: 8,
                padding: 12,
                fontFamily: 'JetBrains Mono, monospace',
                fontSize: 11.5,
                color: '#cdd6f4',
                wordBreak: 'break-all',
                cursor: 'pointer',
                maxHeight: 80,
                overflow: 'auto',
              }}
            >
              {parsed.signature}
            </div>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 8, minHeight: 0, overflow: 'auto' }}>
            <SectionTitle>声明验证</SectionTitle>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              <StatusRow
                label="算法 (alg)"
                status={parsed.header.alg === 'none' ? 'err' : 'ok'}
                value={`${parsed.header.alg || '未知'}${parsed.header.alg === 'none' ? '（不安全）' : ''}`}
              />
              <StatusRow
                label="过期时间 (exp)"
                status={expired === null ? 'idle' : expired ? 'err' : 'ok'}
                value={
                  parsed.payload.exp
                    ? `${formatTimestamp(parsed.payload.exp)}（${expired ? '已过期' : relativeTime(parsed.payload.exp)}）`
                    : '未设置'
                }
              />
              <StatusRow
                label="生效时间 (nbf)"
                status={notYetValid === null ? 'idle' : notYetValid ? 'warn' : 'ok'}
                value={
                  parsed.payload.nbf
                    ? `${formatTimestamp(parsed.payload.nbf)}（${notYetValid ? '尚未生效' : '已生效'}）`
                    : '未设置'
                }
              />
              <StatusRow
                label="签发时间 (iat)"
                status={hasIat ? 'ok' : 'idle'}
                value={hasIat ? formatTimestamp(parsed.payload.iat as number) : '未设置'}
              />
              <StatusRow
                label="签发者 (iss)"
                status={parsed.payload.iss ? 'ok' : 'idle'}
                value={parsed.payload.iss || '未设置'}
              />
              <StatusRow
                label="受众 (aud)"
                status={parsed.payload.aud ? 'ok' : 'idle'}
                value={Array.isArray(parsed.payload.aud) ? parsed.payload.aud.join(', ') : parsed.payload.aud || '未设置'}
              />
              <StatusRow
                label="主题 (sub)"
                status={parsed.payload.sub ? 'ok' : 'idle'}
                value={parsed.payload.sub || '未设置'}
              />
            </div>

            <SectionTitle>使用提示</SectionTitle>
            <ul style={{ margin: 0, paddingLeft: 18, color: '#a0a8c0', fontSize: 12, lineHeight: 1.7 }}>
              <li>本工具仅在浏览器本地解码，Token 不会离开你的设备</li>
              <li>alg: none 是不安全的签名方式，生产环境应避免使用</li>
              <li>exp / nbf 验证基于浏览器当前时间，跨设备可能存在时差</li>
              <li>签名段无法在浏览器中直接验证（需要服务端密钥）</li>
            </ul>
          </div>
        </div>
      )}
    </div>
  )
}

const SectionTitle = memo(function SectionTitle({ children }: { children: React.ReactNode }) {
  return (
    <div
      style={{
        color: '#8b93b8',
        fontSize: 12,
        fontWeight: 600,
        textTransform: 'uppercase',
        letterSpacing: '0.5px',
        marginTop: 2,
      }}
    >
      {children}
    </div>
  )
})
