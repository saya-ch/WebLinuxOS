import { useState, useCallback, useEffect, memo } from 'react'
import { apiService } from '../services/apiService'

const SecurityCenter = memo(function SecurityCenter() {
  const [tab, setTab] = useState<'password-check' | 'password-generator' | 'password-strength' | 'url-shortener' | 'currency'>('password-check')
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState<Record<string, unknown> | null>(null)
  const [input, setInput] = useState('')
  const [copied, setCopied] = useState(false)

  // Password Generator options
  const [genLength, setGenLength] = useState(16)
  const [genOpts, setGenOpts] = useState({ uppercase: true, lowercase: true, numbers: true, symbols: true })
  const [generatedPassword, setGeneratedPassword] = useState('')

  // Currency converter
  const [curAmount, setCurAmount] = useState('100')
  const [curFrom, setCurFrom] = useState('USD')
  const [curTo, setCurTo] = useState('CNY')
  const [curResult, setCurResult] = useState<{ result: number; rate: number; date: string } | null>(null)
  const [curLoading, setCurLoading] = useState(false)

  const currencies = apiService.getSupportedCurrencies()

  const copyToClipboard = useCallback((text: string) => {
    navigator.clipboard.writeText(text).then(() => {
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    })
  }, [])

  // Password Breach Check
  const checkPassword = useCallback(async () => {
    if (!input) return
    setLoading(true)
    setResult(null)
    try {
      const data = await apiService.checkPasswordBreached(input)
      setResult(data)
    } catch (err) {
      setResult({ error: err })
    } finally {
      setLoading(false)
    }
  }, [input])

  // Password Generator
  const generatePassword = useCallback(() => {
    const pwd = apiService.generateStrongPassword(genLength, genOpts)
    setGeneratedPassword(pwd)
  }, [genLength, genOpts])

  useEffect(() => {
    generatePassword()
  }, [generatePassword])

  // URL Shortener
  const shortenUrl = useCallback(async () => {
    if (!input || !input.startsWith('http')) return
    setLoading(true)
    setResult(null)
    try {
      const data = await apiService.shortenUrl(input) as unknown as Record<string, unknown>
      setResult(data)
    } catch (err) {
      setResult({ error: err })
    } finally {
      setLoading(false)
    }
  }, [input])

  // Currency Converter
  const convertCurrency = useCallback(async () => {
    const amount = parseFloat(curAmount)
    if (isNaN(amount) || amount <= 0) return
    setCurLoading(true)
    setCurResult(null)
    try {
      const data = await apiService.convertCurrencyRealTime(amount, curFrom, curTo)
      setCurResult(data)
    } catch {
      setCurResult(null)
    } finally {
      setCurLoading(false)
    }
  }, [curAmount, curFrom, curTo])

  // Password Strength
  const strength = input ? apiService.analyzePasswordStrength(input) : null

  const tabs = [
    { id: 'password-check', label: '密码泄露检查', icon: '🛡️' },
    { id: 'password-generator', label: '密码生成器', icon: '🔐' },
    { id: 'password-strength', label: '密码强度分析', icon: '📊' },
    { id: 'url-shortener', label: 'URL 缩短', icon: '🔗' },
    { id: 'currency', label: '汇率转换', icon: '💱' },
  ] as const

  return (
    <div style={styles.container}>
      <div style={styles.header}>
        <h1 style={styles.title}>安全与实用工具中心</h1>
        <p style={styles.subtitle}>密码安全检测 · 强密码生成 · URL缩短 · 实时汇率</p>
      </div>

      <div style={styles.tabs}>
        {tabs.map(t => (
          <button
            key={t.id}
            onClick={() => { setTab(t.id); setInput(''); setResult(null) }}
            style={{
              ...styles.tab,
              ...(tab === t.id ? styles.tabActive : {}),
            }}
          >
            <span style={styles.tabIcon}>{t.icon}</span>
            <span>{t.label}</span>
          </button>
        ))}
      </div>

      <div style={styles.content}>
        {tab === 'password-check' && (
          <div style={styles.section}>
            <div style={styles.sectionHeader}>
              <h2>密码泄露检查</h2>
              <p style={styles.sectionDesc}>
                基于 HaveIBeenPwned.com API (k-anonymity 协议)，检查您的密码是否在已知数据泄露中被发现。
                我们只发送密码的前5位哈希值，确保隐私安全。
              </p>
            </div>
            <div style={styles.inputGroup}>
              <input
                type="password"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="输入要检查的密码（不会上传完整密码）"
                style={styles.input}
              />
              <button
                onClick={checkPassword}
                disabled={loading || !input}
                style={{ ...styles.primaryBtn, ...(loading || !input ? styles.disabledBtn : {}) }}
              >
                {loading ? '检查中...' : '安全检查'}
              </button>
            </div>
            {result && (
              <div style={styles.result}>
                {result && typeof result === 'object' && 'breached' in result && (result as { breached: boolean; count: number }).breached ? (
                  <div style={{ ...styles.alert, ...styles.alertDanger }}>
                    <strong>⚠️ 警告：此密码已在 {(result as { breached: boolean; count: number }).count.toLocaleString()} 次数据泄露中被发现！</strong>
                    <p>请立即更换此密码，并为重要账户启用两步验证。</p>
                  </div>
                ) : result && typeof result === 'object' && 'breached' in result ? (
                  <div style={{ ...styles.alert, ...styles.alertSuccess }}>
                    <strong>✅ 好消息：此密码未在已知数据泄露中被发现。</strong>
                    <p>请继续保持良好的密码习惯，定期更换密码。</p>
                  </div>
                ) : null}
              </div>
            )}
          </div>
        )}

        {tab === 'password-generator' && (
          <div style={styles.section}>
            <div style={styles.sectionHeader}>
              <h2>强密码生成器</h2>
              <p style={styles.sectionDesc}>
                使用浏览器 crypto API 生成加密安全的随机密码。
              </p>
            </div>
            <div style={styles.genOptions}>
              <div style={styles.optionRow}>
                <label>密码长度：{genLength}</label>
                <input
                  type="range"
                  min="8"
                  max="64"
                  value={genLength}
                  onChange={(e) => setGenLength(parseInt(e.target.value))}
                  style={{ flex: 1 }}
                />
              </div>
              <div style={styles.checkboxRow}>
                {(['uppercase', 'lowercase', 'numbers', 'symbols'] as const).map(key => (
                  <label key={key} style={styles.checkboxLabel}>
                    <input
                      type="checkbox"
                      checked={genOpts[key]}
                      onChange={(e) => setGenOpts(prev => ({ ...prev, [key]: e.target.checked }))}
                    />
                    <span>
                      {key === 'uppercase' && '大写字母 (A-Z)'}
                      {key === 'lowercase' && '小写字母 (a-z)'}
                      {key === 'numbers' && '数字 (0-9)'}
                      {key === 'symbols' && '特殊字符 (!@#$...)'}
                    </span>
                  </label>
                ))}
              </div>
            </div>
            <div style={styles.passwordDisplay}>
              <code style={styles.passwordCode}>{generatedPassword}</code>
              <div style={styles.passwordActions}>
                <button onClick={generatePassword} style={styles.secondaryBtn}>🔄 重新生成</button>
                <button onClick={() => copyToClipboard(generatedPassword)} style={styles.primaryBtn}>
                  {copied ? '✅ 已复制' : '📋 复制'}
                </button>
              </div>
            </div>
            {generatedPassword && (
              <div style={styles.strengthBar}>
                {(() => {
                  const s = apiService.analyzePasswordStrength(generatedPassword)
                  return (
                    <>
                      <div style={{ ...styles.strengthFill, width: `${s.score}%`, background: s.score >= 65 ? '#22c55e' : s.score >= 45 ? '#f59e0b' : '#ef4444' }} />
                      <span style={styles.strengthLabel}>强度：{s.label} (熵值: ~{s.entropy} bits)</span>
                    </>
                  )
                })()}
              </div>
            )}
          </div>
        )}

        {tab === 'password-strength' && (
          <div style={styles.section}>
            <div style={styles.sectionHeader}>
              <h2>密码强度分析</h2>
              <p style={styles.sectionDesc}>
                实时分析密码强度，获得改进建议。所有计算均在本地浏览器完成。
              </p>
            </div>
            <div style={styles.inputGroup}>
              <input
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="输入密码进行强度分析"
                style={styles.input}
              />
            </div>
            {strength && (
              <div style={styles.strengthResult}>
                <div style={styles.strengthMeter}>
                  <div style={{ 
                    ...styles.strengthFill, 
                    width: `${strength.score}%`, 
                    background: strength.score >= 65 ? '#22c55e' : strength.score >= 45 ? '#f59e0b' : '#ef4444' 
                  }} />
                </div>
                <div style={styles.strengthInfo}>
                  <span style={{ fontSize: 18, fontWeight: 'bold' }}>{strength.label}</span>
                  <span style={{ color: '#888' }}>得分: {strength.score}/100</span>
                  <span style={{ color: '#888' }}>估计熵值: ~{strength.entropy} bits</span>
                </div>
                {strength.suggestions.length > 0 && (
                  <div style={styles.suggestions}>
                    <h3>改进建议：</h3>
                    <ul>
                      {strength.suggestions.map((s, i) => (
                        <li key={i}>{s}</li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {tab === 'url-shortener' && (
          <div style={styles.section}>
            <div style={styles.sectionHeader}>
              <h2>URL 缩短服务</h2>
              <p style={styles.sectionDesc}>
                基于 is.gd 免费公开 API，将长链接转换为简短链接。
              </p>
            </div>
            <div style={styles.inputGroup}>
              <input
                type="url"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="输入完整URL (需以 http:// 或 https:// 开头)"
                style={styles.input}
              />
              <button
                onClick={shortenUrl}
                disabled={loading || !input.startsWith('http')}
                style={{ ...styles.primaryBtn, ...(loading || !input.startsWith('http') ? styles.disabledBtn : {}) }}
              >
                {loading ? '缩短中...' : '🔗 缩短链接'}
              </button>
            </div>
            {result && typeof result === 'string' && (
              <div style={styles.shortUrlResult}>
                <p style={{ margin: 0, fontWeight: 'bold' }}>缩短后的链接：</p>
                <a href={result} target="_blank" rel="noopener noreferrer" style={styles.shortUrlLink}>
                  {result}
                </a>
                <button onClick={() => copyToClipboard(result)} style={styles.primaryBtn}>
                  {copied ? '✅ 已复制' : '📋 复制到剪贴板'}
                </button>
              </div>
            )}
          </div>
        )}

        {tab === 'currency' && (
          <div style={styles.section}>
            <div style={styles.sectionHeader}>
              <h2>实时汇率转换</h2>
              <p style={styles.sectionDesc}>
                基于欧洲央行 Frankfurter API，提供实时汇率数据。
              </p>
            </div>
            <div style={styles.currencyGrid}>
              <div style={styles.currencyInput}>
                <label>金额</label>
                <input
                  type="number"
                  value={curAmount}
                  onChange={(e) => setCurAmount(e.target.value)}
                  style={styles.input}
                />
              </div>
              <div style={styles.currencyInput}>
                <label>从</label>
                <select value={curFrom} onChange={(e) => setCurFrom(e.target.value)} style={styles.select}>
                  {currencies.map(c => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>
              <div style={styles.currencyInput}>
                <label>到</label>
                <select value={curTo} onChange={(e) => setCurTo(e.target.value)} style={styles.select}>
                  {currencies.map(c => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>
              <button
                onClick={convertCurrency}
                disabled={curLoading}
                style={{ ...styles.primaryBtn, height: 42 }}
              >
                {curLoading ? '转换中...' : '💱 转换'}
              </button>
            </div>
            {curResult && (
              <div style={styles.currencyResult}>
                <div style={styles.conversionDisplay}>
                  <span style={styles.amount}>{curAmount}</span>
                  <span style={styles.currency}>{curFrom}</span>
                  <span style={styles.equals}>=</span>
                  <span style={styles.amountResult}>{curResult.result.toFixed(2)}</span>
                  <span style={styles.currency}>{curTo}</span>
                </div>
                <div style={styles.rateInfo}>
                  <span>汇率: 1 {curFrom} = {curResult.rate} {curTo}</span>
                  <span>数据日期: {curResult.date}</span>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
})

const styles: Record<string, React.CSSProperties> = {
  container: {
    padding: 24,
    height: '100%',
    overflow: 'auto',
    fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
    background: 'linear-gradient(135deg, #0f0f23 0%, #1a1a3e 100%)',
    color: '#e0e0e0',
  },
  header: {
    textAlign: 'center',
    marginBottom: 24,
  },
  title: {
    fontSize: 24,
    fontWeight: 700,
    margin: '0 0 8px',
    background: 'linear-gradient(135deg, #8b7cf0 0%, #00cec9 100%)',
    WebkitBackgroundClip: 'text',
    WebkitTextFillColor: 'transparent',
  },
  subtitle: {
    fontSize: 13,
    color: '#888',
    margin: 0,
  },
  tabs: {
    display: 'flex',
    gap: 8,
    marginBottom: 24,
    flexWrap: 'wrap',
    justifyContent: 'center',
  },
  tab: {
    padding: '10px 16px',
    borderRadius: 10,
    border: '1px solid rgba(139, 124, 240, 0.3)',
    background: 'rgba(255, 255, 255, 0.05)',
    color: '#aaa',
    cursor: 'pointer',
    fontSize: 13,
    display: 'flex',
    alignItems: 'center',
    gap: 6,
    transition: 'all 0.2s',
  },
  tabActive: {
    background: 'linear-gradient(135deg, #8b7cf0 0%, #6c5ce7 100%)',
    color: 'white',
    borderColor: 'transparent',
    boxShadow: '0 4px 12px rgba(139, 124, 240, 0.3)',
  },
  tabIcon: {
    fontSize: 16,
  },
  content: {
    maxWidth: 700,
    margin: '0 auto',
  },
  section: {
    background: 'rgba(255, 255, 255, 0.05)',
    borderRadius: 16,
    padding: 24,
    border: '1px solid rgba(255, 255, 255, 0.1)',
  },
  sectionHeader: {
    marginBottom: 20,
  },
  sectionDesc: {
    fontSize: 13,
    color: '#999',
    lineHeight: 1.6,
  },
  inputGroup: {
    display: 'flex',
    gap: 10,
    flexWrap: 'wrap',
  },
  input: {
    flex: 1,
    minWidth: 200,
    padding: '12px 16px',
    borderRadius: 10,
    border: '1px solid rgba(255, 255, 255, 0.2)',
    background: 'rgba(0, 0, 0, 0.3)',
    color: '#fff',
    fontSize: 14,
    outline: 'none',
  },
  select: {
    padding: '12px 16px',
    borderRadius: 10,
    border: '1px solid rgba(255, 255, 255, 0.2)',
    background: 'rgba(0, 0, 0, 0.3)',
    color: '#fff',
    fontSize: 14,
    outline: 'none',
    cursor: 'pointer',
  },
  primaryBtn: {
    padding: '12px 20px',
    borderRadius: 10,
    border: 'none',
    background: 'linear-gradient(135deg, #8b7cf0 0%, #6c5ce7 100%)',
    color: 'white',
    fontSize: 14,
    fontWeight: 600,
    cursor: 'pointer',
    transition: 'opacity 0.2s',
  },
  secondaryBtn: {
    padding: '12px 20px',
    borderRadius: 10,
    border: '1px solid rgba(255, 255, 255, 0.2)',
    background: 'rgba(255, 255, 255, 0.1)',
    color: '#fff',
    fontSize: 14,
    cursor: 'pointer',
  },
  disabledBtn: {
    opacity: 0.5,
    cursor: 'not-allowed',
  },
  result: {
    marginTop: 16,
  },
  alert: {
    padding: 16,
    borderRadius: 12,
    border: '1px solid',
  },
  alertDanger: {
    background: 'rgba(239, 68, 68, 0.15)',
    borderColor: 'rgba(239, 68, 68, 0.5)',
    color: '#fca5a5',
  },
  alertSuccess: {
    background: 'rgba(34, 197, 94, 0.15)',
    borderColor: 'rgba(34, 197, 94, 0.5)',
    color: '#86efac',
  },
  genOptions: {
    marginBottom: 20,
  },
  optionRow: {
    display: 'flex',
    alignItems: 'center',
    gap: 12,
    marginBottom: 16,
  },
  checkboxRow: {
    display: 'flex',
    flexDirection: 'column',
    gap: 8,
  },
  checkboxLabel: {
    display: 'flex',
    alignItems: 'center',
    gap: 8,
    cursor: 'pointer',
    fontSize: 13,
  },
  passwordDisplay: {
    background: 'rgba(0, 0, 0, 0.3)',
    borderRadius: 12,
    padding: 20,
    textAlign: 'center',
  },
  passwordCode: {
    fontSize: 20,
    fontWeight: 600,
    letterSpacing: 2,
    color: '#8b7cf0',
    wordBreak: 'break-all',
    display: 'block',
    marginBottom: 16,
  },
  passwordActions: {
    display: 'flex',
    gap: 10,
    justifyContent: 'center',
  },
  strengthBar: {
    marginTop: 16,
    position: 'relative',
    height: 24,
    background: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 12,
    overflow: 'hidden',
  },
  strengthFill: {
    height: '100%',
    borderRadius: 12,
    transition: 'all 0.3s',
  },
  strengthLabel: {
    position: 'absolute',
    top: '50%',
    left: '50%',
    transform: 'translate(-50%, -50%)',
    fontSize: 11,
    color: '#fff',
  },
  strengthResult: {
    marginTop: 20,
  },
  strengthMeter: {
    height: 12,
    background: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 6,
    overflow: 'hidden',
    marginBottom: 12,
  },
  strengthInfo: {
    display: 'flex',
    gap: 20,
    marginBottom: 16,
    flexWrap: 'wrap',
  },
  suggestions: {
    background: 'rgba(255, 255, 255, 0.05)',
    padding: 16,
    borderRadius: 10,
  },
  shortUrlResult: {
    marginTop: 16,
    padding: 16,
    background: 'rgba(0, 0, 0, 0.3)',
    borderRadius: 12,
  },
  shortUrlLink: {
    color: '#8b7cf0',
    fontSize: 16,
    wordBreak: 'break-all',
    display: 'block',
    margin: '10px 0',
  },
  currencyGrid: {
    display: 'grid',
    gridTemplateColumns: '1fr 1fr 1fr auto',
    gap: 12,
    alignItems: 'end',
  },
  currencyInput: {
    display: 'flex',
    flexDirection: 'column',
    gap: 6,
  },
  currencyResult: {
    marginTop: 20,
    padding: 20,
    background: 'rgba(139, 124, 240, 0.1)',
    borderRadius: 12,
    textAlign: 'center',
  },
  conversionDisplay: {
    fontSize: 24,
    fontWeight: 700,
  },
  amount: {
    color: '#fff',
  },
  currency: {
    color: '#8b7cf0',
    margin: '0 4px',
  },
  equals: {
    color: '#888',
    margin: '0 8px',
  },
  amountResult: {
    color: '#22c55e',
  },
  rateInfo: {
    display: 'flex',
    justifyContent: 'space-around',
    marginTop: 12,
    fontSize: 12,
    color: '#888',
  },
}

export default SecurityCenter
