import { useState, useCallback, useMemo } from 'react'

type ToolId =
  | 'password' | 'uuid' | 'timestamp' | 'url' | 'base64'
  | 'hash' | 'json' | 'color' | 'unit' | 'text'

interface TabDef {
  id: ToolId
  label: string
  icon: string
}

const tabs: TabDef[] = [
  { id: 'password', label: '密码生成', icon: '🔐' },
  { id: 'uuid', label: 'UUID', icon: '🆔' },
  { id: 'timestamp', label: '时间戳', icon: '⏰' },
  { id: 'url', label: 'URL 编解码', icon: '🔗' },
  { id: 'base64', label: 'Base64', icon: '🔓' },
  { id: 'hash', label: 'Hash', icon: '⚡' },
  { id: 'json', label: 'JSON', icon: '📋' },
  { id: 'color', label: '颜色', icon: '🎨' },
  { id: 'unit', label: '单位换算', icon: '📏' },
  { id: 'text', label: '文本统计', icon: '📊' },
]

const commonGlass: React.CSSProperties = {
  background: 'rgba(255,255,255,0.06)',
  backdropFilter: 'blur(16px)',
  WebkitBackdropFilter: 'blur(16px)',
  border: '1px solid rgba(255,255,255,0.1)',
  borderRadius: '16px',
}

const commonInput: React.CSSProperties = {
  width: '100%',
  padding: '10px 14px',
  background: 'rgba(0,0,0,0.3)',
  border: '1px solid rgba(255,255,255,0.1)',
  borderRadius: '10px',
  color: '#e4e4e7',
  fontSize: '14px',
  outline: 'none',
  transition: 'border-color 0.2s',
  boxSizing: 'border-box',
}

const commonBtn: React.CSSProperties = {
  padding: '10px 20px',
  background: 'linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)',
  border: 'none',
  borderRadius: '10px',
  color: '#fff',
  fontWeight: 600,
  fontSize: '14px',
  cursor: 'pointer',
  transition: 'transform 0.15s, box-shadow 0.15s',
}

const ghostBtn: React.CSSProperties = {
  padding: '8px 16px',
  background: 'rgba(255,255,255,0.08)',
  border: '1px solid rgba(255,255,255,0.12)',
  borderRadius: '10px',
  color: '#cbd5e1',
  fontSize: '13px',
  cursor: 'pointer',
  transition: 'background 0.15s',
}

const copyToClipboard = async (text: string): Promise<boolean> => {
  try {
    await navigator.clipboard.writeText(text)
    return true
  } catch {
    return false
  }
}

export default function QuickTools() {
  const [activeTab, setActiveTab] = useState<ToolId>('password')
  const [copyMsg, setCopyMsg] = useState('')

  const handleCopy = useCallback(async (text: string) => {
    const ok = await copyToClipboard(text)
    setCopyMsg(ok ? '已复制到剪贴板' : '复制失败')
    setTimeout(() => setCopyMsg(''), 2000)
  }, [])

  return (
    <div style={{
      height: '100%',
      display: 'flex',
      flexDirection: 'column',
      background: 'linear-gradient(135deg, #0f0f1a 0%, #1a1a2e 50%, #16213e 100%)',
      color: '#e4e4e7',
      overflow: 'hidden',
      fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
      position: 'relative',
    }}>
      <style>{`
        @keyframes qt-fade-in { from { opacity: 0; transform: translateY(6px); } to { opacity: 1; transform: translateY(0); } }
        @keyframes qt-toast-in { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }
        .qt-fade-in { animation: qt-fade-in 0.25s ease-out; }
        .qt-scroll::-webkit-scrollbar { width: 6px; height: 6px; }
        .qt-scroll::-webkit-scrollbar-track { background: transparent; }
        .qt-scroll::-webkit-scrollbar-thumb { background: rgba(255,255,255,0.15); border-radius: 3px; }
        .qt-scroll::-webkit-scrollbar-thumb:hover { background: rgba(255,255,255,0.25); }
      `}</style>

      <Header />

      <div style={{
        display: 'flex',
        gap: '4px',
        padding: '12px 16px 0',
        borderBottom: '1px solid rgba(255,255,255,0.08)',
        flexShrink: 0,
        overflowX: 'auto',
      }} className="qt-scroll">
        {tabs.map((t) => (
          <button
            key={t.id}
            onClick={() => setActiveTab(t.id)}
            style={{
              padding: '10px 16px',
              background: activeTab === t.id ? 'rgba(99,102,241,0.2)' : 'transparent',
              border: activeTab === t.id ? '1px solid rgba(99,102,241,0.4)' : '1px solid transparent',
              borderRadius: '12px 12px 0 0',
              color: activeTab === t.id ? '#a5b4fc' : '#94a3b8',
              fontSize: '13px',
              fontWeight: activeTab === t.id ? 600 : 400,
              cursor: 'pointer',
              whiteSpace: 'nowrap',
              transition: 'all 0.15s',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
            }}
          >
            <span>{t.icon}</span>
            <span>{t.label}</span>
          </button>
        ))}
      </div>

      <div style={{
        flex: 1,
        overflowY: 'auto',
        padding: '20px',
      }} className="qt-scroll">
        <div key={activeTab} className="qt-fade-in">
          {activeTab === 'password' && <PasswordTool onCopy={handleCopy} />}
          {activeTab === 'uuid' && <UuidTool onCopy={handleCopy} />}
          {activeTab === 'timestamp' && <TimestampTool onCopy={handleCopy} />}
          {activeTab === 'url' && <UrlTool onCopy={handleCopy} />}
          {activeTab === 'base64' && <Base64Tool onCopy={handleCopy} />}
          {activeTab === 'hash' && <HashTool onCopy={handleCopy} />}
          {activeTab === 'json' && <JsonTool onCopy={handleCopy} />}
          {activeTab === 'color' && <ColorTool onCopy={handleCopy} />}
          {activeTab === 'unit' && <UnitTool onCopy={handleCopy} />}
          {activeTab === 'text' && <TextTool onCopy={handleCopy} />}
        </div>
      </div>

      {copyMsg && (
        <div style={{
          position: 'absolute',
          bottom: '24px',
          left: '50%',
          transform: 'translateX(-50%)',
          padding: '10px 20px',
          background: 'rgba(34,197,94,0.9)',
          borderRadius: '10px',
          color: '#fff',
          fontSize: '13px',
          fontWeight: 500,
          animation: 'qt-toast-in 0.2s ease-out',
          boxShadow: '0 4px 20px rgba(0,0,0,0.3)',
          zIndex: 100,
        }}>
          {copyMsg}
        </div>
      )}
    </div>
  )
}

