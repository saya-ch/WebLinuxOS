import { useState, useCallback } from 'react'
import {
  Palette, KeyRound, Hash, Clock, Braces, Copy, Check,
  Link, Lock, Shield, Eye, EyeOff,
} from './Shared'
import { type ToolProps, ToolHeader, inputStyle, labelStyle, primaryBtnStyle, ghostBtnStyle } from './Shared'

function hexToRgb(h: string) {
  const m = h.replace('#', '')
  if (!/^[0-9A-Fa-f]{6}$/.test(m)) return null
  return { r: parseInt(m.slice(0, 2), 16), g: parseInt(m.slice(2, 4), 16), b: parseInt(m.slice(4, 6), 16) }
}
function rgbToHex(r: number, g: number, b: number) {
  if ([r, g, b].some((v) => isNaN(v) || v < 0 || v > 255)) return null
  return '#' + [r, g, b].map((v) => v.toString(16).padStart(2, '0')).join('')
}
function rgbToHsl(r: number, g: number, b: number) {
  r /= 255; g /= 255; b /= 255
  const max = Math.max(r, g, b), min = Math.min(r, g, b)
  let h = 0, s = 0, l = (max + min) / 2
  if (max !== min) {
    const d = max - min
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min)
    switch (max) {
      case r: h = ((g - b) / d + (g < b ? 6 : 0)) / 6; break
      case g: h = ((b - r) / d + 2) / 6; break
      case b: h = ((r - g) / d + 4) / 6; break
    }
  }
  return { h: Math.round(h * 360), s: Math.round(s * 100), l: Math.round(l * 100) }
}
function rgbToCmyk(r: number, g: number, b: number) {
  const rn = r / 255, gn = g / 255, bn = b / 255
  const k = 1 - Math.max(rn, gn, bn)
  if (k === 1) return { c: 0, m: 0, y: 0, k: 100 }
  const c = (1 - rn - k) / (1 - k)
  const m = (1 - gn - k) / (1 - k)
  const y = (1 - bn - k) / (1 - k)
  return { c: Math.round(c * 100), m: Math.round(m * 100), y: Math.round(y * 100), k: Math.round(k * 100) }
}

