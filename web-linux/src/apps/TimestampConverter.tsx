import { useState, useEffect, useCallback, useRef } from 'react'
import {
  Clock, ArrowRightLeft, Plus, Minus, Copy, Check,
  Timer, Globe, History, RefreshCw, Hash, Calendar,
} from 'lucide-react'

const COLORS = {
  bg: '#1a1a2e',
  editorBg: '#0d1117',
  text: '#e6e6e6',
  textMuted: '#8b949e',
  accent: '#7c6cf0',
  border: 'rgba(255,255,255,0.08)',
  success: '#3fb950',
  hoverBg: 'rgba(124,108,240,0.1)',
  cardBg: 'rgba(255,255,255,0.04)',
  inputBg: '#161b22',
}

type TabKey = 'convert' | 'timezone' | 'calculator' | 'relative' | 'clock'

const TABS: { key: TabKey; label: string; icon: React.ReactNode }[] = [
  { key: 'convert', label: '时间戳转换', icon: <ArrowRightLeft size={16} /> },
  { key: 'timezone', label: '时区查询', icon: <Globe size={16} /> },
  { key: 'calculator', label: '时间戳计算', icon: <Plus size={16} /> },
  { key: 'relative', label: '相对时间', icon: <History size={16} /> },
  { key: 'clock', label: '实时时钟', icon: <Clock size={16} /> },
]

const TIMEZONES: { name: string; zone: string; label: string }[] = [
  { name: '北京', zone: 'Asia/Shanghai', label: 'CST' },
  { name: '东京', zone: 'Asia/Tokyo', label: 'JST' },
  { name: '纽约', zone: 'America/New_York', label: 'EST' },
  { name: '伦敦', zone: 'Europe/London', label: 'GMT' },
  { name: '洛杉矶', zone: 'America/Los_Angeles', label: 'PST' },
  { name: '巴黎', zone: 'Europe/Paris', label: 'CET' },
  { name: '悉尼', zone: 'Australia/Sydney', label: 'AEST' },
  { name: '迪拜', zone: 'Asia/Dubai', label: 'GST' },
  { name: '新加坡', zone: 'Asia/Singapore', label: 'SGT' },
  { name: '香港', zone: 'Asia/Hong_Kong', label: 'HKT' },
  { name: '莫斯科', zone: 'Europe/Moscow', label: 'MSK' },
  { name: '孟买', zone: 'Asia/Kolkata', label: 'IST' },
]

const DATE_FORMATS = [
  { key: 'iso', label: 'ISO 8601', fn: (d: Date) => d.toISOString() },
  { key: 'rfc2822', label: 'RFC 2822', fn: (d: Date) => d.toUTCString() },
  { key: 'local', label: '本地时间', fn: (d: Date) => d.toLocaleString('zh-CN') },
  { key: 'date-only', label: '仅日期', fn: (d: Date) => d.toLocaleDateString('zh-CN') },
  { key: 'time-only', label: '仅时间', fn: (d: Date) => d.toLocaleTimeString('zh-CN') },
  { key: 'full-cn', label: '中文完整', fn: (d: Date) => {
    const weekday = ['日', '一', '二', '三', '四', '五', '六'][d.getDay()]
    return `${d.getFullYear()}年${d.getMonth() + 1}月${d.getDate()}日 星期${weekday} ${d.getHours().toString().padStart(2, '0')}:${d.getMinutes().toString().padStart(2, '0')}:${d.getSeconds().toString().padStart(2, '0')}`
  }},
  { key: 'compact', label: '紧凑格式', fn: (d: Date) => {
    return `${d.getFullYear()}${(d.getMonth() + 1).toString().padStart(2, '0')}${d.getDate().toString().padStart(2, '0')}_${d.getHours().toString().padStart(2, '0')}${d.getMinutes().toString().padStart(2, '0')}${d.getSeconds().toString().padStart(2, '0')}`
  }},
  { key: 'unix-sec', label: 'Unix 秒', fn: (_d: Date, ts: number) => Math.floor(ts / 1000).toString() },
  { key: 'unix-ms', label: 'Unix 毫秒', fn: (_d: Date, ts: number) => ts.toString() },
]

const WEEKDAYS = ['日', '一', '二', '三', '四', '五', '六']

function formatInTimezone(date: Date, tz: string): string {
  return date.toLocaleString('zh-CN', { timeZone: tz, hour12: false })
}

