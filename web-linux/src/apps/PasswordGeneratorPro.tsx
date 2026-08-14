import { useState, useMemo, useCallback, useEffect } from 'react'
import {
  Key, Copy, RefreshCw, Eye, EyeOff, Shield, Zap,
  History, FolderOpen, Star, Trash2, Download, Check,
  Sliders, FileText, Lock,
} from 'lucide-react'

type TabType = 'generator' | 'batch' | 'history' | 'strength'

interface PasswordEntry {
  value: string
  strength: number
  entropy: number
  timestamp: number
  category: string
}

interface Category {
  id: string
  name: string
  icon: string
}

const CATEGORIES: Category[] = [
  { id: 'social', name: '社交账号', icon: '💬' },
  { id: 'email', name: '邮箱账号', icon: '📧' },
  { id: 'bank', name: '银行金融', icon: '🏦' },
  { id: 'work', name: '工作账号', icon: '💼' },
  { id: 'gaming', name: '游戏账号', icon: '🎮' },
  { id: 'other', name: '其他用途', icon: '🔐' },
]

const STORAGE_KEY_HISTORY = 'pwdgen_history'
const STORAGE_KEY_PASSWORDS = 'pwdgen_passwords'

const UPPER = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'
const LOWER = 'abcdefghijklmnopqrstuvwxyz'
const NUMBERS = '0123456789'
const SYMBOLS = '!@#$%^&*()_+-=[]{}|;:,.<>?/~'
const SIMILAR = 'Il1O0o'

function secureRandomInt(max: number): number {
  const arr = new Uint32Array(1)
  crypto.getRandomValues(arr)
  return arr[0] % max
}

function pickChar(charset: string): string {
  return charset[secureRandomInt(charset.length)]
}

function shuffle(str: string): string {
  const arr = str.split('')
  for (let i = arr.length - 1; i > 0; i--) {
    const j = secureRandomInt(i + 1)
    ;[arr[i], arr[j]] = [arr[j], arr[i]]
  }
  return arr.join('')
}

function generatePassword(
  length: number,
  useUpper: boolean,
  useLower: boolean,
  useNumbers: boolean,
  useSymbols: boolean,
  excludeChars: string
): string {
  let charset = ''
  if (useUpper) charset += UPPER
  if (useLower) charset += LOWER
  if (useNumbers) charset += NUMBERS
  if (useSymbols) charset += SYMBOLS

  if (excludeChars) {
    const filtered = charset.split('').filter((c) => !excludeChars.includes(c)).join('')
    if (filtered.length === 0) return ''
    charset = filtered
  }

  if (!charset) return ''

  const required: string[] = []
  if (useUpper && !excludeChars) required.push(pickChar(UPPER))
  if (useLower) required.push(pickChar(LOWER))
  if (useNumbers) required.push(pickChar(NUMBERS))
  if (useSymbols && !excludeChars) required.push(pickChar(SYMBOLS))

  const chars: string[] = [...required]
  while (chars.length < length) {
    chars.push(pickChar(charset))
  }

  return shuffle(chars.join('')).substring(0, length)
}

function calculateEntropy(length: number, poolSize: number): number {
  if (poolSize <= 1 || length <= 0) return 0
  return Math.round(length * Math.log2(poolSize) * 10) / 10
}

function estimateCrackTime(entropy: number): string {
  const guessesPerSecond = 1e10
  const combinations = Math.pow(2, entropy)
  const seconds = combinations / guessesPerSecond
  if (seconds < 1) return '瞬时'
  if (seconds < 60) return `${Math.round(seconds)} 秒`
  const minutes = seconds / 60
  if (minutes < 60) return `${Math.round(minutes)} 分钟`
  const hours = minutes / 60
  if (hours < 24) return `${Math.round(hours)} 小时`
  const days = hours / 24
  if (days < 365) return `${Math.round(days)} 天`
  const years = days / 365
  if (years < 1000) return `${Math.round(years)} 年`
  if (years < 1e6) return `${(years / 1000).toFixed(1)} 千年`
  if (years < 1e9) return `${(years / 1e6).toFixed(1)} 百万年`
  if (years < 1e12) return `${(years / 1e9).toFixed(1)} 十亿年`
  return '宇宙年龄级'
}