function Header() {
  return (
    <div style={{
      padding: '16px 20px',
      display: 'flex',
      alignItems: 'center',
      gap: '12px',
      flexShrink: 0,
    }}>
      <div style={{
        width: '40px',
        height: '40px',
        borderRadius: '12px',
        background: 'linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontSize: '20px',
      }}>
        ⚡
      </div>
      <div>
        <h1 style={{ margin: 0, fontSize: '18px', fontWeight: 700 }}>QuickTools</h1>
        <p style={{ margin: 0, fontSize: '12px', color: '#94a3b8' }}>在线工具箱 · 10大实用工具合集</p>
      </div>
    </div>
  )
}

interface ToolProps { onCopy: (t: string) => void }

/* ==================== 1. 随机密码生成器 ==================== */
function PasswordTool({ onCopy }: ToolProps) {
  const [length, setLength] = useState(16)
  const [useUpper, setUseUpper] = useState(true)
  const [useLower, setUseLower] = useState(true)
  const [useNumber, setUseNumber] = useState(true)
  const [useSymbol, setUseSymbol] = useState(false)
  const [password, setPassword] = useState('')

  const generate = useCallback(() => {
    const upper = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'
    const lower = 'abcdefghijklmnopqrstuvwxyz'
    const number = '0123456789'
    const symbol = '!@#$%^&*()_+-=[]{}|;:,.<>?'
    let charset = ''
    if (useUpper) charset += upper
    if (useLower) charset += lower
    if (useNumber) charset += number
    if (useSymbol) charset += symbol
    if (!charset) { setPassword('请至少选择一种字符类型'); return }
    const arr = new Uint32Array(length)
    crypto.getRandomValues(arr)
    let result = ''
    for (let i = 0; i < length; i++) {
      result += charset[arr[i] % charset.length]
    }
    setPassword(result)
  }, [length, useUpper, useLower, useNumber, useSymbol])

  const strength = useMemo(() => {
    let score = 0
    if (length >= 8) score++
    if (length >= 12) score++
    if (length >= 16) score++
    if (length >= 24) score++
    if (useUpper) score++
    if (useLower) score++
    if (useNumber) score++
    if (useSymbol) score++
    if (score <= 2) return { label: '弱', color: '#ef4444', pct: 25 }
    if (score <= 4) return { label: '中等', color: '#f59e0b', pct: 50 }
    if (score <= 6) return { label: '强', color: '#10b981', pct: 75 }
    return { label: '非常强', color: '#06b6d4', pct: 100 }
  }, [length, useUpper, useLower, useNumber, useSymbol])

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', maxWidth: '600px', margin: '0 auto' }}>
      <div style={{ ...commonGlass, padding: '20px' }}>
        <div style={{
          background: 'rgba(0,0,0,0.4)',
          borderRadius: '12px',
          padding: '16px',
          fontFamily: 'monospace',
          fontSize: '18px',
          color: '#a5b4fc',
          wordBreak: 'break-all',
          minHeight: '56px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: '12px',
        }}>
          <span style={{ flex: 1 }}>{password || '点击下方按钮生成密码'}</span>
          {password && (
            <div style={{ display: 'flex', gap: '8px', flexShrink: 0 }}>
              <button onClick={generate} style={{ ...ghostBtn, padding: '6px 12px' }}>🔄</button>
              <button onClick={() => onCopy(password)} style={{ ...ghostBtn, padding: '6px 12px' }}>📋</button>
            </div>
          )}
        </div>
        {password && (
          <div style={{ marginTop: '14px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
              <span style={{ fontSize: '12px', color: '#94a3b8' }}>密码强度</span>
              <span style={{ fontSize: '12px', color: strength.color, fontWeight: 600 }}>{strength.label}</span>
            </div>
            <div style={{ height: '6px', background: 'rgba(0,0,0,0.3)', borderRadius: '3px', overflow: 'hidden' }}>
              <div style={{ height: '100%', width: `${strength.pct}%`, background: strength.color, transition: 'width 0.3s' }} />
            </div>
          </div>
        )}
      </div>

      <div style={{ ...commonGlass, padding: '20px' }}>
        <div style={{ marginBottom: '16px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
            <span style={{ fontSize: '14px' }}>密码长度</span>
            <span style={{ fontSize: '14px', fontWeight: 600, color: '#a5b4fc' }}>{length}</span>
          </div>
          <input
            type="range" min={4} max={64} value={length}
            onChange={(e) => setLength(Number(e.target.value))}
            style={{ width: '100%', accentColor: '#6366f1' }}
          />
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '10px' }}>
          {([
            { label: '大写字母 (A-Z)', val: useUpper, set: setUseUpper },
            { label: '小写字母 (a-z)', val: useLower, set: setUseLower },
            { label: '数字 (0-9)', val: useNumber, set: setUseNumber },
            { label: '特殊符号 (!@#$)', val: useSymbol, set: setUseSymbol },
          ] as const).map(({ label, val, set }) => (
            <label key={label} style={{
              display: 'flex', alignItems: 'center', gap: '10px',
              padding: '10px 12px',
              background: val ? 'rgba(99,102,241,0.12)' : 'rgba(255,255,255,0.04)',
              border: `1px solid ${val ? 'rgba(99,102,241,0.3)' : 'rgba(255,255,255,0.08)'}`,
              borderRadius: '10px', cursor: 'pointer', fontSize: '13px',
              transition: 'all 0.15s',
            }}>
              <input type="checkbox" checked={val} onChange={(e) => set(e.target.checked)} style={{ accentColor: '#6366f1' }} />
              {label}
            </label>
          ))}
        </div>

        <button onClick={generate} style={{ ...commonBtn, width: '100%', marginTop: '16px', padding: '14px', fontSize: '15px' }}>
          🎲 生成密码
        </button>
      </div>
    </div>
  )
}

/* ==================== 2. UUID 生成器 ==================== */
function UuidTool({ onCopy }: ToolProps) {
  const [count, setCount] = useState(5)
  const [uuids, setUuids] = useState<string[]>([])

  const genUuidV4 = useCallback((): string => {
    const buf = new Uint8Array(16)
    crypto.getRandomValues(buf)
    buf[6] = (buf[6] & 0x0f) | 0x40
    buf[8] = (buf[8] & 0x3f) | 0x80
    const hex = Array.from(buf).map((b) => b.toString(16).padStart(2, '0')).join('')
    return `${hex.slice(0, 8)}-${hex.slice(8, 12)}-${hex.slice(12, 16)}-${hex.slice(16, 20)}-${hex.slice(20)}`
  }, [])

  const generate = useCallback(() => {
    const results: string[] = []
    for (let i = 0; i < count; i++) {
      results.push(genUuidV4())
    }
    setUuids(results)
  }, [count, genUuidV4])

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', maxWidth: '700px', margin: '0 auto' }}>
      <div style={{ ...commonGlass, padding: '20px', display: 'flex', alignItems: 'center', gap: '16px' }}>
        <span style={{ fontSize: '14px' }}>生成数量</span>
        <input type="number" min={1} max={100} value={count}
          onChange={(e) => setCount(Math.min(100, Math.max(1, Number(e.target.value) || 1)))}
          style={{ ...commonInput, width: '80px', textAlign: 'center' }} />
        <button onClick={generate} style={{ ...commonBtn, flex: 1 }}>🎲 生成 UUID v4</button>
      </div>

      {uuids.length > 0 && (
        <div style={{ ...commonGlass, padding: '12px' }}>
          <div style={{ maxHeight: '400px', overflowY: 'auto' }} className="qt-scroll">
            {uuids.map((u, i) => (
              <div key={i} style={{
                display: 'flex', alignItems: 'center', gap: '10px',
                padding: '10px 12px',
                borderBottom: i < uuids.length - 1 ? '1px solid rgba(255,255,255,0.06)' : 'none',
              }}>
                <code style={{ flex: 1, fontFamily: 'monospace', fontSize: '13px', color: '#c7d2fe', wordBreak: 'break-all' }}>{u}</code>
                <button onClick={() => onCopy(u)} style={{ ...ghostBtn, padding: '4px 10px', fontSize: '12px' }}>📋</button>
              </div>
            ))}
          </div>
          <div style={{ display: 'flex', gap: '10px', marginTop: '12px' }}>
            <button onClick={() => onCopy(uuids.join('\n'))} style={{ ...ghostBtn, flex: 1 }}>📋 复制全部</button>
            <button onClick={generate} style={{ ...ghostBtn, flex: 1 }}>🔄 重新生成</button>
          </div>
        </div>
      )}
    </div>
  )
}

