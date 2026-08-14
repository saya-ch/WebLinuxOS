import { useState, useMemo, useCallback, useEffect } from 'react'
import {
  Calendar, Clock, Calculator, ArrowRight, ArrowLeftRight,
  Timer, Cake, Sparkles, Copy, Check, Hash, Globe,
  Briefcase, RotateCcw, Plus, X,
} from 'lucide-react'

type TabType = 'diff' | 'workday' | 'timezone' | 'age' | 'countdown' | 'unix' | 'batch'

interface DiffResult {
  years: number; months: number; days: number
  totalDays: number; totalWeeks: number; totalHours: number
  totalMinutes: number; totalSeconds: number
}

interface Anniversary { id: string; name: string; date: string; icon: string }

const CN_HOLIDAYS: Record<string, { name: string; date: string }[]> = {
  '2024': [{ name: '元旦', date: '2024-01-01' }, { name: '春节', date: '2024-02-10' }, { name: '清明节', date: '2024-04-04' }, { name: '劳动节', date: '2024-05-01' }, { name: '端午节', date: '2024-06-10' }, { name: '中秋节', date: '2024-09-17' }, { name: '国庆节', date: '2024-10-01' }],
  '2025': [{ name: '元旦', date: '2025-01-01' }, { name: '春节', date: '2025-01-29' }, { name: '清明节', date: '2025-04-04' }, { name: '劳动节', date: '2025-05-01' }, { name: '端午节', date: '2025-05-31' }, { name: '中秋节', date: '2025-10-06' }, { name: '国庆节', date: '2025-10-01' }],
  '2026': [{ name: '元旦', date: '2026-01-01' }, { name: '春节', date: '2026-02-17' }, { name: '清明节', date: '2026-04-05' }, { name: '劳动节', date: '2026-05-01' }, { name: '端午节', date: '2026-06-19' }, { name: '中秋节', date: '2026-09-25' }, { name: '国庆节', date: '2026-10-01' }],
}

const TIMEZONES = [
  { name: '北京', zone: 'Asia/Shanghai', offset: '+08:00' },
  { name: '东京', zone: 'Asia/Tokyo', offset: '+09:00' },
  { name: '伦敦', zone: 'Europe/London', offset: '+00:00' },
  { name: '纽约', zone: 'America/New_York', offset: '-05:00' },
  { name: '洛杉矶', zone: 'America/Los_Angeles', offset: '-08:00' },
  { name: '巴黎', zone: 'Europe/Paris', offset: '+01:00' },
  { name: '悉尼', zone: 'Australia/Sydney', offset: '+10:00' },
  { name: '迪拜', zone: 'Asia/Dubai', offset: '+04:00' },
  { name: '新加坡', zone: 'Asia/Singapore', offset: '+08:00' },
  { name: '香港', zone: 'Asia/Hong_Kong', offset: '+08:00' },
]

const WEEKDAYS_CN = ['周日', '周一', '周二', '周三', '周四', '周五', '周六']
const STORAGE_KEY_ANNIVERSARIES = 'datetime_anniversaries'

function isLeapYear(year: number): boolean {
  return (year % 4 === 0 && year % 100 !== 0) || year % 400 === 0
}

function calculateDiff(start: Date, end: Date): DiffResult {
  const diffMs = Math.abs(end.getTime() - start.getTime())
  const totalSeconds = Math.floor(diffMs / 1000)
  const totalMinutes = Math.floor(totalSeconds / 60)
  const totalHours = Math.floor(totalMinutes / 60)
  const totalDays = Math.floor(totalHours / 24)
  const totalWeeks = Math.floor(totalDays / 7)
  let years = end.getFullYear() - start.getFullYear()
  let months = end.getMonth() - start.getMonth()
  let days = end.getDate() - start.getDate()
  if (days < 0) { months--; const prev = new Date(end.getFullYear(), end.getMonth(), 0); days += prev.getDate() }
  if (months < 0) { years--; months += 12 }
  return { years, months, days, totalDays, totalWeeks, totalHours, totalMinutes, totalSeconds }
}

function calculateWorkdays(start: Date, end: Date) {
  const s = start < end ? start : end
  const e = start < end ? end : end
  let workdays = 0, nonWorkdays = 0
  const holidays = getHolidaysInRange(s, e)
  const cur = new Date(s)
  while (cur <= e) {
    const day = cur.getDay()
    const ds = cur.toISOString().split('T')[0]
    const isHoliday = holidays.some((h) => h.date === ds)
    if (day !== 0 && day !== 6 && !isHoliday) workdays++
    else nonWorkdays++
    cur.setDate(cur.getDate() + 1)
  }
  return { workdays, nonWorkdays }
}

function getHolidaysInRange(start: Date, end: Date): { date: string; name: string }[] {
  const result: { date: string; name: string }[] = []
  for (let y = start.getFullYear(); y <= end.getFullYear(); y++) {
    const h = CN_HOLIDAYS[String(y)] || []
    for (const hi of h) {
      const d = new Date(hi.date)
      if (d >= start && d <= end) result.push(hi)
    }
  }
  return result
}

function addWorkdays(date: Date, days: number): Date {
  const result = new Date(date)
  const step = days > 0 ? 1 : -1
  let remaining = Math.abs(days)
  while (remaining > 0) {
    result.setDate(result.getDate() + step)
    const day = result.getDay()
    if (day !== 0 && day !== 6) remaining--
  }
  return result
}

function formatDateCN(date: Date): string {
  return date.toLocaleDateString('zh-CN', { year: 'numeric', month: 'long', day: 'numeric', weekday: 'long' })
}

