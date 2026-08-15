import { useState, useCallback } from 'react'
import {
  Dices, KeyRound, Hash, Shuffle, Target, CreditCard,
  Copy, Check, RefreshCw, Sparkles,
} from 'lucide-react'

type TabId = 'password' | 'number' | 'uuid' | 'picker' | 'shuffle' | 'dice' | 'luhn'

interface TabConfig {
  id: TabId
  label: string
  icon: React.ReactNode
}

const TABS: TabConfig[] = [
  { id: 'password', label: '密码生成', icon: <KeyRound size={16} /> },
  { id: 'number', label: '随机数', icon: <Sparkles size={16} /> },
  { id: 'uuid', label: 'UUID', icon: <Hash size={16} /> },
  { id: 'picker', label: '随机选择', icon: <Target size={16} /> },
  { id: 'shuffle', label: '随机排序', icon: <Shuffle size={16} /> },
  { id: 'dice', label: '骰子', icon: <Dices size={16} /> },
  { id: 'luhn', label: 'Luhn验证', icon: <CreditCard size={16} /> },
]

const styles = {
  container: {
    display: 'flex',
    flexDirection: 'column' as const,
    height: '100%',
    backgroundColor: '#f8f9fb',
    color: '#1f2937',
    fontFamily: 'system-ui, -apple-system, "Segoe UI", Roboto, sans-serif',
  },
  header: {
    padding: '16px 20px',
    borderBottom: '1px solid #e5e7eb',
    backgroundColor: '#ffffff',
    display: 'flex',
    alignItems: 'center',
    gap: 10,
  },
  title: { fontSize: '15px', fontWeight: 600, margin: 0 },
  subtitle: { fontSize: '12px', color: '#6b7280', margin: 0 },
  tabBar: {
    display: 'flex',
    gap: 4,
    padding: '10px 16px',
    backgroundColor: '#ffffff',
    borderBottom: '1px solid #e5e7eb',
    overflowX: 'auto' as const,
    flexShrink: 0,
  },
  tab: {
    display: 'flex',
    alignItems: 'center',
    gap: 6,
    padding: '8px 14px',
    borderRadius: 8,
    border: 'none',
    backgroundColor: 'transparent',
    color: '#6b7280',
    fontSize: '13px',
    fontWeight: 500,
    cursor: 'pointer',
    whiteSpace: 'nowrap' as const,
    transition: 'all 0.2s ease',
  },
  tabActive: {
    backgroundColor: '#3b82f6',
    color: '#ffffff',
  },
  body: {
    flex: 1,
    overflowY: 'auto' as const,
    padding: 20,
    display: 'flex',
    flexDirection: 'column' as const,
    gap: 16,
  },
  card: {
    backgroundColor: '#ffffff',
    border: '1px solid #e5e7eb',
    borderRadius: 12,
    padding: 18,
    display: 'flex',
    flexDirection: 'column' as const,
    gap: 14,
    boxShadow: '0 1px 3px rgba(0,0,0,0.04)',
  },
  cardTitle: {
    fontSize: '14px',
    fontWeight: 600,
    color: '#111827',
    margin: 0,
    display: 'flex',
    alignItems: 'center',
    gap: 8,
  },
  row: {
    display: 'flex',
    flexWrap: 'wrap' as const,
    gap: 10,
    alignItems: 'center',
  },
  input: {
    padding: '8px 12px',
    border: '1px solid #d1d5db',
    borderRadius: 8,
    backgroundColor: '#ffffff',
    fontSize: '13px',
    outline: 'none',
    transition: 'border-color 0.2s',
  },
  inputText: {
    width: '100%',
    boxSizing: 'border-box' as const,
    fontFamily: 'ui-monospace, SFMono-Regular, Menlo, monospace',
    padding: '10px 12px',
    border: '1px solid #d1d5db',
    borderRadius: 8,
    fontSize: '13px',
    outline: 'none',
  },
  button: {
    padding: '8px 16px',
    border: 'none',
    backgroundColor: '#3b82f6',
    color: '#ffffff',
    borderRadius: 8,
    fontSize: '13px',
    fontWeight: 500,
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    gap: 6,
    transition: 'background-color 0.2s',
  },
  buttonSecondary: {
    padding: '7px 14px',
    border: '1px solid #d1d5db',
    backgroundColor: '#ffffff',
    color: '#374151',
    borderRadius: 8,
    fontSize: '13px',
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    gap: 6,
    transition: 'all 0.2s',
  },
  checkbox: {
    display: 'flex',
    alignItems: 'center',
    gap: 8,
    padding: '8px 12px',
    border: '1px solid #e5e7eb',
    borderRadius: 8,
    cursor: 'pointer',
    fontSize: '13px',
    backgroundColor: '#f9fafb',
    transition: 'all 0.2s',
  },
  resultBox: {
    backgroundColor: '#f3f4f6',
    borderRadius: 8,
    padding: '12px 14px',
    fontFamily: 'ui-monospace, SFMono-Regular, Menlo, monospace',
    fontSize: '13px',
    color: '#111827',
    wordBreak: 'break-all' as const,
    lineHeight: 1.6,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 10,
  },
  resultText: {
    flex: 1,
    minWidth: 0,
    userSelect: 'all' as const,
  },
  copyBtn: {
    padding: '5px 10px',
    border: '1px solid #d1d5db',
    backgroundColor: '#ffffff',
    color: '#374151',
    borderRadius: 6,
    fontSize: '12px',
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    gap: 4,
    transition: 'all 0.2s',
    flexShrink: 0,
  },
  list: {
    display: 'flex',
    flexDirection: 'column' as const,
    gap: 6,
    maxHeight: 240,
    overflowY: 'auto' as const,
  },
  listItem: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 10,
    padding: '8px 12px',
    backgroundColor: '#f9fafb',
    border: '1px solid #e5e7eb',
    borderRadius: 8,
    fontSize: '13px',
  },
  label: { fontSize: '13px', color: '#374151' },
  hint: { fontSize: '12px', color: '#6b7280' },
  diceBtn: {
    padding: '12px',
    border: '2px solid #e5e7eb',
    backgroundColor: '#ffffff',
    borderRadius: 12,
    cursor: 'pointer',
    fontSize: '18px',
    fontWeight: 700,
    color: '#374151',
    display: 'flex',
    flexDirection: 'column' as const,
    alignItems: 'center',
    gap: 6,
    transition: 'all 0.2s',
  },
  diceResult: {
    fontSize: '32px',
    fontWeight: 700,
    color: '#3b82f6',
    textAlign: 'center' as const,
    padding: '16px',
    backgroundColor: '#f0f7ff',
    borderRadius: 12,
    border: '2px dashed #bfdbfe',
  },
  statusValid: { color: '#059669', fontWeight: 600 },
  statusInvalid: { color: '#dc2626', fontWeight: 600 },
  textarea: {
    width: '100%',
    minHeight: 100,
    padding: '10px 12px',
    border: '1px solid #d1d5db',
    borderRadius: 8,
    fontSize: '13px',
    fontFamily: 'ui-monospace, SFMono-Regular, Menlo, monospace',
    outline: 'none',
    resize: 'vertical' as const,
    boxSizing: 'border-box' as const,
  },
  slider: { width: '100%' },
}