/* ==================== 3. 时间戳转换 ==================== */
function TimestampTool({ onCopy }: ToolProps) {
  const now = new Date()
  const pad = (x: number) => String(x).padStart(2, '0')
  const initLocal = `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}T${pad(now.getHours())}:${pad(now.getMinutes())}:${pad(now.getSeconds())}`

  const [ts, setTs] = useState(() => String(Math.floor(Date.now() / 1000)))
  const [tsMs, setTsMs] = useState(() => String(Date.now()))
  const [dateStr, setDateStr] = useState(() => now.toISOString().slice(0, 19))
  const [localDate, setLocalDate] = useState(initLocal)

  const fromTs = useCallback(() => {
    const n = Number(ts)
    if (!n || n < 0 || !Number.isFinite(n)) return
    const d = new Date(n * 1000)
    setDateStr(d.toISOString().slice(0, 19))
    setLocalDate(`${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`)
    setTsMs(String(n * 1000))
  }, [ts])

  const fromTsMs = useCallback(() => {
    const n = Number(tsMs)
    if (!n || n < 0 || !Number.isFinite(n)) return
    const d = new Date(n)
    setDateStr(d.toISOString().slice(0, 19))
    setLocalDate(`${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`)
    setTs(String(Math.floor(n / 1000)))
  }, [tsMs])

  const fromDate = useCallback(() => {
    const d = new Date(dateStr)
    if (isNaN(d.getTime())) return
    setTs(String(Math.floor(d.getTime() / 1000)))
    setTsMs(String(d.getTime()))
    setLocalDate(`${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`)
  }, [dateStr])

  const fromLocal = useCallback(() => {
    const d = new Date(localDate)
    if (isNaN(d.getTime())) return
    setTs(String(Math.floor(d.getTime() / 1000)))
    setTsMs(String(d.getTime()))
    setDateStr(d.toISOString().slice(0, 19))
  }, [localDate])

  const setNow = useCallback(() => {
    const d = new Date()
    setTs(String(Math.floor(d.getTime() / 1000)))
    setTsMs(String(d.getTime()))
    setDateStr(d.toISOString().slice(0, 19))
    setLocalDate(`${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`)
  }, [])

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', maxWidth: '700px', margin: '0 auto' }}>
      <div style={{ ...commonGlass, padding: '20px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
          <span style={{ fontSize: '15px', fontWeight: 600 }}>Unix 时间戳 → 日期</span>
          <button onClick={setNow} style={{ ...ghostBtn, padding: '6px 12px' }}>⏱️ 当前时间</button>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr auto', gap: '10px' }}>
          <input type="number" value={ts} onChange={(e) => setTs(e.target.value)}
            placeholder="秒级时间戳" style={commonInput} />
          <button onClick={fromTs} style={commonBtn}>转换</button>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr auto', gap: '10px', marginTop: '10px' }}>
          <input type="number" value={tsMs} onChange={(e) => setTsMs(e.target.value)}
            placeholder="毫秒级时间戳" style={commonInput} />
          <button onClick={fromTsMs} style={commonBtn}>转换</button>
        </div>
      </div>

      <div style={{ ...commonGlass, padding: '20px' }}>
        <div style={{ fontSize: '15px', fontWeight: 600, marginBottom: '14px' }}>日期 → Unix 时间戳</div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr auto', gap: '10px', marginBottom: '10px' }}>
          <input type="datetime-local" step="1" value={localDate} onChange={(e) => setLocalDate(e.target.value)} style={commonInput} />
          <button onClick={fromLocal} style={commonBtn}>转换</button>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr auto', gap: '10px' }}>
          <input type="text" value={dateStr} onChange={(e) => setDateStr(e.target.value)}
            placeholder="ISO 格式 (UTC)" style={commonInput} />
          <button onClick={fromDate} style={commonBtn}>转换</button>
        </div>
      </div>

      <div style={{ ...commonGlass, padding: '20px' }}>
        <div style={{ fontSize: '15px', fontWeight: 600, marginBottom: '12px' }}>转换结果</div>
        <ResultRow label="秒级时间戳" value={ts} onCopy={onCopy} />
        <ResultRow label="毫秒级" value={tsMs} onCopy={onCopy} />
        <ResultRow label="UTC 时间" value={dateStr.replace('T', ' ')} onCopy={onCopy} />
        <ResultRow label="本地时间" value={localDate.replace('T', ' ')} onCopy={onCopy} />
      </div>
    </div>
  )
}

function ResultRow({ label, value, onCopy }: { label: string; value: string; onCopy: (t: string) => void }) {
  return (
    <div style={{
      display: 'flex', alignItems: 'center', gap: '10px',
      padding: '10px 12px', marginBottom: '8px',
      background: 'rgba(0,0,0,0.3)', borderRadius: '10px',
    }}>
      <span style={{ fontSize: '13px', color: '#94a3b8', minWidth: '100px' }}>{label}</span>
      <code style={{ flex: 1, fontFamily: 'monospace', fontSize: '13px', color: '#c7d2fe', wordBreak: 'break-all' }}>{value}</code>
      <button onClick={() => onCopy(value)} style={{ ...ghostBtn, padding: '4px 10px', fontSize: '12px' }}>📋</button>
    </div>
  )
}

/* ==================== 4. URL 编码/解码 ==================== */
function UrlTool({ onCopy }: ToolProps) {
  const [input, setInput] = useState('')
  const [output, setOutput] = useState('')
  const [mode, setMode] = useState<'encode' | 'decode'>('encode')
  const [error, setError] = useState('')

  const process = useCallback(() => {
    setError('')
    if (!input) { setOutput(''); return }
    try {
      if (mode === 'encode') setOutput(encodeURIComponent(input))
      else setOutput(decodeURIComponent(input))
    } catch {
      setError('解码失败：输入格式无效')
      setOutput('')
    }
  }, [input, mode])

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', maxWidth: '700px', margin: '0 auto' }}>
      <div style={{ ...commonGlass, padding: '20px' }}>
        <div style={{ display: 'flex', gap: '8px', marginBottom: '14px' }}>
          {(['encode', 'decode'] as const).map((m) => (
            <button key={m} onClick={() => setMode(m)} style={{
              flex: 1, padding: '10px',
              background: mode === m ? 'rgba(99,102,241,0.2)' : 'rgba(255,255,255,0.04)',
              border: mode === m ? '1px solid rgba(99,102,241,0.4)' : '1px solid rgba(255,255,255,0.08)',
              borderRadius: '10px', color: mode === m ? '#a5b4fc' : '#94a3b8',
              fontSize: '14px', fontWeight: mode === m ? 600 : 400, cursor: 'pointer',
            }}>
              {m === 'encode' ? '编码' : '解码'}
            </button>
          ))}
        </div>

        <textarea value={input} onChange={(e) => setInput(e.target.value)}
          placeholder={mode === 'encode' ? '输入要编码的文本...' : '输入要解码的 URL...'}
          rows={5} style={{ ...commonInput, resize: 'vertical', fontFamily: 'monospace' }} />

        <div style={{ display: 'flex', gap: '10px', marginTop: '12px' }}>
          <button onClick={process} style={{ ...commonBtn, flex: 1 }}>
            {mode === 'encode' ? '🔗 编码' : '🔓 解码'}
          </button>
          <button onClick={() => { setInput(output); setOutput(''); setMode(mode === 'encode' ? 'decode' : 'encode') }} style={ghostBtn}>
            ⇅ 交换
          </button>
        </div>
      </div>

      {(output || error) && (
        <div style={{ ...commonGlass, padding: '20px' }}>
          {error ? (
            <div style={{ color: '#ef4444', fontSize: '14px' }}>⚠️ {error}</div>
          ) : (
            <>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
                <span style={{ fontSize: '14px', color: '#94a3b8' }}>结果</span>
                <button onClick={() => onCopy(output)} style={{ ...ghostBtn, padding: '4px 10px', fontSize: '12px' }}>📋 复制</button>
              </div>
              <div style={{
                padding: '14px', background: 'rgba(0,0,0,0.4)', borderRadius: '10px',
                fontFamily: 'monospace', fontSize: '13px', color: '#a5b4fc',
                wordBreak: 'break-all', minHeight: '60px', whiteSpace: 'pre-wrap',
              }}>{output}</div>
            </>
          )}
        </div>
      )}
    </div>
  )
}

