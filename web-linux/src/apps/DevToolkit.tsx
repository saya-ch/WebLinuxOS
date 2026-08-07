import { useState, memo, useCallback } from 'react'
import { useStore } from '../store'
import {
  Hash,
  Copy,
  Check,
  RefreshCw,
  KeyRound,
  Lock,
  Shield,
  Zap,
} from 'lucide-react'

type TabType = 'uuid' | 'base64' | 'hash' | 'password' | 'jwt'

const DevToolkit = memo(function DevToolkit() {
  const [activeTab, setActiveTab] = useState<TabType>('uuid')
  const [copiedId, setCopiedId] = useState<string | null>(null)
  const addNotification = useStore((s) => s.addNotification)

  const copyToClipboard = useCallback((text: string, id: string) => {
    navigator.clipboard.writeText(text)
    setCopiedId(id)
    setTimeout(() => setCopiedId(null), 2000)
  }, [])

  const showNotification = useCallback((title: string, message: string, type: 'success' | 'error' | 'info' = 'success') => {
    addNotification({ title, message, type, duration: 2000 })
  }, [addNotification])

  const tabs: { id: TabType; label: string; icon: React.ReactNode }[] = [
    { id: 'uuid', label: 'UUID', icon: <KeyRound size={16} /> },
    { id: 'base64', label: 'Base64', icon: <Hash size={16} /> },
    { id: 'hash', label: '哈希', icon: <Shield size={16} /> },
    { id: 'password', label: '密码', icon: <Lock size={16} /> },
    { id: 'jwt', label: 'JWT', icon: <Zap size={16} /> },
  ]

  return (
    <div style={{
      height: '100%', overflow: 'hidden',
      background: 'linear-gradient(180deg, var(--window-bg) 0%, var(--desktop-bg) 100%)',
      display: 'flex', flexDirection: 'column',
    }}>
      <style>{`
        @keyframes fadeSlideUp {
          from { opacity: 0; transform: translateY(12px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.5; }
        }
      `}</style>

      {/* 头部 */}
      <div style={{ padding: '16px 20px', borderBottom: '1px solid var(--glass-border)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={{
            width: 36, height: 36, borderRadius: 10,
            background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            <Hash size={18} color="white" />
          </div>
          <div>
            <div style={{ fontSize: 16, fontWeight: 600 }}>开发者工具箱</div>
            <div style={{ fontSize: 11, color: 'var(--text-secondary)' }}>Web开发者的瑞士军刀</div>
          </div>
        </div>
      </div>

      {/* 标签页 */}
      <div style={{
        display: 'flex', gap: 4, padding: '12px 16px',
        borderBottom: '1px solid var(--glass-border)',
        background: 'var(--glass-bg)',
      }}>
        {tabs.map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            style={{
              flex: 1,
              padding: '8px 12px',
              borderRadius: 8,
              background: activeTab === tab.id ? 'var(--accent-bg)' : 'transparent',
              border: activeTab === tab.id ? '1px solid var(--accent)' : '1px solid transparent',
              color: activeTab === tab.id ? 'var(--accent)' : 'var(--text-secondary)',
              cursor: 'pointer',
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
              fontSize: 13, fontWeight: activeTab === tab.id ? 600 : 400,
              transition: 'all 0.2s ease',
            }}
          >
            {tab.icon}
            {tab.label}
          </button>
        ))}
      </div>

      {/* 内容区域 */}
      <div style={{ flex: 1, padding: 20, overflow: 'auto' }}>
        {activeTab === 'uuid' && <UUIDGenerator onCopy={copyToClipboard} copiedId={copiedId} />}
        {activeTab === 'base64' && <Base64Tool onCopy={copyToClipboard} copiedId={copiedId} onNotify={showNotification} />}
        {activeTab === 'hash' && <HashTool onCopy={copyToClipboard} copiedId={copiedId} />}
        {activeTab === 'password' && <PasswordGenerator onCopy={copyToClipboard} copiedId={copiedId} />}
        {activeTab === 'jwt' && <JWTDecoder onNotify={showNotification} />}
      </div>
    </div>
  )
})