function formatTimeInTimezone(date: Date, tz: string): string {
  return date.toLocaleTimeString('zh-CN', { timeZone: tz, hour12: false })
}

function getDatePartsInTimezone(date: Date, tz: string) {
  const parts = new Intl.DateTimeFormat('zh-CN', {
    timeZone: tz, year: 'numeric', month: '2-digit', day: '2-digit',
    hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false,
  }).formatToParts(date)
  const obj: Record<string, string> = {}
  parts.forEach(p => { obj[p.type] = p.value })
  return obj
}

function getRelativeTime(target: Date, now: Date): string {
  const diffMs = target.getTime() - now.getTime()
  const absDiff = Math.abs(diffMs)
  const future = diffMs > 0

  const seconds = Math.floor(absDiff / 1000)
  const minutes = Math.floor(seconds / 60)
  const hours = Math.floor(minutes / 60)
  const days = Math.floor(hours / 24)
  const weeks = Math.floor(days / 7)
  const months = Math.floor(days / 30)
  const years = Math.floor(days / 365)

  let text = ''
  if (years > 0) text = `${years}年`
  else if (months > 0) text = `${months}个月`
  else if (weeks > 0) text = `${weeks}周`
  else if (days > 0) text = `${days}天`
  else if (hours > 0) text = `${hours}小时`
  else if (minutes > 0) text = `${minutes}分钟`
  else text = `${seconds}秒`

  return future ? `${text}后` : `${text}前`
}

function detectTimestampUnit(value: number): 'ms' | 's' {
  if (value > 1e12) return 'ms'
  return 's'
}

function parseTimestampInput(input: string): { ms: number; unit: 's' | 'ms' } | null {
  const trimmed = input.trim()
  if (!trimmed) return null
  const num = Number(trimmed)
  if (isNaN(num)) return null
  if (num <= 0) return null
  const unit = detectTimestampUnit(num)
  const ms = unit === 'ms' ? num : num * 1000
  return { ms, unit }
}

function parseDateInput(input: string): Date | null {
  const trimmed = input.trim()
  if (!trimmed) return null
  const d = new Date(trimmed)
  if (isNaN(d.getTime())) return null
  return d
}

const cardStyle: React.CSSProperties = {
  background: COLORS.cardBg,
  borderRadius: '10px',
  padding: '20px',
  border: `1px solid ${COLORS.border}`,
}

const inputStyle: React.CSSProperties = {
  width: '100%',
  padding: '10px 14px',
  background: COLORS.inputBg,
  border: `1px solid ${COLORS.border}`,
  borderRadius: '8px',
  color: COLORS.text,
  fontSize: '14px',
  outline: 'none',
  fontFamily: '"SF Mono", "Fira Code", "Cascadia Code", Consolas, monospace',
  boxSizing: 'border-box',
}

const labelStyle: React.CSSProperties = {
  fontSize: '12px',
  color: COLORS.textMuted,
  marginBottom: '6px',
  display: 'block',
  fontWeight: 500,
  letterSpacing: '0.3px',
}

const btnStyle: React.CSSProperties = {
  padding: '8px 16px',
  borderRadius: '8px',
  border: 'none',
  cursor: 'pointer',
  fontSize: '13px',
  fontWeight: 500,
  display: 'inline-flex',
  alignItems: 'center',
  gap: '6px',
  transition: 'all 0.15s ease',
}

const subtleBtnStyle: React.CSSProperties = {
  ...btnStyle,
  background: 'rgba(255,255,255,0.06)',
  color: COLORS.text,
  border: `1px solid ${COLORS.border}`,
}

function CopyButton({ text, label }: { text: string; label?: string }) {
  const [copied, setCopied] = useState(false)

  const handleCopy = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(text)
      setCopied(true)
      setTimeout(() => setCopied(false), 1500)
    } catch {
      const textarea = document.createElement('textarea')
      textarea.value = text
      document.body.appendChild(textarea)
      textarea.select()
      document.execCommand('copy')
      document.body.removeChild(textarea)
      setCopied(true)
      setTimeout(() => setCopied(false), 1500)
    }
  }, [text])

  return (
    <button
      onClick={handleCopy}
      style={{
        ...subtleBtnStyle,
        padding: '4px 10px',
        fontSize: '12px',
        color: copied ? COLORS.success : COLORS.textMuted,
        background: copied ? 'rgba(63,185,80,0.1)' : 'rgba(255,255,255,0.04)',
      }}
      title={label || '复制'}
    >
      {copied ? <Check size={13} /> : <Copy size={13} />}
      {copied ? '已复制' : label || '复制'}
    </button>
  )
}