function formatDateTimeCN(date: Date): string {
  return date.toLocaleString('zh-CN', { year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit', second: '2-digit' })
}

function getZodiac(year: number): string {
  return ['鼠', '牛', '虎', '兔', '龙', '蛇', '马', '羊', '猴', '鸡', '狗', '猪'][(year - 4) % 12]
}

function getConstellation(month: number, day: number): string {
  const b = [{ m: 1, d: 20, n: '水瓶座' }, { m: 2, d: 19, n: '双鱼座' }, { m: 3, d: 20, n: '白羊座' }, { m: 4, d: 20, n: '金牛座' }, { m: 5, d: 21, n: '双子座' }, { m: 6, d: 21, n: '巨蟹座' }, { m: 7, d: 23, n: '狮子座' }, { m: 8, d: 23, n: '处女座' }, { m: 9, d: 23, n: '天秤座' }, { m: 10, d: 23, n: '天蝎座' }, { m: 11, d: 22, n: '射手座' }, { m: 12, d: 22, n: '摩羯座' }]
  for (let i = b.length - 1; i >= 0; i--) {
    if (month > b[i].m || (month === b[i].m && day >= b[i].d)) return b[i].n
  }
  return '摩羯座'
}

const inputStyle: React.CSSProperties = {
  width: '100%', padding: '10px 12px', background: 'rgba(0,0,0,0.3)',
  border: '1px solid rgba(255,255,255,0.1)', borderRadius: 8, color: '#fff', fontSize: 14,
}

const buttonStyle: React.CSSProperties = {
  padding: '10px 16px', background: '#f472b6', color: '#fff', border: 'none',
  borderRadius: 10, cursor: 'pointer', fontSize: 13, fontWeight: 60,
}

export default function DateTimeCalculator() {
  const [activeTab, setActiveTab] = useState<TabType>('diff')
  const [copiedValue, setCopiedValue] = useState<string | null>(null)
  const [diffStart, setDiffStart] = useState(() => { const d = new Date(); d.setFullYear(d.getFullYear() - 1); return d.toISOString().split('T')[0] })
  const [diffStartTime, setDiffStartTime] = useState('00:00')
  const [diffEnd, setDiffEnd] = useState(() => new Date().toISOString().split('T')[0])
  const [diffEndTime, setDiffEndTime] = useState('00:00')
  const [workdayStart, setWorkdayStart] = useState(() => { const d = new Date(); d.setDate(d.getDate() - 30); return d.toISOString().split('T')[0] })
  const [workdayEnd, setWorkdayEnd] = useState(() => new Date().toISOString().split('T')[0])
  const [addWorkdaysInput, setAddWorkdaysInput] = useState('10')
  const [workdayBaseDate, setWorkdayBaseDate] = useState(() => new Date().toISOString().split('T')[0])
  const [tzDate, setTzDate] = useState(() => new Date().toISOString().split('T')[0])
  const [tzTime, setTzTime] = useState(() => { const d = new Date(); return `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}` })
  const [fromTz, setFromTz] = useState('Asia/Shanghai')
  const [toTz, setToTz] = useState('America/New_York')
  const [birthDate, setBirthDate] = useState('')
  const [targetDate, setTargetDate] = useState(() => new Date().toISOString().split('T')[0])
  const [countdownDate, setCountdownDate] = useState(() => { const d = new Date(); d.setDate(d.getDate() + 30); return d.toISOString().split('T')[0] })
  const [countdownTime, setCountdownTime] = useState('00:00')
  const [countdownName, setCountdownName] = useState('新年')
  const [unixValue, setUnixValue] = useState(() => String(Math.floor(Date.now() / 1000)))
  const [now, setNow] = useState(new Date())
  const [batchStart, setBatchStart] = useState(() => new Date().toISOString().split('T')[0])
  const [batchCount, setBatchCount] = useState('10')
  const [batchInterval, setBatchInterval] = useState('day')
  const [anniversaries, setAnniversaries] = useState<Anniversary[]>(() => {
    try { const s = localStorage.getItem(STORAGE_KEY_ANNIVERSARIES); return s ? JSON.parse(s) : [] } catch { return [] }
  })
  const [newAnnName, setNewAnnName] = useState('')
  const [newAnnDate, setNewAnnDate] = useState('')

  useEffect(() => { const t = setInterval(() => setNow(new Date()), 1000); return () => clearInterval(t) }, [])
  useEffect(() => { try { localStorage.setItem(STORAGE_KEY_ANNIVERSARIES, JSON.stringify(anniversaries)) } catch {} }, [anniversaries])

  const diffResult = useMemo(() => {
    if (!diffStart || !diffEnd) return null
    const s = new Date(`${diffStart}T${diffStartTime}`)
    const e = new Date(`${diffEnd}T${diffEndTime}`)
    if (isNaN(s.getTime()) || isNaN(e.getTime())) return null
    return calculateDiff(s, e)
  }, [diffStart, diffEnd, diffStartTime, diffEndTime])

  const workdayResult = useMemo(() => {
    if (!workdayStart || !workdayEnd) return null
    const s = new Date(workdayStart), e = new Date(workdayEnd)
    if (isNaN(s.getTime()) || isNaN(e.getTime())) return null
    const { workdays, nonWorkdays } = calculateWorkdays(s, e)
    const holidays = getHolidaysInRange(s, e)
    const addR = addWorkdaysInput ? addWorkdays(new Date(workdayBaseDate), parseInt(addWorkdaysInput) || 0) : null
    return { workdays, nonWorkdays, holidays, addResult: addR }
  }, [workdayStart, workdayEnd, addWorkdaysInput, workdayBaseDate])

  const tzResult = useMemo(() => {
    if (!tzDate) return null
    try {
      const utcDate = new Date(`${tzDate}T${tzTime}:00`)
      if (isNaN(utcDate.getTime())) return null
      const fo = TIMEZONES.find((t) => t.zone === fromTz)?.offset || '+08:00'
      const to = TIMEZONES.find((t) => t.zone === toTz)?.offset || '+00:00'
      const fs = fo.startsWith('-') ? -1 : 1
      const fh = parseInt(fo.substring(1, 3)), fm = parseInt(fo.substring(4, 6))
      const ft = fs * (fh * 60 + fm)
      const ts = to.startsWith('-') ? -1 : 1
      const th = parseInt(to.substring(1, 3)), tm = parseInt(to.substring(4, 6))
      const tt = ts * (th * 60 + tm)
      const utcMs = utcDate.getTime() - ft * 60 * 1000
      const targetMs = utcMs + tt * 60 * 1000
      return { from: `${tzDate} ${tzTime} (${fo})`, to: formatDateTimeCN(new Date(targetMs)), targetTimestamp: targetMs }
    } catch { return null }
  }, [tzDate, tzTime, fromTz, toTz])

  const ageResult = useMemo(() => {
    if (!birthDate) return null
    const birth = new Date(birthDate)
    if (isNaN(birth.getTime())) return null
    const target = targetDate ? new Date(targetDate) : now
    if (birth > target) return null
    const d = calculateDiff(birth, target)
    const nb = new Date(target.getFullYear(), birth.getMonth(), birth.getDate())
    if (nb < target) nb.setFullYear(nb.getFullYear() + 1)
    const daysTo = Math.ceil((nb.getTime() - target.getTime()) / 86400000)
    return { ...d, zodiac: getZodiac(birth.getFullYear()), constellation: getConstellation(birth.getMonth() + 1, birth.getDate()), daysUntilBirthday: daysTo, nextBirthday: nb.toISOString().split('T')[0], isLeap: isLeapYear(birth.getFullYear()) }
  }, [birthDate, targetDate, now])

  const countdownResult = useMemo(() => {
    if (!countdownDate) return null
    const target = new Date(`${countdownDate}T${countdownTime || '00:00'}`)
    if (isNaN(target.getTime())) return null
    const diff = target.getTime() - now.getTime()
    if (diff <= 0) return { expired: true, target }
    const ad = Math.abs(diff)
    return { expired: false, target, days: Math.floor(ad / 86400000), hours: Math.floor((ad % 86400000) / 3600000), minutes: Math.floor((ad % 3600000) / 60000), seconds: Math.floor((ad % 60000) / 1000) }
  }, [countdownDate, countdownTime, now])

  const unixResult = useMemo(() => {
    const p = parseFloat(unixValue)
    if (isNaN(p)) return null
    const d = new Date(p > 1e12 ? p : p * 1000)
    if (isNaN(d.getTime())) return null
    return { asDate: formatDateTimeCN(d), asIso: d.toISOString(), asLocal: d.toLocaleString('zh-CN'), currentUnix: Math.floor(Date.now() / 1000), currentMs: Date.now() }
  }, [unixValue])

  const batchDates = useMemo(() => {
    if (!batchStart) return []
    const cnt = parseInt(batchCount) || 0
    if (cnt <= 0 || cnt > 100) return []
    const base = new Date(batchStart)
    if (isNaN(base.getTime())) return []
    const im: Record<string, number> = { day: 86400000, week: 604800000, month: 2592000000, year: 31536000000 }
    const step = im[batchInterval] || 86400000
    return Array.from({ length: cnt }, (_, i) => {
      const d = new Date(base.getTime() + i * step)
      return { date: d.toISOString().split('T')[0], weekday: WEEKDAYS_CN[d.getDay()], unix: Math.floor(d.getTime() / 1000) }
    })
  }, [batchStart, batchCount, batchInterval])

  const copyToClipboard = useCallback((text: string, label?: string) => {
    navigator.clipboard.writeText(text).then(() => { setCopiedValue(label || text); setTimeout(() => setCopiedValue(null), 1500) })
  }, [])

  const addAnniversary = useCallback(() => {
    if (!newAnnName || !newAnnDate) return
    setAnniversaries((p) => [{ id: Date.now().toString(), name: newAnnName, date: newAnnDate, icon: '🎉' }, ...p])
    setNewAnnName(''); setNewAnnDate('')
  }, [newAnnName, newAnnDate])

  const removeAnniversary = useCallback((id: string) => {
    setAnniversaries((p) => p.filter((a) => a.id !== id))
  }, [])

  const upcomingAnniversaries = useMemo(() => {
    const nm = now.getMonth(), nd = now.getDate()
    return anniversaries.map((a) => {
      const d = new Date(a.date)
      let next = new Date(now.getFullYear(), d.getMonth(), d.getDate())
      if (next < new Date(now.getFullYear(), nm, nd)) next.setFullYear(next.getFullYear() + 1)
      const dU = Math.ceil((next.getTime() - new Date(now.getFullYear(), nm, nd).getTime()) / 86400000)
      return { ...a, nextDate: next.toISOString().split('T')[0], daysUntil: dU }
    }).sort((a, b) => a.daysUntil - b.daysUntil)
  }, [anniversaries, now])

  const tabs: { id: TabType; label: string; icon: React.ReactNode }[] = [
    { id: 'diff', label: '日期差', icon: <Calculator size={16} /> },
    { id: 'workday', label: '工作日', icon: <Briefcase size={16} /> },
    { id: 'timezone', label: '时区', icon: <Globe size={16} /> },
    { id: 'age', label: '年龄', icon: <Cake size={16} /> },
    { id: 'countdown', label: '倒计时', icon: <Timer size={16} /> },
    { id: 'unix', label: '时间戳', icon: <Hash size={16} /> },
    { id: 'batch', label: '批量', icon: <Sparkles size={16} /> },
  ]

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', background: 'linear-gradient(135deg, #0f0f1a 0%, #1a1a2e 50%, #16213e 100%)', color: '#e4e4e7', fontFamily: "'Inter','Noto Sans SC',-apple-system,sans-serif", overflow: 'hidden' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '14px 20px', background: 'rgba(255,255,255,0.04)', borderBottom: '1px solid rgba(255,255,255,0.08)', backdropFilter: 'blur(20px)', flexShrink: 0 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <div style={{ width: 36, height: 36, borderRadius: 10, background: 'linear-gradient(135deg, #f472b6, #818cf8)', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 4px 16px rgba(244,114,182,0.4)' }}>
            <Calendar size={20} color="#fff" />
          </div>
          <div>
            <div style={{ fontSize: 16, fontWeight: 700 }}>日期时间计算器</div>
            <div style={{ fontSize: 11, color: '#71717a' }}>{now.toLocaleString('zh-CN', { hour12: false })}</div>
          </div>
        </div>
        <div style={{ padding: '6px 12px', background: 'rgba(255,255,255,0.06)', borderRadius: 8, fontSize: 12, color: '#a1a1aa' }}>
          {WEEKDAYS_CN[now.getDay()]} · {isLeapYear(now.getFullYear()) ? '闰年' : '平年'}
        </div>
      </div>
      <div style={{ display: 'flex', flexShrink: 0, padding: '0 16px', borderBottom: '1px solid rgba(255,255,255,0.06)', background: 'rgba(0,0,0,0.15)', overflowX: 'auto' }}>
        {tabs.map((t) => (
          <button key={t.id} onClick={() => setActiveTab(t.id)} style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '12px 14px', background: 'transparent', border: 'none', borderBottom: activeTab === t.id ? '2px solid #f472b6' : '2px solid transparent', color: activeTab === t.id ? '#f472b6' : '#71717a', cursor: 'pointer', fontSize: 13, fontWeight: activeTab === t.id ? 600 : 400, transition: 'all 0.2s', whiteSpace: 'nowrap' }}>
            {t.icon}<span>{t.label}</span>
          </button>
        ))}
      </div>
      <div style={{ flex: 1, overflow: 'auto', padding: 20 }}>
        {activeTab === 'diff' && (
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
            <GlassCard>
              <SectionHeader icon={<Calendar size={18} />} title="日期差值计算" />
              <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                <DateInput label="开始日期" value={diffStart} time={diffStartTime} onDateChange={setDiffStart} onTimeChange={setDiffStartTime} />
                <div style={{ display: 'flex', justifyContent: 'center' }}><ArrowRight size={24} color="#f472b6" /></div>
                <DateInput label="结束日期" value={diffEnd} time={diffEndTime} onDateChange={setDiffEnd} onTimeChange={setDiffEndTime} />
              </div>
              {diffResult && (
                <div style={{ marginTop: 20, padding: 16, background: 'rgba(244,114,182,0.1)', border: '1px solid rgba(244,114,182,0.2)', borderRadius: 12 }}>
                  <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 12, color: '#f472b6' }}>计算结果</div>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 10 }}>
                    <StatBox label="年" value={diffResult.years} color="#f472b6" />
                    <StatBox label="月" value={diffResult.months} color="#818cf8" />
                    <StatBox label="日" value={diffResult.days} color="#86efac" />
                    <StatBox label="周" value={diffResult.totalWeeks} color="#fcd34d" />
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 10, marginTop: 10 }}>
                    <StatBox label="总天数" value={diffResult.totalDays.toLocaleString()} color="#fb923c" />
                    <StatBox label="总小时" value={diffResult.totalHours.toLocaleString()} color="#38bdf8" />
                  </div>
                  <div style={{ marginTop: 10, display: 'flex', gap: 8 }}>
                    <QuickCopy label="天" value={`${diffResult.totalDays} 天`} onCopy={copyToClipboard} />
                    <QuickCopy label="小时" value={`${diffResult.totalHours} 小时`} onCopy={copyToClipboard} />
                    <QuickCopy label="分钟" value={`${diffResult.totalMinutes} 分钟`} onCopy={copyToClipboard} />
                  </div>
                </div>
              )}
            </GlassCard>
            <GlassCard>
              <SectionHeader icon={<Sparkles size={18} />} title="快捷计算 & 纪念日" />
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 10, marginBottom: 16 }}>
                <QuickBtn label="最近一周" onClick={() => { const s = new Date(); s.setDate(s.getDate() - 7); setDiffStart(s.toISOString().split('T')[0]); setDiffEnd(new Date().toISOString().split('T')[0]) }} />
                <QuickBtn label="最近一月" onClick={() => { const s = new Date(); s.setMonth(s.getMonth() - 1); setDiffStart(s.toISOString().split('T')[0]); setDiffEnd(new Date().toISOString().split('T')[0]) }} />
                <QuickBtn label="最近一年" onClick={() => { const s = new Date(); s.setFullYear(s.getFullYear() - 1); setDiffStart(s.toISOString().split('T')[0]); setDiffEnd(new Date().toISOString().split('T')[0]) }} />
                <QuickBtn label="本月至今" onClick={() => { const s = new Date(); s.setDate(1); setDiffStart(s.toISOString().split('T')[0]); setDiffEnd(new Date().toISOString().split('T')[0]) }} />
              </div>
              <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 10 }}>纪念日提醒</div>
              <div style={{ display: 'flex', gap: 8, marginBottom: 12 }}>
                <input type="text" value={newAnnName} onChange={(e) => setNewAnnName(e.target.value)} placeholder="纪念日名称" style={{ flex: 1, ...inputStyle }} />
                <input type="date" value={newAnnDate} onChange={(e) => setNewAnnDate(e.target.value)} style={inputStyle} />
                <button onClick={addAnniversary} style={{ padding: '8px 12px', background: '#f472b6', border: 'none', borderRadius: 8, color: '#fff', cursor: 'pointer' }}><Plus size={16} /></button>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6, maxHeight: 200, overflow: 'auto' }}>
                {upcomingAnniversaries.length === 0 ? (
                  <div style={{ textAlign: 'center', color: '#52525b', padding: 20 }}>暂无纪念日</div>
                ) : upcomingAnniversaries.map((a) => (
                  <div key={a.id} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: 10, background: 'rgba(255,255,255,0.04)', borderRadius: 8 }}>
                    <span style={{ fontSize: 18 }}>{a.icon}</span>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontSize: 13, fontWeight: 600 }}>{a.name}</div>
                      <div style={{ fontSize: 11, color: '#71717a' }}>{a.date} · {a.daysUntil} 天后</div>
                    </div>
                    <button onClick={() => removeAnniversary(a.id)} style={{ background: 'none', border: 'none', color: '#71717a', cursor: 'pointer', padding: 4 }}><X size={14} /></button>
                  </div>
                ))}
              </div>
            </GlassCard>
          </div>
        )}
        {activeTab === 'workday' && (
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
            <GlassCard>
              <SectionHeader icon={<Briefcase size={18} />} title="工作日计算" />
              <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                <div>
                  <label style={{ fontSize: 12, color: '#a1a1aa', display: 'block', marginBottom: 6 }}>开始日期</label>
                  <input type="date" value={workdayStart} onChange={(e) => setWorkdayStart(e.target.value)} style={inputStyle} />
                </div>
                <div>
                  <label style={{ fontSize: 12, color: '#a1a1aa', display: 'block', marginBottom: 6 }}>结束日期</label>
                  <input type="date" value={workdayEnd} onChange={(e) => setWorkdayEnd(e.target.value)} style={inputStyle} />
                </div>
              </div>
              {workdayResult && (
                <>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginTop: 16 }}>
                    <StatBox label="工作日" value={workdayResult.workdays} color="#86efac" />
                    <StatBox label="非工作日" value={workdayResult.nonWorkdays} color="#f87171" />
                  </div>
                  {workdayResult.holidays.length > 0 && (
                    <div style={{ marginTop: 16 }}>
                      <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 8, color: '#fcd34d' }}>法定节假日 ({workdayResult.holidays.length} 天)</div>
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                        {workdayResult.holidays.map((h, i) => (
                          <span key={i} style={{ padding: '4px 10px', background: 'rgba(252,211,77,0.1)', border: '1px solid rgba(252,211,77,0.2)', borderRadius: 6, fontSize: 11, color: '#fcd34d' }}>{h.name} ({h.date})</span>
                        ))}
                      </div>
                    </div>
                  )}
                </>
              )}
            </GlassCard>
            <GlassCard>
              <SectionHeader icon={<RotateCcw size={18} />} title="工作日推算" />
              <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                <div>
                  <label style={{ fontSize: 12, color: '#a1a1aa', display: 'block', marginBottom: 6 }}>基准日期</label>
                  <input type="date" value={workdayBaseDate} onChange={(e) => setWorkdayBaseDate(e.target.value)} style={inputStyle} />
                </div>
                <div>
                  <label style={{ fontSize: 12, color: '#a1a1aa', display: 'block', marginBottom: 6 }}>工作日数量</label>
                  <input type="number" value={addWorkdaysInput} onChange={(e) => setAddWorkdaysInput(e.target.value)} placeholder="10" style={inputStyle} />
                </div>
                {workdayResult?.addResult && (
                  <div style={{ padding: 16, background: 'rgba(129,140,248,0.1)', border: '1px solid rgba(129,140,248,0.2)', borderRadius: 12, textAlign: 'center' }}>
                    <div style={{ fontSize: 12, color: '#a1a1aa', marginBottom: 4 }}>{addWorkdaysInput} 个工作日后</div>
                    <div style={{ fontSize: 22, fontWeight: 700, color: '#818cf8' }}>{workdayResult.addResult.toISOString().split('T')[0]}</div>
                    <div style={{ fontSize: 12, color: '#a1a1aa', marginTop: 4 }}>{formatDateCN(workdayResult.addResult)}</div>
                  </div>
                )}
              </div>
            </GlassCard>
          </div>
        )}
        {activeTab === 'timezone' && (
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
            <GlassCard>
              <SectionHeader icon={<Globe size={18} />} title="时区转换" />
              <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                <div><label style={{ fontSize: 12, color: '#a1a1aa', display: 'block', marginBottom: 6 }}>日期</label>
                  <input type="date" value={tzDate} onChange={(e) => setTzDate(e.target.value)} style={inputStyle} /></div>
                <div><label style={{ fontSize: 12, color: '#a1a1aa', display: 'block', marginBottom: 6 }}>时间</label>
                  <input type="time" value={tzTime} onChange={(e) => setTzTime(e.target.value)} style={inputStyle} /></div>
                <div><label style={{ fontSize: 12, color: '#a1a1aa', display: 'block', marginBottom: 6 }}>源时区</label>
                  <select value={fromTz} onChange={(e) => setFromTz(e.target.value)} style={inputStyle}>
                    {TIMEZONES.map((t) => <option key={t.zone} value={t.zone}>{t.name} ({t.offset})</option>)}
                  </select></div>
                <div style={{ display: 'flex', justifyContent: 'center' }}><ArrowLeftRight size={24} color="#f472b6" /></div>
                <div><label style={{ fontSize: 12, color: '#a1a1aa', display: 'block', marginBottom: 6 }}>目标时区</label>
                  <select value={toTz} onChange={(e) => setToTz(e.target.value)} style={inputStyle}>
                    {TIMEZONES.map((t) => <option key={t.zone} value={t.zone}>{t.name} ({t.offset})</option>)}
                  </select></div>
              </div>
            </GlassCard>
            <GlassCard>
              <SectionHeader icon={<Clock size={18} />} title="转换结果" />
              {tzResult ? (
                <div>
                  <div style={{ padding: 12, background: 'rgba(0,0,0,0.3)', borderRadius: 8, borderLeft: '3px solid #818cf8', marginBottom: 10 }}>
                    <div style={{ fontSize: 10, color: '#71717a', marginBottom: 4 }}>源时间</div>
                    <div style={{ fontSize: 14, fontWeight: 600, color: '#818cf8' }}>{tzResult.from}</div>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'center', padding: '8px 0' }}><ArrowRight size={24} color="#f472b6" /></div>
                  <div style={{ padding: 12, background: 'rgba(0,0,0,0.3)', borderRadius: 8, borderLeft: '3px solid #f472b6', marginBottom: 16 }}>
                    <div style={{ fontSize: 10, color: '#71717a', marginBottom: 4 }}>目标时间</div>
                    <div style={{ fontSize: 14, fontWeight: 600, color: '#f472b6' }}>{tzResult.to}</div>
                  </div>
                  <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 10 }}>世界时钟</div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 6, maxHeight: 200, overflow: 'auto' }}>
                    {TIMEZONES.map((tz) => {
                      const s = tz.offset.startsWith('-') ? -1 : 1
                      const h = parseInt(tz.offset.substring(1, 3)), m = parseInt(tz.offset.substring(4, 6))
                      const tm = s * (h * 60 + m)
                      const utcMs = tzResult.targetTimestamp - tm * 60 * 1000
                      const d = new Date(utcMs)
                      return (
                        <div key={tz.zone} style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 10px', background: 'rgba(0,0,0,0.2)', borderRadius: 6, fontSize: 12 }}>
                          <span style={{ color: '#a1a1aa' }}>{tz.name}</span>
                          <span style={{ fontFamily: 'monospace' }}>{d.toLocaleTimeString('zh-CN', { hour12: false })}</span>
                        </div>
                      )
                    })}
                  </div>
                </div>
              ) : <div style={{ textAlign: 'center', color: '#52525b', padding: 40 }}>请选择有效日期</div>}
            </GlassCard>
          </div>
        )}
        {activeTab === 'age' && (
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
            <GlassCard>
              <SectionHeader icon={<Cake size={18} />} title="年龄计算" />
              <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                <div><label style={{ fontSize: 12, color: '#a1a1aa', display: 'block', marginBottom: 6 }}>出生日期</label>
                  <input type="date" value={birthDate} onChange={(e) => setBirthDate(e.target.value)} style={inputStyle} /></div>
                <div><label style={{ fontSize: 12, color: '#a1a1aa', display: 'block', marginBottom: 6 }}>截止日期</label>
                  <input type="date" value={targetDate} onChange={(e) => setTargetDate(e.target.value)} style={inputStyle} /></div>
              </div>
            </GlassCard>
            <GlassCard>
              <SectionHeader icon={<Sparkles size={18} />} title="个人信息" />
              {ageResult ? (
                <div>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 10, marginBottom: 16 }}>
                    <StatBox label="岁" value={ageResult.years} color="#f472b6" />
                    <StatBox label="月" value={ageResult.months} color="#818cf8" />
                    <StatBox label="天" value={ageResult.days} color="#86efac" />
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 10, marginBottom: 16 }}>
                    <div style={{ padding: 12, background: 'rgba(0,0,0,0.3)', borderRadius: 8, textAlign: 'center' }}>
                      <div style={{ fontSize: 18 }}>🐲</div>
                      <div style={{ fontSize: 10, color: '#71717a' }}>生肖</div>
                      <div style={{ fontSize: 16, fontWeight: 600, color: '#fcd34d' }}>{ageResult.zodiac}</div>
                    </div>
                    <div style={{ padding: 12, background: 'rgba(0,0,0,0.3)', borderRadius: 8, textAlign: 'center' }}>
                      <div style={{ fontSize: 18 }}>✨</div>
                      <div style={{ fontSize: 10, color: '#71717a' }}>星座</div>
                      <div style={{ fontSize: 16, fontWeight: 600, color: '#818cf8' }}>{ageResult.constellation}</div>
                    </div>
                  </div>
                  <div style={{ padding: 14, background: 'rgba(252,211,77,0.1)', border: '1px solid rgba(252,211,77,0.2)', borderRadius: 10, marginBottom: 10 }}>
                    <div style={{ fontSize: 12, color: '#a1a1aa', marginBottom: 4 }}>距下次生日</div>
                    <div style={{ fontSize: 24, fontWeight: 700, color: '#fcd34d' }}>{ageResult.daysUntilBirthday} 天</div>
                    <div style={{ fontSize: 11, color: '#71717a', marginTop: 4 }}>{ageResult.nextBirthday}</div>
                  </div>
                  <div style={{ fontSize: 11, color: '#71717a' }}>{ageResult.isLeap ? '出生于闰年' : '出生于平年'}</div>
                </div>
              ) : <div style={{ textAlign: 'center', color: '#52525b', padding: 40 }}>请输入出生日期</div>}
            </GlassCard>
          </div>
        )}
        {activeTab === 'countdown' && (
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
            <GlassCard>
              <SectionHeader icon={<Timer size={18} />} title="倒计时设置" />
              <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                <div><label style={{ fontSize: 12, color: '#a1a1aa', display: 'block', marginBottom: 6 }}>事件名称</label>
                  <input type="text" value={countdownName} onChange={(e) => setCountdownName(e.target.value)} placeholder="新年、生日、考试..." style={inputStyle} /></div>
                <div><label style={{ fontSize: 12, color: '#a1a1aa', display: 'block', marginBottom: 6 }}>目标日期</label>
                  <input type="date" value={countdownDate} onChange={(e) => setCountdownDate(e.target.value)} style={inputStyle} /></div>
                <div><label style={{ fontSize: 12, color: '#a1a1aa', display: 'block', marginBottom: 6 }}>目标时间</label>
                  <input type="time" value={countdownTime} onChange={(e) => setCountdownTime(e.target.value)} style={inputStyle} /></div>
              </div>
            </GlassCard>
            <GlassCard>
              <SectionHeader icon={<Sparkles size={18} />} title={`${countdownName} 倒计时`} />
              {countdownResult ? (
                <div style={{ textAlign: 'center' }}>
                  {countdownResult.expired ? (
                    <div>
                      <div style={{ fontSize: 20, fontWeight: 600, color: '#86efac', marginBottom: 8 }}>🎉 {countdownName}已到达！</div>
                      <div style={{ fontSize: 14, color: '#a1a1aa' }}>{formatDateTimeCN(countdownResult.target)}</div>
                    </div>
                  ) : (
                    <>
                      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 10 }}>
                        <CountdownBox value={countdownResult.days!} label="天" color="#f472b6" />
                        <CountdownBox value={countdownResult.hours!} label="时" color="#818cf8" />
                        <CountdownBox value={countdownResult.minutes!} label="分" color="#86efac" />
                        <CountdownBox value={countdownResult.seconds!} label="秒" color="#fcd34d" />
                      </div>
                      <div style={{ marginTop: 16, fontSize: 13, color: '#71717a' }}>目标：{formatDateTimeCN(countdownResult.target)}</div>
                    </>
                  )}
                </div>
              ) : <div style={{ textAlign: 'center', color: '#52525b', padding: 40 }}>请设置目标日期</div>}
            </GlassCard>
          </div>
        )}
        {activeTab === 'unix' && (
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
            <GlassCard>
              <SectionHeader icon={<Hash size={18} />} title="Unix 时间戳" />
              <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                <div><label style={{ fontSize: 12, color: '#a1a1aa', display: 'block', marginBottom: 6 }}>输入时间戳</label>
                  <input type="text" value={unixValue} onChange={(e) => setUnixValue(e.target.value)} placeholder="Unix 时间戳（秒/毫秒）" style={inputStyle} /></div>
                <div style={{ padding: 14, background: 'rgba(255,255,255,0.04)', borderRadius: 10, fontSize: 12, color: '#a1a1aa' }}>
                  <div style={{ fontWeight: 600, color: '#e4e4e7', marginBottom: 6 }}>当前时间戳</div>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span>秒：{Math.floor(Date.now() / 1000)}</span>
                    <span>毫秒：{Date.now()}</span>
                  </div>
                </div>
              </div>
            </GlassCard>
            <GlassCard>
              <SectionHeader icon={<RotateCcw size={18} />} title="转换结果" />
              {unixResult ? (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                  <ConvRow label="日期时间" value={unixResult.asDate} onCopy={copyToClipboard} />
                  <ConvRow label="ISO 格式" value={unixResult.asIso} onCopy={copyToClipboard} />
                  <ConvRow label="本地格式" value={unixResult.asLocal} onCopy={copyToClipboard} />
                  <ConvRow label="当前秒级" value={String(unixResult.currentUnix)} onCopy={copyToClipboard} />
                  <ConvRow label="当前毫秒" value={String(unixResult.currentMs)} onCopy={copyToClipboard} />
                </div>
              ) : <div style={{ textAlign: 'center', color: '#52525b', padding: 40 }}>请输入有效时间戳</div>}
            </GlassCard>
          </div>
        )}
        {activeTab === 'batch' && (
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
            <GlassCard>
              <SectionHeader icon={<Sparkles size={18} />} title="批量日期生成" />
              <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                <div><label style={{ fontSize: 12, color: '#a1a1aa', display: 'block', marginBottom: 6 }}>起始日期</label>
                  <input type="date" value={batchStart} onChange={(e) => setBatchStart(e.target.value)} style={inputStyle} /></div>
                <div><label style={{ fontSize: 12, color: '#a1a1aa', display: 'block', marginBottom: 6 }}>数量（最多100）</label>
                  <input type="number" value={batchCount} onChange={(e) => setBatchCount(e.target.value)} min="1" max="100" style={inputStyle} /></div>
                <div><label style={{ fontSize: 12, color: '#a1a1aa', display: 'block', marginBottom: 6 }}>间隔</label>
                  <select value={batchInterval} onChange={(e) => setBatchInterval(e.target.value)} style={inputStyle}>
                    <option value="day">每天</option>
                    <option value="week">每周</option>
                    <option value="month">每月</option>
                    <option value="year">每年</option>
                  </select></div>
              </div>
            </GlassCard>
            <GlassCard>
              <SectionHeader icon={<Calendar size={18} />} title="生成结果" />
              <div style={{ maxHeight: 300, overflow: 'auto' }}>
                {batchDates.length > 0 ? (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                    {batchDates.map((d, i) => (
                      <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '6px 10px', background: 'rgba(0,0,0,0.2)', borderRadius: 6, fontSize: 12 }}>
                        <span style={{ color: '#52525b', width: 30 }}>#{i + 1}</span>
                        <span style={{ color: '#e4e4e7', fontFamily: 'monospace' }}>{d.date}</span>
                        <span style={{ color: '#71717a' }}>{d.weekday}</span>
                        <button onClick={() => copyToClipboard(d.date, d.date)} style={{ marginLeft: 'auto', background: 'none', border: 'none', color: '#71717a', cursor: 'pointer' }}><Copy size={12} /></button>
                      </div>
                    ))}
                  </div>
                ) : <div style={{ textAlign: 'center', color: '#52525b', padding: 40 }}>请设置有效参数</div>}
              </div>
              {batchDates.length > 0 && (
                <button onClick={() => copyToClipboard(batchDates.map((d) => d.date).join(', '), '批量日期')} style={{ ...buttonStyle, marginTop: 12 }}><Copy size={14} /> 复制全部</button>
              )}
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

