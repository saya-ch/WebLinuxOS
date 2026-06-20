import { useState, useMemo, useCallback, memo } from 'react'

interface StrengthResult {
  score: 0 | 1 | 2 | 3 | 4
  label: string
  color: string
  bgColor: string
  entropy: number
  crackTime: string
  feedback: string[]
  // 用于绘制
  segments: { filled: boolean; color: string }[]
}

// 字符集熵值（每字符 bits）
function charsetEntropy(pw: string): { pool: number; description: string } {
  let pool = 0
  const descs: string[] = []
  if (/[a-z]/.test(pw)) {
    pool += 26
    descs.push('小写字母')
  }
  if (/[A-Z]/.test(pw)) {
    pool += 26
    descs.push('大写字母')
  }
  if (/[0-9]/.test(pw)) {
    pool += 10
    descs.push('数字')
  }
  if (/[^A-Za-z0-9]/.test(pw)) {
    pool += 33
    descs.push('符号')
  }
  if (/[\u4e00-\u9fa5]/.test(pw)) {
    pool += 20902
    descs.push('汉字')
  }
  return { pool, description: descs.join(' + ') || '空' }
}

// 常见弱密码列表（节选高频）
const COMMON_PASSWORDS = new Set([
  'password', '123456', '12345678', 'qwerty', 'abc123', '111111', '1234567',
  'iloveyou', 'admin', 'welcome', 'monkey', 'login', 'princess', 'dragon',
  'sunshine', 'master', 'letmein', 'qwerty123', '000000', '1q2w3e4r', 'asdfghjkl',
  'password1', '123456789', '1234567890', 'qwertyuiop', 'passw0rd',
])

// 评估函数
function evaluatePassword(pw: string): StrengthResult {
  const feedback: string[] = []
  if (!pw) {
    return {
      score: 0,
      label: '请输入密码',
      color: '#94a3b8',
      bgColor: 'rgba(148, 163, 184, 0.2)',
      entropy: 0,
      crackTime: '—',
      feedback: ['建议长度 12 位以上，同时包含字母、数字、符号'],
      segments: [false, false, false, false, false].map((_, i) => ({
        filled: false,
        color: ['#ef4444', '#f97316', '#eab308', '#22c55e', '#10b981'][i],
      })),
    }
  }

  const lower = pw.toLowerCase()
  if (COMMON_PASSWORDS.has(lower)) {
    return {
      score: 0,
      label: '极弱（常见密码）',
      color: '#ef4444',
      bgColor: 'rgba(239, 68, 68, 0.2)',
      entropy: 0,
      crackTime: '瞬间破解',
      feedback: ['该密码在公开泄露库中出现，请立即更换', '建议使用密码管理器随机生成'],
      segments: [true, false, false, false, false].map((f, i) => ({
        filled: f,
        color: ['#ef4444', '#f97316', '#eab308', '#22c55e', '#10b981'][i],
      })),
    }
  }

  const { pool } = charsetEntropy(pw)
  const entropy = pw.length > 0 ? Math.log2(Math.max(pool, 2)) * pw.length : 0

  // 检测重复模式
  const repeats = /(.)\1{2,}/.test(pw)
  const sequence = /(?:012|123|234|345|456|567|678|789|890|abc|bcd|cde|qwe|wer|asd|sdf|zxc)/i.test(pw)
  let score: 0 | 1 | 2 | 3 | 4 = 0
  if (entropy >= 28) score = 1
  if (entropy >= 50) score = 2
  if (entropy >= 70) score = 3
  if (entropy >= 90) score = 4

  if (pw.length < 8) {
    feedback.push('长度过短，建议至少 12 位')
    score = Math.min(score, 1) as 0 | 1 | 2 | 3 | 4
  } else if (pw.length < 12 && score > 2) {
    feedback.push('建议增加到 12 位以上')
  } else if (pw.length >= 16 && score === 4) {
    feedback.push('长度优秀')
  }
  if (pool < 36) {
    feedback.push('字符种类单一，建议混合大小写、数字、符号')
  } else if (pool >= 95) {
    feedback.push('字符种类丰富')
  }
  if (repeats) feedback.push('存在连续重复字符（如 aaa），建议避免')
  if (sequence) feedback.push('存在连续序列（如 123、abc），建议打散')

  // 估算离线破解时间（假设 1e10 guesses/sec）
  const guesses = Math.pow(2, entropy)
  const seconds = guesses / 1e10
  let crackTime: string
  if (seconds < 1) crackTime = '瞬间破解'
  else if (seconds < 60) crackTime = `${seconds.toFixed(0)} 秒`
  else if (seconds < 3600) crackTime = `${(seconds / 60).toFixed(0)} 分钟`
  else if (seconds < 86400) crackTime = `${(seconds / 3600).toFixed(1)} 小时`
  else if (seconds < 2592000) crackTime = `${(seconds / 86400).toFixed(1)} 天`
  else if (seconds < 31536000) crackTime = `${(seconds / 2592000).toFixed(1)} 月`
  else if (seconds < 31536000 * 100) crackTime = `${(seconds / 31536000).toFixed(1)} 年`
  else if (seconds < 31536000 * 1e6) crackTime = `${(seconds / (31536000 * 1e3)).toFixed(0)} 千年`
  else crackTime = '远超宇宙年龄'

  const colorMap = ['#ef4444', '#f97316', '#eab308', '#22c55e', '#10b981']
  const labelMap = ['极弱', '较弱', '一般', '良好', '很强']
  const bgMap = [
    'rgba(239, 68, 68, 0.15)',
    'rgba(249, 115, 22, 0.15)',
    'rgba(234, 179, 8, 0.15)',
    'rgba(34, 197, 94, 0.15)',
    'rgba(16, 185, 129, 0.15)',
  ]

  return {
    score,
    label: labelMap[score],
    color: colorMap[score],
    bgColor: bgMap[score],
    entropy,
    crackTime,
    feedback: feedback.length > 0 ? feedback : ['密码强度良好，建议配合密码管理器使用'],
    segments: [0, 1, 2, 3, 4].map((i) => ({
      filled: i <= score,
      color: colorMap[score],
    })),
  }
}