function ResultRow({ label, value, mono }: { label: string; value: string; mono?: boolean }) {
  return (
    <div style={{
      display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      padding: '8px 12px', borderRadius: '6px',
      background: 'rgba(255,255,255,0.02)',
      marginBottom: '4px',
    }}>
      <span style={{ fontSize: '12px', color: COLORS.textMuted, flexShrink: 0, marginRight: '12px' }}>{label}</span>
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', minWidth: 0 }}>
        <span style={{
          fontSize: '13px', color: COLORS.text,
          fontFamily: mono ? '"SF Mono","Fira Code",Consolas,monospace' : 'inherit',
          overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', textAlign: 'right',
        }}>
          {value}
        </span>
        <CopyButton text={value} />
      </div>
    </div>
  )
}

/* ──────── Tab: Timestamp ↔ DateTime ──────── */
function ConvertTab() {
  const [timestampInput, setTimestampInput] = useState('')
  const [dateInput, setDateInput] = useState('')
  const [detectedUnit, setDetectedUnit] = useState<'s' | 'ms' | null>(null)

  const nowTs = Math.floor(Date.now() / 1000)

  const handleTimestampChange = useCallback((val: string) => {
    setTimestampInput(val)
    const parsed = parseTimestampInput(val)
    if (parsed) {
      setDetectedUnit(parsed.unit)
      const d = new Date(parsed.ms)
      setDateInput(d.toISOString().slice(0, 19).replace('T', ' '))
    } else {
      setDetectedUnit(null)
    }
  }, [])

  const handleDateChange = useCallback((val: string) => {
    setDateInput(val)
    const d = parseDateInput(val)
    if (d) {
      const ts = Math.floor(d.getTime() / 1000)
      setTimestampInput(ts.toString())
      setDetectedUnit('s')
    }
  }, [])

  const useNow = useCallback(() => {
    const ts = Math.floor(Date.now() / 1000)
    setTimestampInput(ts.toString())
    setDetectedUnit('s')
    const d = new Date(ts * 1000)
    setDateInput(d.toISOString().slice(0, 19).replace('T', ' '))
  }, [])

  const parsed = parseTimestampInput(timestampInput)
  const dateObj = parsed ? new Date(parsed.ms) : null

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr auto 1fr', gap: '16px', alignItems: 'end' }}>
        <div>
          <label style={labelStyle}>Unix 时间戳</label>
          <div style={{ position: 'relative' }}>
            <input
              type="text"
              value={timestampInput}
              onChange={(e) => handleTimestampChange(e.target.value)}
              placeholder={`例如: ${nowTs}`}
              style={inputStyle}
            />
            {detectedUnit && (
              <span style={{
                position: 'absolute', right: '12px', top: '50%', transform: 'translateY(-50%)',
                fontSize: '11px', color: COLORS.accent, background: 'rgba(124,108,240,0.15)',
                padding: '2px 8px', borderRadius: '4px', fontWeight: 500,
              }}>
                {detectedUnit === 'ms' ? '毫秒' : '秒'}
              </span>
            )}
          </div>
        </div>

        <div style={{
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          paddingBottom: '4px',
        }}>
          <div style={{
            width: '36px', height: '36px', borderRadius: '50%',
            background: 'rgba(124,108,240,0.12)', display: 'flex',
            alignItems: 'center', justifyContent: 'center', color: COLORS.accent,
          }}>
            <ArrowRightLeft size={16} />
          </div>
        </div>

        <div>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '6px' }}>
            <label style={{ ...labelStyle, margin: 0 }}>日期时间</label>
            <button
              onClick={useNow}
              style={{
                ...subtleBtnStyle, padding: '3px 10px', fontSize: '11px',
                color: COLORS.accent,
              }}
            >
              <RefreshCw size={11} /> 使用当前时间
            </button>
          </div>
          <input
            type="text"
            value={dateInput}
            onChange={(e) => handleDateChange(e.target.value)}
            placeholder="例如: 2026-08-27 12:00:00"
            style={inputStyle}
          />
        </div>
      </div>

      {dateObj && (
        <div style={cardStyle}>
          <div style={{ fontSize: '13px', color: COLORS.textMuted, marginBottom: '12px', display: 'flex', alignItems: 'center', gap: '6px' }}>
            <Calendar size={14} /> 多格式输出
          </div>
          {DATE_FORMATS.map(f => (
            <ResultRow
              key={f.key}
              label={f.label}
              value={f.fn(dateObj, parsed!.ms)}
              mono={f.key === 'unix-sec' || f.key === 'unix-ms'}
            />
          ))}
        </div>
      )}
    </div>
  )
}

