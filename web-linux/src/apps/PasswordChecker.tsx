import { useState, useCallback, useMemo } from 'react'
import { Check, AlertTriangle, Shield, Eye, EyeOff, Copy, RefreshCw } from 'lucide-react'

interface PasswordStrength {
  score: number
  level: 'weak' | 'fair' | 'good' | 'strong' | 'excellent'
  message: string
  color: string
  suggestions: string[]
}

const PasswordChecker = () => {
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [showGenerator, setShowGenerator] = useState(false)
  const [generatorOptions, setGeneratorOptions] = useState({
    length: 16,
    includeUppercase: true,
    includeLowercase: true,
    includeNumbers: true,
    includeSymbols: true,
    excludeSimilar: false,
  })
  const [generatedPassword, setGeneratedPassword] = useState('')

  const checkPasswordStrength = useCallback((pwd: string): PasswordStrength => {
    let score = 0
    const suggestions: string[] = []

    if (pwd.length < 8) {
      suggestions.push('密码长度应至少为 8 个字符')
    } else if (pwd.length >= 8) {
      score += 1
    }
    if (pwd.length >= 12) {
      score += 1
    }
    if (pwd.length >= 16) {
      score += 1
    }

    if (/[a-z]/.test(pwd)) {
      score += 1
    } else {
      suggestions.push('添加小写字母')
    }

    if (/[A-Z]/.test(pwd)) {
      score += 1
    } else {
      suggestions.push('添加大写字母')
    }

    if (/[0-9]/.test(pwd)) {
      score += 1
    } else {
      suggestions.push('添加数字')
    }

    if (/[^a-zA-Z0-9]/.test(pwd)) {
      score += 1
    } else {
      suggestions.push('添加特殊字符 (!@#$%^&*)')
    }

    if (!/(.)\1{2,}/.test(pwd)) {
      score += 1
    } else {
      suggestions.push('避免连续重复的字符')
    }

    if (!/123|abc|qwe|asd|zxc|password|admin/i.test(pwd)) {
      score += 1
    } else {
      suggestions.push('避免常见模式或单词')
    }

    const uniqueChars = new Set(pwd).size
    if (uniqueChars >= pwd.length * 0.7) {
      score += 1
    }

    let level: PasswordStrength['level']
    let message: string
    let color: string

    if (score <= 2) {
      level = 'weak'
      message = '密码强度很弱'
      color = '#ef4444'
    } else if (score <= 4) {
      level = 'fair'
      message = '密码强度一般'
      color = '#f59e0b'
    } else if (score <= 6) {
      level = 'good'
      message = '密码强度良好'
      color = '#3b82f6'
    } else if (score <= 8) {
      level = 'strong'
      message = '密码强度很强'
      color = '#10b981'
    } else {
      level = 'excellent'
      message = '密码强度极佳'
      color = '#059669'
    }

    return { score, level, message, color, suggestions }
  }, [])

  const strength = useMemo(() => checkPasswordStrength(password), [password, checkPasswordStrength])

  const generatePassword = useCallback(() => {
    const lowercase = 'abcdefghjkmnpqrstuvwxyz'
    const uppercase = 'ABCDEFGHJKLMNPQRSTUVWXYZ'
    const numbers = '23456789'
    const symbols = '!@#$%^&*()_+-=[]{}|;:,.<>?'
    const allLowercase = 'abcdefghijklmnopqrstuvwxyz'
    const allUppercase = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'
    const allNumbers = '0123456789'

    let chars = ''
    if (generatorOptions.includeLowercase) {
      chars += generatorOptions.excludeSimilar ? lowercase : allLowercase
    }
    if (generatorOptions.includeUppercase) {
      chars += generatorOptions.excludeSimilar ? uppercase : allUppercase
    }
    if (generatorOptions.includeNumbers) {
      chars += generatorOptions.excludeSimilar ? numbers : allNumbers
    }
    if (generatorOptions.includeSymbols) {
      chars += symbols
    }

    if (!chars) {
      chars = allLowercase + allNumbers
    }

    let result = ''
    const array = new Uint32Array(generatorOptions.length)
    crypto.getRandomValues(array)
    
    for (let i = 0; i < generatorOptions.length; i++) {
      result += chars[array[i] % chars.length]
    }

    setGeneratedPassword(result)
    setPassword(result)
  }, [generatorOptions])

  const copyToClipboard = useCallback((text: string) => {
    navigator.clipboard.writeText(text)
  }, [])

  const renderStrengthBar = () => {
    const percentages = {
      weak: 20,
      fair: 40,
      good: 60,
      strong: 80,
      excellent: 100,
    }

    return (
      <div style={{ marginBottom: 16 }}>
        <div style={{
          height: 8,
          background: '#333',
          borderRadius: 4,
          overflow: 'hidden',
          marginBottom: 8,
        }}>
          <div style={{
            height: '100%',
            width: `${percentages[strength.level]}%`,
            background: strength.color,
            transition: 'all 0.3s ease',
          }} />
        </div>
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
        }}>
          <span style={{ 
            color: strength.color, 
            fontWeight: 600,
            fontSize: 14,
          }}>
            {strength.message}
          </span>
          <span style={{ 
            color: '#888', 
            fontSize: 12,
          }}>
            分数: {strength.score}/10
          </span>
        </div>
      </div>
    )
  }

  return (
    <div className="app-container" style={{
      height: '100%',
      overflowY: 'auto',
      padding: 20,
      background: 'linear-gradient(180deg, #1a1a2e 0%, #16213e 100%)',
    }}>
      <div style={{ maxWidth: 600, margin: '0 auto' }}>
        <div style={{
          textAlign: 'center',
          marginBottom: 24,
        }}>
          <Shield size={48} style={{ color: '#4c6ef5', marginBottom: 12 }} />
          <h2 style={{ 
            color: '#e0e0e0', 
            margin: 0, 
            fontSize: 24, 
            fontWeight: 600,
          }}>
            密码安全中心
          </h2>
          <p style={{ color: '#888', margin: '8px 0 0', fontSize: 14 }}>
            检查密码强度并生成安全密码
          </p>
        </div>

        <div style={{
          background: '#252535',
          borderRadius: 16,
          padding: 20,
          marginBottom: 16,
          border: '1px solid rgba(255,255,255,0.05)',
        }}>
          <div style={{
            display: 'flex',
            gap: 8,
            marginBottom: 12,
          }}>
            <div style={{
              flex: 1,
              position: 'relative',
            }}>
              <input
                type={showPassword ? 'text' : 'password'}
                placeholder="输入密码..."
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                style={{
                  width: '100%',
                  padding: '12px 48px 12px 16px',
                  background: '#1e1e2e',
                  border: '1px solid #333',
                  borderRadius: 10,
                  color: '#e0e0e0',
                  fontSize: 16,
                  outline: 'none',
                }}
              />
              <button
                onClick={() => setShowPassword(!showPassword)}
                style={{
                  position: 'absolute',
                  right: 12,
                  top: '50%',
                  transform: 'translateY(-50%)',
                  background: 'none',
                  border: 'none',
                  color: '#888',
                  cursor: 'pointer',
                  padding: 4,
                }}
              >
                {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
              </button>
            </div>
            {password && (
              <button
                onClick={() => copyToClipboard(password)}
                style={{
                  padding: '0 16px',
                  background: '#4c6ef5',
                  border: 'none',
                  borderRadius: 10,
                  color: 'white',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 8,
                  fontSize: 14,
                  fontWeight: 500,
                }}
              >
                <Copy size={18} />
                复制
              </button>
            )}
          </div>

          {password && renderStrengthBar()}

          {strength.suggestions.length > 0 && (
            <div style={{
              marginTop: 16,
              padding: 16,
              background: 'rgba(239, 68, 68, 0.1)',
              borderRadius: 12,
              border: '1px solid rgba(239, 68, 68, 0.2)',
            }}>
              <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: 8,
                marginBottom: 8,
                color: '#ef4444',
                fontWeight: 600,
                fontSize: 14,
              }}>
                <AlertTriangle size={18} />
                改进建议
              </div>
              <ul style={{
                margin: 0,
                paddingLeft: 20,
                color: '#fca5a5',
                fontSize: 13,
                lineHeight: 1.8,
              }}>
                {strength.suggestions.map((suggestion, i) => (
                  <li key={i}>{suggestion}</li>
                ))}
              </ul>
            </div>
          )}
        </div>

        <button
          onClick={() => setShowGenerator(!showGenerator)}
          style={{
            width: '100%',
            padding: 12,
            background: '#333',
            border: 'none',
            borderRadius: 12,
            color: '#e0e0e0',
            cursor: 'pointer',
            fontSize: 14,
            fontWeight: 500,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 8,
            marginBottom: 16,
          }}
        >
          {showGenerator ? '收起' : '展开'} 密码生成器
        </button>

        {showGenerator && (
          <div style={{
            background: '#252535',
            borderRadius: 16,
            padding: 20,
            border: '1px solid rgba(255,255,255,0.05)',
          }}>
            <h3 style={{
              color: '#e0e0e0',
              margin: '0 0 16px',
              fontSize: 18,
              fontWeight: 600,
            }}>
              密码生成器
            </h3>

            <div style={{ marginBottom: 16 }}>
              <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                marginBottom: 8,
              }}>
                <span style={{ color: '#aaa', fontSize: 14 }}>
                  密码长度: {generatorOptions.length}
                </span>
              </div>
              <input
                type="range"
                min="4"
                max="64"
                value={generatorOptions.length}
                onChange={(e) => setGeneratorOptions({
                  ...generatorOptions,
                  length: parseInt(e.target.value),
                })}
                style={{
                  width: '100%',
                  accentColor: '#4c6ef5',
                }}
              />
            </div>

            <div style={{
              display: 'flex',
              flexDirection: 'column',
              gap: 10,
              marginBottom: 16,
            }}>
              {[
                { key: 'includeUppercase', label: '包含大写字母 (A-Z)' },
                { key: 'includeLowercase', label: '包含小写字母 (a-z)' },
                { key: 'includeNumbers', label: '包含数字 (0-9)' },
                { key: 'includeSymbols', label: '包含特殊字符 (!@#$%)' },
                { key: 'excludeSimilar', label: '排除相似字符 (0,O,l,1,I)' },
              ].map(({ key, label }) => (
                <label
                  key={key}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 10,
                    cursor: 'pointer',
                    color: '#e0e0e0',
                    fontSize: 14,
                  }}
                >
                  <input
                    type="checkbox"
                    checked={generatorOptions[key as keyof typeof generatorOptions] as boolean}
                    onChange={(e) => setGeneratorOptions({
                      ...generatorOptions,
                      [key]: e.target.checked,
                    })}
                    style={{
                      width: 18,
                      height: 18,
                      accentColor: '#4c6ef5',
                    }}
                  />
                  {label}
                </label>
              ))}
            </div>

            <div style={{
              display: 'flex',
              gap: 10,
            }}>
              <button
                onClick={generatePassword}
                style={{
                  flex: 1,
                  padding: 14,
                  background: 'linear-gradient(145deg, #4c6ef5, #4263eb)',
                  border: 'none',
                  borderRadius: 12,
                  color: 'white',
                  cursor: 'pointer',
                  fontSize: 15,
                  fontWeight: 600,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: 8,
                }}
              >
                <RefreshCw size={18} />
                生成密码
              </button>
              {generatedPassword && (
                <button
                  onClick={() => copyToClipboard(generatedPassword)}
                  style={{
                    padding: '0 20px',
                    background: '#22c55e',
                    border: 'none',
                    borderRadius: 12,
                    color: 'white',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: 8,
                    fontSize: 14,
                    fontWeight: 600,
                  }}
                >
                  <Copy size={18} />
                </button>
              )}
            </div>

            {generatedPassword && (
              <div style={{
                marginTop: 16,
                padding: 16,
                background: '#1e1e2e',
                borderRadius: 12,
                fontFamily: 'monospace',
                fontSize: 16,
                wordBreak: 'break-all',
                color: '#4ade80',
                border: '1px solid rgba(74, 222, 128, 0.2)',
              }}>
                {generatedPassword}
              </div>
            )}
          </div>
        )}

        <div style={{
          background: 'rgba(76, 110, 245, 0.1)',
          borderRadius: 16,
          padding: 20,
          border: '1px solid rgba(76, 110, 245, 0.2)',
        }}>
          <h4 style={{
            color: '#4c6ef5',
            margin: '0 0 12px',
            fontSize: 16,
            fontWeight: 600,
            display: 'flex',
            alignItems: 'center',
            gap: 8,
          }}>
            <Check size={18} />
            密码安全最佳实践
          </h4>
          <ul style={{
            margin: 0,
            paddingLeft: 20,
            color: '#aaa',
            fontSize: 13,
            lineHeight: 1.8,
          }}>
            <li>使用至少 16 个字符的长密码</li>
            <li>混合使用大小写字母、数字和符号</li>
            <li>避免使用常见的单词或模式</li>
            <li>为每个账户使用不同的密码</li>
            <li>考虑使用密码管理器</li>
            <li>定期更换重要账户的密码</li>
          </ul>
        </div>
      </div>
    </div>
  )
}

export default PasswordChecker