function evaluatePassword(password: string): { score: number; label: string; color: string; feedback: string[] } {
  if (!password) return { score: 0, label: '无', color: '#52525b', feedback: ['请先生成密码'] }

  let score = 0
  const feedback: string[] = []
  const len = password.length

  if (len >= 8) score++
  if (len >= 12) score++
  if (len >= 16) score++
  if (len >= 20) score++

  const variety = {
    upper: /[A-Z]/.test(password),
    lower: /[a-z]/.test(password),
    number: /[0-9]/.test(password),
    symbol: /[^A-Za-z0-9]/.test(password),
  }
  const varietyCount = Object.values(variety).filter(Boolean).length
  score += varietyCount

  if (varietyCount < 2) feedback.push('建议使用多种字符类型')
  if (len < 8) feedback.push('密码长度过短，建议至少8位')
  if (len >= 16) feedback.push('密码长度优秀')

  const hasSequential = /(.)\1{2,}/.test(password)
  if (hasSequential) { score -= 2; feedback.push('存在重复字符，建议避免') }

  const sequentialPatterns = ['abc', '123', 'qwe', '密码', 'password', 'admin']
  const lower = password.toLowerCase()
  const hasCommon = sequentialPatterns.some((p) => lower.includes(p))
  if (hasCommon) { score -= 2; feedback.push('包含常见模式，建议修改') }

  score = Math.max(0, Math.min(10, score))

  if (score <= 2) return { score, label: '极弱', color: '#ef4444', feedback }
  if (score <= 4) return { score, label: '弱', color: '#f97316', feedback }
  if (score <= 6) return { score, label: '中等', color: '#facc15', feedback }
  if (score <= 8) return { score, label: '强', color: '#4ade80', feedback }
  return { score, label: '极强', color: '#22d3ee', feedback }
}

