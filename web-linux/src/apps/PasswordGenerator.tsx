import { useState, useCallback } from 'react'

const PasswordGenerator = () => {
  const [password, setPassword] = useState('')
  const [length, setLength] = useState(16)
  const [includeUppercase, setIncludeUppercase] = useState(true)
  const [includeLowercase, setIncludeLowercase] = useState(true)
  const [includeNumbers, setIncludeNumbers] = useState(true)
  const [includeSymbols, setIncludeSymbols] = useState(true)
  const [history, setHistory] = useState<string[]>([])
  const [copied, setCopied] = useState(false)

  const generatePassword = useCallback(() => {
    const uppercase = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'
    const lowercase = 'abcdefghijklmnopqrstuvwxyz'
    const numbers = '0123456789'
    const symbols = '!@#$%^&*()_+-=[]{}|;:,.<>?'

    let charset = ''
    if (includeUppercase) charset += uppercase
    if (includeLowercase) charset += lowercase
    if (includeNumbers) charset += numbers
    if (includeSymbols) charset += symbols

    if (!charset) {
      alert('请至少选择一种字符类型！')
      return
    }

    let generated = ''
    for (let i = 0; i < length; i++) {
      generated += charset.charAt(Math.floor(Math.random() * charset.length))
    }

    setPassword(generated)
    setHistory((prev) => [generated, ...prev.slice(0, 19)])
  }, [length, includeUppercase, includeLowercase, includeNumbers, includeSymbols])

  const copyToClipboard = useCallback(async () => {
    if (!password) return
    await navigator.clipboard.writeText(password)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }, [password])

  const calculateStrength = useCallback(() => {
    let score = 0
    if (length >= 8) score += 1
    if (length >= 12) score += 1
    if (length >= 16) score += 1
    if (includeUppercase) score += 1
    if (includeLowercase) score += 1
    if (includeNumbers) score += 1
    if (includeSymbols) score += 1

    if (score <= 2) return { level: '弱', color: '#ef4444', percent: 25 }
    if (score <= 4) return { level: '中等', color: '#f59e0b', percent: 50 }
    if (score <= 6) return { level: '强', color: '#10b981', percent: 75 }
    return { level: '非常强', color: '#059669', percent: 100 }
  }, [length, includeUppercase, includeLowercase, includeNumbers, includeSymbols])

  const strength = calculateStrength()

  return (
    <div
      style={{
        background: 'linear-gradient(180deg, #1a1a2e 0%, #16213e 100%)',
        padding: 24,
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        gap: 20,
      }}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <h3 style={{ color: '#fff', margin: 0, fontSize: 22, fontWeight: 700 }}>
          🔐 密码生成器
        </h3>
      </div>

      {/* 密码显示区域 */}
      <div
        style={{
          background: 'linear-gradient(145deg, #0f0f1a, #0a0a12)',
          borderRadius: 16,
          padding: 20,
          border: '1px solid rgba(255,255,255,0.1)',
          boxShadow: 'inset 0 4px 12px rgba(0,0,0,0.3)',
        }}
      >
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            gap: 16,
          }}
        >
          <div
            style={{
              flex: 1,
              color: '#fff',
              fontSize: 24,
              fontWeight: 600,
              fontFamily: 'monospace',
              wordBreak: 'break-all',
              letterSpacing: '2px',
            }}
          >
            {password || '点击生成密码'}
          </div>
          <button
            onClick={copyToClipboard}
            style={{
              padding: '12px 24px',
              background: copied
                ? 'linear-gradient(145deg, #10b981, #059669)'
                : 'linear-gradient(145deg, #60a5fa, #3b82f6)',
              border: 'none',
              borderRadius: 12,
              color: '#fff',
              fontSize: 14,
              fontWeight: 600,
              cursor: 'pointer',
              transition: 'all 0.2s ease',
              boxShadow: copied
                ? '0 2px 8px rgba(16, 185, 129, 0.4)'
                : '0 2px 8px rgba(96, 165, 250, 0.4)',
            }}
          >
            {copied ? '✅ 已复制' : '📋 复制'}
          </button>
        </div>

        {/* 强度指示器 */}
        {password && (
          <div style={{ marginTop: 16 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
              <span style={{ color: '#9090a0', fontSize: 13, fontWeight: 600 }}>
                密码强度
              </span>
              <span style={{ color: strength.color, fontSize: 13, fontWeight: 700 }}>
                {strength.level}
              </span>
            </div>
            <div
              style={{
                height: 8,
                background: 'rgba(255,255,255,0.1)',
                borderRadius: 4,
                overflow: 'hidden',
              }}
            >
              <div
                style={{
                  height: '100%',
                  width: `${strength.percent}%`,
                  background: strength.color,
                  borderRadius: 4,
                  transition: 'all 0.3s ease',
                }}
              />
            </div>
          </div>
        )}
      </div>

      {/* 选项区域 */}
      <div
        style={{
          background: 'linear-gradient(145deg, #23233a, #1f1f35)',
          borderRadius: 16,
          padding: 20,
          border: '1px solid rgba(255,255,255,0.05)',
          flex: 1,
          overflowY: 'auto',
        }}
      >
        <div style={{ marginBottom: 20 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 12 }}>
            <span style={{ color: '#fff', fontSize: 14, fontWeight: 600 }}>
              密码长度
            </span>
            <span style={{ color: '#60a5fa', fontSize: 18, fontWeight: 700 }}>
              {length}
            </span>
          </div>
          <input
            type="range"
            min={4}
            max={64}
            value={length}
            onChange={(e) => setLength(parseInt(e.target.value))}
            style={{
              width: '100%',
              accentColor: '#60a5fa',
            }}
          />
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {[
            { label: '包含大写字母 (A-Z)', value: includeUppercase, set: setIncludeUppercase },
            { label: '包含小写字母 (a-z)', value: includeLowercase, set: setIncludeLowercase },
            { label: '包含数字 (0-9)', value: includeNumbers, set: setIncludeNumbers },
            { label: '包含特殊符号 (!@#$)', value: includeSymbols, set: setIncludeSymbols },
          ].map((option, index) => (
            <label
              key={index}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 12,
                padding: 12,
                background: 'rgba(255,255,255,0.02)',
                borderRadius: 10,
                cursor: 'pointer',
                transition: 'all 0.2s ease',
              }}
            >
              <input
                type="checkbox"
                checked={option.value}
                onChange={(e) => option.set(e.target.checked)}
                style={{
                  width: 20,
                  height: 20,
                  accentColor: '#60a5fa',
                  cursor: 'pointer',
                }}
              />
              <span style={{ color: '#fff', fontSize: 14, fontWeight: 500 }}>
                {option.label}
              </span>
            </label>
          ))}
        </div>
      </div>

      {/* 生成按钮 */}
      <button
        onClick={generatePassword}
        style={{
          padding: '16px',
          background: 'linear-gradient(145deg, #4ade80, #22c55e)',
          border: 'none',
          borderRadius: 16,
          color: '#fff',
          fontSize: 18,
          fontWeight: 700,
          cursor: 'pointer',
          transition: 'all 0.2s ease',
          boxShadow: '0 4px 12px rgba(74, 222, 128, 0.4)',
        }}
      >
        🎲 生成新密码
      </button>

      {/* 历史记录 */}
      {history.length > 0 && (
        <div
          style={{
            background: 'linear-gradient(145deg, #23233a, #1f1f35)',
            borderRadius: 16,
            padding: 20,
            border: '1px solid rgba(255,255,255,0.05)',
            maxHeight: 200,
            overflowY: 'auto',
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
            <span style={{ color: '#fff', fontSize: 14, fontWeight: 600 }}>
              📋 历史记录
            </span>
            <button
              onClick={() => setHistory([])}
              style={{
                padding: '6px 12px',
                background: 'rgba(239, 68, 68, 0.1)',
                border: 'none',
                borderRadius: 8,
                color: '#ef4444',
                fontSize: 12,
                cursor: 'pointer',
              }}
            >
              清空
            </button>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {history.map((pw, index) => (
              <div
                key={index}
                onClick={() => setPassword(pw)}
                style={{
                  padding: 10,
                  background: 'rgba(255,255,255,0.03)',
                  borderRadius: 8,
                  cursor: 'pointer',
                  fontFamily: 'monospace',
                  fontSize: 13,
                  color: '#ccc',
                  transition: 'all 0.2s ease',
                }}
              >
                {pw}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

export default PasswordGenerator