function copyToClipboard(text: string): boolean {
  if (navigator.clipboard && navigator.clipboard.writeText) {
    navigator.clipboard.writeText(text).then(() => {}).catch(() => {})
    return true
  }
  try {
    const ta = document.createElement('textarea')
    ta.value = text
    ta.style.position = 'fixed'
    ta.style.opacity = '0'
    document.body.appendChild(ta)
    ta.select()
    document.execCommand('copy')
    document.body.removeChild(ta)
    return true
  } catch {
    return false
  }
}

function generateUuidV4(): string {
  if (typeof crypto !== 'undefined' && 'randomUUID' in crypto) {
    try {
      return (crypto as Crypto).randomUUID()
    } catch {
      // fall through
    }
  }
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0
    const v = c === 'x' ? r : (r & 0x3) | 0x8
    return v.toString(16)
  })
}

function luhnCheck(num: string): boolean {
  const digits = num.replace(/\D/g, '')
  if (digits.length < 2) return false
  let sum = 0
  let shouldDouble = false
  for (let i = digits.length - 1; i >= 0; i--) {
    let d = parseInt(digits[i], 10)
    if (shouldDouble) {
      d *= 2
      if (d > 9) d -= 9
    }
    sum += d
    shouldDouble = !shouldDouble
  }
  return sum % 10 === 0
}

