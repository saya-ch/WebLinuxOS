import { useState, useEffect, useCallback, useMemo, memo } from 'react'

type TabKey = 'convert' | 'timezone' | 'diff' | 'countdown' | 'format' | 'batch'

const TIMEZONES: { id: string; label: string; tz: string; flag: string }[] = [
  { id: 'utc', label: 'UTC', tz: 'UTC', flag: '🌐' },
  { id: 'beijing', label: '北京时间', tz: 'Asia/Shanghai', flag: '🇨🇳' },
  { id: 'tokyo', label: '东京', tz: 'Asia/Tokyo', flag: '🇯🇵' },
  { id: 'london', label: '伦敦', tz: 'Europe/London', flag: '🇬🇧' },
  { id: 'newyork', label: '纽约', tz: 'America/New_York', flag: '🇺🇸' },
  { id: 'sydney', label: '悉尼', tz: 'Australia/Sydney', flag: '🇦🇺' },
  { id: 'paris', label: '巴黎', tz: 'Europe/Paris', flag: '🇫🇷' },
  { id: 'la', label: '洛杉矶', tz: 'America/Los_Angeles', flag: '🇺🇸' },
  { id: 'moscow', label: '莫斯科', tz: 'Europe/Moscow', flag: '🇷🇺' },
  { id: 'dubai', label: '迪拜', tz: 'Asia/Dubai', flag: '🇦🇪' },
]

const HOLIDAYS: { name: string; date: (year: number) => Date }[] = [
  { name: '元旦', date: (y) => new Date(y, 0, 1) },
  { name: '情人节', date: (y) => new Date(y, 1, 14) },
  { name: '劳动节', date: (y) => new Date(y, 4, 1) },
  { name: '儿童节', date: (y) => new Date(y, 5, 1) },
  { name: '国庆节', date: (y) => new Date(y, 9, 1) },
  { name: '圣诞节', date: (y) => new Date(y, 11, 25) },
  { name: '万圣节', date: (y) => new Date(y, 9, 31) },
  { name: '母亲节', date: (y) => {
    const d = new Date(y, 4, 1)
    d.setDate(d.getDate() + (7 - d.getDay() + 1))
    return d
  }},
  { name: '父亲节', date: (y) => {
    const d = new Date(y, 5, 1)
    d.setDate(d.getDate() + (7 - d.getDay() + 1))
    return d
  }},
  { name: '感恩节', date: (y) => {
    const d = new Date(y, 10, 22)
    d.setDate(d.getDate() + (4 - d.getDay() + 7) % 7)
    return d
  }},
]

const FORMAT_PRESETS = [
  'YYYY-MM-DD HH:mm:ss',
  'YYYY/MM/DD HH:mm',
  'YYYY-MM-DD',
  'HH:mm:ss',
  'YYYY年MM月DD日',
  'YYYY-MM-DDTHH:mm:ss',
  'YYYY.MM.DD HH:mm:ss',
  'MM/DD/YYYY HH:mm:ss',
]

function pad(n: number, w = 2): string {
  return n.toString().padStart(w, '0')
}

function formatDate(date: Date, pattern: string): string {
  const map: Record<string, string> = {
    'YYYY': String(date.getFullYear()),
    'MM': pad(date.getMonth() + 1),
    'DD': pad(date.getDate()),
    'HH': pad(date.getHours()),
    'mm': pad(date.getMinutes()),
    'ss': pad(date.getSeconds()),
  }
  return pattern.replace(/YYYY|MM|DD|HH|mm|ss/g, (m) => map[m])
}

