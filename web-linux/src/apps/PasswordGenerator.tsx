import { useState } from 'react'

export default function PasswordGenerator() {
  const [password, setPassword] = useState('')
  const [length, setLength] = useState(16)
  const [includeUppercase, setIncludeUppercase] = useState(true)
  const [includeLowercase, setIncludeLowercase] = useState(true)
  const [includeNumbers, setIncludeNumbers] = useState(true)
  const [includeSymbols, setIncludeSymbols] = useState(true)

  const generatePassword = () => {
    const uppercase = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'
    const lowercase = 'abcdefghijklmnopqrstuvwxyz'
    const numbers = '0123456789'
    const symbols = '!@#$%^&*()_+~`|}{[]:;?><,./-='

    let charset = ''
    if (includeUppercase) charset += uppercase
    if (includeLowercase) charset += lowercase
    if (includeNumbers) charset += numbers
    if (includeSymbols) charset += symbols

    if (!charset) {
      setPassword('请至少选择一种字符类型')
      return
    }

    let result = ''
    for (let i = 0; i < length; i++) {
      const randomIndex = Math.floor(Math.random() * charset.length)
      result += charset[randomIndex]
    }
    setPassword(result)
  }

  const copyToClipboard = () => {
    navigator.clipboard.writeText(password)
  }

  const calculateStrength = () => {
    let score = 0
    if (length >= 8) score++
    if (length >= 12) score++
    if (length >= 16) score++
    if (includeUppercase) score++
    if (includeLowercase) score++
    if (includeNumbers) score++
    if (includeSymbols) score++

    if (score <= 2) return { label: '弱', color: '#f38ba8', level: 1 }
    if (score <= 4) return { label: '中等', color: '#f9e2af', level: 2 }
    if (score <= 6) return { label: '强', color: '#a6e3a1', level: 3 }
    return { label: '非常强', color: '#74c7ec', level: 4 }
  }

  const strength = calculateStrength()

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', background: '#1e1e2e', color: '#cdd6f4' }}>
      <div style={{ padding: '16px 20px', borderBottom: '1px solid #313244', background: '#181825' }}>
        <h1 style={{ margin: '0 0 6px', fontSize: '20px', fontWeight: 700 }}>🔑 密码生成器</h1>
        <p style={{ margin: 0, fontSize: '12px', color: '#a6adc8' }}>生成安全、随机的密码</p>
      </div>

      <div style={{ flex: 1, padding: '24px', overflow: 'auto', display: 'flex', flexDirection: 'column', gap: '20px' }}>
        <div style={{ background: '#313244', borderRadius: '14px', padding: '18px', display: 'flex', gap: '12px', alignItems: 'center' }}>
          <div style={{ flex: 1, fontFamily: 'monospace', fontSize: '18px', wordBreak: 'break-all', color: '#a6e3a1' }}>
            {password || '点击生成密码'}
          </div>
          {password && (
            <button onClick={copyToClipboard} style={{ padding: '10px 16px', background: '#45475a', border: 'none', borderRadius: '10px', color: '#cdd6f4', cursor: 'pointer', fontSize: '13px' }}>
              复制
            </button>
          )}
        </div>

        {password && (
          <div style={{ background: '#313244', borderRadius: '14px', padding: '16px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
              <span style={{ fontSize: '13px', color: '#a6adc8' }}>密码强度</span>
              <span style={{ fontSize: '13px', fontWeight: 600, color: strength.color }}>{strength.label}</span>
            </div>
            <div style={{ height: '8px', background: '#181825', borderRadius: '4px', overflow: 'hidden' }}>
              <div style={{ height: '100%', width: `${(strength.level / 4) * 100}%`, background: strength.color, transition: 'all 0.3s ease' }} />
            </div>
          </div>
        )}

        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <div style={{ background: '#313244', borderRadius: '14px', padding: '16px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '12px' }}>
              <span style={{ fontSize: '13px' }}>密码长度</span>
              <span style={{ fontSize: '13px', fontWeight: 600, color: '#89b4fa' }}>{length}</span>
            </div>
            <input
              type="range"
              min="4"
              max="64"
              value={length}
              onChange={(e) => setLength(Number(e.target.value))}
              style={{ width: '100%' }}
            />
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
            <label style={{ background: '#313244', borderRadius: '12px', padding: '14px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '10px' }}>
              <input type="checkbox" checked={includeUppercase} onChange={(e) => setIncludeUppercase(e.target.checked)} />
              <span style={{ fontSize: '13px' }}>大写字母 (A-Z)</span>
            </label>
            <label style={{ background: '#313244', borderRadius: '12px', padding: '14px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '10px' }}>
              <input type="checkbox" checked={includeLowercase} onChange={(e) => setIncludeLowercase(e.target.checked)} />
              <span style={{ fontSize: '13px' }}>小写字母 (a-z)</span>
            </label>
            <label style={{ background: '#313244', borderRadius: '12px', padding: '14px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '10px' }}>
              <input type="checkbox" checked={includeNumbers} onChange={(e) => setIncludeNumbers(e.target.checked)} />
              <span style={{ fontSize: '13px' }}>数字 (0-9)</span>
            </label>
            <label style={{ background: '#313244', borderRadius: '12px', padding: '14px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '10px' }}>
              <input type="checkbox" checked={includeSymbols} onChange={(e) => setIncludeSymbols(e.target.checked)} />
              <span style={{ fontSize: '13px' }}>特殊符号 (!@#$)</span>
            </label>
          </div>

          <button onClick={generatePassword} style={{ padding: '16px', background: 'linear-gradient(135deg, #89b4fa 0%, #74c7ec 100%)', border: 'none', borderRadius: '12px', color: '#1e1e2e', fontWeight: 700, fontSize: '16px', cursor: 'pointer', marginTop: '8px' }}>
            🎲 生成密码
          </button>
        </div>
      </div>
    </div>
  )
}