// UUID 生成器
function UUIDGenerator({ onCopy, copiedId }: { onCopy: (text: string, id: string) => void; copiedId: string | null }) {
  const [uuids, setUuids] = useState<string[]>([])
  const [count, setCount] = useState(5)
  const [format, setFormat] = useState<'standard' | 'compact' | 'timestamp'>('standard')

  const generateUUIDs = useCallback(() => {
    const newUuids: string[] = []
    for (let i = 0; i < count; i++) {
      if (format === 'timestamp') {
        newUuids.push(`${Date.now()}-${Math.random().toString(36).substring(2, 9)}`)
      } else {
        const uuid = crypto.randomUUID?.() || 
          'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
            const r = (Math.random() * 16) | 0
            const v = c === 'x' ? r : (r & 0x3) | 0x8
            return v.toString(16)
          })
        newUuids.push(format === 'compact' ? uuid.replace(/-/g, '') : uuid)
      }
    }
    setUuids(newUuids)
  }, [count, format])

  return (
    <div style={{ animation: 'fadeSlideUp 0.3s ease-out' }}>
      <div style={{ marginBottom: 20 }}>
        <h3 style={{ margin: '0 0 8px', fontSize: 16, fontWeight: 600 }}>UUID 生成器</h3>
        <p style={{ margin: 0, fontSize: 13, color: 'var(--text-secondary)' }}>
          生成符合 RFC 4122 标准的唯一标识符
        </p>
      </div>

      <div style={{ display: 'flex', gap: 12, marginBottom: 20, flexWrap: 'wrap' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <label style={{ fontSize: 13, color: 'var(--text-secondary)' }}>数量:</label>
          <input
            type="number"
            min={1}
            max={50}
            value={count}
            onChange={(e) => setCount(Math.min(50, Math.max(1, parseInt(e.target.value) || 1)))}
            style={{
              width: 60, padding: '6px 10px', borderRadius: 8,
              background: 'var(--glass-bg)', border: '1px solid var(--glass-border)',
              color: 'var(--text-primary)', textAlign: 'center',
            }}
          />
        </div>
        <div style={{ display: 'flex', gap: 4 }}>
          {(['standard', 'compact', 'timestamp'] as const).map(f => (
            <button
              key={f}
              onClick={() => setFormat(f)}
              style={{
                padding: '6px 12px', borderRadius: 8,
                background: format === f ? 'var(--accent-bg)' : 'var(--glass-bg)',
                border: format === f ? '1px solid var(--accent)' : '1px solid var(--glass-border)',
                color: format === f ? 'var(--accent)' : 'var(--text-secondary)',
                cursor: 'pointer', fontSize: 12,
              }}
            >
              {f === 'standard' ? '标准' : f === 'compact' ? '紧凑' : '时间戳'}
            </button>
          ))}
        </div>
      </div>

      <button
        onClick={generateUUIDs}
        style={{
          width: '100%', padding: '12px', borderRadius: 10,
          background: 'linear-gradient(135deg, var(--accent) 0%, #a29bfe 100%)',
          color: 'white', border: 'none', cursor: 'pointer',
          fontSize: 14, fontWeight: 600,
          display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
          marginBottom: 20,
        }}
      >
        <RefreshCw size={16} />
        生成 UUID
      </button>

      {uuids.length > 0 && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {uuids.map((uuid, i) => (
            <div
              key={i}
              style={{
                padding: '12px 14px',
                borderRadius: 10,
                background: 'var(--glass-bg)',
                border: '1px solid var(--glass-border)',
                display: 'flex',
                alignItems: 'center',
                gap: 12,
              }}
            >
              <code style={{ flex: 1, fontSize: 13, color: 'var(--text-primary)', fontFamily: 'monospace' }}>
                {uuid}
              </code>
              <button
                onClick={() => onCopy(uuid, `uuid-${i}`)}
                style={{
                  padding: '6px 10px', borderRadius: 6,
                  background: copiedId === `uuid-${i}` ? 'rgba(16, 185, 129, 0.15)' : 'transparent',
                  border: '1px solid var(--glass-border)',
                  color: copiedId === `uuid-${i}` ? '#10b981' : 'var(--text-secondary)',
                  cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 4,
                  fontSize: 12,
                }}
              >
                {copiedId === `uuid-${i}` ? <Check size={14} /> : <Copy size={14} />}
                {copiedId === `uuid-${i}` ? '已复制' : '复制'}
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

// Base64 工具
function Base64Tool({ onCopy, copiedId, onNotify }: { 
  onCopy: (text: string, id: string) => void
  copiedId: string | null
  onNotify: (title: string, message: string, type?: 'success' | 'error' | 'info') => void
}) {
  const [input, setInput] = useState('')
  const [output, setOutput] = useState('')
  const [mode, setMode] = useState<'encode' | 'decode'>('encode')

  const process = useCallback(() => {
    try {
      if (mode === 'encode') {
        setOutput(btoa(unescape(encodeURIComponent(input))))
      } else {
        setOutput(decodeURIComponent(escape(atob(input))))
      }
    } catch {
      onNotify('错误', mode === 'encode' ? '编码失败' : '解码失败', 'error')
    }
  }, [input, mode, onNotify])

  return (
    <div style={{ animation: 'fadeSlideUp 0.3s ease-out' }}>
      <div style={{ marginBottom: 20 }}>
        <h3 style={{ margin: '0 0 8px', fontSize: 16, fontWeight: 600 }}>Base64 编解码</h3>
        <p style={{ margin: 0, fontSize: 13, color: 'var(--text-secondary)' }}>
          在浏览器本地进行 Base64 编码和解码
        </p>
      </div>

      <div style={{ display: 'flex', gap: 4, marginBottom: 12 }}>
        <button
          onClick={() => { setMode('encode'); setOutput('') }}
          style={{
            flex: 1, padding: '8px 12px', borderRadius: 8,
            background: mode === 'encode' ? 'var(--accent-bg)' : 'var(--glass-bg)',
            border: mode === 'encode' ? '1px solid var(--accent)' : '1px solid var(--glass-border)',
            color: mode === 'encode' ? 'var(--accent)' : 'var(--text-secondary)',
            cursor: 'pointer', fontSize: 13,
          }}
        >
          编码
        </button>
        <button
          onClick={() => { setMode('decode'); setOutput('') }}
          style={{
            flex: 1, padding: '8px 12px', borderRadius: 8,
            background: mode === 'decode' ? 'var(--accent-bg)' : 'var(--glass-bg)',
            border: mode === 'decode' ? '1px solid var(--accent)' : '1px solid var(--glass-border)',
            color: mode === 'decode' ? 'var(--accent)' : 'var(--text-secondary)',
            cursor: 'pointer', fontSize: 13,
          }}
        >
          解码
        </button>
      </div>

      <div style={{ marginBottom: 12 }}>
        <label style={{ fontSize: 12, color: 'var(--text-secondary)', display: 'block', marginBottom: 6 }}>
          {mode === 'encode' ? '原始文本' : 'Base64 字符串'}
        </label>
        <textarea
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder={mode === 'encode' ? '输入要编码的文本...' : '输入要解码的 Base64 字符串...'}
          style={{
            width: '100%', minHeight: 100, padding: 12, borderRadius: 10,
            background: 'var(--glass-bg)', border: '1px solid var(--glass-border)',
            color: 'var(--text-primary)', fontFamily: 'monospace', fontSize: 13,
            resize: 'vertical',
          }}
        />
      </div>

      <button
        onClick={process}
        disabled={!input}
        style={{
          width: '100%', padding: '12px', borderRadius: 10,
          background: !input ? 'var(--glass-bg)' : 'linear-gradient(135deg, var(--accent) 0%, #a29bfe 100%)',
          color: !input ? 'var(--text-secondary)' : 'white',
          border: 'none', cursor: !input ? 'not-allowed' : 'pointer',
          fontSize: 14, fontWeight: 600, marginBottom: 12,
        }}
      >
        {mode === 'encode' ? '编码' : '解码'}
      </button>

      {output && (
        <div style={{ position: 'relative' }}>
          <label style={{ fontSize: 12, color: 'var(--text-secondary)', display: 'block', marginBottom: 6 }}>
            结果
          </label>
          <textarea
            value={output}
            readOnly
            style={{
              width: '100%', minHeight: 80, padding: 12, borderRadius: 10,
              background: 'var(--glass-bg)', border: '1px solid var(--glass-border)',
              color: 'var(--text-primary)', fontFamily: 'monospace', fontSize: 13,
              resize: 'vertical',
            }}
          />
          <button
            onClick={() => onCopy(output, 'base64-output')}
            style={{
              position: 'absolute', top: 30, right: 10,
              padding: '4px 8px', borderRadius: 6,
              background: copiedId === 'base64-output' ? 'rgba(16, 185, 129, 0.15)' : 'var(--window-bg)',
              border: '1px solid var(--glass-border)',
              color: copiedId === 'base64-output' ? '#10b981' : 'var(--text-secondary)',
              cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 4,
              fontSize: 11,
            }}
          >
            {copiedId === 'base64-output' ? <Check size={12} /> : <Copy size={12} />}
            {copiedId === 'base64-output' ? '已复制' : '复制'}
          </button>
        </div>
      )}
    </div>
  )
}

// 哈希工具
function HashTool({ onCopy, copiedId }: { onCopy: (text: string, id: string) => void; copiedId: string | null }) {
  const [input, setInput] = useState('')
  const [algorithm, setAlgorithm] = useState<'SHA-256' | 'SHA-384' | 'SHA-512'>('SHA-256')
  const [hash, setHash] = useState('')
  const [loading, setLoading] = useState(false)

  const computeHash = useCallback(async () => {
    if (!input) return
    setLoading(true)
    try {
      const encoder = new TextEncoder()
      const data = encoder.encode(input)
      const buffer = await crypto.subtle.digest(algorithm, data)
      const hashArray = Array.from(new Uint8Array(buffer))
      const hashHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('')
      setHash(hashHex)
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }, [input, algorithm])

  return (
    <div style={{ animation: 'fadeSlideUp 0.3s ease-out' }}>
      <div style={{ marginBottom: 20 }}>
        <h3 style={{ margin: '0 0 8px', fontSize: 16, fontWeight: 600 }}>哈希生成器</h3>
        <p style={{ margin: 0, fontSize: 13, color: 'var(--text-secondary)' }}>
          使用 Web Crypto API 在浏览器本地计算哈希
        </p>
      </div>

      <div style={{ display: 'flex', gap: 4, marginBottom: 12 }}>
        {(['SHA-256', 'SHA-384', 'SHA-512'] as const).map(algo => (
          <button
            key={algo}
            onClick={() => setAlgorithm(algo)}
            style={{
              flex: 1, padding: '8px 12px', borderRadius: 8,
              background: algorithm === algo ? 'var(--accent-bg)' : 'var(--glass-bg)',
              border: algorithm === algo ? '1px solid var(--accent)' : '1px solid var(--glass-border)',
              color: algorithm === algo ? 'var(--accent)' : 'var(--text-secondary)',
              cursor: 'pointer', fontSize: 12,
            }}
          >
            {algo}
          </button>
        ))}
      </div>

      <textarea
        value={input}
        onChange={(e) => setInput(e.target.value)}
        placeholder="输入要计算哈希的文本..."
        style={{
          width: '100%', minHeight: 80, padding: 12, borderRadius: 10,
          background: 'var(--glass-bg)', border: '1px solid var(--glass-border)',
          color: 'var(--text-primary)', fontFamily: 'monospace', fontSize: 13,
          resize: 'vertical', marginBottom: 12,
        }}
      />

      <button
        onClick={computeHash}
        disabled={!input || loading}
        style={{
          width: '100%', padding: '12px', borderRadius: 10,
          background: !input || loading ? 'var(--glass-bg)' : 'linear-gradient(135deg, var(--accent) 0%, #a29bfe 100%)',
          color: !input || loading ? 'var(--text-secondary)' : 'white',
          border: 'none', cursor: !input || loading ? 'not-allowed' : 'pointer',
          fontSize: 14, fontWeight: 600, marginBottom: 12,
          display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
        }}
      >
        <RefreshCw size={16} style={{ animation: loading ? 'spin 1s linear infinite' : 'none' }} />
        {loading ? '计算中...' : '计算哈希'}
      </button>

      {hash && (
        <div
          style={{
            padding: 14, borderRadius: 10,
            background: 'var(--glass-bg)', border: '1px solid var(--glass-border)',
            position: 'relative',
          }}
        >
          <div style={{ fontSize: 12, color: 'var(--text-secondary)', marginBottom: 8 }}>
            {algorithm} 哈希值
          </div>
          <code style={{ fontSize: 12, color: 'var(--text-primary)', fontFamily: 'monospace', wordBreak: 'break-all' }}>
            {hash}
          </code>
          <button
            onClick={() => onCopy(hash, 'hash-output')}
            style={{
              position: 'absolute', top: 10, right: 10,
              padding: '4px 8px', borderRadius: 6,
              background: copiedId === 'hash-output' ? 'rgba(16, 185, 129, 0.15)' : 'var(--window-bg)',
              border: '1px solid var(--glass-border)',
              color: copiedId === 'hash-output' ? '#10b981' : 'var(--text-secondary)',
              cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 4,
              fontSize: 11,
            }}
          >
            {copiedId === 'hash-output' ? <Check size={12} /> : <Copy size={12} />}
            {copiedId === 'hash-output' ? '已复制' : '复制'}
          </button>
        </div>
      )}
    </div>
  )
}

// 密码生成器
function PasswordGenerator({ onCopy, copiedId }: { onCopy: (text: string, id: string) => void; copiedId: string | null }) {
  const [length, setLength] = useState(16)
  const [options, setOptions] = useState({
    uppercase: true,
    lowercase: true,
    numbers: true,
    symbols: true,
  })
  const [password, setPassword] = useState('')

  const generate = useCallback(() => {
    const chars: string[] = []
    if (options.uppercase) chars.push('ABCDEFGHIJKLMNOPQRSTUVWXYZ')
    if (options.lowercase) chars.push('abcdefghijklmnopqrstuvwxyz')
    if (options.numbers) chars.push('0123456789')
    if (options.symbols) chars.push('!@#$%^&*()_+-=[]{}|;:,.<>?')
    
    if (chars.length === 0) {
      setPassword('请至少选择一种字符类型')
      return
    }

    const allChars = chars.join('')
    const array = new Uint32Array(length)
    crypto.getRandomValues(array)
    
    let result = ''
    for (let i = 0; i < length; i++) {
      result += allChars[array[i] % allChars.length]
    }
    setPassword(result)
  }, [length, options])

  const getStrength = () => {
    let score = 0
    if (length >= 12) score++
    if (length >= 16) score++
    if (options.uppercase) score++
    if (options.numbers) score++
    if (options.symbols) score++
    
    if (score <= 2) return { label: '弱', color: '#ef4444' }
    if (score <= 3) return { label: '中等', color: '#f59e0b' }
    if (score <= 4) return { label: '强', color: '#10b981' }
    return { label: '极强', color: '#8b5cf6' }
  }

  const strength = getStrength()

  return (
    <div style={{ animation: 'fadeSlideUp 0.3s ease-out' }}>
      <div style={{ marginBottom: 20 }}>
        <h3 style={{ margin: '0 0 8px', fontSize: 16, fontWeight: 600 }}>密码生成器</h3>
        <p style={{ margin: 0, fontSize: 13, color: 'var(--text-secondary)' }}>
          使用加密安全的随机数生成强密码
        </p>
      </div>

      <div style={{ marginBottom: 16 }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
          <label style={{ fontSize: 13, color: 'var(--text-secondary)' }}>密码长度</label>
          <span style={{ fontSize: 18, fontWeight: 600, color: 'var(--accent)' }}>{length}</span>
        </div>
        <input
          type="range"
          min={8}
          max={64}
          value={length}
          onChange={(e) => setLength(parseInt(e.target.value))}
          style={{ width: '100%' }}
        />
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginBottom: 20 }}>
        {[
          { key: 'uppercase' as const, label: '大写字母 (A-Z)' },
          { key: 'lowercase' as const, label: '小写字母 (a-z)' },
          { key: 'numbers' as const, label: '数字 (0-9)' },
          { key: 'symbols' as const, label: '特殊符号 (!@#$...)' },
        ].map(({ key, label }) => (
          <label
            key={key}
            style={{
              display: 'flex', alignItems: 'center', gap: 10,
              padding: '8px 12px', borderRadius: 8,
              background: options[key] ? 'var(--accent-bg)' : 'var(--glass-bg)',
              border: `1px solid ${options[key] ? 'var(--accent)' : 'var(--glass-border)'}`,
              cursor: 'pointer', fontSize: 13,
            }}
          >
            <input
              type="checkbox"
              checked={options[key]}
              onChange={(e) => setOptions({ ...options, [key]: e.target.checked })}
              style={{ width: 16, height: 16 }}
            />
            {label}
          </label>
        ))}
      </div>

      <button
        onClick={generate}
        style={{
          width: '100%', padding: '12px', borderRadius: 10,
          background: 'linear-gradient(135deg, var(--accent) 0%, #a29bfe 100%)',
          color: 'white', border: 'none', cursor: 'pointer',
          fontSize: 14, fontWeight: 600, marginBottom: 16,
          display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
        }}
      >
        <Lock size={16} />
        生成密码
      </button>

      {password && (
        <div
          style={{
            padding: 16, borderRadius: 12,
            background: 'var(--glass-bg)', border: '1px solid var(--glass-border)',
            position: 'relative',
          }}
        >
          <div style={{ 
            display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10,
            fontSize: 12, color: strength.color, fontWeight: 600,
          }}>
            <Shield size={14} />
            强度: {strength.label}
          </div>
          <code style={{ fontSize: 14, color: 'var(--text-primary)', fontFamily: 'monospace', wordBreak: 'break-all' }}>
            {password}
          </code>
          <button
            onClick={() => onCopy(password, 'password-output')}
            style={{
              position: 'absolute', top: 10, right: 10,
              padding: '4px 8px', borderRadius: 6,
              background: copiedId === 'password-output' ? 'rgba(16, 185, 129, 0.15)' : 'var(--window-bg)',
              border: '1px solid var(--glass-border)',
              color: copiedId === 'password-output' ? '#10b981' : 'var(--text-secondary)',
              cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 4,
              fontSize: 11,
            }}
          >
            {copiedId === 'password-output' ? <Check size={12} /> : <Copy size={12} />}
            {copiedId === 'password-output' ? '已复制' : '复制'}
          </button>
        </div>
      )}
    </div>
  )
}

// JWT 解码器
function JWTDecoder({ onNotify }: {
  onNotify: (title: string, message: string, type?: 'success' | 'error' | 'info') => void
}) {
  const [token, setToken] = useState('')
  const [decoded, setDecoded] = useState<{ header: string; payload: string } | null>(null)

  const decodeJWT = useCallback(() => {
    try {
      const parts = token.split('.')
      if (parts.length !== 3) {
        onNotify('错误', '无效的 JWT 格式', 'error')
        return
      }
      
      const header = JSON.parse(atob(parts[0]))
      const payload = JSON.parse(atob(parts[1]))
      
      setDecoded({
        header: JSON.stringify(header, null, 2),
        payload: JSON.stringify(payload, null, 2),
      })
      onNotify('成功', 'JWT 解码成功', 'success')
    } catch {
      onNotify('错误', 'JWT 解码失败，请检查格式', 'error')
    }
  }, [token, onNotify])

  return (
    <div style={{ animation: 'fadeSlideUp 0.3s ease-out' }}>
      <div style={{ marginBottom: 20 }}>
        <h3 style={{ margin: '0 0 8px', fontSize: 16, fontWeight: 600 }}>JWT 解码器</h3>
        <p style={{ margin: 0, fontSize: 13, color: 'var(--text-secondary)' }}>
          解析 JSON Web Token 的头部和载荷（仅解码，不验证签名）
        </p>
      </div>

      <textarea
        value={token}
        onChange={(e) => setToken(e.target.value)}
        placeholder="在此粘贴 JWT Token..."
        style={{
          width: '100%', minHeight: 80, padding: 12, borderRadius: 10,
          background: 'var(--glass-bg)', border: '1px solid var(--glass-border)',
          color: 'var(--text-primary)', fontFamily: 'monospace', fontSize: 12,
          resize: 'vertical', marginBottom: 12,
        }}
      />

      <button
        onClick={decodeJWT}
        disabled={!token}
        style={{
          width: '100%', padding: '12px', borderRadius: 10,
          background: !token ? 'var(--glass-bg)' : 'linear-gradient(135deg, var(--accent) 0%, #a29bfe 100%)',
          color: !token ? 'var(--text-secondary)' : 'white',
          border: 'none', cursor: !token ? 'not-allowed' : 'pointer',
          fontSize: 14, fontWeight: 600, marginBottom: 16,
          display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
        }}
      >
        <Zap size={16} />
        解码 JWT
      </button>

      {decoded && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          <div
            style={{
              padding: 14, borderRadius: 10,
              background: 'var(--glass-bg)', border: '1px solid var(--glass-border)',
              position: 'relative',
            }}
          >
            <div style={{ fontSize: 12, color: 'var(--accent)', marginBottom: 8, fontWeight: 600 }}>
              Header
            </div>
            <pre style={{ fontSize: 12, color: 'var(--text-primary)', fontFamily: 'monospace', margin: 0, overflow: 'auto' }}>
              {decoded.header}
            </pre>
          </div>

          <div
            style={{
              padding: 14, borderRadius: 10,
              background: 'var(--glass-bg)', border: '1px solid var(--glass-border)',
              position: 'relative',
            }}
          >
            <div style={{ fontSize: 12, color: 'var(--accent)', marginBottom: 8, fontWeight: 600 }}>
              Payload
            </div>
            <pre style={{ fontSize: 12, color: 'var(--text-primary)', fontFamily: 'monospace', margin: 0, overflow: 'auto' }}>
              {decoded.payload}
            </pre>
          </div>
        </div>
      )}
    </div>
  )
}

export default DevToolkit