function formatInZone(date: Date, tz: string, pattern: string): string {
  try {
    const parts = new Intl.DateTimeFormat('en-US', {
      timeZone: tz,
      year: 'numeric', month: '2-digit', day: '2-digit',
      hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false,
    }).formatToParts(date)
    const mp = new Map(parts.map((p) => [p.type, p.value]))
    const y = parseInt(mp.get('year') || '0', 10)
    const mo = parseInt(mp.get('month') || '1', 10)
    const d = parseInt(mp.get('day') || '1', 10)
    const h = parseInt(mp.get('hour') || '0', 10)
    const mi = parseInt(mp.get('minute') || '0', 10)
    const s = parseInt(mp.get('second') || '0', 10)
    return formatDate(new Date(y, mo - 1, d, h, mi, s), pattern)
  } catch {
    return formatDate(date, pattern)
  }
}

function parseTimestamp(input: string, isMs: boolean): Date | null {
  const n = Number(input.trim())
  if (!input.trim() || isNaN(n)) return null
  const ms = isMs ? n : n * 1000
  const d = new Date(ms)
  return isNaN(d.getTime()) ? null : d
}

function parseDateInput(input: string): Date | null {
  const s = input.trim()
  if (!s) return null
  const d = new Date(s)
  return isNaN(d.getTime()) ? null : d
}

function diffParts(from: Date, to: Date) {
  let ms = to.getTime() - from.getTime()
  const sign = ms < 0 ? -1 : 1
  ms = Math.abs(ms)
  const totalSeconds = Math.floor(ms / 1000)
  const days = Math.floor(totalSeconds / 86400)
  const hours = Math.floor((totalSeconds % 86400) / 3600)
  const minutes = Math.floor((totalSeconds % 3600) / 60)
  const seconds = totalSeconds % 60
  const totalYears = to.getFullYear() - from.getFullYear()
  const totalMonths = totalYears * 12 + (to.getMonth() - from.getMonth())
  return { sign, totalMonths, days, hours, minutes, seconds, totalMs: ms }
}

const TABS: { key: TabKey; label: string; icon: string }[] = [
  { key: 'convert', label: '时间戳互转', icon: '🔄' },
  { key: 'timezone', label: '时区转换', icon: '🌍' },
  { key: 'diff', label: '日期差值', icon: '📏' },
  { key: 'countdown', label: '节日倒数', icon: '🎊' },
  { key: 'format', label: '自定义格式', icon: '✨' },
  { key: 'batch', label: '批量转换', icon: '📦' },
]

const glass: React.CSSProperties = {
  background: 'rgba(255,255,255,0.05)',
  backdropFilter: 'blur(16px)',
  WebkitBackdropFilter: 'blur(16px)',
  border: '1px solid rgba(255,255,255,0.1)',
  borderRadius: 16,
  boxShadow: '0 8px 32px rgba(0,0,0,0.35)',
}

const inputStyle: React.CSSProperties = {
  width: '100%',
  padding: '10px 14px',
  borderRadius: 10,
  border: '1px solid rgba(255,255,255,0.12)',
  background: 'rgba(10,14,30,0.6)',
  color: '#e6e8f0',
  outline: 'none',
  fontSize: 14,
  fontFamily: 'ui-monospace, SFMono-Regular, Menlo, monospace',
  transition: 'border-color 0.2s, box-shadow 0.2s',
  boxSizing: 'border-box',
}

const btn = (active = false): React.CSSProperties => ({
  padding: '8px 14px',
  borderRadius: 10,
  border: active ? '1px solid rgba(124,108,240,0.6)' : '1px solid rgba(255,255,255,0.12)',
  background: active
    ? 'linear-gradient(135deg, rgba(124,108,240,0.35), rgba(79,70,229,0.25))'
    : 'rgba(255,255,255,0.05)',
  color: active ? '#c4b5fd' : '#cfd1dc',
  cursor: 'pointer',
  fontSize: 13,
  transition: 'all 0.2s',
  fontWeight: 500,
})

function CopyButton({ value, getValue }: { value?: string; getValue?: () => string }) {
  const [copied, setCopied] = useState(false)
  const handle = useCallback(() => {
    const v = getValue ? getValue() : value || ''
    if (!v) return
    navigator.clipboard?.writeText(v).then(() => {
      setCopied(true)
      setTimeout(() => setCopied(false), 1200)
    })
  }, [value, getValue])
  return (
    <button onClick={handle} style={{ ...btn(), padding: '4px 10px', fontSize: 12 }}>
      {copied ? '已复制 ✓' : '复制'}
    </button>
  )
}