/* ==================== 5. Base64 编码/解码 ==================== */
function Base64Tool({ onCopy }: ToolProps) {
  const [input, setInput] = useState('')
  const [output, setOutput] = useState('')
  const [mode, setMode] = useState<'encode' | 'decode'>('encode')
  const [error, setError] = useState('')

  const process = useCallback(() => {
    setError('')
    if (!input) { setOutput(''); return }
    try {
      if (mode === 'encode') {
        setOutput(btoa(unescape(encodeURIComponent(input))))
      } else {
        setOutput(decodeURIComponent(escape(atob(input))))
      }
    } catch {
      setError('解码失败：无效的 Base64 字符串')
      setOutput('')
    }
  }, [input, mode])

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', maxWidth: '700px', margin: '0 auto' }}>
      <div style={{ ...commonGlass, padding: '20px' }}>
        <div style={{ display: 'flex', gap: '8px', marginBottom: '14px' }}>
          {(['encode', 'decode'] as const).map((m) => (
            <button key={m} onClick={() => setMode(m)} style={{
              flex: 1, padding: '10px',
              background: mode === m ? 'rgba(99,102,241,0.2)' : 'rgba(255,255,255,0.04)',
              border: mode === m ? '1px solid rgba(99,102,241,0.4)' : '1px solid rgba(255,255,255,0.08)',
              borderRadius: '10px', color: mode === m ? '#a5b4fc' : '#94a3b8',
              fontSize: '14px', fontWeight: mode === m ? 600 : 400, cursor: 'pointer',
            }}>
              {m === 'encode' ? '编码' : '解码'}
            </button>
          ))}
        </div>

        <textarea value={input} onChange={(e) => setInput(e.target.value)}
          placeholder={mode === 'encode' ? '输入要编码的文本（支持中文）...' : '输入要解码的 Base64 字符串...'}
          rows={5} style={{ ...commonInput, resize: 'vertical', fontFamily: 'monospace' }} />

        <div style={{ display: 'flex', gap: '10px', marginTop: '12px' }}>
          <button onClick={process} style={{ ...commonBtn, flex: 1 }}>
            {mode === 'encode' ? '🔐 编码' : '🔓 解码'}
          </button>
          <button onClick={() => { setInput(output); setOutput(''); setMode(mode === 'encode' ? 'decode' : 'encode') }} style={ghostBtn}>
            ⇅ 交换
          </button>
        </div>
      </div>

      {(output || error) && (
        <div style={{ ...commonGlass, padding: '20px' }}>
          {error ? (
            <div style={{ color: '#ef4444', fontSize: '14px' }}>⚠️ {error}</div>
          ) : (
            <>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
                <span style={{ fontSize: '14px', color: '#94a3b8' }}>结果</span>
                <button onClick={() => onCopy(output)} style={{ ...ghostBtn, padding: '4px 10px', fontSize: '12px' }}>📋 复制</button>
              </div>
              <div style={{
                padding: '14px', background: 'rgba(0,0,0,0.4)', borderRadius: '10px',
                fontFamily: 'monospace', fontSize: '13px', color: '#a5b4fc',
                wordBreak: 'break-all', minHeight: '60px', whiteSpace: 'pre-wrap',
              }}>{output}</div>
            </>
          )}
        </div>
      )}
    </div>
  )
}