/* ──────── Tab: Timezone ──────── */
function TimezoneTab() {
  const [timestampInput, setTimestampInput] = useState('')
  const nowTs = Math.floor(Date.now() / 1000)

  const handleNow = useCallback(() => {
    setTimestampInput(nowTs.toString())
  }, [nowTs])

  useEffect(() => {
    if (!timestampInput) {
      setTimestampInput(nowTs.toString())
    }
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  const parsed = parseTimestampInput(timestampInput)
  const dateObj = parsed ? new Date(parsed.ms) : null

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      <div style={{ display: 'flex', gap: '12px', alignItems: 'end' }}>
        <div style={{ flex: 1 }}>
          <label style={labelStyle}>输入时间戳</label>
          <input
            type="text"
            value={timestampInput}
            onChange={(e) => setTimestampInput(e.target.value)}
            placeholder={`例如: ${nowTs}`}
            style={inputStyle}
          />
        </div>
        <button onClick={handleNow} style={subtleBtnStyle}>
          <Clock size={14} /> 当前时间
        </button>
      </div>

      {dateObj && (
        <div style={{
          display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
          gap: '12px',
        }}>
          {TIMEZONES.map(tz => {
            const parts = getDatePartsInTimezone(dateObj, tz.zone)
            const weekday = new Intl.DateTimeFormat('zh-CN', { timeZone: tz.zone, weekday: 'short' }).format(dateObj)
            return (
              <div key={tz.zone} style={{
                ...cardStyle, padding: '16px', position: 'relative',
                transition: 'border-color 0.15s',
              }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '10px' }}>
                  <div>
                    <span style={{ fontSize: '15px', fontWeight: 600, color: COLORS.text }}>{tz.name}</span>
                    <span style={{ fontSize: '11px', color: COLORS.textMuted, marginLeft: '8px' }}>{tz.label}</span>
                  </div>
                  <CopyButton text={`${tz.name} ${formatInTimezone(dateObj, tz.zone)}`} />
                </div>
                <div style={{
                  fontFamily: '"SF Mono","Fira Code",Consolas,monospace',
                  fontSize: '20px', fontWeight: 600, color: COLORS.accent,
                  letterSpacing: '1px', marginBottom: '4px',
                }}>
                  {parts.year}-{parts.month}-{parts.day} {parts.hour}:{parts.minute}:{parts.second}
                </div>
                <div style={{ fontSize: '12px', color: COLORS.textMuted }}>
                  {weekday} · UTC{new Intl.DateTimeFormat('en', { timeZone: tz.zone, timeZoneName: 'shortOffset' }).format(dateObj).replace(/.*GMT/, 'GMT')}
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}

/* ──────── Tab: Calculator ──────── */
function CalculatorTab() {
  const [timestampInput, setTimestampInput] = useState('')
  const [op, setOp] = useState<'add' | 'subtract'>('add')
  const [days, setDays] = useState('0')
  const [hours, setHours] = useState('0')
  const [minutes, setMinutes] = useState('0')
  const [seconds, setSeconds] = useState('0')

  const nowTs = Math.floor(Date.now() / 1000)

  const handleNow = useCallback(() => {
    setTimestampInput(nowTs.toString())
  }, [nowTs])

  const parsed = parseTimestampInput(timestampInput)
  const resultMs = (() => {
    if (!parsed) return null
    const deltaMs = (
      (parseInt(days) || 0) * 86400000 +
      (parseInt(hours) || 0) * 3600000 +
      (parseInt(minutes) || 0) * 60000 +
      (parseInt(seconds) || 0) * 1000
    )
    const finalMs = op === 'add' ? parsed.ms + deltaMs : parsed.ms - deltaMs
    if (finalMs < 0) return null
    return finalMs
  })()

  const resultDate = resultMs !== null ? new Date(resultMs) : null
  const resultTimestamp = resultMs !== null ? Math.floor(resultMs / 1000) : null

  const swap = useCallback(() => {
    if (resultTimestamp) {
      setTimestampInput(resultTimestamp.toString())
      setDays('0')
      setHours('0')
      setMinutes('0')
      setSeconds('0')
    }
  }, [resultTimestamp])

  const operationFields = [
    { label: '天', value: days, set: setDays, max: 36500 },
    { label: '小时', value: hours, set: setHours, max: 876000 },
    { label: '分钟', value: minutes, set: setMinutes, max: 52560000 },
    { label: '秒', value: seconds, set: setSeconds, max: 3153600000 },
  ]

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      <div style={{ display: 'flex', gap: '12px', alignItems: 'end' }}>
        <div style={{ flex: 1 }}>
          <label style={labelStyle}>基准时间戳</label>
          <input
            type="text"
            value={timestampInput}
            onChange={(e) => setTimestampInput(e.target.value)}
            placeholder={`例如: ${nowTs}`}
            style={inputStyle}
          />
        </div>
        <button onClick={handleNow} style={subtleBtnStyle}>
          <Clock size={14} /> 当前时间
        </button>
      </div>

      <div style={cardStyle}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '16px' }}>
          <label style={{ ...labelStyle, margin: 0 }}>运算方式</label>
          <div style={{ display: 'flex', gap: '4px', background: 'rgba(255,255,255,0.04)', borderRadius: '8px', padding: '3px' }}>
            <button
              onClick={() => setOp('add')}
              style={{
                ...btnStyle, padding: '6px 16px', fontSize: '13px',
                background: op === 'add' ? COLORS.accent : 'transparent',
                color: op === 'add' ? '#fff' : COLORS.textMuted,
                borderRadius: '6px',
              }}
            >
              <Plus size={14} /> 加
            </button>
            <button
              onClick={() => setOp('subtract')}
              style={{
                ...btnStyle, padding: '6px 16px', fontSize: '13px',
                background: op === 'subtract' ? '#da3633' : 'transparent',
                color: op === 'subtract' ? '#fff' : COLORS.textMuted,
                borderRadius: '6px',
              }}
            >
              <Minus size={14} /> 减
            </button>
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '12px' }}>
          {operationFields.map(f => (
            <div key={f.label}>
              <label style={labelStyle}>{f.label}</label>
              <input
                type="number"
                min={0}
                max={f.max}
                value={f.value}
                onChange={(e) => f.set(e.target.value)}
                style={inputStyle}
              />
            </div>
          ))}
        </div>
      </div>

      {resultDate && resultTimestamp !== null && (
        <div style={cardStyle}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px' }}>
            <span style={{ fontSize: '13px', color: COLORS.textMuted, display: 'flex', alignItems: 'center', gap: '6px' }}>
              <Hash size={14} /> 计算结果
            </span>
            <button onClick={swap} style={{ ...subtleBtnStyle, padding: '4px 10px', fontSize: '12px' }}>
              <ArrowRightLeft size={12} /> 设为基准
            </button>
          </div>
          <ResultRow label="时间戳 (秒)" value={resultTimestamp.toString()} mono />
          <ResultRow label="时间戳 (毫秒)" value={resultMs!.toString()} mono />
          <ResultRow label="ISO 8601" value={resultDate.toISOString()} />
          <ResultRow label="本地时间" value={resultDate.toLocaleString('zh-CN')} />
          <ResultRow label="中文完整" value={`${resultDate.getFullYear()}年${resultDate.getMonth() + 1}月${resultDate.getDate()}日 星期${WEEKDAYS[resultDate.getDay()]} ${resultDate.getHours().toString().padStart(2, '0')}:${resultDate.getMinutes().toString().padStart(2, '0')}:${resultDate.getSeconds().toString().padStart(2, '0')}`} />
        </div>
      )}

      {resultMs !== null && resultMs < 0 && (
        <div style={{
          ...cardStyle, borderColor: 'rgba(218,54,51,0.3)',
          background: 'rgba(218,54,51,0.05)', color: '#f85149',
          fontSize: '13px',
        }}>
          计算结果为负数（已超出有效时间范围），请减少减去的值。
        </div>
      )}
    </div>
  )
}

/* ──────── Tab: Relative Time ──────── */
function RelativeTab() {
  const [targetInput, setTargetInput] = useState('')
  const [now, setNow] = useState(() => new Date())

  useEffect(() => {
    const timer = setInterval(() => setNow(new Date()), 1000)
    return () => clearInterval(timer)
  }, [])

  const presets = [
    { label: '1分钟前', offset: -60_000 },
    { label: '1小时前', offset: -3_600_000 },
    { label: '1天前', offset: -86_400_000 },
    { label: '1周前', offset: -604_800_000 },
    { label: '1分钟后', offset: 60_000 },
    { label: '1小时后', offset: 3_600_000 },
    { label: '1天后', offset: 86_400_000 },
    { label: '1周后', offset: 604_800_000 },
  ]

  const targetDate = parseDateInput(targetInput) || parseTimestampInput(targetInput)?.ms
    ? new Date(parseTimestampInput(targetInput)?.ms ?? parseDateInput(targetInput)!.getTime())
    : null

  const quickEntries = [
    { label: '1年前', target: new Date(now.getTime() - 365 * 86400000) },
    { label: '1个月前', target: new Date(now.getTime() - 30 * 86400000) },
    { label: '1天前', target: new Date(now.getTime() - 86400000) },
    { label: '1小时前', target: new Date(now.getTime() - 3600000) },
    { label: '10分钟前', target: new Date(now.getTime() - 600000) },
    { label: '刚刚', target: new Date(now.getTime() - 30000) },
    { label: '10分钟后', target: new Date(now.getTime() + 600000) },
    { label: '1小时后', target: new Date(now.getTime() + 3600000) },
    { label: '1天后', target: new Date(now.getTime() + 86400000) },
    { label: '1个月后', target: new Date(now.getTime() + 30 * 86400000) },
    { label: '1年后', target: new Date(now.getTime() + 365 * 86400000) },
  ]

  const handlePreset = useCallback((offset: number) => {
    const target = new Date(now.getTime() + offset)
    setTargetInput(target.toISOString().slice(0, 19).replace('T', ' '))
  }, [now])

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      <div>
        <label style={labelStyle}>目标时间（日期或时间戳）</label>
        <input
          type="text"
          value={targetInput}
          onChange={(e) => setTargetInput(e.target.value)}
          placeholder="输入日期如 2026-12-31 23:59:59 或时间戳"
          style={inputStyle}
        />
      </div>

      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
        {presets.map(p => (
          <button key={p.label} onClick={() => handlePreset(p.offset)} style={{
            ...subtleBtnStyle, padding: '5px 12px', fontSize: '12px',
          }}>
            {p.label}
          </button>
        ))}
      </div>

      {targetDate && (
        <div style={cardStyle}>
          <div style={{ fontSize: '13px', color: COLORS.textMuted, marginBottom: '12px', display: 'flex', alignItems: 'center', gap: '6px' }}>
            <History size={14} /> 相对时间
          </div>
          <div style={{
            fontSize: '28px', fontWeight: 700, color: COLORS.accent,
            marginBottom: '8px', fontFamily: '"SF Mono","Fira Code",Consolas,monospace',
          }}>
            {getRelativeTime(targetDate, now)}
          </div>
          <div style={{ fontSize: '13px', color: COLORS.textMuted, marginBottom: '16px' }}>
            目标: {targetDate.toLocaleString('zh-CN')}
          </div>
          <ResultRow label="Unix 秒" value={Math.floor(targetDate.getTime() / 1000).toString()} mono />
          <ResultRow label="ISO 8601" value={targetDate.toISOString()} />
          <ResultRow label="本地时间" value={targetDate.toLocaleString('zh-CN')} />
        </div>
      )}

      <div style={cardStyle}>
        <div style={{ fontSize: '13px', color: COLORS.textMuted, marginBottom: '12px' }}>
          快速对比
        </div>
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px' }}>
            <thead>
              <tr style={{ color: COLORS.textMuted, borderBottom: `1px solid ${COLORS.border}` }}>
                <th style={{ textAlign: 'left', padding: '8px 12px', fontWeight: 500 }}>描述</th>
                <th style={{ textAlign: 'left', padding: '8px 12px', fontWeight: 500 }}>时间</th>
                <th style={{ textAlign: 'left', padding: '8px 12px', fontWeight: 500 }}>相对现在</th>
              </tr>
            </thead>
            <tbody>
              {quickEntries.map((entry, i) => (
                <tr key={i} style={{ borderBottom: `1px solid ${COLORS.border}` }}>
                  <td style={{ padding: '8px 12px', color: COLORS.text }}>{entry.label}</td>
                  <td style={{
                    padding: '8px 12px', color: COLORS.textMuted,
                    fontFamily: '"SF Mono","Fira Code",Consolas,monospace', fontSize: '12px',
                  }}>
                    {entry.target.toLocaleString('zh-CN')}
                  </td>
                  <td style={{ padding: '8px 12px', color: COLORS.accent, fontWeight: 500 }}>
                    {getRelativeTime(entry.target, now)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}

/* ──────── Tab: Live Clock ──────── */
function ClockTab() {
  const [now, setNow] = useState(new Date())
  const [showMs, setShowMs] = useState(true)
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null)

  useEffect(() => {
    intervalRef.current = setInterval(() => setNow(new Date()), showMs ? 50 : 1000)
    return () => { if (intervalRef.current) clearInterval(intervalRef.current) }
  }, [showMs])

  const tsSec = Math.floor(now.getTime() / 1000)
  const tsMs = now.getTime()
  const weekday = WEEKDAYS[now.getDay()]

  const digits = [
    { label: '年', value: now.getFullYear().toString() },
    { label: '月', value: (now.getMonth() + 1).toString().padStart(2, '0') },
    { label: '日', value: now.getDate().toString().padStart(2, '0') },
  ]

  const timeDigits = [
    { label: '时', value: now.getHours().toString().padStart(2, '0') },
    { label: '分', value: now.getMinutes().toString().padStart(2, '0') },
    { label: '秒', value: now.getSeconds().toString().padStart(2, '0') },
  ]

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px', alignItems: 'center' }}>
      <div style={{
        display: 'flex', gap: '12px', alignItems: 'baseline',
        fontFamily: '"SF Mono","Fira Code","Cascadia Code",Consolas,monospace',
      }}>
        {digits.map((d, i) => (
          <div key={i} style={{ textAlign: 'center' }}>
            <div style={{
              fontSize: '48px', fontWeight: 700, color: COLORS.text,
              background: COLORS.editorBg, padding: '12px 18px',
              borderRadius: '10px', border: `1px solid ${COLORS.border}`,
              minWidth: '90px', letterSpacing: '2px',
            }}>
              {d.value}
            </div>
            <div style={{ fontSize: '11px', color: COLORS.textMuted, marginTop: '6px' }}>{d.label}</div>
          </div>
        ))}
        <div style={{ fontSize: '48px', color: COLORS.textMuted, fontWeight: 300, padding: '0 4px' }}>.</div>
        {timeDigits.map((d, i) => (
          <div key={i} style={{ textAlign: 'center' }}>
            <div style={{
              fontSize: '48px', fontWeight: 700, color: i === 2 ? COLORS.accent : COLORS.text,
              background: COLORS.editorBg, padding: '12px 18px',
              borderRadius: '10px', border: `1px solid ${COLORS.border}`,
              minWidth: '90px', letterSpacing: '2px',
            }}>
              {d.value}
            </div>
            <div style={{ fontSize: '11px', color: COLORS.textMuted, marginTop: '6px' }}>{d.label}</div>
          </div>
        ))}
      </div>

      {showMs && (
        <div style={{
          fontFamily: '"SF Mono","Fira Code",Consolas,monospace',
          fontSize: '22px', color: COLORS.accent, letterSpacing: '3px',
          opacity: 0.8,
        }}>
          .{now.getMilliseconds().toString().padStart(3, '0')}
        </div>
      )}

      <div style={{
        fontSize: '16px', color: COLORS.textMuted,
        display: 'flex', alignItems: 'center', gap: '8px',
      }}>
        星期{weekday}
      </div>

      <div style={{
        display: 'flex', gap: '8px', background: 'rgba(255,255,255,0.04)',
        borderRadius: '8px', padding: '3px',
      }}>
        <button
          onClick={() => setShowMs(true)}
          style={{
            ...btnStyle, padding: '6px 16px', fontSize: '12px',
            background: showMs ? COLORS.accent : 'transparent',
            color: showMs ? '#fff' : COLORS.textMuted,
            borderRadius: '6px',
          }}
        >
          <Timer size={13} /> 毫秒模式
        </button>
        <button
          onClick={() => setShowMs(false)}
          style={{
            ...btnStyle, padding: '6px 16px', fontSize: '12px',
            background: !showMs ? COLORS.accent : 'transparent',
            color: !showMs ? '#fff' : COLORS.textMuted,
            borderRadius: '6px',
          }}
        >
          <Clock size={13} /> 秒模式
        </button>
      </div>

      <div style={{ width: '100%', maxWidth: '500px' }}>
        <ResultRow label="Unix 秒" value={tsSec.toString()} mono />
        <ResultRow label="Unix 毫秒" value={tsMs.toString()} mono />
        <ResultRow label="ISO 8601" value={now.toISOString()} />
        <ResultRow label="本地时间" value={now.toLocaleString('zh-CN')} />
        <ResultRow label="UTC" value={now.toUTCString()} />
      </div>

      <div style={{
        display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))',
        gap: '8px', width: '100%', maxWidth: '700px',
      }}>
        {TIMEZONES.slice(0, 6).map(tz => (
          <div key={tz.zone} style={{
            background: 'rgba(255,255,255,0.03)', borderRadius: '8px',
            padding: '10px 14px', border: `1px solid ${COLORS.border}`,
            display: 'flex', justifyContent: 'space-between', alignItems: 'center',
          }}>
            <div>
              <div style={{ fontSize: '13px', color: COLORS.text, fontWeight: 500 }}>{tz.name}</div>
              <div style={{ fontSize: '11px', color: COLORS.textMuted }}>{tz.label}</div>
            </div>
            <div style={{
              fontFamily: '"SF Mono","Fira Code",Consolas,monospace',
              fontSize: '15px', color: COLORS.accent, fontWeight: 500,
            }}>
              {formatTimeInTimezone(now, tz.zone)}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

/* ──────── Main Component ──────── */
export default function TimestampConverter() {
  const [activeTab, setActiveTab] = useState<TabKey>('convert')

  const renderTab = () => {
    switch (activeTab) {
      case 'convert': return <ConvertTab />
      case 'timezone': return <TimezoneTab />
      case 'calculator': return <CalculatorTab />
      case 'relative': return <RelativeTab />
      case 'clock': return <ClockTab />
    }
  }

  return (
    <div style={{
      height: '100%',
      display: 'flex',
      flexDirection: 'column',
      background: COLORS.bg,
      color: COLORS.text,
      fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
      overflow: 'hidden',
    }}>
      {/* Header */}
      <div style={{
        display: 'flex', alignItems: 'center', gap: '12px',
        padding: '16px 24px',
        borderBottom: `1px solid ${COLORS.border}`,
        background: COLORS.editorBg,
        flexShrink: 0,
      }}>
        <div style={{
          width: '36px', height: '36px', borderRadius: '10px',
          background: 'linear-gradient(135deg, #7c6cf0, #a78bfa)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}>
          <Timer size={20} color="#fff" />
        </div>
        <div>
          <h1 style={{ fontSize: '18px', fontWeight: 600, margin: 0, lineHeight: 1.2 }}>
            时间戳转换工具
          </h1>
          <p style={{ fontSize: '12px', color: COLORS.textMuted, margin: 0 }}>
            Unix 时间戳 · 日期时间 · 时区转换 · 时间计算
          </p>
        </div>
      </div>

      {/* Tab Bar */}
      <div style={{
        display: 'flex', gap: '0',
        padding: '0 24px',
        borderBottom: `1px solid ${COLORS.border}`,
        background: COLORS.editorBg,
        flexShrink: 0,
        overflowX: 'auto',
      }}>
        {TABS.map(tab => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            style={{
              display: 'flex', alignItems: 'center', gap: '6px',
              padding: '12px 16px',
              background: 'transparent',
              border: 'none',
              borderBottom: `2px solid ${activeTab === tab.key ? COLORS.accent : 'transparent'}`,
              color: activeTab === tab.key ? COLORS.text : COLORS.textMuted,
              fontSize: '13px',
              cursor: 'pointer',
              whiteSpace: 'nowrap',
              transition: 'all 0.15s ease',
              fontWeight: activeTab === tab.key ? 500 : 400,
            }}
          >
            {tab.icon}
            {tab.label}
          </button>
        ))}
      </div>

      {/* Content */}
      <div style={{
        flex: 1,
        padding: '24px',
        overflowY: 'auto',
      }}>
        {renderTab()}
      </div>
    </div>
  )
}