const TimeTravel = memo(function TimeTravel() {
  const [now, setNow] = useState<Date>(new Date())
  const [tab, setTab] = useState<TabKey>('convert')

  useEffect(() => {
    const t = setInterval(() => setNow(new Date()), 1000)
    return () => clearInterval(t)
  }, [])

  const [isMs, setIsMs] = useState(true)
  const [tsInput, setTsInput] = useState<string>(() => String(Date.now()))
  const [dateInput, setDateInput] = useState<string>(() => formatDate(new Date(), 'YYYY-MM-DDTHH:mm:ss'))

  const tsResult = useMemo(() => parseTimestamp(tsInput, isMs), [tsInput, isMs])
  const dateResult = useMemo(() => parseDateInput(dateInput), [dateInput])

  const handleNowTs = useCallback(() => {
    const d = new Date()
    setTsInput(isMs ? String(d.getTime()) : String(Math.floor(d.getTime() / 1000)))
  }, [isMs])

  const handleNowDate = useCallback(() => {
    const d = new Date()
    setDateInput(formatDate(d, 'YYYY-MM-DDTHH:mm:ss'))
  }, [])

  const [tzBase, setTzBase] = useState<Date>(new Date())
  const [tzBaseStr, setTzBaseStr] = useState<string>(() => formatDate(new Date(), 'YYYY-MM-DDTHH:mm:ss'))
  useEffect(() => {
    const d = parseDateInput(tzBaseStr)
    if (d) setTzBase(d)
  }, [tzBaseStr])

  const [diffStart, setDiffStart] = useState<Date>(() => new Date(Date.now() - 86400000 * 7))
  const [diffEnd, setDiffEnd] = useState<Date>(() => new Date())
  const [diffStartStr, setDiffStartStr] = useState<string>(() => formatDate(new Date(Date.now() - 86400000 * 7), 'YYYY-MM-DDTHH:mm:ss'))
  const [diffEndStr, setDiffEndStr] = useState<string>(() => formatDate(new Date(), 'YYYY-MM-DDTHH:mm:ss'))
  useEffect(() => {
    const d = parseDateInput(diffStartStr)
    if (d) setDiffStart(d)
  }, [diffStartStr])
  useEffect(() => {
    const d = parseDateInput(diffEndStr)
    if (d) setDiffEnd(d)
  }, [diffEndStr])

  const diff = useMemo(() => diffParts(diffStart, diffEnd), [diffStart, diffEnd])

  const [fmtInput, setFmtInput] = useState<string>(() => formatDate(new Date(), 'YYYY-MM-DD HH:mm:ss'))
  const [fmtPattern, setFmtPattern] = useState<string>('YYYY-MM-DD HH:mm:ss')
  const fmtResult = useMemo(() => parseDateInput(fmtInput), [fmtInput])

  const [batchInput, setBatchInput] = useState<string>('1700000000\n1700000000000\n2024-01-01 12:00:00\n2024-06-15T08:30:00')
  const [batchIsMs, setBatchIsMs] = useState(false)
  const [batchPattern, setBatchPattern] = useState<string>('YYYY-MM-DD HH:mm:ss')

  const batchResults = useMemo(() => {
    return batchInput.split(/\r?\n/).map((line) => {
      const raw = line.trim()
      if (!raw) return { raw, ok: false, reason: '空行', output: '' }
      const asTs = parseTimestamp(raw, batchIsMs)
      if (asTs) return { raw, ok: true, output: formatDate(asTs, batchPattern) }
      const asDate = parseDateInput(raw)
      if (asDate) return { raw, ok: true, output: formatDate(asDate, batchPattern) }
      return { raw, ok: false, reason: '无法识别', output: '' }
    })
  }, [batchInput, batchIsMs, batchPattern])

  const holidaysThisYear = useMemo(() => {
    const year = now.getFullYear()
    return HOLIDAYS.map((h) => {
      let d = h.date(year)
      if (d.getTime() < new Date(year, now.getMonth(), now.getDate()).getTime()) {
        d = h.date(year + 1)
      }
      const diffMs = d.getTime() - now.getTime()
      const totalSec = Math.floor(diffMs / 1000)
      const days = Math.floor(totalSec / 86400)
      const hours = Math.floor((totalSec % 86400) / 3600)
      const minutes = Math.floor((totalSec % 3600) / 60)
      const seconds = totalSec % 60
      return { name: h.name, date: d, days, hours, minutes, seconds }
    }).sort((a, b) => a.date.getTime() - b.date.getTime())
  }, [now])

  return (
    <div style={{
      height: '100%',
      overflowY: 'auto',
      padding: 16,
      background: 'radial-gradient(circle at 20% 0%, #1a1440 0%, #0a0e1f 50%, #06080f 100%)',
      color: '#e6e8f0',
      fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", "PingFang SC", sans-serif',
    }}>
      <div style={{
        ...glass,
        padding: 14,
        marginBottom: 16,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: 16,
        flexWrap: 'wrap',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <div style={{
            width: 40, height: 40, borderRadius: 12,
            background: 'linear-gradient(135deg, #7c6cf0, #4f46e5)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: 20,
            boxShadow: '0 4px 14px rgba(124,108,240,0.45)',
          }}>⏳</div>
          <div>
            <div style={{ fontSize: 16, fontWeight: 600, letterSpacing: 0.5 }}>时间旅行 · TimeTravel</div>
            <div style={{ fontSize: 12, color: '#8a8fa0' }}>时间戳转换 · 时区 · 差值 · 倒计时</div>
          </div>
        </div>
        <div style={{
          display: 'flex', alignItems: 'center', gap: 14,
          padding: '6px 14px',
          borderRadius: 12,
          background: 'rgba(124,108,240,0.12)',
          border: '1px solid rgba(124,108,240,0.3)',
        }}>
          <div style={{ width: 8, height: 8, borderRadius: 4, background: '#7c6cf0', boxShadow: '0 0 8px #7c6cf0' }} />
          <div>
            <div style={{ fontSize: 11, color: '#a0a5b8' }}>当前时间</div>
            <div style={{ fontSize: 15, fontWeight: 600, fontFamily: 'ui-monospace, monospace', letterSpacing: 1 }}>
              {formatDate(now, 'YYYY-MM-DD HH:mm:ss')}
            </div>
          </div>
          <div style={{ fontSize: 12, color: '#8a8fa0', fontFamily: 'ui-monospace, monospace' }}>
            Unix: {Math.floor(now.getTime() / 1000)}
          </div>
        </div>
      </div>

      <div style={{
        display: 'flex', gap: 8, marginBottom: 16, flexWrap: 'wrap',
        ...glass, padding: 8,
      }}>
        {TABS.map((t) => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            style={{
              ...btn(tab === t.key),
              flex: '1 1 auto',
              minWidth: 110,
              padding: '10px 14px',
              fontSize: 13,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 6,
            }}
          >
            <span>{t.icon}</span>
            <span>{t.label}</span>
          </button>
        ))}
      </div>

      {tab === 'convert' && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: 16 }}>
          <div style={{ ...glass, padding: 20 }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
              <div style={{ fontSize: 15, fontWeight: 600 }}>时间戳 → 日期</div>
              <div style={{ display: 'flex', gap: 6 }}>
                <button onClick={() => setIsMs(false)} style={btn(!isMs)}>秒</button>
                <button onClick={() => setIsMs(true)} style={btn(isMs)}>毫秒</button>
              </div>
            </div>
            <div style={{ display: 'flex', gap: 8, marginBottom: 10 }}>
              <input
                style={{ ...inputStyle, flex: 1 }}
                value={tsInput}
                onChange={(e) => setTsInput(e.target.value)}
                placeholder={isMs ? '例如: 1700000000000' : '例如: 1700000000'}
              />
              <button onClick={handleNowTs} style={btn()}>当前</button>
            </div>
            <div style={{
              padding: 14,
              borderRadius: 12,
              background: tsResult ? 'rgba(34,197,94,0.1)' : 'rgba(239,68,68,0.08)',
              border: `1px solid ${tsResult ? 'rgba(34,197,94,0.3)' : 'rgba(239,68,68,0.3)'}`,
              minHeight: 80,
            }}>
              {tsResult ? (
                <>
                  <div style={{ fontFamily: 'ui-monospace, monospace', fontSize: 16, marginBottom: 6 }}>
                    {formatDate(tsResult, 'YYYY-MM-DD HH:mm:ss')}
                  </div>
                  <div style={{ fontSize: 12, color: '#a0a5b8', marginBottom: 8 }}>
                    ISO: {tsResult.toISOString()} · 星期{['日','一','二','三','四','五','六'][tsResult.getDay()]}
                  </div>
                  <CopyButton value={formatDate(tsResult, 'YYYY-MM-DD HH:mm:ss')} />
                </>
              ) : (
                <div style={{ color: '#fca5a5', fontSize: 13 }}>⚠ 无效的时间戳</div>
              )}
            </div>
          </div>

          <div style={{ ...glass, padding: 20 }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
              <div style={{ fontSize: 15, fontWeight: 600 }}>日期 → 时间戳</div>
              <button onClick={handleNowDate} style={btn()}>当前</button>
            </div>
            <input
              style={{ ...inputStyle, marginBottom: 10 }}
              value={dateInput}
              onChange={(e) => setDateInput(e.target.value)}
              placeholder="YYYY-MM-DDTHH:mm:ss"
            />
            <div style={{
              padding: 14,
              borderRadius: 12,
              background: dateResult ? 'rgba(124,108,240,0.1)' : 'rgba(239,68,68,0.08)',
              border: `1px solid ${dateResult ? 'rgba(124,108,240,0.3)' : 'rgba(239,68,68,0.3)'}`,
              minHeight: 80,
            }}>
              {dateResult ? (
                <>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 6, flexWrap: 'wrap' }}>
                    <span style={{ fontFamily: 'ui-monospace, monospace', fontSize: 14, color: '#c4b5fd' }}>
                      秒级: {Math.floor(dateResult.getTime() / 1000)}
                    </span>
                    <CopyButton value={String(Math.floor(dateResult.getTime() / 1000))} />
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
                    <span style={{ fontFamily: 'ui-monospace, monospace', fontSize: 14, color: '#c4b5fd' }}>
                      毫秒: {dateResult.getTime()}
                    </span>
                    <CopyButton value={String(dateResult.getTime())} />
                  </div>
                </>
              ) : (
                <div style={{ color: '#fca5a5', fontSize: 13 }}>⚠ 无法解析日期</div>
              )}
            </div>
          </div>
        </div>
      )}

      {tab === 'timezone' && (
        <div style={{ ...glass, padding: 20 }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14, flexWrap: 'wrap', gap: 10 }}>
            <div style={{ fontSize: 15, fontWeight: 600 }}>多时区转换</div>
            <div style={{ display: 'flex', gap: 8 }}>
              <input
                style={{ ...inputStyle, width: 220 }}
                value={tzBaseStr}
                onChange={(e) => setTzBaseStr(e.target.value)}
                placeholder="基准时间"
              />
              <button onClick={() => setTzBaseStr(formatDate(new Date(), 'YYYY-MM-DDTHH:mm:ss'))} style={btn()}>实时</button>
            </div>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: 10 }}>
            {TIMEZONES.map((tz) => (
              <div
                key={tz.id}
                style={{
                  padding: 14,
                  borderRadius: 12,
                  background: 'rgba(255,255,255,0.04)',
                  border: '1px solid rgba(255,255,255,0.08)',
                  transition: 'transform 0.2s',
                  cursor: 'pointer',
                }}
                onMouseEnter={(e) => (e.currentTarget.style.transform = 'translateY(-2px)')}
                onMouseLeave={(e) => (e.currentTarget.style.transform = 'translateY(0)')}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
                  <span style={{ fontSize: 18 }}>{tz.flag}</span>
                  <span style={{ fontSize: 13, fontWeight: 500, color: '#cfd1dc' }}>{tz.label}</span>
                </div>
                <div style={{ fontFamily: 'ui-monospace, monospace', fontSize: 15, color: '#c4b5fd', marginBottom: 4 }}>
                  {formatInZone(tzBase, tz.tz, 'YYYY-MM-DD')}
                </div>
                <div style={{ fontFamily: 'ui-monospace, monospace', fontSize: 18, fontWeight: 600, color: '#e6e8f0' }}>
                  {formatInZone(tzBase, tz.tz, 'HH:mm:ss')}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {tab === 'diff' && (
        <div style={{ ...glass, padding: 20 }}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: 14, marginBottom: 16 }}>
            <div>
              <div style={{ fontSize: 12, color: '#8a8fa0', marginBottom: 6 }}>开始时间</div>
              <input style={inputStyle} value={diffStartStr} onChange={(e) => setDiffStartStr(e.target.value)} />
            </div>
            <div>
              <div style={{ fontSize: 12, color: '#8a8fa0', marginBottom: 6 }}>结束时间</div>
              <input style={inputStyle} value={diffEndStr} onChange={(e) => setDiffEndStr(e.target.value)} />
            </div>
          </div>

          <div style={{
            padding: 16,
            borderRadius: 14,
            background: 'linear-gradient(135deg, rgba(124,108,240,0.12), rgba(79,70,229,0.06))',
            border: '1px solid rgba(124,108,240,0.3)',
            marginBottom: 14,
          }}>
            <div style={{ fontSize: 12, color: '#a0a5b8', marginBottom: 10 }}>
              时间差 ({diff.sign > 0 ? '结束晚于开始' : '开始晚于结束'})
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: 10 }}>
              {[
                { label: '总月数', value: diff.totalMonths, unit: '个月' },
                { label: '总天数', value: Math.floor(diff.totalMs / 86400000), unit: '天' },
                { label: '小时', value: diff.hours, unit: '小时' },
                { label: '分钟', value: diff.minutes, unit: '分钟' },
                { label: '秒', value: diff.seconds, unit: '秒' },
              ].map((item) => (
                <div key={item.label} style={{
                  padding: '12px',
                  borderRadius: 10,
                  background: 'rgba(10,14,30,0.6)',
                  border: '1px solid rgba(255,255,255,0.06)',
                  textAlign: 'center',
                }}>
                  <div style={{ fontSize: 11, color: '#8a8fa0', marginBottom: 4 }}>{item.label}</div>
                  <div style={{ fontFamily: 'ui-monospace, monospace', fontSize: 20, fontWeight: 600, color: '#c4b5fd' }}>
                    {item.value}
                    <span style={{ fontSize: 11, color: '#8a8fa0', marginLeft: 4 }}>{item.unit}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div style={{ padding: 14, borderRadius: 12, background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)' }}>
            <div style={{ fontSize: 12, color: '#8a8fa0', marginBottom: 8 }}>细分差值</div>
            <div style={{ fontFamily: 'ui-monospace, monospace', fontSize: 14, lineHeight: 1.8 }}>
              <span style={{ color: '#c4b5fd' }}>{Math.abs(diff.totalMonths)}</span> 个月
              <span style={{ color: '#c4b5fd', marginLeft: 10 }}>{diff.days}</span> 天
              <span style={{ color: '#c4b5fd', marginLeft: 10 }}>{diff.hours}</span> 小时
              <span style={{ color: '#c4b5fd', marginLeft: 10 }}>{diff.minutes}</span> 分
              <span style={{ color: '#c4b5fd', marginLeft: 10 }}>{diff.seconds}</span> 秒
            </div>
            <div style={{ marginTop: 8, fontSize: 12, color: '#8a8fa0', fontFamily: 'ui-monospace, monospace' }}>
              共计 {Math.floor(diff.totalMs / 1000).toLocaleString()} 秒 · {Math.floor(diff.totalMs / 86400000).toLocaleString()} 天
            </div>
          </div>
        </div>
      )}

      {tab === 'countdown' && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))', gap: 12 }}>
          {holidaysThisYear.map((h) => (
            <div
              key={h.name}
              style={{
                ...glass,
                padding: 16,
                background: 'linear-gradient(135deg, rgba(236,72,153,0.1), rgba(124,108,240,0.08))',
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
                <div style={{ fontSize: 15, fontWeight: 600 }}>🎊 {h.name}</div>
                <div style={{ fontSize: 11, color: '#8a8fa0' }}>
                  {formatDate(h.date, 'YYYY-MM-DD')}
                </div>
              </div>
              <div style={{
                fontSize: 32,
                fontWeight: 300,
                fontFamily: 'ui-monospace, monospace',
                background: 'linear-gradient(135deg, #f472b6, #7c6cf0)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                backgroundClip: 'text',
                lineHeight: 1.2,
              }}>
                {h.days}
                <span style={{ fontSize: 14, color: '#8a8fa0', marginLeft: 6 }}>天</span>
              </div>
              <div style={{ fontFamily: 'ui-monospace, monospace', fontSize: 13, color: '#a0a5b8', marginTop: 8 }}>
                {pad(h.hours)}:{pad(h.minutes)}:{pad(h.seconds)}
              </div>
              <div style={{ marginTop: 10, height: 4, borderRadius: 2, background: 'rgba(255,255,255,0.08)', overflow: 'hidden' }}>
                <div style={{
                  height: '100%',
                  width: `${Math.min(100, (h.days / 365) * 100)}%`,
                  background: 'linear-gradient(90deg, #ec4899, #7c6cf0)',
                  borderRadius: 2,
                  transition: 'width 0.4s',
                }} />
              </div>
            </div>
          ))}
        </div>
      )}

      {tab === 'format' && (
        <div style={{ ...glass, padding: 20 }}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 14, marginBottom: 16 }}>
            <div>
              <div style={{ fontSize: 12, color: '#8a8fa0', marginBottom: 6 }}>输入日期</div>
              <input style={inputStyle} value={fmtInput} onChange={(e) => setFmtInput(e.target.value)} />
            </div>
            <div>
              <div style={{ fontSize: 12, color: '#8a8fa0', marginBottom: 6 }}>格式模板</div>
              <input style={inputStyle} value={fmtPattern} onChange={(e) => setFmtPattern(e.target.value)} />
            </div>
          </div>

          <div style={{ marginBottom: 14 }}>
            <div style={{ fontSize: 12, color: '#8a8fa0', marginBottom: 8 }}>快速选择</div>
            <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
              {FORMAT_PRESETS.map((p) => (
                <button key={p} onClick={() => setFmtPattern(p)} style={btn(fmtPattern === p)}>
                  {p}
                </button>
              ))}
            </div>
          </div>

          <div style={{
            padding: 16,
            borderRadius: 12,
            background: fmtResult ? 'rgba(34,197,94,0.08)' : 'rgba(239,68,68,0.08)',
            border: `1px solid ${fmtResult ? 'rgba(34,197,94,0.3)' : 'rgba(239,68,68,0.3)'}`,
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
              <div style={{ fontFamily: 'ui-monospace, monospace', fontSize: 18, flex: 1 }}>
                {fmtResult ? formatDate(fmtResult, fmtPattern) : '⚠ 无法解析日期'}
              </div>
              {fmtResult && <CopyButton value={formatDate(fmtResult, fmtPattern)} />}
            </div>
            {fmtResult && (
              <div style={{ marginTop: 12, display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 8 }}>
                {['YYYY-MM-DD HH:mm:ss', 'YYYY/MM/DD', 'HH:mm:ss', 'YYYY年MM月DD日'].map((p) => (
                  <div key={p} style={{ fontSize: 12, color: '#8a8fa0' }}>
                    <div style={{ color: '#6b7280', fontFamily: 'ui-monospace, monospace', fontSize: 11 }}>{p}</div>
                    <div style={{ color: '#c4b5fd', fontFamily: 'ui-monospace, monospace' }}>{formatDate(fmtResult, p)}</div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {tab === 'batch' && (
        <div style={{ ...glass, padding: 20 }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14, flexWrap: 'wrap', gap: 10 }}>
            <div style={{ fontSize: 15, fontWeight: 600 }}>批量转换</div>
            <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>
              <div style={{ display: 'flex', gap: 4 }}>
                <button onClick={() => setBatchIsMs(false)} style={btn(!batchIsMs)}>秒</button>
                <button onClick={() => setBatchIsMs(true)} style={btn(batchIsMs)}>毫秒</button>
              </div>
              <input
                style={{ ...inputStyle, width: 220 }}
                value={batchPattern}
                onChange={(e) => setBatchPattern(e.target.value)}
                placeholder="输出格式"
              />
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: 14 }}>
            <div>
              <div style={{ fontSize: 12, color: '#8a8fa0', marginBottom: 6 }}>输入（每行一个）</div>
              <textarea
                value={batchInput}
                onChange={(e) => setBatchInput(e.target.value)}
                style={{
                  ...inputStyle,
                  height: 320,
                  resize: 'vertical',
                  lineHeight: 1.6,
                }}
                placeholder={'支持 Unix 时间戳或日期字符串，每行一个\n1700000000\n1700000000000\n2024-01-01 12:00:00'}
              />
            </div>
            <div>
              <div style={{ fontSize: 12, color: '#8a8fa0', marginBottom: 6, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span>转换结果 ({batchResults.filter(r => r.ok).length}/{batchResults.length})</span>
                <CopyButton getValue={() => batchResults.filter(r => r.ok).map(r => r.output).join('\n')} />
              </div>
              <div
                style={{
                  padding: 12,
                  borderRadius: 10,
                  background: 'rgba(10,14,30,0.6)',
                  border: '1px solid rgba(255,255,255,0.08)',
                  height: 320,
                  overflowY: 'auto',
                  fontFamily: 'ui-monospace, monospace',
                  fontSize: 13,
                  lineHeight: 1.8,
                }}
              >
                {batchResults.map((r, i) => (
                  <div
                    key={i}
                    style={{
                      padding: '4px 6px',
                      borderRadius: 6,
                      background: i % 2 === 0 ? 'rgba(255,255,255,0.02)' : 'transparent',
                      borderLeft: `3px solid ${r.ok ? 'rgba(34,197,94,0.5)' : 'rgba(239,68,68,0.5)'}`,
                    }}
                  >
                    <div style={{ color: '#6b7280', fontSize: 11 }}>{r.raw || '(空)'}</div>
                    <div style={{ color: r.ok ? '#c4b5fd' : '#fca5a5', fontSize: 13 }}>
                      {r.ok ? r.output : `⚠ ${r.reason}`}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      <div style={{
        marginTop: 16,
        padding: 12,
        borderRadius: 10,
        background: 'rgba(255,255,255,0.03)',
        border: '1px solid rgba(255,255,255,0.06)',
        fontSize: 11,
        color: '#6b7280',
        textAlign: 'center',
      }}>
        💡 支持 Unix 时间戳(秒/毫秒) · ISO 8601 · YYYY-MM-DD HH:mm:ss 等常见格式 · 实时更新
      </div>
    </div>
  )
})

export default TimeTravel