export function ColorTool({ onAddHistory, onCopy: _onCopy }: ToolProps) {
  const [hex, setHex] = useState('#8b7cf0')
  const [rgbInput, setRgbInput] = useState('139, 124, 240')
  const [copiedField, setCopiedField] = useState<string | null>(null)

  const handleHexChange = (v: string) => {
    setHex(v)
    const rgb = hexToRgb(v)
    if (rgb) setRgbInput(`${rgb.r}, ${rgb.g}, ${rgb.b}`)
  }
  const handleRgbChange = (v: string) => {
    setRgbInput(v)
    const parts = v.split(',').map((s) => parseInt(s.trim()))
    if (parts.length === 3) {
      const h = rgbToHex(parts[0], parts[1], parts[2])
      if (h) setHex(h)
    }
  }

  const rgb = hexToRgb(hex)
  const hsl = rgb ? rgbToHsl(rgb.r, rgb.g, rgb.b) : null
  const cmyk = rgb ? rgbToCmyk(rgb.r, rgb.g, rgb.b) : null

  const copyField = (field: string, value: string) => {
    navigator.clipboard.writeText(value)
    setCopiedField(field)
    setTimeout(() => setCopiedField(null), 1500)
    onAddHistory('color', hex, value)
  }

  const presets = ['#ef4444', '#f59e0b', '#10b981', '#3b82f6', '#8b5cf6', '#ec4899', '#06b6d4', '#f97316']

  return (
    <div style={{ maxWidth: 600, margin: '0 auto' }}>
      <ToolHeader icon={<Palette size={20} style={{ color: '#c084fc' }} />} title="颜色转换" subtitle="HEX / RGB / HSL / CMYK 互转工具" />

      <div style={{ display: 'flex', gap: 20, alignItems: 'flex-start', flexWrap: 'wrap' }}>
        <div style={{
          width: 160, height: 160, borderRadius: 20, background: hex,
          border: '2px solid var(--window-border)', boxShadow: '0 8px 24px rgba(0,0,0,0.15)',
        }} />

        <div style={{ flex: 1, minWidth: 240, display: 'flex', flexDirection: 'column', gap: 14 }}>
          <div>
            <label style={labelStyle}>HEX</label>
            <div style={{ display: 'flex', gap: 8 }}>
              <input type="color" value={hex} onChange={(e) => handleHexChange(e.target.value)} style={{ width: 44, height: 36, border: 'none', borderRadius: 8, cursor: 'pointer', padding: 0 }} />
              <input value={hex} onChange={(e) => handleHexChange(e.target.value)} style={{ ...inputStyle, fontFamily: 'monospace' }} />
              <button onClick={() => copyField('hex', hex)} style={iconBtnStyle}>
                {copiedField === 'hex' ? <Check size={14} /> : <Copy size={14} />}
              </button>
            </div>
          </div>

          <div>
            <label style={labelStyle}>RGB</label>
            <div style={{ display: 'flex', gap: 8 }}>
              <input value={rgbInput} onChange={(e) => handleRgbChange(e.target.value)} placeholder="R, G, B" style={{ ...inputStyle, fontFamily: 'monospace' }} />
              {rgb && <button onClick={() => copyField('rgb', `rgb(${rgb.r}, ${rgb.g}, ${rgb.b})`)} style={iconBtnStyle}>
                {copiedField === 'rgb' ? <Check size={14} /> : <Copy size={14} />}
              </button>}
            </div>
          </div>

          {hsl && (
            <div>
              <label style={labelStyle}>HSL</label>
              <div style={{ display: 'flex', gap: 8 }}>
                <input readOnly value={`hsl(${hsl.h}, ${hsl.s}%, ${hsl.l}%)`} style={{ ...inputStyle, fontFamily: 'monospace' }} />
                <button onClick={() => copyField('hsl', `hsl(${hsl.h}, ${hsl.s}%, ${hsl.l}%)`)} style={iconBtnStyle}>
                  {copiedField === 'hsl' ? <Check size={14} /> : <Copy size={14} />}
                </button>
              </div>
            </div>
          )}

          {cmyk && (
            <div>
              <label style={labelStyle}>CMYK</label>
              <div style={{ display: 'flex', gap: 8 }}>
                <input readOnly value={`cmyk(${cmyk.c}%, ${cmyk.m}%, ${cmyk.y}%, ${cmyk.k}%)`} style={{ ...inputStyle, fontFamily: 'monospace' }} />
                <button onClick={() => copyField('cmyk', `cmyk(${cmyk.c}%, ${cmyk.m}%, ${cmyk.y}%, ${cmyk.k}%)`)} style={iconBtnStyle}>
                  {copiedField === 'cmyk' ? <Check size={14} /> : <Copy size={14} />}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      <div style={{ marginTop: 20 }}>
        <label style={labelStyle}>预设颜色</label>
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          {presets.map((c) => (
            <button key={c} onClick={() => handleHexChange(c)} title={c} style={{
              width: 36, height: 36, borderRadius: 8, background: c,
              border: hex === c ? '2px solid var(--accent)' : '2px solid var(--window-border)',
              cursor: 'pointer', padding: 0,
            }} />
          ))}
        </div>
      </div>
    </div>
  )
}

const iconBtnStyle: React.CSSProperties = {
  padding: '0 10px', borderRadius: 8,
  background: 'var(--glass-bg)', border: '1px solid var(--window-border)',
  color: 'var(--text-secondary)', cursor: 'pointer',
  display: 'flex', alignItems: 'center',
}

export function URLTool({ onAddHistory, onCopy }: ToolProps) {
  const [input, setInput] = useState('')
  const [output, setOutput] = useState('')
  const [mode, setMode] = useState<'encode' | 'decode' | 'parse'>('encode')
  const [parsed, setParsed] = useState<Record<string, string> | null>(null)

  const process = useCallback(() => {
    try {
      if (mode === 'encode') {
        setOutput(encodeURIComponent(input))
        setParsed(null)
      } else if (mode === 'decode') {
        setOutput(decodeURIComponent(input))
        setParsed(null)
      } else {
        try {
          const u = new URL(input)
          const params: Record<string, string> = {}
          u.searchParams.forEach((v, k) => { params[k] = v })
          setParsed({
            协议: u.protocol,
            主机: u.hostname,
            端口: u.port || '(默认)',
            路径: u.pathname,
            查询: u.search,
            哈希: u.hash,
            用户名: u.username,
            密码: u.password,
          })
          setOutput('解析成功')
        } catch {
          setOutput('无效的 URL 格式')
          setParsed(null)
        }
      }
      onAddHistory('url', `${mode}: ${input.slice(0, 50)}`, output.slice(0, 50))
    } catch {
      setOutput('错误：处理失败，请检查输入格式')
      setParsed(null)
    }
  }, [input, mode, onAddHistory, output])

  return (
    <div style={{ maxWidth: 700, margin: '0 auto' }}>
      <ToolHeader icon={<Link size={20} style={{ color: '#38bdf8' }} />} title="URL 编解码与解析" subtitle="URL 编码、解码和结构化解析" />

      <div style={{ display: 'flex', gap: 4, marginBottom: 12 }}>
        {(['encode', 'decode', 'parse'] as const).map((m) => (
          <button key={m} onClick={() => { setMode(m); setOutput(''); setParsed(null) }} style={{
            flex: 1, padding: '8px 12px', borderRadius: 8,
            background: mode === m ? 'var(--accent-bg)' : 'var(--glass-bg)',
            border: mode === m ? '1px solid var(--accent)' : '1px solid var(--window-border)',
            color: mode === m ? 'var(--accent)' : 'var(--text-secondary)',
            cursor: 'pointer', fontSize: 13,
          }}>
            {m === 'encode' ? '编码' : m === 'decode' ? '解码' : '解析'}
          </button>
        ))}
      </div>

      <div style={{ marginBottom: 12 }}>
        <label style={labelStyle}>{mode === 'encode' ? '原始文本' : mode === 'decode' ? 'URL 编码文本' : 'URL'}</label>
        <textarea value={input} onChange={(e) => setInput(e.target.value)}
          placeholder={mode === 'encode' ? '输入要编码的文本...' : mode === 'decode' ? '输入要解码的 URL 编码字符串...' : '输入完整的 URL (https://example.com/path?query=1)...'}
          style={{ ...inputStyle, minHeight: 90, fontFamily: 'monospace', resize: 'vertical' }}
        />
      </div>

      <button onClick={process} disabled={!input} style={{
        ...primaryBtnStyle, width: '100%', marginBottom: 12,
        opacity: !input ? 0.5 : 1, cursor: !input ? 'not-allowed' : 'pointer',
      }}>
        {mode === 'encode' ? '编码' : mode === 'decode' ? '解码' : '解析 URL'}
      </button>

      {output && !parsed && (
        <div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
            <label style={labelStyle}>结果</label>
            <button onClick={() => onCopy(output, '已复制')} style={ghostBtnStyle}>
              <Copy size={12} /> 复制
            </button>
          </div>
          <textarea readOnly value={output}
            style={{ ...inputStyle, minHeight: 80, fontFamily: 'monospace', resize: 'vertical' }}
          />
        </div>
      )}

      {parsed && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          <label style={labelStyle}>解析结果</label>
          {Object.entries(parsed).map(([k, v]) => (
            <div key={k} style={{
              padding: '10px 14px', borderRadius: 8,
              background: 'var(--glass-bg)', border: '1px solid var(--window-border)',
              display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 12,
            }}>
              <span style={{ fontSize: 12, color: 'var(--text-secondary)', minWidth: 60 }}>{k}</span>
              <code style={{ flex: 1, fontSize: 12, fontFamily: 'monospace', wordBreak: 'break-all' }}>{v || '—'}</code>
              <button onClick={() => onCopy(v)} style={iconBtnStyle}>
                <Copy size={12} />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

export function PasswordTool({ onAddHistory, onCopy }: ToolProps) {
  const [length, setLength] = useState(16)
  const [useUpper, setUseUpper] = useState(true)
  const [useLower, setUseLower] = useState(true)
  const [useNumbers, setUseNumbers] = useState(true)
  const [useSymbols, setUseSymbols] = useState(true)
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)

  const generate = useCallback(() => {
    const upper = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'
    const lower = 'abcdefghijklmnopqrstuvwxyz'
    const numbers = '0123456789'
    const symbols = '!@#$%^&*()_+-=[]{}|;:,.<>?'

    let chars = ''
    if (useUpper) chars += upper
    if (useLower) chars += lower
    if (useNumbers) chars += numbers
    if (useSymbols) chars += symbols

    if (!chars) { setPassword('请至少选择一种字符类型'); return }

    const arr = new Uint32Array(length)
    crypto.getRandomValues(arr)
    let pwd = ''
    for (let i = 0; i < length; i++) {
      pwd += chars[arr[i] % chars.length]
    }
    setPassword(pwd)
    onAddHistory('password', `生成${length}位密码`, pwd)
  }, [length, useUpper, useLower, useNumbers, useSymbols, onAddHistory])

  const checkStrength = (pwd: string): { score: number; label: string; color: string } => {
    if (!pwd) return { score: 0, label: '—', color: 'var(--text-secondary)' }
    let score = 0
    if (pwd.length >= 8) score++
    if (pwd.length >= 12) score++
    if (pwd.length >= 16) score++
    if (/[a-z]/.test(pwd) && /[A-Z]/.test(pwd)) score++
    if (/[0-9]/.test(pwd)) score++
    if (/[^a-zA-Z0-9]/.test(pwd)) score++

    if (score <= 2) return { score: 1, label: '弱', color: '#ef4444' }
    if (score <= 3) return { score: 2, label: '中等', color: '#f59e0b' }
    if (score <= 4) return { score: 3, label: '强', color: '#10b981' }
    return { score: 4, label: '非常强', color: '#3b82f6' }
  }

  const strength = checkStrength(password)

  return (
    <div style={{ maxWidth: 600, margin: '0 auto' }}>
      <ToolHeader icon={<Lock size={20} style={{ color: '#f472b6' }} />} title="密码生成器" subtitle="生成安全的随机密码并检测强度" />

      <div style={{ marginBottom: 16 }}>
        <label style={labelStyle}>密码长度: <span style={{ color: 'var(--accent)', fontWeight: 600 }}>{length}</span></label>
        <input type="range" min={4} max={64} value={length} onChange={(e) => setLength(Number(e.target.value))} style={{ width: '100%', accentColor: 'var(--accent)' }} />
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 16 }}>
        {[
          { key: 'upper', label: '大写字母 (A-Z)', state: useUpper, setter: setUseUpper },
          { key: 'lower', label: '小写字母 (a-z)', state: useLower, setter: setUseLower },
          { key: 'numbers', label: '数字 (0-9)', state: useNumbers, setter: setUseNumbers },
          { key: 'symbols', label: '特殊符号 (!@#$)', state: useSymbols, setter: setUseSymbols },
        ].map(({ label, state, setter }) => (
          <label key={label} style={{
            padding: '10px 14px', borderRadius: 8, cursor: 'pointer',
            background: state ? 'var(--accent-bg)' : 'var(--glass-bg)',
            border: state ? '1px solid var(--accent)' : '1px solid var(--window-border)',
            display: 'flex', alignItems: 'center', gap: 8, fontSize: 13,
          }}>
            <input type="checkbox" checked={state} onChange={(e) => setter(e.target.checked)} style={{ accentColor: 'var(--accent)' }} />
            {label}
          </label>
        ))}
      </div>

      <button onClick={generate} style={{ ...primaryBtnStyle, marginBottom: 16 }}>
        <KeyRound size={16} /> 生成密码
      </button>

      {password && (
        <div style={{ background: 'var(--glass-bg)', border: '1px solid var(--window-border)', borderRadius: 12, padding: 16 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
            <label style={labelStyle}>{showPassword ? '生成的密码' : '生成的密码 (已隐藏)'}</label>
            <button onClick={() => setShowPassword(!showPassword)} style={iconBtnStyle}>
              {showPassword ? <EyeOff size={14} /> : <Eye size={14} />}
            </button>
            <button onClick={() => onCopy(password, '密码已复制')} style={iconBtnStyle}>
              <Copy size={14} />
            </button>
          </div>
          <div style={{
            padding: '12px 14px', borderRadius: 8, background: 'var(--window-bg)',
            fontFamily: 'monospace', fontSize: 14, wordBreak: 'break-all',
            color: 'var(--accent)', textAlign: 'center', letterSpacing: 1,
          }}>
            {showPassword ? password : '•'.repeat(Math.min(password.length, 24))}
          </div>

          <div style={{ marginTop: 12 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
              <span style={{ fontSize: 12, color: 'var(--text-secondary)' }}>密码强度</span>
              <span style={{ fontSize: 12, fontWeight: 600, color: strength.color }}>{strength.label}</span>
            </div>
            <div style={{ display: 'flex', gap: 4 }}>
              {[1, 2, 3, 4].map((i) => (
                <div key={i} style={{
                  flex: 1, height: 6, borderRadius: 3,
                  background: i <= strength.score ? strength.color : 'var(--window-border)',
                  transition: 'background 0.3s',
                }} />
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

function md5(input: string): string {
  function safeAdd(x: number, y: number): number {
    const lsw = (x & 0xffff) + (y & 0xffff)
    const msw = (x >> 16) + (y >> 16) + (lsw >> 16)
    return (msw << 16) | (lsw & 0xffff)
  }
  function rol(num: number, cnt: number): number {
    return (num << cnt) | (num >>> (32 - cnt))
  }
  function cmn(q: number, a: number, b: number, x: number, s: number, t: number): number {
    return safeAdd(rol(safeAdd(safeAdd(a, q), safeAdd(x, t)), s), b)
  }
  function ff(a: number, b: number, c: number, d: number, x: number, s: number, t: number): number {
    return cmn((b & c) | ((~b) & d), a, b, x, s, t)
  }
  function gg(a: number, b: number, c: number, d: number, x: number, s: number, t: number): number {
    return cmn((b & d) | (c & (~d)), a, b, x, s, t)
  }
  function hh(a: number, b: number, c: number, d: number, x: number, s: number, t: number): number {
    return cmn(b ^ c ^ d, a, b, x, s, t)
  }
  function ii(a: number, b: number, c: number, d: number, x: number, s: number, t: number): number {
    return cmn(c ^ (b | (~d)), a, b, x, s, t)
  }
  function md5cycle(x: number[], k: number[]): void {
    let [a, b, c, d] = x
    a = ff(a, b, c, d, k[0], 7, -680876936); d = ff(d, a, b, c, k[1], 12, -389564586)
    c = ff(c, d, a, b, k[2], 17, 606105819); b = ff(b, c, d, a, k[3], 22, -1044525330)
    a = ff(a, b, c, d, k[4], 7, -176418897); d = ff(d, a, b, c, k[5], 12, 1200080426)
    c = ff(c, d, a, b, k[6], 17, -1473231341); b = ff(b, c, d, a, k[7], 22, -45705983)
    a = ff(a, b, c, d, k[8], 7, 1770035416); d = ff(d, a, b, c, k[9], 12, -1958414417)
    c = ff(c, d, a, b, k[10], 17, -42063); b = ff(b, c, d, a, k[11], 22, -1990404162)
    a = ff(a, b, c, d, k[12], 7, 1804603682); d = ff(d, a, b, c, k[13], 12, -40341101)
    c = ff(c, d, a, b, k[14], 17, -1502002290); b = ff(b, c, d, a, k[15], 22, 1236535329)
    a = gg(a, b, c, d, k[1], 5, -165796510); d = gg(d, a, b, c, k[6], 9, -1069501632)
    c = gg(c, d, a, b, k[11], 14, 643717713); b = gg(b, c, d, a, k[0], 20, -373897302)
    a = gg(a, b, c, d, k[5], 5, -701558691); d = gg(d, a, b, c, k[10], 9, 38016083)
    c = gg(c, d, a, b, k[15], 14, -660478335); b = gg(b, c, d, a, k[4], 20, -405537848)
    a = gg(a, b, c, d, k[9], 5, 568446438); d = gg(d, a, b, c, k[14], 9, -1019803690)
    c = gg(c, d, a, b, k[3], 14, -187363961); b = gg(b, c, d, a, k[8], 20, 1163531501)
    a = gg(a, b, c, d, k[13], 5, -1444681467); d = gg(d, a, b, c, k[2], 9, -51403784)
    c = gg(c, d, a, b, k[7], 14, 1735328473); b = gg(b, c, d, a, k[12], 20, -1926607734)
    a = hh(a, b, c, d, k[5], 4, -378558); d = hh(d, a, b, c, k[8], 11, -2022574463)
    c = hh(c, d, a, b, k[11], 16, 1839030562); b = hh(b, c, d, a, k[14], 23, -35309556)
    a = hh(a, b, c, d, k[1], 4, -1530992060); d = hh(d, a, b, c, k[4], 11, 1272893353)
    c = hh(c, d, a, b, k[7], 16, -155497632); b = hh(b, c, d, a, k[10], 23, -1094730640)
    a = hh(a, b, c, d, k[13], 4, 681279174); d = hh(d, a, b, c, k[0], 11, -358537222)
    c = hh(c, d, a, b, k[3], 16, -722521979); b = hh(b, c, d, a, k[6], 23, 76029189)
    a = hh(a, b, c, d, k[9], 4, -640364487); d = hh(d, a, b, c, k[12], 11, -421815835)
    c = hh(c, d, a, b, k[15], 16, 530742520); b = hh(b, c, d, a, k[2], 23, -995338651)
    a = ii(a, b, c, d, k[0], 6, -198630844); d = ii(d, a, b, c, k[7], 10, 1126891415)
    c = ii(c, d, a, b, k[14], 15, -1416354905); b = ii(b, c, d, a, k[5], 21, -57434055)
    a = ii(a, b, c, d, k[12], 6, 1700485571); d = ii(d, a, b, c, k[3], 10, -1894986606)
    c = ii(c, d, a, b, k[10], 15, -1051523); b = ii(b, c, d, a, k[1], 21, -2054922799)
    a = ii(a, b, c, d, k[8], 6, 1873313359); d = ii(d, a, b, c, k[15], 10, -30611744)
    c = ii(c, d, a, b, k[6], 15, -1560198380); b = ii(b, c, d, a, k[13], 21, 1309151649)
    a = ii(a, b, c, d, k[4], 6, -145523070); d = ii(d, a, b, c, k[11], 10, -1120210379)
    c = ii(c, d, a, b, k[2], 15, 718787259); b = ii(b, c, d, a, k[9], 21, -343485551)
    x[0] = safeAdd(a, x[0]); x[1] = safeAdd(b, x[1]); x[2] = safeAdd(c, x[2]); x[3] = safeAdd(d, x[3])
  }
  function md5blk(s: string): number[] {
    const md5blks: number[] = []
    for (let i = 0; i < 64; i += 4) {
      md5blks[i >> 2] = s.charCodeAt(i) + (s.charCodeAt(i + 1) << 8) + (s.charCodeAt(i + 2) << 16) + (s.charCodeAt(i + 3) << 24)
    }
    return md5blks
  }
  function md51(s: string): number[] {
    const n = s.length
    const state = [1732584193, -271733879, -1732584194, 271733878]
    let i: number
    for (i = 64; i <= n; i += 64) {
      md5cycle(state, md5blk(s.substring(i - 64, i)))
    }
    const tail = [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0]
    const sRest = s.substring(i - 64)
    let j: number
    for (j = 0; j < sRest.length; j++) {
      tail[j >> 2] |= sRest.charCodeAt(j) << ((j % 4) << 3)
    }
    tail[j >> 2] |= 0x80 << ((j % 4) << 3)
    if (j > 55) {
      md5cycle(state, tail)
      for (let k = 0; k < 16; k++) tail[k] = 0
    }
    tail[14] = n * 8
    md5cycle(state, tail)
    return state
  }
  function rhex(n: number): string {
    const hexChr = '0123456789abcdef'
    let s = ''
    for (let j = 0; j < 4; j++) {
      s += hexChr.charAt((n >> (j * 8 + 4)) & 0x0F) + hexChr.charAt((n >> (j * 8)) & 0x0F)
    }
    return s
  }
  function hex(x: number[]): string {
    return x.map(rhex).join('')
  }
  function str2rstrUTF8(input: string): string {
    return unescape(encodeURIComponent(input))
  }
  return hex(md51(str2rstrUTF8(input)))
}

export function HashTool({ onAddHistory, onCopy }: ToolProps) {
  const [input, setInput] = useState('')
  const [algorithm, setAlgorithm] = useState<'MD5' | 'SHA-1' | 'SHA-256' | 'SHA-384' | 'SHA-512'>('SHA-256')
  const [output, setOutput] = useState('')
  const [loading, setLoading] = useState(false)

  const computeHash = useCallback(async () => {
    if (!input) return
    setLoading(true)
    try {
      if (algorithm === 'MD5') {
        const result = md5(input)
        setOutput(result)
        onAddHistory('hash', `MD5: ${input.slice(0, 30)}`, result)
      } else {
        const encoder = new TextEncoder()
        const data = encoder.encode(input)
        const buffer = await crypto.subtle.digest(algorithm, data)
        const hashArray = Array.from(new Uint8Array(buffer))
        const hashHex = hashArray.map((b) => b.toString(16).padStart(2, '0')).join('')
        setOutput(hashHex)
        onAddHistory('hash', `${algorithm}: ${input.slice(0, 30)}`, hashHex)
      }
    } catch {
      setOutput('哈希计算失败')
    } finally {
      setLoading(false)
    }
  }, [input, algorithm, onAddHistory])

  return (
    <div style={{ maxWidth: 700, margin: '0 auto' }}>
      <ToolHeader icon={<Shield size={20} style={{ color: '#a78bfa' }} />} title="Hash 生成器" subtitle="MD5 / SHA-1 / SHA-256 / SHA-384 / SHA-512 哈希计算" />

      <div style={{ display: 'flex', gap: 4, marginBottom: 12, flexWrap: 'wrap' }}>
        {(['MD5', 'SHA-1', 'SHA-256', 'SHA-384', 'SHA-512'] as const).map((alg) => (
          <button key={alg} onClick={() => { setAlgorithm(alg); setOutput('') }} style={{
            padding: '8px 14px', borderRadius: 8,
            background: algorithm === alg ? 'var(--accent-bg)' : 'var(--glass-bg)',
            border: algorithm === alg ? '1px solid var(--accent)' : '1px solid var(--window-border)',
            color: algorithm === alg ? 'var(--accent)' : 'var(--text-secondary)',
            cursor: 'pointer', fontSize: 13, fontWeight: algorithm === alg ? 600 : 400,
          }}>
            {alg}
          </button>
        ))}
      </div>

      <div style={{ marginBottom: 12 }}>
        <label style={labelStyle}>输入文本</label>
        <textarea value={input} onChange={(e) => setInput(e.target.value)}
          placeholder="输入要计算哈希的文本..."
          style={{ ...inputStyle, minHeight: 100, fontFamily: 'monospace', resize: 'vertical' }}
        />
      </div>

      <button onClick={computeHash} disabled={!input || loading} style={{
        ...primaryBtnStyle, marginBottom: 12,
        opacity: !input || loading ? 0.5 : 1,
        cursor: !input || loading ? 'not-allowed' : 'pointer',
      }}>
        <Hash size={16} /> {loading ? '计算中...' : `计算 ${algorithm}`}
      </button>

      {output && (
        <div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
            <label style={labelStyle}>{algorithm} 结果</label>
            <button onClick={() => onCopy(output, '哈希已复制')} style={ghostBtnStyle}>
              <Copy size={12} /> 复制
            </button>
          </div>
          <textarea readOnly value={output}
            style={{ ...inputStyle, minHeight: 80, fontFamily: 'monospace', fontSize: 12, resize: 'vertical' }}
          />
        </div>
      )}
    </div>
  )
}

export function UUIDTool({ onAddHistory, onCopy: _onCopy }: ToolProps) {
  const [uuids, setUuids] = useState<string[]>([])
  const [count, setCount] = useState(5)
  const [format, setFormat] = useState<'standard' | 'compact' | 'timestamp'>('standard')
  const [copiedIdx, setCopiedIdx] = useState<number | null>(null)

  const generate = useCallback(() => {
    const list: string[] = []
    for (let i = 0; i < count; i++) {
      if (format === 'timestamp') {
        list.push(`${Date.now()}-${Math.random().toString(36).slice(2, 9)}`)
      } else {
        const uuid = crypto.randomUUID?.() ||
          'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
            const r = (Math.random() * 16) | 0
            const v = c === 'x' ? r : (r & 0x3) | 0x8
            return v.toString(16)
          })
        list.push(format === 'compact' ? uuid.replace(/-/g, '') : uuid)
      }
    }
    setUuids(list)
    onAddHistory('uuid', `生成${count}个${format}UUID`, list.join(', '))
  }, [count, format, onAddHistory])

  const copyItem = (text: string, idx: number) => {
    navigator.clipboard.writeText(text)
    setCopiedIdx(idx)
    setTimeout(() => setCopiedIdx(null), 1500)
  }

  return (
    <div style={{ maxWidth: 600, margin: '0 auto' }}>
      <ToolHeader icon={<KeyRound size={20} style={{ color: '#4ade80' }} />} title="UUID 生成器" subtitle="生成符合 RFC 4122 的唯一标识符" />

      <div style={{ display: 'flex', gap: 12, marginBottom: 16, flexWrap: 'wrap', alignItems: 'flex-end' }}>
        <div>
          <label style={labelStyle}>数量 ({count})</label>
          <input type="number" min={1} max={50} value={count}
            onChange={(e) => setCount(Math.min(50, Math.max(1, parseInt(e.target.value) || 1)))}
            style={{ ...inputStyle, width: 80 }}
          />
        </div>
        <div style={{ display: 'flex', gap: 4 }}>
          {(['standard', 'compact', 'timestamp'] as const).map((f) => (
            <button key={f} onClick={() => setFormat(f)} style={{
              padding: '8px 14px', borderRadius: 8,
              background: format === f ? 'var(--accent-bg)' : 'transparent',
              border: format === f ? '1px solid var(--accent)' : '1px solid var(--window-border)',
              color: format === f ? 'var(--accent)' : 'var(--text-secondary)',
              cursor: 'pointer', fontSize: 12,
            }}>
              {f === 'standard' ? '标准' : f === 'compact' ? '紧凑' : '时间戳'}
            </button>
          ))}
        </div>
      </div>

      <button onClick={generate} style={{ ...primaryBtnStyle, marginBottom: 16 }}>
        <KeyRound size={16} /> 生成 UUID
      </button>

      {uuids.length > 0 && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {uuids.map((uuid, i) => (
            <div key={i} style={{
              padding: '10px 14px', borderRadius: 10,
              background: 'var(--glass-bg)', border: '1px solid var(--window-border)',
              display: 'flex', alignItems: 'center', gap: 12,
            }}>
              <code style={{ flex: 1, fontSize: 13, fontFamily: 'monospace', wordBreak: 'break-all' }}>{uuid}</code>
              <button onClick={() => copyItem(uuid, i)} style={{
                padding: '6px 10px', borderRadius: 6,
                background: copiedIdx === i ? 'rgba(16, 185, 129, 0.15)' : 'transparent',
                border: '1px solid var(--window-border)',
                color: copiedIdx === i ? '#10b981' : 'var(--text-secondary)',
                cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 4, fontSize: 12,
              }}>
                {copiedIdx === i ? <Check size={14} /> : <Copy size={14} />}
                {copiedIdx === i ? '已复制' : '复制'}
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

export function Base64Tool({ onAddHistory, onCopy }: ToolProps) {
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
      onAddHistory('base64', `${mode}: ${input.slice(0, 50)}`, output.slice(0, 50))
    } catch {
      setOutput('错误：编码/解码失败，请检查输入格式')
    }
  }, [input, mode, onAddHistory, output])

  const swap = () => {
    if (output) {
      setInput(output)
      setOutput('')
      setMode(mode === 'encode' ? 'decode' : 'encode')
    }
  }

  return (
    <div style={{ maxWidth: 600, margin: '0 auto' }}>
      <ToolHeader icon={<Hash size={20} style={{ color: '#38bdf8' }} />} title="Base64 编解码" subtitle="浏览器本地 Base64 编码和解码" />

      <div style={{ display: 'flex', gap: 4, marginBottom: 12 }}>
        <button onClick={() => { setMode('encode'); setOutput('') }} style={{
          flex: 1, padding: '8px 12px', borderRadius: 8,
          background: mode === 'encode' ? 'var(--accent-bg)' : 'var(--glass-bg)',
          border: mode === 'encode' ? '1px solid var(--accent)' : '1px solid var(--window-border)',
          color: mode === 'encode' ? 'var(--accent)' : 'var(--text-secondary)',
          cursor: 'pointer', fontSize: 13,
        }}>编码</button>
        <button onClick={() => { setMode('decode'); setOutput('') }} style={{
          flex: 1, padding: '8px 12px', borderRadius: 8,
          background: mode === 'decode' ? 'var(--accent-bg)' : 'var(--glass-bg)',
          border: mode === 'decode' ? '1px solid var(--accent)' : '1px solid var(--window-border)',
          color: mode === 'decode' ? 'var(--accent)' : 'var(--text-secondary)',
          cursor: 'pointer', fontSize: 13,
        }}>解码</button>
      </div>

      <div style={{ marginBottom: 12 }}>
        <label style={labelStyle}>{mode === 'encode' ? '原始文本' : 'Base64 字符串'}</label>
        <textarea value={input} onChange={(e) => setInput(e.target.value)}
          placeholder={mode === 'encode' ? '输入要编码的文本...' : '输入要解码的 Base64 字符串...'}
          style={{ ...inputStyle, minHeight: 100, fontFamily: 'monospace', resize: 'vertical' }}
        />
      </div>

      <div style={{ display: 'flex', gap: 10, marginBottom: 12 }}>
        <button onClick={process} disabled={!input} style={{
          ...primaryBtnStyle, flex: 1,
          opacity: !input ? 0.5 : 1,
          cursor: !input ? 'not-allowed' : 'pointer',
        }}>
          {mode === 'encode' ? '编码' : '解码'}
        </button>
        <button onClick={swap} disabled={!output} style={{
          ...ghostBtnStyle,
          opacity: !output ? 0.5 : 1,
          cursor: !output ? 'not-allowed' : 'pointer',
        }}>
          ⇄ 反向
        </button>
      </div>

      {output && (
        <div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
            <label style={labelStyle}>结果</label>
            <button onClick={() => onCopy(output, '已复制')} style={ghostBtnStyle}>
              <Copy size={14} /> 复制
            </button>
          </div>
          <textarea readOnly value={output}
            style={{ ...inputStyle, minHeight: 80, fontFamily: 'monospace', resize: 'vertical' }}
          />
        </div>
      )}
    </div>
  )
}

export function TimestampTool({ onAddHistory, onCopy }: ToolProps) {
  const [tsInput, setTsInput] = useState('')
  const [dateInput, setDateInput] = useState('')
  const [tsResult, setTsResult] = useState('')
  const [dateResult, setDateResult] = useState('')

  const now = new Date()
  const nowTs = Math.floor(now.getTime() / 1000)

  const tsToDate = useCallback(() => {
    const ts = Number(tsInput)
    if (isNaN(ts)) { setDateResult('无效时间戳'); return }
    const d = new Date(ts * (ts > 1e11 ? 1 : 1000))
    setDateResult(d.toLocaleString('zh-CN'))
    onAddHistory('timestamp', `时间戳: ${tsInput}`, d.toLocaleString('zh-CN'))
  }, [tsInput, onAddHistory])

  const dateToTs = useCallback(() => {
    if (!dateInput) { setTsResult('请输入日期'); return }
    const d = new Date(dateInput)
    if (isNaN(d.getTime())) { setTsResult('无效日期格式'); return }
    setTsResult(String(Math.floor(d.getTime() / 1000)))
    onAddHistory('timestamp', `日期: ${dateInput}`, String(Math.floor(d.getTime() / 1000)))
  }, [dateInput, onAddHistory])

  const getCurrentTs = () => {
    const ts = Math.floor(Date.now() / 1000)
    navigator.clipboard.writeText(String(ts))
    onCopy(String(ts), '当前时间戳已复制')
  }

  return (
    <div style={{ maxWidth: 600, margin: '0 auto' }}>
      <ToolHeader icon={<Clock size={20} style={{ color: '#e879f9' }} />} title="时间戳转换" subtitle="Unix 时间戳与日期互转" />

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: 16 }}>
        <div style={{ background: 'var(--glass-bg)', border: '1px solid var(--window-border)', borderRadius: 12, padding: 16 }}>
          <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 12, display: 'flex', alignItems: 'center', gap: 6 }}>
            <Clock size={14} /> 时间戳 → 日期
          </div>
          <input value={tsInput} onChange={(e) => setTsInput(e.target.value)} placeholder="输入 Unix 时间戳"
            style={{ ...inputStyle, marginBottom: 10 }}
          />
          <button onClick={tsToDate} style={{ ...primaryBtnStyle, width: '100%', marginBottom: 10 }}>
            转换
          </button>
          {dateResult && (
            <div style={{ padding: '10px 12px', borderRadius: 8, background: 'var(--accent-bg)', color: 'var(--accent)', fontSize: 13, fontFamily: 'monospace', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span>{dateResult}</span>
              <button onClick={() => onCopy(dateResult)} style={{ ...ghostBtnStyle, padding: '2px 8px' }}>
                <Copy size={12} />
              </button>
            </div>
          )}
        </div>

        <div style={{ background: 'var(--glass-bg)', border: '1px solid var(--window-border)', borderRadius: 12, padding: 16 }}>
          <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 12, display: 'flex', alignItems: 'center', gap: 6 }}>
            <Clock size={14} /> 日期 → 时间戳
          </div>
          <input type="datetime-local" value={dateInput} onChange={(e) => setDateInput(e.target.value)}
            style={{ ...inputStyle, marginBottom: 10 }}
          />
          <button onClick={dateToTs} style={{ ...primaryBtnStyle, width: '100%', marginBottom: 10 }}>
            转换
          </button>
          {tsResult && (
            <div style={{ padding: '10px 12px', borderRadius: 8, background: 'var(--accent-bg)', color: 'var(--accent)', fontSize: 13, fontFamily: 'monospace', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span>{tsResult}</span>
              <button onClick={() => onCopy(tsResult)} style={{ ...ghostBtnStyle, padding: '2px 8px' }}>
                <Copy size={12} />
              </button>
            </div>
          )}
        </div>
      </div>

      <div style={{ marginTop: 16, padding: 14, background: 'linear-gradient(135deg, rgba(232, 121, 249, 0.1), rgba(139, 92, 246, 0.1))', border: '1px solid var(--window-border)', borderRadius: 12, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <div style={{ fontSize: 11, color: 'var(--text-secondary)', marginBottom: 4 }}>当前时间戳</div>
          <div style={{ fontSize: 20, fontWeight: 700, fontFamily: 'monospace' }}>{nowTs}</div>
        </div>
        <button onClick={getCurrentTs} style={primaryBtnStyle}>
          <Copy size={14} /> 复制
        </button>
      </div>
    </div>
  )
}

export function JSONTool({ onAddHistory, onCopy }: ToolProps) {
  const [input, setInput] = useState('')
  const [output, setOutput] = useState('')
  const [error, setError] = useState('')

  const format = useCallback(() => {
    try {
      const parsed = JSON.parse(input)
      const formatted = JSON.stringify(parsed, null, 2)
      setOutput(formatted)
      setError('')
      onAddHistory('json', input.slice(0, 50), '格式化成功')
    } catch (e: any) {
      setError(e.message)
      setOutput('')
    }
  }, [input, onAddHistory])

  const minify = useCallback(() => {
    try {
      const parsed = JSON.parse(input)
      const minified = JSON.stringify(parsed)
      setOutput(minified)
      setError('')
      onAddHistory('json', input.slice(0, 50), '压缩成功')
    } catch (e: any) {
      setError(e.message)
      setOutput('')
    }
  }, [input, onAddHistory])

  const escape = useCallback(() => {
    try {
      const escaped = input.replace(/\\/g, '\\\\').replace(/"/g, '\\"').replace(/\n/g, '\\n')
      setOutput(escaped)
      setError('')
    } catch (e: any) {
      setError(e.message)
    }
  }, [input])

  const unescape = useCallback(() => {
    try {
      const unescaped = input.replace(/\\n/g, '\n').replace(/\\"/g, '"').replace(/\\\\/g, '\\')
      setOutput(unescaped)
      setError('')
    } catch (e: any) {
      setError(e.message)
    }
  }, [input])

  const validate = useCallback(() => {
    try {
      JSON.parse(input)
      setOutput('✅ JSON 格式正确')
      setError('')
    } catch (e: any) {
      setError('❌ JSON 格式错误: ' + e.message)
      setOutput('')
    }
  }, [input])

  return (
    <div style={{ maxWidth: 700, margin: '0 auto' }}>
      <ToolHeader icon={<Braces size={20} style={{ color: '#facc15' }} />} title="JSON 格式化" subtitle="格式化、压缩、转义、验证 JSON" />

      <div style={{ display: 'flex', gap: 8, marginBottom: 12, flexWrap: 'wrap' }}>
        <button onClick={format} disabled={!input} style={{ ...primaryBtnStyle, opacity: !input ? 0.5 : 1 }}>
          <Braces size={14} /> 格式化
        </button>
        <button onClick={minify} disabled={!input} style={{ ...ghostBtnStyle, opacity: !input ? 0.5 : 1 }}>
          压缩
        </button>
        <button onClick={escape} disabled={!input} style={{ ...ghostBtnStyle, opacity: !input ? 0.5 : 1 }}>
          转义
        </button>
        <button onClick={unescape} disabled={!input} style={{ ...ghostBtnStyle, opacity: !input ? 0.5 : 1 }}>
          去转义
        </button>
        <button onClick={validate} disabled={!input} style={{ ...ghostBtnStyle, opacity: !input ? 0.5 : 1 }}>
          验证
        </button>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
        <div>
          <label style={labelStyle}>输入</label>
          <textarea value={input} onChange={(e) => setInput(e.target.value)}
            placeholder='在此粘贴 JSON...'
            style={{ ...inputStyle, minHeight: 200, fontFamily: 'monospace', fontSize: 12, resize: 'vertical' }}
          />
        </div>
        <div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
            <label style={labelStyle}>输出</label>
            {output && (
              <button onClick={() => onCopy(output, '已复制')} style={ghostBtnStyle}>
                <Copy size={12} /> 复制
              </button>
            )}
          </div>
          <textarea readOnly value={error || output}
            style={{
              ...inputStyle, minHeight: 200, fontFamily: 'monospace', fontSize: 12,
              resize: 'vertical',
              color: error ? '#ef4444' : 'var(--text-primary)',
            }}
          />
        </div>
      </div>

      {error && (
        <div style={{ marginTop: 12, padding: '10px 14px', borderRadius: 8, background: 'rgba(239, 68, 68, 0.1)', border: '1px solid rgba(239, 68, 68, 0.3)', color: '#ef4444', fontSize: 13 }}>
          {error}
        </div>
      )}
    </div>
  )
}