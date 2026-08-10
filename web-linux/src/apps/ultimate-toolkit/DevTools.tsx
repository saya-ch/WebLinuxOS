import { useState, useCallback } from 'react'
import {
  Palette, KeyRound, Hash, Clock, Braces, Copy, Check,
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