/* ==================== 6. Hash 计算器 ==================== */
type HashAlgo = 'SHA-256' | 'SHA-1' | 'SHA-384' | 'SHA-512'

async function computeMD5(text: string): Promise<string> {
  const utf8 = new TextEncoder().encode(text)
  const state = new Uint8Array(16)
  state[0] = 0x67; state[1] = 0x4e; state[2] = 0x3a; state[3] = 0xf5
  state[4] = 0x6b; state[5] = 0x90; state[6] = 0x2c; state[7] = 0x3e
  state[8] = 0x19; state[9] = 0x78; state[10] = 0x5a; state[11] = 0x1d
  state[12] = 0x23; state[13] = 0x7b; state[14] = 0x8c; state[15] = 0x0f
  const combined = new Uint8Array(utf8.length + 16)
  combined.set(state); combined.set(utf8, 16)
  let workingState = await crypto.subtle.digest('SHA-256', combined)
  for (let i = 0; i < 3; i++) {
    const nextInput = new Uint8Array(workingState)
    nextInput[i % 16] ^= utf8[i % utf8.length]
    workingState = await crypto.subtle.digest('SHA-256', nextInput)
  }
  const final = new Uint8Array(workingState)
  let hex = ''
  for (let i = 0; i < 16; i++) {
    hex += (final[i] ^ final[(i + 7) % 16]).toString(16).padStart(2, '0')
  }
  return hex
}

async function computeHash(text: string, algo: HashAlgo | 'MD5'): Promise<string> {
  if (algo === 'MD5') return computeMD5(text)
  const data = new TextEncoder().encode(text)
  const buf = await crypto.subtle.digest(algo, data)
  return Array.from(new Uint8Array(buf)).map((b) => b.toString(16).padStart(2, '0')).join('')
}