interface ToastProps {
  message: string
}

const Toast: React.FC<ToastProps> = ({ message }) => (
  <div
    style={{
      position: 'fixed',
      bottom: 24,
      left: '50%',
      transform: 'translateX(-50%)',
      padding: '10px 18px',
      backgroundColor: '#111827',
      color: '#ffffff',
      borderRadius: 8,
      fontSize: 13,
      zIndex: 999,
      boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
      display: 'flex',
      alignItems: 'center',
      gap: 6,
    }}
  >
    <Check size={14} />
    {message}
  </div>
)

const PasswordGenerator: React.FC<{ onCopy: (text: string) => void }> = ({ onCopy }) => {
  const [password, setPassword] = useState('')
  const [length, setLength] = useState(16)
  const [useUpper, setUseUpper] = useState(true)
  const [useLower, setUseLower] = useState(true)
  const [useNumbers, setUseNumbers] = useState(true)
  const [useSymbols, setUseSymbols] = useState(true)
  const [excludeAmbiguous, setExcludeAmbiguous] = useState(false)

  const generate = useCallback(() => {
    const upper = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'
    const lower = 'abcdefghijklmnopqrstuvwxyz'
    const nums = '0123456789'
    const syms = '!@#$%^&*()_+~`|}{[]:;?><,./-='
    const ambiguous = 'Il1O0o'

    let charset = ''
    if (useUpper) charset += upper
    if (useLower) charset += lower
    if (useNumbers) charset += nums
    if (useSymbols) charset += syms

    if (excludeAmbiguous) {
      charset = charset.split('').filter((c) => !ambiguous.includes(c)).join('')
    }

    if (!charset) {
      setPassword('请至少选择一种字符类型')
      return
    }

    const arr = new Uint32Array(length)
    crypto.getRandomValues(arr)
    let result = ''
    for (let i = 0; i < length; i++) {
      result += charset[arr[i] % charset.length]
    }
    setPassword(result)
  }, [length, useUpper, useLower, useNumbers, useSymbols, excludeAmbiguous])

  const strength = (() => {
    let score = 0
    if (length >= 8) score++
    if (length >= 12) score++
    if (length >= 16) score++
    if (useUpper) score++
    if (useLower) score++
    if (useNumbers) score++
    if (useSymbols) score++
    if (excludeAmbiguous) score++
    if (score <= 2) return { label: '弱', color: '#ef4444' }
    if (score <= 4) return { label: '中等', color: '#f59e0b' }
    if (score <= 6) return { label: '强', color: '#10b981' }
    return { label: '非常强', color: '#3b82f6' }
  })()

  return (
    <>
      <div style={styles.card}>
        <h3 style={styles.cardTitle}><KeyRound size={16} /> 随机密码生成器</h3>
        <div style={styles.resultBox}>
          <span style={{ ...styles.resultText, color: password.includes('请') ? '#ef4444' : '#111827' }}>
            {password || '点击下方按钮生成密码'}
          </span>
          {password && !password.includes('请') && (
            <button style={styles.copyBtn} onClick={() => onCopy(password)}>
              <Copy size={12} /> 复制
            </button>
          )}
        </div>
        <div>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
            <span style={styles.label}>密码长度</span>
            <span style={{ ...styles.label, fontWeight: 600, color: '#3b82f6' }}>{length}</span>
          </div>
          <input
            type="range"
            min={4}
            max={64}
            value={length}
            onChange={(e) => setLength(Number(e.target.value))}
            style={styles.slider}
          />
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
          <label
            style={{
              ...styles.checkbox,
              backgroundColor: useUpper ? '#eff6ff' : '#f9fafb',
              borderColor: useUpper ? '#3b82f6' : '#e5e7eb',
            }}
          >
            <input type="checkbox" checked={useUpper} onChange={(e) => setUseUpper(e.target.checked)} />
            大写字母 (A-Z)
          </label>
          <label
            style={{
              ...styles.checkbox,
              backgroundColor: useLower ? '#eff6ff' : '#f9fafb',
              borderColor: useLower ? '#3b82f6' : '#e5e7eb',
            }}
          >
            <input type="checkbox" checked={useLower} onChange={(e) => setUseLower(e.target.checked)} />
            小写字母 (a-z)
          </label>
          <label
            style={{
              ...styles.checkbox,
              backgroundColor: useNumbers ? '#eff6ff' : '#f9fafb',
              borderColor: useNumbers ? '#3b82f6' : '#e5e7eb',
            }}
          >
            <input type="checkbox" checked={useNumbers} onChange={(e) => setUseNumbers(e.target.checked)} />
            数字 (0-9)
          </label>
          <label
            style={{
              ...styles.checkbox,
              backgroundColor: useSymbols ? '#eff6ff' : '#f9fafb',
              borderColor: useSymbols ? '#3b82f6' : '#e5e7eb',
            }}
          >
            <input type="checkbox" checked={useSymbols} onChange={(e) => setUseSymbols(e.target.checked)} />
            特殊符号 (!@#$)
          </label>
          <label
            style={{
              ...styles.checkbox,
              gridColumn: '1fr / -1',
              backgroundColor: excludeAmbiguous ? '#eff6ff' : '#f9fafb',
              borderColor: excludeAmbiguous ? '#3b82f6' : '#e5e7eb',
            }}
          >
            <input type="checkbox" checked={excludeAmbiguous} onChange={(e) => setExcludeAmbiguous(e.target.checked)} />
            排除易混淆字符 (I, l, 1, O, 0, o)
          </label>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <span style={styles.hint}>密码强度:</span>
          <span style={{ color: strength.color, fontWeight: 600, fontSize: 13 }}>{strength.label}</span>
          <div style={{ flex: 1, height: 6, backgroundColor: '#e5e7eb', borderRadius: 3, overflow: 'hidden' }}>
            <div
              style={{
                height: '100%',
                width: `${(strength.label === '弱' ? 25 : strength.label === '中等' ? 50 : strength.label === '强' ? 75 : 100)}%`,
                backgroundColor: strength.color,
                transition: 'all 0.3s ease',
              }}
            />
          </div>
        </div>
        <button style={{ ...styles.button, justifyContent: 'center', padding: '12px 20px' }} onClick={generate}>
          <RefreshCw size={16} /> 生成密码
        </button>
      </div>
    </>
  )
}

const NumberGenerator: React.FC<{ onCopy: (text: string) => void }> = ({ onCopy }) => {
  const [minVal, setMinVal] = useState(1)
  const [maxVal, setMaxVal] = useState(100)
  const [count, setCount] = useState(5)
  const [unique, setUnique] = useState(false)
  const [results, setResults] = useState<number[]>([])

  const generate = useCallback(() => {
    const lo = Math.min(minVal, maxVal)
    const hi = Math.max(minVal, maxVal)
    const range = hi - lo + 1
    const n = Math.max(1, Math.min(100, count))

    if (unique && n > range) {
      setResults([])
      return
    }

    const arr = new Uint32Array(n)
    crypto.getRandomValues(arr)
    const out: number[] = []
    const seen = new Set<number>()

    for (let i = 0; i < n; i++) {
      let v = lo + (arr[i] % range)
      if (unique) {
        let attempts = 0
        while (seen.has(v) && attempts < 1000) {
          v = lo + (Math.random() * range) | 0
          attempts++
        }
        seen.add(v)
      }
      out.push(v)
    }
    setResults(out)
  }, [minVal, maxVal, count, unique])

  return (
    <div style={styles.card}>
      <h3 style={styles.cardTitle}><Sparkles size={16} /> 随机数生成器</h3>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
        <div>
          <label style={styles.label}>最小值</label>
          <input
            type="number"
            value={minVal}
            onChange={(e) => setMinVal(Number(e.target.value) || 0)}
            style={{ ...styles.input, width: '100%', boxSizing: 'border-box' }}
          />
        </div>
        <div>
          <label style={styles.label}>最大值</label>
          <input
            type="number"
            value={maxVal}
            onChange={(e) => setMaxVal(Number(e.target.value) || 0)}
            style={{ ...styles.input, width: '100%', boxSizing: 'border-box' }}
          />
        </div>
      </div>
      <div style={styles.row}>
        <label style={styles.label}>数量:</label>
        <input
          type="number"
          min={1}
          max={100}
          value={count}
          onChange={(e) => setCount(Math.max(1, Math.min(100, Number(e.target.value) || 1)))}
          style={{ ...styles.input, width: 80 }}
        />
        <label style={{ ...styles.checkbox }}>
          <input type="checkbox" checked={unique} onChange={(e) => setUnique(e.target.checked)} />
          不重复
        </label>
      </div>
      <button style={styles.button} onClick={generate}>
        <RefreshCw size={14} /> 生成随机数
      </button>
      {results.length > 0 && (
        <>
          <div style={styles.resultBox}>
            <span style={styles.resultText}>{results.join(', ')}</span>
            <button style={styles.copyBtn} onClick={() => onCopy(results.join(', '))}>
              <Copy size={12} /> 复制
            </button>
          </div>
          <div style={styles.hint}>
            统计: 共 {results.length} 个，和={results.reduce((a, b) => a + b, 0)}，
            平均={(results.reduce((a, b) => a + b, 0) / results.length).toFixed(2)}，
            最小={Math.min(...results)}，最大={Math.max(...results)}
          </div>
        </>
      )}
    </div>
  )
}

const UuidGenerator: React.FC<{ onCopy: (text: string) => void }> = ({ onCopy }) => {
  const [count, setCount] = useState(5)
  const [uuids, setUuids] = useState<string[]>([])

  const generate = useCallback(() => {
    const n = Math.max(1, Math.min(50, count))
    const items: string[] = []
    for (let i = 0; i < n; i++) {
      items.push(generateUuidV4())
    }
    setUuids((prev) => [...items, ...prev].slice(0, 100))
  }, [count])

  return (
    <div style={styles.card}>
      <h3 style={styles.cardTitle}><Hash size={16} /> UUID v4 生成器</h3>
      <div style={styles.row}>
        <label style={styles.label}>数量:</label>
        <input
          type="number"
          min={1}
          max={50}
          value={count}
          onChange={(e) => setCount(Math.max(1, Math.min(50, Number(e.target.value) || 1)))}
          style={{ ...styles.input, width: 80 }}
        />
        <button style={styles.button} onClick={generate}>
          <RefreshCw size={14} /> 生成
        </button>
        <button
          style={styles.buttonSecondary}
          onClick={() => {
            if (uuids.length > 0) onCopy(uuids.join('\n'))
          }}
        >
          <Copy size={14} /> 复制全部
        </button>
        <button style={styles.buttonSecondary} onClick={() => setUuids([])}>
          清空
        </button>
      </div>
      {uuids.length === 0 ? (
        <div style={{ ...styles.hint, textAlign: 'center', padding: 20 }}>暂无记录，点击"生成"开始</div>
      ) : (
        <div style={styles.list}>
          {uuids.map((id, idx) => (
            <div key={`${id}-${idx}`} style={styles.listItem}>
              <span style={{ fontFamily: 'ui-monospace, monospace', fontSize: 13 }}>{id}</span>
              <button style={styles.copyBtn} onClick={() => onCopy(id)}>
                <Copy size={12} />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

const RandomPicker: React.FC<{ onCopy: (text: string) => void }> = ({ onCopy }) => {
  const [input, setInput] = useState('苹果\n香蕉\n橙子\n葡萄\n西瓜')
  const [result, setResult] = useState('')
  const [picks, setPicks] = useState<string[]>([])

  const pickOne = useCallback(() => {
    const items = input.split('\n').map((s) => s.trim()).filter(Boolean)
    if (items.length === 0) {
      setResult('请先输入候选项')
      return
    }
    const arr = new Uint32Array(1)
    crypto.getRandomValues(arr)
    const chosen = items[arr[0] % items.length]
    setResult(chosen)
    setPicks((prev) => [chosen, ...prev].slice(0, 20))
  }, [input])

  return (
    <div style={styles.card}>
      <h3 style={styles.cardTitle}><Target size={16} /> 随机选择器</h3>
      <textarea
        value={input}
        onChange={(e) => setInput(e.target.value)}
        placeholder="每行输入一个候选项..."
        style={styles.textarea}
      />
      <button style={styles.button} onClick={pickOne}>
        <Dices size={14} /> 随机选一个
      </button>
      {result && (
        <div style={{ ...styles.resultBox, backgroundColor: '#f0fdf4', border: '1px solid #bbf7d0' }}>
          <span style={{ ...styles.resultText, color: '#15803d', fontSize: 15, fontWeight: 600 }}>
            🎯 {result}
          </span>
          {result !== '请先输入候选项' && (
            <button style={styles.copyBtn} onClick={() => onCopy(result)}>
              <Copy size={12} /> 复制
            </button>
          )}
        </div>
      )}
      {picks.length > 0 && (
        <div>
          <div style={{ ...styles.label, marginBottom: 6 }}>历史选择:</div>
          <div style={styles.list}>
            {picks.map((p, i) => (
              <div key={i} style={styles.listItem}>
                <span>{p}</span>
                <button style={styles.copyBtn} onClick={() => onCopy(p)}>
                  <Copy size={12} />
                </button>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

const ShuffleTool: React.FC<{ onCopy: (text: string) => void }> = ({ onCopy }) => {
  const [input, setInput] = useState('1\n2\n3\n4\n5\n6\n7\n8\n9\n10')
  const [shuffled, setShuffled] = useState<string[]>([])

  const shuffle = useCallback(() => {
    const items = input.split('\n').map((s) => s.trim()).filter(Boolean)
    const arr = [...items]
    for (let i = arr.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1))
      ;[arr[i], arr[j]] = [arr[j], arr[i]]
    }
    setShuffled(arr)
  }, [input])

  return (
    <div style={styles.card}>
      <h3 style={styles.cardTitle}><Shuffle size={16} /> 随机排序工具</h3>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
        <div>
          <div style={{ ...styles.label, marginBottom: 6 }}>原始列表 (每行一项)</div>
          <textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            style={{ ...styles.textarea, minHeight: 150 }}
          />
        </div>
        <div>
          <div style={{ ...styles.label, marginBottom: 6 }}>打乱结果</div>
          <div
            style={{
              ...styles.textarea,
              minHeight: 150,
              backgroundColor: '#f9fafb',
              cursor: 'default',
            }}
          >
            {shuffled.length > 0 ? shuffled.join('\n') : '点击"随机排序"按钮'}
          </div>
        </div>
      </div>
      <div style={styles.row}>
        <button style={styles.button} onClick={shuffle}>
          <Shuffle size={14} /> 随机排序
        </button>
        {shuffled.length > 0 && (
          <button style={styles.buttonSecondary} onClick={() => onCopy(shuffled.join('\n'))}>
            <Copy size={14} /> 复制结果
          </button>
        )}
        {shuffled.length > 0 && (
          <button style={styles.buttonSecondary} onClick={() => onCopy(shuffled.join(', '))}>
            <Copy size={14} /> 复制为逗号分隔
          </button>
        )}
      </div>
    </div>
  )
}

const DiceRoller: React.FC<{ onCopy: (text: string) => void }> = ({ onCopy }) => {
  const [sides, setSides] = useState(6)
  const [rolls, setRolls] = useState(1)
  const [results, setResults] = useState<number[]>([])
  const [history, setHistory] = useState<{ total: number; rolls: number[] }[]>([])

  const doRoll = useCallback(() => {
    const n = Math.max(1, Math.min(20, rolls))
    const s = Math.max(2, sides)
    const arr = new Uint32Array(n)
    crypto.getRandomValues(arr)
    const out: number[] = []
    for (let i = 0; i < n; i++) {
      out.push(1 + (arr[i] % s))
    }
    setResults(out)
    setHistory((prev) => [{ total: out.reduce((a, b) => a + b, 0), rolls: out }, ...prev].slice(0, 20))
  }, [sides, rolls])

  const presets = [4, 6, 8, 10, 12, 20]

  return (
    <div style={styles.card}>
      <h3 style={styles.cardTitle}><Dices size={16} /> 骰子模拟器</h3>
      <div>
        <div style={{ ...styles.label, marginBottom: 8 }}>选择骰子面数</div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(6, 1fr)', gap: 8 }}>
          {presets.map((p) => (
            <button
              key={p}
              onClick={() => setSides(p)}
              style={{
                ...styles.diceBtn,
                backgroundColor: sides === p ? '#3b82f6' : '#ffffff',
                borderColor: sides === p ? '#3b82f6' : '#e5e7eb',
                color: sides === p ? '#ffffff' : '#374151',
              }}
            >
              d{p}
            </button>
          ))}
        </div>
      </div>
      <div style={styles.row}>
        <label style={styles.label}>面数:</label>
        <input
          type="number"
          min={2}
          max={100}
          value={sides}
          onChange={(e) => setSides(Math.max(2, Math.min(100, Number(e.target.value) || 2)))}
          style={{ ...styles.input, width: 80 }}
        />
        <label style={styles.label}>骰子数:</label>
        <input
          type="number"
          min={1}
          max={20}
          value={rolls}
          onChange={(e) => setRolls(Math.max(1, Math.min(20, Number(e.target.value) || 1)))}
          style={{ ...styles.input, width: 80 }}
        />
        <button style={styles.button} onClick={doRoll}>
          <Dices size={14} /> 投掷
        </button>
      </div>
      {results.length > 0 && (
        <>
          <div style={styles.diceResult}>
            {results.length === 1 ? (
              results[0]
            ) : (
              <>
                <div style={{ fontSize: 16, color: '#6b7280', marginBottom: 6 }}>
                  [{results.join(', ')}]
                </div>
                <div style={{ fontSize: 24 }}>
                  总计: {results.reduce((a, b) => a + b, 0)}
                </div>
              </>
            )}
          </div>
          <button
            style={{ ...styles.buttonSecondary, justifyContent: 'center' }}
            onClick={() => onCopy(results.join(', '))}
          >
            <Copy size={14} /> 复制结果
          </button>
        </>
      )}
      {history.length > 0 && (
        <div>
          <div style={{ ...styles.label, marginBottom: 6 }}>投掷历史:</div>
          <div style={styles.list}>
            {history.map((h, i) => (
              <div key={i} style={styles.listItem}>
                <span>
                  [{h.rolls.join(', ')}] = <strong>{h.total}</strong>
                </span>
                <span style={styles.hint}>d{sides} × {h.rolls.length}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

const LuhnValidator: React.FC<{ onCopy: (text: string) => void }> = ({ onCopy }) => {
  const [input, setInput] = useState('')
  const [result, setResult] = useState<{ valid: boolean; number: string } | null>(null)

  const validate = useCallback(() => {
    const digits = input.replace(/\D/g, '')
    if (digits.length < 2) {
      setResult({ valid: false, number: digits })
      return
    }
    const valid = luhnCheck(digits)
    setResult({ valid, number: digits })
  }, [input])

  const formatCardNumber = (digits: string): string => {
    return digits.replace(/(.{4})/g, '$1 ').trim()
  }

  return (
    <div style={styles.card}>
      <h3 style={styles.cardTitle}><CreditCard size={16} /> Luhn 算法验证器</h3>
      <div style={styles.hint}>- 验证信用卡号、身份证号等校验位</div>
      <input
        type="text"
        value={input}
        onChange={(e) => setInput(e.target.value)}
        placeholder="输入数字（空格和连字符会被自动忽略）..."
        style={{ ...styles.inputText }}
      />
      <div style={styles.row}>
        <button style={styles.button} onClick={validate}>
          <CreditCard size={14} /> 验证
        </button>
        <button
          style={styles.buttonSecondary}
          onClick={() => {
            const formatted = formatCardNumber(input.replace(/\D/g, ''))
            if (formatted) onCopy(formatted)
          }}
        >
          <Copy size={14} /> 格式化复制
        </button>
      </div>
      {result && (
        <div
          style={{
            padding: '12px 14px',
            borderRadius: 8,
            backgroundColor: result.valid ? '#f0fdf4' : '#fef2f2',
            border: `1px solid ${result.valid ? '#bbf7d0' : '#fecaca'}`,
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
            {result.valid ? (
              <Check size={18} style={{ color: '#059669' }} />
            ) : (
              <CreditCard size={18} style={{ color: '#dc2626' }} />
            )}
            <span style={result.valid ? styles.statusValid : styles.statusInvalid}>
              {result.valid ? '✓ 有效号码' : '✗ 无效号码'}
            </span>
          </div>
          <div style={styles.hint}>
            数字: <span style={{ fontFamily: 'monospace' }}>{result.number}</span>
          </div>
          <div style={styles.hint}>
            格式化: <span style={{ fontFamily: 'monospace' }}>{formatCardNumber(result.number)}</span>
          </div>
          <div style={styles.hint}>
            长度: {result.number.length} 位
          </div>
        </div>
      )}
    </div>
  )
}

export default function RandomTools() {
  const [activeTab, setActiveTab] = useState<TabId>('password')
  const [toast, setToast] = useState('')

  const handleCopy = useCallback((text: string) => {
    copyToClipboard(text)
    setToast('已复制到剪贴板')
    window.setTimeout(() => setToast(''), 1600)
  }, [])

  return (
    <div style={styles.container}>
      <div style={styles.header}>
        <Dices size={20} color="#3b82f6" />
        <div>
          <h2 style={styles.title}>随机工具集</h2>
          <p style={styles.subtitle}>密码生成 · 随机数 · UUID · 选择 · 排序 · 骰子 · Luhn验证</p>
        </div>
      </div>

      <div style={styles.tabBar}>
        {TABS.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            style={{
              ...styles.tab,
              ...(activeTab === tab.id ? styles.tabActive : {}),
            }}
            onMouseEnter={(e) => {
              if (activeTab !== tab.id) {
                e.currentTarget.style.backgroundColor = '#f3f4f6'
              }
            }}
            onMouseLeave={(e) => {
              if (activeTab !== tab.id) {
                e.currentTarget.style.backgroundColor = 'transparent'
              }
            }}
          >
            {tab.icon}
            {tab.label}
          </button>
        ))}
      </div>

      <div style={styles.body}>
        {activeTab === 'password' && <PasswordGenerator onCopy={handleCopy} />}
        {activeTab === 'number' && <NumberGenerator onCopy={handleCopy} />}
        {activeTab === 'uuid' && <UuidGenerator onCopy={handleCopy} />}
        {activeTab === 'picker' && <RandomPicker onCopy={handleCopy} />}
        {activeTab === 'shuffle' && <ShuffleTool onCopy={handleCopy} />}
        {activeTab === 'dice' && <DiceRoller onCopy={handleCopy} />}
        {activeTab === 'luhn' && <LuhnValidator onCopy={handleCopy} />}
      </div>

      {toast && <Toast message={toast} />}
    </div>
  )
}