const StrengthMeter = memo(function StrengthMeter({ result }: { result: StrengthResult }) {
  return (
    <div>
      <div style={{ display: 'flex', gap: 4, marginBottom: 8 }}>
        {result.segments.map((seg, i) => (
          <div
            key={i}
            style={{
              flex: 1,
              height: 8,
              borderRadius: 4,
              background: seg.filled ? seg.color : 'rgba(148, 163, 184, 0.15)',
              transition: 'background 0.25s ease',
            }}
          />
        ))}
      </div>
      <div style={{ display: 'flex', justifyContent: 'space-between' }}>
        <span style={{ color: result.color, fontWeight: 600, fontSize: 14 }}>{result.label}</span>
        <span style={{ color: '#8b93b8', fontSize: 12 }}>
          熵 {result.entropy.toFixed(1)} bits · 离线破解 ≈ {result.crackTime}
        </span>
      </div>
    </div>
  )
})

export default function PasswordStrength() {
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [breachCount, setBreachCount] = useState<number | null>(null)
  const [checking, setChecking] = useState(false)
  const [checkError, setCheckError] = useState<string | null>(null)

  const result = useMemo(() => evaluatePassword(password), [password])
  const { pool, description } = useMemo(() => charsetEntropy(password), [password])

  const handleCopy = useCallback(async () => {
    if (!password) return
    try {
      await navigator.clipboard.writeText(password)
    } catch {
      /* ignore */
    }
  }, [password])

  const generateStrong = useCallback((len: number) => {
    const lower = 'abcdefghijkmnopqrstuvwxyz'
    const upper = 'ABCDEFGHJKLMNPQRSTUVWXYZ'
    const digits = '23456789'
    const symbols = '!@#$%^&*()-_=+[]{};:,.<>?'
    const all = lower + upper + digits + symbols
    const arr = new Uint32Array(len)
    crypto.getRandomValues(arr)
    let out = ''
    // 至少包含每种字符
    out += lower[arr[0] % lower.length]
    out += upper[arr[1] % upper.length]
    out += digits[arr[2] % digits.length]
    out += symbols[arr[3] % symbols.length]
    for (let i = 4; i < len; i++) out += all[arr[i] % all.length]
    // 简单洗牌
    const shuffled = out.split('')
    for (let i = shuffled.length - 1; i > 0; i--) {
      const j = arr[i] % (i + 1)
      ;[shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]]
    }
    setPassword(shuffled.join(''))
    setShowPassword(true)
  }, [])

  const checkBreach = useCallback(async () => {
    if (!password) return
    setChecking(true)
    setCheckError(null)
    setBreachCount(null)
    try {
      // 使用 k-anonymity API：只发送 SHA-1 前 5 位
      const sha1Hex = await sha1(password)
      const prefix = sha1Hex.slice(0, 5).toUpperCase()
      const suffix = sha1Hex.slice(5).toUpperCase()
      const response = await fetch(`https://api.pwnedpasswords.com/range/${prefix}`, {
        headers: { 'Add-Padding': 'true' },
      })
      if (!response.ok) throw new Error(`HTTP ${response.status}`)
      const text = await response.text()
      const lines = text.split('\n')
      let found = 0
      for (const line of lines) {
        const [hashSuffix, count] = line.trim().split(':')
        if (hashSuffix === suffix) {
          found = Number(count) || 0
          break
        }
      }
      setBreachCount(found)
    } catch (err) {
      setCheckError(err instanceof Error ? err.message : '查询失败')
    } finally {
      setChecking(false)
    }
  }, [password])

  return (
    <div
      className="app-container"
      style={{
        background: 'linear-gradient(180deg, #1a1a2e 0%, #16213e 100%)',
        padding: 16,
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        gap: 14,
        overflow: 'auto',
      }}
    >
      <div>
        <h3 style={{ color: '#fff', margin: 0, fontSize: 18, fontWeight: 600 }}>密码强度分析</h3>
        <p style={{ color: '#8b93b8', margin: '4px 0 0', fontSize: 12 }}>
          实时评估密码强度，支持 HIBP 公开泄露库在线校验（k-anonymity，密码不上传）
        </p>
      </div>

      <div
        style={{
          padding: 16,
          background: result.bgColor,
          border: `1px solid ${result.color}33`,
          borderRadius: 10,
        }}
      >
        <div style={{ display: 'flex', gap: 8 }}>
          <input
            type={showPassword ? 'text' : 'password'}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="输入密码进行分析"
            spellCheck={false}
            style={{
              flex: 1,
              padding: '10px 12px',
              fontSize: 15,
              background: 'rgba(15, 15, 26, 0.8)',
              color: '#cdd6f4',
              border: '1px solid rgba(139, 124, 240, 0.25)',
              borderRadius: 8,
              outline: 'none',
              fontFamily: 'JetBrains Mono, monospace',
            }}
          />
          <button
            onClick={() => setShowPassword((v) => !v)}
            style={{
              padding: '0 14px',
              background: 'rgba(139, 124, 240, 0.15)',
              border: '1px solid rgba(139, 124, 240, 0.3)',
              borderRadius: 8,
              color: '#a29bfe',
              cursor: 'pointer',
              fontSize: 12,
            }}
          >
            {showPassword ? '隐藏' : '显示'}
          </button>
          <button
            onClick={handleCopy}
            style={{
              padding: '0 14px',
              background: 'rgba(34, 197, 94, 0.15)',
              border: '1px solid rgba(34, 197, 94, 0.3)',
              borderRadius: 8,
              color: '#86efac',
              cursor: 'pointer',
              fontSize: 12,
            }}
          >
            复制
          </button>
        </div>
        <div style={{ marginTop: 14 }}>
          <StrengthMeter result={result} />
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: 8 }}>
        <InfoCard label="字符长度" value={`${password.length} 位`} />
        <InfoCard label="字符池大小" value={`${pool}（${description || '—'}）`} />
        <InfoCard label="信息熵" value={`${result.entropy.toFixed(2)} bits`} />
        <InfoCard label="理论破解时间" value={result.crackTime} />
      </div>

      {result.feedback.length > 0 && (
        <div
          style={{
            padding: 12,
            background: 'rgba(15, 15, 26, 0.7)',
            border: '1px solid rgba(139, 124, 240, 0.18)',
            borderRadius: 8,
          }}
        >
          <div
            style={{
              color: '#8b93b8',
              fontSize: 12,
              fontWeight: 600,
              textTransform: 'uppercase',
              letterSpacing: '0.5px',
              marginBottom: 6,
            }}
          >
            改进建议
          </div>
          <ul style={{ margin: 0, paddingLeft: 18, color: '#cdd6f4', fontSize: 13, lineHeight: 1.7 }}>
            {result.feedback.map((s, i) => (
              <li key={i}>{s}</li>
            ))}
          </ul>
        </div>
      )}

      <div
        style={{
          padding: 12,
          background: 'rgba(15, 15, 26, 0.7)',
          border: '1px solid rgba(139, 124, 240, 0.18)',
          borderRadius: 8,
        }}
      >
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: 8,
            gap: 8,
            flexWrap: 'wrap',
          }}
        >
          <div style={{ color: '#8b93b8', fontSize: 12, fontWeight: 600, textTransform: 'uppercase' }}>
            公开泄露库查询（HIBP）
          </div>
          <button
            onClick={checkBreach}
            disabled={!password || checking}
            style={{
              padding: '6px 12px',
              fontSize: 12,
              background: checking
                ? 'rgba(148, 163, 184, 0.15)'
                : 'rgba(139, 124, 240, 0.2)',
              border: '1px solid rgba(139, 124, 240, 0.3)',
              borderRadius: 6,
              color: checking ? '#94a3b8' : '#a29bfe',
              cursor: checking || !password ? 'not-allowed' : 'pointer',
            }}
          >
            {checking ? '查询中…' : '查询是否泄露'}
          </button>
        </div>
        {checkError && (
          <div style={{ color: '#fca5a5', fontSize: 12 }}>查询失败：{checkError}</div>
        )}
        {breachCount !== null && (
          <div
            style={{
              color: breachCount > 0 ? '#fca5a5' : '#86efac',
              fontSize: 13,
            }}
          >
            {breachCount > 0
              ? `该密码在公开泄露库中出现过 ${breachCount.toLocaleString()} 次，请立即更换`
              : '未在已知泄露记录中发现，安全性较好'}
          </div>
        )}
        <div style={{ color: '#6c7086', fontSize: 11, marginTop: 6, lineHeight: 1.5 }}>
          仅向 HIBP 发送密码 SHA-1 哈希的前 5 位（k-anonymity 协议），完整密码不离开本地
        </div>
      </div>

      <div
        style={{
          padding: 12,
          background: 'rgba(15, 15, 26, 0.7)',
          border: '1px solid rgba(139, 124, 240, 0.18)',
          borderRadius: 8,
        }}
      >
        <div
          style={{
            color: '#8b93b8',
            fontSize: 12,
            fontWeight: 600,
            textTransform: 'uppercase',
            letterSpacing: '0.5px',
            marginBottom: 8,
          }}
        >
          快速生成强密码
        </div>
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          {[16, 24, 32, 64].map((len) => (
            <button
              key={len}
              onClick={() => generateStrong(len)}
              style={{
                padding: '6px 14px',
                fontSize: 12,
                background: 'rgba(34, 197, 94, 0.12)',
                border: '1px solid rgba(34, 197, 94, 0.3)',
                borderRadius: 6,
                color: '#86efac',
                cursor: 'pointer',
              }}
            >
              {len} 位随机
            </button>
          ))}
        </div>
      </div>

      <div style={{ color: '#6c7086', fontSize: 11, lineHeight: 1.6 }}>
        评分参考：bits &lt; 28 极弱 · 28-50 较弱 · 50-70 一般 · 70-90 良好 · 90+ 很强
      </div>
    </div>
  )
}

const InfoCard = memo(function InfoCard({ label, value }: { label: string; value: string }) {
  return (
    <div
      style={{
        padding: 12,
        background: 'rgba(15, 15, 26, 0.7)',
        border: '1px solid rgba(139, 124, 240, 0.18)',
        borderRadius: 8,
      }}
    >
      <div style={{ color: '#8b93b8', fontSize: 11, marginBottom: 4 }}>{label}</div>
      <div style={{ color: '#cdd6f4', fontSize: 14, fontWeight: 500, wordBreak: 'break-all' }}>{value}</div>
    </div>
  )
})

async function sha1(text: string): Promise<string> {
  const buf = new TextEncoder().encode(text)
  const hash = await crypto.subtle.digest('SHA-1', buf)
  return Array.from(new Uint8Array(hash))
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('')
}