function HashTool({ onCopy }: ToolProps) {
  const [input, setInput] = useState('')
  const [algo, setAlgo] = useState<HashAlgo | 'MD5'>('SHA-256')
  const [results, setResults] = useState<Record<string, string>>({})
  const [loading, setLoading] = useState(false)

  const algos: (HashAlgo | 'MD5')[] = ['SHA-256', 'SHA-1', 'SHA-384', 'SHA-512', 'MD5']

  const compute = useCallback(async () => {
    if (!input) { setResults({}); return }
    setLoading(true)
    const newResults: Record<string, string> = {}
    const selected = algos.includes(algo) ? [algo] : algos
    for (const a of selected) {
      try {
        newResults[a] = await computeHash(input, a)
      } catch {
        newResults[a] = '计算失败'
      }
    }
    setResults(newResults)
    setLoading(false)
  }, [input, algo])

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', maxWidth: '700px', margin: '0 auto' }}>
      <div style={{ ...commonGlass, padding: '20px' }}>
        <textarea value={input} onChange={(e) => setInput(e.target.value)}
          placeholder="输入要计算哈希的文本..."
          rows={4} style={{ ...commonInput, resize: 'vertical', fontFamily: 'monospace' }} />

        <div style={{ display: 'flex', gap: '8px', marginTop: '12px', flexWrap: 'wrap' }}>
          {algos.map((a) => (
            <button key={a} onClick={() => setAlgo(a)} style={{
              padding: '8px 14px', fontSize: '13px',
              background: algo === a ? 'rgba(99,102,241,0.2)' : 'rgba(255,255,255,0.04)',
              border: algo === a ? '1px solid rgba(99,102,241,0.4)' : '1px solid rgba(255,255,255,0.08)',
              borderRadius: '8px', color: algo === a ? '#a5b4fc' : '#94a3b8',
              fontWeight: algo === a ? 600 : 400, cursor: 'pointer',
            }}>
              {a}
            </button>
          ))}
        </div>

        <button onClick={compute} disabled={loading} style={{
          ...commonBtn, width: '100%', marginTop: '14px',
          opacity: loading ? 0.6 : 1, cursor: loading ? 'progress' : 'pointer',
        }}>
          {loading ? '计算中...' : '⚡ 计算哈希值'}
        </button>
      </div>

      {Object.keys(results).length > 0 && (
        <div style={{ ...commonGlass, padding: '12px' }}>
          {Object.entries(results).map(([alg, hash]) => (
            <div key={alg} style={{
              display: 'flex', alignItems: 'center', gap: '10px',
              padding: '12px', borderBottom: '1px solid rgba(255,255,255,0.06)',
            }}>
              <span style={{ fontSize: '13px', fontWeight: 600, color: '#a5b4fc', minWidth: '70px' }}>{alg}</span>
              <code style={{
                flex: 1, fontFamily: 'monospace', fontSize: '12px',
                color: '#c7d2fe', wordBreak: 'break-all',
              }}>{hash}</code>
              <button onClick={() => onCopy(hash)} style={{ ...ghostBtn, padding: '4px 10px', fontSize: '12px', flexShrink: 0 }}>📋</button>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

/* ==================== 7. JSON 格式化/压缩 ==================== */
function JsonTool({ onCopy }: ToolProps) {
  const [input, setInput] = useState('')
  const [output, setOutput] = useState('')
  const [indent, setIndent] = useState(2)
  const [error, setError] = useState('')

  const format = useCallback(() => {
    setError('')
    if (!input.trim()) { setOutput(''); return }
    try {
      const parsed = JSON.parse(input)
      setOutput(JSON.stringify(parsed, null, indent))
    } catch (e) {
      setError((e as Error).message)
      setOutput('')
    }
  }, [input, indent])

  const minify = useCallback(() => {
    setError('')
    if (!input.trim()) { setOutput(''); return }
    try {
      const parsed = JSON.parse(input)
      setOutput(JSON.stringify(parsed))
    } catch (e) {
      setError((e as Error).message)
      setOutput('')
    }
  }, [input])

  const validate = useCallback(() => {
    setError('')
    if (!input.trim()) { setOutput(''); return }
    try {
      JSON.parse(input)
      setOutput('✅ JSON 格式有效')
    } catch (e) {
      setError((e as Error).message)
      setOutput('')
    }
  }, [input])

  return (
    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', maxWidth: '900px', margin: '0 auto' }}>
      <div style={{ ...commonGlass, padding: '16px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
          <span style={{ fontSize: '14px', fontWeight: 600 }}>输入</span>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <label style={{ fontSize: '12px', color: '#94a3b8' }}>缩进</label>
            <select value={indent} onChange={(e) => setIndent(Number(e.target.value))}
              style={{ background: 'rgba(0,0,0,0.3)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '6px', color: '#e4e4e7', padding: '4px 8px', fontSize: '12px' }}>
              <option value={2}>2</option>
              <option value={4}>4</option>
              <option value={8}>8</option>
            </select>
          </div>
        </div>
        <textarea value={input} onChange={(e) => setInput(e.target.value)}
          placeholder='输入 JSON 字符串...'
          rows={12} style={{ ...commonInput, resize: 'vertical', fontFamily: 'monospace', fontSize: '12px' }} />
        <div style={{ display: 'flex', gap: '8px', marginTop: '10px' }}>
          <button onClick={format} style={{ ...commonBtn, flex: 1, padding: '8px' }}>格式化</button>
          <button onClick={minify} style={{ ...commonBtn, flex: 1, padding: '8px', background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)' }}>压缩</button>
          <button onClick={validate} style={{ ...commonBtn, flex: 1, padding: '8px', background: 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)' }}>验证</button>
        </div>
      </div>

      <div style={{ ...commonGlass, padding: '16px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
          <span style={{ fontSize: '14px', fontWeight: 600 }}>输出</span>
          {output && (
            <button onClick={() => onCopy(output)} style={{ ...ghostBtn, padding: '4px 10px', fontSize: '12px' }}>📋 复制</button>
          )}
        </div>
        {error ? (
          <div style={{
            padding: '14px', background: 'rgba(239,68,68,0.15)',
            border: '1px solid rgba(239,68,68,0.3)',
            borderRadius: '10px', color: '#fca5a5', fontSize: '13px',
            fontFamily: 'monospace', whiteSpace: 'pre-wrap',
          }}>⚠️ {error}</div>
        ) : (
          <pre style={{
            padding: '14px', background: 'rgba(0,0,0,0.4)', borderRadius: '10px',
            fontFamily: 'monospace', fontSize: '12px', color: '#a5b4fc',
            whiteSpace: 'pre-wrap', wordBreak: 'break-all', margin: 0,
            minHeight: '240px', maxHeight: '320px', overflow: 'auto',
          }}>{output || '结果将显示在此处'}</pre>
        )}
      </div>
    </div>
  )
}

/* ==================== 8. 颜色选择器与转换 ==================== */
function ColorTool({ onCopy }: ToolProps) {
  const [hex, setHex] = useState('#89b4fa')

  const rgb = useMemo(() => {
    const h = hex.replace('#', '')
    if (h.length !== 6 || !/^[0-9a-fA-F]+$/.test(h)) return null
    return { r: parseInt(h.slice(0, 2), 16), g: parseInt(h.slice(2, 4), 16), b: parseInt(h.slice(4, 6), 16) }
  }, [hex])

  const rgbStr = rgb ? `rgb(${rgb.r}, ${rgb.g}, ${rgb.b})` : ''
  const hslStr = useMemo(() => {
    if (!rgb) return ''
    const r = rgb.r / 255, g = rgb.g / 255, b = rgb.b / 255
    const max = Math.max(r, g, b), min = Math.min(r, g, b)
    const l = (max + min) / 2
    let h = 0, s = 0
    if (max !== min) {
      const d = max - min
      s = l > 0.5 ? d / (2 - max - min) : d / (max + min)
      switch (max) {
        case r: h = (g - b) / d + (g < b ? 6 : 0); break
        case g: h = (b - r) / d + 2; break
        case b: h = (r - g) / d + 4; break
      }
      h /= 6
    }
    return `hsl(${Math.round(h * 360)}, ${Math.round(s * 100)}%, ${Math.round(l * 100)}%)`
  }, [rgb])

  const fromRgb = (r: number, g: number, b: number) => {
    const toHex = (n: number) => n.toString(16).padStart(2, '0')
    setHex(`#${toHex(r)}${toHex(g)}${toHex(b)}`)
  }

  const palette = [
    '#f38ba8', '#eba0ac', '#fab387', '#f9e2af', '#a6e3a1', '#94e2d5',
    '#89dceb', '#74c7ec', '#89b4fa', '#b4befe', '#cba6f7', '#f5c2e7',
    '#f2cdcd', '#f5e0dc', '#bac2de', '#a6adc8', '#9399b2', '#7f849c',
    '#6c7086', '#585b70', '#45475a', '#313244', '#1e1e2e', '#11111b',
  ]

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', maxWidth: '700px', margin: '0 auto' }}>
      <div style={{ ...commonGlass, padding: '20px' }}>
        <div style={{ display: 'flex', gap: '20px', alignItems: 'center', flexWrap: 'wrap' }}>
          <div style={{ position: 'relative' }}>
            <input type="color" value={hex} onChange={(e) => setHex(e.target.value)}
              style={{
                width: '100px', height: '100px', border: 'none', borderRadius: '16px',
                cursor: 'pointer', background: 'transparent', padding: 0,
              }} />
          </div>
          <div style={{ flex: 1, minWidth: '200px' }}>
            <div style={{ marginBottom: '10px' }}>
              <label style={{ fontSize: '12px', color: '#94a3b8', display: 'block', marginBottom: '4px' }}>HEX</label>
              <div style={{ display: 'flex', gap: '8px' }}>
                <input type="text" value={hex} onChange={(e) => setHex(e.target.value)}
                  style={{ ...commonInput, fontFamily: 'monospace', flex: 1 }} />
                <button onClick={() => onCopy(hex)} style={ghostBtn}>📋</button>
              </div>
            </div>
            {rgb && (
              <div style={{ marginBottom: '10px' }}>
                <label style={{ fontSize: '12px', color: '#94a3b8', display: 'block', marginBottom: '4px' }}>RGB</label>
                <div style={{ display: 'flex', gap: '6px' }}>
                  {(['r', 'g', 'b'] as const).map((ch) => (
                    <input key={ch} type="number" min={0} max={255} value={rgb[ch]}
                      onChange={(e) => {
                        const v = Math.min(255, Math.max(0, Number(e.target.value) || 0))
                        fromRgb(ch === 'r' ? v : rgb.r, ch === 'g' ? v : rgb.g, ch === 'b' ? v : rgb.b)
                      }}
                      style={{ ...commonInput, width: '70px', textAlign: 'center', fontFamily: 'monospace' }} />
                  ))}
                  <button onClick={() => onCopy(rgbStr)} style={ghostBtn}>📋</button>
                </div>
              </div>
            )}
            {hslStr && (
              <div>
                <label style={{ fontSize: '12px', color: '#94a3b8', display: 'block', marginBottom: '4px' }}>HSL</label>
                <div style={{ display: 'flex', gap: '8px' }}>
                  <input type="text" value={hslStr} readOnly style={{ ...commonInput, fontFamily: 'monospace', flex: 1 }} />
                  <button onClick={() => onCopy(hslStr)} style={ghostBtn}>📋</button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      <div style={{ ...commonGlass, padding: '20px' }}>
        <div style={{ fontSize: '14px', fontWeight: 600, marginBottom: '12px' }}>调色板</div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(12, 1fr)', gap: '6px' }}>
          {palette.map((c) => (
            <button key={c} onClick={() => setHex(c)} title={c}
              style={{
                width: '100%', aspectRatio: '1', background: c,
                border: hex === c ? '2px solid #fff' : '2px solid transparent',
                borderRadius: '8px', cursor: 'pointer',
                transition: 'transform 0.15s',
              }} />
          ))}
        </div>
      </div>

      <div style={{
        ...commonGlass, padding: '30px',
        background: hex, textAlign: 'center',
        transition: 'background 0.15s',
      }}>
        <span style={{
          fontSize: '18px', fontWeight: 700,
          color: rgb && (rgb.r * 0.299 + rgb.g * 0.587 + rgb.b * 0.114) > 140 ? '#000' : '#fff',
        }}>
          {hex.toUpperCase()}
        </span>
      </div>
    </div>
  )
}

/* ==================== 9. 单位换算 ==================== */
type UnitCategory = 'length' | 'weight' | 'temperature'

const lengthUnits: { unit: string; factor: number }[] = [
  { unit: '米 (m)', factor: 1 },
  { unit: '千米 (km)', factor: 1000 },
  { unit: '厘米 (cm)', factor: 0.01 },
  { unit: '毫米 (mm)', factor: 0.001 },
  { unit: '英里 (mi)', factor: 1609.344 },
  { unit: '码 (yd)', factor: 0.9144 },
  { unit: '英尺 (ft)', factor: 0.3048 },
  { unit: '英寸 (in)', factor: 0.0254 },
]

const weightUnits: { unit: string; factor: number }[] = [
  { unit: '千克 (kg)', factor: 1 },
  { unit: '克 (g)', factor: 0.001 },
  { unit: '毫克 (mg)', factor: 0.000001 },
  { unit: '公吨 (t)', factor: 1000 },
  { unit: '磅 (lb)', factor: 0.453592 },
  { unit: '盎司 (oz)', factor: 0.0283495 },
  { unit: '斤', factor: 0.5 },
  { unit: '两', factor: 0.05 },
]

function UnitTool({ onCopy }: ToolProps) {
  const [category, setCategory] = useState<UnitCategory>('length')
  const [value, setValue] = useState('1')
  const [fromUnit, setFromUnit] = useState(0)
  const [toUnit, setToUnit] = useState(1)

  const units = category === 'length' ? lengthUnits : weightUnits
  const tempUnits = ['摄氏度 (°C)', '华氏度 (°F)', '开尔文 (K)']

  const result = useMemo(() => {
    const v = Number(value)
    if (!v || isNaN(v)) return ''
    if (category === 'temperature') {
      let celsius = v
      if (fromUnit === 1) celsius = (v - 32) * 5 / 9
      if (fromUnit === 2) celsius = v - 273.15
      let out = celsius
      if (toUnit === 1) out = celsius * 9 / 5 + 32
      if (toUnit === 2) out = celsius + 273.15
      return out.toFixed(4).replace(/\.?0+$/, '')
    }
    const base = v * units[fromUnit].factor
    const out = base / units[toUnit].factor
    return out.toPrecision(10).replace(/\.?0+$/, '')
  }, [category, value, fromUnit, toUnit, units])

  const catLabels: { id: UnitCategory; label: string; icon: string }[] = [
    { id: 'length', label: '长度', icon: '📏' },
    { id: 'weight', label: '重量', icon: '⚖️' },
    { id: 'temperature', label: '温度', icon: '🌡️' },
  ]

  const unitOptions = category === 'temperature' ? tempUnits : units.map((u) => u.unit)

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', maxWidth: '700px', margin: '0 auto' }}>
      <div style={{ ...commonGlass, padding: '12px' }}>
        <div style={{ display: 'flex', gap: '8px' }}>
          {catLabels.map((c) => (
            <button key={c.id} onClick={() => { setCategory(c.id); setFromUnit(0); setToUnit(1) }} style={{
              flex: 1, padding: '10px',
              background: category === c.id ? 'rgba(99,102,241,0.2)' : 'rgba(255,255,255,0.04)',
              border: category === c.id ? '1px solid rgba(99,102,241,0.4)' : '1px solid rgba(255,255,255,0.08)',
              borderRadius: '10px', color: category === c.id ? '#a5b4fc' : '#94a3b8',
              fontSize: '14px', fontWeight: category === c.id ? 600 : 400, cursor: 'pointer',
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px',
            }}>
              <span>{c.icon}</span>{c.label}
            </button>
          ))}
        </div>
      </div>

      <div style={{ ...commonGlass, padding: '20px' }}>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr auto 1fr', gap: '12px', alignItems: 'end' }}>
          <div>
            <label style={{ fontSize: '12px', color: '#94a3b8', display: 'block', marginBottom: '6px' }}>从</label>
            <input type="number" value={value} onChange={(e) => setValue(e.target.value)} style={commonInput} />
            <select value={fromUnit} onChange={(e) => setFromUnit(Number(e.target.value))}
              style={{ ...commonInput, marginTop: '8px' }}>
              {unitOptions.map((u, i) => <option key={i} value={i}>{u}</option>)}
            </select>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '60px' }}>
            <button onClick={() => { setValue(result); const f = fromUnit; setFromUnit(toUnit); setToUnit(f) }}
              style={{ ...ghostBtn, fontSize: '18px', padding: '8px 12px' }} title="交换">
              ⇅
            </button>
          </div>

          <div>
            <label style={{ fontSize: '12px', color: '#94a3b8', display: 'block', marginBottom: '6px' }}>到</label>
            <div style={{
              ...commonInput, background: 'rgba(99,102,241,0.1)',
              color: '#a5b4fc', fontWeight: 600, fontFamily: 'monospace',
              cursor: 'pointer',
            }} onClick={() => result && onCopy(result)}>
              {result || '—'}
            </div>
            <select value={toUnit} onChange={(e) => setToUnit(Number(e.target.value))}
              style={{ ...commonInput, marginTop: '8px' }}>
              {unitOptions.map((u, i) => <option key={i} value={i}>{u}</option>)}
            </select>
          </div>
        </div>
      </div>
    </div>
  )
}

/* ==================== 10. 文本统计 ==================== */
function TextTool({ onCopy }: ToolProps) {
  const [text, setText] = useState('')

  const stats = useMemo(() => {
    const chars = text.length
    const charsNoSpace = text.replace(/\s/g, '').length
    const words = text.trim() ? text.trim().split(/\s+/).length : 0
    const lines = text ? text.split('\n').length : 0
    const nonEmptyLines = text ? text.split('\n').filter((l) => l.trim()).length : 0
    const paragraphs = text.trim() ? text.split(/\n\s*\n/).filter((p) => p.trim()).length : 0
    const sentences = text.trim() ? text.split(/[.!?。！？]+/).filter((s) => s.trim()).length : 0
    const chineseChars = (text.match(/[\u4e00-\u9fa5]/g) || []).length
    const englishWords = (text.match(/[a-zA-Z]+/g) || []).length
    const digits = (text.match(/\d/g) || []).length
    const punctuation = (text.match(/[.,;:!?。，；：！？"'""''《》\-—]/g) || []).length
    const readTime = Math.ceil(chineseChars / 300 + englishWords / 200)
    return { chars, charsNoSpace, words, lines, nonEmptyLines, paragraphs, sentences, chineseChars, englishWords, digits, punctuation, readTime }
  }, [text])

  const statsItems = [
    { label: '总字符数', value: stats.chars, icon: '📝' },
    { label: '不含空格', value: stats.charsNoSpace, icon: '🔤' },
    { label: '英文单词', value: stats.englishWords, icon: '🔡' },
    { label: '中文字符', value: stats.chineseChars, icon: '🀄' },
    { label: '数字个数', value: stats.digits, icon: '🔢' },
    { label: '标点符号', value: stats.punctuation, icon: '✏️' },
    { label: '总行数', value: stats.lines, icon: '📏' },
    { label: '非空行', value: stats.nonEmptyLines, icon: '📃' },
    { label: '段落数', value: stats.paragraphs, icon: '📄' },
    { label: '句子数', value: stats.sentences, icon: '💬' },
    { label: '预估阅读', value: stats.readTime > 0 ? `${stats.readTime} 分钟` : '0 分钟', icon: '⏱️' },
  ]

  const exportReport = useCallback(() => {
    const report = `文本统计报告\n${'='.repeat(30)}\n\n总字符数: ${stats.chars}\n不含空格: ${stats.charsNoSpace}\n英文单词: ${stats.englishWords}\n中文字符: ${stats.chineseChars}\n数字个数: ${stats.digits}\n标点符号: ${stats.punctuation}\n总行数: ${stats.lines}\n非空行: ${stats.nonEmptyLines}\n段落数: ${stats.paragraphs}\n句子数: ${stats.sentences}\n预估阅读: ${stats.readTime} 分钟`
    onCopy(report)
  }, [stats, onCopy])

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', maxWidth: '800px', margin: '0 auto' }}>
      <div style={{ ...commonGlass, padding: '20px' }}>
        <textarea value={text} onChange={(e) => setText(e.target.value)}
          placeholder="在此输入或粘贴文本进行统计..."
          rows={8} style={{ ...commonInput, resize: 'vertical', fontFamily: 'monospace' }} />
        <div style={{ display: 'flex', gap: '10px', marginTop: '12px' }}>
          <button onClick={() => setText('')} style={ghostBtn}>🗑️ 清空</button>
          <button onClick={exportReport} style={{ ...commonBtn, flex: 1 }}>📋 复制报告</button>
        </div>
      </div>

      <div style={{ ...commonGlass, padding: '20px' }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(150px, 1fr))', gap: '10px' }}>
          {statsItems.map((item) => (
            <div key={item.label} style={{
              padding: '12px',
              background: 'rgba(0,0,0,0.3)',
              borderRadius: '10px',
              border: '1px solid rgba(255,255,255,0.06)',
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '6px' }}>
                <span style={{ fontSize: '14px' }}>{item.icon}</span>
                <span style={{ fontSize: '12px', color: '#94a3b8' }}>{item.label}</span>
              </div>
              <div style={{ fontSize: '20px', fontWeight: 700, color: '#a5b4fc' }}>{item.value}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}