export default function PasswordGeneratorPro() {
  const [activeTab, setActiveTab] = useState<TabType>('generator')
  const [copiedValue, setCopiedValue] = useState<string | null>(null)
  const [showPassword, setShowPassword] = useState(true)

  const [length, setLength] = useState(16)
  const [useUpper, setUseUpper] = useState(true)
  const [useLower, setUseLower] = useState(true)
  const [useNumbers, setUseNumbers] = useState(true)
  const [useSymbols, setUseSymbols] = useState(true)
  const [excludeSimilar, setExcludeSimilar] = useState(false)
  const [customExclude, setCustomExclude] = useState('')

  const [password, setPassword] = useState('')
  const [category, setCategory] = useState('social')
  const [batchCount, setBatchCount] = useState(10)
  const [batchPasswords, setBatchPasswords] = useState<string[]>([])

  const [history, setHistory] = useState<PasswordEntry[]>(() => {
    try { const s = localStorage.getItem(STORAGE_KEY_HISTORY); return s ? JSON.parse(s) : [] } catch { return [] }
  })
  const [savedPasswords, setSavedPasswords] = useState<PasswordEntry[]>(() => {
    try { const s = localStorage.getItem(STORAGE_KEY_PASSWORDS); return s ? JSON.parse(s) : [] } catch { return [] }
  })

  useEffect(() => {
    try { localStorage.setItem(STORAGE_KEY_HISTORY, JSON.stringify(history.slice(0, 100))) } catch {}
  }, [history])

  useEffect(() => {
    try { localStorage.setItem(STORAGE_KEY_PASSWORDS, JSON.stringify(savedPasswords)) } catch {}
  }, [savedPasswords])

  const charsetSize = useMemo(() => {
    let size = 0
    if (useUpper) size += UPPER.length
    if (useLower) size += LOWER.length
    if (useNumbers) size += NUMBERS.length
    if (useSymbols) size += SYMBOLS.length
    const exclude = (excludeSimilar ? SIMILAR.length : 0) + customExclude.length
    return Math.max(0, size - exclude)
  }, [useUpper, useLower, useNumbers, useSymbols, excludeSimilar, customExclude])

  const entropy = useMemo(() => calculateEntropy(length, charsetSize), [length, charsetSize])
  const strength = useMemo(() => evaluatePassword(password), [password])

  const crackTime = useMemo(() => estimateCrackTime(entropy), [entropy])

  const excludeChars = useMemo(() => {
    return (excludeSimilar ? SIMILAR : '') + customExclude
  }, [excludeSimilar, customExclude])

  const handleGenerate = useCallback(() => {
    const pwd = generatePassword(length, useUpper, useLower, useNumbers, useSymbols, excludeChars)
    if (!pwd) return
    setPassword(pwd)
    const entry: PasswordEntry = {
      value: pwd,
      strength: evaluatePassword(pwd).score,
      entropy: calculateEntropy(length, charsetSize),
      timestamp: Date.now(),
      category,
    }
    setHistory((prev) => [entry, ...prev].slice(0, 100))
  }, [length, useUpper, useLower, useNumbers, useSymbols, excludeChars, charsetSize, category])

  const handleBatchGenerate = useCallback(() => {
    const count = Math.max(1, Math.min(100, batchCount))
    const passwords: string[] = []
    for (let i = 0; i < count; i++) {
      const pwd = generatePassword(length, useUpper, useLower, useNumbers, useSymbols, excludeChars)
      if (pwd) passwords.push(pwd)
    }
    setBatchPasswords(passwords)
  }, [length, useUpper, useLower, useNumbers, useSymbols, excludeChars, batchCount])

  const copyToClipboard = useCallback((text: string, label?: string) => {
    navigator.clipboard.writeText(text).then(() => {
      setCopiedValue(label || text)
      setTimeout(() => setCopiedValue(null), 1500)
    })
  }, [])

  const savePassword = useCallback(() => {
    if (!password) return
    const entry: PasswordEntry = {
      value: password,
      strength: evaluatePassword(password).score,
      entropy: calculateEntropy(length, charsetSize),
      timestamp: Date.now(),
      category,
    }
    setSavedPasswords((prev) => [entry, ...prev])
  }, [password, length, charsetSize, category])

  const clearHistory = useCallback(() => {
    setHistory([])
  }, [])

  const deleteSaved = useCallback((index: number) => {
    setSavedPasswords((prev) => prev.filter((_, i) => i !== index))
  }, [])

  const exportSaved = useCallback(() => {
    const text = savedPasswords
      .map((p) => `${p.category}\t${new Date(p.timestamp).toLocaleString()}\t${p.value}`)
      .join('\n')
    copyToClipboard(text, '已导出')
  }, [savedPasswords, copyToClipboard])

  const generateFromTemplate = useCallback((template: string) => {
    let result = ''
    for (const ch of template) {
      switch (ch) {
        case 'L': result += pickChar(LOWER); break
        case 'U': result += pickChar(UPPER); break
        case 'N': result += pickChar(NUMBERS); break
        case 'S': result += pickChar(SYMBOLS); break
        case 'W': result += pickChar(UPPER + LOWER); break
        case 'A': result += pickChar(UPPER + LOWER + NUMBERS); break
        default: result += ch
      }
    }
    setPassword(result)
  }, [])

  useEffect(() => {
    handleGenerate()
  }, [])

  const tabs: { id: TabType; label: string; icon: React.ReactNode }[] = [
    { id: 'generator', label: '生成器', icon: <Key size={16} /> },
    { id: 'batch', label: '批量生成', icon: <Zap size={16} /> },
    { id: 'history', label: '历史记录', icon: <History size={16} /> },
    { id: 'strength', label: '强度测试', icon: <Shield size={16} /> },
  ]

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', background: 'linear-gradient(135deg, #0f0f1a 0%, #1a1a2e 50%, #16213e 100%)', color: '#e4e4e7', fontFamily: "'Inter','Noto Sans SC',-apple-system,sans-serif", overflow: 'hidden' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '14px 20px', background: 'rgba(255,255,255,0.04)', borderBottom: '1px solid rgba(255,255,255,0.08)', backdropFilter: 'blur(20px)', flexShrink: 0 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <div style={{ width: 36, height: 36, borderRadius: 10, background: 'linear-gradient(135deg, #22d3ee, #818cf8)', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 4px 16px rgba(34,211,238,0.4)' }}>
            <Key size={20} color="#fff" />
          </div>
          <div>
            <div style={{ fontSize: 16, fontWeight: 700 }}>密码生成器 Pro</div>
            <div style={{ fontSize: 11, color: '#71717a' }}>安全 · 快速 · 批量</div>
          </div>
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          <div style={{ padding: '6px 12px', background: 'rgba(34,211,238,0.15)', borderRadius: 8, fontSize: 12, color: '#22d3ee', fontWeight: 600 }}>
            {entropy} bits
          </div>
        </div>
      </div>
      <div style={{ display: 'flex', flexShrink: 0, padding: '0 16px', borderBottom: '1px solid rgba(255,255,255,0.06)', background: 'rgba(0,0,0,0.15)' }}>
        {tabs.map((t) => (
          <button key={t.id} onClick={() => setActiveTab(t.id)} style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '12px 14px', background: 'transparent', border: 'none', borderBottom: activeTab === t.id ? '2px solid #22d3ee' : '2px solid transparent', color: activeTab === t.id ? '#22d3ee' : '#71717a', cursor: 'pointer', fontSize: 13, fontWeight: activeTab === t.id ? 600 : 400, transition: 'all 0.2s' }}>
            {t.icon}<span>{t.label}</span>
          </button>
        ))}
      </div>
      <div style={{ flex: 1, overflow: 'auto', padding: 20 }}>
        {activeTab === 'generator' && (
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
            <GlassCard>
              <SectionHeader icon={<Key size={18} />} title="密码生成" />
              <div style={{ padding: 16, background: 'rgba(0,0,0,0.4)', borderRadius: 12, marginBottom: 16, border: '1px solid rgba(255,255,255,0.08)' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <div style={{ flex: 1, fontFamily: 'monospace', fontSize: 20, fontWeight: 700, color: strength.color, wordBreak: 'break-all', minHeight: 48 }}>
                    {password ? (showPassword ? password : '•'.repeat(password.length)) : '—'}
                  </div>
                  <button onClick={() => setShowPassword(!showPassword)} style={{ background: 'none', border: 'none', color: '#71717a', cursor: 'pointer' }}>
                    {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
                <div style={{ display: 'flex', gap: 8, marginTop: 12 }}>
                  <button onClick={() => copyToClipboard(password, '密码')} style={{ ...actionBtnStyle, background: '#22d3ee', color: '#0a0a0a' }}>
                    <Copy size={14} /> 复制
                  </button>
                  <button onClick={handleGenerate} style={{ ...actionBtnStyle }}>
                    <RefreshCw size={14} /> 重新生成
                  </button>
                  <button onClick={savePassword} style={{ ...actionBtnStyle, background: 'rgba(129,140,248,0.2)', color: '#818cf8' }}>
                    <Star size={14} /> 收藏
                  </button>
                </div>
              </div>

              <StrengthBar score={strength.score} label={strength.label} color={strength.color} />

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 8, marginTop: 12 }}>
                <MetricBox label="熵" value={`${entropy} bits`} color="#22d3ee" />
                <MetricBox label="长度" value={String(length)} color="#818cf8" />
                <MetricBox label="估算破解" value={crackTime} color={strength.color} />
              </div>
            </GlassCard>

            <GlassCard>
              <SectionHeader icon={<Sliders size={18} />} title="生成规则" />
              <div style={{ marginBottom: 16 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
                  <span style={{ fontSize: 13 }}>密码长度</span>
                  <span style={{ fontSize: 13, fontWeight: 600, color: '#22d3ee' }}>{length}</span>
                </div>
                <input type="range" min={4} max={128} value={length} onChange={(e) => setLength(Number(e.target.value))} style={{ width: '100%', accentColor: '#22d3ee' }} />
                <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 4, fontSize: 10, color: '#52525b' }}>
                  <span>4</span><span>16</span><span>32</span><span>64</span><span>128</span>
                </div>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 16 }}>
                <ToggleRow label="大写字母 (A-Z)" checked={useUpper} onChange={setUseUpper} />
                <ToggleRow label="小写字母 (a-z)" checked={useLower} onChange={setUseLower} />
                <ToggleRow label="数字 (0-9)" checked={useNumbers} onChange={setUseNumbers} />
                <ToggleRow label="特殊符号 (!@#$)" checked={useSymbols} onChange={setUseSymbols} />
                <ToggleRow label="排除相似字符 (I, l, 1, O, 0)" checked={excludeSimilar} onChange={setExcludeSimilar} />
              </div>

              <div style={{ marginBottom: 16 }}>
                <label style={{ fontSize: 12, color: '#a1a1aa', display: 'block', marginBottom: 6 }}>自定义排除字符</label>
                <input type="text" value={customExclude} onChange={(e) => setCustomExclude(e.target.value)} placeholder="输入需要排除的字符" style={inputStyle} />
              </div>

              <div style={{ marginBottom: 16 }}>
                <label style={{ fontSize: 12, color: '#a1a1aa', display: 'block', marginBottom: 6 }}>密码分类</label>
                <select value={category} onChange={(e) => setCategory(e.target.value)} style={inputStyle}>
                  {CATEGORIES.map((c) => <option key={c.id} value={c.id}>{c.icon} {c.name}</option>)}
                </select>
              </div>

              <div>
                <label style={{ fontSize: 12, color: '#a1a1aa', display: 'block', marginBottom: 6 }}>密码模板 (L=小写 U=大写 N=数字 S=符号)</label>
                <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                  {['LLLLUNNNN', 'UUll!NN', 'AAllNNss', 'UNUNUN', 'LLLLLLLLN'].map((t) => (
                    <button key={t} onClick={() => generateFromTemplate(t)} style={{ padding: '6px 10px', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 6, color: '#a1a1aa', cursor: 'pointer', fontSize: 11, fontFamily: 'monospace' }}>{t}</button>
                  ))}
                </div>
              </div>
            </GlassCard>
          </div>
        )}
        {activeTab === 'batch' && (
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
            <GlassCard>
              <SectionHeader icon={<Zap size={18} />} title="批量生成" />
              <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                <div>
                  <label style={{ fontSize: 12, color: '#a1a1aa', display: 'block', marginBottom: 6 }}>生成数量（最多100）</label>
                  <input type="number" value={batchCount} onChange={(e) => setBatchCount(Number(e.target.value))} min="1" max="100" style={inputStyle} />
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
                  <MiniStat label="长度" value={String(length)} />
                  <MiniStat label="字符池" value={String(charsetSize)} />
                  <MiniStat label="熵/个" value={`${entropy} bits`} />
                  <MiniStat label="分类" value={CATEGORIES.find((c) => c.id === category)?.name || ''} />
                </div>
                <button onClick={handleBatchGenerate} style={{ padding: '14px', background: 'linear-gradient(135deg, #22d3ee, #818cf8)', border: 'none', borderRadius: 12, color: '#0a0a0a', fontWeight: 700, cursor: 'pointer', fontSize: 14 }}>
                  <Zap size={16} /> 批量生成 {batchCount} 个密码
                </button>
              </div>
            </GlassCard>
            <GlassCard>
              <SectionHeader icon={<FileText size={18} />} title={`生成结果 (${batchPasswords.length})`} />
              <div style={{ maxHeight: 350, overflow: 'auto' }}>
                {batchPasswords.length === 0 ? (
                  <div style={{ textAlign: 'center', color: '#52525b', padding: 40 }}>点击生成按钮创建密码</div>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                    {batchPasswords.map((pwd, i) => (
                      <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '8px 10px', background: 'rgba(0,0,0,0.25)', borderRadius: 6, fontSize: 12 }}>
                        <span style={{ color: '#52525b', width: 28, fontSize: 10 }}>#{i + 1}</span>
                        <span style={{ flex: 1, fontFamily: 'monospace', color: '#e4e4e7', wordBreak: 'break-all' }}>{pwd}</span>
                        <button onClick={() => copyToClipboard(pwd)} style={{ background: 'none', border: 'none', color: '#71717a', cursor: 'pointer', padding: 2 }}><Copy size={12} /></button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
              {batchPasswords.length > 0 && (
                <div style={{ display: 'flex', gap: 8, marginTop: 12 }}>
                  <button onClick={() => copyToClipboard(batchPasswords.join('\n'), '全部密码')} style={{ ...actionBtnStyle, flex: 1 }}><Copy size={14} /> 复制全部</button>
                  <button onClick={() => setBatchPasswords([])} style={{ ...actionBtnStyle, background: 'rgba(239,68,68,0.2)', color: '#f87171' }}><Trash2 size={14} /> 清空</button>
                </div>
              )}
            </GlassCard>
          </div>
        )}
        {activeTab === 'history' && (
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
            <GlassCard>
              <SectionHeader icon={<History size={18} />} title={`历史记录 (${history.length})`} />
              <div style={{ maxHeight: 350, overflow: 'auto' }}>
                {history.length === 0 ? (
                  <div style={{ textAlign: 'center', color: '#52525b', padding: 40 }}>暂无历史记录</div>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                    {history.map((h, i) => (
                      <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 12px', background: 'rgba(0,0,0,0.3)', borderRadius: 8 }}>
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div style={{ fontFamily: 'monospace', fontSize: 13, color: '#e4e4e7', wordBreak: 'break-all' }}>
                            {showPassword ? h.value : '•'.repeat(Math.min(h.value.length, 16))}
                          </div>
                          <div style={{ fontSize: 10, color: '#71717a', marginTop: 2 }}>
                            {CATEGORIES.find((c) => c.id === h.category)?.icon} {CATEGORIES.find((c) => c.id === h.category)?.name} · {new Date(h.timestamp).toLocaleString('zh-CN')}
                          </div>
                        </div>
                        <StrengthDot score={h.strength} />
                        <button onClick={() => { copyToClipboard(h.value); setPassword(h.value) }} style={{ background: 'none', border: 'none', color: '#71717a', cursor: 'pointer' }}><Copy size={14} /></button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
              {history.length > 0 && (
                <button onClick={clearHistory} style={{ ...actionBtnStyle, background: 'rgba(239,68,68,0.2)', color: '#f87171', marginTop: 12 }}><Trash2 size={14} /> 清空历史</button>
              )}
            </GlassCard>
            <GlassCard>
              <SectionHeader icon={<FolderOpen size={18} />} title={`收藏夹 (${savedPasswords.length})`} />
              <div style={{ maxHeight: 350, overflow: 'auto' }}>
                {savedPasswords.length === 0 ? (
                  <div style={{ textAlign: 'center', color: '#52525b', padding: 40 }}>暂无收藏密码</div>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                    {savedPasswords.map((p, i) => (
                      <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 12px', background: 'rgba(0,0,0,0.3)', borderRadius: 8 }}>
                        <Lock size={14} style={{ color: '#22d3ee' }} />
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div style={{ fontFamily: 'monospace', fontSize: 13, color: '#e4e4e7', wordBreak: 'break-all' }}>
                            {showPassword ? p.value : '•'.repeat(Math.min(p.value.length, 16))}
                          </div>
                          <div style={{ fontSize: 10, color: '#71717a', marginTop: 2 }}>
                            {CATEGORIES.find((c) => c.id === p.category)?.icon} {CATEGORIES.find((c) => c.id === p.category)?.name} · {p.entropy} bits
                          </div>
                        </div>
                        <button onClick={() => copyToClipboard(p.value)} style={{ background: 'none', border: 'none', color: '#71717a', cursor: 'pointer' }}><Copy size={14} /></button>
                        <button onClick={() => deleteSaved(i)} style={{ background: 'none', border: 'none', color: '#f87171', cursor: 'pointer' }}><Trash2 size={14} /></button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
              {savedPasswords.length > 0 && (
                <button onClick={exportSaved} style={{ ...actionBtnStyle, marginTop: 12 }}><Download size={14} /> 导出全部</button>
              )}
            </GlassCard>
          </div>
        )}
        {activeTab === 'strength' && (
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
            <GlassCard>
              <SectionHeader icon={<Shield size={18} />} title="密码强度检测" />
              <div style={{ padding: 16, background: 'rgba(0,0,0,0.4)', borderRadius: 12, marginBottom: 16 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <div style={{ flex: 1, fontFamily: 'monospace', fontSize: 16, color: '#e4e4e7', wordBreak: 'break-all', minHeight: 40 }}>
                    {showPassword ? password : '•'.repeat(Math.min(password.length, 20))}
                  </div>
                  <button onClick={() => setShowPassword(!showPassword)} style={{ background: 'none', border: 'none', color: '#71717a', cursor: 'pointer' }}>
                    {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
              </div>

              <StrengthBar score={strength.score} label={strength.label} color={strength.color} />

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 8, marginTop: 12 }}>
                <MetricBox label="强度评分" value={`${strength.score}/10`} color={strength.color} />
                <MetricBox label="熵值" value={`${entropy} bits`} color="#22d3ee" />
                <MetricBox label="长度" value={String(password.length)} color="#818cf8" />
                <MetricBox label="估算破解" value={crackTime} color="#facc15" />
              </div>
            </GlassCard>

            <GlassCard>
              <SectionHeader icon={<FileText size={18} />} title="详细分析" />
              <div style={{ marginBottom: 16 }}>
                <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 10 }}>字符组成</div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                  <CharStat label="大写字母" present={/[A-Z]/.test(password)} count={(password.match(/[A-Z]/g) || []).length} color="#f472b6" />
                  <CharStat label="小写字母" present={/[a-z]/.test(password)} count={(password.match(/[a-z]/g) || []).length} color="#818cf8" />
                  <CharStat label="数字" present={/[0-9]/.test(password)} count={(password.match(/[0-9]/g) || []).length} color="#86efac" />
                  <CharStat label="特殊字符" present={/[^A-Za-z0-9]/.test(password)} count={(password.match(/[^A-Za-z0-9]/g) || []).length} color="#fcd34d" />
                </div>
              </div>

              <div style={{ marginBottom: 16 }}>
                <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 10 }}>改进建议</div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                  {strength.feedback.length === 0 ? (
                    <div style={{ padding: 10, background: 'rgba(16,185,129,0.1)', borderRadius: 8, fontSize: 12, color: '#86efac' }}>
                      ✓ 密码强度优秀！
                    </div>
                  ) : strength.feedback.map((f, i) => (
                    <div key={i} style={{ padding: '10px', background: 'rgba(255,255,255,0.04)', borderRadius: 8, fontSize: 12, color: '#a1a1aa' }}>
                      {f}
                    </div>
                  ))}
                </div>
              </div>

              <div>
                <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 10 }}>安全提示</div>
                <div style={{ padding: 12, background: 'rgba(252,211,77,0.08)', borderRadius: 8, fontSize: 11, color: '#a1a1aa', lineHeight: 1.6 }}>
                  <div>✓ 使用 crypto.getRandomValues() 生成真随机数</div>
                  <div>✓ 密码不会存储在服务器端</div>
                  <div>✓ 建议每个账号使用唯一密码</div>
                  <div>✓ 定期更换重要账号密码</div>
                </div>
              </div>
            </GlassCard>
          </div>
        )}
      </div>
      {copiedValue && (
        <div style={{ position: 'fixed', bottom: 20, left: '50%', transform: 'translateX(-50%)', padding: '10px 20px', background: 'rgba(16,185,129,0.9)', color: '#fff', borderRadius: 10, fontSize: 13, fontWeight: 600, boxShadow: '0 8px 24px rgba(0,0,0,0.3)', zIndex: 10000, display: 'flex', alignItems: 'center', gap: 8 }}>
          <Check size={16} /> 已复制 {copiedValue}
        </div>
      )}
    </div>
  )
}

const inputStyle: React.CSSProperties = {
  width: '100%', padding: '10px 12px', background: 'rgba(0,0,0,0.3)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 8, color: '#fff', fontSize: 14,
}

const actionBtnStyle: React.CSSProperties = {
  padding: '8px 14px', background: 'rgba(255,255,255,0.08)', color: '#e4e4e7', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 8, cursor: 'pointer', fontSize: 12, fontWeight: 600, display: 'flex', alignItems: 'center', gap: 6, transition: 'all 0.15s',
}

function GlassCard({ children }: { children: React.ReactNode }) {
  return <div style={{ padding: 20, background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 16, backdropFilter: 'blur(20px)', WebkitBackdropFilter: 'blur(20px)' }}>{children}</div>
}

function SectionHeader({ icon, title }: { icon: React.ReactNode; title: string }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 18, paddingBottom: 12, borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
      <div style={{ width: 32, height: 32, borderRadius: 8, background: 'linear-gradient(135deg, rgba(34,211,238,0.3), rgba(129,140,248,0.3))', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#22d3ee' }}>{icon}</div>
      <span style={{ fontSize: 15, fontWeight: 600 }}>{title}</span>
    </div>
  )
}

function ToggleRow({ label, checked, onChange }: { label: string; checked: boolean; onChange: (v: boolean) => void }) {
  return (
    <label style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 14px', background: 'rgba(255,255,255,0.04)', borderRadius: 8, cursor: 'pointer', fontSize: 13, transition: 'background 0.15s' }}>
      <span>{label}</span>
      <div onClick={(e) => { e.preventDefault(); onChange(!checked) }} style={{ width: 40, height: 22, background: checked ? '#22d3ee' : 'rgba(255,255,255,0.1)', borderRadius: 11, position: 'relative', transition: 'background 0.2s' }}>
        <div style={{ position: 'absolute', top: 2, left: checked ? 20 : 2, width: 18, height: 18, background: '#fff', borderRadius: '50%', transition: 'left 0.2s' }} />
      </div>
    </label>
  )
}

function StrengthBar({ score, label, color }: { score: number; label: string; color: string }) {
  return (
    <div style={{ marginBottom: 4 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
        <span style={{ fontSize: 12, color: '#a1a1aa' }}>密码强度</span>
        <span style={{ fontSize: 12, fontWeight: 600, color }}>{label}</span>
      </div>
      <div style={{ height: 8, background: 'rgba(255,255,255,0.1)', borderRadius: 4, overflow: 'hidden' }}>
        <div style={{ height: '100%', width: `${(score / 10) * 100}%`, background: color, transition: 'all 0.3s ease', borderRadius: 4 }} />
      </div>
    </div>
  )
}

function StrengthDot({ score }: { score: number }) {
  const color = score <= 3 ? '#ef4444' : score <= 6 ? '#facc15' : score <= 8 ? '#4ade80' : '#22d3ee'
  return <div style={{ width: 8, height: 8, borderRadius: '50%', background: color }} />
}

function MetricBox({ label, value, color }: { label: string; value: string; color: string }) {
  return <div style={{ padding: 10, background: 'rgba(0,0,0,0.3)', borderRadius: 8, textAlign: 'center', border: '1px solid rgba(255,255,255,0.06)' }}>
    <div style={{ fontSize: 10, color: '#71717a', marginBottom: 4 }}>{label}</div>
    <div style={{ fontSize: 14, fontWeight: 700, color }}>{value}</div>
  </div>
}

function MiniStat({ label, value }: { label: string; value: string }) {
  return <div style={{ padding: 10, background: 'rgba(0,0,0,0.3)', borderRadius: 8 }}>
    <div style={{ fontSize: 10, color: '#71717a', marginBottom: 2 }}>{label}</div>
    <div style={{ fontSize: 14, fontWeight: 600 }}>{value}</div>
  </div>
}

function CharStat({ label, present, count, color }: { label: string; present: boolean; count: number; color: string }) {
  return <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '8px 12px', background: 'rgba(0,0,0,0.2)', borderRadius: 8 }}>
    <span style={{ fontSize: 12, color: present ? '#e4e4e7' : '#52525b' }}>{label}</span>
    <span style={{ fontSize: 12, fontWeight: 600, color: present ? color : '#52525b' }}>
      {present ? `${count} 个` : '缺失'}
    </span>
  </div>
}