function GlassCard({ children }: { children: React.ReactNode }) {
  return <div style={{ padding: 20, background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 16, backdropFilter: 'blur(20px)', WebkitBackdropFilter: 'blur(20px)' }}>{children}</div>
}

function SectionHeader({ icon, title }: { icon: React.ReactNode; title: string }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 18, paddingBottom: 12, borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
      <div style={{ width: 32, height: 32, borderRadius: 8, background: 'linear-gradient(135deg, rgba(244,114,182,0.3), rgba(129,140,248,0.3))', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#f472b6' }}>{icon}</div>
      <span style={{ fontSize: 15, fontWeight: 600 }}>{title}</span>
    </div>
  )
}

function DateInput({ label, value, time, onDateChange, onTimeChange }: { label: string; value: string; time: string; onDateChange: (v: string) => void; onTimeChange: (v: string) => void }) {
  return (
    <div>
      <label style={{ fontSize: 12, color: '#a1a1aa', display: 'block', marginBottom: 6 }}>{label}</label>
      <div style={{ display: 'flex', gap: 8 }}>
        <input type="date" value={value} onChange={(e) => onDateChange(e.target.value)} style={{ ...inputStyle, flex: 1 }} />
        <input type="time" value={time} onChange={(e) => onTimeChange(e.target.value)} style={{ ...inputStyle, width: 120 }} />
      </div>
    </div>
  )
}

function StatBox({ label, value, color }: { label: string; value: string | number; color: string }) {
  return <div style={{ padding: 10, background: 'rgba(0,0,0,0.3)', borderRadius: 8, textAlign: 'center', border: '1px solid rgba(255,255,255,0.06)' }}>
    <div style={{ fontSize: 10, color: '#71717a', marginBottom: 4 }}>{label}</div>
    <div style={{ fontSize: 18, fontWeight: 700, color }}>{value}</div>
  </div>
}

function QuickBtn({ label, onClick }: { label: string; onClick: () => void }) {
  return <button onClick={onClick} style={{ padding: '10px 12px', background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 8, color: '#e4e4e7', cursor: 'pointer', fontSize: 12, transition: 'background 0.15s' }} onMouseEnter={(e) => (e.currentTarget.style.background = 'rgba(255,255,255,0.1)')} onMouseLeave={(e) => (e.currentTarget.style.background = 'rgba(255,255,255,0.04)')}>{label}</button>
}

function QuickCopy({ label, value, onCopy }: { label: string; value: string; onCopy: (v: string) => void }) {
  return <button onClick={() => onCopy(value)} style={{ flex: 1, padding: '6px 10px', background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 6, color: '#a1a1aa', cursor: 'pointer', fontSize: 11, display: 'flex', alignItems: 'center', gap: 4 }}><Copy size={10} /> {label}</button>
}

function CountdownBox({ value, label, color }: { value: number; label: string; color: string }) {
  return <div style={{ padding: 14, background: 'rgba(0,0,0,0.3)', borderRadius: 10 }}>
    <div style={{ fontSize: 32, fontWeight: 700, color, lineHeight: 1 }}>{String(value).padStart(2, '0')}</div>
    <div style={{ fontSize: 11, color: '#71717a', marginTop: 6 }}>{label}</div>
  </div>
}

function ConvRow({ label, value, onCopy }: { label: string; value: string; onCopy: (v: string) => void }) {
  return <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 14px', background: 'rgba(0,0,0,0.3)', borderRadius: 8, marginBottom: 8 }}>
    <span style={{ fontSize: 11, color: '#71717a', width: 70, fontWeight: 600 }}>{label}</span>
    <code style={{ flex: 1, fontFamily: 'monospace', fontSize: 13, color: '#e4e4e7', wordBreak: 'break-all' }}>{value}</code>
    <button onClick={() => onCopy(value)} style={{ padding: '4px 10px', background: 'rgba(129,140,248,0.2)', color: '#818cf8', border: 'none', borderRadius: 6, cursor: 'pointer', fontSize: 11, fontWeight: 600 }}>复制</button>
  </div>
}